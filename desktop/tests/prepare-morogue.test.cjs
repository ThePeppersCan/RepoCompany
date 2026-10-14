'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs/promises'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { prepareMorogue } = require('../tools/prepare-morogue.cjs');
const { htmlResources } = require('../tools/capture-published-morogue.cjs');
const { safeRemove } = require('../lib/library.cjs');
const GAME = 'https://morogue.repocompany.uk', PORTAL = 'https://repocompany.uk', PREFIX = '/game-integrations/morogue/';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const exists = async file => { try { await fs.lstat(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'published-morogue-test-')); t.after(() => safeRemove(os.tmpdir(), root));
  const source = path.join(root, 'current-game'), repoSource = path.join(root, 'website'), output = path.join(root, 'release');
  const responses = new Map(), calls = [], counts = new Map(); let alter;
  const html = '<!doctype html><html><head><base href="../../"><link rel="stylesheet" href="interface/vampire-survivor/style.css"><script defer src="interface/vampire-survivor/skin.js"></script>' +
    '<script defer src="' + PORTAL + PREFIX + 'game.js?v=deliberately-stale-label"></script>' +
    '<script defer src="' + PORTAL + PREFIX + 'audio.js"></script><link rel="stylesheet" href="' + PORTAL + PREFIX + 'grove.css">' +
    '<script defer src="' + PORTAL + PREFIX + 'achievement-runtime.js" data-game="morogue"></script>' +
    '<script defer src="' + PORTAL + PREFIX + 'app.js"></script></head><body><img src="assets/branding/morogue-logo.png">' +
    '<script defer src="' + PORTAL + '/game-playtime-client.js"></script></body></html>';
  responses.set(GAME + '/', { bytes: Buffer.from(html), type: 'text/html' });
  async function file(relative, content, integration = false) {
    const location = path.join(integration ? repoSource : source, integration ? 'game-integrations/morogue/' + relative : relative);
    await fs.mkdir(path.dirname(location), { recursive: true });
    // Deliberately different local bytes; these must never enter a package.
    await fs.writeFile(location, 'UNPUBLISHED LOCAL EDIT: ' + relative);
    const type = relative.endsWith('.js') ? 'text/javascript' : relative.endsWith('.css') ? 'text/css' : relative.endsWith('.html') ? 'text/html' : 'application/octet-stream';
    responses.set((integration ? PORTAL + PREFIX : GAME + '/') + relative, { bytes: Buffer.isBuffer(content) ? content : Buffer.from(content), type });
  }
  await file('interface/vampire-survivor/index.html', html);
  await file('interface/vampire-survivor/style.css', 'body{background:url("../../assets/morogue/background.png")}');
  await file('interface/vampire-survivor/skin.js', 'globalThis.skin="live";');
  await file('interface/vampire-survivor/game.js', 'globalThis.game="old-origin-route";');
  await file('interface/arrival-character.js', 'globalThis.arrival=true;');
  await file('interface/town-ui-font.js', 'globalThis.font=true;');
  await file('assets/morogue/background.png', Buffer.from([137,80,78,71,0,255]));
  await file('assets/vampire-survivor/sprite.png', Buffer.from([137,80,78,71,2,254]));
  await file('assets/vampire-survivor/music-source.json', '{"original":"unpublished-original-audio.mp3","reference":"assets/gardening/source-art.png"}');
  await file('assets/branding/morogue-logo.png', Buffer.from([137,80,78,71,3,253]));
  await file('interface/vampire-survivor/future.js', 'unpublished'); responses.delete(GAME + '/interface/vampire-survivor/future.js');
  await file('game.js', 'globalThis.game="current-coffee-and-salt-oracle";const art="' + PORTAL + PREFIX + 'grove-assets/tree.png";const dynamic=id+".png",variant=id+"-v4.png";', true);
  await file('audio.js', 'const scriptUrl=document.currentScript.src;const clip=new URL("star.wav",scriptUrl);', true);
  await file('grove.css', '.grove{background:url("grove-assets/tree.png")}', true);
  await file('grove-assets/tree.png', Buffer.from([137,80,78,71,33,201]), true);
  await file('star.wav', Buffer.from([82,73,70,70,0,255,128,127]), true);
  await file('achievement-runtime.js', 'globalThis.runtime="published";fetch(base+"/assets/achievements/catalogue.json");', true);
  await file('app.js', 'globalThis.app="published-app";', true);
  responses.set(PORTAL + '/game-playtime-client.js', { bytes: Buffer.from('globalThis.playtime=true;'), type: 'text/javascript' });
  const fetchImpl = async (value, options) => {
    assert.equal(options.redirect, 'error'); assert.equal(options.cache, 'no-store'); assert.equal(options.credentials, 'omit');
    const url = new URL(value), key = url.origin + url.pathname, count = (counts.get(key) || 0) + 1; counts.set(key, count); calls.push(url.href);
    const response = alter?.(url, count) || responses.get(key);
    return response ? new Response(response.bytes, { status: response.status || 200, headers: { 'Content-Type': response.type } }) : new Response('not published', { status: 404 });
  };
  const capture = options => prepareMorogue({ source, repoSource, output, version: '0.1.0-preview.3', fetchImpl, ...options });
  const audit = path.join(root, 'audit.json');
  async function writeAudit(edit = value => value) {
    const raw = { url: GAME + '/', htmlSha256: hash(responses.get(GAME + '/').bytes), rows: htmlResources(html, GAME + '/').filter(row => row.executable).map(row => ({ url: row.url, sha256: hash(responses.get(new URL(row.url).origin + new URL(row.url).pathname).bytes) })) };
    await fs.writeFile(audit, JSON.stringify(edit(raw))); return audit;
  }
  return { root, source, repoSource, output, capture, responses, calls, counts, html, audit, writeAudit, alter: value => { alter = value; } };
}
test('capture uses published bytes and preserves HTML script order while localizing every integration dependency', async t => {
  const f = await fixture(t), report = await f.capture({ write: true, audit: await f.writeAudit() });
  const read = file => fs.readFile(path.join(f.output, 'payload', file), 'utf8');
  const html = await read('interface/vampire-survivor/index.html');
  const scripts = htmlResources(html, GAME + '/').filter(row => row.tag === 'script').map(row => row.url);
  assert.deepEqual(scripts, [GAME + '/interface/vampire-survivor/skin.js', GAME + PREFIX + 'game.js?v=deliberately-stale-label', GAME + PREFIX + 'audio.js', GAME + '/interface/vampire-survivor/app.js', PORTAL + '/game-playtime-client.js']);
  assert.match(await read('interface/vampire-survivor/game.js'), /current-coffee-and-salt-oracle/);
  assert.match(await read('game-integrations/morogue/game.js'), /"\/game-integrations\/morogue\/grove-assets\/tree.png"/);
  assert.match(await read('game-integrations/morogue/audio.js'), /document.currentScript.src/);
  assert.equal(await read('interface/vampire-survivor/app.js'), 'globalThis.app="published-app";');
  assert.equal(await read('launcher/achievement-runtime.js'), 'globalThis.runtime="published";fetch(base+"/assets/achievements/catalogue.json");');
  assert(!f.calls.some(url => url.startsWith(GAME + '/assets/achievements/')), 'account-origin achievement resources remain online');
  assert(!f.calls.some(url => /\/(?:\.png|-v4.png)$/.test(url)), 'dynamic suffixes are not standalone dependencies');
  assert(!f.calls.some(url => /unpublished-original-audio.mp3|assets\/gardening\/source-art.png/.test(url)), 'inventory-only attribution JSON is not a runtime asset list');
  assert.match(await read('assets/vampire-survivor/music-source.json'), /unpublished-original-audio/);
  assert.deepEqual(await fs.readFile(path.join(f.output, 'payload/game-integrations/morogue/star.wav')), f.responses.get(PORTAL + PREFIX + 'star.wav').bytes);
  assert.deepEqual(await fs.readFile(path.join(f.output, 'payload/interface/vampire-survivor/star.wav')), f.responses.get(PORTAL + PREFIX + 'star.wav').bytes);
  assert.equal(report.skippedUnpublishedInventory.length, 1); assert.match(report.skippedUnpublishedInventory[0], /future.js$/);
  assert(report.receipts.every(item => /^[a-f0-9]{64}$/.test(item.originalSha256) && /^[a-f0-9]{64}$/.test(item.bundledSha256)));
  assert.equal(new Set(report.receipts.map(item => item.path)).size, report.fileCount);
  assert(report.receipts.filter(item => /\.js$/.test(item.path)).every(item => !item.originalURL.includes('file:')));
  const runtime = report.receipts.find(item => item.path === 'launcher/achievement-runtime.js'); assert.equal(runtime.originalSha256, runtime.bundledSha256);
  for (const [url, count] of f.counts) if (/\.(?:js|css)$/.test(new URL(url).pathname) && !url.endsWith('future.js')) assert(count >= 2, url);
});
test('dry run writes no package and requires an explicit version/current source inventory', async t => {
  const f = await fixture(t), report = await f.capture(); assert.equal(report.written, false); assert.equal(await exists(f.output), false);
  await assert.rejects(f.capture({ version: undefined }), /explicit --version/);
  await assert.rejects(f.capture({ source: path.join(f.source, 'dist-web') }), /older dist-web/);
});
test('required HTML or integration files missing from publication fail even if local files exist', async t => {
  const f = await fixture(t), script = GAME + '/interface/vampire-survivor/skin.js', value = f.responses.get(script);
  f.responses.delete(script); await assert.rejects(f.capture({ write: true }), /HTTP 404/); assert.equal(await exists(f.output), false);
  f.responses.set(script, value); f.responses.delete(PORTAL + PREFIX + 'grove-assets/tree.png');
  await assert.rejects(f.capture(), /HTTP 404/);
});
test('literal missing assets fail rather than becoming silently skipped inventory extras', async t => {
  const f = await fixture(t), key = GAME + '/interface/vampire-survivor/skin.js';
  f.responses.get(key).bytes = Buffer.from('const image="assets/morogue/missing.png";');
  await assert.rejects(f.capture({ write: true }), /HTTP 404.*missing.png/); assert.equal(await exists(f.output), false);
});
test('JSON explicitly loaded by game code does enforce its local asset dependencies', async t => {
  const f = await fixture(t), key = GAME + '/interface/vampire-survivor/skin.js';
  f.responses.get(key).bytes = Buffer.from('fetch("assets/vampire-survivor/music-source.json");');
  await assert.rejects(f.capture({ write: true }), /HTTP 404/); assert.equal(await exists(f.output), false);
});
test('HTML fallback responses cannot masquerade as scripts or image assets', async t => {
  const f = await fixture(t), key = GAME + '/assets/morogue/background.png';
  f.responses.get(key).bytes = Buffer.from('<!doctype html><html>Gate</html>');
  await assert.rejects(f.capture(), /HTML fallback/);
});
test('reviewed audits pin actual bytes and order, not version-looking query strings', async t => {
  const f = await fixture(t);
  await f.capture({ audit: await f.writeAudit() }); // deliberately stale ?v label is valid when actual bytes match
  await assert.rejects(f.capture({ audit: await f.writeAudit(raw => ({ ...raw, htmlSha256: '0'.repeat(64) })) }), /HTML differs/);
  await assert.rejects(f.capture({ audit: await f.writeAudit(raw => ({ ...raw, rows: [...raw.rows].reverse() })) }), /order differs/);
  await assert.rejects(f.capture({ audit: await f.writeAudit(raw => { raw.rows[0].sha256 = '0'.repeat(64); return raw; }) }), /resource differs/);
});
test('HTML or executable changes during capture fail before any manifest is activated', async t => {
  const f = await fixture(t);
  f.alter((url, count) => url.pathname.endsWith('skin.js') && count > 1 ? { bytes: Buffer.from('changed-after-capture'), type: 'text/javascript' } : null);
  await assert.rejects(f.capture({ write: true }), /changed during capture/); assert.equal(await exists(f.output), false);
  const g = await fixture(t);
  g.alter((url, count) => url.origin === GAME && url.pathname === '/' && count > 1 ? { bytes: Buffer.from(g.html + '<!-- published new version -->'), type: 'text/html' } : null);
  await assert.rejects(g.capture({ write: true }), /HTML changed/); assert.equal(await exists(g.output), false);
});
test('verified immutable cache blobs are hardlinked; corrupt caches and existing output are refused', async t => {
  const f = await fixture(t), cacheBlobs = path.join(f.root, 'cache'); await fs.mkdir(cacheBlobs);
  const bytes = f.responses.get(GAME + '/assets/morogue/background.png').bytes, cached = path.join(cacheBlobs, hash(bytes) + '.bin'); await fs.writeFile(cached, bytes);
  const report = await f.capture({ write: true, cacheBlobs }); assert.equal(report.hardlinkedFiles, 1);
  assert.equal((await fs.stat(cached)).ino, (await fs.stat(path.join(f.output, 'payload/assets/morogue/background.png'))).ino);
  await assert.rejects(f.capture({ write: true }), /already exists/);
  const g = await fixture(t); const otherCache = path.join(g.root, 'cache'); await fs.mkdir(otherCache); await fs.writeFile(path.join(otherCache, hash(bytes) + '.bin'), 'corrupt');
  await assert.rejects(g.capture({ write: true, cacheBlobs: otherCache }), /Cached.*corrupt/); assert.equal(await exists(g.output), false);
  assert.deepEqual((await fs.readdir(g.root)).filter(name => name.startsWith('.morogue-capture-')), []);
});
