'use strict';
// Actual installed MoraTales in a sandboxed Electron window. Only account/API
// services are fixtures; the game, maps, character bridge and storage are real.
const path = require('node:path');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { _electron: electron } = require('playwright');
const { validatePath } = require('../lib/manifest.cjs');
const { verifyRelease } = require('../tools/prepare-moratales.cjs');
const root = path.resolve(__dirname, '..'), qa = path.join(root, 'qa');
const wait = (page, predicate, timeout = 60000) => page.waitForFunction(predicate, null, { polling: 100, timeout });
async function poll(fn, predicate, timeout = 60000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const value = await fn(); if (predicate(value)) return value; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw Error('Native MoraTales condition timed out.');
}
async function seed(profile) {
  const release = path.join(root, 'releases/moratales');
  const manifest = JSON.parse(await fs.readFile(path.join(release, 'manifest.json'), 'utf8'));
  await verifyRelease(release, manifest);
  const installId = crypto.randomUUID(), directory = path.join(profile, 'library/games/moratales'), version = path.join(directory, 'versions', installId);
  for (const file of manifest.files) {
    validatePath(file.path); const target = path.join(version, ...file.path.split('/'));
    await fs.mkdir(path.dirname(target), { recursive: true }); await fs.link(path.join(release, 'payload', ...file.path.split('/')), target);
  }
  await fs.writeFile(path.join(directory, 'active.json'), JSON.stringify({ schemaVersion: 1, gameId: 'moratales', version: manifest.version, entry: manifest.entry, installId }));
  return { bytes: manifest.files.reduce((sum, file) => sum + file.size, 0), files: manifest.files.length, version: manifest.version };
}
async function run() {
  await fs.mkdir(qa, { recursive: true });
  const profile = await fs.mkdtemp(path.join(qa, 'moratales-profile-'));
  const diagnostics = { installMethod: 'Hardlinked verified immutable payload in isolated profile (Library streaming installs have separate tests)', errors: [], missing: [], failed: [] };
  let app, game;
  try {
    diagnostics.release = await seed(profile);
    const env = { ...process.env, REPO_LAUNCHER_FIXTURES: '1', REPO_LAUNCHER_TEST_PROFILE: profile, REPO_LAUNCHER_HIDDEN_TEST: '1' }; delete env.ELECTRON_RUN_AS_NODE;
    app = await electron.launch({ executablePath: require('electron'), args: [root, '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling'], env, timeout: 30000 });
    app.on('window', page => {
      page.on('pageerror', error => diagnostics.errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) diagnostics.missing.push({ url: response.url(), status: response.status() }); });
      page.on('requestfailed', request => diagnostics.failed.push({ url: request.url(), error: request.failure()?.errorText }));
    });
    const shell = await app.firstWindow();
    const state = await poll(() => shell.evaluate(() => window.repoLauncher?.getState()), value => value?.library.moratales?.status === 'installed');
    assert.equal(state.catalog.games.find(game => game.id === 'moratales').installable, true);
    await assert.rejects(shell.evaluate(() => window.repoLauncher.play('moratales')), /sign in/i);
    async function portalClick(id) {
      await poll(() => app.evaluate(async ({ webContents }, id) => {
        const portal = webContents.getAllWebContents().find(wc => !wc.isDestroyed() && wc.getURL().startsWith('https://repocompany.uk/'));
        return portal ? portal.executeJavaScript(`!!document.getElementById(${JSON.stringify(id)})`) : false;
      }, id), Boolean);
      await app.evaluate(async ({ webContents }, id) => {
        const portal = webContents.getAllWebContents().find(wc => !wc.isDestroyed() && wc.getURL().startsWith('https://repocompany.uk/'));
        await portal.executeJavaScript(`document.getElementById(${JSON.stringify(id)}).click()`);
      }, id);
    }
    await portalClick('sign-in'); await shell.evaluate(() => window.repoLauncher.refresh());
    await app.evaluate(() => { globalThis.__repoLauncherTestServices.stats.characterMode = 'auto'; });
    async function open() {
      const next = app.waitForEvent('window'); await shell.evaluate(() => window.repoLauncher.play('moratales')); game = await next;
      game.setDefaultTimeout(30000); await wait(game, () => window.__moratalesMenu?.active && !window.REPO_LAUNCHER_GAME?.paused);
    }
    console.log('Opening installed MoraTales and creating a new adventure'); await open();
    assert.equal(await game.evaluate(() => typeof require), 'undefined');
    assert.equal(await game.evaluate(() => localStorage.getItem('velmora-cafe')), null);
    await game.locator('#mm-new').click(); await game.locator('[data-slot="0"]').click();
    await wait(game, () => document.getElementById('intro-screen')?.hidden === false && !window.REPO_LAUNCHER_GAME?.paused);
    await game.evaluate(() => document.getElementById('intro-video').dispatchEvent(new Event('ended')));
    await game.locator('#character-name').fill('Native Mora Traveller');
    await game.locator('#explore-town').click();
    await wait(game, () => window.__velmoraTown?.active && window.__velmoraTown?.world.phase === 'ready' && window.__velmoraTown?.life, 90000);
    diagnostics.character = await game.evaluate(() => JSON.parse(localStorage.getItem('hearthfolk-appearance-v7')));
    assert.equal(diagnostics.character.name, 'Native Mora Traveller');
    console.log('Checking actual simulation pause and automatic account sync');
    await wait(game, () => window.MORATALES_ACCOUNT_CHARACTERS?.status === 'connected');
    await app.evaluate(() => { globalThis.__repoLauncherTestServices.stats.offline = true; }); await shell.evaluate(() => window.repoLauncher.refresh());
    await wait(game, () => window.REPO_LAUNCHER_GAME.paused);
    const pausedTime = await game.evaluate(() => window.__velmoraTown.calendar.total);
    await new Promise(resolve => setTimeout(resolve, 700));
    assert.equal(await game.evaluate(() => window.__velmoraTown.calendar.total), pausedTime, 'actual town simulation stays frozen while offline');
    await app.evaluate(() => { globalThis.__repoLauncherTestServices.stats.offline = false; }); await shell.evaluate(() => window.repoLauncher.refresh());
    await game.evaluate(() => window.MORATALES_DESKTOP.online()); await wait(game, () => !window.REPO_LAUNCHER_GAME.paused);
    const ended = game.waitForEvent('close'); await game.evaluate(() => { void window.REPO_LAUNCHER.requestExit(); }); await ended;
    await poll(() => shell.evaluate(() => window.repoLauncher.getState()), value => value.running.length === 0);
    diagnostics.cloud = await app.evaluate(() => { const s = globalThis.__repoLauncherTestServices.stats; return { revision: s.characterRevision, writes: s.characterWrites, characters: s.characterCloud }; });
    assert(diagnostics.cloud.revision > 0); assert.equal(diagnostics.cloud.characters[0].name, 'Native Mora Traveller');
    assert(diagnostics.cloud.writes.every(body => Object.keys(body).sort().join(',') === 'characters,revision'), 'only appearances and their optimistic revision are uploaded');
    assert(!JSON.stringify(diagnostics.cloud.writes).includes('velmora-cafe'));
    console.log('Reopening actual saved Moratales adventure'); await open();
    assert.equal(await game.evaluate(() => JSON.parse(localStorage.getItem('hearthfolk-appearance-v7')).name), 'Native Mora Traveller');
    await game.locator('#mm-load').click(); await game.locator('[data-slot="0"]').click();
    await wait(game, () => window.__velmoraTown?.active && window.__velmoraTown?.world.phase === 'ready' && window.__velmoraTown?.life, 90000);
    diagnostics.restored = await game.evaluate(() => ({ name: JSON.parse(localStorage.getItem('hearthfolk-appearance-v7')).name, area: window.__velmoraTown.world.nav.spec.id, activeSlot: VELMORA_SLOTS.getActive(localStorage) }));
    assert.equal(diagnostics.restored.name, diagnostics.character.name); assert.equal(diagnostics.restored.activeSlot, 0);
    await portalClick('sign-out'); await shell.evaluate(() => window.repoLauncher.refresh());
    await wait(game, () => window.REPO_LAUNCHER_GAME.paused && window.REPO_LAUNCHER_GAME.reason === 'signed-out');
    const last = game.waitForEvent('close'); await game.evaluate(() => { void window.REPO_LAUNCHER.requestExit(); }); await last;
    assert.deepEqual(diagnostics.errors, []);
    assert.equal(diagnostics.missing.filter(item => item.url.startsWith('https://moratales.repocompany.uk/') && !item.url.includes('/api/')).length, 0, 'all requested game assets resolve locally');
    diagnostics.passed = true; console.log('PASS Moratales native create/save/reopen, appearance sync, offline simulation pause, signed-out gate and asset closure.');
  } catch (error) {
    diagnostics.passed = false; diagnostics.failure = error.message;
    if (game && !game.isClosed()) diagnostics.runtime = await game.evaluate(() => ({ gate: document.querySelector('#repo-moratales-gate')?.innerText, state: window.REPO_LAUNCHER_GAME && { paused: REPO_LAUNCHER_GAME.paused, reason: REPO_LAUNCHER_GAME.reason }, menu: window.__moratalesMenu?.active, town: window.__velmoraTown && { active: __velmoraTown.active, phase: __velmoraTown.world.phase, save: localStorage.getItem('velmora-cafe')?.slice(0,200) }, character: window.MORATALES_ACCOUNT_CHARACTERS?.status, body: document.body.innerText.slice(-1200) })).catch(() => null);
    throw error;
  } finally {
    await fs.writeFile(path.join(qa, 'moratales-desktop.json'), JSON.stringify(diagnostics, null, 2));
    if (app) { await app.evaluate(({ app }) => app.exit(0)).catch(() => {}); await app.close().catch(() => {}); }
    const absolute = path.resolve(profile), relative = path.relative(qa, absolute);
    if (!relative.startsWith('moratales-profile-') || relative.includes(path.sep) || path.dirname(absolute) !== qa) throw Error('Refusing to remove an unexpected test profile.');
    await fs.rm(absolute, { recursive: true, force: false, maxRetries: 5, retryDelay: 500 });
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
