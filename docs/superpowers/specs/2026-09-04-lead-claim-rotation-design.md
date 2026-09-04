# Lead claim and rotation — design

**Status:** awaiting review
**Date:** 2026-09-04

## The change

Today every contact-form submission emails `sales@sunlogic.co.za` with the
full details, plus a confirmation to the visitor. Nobody owns the lead, and
there is no record of who picked it up.

Wanted: enquiries alternate between Stephan and Craig, and an enquiry is only
handed over once someone has actively accepted it. An unaccepted enquiry moves
on after 24 hours. Every step is logged.

## What exists now

```
browser form
  → POST sunlogic-leads-relay.smarais-za.workers.dev/leads/{contact,calculator}
      Worker: validate → INSERT into D1 `leads` → POST n8n webhook
        (5-minute cron retries anything still 'pending')
  → n8n "Sunlogic — Leads Relay"
        Notify Sales — Contact      → sales@sunlogic.co.za, all fields
        Confirm Receipt — Contact   → the visitor
```

The Worker never sends email. n8n does, on the iMac. `emails/*.html` are the
reviewable source for the templates, pasted into n8n by hand.

That division of labour stays: the Worker owns **state**, n8n owns **sending**.
No new email vendor, no change to SMTP.

## Decisions taken

| Question | Decision |
|---|---|
| Rotation | Strict alternation **by offer**. Every offer flips the pointer, whether or not it is accepted. |
| Second timeout | Alert both, keep the enquiry open. Both claim links stay live, first click wins. No auto-escalation to sales@. |
| Audit log | Google Sheet, appended by n8n. |
| Scope | Both the contact form and the calculator. |
| Teaser content | Division only — "a solar enquiry" or "an electrical enquiry". No name, no contact details, no message. |

## Flow

```
submission
   │
   ├─ Worker: INSERT lead
   ├─ Worker: pick next assignee (flip rotation pointer), create offer #1,
   │          token, expires_at = now + 24h
   ├─ n8n: OFFER email  → assignee   ("a solar enquiry has come in" + Accept)
   └─ n8n: CONFIRM email → visitor    (unchanged)

assignee clicks Accept
   ├─ Worker: GET /claim/<token>  → confirmation page with a POST button
   ├─ Worker: POST                → offer accepted, lead assigned
   ├─ n8n: FULL email   → the accepter (every field, today's sales template)
   └─ n8n: sheet row     "accepted"

24h passes with no accept  (5-minute cron sweep)
   ├─ Worker: offer #1 expired, create offer #2 for the other person
   ├─ n8n: EXPIRED email → the person who lapsed
   │        ("24 hours has passed, this enquiry has gone to the next person")
   ├─ n8n: OFFER email   → the other person
   └─ n8n: sheet row      "expired" + "reassigned"

another 24h with no accept
   ├─ Worker: revive BOTH tokens, no further expiry, state 'open'
   ├─ n8n: UNCLAIMED email → both  ("enquiry #N is still unclaimed")
   └─ n8n: sheet row        "unclaimed"
      first person to click from here wins; the other sees "already taken"
```

## Data model

New tables alongside the existing `leads`:

```sql
CREATE TABLE offers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id     INTEGER NOT NULL REFERENCES leads(id),
  assignee    TEXT    NOT NULL,          -- 'stephan' | 'craig'
  round       INTEGER NOT NULL,          -- 1 first offer, 2 reassignment
  token       TEXT    NOT NULL UNIQUE,   -- 32 random bytes, base64url
  state       TEXT    NOT NULL           -- 'offered' | 'accepted' | 'expired'
                      CHECK (state IN ('offered','accepted','expired')),
  offered_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT,                      -- NULL once revived after round 2
  accepted_at TEXT
);
CREATE INDEX idx_offers_sweep ON offers(state, expires_at);
CREATE INDEX idx_offers_lead  ON offers(lead_id);

CREATE TABLE rotation (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  last_offered_to TEXT
);
```

`leads` gains `division TEXT` (solar | electrical | general) and
`claimed_by TEXT`.

The rotation pointer is a single row, updated in the same statement that
creates an offer, so a burst of submissions cannot hand two people the same
side of the alternation.

## The claim endpoint

`GET /claim/<token>` → an HTML page naming the division and the date, with a
single **Accept this enquiry** button.
`POST /claim/<token>` → performs the accept.

