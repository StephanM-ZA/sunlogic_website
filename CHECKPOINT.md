# Checkpoint — Sunlogic Website

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

## Deliberately NOT fixed — needs a user decision

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
