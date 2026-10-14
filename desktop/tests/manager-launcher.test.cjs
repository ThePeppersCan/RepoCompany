'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { nativeRuntime, auditDependencies } = require('../tools/prepare-manager.cjs');
const source = fs.readFileSync(path.join(__dirname, '../game/manager-launcher.js'), 'utf8');
const accountId = '724350fa-47d9-49e4-a03e-7060958bcedb';
const otherId = 'cd645e52-cf54-498a-bd04-351e2d0ad86d';
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve; return { promise: new Promise(r => { resolve = r; }), resolve: value => resolve(value) }; }

function fixture(options = {}) {
  class Element extends EventTarget {
    constructor() { super(); this.children = []; this.queries = new Map(); this.hidden = false; }
    setAttribute() {}
    appendChild(child) { this.children.push(child); }
    querySelector(name) { if (!this.queries.has(name)) this.queries.set(name, new Element()); return this.queries.get(name); }
    contains(value) { return value === this || [...this.queries.values()].includes(value); }
  }
  const events = new EventTarget(), docEvents = new EventTarget(), timers = new Map(), opened = [], deleted = [];
  const state = { status: options.status || 'online', accountId, tokenUser: accountId, cloudError: options.cloudError || null, cloudCreates: 0, storageCreates: 0, syncs: 0, saves: 0, flushes: 0, cloudFlushes: 0, exits: 0, authCalls: 0, destroyed: 0, rebases: 0 };
  const document = { readyState: 'complete', head: new Element(), body: new Element(), createElement: () => new Element(), addEventListener: docEvents.addEventListener.bind(docEvents), querySelectorAll: () => [] };
  let connectionCallback, cloudCallback;
  const root = {
    document, console, Promise,
    addEventListener: events.addEventListener.bind(events),
    setInterval(callback) { const id = timers.size + 1; timers.set(id, callback); return id; }, clearInterval(id) { timers.delete(id); },
    indexedDB: { open(name, version) { opened.push({ name, version }); return {}; }, deleteDatabase(name) { deleted.push(name); }, databases: async () => [{ name: 'unscoped' }, { name: `repo-launcher-account-v1:${accountId}:careers`, version: 1 }, { name: `repo-launcher-account-v1:${otherId}:careers`, version: 1 }] },
    localStorage: {}, VelmoraSaveCodec: {},
    REPO_LAUNCHER_CONTEXT: { gameId: 'manager', accountId },
    REPO_LAUNCHER: {
      async checkConnection() { return state.pendingCheck ? state.pendingCheck.promise : { status: state.status, accountId: state.accountId }; },
      async requestSession() { state.authCalls++; if (state.pendingSession) return state.pendingSession.promise; return { access_token: 'fixture-token-' + state.authCalls, user: { id: state.tokenUser } }; },
      onConnectionChanged(callback) { connectionCallback = callback; return () => { connectionCallback = null; }; },
      requestExit() { state.exits++; }, requestSignIn() { state.exits++; }
    },
    supabase: { createClient(url, key, config) { state.clientConfig = config; return { marker: 'fixture-client' }; } },
    VelmoraCareerStorage: { create({ indexedDB }) { state.storageCreates++; indexedDB.open('velmora-manager-careers', 1); return { ready: Promise.resolve(), async flush() { state.flushes++; if (state.failSave) throw Error('disk full'); } }; } },
    VelmoraCloudSaves: { SUPABASE_URL: 'https://fixture.supabase.test', SUPABASE_KEY: 'fixture-public-key', create(config) {
      state.cloudCreates++; state.cloudConfig = config;
      return { ready: Promise.resolve(true), subscribe(callback) { cloudCallback = callback; return () => { cloudCallback = null; }; },
        status() { return { connected: true, mode: state.cloudError ? 'offline' : 'synced', error: state.cloudError }; }, user: () => config.session.user,
        async syncNow() { state.syncs++; return !state.cloudError; }, async flush() { state.cloudFlushes++; }, destroy() { state.destroyed++; }
      };
    } },
    REPO_MANAGER_CAREER: { async save() { state.saves++; if (state.pendingSave) await state.pendingSave.promise; if (state.failSave) throw Error('disk full'); } },
    VelmoraQuidditchEngine: { rebaseLauncherClock() { state.rebases++; } }
  };
  root.window = root;
  vm.runInNewContext(source, root, { filename: 'manager-launcher.js' });
  const gate = document.body.children[0];
  return { root, state, opened, deleted, timers, gate,
    async boot() { let done = false; const promise = root.REPO_MANAGER_LAUNCHER.bootstrap().then(() => { done = true; }); await tick(); return { promise, get done() { return done; } }; },
    async retry() { gate.querySelector('[data-retry]').dispatchEvent(new Event('click')); await tick(); },
    event(value) { connectionCallback?.(value); },
    cloudError(value) { state.cloudError = value; cloudCallback?.({ error: value, mode: value ? 'offline' : 'synced' }); },
    dispose() { events.dispatchEvent(new Event('pagehide')); }
  };
}

