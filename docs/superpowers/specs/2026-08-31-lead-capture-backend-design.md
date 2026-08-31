# Lead Capture Backend — Design Spec

**Status:** Approved by user in chat (architecture + hosting decisions), pending written-spec review.
**Author:** Claude (session), for Stephan Marais.
**Trigger:** User asked where contact-form and calculator-report submissions
are saved, whether an email gets sent, to whom, and how — the honest answer
was "nowhere, and no" (both point at `webhook="PENDING_BACKEND"`, which
no-ops). User then asked for a real backend, with one explicit hard
requirement: it must keep working even when the iMac (and the n8n instance
running on it) is down.

## 1. Overview

Two existing frontend forms already have a working POST-to-webhook
mechanism, just no real URL behind it:

- The main contact form on `contact.html` (`site-daylight/shared/forms.js`,
  `data-webhook` attribute) — name/email/phone/suburb/need/property-type/message.
- The calculator's optional "email me this report" form on both
  `plugin-calculator` instances on `solar.html`
  (`plugins/calculator/calculator.js`, `webhook` attribute) —
  mode/inputs/results/email/timestamp.

This spec adds a real backend behind that same `webhook` attribute
mechanism — no frontend logic changes beyond swapping the placeholder URL
for a real one. The backend has two tiers, each solving a different half
of the problem:

1. **Cloudflare Worker + D1** — genuinely separate infrastructure from the
   iMac. Durably persists every submission the instant it arrives and
   responds to the browser immediately. This is the piece that makes "the
   iMac is down" a non-event for the visitor.
2. **n8n (on the iMac)** — does the actual work once reachable: sends
   email via Xneelo SMTP (`sales@sunlogic.co.za`), and logs a row to a
   Google Sheet for easy day-to-day browsing.

The Worker never blocks on n8n. It tries immediately (fast path when
everything is healthy), and a Cron Trigger retries anything still pending
every ~5 minutes — the literal "poll until n8n is active" behavior that
was asked for.

## 2. Goals

- No lead is ever silently dropped, even if n8n / the iMac / Xneelo SMTP /
  Google Sheets are all down at the moment of submission.
- The visitor sees a real success confirmation the instant their data is
  durably stored — not after a round-trip through n8n and an email
  provider.
- Contact-form leads notify Sunlogic (`sales@sunlogic.co.za`). Calculator
  leads notify Sunlogic **and** email the visitor their own estimate.
- Every lead is logged somewhere a non-technical person can actually open
  and read (a Google Sheet), not just a database only reachable via SQL.
- The durable queue and n8n workflow are visible/debuggable: each lead
  tracks status (`pending` / `sent` / `failed`), attempt count, and the
  last error, so a stuck lead can be diagnosed, not just guessed at.
- Reuse the existing frontend `webhook` attribute mechanism as-is — zero
  changes to `forms.js` or `calculator.js` beyond the URL each page
  points them at.

## 3. Non-goals

- No CRM integration — Sunlogic doesn't have one yet. The Google Sheet is
  the interim "CRM."
- No rate limiting or bot-detection beyond what already exists
  (client-side honeypot fields in both forms, which already prevent the
  `fetch` call from firing at all when triggered) — worth adding later if
  spam becomes a real problem, not before.
- No retry UI for the visitor — they see one success state; all retry
  logic is invisible, server-side, on the Worker/Cron side.
- No changes to the calculator's own math, UI, or the contact form's
  fields — this spec is purely "what happens to the data after submit."
- Not building a general-purpose form backend for future forms beyond
  these two specific ones, though the D1 schema is generic enough
  (`type` + `payload_json`) that adding a third form later means a new
  Worker route and an n8n branch, not a redesign.

## 4. Architecture

