# Lead Capture Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the no-op `webhook="PENDING_BACKEND"` placeholder on the contact form and calculator "email me this" form with a real backend that never drops a lead, even if the iMac (and the n8n instance running on it) is down.

**Architecture:** A Cloudflare Worker + D1 database (genuinely separate infrastructure from the iMac) durably persists every submission and responds to the browser immediately. A Cron Trigger retries delivery to n8n every 5 minutes until it succeeds. n8n (on the iMac) does the actual work once reachable: sends email via Xneelo SMTP and logs a row to a Google Sheet.

**Tech Stack:** Cloudflare Workers + D1 (JavaScript, `wrangler` CLI), n8n (existing instance on the iMac at 192.168.0.19), plain HTML/JS frontend changes (no framework — matches the rest of `site-daylight`).

**Spec:** `docs/superpowers/specs/2026-08-31-lead-capture-backend-design.md`

## Global Constraints

- Never paste real secrets (SMTP password, D1/Cloudflare tokens, the shared relay secret) into any file committed to git, or into chat. Wrangler secrets go in via `wrangler secret put`; n8n credentials go in via n8n's own credential UI.
- The n8n workflow (Task 9-11) is a change to a service running on the iMac (192.168.0.19) — per the user's standing global change-control rule, this must be coordinated through the sibling `serverMonitor` project (`/Users/stephanmarais/Projects/development_projects/build/serverMonitor`), including a `change-log.jsonl` entry, exactly as this session already did once for a VoltIQ n8n workflow change. The Cloudflare-side tasks (4-8) have no such constraint — they touch no iMac infrastructure at all.
- Follow this repo's existing conventions: no test framework exists here (confirmed: `package.json` has no jest/vitest/mocha, only `playwright` for manual screenshot checks) — verification throughout this plan is via `curl`/manual browser testing, matching how `plugins/calculator/test-math.html` was verified, not a new automated test suite invented for this feature alone.
- Cache-busting (`?v=N`) applies only to files under `site-daylight/shared/` and `plugins/*/`. The webhook URL attribute changes in Task 13 are plain attribute values, not shared asset files — no version bump needed for those two edits.

---

## Task 1: Cloudflare account access + wrangler CLI

**Files:**
- Modify: `package.json` (add `wrangler` devDependency)

**Interfaces:**
- Produces: a working `npx wrangler` CLI, authenticated against the user's Cloudflare account, available to every later Cloudflare task.

- [ ] **Step 1: Add wrangler as a devDependency**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website
npm install --save-dev wrangler
```

- [ ] **Step 2: Authenticate wrangler against the user's Cloudflare account**

```bash
npx wrangler login
```

This opens a browser window for the user to approve access. Wait for
"Successfully logged in" before continuing.

- [ ] **Step 3: Verify authentication**

```bash
npx wrangler whoami
```

Expected: prints the account email and Account ID. Note the Account ID
for reference — not needed in any file, `wrangler.toml` resolves it
automatically from the authenticated session.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add wrangler CLI for Cloudflare Workers deployment"
```

---

## Task 2: Create the lead-log Google Sheet

**Files:** none (external setup only)

**Interfaces:**
- Produces: a real Google Sheets URL/ID, needed by Task 10's Google Sheets node configuration.

- [ ] **Step 1: Create a new Google Sheet**

In the Google account the user specified, create a new Sheet named
"Sunlogic Leads". Add this exact header row to the first tab:

```
Timestamp | Type | Name | Email | Phone | Need | Bill | Mode | Payback/Pivot | System Cost | Raw JSON
```

- [ ] **Step 2: Note the Sheet's ID**

The ID is the long string in the URL between `/d/` and `/edit`, e.g.
`https://docs.google.com/spreadsheets/d/`**`1AbCdEfGhIjKlMnOpQrStUvWxYz`**`/edit`.
Keep this for Task 10 — it is not a secret, but also not needed in any
committed file (it's entered directly into n8n's Google Sheets node
configuration in the n8n UI).

---

## Task 3: Confirm Xneelo SMTP settings

**Files:** none (external setup only)

**Interfaces:**
- Produces: SMTP host, port, and username for `sales@sunlogic.co.za`, needed by Task 9's n8n credential setup. The password itself is never written to any file in this repo or pasted into chat — it goes directly into n8n's credential UI in Task 9.

- [ ] **Step 1: Find the SMTP host/port**

In Xneelo's control panel (or the mail client already configured for
`sales@sunlogic.co.za`, e.g. Outlook/Apple Mail's account settings),
find the outgoing (SMTP) mail server settings: host, port, and whether
it uses SSL or STARTTLS. Common Xneelo/cPanel-style values are
`mail.sunlogic.co.za` on port `465` (SSL) or `587` (STARTTLS) — confirm
the actual values rather than assuming, since these vary by hosting
plan.

