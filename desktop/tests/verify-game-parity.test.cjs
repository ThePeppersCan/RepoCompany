'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { sourceURL, expectedNative, readResponse, verifyGameParity } = require('../tools/verify-game-parity.cjs');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

test('parity maps only known overlays, preserving origin and rejecting unsafe paths', () => {
  assert.equal(sourceURL('manager', 'app.js'), 'https://repocompany.uk/game-integrations/manager/app.js');
  assert.equal(sourceURL('manager', 'assets/app.js'), 'https://manager.repocompany.uk/assets/app.js');
  assert.equal(sourceURL('moratales', 'interface/town-cafe-day.js'), 'https://repocompany.uk/game-integrations/moratales/town-cafe-day.js');
  assert.equal(sourceURL('manager', 'index.html'), 'https://manager.repocompany.uk/');
  assert.equal(sourceURL('comp-run', 'index.html'), 'https://comp-run.fluffy-star-4855.chatgpt.site/');
  assert.equal(sourceURL('comp-run', 'main.js'), 'https://comp-run.fluffy-star-4855.chatgpt.site/main.js');
  assert.equal(sourceURL('comp-run', 'launcher/achievement-runtime.js'), 'https://comp-run.fluffy-star-4855.chatgpt.site/launcher/achievement-runtime.js');
  assert.equal(sourceURL('morogue', 'interface/vampire-survivor/art.js', { originalURL: 'https://repocompany.uk/game-integrations/morogue/art.js?v=abc' }), 'https://repocompany.uk/game-integrations/morogue/art.js?v=abc');
  assert.throws(() => sourceURL('morogue', 'app.js', { originalURL: 'https://repocompany.uk/account.js' }), /Unapproved/);
  assert.throws(() => sourceURL('morogue', 'app.js', { originalURL: 'https://user@morogue.repocompany.uk/app.js' }), /Unapproved/);
  assert.throws(() => sourceURL('manager', '../account.json')); assert.throws(() => sourceURL('other', 'app.js'));
});

test('Morogue capture receipts require complete hashes and reject published source drift', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-morogue-parity-'));
  try {
    const release = path.join(dir, 'release'), relative = 'interface/vampire-survivor/art.js';
    const live = "const asset='https://repocompany.uk/game-integrations/morogue/grove-assets/tree.png';";
    const installed = expectedNative('morogue', relative, live).text;
    await fs.mkdir(path.join(release, 'payload/interface/vampire-survivor'), { recursive: true });
    await fs.writeFile(path.join(release, 'payload', relative), installed);
    const manifest = { gameId: 'morogue', version: 'test', files: [{ path: relative, size: Buffer.byteLength(installed), sha256: sha(installed) }] };
    const capture = { gameId: 'morogue', version: 'test', receipts: [{ path: relative, originalURL: 'https://repocompany.uk/game-integrations/morogue/art.js', originalSha256: sha(live), bundledSha256: sha(installed) }] };
    await fs.writeFile(path.join(release, 'manifest.json'), JSON.stringify(manifest)); await fs.writeFile(path.join(release, 'package-report.json'), JSON.stringify(capture));
    const good = await verifyGameParity({ release, output: path.join(dir, 'good'), fetchImpl: async () => new Response(live) });
    assert.equal(good.summary.equal, 1); assert.equal(good.files[0].capturedOriginalSha256, sha(live));
    const drift = await verifyGameParity({ release, output: path.join(dir, 'drift'), fetchImpl: async () => new Response(live + '\n') });
    assert.equal(drift.files[0].sourceChangedSinceCapture, true); assert.equal(drift.summary.equal, 0);
    capture.receipts[0].bundledSha256 = '0'.repeat(64); await fs.writeFile(path.join(release, 'package-report.json'), JSON.stringify(capture));
    await assert.rejects(() => verifyGameParity({ release, output: path.join(dir, 'bad'), fetchImpl: async () => { throw Error('must not fetch'); } }), /capture hash differs/);
  } finally { assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep)); await fs.rm(dir, { recursive: true, force: true }); }
});

test('binary reader hashes fragmented bytes without retaining the asset and bounds responses', async () => {
  const value = Buffer.from([0, 255, 3, 7, 11]);
  const body = new ReadableStream({ start(c) { c.enqueue(value.subarray(0, 2)); c.enqueue(value.subarray(2)); c.close(); } });
  assert.deepEqual(await readResponse(new Response(body), false), { sha256: sha(value), bytes: value.length, text: null });
  await assert.rejects(() => readResponse(new Response(value), false, 4), /bounded/);
});

