# Delivery confirmation for the leads relay

Closes the gap that lost lead 28. Companion to
[`docs/n8n-workflows.md`](n8n-workflows.md) and the claim/rotation design at
[`docs/superpowers/specs/2026-09-04-lead-claim-rotation-design.md`](superpowers/specs/2026-09-04-lead-claim-rotation-design.md).

Code: `workers/leads-relay/src/webhook.mjs`, `src/mailer.mjs`,
`src/index.js`. Schema: `migrations/0003-delivery-confirmation.sql`.

---

## The problem

`send()` treated "Resend's API returned 2xx" as success. It is not. A 2xx from
Resend means **accepted for delivery** — the message was queued. Whether
anybody received it is a separate fact, and nothing in the system ever asked
for it.

Lead 28 is what that costs:

| | |
|---|---|
| Accepted | 2026-10-15 08:01:21 UTC |
| `leads.last_error` | `NULL` |
| `leads.attempts` | `0` |
| Director received | nothing |
| How we found out | the client emailed us directly |

The database said the send had worked, because by the only test being applied
it had. A local repro confirmed a genuinely *failed* send **is** recorded — so
the absence of an error was not a logging bug. It was the absence of any
delivery confirmation at all.

The lesson is not "email is unreliable". It is that we had no second opinion.
Resend knows what became of a message; we never asked, and we had thrown away
the id we would have needed to ask with.

---

## What now exists

### 1. The message id is kept

`sendViaResend` discarded the response body. It now reads `id` from it and
`send()` returns it, so `notify()` and `sendDailyDigest` can record it.

Stored in a new `messages` table, keyed on **Resend's own id** — that is what
the webhook arrives carrying, and a surrogate key would need an index on it
anyway and then two ways to name the same message.

Each row links to the lead *and*, for director notifications, to the offer.
Both are needed and they answer different questions:

- `lead_id` — "what happened to this enquiry's mail"
- `offer_id` — what makes a bounce **actionable**: handing the lead to the
  other director requires knowing which offer the dead email was carrying.

**A lead with no row in `messages` was carried by the n8n fallback.** Resend
never saw that message, so no webhook will ever arrive for it. That absence is
information, not a gap.

### 2. `POST /resend/webhook`

Verifies the Svix signature against `RESEND_WEBHOOK_SECRET`, then records
`email.delivered` / `email.bounced` / `email.complained`.

- **Unverified payloads are refused with 401 and write nothing.** Without
  this, a stranger could expire offers at will.
- The raw request bytes are passed through untouched — the signature covers
  exact bytes, and re-serialising parsed JSON changes key order so it can
  never match again.
- A five-minute timestamp tolerance, so a captured payload cannot be replayed
  forever.
- `email.sent` is deliberately **ignored**: it means the same thing the API's
  2xx already meant, which is the assumption this whole feature exists to stop
  relying on.
- Events we do not act on return **200**, not an error. A non-2xx makes Resend
  retry forever and eventually disable the endpoint — which would take the
  bounces down with it.

**Idempotency has two independent guards, because neither covers the other:**

| Guard | Stops |
|---|---|
| `webhook_events.id` (svix-id) | a replay of a request that **finished** |
| `messages.alerted_at` (claimed by `UPDATE … WHERE alerted_at IS NULL`) | a second alert when the first attempt died **between** the status write and the email |

The status itself is monotonic (`nextStatus`): rank only ever increases, so a
`delivered` arriving after a `bounced` cannot erase the bounce. Webhooks are
not ordered, and the one record a human needs has to survive.

The record is written **before** the dedup row, deliberately. Marking a
request handled first is simpler and wrong: a crash after the mark loses the
event permanently, and the event we cannot afford to lose is the bounce.

### 3. A bounced director email does not die quietly

On `bounced` or `complained`, `handleEmailFailure`:

1. **Records it on the lead** — `leads.last_error` carries Resend's own words
   ("550 mailbox unavailable", not just "bounced"). This happens first,
   whatever else fails.
