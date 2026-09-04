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
| Teaser content | The chosen division only — Energy, Electrical, Smart or Not sure yet, verbatim. No name, no contact details, no message. |

## Flow

```
submission
   │
   ├─ Worker: INSERT lead
   ├─ Worker: pick next assignee (flip rotation pointer), create offer #1,
   │          token, expires_at = now + 24h
   ├─ n8n: OFFER email  → assignee   ("an Energy enquiry has come in" + Accept)
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

`leads` gains `division TEXT` (energy | electrical | smart | unsure) and
`claimed_by TEXT`. Stored normalised and lower-case; the display label comes
from it, so a future rename is one table, not four HTML files.

The rotation pointer is a single row, updated in the same statement that
creates an offer, so a burst of submissions cannot hand two people the same
side of the alternation.

## The claim endpoint

One click for the human, and still safe against link prefetching.

`GET /claim/<token>` → a page that immediately submits a `POST` to itself via
a two-line inline script, with a plain **Accept this enquiry** button inside
`<noscript>`.
`POST /claim/<token>` → performs the accept, and the page becomes
"Accepted — the details are on their way."

**The GET must never accept on its own.** Mail security scanners, link
previewers and some clients fetch every URL in an incoming email before a
human sees it. If the GET assigned, every enquiry would go to whichever
mailbox scans hardest, silently, and the log would record a human accepting
it. Scanners issue the GET but do not execute page JavaScript, so the
auto-submit is what separates a person from a fetcher while still costing the
person a single click.

Residual risk, stated rather than hidden: a scanner that renders with a real
headless browser would execute the script and accept. That is a far smaller
population than plain fetchers, and it would be visible in the log as an
accept nobody remembers making. Removing the risk entirely means making the
human press the button — one extra click. The one-click version is the choice
here.

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
| `offer-notification.html` *(new)* | assignee | "An Energy enquiry has come in." Division, date, Accept button. **Nothing identifying.** |
| `assignment-full.html` *(new)* | accepter | Every field. This is today's `sales-notification.html`, re-addressed. |
| `offer-expired.html` *(new)* | the lapsed | "24 hours has passed. This enquiry has been sent to the next person." |
| `unclaimed-alert.html` *(new)* | both | "Enquiry #N is still unclaimed." Both links live. |
| `client-confirmation.html` | visitor | Unchanged. |

`sales-notification.html` is retired once `assignment-full.html` replaces it.

### Division mapping

The division names changed while this was being specified. The dropdown the
visitor sees is the value the form submits, so the labels and the backend have
to move together:

| Was | Is now |
|---|---|
| Solar | **Energy** |
| Energy management | **Smart** |
| Electrical | Electrical (unchanged) |
| Not sure yet | Not sure yet (unchanged) |

The teaser names whichever the visitor picked, verbatim — "an Energy enquiry
has come in", "a Smart enquiry has come in". No mapping table, no inference,
nothing shown to a director that they did not choose. "Not sure yet" stays as
it is and reads "a Not sure yet enquiry"; earlier drafts forced it into a
division, which meant showing a guess as fact.

A calculator submission has no `need` field at all and is always Energy — it
is the solar calculator.

Two consequences worth naming:

**The option list lives in four places** and all four must change together, or
a visitor on one site submits a value the backend does not recognise:
`site-main/contact.html`, `site-energy/contact.html`,
`site-electrical/contact.html`, and the fallback list inside
`shared/components.js`. The same duplication that produced today's CORS bug.

**Existing rows say the old words.** The eleven leads already in D1, and every
row already in the sheet, carry "Solar" and "Energy management". The Worker
accepts both spellings and normalises to the new ones, rather than a migration
that rewrites history — the old rows are a record of what was actually
submitted at the time.

## Logging

The sheet and the credential already exist and are in use — "Sunlogic Leads",
id `1V2JNVOV4CqVevuDD1ECcWjpEAEPVJ7JVNR5-CcYnyOo`, written by the workflow's
`Log Contact Lead` / `Log Calculator Lead` nodes through the existing Google
Sheets OAuth2 credential. Current header:

```
Timestamp | Type | Name | Email | Phone | Need | Bill | Mode |
Payback/Pivot System | Cost | Raw JSON
```

That is one row per lead, which is also the shape the four questions want
answered — who was it assigned to, did they accept, was it reassigned, did
that person accept, all on one line. So extend the existing sheet rather than
add an events tab:

```
… existing columns … | Lead ID | Assigned To | Accepted At |
Reassigned To | Reassigned Accepted At | Status
```

`Status` is one of `offered`, `accepted`, `reassigned`, `unclaimed`. The
Google Sheets node switches from Append to **Append or Update**, matching on
`Lead ID`, so the row is written once at submission and updated in place as
the enquiry moves.

This needs `Lead ID` to reach n8n, which it does not today: the Worker posts
`{type, ...payload}` with no id. Adding it is a one-line change and is also
what lets any later event find its row.

D1 stays authoritative for the logic. The Sheet is the human view — if a Sheet
write fails, the enquiry still flows and the row is rebuildable from D1.

## What changes where

| Where | Change |
|---|---|
| `workers/leads-relay/schema.sql` | `offers`, `rotation`, two columns on `leads` |
| `workers/leads-relay/src/index.js` | assignment on submit, `/claim/<token>` GET+POST, expiry sweep in the existing cron |
| `emails/` | three new templates, one retired |
| `n8n/sunlogic-leads-relay.json` | new branches per email kind; Sheets node Append -> Append or Update on Lead ID. Version-controlled, so this is edited in the repo and re-imported, not rebuilt by hand in the UI |
| Google Sheet | six columns added to the existing "Sunlogic Leads" sheet. No new sheet, no new credential |
| Worker webhook payload | include `leadId`, so the Sheet row can be found and updated |

## Reliability requirements

The business risk here is not a crash — it is silence. Every dangerous failure
in this design ends with a lead sitting in a database that nobody is looking
at, and no error anywhere. These are requirements, not nice-to-haves, and each
one names the failure it prevents.

**R1 — The 24-hour clock starts when the offer email is sent, not when the
lead arrives.** If n8n is down for six hours, the Worker's retry queue will
deliver the offer eventually, but a clock started at insert has already eaten
a quarter of the window. Stephan then gets 18 hours and is judged on 24.
`expires_at` is therefore set when n8n confirms the send, not at INSERT — the
row is created with `expires_at NULL` and the sweeper ignores NULL.

**R2 — Nagging does not stop.** The chosen behaviour after two timeouts is
"alert both, keep it open". As written that is a single alert: if both are on
site and clear their inbox at six, the enquiry is never mentioned again and
dies quietly. The unclaimed alert repeats every 24 hours until someone
accepts. An enquiry cannot fall out of the system by being ignored.

**R3 — A daily digest, sent whether or not anything is wrong.** One email
each morning: how many leads arrived, how many are unclaimed and for how long,
and anything that failed to send. This is a dead-man's switch — if the digest
stops arriving, the pipeline is broken, and that is the only signal that
survives every other component failing. Without it, a silently broken relay
looks exactly like a quiet week.

**R4 — Retries must not double-send or double-log.** The Worker already
retries the webhook up to 20 times, and today a retry after a failed SMTP send
would send the email twice and append the sheet row twice. Every webhook call
carries `leadId` and an `event` key; n8n's Sheets node uses Append-or-Update
on `Lead ID`, and each email node checks the corresponding D1 state before
sending. At-least-once delivery must produce exactly-once effects.

**R5 — Offer creation and the rotation flip are one atomic step.** Two
submissions arriving together must not read the same pointer and both go to
Craig. D1 `batch()` wraps the pointer update and the offer INSERT, and the
INSERT takes the assignee from the updated pointer rather than a value read
earlier.

**R6 — Nothing is deleted, ever.** Offers are state-transitioned, never
removed. The Sheet is a mirror; D1 is the record. If the Sheet is edited by
hand or a row is lost, it is rebuildable.

### Failure modes and what happens

| If this fails | What happens now | Visible where |
|---|---|---|
| n8n is down at submission | Lead is durable in D1; cron retries for ~100 minutes. Clock has not started (R1) | Digest (R3) |
| SMTP rejects the offer email | n8n does not return 200, Worker retries, no duplicate on success (R4) | Digest |
| Both directors ignore everything | Re-alerted every 24h, indefinitely (R2) | Digest, daily |
| A director's mailbox bounces silently | Offer expires, passes to the other, normal path | Sheet, Status column |
| Two submissions at the same instant | Atomic pointer, one each (R5) | Sheet |
| Two accept clicks at the same instant | Conditional UPDATE, exactly one wins | Sheet |
| A scanner renders JS and auto-accepts | Accepted by someone who did not mean to | Sheet — an accept nobody remembers |
| Worker is down | Form shows an error to the visitor; nothing is silently swallowed | Visitor sees it |
| D1 is down | Same — the submission fails loudly rather than vanishing | Visitor sees it |

### What must be tested before this goes live

The 24-hour window makes the important paths untestable in a working day, so
the window is an env var (`OFFER_TTL_MINUTES`, default 1440) and the staging
run sets it to 2 minutes. Test list:

1. Submit → offer to A only, teaser contains no name, email, phone or message.
2. Accept → full details to A, and only to A.
3. Let it lapse → expiry notice to A, fresh offer to B, sheet shows both.
4. Let that lapse → both alerted; alert repeats on the next sweep.
5. Accept from the round-1 link after the round-2 alert → still works, B's
   link then reports "already taken".
6. Click an accept link twice → second click says already accepted, one email.
7. `curl` the claim URL (simulating a scanner) → no acceptance, no email.
8. Two submissions in the same second → one to each director.
9. n8n stopped, submit, restart n8n → offer arrives, clock starts then.
10. Full round trip with real mailboxes, confirming the emails do not land in
    spam — this is the one that cannot be simulated.

## Risks and things to decide

1. **The n8n workflow runs on the iMac.** Editing it is an iMac change and
   goes through the serverMonitor control plane with a `change-log.jsonl`
   entry. This spec lives in the website repo; the n8n half does not.
2. **The claim link is a `workers.dev` URL.** `sunlogic-leads-relay.smarais-za.workers.dev/claim/...`
   in an email to a director looks like phishing and may be filtered. A custom
   domain (`leads.sunlogic.co.za`) is a Pages/Workers route away and worth
   doing as part of this.
3. **The email `From:` stays `sales@sunlogic.co.za`.** That is the Xneelo SMTP
   credential n8n sends through. Only the recipients change; nobody has to
   stop monitoring that mailbox for this to work, and replies still land
   there.
4. **Cron resolution is 5 minutes**, so 24 hours is 24h ± 5min. Fine, but the
   expiry email should not claim a precise time.
5. **No unsubscribe / no bounce handling.** If a director's mailbox rejects,
   the offer silently sits until it expires and moves on — which is arguably
   the correct behaviour, but it is not visible anywhere except the Sheet.
6. **"Not sure yet"** division label, above.
7. **Testing the 24h path** means either waiting a day or making the window
   configurable. Propose an env var defaulting to 24h so it can be set to
   minutes on a staging run.

## Not in scope

- Changing who the visitor confirmation goes to, or its content.
- Any change to the calculator's own visitor-report email.
- Reassignment by hand, or a UI beyond the claim page.
