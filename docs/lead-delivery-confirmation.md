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
where *"Step 4: Confirm the digest arrives the next morning. **This is the
acceptance test for the whole feature** — if it does not arrive, something is
broken and everything else was theatre"* is the **one unticked box** in the
document. Every other step is `[x]`.

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

79 pass (50 before this work, 29 in `test/webhook.test.mjs`).

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

## Still unverified

- ~~No webhook has been received end to end.~~ **Settled 2026-10-15.** A
  genuine signed `email.delivered` arrived at 13:13:27 and passed
  verification, so the signature path is proven against a real Resend
  payload rather than only against the test suite's own signer. It matched no
  message, which is what prompted items 4 and 5 above.
- No **bounce** has been seen end to end. Delivery is proven; the failure path
  is still only covered by tests.
- The digest has not been seen arriving *through the new path* either. The
  first one is due at 07:00 SAST the morning after this deploys, and it is
  still the acceptance test for the whole feature.
