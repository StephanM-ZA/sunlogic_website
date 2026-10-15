import {
  normaliseDivision, nextAssignee, newToken, expiryFrom, sqliteNow, OTHER, estimateValues,
  isInternalSubmission,
  formatSast,
} from './logic.mjs';
import { handleClaimGet, handleClaimPost } from './claim.mjs';
import {
  isAllowedType, uploadKey, isUploadKey, declaredSizeExceedsLimit, randomHex,
  uploadBaseUrl, MAX_UPLOAD_BYTES,
} from './uploads.mjs';
import { compose, recipients, send, ADDRESS_OF, FROM_ADDRESS, envTag } from './mailer.mjs';
import { divisionLabel } from './logic.mjs';
import {
  handleResendWebhook, recordSentMessage, reconcileUnmatched,
  claimFailureAlert, releaseFailureAlert, isFailure,
} from './webhook.mjs';

/* Any Sunlogic host over https, rather than a list.
   The list this replaces held sunlogic.co.za and www.sunlogic.co.za — correct
   while there was one site. When the environment grew to three, the contact
   forms on energy.sunlogic.co.za and electrical.sunlogic.co.za kept posting
   here and the browser blocked every one of them: no D1 row, no n8n call, no
   log, and nothing on this side to notice. The visitor saw an error; nobody
   else saw anything.

   A pattern rather than a longer list, because the longer list is the same bug
   with a later date on it — a fourth site would repeat it exactly. Scoped to
   our own registrable domain, so it grants nothing to anyone else.
   Anchored at both ends, dots escaped: 'https://evil-sunlogic.co.za' and
   'https://sunlogic.co.za.evil.com' both fail. */
const SUNLOGIC_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?sunlogic\.co\.za$/;

