/* The claim page.
 *
 * These tests exist because of a real incident: lead 28 was accepted, the
 * Worker handed the details email to Resend, Resend returned success, and the
 * email never arrived. Nothing in the system was wrong by its own account —
 * and the director had nothing. The client happened to email us directly.
 *
 * The lesson is not "make email more reliable". It is that the ONE moment we
 * know the director is present and looking at our page is the moment they
 * accept, and until now that page told them to go and look in their inbox.
 * The details belong on the page. Email becomes the convenience it should
 * always have been.
 */

import test from 'node:test';
import assert from 'node:assert';
import { handleClaimPost, handleClaimGet } from '../src/claim.mjs';

const PAYLOAD = {
  name: 'Aldrich Duister',
  email: 'aldrich@example.com',
  phone: '0817284756',
  suburb: 'Northern Suburbs',
  need: 'Energy',
  'property-type': 'Home',
  message: 'I want solar. Spending <R4000> per month & rising.',
};

const OFFER = {
  id: 17,
  lead_id: 28,
  assignee: 'stephan',
  round: 1,
  state: 'offered',
  expires_at: null,
  division: 'energy',
  type: 'contact',
  created_at: '2026-10-14 08:57:44',
  claimed_by: null,
};

/* A fake D1 that answers by SQL shape. It records every statement so a test
   can assert what the handler did, not merely what it returned. */
function fakeDb({ offer = OFFER, payload = PAYLOAD, accepted = 1 } = {}) {
  const statements = [];
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          statements.push({ sql, args });
          return {
            run: async () => ({
              meta: { changes: /state='accepted'/.test(sql) ? accepted : 1 },
            }),
            first: async () => {
              if (/FROM offers o JOIN leads l/.test(sql)) {
                /* After the accepting UPDATE, the row reads back accepted. */
                return statements.some((s) => /state='accepted'/.test(s.sql))
                  ? { ...offer, state: 'accepted', claimed_by: offer.assignee }
                  : offer;
              }
              if (/payload_json/.test(sql)) {
                return payload ? { payload_json: JSON.stringify(payload) } : null;
              }
              return null;
            },
          };
        },
      };
    },
    statements,
  };
  return db;
}

const bodyOf = (res) => res.text();

test('the accepted page carries the lead itself, not a promise of an email', async () => {
  const res = await handleClaimPost({ DB: fakeDb() }, 'tok', null);
  const html = await bodyOf(res);

  /* Everything the director needs to pick up the phone, on the page they
     are already looking at. */
  assert.match(html, /Aldrich Duister/);
  assert.match(html, /0817284756/);
  assert.match(html, /aldrich@example\.com/);
  assert.match(html, /Northern Suburbs/);
  assert.match(html, /I want solar/);
});

test('customer input is escaped, so a stray angle bracket cannot break the page', async () => {
  const res = await handleClaimPost({ DB: fakeDb() }, 'tok', null);
  const html = await bodyOf(res);

  // The message contains "<R4000>" and "&". Neither may reach the DOM raw.
  assert.ok(!html.includes('<R4000>'), 'raw angle brackets from the customer reached the page');
  assert.match(html, /&lt;R4000&gt;/);
  assert.match(html, /&amp; rising/);
});

test('the accepted page does not close itself out from under the details', async () => {
  const res = await handleClaimPost({ DB: fakeDb() }, 'tok', null);
  const html = await bodyOf(res);

  /* The old page auto-closed the tab after five seconds. That was right when
     the page said nothing; it is destructive now that the page IS the
     record. */
  assert.ok(!/window\.close\(\)/.test(html), 'the page still tries to close itself');
  assert.ok(!/will close in/.test(html), 'the page still counts down to closing');
});

test('an unreadable payload still accepts the lead and says so', async () => {
  /* The accept must never fail because the details could not be rendered.
     Claiming is the thing with a deadline; rendering is cosmetic. */
  const res = await handleClaimPost({ DB: fakeDb({ payload: null }) }, 'tok', null);
  const html = await bodyOf(res);

  assert.match(html, /Accepted/);
  assert.ok(res.status === 200);
});

test('accepting still marks the lead and closes sibling offers', async () => {
  const db = fakeDb();
  await handleClaimPost({ DB: db }, 'tok', null);

  assert.ok(
    db.statements.some((s) => /UPDATE leads SET claimed_by=\?/.test(s.sql)),
    'the lead was not stamped with the claiming director',
  );
  assert.ok(
    db.statements.some((s) => /id<>\? AND state IN \('offered','pending_send'\)/.test(s.sql)),
    'sibling offers were not closed',
  );
});

test('onAccepted still fires, because the email is still wanted', async () => {
  let seen = null;
  await handleClaimPost({ DB: fakeDb() }, 'tok', async (offer) => { seen = offer; });
  assert.strictEqual(seen && seen.lead_id, 28);
  assert.strictEqual(seen && seen.assignee, 'stephan');
});

test('the page BEFORE accepting still shows no customer details', async () => {
  /* The teaser boundary is deliberate: an offer a director has not accepted
     must not name the customer. Putting details on the accepted page must not
     leak them onto the page that precedes it. */
  const res = await handleClaimGet({ DB: fakeDb() }, 'tok');
  const html = await bodyOf(res);

  assert.ok(!html.includes('Aldrich Duister'), 'the pre-accept page named the customer');
  assert.ok(!html.includes('0817284756'), 'the pre-accept page carried the phone number');
  assert.match(html, /Energy enquiry/);
});