test('Manager scopes IndexedDB before its first career open and never lists another account databases', async () => {
  const f = fixture();
  f.root.indexedDB.deleteDatabase('careers');
  const boot = await f.boot(); await boot.promise;
  assert.equal(f.opened[0].name, `repo-launcher-account-v1:${accountId}:velmora-manager-careers`);
  assert.equal(f.deleted[0], `repo-launcher-account-v1:${accountId}:careers`);
  assert.equal(JSON.stringify(await f.root.indexedDB.databases()), JSON.stringify([{ name: 'careers', version: 1 }]));
  assert.equal(f.root.REPO_MANAGER_LAUNCHER.paused, false);
  assert.equal(f.state.cloudConfig.session.user.id, accountId);
  assert.equal(f.state.cloudConfig.session.access_token, undefined);
  assert.equal(f.state.clientConfig.auth.persistSession, false);
  assert.equal(await f.state.clientConfig.accessToken(), 'fixture-token-2');
  f.dispose(); assert.equal(f.timers.size, 0);
});

test('offline startup and failed cloud startup remain gated without creating a guest career', async () => {
  const offline = fixture({ status: 'offline' }), off = await offline.boot();
  assert.equal(off.done, false); assert.equal(offline.state.storageCreates, 0);
  offline.state.status = 'online'; offline.event({ status: 'online', accountId });
  await tick(); assert.equal(off.done, false);
  await offline.retry(); await off.promise; assert.equal(offline.state.cloudCreates, 1); offline.dispose();
  const outage = fixture({ cloudError: 'unavailable' }), boot = await outage.boot();
  assert.equal(boot.done, false); assert.equal(outage.root.REPO_MANAGER_LAUNCHER.paused, true);
  outage.state.cloudError = null; await outage.retry(); await boot.promise;
  assert.equal(outage.state.cloudCreates, 1); assert.equal(outage.state.storageCreates, 1); assert.equal(outage.state.syncs, 1); outage.dispose();
});

test('offline/online transitions require explicit resume and preserve the original cloud/store', async () => {
  const f = fixture(); await (await f.boot()).promise;
  f.event({ status: 'offline', accountId }); assert.equal(f.root.REPO_MANAGER_LAUNCHER.paused, true);
  f.event({ status: 'online', accountId }); assert.equal(f.root.REPO_MANAGER_LAUNCHER.paused, true);
  await f.retry(); assert.equal(f.root.REPO_MANAGER_LAUNCHER.paused, false);
  assert.equal(f.state.cloudCreates, 1); assert.equal(f.state.storageCreates, 1); assert.equal(f.state.rebases, 3);
  f.cloudError('server unavailable'); assert.equal(f.root.REPO_MANAGER_LAUNCHER.paused, true); f.dispose();
});

test('a switched account permanently gates play and late authentication cannot initialise careers', async () => {
  const f = fixture(); f.state.pendingSession = deferred(); const boot = await f.boot();
  f.event({ status: 'account-changed', accountId: otherId });
  f.state.pendingSession.resolve({ access_token: 'old-fixture-token', user: { id: accountId } });
  await tick(); await f.retry();
  assert.equal(boot.done, false); assert.equal(f.state.storageCreates, 0); assert.equal(f.root.REPO_MANAGER_LAUNCHER.paused, true); f.dispose();
  const wrong = fixture(); wrong.state.tokenUser = otherId; const rejected = await wrong.boot();
  assert.equal(rejected.done, false); assert.equal(wrong.state.cloudCreates, 0); wrong.dispose();
});

test('late online check cannot resume after a newer offline event, and reconnect attempts deduplicate', async () => {
  const f = fixture(); f.state.pendingCheck = deferred(); const boot = await f.boot();
  await f.retry(); await f.retry(); assert.equal(f.state.authCalls, 0);
  f.event({ status: 'offline', accountId });
  f.state.pendingCheck.resolve({ status: 'online', accountId });
  await tick(); assert.equal(boot.done, false); assert.equal(f.state.storageCreates, 0); f.dispose();
});