```
Browser (contact.html form / calculator "email me this")
   │  POST JSON  →  webhook="https://sunlogic-leads.<account>.workers.dev/leads/{contact|calculator}"
   ▼
Cloudflare Worker
   │  1. Validate shape, reject junk
   │  2. INSERT into D1 leads table, status='pending'
   │  3. Respond 200 to browser IMMEDIATELY (durability achieved — done)
   │  4. Fire-and-forget: try POSTing to n8n's webhook right now (fast path)
   ▼
Cloudflare D1 (leads table — see §6)
   ▲
   │  every ~5 min, for any status='pending' row:
   │  retry POST to n8n; mark 'sent' on 2xx, bump attempts + last_error on failure
Cloudflare Cron Trigger (scheduled Worker invocation)
   │
   ▼
n8n webhook (iMac, only reachable once healthy)
   │  validates X-Relay-Secret header matches a shared secret
   │  (both sides hold it — Worker as a secret binding, n8n as a Variable,
   │  same pattern already used for voltiq_api_key)
   ├─ Switch on `type`:
   │    "contact"    → send email to sales@sunlogic.co.za (§8.1)
   │    "calculator" → send email to sales@sunlogic.co.za (§8.2)
   │                    AND email the visitor their report (§8.3)
   └─ Append one row to a Google Sheet (§9)
   │  respond 200 back to whichever caller invoked it (Worker's fast-path
   │  POST, or the Cron retry) so it can mark the D1 row 'sent'
```

**Why this order of operations matters:** step 3 (respond to the browser)
happens *before* step 4 (talk to n8n). The browser's success state depends
only on the Worker + D1, which is Cloudflare's infrastructure, not the
iMac's. n8n being unreachable at that instant changes nothing the visitor
sees — it just means the Cron Trigger's next pass is what actually
delivers the email, a few minutes later instead of immediately.

**iMac change-control note:** only the n8n workflow (right-hand side of
the diagram above) touches the iMac. That piece gets built the same way
this session already built the VoltIQ poll-cadence change — coordinated
through `serverMonitor`, logged in its `change-log.jsonl`. The Cloudflare
Worker, D1 database, and Cron Trigger are not iMac infrastructure at all
and don't need that process.

## 5. Components

### 5.1 Cloudflare Worker

One Worker, two routes, sharing the same D1 binding and insert logic:

- `POST /leads/contact` — body shape from `forms.js`'s `dlInitForm`
  (§7.1). Sets `type='contact'`.
- `POST /leads/calculator` — body shape from `calculator.js`'s
  `_wireGate` (§7.2). Sets `type='calculator'`.

Both routes:
1. Parse JSON; reject (400) if it doesn't parse or is missing required
   fields: `/leads/contact` requires `name` and `email`; `/leads/calculator`
   requires `mode` (must be `"residential"` or `"sme"`) and `email`.
2. Insert a row into `leads` (§6), `status='pending'`.
3. Respond `200 {"ok": true}` to the browser.
4. `ctx.waitUntil(...)` a fire-and-forget attempt to POST the row's
   payload to n8n's webhook URL, with the shared secret header. On 2xx,
   update that row to `status='sent'`. On failure (network error,
   non-2xx, timeout), leave it `pending` and increment `attempts` +
   record `last_error` — the Cron Trigger will pick it up.

CORS: allow the site's real origin(s) only (`https://sunlogic.co.za` once
deployed; a `localhost`/dev origin can be added temporarily during
testing) — not a wildcard, since this endpoint accepts form data.

### 5.2 Cloudflare D1 — `leads` table

```sql
CREATE TABLE leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT NOT NULL CHECK (type IN ('contact', 'calculator')),
  payload_json  TEXT NOT NULL,       -- the exact JSON body received
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  attempts      INTEGER NOT NULL DEFAULT 0,
  last_error    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_attempt_at TEXT
);
CREATE INDEX idx_leads_status ON leads(status);
```

`status='failed'` is reserved for a row that has exceeded a retry ceiling
(§5.3) — it stops the Cron Trigger from retrying forever, and is a signal
something needs a human look (e.g., n8n's workflow itself is broken, not
just temporarily down).

