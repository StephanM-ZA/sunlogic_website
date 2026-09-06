'use strict';

/* A minimal static file server. Used by the conformance runner, the tests and
 * the browser preview — it exists so those do not each grow their own copy.
 *
 * Ephemeral port by default, which is what the automated callers want: they
 * run concurrently and must never collide. The preview passes a fixed port
 * instead, because a person has to be able to type the URL. */

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

function startServer(rootDir, options) {
  const root = path.resolve(rootDir);
  const opts = options || {};
  /* 0 means "any free port", which is the default and what the runners use. */
  const port = opts.port || 0;
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      /* Only the preview asks for directory indexes. The runners address every
         page by its full filename, so they never reach this. */
      if (opts.index && rel.endsWith('/')) rel += 'index.html';
      let file = path.resolve(path.join(root, rel));
      /* Cloudflare Pages, which is what these sites actually deploy to, serves
         /blog-post from blog-post.html and /energy from energy/index.html. The
         preview opts into the same two fallbacks so a URL typed by hand behaves
         the way it will in production rather than 404ing only here. Deliberately
         opt-in: the conformance runner and the tests address every file exactly,
         and a fallback that quietly resolves a wrong path would hide a broken
         link from the gate instead of failing it. */
      if (opts.cleanUrls && !fs.existsSync(file)) {
        /* Extensionless only. /style.css must 404 rather than try style.css.html. */
        if (!path.extname(rel)) {
          const asHtml = path.resolve(file + '.html');
          if (asHtml.startsWith(root) && fs.existsSync(asHtml)) file = asHtml;
        }
      }
      if (opts.cleanUrls && fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        const asIndex = path.resolve(path.join(file, 'index.html'));
        if (asIndex.startsWith(root) && fs.existsSync(asIndex)) file = asIndex;
      }
      /* Refuse anything that escapes the root — this serves a repo directory. */
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('not found: ' + rel);
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        port,
        close: () => server.close(),
        urlFor: (p) => 'http://127.0.0.1:' + port + p,
      });
    });
  });
}

module.exports = { startServer };
