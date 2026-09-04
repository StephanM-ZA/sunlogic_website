# Lead Claim and Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enquiries alternate between Stephan and Craig, are handed over only when actively accepted, move on after 24 hours unaccepted, and every step is logged where a human can see it.

**Architecture:** The Cloudflare Worker at `workers/leads-relay/` owns all state in D1 and exposes a claim endpoint. n8n on the iMac stays the only thing that sends email. The Worker's existing 5-minute cron becomes the expiry sweeper and the digest trigger. No new email vendor, no SMTP change.

**Tech Stack:** Cloudflare Workers, D1 (SQLite), n8n, Xneelo SMTP, Google Sheets, `node --test`.

**Spec:** `docs/superpowers/specs/2026-09-04-lead-claim-rotation-design.md`

## Global Constraints

- **Divisions are `Energy`, `Electrical`, `Smart`, `Not sure yet`.** Never "Solar", never "Energy management", except when reading historic rows.
- **Assignees are `stephan` and `craig`** (lower-case keys). Addresses: `stephan@sunlogic.co.za`, `craig@sunlogic.co.za`. Emails send **from** `sales@sunlogic.co.za` — that is the SMTP credential and it does not change.
- **The teaser email must never contain the visitor's name, email, phone, suburb, property type or message.** Division and date only. This is the whole point of the claim step.
- **`GET /claim/<token>` must never change state.** Only `POST` accepts. R1–R6 in the spec are requirements, not suggestions.
- **Nothing is deleted.** Offers transition state; rows are never removed.
- **No bare `npx`.** Use `npx --no-install`, or a path into `node_modules/.bin`.
- **The n8n workflow runs on the iMac.** Editing it is an iMac change: it routes through the serverMonitor control plane and needs a `change-log.jsonl` entry.
- **`OFFER_TTL_MINUTES`** defaults to `1440`. Never hard-code 24 hours.
- Every Worker deploy is `npx --no-install wrangler deploy` from `workers/leads-relay/`, and is a **production** deploy of the live lead pipeline — the human decides when.

---

## File Structure

| File | Responsibility |
|---|---|
| `workers/leads-relay/schema.sql` | `offers`, `rotation`, new `leads` columns |
| `workers/leads-relay/migrations/0002-claim-rotation.sql` *(new)* | applied to the live DB; `schema.sql` stays the from-scratch definition |
| `workers/leads-relay/src/logic.js` *(new)* | pure functions: division normalisation, rotation, token, TTL. No I/O, fully unit-testable |
| `workers/leads-relay/src/claim.js` *(new)* | the claim endpoint's HTML and its two handlers |
| `workers/leads-relay/src/index.js` | routing, assignment on submit, sweeper, digest |
| `workers/leads-relay/test/logic.test.js` *(new)* | `node --test` over `logic.js` |
| `emails/offer-notification.html` *(new)* | teaser |
| `emails/assignment-full.html` *(new)* | full details, replaces `sales-notification.html` |
| `emails/offer-expired.html` *(new)* | "24 hours has passed" |
| `emails/unclaimed-alert.html` *(new)* | repeating alert to both |
| `emails/daily-digest.html` *(new)* | dead-man's switch |
| `n8n/sunlogic-leads-relay.json` | new branches, Sheets Append-or-Update |

---

## Task 1: Rename the divisions

Independent of everything else and shippable on its own. Do it first so every later task sees the new values.

**Files:**
- Modify: `site-main/contact.html`, `site-energy/contact.html`, `site-electrical/contact.html`, `shared/components.js`

- [ ] **Step 1: Change all four option lists**

Each contains exactly one occurrence of:

```
options="Solar|Electrical|Energy management|Not sure yet"
```

Replace with:

```
options="Energy|Electrical|Smart|Not sure yet"
```

