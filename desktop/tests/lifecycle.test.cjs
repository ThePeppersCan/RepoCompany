'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const desktop = path.resolve(__dirname, '..');

function harness({ hidden = false, electronOverrides = {} } = {}) {
  const app = Object.assign(new EventEmitter(), {
    isPackaged: false, setName() {}, setAppUserModelId() {}, setPath() {}, getPath: () => desktop,
    getVersion: () => 'test', requestSingleInstanceLock: () => true,
    // Tests drive pending callbacks without starting an actual native window.
    whenReady: () => new Promise(() => {}), quit() {}, exit() {}
  });
  const electron = { app, protocol: { registerSchemesAsPrivileged() {} }, ...electronOverrides };
  const context = vm.createContext({
    require: name => name === 'electron' ? electron : name.startsWith('./') ? require(path.join(desktop, name)) : require(name),
    __dirname: desktop, process: { env: hidden ? { REPO_LAUNCHER_HIDDEN_TEST: '1' } : {} },
    AbortController, AbortSignal, URL, Response, console, setInterval, clearInterval, setTimeout, clearTimeout
  });
  vm.runInContext(fs.readFileSync(path.join(desktop, 'main.cjs'), 'utf8'), context);
  return { context, run: code => vm.runInContext(code, context) };
}

function portalHarness(options = {}) {
  const h = harness({ hidden: true, ...options });
  const frame = { url: 'https://repocompany.uk/#collection' };
  const contents = { isDestroyed: () => false, mainFrame: frame, send() {}, executeJavaScript: async () => {} };
  const calls = [];
  h.context.fixture = {
    contents,
    account: {
      token: 'TEST_ONLY_ACCESS_TOKEN', identity: 'TEST_ONLY_INTERNAL_ACCOUNT_ID',
      state: { status: 'online' }, snapshot: () => ({ status: 'online', username: 'LauncherTest', displayName: 'Launcher Test', error: '' })
    },
    library: { snapshot: () => ({ morogue: { status: 'installed', version: '0.1.0' } }), install: async id => { calls.push(id); return { installed: id }; } }
  };
  h.run('portalContents=fixture.contents; account=fixture.account; library=fixture.library;');
  return { ...h, contents, frame, calls, invoke: h.run('portalCommand') };
}

function demoHarness() {
  const windows = [], scripts = [], verifiedOrigins = [], libraryCalls = [], externalLinks = [];
  function contents() {
    return Object.assign(new EventEmitter(), {
      destroyed: false, mainFrame: { url: '' }, isDestroyed() { return this.destroyed; },
      getURL() { return this.mainFrame.url; }, send() {},
      setWindowOpenHandler(handler) { this.openHandler = handler; }
    });
  }
  class DemoWindow {
    constructor(options) { windows.push(options); throw Error('Demos must use the website account bridge inside the launcher.'); }
  }
  const h = portalHarness({ electronOverrides: {
    BrowserWindow: DemoWindow,
    dialog: { showErrorBox() {}, showMessageBox: async () => { throw Error('Web demos must not show a Morogue run-exit dialog.'); } },
    shell: { openExternal: async url => { externalLinks.push(url); } }
  } });
  h.contents.getURL = () => h.frame.url;
  h.contents.executeJavaScript = async script => { scripts.push(script); return true; };
  h.context.fixture.account.identity = '11111111-2222-4333-8444-555555555555';
  h.context.fixture.account.requireOnline = async origin => { verifiedOrigins.push(origin); return '11111111-2222-4333-8444-555555555555'; };
  h.context.fixture.account.refresh = async () => {};
  h.context.fixture.library = { snapshot: () => ({}) };
  for (const name of ['install', 'update', 'uninstall', 'getInstalled', 'isBusy']) {
    h.context.fixture.library[name] = () => { libraryCalls.push(name); throw Error('Web demos must not access downloaded game installations.'); };
  }
  h.context.fixture.mainWindow = { isDestroyed: () => false, webContents: contents() };
  h.context.fixture.sharedSession = { flushStorageData() {} };
  h.run('mainWindow=fixture.mainWindow; sharedSession=fixture.sharedSession; library=fixture.library; portalReady=true;');
  return { ...h, windows, scripts, verifiedOrigins, libraryCalls, externalLinks, event: { sender: h.contents, senderFrame: h.frame } };
}

