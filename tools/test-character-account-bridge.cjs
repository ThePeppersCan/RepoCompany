'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '..', 'morogue-account-bridge.js'), 'utf8');
const A = '11111111-2222-4333-8444-555555555555', B = '66666666-7777-4888-8999-aaaaaaaaaaaa';
const nonce = '12345678-1234-4234-8234-123456789012';
const defer = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };
function harness() {
  const handlers = {}, replies = [], requests = [], timers = [];
  let user = A, change, sessionHook = null, fetchHook = null, sequence = 0;
  const auth = { getSession: async () => sessionHook ? sessionHook() : { data: { session: user ? { user: { id: user }, access_token: 'token-' + user, expires_at: 123 } : null } }, onAuthStateChange(fn) { change = fn; } };
  const parent = { postMessage(message, origin) { replies.push({ message, origin }); } };
  const context = { parent, window: { repoDashboardConfig: { url: 'https://auth.test', key: 'public', authDomain: 'repo.test' }, supabase: { createClient: () => ({ auth }) } }, addEventListener: (type, fn) => { handlers[type] = fn; }, setTimeout: fn => { timers.push(fn); }, AbortSignal,
    fetch: async (url, options) => { requests.push({ url, options }); return fetchHook ? fetchHook(url, options) : { ok: true, status: 200, json: async () => ({ userId: options.headers.Authorization.slice('Bearer token-'.length), revision: 1, characters: [], updatedAt: 100 }) }; }
  };
  vm.runInNewContext(source, context);
  const event = (action, payload, extras = {}) => ({ source: parent, origin: 'https://moratales.repocompany.uk', data: { channel: 'morogue-account-v1', nonce, id: String(++sequence), action, payload }, ...extras });
  return { replies, requests, auth, parent, event, receive: handlers.message, set user(value) { user = value; }, set session(fn) { sessionHook = fn; }, set fetch(fn) { fetchHook = fn; }, switch(value) { user = value; change(); }, async call(action, payload, extras) { const e = event(action, payload, extras); await handlers.message(e); return replies.find(row => row.message.id === e.data.id)?.message; } };
}
(async () => {
  let h = harness();
  let reply = await h.call('characters', { userId: A }, { origin: 'https://morogue.repocompany.uk' });
  assert.equal(reply.result.userId, A); assert.equal(h.requests[0].options.method, 'GET');
  assert.equal(h.requests[0].options.headers.Authorization, 'Bearer token-' + A);
  assert.doesNotMatch(JSON.stringify(reply), /access_token|refresh_token|token-/);
  const calls = h.requests.length;
  assert.equal(await h.call('characters-save', { userId: A, revision: 1, characters: [] }, { origin: 'https://morogue.repocompany.uk' }), undefined);
  assert.equal(h.requests.length, calls, 'Morogue cannot invoke appearance writes');
  h = harness();
  reply = await h.call('characters-save', { userId: A, revision: 3, characters: [], extra: 'discard' });
  assert.equal(reply.result.userId, A);
  assert.deepEqual(JSON.parse(h.requests[0].options.body), { revision: 3, characters: [] });
  for (const extras of [{ source: {} }, { origin: 'https://evil.test' }]) {
    const denied = harness(); await denied.call('characters', { userId: A }, extras); assert.equal(denied.requests.length, 0); assert.equal(denied.replies.length, 0);
  }
  h = harness(); await h.call('hello');
  await h.receive({ ...h.event('characters', { userId: A }), data: { channel: 'morogue-account-v1', nonce: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', id: 'other', action: 'characters', payload: { userId: A } } });
  await h.call('characters', { userId: A }, { origin: 'https://morogue.repocompany.uk' });
  assert.equal(h.requests.length, 0, 'a bridge remains bound to its original parent origin and nonce');
  for (const user of [null, B]) { h = harness(); h.user = user; reply = await h.call('characters-save', { userId: A, revision: 0, characters: [] }); assert.ok(reply.error); assert.equal(h.requests.length, 0); }
  for (const roundTrip of [false, true]) {
    h = harness(); const held = defer(); h.fetch = () => held.promise;
    const pending = h.call('characters', { userId: A }); await flush();
    h.switch(B); if (roundTrip) h.switch(A);
    held.resolve({ ok: true, json: async () => ({ userId: A, revision: 1, characters: [] }) });
    reply = await pending; assert.ok(reply.error); assert.equal(reply.result, undefined, 'late data cannot cross an account change, even A→B→A');
  }
  h = harness(); const firstSession = defer(); h.session = () => firstSession.promise;
  const waiting = h.call('characters-save', { userId: A, revision: 0, characters: [] });
  h.switch(B); h.switch(A); firstSession.resolve({ data: { session: { user: { id: A }, access_token: 'old' } } });
  reply = await waiting; assert.ok(reply.error); assert.equal(h.requests.length, 0, 'a stale session result cannot start an upload');
  h = harness(); h.fetch = async () => ({ ok: true, json: async () => ({ userId: B, revision: 1, characters: [] }) });
  reply = await h.call('characters', { userId: A }); assert.ok(reply.error); assert.equal(reply.result, undefined);
  h = harness(); h.fetch = async () => ({ ok: false, status: 409, json: async () => ({ current: { userId: A, revision: 2, characters: [] } }) });
  reply = await h.call('characters-save', { userId: A, revision: 1, characters: [] }); assert.equal(reply.code, 'revision_conflict'); assert.equal(h.requests.length, 1, 'conflicts never silently retry or overwrite');
  h = harness(); let sessions = 0; h.session = async () => ({ data: { session: { user: { id: ++sessions === 1 ? A : B }, access_token: 'old' } } });
  reply = await h.call('characters', { userId: A }); assert.ok(reply.error); assert.equal(reply.result, undefined, 'the final session is checked even without an auth event');
  console.log('PASS: character account bridge origin/nonce restrictions, Morogue read-only access, exact account checks and stale asynchronous results.');
})().catch(error => { console.error(error); process.exitCode = 1; });
