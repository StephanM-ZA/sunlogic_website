# site-daylight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `site-daylight/`, a complete, visually separate second version of the Sunlogic website (7 pages, same verbatim copy as `site/`) in a dark cinematic design system, fully isolated from the existing `site/`, `design-system/`, and `plugins/` code.

**Architecture:** No build step — plain HTML files, Tailwind via CDN with a custom token-mapped config, vanilla-JS light-DOM Web Components (`dl-` prefix) that set their own `innerHTML` using Tailwind utility classes, exactly mirroring how `site/shared/components.js` already works for the existing site but with zero shared code. `plugins/calculator/` and `plugins/review-carousel/` are reused unmodified and retheme via their existing CSS custom-property contracts.

**Tech Stack:** HTML5, Tailwind CDN (`cdn.tailwindcss.com`), vanilla JS (Custom Elements v1, IntersectionObserver, Canvas 2D), self-hosted `.woff2` fonts. No npm, no bundler, no framework.

**Spec:** `docs/superpowers/specs/2026-08-29-site-daylight-design.md`

## Global Constraints

- **No hotlinking**: no `godaylight.com` URL, no `stream.mux.com` URL, no path reference into `godaylight-design/` from any committed file in `site-daylight/`. Fonts and images are copied into `site-daylight/` first.
- **Verbatim copy only** — no invented headings, eyebrows, badges, or CTA text. Every string in a page task is transcribed exactly from the corresponding live page in `site/` (already verbatim-verified against `copy/Sunlogic_Site_Copy.md`) — read the source file, copy its text nodes exactly, do not paraphrase, reorder, shorten, or add/remove sections.
- **No build step** — plain HTML/CSS/JS + Tailwind CDN.
- **`dl-` prefix** for every new custom element. Zero shared files with `site/shared/*` or `design-system/`.
- **Plugins reused unmodified** — theming only via the CSS custom properties documented in Task 5, never by editing plugin source.
- **4px spacing grid, token colors only** (`#0a0804` background, `#4c2806` surface, `#fff7e9` text-primary, `#514e4a` text-muted, `#1c1c1c` border, `#c8b2ff` accent, `#f66f00` danger, `#dacab6` warning, `#321f61` info) — no arbitrary hex values anywhere.
- **Radius scale**: `4px, 6px, 8px, 10px, 12px, 16px` only. **Shadow tokens**: floating `0 2px 20px rgba(0,0,0,0.1)`, overlay `0 8px 32px rgba(0,0,0,0.24)`. **Z-index scale**: `0,1,2,3,10,100,101,111,1000,1001,9999,10000` only.
- **No gradients, no blur/backdrop-blur effects, no zebra striping** anywhere in `site-daylight/`.
- **`prefers-reduced-motion: reduce` must disable all scroll-reveal transitions and the canvas particle effect.**
- Work happens directly on `main`, no feature branch/worktree.
- All commits route through `commit-specialist`, never raw `git commit`.
- This plan builds and locally verifies `site-daylight/` only — it does not deploy it, link it from the live site, or present it externally as Sunlogic's brand.

---

## File Structure

```
site-daylight/
  fonts/
    aeonikPro-Regular.woff2
    aeonikPro-500.woff2
    featureDeck-Regular.woff2
    socialMono-Regular.woff2
  images/
    (placeholder images copied in per-page as needed, Task 6+)
  shared/
    tokens.css          — @font-face + CSS custom properties + base body style + motion CSS (Tasks 1, 4)
    tailwind-config.js  — tailwind.config object (Task 1)
    icons.js            — window.dlIcons SVG registry (Task 2)
    components.js       — all dl- Web Components (Tasks 2-5)
    motion.js           — dlInitParticles() canvas effect (Task 4)
    plugin-theme.css     — CSS custom-property overrides for the two reused plugins (Task 5)
    test-tokens.html    — token verification harness (Task 1)
    test-components.html — component verification harness (Tasks 2-4)
    test-plugins.html   — plugin retheme verification harness (Task 5)
  index.html             (Task 6)
  solar.html             (Task 7)
  electrical.html        (Task 8)
  energy-management.html (Task 9)
  contact.html           (Task 10)
  blog.html              (Task 11)
  legal.html             (Task 12)
```

## Component Usage Guide (exact usage across all pages)

This table resolves, once, how every component and motion wrapper gets used — every page task (6-12) follows it exactly rather than improvising per page.

| Component | Used for | Motion wrapper |
|---|---|---|
| `dl-section` | Every content section's background+padding+max-width wrapper | none itself — children inside it are wrapped individually per the rows below |
| `dl-reveal-lines` | Hero `<h1>` only, and each section's own `display-2`/`heading-3` headline (one per section, at most) | is itself the motion — masked slide-up from below, no opacity fade (Task 4) |
| `dl-reveal` | Everything else that should animate in on scroll: subheads, body paragraphs, standalone CTA buttons, card grids (wrap the grid/list container once, not each card individually), callouts | is itself the motion — fade + translateY(40px→0) (Task 4) |
| `dl-card` | Feature/benefit cards, FAQ question/answer pairs, numbered list items (blog), product cards (HotBot/SolarBot) | no motion of its own — the grid/list it sits inside is wrapped in one parent `dl-reveal` |
| `dl-callout` | Any highlighted aside equivalent to the live site's `sl-callout` — the "Why Now" note (solar), the cancellation-terms-contradiction note (energy management), and any other bracketed/highlighted callout block found while transcribing a page's copy | wrapped in `dl-reveal` (standard reveal, not the headline treatment — callouts are asides, not headline moments) |
| `dl-badge` | Eyebrow labels, category chips, product tags | no independent motion — inherits whichever `dl-reveal`/`dl-reveal-lines` its parent block is wrapped in |
| `dl-button` | Every CTA, `variant="primary"` or `variant="ghost"` | wrapped in `dl-reveal` when it's part of a hero or section intro; left unwrapped when it's inside `dl-nav-bar` or `dl-footer` |
| `dl-field` | Every contact-form input | never wrapped in reveal motion — a form must be immediately usable, not gated behind a scroll-triggered animation |
| `dl-media-bg` | Hero and section background images | never wrapped in reveal motion — it's a background layer, always visible immediately |
| `dl-nav-bar` / `dl-footer` | Once per page, page chrome | never wrapped in reveal motion |
| canvas (`dlInitParticles`) | Hero sections only, one `<canvas class="dl-particles">` per hero, layered between `dl-media-bg` and the text content | governs its own motion internally, gated by `prefers-reduced-motion` inside `dlInitParticles` itself (Task 4) |

## Shared Page Boilerplate (used by Tasks 6-12)

