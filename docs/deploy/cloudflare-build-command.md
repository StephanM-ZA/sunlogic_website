# Cloudflare Pages build commands

All three sites publish through Cloudflare Pages, each project Git-connected to
`main` of `StephanM-ZA/sunlogic_website`. The apex joined them on 2026-09-03
when `sunlogic.co.za` moved off GitHub Pages.

The build command is where the gate lives. A non-zero exit there fails the
deployment and the previous one stays live, which is exactly the wanted
behaviour: a violation does not publish.

| Project | Build command | Output |
|---|---|---|
| `sunlogic-energy` | `npx --no-install playwright install chromium && npm run build && npm test && npm run conformance && npm run build:energy` | `dist/energy` |
| `sunlogic-electrical` | same, ending `npm run build:electrical` | `dist/electrical` |
| `sunlogic-main` | same, ending `npm run build:main` | `dist/main` |

Set on all three on 2026-09-03. Each one's first gated build passed: 28 tests,
34/34 pages at 412x823 and 1440x900, 0 fails 0 warns.

## Rollback

The build command each project had before the gate. Paste it back into
Settings → Build → Build configuration and the old behaviour returns; nothing
else needs undoing.

| Project | Previous build command |
|---|---|
| `sunlogic-energy` | `npm run build:energy` |
| `sunlogic-electrical` | `npm run build:electrical` |
| `sunlogic-main` | `npm run build:main` |

## Where GitHub Actions fits now

`.github/workflows/deploy-site.yml` still runs the same gate on every push and
still publishes to GitHub Pages — but nothing points at GitHub Pages since the
apex cutover. It is kept deliberately, as the rollback target for the DNS
change: restoring the four A records (185.199.108-111.153, DNS only) puts a
current, gated build back in service. Retire it only when that rollback is no
longer wanted.

Until then the gate runs twice per push, once in Actions and once per Pages
project. That is redundant, not wrong.

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
