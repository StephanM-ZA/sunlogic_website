# Sunlogic — the system

> **THIS IS THE MASTER.** `CI_Guide/SYSTEM.md` is the single source for every
> design, type, colour, motion, image and copy rule across all three sites.
> The `SYSTEM.md` in each `site-*/` folder is a pointer to this file, not a
> copy. Start at `CI_Guide/README.md` for the index and the gate rules.
>
> Last brought current: 2026-09-14, after the Electrical division shipped.

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

The `?v=` numbers are cache-busters and are higher than 1 on the live pages;
copy the current value from any existing page rather than this snippet.

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
| `<dl-sector>` | `num` `of` `name` `note` | Numbered sector marker ("01 / 03 · Hot water") that opens a pillar section on a Smart page. Belongs to the section it opens, so the gap between them is three quarters of the rhythm, not a full one. See Spacing. |
| `<dl-division-promo>` | `photo` `srcset-widths` `alt` | The other division's hero, as a card, closing each division site. Wears the destination's own hero image. Not a band of its own; it carries the CTA's ground. |

### Content

| Element | Attributes | Notes |
| --- | --- | --- |
| `<dl-heading>` | `level` = `hero` \| `section` \| `title` | Standalone heading. |
| `<dl-text>` | `lg` `wide` | Body copy. Caps at 560px unless `wide`. |
| `<dl-eyebrow>` | — | Uppercase mono section label with its leading rule. |
| `<dl-card>` | `tone` = `white` \| `warm` \| `sunk` \| `inverse` \| `glass`, `icon` `heading` `body` `photo` `photo-alt` `date` `fit` = `contain` `media` = `dark` | Flat. Never a shadow. `photo` gives a 16:9 cover crop. **`fit="contain"` for a product shot**: 4:3 white frame, 18px inset, object-fit contain, so a 705×633 device render is not decapitated by the default crop. **`media="dark"`** for a screenshot of a dark UI: navy frame, no inset, anchored top. `date` makes it an article card, which exempts its heading from the five-word case rule. |
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
| `<dl-media-bg>` | `src` `alt` `ratio` `inverse` | The labelled empty state itself. Alt defaults to `[Photography pending]`. |
| `<dl-icon>` | `name` `size` `accent` | 32 icons: 27 Heroicons v2.1.5 outline plus five original monoline brand glyphs (facebook, instagram, linkedin, google, whatsapp). **Do not add an icon without asking.** Heroicons are fetched from source, never transcribed. Brand icons are drawn in the house stroke, never imported as filled marks. Names in `icons.js`. |
| `<dl-roll>` | `items` (JSON) `item-class` | Cycles one value at a time, sliding up every 3s. The dock rolls the two phone numbers and the email through it. |
| `<dl-wordmark>` | `size` `href` | Sets the name in type. **No logo mark exists — do not draw one.** |

### Interactive

| Element | Attributes | Notes |
| --- | --- | --- |
| `<dl-button>` | `variant` = `primary` \| `emphasis` \| `secondary` \| `outline` \| `ghost`, `href` `icon` `size="sm"` `full` `on-dark` `type` `wipe` = `orange`\|`navy` | 50px (sm 38px). **Max one `emphasis` in view.** `ghost` maps to `outline` on light surfaces. `wipe` sets which colour fills on hover — for paired buttons that should read as different things (Solar orange, Electrical navy). |
| `<dl-field>` | `label` `name` `type` `hint` `required` `options` `placeholder` | `options` (pipe-separated) makes it a select. |
| `<dl-contact-form>` / `<dl-contact-modal>` | `webhook` | The lead form, inline or as a modal. Posts to the leads Worker. The division `options` list is one string in `components.js`; renaming a division means that string AND the Worker's `DIVISIONS` map AND the sheet. |
| `<dl-calc>` | `id` `open` `title` | Collapsible wrapper for the calculator plugin. |

### Composed

