# Checkpoint — Sunlogic Website

**Saved:** 2026-08-31 (session 6 — GitHub Pages + Lighthouse CI + DNS cutover + placeholder cleanup + blog fixes + build-time image optimization)

## Current task + goal

The site is now **fully live** at `https://sunlogic.co.za/` on GitHub Pages (DNS cut over from the old WordPress site earlier this session, HTTPS cert issued and verified). This session's work, roughly in order:

1. Set up GitHub Pages deployment (mirroring the sibling `doqix_website` pattern) — `.github/workflows/deploy-site.yml`.
2. Built a non-blocking Lighthouse CI workflow (`.github/workflows/lighthouse-ci.yml`, `lighthouserc.js`) to catch performance/a11y/SEO regressions automatically, after a script-loading auto-fix attempt caused a real regression (`DlButton` broken by removing `defer` — reverted via `git revert`).
3. Worked through every `[...]` placeholder in the live copy category-by-category with the user (response times, finance options, testimonials/job specs, missing photography) — only real data used, nothing invented.
4. Cut the DNS over from WordPress to GitHub Pages — confirmed live with valid HTTPS.
5. Added a fully automated commit-SHA build-stamp in the footer (`window.SL_BUILD`, injected at build time — never needs a manual reminder).
6. Contact page layout: map now grows via CSS Grid (`grid-template-rows: auto 1fr`) to align its bottom edge with the form card, while the 20px gap to the Contact Details card stays fixed. Commit `eff86ec`.
7. Blog post fixes (commit `e623d02`):
   - "← Back to Worth Knowing" breadcrumb on all 7 posts, placed inside the article's opening section using a new `.sl-section--hero-follow` CSS modifier (smaller top-padding matching the site's 40px/32px grid-gap, so hero→breadcrumb→tag→heading step by one consistent amount instead of the normal large section gap).
   - `DlCard` component gained optional `photo`/`photo-alt` attributes (edge-to-edge cover image via new `.sl-card__media` class) — wired up on the 4 `blog.html` listing cards that have real photography.
   - `DlCard` also now pulls a `<dl-tag>` child above the heading/body (eyebrow-style); `.sl-prose h3` margin fixed to not double up with the grid gap right after a `<dl-tag>`.
8. **Build-time image optimization** (commit `f124215`) — `scripts/build-site.js` now converts every `.jpg`/`.jpeg`/`.gif` under `dist/` to WebP (quality 80, animated for GIFs) and rewrites every literal reference across `dist/*.html`. Source files in `site-daylight/` are untouched — only the disposable `dist/` output changes extension. Added `sharp` as a devDependency. Typical savings 40-88% per file; the one real GIF (`routine-control.gif`) went from 954K to 274K, animation verified intact (35 frames, correct delays). Also deleted 2 orphaned/unreferenced GIFs (`home-page-devices.gif`, `Impact-metrics-small-1.gif`, confirmed via grep to be linked nowhere).

All of the above is committed and pushed to `origin/main` (`3f5929a` through `f124215`). GitHub Pages will redeploy automatically.

## Key files

- `.github/workflows/deploy-site.yml`, `.github/workflows/lighthouse-ci.yml`, `lighthouserc.js` — deploy + regression-check pipeline.
- `scripts/build-site.js` — build script: copy → optimize images (WebP conversion + reference rewrite) → stamp build SHA → minify CSS/JS.
- `site-daylight/shared/components.js` — `DlCard` (photo/tag support), `DlFooter`/`SL_BUILD_LINE` (commit stamp).
- `site-daylight/shared/sunlogic.css` — `.sl-back-link`, `.sl-section--hero-follow`, `.sl-card__media`, `.sl-contact__side`/`.sl-contact__map`.
- `site-daylight/contact.html` — corrected map/form alignment.
- `site-daylight/blog*.html` — breadcrumb + tag/heading order.

## Standing constraints (carry forward)

- Never re-attempt the "remove `defer`" script-loading optimization — confirmed regression risk (breaks `DlButton` and likely other components that read `this.innerHTML` expecting pre-parsed children). Lighthouse CI is the safety net for future performance work instead.
- iMac/n8n changes still route through `serverMonitor` per the global change-control rule (unrelated to this session's work, but stands for any future backend touch).
- This machine is dev-only; this repo has no `npm run dev` real-data caveat like `serverMonitor` — n/a here, this is a fully static site.

## Uncommitted / untracked (left alone, not part of this work — carried over from session 5, still unresolved)

- `.claude/` — local config directory, never reviewed/decided on.
- `Sunlogic_Feedback_Decisions.docx` / `.pdf` — unfamiliar documents, unreviewed content, never committed without knowing what's inside.

## Next steps (if picked up later)

1. **3 blog posts still have `[Hero photography pending]` empty-states**: `blog-ev-home-charging.html`, `blog-five-tips-load-shedding.html`, `blog-why-your-bill-went-up.html`. Decision needed: keep the honest empty-state (matches the site's own "no stock photography" principle) vs. wait for/source real photography.
2. **Job 2's new Noordhoek battery-bank photo**: user shared it inline in chat but it was never saved to disk (multimodal chat content isn't file-accessible). User was asked to drag it into `site-daylight/images/proof/` via Finder — not yet done as of last check.
3. Decide what to do with the untracked items listed above.
4. `plugins/review-carousel/` Task 4 (real review content) — still paused, resume when the user supplies real Google review data.
5. Local Lighthouse checks can't run in this dev environment (no Chrome binary available for `lhci`) — rely on the GitHub Actions workflow for real Lighthouse runs on push.

## Branch / repo state

On `main`, up to date with `origin/main` as of commit `f124215`. Working tree clean except the 3 untracked items above. No open worktrees, no blocked/paused SDD plans.
