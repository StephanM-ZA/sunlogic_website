/* Delivery confirmation.
 *
 * These tests exist because of lead 28. It was accepted on 2026-10-15 at
 * 08:01:21 UTC, the details email was handed to Resend, Resend returned 2xx,
 * and the director never received it. Nothing in the system was wrong by its
 * own account — leads.last_error was NULL and attempts was 0 — because the
 * only test applied was "did the API say yes".
 *
 * Two things therefore have to be true of the code here, and both are the
 * kind of thing that is easy to believe without checking:
 *
 *   1. An unsigned or stale payload is REFUSED. Verification you have not
 *      tested is verification you are hoping about, and a webhook that
 *      accepts anything would let a stranger expire offers at will.
 *   2. A retried payload changes nothing the second time. Resend retries,
 *      so "it worked when I clicked it once" is not the condition this code
 *      runs under.
 *
 * The database here is the REAL schema, run on node:sqlite through a small
 * D1-shaped adapter. A fake that returns scripted rows would have passed
 * happily against a CHECK constraint that rejects every write.
 */

import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import {
  handleResendWebhook, verifySvix, classifyEvent, nextStatus, messageIdOf, detailOf,
  recordSentMessage, applyEmailEvent, claimFailureAlert, reconcileUnmatched, isFailure,
} from '../src/webhook.mjs';

const SECRET = 'whsec_' + btoa('a-signing-secret-of-no-importance');

/* ---- A D1-shaped adapter over node:sqlite ------------------------------
   D1 is prepare().bind().run()/first()/all(), with run() reporting
   meta.changes. claimFailureAlert depends on that count being accurate, so
   the adapter reports sqlite's own rather than inventing one. */
function makeDb() {
  const sqlite = new DatabaseSync(':memory:');
  const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
  sqlite.exec(schema);
  return {
    sqlite,
    prepare(sql) {
      const stmt = sqlite.prepare(sql);
      const run = (args) => {
        const res = stmt.run(...args);
        return { meta: { changes: Number(res.changes) } };
      };
      const bindable = (args) => ({
        run: async () => run(args),
        first: async () => stmt.get(...args) ?? null,
        all: async () => ({ results: stmt.all(...args) }),
      });
      return { bind: (...args) => bindable(args), ...bindable([]) };
    },
  };
}

function seedLead(db, { id = 28, status = 'sent' } = {}) {
  db.sqlite.prepare(
    "INSERT INTO leads (id, type, payload_json, status, division) VALUES (?, 'contact', '{}', ?, 'energy')",
  ).run(id, status);
}

function seedOffer(db, { id = 17, leadId = 28, assignee = 'stephan', round = 1, state = 'offered' } = {}) {
  db.sqlite.prepare(
    'INSERT INTO offers (id, lead_id, assignee, round, token, state, expires_at) ' +
    "VALUES (?, ?, ?, ?, ?, ?, '2026-10-16 08:00:00')",
  ).run(id, leadId, assignee, round, 'token-' + id, state);
}

/* ---- Signing, the way Svix signs ---------------------------------------
   Deliberately NOT by calling the code under test. Signing with the same
   helper that verifies would agree with itself however wrong both were —
   notably over whether the whsec_ prefix is stripped and the remainder
   base64-decoded, which is the one thing most likely to be got wrong and the
   one thing such a test would never catch. */
async function sign(secret, id, timestamp, body) {
  const bin = atob(secret.replace(/^whsec_/, ''));
  const keyBytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = new Uint8Array(await crypto.subtle.sign(
    'HMAC', key, new TextEncoder().encode(id + '.' + timestamp + '.' + body),
  ));
  let out = '';
  for (const b of mac) out += String.fromCharCode(b);
  return 'v1,' + btoa(out);
}

const NOW_MS = Date.parse('2026-10-15T09:00:00Z');

function bouncePayload(messageId = 'msg-28', to = 'stephan@sunlogic.co.za') {
  return {
    type: 'email.bounced',
    created_at: '2026-10-15T09:00:00.000Z',
    data: {
      email_id: messageId,
      to: [to],
      bounce: { type: 'Permanent', subType: 'General', message: '550 mailbox unavailable' },
    },
  };
}

