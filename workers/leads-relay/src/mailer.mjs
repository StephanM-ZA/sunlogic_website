/* Sending.
 *
 * Resend is primary; n8n on the iMac is the fallback. That order is the whole
 * point: every notification used to depend on a machine in an office, and the
 * relay queue gave up after 100 minutes, so an iMac off overnight silently
 * lost leads. Cloudflare stays up when the office does not.
 *
 * There is exactly ONE copy of every template, here in emails/, imported at
 * build time and rendered by this Worker. The fallback receives already-
 * rendered HTML and simply posts it. n8n holds no templates, so the two
 * senders cannot drift — which is the obvious way an arrangement like this
 * rots.
 */

import layout from '../../../emails/_layout.html';
import bodyOffer from '../../../emails/body-offer-notification.html';
import bodyFull from '../../../emails/body-assignment-full.html';
import bodyExpired from '../../../emails/body-offer-expired.html';
import bodyUnclaimed from '../../../emails/body-unclaimed-alert.html';
import bodyDigest from '../../../emails/body-daily-digest.html';
import bodyVisitor from '../../../emails/body-visitor-report.html';

const BODIES = {
  offer: bodyOffer,
  accepted: bodyFull,
  expired: bodyExpired,
  unclaimed: bodyUnclaimed,
  digest: bodyDigest,
  visitor_report: bodyVisitor,
};

/* From a subdomain, deliberately. sunlogic.co.za's own SPF, DKIM and sending
   reputation are untouched by this: only send.sunlogic.co.za carries Resend's
   records, and mail to @sunlogic.co.za still goes to Xneelo exactly as before.
   If Resend ever has a deliverability problem it cannot reach the real mail. */
const FROM = 'Sunlogic Leads <leads@send.sunlogic.co.za>';

const ADDRESS = {
  stephan: 'stephan@sunlogic.co.za',
  craig: 'craig@sunlogic.co.za',
};

/* Every recipient collapses to this address when set. Staging uses it so a
   test run cannot put automated mail in Craig's inbox, and it is the switch
   to turn off at cutover — not a permanent feature. Production must never
   carry it: with it set, only one director is ever told anything, and the
   rotation would look like it was working while nobody else heard a word. */
function redirect(env, list) {
  return env.MAIL_REDIRECT_TO ? [env.MAIL_REDIRECT_TO] : list;
}

/* [a-zA-Z0-9_] and not [a-zA-Z_]: the digest's placeholders are named
   arrived_24h and accepted_24h. A pattern without digits leaves those two
   in the sent email as literal {{arrived_24h}}, which looks like a bug to
   whoever opens it and is silent to everyone else. */
export function render(template, values) {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (whole, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key] ?? '') : whole);
}

export function compose(event, values) {
  const body = BODIES[event];
  if (!body) throw new Error('mailer: no template for event ' + event);
  return render(layout.replace('{{BODY}}', body), values);
}

/* Recipients. 'both' is the unclaimed alert; everything else is one director.
   Reply-To is the director the lead belongs to, so a reply threads to the
   person who owns it rather than into the shared mailbox. */
/* Reply-To always uses the real address, even when delivery is redirected —
   otherwise a staging reply would go to the test mailbox. */
export const ADDRESS_OF = ADDRESS;

export function recipients(env, assignee) {
  const list = assignee === 'both'
    ? [ADDRESS.stephan, ADDRESS.craig]
    : (ADDRESS[assignee] ? [ADDRESS[assignee]] : [ADDRESS.stephan, ADDRESS.craig]);
  return redirect(env, list);
}

/* While mail is redirected, say so IN the email. A redirect is meant to be
   temporary and is trivially forgotten; a banner on every message is the
   reminder that cannot be ignored, and it deletes itself the moment the
   variable comes off. */
function redirectBanner(env, html) {
  if (!env.MAIL_REDIRECT_TO) return html;
  const bar = '<div style="background:#B85300;color:#fff;padding:10px 16px;' +
    'font:600 13px/1.4 -apple-system,Helvetica,Arial,sans-serif;text-align:center;">' +
    'TEST MODE — redirected to ' + env.MAIL_REDIRECT_TO +
    '. The directors are not receiving their own mail.</div>';
  return html.replace(/(<body[^>]*>)/i, '$1' + bar);
}

async function sendViaResend(env, { to, replyTo, subject, html }) {
  /* A deliberate way to exercise the fallback without destroying the real
     key. A fallback nobody has run is not a fallback, and the only honest
     way to know it works is to make the primary fail on purpose. Staging
     sets this for that test; production never does. */
  if (env.FORCE_FALLBACK === '1') return { ok: false, why: 'forced (FORCE_FALLBACK=1)' };
  if (!env.RESEND_API_KEY) return { ok: false, why: 'no api key' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to,
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        html: redirectBanner(env, html),
      }),
    });
    if (res.ok) return { ok: true, via: 'resend' };
    return { ok: false, why: 'resend ' + res.status + ' ' + (await res.text()).slice(0, 200) };
  } catch (err) {
    return { ok: false, why: 'resend threw: ' + String(err) };
  }
}

/* The fallback posts fully-rendered HTML. n8n decides nothing about content —
   it addresses an envelope and sends it, and writes the sheet row. */
async function sendViaN8n(env, { to, replyTo, subject, html, leadId, event, extra, needsSend }) {
  try {
    const res = await fetch(env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Relay-Secret': env.RELAY_SECRET },
      body: JSON.stringify({
        event,
        /* Qualified by environment, because staging and production have
           SEPARATE databases with independent id sequences and write to the
           SAME sheet, matched on Lead ID. Staging lead 21 silently
           overwrote production lead 21's row — the audit log showed a test
           lead's state for a real enquiry, and looked entirely normal doing
           it. A prefix makes a collision impossible rather than unlikely. */
        leadId: (env.ENV_LABEL ? env.ENV_LABEL + '-' : '') + leadId,
        to, replyTo, subject, html,
        /* n8n branches on this: always write the sheet row, send only when
           asked. Defaults true so an older workflow keeps behaving. */
        needsSend: needsSend !== false,
        ...(extra || {}),
      }),
    });
    if (res.ok) return { ok: true, via: 'n8n' };
    /* Carry n8n's own words. "n8n 403" is a status; "Authorization data is
       wrong!" is a diagnosis, and the difference is an afternoon. */
    const detail = await res.text().catch(() => '');
    return { ok: false, why: 'n8n ' + res.status + ' ' + detail.replace(/\s+/g, ' ').slice(0, 160) };
  } catch (err) {
    return { ok: false, why: 'n8n threw: ' + String(err) };
  }
}

/* Try Resend, fall back to n8n, and report which path carried it.
   ------------------------------------------------------------------
   The sheet row is a separate concern from the email, and conflating them
   was a real bug: n8n writes the Google Sheet, but with Resend primary n8n
   is only reached when Resend FAILS. The audit trail would have recorded
   nothing but failures — a log that is empty precisely when everything is
   working.

   So a successful Resend send is still announced to n8n, with needsSend
   false: log this, do not send it. If that announcement fails, the email
   has already gone and only the row is missing, which is the right way
   round. Sending must never depend on the iMac; logging may. */
export async function send(env, message) {
  const first = await sendViaResend(env, message);
  if (first.ok) {
    await sendViaN8n(env, { ...message, needsSend: false });
    return first;
  }
  const second = await sendViaN8n(env, { ...message, needsSend: true });
  if (second.ok) return { ok: true, via: 'n8n', primaryFailed: first.why };
  return { ok: false, why: first.why + ' | ' + second.why };
}
