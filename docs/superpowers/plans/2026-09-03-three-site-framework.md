# Three-Site Framework: Build Plan

**Date:** 3 September 2026
**Goal:** Restructure the repo and hosting so Sunlogic runs as three sites off one shared design system, without changing how any page currently looks or reads.

---

## Scope

**In scope: framework and structure only.**
- Repo layout, shared design system extraction
- Build script parameterisation, three outputs
- Cloudflare Pages setup, three projects
- DNS, redirects, cache rules
- Per-site nav, footer, canonical URLs and enquiry routing

**Explicitly out of scope, to be done systematically afterwards:**
- Writing or splitting any page copy
- Deciding which content lands on which site
- The Backup section and its online store
- The Smart pages
- Blog post allocation
- Any visual or layout change

At the end of this plan all three sites exist, build, deploy and resolve. The energy site is the current site under a new domain. The other two are working shells. **No page content is moved.** That is deliberate: it separates the risky infrastructure change from the content change, so if something breaks it is obvious which one caused it.

---

## Target structure

```
sunlogic.co.za              → company: who Sunlogic is, credentials, both divisions, contact
energy.sunlogic.co.za       → solar · backup · smart
electrical.sunlogic.co.za   → electrical · smart
```

---

## Current state

- **Hosting:** GitHub Pages, deployed by `.github/workflows/deploy-site.yml` on push to `main`
- **Domain:** `sunlogic.co.za` via `site-daylight/CNAME`, A records at GitHub's IPs. Cut over 31 August 2026, so three days old
- **Build:** `scripts/build-site.js` copies `site-daylight/` → `dist/`, optimises images to WebP and rewrites references, stamps the commit SHA, minifies CSS and JS
- **Design system:** `site-daylight/shared/` (`sunlogic.css`, `components.js`, `icons.js`, `fonts/`)
- **Pages:** 16 HTML files, all hardcoding `sunlogic.co.za` in canonical, `og:url`, `og:image`, `twitter:image`
- **Nav and footer:** link lists hardcoded inside `DlNavBar` and `DlFooter` in `components.js`
- **Live cache header:** `cache-control: max-age=600`, fixed by GitHub Pages and not overridable

---

## Why Cloudflare Pages

Three decisions force it, in descending order of importance.

1. **301 redirects.** URLs are moving and GitHub Pages cannot issue redirects. The only workarounds are meta-refresh or JavaScript, both weaker signals than a real 301. Cloudflare Pages does this with a `_redirects` file.
2. **One custom domain per repo.** Three domains on GitHub Pages means three repos, which means a duplicated design system that drifts, or submodules and friction on every change.
3. **Cache control.** `max-age=600` is the largest single item in both PageSpeed reports and is unfixable where it currently sits.

Pages Functions are also available if the Backup store later needs a runtime, but that is not a reason to move today.

---

## Target repo layout

```
shared/                     ← design system, single source of truth
  sunlogic.css
  components.js
  icons.js
  sunlogic-check.js
  forms.js
  fonts/

site-main/                  → dist/main/         → sunlogic.co.za
site-energy/                → dist/energy/       → energy.sunlogic.co.za
site-electrical/            → dist/electrical/   → electrical.sunlogic.co.za

sites.config.js             ← per-site domain, nav, footer, lead route
scripts/build-site.js       ← builds one site, called three times
```

**`shared/` is copied into each site's output at build time.** This matters: it means every page keeps referencing `shared/sunlogic.css` exactly as it does today, so **no HTML path rewriting is needed anywhere**. The design system is single-source in the repo and duplicated only in build artefacts, which are disposable.

---

## Phase 1: Extract the shared design system

Repo-only change. Nothing deploys differently.