- [ ] **Step 2: Verify all four changed and none was missed**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website
grep -rn 'Solar|Electrical|Energy management' site-main site-energy site-electrical shared --include='*.html' --include='*.js'
grep -rc 'Energy|Electrical|Smart|Not sure yet' site-main/contact.html site-energy/contact.html site-electrical/contact.html shared/components.js
```

Expected: the first prints nothing, the second prints `1` for all four files.

- [ ] **Step 3: Bump the component version**

`shared/components.js` changed, so every page must re-fetch it:

```bash
find site-main site-energy site-electrical -name '*.html' -exec sed -i '' 's/components\.js?v=38/components.js?v=39/g' {} +
```

- [ ] **Step 4: Build and check conformance**

```bash
npm run build && npm run conformance
```

Expected: `34/34`, `0 fails 0 warns` at both viewports.

- [ ] **Step 5: Commit**

```bash
git add site-main site-energy site-electrical shared
git commit -m "feat(forms): divisions renamed — Energy, Electrical, Smart"
```

---

## Task 2: Schema

**Files:**
- Modify: `workers/leads-relay/schema.sql`
- Create: `workers/leads-relay/migrations/0002-claim-rotation.sql`

**Interfaces:**
- Produces: tables `offers`, `rotation`; columns `leads.division`, `leads.claimed_by`. Every later task reads these names.

- [ ] **Step 1: Write the migration**

`workers/leads-relay/migrations/0002-claim-rotation.sql`:

```sql
-- Claim and rotation. Applied to the live sunlogic-leads database;
-- schema.sql carries the same shape for a from-scratch build.

ALTER TABLE leads ADD COLUMN division   TEXT;
ALTER TABLE leads ADD COLUMN claimed_by TEXT;

CREATE TABLE IF NOT EXISTS offers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id     INTEGER NOT NULL REFERENCES leads(id),
  assignee    TEXT    NOT NULL CHECK (assignee IN ('stephan','craig')),
  round       INTEGER NOT NULL,
  token       TEXT    NOT NULL UNIQUE,
  state       TEXT    NOT NULL DEFAULT 'pending_send'
                      CHECK (state IN ('pending_send','offered','accepted','expired')),
  offered_at  TEXT,
  expires_at  TEXT,
  accepted_at TEXT,
  alerted_at  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The sweeper's only query. state first: it is the selective column.
CREATE INDEX IF NOT EXISTS idx_offers_sweep ON offers(state, expires_at);
CREATE INDEX IF NOT EXISTS idx_offers_lead  ON offers(lead_id);

CREATE TABLE IF NOT EXISTS rotation (
  id              INTEGER PRIMARY KEY CHECK (id = 1),
  last_offered_to TEXT
);
INSERT OR IGNORE INTO rotation (id, last_offered_to) VALUES (1, NULL);
```

Note `state` starts at `pending_send`, not `offered`. That is R1: the row exists before the email is sent, and only becomes `offered` — with `expires_at` set — once n8n confirms the send. The sweeper ignores `pending_send`, so a lead waiting on a down n8n is not burning its 24 hours.

- [ ] **Step 2: Mirror the same shape into `schema.sql`**

Append the two `CREATE TABLE` blocks and add `division TEXT` and `claimed_by TEXT` to the existing `leads` definition, so a fresh database matches a migrated one.

- [ ] **Step 3: Apply locally first**

```bash
cd workers/leads-relay
npx --no-install wrangler d1 execute sunlogic-leads --local --file migrations/0002-claim-rotation.sql
npx --no-install wrangler d1 execute sunlogic-leads --local --command "SELECT name FROM sqlite_master WHERE type='table';"
```

Expected: `leads`, `offers`, `rotation`.

- [ ] **Step 4: Apply to the live database**

This touches production data. Confirm with the human first.

```bash
npx --no-install wrangler d1 execute sunlogic-leads --remote --file migrations/0002-claim-rotation.sql
npx --no-install wrangler d1 execute sunlogic-leads --remote --json --command "SELECT COUNT(*) AS leads FROM leads;"
```

Expected: still 11. `ALTER TABLE ADD COLUMN` does not touch existing rows.

- [ ] **Step 5: Commit**

---

## Task 3: Pure logic, with tests

The rotation, token and division rules are where a subtle bug is most expensive and hardest to see. They go in their own module with no I/O so they can be tested exhaustively.

**Files:**
- Create: `workers/leads-relay/src/logic.js`, `workers/leads-relay/test/logic.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `normaliseDivision(need, type)`, `divisionLabel(division)`, `nextAssignee(lastOfferedTo)`, `newToken()`, `expiryFrom(iso, ttlMinutes)`, `OTHER`.