| Element | Attributes | Notes |
| --- | --- | --- |
| `<dl-nav-bar>` | `active` `dark` | 72px sticky. Four links plus the CTA. Drawer below 768px. Links take the accent on hover and when current — orange, except Electrical, which takes navy. |
| `<dl-hero>` | `photo` `alt` `srcset-widths` `fit` = `contain` `flare` = `sunrise` `lights` | Five layers. All five required — see Motion. `srcset-widths="640,1024,1440"` opts into responsive images and expects `-640w` etc. derivatives on disk. `flare` and `lights` are the two opt-in features, one per division; see Motion. |
| `<dl-terminal>` | `title` `tone` `stream` `lines` (JSON) | The day's job feed. |
| `<dl-cta>` | `eyebrow` `heading` `body` `action` `href` | The closing call to action. One per page, last before the footer. |
| `<dl-dock>` | `action` `href` | The persistent bottom pill. Rolls the contact details, then **WhatsApp** (ghost, secondary), then the quote button (orange, primary). Hidden at rest; reveals on scroll-up. Back-to-top ships with it. The WhatsApp number is `SL_WHATSAPP` in `components.js`, one constant for all three sites. |
| `<dl-return>` | — | The thank-you page's countdown back to where the visitor came from. |
| `<dl-reveal-lines>` | — | Line-by-line reveal variant of `<dl-reveal>`. |
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

**If a themed plugin element is an `<a>` tag, opt it out of the link-dim
rule.** Plain text links dim to 70% opacity on hover (`a:hover`); every
button and card in the system is explicitly excepted (`a.sl-btn:hover,
a.sl-card:hover, …`). A plugin card left off that list dims along with
whatever hover state you did theme for it. Add `opacity: 1` to the
plugin's own hover rule in `plugins.css` — don't add the plugin to the
central exception list in `sunlogic.css`, which is for the system's own
components.

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

| Role | Size | Weight | Line-height (leading) | Tracking (kerning) |
| --- | --- | --- | --- | --- |
| Hero | `clamp(32px, 5.4vw, 72px)` | 900 | 1.111 | −0.02em |
| Section | `clamp(32px, 3.6vw, 48px)` | 800 | 1.166 | −0.01em |
| Section, mobile | 32px | 800 | 1.25 | **normal** |
| Title | 24px | 700 | 1.333 | normal |
| Body large | 18px | 400 | 1.555 | normal |
| Body | 16px | 400 | 1.5 | normal |
| Label / eyebrow | 14px (12px dense) | 600 | 1.428 | +0.05em, **uppercase** |
| Button | 14px | 700 | — | normal |

- Negative tracking on display type only. Leading tightens as size grows:
  1.5 for body, 1.111 for the hero. Never below 1.1 on anything, never above
  1.6 on anything read at length.
- Measure: prose sits at a 640px column (`<dl-prose>`, 780px with `wide`).
  Body text elsewhere caps at 560px (`<dl-text>`). Nothing read at length
  runs the full container.
- Headings get `text-wrap: balance`. The accent-phrase pipe is also a hint for
  where the balanced break should fall; place it where the line should turn.
- Uppercase labels always carry +0.05em. Uppercase without tracking reads as
  shouting; tracking without uppercase reads as a mistake.
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

## Images

**Format and sizes.** Everything that renders on a page is `.webp`. A hero or a
card photo is supplied at three widths plus a fallback and wired with
`srcset-widths`:

| File | Width | Who fetches it |
| --- | --- | --- |
| `name-640w.webp` | 640 | Phones |
| `name-1024w.webp` | 1024 | Tablets, small laptops |
| `name-1440w.webp` | 1440 | Desktops |
| `name.webp` | 1440 or 1920 | Fallback for browsers without srcset, and `og:image` |

Convert with `cwebp -q 82 -resize <w> 0`. Drop to 76 for photographs heavy
with foliage or fine texture, which compress badly; a 4608×3456 garden shot
came out at 670KB at 82 and was still 293KB at 76. **Cap a foliage-heavy
fallback at 1440 rather than 1920.** Nothing renders it at full width and the
difference was 180KB.

**Pre-crop to the frame that will show.** The hero frame crops to a wide band
and throws the sky and the foreground away. Crop the source to 16:9 before
converting and most of the file size goes with them.

**Preload the hero.** It is the LCP element:
`<link rel="preload" as="image" href="…" imagesrcset="…" imagesizes="100vw" fetchpriority="high"/>`.
The promo at the foot of the page loads lazily instead.

**Alt text describes what is in the picture, and claims nothing.** "A house
with solar panels covering its pitched roof, seen from the street on a clear
day." Not "our installation in Noordhoek" unless it is, and not "solar panels
on a rooftop" when the picture is a car being charged, which shipped on three
pages. An illustration is called an illustration.