- [ ] **Step 2: Confirm the username**

Usually the full email address, `sales@sunlogic.co.za` — confirm this
matches what the existing mail client uses to log in.

---

## Task 4: Scaffold the Cloudflare Worker project

**Files:**
- Create: `workers/leads-relay/wrangler.toml`
- Create: `workers/leads-relay/src/index.js`

**Interfaces:**
- Produces: a deployed, empty Worker responding to any request with 404 — proves the deploy pipeline works before adding real logic.

- [ ] **Step 1: Create the directory and a minimal Worker**

```bash
mkdir -p /Users/stephanmarais/Projects/development_projects/build/sunlogic_website/workers/leads-relay/src
```

Write `workers/leads-relay/src/index.js`:

```js
export default {
  async fetch(request, env, ctx) {
    return new Response('not found', { status: 404 });
  },
};
```

- [ ] **Step 2: Write `wrangler.toml`**

```toml
name = "sunlogic-leads-relay"
main = "src/index.js"
compatibility_date = "2026-08-31"
```

- [ ] **Step 3: Deploy and verify**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website/workers/leads-relay
npx wrangler deploy
```

Note the deployed URL printed (e.g.
`https://sunlogic-leads-relay.<account>.workers.dev`) — `<account>` is
Cloudflare's real subdomain for this account, only known once this
deploy actually runs. Every later task in this plan that shows
`<account>` means "the real value noted here," not a value to fill in
separately.

```bash
curl -i https://sunlogic-leads-relay.<account>.workers.dev/anything
```

Expected: `HTTP/1.1 404` with body `not found`.

- [ ] **Step 4: Commit**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website
git add workers/leads-relay/wrangler.toml workers/leads-relay/src/index.js
git commit -m "feat(leads-relay): scaffold Cloudflare Worker skeleton"
```

---

## Task 5: Create the D1 database and schema

**Files:**
- Create: `workers/leads-relay/schema.sql`
- Modify: `workers/leads-relay/wrangler.toml` (add `[[d1_databases]]` binding)

**Interfaces:**
- Produces: a `DB` binding available in `env.DB` for Task 6 onward, backed by a `leads` table matching the spec's §6 schema exactly.

- [ ] **Step 1: Create the D1 database**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website/workers/leads-relay
npx wrangler d1 create sunlogic-leads
```

Expected output includes a `database_id` (a UUID) and a ready-to-paste
`[[d1_databases]]` TOML block — copy that block exactly.

- [ ] **Step 2: Add the binding to `wrangler.toml`**

```toml
[[d1_databases]]
binding = "DB"
database_name = "sunlogic-leads"
database_id = "<the real UUID from Step 1's output>"
```

- [ ] **Step 3: Write the schema**

`workers/leads-relay/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS leads (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  type            TEXT NOT NULL CHECK (type IN ('contact', 'calculator')),
  payload_json    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_attempt_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
```

- [ ] **Step 4: Apply the schema to the real (remote) database**

```bash
npx wrangler d1 execute sunlogic-leads --remote --file=schema.sql
```

- [ ] **Step 5: Verify the table exists**

```bash
npx wrangler d1 execute sunlogic-leads --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

Expected: a row showing `leads` (and SQLite's own `sqlite_sequence`).

- [ ] **Step 6: Commit**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website
git add workers/leads-relay/wrangler.toml workers/leads-relay/schema.sql
git commit -m "feat(leads-relay): add D1 database and leads table schema"
```

---

## Task 6: Implement the two lead-intake routes

**Files:**
- Modify: `workers/leads-relay/src/index.js`

