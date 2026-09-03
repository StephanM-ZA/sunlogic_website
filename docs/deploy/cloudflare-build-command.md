# Cloudflare Pages build commands

Two Pages projects, both Git-connected to `main` of
`StephanM-ZA/sunlogic_website`. The apex publishes through GitHub Actions for
now and joins these once the Xneelo cutover completes.

| Project | Build command | Output directory |
|---|---|---|
| `sunlogic-energy` | `npm run build && npm test && npm run conformance && npm run build:energy` | `dist/energy` |
| `sunlogic-electrical` | `npm run build && npm test && npm run conformance && npm run build:electrical` | `dist/electrical` |

## Why the build command and not a separate step

Cloudflare Pages has no pre-build hook: the build command *is* the only place
to gate. A non-zero exit there means the deployment fails and the previous one
stays live, which is exactly the behaviour wanted — a violation does not
publish.

## Why `npm run build` first

`npm run conformance` audits `dist/`, and it audits all three sites because
`shared/` is copied into each one. A change to `shared/sunlogic.css` can break
a site whose own source directory was untouched, so the gate has to see
everything before the per-site build produces what ships.

## Why the per-site build runs last

It rebuilds with Cloudflare's `CF_PAGES_BRANCH` in the environment, so
`window.SL_BUILD.prod` is `true` in the published output and the developer
badge stays out of production. See `scripts/build-site.js:isProductionBuild`.

## Overriding a blocked deploy

Set `SL_CONFORMANCE_OVERRIDE` to a non-empty reason in the project's
environment variables. The gate passes and prints a banner naming the reason.
Remove it once the finding is fixed — it is deliberately coarse and deliberately
loud, because the alternative is a per-finding waiver list, which is a baseline
arrived at one line at a time.

## Chromium on the Cloudflare builder

`npm run conformance` needs a browser. Cloudflare's build image does not ship
one, so the build command needs `npx playwright install --with-deps chromium`
prepended on first use, or `PLAYWRIGHT_BROWSERS_PATH=0` set so the download is
cached in `node_modules` between builds. Verify on the first gated deployment
and correct this file with whatever actually worked.
