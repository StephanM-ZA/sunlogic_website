# Sunlogic — the system

One file. Everything needed to build a page correctly. If something isn't
here, it isn't in the system — ask, don't invent.

---

## Setup

```html
<link rel="stylesheet" href="shared/sunlogic.css?v=1"/>
<script src="shared/icons.js?v=1" defer></script>
<script src="shared/components.js?v=1" defer></script>
<script src="shared/sunlogic-check.js?v=1" defer></script>  <!-- dev only -->
```

`sunlogic.css` owns colour, type, geometry and motion. `components.js` owns
composition. **You write neither.** You write pages out of `<dl-*>` elements.

There is no Tailwind. If you need a layout the components don't give you, use
`<dl-grid>`; if that doesn't cover it, that's a design question.

---

## The rule

**Never write a colour, font-size, font-family, radius, shadow, duration or
spacing value into a page.** Not in a class, not in a style attribute. Every
one of those already exists as a component or a token. A page is a composition
of components and copy — nothing else.

If you catch yourself writing `style="color:` — stop. That is the failure mode
this system exists to prevent.

---

## Components

Complete list. There is nothing else.

### Layout

| Element | Attributes | Notes |
| --- | --- | --- |
| `<dl-section>` | `bg` = `page` \| `alt` \| `inverse` | Section band with the correct vertical rhythm and container. **Never two of the same `bg` in a row.** Statement bands, the hero and the trust strip count as bands, so a navy statement between two beige sections is a legitimate break. The closing CTA has no band colour of its own — it is an inset rounded card on a transparent gutter — but that gutter does separate what sits either side of it, so it resets the run. That is why a navy CTA can sit directly above the navy footer. |
| `<dl-grid>` | `cols` = `3` \| `2` \| `split` | `3` → 3/2/1 across breakpoints. `2` → 2/2/1. `split` → text beside media, 56px apart. |
| `<dl-stack>` | `eyebrow` `heading` `body` `level` = `section` \| `hero` | The canonical section opener. Children become the CTA slot. |
| `<dl-actions>` | — | Button row. Stacks full-width below 480px. |
| `<dl-statement>` | `text` `eyebrow` `warm` | Full-bleed band with one large line and the gradient drifting behind. Breaks up long-form copy. One per two or three sections. |
| `<dl-subnav>` | `items` = `Label=#anchor|…` | Sticky anchor row under the header. For pages serving several audiences in one scroll. |
| `<dl-figures>` | `items` = `Value=Label|…` | A row of numbers on a navy band. |

### Content

| Element | Attributes | Notes |
| --- | --- | --- |
| `<dl-heading>` | `level` = `hero` \| `section` \| `title` | Standalone heading. |
| `<dl-text>` | `lg` `wide` | Body copy. Caps at 560px unless `wide`. |
| `<dl-eyebrow>` | — | Uppercase mono section label with its leading rule. |
| `<dl-card>` | `tone` = `white` \| `warm` \| `sunk` \| `inverse` \| `glass`, `icon` `heading` `body` | Flat. Never a shadow. |
| `<dl-step>` | `step` `heading` `body` `tone` | Numbered process step. Give the **final** step of a sequence `tone="inverse"` — one per sequence, never an interior step. |
| `<dl-checklist>` | `items` = pipe-separated | Orange ticks. |
| `<dl-prose>` | `wide` | Long-form editorial column at a 640px measure (780px wide). Sub-heads are `<h3>`. |
| `<dl-list>` | — | Bulleted list, orange dot, bold lead-in. Wraps `<li>` children. |
| `<dl-faq>` | `items` = `Question?=Answer.|…` | Accordion. Use once there are more than three questions. |
| `<dl-contact-row>` | `icon` `label` `value` `href` | Icon, mono label, value. |
| `<dl-person>` | `name` `role` `bio` `initials` | Team card. |
| `<dl-callout>` | `icon` | Warm flat card with an icon. |
| `<dl-stat>` | `label` `value` `sub` `tone` = `white` \| `glass` \| `inverse` | 40px/900 value — **numerals and short values only**. |
| `<dl-creds>` | `items` = `Label=Value\|Label=Value` | The phone-width restatement of stats. Low density, no card. |
| `<dl-badge>` | `live` | A **status** chip. Not a section label — that's `<dl-eyebrow>`. |
| `<dl-tag>` | — | Renders bracketed: `[ label ]`. |
| `<dl-media>` | `src` `alt` `ratio` `inverse` | Real image, or a labelled empty state. Never stock. |
| `<dl-icon>` | `name` `size` `accent` | 23 Heroicons. Names in `icons.js`. |
| `<dl-wordmark>` | `size` `href` | Sets the name in type. **No logo mark exists — do not draw one.** |

### Interactive

