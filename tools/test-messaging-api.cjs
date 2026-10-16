'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { randomUUID } = require('node:crypto');
const root = path.resolve(__dirname, '..');
async function loadAPI({ callsEnabled = true } = {}) {
  const source = fs.readFileSync(path.join(root, 'functions/api/social/[[path]].js'), 'utf8').replace("import config from '../../../dashboard-config.json';", "const config=" + JSON.stringify({url:'https://auth.test',key:'test-public-key',socialCallsEnabled:callsEnabled}) + ";");
  return (await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))).onRequest;
}
function makeDatabase() {
  const sql = new DatabaseSync(':memory:');
  for (const file of ['dashboard-social-schema.sql', 'dashboard-messaging-schema.sql', 'dashboard-chat-extras-schema.sql']) sql.exec(fs.readFileSync(path.join(root, file), 'utf8'));
  const hooks = { beforeQuery: null };
  const prepare = (query, values = []) => {
    const execute = method => { hooks.beforeQuery?.(query, values); return sql.prepare(query)[method](...values); };
    return { bind: (...values) => prepare(query, values), async first() { return execute('get') || null; }, async all() { return { results: execute('all') }; }, async run() { return execute('run'); }, runSync: () => execute('run') };
  };
  const db = { prepare, withSession: () => db, async batch(statements) { sql.exec('BEGIN'); try { const result = statements.map(statement => statement.runSync()); sql.exec('COMMIT'); return result; } catch (error) { sql.exec('ROLLBACK'); throw error; } } };
  return { sql, db, hooks };
}
async function createFixture(options) {
  const { sql, db, hooks } = makeDatabase(), handler = await loadAPI(options);
  // Deliberately give usernames and UUIDs different sort orders.
  const users = { alice: '33333333-3333-4333-8333-333333333333', bob: '11111111-1111-4111-8111-111111111111', carol: '22222222-2222-4222-8222-222222222222', mallory: '44444444-4444-4444-8444-444444444444' };
  for (const [username, uuid] of Object.entries(users)) sql.prepare('INSERT INTO dashboard_players(username,user_id,display_name) VALUES(?,?,?)').run(username, uuid, username);
  for (const [a, b] of [['alice', 'bob'], ['alice', 'carol'], ['bob', 'carol']]) sql.prepare("INSERT INTO dashboard_friendships VALUES(?,?,?,'accepted',?)").run(a, b, a, Date.now());
  const env = { DASHBOARD_DB: db, SOCIAL_TURN_KEY_ID: 'test-key', SOCIAL_TURN_KEY_API_TOKEN: 'test-server-only-secret' };
  const requests = [];
  const fetch = async (url, options = {}) => {
    requests.push({ url, method: options.method });
    if (url.startsWith('https://rtc.live.cloudflare.com/')) return Response.json({ iceServers: [{ urls: ['stun:stun.cloudflare.com:3478'] }, { urls: ['turn:turn.cloudflare.com:3478?transport=udp'], username: 'ephemeral-user', credential: 'ephemeral-credential' }] }, { status: 201 });
    const token = options.headers?.Authorization?.slice(7), uuid = users[token];
    if (!uuid) return Response.json({}, { status: 401 });
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: uuid });
    if (url.endsWith('/get_my_character')) return Response.json([{ username: token }]);
    throw Error('Unexpected fixture upstream URL');
  };
  const call = async (who, route, body, extra = {}) => {
    const url = 'https://repo.test/api/social/' + route;
    const response = await handler({ env, params: { path: new URL(url).pathname.slice('/api/social/'.length).split('/') }, request: new Request(url, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: 'Bearer ' + who, Origin: 'https://repo.test', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extra.headers }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) }) });
    return { status: response.status, body: await response.json() };
  };
  return { handler, sql, db, hooks, users, env, fetch, call, requests, close: () => sql.close() };
}
async function run() {
  const realFetch = global.fetch;
  async function fixture(test, options) { const f = await createFixture(options); global.fetch = f.fetch; try { await test(f); } finally { f.close(); global.fetch = realFetch; } }
  const send = (f, who = 'alice', username = 'bob', text = 'Hello', clientId = randomUUID()) => f.call(who, 'messages', { username, text, clientId });
  const start = (f, who = 'alice', username = 'bob', clientId = randomUUID()) => f.call(who, 'calls', { username, kind: 'audio', clientId });
  const signal = (f, who, callId, type, data, clientId = randomUUID()) => f.call(who, 'calls/' + callId + '/signals', { type, data, clientId });
  await fixture(async f => {
    const first=(await send(f)).body.message;
    const conversationId=f.sql.prepare('SELECT conversation_id FROM social_messages WHERE id=?').get(first.id).conversation_id;
    const insert=f.sql.prepare('INSERT INTO social_messages(conversation_id,sender_id,sender_name,client_id,text,created_at) VALUES(?,?,?,?,?,?)');
    for(let n=0;n<120;n++)insert.run(conversationId,f.users.bob,'bob',randomUUID(),'Message '+n,Date.now());
    const cursor=f.sql.prepare('SELECT MAX(id) id FROM social_messages').get().id;
    assert.equal((await f.call('alice','reactions',{messageId:cursor,emote:'moratales-love'})).status,200);
    const last=Number(insert.run(conversationId,f.users.bob,'bob',randomUUID(),'After the full reaction window',Date.now()).lastInsertRowid);
    const page=await f.call('alice','messages?username=bob&after='+cursor+'&limit=100&refresh=1');
    assert.deepEqual(page.body.messages.map(m=>m.id),[last]);
    assert.equal(page.body.refreshed.length,100);
    assert.equal(page.body.refreshed.find(m=>m.id===cursor).reactions[0].emote,'wibs-love');
    assert.equal((await f.call('mallory','reactions',{messageId:last,emote:'morogue-up'})).status,404);
    for(let n=0;n<39;n++)assert.equal((await f.call('alice','reactions',{messageId:cursor,emote:'manager-up'})).status,200);
    assert.equal((await f.call('alice','reactions',{messageId:cursor,emote:null})).status,429);
  });
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'dashboard-config.json'), 'utf8')).socialCallsEnabled, false, 'Production calling stays explicitly disabled.');
  await fixture(async f => {
    const inbox = await f.call('alice', 'inbox');
    assert.equal(inbox.body.iceConfigured, false); assert.equal(inbox.body.call, null);
    assert.equal((await start(f)).status, 503);
    assert.equal((await f.call('alice', 'ice?callId=' + randomUUID())).status, 503);
    assert.equal((await f.call('alice', 'calls/' + randomUUID() + '/signals', {clientId:randomUUID(),type:'ice',data:null})).status, 503);
    assert.equal((await send(f)).status, 200, 'Disabling calls does not disable messaging.');
    assert.equal(f.requests.some(request => request.url.startsWith('https://rtc.live.cloudflare.com/')), false, 'No relay credential request even when credentials are present.');
    assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM social_calls').get().n, 0);
  }, {callsEnabled:false});
  await fixture(async f => {
    assert.equal((await f.call('invalid', 'inbox')).status, 401);
    assert.equal((await f.call('alice', 'inbox', undefined, { headers: { Origin: 'https://evil.test' } })).status, 403);
    assert.equal((await send(f, 'alice', 'mallory')).status, 403);
    assert.equal((await f.call('alice', 'messages', { username: 'bob', text: 'hello', clientId: randomUUID(), sender: 'bob' })).status, 400);
    assert.equal((await f.call('alice', 'messages', 'x'.repeat(65537))).status, 413);
    f.sql.prepare("UPDATE dashboard_friendships SET status='pending' WHERE player_a='alice' AND player_b='bob'").run();
    assert.equal((await send(f)).status, 403);
    assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM social_messages').get().n, 0);
  });
  await fixture(async f => {
    const clientId = randomUUID(), results = await Promise.all([send(f, 'alice', 'bob', 'Hello', clientId), send(f, 'alice', 'bob', 'Hello', clientId)]);
    assert.deepEqual(results.map(r => r.status), [200, 200]); assert.equal(results[0].body.message.id, results[1].body.message.id);
    assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM social_messages').get().n, 1);
    assert.equal((await send(f, 'alice', 'carol', 'Hello', clientId)).status, 409);
    assert.equal((await send(f, 'alice', 'bob', 'changed', clientId)).status, 409);
    let inbox = await f.call('bob', 'inbox'); assert.equal(inbox.body.totalUnread, 1);
    const firstId = results[0].body.message.id;
    assert.equal((await f.call('bob', 'read', { username: 'alice', messageId: firstId })).status, 200);
    assert.equal((await f.call('bob', 'inbox')).body.totalUnread, 0);
    assert.equal((await f.call('alice', 'messages?username=bob')).body.peerReadThrough, firstId);
    const carol = await send(f, 'carol', 'alice', 'Other thread');
    assert.equal((await f.call('bob', 'read', { username: 'alice', messageId: carol.body.message.id })).status, 404);
    for (let n = 0; n < 4; n++) await send(f, 'alice', 'bob', 'Message ' + n);
    const latest = await f.call('bob', 'messages?username=alice&limit=2'); assert.equal(latest.body.messages.length, 2); assert.equal(latest.body.hasMore, true);
    const older = await f.call('bob', 'messages?username=alice&limit=2&before=' + latest.body.nextCursor);
    assert.ok(older.body.messages.at(-1).id < latest.body.messages[0].id);
    const poll = await f.call('bob', 'messages?username=alice&after=' + firstId); assert.equal(poll.body.messages.length, 4);
    // Identical timestamps never skip inbox rows: cursor is last message ID.
    f.sql.prepare('UPDATE social_conversations SET updated_at=1').run();
    const page = await f.call('alice', 'inbox?limit=1'), page2 = await f.call('alice', 'inbox?limit=1&before=' + page.body.nextCursor);
    assert.equal(page.body.totalUnread, 1); assert.equal(page2.body.totalUnread, 1); assert.notEqual(page.body.conversations[0].id, page2.body.conversations[0].id);
  });
  await fixture(async f => {
    await send(f);
    // Change the friendship after authorization but immediately before writing.
    f.hooks.beforeQuery = query => { if (query.startsWith('INSERT INTO social_messages')) { f.hooks.beforeQuery = null; f.sql.prepare("DELETE FROM dashboard_friendships WHERE player_a='alice' AND player_b='bob'").run(); } };
    assert.equal((await send(f, 'alice', 'bob', 'must not save')).status, 403);
    assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM social_messages').get().n, 1);
    assert.equal((await f.call('alice', 'messages?username=bob')).status, 403);
    assert.equal((await f.call('bob', 'inbox')).body.conversations.length, 0);
  });
  await fixture(async f => {
    const attempts = await Promise.all([start(f, 'alice', 'bob'), start(f, 'carol', 'bob')]);
    assert.deepEqual(attempts.map(r => r.status).sort(), [200, 409]);
    const c = attempts.find(r => r.status === 200).body.call, caller = c.caller;
    assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM social_call_slots').get().n, 2);
    assert.equal((await f.call('mallory', 'calls/' + c.id)).status, 404);
    assert.equal((await f.call(caller, 'calls/' + c.id, { action: 'accept' })).status, 403);
    assert.equal((await signal(f, caller, c.id, 'offer', { type: 'offer', sdp: 'v=0\r\n' })).status, 409);
    assert.equal((await f.call('bob', 'calls/' + c.id, { action: 'accept' })).body.call.status, 'active');
    assert.equal((await signal(f, 'bob', c.id, 'answer', { type: 'answer', sdp: 'v=0\r\n' })).status, 409);
    const offer = { type: 'offer', sdp: 'v=0\r\no=fixture-private-sdp\r\n' }, clientId = randomUUID();
    const posts = await Promise.all([signal(f, caller, c.id, 'offer', offer, clientId), signal(f, caller, c.id, 'offer', offer, clientId)]);
    assert.deepEqual(posts.map(p => p.status), [200, 200]); assert.equal(posts[0].body.id, posts[1].body.id);
    assert.equal((await signal(f, 'bob', c.id, 'offer', offer)).status, 403);
    assert.equal((await signal(f, 'bob', c.id, 'answer', { type: 'answer', sdp: 'v=0\r\n' })).status, 200);
    const signals = await f.call('bob', 'calls/' + c.id + '/signals?after=0'); assert.equal(signals.body.signals.length, 1); assert.deepEqual(signals.body.signals[0].data, offer);
    assert.equal((await f.call('bob', 'calls/' + c.id + '/signals?after=' + signals.body.nextCursor)).body.signals.length, 0);
    const unauthorized = await f.call('mallory', 'calls/' + c.id + '/signals'); assert.equal(unauthorized.status, 404); assert.ok(!JSON.stringify(unauthorized).includes('fixture-private-sdp'));
    const ice = await f.call('bob', 'ice?callId=' + c.id); assert.equal(ice.status, 200); assert.equal(ice.body.iceTransportPolicy, 'relay'); assert.equal(ice.body.iceServers.length, 1);
    assert.ok(!JSON.stringify(ice).includes(f.env.SOCIAL_TURN_KEY_API_TOKEN));
    assert.equal((await f.call(caller, 'calls/' + c.id, { action: 'end' })).body.call.status, 'ended');
    assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM social_signals').get().n, 0); assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM social_call_slots').get().n, 0);
    assert.equal((await f.call('bob', 'ice?callId=' + c.id)).status, 409);
  });
  await fixture(async f => {
    const key = randomUUID(), copies = await Promise.all([start(f, 'alice', 'bob', key), start(f, 'alice', 'bob', key)]);
    assert.deepEqual(copies.map(r => r.status), [200, 200]); assert.equal(copies[0].body.call.id, copies[1].body.call.id);
    const c = copies[0].body.call; await f.call('bob', 'calls/' + c.id, { action: 'accept' });
    f.sql.prepare('UPDATE social_calls SET callee_seen=?,expires_at=? WHERE id=?').run(Date.now() - 25000, Date.now() + 5000, c.id);
    const heartbeat = await f.call('alice', 'calls/' + c.id, { action: 'heartbeat' }); assert.ok(heartbeat.body.call.expiresAt < Date.now() + 6000, 'One peer cannot renew an absent peer indefinitely');
    f.sql.prepare('UPDATE social_calls SET expires_at=? WHERE id=?').run(Date.now() - 1, c.id);
    assert.equal((await f.call('alice', 'calls/' + c.id)).body.call.reason, 'timeout');
    assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM social_call_slots').get().n, 0);
    const next = (await start(f)).body.call; await f.call('bob', 'calls/' + next.id, { action: 'accept' });
    assert.equal((await f.call('bob', 'calls/' + next.id, { action: 'reject' })).status, 409, 'An accepted call cannot be declined by a stale ringing notification');
    f.sql.prepare("INSERT INTO dashboard_blocks(blocker,blocked) VALUES('bob','alice')").run();
    assert.equal((await f.call('alice', 'calls/' + next.id)).status, 404);
    assert.equal((await f.call('bob', 'calls/' + next.id + '/signals')).status, 404);
    assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM social_call_slots').get().n, 0);
  });
  await fixture(async f => {
    await send(f); f.sql.prepare("UPDATE dashboard_players SET user_id=? WHERE username='bob'").run('55555555-5555-4555-8555-555555555555');
    assert.equal((await f.call('bob', 'inbox')).status, 409, 'A renamed/reassigned player mapping cannot transfer old private messages');
    assert.equal((await f.call('alice', 'messages?username=bob')).body.messages.length, 0);
    delete f.env.SOCIAL_TURN_KEY_API_TOKEN;
    assert.equal((await f.call('alice', 'inbox')).body.iceConfigured, false);
    assert.equal((await start(f, 'alice', 'carol')).status, 503);
    assert.equal((await send(f, 'alice', 'carol')).status, 200, 'Text messaging does not require TURN');
  });
  await fixture(async f => {
    const c = (await start(f)).body.call;
    assert.equal((await f.call('bob', 'ice?callId=' + c.id)).status, 409);
    assert.equal((await f.call('bob', 'calls/' + c.id, { action: 'reject' })).body.call.status, 'rejected');
    assert.equal((await f.call('bob', 'calls/' + c.id, { action: 'accept' })).status, 409);
    const next = (await start(f)).body.call; await f.call('bob', 'calls/' + next.id, { action: 'accept' });
    assert.equal((await signal(f, 'alice', next.id, 'offer', { type: 'offer', sdp: 'v=0' + 'x'.repeat(32768) })).status, 400);
    assert.equal((await signal(f, 'alice', next.id, 'ice', { candidate: 'not a candidate' })).status, 400);
    assert.equal((await signal(f, 'alice', next.id, 'ice', { candidate: '', sdpMLineIndex: -1 })).status, 400);
    assert.equal((await signal(f, 'alice', next.id, 'ice', null)).status, 200);
    assert.equal((await f.call('bob', 'calls/' + next.id + '/signals?after=-1')).status, 400);
    // A friendship revoked while TURN generation is in flight never receives
    // the already-created ephemeral credentials in the response.
    global.fetch = async (url, options) => {
      const response = await f.fetch(url, options);
      if (url.startsWith('https://rtc.live.cloudflare.com/')) f.sql.prepare("DELETE FROM dashboard_friendships WHERE player_a='alice' AND player_b='bob'").run();
      return response;
    };
    const ice = await f.call('alice', 'ice?callId=' + next.id);
    assert.equal(ice.status, 404); assert.ok(!JSON.stringify(ice).includes('ephemeral-credential'));
    assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM social_signals').get().n, 0);
    assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM social_call_slots').get().n, 0);
  });
  await fixture(async f => {
    const c = (await start(f)).body.call; await f.call('bob', 'calls/' + c.id, { action: 'accept' });
    f.sql.prepare("UPDATE dashboard_players SET user_id=? WHERE username='bob'").run('55555555-5555-4555-8555-555555555555');
    assert.equal(f.sql.prepare('SELECT status,reason FROM social_calls WHERE id=?').get(c.id).reason, 'account-changed');
    assert.equal((await f.call('alice', 'calls/' + c.id)).status, 404);
    assert.equal(f.sql.prepare('SELECT COUNT(*) AS n FROM social_call_slots').get().n, 0);
  });
  await fixture(async f => {
    for (let n = 0; n < 30; n++) assert.equal((await send(f, 'alice', 'bob', String(n))).status, 200);
    assert.equal((await send(f, 'alice', 'bob', 'too fast')).status, 429);
  });
  console.log('PASS: authenticated friends-only messages, pagination, read ownership, retries/races, immutable identity, call concurrency/signaling/expiry/block revocation, TURN boundaries and rate/body limits.');
}
module.exports = { loadAPI, makeDatabase, createFixture };
if (require.main === module) run().catch(error => { console.error(error); process.exitCode = 1; });