function corsHeaders(origin) {
  const allow = SUNLOGIC_ORIGIN.test(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/* The upload route needs one header the lead routes do not: the browser sends
   the original filename in X-File-Name, because the body is the raw file and
   there is nowhere else to put it. Allow-list, not a wildcard — a wildcard
   here would also permit whatever a future bug sends. */
function uploadCorsHeaders(origin) {
  return {
    ...corsHeaders(origin),
    'Access-Control-Allow-Headers': 'Content-Type, X-File-Name, X-Brief-Reference',
  };
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function validateContact(body) {
  return typeof body === 'object' && body !== null &&
    typeof body.name === 'string' && body.name.trim() !== '' &&
    typeof body.email === 'string' && body.email.includes('@');
}

function validateCalculator(body) {
  return typeof body === 'object' && body !== null &&
    (body.mode === 'residential' || body.mode === 'sme') &&
    typeof body.email === 'string' && body.email.includes('@');
}

async function insertLead(db, type, payload) {
  /* Division is normalised on the way in, so every consumer reads one
     vocabulary and a later rename is this column rather than four HTML
     files. The raw submitted value stays in payload_json regardless. */
  const division = normaliseDivision(payload.need, type);
  const result = await db
    .prepare('INSERT INTO leads (type, payload_json, division) VALUES (?, ?, ?)')
    .bind(type, JSON.stringify(payload), division)
    .run();
  return { leadId: result.meta.last_row_id, division };
}

/* Decide who gets this lead and record the offer, in one batch.
   ------------------------------------------------------------------
   R5. The rotation pointer is read, flipped and consumed together. Two
   submissions arriving in the same instant must not both read "last was
   craig" and both go to stephan; batching the UPDATE and the INSERT means
   the second sees the first's write.

   The offer is created 'pending_send' with no expires_at. That is R1: the
   24-hour clock does not start until the email is actually sent, because
   the relay can be retrying a down iMac for up to 48 hours and none of that
   should come out of a director's window. The sweeper only looks at
   'offered', so a pending_send offer simply waits. */
async function createOffer(env, leadId, round, forcedAssignee) {
  const token = newToken();
  let assignee = forcedAssignee;

  if (!assignee) {
    /* The database decides, not this Worker.
       ------------------------------------------------------------------
       Reading the pointer and then writing it is two steps, and two
       requests arriving together both read the same value and both write
       the same answer — verified failing on real D1, where two concurrent
       submissions both went to craig. Miniflare serialises requests, so a
       local test passes and tells you nothing.

       Flipping and returning in ONE statement makes the two updates
       serialise against each other in SQLite: whichever lands second sees
       the first one's write, so the two callers get different names. */
    const row = await env.DB.prepare(
      "UPDATE rotation SET last_offered_to = " +
      "CASE WHEN last_offered_to = 'stephan' THEN 'craig' ELSE 'stephan' END " +
      "WHERE id = 1 RETURNING last_offered_to"
    ).first();
    assignee = (row && row.last_offered_to) || 'stephan';
  } else {
    /* A forced assignee (the sweeper handing a lapsed lead to the other
       director) still moves the pointer, so alternation stays by-offer. */
    await env.DB.prepare('UPDATE rotation SET last_offered_to = ? WHERE id = 1')
      .bind(assignee).run();
  }

  await env.DB.prepare(
    "INSERT INTO offers (lead_id, assignee, round, token, state) VALUES (?, ?, ?, ?, 'pending_send')"
  ).bind(leadId, assignee, round, token).run();

  return { assignee, token };
}

/* Starts the clock. Called only after a send is confirmed — see R1 above.
   Guarded on state='pending_send' so a duplicate confirmation (the relay
   retries at least once by design) cannot extend an offer that is already
   running, or revive one that has expired. */
async function markOffered(env, token) {
  const ttl = Number(env.OFFER_TTL_MINUTES || 1440);
  const now = sqliteNow();
  await env.DB.prepare(
    "UPDATE offers SET state='offered', offered_at=?, expires_at=? " +
    "WHERE token=? AND state='pending_send'"
  ).bind(now, expiryFrom(now, ttl), token).run();
}

function claimUrl(env, token) {
  const base = env.CLAIM_BASE_URL || 'https://sunlogic-leads-relay.smarais-za.workers.dev';
  return base.replace(/\/+$/, '') + '/claim/' + token;
}

async function deliverToN8n(env, leadId, type, payload, offer, event) {
  try {
    const res = await fetch(env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Relay-Secret': env.RELAY_SECRET,
      },
      /* leadId is what lets the Sheet row be found and updated as the
         enquiry moves, rather than appended again at every step. The offer
         fields are absent on a retry that could not find one, and n8n is
         expected to cope rather than error. */
      body: JSON.stringify({
        event: event || 'offer',
        leadId,
        type,
        ...payload,
        ...(offer ? {
          division: offer.division,
          assignee: offer.assignee,
          claimUrl: claimUrl(env, offer.token),
        } : {}),
      }),
    });
    if (res.ok) {
      await env.DB.prepare(
        "UPDATE leads SET status = 'sent', last_attempt_at = datetime('now') WHERE id = ?"
      ).bind(leadId).run();
      /* Only now does the director's 24 hours begin. R1. */
      if (offer && offer.token && (!event || event === 'offer')) await markOffered(env, offer.token);
      return true;
    }
    await env.DB.prepare(
      "UPDATE leads SET attempts = attempts + 1, last_error = ?, last_attempt_at = datetime('now') WHERE id = ?"
    ).bind('n8n responded ' + res.status, leadId).run();
    return false;
  } catch (err) {
    await env.DB.prepare(
      "UPDATE leads SET attempts = attempts + 1, last_error = ?, last_attempt_at = datetime('now') WHERE id = ?"
    ).bind(String(err), leadId).run();
    return false;
  }
}

async function handleLeadRoute(request, env, ctx, type) {
  const origin = request.headers.get('Origin') || '';
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method not allowed' }, 405, origin);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid JSON' }, 400, origin);
  }

  const valid = type === 'contact' ? validateContact(body) : validateCalculator(body);
  if (!valid) {
    return jsonResponse({ ok: false, error: 'missing required fields' }, 400, origin);
  }

  const { leadId, division } = await insertLead(env.DB, type, body);

  /* Our own address: log it, do not rotate it.
     ------------------------------------------------------------------
     Partners test the form to satisfy themselves it works. The row is
     still written, so nothing is lost and the test is visible in D1, but
     no offer is created: no director is paged about an enquiry that does
     not exist, and crucially the rotation pointer is NOT consumed. That
     second part is the real reason for this. Tests arrive in bursts, and
     three test submissions in a row silently hand the next three REAL
     leads to the same director while the split looks fair.

     Logged rather than dropped in silence. A submission that vanishes
     with no trace is the failure mode this file warns about everywhere
     else; `wrangler tail` shows this one happening. */
  if (isInternalSubmission(body.email)) {
    console.log(JSON.stringify({
      event: 'internal_submission_skipped', lead_id: leadId, type, division,
      reason: 'sender is a sunlogic.co.za address; stored but not offered',
    }));

    /* Out of the queue immediately, because nothing is ever coming for it.
       ------------------------------------------------------------------
       'pending' means "a director still has to be told". For an internal
       submission nobody ever will be, by design — so leaving the row
       pending was a claim that could never come true, and it cost twice.
       retryPendingLeads rescanned these rows every five minutes forever,
       found no pending_send offer, and did nothing (attempts never even
       incremented, because notify was never reached). Worse, the daily
       digest counted them under "queued for sending": the one signal built
       to be trusted would have opened every morning with a false alarm
       that grew with every test anybody ran. A watchdog that cries wolf on
       its first appearance is one people learn to ignore, and this digest
       had not appeared once before now.

       'sent' here means this lead needs nothing further — NOT that a
       director was notified. No offer row and a NULL claimed_by are what
       distinguish it, and the sender's own address still says why.

       Set before the replies rather than after, deliberately: the retry
       machinery cannot help an internal submission whatever happens next,
       so making the row's state depend on the reply would only reintroduce
       a pending row nothing will ever clear. A failed reply still records
       itself on the lead. */
    await env.DB.prepare(
      "UPDATE leads SET status='sent', last_attempt_at=datetime('now') WHERE id=?",
    ).bind(leadId).run();
    /* Two replies, and both are wanted. The estimate is the thing a
       calculator tester actually asked for; the test confirmation is the
       thing that tells them the exclusion worked rather than the form
       failing. A contact tester only gets the second, and before it existed
       got nothing. */
    if (type === 'calculator' && typeof body.email === 'string') {
      ctx.waitUntil(sendVisitorReport(env, leadId, body));
    }
    ctx.waitUntil(sendInternalTestReply(env, leadId, body.email, division, formatSast(sqliteNow())));
    return jsonResponse({ ok: true }, 200, origin);
  }

  const { assignee, token } = await createOffer(env, leadId, 1, null);

  ctx.waitUntil(notify(env, leadId, 'offer', assignee, token, 1));

  /* The calculator also owes the visitor their estimate. This used to be a
     plain-text node inside n8n, which meant a customer-facing email depended
     on a machine in an office being switched on. It goes through the same
     Resend-first path as everything else now. Sent independently of the
     offer: a director's notification failing must not cost the visitor the
     thing they actually asked for. */
  if (type === 'calculator' && typeof body.email === 'string') {
    ctx.waitUntil(sendVisitorReport(env, leadId, body));
  }

  return jsonResponse({ ok: true }, 200, origin);
}

/* ---- The sweeper -------------------------------------------------------
   Runs on the 5-minute cron. Expiry is therefore accurate to within five
   minutes of 24 hours, which is why the expiry email never quotes a precise
   time.

   Only 'offered' rows are considered. A 'pending_send' offer is one whose
   email has not gone out yet — expiring it would penalise a director for a
   relay outage they were never told about (R1). */
