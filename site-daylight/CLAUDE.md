# Working on the Sunlogic site

**Read `SYSTEM.md` first.** It is the complete reference — components, colour,
type, motion, copy rules, limits. Everything below is the short version.

## Setup

```html
<link rel="stylesheet" href="shared/sunlogic.css?v=1"/>
<script src="shared/icons.js?v=1" defer></script>
<script src="shared/components.js?v=1" defer></script>
<script src="shared/sunlogic-check.js?v=1" defer></script>  <!-- dev only -->
```

Bump every `?v=` when you change a file in `shared/` or in a plugin. There is
no build step, so nothing fingerprints these — a browser serves the cached
copy and the page runs old code with no error to show for it.

## The rule

**Never write a colour, font-size, font-family, radius, shadow, duration or
spacing value into a page.** Every one already exists as a component. A page is
a composition of `<dl-*>` elements and copy — nothing else.

## The five things that go wrong

1. **The page is beige** — `#FFF7E9`. Not white, not dark. Text is navy.
2. **One orange, `#F66F00`** — the accent, not an error colour. Max one
   `variant="emphasis"` in view, plus the closing CTA.
3. **Purple, brown, yellow and blue are creative-context only.** Never UI.
4. **Hanken Grotesk and JetBrains Mono only**, bundled in `shared/fonts/`.
   Never Feature Deck, Aeonik Pro or Social Mono — those are licensed to
   another brand.
5. **Sentence case headings.** "Book a site assessment", never Title Case.

## Shape of a page

```html
<dl-nav-bar active="solar"></dl-nav-bar>

<dl-hero alt="[Photography pending]">
  <div class="sl-hero__text">
    <dl-reveal>
      <dl-stack level="hero" eyebrow="Western Cape"
        heading="Solar and electrical from |one team"
        body="…">
        <dl-actions>
          <dl-button variant="emphasis" icon="arrow-right" href="#assessment">Book a site assessment</dl-button>
          <dl-button variant="ghost" on-dark href="contact.html">Talk to us</dl-button>
        </dl-actions>
      </dl-stack>
    </dl-reveal>
  </div>
</dl-hero>

<dl-section bg="page">
  <dl-reveal>
    <dl-stack eyebrow="What we do" heading="Two trades, |one contractor" body="…"></dl-stack>
  </dl-reveal>
  <dl-reveal>
    <dl-grid cols="3">
      <dl-card icon="sun" heading="At home" body="…"></dl-card>
    </dl-grid>
  </dl-reveal>
</dl-section>

<dl-cta heading="Find out what your roof |can actually do" body="…"
  action="Book a site assessment" href="contact.html"></dl-cta>

<dl-footer></dl-footer>
```

The pipe in a heading marks the accent phrase — everything after it renders
orange. Once per heading, always the last phrase.

Sections alternate `page` → `alt` → `inverse`. **Never two of the same in a
row.**

## Before you say a page is done

Load it. `sunlogic-check.js` paints a badge bottom-left and prints a table.
**A red badge means it is not done.** Then compare it against `index.html`,
which is the reference composition.

## Open — flag, never guess

Logo (no mark exists), all photography, nine copy placeholders. Landscape
phone and sticky-header-on-scroll are unspecified. No focus trap in the
drawer, no skip link.


---

*Rename this file to `CLAUDE.md` at the repo root when you drop the folder in.*