function dragonboundPortal(h, { delayScript = false } = {}) {
  const opened = [], loadedScripts = [], frame = { src: '' };
  const overlay = { hidden: true, classList: { contains: name => name === 'is-visible' && !overlay.hidden }, querySelector: () => frame };
  const launcher = {
    launcherBridgeVersion: 1,
    open(options) { opened.push(options.accountId); overlay.hidden = false; frame.src = 'https://dragonbound.repocompany.uk/?source=repocompany&repoBridge=fixture-nonce'; },
    close() { overlay.hidden = true; frame.src = ''; }
  };
  const world = {
    URL, location: { href: 'https://repocompany.uk/' }, dispatchEvent() {}, PageTransitionEvent: class {}, setTimeout, clearTimeout,
    window: { repoAccount: { state: { user: { id: h.context.fixture.account.identity } }, db: { auth: {} } }, demoLibrary: { close() {} } },
    document: {
      getElementById: id => id === 'dragonboundStandaloneOverlay' ? overlay : null,
      createElement: () => ({ remove() {} }),
      head: { append(script) { loadedScripts.push(script); if (!delayScript) finishLoad(); } }
    }
  };
  function finishLoad() { world.window.DragonboundStandaloneLauncher = launcher; loadedScripts.at(-1).onload(); }
  h.contents.executeJavaScript = async script => { h.scripts.push(script); return vm.runInNewContext(script, world); };
  h.run('portalContentsId=17;');
  return { world, opened, loadedScripts, overlay, frame, finishLoad };
}

test('only the actual portal top-level frame can invoke native game installation', async () => {
  const h = portalHarness();
  const result = await h.invoke({ sender: h.contents, senderFrame: h.frame }, 'install', 'morogue');
  assert.equal(result.installed, 'morogue'); assert.deepEqual(h.calls, ['morogue']);
  await assert.rejects(h.invoke({ sender: h.contents, senderFrame: h.frame }, 'install', '../morogue'), /Choose a game/);
  assert.deepEqual(h.calls, ['morogue']);
});

test('portal native actions reject forged senders, subframes, wrong origins and missing frames', async () => {
  const h = portalHarness();
  for (const event of [
    { sender: {}, senderFrame: h.frame },
    { sender: h.contents, senderFrame: { url: 'https://repocompany.uk/#collection' } },
    { sender: h.contents, senderFrame: null },
    { sender: h.contents }
  ]) await assert.rejects(h.invoke(event, 'install', 'morogue'), /belongs to the Repo Company website/);
  for (const origin of ['https://repocompany.uk.evil.example/', 'https://morogue.repocompany.uk/', 'http://repocompany.uk/', 'repo-launcher://app/index.html']) {
    h.frame.url = origin;
    await assert.rejects(h.invoke({ sender: h.contents, senderFrame: h.frame }, 'install', 'morogue'), /belongs to the Repo Company website/);
  }
  assert.deepEqual(h.calls, []);
});

test('a trusted portal cannot call shell-only actions or invent native commands', async () => {
  const h = portalHarness(), event = { sender: h.contents, senderFrame: h.frame };
  for (const action of ['window', 'website', 'openPath', 'executeJavaScript', '__proto__', '', null]) {
    await assert.rejects(h.invoke(event, action, 'morogue'), /desktop action is unavailable/);
  }
  assert.deepEqual(h.calls, []);
});

test('portal state exposes only public account and game metadata', async () => {
  const h = portalHarness();
  const value = await h.invoke({ sender: h.contents, senderFrame: h.frame }, 'state');
  assert.equal(value.account.username, 'LauncherTest'); assert.equal(value.catalog.games.length, 4);
  assert.deepEqual(Array.from(value.catalog.games.filter(game => game.delivery === 'download'), game => game.id), ['morogue', 'moratales', 'manager']);
  assert.deepEqual(Array.from(value.catalog.demos, demo => demo.id), ['dragonbound', 'diver', 'goblin', 'rooftops', 'seas', 'sports']);
  assert.equal(value.library.morogue.status, 'installed');
  assert.doesNotMatch(JSON.stringify(value), /TEST_ONLY_ACCESS_TOKEN|TEST_ONLY_INTERNAL_ACCOUNT_ID|access_token|refresh_token|developmentManifest|manifestUrl|approvedOrigins/);
});

test('portal actions reject a destroyed or shutting-down website', async () => {
  const h = portalHarness(), event = { sender: h.contents, senderFrame: h.frame };
  h.contents.isDestroyed = () => true;
  await assert.rejects(h.invoke(event, 'install', 'morogue'), /belongs to the Repo Company website/);
  h.contents.isDestroyed = () => false; h.run('quitting=true;');
  await assert.rejects(h.invoke(event, 'state'), /belongs to the Repo Company website/);
  assert.deepEqual(h.calls, []);
});

