'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../game/morogue-launcher.js'), 'utf8');
const accountId = '724350fa-47d9-49e4-a03e-7060958bcedb';
const nextTurn = () => new Promise(resolve => setImmediate(resolve));

// A small browser fixture with the real game's public contracts: begin may resolve
// null on failure, practice does not register a score, and heartbeat swallows errors.
// No live account, service, result, or player credentials are involved.
function fixture({ signedIn = true, online = true, account = accountId } = {}) {
  const target = new EventTarget();
  const timers = new Map();
  const frames = new Map();
  let nextTimer = 0;
  let nextFrame = 0, now = 0;
  class Element extends EventTarget {
    constructor(tag) { super(); this.tagName = tag; this.children = []; this.open = false; this.style = {}; }
    append(...children) { this.children.push(...children); }
    setAttribute(name, value) { this[name] = value; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    focus() {}
  }
  const document = {
    head: new Element('head'), body: new Element('body'),
    createElement: tag => new Element(tag), getElementById: () => null
  };
  const controls = {
    signedIn, account, accountOkay: true, authListeners: [], startResults: [], startCalls: 0,
    engineCreates: 0, finishCalls: [], heartbeatCalls: [], requestExit: 0, requestSignIn: 0,
    finishStatus: 200, checkpointStatus: 200, accountChecks: 0, events: []
  };
  const response = (status, value) => ({ ok: status >= 200 && status < 300, status, json: async () => value });
  const auth = { auth: {
    getSession: async () => ({ data: { session: controls.signedIn ? { access_token: 'test-access-token', user: { id: controls.account } } : null } }),
    onAuthStateChange(callback) {
      controls.authListeners.push(callback);
      return { data: { subscription: { unsubscribe() { controls.authListeners.splice(controls.authListeners.indexOf(callback), 1); } } } };
    }
  } };
  const root = {
    document, navigator: { onLine: online }, location: { href: 'https://morogue.repocompany.uk/', origin: 'https://morogue.repocompany.uk' },
    URL, Event, CustomEvent, AbortController, console,
    performance: { now: () => now },
    requestAnimationFrame(callback) { const id = ++nextFrame; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
    dispatchEvent: target.dispatchEvent.bind(target),
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    REPO_LAUNCHER_CONTEXT: { accountId },
    REPO_LAUNCHER: {
      requestExit() { controls.requestExit++; }, requestSignIn() { controls.requestSignIn++; },
      reportState(detail) { controls.events.push(detail); }
    },
    MOROGUE_SITE_BRIDGE: { account: async () => auth }
  };
  root.fetch = async (url, init) => {
    if (url === '/api/leaderboards/account') {
      controls.accountChecks++;
      assert.equal(init.headers.Authorization, 'Bearer test-access-token');
      return response(controls.accountOkay ? 200 : 503, { id: controls.account, username: 'TestPlayer' });
    }
    if (url === '/api/leaderboards/start') {
      controls.startCalls++;
      const result = controls.startResults.length ? controls.startResults.shift() : true;
      const accepted = await (typeof result === 'function' ? result() : result);
      return response(accepted ? 200 : 503, {});
    }
    if (url === '/api/leaderboards/checkpoint') return response(controls.checkpointStatus, {});
    if (url === '/api/leaderboards/finish') return response(controls.finishStatus, { posted: controls.finishStatus === 200 });
    throw Error('Unexpected fixture URL: ' + url);
  };
  root.MOROGUE_LEADERBOARDS = { create() {
    const board = {
      player: null,
      ready: null,
      async begin(options) {
        await this.ready;
        if (options.practice || !this.player) return null;
        try {
          const response = await root.fetch('/api/leaderboards/start');
          return response.ok ? { id: 'test-run-' + controls.startCalls, playerId: this.player.id } : null;
        } catch { return null; }
      },
      finish(state, activeMs) {
        controls.finishCalls.push({ state, activeMs });
        return root.fetch('/api/leaderboards/finish').then(response => response.json());
      },
      heartbeat(state, activeMs) {
        controls.heartbeatCalls.push({ state, activeMs });
        return root.fetch('/api/leaderboards/checkpoint').catch(() => {});
      }
    };
    board.ready = root.MOROGUE_SITE_BRIDGE.account(auth).then(() => {
      board.player = controls.signedIn ? { id: controls.account } : null;
    });
    controls.board = board;
    return board;
  } };
  root.MOROGUE_RUN_CLOCK = { create() {
    let elapsed = 0, last = null, running = false;
    return {
      start(time) { elapsed = 0; last = time; running = true; },
      sample(time, active) { if (last !== null && running) elapsed += time - last; last = time; running = !!active; return elapsed; },
      get milliseconds() { return elapsed; }
    };
  } };
  root.MORATALES_SURVIVOR = { create(options) {
    controls.engineCreates++;
    const game = {
      state: { status: 'playing', time: 0, ...options },
      pause() { if (this.state.status !== 'playing') return false; this.state.status = 'paused'; return true; },
      resume() { if (this.state.status !== 'paused') return false; this.state.status = 'playing'; return true; },
      update(dt) { if (this.state.status === 'playing') this.state.time += dt; },
      choose() { this.state.status = 'playing'; return true; },
      retire() { this.state.status = 'retired'; return true; }
    };
    return game;
  } };
  const context = vm.createContext(root);
  vm.runInContext(source, context, { filename: 'morogue-launcher.js' });
  const board = root.MOROGUE_LEADERBOARDS.create();
  return {
    root, board, controls, timers, document,
    frame(time) { now = time; const pending = [...frames.values()]; frames.clear(); for (const callback of pending) callback(time); },
    time(value) { now = value; },
    async ready() { await board.ready; await nextTurn(); },
    async start(options = { mode: 'mora' }) { const record = await board.begin(options); return { record, game: root.MORATALES_SURVIVOR.create(options) }; },
    offline() { root.navigator.onLine = false; root.dispatchEvent(new Event('offline')); },
    online() { root.navigator.onLine = true; root.dispatchEvent(new Event('online')); },
    dispose() { root.dispatchEvent(new Event('pagehide')); }
  };
}

test('guest and initially offline launchers cannot fall through into local or practice play', async () => {
  for (const options of [{ signedIn: false }, { online: false }]) {
    const f = fixture(options); await f.ready();
    let resolved = false;
    f.board.begin({ mode: 'mora' }).then(() => { resolved = true; });
    await nextTurn();
    assert.equal(resolved, false);
    assert.equal(f.controls.startCalls, 0);
    assert.equal(f.root.MOROGUE_LAUNCHER.state.blocked, true);
    assert.throws(() => f.root.MORATALES_SURVIVOR.create({}), /verified online run/);
    f.dispose();
    const practice = fixture(options); await practice.ready();
    practice.board.begin({ practice: { id: 'kiln' } }).then(() => { resolved = true; });
    await nextTurn(); assert.equal(resolved, false); assert.equal(practice.controls.startCalls, 0);
    practice.dispose();
  }
});

test('failed /start stays pending; concurrent begin and reconnect attempts do not duplicate requests', async () => {
  const f = fixture(); await f.ready(); f.controls.startResults.push(false, true);
  let resolved = false;
  const first = f.board.begin({ mode: 'endless' });
  const second = f.board.begin({ mode: 'endless' });
  assert.equal(first, second);
  first.then(() => { resolved = true; }); await nextTurn();
  assert.equal(f.controls.startCalls, 1); assert.equal(resolved, false);
  assert.equal(f.root.MOROGUE_LAUNCHER.state.reason, 'start');
  const retryA = f.root.MOROGUE_LAUNCHER.reconnect();
  const retryB = f.root.MOROGUE_LAUNCHER.reconnect();
  assert.equal(retryA, retryB); await retryA;
  assert.equal((await first).id, 'test-run-2'); assert.equal(f.controls.startCalls, 2);
  f.dispose();
});

test('offline pauses gameplay immediately; online alone does not resume or recreate the run', async () => {
  const f = fixture(); await f.ready(); const { game, record } = await f.start();
  game.update(1); f.offline(); game.update(30); game.resume();
  assert.equal(game.state.status, 'paused'); assert.equal(game.state.time, 1);
  assert.equal(game.retire(), false); assert.equal(f.controls.finishCalls.length, 0);
  f.online(); await nextTurn(); assert.equal(game.state.status, 'paused');
  await f.root.MOROGUE_LAUNCHER.reconnect();
  assert.equal(game.state.status, 'playing'); assert.equal(f.controls.startCalls, 1);
  assert.equal(record.id, 'test-run-1'); game.update(1); assert.equal(game.state.time, 2);
  f.dispose();
});

test('a successfully accepted /start is reused when connectivity drops during the response', async () => {
  const f = fixture(); await f.ready();
  let accept;
  f.controls.startResults.push(() => new Promise(resolve => { accept = resolve; }));
  const run = f.board.begin({ mode: 'mora' }); await nextTurn();
  f.offline(); accept(true); await nextTurn();
  assert.equal(f.controls.startCalls, 1); assert.equal(f.root.MOROGUE_LAUNCHER.state.waitingToStart, true);
  f.online(); await f.root.MOROGUE_LAUNCHER.reconnect();
  assert.equal((await run).id, 'test-run-1'); assert.equal(f.controls.startCalls, 1);
  f.dispose();
});

test('a different account cannot start a run or resume a suspended run', async () => {
  const wrong = fixture({ account: 'different-user' }); await wrong.ready();
  wrong.board.begin({ mode: 'mora' }); await nextTurn();
  assert.equal(wrong.controls.startCalls, 0); assert.equal(wrong.root.MOROGUE_LAUNCHER.state.reason, 'account');
  wrong.dispose();
  const f = fixture(); await f.ready(); const { game } = await f.start();
  f.controls.account = 'different-user';
  for (const callback of f.controls.authListeners) callback('SIGNED_IN');
  await f.root.MOROGUE_LAUNCHER.reconnect();
  assert.equal(game.state.status, 'paused'); assert.equal(f.controls.startCalls, 1);
  assert.equal(f.root.MOROGUE_LAUNCHER.state.reason, 'account'); f.dispose();
});

test('real completion payloads and responses are forwarded unchanged; leaving creates no result', async () => {
  const f = fixture(); await f.ready(); const { game } = await f.start();
  const state = { status: 'won', score: 25012, runTime: 938, kills: 913, mode: 'mora' };
  const result = await f.board.finish(state, 1034512);
  assert.deepEqual(result, { posted: true });
  assert.equal(f.controls.finishCalls[0].state, state);
  assert.equal(f.controls.finishCalls[0].activeMs, 1034512);
  f.root.MOROGUE_LAUNCHER.requestExit();
  assert.equal(f.controls.requestExit, 1); assert.equal(f.controls.finishCalls.length, 1);
  assert.equal(game.state.status, 'paused'); assert.equal(f.root.MOROGUE_LAUNCHER.state.disposed, true);
  game.update(99); game.resume(); assert.equal(game.state.time, 0);
  assert.equal(f.timers.size, 0); assert.equal(f.controls.authListeners.length, 0);
  f.root.MOROGUE_LAUNCHER.requestExit(); assert.equal(f.controls.requestExit, 1);
});

test('practice requires a verified account but does not register a leaderboard run', async () => {
  const f = fixture(); await f.ready(); const { record, game } = await f.start({ practice: { id: 'kiln' } });
  assert.equal(record, null); assert.equal(f.controls.startCalls, 0); assert.equal(game.state.status, 'playing');
  f.offline(); assert.equal(game.state.status, 'paused'); f.dispose();
});

test('service failures swallowed by the original heartbeat still pause the launcher', async () => {
  const f = fixture(); await f.ready(); const { game } = await f.start();
  f.controls.checkpointStatus = 503;
  await f.board.heartbeat(game.state, 30000);
  assert.equal(game.state.status, 'paused'); assert.equal(f.root.MOROGUE_LAUNCHER.state.reason, 'service');
  assert.equal(f.controls.startCalls, 1); f.dispose();
});

test('a disconnected upgrade screen stays frozen and returns to the same choice', async () => {
  const f = fixture(); await f.ready(); const { game } = await f.start();
  game.state.status = 'upgrade'; f.offline();
  assert.equal(game.state.status, 'upgrade');
  f.online(); await f.root.MOROGUE_LAUNCHER.reconnect();
  assert.equal(game.state.status, 'upgrade'); assert.equal(game.choose('weapon'), true);
  assert.equal(f.controls.startCalls, 1); f.dispose();
});

test('an already-selected upgrade committing during interruption completes only after reconnect', async () => {
  const f = fixture(); await f.ready(); const { game } = await f.start();
  game.state.status = 'upgrade'; f.offline();
  assert.equal(game.choose('weapon'), false); assert.equal(game.state.status, 'upgrade');
  f.online(); await f.root.MOROGUE_LAUNCHER.reconnect();
  assert.equal(game.state.status, 'playing'); assert.equal(f.controls.startCalls, 1); f.dispose();
});

test('connection pause freezes scene frames and actual run time; cancelled frames stay cancelled', async () => {
  const f = fixture(); await f.ready(); await f.start();
  const clock = f.root.MOROGUE_RUN_CLOCK.create(); clock.start(0);
  let rendered = 0;
  f.root.requestAnimationFrame(() => { rendered++; });
  f.frame(100); assert.equal(rendered, 1);
  f.time(150); f.offline(); assert.equal(clock.milliseconds, 150);
  f.root.requestAnimationFrame(() => { rendered++; });
  const cancelled = f.root.requestAnimationFrame(() => { rendered += 100; });
  f.frame(1000); f.root.cancelAnimationFrame(cancelled);
  assert.equal(rendered, 1); assert.equal(clock.milliseconds, 150);
  f.time(50000); f.online(); await f.root.MOROGUE_LAUNCHER.reconnect();
  f.frame(50010); assert.equal(rendered, 2);
  assert.equal(clock.sample(50010, true), 150);
  assert.equal(clock.sample(50110, true), 250); f.dispose();
});

test('installed game storage isolates accounts and retains each account across reinstalls', () => {
  const storageSource = fs.readFileSync(path.join(__dirname, '../game/account-storage.js'), 'utf8');
  const data = new Map([
    ['moratales-vampire-survivor-v1', '{"coins":9000}'],
    ['morogue-repo-account-v1', '{"user":"legacy-user"}']
  ]);
  const nativeStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key), key: index => [...data.keys()][index] ?? null,
    get length() { return data.size; }
  };
  function installedWindow(account) {
    const root = { localStorage: nativeStorage, REPO_LAUNCHER_CONTEXT: { accountId: account } };
    vm.runInNewContext(storageSource, root); return root;
  }
  const alice = installedWindow(accountId);
  assert.equal(alice.localStorage.getItem('moratales-vampire-survivor-v1'), null, 'Legacy storage must not become a different account’s progress');
  assert.equal(alice.localStorage.getItem('morogue-repo-account-v1'), null, 'Fallback auth cannot adopt the previous launcher user');
  alice.localStorage.setItem('moratales-vampire-survivor-v1', '{"coins":10}');
  alice.localStorage.setItem('morogue-pending-records-v1', '[{"runId":"finished-run"}]');
  const bob = installedWindow('934180fb-1829-4723-956c-238069f00211');
  assert.equal(bob.localStorage.length, 0);
  bob.localStorage.setItem('moratales-vampire-survivor-v1', '{"coins":2}');
  const reinstalledAlice = installedWindow(accountId);
  assert.equal(reinstalledAlice.localStorage.getItem('moratales-vampire-survivor-v1'), '{"coins":10}');
  assert.equal(reinstalledAlice.localStorage.length, 2);
  assert.equal(reinstalledAlice.localStorage.key(0), 'moratales-vampire-survivor-v1');
  assert.equal(reinstalledAlice.localStorage.key(50), null);
  bob.localStorage.clear();
  assert.equal(bob.localStorage.length, 0);
  assert.equal(alice.localStorage.length, 2);
  assert.equal(nativeStorage.getItem('moratales-vampire-survivor-v1'), '{"coins":9000}');
  assert.equal(nativeStorage.getItem('morogue-repo-account-v1'), '{"user":"legacy-user"}');
  alice.localStorage.removeItem('morogue-pending-records-v1');
  assert.equal(alice.localStorage.length, 1);
});
