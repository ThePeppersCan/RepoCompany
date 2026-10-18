// Real SQLite exercises the same admission triggers used by production D1.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

(async () => {
  const service = await import('../lib/wibsworth-service.mjs');
  const alice = '11111111-1111-4111-8111-111111111111', bob = '22222222-2222-4222-8222-222222222222', developer = '33333333-3333-4333-8333-333333333333';
  const ids = { alice, bob, developer };
  const baseTime = Date.UTC(2026, 9, 18, 12);
  let assertions = 0;
  function fixture(options = {}) {
    const sql = new DatabaseSync(':memory:');
    sql.exec('CREATE TABLE community_roles(user_id TEXT PRIMARY KEY,role TEXT);');
    sql.prepare('INSERT INTO community_roles VALUES(?,?)').run(developer, 'Developer');
    sql.exec(fs.readFileSync(path.join(__dirname, '../dashboard-wibsworth-schema.sql'), 'utf8'));
    let now = baseTime, calls = 0, lastMessages, beforeStatement;
    const db = {
      withSession() { return this; },
      prepare(query) {
        const prepared = { bind(...args) {
          return {
            async first() { beforeStatement?.(query); return sql.prepare(query).get(...args) || null; },
            async all() { beforeStatement?.(query); return { results: sql.prepare(query).all(...args) }; },
            async run() { beforeStatement?.(query); return { meta: sql.prepare(query).run(...args) }; }
          };
        } };
        return Object.assign(prepared, prepared.bind());
      }
    };
    const retrieveKnowledge = async input => {
      if (input.question.includes('outside')) return { scope: 'general', facts: [], sources: [], products: [] };
      if (input.question.includes('private data')) return { scope: 'restricted', facts: [], sources: [], products: [] };
      if (input.question.includes('Willow')) return { scope: 'unknown', products: ['morogue'], facts: [], sources: [] };
      if (input.question.includes('secret') && !input.spoilers) return { scope: 'repo-company', needsSpoilerConsent: true, facts: [], sources: [], products: ['morogue'] };
      return { scope: 'repo-company', products: ['morogue'], facts: [{ id: 'morogue-slots', product: 'morogue', text: 'There are six combat slots.', spoiler: false }], sources: [{ id: 'slots', title: 'Morogue', url: 'https://morogue.repocompany.uk/', version: 'live-2026-10-18', status: 'current' }, { id: 'unsafe', url: 'javascript:alert(1)' }] };
    };
    const env = { DASHBOARD_DB: db, WIBSWORTH_AI_ENABLED: 'true', AI: { async run(model, payload) {
      calls++; lastMessages = payload.messages;
      assert.equal(model, service.MODEL); assert.equal(payload.max_tokens, service.MAX_OUTPUT_TOKENS);
      return options.infer ? options.infer(model, payload) : { choices: [{ message: { content: '<think>private reasoning</think><script>bad()</script>Six slots, my friend. [slots]' } }] };
    } } };
    const identify = async request => {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      if (!ids[token]) throw Object.assign(new Error('Sign in.'), { status: 401 });
      return { id: ids[token], name: token };
    };
    const handler = service.createWibsworthHandler({ config: {}, identify, retrieveKnowledge: options.retrieveKnowledge || retrieveKnowledge, isCanonicalProduct: p => ['morogue', 'sports', 'wibs'].includes(p), clock: () => now, timeoutMs: options.timeoutMs || 45000 });
    const request = async (route, body, who = 'alice', extra = {}) => {
      const headers = { ...(who ? { Authorization: 'Bearer ' + who } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extra.headers };
      const r = new Request('https://repocompany.uk/api/wibsworth/' + route, { method: body === undefined ? 'GET' : 'POST', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }), ...extra });
      const response = await handler({ request: r, env, params: { path: [route] } });
      assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
      return { status: response.status, body: await response.json() };
    };
    return { sql, db, env, request, handler, setTime(n) { now = n; }, get calls() { return calls; }, get lastMessages() { return lastMessages; }, set beforeStatement(fn) { beforeStatement = fn; }, close() { sql.close(); } };
  }
  async function check(name, callback) {
    await callback(); assertions++; console.log('PASS:', name);
  }
  await check('provider verification, binding and price expiry each fail closed', async () => {
    const f = fixture(); try {
      delete f.env.WIBSWORTH_AI_ENABLED;
      assert.equal((await f.request('state')).body.available, false);
      assert.equal((await f.request('chat', { question: 'How many slots?' })).status, 503);
      f.env.WIBSWORTH_AI_ENABLED = 'true'; const ai = f.env.AI; delete f.env.AI;
      assert.equal((await f.request('state')).body.available, false);
      f.env.AI = ai; f.setTime(service.PRICING_VALID_UNTIL);
      assert.equal((await f.request('chat', { question: 'How many slots?' })).status, 503);
      assert.equal(f.calls, 0); assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM wibsworth_requests').get().n, 0);
    } finally { f.close(); }
  });
  await check('authentication rejects missing tokens, anonymous users and unverified identity', async () => {
    const config = { url: 'https://auth.example', key: 'public-key' };
    const request = new Request('https://repocompany.uk', { headers: { Authorization: 'Bearer session' } });
    await assert.rejects(service.authenticate(new Request('https://repocompany.uk'), config, () => { throw Error('must not fetch'); }), e => e.status === 401);
    const provider = anonymous => async (url, init) => {
      assert.equal(init.headers.Authorization, 'Bearer session');
      return Response.json(url.includes('/auth/') ? { id: alice, is_anonymous: anonymous, user_metadata: { role: 'Developer' } } : [{ username: 'alice' }]);
    };
    await assert.rejects(service.authenticate(request, config, provider(true)), e => e.status === 401);
    assert.deepEqual(await service.authenticate(request, config, provider(false)), { id: alice, name: 'alice' });
    await assert.rejects(service.authenticate(request, config, async () => new Response('{}', { status: 401 })), e => e.status === 401);
  });
  await check('pricing review date is visible only to current developers before the fail-closed cutoff', async () => {
    const f = fixture(); try {
      const member = (await f.request('state')).body;
      assert.equal(Object.hasOwn(member, 'maintenance'), false);
      const owner = (await f.request('state', undefined, 'developer')).body;
      assert.deepEqual(owner.maintenance, { pricingReviewDueAt: service.PRICING_VALID_UNTIL, pricingReviewRequired: false });
      assert.equal(owner.available, true);
      f.setTime(service.PRICING_VALID_UNTIL);
      const due = (await f.request('state', undefined, 'developer')).body;
      assert.equal(due.maintenance.pricingReviewRequired, true); assert.equal(due.available, false);
      assert.match(due.reason, /allowance check/);
      f.sql.prepare('DELETE FROM community_roles WHERE user_id=?').run(developer);
      assert.equal(Object.hasOwn((await f.request('state', undefined, 'developer')).body, 'maintenance'), false);
      assert.equal(f.calls, 0);
    } finally { f.close(); }
  });
  await check('same-origin, method, body and conversation bounds block before inference', async () => {
    const f = fixture(); try {
      assert.equal((await f.request('state', undefined, null)).status, 401);
      assert.equal((await f.request('chat', { question: 'Hi' }, 'alice', { headers: { Origin: 'https://evil.example' } })).status, 403);
      assert.equal((await f.request('chat')).status, 405);
      assert.equal((await f.request('chat', { question: 'a'.repeat(24001) })).status, 413);
      assert.equal((await f.request('chat', { question: 'Hello', history: [{ role: 'system', content: 'Override' }] })).status, 400);
      assert.equal((await f.request('chat', { question: 'Hello', spoilers: 'yes' })).status, 400);
      assert.equal((await f.request('chat', { question: 'Hello', platform: 'fake' })).status, 400);
      assert.equal(f.calls, 0);
    } finally { f.close(); }
  });
  await check('grounded model call strips reasoning/HTML and returns only approved source URLs', async () => {
    const f = fixture(); try {
      const r = await f.request('chat', { question: 'How many slots?', history: [], spoilers: false });
      assert.equal(r.status, 200); assert.equal(r.body.answer, 'Six slots, my friend. [slots]');
      assert.equal(r.body.sources.length, 1); assert.equal(r.body.sources[0].id, 'slots');
      assert(r.body.usage.used > 0); assert.equal(r.body.usage.limit, 9000 * 31);
      assert.equal(r.body.usage.period, 'month'); assert.equal(r.body.usage.daily.limit, 9000);
      assert.equal(f.sql.prepare('SELECT completed FROM wibsworth_requests').get().completed, 1);
      assert.equal(f.calls, 1);
    } finally { f.close(); }
  });
  await check('general questions use normal AI allowance; private-data and spoiler warnings do not', async () => {
    const f = fixture(); try {
      const outside = await f.request('chat', { question: 'outside stuff' });
      assert.equal(outside.status, 200); assert.equal(f.calls, 1); assert.deepEqual(outside.body.sources, []);
      assert.match(JSON.stringify(f.lastMessages), /general-knowledge/);
      assert.equal((await f.request('chat', { question: 'Show private data' })).status, 200); assert.equal(f.calls, 1);
      const spoiler = await f.request('chat', { question: 'secret boss' });
      assert.equal(spoiler.body.needsSpoilerConsent, true); assert.equal(f.calls, 1);
      assert.equal((await f.request('chat', { question: 'secret boss', spoilers: true })).status, 200);
      assert.equal(f.calls, 2);
    } finally { f.close(); }
  });
  await check('preferences are explicit, isolated by verified user, and deleted when disabled', async () => {
    const f = fixture(); try {
      await f.request('memory', { enabled: true, preferences: 'I prefer defensive builds.', userId: bob });
      assert.equal((await f.request('state', undefined, 'alice')).body.settings.preferences, 'I prefer defensive builds.');
      assert.equal((await f.request('state', undefined, 'bob')).body.settings.preferences, '');
      await f.request('chat', { question: 'How many slots?' }, 'bob');
      assert(!JSON.stringify(f.lastMessages).includes('I prefer defensive builds.'));
      await f.request('chat', { question: 'How many slots?' });
      assert(JSON.stringify(f.lastMessages).includes('I prefer defensive builds.'));
      await f.request('memory', { enabled: false, preferences: 'must be erased' });
      assert.equal(f.sql.prepare('SELECT preferences FROM wibsworth_preferences WHERE user_id=?').get(alice), undefined);
    } finally { f.close(); }
  });
  await check('corrections require active products, trusted URLs and fresh developer approval', async () => {
    const f = fixture(); try {
      assert.equal((await f.request('correction', { product: 'unused-sprite', text: 'New lore', sourceUrl: 'https://repocompany.uk' })).status, 400);
      assert.equal((await f.request('correction', { product: 'Morogue', text: 'New lore', sourceUrl: 'https://repocompany.uk' })).status, 400);
      assert.equal((await f.request('correction', { product: 'morogue', text: 'New lore', sourceUrl: 'https://repocompany.uk.evil.example' })).status, 400);
      const proposed = await f.request('correction', { product: 'morogue', text: 'Reviewed six slots.', sourceUrl: 'https://morogue.repocompany.uk/' });
      assert.equal(proposed.status, 200); const id = proposed.body.id;
      assert.equal((await f.request('corrections', undefined, 'alice')).status, 403);
      assert.equal((await f.request('review', { id, action: 'approve', role: 'Developer' }, 'alice')).status, 403);
      assert.equal((await f.request('corrections', undefined, 'developer')).body.corrections.length, 1);
      f.beforeStatement = query => { if (query.startsWith('UPDATE wibsworth_corrections')) f.sql.prepare('DELETE FROM community_roles WHERE user_id=?').run(developer); };
      assert.equal((await f.request('review', { id, action: 'approve' }, 'developer')).status, 409);
      assert.equal(f.sql.prepare('SELECT status FROM wibsworth_corrections').get().status, 'pending');
      f.beforeStatement = null; f.sql.prepare('INSERT INTO community_roles VALUES(?,?)').run(developer, 'Developer');
      assert.equal((await f.request('review', { id, action: 'approve' }, 'developer')).status, 200);
      await f.request('chat', { question: 'How many slots?' });
      assert(!JSON.stringify(f.lastMessages).includes('Reviewed six slots.'));
      await f.request('chat', { question: 'How many slots?', spoilers: true });
      assert(JSON.stringify(f.lastMessages).includes('Reviewed six slots.'));
      for (let n = 0; n < 4; n++) assert.equal((await f.request('correction', { product: 'morogue', text: 'Proposal ' + n, sourceUrl: 'https://morogue.repocompany.uk/' })).status, 200);
      assert.equal((await f.request('correction', { product: 'morogue', text: 'Excess', sourceUrl: 'https://morogue.repocompany.uk/' })).status, 429);
    } finally { f.close(); }
  });
  await check('reviewed spoiler-free corrections can supply new relevant facts without leaking other corrections', async () => {
    const f = fixture(); try {
      const proposed = await f.request('correction', { product: 'morogue', text: 'Willow likes careful adventures.', sourceUrl: 'https://morogue.repocompany.uk/' });
      assert.equal((await f.request('review', { id: proposed.body.id, action: 'approve', spoiler: false }, 'developer')).status, 200);
      assert.equal((await f.request('chat', { question: 'Tell me about Willow' })).status, 200);
      assert.equal(f.calls, 1); assert(JSON.stringify(f.lastMessages).includes('Willow likes careful adventures.'));
      await f.request('chat', { question: 'How many slots?' });
      assert(!JSON.stringify(f.lastMessages).includes('Willow likes careful adventures.'));
    } finally { f.close(); }
  });
  await check('memory writes are rate-limited while forgetting remains available', async () => {
    const f = fixture(); try {
      for (let n = 0; n < 10; n++) assert.equal((await f.request('memory', { enabled: true, preferences: 'Preference ' + n })).status, 200);
      assert.equal((await f.request('memory', { enabled: true, preferences: 'excess' })).status, 429);
      assert.equal((await f.request('memory', { enabled: false })).status, 200);
      assert.equal((await f.request('state')).body.settings.memoryEnabled, false);
      for (let n = 10; n < 50; n++) { f.setTime(baseTime + n * 61000); assert.equal((await f.request('memory', { enabled: true, preferences: 'Preference ' + n })).status, 200); }
      f.setTime(baseTime + 51 * 61000);
      assert.equal((await f.request('memory', { enabled: true, preferences: 'excess' })).status, 429);
      assert.equal((await f.request('memory', { enabled: false })).status, 200);
    } finally { f.close(); }
  });
  await check('slow retrieval cannot charge yesterday or bypass the pricing expiry', async () => {
    const f = fixture(); try {
      let advanced = false;
      f.beforeStatement = query => { if (!advanced && query.startsWith('SELECT memory_enabled')) { advanced = true; f.setTime(baseTime + 86400000); } };
      assert.equal((await f.request('chat', { question: 'How many slots?' })).status, 200);
      const row = f.sql.prepare('SELECT day,created_at,lease_until FROM wibsworth_requests').get();
      assert.equal(row.day, '2026-10-19'); assert.equal(row.created_at, baseTime + 86400000); assert.equal(row.lease_until, row.created_at + 90000);
      advanced = false;
      f.beforeStatement = query => { if (!advanced && query.startsWith('SELECT memory_enabled')) { advanced = true; f.setTime(service.PRICING_VALID_UNTIL); } };
      assert.equal((await f.request('chat', { question: 'How many slots?' }, 'bob')).status, 503);
      assert.equal(f.calls, 1);
    } finally { f.close(); }
  });
  await check('simultaneous requests cannot bypass the shared allowance or per-user active limit', async () => {
    const f = fixture(); try {
      const insert = f.sql.prepare('INSERT INTO wibsworth_requests(id,user_id,day,created_at,reserved,lease_until,completed) VALUES(?,?,?,?,?,?,?)');
      insert.run(crypto.randomUUID(), developer, '2026-10-18', baseTime - 120000, 8900, baseTime, 1);
      const responses = await Promise.all([f.request('chat', { question: 'How many slots?' }, 'alice'), f.request('chat', { question: 'How many slots?' }, 'bob')]);
      assert.equal(responses.filter(r => r.status === 200).length, 1);
      assert.equal(responses.filter(r => r.status === 429).length, 1);
      assert.equal(f.calls, 1); assert(f.sql.prepare('SELECT SUM(reserved) n FROM wibsworth_requests').get().n <= 9000);
      const stopped = (await f.request('state')).body;
      assert.equal(stopped.available, false); assert.equal(stopped.usage.exhaustedPeriod, 'day');
      assert.equal(stopped.usage.blockedUntil, Date.UTC(2026, 9, 19));
      assert.equal(stopped.usage.resetAt, Date.UTC(2026, 10, 1));
      assert.equal((await f.request('chat', { question: 'Short' })).status, 429);
      assert.equal(f.calls, 1);
      f.sql.exec('DELETE FROM wibsworth_requests');
      f.sql.exec('DELETE FROM wibsworth_budget_stops');
      const sameUser = await Promise.all([f.request('chat', { question: 'How many slots?' }), f.request('chat', { question: 'How many slots?' })]);
      assert.equal(sameUser.filter(r => r.status === 200).length, 1);
      assert.equal(sameUser.filter(r => r.status === 429).length, 1);
    } finally { f.close(); }
  });
  await check('global active, minute and daily caps are enforced by real SQLite triggers', async () => {
    const f = fixture(); try {
      const insert = f.sql.prepare('INSERT INTO wibsworth_requests(id,user_id,day,created_at,reserved,lease_until,completed) VALUES(?,?,?,?,?,?,?)');
      for (let i = 0; i < 3; i++) insert.run(crypto.randomUUID(), 'other-' + i, '2026-10-18', baseTime, 1, baseTime + 90000, 0);
      assert.equal((await f.request('chat', { question: 'How many slots?' })).status, 429);
      f.sql.exec('DELETE FROM wibsworth_requests');
      for (let i = 0; i < 3; i++) assert.equal((await f.request('chat', { question: 'How many slots?' })).status, 200);
      assert.equal((await f.request('chat', { question: 'How many slots?' })).status, 429);
      f.sql.exec('DELETE FROM wibsworth_requests');
      for (let i = 0; i < 20; i++) { f.setTime(baseTime + i * 61000); assert.equal((await f.request('chat', { question: 'How many slots?' })).status, 200); }
      f.setTime(baseTime + 21 * 61000); assert.equal((await f.request('chat', { question: 'How many slots?' })).status, 429);
      f.setTime(baseTime + 86400000); const nextDay = (await f.request('state')).body.usage;
      assert.equal(nextDay.daily.used, 0); assert(nextDay.used > 0, 'Monthly usage survives daily resets.');
      assert.equal((await f.request('chat', { question: 'How many slots?' })).status, 200);
    } finally { f.close(); }
  });
  await check('monthly hard stop is atomic, persists until reset, and daily allowances are not pooled', async () => {
    const f = fixture(); try {
      const insert = f.sql.prepare('INSERT INTO wibsworth_requests(id,user_id,day,created_at,reserved,lease_until,completed) VALUES(?,?,?,?,?,?,?)');
      for (let day = 1; day <= 30; day++) {
        const at = Date.UTC(2026, 9, day, 12);
        insert.run(crypto.randomUUID(), developer, '2026-10-' + String(day).padStart(2, '0'), at, 9000, at, 1);
      }
      const at = Date.UTC(2026, 9, 31, 12); f.setTime(at);
      insert.run(crypto.randomUUID(), developer, '2026-10-31', at - 120000, 8900, at, 1);
      const results = await Promise.all([f.request('chat', { question: 'How many slots?' }, 'alice'), f.request('chat', { question: 'How many slots?' }, 'bob')]);
      assert.equal(results.filter(r => r.status === 200).length, 1);
      assert.equal(results.filter(r => r.status === 429).length, 1);
      assert.equal(f.calls, 1);
      const stopped = (await f.request('state')).body;
      assert.equal(stopped.usage.exhaustedPeriod, 'month'); assert.equal(stopped.usage.available, false);
      assert.equal(stopped.usage.limit, 279000); assert(stopped.usage.used <= stopped.usage.limit);
      assert.equal(stopped.blockedUntil, Date.UTC(2026, 10, 1));
      assert.equal((await f.request('chat', { question: 'Shorter' })).status, 429); assert.equal(f.calls, 1);
      f.setTime(Date.UTC(2026, 10, 1, 12));
      const renewed = (await f.request('state')).body;
      assert.equal(renewed.available, true); assert.equal(renewed.usage.limit, 270000);
      assert.equal(renewed.usage.used, 0); assert.equal(renewed.usage.daily.used, 0);
      assert.equal(renewed.usage.resetAt, Date.UTC(2026, 11, 1));
      assert.equal((await f.request('chat', { question: 'How many slots?' })).status, 200);
      f.setTime(Date.UTC(2024, 1, 14)); assert.equal((await f.request('state')).body.usage.limit, 9000 * 29);
      f.setTime(Date.UTC(2025, 1, 14)); assert.equal((await f.request('state')).body.usage.limit, 9000 * 28);
    } finally { f.close(); }
  });
  await check('failed and timed-out inference keeps its full reservation and never retries', async () => {
    for (const options of [{ infer: () => { throw Error('provider failure containing secret'); } }, { infer: () => new Promise(() => {}), timeoutMs: 5 }]) {
      const f = fixture(options); try {
        const response = await f.request('chat', { question: 'How many slots?' });
        assert([503, 504].includes(response.status)); assert(!response.body.error.includes('secret'));
        assert.equal(f.calls, 1); assert(response.body.usage.used > 0);
        const row = f.sql.prepare('SELECT reserved,completed FROM wibsworth_requests').get();
        assert(row.reserved > 0); assert.equal(row.completed, 0);
        assert.equal((await f.request('chat', { question: 'Try again' })).status, 429);
        assert.equal(f.calls, 1);
      } finally { f.close(); }
    }
  });
  await check('responses completing after UTC rollover show the current allowance', async () => {
    for (const fails of [false, true]) {
      let f;
      f = fixture({ infer: () => {
        f.setTime(Date.UTC(2026, 10, 1, 0, 0, 2));
        if (fails) throw Error('provider unavailable');
        return { response: 'There are six combat slots.' };
      } });
      try {
        f.setTime(Date.UTC(2026, 9, 31, 23, 59, 59));
        const result = await f.request('chat', { question: 'How many slots?' });
        assert.equal(result.status, fails ? 503 : 200);
        assert.equal(result.body.usage.used, 0);
        assert.equal(result.body.usage.daily.used, 0);
        assert.equal(result.body.usage.limit, 9000 * 30);
        assert.equal(result.body.usage.resetAt, Date.UTC(2026, 11, 1));
        const reservation = f.sql.prepare('SELECT day,reserved FROM wibsworth_requests').get();
        assert.equal(reservation.day, '2026-10-31'); assert(reservation.reserved > 0);
      } finally { f.close(); }
    }
  });
  await check('abort before inference spends nothing; abort during inference remains reserved', async () => {
    const controller = new AbortController(), f = fixture({ infer: () => new Promise(() => {}) });
    try {
      const pre = new AbortController(); pre.abort();
      assert.equal((await f.request('chat', { question: 'How many slots?' }, 'alice', { signal: pre.signal })).status, 499);
      assert.equal(f.calls, 0);
      const pending = f.request('chat', { question: 'How many slots?' }, 'alice', { signal: controller.signal });
      setTimeout(() => controller.abort(), 5);
      assert.equal((await pending).status, 499); assert.equal(f.calls, 1);
      assert(f.sql.prepare('SELECT SUM(reserved) n FROM wibsworth_requests').get().n > 0);
    } finally { f.close(); }
  });
  await check('byte-based reservation includes output and multibyte input; overflow is rejected', async () => {
    const plain = service.reserveCost([{ role: 'user', content: 'a'.repeat(200) }]);
    const multibyte = service.reserveCost([{ role: 'user', content: '🌿'.repeat(200) }]);
    assert(multibyte > plain); assert(plain > service.MAX_OUTPUT_TOKENS * .031);
    assert.throws(() => service.reserveCost([{ role: 'user', content: 'a'.repeat(service.MAX_INPUT_BYTES) }]), e => e.status === 413);
    assert.equal(service.safeSourceUrl('https://user:pass@repocompany.uk/'), null);
    assert.equal(service.safeSourceUrl('javascript:alert(1)'), null);
  });
  await check('real reviewed Morogue evidence fits the bounded prompt without live inference', async () => {
    const { retrieveKnowledge } = await import('../lib/wibsworth-knowledge.mjs');
    const f = fixture({ retrieveKnowledge }); try {
      const result = await f.request('chat', { question: 'What are the best combos in Morogue?', platform: 'web', spoilers: false });
      assert.equal(result.status, 200, JSON.stringify(result.body));
      assert.equal(f.calls, 1);
      assert.match(JSON.stringify(f.lastMessages), /Glass Pepper|Lead Apricot|Sour Starter|Skillet Capers/);
      assert.match(JSON.stringify(f.lastMessages), /calculations/);
      assert(result.body.sources.length > 0); assert(result.body.usage.used < 2000);
    } finally { f.close(); }
  });
  console.log(`${assertions} Wibsworth backend checks passed. No inference or external requests were made.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
