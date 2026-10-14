'use strict';
// Development-only in-memory services. main.cjs refuses these fixtures in packaged builds.
const path = require('node:path');
const { serveFile } = require('../../lib/protocol.cjs');
const root = path.resolve(__dirname, '../../..');
const USER_ID = '11111111-2222-4333-8444-555555555555';
const expiry = Number(process.env.REPO_LAUNCHER_FIXTURE_EXPIRY) || Math.floor(Date.now() / 1000) + 36000;
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({ sub: USER_ID, exp: expiry, aud: 'authenticated', role: 'authenticated', iat: expiry - 36000 }) + '.fixture-signature';
const user = { id: USER_ID, email: 'launchertest@conofdrpepper.local', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { username: 'LauncherTest' }, identities: [], created_at: '2026-01-01T00:00:00Z' };
const login = { access_token: token, refresh_token: 'fixture-refresh-token', token_type: 'bearer', expires_in: 36000, expires_at: expiry, user };
const sharedCharacter = { id: 'slot-0', name: 'Mora Test', look: { name: 'Mora Test', hair: 'm04', skin: 'copper', hair_colour: 'chestnut', face: 'face_1', eye_colour: 'hazel', shirt: 'shirt_vest', trousers: 'trousers', shoes: 'boots', eyes: 'eyes_01', shirt_colour: 'original', trousers_colour: 'original', shoes_colour: 'original', nose: 'nose_1', mouth: 'mouth_1', hat: 'none', hat_colour: 'original' } };
const stats = { requests: [], starts: [], finishes: [], achievementFacts: [], offline: false, characterMode: 'ready', characterRequests: 0, characterWrites: [], characterRevision: 0, characterCloud: [],
  managerCloudMode: 'ready', managerReads: 0, managerWrites: 0, managerDownloads: 0, managerUploads: 0, managerRows: [] };
