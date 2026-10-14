'use strict';
// Read-only live website UI in a fresh native profile. The only writes are
// this test profile's local launcher preferences; no account is signed in.
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { _electron } = require('playwright');
const root = path.resolve(__dirname, '..'), qa = path.join(root, 'qa');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, condition, timeout = 60000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { const value = await fn(); if (condition(value)) return value; await pause(100); }
  throw Error('The launcher settings check timed out.');
}
(async () => {
  await fs.mkdir(qa, { recursive: true });
  const profile = await fs.mkdtemp(path.join(qa, 'settings-profile-'));
  const env = { ...process.env, REPO_LAUNCHER_TEST_PROFILE: profile, REPO_LAUNCHER_HIDDEN_TEST: '1' };
  delete env.ELECTRON_RUN_AS_NODE; delete env.REPO_LAUNCHER_FIXTURES;
  const results = [];
  for (const run of [0, 1]) {
    const app = await _electron.launch({ executablePath: require('electron'), args: [root, '--disable-renderer-backgrounding', '--disable-background-timer-throttling'], env });
    try {
      const shell = await app.firstWindow(); await shell.waitForFunction(() => window.repoLauncher);
      const portal = await until(async () => app.windows().find(page => /^https:\/\/(www\.)?repocompany\.uk\//.test(page.url())), Boolean);
      await portal.locator('#launcher-library-tab').waitFor({ state: 'attached', timeout: 60000 });
      await shell.evaluate(() => window.repoLauncher.navigate('account'));
      await portal.locator('#account-tab-settings').click();
      const automatic = portal.locator('#launcher-auto-update-toggle'), discord = portal.locator('#launcher-discord-toggle');
      await automatic.waitFor({ state: 'visible' }); await discord.waitFor({ state: 'visible' });
      const expected = run === 0;
      assert.equal(await automatic.getAttribute('aria-checked'), String(expected));
      assert.equal(await discord.getAttribute('aria-checked'), String(expected));
      assert.equal(await portal.evaluate(() => typeof window.repoLauncher), 'undefined');
      // Page-authored synthetic clicks cannot alter native device preferences.
      await automatic.evaluate(button => button.click()); await discord.evaluate(button => button.click()); await pause(200);
      let state = await shell.evaluate(() => window.repoLauncher.getState());
      assert.equal(state.preferences.automaticGameUpdates, expected); assert.equal(state.preferences.discordPresence, expected);
      await automatic.click();
      await until(() => shell.evaluate(() => window.repoLauncher.getState()), state => state.preferences.automaticGameUpdates === !expected);
      await discord.press('Space');
      state = await until(() => shell.evaluate(() => window.repoLauncher.getState()), state => state.preferences.discordPresence === !expected);
      await until(() => discord.getAttribute('aria-checked'), value => value === String(!expected));
      await portal.locator('#account-tab-profile').click(); await portal.locator('#account-tab-settings').click();
      await automatic.waitFor({ state: 'visible' });
      assert.equal(await automatic.getAttribute('aria-checked'), String(!expected));
      assert.equal(await discord.getAttribute('aria-checked'), String(!expected));
      const png = await app.evaluate(async ({ webContents }) => {
        const site = webContents.getAllWebContents().find(contents => /^https:\/\/(www\.)?repocompany\.uk\//.test(contents.getURL()));
        return (await site.capturePage(undefined, { stayHidden: true, stayAwake: true })).toPNG().toString('base64');
      });
      await fs.writeFile(path.join(qa, `settings-${run ? 'restart' : 'initial'}.png`), Buffer.from(png, 'base64'));
      results.push({ restarted: run === 1, preferences: state.preferences, discordStatus: state.discordPresence?.status });
    } finally { await app.close(); }
  }
  const persisted = JSON.parse(await fs.readFile(path.join(profile, 'preferences.json'), 'utf8'));
  assert.deepEqual(persisted, { version: 1, automaticGameUpdates: true, discordPresence: true });
  await fs.writeFile(path.join(qa, 'settings-result.json'), JSON.stringify({ profile, results }, null, 2));
  console.log('PASS native Settings: default-on, trusted pointer/keyboard actions, synthetic rejection, retained through website rerender and launcher restart.');
})().catch(error => { console.error(error); process.exitCode = 1; });
