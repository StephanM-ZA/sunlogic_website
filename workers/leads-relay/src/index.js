const ALLOWED_ORIGINS = new Set([
  'https://sunlogic.co.za',
  'https://www.sunlogic.co.za',
]);

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : '';
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

  await insertLead(env.DB, type, body);

  return jsonResponse({ ok: true }, 200, origin);
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
};
