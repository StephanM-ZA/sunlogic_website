# Checkpoint — Sunlogic Website

**Saved:** 2026-10-06 (session 13 — **three mobile defects fixed, deployed and
verified live on all three sites; the deploy gate that flaked while shipping
them is fixed too.** Nothing is in flight. See "Where this stands" below.)

> Current as of commit `15de0bf`, which is on `origin/main` and deployed. The
> session-10 checkpoint was left stale and cost most of a session: it reported
> two defects that had already been fixed or never existed, and both were
> chased twice before anyone checked the source. If you change something,
> change this file in the same pass.

---

## Session 15 — IN FLIGHT: director mail to stephan@ not arriving

**Reported:** the `accepted` details email for lead 28 never arrived. Called
vital.

### DEPLOYED 2026-10-15 — the lead-safety fix is live

Production Worker version history for 2026-10-15, newest first:

- `97943215-28f1-4f24-b02a-73a08d73c5d1` — **the race fix.** Migration 0006
  (applied). A real bounce test found that Resend's webhook can arrive BEFORE
  the `messages` row exists (observed: event 13:49:20, row 13:49:22), so a
  genuine bounce matched nothing and escalated to nobody. On a director
  notification that IS lead 28 — bounced offer, director never told, 24-hour
  clock running on silence — and it was live in production. 79 tests had all
  seeded the row before the event, so the suite was evidence about its own
  assumption. `reconcileUnmatched` now applies events that arrived early, as
  soon as the send is recorded. It was only visible because unmatched events
  are recorded (cae7079); before that it would have been accepted and
  discarded.
- `e6b1ea36-8376-45fa-9de8-383391b4a042` — internal submissions marked out of
  the pending queue at submit time.

- `11981630-57d6-4cb1-bd41-d120267ce323` — every send() site records its
  message id; unmatched webhook events kept. Needs migration 0004 (applied).
- `d867ea9a-e716-49a5-8fbd-3c33eb782ffc` — delivery confirmation. Built by
  `git archive` of 46c5476 (predates the uploads R2 binding) because a deploy
  from HEAD fails while R2 is disabled; recipe in
  `docs/lead-delivery-confirmation.md`.
- `bb4255a3-bdc5-4ccd-a41c-c0b67bb790e5` — the lead-safety fix below.
- `39910dc7-9d7b-4da9-93f9-ca9116fb4ae7` — 2026-09-10, the rollback floor.

The lead-safety fix is verified present in the CURRENT live bundle, by checking
the live claim page for CSS rules that exist only in the patched `claim.mjs`
(`.d{text-align:left`, `.d dl{`, `.d .m{`). Re-run that check after every
deploy — three sessions have deployed this Worker today.

Staging ran the lead-safety code as `cdf1b2bc-330e-414d-915b-56d162f9d198`.

**Internal test rows and the digest.** Leads 29 and 30 were diagnostic
submissions from this session; both sat `status='pending'` forever because
`handleLeadRoute` returns early for internal submissions without marking the
lead, so the digest would have reported "2 queued for sending" every morning
and climbed with each test. Both were set to `status='sent'` on 2026-10-15
(queued count back to 0). The CODE is fixed too, as of `e6b1ea36`: verified in
production with lead 31, which landed `status='sent'` with no offer.

Leads 32 and 33 were bounce-test leads created and then deleted by the
delivery session, along with their offers, messages and events. Production
leads are now 26, 27, 28 (real) and 29, 30, 31 (internal tests from this
session, all `sent`). Tomorrow's first digest reports arrived_24h 3,
open_offers 0, queued_now 0, failed 0, unmatched 0 — the 3 are those internal
tests, not real enquiries.

**Still not proven by a real bounce:** the DIRECTOR branch (offer expires,
lead hands to the other director with a live token). 8 unit tests cover it,
and `workers/leads-relay/scripts/manual-bounce.mjs` is committed for when
Stephan wants it driven for real — it emails Craig, so it needs his say-so.

Deployed from a THROWAWAY WORKTREE at HEAD with only two files patched, because
the main working tree carries two other sessions' uncommitted work and R2 is
not enabled on the account — a deploy from the dirty tree fails on the
`UPLOADS` binding. HEAD's worker source is byte-identical to the previously
deployed commit `7c023e1`, so the deploy changed exactly two things:

- `src/claim.mjs` — the accept page now renders the lead itself: name, a
  tappable phone, a mailto email, suburb, property type and the full message,
  all escaped. The 5-second auto-close is gone, deliberately: it would throw
  away the only copy the director is holding. An unreadable payload degrades
  to "Accepted" with no detail rather than failing the accept.
- `src/index.js` — the claim route's `notify` now records a throw on the lead
  instead of discarding it in `waitUntil`.

**Verified, not assumed:** 38 tests pass in the clean tree (31 existing + 7 new
in `test/claim.test.mjs`); production secrets and bindings unchanged after the
deploy with no `MAIL_REDIRECT_TO`; routes answer 405/400/200/404 as expected;
and the full submit-then-accept flow was run against staging on the identical
code — details block present, phone tappable, `<angle>` and `&` escaped, no
self-closing tab.

**Committed on `main`, nothing pushed** (2026-10-15, three commits on top of
15de0bf, deliberately NOT on a branch because this checkout is shared with two
other live sessions):

- `b3299d3` fix(leads-relay): show the lead on the claim page and record a
  thrown notify — **this is the commit that is deployed** as Worker version
  bb4255a3. Verified: its only `index.js` change against the previously
  deployed source is the `.catch` hunk, and its `claim.mjs` contains no
  webhook, `messages` or uploads code.
