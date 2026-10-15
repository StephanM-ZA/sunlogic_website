# The project brief form

`site-main/project-brief.html`, served at `https://sunlogic.co.za/project-brief`.

Internal. Our own team fills it in, usually on a phone at the client's
property, to raise the brief document a quote and a work pack are built from.
It is not an enquiry form and has nothing to do with `contact.html` or the
leads pipeline.

## What happened to it

It was a Quform form on the old WordPress site at `/project-brief/`. The
rebuild did not carry it across and the URL has been returning 404 since. The
**n8n side was never switched off**: the workflow has been published and
listening the whole time, so reactivating this was a front-end job plus a new
home for the photos. The field list was recovered from the Wayback Machine
snapshot of 2026-01-14 and checked against the live workflow's own key names.

## Where a submission goes

```
project-brief.html
  ├── one POST per photo  →  leads-relay Worker  /uploads/brief   →  R2
  │                             answers with the URL to fetch it back
  └── one POST with the brief  →  n8n  /webhook/sunlogic-project-brief
                                   ├── INSERT public.submissions
                                   ├── copy the Google Doc template, fill it
                                   ├── export PDF → Drive "Brief Documents"
                                   ├── email stephan@ + craig@ with the PDF
                                   ├── Trello card + attach the photos by URL
                                   └── UPDATE processed = true
```

The brief post goes **straight from the browser to n8n**. The leads-relay
Worker is not in that path and never sees a brief; it is involved only as the
place the photos are stored. n8n already allows
`https://sunlogic.co.za` by CORS, which is how the WordPress form reached it
too.

- **Webhook:** `POST https://hooks.digitaloperations.co.za/webhook/sunlogic-project-brief`
- **Workflow:** `Sunlogic Project Brief (Webhook → PostgreSQL)`, id
  `e86TQUi0qAbwqqVk`, on the iMac's n8n.
- **Responds:** `{"status":"success","reference":"<Quote or Invoice number>"}`

## The field contract

**The JSON keys are human sentences and they are not negotiable.** The
workflow maps each one onto a column by hand, so a key spelled any other way
does not error: it writes NULL, the brief document renders with a blank line,
and nobody notices until someone phones a number that was never saved.

| JSON key (the `name` in the HTML) | Postgres column | Branch |
|---|---|---|
| `Project Brief Submitted By` | `project_brief_submitted_by` | always |
| `Job Category` | `job_category` | always |
| `Business or Personal` | `business_or_personal` | always |
| `Business name` | `business_name` | always |
| `Client Name` | `client_name` | always |
| `Client Surname` | `client_surname` | always |
| `Client Email address` | `client_email` | always |
| `Client Contact number` | `client_contact_number` | always |
| `Quote or Invoice number` | `quote_invoice_number` | always |
| `Street Address` | `street_address` | all branches |
| `GPS location` | `gps_location` | all branches |
| `Google Maps Link` | `google_maps_link` | all branches |
| `Proposed Date` | `proposed_date` | all branches |
| `Other comments and instructions` | `comments_instructions` | all branches |
| `Type` | `type` | Renewable |
| `Building Type` | `building_type` | Renewable, Electrical, Gas |
| `Roof Type` | `roof_type` | Renewable |
| `Height of the building` | `height_of_building` | Renewable |
| `Roof size` | `roof_size` | Renewable |
| `Please upload photos of DB's, sub DB's, space and Roof etc.` | `upload_photos_db` | Renewable |
| `Type of electrical work` | `type_of_electrical_work` | Electrical |
| `Phases` | `phases` | Electrical |
| `Please upload photos` | `upload_photos` | Electrical, Gas, Quote Request, Other |

Note `Proposed Date`: the form labels it the way the old form did, but the key
is what n8n reads.

## The branches

`Job Category` decides which block shows, via `data-dl-branch-on` in
`shared/forms.js`. A hidden branch is **disabled**, so its fields are absent
from the payload and do not block submit on `required`.

| Category | Block |
|---|---|
| Renewable | address, type of system, building, roof, date, photos, comments |
| Electrical | address, type of electrical work, building, phases, date, photos, comments |
| Gas | address, building, date, photos, comments |
| Quote Request, Other | address, date, photos, comments |

### Gas has no Residential/Commercial field, on purpose

Gas was added after the rebuild, and the first cut gave it a Residential or
Commercial select. It was removed: **`Business or Personal`, asked of every
brief, is the same question.** Business is a commercial job and Personal is a
residential one, so the second field added nothing except a way for one brief
to answer the two of them differently.

The distinction that would have justified both is whether "commercial gas
installation" classifies the *work* rather than the *client* — a restaurant in
a converted house being the awkward case. It does not, for our purposes. If
that ever changes, it wants a key of its own rather than reusing `Type`, which
means a new column on `public.submissions` and a new mapping in the workflow:
an iMac change, through `serverMonitor`.

