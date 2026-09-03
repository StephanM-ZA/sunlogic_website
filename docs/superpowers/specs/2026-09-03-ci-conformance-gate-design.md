# CI Conformance Gate — Design

**Status:** implemented on branch `ci-conformance-gate`
**Date:** 2026-09-03
**Scope:** all three Sunlogic sites (`sunlogic.co.za`, `energy.sunlogic.co.za`, `electrical.sunlogic.co.za`)

## 1. Problem

The Sunlogic CI exists as executable rules — `shared/sunlogic-check.js` encodes
eleven of them: palette, typefaces, flatness, emphasis budget, heading case,
band rhythm, nav limit, touch targets, alt text. They work. They found three
real defects on 2026-09-03 alone.

Nothing enforces them. The checker runs only as a browser overlay that a person
has to be looking at, on whichever page they happened to open. A rule violation
reaches production unless someone notices a badge.

Lighthouse CI audits 42 pages on every push but only reports. And until
2026-09-03 it audited **zero** pages: it discovered them by globbing
`dist/*.html`, which was correct when the build produced one site straight into
`dist/`, but after the three-site split `dist/` held only directories. The job
passed green for weeks on an empty set.

That is the shape of the problem. Not "we lack checks" — the checks exist. The
problem is that nothing gates on them, and the machinery that looks like it is
checking can be checking nothing.

## 2. Goals

1. A violation of the design system or the Lighthouse budgets blocks the
   deploy, on all three sites.
2. A blocking failure is *decidable*: the report states the rule's intent, so a
   reader can tell "this page is wrong" from "this rule is wrong".
3. When the rule is wrong, the fix goes into the rule — improving it for every
   future page — rather than into a suppression list.
4. The gate cannot pass without having checked. Every known silent-pass mode is
   closed and tested.

### Non-goals

- **Auto-remediation.** "Self-healing" here means detect, block and decide, not
  machine-repair. The human fork in goal 2 is the point.
- **Link integrity, orphaned assets, stale config references.** Real problems —
  a stale `paths:` filter, a dead glob and a host-specific guard all bit on
  2026-09-03 — but each is a new check to write. Out of scope for v1; the
  architecture does not preclude them.
- **Replacing Lighthouse.** Its thresholds are folded in, not rewritten.

## 3. Decisions

| Decision | Choice | Why |
|---|---|---|
| Gate or report | **Gate** — every finding blocks the deploy | Reporting is what exists today, and a regression stays live for as long as triage takes. One severity, after the §3.3 backlog pass — see §3.2 |
| Check scope | Design-system rules **+** Lighthouse budgets | Both engines already exist; one gate and one triage flow over both |
| Gate location | Standalone `npm run conformance`, invoked by whatever publishes | The three sites converge on one deploy path once Xneelo clears; the gate must not bake in today's split |
| Suppression | **None.** Exceptions live in the rule | Already how this codebase works — see §3.1 |
| Severity | **One.** Everything blocks, after the §3.3 backlog is cleared | The measured backlog is three causes, not 150 problems — see §3.2 |
| Escape hatch | One loud env-var override | Escaping must be possible and conspicuous, not quiet and per-finding |

### 3.1 Why exceptions live in the rule

Every exception in `sunlogic-check.js` is already a reasoned clause inside the
rule it qualifies:

- the mobile drawer excluded from the emphasis-button count
- a `<dialog>` excluded for the same reason — its own view, its own budget
- `.sl-cta-wrap` *resetting* the band run rather than joining it, because its
  transparent gutter separates what sits either side

On 2026-09-03 three findings turned out to be the rule's fault, not the page's:
a nested `.sl-hero` counted as a full-bleed band, an emphasis button inside a
closed dialog counted toward the page budget, and two `alt` bands became
adjacent after a section was removed. Each was fixed in the rule, in minutes,
and each fix made the rule truer for every future page.

A baseline file would have absorbed all three as accepted noise and the ruleset
would be three exceptions weaker today. That is the argument against a
baseline: not that baselines are wrong in general, but that this ruleset's
exceptions are load-bearing documentation, and a baseline is where they would
have gone to be forgotten.

The cost is real: a wrong rule blocks legitimate work until the rule is fixed.
§6 covers the override that makes that survivable.

### 3.2 Severity: one tier, after a backlog pass

"Gate the deploy" was chosen over "block on errors, report on warnings". The
gate now does exactly that: every finding blocks. Reaching it needed a backlog
pass first, and the reasoning below is kept because it records why the two
tiers existed at all and what had to be true before they could collapse.