**The GET must not accept, and this is the part most likely to be got wrong.**
Mail security scanners, link previewers and some clients fetch every URL in an
incoming email before a human sees it. A GET that assigns would hand every
enquiry to whichever mailbox scans hardest, silently, and the log would say a
human accepted it. The two-step is not ceremony; it is the only thing standing
between this design and an auto-accept bug that looks like normal operation.

Accept is a conditional update:

```sql
UPDATE offers SET state='accepted', accepted_at=datetime('now')
WHERE token=? AND state='offered'
  AND (expires_at IS NULL OR datetime('now') < expires_at)
```

Zero rows changed means expired, already accepted, or unknown token — the page
says which, and never sends an email. Two simultaneous clicks: exactly one
gets a row, so exactly one full email goes out.

Tokens are 32 random bytes. Anyone holding the link can accept, which is
correct — possession of the mailbox is the authentication, the same assumption
every password-reset link makes. The blast radius of a leaked token is one
misassigned enquiry.

## Emails

Existing style, header and tokens throughout. Five templates in `emails/`:

| File | To | Says |
|---|---|---|
| `offer-notification.html` *(new)* | assignee | "A solar enquiry has come in." Division, date, Accept button. **Nothing identifying.** |
| `assignment-full.html` *(new)* | accepter | Every field. This is today's `sales-notification.html`, re-addressed. |
| `offer-expired.html` *(new)* | the lapsed | "24 hours has passed. This enquiry has been sent to the next person." |
| `unclaimed-alert.html` *(new)* | both | "Enquiry #N is still unclaimed." Both links live. |
| `client-confirmation.html` | visitor | Unchanged. |

`sales-notification.html` is retired once `assignment-full.html` replaces it.

### Division mapping

| `need` | Teaser says |
|---|---|
| Solar | a solar enquiry |
| Energy management | a solar enquiry |
| Electrical | an electrical enquiry |
| Not sure yet | **open — see below** |
| calculator submission | a solar enquiry |

Energy management sits in the Energy division, so it reads as solar. The
calculator is a solar calculator and has no `need` field at all.

**Open question:** "Not sure yet" is neither. Calling it solar would be a
guess shown to a director as fact. Proposal: the teaser says "a new enquiry"
with no division. Needs a decision before build.

## Logging

n8n appends one row per event to a Google Sheet:

```
timestamp | lead_id | division | event | assignee | round | note
```

`event` is one of `offered`, `accepted`, `expired`, `reassigned`,
`unclaimed`. Every question asked — who was it assigned to, did they accept,
was it reassigned, did that person accept — is answered by filtering
`lead_id`.

D1 remains authoritative for the logic; the Sheet is a read-only mirror for
humans. If the Sheet write fails the enquiry still flows, and the row is
recoverable from D1.

Requires a Google Sheets credential in n8n and a sheet to write to — neither
exists yet.

## What changes where

| Where | Change |
|---|---|
| `workers/leads-relay/schema.sql` | `offers`, `rotation`, two columns on `leads` |
| `workers/leads-relay/src/index.js` | assignment on submit, `/claim/<token>` GET+POST, expiry sweep in the existing cron |
| `emails/` | three new templates, one retired |
| n8n workflow | new branches per email kind, Sheets node |
| Google Sheet | new, plus an n8n credential |

## Risks and things to decide

1. **The n8n workflow runs on the iMac.** Editing it is an iMac change and
   goes through the serverMonitor control plane with a `change-log.jsonl`
   entry. This spec lives in the website repo; the n8n half does not.
2. **The claim link is a `workers.dev` URL.** `sunlogic-leads-relay.smarais-za.workers.dev/claim/...`
   in an email to a director looks like phishing and may be filtered. A custom
   domain (`leads.sunlogic.co.za`) is a Pages/Workers route away and worth
   doing as part of this.
3. **Cron resolution is 5 minutes**, so 24 hours is 24h ± 5min. Fine, but the
   expiry email should not claim a precise time.
4. **No unsubscribe / no bounce handling.** If a director's mailbox rejects,
   the offer silently sits until it expires and moves on — which is arguably
   the correct behaviour, but it is not visible anywhere except the Sheet.
5. **"Not sure yet"** division label, above.
6. **Testing the 24h path** means either waiting a day or making the window
   configurable. Propose an env var defaulting to 24h so it can be set to
   minutes on a staging run.

## Not in scope

- Changing who the visitor confirmation goes to, or its content.
- Any change to the calculator's own visitor-report email.
- Reassignment by hand, or a UI beyond the claim page.