test('web demo actions reject forged frames and arbitrary IDs before verifying or opening anything', async () => {
  const h = demoHarness();
  for (const event of [
    { sender: {}, senderFrame: h.frame },
    { sender: h.contents, senderFrame: { url: h.frame.url } },
    { sender: h.contents, senderFrame: null }
  ]) await assert.rejects(h.invoke(event, 'play-web', 'dragonbound'), /belongs to the Repo Company website/);
  for (const id of ['https://dragonbound.repocompany.uk/', '../diver', 'morogue', '__proto__', 'toString', '', null, undefined, {}]) {
    await assert.rejects(h.invoke(h.event, 'play-web', id), /demo/i);
  }
  assert.equal(h.verifiedOrigins.length, 0); assert.equal(h.windows.length, 0); assert.deepEqual(h.scripts, []);
  assert.deepEqual(h.libraryCalls, []); assert.deepEqual(h.externalLinks, []);
});

test('legacy demos and Dragonbound verify the live signed-in account before opening', async () => {
  for (const id of ['diver', 'dragonbound']) {
    for (const status of ['signed-out', 'offline']) {
      const h = demoHarness(); let verifications = 0;
      h.context.fixture.account.state.status = status;
      h.context.fixture.account.requireOnline = async () => { verifications++; throw Error(status === 'offline' ? 'Reconnect to play.' : 'Sign in before playing.'); };
      await assert.rejects(h.invoke(h.event, 'play-web', id), /Reconnect|Sign in/);
      assert.equal(verifications, 1); assert.equal(h.windows.length, 0); assert.deepEqual(h.scripts, []); assert.deepEqual(h.libraryCalls, []);
    }
  }
});

test('all five embedded demos open the existing website runtime without touching installed games', async () => {
  for (const id of ['diver', 'goblin', 'rooftops', 'seas', 'sports']) {
    const h = demoHarness(), opened = [];
    const dialog = { open: false, querySelector: () => frame }, frame = { src: '' };
    const portalWorld = {
      URL, location: { href: 'https://repocompany.uk/' }, dispatchEvent() {}, PageTransitionEvent: class {},
      document: { getElementById: () => dialog, querySelector: () => frame },
      window: {
        repoAccount: { state: { user: { id: h.context.fixture.account.identity } } },
        demoLibrary: { close() {} },
        repoLegacy: {
          async close() { dialog.open = false; },
          async open(value) { opened.push(value); frame.src = 'https://repocompany.uk/legacy-runtime.html?dashboard=' + value; dialog.open = true; }
        }
      }
    };
    h.contents.executeJavaScript = async script => vm.runInNewContext(script, portalWorld);
    h.run('portalContentsId=17;');
    const frameAllowed = value => {
      let result;
      h.run('handlePortalRequest')({ webContentsId: 17, resourceType: 'subFrame', url: 'https://repocompany.uk/legacy-runtime.html?dashboard=' + value }, decision => { result = !decision.cancel; });
      return result;
    };
    assert.equal(frameAllowed(id), false, 'the account requirement also blocks direct iframe launches');
    await h.invoke(h.event, 'play-web', id);
    await h.invoke(h.event, 'play-web', id);
    assert.deepEqual(opened, [id], 'repeat Play does not restart the current demo');
    assert.equal(h.verifiedOrigins.length, 2, 'even repeated Play verifies the live account');
    assert.equal(frameAllowed(id), true);
    assert.equal(frameAllowed(id === 'diver' ? 'sports' : 'diver'), false, 'the grant permits only the selected demo');
    assert.deepEqual(Array.from(h.run('state()').running), [id]);
    assert.equal(h.windows.length, 0); assert.deepEqual(h.libraryCalls, []); assert.deepEqual(h.run('state()').library, {});
    dialog.open = false;
    await h.invoke(h.event, 'web-demo-closed', id);
    assert.deepEqual(Array.from(h.run('state()').running), []);
    assert.equal(frameAllowed(id), false, 'closing the website demo revokes its iframe grant');
  }
});

