'use strict';

// Audit the bytes players receive, without rebuilding source trees or accessing
// accounts. Binary responses are streamed through SHA-256; only text is retained.
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const crypto = require('node:crypto');
const { validatePath } = require('../lib/manifest.cjs');
const { assertPlainPath } = require('../lib/library.cjs');
const mora = require('./prepare-moratales.cjs');
const manager = require('./prepare-manager.cjs');
const morogue = require('./capture-published-morogue.cjs');
const TEXT = /\.(?:js|css|json|html|webmanifest|svg|txt|md|csv)$/i;
const ORIGINS = { moratales: 'https://moratales.repocompany.uk', manager: 'https://manager.repocompany.uk', morogue: 'https://morogue.repocompany.uk', 'comp-run': 'https://comp-run.fluffy-star-4855.chatgpt.site' };
const OVERLAYS = { moratales: ['town-cafe-day.js', 'town-cafe-service.js', 'town-kitchen.js', 'town-pleasure.js', 'town-roastery.js'].map(name => 'interface/' + name), manager: ['app.js', 'career-bootstrap.js', 'career-expansion.js', 'velmora-quidditch-engine.js'], 'comp-run': [] };
const digest = body => crypto.createHash('sha256').update(body).digest('hex');
const normalized = text => text.replace(/\r\n/g, '\n');

function sourceURL(gameId, relative, receipt) {
  validatePath(relative);
  if (!ORIGINS[gameId]) throw new Error('Unsupported parity target.');
  // The published host redirects /index.html to /. Audit the canonical page
  // directly so redirects remain forbidden for all fetched release resources.
  if (gameId === 'comp-run') return new URL(relative === 'index.html' ? '/' : relative, ORIGINS[gameId] + '/').href;
  if (gameId === 'morogue') {
    if (!receipt?.originalURL) throw new Error('Morogue requires a published capture receipt for every file.');
    const url = new URL(receipt.originalURL);
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || !(url.origin === ORIGINS.morogue || url.origin === 'https://repocompany.uk' && url.pathname.startsWith('/game-integrations/morogue/'))) throw new Error('Unapproved Morogue receipt source.');
    if (url.pathname !== '/') validatePath(decodeURIComponent(url.pathname.slice(1)));
    return url.href;
  }
  if (gameId === 'manager' && relative === 'index.html') return ORIGINS.manager + '/';
  if (relative === 'launcher/achievement-runtime.js' || OVERLAYS[gameId].includes(relative)) return `https://repocompany.uk/game-integrations/${gameId}/${path.posix.basename(relative)}`;
  if (gameId === 'manager' && relative === 'vendor/supabase.js') return 'https://repocompany.uk/vendor/supabase.js';
  return new URL(relative, ORIGINS[gameId] + '/').href;
}

function expectedNative(gameId, relative, text) {
  if (gameId === 'morogue') return { text: relative === 'launcher/achievement-runtime.js' ? text : morogue.transformText(text, { html: relative === 'interface/vampire-survivor/index.html' }), transform: relative === 'launcher/achievement-runtime.js' ? null : 'native-local-integration-URLs/script-order' };
  if (gameId === 'moratales' && ['interface/town-explorer.js', 'coop/client.js', 'coop/worker.js'].includes(relative)) return { text: mora.nativeSaveHooks(relative, text), transform: 'native-durable-save/pause' };
  if (gameId === 'moratales' && relative === 'preview.html') return { text: mora.transformHTML(text), transform: 'native-local-integration/character-script-order' };
  if (gameId === 'manager' && OVERLAYS.manager.includes(relative)) return { text: manager.nativeRuntime(relative, text), transform: 'native-account-bootstrap/durable-save/pause' };
  if (gameId === 'manager' && relative === 'index.html') {
    text = manager.rewriteIntegrationURLs(text);
    const sdk = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0';
    if (text.split(sdk).length !== 2) throw new Error('Manager published SDK entry changed.');
    text = text.replace(sdk, 'vendor/supabase.js').replace(/<script\b[^>]*\bsrc=["'][^"']*(?:game-integrations\/manager\/achievement-runtime\.js|game-achievements-client\.js)[^"']*["'][^>]*>\s*<\/script>/gi, '');
    return { text, transform: 'native-local-scripts/bundled-SDK/single-achievement-observer' };
  }
  return { text, transform: null };
}

async function fileHash(filename) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(filename)) hash.update(chunk);
  return hash.digest('hex');
}