While the backlog stood at 150 findings, blocking on `warn` was not possible:

- The apex landing page has **3 warnings and 0 errors** today (24px-tall inline
  links in the contact roll and the footer). `contact.html` has 6. Blocking on
  `warn` makes the gate red on day one, contradicting §9.
- Those particular warnings are arguably correct as warnings: a 44px minimum
  touch target is right for a button and wrong for an inline text link inside a
  paragraph, which is why the rule already exempts `.sl-footer` and
  `.sl-nav__links`. The contact roll is the same case with a different class.
- The `warn` tier also holds the two lowest-confidence rules — palette and
  typeface detection both compare computed styles against a fixed list, and
  both currently ignore every `rgba()` value as "scrims and glass are legal".

There are two honest ways to reach "everything blocks":

1. **Keep the split** (this design). `fail` blocks, `warn` reports. Ships now,
   green on day one.
2. **Promote `warn` to `fail`** — first triage every existing warning across
   the three sites, fixing the pages or amending the touch-target rule to
   exempt inline links properly, then collapse the tiers so there is one
   severity and everything blocks.

**Resolved: option 2, everything blocks.** The backlog has now been measured
(§3.3) and it is three causes, not a wall, so the prerequisite is small enough
to do before the gate turns on.

The gate therefore ends with **one severity**. The `fail`/`warn` split remains
inside the engine as a confidence signal; the gate counts every finding.

### 3.3 The measured backlog

Playwright over all 42 built pages, driving the real checker rather than a
reimplementation of it. **0 fails, 150 warns.**

| rule | warns | pages | cause | verdict |
|---|---:|---:|---|---|
| `a11y` | 75 | 27 | inline links 16–24px against the 44px minimum | rule too broad |
| `type` | 63 | 6 | SVG `<text>` computing to bare `monospace` | rule too broad, or missing CSS |
| `copy` | 12 | 6 | Title-Cased prose sub-heads in blog posts | pages wrong |

150 findings, three root causes — and note the verdict column: two of the
three are the rule being too broad, not the pages being wrong. That is the
pattern of the whole day, and it is why the design puts the rule's intent in
the failure report rather than assuming a finding means a page defect.

**`type` — 63 warnings, one cause.** All of them are `<text>` inside inline
SVG. SVG text does not inherit the page font, so it computes to the UA's
`monospace` and the rule — which walks `body *` and checks `font-family` on
anything with text content — flags every label in every diagram. Either
`svg text { font-family: var(--font-mono) }` (if diagram labels should be
JetBrains Mono, which they should) or the rule excludes the SVG namespace.
One change clears all 63.

**`a11y` — 75 warnings, ~3 per page, one cause.** The 44px minimum is right
for a button and wrong for an inline text link inside a paragraph. The rule
already knows this: it exempts `.sl-footer` and `.sl-nav__links` for exactly
that reason. These are the same case in a third place (the contact roll and
prose links). A rule amendment, not 75 page edits.

**`copy` — 12 warnings, 6 pages. Mixed, and needs per-finding triage.** Some
are genuine: "2. Install Proper Surge Protection" is Title Case in a prose
sub-head. Others are the rule's fault — it counts long words starting with a
capital, so `"Cape Town's own structure"` trips it, being sentence case with a
proper noun in it (3 long words, 2 capitalised). Verified by replicating the
rule against the real heading. So this group is read finding by finding, not
fixed in bulk; the plan's Task 6 does that and narrows the rule.

Two caveats on the measurement. It ran at a 412px mobile viewport, so
touch-target counts will differ at desktop widths — re-run both before
declaring the backlog clear. And it took three attempts, each of which
reported a confident, clean **0 fails 0 warns** while silently dropping
everything: first the checker's header goes through `console.group` not
`console.log`, so every page looked like the checker had never run; then the
severity test `startsWith('!')` never matched because the line begins `%c!`.
That is the case for §4.1's machine-readable engine output stated as plainly
as it can be — scraping a console stream produced a green result twice in one
afternoon, and only disbelief in the number caught it.

## 4. Architecture

One ruleset, two consumers.

```
shared/sunlogic-check.js
├── rule engine      → window.SL_CHECK.run() → { fails, warns, info }
└── browser presenter → console group + corner badge   (behaviour unchanged)

scripts/site-pages.js    every page of every site + the exclusion list
        │                 (throws on an empty set)
        ├──────────────→ scripts/conformance.js   Playwright, per-page SL_CHECK.run()
        └──────────────→ lighthouserc.js          Lighthouse budgets

npm run conformance      the single entry point every publisher calls
```