2. **If the dead email carried a live offer** (the serious case — a bounced
   *offer* means that director's 24 hours are counting down on silence):
   expires that offer now and hands the lead on exactly the way the sweeper
   would have in 24 hours' time. The only difference is that we *know* the
   wait would be pointless.
   - Round 1 → a round-2 offer to the **other** director, with a live token.
   - Round 2 → `reviveBothOffers` → `alertUnclaimed`, both directors, both
     tokens live.
   - No `expired` email to the bounced director: the address it would go to is
     the one that just bounced.
   - The hand-on path is now one function, `handOnOffer`, shared with the
     sweeper. A bounce needs precisely what the clock running out needs.
3. **A visitor's own email bouncing is recorded and not escalated.** It is a
   wrong address they typed, not something to wake a director over.

#### The one case that gets no new email, on purpose

A bounced **`accepted`** email — lead 28's own case — has no live offer, so
there is no 24-hour clock to rescue and the other director has nothing to act
on. It is recorded on the lead and counted in the digest, and that is the
whole response. The owner already saw the full details **on the claim page**
when they accepted (`src/claim.mjs`, fixed in the preceding session), so the
details are not lost — which is exactly why that fix mattered. Sending the
other director an alert with a dead Accept button would be noise standing in
for action.

### 4. Customer-facing mail is traced too

Added after the first deploy, because the first real webhook exposed the gap.
A genuine, correctly signed `email.delivered` arrived on 2026-10-15 at
13:13:27 and matched nothing: `rememberMessage` was wired into `notify()` and
the digest, but `sendVisitorReport` and `sendInternalTestReply` call `send()`
directly and recorded no id.

That left the blind spot intact on the customer side. **The calculator's solar
estimate goes to the prospect**, and if it bounced or was suppressed the first
sign would be a warm lead going cold. Both now record their message id.

They are stored with **no assignee and no offer**, and `handleEmailFailure`
keys off exactly that: a row with no assignee is never treated as a dead
offer. A prospect mistyping their own address must not expire an offer or
reassign the lead to the other director — the failure is in reaching the
*customer*, which is a different problem with a different answer. It is
recorded on the lead and counted in the digest, and nothing else happens.

`send()` now also returns the address it actually used. Under
`MAIL_REDIRECT_TO` that differs from the one the caller asked for, and a
`messages` row naming a customer who was never written to would be a record
that lies — which is the failure mode this whole feature exists to remove.

### 5. An unmatched event is recorded, not dropped

An event whose `email_id` matches no `messages` row used to be accepted and
discarded. That was defensible while most sends went unrecorded, and stopped
being defensible the moment they were all recorded: with every send keeping
its id, **an unmatched event means mail is leaving by a route this Worker
does not record**, or an id was lost on the way out. Either way the counts
above are measuring less than they appear to, and that is worth knowing.

So `webhook_events` gained `message_id` and `matched` (migration 0004), and
the digest reports any unmatched events in the last 24 hours. It still answers
**200** — Resend is not at fault and a retry would not help; the record is how
a human finds out.

The alternative was to keep dropping them and say so here. Rejected: the one
event this system has actually received was an unmatched one, and it took a
manual database query to notice.

---

## The digest: decision

**Decision: route it through `send()`. Change nothing in n8n.**

The brief flagged a double-send risk — "n8n today renders and sends the digest
off `event:'digest'`, so routing through `send()` may double-send or break
it. Do not change this blind." Inspected, and **the premise is wrong**, in a
way that matters more than the original question.

### What the inspection found

`n8n/sunlogic-leads-relay.json` is the committed workflow definition. It has
six nodes and **no digest branch**:

```
Webhook → Extract Body → Log Row → Needs sending? → Relay Send → Respond 200
```

Trace a digest payload — `{event:'digest', type:'digest', …summary}`, with no
`to`, `subject`, `html` or `needsSend`:

| Node | What happens |
|---|---|
| `Extract Body` | `needsSend: b.needsSend !== false` → `undefined !== false` → **`true`**. `to: b.to \|\| ''` → **`''`**. `html` → **`''`**. `subject` → the default `'Sunlogic'`. |
| `Log Row` | writes a sheet row with a **blank Lead ID** — and the sheet is append-or-update *on Lead ID*, so every digest ever sent collapsed into one blank-keyed row |
| `Needs sending?` | `needsSend` is true → takes the **sending** branch |
| `Relay Send` | SMTP send with `toEmail: ''` and `html: ''` → fails. `onError` is unset, so the workflow errors out |

**Nobody has ever received this email.** Corroborated by the 2026-09-04 plan,
whose Task 12 *"Step 4: Confirm the digest arrives the next morning. **This is
the acceptance test for the whole feature** — if it does not arrive, something
is broken and everything else was theatre"* was left unticked, along with Step
3 beside it.

An earlier version of this paragraph called it "the one unticked box in the
document. Every other step is `[x]`." **That was wrong** — the plan has
several other unticked boxes, for work that was in fact done (writing
`mailer.mjs`, the sheet columns, pointing `CLAIM_BASE_URL`). It came from
reading the line rather than grepping the file. The claim is corrected rather
than quietly deleted because it was offered as evidence, and evidence that
turns out to be overstated should say so. The conclusion does not rest on it:
it rests on the node-by-node trace above and on the owner confirming directly
that the digest had never arrived.

Further corroboration in the template itself: `body-daily-digest.html` has
always asked for `{{oldestLine}}`, and nothing ever supplied it — because
nothing ever rendered the template. `mailer.mjs` has had `BODIES.digest` wired
up the whole time, unused.

So the dead man's switch was itself dead, and had been since it shipped. The
original concern — that the digest never exercises Resend, so if Resend died
the digest would still arrive and report nothing wrong — was real and is
strictly the lesser of the two problems.

### Why `send()` is safe here

- **No double-send.** There is no digest branch in n8n to double up with. This
  is the first time the template has been rendered.
- **It stops the empty-envelope failure too.** `send()` announces a successful
  Resend send to n8n with `needsSend: false` ("log this, do not send it"),
  which is precisely what keeps `Relay Send` from being reached with no
  recipient.
- **n8n needs no change**, so this is not an iMac change and does not need the
  `serverMonitor` gate.
- `leadId: 'digest'` instead of blank gives the digest its own stable sheet row
  and leaves real leads alone.
- It now exercises the real path: **if Resend is broken, the digest does not
  arrive.** That is what a dead man's switch is for.

Verified rendering: every placeholder in `_layout.html` + `body-daily-digest.html`
is supplied, nothing left unrendered.

### Also added to the digest

A `{{delivery_notice}}` line counting mail Resend accepted and then failed to
deliver in the last 24 hours. Before `messages` existed that number was
unknowable and assumed to be zero; it was not. It is the backstop for the
accepted-bounce case above, and the only new placeholder in the template.

It says nothing when there is nothing — unlike the rest of the digest, which
reports zeros on purpose. The zeros prove the digest ran; this line only needs
to appear when there is something to act on.

### And one false alarm removed before it ever fired

`queued_now` counts leads at `status='pending'`. Internal submissions
(`@sunlogic.co.za`) are stored but deliberately never offered to a director,
and `handleLeadRoute` used to return without marking them — so they stayed
pending forever. `retryPendingLeads` rescanned them every five minutes
finding nothing to do, and the digest would have reported them as "queued for
sending" every morning, climbing with every test anyone ran.

They are now marked out of the queue at submission. `'sent'` there means the
lead needs nothing further, **not** that a director was told; no offer row and
a NULL `claimed_by` are what distinguish it. Leads 29 and 30 were backfilled.

Caught before the first digest ever arrived, which was luck rather than
process: a watchdog whose first appearance cries wolf is one people learn to
ignore, and nothing would have flagged it except someone reading the number
and knowing it was wrong.

---

## Configuration still required

**Steps 2 and 3 are inert until this is done.** The code is deployed-safe
without it — the endpoint answers `503 webhook not configured` and records
nothing, which is deliberate: a handler that accepted every payload and
quietly stored none would look perfectly healthy from Resend's dashboard,
which is the exact failure mode this feature is about.

1. In the Resend dashboard → **Webhooks** → add an endpoint:
   - URL: `https://leads.sunlogic.co.za/resend/webhook`
   - Events: `email.delivered`, `email.bounced`, `email.complained`
2. Copy the signing secret it shows **once** (`whsec_…`).
3. Set it on the Worker:

```bash
cd workers/leads-relay && npx wrangler secret put RESEND_WEBHOOK_SECRET
```

4. Apply the migration:

```bash
cd workers/leads-relay && npx wrangler d1 execute sunlogic-leads --remote --file migrations/0003-delivery-confirmation.sql
```

```bash
cd workers/leads-relay && npx wrangler d1 execute sunlogic-leads --remote --file migrations/0004-webhook-event-matching.sql
```

```bash
cd workers/leads-relay && npx wrangler d1 execute sunlogic-leads --remote --file migrations/0006-reconcile-early-events.sql
```

```bash
cd workers/leads-relay && npx wrangler d1 execute sunlogic-leads --remote --file migrations/0007-event-origin.sql
```

All four are applied to production AND staging as of 2026-10-15. Swap
`sunlogic-leads-staging` for the staging database.

Staging uses the same two commands with `--env staging` and
`sunlogic-leads-staging`, and a second endpoint pointed at the staging Worker.

---

## Deploying

**`wrangler deploy` bundles the working tree, not `HEAD`** — worth keeping in
mind in a repository several sessions work in at once. While this feature was
being written, `src/index.js` and `wrangler.toml` also carried another
session's then-uncommitted Project Brief uploads work, and a dry run showed it
plainly: `env.UPLOADS (sunlogic-brief-uploads)` in the bundle's bindings.

That work has since landed in `ed4c19b`, so it is no longer a stray — but it
is still in the bundle, and it is **not** deployed either. **The next deploy
of this Worker ships the Project Brief uploads feature as well.** Its R2
bucket has to exist first, or `/uploads/brief` fails at runtime:

```bash
npx wrangler r2 bucket create sunlogic-brief-uploads
```

See `docs/project-brief.md` for the rest of that feature's requirements.
Before deploying, check `git status` and a dry run so it is a deliberate
decision which features go out, rather than whatever happened to be on disk.

Build check, which does not deploy:

```bash
cd workers/leads-relay && npx wrangler deploy --dry-run --outdir /tmp/dryrun
```

### Deploying without the uploads route

Two deploys have used this while R2 stays disabled: `d867ea9a` (2026-10-15
10:31 UTC, delivery confirmation) and `11981630` (2026-10-15, customer-side
tracing and unmatched events).

Worth writing down, because it is not obvious and will be needed again while
R2 stays disabled. It was **not** deployed before `ed4c19b` landed — that
commit was already in history. A snapshot of an **earlier commit** was
deployed instead.

`46c5476` is the delivery-confirmation commit and it predates `ed4c19b`, so
its `wrangler.toml` has no `[[r2_buckets]]` section and its `index.js` has no
reference to `uploads` at all (verified: `git show 46c5476:workers/leads-relay/src/index.js | grep -c uploads` → 0). Exporting that commit and deploying
from the export therefore ships delivery confirmation and the lead-safety fix
in `b3299d3`, and nothing else:

```bash
SNAP=$(mktemp -d) && git archive 46c5476 workers/leads-relay emails | tar -x -C "$SNAP" && cd "$SNAP/workers/leads-relay" && npx wrangler deploy --env=""
```

Three things make this work rather than being a trick:

- **`emails/` must be in the archive.** `src/mailer.mjs` imports the templates
  as `../../../emails/…`, so an archive of `workers/leads-relay` alone fails
  at build.
- **`--env=""`** targets the top-level environment explicitly. Without it
  wrangler warns that several environments are defined and picks top-level
  anyway; being explicit is how you know production was the target.
- **`git archive` touches no working tree and no index**, which is the whole
  reason for it here. Other sessions had uncommitted work in `src/index.js`
  at the time, so `git stash`, `git checkout` and `git revert` were all
  unavailable — a revert was attempted and git refused it rather than
  clobbering that work.

Run `npx wrangler deploy --dry-run --outdir /tmp/dryrun` from the snapshot
first and check the printed bindings: `env.DB` and the three variables, with
**no `env.UPLOADS`**, is the signal that the right commit was exported.

#### Once there are later commits to carry too

`46c5476` is only the right base, not the right content, as soon as there is
work after `ed4c19b` that must also ship. Archiving the old commit and then
replaying the newer changes onto it is what the second deploy did:

```bash
SNAP=$(mktemp -d)
git archive 46c5476 workers/leads-relay emails | tar -x -C "$SNAP"
git show cae7079:workers/leads-relay/src/mailer.mjs  > "$SNAP/workers/leads-relay/src/mailer.mjs"
git show cae7079:workers/leads-relay/src/webhook.mjs > "$SNAP/workers/leads-relay/src/webhook.mjs"
git diff ed4c19b cae7079 -- workers/leads-relay/src/index.js > "$SNAP/i.patch"
cd "$SNAP" && patch -p1 < i.patch && rm i.patch
```

`mailer.mjs` and `webhook.mjs` are copied whole because `ed4c19b` never
touched them. `index.js` cannot be, because the version in `cae7079`
*contains* the uploads routes — so instead the diff **from `ed4c19b` to
`cae7079`** is taken, which is exactly the changes made after the uploads
work, and replayed onto the clean base. All seven hunks applied without fuzz,
because the two sets of changes live in different functions.

Verify the result before deploying, rather than trusting the patch:

```bash
grep -c uploads workers/leads-relay/src/index.js                      # want 0
grep -c 'await rememberMessage(env' workers/leads-relay/src/index.js  # want 4
grep -c r2_buckets workers/leads-relay/wrangler.toml                  # want 0
```

This is a workaround, not the intended route, and it gets more awkward with
every commit it has to replay. Once R2 is enabled, or the uploads feature
moves off R2, deploy from `HEAD` normally and delete this section.

---

## Tests

```bash
cd workers/leads-relay && node --test test/*.mjs
```

94 pass (50 before this work, 44 in `test/webhook.test.mjs`).

`scripts/manual-bounce.mjs` is a hand-signed bounce for the director branch,
kept OUT of `test/` on purpose — `node --test test/*.mjs` globs that
directory and would run it as a test. It reads the signing secret from the
environment and never prints it.

`src/index.js` imports `emails/*.html` through the bundler's Text rule, so it
cannot be imported by `node --test` at all. That is why the verification and
idempotency logic lives in `src/webhook.mjs` — the two things most worth
testing here are that an unsigned payload is refused and that a retried one
changes nothing, and verification you cannot test is verification you are
hoping about.

The tests run the **real schema** on `node:sqlite` through a small D1-shaped
adapter. A fake returning scripted rows would have passed happily against a
`CHECK` constraint that rejects every write. The Svix signing helper in the
test signs independently rather than calling the code under test — signing
with the same helper that verifies would agree with itself however wrong both
were, notably about stripping `whsec_` and base64-decoding the remainder,
which is the single most likely thing to get wrong and the one thing such a
test would never catch.

## Confirmed by the owner, 2026-10-15

**The 07:00 digest has never arrived.** Asked directly and answered "no,
never". That settles the analysis above: the dead man's switch was dead from
the day it shipped, and the system has been running since 2026-09-10 with no
working daily signal of any kind. Lead 28 went missing inside that window.

The live n8n workflow was never read directly — `hooks.digitaloperations.co.za`
exposes only `/webhook` (`/rest` and `/api/v1` are 404 there; on
`n8n.digitaloperations.co.za` they are 401, and no API key was available). It
no longer needs reading: the committed definition, the unticked acceptance
test and the owner's answer all say the same thing.

## The bounce path, end to end — and the bug it found

Delivery was proven against a real payload early on. The **failure** path, the
one that cost us lead 28, was only ever covered by unit tests. Proving it
found a defect that the unit tests could not have caught.

### How it was tested

Director addresses are hardcoded in `mailer.mjs`, and `MAIL_REDIRECT_TO` must
never be set in production, so a director notification cannot be aimed at a
bounce simulator. But the **calculator's estimate goes to the customer's own
address**, so that one can be:

```bash
curl -s -X POST https://leads.sunlogic.co.za/leads/calculator \
  -H 'Content-Type: application/json' \
  -d '{"mode":"residential","email":"bounced@resend.dev","name":"BOUNCE PATH TEST"}'
```

`bounced@resend.dev` is Resend's documented simulator (with
`delivered@resend.dev` and `complained@resend.dev`), and it emits a genuine
`email.bounced`. That produced lead 32 in production: an offer to Stephan
(which Resend delivered, matched, recorded) and a visitor report to the
simulator.

