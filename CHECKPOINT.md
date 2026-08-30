# Checkpoint — Sunlogic Website

**Saved:** 2026-08-29 (session 4 — two plugins shipped via SDD, full site rebuild from new copy, homepage color-rhythm fixes)

## Current task + goal

Since the last checkpoint (session 3, nothing committed beyond `5a6be12`/`1e2e57c`/`dfb2b00`), this session did three large things in sequence:

1. **Built and shipped two `plugins/` library entries** via the full brainstorming → spec → plan → subagent-driven-development workflow, each ending in a final whole-plan review + one fix wave. Both are **committed** (see commit list below).
2. **Rebuilt the entire live site** (Home, Solar, Electrical, Energy Management, Contact, Legal, plus a brand-new Blog page) from an entirely new copy document (`copy/Sunlogic_Site_Copy.md`, replaced by the user mid-session-3) — **not yet committed**.
3. **Fixed homepage section background rhythm** twice, based on direct user feedback, after the rebuild — **not yet committed**.

## Part 1: Plugins shipped this session (committed, on `main`)

### `plugins/review-carousel/` — Google review carousel
- 5-task plan executed via subagent-driven-development. All tasks reviewed clean.
- **Task 4 (swap fixture data for real reviews) is PAUSED** — blocked on the user supplying real review content (name, rating, text, direct Google review URL, optional photo). Plan explicitly forbids inventing placeholder reviews here. Resume this task when real data arrives — do not re-run Tasks 1-3.
- Commits: `b813972` (spec) → `dc36f3b` → `475c457` → `3b0515d` (wired into `site/index.html`'s homepage, between "From the Blog" and "Final CTA").
- Fixed as part of the calculator plugin's final review (see below): the `:root { }` CSS theming bug (host-page custom-property overrides were silently losing to the plugin's own defaults) — now `:where(:root) { }`, fixed in commit `56e18f1`.

### `plugins/calculator/` — solar/SME savings calculator
- 5-task plan, fully executed and **complete**, including a full final whole-plan review (opus) that found one Critical + 7 Important defects, one consolidated fix wave, and a scoped re-review confirming all 9 items addressed.
- Commits: `93715ae` (plan) → `420bae0` (math) → `cc74a28` (component) → `68a7945` (gating) → `4f70b20` (README) → `df160ff` (wired into `site/solar.html`) → `56e18f1` (final-review fix wave).
- Live on `site/solar.html`: `<plugin-calculator mode="residential">` in the "What does it cost?" section, `<plugin-calculator mode="sme">` in the business "What it costs" section — both match the copy doc's exact "CALCULATOR BLOCK" placements.
- **Math was independently verified multiple times** (design-time and by two separate reviewers re-deriving the formulas from scratch) — residential and SME worked examples in the spec are trustworthy.
- The fix wave's implementer agent **was interrupted mid-task by a session/API limit** and had to be resumed by inspecting its partial diff by hand and dispatching a fresh verification-only agent — worth knowing if this pattern recurs.

## Part 2: Full site rebuild from new copy (UNCOMMITTED)

The user replaced `copy/Sunlogic_Site_Copy.md` with an entirely new document mid-session (much more mature: full FAQ sections per audience, numbered callouts marked `CALL-OUT · ...`, two explicit "CALCULATOR BLOCK" placements on Solar, new "At Home / Small Business / Larger Sites" terminology replacing "Residential/Commercial", a Blog content plan, etc.) and asked: **"redo the website... do not write your own copy, use the copy given."**

