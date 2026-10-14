'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const crypto = require('node:crypto');
const { LauncherUpdater, verifyWindowsSignature } = require('../lib/updater.cjs');
const { SIGNING_CONTEXT, verifyInstaller } = require('../lib/update-manifest.cjs');
const keys = crypto.generateKeyPairSync('ed25519');
const config = { url: 'https://repocompany.uk/releases/launcher/latest.json', keyId: 'repo-launcher-2026-01', publicKey: keys.publicKey.export({ type: 'spki', format: 'pem' }), minSequence: 6, publisherName: 'Repo Company Update Key' };
async function fixture(t, options = {}) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-update-test-'));
  t.after(async () => { assert.equal(path.dirname(directory), os.tmpdir()); assert.ok(path.basename(directory).startsWith('repo-update-test-')); await fs.rm(directory, { recursive: true, force: true }); });
  const bytes = Buffer.from('isolated signed installer bytes'), now = { value: Date.parse('2026-10-14T12:00:00.000Z') };
  const payload = { schemaVersion: 1, appId: 'uk.repocompany.launcher', channel: 'stable', platform: 'win32', arch: 'x64', version: '0.1.6', sequence: 6, issuedAt: new Date(now.value - 60000).toISOString(), expiresAt: new Date(now.value + 86400000).toISOString(), sourceCommit: 'a'.repeat(40), installer: { url: 'https://github.com/ThePeppersCan/RepoCompany/releases/download/launcher-v0.1.6/Repo-Company-0.1.6-Windows-x64.exe', size: bytes.length, sha512: crypto.createHash('sha512').update(bytes).digest('base64') } };
  const sign = value => { const data = Buffer.from(JSON.stringify(value)); return { schemaVersion: 1, keyId: config.keyId, payload: data.toString('base64'), signature: crypto.sign(null, Buffer.concat([SIGNING_CONTEXT, data]), keys.privateKey).toString('base64') }; };
  const feed = { envelope: sign(payload), calls: 0 }, safety = { safe: true };
  const file = path.join(directory, 'Repo-Company-0.1.6-Windows-x64.exe'); await fs.writeFile(file, bytes);
  const native = Object.assign(new EventEmitter(), {
    configOnDisk: { value: Promise.resolve(options.disk || { publisherName: config.publisherName }) },
    currentVersion: { version: '0.1.5' }, installerPath: file, checks: 0, downloads: 0, hooks: 0, installations: [],
    verifyUpdateCodeSignature() {},
    setFeedURL(value) { this.feed = value; this.provider = new value.updateProvider(value, this, {}); },
    async checkForUpdates() { this.checks++; const info = await this.provider.getLatestVersion(); assert.equal(this.provider.resolveFiles(info)[0].info, info.files[0]); return { isUpdateAvailable: true, updateInfo: info, cancellationToken: { cancel() { native.cancelled = true; } } }; },
    async downloadUpdate() {
      this.downloads++; await options.waitDownload?.();
      if (!options.cached) { this.hooks++; const result = await this.verifyUpdateCodeSignature([config.publisherName], file); if (result !== null) throw Error(result); }
      this.emit('update-downloaded', { downloadedFile: file }); return [file];
    },
    async spawnLog() { return true; },
    quitAndInstall(...args) { this.installations.push(args); this.spawnLog(file, []).catch(() => {}); }
  });
  const settings = { config, packaged: true, cacheDir: path.join(directory, 'trust'), currentVersion: '0.1.5', canRestart: () => safety.safe, engineFactory: () => native, fetchImpl: async () => { feed.calls++; return Response.json(feed.envelope); }, now: () => now.value, ...options.settings };
  const updater = new LauncherUpdater(settings); t.after(() => updater.dispose());
  return { directory, bytes, payload, sign, feed, file, native, updater, settings, safety, now };
}

test('development fixtures and unconfigured installations never start a native updater', async () => {
  for (const settings of [{ config, packaged: false }, { config: {}, packaged: true }]) {
    const updater = new LauncherUpdater({ ...settings, engineFactory: () => { throw new Error('Must not load updater.'); } });
    assert.equal((await updater.check()).status, 'unconfigured');
  }
});