**The last row is a decision, not a recovery.** The archived page contains all
the fields but not the rule that revealed them, so Renewable and Electrical are
certain (each block carries that trade's own fields) and the other two
categories were given the fields common to both. If the original mapping turns
up, that block in `project-brief.html` is the only thing that changes.

## Photos

The old form uploaded to WordPress and n8n fetched the file from
`sunlogic.co.za`. That endpoint died with the site. Photos now live as rows in
**D1**, the database this Worker already uses for leads, and are served back
by the Worker at `/uploads/<key>`.

### Why D1, of all things

Object storage is the right shape for this. Two attempts at it failed for
reasons that had nothing to do with engineering:

- **Cloudflare R2** — built and committed. Enabling R2 needs a card at
  checkout even though the free tier would never bill at this volume, and the
  owner declined. `wrangler r2 bucket create` fails with code 10042 until
  then.
- **Google Drive via a service account** — built, tested, reverted. It needed
  a Google Cloud project and service account created from scratch.
- **Google Drive via n8n**, which already holds a working Drive credential —
  specified in `docs/project-brief-photo-upload-spec.md`, but it is an n8n
  change and goes through `serverMonitor`, so it could not be done from here.

D1 is already enabled, already bound, already deployed and already serving
this Worker. **Using the storage that is actually available beat a
better-shaped store that is not.** If R2 is ever enabled, moving is a small
change in one handler and the page never knows.

### What that costs, and how it is paid

D1 caps a single value at **2 MB** and the free database at 500 MB. A modern
phone camera produces 8 to 12 MB per photo, so without help every real photo
would be refused.

So **the page downscales before uploading**: `dlCompressImage` in
`shared/forms.js` redraws the image to 1600px on the long edge and re-encodes
as JPEG at quality 0.82. A distribution board lands around 300 KB and stays
legible enough to read a breaker label off, which is the whole job.

At that size the free database holds roughly 1,500 photos. If it ever gets
close, the fix is a retention sweep of rows older than a year, which is why
`brief_photos` is indexed on `created_at`.

The downscale is best effort and never fatal: a PDF passes straight through, a
format the browser cannot decode (HEIC outside Safari, mainly) falls back to
the original, and the size check then gives a clear refusal rather than
failing silently.

### The route

- `POST /uploads/brief`, raw body, one request per file. `Content-Type` is the
  file's own; `X-File-Name` carries its name; `X-Brief-Reference` carries the
  quote/invoice number so a photo can be traced back to its job and a
  retention sweep can be selective. Answers `{"ok":true,"url":"…"}`.
- `GET /uploads/<key>` serves it back from D1 with the stored content type,
  `nosniff`, and a one-year immutable cache. No auth: the callers are Trello
  fetching an attachment and a director opening a link from an email, neither
  of which is a browser on our own origin. The key is 32 random hex
  characters and that is the access control, the same assumption
  `/claim/<token>` makes.
- JPEG, PNG, WebP, HEIC, HEIF and PDF only. **SVG is refused on purpose**: it
  is an image by content type and a script by behaviour, and these are served
  back from our own origin.

### One URL per field, and what happens to the rest

n8n puts the field's value in a text column and hands it to Trello's
attach-by-URL node, which takes **one** URL. So the first photo's URL goes in
the field, and every URL after that is appended to
`Other comments and instructions` by `data-dl-upload-extras-into`, where it
reaches the email, the Trello card and the brief document as text. Nothing
uploaded is lost, but only the first photo is a real Trello attachment.
Attaching all of them properly means a loop in that workflow, which is an iMac
change and belongs to `serverMonitor`.

## Deploying it

The page ships with the site. The Worker needs the migration applied first:

```bash
npx wrangler d1 execute sunlogic-leads --remote \
  --file=workers/leads-relay/migrations/0005-brief-photos.sql
npx wrangler deploy --config workers/leads-relay/wrangler.toml
```

The migration is additive only — one new table and two indexes, no existing
table read or rewritten — so it is safe to apply while the database is
serving.

Until it is applied, `/uploads/brief` answers `503 uploads not configured`.
Note the page treats an upload failure as fatal to the whole submission, so
**a brief with a photo attached fails entirely while uploads are
unconfigured**; a brief with no photos works.

## Known rot on the n8n side

Flagged rather than fixed, because all three are iMac changes and go through
`serverMonitor`:

1. `Delete WP Photo 1` and `Delete WP Photo 2` still POST to
   `https://sunlogic.co.za/wp-json/sunlogic/v1/delete-upload`, which no longer
   exists. Harmless today: both carry `onError: continueRegularOutput`, so the
   run finishes and only the cleanup no-ops. They should be removed, or
   repointed at a delete route on the Worker.
2. Those two nodes carry a **hard-coded `X-Delete-Secret` value in the workflow
   JSON**. It authenticates nothing now. Remove it, and rotate it anywhere else
   it was used.
3. The webhook is **unauthenticated** and one request writes a DB row, copies a
   Drive document, sends an email and opens a Trello card. The form's honeypot
   is the only thing in the way. The leads webhook next door uses Header Auth
   with a shared secret; this one should too.

## Related

- `n8n/sunlogic-leads-relay.json` and `docs/n8n-workflows.md` — the *other*
  Sunlogic workflow, for website enquiries. Different webhook, different sheet,
  no overlap with this one.
- `workers/leads-relay/src/uploads.mjs` — the upload rules, and why each one is
  there.
