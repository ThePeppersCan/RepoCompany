'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { verifyReleaseFeed } = require('../tools/verify-release-feed.cjs');
const origin = 'https://repo-company-games.pages.dev';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function fixture(mode) {
  const manifests = new Map(), blobs = new Map(), calls = [];
  for (const [id, entry, sample] of [['morogue','interface/vampire-survivor/index.html','interface/vampire-survivor/app.js'],['moratales','preview.html','interface/town-explorer.js'],['manager','index.html','app.js']]) {
    const files = [[entry,Buffer.from('<!doctype html><html><body>Game</body></html>')],[sample,Buffer.from('globalThis.game=true;')],['assets/music.mp3',Buffer.alloc(4096,7)]];
    manifests.set(`/${id}/manifest.json`, { schemaVersion: 1, gameId: id, version: '1.0.0', entry, files: files.map(([name,bytes]) => { const sha256 = hash(bytes), url = `${origin}/blobs/${sha256}.bin`; blobs.set(new URL(url).pathname, bytes); return { path: name, size: bytes.length, sha256, url }; }) });
  }
  return { calls, async fetchImpl(url, options) {
    calls.push({ url, method: options.method }); assert(['GET','HEAD'].includes(options.method)); assert.equal(new URL(url).origin, origin);
    const name = new URL(url).pathname;
    if (manifests.has(name)) return new Response(JSON.stringify(manifests.get(name)), { headers: { 'Content-Type': 'application/json', 'Cache-Control': mode === 'cached-manifest' ? 'public, max-age=86400' : 'no-store' } });
    let bytes = blobs.get(name); assert(bytes);
    const headers = { 'Content-Type': 'application/octet-stream', 'Content-Length': String(bytes.length), 'Cache-Control': 'public, max-age=31536000, immutable', 'Accept-Ranges': 'bytes' };
    if (mode === 'redirect') return new Response(null, { status: 301, headers: { Location: url + '/' } });
    if (options.method === 'HEAD') return new Response(null, { headers });
    if (options.headers.Range) {
      const end = Number(options.headers.Range.split('-')[1]); headers['Content-Range'] = `bytes 0-${end}/${bytes.length}`; headers['Content-Length'] = String(end+1);
      bytes = bytes.subarray(0,end+1); if (mode === 'wrong-range') bytes = Buffer.alloc(end+1,3);
      return new Response(bytes, { status: 206, headers });
    }
    if (mode === 'corrupt') bytes = Buffer.alloc(bytes.length,1);
    return new Response(bytes, { headers });
  } };
}
test('public feed verifier checks all manifests, entry/script hashes and actual binary ranges using read-only methods', async () => {
  const network = fixture(), report = await verifyReleaseFeed(network);
  assert.equal(report.passed, true); assert.equal(report.games.length, 3);
  assert(report.games.every(game => game.entry.hashVerified && game.sample.hashVerified && game.largestBinary.range.verified));
  assert.equal(network.calls.length, 24);
});
test('feed verifier rejects cached manifests before checking game blobs', async () => {
  await assert.rejects(verifyReleaseFeed(fixture('cached-manifest')), /unexpected cache headers/);
});
test('feed verifier detects corrupt full downloads and inaccurate partial bytes', async () => {
  await assert.rejects(verifyReleaseFeed(fixture('corrupt')), /SHA-256 does not match/);
  await assert.rejects(verifyReleaseFeed(fixture('wrong-range')), /range bytes differ/);
});
test('feed verifier refuses host redirects for content-addressed blobs', async () => {
  await assert.rejects(verifyReleaseFeed(fixture('redirect')), /redirects are not allowed/);
});
