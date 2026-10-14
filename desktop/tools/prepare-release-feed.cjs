'use strict';
// Fresh static feed, or reviewed replacements retaining every published blob.
// node tools/prepare-release-feed.cjs <new-stage>
// node tools/prepare-release-feed.cjs <new-stage> --base <old-stage> --replace morogue=<package>
const fs = require('node:fs'), fsp = fs.promises, path = require('node:path'), crypto = require('node:crypto');
const { validateManifest, within, MAX_MANIFEST_BYTES } = require('../lib/manifest.cjs');
const { assertPlainPath, safeRemove } = require('../lib/library.cjs');
const ORIGIN = 'https://repo-company-games.pages.dev';
const GAMES = { morogue: 'interface/vampire-survivor/index.html', moratales: 'preview.html', manager: 'index.html' };
const HEADERS = '/blobs/*\n  Cache-Control: public, max-age=31536000, immutable\n/*/manifest.json\n  Cache-Control: no-store\n';
const MAX_ASSET_BYTES = 25 * 1024 * 1024, MAX_STATIC_FILES = 20000;

function requireThat(value, message) { if (!value) throw Error(message); }
function semanticVersion(value) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.exec(value);
  requireThat(match, 'Replacement releases require semantic versions: ' + value);
  const prerelease = match[4]?.split('.') || [];
  requireThat(!prerelease.some(part => /^\d+$/.test(part) && part.length > 1 && part[0] === '0'), 'Invalid numeric prerelease version: ' + value);
  return { core: match.slice(1, 4).map(BigInt), prerelease };
}
function compareVersions(left, right) {
  const a = semanticVersion(left), b = semanticVersion(right);
  for (let i = 0; i < 3; i++) if (a.core[i] !== b.core[i]) return a.core[i] > b.core[i] ? 1 : -1;
  if (!a.prerelease.length || !b.prerelease.length) return Number(!a.prerelease.length) - Number(!b.prerelease.length);
  for (let i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i++) {
    const x = a.prerelease[i], y = b.prerelease[i];
    if (x === undefined || y === undefined) return x === undefined ? -1 : 1;
    if (x === y) continue;
    const numericX = /^\d+$/.test(x), numericY = /^\d+$/.test(y);
    if (numericX !== numericY) return numericX ? -1 : 1;
    return numericX ? BigInt(x) > BigInt(y) ? 1 : -1 : x > y ? 1 : -1;
  }
  return 0;
}
async function isPresent(file) { try { await fsp.lstat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }
function overlap(a, b) { return path.relative(a, b) === '' || within(a, b) || within(b, a); }
async function readBounded(file, limit) {
  await assertPlainPath(file);
  const stat = await fsp.lstat(file);
  requireThat(stat.isFile() && stat.size <= limit, 'Invalid or oversized feed metadata: ' + file);
  const chunks = []; let size = 0;
  for await (const chunk of fs.createReadStream(file)) {
    size += chunk.length; requireThat(size <= limit, 'Feed metadata changed while reading: ' + file); chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function verifiedFile(file, expectedHash, expectedSize) {
  await assertPlainPath(file);
  const stat = await fsp.lstat(file);
  requireThat(stat.isFile() && stat.size <= MAX_ASSET_BYTES, 'Asset is not a plain file within the static host limit: ' + file);
  requireThat(expectedSize === undefined || stat.size === expectedSize, 'Release size changed: ' + file);
  const digest = crypto.createHash('sha256'); let bytes = 0;
  for await (const chunk of fs.createReadStream(file)) {
    bytes += chunk.length;
    requireThat(bytes <= stat.size, 'Release changed while reading: ' + file);
    digest.update(chunk);
  }
  requireThat(bytes === stat.size && digest.digest('hex') === expectedHash, 'Release checksum changed: ' + file);
  return bytes;
}
async function readBase(directory) {
  await assertPlainPath(directory);
  const expected = ['_headers', 'blobs', ...Object.keys(GAMES)].sort();
  requireThat(JSON.stringify((await fsp.readdir(directory)).sort()) === JSON.stringify(expected), 'Base feed contains unexpected or missing files; only static game feed content is allowed.');
  const headers = await readBounded(path.join(directory, '_headers'), 4096);
  requireThat(headers.toString('utf8').replace(/\r\n/g, '\n') === HEADERS, 'Base feed cache headers do not match the reviewed static feed.');
  const manifests = new Map(), blobs = new Map();
  await assertPlainPath(path.join(directory, 'blobs'));
  for (const name of await fsp.readdir(path.join(directory, 'blobs'))) {
    requireThat(/^[a-f0-9]{64}\.bin$/.test(name), 'Unexpected base blob path: ' + name);
    const file = path.join(directory, 'blobs', name), size = await verifiedFile(file, name.slice(0, 64));
    blobs.set(name, { source: file, size, sha256: name.slice(0, 64) });
  }
  for (const [id, entry] of Object.entries(GAMES)) {
    const folder = path.join(directory, id); await assertPlainPath(folder);
    requireThat(JSON.stringify(await fsp.readdir(folder)) === '["manifest.json"]', 'Unexpected files in base game directory: ' + id);
    const bytes = await readBounded(path.join(folder, 'manifest.json'), MAX_MANIFEST_BYTES), raw = JSON.parse(bytes.toString('utf8'));
    const manifest = validateManifest(raw, { id, entry, origin: ORIGIN }, { manifestURL: `${ORIGIN}/${id}/manifest.json` });
    for (const file of manifest.files) {
      const name = file.sha256 + '.bin', blob = blobs.get(name);
      requireThat(file.source === `${ORIGIN}/blobs/${name}` && blob && blob.size === file.size, 'Base manifest has a missing or non-content-addressed blob: ' + id + '/' + file.path);
    }
    manifests.set(id, { raw, bytes, manifest });
  }
  return { manifests, blobs, headers };
}
async function readPackage(id, directory, previous, blobs) {
  const manifestPath = path.join(directory, 'manifest.json');
  const raw = JSON.parse((await readBounded(manifestPath, MAX_MANIFEST_BYTES)).toString('utf8'));
  // Preserve the first feed builder's mapping of the legacy local package.
  if (id === 'morogue' && raw.version === '0.1.0-dev') raw.version = '0.1.0-preview.2';
  delete raw.baseUrl;
  const payload = path.join(directory, 'payload');
  const manifest = validateManifest(raw, { id, entry: GAMES[id], developmentManifest: manifestPath }, { developmentRoot: payload });
  if (previous) requireThat(compareVersions(manifest.version, previous.manifest.version) > 0, 'Replacement version must be higher than the published version for ' + id + '.');
  for (const file of raw.files) {
    file.sha256 = file.sha256.toLowerCase();
    const source = path.join(payload, ...file.path.split('/')), name = file.sha256 + '.bin';
    await verifiedFile(source, file.sha256, file.size);
    requireThat(!blobs.has(name) || blobs.get(name).size === file.size, 'Conflicting blob size: ' + file.path);
    if (!blobs.has(name)) blobs.set(name, { source, size: file.size, sha256: file.sha256 });
    file.url = `${ORIGIN}/blobs/${name}`;
  }
  const remote = validateManifest(raw, { id, entry: GAMES[id], origin: ORIGIN }, { manifestURL: `${ORIGIN}/${id}/manifest.json` });
  return { raw, bytes: Buffer.from(JSON.stringify(raw)), manifest: remote };
}

async function prepareReleaseFeed({ output, base, replacements = {}, releasesDirectory = path.resolve(__dirname, '../releases') } = {}) {
  requireThat(typeof output === 'string' && output, 'Provide a new staging directory for the release feed.');
  output = path.resolve(output); base = base && path.resolve(base);
  requireThat(replacements && typeof replacements === 'object' && !Array.isArray(replacements), 'Invalid replacement packages.');
  const selected = Object.entries(replacements);
  requireThat(!base || selected.length, 'Incremental feed preparation needs at least one --replace package.');
  for (const [id, directory] of selected) requireThat(Object.hasOwn(GAMES, id) && typeof directory === 'string' && directory, 'Unknown game or missing replacement directory: ' + id);
  const sources = base ? selected : Object.keys(GAMES).map(id => [id, replacements[id] || path.join(releasesDirectory, id)]);
  for (const input of [base, ...sources.map(([_id, directory]) => path.resolve(directory))].filter(Boolean)) requireThat(!overlap(output, input), 'Output must not overlap a source package or base feed.');
  await assertPlainPath(output, true);
  requireThat(!await isPresent(output), 'Release feed output already exists; choose a fresh staging directory.');
  const inherited = base ? await readBase(base) : { manifests: new Map(), blobs: new Map(), headers: Buffer.from(HEADERS) };
  const inheritedBlobs = inherited.blobs.size, replaced = new Set();
  for (const [id, directory] of sources) {
    const item = await readPackage(id, path.resolve(directory), inherited.manifests.get(id), inherited.blobs);
    inherited.manifests.set(id, item); replaced.add(id);
  }
  requireThat(inherited.blobs.size + Object.keys(GAMES).length + 1 <= MAX_STATIC_FILES, 'Feed exceeds the 20,000-file static host budget; retain old blobs on a larger approved host before publishing.');
  const parent = path.dirname(output), stage = path.join(parent, '.repo-feed-' + crypto.randomUUID());
  await assertPlainPath(parent, true); await fsp.mkdir(parent, { recursive: true }); await assertPlainPath(parent);
  // No incomplete output is available to deploy. Serialize cooperating writers
  // for the same target; no existing output or source is ever removed.
  const lockPath = path.join(parent, '.repo-feed-lock-' + crypto.createHash('sha256').update(output.toLowerCase()).digest('hex').slice(0, 20));
  const lock = await fsp.open(lockPath, 'wx'); let committed = false;
  try {
    requireThat(!await isPresent(output), 'Release feed output already exists; choose a fresh staging directory.');
    await fsp.mkdir(stage); await fsp.mkdir(path.join(stage, 'blobs'));
    for (const [name, blob] of inherited.blobs) {
      await assertPlainPath(blob.source);
      await fsp.link(blob.source, path.join(stage, 'blobs', name));
    }
    // Recheck staged hardlinks before activation; inputs must remain stable
    // throughout the later upload too, as with the initial release workflow.
    for (const [name, blob] of inherited.blobs) await verifiedFile(path.join(stage, 'blobs', name), blob.sha256, blob.size);
    for (const [id, item] of inherited.manifests) {
      await fsp.mkdir(path.join(stage, id));
      await fsp.writeFile(path.join(stage, id, 'manifest.json'), item.bytes, { flag: 'wx' });
    }
    await fsp.writeFile(path.join(stage, '_headers'), inherited.headers, { flag: 'wx' });
    requireThat(!await isPresent(output), 'Release feed output appeared during preparation; refusing to replace it.');
    await fsp.rename(stage, output); committed = true;
  } finally {
    try { if (!committed) await safeRemove(parent, stage); }
    finally { await lock.close(); await fsp.unlink(lockPath); }
  }
  return {
    output, base: base || null, uniqueBlobs: inherited.blobs.size, retainedBlobs: inheritedBlobs, addedBlobs: inherited.blobs.size - inheritedBlobs,
    games: [...inherited.manifests].map(([id, item]) => ({ id, version: item.manifest.version, files: item.manifest.files.length, bytes: item.manifest.totalBytes, replaced: replaced.has(id) }))
  };
}
function parseArgs(args) {
  const options = { output: args[0], replacements: {} }; requireThat(options.output && !options.output.startsWith('--'), 'Provide a fresh output directory first.');
  for (let index = 1; index < args.length; index++) {
    const flag = args[index], value = args[++index]; requireThat(value && !value.startsWith('--'), 'Incomplete feed preparation option: ' + flag);
    if (flag === '--base') { requireThat(!options.base, 'Duplicate --base option.'); options.base = value; }
    else if (flag === '--replace') {
      const match = /^([a-z][a-z0-9-]*)=(.+)$/.exec(value);
      requireThat(match && Object.hasOwn(GAMES, match[1]) && !Object.hasOwn(options.replacements, match[1]), 'Use one --replace game-id=package-directory per supported game.');
      options.replacements[match[1]] = match[2];
    } else throw Error('Unknown feed preparation option: ' + flag);
  }
  return options;
}
if (require.main === module) {
  Promise.resolve().then(() => prepareReleaseFeed(parseArgs(process.argv.slice(2)))).then(report => process.stdout.write(JSON.stringify(report, null, 2) + '\n')).catch(error => { process.stderr.write(error.message + '\n'); process.exitCode = 1; });
}
module.exports = { prepareReleaseFeed, compareVersions, parseArgs };