- [ ] **Step 1: Write the failing test**

`workers/leads-relay/test/logic.test.js`:

```js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const {
  normaliseDivision, divisionLabel, nextAssignee, newToken, expiryFrom, OTHER,
} = require('../src/logic.js');

test('current division names normalise to themselves', () => {
  assert.strictEqual(normaliseDivision('Energy', 'contact'), 'energy');
  assert.strictEqual(normaliseDivision('Electrical', 'contact'), 'electrical');
  assert.strictEqual(normaliseDivision('Smart', 'contact'), 'smart');
  assert.strictEqual(normaliseDivision('Not sure yet', 'contact'), 'unsure');
});

test('historic names still normalise — 11 existing rows say these', () => {
  assert.strictEqual(normaliseDivision('Solar', 'contact'), 'energy');
  assert.strictEqual(normaliseDivision('Energy management', 'contact'), 'smart');
});

test('a calculator submission is always energy, whatever it carries', () => {
  assert.strictEqual(normaliseDivision(undefined, 'calculator'), 'energy');
  assert.strictEqual(normaliseDivision('Electrical', 'calculator'), 'energy');
});

test('an unrecognised value is unsure, never a guess', () => {
  assert.strictEqual(normaliseDivision('Plumbing', 'contact'), 'unsure');
  assert.strictEqual(normaliseDivision('', 'contact'), 'unsure');
  assert.strictEqual(normaliseDivision(undefined, 'contact'), 'unsure');
});

test('labels are what a director reads', () => {
  assert.strictEqual(divisionLabel('energy'), 'Energy');
  assert.strictEqual(divisionLabel('smart'), 'Smart');
  assert.strictEqual(divisionLabel('unsure'), 'Not sure yet');
});

test('rotation strictly alternates by offer', () => {
  assert.strictEqual(nextAssignee(null), 'stephan');
  assert.strictEqual(nextAssignee('stephan'), 'craig');
  assert.strictEqual(nextAssignee('craig'), 'stephan');
});

test('rotation survives a junk pointer rather than throwing', () => {
  assert.strictEqual(nextAssignee('nobody'), 'stephan');
});

test('OTHER is the reassignment target', () => {
  assert.strictEqual(OTHER.stephan, 'craig');
  assert.strictEqual(OTHER.craig, 'stephan');
});

test('tokens are long, url-safe and not repeated', () => {
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const t = newToken();
    assert.match(t, /^[A-Za-z0-9_-]{43}$/);
    assert.ok(!seen.has(t), 'token repeated');
    seen.add(t);
  }
});

test('expiry is ttl minutes after the given instant, in SQLite format', () => {
  assert.strictEqual(expiryFrom('2026-09-04 08:00:00', 1440), '2026-09-05 08:00:00');
  assert.strictEqual(expiryFrom('2026-09-04 08:00:00', 2), '2026-09-04 08:02:00');
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
node --test workers/leads-relay/test/
```

Expected: `Cannot find module '../src/logic.js'`.

- [ ] **Step 3: Write `src/logic.js`**

