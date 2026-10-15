/* Send a correctly signed Resend bounce webhook, by hand.
 *
 * For proving the DIRECTOR branch end to end: a bounced offer notification
 * must expire that offer immediately and hand the lead to the other director
 * with a live claim link. Resend will emit a real email.bounced for
 * bounced@resend.dev, but only for an address we can actually send to — and
 * director addresses are hardcoded in mailer.mjs, so a real director
 * notification can never be aimed at the simulator without either
 * MAIL_REDIRECT_TO (never set in production) or editing the code.
 *
 * So this signs the event the way Svix does and posts it. What it proves is
 * everything from the endpoint inwards: signature verification, matching the
 * stored message, recording the status, claiming the alert once, expiring the
 * offer and reassigning. What it does NOT prove is Resend's own emission —
 * and that is already proven separately by a real bounce on the customer path
 * (see docs/lead-delivery-confirmation.md).
 *
 * The signing secret is read from the environment and never printed. Run it
 * so the value stays out of your shell history:
 *
 *   read -rs RESEND_WEBHOOK_SECRET && export RESEND_WEBHOOK_SECRET
 *   node scripts/manual-bounce.mjs <message-id> [--url https://leads.sunlogic.co.za] [--type email.bounced]
 *   unset RESEND_WEBHOOK_SECRET
 *
 * It refuses to run without a message id, because an event for an unknown id
 * would be recorded as unmatched and prove nothing.
 */

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const messageId = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--url' && args[args.indexOf(a) - 1] !== '--type');
const url = flag('url', 'https://leads.sunlogic.co.za') + '/resend/webhook';
const type = flag('type', 'email.bounced');
const secret = process.env.RESEND_WEBHOOK_SECRET;

if (!messageId) {
  console.error('usage: node scripts/manual-bounce.mjs <resend-message-id> [--url ...] [--type email.bounced|email.complained]');
  process.exit(1);
}
if (!secret) {
  console.error('RESEND_WEBHOOK_SECRET is not set. Use:  read -rs RESEND_WEBHOOK_SECRET && export RESEND_WEBHOOK_SECRET');
  process.exit(1);
}
if (!/^email\.(bounced|complained|delivered)$/.test(type)) {
  console.error('refusing: --type must be email.bounced, email.complained or email.delivered');
  process.exit(1);
}

/* Shaped like Resend's own payload, because detailOf() reads these fields and
   the point is to exercise the real code path, not a convenient subset. */
const payload = {
  type,
  created_at: new Date().toISOString(),
  data: {
    email_id: messageId,
    to: ['(simulated by scripts/manual-bounce.mjs)'],
    subject: 'simulated bounce',
    bounce: {
      type: 'Permanent',
      subType: 'General',
      message: 'simulated hard bounce from scripts/manual-bounce.mjs',
    },
  },
};

const body = JSON.stringify(payload);
/* A real svix-id, so the dedup guard treats it as a distinct delivery and a
   re-run does not silently no-op. */
const svixId = 'msg_manual_' + crypto.randomUUID().replace(/-/g, '').slice(0, 20);
const timestamp = String(Math.floor(Date.now() / 1000));

const keyBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0));
const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const mac = new Uint8Array(await crypto.subtle.sign(
  'HMAC', key, new TextEncoder().encode(svixId + '.' + timestamp + '.' + body),
));
let bin = '';
for (const b of mac) bin += String.fromCharCode(b);
const signature = 'v1,' + btoa(bin);

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'svix-id': svixId,
    'svix-timestamp': timestamp,
    'svix-signature': signature,
  },
  body,
});

console.log('POST ' + url);
console.log('  type       ' + type);
console.log('  message    ' + messageId);
console.log('  svix-id    ' + svixId);
console.log('  -> HTTP ' + res.status + '  ' + (await res.text()));
console.log('');
console.log('Expect HTTP 200 "ok". A 401 means the secret is wrong; "unknown message"');
console.log('means that id is not in the messages table and nothing was proven.');
