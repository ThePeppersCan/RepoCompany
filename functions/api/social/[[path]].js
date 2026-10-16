import {validateMessageImage,attachMessageImage} from '../../../lib/chat-images.mjs';
import config from '../../../dashboard-config.json';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const name = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{3,16}$/.test(value) ? value.toLowerCase() : null;
const id = value => typeof value === 'string' && UUID.test(value) ? value.toLowerCase() : null;
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const MAX_BODY = 65536, CALL_LIMIT = 235 * 60000, TURN_TTL = 14400;
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Authorization' } });
const only = (body, keys) => object(body) && Object.keys(body).every(key => keys.includes(key));
const integer = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  if (!/^(0|[1-9]\d{0,14})$/.test(String(value))) throw fail('Choose a valid page cursor.');
  const number = Number(value); if (!Number.isSafeInteger(number)) throw fail('Choose a valid page cursor.'); return number;
};
// The predicate is embedded in every data operation, not just checked before an
// await. Immutable account IDs must still own BOTH current friendship names.
const allowed = (a, b, aid, bid) => `EXISTS(SELECT 1 FROM dashboard_friendships f
 JOIN dashboard_players pa ON pa.username=${a} AND pa.user_id=${aid}
 JOIN dashboard_players pb ON pb.username=${b} AND pb.user_id=${bid}
 WHERE f.status='accepted' AND ((f.player_a=${a} AND f.player_b=${b}) OR (f.player_b=${a} AND f.player_a=${b}))
 AND NOT EXISTS(SELECT 1 FROM dashboard_blocks x WHERE (x.blocker=${a} AND x.blocked=${b}) OR (x.blocker=${b} AND x.blocked=${a})))`;
const conversationAllowed = allowed('c.a_name', 'c.b_name', 'c.a_id', 'c.b_id');
const callAllowed = allowed('c.caller_name', 'c.callee_name', 'c.caller_id', 'c.callee_id');
const messageView = row => ({ id: row.id, sender: row.sender_name, clientId: row.client_id, text: row.text, createdAt: row.created_at });
const wibsIds=new Set(['wave','love','laugh','hype','wow','sad','angry','sleepy'].map(id=>'wibs-'+id));
const oldEmotes={'👍':'wibs-wave','❤️':'wibs-love','😂':'wibs-laugh','🎉':'wibs-hype','👀':'wibs-wow','🌿':'wibs-sleepy'};
function wibsEmote(value){if(typeof value!=='string')return null;if(wibsIds.has(value))return value;if(Object.hasOwn(oldEmotes,value))return oldEmotes[value];const m=value.match(/^(?:morogue|moratales|manager)-(up|down|laugh|angry|love)$/);return m?'wibs-'+({up:'wave',down:'sad'}[m[1]]||m[1]):null;}
function wibsReactions(rows,key,count){const merged=new Map();for(const r of rows){const id=wibsEmote(r[key]);if(!id)continue;const k=r.message_id+':'+id,prev=merged.get(k);if(prev){prev[count]+=r[count];prev.mine=Math.max(prev.mine,r.mine);}else merged.set(k,{...r,[key]:id});}return [...merged.values()];}
async function messageExtras(db, me, rows) {
  if (!rows.length) return [];
  if (rows.length > 80) return [...await messageExtras(db,me,rows.slice(0,80)), ...await messageExtras(db,me,rows.slice(80))];
  const placeholders = rows.map(() => '?').join(','), ids = rows.map(row => row.id);
  const reactions = await db.prepare(`SELECT r.message_id,r.emote,COUNT(*) AS n,MAX(r.user_id=?) AS mine FROM social_message_reactions r JOIN social_messages m ON m.id=r.message_id JOIN social_conversations c ON c.id=m.conversation_id WHERE m.id IN (${placeholders}) AND (c.a_id=? OR c.b_id=?) AND ${conversationAllowed} GROUP BY r.message_id,r.emote`).bind(me.id, ...ids, me.id, me.id).all();
  const canonical=wibsReactions(reactions.results,'emote','n');
  return rows.map(row => ({ ...messageView(row), reactions: canonical.filter(r => r.message_id === row.id).map(r => ({emote:r.emote,count:r.n,mine:!!r.mine})) }));
}
const callView = row => row ? ({ id: row.id, caller: row.caller_name, callee: row.callee_name, kind: row.kind, status: row.status, createdAt: row.created_at, expiresAt: row.expires_at, endedAt: row.ended_at, reason: row.reason }) : null;
// Calling is an explicit product opt-in, independent of whether credentials exist.
const configured = env => config.socialCallsEnabled === true && /^[a-zA-Z0-9_-]{1,128}$/.test(env.SOCIAL_TURN_KEY_ID || '') && typeof env.SOCIAL_TURN_KEY_API_TOKEN === 'string' && env.SOCIAL_TURN_KEY_API_TOKEN.length >= 16;