- `46c5476` feat(leads-relay): confirm delivery of emails via Resend webhook —
  NOT deployed. Needs migration 0003 on production D1, a RESEND_WEBHOOK_SECRET,
  and the webhook registered in the Resend dashboard. Note it also routes the
  daily digest through `send()`; the n8n workflow still reacts to
  `event: 'digest'`, so confirm there is no double-send before deploying.
- `ed4c19b` feat(leads-relay): accept project brief photo uploads into R2 —
  another session's work in progress, committed as a snapshot. Cannot deploy:
  R2 is not enabled on the Cloudflare account. A `RESEND_WEBHOOK_SECRET`
  comment block landed in this commit's `wrangler.toml` though it belongs with
  46c5476; cosmetic, left alone.

75 tests pass at HEAD.

Root cause of the ORIGINAL incident is still not established: Resend accepted
the message and nothing watched what happened next. The delivery-confirmation
work addresses that but needs the Resend dashboard (webhook + signing secret)
and migration 0003 applied to production D1 before it can go live.

### Production state changed this session (all deliberate, all reversible)

- `rotation.last_offered_to` set to `craig`, so the NEXT new lead is offered to
  stephan. (The pointer names who was offered LAST; the Worker offers the
  other one.)
- Lead 28 claimed for stephan via a real `POST /claim/<token>` (not a hand
  write), so every side effect ran. `claimed_by=stephan`, accepted 2026-10-15
  08:01:21 UTC, 56 min before it would have lapsed to craig.
- Lead 29 created as a deliberate internal test (`stephan@sunlogic.co.za` as
  the sender, which the Worker excludes from the rotation). No offer, no
  director paged, pointer untouched. It will sit `status='pending'` forever —
  see the wart below.

### Established by evidence

- Form is live and correct on all three sites, all posting to
  `https://leads.sunlogic.co.za/leads/contact`.
- Production Worker (version `39910dc7`, deployed 2026-09-10) has NO
  `MAIL_REDIRECT_TO`. The temporary gmail redirect is gone from production; the
  only remaining mention is `[env.staging.vars]`, which is correct.
- Rotation works on real traffic: lead 26 craig, lead 27 stephan (expired) then
  craig, lead 28 stephan.
- Mail DNS is healthy: `send.sunlogic.co.za` has SPF (amazonses), DKIM, and the
  SES feedback MX; `_dmarc.sunlogic.co.za` is `p=none`.
- `compose('accepted')` maps to `body-assignment-full.html`, which exists.
  `loadOffer` selects every field `notify` needs, so the known silent-failure
  shapes are ruled out.
- **Resend CAN deliver to stephan@sunlogic.co.za.** The lead-29 test reply was
  sent through the same Resend-first `send()` path and the user confirmed it
  arrived. So this is not a dead mailbox or a domain/filtering problem.

### Still unknown — the next step

Whether Resend actually accepted and delivered the 08:01:21 UTC `accepted`
message for lead 28. **The Resend dashboard (or API) is the only authoritative
source** and needs the user's account; `RESEND_API_KEY` is a Worker secret and
cannot be read back with wrangler, and there is no `.dev.vars` locally.

### Two real design defects found while investigating (not yet fixed)

1. **An `accepted` email that fails is invisible.** The claim route runs
   `ctx.waitUntil(notify(...))` and discards the result. `notify` writes
   `leads.last_error` on failure, but a throw before `send()` — or a dropped
   `waitUntil` — leaves no trace anywhere. That is exactly why this question
   cannot be answered from the data.
2. **The daily digest does not exercise the mail path it is supposed to
   prove.** `sendDailyDigest` POSTs only to `N8N_WEBHOOK_URL`; it never goes
   through Resend. If Resend dies, the digest still arrives and nobody learns
   anything. The dead-man's switch has a blind spot over the primary sender.

Wart: `retryPendingLeads` picks up every internal-test row (`status='pending'`,
no `pending_send` offer), does nothing, and never increments `attempts`, so the
row is re-examined every 5 minutes forever. Harmless, but it means test rows
accumulate in that query.

---

## Session 14 — Project Brief form rebuilt and LIVE

**Task:** `https://sunlogic.co.za/project-brief/` 404ed. The old WordPress
(Quform) brief form was gone. Rebuilt in the current design system, posting to
the n8n webhook that was listening the whole time.

**Committed as `88cdf51` and deployed.** `https://sunlogic.co.za/project-brief`
answers 200; `/project-brief/` 301s to it and `/project-brief.html` 308s to it;
noindex, canonical and the robots.txt disallow are all live; it is not in the
sitemap. Verified on the live origin: five categories, branch switching
correct, `SL_CHECK` 0 fails 0 warns, no console errors.

**ONE THING BLOCKS REAL USE: photo uploads are dead.**
`https://leads.sunlogic.co.za/uploads/brief` returns **404** — the Worker has
not been deployed with the upload route, because (per `ed4c19b`) **R2 is not
enabled on the Cloudflare account** and `wrangler deploy` fails on the UPLOADS
binding.

Consequence, and it is not graceful: `dlUploadFile` throws on the 404,
`dlInitForm` catches it and calls `dlFormError`, so **a brief submitted with
any photo attached fails completely** and shows "Something went wrong. Please
call us instead." The brief is not sent. A brief submitted with NO photos
posts to n8n normally and works end to end.

Decision taken: leave the abort-on-failure behaviour as is; the team is being
told not to attach photos until R2 is on.

**Photos are stored in D1. Code is done and verified; two production
commands remain, and they need the owner to run them.**

Three stores were tried before this one, and each failed for a non-engineering
reason:

1. **R2** — enabling it needs a card at checkout. `wrangler r2 bucket create`
   returns code 10042. Declined.
2. **Drive via a Worker service account** — built, tested, reverted. Needed a
   Google Cloud project created from scratch.
3. **Drive via n8n**, which already has a Drive credential — specified in
   `docs/project-brief-photo-upload-spec.md`, but it is an n8n change and goes
   through `serverMonitor`.

**D1 was already enabled, already bound, already deployed.** Photos are rows
in `brief_photos`, served back by the Worker at `/uploads/<key>`. Using the
storage that was actually available beat a better-shaped store that was not.
If R2 is ever enabled, moving is a small change in one handler and the page
never knows.

**The cost, and how it is paid:** D1 caps a value at 2 MB and a phone camera
produces 8–12 MB. So the page downscales first — `dlCompressImage` in
`shared/forms.js`, 1600px long edge, JPEG q0.82. A DB board lands ~300 KB and
stays legible. ~1,500 photos fit the free 500 MB database; `brief_photos` is
indexed on `created_at` so a retention sweep is easy later.

**The bug worth remembering.** D1 returns a BLOB as a plain Array of byte
values, not an ArrayBuffer. `new Response(row.bytes)` does **not** throw — it
returns 200 with an EMPTY body. Every photo would have served as a zero-byte
file with perfectly correct headers, and nothing would have logged anything.
Caught only by byte-comparing a round trip. The fix is
`new Response(new Uint8Array(row.bytes))`. **Keep byte-comparing round trips.**

Verified locally against `wrangler dev` with a real 300 KB PNG: upload 201,
fetch-back byte-identical, `size_bytes = length(bytes)` in the row, 3 MB
refused 413, SVG refused 415.

### DEPLOYED AND VERIFIED ON PRODUCTION — photos work

Migration applied (3 queries, database 0.10 MB) and the Worker deployed, both
by the owner on 2026-10-15; this environment's classifier blocks production
deploys.

Verified against production, not locally:

| Check | Result |
|---|---|
| `OPTIONS /uploads/brief` from the live origin | 204, allows `Content-Type, X-File-Name, X-Brief-Reference` |
| Upload a 300 KB PNG | 201 with a real URL |
| Fetch it back and byte-compare | identical |
| SVG | refused 415 |
| 3 MB file | refused 413 |
| Upload from the live page itself | 201, with and without the reference header |
| Open a photo URL in a browser | renders at full resolution |

**One thing that looks like a bug and is not.** `GET /uploads/<key>` sends no
CORS headers, deliberately, so a cross-origin `fetch()` from the page is
blocked and fails with "Failed to fetch". That cost twenty minutes of
debugging. The real consumers never do that: Trello fetches server side and a
person opens the link directly, both of which work. Do not "fix" this by
adding CORS to the GET route.

Also worth keeping: `dlCompressImage` correctly declines to compress when the
re-encode would be larger. A flat-colour PNG compresses better as PNG than as
JPEG, so it returns the original. `didCompress: false` is a pass, not a
failure.

### The only untested step

**A real brief submitted with photos attached.** Not done here, deliberately:
it writes a Postgres row, copies a Drive document, emails both directors and
opens a Trello card. That first real submission is the owner's to make.

What it should produce: the Trello card carries the first photo as an
attachment and any others as links in its description, all opening on
`leads.sunlogic.co.za`.

### Test rows left in production

A handful of verification photos are in `brief_photos` with
`reference = 'VERIFY-TEST'` or `'LIVE-CHECK'`. Harmless, a few hundred KB.
To clear them:

```bash
npx wrangler d1 execute sunlogic-leads --remote \
  --command "DELETE FROM brief_photos WHERE reference IN ('VERIFY-TEST','LIVE-CHECK')"
```

### The first real submission FAILED, and what came out of it

Submitted 2026-10-15 with photos. It showed "Something went wrong. Please call
us instead." and sent nothing.

**Diagnosis, from the data rather than a guess:** zero executions of
`e86TQUi0qAbwqqVk`, no new row in `sunlogic_briefs.submissions` (still id 40,
Craig Lewis), and no photo row in D1 beyond my own test rows. So the photo
upload failed and the page correctly refused to send a brief whose photos were
missing. The fault was the message, not the refusal.

**Most likely cause:** `file.type` is EMPTY for a lot of real files, HEIC
straight off an iPhone being the common one. An empty type skipped
compression AND failed the server's allow-list, so an ordinary iPhone photo
came back "unsupported file type" with nothing on screen to say so.

Four things changed as a result:

1. **`novalidate` is now set on every form by `dlInitForm`.** This is the big
   one. With `required` on the controls the browser validated first and
   **never dispatched `submit`**, so the handler and every message it produced
   were dead code on any form with a problem. The `required` attributes stay;
   `dlValidate` reads them.
2. **Field-level errors.** `dlFailField` marks the control red
   (`--color-error-container`, a token that existed and had never been used on
   a surface), writes the reason under that field, scrolls to it and focuses
   it. Corrected input clears it immediately.
3. **File type inferred from the extension** when the browser gives none, and
   files checked **when they are chosen** rather than at submit. A HEIC that
   cannot be resized now says so, and says what to change on the iPhone.
4. `--color-error-container` added to `sunlogic-check.js`'s palette. It was a
   real token missing from that list, which the rule's own comment
   anticipates.

### Three changes the owner asked for, all done

- **Project Brief Submitted By is a dropdown**: Stephan Marais, Craig Lewis.
  Not guessed — taken from the 40 rows already in
  `sunlogic_briefs.submissions` (Stephan 22, Craig 17, one blank). It renders
  as `[Team Lead]` on the client-facing brief document, so a typo there
  reaches a client.