Rebuilt directly (not via a subagent — copy-fidelity work is too easy to get wrong second-hand):
- `site/index.html`, `site/solar.html`, `site/electrical.html`, `site/energy-management.html`, `site/contact.html` — full rewrites from the new copy.
- `site/blog.html` — **new file**, didn't exist before. Shows the 7 planned post titles + categories as an honest "not written yet" state (no fake blog content).
- `site/legal.html` — left mostly untouched; new copy explicitly says this page should "move across as it is."
- Renamed anchors site-wide: `#residential`→`#at-home`, `#commercial`→`#larger-sites` (matches the new copy's terminology), updated in nav cross-links between Solar/Electrical.
- Both calculator instances re-embedded at the copy's exact marked "CALCULATOR BLOCK" positions on `site/solar.html` (script version bumped to `?v=2` since the file was fully rewritten).

**Self-caught and fixed 3 verbatim-copy violations before calling it done** (worth remembering — this is a recurring failure mode):
1. Blog page: invented CTA heading "Have a question of your own?" — removed, copy doc gives no closing CTA for this page.
2. Blog page: invented eyebrow badge "Coming Soon" + invented subtext "Nothing published yet — this is the plan." — replaced with `eyebrow="Blog"` (the doc's own page-title word) and dropped the subtext.
3. Homepage: leftover `eyebrow="Process"` on the "How It Works" section, carried over from the OLD site pattern, not present anywhere in the new copy — changed to echo the heading text instead.

General rule applied everywhere else: every `eyebrow`/badge label traces back to a verbatim phrase somewhere in the copy doc (usually the section's own document heading, reused rather than invented). Callout intro lines use the pre-established technique of concatenating the copy's own `CALL-OUT · <LABEL>` tag with its given bold headline via an em dash — this is NOT new invention, it's the same concatenation pattern validated earlier this project.

Verified live in-browser (no console errors) on all 7 pages after the rebuild.

## Part 3: Homepage section-color-rhythm fixes (UNCOMMITTED, layered on top of Part 2)

User feedback, two rounds:

**Round 1:** "How it works" and "Proof" were both `bg-primary-container` back to back (no visual seam), and the Final CTA was also `bg-primary-container` immediately above the (always-dark) footer, so they merged into one indistinguishable mass.
- My first fix: changed Proof to `surface-container` (light) and made the Final CTA a bold **orange** (`secondary-container`) band before the footer.

**Round 2 (user rejected the orange section):** *"No, Never an orange section. That is not in our design strategy. If you make worth know blue, then Find out can be white."*
- Corrected: "Worth Knowing" (the blog teaser section) → `bg="primary-container"` (dark blue, `on-dark` header, `text-inverse-primary` copy). Final CTA ("Find out what your property actually needs") → back to `bg="surface-container-lowest"` (white), `variant="primary"` orange button (button color is fine, section fill is what's banned).
- **Final confirmed homepage rhythm** (top to bottom): Hero (dark photo) → trust strip (dark bar) → What We Do (white) → Why Sunlogic (light gray) → How It Works (dark blue) → Proof (light gray) → Worth Knowing (dark blue) → Find Out CTA (white) → Footer (dark blue). No two adjacent sections share a background. Verified live in-browser after both rounds.
- **Standing rule going forward: never use a full-bleed orange (`secondary-container`) section background anywhere on this site.** Orange is an accent color only (buttons, badges, glow accents, icons) — not sanctioned as a section fill. Apply this awareness if extending the same background-alternation fix to Solar/Electrical/Energy Management (see Next Steps).

## Files that matter right now

- `site/index.html`, `site/solar.html`, `site/electrical.html`, `site/energy-management.html`, `site/contact.html` — fully rewritten this session, uncommitted.
- `site/blog.html` — new, uncommitted.
- `site/legal.html` — essentially unchanged, still uncommitted from earlier sessions' work.
- `plugins/calculator/`, `plugins/review-carousel/` — both committed and working; `review-carousel`'s Task 4 (real data) still pending user input.
- `docs/superpowers/specs/2026-08-28-calculator-plugin-design.md`, `docs/superpowers/plans/2026-08-28-calculator-plugin.md` — committed, describe the calculator exactly as built.
- `docs/superpowers/plans/2026-08-28-review-carousel-plugin.md` — untracked (plan itself was never committed, only its resulting code was) — low priority, could be committed later for the historical record.
- `copy/Sunlogic_Site_Copy.md` — the new copy source; treat as the single source of truth for all page prose going forward.

## Local dev server

- `http://localhost:8010/` → serves from the **repo root** (required — `site/solar.html` and `site/index.html` reference `../plugins/...`, which a server rooted at `site/` cannot resolve). This was already running throughout the session on port 8010.
- Access pages at `http://localhost:8010/site/<page>.html`.
- If it's died: `cd <repo-root> && python3 -m http.server 8010`.

## Next steps (numbered)

1. **Nothing from this session has been committed except the two plugins.** The entire copy rebuild (Part 2) and the homepage color fixes (Part 3) are sitting uncommitted. Ask the user before committing (per standing "only commit when asked" rule) — likely a natural next step once they're happy with the homepage.
2. **The same footer-adjacency problem likely exists on Solar, Electrical, and Energy Management** (their Final CTA sections are still `primary-container` immediately above the dark footer) — user said "let's start on the home page," implying more pages need the same treatment. Do NOT default to orange sections when fixing these — reuse the white/dark alternation pattern established on the homepage instead.
3. **`plugins/review-carousel/` Task 4 still paused** — waiting on real review data from the user (name, rating, text, direct Google review URL, optional photo per review).
4. **Bracket placeholders intentionally left in the rebuilt pages** (per copy doc, verbatim): trust-strip `[X] systems installed` + registration number, Proof section's 3 placeholder project cards, Meet the Team names/photos, HotBot/SolarBot cancellation-terms contradiction, several "confirm which finance partners" notes on Solar/Electrical. None of these should be filled in with invented content — they're waiting on real input from Stephan.
5. **`sl-callout` component is now used extensively** (Solar, Electrical) — no longer sitting unused as it was at the last checkpoint.
6. Two scratch prototype files (`site/homepage-audience-options.html`, `-v2.html`) still sit in `site/`, untouched, harmless.
7. `design-system/index.html` + its PDF have not been touched this session — still reflect session-3 state (including a stale glow-intensity value in the PDF per the session-3 checkpoint's own note). Not urgent unless the user asks.

## Standing rules reaffirmed this session

- **Verbatim copy only** — see memory `feedback_verbatim_copy.md`. This session both followed it successfully across ~5 full page rebuilds AND caught itself violating it 3 times before finishing (see Part 2) — stay vigilant, especially on short UI labels/badges/CTAs, which are the easiest place to slip and invent text without noticing.
- **All git commits route through `commit-specialist`** — never raw `git commit`, by the controller or any subagent.
- **Never a full-bleed orange section background** — new rule from this session, established by direct user correction. Orange stays an accent (buttons, glow, badges) only.
- Work happens directly on `main`, no feature branches/worktrees — matches this repo's entire history; explicitly re-confirmed with the user at the start of both plugin SDD runs this session.