async function sweepExpiredOffers(env) {
  const { results } = await env.DB.prepare(
    "SELECT id, lead_id, assignee, round FROM offers " +
    "WHERE state='offered' AND expires_at IS NOT NULL AND datetime('now') >= expires_at"
  ).all();

  for (const offer of results) {
    /* Guarded on state so two overlapping cron runs cannot both expire the
       same offer and send two notices. */
    const done = await env.DB.prepare(
      "UPDATE offers SET state='expired' WHERE id=? AND state='offered'"
    ).bind(offer.id).run();
    if (done.meta.changes !== 1) continue;

    await notify(env, offer.lead_id, 'expired', offer.assignee, null, offer.round);
    await handOnOffer(env, offer);
  }
  return results.length;
}

/* Hand a lead on, once its current offer is dead.
   ------------------------------------------------------------------------
   Factored out of the sweeper because a bounce needs precisely the same
   thing the clock running out needs: this offer is finished, somebody else
   must get a live link. The caller is responsible for having moved the offer
   to 'expired' first — and for deciding whether the departing director is
   worth emailing, which the sweeper does and a bounce does not. */
async function handOnOffer(env, offer) {
  if (offer.round === 1) {
    /* To the OTHER director specifically, not to whoever the rotation
       pointer happens to name — a lead that has already been past one
       person must not be offered back to them. */
    const next = await createOffer(env, offer.lead_id, 2, OTHER[offer.assignee]);
    await notify(env, offer.lead_id, 'offer', next.assignee, next.token, 2);
  } else {
    await reviveBothOffers(env, offer.lead_id);
  }
}

/* Round 2 expiring does not create a round 3. Both tokens come back to life
   with no expiry, both directors are told, and the first to click wins.
   Deliberately not an escalation to sales@ — that was the decision taken. */
async function reviveBothOffers(env, leadId) {
  await env.DB.prepare(
    "UPDATE offers SET state='offered', expires_at=NULL WHERE lead_id=? AND state='expired'"
  ).bind(leadId).run();
  await alertUnclaimed(env, leadId);
}

/* R2: the alert repeats, once a day, until somebody accepts.
   A single alert would mean an enquiry both directors happened to clear from
   their inbox one evening is never mentioned again — it would die quietly,
   which is the failure this whole feature exists to prevent. */
async function alertUnclaimed(env, onlyLeadId) {
  const sql =
    "SELECT lead_id, MAX(alerted_at) AS last FROM offers " +
    "WHERE state='offered' AND expires_at IS NULL " +
    (onlyLeadId ? "AND lead_id=? " : "") +
    "GROUP BY lead_id";
  const stmt = onlyLeadId ? env.DB.prepare(sql).bind(onlyLeadId) : env.DB.prepare(sql);
  const { results } = await stmt.all();

  for (const row of results) {
    if (row.last && Date.parse(row.last.replace(' ', 'T') + 'Z') > Date.now() - 86400000) continue;

    /* One email per director, each carrying THEIR OWN token.
       ------------------------------------------------------------------
       This was a single mail to both with no token, which rendered the
       Accept button as href="" — a dead link in the one message whose
       entire purpose is "both links are live, whoever clicks first gets
       it". Caught by reading a sent email in the sheet; invisible from
       the database, where the row looked completely normal. */
    const live = await env.DB.prepare(
      "SELECT assignee, token, round FROM offers WHERE lead_id=? AND state='offered'"
    ).bind(row.lead_id).all();

    for (const offer of live.results) {
      await notify(env, row.lead_id, 'unclaimed', offer.assignee, offer.token, offer.round);
    }

    await env.DB.prepare(
      "UPDATE offers SET alerted_at=datetime('now') WHERE lead_id=? AND state='offered'"
    ).bind(row.lead_id).run();
  }
  return results.length;
}

/* One way out of this Worker for every non-offer notification. Task 8
   replaces the body with the Resend call and keeps n8n as the fallback;
   until then everything goes through the existing relay. */
/* The reply to one of our own.
   ------------------------------------------------------------------
   Contact submissions have no visitor auto-reply, so before this a partner
   testing the contact form got nothing at all: the exclusion suppresses the
   director mail by design, and there was nothing else. Somebody testing
   because they do not yet trust the system reads silence as broken, which
   proves the opposite of what they set out to check.

   It says what happened and why, names the lead id so it can be looked up,
   and describes what a real enquiry would have done instead. A failure here
   is recorded on the lead like any other, but it is never escalated: this
   is a courtesy to ourselves, and it must not be able to take a submission
   path down. */
async function sendInternalTestReply(env, leadId, email, division, receivedOn) {
  const result = await send(env, {
    to: [email],
    replyTo: 'sales@sunlogic.co.za',
    subject: 'Test received, and kept out of the rotation',
    html: compose('internal_test', {
      divisionLabel: divisionLabel(division),
      leadId,
      receivedOn,
      preheader: 'Recorded as a test. No director was notified.',
      footnote: 'Sunlogic lead system &middot; sunlogic.co.za',
    }),
    leadId,
    event: 'internal_test',
  });
  /* Lower stakes than the estimate, but recorded for the same reason, and
     because an unrecorded send is what made a real delivered event arrive
     at the webhook with nothing to match it to. */
  if (result.ok) {
    await rememberMessage(env, {
      result, leadId, event: 'internal_test', to: [email],
    });
  }
  if (!result.ok) {
    await env.DB.prepare("UPDATE leads SET last_error=? WHERE id=?")
      .bind(('internal test reply failed: ' + result.why).slice(0, 400), leadId).run();
  }
  return result.ok;
}