Note the cost of this test: it creates a real lead, emails a director, and
**consumes the rotation pointer**. Put the pointer back afterwards.

### What it found: the webhook can beat our own record of the send

| | |
|---|---|
| `messages` row written | 2026-10-15 13:49:**22** |
| `email.bounced` arrived | 2026-10-15 13:49:**20** |

Two seconds early. The event verified correctly, matched nothing, and was
filed as unmatched — **escalating to nobody**. The same lead's offer
notification matched fine, because its `delivered` happened to arrive nine
seconds *after* its row.

On a director notification this is lead 28 exactly: a bounced offer, a
director who was never told, and a 24-hour clock running on silence. The only
reason it was visible at all is the unmatched-event record added in `cae7079`
— without it the event would have been accepted and discarded, and this would
still be unknown.

**Every unit test had seeded the message row before the event**, so all of
them agreed with an ordering nothing guarantees. The send leaves from
Cloudflare and the bounce returns through Resend; no part of that is
sequenced. A passing suite was evidence about the tests' assumptions, not
about production.

### The fix: replay

`webhook_events` keeps Resend's `detail` (migration 0006), and
`reconcileUnmatched` runs immediately after a send is recorded: anything
already waiting for that message id is applied through the same monotonic
`nextStatus`, and a failure escalates through the same claim-once discipline
as the live path, with the claim handed back if escalation throws.

