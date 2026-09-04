# Cloudflare Pages build commands

All three sites publish through Cloudflare Pages, each project Git-connected to
`main` of `StephanM-ZA/sunlogic_website`. The apex joined them on 2026-09-03
when `sunlogic.co.za` moved off GitHub Pages.

The build command is where the gate lives. A non-zero exit there fails the
deployment and the previous one stays live, which is exactly the wanted
behaviour: a violation does not publish.

| Project | Build command | Output |
|---|---|---|
| `sunlogic-main` | `npx --no-install playwright install chromium && npm run build:main && npm test && npm run conformance:main && npm run sweep:main` | `dist/main` |
| `sunlogic-energy` | same, with `energy` throughout | `dist/energy` |
| `sunlogic-electrical` | same, with `electrical` throughout | `dist/electrical` |

Build caching is **on** for all three.

## Why each project only builds and checks its own site

Until 2026-09-04 every project ran the full thing: `npm run build` (all three
sites, including image conversion), then `npm test`, then `conformance` and
`sweep` across all 25 pages, then `npm run build:<site>` — which rebuilt its
own site a second time. Three projects doing that is the same work three times
over, and on the free plan Cloudflare builds one project at a time, so they
queue behind each other.

Measured on a real deployment before changing anything:

    queued      400s      <- two other projects ahead of it
    initialize    2s
    clone_repo    2s
    build       187s
    deploy        6s
    TOTAL       598s

The queue was the larger number, and the only way to shrink it is to shorten
the builds feeding it. Timed locally, same machine, back to back:

    full chain, as it was      142s
    scoped to one site          70s

Coverage is not reduced, and this is the part worth understanding rather than
taking on trust. The gate exists because a change to `shared/` can break a site
whose own source was untouched — so scoping it per project would be wrong IF a
shared change only rebuilt one project. It does not: every project's path
filter includes `shared/*`, `scripts/*`, `sites.config.js` and the lockfiles,
so a shared change triggers all three, and each one gates its own output.
Between them all three sites are still checked. A change to `site-energy/`
alone triggers only the energy project, which is correct — nothing else moved.

## The artifact is the build, not a rebuild

`build:<site>` now runs first and `conformance`/`sweep` audit what it produced,
rather than the site being built twice with the checks in between. Both read
`dist/` and neither writes to it, so what ships is exactly what was gated.

## The two halves of the gate

They answer different questions and neither substitutes for the other.

| Step | Question | Catches |
|---|---|---|
| `npm run conformance` | Is this in the design system? | off-palette colour, a third typeface, a shadow, Title-Cased prose, two adjacent bands sharing a ground, a fifth nav link |
| `npm run sweep` | Does the page hold together? | sideways scroll, an element past the viewport, boxes drawn over each other, text clipped by a fixed height, a collapsed child |

A heading can be perfectly on-palette while sitting on top of the logo, which
is why conformance passing is not evidence the page is fine. The sweep was
written on 2026-09-04 and immediately found a horizontal scroll of ~250px on
both division home pages below 768px, and another on `legal.html` at 320 and
360 — all three had been shipping for weeks with the conformance gate green.

It opens every page at every breakpoint the stylesheet itself declares, on both
sides of each boundary, so a new media query is swept the day it is added and
nobody has to remember to add it here.

### Cost

About 28s for all 450 page/width combinations, or roughly 13s for one site's
share of them. It runs six pages concurrently for that reason — sequentially the same sweep took 113s,
and this runs once per Pages project. A check slow enough to resent is a check
that gets switched off.

## The leads Worker

The Worker deploys through **Workers Builds**, Cloudflare's own Git integration
— the same model as Pages, and for the same reason the sites use it: GitHub is
the repository, Cloudflare is the build and deploy system. Nothing about
deployment lives in GitHub Actions, and no Cloudflare credential is stored
there.

Connected at **Workers & Pages → sunlogic-leads-relay → Settings → Build**.

| Setting | Value |
|---|---|
| Repository | `StephanM-ZA/sunlogic_website` |
| Branch | `main` |
| Root directory | *(repo root — leave empty)* |
| Build command | `npm ci && npm test` |
| Deploy command | `npx wrangler deploy --config workers/leads-relay/wrangler.toml --env=""` |

**Root directory is the repo root, not `workers/leads-relay`.** Two things
force that and both are easy to get wrong:

- there is no `package.json` inside the Worker directory — its dependencies,
  and `npm test`, come from the root;
- `mailer.mjs` imports the email templates from `../../../emails/`, which is
  above the Worker directory entirely. There is exactly one copy of every
  template and the Worker bundles it at build time, so a build rooted inside
  `workers/leads-relay` cannot see them.

`--env=""` targets the top-level (production) environment explicitly. wrangler
only *warns* when a config defines multiple environments and none is named,
and a warning is a poor guard against deploying staging over production.

`npm test` in the build command is not ceremony: the Worker's logic is pure
and covered — rotation, division mapping, expiry, the mail redirect — and a
lead pipeline is the wrong place to discover a regression afterwards.

### Why this exists

The three sites deployed themselves; the Worker did not, because a Pages
project builds only the site it is pointed at. `workers/leads-relay` was
deployed by hand with `wrangler deploy`, which is a step someone has to
remember after every change to the lead pipeline — and the failure mode is
silent. The code is merged, the tests pass, the repository says the bug is
fixed, and production is still running the old Worker.

