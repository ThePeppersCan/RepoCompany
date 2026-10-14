'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs/promises'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { prepareReleaseFeed, compareVersions, parseArgs } = require('../tools/prepare-release-feed.cjs');
const { Library, safeRemove } = require('../lib/library.cjs');
const ORIGIN = 'https://repo-company-games.pages.dev';
const entries = { morogue: 'interface/vampire-survivor/index.html', moratales: 'preview.html', manager: 'index.html' };
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const exists = async file => { try { await fs.lstat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
async function packageAt(directory, id, version, text = 'original') {
  const content = [[entries[id], '<!doctype html><title>' + id + '</title>'], ['game.js', id + ':' + text], ['assets/shared.bin', 'shared-by-every-game']];
  const files = [];
  for (const [name, data] of content) {
    const bytes = Buffer.from(data), target = path.join(directory, 'payload', name);
    await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, bytes);
    files.push({ path: name, size: bytes.length, sha256: digest(bytes) });
  }
  const manifest = { schemaVersion: 1, gameId: id, version, entry: entries[id], files };
  await fs.writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
  return manifest;
}
async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-feed-test-'));
  t.after(() => safeRemove(os.tmpdir(), directory));
  const releasesDirectory = path.join(directory, 'packages'), base = path.join(directory, 'base'), output = path.join(directory, 'next'), replacement = path.join(directory, 'replacement');
  for (const id of Object.keys(entries)) await packageAt(path.join(releasesDirectory, id), id, id === 'morogue' ? '0.1.0-dev' : '0.1.0-preview.1');
  const initial = await prepareReleaseFeed({ output: base, releasesDirectory });
  const manifest = await packageAt(replacement, 'morogue', '0.1.0-preview.3', 'new-release');
  const prepare = options => prepareReleaseFeed({ output, base, replacements: { morogue: replacement }, ...options });
  return { directory, releasesDirectory, base, output, replacement, initial, manifest, prepare };
}

