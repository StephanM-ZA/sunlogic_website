# Spec: Brief photo upload workflow (n8n)

**For the `serverMonitor` project to build.** Everything here is an iMac
change and goes through that gate; this document is written from the website
side, which owns the other half of the contract.

Status: specified, not built. Written 2026-10-15.

---

## Why this exists

The project brief form at `https://sunlogic.co.za/project-brief` is live and
working. One piece is missing: photos.

The old WordPress site hosted uploaded photos and n8n fetched them from
`sunlogic.co.za`. That endpoint died with the rebuild. n8n stores a *link* to
each photo, never the file, so something has to hold the bytes and hand back a
URL.

Two other routes were built or considered and dropped:

- **Cloudflare R2** — works, but enabling it wants a card on file even though
  the free tier would never bill at this volume. Rejected by the owner.
- **The Cloudflare Worker uploading to Drive with a service account** — built
  and tested, then dropped because it needs a Google Cloud project and service
  account created from scratch when n8n already holds a working Drive
  credential.

This route uses the Drive connection n8n already has.

---

## What must NOT change

**`Sunlogic Project Brief (Webhook → PostgreSQL)`, id `e86TQUi0qAbwqqVk`, is
not to be edited.** It is live, it works, and it already does the right thing
with photos:

```
Attach DB Photos    → url: {{ $('PostgreSQL Insert').item.json.upload_photos_db }}
Attach Other Photos → url: {{ $('PostgreSQL Insert').item.json.upload_photos }}
```

Those nodes attach whatever URL the column holds. A Google Drive link works
there with zero change.

Its three known defects (dead `Delete WP Photo` calls to the WordPress
endpoint, a hard-coded `X-Delete-Secret` in the workflow JSON, and an
unauthenticated webhook) are tracked separately in `docs/project-brief.md` and
are **out of scope here**.

## Why this has to be a second workflow

The brief workflow runs *after* the brief is submitted. By then the photo URLs
must already be in the payload. So the thing that stores photos has to answer
*before* the brief is posted — it cannot be a branch of the existing workflow.

Sequence the page already implements:

```
1. for each photo:  POST the file  →  (this new workflow)  →  returns its URL
2. once all have returned:  POST the brief  →  existing workflow
```

---

## The contract

The page already speaks this, against the Cloudflare Worker. Match it exactly
and the page change is a single attribute.

### Request

`POST https://hooks.digitaloperations.co.za/webhook/sunlogic-brief-photo`

One photo per request. The page uploads sequentially and only posts the brief
once every photo has returned a URL.

**Recommended body: `multipart/form-data`,** one file part named `file`. n8n's
Webhook node parses multipart into a binary property automatically, which is
the better-trodden path than raw-body handling. This differs from what the
page sends today (raw body) — see "Website-side changes" below; that change is
small and is ours to make.

Headers the page sends, both optional and neither load-bearing:

| Header | Purpose |
|---|---|
| `X-File-Name` | original filename, for naming the Drive file |
| `X-Brief-Reference` | the brief's quote/invoice number, so one job's photos group together when the folder is sorted by name |

With multipart, the filename also arrives in the part itself, so `X-File-Name`
is belt and braces.

### Response

**This shape is required**, because `shared/forms.js` checks
`response.ok && body.url`:

```json
{ "ok": true, "url": "https://drive.google.com/file/d/<id>/view" }
```

On failure, any non-2xx with a JSON body. An `error` string is surfaced in the
browser console and helps debugging:

```json
{ "ok": false, "error": "unsupported file type" }
```

The page treats a failed upload as **fatal to the whole submission** — it
aborts and shows "Something went wrong. Please call us instead." rather than
submitting a brief with photos silently missing. So a 500 here costs the whole
brief, not just one photo.

### CORS — load-bearing, verify it

The browser posts this cross-origin from `https://sunlogic.co.za`. The
existing brief webhook already answers a preflight correctly:

```
OPTIONS https://hooks.digitaloperations.co.za/webhook/sunlogic-project-brief
→ 204, access-control-allow-origin: https://sunlogic.co.za
       access-control-allow-methods: OPTIONS, POST
```

Those headers come from the reverse proxy in front of n8n, not from the
workflow, so a new path under `/webhook/` will **probably** inherit them.
**Verify this before building anything else** — it is the one thing that will
silently break the page while the workflow looks perfectly healthy when tested
with curl.

If the allow-list is per-path, add the new path. The allowed headers must
include `Content-Type`, `X-File-Name` and `X-Brief-Reference`.

---

## The workflow

Suggested name: **`Sunlogic Brief Photo Upload`**.

