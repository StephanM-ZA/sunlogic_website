# Review Carousel Plugin — Design Spec

**Status:** Approved by user in chat (design sections), pending written-spec review.
**Author:** Claude (session), for Stephan Marais.

## 1. Overview

This spec covers the first entry in a new `plugins/` folder: a portable, drop-in
Google-review carousel. Unlike `site/shared/components.js` (Sunlogic-specific,
tied to this site's Tailwind config and `sl-` naming), `plugins/` is the start of
a library the user intends to keep building — self-contained widgets any future
static-HTML project can copy in and re-theme via CSS custom properties, with no
build step and no dependency on the host project's design tokens.

## 2. Goals

- A `<plugin-review-carousel>` custom element showing curated Google reviews:
  reviewer name, avatar (or initials fallback), star rating, review text, and a
  link to the review's direct Google listing URL.
- Fixed, consistent card height regardless of comment length.
- Continuous horizontal autoscroll ("marquee"), multiple cards visible with the
  next one peeking in, pausing on hover and on keyboard focus.
- Clicking anywhere on a card opens that review's Google URL in a new tab.
- Fully portable: no Tailwind dependency, styling driven by CSS custom
  properties with sensible Sunlogic-orange defaults.
- Establishes the folder convention (`plugins/<plugin-name>/`) future plugins
  will follow.

## 3. Non-goals

- No live Google Places/Business Profile API integration. Google's Place
  Details API caps reviews at 5 with no way to choose or page through them, and
  a live client-side call would require exposing a domain-restricted API key
  and incurring per-load API cost — the user chose curated static data instead
  (confirmed in chat).
- No half-star ratings. Google review ratings are whole numbers 1–5; the
  component only needs to render integer ratings.
- No CMS/admin UI for editing reviews — the data file is hand-edited, same
  workflow as editing site copy.
- No shared npm package / bundler — stays consistent with the rest of the
  repo's no-build-step approach.

## 4. File Structure

New top-level folder, sibling to `site/` and `design-system/`:

```
plugins/
  review-carousel/
    review-carousel.js   — defines <plugin-review-carousel>, injects scoped CSS once
    reviews.data.js       — sets window.PLUGIN_REVIEWS = [ {...}, ... ]
    README.md             — drop-in usage + theming instructions for future projects
```

Future plugins each get their own `plugins/<name>/` sibling folder following the
same shape (one script defining the element, one optional data file, one
README). This spec only defines `review-carousel`; the folder convention is the
reusable part.

## 5. Data Schema

`reviews.data.js` sets a single global before `review-carousel.js` loads:

```js
window.PLUGIN_REVIEWS = [
  {
    name: "Jane Smith",       // required, string
    avatar: null,              // string URL, or null for initials fallback
    rating: 5,                 // required, integer 1-5
    text: "Excellent service, the team was...", // required, string
    url: "https://www.google.com/maps/reviews/...", // required, direct review link
    date: "March 2026",        // optional, display string, not parsed
  },
  // ...
];
```

`review-carousel.js` reads `window.PLUGIN_REVIEWS` once in `connectedCallback`.
If the array is missing or empty, the component logs a single
`console.warn('[plugin-review-carousel] No reviews found — set window.PLUGIN_REVIEWS before this script loads.')`
and renders nothing (no broken empty carousel, no thrown error).

**Open item:** the actual review content (names, ratings, text, real Google
review URLs) comes from the user and will be collected when this plugin is
implemented — `reviews.data.js` is not populated with real content by this
spec.

## 6. Component Behavior

- Light-DOM Web Component, `display: contents` on the host tag — same
  accessibility/SEO rationale as `sl-card`/`sl-callout`: real content in the
  DOM, not hidden in a shadow root.
- Renders a `.plugin-review-track` flex row inside an `overflow: hidden`
  viewport. The reviews array is rendered twice back-to-back inside the track
  (duplication, not cloning via JS after layout) so a CSS `@keyframes` rule can
  translate the track from `0` to `-50%` and loop with no visible seam. Looping
  math only works cleanly when the track's total content is duplicated exactly
  once — the component always renders exactly 2 copies regardless of review
  count. (Note for content: very short lists, e.g. 2–3 reviews, will loop
  quickly and repetitively; this is an acceptable tradeoff, not a bug, and the
  user should aim to supply at least ~6 reviews for a natural-feeling loop.)
- Animation: `animation: plugin-review-scroll var(--plugin-review-speed, 40s)
  linear infinite;` on the track. `animation-play-state: paused` applied via
  `:hover` and `:focus-within` on the host.
- `@media (prefers-reduced-motion: reduce)`: animation is disabled entirely
  (`animation: none`), and the viewport switches to `overflow-x: auto` with
  `scroll-snap-type: x mandatory` so the content is still fully reachable by
  manual horizontal scroll/swipe.
- Each card is a real `<a href="{review.url}" target="_blank"
  rel="noopener">` wrapping the whole card's content — genuine link semantics
  (right-click, open-in-new-tab, screen readers all work correctly), not a
  JS click handler on a `<div>`.
- Card contents, top to bottom:
  1. Header row: avatar (image or initials badge) + reviewer name + optional
     date, small "Posted on Google" attribution label with a simple "G"
     glyph (plain-text/SVG, not the Google logo asset, to avoid any brand-mark
     licensing question) — standard practice when redisplaying third-party
     platform review content.
  2. Star row: 5 inline SVG stars, filled 0–rating in
     `var(--plugin-review-accent)`, remainder outlined/muted.
  3. Review text, clamped to 4 lines (`-webkit-line-clamp: 4`), with a
     `linear-gradient(to bottom, transparent, var(--plugin-review-card-bg))`
     fade overlay covering the last ~2rem, so long and short reviews render
     as visually identical card heights.
- Avatar fallback (no `avatar` URL): a circular badge showing the reviewer's
  initials (first letter of first and last name-word), background
  `color-mix` of `var(--plugin-review-accent)` at low opacity, text in
  `var(--plugin-review-accent)` — stays on-brand without per-person color
  hashing complexity.

## 7. Theming (CSS Custom Properties)

Defined on `:root` with fallback defaults inside the component's injected
`<style>` block (same injection pattern as `components.js`'s base style
block — inserted once, guarded so re-running the script doesn't duplicate it).
A future project overrides only these variables; no Tailwind class needed
anywhere.

| Variable | Default | Purpose |
|---|---|---|
| `--plugin-review-accent` | `#ff8000` | Star fill, initials text/badge tint, link focus ring |
| `--plugin-review-card-bg` | `#ffffff` | Card background, fade-overlay gradient target |
| `--plugin-review-text-color` | `#1a1a1a` | Reviewer name, review body text |
| `--plugin-review-text-muted` | `#6b7280` | Date, attribution label |
| `--plugin-review-card-height` | `260px` | Fixed card height |
| `--plugin-review-card-width` | `320px` | Card width on desktop (≥641px) |
| `--plugin-review-card-width-mobile` | `260px` | Card width ≤640px (shows ~1.5 cards) |
| `--plugin-review-radius` | `1rem` | Card corner radius |
| `--plugin-review-gap` | `1.5rem` | Space between cards |
| `--plugin-review-speed` | `40s` | Full marquee loop duration |
| `--plugin-review-font` | `inherit` | Card font-family (inherits host page by default) |

Desktop card width (320px) plus gap (24px) means roughly 3 cards fit in a
~1030px content column with a 4th peeking at the edge, matching the
"multi-card, next one peeking" behavior approved in chat.

## 8. Accessibility & Error Handling

- Pauses on `:hover` and `:focus-within` (keyboard tab order reaches the
  `<a>` cards since the track is not `aria-hidden`).
- `prefers-reduced-motion` fallback described in §6.
- Each card link gets an accessible name via visible text content already
  inside the `<a>` (reviewer name + rating + review text) — no extra
  `aria-label` needed since nothing is icon-only inside the link.
- Missing/empty `window.PLUGIN_REVIEWS`: warn + no-render (§5), never a thrown
  error that could break the rest of the page.
- Missing `avatar`: initials fallback (§6), never a broken `<img>`.

## 9. Embedding Example

```html
<script src="plugins/review-carousel/reviews.data.js"></script>
<script src="plugins/review-carousel/review-carousel.js" defer></script>
...
<plugin-review-carousel></plugin-review-carousel>
```

For this repo specifically, the plugin gets wired into `site/index.html` (the
homepage) as a new section — exact placement to be decided during
implementation, but the natural slot is between the "Why Sunlogic" section and
the final CTA section, following the same `?v=` cache-busting convention
already used on the site's own shared scripts (`?v=1` initially, bumped on
every future edit to either plugin file).

## 10. Testing Plan

No test framework exists in this static-HTML project; verification is manual
in-browser, covering:

1. Desktop (~3 cards visible + 1 peeking), mobile (~1.5 cards visible) widths.
2. Hover pauses the scroll; moving off resumes it.
3. Tab-focusing a card pauses the scroll; the URL bar/status shows the correct
   Google review link on focus.
4. Clicking a card opens the correct review's Google URL in a new tab.
5. One very short review and one very long review render at identical card
   heights, with the long one visibly fading out at the bottom edge.
6. `prefers-reduced-motion: reduce` (via DevTools emulation) disables the
   animation and the track becomes manually scrollable.
7. Component with an empty/undefined `window.PLUGIN_REVIEWS` renders nothing
   and logs the warning, without breaking the rest of the page.
8. A review with no `avatar` renders the initials badge, not a broken image.

## 11. Open Items For User

- Real review data (names, ratings, text, direct Google review URLs, optional
  photos) needs to be supplied before `reviews.data.js` can be finalized —
  will be requested at implementation time.
- Exact homepage placement (§9) can be adjusted during implementation if a
  different section works better once seen in context.