- **Street Address searches as you type.** OpenStreetMap Nominatim, chosen
  over Photon because it takes `countrycodes=za`, so "Main Road" returns Cape
  Town rather than Manchester. Free, no key. Debounced 600ms and silent under
  three characters, which keeps it inside Nominatim's one-request-a-second
  policy; attribution is in the field hint, as that policy asks. Keyboard
  navigable. **Picking a result also fills GPS location and Google Maps
  Link**, which were previously typed by hand or left blank. All four Street
  Address fields, one per branch.
- **Invalid fields are shown, named and jumped to** — see above.

Verified in the browser: empty form marks and focuses "Project Brief Submitted
By" with "Please choose an option"; a bad email marks and focuses with "Enter
a valid email address, like name@example.co.za"; real typing clears it;
"9 Chesham Road Claremont" returns a suggestion and filling it sets GPS
`-33.9781261, 18.4854264` and the matching Maps link. Conformance 0/0.

### Gas added as a fifth Job Category

`Renewable | Electrical | Gas | Quote Request | Other`. The Gas branch carries
address, GPS, maps link, Building Type, Proposed Date, photos and comments.

**It has no Residential/Commercial field.** The first cut gave it one in the
`Type` key; it was removed because `Business or Personal`, asked of every
brief, is the same question. Reasoning and the condition that would reverse it
are in `docs/project-brief.md`.

No backend change: `job_category` is free text, so "Gas" lands without a
migration, and the branch reuses keys that already exist. Gas photos use
`Please upload photos` (`upload_photos`), the same path as Electrical.

Verified: Gas selected shows only the Gas branch, payload is 15 keys with
`Job Category: "Gas"` and no stray `Type`, conformance 0/0.

**The page is excluded from the CI gate** (`EXCLUDED_PAGES`), so its
conformance is only ever checked by hand. It was checked at the two viewports
the gate itself uses, 412x823 and 1440x900, across all five Job Categories:
0 fails, 0 warns, no horizontal scroll at either width. Re-check it the same
way after any edit to this page, because nothing in CI will.

**One defect found and fixed while verifying:** the inline success heading read
"Brief submitted", and a card heading of five words or fewer must be Title
Case. It is now "Brief Submitted". Worth noting how it was missed first time
round: `SL_CHECK` was only ever run on the unsubmitted page, and that heading
does not exist until the form is replaced by the success panel. **Run the check
after submit as well as before.**

### `npm test` runs again — Playwright browsers were missing

`test/conformance.test.js` was failing because Playwright could not launch:
the installed package (1.62.1) wanted `chromium_headless_shell-1234` and the
cache only held `1243` and `1248`. Fixed with `npx playwright install`.
Nothing to do with the brief form; it had been blocking `npm run conformance`
and `npm run sweep` the same way.

**`npm test` after the fix: 127 of 128 pass.** The one failure is
`tools/doc-builder/harness/api-test.mjs`, which is **untracked work in
progress belonging to someone else** (`?? tools/` was already in git status at
the start of this session). It fails on a hard-coded path from another machine:

```
ENOENT: no such file or directory, open '/home/claude/docbuilder/examples/SL-2609-IMY-proposal.json'
```

Not caused by this work and not this session's to fix, but whoever owns
`tools/` should know their harness cannot run on this Mac.

**`npm run conformance` after the fix: green.** 25/25 pages, 0 fails and 0
warns at both gated viewports (412x823 and 1440x900). That is the whole gate
passing on the three built sites with these changes in place. It does not
cover `project-brief.html`, which is in `EXCLUDED_PAGES` and was checked by
hand instead.

### Before this goes live

1. `npx wrangler r2 bucket create sunlogic-brief-uploads` (and
   `-staging`), then deploy the Worker. Until then `/uploads/brief` answers
   503 and photos cannot be attached; the rest of the form works.
2. Nothing has been posted to the live webhook. **The first real submission is
   untested end to end** — it writes a row, copies a Drive doc, emails both
   directors and opens a Trello card, so it was left for a human to do
   deliberately rather than as a test.
3. The three n8n defects in `docs/project-brief.md` (dead WordPress delete
   calls, a hard-coded secret in the workflow JSON, an unauthenticated
   webhook) are iMac changes and belong to `serverMonitor`.

---

## /solar became /energy, 2026-10-15

The division rename (Solar → Energy) had been applied to the nav and footer
labels but never to the page itself. Every label said Energy; the address said
`/solar`, and the page's own eyebrow and `<title>` still said Solar. Clicking
"Run the Sums Yourself" on the Energy home page therefore landed you on a URL
and a hero that both announced a division the site no longer has — which read
as the header changing rather than as a page you had navigated to.

`site-energy/solar.html` is now `site-energy/energy.html`, served at `/energy`.

| Changed | Detail |
|---|---|
| The page | `git mv`, plus its canonical, `og:url` and `<dl-nav-bar active>` |
| `sites.config.js` | nav and footer entries: `solar.html` → `energy.html`, key `solar` → `energy` |
| 7 in-site links | home page x4 (`#home-cost`, `#at-home`, `#small-business`, `#larger-sites`), 404 page, and 4 blog posts linking `#calculator-home` |
| `sitemap.xml`, `llms.txt` | the page's own URL |
| `site-energy/_redirects` | **new** `/solar` and `/solar.html` → `/energy` 301 |
| `site-main/_redirects` | its `/solar` 301s now target `energy.sunlogic.co.za/energy` |
| `site-electrical/_redirects` | same |