### 4.1 `shared/sunlogic-check.js` — engine / presenter split

Today the file is an IIFE that computes findings and immediately logs them and
paints a badge. Nothing can read the result.

**Engine.** `window.SL_CHECK.run()` returns
`{ fails: Finding[], warns: Finding[], info: {...} }` where

```js
Finding = {
  rule:     'rhythm',                       // stable identifier
  why:      'a reader should never meet …', // the rule's intent — see §5
  detail:   'two adjacent bands share rgb(247, 238, 217)',
  selector: 'dl-section#company',           // serialised, not a live node
  }
```

`selector` is a string rather than an element reference: the headless runner
serialises findings out of the page context, where DOM nodes cannot cross.

The eleven rules keep their current logic. This is a refactor, not a rewrite —
their `fail`/`warn` classification is unchanged, and the browser behaviour a
developer sees must be identical afterwards.

**Presenter.** The existing console group and corner badge, rebuilt on the
returned result.

**Production guard moves to the presenter.** The file used to self-disable on
`/^(www\.)?sunlogic\.co\.za$/` — a hostname regex written when there was one
host — so once the environment grew to three it kept painting a "SYSTEM OK"
developer badge for every public visitor to `energy.sunlogic.co.za` and
`electrical.sunlogic.co.za`.

> **Done (step 1).** The guard now reads `window.SL_BUILD.prod`, set by
> `scripts/build-site.js` from `CF_PAGES_BRANCH` / `GITHUB_REF_NAME`. It is a
> property of the build, not of the address it is served from, so a fourth host
> cannot reintroduce it — and a local build of `main` is still a local build,
> so developers keep the badge. Verified: production build → no badge; local
> and preview-branch builds → badge.

What remains for this section is the engine/presenter split. The guard
currently still suppresses the *whole* file on a production build, which is
correct today but blocks §4.3: the headless runner needs `SL_CHECK` available
in a build it is auditing. After the split the engine is always present and
only the presenter is suppressed.

### 4.2 `scripts/site-pages.js` — one definition of "every page"

```js
module.exports = { sitePages, EXCLUDED_PAGES };
// sitePages(distDir) → [{ site: 'main', file: 'index.html', url: '/main/index.html' }, …]
```

Walks the site directories under `dist/`, filters `.html`, applies the
exclusion list, sorts, and **throws on an empty result**.

Excluded: `thank-you.html` (post-submit only), `ci-guide.html` (internal design
doc) and `landing-preview.html` (carries its own `noindex` while the apex
rebuild is in progress). All three are deliberately non-indexable, so
Lighthouse's `is-crawlable` audit correctly fails on them.

This module exists because the duplication is what rotted. `lighthouserc.js`
had its own copy of discovery, that copy went stale, and Lighthouse audited
nothing. With one module, a fourth site or a new page is picked up by both
consumers or neither — never one.

### 4.3 `scripts/conformance.js` — the headless runner

1. Serve `dist/` statically on an ephemeral port.
2. `sitePages(dist)` for the page list.
3. Playwright (already a declared dependency, currently unused) opens each page,
   waits for load, and evaluates `window.SL_CHECK.run()`.
4. Assert the integrity conditions of §4.4.
5. Print the report of §5.
6. Exit non-zero if any page produced a finding.

The gate exits non-zero on any finding. The engine still separates `fail`
from `warn` and the report still labels them, but both block.

### 4.4 Integrity — the gate cannot pass without checking

Three ways a check can pass while checking nothing. Two were live on
2026-09-03:

| Mode | Observed | Guard |
|---|---|---|
| `lhci autorun` exits 0 after `Healthcheck failed!` | Yes — a Chrome-less runner goes green | Resolve the browser explicitly and assert before running |
| Empty page set | Yes — zero pages, weeks | `sitePages` throws on empty; both consumers inherit it |
| `SL_CHECK` absent on a page → zero findings | Not yet | Assert `SL_CHECK` present on every page, and pages-evaluated === pages-discovered |

The third is the most dangerous because it looks like success. **"No findings"
and "didn't run" must never produce the same result.** A gate that can fail
silently is worse than no gate, because it launders confidence — which is
exactly what the empty Lighthouse job did for weeks.

### 4.5 Lighthouse

Folded in, not replaced. Its thresholds already `error` on accessibility
(0.85), best-practices (0.95), SEO (0.9) and CLS (0.1); performance stays
warn-only at 0.8 for the documented runner-noise reason — the same page scored
0.96 locally and 0.72 on a GitHub runner in back-to-back tests.