Deliberately **not** fixed by returning a non-2xx so Resend retries. That
would make correctness depend on an external retry schedule, and on this path
a lost bounce is a lost lead.

## The Resend account is shared, and the endpoint is account-wide

Resend's webhook endpoint is **not** scoped to a domain or a sender. Every
project on the same Resend account POSTs its delivery events to
`/resend/webhook`. One did:

| | |
|---|---|
| `received_at` | 2026-10-15 15:04:17 |
| `message_id` | `01a14016-e620-7873-a631-78425fbc318d` |
| `detail` | `smarais.za@gmail.com` |
| actually | a CricketIQ sign-in code, from `noreply@digitaloperations.co.za` |

The handler did the right thing with it. The damage was to the **signal**:
`unmatched` is supposed to mean "a Sunlogic send went unrecorded", which is a
real alarm, and every unrelated email on the account was inflating it. Left
alone the digest would have reported that number every morning until it meant
nothing — this feature's own failure mode, one level up.

Worth noting how the attribution was checked rather than assumed, because
`smarais.za@gmail.com` is **also** staging's `MAIL_REDIRECT_TO`, so "a staging
send" was a competing explanation. Resend's ids are UUIDv7, whose first 48
bits are a millisecond timestamp: this one decodes to 15:03:24Z. Staging's
newest lead is 08:54:11, more than six hours earlier, so no staging send could
have produced it.

