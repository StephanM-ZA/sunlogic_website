# Pitch deck platform

**Date:** 2026-10-19
**Status:** approved, building

A standardised Sunlogic pitch deck that is edited as copy, presented as a
web page, and downloaded as a PDF of the whole deck, one section, or any
selection of sections.

## Why it exists

A deck we send today is a copy of the last deck, edited. The structure
lives in the file rather than anywhere it can be read, so it survives
only by somebody being careful. Worse, every recipient gets all twenty
pages when four would have answered them.

So: the structure is a model, the look is a renderer, and the download
is a selection.

## What already exists and is reused

| Source | What is taken from it |
|---|---|
| `tools/doc-builder/doc-assets.js` | Fonts, marks and icons as base64, so a deck works from `file://` and from an email attachment |
| `tools/doc-builder/doc-style.css` | The brand tokens, lifted into `brand.sunlogic.js` as the one place colour and type are set |
| `tools/doc-builder/doc-builder.js` | The editor shape: a field schema per slide type, a panel over the document, autosave, Save / Open / Export |
| LearnIQ `hayden-marais/assets/app.js` | The section picker: a declared list of selectable parts, a sheet that ticks them with a second level, and one print builder that both the button and the CLI call |

Two lessons are carried over rather than relearned. WeasyPrint cannot
run in a browser under Pyodide, so the in-page button talks to a local
render server instead. And a print layout is never hand-maintained
beside a screen layout; both come from the same renderer.

## Architecture

```
brand.sunlogic.js   tokens, lockups, the swappable part
deck.data.js        the standard deck: sections, slides, placeholder copy
deck-render.js      model -> slide markup, screen and print, no DOM
deck-style.js       the three stylesheets: screen, print, one-pager
deck-assets.js      generated: fonts by weight, and the icons
deck-editor.js      <plugin-pitch-deck>: panel, autosave, files, picker
deck.html           the live deck
render.mjs          node entry: model JSON -> print HTML on stdout
make-pdf.py         render.mjs -> WeasyPrint -> a PDF file
make-assets.py      fonts and icons -> deck-assets.js
serve.py            POST /pdf so the in-page button gets a real PDF
test-render.html    every slide type from a fixture, on one page
```

Two things differ from the plan above, both decided while building.

**The stylesheets are strings in a .js file, not .css files.** A deck has
to work from `file://`, from an email attachment, and fed to WeasyPrint
on stdin, and in none of those can a script fetch a stylesheet beside
it. `doc-assets.js` bakes the document CSS in for the same reason.

**The deck carries its own fonts and icons** rather than loading
doc-builder's. A page served from its own folder cannot load a file
above its root, so `../doc-builder/doc-assets.js` 404s over http. The
icons stay single-sourced in `doc-builder/icons.json` and are baked in
by `make-assets.py`. The fonts are the deck's own because a deck is set
in 800 and 900, which doc-builder has no need of, and because a weight
range is rejected by WeasyPrint.

`deck-render.js` is the only file that knows what a deck looks like. It
takes no browser API beyond string handling, which is why `render.mjs`
can load it under node and the CLI and the button cannot diverge.

## The model

```js
{
  v: 1,
  meta:     { title, subtitle, ref, date, client, footNote, pdfName },
  company:  { name, regName, reg, vat, address, email, phone, website,
              contactName, contactRole, contactEmail, contactPhone },
  sections: [ { k, n, d, onePager, slides: [ { type, ... } ] } ]
}
```

A **section** is the unit of selection. `k` is its key, used by the
picker and by `make-pdf.py --only cover,offer`. `n` and `d` are what the
picker shows. `onePager: true` marks a section as belonging to the
condensed A4 one-pager.

A **slide** is one idea. Types: `cover`, `statement`, `cards`, `kv`,
`bullets`, `metrics`, `quote`, `timeline`, `table`, `cta`, `contact`.

As in doc-builder, a heading is two fields: `h` is the plain half and
`em` the orange half. Copy fields are HTML on purpose, because a
sentence needs `<strong>` and `&rsquo;`. Anything reaching an attribute
is escaped.

## The standard deck

Twelve sections, each independently downloadable: Cover, What we do, The
problem, The offer, How it works, Proof, The numbers, What it costs, Why
us, Risk and compliance, Next steps, Contact.

The one-pager is Cover, What we do, The offer, The numbers and Contact,
rendered A4 portrait and condensed. It is the same config, not a second
document. It fits one side: getting there meant dropping the section
tabs that name themselves, hiding the eyebrow the tab already says, and
laying the contact out as a footer strip rather than a panel, which on
its own was a quarter of the page.

Copy ships as visibly bracketed placeholders. Placeholders are left
exactly as written until real copy replaces them.

## Editing

An edit panel over the deck, opened by a pencil, one slide at a time, so
the rest of the page stays a deck and nothing changes by a stray click.
A field schema per slide type drives the panel, so a new slide type is a
renderer plus a schema entry and nothing else.

Autosave to `localStorage` under a storage key, plus **Save file**,
**Open file** and **Export**, because copy that exists only in one
browser's site data is copy that can be cleared away.

## Download

The button opens a picker: the whole deck, any single section, any
selection, and a one-pager toggle. Sections with several slides get a
second level, so a single slide can be taken on its own.

`Create the PDF` posts the model and the selection to `serve.py`, which
renders through `render.mjs` and WeasyPrint and returns the file. With no
server running it falls back to the browser's print dialog, so a deck
that has been emailed or hosted still downloads something.

## What it enforces

- **Band rhythm.** Slide backgrounds alternate automatically, so no two
  neighbours share one. A statement, a cover and the closing CTA carry
  their own colour and sit outside the alternation.
- **No em dash,** reported with the field it is in.
- **Ceilings.** Four facts on the cover, one closing CTA, one contact
  slide.
- **Heading case,** reported rather than rewritten, because the wording
  is the author's.
- **Empty sections** cannot be downloaded: a ticked section whose slides
  are all unticked would print a heading with nothing under it.

## Testing

`test-render.html` renders every slide type from a fixture and asserts
the rules above, the way `doc-builder/test-render.html` does. A renderer
change is visible and checkable on one page.

## Out of scope

Hosting, sharing links, analytics on who opened what, and any second
brand's tokens. The renderer reads brand from one file so a second
business can be added later without touching it.