**Interfaces:**
- Consumes: `env.DB` (D1 binding from Task 5).
- Produces: `insertLead(db, type, payload): Promise<number>` (returns the new row's `id`) — used by Task 7's delivery logic and Task 8's retry loop.
- Produces: working `POST /leads/contact` and `POST /leads/calculator` routes, each inserting a `pending` row and responding `200 {"ok": true}` (delivery to n8n is added in Task 7 — for now, just insert and respond).

- [ ] **Step 1: Replace `src/index.js` with validation + insert logic**

```js
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
```

- [ ] **Step 2: Deploy**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website/workers/leads-relay
npx wrangler deploy
```

- [ ] **Step 3: Test the happy path for both routes**

```bash
curl -i -X POST https://sunlogic-leads-relay.<account>.workers.dev/leads/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"0821234567","suburb":"Claremont","need":"Solar","property-type":"Home","message":"Testing"}'
```

Expected: `HTTP/1.1 200` with body `{"ok":true}`.

```bash
curl -i -X POST https://sunlogic-leads-relay.<account>.workers.dev/leads/calculator \
  -H "Content-Type: application/json" \
  -d '{"mode":"residential","inputs":{"bill":2500,"includeBattery":true},"results":{"panelKw":6.2},"email":"test@example.com","timestamp":"2026-08-31T12:00:00.000Z"}'
```

Expected: `HTTP/1.1 200` with body `{"ok":true}`.

- [ ] **Step 4: Test rejection of malformed/incomplete requests**

```bash
curl -i -X POST https://sunlogic-leads-relay.<account>.workers.dev/leads/contact \
  -H "Content-Type: application/json" \
  -d '{"phone":"0821234567"}'
```

Expected: `HTTP/1.1 400` (missing `name`/`email`).

```bash
curl -i -X POST https://sunlogic-leads-relay.<account>.workers.dev/leads/contact \
  -H "Content-Type: application/json" \
  -d 'not json'
```

Expected: `HTTP/1.1 400` (invalid JSON).

- [ ] **Step 5: Verify the rows actually landed in D1**

```bash
npx wrangler d1 execute sunlogic-leads --remote --command="SELECT id, type, status FROM leads ORDER BY id DESC LIMIT 5"
```

Expected: the two successful test submissions from Step 3, both
`status='pending'` (delivery to n8n isn't wired up until Task 7). The
two rejected requests from Step 4 must NOT appear — confirms validation
runs before insert.

- [ ] **Step 6: Commit**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website
git add workers/leads-relay/src/index.js
git commit -m "feat(leads-relay): validate and durably persist both lead types"
```

---

## Task 7: Fire-and-forget delivery to n8n with a shared secret

**Files:**
- Modify: `workers/leads-relay/src/index.js`

**Interfaces:**
- Consumes: `insertLead` (Task 6), `env.N8N_WEBHOOK_URL` (plain var), `env.RELAY_SECRET` (Worker secret, set in Step 2 below).
- Produces: `deliverToN8n(env, leadId, type, payload): Promise<boolean>` — used by Task 8's Cron retry loop too, so its signature/behavior must not change later without updating both call sites.

Since the real n8n workflow doesn't exist yet (built in Task 9-11), this
task's `N8N_WEBHOOK_URL` temporarily points at a public echo endpoint
(`https://httpbin.org/post`) purely to prove the Worker's delivery
mechanics work — it gets repointed at the real n8n webhook URL in Task
12, once that exists.

- [ ] **Step 1: Generate the shared secret**

```bash
openssl rand -hex 32
```

Copy the output — this is `RELAY_SECRET`. It's used again in Task 9 when
setting up the matching n8n Variable.

- [ ] **Step 2: Store it as a Worker secret (not in any file)**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website/workers/leads-relay
npx wrangler secret put RELAY_SECRET
```

Paste the value from Step 1 when prompted.

- [ ] **Step 3: Add the (non-secret) n8n webhook URL as a plain var**

Add to `wrangler.toml`:

```toml
[vars]
N8N_WEBHOOK_URL = "https://httpbin.org/post"
```

- [ ] **Step 4: Add delivery logic to `src/index.js`**

Add above `handleLeadRoute`:

```js
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
```

Change `handleLeadRoute`'s insert line from:

```js
  await insertLead(env.DB, type, body);

  return jsonResponse({ ok: true }, 200, origin);
```

to:

```js
  const leadId = await insertLead(env.DB, type, body);

  ctx.waitUntil(deliverToN8n(env, leadId, type, body));

  return jsonResponse({ ok: true }, 200, origin);
```

- [ ] **Step 5: Deploy**

```bash
npx wrangler deploy
```

- [ ] **Step 6: Test delivery**

```bash
curl -i -X POST https://sunlogic-leads-relay.<account>.workers.dev/leads/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Delivery Test","email":"test@example.com","phone":"0821234567","suburb":"Claremont","need":"Solar","property-type":"Home","message":"Testing delivery"}'
```

Expected: still `200 {"ok":true}` immediately (the browser never waits
on the httpbin round-trip).

Wait 2-3 seconds, then check the row's status flipped to `sent`:

```bash
npx wrangler d1 execute sunlogic-leads --remote --command="SELECT id, status, attempts, last_error FROM leads ORDER BY id DESC LIMIT 1"
```

Expected: `status='sent'`, `attempts=0`, `last_error=NULL` (httpbin
always returns 200, proving the success path).

- [ ] **Step 7: Test the failure path**

Temporarily change `N8N_WEBHOOK_URL` to an address that will fail, e.g.
`https://httpbin.org/status/500`, redeploy, submit again, and confirm
the row stays `pending` with `attempts=1` and a `last_error` mentioning
`500`. Then change it back to `https://httpbin.org/post` and redeploy.

- [ ] **Step 8: Commit**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website
git add workers/leads-relay/src/index.js workers/leads-relay/wrangler.toml
git commit -m "feat(leads-relay): fire-and-forget delivery to n8n with shared secret"
```

(The `RELAY_SECRET` value itself was never written to any file — only
`wrangler secret put` holds it, on Cloudflare's side.)

---

## Task 8: Cron Trigger retry loop

**Files:**
- Modify: `workers/leads-relay/src/index.js`
- Modify: `workers/leads-relay/wrangler.toml` (add `[triggers]`)

**Interfaces:**
- Consumes: `deliverToN8n` (Task 7) — same function, same signature, no changes needed to it.
- Produces: a `scheduled(event, env, ctx)` handler that retries every `status='pending'` row with `attempts < 20`, flipping to `status='failed'` once a retry pushes `attempts` to 20.

- [ ] **Step 1: Add the cron schedule to `wrangler.toml`**

```toml
[triggers]
crons = ["*/5 * * * *"]
```

- [ ] **Step 2: Add the retry function and scheduled export**

Add to `src/index.js`:

```js
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
```

Change the final `export default { ... }` block (the `fetch` handler's
body is unchanged from Task 7 — shown in full here since a later reader
may not have Task 7 open) to:

```js
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
```

- [ ] **Step 3: Deploy**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website/workers/leads-relay
npx wrangler deploy
```

- [ ] **Step 4: Verify the cron trigger is registered**

```bash
npx wrangler deployments list
```

Confirm the latest deployment is active. Cron triggers can also be
inspected in the Cloudflare dashboard under Workers & Pages → the
`sunlogic-leads-relay` Worker → Triggers.

- [ ] **Step 5: Test the retry loop manually (without waiting 5 minutes)**

```bash
npx wrangler dev --test-scheduled
```

In a separate terminal, trigger the scheduled handler directly:

```bash
curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"
```

Set `N8N_WEBHOOK_URL` to `https://httpbin.org/status/500` temporarily,
submit a lead via the local dev server's `/leads/contact` route, confirm
it's `pending` with `attempts=0`, then trigger the scheduled handler
above and confirm `attempts` becomes `1`. Revert `N8N_WEBHOOK_URL`
afterward and redeploy.

- [ ] **Step 6: Commit**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website
git add workers/leads-relay/src/index.js workers/leads-relay/wrangler.toml
git commit -m "feat(leads-relay): retry pending leads via Cron Trigger every 5 minutes"
```

---

## Task 9: Switch to serverMonitor, set up n8n credentials

**Files:** none in `sunlogic_website` (n8n's own credential store)

**Interfaces:**
- Produces: an n8n Variable `sunlogic_leads_secret` (matching the `RELAY_SECRET` value from Task 7 Step 1), an SMTP credential for `sales@sunlogic.co.za`, and a Google Sheets OAuth credential — all needed by Task 10's node configuration.

This task touches the iMac (n8n runs there as a LaunchAgent) — per the
standing global change-control rule, it's coordinated through
`serverMonitor`, not built silently from `sunlogic_website`.

- [ ] **Step 1: Switch the session to serverMonitor**

Use the directory-change mechanism to move to
`/Users/stephanmarais/Projects/development_projects/build/serverMonitor`
before doing anything below — matching how this session already handled
the VoltIQ n8n poll-cadence change earlier.

- [ ] **Step 2: Log into n8n**

Navigate to `https://n8n.digitaloperations.co.za/` and sign in (same
instance used for VoltIQ's workflows).

- [ ] **Step 3: Create the shared-secret Variable**

Settings → Variables → add `sunlogic_leads_secret` with the value
generated in Task 7 Step 1 (the same `RELAY_SECRET` value — this only
needs to be typed once here; do not regenerate it).

- [ ] **Step 4: Create the SMTP credential**

Credentials → New → "SMTP" (used by n8n's Send Email node, type
`n8n-nodes-base.emailSend`). Name it "Sunlogic Sales SMTP". Fill in:
- Host/port/SSL setting from Task 3's findings
- User: `sales@sunlogic.co.za`
- Password: entered directly into this form — never written to any file
  in this repo, never pasted into chat.

Save, then use n8n's own "Test" button on the credential (if available
for SMTP) or defer verification to Task 10's end-to-end test.