test('Dragonbound uses the existing portal account through its fixed iframe bridge without installing a game', async () => {
  const h = demoHarness(), portal = dragonboundPortal(h);
  portal.world.window.DragonboundStandaloneLauncher = { open() { throw Error('The unversioned website bridge must be replaced with the bundled guarded bridge.'); } };
  const frameAllowed = (resourceType = 'subFrame') => {
    let allowed;
    h.run('handlePortalRequest')({ webContentsId: 17, resourceType, url: 'https://dragonbound.repocompany.uk/?source=repocompany&repoBridge=fixture-nonce' }, result => { allowed = !result.cancel; });
    return allowed;
  };
  assert.equal(frameAllowed(), false);
  await h.invoke(h.event, 'play-web', 'dragonbound');
  await h.invoke(h.event, 'play-web', 'dragonbound');
  assert.equal(h.verifiedOrigins.length, 2); assert.equal(h.windows.length, 0);
  assert.deepEqual(portal.opened, [h.context.fixture.account.identity], 'repeat Play preserves the existing authenticated frame');
  assert.equal(portal.loadedScripts.length, 1); assert.equal(portal.loadedScripts[0].src, '/__repo-launcher/dragonbound-web.js');
  assert.equal(portal.world.window.repoSupabaseClient, portal.world.window.repoAccount.db);
  assert.equal(frameAllowed(), true); assert.equal(frameAllowed('mainFrame'), false);
  assert.deepEqual(h.externalLinks, []); assert.deepEqual(h.libraryCalls, []);
  assert.deepEqual(Array.from(h.run('state()').running), ['dragonbound']);
  portal.overlay.hidden = true;
  await h.invoke(h.event, 'web-demo-closed', 'dragonbound');
  assert.equal(frameAllowed(), false); assert.equal(h.run('games.size'), 0);
  assert.deepEqual(Array.from(h.run('state()').running), []); assert.deepEqual(h.libraryCalls, []);
});

test('a delayed Dragonbound bridge cannot open after an account switch or failed script load', async () => {
  for (const failure of ['account-switch', 'script-error']) {
    const h = demoHarness(), portal = dragonboundPortal(h, { delayScript: true });
    const pending = h.invoke(h.event, 'play-web', 'dragonbound');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(portal.loadedScripts.length, 1);
    if (failure === 'account-switch') {
      h.context.fixture.account.identity = '66666666-2222-4333-8444-555555555555';
      portal.world.window.repoAccount.state.user.id = h.context.fixture.account.identity;
      h.run('accountChanged();'); portal.finishLoad();
    } else portal.loadedScripts[0].onerror();
    await assert.rejects(pending, /account changed|could not connect/);
    assert.deepEqual(portal.opened, []); assert.equal(h.run('embeddedDemo'), null); assert.deepEqual(h.libraryCalls, []);
  }
});

test('web demos cannot finish launching after the verified account changes or the launcher closes', async () => {
  for (const id of ['diver', 'dragonbound']) {
    for (const change of ['account', 'shutdown']) {
      const h = demoHarness(); let resolveAccount;
      h.context.fixture.account.requireOnline = () => new Promise(resolve => { resolveAccount = resolve; });
      const pending = h.invoke(h.event, 'play-web', id);
      if (change === 'account') h.context.fixture.account.identity = '66666666-2222-4333-8444-555555555555';
      else h.run('quitting=true;');
      resolveAccount('11111111-2222-4333-8444-555555555555');
      await assert.rejects(pending, /account changed|launcher is closing/);
      assert.equal(h.windows.length, 0); assert.deepEqual(h.scripts, []); assert.deepEqual(h.libraryCalls, []);
    }
  }
});

test('lost or switched accounts close web demos and revoke their runtime grants', async () => {
  for (const id of ['diver', 'dragonbound']) {
    for (const change of ['signed-out', 'offline', 'switch-account']) {
      const h = demoHarness();
      const portal = id === 'dragonbound' ? dragonboundPortal(h) : null;
      await h.invoke(h.event, 'play-web', id);
      if (change === 'switch-account') h.context.fixture.account.identity = '66666666-2222-4333-8444-555555555555';
      else h.context.fixture.account.state.status = change;
      h.run('accountChanged();');
      assert.deepEqual(Array.from(h.run('state()').running), []);
      assert.equal(h.run('games.size'), 0); assert.equal(h.run('embeddedDemo'), null);
      assert.equal(h.windows.length, 0); assert.deepEqual(h.libraryCalls, []);
      if (portal) { assert.equal(portal.overlay.hidden, true); assert.equal(portal.world.window.__repoLauncherDemoTicket, undefined); }
      else assert.match(h.scripts.at(-1), /repoLegacy\?\.close/);
    }
  }
});

