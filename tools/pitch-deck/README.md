# pitch-deck

The Sunlogic pitch deck, built from a model instead of from the last
deck. Same house style, same print rules, same conformance check, and a
download that gives the reader the four sections they asked for rather
than all fourteen.

Open `deck.html`. Change the copy in the panel, pick what goes in the
PDF, print it.

## Why it exists

Every deck we sent was a copy of the last one, edited. That works until
somebody edits out the wrong paragraph, or two adjacent slides end up
the same colour, or an em dash survives. The structure was carried in
the file rather than written down anywhere, so it could only be
preserved by being careful.

Here the structure is a model and the look is a renderer. The copy is
the only thing an author touches.

It is also why a reader does not get twenty pages when four would have
answered them. Every section is downloadable on its own.

## Running it

```bash
python3 tools/pitch-deck/serve.py
```

Then open <http://localhost:8723/deck.html>. The server does two things:
serves the folder, and turns the Download button into a real PDF.

`deck.html` also opens straight from `file://`, with everything working
except that Download then falls back to the browser's print dialog.

## The files that matter

| File | What it is | Edit it when |
|---|---|---|
| `deck.data.js` | The standard deck: the sections, their order, the starting copy | The shape of a pitch changes |
| `brand.sunlogic.js` | Colour, type and the lockup | A second business needs the deck |
| `deck-render.js` | Model to markup | A new kind of slide is needed |
| `deck-style.js` | The three stylesheets: screen, print, one-pager | The look changes |
| `deck-assets.js` | Generated. Fonts, icons, the lockup and the hero, as data | Never by hand: run `make-assets.py` |

`deck-editor.js` is the panel. It knows nothing about how a deck looks,
which is why a change to the house style happens in one place.

There is no build step, so nothing fingerprints these files. **Bump the
`?v=` in `deck.html` and `test-render.html` whenever you edit one**, or
a browser serves a cached copy and you edit a deck with old code and no
error to show for it. The panel prints its own version in the bar for
the same reason.

## The model

One JSON object. **Save file** writes it, **Open file** reads it back,
and **Export** writes the deck as one sendable HTML file.

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
picker and by `make-pdf.py --only`. `n` and `d` are what the picker
shows a reader. `onePager: true` puts it in the condensed sheet.

A heading is two fields, not one: `h` is the plain half and `em` is the
orange half. That is the only place orange appears in running text, so
it is a field rather than something an author types `<em>` into.

Copy fields are HTML on purpose, because a sentence needs `<strong>`,
`&rsquo;` and `&nbsp;`. Anything that lands in an attribute is escaped
for you.

### The slides

| `type` | What it draws |
|---|---|
| `cover` | The cover. Navy, with up to four facts across the foot |
| `statement` | The dark full-width band. One per deck, or it stops meaning anything |
| `cards` | Two or three cards. `cols`, `items: [{icon, title, body}]` |
| `kv` | Label and paragraph, two across. `items: [{k, v}]` |
| `bullets` | Ruled lines. `cols`, `items: [text]` |
| `metrics` | Big figures, four across. `items: [{v, k, note}]` |
| `quote` | What a client said, and who said it |
| `timeline` | Four steps. `items: [{when, title, body}]` |
| `table` | A priced or comparative table. `head`, `rows`, `note` |
| `cta` | The closing call to action. Last, and only once |
| `contact` | Contact and company, drawn from `company` |

## The PDF

The button opens a picker: the whole deck, any one section, any
selection, and a one-pager toggle. A section with several slides gets a
second level, so a single slide can be taken on its own.

From the command line, the same thing:

```bash
python3 tools/pitch-deck/make-pdf.py                           # all 14, landscape
python3 tools/pitch-deck/make-pdf.py --only cover,offer,next   # three sections
python3 tools/pitch-deck/make-pdf.py --one-pager               # the A4 sheet
python3 tools/pitch-deck/make-pdf.py deck.json -o Pitch.pdf    # a saved model
```

Both go through `render.mjs`, which loads the browser's own renderer
under node. There is one renderer, so the button and the command line
cannot drift apart.

A render takes about six seconds, most of it node starting up and
WeasyPrint laying out the fonts. It is a desk tool, so that is left
alone.

### Why there is a server at all

WeasyPrint cannot run in a browser. The LearnIQ planner proved that at
length: `micropip.install("weasyprint")` dies on its C extensions, and
hosting, a CSP and self-hosting Pyodide all fail to fix it. So the exact
PDF comes from `serve.py`, and with no server running the deck falls
back to the browser's print dialog on its own, which still saves a PDF
and is the only thing that works from an emailed file.

## The page on the site

`site-energy/share/pitch.html` is the deck as a hosted page, at
`/share/pitch`. It is generated, never hand edited:

```bash
node tools/pitch-deck/render.mjs --share > site-energy/share/pitch.html
npm run build:energy
```

**Re-run that after any copy change**, or the hosted deck goes on saying
the old thing while the one you edit says the new one. The page is one
file with every script inlined, which is deliberate: the repo already
has two copies of the document builder that have drifted apart, and a
second copy of the deck would drift the same way.