### 5.3 Cron Trigger (retry/poll)

A Worker scheduled handler, `*/5 * * * *` (every 5 minutes):

1. `SELECT * FROM leads WHERE status='pending' AND attempts < 20`
   (20 attempts × 5 min ≈ 100 minutes of retrying before giving up
   automatically — long enough to ride out a deploy or a crash-loop, short
   enough that a genuinely broken workflow gets flagged same-day).
2. For each: retry the POST to n8n exactly like the fast path did.
3. On success: `status='sent'`. On failure: `attempts += 1`,
   `last_error = ...`, `last_attempt_at = now()`. If this failure pushes
   `attempts` to 20, set `status='failed'` instead of leaving it
   `pending` forever.

### 5.4 n8n workflow — `sunlogic-leads-relay`

New workflow, new file: `n8n/sunlogic-leads-relay.json` in this repo
(mirroring VoltIQ's own convention of keeping its n8n workflow JSON in its
own repo even though the workflows run on the shared iMac n8n instance).

```
Webhook (POST /webhook/sunlogic-leads)
  → Validate X-Relay-Secret header (Code node; 401 if mismatched)
  → Switch on $json.type
      "contact"    → Send Email (sales notification, §8.1)
                     → Append row to Google Sheet (§9)
      "calculator" → Send Email (sales notification, §8.2)
                     → Send Email (visitor's report, §8.3)
                     → Append row to Google Sheet (§9)
  → Respond 200
```

SMTP credential: n8n's built-in Send Email node, configured once with
`sales@sunlogic.co.za`'s Xneelo SMTP credentials (host/port/username/
password — obtained from Xneelo's control panel or existing mail client
settings, entered directly into n8n's credential store, never through
this chat).

### 5.5 Frontend changes

Exactly two attribute values change, once real endpoints exist:

```diff
- <form data-dl-form data-webhook="PENDING_BACKEND" class="sl-form">
+ <form data-dl-form data-webhook="https://sunlogic-leads.<account>.workers.dev/leads/contact" class="sl-form">
```

```diff
- <plugin-calculator mode="residential" webhook="PENDING_BACKEND"></plugin-calculator>
+ <plugin-calculator mode="residential" webhook="https://sunlogic-leads.<account>.workers.dev/leads/calculator"></plugin-calculator>
```

(same for the `mode="sme"` instance). `<account>` above is a genuine
unknown, not an oversight — Cloudflare assigns the real `*.workers.dev`
subdomain (or this could be mapped to a custom domain, e.g.
`leads.sunlogic.co.za`) only once the Worker is actually created during
implementation; both HTML edits get the real URL substituted in at that
point. No changes to `forms.js` or
`calculator.js` — both already do exactly the right thing once a real URL
is present (`fetch(webhook, {...})`, treat any non-2xx as an error).

One behavior change worth calling out: today, `forms.js`'s "unconfigured
webhook" branch calls `done()` (redirect to `thank-you.html`)
unconditionally. Once real, `done()` only fires after the Worker responds
`200` — still effectively instant (the Worker's response doesn't wait on
n8n), but it is a real network round-trip now, not a no-op. Same for the
calculator's "Sent — we'll email that report shortly" status text.

## 6. Data Flow / Payload Shapes (as already sent by the frontend today)

### 6.1 Contact form → `POST /leads/contact`

```json
{
  "name": "string", "email": "string", "phone": "string",
  "suburb": "string", "need": "Solar|Electrical|Energy management|Not sure yet",
  "property-type": "Home|Small business|Larger site", "message": "string"
}
```

### 6.2 Calculator → `POST /leads/calculator`

```json
{
  "mode": "residential" | "sme",
  "inputs": { "bill": number, "operatingHoursPerWeek"?: number, "includeBattery": boolean },
  "results": { /* full calculateResidential() or calculateSme() output — see plugins/calculator/calculator-math.js */ },
  "email": "string",
  "timestamp": "ISO 8601 string"
}
```

