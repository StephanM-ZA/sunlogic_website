# Sunlogic — complete site

Drop-in replacement for `site-daylight`. Delete the old folder, put this one in
its place, rename `AGENTS.md` to `CLAUDE.md`, and you are done.

## Contents

```
index.html                 Home
solar.html                 Solar — home, business, larger sites
electrical.html            Electrical — home, business, larger sites
energy-management.html     HotBot and SolarBot
blog.html                  Worth knowing
contact.html               Contact and team
legal.html                 Terms, policies, warranty
ci-guide.html              The corporate identity document

shared/sunlogic.css        The implementation — tokens, geometry, motion, components
shared/components.js       The <dl-*> library
shared/icons.js            23 Heroicons v2.1.5, MIT
shared/forms.js            Form wiring (unchanged from your repo)
shared/sunlogic-check.js   Dev-only validator
shared/fonts/              Hanken Grotesk + JetBrains Mono, SIL OFL

SYSTEM.md                  The complete written contract — point CLI at this
AGENTS.md                  One-page working rules — rename to CLAUDE.md
```

## One external dependency

`solar.html` references your calculator plugin at `../plugins/calculator/`.
That path is unchanged from your repo — keep `plugins/` where it is, as a
sibling of the site folder.

## Every page is now built from components

No page contains a colour, a font-size, a radius, a shadow or a duration.
Tailwind is gone entirely — layout comes from `<dl-grid>` and `<dl-section>`.

Thirty-four elements: `dl-section` `dl-grid` `dl-stack` `dl-actions`
`dl-statement` `dl-figures` `dl-heading` `dl-text` `dl-prose` `dl-list`
`dl-eyebrow` `dl-card` `dl-step` `dl-checklist` `dl-callout` `dl-faq`
`dl-stat` `dl-creds` `dl-badge` `dl-tag` `dl-media` `dl-icon`
`dl-wordmark` `dl-button` `dl-field` `dl-contact-row` `dl-person`
`dl-nav-bar` `dl-subnav` `dl-dock` `dl-hero` `dl-terminal` `dl-cta`
`dl-footer` `dl-reveal`.

Full API in `SYSTEM.md`.

## What changed beyond the styling

**Copy is reconciled against `Sunlogic_Site_Copy.md`.** Headings are Title Case
per that document; sub-heads inside prose stay sentence case. Body copy is
verbatim, apart from expanding contractions the original had mangled ("it's"
used as a possessive appeared throughout). The home page now carries every
section the copy document specifies — trust strip, the Solar/Electrical split
inside each What We Do block, four How It Works steps, Proof, and From the
Blog — and the real closing CTAs are back on every page.

**Real details are now in.** Phone, both email addresses, the workshop address
and the registration number (2022/651654/07) were sitting in `contact.html`
and `legal.html` — they are now in the footer on every page. Business hours
remain a visible placeholder because they are genuinely not published anywhere.

**Navigation is four links.** "Worth knowing" moved to the footer — the system
caps the bar at four. Reverse it if you disagree, but drop something else.

**The hero is a component.** `<dl-hero>` renders all five layers. Drop a real
photograph in with `photo="..."` and the empty state disappears.

**Every button wipes on hover.** It is on the base button, not a variant, so it
happens everywhere automatically. **Cards hover too** — one tonal step and a
warmer edge, no lift and no shadow.

**Three layers of navigation.** The sticky 72px header, a section nav on the
long service pages that marks where you are, and a fixed dock at the bottom
centre of every page so the whole site is one tap away.

**The long pages are laid out editorially**, not as a column of prose:
statement bands between sections, split columns pairing prose with a callout
or a calculator, and question sets as accordions once there are more than
three.

**The particle canvas is gone.** Not in the motion vocabulary.

## Before it goes live

1. **Photography.** Every image slot is a labelled empty state. Nothing is
   stock and nothing is faked.
2. **The logo.** No mark exists; `<dl-wordmark>` sets the name in type.
3. **Business hours** — the last unresolved contact fact.
4. **Energy management cancellation terms** — the site and the terms and
   conditions currently contradict each other. Reconcile before publishing.
5. **Response time** for electrical breakdowns — currently a placeholder.
6. **Finance partners** — confirm which Sunlogic actually offers.
7. **Copy-edit the legal page.** It reproduces the live text including its
   original typos ("warrantee", "A 80%", "do do").

## While building

Keep `sunlogic-check.js` in the page. It paints a badge bottom-left and prints
a table covering surface colour, palette, typefaces, elevation, accent count,
heading case, section rhythm, nav limits, touch targets and alt text.
A red badge means the page is not done.

Remove the script tag for production.
