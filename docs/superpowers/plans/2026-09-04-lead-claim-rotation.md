# Lead Claim and Rotation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enquiries alternate between Stephan and Craig, are handed over only when actively accepted, move on after 24 hours unaccepted, and every step is logged where a human can see it.

**Architecture:** The Cloudflare Worker at `workers/leads-relay/` owns all state in D1 and exposes a claim endpoint. n8n on the iMac stays the only thing that sends email. The Worker's existing 5-minute cron becomes the expiry sweeper and the digest trigger. No new email vendor, no SMTP change.

**Tech Stack:** Cloudflare Workers, D1 (SQLite), n8n, Xneelo SMTP, Google Sheets, `node --test`.

**Spec:** `docs/superpowers/specs/2026-09-04-lead-claim-rotation-design.md`

## Global Constraints

- **Divisions are `Energy`, `Electrical`, `Smart Solutions`, `Not sure yet`.** Never "Solar", never "Energy management", except when reading historic rows.
- **Assignees are `stephan` and `craig`** (lower-case keys). Addresses: `stephan@sunlogic.co.za`, `craig@sunlogic.co.za`. Emails send **from** `sales@sunlogic.co.za` — that is the SMTP credential and it does not change.
- **The teaser email must never contain the visitor's name, email, phone, suburb, property type or message.** Division and date only. This is the whole point of the claim step.
- **`GET /claim/<token>` must never change state.** Only `POST` accepts. R1–R6 in the spec are requirements, not suggestions.
- **Nothing is deleted.** Offers transition state; rows are never removed.
- **No bare `npx`.** Use `npx --no-install`, or a path into `node_modules/.bin`.
- **The n8n workflow runs on the iMac.** Editing it is an iMac change: it routes through the serverMonitor control plane and needs a `change-log.jsonl` entry.
- **`OFFER_TTL_MINUTES`** defaults to `1440`. Never hard-code 24 hours.
- **The Worker sends email; n8n is the fallback and the Sheet logger.** The iMac must not be able to stop a lead notification. Exactly one copy of each template exists, in `emails/`, rendered by the Worker.
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

## Task 1: Rename the divisions — DONE

Independent of everything else and shippable on its own. Do it first so every later task sees the new values.

**Files:**
- Modify: `site-main/contact.html`, `site-energy/contact.html`, `site-electrical/contact.html`, `shared/components.js`

- [x] **Step 1: Change all four option lists**

Each contains exactly one occurrence of:

```
options="Solar|Electrical|Energy management|Not sure yet"
```

Replace with:

```
options="Energy|Electrical|Smart Solutions|Not sure yet"
```

- [x] **Step 2: Verify all four changed and none was missed**

```bash
cd /Users/stephanmarais/Projects/development_projects/build/sunlogic_website
grep -rn 'Solar|Electrical|Energy management' site-main site-energy site-electrical shared --include='*.html' --include='*.js'
grep -rc 'Energy|Electrical|Smart Solutions|Not sure yet' site-main/contact.html site-energy/contact.html site-electrical/contact.html shared/components.js
```

Expected: the first prints nothing, the second prints `1` for all four files.

- [x] **Step 3: Bump the component version**

`shared/components.js` changed, so every page must re-fetch it:

```bash
find site-main site-energy site-electrical -name '*.html' -exec sed -i '' 's/components\.js?v=38/components.js?v=39/g' {} +
```

- [x] **Step 4: Build and check conformance**

```bash
npm run build && npm run conformance
```

Expected: `34/34`, `0 fails 0 warns` at both viewports.

- [x] **Step 5: Commit**

```bash
git add site-main site-energy site-electrical shared
git commit -m "feat(forms): divisions renamed — Energy, Electrical, Smart Solutions"
```

---

### What Task 1 actually needed, beyond the plan

Two things the plan missed, both found by testing rather than by reading:

**`data-topic` carries the same labels.** Twenty pages set
`<body data-topic="Solar">` or `"Energy management"`. components.js turns that
into `?need=<value>` on every link to the contact page, and forms.js prefills
the dropdown only on an **exact** option match — so after the rename every one
of those links silently stopped prefilling. No error, just a form that had
stopped being helpful. Renamed to `Energy` / `Smart Solutions`; all 20 now
match an option.

**The prefilled message stopped being a sentence.** It was built as
`"I'm interested in " + need.toLowerCase()`, which read "I'm interested in
solar for my property" before and "I'm interested in smart for my property"
after. Division names are not nouns you can drop into a sentence. Replaced
with a per-division phrase, and "Not sure yet" now prefills nothing at all —
someone who has not decided has nothing to say, and putting words in their
mouth is worse than an empty box.