test('legacy runtime URLs cannot bypass the demo gate through missing, unknown or encoded routes', () => {
  const h = demoHarness(); h.run('portalContentsId=17;');
  const request = (pathname, resourceType = 'subFrame') => {
    let cancelled;
    h.run('handlePortalRequest')({ webContentsId: 17, resourceType, url: 'https://repocompany.uk' + pathname }, result => { cancelled = result.cancel; });
    return cancelled;
  };
  for (const pathname of ['/legacy-runtime.html', '/legacy-runtime.html?dashboard=', '/legacy-runtime.html?dashboard=unknown', '/%6cegacy-runtime.html?dashboard=diver']) {
    assert.equal(request(pathname), true, pathname);
  }
  for (const collection of ['binder', 'slabs', 'pack']) {
    assert.equal(request('/legacy-runtime.html?dashboard=' + collection), false, 'existing collection tools remain usable');
    assert.equal(request('/legacy-runtime.html?dashboard=' + collection, 'mainFrame'), true, 'the collection runtime stays inside its website frame');
  }
  assert.deepEqual(h.scripts, []); assert.deepEqual(h.libraryCalls, []);
});

test('same-account refresh does not interrupt a demo opening, but sign-out cancels its pending launch', async () => {
  for (const signOut of [false, true]) {
    const h = demoHarness(); let finishOpen;
    h.contents.executeJavaScript = async script => {
      h.scripts.push(script);
      return script.includes('await window.repoLegacy.open(') ? new Promise(resolve => { finishOpen = resolve; }) : true;
    };
    const opening = h.invoke(h.event, 'play-web', 'diver');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(typeof finishOpen, 'function');
    h.run('accountChanged();');
    assert.equal(h.scripts.length, 1, 'same-account refresh does not reconcile a frame before it opens');
    if (signOut) h.context.fixture.account.state.status = 'signed-out';
    h.run('accountChanged();'); finishOpen(true);
    if (signOut) {
      await assert.rejects(opening, /demo could not open/);
      assert.equal(h.run('embeddedDemo'), null);
    } else {
      await opening;
      assert.equal(h.run('embeddedDemo.id'), 'diver');
      assert.equal(h.run('embeddedDemo.opening'), false);
    }
    assert.deepEqual(h.libraryCalls, []);
  }
});

test('pending portal failure after native view destruction does not touch destroyed handles', async () => {
  const h = harness(); let rejectLoad, touched = 0;
  const contents = { isDestroyed: () => false, loadURL: () => new Promise((_resolve, reject) => { rejectLoad = reject; }) };
  h.context.handles = { contents, portal: { setVisible() { touched++; throw new Error('Destroyed native view'); } } };
  h.run('portalContents=handles.contents; portal=handles.portal;');
  const pending = h.run('loadPortal()');
  h.run('quitting=true; portalContents=null; portal=null; mainWindow=null;');
  rejectLoad(new Error('net::ERR_ABORTED'));
  await pending;
  assert.equal(touched, 0);
});

test('account lookup after portal destruction returns unavailable without reading the native view', async () => {
  const h = harness();
  h.context.destroyedPortal = { get webContents() { throw new Error('Destroyed view getter'); } };
  h.run('portal=destroyedPortal; portalContents=null; portalReady=true;');
  await assert.rejects(h.run('portalSession()'), /Portal unavailable/);
});

test('an in-flight account lookup rejection remains handled when the portal closes', async () => {
  const h = harness(); let rejectLookup;
  h.context.contents = { isDestroyed: () => false, getURL: () => 'https://repocompany.uk/', executeJavaScript: () => new Promise((_resolve, reject) => { rejectLookup = reject; }) };
  h.run('portalContents=contents; portalReady=true;');
  const pending = h.run('portalSession()');
  const rejected = assert.rejects(pending, /Destroyed frame/);
  h.run('quitting=true; portalContents=null; portalReady=false;');
  rejectLookup(new Error('Destroyed frame'));
  await rejected;
});

test('hidden native tests never reveal or focus the launcher through library navigation', () => {
  const h = harness({ hidden: true }); let revealed = 0;
  h.context.window = { isDestroyed: () => false, webContents: { isDestroyed: () => false, send() {} }, show() { revealed++; }, focus() { revealed++; }, isMinimized: () => false };
  h.run('mainWindow=window; selectLibrary("morogue"); showWindow(mainWindow);');
  assert.equal(revealed, 0);
});

