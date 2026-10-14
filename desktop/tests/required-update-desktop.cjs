'use strict';
// Real native views and IPC, isolated fixture account; installer is never run.
const fs = require('node:fs/promises'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const { _electron } = require('playwright');
const root = path.resolve(__dirname, '..');
(async () => {
  const output = path.resolve(process.env.REPO_UPDATE_QA_OUTPUT || path.join(root, 'qa/required-update'));
  await fs.mkdir(output, { recursive: true });
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-required-update-'));
  const env = { ...process.env, REPO_LAUNCHER_TEST_PROFILE: profile, REPO_LAUNCHER_FIXTURES: '1', REPO_LAUNCHER_HIDDEN_TEST: '1' }; delete env.ELECTRON_RUN_AS_NODE;
  const app = await _electron.launch({ executablePath: require('electron'), args: [root, '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling'], env });
  const child = app.process(); let timeout;
  try {
    const shell = await app.firstWindow(), errors = [];
    shell.on('pageerror', error => errors.push(error.message));
    const cdp = await app.context().newCDPSession(shell);
    cdp.on('Page.screencastFrame', frame => void cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {}));
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 20, maxWidth: 640, maxHeight: 360 });
    await shell.locator('#sign-in-form').waitFor({ state: 'visible' });
    await shell.locator('#sign-in-username').fill('LauncherTest'); await shell.locator('#sign-in-password').fill('fixture-password'); await shell.locator('#sign-in-submit').click();
    await shell.waitForFunction(async () => (await repoLauncher.getState()).account.status === 'online');
    await app.evaluate(({ app, BrowserWindow, webContents }) => {
      if (app.isPackaged || !process.env.REPO_LAUNCHER_TEST_PROFILE) throw Error('Isolated development profile required');
      const { RequiredUpdate } = process.mainModule.require(app.getAppPath() + '/lib/required-update.cjs');
      const { LauncherUpdater } = process.mainModule.require(app.getAppPath() + '/lib/updater.cjs');
      const observe = RequiredUpdate.prototype.observe;
      RequiredUpdate.prototype.observe = function (value) { this.enabled = !!globalThis.enableRequiredFixture; return observe.call(this, value); };
      globalThis.fixtureUpdate = { status: 'downloading', progress: .63, version: '0.1.10' };
      LauncherUpdater.prototype.check = async function () { this.set(globalThis.fixtureUpdate); return this.snapshot(); };
      const fs = process.mainModule.require('node:fs'), path = process.mainModule.require('node:path');
      LauncherUpdater.prototype.applyOnQuit = async function (options) {
        const result = { restart: options.restart, windows: BrowserWindow.getAllWindows().length };
        await new Promise(resolve => setTimeout(resolve, 100)); result.contents = webContents.getAllWebContents().length;
        fs.writeFileSync(path.join(app.getPath('userData'), 'handoff.json'), JSON.stringify(result)); return true;
      };
    });
    // Reproduces the screenshot: status visible, game toolbar hidden, controls right.
    await shell.evaluate(() => repoLauncher.checkLauncherUpdates());
    await shell.locator('#download-status').waitFor({ state: 'visible' });
    for (const width of [1100, 1480, 1920]) {
      await app.evaluate(({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0].setSize(width, 940), width);
      assert.equal(await shell.locator('.window-controls').evaluate(e => Math.round(innerWidth - e.getBoundingClientRect().right)), 0);
    }
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].setSize(1480, 940); globalThis.enableRequiredFixture = true; });
    await shell.evaluate(() => repoLauncher.checkLauncherUpdates());
    await shell.locator('#update-panel').waitFor({ state: 'visible' });
    assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].contentView.children[0].getVisible()), false);
    await shell.keyboard.press('Escape');
    assert.match(await shell.evaluate(async () => { try { await repoLauncher.navigate('home'); return 'bypassed'; } catch (e) { return e.message; } }), /updating/);
    assert.equal(await shell.locator('#update-progress').getAttribute('value'), '0.63');
    await shell.screenshot({ path: path.join(output, 'updating.png') });
    // Capture one complete motion loop for a contact sheet and reviewable GIF.
    if (process.env.REPO_CAPTURE_MOTION === '1') {
      const box = await shell.locator('.brand-loader').boundingBox();
      const clip = { x: box.x - 60, y: box.y - 60, width: box.width + 120, height: box.height + 120 };
      const frames = []; const start = Date.now();
      while (Date.now() - start < 4400) {
        const file = 'motion-' + String(frames.length).padStart(3, '0') + '.png';
        frames.push({ file, time: Date.now() - start }); await shell.screenshot({ path: path.join(output, file), clip }); await shell.waitForTimeout(35);
      }
      await fs.writeFile(path.join(output, 'frames.json'), JSON.stringify(frames));
    }
    await shell.emulateMedia({ reducedMotion: 'reduce' }); await shell.waitForTimeout(100);
    assert.equal(await shell.locator('.motion-rest').getAttribute('opacity'), '1'); assert.equal(await shell.locator('.motion-core').getAttribute('opacity'), '0');
    await shell.emulateMedia({ reducedMotion: 'no-preference' });
    await app.evaluate(() => { globalThis.fixtureUpdate = { status: 'error' }; }); await shell.evaluate(() => repoLauncher.checkLauncherUpdates());
    await shell.locator('#update-retry').waitFor({ state: 'visible' }); assert.equal(await shell.locator('#sign-in-form').isVisible(), false);
    await app.evaluate(() => { globalThis.fixtureUpdate = { status: 'ready', version: '0.1.10' }; }); await shell.locator('#update-retry').click();
    await shell.waitForFunction(async () => (await repoLauncher.getState()).requiredUpdate.phase === 'countdown');
    const deadline = await shell.evaluate(async () => (await repoLauncher.getState()).requiredUpdate.restartAt);
    await shell.screenshot({ path: path.join(output, 'restart-countdown.png') });
    await shell.reload(); await shell.waitForFunction(() => window.repoLauncher);
    assert.equal(await shell.evaluate(async () => (await repoLauncher.getState()).requiredUpdate.restartAt), deadline);
    const exited = new Promise((resolve, reject) => { timeout = setTimeout(() => reject(Error('Mandatory update failed to close')), 20000); child.once('exit', code => resolve(code)); });
    assert.equal(await exited, 0); clearTimeout(timeout);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(profile, 'handoff.json'), 'utf8')), { restart: true, windows: 0, contents: 0 });
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify({ passed: true, deadline, profile, checks: ['controls right at three widths', 'native portal hidden and commands locked', 'actual progress', 'reduced motion', 'failure stays locked and retry works', 'renderer reload preserves deadline', 'automatic close and restart handoff after native contents disposal'] }, null, 2));
    console.log('PASS mandatory native update, progress, retry, countdown, renderer reload, safe automatic restart; no real installer run.');
  } finally { clearTimeout(timeout); if (child.exitCode === null) await app.evaluate(({ app }) => app.exit(99)).catch(() => {}); }
})().catch(error => { console.error(error); process.exitCode = 1; });