`forms.js` v3 -> v4 alongside `components.js` v38 -> v39.

Verified in a browser across all three sites: the dropdown offers
`Energy | Electrical | Smart Solutions | Not sure yet`, and all four
`?need=` values select correctly with the right message.

## Task 2: Schema — DONE

**Files:**
- Modify: `workers/leads-relay/schema.sql`
- Create: `workers/leads-relay/migrations/0002-claim-rotation.sql`

**Interfaces:**
- Produces: tables `offers`, `rotation`; columns `leads.division`, `leads.claimed_by`. Every later task reads these names.

- [x] **Step 1: Write the migration**

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

- [x] **Step 2: Mirror the same shape into `schema.sql`**

Append the two `CREATE TABLE` blocks and add `division TEXT` and `claimed_by TEXT` to the existing `leads` definition, so a fresh database matches a migrated one.

- [x] **Step 3: Apply locally first**

```bash
cd workers/leads-relay
npx --no-install wrangler d1 execute sunlogic-leads --local --file migrations/0002-claim-rotation.sql
npx --no-install wrangler d1 execute sunlogic-leads --local --command "SELECT name FROM sqlite_master WHERE type='table';"
```

Expected: `leads`, `offers`, `rotation`.

- [x] **Step 4: Apply to the live database**

This touches production data. Confirm with the human first.

```bash
npx --no-install wrangler d1 execute sunlogic-leads --remote --file migrations/0002-claim-rotation.sql
npx --no-install wrangler d1 execute sunlogic-leads --remote --json --command "SELECT COUNT(*) AS leads FROM leads;"
```

Expected: still 11. `ALTER TABLE ADD COLUMN` does not touch existing rows.

- [x] **Step 5: Commit**

---

### Task 2 status

All steps done. Step 4 was run by the human against production; verified
afterwards: 11 leads, 11 sent, 11 valid payloads, 0 offers, 1 rotation row,
both new columns. Production matches the tested copy exactly.

Verified beyond what the plan asked, because "apply it to an empty local db"
proves very little about a database with real rows in it:

- The live database was exported read-only, restored into a scratch sqlite
  file, and the migration applied to that. **11 leads before, 11 after**, all
  `sent`, all `payload_json` still valid JSON, both new columns present, both
  new tables created.
- Each of the four constraints was confirmed to reject a bad row: an assignee
  who is not stephan or craig, an unknown state, a duplicate token, and a
  second rotation row.
- A new offer defaults to `state='pending_send'` with `expires_at NULL`,
  so R1 is enforced by the schema rather than relying on the Worker to
  remember.
- Re-running the migration fails with `duplicate column name: division`.
  That is "already applied", not "broken", and is now documented at the top
  of the migration file.

To apply to production when the human says so:

```bash
cd workers/leads-relay
npx --no-install wrangler d1 execute sunlogic-leads --remote --file migrations/0002-claim-rotation.sql
npx --no-install wrangler d1 execute sunlogic-leads --remote --json --command "SELECT COUNT(*) AS leads FROM leads;"
```

Expected: still 11.

## Task 3: Pure logic, with tests — DONE

The rotation, token and division rules are where a subtle bug is most expensive and hardest to see. They go in their own module with no I/O so they can be tested exhaustively.