```js
'use strict';

/* Pure. No fetch, no D1, no env. Everything here is exhaustively testable,
   which is the point: rotation and expiry bugs are silent and expensive. */

/* Historic spellings map to current divisions. The eleven leads already in
   D1 say "Solar" and "Energy management"; those rows are a record of what
   was submitted, not something to migrate. */
const DIVISIONS = {
  'energy': 'energy',
  'solar': 'energy',
  'electrical': 'electrical',
  'smart': 'smart',
  'energy management': 'smart',
  'not sure yet': 'unsure',
};

const LABELS = {
  energy: 'Energy',
  electrical: 'Electrical',
  smart: 'Smart',
  unsure: 'Not sure yet',
};

const OTHER = { stephan: 'craig', craig: 'stephan' };

/* An unrecognised value becomes 'unsure' rather than a guess. A director
   reading "an Energy enquiry" must be able to trust it came from the form. */
function normaliseDivision(need, type) {
  if (type === 'calculator') return 'energy';
  const key = String(need || '').trim().toLowerCase();
  return DIVISIONS[key] || 'unsure';
}

function divisionLabel(division) {
  return LABELS[division] || LABELS.unsure;
}

/* Strict alternation by offer: the pointer moves every time an offer is
   made, accepted or not. An unrecognised pointer restarts at stephan
   rather than throwing — a corrupt row must not stop leads flowing. */
function nextAssignee(lastOfferedTo) {
  return OTHER[lastOfferedTo] || 'stephan';
}

/* 32 bytes of CSPRNG, base64url, 43 chars. Guessing one is not a threat
   model anyone needs to worry about. */
function newToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* SQLite 'YYYY-MM-DD HH:MM:SS', UTC, matching datetime('now'). */
function expiryFrom(fromIso, ttlMinutes) {
  const t = Date.parse(fromIso.replace(' ', 'T') + 'Z');
  return new Date(t + ttlMinutes * 60000).toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = {
  normaliseDivision, divisionLabel, nextAssignee, newToken, expiryFrom, OTHER, LABELS,
};
```

- [ ] **Step 4: Run the tests until green**

```bash
node --test workers/leads-relay/test/
```

Expected: 10 pass, 0 fail.

- [ ] **Step 5: Add the worker tests to the repo's test script**

`package.json`: `"test": "node --test"` already discovers `**/test/*.test.js`, but confirm the worker tests are picked up:

```bash
npm test 2>&1 | grep -E '^# (tests|pass|fail)'
```

Expected: 43 tests (33 existing + 10 new), 0 fail.

- [ ] **Step 6: Commit**

---

## Task 4: Assign on submit

**Files:**
- Modify: `workers/leads-relay/src/index.js`

**Interfaces:**
- Consumes: `logic.js` exports; `offers`, `rotation` from Task 2.
- Produces: webhook payload now carries `leadId`, `division`, `divisionLabel`, `assignee`, `claimUrl`, `event: 'offer'`.

- [ ] **Step 1: Create the offer atomically with the pointer flip**

R5. Both statements in one `batch()` so two simultaneous submissions cannot read the same pointer:

```js
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
```

`forcedAssignee` is used by the sweeper, which must hand the lead to the *other* person rather than whoever the pointer happens to name.

- [ ] **Step 2: Mark the offer sent only once n8n confirms**

R1. `expires_at` is computed from the moment of the successful send, not from insert:

```js
async function markOffered(env, token) {
  const ttl = Number(env.OFFER_TTL_MINUTES || 1440);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await env.DB.prepare(
    "UPDATE offers SET state='offered', offered_at=?, expires_at=? WHERE token=? AND state='pending_send'"
  ).bind(now, expiryFrom(now, ttl), token).run();
}
```

- [ ] **Step 3: Extend the n8n payload and call `markOffered` on success**

In `deliverToN8n`, include the new fields and, when `res.ok` and the event is an offer, call `markOffered`. The existing `leads` status update stays as it is.

- [ ] **Step 4: Store the division on the lead**

`insertLead` gains a `division` column value from `normaliseDivision(payload.need, type)`.

- [ ] **Step 5: Test against the local D1**

```bash
cd workers/leads-relay
npx --no-install wrangler dev --local &
curl -s -X POST localhost:8787/leads/contact -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"t@example.com","phone":"1","suburb":"X","need":"Electrical"}'
npx --no-install wrangler d1 execute sunlogic-leads --local --json \
  --command "SELECT l.id, l.division, o.assignee, o.round, o.state FROM leads l JOIN offers o ON o.lead_id=l.id;"
```

