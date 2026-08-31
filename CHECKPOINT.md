# Checkpoint — Sunlogic Website

**Saved:** 2026-08-31 (session 5 — lead-capture backend built, tested, and shipped end-to-end)

## Current task + goal

Built the real backend for lead capture, which didn't exist before this session (both forms silently no-op'd against `PENDING_BACKEND`). Full flow is now live, tested with real submissions to the user's own inbox, and committed/pushed to `main`.

**Architecture:** Cloudflare Worker (`workers/leads-relay/`) + D1 queue with a Cron retry loop, durable independent of the iMac → n8n workflow on the iMac (`Sunlogic — Leads Relay`, id `aEER87lVVem4ryst`) → SMTP email + Google Sheets logging.

## What was done this session (all committed, pushed to `origin/main`)

1. **Cloudflare Worker + D1 lead queue** (`workers/leads-relay/`) — validates both lead types (contact/calculator), persists durably, fire-and-forget delivery to n8n with a shared secret, Cron Trigger retries every 5 min if n8n/iMac is down. Verified live: unpublished n8n → submission queued → republished → auto-delivered.
2. **n8n workflow wired up** (iMac, coordinated via `serverMonitor` per the change-control rule) — Webhook → Extract Body → Switch(contact/calculator) → Send email(s) → Log to Google Sheet ("Sunlogic Leads") → Respond 200.
3. **Frontend wiring**: `site-daylight/contact.html` and both `plugin-calculator` instances on `solar.html` now point at the real Worker URL (`https://sunlogic-leads-relay.smarais-za.workers.dev/leads/{contact,calculator}`) instead of `PENDING_BACKEND`.
4. **Found and fixed a real production bug** during user's own live testing: `site-daylight/shared/forms.js` required-field selector matched `<dl-field required>` wrapper elements (no `.value` prop) instead of actual `input`/`select`/`textarea` — crashed every contact-form submission before it could send. Commit `96b043b`.
5. **Branded HTML emails built and shipped**: `emails/sales-notification.html` (to sales@sunlogic.co.za) and `emails/client-confirmation.html` (to the visitor) — real Sunlogic brand tokens, real logo (inline base64, `emails/assets/logo-email.png`), both injected into their n8n Send Email nodes and published. Commit `d8fbf43`.
6. **Dark-mode rendering bug fixed**: mail clients (Apple Mail, Gmail app, Outlook.com) were auto-inverting the emails' colors. Fixed with `color-scheme` meta tags, full `@media (prefers-color-scheme: dark)` + Gmail `[data-ogsc]` overrides on every background/text/border color, plus `bgcolor` HTML attributes as a hard fallback. Verified by the user in their own inbox. Commit `87f37e7`.
7. **Unrelated drive-by fix**: homepage fleet-live stat cards were polling every 15 min but claiming "23 min stale" — `SL_FLEET_POLL_MS` in `site-daylight/shared/components.js` changed to 2 min. Commit `270ed1f`.

## Key files

- `workers/leads-relay/src/index.js` — Worker logic, CORS allowlist (prod origins only, temp localhost entry already reverted).
- `workers/leads-relay/wrangler.toml` — D1 binding, Cron trigger, `N8N_WEBHOOK_URL` var.
- `emails/sales-notification.html`, `emails/client-confirmation.html`, `emails/assets/logo-email.png`, `emails/README.md` — source-of-truth for the n8n email nodes. **n8n does not read these files** — edit here, then re-paste into n8n's Send Email nodes and republish, or the two drift.
- `site-daylight/shared/forms.js` — contact form logic (bug fixed).
- `site-daylight/contact.html`, `site-daylight/solar.html` — real Worker URLs wired in.

## Standing constraints (carry forward)

- iMac changes (n8n workflow edits, restarts, etc.) route through `serverMonitor` per the global change-control rule — already done correctly this session, logged appropriately.
- Never paste real secrets (SMTP passwords, RELAY_SECRET, API tokens) into chat or committed files.
- Email templates: n8n is the live copy; the repo files are the source of truth but require manual re-sync (no automation exists to push repo → n8n).

## Uncommitted / untracked (left alone, not part of this work)

- `.claude/launch.json` — local browser dev config.
- `Sunlogic_Feedback_Decisions.docx` / `.pdf` — unfamiliar documents, restrictive permissions, unreviewed content. Did not commit without knowing what's inside.
- `workers/leads-relay/.wrangler/` — Wrangler's local build cache; should probably be added to `.gitignore` rather than committed.

## Next steps (if picked up later)

1. Decide what to do with the 4 untracked items above (gitignore `.wrangler/`, confirm the docx/pdf are meant to be here or move them out, decide if `.claude/` should be committed or ignored).
2. No other known outstanding work on the lead-capture backend — it's live, tested, and both emails are branded + dark-mode-safe.
3. `plugins/review-carousel/` Task 4 (real review content) is still paused from session 4 — resume when the user supplies real Google review data (name, rating, text, URL, optional photo). Not touched this session.

## Branch / repo state

On `main`, up to date with `origin/main` as of commit `96b043b`. No open worktrees. No blocked/paused SDD plans from this session.