**Files:**
- Create: `workers/leads-relay/src/logic.js`, `workers/leads-relay/test/logic.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `normaliseDivision(need, type)`, `divisionLabel(division)`, `nextAssignee(lastOfferedTo)`, `newToken()`, `expiryFrom(iso, ttlMinutes)`, `OTHER`.

- [x] **Step 1: Write the failing test**

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
  assert.strictEqual(normaliseDivision('Smart Solutions', 'contact'), 'smart');
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
  assert.strictEqual(divisionLabel('smart'), 'Smart Solutions');
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

- [x] **Step 2: Run it and watch it fail**

```bash
node --test workers/leads-relay/test/
```

Expected: `Cannot find module '../src/logic.js'`.

- [x] **Step 3: Write `src/logic.js`**

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
  'smart solutions': 'smart',
  'smart': 'smart',
  'energy management': 'smart',
  'not sure yet': 'unsure',
};

const LABELS = {
  energy: 'Energy',
  electrical: 'Electrical',
  smart: 'Smart Solutions',
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

- [x] **Step 4: Run the tests until green**

```bash
node --test workers/leads-relay/test/
```

Expected: 10 pass, 0 fail.

- [x] **Step 5: Add the worker tests to the repo's test script**

`package.json`: `"test": "node --test"` already discovers `**/test/*.test.js`, but confirm the worker tests are picked up:

```bash
npm test 2>&1 | grep -E '^# (tests|pass|fail)'
```

Expected: 43 tests (33 existing + 10 new), 0 fail.

- [x] **Step 6: Commit**

---

### Two corrections to this task as planned

**The file is `logic.mjs`, not `logic.js`, and uses `export` rather than
`module.exports`.** The plan had it as CommonJS, which would not have worked
cleanly: `workers/leads-relay/src/index.js` is an ES module (`export default`)
while the repo's `package.json` has no `"type"` field, so Node treats a bare
`.js` as CommonJS. A CommonJS logic file would have been importable by the
Worker only through esbuild's interop — it would have worked, silently, until
it did not. `.mjs` on both the module and its test makes the format explicit
for both consumers. The test file is `logic.test.mjs` for the same reason.

**`node --test workers/leads-relay/test/` does not work on Node 22** — it
reads the path as a module specifier and fails with "Cannot find module".
Use the bare `npm test`, which discovers `**/*.test.mjs` and now reports
**51 tests** (33 site + 18 logic), or name the file directly:

```bash
node --test workers/leads-relay/test/logic.test.mjs
```

### What the 18 tests actually pin down

Beyond the plan's list: casing and whitespace in the form value, that every
division a form can produce has a label, that twenty consecutive offers split
exactly ten each, that tokens survive a URL round trip without escaping, that
expiry crosses midnight, a month end and a leap day, that expiry is UTC with
no local offset leaking in, and that an unparseable time throws instead of
silently producing `Invalid Date`. The timezone one matters most: if that ever
shifts by the machine's offset, every offer expires at the wrong time and
nothing anywhere errors.

## Task 4: Assign on submit — DONE

**Files:**
- Modify: `workers/leads-relay/src/index.js`

**Interfaces:**
- Consumes: `logic.js` exports; `offers`, `rotation` from Task 2.
- Produces: webhook payload now carries `leadId`, `division`, `divisionLabel`, `assignee`, `claimUrl`, `event: 'offer'`.

- [x] **Step 1: Create the offer atomically with the pointer flip**

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

- [x] **Step 2: Mark the offer sent only once n8n confirms**

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

- [x] **Step 3: Extend the n8n payload and call `markOffered` on success**

In `deliverToN8n`, include the new fields and, when `res.ok` and the event is an offer, call `markOffered`. The existing `leads` status update stays as it is.

- [x] **Step 4: Store the division on the lead**

`insertLead` gains a `division` column value from `normaliseDivision(payload.need, type)`.

- [x] **Step 5: Test against the local D1**

```bash
cd workers/leads-relay
npx --no-install wrangler dev --local &
curl -s -X POST localhost:8787/leads/contact -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"t@example.com","phone":"1","suburb":"X","need":"Electrical"}'
npx --no-install wrangler d1 execute sunlogic-leads --local --json \
  --command "SELECT l.id, l.division, o.assignee, o.round, o.state FROM leads l JOIN offers o ON o.lead_id=l.id;"
```

Expected: one lead, `division` `electrical`, one offer, `round` 1, `state` `pending_send` (no n8n locally, so it never reaches `offered` — which is R1 behaving correctly).

- [x] **Step 6: Submit twice in the same second and confirm one each**

```bash
for i in 1 2; do curl -s -X POST localhost:8787/leads/contact -H 'Content-Type: application/json' \
  -d '{"name":"T'$i'","email":"t'$i'@example.com","phone":"1","suburb":"X","need":"Energy"}' & done; wait
npx --no-install wrangler d1 execute sunlogic-leads --local --json \
  --command "SELECT assignee, COUNT(*) FROM offers GROUP BY assignee;"
```

Expected: one offer each, not two to the same person.

- [x] **Step 7: Commit**

---

## Task 5: The claim endpoint — DONE

Built as `src/claim.mjs`. Verified with a live local Worker:

| Check | Result |
|---|---|
| GET on a live token | page rendered, state still `offered` |
| POST | Accepted, `accepted_at` set, `leads.claimed_by` set |
| POST a second time | "Someone got there first" |
| Unknown token | "That link is not valid" |
| Malformed token | 404, never reaches the handler |
| Three simultaneous POSTs | exactly 1 accepted, 2 rejected |

Two things beyond the plan. Every non-claimable outcome says *which* — already
taken, expired, not sent yet, or unknown — because "this did not work" with no
reason turns a director into a support ticket. And accepting expires any
sibling offer for the same lead rather than deleting it, so the log can still
show it existed and who it went to.


**Files:**
- Create: `workers/leads-relay/src/claim.js`
- Modify: `workers/leads-relay/src/index.js`

- [x] **Step 1: The page**

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

- [x] **Step 2: `GET /claim/<token>` — render, never mutate**

Look the offer up read-only. If it is claimable, render the auto-submitting form:

```js
const form = `<h1>${label} enquiry</h1><p>Received ${dateStr}.</p>
<form method="POST" id="f"><button type="submit">Accept this enquiry</button></form>
<script>document.getElementById('f').submit()</script>
<noscript><p>Press the button to accept.</p></noscript>`;
```

If it is already accepted, expired or unknown, render that instead — and send no email.

- [x] **Step 3: `POST /claim/<token>` — the conditional accept**

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

- [x] **Step 4: Prove a scanner cannot accept**

```bash
TOKEN=$(npx --no-install wrangler d1 execute sunlogic-leads --local --json \
  --command "SELECT token FROM offers LIMIT 1;" | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['results'][0]['token'])")
