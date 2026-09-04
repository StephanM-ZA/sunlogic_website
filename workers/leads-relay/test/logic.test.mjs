import test from 'node:test';
import assert from 'node:assert';
import {
  normaliseDivision, divisionLabel, nextAssignee, newToken,
  expiryFrom, sqliteNow, OTHER,
} from '../src/logic.mjs';

/* --- divisions ---------------------------------------------------------- */

test('current division names normalise to themselves', () => {
  assert.strictEqual(normaliseDivision('Energy', 'contact'), 'energy');
  assert.strictEqual(normaliseDivision('Electrical', 'contact'), 'electrical');
  assert.strictEqual(normaliseDivision('Smart Solutions', 'contact'), 'smart');
  assert.strictEqual(normaliseDivision('Not sure yet', 'contact'), 'unsure');
});

test('historic names still normalise — 11 live rows say these', () => {
  assert.strictEqual(normaliseDivision('Solar', 'contact'), 'energy');
  assert.strictEqual(normaliseDivision('Energy management', 'contact'), 'smart');
});

test('casing and stray whitespace do not matter', () => {
  assert.strictEqual(normaliseDivision('  energy  ', 'contact'), 'energy');
  assert.strictEqual(normaliseDivision('SMART SOLUTIONS', 'contact'), 'smart');
});

test('a calculator submission is always energy, whatever it carries', () => {
  assert.strictEqual(normaliseDivision(undefined, 'calculator'), 'energy');
  assert.strictEqual(normaliseDivision('Electrical', 'calculator'), 'energy');
});

test('an unrecognised value is unsure, never a guess', () => {
  assert.strictEqual(normaliseDivision('Plumbing', 'contact'), 'unsure');
  assert.strictEqual(normaliseDivision('', 'contact'), 'unsure');
  assert.strictEqual(normaliseDivision(undefined, 'contact'), 'unsure');
  assert.strictEqual(normaliseDivision(null, 'contact'), 'unsure');
});

test('labels are what a director actually reads', () => {
  assert.strictEqual(divisionLabel('energy'), 'Energy');
  assert.strictEqual(divisionLabel('electrical'), 'Electrical');
  assert.strictEqual(divisionLabel('smart'), 'Smart Solutions');
  assert.strictEqual(divisionLabel('unsure'), 'Not sure yet');
  assert.strictEqual(divisionLabel('nonsense'), 'Not sure yet');
});

test('every division a form can produce has a label', () => {
  for (const need of ['Energy', 'Electrical', 'Smart Solutions', 'Not sure yet', 'Solar', 'Energy management']) {
    const d = normaliseDivision(need, 'contact');
    assert.ok(divisionLabel(d) !== undefined, need + ' has no label');
  }
});

/* --- rotation ----------------------------------------------------------- */

test('rotation strictly alternates by offer', () => {
  assert.strictEqual(nextAssignee(null), 'stephan');
  assert.strictEqual(nextAssignee('stephan'), 'craig');
  assert.strictEqual(nextAssignee('craig'), 'stephan');
});

test('rotation survives a junk pointer rather than throwing', () => {
  assert.strictEqual(nextAssignee('nobody'), 'stephan');
  assert.strictEqual(nextAssignee(undefined), 'stephan');
  assert.strictEqual(nextAssignee(''), 'stephan');
});

test('twenty consecutive offers split exactly ten each', () => {
  let last = null;
  const count = { stephan: 0, craig: 0 };
  for (let i = 0; i < 20; i++) {
    last = nextAssignee(last);
    count[last]++;
  }
  assert.deepStrictEqual(count, { stephan: 10, craig: 10 });
});

test('OTHER is the reassignment target and is symmetric', () => {
  assert.strictEqual(OTHER.stephan, 'craig');
  assert.strictEqual(OTHER.craig, 'stephan');
  assert.strictEqual(OTHER[OTHER.stephan], 'stephan');
});

/* --- tokens ------------------------------------------------------------- */

test('tokens are long, url-safe and never repeat', () => {
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const t = newToken();
    assert.match(t, /^[A-Za-z0-9_-]{43}$/, 'bad token shape: ' + t);
    assert.ok(!seen.has(t), 'token repeated');
    seen.add(t);
  }
});

test('tokens survive a URL round trip unchanged', () => {
  for (let i = 0; i < 50; i++) {
    const t = newToken();
    assert.strictEqual(encodeURIComponent(t), t, 'token needs escaping: ' + t);
  }
});

/* --- expiry ------------------------------------------------------------- */

test('expiry is ttl minutes after the given instant, in SQLite format', () => {
  assert.strictEqual(expiryFrom('2026-09-04 08:00:00', 1440), '2026-09-05 08:00:00');
  assert.strictEqual(expiryFrom('2026-09-04 08:00:00', 2), '2026-09-04 08:02:00');
});

test('expiry crosses midnight, month end and a leap day correctly', () => {
  assert.strictEqual(expiryFrom('2026-09-04 23:30:00', 60), '2026-09-05 00:30:00');
  assert.strictEqual(expiryFrom('2026-09-30 12:00:00', 1440), '2026-10-01 12:00:00');
  assert.strictEqual(expiryFrom('2028-02-28 12:00:00', 1440), '2028-02-29 12:00:00');
});

test('expiry is UTC — no local timezone leaks in', () => {
  // Written as SQLite writes it, read back as SQLite compares it. If this
  // ever shifts by the machine's offset, every offer expires at the wrong
  // time and nothing errors.
  assert.strictEqual(expiryFrom('2026-01-01 00:00:00', 0), '2026-01-01 00:00:00');
});

test('an unparseable time throws rather than producing a silent Invalid Date', () => {
  assert.throws(() => expiryFrom('not a time', 60), /unparseable time/);
});

test('sqliteNow matches the format expiryFrom consumes', () => {
  const now = sqliteNow(new Date(Date.UTC(2026, 8, 4, 8, 0, 0)));
  assert.strictEqual(now, '2026-09-04 08:00:00');
  assert.strictEqual(expiryFrom(now, 1440), '2026-09-05 08:00:00');
});
