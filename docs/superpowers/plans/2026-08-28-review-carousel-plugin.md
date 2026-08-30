# Review Carousel Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a portable, drop-in `<plugin-review-carousel>` Web Component showing Google reviews (avatar, star rating, comment, link-through), and wire it onto the Sunlogic homepage.

**Architecture:** A single self-contained Web Component (light-DOM, `display: contents`, matching the existing `sl-card`/`sl-callout` pattern in `site/shared/components.js`) reads a plain global data array and renders a duplicated, CSS-animated marquee track. Styling is 100% custom-property-driven — zero Tailwind dependency — so the same two files can be copied into any future static-HTML project and re-themed by overriding CSS variables.

**Tech Stack:** Vanilla JS (native Custom Elements), plain CSS injected at runtime, no build step, no bundler. This repo has no automated test framework (confirmed: no `package.json`, no test runner anywhere in the codebase) — every task's verification step is manual, in-browser, following the same pattern already used to build `site/shared/forms.js` and `components.js`.

**Spec:** `docs/superpowers/specs/2026-08-28-review-carousel-plugin-design.md`

## Global Constraints

- No Tailwind class dependency in the plugin — all styling via the component's injected `<style>` block using CSS custom properties (spec §2, §7).
- No live Google Places/Business Profile API call — curated static data only, read from `window.PLUGIN_REVIEWS` (spec §3, §5).
- Only integer star ratings 1–5 — no half-star rendering (spec §3).
- No build step, no bundler — plain `<script>` tags, loaded directly by the browser (spec §3).
- Plugins live under `plugins/<plugin-name>/` — this task's plugin is `plugins/review-carousel/` (spec §4).
- Any shared/plugin `<script src="...">` tag gets a `?v=N` cache-busting query string, bumped on every future edit to that file — the convention already in use across every page in `site/` (spec §9).
- **Git commits are never run directly by an implementer subagent or via raw `git commit`.** Per this project's standing rule, every commit routes through the `commit-specialist` agent, dispatched by the controlling session after each task's review passes. Each task below ends with "leave changes uncommitted, report DONE" instead of literal git commands — the controller handles committing.
- Local dev server note: `site/` is normally served by a Python server rooted at `site/` (`python3 -m http.server 8000`, run from `site/`), which **cannot** serve `../plugins/...` — that path falls outside the server's root and will 403. Testing anything that references `../plugins/` from a page under `site/` requires the **second**, repo-root-rooted server (`python3 -m http.server 8010`, run from the repo root) and loading the page at `http://localhost:8010/site/<page>.html` instead of port 8000.

---

### Task 1: Build the `plugin-review-carousel` Web Component

**Files:**
- Create: `plugins/review-carousel/review-carousel.js`
- Create: `plugins/review-carousel/reviews.data.js`
- Create: `plugins/review-carousel/test.html`

**Interfaces:**
- Consumes: nothing (first task, no prior interfaces).
- Produces:
  - Custom element `<plugin-review-carousel>` (self-registering, guarded against double-registration).
  - Global data contract: `window.PLUGIN_REVIEWS` — an array of objects shaped `{ name: string, avatar: string|null, rating: number (1-5 integer), text: string, url: string, date: string|undefined }`, which `review-carousel.js` reads once in `connectedCallback`.
  - CSS custom properties (all with defaults, overridable by any consuming page): `--plugin-review-accent`, `--plugin-review-card-bg`, `--plugin-review-text-color`, `--plugin-review-text-muted`, `--plugin-review-card-height`, `--plugin-review-card-width`, `--plugin-review-card-width-mobile`, `--plugin-review-radius`, `--plugin-review-gap`, `--plugin-review-speed`, `--plugin-review-font`.

- [ ] **Step 1: Create the fixture data file**

Create `plugins/review-carousel/reviews.data.js` with this exact content (development fixtures — Task 4 replaces this with real Sunlogic reviews):

