'use strict';
// Independent integration regressions: real retrieval + SQLite, stubbed AI only.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {DatabaseSync} = require('node:sqlite');

(async () => {
  const service = await import('../lib/wibsworth-service.mjs');
  const knowledge = await import('../lib/wibsworth-knowledge.mjs');
  const user = '11111111-1111-4111-8111-111111111111';
  const developer = '22222222-2222-4222-8222-222222222222';
  const initial = Date.UTC(2026, 9, 18, 23, 59, 30);
  const failures = [];
  let passed = 0;
  async function check(name, callback) {
    try { await callback(); passed++; console.log('PASS:', name); }
    catch (error) { failures.push({name, error: error.message}); console.error('FAIL:', name, error.message); }
  }
  function fixture({duringRetrieval} = {}) {
    const sql = new DatabaseSync(':memory:');
    sql.exec('CREATE TABLE community_roles(user_id TEXT PRIMARY KEY,role TEXT);');
    sql.prepare('INSERT INTO community_roles VALUES(?,?)').run(developer, 'Developer');
    sql.exec(fs.readFileSync(path.join(__dirname, '../dashboard-wibsworth-schema.sql'), 'utf8'));
    let now = initial, calls = 0, messages;
    const db = {withSession() { return this; }, prepare(query) {
      const bind = (...args) => ({
        first: async () => sql.prepare(query).get(...args) || null,
        all: async () => ({results: sql.prepare(query).all(...args)}),
        run: async () => ({meta: sql.prepare(query).run(...args)})
      });
      return {bind, ...bind()};
    }};
    const env = {DASHBOARD_DB: db, WIBSWORTH_AI_ENABLED: 'true', AI: {async run(model, input) { calls++; messages = input.messages; return {response: 'Verified answer.'}; }}};
    const handler = service.createWibsworthHandler({config: {}, clock: () => now,
      identify: async request => ({id: request.headers.get('Authorization') === 'Bearer developer' ? developer : user, name: 'reviewer'}),
      isCanonicalProduct: knowledge.isCanonicalProduct,
      retrieveKnowledge: async input => { if (duringRetrieval) now = duringRetrieval(now); return knowledge.retrieveKnowledge(input); }
    });
    async function request(route, body, who = 'user') {
      const response = await handler({env, params: {path: [route]}, request: new Request('https://repocompany.uk/api/wibsworth/' + route, {
        method: body === undefined ? 'GET' : 'POST', headers: {Authorization: 'Bearer ' + who, ...(body === undefined ? {} : {'Content-Type': 'application/json'})},
        ...(body === undefined ? {} : {body: JSON.stringify(body)})
      })});
      return {status: response.status, body: await response.json()};
    }
    return {request, sql, env, get calls() { return calls; }, get messages() { return messages; }, get now() { return now; }, close() { sql.close(); }};
  }

  await check('real Morogue best-build evidence fits the guarded provider request', async () => {
    const f = fixture(); try {
      const response = await f.request('chat', {question: 'What are the best combos in Morogue?'});
      assert.equal(response.status, 200, JSON.stringify(response.body));
      assert.equal(f.calls, 1, 'Real evidence must reach the stubbed provider');
      const reference = f.messages.find(message => message.content.startsWith('Verified reference data'));
      const evidence = JSON.parse(reference.content.slice(reference.content.indexOf('\n') + 1));
      assert.equal(evidence.calculations.find(item => item.id === 'finisher').stats.mainFinisherMultiplier, 1.625);
      assert.equal(evidence.calculations.find(item => item.id === 'special').stats.perChargeSeconds, 10.4);
    } finally { f.close(); }
  });
  await check('reservation timestamps are refreshed after asynchronous retrieval', async () => {
    const f = fixture({duringRetrieval: now => now + 120000}); try {
      const response = await f.request('chat', {question: 'How does Glass Pepper work in Morogue?'});
      assert.equal(response.status, 200, JSON.stringify(response.body));
      const row = f.sql.prepare('SELECT day,created_at,lease_until FROM wibsworth_requests').get();
      assert.equal(row.day, '2026-10-19', 'The provider is called after midnight; reserve the current day');
      assert.equal(row.created_at, f.now);
      assert.ok(row.lease_until > f.now, 'Admission must not create an already-expired active lease');
    } finally { f.close(); }
  });
  await check('pricing expiry is rechecked immediately before inference', async () => {
    const f = fixture({duringRetrieval: () => service.PRICING_VALID_UNTIL + 1}); try {
      const response = await f.request('chat', {question: 'How does Glass Pepper work in Morogue?'});
      assert.equal(response.status, 503, JSON.stringify(response.body));
      assert.equal(f.calls, 0);
    } finally { f.close(); }
  });
  await check('noncanonical corrections cannot become unfindable approved facts', async () => {
    const f = fixture(); try {
      assert.equal((await f.request('correction', {product: 'Morogue', text: 'Incorrectly cased ID', sourceUrl: 'https://repocompany.uk/Morogue'})).status, 400);
      const proposed = await f.request('correction', {product: 'morogue', text: 'Reviewed canonical-correction-marker for Morogue Glass Pepper.', sourceUrl: 'https://repocompany.uk/Morogue'});
      assert.equal(proposed.status, 200, JSON.stringify(proposed.body));
      assert.equal(f.sql.prepare('SELECT product FROM wibsworth_corrections').get().product, 'morogue');
      assert.equal((await f.request('review', {id: proposed.body.id, action: 'approve', spoiler: true}, 'developer')).status, 200);
      assert.equal((await f.request('chat', {question: 'How does Glass Pepper work in Morogue?', spoilers: true})).status, 200);
      assert.ok(f.messages.some(message => message.content.includes('canonical-correction-marker')));
    } finally { f.close(); }
  });
  await check('real retriever excludes unsupported launcher statistics before calling the model', async () => {
    const f = fixture(); try {
      const response = await f.request('chat', {question: 'What are the best combos in Morogue?', platform: 'launcher', gameVersion: '0.1.0-preview.4'});
      assert.equal(response.status, 200);
      assert.equal(f.calls, 0);
      assert.match(response.body.answer, /not been verified|web game only/i);
    } finally { f.close(); }
  });
  await check('spoiler-bearing approved history is gated by real retrieval', async () => {
    const f = fixture(); try {
      const response = await f.request('chat', {question: 'Who won the Repo Sports World Cup?', spoilers: false});
      assert.equal(response.status, 200);
      assert.equal(response.body.needsSpoilerConsent, true);
      assert.equal(f.calls, 0);
      assert.ok(!JSON.stringify(response.body).includes('Rovarn'));
    } finally { f.close(); }
  });
  console.log(passed + ' independent Wibsworth integration checks passed; ' + failures.length + ' failed. No inference or external requests.');
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