- [ ] `git mv site-daylight/shared shared/`
- [ ] `git mv site-daylight site-energy/`
- [ ] Update `scripts/build-site.js` so it copies `shared/` into the output alongside the site's own files
- [ ] Run `npm run build`
- [ ] **Verify:** `dist/` output is byte-identical to the previous build except for the build-SHA stamp. Diff it. If anything else differs, stop and find out why
- [ ] Serve `dist/` locally, check three pages render with correct CSS, fonts and icons, zero console errors
- [ ] Commit

**Risk:** low. Path structure inside the output is unchanged.

---

## Phase 2: Introduce per-site config

- [ ] Create `sites.config.js` exporting one entry per site:

```js
{
  key: 'energy',
  domain: 'https://energy.sunlogic.co.za',
  src: 'site-energy',
  out: 'dist/energy',
  nav: [ /* link list */ ],
  footer: [ /* link list */ ],
  leadRoute: '/leads/energy',
}
```

- [ ] Extend the existing build-info stamp so it also injects the site config:
      `<script>window.SL_SITE={...}</script>` alongside the current `window.SL_BUILD`
- [ ] Change `DlNavBar` and `DlFooter` to read their link lists from `window.SL_SITE`, **falling back to the current hardcoded lists if it is absent**
- [ ] Bump `components.js?v=` across all pages
- [ ] **Verify:** the energy site renders an identical nav and footer to today
- [ ] Commit

**Risk:** medium. This touches `components.js`, which has bitten this project before. The fallback to hardcoded lists is the safety net: if the stamp fails, the nav still works.

**Do not** attempt any script-loading or `defer` changes while in this file. That is a separate, known-dangerous change.

---

## Phase 3: Three build outputs

- [ ] Create `site-main/` and `site-electrical/` as minimal placeholder sites: one `index.html` each, using the existing components, saying what the division is and linking to the others. **Placeholder content only.** Real content is a later, separate piece of work
- [ ] Update `scripts/build-site.js` to build all three from `sites.config.js`
- [ ] Add `npm run build:main`, `build:energy`, `build:electrical`, with `build` running all three
- [ ] Per-site `robots.txt`, `sitemap.xml`, `llms.txt` in each source directory
- [ ] Remove `CNAME` — Cloudflare handles domains in its dashboard, not via a repo file
- [ ] **Verify:** three outputs under `dist/`, each self-contained, each serving locally on its own port with correct nav
- [ ] Commit

---

## Phase 4: Cloudflare Pages, proven before DNS moves

**This is where the risk is, so it is done in an order that never has the live site depending on something unproven.**

- [ ] Create three Cloudflare Pages projects against the same GitHub repo:

| Project | Build command | Output directory |
|---|---|---|
| `sunlogic-main` | `npm run build:main` | `dist/main` |
| `sunlogic-energy` | `npm run build:energy` | `dist/energy` |
| `sunlogic-electrical` | `npm run build:electrical` | `dist/electrical` |

- [ ] Let each deploy to its default `*.pages.dev` URL
- [ ] **Verify on `*.pages.dev`, before any DNS change:** all three build and deploy, assets load, nav is correct per site, no console errors, no mixed content
- [ ] Fix anything broken here, while the live site is still untouched on GitHub Pages

**Nothing is live to customers at this point. `sunlogic.co.za` is still served by GitHub Pages exactly as it is now.**

---

## Phase 5: DNS cutover

Requires the user. Account access and DNS are not mine to change.

- [ ] Confirm whether `sunlogic.co.za` DNS is already on Cloudflare nameservers or still elsewhere. **This was flagged as unknown in a previous session and has never been answered.** Everything below depends on it
- [ ] If not on Cloudflare, move nameservers first and let them propagate before anything else
- [ ] Attach custom domains in each Pages project:
      - `sunlogic.co.za` (and `www`) → `sunlogic-main`
      - `energy.sunlogic.co.za` → `sunlogic-energy`
      - `electrical.sunlogic.co.za` → `sunlogic-electrical`
- [ ] Wait for certificates to issue on all three
- [ ] **Verify:** all three resolve over HTTPS with valid certificates
- [ ] **Disable the GitHub Pages deployment** once Cloudflare is serving, so the two do not compete. Either delete `.github/workflows/deploy-site.yml` or disable Pages in repo settings