test('requires the exact custom verifier sentinel in shipped app-update.yml', async t => {
  for (const disk of [{}, { publisherName: '' }, { publisherName: 'Other Publisher' }, { publisherName: [] }, { publisherName: [config.publisherName, 'Other Publisher'] }, { publisherName: [config.publisherName, config.publisherName] }, { publisherName: ['Other Publisher'] }]) {
    const { native, updater } = await fixture(t, { disk });
    assert.equal((await updater.check()).status, 'error'); assert.equal(native.checks, 0); assert.equal(updater.engine, null);
  }
  const exactArray = await fixture(t, { disk: { publisherName: [config.publisherName] } });
  assert.equal((await exactArray.updater.check()).status, 'ready');
  assert.equal(await exactArray.updater.applyOnQuit({}), true);
});

test('authenticates metadata before handing a frozen release to NSIS and waits for explicit safe quit', async t => {
  const { native, updater, directory } = await fixture(t);
  assert.equal((await updater.check()).status, 'ready');
  assert.equal(native.feed.provider, 'custom'); assert.equal(native.disableWebInstaller, true); assert.equal(native.disableDifferentialDownload, true);
  assert.equal(native.allowDowngrade, false); assert.equal(native.allowPrerelease, false); assert.equal(native.autoInstallOnAppQuit, false);
  assert.equal(native.autoDownload, false); assert.equal(native.hooks, 1); assert.equal(native.installations.length, 0);
  const water = JSON.parse(await fs.readFile(path.join(directory, 'trust/verified-release.json'))); assert.equal(water.sequence, 6);
  assert.equal(await updater.applyOnQuit({ restart: true }), true); assert.deepEqual(native.installations, [[true, true]]);
  assert.equal(await updater.applyOnQuit({ restart: true }), false);
});

test('tampered feed is rejected before native check/download; on-disk failures remain handled', async t => {
  const f = await fixture(t); f.feed.envelope.signature = Buffer.alloc(64).toString('base64');
  assert.equal((await f.updater.check()).status, 'error'); assert.equal(f.native.checks, 0); assert.equal(f.native.downloads, 0);
  const missing = await fixture(t); missing.native.configOnDisk = { get value() { throw Error('Missing app-update.yml'); } };
  assert.equal((await missing.updater.check()).status, 'error');
});

test('cached installer bypass of NSIS hook cannot bypass independent hash/size verification', async t => {
  const f = await fixture(t, { cached: true }); await fs.writeFile(f.file, Buffer.alloc(f.bytes.length, 65));
  assert.equal((await f.updater.check()).status, 'error'); assert.equal(f.native.hooks, 0);
  assert.equal(await f.updater.applyOnQuit({}), false); assert.equal(f.native.installations.length, 0);
});

test('installer changes or signed-manifest expiry after Ready prevent installation', async t => {
  for (const change of ['bytes', 'expiry', 'path', 'sentinel']) {
    const f = await fixture(t, { cached: true }); assert.equal((await f.updater.check()).status, 'ready');
    if (change === 'bytes') await fs.writeFile(f.file, Buffer.alloc(f.bytes.length, 66));
    if (change === 'expiry') f.now.value += 2 * 86400000;
    if (change === 'path') f.native.installerPath = path.join(f.directory, 'other.exe');
    if (change === 'sentinel') f.native.configOnDisk.value = Promise.resolve({});
    assert.equal(await f.updater.applyOnQuit({}), false, change); assert.equal(f.native.installations.length, 0);
  }
});

test('concurrent checks cannot switch a release during download and a ready release stays frozen', async t => {
  let release; const wait = new Promise(resolve => { release = resolve; });
  const f = await fixture(t, { waitDownload: () => wait });
  const a = f.updater.check(), b = f.updater.check(); assert.equal(a, b);
  while (!f.native.downloads) await new Promise(resolve => setImmediate(resolve));
  f.feed.envelope.signature = Buffer.alloc(64).toString('base64');
  assert.equal(await f.updater.applyOnQuit({}), false); release();
  assert.equal((await a).status, 'ready'); await f.updater.check(); assert.equal(f.feed.calls, 1);
  assert.equal(await f.updater.applyOnQuit({}), true); assert.equal(f.native.installations.length, 1);
});

test('safety is rechecked after final hash and an unsafe launcher never starts the installer', async t => {
  let finish, hold = false;
  const f = await fixture(t, { settings: { verifyFile: async (...args) => { await verifyInstaller(...args); if (hold) await new Promise(resolve => { finish = resolve; }); } } });
  assert.equal((await f.updater.check()).status, 'ready');
  f.safety.safe = false; assert.equal(await f.updater.applyOnQuit({}), false);
  f.safety.safe = true; hold = true; const installing = f.updater.applyOnQuit({});
  while (!finish) await new Promise(resolve => setImmediate(resolve));
  f.safety.safe = false; finish(); assert.equal(await installing, false); assert.equal(f.native.installations.length, 0);
});

