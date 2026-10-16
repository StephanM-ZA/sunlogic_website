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
  ├── one POST per photo  →  leads-relay Worker  /uploads/brief   →  D1
  │                             answers with the URL to fetch it back
  └── one POST with the brief  →  n8n  /webhook/sunlogic-project-brief
                                   ├── INSERT public.submissions
                                   ├── copy the Google Doc template, fill it
                                   ├── Drive folder "Brief Documents/<brief name>/"
                                   ├── every photo → that folder, and embedded
                                   │     into the doc at a uniform width
                                   ├── export PDF → that same folder
                                   ├── Trello card + every photo attached
                                   ├── UPDATE processed = true
                                   └── email stephan@ + craig@ with the PDF
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

### Documents, and why files are split

D1 caps a single value at 2 MB. That is fine for a photo the page has already
downscaled and useless for a document: a scanned Certificate of Compliance is
routinely 1 to 5 MB and an electrical layout plan larger still, and there is
nothing a browser can do to shrink either.

So a file over one chunk is **split**: chunk 0 stays in `brief_photos.bytes`
where it always was, chunks 1..n go in `brief_file_chunks`, and the GET route
reassembles them in order. The asymmetry is deliberate — every existing row
keeps working with no backfill, and a photo is still served by the single
primary-key lookup it was before. The cost of supporting large files is paid
only by large files.

Both are written in **one `env.DB.batch`**, so a file is either wholly stored
or not stored at all. Written separately, a dropped connection would leave a
row whose `size_bytes` promises more bytes than exist, and the GET would serve
a truncated document with a 200. For the same reason the read refuses to serve
a short reassembly: it logs `upload_incomplete` and answers 500, because
most of a PDF delivered as a success is worse than an honest failure.

`chunkRanges` is pure and exhaustively tested. An off-by-one there corrupts a
file in a way nothing reports — the row count is right, the recorded size is
right, and the bytes are wrong.

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
- JPEG, PNG, WebP, HEIC, HEIF, PDF, Word (.doc/.docx) and Excel
  (.xls/.xlsx). **SVG is refused on purpose**: it is an image by content type
  and a script by behaviour, and these are served back from our own origin.
- **25 MB per file.** Images are downscaled in the browser first and land
  around 300 KB; documents cannot be downscaled, which is what the chunking
  below is for.

### One URL per field, and the ones after it

A photo field is a single text column, so the page puts the **first** photo's
URL in the field and appends the rest to `Other comments and instructions`
("Further photos uploaded:", one URL per line) via
`data-dl-upload-extras-into`.

That is still how they travel, but it no longer decides what happens to them.
The workflow's `Collect Photos` step scans both photo columns *and* the
comments for `leads.sunlogic.co.za/uploads/` URLs, de-duplicates them and keeps
the order, so **every** uploaded photo is now treated the same: filed in the
brief's Drive folder, embedded in the brief document, and attached to the
Trello card. The comments text is left as it is — it is the audit trail of what
was uploaded, and it is what the parser reads.

So a second and third photo are no longer "mentioned in the comments"; they are
first-class. The only thing the field order still decides is which photo is
listed first.

### What the photos look like in the brief document

They are appended to the end of the document, each at a **uniform 300 pt
width** with the height left to follow the image's own proportions — so a
portrait shot is tall and a landscape one short, but they all line up on the
same left and right edges and nothing is stretched. The width is one constant
(`PHOTO_WIDTH_PT`) in the generator for `n8n/sunlogic-project-brief.json`.

Google will only fetch PNG, JPEG and GIF by URL for an inline image. The page
re-encodes to JPEG when it downscales, so that is nearly always what arrives; a
PDF attachment or a HEIC the browser could not decode simply does not embed,
and `Embed Photo in Doc` carries `onError: continueRegularOutput` so the brief
still completes. That file is still filed in Drive and still on the Trello card.

## Deploying it

**Use `npm run worker:deploy`, not a bare `wrangler deploy`** — it probes
every route afterwards, because `wrangler deploy` ships the whole script and a
deploy from a stale checkout silently deletes another session's routes. That
has happened twice to `/uploads/brief`. See
`workers/leads-relay/DEPLOYING.md`. Migration `0009-brief-file-chunks.sql`
must be applied as well as `0005`.

The page ships with the site. The Worker needs both migrations applied first:

```bash
cd workers/leads-relay
npx wrangler d1 execute sunlogic-leads --remote --file=migrations/0005-brief-photos.sql
npx wrangler d1 execute sunlogic-leads --remote --file=migrations/0009-brief-file-chunks.sql
cd ../..
npm run worker:deploy
```

Both migrations are additive only — new tables and indexes, nothing existing
read or rewritten — so they are safe to apply while the database is serving,
and both are guarded by `IF NOT EXISTS` so re-running one is harmless.

Until it is applied, `/uploads/brief` answers `503 uploads not configured`.
Note the page treats an upload failure as fatal to the whole submission, so
**a brief with a photo attached fails entirely while uploads are
unconfigured**; a brief with no photos works.

## The n8n side

Changed on 2026-10-15 through `serverMonitor` (`bin/deploy-n8n-workflow`). The
authoritative workflow JSON now lives at `n8n/sunlogic-project-brief.json` in this
repo, next to the leads-relay one. Full record, including the reasoning and what is
still open: `serverMonitor/docs/changes/2026-10-15-sunlogic-brief-workflow/README.md`.

### Fixed

