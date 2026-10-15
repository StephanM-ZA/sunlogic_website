import test from 'node:test';
import assert from 'node:assert';
import {
  isAllowedType, extensionFor, uploadKey, isUploadKey,
  declaredSizeExceedsLimit, uploadBaseUrl, MAX_UPLOAD_BYTES,
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
