# Checkpoint — Sunlogic Website

**Saved:** 2026-09-04 (session 10 — Energy home DONE and banked, uncommitted. Next: solar.html)

## Session 10 part 3 — Energy home signed off. CI rules changed with it.

The user reviewed the built page and gave a long list. All of it is done, the
gate and the sweep are clean, and nothing is committed. **Next task: the same
copy loop for `site-energy/solar.html`, the main Energy page. Its new copy is
at `copy/Sunlogic_Solar_Site_Copy.md` (9,765 words, NEVER COMMIT that file).**

### Page changes, energy home

- Plentify out of the trust strip. Three items now, all provable.
- Smart control **rewritten twice**. First widened past the geyser into two
  device cards, which the user rejected: the product claims were wrong AND no
  brand or product detail belongs on a home page. Now a single block making
  the timing argument with no brand, no device, no price, no feature list.
  Heading "Your Panels Peak at Noon. Your House Peaks at Seven." A comment in
  the markup says not to put specifics back.
- Lead paragraph, the two sums cards, the four Why Sunlogic claims and the
  three audience cards all got icon treatments.
- Blog cards got cover images and publish dates.
- Card headings past five words went to sentence case.

### CI and rules changed. These roll out to every page.

| Change | Where |
|---|---|
| Card/step headings past five words are sentence case; hero, section and CTA headings stay Title Case at any length | `sunlogic-check.js` rule 6, enforced as a fail. Found 9 violations on 6 pages across all three sites, all fixed, article titles changed on both the card and the post's own heading |
| Callout is THE highlight block: tinted surface, 3px rule, lead-size copy | `.sl-callout`, applies everywhere, not a variant |
| New tokens `--surface-highlight #FEEDD9`, `--border-highlight #F5D6AE`, `--accent-highlight #F0A050` | added to the check's PALETTE too, which caught them first |
| Statement band is an inset 16px panel, not full bleed | `.sl-statement-wrap` + `.sl-statement` |
| Closing CTA sits on `--surface-sunk`, and is now COUNTED as a band | rule 7 no longer resets on it |
| Division promo carries the CTA's ground and is NOT a band of its own | rule 7 skips `.sl-section--promo` |
| Promo card floats: resting lift, pointer-proximity drift, touch press | `SL_PROMO_FLOAT` in components.js, `.sl-hero--promo` in the CSS |
| Footer is a grid with three fixed states, not wrapping flex | `.sl-footer__groups` |
| `.sl-prose p.sl-body--lg` keeps lead size inside prose | specificity fix |
| Three icons added from the Heroicons source: `home`, `building-office-2`, `calculator` | `shared/icons.js`, fetched not transcribed, 27 Heroicons + 3 brand |
| CI guide updated on all three sites: case rule, highlight, statement shape, article cards | `site-*/ci-guide.html` |

### Flare, final tuning

Rise 30s, dark **46s**, dusk **0.42**, and the dark half now eases down over the
first quarter, **holds flat at full depth**, then lifts. A plain curve spent an
instant at the bottom and read as a flicker. Full cycle 76s.

### Two corrections I owe the record

1. `energy-management.html` is live right now claiming the controllers are made
   by Plentify, that one detects geyser leaks, and that the other decides when
   to charge and draw on the battery. The user says Plentify does not make that.
   **That page is wrong in public.** Not yet fixed.
2. The "Our Work has no photographs" finding from copy rounds 2 and 3 was
   measured on my own assembled preview, not the live page, which has all three.
   Withdrawn in `docs/copy/`.

### Open decisions

- CTA ground: asked for the alt tint, shipped on sunk. Alt collides with an alt
  section on 11 pages and would recreate the same seam there. One line to change
  plus 11 page edits if the user prefers alt.
- Smart control still has no commercial equivalent to point at. Business
  question, not a copy one.

### Verified at this point

`npm run build`, `npm run conformance` 25/25 pages 0 fails 0 warns both
viewports, `npm run sweep` 550 combinations 0 findings. Lighthouse desktop 99,
mobile 86/100/100/100 (mobile LCP and cache findings are artefacts of the local
python server, not the site).

---

**Saved:** 2026-09-04 (session 10 — Energy home v3 copy + sunrise flare, BUILT, uncommitted)

