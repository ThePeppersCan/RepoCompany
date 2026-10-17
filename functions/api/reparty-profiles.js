import config from '../../dashboard-config.json';

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' };
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url), origin = request.headers.get('Origin');
  if (origin && origin !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') return reply({ error: 'Use Repo Company.' }, 403);
  const ids = [...new Set((url.searchParams.get('ids') || '').split(',').map(id => id.toLowerCase()))];
  if (!ids.length || ids.length > 100 || ids.some(id => !uuid.test(id))) return reply({ error: 'Invalid player list.' }, 400);
  const token = request.headers.get('Authorization')?.match(/^Bearer ([^\s]{1,8192})$/)?.[1];
  if (!token) return reply({ error: 'Sign in to Reparty.' }, 401);
  try {
    const auth = await fetch(config.url + '/auth/v1/user', { headers: { apikey: config.key, Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(8000) });
    if (!auth.ok) return reply({ error: 'Sign in again.' }, 401);
    const user = await auth.json();
    if (!uuid.test(user.id || '')) return reply({ error: 'Sign in again.' }, 401);
    const db = env.DASHBOARD_DB?.withSession?.('first-primary') || env.DASHBOARD_DB;
    if (!db) return reply({ error: 'Profiles are unavailable.' }, 503);
    // Resolve identities by verified account UUID, never by a guest's chosen name.
    const me = await db.prepare('SELECT username FROM dashboard_players WHERE user_id=?').bind(user.id).first();
    const name = me?.username || '';
    const data = await db.prepare(`SELECT p.user_id,p.username,a.config avatar,f.frame_id,(SELECT version FROM dashboard_profile_photos WHERE user_id=p.user_id AND enabled=1) photo_version FROM dashboard_players p
      LEFT JOIN dashboard_avatars a ON a.username=p.username
      LEFT JOIN dashboard_avatar_frames f ON f.username=p.username
      LEFT JOIN dashboard_profile_privacy v ON v.username=p.username
      WHERE p.user_id IN (${ids.map(() => '?').join(',')})
      AND NOT EXISTS(SELECT 1 FROM dashboard_blocks b WHERE (b.blocker=? AND b.blocked=p.username) OR (b.blocked=? AND b.blocker=p.username))
      AND (p.user_id=? OR COALESCE(v.private_profile,0)=0 OR EXISTS(SELECT 1 FROM dashboard_friendships q WHERE q.status='accepted' AND ((q.player_a=? AND q.player_b=p.username) OR (q.player_b=? AND q.player_a=p.username))))`).bind(...ids, name, name, user.id, name, name).all();
    for (const p of data.results) { try { p.avatar = typeof p.avatar === 'string' ? JSON.parse(p.avatar) : p.avatar; } catch { p.avatar = null; } }
    return reply({ profiles: data.results });
  } catch { return reply({ error: 'Profiles are temporarily unavailable.' }, 503); }
}