Expected: one lead, `division` `electrical`, one offer, `round` 1, `state` `pending_send` (no n8n locally, so it never reaches `offered` — which is R1 behaving correctly).

- [ ] **Step 6: Submit twice in the same second and confirm one each**

```bash
for i in 1 2; do curl -s -X POST localhost:8787/leads/contact -H 'Content-Type: application/json' \
  -d '{"name":"T'$i'","email":"t'$i'@example.com","phone":"1","suburb":"X","need":"Energy"}' & done; wait
npx --no-install wrangler d1 execute sunlogic-leads --local --json \
  --command "SELECT assignee, COUNT(*) FROM offers GROUP BY assignee;"
```

Expected: one offer each, not two to the same person.

- [ ] **Step 7: Commit**

---

## Task 5: The claim endpoint

**Files:**
- Create: `workers/leads-relay/src/claim.js`
- Modify: `workers/leads-relay/src/index.js`

- [ ] **Step 1: The page**

`GET` renders this; the inline script submits it immediately. A fetcher that does not run JavaScript sees the `<noscript>` button and changes nothing.

```js
function claimPage(bodyHtml, autoSubmit) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex"/><title>Sunlogic — Enquiry</title>
<style>body{margin:0;background:#FFF7E9;color:#0D2028;
font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px}
.c{max-width:520px;text-align:center}h1{font-size:28px;margin:0 0 12px}
button{font:600 16px/1 inherit;background:#F66F00;color:#fff;border:0;
border-radius:4px;padding:16px 28px;min-height:44px;cursor:pointer}</style></head>
<body><div class="c">${bodyHtml}</div></body></html>`;
}
```

- [ ] **Step 2: `GET /claim/<token>` — render, never mutate**

Look the offer up read-only. If it is claimable, render the auto-submitting form:

```js
const form = `<h1>${label} enquiry</h1><p>Received ${dateStr}.</p>
<form method="POST" id="f"><button type="submit">Accept this enquiry</button></form>
<script>document.getElementById('f').submit()</script>
<noscript><p>Press the button to accept.</p></noscript>`;
```

If it is already accepted, expired or unknown, render that instead — and send no email.

- [ ] **Step 3: `POST /claim/<token>` — the conditional accept**

```js
const res = await env.DB.prepare(
  "UPDATE offers SET state='accepted', accepted_at=datetime('now') " +
  "WHERE token=? AND state='offered' AND (expires_at IS NULL OR datetime('now') < expires_at)"
).bind(token).run();

if (res.meta.changes !== 1) return claimPage(alreadyOrExpiredHtml, false);

await env.DB.prepare('UPDATE leads SET claimed_by=? WHERE id=?').bind(assignee, leadId).run();
ctx.waitUntil(deliverToN8n(env, leadId, type, payload, 'accepted'));
```

`changes !== 1` covers expired, already accepted and unknown token in one check, and guarantees exactly one full email even if both directors click simultaneously.

- [ ] **Step 4: Prove a scanner cannot accept**

```bash
TOKEN=$(npx --no-install wrangler d1 execute sunlogic-leads --local --json \
  --command "SELECT token FROM offers LIMIT 1;" | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['results'][0]['token'])")
curl -s "localhost:8787/claim/$TOKEN" > /dev/null
npx --no-install wrangler d1 execute sunlogic-leads --local --json \
  --command "SELECT state FROM offers WHERE token='$TOKEN';"