The apex and Electrical both already carried `/solar` → Energy redirects. Those
are the "all three sites" part — retargeted, not removed, so an old apex link
still lands in one hop.

**Deliberately NOT changed — visible copy.** The page still calls itself Solar
in three places: the hero eyebrow `SOLAR`, the `<title>` "Solar Sized On What
You Use | …", and button labels like "Solar at home" on the home page. That is
copy, and copy on this site runs through the skills that own it — and "solar"
is still the correct word for the technology even where it is the wrong word
for the division. Needs a decision, not a find-and-replace.

**Also left alone, on purpose**
- `shared/components.js` fallback nav/footer — pre-rename throughout
  (`Home · Solar · Electrical · Energy`), used only when a page is opened off
  disk with no `SL_SITE`. Renaming one entry of four would make it incoherent;
  it wants its own pass.
- `shared/sunlogic-check.js:432` names `solar.html` in a note about a past
  fix. Changing it would falsify the history it records.
- `docs/` (plans, specs, copy reviews) and `archive/site-tailwind/` — dated
  records of what was true then. `docs/site-architecture.md` describes the
  pre-split single site and is stale for other reasons too.
- `test/site-pages.test.js` uses `solar.html` as an invented fixture filename,
  not a reference to this page.
- `/energy-management` is still named for the pre-rename "Energy management"
  division, now called Smart Solutions — the page content already says Smart
  solutions, only the URL is stale. Same job, not done.

Verified: conformance 25/25 pages, 0 fails / 0 warns at both viewports; sweep
575 combinations, 0 findings; `npm test` 137/138, the one failure still the
untracked doc-builder harness. Locally `/energy` is 200. Nav highlighting
survives the key rename — `Energy` carries `aria-current="page"` and
`data-has-active="true"`. No `href` to the old page survives in any built page
of any site; the three remaining "solar" matches are an image filename, an
external citation, and a `mailto:` subject.

---

## Where this stands — read this first

**Task:** fix three mobile defects reported from a phone, across the apex,
Energy and Electrical sites. **Done, deployed, verified live.** The work then
grew one step: the Electrical deploy failed on a flaky gate while shipping it,
so the gate was fixed as well.

**Branch `main`, in sync with `origin/main`. The only uncommitted file of
mine is this one** — a docs-only commit would re-trigger all three Pages
builds, so it was left for whoever wants to batch it with real work.
Four commits this session, all pushed and all deployed:

| Commit | What |
|---|---|
| `9f0a84a` | `fix(layout): release dl-hero and dl-section height floors on upgrade` |
| `9912d57` | `fix(footer): centre footer in single-column phone state` |
| `6025061` | `fix(brand): show each site's own lockup in the mobile menu drawer` |
| `15de0bf` | `fix(ci): retry page navigation in the conformance and sweep gates` |

**Files touched this session**

| Path | Change |
|---|---|
| `shared/sunlogic.css` | hero/section height reservations scoped to `:not(:defined)`; new `@media (max-width: 559px)` footer-centring block |
| `shared/components.js` | comment only — the logo note named files that no longer describe what happens |
| `sites.config.js` | `logoWhite` repointed per site |
| `site-main/images/sl_logo_main_white.svg` | new |
| `site-energy/images/sl_logo_energy_white.svg` | new |
| `site-electrical/images/sl_logo_electrical_white.svg` | new |
| `scripts/page-load.js` | **new** — shared `loadPage()`, owns deadline/attempts/retry announcement |
| `scripts/layout-sweep.js` | uses `loadPage`; `aborted` flag; `SWEEP_CONCURRENCY` |
| `scripts/conformance.js` | uses `loadPage` |

**Still dirty, and none of it mine — do not sweep it into a commit.**
Modified before this session: `site-energy/_headers`, `site-energy/_redirects`,
`site-energy/robots.txt`. Untracked WIP: `Claude outputs/`,
`site-energy/plugins/doc-builder/`, `site-energy/plugins/quote-builder/`,
`site-energy/share/`, `site-energy/tools/`, `tools/`, `workers/doc-share/`.

**Live state verified by response body, not by assumption.** All three domains
serve `sunlogic.css?v=cb7d6876`, each with its own drawer lockup, and all three
new SVGs return 200. All three Pages projects are green on `15de0bf`, and the
gates ran clean inside Cloudflare's builder with **zero** retry lines.

### Next steps

1. **Nothing is required.** The reported defects are closed and live.
2. If `  retry ` lines start appearing in Pages build logs, the builder is
   saying the pool is too big — set `SWEEP_CONCURRENCY` in the Pages dashboard
   rather than editing `scripts/layout-sweep.js`.
3. `tools/doc-builder/harness/api-test.mjs` fails locally on a hardcoded
   `/home/claude/docbuilder/examples/SL-2609-IMY-proposal.json`. It is in
   untracked work so CI never sees it, but it makes local `npm test` 83/84
   instead of green. Worth fixing before that work is committed.
4. The old shared `images/sl_logo_white.svg` is now unreferenced by all three
   sites. `tools/doc-builder` embeds its own base64 copy, so deleting the three
   site copies is safe — not done, not urgent.
5. Playwright browsers were not installed on this machine; `npx playwright
   install chromium` was needed before any gate would run. Expect that on a
   fresh checkout.

### Key decisions, and why

- **`:not(:defined)` rather than re-measuring 964px.** A reservation is a guess
  at a height; the moment the real element mounts, the guess is worse than the
  measurement. Scoping it means the number never has to be re-measured when
  hero copy changes — being wrong now costs a shift, not a permanent gap.