| Element | Attributes | Notes |
| --- | --- | --- |
| `<dl-button>` | `variant` = `primary` \| `emphasis` \| `secondary` \| `outline` \| `ghost`, `href` `icon` `size="sm"` `full` `on-dark` `type` `wipe` = `orange`\|`navy` | 50px (sm 38px). **Max one `emphasis` in view.** `ghost` maps to `outline` on light surfaces. `wipe` sets which colour fills on hover — for paired buttons that should read as different things (Solar orange, Electrical navy). |
| `<dl-field>` | `label` `name` `type` `hint` `required` `options` `placeholder` | `options` (pipe-separated) makes it a select. |

### Composed

| Element | Attributes | Notes |
| --- | --- | --- |
| `<dl-nav-bar>` | `active` `dark` | 72px sticky. Four links plus the CTA. Drawer below 768px. Links take the accent on hover and when current — orange, except Electrical, which takes navy. |
| `<dl-hero>` | `photo` `alt` | Five layers. All five required — see Motion. |
| `<dl-terminal>` | `title` `tone` `stream` `lines` (JSON) | The day's job feed. |
| `<dl-cta>` | `eyebrow` `heading` `body` `action` `href` | The closing call to action. One per page, last before the footer. |
| `<dl-dock>` | `active` | The persistent bottom pill nav. Fixed, always on top, on every page. |
| `<dl-footer>` | — | — |
| `<dl-reveal>` | — | Fade + rise on scroll. Wrap section content. |

### Plugins

The savings calculator and the review carousel are third-party web components
with their own markup. **Theme them, never fork them.**

`shared/plugins.css` maps their CSS variables and class names onto the system.
Load it after `sunlogic.css` on any page carrying a plugin:

```html
<link rel="stylesheet" href="shared/sunlogic.css?v=1"/>
<link rel="stylesheet" href="shared/plugins.css?v=1"/>
```

Both plugins inject a `<style>` into `<head>` at runtime, which lands after
your stylesheet. Every rule in `plugins.css` is therefore written at `:root`
specificity so it wins without `!important`. Follow that pattern for any new
plugin. **Never edit plugin JavaScript to restyle it** — the next version
overwrites you and the plugin stops tracking the system.

---

## Headings and the accent phrase

The system's signature device: **the last phrase of a headline in orange**.
Mark it with a pipe.

```html
<dl-stack heading="Solar and electrical from |one team"></dl-stack>
```

Once per heading. Always the final phrase, never mid-sentence. A page has at
most two hero-level headings.

---

## Colour

| Token | Hex | Use |
| --- | --- | --- |
| Orange | `#F66F00` | **The single accent.** CTAs, active nav, the last phrase, live dots. |
| Navy | `#0D2028` | Dark sections, nav, footer. Also all body and heading text. |
| Navy deep | `#081619` | Hover / pressed step below navy. |
| Beige | `#FFF7E9` | **The page surface. Not white.** |
| Beige-1 | `#F7EED9` | Alternating sections, warm cards. |
| Beige-2 | `#F0E5CF` | Sunk surfaces, placeholder fills. |
| Dark beige | `#DACAB6` | Borders and dividers on warm surfaces. |
| White | `#FFFFFF` | Cards, inputs. |
| Grey strong | `#676057` | Secondary **text**. AA-passing on warm surfaces. |
| Grey | `#A09B93` | **Decorative only** — rules, disabled states. ~2.4:1 on beige, never text. |
| Error | `#BA1A1A` | Form validation. Orange is not an error colour. |

Yellow `#FCCC3C`, brown `#4C2806`, purple `#C8B0FF`, dark purple `#321F61`,
light blue `#BED5FF`, dark blue `#1D3E86` are **creative contexts only** —
collateral and banners. Never core UI, never a page background.

Two background colours per page, maximum.

### On navy

`#676057` fails contrast on navy (2.7:1). The stylesheet handles this
automatically inside `.sl-section--inverse` and `.sl-card--inverse` — eyebrows,
body and headings all switch. You don't need to do anything, and you shouldn't
override it.

---

## Type

Two families. **Hanken Grotesk** (display and body) and **JetBrains Mono**
(labels). Both bundled in `shared/fonts/`, SIL OFL, self-hosted, no CDN.

| Role | Size | Weight | Line-height | Tracking |
| --- | --- | --- | --- | --- |
| Hero | `clamp(32px, 5.4vw, 72px)` | 900 | 1.111 | −0.02em |
| Section | `clamp(32px, 3.6vw, 48px)` | 800 | 1.166 | −0.01em |
| Section, mobile | 32px | 800 | 1.25 | **normal** |
| Title | 24px | 700 | 1.333 | normal |
| Body large | 18px | 400 | 1.555 | normal |
| Body | 16px | 400 | 1.5 | normal |
| Label / eyebrow | 14px (12px dense) | 600 | 1.428 | +0.05em, **uppercase** |
| Button | 14px | 700 | — | normal |

- Negative tracking on display type only.
- **Title Case for headings** — hero and section headings, card titles, step
  titles, CTA headings. "Solar That Pays For Itself." This follows the copy
  document, which is the authority on wording.
- **Sentence case for sub-heads inside prose** (`<dl-prose> h3`), eyebrows,
  field labels and body copy. "What will it actually save me?" An `h3` given
  `.sl-title` is an explicit titled heading (a named sub-document) and follows
  heading case instead.