## 7. Shared Secret

A single random secret (e.g. `openssl rand -hex 32`), stored as:
- A Cloudflare Worker **secret binding** (`RELAY_SECRET`), never in
  source.
- An n8n **Variable**, same pattern as the existing `voltiq_api_key`
  (Settings → Variables).

The Worker sends it as `X-Relay-Secret` on every call to n8n; n8n's
webhook workflow rejects (401) anything without a matching header. This
means the n8n webhook URL can be technically public without being
practically abusable — only the Worker (holding the secret) can get it to
actually do anything.

## 8. Email Content

All three emails below are real, final copy — not placeholders — matching
the site's existing direct, unembellished tone. Sunlogic can edit freely;
these ship as the actual n8n node content, not a draft to fill in later.

### 8.1 Sales notification — contact form

**To:** sales@sunlogic.co.za · **From:** sales@sunlogic.co.za · **Subject:** New enquiry — {{name}} ({{need}})

```
New enquiry from the website.

Name:       {{name}}
Email:      {{email}}
Phone:      {{phone}}
Suburb:     {{suburb}}
Needs:      {{need}}
Property:   {{property-type}}

Message:
{{message}}

—
Submitted {{timestamp}} via the contact form on sunlogic.co.za.
```

### 8.2 Sales notification — calculator lead

**To:** sales@sunlogic.co.za · **From:** sales@sunlogic.co.za · **Subject:** Calculator lead — {{mode}}, R{{inputs.bill}}/month

```
Someone ran the {{mode}} calculator and asked for their estimate emailed
to them — this is a warm lead, not a cold form fill.

Their email:      {{email}}
Monthly bill:     R{{inputs.bill}}
{{#if inputs.operatingHoursPerWeek}}Operating hours: {{inputs.operatingHoursPerWeek}}/week{{/if}}
Battery included: {{inputs.includeBattery}}

Their estimate:
  System size:      {{results.panelKw}} kW panels, {{results.inverterKw}} kW inverter
  Battery:           {{results.batteryKwh}} kWh
  Estimated cost:    R{{results.systemCost}}
{{#if mode == "residential"}}
  Payback:           {{results.paybackYearsLow}}-{{results.paybackYearsHigh}} years
  First-year saving: R{{results.firstYearSavings}}
{{else}}
  Monthly saving:    R{{results.monthlySavings}}
  Monthly installment: R{{results.monthlyInstallment}}
  Monthly cash flow: R{{results.pivot}}
{{/if}}

They've also been sent a copy of this estimate by email — worth reaching
out while it's fresh.

—
Submitted {{timestamp}}.
```

### 8.3 Visitor's own report

**To:** {{email}} · **From:** sales@sunlogic.co.za · **Subject:** Your Sunlogic solar estimate

```
Hi,

Here's the estimate you asked for, based on a R{{inputs.bill}}/month bill{{#if inputs.operatingHoursPerWeek}} and {{inputs.operatingHoursPerWeek}} operating hours a week{{/if}}:

  Recommended panels:   {{results.panelKw}} kW
  Recommended inverter: {{results.inverterKw}} kW
  Battery storage:      {{results.batteryKwh}} kWh{{#unless inputs.includeBattery}} (not included in this estimate){{/unless}}
  Estimated system cost: R{{results.systemCost}}

{{#if mode == "residential"}}
  Estimated monthly saving: R{{results.firstYearSavings divided by 12}}
  Typical payback period:   {{results.paybackYearsLow}}-{{results.paybackYearsHigh}} years
{{else}}
  Estimated monthly saving:     R{{results.monthlySavings}}
  Estimated monthly installment: R{{results.monthlyInstallment}}
  Estimated monthly cash flow:   R{{results.pivot}}
{{/if}}

  ~{{results.annualCo2Kg / 1000}} tons of CO2 avoided per year — roughly
  the same as {{results.treesEquivalent}} trees planted.

Figures are indicative estimates based on typical Western Cape conditions
and standard industry assumptions — not a formal system design or finance
offer. A site visit turns this into an actual number, and costs you
nothing to book.

Book a free site assessment: https://sunlogic.co.za/contact.html
Or call us directly: +27 (82) 655 5371

— The Sunlogic team
```

