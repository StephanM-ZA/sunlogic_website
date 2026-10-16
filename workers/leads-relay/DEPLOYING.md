# Deploying the leads-relay Worker

**Read this before running `wrangler deploy` on this Worker.**

## The rule

```bash
npm run worker:deploy
```

That deploys and then immediately probes every route. Use it instead of a bare
`wrangler deploy`.

Before you run it: `git pull`, and confirm `git status` shows a clean tree for
`workers/leads-relay`. If someone else has uncommitted work in there, stop and
talk to them rather than shipping a half-finished change on their behalf.

## Why this is not bureaucracy

**`wrangler deploy` ships the whole script, not a diff.** Deploy from a
checkout that is behind and you silently delete whatever anybody else added.
Nothing errors. The deploy prints success and lists the bindings. The only
symptom is a route that worked an hour ago returning 404.

Two sessions work on this Worker. It has happened twice, both times to
`/uploads/brief`:

- **2026-10-15.** `/resend/webhook` was live and `/uploads/brief` was gone. A
  deploy had been made from a tree predating `63c1366`.
- **2026-10-16.** The same route, the same way, the day after.

Both times the first sign was a person filling in a twenty-field project brief
and being told **"Load failed"** — because a 404 on the CORS preflight reaches
the browser as a bare network error with nothing in it to diagnose. Both times
it took a live `wrangler tail` and a coincidence of timing to find.

`npm run worker:smoke` turns that into one line of output.

## What the smoke test checks

| Route | Expect | Why it is in the list |
|---|---|---|
| `OPTIONS /uploads/brief` | 204 | Brief photo and document uploads |
| `OPTIONS /leads/contact` | 204 | Contact form on all three sites |
| `OPTIONS /leads/calculator` | 204 | Solar calculator report form |
| `OPTIONS /resend/webhook` | 405 | Delivery confirmations (POST only, so 405 is correct) |

It asks "is the handler still wired up", not "is it correct" — the routes you
changed are the ones you were going to test anyway. These are the ones you
did *not* touch, which is exactly where this failure hides.

Point it elsewhere with `SMOKE_BASE_URL`, e.g. at the staging Worker.

## Also worth doing

There is no `[observability]` block in `wrangler.toml`, so Worker logs are not
queryable after the fact. Both incidents above needed a live tail running at
the moment someone retried. Adding observability would make the next one a
lookup instead of a stakeout.
