/* Delivery confirmation.
 *
 * Why this file exists
 * ------------------------------------------------------------------------
 * send() used to treat "Resend's API returned 2xx" as success, and nothing
 * ever asked what happened after that. 2xx from Resend means *accepted for
 * delivery* — it says a message was queued, not that anybody received it.
 *
 * Lead 28 is what that costs. It was accepted on 2026-10-15 at 08:01:21 UTC,
 * the details email was handed to Resend, Resend said yes, and the director
 * never got it. Nothing in the system was wrong by its own account:
 * leads.last_error was NULL and attempts was 0, because by the only test we
 * applied the send had worked. The client happened to email us directly.
 *
 * So the gap was never "email is unreliable" — it is that we had no second
 * opinion. Resend knows what became of a message; we simply never asked.
 * This module is the asking: Resend's webhook tells us delivered, bounced or
 * complained, and we write that against the message id we kept.
 *
 * Why it is a separate module
 * ------------------------------------------------------------------------
 * src/index.js imports emails/*.html through the bundler's Text rule, so it
 * cannot be imported by `node --test` at all. The two things most worth
 * testing here — that an unsigned payload is refused, and that a retried
 * payload changes nothing the second time — therefore have to live somewhere
 * importable. Verification you cannot test is verification you are hoping
 * about.
 *
 * Everything here takes `db` rather than reaching for env.DB, for the same
 * reason: the tests run the real SQL against the real schema.
 */

/* ---- Svix signatures ---------------------------------------------------
   Resend signs with Svix. The signed string is "<id>.<timestamp>.<body>",
   HMAC-SHA256 under the signing secret, base64. The secret arrives as
   whsec_<base64>; the bytes after the prefix are the key, and base64-decoding
   them is not optional — using the printable form as the key produces a
   signature that is wrong in a way no test catches unless the test signs the
   same wrong way.

   The body must be the EXACT bytes received. Parse it to JSON only after the
   signature is verified: re-serialising a parsed object changes key order and
   number formatting, and the signature will never match again. */

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/* Compares in time independent of where the first difference falls. An early
   return on the first mismatched character leaks, one request at a time, how
   much of a guessed signature was right. */
function equalConstantTime(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* Works for a Headers object and for a plain object, because the tests have
   no Request and the Worker has nothing else. */
export function svixHeaders(headers) {
  const get = (name) => {
    if (!headers) return '';
    const raw = typeof headers.get === 'function'
      ? headers.get(name)
      : (headers[name] ?? headers[name.toLowerCase()]);
    return raw == null ? '' : String(raw);
  };
  return {
    id: get('svix-id'),
    timestamp: get('svix-timestamp'),
    signature: get('svix-signature'),
  };
}

/* The five-minute window is the replay guard. Without it a payload captured
   once stays valid forever, and a bounce could be replayed to hand a lead on
   repeatedly. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export async function verifySvix({
  secret, id, timestamp, signature, body,
  nowMs = Date.now(), toleranceSeconds = SIGNATURE_TOLERANCE_SECONDS,
}) {
  if (!secret || !id || !timestamp || !signature) return false;
  if (typeof body !== 'string') return false;

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return false;
  if (Math.abs(nowMs / 1000 - sentAt) > toleranceSeconds) return false;

  const encoded = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  let key;
  try {
    key = await crypto.subtle.importKey(
      'raw', base64ToBytes(encoded), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
  } catch {
    /* A malformed secret is a configuration error, and the only safe reading
       of it is that nothing is verified. Never fall through to accepting. */
    return false;
  }

  const mac = new Uint8Array(await crypto.subtle.sign(
    'HMAC', key, new TextEncoder().encode(id + '.' + timestamp + '.' + body),
  ));
  const expected = bytesToBase64(mac);

  /* The header can carry several space-separated "v1,<sig>" pairs — Svix
     sends both signatures while a secret is being rotated. Accumulate rather
     than returning on the first match, so the work does not depend on which
     one matched. */
  let matched = false;
  for (const part of signature.split(' ')) {
    const comma = part.indexOf(',');
    if (comma < 0 || part.slice(0, comma) !== 'v1') continue;
    if (equalConstantTime(part.slice(comma + 1), expected)) matched = true;
  }
  return matched;
}