const managerObjects = new Map();
const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
const portal = `<!doctype html><html><head><title>Repo Company test services</title></head><body style="background:#152219;color:#f3ecd9;font:20px system-ui;padding:45px"><h1>Repo Company test account</h1><p>Isolated integration fixture. No production requests are sent.</p><button id="sign-in">Sign in test account</button><button id="sign-out">Sign out</button><p id="status"></p><script>
const storageKey='sb-hvdrwmjieguurxvrgzfu-auth-token',session=${JSON.stringify(login)};
function stored(){try{return JSON.parse(localStorage.getItem(storageKey));}catch{return null;}}
window.repoAccount={db:{auth:{getSession:async()=>({data:{session:stored()}})}},signIn:async(username,password)=>{if(username!=='LauncherTest'||password!=='fixture-password')throw Error('Invalid login credentials');localStorage.setItem(storageKey,JSON.stringify(session));dispatchEvent(new Event('repo-account-state'));}};
document.getElementById('sign-in').onclick=()=>{localStorage.setItem(storageKey,JSON.stringify(session));document.getElementById('status').textContent='Signed in as LauncherTest';};
document.getElementById('sign-out').onclick=()=>{localStorage.removeItem(storageKey);document.getElementById('status').textContent='Signed out';};
</script></body></html>`;
function configure(config) {
  config.launcherUpdates = { url: null, publisherName: null };
  for (const game of config.games.filter(game => game.installable)) {
    game.developmentManifest = path.join(root, 'desktop/releases', game.id, 'manifest.json');
    if (game.id === 'morogue' && process.env.REPO_LAUNCHER_TEST_MOROGUE_RELEASE) {
      const release = process.env.REPO_LAUNCHER_TEST_MOROGUE_RELEASE;
      if (!path.isAbsolute(release)) throw Error('The test Morogue release must be an absolute native path.');
      game.developmentManifest = path.join(release, 'manifest.json');
    }
  }
}
async function fixtureFetch(input, init = {}) {
  const request = input instanceof Request ? input : new Request(input, init);
  const url = new URL(request.url);
  stats.requests.push(url.origin + url.pathname);
  if (stats.offline) throw new Error('Fixture network disconnected');
  if (url.hostname === 'hvdrwmjieguurxvrgzfu.supabase.co') {
    if (url.pathname === '/auth/v1/user') return request.headers.get('Authorization') === 'Bearer ' + token ? json(user) : json({ error: 'not signed in' }, 401);
    if (url.pathname === '/auth/v1/token') return json(login);
    if (url.pathname === '/auth/v1/logout') return json({});
    if (url.pathname === '/rest/v1/velmora_manager_career_slots' || url.pathname.startsWith('/storage/v1/object/')) {
      if (request.headers.get('Authorization') !== 'Bearer ' + token) return json({ message: 'Sign in to the fixture account' }, 401);
      if (stats.managerCloudMode === 'outage') return json({ message: 'Fixture career service unavailable' }, 503);
      if (url.pathname === '/rest/v1/velmora_manager_career_slots') {
        if (request.method === 'GET' || request.method === 'DELETE') {
          if (url.searchParams.get('user_id') !== 'eq.' + USER_ID) return json({ message: 'Fixture account does not own these careers' }, 403);
          const slotQuery = url.searchParams.get('slot');
          const rows = stats.managerRows.filter(row => !slotQuery || slotQuery === 'eq.' + row.slot);
          if (request.method === 'DELETE') { stats.managerRows = stats.managerRows.filter(row => !rows.includes(row)); return json([]); }
          stats.managerReads++;
          return request.headers.get('Accept')?.includes('application/vnd.pgrst.object+json') ? json(rows[0] || null) : json(rows);
        }
        if (request.method === 'POST') {
          const body = await request.json(), row = Array.isArray(body) ? body[0] : body;
          if (row.user_id !== USER_ID || !Number.isInteger(row.slot) || row.slot < 1 || row.slot > 5 || row.object_path !== `${USER_ID}/slot-${row.slot}.velmora`) return json({ message: 'Fixture account does not own this career' }, 403);
          const index = stats.managerRows.findIndex(existing => existing.slot === row.slot);
          if (index < 0) stats.managerRows.push(row); else stats.managerRows[index] = row;
          stats.managerWrites++;
          return json(row);
        }
      } else {
        const objectPath = decodeURIComponent(url.pathname.replace(/^\/storage\/v1\/object\/(?:authenticated\/)?/, ''));
        const bucket = 'velmora-manager-careers';
        if (request.method === 'DELETE' && objectPath === bucket) {
          const { prefixes } = await request.json();
          if (!Array.isArray(prefixes) || prefixes.some(item => !item.startsWith(USER_ID + '/'))) return json({ message: 'Wrong fixture owner' }, 403);
          for (const item of prefixes) managerObjects.delete(bucket + '/' + item);
          return json(prefixes.map(name => ({ name })));
        }
        if (!new RegExp(`^${bucket}/${USER_ID}/slot-[1-5](?:\\.previous)?\\.velmora$`).test(objectPath)) return json({ message: 'Wrong fixture owner or object path' }, 403);
        if (request.method === 'GET') {
          if (!managerObjects.has(objectPath)) return json({ message: 'Fixture object unavailable' }, 404);
          stats.managerDownloads++;
          return new Response(managerObjects.get(objectPath), { headers: { 'Content-Type': 'application/octet-stream' } });
        }
        if (request.method === 'POST' || request.method === 'PUT') {
          let raw;
          if (request.headers.get('Content-Type')?.includes('multipart/form-data')) {
            const data = await request.formData(), file = [...data.values()].find(value => typeof value?.text === 'function');
            if (!file) return json({ message: 'Fixture upload has no career file' }, 400);
            raw = await file.text();
          } else raw = await request.text();
          managerObjects.set(objectPath, raw); stats.managerUploads++;
          return json({ Key: objectPath, Id: 'fixture-object' });
        }
      }
      return json({ message: 'Unexpected fixture career operation' }, 405);
    }
    return json({ error: 'Unexpected test auth route' }, 404);
  }
  if (url.origin === 'https://repocompany.uk' || url.origin === 'https://www.repocompany.uk') {
    if (url.pathname === '/') return new Response(portal, { headers: { 'Content-Type': 'text/html' } });
    if (url.pathname === '/api/dashboard/state') return json({ username: 'LauncherTest', profile: { display_name: 'Launcher Test', repo_score: stats.achievementFacts.length }, activity: [], friends: [] });
    if (url.pathname === '/api/dashboard/play' || url.pathname === '/api/dashboard/playtime' || url.pathname === '/api/dashboard/presence') return json({ ok: true });
    if (url.pathname === '/api/characters/moratales') {
      stats.characterRequests++;
      if (request.headers.get('Authorization') !== 'Bearer ' + token) return json({ error: 'Sign in' }, 401);
      if (stats.characterMode === 'outage') return json({ error: 'Fixture character service unavailable' }, 503);
      if (stats.characterMode === 'auto') {
        if (request.method === 'POST') {
          const body = await request.json();
          if (body.revision !== stats.characterRevision) return json({ error: 'Characters changed elsewhere', code: 'revision_conflict' }, 409);
          if (!Array.isArray(body.characters) || body.characters.some(character => !/^slot-[0-2]$|^current$/.test(character.id) || !character.name || !character.look?.skin || !character.look?.hair)) return json({ error: 'Invalid fixture characters' }, 400);
          stats.characterWrites.push(body); stats.characterCloud = structuredClone(body.characters); stats.characterRevision++;
        } else if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
        return json({ userId: USER_ID, revision: stats.characterRevision, characters: stats.characterCloud, updatedAt: stats.characterRevision ? new Date().toISOString() : null });
      }
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
      return json({ userId: stats.characterMode === 'wrong-account' ? '66666666-2222-4333-8444-555555555555' : USER_ID, revision: 1, characters: stats.characterMode === 'empty' ? [] : [sharedCharacter], updatedAt: '2026-10-15T10:00:00Z' });
    }
    if (url.pathname.startsWith('/api/achievements/')) {
      const body = request.method === 'POST' ? await request.json() : {};
      if (url.pathname.endsWith('/progress')) stats.achievementFacts.push(body.facts);
      return json({ session: 'fixture-achievement-session', achievements: [], newUnlocks: [], repoScore: stats.achievementFacts.length });
    }
    return serveFile(request, root, url.pathname);
  }
  if (url.origin === 'https://morogue.repocompany.uk') {
    if (url.pathname === '/api/health') return json({ game: 'Morogue', protocol: 1 });
    if (url.pathname === '/api/leaderboards/account') return request.headers.get('Authorization') === 'Bearer ' + token ? json({ id: USER_ID, username: 'LauncherTest' }) : json({ error: 'Sign in' }, 401);
    if (url.pathname.startsWith('/api/leaderboards/')) {
      const body = request.method === 'POST' ? await request.json() : {};
      if (url.pathname.endsWith('/start')) { stats.starts.push(body); return json({ runId: body.runId, username: 'LauncherTest' }); }
      if (url.pathname.endsWith('/finish')) { stats.finishes.push(body); return json({ ok: true, posted: true, seq: body.seq }); }
      if (url.pathname.endsWith('/checkpoint')) return json({ ok: true, seq: body.seq });
      return json({ rows: [], total: 0, page: 0, own: null });
    }
  }
  if (url.origin === 'https://moratales.repocompany.uk' && url.pathname === '/api/health') return json({ game: 'Moratales', protocol: 1 });
  if (url.origin === 'https://moratales.repocompany.uk' && url.pathname.endsWith('/character-bridge.html')) return new Response('<!doctype html><script>addEventListener("message",e=>{if(e.origin==="https://morogue.repocompany.uk")e.source.postMessage({...e.data,result:e.data.action==="characters"?[]:true},e.origin);});</script>', { headers: { 'Content-Type': 'text/html' } });
  return json({ error: 'Unexpected test route' }, 404);
}
module.exports = { configure, fetch: fixtureFetch, stats, USER_ID };
