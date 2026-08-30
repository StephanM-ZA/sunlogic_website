# site-tailwind — archived

The original Sunlogic build: CDN Tailwind, `shared/tokens.js`, and the
`<sl-*>` component library. **Superseded by `site-daylight/`**, which is a
complete rewrite with no Tailwind, no CDN dependency, `<dl-*>` components and
`shared/sunlogic.css`.

Kept for reference only. Do not edit, and do not deploy.

## Salvaged out of here

- `robots.txt` → `site-daylight/robots.txt` (Disallow list rewritten for the
  pages that actually exist now)
- `sitemap.xml` → rebuilt from scratch at `site-daylight/sitemap.xml`
- `images/` → `site-daylight/images/` — the brand assets: `sl_logo_white.svg`,
  `sl_logo_verticle.svg`, `sl_icon.png`, plus product renders and GIFs.
  Nothing on `site-daylight`'s pages references them yet — its wordmark is set
  in type, and every photograph slot is an explicit `[Photography pending]`
  placeholder — but they're moved across so they're ready when needed.
- `thank-you.html` → `site-daylight/thank-you.html` (a new one, wired into
  `shared/forms.js`).

## Still only here

- `component-gallery.html`, `homepage-audience-options.html`,
  `homepage-audience-options-v2.html` — prototypes for the old system.
