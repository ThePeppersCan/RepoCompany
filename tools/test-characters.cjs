'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');

(async () => {
  const root = path.resolve(__dirname, '..');
  const source = fs.readFileSync(path.join(root, 'functions/api/characters/[[path]].js'), 'utf8').replace("import config from '../../../dashboard-config.json';", "const config={url:'https://auth.test',key:'public'};");
  const { onRequest } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const sql = new DatabaseSync(':memory:');
  sql.exec(fs.readFileSync(path.join(root, 'dashboard-characters-schema.sql'), 'utf8'));
  const prepare = (query, args = []) => ({ bind(...next) { return prepare(query, next); }, async first() { return sql.prepare(query).get(...args) || null; } });
  const env = { DASHBOARD_DB: { prepare } };
  const users = { alice: '11111111-2222-4333-8444-555555555555', bob: '66666666-7777-4888-8999-aaaaaaaaaaaa' };
  const originalFetch = global.fetch;
  let authCalls = 0;
  global.fetch = async (url, options) => {
    authCalls++;
    assert.equal(url, 'https://auth.test/auth/v1/user');
    assert.equal(options.headers.apikey, 'public');
    assert.ok(options.signal instanceof AbortSignal);
    const token = options.headers.Authorization.slice(7);
    if (token === 'offline') throw Error('Unavailable');
    if (token === 'service-error') return Response.json({}, { status: 503 });
    if (token === 'anonymous') return Response.json({ id: users.alice, is_anonymous: true });
    if (token === 'invalid-id') return Response.json({ id: 'not-a-uuid' });
    return users[token] ? Response.json({ id: users[token] }) : Response.json({}, { status: 401 });
  };
  const character = (id = 'slot-0', name = 'Nora') => ({ id, name, look: { name, skin: 'honey', hair: 'f14', hair_colour: 'dark-brown', shirt: 'shirt_linen', hat: 'none' } });
  async function call(who = 'alice', body, options = {}) {
    const method = options.method || (body === undefined ? 'GET' : 'PUT');
    const headers = { 'Content-Type': 'application/json', ...(who ? { Authorization: 'Bearer ' + who } : {}), ...(options.origin === null ? {} : { Origin: options.origin || 'https://repo.test' }), ...options.headers };
    const request = new Request('https://repo.test/api/characters/' + (options.route || 'moratales') + (options.query || ''), { method, headers, ...(body === undefined ? {} : { body: options.raw ? body : JSON.stringify(body) }) });
    const response = await onRequest({ request, env: options.env || env, params: { path: options.route || ['moratales'] } });
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
    return { status: response.status, body: await response.json() };
  }
  try {
    let result = await call('alice', undefined, { origin: null });
    assert.deepEqual(result, { status: 200, body: { userId: users.alice, revision: 0, characters: [], updatedAt: null } });
    for (const who of [null, 'bad', 'anonymous', 'invalid-id']) assert.equal((await call(who)).status, 401);
    for (const who of ['offline', 'service-error']) assert.equal((await call(who)).status, 503);
    assert.equal((await call('alice', undefined, { env: {} })).status, 503);
    const beforeDenied = authCalls;
    for (const origin of ['https://evil.test', 'https://repo.test.evil.test', 'null']) {
      assert.equal((await call('alice', undefined, { origin })).status, 403);
      assert.equal((await call('alice', { revision: 0, characters: [] }, { origin })).status, 403);
    }
    assert.equal((await call('alice', { revision: 0, characters: [] }, { origin: null })).status, 403);
    assert.equal((await call('alice', undefined, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
    assert.equal(authCalls, beforeDenied, 'cross-origin requests never reach account verification');
    assert.equal((await call('alice', undefined, { route: 'morogue' })).status, 404);
    assert.equal((await call('alice', undefined, { method: 'DELETE' })).status, 405);
    assert.equal((await call('alice', undefined, { headers: { Authorization: 'Bearer ' + 'x'.repeat(16385) } })).status, 401);

    result = await call('alice', { revision: 0, characters: [character()] });
    assert.equal(result.status, 200); assert.equal(result.body.revision, 1);
    assert.equal(result.body.userId, users.alice); assert.deepEqual(result.body.characters, [character()]);
    assert.ok(Number.isSafeInteger(result.body.updatedAt));
    assert.deepEqual((await call('alice', undefined, { query: '?userId=' + users.bob })).body, result.body, 'query parameters never select another account');
    assert.deepEqual((await call('bob')).body.characters, []);
    assert.equal((await call('alice', { revision: 1, userId: users.bob, characters: [] })).status, 400);
    const bob = await call('bob', { revision: 0, characters: [character('current', 'Theo')] }, { method: 'POST' });
    assert.equal(bob.status, 200); assert.deepEqual((await call('alice')).body.characters, [character()]);

    const invalid = [
      null, [], {}, { revision: '1', characters: [] }, { revision: -1, characters: [] }, { revision: 1.5, characters: [] },
      { revision: Number.MAX_SAFE_INTEGER, characters: [] }, { revision: 1, characters: null }, { revision: 1, saves: {}, characters: [] },
      { revision: 1, characters: [character(), character()] }, { revision: 1, characters: Array.from({ length: 5 }, (_, i) => character('slot-' + i)) },
      ...['survivor', 'cafe-slot-0', 'slot-3', '../slot-0', '__proto__', ['current'], null, 1].map(id => ({ revision: 1, characters: [character(id)] })),
      ...['', ' ', 'a'.repeat(33), 'Nora\nName'].map(name => ({ revision: 1, characters: [character('slot-0', name)] })),
      { revision: 1, characters: [{ ...character(), entries: {} }] },
      ...[null, [], {}, { skin: 'honey' }, { hair: 'f14' }, { skin: '', hair: 'f14' }, { skin: 1, hair: 'f14' },
        { skin: 'honey', hair: 'f14', name: 'Other' }, { skin: 'honey', hair: 'f14', inventory: {} },
        { skin: 'honey', hair: 'https://evil.test/sprite' }, { skin: 'honey', hair: 'a'.repeat(81) },
        { skin: 'honey', hair: 'f14', shirt: null }].map(look => ({ revision: 1, characters: [{ ...character(), look }] }))
    ];
    for (const body of invalid) assert.equal((await call('alice', body)).status, 400, JSON.stringify(body));
    assert.equal((await call('alice', '{"revision":1,"characters":[],"__proto__":{}}', { raw: true })).status, 400);
    assert.equal((await call('alice', '{bad json', { raw: true })).status, 400);
    assert.equal((await call('alice', ' '.repeat(16385), { raw: true })).status, 413, 'stream size is bounded without Content-Length');
    assert.equal((await call('alice', '{}', { raw: true, headers: { 'Content-Length': '16385' } })).status, 413);
    assert.equal((await call('alice', { revision: 1, characters: [] }, { headers: { 'Content-Type': 'text/plain' } })).status, 415);
    assert.deepEqual((await call('alice')).body.characters, [character()], 'invalid writes leave the last revision untouched');

    const all = ['slot-0', 'slot-1', 'slot-2', 'current'].map(id => character(id));
    result = await call('alice', { revision: 1, characters: all });
    assert.equal(result.status, 200); assert.equal(result.body.revision, 2); assert.deepEqual(result.body.characters, all);
    const conflict = await call('alice', { revision: 1, characters: [] });
    assert.equal(conflict.status, 409); assert.equal(conflict.body.code, 'revision_conflict');
    assert.deepEqual(conflict.body.current, result.body);
    assert.equal((await call('alice', { revision: 0, characters: [] })).status, 409);

    const competing = await Promise.all([
      call('alice', { revision: 2, characters: [character('current', 'First')] }),
      call('alice', { revision: 2, characters: [character('current', 'Second')] })
    ]);
    assert.deepEqual(competing.map(value => value.status).sort(), [200, 409]);
    assert.equal((await call('alice')).body.revision, 3);
    result = await call('alice', { revision: 3, characters: [] });
    assert.equal(result.status, 200); assert.equal(result.body.revision, 4); assert.deepEqual(result.body.characters, []);
    assert.equal(sql.prepare('SELECT revision FROM dashboard_moratales_characters WHERE user_id=?').get(users.alice).revision, 4, 'clear retains a conflict tombstone');
    assert.equal((await call('alice', { revision: 3, characters: [character()] })).status, 409);
    assert.equal((await call('alice', { revision: 0, characters: [character()] })).status, 409);
    assert.deepEqual((await call('bob')).body, bob.body, 'another account and revision remain unchanged');
    assert.equal(sql.prepare('SELECT count(*) AS n FROM dashboard_moratales_characters').get().n, 2);
    sql.exec('DELETE FROM dashboard_moratales_characters WHERE user_id=\'' + users.bob + '\'');
    assert.equal((await call('bob', { revision: 1, characters: [character()] })).status, 409, 'a stale nonzero revision cannot create a missing record');
    const empty = await call('bob', { revision: 0, characters: [] });
    assert.equal(empty.status, 200); assert.equal(empty.body.revision, 1);
    console.log('PASS: account-owned Moratales appearances, strict validation, bounded bodies, origin/auth checks, atomic conflicts and empty-list tombstones.');
  } finally { global.fetch = originalFetch; sql.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
