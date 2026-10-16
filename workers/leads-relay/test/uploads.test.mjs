import test from 'node:test';
import assert from 'node:assert';
import {
  isAllowedType, extensionFor, uploadKey, isUploadKey,
  declaredSizeExceedsLimit, uploadBaseUrl, MAX_UPLOAD_BYTES,
  chunkRanges, CHUNK_BYTES,
} from '../src/uploads.mjs';

/* --- type allow-list ---------------------------------------------------- */

test('the types a phone camera and a scanned COC actually produce are allowed', () => {
  for (const t of ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']) {
    assert.strictEqual(isAllowedType(t), true, t + ' should be allowed');
  }
});

test('a charset or boundary parameter does not defeat the allow-list', () => {
  // Browsers append these. An exact-match Set without the split would reject
  // a perfectly ordinary upload, and the installer would see "unsupported
  // file type" for a JPEG.
  assert.strictEqual(isAllowedType('image/jpeg; charset=binary'), true);
  assert.strictEqual(isAllowedType('IMAGE/JPEG'), true);
  assert.strictEqual(isAllowedType('  image/png  '), true);
});

test('svg is refused even though it is an image', () => {
  // It is served back from our own origin, and an SVG is a script delivered
  // as a picture. This is the one case the list exists for.
  assert.strictEqual(isAllowedType('image/svg+xml'), false);
});

test('video, html and a missing type are refused', () => {
  assert.strictEqual(isAllowedType('video/mp4'), false);
  assert.strictEqual(isAllowedType('text/html'), false);
  assert.strictEqual(isAllowedType(''), false);
  assert.strictEqual(isAllowedType(undefined), false);
  assert.strictEqual(isAllowedType(null), false);
});

/* --- keys --------------------------------------------------------------- */

test('the key carries no part of the submitted filename', () => {
  const key = uploadKey(Date.parse('2026-10-15T09:00:00Z'), 'a'.repeat(32), 'image/jpeg');
  assert.strictEqual(key, 'brief/2026/10/' + 'a'.repeat(32) + '.jpg');
});