/* ---- What Resend is telling us ---------------------------------------- */

/* email.sent is deliberately absent: it means the same thing the API's 2xx
   already meant, which is the assumption this whole module exists to stop
   relying on. We record 'sent' ourselves at send time; what we need from the
   webhook is the outcome. */
const STATUS_OF_EVENT = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
};

export const classifyEvent = (type) => STATUS_OF_EVENT[type] || null;

export const isFailure = (status) => status === 'bounced' || status === 'complained';

export function messageIdOf(payload) {
  const id = payload && payload.data && payload.data.email_id;
  return typeof id === 'string' && id ? id : null;
}

/* Resend puts the reason in different places depending on the event. Keep
   whatever is there: "bounced" is a status, "550 mailbox full" is a
   diagnosis, and the difference is whether anyone can act on it. */
export function detailOf(payload) {
  const d = (payload && payload.data) || {};
  const bounce = d.bounce || {};
  const parts = [
    bounce.type, bounce.subType, bounce.message,
    d.reason, d.complaint_feedback_type,
    Array.isArray(d.to) ? d.to.join(', ') : d.to,
  ].filter((p) => typeof p === 'string' && p);
  return parts.join(' · ').slice(0, 400);
}

/* Monotonic, so the order events arrive in cannot matter.
   ------------------------------------------------------------------------
   Webhooks are not ordered. A delivered arriving after a bounce must not
   erase the bounce — that would turn the one record a human needs back into
   the silence we started with. Rank only ever increases, which also makes a
   repeat of the same status a no-op and gives idempotency for free. */
const RANK = { sent: 0, delivered: 1, bounced: 2, complained: 3 };

export function nextStatus(current, incoming) {
  if (!(incoming in RANK)) return null;
  const from = RANK[current] ?? RANK.sent;
  return RANK[incoming] > from ? incoming : null;
}

/* ---- The record -------------------------------------------------------- */

/* Called at send time. A null id is not an error: the n8n fallback has no
   Resend message, so there is nothing to trace and nothing to insert. Worth
   knowing when reading the table — a lead with no message row was carried by
   the fallback, and no webhook will ever arrive for it. */
export async function recordSentMessage(db, { messageId, leadId, offerId, event, assignee, recipient }) {
  if (!messageId) return false;
  await db.prepare(
    'INSERT OR REPLACE INTO messages (id, lead_id, offer_id, event, assignee, recipient, status) ' +
    "VALUES (?, ?, ?, ?, ?, ?, 'sent')",
  ).bind(
    messageId, leadId ?? null, offerId ?? null, event || '',
    assignee ?? null, recipient ?? null,
  ).run();
  return true;
}

export async function applyEmailEvent(db, messageId, incoming, detail) {
  const row = await db.prepare(
    'SELECT id, lead_id, offer_id, event, assignee, recipient, status, alerted_at FROM messages WHERE id=?',
  ).bind(messageId).first();
  /* An unknown id is expected, not broken. Anything sent before this feature
     shipped has no row, and Resend will happily webhook about it. */
  if (!row) return { known: false, changed: false, row: null };

  const next = nextStatus(row.status, incoming);
  if (!next) return { known: true, changed: false, row };

  await db.prepare(
    "UPDATE messages SET status=?, status_at=datetime('now'), detail=? WHERE id=?",
  ).bind(next, detail || null, messageId).run();
  return { known: true, changed: true, row: { ...row, status: next } };
}

/* The alert is claimed in the database, not decided in the handler.
   ------------------------------------------------------------------------
   Two guards would be wrong here. Dedup on svix-id stops a retry of a
   request that FINISHED; this stops a second alert when the first attempt
   died between writing the status and sending the mail. The UPDATE is the
   claim: exactly one caller sees changes===1, so a bounce escalates once —
   and, just as importantly, still escalates when the first try failed
   halfway. */
