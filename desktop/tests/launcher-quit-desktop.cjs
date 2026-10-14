'use strict';
// Actual Electron quit-event regression in isolated empty fixture profiles.
// The installer handoff is replaced only inside this test process; no installer
// is downloaded, spawned, or applied to the user's installed application.
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { _electron } = require('playwright');
const root = path.resolve(__dirname, '..'), qa = path.join(root, 'qa');

(async () => {
  await fs.mkdir(qa, { recursive: true });
  const results = [];
  for (const mode of ['unconfigured', 'delayed-handoff', 'failed-handoff']) {
    const profile = await fs.mkdtemp(path.join(qa, 'launcher-quit-'));
    const env = { ...process.env, REPO_LAUNCHER_TEST_PROFILE: profile, REPO_LAUNCHER_FIXTURES: '1', REPO_LAUNCHER_HIDDEN_TEST: '1' };
    delete env.ELECTRON_RUN_AS_NODE;
    const application = await _electron.launch({ executablePath: require('electron'), args: [root], env });
    const child = application.process();
    let timeout;
    try {
      const shell = await application.firstWindow();
      await shell.waitForFunction(() => window.repoLauncher);
      await application.evaluate(({ app, BrowserWindow, webContents }, mode) => {
        if (app.isPackaged || !process.env.REPO_LAUNCHER_TEST_PROFILE) throw Error('An isolated development profile is required.');
        const fs = process.mainModule.require('node:fs');
        const tracePath = process.mainModule.require('node:path').join(app.getPath('userData'), 'quit-events.json');
        const events = [];
        function record(event) { events.push(event); fs.writeFileSync(tracePath, JSON.stringify(events)); }
        for (const event of ['before-quit', 'will-quit', 'quit']) app.on(event, e => record({ event, prevented: e.defaultPrevented }));
        if (mode === 'unconfigured') return;
        const { LauncherUpdater } = process.mainModule.require(app.getAppPath() + '/lib/updater.cjs');
        LauncherUpdater.prototype.applyOnQuit = async function (options) {
          record({ event: 'apply-start', restart: options.restart, windows: BrowserWindow.getAllWindows().length });
          await new Promise(resolve => setTimeout(resolve, 75));
          record({ event: 'contents-settled', count: webContents.getAllWebContents().length });
          if (mode === 'failed-handoff') { record({ event: 'apply-failed' }); throw Error('Fixture installer handoff failed.'); }
          record({ event: 'apply-settled' });
          // Mirrors electron-updater's deferred quit without running any installer.
          setImmediate(() => app.quit());
          return true;
        };
      }, mode);
      const exited = new Promise((resolve, reject) => {
        timeout = setTimeout(() => reject(Error(mode + ': launcher did not quit')), 15000);
        child.once('exit', code => { clearTimeout(timeout); resolve(code); });
      });
      exited.catch(() => {});
      await shell.evaluate(() => window.repoLauncher.windowControl('close')).catch(error => {
        if (!/closed|destroyed/i.test(error.message)) throw error;
      });
      assert.equal(await exited, 0, mode + ': normal shutdown exits successfully');
      const events = JSON.parse(await fs.readFile(path.join(profile, 'quit-events.json'), 'utf8'));
      assert.equal(events.filter(event => event.event === 'quit').length, 1);
      assert.equal(events.filter(event => event.event === 'will-quit' && !event.prevented).length, 1);
      if (mode !== 'unconfigured') {
        const applying = events.filter(event => event.event === 'apply-start');
        assert.equal(applying.length, 1, 'recursive installer quit must not reapply');
        assert.deepEqual(applying[0], { event: 'apply-start', restart: false, windows: 0 });
        assert.equal(events.find(event => event.event === 'contents-settled').count, 0, 'detached website contents finish closing before the delayed handoff');
      }
      results.push({ mode, profile, events });
    } finally {
      clearTimeout(timeout);
      if (child.exitCode === null) await application.evaluate(({ app }) => app.exit(99)).catch(() => {});
    }
  }
  await fs.writeFile(path.join(qa, 'launcher-quit-desktop.json'), JSON.stringify(results, null, 2));
  console.log('PASS native quit: unconfigured, delayed installer handoff, failed handoff; one final quit after all native contents close.');
})().catch(error => { console.error(error); process.exitCode = 1; });