```

Expected: still `offered`. **If this says `accepted`, stop — the GET is mutating and the whole design is unsound.**

- [ ] **Step 5: Confirm POST accepts, and only once**

```bash
curl -s -X POST "localhost:8787/claim/$TOKEN" | grep -o 'Accepted' 
curl -s -X POST "localhost:8787/claim/$TOKEN" | grep -o 'already'
```

- [ ] **Step 6: Commit**

---

## Task 6: The expiry sweeper

**Files:**
- Modify: `workers/leads-relay/src/index.js`

- [ ] **Step 1: Sweep, in the cron that already exists**

```js
async function sweepExpiredOffers(env) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM offers WHERE state='offered' AND expires_at IS NOT NULL " +
    "AND datetime('now') >= expires_at"
  ).all();

  for (const offer of results) {
    await env.DB.prepare("UPDATE offers SET state='expired' WHERE id=?").bind(offer.id).run();
    // tell the person who lapsed
    await queueEmail(env, offer.lead_id, 'expired', offer.assignee);
    if (offer.round === 1) {
      const next = await createOffer(env, offer.lead_id, 2, OTHER[offer.assignee]);
      await queueEmail(env, offer.lead_id, 'offer', next.assignee, next.token);
    } else {
      await reviveBothOffers(env, offer.lead_id);   // R2
    }
  }
}
```

Round 2 expiring does not create a round 3. It revives both tokens and starts the repeating alert.

- [ ] **Step 2: R2 — the alert repeats**

```js
async function alertUnclaimed(env) {
  const { results } = await env.DB.prepare(
    "SELECT lead_id, MAX(alerted_at) AS last FROM offers " +
    "WHERE state='offered' AND expires_at IS NULL GROUP BY lead_id"
  ).all();
  for (const r of results) {
    if (r.last && Date.parse(r.last + 'Z') > Date.now() - 86400000) continue;
    await queueEmail(env, r.lead_id, 'unclaimed', 'both');
    await env.DB.prepare(
      "UPDATE offers SET alerted_at=datetime('now') WHERE lead_id=? AND state='offered'"
    ).bind(r.lead_id).run();
  }
}
```

An enquiry cannot fall out of the system by being ignored. This keeps going until someone accepts.

- [ ] **Step 3: Wire both into `scheduled()`** alongside `retryPendingLeads`.

- [ ] **Step 4: Test with a 2-minute TTL**

Set `OFFER_TTL_MINUTES = "2"` in `wrangler.toml` `[vars]` for the local run, submit, wait, and trigger the cron:

```bash
curl -s "localhost:8787/__scheduled?cron=*/5+*+*+*+*"
npx --no-install wrangler d1 execute sunlogic-leads --local --json \
  --command "SELECT round, assignee, state FROM offers ORDER BY id;"