test('persisted trust state rejects rollback across launches and malformed state fails closed', async t => {
  const f = await fixture(t); await f.updater.check(); f.updater.dispose();
  const wrong = { ...f.payload, sequence: 7, expiresAt: new Date(f.now.value + 2 * 86400000).toISOString() };
  f.feed.envelope = f.sign(wrong);
  const second = new LauncherUpdater(f.settings); t.after(() => second.dispose()); assert.equal((await second.check()).status, 'ready'); second.dispose();
  f.feed.envelope = f.sign(f.payload);
  const replay = new LauncherUpdater(f.settings); t.after(() => replay.dispose()); assert.equal((await replay.check()).status, 'error');
  await fs.writeFile(path.join(f.directory, 'trust/verified-release.json'), '{}');
  const broken = new LauncherUpdater(f.settings); t.after(() => broken.dispose()); assert.equal((await broken.check()).status, 'error');
});

test('signature validation fails closed for tool failures, wrong signer, invalid status, path mismatch and malformed output', async () => {
  const file = path.resolve('fixture-update.exe');
  for (const result of [
    { error: new Error('PowerShell missing') },
    { stderr: 'Signature command failed' },
    { stdout: 'not JSON' },
    { stdout: JSON.stringify({ Status: 1, Path: file, Subject: config.publisherName }) },
    { stdout: JSON.stringify({ Status: 0, Path: file, Subject: 'Other' }) },
    { stdout: JSON.stringify({ Status: 0, Path: path.resolve('other.exe'), Subject: config.publisherName }) },
  ]) {
    const status = await verifyWindowsSignature([config.publisherName], file, { execFileImpl: (_exe, _args, _options, done) => done(result.error, result.stdout || '', result.stderr || '') });
    assert.equal(typeof status, 'string');
  }
});

test('signature validation uses hidden no-shell execution and requires Windows Valid status and exact signer', async () => {
  const file = path.resolve("fixture-'special-update.exe");
  const status = await verifyWindowsSignature([config.publisherName], file, { execFileImpl: (_exe, args, options, done) => {
    assert.equal(options.shell, false); assert.equal(options.windowsHide, true); assert.equal(options.timeout, 20000);
    const script = Buffer.from(args.at(-1), 'base64').toString('utf16le'); assert.match(script, /fixture-''special/);
    done(null, JSON.stringify({ Status: 0, Path: file, Name: config.publisherName, Subject: config.publisherName }), '');
  } });
  assert.equal(status, null);
});

test('disposing a pending download cannot advertise Ready or install after it settles', async t => {
  let finish; const wait = new Promise(resolve => { finish = resolve; });
  const f = await fixture(t, { cached: true, waitDownload: () => wait });
  const pending = f.updater.check();
  while (!f.native.downloads) await new Promise(resolve => setImmediate(resolve));
  f.updater.dispose(); finish(); await pending;
  assert.equal(f.native.cancelled, true); assert.equal(f.updater.ready, null);
  assert.notEqual(f.updater.snapshot().status, 'ready'); assert.equal(await f.updater.applyOnQuit({}), false);
  assert.equal(f.native.autoInstallOnAppQuit, false); assert.equal(f.native.installations.length, 0);
});

test('oversized, redirected and invalid UTF-8 manifest responses fail before the native provider', async t => {
  const responses = [
    new Response('x'.repeat(65537)),
    new Response('{}', { headers: { 'content-length': '65537' } }),
    new Response(Buffer.from([255, 255])),
    Object.defineProperty(Response.json({}), 'url', { value: 'https://other.invalid/latest.json' })
  ];
  for (const response of responses) {
    const f = await fixture(t, { settings: { fetchImpl: async () => response } });
    assert.equal((await f.updater.check()).status, 'error'); assert.equal(f.native.checks, 0);
  }
});

