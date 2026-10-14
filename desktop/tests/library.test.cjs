'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { Library, safeRemove } = require('../lib/library.cjs');

const ORIGIN = 'https://morogue.repocompany.uk';
const digest = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-library-test-'));
  t.after(async () => { await fs.rm(directory, { recursive: true, force: true }); });
  const content = Buffer.from('<!doctype html><title>Fixture game</title>');
  let manifest = { schemaVersion: 1, gameId: 'morogue', version: '1.0.0', entry: 'index.html', files: [{ path: 'index.html', size: content.length, sha256: digest(content) }] };
  let body = () => new Response(content);
  const calls = [];
  const game = { id: 'morogue', origin: ORIGIN, entry: 'index.html', manifestUrl: ORIGIN + '/releases/manifest.json' };
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (url === game.manifestUrl) return new Response(JSON.stringify(manifest));
    return body(url, options);
  };
  const root = path.join(directory, 'library');
  const library = new Library({ root, catalog: { games: [game] }, fetchImpl });
  await library.init();
  return { directory, root, library, game, fetchImpl, content, calls, setManifest: value => { manifest = value; }, setBody: fn => { body = fn; }, manifest: () => structuredClone(manifest) };
}

test('installs verified bytes, survives restart, and uninstall preserves account data outside game files', async t => {
  const f = await fixture(t);
  const saves = path.join(f.root, 'account-data'); await fs.mkdir(saves); await fs.writeFile(path.join(saves, 'preferences.json'), '{}');
  await f.library.install('morogue');
  const installed = f.library.getInstalled('morogue');
  assert.equal(await fs.readFile(path.join(installed.directory, 'index.html'), 'utf8'), f.content.toString());
  assert.equal(f.library.snapshot().morogue.status, 'installed');
  assert.ok(f.calls.every(call => call.options.redirect === 'error' && call.options.credentials === 'omit'));
  const restarted = new Library({ root: f.root, catalog: { games: [f.game] }, fetchImpl: f.fetchImpl }); await restarted.init();
  assert.deepEqual(restarted.getInstalled('morogue'), installed);
  await restarted.uninstall('morogue');
  assert.equal(restarted.getInstalled('morogue'), null);
  assert.equal(await fs.readFile(path.join(saves, 'preferences.json'), 'utf8'), '{}');
});

test('parallel downloads are bounded and a failed stream settles every writer before cleanup', async t => {
  const f = await fixture(t), manifest = f.manifest();
  manifest.files = Array.from({ length: 9 }, (_, i) => ({ ...manifest.files[0], path: i ? `assets/${i}.js` : 'index.html' }));
  f.setManifest(manifest);
  let active = 0, peak = 0, completed = 0;
  f.setBody((_url, { signal }) => ({ ok: true, body: (async function* () {
    active++; peak = Math.max(peak, active);
    try {
      await new Promise(resolve => setTimeout(resolve, 15));
      if (signal.aborted) throw Object.assign(Error('cancelled'), { name: 'AbortError' });
      yield f.content;
      completed++;
    } finally { active--; }
  })() }));
  await f.library.install('morogue');
  assert.equal(completed, 9); assert.equal(peak, 4); assert.equal(active, 0);
  const previous = f.library.getInstalled('morogue');
  manifest.version = '2.0.0'; f.setManifest(manifest);
  let started = 0, settled = 0;
  f.setBody((_url, { signal }) => ({ ok: true, body: (async function* () {
    const index = started++;
    try {
      if (index === 0) { await new Promise(resolve => setTimeout(resolve, 10)); yield Buffer.alloc(f.content.length, 88); }
      else { await new Promise(resolve => { if (signal.aborted) resolve(); else signal.addEventListener('abort', resolve, { once: true }); }); throw Object.assign(Error('cancelled'), { name: 'AbortError' }); }
    } finally { await new Promise(resolve => setTimeout(resolve, 10)); settled++; }
  })() }));
  await assert.rejects(f.library.update('morogue'), /checksum/);
  assert.equal(started, 4); assert.equal(settled, started);
  assert.deepEqual(f.library.getInstalled('morogue'), previous);
  assert.deepEqual(await fs.readdir(path.join(f.root, 'games/morogue/staging')), []);
});

test('a checksum failure during an update leaves the previous active version playable', async t => {
  const f = await fixture(t); await f.library.install('morogue'); const previous = f.library.getInstalled('morogue');
  const next = f.manifest(); next.version = '2.0.0'; f.setManifest(next); f.setBody(() => new Response(Buffer.alloc(f.content.length, 88)));
  await assert.rejects(f.library.update('morogue'), /checksum/);
  assert.deepEqual(f.library.getInstalled('morogue'), previous);
  const pointer = JSON.parse(await fs.readFile(path.join(f.root, 'games/morogue/active.json'), 'utf8')); assert.equal(pointer.version, '1.0.0');
  assert.equal((await fs.readdir(path.join(f.root, 'games/morogue/versions'))).length, 1);
});

test('successful updates activate an immutable new directory and keep previous files intact', async t => {
  const f = await fixture(t); await f.library.install('morogue'); const previous = f.library.getInstalled('morogue');
  const next = f.manifest(); next.version = '2.0.0'; f.setManifest(next);
  await f.library.checkUpdates(); assert.equal(f.library.snapshot().morogue.availableVersion, '2.0.0');
  await f.library.update('morogue');
  assert.notEqual(f.library.getInstalled('morogue').directory, previous.directory);
  assert.equal(f.library.getInstalled('morogue').version, '2.0.0');
  assert.equal(await fs.readFile(path.join(previous.directory, 'index.html'), 'utf8'), f.content.toString());
});

