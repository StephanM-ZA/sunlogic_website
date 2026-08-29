# site-daylight: Second Design Design

**Goal:** Build a complete second, visually separate version of the Sunlogic website — same 7 pages, same verbatim copy from `copy/Sunlogic_Site_Copy.md` — in a dark, cinematic, scroll-driven design system reverse-engineered from a reference package (`godaylight-design/`), so it can be evaluated side-by-side against the current `site/` design before any decision is made about which one (if either) goes live.

**Status:** Internal comparison build. Per explicit user decision, this uses the reference package's actual extracted tokens and font files ("build it as is") rather than an inspired-by adaptation, on the basis that Sunlogic (South Africa) and the reference brand operate in different countries. The user will assess IP/branding risk after seeing the build before any live/external use. This spec does not authorize deploying this design publicly, under the Sunlogic name, or presenting it to anyone outside this evaluation — that is a separate decision gated behind the user's post-build assessment.

**Non-negotiable constraint from the user:** zero live ties to the reference site. No hotlinked CDN URLs, no fetches to their domain, nothing that resolves back to it at runtime or build time. Every asset (fonts, images) is self-hosted inside this repo.

---

## 1. Location & Isolation

New top-level folder: **`site-daylight/`**, a sibling of `site/`, `design-system/`, and `plugins/`.

Fully isolated:
- No shared CSS, tokens, or components with `site/shared/*` or `design-system/`.
- No `sl-` prefixed custom elements. All new custom elements use a `dl-` prefix (e.g. `dl-nav-bar`).
- The **only** things pulled in from elsewhere in this repo are `plugins/calculator/` and `plugins/review-carousel/`, reused unmodified through their existing CSS-custom-property theming contracts (Section 7). No plugin source is forked or edited.
- No build step: plain HTML files, Tailwind via the CDN script tag (`cdn.tailwindcss.com`) with a custom inline config (Section 3), vanilla JS. This matches the existing `site/` convention.

## 2. Source Material & What Gets Reused vs. Rebuilt

Source package: `godaylight-design/` (already in this repo, not committed as part of this feature — it is reference material, not shipped code).

| From the package | Disposition |
|---|---|
| Color tokens (`tokens/colors.json`, `references/DESIGN.md` §2) | Used as-is (Section 3) |
| Typography tokens (`tokens/typography.json`, `references/DESIGN.md` §3) | Used as base, extended with responsive `clamp()` sizing and extra in-between sizes needed for a copy-heavy multi-section site (Section 3) — the source only captured desktop-fixed pixel values from static analysis, which would be illegible on mobile if used literally |
| Spacing/radius/shadow/z-index tokens | Used as-is (Section 3) |
| Font files (`fonts/*.woff2`) | Copied into `site-daylight/fonts/`, self-hosted via local `@font-face` — never referenced from the original CDN URLs in `tokens/typography.json`'s `fontFaces` array |
| Component patterns (`references/COMPONENTS.md`) | Used as a structural reference for shape/spacing only. Rebuilt from scratch as our own markup and CSS — none of the extracted HTML/class names (e.g. `.usp-item`, `.fb-text-line`) are copied verbatim, since those are the reference site's actual implementation, not a licensable pattern |
| Scroll journey screenshots (`screens/scroll/*.png`) | Used only as a *visual reference for motion timing/character* while building Section 5's animation system. Not embedded or shipped as assets in `site-daylight/` |
| Video backgrounds (Mux URLs in `references/ANIMATIONS.md`) | **Not used at all.** No `<video src>` ever points at a `stream.mux.com` URL or any `godaylight.com` URL. Every "media background" slot in this build uses a static local image (Section 6) |
| Canvas particle effects | The source only detected *that* canvas elements exist (`<canvas class="h-full w-full">`), not their draw logic. Recreated from scratch as an original ambient particle effect (Section 5.3) |

## 3. Design Tokens

All tokens below are copied verbatim from `godaylight-design/tokens/*.json` and `references/DESIGN.md`, except where marked **[extended]**.

### 3.1 Colors

```
background:    #0a0804   (page background)
surface:       #4c2806   (cards, panels)
text-primary:  #fff7e9   (headings, body)
text-muted:    #514e4a   (captions, placeholders)
border:        #1c1c1c   (dividers, card borders)
accent:        #c8b2ff   (CTAs, links, focus rings — the only pop of color)
danger:        #f66f00
warning:       #dacab6
info:          #321f61
```