## Session 10 part 2 — v3 copy and the sunrise flare are IN. Not committed.

User approved v3 copy and the tuned flare, then said "lets go". Both are now
written into the source and built. Nothing is committed and nothing is deployed.

### Files changed

- `site-energy/index.html` — rewritten to the v3 structure. Twelve sections in
  the order the reviews argued for: hero, trust strip (4 items), why now with the
  two sums side by side, the whole job (5 steps, moved to second), why Sunlogic,
  who we work for, compliance + day feed, our work, smart control at home, blog,
  close, electrical promo. New title and meta description, since the page no
  longer sells electrical.
- `site-energy/solar.html` — the demand charge callout added to the small
  business section. **UNVERIFIED, flagged in the markup.**
- `shared/sunlogic.css` — `.sl-flare` rig and `.sl-hero__dusk`, plus their
  reduced-motion state.
- `shared/components.js` — `SL_FLARE_MARKUP`, `SL_FLARE_PATHS`,
  `SL_FLARE_REGISTER`, and `SL_HERO_LAYERS` became a function taking a flare flag.

### The flare, and why it is opt in

`<dl-hero flare="sunrise">`. Only `site-energy/index.html` carries it. Electrical
gets a different feature later and main stays as it is, per the user, so the
attribute is per hero rather than a change to every hero.

Sixty second cycle: thirty seconds of the sun tracking a path read off the
photograph, then thirty with it gone while the scene dims 26% and lifts.
Path `[[95.5,41.9],[87.3,34.7],[77.1,23.5],[65.4,11.1],[50.1,0.1]]`, Catmull-Rom,
emerge 24%, vanish 34%. Tuned by the user in throwaway tuners under `dist/energy/`
(git ignored, wiped by the next build).

Two things that were deliberate, not incidental:
- Position moves on a **transform**, never left/top. The blurs run to 118px and
  re-laying-out a blurred element every frame is what would have made it costly.
- The dusk layer sits **below both scrims**, so the scene dims while the heading
  and buttons hold their contrast. Above them it would fail contrast for thirty
  seconds in every sixty.

### Verified

| Check | Result |
|---|---|
| `npm run build` | all three sites |
| `npm run conformance` | 25/25 pages, 0 fails, 0 warns, both viewports |
| `npm run sweep` | 450 page/width combinations, 0 findings |
| Lighthouse desktop, energy home | performance 99, LCP 0.9s, CLS 0, TBT 0 |
| Lighthouse mobile, energy home | performance 86, a11y 100, best practices 100, SEO 100 |
| Flare cost, same page with the attribute removed | LCP 4277ms vs 4203ms, score 86 both. Within noise. |
| Electrical build | 2 heroes, 2 sweeps, 0 flares. Untouched. |

Mobile LCP 4.3s and the caching/compression findings are artefacts of
`python3 -m http.server`, which serves uncompressed with no cache headers.
Cloudflare handles both. Re-measure against a real deploy before treating 86 as
the real number.

### Still blocking, all of it facts rather than writing

| Blocker | Needs |
|---|---|
| Fixed charge line | Two figures and a year, off your own bills. Highest value blank on the page. |
| A commercial job in Our Work | One of the three made a business, with what it did to their running cost. |
| Our Work numbers | They say what was fitted, not what it did. |
| Storage claim, Businesses card | "less of the capital goes into storage" is a tendency, not a law. Check against a real commercial job. |
| Demand charge line, solar.html | Check against a real commercial invoice. Flagged in the markup. |
| Cleaning line | Attorney, open since round 1. |
| Phone numbers | Page promises "one number to phone", carries two across six links. |
| Install count, reg number | Correctly still out of the trust strip. |

**Correction carried into the docs:** rounds two and three both said Our Work
promises a photograph and shows none. That was measured on my assembled preview,
which had dropped the images, not on the live page, which has all three. The
finding is withdrawn in `docs/copy/copychief-round3.html` and
`docs/copy/energy-home-v3.md`.

---

## Session 10 part 1 — Energy home page copy, three review rounds

Working the Energy home page copy through a loop: revise the copy, put it back through
the copychief skill, read what comes back, revise again. User is reviewing between
rounds and will say when to do the final build. **No site file has been changed.**