- Minor words stay lower case in Title Case headings — *a, an, and, at, but,
  by, for, in, of, on, or, the, to* — unless they open the heading.
- The mono face is never body copy — labels, eyebrows, data and nav only,
  always uppercase.

---

## Spacing, radius, elevation

8px rhythm: 4, 8, 16, 24, 32, 40, 48, 64, 80, 120.
Section padding 120px desktop / 64px mobile. Gutter 24 / 16. Container 1152px.

**Section rhythm is automatic.** Every top-level block inside a `<dl-section>`
sits 40px from the next (32px below 768px). Do not add margins between a
heading stack and the grid under it — the section already does it.

**Cards in a grid are always level.** Every card stretches to the height of its
tallest sibling, whatever the copy length. Enforced by the card, not the page.

**Sticky lives on the host element.** `dl-nav-bar` and `dl-subnav` carry
`position: sticky` themselves, not their inner bar. A sticky box can only
travel within its containing block's content box, and a `dl-*` host is
shrink-wrapped to its child's height — so sticky on the inner element gives
exactly 0px of travel. Any future sticky component hits the same trap.

**Anchor clearance tracks the sticky chrome.** `[id] { scroll-margin-top: 88px }`
for the header alone, `145px` where a section nav is present
(`body:has(dl-subnav)`). Add sticky chrome later and you must update those two
numbers, or every in-page link lands its target underneath the bars — silently,
and worst on mobile where section padding is only 64px.

**Cards have a hover state: the hairline alone.** The border warms over 100ms
and nothing else moves — no fill change, no lift, no shadow, no scale. A card
that is a link takes the orange edge instead.

Radius: 2px chips · 4px buttons and inputs · 8px cards and panels · 16px images
and large panels · 999px status dots only.

**Elevation is flat.** No drop shadows on cards, panels or buttons. Depth is a
tonal step in the warm ramp (white → beige-1 → beige-2) plus a 1px hairline.
Two shadows exist for genuinely floating UI (menus, sheets) and nothing else.

---

## Motion

The whole vocabulary: **gradient drift, light sweep, fade-up, pulse.**

- **Every button wipes on hover** — a fill rising bottom-to-top over 240ms
  expo-out. It is on the base button, not a variant, so it is automatic
  everywhere. Navy, beige and outline buttons wipe to orange; the orange
  emphasis button wipes to navy; ghost-on-dark wipes to a restrained white so
  it never outshouts the emphasis button beside it.
- Links hover to opacity 0.7 over 100ms. **Never scale on hover.**
- Press is `translateY(1px)`. Never a shrink.
- Scroll reveals: fade plus a 16px rise, 700ms.
- No particles, no parallax, no spring, no bounce.

`prefers-reduced-motion` collapses animations to their end state — the gradient
holds a frame, the feed renders complete. Anything you animate in JS must check
`matchMedia` itself.

**The hero needs all five layers.** `<dl-hero>` renders them: photo, the 14s
gradient drift, the 9s light sweep, the side scrim, the bottom scrim. The drift
alone reads static in a single glance; the sweep is what makes motion legible
over a photograph; the side scrim is what holds text contrast against a bright
image you haven't seen yet. Removing any one of them breaks it.

**The closing CTA is animated too** — the dawn gradient drifts behind it at 38%
opacity. That motion is the point of the block. Don't flatten it.

---

## Copy

- **Sentence case headings.** "Book a site assessment", never "Book A Site
  Assessment".
- South African English — colour, organised, licence (noun) / license (verb).
- No superlatives, no unverifiable claims. Specific checkable facts instead.
- Spell out "Certificate of Compliance" and "Section 12B" in full on first use
  per page.
- Em dashes for asides.
- Knowledgeable, not technical. Someone who knows the trade, not a friendly
  stranger. No hype, no stiffness.
- **No emoji.** Ever.
- **Unresolved facts stay as visible bracketed placeholders** —
  `[Business hours — placeholder pending]`. Never a plausible-looking
  invention, never a silent omission. Same for imagery: a labelled empty
  state, never stock.

---

## Limits

One emphasis button in view (the closing CTA is the allowed second) · two
hero-level headings per page · four nav links · five tabs · six table columns ·
three stacked toasts · two background colours per page · 44px minimum touch
target · one gradient panel per view.

---

## Before you call a page done

Run it. `sunlogic-check.js` prints a badge and a console table covering
surface, palette, typefaces, elevation, accent count, heading case, section
rhythm, nav limit, touch targets and alt text.

**A page with a red badge is not done.** Then look at it against
`index.html`, which is the reference composition.

---

## Open — flag, never guess

- No logo mark exists. `<dl-wordmark>` sets the name in type. Do not draw,
  trace, generate or approximate a mark.
- No photography. Every slot is a labelled empty state.
- Nine copy placeholders await real values.
- Landscape phone behaviour and sticky-header-on-scroll are unspecified.
- Focus is not trapped in the nav drawer. `Tabs` and `Menu` have no arrow-key
  navigation. There is no skip link.