test('explicit reinstall repairs corrupt files even when the published version is unchanged', async t => {
  const f = await fixture(t); await f.library.install('morogue'); const previous = f.library.getInstalled('morogue');
  await fs.writeFile(path.join(previous.directory, 'index.html'), 'corrupt installation');
  await f.library.install('morogue');
  const repaired = f.library.getInstalled('morogue');
  assert.equal(repaired.version, previous.version); assert.notEqual(repaired.directory, previous.directory);
  assert.equal(await fs.readFile(path.join(repaired.directory, 'index.html'), 'utf8'), f.content.toString());
});

test('failed same-version repair preserves the original active release without replacing any files', async t => {
  const f = await fixture(t); await f.library.install('morogue'); const previous = f.library.getInstalled('morogue');
  const pointerPath = path.join(f.root, 'games/morogue/active.json'); const before = await fs.readFile(pointerPath, 'utf8');
  f.setBody(() => new Response(Buffer.alloc(f.content.length, 88)));
  await assert.rejects(f.library.install('morogue'), /checksum/);
  assert.deepEqual(f.library.getInstalled('morogue'), previous); assert.equal(await fs.readFile(pointerPath, 'utf8'), before);
  assert.equal(await fs.readFile(path.join(previous.directory, 'index.html'), 'utf8'), f.content.toString());
});

test('cancels streaming work, removes staging, and never marks partial data installed', async t => {
  const f = await fixture(t);
  let started; const began = new Promise(resolve => { started = resolve; });
  f.setBody((_url, { signal }) => ({ ok: true, body: (async function* () {
    started(); yield f.content.subarray(0, 5);
    await new Promise(resolve => { if (signal.aborted) resolve(); else signal.addEventListener('abort', resolve, { once: true }); });
    yield f.content.subarray(5);
  })() }));
  const install = f.library.install('morogue'); const rejected = assert.rejects(install, { name: 'AbortError' });
  await began; await f.library.cancel('morogue'); await rejected;
  assert.equal(f.library.getInstalled('morogue'), null); assert.equal(f.library.snapshot().morogue.status, 'not-installed');
  assert.deepEqual(await fs.readdir(path.join(f.root, 'games/morogue/staging')), []);
});

test('cancelling an update at verification retains the active pointer', async t => {
  const f = await fixture(t); await f.library.install('morogue'); const previous = f.library.getInstalled('morogue');
  const next = f.manifest(); next.version = '2.0.0'; f.setManifest(next);
  f.library.on('change', snapshot => { if (snapshot.morogue.status === 'verifying') f.library.operations.get('morogue')?.controller.abort(); });
  await assert.rejects(f.library.update('morogue'), { name: 'AbortError' });
  assert.deepEqual(f.library.getInstalled('morogue'), previous);
  assert.equal(f.library.snapshot().morogue.status, 'installed');
});

test('rejects oversized streams and redirected sources without activating them', async t => {
  const f = await fixture(t); f.setBody(() => new Response(Buffer.alloc(f.content.length + 1)));
  await assert.rejects(f.library.install('morogue'), /exceeded/); assert.equal(f.library.getInstalled('morogue'), null);
  f.setBody(() => ({ ok: true, url: 'https://evil.test/data', body: (async function* () { yield f.content; })() }));
  await assert.rejects(f.library.install('morogue'), /trusted HTTPS/);
});

test('unknown ids, traversal and concurrent mutation are rejected before filesystem work', async t => {
  const f = await fixture(t);
  await assert.rejects(f.library.install('../outside')); await assert.rejects(f.library.uninstall('unknown'));
  let release; f.setBody(async () => { await new Promise(resolve => { release = resolve; }); return new Response(f.content); });
  const first = f.library.install('morogue');
  while (!release) await new Promise(resolve => setTimeout(resolve, 5));
  await assert.rejects(f.library.install('morogue'), /in progress/);
  await assert.rejects(f.library.uninstall('morogue'), /Cancel/);
  release(); await first;
});

test('refuses junctions and refuses removal outside the native library root', async t => {
  const f = await fixture(t); const outside = path.join(f.directory, 'outside'); await fs.mkdir(outside); await fs.writeFile(path.join(outside, 'keep.txt'), 'keep');
  await assert.rejects(safeRemove(f.root, outside), /outside/);
  const gameDirectory = path.join(f.root, 'games/morogue');
  try { await fs.symlink(outside, gameDirectory, process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (error.code === 'EPERM') { t.skip('Creating links is not permitted on this host.'); return; } throw error; }
  await assert.rejects(f.library.install('morogue'), /Linked/);
  await assert.rejects(f.library.uninstall('morogue'), /Linked/);
  assert.equal(await fs.readFile(path.join(outside, 'keep.txt'), 'utf8'), 'keep');
  await fs.unlink(gameDirectory);
});

test('loads only explicit development payloads and applies the same integrity verification', async t => {
  const f = await fixture(t), release = path.join(f.directory, 'release'); await fs.mkdir(path.join(release, 'payload'), { recursive: true });
  await fs.writeFile(path.join(release, 'payload/index.html'), f.content); await fs.writeFile(path.join(release, 'manifest.json'), JSON.stringify(f.manifest()));
  const library = new Library({ root: path.join(f.directory, 'dev-library'), catalog: { games: [{ ...f.game, developmentManifest: path.join(release, 'manifest.json') }] }, fetchImpl: async () => { throw new Error('Unexpected network request.'); } });
  await library.init(); await library.install('morogue'); assert.equal(library.getInstalled('morogue').version, '1.0.0');
});