Every page's `<head>` follows this exact pattern (paths are relative to the page file, all in `site-daylight/`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>PAGE_TITLE</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="shared/tailwind-config.js"></script>
<link rel="stylesheet" href="shared/tokens.css"/>
<link rel="stylesheet" href="shared/plugin-theme.css"/>
<script src="shared/icons.js" defer></script>
<script src="shared/components.js" defer></script>
<script src="shared/motion.js" defer></script>
</head>
<body class="bg-background text-text-primary font-body antialiased overflow-x-hidden">
<dl-nav-bar active="PAGE_KEY"></dl-nav-bar>
<!-- page sections here -->
<dl-footer></dl-footer>
</body>
</html>
```

`PAGE_KEY` values: `home`, `solar`, `electrical`, `energy`, `blog`, `contact` (matches `dl-nav-bar`'s `active` attribute check from Task 3). `legal.html` uses `active="none"`.

Every page task also runs, as its final verification step:
```bash
grep -rn "godaylight\.com\|stream\.mux\.com\|godaylight-design/" site-daylight/PAGE.html
```
Expected: no output (empty match). This directly enforces the plan's no-hotlinking constraint.

---

### Task 1: Fonts, Design Tokens, Tailwind Config

**Files:**
- Create: `site-daylight/fonts/aeonikPro-Regular.woff2` (copy of `godaylight-design/fonts/aeonikPro-Regular.woff2`)
- Create: `site-daylight/fonts/aeonikPro-500.woff2` (copy of `godaylight-design/fonts/aeonikPro-500.woff2`)
- Create: `site-daylight/fonts/featureDeck-Regular.woff2` (copy of `godaylight-design/fonts/featureDeck-Regular.woff2`)
- Create: `site-daylight/fonts/socialMono-Regular.woff2` (copy of `godaylight-design/fonts/socialMono-Regular.woff2`)
- Create: `site-daylight/shared/tokens.css`
- Create: `site-daylight/shared/tailwind-config.js`
- Test: `site-daylight/shared/test-tokens.html`

**Interfaces:**
- Produces: CSS custom properties `--dl-color-background`, `--dl-color-surface`, `--dl-color-text-primary`, `--dl-color-text-muted`, `--dl-color-border`, `--dl-color-accent`, `--dl-color-danger`, `--dl-color-warning`, `--dl-color-info`, `--dl-radius-sm|md|lg|xl|2xl|3xl`, `--dl-shadow-floating`, `--dl-shadow-overlay`, `--dl-space-section-mobile`, `--dl-space-section-desktop` (all consumed by Tasks 2-5 and every page task). Produces the global `tailwind.config` object with Tailwind color names `background`, `surface`, `text-primary`, `text-muted`, `border`, `accent`, `danger`, `warning`, `info` and font families `display`, `body`, `mono` (consumed by every later task's Tailwind classes).

- [ ] **Step 1: Copy the four font files**

```bash
mkdir -p site-daylight/fonts
cp godaylight-design/fonts/aeonikPro-Regular.woff2 site-daylight/fonts/
cp godaylight-design/fonts/aeonikPro-500.woff2 site-daylight/fonts/
cp godaylight-design/fonts/featureDeck-Regular.woff2 site-daylight/fonts/
cp godaylight-design/fonts/socialMono-Regular.woff2 site-daylight/fonts/
```

- [ ] **Step 2: Write the test harness first**

Create `site-daylight/shared/test-tokens.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Token Test</title>
<link rel="stylesheet" href="tokens.css"/>
</head>
<body>
<div id="results" style="font-family: monospace; padding: 24px;"></div>
<script>
function assertEqual(actual, expected, label) {
  const pass = actual === expected;
  const el = document.createElement('div');
  el.textContent = (pass ? 'PASS: ' : 'FAIL: ') + label + ' (got "' + actual + '", expected "' + expected + '")';
  el.style.color = pass ? 'green' : 'red';
  document.getElementById('results').appendChild(el);
}
const style = getComputedStyle(document.documentElement);
assertEqual(style.getPropertyValue('--dl-color-background').trim(), '#0a0804', '--dl-color-background');
assertEqual(style.getPropertyValue('--dl-color-surface').trim(), '#4c2806', '--dl-color-surface');
assertEqual(style.getPropertyValue('--dl-color-text-primary').trim(), '#fff7e9', '--dl-color-text-primary');
assertEqual(style.getPropertyValue('--dl-color-accent').trim(), '#c8b2ff', '--dl-color-accent');
assertEqual(style.getPropertyValue('--dl-radius-lg').trim(), '8px', '--dl-radius-lg');
assertEqual(getComputedStyle(document.body).backgroundColor, 'rgb(10, 8, 4)', 'body background-color applied');
</script>
</body>
</html>
```

- [ ] **Step 3: Confirm the test fails (tokens.css doesn't exist yet)**

Run: `node --check site-daylight/shared/test-tokens.html` — this will error because it's not JS; instead confirm by inspection that `tokens.css` referenced at Step 2 does not yet exist:
Run: `ls site-daylight/shared/tokens.css`
Expected: `No such file or directory`

- [ ] **Step 4: Write `site-daylight/shared/tokens.css`**

```css
@font-face {
  font-family: 'aeonikPro';
  src: url('../fonts/aeonikPro-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'aeonikPro';
  src: url('../fonts/aeonikPro-500.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: 'featureDeck';
  src: url('../fonts/featureDeck-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'socialMono';
  src: url('../fonts/socialMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}

:root {
  --dl-color-background: #0a0804;
  --dl-color-surface: #4c2806;
  --dl-color-text-primary: #fff7e9;
  --dl-color-text-muted: #514e4a;
  --dl-color-border: #1c1c1c;
  --dl-color-accent: #c8b2ff;
  --dl-color-danger: #f66f00;
  --dl-color-warning: #dacab6;
  --dl-color-info: #321f61;

  --dl-radius-sm: 4px;
  --dl-radius-md: 6px;
  --dl-radius-lg: 8px;
  --dl-radius-xl: 10px;
  --dl-radius-2xl: 12px;
  --dl-radius-3xl: 16px;

  --dl-shadow-floating: 0 2px 20px rgba(0, 0, 0, 0.1);
  --dl-shadow-overlay: 0 8px 32px rgba(0, 0, 0, 0.24);

  --dl-space-section-mobile: 64px;
  --dl-space-section-desktop: 128px;
}

body {
  background: var(--dl-color-background);
  color: var(--dl-color-text-primary);
  font-family: 'aeonikPro', sans-serif;
}
```

- [ ] **Step 5: Write `site-daylight/shared/tailwind-config.js`**

```js
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
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
        '3xl': '16px',
      },
    },
  },
};
```

- [ ] **Step 6: Verify**

Run: `node --check site-daylight/shared/tailwind-config.js`
Expected: no output (valid JS — `tailwind` is undefined at check-time but `node --check` only parses syntax, it doesn't execute).

Run: `ls -la site-daylight/fonts/`
Expected: 4 `.woff2` files listed.

Self-review `tokens.css`: confirm every hex value matches the Global Constraints list exactly, character for character.

Note for the controller: live-browser verification of `test-tokens.html` (confirming all PASS lines render green, fonts actually load) happens once, across the whole site, per the plan's final review — not required as part of this task's automated check.

- [ ] **Step 7: Commit**

```bash
git add site-daylight/fonts/ site-daylight/shared/tokens.css site-daylight/shared/tailwind-config.js site-daylight/shared/test-tokens.html
git commit -m "feat(site-daylight): add fonts, design tokens, and Tailwind config"
```

---

### Task 2: Icons and Core Components

**Files:**
- Create: `site-daylight/shared/icons.js`
- Create: `site-daylight/shared/components.js`
- Test: `site-daylight/shared/test-components.html`

**Interfaces:**
- Consumes: Tailwind color/font tokens from Task 1's `tailwind-config.js` (classes `bg-background`, `bg-surface`, `text-text-primary`, `text-text-muted`, `border-border`, `bg-accent`, `font-display`, `font-body`, `font-mono`).
- Produces: `window.dlIcons` (object keyed by icon name, each value an SVG markup string). Produces custom elements `<dl-section bg="background|surface">`, `<dl-card>`, `<dl-badge>`, `<dl-button variant="primary|ghost" href="..." icon="...">`, `<dl-field label="..." type="..." name="..." required>`, `<dl-callout icon="...">` — all consumed by every later task. See the Component Usage Guide above for exactly when each is used.

- [ ] **Step 1: Write `site-daylight/shared/icons.js`**

Read `site/shared/icons.js` first. Copy the exact SVG markup (byte-identical `<path>` data — these are an existing open icon set already used on the live site, not proprietary to any design package) for these keys: `arrow-right`, `chevron-down`, `check-circle`, `x-mark`, `bars-3`, `chat-bubble-left-right`, `chart-bar`, `shield-check`, `map-pin`, `cog-6-tooth`. Re-expose them under a new global to avoid any naming collision with `site/shared/icons.js`:

```js
window.dlIcons = {
  'arrow-right': /* exact SVG string copied from site/shared/icons.js's arrow-right entry */,
  'chevron-down': /* exact SVG string copied from site/shared/icons.js's chevron-down entry */,
  'check-circle': /* exact SVG string copied from site/shared/icons.js's check-circle entry */,
  'x-mark': /* exact SVG string copied from site/shared/icons.js's x-mark entry */,
  'bars-3': /* exact SVG string copied from site/shared/icons.js's bars-3 entry */,
  'chat-bubble-left-right': /* exact SVG string copied from site/shared/icons.js's chat-bubble-left-right entry */,
  'chart-bar': /* exact SVG string copied from site/shared/icons.js's chart-bar entry */,
  'shield-check': /* exact SVG string copied from site/shared/icons.js's shield-check entry */,
  'map-pin': /* exact SVG string copied from site/shared/icons.js's map-pin entry */,
  'cog-6-tooth': /* exact SVG string copied from site/shared/icons.js's cog-6-tooth entry */,
};
```

Each SVG string must be a complete `<svg>...</svg>` element (copy exactly as it appears in the source file, including its `viewBox`, `stroke`, and `<path>` attributes — only the surrounding registry object/key names differ).

- [ ] **Step 2: Write `site-daylight/shared/components.js` (first five components)**

```js
class DlSection extends HTMLElement {
  connectedCallback() {
    const bg = this.getAttribute('bg') || 'background';
    const bgClass = bg === 'surface' ? 'bg-surface' : 'bg-background';
    const content = this.innerHTML;
    this.innerHTML = `<div class="${bgClass} py-16 md:py-32 px-6"><div class="max-w-[1000px] mx-auto">${content}</div></div>`;
  }
}
customElements.define('dl-section', DlSection);

class DlCard extends HTMLElement {
  connectedCallback() {
    const content = this.innerHTML;
    this.innerHTML = `<div class="bg-surface border border-border rounded-lg p-4">${content}</div>`;
  }
}
customElements.define('dl-card', DlCard);

class DlBadge extends HTMLElement {
  connectedCallback() {
    const content = this.innerHTML;
    this.innerHTML = `<span class="inline-flex items-center px-2 py-1 rounded-3xl font-mono text-[11px] uppercase tracking-[0.08em] bg-surface text-text-muted">${content}</span>`;
  }
}
customElements.define('dl-badge', DlBadge);

class DlButton extends HTMLElement {
  connectedCallback() {
    const variant = this.getAttribute('variant') || 'primary';
    const href = this.getAttribute('href');
    const icon = this.getAttribute('icon');
    const label = this.innerHTML;
    const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-body font-medium transition-opacity duration-150';
    const styles = variant === 'primary'
      ? base + ' bg-accent text-text-primary hover:opacity-90'
      : base + ' bg-transparent border border-border text-text-primary hover:opacity-90';
    const iconSvg = (icon && window.dlIcons && window.dlIcons[icon]) ? window.dlIcons[icon] : '';
    const tag = href ? 'a' : 'button';
    const hrefAttr = href ? ' href="' + href + '"' : '';
    this.innerHTML = '<' + tag + hrefAttr + ' class="' + styles + '">' + label + iconSvg + '</' + tag + '>';
  }
}
customElements.define('dl-button', DlButton);

class DlField extends HTMLElement {
  connectedCallback() {
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const name = this.getAttribute('name') || '';
    const required = this.hasAttribute('required') ? 'required' : '';
    const id = 'dl-field-' + name;
    this.innerHTML =
      '<label for="' + id + '" class="block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted mb-2">' + label + '</label>' +
      '<input id="' + id + '" name="' + name + '" type="' + type + '" ' + required + ' class="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent" />';
  }
}
customElements.define('dl-field', DlField);

class DlCallout extends HTMLElement {
  connectedCallback() {
    const icon = this.getAttribute('icon');
    const iconSvg = (icon && window.dlIcons && window.dlIcons[icon]) ? window.dlIcons[icon] : '';
    const content = this.innerHTML;
    this.innerHTML =
      '<div class="flex gap-4 items-start bg-surface border-l-4 border-accent rounded-lg p-4">' +
      (iconSvg ? '<span class="text-accent shrink-0 mt-1">' + iconSvg + '</span>' : '') +
      '<div class="font-body text-sm text-text-primary leading-[1.5]">' + content + '</div>' +
      '</div>';
  }
}
customElements.define('dl-callout', DlCallout);
```

- [ ] **Step 3: Write the test harness**

Create `site-daylight/shared/test-components.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Component Test</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="tailwind-config.js"></script>
<link rel="stylesheet" href="tokens.css"/>
<script src="icons.js" defer></script>
<script src="components.js" defer></script>
</head>
<body class="bg-background text-text-primary font-body p-8 space-y-8">
<dl-section bg="surface">
  <dl-badge>New</dl-badge>
  <dl-card><p>Card content test</p></dl-card>
  <dl-button variant="primary" icon="arrow-right">Primary Button</dl-button>
  <dl-button variant="ghost">Ghost Button</dl-button>
  <form>
    <dl-field label="Full Name" name="name" required></dl-field>
  </form>
  <dl-callout icon="chart-bar">Callout test content</dl-callout>
</dl-section>
</body>
</html>
```

- [ ] **Step 4: Verify**

Run: `node --check site-daylight/shared/icons.js`
Expected: no output.

Run: `node --check site-daylight/shared/components.js`
Expected: no output.

Self-review: confirm every class name used (`bg-surface`, `bg-accent`, `text-text-primary`, etc.) matches a token name defined in Task 1's `tailwind-config.js` — no invented Tailwind color names.

- [ ] **Step 5: Commit**

```bash
git add site-daylight/shared/icons.js site-daylight/shared/components.js site-daylight/shared/test-components.html
git commit -m "feat(site-daylight): add icon registry and core components"
```

---

### Task 3: Navigation and Footer

**Files:**
- Modify: `site-daylight/shared/components.js` (append)
- Modify: `site-daylight/shared/test-components.html` (append)

**Interfaces:**
- Consumes: `dl-button` from Task 2 (nav CTA reuses it).
- Produces: `<dl-nav-bar active="home|solar|electrical|energy|blog|contact|none">`, `<dl-footer>` — consumed by every page task (6-12).

- [ ] **Step 1: Append to `site-daylight/shared/components.js`**

```js
class DlNavBar extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || 'none';
    const links = [
      { href: 'index.html', key: 'home', label: 'Home' },
      { href: 'solar.html', key: 'solar', label: 'Solar' },
      { href: 'electrical.html', key: 'electrical', label: 'Electrical' },
      { href: 'energy-management.html', key: 'energy', label: 'Energy Management' },
      { href: 'blog.html', key: 'blog', label: 'Worth Knowing' },
    ];
    const linksHtml = links.map(function(l) {
      const colorClass = l.key === active ? 'text-accent' : 'text-text-muted hover:text-text-primary';
      return '<a href="' + l.href + '" class="nav-link px-3 py-2 rounded-lg font-body text-sm transition-colors duration-150 ' + colorClass + '">' + l.label + '</a>';
    }).join('');
    this.innerHTML =
      '<nav class="fixed top-0 left-0 right-0 z-[100] flex items-center gap-2 px-6 py-3 border-b border-border bg-background">' +
      '<a href="index.html" class="font-display text-text-primary text-lg mr-6">Sunlogic</a>' +
      linksHtml +
      '<dl-button variant="primary" href="contact.html" class="ml-auto">Get Started</dl-button>' +
      '</nav>';
  }
}
customElements.define('dl-nav-bar', DlNavBar);

class DlFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML =
      '<footer class="bg-surface border-t border-border py-16 px-6">' +
      '<div class="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-text-muted font-body text-sm">' +
      '<div><div class="font-display text-text-primary text-lg mb-4">Sunlogic</div>' +
      '<p>Solar, electrical, and smart energy management for South African homes and businesses.</p></div>' +
      '<div class="flex flex-col gap-2">' +
      '<a href="solar.html" class="hover:text-text-primary">Solar</a>' +
      '<a href="electrical.html" class="hover:text-text-primary">Electrical</a>' +
      '<a href="energy-management.html" class="hover:text-text-primary">Energy Management</a>' +
      '<a href="blog.html" class="hover:text-text-primary">Worth Knowing</a></div>' +
      '<div class="flex flex-col gap-2">' +
      '<a href="contact.html" class="hover:text-text-primary">Contact</a>' +
      '<a href="legal.html" class="hover:text-text-primary">Legal</a></div>' +
      '</div></footer>';
  }
}
customElements.define('dl-footer', DlFooter);
```

- [ ] **Step 2: Add to the test harness**

Append inside `<body>` of `site-daylight/shared/test-components.html`, before `</body>`:

```html
<dl-nav-bar active="home"></dl-nav-bar>
<dl-footer></dl-footer>
```

- [ ] **Step 3: Verify**

Run: `node --check site-daylight/shared/components.js`
Expected: no output.

Self-review: confirm all 5 nav links use exact page filenames matching Task 6-9/11 page names (`index.html`, `solar.html`, `electrical.html`, `energy-management.html`, `blog.html`) — `contact.html` is reached via the CTA button only, matching a header-vs-CTA nav pattern; `legal.html` is footer-only (no header nav slot allocated to it, consistent with it being a support/legal page, not a primary nav item).

- [ ] **Step 4: Commit**

```bash
git add site-daylight/shared/components.js site-daylight/shared/test-components.html
git commit -m "feat(site-daylight): add nav bar and footer components"
```

---

### Task 4: Motion System

**Files:**
- Modify: `site-daylight/shared/tokens.css` (append)
- Modify: `site-daylight/shared/components.js` (append)
- Create: `site-daylight/shared/motion.js`
- Modify: `site-daylight/shared/test-components.html` (append)

**Interfaces:**
- Produces two distinct reveal components (see the Component Usage Guide for exactly when each is used) plus the particle function:
  - `<dl-reveal>` — general content reveal: fade + gentle translateY(40px→0). Used for subheads, body copy, CTA buttons, card grids, callouts.
  - `<dl-reveal-lines>` — headline-specific masked slide-up: the child is clipped inside an `overflow: clip` box and slides up from fully hidden (`translateY(100%)`) to in-place, with no opacity change. This is the component that recreates the source design system's signature "mask and slide up" text effect (`references/ANIMATIONS.md`'s `usp-mask-surtitle-mask-line-mask`/`intro-mask-line-mask` pattern) — used only for the hero `<h1>` and section headlines, never for body content.
  - `dlInitParticles(canvasElement)` global function.
  - All three are consumed by every page task (6-12).

- [ ] **Step 1: Append motion CSS to `site-daylight/shared/tokens.css`**

```css
dl-reveal {
  display: block;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
}
dl-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  dl-reveal {
    transition: none;
    opacity: 1;
    transform: none;
  }
}