- **Footer centring is `max-width: 559px` only.** At 560 and up the shared left
  edge is what makes the columns read as columns.
- **Per-site white lockups are generated from each site's own `_blue` file**,
  navy wordmark to white. Fill counts confirm it touches only the wordmark
  letters: 8 / 14 / 18 for Sunlogic / +ENERGY / +ELECTRICAL.
- **Only page *loading* is retried, never measuring.** Measurement here is
  deterministic — conformance's "did not expose `window.SL_CHECK`" is a real
  diagnosis, and burying it under "failed 3 attempts" would turn it into noise.
  A flaky load is infrastructure; a failing measurement is a finding.
- **Retries are printed on purpose.** A flake that is silently swallowed is a
  flake nobody ever fixes.
- **The Electrical failure was retried, not patched around.** The identical
  commit passed on retry and on the other two sites, which is what made it
  infrastructure rather than a defect — then the infrastructure was fixed.

---

## Mobile fixes, 2026-10-06 — three defects, all three sites

Reported from a phone: a slab of empty beige under the apex hero, footers
left-aligned down the middle of the screen, and the wrong logo in the menu
drawer. All three fixed and verified at 375px on all three sites.

| What | Where | Fix |
|---|---|---|
| ~400px gap under the apex hero | `shared/sunlogic.css` | The pre-upgrade height reservation on `dl-hero` (964px) never released. Scoped it — and `dl-section`'s 500px — to `:not(:defined)`, so the floor holds space until the element upgrades and then gets out of the way. The number no longer has to be re-measured when hero copy changes. |
| Footer left-aligned on phones | `shared/sunlogic.css` | New `@media (max-width: 559px)` block centres `.sl-footer`, its brand block, its columns, the eyebrow's flex axis and the social row. 560 and up is untouched — the left edge is what makes those read as columns. |
| Drawer showed the shared lockup on all three sites | `sites.config.js`, three new SVGs | `logoWhite` now points at per-site artwork: `sl_logo_{main,energy,electrical}_white.svg`, each generated from that site's `_blue` lockup with the navy wordmark set to white. The old `sl_logo_white.svg` (a different lockup, with a "Solar & Electrical" sub-line) is no longer referenced by the sites — `tools/doc-builder` still embeds its own base64 copy and is unaffected. |

Checks: `conformance` 25/25 pages, 0 fails, 0 warns at both viewports;
`sweep` 575 page/width combinations, 0 findings. `npm test` 83/84 —
the one failure is `tools/doc-builder/harness/api-test.mjs`, which opens a
hardcoded `/home/claude/docbuilder/examples/...` path. Pre-existing, in
untracked doc-builder work, unrelated.

**Deployed and verified.** All three Cloudflare Pages projects serve `6025061`
and later `15de0bf`. `sunlogic-electrical`'s first build failed and was retried
via the Pages API (`.../deployments/<id>/retry`) rather than by pushing an
empty commit — see below.

### The sweep is no longer a coin toss

`sunlogic-electrical` deployment `84926717` failed on this commit. Not the
change: `npm test` 70/70 and `conformance:electrical` 10/10 both passed, then
`sweep:electrical` died on `page.goto: Timeout 30000ms exceeded` navigating to
`blog-3-essential-checks.html` — a page this change does not touch, from a
static server on the builder's own loopback. The retry passed on the identical
commit.

Cause: `scripts/layout-sweep.js` ran six concurrent tabs, each decoding hero
photography, and `waitUntil: 'load'` waits for every one of those images. On a
build container that crosses Playwright's generic 30s default, and one
rejection failed all 575 combinations. Fixed in the same file:

- `NAV_TIMEOUT_MS = 60000` — a deadline chosen for this workload, not inherited
- three attempts on a fresh page, with backoff, before believing a timeout
- retries are **printed**, so a flake that becomes chronic is visible in the
  build log rather than silently absorbed
- an `aborted` flag, so once one combination gives up the other five workers
  stop instead of retrying into a closing browser
- the failure now names the page **and the width**, and the headline comes
  before the stack
- `SWEEP_CONCURRENCY` turns the pool down from the Pages dashboard with no
  code change, if a builder ever needs it

Verified by forcing `NAV_TIMEOUT_MS = 1`: 12 retry lines (six in-flight jobs x
two retries), then a single labelled failure and exit 1 — no screenful of
teardown noise. Full sweep back on 60s: 575 combinations, 0 findings.

`scripts/conformance.js` had the identical unguarded goto. It is sequential,
so it never had the six-way contention and never tripped — but "has not failed
yet" is not a property, so it was fixed in the same pass.

Both gates now load pages through **`scripts/page-load.js`**, which owns the
deadline, the attempts and the retry announcement. One place to tune, and the
two gates cannot drift apart.

**Only loading is retried.** Nothing that measures a page is. Measurement here
is deterministic — when conformance says a page never exposed
`window.SL_CHECK`, that is true and will be true three times, and wrapping it
in "failed 3 attempts" would turn a precise diagnosis into noise. A flaky load
is infrastructure; a failing measurement is a finding. `loadPage` therefore
returns the loaded page and the caller measures it outside the retry loop.

Verified by forcing the deadline to 1ms: sweep gives 12 retry lines (six
in-flight jobs x two retries), one labelled failure naming page **and width**,
exit 1; conformance gives exactly 2, labelled, exit 1. Restored and diffed
byte-identical. On the real deadline: conformance 25/25 pages, 0 fails /
0 warns at both viewports; sweep 575 combinations, 0 findings; `npm test`
unchanged at 83/84, the one failure still the untracked doc-builder harness
opening a hardcoded `/home/claude/` path.

