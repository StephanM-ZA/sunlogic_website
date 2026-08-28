# Sunlogic Site Architecture — Post-Homepage Expansion

**Status:** Approved direction, in progress. Written 2026-08-28 during the pivot from single-homepage prototype to full site.
**Supersedes (for sitemap purposes only):** `BRIEF.md` §4 — that sitemap (Services/Projects/Resources/About as separate top-level sections) is replaced by the structure below. `BRIEF.md` remains authoritative for positioning, copy direction, and the §12 open decisions; this document is IA/wireframe only, per explicit instruction not to write copy here.
**Related:** [[component-library.md]], [[design-tokens.md]].

## Why this diverges from BRIEF.md §4

BRIEF.md §12 item #1 — "B2C installer, B2B distributor, or both?" — was the blocking decision nothing else could proceed without. The audience split below (Residential / Small Business / Commercial) answers it directly: all three, cleanly separated by audience rather than by a B2C/B2B split. That's a real decision made in conversation, not yet reflected back into BRIEF.md itself.

## Site scope

```
Home (/)
Solar (/solar.html)              — Residential, Small Business, Commercial sections
Electrical (/electrical.html)    — Residential, Small Business, Commercial sections
Energy Management (/energy-management.html) — Residential, Small Business, Commercial sections
Blog (/blog.html)
Contact (/contact.html)          — includes a "Meet the Team" section
```

Deliberately **not** in scope for now: a separate Projects/Portfolio section, a separate About section, Resources/FAQs/Calculator as their own pages, Get a Quote as its own page (the existing homepage `sl-panel` form covers that role for now).

### Nav

```
[Logo]  Home | Solar | Electrical | Energy Management | Blog | Contact | [Free Assessment]
```

Flat, no dropdown — chosen over grouping Solar/Electrical/Energy Management under a "Services ▾" menu, to keep the nav simple.

## Homepage

Existing sections unchanged, plus one new section inserted between the hero and "What We Offer":

**"Who We Serve"** — `sl-section-header` + three `sl-audience-row` components (Residential, Small Business, Commercial), each a photo/dark-panel row alternating sides, each with **Solar** and **Electrical** buttons linking into the matching section of the two service pages (anchors like `solar.html#residential`). Energy Management is not represented in this homepage summary — it stays a secondary/adjacent offering, discoverable via nav and from within the two primary service pages, not a third homepage row. *(Revisit if that turns out wrong once real copy exists.)*

## Service pages (Solar / Electrical / Energy Management)

All three follow the same template:

1. **Page hero** — service name, short intro, primary CTA. Simpler than the homepage hero (no assessment form panel duplicated here — that lives on the homepage and, later, a dedicated quote page).
2. **Three audience sections, in order: Residential → Small Business → Commercial.** Each one is a "rich" mini landing page, not a compact summary (that's what the homepage rows already do) — per BRIEF.md §5.2's service-page spec, but scoped to one audience at a time and repeated three times on the same page rather than split into six separate URLs. Each audience section includes:
   - Sub-heading + overview copy
   - Benefits (reusing `sl-card` benefit variant, or a plain list — decide per page once real content exists)
   - Process/steps where relevant (reusing `sl-step`)
   - An FAQ block specific to that audience (**new component needed — `sl-faq`, not built yet**)
   - A CTA specific to that audience
3. Anchors (`id="residential"`, `id="small-business"`, `id="commercial"`) on each audience section, matched by the homepage `sl-audience-row` buttons' hrefs.

## Contact page

Contact form/details (per BRIEF.md §5.6) plus a "Meet the Team" section embedded on the same page (per BRIEF.md §5.5's team content, but not a separate `/about/team/` page).

## Blog

Structure deferred until content exists — BRIEF.md §5.4 remains the reference for the eventual template (categories, single-post layout) when that work starts.

## Open items this creates

- **`sl-faq` component doesn't exist yet** — needed before any service page's FAQ block can be built for real. Build alongside the first service page.
- **BRIEF.md's own sitemap (§4) is now stale** relative to this document and should be reconciled or annotated once the person who owns BRIEF.md is looped in — this doc does not edit BRIEF.md itself.
- Energy Management's exact scope (battery storage? monitoring? backup power? EV charging?) is not defined anywhere yet — structural placeholder only, content pending.