What changes: its discovery comes from `site-pages.js`, its exit code gates,
and the healthcheck hole is closed.

## 5. The report

The output is the triage flow. Per failing finding:

```
✗ rhythm   main/index.html
  two adjacent bands share rgb(247, 238, 217)
  intent:  a reader should never meet the same band colour twice running —
           the alternation is what separates sections without a rule line
  element: <dl-section bg="alt" id="company">
  →  fix the page, or amend the rule in shared/sunlogic-check.js:87
```

The `intent` line is the only genuinely new information; everything else is
already computed. It is what makes a blocking failure decidable rather than a
guess. On 2026-09-03 the reasoning "a dialog is its own view with its own
emphasis budget" existed only as a code comment — the failure said nothing
about why the rule existed, so deciding whether it applied meant reading the
source. Putting each rule's intent in its `why` field surfaces that at the
point of failure.

Findings group by rule, not by page: a rule failing on 40 pages is one rule
problem, and 40 separate stanzas hide that.

The run ends with a summary line naming pages checked, rules evaluated, fails
and warns — so the log itself shows whether the gate did any work.

## 6. Override

```
SL_CONFORMANCE_OVERRIDE="reason"
```

Non-empty reason required. The gate exits 0, prints a banner, and the reason is
echoed into the CI job summary.

One override for the whole run, deliberately coarse. A per-finding waiver would
be a baseline by another name, arrived at one line at a time.

## 7. Testing

The repo has no test runner and no `npm test`. Node 22's built-in
`node --test` covers this with no new dependency.

**Rule fixtures.** Per rule, a minimal HTML fixture that must fail it and one
that must pass. Each of the three rule bugs found on 2026-09-03 would have been
caught by one: a nested `.sl-hero` inside a section, two emphasis buttons plus
one inside a closed `<dialog>`, two adjacent `alt` sections with a `cta-wrap`
between them.

**The watchman test.** A deliberately non-conformant fixture that the gate
**must** reject. Without it, the silent-pass modes of §4.4 return the first
time someone refactors — the empty glob was live for weeks precisely because
nothing asserted that the checker could still fail.

**Runner integration.** Against real `dist/`: asserts pages-evaluated equals
pages-discovered, and that the count is greater than zero.

## 8. Sequencing

1. ~~Fix the public badge leak on the two subdomains~~ — **done**, see §4.1.
2. Extract `scripts/site-pages.js`; point `lighthouserc.js` at it.
3. Split `sunlogic-check.js` into engine and presenter; add `why` per rule;
   move the production guard to the presenter and off the hostname.
4. Rule fixtures and the watchman test.
5. `scripts/conformance.js` and `npm run conformance`.
6. Clear the §3.3 backlog, then collapse the severity tiers:
   a. `svg text { font-family: var(--font-mono) }` — clears 63 `type`.
   b. Amend the touch-target rule to exempt inline text links properly —
      clears ~75 `a11y`. It already exempts `.sl-footer` and
      `.sl-nav__links`; this generalises that to prose and the contact roll.
   c. Fix the 12 Title-Cased prose sub-heads. Content, not code.
   d. Re-run at desktop as well as mobile widths and confirm zero.
   e. Collapse `warn` into `fail` — one severity, everything blocks.
7. Close the Lighthouse healthcheck hole; make its exit code gate.
8. Wire the gate into both publish paths — GitHub Actions for the apex,
   the Cloudflare build command for the subdomains — collapsing to one call
   site when the three converge.

Steps 2–5 land without changing any deploy behaviour, so the gate can be run by
hand and its findings triaged before it blocks anything. Step 6 is the backlog
clearance that "everything blocks" depends on. Step 8 is the only one that
changes what happens on a push.

## 9. Known state at time of writing

- Lighthouse: 42 pages, 14 per site. Worst scores — performance 0.87
  (`/main/solar.html`), accessibility 0.96 (`/electrical/solar.html`),
  best-practices 1.00, SEO 1.00. Nothing under any threshold.
- Design-system checker, all 42 pages: **0 fails, 0 warns**, verified at both
  412x823 and 1440x900 — the §3.3 backlog of 150 warnings is cleared.
- The gate is green on one collapsed severity: any finding, `fail` or `warn`,
  blocks the deploy.

## Cross-references

- `shared/sunlogic-check.js` — the rules
- `site-main/ci-guide.html` — the CI these rules encode
- `lighthouserc.js` — Lighthouse thresholds and their rationale
- `sites.config.js`, `scripts/build-site.js` — the three-site build
- [[2026-08-29-site-daylight-design.md]] — the design system this enforces
