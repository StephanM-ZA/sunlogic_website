# Lead email templates

**These are the only copies.** The Worker imports them at build time and
renders them; n8n holds no templates and never did after 2026-09-04. That is
deliberate — two senders meant two places for email HTML to live, and they
would have drifted.

## Structure

| File | What it is |
|---|---|
| `_layout.html` | The chrome: preheader, navy header, logo, orange rule, footer. Slots: `{{preheader}}`, `{{BODY}}`, `{{footnote}}` |
| `body-offer-notification.html` | The teaser. Division and date, plus the Accept button |
| `body-assignment-full.html` | Every field, sent to whoever accepted |
| `body-offer-expired.html` | "24 hours has passed", to the director who lapsed |
| `body-unclaimed-alert.html` | Repeating alert to both, after two timeouts |
| `body-daily-digest.html` | The morning summary |
| `client-confirmation.html` | To the visitor. Still sent by n8n, unchanged |

`sales-notification.html` was retired: `body-assignment-full.html` is the same
content, re-addressed to the accepter instead of `sales@`.

## The rule that matters

**Nothing identifying may appear in `_layout.html` or in any body except
`body-assignment-full.html`.** The whole point of the claim step is that a
director sees only the division before deciding. The preheader is part of this
— it is the preview line in the inbox list, so a name there leaks before the
mail is even opened. That is exactly what it used to do.

Check before committing any change here:

```bash
grep -nE '\{\{ *(name|email|phone|suburb|message|property_type)' \
  emails/_layout.html emails/body-offer-*.html emails/body-unclaimed-*.html emails/body-daily-*.html
```

Expected: no output.

## Placeholders

`{{name}}` style, substituted by `workers/leads-relay/src/mailer.mjs`. The
pattern allows digits (`{{arrived_24h}}`) — a pattern without them leaves
those in the sent mail as literal text.

These are **not** n8n expressions any more. `{{ $json.x }}` will not render.

## Sender

`leads@send.sunlogic.co.za`, via Resend. The subdomain is deliberate:
`sunlogic.co.za`'s own SPF, DKIM and reputation are untouched, and mail to
`@sunlogic.co.za` still goes to Xneelo. Reply-To is the director the lead
belongs to, so replies thread to the person who owns it.

## Logo

Inline base64 in `_layout.html`; `assets/logo-email.png` is the same file kept
for regenerating it. Now that the sites are live this could become a hosted
URL and save ~6KB per email — not done yet.