**Rule carried over from the source system: no gradients anywhere, solid colors only. No blur/backdrop-blur effects. No new colors outside this palette without extending the token file first.**

### 3.2 Typography

Font files (self-hosted from `site-daylight/fonts/`):
- `aeonikPro-Regular.woff2` (400), `aeonikPro-500.woff2` (500) — body/UI text
- `featureDeck-Regular.woff2` (400, used at weight 700 via `font-weight` override since no bold file exists in the source — **[extended]**: browsers will synthetically bold if a 700 file isn't present; if this looks poor in the browser check (Section 8), fall back to featureDeck at its native weight with a slightly larger size instead of relying on synthetic bold) — display/headings
- `socialMono-Regular.woff2` (400) — code/mono accents (labels, eyebrows, stat numbers)

Base type scale, **[extended]** with `clamp()` for responsiveness (source values were desktop-only static extractions):

| Role | Family | Size | Weight | Use |
|---|---|---|---|---|
| display-1 | featureDeck | `clamp(2.5rem, 6vw, 7.5rem)` | 700 | Hero headline only, one per page |
| display-2 | featureDeck | `clamp(2rem, 4.5vw, 6.25rem)` | 700 | Major section headline |
| heading-3 | featureDeck | `clamp(1.5rem, 2.5vw, 2.5rem)` | 700 | Sub-section / card-group headline **[extended down from the source's 85px — that size is only usable for a single full-viewport headline, not repeated sub-sections on a content-dense site]** |
| heading-4 | featureDeck | 1.25rem (20px) | 600 | Card titles, FAQ questions **[extended, not in source]** |
| body | aeonikPro | 1rem (16px) | 400 | Body copy **[extended up from the source's 12px — that size is illegible for paragraph text; 12px is kept for caption/label use instead]** |
| caption | aeonikPro | 0.75rem (12px) | 400 | Captions, placeholders, secondary info |
| label | socialMono | 0.6875rem (11px), uppercase, letter-spacing 0.08em | 400 | Eyebrows, badges, stat labels |

Rules carried over: max 3-4 distinct sizes per screen, line-height 1.5 for body / 1.2 for headings, use color/opacity for secondary hierarchy rather than more sizes.

### 3.3 Spacing, Radius, Shadow, Z-index

- **Base grid:** 4px. Every margin/padding/gap is a multiple of 4.
- **Section vertical padding [extended, clean multiples of 4]:** mobile `64px`, desktop `128px` (source values like `150px`/`59.9999px` were themselves not clean 4px multiples — this build holds the grid strictly).
- **Border radius scale:** `4px, 6px, 8px, 10px, 12px, 16px` — default `8px`.
- **Shadows:**
  - Floating (dropdowns, popovers): `0 2px 20px rgba(0,0,0,0.1)`
  - Overlay (modals): `0 8px 32px rgba(0,0,0,0.24)`
- **Z-index scale:** `0, 1, 2, 3, 10, 100, 101, 111, 1000, 1001, 9999, 10000` — never invent a value outside this list.
- **Breakpoints:** `sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px` (source listed both rem and px versions for some breakpoints — standardized to px here to match Tailwind's own defaults, since we're using Tailwind CDN).
- **Max content width:** `1000px`, centered.

### 3.4 Tailwind CDN Config

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          background: '#0a0804',
          surface: '#4c2806',
          'text-primary': '#fff7e9',
          'text-muted': '#514e4a',
          border: '#1c1c1c',
          accent: '#c8b2ff',
          danger: '#f66f00',
          warning: '#dacab6',
          info: '#321f61',
        },
        fontFamily: {
          display: ['featureDeck', 'sans-serif'],
          body: ['aeonikPro', 'sans-serif'],
          mono: ['socialMono', 'monospace'],
        },
        borderRadius: {
          sm: '4px', md: '6px', lg: '8px', xl: '10px', '2xl': '12px', '3xl': '16px',
        },
      },
    },
  };
