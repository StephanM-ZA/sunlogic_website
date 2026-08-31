# Sunlogic n8n Workflow Setup

n8n instance: `https://n8n.digitaloperations.co.za/`

## Import Workflows

Workflow JSON is in `n8n/`:

- **`sunlogic-leads-relay.json`** — "Sunlogic — Leads Relay". Public webhook
  backing the leads-capture backend for `contact.html` and the solar
  calculator's "email me this report" form. Receives durable-queued lead
  payloads from the Cloudflare Worker at `workers/leads-relay/` (see
  `docs/superpowers/specs/2026-08-31-lead-capture-backend-design.md`), sends
  the relevant emails via Xneelo SMTP, and logs every lead to a Google
  Sheet.

### Import Steps

1. Open n8n at `https://n8n.digitaloperations.co.za/`
2. Go to Workflows > Import from File
3. Import `sunlogic-leads-relay.json`
4. Create the credentials listed below (they are referenced by id/name in
   the JSON but not exported with it)
5. Publish and activate the workflow

## Required Setup

### 1. Credentials

The workflow needs these three credentials to exist before it will run:

| Credential | Type | Notes |
|---|---|---|
| `Sunlogic Leads Relay Secret` | Header Auth | Header name `X-Relay-Secret`, value = the same `RELAY_SECRET` the Cloudflare Worker sends (`workers/leads-relay`, set via `wrangler secret put RELAY_SECRET` — never committed to git). Attached to the Webhook node's own `Authentication: Header Auth` setting — n8n rejects any request with a missing/wrong header before the workflow body runs at all. |
| `Sunlogic Sales SMTP` | SMTP | Xneelo mailbox `sales@sunlogic.co.za` — host `smtp.sunlogic.co.za`, port 465, SSL/TLS on. Password is never stored anywhere but n8n's own credential store. |
| `Google Sheets account` | Google Sheets OAuth2 | Reused from an existing already-connected credential (this session's instance already had one authorized against 3 other workflows) — not created fresh. Points at the "Sunlogic Leads" spreadsheet (id `1V2JNVOV4CqVevuDD1ECcWjpEAEPVJ7JVNR5-CcYnyOo`), header row: `Timestamp | Type | Name | Email | Phone | Need | Bill | Mode | Payback/Pivot System | Cost | Raw JSON`. |

There is no n8n Variable this workflow depends on — the shared secret lives
entirely in the Webhook node's Header Auth credential, not a Variable (see
"Design notes" below for why).

### 2. Activate

After import and credential setup, Publish the workflow and confirm the
top-right status shows **Published**/active. This must stay active — it's
the only thing standing between the Cloudflare Worker's retry queue and a
lead actually reaching a human.

## Flow

```
Webhook (POST /webhook/sunlogic-leads, Header Auth)
  → Extract Body (Code node)
  → Switch on {{ $json.type }}
      ├─ "contact"    → Notify Sales — Contact (email) → Log Contact Lead (Sheet) → Respond 200 — Contact
      └─ "calculator" → Notify Sales — Calculator (email)   ┐
                       → Email Visitor Report (email)        ┴─ both fire in parallel from Switch
                         → Log Calculator Lead (Sheet) → Respond 200 — Calculator
```

**Extract Body.** n8n's Webhook node nests the actual POST payload under
`$json.body` in this instance's configuration rather than exposing it at
the top level. Every downstream node expects `$json.type`, `$json.name`,
etc. directly, so a small Code node normalizes this immediately after the
Webhook: `return items.map(item => ({ json: item.json.body || item.json }))`.
Skipping this step (which happened once, mid-build) makes the Switch match
zero items on every branch — the webhook still returns `200`, just with an
empty body instead of `{"ok":true}`, and no email/Sheet row ever happens.
If this workflow is ever rebuilt from scratch, add this node before the
Switch, not after.

**Why the Log nodes reference `$('Extract Body')`, not `$json`.** Both
"Log Contact Lead" and "Log Calculator Lead" are wired directly after a
Send Email node in their branch. n8n's Send Email node replaces the item's
`$json` with its own SMTP response object (`accepted`, `envelope`,
`messageId`, etc.) rather than passing the original input through — so a
naive `{{ $json.name }}` in the Log node silently resolves to `undefined`
(the node still succeeds, it just writes blank cells). Every lead-data
field in both Log nodes therefore reads from `$('Extract Body').item.json.*`
— the earliest normalized point in the graph — rather than `$json`.

## Shared-secret contract with the Worker

`workers/leads-relay/src/index.js` sends every delivery attempt (both the
fast path and the Cron retry loop) with an `X-Relay-Secret` header set to
its `RELAY_SECRET` binding. The Webhook node's Header Auth credential must
hold the identical value — if they ever drift, every delivery starts
403'ing and leads pile up in D1 with `status='pending'` until the Cron
retry loop eventually marks them `failed` at the attempt ceiling.

## Never called directly by a visitor's browser

This workflow's webhook is only ever invoked by the Cloudflare Worker
(`workers/leads-relay`) — never directly by `contact.html` or the
calculator's report form. The Worker exists specifically so an n8n/iMac
outage can't drop a lead: the browser always hits the Worker first, the
Worker durably queues to D1 before attempting delivery, and only the
Worker (not the browser) knows the shared secret.