async function sendVisitorReport(env, leadId, payload) {
  const result = await send(env, {
    to: [payload.email],
    replyTo: 'sales@sunlogic.co.za',
    subject: 'Your Sunlogic solar estimate',
    html: compose('visitor_report', {
      ...estimateValues(payload),
      preheader: 'Your Sunlogic solar estimate',
      footnote: 'Sunlogic SA &middot; sunlogic.co.za',
    }),
    leadId,
    event: 'visitor_report',
  });
  /* The customer's own estimate, traced like everything else.
     ------------------------------------------------------------------
     This was the remaining blind spot after the director side was closed:
     a prospect's estimate could be accepted by Resend and never arrive,
     and the first anyone would know is that a warm lead went cold. It is
     recorded with no assignee, so a bounce here is never mistaken for a
     dead offer and cannot reassign the lead — the failure is in reaching
     the CUSTOMER, which is a different problem with a different answer. */
  if (result.ok) {
    await rememberMessage(env, {
      result, leadId, event: 'visitor_report', to: [payload.email],
    });
  }
  if (!result.ok) {
    await env.DB.prepare(
      "UPDATE leads SET last_error=? WHERE id=?"
    ).bind(('visitor report failed: ' + result.why).slice(0, 400), leadId).run();
  }
  return result.ok;
}

/* Reads the offers table and returns the four assignment columns as they
   stand right now. Round 1 is the first offer, round 2 the reassignment;
   anything beyond that does not exist, because a second timeout revives
   both rather than creating a third. */
async function assignmentState(env, leadId) {
  const { results } = await env.DB.prepare(
    'SELECT round, assignee, state, offered_at, expires_at, accepted_at ' +
    'FROM offers WHERE lead_id=? ORDER BY round'
  ).bind(leadId).all();
  const r1 = results.find((r) => r.round === 1);
  const r2 = results.find((r) => r.round === 2);

  /* A plain-language account of where this lead went and why.
     ------------------------------------------------------------------
     The columns say who and when; this says what happened, in order, in
     one cell. It exists so a question about a lead has a factual answer
     rather than two recollections — and it is deliberately neutral about
     the reason. "Not accepted within 24 hours" is what the system knows.
     Why nobody accepted is not something a database can tell you, and
     pretending otherwise would put words in someone's mouth. */
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  const steps = [];
  for (const o of results) {
    if (o.offered_at) steps.push('Offered to ' + cap(o.assignee) + ' ' + formatSast(o.offered_at));
    if (o.state === 'accepted') steps.push('Accepted by ' + cap(o.assignee) + ' ' + formatSast(o.accepted_at));
    else if (o.state === 'expired' && o.expires_at) steps.push('Not accepted within 24 hours');
    else if (o.state === 'expired') steps.push('Closed when the other offer was accepted');
  }
  if (!results.some((o) => o.state === 'accepted') && results.some((o) => o.expires_at === null && o.state === 'offered')) {
    steps.push('Open to both — first to accept takes it');
  }

  return {
    assignedTo: r1 ? r1.assignee : '',
    acceptedAt: r1 && r1.accepted_at ? r1.accepted_at : '',
    reassignedTo: r2 ? r2.assignee : '',
    reassignedAcceptedAt: r2 && r2.accepted_at ? r2.accepted_at : '',
    history: steps.join(' → '),
  };
}

/* ---- Delivery confirmation --------------------------------------------
   Resend accepting a message is not Resend delivering it. Lead 28 is the
   proof: accepted 2026-10-15 08:01:21 UTC, handed to Resend, 2xx returned,
   director got nothing, and leads.last_error was NULL because by our own
   test the send had worked. The id we now keep is what lets Resend's webhook
   tell us otherwise. See src/webhook.mjs. */

/* Against the lead AND against the offer, because they answer different
   questions. The lead link answers "what happened to this enquiry's mail".
   The offer link is what makes a bounce actionable: handing the lead to the
   other director needs to know which offer the dead email was carrying.

   Never allowed to fail a send. The message has already gone; losing the
   row costs traceability, and refusing the send would cost the lead. Same
   ordering as the sheet row, for the same reason. */
const addressList = (to) => (Array.isArray(to) ? to.join(', ') : (to || null));

async function rememberMessage(env, { result, leadId, event, assignee, token, to }) {
  if (!result.messageId) return;
  try {
    const offer = token
      ? await env.DB.prepare('SELECT id FROM offers WHERE token=?').bind(token).first()
      : null;
    await recordSentMessage(env.DB, {
      messageId: result.messageId,
      leadId,
      offerId: offer ? offer.id : null,
      event,
      /* NULL for anything not addressed to a director — the visitor's own
         estimate, the internal test reply. handleEmailFailure keys off this:
         a row with no assignee is never treated as a dead offer, so a
         customer mistyping their address cannot reassign a lead. */
      assignee: assignee || null,
      /* What send() actually used, not what we asked for. They differ under
         MAIL_REDIRECT_TO, and the real address is the useful one. */
      recipient: addressList(result.to ?? to),
    });
  } catch (err) {
    /* Sent is better than traceable, so this never fails a send — but it says
       so rather than vanishing, because an untraceable send is how the
       original blind spot looked from the inside. */
    console.error('rememberMessage failed for ' + result.messageId + ': ' + String(err));
    return;
  }

  /* The news may already be here.
     ------------------------------------------------------------------
     Resend's webhook can arrive before this row existed — two seconds
     before, in the one production measurement we have. Such an event
     verified correctly, matched nothing and escalated to nobody, which on a
     director notification is lead 28 over again. So having just created the
     row, look for anything that was waiting for it.
     Same claim discipline as the live webhook path: claimed in the database
     so one bounce escalates once, and handed back if the escalation throws,
     or the retry would find the status already applied and stay silent. */
  try {
    const replayed = await reconcileUnmatched(env.DB, result.messageId);
    if (replayed && isFailure(replayed.status)) {
      if (await claimFailureAlert(env.DB, result.messageId)) {
        try {
          await handleEmailFailure(env, replayed.row, replayed.status, replayed.detail);
        } catch (err) {
          await releaseFailureAlert(env.DB, result.messageId);
          throw err;
        }
      }
    }
  } catch (err) {
    console.error('replaying early events for ' + result.messageId + ' failed: ' + String(err));
  }
}