```
Webhook (POST /webhook/sunlogic-brief-photo, responseMode: responseNode)
  └─→ Validate (Code)        type and size; stop with an error response if bad
       └─→ Google Drive: upload file      binary → "Brief Photos" folder
            └─→ Google Drive: share       role reader, type anyone
                 └─→ Respond to Webhook   { ok: true, url: <view link> }
```

### Notes per node

**Webhook.** Must accept binary. Confirm the node option for the installed n8n
version — the brief webhook has `options: {}` and accepts JSON only, so this
is not inherited. `responseMode: responseNode`, same as the brief webhook.

**Validate (Code).** The Cloudflare Worker did this and it disappears with it,
so it has to be re-done here:

- Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`,
  `image/heif`, `application/pdf`.
- **Refuse `image/svg+xml`** even though it is an image. It is a script
  delivered as a picture and these links get opened from Trello cards and
  email.
- Max 15 MB per file. A 48MP phone photo is 8–12 MB, so this clears a real one
  and still refuses a video picked by mistake.

**Google Drive: upload file.** Credential `Google Drive account`
(`googleDriveOAuth2Api`, id `vKudtoSOTzuYiM8K`) — the same one the brief
workflow already uses. It is a user OAuth credential, so files land in the
owner's Drive and use the owner's quota, which is the point.

Target a **new "Brief Photos" folder**, not "Brief Documents"
(`1cDxvywgTfJfSfHW8E8MPTdhRChMJ1jQ-`). Keeping generated PDFs and raw photos
apart keeps both folders readable.

Suggested filename, which is what the Worker built and is worth keeping:

```
<X-Brief-Reference> - <original filename> (<8 random chars>)
```

The reference prefix is what makes a folder sorted by name group one job's
photos together. The random tail stops two photos of the same DB in one brief
colliding. Strip `/ \ \r \n \t` from both parts — a Drive filename is not a
path, but one containing a newline wrecks every listing it appears in, and
both values come from a browser.

**Google Drive: share.** `role: reader`, `type: anyone`. The file must be
readable without a Google account because it is opened from a Trello card and
an email by people who are not all in the workspace. The brief workflow
already shares every generated PDF exactly this way, so this is consistent
rather than new exposure — but it is worth stating plainly: a brief photo is a
picture of somebody's distribution board, and the link is the only thing
protecting it.

**Respond to Webhook.** `{ "ok": true, "url": "https://drive.google.com/file/d/<id>/view" }`.
Build the link by hand from the file id rather than trusting `webViewLink` to
be present, so the shape is stable if `fields` is ever changed.

---

## Security

This webhook will be **unauthenticated and world-reachable**, and it writes
files into the owner's Google Drive. That is a meaningfully worse exposure
than the brief webhook, which only writes rows.

A shared secret is not available: the caller is a browser on a public page and
anything it holds is public too. Options, in order of preference:

1. Rate limit the path at the reverse proxy (per IP, per minute).
2. Check the `Origin` header is `https://sunlogic.co.za` in the Validate node
   and reject otherwise. Trivially forged by a non-browser client, but it
   stops the lazy case.
3. A storage quota alert on the Drive account, so abuse is noticed.

Enforce the type and size limits regardless — they are the main thing standing
between this and someone using the Drive as free file hosting.

---

## Website-side changes (ours, once the webhook exists)

Small, and listed here so the two halves land together:

1. `site-main/project-brief.html` — point `data-dl-upload` at the new webhook
   instead of `https://leads.sunlogic.co.za/uploads/brief`. One attribute.
2. `shared/forms.js` — `dlUploadFile` currently sends the file as a raw body.
   Change it to `multipart/form-data` with the file in a `file` part, keeping
   the two headers. Roughly five lines.
3. Revert the Cloudflare Worker's Drive code (`src/drive.mjs`, the rewritten
   `/uploads/brief`, the `DRIVE_*` config). It becomes dead once this route
   exists.

Bump `?v=` on `shared/forms.js` across all three sites, per the repo rule.

---

## Acceptance

1. Preflight answers correctly from the live origin:
   ```bash
   curl -s -X OPTIONS -D - -o /dev/null \
     https://hooks.digitaloperations.co.za/webhook/sunlogic-brief-photo \
     -H "Origin: https://sunlogic.co.za" -H "Access-Control-Request-Method: POST"
   ```
   → 204 with `access-control-allow-origin: https://sunlogic.co.za`.
2. A real JPEG posted as multipart returns `{"ok":true,"url":"…"}` and the
   file is visible in "Brief Photos".
3. That URL opens in a signed-out browser.
4. An SVG is refused. A 20 MB file is refused.
5. End to end from the live form: a Renewable brief with three photos
   submits, the Trello card carries the first as an attachment and the other
   two as links in its description, and all three open.

---

## Related

- `docs/project-brief.md` — the form, the field contract, the existing
  workflow, and its three known defects.
- `CHECKPOINT.md` — current state of the website side.
