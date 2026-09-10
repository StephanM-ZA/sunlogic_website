# Checkpoint — Sunlogic Website

**Saved:** 2026-09-10 (session 12 — **all three sites written and live. Lead
rotation switched on.** Next action is an observation, not a task: see below.)

> Current as of commit `b58c684`. The session-10 checkpoint was left stale and
> cost most of a session: it reported two defects that had already been fixed
> or never existed, and both were chased twice before anyone checked the
> source. If you change something, change this file in the same pass.

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