async function post(db, payload, { secret = SECRET, svixId = 'msg_abc', nowMs = NOW_MS, onFailure, skew = 0, tamper } = {}) {
  const rawBody = JSON.stringify(payload);
  const timestamp = String(Math.floor(nowMs / 1000) + skew);
  const signature = await sign(secret, svixId, timestamp, rawBody);
  return handleResendWebhook({
    db,
    secret,
    headers: {
      'svix-id': svixId,
      'svix-timestamp': timestamp,
      'svix-signature': tamper ? await sign(SECRET, 'different-id', timestamp, rawBody) : signature,
    },
    rawBody,
    nowMs,
    onFailure,
  });
}

/* ---- Verification ------------------------------------------------------ */

test('a correctly signed payload verifies', async () => {
  const body = '{"type":"email.delivered"}';
  const ts = String(Math.floor(NOW_MS / 1000));
  assert.equal(
    await verifySvix({
      secret: SECRET, id: 'msg_1', timestamp: ts,
      signature: await sign(SECRET, 'msg_1', ts, body), body, nowMs: NOW_MS,
    }),
    true,
  );
});

test('a signature over different content is refused', async () => {
  const ts = String(Math.floor(NOW_MS / 1000));
  assert.equal(
    await verifySvix({
      secret: SECRET, id: 'msg_1', timestamp: ts,
      signature: await sign(SECRET, 'msg_1', ts, '{"type":"email.delivered"}'),
      body: '{"type":"email.bounced"}', nowMs: NOW_MS,
    }),
    false,
  );
});

test('a signature from the wrong secret is refused', async () => {
  const body = '{}';
  const ts = String(Math.floor(NOW_MS / 1000));
  assert.equal(
    await verifySvix({
      secret: SECRET, id: 'msg_1', timestamp: ts,
      signature: await sign('whsec_' + btoa('somebody elses secret'), 'msg_1', ts, body),
      body, nowMs: NOW_MS,
    }),
    false,
  );
});

test('a payload older than the tolerance is refused, so a captured one cannot be replayed', async () => {
  const body = '{}';
  const ts = String(Math.floor(NOW_MS / 1000) - 3600);
  assert.equal(
    await verifySvix({
      secret: SECRET, id: 'msg_1', timestamp: ts,
      signature: await sign(SECRET, 'msg_1', ts, body), body, nowMs: NOW_MS,
    }),
    false,
  );
});

test('missing svix headers are refused rather than treated as unsigned-but-fine', async () => {
  for (const missing of ['id', 'timestamp', 'signature']) {
    const ts = String(Math.floor(NOW_MS / 1000));
    const args = {
      secret: SECRET, id: 'msg_1', timestamp: ts,
      signature: await sign(SECRET, 'msg_1', ts, '{}'), body: '{}', nowMs: NOW_MS,
    };
    args[missing] = '';
    assert.equal(await verifySvix(args), false, missing + ' should be required');
  }
});

test('the handler rejects an unverified payload with 401 and writes nothing', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'msg-28', leadId: 28, event: 'accepted', assignee: 'stephan' });

  const res = await post(db, bouncePayload(), { tamper: true });

  assert.equal(res.status, 401);
  const row = db.sqlite.prepare('SELECT status, alerted_at FROM messages WHERE id=?').get('msg-28');
  assert.equal(row.status, 'sent');
  assert.equal(row.alerted_at, null);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM webhook_events').get().n, 0);
});

test('with no secret configured the handler says so rather than accepting silently', async () => {
  const db = makeDb();
  const res = await handleResendWebhook({ db, secret: '', headers: {}, rawBody: '{}', nowMs: NOW_MS });
  assert.equal(res.status, 503);
});

/* ---- Recording the outcome -------------------------------------------- */

test('a delivered event records delivery and alerts nobody', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'msg-28', leadId: 28, event: 'accepted', assignee: 'stephan' });

  let alerts = 0;
  const res = await post(db, { type: 'email.delivered', data: { email_id: 'msg-28' } },
    { onFailure: () => { alerts += 1; } });

  assert.equal(res.status, 200);
  assert.equal(alerts, 0);
  const row = db.sqlite.prepare('SELECT status, status_at FROM messages WHERE id=?').get('msg-28');
  assert.equal(row.status, 'delivered');
  assert.ok(row.status_at, 'delivery should be timestamped');
});

