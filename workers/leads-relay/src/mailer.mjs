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

const BODIES = {
  offer: bodyOffer,
  accepted: bodyFull,
  expired: bodyExpired,
  unclaimed: bodyUnclaimed,
  digest: bodyDigest,
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
export function recipients(assignee) {
  if (assignee === 'both') return [ADDRESS.stephan, ADDRESS.craig];
  return ADDRESS[assignee] ? [ADDRESS[assignee]] : [ADDRESS.stephan, ADDRESS.craig];
}

async function sendViaResend(env, { to, replyTo, subject, html }) {
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
        html,
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
async function sendViaN8n(env, { to, replyTo, subject, html, leadId, event, extra }) {
  try {
    const res = await fetch(env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Relay-Secret': env.RELAY_SECRET },
      body: JSON.stringify({ event, leadId, to, replyTo, subject, html, ...(extra || {}) }),
    });
    return res.ok ? { ok: true, via: 'n8n' } : { ok: false, why: 'n8n ' + res.status };
  } catch (err) {
    return { ok: false, why: 'n8n threw: ' + String(err) };
  }
}

/* Try Resend, fall back to n8n, and report which path carried it so the
   digest can say so. Both failing is the caller's problem to record — the
   lead stays queued and is retried for 48 hours. */
export async function send(env, message) {
  const first = await sendViaResend(env, message);
  if (first.ok) return first;
  const second = await sendViaN8n(env, message);
  if (second.ok) return { ok: true, via: 'n8n', primaryFailed: first.why };
  return { ok: false, why: first.why + ' | ' + second.why };
}
