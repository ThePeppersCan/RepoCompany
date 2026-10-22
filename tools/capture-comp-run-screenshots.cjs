#!/usr/bin/env node
'use strict';

// Manual Windows/GPU handoff. This tool does not install a browser, build the
// game, edit its files or UI, fabricate screenshots, or publish anything.
// It uses the existing repository Playwright dev dependency and an installed
// stable Edge/Chrome. All captures are normal, paused in-engine openings.
const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');

const EXPECTED = Object.freeze({
  "version": "2.4.1",
  "gameFiles": 144,
  "gameBytes": 48078902,
  "gameSha256": "ed796fd0502ca0cce099983d65dc4318a12216baf3060fe83193ee3962641d0c",
  "distFiles": 148,
  "distSha256": "034344d87da88d5048a787330aa3b593960a03611268a366f1ea0a18d6bce1b0"
});
const FINGERPRINT = 'SHA256 of sorted UTF-8 path + TAB + byte length + TAB + SHA256 + LF';
const VIEWPORT = Object.freeze({ width: 1920, height: 1080 });
const SHOTS = Object.freeze([
  { id: 'playdate', title: 'The Last Playdate', seconds: 13, duration: 32, filename: 'playdate.png' },
  { id: 'small-hours', title: 'The Small Hours', seconds: 12, duration: 32, filename: 'small-hours.png' },
  { id: 'final-curtain', title: 'The Final Curtain', seconds: 2, duration: 20, filename: 'final-curtain.png' }
]);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.txt': 'text/plain; charset=utf-8'
};
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const check = (condition, message) => { if (!condition) throw Error(message); };
const contained = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative);
};

function usage() {
  return `Capture genuine COMP-RUN ${EXPECTED.version} in-engine opening screenshots.

Run manually on Windows with working GPU/WebGL, installed Edge or Chrome,
Node.js 24+, and this repository's existing Playwright dev dependency.
Keep the browser foreground and do not use its controls during capture.
No dependency or browser installation is performed by this tool.

  node tools/capture-comp-run-screenshots.cjs --game-dir "C:\\Games\\COMP-RUN\\native\\payload" --browser msedge
  node tools/capture-comp-run-screenshots.cjs --game-dir ".\\native\\payload" --browser chrome --output ".\\capture-review"

Options:
  --game-dir PATH   Exact 2.4.1 runtime directory containing index.html.
                    Default: ./native/payload, relative to the current folder.
                    The exact original dist (including downloads/) also works.
  --output PATH     NEW review folder. Default: ./capture-review/comp-run-2.4.1
  --browser NAME    Installed browser channel: msedge (default) or chrome.
                    COMP_RUN_CAPTURE_BROWSER may also specify this choice.
  --help            Show this help without opening a browser.

On success: playdate.png, small-hours.png, final-curtain.png and
screenshot-provenance.json. PNGs are untouched Playwright screenshots with
the game's normal UI visible. They are opening captures, not completed runs.
The output folder is created only after all three captures and source checks
pass. Review the images before adding them to the homepage/launcher gallery.
After copying approved PNGs to original-case-assets/comp-run/screenshots, run:
  node tools/test-comp-run-integration.cjs --require-screenshots
On failure: nonzero exit, no completed screenshot set, no placeholder images.
`;
}

function options(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--help' || key === '-h') return { help: true };
    check(['--game-dir', '--output', '--browser'].includes(key), 'Unknown option: ' + key);
    check(argv[i + 1] && !argv[i + 1].startsWith('--'), 'Missing value for ' + key);
    check(values[key] === undefined, 'Repeated option: ' + key);
    values[key] = argv[++i];
  }
  const browser = values['--browser'] || process.env.COMP_RUN_CAPTURE_BROWSER || 'msedge';
  check(['msedge', 'chrome'].includes(browser), '--browser must be msedge or chrome (an already installed stable browser).');
  return {
    gameDir: path.resolve(values['--game-dir'] || path.join('native', 'payload')),
    output: path.resolve(values['--output'] || path.join('capture-review', 'comp-run-' + EXPECTED.version)),
    browser
  };
}