/* A bounce or a complaint, after the fact.
   ------------------------------------------------------------------------
   Called by the webhook once per message, claimed in the database so it
   cannot alert twice. Two things have to happen and the order matters: the
   lead carries the record whatever else goes wrong, and only then does
   anyone get told. */
async function handleEmailFailure(env, row, status, detail) {
  const note = ('email ' + status + ' — ' + (row.event || 'notification') +
    ' to ' + (row.recipient || 'unknown') + (detail ? ': ' + detail : '')).slice(0, 400);

  if (row.lead_id) {
    await env.DB.prepare(
      "UPDATE leads SET last_error=?, last_attempt_at=datetime('now') WHERE id=?",
    ).bind(note, row.lead_id).run();
  }

  /* Only a director's mail is escalated. A visitor's estimate bouncing is a
     wrong address they typed: worth recording against the lead, and not
     something to wake a director over. */
  if (!row.assignee || !row.lead_id) return false;

  const offer = row.offer_id
    ? await env.DB.prepare(
      "SELECT id, lead_id, assignee, round, state FROM offers " +
      "WHERE id=? AND state IN ('offered','pending_send')",
    ).bind(row.offer_id).first()
    : null;

  if (offer) {
    /* The serious case: a bounced OFFER. That director's 24 hours are
       already running and they were never told anything, so the clock is
       counting down on silence — exactly the shape of failure this whole
       feature exists to prevent.
       So do not wait for it. Expire the offer now and hand the lead on the
       way the sweeper would have in 24 hours' time; the only difference is
       that we KNOW the wait would be pointless.
       Deliberately no 'expired' email to them: the address it would go to
       is the one that just bounced. */
    const done = await env.DB.prepare(
      "UPDATE offers SET state='expired' WHERE id=? AND state IN ('offered','pending_send')",
    ).bind(offer.id).run();
    if (done.meta.changes !== 1) return false;
    await handOnOffer(env, offer);
    return true;
  }

  /* No live offer, so there is no 24-hour clock to rescue. If the lead is
     one of the revived ones, alertUnclaimed already knows how to find the
     live tokens and mail each director their own — reuse it rather than
     inventing a second way to say the same thing.
     If the lead is accepted, this is lead 28's own case and there is
     deliberately no new email: the owner saw the full details on the claim
     page when they accepted (see claim.mjs), and the other director has
     nothing to act on. The record above and the digest's delivery notice
     are what carry it. */
  await alertUnclaimed(env, row.lead_id);
  return true;
}

async function notify(env, leadId, event, assignee, token, round) {
  const lead = await env.DB.prepare('SELECT type, payload_json, division, created_at FROM leads WHERE id=?')
    .bind(leadId).first();
  if (!lead) return false;
  const payload = JSON.parse(lead.payload_json);
  const label = divisionLabel(lead.division);

  const SUBJECTS = {
    offer: 'New ' + label + ' enquiry — accept to take it',
    accepted: label + ' enquiry — the details',
    expired: label + ' enquiry — 24 hours passed, reassigned',
    unclaimed: label + ' enquiry still unclaimed',
  };

  /* The teaser deliberately receives ONLY these. Passing the whole payload
     and trusting the template not to print it would make the leak one typo
     away; an offer template cannot render a name it was never given. */
  const safe = {
    divisionLabel: label,
    receivedOn: formatSast(lead.created_at),
    claimUrl: token ? claimUrl(env, token) : '',
    preheader: SUBJECTS[event] || 'Sunlogic',
    footnote: 'Sunlogic lead system &middot; sunlogic.co.za',
  };

  const values = event === 'accepted'
    ? { ...safe, ...payload, property_type: payload['property-type'] || '', need: payload.need || label }
    : safe;

  const result = await send(env, {
    to: recipients(env, assignee),
    replyTo: assignee === 'both' ? undefined : ADDRESS_OF[assignee],
    subject: SUBJECTS[event] || 'Sunlogic enquiry',
    html: compose(event, values),
    leadId,
    event,
    /* For the sheet, not for the email. The teaser's HTML is built from
       `safe` and contains nothing identifying; these fields travel in the
       JSON so the audit row is complete. The boundary this feature defends
       is what a director reads before accepting — not what the internal log
       records, which has held these columns since the first version. */
    extra: {
      division: lead.division,
      divisionLabel: label,
      assignee,
      status: event,
      round: round || 1,
      /* The COMPLETE assignment history, on every event, read from D1.
         ------------------------------------------------------------------
         Not a diff. The sheet row is an append-or-update, so a blank value
         clears the cell it lands in — send only the field this event
         changed and every other column is wiped by the next event. Sending
         the whole current state means each write is a full projection of
         the truth, idempotent, and safe to replay.
         It also leaves n8n making no decisions: it copies six values into
         six columns and has no opinion about rounds. */
      ...(await assignmentState(env, leadId)),
      type: lead.type,
      name: payload.name || '',
      email: payload.email || '',
      phone: payload.phone || '',
      need: payload.need || '',
      raw: lead.payload_json,
    },
  });

  if (result.ok) {
    await rememberMessage(env, {
      result, leadId, event, assignee, token, to: recipients(env, assignee),
    });

    /* The offer is the one event that moves the lead out of the queue and
       starts the director's 24 hours. The others are notifications about a
       lead whose state is already settled. */
    if (event === 'offer') {
      await env.DB.prepare(
        "UPDATE leads SET status='sent', last_attempt_at=datetime('now') WHERE id=?"
      ).bind(leadId).run();
      if (token) await markOffered(env, token);
    }
    return true;
  }

  await env.DB.prepare(
    "UPDATE leads SET attempts = attempts + 1, last_error = ?, last_attempt_at = datetime('now') WHERE id = ?"
  ).bind(('send failed: ' + result.why).slice(0, 400), leadId).run();
  return false;
}