test('late navigation after shutdown is rejected without using a destroyed window', async () => {
  const h = harness();
  h.run('quitting=true; mainWindow=null; portal=null; portalContents=null;');
  await assert.rejects(h.run('navigate("account")'), /launcher is closing/);
  assert.doesNotThrow(() => h.run('selectLibrary("morogue"); bounds(); broadcast();'));
});

test('an aborted older portal load cannot replace a newer Account navigation with Library', async () => {
  const h = harness(); const pending = [];
  h.context.contents = { isDestroyed: () => false, loadURL: () => new Promise((resolve, reject) => pending.push({ resolve, reject })) };
  h.run('portalContents=contents; view="account";');
  const first = h.run('loadPortal("#collection")');
  const second = h.run('loadPortal("#account/profile")');
  pending[0].reject(new Error('net::ERR_ABORTED')); await first;
  assert.equal(h.run('view'), 'account'); assert.equal(h.run('portalError'), ''); assert.equal(h.run('portalLoading'), true);
  pending[1].resolve(); await second;
  assert.equal(h.run('view'), 'account'); assert.equal(h.run('portalLoading'), false);
});

test('background game frames are denied without leaving Account, while top-level Play selects the right game', () => {
  const h = harness({ hidden: true });
  h.run('portalContentsId=17; view="account";');
  const handle = h.run('handlePortalRequest');
  let cancelled = false;
  handle({ webContentsId: 17, resourceType: 'subFrame', url: 'https://moratales.repocompany.uk/' }, result => { cancelled = result.cancel; });
  assert.equal(cancelled, true); assert.equal(h.run('view'), 'account'); assert.equal(h.run('selectedGame'), null);
  handle({ webContentsId: 17, resourceType: 'mainFrame', url: 'https://moratales.repocompany.uk/' }, result => { cancelled = result.cancel; });
  assert.equal(cancelled, true); assert.equal(h.run('view'), 'library'); assert.equal(h.run('selectedGame'), 'moratales');
  assert.equal(h.run('selectedGameRevision'), 1);
  h.run('selectLibrary("moratales");');
  assert.equal(h.run('selectedGameRevision'), 2);
});

test('only the exact appearance bridge can load behind the launcher website', () => {
  const h = harness({ hidden: true }); h.run('portalContentsId=17; view="account";');
  const handle = h.run('handlePortalRequest');
  for (const [pathname, allowed] of [['/interface/vampire-survivor/character-bridge.html', true], ['/interface/vampire-survivor/index.html', false], ['/preview.html', false]]) {
    let cancelled;
    handle({ webContentsId: 17, resourceType: 'subFrame', url: 'https://moratales.repocompany.uk' + pathname }, result => { cancelled = result.cancel; });
    assert.equal(cancelled, !allowed); assert.equal(h.run('view'), 'account');
  }
});

test('game session IPC is account-bound and close waits for a durable save', async () => {
  const h = portalHarness({ hidden: true });
  const identity = '11111111-2222-4333-8444-555555555555';
  let saved = 0, closed = 0, failure = false;
  const frame = { url: 'https://manager.repocompany.uk/' };
  const contents = { isDestroyed: () => false, mainFrame: frame, executeJavaScript: async () => { saved++; if (failure) throw Error('Storage full'); return true; } };
  h.context.gameWindow = { __gameId: 'manager', __accountId: identity, isDestroyed: () => false, webContents: contents, close() { closed++; } };
  h.context.fixture.mainWindow = { isDestroyed: () => false, webContents: { isDestroyed: () => false } };
  h.context.fixture.account.identity = identity;
  h.context.fixture.account.requireOnline = async () => h.context.fixture.account.identity;
  h.contents.getURL = () => 'https://repocompany.uk/';
  h.contents.executeJavaScript = async () => ({ access_token: h.context.fixture.account.token, user: { id: h.context.fixture.account.identity } });
  h.run('mainWindow=fixture.mainWindow; portalReady=true; games.set("manager",gameWindow);');
  const invoke = h.run('gameCommand'), event = { sender: contents, senderFrame: frame };
  assert.equal((await invoke(event, 'session')).user.id, identity);
  h.context.fixture.account.identity = '66666666-2222-4333-8444-555555555555';
  await assert.rejects(invoke(event, 'session'), /account changed/);
  await assert.rejects(invoke({ sender: contents, senderFrame: { ...frame } }, 'session'), /belongs to the game/);
  failure = true;
  await assert.rejects(invoke(event, 'exit'), /Storage full/); assert.equal(closed, 0);
  failure = false;
  await invoke(event, 'exit'); assert.equal(saved, 2); assert.equal(closed, 1);
});

