'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../game/moratales-launcher.js'), 'utf8');
const ACCOUNT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

function fixture(checkConnection = async () => ({ status: 'online', accountId: ACCOUNT })) {
  const nativeFrames = new Map(), events = new Map(), documentEvents = new Map(), calls = []; let frameId = 0, listener;
  const root = {
    REPO_LAUNCHER_CONTEXT: { gameId: 'moratales', accountId: ACCOUNT },
    REPO_LAUNCHER: {
      checkConnection, onConnectionChanged(fn) { listener = fn; return () => calls.push('unsubscribe'); },
      requestExit: async () => calls.push('exit'), requestSignIn: async () => calls.push('account'), requestGame: async id => calls.push(id)
    },
    requestAnimationFrame(callback) { const id = ++frameId; nativeFrames.set(id, callback); return id; },
    cancelAnimationFrame(id) { nativeFrames.delete(id); }, setInterval() { return 1; }, clearInterval() {}, setTimeout, clearTimeout,
    addEventListener(name, fn) { events.set(name, fn); },
    document: { body: null, addEventListener(name, fn) { documentEvents.set(name, fn); }, querySelectorAll: () => [] },
    __velmoraTown: { active: true, nativePause: () => calls.push('pause-town'), nativeSave: () => calls.push('save-town') },
    MORATALES_COOP: { nativePause: () => calls.push('pause-coop'), nativeSave: async () => calls.push('save-coop') }
  };
  vm.runInNewContext(source, root);
  return { root, calls, events, documentEvents, nativeFrames, connection: value => listener(value) };
}

test('only verified bound account can start frames; offline holds and reconnect resumes them', async () => {
  const f = fixture(); let frames = 0;
  f.root.requestAnimationFrame(() => frames++); assert.equal(f.nativeFrames.size, 0);
  await tick(); assert.equal(f.root.REPO_LAUNCHER_GAME.paused, false); assert.equal(f.nativeFrames.size, 1);
  f.connection({ status: 'offline' }); assert.equal(f.nativeFrames.size, 0); assert.equal(f.root.REPO_LAUNCHER_GAME.paused, true);
  assert(f.calls.includes('pause-town')); assert(f.calls.includes('pause-coop'));
  f.connection({ status: 'online', accountId: ACCOUNT }); assert.equal(f.nativeFrames.size, 1);
  [...f.nativeFrames.values()][0](100); assert.equal(frames, 1);
});

test('late connection checks cannot override newer offline or changed-account events', async () => {
  const pending = deferred(), f = fixture(() => pending.promise);
  f.connection({ status: 'offline' }); pending.resolve({ status: 'online', accountId: ACCOUNT }); await tick();
  assert.equal(f.root.REPO_LAUNCHER_GAME.paused, true);
  f.connection({ status: 'account-changed', accountId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });
  f.connection({ status: 'online', accountId: ACCOUNT });
  assert.equal(f.root.REPO_LAUNCHER_GAME.paused, true); assert.equal(f.root.REPO_LAUNCHER_GAME.reason, 'account-changed');
  assert.equal(await f.root.MORATALES_DESKTOP.online(), false);
});

test('native online button accepts the fresh account broadcast emitted before its IPC resolves', async () => {
  let f; const online = { status: 'online', accountId: ACCOUNT };
  f = fixture(async () => { await Promise.resolve(); f.connection(online); return online; });
  await tick(); assert.equal(await f.root.MORATALES_DESKTOP.online(), true);
});

test('native close waits for guarded solo save and cannot be resumed by account polling', async () => {
  const f = fixture(); await tick(); const pending = deferred();
  f.root.__velmoraTown.nativeSave = () => pending.promise;
  let closed = false; const closing = f.root.REPO_LAUNCHER_GAME.beforeClose().then(() => { closed = true; });
  await tick(); assert.equal(closed, false); assert.equal(f.root.REPO_LAUNCHER_GAME.paused, true);
  f.connection({ status: 'online', accountId: ACCOUNT }); assert.equal(f.root.REPO_LAUNCHER_GAME.paused, true);
  pending.resolve(); await closing; assert.equal(closed, true); assert.equal(f.root.REPO_LAUNCHER_GAME.paused, true);
});

test('save failure vetoes close and lets the same user return to finish the action', async () => {
  const f = fixture(); await tick(); f.root.__velmoraTown.nativeSave = () => { throw Error('Storage is full'); };
  await assert.rejects(f.root.REPO_LAUNCHER_GAME.beforeClose(), /Storage is full/);
  assert.equal(f.root.REPO_LAUNCHER_GAME.reason, 'save-error'); assert.equal(f.root.REPO_LAUNCHER_GAME.paused, true);
  assert.equal(await f.root.MORATALES_DESKTOP.online(), true); assert.equal(f.root.REPO_LAUNCHER_GAME.paused, false);
});

test('multiplayer close awaits its own checkpoint and does not write the solo save', async () => {
  const f = fixture(); await tick(); f.calls.length = 0; f.root.MORATALES_COOP_ACTIVE = true;
  await f.root.REPO_LAUNCHER_GAME.beforeClose(); assert(f.calls.includes('save-coop')); assert(!f.calls.includes('save-town'));
  const g = fixture(); await tick(); g.root.MORATALES_COOP_ACTIVE = true; g.root.MORATALES_COOP.nativeSave = async () => { throw Error('Checkpoint failed'); };
  await assert.rejects(g.root.REPO_LAUNCHER_GAME.beforeClose(), /Checkpoint failed/);
});

test('missing native save hooks fail closed for active gameplay', async () => {
  const f = fixture(); await tick(); delete f.root.__velmoraTown.nativeSave;
  await assert.rejects(f.root.REPO_LAUNCHER_GAME.beforeClose(), /game save connection is unavailable/);
});

test('close flushes final character appearance after the local save without requiring cloud availability', async () => {
  const f = fixture(); await tick(); f.calls.length = 0;
  f.root.MORATALES_ACCOUNT_CHARACTERS = { sync: async () => { f.calls.push('sync-character'); throw Error('Offline'); } };
  await f.root.REPO_LAUNCHER_GAME.beforeClose();
  assert(f.calls.indexOf('save-town') < f.calls.indexOf('sync-character'));
});

test('title-screen Morogue and Repo links use native game routing', async () => {
  const f = fixture(); await tick(); let prevented = 0;
  f.documentEvents.get('click')({ target: { closest: selector => selector.includes('#mm-vampire') ? {} : null }, preventDefault: () => prevented++, stopImmediatePropagation: () => prevented++ });
  await tick(); assert(f.calls.includes('morogue')); assert.equal(prevented, 2);
});

test('page close cancels pending frames and ignores delayed online response', async () => {
  const pending = deferred(), f = fixture(() => pending.promise); f.root.requestAnimationFrame(() => assert.fail('closed frame'));
  f.events.get('pagehide')(); pending.resolve({ status: 'online', accountId: ACCOUNT }); await tick();
  assert.equal(f.nativeFrames.size, 0); assert(f.calls.includes('unsubscribe')); assert.equal(f.root.REPO_LAUNCHER_GAME.paused, true);
});