test('a bounce records the failure and escalates once, carrying Resend own words', async () => {
  const db = makeDb();
  seedLead(db);
  seedOffer(db);
  await recordSentMessage(db, {
    messageId: 'msg-28', leadId: 28, offerId: 17, event: 'offer',
    assignee: 'stephan', recipient: 'stephan@sunlogic.co.za',
  });

  const seen = [];
  const res = await post(db, bouncePayload(), { onFailure: (row, status, detail) => { seen.push({ row, status, detail }); } });

  assert.equal(res.status, 200);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].status, 'bounced');
  assert.equal(seen[0].row.lead_id, 28);
  assert.equal(seen[0].row.offer_id, 17, 'the alert needs the offer, to know which 24 hours died');
  assert.equal(seen[0].row.assignee, 'stephan');
  assert.match(seen[0].detail, /550 mailbox unavailable/);

  const row = db.sqlite.prepare('SELECT status, detail, alerted_at FROM messages WHERE id=?').get('msg-28');
  assert.equal(row.status, 'bounced');
  assert.match(row.detail, /Permanent/);
  assert.ok(row.alerted_at, 'the alert should be claimed in the database');
});

test('a complaint escalates like a bounce', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'm', leadId: 28, event: 'offer', assignee: 'craig' });
  let alerts = 0;
  await post(db, { type: 'email.complained', data: { email_id: 'm', to: ['craig@sunlogic.co.za'] } },
    { onFailure: () => { alerts += 1; } });
  assert.equal(alerts, 1);
  assert.equal(db.sqlite.prepare('SELECT status FROM messages WHERE id=?').get('m').status, 'complained');
});

/* ---- Idempotency ------------------------------------------------------ */

test('the same svix id delivered twice escalates once — Resend retries', async () => {
  const db = makeDb();
  seedLead(db);
  seedOffer(db);
  await recordSentMessage(db, { messageId: 'msg-28', leadId: 28, offerId: 17, event: 'offer', assignee: 'stephan' });

  let alerts = 0;
  const first = await post(db, bouncePayload(), { onFailure: () => { alerts += 1; } });
  const second = await post(db, bouncePayload(), { onFailure: () => { alerts += 1; } });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(second.body, 'duplicate');
  assert.equal(alerts, 1, 'a retry must not hand the lead on a second time');
});

test('a retry after the alert failed halfway still escalates, exactly once', async () => {
  /* The case the svix-id guard does NOT cover: the status was written, then
     the alert threw, so the request never finished and was never marked
     handled. Resend retries. Without alerted_at this either alerts twice or
     — far worse — never alerts at all, because nextStatus sees the status
     already applied and reports nothing changed. */
  const db = makeDb();
  seedLead(db);
  seedOffer(db);
  await recordSentMessage(db, { messageId: 'msg-28', leadId: 28, offerId: 17, event: 'offer', assignee: 'stephan' });

  let alerts = 0;
  await assert.rejects(() => post(db, bouncePayload(), {
    svixId: 'msg_retry',
    onFailure: () => { throw new Error('alert blew up'); },
  }));

  /* Nothing is fixed up by hand here on purpose. The failed attempt handed
     the claim back itself, and left no dedup row — so the retry must find a
     message whose status is already set but whose alert is still owed, and
     escalate it. */
  assert.equal(
    db.sqlite.prepare('SELECT alerted_at FROM messages WHERE id=?').get('msg-28').alerted_at,
    null,
    'a failed alert must give the claim back',
  );
  assert.equal(
    db.sqlite.prepare('SELECT COUNT(*) AS n FROM webhook_events').get().n, 0,
    'an unfinished request must not be marked handled',
  );

  const retry = await post(db, bouncePayload(), { svixId: 'msg_retry', onFailure: () => { alerts += 1; } });
  assert.equal(retry.status, 200);
  assert.equal(alerts, 1);
});

test('a delivered arriving after a bounce does not erase the bounce', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'm', leadId: 28, event: 'offer', assignee: 'stephan' });

  await post(db, bouncePayload('m'), { svixId: 'a', onFailure: () => {} });
  await post(db, { type: 'email.delivered', data: { email_id: 'm' } }, { svixId: 'b' });

  assert.equal(
    db.sqlite.prepare('SELECT status FROM messages WHERE id=?').get('m').status,
    'bounced',
    'webhooks are not ordered; the record a human needs must survive',
  );
});

