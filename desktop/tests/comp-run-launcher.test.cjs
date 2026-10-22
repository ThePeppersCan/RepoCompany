'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), fsp = require('node:fs/promises'), os = require('node:os'), path = require('node:path'), vm = require('node:vm');
const { canUseCompRunInput } = require('../lib/comp-run-permissions.cjs');
const { injectGame, createHandler } = require('../lib/protocol.cjs');
const { configureMediaPermissions } = require('../lib/media-permissions.cjs');
const configuration = require('../config.cjs');
const origin = 'https://comp-run.fluffy-star-4855.chatgpt.site';
const identity = '724350fa-47d9-49e4-a03e-7060958bcedb';
const tick = () => new Promise(resolve => setImmediate(resolve));

test('COMP-RUN preload exposes lifecycle controls without a session-token capability', () => {
  const source = fs.readFileSync(path.join(__dirname, '../game-preload.cjs'), 'utf8');
  function preload(game) {
    const exposed = {}, calls = [];
    vm.runInNewContext(source, {
      process: { argv: ['electron', '--repo-account-id=' + identity, '--repo-game-id=' + game] },
      require: name => { assert.equal(name, 'electron'); return {
        contextBridge: { exposeInMainWorld: (key, value) => { exposed[key] = value; } },
        ipcRenderer: { invoke: (...args) => { calls.push(args); }, on() {}, removeListener() {} }
      }; }
    });
    return { exposed, calls };
  }
  const current = preload('comp-run');
  assert.equal(current.exposed.REPO_LAUNCHER_CONTEXT.gameId, 'comp-run');
  assert.equal(current.exposed.REPO_LAUNCHER.requestSession, undefined);
  current.exposed.REPO_LAUNCHER.checkConnection();
  assert.deepEqual(current.calls, [['launcher:game', 'connection']]);
  const existing = preload('manager'); existing.exposed.REPO_LAUNCHER.requestSession();
  assert.deepEqual(existing.calls, [['launcher:game', 'session']]);
});

test('COMP-RUN uses its real unique origin and a separate installable release manifest', () => {
  const config = configuration(__dirname), game = config.games.find(item => item.id === 'comp-run');
  assert.equal(game.origin, origin); assert.equal(game.entry, 'index.html');
  assert.equal(game.delivery, 'download'); assert.equal(game.installable, true); assert(!game.comingSoon);
  assert.equal(game.manifestUrl, 'https://repo-company-games.pages.dev/comp-run/manifest.json');
  assert(config.approvedOrigins.includes(origin));
  assert.equal(config.games.filter(item => item.delivery !== 'web').at(-1).id, 'comp-run');
});

test('COMP-RUN entry adds only launcher storage/lifecycle scripts, preserving every original byte', () => {
  const original = '<!doctype html><html><head>\n<meta charset="utf-8"><script type="module" src="./main.js?v=2.2.1"></script></head><body>Original game</body></html>';
  const hooks = '\n<script src="/__repo-launcher/account-storage.js"></script>\n<script src="/__repo-launcher/comp-run.js"></script>\n<script defer src="https://repocompany.uk/game-playtime-client.js" data-game="comp-run"></script>';
  const served = injectGame(original, 'comp-run');
  assert.equal(served.replace(hooks, ''), original);
  assert(served.indexOf(hooks) < served.indexOf('./main.js'));
  assert(!served.includes('achievements'));
  assert.throws(() => injectGame('<html>bad entry</html>', 'comp-run'), /not compatible/);
});

test('native COMP-RUN serves installed game/download bytes and launcher adapter without networking', async t => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'repo-comp-run-protocol-'));
  t.after(() => fsp.rm(root, { recursive: true, force: true }));
  await fsp.mkdir(path.join(root, 'downloads'));
  const original = '<html><head><title>COMP-RUN</title></head><body></body></html>';
  await fsp.writeFile(path.join(root, 'index.html'), original);
  const binary = Buffer.from([0, 1, 255, 42]);
  await fsp.writeFile(path.join(root, 'downloads', 'COMP-RUN-Offline.123456789abc.000.bin'), binary);
  await fsp.writeFile(path.join(root, 'credits.txt'), 'Original licence');
  const config = configuration(__dirname);
  const handler = createHandler({ config, library: { getInstalled: id => id === 'comp-run' ? { directory: root, entry: 'index.html' } : null }, desktopRoot: path.resolve(__dirname, '..'), fetchNetwork: async () => { throw Error('No network fallback expected'); } });
  assert.match(await (await handler(new Request(origin + '/'))).text(), /__repo-launcher\/comp-run\.js/);
  assert.equal(await fsp.readFile(path.join(root, 'index.html'), 'utf8'), original);
  const response = await handler(new Request(origin + '/downloads/COMP-RUN-Offline.123456789abc.000.bin'));
  assert.equal(response.status, 200); assert.equal(response.headers.get('Content-Type'), 'application/octet-stream');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), binary);
  assert.equal(await (await handler(new Request(origin + '/credits.txt'))).text(), 'Original licence');
  assert.match(await (await handler(new Request(origin + '/__repo-launcher/comp-run.js'))).text(), /function beforeClose/);
});