/* ---- The daily digest --------------------------------------------------
   R3, and the acceptance test for this whole feature.

   Sent every morning whether or not anything is wrong. That is the point: a
   digest that only appears when there is a problem is indistinguishable from
   a digest that has stopped working, and "no leads today" then looks exactly
   like "the relay has been dead since Tuesday". If this stops arriving,
   something is broken — and it is the only signal that survives every other
   component failing, because it is generated here on Cloudflare rather than
   on the machine most likely to be off.

   Deliberately not conditional on there being news. */
async function sendDailyDigest(env) {
  const row = await env.DB.prepare(
    "SELECT " +
    " (SELECT COUNT(*) FROM leads WHERE created_at >= datetime('now','-1 day')) AS arrived," +
    " (SELECT COUNT(*) FROM offers WHERE accepted_at >= datetime('now','-1 day')) AS accepted," +
    " (SELECT COUNT(*) FROM offers WHERE state='offered') AS open_offers," +
    " (SELECT COUNT(*) FROM offers o WHERE o.state='offered' AND o.expires_at IS NULL) AS unclaimed," +
    " (SELECT COUNT(*) FROM leads WHERE status='failed') AS failed," +
    " (SELECT COUNT(*) FROM leads WHERE status='pending') AS queued," +
    /* Mail Resend accepted and then failed to deliver. Before this existed
       the number was unknowable and assumed to be zero; it was not. */
    " (SELECT COUNT(*) FROM messages WHERE status IN ('bounced','complained')" +
    "   AND created_at >= datetime('now','-1 day')) AS undelivered," +
    /* Delivery news about a message we have no record of sending. Should be
       zero now that every send records its id; if it is not, mail is going
       out by a path this Worker does not know about. */
    /* Scoped to OUR OWN sends. Resend's endpoint is account-wide, so without
       the origin filter every email any other project on the account sends
       inflates this, the digest reports it daily, and the number stops
       meaning anything — which is this feature's own failure mode, one level
       up. NULL origin predates the column and is ours. */
    " (SELECT COUNT(*) FROM webhook_events WHERE matched=0" +
    "   AND (origin='ours' OR origin IS NULL)" +
    "   AND received_at >= datetime('now','-1 day')) AS unmatched," +
    " (SELECT COUNT(*) FROM leads) AS total"
  ).first();

  /* Per-director figures, 30 days.
     ------------------------------------------------------------------
     Offers alone look fair even when the work is not: strict alternation
     by offer guarantees an even split of OFFERS, and says nothing about who
     actually does the jobs. A director who lets offers lapse hands the
     other one the work while the offer counts stay identical — 100 offers
     each, 100 jobs to one person.
     Both people believing they are right is how that becomes an argument,
     so the digest reports both numbers side by side. Not to police anyone:
     to make it a fact rather than a suspicion. */
  const per = await env.DB.prepare(
    "SELECT assignee, " +
    " COUNT(*) AS offered, " +
    " SUM(CASE WHEN state='accepted' THEN 1 ELSE 0 END) AS accepted, " +
    " SUM(CASE WHEN state='expired' THEN 1 ELSE 0 END) AS lapsed " +
    "FROM offers WHERE created_at >= datetime('now','-30 day') GROUP BY assignee"
  ).all();
  const byPerson = {};
  for (const r of per.results) byPerson[r.assignee] = r;
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  const line = (who) => {
    const r = byPerson[who] || { offered: 0, accepted: 0, lapsed: 0 };
    /* Counts, stated flatly. Deliberately not a ratio or a percentage —
       an enquiry nobody accepted is a fact about the enquiry, not a mark
       against a person, and the numbers are here to answer a question if
       one is asked rather than to keep score. */
    return cap(who) + ' ' + r.accepted + ' accepted, ' + r.offered + ' offered';
  };

  /* The oldest thing nobody has taken. A count alone does not convey "this
     has been sitting for three days". */
  const oldest = await env.DB.prepare(
    "SELECT lead_id, CAST((julianday('now') - julianday(MIN(created_at))) * 24 AS INTEGER) AS hours " +
    "FROM offers WHERE state='offered' GROUP BY lead_id ORDER BY MIN(created_at) LIMIT 1"
  ).first();

  const summary = {
    arrived_24h: row.arrived,
    accepted_24h: row.accepted,
    open_offers: row.open_offers,
    unclaimed: row.unclaimed,
    failed_all_time: row.failed,
    queued_now: row.queued,
    undelivered_24h: row.undelivered,
    unmatched_events_24h: row.unmatched,
    total_leads: row.total,
    oldest_open_lead: oldest ? oldest.lead_id : null,
    oldest_open_hours: oldest ? oldest.hours : null,
    /* The template asks for a sentence, not two numbers. It has always asked
       for one — {{oldestLine}} has been in body-daily-digest.html since the
       template was written, and nothing ever supplied it, because until now
       nothing rendered this template at all. */
    oldestLine: oldest && oldest.lead_id
      ? 'Oldest still open: lead ' + oldest.lead_id + ', ' + oldest.hours + ' hours ago.'
      : 'Nothing is sitting unaccepted.',
    /* Silence here is the good case, so it says nothing when there is
       nothing — unlike the rest of the digest, which reports zeros on
       purpose. The zeros prove the digest ran; this line only needs to
       appear when there is something to act on. */
    delivery_notice: [
      row.undelivered
        ? row.undelivered + ' email' + (row.undelivered === 1 ? '' : 's') +
          ' sent in the last 24 hours did not arrive (bounced or marked as spam).' +
          ' The affected leads carry the reason in the database.'
        : '',
      /* A quieter problem than a bounce, and a worse sign: it means mail is
         leaving by a route nothing here records, so the counts above are
         measuring less than they appear to. */
      row.unmatched
        ? row.unmatched + ' delivery notice' + (row.unmatched === 1 ? '' : 's') +
          ' arrived for messages this system has no record of sending.'
        : '',
    ].filter(Boolean).join(' '),
    split_30d: line('stephan') + ' · ' + line('craig'),
    /* Loud, and it removes itself: the line only exists while the variable
       does. A redirect left on by accident means one director is told
       everything while the rotation appears to work — this is the thing
       that says so, every morning, until it is taken off. */
    redirect_notice: env.MAIL_REDIRECT_TO
      ? 'TEST MODE — all mail is being redirected to ' + env.MAIL_REDIRECT_TO +
        '. Neither director is receiving their own notifications. Remove MAIL_REDIRECT_TO to end this.'
      : '',
  };

  /* Through send(), like every other email.
     ------------------------------------------------------------------
     This used to POST to n8n and nothing else, which made the dead-man's
     switch useless in the one direction that mattered: it never touched
     Resend, so if Resend died the digest would keep arriving and would
     report nothing wrong. A switch that cannot detect the failure it is
     watching for is decoration.

     Worse, it never arrived at all. n8n has no digest branch — six nodes,
     Webhook → Extract Body → Log Row → Needs sending? → Relay Send →
     Respond (see n8n/sunlogic-leads-relay.json, the committed definition).
     A digest payload carries no `needsSend`, and Extract Body reads
     `b.needsSend !== false`, so undefined became TRUE and every digest went
     down the sending branch — into Relay Send, with `to` and `html` both
     empty strings, because the digest never sent those fields. An SMTP send
     with no recipient and no body. Nobody has ever received this email, and
     the acceptance test for the entire feature ("confirm the digest arrives
     the next morning") is the one unticked box in the 2026-09-04 plan.

     So routing it through send() is not a risk of double-sending: it is the
     first time this template has been rendered. send() announces a
     successful Resend send to n8n with needsSend false — log it, do not
     send it — which is also what stops Relay Send being reached with an
     empty envelope. n8n needs no change.

     leadId 'digest' rather than blank: the sheet is append-or-update on Lead
     ID, so every digest to date collided into one blank-keyed row. A stable
     key gives the digest its own row and leaves real leads alone. */
  const result = await send(env, {
    to: recipients(env, 'both'),
    subject: 'Sunlogic leads — daily summary',
    html: compose('digest', {
      ...summary,
      preheader: summary.arrived_24h + ' arrived, ' + summary.accepted_24h + ' accepted',
      footnote: 'Sunlogic lead system &middot; sunlogic.co.za',
    }),
    leadId: 'digest',
    event: 'digest',
    extra: { type: 'digest', status: 'digest', ...summary },
  });

  /* Nothing to escalate to, and deliberately so. A digest that cannot be
     sent is exactly the situation the digest exists to reveal, and the
     reader learns it by not receiving one. Recorded, though — there is no
     lead to hang it on, so the Worker's own log is the only place it can
     go. */
  if (!result.ok) {
    console.error('digest send failed: ' + result.why);
    return false;
  }
  await rememberMessage(env, {
    result, leadId: null, event: 'digest', assignee: 'both', to: recipients(env, 'both'),
  });
  return true;
}