</script>
```

## 4. Component Library (`site-daylight/shared/`)

Mirrors the shape of `site/shared/components.js` but fully separate, `dl`-prefixed, no shared code with it.

| File | Contents |
|---|---|
| `shared/tokens.css` | `@font-face` declarations + CSS custom properties for the tokens in Section 3 |
| `shared/icons.js` | Inline-SVG icon registry, same open-source (MIT-licensed heroicons-style) icon set already used in `site/shared/icons.js`, recreated as a standalone file — icons themselves are not proprietary to either site, so reusing the same open icon shapes is not a "tie" to either codebase, just shared use of a public icon set |
| `shared/components.js` | Web Components below |

Components (Web Components, no build step, defined via `customElements.define`):

- **`dl-nav-bar`** — fixed-position top nav, transparent-to-solid on scroll, links to the 7 pages, CTA button.
- **`dl-footer`** — dark footer matching the reference's footer grid shape (link columns + brand block), Sunlogic's real contact/legal info (not the reference brand's).
- **`dl-section`** — section wrapper handling the 4px-grid vertical padding (Section 3.3) and max-width container.
- **`dl-reveal`** — wraps a block of content (typically a heading or a line of text) and animates it in on scroll using the pattern in Section 5.1. This is the component that recreates the source's signature "mask and slide up" text effect.
- **`dl-card`** — surface-colored panel, `border`, `8px` radius, used for feature/benefit cards, FAQ items, and step cards.
- **`dl-badge`** — small pill/label component for eyebrows and tags (`label` type scale, Section 3.2).
- **`dl-button`** — `variant="primary"` (solid accent bg) and `variant="ghost"` (transparent, bordered), per the source's button spec (Section 3, "Build a Button").
- **`dl-field`** — form input/label wrapper for the contact form, dark input styling per the source's Input component spec.
- **`dl-media-bg`** — the "background media" slot described in Section 6: renders a static `<img>` today, structured (via a `data-video` attribute reserved but unused) so a later task can add a real self-hosted `<video>` without restructuring markup.

## 5. Motion System

All motion is original code, built to match the *timing character* documented in `references/ANIMATIONS.md`, not copied from it.

### 5.1 Scroll-reveal (text mask/slide)

Implemented with `IntersectionObserver` + CSS transitions (no scroll-position polling, no external animation library):

```css
.dl-reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.dl-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .dl-reveal { transition: none; opacity: 1; transform: none; }
}
```

`dl-reveal` elements start with `.dl-reveal` applied; an `IntersectionObserver` (threshold `0.2`) adds `.is-visible` the first time each element enters the viewport, then unobserves it (reveal-once, not on every scroll pass).

### 5.2 Durations & easing

Only these values are used anywhere in `site-daylight/`, matching the source's documented scale:
- Durations: `150ms, 200ms, 300ms, 500ms, 1000ms`
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (default), `ease-out` (simple fades/hovers)

### 5.3 Ambient canvas effect

One original, small (< 100 lines) canvas effect used behind hero sections: a sparse field of soft, slowly-drifting dots (a "light particles" effect — a look, not an asset, and not derived from any specific site's code), drawn via `requestAnimationFrame`, opacity capped low (≤ 0.15) so it never competes with text. Disabled entirely (canvas not drawn, falls back to the flat `background` color) when `prefers-reduced-motion: reduce` is set.

## 6. Media Strategy (No Hotlinking)

- Every media background slot (`dl-media-bg`) renders a **static local image** — either a screenshot already in `godaylight-design/screens/` used *only as a same-session visual placeholder* (never referenced by a `godaylight-design/...` path from inside `site-daylight/` — it must be copied into `site-daylight/images/` first, so the folder stays self-contained and has zero path dependency back to the reference package), or, preferably, real Sunlogic photography if available.
- No `<video>` element in this build points at any external URL. If a `data-video` attribute is added later, it must point to a file inside `site-daylight/`.
- Bracket-placeholder convention (already established elsewhere in this project) applies to any image slot with no real Sunlogic asset yet: `[PLACEHOLDER: real photo of <subject> needed]`, visible as a labeled placeholder box, never a fabricated stock-style image passed off as real.

## 7. Plugin Reuse (Calculator & Review Carousel)

Both plugins are used unmodified, retheming happens purely by overriding their documented CSS custom properties at the point of use in `site-daylight/`:

```css
plugin-calculator {
  --plugin-calc-accent: #c8b2ff;
  --plugin-calc-bg: #4c2806;
  --plugin-calc-text-color: #fff7e9;
  --plugin-calc-text-muted: #514e4a;
  --plugin-calc-radius: 8px;
  --plugin-calc-font: 'aeonikPro', sans-serif;
}

