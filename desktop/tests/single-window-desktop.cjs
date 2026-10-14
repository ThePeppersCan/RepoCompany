'use strict';
// Native view lifecycle with all three actual installed packages and isolated
// account services. The fixture never publishes real Discord or account data.
const path = require('node:path'), fs = require('node:fs/promises'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const { _electron: electron } = require('playwright');
const { validateManifest } = require('../lib/manifest.cjs');
const root = path.resolve(__dirname, '..'), qa = path.join(root, 'qa');
const release = path.resolve(process.argv[2] || path.join(root, 'releases/morogue-preview3'));
async function poll(fn, accept, timeout = 30000) { const end = Date.now() + timeout; while (Date.now() < end) { const value = await fn(); if (accept(value)) return value; await new Promise(resolve => setTimeout(resolve, 100)); } throw Error('Native view condition timed out.'); }
async function seed(profile, id, entry, source) {
  const manifest = JSON.parse(await fs.readFile(path.join(source, 'manifest.json'), 'utf8'));
  validateManifest(manifest, { id, entry }, { developmentRoot: path.join(source, 'payload') });
  const installId = crypto.randomUUID(), directory = path.join(profile, 'library/games', id), version = path.join(directory, 'versions', installId);
  for (const file of manifest.files) { const target = path.join(version, file.path); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.link(path.join(source, 'payload', file.path), target); }
  await fs.writeFile(path.join(directory, 'active.json'), JSON.stringify({ schemaVersion: 1, gameId: id, version: manifest.version, entry: manifest.entry, installId }));
  return { version: manifest.version, files: manifest.files.length, bytes: manifest.files.reduce((sum, file) => sum + file.size, 0), method: 'hardlinks' };
}
async function driveCompositor(page) {
  const video = await page.context().newCDPSession(page);
  video.on('Page.screencastFrame', frame => void video.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {}));
  await video.send('Page.startScreencast', { format: 'jpeg', quality: 20, maxWidth: 640, maxHeight: 360, everyNthFrame: 1 });
}
async function run() {
  await fs.mkdir(qa, { recursive: true }); const profile = await fs.mkdtemp(path.join(qa, 'single-window-'));
  const releases = {
    morogue: await seed(profile, 'morogue', 'interface/vampire-survivor/index.html', release),
    moratales: await seed(profile, 'moratales', 'preview.html', path.join(root, 'releases/moratales-live')),
    manager: await seed(profile, 'manager', 'index.html', path.join(root, 'releases/manager-live'))
  };
  await fs.writeFile(path.join(profile, 'preferences.json'), JSON.stringify({ version: 1, automaticGameUpdates: false, discordPresence: false }));
  const env = { ...process.env, REPO_LAUNCHER_FIXTURES: '1', REPO_LAUNCHER_HIDDEN_TEST: '1', REPO_LAUNCHER_TEST_PROFILE: profile, REPO_LAUNCHER_TEST_MOROGUE_RELEASE: release }; delete env.ELECTRON_RUN_AS_NODE;
  const result = { releases, profile, errors: [], requestsFailed: [], missing: [], adventures: {} }; let app, closingLauncher = false;
  try {
    app = await electron.launch({ executablePath: require('electron'), args: [root, '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling'], env });
    app.context().on('page', page => { page.on('pageerror', error => result.errors.push(error.message)); page.on('requestfailed', request => result.requestsFailed.push({ url: request.url(), error: request.failure()?.errorText, duringShutdown: closingLauncher })); page.on('response', response => { if (response.status() >= 400) result.missing.push({ url: response.url(), status: response.status() }); }); });
    const shell = await app.firstWindow();
    await poll(() => shell.evaluate(() => window.repoLauncher?.getState()), value => value?.library.morogue?.status === 'installed');
    await poll(() => app.evaluate(async ({ webContents }) => { const portal = webContents.getAllWebContents().find(contents => contents.getURL().startsWith('https://repocompany.uk/')); return portal && await portal.executeJavaScript('!!document.getElementById("sign-in")'); }), Boolean);
    await app.evaluate(async ({ webContents }) => { const portal = webContents.getAllWebContents().find(contents => contents.getURL().startsWith('https://repocompany.uk/')); await portal.executeJavaScript('document.getElementById("sign-in").click();window.repoMessaging={open(){document.body.dataset.messages="open"}};true;'); });
    await shell.evaluate(() => window.repoLauncher.refresh());
    // Keep the fixture window physically hidden, while emulating the native
    // foreground flags to exercise the real visibility IPC and isolated preload.
    await app.evaluate(({ BrowserWindow, webContents }) => {
      const host = BrowserWindow.getAllWindows()[0]; host.isVisible = () => true; host.isFocused = () => true; host.emit('focus');
      const portal = webContents.getAllWebContents().find(contents => contents.getURL().startsWith('https://repocompany.uk/'));
      return portal.executeJavaScript('window.__portalVisibilityEvents=[];addEventListener("repo-launcher-portal-visibility",event=>window.__portalVisibilityEvents.push(event.detail.visible));true;');
    });
    const portalVisibility = () => app.evaluate(async ({ webContents }) => {
      const portal = webContents.getAllWebContents().find(contents => contents.getURL().startsWith('https://repocompany.uk/'));
      return portal.executeJavaScript('({native:document.documentElement.dataset.repoPortalVisible,hidden:document.hidden,events:[...window.__portalVisibilityEvents]})');
    });
    await poll(portalVisibility, value => value.native === 'true');
    await shell.evaluate(() => window.repoLauncher.play('morogue'));
    await poll(portalVisibility, value => value.native === 'false');
    const game = await poll(() => app.context().pages().find(page => page.url().startsWith('https://morogue.repocompany.uk/')), Boolean);
    await driveCompositor(game);
    await game.waitForFunction(() => window.MOROGUE_LAUNCHER && (!window.MOROGUE_LAUNCHER.state.blocked || window.MOROGUE_LAUNCHER.state.reason !== 'checking'));
    result.initialMorogueGate = await game.evaluate(() => window.MOROGUE_LAUNCHER.state);
    if (result.initialMorogueGate.blocked) {
      await game.getByRole('button', { name: 'Reconnect', exact: true }).click();
      await game.waitForFunction(() => !window.MOROGUE_LAUNCHER.state.blocked);
      result.initialMorogueReconnect = true;
    }
    await game.getByRole('button', { name: 'Play', exact: true }).click();
    await game.getByRole('button', { name: 'Endless Night', exact: true }).click();
    await game.getByRole('button', { name: 'Begin run', exact: true }).click();
    await game.waitForFunction(() => window.__moratalesSurvivor?.game?.state.runTime > 1);
    result.native = await app.evaluate(({ BrowserWindow, webContents }) => ({ windows: BrowserWindow.getAllWindows().length, games: webContents.getAllWebContents().filter(contents => contents.getURL().startsWith('https://morogue.repocompany.uk/')).length }));
    assert.deepEqual(result.native, { windows: 1, games: 1 });
    const running = await shell.evaluate(() => window.repoLauncher.getState()); assert.equal(running.activeGame.id, 'morogue'); assert.equal(running.gameVisible, true);
    await shell.locator('#exit-game').waitFor(); assert.equal(await shell.locator('#game-title').innerText(), 'Morogue');
    const before = await game.evaluate(() => ({ seed: window.__moratalesSurvivor.game.state.seed, name: window.__moratalesSurvivor.character.name }));
    await shell.locator('#game-messages').click();
    await poll(() => shell.evaluate(() => window.repoLauncher.getState()), state => state.messageOverlay && !state.gameVisible);
    await poll(portalVisibility, value => value.native === 'true');
    assert.equal(await game.evaluate(() => window.__moratalesSurvivor.game.state.seed), before.seed);
    await shell.locator('#back-to-game').click();
    await poll(() => shell.evaluate(() => window.repoLauncher.getState()), state => state.gameVisible);
    assert.equal(await game.evaluate(() => window.__moratalesSurvivor.game.state.seed), before.seed);
    result.hiddenPortalVisibility = await poll(portalVisibility, value => value.native === 'false');
    assert.equal(result.hiddenPortalVisibility.hidden, false, 'Electron document visibility alone is insufficient for read receipts');
    assert.deepEqual(result.hiddenPortalVisibility.events.slice(-3), [false, true, false], 'native view transitions reach the website through the isolated preload');
    await shell.locator('#game-fullscreen').click(); await poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen()), Boolean);
    await shell.locator('#game-fullscreen').click(); await poll(() => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen()), value => value === false);
    result.beforeExit = before;
    try { await shell.screenshot({ path: path.join(qa, 'single-window-titlebar.png'), timeout: 8000 }); await game.screenshot({ path: path.join(qa, 'single-window-game.png'), timeout: 8000 }); } catch (error) { result.captureWarning = error.message; }
    await app.evaluate(({ dialog }) => { dialog.showMessageBox = async () => ({ response: 0 }); });
    await shell.locator('#exit-game').click(); await poll(() => shell.locator('#exit-game').isEnabled(), Boolean);
    assert.equal((await shell.evaluate(() => window.repoLauncher.getState())).activeGame.id, 'morogue');
    await app.evaluate(({ dialog }) => { dialog.showMessageBox = async () => ({ response: 1 }); });
    await shell.locator('#exit-game').click(); await poll(() => shell.evaluate(() => window.repoLauncher.getState()), state => state.running.length === 0);
    assert.equal(await app.evaluate(({ webContents }) => webContents.getAllWebContents().some(contents => contents.getURL().startsWith('https://morogue.repocompany.uk/'))), false);
    assert.equal(await shell.locator('#game-toolbar').isVisible(), false);
    result.services = await app.evaluate(() => ({ starts: globalThis.__repoLauncherTestServices.stats.starts.length, finishes: globalThis.__repoLauncherTestServices.stats.finishes.length }));
    assert.deepEqual(result.services, { starts: 1, finishes: 0 }, 'exiting destroys an unfinished run without submitting a completed result');
    for (const id of ['moratales', 'manager']) {
      console.log(`Checking actual ${id} startup and save-before-return in the same launcher window`);
      await shell.evaluate(id => window.repoLauncher.play(id), id);
      const origin = `https://${id}.repocompany.uk/`;
      const adventure = await poll(() => app.context().pages().find(page => page.url().startsWith(origin)), Boolean);
      await driveCompositor(adventure);
      await adventure.waitForFunction(id => id === 'moratales' ? window.__moratalesMenu?.active && !window.REPO_LAUNCHER_GAME?.paused : !!window.REPO_MANAGER_CAREER && !window.REPO_MANAGER_LAUNCHER?.paused, id, { timeout: 60000 });
      assert.equal(await adventure.evaluate(() => typeof window.REPO_LAUNCHER_GAME?.beforeClose), 'function');
      assert.equal(await adventure.evaluate(() => typeof require), 'undefined');
      assert.equal((await shell.evaluate(() => window.repoLauncher.getState())).activeGame.id, id);
      assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length), 1);
      // Observe the native boundary while still executing the real installed
      // game's unmodified save hook. A destroyed event must follow resolution.
      await app.evaluate(({ webContents }, origin) => {
        const contents = webContents.getAllWebContents().find(contents => contents.getURL().startsWith(origin));
        globalThis.__nativeSaveOrder = [];
        const execute = contents.executeJavaScript.bind(contents);
        contents.executeJavaScript = async (code, ...args) => {
          if (!code.includes('await window.REPO_LAUNCHER_GAME.beforeClose()')) return execute(code, ...args);
          globalThis.__nativeSaveOrder.push('save-started');
          const value = await execute(code, ...args);
          globalThis.__nativeSaveOrder.push('save-resolved'); return value;
        };
        contents.once('destroyed', () => globalThis.__nativeSaveOrder.push('view-destroyed'));
      }, origin);
      await shell.locator('#exit-game').click();
      await poll(() => shell.evaluate(() => window.repoLauncher.getState()), state => !state.activeGame && state.running.length === 0, 60000);
      const order = await app.evaluate(() => globalThis.__nativeSaveOrder);
      assert.deepEqual(order, ['save-started', 'save-resolved', 'view-destroyed']);
      assert.equal(await app.evaluate(({ webContents }, origin) => webContents.getAllWebContents().some(contents => contents.getURL().startsWith(origin)), origin), false);
      result.adventures[id] = { started: true, saveBeforeReturn: order, windows: 1 };
    }
    await app.evaluate(({ dialog }) => { dialog.showErrorBox = () => {}; });
    await shell.evaluate(() => window.repoLauncher.play('morogue'));
    await app.evaluate(({ webContents }) => { const game = webContents.getAllWebContents().find(contents => contents.getURL().startsWith('https://morogue.repocompany.uk/')); game.forcefullyCrashRenderer(); });
    await poll(() => shell.evaluate(() => window.repoLauncher.getState()), state => state.running.length === 0);
    assert.equal(await app.evaluate(({ BrowserWindow, webContents }) => BrowserWindow.getAllWindows().length === 1 && !webContents.getAllWebContents().some(contents => contents.getURL().startsWith('https://morogue.repocompany.uk/'))), true);
    result.crashReturnedToLauncher = true;
    await shell.evaluate(() => window.repoLauncher.play('morogue'));
    const stopped = new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('Launcher shutdown left a game view alive.')), 15000); app.process().once('exit', code => { clearTimeout(timer); resolve(code); }); });
    closingLauncher = true;
    await shell.evaluate(() => { void window.repoLauncher.windowControl('close').catch(() => {}); }).catch(() => {});
    assert.equal(await stopped, 0); result.closedWithActiveGame = true;
    assert.deepEqual(result.errors, []); assert.deepEqual(result.missing, []);
    // Shutdown deliberately denies new requests while existing native views
    // finish closing. An account refresh racing that close is not a play-time
    // outage; the same denied request before shutdown still fails this check.
    assert.deepEqual(result.requestsFailed.filter(request => request.error !== 'net::ERR_ABORTED' && !(request.duringShutdown && request.error === 'net::ERR_BLOCKED_BY_CLIENT' && request.url === 'https://morogue.repocompany.uk/api/leaderboards/account')), [], 'unexpected requests failed outside view-close cancellation');
    result.passed = true; console.log(JSON.stringify(result));
  } catch (error) {
    result.failure = error.message;
    result.runtime = await Promise.all((app?.context().pages() || []).map(async page => ({ url: page.url(), diagnostic: await page.evaluate(() => ({ gate: document.querySelector('#repo-launcher-gate')?.innerText, morogue: window.MOROGUE_LAUNCHER?.state, moratales: window.REPO_LAUNCHER_GAME && { paused: window.REPO_LAUNCHER_GAME.paused, reason: window.REPO_LAUNCHER_GAME.reason }, manager: document.querySelector('#repo-manager-gate')?.innerText })).catch(() => null) })));
    throw error;
  } finally { await fs.writeFile(path.join(qa, 'single-window-desktop.json'), JSON.stringify(result, null, 2)); await app?.evaluate(({ app }) => app.exit(0)).catch(() => {}); await app?.close().catch(() => {}); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
