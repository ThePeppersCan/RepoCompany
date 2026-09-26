const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const assert = require('node:assert/strict');
const { init, seed, call, a, b, c } = require('./game-mode.cjs');
const root = path.resolve(__dirname, '..');
const migration = path.join(root, 'supabase/migrations/20260926010000_reparty_suno_queue.sql');
const id = 'c72dcf81-5611-4c75-9a62-07a9c9e51fa8';
const video = `suno:${id}`;
async function test() {
  const core = await import(pathToFileURL(path.join(root, 'core.mjs')));
  const api = await import(pathToFileURL(path.join(root, '../functions/api/reparty-suno.js')));
  for (const link of [`https://suno.com/song/${id}`, `https://www.suno.com/embed/${id}/?autoplay=1`, `suno.com/song/${id}`]) assert.equal(core.parseSunoLink(link).id, id);
  assert.equal(core.parseSunoLink('https://suno.com/s/0zYPTw3Mh2mWBy9d').share, '0zYPTw3Mh2mWBy9d');
  for (const link of ['https://suno.com.evil.test/song/' + id, 'https://evil.test/suno.com/song/' + id, 'https://suno.com@evil.test/song/' + id, 'https://user@suno.com/song/' + id, 'https://suno.com:444/song/' + id, 'https://suno.com/playlist/' + id, 'javascript:alert(1)', 'https://suno.com/s/../../secret']) assert.equal(core.parseSunoLink(link), null);
  assert.equal(core.parseVideo('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  const clip = { id, title: '<script>literal title</script>', audio_url: 'https://example.test/forbidden', metadata: { duration: 116.76 } };
  const html = `<script>self.__next_f.push(${JSON.stringify([1, 'a:' + JSON.stringify(['$', { clip }]) + '\n'])})</script>`;
  assert.deepEqual(api.extractSong(html, id), { id, title: clip.title, duration: 116.76 });
  assert.throws(() => api.extractSong(html, 'other'), /details/);
  assert.throws(() => api.extractSong(html.replace('116.76', '0'), id), /duration/);
  const calls = [];
  assert.equal((await api.resolveSuno('https://suno.com/s/0zYPTw3Mh2mWBy9d', async (url, opts) => {
    calls.push(url); assert.equal(opts.redirect, 'manual');
    return calls.length === 1 ? new Response(null, { status: 302, headers: { Location: '/song/' + id } }) : new Response(html);
  })).id, id);
  assert.equal(calls.length, 2);
  let requests = 0;
  await assert.rejects(api.resolveSuno('https://suno.com/s/0zYPTw3Mh2mWBy9d', async () => { requests++; return new Response(null, { status: 302, headers: { Location: 'http://127.0.0.1/secret' } }); }), /does not lead/);
  assert.equal(requests, 1);
  await assert.rejects(api.resolveSuno('https://evil.test/secret', () => { throw Error('must not fetch'); }), /Paste/);
  console.log('PASS URL validation, safe redirects, metadata parsing, no media returned');

  const pg = await init(); await seed(pg);
  const action = (user, name, room, data) => call(pg, user, 'reparty_action', name, room, data);
  const game = (name, room, data) => call(pg, a, 'reparty_game_action', name, room, data);
  const room = (await action(a, 'create', null, { name: 'Suno QA' })).id;
  await action(b, 'join', room);
  let snap = await action(a, 'snapshot', room);
  const list = snap.room.playlists[0].id;
  snap = await action(a, 'add', room, { playlist_id: list, video_id: 'dQw4w9WgXcQ', title: 'YouTube' });
  const yt = snap.room.playlists[0].items[0].id;
  snap = await action(a, 'play', room, { playlist_id: list, item_id: yt });
  snap = await game('enter', room, { revision: 0 });
  const before = snap.room;
  await pg.exec(fs.readFileSync(migration, 'utf8'));
  snap = await action(a, 'snapshot', room);
  assert.deepEqual(snap.room.playlists, before.playlists); assert.deepEqual(snap.room.playback, before.playback); assert.deepEqual(snap.room.settings, before.settings);
  assert.equal(snap.room.suno_queue, true);
  console.log('PASS upgrade preserves existing playback, playlists and Game mode');

  snap = await action(a, 'add', room, { playlist_id: list, video_id: video, title: 'Repo Company', duration: 116.76 });
  const item = snap.room.playlists[0].items[1];
  assert.equal(item.duration, 116.76);
  for (const duration of [undefined, null, 0, -1, 86401, '116', 'NaN']) await assert.rejects(action(a, 'add', room, { playlist_id: list, video_id: video, title: 'Invalid', duration }), /duration/i);
  await assert.rejects(action(a, 'add', room, { playlist_id: list, video_id: 'suno:invalid', duration: 50 }), /valid/);
  await assert.rejects(action(c, 'add', room, { playlist_id: list, video_id: video, duration: 50 }), /Join/);
  await assert.rejects(action(null, 'snapshot', room), /sign in/i);
  console.log('PASS mixed playlist, duration bounds and membership enforcement');

  snap = await action(a, 'play', room, { playlist_id: list, item_id: item.id });
  const timer = s => ({ playlist_id: list, item_id: s.room.playback.item_id, revision: s.room.revision, started_at: s.room.playback.updated_at });
  let next = await action(b, 'suno_next', room, timer(snap));
  assert.equal(next.room.playback.item_id, item.id); assert.equal(next.room.revision, snap.room.revision);
  snap = await action(a, 'playback', room, { item_id: item.id, playing: false, position: 500 });
  next = await action(b, 'suno_next', room, timer(snap)); assert.equal(next.room.playback.playing, false);
  snap = await action(a, 'playback', room, { item_id: item.id, playing: true, position: 70 }); assert.equal(snap.room.playback.position, 0);
  const oldTimer = timer(snap);
  snap = await action(a, 'play', room, { playlist_id: list, item_id: item.id });
  assert.equal((await action(b, 'suno_next', room, { ...oldTimer, revision: snap.room.revision })).stale, true);
  console.log('PASS no early/paused advances; resume restarts; old timer cannot skip a restart');

  async function expire() { await pg.query("update public.reparty_rooms set playback=jsonb_set(playback,'{updated_at}',to_jsonb((now()-interval '130 seconds')::text)) where id=$1", [room]); return action(a, 'snapshot', room); }
  snap = await expire();
  const due = timer(snap);
  next = await action(a, 'suno_next', room, due); assert.equal(next.room.playback.item_id, yt);
  assert.equal((await action(b, 'suno_next', room, due)).stale, true);
  snap = await action(a, 'playback', room, { item_id: yt, playing: true, position: 44 }); assert.equal(snap.room.playback.position, 44);
  await action(a, 'settings', room, { repeat: false });
  await action(a, 'play', room, { playlist_id: list, item_id: item.id }); snap = await expire();
  next = await action(a, 'suno_next', room, timer(snap)); assert.equal(next.room.playback.video_id, null);
  console.log('PASS timed mixed-provider transition, duplicate protection, YouTube seek and Repeat off');

  await action(a, 'remove', room, { playlist_id: list, item_id: yt });
  await action(a, 'settings', room, { repeat: true, shuffle: true });
  await action(a, 'play', room, { playlist_id: list, item_id: item.id }); snap = await expire();
  const single = timer(snap);
  next = await action(a, 'suno_next', room, single); assert.equal(next.room.playback.item_id, item.id); assert.notEqual(next.room.playback.updated_at, single.started_at);
  assert.equal((await action(b, 'suno_next', room, { ...single, revision: next.room.revision })).stale, true);
  await pg.exec(fs.readFileSync(migration, 'utf8'));
  snap = await action(a, 'snapshot', room); assert.equal(snap.room.playback.item_id, item.id);
  snap = await game('exit', room, { revision: snap.room.settings.game.revision }); assert.equal(snap.room.settings.game.mode, 'watch');
  console.log('PASS single-song shuffle/repeat, idempotent upgrade and Game mode after upgrade');
  await pg.close();
}
test().catch(error => { console.error(error.message, error.position || ''); process.exit(1); });
