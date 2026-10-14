'use strict';

// Public read-only GET/HEAD probes. No Cloudflare credentials, installation,
// account requests or production game writes are used by this verifier.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { validateManifest, MAX_MANIFEST_BYTES } = require('../lib/manifest.cjs');
const ORIGIN = 'https://repo-company-games.pages.dev';
const GAMES = [
  { id: 'morogue', entry: 'interface/vampire-survivor/index.html', sample: 'interface/vampire-survivor/app.js' },
  { id: 'moratales', entry: 'preview.html', sample: 'interface/town-explorer.js' },
  { id: 'manager', entry: 'index.html', sample: 'app.js' }
];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function requireThat(condition, message) { if (!condition) throw Error(message); }
function headers(response) {
  return Object.fromEntries(['content-type', 'content-length', 'cache-control', 'accept-ranges', 'content-range', 'cf-cache-status', 'etag', 'x-content-type-options'].map(name => [name, response.headers.get(name)]));
}
async function boundedBytes(response, limit) {
  requireThat(!!response.body, 'The download has no response body.');
  const chunks = []; let total = 0;
  for await (const chunk of response.body) { total += chunk.length; requireThat(total <= limit, 'The response exceeded its expected size.'); chunks.push(Buffer.from(chunk)); }
  return Buffer.concat(chunks);
}
function cacheHeaders(response, immutable, label) {
  const value = response.headers.get('cache-control') || '';
  requireThat(immutable ? /(?:^|[,\s])immutable(?:[,\s]|$)/i.test(value) && Number(value.match(/max-age=(\d+)/i)?.[1]) >= 31536000 : /(?:^|[,\s])no-store(?:[,\s]|$)/i.test(value), `${label} has unexpected cache headers: ${value || '(missing)'}`);
}

