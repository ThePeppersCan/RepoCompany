import config from '../../../dashboard-config.json';

const MAX_BODY_BYTES = 16 * 1024;
const LOOK_FIELDS = new Set(['skin', 'hair', 'hair_colour', 'face', 'eyes', 'nose', 'mouth', 'eye_colour', 'shirt', 'trousers', 'shoes', 'hat', 'shirt_colour', 'trousers_colour', 'shoes_colour', 'hat_colour']);
const UUID = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const only = (value, keys) => object(value) && Object.keys(value).every(key => keys.includes(key));

function validateCharacters(value) {
  if (!Array.isArray(value) || value.length > 4) throw fail('Choose up to four Moratales characters.');
  const ids = new Set();
  return value.map(character => {
    if (!only(character, ['id', 'name', 'look']) || typeof character.id !== 'string' || !/^(?:slot-[0-2]|current)$/.test(character.id) || ids.has(character.id)) throw fail('Choose distinct Moratales character slots.');
    if (typeof character.name !== 'string') throw fail('Choose a character name.');
    const name = character.name.trim();
    if (!name || name.length > 32 || /[\u0000-\u001f\u007f]/.test(name)) throw fail('Character names must contain 1–32 readable characters.');
    if (!object(character.look) || typeof character.look.skin !== 'string' || typeof character.look.hair !== 'string') throw fail('Choose a valid character appearance.');
    const look = { name };
    for (const [key, item] of Object.entries(character.look)) {
      if (key === 'name') {
        if (typeof item !== 'string' || item.trim() !== name) throw fail('The appearance must match its character name.');
      } else {
        // These are sprite option IDs, never URLs, arbitrary objects or save data.
        if (!LOOK_FIELDS.has(key) || typeof item !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(item)) throw fail('Choose valid appearance features.');
        look[key] = item;
      }
    }
    ids.add(character.id);
    return { id: character.id, name, look };
  });
}

async function readBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) throw fail('Send a JSON character list.', 415);
  const length = request.headers.get('Content-Length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) throw fail('The character list is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw fail('Send a character list.');
  let bytes = 0, text = '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        throw fail('The character list is too large.', 413);
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (error) {
    if (error.status) throw error;
    throw fail('Send a readable JSON character list.');
  } finally { reader.releaseLock(); }
}

async function verifiedUser(request) {
  const token = request.headers.get('Authorization')?.match(/^Bearer ([^\s]+)$/)?.[1];
  if (!token || token.length > 16384) throw fail('Sign in to connect your characters.', 401);
  const response = await fetch(config.url + '/auth/v1/user', {
    headers: { apikey: config.key, Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(10000)
  });
  if (response.status === 401 || response.status === 403) throw fail('Your session expired. Sign in again.', 401);
  if (!response.ok) throw fail('Your account connection is temporarily unavailable.', 503);
  const user = await response.json();
  if (typeof user?.id !== 'string' || !UUID.test(user.id) || user.is_anonymous) throw fail('Sign in with your Repo Company account.', 401);
  return user.id.toLowerCase();
}

function snapshot(userId, row) {
  if (!row) return { userId, revision: 0, characters: [], updatedAt: null };
  return { userId, revision: row.revision, characters: JSON.parse(row.characters), updatedAt: row.updated_at };
}

export async function onRequest({ request, env, params }) {
  try {
    const route = Array.isArray(params.path) ? params.path.join('/') : params.path || '';
    if (route !== 'moratales') return json({ error: 'Not found.' }, 404);
    if (!['GET', 'POST', 'PUT'].includes(request.method)) return json({ error: 'Method not allowed.' }, 405);
    const url = new URL(request.url), origin = request.headers.get('Origin');
    const writing = request.method !== 'GET';
    if ((origin !== null && origin !== url.origin) || (writing && origin !== url.origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({ error: 'Use your Repo Company account page to connect characters.' }, 403);
    const userId = await verifiedUser(request);
    const db = env.DASHBOARD_DB;
    if (!db) throw fail('Character storage is temporarily unavailable.', 503);
    const read = () => db.prepare('SELECT revision,characters,updated_at FROM dashboard_moratales_characters WHERE user_id=?').bind(userId).first();
    if (!writing) return json(snapshot(userId, await read()));
    const body = await readBody(request);
    if (!only(body, ['revision', 'characters']) || !Number.isSafeInteger(body.revision) || body.revision < 0 || body.revision >= Number.MAX_SAFE_INTEGER || !Object.hasOwn(body, 'characters')) throw fail('Send the character list with its current revision.');
    const characters = JSON.stringify(validateCharacters(body.characters)), now = Date.now();
    // Each conditional write is a single atomic SQLite statement. A cleared list
    // retains its revision so an older browser cannot silently restore it.
    const row = body.revision === 0
      ? await db.prepare('INSERT INTO dashboard_moratales_characters(user_id,revision,characters,updated_at) VALUES(?,1,?,?) ON CONFLICT(user_id) DO NOTHING RETURNING revision,characters,updated_at').bind(userId, characters, now).first()
      : await db.prepare('UPDATE dashboard_moratales_characters SET revision=revision+1,characters=?,updated_at=MAX(updated_at,?) WHERE user_id=? AND revision=? RETURNING revision,characters,updated_at').bind(characters, now, userId, body.revision).first();
    if (!row) return json({ error: 'Your characters changed elsewhere. Reload them before saving again.', code: 'revision_conflict', current: snapshot(userId, await read()) }, 409);
    return json(snapshot(userId, row));
  } catch (error) {
    return json({ error: error.status ? error.message : 'Character storage is temporarily unavailable. Please try again.' }, error.status || 503);
  }
}