dl-reveal-lines {
  display: block;
  overflow: clip;
}
dl-reveal-lines > * {
  display: block;
  transform: translateY(100%);
  transition: transform 1000ms cubic-bezier(0.16, 1, 0.3, 1);
}
dl-reveal-lines.is-visible > * {
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  dl-reveal-lines > * {
    transition: none;
    transform: none;
  }
}
```

- [ ] **Step 2: Append `DlReveal` and `DlRevealLines` to `site-daylight/shared/components.js`**

```js
class DlReveal extends HTMLElement {
  connectedCallback() {
    DlReveal._observer.observe(this);
  }
}
DlReveal._observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      DlReveal._observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
customElements.define('dl-reveal', DlReveal);

class DlRevealLines extends HTMLElement {
  connectedCallback() {
    DlRevealLines._observer.observe(this);
  }
}
DlRevealLines._observer = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      DlRevealLines._observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
customElements.define('dl-reveal-lines', DlRevealLines);
```

`<dl-reveal-lines>` expects exactly one direct child element (typically an `<h1>` or `<h2>`) — that child is what gets `translateY`'d, while the custom element itself provides the `overflow: clip` mask.

- [ ] **Step 3: Write `site-daylight/shared/motion.js`**

```js
function dlInitParticles(canvas) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  const ctx = canvas.getContext('2d');
  let width, height;
  const particles = [];
  const COUNT = 40;

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 2,
      vy: 0.1 + Math.random() * 0.2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255, 247, 233, 0.15)';
    particles.forEach(function(p) {
      p.y -= p.vy;
      if (p.y < 0) { p.y = height; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}
```

- [ ] **Step 4: Add to the test harness**

Append inside `<body>` of `site-daylight/shared/test-components.html`, before `</body>`:

```html
<dl-reveal><h2 class="font-display text-3xl">Reveal test — should fade/slide in on scroll into view</h2></dl-reveal>
<dl-reveal-lines><h1 class="font-display text-5xl">Masked line reveal test — should slide up from a clipped mask, no fade</h1></dl-reveal-lines>
<canvas class="dl-particles-test" style="width:400px;height:200px;background:#0a0804;"></canvas>
<script src="motion.js"></script>
<script>
  document.querySelectorAll('.dl-particles-test').forEach(dlInitParticles);
</script>
```

- [ ] **Step 5: Verify**

Run: `node --check site-daylight/shared/motion.js`
Expected: no output.

Run: `node --check site-daylight/shared/components.js`
Expected: no output.

Self-review: confirm the `@media (prefers-reduced-motion: reduce)` blocks for both `dl-reveal` and `dl-reveal-lines` in `tokens.css` remove the transform unconditionally (not dependent on the `.is-visible` class), so reduced-motion users see content immediately even if the IntersectionObserver never fires. Confirm `dlInitParticles` returns immediately (no canvas draw, no animation loop started) when `prefers-reduced-motion: reduce` matches. Confirm `dl-reveal-lines` never applies an opacity change (mask-slide only) while `dl-reveal` always pairs opacity with translateY — these two must stay visually distinct per the Component Usage Guide.

- [ ] **Step 6: Commit**

```bash
git add site-daylight/shared/tokens.css site-daylight/shared/components.js site-daylight/shared/motion.js site-daylight/shared/test-components.html
git commit -m "feat(site-daylight): add scroll-reveal, masked headline reveal, and ambient particle motion"
```

---

### Task 5: Media Slot and Plugin Theming

**Files:**
- Modify: `site-daylight/shared/components.js` (append)
- Create: `site-daylight/shared/plugin-theme.css`
- Test: `site-daylight/shared/test-plugins.html`

**Interfaces:**
- Consumes: `plugins/calculator/{assumptions.js,calculator-math.js,calculator.js}` and `plugins/review-carousel/{reviews.data.js,review-carousel.js}` (existing, unmodified) via their documented CSS custom properties `--plugin-calc-*` and `--plugin-review-*`.
- Produces: `<dl-media-bg src="..." alt="...">` custom element, `shared/plugin-theme.css` — both consumed by page tasks (6-12).

- [ ] **Step 1: Append `DlMediaBg` to `site-daylight/shared/components.js`**

```js
class DlMediaBg extends HTMLElement {
  connectedCallback() {
    const src = this.getAttribute('src') || '';
    const alt = this.getAttribute('alt') || '';
    this.classList.add('relative', 'overflow-hidden', 'block');
    if (src) {
      this.innerHTML = '<img src="' + src + '" alt="' + alt + '" class="absolute inset-0 w-full h-full object-cover" />';
    } else {
      this.innerHTML =
        '<div class="absolute inset-0 flex items-center justify-center border-2 border-dashed border-border bg-surface">' +
        '<span class="font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted px-4 text-center">' + (alt || '[PLACEHOLDER: image needed]') + '</span>' +
        '</div>';
    }
  }
}
customElements.define('dl-media-bg', DlMediaBg);
```

`src` is optional. When no real Sunlogic image exists yet for a slot, omit `src` entirely and set only `alt` to the bracket-placeholder text (e.g. `alt="[PLACEHOLDER: real hero photo needed]"`) — the component then renders a labeled dashed-border placeholder box instead of a broken `<img>`, matching the spec's placeholder convention (never a fabricated image passed off as real). Only pass `src` when pointing at an image file that actually exists in `site-daylight/images/`.

Note: a `data-video` attribute is intentionally not implemented yet — this component renders a static image (or placeholder box) only. A future task can add a `<video>` branch when real, self-hosted Sunlogic footage exists, without changing this element's external API (`src`/`alt`).

- [ ] **Step 2: Write `site-daylight/shared/plugin-theme.css`**

Values copied verbatim from `plugins/calculator/calculator.js` and `plugins/review-carousel/review-carousel.js`'s own `:where(:root)` default blocks — only the values change, the property names are exact matches to the plugins' existing theming contract:

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

- [ ] **Step 3: Write the test harness**

Create `site-daylight/shared/test-plugins.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Plugin Theme Test</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="tailwind-config.js"></script>
<link rel="stylesheet" href="tokens.css"/>
<link rel="stylesheet" href="plugin-theme.css"/>
<script src="icons.js" defer></script>
<script src="components.js" defer></script>
<script src="../../plugins/calculator/assumptions.js"></script>
<script src="../../plugins/calculator/calculator-math.js"></script>
<script src="../../plugins/calculator/calculator.js"></script>
<script src="../../plugins/review-carousel/reviews.data.js"></script>
<script src="../../plugins/review-carousel/review-carousel.js"></script>
</head>
<body class="bg-background p-8">
<dl-media-bg alt="[PLACEHOLDER: test image]" style="height:200px;display:block;"></dl-media-bg>
<plugin-calculator mode="residential" webhook="PENDING_BACKEND"></plugin-calculator>
<plugin-review-carousel></plugin-review-carousel>
</body>
</html>
```

Note: `src` is intentionally omitted here — `site-daylight/images/` doesn't exist until Task 6, and this exercises `dl-media-bg`'s no-`src` placeholder-box path (the one every page will actually use until real photography exists), rather than the `img` path. It only exists to confirm the plugins render with the daylight theme applied and `dl-media-bg` produces the expected markup structure.

- [ ] **Step 4: Verify**

Run: `node --check site-daylight/shared/components.js`
Expected: no output.

Self-review: confirm every property name in `plugin-theme.css` exactly matches a property name from the plugins' own `:where(:root)` blocks (`--plugin-calc-accent`, `--plugin-calc-bg`, `--plugin-calc-text-color`, `--plugin-calc-text-muted`, `--plugin-calc-radius`, `--plugin-calc-font`, `--plugin-review-accent`, `--plugin-review-card-bg`, `--plugin-review-text-color`, `--plugin-review-text-muted`, `--plugin-review-card-height`, `--plugin-review-card-width`, `--plugin-review-card-width-mobile`, `--plugin-review-radius`, `--plugin-review-gap`, `--plugin-review-speed`, `--plugin-review-font`) — a typo here silently falls back to the plugin's own light-theme default instead of erroring, so this must be checked character-by-character against `plugins/calculator/calculator.js` and `plugins/review-carousel/review-carousel.js`.

- [ ] **Step 5: Commit**

```bash
git add site-daylight/shared/components.js site-daylight/shared/plugin-theme.css site-daylight/shared/test-plugins.html
git commit -m "feat(site-daylight): add media background slot and plugin retheming"
```

---

### Task 6: Homepage (`index.html`)

**Files:**
- Create: `site-daylight/index.html`
- Create: `site-daylight/shared/forms.js` (pulled forward from Task 10 — see ruling below)

**Amendment (found during execution):** `site/index.html`'s hero is a two-column layout — headline/CTA on one side, an embedded "Free Onsite Assessment" quote-request form (`id="assessment"`) on the other. The original brief text below only covered the headline/CTA half. This form is real content (it's why `#assessment` exists as a link target elsewhere on the site) and must be included. Its exact fields, read from `site/index.html`: heading "Free Onsite Assessment", subtext "Complete the form below to schedule your consultation.", then a two-column row of Name*/Surname* text inputs, then Email address* (email), Contact number* (tel), Service Required* — a dropdown with options "Full Solar system", "Update to an existing system", "Electrical servicing", "Electrical installation" — a hidden honeypot field named `website`, and a submit button reading "Submit Enquiry". Build this using `dl-field` for the text/email/tel inputs. `dl-field` has no dropdown support, so for "Service Required*" write a raw `<select>` styled to match `dl-field`'s visual pattern instead of extending `dl-field` itself: a `<label class="block font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted mb-2">Service Required*</label>` followed by `<select required class="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent">` with an `<option value="" disabled selected>Select a service</option>` plus the four options above as plain `<option>` elements. The honeypot input follows the same hidden-offscreen pattern used in Task 10's contact form (`class="absolute -left-[9999px]" aria-hidden="true"`, `name="website"`, `tabindex="-1"`, `autocomplete="off"`). Wrap the whole thing in a `<form data-dl-form data-webhook="PENDING_BACKEND">`, and write `site-daylight/shared/forms.js` with this exact content (this file was originally scheduled for Task 10, but the homepage needs it first, so it's created here — Task 10 will just reuse it, not recreate it):

```js
function dlInitForm(form) {
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value) {
      return;
    }
    const requiredFields = form.querySelectorAll('[required]');
    for (let i = 0; i < requiredFields.length; i++) {
      if (!requiredFields[i].value.trim()) {
        requiredFields[i].focus();
        return;
      }
    }
    const data = {};
    new FormData(form).forEach(function(value, key) {
      if (key !== 'website') { data[key] = value; }
    });
    const webhook = form.getAttribute('data-webhook');
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(function(err) {
      console.warn('Form submission webhook failed:', err);
    }).finally(function() {
      form.innerHTML = '<p class="font-body text-text-primary">Thanks — we will be in touch shortly.</p>';
    });
  });
}
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('form[data-dl-form]').forEach(dlInitForm);
});
```

Add `<script src="shared/forms.js" defer></script>` to `index.html`'s `<head>`. Do NOT redirect on success (there is no `thank-you.html` in this plan's page set) — the inline "Thanks — we will be in touch shortly." replacement above is the complete, correct behavior, matching Task 10's original design.

No `site-daylight/images/` directory is created in this plan — every `dl-media-bg` slot across all 7 pages uses the no-`src` placeholder-box path (Task 5) rather than a real or borrowed image, since no real Sunlogic photography exists yet and no image from `godaylight-design/screens/` should be used (per the no-ties-to-godaylight constraint, this includes their captured imagery, not only live links). A future task can create `site-daylight/images/` and pass `src` once real photography exists.

**Interfaces:**
- Consumes: everything from Tasks 1-5 (`dl-nav-bar`, `dl-footer`, `dl-section`, `dl-card`, `dl-badge`, `dl-button`, `dl-field`, `dl-reveal`, `dl-media-bg`, `dlInitParticles`, `plugin-review-carousel` with `plugin-theme.css`).

- [ ] **Step 1: Read the source content**

Read `site/index.html` in full. This is the canonical, already verbatim-verified copy source. Note every section's heading, body text, eyebrow/badge labels, and CTA text exactly as written — these get transcribed unchanged into the new markup. Do not add, remove, reorder, or reword any section.

- [ ] **Step 2: Build `site-daylight/index.html`**

Use the Shared Page Boilerplate (defined at the top of this plan) with `PAGE_TITLE` matching `site/index.html`'s `<title>` text exactly, and `active="home"`.

Hero section pattern (fill in the exact H1/subhead/CTA text read in Step 1 — do not invent placeholder text):

```html
<section class="relative h-screen flex items-center overflow-hidden">
  <dl-media-bg alt="[PLACEHOLDER: real hero photo needed]"></dl-media-bg>
  <canvas class="dl-particles absolute inset-0 w-full h-full pointer-events-none"></canvas>
  <div class="absolute inset-0 bg-background opacity-60"></div>
  <div class="relative z-10 px-6 max-w-[1000px] mx-auto">
    <dl-reveal-lines>
      <h1 class="font-display font-bold leading-[1.2] text-[clamp(2.5rem,6vw,7.5rem)]">EXACT_H1_TEXT_FROM_SOURCE</h1>
    </dl-reveal-lines>
    <dl-reveal>
      <p class="font-body text-base leading-[1.5] text-text-muted mt-6 max-w-2xl">EXACT_SUBHEAD_TEXT_FROM_SOURCE</p>
    </dl-reveal>
    <dl-reveal>
      <dl-button variant="primary" icon="arrow-right" href="EXACT_HREF_FROM_SOURCE">EXACT_CTA_TEXT_FROM_SOURCE</dl-button>
    </dl-reveal>
  </div>
</section>
<script>document.querySelectorAll('.dl-particles').forEach(dlInitParticles);</script>
```

The H1 uses `dl-reveal-lines` (masked slide-up, no fade — the signature hero moment), while the subhead and CTA use plain `dl-reveal` (fade+slide), per the Component Usage Guide.

For each subsequent content section read in Step 1 (What We Do, Why Sunlogic, How It Works, Proof, Worth Knowing, Final CTA — using whatever the current live section set actually is), wrap it in `<dl-section bg="background">` or `<dl-section bg="surface">` alternating so no two adjacent sections share a background (same rhythm rule already validated on the live site). Each section's own headline (`heading-3` scale: `font-display font-bold leading-[1.2] text-[clamp(1.5rem,2.5vw,2.5rem)]`) is wrapped in `<dl-reveal-lines>`; its body copy (`font-body text-base leading-[1.5] text-text-muted`) is wrapped in `<dl-reveal>`; any card grid is wrapped in one `<dl-reveal>` around the grid container with `<dl-card>` per item inside (not one `<dl-reveal>` per card); any callout block uses `<dl-callout>` wrapped in `<dl-reveal>`. Insert `<plugin-review-carousel></plugin-review-carousel>` at the same point in the page flow where `site/index.html` places its review carousel — the plugin is not itself wrapped in a reveal component, since it manages its own internal rendering.

Every bracket-placeholder already present in `site/index.html` (trust-strip numbers, Proof section project cards, etc.) carries over unchanged — do not resolve or invent content for any of them.

- [ ] **Step 3: Verify**

Run: `grep -rn "godaylight\.com\|stream\.mux\.com\|godaylight-design/" site-daylight/index.html`
Expected: no output.

Self-review: re-read `site/index.html` side-by-side with the new file and confirm every heading, paragraph, eyebrow, and CTA string matches exactly (character-for-character on the visible text, markup structure aside).

- [ ] **Step 4: Commit**

```bash
git add site-daylight/index.html
git commit -m "feat(site-daylight): add homepage"
```

---

### Task 7: Solar Page (`solar.html`)

**Files:**
- Create: `site-daylight/solar.html`

**Interfaces:**
- Consumes: same as Task 6, plus `plugin-calculator` (both `mode="residential"` and `mode="sme"` instances) with `plugin-theme.css` applied.

- [ ] **Step 1: Read the source content**

Read `site/solar.html` in full — canonical copy source, including both `<plugin-calculator>` placements and every FAQ item.

- [ ] **Step 2: Build `site-daylight/solar.html`**

Shared Page Boilerplate, `active="solar"`, plus script tags for the calculator plugin before `</head>`:

```html
<script src="../plugins/calculator/assumptions.js"></script>
<script src="../plugins/calculator/calculator-math.js"></script>
<script src="../plugins/calculator/calculator.js"></script>
```

Transcribe every section from Step 1 exactly (hero, "Why Now" callout, "Solar for Your Home" with its sub-sections and the residential `<plugin-calculator mode="residential" webhook="PENDING_BACKEND">` at the same position as the source's "CALCULATOR BLOCK" marker, "Solar for Your Business" with the SME `<plugin-calculator mode="sme" webhook="PENDING_BACKEND">`, "Solar for Larger Sites", closing CTA), using the `dl-section`/`dl-reveal`/`dl-reveal-lines`/`dl-card` pattern established in Task 6 and the Component Usage Guide. The "Why Now" callout, and any other `sl-callout`-equivalent block found in the source, becomes `<dl-callout icon="...">` wrapped in `<dl-reveal>` (pick whichever icon key from Task 2's registry best matches the callout's original icon, or omit `icon` if the source callout has none). FAQ items use `<dl-card>` per question/answer pair, grouped inside one `<dl-reveal>`-wrapped list container.

- [ ] **Step 3: Verify**

Run: `grep -rn "godaylight\.com\|stream\.mux\.com\|godaylight-design/" site-daylight/solar.html`
Expected: no output.

Self-review: confirm both calculator instances use the exact `mode` values (`residential`, `sme`) the source page uses, at the same relative position in the page, and confirm every FAQ question/answer matches the source text exactly.

- [ ] **Step 4: Commit**

```bash
git add site-daylight/solar.html
git commit -m "feat(site-daylight): add solar page"
```

---

### Task 8: Electrical Page (`electrical.html`)

**Files:**
- Create: `site-daylight/electrical.html`

**Interfaces:**
- Consumes: same base set as Task 6 (no plugins on this page).

- [ ] **Step 1: Read the source content**

Read `site/electrical.html` in full — canonical copy source.

- [ ] **Step 2: Build `site-daylight/electrical.html`**

Shared Page Boilerplate, `active="electrical"`. Transcribe every section exactly (hero, "What We Do" 3-card intro, "Electrical at Home" with its sub-sections and FAQ, "Electrical for Small Business", "Electrical for Larger Sites", closing CTA) using the `dl-section`/`dl-reveal`/`dl-reveal-lines`/`dl-card` pattern from Task 6 and the Component Usage Guide. Any `sl-callout`-equivalent block found in the source (e.g. "Electrical for Small Business" has one in the source copy) becomes `<dl-callout icon="...">` wrapped in `<dl-reveal>`.

- [ ] **Step 3: Verify**

Run: `grep -rn "godaylight\.com\|stream\.mux\.com\|godaylight-design/" site-daylight/electrical.html`
Expected: no output.

Self-review: confirm section count and order matches `site/electrical.html` exactly, and every FAQ item's text matches.

- [ ] **Step 4: Commit**

```bash
git add site-daylight/electrical.html
git commit -m "feat(site-daylight): add electrical page"
```

---

### Task 9: Energy Management Page (`energy-management.html`)

**Files:**
- Create: `site-daylight/energy-management.html`

**Interfaces:**
- Consumes: same base set as Task 6 (no plugins on this page).

- [ ] **Step 1: Read the source content**

Read `site/energy-management.html` in full — canonical copy source (Hero, Intro, Products — HotBot/SolarBot, "How the Subscription Works" including its cancellation-terms-contradiction callout, closing CTA).

- [ ] **Step 2: Build `site-daylight/energy-management.html`**

Shared Page Boilerplate, `active="energy"`. Transcribe every section exactly, using the `dl-section`/`dl-reveal`/`dl-reveal-lines` pattern from Task 6 and the Component Usage Guide. The HotBot/SolarBot product cards use `<dl-card>` per product (grouped in one `dl-reveal`-wrapped grid), `<dl-badge>` for the "Hot Water"/"Solar and Battery" tags. The cancellation-terms-contradiction note becomes `<dl-callout icon="chart-bar">` wrapped in `<dl-reveal>`, its bracket text carried over verbatim, unresolved — do not invent a reconciled cancellation policy.

- [ ] **Step 3: Verify**

Run: `grep -rn "godaylight\.com\|stream\.mux\.com\|godaylight-design/" site-daylight/energy-management.html`
Expected: no output.

Self-review: confirm the exact pricing text (`R849 once off plus R149 a month`) and the bracket callout text match the source verbatim.

- [ ] **Step 4: Commit**

```bash
git add site-daylight/energy-management.html
git commit -m "feat(site-daylight): add energy management page"
```

---

### Task 10: Contact Page (`contact.html`)

**Files:**
- Create: `site-daylight/contact.html`

**Amendment:** `site-daylight/shared/forms.js` was pulled forward into Task 6 (the homepage has its own quote-request form and needed it first) — it already exists by the time this task runs. Do NOT recreate it; just add `<script src="shared/forms.js" defer></script>` to this page's `<head>` and use `data-dl-form data-webhook="..."` on this page's form exactly as Task 6's form does.

**Interfaces:**
- Consumes: `dl-field` (Task 2), Shared Page Boilerplate, `dlInitForm` / `shared/forms.js` (Task 6).

- [ ] **Step 1: Read the source content**

Read `site/contact.html` in full — canonical copy source, including the exact field list (name, contact details, suburb, "what you need" dropdown options, property-type dropdown options, message) and any surrounding copy/headings.

- [ ] **Step 2: Build `site-daylight/contact.html`**

Shared Page Boilerplate, `active="contact"`, plus `<script src="shared/forms.js" defer></script>` before `</head>`. Build the form using `<dl-field>` per field read in Step 1, with a hidden honeypot field:

```html
<form data-dl-form data-webhook="PENDING_BACKEND" class="flex flex-col gap-6 max-w-xl">
  <input type="text" name="website" tabindex="-1" autocomplete="off" class="absolute -left-[9999px]" aria-hidden="true" />
  <!-- one <dl-field> per field read from site/contact.html, in the same order, with the same labels/required-ness -->
  <dl-button variant="primary" icon="arrow-right">Send</dl-button>
</form>
```

Transcribe every non-form heading/paragraph from Step 1 exactly, including the Meet the Team section and its HTML comment noting the Office/Support number ambiguity, and the Hours placeholder text `[not published anywhere on your current site]`.

- [ ] **Step 3: Verify**

Run: `grep -rn "godaylight\.com\|stream\.mux\.com\|godaylight-design/" site-daylight/contact.html`
Expected: no output.

Self-review: confirm every form field name/label/required-status matches `site/contact.html` exactly, and the honeypot field name matches what `forms.js` checks for (`website`).

- [ ] **Step 4: Commit**

```bash
git add site-daylight/contact.html
git commit -m "feat(site-daylight): add contact page"
```

---

### Task 11: Blog Page (`blog.html`)

**Files:**
- Create: `site-daylight/blog.html`

**Interfaces:**
- Consumes: same base set as Task 6 (no plugins on this page).

- [ ] **Step 1: Read the source content**

Read `site/blog.html` in full — canonical copy source (Hero "Worth Knowing", category chips, numbered "First Posts to Write" list with its 7 titles, the HTML comment note for Stephan about posting cadence).

- [ ] **Step 2: Build `site-daylight/blog.html`**

Shared Page Boilerplate, `active="blog"`. Category chips use `<dl-badge>`. The numbered post list uses `<dl-card>` per item, each showing its number and exact title text from Step 1. Carry over the HTML comment note verbatim. Do not add a closing CTA section or any eyebrow/subtext not present in the source (the source intentionally has neither).

- [ ] **Step 3: Verify**

Run: `grep -rn "godaylight\.com\|stream\.mux\.com\|godaylight-design/" site-daylight/blog.html`
Expected: no output.

Self-review: confirm all 7 post titles match the source exactly and in the same order, and confirm no CTA section or extra eyebrow text was added.

- [ ] **Step 4: Commit**

```bash
git add site-daylight/blog.html
git commit -m "feat(site-daylight): add blog page"
```

---

### Task 12: Legal Page (`legal.html`)

**Files:**
- Create: `site-daylight/legal.html`

**Interfaces:**
- Consumes: same base set as Task 6, `active="none"` (not a primary nav item).

- [ ] **Step 1: Read the source content**

Read `site/legal.html` in full — canonical copy source. The live copy doc specifies this page "moves across as-is," so this is the most literal transcription task in the plan.

- [ ] **Step 2: Build `site-daylight/legal.html`**

Shared Page Boilerplate, `active="none"`. Transcribe every section from Step 1 exactly, using `dl-section` for layout wrapping only — no new headings, no reordering, no summarizing of legal text.

- [ ] **Step 3: Verify**

Run: `grep -rn "godaylight\.com\|stream\.mux\.com\|godaylight-design/" site-daylight/legal.html`
Expected: no output.

Self-review: confirm the full legal text is present and unaltered — this is the one page where even minor paraphrasing would be a real content-fidelity failure, not just a style deviation.

- [ ] **Step 4: Commit**

```bash
git add site-daylight/legal.html
git commit -m "feat(site-daylight): add legal page"
```

---

## Final Verification (controller, after all tasks — matches spec Section 10)

Not a task — performed once, by the controlling session, after Task 12 is complete:

1. Serve locally (`python3 -m http.server 8010` from repo root) and load every page under `http://localhost:8010/site-daylight/`.
2. Confirm no console errors on any page.
3. Toggle OS-level reduced-motion and confirm `.dl-reveal` transitions and the canvas particle effect are both disabled.
4. Check mobile viewport (375px) and desktop (1440px) — no overflow, `clamp()` type scale stays legible at its small end.
5. Confirm both plugins render with the daylight theme (dark surface, purple accent) and function identically to their `site/` behavior.
6. Run `grep -rn "godaylight\.com\|stream\.mux\.com\|godaylight-design/" site-daylight/` from the repo root — expect no output across the whole directory.
