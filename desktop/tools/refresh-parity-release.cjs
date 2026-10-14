'use strict';
// A fresh immutable version from a complete published-file audit. Unchanged
// verified files are hardlinked; replacements are captured live bytes with only
// the verifier's explicit native transformations applied.
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const crypto = require('node:crypto');
const { validatePath, validateVersion, validateManifest } = require('../lib/manifest.cjs');
const { assertPlainPath } = require('../lib/library.cjs');
const { sourceURL, expectedNative, readResponse } = require('./verify-game-parity.cjs');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
async function fileHash(file) { const h = crypto.createHash('sha256'); for await (const chunk of fs.createReadStream(file)) h.update(chunk); return h.digest('hex'); }

async function refreshParityRelease({ release, audit, output, version, changes, expectedLiveChanges = {}, fetchImpl = fetch }) {
  release = path.resolve(release); output = path.resolve(output); audit = path.resolve(audit);
  validateVersion(version);
  if (output === release || output.startsWith(release + path.sep) || release.startsWith(output + path.sep)) throw Error('Use a separate, fresh immutable release directory.');
  await assertPlainPath(release); await assertPlainPath(output, true);
  const originalBody = await fsp.readFile(path.join(release, 'manifest.json')), original = JSON.parse(originalBody);
  const auditBody = await fsp.readFile(audit), receipt = JSON.parse(auditBody);
  if (receipt.gameId !== original.gameId || receipt.version !== original.version || receipt.files.length !== original.files.length || version === original.version) throw Error('Audit/version does not match this immutable release.');
  if (receipt.manifestSha256 && receipt.manifestSha256 !== hash(originalBody)) throw Error('The audited manifest changed.');
  const reviewedChanges = new Set(changes || []), rows = new Map(receipt.files.map(row => [row.path, { ...row }]));
  if (rows.size !== original.files.length) throw Error('Audit paths are duplicated or missing.');
  const buffers = new Map(), differences = receipt.files.filter(row => !row.equal || row.error);
  if (differences.some(row => !reviewedChanges.has(row.path)) || reviewedChanges.size !== differences.length) throw Error('Explicitly review every different file before preparing the release.');
  for (const file of original.files) {
    validatePath(file.path); const row = rows.get(file.path), local = path.join(release, 'payload', file.path);
    if (!row || !row.manifestIntact || row.manifestSha256 !== file.sha256 || row.installedSha256 !== file.sha256) throw Error('The original payload did not pass its audit: ' + file.path);
    await assertPlainPath(local);
    if ((await fsp.stat(local)).size !== file.size || await fileHash(local) !== file.sha256) throw Error('The original immutable payload changed: ' + file.path);
  }
  for (const row of differences) {
    const url = sourceURL(original.gameId, row.path), response = await fetchImpl(url, { redirect: 'error', signal: AbortSignal.timeout(90000) });
    if (response.status !== 200 || !/\.(?:js|css|json|html|webmanifest|svg|txt|md|csv)$/i.test(row.path)) throw Error('A changed binary or unavailable file requires a new reviewed capture.');
    const live = await readResponse(response, true), expectedHash = expectedLiveChanges[row.path] || row.liveSha256;
    if (live.sha256 !== expectedHash) throw Error('Published source changed after review: ' + row.path);
    const native = expectedNative(original.gameId, row.path, live.text), bytes = Buffer.from(native.text), installed = await fsp.readFile(path.join(release, 'payload', row.path));
    if (native.text.replace(/\r\n/g, '\n') !== installed.toString('utf8').replace(/\r\n/g, '\n')) buffers.set(row.path, bytes);
    const installedBytes = buffers.get(row.path) || installed;
    Object.assign(rows.get(row.path), { sourceURL: url, status: 200, contentType: response.headers.get('content-type'), liveSha256: live.sha256, liveBytes: live.bytes, installedSha256: hash(installedBytes), installedBytes: installedBytes.length, expectedNativeSha256: hash(bytes), exact: hash(installedBytes) === live.sha256, equal: true, transform: native.transform, auditedAt: new Date().toISOString() });
    delete rows.get(row.path).error;
  }
  const files = original.files.map(file => {
    const bytes = buffers.get(file.path), result = { path: file.path, size: bytes?.length ?? file.size, sha256: bytes ? hash(bytes) : file.sha256 };
    Object.assign(rows.get(file.path), { manifestSha256: result.sha256, manifestBytes: result.size, manifestIntact: true });
    return result;
  });
  const manifest = { schemaVersion: 1, gameId: original.gameId, version, entry: original.entry, files };
  validateManifest(manifest, { id: manifest.gameId, entry: manifest.entry }, { developmentRoot: path.join(output, 'payload') });
  await fsp.mkdir(output); await fsp.mkdir(path.join(output, 'payload'));
  for (const file of files) {
    const target = path.join(output, 'payload', file.path); await fsp.mkdir(path.dirname(target), { recursive: true });
    if (buffers.has(file.path)) await fsp.writeFile(target, buffers.get(file.path), { flag: 'wx' });
    else await fsp.link(path.join(release, 'payload', file.path), target);
  }
  for (const file of files) if (await fileHash(path.join(output, 'payload', file.path)) !== file.sha256) throw Error('Payload changed while preparing the new immutable release.');
  const manifestBody = Buffer.from(JSON.stringify(manifest, null, 2) + '\n');
  const finalReceipt = { ...receipt, release: output, version, manifestSha256: hash(manifestBody), completedAt: new Date().toISOString(), sourceAudit: { path: audit, sha256: hash(auditBody), completedAt: receipt.completedAt }, reviewedReplacements: [...buffers.keys()], sourceUpdates: expectedLiveChanges, files: [...rows.values()], summary: { equal: files.length, different: [], errors: [] } };
  const previousReport = JSON.parse(await fsp.readFile(path.join(release, 'package-report.json'), 'utf8'));
  const report = { ...previousReport, version, output, sourceRelease: release, written: true, fileCount: files.length, bytes: files.reduce((sum, f) => sum + f.size, 0), parityReceipt: 'published-parity.json', parityManifestSha256: hash(manifestBody), replacedFiles: [...buffers.keys()], hardlinkedFiles: files.length - buffers.size, staging: 'Hardlinks reference a previously verified immutable release; neither version may be altered after publication.' };
  await fsp.writeFile(path.join(output, 'published-parity.json'), JSON.stringify(finalReceipt, null, 2) + '\n', { flag: 'wx' });
  await fsp.writeFile(path.join(output, 'package-report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  await fsp.writeFile(path.join(output, 'manifest.json'), manifestBody, { flag: 'wx' });
  return report;
}

module.exports = { refreshParityRelease };
