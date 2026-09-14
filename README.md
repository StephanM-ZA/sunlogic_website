# sunlogic_website

Three sites from one codebase: the apex company site, the Energy division and
the Electrical division. Built by `scripts/build-site.js` into `dist/`,
deployed by Cloudflare Pages watching `main`.

## Start here

| If you want to | Go to |
| --- | --- |
| **Build or change anything visual, or any copy** | **[`CI_Guide/README.md`](CI_Guide/README.md)** — the master. Index, the twenty gate rules, and the pointer to `CI_Guide/SYSTEM.md`. |
| See the components rendered | `CI_Guide/ci-guide.html`, served at `/energy/ci-guide.html` on the preview |
| Know what is open right now | [`CHECKPOINT.md`](CHECKPOINT.md) |
| Read a copy review | `docs/copy/` |
| Change the lead form's Worker | `workers/leads-relay/` |

## The four checks

```bash
node scripts/build-site.js
node scripts/conformance.js
node scripts/layout-sweep.js
npm test
```

Preview: `node scripts/preview.js 8433`, then `http://127.0.0.1:8433/energy/`.

Never bare `npx`; use `node_modules/.bin/`.
