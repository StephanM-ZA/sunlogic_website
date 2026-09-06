'use strict';

/* Serves dist/ on a fixed port for the browser preview.
 *
 * This replaced `npx --yes http-server` in .claude/launch.json. Fetching a
 * package off the registry to serve four directories of static files is a
 * supply-chain risk taken for no gain, and the repo already owns a static
 * server that the conformance runner and the tests both use. One server,
 * three callers.
 *
 * Usage: node scripts/preview.js [port]
 *   http://127.0.0.1:8433/main/         the apex site
 *   http://127.0.0.1:8433/energy/       energy.sunlogic.co.za
 *   http://127.0.0.1:8433/electrical/   electrical.sunlogic.co.za
 */

const fs = require('fs');
const path = require('path');
const { startServer } = require('./static-server');

const PORT = Number(process.argv[2]) || 8433;
const DIST = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(DIST)) {
  console.error('dist/ does not exist. Run `npm run build` first.');
  process.exit(1);
}

startServer(DIST, { port: PORT, index: true }).then(
  (s) => {
    console.log('preview serving dist/ on http://127.0.0.1:' + s.port + '/');
    for (const site of fs.readdirSync(DIST).filter((d) => fs.statSync(path.join(DIST, d)).isDirectory())) {
      console.log('  http://127.0.0.1:' + s.port + '/' + site + '/');
    }
  },
  (err) => {
    console.error(err.code === 'EADDRINUSE' ? 'port ' + PORT + ' is already in use' : err.message);
    process.exit(1);
  },
);