### Where the work lives (banked out of the session scratchpad)

- `docs/copy/energy-home-v3.md` — the current copy of record. Section by section,
  every change marked, with the reason.
- `docs/copy/energy-home-v2.md` — the previous round, kept for the audit trail.
- `docs/copy/copychief-round2.html` — review of v2.
- `docs/copy/copychief-round3.html` — review of v3, the current one.
- `dist/energy/preview-new.html` — the assembled page render. **Still shows v1 copy.**
  Git ignored (dist/), so it cannot deploy.
- `dist/energy/hero-flare.html` — three hero variants comparing the current light sweep
  against two lens flare treatments. Also git ignored. Awaiting the user's pick.
- Published artifact, current page beside the assembled one:
  https://claude.ai/code/artifact/83f94b37-6bfb-4c7e-8baa-b2ceabf1f862

### What changed across the rounds

- **Round 1** reviewed the supplied `copy/Sunlogic_Energy_Site_Copy.md`. Findings: the
  whole job section buried at third, Plentify written as a supplier advert, We Watch It
  not pointing at the live figures already on the page, trust strip carrying an
  unprovable install count. All four fixed.
- **Round 2** answered the user's note that the bill language speaks only to
  residential. Bill mentions cut from 11 to 5. Business half added to Why Now, the
  day-trading line promoted from a card in section 6 up beside the residential argument,
  payback clause added to We Quote It, geyser section labelled as the home side.
- **Round 3** rewrote both hero buttons and the Businesses card via the landing page
  copy skill, and moved the demand charge callout OFF the home page onto solar.html,
  because a home page owes a business reader recognition, not depth.

Scores: homeowner 7 to 8 to 8. SME owner 4 to 6 to 7.

### Blocking the final build, and none of it is writing

| Blocker | Type | Needs |
|---|---|---|
| Fixed charge line | Fact | Two figures and a year, off their own bills. Highest value blank on the page. |
| Our Work photographs | Asset | Copy promises "each with a photograph". Rendered page has zero images in those cards. |
| A commercial job | Asset | One of the three Our Work jobs made a business, with what it did to running cost. |
| Storage claim | Check | "less of the capital goes into storage" is a tendency, not a law. Check against a real commercial job. |
| Demand charge line | Check | Now destined for solar.html. Needs a real commercial invoice first. |
| Cleaning line | Legal | Attorney, open since round 1. |
| Phone numbers | Build | Page promises "one number to phone", carries two across six links. |
| Install count, reg number | Fact | Still correctly held out of the trust strip. |

### House rules in force on all copy

No invented facts, no jargon, no AI writing patterns, no em dashes. Every document
above was machine checked for em dashes and a jargon word list before being shown.

### Next steps

1. User finishes reviewing round 3.
2. User picks a hero flare variant (A current, B soft, C full).
3. Only then: write v3 copy into `site-energy/index.html`, rebuild, run the conformance
   gate and the layout sweep, commit.

---

**Saved:** 2026-09-01 (session 7 — PageSpeed Insights desktop + mobile audit fixes)

## Session 7 part 2 — mobile PageSpeed report (uncommitted at time of writing)

Same session, same day, continuing straight from the desktop-report work below. User
pasted a **mobile** PageSpeed Insights report (separate from the desktop one) flagging:
cache lifetimes (331 KiB, same GH Pages limitation — see below, unchanged), image
delivery (52 KiB, hero-1024w.webp compression), render-blocking requests (180 ms,
sunlogic.css + plugins.css), a forced reflow in `components.js` (30 ms, `dl-roll`), and
an LCP breakdown showing **2,030 ms of "element render delay"** — by far the largest
number in either report.