- [ ] **Step 5: Create the Google Sheets credential**

Credentials → New → "Google Sheets OAuth2 API". Follow n8n's OAuth flow,
signing in with the Google account from Task 2. Name it "Sunlogic Leads
Sheet".

- [ ] **Step 6: Note these for Task 10**

Have ready: the credential names from Steps 4-5, and the Google Sheet ID
from Task 2.

---

## Task 10: Build the n8n workflow

**Files:** none in `sunlogic_website` yet (built directly in the n8n editor; exported to a repo file in Task 11)

**Interfaces:**
- Consumes: the three credentials/variable from Task 9, the exact email copy from spec §8 (verbatim — this is final copy, not a draft).
- Produces: a live, activated n8n workflow reachable at
  `https://n8n.digitaloperations.co.za/webhook/sunlogic-leads` — this
  exact URL is what Task 12 points the Worker's `N8N_WEBHOOK_URL` at.

Still working from the `serverMonitor` session context (per Task 9).

- [ ] **Step 1: Create a new blank workflow**

In n8n, Workflows → Create Workflow. Rename it "Sunlogic — Leads Relay".

- [ ] **Step 2: Add the Webhook trigger node**

Add a node of type "Webhook". Configure:
- HTTP Method: `POST`
- Path: `sunlogic-leads`
- Respond: "Using Respond to Webhook Node" (so later Respond nodes
  control the status code, rather than an immediate auto-ack)

