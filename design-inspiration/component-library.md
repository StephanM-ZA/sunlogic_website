# Sunlogic Component Library

**Status:** Living reference — update whenever a component's attributes or markup change.
**Single source of truth:** `site/shared/components.js` (this document describes it; if the two disagree, the file is correct and this doc is stale).
**Live visual reference:** `site/component-gallery.html` — every component, every variant, rendered in isolation. Open it in a browser rather than trying to picture a component from prose alone.
**Related:** [[design-tokens.md]] (the colors/type/spacing/radii these components consume), [[../docs/superpowers/specs/2026-08-28-component-library-design.md]] (why Web Components + light DOM was chosen over a build step).

## How these work

Native Web Components, rendered in **light DOM** (no shadow root), each with `display: contents` on its host tag (set once in a shared `<style>` block in `components.js`) so the tag itself generates no box — only its rendered children do. This is required because Tailwind's CDN script scans the *rendered* DOM for utility classes; shadow DOM would hide a component's internals from it.

**Consequence for anyone building a new page:** never lay out `<sl-*>` tags with `space-y-*`/`space-x-*`/`divide-y` — those utilities put margin on the host tag, and a `display: contents` host discards margin. Use `gap-*` on a flex/grid parent instead; `gap` resolves through to the component's real rendered element.

Every page's `<head>` needs, in this order:
```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script src="shared/tokens.js"></script>
<script src="shared/icons.js"></script>
<script src="shared/components.js" defer></script>
```
`icons.js` must load (non-deferred, before `components.js`) because several components call `slIcon()` at render time. `components.js` is deferred so the whole document — including light-DOM children like `<li>`/`<option>` inside component tags — is parsed before any component reads them.

## `<sl-button>`