### Watch the email templates

`emails/**` is part of the Worker's build input. Editing a template changes
what customers and directors receive, and it only takes effect when the Worker
is rebuilt. If Workers Builds is ever configured with a path filter, `emails/`
must be in it alongside `workers/leads-relay/`.

## Rollback

The build command each project had before the gate. Paste it back into
Settings → Build → Build configuration and the old behaviour returns; nothing
else needs undoing.

| Project | Previous build command |
|---|---|
| `sunlogic-energy` | `npm run build:energy` |
| `sunlogic-electrical` | `npm run build:electrical` |
| `sunlogic-main` | `npm run build:main` |

To drop only the layout sweep and keep the design gate, remove
`&& npm run sweep` from the command and leave the rest alone.

## GitHub is the repository, and nothing else

There are no GitHub Actions workflows. Both were removed on 2026-09-04:
`deploy-site.yml`, which published to GitHub Pages, and `lighthouse-ci.yml`,
which ran the performance budgets. Everything that builds, checks or deploys
runs on Cloudflare — three Pages projects and one Workers Builds project — and
no Cloudflare credential is stored in GitHub at all.

Two things were given up with them. Both were deliberate, and both are written
here so nobody re-discovers them as surprises.

### The GitHub Pages rollback target is gone

`deploy-site.yml` was kept after the apex cutover as somewhere to roll back to:
restore the four A records and a current, gated build is serving again.

The replacement is better, and was always available: **Cloudflare Pages keeps
every previous deployment**. Workers & Pages → the project → Deployments →
"Rollback to this deployment" puts an earlier build back immediately, with no
DNS change and no propagation wait. It rolls back the *build*, which is the
thing that is usually wrong, rather than moving the whole apex to a different
host.

### Lighthouse budgets are no longer enforced automatically

`npm run lighthouse` still works and `lighthouserc.js` is unchanged; nothing
about the budgets was deleted, only the thing that ran them on every push.

    npm run lighthouse

Run it before a release, or after a change that touches images, fonts or
anything in the critical path. It needs Chrome — locally, point `CHROME_PATH`
at a `chrome-headless-shell` binary; `scripts/lighthouse.js` explains where it
looks and errors with instructions if it cannot find one.

This was measured, not assumed: the Lighthouse workflow took **7 to 14
minutes**. Folding it into the Pages build command would have added that to
every deployment, on each of the three projects — recreating exactly the
sixteen-minute wait the build command was trimmed to avoid. A check that slow
gets switched off, and a check that has been switched off is worse than one
that was never automated, because the repository still looks like it has one.

The assertion-count guard in `scripts/lighthouse.js` stays regardless: it
refuses to report a pass when zero pages were audited. It is what caught
Lighthouse "auditing" this site for weeks while opening nothing, and it is
worth just as much on a run somebody starts by hand.

## Why `npm run build` runs before the per-site build

`npm run conformance` audits `dist/`, and it audits all three sites because
`shared/` is copied into each one. A change to `shared/sunlogic.css` can break
a site whose own source directory was untouched, so the gate has to see
everything before the per-site build produces what ships.

## Why the per-site build runs last

Rebuilds on its own so the artifact that ships is produced by a single explicit
step. Same environment as the gate's build above, so the output is identical —
this is for clarity about what ships, not a fix-up. See
`scripts/build-site.js:isProductionBuild`.

## Chromium on the Cloudflare builder

`npm run conformance` needs a browser and the build image ships none, hence the
`playwright install` prefix. Verified on all three projects:

- **`--with-deps` is not needed and should not be used.** It shells out to
  `apt-get`, which has no root on the builder. Plain
  `npx --no-install playwright install chromium` succeeds.
- **`--no-install` is not decorative.** It forces the local binary from
  `node_modules` instead of resolving `playwright` from the registry. A bare
  `npx` in this repo once fetched a name-squatted `lhci` package; the flag is
  the standing answer to that.
- Cloudflare runs `npm ci` before the build command, so `node_modules` exists
  by the time this runs.
- Build cache is **disabled** on these projects, so Chromium is re-downloaded
  every build (~30-60s). Enabling the Beta build cache, or setting
  `PLAYWRIGHT_BROWSERS_PATH=0` so the browser lands inside `node_modules`,
  would avoid that. Neither is in place — the builds are fast enough.

## Overriding a blocked deploy

Set `SL_CONFORMANCE_OVERRIDE` to a non-empty reason in the project's
environment variables. The gate passes and prints a banner naming the reason.
Remove it once the finding is fixed — it is deliberately coarse and
deliberately loud, because the alternative is a per-finding waiver list, which
is a baseline arrived at one line at a time.

## Doing this by API rather than by hand

The dashboard is fine for one project. For all three, the authenticated
wrangler session already carries `pages:write`, so the build command can be
read and set directly — `GET` and `PATCH` on
`/accounts/{account}/pages/projects/{project}`, with the whole `build_config`
object (`build_command`, `destination_dir`, `root_dir`) sent on the PATCH, and
`POST .../deployments` to trigger a build.

One gotcha: the OAuth token in the wrangler config goes stale, and a stale one
returns a bare `Authentication error` that reads like a permissions problem
rather than an expiry. Run any `wrangler` command first to refresh it, then
re-read the token.