### How events are attributed

By **sender**, never by whether a row exists:

| origin | what it is | counts toward `unmatched`? |
|---|---|---|
| `ours` | this deployment's send | **yes** |
| `other_env` | staging's, seen by production, or vice versa | no |
| `foreign` | another project on the account | no |
| `unknown` | no usable `from` on the payload | no, but visible |

`NULL` predates the column and is treated as ours.

**The "never by row absence" part is load-bearing.** An event of ours can
legitimately arrive before its row does — that is the race in migration 0006 —
and those events must still be stored and replayed. If `unmatched` were ever
allowed to imply `foreign`, that bug would come straight back.

Two fields do the work, both confirmed against Resend's docs rather than
assumed:

- **`data.from`** separates us from other projects.
- **`data.tags`** separates staging from production, which it has to, because
  both send as `FROM_ADDRESS` and `from` alone cannot tell them apart. Every
  send is now tagged `env=production` or `env=staging`; Resend takes tags as
  an array of `{name, value}` and returns them as an object. Without this, a
  staging send's event arriving at production is indistinguishable from a
  production send whose record went missing — an alarm that is permanently,
  quietly wrong.

`FROM_ADDRESS` and `envTag` live in `mailer.mjs` and are passed **into** the
handler. `webhook.mjs` must not import `mailer.mjs`: that would drag the email
templates in and make the module unimportable by `node --test`, which is the
entire reason this logic lives in its own file.