**Never stock, never a competitor's photograph.** Two images credited to a
solar company in New Zealand stood on the Off Grid article for a year. A
labelled empty state is honest; a borrowed photograph is a claim.

**Text inside an image is invisible to the gate.** A hero that carries
"Savings: 22%" and a Fahrenheit thermostat passed every rule and shipped. Read
the picture before you wire it.

**Own the source.** Raw drops go in `_incoming/` (git-ignored). Convert, wire,
verify the render, then delete the original. Never `git rm` an image without
grepping for it first: five references broke when three superseded blog
photos were removed, across `thank-you.html` and `ci-guide.html`.

**Redact before publishing.** A report screenshot carried a customer's name,
street and station ID and a gendered pronoun in the installer's own text.
Every one was found by reading the image, not by a tool.

---

## Spacing, radius, elevation

8px rhythm: 4, 8, 16, 24, 32, 40, 48, 64, 80, 120.
Section padding 96px desktop / 56px mobile. Gutter 24 / 16. Container 1152px.

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
and worst on mobile where section padding is only 56px.

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

**Each division's home hero carries one feature, and only one.**

- **Energy: `flare="sunrise"`.** The sun tracks a path read off the
  photograph over 30s, then the scene dims 42% for 46s with a flat hold at
  full depth, then lifts. 76s cycle. The path is welded to that specific
  photo; change the image and retune the path. Position moves on `transform`,
  never `left/top`, because the blurs run to 118px and re-laying-out a blurred
  element every frame is what would make it costly. The dusk layer sits
  BELOW both scrims so the heading holds contrast through the dark half.
- **Electrical: `lights`.** A warm interior wash rising from the lower half of
  the frame, `screen`-blended so it warms the photograph rather than veiling
  it. 8s up, 40s lit, 8s down, 70s cycle to match the flare's rhythm. Pure
  CSS, no rAF loop. Deliberately image-independent: it cannot misalign, so it
  survives a new hero photo without retuning. Also below both scrims.
- **Apex: nothing.** Stays still, per the owner.

Under `prefers-reduced-motion` the flare holds a frame and the lights hold
lit. Neither switches off: both are part of how the photograph is lit, not
decoration on top of it.

---

## Spacing

- `--section-pad-y` 96px desktop, 56px below 768px. A full-bleed section's
  padding, edge to content.
- `--panel-gap` 40px desktop, 24px below 768px. The gap between an INSET
  PANEL band and its own edge: the statement, the closing CTA, the promo.
  The panel's own padding supplies the rest, so a panel band lands on the
  same rhythm as a section. **Never put `--section-pad-y` on a panel
  wrapper.** Doing that stacks two paddings and gives the block 168px above
  its first line. That shipped once.
- A `cols="split"` grid with one child is not a split, it is half an empty
  band. Remove the wrapper when you remove the column.
- **One exception, and only one.** A `dl-sector` marker belongs to the section
  it opens, so a full rhythm between the two reads as a gap inside a heading.
  The pair sits at three quarters of the rhythm: 72px desktop, 42px below
  768px. Written as `calc(var(--section-pad-y) * 0.75)`, a ratio rather than a
  pixel value, so it holds at every breakpoint without a second media query.
  A full rhythm and a half were both tried on the page and both were wrong.
- The model is the same figure on every page of every site at every width.
  If a band looks different from the band above it, the fix is in this file,
  not a margin on the page.

## Skills: which one, for which job

**Never write or change copy without running the skill that owns it.** These
are installed globally at `~/.claude/skills/`. Applying their principles from
memory is not the same as running them and must not be described as if it were.

| Job | Skill | Non-negotiable |
|---|---|---|
| Headlines, subheads, button labels, hero and section openers | `landing-page-copy` | Take its mechanism and specificity discipline. Ignore its urgency devices: suppression framing and fake scarcity would destroy credibility here. |
| Argument sections, anything whose job is to get the next block read | `direct-response-copy` | |
| Reviewing or critiquing any copy, before and after a change | `copychief` | Run it on the SOURCE being changed, not on whatever is currently live. |
| Any claim about tax, tariffs, municipal rules, finance terms, competitors, or a number | `compliance-checker` | Run the checklist. It is a checklist, not a philosophy. |
| Copy for use off-site | `ad-copy` | |

House rules apply to all of them, always: no invented facts, no jargon, no AI
writing patterns, no em dash.