async function readResponse(response, text, maxBytes = 32 * 1024 * 1024) {
  const hash = crypto.createHash('sha256'), parts = []; let bytes = 0;
  if (!response.body) throw new Error('The published response has no body.');
  for await (const part of response.body) {
    const chunk = Buffer.from(part); bytes += chunk.length;
    if (bytes > maxBytes) throw new Error('The published file exceeds the bounded audit size.');
    hash.update(chunk); if (text) parts.push(chunk);
  }
  return { sha256: hash.digest('hex'), bytes, text: text ? Buffer.concat(parts).toString('utf8') : null };
}

async function verifyGameParity({ release, output, concurrency = 16, fetchImpl = fetch, onProgress = () => {}, retries = 2, reuseVerifiedFrom } = {}) {
  if (!release || !output) throw new Error('Pass a release directory and a separate audit output directory.');
  release = path.resolve(release); output = path.resolve(output);
  if (output === release || output.startsWith(release + path.sep)) throw new Error('Audit output must be outside the immutable release.');
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 16) throw new Error('Concurrency must be between 1 and 16.');
  await assertPlainPath(release); await assertPlainPath(output, true);
  const manifestBody = await fsp.readFile(path.join(release, 'manifest.json'));
  const manifest = JSON.parse(manifestBody);
  if (!ORIGINS[manifest.gameId] || !Array.isArray(manifest.files)) throw new Error('Invalid parity manifest.');
  const seen = new Set();
  for (const file of manifest.files) { validatePath(file.path); if (seen.has(file.path)) throw new Error('Duplicate release path.'); seen.add(file.path); }
  const receipts = new Map();
  if (manifest.gameId === 'morogue') {
    const capture = JSON.parse(await fsp.readFile(path.join(release, 'package-report.json'), 'utf8'));
    if (capture.gameId !== manifest.gameId || capture.version !== manifest.version || !Array.isArray(capture.receipts) || capture.receipts.length !== manifest.files.length) throw new Error('Morogue capture receipt coverage does not match the manifest.');
    for (const receipt of capture.receipts) {
      if (receipts.has(receipt.path) || !seen.has(receipt.path) || !/^[a-f0-9]{64}$/.test(receipt.originalSha256)) throw new Error('Invalid or duplicate Morogue capture receipt.');
      sourceURL('morogue', receipt.path, receipt); receipts.set(receipt.path, receipt);
    }
    for (const file of manifest.files) if (receipts.get(file.path)?.bundledSha256 !== file.sha256) throw new Error('Morogue capture hash differs from the release manifest: ' + file.path);
  }
  let sourceAudit = null; const previousRows = new Map();
  if (reuseVerifiedFrom) {
    const body = await fsp.readFile(reuseVerifiedFrom), previous = JSON.parse(body);
    if (previous.gameId !== manifest.gameId || previous.version !== manifest.version || previous.files.length !== manifest.files.length) throw new Error('The previous audit belongs to a different release.');
    sourceAudit = { path: path.resolve(reuseVerifiedFrom), sha256: digest(body), completedAt: previous.completedAt };
    for (const row of previous.files) if (!row.error && row.status === 200 && row.equal && row.manifestIntact) previousRows.set(row.path, row);
  }
  await fsp.mkdir(output, { recursive: true });
  const journal = await fsp.open(path.join(output, 'files.ndjson'), 'ax');
  const startedAt = new Date().toISOString(), rows = new Array(manifest.files.length); let next = 0, completed = 0, fetchedBytes = 0, different = 0;
  try {
    await Promise.all(Array.from({ length: concurrency }, async () => {
      while (next < manifest.files.length) {
        const index = next++, file = manifest.files[index], receipt = receipts.get(file.path), url = sourceURL(manifest.gameId, file.path, receipt);
        const filename = path.join(release, 'payload', file.path), textFile = TEXT.test(file.path);
        const row = { path: file.path, sourceURL: url, manifestSha256: file.sha256, manifestBytes: file.size };
        try {
          await assertPlainPath(filename);
          row.installedSha256 = await fileHash(filename); row.installedBytes = (await fsp.stat(filename)).size;
          row.manifestIntact = row.installedSha256 === file.sha256 && row.installedBytes === file.size;
          const previous = previousRows.get(file.path);
          if (row.manifestIntact && previous?.sourceURL === url && previous.installedSha256 === row.installedSha256 && previous.manifestSha256 === file.sha256 && /^[a-f0-9]{64}$/.test(previous.liveSha256)) {
            Object.assign(row, previous, { auditedAt: previous.auditedAt || sourceAudit.completedAt, reusedFrom: sourceAudit.sha256 });
          } else {
          let live;
          for (let attempt = 0; ; attempt++) {
            try {
              // Request the published asset, not a browser navigation. Cloudflare
              // adds per-request detection markup to HTML navigations; it leaves
              // AJAX responses intact. Compare the returned bytes without stripping.
              const requestHeaders = manifest.gameId === 'comp-run' ? { 'X-Requested-With': 'XMLHttpRequest' } : undefined;
              const response = await fetchImpl(url, { redirect: 'error', signal: AbortSignal.timeout(90000), ...(requestHeaders ? { headers: requestHeaders } : {}) });
              if (requestHeaders) row.requestHeaders = requestHeaders;
              row.status = response.status; row.contentType = response.headers.get('content-type');
              if (!response.ok) { await response.body?.cancel(); throw new Error(`Published file returned HTTP ${response.status}.`); }
              if (!/\.html$/i.test(file.path) && row.contentType?.includes('text/html')) { await response.body?.cancel(); throw new Error('Published asset returned HTML.'); }
              live = await readResponse(response, textFile); break;
            } catch (error) {
              if (attempt >= retries || row.status >= 400 && row.status < 500 && row.status !== 429) throw error;
            }
          }
          row.liveSha256 = live.sha256; row.liveBytes = live.bytes; fetchedBytes += live.bytes;
          if (receipt) row.capturedOriginalSha256 = receipt.originalSha256;
          row.exact = row.installedSha256 === live.sha256;
          if (textFile) {
            const expected = expectedNative(manifest.gameId, file.path, live.text);
            row.transform = expected.transform; row.expectedNativeSha256 = digest(expected.text);
            const installed = await fsp.readFile(filename, 'utf8');
            // COMP-RUN is delivered exactly as published, including line
            // endings. Existing reviewed transforms remain scoped to the
            // other games; none apply to this title.
            row.equal = manifest.gameId === 'comp-run' ? row.exact : normalized(expected.text) === normalized(installed);
            if (!row.equal) {
              const location = path.join(output, 'differences', file.path); await fsp.mkdir(path.dirname(location), { recursive: true });
              await fsp.writeFile(location + '.live', live.text, { flag: 'wx' });
              await fsp.writeFile(location + '.native', expected.text, { flag: 'wx' });
            }
          } else { row.transform = null; row.expectedNativeSha256 = live.sha256; row.equal = row.exact; }
          if (receipt && live.sha256 !== receipt.originalSha256) { row.equal = false; row.sourceChangedSinceCapture = true; }
          row.auditedAt = new Date().toISOString();
          }
        } catch (error) { row.equal = false; row.error = error.message; }
        rows[index] = row; await journal.write(JSON.stringify(row) + '\n'); completed++;
        if (!row.equal || !row.manifestIntact) different++;
        onProgress({ gameId: manifest.gameId, completed, total: rows.length, fetchedBytes, different });
      }
    }));
  } finally { await journal.close(); }
  const report = { gameId: manifest.gameId, version: manifest.version, release, manifestSha256: digest(manifestBody), startedAt, completedAt: new Date().toISOString(), fileCount: rows.length, fetchedBytes, sourceAudit, nativeTransformPolicy: manifest.gameId === 'comp-run' ? 'Exact published bytes for every file; no native transforms or text normalization.' : 'Only enumerated authentication, save, pause and local resource mapping transforms; no art, balance or game content exceptions.', files: rows };
  report.summary = { equal: rows.filter(r => r.equal && r.manifestIntact).length, different: rows.filter(r => !r.equal || !r.manifestIntact).map(r => r.path), errors: rows.filter(r => r.error).map(r => ({ path: r.path, error: r.error })) };
  await fsp.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  return report;
}

if (require.main === module) {
  const args = process.argv.slice(2), options = {}; let last = 0;
  for (let i = 0; i < args.length; i++) {
    if (['--release', '--output', '--concurrency', '--reuse'].includes(args[i]) && args[i + 1]) { const key = args[i] === '--reuse' ? 'reuseVerifiedFrom' : args[i].slice(2); options[key] = key === 'concurrency' ? Number(args[++i]) : args[++i]; }
    else throw new Error('Unknown or incomplete audit option: ' + args[i]);
  }
  options.onProgress = progress => { if (Date.now() - last > 10000 || progress.completed === progress.total) { last = Date.now(); console.log(JSON.stringify(progress)); } };
  verifyGameParity(options).then(report => { console.log(JSON.stringify(report.summary, null, 2)); if (report.summary.different.length) process.exitCode = 2; }).catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { sourceURL, expectedNative, readResponse, verifyGameParity };