The reader gets the deck and the download picker and no editor, which is
the `view` attribute on `<plugin-pitch-deck>`. In that mode it also
leaves the reader's `localStorage` alone, because a visitor should see
the deck as published rather than whatever is in their browser.

There is no render server on Cloudflare, so the picker's `POST /pdf`
404s and it falls back to the browser's print dialog. The picker says so
before the dialog appears.

**It is unlinked, and four things keep it that way.** Nothing on the
site links to it, it is not in `sitemap.xml`, `robots.txt` disallows
`/share/`, and `_headers` puts `no-store` and
`X-Robots-Tag: noindex, nofollow` on `/share/*`. The page carries its
own `noindex, nofollow` meta as the fourth, because the first three are
all requests to somebody else's software.

`/share/pitch` is guessable, which is fine for generic marketing copy.
A deck built for one client should get a less guessable path, or go
behind the code gate that `/share/index.html` already implements.

## Where the look comes from

The type scale is measured off the live energy site rather than guessed:
section headings at 48px/800 with a line-height of 1.166 and tracking of
-0.01em, the cover at 72px/900, eyebrows in JetBrains Mono at 14px/600
and 0.05em, body at 18px on a 1.555 line, and cards with 28px of padding,
an 8px radius and a hairline border. Those sit against an 18px slide
body, so a slide is the site's own scale rather than a near miss of it.

If the site's scale changes, re-measure rather than eyeball it. The
numbers above came from `getComputedStyle` on the built page at 1440.

## What it enforces, so a deck cannot drift

**Band rhythm.** Slide backgrounds alternate automatically. Nobody picks
them, so no two neighbours can share one. A cover, a statement and the
closing CTA carry their own colour and sit outside the alternation.

**Heading case.** `Check` reports a card heading on the wrong side of
the five-word rule. It reports rather than rewrites, because the wording
is the author's. Copy still in its brackets is unwritten, not wrong, so
it is counted instead.

**No em dash.** `Check` finds one anywhere in the model and says which
field it is in.

**Ceilings.** Four facts on the cover, one statement, one closing CTA,
one contact slide, four figures, two actions.

**Nothing empty.** A section ticked in the picker with all its slides
unticked is dropped, rather than printing a heading above nothing.

## The one-pager

Cover, What we do, The offer, The numbers and Contact, at A4 portrait,
on one side. It is the same config, not a second document: the sections
carrying `onePager: true` are the ones that appear.

It fits one side with the copy that ships, with about five per cent of
the page to spare. That margin is real but it is not generous, and it is
copy-dependent: the sheet went to two sides the moment the placeholder
copy was replaced with the real thing, and the type had to come down to
8.3pt to win it back. If your copy spills, untick a section in the panel
rather than squeezing the type further.

`pdfinfo` tells you in one line whether it still fits:

```bash
python3 tools/pitch-deck/make-pdf.py --one-pager -o /tmp/s.pdf && pdfinfo /tmp/s.pdf | grep Pages
```

## The copy

What ships is the site's own words, lifted from `site-energy/index.html`,
`energy.html`, `energy-management.html` and `contact.html`, not a rewrite
of them. A deck that says something the site does not say is a deck
nobody has checked.

What is still bracketed is still unwritten, and deliberately. Those are
the facts nobody has recorded anywhere in this repository. `Check` in
the panel counts them and `node render.mjs` prints the count on stderr.
`index.html` carries the same rule in a comment beside its three
installations: the numbers there are what was fitted, not what it saved,
because the saving was never written down. Invent none of them.

## Testing

Open `test-render.html`. It renders every slide type from the standard
deck and asserts the rules above, so a change to `deck-render.js` is
both visible and checkable on one page. The title says whether anything
failed.

## Changing the fonts or icons

```bash
python3 tools/pitch-deck/make-assets.py
```

Reads `shared/fonts/`, `../doc-builder/icons.json` and three files from
the built energy site, and writes `deck-assets.js`. Everything is baked
in because a deck served over http cannot load a file above its own
root, and a deck emailed as one file cannot load anything at all. The
icons stay single-sourced in `icons.json` and the lockup and hero in
`dist/energy/images/`.

The lockup is the site's own `sl_logo_energy_blue.svg` and its white
twin, not a drawing of it, and the cover carries `hero-energy-1440w.webp`
under a scrim, as the site's own hero does. That photograph is why a
full-deck PDF is about 1.7 MB rather than 50 kB. The one-pager drops it
and stays under 40 kB.

Fonts are declared one real file per weight. A range like `100 900` is
rejected outright by WeasyPrint, which then sets the whole deck in a
fallback face, and a synthesized 900 on a 3em heading is obvious.

## A second brand

Copy `brand.sunlogic.js`, change the tokens, the lockup and the light
lockup, and point `deck.html` at it. Nothing in the renderer knows the
name Sunlogic. Two lockups are needed because WeasyPrint does not style
the inside of an SVG from CSS, so a white mark has to be a white mark.
