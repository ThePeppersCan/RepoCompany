'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const load = () => import(pathToFileURL(path.resolve(__dirname, '../../tools/game-workers/manager-player-background.mjs')));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const before = '.setup{background:url(assets/ui-v2/main-menu-bg.webp)}';
const after = before.replace('main-menu-bg.webp', 'main-menu-clean-v2.png');

test('Manager correction changes only the captured stylesheet body and retains response security headers', async () => {
  const { withManagerPlayerBackground } = await load(); let received;
  const scheduled = () => {};
  const worker = withManagerPlayerBackground({ scheduled, async fetch(request, env, context) {
    received = { request, env, context };
    return new Response(before, { headers: { 'content-type': 'text/css', etag: 'old', 'content-length': String(before.length), 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'self'" } });
  } }, { originalSha256: hash(before), css: after });
  const env = { GAME: 'original binding' }, context = {};
  const response = await worker.fetch(new Request('https://manager.repocompany.uk/player-career.css?v=old', { headers: { 'if-none-match': 'old', range: 'bytes=0-1' } }), env, context);
  assert.equal(await response.text(), after); assert.equal(received.env, env); assert.equal(received.context, context);
  assert.equal(received.request.headers.get('if-none-match'), null); assert.equal(received.request.headers.get('range'), null);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff'); assert.equal(response.headers.get('content-security-policy'), "default-src 'self'");
  assert.equal(response.headers.get('etag'), null); assert.equal(response.headers.get('content-length'), null); assert.equal(worker.scheduled, scheduled);
});

test('unrelated routes, methods and lookalike origins are delegated without request changes', async () => {
  const { withManagerPlayerBackground } = await load();
  for (const [url, method] of [['https://manager.repocompany.uk/api/account', 'GET'], ['https://manager.repocompany.uk/player-career.css', 'POST'], ['https://example.com/player-career.css', 'GET'], ['https://manager.repocompany.uk/sub/player-career.css', 'GET']]) {
    const request = new Request(url, { method }), expected = new Response('unchanged'); let actual;
    const worker = withManagerPlayerBackground({ fetch: async r => { actual = r; return expected; } }, { originalSha256: hash(before), css: after });
    assert.equal(await worker.fetch(request, {}, {}), expected); assert.equal(actual, request);
  }
});

test('a later published stylesheet, failed response or other MIME type is never overwritten', async () => {
  const { withManagerPlayerBackground } = await load();
  for (const response of [new Response(before + '/*new release*/', { headers: { 'content-type': 'text/css' } }), new Response('offline', { status: 503 }), new Response(before, { headers: { 'content-type': 'text/html' } })]) {
    const worker = withManagerPlayerBackground({ fetch: async () => response }, { originalSha256: hash(before), css: after });
    assert.equal(await worker.fetch(new Request('https://manager.repocompany.uk/player-career.css'), {}, {}), response);
  }
});

test('HEAD checks the captured CSS while returning no body, and invalid corrections fail early', async () => {
  const { withManagerPlayerBackground } = await load(); let method;
  const worker = withManagerPlayerBackground({ fetch: async request => { method = request.method; return new Response(before, { headers: { 'content-type': 'text/css' } }); } }, { originalSha256: hash(before), css: after });
  const response = await worker.fetch(new Request('https://manager.repocompany.uk/player-career.css', { method: 'HEAD' }), {}, {});
  assert.equal(method, 'GET'); assert.equal(await response.text(), ''); assert.equal(response.headers.get('x-repo-manager-background'), '1');
  assert.throws(() => withManagerPlayerBackground({}, { originalSha256: 'not a hash', css: after }), /Invalid/);
});