test('automatic update sweeps deduplicate checks and skip running games and active library operations', async () => {
  const h = harness(); let resolveCheck, checks = 0, updates = 0, busy = false;
  h.context.libraryFixture = {
    checkUpdates: () => { checks++; return new Promise(resolve => { resolveCheck = resolve; }); },
    snapshot: () => ({ morogue: { version: '1.0.0', availableVersion: '2.0.0' } }),
    isBusy: () => busy,
    update: async () => { updates++; }
  };
  h.run('library=libraryFixture;');
  const first = h.run('checkAndApplyUpdates()'); const second = h.run('checkAndApplyUpdates()');
  assert.equal(first, second); resolveCheck(); await first; assert.equal(checks, 1); assert.equal(updates, 1);
  h.run('games.set("morogue", {});');
  const running = h.run('checkAndApplyUpdates()'); resolveCheck(); await running; assert.equal(updates, 1);
  h.run('games.clear();'); busy = true;
  const installing = h.run('checkAndApplyUpdates()'); resolveCheck(); await installing; assert.equal(updates, 1);
  busy = false;
  const closing = h.run('checkAndApplyUpdates()'); h.run('quitting=true;'); resolveCheck(); await closing; assert.equal(updates, 1);
});

test('device update preference accepts only a boolean from the trusted launcher or portal frame', async () => {
  const h = portalHarness(); let enabled = true, writes = 0;
  h.context.fixture.preferences = { snapshot: () => ({ automaticGameUpdates: enabled }), async setAutomaticGameUpdates(value) { writes++; enabled = value; } };
  h.run('preferences=fixture.preferences;');
  const event = { sender: h.contents, senderFrame: h.frame };
  for (const bad of [{ sender: {}, senderFrame: h.frame }, { sender: h.contents, senderFrame: { url: h.frame.url } }]) await assert.rejects(h.invoke(bad, 'automatic-game-updates', false), /belongs to/);
  for (const value of ['false', 0, null, {}, undefined]) await assert.rejects(h.invoke(event, 'automatic-game-updates', value), /on or off/);
  assert.equal(writes, 0);
  const result = await h.invoke(event, 'automatic-game-updates', false);
  assert.equal(result.preferences.automaticGameUpdates, false); assert.equal(writes, 1);
  h.context.fixture.account.state.status = 'signed-out'; h.context.fixture.account.identity = null;
  assert.equal(h.run('state()').preferences.automaticGameUpdates, false);
  h.context.fixture.account.state.status = 'online'; h.context.fixture.account.identity = 'another-account';
  assert.equal(h.run('state()').preferences.automaticGameUpdates, false, 'switching accounts does not reset a device preference');
  h.run('quitting=true;');
  await assert.rejects(h.invoke(event, 'automatic-game-updates', true), /belongs to/);
  assert.equal(writes, 1);
});

test('opt-out still checks versions and allows explicit update or repair without automatically installing', async () => {
  const h = harness(); let enabled = false, checks = 0; const actions = [];
  h.context.updateFixture = {
    preferences: { snapshot: () => ({ automaticGameUpdates: enabled }) },
    library: { async checkUpdates() { checks++; }, snapshot: () => ({ morogue: { version: '1.0.0', availableVersion: '2.0.0' } }), isBusy: () => false, async update(id) { actions.push('update:' + id); }, async install(id) { actions.push('repair:' + id); } }
  };
  h.run('preferences=updateFixture.preferences; library=updateFixture.library;');
  await h.run('checkAndApplyUpdates()');
  assert.equal(checks, 1); assert.deepEqual(actions, []);
  await h.run('executeCommand("update","morogue")'); await h.run('executeCommand("install","morogue")');
  assert.deepEqual(actions, ['update:morogue', 'repair:morogue']);
  enabled = true; await h.run('checkAndApplyUpdates()');
  assert.deepEqual(actions, ['update:morogue', 'repair:morogue', 'update:morogue']);
});

test('disabling automatic updates during a sweep lets its active transfer finish but starts no next game', async () => {
  const h = harness(); let enabled = true, complete; const updates = [];
  h.context.updateFixture = {
    preferences: { snapshot: () => ({ automaticGameUpdates: enabled }) },
    library: { checkUpdates: async () => {}, snapshot: () => ({ morogue: { version: '1', availableVersion: '2' }, moratales: { version: '1', availableVersion: '2' } }), isBusy: () => false, update(id) { updates.push(id); return new Promise(resolve => { complete = resolve; }); } }
  };
  h.run('preferences=updateFixture.preferences; library=updateFixture.library;');
  const sweep = h.run('checkAndApplyUpdates()'); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(updates, ['morogue']); enabled = false; complete(); await sweep;
  assert.deepEqual(updates, ['morogue']);
});

