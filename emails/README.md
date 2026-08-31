# Contact-form email templates

Source-of-truth HTML for the two emails the "Sunlogic — Leads Relay" n8n
workflow sends on a **contact form** submission (not the calculator — that
flow's visitor-report email is separate and lives only in the n8n node
today). Kept here so the design has a reviewable home in the repo; n8n does
not read these files directly — each is pasted into the matching Send
Email node's HTML field, so **edit here first, then copy into n8n and
re-publish**, or the two will drift.

- `sales-notification.html` — to `sales@sunlogic.co.za`, all submitted
  fields, sent from the "Notify Sales — Contact" node.
- `client-confirmation.html` — to the visitor, confirms what they
  submitted and what happens next, sent from a new "Confirm Receipt —
  Contact" node (chained after "Notify Sales — Contact").

## Using in n8n

Both files use n8n expression syntax (`{{ $json.name }}`, etc.) directly in
the HTML, matching the fields `Extract Body` normalizes from the webhook
payload: `name`, `email`, `phone`, `suburb`, `need`, `property-type`,
`message`.

1. Open the file, copy its full contents.
2. In the target Send Email node, set **Email Format** to `HTML`.
3. Paste into the **HTML** field, then prefix the pasted content with `=`
   (n8n's marker for "this field is an expression") if the editor doesn't
   already switch to expression mode on its own — check the `fx` icon
   appears active.
4. Save, re-publish the workflow.

## Logo

Both templates embed the Sunlogic wordmark as an inline base64 `<img>` —
`assets/logo-email.png` is the same file, kept here for reference and for
regenerating the base64 if the logo ever changes. It's a cropped, resized
PNG rendered from `site-daylight/images/sl_logo_white.svg` (the
dark-background variant, matching the emails' navy header) via
`rsvg-convert`.

Inline base64 was used instead of a hosted URL because
`sunlogic.co.za` isn't live yet (still on the old WordPress site) — there
was no public URL to point at. **Once the new site is live, consider
switching both templates to `<img src="https://sunlogic.co.za/images/...">`
instead** — it's lighter (the base64 payload adds ~66KB to every email)
and easier to update without touching the email HTML.

## Design

Colors, type, and copy voice are pulled directly from
`site-daylight/shared/sunlogic.css` and the site's own contact-page copy —
see the design tokens there (`--color-orange`, `--color-navy`, etc.) before
changing anything here, so the emails don't drift from the live site's
brand.
