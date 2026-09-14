# CI_Guide/ — START HERE

**This folder is the master for how the Sunlogic sites look, read and move.**
If you are about to change colour, type, spacing, a component, an image, a
line of copy, or a rule, the answer is in here or it does not exist yet.

Last brought current: 2026-09-14.

---

## What is in this folder

| File | What it is | Read it when |
| --- | --- | --- |
| **`SYSTEM.md`** | The full system. Components, colour, type (kerning and leading), spacing, motion, images, copy rules, the process, the estate. ~5,900 words. | Building or changing anything. This is the document. |
| **`ci-guide.html`** | The visual CI guide: every component, colour, type role and behaviour rendered as a specimen, with Do/Don't rules. One source; the build ships it to all three sites. | Seeing a rule rather than reading it. Preview at `/energy/ci-guide.html`. |
| **`README.md`** | This file. The index, and the twenty gate rules with what enforces each. | Orienting, or checking which rule a failure belongs to. |

## Where the rest lives, and why it is not in here

| Thing | Where | Why there |
| --- | --- | --- |
| **The visual CI guide** (rendered specimens of every component, colour, type and behaviour) | **`CI_Guide/ci-guide.html`**, one source | `scripts/build-site.js` copies it into every site at build, so it is served at `/ci-guide.html` on all three and views with that site's nav and assets. There used to be three copies under `site-*/`; they drifted and were consolidated on 2026-09-14. **Edit the one in this folder.** `robots.txt` disallows it and it is excluded from the gate. |
| **The gate** (the rules, as code) | `shared/sunlogic-check.js` | It runs in the browser on every page and headlessly in `scripts/conformance.js`. Rules are numbered 1–20; see below. |
| **The tokens and every visual value** | `shared/sunlogic.css` | The stylesheet IS the token file. `SYSTEM.md` describes it; the CSS defines it. If they disagree, the CSS is what ships and this folder has a bug. |
| **The components** | `shared/components.js` | 44 `<dl-*>` custom elements. `SYSTEM.md` has the table. |
| **The icons** | `shared/icons.js` | 32. Do not add one without asking. |
| **Copy reviews** | `docs/copy/` | Fourteen Copy Chief reports, each with an "Applied" section at the foot. |
| **What is open right now** | `CHECKPOINT.md` at the repo root | Session state. Blocked items, what shipped, what to check next. |
| **Design references that were considered** | `design-inspiration/` | Read-only. Nothing in there is the system. |

**Each `site-*/SYSTEM.md` is a three-line pointer to this folder.** They used
to be three identical 3,700-word copies. Do not let them become copies again.

---

## The twenty gate rules

Every one is enforced by `shared/sunlogic-check.js` and runs on all 25 public
pages at two viewports via `node scripts/conformance.js`. A rule that has never
been seen to fail has not been shown to work: each was proved by injecting a
violation.

| # | Rule | Enforces the section of SYSTEM.md on |
| --- | --- | --- |
| 1 | Page surface is beige, text is navy | Colour |
| 2 | No colour outside the palette | Colour |
| 3 | Two typefaces only | Type |
| 4 | Flat. No shadows on cards, panels or buttons | Spacing, radius, elevation |
| 5 | One emphasis button in view (the closing CTA is the allowed second) | Limits |
| 6 | Heading case: hero, section and CTA headings Title Case at any length; card and step headings Title Case to five words, sentence case past; prose sub-heads sentence case. **Checked in both directions.** | Type, Copy |
| 7 | No two adjacent full-bleed bands share a background | Layout, `<dl-section>` |
| 8 | Nav caps at four links | Limits |
| 9 | Touch targets: 44px minimum, **rounded before comparing** | Limits |
| 10 | Every image slot is either real or a labelled empty state | Images |
| 11 | Placeholders are visible, not invented (informational, not a fail) | Copy |
| 12 | Every page offers a way back to the top | `<dl-dock>` |
| 13 | One label for the site visit: "Book Your Free Site Visit" | Copy |
| 14 | No em dash in anything a reader sees (reads the RENDERED page; code comments are exempt) | Copy |
| 15 | One card tone per section | Interaction |
| 16 | Marks on controls are icons, never typed characters | Interaction |
| 17 | The pointer cursor belongs to controls; a card hovers only if it is or contains a link | Interaction |
| 18 | Never a light-on-light button at rest: a button's own background against the ground behind it must reach 1.6:1. Also fails a wipe the same colour as the fill | Interaction, Motion |
| 19 | A counted claim matches the data it is counted from | Interaction |
| 20 | Card headings inside one grid share one case | Interaction |

**Not gate-checked, deliberately:** contractions (a possessive and a
contraction are the same apostrophe), gender assumptions, exclamation marks,
unsourced numbers, text inside images. Those are the reviewer's job and the
copy process in `SYSTEM.md` is what catches them.

---

## The four checks, every time

```bash
node scripts/build-site.js      # three sites into dist/
node scripts/conformance.js     # the gate, 25 pages × 2 viewports
node scripts/layout-sweep.js    # 550 page/width combinations, 0 findings
npm test                        # 70 unit tests
```

Then show the owner the render. A page nobody has looked at is not done.

---

## The five things most often got wrong

Pulled from what actually went wrong across the three divisions, not from
theory. Each one is expanded in `SYSTEM.md`.

1. **Writing a value into a page.** A colour, a size, a margin in a `style=`
   attribute. Everything is a token or a component. The stylesheet owns it.
2. **A number without a source.** "300+ systems", "up to 20%", "R2.2 million".
   All shipped, none true, all cut. Hedging keeps the risk and loses the force.
3. **Trusting a marketing page over a contract in the repo.** Plentify's site
   said one cancellation term; `legal.html` said another. The contract won,
   after the wrong one had been live for an afternoon.
4. **Borrowing another division's content.** The Electrical home page shipped
   with the Energy division's H1, process and proof jobs. A labelled empty
   state is honest; a borrowed section is a claim.
5. **Leaving this folder stale.** A checkpoint that reported two defects
   already fixed cost most of a session. If you change the site, change the
   document in the same pass.
