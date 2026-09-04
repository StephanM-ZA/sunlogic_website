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
  → Extract Body        normalise the Worker's payload
  → Log Row             append-or-update on Lead ID, ALWAYS
  → Needs sending?      branch on needsSend
      true  → Relay Send → Respond 200      (Resend failed; n8n sends)
      false →             Respond 200       (Resend already sent it)
```

Six nodes, down from ten. n8n holds no templates and makes no decisions about
content: it addresses an envelope it was handed, and it writes a row.

## Why it looks like this

**The Worker sends; n8n is the fallback.** Every notification used to depend
on this machine being switched on, and the Worker's retry queue gave up after
100 minutes — an iMac off overnight silently lost leads. Sending moved to
Resend, called directly from the Worker on Cloudflare.

**But n8n still writes the sheet, and that nearly broke the audit trail.**
With Resend primary, n8n is only reached when Resend *fails*. Every successful
lead would have gone unlogged, and the sheet would have contained nothing but
outages — empty precisely when everything was working. So a successful send is
still announced here with `needsSend: false`: log this, do not send it.

**Log Row comes before the branch, and never blocks the email.** The row is
written whichever path the mail took, and `onError: continueRegularOutput`
means a Sheets failure does not stop `Relay Send`. Logging is the lesser duty:
losing a row costs a line in a spreadsheet, losing an email costs a lead.

**`needsSend` defaults to true when absent.** An older Worker, or a replayed
request, keeps the previous behaviour rather than silently going quiet.

## The payload

```json
{ "event": "offer|accepted|expired|unclaimed|digest|visitor_report",
  "leadId": 12, "needsSend": false,
  "to": ["stephan@sunlogic.co.za"], "replyTo": "...",
  "subject": "...", "html": "<!doctype html>…",
  "type": "contact", "name": "...", "email": "...", "phone": "...",
  "need": "...", "divisionLabel": "Energy", "assignee": "stephan",
  "status": "offer", "raw": "{…}" }
```

`html` is what the recipient reads and, for the teaser events, contains
nothing identifying. The `name`/`email`/`phone` fields travel alongside it for
the sheet only — the boundary this feature defends is what a director sees
before accepting, not what the internal log records.

## The sheet

`Sunlogic Leads`, id `1V2JNVOV4CqVevuDD1ECcWjpEAEPVJ7JVNR5-CcYnyOo`.
Append-or-update matching on **Lead ID**, so one row per lead is updated as
the enquiry moves rather than a new row per event.

Columns to add to the existing header before importing:

```
Lead ID | Assigned To | Accepted At | Reassigned To | Reassigned Accepted At | Status
```

## Importing

1. Open n8n → Workflows → Import from File → `n8n/sunlogic-leads-relay.json`
2. Confirm both credentials resolved: `Sunlogic Sales SMTP` and
   `Google Sheets account`. The Header Auth credential is on the Webhook node.
3. Publish, and confirm the status shows **Published**.
4. This is an iMac change — append an entry to
   `serverMonitor/change-log.jsonl`.

**Before importing, note what is being removed:** `Notify Sales — Contact`,
`Notify Sales — Calculator` and `Email Visitor Report`. The first two are
replaced by the Worker's own templates. The third — the customer's solar
estimate — has moved to `emails/body-visitor-report.html` and is sent by the
Worker; it is not simply deleted. If you import this without the Worker
deployed, calculator users stop receiving their estimate.
