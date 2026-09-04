import {
  normaliseDivision, nextAssignee, newToken, expiryFrom, sqliteNow, OTHER,
} from './logic.mjs';

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
  const cur = await env.DB.prepare('SELECT last_offered_to FROM rotation WHERE id = 1').first();
  const assignee = forcedAssignee || nextAssignee(cur && cur.last_offered_to);
  await env.DB.batch([
    env.DB.prepare('UPDATE rotation SET last_offered_to = ? WHERE id = 1').bind(assignee),
    env.DB.prepare(
      "INSERT INTO offers (lead_id, assignee, round, token, state) VALUES (?, ?, ?, ?, 'pending_send')"
    ).bind(leadId, assignee, round, token),
  ]);
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

async function deliverToN8n(env, leadId, type, payload, offer) {
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
        event: 'offer',
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
      if (offer && offer.token) await markOffered(env, offer.token);
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

  ctx.waitUntil(deliverToN8n(env, leadId, type, body, { division, assignee, token }));

  return jsonResponse({ ok: true }, 200, origin);
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
    const delivered = await deliverToN8n(env, row.id, row.type, payload,
      offer ? { division: row.division, assignee: offer.assignee, token: offer.token } : null);
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
    return new Response('not found', { status: 404 });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(retryPendingLeads(env));
  },
};