async function exists(file) {
  try { await fsp.lstat(file); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

async function prospectiveRealPath(file) {
  const tail = [];
  let ancestor = file;
  while (!await exists(ancestor)) {
    tail.unshift(path.basename(ancestor));
    const parent = path.dirname(ancestor);
    check(parent !== ancestor, 'Cannot resolve output path: ' + file);
    ancestor = parent;
  }
  return path.join(await fsp.realpath(ancestor), ...tail);
}

async function snapshot(directory) {
  const entries = [], buffers = new Map();
  let bytes = 0;
  async function walk(folder, prefix = '') {
    for (const item of await fsp.readdir(folder, { withFileTypes: true })) {
      const relative = prefix ? prefix + '/' + item.name : item.name;
      check(!item.isSymbolicLink(), 'Linked source path is not accepted: ' + relative);
      if (item.isDirectory()) await walk(path.join(folder, item.name), relative);
      else {
        check(item.isFile(), 'Unsupported source entry: ' + relative);
        const payload = await fsp.readFile(path.join(folder, item.name));
        bytes += payload.length;
        check(entries.length < 500 && bytes <= 200 * 1024 * 1024, 'Source is larger than this release; check --game-dir.');
        buffers.set(relative, payload);
        entries.push({ path: relative, bytes: payload.length, sha256: sha256(payload) });
      }
    }
  }
  await walk(directory);
  entries.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const fingerprint = files => sha256(files.map(file => `${file.path}\t${file.bytes}\t${file.sha256}\n`).join(''));
  const runtime = entries.filter(file => !file.path.startsWith('downloads/'));
  const result = { entries, buffers, bytes, fingerprint: fingerprint(entries), runtimeFingerprint: fingerprint(runtime) };
  check(runtime.length === EXPECTED.gameFiles && runtime.reduce((sum, file) => sum + file.bytes, 0) === EXPECTED.gameBytes && result.runtimeFingerprint === EXPECTED.gameSha256,
    'This is not the exact reviewed 2.4.1 runtime. No screenshots will be produced. Use the unchanged native/payload or original dist folder.');
  if (entries.length !== runtime.length) check(entries.length === EXPECTED.distFiles && result.fingerprint === EXPECTED.distSha256,
    'The runtime is correct, but extra/download files differ from the reviewed full dist. Use the exact native/payload or full dist folder.');
  const version = /export\s+const\s+VERSION\s*=\s*['"]([^'"]+)['"]/.exec(buffers.get('race.js').toString('utf8'))?.[1];
  check(version === EXPECTED.version, 'Runtime VERSION does not match 2.4.1.');
  return result;
}

async function serve(snapshotData) {
  const requests = [];
  const server = http.createServer((request, response) => {
    const fail = (status, message) => { response.writeHead(status, { 'Content-Type': 'text/plain' }); response.end(message); };
    if (!['GET', 'HEAD'].includes(request.method)) return fail(405, 'Read-only capture server.');
    let relative;
    try { relative = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname).replace(/^\/+/, '') || 'index.html'; }
    catch { return fail(400, 'Invalid path.'); }
    const bytes = snapshotData.buffers.get(relative);
    if (!bytes) { requests.push({ path: relative, status: 404 }); return fail(404, 'Not found.'); }
    let start = 0, end = bytes.length - 1, status = 200;
    const headers = { 'Content-Type': MIME[path.extname(relative).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
    if (request.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (!match || !match[1] && !match[2]) return fail(416, 'Unsupported byte range.');
      if (!match[1]) start = Math.max(0, bytes.length - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || end >= bytes.length) return fail(416, 'Invalid byte range.');
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${bytes.length}`;
    }
    headers['Content-Length'] = end - start + 1;
    requests.push({ path: relative, status, bytes: end - start + 1 });
    response.writeHead(status, headers);
    response.end(request.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1));
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { server, requests, url: `http://127.0.0.1:${server.address().port}/` };
}

async function gameState(page) {
  return page.evaluate(() => {
    const visible = id => { const element = document.getElementById(id); return !!element && !element.classList.contains('hidden') && element.getClientRects().length > 0; };
    const text = id => document.getElementById(id)?.textContent?.trim() || '';
    const canvas = document.getElementById('game');
    // Only inspect the context after successful game initialization. Do not
    // create a substitute renderer or intercept the game's rendering methods.
    const gl = window.compRunReady === true && canvas ? canvas.getContext('webgl2') : null;
    const extension = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      ready: window.compRunReady === true, unsupported: visible('unsupported'), unsupportedNote: text('unsupported-note'),
      selected: text('selected-course-note'), openingVisible: visible('opening'), openingTitle: text('opening-title'),
      openingProgress: parseFloat(document.getElementById('opening-bar')?.style.width) || 0,
      openingTimeLabel: text('opening-time'), pauseButton: text('opening-pause'), caption: text('opening-caption'),
      menuVisible: visible('menu'), resultVisible: visible('result'), pauseVisible: visible('pause'),
      renderer: gl ? {
        context: 'webgl2', lost: gl.isContextLost(), width: gl.drawingBufferWidth, height: gl.drawingBufferHeight,
        vendor: gl.getParameter(extension ? extension.UNMASKED_VENDOR_WEBGL : gl.VENDOR),
        renderer: gl.getParameter(extension ? extension.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
        version: gl.getParameter(gl.VERSION), shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
      } : null
    };
  });
}

function requireRenderer(state) {
  check(!state.unsupported, 'Game renderer failed: ' + state.unsupportedNote);
  check(state.ready && state.renderer && !state.renderer.lost && state.renderer.width > 0 && state.renderer.height > 0, 'The actual game WebGL renderer is not ready or its context was lost.');
  check(!/swiftshader|llvmpipe|software rasterizer|microsoft basic render/i.test(state.renderer.renderer),
    'The browser is using a software renderer. Enable hardware acceleration and run this capture on a working Windows GPU.');
}

async function inspectScreenshot(page, png) {
  // Read-only pixel check of the captured PNG. The output image is never
  // processed or replaced; this temporary 2D canvas is not added to the page.
  return page.evaluate(async base64 => {
    const image = new Image(); image.src = 'data:image/png;base64,' + base64; await image.decode();
    const sample = document.createElement('canvas'); sample.width = 96; sample.height = 54;
    const context = sample.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, image.width * .15, image.height * .2, image.width * .7, image.height * .55, 0, 0, 96, 54);
    const pixels = context.getImageData(0, 0, 96, 54).data, colors = new Set();
    let minimum = 255, maximum = 0, visible = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const light = .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2];
      minimum = Math.min(minimum, light); maximum = Math.max(maximum, light); if (light > 8) visible++;
      colors.add((pixels[i] >> 3) << 10 | (pixels[i + 1] >> 3) << 5 | pixels[i + 2] >> 3);
    }
    return { width: image.width, height: image.height, centralSceneColors: colors.size,
      centralSceneMinimumLuminance: minimum, centralSceneMaximumLuminance: maximum, centralSceneVisibleFraction: visible / (pixels.length / 4) };
  }, png.toString('base64'));
}

async function capture(browser, url, shot) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1, locale: 'en-GB', reducedMotion: 'no-preference', acceptDownloads: false });
  const page = await context.newPage(), errors = [], consoleMessages = [], failedResources = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) consoleMessages.push({ type: message.type(), text: message.text() }); });
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(url) && !response.url().endsWith('/favicon.ico')) failedResources.push({ url: response.url(), status: response.status() }); });
  page.on('requestfailed', request => {
    const reason = request.failure()?.errorText || 'network request failed';
    if (request.url().startsWith(url) && !/ERR_ABORTED/.test(reason)) failedResources.push({ url: request.url(), status: reason });
  });
  await page.route('**/*', route => {
    if (route.request().url().startsWith(url) || /^(data|blob):/.test(route.request().url())) return route.continue();
    if(route.request().url().startsWith('https://repocompany.uk/game-achievements-bridge.html?'))return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Offline capture</title>'});
    failedResources.push({ url: route.request().url(), status: 'unexpected-external-request' }); return route.abort();
  });
  try {
    await page.bringToFront();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('#skip-brand').click({ timeout: 15000 });
    await page.waitForFunction(() => window.compRunReady === true || !document.getElementById('unsupported')?.classList.contains('hidden'), null, { timeout: 60000 });
    requireRenderer(await gameState(page));
    await page.locator('#choose-run').click();
    await page.locator(`[data-course="${shot.id}"]`).click();
    await page.waitForFunction(({ id, title }) => document.querySelector(`[data-course="${id}"]`)?.getAttribute('aria-pressed') === 'true' && document.getElementById('selected-course-note')?.textContent.includes(title), shot, { timeout: 15000 });
    await page.locator('#start-run').click();
    const target = shot.seconds / shot.duration * 100;
    await page.waitForFunction(({ title, target }) => {
      const opening = document.getElementById('opening');
      return opening && !opening.classList.contains('hidden') && document.getElementById('opening-title')?.textContent.trim() === title.toUpperCase() && parseFloat(document.getElementById('opening-bar')?.style.width) >= target;
    }, { title: shot.title, target }, { timeout: 60000 });
    // Escape is the game's ordinary opening pause control and releases the
    // pointer lock. Do not set any game state or change any DOM/CSS ourselves.
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('opening-pause')?.textContent.trim() === 'CONTINUE', null, { timeout: 5000 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const before = await gameState(page); requireRenderer(before);
    check(before.openingVisible && before.openingTitle === shot.title.toUpperCase() && before.pauseButton === 'CONTINUE' && before.openingProgress >= target && before.openingProgress < 90,
      'The requested opening is not paused at the expected capture point: ' + shot.title);
    check(!before.menuVisible && !before.resultVisible && !before.pauseVisible, 'A menu, result or game-pause dialog obscures the requested scene.');
    const png = await page.screenshot({ type: 'png', fullPage: false, animations: 'allow', omitBackground: false });
    const after = await gameState(page); requireRenderer(after);
    check(after.openingVisible && after.openingTitle === before.openingTitle && after.openingProgress === before.openingProgress && after.pauseButton === 'CONTINUE', 'The opening changed during capture.');
    const pixels = await inspectScreenshot(page, png);
    check(pixels.width === VIEWPORT.width && pixels.height === VIEWPORT.height && pixels.centralSceneColors >= 12 && pixels.centralSceneMaximumLuminance - pixels.centralSceneMinimumLuminance >= 8 && pixels.centralSceneVisibleFraction >= .02,
      'The captured central game scene is blank or too uniform to validate. No screenshot set will be saved.');
    const rendererErrors = consoleMessages.filter(message => message.type === 'error' && /webgl|context lost|shader|startup failed|renderer/i.test(message.text));
    check(errors.length === 0 && rendererErrors.length === 0 && failedResources.length === 0, 'The game reported script, renderer or asset errors: ' + JSON.stringify({ errors, rendererErrors, failedResources }));
    return { png, record: {
      file: shot.filename, galleryFile: 'comp-run/screenshots/' + shot.filename, caption: shot.title,
      alt: shot.title + ' in-engine opening in COMP-RUN 2.4.1, captured with its normal game UI visible.',
      courseId: shot.id, captureKind: 'in-engine opening, paused using the ordinary Escape control',
      uiModified: false, gameStateInjected: false, capturedAt: new Date().toISOString(),
      sha256: sha256(png), bytes: png.length, pixels, gameUI: before, consoleMessages
    } };
  } catch (error) {
    const state = await gameState(page).catch(() => null);
    throw Error(shot.title + ': ' + error.message + '\nGame diagnostic: ' + JSON.stringify({ state, errors, failedResources }));
  } finally { await context.close(); }
}