test('close waits for durable career save, vetoes failure, and allows locally saved offline exit', async () => {
  const f = fixture(); await (await f.boot()).promise;
  f.state.failSave = true;
  await assert.rejects(f.root.REPO_LAUNCHER_GAME.beforeClose(), /disk full/);
  assert.equal(f.state.cloudFlushes, 0); assert.equal(f.state.exits, 0);
  f.state.failSave = false; f.event({ status: 'offline', accountId });
  await f.root.REPO_LAUNCHER_GAME.beforeClose();
  assert.equal(f.state.flushes, 1); assert.equal(f.state.cloudFlushes, 0);
  await f.retry(); assert.equal(f.root.REPO_MANAGER_LAUNCHER.paused, true, 'a completed close cannot reopen the game'); f.dispose();
  const online = fixture(); await (await online.boot()).promise;
  await online.root.REPO_LAUNCHER_GAME.beforeClose(); assert.equal(online.state.cloudFlushes, 1);
  assert.match(await online.state.clientConfig.accessToken(), /^fixture-token-/, 'cloud writes may obtain the bound account token while closing');
  online.dispose();
});

test('closing invalidates a pending reconnect before saving and a stale session cannot resume gameplay', async () => {
  const f = fixture(); await (await f.boot()).promise;
  f.event({ status: 'offline', accountId });
  f.state.pendingSession = deferred(); await f.retry();
  const authCalls = f.state.authCalls;
  f.state.pendingSave = deferred();
  const close = f.root.REPO_LAUNCHER_GAME.beforeClose();
  assert.equal(f.root.REPO_LAUNCHER_GAME.beforeClose(), close, 'concurrent close requests share the same durable save');
  f.state.pendingSession.resolve({ access_token: 'old-fixture-token', user: { id: accountId } });
  await tick(); await f.retry();
  assert.equal(f.root.REPO_MANAGER_LAUNCHER.paused, true);
  assert.equal(f.state.syncs, 0, 'the old reconnect cannot proceed to cloud sync');
  assert.equal(f.state.authCalls, authCalls, 'retry does not start another account check during closing');
  f.state.pendingSave.resolve(); await close;
  assert.equal(f.root.REPO_MANAGER_LAUNCHER.paused, true);
  assert.equal(f.state.saves, 1); f.dispose();
});

test('a failed close permits a fresh explicit reconnect but cannot revive the old reconnect', async () => {
  const f = fixture(); await (await f.boot()).promise;
  f.event({ status: 'offline', accountId }); f.state.pendingSession = deferred(); await f.retry();
  f.state.failSave = true;
  await assert.rejects(f.root.REPO_LAUNCHER_GAME.beforeClose(), /disk full/);
  f.state.pendingSession.resolve({ access_token: 'old-fixture-token', user: { id: accountId } });
  await tick(); assert.equal(f.root.REPO_MANAGER_LAUNCHER.paused, true);
  f.state.pendingSession = null; f.state.failSave = false; await f.retry();
  assert.equal(f.root.REPO_MANAGER_LAUNCHER.paused, false); assert.equal(f.state.syncs, 1); f.dispose();
});

test('package hooks use the real durable save and freeze match catch-up without modifying the game checkout', () => {
  const app = nativeRuntime('app.js', 'async function saveCareerStateDurable(){}\n  window.VELMORA_MANAGER_DEBUG={};');
  assert.match(app, /careerHasStarted\(\).*saveCareerStateDurable/);
  assert.match(app, /REPO_MANAGER_CAREER/);
  const engine = nativeRuntime('velmora-quidditch-engine.js', '  function catchUpTo(targetSeconds,maxSteps=36000,maxWorkMs=Infinity){steps++;}\nwindow.VelmoraQuidditchEngine={catchUpTo};');
  const scope = { window: { REPO_MANAGER_LAUNCHER: { paused: true } }, steps: 0, rebases: 0, matchdayRebaseClock() { scope.rebases++; } };
  vm.runInNewContext(engine, scope); scope.window.VelmoraQuidditchEngine.catchUpTo(1000);
  assert.equal(scope.steps, 0); assert.equal(scope.rebases, 1);
  scope.window.REPO_MANAGER_LAUNCHER.paused = false; scope.window.VelmoraQuidditchEngine.catchUpTo(1000); assert.equal(scope.steps, 1);
  assert.match(nativeRuntime('career-bootstrap.js', ''), /await window.REPO_MANAGER_LAUNCHER.bootstrap\(\)/);
  assert.throws(() => nativeRuntime('app.js', 'changed runtime'), /hook changed/);
});

test('package audit rejects missing startup dependencies and unproven missing artwork', async () => {
  await assert.rejects(auditDependencies(new Map([['index.html', { buffer: Buffer.from('<script src="missing.js"></script>') }]])), /missing.js/);
  await assert.rejects(auditDependencies(new Map([['app.js', { buffer: Buffer.from('const art="assets/new.png";') }]])), /assets\/new.png/);
});