```

Expected: round 1 `expired`, round 2 `pending_send` for the other person.

- [ ] **Step 5: Commit**

---

## Task 7: The daily digest

R3, the dead-man's switch. If this stops arriving, the pipeline is broken — and it is the only signal that survives every other component failing.

**Files:**
- Modify: `workers/leads-relay/src/index.js`, `workers/leads-relay/wrangler.toml`

- [ ] **Step 1: Add a daily cron**

```toml
[triggers]
crons = ["*/5 * * * *", "0 5 * * *"]
```

`05:00` UTC is `07:00` in Cape Town.

- [ ] **Step 2: Build and send the digest**

Counts for the last 24 hours: leads received, accepted, still unclaimed and for how long, and anything `failed`. Send it **whether or not anything is wrong** — a digest that only appears when there is a problem is indistinguishable from a broken digest.

- [ ] **Step 3: Branch `scheduled()` on `event.cron`** so the 5-minute and daily jobs do not both run everything.

- [ ] **Step 4: Commit**

---

## Task 8: Email templates

**Files:**
- Create: `emails/offer-notification.html`, `emails/assignment-full.html`, `emails/offer-expired.html`, `emails/unclaimed-alert.html`, `emails/daily-digest.html`
- Modify: `emails/README.md`
- Delete: `emails/sales-notification.html`

- [ ] **Step 1: Copy `sales-notification.html` to `assignment-full.html`** and change only the addressing line. The field table is already right.

- [ ] **Step 2: Write `offer-notification.html`**

Same navy header, same tokens. Body is the division, the date, and the button. **Assert by reading it: no `{{ $json.name }}`, `.email`, `.phone`, `.suburb`, `.message` or `.property-type` anywhere in the file.**

- [ ] **Step 3: Write the remaining three** in the same style.

- [ ] **Step 4: Prove the teaser leaks nothing**

```bash
grep -nE '\$json\.(name|email|phone|suburb|message|property)' emails/offer-notification.html emails/offer-expired.html emails/unclaimed-alert.html
```

Expected: no output. Any hit is a data leak before acceptance.

- [ ] **Step 5: Update `emails/README.md`** — five templates, which node sends which, and that `sales-notification.html` is retired.

- [ ] **Step 6: Commit**

---

## Task 9: n8n workflow

**iMac change.** Route through the serverMonitor control plane and append a `change-log.jsonl` entry.

**Files:**
- Modify: `n8n/sunlogic-leads-relay.json`, `docs/n8n-workflows.md`

- [ ] **Step 1: Add a Switch on `event`** — `offer`, `accepted`, `expired`, `unclaimed`, `digest` — each to its own Send Email node with the matching template.
- [ ] **Step 2: Point the offer/expired/unclaimed nodes at `{{ $json.assignee }}@sunlogic.co.za`**, and `accepted` at the accepter. Never `sales@` as a recipient.
- [ ] **Step 3: Switch the Sheets node to Append or Update, matching `Lead ID`.**
- [ ] **Step 4: Add the six columns** to the "Sunlogic Leads" sheet: `Lead ID`, `Assigned To`, `Accepted At`, `Reassigned To`, `Reassigned Accepted At`, `Status`.
- [ ] **Step 5: Import, publish, confirm active.**
- [ ] **Step 6: Log the change** in `serverMonitor/change-log.jsonl`.
- [ ] **Step 7: Commit the JSON and the doc.**

---

## Task 10: `leads.sunlogic.co.za`

A `workers.dev` URL in an email to a director reads as phishing and may be filtered outright.

- [ ] **Step 1: Add the custom domain** to the Worker (Cloudflare holds the DNS, so the record is created automatically).
- [ ] **Step 2: Verify** `curl -sI https://leads.sunlogic.co.za/leads/contact` responds.
- [ ] **Step 3: Point `CLAIM_BASE_URL`** at it in `wrangler.toml`.
- [ ] **Step 4: Update `data-webhook`** in the three `contact.html` files and `shared/components.js`, plus the calculator plugin. Then bump the component version again.
- [ ] **Step 5: Confirm the old `workers.dev` URL still answers** — leave it working so a page cached in someone's browser does not break.
- [ ] **Step 6: Commit.**

---

## Task 11: Staging run — the ten tests

`OFFER_TTL_MINUTES=2` so the timing paths are exercisable in one sitting. Every one of these is from the spec.

- [ ] 1. Submit → offer to A only; teaser contains no name, email, phone, suburb or message.
- [ ] 2. Accept → full details to A, and only to A.
- [ ] 3. Let it lapse → expiry notice to A, fresh offer to B, sheet shows both.
- [ ] 4. Let that lapse → both alerted; the alert repeats on the next sweep.
- [ ] 5. Accept from the round-1 link after the round-2 alert → works; B's link then says already taken.
- [ ] 6. Click an accept link twice → second says already accepted; exactly one email.
- [ ] 7. `curl` the claim URL → no acceptance, no email.
- [ ] 8. Two submissions in the same second → one to each director.
- [ ] 9. Stop n8n, submit, restart → offer arrives, and the 24h clock starts then, not at submission.
- [ ] 10. Full round trip with the real mailboxes, confirming nothing lands in spam.

- [ ] **Restore `OFFER_TTL_MINUTES` to 1440 and redeploy.** A staging TTL left in production silently expires every offer in two minutes.

- [ ] **Delete the test rows** from D1 and the sheet, and record which ids were removed.

---

## Task 12: Cut over

- [ ] **Step 1:** Confirm with the human that `sales@` should stop receiving the full notification.
- [ ] **Step 2:** Deploy the Worker.
- [ ] **Step 3:** Watch the first real lead end to end.
- [ ] **Step 4:** Confirm the digest arrives the next morning. **This is the acceptance test for the whole feature** — if it does not arrive, something is broken and everything else was theatre.