function permissions() {
  const contents = { isDestroyed: () => false, getURL: () => origin + '/' };
  return { contents, details: { isMainFrame: true, requestingUrl: origin + '/' }, origin,
    record: { __gameId: 'comp-run', __accountId: identity, webContents: contents, closed: false, loading: false },
    account: { identity, state: { status: 'online' } }, gameOrigin: origin,
    window: { isDestroyed: () => false, isVisible: () => true, isMinimized: () => false, isFocused: () => true }, blocked: false };
}
test('mouse/fullscreen access rejects background, stale-account, wrong-origin and subframe requests', () => {
  assert.equal(canUseCompRunInput(permissions()), true);
  for (const change of [
    f => { f.blocked = true; }, f => { f.record.loading = true; }, f => { f.record.closed = true; },
    f => { f.record.__gameId = 'morogue'; }, f => { f.record.webContents = {}; },
    f => { f.account.identity = 'another-account'; }, f => { f.account.state.status = 'offline'; },
    f => { f.details.isMainFrame = false; }, f => { delete f.details.isMainFrame; },
    f => { f.details.requestingUrl = 'https://repocompany.uk/'; }, f => { f.origin = 'https://untrusted.test'; },
    f => { f.contents.getURL = () => 'https://untrusted.test/'; }, f => { f.contents.isDestroyed = () => true; },
    f => { f.window.isVisible = () => false; }, f => { f.window.isFocused = () => false; },
    f => { f.window.isMinimized = () => true; }, f => { f.details.requestingUrl = 'https://user:password@' + new URL(origin).host + '/'; }
  ]) { const fixture = permissions(); change(fixture); assert.equal(canUseCompRunInput(fixture), false); }
});
test('the permission broker delegates game controls without granting camera, microphone or screen capture', () => {
  const fixture = permissions(), handlers = {};
  const allowed = (contents, details, originValue) => canUseCompRunInput({ ...fixture, contents, details, origin: originValue });
  const controller = configureMediaPermissions({ setPermissionCheckHandler: fn => { handlers.check = fn; }, setPermissionRequestHandler: fn => { handlers.request = fn; } }, {
    getPortal: () => null, getAccount: () => fixture.account, getWindow: () => fixture.window, isPortalUrl: () => false,
    canUseGamePointer: allowed, canUseGameFullscreen: allowed
  });
  const request = permission => { let result; handlers.request(fixture.contents, permission, value => { result = value; }, fixture.details); return result; };
  for (const permission of ['pointerLock', 'fullscreen']) {
    assert.equal(handlers.check(fixture.contents, permission, origin, fixture.details), true); assert.equal(request(permission), true);
  }
  for (const permission of ['media', 'display-capture', 'speaker-selection', 'clipboard-read', 'geolocation', 'keyboardLock']) {
    assert.equal(handlers.check(fixture.contents, permission, origin, fixture.details), false); assert.equal(request(permission), false);
  }
  fixture.blocked = true; assert.equal(request('pointerLock'), false); assert.equal(request('fullscreen'), false);
  controller.dispose(); assert.equal(request('pointerLock'), false);
});