test('initial feed keeps the existing CLI format, validates packages and deduplicates common assets', async t => {
  const f = await fixture(t);
  assert.equal(f.initial.uniqueBlobs, 7);
  assert.equal(f.initial.games.find(game => game.id === 'morogue').version, '0.1.0-preview.2');
  assert.deepEqual(parseArgs(['new-stage']), { output: 'new-stage', replacements: {} });
  for (const id of Object.keys(entries)) {
    const raw = JSON.parse(await fs.readFile(path.join(f.base, id, 'manifest.json')));
    for (const file of raw.files) {
      assert.equal(file.url, `${ORIGIN}/blobs/${file.sha256}.bin`);
      assert.equal(digest(await fs.readFile(path.join(f.base, 'blobs', file.sha256 + '.bin'))), file.sha256);
    }
  }
});
test('a single-game replacement preserves exact other manifests, every historical blob, and base content', async t => {
  const f = await fixture(t), before = new Map();
  // Formatting must survive too, rather than parse/stringify equivalent data.
  const manager = path.join(f.base, 'manager', 'manifest.json');
  await fs.writeFile(manager, JSON.stringify(JSON.parse(await fs.readFile(manager)), null, 2) + '\n');
  for (const id of Object.keys(entries)) before.set(id, await fs.readFile(path.join(f.base, id, 'manifest.json')));
  const history = Buffer.from('blob retained from an older supported release'), historicalName = digest(history) + '.bin';
  await fs.writeFile(path.join(f.base, 'blobs', historicalName), history);
  const oldNames = await fs.readdir(path.join(f.base, 'blobs'));
  const report = await f.prepare();
  assert.equal(report.retainedBlobs, oldNames.length); assert.equal(report.addedBlobs, 1);
  assert.deepEqual(report.games.filter(game => game.replaced).map(game => game.id), ['morogue']);
  for (const id of Object.keys(entries)) {
    assert.deepEqual(await fs.readFile(path.join(f.base, id, 'manifest.json')), before.get(id));
    if (id !== 'morogue') assert.deepEqual(await fs.readFile(path.join(f.output, id, 'manifest.json')), before.get(id));
  }
  assert.equal(JSON.parse(await fs.readFile(path.join(f.output, 'morogue/manifest.json'))).version, '0.1.0-preview.3');
  for (const name of oldNames) {
    const oldFile = path.join(f.base, 'blobs', name), newFile = path.join(f.output, 'blobs', name);
    assert.equal((await fs.stat(newFile)).ino, (await fs.stat(oldFile)).ino, 'inherited blobs are hardlinks');
    assert.equal(digest(await fs.readFile(newFile)), name.slice(0, 64));
  }
  assert.deepEqual((await fs.readdir(f.directory)).filter(name => name.startsWith('.repo-feed-')), []);
});
test('release ordering handles numeric prereleases and rejects invalid, equal or older versions', async t => {
  assert.equal(compareVersions('0.1.0-preview.10', '0.1.0-preview.9'), 1);
  assert.equal(compareVersions('0.1.0', '0.1.0-preview.999'), 1);
  assert.equal(compareVersions('0.1.0-alpha.2', '0.1.0-alpha.beta'), -1);
  assert.equal(compareVersions('0.1.0-a', '0.1.0-a.1'), -1);
  assert.equal(compareVersions('1.0.0+one', '1.0.0+two'), 0);
  for (const version of ['0.1.0-preview.01', '01.1.0', 'current', '0.1']) assert.throws(() => compareVersions(version, '0.1.0'));
  const f = await fixture(t);
  for (const version of ['0.1.0-preview.2', '0.1.0-preview.1', '0.1.0-dev', 'current']) {
    await fs.writeFile(path.join(f.replacement, 'manifest.json'), JSON.stringify({ ...f.manifest, version }));
    await assert.rejects(f.prepare(), /higher|semantic/); assert.equal(await exists(f.output), false);
  }
});
test('invalid replacement paths, wrong game, checksum or size fail before output activation', async t => {
  const f = await fixture(t), manifestFile = path.join(f.replacement, 'manifest.json');
  for (const mutate of [
    raw => { raw.files[1].path = '../outside.js'; },
    raw => { raw.gameId = 'manager'; },
    raw => { raw.files[1].sha256 = '0'.repeat(64); },
    raw => { raw.files[1].size++; }
  ]) {
    const raw = structuredClone(f.manifest); mutate(raw); await fs.writeFile(manifestFile, JSON.stringify(raw));
    await assert.rejects(f.prepare()); assert.equal(await exists(f.output), false);
  }
});
test('damaged or absent inherited blobs fail even if the replacement no longer references them', async t => {
  const f = await fixture(t), old = JSON.parse(await fs.readFile(path.join(f.base, 'morogue/manifest.json'))).files.find(file => file.path === 'game.js');
  const file = path.join(f.base, 'blobs', old.sha256 + '.bin');
  const original = await fs.readFile(file); await fs.writeFile(file, Buffer.alloc(original.length, 42));
  await assert.rejects(f.prepare(), /checksum/); assert.equal(await exists(f.output), false);
  await fs.unlink(file);
  await assert.rejects(f.prepare(), /missing or non-content-addressed/); assert.equal(await exists(f.output), false);
});
test('base feed must be static, with safe URLs and reviewed cache headers', async t => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.base, '_worker.js'), 'unexpected functions');
  await assert.rejects(f.prepare(), /only static game feed/); await fs.unlink(path.join(f.base, '_worker.js'));
  const metadata = path.join(f.base, 'manager/manifest.json'), original = await fs.readFile(metadata), raw = JSON.parse(original);
  raw.files[0].url = ORIGIN + '/different-download.bin'; await fs.writeFile(metadata, JSON.stringify(raw));
  await assert.rejects(f.prepare(), /non-content-addressed/); await fs.writeFile(metadata, original);
  await fs.writeFile(path.join(f.base, '_headers'), '/*\n Cache-Control: public, max-age=3600\n');
  await assert.rejects(f.prepare(), /cache headers/); assert.equal(await exists(f.output), false);
});
test('a linked source or output ancestor is refused without touching the target', async t => {
  const f = await fixture(t), alias = path.join(f.directory, 'alias');
  await fs.symlink(f.base, alias, process.platform === 'win32' ? 'junction' : 'dir');
  // Remove only the known link; safeRemove intentionally rejects linked trees.
  try {
    await assert.rejects(f.prepare({ base: alias }), /Linked installation/);
    await assert.rejects(f.prepare({ output: path.join(alias, 'next') }), /overlap|Linked installation/);
  } finally { await fs.unlink(alias); }
});
test('a replacement containing an oversized static asset is refused before hashing or staging it', async t => {
  const f = await fixture(t), file = path.join(f.replacement, 'payload/game.js');
  await fs.truncate(file, 25 * 1024 * 1024 + 1);
  f.manifest.files.find(item => item.path === 'game.js').size = 25 * 1024 * 1024 + 1;
  await fs.writeFile(path.join(f.replacement, 'manifest.json'), JSON.stringify(f.manifest));
  await assert.rejects(f.prepare(), /static host limit/); assert.equal(await exists(f.output), false);
});
test('existing output and source/output overlap are never overwritten', async t => {
  const f = await fixture(t);
  await fs.mkdir(f.output); await fs.writeFile(path.join(f.output, 'keep.txt'), 'keep');
  await assert.rejects(f.prepare(), /already exists/);
  assert.equal(await fs.readFile(path.join(f.output, 'keep.txt'), 'utf8'), 'keep');
  await assert.rejects(f.prepare({ output: path.join(f.base, 'next') }), /overlap/);
  await assert.rejects(f.prepare({ output: f.directory }), /overlap/);
  await assert.rejects(f.prepare({ output: path.join(f.replacement, 'next') }), /overlap/);
});
test('failed hardlink staging removes only its own temporary files and keeps the base usable', async t => {
  const f = await fixture(t), before = await fs.readdir(f.directory);
  t.mock.method(fs, 'link', async () => { throw Object.assign(Error('Cross-volume hardlink rejected'), { code: 'EXDEV' }); });
  await assert.rejects(f.prepare(), /Cross-volume/);
  assert.equal(await exists(f.output), false); assert.deepEqual(await fs.readdir(f.directory), before);
  assert.equal(JSON.parse(await fs.readFile(path.join(f.base, 'morogue/manifest.json'))).version, '0.1.0-preview.2');
});
test('a source changing after hardlinking cannot produce a publishable output', async t => {
  const f = await fixture(t), originalLink = fs.link; let changed = false;
  t.mock.method(fs, 'link', async (source, target) => {
    await originalLink(source, target);
    if (!changed) { changed = true; await fs.writeFile(source, 'externally changed during staging'); }
  });
  await assert.rejects(f.prepare(), /size|checksum|changed/);
  assert.equal(await exists(f.output), false);
  assert.deepEqual((await fs.readdir(f.directory)).filter(name => name.startsWith('.repo-feed-')), []);
});
test('CLI rejects unknown or duplicate replacements and missing incremental input', async t => {
  const f = await fixture(t);
  assert.deepEqual(parseArgs(['new', '--base', 'old', '--replace', 'morogue=C:/package']), { output: 'new', base: 'old', replacements: { morogue: 'C:/package' } });
  for (const args of [[], ['new', '--replace'], ['new', '--replace', 'unknown=x'], ['new', '--replace', 'morogue=x', '--replace', 'morogue=y'], ['new', '--base', 'x', '--base', 'y']]) assert.throws(() => parseArgs(args));
  await assert.rejects(f.prepare({ replacements: {} }), /at least one/);
  await assert.rejects(f.prepare({ replacements: { unknown: f.replacement } }), /Unknown game/);
});
test('an existing Library client discovers and atomically activates the incremental game with no installer change', async t => {
  const f = await fixture(t); let serving = f.base;
  const game = { id: 'morogue', origin: 'https://morogue.repocompany.uk', entry: entries.morogue, approvedOrigins: [ORIGIN], manifestUrl: ORIGIN + '/morogue/manifest.json' };
  const library = new Library({ root: path.join(f.directory, 'client'), catalog: { games: [game] }, fetchImpl: async (url, options) => {
    assert.equal(new URL(url).origin, ORIGIN); assert.equal(options.cache, 'no-store');
    const bytes = await fs.readFile(path.join(serving, new URL(url).pathname)); return new Response(bytes);
  } });
  await library.init(); await library.install('morogue');
  const previous = library.getInstalled('morogue');
  await f.prepare(); serving = f.output;
  await library.checkUpdates(); assert.equal(library.snapshot().morogue.availableVersion, '0.1.0-preview.3');
  await library.update('morogue');
  assert.equal(library.getInstalled('morogue').version, '0.1.0-preview.3');
  assert.notEqual(library.getInstalled('morogue').directory, previous.directory);
  assert.equal(await fs.readFile(path.join(library.getInstalled('morogue').directory, 'game.js'), 'utf8'), 'morogue:new-release');
  assert.equal(await fs.readFile(path.join(previous.directory, 'game.js'), 'utf8'), 'morogue:original');
});