1. **Email runs last.** `Download file` used to fan out to `Send email` and the Trello
   chain in parallel, and n8n ran the mail first — so when the SMTP certificate lapsed
   on 3 October the throw aborted the execution and cost the Trello card, the photo
   attachment and the `processed` flag as well as the mail. The chain is now linear and
   ends `PostgreSQL Update → Download PDF for email → Send email`. A mail failure costs
   only the mail. (`Download PDF for email` is a new node: `Send email` attaches a
   binary that only a Drive download produces, so moving it to the end meant re-fetching
   the PDF — the uploaded one, since `Delete temp file` has removed the Doc by then.)
2. **`Delete WP Photo 1` / `Delete WP Photo 2` removed**, along with the hard-coded
   `X-Delete-Secret` header value they carried. They POSTed to the dead WordPress
   endpoint and failed on every run. Photos live in D1 and there is no delete route, so
   they were dropped rather than repointed; retention, if it is ever needed, is a sweep
   of `brief_photos` by `created_at`.

3. **SMTP now points at a hostname whose certificate is valid** — for now.
   `smtp.sunlogic.co.za` is a vanity CNAME that presented `CN=sunlogic.co.za`, expired
   3 October, which is why brief emails were failing and why it looked like a mail
   outage rather than one wrong hostname. The same server answers on
   `www451.jnb1.host-h.net` (same IP) under a wildcard certificate that verifies, and
   that `host` field was changed on 2026-10-15 in n8n's credential UI. It is shared by
   five active workflows including n8n's own `Error Handler` — which is why nothing
   raised the alarm when the brief failed. The credential behind
   `Sunlogic — Leads Relay` had the same defect and was fixed at the same time, so the
   leads pipeline's mail was broken too.

   **Treat this as a workaround.** `www451.jnb1.host-h.net` is a host-specific Xneelo
   name, not a name this domain owns, so it needs changing again if Xneelo moves the
   mailbox. The durable fix is Xneelo renewing the certificate for `sunlogic.co.za`,
   which has not renewed since 3 October and looks stuck — worth raising with their
   support, after which both credentials can go back to `smtp.sunlogic.co.za`.

   Verified by n8n's own credential test (TLS with certificate verification, plus AUTH).
   **Not** yet verified by a message the mail server actually accepted — nothing has run
   on either credential since.

4. **Photos are now filed in Drive, embedded in the PDF, and all attached to
   Trello.** Previously the workflow only ever passed the photo *URL* around:
   nothing was saved to Drive, the brief document showed a link where a picture
   belonged, and only the first photo per field became a real Trello
   attachment. Now each brief gets its own Drive folder
   (`Brief Documents/PB - <quote> - <business> - <name> <surname>/`) holding the
   PDF and every photo, each photo is inserted into the document at a uniform
   width before the PDF is exported, and every photo is attached to the card.
   See "One URL per field" and "What the photos look like in the brief document"
   above.

### Still open, and why it is partly ours

4. **The webhook is still unauthenticated.** `authentication: none`, and one request
   writes a DB row, copies a Drive document, exports a PDF, emails two directors and
   opens a Trello card. The honeypot is in the browser and is trivially bypassed.

   This cannot be fixed on the n8n side alone: `site-main/project-brief.html` posts
   straight from the browser, and a browser cannot hold a shared secret, so the Header
   Auth the leads webhook uses would simply break the live form. **The decision taken is
   a Worker proxy** — a `POST /brief` route on leads-relay that forwards to n8n with the
   header from a secret binding, since that Worker is already in this form's path and
   already trusted for our origin. Turnstile was rejected (bot mitigation, not
   authentication, and a challenge in front of staff on a phone in the field);
   proxy-level rate limiting is worth adding anyway but bounds volume, not writes.

   Steps 1 and 2 are **this repo's** work and must land first:

   1. add the `POST /brief` forwarding route to leads-relay and deploy it — both paths
      work at this point, so nothing breaks;
   2. point `project-brief.html` at it, deploy, and verify a real submission;
   3. *then* `serverMonitor` switches the webhook to Header Auth.

   Afterwards the brief no longer posts from the browser, so n8n's CORS allowance for
   `https://sunlogic.co.za` on this webhook can go too.

5. **The form reports failure even when the brief fully processed.** `Respond to Webhook`
   sits on a second branch off `Webhook`, and n8n runs the insert branch to completion
   first, so any throw means the response node never runs and the webhook returns **500**.
   The 2026-10-15 verification replay returned 500 after 35.7 s with everything except
   the mail succeeded — the brief, the card, the photo and `processed` all landed, and the
   page still told the user it had failed. Someone on site will reasonably submit again
   and get a duplicate brief, card and email.

   The n8n-side fix is to chain `Webhook → Respond to Webhook → PostgreSQL Insert`, which
   is safe (the insert reads `$('Webhook')` by absolute reference) and also drops the
   form's wait from ~35 s to immediate. It was deliberately **not** applied, because it
   changes what this page can learn from a response: the form treats 500 as fatal today,
   and afterwards it would always see 200, so a genuine failure would read as success
   too. That trade is this repo's call — and if the Worker proxy in 4 lands, the Worker
   is the better place to make it.

## Related

- `n8n/sunlogic-leads-relay.json` and `docs/n8n-workflows.md` — the *other*
  Sunlogic workflow, for website enquiries. Different webhook, different sheet,
  no overlap with this one.
- `workers/leads-relay/src/uploads.mjs` — the upload rules, and why each one is
  there.
