'use strict';

/* The preview server opts into Cloudflare Pages' URL behaviour. These tests
 * pin both halves of that: the fallbacks work when asked for, and they stay
 * off for the conformance runner and the tests, which address files exactly
 * and must keep 404ing on a path that does not exist. */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const { startServer } = require('../scripts/static-server.js');

function fixtureRoot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sl-server-'));
  fs.mkdirSync(path.join(dir, 'energy'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'energy', 'index.html'), '<!doctype html>index');
  fs.writeFileSync(path.join(dir, 'energy', 'blog-post.html'), '<!doctype html>post');
  fs.writeFileSync(path.join(dir, 'energy', 'style.css'), 'body{}');
  /* Bait for the extension rule: if the fallback ever stops checking that the
     request is extensionless, /energy/missing.css would resolve to this and
     serve a page where an asset was asked for. */
  fs.writeFileSync(path.join(dir, 'energy', 'missing.css.html'), 'BAIT');
  return dir;
}

async function get(server, urlPath) {
  const res = await fetch(server.urlFor(urlPath));
  return { status: res.status, body: await res.text() };
}

/* fetch() normalises "/../x" to "/x" before it leaves the client, so a
   traversal test written with fetch never reaches the server and passes no
   matter what the server does. These go out over a raw request, which sends
   the path verbatim. */
function rawGet(server, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port: server.port, path: urlPath },
      (res) => {
        let body = '';
        res.on('data', (c) => { body += c; });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

test('cleanUrls serves an extensionless path from the .html file', async () => {
  const s = await startServer(fixtureRoot(), { cleanUrls: true });
  try {
    assert.deepStrictEqual(await get(s, '/energy/blog-post'), { status: 200, body: '<!doctype html>post' });
  } finally { s.close(); }
});

test('cleanUrls serves a bare directory from its index.html', async () => {
  const s = await startServer(fixtureRoot(), { cleanUrls: true });
  try {
    assert.deepStrictEqual(await get(s, '/energy'), { status: 200, body: '<!doctype html>index' });
  } finally { s.close(); }
});

test('cleanUrls never appends .html to a path that already has an extension', async () => {
  const s = await startServer(fixtureRoot(), { cleanUrls: true });
  try {
    /* missing.css.html exists in the fixture purely as bait. Appending .html
       to an asset request would mask a broken stylesheet link as a served
       page, so this must 404 and must not return the bait. */
    const res = await get(s, '/energy/missing.css');
    assert.strictEqual(res.status, 404);
    assert.ok(!res.body.includes('BAIT'), 'appended .html to an extensioned path');
  } finally { s.close(); }
});

test('cleanUrls still 404s a path with no file behind it', async () => {
  const s = await startServer(fixtureRoot(), { cleanUrls: true });
  try {
    assert.strictEqual((await get(s, '/energy/no-such-page')).status, 404);
  } finally { s.close(); }
});

test('without cleanUrls an extensionless path 404s, which is what the gate relies on', async () => {
  const s = await startServer(fixtureRoot(), {});
  try {
    assert.strictEqual((await get(s, '/energy/blog-post')).status, 404);
    assert.strictEqual((await get(s, '/energy')).status, 404);
  } finally { s.close(); }
});

test('the root is still not escapable with cleanUrls on', async () => {
  const root = fixtureRoot();
  const outside = path.join(root, '..', 'sl-escape-target.html');
  fs.writeFileSync(outside, 'secret');
  const s = await startServer(root, { cleanUrls: true });
  try {
    /* Plain traversal, and the percent-encoded form, which survives every
       layer that would otherwise normalise it away. Both must 404 rather than
       return the file that sits one directory above the served root. */
    for (const p of ['/../sl-escape-target', '/%2e%2e/sl-escape-target']) {
      const res = await rawGet(s, p);
      assert.strictEqual(res.status, 404, p + ' should not resolve');
      assert.ok(!res.body.includes('secret'), p + ' leaked the file above the root');
    }
  } finally {
    s.close();
    fs.rmSync(outside, { force: true });
  }
});