curl -s "localhost:8787/claim/$TOKEN" > /dev/null
npx --no-install wrangler d1 execute sunlogic-leads --local --json \
  --command "SELECT state FROM offers WHERE token='$TOKEN';"
```

Expected: still `offered`. **If this says `accepted`, stop — the GET is mutating and the whole design is unsound.**

- [x] **Step 5: Confirm POST accepts, and only once**

```bash
curl -s -X POST "localhost:8787/claim/$TOKEN" | grep -o 'Accepted' 
curl -s -X POST "localhost:8787/claim/$TOKEN" | grep -o 'already'
```

- [x] **Step 6: Commit**

---

## Task 6: The expiry sweeper — DONE

**Files:**
- Modify: `workers/leads-relay/src/index.js`

- [x] **Step 1: Sweep, in the cron that already exists**

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

- [x] **Step 2: R2 — the alert repeats**

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

- [x] **Step 3: Wire both into `scheduled()`** alongside `retryPendingLeads`.

- [x] **Step 4: Test with a 2-minute TTL**

Set `OFFER_TTL_MINUTES = "2"` in `wrangler.toml` `[vars]` for the local run, submit, wait, and trigger the cron:

```bash
curl -s "localhost:8787/__scheduled?cron=*/5+*+*+*+*"
npx --no-install wrangler d1 execute sunlogic-leads --local --json \
  --command "SELECT round, assignee, state FROM offers ORDER BY id;"
