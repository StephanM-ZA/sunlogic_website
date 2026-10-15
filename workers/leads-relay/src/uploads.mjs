/* Photo uploads for the project brief, stored in R2 and served back out.
 *
 * Why this exists at all: the n8n workflow "Sunlogic Project Brief" takes a
 * URL string per upload field, stores it in Postgres and hands it to Trello's
 * attach-by-URL node. It never receives a file. WordPress used to host those
 * files and answer that URL; when the site was rebuilt the uploads directory
 * went with it, and the brief form had nowhere to put a photo. This is the
 * replacement host.
 *
 * Served back through the Worker rather than from a public R2 bucket. A public
 * bucket needs its own subdomain and its own DNS record, and the only consumer
 * is Trello fetching an image it was handed. One GET route costs nothing and
 * keeps the bucket private, so a key that leaks is one object rather than a
 * listable bucket.
 *
 * The key is unguessable and that is the whole access control, the same
 * assumption /claim/<token> makes. A brief photo is a picture of a
 * distribution board; it is not public, but it is not a credential either, and
 * the alternative — a signed URL Trello would have to refresh — is a moving
 * part for no gain.
 *
 * .mjs for the same reason as logic.mjs: package.json has no "type", so a bare
 * .js here would be read as CommonJS by node --test.
 */

/* What a phone's camera roll actually produces, plus PDF because a sparky
   photographs a COC as often as a DB. Deliberately a list and not a prefix
   match on image/: image/svg+xml is an image by content type and a script by
   behaviour, and these are served back from our own origin, where a script
   would run with our cookies. */
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

/* D1 caps a single BLOB at 2,000,000 bytes, and this is where photos are
   stored — so unlike every other limit in this file, this one is not ours to
   choose. A little headroom under it for the row's other columns.

   A raw 48MP phone photo is 8 to 12 MB and would be refused outright, which
   is why the page downscales before uploading rather than sending what the
   camera produced: a distribution board at 1600px lands around 300 KB and is
   still legible enough to read a breaker label. See dlCompressImage in
   shared/forms.js. A file that arrives over this has skipped that step, and
   refusing it is correct. */
export const MAX_UPLOAD_BYTES = 1_900_000;

export function isAllowedType(contentType) {
  if (typeof contentType !== 'string') return false;
  /* Strip any ;charset= or ;boundary= a browser appended. */
  return ALLOWED_TYPES.has(contentType.split(';')[0].trim().toLowerCase());
}

const EXTENSION_OF = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf',
};

export function extensionFor(contentType) {
  if (typeof contentType !== 'string') return 'bin';
  return EXTENSION_OF[contentType.split(';')[0].trim().toLowerCase()] || 'bin';
}

/* The stored key carries no part of the submitted filename.
   ------------------------------------------------------------------
   It is tempting to keep it for the sake of a recognisable URL, and it is the
   wrong call: the name comes from the browser, it reaches Trello and an email
   client as a URL, and sanitising it correctly for a path, a URL and an
   HTML attribute at once is three jobs. The original name is kept as R2
   metadata instead, where it is data and never a path.
   The date prefix is for a human listing the bucket in a year's time, not for
   routing — nothing parses it back out. */
export function uploadKey(now, randomHex, contentType) {
  const d = new Date(now);
  const yyyy = String(d.getUTCFullYear());
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return 'brief/' + yyyy + '/' + mm + '/' + randomHex + '.' + extensionFor(contentType);
}

/* Matches what uploadKey writes and nothing else. Anchored, no dot segments,
   fixed hex length: a key is 32 hex characters and one known extension, so
   '../' and an absolute path both fail here rather than at R2. */
export const UPLOAD_KEY_PATTERN =
  /^brief\/\d{4}\/\d{2}\/[0-9a-f]{32}\.(jpg|png|webp|heic|heif|pdf|bin)$/;

export function isUploadKey(key) {
  return typeof key === 'string' && UPLOAD_KEY_PATTERN.test(key);
}

/* Content-Length is advisory — a chunked request has none, and a lying one is
   caught when the body is read and measured. It is checked anyway because
   rejecting a 400 MB body before reading it is worth a header's word. */
export function declaredSizeExceedsLimit(contentLengthHeader) {
  if (!contentLengthHeader) return false;
  const n = Number(contentLengthHeader);
  return Number.isFinite(n) && n > MAX_UPLOAD_BYTES;
}

export function randomHex() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/* The URL the brief form puts in the n8n field. Falls back to CLAIM_BASE_URL
   because both are this Worker's own public origin and there has never been a
   deploy where they differed; UPLOAD_BASE_URL exists only so they can be
   split later without touching this file. */
export function uploadBaseUrl(env) {
  return (env && (env.UPLOAD_BASE_URL || env.CLAIM_BASE_URL)) || '';
}