| Attribute | Values | Default | Notes |
|---|---|---|---|
| `variant` | `primary` \| `secondary` \| `dark` | `primary` | `secondary` needs a dark/tinted background to read (it's outlined, light text) |
| `size` | `compact` \| `md` \| `lg` \| `form` | `md` | `form` is sized for form-submit buttons |
| `icon` | any name from `icons.js` | — | renders at the end of the label |
| `href` | any URL | — | renders `<a>` instead of `<button>` |
| `type` | `button` \| `submit` \| etc. | `button` | ignored if `href` is set |
| `full-width` | boolean | off | |
| `hidden-mobile` | boolean | off | `hidden md:block` — used for the nav's desktop-only CTA |
| `shadow` | `none` \| `hover-lg` \| `static-lg` \| `hover-md-lg` | `none` | |

Every button lifts on hover (`.sl-lift`, see [[design-tokens.md]]) — there is no way to opt out; if a future usage genuinely shouldn't lift, that needs a new attribute, not a workaround.

Hover colors are explicit derived hex values (`#e67300` for primary, `#1a4050` for dark), not `filter: brightness()` — a filter would dim the button's white text/icon along with the background, which was tried and reverted.

## `<sl-section-header>`

| Attribute | Values | Default | Notes |
|---|---|---|---|
| `eyebrow` | text | — | small uppercase badge above the heading |
| `heading` | text | — | |
| `subtext` | text | — | omit the attribute entirely to omit the paragraph |
| `on-dark` | boolean | off | swaps heading color for dark backgrounds |
| `gap` | `md` \| `lg` | `md` | bottom margin before whatever follows (`mb-16` / `mb-20`) |
| `wide` | boolean | off | `max-w-6xl` instead of `max-w-3xl` — only the Process section uses this, to preserve its original full-width layout |

## `<sl-card>`

| Attribute | Values | Default | Notes |
|---|---|---|---|
| `variant` | `service` \| `benefit` | `service` | |
| `icon` | any name from `icons.js` | — | |
| `heading` | text | — | |
| `body` | text | — | |
| `<li>` children | — | — | **`service` variant only** — each becomes a checklist row with a check-circle icon; ignored on `benefit` |

Both variants sit on `bg-surface-container-lowest` (pure white) and expect a `bg-surface-container` section behind them — see the "rule of thumb" in [[design-tokens.md]].

`service` cards get a top accent bar on hover (`border-t-4`, transparent → `secondary-container`) to match `sl-panel`'s static top bar; `benefit` cards don't have this (no border reservation at all).

## `<sl-field>`

| Attribute | Values | Default | Notes |
|---|---|---|---|
| `label` | text | — | |
| `type` | `text` \| `email` \| `tel` \| `select` | `text` | |
| `placeholder` | text | — | ignored for `select` |
| `field-id` | string | — | becomes the `id`/`for` pair — required for label association |
| `<option>` children | — | — | **`select` type only** |

Focus state is a bottom-bar accent (`focus:border-b-4 focus:border-b-secondary-container`), not a full-border color change — deliberately chosen over a uniform border-color swap, and the border stays a constant width at rest (no layout shift when it thickens on focus).

## `<sl-panel>`

No attributes — wraps whatever content you put inside it (heading, paragraph, form, buttons — anything). Renders a glass background, an orange top accent bar, a decorative blur in the top-right corner, and the shared hover lift.

**Implementation note for anyone extending it:** unlike every other component here, `sl-panel` doesn't read attributes and generate content from scratch — it relocates its existing *child nodes* into the new wrapper. If it instead captured `innerHTML` as a string and reassigned it, any nested component that had already rendered (e.g. an `sl-field[type=select]` that already replaced its `<option>` children with a real `<select>`) would have its expanded markup re-parsed as a fresh element — which would find no top-level `<option>` tags anymore and silently render an empty dropdown. Moving live nodes sidesteps this entirely.

## `<sl-step>`

| Attribute | Values | Default |
|---|---|---|
| `icon` | any name from `icons.js` | — |
| `heading` | text | — |
| `body` | text | — |

Renders an icon box + heading + paragraph, styled for the dark "Our Process" section specifically (hardcoded `text-on-primary` etc.) — there's no light-background variant because nothing needs one yet. Add an `on-dark`-style toggle if a second usage ever does.

## `<sl-section>`

| Attribute | Values | Default |
|---|---|---|
| `bg` | any color token name (e.g. `surface-container`, `primary-container`) | `surface-container-lowest` |
| `class` (native HTML attribute) | any extra utility classes | — |
| `id` (native HTML attribute) | any string | — |

Wraps a page section with the standard responsive spacing rhythm (`section-gap-mobile/desktop`, `margin-mobile/gutter` — see [[design-tokens.md]]) so no page has to repeat those four classes by hand. Because the host itself is `display: contents` (no box), both `class` and `id` are read off the host and moved onto the real generated `<section>` — an `id` left on a `display: contents` element wouldn't work reliably as a scroll anchor, since such an element has no layout box to scroll to.

Not used for the hero (unique full-bleed background-image treatment) or the footer (already its own `sl-footer` component) — both apply the same responsive spacing classes directly instead.

## `<sl-nav-bar>`

| Attribute | Values | Default |
|---|---|---|
| `active` | `home` \| `services` \| `energy` \| `contact` | `home` |

Fixed-position glass pill nav. Background is a plain translucent `bg-black/65` + `backdrop-blur-md` (a real alpha color, not a `mix-blend-mode` trick — blend modes were tried first and abandoned because their result depends on whatever's behind them, so the nav could end up nearly invisible against a similarly-dark backdrop; plain alpha always darkens predictably).

Active and hover states are unified: both get bold text + an orange bottom bar (`border-b-2`, reserved as `border-transparent` at rest so there's no layout shift).

Includes a working mobile menu (no separate attribute — always present, shown only under the `md` breakpoint): tapping the hamburger toggles a dropdown panel (reusing the exact same link markup as the desktop row) and swaps the icon to an X; tapping any link or the CTA inside the panel closes it again.

## `<sl-footer>`

No attributes — content (support links, recent posts, contact CTA) is currently hardcoded inside the component itself, not attribute-driven, since there's only one footer on the whole site. Centers all content on mobile, left-aligns on desktop (`text-center md:text-left` on the grid, plus explicit `justify-center md:justify-start` on the two flex rows — brand logo and share-icon row — where text-align alone doesn't affect flex-item position).

## `<sl-callout>`

| Attribute | Values | Default |
|---|---|---|
| `icon` | any name from `icons.js` | `check-circle` |

Inline note box for flowing body copy — a left accent bar plus an icon chip, meant to make one fact stand out from surrounding paragraphs without the weight of a full `sl-card`. Deliberately a different treatment from `.sl-glow-card` (left bar, not a top bar + corner glow) since it sits inline between paragraphs rather than as a standalone card.

Content is slotted via `innerHTML` (same approach as `sl-faq-item`), so callers can include inline markup like `<strong>`/`<a>` inside the note, not just plain text.

## What's intentionally still page-specific (not componentized)

Per the original design spec, page *content* was always meant to stay out of components — headlines, body copy, image URLs. Beyond that, three things remain hand-written in `index.html` because each is genuinely one-off, not a repeated pattern:

- The hero background image + its three overlay layers (photo, multiply tint, gradient)
- Two decorative blurred-blob divs in the Services section
- The Why Choose Us placeholder photo (real installation photography still needed — see `BRIEF.md` §9.1)

Everything else that appears more than once on the page goes through a component above.
