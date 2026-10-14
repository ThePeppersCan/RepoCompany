'use strict';
const path = require('node:path');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const { _electron: electron } = require('playwright');
const root = path.resolve(__dirname, '..');
const qa = path.join(root, 'qa');
const wait = (page, predicate, timeout = 30000) => page.waitForFunction(predicate, null, { polling: 100, timeout });
async function waitForState(page, predicate, timeout = 30000) {
  // Poll resolved IPC snapshots in Node; never let an async predicate's Promise
  // stand in for the Boolean condition a browser wait is meant to verify.
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const state = await bounded(page.evaluate(() => window.repoLauncher?.getState() ?? null), Math.min(5000, Math.max(1, deadline - Date.now())), 'Launcher state request timed out.');
    if (state && predicate(state)) return state;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw Error('Launcher state did not meet the expected condition within ' + timeout + 'ms.');
}
async function bounded(promise, milliseconds, message) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error(message)), milliseconds); })]);
  } finally { clearTimeout(timer); }
}
async function capture(app, page, filename, screenshots, captureWarnings) {
  // Hidden Electron surfaces can stall Playwright's compositor screenshot path,
  // particularly while the Windows installer is being compressed. Native captures
  // are diagnostic only and may never prevent the functional assertions running.
  try {
    const encoded = await bounded(app.evaluate(async ({ webContents }, url) => {
      const contents = webContents.getAllWebContents().find(candidate => !candidate.isDestroyed() && candidate.getURL() === url);
      if (!contents) throw Error('The surface has already closed.');
      const image = await contents.capturePage(undefined, { stayHidden: true, stayAwake: true });
      if (image.isEmpty()) throw Error('The hidden surface did not produce an image.');
      return image.toPNG().toString('base64');
    }, page.url()), 8000, 'The hidden native capture did not complete within 8 seconds.');
    await fs.writeFile(path.join(qa, filename), Buffer.from(encoded, 'base64'));
    screenshots.push(filename);
  } catch (error) {
    captureWarnings.push({ filename, error: error.message });
    console.warn('Diagnostic capture skipped:', filename, error.message);
  }
}
async function run() {
  await fs.mkdir(qa, { recursive: true });
  const profile = await fs.mkdtemp(path.join(qa, 'profile-'));
  const env = { ...process.env, REPO_LAUNCHER_FIXTURES: '1', REPO_LAUNCHER_TEST_PROFILE: profile, REPO_LAUNCHER_HIDDEN_TEST: '1' };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ executablePath: require('electron'), args: [root, '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling'], env, timeout: 30000 });
  const errors = [], requestFailures = [], screenshots = [], captureWarnings = [];
  let shutdownTimeout;
  app.on('window', page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => requestFailures.push({ url: request.url(), failure: request.failure()?.errorText }));
  });
  try {
    const page = await app.firstWindow(); page.setDefaultTimeout(15000);
    const first = await waitForState(page, state => state.catalog.games.length === 4);
    assert.equal(await page.evaluate(() => typeof require), 'undefined', 'shell renderer has no Node access');
    assert.equal(first.catalog.games.length, 4);
    await assert.rejects(() => page.evaluate(() => window.repoLauncher.play('morogue')), /Install/);
    await capture(app, page, 'launcher-library.png', screenshots, captureWarnings);
    await page.evaluate(() => window.repoLauncher.install('morogue'));
    assert.equal((await page.evaluate(() => window.repoLauncher.getState())).library.morogue.status, 'installed');
    await assert.rejects(() => page.evaluate(() => window.repoLauncher.play('morogue')), /Sign in/);
    await page.evaluate(() => window.repoLauncher.navigate('account'));
    const portalIsolation = await app.evaluate(async ({ webContents }) => {
      const portal = webContents.getAllWebContents().find(contents => contents.getURL().startsWith('https://repocompany.uk/'));
      await portal.executeJavaScript('document.getElementById("sign-in").click()');
      return portal.executeJavaScript('({node:typeof require,nativeBridge:typeof window.repoLauncher})');
    });
    assert.deepEqual(portalIsolation, { node: 'undefined', nativeBridge: 'undefined' }, 'website JavaScript has no ambient Node or native launcher bridge');
    await page.evaluate(() => window.repoLauncher.refresh());
    const signedIn = await page.evaluate(() => window.repoLauncher.getState());
    assert.equal(signedIn.account.status, 'online'); assert.equal(signedIn.account.username, 'LauncherTest');
    await page.evaluate(() => window.repoLauncher.navigate('library'));
    await app.evaluate(() => { globalThis.__repoLauncherTestServices.stats.characterMode = 'outage'; });
    const nextWindow = app.waitForEvent('window');
    await page.evaluate(() => window.repoLauncher.play('morogue'));
    const game = await nextWindow; game.setDefaultTimeout(15000);
    await wait(game, () => window.MOROGUE_LAUNCHER?.state.reason === 'characters');
    assert.equal(await game.locator('#vs-character-name').count(), 0, 'an unavailable character service cannot fall through into the creator');
    await app.evaluate(() => { globalThis.__repoLauncherTestServices.stats.characterMode = 'wrong-account'; });
    await game.evaluate(() => window.MOROGUE_LAUNCHER.reconnect());
    assert.equal(await game.evaluate(() => window.MOROGUE_LAUNCHER.state.blocked), true, 'a character envelope for another account cannot start the game');
    assert.equal(await game.evaluate(() => window.MOROGUE_SITE_BRIDGE.characterState), 'error');
    await app.evaluate(() => { globalThis.__repoLauncherTestServices.stats.characterMode = 'empty'; });
    await game.evaluate(() => window.MOROGUE_LAUNCHER.reconnect());
    await wait(game, () => window.MOROGUE_LAUNCHER.state.reason === 'characters-empty');
    await game.getByRole('button', { name: 'Open Moratales', exact: true }).waitFor();
    assert.equal(await game.locator('#vs-character-name').count(), 0, 'an empty shared list offers Moratales without a separate linking page');
    await app.evaluate(() => { globalThis.__repoLauncherTestServices.stats.characterMode = 'ready'; });
    await game.evaluate(() => window.MOROGUE_LAUNCHER.reconnect());
    await wait(game, () => !window.MOROGUE_LAUNCHER.state.blocked);
    assert.equal(await game.evaluate(() => typeof require), 'undefined', 'game renderer has no Node access');
    assert.equal(await game.evaluate(() => window.REPO_LAUNCHER_CONTEXT.accountId), '11111111-2222-4333-8444-555555555555');
    await wait(game, () => !document.querySelector('#vs-loading-message'));
    await capture(app, game, 'morogue-connected.png', screenshots, captureWarnings);
    await assert.rejects(() => page.evaluate(() => window.repoLauncher.update('morogue')), /Close the game/);
    await assert.rejects(() => game.evaluate(() => window.repoLauncher?.install('morogue') || Promise.reject(Error('No launcher authority'))), /No launcher authority/);
    const content = await game.locator('body').innerText();
    await fs.writeFile(path.join(qa, 'game-menu.txt'), content);
    console.log('Opening actual game setup');
    await game.getByRole('button', { name: 'Play', exact: true }).click();
    await game.getByRole('heading', { name: 'Mora Test', exact: true }).waitFor();
    assert.equal(await game.locator('#vs-character-name').count(), 0);
    assert.equal(await game.evaluate(() => window.__moratalesSurvivor.character.id), 'cafe-slot-0');
    await game.getByRole('button', { name: 'Endless Night', exact: true }).click();
    console.log('Starting actual Endless Night run');
    await game.getByRole('button', { name: 'Begin run', exact: true }).click();
    await wait(game, () => !document.querySelector('#vs-hud').hidden && window.__moratalesSurvivor?.game?.state.runTime >= 1);
    await capture(app, game, 'morogue-gameplay.png', screenshots, captureWarnings);
    // A simulated connection drop must block this actual installed game's runtime.
    await game.evaluate(() => dispatchEvent(new Event('offline')));
    assert.equal(await game.evaluate(() => window.MOROGUE_LAUNCHER.state.blocked), true);
    const paused = await game.evaluate(() => ({ time: window.__moratalesSurvivor.game.state.runTime, status: window.__moratalesSurvivor.game.state.status }));
    assert.equal(paused.status, 'paused');
    await game.evaluate(() => dispatchEvent(new Event('online')));
    assert.equal(await game.evaluate(() => window.MOROGUE_LAUNCHER.state.blocked), true);
    await game.evaluate(() => new Promise(resolve => setTimeout(resolve, 300)));
    assert.equal(await game.evaluate(() => window.__moratalesSurvivor.game.state.runTime), paused.time, 'offline and online events cannot advance combat before explicit reconnect');
    await game.evaluate(() => window.MOROGUE_LAUNCHER.reconnect());
    await wait(game, () => !window.MOROGUE_LAUNCHER.state.blocked);
    await game.locator('#vs-pause').click();
    await game.getByRole('button', { name: 'End this run', exact: true }).click();
    await game.getByRole('button', { name: 'End run', exact: true }).click();
    await game.getByText('Your leaderboard record is saved.', { exact: true }).waitFor();
    assert.equal(await game.evaluate(() => window.repoGameAchievements?.identity), '11111111-2222-4333-8444-555555555555');
    await app.evaluate(async () => {
      const stats = globalThis.__repoLauncherTestServices.stats, deadline = Date.now() + 12000;
      while (!stats.achievementFacts.length && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
    });
    const results = await app.evaluate(() => {
      const stats = globalThis.__repoLauncherTestServices.stats;
      return { starts: stats.starts.length, finishes: stats.finishes.length, facts: stats.achievementFacts.length, characterRequests: stats.characterRequests, lastResult: stats.finishes.at(-1) };
    });
    assert.equal(results.starts, 1); assert.equal(results.finishes, 1); assert.equal(results.lastResult.mode, undefined);
    assert.ok(results.characterRequests >= 4, 'outage, account mismatch, empty list and successful character retry all used the authenticated shared service');
    assert.ok(results.facts >= 1, 'the installed achievement runtime submits real gameplay observations to the shared account service fixture');
    assert.equal(results.lastResult.outcome, 'retired'); assert.ok(results.lastResult.activeMs >= 1000);
    await game.evaluate(() => window.MOROGUE_LAUNCHER.requestExit());
    await waitForState(page, state => state.running.length === 0);
    await page.evaluate(() => window.repoLauncher.install('morogue'));
    assert.equal((await page.evaluate(() => window.repoLauncher.getState())).library.morogue.status, 'installed');
    await app.evaluate(({ dialog }) => { dialog.showMessageBox = async () => ({ response: 1 }); });
    await page.evaluate(() => window.repoLauncher.uninstall('morogue'));
    assert.equal((await page.evaluate(() => window.repoLauncher.getState())).library.morogue.status, 'not-installed');
    // Exercise normal shutdown after queued portal/network work, rather than only
    // force-quitting in finally. The hidden fixture must not create a native dialog.
    const stopped = new Promise((resolve, reject) => {
      shutdownTimeout = setTimeout(() => reject(Error('Launcher did not close cleanly after its last game exited')), 15000);
      app.process().once('exit', code => { clearTimeout(shutdownTimeout); resolve(code); });
    });
    stopped.catch(() => {});
    await page.evaluate(() => { void window.repoLauncher.refresh().catch(() => {}); void window.repoLauncher.windowControl('close').catch(() => {}); }).catch(error => {
      if (!/closed|destroyed/i.test(error.message)) throw error;
    });
    assert.equal(await stopped, 0, 'launcher exits normally while portal requests settle');
    const diagnostics = { errors, requestFailures, serviceResults: results, gracefulExit: true, screenshots, captureWarnings };
    await fs.writeFile(path.join(qa, 'desktop-smoke.json'), JSON.stringify(diagnostics, null, 2));
    assert.equal(errors.length, 0, JSON.stringify(errors));
    console.log('Desktop smoke passed: native install, account gating, shared sign-in, real Morogue run and result submission, offline/reconnect, sandbox, explicit exit, repair.');
    console.log(JSON.stringify({ serviceResults: results }));
    console.log(JSON.stringify({ requestFailures: requestFailures.length, screenshots, captureWarnings }));
  } catch (error) {
    console.error('Integration failure:', error.message);
    for (const [index, page] of app.windows().entries()) {
      await fs.writeFile(path.join(qa, 'failure-' + index + '.json'), JSON.stringify(await bounded(page.evaluate(() => ({
        location: location.href, hidden: document.hidden, visibility: document.visibilityState,
        launcher: window.MOROGUE_LAUNCHER?.state,
        game: window.__moratalesSurvivor?.game && { status: window.__moratalesSurvivor.game.state.status, runTime: window.__moratalesSurvivor.game.state.runTime, actualTime: window.__moratalesSurvivor.game.state.actualTime },
        hud: document.querySelector('#vs-hud')?.hidden, clock: document.querySelector('#vs-clock')?.textContent
      })), 3000, 'The failed renderer did not respond.').catch(() => ({ unavailable: true })), null, 2)).catch(() => {});
      await capture(app, page, 'failure-' + index + '.png', screenshots, captureWarnings);
      await fs.writeFile(path.join(qa, 'failure-' + index + '.txt'), await page.locator('body').innerText({ timeout: 1500 }).catch(() => 'unavailable')).catch(() => {});
    }
    throw error;
  } finally {
    clearTimeout(shutdownTimeout);
    await app.evaluate(({ app }) => app.exit(0)).catch(() => {});
    await app.close().catch(() => {});
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
