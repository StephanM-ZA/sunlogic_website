# Sunlogic Web Component Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the Stitch-derived homepage into six reusable Web Components (button, section-header, card, field, nav-bar, footer) backed by one shared token file, eliminating the structural/style duplication in `site/index.html` with zero visual regression.

**Architecture:** Native Web Components, light DOM (`display: contents` on every custom element so it never adds an extra box to surrounding flex/grid layouts). Loaded via plain `<script>` tags — no build step, no npm, no framework. Tailwind's CDN script continues to scan the rendered DOM for utility classes exactly as it does today.

**Tech Stack:** Vanilla JS (`customElements.define`), Tailwind CDN (already in use), no other dependencies.

**Spec:** `docs/superpowers/specs/2026-08-28-component-library-design.md`

## Global Constraints

- No build step: every file must work when `site/index.html` is opened via `python3 -m http.server` (the existing verification method) with no compile/transpile step.
- `shared/components.js` is loaded with the `defer` attribute so the whole document (including light-DOM children like `<li>`/`<option>` inside component tags) is parsed before any `customElements.define` call runs.
- Every custom element gets `display: contents` via one shared `<style>` block injected once at the top of `shared/components.js` — this is what lets e.g. `<sl-card>` sit correctly inside a `grid grid-cols-4` parent.
- Class strings inside each component must match the verified real Stitch `code.html` (in `design/code.html`) exactly, except for the two explicitly-flagged normalizations in Task 3 — no other silent visual changes.
- All git commits go through the `commit-specialist` agent (per this project's CLAUDE.md rule) — never run `git commit` directly. Each task ends with a dispatch to that agent, not a raw git step.
- Verification method (reused from prior work in this project): serve `site/` with `python3 -m http.server 8743` from the `site/` directory, then use the `claude-in-chrome` browser tool to navigate to `http://localhost:8743/index.html` and screenshot the relevant section.

---

### Task 0: Extract tokens and bootstrap the component runtime

**Files:**
- Create: `site/shared/tokens.js`
- Create: `site/shared/components.js`
- Modify: `site/index.html` (head section only)

**Interfaces:**
- Produces: `tailwind.config` set globally by `tokens.js`; the `display: contents` base stylesheet injected by `components.js`; no components registered yet.

- [ ] **Step 1: Create `site/shared/tokens.js`** containing exactly this (copied verbatim from the `<script id="tailwind-config">` block currently inline in `site/index.html` and in `design/code.html`):

```js
tailwind.config = {darkMode: "class", theme: {extend: {colors: {"on-primary-container": "#758892", "on-secondary-fixed": "#311300", "tertiary-fixed": "#e8e1d9", "on-secondary": "#ffffff", "secondary-fixed-dim": "#ffb787", "primary-fixed-dim": "#b6c9d4", "inverse-surface": "#303031", "tertiary-fixed-dim": "#ccc6bd", "primary-fixed": "#d2e6f1", "surface-container-low": "#f5f3f3", "surface-container-highest": "#e4e2e2", "on-background": "#1b1c1c", "on-surface": "#1b1c1c", "secondary-container": "#ff8000", primary: "#000508", "primary-container": "#0d2028", "on-secondary-fixed-variant": "#723600", secondary: "#964900", "surface-dim": "#dbd9da", "inverse-on-surface": "#f2f0f1", "on-primary": "#ffffff", "on-tertiary-fixed-variant": "#4a4640", "surface-container": "#efedee", "on-tertiary": "#ffffff", "surface-container-high": "#e9e8e8", "on-error-container": "#93000a", error: "#ba1a1a", "on-secondary-container": "#5e2b00", "on-primary-fixed": "#0b1e26", "surface-container-lowest": "#ffffff", "inverse-primary": "#b6c9d4", "surface-bright": "#fbf9f9", "on-surface-variant": "#42474a", "on-tertiary-container": "#8a857d", "on-tertiary-fixed": "#1e1b16", surface: "#fbf9f9", "outline-variant": "#c3c7ca", "surface-variant": "#e4e2e2", background: "#fbf9f9", "surface-tint": "#4f616a", "tertiary-container": "#201d18", "on-error": "#ffffff", tertiary: "#040301", "secondary-fixed": "#ffdcc7", outline: "#73787b", "on-primary-fixed-variant": "#374952", "error-container": "#ffdad6", "solar-sky": "#F0F7FF"}, borderRadius: {DEFAULT: "0.125rem", lg: "0.25rem", xl: "0.5rem", full: "0.75rem"}, spacing: {"container-max": "1280px", "margin-mobile": "16px", unit: "8px", "section-gap-desktop": "120px", gutter: "24px", "section-gap-mobile": "64px"}, fontFamily: {"body-lg": ["Hanken Grotesk"], "headline-sm": ["Hanken Grotesk"], "headline-lg": ["Hanken Grotesk"], "headline-lg-mobile": ["Hanken Grotesk"], "body-md": ["Hanken Grotesk"], "display-lg": ["Hanken Grotesk"], "headline-md": ["Hanken Grotesk"], "label-md": ["Hanken Grotesk"], headline: ["Hanken Grotesk"], display: ["Hanken Grotesk"], body: ["Hanken Grotesk"], label: ["Jetbrains Mono"]}, fontSize: {"body-lg": ["18px", {lineHeight: "28px", fontWeight: "400"}], "headline-sm": ["24px", {lineHeight: "32px", fontWeight: "700"}], "headline-lg": ["48px", {lineHeight: "56px", letterSpacing: "-0.01em", fontWeight: "800"}], "headline-lg-mobile": ["32px", {lineHeight: "40px", fontWeight: "800"}], "body-md": ["16px", {lineHeight: "24px", fontWeight: "400"}], "display-lg": ["72px", {lineHeight: "80px", letterSpacing: "-0.02em", fontWeight: "900"}], "headline-md": ["36px", {lineHeight: "44px", fontWeight: "800"}], "label-md": ["14px", {lineHeight: "20px", fontWeight: "600"}]}, boxShadow: {ambient: "0 12px 32px -4px rgba(13, 32, 40, 0.12)", card: "0 4px 16px -2px rgba(13, 32, 40, 0.08)"}}}};
```

- [ ] **Step 2: Create `site/shared/components.js`** with just the bootstrap stylesheet for now (components are added in later tasks):

```js
const slBaseStyle = document.createElement('style');
slBaseStyle.textContent = `
  sl-button, sl-section-header, sl-card, sl-field, sl-nav-bar, sl-footer {
    display: contents;
  }
`;
document.head.appendChild(slBaseStyle);
```

- [ ] **Step 3: Edit `site/index.html` head.** Replace the inline `<script id="tailwind-config">...</script>` block with:

```html
<script src="shared/tokens.js"></script>
<script src="shared/components.js" defer></script>
```

Keep this placed after the `<script src="https://cdn.tailwindcss.com...">` line and before `</head>`, in the same position the inline config script currently occupies.

- [ ] **Step 4: Verify no visual change.** From `site/`, run:

```bash
cd "site" && python3 -m http.server 8743
```

Navigate the browser tool to `http://localhost:8743/index.html`, screenshot the full page (hero, then scroll through services/process/why-choose-us/footer), and confirm it is pixel-identical to the current render — nothing should have changed yet, since no component tags exist in the HTML at this point.

- [ ] **Step 5: Commit.** Dispatch to the `commit-specialist` agent: stage `site/shared/tokens.js`, `site/shared/components.js`, `site/index.html`; commit message describing this as extracting the Tailwind config into a shared token file and bootstrapping the component runtime (no visual change).

---

### Task 1: `<sl-button>` and swap all five button usages

**Files:**
- Modify: `site/shared/components.js` (append the component)
- Modify: `site/index.html` (5 usage sites: hero primary CTA, hero secondary CTA, hero form submit, nav CTA, footer CTA)

**Interfaces:**
- Consumes: nothing from other components.
- Produces: `<sl-button variant="primary|secondary|dark" size="compact|md|lg|form" icon="<material-symbol-name>" href="<url>" type="button|submit" full-width shadow="none|hover-lg|static-lg|hover-md-lg" lift hidden-mobile transition="all|colors">Label</sl-button>`. Later tasks (`sl-nav-bar`, `sl-footer`) consume this element.

- [ ] **Step 1: Append to `site/shared/components.js`:**

```js
class SlButton extends HTMLElement {
  connectedCallback() {
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'md';
    const icon = this.getAttribute('icon');
    const href = this.getAttribute('href');
    const type = this.getAttribute('type') || 'button';
    const fullWidth = this.hasAttribute('full-width');
    const lift = this.hasAttribute('lift');
    const hiddenMobile = this.hasAttribute('hidden-mobile');
    const shadow = this.getAttribute('shadow') || 'none';
    const transition = this.getAttribute('transition') || 'all';
    const label = this.textContent.trim();

    const VARIANT = {
      primary: 'bg-secondary-container text-on-primary hover:bg-secondary',
      secondary: 'border-2 border-surface/30 text-surface hover:border-surface hover:bg-surface/10',
      dark: 'bg-primary-container text-on-primary hover:bg-primary',
    };
    const SIZE = {
      compact: 'px-7 py-2.5 font-body-md',
      md: 'px-8 py-3.5 font-body-md',
      lg: 'px-8 py-4 font-body-md',
      form: 'px-6 py-4 font-body-lg mt-4',
    };
    const SHADOW = {
      none: '',
      'hover-lg': 'hover:shadow-lg',
      'static-lg': 'shadow-lg',
      'hover-md-lg': 'shadow-md hover:shadow-lg',
    };

    const classes = [
      'font-bold', 'rounded-[0.75rem]', `transition-${transition}`,
      VARIANT[variant], SIZE[size], SHADOW[shadow],
      fullWidth ? 'w-full' : '',
      lift ? 'hover:-translate-y-0.5' : '',
      hiddenMobile ? 'hidden md:block' : '',
      icon ? 'inline-flex items-center gap-2' : '',
    ].filter(Boolean).join(' ');

    const iconHtml = icon ? `<span class="material-symbols-outlined text-xl">${icon}</span>` : '';
    const inner = `${label}${iconHtml}`;

    this.innerHTML = href
      ? `<a class="${classes}" href="${href}">${inner}</a>`
      : `<button class="${classes}" type="${type}">${inner}</button>`;
  }
}
customElements.define('sl-button', SlButton);
```

- [ ] **Step 2: In `site/index.html`, replace the hero primary CTA** (currently `<a class="bg-secondary-container text-on-primary font-body-md font-bold px-8 py-4 rounded-[0.75rem] hover:bg-secondary hover:shadow-lg hover:-translate-y-0.5 transition-all inline-flex items-center gap-2" href="#assessment">Get a Quote<span class="material-symbols-outlined text-xl">arrow_forward</span></a>`) with:

```html
<sl-button variant="primary" size="lg" shadow="hover-lg" lift icon="arrow_forward" href="#assessment">Get a Quote</sl-button>
```

- [ ] **Step 3: Replace the hero secondary CTA** (`<a class="border-2 border-surface/30 ..." href="#services">Explore Services</a>`) with:

```html
<sl-button variant="secondary" size="lg" href="#services">Explore Services</sl-button>
```

- [ ] **Step 4: Replace the hero form submit button** (`<button class="w-full bg-primary-container ... mt-4 shadow-md hover:shadow-lg" type="submit">Submit Enquiry</button>`) with:

```html
<sl-button variant="dark" size="form" full-width shadow="hover-md-lg" type="submit">Submit Enquiry</sl-button>
```

- [ ] **Step 5: Replace the nav "Free Assessment" button** inside the `<nav>` (`<button class="bg-secondary-container ... hidden md:block">Free Assessment</button>`) with:

```html
<sl-button variant="primary" size="compact" shadow="hover-lg" hidden-mobile>Free Assessment</sl-button>
```

- [ ] **Step 6: Replace the footer "Contact Us" button** (`<a class="bg-secondary-container ... shadow-lg" href="#">Contact Us<span ...>arrow_forward</span></a>`) with:

```html
<sl-button variant="primary" size="md" shadow="static-lg" transition="colors" icon="arrow_forward" href="#">Contact Us</sl-button>
```

- [ ] **Step 7: Verify visually.** Restart the local server if needed, reload `http://localhost:8743/index.html`, and screenshot: (a) the hero button pair, (b) the hero form's submit button, (c) the nav bar at desktop width, (d) the footer Contact Us button. Each must render pixel-identical to the pre-refactor screenshots taken earlier in this project (hero buttons with orange fill + arrow / outline style; nav button with the same orange fill and shadow-on-hover; footer button identical). No attribute combination in this task introduces an intentional visual change — flag any difference as a bug in the component, not an accepted normalization.

- [ ] **Step 8: Commit.** Dispatch to `commit-specialist`: stage `site/shared/components.js`, `site/index.html`; message describing addition of `sl-button` and migration of all five button usages, no visual change.

---

### Task 2: `<sl-section-header>` and swap all three usages (two flagged normalizations)

**Files:**
- Modify: `site/shared/components.js` (append the component)
- Modify: `site/index.html` (3 usage sites: Services, Process, Why Choose Us section headers)

**Interfaces:**
- Consumes: nothing.
- Produces: `<sl-section-header eyebrow="…" heading="…" subtext="…" on-dark gap="lg|md">`.

**Note before implementing:** the real Stitch source has two small inconsistencies across its three section-header instances (confirmed by reading `design/code.html` directly, not guessed):
1. The Services header includes `max-md:text-headline-lg-mobile` on the `<h2>`; the Process and Why-Choose-Us headers omit it (likely an unintentional gap — without it, the mobile font-size override doesn't fully apply since its sibling `max-md:font-headline-lg-mobile` class needs the paired `text-` class to take visual effect).
2. The Why-Choose-Us eyebrow badge uses `bg-secondary-container/20 border-secondary-container/30` while Services and Process both use `bg-secondary-container/10 border-secondary-container/20`.

This component applies the Services version's (more complete) classes uniformly to all three instances. This is a real, visible, minor change on the Process and Why-Choose-Us sections — call it out explicitly in Step 5's verification rather than treating it as neutral.

- [ ] **Step 1: Append to `site/shared/components.js`:**

```js
class SlSectionHeader extends HTMLElement {
  connectedCallback() {
    const eyebrow = this.getAttribute('eyebrow') || '';
    const heading = this.getAttribute('heading') || '';
    const subtext = this.getAttribute('subtext');
    const onDark = this.hasAttribute('on-dark');
    const gap = this.getAttribute('gap') || 'md';

    const gapClass = gap === 'lg' ? 'mb-20' : 'mb-16';
    const headingColor = onDark ? 'text-on-primary' : 'text-primary-container';

    this.innerHTML = `
      <div class="text-center max-w-3xl mx-auto ${gapClass}">
        <span class="inline-block px-4 py-1.5 bg-secondary-container/10 border border-secondary-container/20 rounded-[0.75rem] font-label-md text-label-md text-secondary-container uppercase tracking-widest mb-6">${eyebrow}</span>
        <h2 class="font-headline-lg text-headline-lg max-md:font-headline-lg-mobile max-md:text-headline-lg-mobile ${headingColor}">${heading}</h2>
        ${subtext ? `<p class="font-body-lg text-body-lg text-on-surface-variant mt-6 text-xl">${subtext}</p>` : ''}
      </div>
    `;
  }
}
customElements.define('sl-section-header', SlSectionHeader);
```

- [ ] **Step 2: In `site/index.html`, replace the Services section header block** (the `<div class="text-center max-w-3xl mx-auto mb-20">...eyebrow/h2/p...</div>`) with:

```html
<sl-section-header eyebrow="Services" heading="What We Offer" subtext="Sunlogic will guide you, step-by-step, from assessment to handover of your project requirements." gap="lg"></sl-section-header>
```

- [ ] **Step 3: Replace the Process section header block** with:

```html
<sl-section-header eyebrow="Process" heading="Our Process" on-dark></sl-section-header>
```

- [ ] **Step 4: Replace the Why Choose Us section header block** with:

```html
<sl-section-header eyebrow="Benefits" heading="Why Choose Us"></sl-section-header>
```

- [ ] **Step 5: Verify visually, with the two normalizations in mind.** Reload and screenshot all three section headers. Confirm: Services header is unchanged (baseline). Process and Why-Choose-Us headings may now be a hair smaller/differently-sized on a narrow mobile viewport than before (missing responsive class now applied) — check at a mobile width (~375px) in addition to desktop. The Why-Choose-Us eyebrow badge will be a slightly darker/more saturated orange tint than before (opacity 10/20 vs the original page's 20/30). These are the two accepted changes from this task; anything else different is a bug.

- [ ] **Step 6: Commit.** Dispatch to `commit-specialist`: stage `site/shared/components.js`, `site/index.html`; message noting `sl-section-header` addition, migration of all three headers, and the two normalized inconsistencies (cite this task's note).

---

### Task 3: `<sl-card>` and swap all eight card usages

**Files:**
- Modify: `site/shared/components.js` (append the component)
- Modify: `site/index.html` (4 service cards in the Services grid, 4 benefit cards in the Why Choose Us grid)

**Interfaces:**
- Consumes: nothing.
- Produces: `<sl-card variant="service|benefit" icon="<material-symbol-name>" heading="…" body="…">` — for `variant="service"`, `<li>` children become checklist items.

- [ ] **Step 1: Append to `site/shared/components.js`:**

```js
class SlCard extends HTMLElement {
  connectedCallback() {
    const variant = this.getAttribute('variant') || 'service';
    const icon = this.getAttribute('icon') || '';
    const heading = this.getAttribute('heading') || '';
    const body = this.getAttribute('body') || '';
    const items = [...this.querySelectorAll(':scope > li')].map(li => li.textContent.trim());

    if (variant === 'service') {
      const listHtml = items.map(item => `
        <li class="flex items-start gap-3">
          <span class="material-symbols-outlined text-secondary-container text-xl icon-fill">check_circle</span>
          <span class="font-body-md text-body-md text-primary-container font-medium">${item}</span>
        </li>
      `).join('');
      this.innerHTML = `
        <div class="bg-surface p-10 rounded-2xl shadow-card hover:shadow-ambient hover:-translate-y-2 transition-all duration-300 group border-b-4 border-transparent hover:border-secondary-container">
          <div class="w-14 h-14 rounded-xl bg-solar-sky flex items-center justify-center mb-8 group-hover:bg-secondary-container group-hover:scale-110 transition-all duration-300 shadow-sm">
            <span class="material-symbols-outlined text-primary-container group-hover:text-on-primary transition-colors text-3xl">${icon}</span>
          </div>
          <h4 class="font-headline-sm text-headline-sm text-primary-container mb-4 group-hover:text-secondary-container transition-colors">${heading}</h4>
          <p class="font-body-md text-body-md text-on-surface-variant mb-8 leading-relaxed">${body}</p>
          <ul class="space-y-4 pt-4 border-t border-surface-variant/50">${listHtml}</ul>
        </div>
      `;
    } else {
      this.innerHTML = `
        <div class="bg-surface p-8 rounded-2xl shadow-card hover:shadow-ambient transition-all duration-300 border border-surface-variant/50">
          <div class="w-14 h-14 rounded-[0.5rem] bg-secondary-container/20 flex items-center justify-center mb-6 shadow-sm border border-secondary-container/30">
            <span class="material-symbols-outlined text-secondary-container text-3xl icon-fill">${icon}</span>
          </div>
          <h4 class="font-headline-sm text-headline-sm text-primary-container mb-3">${heading}</h4>
          <p class="font-body-md text-body-md text-on-surface-variant">${body}</p>
        </div>
      `;
    }
  }
}
customElements.define('sl-card', SlCard);
```

- [ ] **Step 2: In `site/index.html`, replace all 4 service cards** in the Services grid with:

```html
<sl-card variant="service" icon="fact_check" heading="Planning &amp; Assessment" body="Sunlogic provides a full-scope audit to ensure a safe, efficient, and compliant solution.">
  <li>Investigate Efficiency</li>
  <li>Custom Power Solutions</li>
</sl-card>
<sl-card variant="service" icon="inventory_2" heading="Product &amp; Logistics" body="Reliable access to certified solar equipment and all necessary electrical components.">
  <li>No supply chain issues</li>
  <li>In-house install teams</li>
</sl-card>
<sl-card variant="service" icon="handyman" heading="Installation &amp; Compliance" body="Full-scope electrical wiring and compliance certification required for your system.">
  <li>Quality control</li>
  <li>Compliance verification</li>
</sl-card>
<sl-card variant="service" icon="monitoring" heading="Monitoring &amp; Maintenance" body="Expert team ensures the optimal condition and reliability of your renewable energy system.">
  <li>Remote monitoring</li>
  <li>Regular reports</li>
</sl-card>
```

- [ ] **Step 3: Replace all 4 benefit cards** in the Why Choose Us grid with:

```html
<sl-card variant="benefit" icon="verified" heading="Expert Team" body="Highly trained and certified professionals."></sl-card>
<sl-card variant="benefit" icon="location_on" heading="Local Support" body="Fast response times from our local technicians."></sl-card>
<sl-card variant="benefit" icon="precision_manufacturing" heading="Quality Components" body="We use only premium, tier-1 solar equipment."></sl-card>
<sl-card variant="benefit" icon="gavel" heading="Certified Compliance" body="Full regulatory compliance on all installations."></sl-card>
```

- [ ] **Step 4: Verify visually.** Reload and screenshot the Services grid (4 cards, hover states can be spot-checked with the `hover` computer action) and the Why Choose Us grid (4 cards). Confirm the grid layout is unbroken (4 columns at desktop width) — this is the specific case `display: contents` from Task 0 exists to protect; if cards render as a single wrapped column instead of a 4-column grid, `display: contents` is missing or not taking effect.

- [ ] **Step 5: Commit.** Dispatch to `commit-specialist`: stage `site/shared/components.js`, `site/index.html`; message describing `sl-card` addition and migration of all 8 card usages, no visual change.

---

### Task 4: `<sl-field>` and swap all five form field usages

**Files:**
- Modify: `site/shared/components.js` (append the component)
- Modify: `site/index.html` (Name, Surname, Email, Contact number, Service Required fields in the hero assessment form)

**Interfaces:**
- Consumes: nothing.
- Produces: `<sl-field label="…" type="text|email|tel|select" placeholder="…" field-id="…">` — for `type="select"`, `<option>` children are preserved.

- [ ] **Step 1: Append to `site/shared/components.js`:**

```js
class SlField extends HTMLElement {
  connectedCallback() {
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const placeholder = this.getAttribute('placeholder') || '';
    const fieldId = this.getAttribute('field-id') || '';
    const inputClasses = 'w-full bg-surface border-2 border-surface-variant rounded-[0.5rem] px-4 py-2.5 text-on-surface focus:border-secondary-container focus:ring-0 transition-colors';
    const labelClasses = 'block font-label-md text-label-md text-primary-container mb-1.5';

    if (type === 'select') {
      const options = [...this.querySelectorAll(':scope > option')].map(o => o.outerHTML).join('');
      this.innerHTML = `
        <div>
          <label class="${labelClasses}" for="${fieldId}">${label}</label>
          <select class="${inputClasses}" id="${fieldId}">${options}</select>
        </div>
      `;
    } else {
      this.innerHTML = `
        <div>
          <label class="${labelClasses}" for="${fieldId}">${label}</label>
          <input class="${inputClasses}" id="${fieldId}" placeholder="${placeholder}" type="${type}"/>
        </div>
      `;
    }
  }
}
customElements.define('sl-field', SlField);
```

- [ ] **Step 2: In `site/index.html`, replace the Name/Surname pair** (inside their `grid grid-cols-2 gap-5` wrapper `<div>` — keep that wrapper div as-is) with:

```html
<sl-field label="Name*" type="text" placeholder="John" field-id="assessment-name"></sl-field>
<sl-field label="Surname*" type="text" placeholder="Doe" field-id="assessment-surname"></sl-field>
```

- [ ] **Step 3: Replace the Email field's wrapping `<div>`** with:

```html
<sl-field label="Email address*" type="email" placeholder="john@example.com" field-id="assessment-email"></sl-field>
```

- [ ] **Step 4: Replace the Contact number field's wrapping `<div>`** with:

```html
<sl-field label="Contact number*" type="tel" placeholder="012 345 6789" field-id="assessment-tel"></sl-field>
```

- [ ] **Step 5: Replace the Service Required field's wrapping `<div>`** with:

```html
<sl-field label="Service Required*" type="select" field-id="assessment-service">
  <option>Full Solar system</option>
  <option>Update to an existing system</option>
  <option>Electrical servicing</option>
  <option>Electrical installation</option>
</sl-field>
```

- [ ] **Step 6: Verify visually.** Reload and screenshot the hero assessment form. Confirm Name/Surname still render as two side-by-side columns (grid intact), all five fields have correct labels/placeholders, and the Service Required dropdown still lists all four options when clicked.

- [ ] **Step 7: Commit.** Dispatch to `commit-specialist`: stage `site/shared/components.js`, `site/index.html`; message describing `sl-field` addition and migration of all 5 form fields, no visual change.

---

### Task 5: `<sl-nav-bar>` and `<sl-footer>`

**Files:**
- Modify: `site/shared/components.js` (append both components)
- Modify: `site/index.html` (replace the entire `<nav>` element and the entire `<footer>` element)

**Interfaces:**
- Consumes: `<sl-button>` from Task 1 (both components nest it internally).
- Produces: `<sl-nav-bar active="home|services|energy|contact">`, `<sl-footer>` (no attributes).

- [ ] **Step 1: Append to `site/shared/components.js`:**

```js
class SlNavBar extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || 'home';
    const items = [
      { key: 'home', label: 'Home', href: '#' },
      { key: 'services', label: 'Services', href: '#services' },
      { key: 'energy', label: 'Energy Management', href: '#' },
      { key: 'contact', label: 'Contact', href: '#' },
    ];
    const linksHtml = items.map(item => {
      const classes = item.key === active
        ? 'text-secondary-container border-b-2 border-secondary-container pb-1 font-label-md uppercase tracking-wide'
        : 'text-on-primary/80 hover:text-secondary-container transition-colors font-label-md uppercase tracking-wide';
      return `<a class="${classes}" href="${item.href}">${item.label}</a>`;
    }).join('');

    this.innerHTML = `
      <nav class="fixed top-4 z-50 backdrop-blur-md border border-on-primary/10 transition-all duration-300 ease-in-out py-1 mx-auto max-w-6xl shadow-lg rounded-xl left-4 right-4 bg-surface/10">
        <div class="flex justify-between items-center px-8 py-3">
          <div class="font-headline-sm text-headline-sm font-bold text-on-primary flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary-container icon-fill text-3xl">solar_power</span>
            Sunlogic
          </div>
          <div class="hidden md:flex gap-8 items-center">${linksHtml}</div>
          <sl-button variant="primary" size="compact" shadow="hover-lg" hidden-mobile>Free Assessment</sl-button>
          <button class="md:hidden text-on-primary p-2">
            <span class="material-symbols-outlined">menu</span>
          </button>
        </div>
      </nav>
    `;
  }
}
customElements.define('sl-nav-bar', SlNavBar);

class SlFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="bg-primary-container w-full border-t border-on-primary/10">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 px-gutter py-section-gap-desktop mx-auto max-w-6xl">
          <div class="col-span-1 md:col-span-1">
            <div class="font-headline-sm text-headline-sm text-on-primary mb-6 flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary-container icon-fill text-3xl">solar_power</span>
              Sunlogic
            </div>
            <p class="font-body-md text-body-md mb-8 leading-relaxed text-on-primary">Providing leading Solar and Electrical services across all industries.</p>
            <div class="flex gap-4">
              <div aria-label="Share this page" class="w-10 h-10 rounded-[0.75rem] bg-surface/10 flex items-center justify-center hover:bg-secondary-container hover:text-on-primary cursor-pointer transition-colors text-on-primary/80">
                <span class="material-symbols-outlined text-[20px]">share</span>
              </div>
            </div>
          </div>
          <div class="col-span-1">
            <h5 class="font-label-md text-label-md text-secondary-container font-bold mb-6 uppercase tracking-widest">Support</h5>
            <ul class="space-y-4">
              <li><a class="font-body-md text-body-md text-on-primary/70 hover:text-secondary-container transition-colors" href="#">Privacy Policy</a></li>
              <li><a class="font-body-md text-body-md text-on-primary/70 hover:text-secondary-container transition-colors" href="#">Terms of Service</a></li>
              <li><a class="font-body-md text-body-md text-on-primary/70 hover:text-secondary-container transition-colors" href="#">Safety Certification</a></li>
              <li><a class="font-body-md text-body-md text-on-primary/70 hover:text-secondary-container transition-colors" href="#">Maintenance Portal</a></li>
            </ul>
          </div>
          <div class="col-span-1">
            <h5 class="font-label-md text-label-md text-secondary-container font-bold mb-6 uppercase tracking-widest">Recent Posts</h5>
            <ul class="space-y-4">
              <li><a class="font-body-md text-body-md text-on-primary/70 hover:text-secondary-container transition-colors" href="#">3 Essential Checks</a></li>
              <li><a class="font-body-md text-body-md text-on-primary/70 hover:text-secondary-container transition-colors" href="#">Rent-to-own</a></li>
            </ul>
          </div>
          <div class="col-span-1">
            <h5 class="font-label-md text-label-md text-secondary-container font-bold mb-6 uppercase tracking-widest">Contact</h5>
            <p class="font-body-md text-body-md mb-6 text-on-primary">Ready to start your project?</p>
            <sl-button variant="primary" size="md" shadow="static-lg" transition="colors" icon="arrow_forward" href="#">Contact Us</sl-button>
          </div>
        </div>
        <div class="border-t border-on-primary/10 bg-primary/20">
          <div class="mx-auto px-gutter py-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-6xl">
            <p class="font-body-md text-body-md text-on-primary/60 text-on-primary">
              © 2024 Sunlogic Electrical. All rights reserved.
            </p>
            <div aria-label="Share this page" class="flex gap-6">
              <a class="text-on-primary/60 hover:text-secondary-container transition-colors text-sm" href="#">Privacy</a>
              <a class="text-on-primary/60 hover:text-secondary-container transition-colors text-sm" href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }
}
customElements.define('sl-footer', SlFooter);
```

- [ ] **Step 2: In `site/index.html`, replace the entire `<nav class="fixed top-4 ...">...</nav>` element** with:

```html
<sl-nav-bar active="home"></sl-nav-bar>
```

- [ ] **Step 3: Replace the entire `<footer class="bg-primary-container w-full ...">...</footer>` element** with:

```html
<sl-footer></sl-footer>
```

- [ ] **Step 4: Verify visually.** Reload and screenshot the nav bar and footer. Confirm the nav's "Free Assessment" button still shows the hover shadow (it's now an `<sl-button>` nested inside `<sl-nav-bar>`'s rendered output — confirms nesting custom elements inside another component's dynamically-set `innerHTML` upgrades correctly). Confirm the footer's Contact Us button, links, and copyright line are unchanged.

- [ ] **Step 5: Commit.** Dispatch to `commit-specialist`: stage `site/shared/components.js`, `site/index.html`; message describing `sl-nav-bar` and `sl-footer` addition, completing the component library migration.

---

### Task 6: Full-page regression pass

**Files:**
- None modified — verification only.

**Interfaces:**
- Consumes: the complete component set from Tasks 0–5.

- [ ] **Step 1: Full page screenshot pass.** With the local server still running, reload `http://localhost:8743/index.html` and screenshot top-to-bottom (hero, services, process, why-choose-us + banner image, footer) exactly as done in the earlier Stitch-fidelity verification pass in this project. Confirm every section matches, with only the two Task-2 normalizations as accepted differences from the pre-refactor state.

- [ ] **Step 2: View source sanity check.** Confirm `site/index.html`'s `<body>` now contains no raw `<nav>`, hardcoded button class strings, or repeated card/section-header markup — only component tags plus the two decorative background-blur `<div>`s in the Services section and the photo-placeholder banner (both page-specific content, not components).

- [ ] **Step 3: Commit (if Step 2 required any cleanup).** Dispatch to `commit-specialist` only if Step 2 uncovered leftover raw markup that needed removing; otherwise this task requires no commit since Task 5's commit already represents the completed migration.