async function verifyReleaseFeed({ expectedDirectory, fetchImpl = global.fetch, onProgress = () => {}, report = { origin: ORIGIN, checkedAt: new Date().toISOString(), passed: false, games: [] } } = {}) {
  async function request(url, method = 'GET', extraHeaders = {}) {
    requireThat(new URL(url).origin === ORIGIN, 'Verifier URL left the configured public release origin.');
    const response = await fetchImpl(url, { method, headers: { 'Accept-Encoding': 'identity', ...extraHeaders }, redirect: 'manual', credentials: 'omit', signal: AbortSignal.timeout(60000) });
    requireThat(!response.url || new URL(response.url).origin === ORIGIN, 'Release response changed origin.');
    return response;
  }
  async function verifyBlob(file, label, { largest = false, entry = false } = {}) {
    const head = await request(file.source, 'HEAD');
    requireThat(head.status === 200, `${label} HEAD returned ${head.status}; redirects are not allowed.`);
    // Pages may omit Content-Length on HEAD. GET below always measures and
    // hashes every byte; an explicitly supplied HEAD length must still agree.
    const headLength = head.headers.get('content-length');
    requireThat(headLength === null || /^\d+$/.test(headLength) && Number(headLength) === file.size, `${label} HEAD size does not match its manifest.`);
    requireThat(/application\/octet-stream/i.test(head.headers.get('content-type') || ''), `${label} is not served as a binary download.`);
    cacheHeaders(head, true, label);
    const response = await request(file.source);
    requireThat(response.status === 200, `${label} GET returned ${response.status}; redirects are not allowed.`);
    cacheHeaders(response, true, label);
    const digest = crypto.createHash('sha256'); let size = 0, prefix = Buffer.alloc(0);
    requireThat(!!response.body, `${label} is empty.`);
    for await (const part of response.body) {
      const bytes = Buffer.from(part); size += bytes.length;
      requireThat(size <= file.size, `${label} exceeded its manifest size.`);
      digest.update(bytes);
      if (prefix.length < 1024) prefix = Buffer.concat([prefix, bytes.subarray(0, 1024 - prefix.length)]);
    }
    requireThat(size === file.size, `${label} size does not match its manifest.`);
    requireThat(digest.digest('hex') === file.sha256, `${label} SHA-256 does not match its manifest.`);
    if (entry) requireThat(/<(?:!doctype\s+html|html)\b/i.test(prefix.toString('utf8')), `${label} is not the expected HTML entry document.`);
    const result = { path: file.path, bytes: size, sha256: file.sha256, headers: headers(head), hashVerified: true };
    if (largest && size) {
      const end = Math.min(1023, size - 1), range = await request(file.source, 'GET', { Range: `bytes=0-${end}` });
      requireThat(range.status === 206 || range.status === 200, `${label} range returned ${range.status}; expected a partial response or complete-file fallback.`);
      if (range.status === 206) {
        requireThat(range.headers.get('content-range') === `bytes 0-${end}/${size}`, `${label} returned an incorrect content range.`);
        const data = await boundedBytes(range, end + 1);
        requireThat(data.length === end + 1 && data.equals(prefix.subarray(0, end + 1)), `${label} range bytes differ from the verified download.`);
        result.range = { status: range.status, bytes: data.length, headers: headers(range), supportsRanges: true, verified: true };
      } else {
        // Installation requests complete files; media ranges are supplied by
        // the launcher's local protocol after installation. Some static hosts
        // ignore Range, so accept only a complete, independently verified body.
        const data = await boundedBytes(range, size);
        requireThat(data.length === size && hash(data) === file.sha256, `${label} full-file range fallback does not match its manifest.`);
        result.range = { status: range.status, bytes: data.length, headers: headers(range), supportsRanges: false, verified: true };
      }
    }
    return result;
  }

  for (const game of GAMES) {
    onProgress(`Checking ${game.id} manifest and release samples…`);
    const manifestURL = `${ORIGIN}/${game.id}/manifest.json`, response = await request(manifestURL);
    requireThat(response.status === 200, `${game.id} manifest returned ${response.status}.`);
    requireThat(/application\/json/i.test(response.headers.get('content-type') || ''), `${game.id} manifest has an unexpected content type.`);
    cacheHeaders(response, false, `${game.id} manifest`);
    const bytes = await boundedBytes(response, MAX_MANIFEST_BYTES), raw = JSON.parse(bytes.toString('utf8'));
    const manifest = validateManifest(raw, { id: game.id, entry: game.entry, origin: ORIGIN }, { manifestURL });
    for (const file of manifest.files) requireThat(file.source === `${ORIGIN}/blobs/${file.sha256}.bin`, `${game.id}/${file.path} is not content-addressed on the release host.`);
    if (expectedDirectory) {
      const expected = JSON.parse(await fs.readFile(path.join(expectedDirectory, game.id, 'manifest.json'), 'utf8'));
      requireThat(hash(JSON.stringify(raw)) === hash(JSON.stringify(expected)), `${game.id} live manifest differs from the reviewed staging manifest.`);
    }
    const entry = manifest.files.find(file => file.path === game.entry), sample = manifest.files.find(file => file.path === game.sample);
    const largest = manifest.files.filter(file => !/\.(?:html|js|css|json|txt|md|svg|webmanifest)$/i.test(file.path)).sort((a, b) => b.size - a.size)[0];
    requireThat(!!sample && !!largest, `${game.id} lacks its expected gameplay/binary samples.`);
    const item = { gameId: game.id, version: manifest.version, fileCount: manifest.files.length, bytes: manifest.totalBytes, manifestSha256: hash(bytes), manifestHeaders: headers(response), matchesStaging: !!expectedDirectory };
    report.games.push(item);
    item.entry = await verifyBlob(entry, `${game.id} entry`, { entry: true });
    item.sample = await verifyBlob(sample, `${game.id} gameplay script`);
    item.largestBinary = await verifyBlob(largest, `${game.id} largest binary`, { largest: true });
    onProgress(`Verified ${game.id}: ${manifest.version}, ${manifest.files.length} files; entry/script/binary hashes and ${item.largestBinary.range.supportsRanges ? 'partial byte ranges' : 'full-file range fallback'} passed.`);
  }
  report.passed = true; report.completedAt = new Date().toISOString(); return report;
}

if (require.main === module) {
  const args = process.argv.slice(2), options = {}; let output;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--expected-dir' && args[index + 1]) options.expectedDirectory = path.resolve(args[++index]);
    else if (args[index] === '--output' && args[index + 1]) output = path.resolve(args[++index]);
    else throw Error('Unknown or incomplete verification option: ' + args[index]);
  }
  const report = { origin: ORIGIN, checkedAt: new Date().toISOString(), passed: false, games: [] };
  verifyReleaseFeed({ ...options, report, onProgress: message => process.stdout.write(message + '\n') }).then(async () => {
    if (output) { await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n'); }
    process.stdout.write('PASS all three public game manifests, sample hashes, immutable headers and range delivery probes.\n');
  }).catch(async error => {
    report.failure = error.message;
    if (output) { await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n'); }
    process.stderr.write(error.message + '\n'); process.exitCode = 1;
  });
}

module.exports = { verifyReleaseFeed };
