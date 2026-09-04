import {
  normaliseDivision, nextAssignee, newToken, expiryFrom, sqliteNow, OTHER, estimateValues,
} from './logic.mjs';
import { handleClaimGet, handleClaimPost } from './claim.mjs';
import { compose, recipients, send, ADDRESS_OF } from './mailer.mjs';
import { divisionLabel } from './logic.mjs';

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
  const { assignee, token } = await createOffer(env, leadId, 1, null);

  ctx.waitUntil(notify(env, leadId, 'offer', assignee, token));

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

    await notify(env, offer.lead_id, 'expired', offer.assignee, null);

    if (offer.round === 1) {
      /* To the OTHER director specifically, not to whoever the rotation
         pointer happens to name — a lead that has already been past one
         person must not be offered back to them. */
      const next = await createOffer(env, offer.lead_id, 2, OTHER[offer.assignee]);
      await notify(env, offer.lead_id, 'offer', next.assignee, next.token);
    } else {
      await reviveBothOffers(env, offer.lead_id);
    }
  }
  return results.length;
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
  const stmt = onlyLeadId
    ? env.DB.prepare(sql).bind(onlyLeadId)
    : env.DB.prepare(sql);
  const { results } = await stmt.all();

  for (const row of results) {
    if (row.last && Date.parse(row.last.replace(' ', 'T') + 'Z') > Date.now() - 86400000) continue;
    await notify(env, row.lead_id, 'unclaimed', 'both', null);
    await env.DB.prepare(
      "UPDATE offers SET alerted_at=datetime('now') WHERE lead_id=? AND state='offered'"
    ).bind(row.lead_id).run();
  }
  return results.length;
}

/* One way out of this Worker for every non-offer notification. Task 8
   replaces the body with the Resend call and keeps n8n as the fallback;
   until then everything goes through the existing relay. */
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
  if (!result.ok) {
    await env.DB.prepare(
      "UPDATE leads SET last_error=? WHERE id=?"
    ).bind(('visitor report failed: ' + result.why).slice(0, 400), leadId).run();
  }
  return result.ok;
}

async function notify(env, leadId, event, assignee, token) {
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
    receivedOn: String(lead.created_at || '').slice(0, 10),
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
    extra: { division: lead.division, assignee, status: event },
  });

  if (result.ok) {
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
    " (SELECT COUNT(*) FROM leads) AS total"
  ).first();

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
    total_leads: row.total,
    oldest_open_lead: oldest ? oldest.lead_id : null,
    oldest_open_hours: oldest ? oldest.hours : null,
  };

  try {
    const res = await fetch(env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Relay-Secret': env.RELAY_SECRET },
      body: JSON.stringify({ event: 'digest', type: 'digest', ...summary }),
    });
    return res.ok;
  } catch {
    /* Nothing to escalate to. A digest that cannot be sent is exactly the
       situation the digest exists to reveal, and the reader learns it by not
       receiving one. */
    return false;
  }
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
      "SELECT assignee, token FROM offers WHERE lead_id=? AND state='pending_send' ORDER BY id DESC LIMIT 1"
    ).bind(row.id).first();
    const delivered = offer
      ? await notify(env, row.id, 'offer', offer.assignee, offer.token)
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
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
          ctx.waitUntil(notify(env, offer.lead_id, 'accepted', offer.assignee, null));
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
