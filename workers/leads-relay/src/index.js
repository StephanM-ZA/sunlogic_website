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
  const result = await db
    .prepare('INSERT INTO leads (type, payload_json) VALUES (?, ?)')
    .bind(type, JSON.stringify(payload))
    .run();
  return result.meta.last_row_id;
}

async function deliverToN8n(env, leadId, type, payload) {
  try {
    const res = await fetch(env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Relay-Secret': env.RELAY_SECRET,
      },
      body: JSON.stringify({ type, ...payload }),
    });
    if (res.ok) {
      await env.DB.prepare(
        "UPDATE leads SET status = 'sent', last_attempt_at = datetime('now') WHERE id = ?"
      ).bind(leadId).run();
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

  const leadId = await insertLead(env.DB, type, body);

  ctx.waitUntil(deliverToN8n(env, leadId, type, body));

  return jsonResponse({ ok: true }, 200, origin);
}

async function retryPendingLeads(env) {
  const { results } = await env.DB
    .prepare("SELECT id, type, payload_json FROM leads WHERE status = 'pending' AND attempts < 20")
    .all();

  for (const row of results) {
    const payload = JSON.parse(row.payload_json);
    const delivered = await deliverToN8n(env, row.id, row.type, payload);
    if (!delivered) {
      const current = await env.DB
        .prepare('SELECT attempts FROM leads WHERE id = ?')
        .bind(row.id)
        .first();
      if (current && current.attempts >= 20) {
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