(Exact templating syntax — Handlebars-style `{{}}` above is illustrative;
n8n's own expression syntax, `={{ $json.field }}`, is what actually goes
into the Send Email node, following the same pattern already used in
`n8n/voltiq-fleet-live-webhook.json`'s HTTP nodes.)

## 9. Google Sheet Logging

One sheet, one tab, columns: `Timestamp | Type | Name | Email | Phone |
Need | Bill | Mode | Payback/Pivot | System Cost | Raw JSON`. Populated
by an n8n Google Sheets node (Append Row), same branch that sends the
emails. Requires a Google account to own the sheet and grant n8n's Google
Sheets credential access to it (§11, open item).

## 10. Error Handling Summary

| Failure point | What happens |
|---|---|
| Cloudflare Worker itself down | Extremely unlikely (Cloudflare's own infrastructure); if it happened, the browser's `fetch` fails and the existing `dlFormError`/console.warn paths in `forms.js`/`calculator.js` show the visitor "Something went wrong — please call us instead." |
| D1 write fails | Worker responds non-2xx; same visitor-facing error path as above. This is the one true failure mode with no safety net — treated as acceptable given Cloudflare D1's own durability guarantees. |
| n8n / iMac down at submission time | Invisible to the visitor. Row stays `pending`; Cron Trigger retries every 5 min for up to ~100 min. |
| n8n reachable but the workflow itself errors (bad SMTP creds, Sheets auth expired, etc.) | Same retry path, but will keep failing every 5 min until attempts hit 20 and the row flips to `failed` — a signal the workflow itself needs fixing, not just "wait for the iMac to come back." |
| Xneelo SMTP temporarily rejects (rate limit, etc.) | n8n's Send Email node failing counts as a non-2xx response from n8n's perspective (workflow error) — same as the row above; retried by the Cron Trigger regardless of which step inside n8n failed. |

## 11. Open Items — Access Needed From User

None of these are design decisions — they're accounts/credentials I need
access to before this can actually be built and deployed (not pasted into
chat; entered directly into the relevant tool's own credential store):

1. **Cloudflare account** — to create the Worker, D1 database, and Cron
   Trigger. New or existing account, whichever you have.
2. **Google account** to own the lead-log Sheet, and to authorize n8n's
   Google Sheets credential against it.
3. **Xneelo SMTP credentials** for `sales@sunlogic.co.za` (host, port,
   username, password) — for n8n's Send Email node. Host/port are
   whatever Xneelo's mail hosting documents for your specific plan; I
   won't guess these.

## 12. Testing Plan

1. **Happy path, both forms:** submit each with n8n healthy — confirm a
   D1 row lands `status='sent'` within seconds, both emails arrive with
   correctly-populated content, and a Sheet row appears.
2. **n8n-down simulation:** temporarily deactivate the `sunlogic-leads-relay`
   workflow in n8n, submit both forms, confirm: the browser still gets an
   immediate success response and redirect/confirmation; the D1 row sits
   `pending`; reactivating the workflow and waiting for the next Cron
   tick delivers the email/Sheet row without re-submission.
3. **Malformed payload:** POST garbage JSON directly to both Worker
   routes (bypassing the frontend) — confirm 400, no D1 row created.
4. **Shared secret:** POST directly to n8n's webhook URL without the
   `X-Relay-Secret` header — confirm 401, no email sent.
5. **Retry ceiling:** manually set a test row's `attempts` to 19 and let
   one more Cron tick fail it (e.g., by pointing at a temporarily wrong
   n8n URL) — confirm it flips to `status='failed'` and the Cron stops
   retrying it.
6. **CORS:** confirm a request from an unexpected origin is rejected by
   the Worker.