A foreign event is recorded, not dropped — "another project sent this" is
worth being able to see, and discarding it is how a shared account stays
invisible — and still answers 200, because Resend is doing exactly what it
should.

## Staging

Staging had **none** of this schema until 2026-10-15: `sunlogic-leads-staging`
held only `leads`, `offers` and `rotation`. Migrations 0003, 0004, 0006 and
0007 had been applied to production only, so every `rememberMessage` call on
staging had been failing silently into its catch, and staging could not
exercise or verify any of the delivery-confirmation work.

All four are now applied. A full column-by-column diff against `schema.sql`
reports **production: no drift**, and staging missing only `brief_photos`
(migration 0005 — the Project Brief feature, deliberately not applied here).

What staging can prove now: the schema, the recording, the matching and the
replay. What it still cannot prove on its own is a real bounce reaching a
**director**, because that needs `MAIL_REDIRECT_TO` pointed at
`bounced@resend.dev` and a second Resend endpoint aimed at the staging Worker
with its own signing secret. Staging's value remains mostly the timing paths —
`OFFER_TTL_MINUTES = 2` lets expiry and reassignment be exercised in minutes
instead of a day — and it is now at least capable of the rest.

## Still unverified

- ~~No webhook has been received end to end.~~ **Settled 2026-10-15.** A
  genuine signed `email.delivered` arrived at 13:13:27 and passed
  verification, so the signature path is proven against a real Resend
  payload rather than only against the test suite's own signer. It matched no
  message, which is what prompted items 4 and 5 above.
- A real bounce is now proven as far as verification, matching and recording
  (see above), but the **director** branch — offer expires, lead hands on to
  the other director with a live token — has still only run in tests. It
  cannot be driven by a real bounce without either `MAIL_REDIRECT_TO` on
  staging plus a second Resend endpoint, or a hand-signed event in production
  (`scripts/manual-bounce.mjs`), which reassigns a lead and therefore emails
  the other director for real.
- ~~The digest has not been seen arriving through the new path.~~
  **Confirmed 2026-10-16 07:00 SAST — it arrived, and was read.** Sent
  05:00:12 UTC to both directors, `delivered` confirmed by Resend's webhook at
  05:00:24, and its contents matched the database ("4 arrived, 1 accepted").
  The first time this template has ever rendered and reached a human, 36 days
  after the system went live. The 2026-09-04 plan's Task 12 Step 4 is now
  ticked, with the delay recorded there rather than smoothed over.

  Worth stating what this does and does not prove. It proves the cron, the
  render, `send()`, Resend's delivery and the webhook that confirmed it — one
  firing of a dead man's switch proves the path. It does not prove the
  property, which is that it keeps firing. That takes the second morning, and
  the hundredth.