async function retryPendingLeads(env) {
  const { results } = await env.DB
    .prepare("SELECT id, type, payload_json, division FROM leads WHERE status = 'pending' AND attempts < 576")
    .all();

  for (const row of results) {
    const payload = JSON.parse(row.payload_json);
    /* The offer was created with the lead; a retry must carry the same
       token, or the claim link in the email that finally arrives would
       point at nothing. */
    const offer = await env.DB.prepare(
      "SELECT assignee, token, round FROM offers WHERE lead_id=? AND state='pending_send' ORDER BY id DESC LIMIT 1"
    ).bind(row.id).first();
    const delivered = offer
      ? await notify(env, row.id, 'offer', offer.assignee, offer.token, offer.round)
      : false;
    if (!delivered) {
      const current = await env.DB
        .prepare('SELECT attempts FROM leads WHERE id = ?')
        .bind(row.id)
        .first();
      if (current && current.attempts >= 576) {
        await env.DB.prepare("UPDATE leads SET status = 'failed' WHERE id = ?").bind(row.id).run();
      }
    }
  }
}

/* POST /uploads/brief — one photo per request, raw body, returns its URL.
   ------------------------------------------------------------------
   One request per file rather than one multipart request for all of them. A
   brief is submitted from a phone on site, where the connection drops: with
   one request per photo a failure costs that photo and the page can say which
   one, while a single 60 MB multipart body costs the whole submission and
   reports nothing useful. The page uploads them in sequence and only then
   posts the brief itself. */
async function handleUploadPost(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: uploadCorsHeaders(origin) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method not allowed' }, 405, origin);
  }
  if (!env.DB) {
    /* Said plainly rather than as a 500: a 500 reads as a transient fault and
       would have the installer retrying a photo that can never land. */
    return jsonResponse({ ok: false, error: 'uploads not configured' }, 503, origin);
  }

  const contentType = request.headers.get('Content-Type') || '';
  if (!isAllowedType(contentType)) {
    return jsonResponse({ ok: false, error: 'unsupported file type' }, 415, origin);
  }
  if (declaredSizeExceedsLimit(request.headers.get('Content-Length'))) {
    return jsonResponse({ ok: false, error: 'file too large', maxBytes: MAX_UPLOAD_BYTES }, 413, origin);
  }

  const key = uploadKey(Date.now(), randomHex(), contentType);
  /* The submitted filename is metadata, never part of the key. See uploads.mjs. */
  const originalName = (request.headers.get('X-File-Name') || '').slice(0, 200);
  /* The brief's quote/invoice number when the page sends one, so a photo can
     be traced back to its job and a retention sweep can be selective. Not a
     foreign key: the photo is uploaded BEFORE the brief row exists. */
  const reference = (request.headers.get('X-Brief-Reference') || '').slice(0, 60);

  /* Measured, not trusted. Content-Length was checked above but a chunked
     request has none, so this is the check that actually holds: D1 refuses a
     BLOB over 2 MB and a refusal here is a clearer answer than one from the
     database driver. */
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return jsonResponse({ ok: false, error: 'file too large', maxBytes: MAX_UPLOAD_BYTES }, 413, origin);
  }

  try {
    await env.DB
      .prepare('INSERT INTO brief_photos (id, bytes, content_type, file_name, reference, size_bytes) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(key, bytes, contentType.split(';')[0].trim(), originalName || null,
            reference || null, bytes.byteLength)
      .run();
  } catch (err) {
    console.log(JSON.stringify({ event: 'upload_failed', key, error: String(err) }));
    return jsonResponse({ ok: false, error: 'upload failed' }, 502, origin);
  }

  const base = uploadBaseUrl(env);
  return new Response(JSON.stringify({ ok: true, url: base + '/uploads/' + key }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', ...uploadCorsHeaders(origin) },
  });
}