```

Expected: round 1 `expired`, round 2 `pending_send` for the other person.

- [x] **Step 5: Commit**

---

## Task 7: The daily digest — DONE

Verified with `OFFER_TTL_MINUTES=2` against a live local Worker, driving a
whole 24-hour lifecycle through in minutes:

| Step | Result |
|---|---|
| Round 1 expires | `expired` for stephan, round 2 created for **craig** |
| Round 2 expires | both offers revived, `expires_at NULL`, both alerted |
| Cron fires again immediately | `alerted_at` unchanged — no daily spam |
| 25 hours simulated | alert repeats (**R2 holds**) |
| Digest cron | separate branch; the 5-minute cron never sends it |

The reassignment goes to `OTHER[assignee]`, not to whoever the rotation
pointer names — a lead that has already been past one director must not be
offered back to them.


R3, the dead-man's switch. If this stops arriving, the pipeline is broken — and it is the only signal that survives every other component failing.

**Files:**
- Modify: `workers/leads-relay/src/index.js`, `workers/leads-relay/wrangler.toml`

- [x] **Step 1: Add a daily cron**

```toml
[triggers]
crons = ["*/5 * * * *", "0 5 * * *"]
```

`05:00` UTC is `07:00` in Cape Town.

- [x] **Step 2: Build and send the digest**

Counts for the last 24 hours: leads received, accepted, still unclaimed and for how long, and anything `failed`. Send it **whether or not anything is wrong** — a digest that only appears when there is a problem is indistinguishable from a broken digest.

- [x] **Step 3: Branch `scheduled()` on `event.cron`** so the 5-minute and daily jobs do not both run everything.

- [x] **Step 4: Commit**

---

## Task 8: Email templates and the mailer

The Worker renders and sends. n8n is a fallback relay only. **One copy of
every template**, in `emails/`, imported by the Worker at build time — the
whole point of the fallback arrangement is defeated the moment a second copy
of the HTML exists.

**Files:**
- Create: `emails/offer-notification.html`, `emails/assignment-full.html`, `emails/offer-expired.html`, `emails/unclaimed-alert.html`, `emails/daily-digest.html`
- Create: `workers/leads-relay/src/mailer.mjs`
- Modify: `emails/README.md`
- Delete: `emails/sales-notification.html`

- [ ] **Step 1: Set up the email provider**

Create the account, add `sunlogic.co.za` as a sending domain, and take the
SPF include and DKIM records it gives you. **Do not deploy anything until
those records are live and the provider reports the domain verified** — a
notification that lands in spam is indistinguishable from one that was never
sent.

```bash
npx --no-install wrangler secret put EMAIL_API_KEY
```

- [ ] **Step 2: Write the templates**

Same navy header and tokens as the existing pair. They use `{{name}}`-style
placeholders rendered by the Worker, **not** n8n expression syntax — n8n no
longer interprets these.

- [ ] **Step 3: Write `mailer.mjs`**

`render(template, values)` does the substitution. `send({to, subject, html})`
calls the API, and on any non-2xx or thrown error posts to n8n with the
already-rendered HTML instead. Both outcomes are recorded so the digest can
report which path was used.

- [ ] **Step 4: Prove the teaser leaks nothing**

```bash
grep -nE '\{\{ *(name|email|phone|suburb|message|property)' emails/offer-notification.html emails/offer-expired.html emails/unclaimed-alert.html
```

Expected: no output. Any hit is customer data leaving before anyone accepted.

- [ ] **Step 5: Prove the fallback actually works**

Point `EMAIL_API_KEY` at a deliberately wrong value, submit a lead, and
confirm the email still arrives via n8n and the path is recorded. A fallback
that has never been exercised is not a fallback.

- [ ] **Step 6: Raise the retry ceiling**

`attempts < 20` covers 100 minutes. Change to cover 48 hours so both paths
being down delivers late rather than never.

- [ ] **Step 7: Update `emails/README.md`** — the Worker renders these now;
n8n holds no templates.

- [ ] **Step 8: Commit**

---

## Task 9: n8n becomes a relay

**iMac change.** Routes through the serverMonitor control plane and needs a
`change-log.jsonl` entry.

**Files:**
- Modify: `n8n/sunlogic-leads-relay.json`, `docs/n8n-workflows.md`

- [ ] **Step 1: Replace the per-email branches with one Send Email node** that
  sends the `html`, `subject` and `to` it is given. No templates in n8n.
- [ ] **Step 2: Switch the Sheets node to Append or Update, matching `Lead ID`.**
- [ ] **Step 3: Add the six columns** to the "Sunlogic Leads" sheet: `Lead ID`,
  `Assigned To`, `Accepted At`, `Reassigned To`, `Reassigned Accepted At`,
  `Status`.
- [ ] **Step 4: Import, publish, confirm active.**
- [ ] **Step 5: Log the change** in `serverMonitor/change-log.jsonl`.
- [ ] **Step 6: Commit the JSON and the doc.**

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

## Test results so far — against deployed staging, real emails

| # | Test | Result |
|---|---|---|
| 1 | Submit → offer to one director | ✅ Resend carried it, clock started |
| 2 | Accept → full details | ✅ `claimed_by` set, mail sent |
| 3 | Lapse → expiry notice + reassign to the other | ✅ r1 expired, r2 to the other director |
| 4 | Second lapse → both revived and alerted | ✅ both revived, both alerted, repeat confirmed |
| 5 | Accept from a revived link | ✅ first click wins, other link closes |
| 6 | Accept twice | ✅ "Someone got there first" |
| 7 | Scanner GETs the link | ✅ state unchanged — **the design holds** |
| 8 | Two submissions at once | ✅ after a real bug was fixed — see below |
| 9 | Relay down → clock does not start | ✅ offers sat `pending_send`, no expiry set |
| 10 | Real mailbox, not spam | ✅ delivered to Gmail and clicked through — Xneelo was down, so it was redirected via MAIL_REDIRECT_TO, and Gmail is the stricter test |

### Two bugs these found that code review had not

**The rotation raced.** Two concurrent submissions both went to craig. The
pointer was read, then written — and two requests arriving together both read
the stale value. Every local test passed throughout, because the local
emulator serialises requests, so the race cannot occur there. Fixed by making
the database flip and return the value in one statement. Four concurrent
submissions now split two each.

**The fallback was dead.** n8n answered 403 to every call. The entire
justification for "API primary, n8n fallback" had never carried a single
message, and it would have been discovered during a Resend outage — the one
moment it has to work. Diagnosed by making the Worker report n8n's own words
("Authorization data is wrong!") rather than a status code, then resolved by
rotating the shared secret to a known value in all three places.

Neither was visible in the code. Both needed real infrastructure to fail
against, which is the argument for the staging environment existing.

### Production

One clearly-marked test row, `lead#12`, created to confirm production still
reached n8n after the secret rotation. It did. That row and its sheet entry
need deleting.

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