**The loop, every time, no exceptions.** Write with the skill that owns the
job → run `copychief` on it → apply the findings → build → gate → sweep →
show the owner. Every review is saved to `docs/copy/` as an HTML report with
an "Applied" section at the foot recording what changed, so the next person
knows what was already tried. Fourteen of them exist. **Applying a skill's
principles from memory is not running it**, and the owner has said so more
than once.

**Verification before persuasion.** A claim about how somebody else charges,
taxes or regulates does not go on a page without a document behind it. Where
there is no document the claim is cut, not hedged: hedging keeps the risk and
loses the force. Marketing and sales language is not the problem and never was.

## Interaction

- **Never a light-on-light button at rest.** On cream, a button is NAVY at rest
  and wipes to ORANGE on hover. The outline variant used to be a transparent box
  with a warm hairline, which on a cream ground is a control you only find if
  you already know it is there, on the same page as a solid navy dock button
  that announces itself perfectly well. Enforced by rule 18, which measures the
  button's own background against the first painted ground behind it and fails
  under 1.6:1. A button with no background of its own is exempt: ghost over
  photography is deliberate, and the scrim does that work.
  `.sl-btn--secondary` was retired by this rule. It was cream on beige at
  1.09:1, no page used it, and it survived only as a CI guide specimen.
- **A counted claim is checked against the file it counts.** The reviews
  section states twenty reviews because `reviews.data.js` holds twenty.
  Refresh the export without touching the copy and rule 19 fails the build.
  A number that used to be true is how a verified claim quietly becomes an
  invented one.
- **A button's label and its URL are one promise.** "Leave a Review" was
  relabelled "Read Them on Google" and left pointing at the write-a-review
  URL. Both halves were verified by following the redirects, not by reading
  the markup. Change one, check the other.
- **Hover and the pointer cursor are promises.** Only something you can act on
  may have either. A card hovers if it IS a link or CONTAINS one, and not
  otherwise. Enforced by rule 17 and by `.sl-card:has(a, button, summary)`.
- **Marks on controls are icons from the set, never typed characters.** No
  "+", no minus sign, no arrow glyph in a `content:` property. A glyph centres
  on its font's metrics rather than its box and cannot be restyled with the
  set. Enforced by rule 16.
- **One card tone per section.** Tone belongs to the band, not the card: white
  steps up from a beige ground, warm does not. Navy is the final step of a
  numbered sequence and nothing else. Enforced by rule 15.
- **One grid, one heading case.** Card headings inside a single grid are all
  Title Case or all sentence case, never mixed. "Lighting is usually the
  fastest saving" beside "Three-Phase Supply" failed the gate for a week.
  Reword the odd one so the set sits on one side of five words. Enforced by
  rule 20.
- **A price is a navy block.** `.sl-price` inside a card: navy ground, white
  20px/800 amount, a mono uppercase note under it. Sits at the foot of the
  card (`margin-top: auto`). "Excluding VAT" or "Including VAT" is always in
  the note, never assumed. Where there is no figure, the pillar still says
  what it costs: "On quote, and it has to be", with the reason, in a callout.
  A pillar with no price at all was the gap on Smart Solutions.
- **A note is small and grey.** `.sl-note`, 13px secondary. For the line under
  a price, a bracketed placeholder, or a contract term quoted with a link.
- **The dock waits.** It stays down until the reader has scrolled past the bar
  under the hero: the anchor row on a service page, the trust strip on a home
  page. Nothing overlaps a control the reader has not asked for yet.

## Copy

- **Voice: contractions.** Body copy, answers and prose take contractions.
  "It isn't worth doing yet" is what a person says; "It is not worth doing yet"
  is what a contract says, and the house voice asks for knowledgeable, not
  stiff. Eyebrows and button labels take none: they are label copy and a
  contraction reads as a typo at that size.

  Headings are a judgement, not a default. Use one only where it carries the
  line: "Every Unit You Make Is One You Don't Buy" is the hook, and "Do Not Buy"
  would kill it. This started life as a flat rule saying no contractions in any
  heading, which was tested against the estate before it was written down and
  would have broken exactly that approved headline. It is a judgement here
  because it could not survive being a rule.

  **This one is NOT gate-checked**, and that is deliberate. A possessive and a
  contraction are the same apostrophe, so "Plentify's case studies" and
  "you can't" cannot be told apart mechanically without flagging the first.
  Everything else in this file that reads like a rule IS enforced; treat the
  absence of a check here as the exception it is.