test('a game closing during another update is revisited immediately after that transfer finishes', async () => {
  const h = harness(); const versions = { morogue: { version: '1', availableVersion: '2' }, moratales: { version: '1', availableVersion: '2' } };
  let completeOther, checks = 0; const updates = [];
  h.context.updateFixture = { async checkUpdates() { checks++; }, snapshot: () => versions, isBusy: () => false, async update(id) { updates.push(id); if (id === 'moratales') await new Promise(resolve => { completeOther = resolve; }); versions[id].version = '2'; } };
  h.run('library=updateFixture; games.set("morogue",{});');
  const sweep = h.run('checkAndApplyUpdates()'); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(updates, ['moratales']);
  h.run('games.delete("morogue");'); const afterClose = h.run('checkAndApplyUpdates({reschedule:true})');
  assert.equal(sweep, afterClose); completeOther(); await sweep;
  assert.equal(checks, 2); assert.deepEqual(updates, ['moratales', 'morogue']);
});

test('Discord visibility is a device boolean protected by the portal sender boundary', async () => {
  const h = portalHarness(); let enabled = true; const calls = [];
  h.context.fixture.preferences = { snapshot: () => ({ automaticGameUpdates: true, discordPresence: enabled }), async setDiscordPresence(value) { enabled = value; } };
  h.context.fixture.discord = { setEnabled: value => calls.push(value), snapshot: () => ({ enabled, status: enabled ? 'idle' : 'disabled' }) };
  h.run('preferences=fixture.preferences; discordPresence=fixture.discord;');
  const event = { sender: h.contents, senderFrame: h.frame };
  await assert.rejects(h.invoke({ sender: h.contents, senderFrame: { url: h.frame.url } }, 'discord-presence', false), /belongs to/);
  for (const value of ['false', {}, 0]) await assert.rejects(h.invoke(event, 'discord-presence', value), /on or off/);
  const result = await h.invoke(event, 'discord-presence', false);
  assert.equal(result.preferences.discordPresence, false); assert.equal(result.discordPresence.status, 'disabled');
  assert.deepEqual(calls, [false]); assert.doesNotMatch(JSON.stringify(result.discordPresence), /TEST_ONLY|token|username|score|account/i);
});

test('successful native game start, focus and close drive only the corresponding Discord game activity', async () => {
  const windows = [], activity = []; let checks = 0;
  class GameWindow extends EventEmitter {
    constructor() {
      super(); windows.push(this); this.destroyed = false;
      this.webContents = Object.assign(new EventEmitter(), { isDestroyed: () => this.destroyed, send() {}, setWindowOpenHandler() {} });
    }
    isDestroyed() { return this.destroyed; }
    async loadURL() { activity.push('loaded'); }
    close() { this.destroyed = true; this.emit('closed'); }
  }
  const h = portalHarness({ electronOverrides: { BrowserWindow: GameWindow } });
  h.context.fixture.account.requireOnline = async () => 'original-account';
  h.context.fixture.account.refresh = async () => {};
  h.context.fixture.library = { getInstalled: () => ({ version: '1', entry: 'index.html' }), snapshot: () => ({ manager: { status: 'installed', version: '1' } }), isBusy: () => false, async checkUpdates() { checks++; } };
  h.context.fixture.discord = { gameStarted: id => activity.push('start:' + id), gameFocused: id => activity.push('focus:' + id), gameStopped: id => activity.push('stop:' + id) };
  h.context.fixture.mainWindow = { isDestroyed: () => false, webContents: { isDestroyed: () => false, send() {} } };
  h.context.fixture.sharedSession = { flushStorageData() {} };
  h.run('library=fixture.library; discordPresence=fixture.discord; mainWindow=fixture.mainWindow; sharedSession=fixture.sharedSession;');
  await h.run('play("manager")');
  assert.deepEqual(activity, ['loaded', 'start:manager']);
  windows[0].emit('focus'); windows[0].close(); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(activity, ['loaded', 'start:manager', 'focus:manager', 'stop:manager']);
  assert.equal(checks, 1, 'closing the real game lifecycle initiates deferred update checks');
  assert.equal(h.run('games.size'), 0);
});
