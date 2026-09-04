import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  normaliseDivision, divisionLabel, nextAssignee, newToken,
  expiryFrom, sqliteNow, OTHER, estimateValues, applyRedirect,
} from '../src/logic.mjs';

const REPO = fileURLToPath(new URL('../../../', import.meta.url));

/* --- divisions ---------------------------------------------------------- */

test('current division names normalise to themselves', () => {
  assert.strictEqual(normaliseDivision('Energy', 'contact'), 'energy');
  assert.strictEqual(normaliseDivision('Electrical', 'contact'), 'electrical');
  assert.strictEqual(normaliseDivision('Smart Solutions', 'contact'), 'smart');
  assert.strictEqual(normaliseDivision('Servicing', 'contact'), 'servicing');
  assert.strictEqual(normaliseDivision('Not sure yet', 'contact'), 'unsure');
});

test('servicing is a division of its own, not folded into a trade', () => {
  // It must never resolve to energy or electrical: a director accepting a
  // call-out on somebody else's installation needs to know that up front.
  assert.strictEqual(normaliseDivision('Servicing', 'contact'), 'servicing');
  assert.strictEqual(normaliseDivision('service', 'contact'), 'servicing');
  assert.strictEqual(divisionLabel('servicing'), 'Servicing');
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
  assert.strictEqual(divisionLabel('servicing'), 'Servicing');
  assert.strictEqual(divisionLabel('unsure'), 'Not sure yet');
  assert.strictEqual(divisionLabel('nonsense'), 'Not sure yet');
});

test('every division a form can produce has a label', () => {
  for (const need of ['Energy', 'Electrical', 'Smart Solutions', 'Servicing', 'Not sure yet', 'Solar', 'Energy management']) {
    const d = normaliseDivision(need, 'contact');
    assert.ok(divisionLabel(d) !== undefined, need + ' has no label');
  }
});

/* The assertion that ties the form to the Worker.
   ------------------------------------------------------------------
   The option list a visitor picks from and the map that turns their answer
   into a division live in different files, in different runtimes, deployed
   by different pipelines. Adding an option to the form and forgetting the
   Worker does not error: the lead is accepted, stored as "unsure", and the
   director is told an enquiry arrived without being told what kind. It
   looks exactly like a visitor who ticked "Not sure yet".
   So the test reads the real option list out of the real file rather than
   restating it — a copy here would drift the same way. */
function formOptions() {
  const src = readFileSync(REPO + 'shared/components.js', 'utf8');
  const m = src.match(/name="need"[^]*?options="([^"]+)"/);
  assert.ok(m, 'could not find the need field options in shared/components.js');
  return m[1].split('|').map((s) => s.trim()).filter(Boolean);
}

test('every option in the contact form maps to a real division', () => {
  const options = formOptions();
  assert.ok(options.length >= 4, 'suspiciously short option list: ' + options.join(', '));
  const unmapped = options.filter((o) => normaliseDivision(o, 'contact') === 'unsure' && o !== 'Not sure yet');
  assert.deepStrictEqual(unmapped, [],
    'these form options fall through to "unsure" — add them to DIVISIONS in logic.mjs: ' + unmapped.join(', '));
});

test('the three contact pages offer the same options as the modal', () => {
  const expected = formOptions().join('|');
  for (const site of ['site-main', 'site-energy', 'site-electrical']) {
    const html = readFileSync(REPO + site + '/contact.html', 'utf8');
    const m = html.match(/name="need"[^]*?options="([^"]+)"/);
    assert.ok(m, site + '/contact.html has no need field');
    assert.strictEqual(m[1], expected, site + '/contact.html offers a different list to the modal');
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

/* --- the calculator estimate ------------------------------------------- */

test('residential estimate: monthly saving and payback', () => {
  const v = estimateValues({ mode: 'residential', inputs: { bill: 3000 },
    results: { panelKw: 7.4, inverterKw: 6, batteryKwh: 10, systemCost: 210000,
      firstYearSavings: 28000, paybackYearsLow: 7, paybackYearsHigh: 8,
      annualCo2Kg: 6200, treesEquivalent: 100 } });
  assert.match(v.savingsBlock, /Estimated monthly saving/);
  assert.match(v.savingsBlock, /payback period/);
  assert.strictEqual(v.co2Tons, '6.2');
  assert.strictEqual(v.trees, 100);
  assert.strictEqual(v.panelKw, 7.4);
});

test('sme estimate answers a different question — cash flow, not payback', () => {
  const v = estimateValues({ mode: 'sme', inputs: { bill: 20000 },
    results: { monthlySavings: 9000, monthlyInstallment: 7000, pivot: 2000,
      annualCo2Kg: 41000, treesEquivalent: 660 } });
  assert.match(v.savingsBlock, /cash flow/);
  assert.match(v.savingsBlock, /instalment/);
  assert.ok(!/payback/.test(v.savingsBlock), 'sme must not mention payback');
});

test('a missing or malformed result set produces text, never NaN or undefined', () => {
  const v = estimateValues({ mode: 'residential' });
  for (const [k, val] of Object.entries(v)) {
    assert.ok(!String(val).includes('NaN'), k + ' contains NaN');
    assert.ok(!String(val).includes('undefined'), k + ' contains undefined');
  }
  assert.strictEqual(v.panelKw, '—');
});

/* --- mail redirect ------------------------------------------------------
   The bug this exists to prevent: the redirect was applied when building
   the director list and nowhere else, so the calculator's estimate — which
   is addressed to whoever filled the form in — went straight to a real
   customer while wearing a banner announcing it had been redirected to a
   personal Gmail account. Both halves were wrong and neither errored. */

test('with MAIL_REDIRECT_TO set, every recipient collapses to it', () => {
  const env = { MAIL_REDIRECT_TO: 'test@example.com' };
  assert.deepStrictEqual(applyRedirect(env, ['stephan@sunlogic.co.za']), ['test@example.com']);
  assert.deepStrictEqual(applyRedirect(env, ['stephan@sunlogic.co.za', 'craig@sunlogic.co.za']), ['test@example.com']);
  // the one that used to escape: a visitor's own address
  assert.deepStrictEqual(applyRedirect(env, ['a.customer@gmail.com']), ['test@example.com']);
});

test('without it, recipients are untouched and identity is preserved', () => {
  const to = ['a.customer@gmail.com'];
  // Same reference back, which is what lets send() tell "not redirected"
  // from "redirected" without comparing contents.
  assert.strictEqual(applyRedirect({}, to), to);
  assert.strictEqual(applyRedirect(undefined, to), to);
  assert.strictEqual(applyRedirect({ MAIL_REDIRECT_TO: '' }, to), to);
});