- **Heading case.** Hero, section and CTA headings are Title Case at any
  length. Card and step headings are Title Case to five words and sentence
  case past that. Prose sub-heads are always sentence case. Enforced by
  `shared/sunlogic-check.js` rule 6.
- **One label for the site visit.** "Book Your Free Site Visit", everywhere,
  on all three sites. Enforced by `shared/sunlogic-check.js` rule 13.
- South African English — colour, organised, licence (noun) / license (verb).
- No superlatives, no unverifiable claims. Specific checkable facts instead.
- Spell out "Certificate of Compliance" and "Section 12B" in full on first use
  per page.
- **No em dash in copy, ever.** Colon, comma or full stop for an aside.
  Enforced by `shared/sunlogic-check.js` rule 14, which reads the RENDERED
  page: a dash in a code comment is fine, a dash in a string the page
  prints is not. The en dash stays legal where it is correct typography:
  numeric ranges, time ranges, and the empty-value glyph on a stat card.
- Knowledgeable, not technical. Someone who knows the trade, not a friendly
  stranger. No hype, no stiffness.
- **No emoji.** Ever.
- **No exclamation marks.** Ever. "Both are really great solutions… the way
  to go!" was live on a blog post and is the reference for why.
- **Never assume a person's gender.** A customer in a case study is "this
  client" or "the client", never he or she. This was got wrong twice on one
  page, once in the copy and once inside a screenshot's own text, and both
  had to be re-rendered.
- **A real person's words are verbatim or absent.** Craig Lewis is quoted on
  three blog posts. A quote that is still true stays inside quotation marks,
  attributed to when it was said: "Lewis said when this was first published."
  A quote that has expired is removed, never edited, because you do not trim
  somebody's words to keep them convenient. **No words are ever invented for
  a real person.**
- **An old article is updated, not backdated and not republished.**
  `datePublished` keeps the original date. The byline reads "25 August 2022,
  updated 6 September 2026", `dateModified` matches, and schema.org carries
  both. Rewriting words under an unchanged 2022 date presents new writing as
  old; republishing under today's date throws away the page's age for
  nothing.
- **Nothing is free except the site visit.** Some registration services are
  sold. "Book Your Free Site Visit" is the one place the word appears.
- **A number is sourced or it is cut.** "Nearly R2.2 million" of national
  panel imports, "up to 20%" from a geyser blanket, "surge is one of the
  fastest-growing insurance claims", "plug-in hybrids outsell battery-electric
  by a wide margin", "300+ systems installed": all were live, none had a
  source, all are gone. Hedging an unsourced number keeps the risk and loses
  the force.
- **A supplier's marketing page does not override a contract in the repo.**
  Plentify's site says "cancel anytime, after 60 days a fee". `legal.html`
  says Sunlogic retains the device, takes 20 business days' notice, and
  charges R750 inside 24 months. The second is the contract. The first was
  published for an afternoon.
- **Each division has a spine, and it is not the same one.** Energy's is an
  ORDER of spending: hot water first because that is where the money is, then
  switching, then monitoring, then the rest. It sells against a grievance
  everybody already has: the bill goes up whether you act or not.
  **Electrical has no equivalent motive**, and Craig's review named that as
  the hard problem. Nobody phones an electrician because they would like to.
  The honest spine is **a deadline somebody else sets**: selling a property,
  an insurance claim, a lease renewal, adding load the board cannot carry,
  something already broken. It is stronger than a saving because it has a
  date on it. Every Electrical page hangs off it, including the closing CTA,
  which had to be caught still promising "what it would save". A division
  page whose sections do not hang off its spine is the apex page wearing a
  division badge.
- **Smart on each division site is that division's side of smart.** On
  Energy it is hot water, switching and monitoring, with Plentify's
  controllers. On Electrical it is load control at the board, sub-metering
  and charge scheduling, on the argument that anyone can sell a device and
  the value is being the people who wire and certify it. The Electrical
  Smart page shipped as an unchanged copy of Energy's, selling geyser
  controllers to an electrical audience, and repeated a product claim that
  had been corrected on Energy the same day. Cross-link the other division's
  pillar; never duplicate it.