async function main() {
  const args = options(process.argv.slice(2));
  if (args.help) { console.log(usage()); return; }
  check(process.platform === 'win32', 'Run this handoff helper on Windows with installed Edge/Chrome and working GPU/WebGL. No alternative browser will be installed.');
  check(Number(process.versions.node.split('.')[0]) >= 24, 'This repository requires Node.js 24 or newer.');
  args.gameDir = await fsp.realpath(args.gameDir);
  args.output = await prospectiveRealPath(args.output);
  check(!contained(args.gameDir, args.output) && !contained(args.output, args.gameDir), '--output must be separate from the unchanged game directory.');
  check(!await exists(args.output), 'Output already exists. Choose a new review folder; existing captures are never overwritten.');
  let playwright, playwrightVersion;
  try { playwright = require('playwright'); playwrightVersion = require('playwright/package.json').version; }
  catch { throw Error('The repository Playwright dev dependency is not available. Use a prepared RepoCompany checkout with its existing dependencies. This tool does not install dependencies or browsers.'); }
  const source = await snapshot(args.gameDir);
  console.log(`Verified exact COMP-RUN ${EXPECTED.version}: ${EXPECTED.gameFiles} runtime files. Opening installed ${args.browser}.`);
  console.log('The browser runs headlessly. The game UI will select and pause three real opening scenes.');
  const local = await serve(source);
  let browser;
  try {
    browser = await playwright.chromium.launch({ channel: args.browser, headless: true });
    const captures = [];
    for (const shot of SHOTS) { console.log('Capturing ' + shot.title + '…'); captures.push(await capture(browser, local.url, shot)); }
    const after = await snapshot(args.gameDir);
    check(after.fingerprint === source.fingerprint, 'Source files changed during capture. No screenshot set will be saved.');
    const provenance = {
      schemaVersion: 1, status: 'captured-requires-visual-review', gameId: 'comp-run', version: EXPECTED.version,
      createdAt: new Date().toISOString(), captureMethod: 'Playwright screenshot from the unchanged main game UI in an installed headless Windows browser',
      sceneType: 'in-engine openings; not a claim of a completed gameplay run',
      source: { directory: args.gameDir, files: source.entries, bytes: source.bytes, fileCount: source.entries.length,
        fingerprintAlgorithm: FINGERPRINT, treeSha256: source.fingerprint, runtimeSha256: source.runtimeFingerprint,
        expectedRuntimeSha256: EXPECTED.gameSha256, unchangedAfterCapture: true, servedFromImmutableReadOnlyMemorySnapshot: true },
      browser: { channel: args.browser, version: browser.version(), playwrightVersion, platform: process.platform, viewport: VIEWPORT, deviceScaleFactor: 1, freshProfile: true },
      captureTool: { file: path.basename(__filename), sha256: sha256(await fsp.readFile(__filename)) },
      screenshots: captures.map(item => item.record), serverRequests: local.requests,
      galleryTarget: 'original-case-assets/comp-run/screenshots', nextStep: 'Visually review all three PNGs, copy the approved PNGs and this provenance into the reserved gallery directory, then run node tools/test-comp-run-integration.cjs --require-screenshots.'
    };
    await fsp.mkdir(path.dirname(args.output), { recursive: true });
    const temporary = await fsp.mkdtemp(path.join(path.dirname(args.output), '.comp-run-capture-'));
    try {
      for (const item of captures) await fsp.writeFile(path.join(temporary, item.record.file), item.png, { flag: 'wx' });
      await fsp.writeFile(path.join(temporary, 'screenshot-provenance.json'), JSON.stringify(provenance, null, 2) + '\n', { flag: 'wx' });
      check(!await exists(args.output), 'Output appeared during capture; refusing to replace it.');
      await fsp.rename(temporary, args.output);
    } catch (error) { await fsp.rm(temporary, { recursive: true, force: true }); throw error; }
    console.log('Captured all three real opening scenes: ' + args.output);
    console.log('Review each PNG before adding it to original-case-assets/comp-run/screenshots. This tool has not published or activated gallery images.');
    console.log('After approved images are copied: node tools/test-comp-run-integration.cjs --require-screenshots');
  } finally {
    if (browser) await browser.close().catch(error => console.error('Browser cleanup: ' + error.message));
    local.server.closeAllConnections();
    await new Promise(resolve => local.server.close(resolve));
  }
}

if (require.main === module) main().catch(error => {
  console.error('CAPTURE FAILED — no completed screenshot set was created.\n' + error.message);
  process.exitCode = 1;
});