test('a repeated bounce under a new svix id does not escalate again', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'm', leadId: 28, event: 'offer', assignee: 'stephan' });
  let alerts = 0;
  await post(db, bouncePayload('m'), { svixId: 'a', onFailure: () => { alerts += 1; } });
  await post(db, bouncePayload('m'), { svixId: 'b', onFailure: () => { alerts += 1; } });
  assert.equal(alerts, 1);
});

/* ---- Things the endpoint has to tolerate ------------------------------ */

test('an event we do not act on is accepted and ignored', async () => {
  const db = makeDb();
  /* 200, not an error: a non-2xx makes Resend retry forever and eventually
     disable the endpoint, which would take the bounces down with it. */
  const res = await post(db, { type: 'email.opened', data: { email_id: 'm' } });
  assert.equal(res.status, 200);
  assert.equal(res.body, 'ignored');
});

test('email.sent is ignored — it means what the API 2xx already meant', async () => {
  assert.equal(classifyEvent('email.sent'), null);
  assert.equal(classifyEvent('email.delivered'), 'delivered');
  assert.equal(classifyEvent('email.bounced'), 'bounced');
  assert.equal(classifyEvent('email.complained'), 'complained');
});

test('a webhook about a message we never recorded is accepted, not an error', async () => {
  const db = makeDb();
  let alerts = 0;
  const res = await post(db, bouncePayload('never-seen'), { onFailure: () => { alerts += 1; } });
  assert.equal(res.status, 200);
  assert.equal(res.body, 'unknown message');
  assert.equal(alerts, 0, 'nothing to escalate about a lead we cannot identify');
});

test('an unmatched event is recorded as unmatched, not dropped', async () => {
  /* The first real event this system received was exactly this: a genuine,
     correctly signed email.delivered on 2026-10-15 13:13:27 for a send that
     kept no id. It verified, it was accepted, and the only trace was an
     orphan row. Now that every send records its id, an unmatched event is a
     signal — mail is leaving by a route nothing here records — so the fact
     has to survive the request. */
  const db = makeDb();
  const res = await post(db, { type: 'email.delivered', data: { email_id: 'ghost' } });
  assert.equal(res.status, 200);
  const row = db.sqlite.prepare('SELECT type, message_id, matched FROM webhook_events').get();
  assert.equal(row.type, 'email.delivered');
  assert.equal(row.message_id, 'ghost');
  assert.equal(row.matched, 0, 'the whole point is that this is queryable');
});

test('a matched event is recorded as matched', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'known', leadId: 28, event: 'visitor_report' });
  await post(db, { type: 'email.delivered', data: { email_id: 'known' } });
  const row = db.sqlite.prepare('SELECT message_id, matched FROM webhook_events').get();
  assert.equal(row.message_id, 'known');
  assert.equal(row.matched, 1);
});

/* ---- Customer-facing mail --------------------------------------------- */

test('a bounced visitor estimate is recorded but never reassigns the lead', async () => {
  /* The estimate goes to the CUSTOMER, so it is stored with no assignee.
     handleEmailFailure keys off that: a prospect mistyping their address
     must not expire an offer or hand the lead to the other director. The
     failure is in reaching the customer, which is a different problem with
     a different answer. */
  const db = makeDb();
  seedLead(db);
  seedOffer(db);
  await recordSentMessage(db, {
    messageId: 'est-1', leadId: 28, offerId: null,
    event: 'visitor_report', assignee: null, recipient: 'tpyo@example.com',
  });

  const seen = [];
  await post(db, bouncePayload('est-1', 'tpyo@example.com'),
    { onFailure: (row, status, detail) => { seen.push({ row, status, detail }); } });

  assert.equal(seen.length, 1, 'it is still a failure worth handling');
  assert.equal(seen[0].row.assignee, null, 'no director owns this message');
  assert.equal(seen[0].row.offer_id, null, 'and no offer rides on it');
  assert.equal(
    db.sqlite.prepare('SELECT state FROM offers WHERE id=17').get().state,
    'offered',
    'the live offer must be untouched by a customer-side bounce',
  );
  assert.equal(
    db.sqlite.prepare('SELECT status, detail FROM messages WHERE id=?').get('est-1').status,
    'bounced',
  );
});

