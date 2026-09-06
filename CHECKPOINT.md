# Checkpoint — Sunlogic Website

**Saved:** 2026-09-06 (session 11 — **Energy division complete and pushed**. Next block: Electrical.)

> Everything below is current as of commit `9012549`. The prior checkpoint
> (session 10, 4 September) was left stale and cost most of a session: it
> reported two defects that had already been fixed or never existed, and they
> were chased twice. If you change the site, change this file in the same pass.

---

## State: Energy is done

All 12 Energy pages are written, copy-reviewed, gated and pushed. **No visible
placeholder remains on any public Energy page.** Nothing is outstanding that
counts as a defect.

| Check | Result |
|---|---|
| `npm run build` | three sites |
| `npm run conformance` | 25/25 pages, both viewports. **1 fail, and it is not Energy** (see below) |
| `npm run sweep` | 550 page/width combinations, 0 findings |
| `npm test` | 65 passing |

**The one gate failure is `/electrical/electrical.html`** — a grid mixing
heading cases, "Lighting is usually the fastest saving" against "Three-Phase
Supply". Left alone all session because Electrical was out of scope. It is one
reword and the gate goes green.

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

## Waiting for the Electrical block

Listed here only so nothing is lost. **Do not start these without being asked.**

- `site-electrical/legal.html` still names **"Automated Publishing Services
  (PTY) Ltd"** in the privacy statement. Energy and main were corrected in
  `3c917f4`; Electrical was deliberately skipped.
- The gate failure named above.
- Electrical's "Three Recent Jobs" section is **the Energy division's three
  solar jobs under an electrical heading**, and its own heading promises "one
  real number" per job that the specs do not provide. Needs three actual
  electrical jobs: a DB rebuild, a rewire, a CoC, an EV charger, surge
  protection. Per job a photograph, suburb, and a number an electrical buyer
  cares about.
- `blog-ev-home-charging.html` carries `[Hero photography pending: no EV/charger
  photography exists yet]`.
- Em dashes remain in `main/llms.txt` (3) and `electrical/llms.txt` (6). Every
  other em dash on the sites is in a code comment, not visible copy.

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
