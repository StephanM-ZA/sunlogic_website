#!/usr/bin/env node
/* Does the deployed Worker still answer on every route it is supposed to?
 *
 * WHY THIS EXISTS
 * ------------------------------------------------------------------
 * Two sessions deploy this Worker. `wrangler deploy` ships the WHOLE script,
 * not a diff, so deploying from a checkout that is behind silently deletes
 * whatever the other session added. Nothing errors. The deploy reports
 * success. The only symptom is a route that worked an hour ago returning 404.
 *
 * It has happened twice to /uploads/brief. Both times the first sign was a
 * person filling in a twenty-field form and being told "Load failed", because
 * a 404 on the CORS preflight reaches the browser as a network error with no
 * detail in it.
 *
 * So: run this immediately after every deploy.
 *
 *     node workers/leads-relay/scripts/smoke.mjs
 *
 * Exits non-zero and names the missing route if anything regressed. It checks
 * routes NOBODY in this session touched, deliberately — the ones you changed
 * are the ones you were going to test anyway.
 */

const BASE = process.env.SMOKE_BASE_URL || 'https://leads.sunlogic.co.za';
const ORIGIN = 'https://sunlogic.co.za';

/* Each route, and what it must answer. The expectations are deliberately
   loose — this asks "is the handler still wired up", not "is it correct".
   A 400 from a POST with an empty body proves the route exists and validated,
   which is the whole question here. */
const ROUTES = [
  { path: '/uploads/brief', method: 'OPTIONS', expect: [204],
    why: 'brief photo and document uploads (removed by a stale deploy twice)' },
  { path: '/leads/contact', method: 'OPTIONS', expect: [204],
    why: 'contact form on all three sites' },
  { path: '/leads/calculator', method: 'OPTIONS', expect: [204],
    why: 'solar calculator report form' },
  { path: '/resend/webhook', method: 'OPTIONS', expect: [405],
    why: 'Resend delivery confirmations (POST only, so 405 is correct)' },
];

async function check(route) {
  const url = BASE + route.path;
  try {
    const response = await fetch(url, {
      method: route.method,
      headers: { Origin: ORIGIN },
    });
    const ok = route.expect.includes(response.status);
    return { ...route, status: response.status, ok };
  } catch (err) {
    return { ...route, status: 'unreachable: ' + err.message, ok: false };
  }
}

const results = [];
for (const route of ROUTES) { results.push(await check(route)); }

let failed = 0;
for (const r of results) {
  const mark = r.ok ? 'ok  ' : 'FAIL';
  console.log(`${mark} ${r.method.padEnd(7)} ${r.path.padEnd(20)} -> ${r.status}` +
    (r.ok ? '' : `  (expected ${r.expect.join(' or ')})`));
  if (!r.ok) { failed += 1; console.log(`       ${r.why}`); }
}

if (failed) {
  console.log('');
  console.log(`${failed} route(s) missing from the deployed Worker.`);
  console.log('Almost certainly a deploy from a checkout that was behind.');
  console.log('Fix: git pull, confirm the tree is clean, then redeploy:');
  console.log('  cd workers/leads-relay && npx wrangler deploy --env=""');
  process.exit(1);
}

console.log(`\nAll ${results.length} routes answering on ${BASE}.`);