test('visual CSS changes are never treated as a native launcher exception', () => {
  const old = '.background{background:url(assets/ui-v2/main-menu-bg.webp)}';
  assert.deepEqual(expectedNative('manager', 'player-career.css', old), { text: old, transform: null });
  assert.throws(() => expectedNative('moratales', 'interface/town-explorer.js', 'unknown source'), /Unrecognised/);
  assert.deepEqual(expectedNative('comp-run', 'main.js', 'const version="2.2.1";\r\n'), { text: 'const version="2.2.1";\r\n', transform: null });
});

test('COMP-RUN parity requires exact bytes for text, artwork and download parts', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-comp-run-parity-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const release = path.join(dir, 'release');
  const entries = { 'index.html': Buffer.from('<!doctype html><title>COMP-RUN</title>\r\n'), 'main.js': Buffer.from('const version="2.2.1";\n'), 'assets/cover.png': Buffer.from([0, 1, 255]), 'downloads/archive.001.bin': Buffer.from([3, 4, 5]) };
  const files = [];
  for (const [name, bytes] of Object.entries(entries)) {
    const file = path.join(release, 'payload', name); await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, bytes);
    files.push({ path: name, size: bytes.length, sha256: sha(bytes) });
  }
  await fs.writeFile(path.join(release, 'manifest.json'), JSON.stringify({ gameId: 'comp-run', version: '2.2.1', files }));
  const fetchImpl = changed => async (url, options) => {
    const parsed = new URL(url); assert.equal(parsed.origin, 'https://comp-run.fluffy-star-4855.chatgpt.site');
    const name = parsed.pathname === '/' ? 'index.html' : parsed.pathname.slice(1);
    const bytes = changed && name === 'index.html' ? Buffer.from(entries[name].toString().replace(/\r\n/g, '\n')) : entries[name];
    const responseBytes = name === 'index.html' && options.headers?.['X-Requested-With'] !== 'XMLHttpRequest' ? Buffer.concat([bytes, Buffer.from('<script>per-navigation detection</script>')]) : bytes;
    return new Response(responseBytes, { headers: { 'content-type': name.endsWith('.html') ? 'text/html' : 'application/octet-stream' } });
  };
  const exact = await verifyGameParity({ release, output: path.join(dir, 'exact'), fetchImpl: fetchImpl(false) });
  assert.equal(exact.summary.equal, files.length); assert(exact.files.every(row => row.exact && row.transform === null));
  const drift = await verifyGameParity({ release, output: path.join(dir, 'drift'), fetchImpl: fetchImpl(true) });
  assert.deepEqual(drift.summary.different, ['index.html']); assert.equal(drift.files.find(row => row.path === 'index.html').equal, false);
});

test('full audit detects changed binary, local corruption, HTML fallback and text changes', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-parity-test-'));
  try {
    const release = path.join(dir, 'release'), output = path.join(dir, 'audit');
    await fs.mkdir(path.join(release, 'payload/assets'), { recursive: true });
    const entries = { 'assets/good.png': Buffer.from([1, 2, 3]), 'assets/different.png': Buffer.from([4, 5]), 'assets/corrupt.png': Buffer.from([9]), 'assets/fallback.png': Buffer.from([6]), 'style.css': Buffer.from('body{color:red}\r\n') };
    const files = [];
    for (const [name, bytes] of Object.entries(entries)) { await fs.writeFile(path.join(release, 'payload', name), bytes); files.push({ path: name, size: bytes.length, sha256: name.includes('corrupt') ? '0'.repeat(64) : sha(bytes) }); }
    await fs.writeFile(path.join(release, 'manifest.json'), JSON.stringify({ gameId: 'manager', version: 'test', files }));
    const report = await verifyGameParity({ release, output, retries: 0, fetchImpl: async url => {
      const name = new URL(url).pathname.slice(1);
      if (name.includes('fallback')) return new Response('<html>not found</html>', { headers: { 'content-type': 'text/html' } });
      if (name.includes('different')) return new Response(Buffer.from([5, 4]), { headers: { 'content-type': 'image/png' } });
      if (name === 'style.css') return new Response('body{color:red}\n', { headers: { 'content-type': 'text/css' } });
      return new Response(entries[name], { headers: { 'content-type': 'image/png' } });
    } });
    assert.equal(report.summary.equal, 2); assert.deepEqual(report.summary.different.sort(), ['assets/corrupt.png', 'assets/different.png', 'assets/fallback.png']);
    const rows = JSON.parse(await fs.readFile(path.join(output, 'report.json'), 'utf8')).files;
    assert.equal(rows.find(r => r.path === 'style.css').exact, false); assert.equal(rows.find(r => r.path === 'style.css').equal, true);
    assert.equal(rows.find(r => r.path.includes('corrupt')).manifestIntact, false);
    assert.equal((await fs.readFile(path.join(output, 'files.ndjson'), 'utf8')).trim().split('\n').length, 5);
  } finally {
    assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep));
    await fs.rm(dir, { recursive: true, force: true });
  }
});