test('a director-less message row is representable at all', async () => {
  /* Guards the schema rather than the logic: if `messages` ever gained a
     NOT NULL on assignee, every customer-facing send would start failing
     silently inside rememberMessage's catch. */
  const db = makeDb();
  seedLead(db);
  assert.equal(
    await recordSentMessage(db, {
      messageId: 'no-director', leadId: 28, event: 'visitor_report',
    }),
    true,
  );
  const row = db.sqlite.prepare('SELECT assignee, offer_id, status FROM messages WHERE id=?').get('no-director');
  assert.equal(row.assignee, null);
  assert.equal(row.offer_id, null);
  assert.equal(row.status, 'sent');
});

test('malformed json past a valid signature is a 400', async () => {
  const db = makeDb();
  const ts = String(Math.floor(NOW_MS / 1000));
  const rawBody = 'not json';
  const res = await handleResendWebhook({
    db, secret: SECRET, rawBody, nowMs: NOW_MS,
    headers: {
      'svix-id': 'x', 'svix-timestamp': ts,
      'svix-signature': await sign(SECRET, 'x', ts, rawBody),
    },
  });
  assert.equal(res.status, 400);
});

test('a Headers object works as well as a plain object', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'm', leadId: 28, event: 'offer', assignee: 'stephan' });
  const rawBody = JSON.stringify({ type: 'email.delivered', data: { email_id: 'm' } });
  const ts = String(Math.floor(NOW_MS / 1000));
  const res = await handleResendWebhook({
    db, secret: SECRET, rawBody, nowMs: NOW_MS,
    headers: new Headers({
      'svix-id': 'h1', 'svix-timestamp': ts,
      'svix-signature': await sign(SECRET, 'h1', ts, rawBody),
    }),
  });
  assert.equal(res.status, 200);
  assert.equal(db.sqlite.prepare('SELECT status FROM messages WHERE id=?').get('m').status, 'delivered');
});

/* ---- The pieces ------------------------------------------------------- */

test('the fallback leaves no message row, because no webhook will ever arrive', async () => {
  const db = makeDb();
  seedLead(db);
  assert.equal(
    await recordSentMessage(db, { messageId: null, leadId: 28, event: 'offer', assignee: 'stephan' }),
    false,
  );
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) AS n FROM messages').get().n, 0);
});

test('status only ever moves forward', () => {
  assert.equal(nextStatus('sent', 'delivered'), 'delivered');
  assert.equal(nextStatus('sent', 'bounced'), 'bounced');
  assert.equal(nextStatus('delivered', 'bounced'), 'bounced');
  assert.equal(nextStatus('bounced', 'delivered'), null);
  assert.equal(nextStatus('bounced', 'bounced'), null);
  assert.equal(nextStatus('delivered', 'delivered'), null);
  assert.equal(nextStatus('sent', 'nonsense'), null);
});

test('only one caller can claim the alert', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'm', leadId: 28, event: 'offer', assignee: 'stephan' });
  assert.equal(await claimFailureAlert(db, 'm'), true);
  assert.equal(await claimFailureAlert(db, 'm'), false);
});

test('an event for an unknown message reports it rather than inventing a row', async () => {
  const db = makeDb();
  const res = await applyEmailEvent(db, 'nope', 'bounced', 'x');
  assert.deepEqual(res, { known: false, changed: false, row: null });
});

test('the message id is read from where Resend puts it', () => {
  assert.equal(messageIdOf({ data: { email_id: 'abc' } }), 'abc');
  assert.equal(messageIdOf({ data: {} }), null);
  assert.equal(messageIdOf({}), null);
  assert.equal(messageIdOf(null), null);
});

/* ---- When the webhook arrives first -----------------------------------
   Every test above this point seeds the message row before the event, and
   that is an assumption, not a fact. Production disagreed with it: lead 32's
   visitor_report row was written at 13:49:22 and its email.bounced arrived
   at 13:49:20. The event verified, matched nothing and escalated to nobody.
   The send goes out from Cloudflare and the bounce comes back through
   Resend; nothing sequences the two. */