// Exercise the installed electron-updater implementation, including its actual
// disk cache and NSIS verifier. Only HTTP and OS process/app boundaries are fake.
async function realNsisFixture(t) {
  const f = await fixture(t); f.updater.dispose();
  const { NsisUpdater } = require('electron-updater');
  const disk = path.join(f.directory, 'app-update.yml');
  await fs.writeFile(disk, 'publisherName:\n  - Repo Company Update Key\nupdaterCacheDirName: fixture-updates\n');
  const traffic = { downloads: 0, hooks: 0, finalChecks: 0, spawn: [], quits: 0, autoQuitHooks: 0 };
  const create = (settings = {}) => {
    const app = { version: '0.1.5', name: 'RepoUpdateFixture', isPackaged: true, appUpdateConfigPath: disk,
      userDataPath: path.join(f.directory, 'app'), baseCachePath: path.join(f.directory, 'cache'),
      async whenReady() {}, quit() { traffic.quits++; }, onQuit() { traffic.autoQuitHooks++; }, relaunch() { throw Error('Unexpected relaunch'); } };
    const native = new NsisUpdater(null, app); native.logger = null;
    native.httpExecutor = { async download(url, destination, options) {
      traffic.downloads++; assert.equal(url.href, f.payload.installer.url);
      assert.equal(options.sha512, f.payload.installer.sha512); assert.ok(options.cancellationToken);
      assert.equal(options.headers.authorization, undefined);
      await fs.writeFile(destination, f.bytes);
      options.onProgress?.({ percent: 100 });
    } };
    native.spawnLog = async (...args) => { traffic.spawn.push(args); return true; };
    const updater = new LauncherUpdater({ ...f.settings, ...settings, engineFactory: () => native, verifyFile: async (...args) => {
      args[2]?.temporary ? traffic.hooks++ : traffic.finalChecks++; return verifyInstaller(...args);
    } });
    t.after(() => updater.dispose()); return { native, updater };
  };
  return { ...f, traffic, create };
}

test('real NSIS fresh download and persisted cached reuse both pass pinned verification with automatic installation disabled', async t => {
  const f = await realNsisFixture(t), first = f.create();
  assert.equal((await first.updater.check()).status, 'ready');
  assert.equal(f.traffic.downloads, 1); assert.equal(f.traffic.hooks, 1); assert.equal(f.traffic.finalChecks, 1);
  assert.equal(first.native.autoInstallOnAppQuit, false); assert.equal(first.native.quitHandlerAdded, false);
  assert.equal(f.traffic.spawn.length, 0); first.updater.dispose();
  const cached = f.create(); assert.equal((await cached.updater.check()).status, 'ready');
  assert.equal(f.traffic.downloads, 1, 'second engine reuses the real on-disk cache');
  assert.equal(f.traffic.hooks, 1, 'NSIS cached reuse skips its code signature hook');
  assert.equal(f.traffic.finalChecks, 2, 'launcher still checks the returned cached bytes');
  assert.equal(f.traffic.autoQuitHooks, 0);
  const electronPath = require.resolve('electron'), electronModule = require.cache[electronPath] || (require('electron'), require.cache[electronPath]);
  const originalElectron = electronModule.exports, events = new EventEmitter(); let beforeQuit = 0;
  events.on('before-quit-for-update', () => beforeQuit++);
  electronModule.exports = { autoUpdater: events };
  try {
    assert.equal(await cached.updater.applyOnQuit({ restart: false }), true);
    cached.updater.dispose(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.traffic.spawn.length, 1); assert.equal(f.traffic.spawn[0][0], cached.native.installerPath);
    assert.deepEqual(f.traffic.spawn[0][1], ['--updated', '/S']);
    assert.equal(f.traffic.quits, 1); assert.equal(beforeQuit, 1); assert.equal(f.traffic.finalChecks, 3);
    assert.equal(cached.native.autoInstallOnAppQuit, false);
  } finally { electronModule.exports = originalElectron; }
});

test('real NSIS cached completion event cannot hide replaced installer bytes and final tampering prevents spawn', async t => {
  const f = await realNsisFixture(t), first = f.create();
  assert.equal((await first.updater.check()).status, 'ready'); first.updater.dispose();
  const cached = f.create();
  cached.native.once('update-downloaded', event => { require('node:fs').writeFileSync(event.downloadedFile, Buffer.alloc(f.bytes.length, 7)); });
  assert.equal((await cached.updater.check()).status, 'error'); assert.equal(f.traffic.downloads, 1);
  assert.equal(await cached.updater.applyOnQuit({}), false); assert.equal(f.traffic.spawn.length, 0);
  // A subsequent real engine repairs the invalid disk cache through a full
  // verified download; tampering after Ready must still block the final handoff.
  cached.updater.dispose(); const repaired = f.create();
  assert.equal((await repaired.updater.check()).status, 'ready'); assert.equal(f.traffic.downloads, 2);
  await fs.writeFile(repaired.native.installerPath, Buffer.alloc(f.bytes.length, 8));
  assert.equal(await repaired.updater.applyOnQuit({ restart: true }), false);
  assert.equal(f.traffic.spawn.length, 0); assert.equal(f.traffic.quits, 0);
});