function lifecycle() {
  class Element {
    constructor() { this.children = []; this.listeners = new Map(); this.hidden = false; this.nodes = new Map(); }
    append(child) { this.children.push(child); }
    setAttribute() {}
    querySelector(selector) { if (!this.nodes.has(selector)) this.nodes.set(selector, new Element()); return this.nodes.get(selector); }
    contains(element) { return element === this || [...this.nodes.values()].includes(element); }
    addEventListener(type, fn) { this.listeners.set(type, fn); }
  }
  const document = new Element(); document.head = new Element(); document.body = new Element(); document.readyState = 'complete';
  document.createElement = () => new Element();
  const data = new Map(), controls = { blur: 0, pointerExit: 0, state: { status: 'online', accountId: identity }, unsubscribed: false };
  document.exitPointerLock = () => { controls.pointerExit++; };
  const events = new EventTarget(); events.addEventListener('blur', () => { controls.blur++; });
  const root = { document, Event, Promise,
    localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key), key: index => [...data.keys()][index] ?? null, get length() { return data.size; } },
    REPO_LAUNCHER_CONTEXT: { gameId: 'comp-run', accountId: identity },
    REPO_LAUNCHER: { checkConnection: () => controls.pending || Promise.resolve(controls.state), onConnectionChanged: fn => { controls.connectionChanged = fn; return () => { controls.unsubscribed = true; }; }, requestExit: async () => {}, requestSignIn: async () => {} },
    addEventListener: events.addEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) };
  root.window = root;
  const context = vm.createContext(root);
  for (const name of ['account-storage.js', 'comp-run-launcher.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../game', name), 'utf8'), context);
  return { root, controls, data, document, gate: document.body.children[0] };
}
test('COMP-RUN lifecycle keeps local storage account-scoped, pauses on disconnect and closes without invented saves', async () => {
  const fixture = lifecycle(); await tick();
  const { root, controls, data, gate } = fixture;
  assert.equal(gate.hidden, true);
  assert.equal(root.REPO_LAUNCHER_GAME.active, true);
  root.localStorage.setItem('comp-run.settings.v1', '{"volume":65}');
  assert.equal(data.get('repo-launcher-account-v1:' + identity + ':comp-run.settings.v1'), '{"volume":65}');
  assert(!data.has('comp-run.settings.v1'));
  const saved = [...data];
  controls.connectionChanged({ status: 'offline' });
  assert.equal(gate.hidden, false); assert(controls.blur > 0); assert(controls.pointerExit > 0);
  assert.equal(root.REPO_LAUNCHER_GAME.active, false);
  controls.connectionChanged({ status: 'online', accountId: identity });
  assert.equal(gate.hidden, false, 'reconnection does not silently resume a paused run');
  gate.querySelector('[data-reconnect]').listeners.get('click')(); await tick();
  assert.equal(gate.hidden, true);
  assert.equal(root.REPO_LAUNCHER_GAME.active, true);
  assert.equal(await root.REPO_LAUNCHER_GAME.beforeClose(), true);
  assert.equal(gate.hidden, false); assert.deepEqual([...data], saved);
  assert.equal(root.REPO_LAUNCHER_GAME.active, false);
  root.dispatchEvent(new Event('pagehide')); assert.equal(controls.unsubscribed, true);
});
test('a late reconnect cannot unlock a different account or a closing game', async () => {
  const fixture = lifecycle(); await tick();
  fixture.controls.connectionChanged({ status: 'offline' });
  let resolve; fixture.controls.pending = new Promise(done => { resolve = done; });
  fixture.gate.querySelector('[data-reconnect]').listeners.get('click')();
  fixture.controls.connectionChanged({ status: 'account-changed', accountId: 'another-account' });
  resolve({ status: 'online', accountId: identity }); await tick();
  assert.equal(fixture.gate.hidden, false);
  assert.equal(fixture.gate.querySelector('[data-reconnect]').hidden, true);
  assert.equal(await fixture.root.REPO_LAUNCHER_GAME.beforeClose(), true);
});

test('native visible playtime sends only game/visibility and pauses with the COMP-RUN lifecycle', () => {
  const messages = [], listeners = new Map(); let active = true;
  const frame = { style: {}, setAttribute() {}, contentWindow: { postMessage: (body, destination) => messages.push({ body: { ...body }, destination }) } };
  const document = { hidden: false, currentScript: { dataset: { game: 'comp-run' }, src: 'https://repocompany.uk/game-playtime-client.js' }, createElement: () => frame, body: { append() {} }, addEventListener: (type, fn) => listeners.set(type, fn) };
  const root = { document, location: { origin }, URL, REPO_LAUNCHER_CONTEXT: { gameId: 'comp-run', accountId: identity }, REPO_LAUNCHER_GAME: { get active() { return active; } },
    addEventListener: (type, fn) => listeners.set(type, fn), setInterval: () => 1, clearInterval() {} };
  root.window = root;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../game-playtime-client.js'), 'utf8'), root);
  const handshake = { origin: 'https://repocompany.uk', source: frame.contentWindow, data: { type: 'repo-game-tracker-ready' } };
  listeners.get('message')({ ...handshake, origin: 'https://untrusted.test' }); assert.equal(messages.length, 0);
  listeners.get('message')(handshake);
  assert.deepEqual(messages.at(-1), { body: { type: 'repo-game-activity', game: 'comp-run', active: true }, destination: 'https://repocompany.uk' });
  active = false; listeners.get('repo-game-playtime-visibility')(); assert.equal(messages.at(-1).body.active, false);
  active = true; document.hidden = true; listeners.get('visibilitychange')(); assert.equal(messages.at(-1).body.active, false);
  assert(!JSON.stringify(messages).includes(identity), 'no account identity or token crosses the tracker message channel');
});

test('the playtime bridge permits only COMP-RUN at its exact verified source origin', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../game-playtime-bridge.js'), 'utf8');
  function bridge(parentOrigin, game) {
    let clients = 0, appended = 0;
    const root = { location: { hostname: 'repocompany.uk', search: '?game=' + encodeURIComponent(game) + '&parent=' + encodeURIComponent(parentOrigin) }, URLSearchParams, URL,
      parent: {}, repoDashboardConfig: { url: 'https://fixture.invalid', key: 'public-fixture' }, supabase: { createClient: () => { clients++; return {}; } },
      document: { createElement: () => ({}), body: { append: () => { appended++; } } } };
    root.window = root; vm.runInNewContext(source, root); return { clients, appended };
  }
  assert.deepEqual(bridge(origin, 'comp-run'), { clients: 1, appended: 1 });
  for (const [sourceOrigin, game] of [[origin, 'manager'], ['https://untrusted.test', 'comp-run'], [origin + '.untrusted.test', 'comp-run'], ['https://morogue.repocompany.uk', 'comp-run']]) assert.deepEqual(bridge(sourceOrigin, game), { clients: 0, appended: 0 });
});
