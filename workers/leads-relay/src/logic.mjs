/* Pure logic for lead claim and rotation.
 *
 * No fetch, no D1, no env, no clock reads except the one passed in. That is
 * the point rather than tidiness: rotation, division and expiry bugs are
 * silent. A rotation that quietly favours one director, or an expiry an hour
 * out because of a timezone, throws no error and shows up months later as an
 * argument about who did more work. Everything here is exhaustively testable,
 * so it is exhaustively tested.
 *
 * .mjs rather than .js: workers/leads-relay/src/index.js is an ES module
 * (`export default`), while the repo's package.json has no "type" field, so
 * Node treats a bare .js as CommonJS. Naming it .mjs makes the format
 * explicit for both consumers instead of relying on bundler interop.
 */

/* Historic spellings map onto current divisions. The eleven leads already in
   D1 say "Solar" and "Energy management"; those rows record what was actually
   submitted at the time and are not migrated. Keys are lower-cased on lookup,
   so casing in the form never matters. */
const DIVISIONS = {
  'energy': 'energy',
  'solar': 'energy',
  'electrical': 'electrical',
  'smart solutions': 'smart',
  'smart': 'smart',
  'energy management': 'smart',
  'not sure yet': 'unsure',
};

/* The stored value is normalised and lower-case; this is what a human reads.
   Renaming a division is therefore this object, not four HTML files and a
   database migration. */
const LABELS = {
  energy: 'Energy',
  electrical: 'Electrical',
  smart: 'Smart Solutions',
  unsure: 'Not sure yet',
};

const OTHER = { stephan: 'craig', craig: 'stephan' };

/* An unrecognised value becomes 'unsure' rather than a guess. A director
   reading "an Energy enquiry has come in" must be able to trust that the
   visitor chose Energy — the teaser is the only thing they see before
   deciding, so a plausible guess there is worse than an honest shrug. */
export function normaliseDivision(need, type) {
  if (type === 'calculator') return 'energy';
  const key = String(need ?? '').trim().toLowerCase();
  return DIVISIONS[key] || 'unsure';
}

export function divisionLabel(division) {
  return LABELS[division] || LABELS.unsure;
}

/* Strict alternation by offer: the pointer moves every time an offer is made,
   accepted or not. An unrecognised or missing pointer restarts at stephan
   rather than throwing — a corrupt rotation row must not stop leads flowing,
   because the cost of a slightly unfair rotation is an argument and the cost
   of a thrown exception is a lost enquiry. */
export function nextAssignee(lastOfferedTo) {
  return OTHER[lastOfferedTo] || 'stephan';
}

/* 32 bytes of CSPRNG as base64url, 43 characters. Possession of the mailbox
   is the authentication here, the same assumption a password-reset link
   makes; this only has to be unguessable, and it is. */
export function newToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* SQLite's 'YYYY-MM-DD HH:MM:SS' in UTC, matching datetime('now') so the
   comparison in the sweeper's WHERE clause is string-safe. Takes the instant
   rather than reading the clock, so expiry arithmetic is testable without
   mocking time. */
export function expiryFrom(fromSqlite, ttlMinutes) {
  const t = Date.parse(fromSqlite.replace(' ', 'T') + 'Z');
  if (Number.isNaN(t)) throw new TypeError('expiryFrom: unparseable time ' + fromSqlite);
  return new Date(t + ttlMinutes * 60000).toISOString().slice(0, 19).replace('T', ' ');
}

/* The current instant in the same format, so every timestamp this module
   produces and compares is written the one way. */
export function sqliteNow(date) {
  return (date || new Date()).toISOString().slice(0, 19).replace('T', ' ');
}

export { OTHER, LABELS };

/* The calculator's estimate email used to be a plain-text node inside n8n,
   with its conditional branches written as an inline ternary in an n8n
   expression. Moving it into the Worker means the numbers are worked out in
   JavaScript where they can be read and tested, and the template stays flat
   substitution.

   Residential and SME answer different questions. A homeowner wants the
   monthly saving and how long until it pays for itself; a business wants the
   saving against the instalment, because the number that decides it is
   whether the system is cash-flow positive from day one. */
export function estimateValues(payload) {
  const r = (payload && payload.results) || {};
  const inputs = (payload && payload.inputs) || {};
  const rand = (n) => Math.round(Number(n) || 0).toLocaleString('en-ZA');

  const savingsBlock = payload.mode === 'sme'
    ? 'Estimated monthly saving: <strong>R' + rand(r.monthlySavings) + '</strong><br/>' +
      'Estimated monthly instalment: <strong>R' + rand(r.monthlyInstallment) + '</strong><br/>' +
      'Estimated monthly cash flow: <strong>R' + rand(r.pivot) + '</strong>'
    : 'Estimated monthly saving: <strong>R' + rand((Number(r.firstYearSavings) || 0) / 12) + '</strong><br/>' +
      'Typical payback period: <strong>' +
      Math.round(Number(r.paybackYearsLow) || 0) + '\u2013' + Math.round(Number(r.paybackYearsHigh) || 0) +
      ' years</strong>';

  return {
    bill: rand(inputs.bill),
    panelKw: r.panelKw ?? '—',
    inverterKw: r.inverterKw ?? '—',
    batteryKwh: r.batteryKwh ?? '—',
    systemCost: rand(r.systemCost),
    savingsBlock,
    co2Tons: ((Number(r.annualCo2Kg) || 0) / 1000).toFixed(1),
    trees: Math.round(Number(r.treesEquivalent) || 0),
  };
}