async function until(predicate) {
  const deadline = Date.now() + 2000;
  while (!predicate()) { if (Date.now() > deadline) throw Error('Fixture handoff did not reach its expected state.'); await new Promise(resolve => setImmediate(resolve)); }
}
async function electronBoundary(f, run) {
  const electronPath = require.resolve('electron'); require('electron'); const module = require.cache[electronPath];
  const original = module.exports, resources = Object.getOwnPropertyDescriptor(process, 'resourcesPath');
  let shellCalls = 0;
  module.exports = { autoUpdater: new EventEmitter(), shell: { async openPath() { shellCalls++; return ''; } } };
  Object.defineProperty(process, 'resourcesPath', { configurable: true, writable: true, value: f.directory });
  try { await run(() => shellCalls); } finally { module.exports = original; if (resources) Object.defineProperty(process, 'resourcesPath', resources); else delete process.resourcesPath; }
}
test('real NSIS handoff stays pending until a delayed installer process starts', async t => {
  const f = await realNsisFixture(t), { updater, native } = f.create(); let start;
  native.spawnLog = (...args) => { f.traffic.spawn.push(args); return new Promise(resolve => { start = resolve; }); };
  assert.equal((await updater.check()).status, 'ready');
  await electronBoundary(f, async () => {
    let settled = false; const result = updater.applyOnQuit({ restart: true }).then(value => { settled = true; return value; });
    await until(() => start && f.traffic.quits === 1); assert.equal(settled, false, 'main must still hold its recursive quit lock');
    start(true); assert.equal(await result, true);
    assert.deepEqual(f.traffic.spawn[0][1], ['--updated', '/S', '--force-run']);
    updater.dispose(); assert.equal(f.traffic.spawn.length, 1);
  });
});
test('real NSIS waits for delayed EACCES/UNKNOWN elevation retries and reports failed launches', async t => {
  for (const code of ['EACCES', 'UNKNOWN']) for (const success of [true, false]) {
    const f = await realNsisFixture(t), { updater, native } = f.create(); const pending = [];
    native.spawnLog = (...args) => { f.traffic.spawn.push(args); return new Promise((resolve, reject) => pending.push({ resolve, reject })); };
    assert.equal((await updater.check()).status, 'ready');
    await electronBoundary(f, async () => {
      let settled = false; const result = updater.applyOnQuit({}).then(value => { settled = true; return value; });
      await until(() => pending.length === 1); pending[0].reject(Object.assign(Error('Fixture cannot directly execute'), { code }));
      await until(() => pending.length === 2); assert.equal(settled, false);
      assert.equal(f.traffic.spawn[1][0], path.join(f.directory, 'elevate.exe'));
      assert.deepEqual(f.traffic.spawn[1][1], [native.installerPath, '--updated', '/S']);
      success ? pending[1].resolve(true) : pending[1].reject(Object.assign(Error('Fixture elevation rejected'), { code: 'EACCES' }));
      assert.equal(await result, success); assert.equal(updater.snapshot().status, success ? 'installing' : 'error');
    });
  }
});
test('a timed-out NSIS handoff cannot start a late elevation fallback, and missing executables never use shell.openPath', async t => {
  const f = await realNsisFixture(t), { updater, native } = f.create({ handoffTimeoutMs: 25 }); let reject;
  native.spawnLog = (...args) => { f.traffic.spawn.push(args); return new Promise((_resolve, fail) => { reject = fail; }); };
  assert.equal((await updater.check()).status, 'ready');
  await electronBoundary(f, async shellCalls => {
    const result = updater.applyOnQuit({}); await until(() => reject); assert.equal(await result, false);
    reject(Object.assign(Error('Late fixture rejection'), { code: 'EACCES' }));
    await new Promise(resolve => setImmediate(resolve)); await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.traffic.spawn.length, 1); assert.equal(shellCalls(), 0);
    const missing = f.create(); missing.native.spawnLog = async () => { throw Object.assign(Error('Fixture file disappeared'), { code: 'ENOENT' }); };
    assert.equal((await missing.updater.check()).status, 'ready');
    assert.equal(await missing.updater.applyOnQuit({}), false); assert.equal(shellCalls(), 0);
  });
});