---

## FIRST THING TOMORROW (2026-09-11)

**Confirm the daily digest arrives at 07:00 SAST.** Task 12 Step 4 of the lead
plan calls this "the acceptance test for the whole feature — if it does not
arrive, something is broken and everything else was theatre."

If it does not arrive:
- `cd workers/leads-relay && ../../node_modules/.bin/wrangler tail --env=""`
- The digest is the `0 5 * * *` cron in `wrangler.toml`, handled by
  `sendDailyDigest` in `src/index.js`. It POSTs to n8n, which renders it.
- The Workers Free plan caps cron triggers at five ACROSS the account. A
  deploy that exceeds it uploads the code and silently schedules nothing.

Also still open: **watch the first real lead end to end** (Step 3).

---

## Lead rotation went live 2026-09-10

Three commits, all deployed. Worker version `39910dc7` serving 100%.

| Commit | What |
|---|---|
| `1a71c39` | Removed `MAIL_REDIRECT_TO` from production; excluded our own submissions from the rotation |
| `7c023e1` | Auto-reply to internal test submissions |
| `b58c684` | Recorded the `sales@` decision |

**Test mode is off.** Real notifications now reach whichever director's turn it
is. The TEST MODE banner on every email and the digest's redirect notice were
both conditional on `MAIL_REDIRECT_TO` and disappeared with it. **Staging keeps
its own redirect deliberately** — that is the entire reason that environment
exists. Never set `MAIL_REDIRECT_TO` in production.

**Submissions from `@sunlogic.co.za` are stored but take no turn.** Partners
test the form, and three tests in a row would otherwise hand the next three
real leads to the same director while the 30-day split still looked even.
Nothing would error and nothing would log. The rule is `isInternalSubmission`
in `logic.mjs`, anchored at both ends so `notsunlogic.co.za`,
`evil-sunlogic.co.za` and `sunlogic.co.za.evil.com` all pass through: a false
positive means a real customer's enquiry reaches nobody, which is the worst
thing this system can do.

**`sales@` is not a recipient anywhere** and has not been since Task 9. It
stays as Reply-To on visitor-facing mail, deliberately: a customer replying to
their own estimate should reach the shared mailbox rather than one director.

---

## State: all three divisions are written

Apex, Energy and Electrical are all copy-reviewed, gated and live.

**Electrical, done 2026-09-10.** Three of its four main pages had belonged to
other divisions: the home page was the pre-split apex homepage with the H1
"Solar Power & Certified Electrical Contracting", the Smart page was the Energy
division's smart page selling geyser controllers, and the blog index led on
"what solar costs". All rewritten. The spine is Craig's unanswered first item:
electrical has no built-in motive the way solar does, so the argument is a
deadline somebody else sets — selling, claiming, a lease renewal, adding load,
something already broken.

Also: WhatsApp added to the dock on all three sites (Craig's item 10), and
`<dl-hero lights>` built as Electrical's answer to Energy's sunrise flare.

**Two visible placeholders ship deliberately on Electrical** — the proof
section and the smart capability list. Both are blocked on Craig and both are
in "Open" below.

---

## State: Energy is done

All 12 Energy pages are written, copy-reviewed, gated and pushed. **No visible
placeholder remains on any public Energy page.** Nothing is outstanding that
counts as a defect.

| Check | Result |
|---|---|
| `npm run build` | three sites |
| `npm run conformance` | 25/25 pages, both viewports, **0 fails** |
| `npm run sweep` | 550 page/width combinations, 0 findings |
| `npm test` | 70 passing |

**That gate failure is fixed.** It was `/electrical/electrical.html` mixing
heading cases in one grid; the heading is now "Lighting Pays Back Fastest".
**The gate is green across all 25 pages, both viewports, for the first time.**

---

## Shipped this session

| Commit | What |
|---|---|
| `d74fecf` | Smart Solutions smart-home pillar rewritten around energy management |
| `ffa043d` | All four Worth Knowing posts rewritten, every blog hero replaced |
| `47ae43b` | Preview server serves clean URLs like Cloudflare Pages |
| `49751c7` | Three copy chief reviews saved to `docs/copy/` |
| `e803211` | Rent-to-Own placeholders closed |
| `c9e6e63` | Smart switching priced (on quote, with the reason) |
| `3c917f4` | Privacy policy issued in Sunlogic SA (Pty) Ltd's name |
| `9012549` | Plentify claims corrected against their own pages |

### Two things that were wrong in public and now are not

1. **The Plentify product claims.** The last checkpoint flagged these on
   4 September and they were still live. Every claim on both cards is now
   checked against `plentify.io/non-solar-households` and
   `plentify.io/solar-households` (6 Sep 2026). HotBot does **not** learn a
   household's usage; Plentify's words are "Input your routine and we'll
   optimise your system to suit your needs". SolarBot does **not** read weather
   forecasts, load shedding schedules or household behaviour — none of the
   three appears anywhere on their site. All cut. What survives is theirs
   verbatim.
2. **Cancellation terms**, absent since the page was built because three
   sources disagreed. Found on both Plentify product pages and now quoted with
   a link: "Sign up for your subscription and cancel anytime. After 60 days a
   fee will be charged." **The subscription is Plentify's, not Sunlogic's**,
   so their term is quoted rather than restated. That sentence is genuinely
   ambiguous about whether the fee applies inside sixty days or after, and the
   page deliberately does not pick a reading.

### Corrected in the blog rewrite, worth not reintroducing

Both 2022 solar posts treated **a battery as the thing that makes a system
off-grid**. It is not: off-grid means no utility connection, and a hybrid
grid-tied system stores solar and rides through an outage while staying
connected. Two articles said otherwise and would have sent people to the wrong
quote. Also corrected: "230VA" (volt amps are not voltage), "high-voltage 230V"
(it is low voltage), "four to six hours of sunlight" (that is peak sun hours),
"15-20KW of power a day" (kW is a rate, kWh is a quantity), an unsourced "up to
20%" geyser figure, and a national panel-import figure of "nearly R2.2 million"
that is off by orders of magnitude.

### Archive policy, settled

Three of the four blog posts are 2022 press releases. They are **not**
republished under today's date and **not** rewritten under an unchanged 2022
date. `datePublished` stays 2022, each byline reads "25 August 2022, updated
6 September 2026", `dateModified` matches. **No words were invented for Craig
Lewis.** Quotes still true are verbatim and attributed to when they were said;
the one that had expired was removed rather than edited.

---

## Open, logged, not defects

Neither of these breaks anything and no page promises them. Recorded so they
are not lost, and so they are not raised again as though they were faults.

- **An SME proof job for the Energy home page.** All three cards under "Three
  Systems We Installed" are residential (a school is the closest to a
  business), while the page sells to SMEs. Needs one commercial job: a
  photograph, the suburb or business type, and what was fitted.
