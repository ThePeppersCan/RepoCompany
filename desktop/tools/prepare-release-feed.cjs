'use strict';
// Immutable content-addressed downloads avoid host HTML redirects and let all
// three games share identical assets without sharing installed save data.
const fs = require('node:fs'), fsp = fs.promises, path = require('node:path'), crypto = require('node:crypto');
const { validateManifest } = require('../lib/manifest.cjs');
const releases = path.resolve(__dirname, '../releases');
const output = process.argv[2] && path.resolve(process.argv[2]);
const origin = 'https://repo-company-games.pages.dev';
if (!output || fs.existsSync(output)) throw Error('Provide a new staging directory for the release feed.');
async function hash(file) { const hash = crypto.createHash('sha256'); for await (const b of fs.createReadStream(file)) hash.update(b); return hash.digest('hex'); }
(async () => {
  await fsp.mkdir(path.join(output, 'blobs'), { recursive: true });
  const blobs = new Set(), report = [];
  for (const id of ['morogue', 'moratales', 'manager']) {
    const source = path.join(releases, id), raw = JSON.parse(await fsp.readFile(path.join(source, 'manifest.json')));
    delete raw.baseUrl;
    validateManifest(raw, { id, entry: raw.entry, developmentManifest: path.join(source, 'manifest.json') }, { developmentRoot: path.join(source, 'payload') });
    let total = 0;
    for (const file of raw.files) {
      const local = path.join(source, 'payload', ...file.path.split('/')), stat = await fsp.stat(local);
      if (stat.size !== file.size || await hash(local) !== file.sha256) throw Error('Release changed during staging: ' + id + '/' + file.path);
      if (stat.size > 25 * 1024 * 1024) throw Error('Asset exceeds static host limit: ' + file.path);
      const blob = file.sha256 + '.bin';
      if (!blobs.has(blob)) { await fsp.link(local, path.join(output, 'blobs', blob)); blobs.add(blob); }
      file.url = origin + '/blobs/' + blob;
      total += stat.size;
    }
    delete raw.baseUrl;
    if (id === 'morogue' && raw.version === '0.1.0-dev') raw.version = '0.1.0-preview.2';
    validateManifest(raw, { id, origin, entry: raw.entry, approvedOrigins: [origin] }, { manifestURL: origin + '/' + id + '/manifest.json' });
    await fsp.mkdir(path.join(output, id), { recursive: true });
    await fsp.writeFile(path.join(output, id, 'manifest.json'), JSON.stringify(raw));
    report.push({ id, version: raw.version, files: raw.files.length, bytes: total });
  }
  await fsp.writeFile(path.join(output, '_headers'), '/blobs/*\n  Cache-Control: public, max-age=31536000, immutable\n/*/manifest.json\n  Cache-Control: no-store\n');
  console.log(JSON.stringify({ games: report, uniqueBlobs: blobs.size, output }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