test('the date prefix is UTC and zero-padded', () => {
  const key = uploadKey(Date.parse('2026-01-05T23:30:00Z'), 'b'.repeat(32), 'image/png');
  assert.match(key, /^brief\/2026\/01\//);
});

test('an unknown type still produces a usable key', () => {
  // Unreachable through the route, which checks isAllowedType first. It is
  // here so that a later caller cannot produce a key with no extension.
  assert.strictEqual(extensionFor('application/zip'), 'bin');
  assert.match(uploadKey(Date.now(), 'c'.repeat(32), 'application/zip'), /\.bin$/);
});

test('isUploadKey accepts exactly what uploadKey writes', () => {
  const key = uploadKey(Date.now(), 'd'.repeat(32), 'application/pdf');
  assert.strictEqual(isUploadKey(key), true);
});

test('path traversal and absolute paths are not keys', () => {
  // The GET route passes this straight to R2, so this is the check that
  // matters. Every one of these must fail here rather than at the bucket.
  for (const bad of [
    'brief/../../secret',
    '../brief/2026/10/' + 'a'.repeat(32) + '.jpg',
    '/brief/2026/10/' + 'a'.repeat(32) + '.jpg',
    'brief/2026/10/' + 'a'.repeat(32) + '.jpg/../../x',
    'brief/2026/10/' + 'a'.repeat(31) + '.jpg',
    'brief/2026/10/' + 'A'.repeat(32) + '.jpg',
    'brief/2026/10/' + 'a'.repeat(32) + '.html',
    'brief/26/10/' + 'a'.repeat(32) + '.jpg',
    '',
    undefined,
  ]) {
    assert.strictEqual(isUploadKey(bad), false, String(bad) + ' must not be a key');
  }
});

/* --- size --------------------------------------------------------------- */

test('a declared size over the cap is refused and one under it is not', () => {
  assert.strictEqual(declaredSizeExceedsLimit(String(MAX_UPLOAD_BYTES + 1)), true);
  assert.strictEqual(declaredSizeExceedsLimit(String(MAX_UPLOAD_BYTES)), false);
  assert.strictEqual(declaredSizeExceedsLimit('1048576'), false);
});

test('an absent or unparseable Content-Length is not treated as oversize', () => {
  // A chunked request has no Content-Length. Refusing it here would refuse
  // every upload from a client that streams.
  assert.strictEqual(declaredSizeExceedsLimit(null), false);
  assert.strictEqual(declaredSizeExceedsLimit(''), false);
  assert.strictEqual(declaredSizeExceedsLimit('not-a-number'), false);
});

/* --- base url ----------------------------------------------------------- */

test('the returned URL base prefers UPLOAD_BASE_URL and falls back to CLAIM_BASE_URL', () => {
  assert.strictEqual(
    uploadBaseUrl({ UPLOAD_BASE_URL: 'https://files.example', CLAIM_BASE_URL: 'https://leads.example' }),
    'https://files.example');
  assert.strictEqual(uploadBaseUrl({ CLAIM_BASE_URL: 'https://leads.example' }), 'https://leads.example');
  assert.strictEqual(uploadBaseUrl({}), '');
  assert.strictEqual(uploadBaseUrl(undefined), '');
});

/* --- document types ------------------------------------------------------
   Added when the brief had to take plans and certificates, not just photos. */

test('pdf, word and excel are allowed', () => {
  for (const t of [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]) {
    assert.strictEqual(isAllowedType(t), true, t + ' should be allowed');
  }
});

test('every allowed type has an extension AND the key pattern accepts it', () => {
  // The trap this guards: a type added to the allow-list but not to the key
  // pattern uploads perfectly and then 404s on the way back out, because the
  // GET route validates the key before it looks anything up.
  for (const t of [
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]) {
    const ext = extensionFor(t);
    assert.notStrictEqual(ext, 'bin', t + ' has no extension mapping');
    const key = uploadKey(Date.now(), 'a'.repeat(32), t);
    assert.strictEqual(isUploadKey(key), true, 'key pattern rejects ' + t + ' (' + ext + ')');
  }
});

/* --- chunking ------------------------------------------------------------
   An off-by-one here corrupts a file in a way nothing reports: the row count
   is right, the recorded size is right, and the bytes are wrong. */

test('a file smaller than one chunk produces exactly one chunk', () => {
  assert.deepStrictEqual(chunkRanges(500, 1000), [{ start: 0, end: 500 }]);
});

test('a file exactly one chunk long does not produce an empty second chunk', () => {
  assert.deepStrictEqual(chunkRanges(1000, 1000), [{ start: 0, end: 1000 }]);
});

test('chunks are contiguous, non-overlapping and cover the whole file', () => {
  const total = 5_000_000;
  const ranges = chunkRanges(total, CHUNK_BYTES);
  assert.strictEqual(ranges[0].start, 0);
  assert.strictEqual(ranges[ranges.length - 1].end, total);
  for (let i = 1; i < ranges.length; i++) {
    assert.strictEqual(ranges[i].start, ranges[i - 1].end, 'gap or overlap at chunk ' + i);
  }
  const covered = ranges.reduce((n, r) => n + (r.end - r.start), 0);
  assert.strictEqual(covered, total, 'chunks do not cover the file exactly');
});

test('no chunk ever exceeds D1\'s value cap', () => {
  // 2,000,000 bytes is the platform limit; exceeding it fails the INSERT.
  for (const total of [1, 1_900_001, 5_000_000, 25 * 1024 * 1024]) {
    for (const r of chunkRanges(total, CHUNK_BYTES)) {
      assert.ok(r.end - r.start <= 2_000_000, 'chunk too large for D1 at total ' + total);
    }
  }
});

test('a zero-length file still produces one (empty) chunk', () => {
  // Unreachable through the route, which refuses an empty body. Here so the
  // helper is not the thing that is wrong if it ever is reached: no chunks at
  // all would read back as a 404 rather than as an empty file.
  assert.deepStrictEqual(chunkRanges(0, 1000), [{ start: 0, end: 0 }]);
});

test('the limit is now a product decision, well above one chunk', () => {
  assert.ok(MAX_UPLOAD_BYTES > CHUNK_BYTES, 'the ceiling must exceed one chunk or splitting is pointless');
  assert.strictEqual(MAX_UPLOAD_BYTES, 25 * 1024 * 1024);
});