**Rollback:** revert the A records to GitHub's IPs (185.199.108.153, .109.153, .110.153, .111.153) and re-enable GitHub Pages. Keep the workflow file until the cutover is proven, so rollback is one DNS change.

---

## Phase 6: Redirects

Only meaningful once content actually moves, but the mechanism goes in now and is tested with the placeholder sites.

- [ ] Add `_redirects` to each site's source directory, copied to output by the build
- [ ] Redirects needed **when content moves in the later content phase**, recorded here so they are not forgotten:

| From (on `sunlogic.co.za`) | To |
|---|---|
| `/solar.html` | `https://energy.sunlogic.co.za/solar.html` |
| `/energy-management.html` | `https://energy.sunlogic.co.za/smart.html` |
| `/electrical.html` | `https://electrical.sunlogic.co.za/electrical.html` |
| `/blog-3-essential-checks.html` | electrical site |
| `/blog-coc-two-year-myth.html` | electrical site |
| `/blog-ev-home-charging.html` | electrical site |
| `/blog-why-your-bill-went-up.html` | energy site |
| `/blog-rent-to-own.html` | energy site |
| `/blog-off-grid-vs-grid-tied.html` | energy site |
| `/blog-five-tips-load-shedding.html` | energy site |

- [ ] **Verify each redirect returns a real 301**, with `curl -I`, not a 302 and not a meta-refresh

---

## Phase 7: Cache rules

- [ ] Cloudflare Cache Rule: long edge TTL for `/shared/*`, `/images/*` and font files
- [ ] Short or default TTL for HTML, so content changes appear promptly
- [ ] **Verify:** `curl -I` shows the intended `cache-control` on an asset, and that it is no longer `max-age=600`

---

## Phase 8: Final verification

- [ ] All three domains resolve over HTTPS with valid certificates
- [ ] Each site's nav and footer point only at its own pages, plus intended cross-links
- [ ] Canonical, `og:url` and `twitter:image` on every page carry that site's own domain
- [ ] Zero console errors on every page of every site
- [ ] Contact form submits and routes to the correct enquiry stream per site
- [ ] `robots.txt` and `sitemap.xml` correct and site-specific on all three
- [ ] A PageSpeed run on each site, as a new baseline
- [ ] GitHub Pages workflow disabled, no competing deploys

---

## Risks

| Risk | Mitigation |
|---|---|
| `components.js` changes break rendering | Fallback to hardcoded nav/footer lists if `SL_SITE` is absent. Verify before commit. No script-loading changes in the same pass |
| DNS cutover takes the live site down | Everything proven on `*.pages.dev` first. Rollback is one DNS change back to GitHub's IPs |
| Two hosts serving simultaneously | GitHub Pages workflow disabled immediately after cutover is proven |
| Ranking lost on moved URLs | 301s via `_redirects`, verified with `curl -I`. Cheapest possible moment to move, since the URLs are three days old |
| Design system drifts between sites | `shared/` is single-source in the repo, duplicated only into disposable build output |

---

## Needs the user

1. **Is `sunlogic.co.za` DNS already on Cloudflare nameservers, or still elsewhere?** Unanswered from a previous session, and Phase 5 cannot start without it
2. **Cloudflare account access** to create the three Pages projects
3. **Confirm `energy.` as the subdomain** rather than `solar.`
4. Confirm the GitHub Pages workflow may be removed once the cutover is proven

---

## Explicitly deferred

These are known, decided, and deliberately not in this plan:

- All page content, copy and blog allocation. Systematic, separate, afterwards
- The Backup section and its online store. Still needs its own decision: a store is an application, not a page, and the current build is a file-copier
- The Smart pages on both sites, which must be genuinely different rather than duplicates
- The uncommitted PageSpeed work from 1 September, still unreviewed on the working tree
