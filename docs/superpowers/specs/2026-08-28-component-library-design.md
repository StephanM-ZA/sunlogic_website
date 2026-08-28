# Sunlogic Web Component Library — Design

**Status:** Approved for implementation planning
**Date:** 2026-08-28
**Scope:** Static-HTML prototype phase only (current target: design sign-off, pre-WordPress build)

## Problem

`site/index.html` currently duplicates structure and style in three ways:

1. **Design tokens** — the full Tailwind config object (colors, type scale, spacing, shadows,
   radii) lives inline in a `<script id="tailwind-config">` tag. Every new page would need to
   copy this ~2000-character blob verbatim, and any token change would need to be applied
   per-file.
2. **Repeated structural patterns** — the eyebrow-badge + H2 + subtext "section header" block
   appears three times (Services, Process, Why Choose Us) with class-level drift already visible
   between copies. Buttons, cards, and form fields show the same pattern.
3. **Site chrome** — nav bar and footer exist once today, but every future page (Services,
   Contact, Get a Quote, etc.) would otherwise copy-paste them, multiplying any future edit.

This violates SSOT/DRY per `ui-ux-bible.md` and `frontend-bible.md` and will compound as more
pages are added.

## Approach

**Native Web Components, light DOM (no shadow root).**

Tailwind's CDN script (`cdn.tailwindcss.com`) works by scanning rendered DOM for utility classes
and injecting matching CSS globally at runtime. Shadow DOM isolates a component's internal markup
from that scan, which would silently break styling. Rendering component output into the light DOM
avoids this entirely: each component still gets real encapsulation of markup-generation and
behavior (defined once, in one file), while sharing the single global Tailwind stylesheet every
page already relies on.

This was chosen over two alternatives:
- **A static site generator (e.g. Eleventy)** — would give true build-time partials but
  introduces npm + a build command at a stage where the deliverable is still a design-approval
  prototype, not a shipping site (the real production target is WordPress, per `BRIEF.md` §9.1).
- **Server-side include templating** — simplest option, but doesn't give a real component
  *interface* (attributes, slotted content, variants) — just string concatenation of partials.

Web Components let every page stay a single static HTML file, openable directly in a browser with
zero build step, while still eliminating the duplication above.

## File layout

```
sunlogic_website/site/
├── shared/
│   ├── tokens.js         # the Tailwind config object — single source of truth
│   └── components.js     # customElements.define(...) for every component below
└── index.html            # rewritten to consume the components
```

Every page's `<head>` becomes:

```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script src="shared/tokens.js"></script>
<script src="shared/components.js" defer></script>
```

`tokens.js` sets `tailwind.config = {...}` — it must load after the CDN script and before page
content needs styling. `components.js` registers the custom elements and can defer since it only
needs to run before first paint of component tags, which Tailwind's CDN mutation observer picks
up regardless of exact timing.

## Components (v1)

| Element | Purpose | Key attributes |
|---|---|---|
| `<sl-button>` | Every button/link styled as a button (Get a Quote, Submit Enquiry, Contact Us, nav CTA) | `variant="primary\|secondary\|dark"`, `size="md\|lg"`, `href` (renders `<a>` vs `<button>`) |
| `<sl-section-header>` | The eyebrow-badge + H2 + subtext block used in Services/Process/Why Choose Us | `eyebrow`, `heading`, `subtext` (optional), `on-dark` (boolean, for the Process section's dark background) |
| `<sl-card>` | Service card and benefit card — same anatomy (icon box + heading + body + optional checklist), different content density | `icon`, `heading`, `variant="service\|benefit"`; checklist items passed as slotted `<li>` children |
| `<sl-field>` | Every labeled input/select in the assessment form | `label`, `type="text\|email\|tel\|select"`, `placeholder`, `name`; `<option>` children when `type="select"` |
| `<sl-nav-bar>` | Site chrome — nav | `active` (which nav item to underline, for future pages) |
| `<sl-footer>` | Site chrome — footer | none needed yet (static content) |

**What stays hardcoded (intentionally):** actual page content — headlines, body copy, image URLs.
Components accept content as attributes/slotted children; they do not own copy. This eliminates
*structural and style* duplication, not content.

## Migration

1. Extract the current inline tailwind-config script verbatim into `shared/tokens.js`.
2. Build `shared/components.js` with the six components above, matching the exact Tailwind
   classes already verified against the real Stitch `code.html` (§ prior session work) — this is
   a refactor of proven markup, not a redesign.
3. Rewrite `site/index.html` to use the new tags in place of the raw markup.
4. Visual regression check: screenshot the rewritten page section-by-section against the current
   render (same method used to verify the Stitch-fidelity pass) to confirm zero visual drift.

## Out of scope for v1

- Mobile nav menu behavior (hamburger toggle currently has no JS — not introduced here either)
- Form submission handling (forms have no backend yet)
- Additional pages (Services, Contact, etc.) — this spec only covers extracting the library from
  the existing homepage; rollout to new pages is future work that consumes this library
- Any change to visual design, copy, or the open decisions tracked in `BRIEF.md` §12
