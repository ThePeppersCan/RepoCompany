'use strict';
const fs = require('node:fs/promises'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const { _electron: electron } = require('playwright');
const { validatePath } = require('../lib/manifest.cjs');
const desktop = path.resolve(__dirname, '..');
const releases = { morogue: process.argv[2], moratales: process.argv[3] };
const output = path.resolve(process.env.REPO_PRESENTATION_OUTPUT || path.join(desktop, '../../launch-presentation-qa'));
async function poll(fn, accept, timeout = 30000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const value = await fn(); if (accept(value)) return value; await new Promise(r => setTimeout(r, 80)); }
  throw Error('Timed out waiting for launcher presentation.');
}
async function compositor(page) {
  const cdp = await page.context().newCDPSession(page);
  cdp.on('Page.screencastFrame', f => void cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}));
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 20, maxWidth: 640, maxHeight: 360 });
}
(async () => {
  await fs.mkdir(output, { recursive: true }); const profile = await fs.mkdtemp(path.join(output, 'profile-'));
  for (const [id, release] of Object.entries(releases)) {
    assert.ok(release && path.isAbsolute(release), 'Pass absolute Morogue and Moratales release directories.');
    const manifest = JSON.parse(await fs.readFile(path.join(release, 'manifest.json'))), installId = crypto.randomUUID();
    const directory = path.join(profile, 'library/games', id), version = path.join(directory, 'versions', installId);
    for (const file of manifest.files) {
      validatePath(file.path); const source = path.join(release, 'payload', file.path), target = path.join(version, file.path);
      const bytes = await fs.readFile(source); assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
      await fs.mkdir(path.dirname(target), { recursive: true }); await fs.link(source, target);
    }
    await fs.writeFile(path.join(directory, 'active.json'), JSON.stringify({ schemaVersion: 1, gameId: id, version: manifest.version, entry: manifest.entry, installId }));
  }
  await fs.writeFile(path.join(profile, 'preferences.json'), JSON.stringify({ version: 1, automaticGameUpdates: false, discordPresence: false }));
  const env = { ...process.env, REPO_LAUNCHER_FIXTURES: '1', REPO_LAUNCHER_TEST_PROFILE: profile, REPO_LAUNCHER_HIDDEN_TEST: '1', REPO_LAUNCHER_TEST_MOROGUE_RELEASE: releases.morogue };
  delete env.ELECTRON_RUN_AS_NODE;
  const report = { errors: [], games: [] }; let app;
  try {
    app = await electron.launch({ executablePath: process.env.REPO_ELECTRON || require('electron'), args: [path.join(__dirname, 'fixtures/presentation.cjs'), '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling'], env });
    app.on('window', page => page.on('pageerror', error => report.errors.push(error.message)));
    const shell = await app.firstWindow(); await compositor(shell);
    await shell.waitForFunction(()=>window.repoLauncher);
    await shell.evaluate(()=>{window.__introTimes={};repoLauncher.onState(s=>{const game=s.activeGame;if(!game)return;const time=__introTimes[game.id]||(__introTimes[game.id]={});if(game.loading&&!time.start)time.start=Date.now();if(!game.loading&&!time.finish)time.finish=Date.now();});});
    const portal = await poll(() => Promise.resolve(app.context().pages().find(p => p.url().startsWith('https://repocompany.uk'))), Boolean);
    await compositor(portal); await portal.waitForFunction(() => document.documentElement.dataset.repoLaunchPresentation === '1' && window.repoAccount);
    await portal.evaluate(() => document.getElementById('sign-in').click()); await shell.evaluate(() => repoLauncher.refresh());
    for (const id of ['morogue', 'moratales']) {
      await portal.evaluate(id => { history.replaceState({}, '', '#' + id); dispatchEvent(new PopStateEvent('popstate')); }, id);
      await portal.waitForFunction(id => document.querySelector('[data-note="Play"]').dataset.launcherCta === id, id);
      // Moratales starts from Library to cover both entry points.
      if (id === 'moratales') { await portal.evaluate(() => accountMenu.open()); await portal.locator('#launcher-library-tab').click(); }
      const button = id === 'morogue' ? portal.locator('[data-note="Play"]') : portal.locator('[data-launcher-action="play"][data-game-id="moratales"]');
      const started = Date.now(); await button.click();
      await portal.waitForFunction(() => document.getElementById('dashboard').dataset.launching === 'true');
      await new Promise(r => setTimeout(r, 450));
      assert.equal((await shell.evaluate(() => repoLauncher.getState())).activeGame, null, 'Disc plays before the native game opens.');
      const disc = await portal.evaluate(() => ({ speed: Number(document.getElementById('disc-spin').dataset.speed), sound: __sounds.some(s => s.sound === 'spin' && !s.audio.paused && s.audio.volume > 0) }));
      assert.ok(disc.speed > 100); assert.equal(disc.sound, true);
      await portal.screenshot({ path: path.join(output, id + '-disc.png') });
      await poll(() => shell.evaluate(() => repoLauncher.getState()), s => s.activeGame?.loading);
      const game = await poll(() => Promise.resolve(app.context().pages().find(p => p.url().startsWith('https://' + id + '.repocompany.uk'))), Boolean);
      await compositor(game);
      await new Promise(r => setTimeout(r, 1400));
      assert.equal((await shell.evaluate(() => repoLauncher.getState())).gameVisible, false);
      await shell.screenshot({ path: path.join(output, id + '-logo.png') });
      await poll(() => shell.evaluate(() => repoLauncher.getState()), s => s.activeGame?.id === id && !s.activeGame.loading);
      const timing=await poll(()=>shell.evaluate(id=>__introTimes[id],id),time=>time?.finish);
      const elapsed = Date.now() - started, logoElapsed = timing.finish - timing.start;
      assert.ok(elapsed >= 7400 && elapsed < 13000, 'Disc followed by two logo loops.');
      assert.ok(logoElapsed >= 5300 && logoElapsed < 9500);
      await game.waitForFunction(id => id === 'morogue' ? !!window.__moratalesSurvivor : !!window.__moratalesMenu?.active, id);
      const timeline = await portal.evaluate(() => __launchTimeline.slice(-2));
      assert.equal(timeline[1].curtain, '1'); assert.ok(timeline[1].at - timeline[0].at >= 1850);
      await app.evaluate(({ dialog }, id) => { dialog.showMessageBox = async () => { if (id === 'morogue') throw Error('Unexpected Morogue exit dialog'); return { response: 1 }; }; }, id);
      await shell.evaluate(() => repoLauncher.exitGame());
      await poll(() => shell.evaluate(() => repoLauncher.getState()), s => !s.activeGame);
      assert.equal(await portal.evaluate(() => !!document.getElementById('dashboard').dataset.launching), false);
      report.games.push({ id, elapsed, logoElapsed, disc, timeline });
    }
    assert.deepEqual(report.errors, []); report.passed = true; console.log(JSON.stringify(report));
  } catch (error) {
    report.failure = error.message;
    if(app)report.pages=await Promise.all(app.context().pages().map(async p=>({url:p.url(),state:await p.evaluate(()=>({text:document.body.innerText.slice(0,600),presentation:document.documentElement.dataset.repoLaunchPresentation,auth:!!window.repoAccount})).catch(()=>null)})));
    throw error;
  }
  finally { await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); await app?.evaluate(({ app }) => app.exit(0)).catch(() => {}); await app?.close().catch(() => {}); }
})().catch(error => { console.error(error); process.exitCode = 1; });