async function bodyOf(request) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw fail('Send a JSON request.', 415);
  if (Number(request.headers.get('Content-Length')) > MAX_BODY) throw fail('Request too large.', 413);
  const reader = request.body?.getReader(); if (!reader) throw fail('Request body is required.');
  const chunks = []; let length = 0;
  try { while (true) { const part = await reader.read(); if (part.done) break; length += part.value.byteLength; if (length > MAX_BODY) { await reader.cancel(); throw fail('Request too large.', 413); } chunks.push(part.value); } }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body; try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw fail('Invalid JSON request.'); }
  if (!object(body)) throw fail('Invalid request.'); return body;
}
async function identity(request) {
  const token = request.headers.get('Authorization')?.match(/^Bearer ([^\s]{1,8192})$/)?.[1];
  if (!token) throw fail('Sign in to continue.', 401);
  async function upstream(route, body) {
    const response = await fetch(config.url + route, { method: body ? 'POST' : 'GET', headers: { apikey: config.key, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw fail(response.status === 401 || response.status === 403 ? 'Sign in again.' : 'The account service is unavailable.', response.status === 401 || response.status === 403 ? 401 : 503);
    return response.json();
  }
  const user = await upstream('/auth/v1/user');
  if (!id(user?.id) || user.is_anonymous) throw fail('Sign in with your Repo Company account.', 401);
  const profile = await upstream('/rest/v1/rpc/get_my_character', {}), character = Array.isArray(profile) ? profile[0] : profile;
  if (!name(character?.username)) throw fail('Create your player profile before messaging.', 409);
  return { id: user.id.toLowerCase(), name: name(character.username), display: character.username };
}
async function rate(db, user, scope, maximum, now) {
  const row = await db.prepare(`INSERT INTO social_rate_limits(user_id,scope,window_start,count) VALUES(?,?,?,1)
   ON CONFLICT(user_id,scope) DO UPDATE SET count=CASE WHEN window_start=excluded.window_start THEN count+1 ELSE 1 END,window_start=excluded.window_start RETURNING count`).bind(user, scope, Math.floor(now / 60000)).first();
  if (row.count > maximum) throw fail('Please wait a moment before trying again.', 429);
}
async function peer(db, me, username) {
  const target = name(username); if (!target || target === me.name) throw fail('Choose an accepted friend.');
  const row = await db.prepare(`SELECT q.username,q.user_id,q.display_name FROM dashboard_players p JOIN dashboard_players q ON q.username=?
   WHERE p.user_id=? AND p.username=? AND ${allowed('p.username', 'q.username', 'p.user_id', 'q.user_id')}`).bind(target, me.id, me.name).first();
  if (!row || !id(row.user_id)) throw fail('This conversation is unavailable. Accepted friends only.', 403); return row;
}
async function conversation(db, me, other) {
  return db.prepare(`SELECT c.* FROM social_conversations c WHERE ((c.a_id=? AND c.b_id=?) OR (c.a_id=? AND c.b_id=?)) AND ${conversationAllowed}`).bind(me.id, other.user_id, other.user_id, me.id).first();
}
async function getCall(db, me, callId) {
  if (!id(callId)) throw fail('Call not found.', 404);
  const row = await db.prepare(`SELECT c.* FROM social_calls c WHERE c.id=? AND (c.caller_id=? OR c.callee_id=?) AND ${callAllowed}`).bind(callId, me.id, me.id).first();
  if (!row) throw fail('Call unavailable.', 404); return row;
}
function signalBody(body) {
  if (!only(body, ['clientId', 'type', 'data']) || !id(body.clientId) || !['offer', 'answer', 'ice'].includes(body.type)) throw fail('Invalid call signal.');
  if (body.type !== 'ice') {
    if (!only(body.data, ['type', 'sdp']) || body.data.type !== body.type || typeof body.data.sdp !== 'string' || !body.data.sdp.startsWith('v=0') || body.data.sdp.length > 32768) throw fail('Invalid call description.');
    return { type: body.type, sdp: body.data.sdp };
  }
  if (body.data === null) return null;
  const data = body.data;
  if (!only(data, ['candidate', 'sdpMid', 'sdpMLineIndex', 'usernameFragment']) || typeof data.candidate !== 'string' || data.candidate.length > 2048 || (data.candidate && !data.candidate.startsWith('candidate:')) || (data.sdpMid != null && (typeof data.sdpMid !== 'string' || data.sdpMid.length > 64)) || (data.sdpMLineIndex != null && (!Number.isInteger(data.sdpMLineIndex) || data.sdpMLineIndex < 0 || data.sdpMLineIndex > 64)) || (data.usernameFragment != null && (typeof data.usernameFragment !== 'string' || data.usernameFragment.length > 256))) throw fail('Invalid connection candidate.');
  return { candidate: data.candidate, sdpMid: data.sdpMid ?? null, sdpMLineIndex: data.sdpMLineIndex ?? null, usernameFragment: data.usernameFragment ?? null };
}

export async function onRequest({ request, env, params }) {
  try {
    const url = new URL(request.url), origin = request.headers.get('Origin');
    if ((origin && origin !== url.origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') throw fail('Use the Repo Company website or launcher.', 403);
    if (!['GET', 'POST'].includes(request.method)) throw fail('Method not allowed.', 405);
    const route = (Array.isArray(params.path) ? params.path.join('/') : params.path || '').split('/');
    const body = request.method === 'POST' ? await bodyOf(request) : null;
    const me = await identity(request), now = Date.now();
    if (!env.DASHBOARD_DB) throw fail('Messaging is unavailable.', 503);
    if (['calls', 'ice'].includes(route[0]) && !configured(env)) throw fail('Calls are not available. You can still send messages.', 503);
    // Read from the primary so revocation checks cannot use stale replicas.
    const db = env.DASHBOARD_DB.withSession ? env.DASHBOARD_DB.withSession('first-primary') : env.DASHBOARD_DB;
    await db.prepare(`INSERT INTO dashboard_players(username,user_id,display_name) VALUES(?,?,?) ON CONFLICT(username) DO UPDATE SET user_id=excluded.user_id WHERE dashboard_players.user_id IS NULL`).bind(me.name, me.id, me.display).run();
    const owner = await db.prepare('SELECT user_id FROM dashboard_players WHERE username=?').bind(me.name).first();
    if (owner?.user_id !== me.id) throw fail('Your player profile changed. Refresh your account.', 409);
    await rate(db, me.id, 'requests', 180, now);
    if (configured(env)) await db.batch([
      db.prepare("UPDATE social_calls SET status='ended',ended_at=?,reason=CASE WHEN created_at+?<=? THEN 'duration-limit' ELSE 'timeout' END WHERE status IN ('ringing','active') AND expires_at<=?").bind(now, CALL_LIMIT, now, now),
      db.prepare("DELETE FROM social_calls WHERE status IN ('ended','rejected') AND ended_at<?").bind(now - 86400000)
    ]);

    if (request.method === 'GET' && route.length === 1 && route[0] === 'inbox') {
      const before = integer(url.searchParams.get('before'), Number.MAX_SAFE_INTEGER), limit = Math.min(50, Math.max(1, integer(url.searchParams.get('limit'), 30)));
      const rows = await db.prepare(`SELECT c.*,CASE WHEN c.a_id=? THEN c.b_name ELSE c.a_name END AS peer_name,
       m.sender_name AS last_sender,m.client_id AS last_client,m.text AS last_text,m.created_at AS last_created,
       (SELECT COUNT(*) FROM social_messages m WHERE m.conversation_id=c.id AND m.sender_id!=? AND m.id>CASE WHEN c.a_id=? THEN c.read_a ELSE c.read_b END) AS unread
       FROM social_conversations c JOIN social_messages m ON m.id=c.last_id WHERE (c.a_id=? OR c.b_id=?) AND c.last_id<? AND ${conversationAllowed} ORDER BY c.last_id DESC LIMIT ?`).bind(me.id, me.id, me.id, me.id, me.id, before, limit + 1).all();
      const conversations = rows.results.slice(0, limit).map(row => ({ id: row.id, username: row.peer_name, displayName: row.peer_name, lastMessage: { id: row.last_id, sender: row.last_sender, clientId: row.last_client, text: row.last_text, createdAt: row.last_created }, unread: row.unread, readThrough: row.a_id === me.id ? row.read_a : row.read_b, peerReadThrough: row.a_id === me.id ? row.read_b : row.read_a }));
      const call = configured(env) ? await db.prepare(`SELECT c.* FROM social_calls c JOIN social_call_slots s ON s.call_id=c.id WHERE s.user_id=? AND c.expires_at>? AND ${callAllowed}`).bind(me.id, now).first() : null;
      const unread = await db.prepare(`SELECT COUNT(*) AS n FROM social_messages m JOIN social_conversations c ON c.id=m.conversation_id WHERE (c.a_id=? OR c.b_id=?) AND m.sender_id!=? AND m.id>CASE WHEN c.a_id=? THEN c.read_a ELSE c.read_b END AND ${conversationAllowed}`).bind(me.id, me.id, me.id, me.id).first();
      return json({ conversations, totalUnread: unread.n, call: callView(call), serverTime: now, iceConfigured: configured(env), hasMore: rows.results.length > limit, nextCursor: rows.results.slice(0, limit).at(-1)?.last_id || null });
    }
    if (route.length === 1 && route[0] === 'reactions' && request.method === 'POST') {
      if (!only(body, ['messageId', 'emote']) || !Number.isSafeInteger(body.messageId) || body.messageId <= 0 || (body.emote !== null && !wibsEmote(body.emote))) throw fail('Choose a valid reaction.');
      await rate(db, me.id, 'reactions', 40, now);
      const row = await db.prepare(`SELECT m.* FROM social_messages m JOIN social_conversations c ON c.id=m.conversation_id WHERE m.id=? AND (c.a_id=? OR c.b_id=?) AND ${conversationAllowed}`).bind(body.messageId, me.id, me.id).first();
      if (!row) throw fail('Message unavailable.', 404);
      if (body.emote === null) await db.prepare(`DELETE FROM social_message_reactions WHERE message_id=? AND user_id=? AND EXISTS(SELECT 1 FROM social_messages m JOIN social_conversations c ON c.id=m.conversation_id WHERE m.id=? AND (c.a_id=? OR c.b_id=?) AND ${conversationAllowed})`).bind(body.messageId, me.id, body.messageId, me.id, me.id).run();
      else await db.prepare(`INSERT INTO social_message_reactions(message_id,user_id,emote,created_at) SELECT m.id,?,?,? FROM social_messages m JOIN social_conversations c ON c.id=m.conversation_id WHERE m.id=? AND (c.a_id=? OR c.b_id=?) AND ${conversationAllowed} ON CONFLICT(message_id,user_id) DO UPDATE SET emote=excluded.emote,created_at=excluded.created_at`).bind(me.id, wibsEmote(body.emote), now, body.messageId, me.id, me.id).run();
      return json({message:(await messageExtras(db, me, [row]))[0]});
    }
    if (route.length === 1 && route[0] === 'messages') {
      const other = await peer(db, me, request.method === 'GET' ? url.searchParams.get('username') : body.username);
      if (request.method === 'POST') {
        if (!only(body, ['username', 'clientId', 'text']) || !id(body.clientId) || typeof body.text !== 'string' || !body.text.trim() || body.text.length > 4000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body.text)) throw fail('Write a message of up to 4,000 characters.');
        const imageId=await validateMessageImage(db,me,'dm',other.username,body.clientId,body.text);
        await rate(db, me.id, 'messages', 30, now);
        const pair = [{ id: me.id, name: me.name }, { id: other.user_id, name: other.username }].sort((a, b) => a.id.localeCompare(b.id));
        await db.batch([
          db.prepare(`INSERT OR IGNORE INTO social_conversations(id,a_id,b_id,a_name,b_name,updated_at) SELECT ?,?,?,?,?,? WHERE ${allowed('?', '?', '?', '?')}`).bind(crypto.randomUUID(), pair[0].id, pair[1].id, pair[0].name, pair[1].name, now, ...friendBindings(pair[0], pair[1])),
          db.prepare(`INSERT INTO social_messages(conversation_id,sender_id,sender_name,client_id,text,created_at) SELECT c.id,?,?,?,?,? FROM social_conversations c WHERE c.a_id=? AND c.b_id=? AND ${conversationAllowed} ON CONFLICT(sender_id,client_id) DO NOTHING`).bind(me.id, me.name, id(body.clientId), body.text.trim(), now, pair[0].id, pair[1].id)
        ]);
        const row = await db.prepare(`SELECT m.* FROM social_messages m JOIN social_conversations c ON c.id=m.conversation_id WHERE m.sender_id=? AND m.client_id=? AND ${conversationAllowed}`).bind(me.id, id(body.clientId)).first();
        const c = await conversation(db, me, other);
        if (!row || !c) throw fail('This conversation is unavailable.', 403);
        if (row.conversation_id !== c.id || row.text !== body.text.trim()) throw fail('This message identifier was already used.', 409);
        await attachMessageImage(db,imageId,row.id);return json({ conversationId: c.id, message: messageView(row) });
      }
      const c = await conversation(db, me, other), after = integer(url.searchParams.get('after')), before = integer(url.searchParams.get('before'), Number.MAX_SAFE_INTEGER);
      if (url.searchParams.has('after') && url.searchParams.has('before')) throw fail('Use one page cursor.');
      const limit = Math.min(100, Math.max(1, integer(url.searchParams.get('limit'), 50))), ascending = url.searchParams.has('after');
      if (!c) return json({ conversationId: null, messages: [], nextCursor: 0, hasMore: false, readThrough: 0, peerReadThrough: 0 });
      const revision=(await db.prepare("SELECT revision FROM wibs_revisions WHERE scope='dm' AND target=?").bind(c.id).first())?.revision||0;
      const markers={conversationId:c.id,revision,readThrough:c.a_id===me.id?c.read_a:c.read_b,peerReadThrough:c.a_id===me.id?c.read_b:c.read_a};
      if(ascending&&url.searchParams.get('revision')===String(revision))return json({...markers,unchanged:true,messages:[],refreshed:[],hasMore:false,nextCursor:after});
      const rows = await db.prepare(`SELECT m.* FROM social_messages m JOIN social_conversations c ON c.id=m.conversation_id WHERE c.id=? AND m.id>? AND m.id<? AND ${conversationAllowed} ORDER BY m.id ${ascending ? 'ASC' : 'DESC'} LIMIT ?`).bind(c.id, after, before, limit + 1).all();
      const page = rows.results.slice(0, limit); if (!ascending) page.reverse();
      // Refresh existing reactions separately from the forward message cursor.
      // A full reaction window must never crowd new messages out of the page.
      const refresh = ascending && after > 0 && url.searchParams.get('refresh') === '1';
      const previous = refresh ? await db.prepare(`SELECT m.* FROM social_messages m JOIN social_conversations c ON c.id=m.conversation_id WHERE c.id=? AND m.id<=? AND ${conversationAllowed} ORDER BY m.id DESC LIMIT 100`).bind(c.id,after).all() : null;
      const refreshed = previous ? (await messageExtras(db,me,previous.results)).map(({id,reactions})=>({id,reactions})) : [];
      return json({ revision, conversationId: c.id, messages: await messageExtras(db,me,page), refreshed, nextCursor: ascending ? page.at(-1)?.id || after : page[0]?.id || 0, hasMore: rows.results.length > limit, readThrough: c.a_id === me.id ? c.read_a : c.read_b, peerReadThrough: c.a_id === me.id ? c.read_b : c.read_a });
    }
    if (request.method === 'POST' && route.length === 1 && route[0] === 'read') {
      if (!only(body, ['username', 'messageId']) || !Number.isSafeInteger(body.messageId) || body.messageId <= 0) throw fail('Choose a valid message.');
      const other = await peer(db, me, body.username), c = await conversation(db, me, other); if (!c) throw fail('Conversation not found.', 404);
      const field = c.a_id === me.id ? 'read_a' : 'read_b';
      const updated = await db.prepare(`UPDATE social_conversations AS c SET ${field}=MAX(${field},?) WHERE c.id=? AND ${conversationAllowed} AND EXISTS(SELECT 1 FROM social_messages m WHERE m.conversation_id=c.id AND m.id=?) RETURNING ${field} AS marker`).bind(body.messageId, c.id, body.messageId).first();
      if (!updated) throw fail('That message is unavailable.', 404); return json({ readThrough: updated.marker });
    }
    if (request.method === 'POST' && route.length === 1 && route[0] === 'calls') {
      if (!only(body, ['username', 'clientId', 'kind']) || !id(body.clientId) || !['audio', 'video'].includes(body.kind)) throw fail('Choose a voice or video call.');
      const other = await peer(db, me, body.username); if (!configured(env)) throw fail('Calls are not available yet. You can still send messages.', 503);
      await rate(db, me.id, 'calls', 8, now);
      const previous = await db.prepare(`SELECT c.* FROM social_calls c WHERE c.caller_id=? AND c.client_id=? AND ${callAllowed}`).bind(me.id, id(body.clientId)).first();
      if (previous) { if (previous.callee_id !== other.user_id || previous.kind !== body.kind) throw fail('This call identifier was already used.', 409); return json({ call: callView(previous) }); }
      const inserted = await db.prepare(`INSERT INTO social_calls(id,client_id,caller_id,callee_id,caller_name,callee_name,kind,status,created_at,expires_at,caller_seen,callee_seen)
       SELECT ?,?,?,?,p.username,q.username,?,'ringing',?,?,?,? FROM dashboard_players p JOIN dashboard_players q ON q.user_id=? WHERE p.user_id=? AND ${allowed('p.username', 'q.username', 'p.user_id', 'q.user_id')}
       AND NOT EXISTS(SELECT 1 FROM social_call_slots WHERE user_id IN (p.user_id,q.user_id)) ON CONFLICT(caller_id,client_id) DO NOTHING RETURNING *`).bind(crypto.randomUUID(), id(body.clientId), me.id, other.user_id, body.kind, now, now + 45000, now, now, other.user_id, me.id).first();
      if (!inserted) {
        const retry = await db.prepare(`SELECT c.* FROM social_calls c WHERE c.caller_id=? AND c.client_id=? AND ${callAllowed}`).bind(me.id, id(body.clientId)).first();
        if (retry && retry.callee_id === other.user_id && retry.kind === body.kind) return json({ call: callView(retry) });
        throw fail('One of you is already in a call, or this friendship changed.', 409);
      }
      return json({ call: callView(inserted) });
    }
    if (route[0] === 'calls' && route.length >= 2 && route.length <= 3) {
      const c = await getCall(db, me, route[1]);
      if (route.length === 2 && request.method === 'GET') return json({ call: callView(c) });
      if (route.length === 2 && request.method === 'POST') {
        if (!only(body, ['action']) || !['accept', 'reject', 'end', 'heartbeat'].includes(body.action)) throw fail('Invalid call action.');
        let change, bindings;
        if (body.action === 'accept') {
          if (c.callee_id !== me.id) throw fail('Only the invited friend can accept.', 403);
          change = "status='active',caller_seen=?,callee_seen=?,expires_at=?"; bindings = [now, now, Math.min(now + 30000, c.created_at + CALL_LIMIT)];
        } else if (body.action === 'reject') {
          if (c.callee_id !== me.id) throw fail('Only the invited friend can decline.', 403);
          change = "status='rejected',ended_at=?,reason='declined'"; bindings = [now];
        } else if (body.action === 'end') { change = "status='ended',ended_at=?,reason='ended'"; bindings = [now]; }
        else { const field = c.caller_id === me.id ? 'caller_seen' : 'callee_seen', other = c.caller_id === me.id ? 'callee_seen' : 'caller_seen'; change = `${field}=?,expires_at=MIN(?+30000,${other}+30000,created_at+?)`; bindings = [now, now, CALL_LIMIT]; }
        const states = ['accept', 'reject'].includes(body.action) ? "'ringing'" : body.action === 'heartbeat' ? "'active'" : "'ringing','active'";
        const updated = await db.prepare(`UPDATE social_calls AS c SET ${change} WHERE c.id=? AND c.status IN (${states}) AND c.expires_at>? AND ${callAllowed} RETURNING *`).bind(...bindings, c.id, now).first();
        const current = updated || await getCall(db, me, c.id);
        if (!updated && ((body.action === 'accept' && current.status !== 'active') || (body.action === 'reject' && current.status !== 'rejected') || (body.action === 'heartbeat' && current.status !== 'active'))) throw fail('This call is no longer available.', 409);
        return json({ call: callView(current) });
      }
      if (route[2] === 'signals') {
        if (request.method === 'GET') {
          const after = integer(url.searchParams.get('after'));
          if (c.status !== 'active') return json({ call: callView(c), signals: [], nextCursor: after, hasMore: false });
          const rows = await db.prepare(`SELECT s.* FROM social_signals s JOIN social_calls c ON c.id=s.call_id WHERE c.id=? AND s.id>? AND s.sender_id!=? AND c.status='active' AND c.expires_at>? AND ${callAllowed} ORDER BY s.id LIMIT 101`).bind(c.id, after, me.id, now).all();
          const signals = rows.results.slice(0, 100).map(row => ({ id: row.id, sender: row.sender_name, clientId: row.client_id, type: row.type, data: JSON.parse(row.data) }));
          const current = await getCall(db, me, c.id);
          return json({ call: callView(current), signals: current.status === 'active' ? signals : [], nextCursor: current.status === 'active' ? signals.at(-1)?.id || after : after, hasMore: current.status === 'active' && rows.results.length > 100 });
        }
        const data = signalBody(body), encoded = JSON.stringify(data); await rate(db, me.id, 'signals', 150, now);
        if (c.status !== 'active' || c.expires_at <= now) throw fail('Accept the call before connecting.', 409);
        if ((body.type === 'offer' && c.caller_id !== me.id) || (body.type === 'answer' && c.callee_id !== me.id)) throw fail('This call description belongs to the other participant.', 403);
        const previous = await db.prepare(`SELECT s.* FROM social_signals s JOIN social_calls c ON c.id=s.call_id WHERE c.id=? AND s.sender_id=? AND s.client_id=? AND c.status='active' AND ${callAllowed}`).bind(c.id, me.id, id(body.clientId)).first();
        if (previous) { if (previous.type !== body.type || previous.data !== encoded) throw fail('This signal identifier was already used.', 409); return json({ id: previous.id }); }
        const result = await db.prepare(`INSERT INTO social_signals(call_id,sender_id,sender_name,client_id,type,data,created_at) SELECT c.id,?,?,?,?,?,? FROM social_calls c WHERE c.id=? AND c.status='active' AND c.expires_at>? AND ${callAllowed}
         AND (SELECT COUNT(*) FROM social_signals s WHERE s.call_id=c.id AND s.sender_id=?)<256
         AND (?!='answer' OR EXISTS(SELECT 1 FROM social_signals s WHERE s.call_id=c.id AND s.type='offer'))
         AND (?='ice' OR NOT EXISTS(SELECT 1 FROM social_signals s WHERE s.call_id=c.id AND s.type=?))
         ON CONFLICT(call_id,sender_id,client_id) DO NOTHING RETURNING id`).bind(me.id, me.name, id(body.clientId), body.type, encoded, now, c.id, now, me.id, body.type, body.type, body.type).first();
        if (!result) {
          const retry = await db.prepare(`SELECT s.* FROM social_signals s JOIN social_calls c ON c.id=s.call_id WHERE c.id=? AND s.sender_id=? AND s.client_id=? AND c.status='active' AND c.expires_at>? AND ${callAllowed}`).bind(c.id, me.id, id(body.clientId), now).first();
          if (retry && retry.type === body.type && retry.data === encoded) return json({ id: retry.id });
          throw fail('This connection signal is out of sequence or the call has ended.', 409);
        }
        return json({ id: result.id });
      }
    }
    if (request.method === 'GET' && route.length === 1 && route[0] === 'ice') {
      const c = await getCall(db, me, url.searchParams.get('callId'));
      if (c.status !== 'active' || c.expires_at <= now) throw fail('Accept the call before connecting.', 409);
      if (!configured(env)) throw fail('Calls are not available yet.', 503);
      await rate(db, me.id, 'ice', 4, now);
      const response = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/' + env.SOCIAL_TURN_KEY_ID + '/credentials/generate-ice-servers', { method: 'POST', headers: { Authorization: 'Bearer ' + env.SOCIAL_TURN_KEY_API_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: TURN_TTL }), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw fail('The calling connection service is unavailable.', 503);
      const value = await response.json();
      const iceServers = Array.isArray(value.iceServers) ? value.iceServers.filter(server => object(server) && typeof server.username === 'string' && typeof server.credential === 'string').map(server => ({ urls: (Array.isArray(server.urls) ? server.urls : [server.urls]).filter(url => typeof url === 'string' && /^turns?:turn\.cloudflare\.com:\d+(?:\?transport=(?:udp|tcp))?$/.test(url)), username: server.username, credential: server.credential })).filter(server => server.urls.length) : [];
      if (!iceServers.length) throw fail('The calling connection service is unavailable.', 503);
      const current = await getCall(db, me, c.id);
      if (current.status !== 'active' || current.expires_at <= Date.now()) throw fail('This call has ended.', 409);
      return json({ iceServers, expiresAt: now + TURN_TTL * 1000, iceTransportPolicy: 'relay' });
    }
    throw fail('Not found.', 404);
  } catch (error) {
    return json({ error: error.status ? error.message : 'Messaging is temporarily unavailable. Please try again.' }, error.status || 503);
  }
}

// Binding order for allowed('?', '?', '?', '?'). Identifiers never enter SQL.
function friendBindings(a, b) { return [a.name, a.id, b.name, b.id, a.name, b.name, a.name, b.name, a.name, b.name, b.name, a.name]; }