This produces the public URL `https://n8n.digitaloperations.co.za/webhook/sunlogic-leads`.

- [ ] **Step 3: Add a Code node to check the shared secret**

Add a "Code" node connected from the Webhook node. Name it "Check
Secret". JavaScript code:

```js
const headers = $input.first().headers;
const secret = headers['x-relay-secret'];
const expected = $vars.sunlogic_leads_secret;
const body = $input.first().json.body || $input.first().json;
return [{ json: { ...body, __secretValid: secret === expected } }];
```

(Webhook nodes in n8n nest the actual POST body under `.body` in some
configurations — check the node's own input data preview after a test
execution in Step 10 below, and adjust `body` extraction if the raw
payload appears at the top level instead.)

- [ ] **Step 4: Add an If node to branch on secret validity**

Add an "If" node connected from "Check Secret". Condition:
`{{ $json.__secretValid }}` is boolean `true`. This produces two
outputs: "true" (valid) and "false" (invalid).

- [ ] **Step 5: Add the Unauthorized response (If node's "false" branch)**

Add a "Respond to Webhook" node connected from the If node's false
output. Configure:
- Respond With: JSON
- Response Body: `{{ { "ok": false, "error": "unauthorized" } }}`
- Response Code: `401`

- [ ] **Step 6: Add a Switch node to branch on lead type (If node's "true" branch)**

Add a "Switch" node connected from the If node's true output. Add two
routing rules on `{{ $json.type }}`: equals `"contact"` → output
"contact"; equals `"calculator"` → output "calculator".

- [ ] **Step 7: Build the "contact" branch**

Connected from the Switch node's "contact" output, add a "Send Email"
node ("Notify Sales — Contact"):
- Credential: "Sunlogic Sales SMTP" (Task 9)
- From: `sales@sunlogic.co.za`
- To: `sales@sunlogic.co.za`
- Subject: `={{ "New enquiry — " + $json.name + " (" + $json.need + ")" }}`
- Text (plain body — use the exact copy from spec §8.1, with n8n
  expressions substituted for the `{{ }}` placeholders):

```
New enquiry from the website.

Name:       {{ $json.name }}
Email:      {{ $json.email }}
Phone:      {{ $json.phone }}
Suburb:     {{ $json.suburb }}
Needs:      {{ $json.need }}
Property:   {{ $json["property-type"] }}

Message:
{{ $json.message }}

—
Submitted via the contact form on sunlogic.co.za.
```

Then connect a "Google Sheets" node ("Log Contact Lead"):
- Credential: "Sunlogic Leads Sheet" (Task 9)
- Operation: Append Row
- Document: the Sheet ID from Task 2
- Sheet: the first tab
- Map columns: `Timestamp={{ $now }}`, `Type=contact`,
  `Name={{ $json.name }}`, `Email={{ $json.email }}`,
  `Phone={{ $json.phone }}`, `Need={{ $json.need }}`, `Bill=` (leave
  blank — contact form has no bill field), `Mode=` (blank),
  `Payback/Pivot=` (blank), `System Cost=` (blank),
  `Raw JSON={{ JSON.stringify($json) }}`

Then connect a final "Respond to Webhook" node ("Respond 200 — Contact"):
Respond With JSON, Response Body `{{ { "ok": true } }}`, Response Code
`200`.

- [ ] **Step 8: Build the "calculator" branch**

Connected from the Switch node's "calculator" output, add a "Send
Email" node ("Notify Sales — Calculator"):
- Credential: "Sunlogic Sales SMTP"
- From/To: `sales@sunlogic.co.za`
- Subject: `={{ "Calculator lead — " + $json.mode + ", R" + $json.inputs.bill + "/month" }}`
- Text (from spec §8.2, expressions substituted):

```
Someone ran the {{ $json.mode }} calculator and asked for their estimate emailed
to them — this is a warm lead, not a cold form fill.

Their email:      {{ $json.email }}
Monthly bill:     R{{ $json.inputs.bill }}
Battery included: {{ $json.inputs.includeBattery }}

Their estimate (raw):
{{ JSON.stringify($json.results, null, 2) }}

They've also been sent a copy of this estimate by email — worth reaching
out while it's fresh.
```

(Using a raw JSON dump of `results` here rather than hand-picking
residential-vs-SME fields — keeps this one email template working for
both modes without a nested conditional inside the email body; the
visitor-facing email in the next step is the one that needs the
friendlier, mode-specific formatting.)

Then add a second "Send Email" node ("Email Visitor Report"), connected
from the same "Notify Sales — Calculator" node (not chained after it —
both fire from the same branch):
- Credential: "Sunlogic Sales SMTP"
- From: `sales@sunlogic.co.za`
- To: `={{ $json.email }}`
- Subject: `Your Sunlogic solar estimate`
- Text — build this from spec §8.3's copy. Since the residential and SME
  result shapes differ (see `plugins/calculator/calculator-math.js`),
  use an n8n expression with a ternary rather than the Handlebars
  `{{#if}}` shown illustratively in the spec:

```
Hi,

Here's the estimate you asked for, based on a R{{ $json.inputs.bill }}/month bill:

  Recommended panels:   {{ $json.results.panelKw }} kW
  Recommended inverter: {{ $json.results.inverterKw }} kW
  Battery storage:      {{ $json.results.batteryKwh }} kWh
  Estimated system cost: R{{ $json.results.systemCost }}

{{ $json.mode === 'residential' ? 'Estimated monthly saving: R' + Math.round($json.results.firstYearSavings / 12) + '\nTypical payback period: ' + $json.results.paybackYearsLow.toFixed(0) + '-' + $json.results.paybackYearsHigh.toFixed(0) + ' years' : 'Estimated monthly saving: R' + $json.results.monthlySavings.toFixed(0) + '\nEstimated monthly installment: R' + $json.results.monthlyInstallment.toFixed(0) + '\nEstimated monthly cash flow: R' + $json.results.pivot.toFixed(0) }}

  ~{{ ($json.results.annualCo2Kg / 1000).toFixed(1) }} tons of CO2 avoided per year — roughly
  the same as {{ Math.round($json.results.treesEquivalent) }} trees planted.

Figures are indicative estimates based on typical Western Cape conditions
and standard industry assumptions — not a formal system design or finance
offer. A site visit turns this into an actual number, and costs you
nothing to book.

Book a free site assessment: https://sunlogic.co.za/contact.html
Or call us directly: +27 (82) 655 5371

— The Sunlogic team
```

Then connect a "Google Sheets" node ("Log Calculator Lead") from
"Email Visitor Report", same Sheet as Step 7 but mapping:
`Type=calculator`, `Email={{ $json.email }}`,
`Bill={{ $json.inputs.bill }}`, `Mode={{ $json.mode }}`,
`Payback/Pivot={{ $json.mode === 'residential' ? $json.results.paybackYears : $json.results.pivot }}`,
`System Cost={{ $json.results.systemCost }}`,
`Raw JSON={{ JSON.stringify($json) }}` (leave `Name`/`Phone`/`Need`
blank — the calculator form doesn't collect those).

Then a final "Respond to Webhook" node ("Respond 200 — Calculator"),
same configuration as Step 7's.

- [ ] **Step 9: Save and activate**

Save the workflow, then toggle it to "Active" (top-right in the n8n
editor) — matching the same publish step used for the VoltIQ workflows
this session.

- [ ] **Step 10: Test both branches directly against n8n**

```bash
curl -i -X POST https://n8n.digitaloperations.co.za/webhook/sunlogic-leads \
  -H "Content-Type: application/json" \
  -H "X-Relay-Secret: <the real secret from Task 7 Step 1>" \
  -d '{"type":"contact","name":"n8n Test","email":"test@example.com","phone":"0821234567","suburb":"Claremont","need":"Solar","property-type":"Home","message":"Testing n8n directly"}'
```

Expected: `200 {"ok":true}`, an email arrives at `sales@sunlogic.co.za`,
and a new row appears in the Google Sheet.

```bash
curl -i -X POST https://n8n.digitaloperations.co.za/webhook/sunlogic-leads \
  -H "Content-Type: application/json" \
  -H "X-Relay-Secret: wrong-secret" \
  -d '{"type":"contact","name":"Should Fail","email":"test@example.com"}'
```

Expected: `401 {"ok":false,"error":"unauthorized"}`, no email sent, no
Sheet row.

Also test the calculator branch with a realistic payload matching
`plugins/calculator/calculator-math.js`'s actual `calculateResidential()`
output shape (panelKw, batteryKwh, inverterKw, systemCost,
firstYearSavings, paybackYears, paybackYearsLow, paybackYearsHigh,
annualCo2Kg, treesEquivalent, cumulativeByYear) — confirm both emails
(sales notification + visitor report) arrive with correctly-formatted
numbers, not `undefined` or `NaN`.

---

## Task 11: Export the workflow to the repo, document it, log the change

**Files:**
- Create: `n8n/sunlogic-leads-relay.json` (in `sunlogic_website`)
- Create: `docs/n8n-workflows.md` (in `sunlogic_website`)
- Modify: `serverMonitor/change-log.jsonl` (append-only, in `serverMonitor`)

**Interfaces:**
- Consumes: the live, activated workflow from Task 10 — this task records what was actually built, it doesn't change it.

- [ ] **Step 1: Export the real workflow JSON from n8n**

In the n8n editor, use the workflow's own export/download function (or
select-all + copy on the canvas, then paste into a local file) to
capture the exact JSON of what was built in Task 10 — matching how
VoltIQ's own `n8n/*.json` files are kept in sync with what's actually
live, not hand-typed separately from it.

- [ ] **Step 2: Switch back to the sunlogic_website session**

- [ ] **Step 3: Save the exported JSON**

Write the exported content to
`/Users/stephanmarais/Projects/development_projects/build/sunlogic_website/n8n/sunlogic-leads-relay.json`.

- [ ] **Step 4: Write `docs/n8n-workflows.md`**

Document, mirroring VoltIQ's `docs/n8n-workflows.md` structure:
- The workflow's purpose and public webhook URL.
- Required n8n Variables (`sunlogic_leads_secret`) and Credentials
  ("Sunlogic Sales SMTP", "Sunlogic Leads Sheet") that must exist before
  re-importing this workflow on a fresh n8n instance.
- The shared-secret contract with `workers/leads-relay` (Task 7) — this
  workflow rejects anything without a matching `X-Relay-Secret` header.
- A note that this workflow is only ever called by the Cloudflare Worker
  (fast path + Cron retry), never directly by a visitor's browser.

- [ ] **Step 5: Switch to serverMonitor and log the change**

Append an entry to `serverMonitor/change-log.jsonl` documenting the new
n8n workflow, its purpose, and what was verified — same format and
level of detail as this session's earlier VoltIQ poll-cadence entries
(actor, timestamp, service, action, verify, result fields).

- [ ] **Step 6: Commit in both repos**

In `sunlogic_website`:

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website
git add n8n/sunlogic-leads-relay.json docs/n8n-workflows.md
git commit -m "docs(n8n): add Sunlogic leads-relay workflow record"
git push origin main
```

In `serverMonitor`:

```bash
cd /Users/stephanmarais/Projects/development_projects/build/serverMonitor
git add change-log.jsonl
git commit -m "chore(change-log): log new sunlogic-leads-relay n8n workflow"
git push origin main
```

---

## Task 12: Point the Worker at the real n8n webhook

**Files:**
- Modify: `workers/leads-relay/wrangler.toml`

**Interfaces:**
- Consumes: the real webhook URL from Task 10 (`https://n8n.digitaloperations.co.za/webhook/sunlogic-leads`).

- [ ] **Step 1: Update the var**

```toml
[vars]
N8N_WEBHOOK_URL = "https://n8n.digitaloperations.co.za/webhook/sunlogic-leads"
```

- [ ] **Step 2: Deploy**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website/workers/leads-relay
npx wrangler deploy
```

- [ ] **Step 3: Full round-trip test**

```bash
curl -i -X POST https://sunlogic-leads-relay.<account>.workers.dev/leads/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Full Roundtrip Test","email":"test@example.com","phone":"0821234567","suburb":"Claremont","need":"Solar","property-type":"Home","message":"Testing the real path end to end"}'
```

Expected: `200 {"ok":true}` immediately; within a few seconds, an email
arrives at `sales@sunlogic.co.za` and a Sheet row appears; the D1 row's
status flips to `sent`:

```bash
npx wrangler d1 execute sunlogic-leads --remote --command="SELECT id, status FROM leads ORDER BY id DESC LIMIT 1"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website
git add workers/leads-relay/wrangler.toml
git commit -m "feat(leads-relay): point delivery at the real n8n leads-relay webhook"
```

---

## Task 13: Wire the frontend to the real Worker URL

**Files:**
- Modify: `site-daylight/contact.html`
- Modify: `site-daylight/solar.html`

**Interfaces:**
- Consumes: the deployed Worker's real URL from Task 4
  (`https://sunlogic-leads-relay.<account>.workers.dev`).

- [ ] **Step 1: Update the contact form**

In `site-daylight/contact.html`, find:

```html
<form data-dl-form data-webhook="PENDING_BACKEND" class="sl-form">
```

Change to:

```html
<form data-dl-form data-webhook="https://sunlogic-leads-relay.<account>.workers.dev/leads/contact" class="sl-form">
```

- [ ] **Step 2: Update both calculator instances**

In `site-daylight/solar.html`, find both:

```html
<plugin-calculator mode="residential" webhook="PENDING_BACKEND"></plugin-calculator>
```

```html
<plugin-calculator mode="sme" webhook="PENDING_BACKEND"></plugin-calculator>
```

Change both `webhook="PENDING_BACKEND"` to
`webhook="https://sunlogic-leads-relay.<account>.workers.dev/leads/calculator"`.

- [ ] **Step 3: Manual browser test — contact form**

Serve `site-daylight/` locally (e.g. `python3 -m http.server` from the
repo root, matching how this session tested other changes), open
`contact.html` in a browser, fill in and submit the form. Confirm:
redirect to `thank-you.html` happens, and within a few seconds an email
arrives at `sales@sunlogic.co.za`.

- [ ] **Step 4: Manual browser test — calculator**

Open `solar.html`, adjust the residential calculator's inputs, use the
"Email me this" form with a real test address. Confirm the "Sent —
we'll email that report shortly" status text appears, and the test
address receives the report email with correctly-formatted numbers
matching what's shown on screen.

- [ ] **Step 5: Commit**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website
git add site-daylight/contact.html site-daylight/solar.html
git commit -m "feat(site-daylight): wire contact form and calculator to real lead-capture backend"
git push origin main
```

---

## Task 14: End-to-end resilience test

**Files:** none (verification only)

**Interfaces:** none — this task validates the whole system built in
Tasks 1-13 together.

- [ ] **Step 1: Happy path (already covered by Task 13, re-confirm once more)**

Submit both forms once more with everything healthy; confirm emails +
Sheet rows + `sent` status, as in Task 12/13.

- [ ] **Step 2: n8n-down simulation**

In n8n, deactivate the "Sunlogic — Leads Relay" workflow. Submit both
forms again via the real site pages. Confirm:
- The browser still shows immediate success (redirect / "Sent" text) —
  this is the core resilience property this whole plan exists to prove.
- The D1 rows are `pending`.

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website/workers/leads-relay
npx wrangler d1 execute sunlogic-leads --remote --command="SELECT id, status, attempts FROM leads WHERE status='pending' ORDER BY id DESC LIMIT 5"
```

Reactivate the workflow in n8n. Wait for the next Cron tick (up to 5
minutes) without re-submitting anything, then confirm the emails/Sheet
rows appear and the rows flip to `sent`.

- [ ] **Step 3: Retry ceiling**

This is slow to trigger naturally (100 minutes); verify the logic
directly instead:

```bash
npx wrangler d1 execute sunlogic-leads --remote --command="UPDATE leads SET attempts = 19 WHERE id = (SELECT id FROM leads ORDER BY id DESC LIMIT 1)"
```

Deactivate the n8n workflow again, wait for one more Cron tick, then:

```bash
npx wrangler d1 execute sunlogic-leads --remote --command="SELECT id, status, attempts FROM leads ORDER BY id DESC LIMIT 1"
```

Expected: `status='failed'`, `attempts=20` — confirms the ceiling stops
infinite retries. Reactivate the n8n workflow afterward.

- [ ] **Step 4: CORS rejection**

```bash
curl -i -X POST https://sunlogic-leads-relay.<account>.workers.dev/leads/contact \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil-example.com" \
  -d '{"name":"CORS Test","email":"test@example.com"}'
```

Expected: the response's `Access-Control-Allow-Origin` header is absent
or empty — confirms an arbitrary third-party site's browser-based
`fetch` to this endpoint would be blocked by the browser's own CORS
enforcement, even though this `curl` test itself still gets a raw HTTP
response (CORS is enforced by browsers, not servers).

- [ ] **Step 5: Final cleanup**

Delete any test rows from the Google Sheet and, optionally, from D1:

```bash
npx wrangler d1 execute sunlogic-leads --remote --command="DELETE FROM leads WHERE payload_json LIKE '%Test%' OR payload_json LIKE '%test@example.com%'"
```
