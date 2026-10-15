'use strict';
const fs = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'), dist = path.join(root, 'dist');
const output = path.resolve(root, '../web-game-loader-qa');
const origin = 'https://repocompany.uk';
const scripts = new Set(['dashboard-layout.js', 'dashboard-audio.js', 'dashboard-motion.js', 'game-scenes.js', 'homepage.js', 'repo-game-loader.js', 'repo-login-template.js']);
const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [], results = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.fulfill({ contentType: 'text/html', body: '<h1>Game destination</h1>' });
      const file = path.resolve(dist, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
      assert.ok(file.startsWith(dist + path.sep));
      try {
        let body = await fs.readFile(file);
        if (url.pathname === '/') {
          // Exercise the shipped page/assets; only account/backend and game
          // destinations are fixtures. No production account writes occur.
          body = body.toString().replace('data-repo-auth="loading"', 'data-repo-auth="ready"')
            .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, tag => {
              const src = tag.match(/^<script\b[^>]*\bsrc="([^"]+)"/);
              return !src || scripts.has(src[1].split('?')[0]) ? tag : '';
            });
        }
        return route.fulfill({ body, contentType: types[path.extname(file)] || 'application/octet-stream' });
      } catch (error) { if (error.code === 'ENOENT') return route.fulfill({ status: 404, body: '' }); throw error; }
    });
    const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.__sounds = []; const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () { __sounds.push(this); return play.call(this); };
      window.demoLibrary = { open() {}, close() {} };
      window.accountMenu = { open() {}, close() {} };
    });
    const selectors = { morogue: '.motion-uncrowned', moratales: '.motion-moratales', manager: '.motion-manager' };
    for (const [id, selector] of Object.entries(selectors)) {
      await page.goto(origin + '/#' + id);
      await page.waitForFunction(() => window.mountRepoGameLoader && window.mountRepoLogin);
      // A mounted login controller must not be replaced by the game controller.
      await page.evaluate(() => {
        const host=document.createElement('div');document.getElementById('repo-login').append(host);mountRepoLogin(host);window.__loginMotion = repoBrandMotion;
        const mount=mountRepoGameLoader;window.mountRepoGameLoader=host=>{const motion=mount(host);window.__introAt=Date.now();return motion;};
      });
      const start = Date.now(); await page.locator('[data-note="Play"]').click();
      await page.waitForTimeout(450);
      const disc = await page.evaluate(() => ({ speed: Number(document.getElementById('disc-spin').dataset.speed), sound: __sounds.some(a => a.dataset.sound === 'spin' && !a.paused && a.volume > 0) }));
      assert.ok(disc.speed > 100); assert.equal(disc.sound, true);
      const loader = page.locator('.game-intro'); await loader.waitFor({ state: 'visible' });
      const introAt = await page.evaluate(() => window.__introAt); assert.ok(introAt - start >= 1850);
      assert.equal(await page.locator('#launch-curtain').evaluate(el => getComputedStyle(el).opacity), '1');
      await page.waitForTimeout(1100);
      assert.equal(await loader.locator(selector).getAttribute('opacity'), '1');
      assert.equal(await page.evaluate(() => window.__loginMotion === window.repoBrandMotion), true);
      await page.screenshot({ path: path.join(output, id + '.png') });
      await page.waitForURL('https://' + id + '.repocompany.uk/**');
      const elapsed = Date.now() - start, logoElapsed = Date.now() - introAt;
      assert.ok(logoElapsed >= 5500 && logoElapsed < 8500, `${id} intro: ${logoElapsed}ms`);
      results.push({ id, elapsed, logoElapsed, disc });
    }
    // The same responsive presentation is centered on a narrow phone viewport.
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(origin + '/#manager');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-note="Play"]').click(); await page.locator('.game-intro').waitFor();
    const box = await page.locator('.game-intro .brand-loader').boundingBox();
    assert.ok(Math.abs(box.x + box.width / 2 - 195) < 1 && Math.abs(box.y + box.height / 2 - 422) < 1);
    assert.equal(await page.locator('.game-intro .motion-rest').getAttribute('opacity'), '1');
    await page.waitForTimeout(1000); assert.equal(new URL(page.url()).hostname, 'repocompany.uk');
    // Browser Back/BFCache cancels any unfinished intro and restores Play.
    await page.evaluate(() => dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    assert.equal(await page.locator('.game-intro').count(), 0);
    assert.equal(await page.locator('[data-note="Play"]').isEnabled(), true);
    await page.waitForTimeout(5000); assert.equal(new URL(page.url()).hostname, 'repocompany.uk');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, games: results, mobileReducedMotion: true, cancelledNavigation: true }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
