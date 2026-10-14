'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { Account } = require('../lib/account.cjs');
const config = { authOrigin: 'https://auth.test', portalOrigin: 'https://portal.test', authKey: 'public' };
const session = { access_token: 'test-access-token', user: { id: 'player-one' } };
function setup(handler, getSession = async () => session) { return new Account({ config, getSession, fetchImpl: handler }); }
const good = async url => new Response(JSON.stringify(url.includes('/auth/v1/user') ? { id: 'player-one' } : url.includes('/api/dashboard') ? { username: 'Tester', profile: { display_name: 'Test player' } } : { id: 'player-one' }));
test('verifies existing identity and profile, never publishes tokens in renderer state', async () => {
  const account = setup(good); await account.refresh();
  assert.equal(await account.requireOnline('https://morogue.test'), 'player-one');
  assert.equal(account.snapshot().username, 'Tester');
  assert.ok(!JSON.stringify(account.snapshot()).includes('test-access-token'));
});
test('signed-out, expired, mismatched and unreachable accounts cannot launch', async () => {
  for (const account of [setup(good, async () => null), setup(async () => new Response('{}', { status: 401 })), setup(async () => new Response('{"id":"different-player"}')), setup(async () => { throw new Error('offline'); })]) {
    await assert.rejects(() => account.requireOnline('https://morogue.test'));
    assert.equal(account.identity, null); assert.equal(account.token, null);
  }
});
test('game identity must match verified launcher account', async () => {
  const account = setup(async url => url.includes('/leaderboards/') ? new Response('{"id":"other"}') : good(url));
  await assert.rejects(() => account.requireOnline('https://morogue.test'), /changed/);
});
test('a dropped connection clears main-process credentials and concurrent checks share one request', async () => {
  let offline = false, calls = 0;
  const account = setup(async url => { calls++; if (offline) throw new Error('offline'); return good(url); });
  await Promise.all([account.refresh(), account.refresh()]); assert.equal(calls, 2);
  offline = true; await account.refresh(); assert.equal(account.snapshot().status, 'offline'); assert.equal(account.token, null); assert.equal(account.identity, null);
});

test('sign-out or account switching while verification is pending never publishes stale credentials', async () => {
  for (const after of [null, { access_token: 'other', user: { id: 'other-player' } }]) {
    let current = session;
    const account = setup(async url => { const response = await good(url); if (url.includes('/api/dashboard')) current = after; return response; }, async () => current);
    await assert.rejects(() => account.requireOnline());
    assert.equal(account.token, null); assert.equal(account.identity, null);
  }
});
