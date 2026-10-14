'use strict';
const path = require('node:path');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { _electron: electron } = require('playwright');
const root = path.resolve(__dirname, '..'), qa = path.join(root, 'qa');
async function poll(fn, predicate, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const value = await fn(); if (predicate(value)) return value; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw Error('Native Manager condition timed out.');
}
async function capture(app, page, name) {
  try {
    const data = await app.evaluate(async ({ webContents }, url) => {
      const wc = webContents.getAllWebContents().find(wc => !wc.isDestroyed() && wc.getURL() === url);
      return (await wc.capturePage(undefined, { stayHidden: true, stayAwake: true })).toPNG().toString('base64');
    }, page.url());
    await fs.writeFile(path.join(qa, name), Buffer.from(data, 'base64'));
  } catch (error) { console.warn('Diagnostic capture unavailable:', error.message); }
}
async function run() {
  await fs.mkdir(qa, { recursive: true });
  const profile = await fs.mkdtemp(path.join(qa, 'manager-profile-'));
  const hardlinked = process.env.REPO_MANAGER_TEST_HARDLINK === '1';
  if (hardlinked) {
    const release = path.join(root, 'releases/manager'), manifest = JSON.parse(await fs.readFile(path.join(release, 'manifest.json'))), installId = crypto.randomUUID();
    const directory = path.join(profile, 'library/games/manager'), destination = path.join(directory, 'versions', installId);
    console.log('Verifying and hardlinking immutable Manager payload for isolated native QA');
    for (const item of manifest.files) {
      const input = path.join(release, 'payload', item.path), output = path.join(destination, item.path), bytes = await fs.readFile(input);
      assert.equal(bytes.length, item.size); assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256);
      await fs.mkdir(path.dirname(output), { recursive: true }); await fs.link(input, output);
    }
    await fs.writeFile(path.join(directory, 'active.json'), JSON.stringify({ schemaVersion: 1, gameId: 'manager', installId, version: manifest.version, entry: manifest.entry }));
  }
  const env = { ...process.env, REPO_LAUNCHER_FIXTURES: '1', REPO_LAUNCHER_TEST_PROFILE: profile, REPO_LAUNCHER_HIDDEN_TEST: '1' };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ executablePath: require('electron'), args: [root, '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling'], env, timeout: 30000 });
  const errors = [], missing = [], failures = [];
  let game;
  app.on('window', page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) missing.push({ url: response.url(), status: response.status() }); });
    page.on('requestfailed', request => failures.push({ url: request.url(), failure: request.failure()?.errorText }));
  });
  async function portalClick(id) {
    await poll(() => app.evaluate(async ({ webContents }, id) => {
      const portal = webContents.getAllWebContents().find(wc => !wc.isDestroyed() && wc.getURL().startsWith('https://repocompany.uk/'));
      return portal ? portal.executeJavaScript(`!!document.getElementById(${JSON.stringify(id)})`).catch(() => false) : false;
    }, id), ready => ready);
    await app.evaluate(async ({ webContents }, id) => {
      const portal = webContents.getAllWebContents().find(wc => !wc.isDestroyed() && wc.getURL().startsWith('https://repocompany.uk/'));
      await portal.executeJavaScript(`document.getElementById(${JSON.stringify(id)}).click()`);
    }, id);
  }
  async function open(shell) {
    const next = app.waitForEvent('window');
    await shell.evaluate(() => window.repoLauncher.play('manager'));
    const page = await next; page.setDefaultTimeout(20000);
    return page;
  }
  const diagnostics = { installMethod: hardlinked ? 'Every immutable payload file size/SHA256 verified then hardlinked into a new isolated library with correct active pointer; earlier native run covered real Library.install' : 'Actual Library.install using prepared immutable manifest; separate test profile; no production requests', errors, missing, failures };
  try {
    const shell = await app.firstWindow(); shell.setDefaultTimeout(20000);
    await poll(() => shell.evaluate(() => window.repoLauncher?.getState()), value => value?.catalog.games.find(game => game.id === 'manager')?.installable);
    if (!hardlinked) { console.log('Installing actual Manager payload into isolated test profile'); await shell.evaluate(() => window.repoLauncher.install('manager')); }
    assert.equal((await shell.evaluate(() => window.repoLauncher.getState())).library.manager.status, 'installed');
    await assert.rejects(shell.evaluate(() => window.repoLauncher.play('manager')), /sign in/i);
    await portalClick('sign-in'); await shell.evaluate(() => window.repoLauncher.refresh());
    await app.evaluate(() => { globalThis.__repoLauncherTestServices.stats.managerCloudMode = 'outage'; });
    game = await open(shell);
    await game.waitForFunction(() => !!document.querySelector('#repo-manager-gate') && document.querySelector('#repo-manager-gate [data-detail]').textContent.includes('could not be checked'));
    assert.equal(await game.evaluate(() => typeof window.REPO_MANAGER_CAREER), 'undefined', 'cloud startup failure cannot start an empty guest career');
    await app.evaluate(() => { globalThis.__repoLauncherTestServices.stats.managerCloudMode = 'ready'; });
    await game.locator('#repo-manager-gate [data-retry]').click();
    await game.waitForFunction(() => !!window.REPO_MANAGER_CAREER && !window.REPO_MANAGER_LAUNCHER.paused, null, { timeout: 45000 });
    assert.equal(await game.evaluate(() => typeof require), 'undefined');
    assert.equal(await game.evaluate(() => window.VelmoraCloudSaveManager.user().id), '11111111-2222-4333-8444-555555555555');
    await capture(app, game, 'manager-connected.png');
    console.log('Creating a real Manager career through the installed game UI');
    await game.locator('#btnNewCareer').click();
    await game.locator('[data-career-new-slot="1"]').click();
    await game.locator('#careerModeManager').click();
    await game.locator('#managerNameInput').fill('Native Career Test');
    await game.locator('[data-manager-stage="3"]').click();
    await game.locator('#managerContinue').click();
    await game.locator('#careerPathUnemployed').click();
    await game.waitForFunction(() => !!window.VelmoraCareerStore.getItem('velmora-manager-career-v32-slot-1'), null, { timeout: 45000 });
    await game.evaluate(async () => { await window.REPO_MANAGER_CAREER.save(); await window.VelmoraCloudSaveManager.flush(); });
    const career = await game.evaluate(() => {
      const raw = window.VelmoraCareerStore.getItem('velmora-manager-career-v32-slot-1'), data = JSON.parse(window.VelmoraSaveCodec.decode(raw));
      return { worldSeed: data.worldSeed, name: data.manager.identity.name, date: data.careerTime.currentDate, bytes: raw.length, storage: window.VelmoraCareerStore.status() };
    });
    assert.equal(career.name, 'Native Career Test'); assert.ok(career.bytes > 10000); assert.equal(career.storage.mode, 'indexeddb');
    diagnostics.career = career;
    await capture(app, game, 'manager-career.png');
    const cloud = await app.evaluate(() => {
      const s = globalThis.__repoLauncherTestServices.stats; return { reads: s.managerReads, writes: s.managerWrites, uploads: s.managerUploads, rows: s.managerRows.map(row => ({ userId: row.user_id, slot: row.slot, bytes: row.save_bytes, metadata: row.metadata })) };
    });
    assert.ok(cloud.writes >= 1); assert.ok(cloud.uploads >= 1); assert.equal(cloud.rows[0].metadata.manager, career.name);
    console.log('Testing real offline gate and deliberate reconnect');
    await app.evaluate(() => { globalThis.__repoLauncherTestServices.stats.offline = true; });
    await shell.evaluate(() => window.repoLauncher.refresh());
    await game.waitForFunction(() => window.REPO_MANAGER_LAUNCHER.paused);
    await app.evaluate(() => { globalThis.__repoLauncherTestServices.stats.offline = false; });
    await shell.evaluate(() => window.repoLauncher.refresh());
    assert.equal(await game.evaluate(() => window.REPO_MANAGER_LAUNCHER.paused), true);
    await game.locator('#repo-manager-gate [data-retry]').click();
    await game.waitForFunction(() => !window.REPO_MANAGER_LAUNCHER.paused);
    const closed = game.waitForEvent('close');
    await game.evaluate(() => { void window.REPO_LAUNCHER.requestExit(); }); await closed;
    await poll(() => shell.evaluate(() => window.repoLauncher.getState()), state => state.running.length === 0);
    console.log('Reopening saved Manager career');
    game = await open(shell);
    await game.waitForFunction(() => !!window.REPO_MANAGER_CAREER && !window.REPO_MANAGER_LAUNCHER.paused, null, { timeout: 45000 });
    const restored = await game.evaluate(() => JSON.parse(window.VelmoraSaveCodec.decode(window.VelmoraCareerStore.getItem('velmora-manager-career-v32-slot-1'))));
    assert.equal(restored.worldSeed, career.worldSeed); assert.equal(restored.manager.identity.name, career.name);
    await game.locator('#btnContinue').click();
    await game.waitForFunction(() => document.body.innerText.includes('Native Career Test'));
    await portalClick('sign-out'); await shell.evaluate(() => window.repoLauncher.refresh());
    await game.waitForFunction(() => window.REPO_MANAGER_LAUNCHER.paused && document.querySelector('#repo-manager-gate [data-retry]').hidden);
    assert.equal(await game.evaluate(() => document.querySelector('#repo-manager-gate h1').textContent), 'Return to your library');
    await capture(app, game, 'manager-account-gate.png');
    const ended = game.waitForEvent('close'); await game.evaluate(() => { void window.REPO_LAUNCHER.requestExit(); }); await ended;
    diagnostics.service = await app.evaluate(() => { const s = globalThis.__repoLauncherTestServices.stats; return { reads: s.managerReads, writes: s.managerWrites, uploads: s.managerUploads, downloads: s.managerDownloads, rows: s.managerRows.length }; });
    assert.ok(diagnostics.service.reads > cloud.reads); assert.ok(diagnostics.service.downloads >= 1);
    diagnostics.passed = true;
    console.log('Manager native smoke passed:', JSON.stringify({ career, service: diagnostics.service, errors, missing, failures }));
  } catch (error) {
    diagnostics.passed = false; diagnostics.failure = error.message;
    if (game && !game.isClosed()) {
      await fs.writeFile(path.join(qa, 'manager-failure.txt'), await game.locator('body').innerText({ timeout: 2000 }).catch(() => 'unavailable'));
      await capture(app, game, 'manager-failure.png');
      diagnostics.runtime = await game.evaluate(() => ({ gate: document.querySelector('#repo-manager-gate')?.innerText, cloud: window.VelmoraCloudSaveManager?.status(), storage: window.VelmoraCareerStore?.status(), launcher: typeof window.REPO_MANAGER_LAUNCHER, native: Object.keys(window.REPO_LAUNCHER || {}) })).catch(() => null);
    }
    throw error;
  } finally {
    await fs.writeFile(path.join(qa, 'manager-desktop.json'), JSON.stringify(diagnostics, null, 2));
    await app.evaluate(({ app }) => app.exit(0)).catch(() => {}); await app.close().catch(() => {});
    const absolute = path.resolve(profile), relative = path.relative(qa, absolute);
    if (!relative.startsWith('manager-profile-') || relative.includes(path.sep) || path.dirname(absolute) !== qa) throw Error('Refusing to remove an unexpected test profile.');
    await fs.rm(absolute, { recursive: true, force: false, maxRetries: 5, retryDelay: 500 });
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