plugin-review-carousel {
  --plugin-review-accent: #c8b2ff;
  --plugin-review-card-bg: #4c2806;
  --plugin-review-text-color: #fff7e9;
  --plugin-review-text-muted: #514e4a;
  --plugin-review-card-height: 260px;
  --plugin-review-card-width: 320px;
  --plugin-review-card-width-mobile: 260px;
  --plugin-review-radius: 8px;
  --plugin-review-gap: 1.5rem;
  --plugin-review-speed: 40s;
  --plugin-review-font: 'aeonikPro', sans-serif;
}
```

`site-daylight/*.html` files reference the plugin scripts directly from `../plugins/calculator/*.js` and `../plugins/review-carousel/*.js` (relative path within this repo, not a copy) — this is an intra-repo reference, not a hotlink, and matches how `site/` already consumes them.

## 8. Pages & Content Mapping

Same 7 pages as `site/`, same verbatim source copy (`copy/Sunlogic_Site_Copy.md`), same section content and order already established on the live site — this is a visual reskin of existing, already-copy-verified content, not a new content pass:

| Page | Content source | Notes |
|---|---|---|
| `site-daylight/index.html` | `site/index.html`'s sections | Includes `plugin-review-carousel` (Section 7) |
| `site-daylight/solar.html` | `site/solar.html`'s sections | Includes both `plugin-calculator` instances (residential + SME), same placements as the copy doc's marked "CALCULATOR BLOCK" positions |
| `site-daylight/electrical.html` | `site/electrical.html`'s sections | |
| `site-daylight/energy-management.html` | `site/energy-management.html`'s sections | |
| `site-daylight/contact.html` | `site/contact.html`'s sections | Own dark-themed copy of the lead form (Section 4, `dl-field`) |
| `site-daylight/blog.html` | `site/blog.html`'s sections | Same honest "not written yet" post-list state |
| `site-daylight/legal.html` | `site/legal.html`'s sections | Content "moves across as-is" per the copy doc, same as the live site |

Page shape (adapted per page, not padded to match): hero (`dl-reveal`-wrapped `display-1` headline over a `dl-media-bg`) → alternating `dl-section` content blocks per that page's actual copy → footer. No page gets sections invented just to match the reference site's section count.

Every bracket-placeholder already present in the copy doc/live site (trust-strip numbers, Proof section project cards, Meet the Team photos, HotBot/SolarBot terms contradiction, etc.) carries over unchanged — this build doesn't resolve or invent content for any of them.

## 9. Global Constraints

- **No hotlinking**: no `godaylight.com` URL, no `stream.mux.com` URL, no reference to any path inside `godaylight-design/` from a committed file in `site-daylight/`. All fonts and images are copied into `site-daylight/` first.
- **Verbatim copy only** — no invented headings, eyebrows, badges, or CTA text; every string traces back to `copy/Sunlogic_Site_Copy.md` or the already-verified live pages.
- **No build step** — plain HTML/CSS/JS + Tailwind CDN, matching `site/`'s existing convention.
- **`dl-` prefix** for every new custom element; zero shared files with `site/shared/*` or `design-system/`.
- **Plugins reused unmodified** — theming only via the documented CSS custom properties in Section 7, no forked plugin code.
- **4px spacing grid, token colors only, token shadow/radius/z-index/breakpoint values only** — no arbitrary values anywhere in `site-daylight/`.
- **`prefers-reduced-motion: reduce` must disable all scroll-reveal transitions and the canvas particle effect.**
- Work happens directly on `main`, no feature branch/worktree — matches this repo's standing convention.
- All commits route through `commit-specialist`, never raw `git commit`.
- This spec authorizes building and locally verifying `site-daylight/` only — it does not authorize deploying it, linking to it from the live site, or presenting it externally as Sunlogic's brand. That is a separate decision after the user's post-build assessment (see Status, above).

## 10. Verification (done manually after build, not a task)

- Serve locally (`python3 -m http.server 8010` from repo root) and load every page in `site-daylight/`.
- No console errors on any page.
- Toggling OS-level reduced-motion actually disables `.dl-reveal` transitions and the canvas effect.
- Mobile viewport (375px) and desktop (1440px) both hold up — no overflow, type scale remains legible at the small end of its `clamp()`.
- Both plugins render with the daylight theme applied (dark surface, purple accent) and function identically to their `site/` behavior.
- `grep -rn "godaylight\.com\|stream\.mux\.com" site-daylight/` returns nothing.