test('a bounce arriving BEFORE the send is recorded is still applied, and still escalates', async () => {
  const db = makeDb();
  seedLead(db);
  seedOffer(db);

  /* The event first, with no message row anywhere — exactly what production
     did. It is accepted and filed as unmatched. */
  const early = await post(db, bouncePayload('msg-late'), { svixId: 'early' });
  assert.equal(early.status, 200);
  assert.equal(early.body, 'unknown message');
  const filed = db.sqlite.prepare('SELECT matched, detail FROM webhook_events WHERE id=?').get('early');
  assert.equal(filed.matched, 0);
  assert.match(filed.detail, /550 mailbox unavailable/, 'the diagnosis has to survive to be replayed');

  /* Now the send gets recorded, as rememberMessage would. */
  await recordSentMessage(db, {
    messageId: 'msg-late', leadId: 28, offerId: 17, event: 'offer',
    assignee: 'stephan', recipient: 'stephan@sunlogic.co.za',
  });

  const replayed = await reconcileUnmatched(db, 'msg-late');
  assert.ok(replayed, 'the waiting event must be found');
  assert.equal(replayed.status, 'bounced');
  assert.equal(replayed.row.offer_id, 17, 'and must carry the offer, or nothing can be handed on');
  assert.equal(replayed.row.assignee, 'stephan');
  assert.match(replayed.detail, /550 mailbox unavailable/);
  assert.ok(isFailure(replayed.status), 'the caller escalates on this');

  assert.equal(db.sqlite.prepare('SELECT status FROM messages WHERE id=?').get('msg-late').status, 'bounced');
  assert.equal(
    db.sqlite.prepare('SELECT matched FROM webhook_events WHERE id=?').get('early').matched, 1,
    'and it stops being reported as unmatched',
  );
});

test('replaying claims the alert once, so the caller cannot escalate twice', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'm', leadId: 28, event: 'offer', assignee: 'stephan' });
  db.sqlite.prepare("INSERT INTO webhook_events (id, type, message_id, matched, detail) VALUES ('e','email.bounced','m',0,'x')").run();

  const replayed = await reconcileUnmatched(db, 'm');
  assert.equal(replayed.status, 'bounced');
  assert.equal(await claimFailureAlert(db, 'm'), true);
  assert.equal(await claimFailureAlert(db, 'm'), false);
});

test('replaying a delivered event escalates nothing', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'm', leadId: 28, event: 'visitor_report' });
  db.sqlite.prepare("INSERT INTO webhook_events (id, type, message_id, matched) VALUES ('e','email.delivered','m',0)").run();

  const replayed = await reconcileUnmatched(db, 'm');
  assert.equal(replayed.status, 'delivered');
  assert.equal(isFailure(replayed.status), false);
  assert.equal(db.sqlite.prepare('SELECT status FROM messages WHERE id=?').get('m').status, 'delivered');
});

test('replaying several early events ends on the most severe, whatever order they came in', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'm', leadId: 28, event: 'offer', assignee: 'craig' });
  db.sqlite.prepare("INSERT INTO webhook_events (id, type, message_id, matched, received_at) VALUES ('e1','email.bounced','m',0,'2026-10-15 10:00:00')").run();
  db.sqlite.prepare("INSERT INTO webhook_events (id, type, message_id, matched, received_at) VALUES ('e2','email.delivered','m',0,'2026-10-15 10:00:05')").run();

  const replayed = await reconcileUnmatched(db, 'm');
  assert.equal(
    db.sqlite.prepare('SELECT status FROM messages WHERE id=?').get('m').status,
    'bounced',
    'a later delivered must not erase an earlier bounce',
  );
  assert.equal(replayed.status, 'bounced', 'and the caller is told about the bounce, not the delivery');
});

test('with nothing waiting, replaying is a no-op', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'm', leadId: 28, event: 'offer', assignee: 'stephan' });
  assert.equal(await reconcileUnmatched(db, 'm'), null);
  assert.equal(await reconcileUnmatched(db, null), null);
  assert.equal(db.sqlite.prepare('SELECT status FROM messages WHERE id=?').get('m').status, 'sent');
});

test('an already-matched event is not replayed a second time', async () => {
  const db = makeDb();
  seedLead(db);
  await recordSentMessage(db, { messageId: 'm', leadId: 28, event: 'offer', assignee: 'stephan' });
  await post(db, bouncePayload('m'), { svixId: 'live', onFailure: () => {} });
  /* Handled live, so it is matched; a later replay must find nothing and
     must not report a second failure to escalate. */
  assert.equal(await reconcileUnmatched(db, 'm'), null);
});

test('the failure detail keeps the diagnosis, not just the status', () => {
  const detail = detailOf(bouncePayload('m').data ? bouncePayload('m') : {});
  assert.match(detail, /Permanent/);
  assert.match(detail, /550 mailbox unavailable/);
  assert.match(detail, /stephan@sunlogic\.co\.za/);
  assert.ok(detail.length <= 400);
});