- **Saving figures on those three cards.** Currently they state what was
  fitted, which is what the heading promises, so nothing is missing against the
  page's own claim. Adding savings needs real per-job numbers. A "typical"
  figure would break the same sourcing rule enforced everywhere else.

## Open, needs someone other than Claude

- **Information Officer email.** `legal.html` on all three sites tells readers
  to address requests to the Information Officer "via the e-mail address
  mentioned below", and no address appears anywhere in it. POPIA expects that
  contact. Not invented.
- **CTA ground.** The closing CTA sits on `--surface-sunk`. The owner had
  asked for the alt tint; alt collides with an alt section on 11 pages and
  would recreate the same seam. One line plus 11 page edits if the preference
  stands.

---

## Still open on Electrical

The Electrical block is done. These are what survived it, each verified on
2026-09-10 rather than carried forward on trust.

**Blocked on Craig, and no writing fixes them:**
- **Three to five real electrical jobs** for the proof section on
  `site-electrical/index.html`: photograph, the problem, what was done, and the
  outcome. A mix of residential and commercial, at least one DB upgrade. The
  section is currently a visible labelled empty state, which keeps its slot so
  filling it is a copy job rather than a rebuild. Craig's own review calls this
  the highest-value item on his list and the thing every competitor is weakest
  on, and he is right.
- **The full smart capability list.** `energy-management.html` argues "the
  clever part is behind the wall" and can only name load control, sub-metering
  and charging. Craig's document flags this exact gap. Access control,
  intercoms and lighting control are listed there as room to grow into, not as
  current capability, so none of them is claimed.
- **`blog-ev-home-charging.html`** carries `[Hero photography pending: no
  EV/charger photography exists yet]`.
- **The subscription agreement** dates its Initial Term from a "Free Trial" it
  never defines, and says Sunlogic retains ownership of a device the product
  copy elsewhere describes as bought. Both are contract questions.

**One-line fixes: both done in `6491b9a`.** The Electrical privacy statement
now names Sunlogic SA (Pty) Ltd, so all three legal pages agree, and
`main/llms.txt` is clean. Every `llms.txt` on the estate is now free of em
dashes. The one left in each `robots.txt` is inside a `#` comment, which is the
same position taken for those in HTML and CSS comments.

**Fixed, so do not go looking:** the `/electrical/electrical.html` gate failure,
the "Three Recent Jobs" section carrying the Energy division's solar specs,
`electrical/llms.txt`'s em dashes, the Electrical privacy statement's entity
name, and `main/llms.txt`'s em dashes.

**Everything left on Electrical is blocked on Craig.** There is no one-line fix
outstanding.

---

## Standing rules learned or reconfirmed this session

- **Never assume a person's gender**, including in a case study about a
  customer. "This client" over "he".
- **Unresolved facts ship as visible bracketed placeholders**, never as
  plausible inventions and never silently dropped.
- **Do not hedge an unsourced claim.** Hedging keeps the risk and loses the
  force. Cut it.
- **A number inside an image is invisible to the gate.** The tips hero on
  `blog-five-tips-load-shedding.html` has "Savings: 22%" and a 72°F thermostat
  printed on it. The owner was told and chose to ship it.
- **`fetch()` normalises `/../x` before the request leaves the client**, so a
  path-traversal test written with `fetch` tests nothing. Use a raw
  `http.request`. Found by mutation-testing the guards.
- **Check what references a file before deleting it.** Deleting three
  superseded blog images broke five references across `thank-you.html` and
  `ci-guide.html`.
- **Prove a new gate rule by injecting a violation.** Every guard added to
  `static-server.js` was mutation-tested.

## Reference

- Copy reviews: `docs/copy/` (13 files, including `energy-blog-review.html`,
  `energy-smart-home-review.html`, `voltiq-tiers-review.html`)
- Never commit: `.claude/`, `Sunlogic_Feedback_Decisions.*`, `copy/Sunlogic_*`,
  `_incoming/`, `_shot.js`, `_audit.mjs`
- Preview: `node scripts/preview.js 8433`, then
  `http://127.0.0.1:8433/energy/` — clean URLs work, so the `.html` is optional
- Deploys: Cloudflare Pages watching `main`. There are **no GitHub Actions**;
  `.github/` was removed deliberately in `df52882`.
