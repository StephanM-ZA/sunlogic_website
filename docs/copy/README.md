# Copy reviews

Every Copy Chief review run against a Sunlogic page, kept so a decision can be
traced back to the reasoning behind it. Each report names what was found, what
was applied, and what was referred back rather than decided.

These are **reports, not copy**. The live copy is in the page files. Where a
report quotes a "fix", check the page before trusting it: a later round may
have changed it again, and several did.

| File | Covers | Date |
|---|---|---|
| `apex-content-report.html` | sunlogic.co.za, all four pages. Three rounds, twenty findings | 2026-09-05 |
| `energy-home-round-1.html` | energy.sunlogic.co.za home page, first review | 2026-09-04 |
| `energy-home-round-2.html` | Same page, after round one was applied | 2026-09-04 |
| `energy-home-round-3.html` | Same page, produced the v3 copy | 2026-09-04 |
| `energy-division-sweep.html` | Energy home confirmation pass, then all nine Energy pages | 2026-09-06 |
| `energy-solar-round-1.html` | solar.html, first review | 2026-09-04 |
| `energy-solar-round-2.html` | solar.html, after round one was applied | 2026-09-04 |
| `energy-solar-round-3.html` | solar.html, third round. The structural verdict on three audiences in one scroll | 2026-09-06 |
| `energy-home-v2.md` | Energy home copy draft, v2 | 2026-09-04 |
| `energy-home-v3.md` | Energy home copy draft, v3. This is what shipped | 2026-09-04 |

## Two things worth knowing

**Rounds two and three exist because round one created work.** On both the apex
and the energy home page, roughly half of each later round's findings were
caused by the fix before it: moving a buried argument leaves its old heading
pointing at nothing, and removing the third statement of a fact makes it easy to
miss that the second is still there. A page is not finished when a round is
applied; it is finished when a round finds nothing it did not cause.

**Some findings are only visible between pages.** The worst thing found in the
Energy division was a thank-you page advertising three articles, two of which
were never written and none of which was a link. Every one of those cards was
well-formed, on-palette and correctly spaced, so the conformance gate passed
them. Nothing that reads one page at a time could have caught it.

## Keep them current

`energy-division-sweep.html` carries an "After this report was written" section,
because three things changed on the home page the same day it was filed. A
review that silently goes out of date is the same failure it usually criticises:
a page saying something that used to be true. When a later change contradicts a
filed report, append to the report rather than leaving it standing.

## Naming

`<site>-<page>-round-<n>.html`, or `<site>-<scope>-<kind>.html` for a sweep.
Two files were originally called `copychief-round2.html` and
`copychief-round3.html`, which said nothing about which of three sites or which
of several pages they reviewed. Do not name them that way again.

## Not the same as the CI documents

Design-system rules live in each site's `SYSTEM.md` and `ci-guide.html`, and are
enforced by `shared/sunlogic-check.js`. These reports are about what the pages
*say*, not how they look. Where a review turned into a rule, the rule is in
those files and the reasoning is in the report.