export async function claimFailureAlert(db, messageId) {
  const res = await db.prepare(
    "UPDATE messages SET alerted_at=datetime('now') WHERE id=? AND alerted_at IS NULL",
  ).bind(messageId).run();
  return res.meta.changes === 1;
}

/* Giving the claim back, when the alert did not happen after all.
   ------------------------------------------------------------------------
   Without this the guard turns into the bug it was written to prevent: the
   claim is held by an attempt that threw, Resend retries, the status is
   already applied so nothing looks new, and the bounce is never escalated to
   anybody. A silent failure, arrived at by being careful. */
export async function releaseFailureAlert(db, messageId) {
  await db.prepare('UPDATE messages SET alerted_at=NULL WHERE id=?').bind(messageId).run();
}

export async function alreadyHandled(db, svixId) {
  const row = await db.prepare('SELECT id FROM webhook_events WHERE id=?').bind(svixId).first();
  return !!row;
}

/* Records WHAT the event was about, not just that it happened.
   ------------------------------------------------------------------------
   `matched` is the useful column. Now that every send records its id, an
   event matching nothing means mail is leaving by a path this Worker does
   not know about, or an id was lost on the way out. Dropping such an event
   silently is how the first one went unnoticed. */
export async function markHandled(db, svixId, type, messageId = null, matched = false) {
  await db.prepare(
    'INSERT OR IGNORE INTO webhook_events (id, type, message_id, matched) VALUES (?, ?, ?, ?)',
  ).bind(svixId, type || '', messageId, matched ? 1 : 0).run();
}

/* ---- The handler ------------------------------------------------------- */

/* Returns {status, body} rather than a Response so this can be tested without
   a Worker runtime. index.js wraps it.
   `onFailure(row, status, detail)` is where a bounce stops being a database
   row and becomes somebody's problem — supplied by index.js, which owns the
   templates and the rotation.

   On the ordering: the record is written BEFORE the dedup row, and the alert
   is claimed separately. Marking a request handled first would be simpler and
   wrong — a crash after the mark and before the write loses the event
   permanently, and the one event we cannot afford to lose is the bounce. */
export async function handleResendWebhook({ db, secret, headers, rawBody, nowMs, onFailure }) {
  if (!secret) {
    /* Say so rather than quietly returning 200. A webhook endpoint that
       accepts everything and records nothing looks healthy from Resend's
       dashboard, which is the exact failure mode this feature is about. */
    return { status: 503, body: 'webhook not configured' };
  }

  const { id, timestamp, signature } = svixHeaders(headers);
  const verified = await verifySvix({ secret, id, timestamp, signature, body: rawBody, nowMs });
  if (!verified) return { status: 401, body: 'bad signature' };

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: 'bad json' };
  }

  const status = classifyEvent(payload && payload.type);
  /* 200 for events we do not act on — email.sent, email.opened, anything
     Resend adds later. A non-2xx would make Resend retry forever and
     eventually disable the endpoint, taking the bounces down with it. */
  if (!status) return { status: 200, body: 'ignored' };

  if (await alreadyHandled(db, id)) return { status: 200, body: 'duplicate' };

  const messageId = messageIdOf(payload);
  if (!messageId) {
    await markHandled(db, id, payload.type);
    return { status: 200, body: 'no message id' };
  }


  const detail = detailOf(payload);
  const applied = await applyEmailEvent(db, messageId, status, detail);

  if (applied.known && isFailure(status) && onFailure) {
    if (await claimFailureAlert(db, messageId)) {
      try {
        await onFailure(applied.row, status, detail);
      } catch (err) {
        /* Hand the claim back and let it throw. The dedup row below is not
           written, so Resend's retry comes back to a message whose status is
           already set but whose alert is unclaimed — and escalates it. The
           throw is what makes the retry happen: swallowing it here would
           return 200 to a bounce nobody was ever told about. */
        await releaseFailureAlert(db, messageId);
        throw err;
      }
    }
  }

  await markHandled(db, id, payload.type, messageId, applied.known);
  /* Still 200 for an unmatched event. Resend is not at fault and retrying
     would not help — the record above is how a human finds out. */
  return { status: 200, body: applied.known ? 'ok' : 'unknown message' };
}
