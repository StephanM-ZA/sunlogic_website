# plugin-review-carousel

A portable, self-contained Google-review carousel. No build step, no
framework, no dependency on any host project's Tailwind config or design
tokens.

## Usage

Drop both files into your project (keep them together), then add:

```html
<script src="path/to/reviews.data.js?v=1"></script>
<script src="path/to/review-carousel.js?v=1" defer></script>
```

Each `src` carries a `?v=` query. There is no build step here, so nothing
fingerprints these files automatically — a browser will happily serve a
cached copy of an edited plugin, and the page then runs old code with no
error to show for it. **Bump the number in every page that loads this plugin
whenever you change one of these files.**


Then place the element anywhere in your page:

```html
<plugin-review-carousel></plugin-review-carousel>
```

## Providing review data

Before `review-carousel.js` loads, `reviews.data.js` must set
`window.PLUGIN_REVIEWS` to an array of review objects:

```js
window.PLUGIN_REVIEWS = [
  {
    name: "Jane Smith",       // required
    avatar: null,               // image URL, or null for an initials badge
    rating: 5,                  // required, integer 1-5
    text: "Review text...",    // required
    url: "https://www.google.com/maps/...", // required, direct review link
    date: "March 2026",         // optional
  },
];
```

If `window.PLUGIN_REVIEWS` is missing or empty, the component logs a console
warning and renders nothing — it will never show a broken empty carousel.

## Theming

Override any of these CSS custom properties (e.g. on `:root`, or scoped to a
container) to match your project's brand — no Tailwind or build step
required:

| Variable | Default | Purpose |
|---|---|---|
| `--plugin-review-accent` | `#ff8000` | Star fill, initials badge, accent color |
| `--plugin-review-card-bg` | `#ffffff` | Card background |
| `--plugin-review-text-color` | `#1a1a1a` | Name and review text color |
| `--plugin-review-text-muted` | `#6b7280` | Date and attribution text color |
| `--plugin-review-card-height` | `260px` | Fixed card height |
| `--plugin-review-card-width` | `320px` | Card width at ≥641px viewport |
| `--plugin-review-card-width-mobile` | `260px` | Card width at ≤640px viewport |
| `--plugin-review-radius` | `1rem` | Card corner radius |
| `--plugin-review-gap` | `1.5rem` | Space between cards |
| `--plugin-review-speed` | `40s` | Full marquee loop duration |
| `--plugin-review-font` | `inherit` | Card font-family |

Example, in your project's own stylesheet:

```css
:root {
  --plugin-review-accent: #2563eb;
  --plugin-review-speed: 60s;
}
```

## Behavior notes

- Autoscrolls continuously, pauses on hover and on keyboard focus.
- Respects `prefers-reduced-motion`: animation disables, carousel becomes a
  manually scrollable row instead.
- Each card is a real link to the review's direct Google URL — opens in a
  new tab.
- Supply at least ~6 reviews for a natural-looking loop; fewer will repeat
  more noticeably.