**Fixed:**
- **Merged `shared/plugins.css` into `shared/sunlogic.css`** (as a clearly delimited
  "PLUGIN THEME" section at the end, same content, comment updated) to cut one
  render-blocking stylesheet request on `index.html`/`solar.html` (the only two pages
  that loaded it — confirmed via grep). Removed the `<link>` tag from both. Bumped
  `sunlogic.css?v=32` → `?v=33` across **all 16 pages** that load it (content changed,
  cache-bust required everywhere, not just the 2 pages that also had plugins.css).
  Updated `ci-guide.html`'s 3 prose references to `shared/plugins.css` to point at the
  new section instead, so the internal style-guide doesn't teach a file that no longer
  exists. Verified via Playwright: `--plugin-calc-accent`, `--plugin-review-speed` (60s,
  not the plugin's own 40s default), and `--plugin-day-feed-height` all still resolve
  correctly post-merge — the override relationship works because each plugin scopes its
  own defaults under `:where(:root)` (zero specificity), so the theme file's plain
  `:root` rules always win regardless of which stylesheet/style-tag is later in the DOM.
- **Recompressed all 4 hero derivatives** (`hero.webp`, `hero-1440w.webp`,
  `hero-1024w.webp`, `hero-640w.webp`) from quality 80/default-effort to **quality 72,
  effort 6** (sharp's max compression effort — same quality, more CPU spent finding a
  smaller encoding). ~29-31% smaller across the board (hero-1024w — the mobile LCP
  image — went 81 KiB → 56.9 KiB). Visually verified at quality 65 and 75 side-by-side
  against the original (PNG diffs, human eyeball) — no visible difference at any tested
  quality down to 65, chose 72 as a conservative middle ground since this is the LCP
  image on every page that uses it. Confirmed via Playwright that a 412px/DPR2 mobile
  viewport still resolves to `hero-1024w.webp` (matches the report's own finding).

**Deliberately NOT fixed:**
- **`dl-roll` forced reflow** (`shared/components.js` line ~83,
  `track.children[0].getBoundingClientRect().height` read right after an `innerHTML`
  write). Same pattern as the review-carousel fix from earlier this session, but NOT
  applied here: that fix worked safely because CSS already had a `40s` fallback for the
  custom property being set, so a one-frame delay was invisible. `dl-roll` has no such
  fallback — `.sl-roll` has no CSS height at all, so deferring the read to
  `requestAnimationFrame` would show ALL items stacked full-height for one frame before
  JS corrects it, a visible flash. `dl-roll` is also used sitewide (header/footer phone
  rotator, present on every page) vs. review-carousel's single page, so the blast radius
  of getting a guessed fallback height wrong is much bigger. Only 30ms — not worth the
  risk without a properly-tuned CSS fallback, which needs a design decision (what height
  to guess) rather than a mechanical fix. Flagged to user, not fixed.
- **2,030 ms LCP "element render delay"** — the single biggest number across both
  reports, and NOT a caching or image-weight problem. Working theory: this site renders
  everything through custom elements (`dl-hero`, `dl-stack`, etc.) that build their
  `innerHTML` in a JS `render()` method — meaning the `<img>` that IS the LCP element
  doesn't even exist in the DOM until `shared/components.js` executes (deferred, so
  after full HTML parse), and `customElements.define()` upgrades every matching element
  already in the tree synchronously, which is likely one long main-thread task on a
  throttled mobile CPU that blocks paint of everything, hero image included, until it
  finishes. This lines up with desktop's own report showing "Total Blocking Time:
  1,170ms" (red) despite LCP itself scoring green — consistent with one big synchronous
  task rather than network weight. This is an **architectural** property of the
  component system (client-side-rendered custom elements gating first paint), not a
  quick fix — a real fix means changing how above-the-fold content gets to the screen
  (e.g. not gating the hero `<img>` behind a custom-element upgrade at all). Flagged to
  user as the most consequential open finding; not attempted without discussion given
  the size of the change and the standing "don't touch script-loading without
  understanding the full blast radius" lesson from session 6.

**Verification done:** `npm run build` clean; Playwright checks on both `index.html` and
`solar.html` at mobile (412×900 DPR2) and desktop (1200×900) viewports — zero console
errors/warnings on either page, hero srcset resolves correctly, plugin theme CSS
variables resolve correctly post-merge.

**Files touched:** all 16 `*.html` pages (version bump only, one line each, except
`index.html`/`solar.html` which also lost the `plugins.css` `<link>`), `ci-guide.html`
(3 prose edits), `shared/sunlogic.css` (grew by the merged section),
`shared/plugins.css` (deleted), 4 hero `.webp` files (recompressed in place, same
dimensions).

**Status:** uncommitted as of this writing — same pattern as the desktop-report work,
waiting on user to say "commit and push" (they did, explicitly, for the desktop-report
batch; not yet asked for this one).

## Current task + goal

User pasted a PageSpeed Insights desktop report (score 67) for `https://sunlogic.co.za/`
flagging: inefficient cache lifetimes (574 KiB), oversized/uncompressed images (168 KiB),
render-blocking requests (110 ms), and a forced reflow in `review-carousel.js` (98 ms).
Worked through the actionable-in-repo items; one item (cache lifetimes) is a hosting-level
constraint flagged back to the user, not fixed in code.

## What was done (uncommitted, in `site-daylight/`, not yet committed to git)

1. **Render-blocking scripts (`index.html`)** — `plugins/day-feed/schedule.data.js`,
   `plugins/day-feed/day-feed-schedule.js`, and `plugins/review-carousel/reviews.data.js`
   were loading as plain blocking `<script>` tags (no `defer`), unlike every other script
   on the page. Added `defer` to all three. Safe because: they only assign `window.*`
   globals / pure functions, touch no DOM, and deferred scripts still execute in strict
   document order — so `*.data.js` still runs before the component script that reads it.
   Bumped `review-carousel.js?v=3` → `?v=5` (content changed, see #2) and `reviews.data.js`
   stayed at `?v=4` (untouched). This is **not** the "remove defer" mistake from session 6 —
   that regression was from *removing* defer off `components.js` (which does depend on
   pre-parsed light-DOM children); this is *adding* defer to scripts with no such dependency.
2. **Forced reflow fix (`plugins/review-carousel/review-carousel.js`)** — `connectedCallback`
   wrote `this.innerHTML` then immediately read `track.scrollWidth`, forcing a synchronous
   layout flush. Wrapped the read (and the `--plugin-review-speed` write that depends on it)
   in `requestAnimationFrame`. Safe because the CSS already has a `40s` fallback for
   `--plugin-review-speed`, so the one-frame delay before the precise value lands is
   invisible. Verified via Playwright: the custom property still gets set correctly
   (~130s for the full review set) and no console errors.
3. **Hero image srcset gap (`index.html`, `images/hero-1440w.webp` new file)** — srcset
   only had 640/1024/1920w, so ~1330–1440px-wide desktop viewports downloaded the full
   1920w (220 KiB) file for a ~1335px-wide render. Generated `hero-1440w.webp` (121 KiB,
   sharp, quality 80, matching the site's WebP convention) and added it to both the
   `<dl-hero srcset-widths>` attribute and the manual `<link rel=preload imagesrcset>` line
   (the two have to be kept in sync by hand — `<dl-hero>`'s srcset is generated by
   `DlHero.render()` in `shared/components.js`, the preload hint is separate markup).
   Confirmed via Playwright that `.sl-hero__image.currentSrc` resolves to the new file at
   a 1440px viewport.
4. **Proof-grid image crop (`images/proof/job-{1,2,3}-*.webp`)** — all three "Three Recent
   Jobs" photos are portrait/landscape-mismatched masters (675×900, 900×506, 506×900)
   shown through a hard-coded `aspect-ratio:4/3` box with `object-fit:cover`, with **no
   breakpoint that changes that 4/3 ratio** (confirmed via grep — index.html:223/232/241
   are the only aspect-ratio uses on this page, no media query touches them). Because the
   box ratio is constant, the fraction of each source image actually visible under
   `cover` is a fixed, viewport-independent fraction — the math was worked out per image
   (which dimension binds depends on whether the source is "more portrait" or "more
   landscape" than 4:3) and each master was center-cropped (with a small margin) to just
   that visible band, then re-encoded at quality 80. Confirmed via Playwright screenshot
   that all three photos still render fully framed with no visible clipping. Savings:
   72 K→45 K, 24 K→19.5 K, 28 K→15.5 K (~44 KiB total, zero visual change at any viewport).
5. Ran `npm run build` — clean, no errors. `dist/` is gitignored/CI-rebuilt so nothing
   there needs committing.

## FIXED 2026-09-04 — was: deliberately not fixed

The section below described a limitation of GitHub Pages: a fixed ~10 minute
`Cache-Control` on every asset, with no way to override it. The apex moved to
Cloudflare Pages on 2026-09-03 and GitHub Pages was switched off on
2026-09-04, and Cloudflare Pages supports a `_headers` file — so the
constraint is gone and the ~574 KiB has been taken.

`site-*/\_headers` now sets a year and `immutable` on fonts, images, and the
shared and plugin CSS/JS; HTML stays `max-age=0, must-revalidate` because a
page's URL does not change when its content does.

That is only safe because asset URLs DO change: the build replaces every
hand-written `?v=N` with eight characters of the file's own SHA-256, taken
after minification so it describes the bytes actually served. Bumping a
version number is no longer something anyone has to remember, which matters
much more under a one-year TTL than it did under ten minutes — forgetting it
used to correct itself before you noticed, and would now persist for a year
while looking correct on the machine of whoever made the change.

Kept rather than deleted because the reasoning below is why the assets were
served the way they were.

### Original note

**Cache lifetimes (574 KiB estimated savings, the single biggest item in the report).**
Every asset in the report shows a flat "10m" TTL — this matches GitHub Pages' known
behavior: it serves a short, fixed `Cache-Control` (~10 min) on every file and gives you
no way to override it (no `_headers` support, no custom server config, nothing in this
repo can change it). Fixing this for real requires putting a CDN/edge layer in front of
GitHub Pages — most commonly, proxying `sunlogic.co.za` through Cloudflare (orange-cloud)
and adding a Cache Rule / Page Rule that sets a long edge TTL for static assets
(images/fonts/css/js) regardless of the short origin TTL GH Pages sends. This project
already has a Cloudflare account (`workers/leads-relay` — D1 + Worker for the contact
form), but I don't know from anything in this repo whether `sunlogic.co.za`'s DNS is
already proxied through Cloudflare or is DNS-only pointing straight at GH Pages' IPs —
that's an infrastructure/DNS-panel fact only the user can confirm, and turning on the
proxy + cache rule is an external-service change I shouldn't make unilaterally anyway.
**Next session: ask the user how DNS is set up before proposing next steps here.**

## Standing constraints (carry forward)

- Never re-attempt *removing* `defer` from `shared/components.js`/`icons.js`/`forms.js`/
  `sunlogic-check.js` — confirmed regression risk (breaks `DlButton` and likely other
  components that read `this.innerHTML` expecting pre-parsed children). This session's
  `defer` additions are the opposite change (adding defer to non-DOM-touching scripts)
  and are unrelated to that risk.
- Bump `?v=` on any `shared/` or plugin file whose *content* changes (not needed for pure
  attribute/HTML changes like the ones in `index.html` here, since nothing there is
  browser-cached under its own versioned URL).
- `dist/` is a gitignored build artifact, regenerated by CI on push — never hand-edit it,
  never commit it.
- Local Lighthouse (`lhci`) still can't run in this dev environment (no Chrome binary) —
  Playwright (already a dependency) works fine for one-off visual/behavioral checks, as
  used in this session, but isn't wired into `npm run lighthouse`.

## Uncommitted / untracked (carried over, still unresolved)

- `.claude/` — local config directory, never reviewed/decided on.
- `Sunlogic_Feedback_Decisions.docx` / `.pdf` — unfamiliar documents, unreviewed content,
  never committed without knowing what's inside.
- All 5 changes from this session (see above) — uncommitted, waiting on user review/commit
  instruction.

## Next steps

1. User to review the diff (`git diff site-daylight`, plus the new `hero-1440w.webp` file)
   and say the word to commit.
2. Ask the user whether `sunlogic.co.za` DNS is proxied through Cloudflare already, to
   scope the cache-lifetime fix.
3. Everything else from session 6's "Next steps" list is still open and untouched by this
   session (3 blog posts with pending hero photography, Noordhoek battery-bank photo never
   saved to disk, review-carousel real content task 4 still paused, untracked-file decision).

## Branch / repo state

On `main`, up to date with `origin/main` as of `0f697d0`. Working tree has the 5 changes
above (uncommitted) plus the 3 pre-existing untracked items. No open worktrees, no
blocked/paused SDD plans.