```js
// Development fixture data — replaced with real Sunlogic reviews in Task 4.
window.PLUGIN_REVIEWS = [
  {
    name: "Amanda Fischer",
    avatar: null,
    rating: 5,
    text: "The team sized our system properly instead of just selling us the biggest package. Install was clean, inverter runs quiet, and the compliance paperwork was sorted within a week.",
    url: "https://www.google.com/maps",
    date: "June 2026",
  },
  {
    name: "Thabo Nkosi",
    avatar: null,
    rating: 5,
    text: "Honest quote, no upselling. They explained the payback period in plain terms and it matched what they promised.",
    url: "https://www.google.com/maps",
    date: "May 2026",
  },
  {
    name: "Deirdre van Wyk",
    avatar: null,
    rating: 4,
    text: "Good communication throughout the project. Only reason it's not five stars is scheduling took a bit longer than the original estimate, but the finished work is solid.",
    url: "https://www.google.com/maps",
    date: "April 2026",
  },
  {
    name: "Riaan Botha",
    avatar: null,
    rating: 5,
    text: "Commercial install for our warehouse. Section 12B deduction was handled correctly by their team and the load profile analysis was genuinely useful, not just a sales pitch.",
    url: "https://www.google.com/maps",
    date: "March 2026",
  },
  {
    name: "Nomvula Dlamini",
    avatar: null,
    rating: 5,
    text: "Electrical work was done to a proper standard. Certificate of Compliance arrived without having to chase anyone for it.",
    url: "https://www.google.com/maps",
    date: "February 2026",
  },
  {
    name: "Chris Adams",
    avatar: null,
    rating: 4,
    text: "Solid installation, monitoring app works well. Would like faster response times on support tickets but the core work is excellent.",
    url: "https://www.google.com/maps",
    date: "January 2026",
  },
];
```

- [ ] **Step 2: Create the component file**

Create `plugins/review-carousel/review-carousel.js` with this exact content:

```js
(function () {
  if (customElements.get('plugin-review-carousel')) return;

  function injectBaseStyles() {
    if (document.getElementById('plugin-review-carousel-styles')) return;
    const style = document.createElement('style');
    style.id = 'plugin-review-carousel-styles';
    style.textContent = `
      plugin-review-carousel { display: contents; }

      :root {
        --plugin-review-accent: #ff8000;
        --plugin-review-card-bg: #ffffff;
        --plugin-review-text-color: #1a1a1a;
        --plugin-review-text-muted: #6b7280;
        --plugin-review-card-height: 260px;
        --plugin-review-card-width: 320px;
        --plugin-review-card-width-mobile: 260px;
        --plugin-review-radius: 1rem;
        --plugin-review-gap: 1.5rem;
        --plugin-review-speed: 40s;
        --plugin-review-font: inherit;
      }

      .plugin-review-viewport {
        overflow: hidden;
        width: 100%;
        font-family: var(--plugin-review-font);
      }

      .plugin-review-track {
        display: flex;
        gap: var(--plugin-review-gap);
        width: max-content;
        animation: plugin-review-scroll var(--plugin-review-speed) linear infinite;
      }

      plugin-review-carousel:hover .plugin-review-track,
      plugin-review-carousel:focus-within .plugin-review-track {
        animation-play-state: paused;
      }

      @keyframes plugin-review-scroll {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }

      .plugin-review-card {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        width: var(--plugin-review-card-width-mobile);
        height: var(--plugin-review-card-height);
        background: var(--plugin-review-card-bg);
        border-radius: var(--plugin-review-radius);
        padding: 1.25rem;
        text-decoration: none;
        color: var(--plugin-review-text-color);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
        position: relative;
        overflow: hidden;
      }

      @media (min-width: 641px) {
        .plugin-review-card {
          width: var(--plugin-review-card-width);
        }
      }

      .plugin-review-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .plugin-review-avatar {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
      }

      .plugin-review-avatar-initials {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.9rem;
        background: color-mix(in srgb, var(--plugin-review-accent) 15%, white);
        color: var(--plugin-review-accent);
      }

      .plugin-review-identity {
        min-width: 0;
      }

      .plugin-review-name {
        font-weight: 700;
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .plugin-review-meta {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.75rem;
        color: var(--plugin-review-text-muted);
      }

      .plugin-review-stars {
        display: flex;
        gap: 0.125rem;
        margin-bottom: 0.625rem;
      }

      .plugin-review-star {
        width: 1rem;
        height: 1rem;
      }

      .plugin-review-text-wrap {
        position: relative;
        flex: 1;
        min-height: 0;
      }

      .plugin-review-text {
        font-size: 0.875rem;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .plugin-review-fade {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2rem;
        background: linear-gradient(to bottom, transparent, var(--plugin-review-card-bg));
        pointer-events: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .plugin-review-track {
          animation: none;
        }
        .plugin-review-viewport {
          overflow-x: auto;
          scroll-snap-type: x mandatory;
        }
        .plugin-review-card {
          scroll-snap-align: start;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const STAR_PATH = 'M12 2.5l2.9 6.06 6.6.87-4.86 4.6 1.27 6.6L12 17.9l-5.91 2.73 1.27-6.6-4.86-4.6 6.6-.87L12 2.5z';

  function starIcon(filled) {
    const fill = filled ? 'var(--plugin-review-accent)' : 'none';
    const stroke = filled ? 'none' : 'var(--plugin-review-text-muted)';
    return `<svg class="plugin-review-star" viewBox="0 0 24 24" fill="${fill}" stroke="${stroke}" stroke-width="1.5" aria-hidden="true"><path d="${STAR_PATH}"/></svg>`;
  }

  function initials(name) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0] ? parts[0][0] : '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderCard(review) {
    const avatarHtml = review.avatar
      ? `<img class="plugin-review-avatar" src="${escapeHtml(review.avatar)}" alt="" loading="lazy"/>`
      : `<div class="plugin-review-avatar-initials">${escapeHtml(initials(review.name))}</div>`;

    const starsHtml = Array.from({ length: 5 }, (_, i) => starIcon(i < review.rating)).join('');

    const dateHtml = review.date
      ? `<span>${escapeHtml(review.date)}</span><span aria-hidden="true">&middot;</span>`
      : '';

    return `
      <a class="plugin-review-card" href="${escapeHtml(review.url)}" target="_blank" rel="noopener">
        <div class="plugin-review-header">
          ${avatarHtml}
          <div class="plugin-review-identity">
            <div class="plugin-review-name">${escapeHtml(review.name)}</div>
            <div class="plugin-review-meta">${dateHtml}<span>Posted on Google</span></div>
          </div>
        </div>
        <div class="plugin-review-stars" role="img" aria-label="Rated ${review.rating} out of 5 stars">${starsHtml}</div>
        <div class="plugin-review-text-wrap">
          <p class="plugin-review-text">${escapeHtml(review.text)}</p>
          <div class="plugin-review-fade"></div>
        </div>
      </a>
    `;
  }

  class PluginReviewCarousel extends HTMLElement {
    connectedCallback() {
      if (this._rendered) return;

      const reviews = window.PLUGIN_REVIEWS;
      if (!Array.isArray(reviews) || reviews.length === 0) {
        console.warn('[plugin-review-carousel] No reviews found — set window.PLUGIN_REVIEWS before this script loads.');
        return;
      }

      this._rendered = true;
      injectBaseStyles();

      const cardsHtml = reviews.map(renderCard).join('');
      this.innerHTML = `
        <div class="plugin-review-viewport">
          <div class="plugin-review-track">
            ${cardsHtml}
            ${cardsHtml}
          </div>
        </div>
      `;
    }
  }

  customElements.define('plugin-review-carousel', PluginReviewCarousel);
})();
```

- [ ] **Step 3: Create the standalone test harness**

Create `plugins/review-carousel/test.html` with this exact content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Review Carousel — Test Harness</title>
<style>
  body { margin: 0; padding: 4rem 2rem; background: #f3f4f6; font-family: system-ui, sans-serif; }
  .wrap { max-width: 1100px; margin: 0 auto; }
</style>
</head>
<body>
<div class="wrap">
  <h1>plugin-review-carousel — test harness</h1>
  <plugin-review-carousel></plugin-review-carousel>
</div>
<script src="reviews.data.js"></script>
<script src="review-carousel.js" defer></script>
</body>
</html>
```

- [ ] **Step 4: Verify in browser**

Start a server rooted at the repo root if one isn't already running: `python3 -m http.server 8010` (run from the repo root `/Users/stephanmarais/Projects/development_projects/build/sunlogic_website`). Open `http://localhost:8010/plugins/review-carousel/test.html` and verify all of the following:

1. Six cards are visible, all exactly the same height, scrolling continuously to the left and looping with no visible jump or blank gap.
2. Hovering the mouse over the carousel pauses the scroll; moving off resumes it.
3. Pressing Tab to focus a card (e.g. via keyboard) pauses the scroll, and the browser's status bar / URL preview shows `https://www.google.com/maps` for that card.
4. Clicking any card opens `https://www.google.com/maps` in a new tab.
5. Compare the shortest review ("Honest quote, no upselling...") against the longest ("The team sized our system properly...") — both cards must be the same height, with the longer text visibly fading out at the bottom edge rather than overflowing.
6. Open Chrome DevTools → Rendering tab → set "Emulate CSS media feature prefers-reduced-motion" to "reduce", then reload. The scroll animation must stop and the row must become manually scrollable left-right (click and drag, or a trackpad swipe).
7. Every card shows an initials badge (e.g. "AF" for Amanda Fischer) since all fixture reviews have `avatar: null` — no broken image icons anywhere.
8. Temporarily comment out the `window.PLUGIN_REVIEWS = [...]` line in `reviews.data.js`, reload the page, and confirm: the carousel area is empty (no error thrown, no broken layout) and the browser console shows the warning `[plugin-review-carousel] No reviews found — set window.PLUGIN_REVIEWS before this script loads.`. Then undo the comment-out so the fixture data is restored.

- [ ] **Step 5: Report**

Leave all three files as created (do not commit — the controlling session commits via `commit-specialist` after task review). Report DONE with a summary of the 8 verification checks from Step 4 and their results.

---

### Task 2: Write the plugin README

**Files:**
- Create: `plugins/review-carousel/README.md`

**Interfaces:**
- Consumes: the exact CSS custom property names and `window.PLUGIN_REVIEWS` shape produced by Task 1 — do not invent different names.
- Produces: `plugins/review-carousel/README.md` (documentation only, no code interface for later tasks to consume).

- [ ] **Step 1: Create the README**

Create `plugins/review-carousel/README.md` with this exact content:

````markdown
# plugin-review-carousel

A portable, self-contained Google-review carousel. No build step, no
framework, no dependency on any host project's Tailwind config or design
tokens.

## Usage

Drop both files into your project (keep them together), then add:

```html
<script src="path/to/reviews.data.js"></script>
<script src="path/to/review-carousel.js" defer></script>
```

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
````

- [ ] **Step 2: Report**

Leave the file as created (do not commit). Report DONE.

---

### Task 3: Wire the carousel into the Sunlogic homepage

**Files:**
- Modify: `site/index.html:23-26` (add plugin script tags)
- Modify: `site/index.html:159-160` (insert new section between "From the Blog" and "Final CTA")

**Interfaces:**
- Consumes: `<plugin-review-carousel>` custom element and `window.PLUGIN_REVIEWS` global contract, both produced by Task 1. Uses the exact file paths `plugins/review-carousel/reviews.data.js` and `plugins/review-carousel/review-carousel.js` created in Task 1 — do not rename or move those files.
- Produces: a live section on `site/index.html` — no new interface for later tasks (Task 4 only edits data content, not this markup).

- [ ] **Step 1: Add the plugin script tags**

In `site/index.html`, find this block (currently lines 23-26):

```html
<script src="shared/tokens.js?v=2"></script>
<script src="shared/icons.js?v=2"></script>
<script src="shared/components.js?v=2" defer></script>
<script src="shared/forms.js?v=2" defer></script>
```

Add two new lines immediately after the `forms.js` line, so the block reads:

```html
<script src="shared/tokens.js?v=2"></script>
<script src="shared/icons.js?v=2"></script>
<script src="shared/components.js?v=2" defer></script>
<script src="shared/forms.js?v=2" defer></script>
<script src="../plugins/review-carousel/reviews.data.js?v=1"></script>
<script src="../plugins/review-carousel/review-carousel.js?v=1" defer></script>
```

The `../` is required: `plugins/` is a sibling of `site/`, not a subfolder of it — the same relative-path pattern `design-system/index.html` already uses to reach `../site/shared/...`.

- [ ] **Step 2: Insert the new section**

In `site/index.html`, find this block (currently lines 151-160):

```html
<!-- From the Blog Section (copy.md — footer-only in nav, but the homepage teaser stays) -->
<sl-section bg="surface-container-lowest" id="from-the-blog">
<div class="mx-auto max-w-6xl">
<sl-section-header eyebrow="From the Blog" heading="From the Blog" subtext="Notes on solar costs, electrical compliance, and getting it right the first time."></sl-section-header>
<div class="text-center py-12 border-2 border-dashed border-surface-variant rounded-2xl">
<p class="font-body-md text-body-md text-on-surface-variant">Posts will appear here once published.</p>
</div>
</div>
</sl-section>
<!-- Final CTA Section (copy.md "Final CTA") -->
```

Insert a new section immediately after the closing `</sl-section>` of "From the Blog" and before the "Final CTA" comment, so the block reads:

```html
<!-- From the Blog Section (copy.md — footer-only in nav, but the homepage teaser stays) -->
<sl-section bg="surface-container-lowest" id="from-the-blog">
<div class="mx-auto max-w-6xl">
<sl-section-header eyebrow="From the Blog" heading="From the Blog" subtext="Notes on solar costs, electrical compliance, and getting it right the first time."></sl-section-header>
<div class="text-center py-12 border-2 border-dashed border-surface-variant rounded-2xl">
<p class="font-body-md text-body-md text-on-surface-variant">Posts will appear here once published.</p>
</div>
</div>
</sl-section>
<!-- Google Reviews Section -->
<sl-section bg="surface-container" id="reviews">
<div class="mx-auto max-w-6xl">
<sl-section-header eyebrow="Reviews" heading="What Customers Say" subtext="Real reviews from Google, not curated testimonials."></sl-section-header>
<plugin-review-carousel></plugin-review-carousel>
</div>
</sl-section>
<!-- Final CTA Section (copy.md "Final CTA") -->
```

- [ ] **Step 3: Verify in browser**

With the repo-root-rooted server running (`python3 -m http.server 8010` from the repo root), open `http://localhost:8010/site/index.html` (not port 8000 — see Global Constraints). Scroll to the new "What Customers Say" section, between "From the Blog" and "Ready to Talk?", and verify:

1. The carousel renders with the same six fixture reviews and behaves identically to the Task 1 test harness (autoscroll, hover-pause, click-through to `https://www.google.com/maps`).
2. The section's heading/eyebrow styling matches the visual weight of the other homepage sections (uses the existing `sl-section-header` component, not custom markup).
3. No console errors on page load.
4. Resize the browser to a mobile width (~375px) and confirm ~1.5 cards are visible, matching the Task 1 verification at that breakpoint.

- [ ] **Step 4: Report**

Leave `site/index.html` modified (do not commit). Report DONE with confirmation of the 4 verification checks.

---

### Task 4: Replace fixture data with real reviews and final QA

**Files:**
- Modify: `plugins/review-carousel/reviews.data.js` (replace fixture content entirely)

**Interfaces:**
- Consumes: the `window.PLUGIN_REVIEWS` shape defined in Task 1 (same object fields: `name`, `avatar`, `rating`, `text`, `url`, `date`).
- Produces: final production data — terminal task, nothing downstream consumes new interfaces from this task.

- [ ] **Step 1: Obtain the real review content**

Ask the user (Stephan) for the actual Sunlogic Google reviews to display: for each one, the reviewer's name, star rating (1-5), the review text, the direct Google review URL, and optionally a photo URL and a display date. Do not proceed to Step 2 with placeholder or invented review content — wait for the real data.

- [ ] **Step 2: Replace the fixture data**

Replace the entire contents of `plugins/review-carousel/reviews.data.js` with the real data the user provided, keeping the exact same structure established in Task 1:

```js
window.PLUGIN_REVIEWS = [
  {
    name: "...",
    avatar: null,
    rating: 5,
    text: "...",
    url: "...",
    date: "...",
  },
  // one object per real review the user supplied
];
```

Remove the `// Development fixture data...` comment from Task 1, since the data is no longer a fixture.

- [ ] **Step 3: Bump cache-busting versions**

In `site/index.html`, change both plugin script tags from `?v=1` to `?v=2` (this file's content changed):

```html
<script src="../plugins/review-carousel/reviews.data.js?v=2"></script>
<script src="../plugins/review-carousel/review-carousel.js?v=2" defer></script>
```

- [ ] **Step 4: Final verification pass**

With the repo-root-rooted server running, open `http://localhost:8010/site/index.html` and `http://localhost:8010/plugins/review-carousel/test.html`, and re-run the full checklist from Task 1 Step 4 (items 1-8) and Task 3 Step 3 (items 1-4) against the real data. Pay particular attention to:

1. Every real review's card height still matches — a much longer or shorter real review than the fixtures could expose a layout issue the fixture data didn't.
2. Every real review's `url` is a genuine, working direct link to that specific Google review (not a generic Google Maps or business-profile URL) — click through each one individually to confirm.
3. If fewer than ~6 real reviews were provided, note in the report that the loop will repeat more noticeably (per the README's guidance) — this is expected, not a bug, but the user should be told.

- [ ] **Step 5: Report**

Leave `plugins/review-carousel/reviews.data.js` and `site/index.html` modified (do not commit). Report DONE with the full verification results, and explicitly flag anything from Step 4 that didn't pass.