- **Hedge time, cost, diagnosis and legal obligation. Stay confident
  everywhere else.** Craig's rule, from his review. "A day's work" is a promise
  a contractor cannot keep; "usually a day's work" is true. A statement of
  what a landlord may charge a tenant points at the bylaw rather than
  asserting it.
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

Four checks, in this order, and a page is not done until all four are clean:

```bash
node scripts/build-site.js      # three sites into dist/
node scripts/conformance.js     # the gate: 25 pages × 2 viewports, rules 1–20
node scripts/layout-sweep.js    # 550 page/width combinations
npm test                        # 70 unit tests, including the gate's own rules
```

**A page with a red badge is not done.** Then look at it against the Energy
home page, which is the reference composition. Then show the owner: a
`Read` of a PNG shows it to you and not to them; use `SendUserFile` or the
Browser pane.

**Look at the built page, never the source.** An editor hook opens
`file:///…/site-energy/page.html` after every edit. That tab is unstyled:
`shared/` and `images/` only exist in `dist/`, so the source renders as raw
text and looks broken when nothing is wrong. The owner has been shown that
tab by mistake more than once. The preview at `http://127.0.0.1:8433/energy/`
is what to look at, and it is what the reviewer should be pointed at.

**Every gate rule is proved by injecting a violation.** A new rule that has
never been seen to fail has not been shown to work. Rule 20 was written to
select `.sl-grid`, a class that does not exist; the injection test is what
caught it. Same discipline for server guards: the traversal test on the
preview server passed against a deliberately broken server because `fetch()`
normalises `/../` before sending, and was rewritten on a raw socket.

The full rule index is in `CI_Guide/README.md`.

---

## Open — flag, never guess

- No logo mark exists beyond the division SVGs in `images/`. `<dl-wordmark>`
  sets the name in type. Do not draw, trace, generate or approximate a mark.
- **Visible placeholders still on public pages, all blocked on the owner:**
  the Electrical proof section (three to five real electrical jobs), the
  Electrical smart capability list, and the EV blog post's hero. The current
  list lives in `CHECKPOINT.md` under "Still open on Electrical".
- **Contract questions**, not copy: the subscription agreement dates its
  Initial Term from a "Free Trial" it never defines, and says Sunlogic
  retains ownership of a device the product copy describes as bought.
- Landscape phone behaviour is unspecified.
- Focus is not trapped in the nav drawer. `Tabs` and `Menu` have no arrow-key
  navigation. (There IS a skip link now; an earlier version of this list said
  otherwise.)
- `electrical-hero.webp` is the hero on three Electrical pages. Not a defect;
  worth a second and third photograph.

---

## The estate, in one place

- **Three sites, one codebase.** `site-main/` (apex, sunlogic.co.za),
  `site-energy/` (energy.sunlogic.co.za), `site-electrical/`
  (electrical.sunlogic.co.za). `scripts/build-site.js` builds each into
  `dist/<site>/` with `shared/` copied in. Divisions are **Energy**,
  **Electrical** and **Smart Solutions**; "Solar" and "Energy Management" are
  the old names and survive only in the Worker's normalisation map.
- **Deploys are Cloudflare Pages watching `main`.** There are no GitHub
  Actions; `.github/` was removed deliberately. Pushing to `main` publishes.
- **The lead form posts to a Cloudflare Worker** (`workers/leads-relay/`),
  which rotates offers between the two directors and falls back to n8n on the
  iMac. n8n is a catalogued iMac service, so any change to it routes through
  the `serverMonitor` project. Two rules that live there and affect the site:
  **`sales@sunlogic.co.za` receives no lead notification** (it is the
  reply-to on visitor-facing mail only, so a customer answering their own
  estimate reaches the shared mailbox rather than one director); and **a
  submission from any `@sunlogic.co.za` address is stored but takes no turn
  in the rotation**, so partners can test the form without paging a director
  or handing the next real lead to the wrong person. They get a reply that
  says so, which is the proof the system works. Never set `MAIL_REDIRECT_TO`
  in production.
- **Preview:** `node scripts/preview.js 8433`, then
  `http://127.0.0.1:8433/energy/`. Clean URLs work, matching Cloudflare.
- **Never bare `npx`.** Use the repo's `node_modules/.bin/`.
- **Never commit** `.claude/`, `Sunlogic_Feedback_Decisions.*`,
  `copy/Sunlogic_*`, `_incoming/`, or `_*.js` scratch scripts.