/* GET /uploads/<key> — serve the photo back out of D1.
   No CORS and no auth: the callers are Trello fetching an attachment and a
   director opening the link from an email, neither of which is a browser on
   our own origin. The key is the access control. */
async function handleUploadGet(env, key) {
  if (!env.DB) return new Response('not found', { status: 404 });
  const row = await env.DB
    .prepare('SELECT bytes, content_type FROM brief_photos WHERE id = ?')
    .bind(key)
    .first();
  if (!row) return new Response('not found', { status: 404 });

  const headers = new Headers();
  /* content_type was validated against the allow-list on the way in, so this
     is never attacker-chosen text. See isAllowedType in uploads.mjs. */
  headers.set('Content-Type', row.content_type);
  /* Immutable: the key is random and an object at a given key is never
     replaced, so this can be cached for as long as anyone will keep it. */
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  /* A brief photo is displayed, not downloaded, and nothing here is ever
     HTML — but say so anyway, because the one type that would matter if the
     allow-list ever slipped is the one this stops. */
  headers.set('X-Content-Type-Options', 'nosniff');
  /* D1 hands a BLOB back as a plain Array of byte values, not an ArrayBuffer.
     Passing that array straight to Response() does NOT throw — it produces a
     200 with an EMPTY body, so every photo would have served as a zero-byte
     file with perfectly correct headers and nothing anywhere would have
     logged a problem. Caught only by byte-comparing a round trip, which is
     why the test does exactly that.
     Uint8Array accepts both an Array and an ArrayBuffer, so this is correct
     whichever shape a future D1 version returns. */
  return new Response(new Uint8Array(row.bytes), { headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/uploads/brief') {
      return handleUploadPost(request, env);
    }
    if (url.pathname.startsWith('/uploads/') && request.method === 'GET') {
      const key = decodeURIComponent(url.pathname.slice('/uploads/'.length));
      if (!isUploadKey(key)) return new Response('not found', { status: 404 });
      return handleUploadGet(env, key);
    }
    /* Resend tells us what became of a message. POST only, no CORS: this is
       called by Resend's servers, never by a browser, so an Origin has no
       business here and granting one would only widen the surface.

       The raw text is passed through untouched because the Svix signature
       covers the exact bytes — parsing and re-serialising changes key order
       and the signature can never match again. */
    if (url.pathname === '/resend/webhook') {
      if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
      const rawBody = await request.text();
      const { status, body } = await handleResendWebhook({
        db: env.DB,
        secret: env.RESEND_WEBHOOK_SECRET,
        headers: request.headers,
        rawBody,
        nowMs: Date.now(),
        /* Who we are, so the handler can tell our events from the rest.
           Resend's endpoint is account-wide and every other project on the
           account POSTs its events here too; `from` separates those, and the
           env tag separates staging from production, which share the
           address. Both come from mailer.mjs so there is one definition of
           each — the handler cannot import it without dragging the email
           templates in and becoming untestable. */
        ourSender: FROM_ADDRESS,
        ourEnv: envTag(env),
        onFailure: (row, failure, detail) => handleEmailFailure(env, row, failure, detail),
      });
      return new Response(body, { status });
    }

    if (url.pathname === '/leads/contact') {
      return handleLeadRoute(request, env, ctx, 'contact');
    }
    if (url.pathname === '/leads/calculator') {
      return handleLeadRoute(request, env, ctx, 'calculator');
    }

    /* /claim/<token>. GET renders, POST accepts — see claim.mjs for why that
       split is not optional. No CORS here on purpose: this is opened by a
       human clicking a link in an email, not called by the site. */
    const claim = url.pathname.match(/^\/claim\/([A-Za-z0-9_-]{43})$/);
    if (claim) {
      const token = claim[1];
      if (request.method === 'GET') return handleClaimGet(env, token);
      if (request.method === 'POST') {
        return handleClaimPost(env, token, async (offer) => {
          /* .catch, because this runs AFTER the response has gone out.
             notify() already records a failed send on the lead, but a throw —
             or anything that stops it reaching send() at all — left no trace
             anywhere. That is precisely why the lead 28 incident could not be
             answered from the data: "no error recorded" had to mean both
             "it sent" and "it never got that far". It now means one thing. */
          ctx.waitUntil(
            notify(env, offer.lead_id, 'accepted', offer.assignee, null, offer.round)
              .catch((err) => env.DB
                .prepare("UPDATE leads SET last_error=?, last_attempt_at=datetime('now') WHERE id=?")
                .bind(('accepted notify threw: ' + String(err)).slice(0, 400), offer.lead_id)
                .run()),
          );
        });
      }
      return new Response('method not allowed', { status: 405 });
    }

    return new Response('not found', { status: 404 });
  },

  /* Two crons, branched on which fired. Without the branch the digest would
     go out every five minutes, which trains people to ignore it — and an
     ignored dead-man's switch is not one. */
  async scheduled(event, env, ctx) {
    if (event.cron === '0 5 * * *') {
      ctx.waitUntil(sendDailyDigest(env));
      return;
    }
    ctx.waitUntil((async () => {
      await retryPendingLeads(env);
      await sweepExpiredOffers(env);
      await alertUnclaimed(env, null);
    })());
  },
};
