import { config } from './config.js';
import { avatars, avatarGroups } from './avatars.js';
import { parseVideo, playbackPosition, formatTime, validRoom, avatarPosition } from './core.mjs';

const $ = id => document.getElementById(id);
const db = window.supabase?.createClient(config.url, config.key);
let user = null, room = null, roomId = null, selectedPlaylist = null, channel = null;
let player = null, playerReady = false, playerVideo = null, youtubePromise = null;
let playerReadyTimer = null;
let myAvatar = 0, offset = 0, suppressUntil = 0, blocked = false, pendingPlayback = false;
let poll = null, refreshing = false, refreshAgain = false, toastTimer = null, refreshTimer = null;
let queueSignature = '', membersSignature = '', messageSignature = '', lastMessageId = 0, unread = 0, messagesLoaded = false;
let lastObserved = null, lastCorrection = 0, selectedAvatarGroup = 'animals', editAction = null;
let connectionReady = false, generation = 0, authUserId = null;

function node(tag, text, className) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (className) e.className = className;
  return e;
}
function notify(message) {
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000);
}
function friendly(error) {
  console.warn('Reparty:', error);
  const message = String(error?.message || error || 'Something went wrong. Please try again.');
  if (/reparty_action|schema cache|does not exist|PGRST202/i.test(message)) return 'The room service is not available yet. Please try again later.';
  if (/fetch|network|failed to send/i.test(message)) return 'Connection interrupted. Check your connection and try again.';
  if (/Invalid login credentials/i.test(message)) return 'That username or password wasn’t recognised.';
  return message;
}
function modal(id) { if (!$(id).open) $(id).showModal(); }
function avatarElement(id, name = '') {
  const e = node('span', undefined, 'avatar');
  applyAvatar(e, id);
  e.setAttribute('role', 'img');
  e.setAttribute('aria-label', name || avatars[Number(id)]?.name || 'Avatar');
  return e;
}
function applyAvatar(e, id) {
  const { sheet, x, y } = avatarPosition(id);
  e.style.backgroundImage = `url('../assets/reparty/avatars-${avatarGroups[sheet].key}.png')`;
  e.style.backgroundPosition = `${x}% ${y}%`;
}
function setConnected(ok, label) {
  connectionReady = ok;
  $('connection').textContent = label;
  $('syncLabel').textContent = ok ? 'In sync' : roomId ? 'Reconnecting' : 'Not connected';
  ['addButton', 'builtinPlaylist', 'shufflePlaylist', 'newPlaylist', 'renamePlaylist', 'deletePlaylist', 'playlistSelect', 'sendMessage', 'message'].forEach(id => { $(id).disabled = !ok; });
  const hasVideo = !!room?.playback?.video_id;
  ['togglePlay', 'nextVideo', 'seek'].forEach(id => { $(id).disabled = !ok || !hasVideo; });
  $('resync').disabled = !ok;
  $('roomLink').disabled = !roomId;
}
async function rpc(action, data = {}, target = roomId) {
  if (!db || !user) throw new Error('Please sign in with your RepoCompany account.');
  const started = Date.now();
  const { data: response, error } = await db.rpc('reparty_action', { p_action: action, p_room: target, p_data: data });
  if (error) throw error;
  if (response?.server_time) offset = Date.parse(response.server_time) - (started + Date.now()) / 2;
  return response;
}
function playlist() { return room?.playlists.find(p => p.id === selectedPlaylist); }
function playingEntry() {
  for (const p of room?.playlists || []) {
    const item = p.items.find(i => i.id === room.playback.item_id);
    if (item) return { playlist: p, item };
  }
  return null;
}
async function mutate(action, data = {}, retry = true) {
  const target = roomId;
  const response = await rpc(action, data, target);
  if (target === roomId) {
    if (response.stale) {
      await refresh();
      if (action === 'next' && retry && room?.playback.item_id === data.item_id) return mutate(action, { ...data, revision: room.revision }, false);
    }
    else applySnapshot(response);
  }
  return response;
}
function applySnapshot(data) {
  if (!data?.room || data.room.id !== roomId) return;
  if (room && Number(data.room.revision) < Number(room.revision)) return;
  const playbackChanged = !room || JSON.stringify(data.room.playback) !== JSON.stringify(room.playback);
  room = data.room;
  myAvatar = data.avatar_id;
  $('roomName').textContent = room.name;
  document.title = `${room.name} · Reparty`;
  $('roomFootnote').textContent = `Room ${room.id} · Everyone can control playback and edit playlists.`;
  if (!room.playlists.some(p => p.id === selectedPlaylist)) selectedPlaylist = room.playlists[0]?.id;
  renderPlaylists();
  renderMembers(data.members);
  renderMessages(data.messages);
  applyAvatar($('myAvatar'), myAvatar);
  $('chooseAvatar').disabled = false;
  setConnected(true, `${data.members.length} watching together`);
  $('emptyHint').textContent = 'Paste a YouTube link above. Everyone in your room can add videos.';
  $('startRoom').hidden = true;
  $('togglePlay').textContent = room.playback.playing ? 'Ⅱ' : '▶';
  $('togglePlay').setAttribute('aria-label', room.playback.playing ? 'Pause for everyone' : 'Play for everyone');
  $('nowPlaying').textContent = playingEntry()?.item.title || 'Choose a video from your playlist';
  if (playbackChanged) applyPlayback().catch(error => notify(friendly(error)));
}
async function refresh() {
  if (!roomId || !user) return;
  if (refreshing) { refreshAgain = true; return; }
  refreshing = true;
  const target = roomId;
  try {
    const data = await rpc('snapshot', {}, target);
    if (roomId === target) applySnapshot(data);
  } catch (error) {
    if (roomId === target) setConnected(false, 'Reconnecting…');
    console.warn('Reparty refresh:', error);
  } finally {
    refreshing = false;
    if (refreshAgain) { refreshAgain = false; scheduleRefresh(); }
  }
}
function scheduleRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(refresh, 100); }
function renderPlaylists() {
  const signature = JSON.stringify([room.playlists, selectedPlaylist, room.playback.item_id]);
  if (signature === queueSignature) return;
  queueSignature = signature;
  $('playlistSelect').replaceChildren(...room.playlists.map(p => { const o = node('option', p.name); o.value = p.id; return o; }));
  $('playlistSelect').value = selectedPlaylist;
  const p = playlist();
  $('queueCount').textContent = p?.items.length || 0;
  $('queue').replaceChildren();
  if (!p?.items.length) {
    const empty = node('li', undefined, 'empty-list');
    empty.append(node('span', '♫'), node('strong', 'Your next favourite is waiting.'), node('p', 'Paste a YouTube link above to start your shared playlist.'));
    $('queue').append(empty);
    return;
  }
  p.items.forEach((item, index) => {
    const li = node('li', undefined, `queue-item${room.playback.item_id === item.id ? ' is-playing' : ''}`);
    const img = node('img');
    img.src = `https://i.ytimg.com/vi/${item.video_id}/mqdefault.jpg`;
    img.alt = ''; img.loading = 'lazy';
    const copy = node('div');
    const title = node('button', item.title, 'queue-title');
    title.title = `Play ${item.title} for everyone`;
    title.onclick = () => run(() => mutate('play', { playlist_id: p.id, item_id: item.id }));
    copy.append(title, node('small', room.playback.item_id === item.id ? 'NOW PLAYING' : `Added by ${item.added_by}`));
    const actions = node('div', undefined, 'item-actions');
    const play = node('button', '▶ Play'); play.onclick = title.onclick;
    actions.append(play);
    [['↑', 'up', index === 0], ['↓', 'down', index === p.items.length - 1]].forEach(([label, direction, disabled]) => {
      const b = node('button', label); b.disabled = disabled; b.setAttribute('aria-label', `Move ${item.title} ${direction}`);
      b.onclick = () => run(() => mutate('move', { playlist_id: p.id, item_id: item.id, direction })); actions.append(b);
    });
    const remove = node('button', '×'); remove.setAttribute('aria-label', `Remove ${item.title}`);
    remove.onclick = () => run(() => mutate('remove', { playlist_id: p.id, item_id: item.id })); actions.append(remove);
    li.append(img, copy, actions); $('queue').append(li);
  });
}
function renderMembers(members) {
  const signature = JSON.stringify(members);
  if (signature === membersSignature) return;
  membersSignature = signature;
  $('participants').replaceChildren();
  members.forEach(m => {
    const e = node('div', undefined, 'person');
    const copy = node('div');
    const name = node('span', m.name); name.prepend(node('i', undefined, 'online-dot'));
    copy.append(name); if (m.user_id === user.id) copy.append(node('span', 'You', 'you'));
    e.append(avatarElement(m.avatar_id, `${m.name}'s avatar`), copy); $('participants').append(e);
  });
}
function renderMessages(messages) {
  const signature = JSON.stringify(messages.map(m => m.id));
  if (signature === messageSignature) return;
  messageSignature = signature;
  const container = $('messages');
  const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 70;
  const newMessages = messagesLoaded ? messages.filter(m => m.id > lastMessageId && m.user_id !== user.id).length : 0;
  messagesLoaded = true;
  if ($('chatPanel').hidden) unread += newMessages;
  $('unread').hidden = unread === 0; $('unread').textContent = unread;
  lastMessageId = messages.at(-1)?.id || 0;
  container.replaceChildren();
  if (!messages.length) container.append(node('p', 'First one here? Say hello.', 'muted'));
  messages.forEach(m => {
    const e = node('article', undefined, 'chat-message');
    const copy = node('div');
    const header = node('header');
    const time = node('time', new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); time.dateTime = m.created_at;
    header.append(node('strong', m.display_name), time); copy.append(header, node('p', m.body));
    e.append(avatarElement(m.avatar_id), copy); container.append(e);
  });
  if (nearBottom) container.scrollTop = container.scrollHeight;
}
async function leaveRoom() {
  generation++;
  const oldRoom = roomId;
  roomId = null; room = null; playerVideo = null; blocked = false;
  clearInterval(poll); clearTimeout(refreshTimer);
  if (channel) { await db.removeChannel(channel); channel = null; }
  suppressUntil = performance.now() + 2000;
  try { player?.stopVideo?.(); } catch {}
  $('emptyScreen').hidden = false;
  $('enablePlayback').hidden = true;
  setConnected(false, user ? 'Choose a room' : 'Sign in to join');
  queueSignature = membersSignature = messageSignature = ''; lastMessageId = unread = 0; messagesLoaded = false;
  if (oldRoom && user) rpc('leave', {}, oldRoom).catch(() => {});
}
async function join(code) {
  if (!validRoom(code)) throw new Error('Paste a valid Reparty room link or its 12-character code.');
  await leaveRoom();
  const ticket = generation;
  const data = await rpc('join', {}, code);
  if (ticket !== generation) return;
  roomId = code;
  history.replaceState(null, '', `?room=${code}`);
  applySnapshot(data);
  $('lobby').close();
  channel = db.channel(`reparty:${code}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reparty_rooms', filter: `id=eq.${code}` }, scheduleRefresh)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reparty_messages', filter: `room_id=eq.${code}` }, scheduleRefresh)
    .subscribe(status => {
      if (roomId !== code) return;
      if (status === 'SUBSCRIBED') refresh();
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') $('connection').textContent = 'Using backup connection';
    });
  poll = setInterval(refresh, 8000); // Also supplies presence heartbeats and reconnect catch-up.
}
function roomCode(value) {
  const input = value.trim().toLowerCase();
  if (validRoom(input)) return input;
  try { return new URL(input).searchParams.get('room') || ''; } catch { return ''; }
}
async function loadYoutube() {
  if (window.YT?.Player) return;
  if (youtubePromise) return youtubePromise;
  youtubePromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => { youtubePromise = null; reject(new Error('YouTube could not load. Check your connection or content blocker.')); }, 15000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timer); resolve(); };
    const script = node('script'); script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { clearTimeout(timer); youtubePromise = null; script.remove(); reject(new Error('YouTube could not load. Please try again.')); };
    document.head.append(script);
  });
  return youtubePromise;
}
async function ensurePlayer() {
  await loadYoutube();
  if (player) return;
  player = new window.YT.Player('youtubePlayer', {
    width: '100%', height: '100%', host: 'https://www.youtube-nocookie.com',
    playerVars: { playsinline: 1, origin: location.origin, controls: 1, rel: 0 },
    events: {
      onReady: () => { clearTimeout(playerReadyTimer); playerReady = true; player.setVolume(Number($('volume').value)); $('mute').disabled = false; applyPlayback().catch(error => notify(friendly(error))); },
      onStateChange: onPlayerState,
      onPlaybackRateChange: event => { if (event.data !== 1) player.setPlaybackRate(1); },
      onAutoplayBlocked: () => { blocked = true; $('enablePlayback').hidden = false; },
      onError: event => {
        const messages = { 100: 'This video is unavailable or private.', 101: 'The owner does not allow this video to play on other websites.', 150: 'The owner does not allow this video to play on other websites.', 153: 'YouTube could not verify this page. Open Reparty from the website rather than a local file.', 2: 'That video link is invalid.', 5: 'This video cannot play in this browser.' };
        notify(`${messages[event.data] || 'YouTube could not play this video.'} Choose another video or use Next.`);
      }
    }
  });
  playerReadyTimer = setTimeout(() => {
    if (playerReady) return;
    notify('YouTube is taking too long to load. Check your connection or content blocker, then use In sync to retry.');
    player?.destroy?.(); player = null; playerVideo = null;
    if (!$('youtubePlayer')) { const target = node('div'); target.id = 'youtubePlayer'; $('screen').prepend(target); }
    $('emptyHint').textContent = 'YouTube could not load. Use In sync to try again.';
  }, 15000);
}
async function applyPlayback(force = false) {
  const pb = room?.playback;
  if (!pb?.video_id) {
    suppressUntil = performance.now() + 1600; playerVideo = null;
    if (playerReady) player.stopVideo();
    $('emptyScreen').hidden = false; $('videoTime').textContent = '0:00 / 0:00'; $('seek').value = 0;
    return;
  }
  if (!playerReady) $('emptyHint').textContent = 'Connecting to YouTube…';
  await ensurePlayer();
  if (!playerReady || pb !== room?.playback) return;
  $('emptyScreen').hidden = true;
  const position = playbackPosition(pb, Date.now() + offset);
  const different = playerVideo !== pb.video_id;
  suppressUntil = performance.now() + 1700;
  lastObserved = null;
  if (different) {
    playerVideo = pb.video_id; blocked = false; $('enablePlayback').hidden = true;
    const opts = { videoId: pb.video_id, startSeconds: position };
    if (pb.playing) player.loadVideoById(opts); else player.cueVideoById(opts);
  } else {
    if (force || Math.abs(player.getCurrentTime() - position) > 1.25) player.seekTo(position, true);
    if (pb.playing && !blocked && player.getPlayerState() !== 1) player.playVideo();
    if (!pb.playing && player.getPlayerState() !== 2) player.pauseVideo();
  }
}
async function publishPlayback(playing, position) {
  if (!room?.playback.video_id || !connectionReady || pendingPlayback) return;
  pendingPlayback = true;
  try { await mutate('playback', { item_id: room.playback.item_id, playing, position: Math.max(0, Math.min(86400, position)) }); }
  finally { pendingPlayback = false; }
}
function onPlayerState(event) {
  if (!room?.playback.video_id || !connectionReady || playerVideo !== room.playback.video_id) return;
  if (event.data === 0 && room.playback.playing) {
    const current = playingEntry();
    if (current) run(() => mutate('next', { playlist_id: current.playlist.id, item_id: current.item.id, revision: room.revision }));
    return;
  }
  if (performance.now() < suppressUntil || blocked || pendingPlayback) return;
  if ((event.data === 1 && !room.playback.playing) || (event.data === 2 && room.playback.playing)) run(() => publishPlayback(event.data === 1, player.getCurrentTime()));
}
setInterval(() => {
  if (!playerReady || !room?.playback.video_id) return;
  const current = player.getCurrentTime(), duration = player.getDuration(), state = player.getPlayerState(), now = performance.now();
  if (document.activeElement !== $('seek')) { $('seek').max = Math.max(duration, 1); $('seek').value = current; }
  $('videoTime').textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  if (now > suppressUntil && !blocked && !pendingPlayback && connectionReady) {
    // Detect scrubbing through YouTube's own controls, without broadcasting buffering.
    const delta = lastObserved ? current - lastObserved.time : 0;
    const elapsed = lastObserved ? (now - lastObserved.at) / 1000 : 0;
    const jumped = lastObserved && ((state === 1 && lastObserved.state === 1 && (delta < -1.5 || delta > elapsed + 2)) || (state === 2 && lastObserved.state === 2 && Math.abs(delta) > 1.5));
    if (jumped) { lastCorrection = now; run(() => publishPlayback(room.playback.playing, current)); }
    else if ([1, 2].includes(state) && now - lastCorrection > 5000 && Math.abs(current - playbackPosition(room.playback, Date.now() + offset)) > 2.5) {
      lastCorrection = now; applyPlayback(true).catch(() => {});
    }
  }
  if ([1, 2].includes(state)) lastObserved = { state, time: current, at: now };
}, 500);

async function run(fn, errorId) {
  try { await fn(); }
  catch (error) { const message = friendly(error); if (errorId) $(errorId).textContent = message; else notify(message); }
}
function onForm(id, fn, errorId) {
  $(id).addEventListener('submit', async event => {
    event.preventDefault(); const button = $(id).querySelector('button[type=submit],button:not([type])');
    if (button?.disabled) return;
    if (button) button.disabled = true;
    if (errorId) $(errorId).textContent = '';
    await run(fn, errorId);
    if (button) button.disabled = ['addVideo', 'chatForm'].includes(id) ? !connectionReady : false;
  });
}
function requireUser() { if (!user) { modal('auth'); return false; } return true; }
async function metadata(videoId) {
  try {
    const response = await fetch(`/api/reparty-video?id=${encodeURIComponent(videoId)}`, { signal: AbortSignal.timeout(6000) });
    if (response.ok) { const data = await response.json(); if (data.title) return data.title.slice(0, 160); }
  } catch {}
  // Static hosting can still use YouTube oEmbed; failed metadata never prevents adding a link.
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`, { signal: AbortSignal.timeout(5000) });
    if (response.ok) return String((await response.json()).title || 'YouTube video').slice(0, 160);
  } catch {}
  return `YouTube · ${videoId}`;
}
onForm('addVideo', async () => {
  if (!requireUser()) return;
  if (!roomId) { modal('lobby'); return; }
  const id = parseVideo($('videoUrl').value);
  if (!id) throw new Error('Paste a YouTube video link, Shorts link or 11-character video ID.');
  const target = roomId, listId = selectedPlaylist;
  const title = await metadata(id);
  if (target !== roomId) return;
  await mutate('add', { playlist_id: listId, video_id: id, title });
  $('videoUrl').value = ''; notify('Added to your shared playlist.');
});
onForm('createRoom', async () => {
  if (!requireUser()) return;
  const response = await rpc('create', { name: $('newRoomName').value });
  await join(response.id);
}, 'lobbyError');
onForm('joinRoom', async () => { if (requireUser()) await join(roomCode($('roomCode').value)); }, 'lobbyError');
onForm('loginForm', async () => {
  const username = $('username').value.trim().toLowerCase();
  const { error } = await db.auth.signInWithPassword({ email: `${username}@${config.authDomain}`, password: $('password').value });
  if (error) throw error;
  $('password').value = ''; $('auth').close();
}, 'authError');
onForm('chatForm', async () => {
  const body = $('message').value.trim(); if (!body) return;
  await mutate('chat', { body }); $('message').value = ''; $('messages').scrollTop = $('messages').scrollHeight;
});
$('message').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('chatForm').requestSubmit(); } });
$('playlistSelect').onchange = () => { selectedPlaylist = $('playlistSelect').value; renderPlaylists(); };
$('togglePlay').onclick = () => run(() => publishPlayback(!room.playback.playing, playerReady ? player.getCurrentTime() : playbackPosition(room.playback, Date.now() + offset)));
$('nextVideo').onclick = () => { const current = playingEntry(); if (current) run(() => mutate('next', { playlist_id: current.playlist.id, item_id: current.item.id, revision: room.revision })); };
$('seek').onchange = () => run(() => publishPlayback(room.playback.playing, Number($('seek').value)));
$('volume').oninput = () => { if (playerReady) { player.setVolume(Number($('volume').value)); player.unMute(); $('mute').textContent = '♪'; } };
$('mute').onclick = () => { if (!playerReady) return; const muted = player.isMuted(); if (muted) player.unMute(); else player.mute(); $('mute').textContent = muted ? '♪' : '×'; $('mute').setAttribute('aria-label', muted ? 'Mute my audio' : 'Unmute my audio'); };
$('resync').onclick = () => run(async () => { await refresh(); await applyPlayback(true); notify('Caught up with your room.'); });
$('enablePlayback').onclick = () => { blocked = false; $('enablePlayback').hidden = true; if (playerReady) { player.playVideo(); suppressUntil = performance.now() + 1700; } applyPlayback(true).catch(error => notify(friendly(error))); };
$('fullscreen').onclick = () => run(async () => { if (document.fullscreenElement) await document.exitFullscreen(); else if ($('television').requestFullscreen) await $('television').requestFullscreen(); });
$('focusAdd').onclick = () => { $('videoUrl').focus(); $('videoUrl').scrollIntoView({ block: 'center', behavior: 'smooth' }); };
$('startRoom').onclick = $('changeRoom').onclick = () => { if (requireUser()) modal('lobby'); };
$('account').onclick = () => { if (user) { notify(`Connected as ${user.user_metadata?.username || 'your RepoCompany account'}. Manage your account on RepoCompany.`); } else modal('auth'); };
$('roomLink').onclick = () => run(async () => {
  try { await navigator.clipboard.writeText(location.href); notify('Room link copied.'); }
  catch { openEdit('Your room link', 'Copy this link', async () => {}, location.href, false, true); }
});
document.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => $(b.dataset.close).close(); });
function showTab(tab) {
  const chat = tab === 'chat';
  ['playlist', 'chat'].forEach(name => { const active = name === tab; $(`${name}Panel`).hidden = !active; $(`${name}Tab`).setAttribute('aria-selected', String(active)); $(`${name}Tab`).tabIndex = active ? 0 : -1; });
  if (chat) { unread = 0; $('unread').hidden = true; $('messages').scrollTop = $('messages').scrollHeight; }
}
['playlist', 'chat'].forEach(name => { $(`${name}Tab`).onclick = () => showTab(name); $(`${name}Tab`).onkeydown = e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); const target = name === 'chat' ? 'playlist' : 'chat'; showTab(target); $(`${target}Tab`).focus(); } }; });
function openEdit(heading, label, action, value = '', confirm = false, readOnly = false) {
  $('editHeading').textContent = heading; $('editLabel').textContent = label;
  $('editValue').value = value; $('editValue').hidden = confirm; $('editLabel').hidden = confirm;
  $('editValue').required = !confirm; $('editValue').readOnly = readOnly; $('editValue').maxLength = readOnly ? 2048 : 60;
  $('editDescription').textContent = confirm ? label : ''; $('editError').textContent = '';
  $('editSubmit').textContent = confirm ? 'Delete playlist' : readOnly ? 'Done' : 'Save';
  editAction = action; modal('editDialog'); if (!confirm) { $('editValue').focus(); $('editValue').select(); }
}
onForm('editForm', async () => { await editAction($('editValue').value.trim()); $('editDialog').close(); }, 'editError');
$('shufflePlaylist').onclick = async () => {
  const p = playlist();
  if (!p || p.items.length < 2) return notify('Add at least two videos to shuffle.');
  const target = roomId;
  $('shufflePlaylist').disabled = true;
  try {
    await mutate('playlist_shuffle', { playlist_id: p.id });
    if (target === roomId) notify('Playlist shuffled for everyone. The current video keeps playing.');
  } catch (error) { notify(friendly(error)); }
  finally { $('shufflePlaylist').disabled = !connectionReady; }
};
$('builtinPlaylist').onclick = async () => {
  const target = roomId;
  $('builtinPlaylist').disabled = true;
  try {
    await mutate('playlist_builtin');
    if (target !== roomId) return;
    selectedPlaylist = room.playlists.find(p => p.preset_key === 'playlist-of-gods')?.id || selectedPlaylist;
    renderPlaylists();
    notify('The Playlist of gods is ready. This room has its own editable copy.');
  } catch (error) { notify(friendly(error)); }
  finally { $('builtinPlaylist').disabled = !connectionReady; }
};
$('newPlaylist').onclick = () => openEdit('A new shared playlist.', 'Playlist name', name => mutate('playlist_create', { name }));
$('renamePlaylist').onclick = () => { const p = playlist(); openEdit('Rename your playlist.', 'Playlist name', name => mutate('playlist_rename', { playlist_id: p.id, name }), p.name); };
$('deletePlaylist').onclick = () => { const p = playlist(); openEdit('Delete this playlist?', `“${p.name}” and its videos will be removed for everyone in this room.`, () => mutate('playlist_delete', { playlist_id: p.id }), '', true); };
function renderAvatars() {
  $('avatarFilters').replaceChildren(...avatarGroups.map(group => {
    const b = node('button', group.label); b.setAttribute('aria-pressed', String(group.key === selectedAvatarGroup));
    b.onclick = () => { selectedAvatarGroup = group.key; renderAvatars(); }; return b;
  }));
  $('avatarGrid').replaceChildren(...avatars.filter(a => a.group === selectedAvatarGroup).map(a => {
    const b = node('button', undefined, 'avatar-option'); b.title = a.name; b.setAttribute('aria-label', `Choose ${a.name}`); b.setAttribute('aria-pressed', String(a.id === myAvatar));
    b.append(avatarElement(a.id, a.name), node('span', a.name));
    b.onclick = async () => {
      b.disabled = true; $('avatarError').textContent = '';
      await run(async () => { await rpc('avatar', { avatar_id: a.id }); myAvatar = a.id; applyAvatar($('myAvatar'), myAvatar); await refresh(); $('avatarDialog').close(); notify('Avatar saved.'); }, 'avatarError'); b.disabled = false;
    }; return b;
  }));
}
$('chooseAvatar').onclick = () => { renderAvatars(); modal('avatarDialog'); };
window.addEventListener('online', scheduleRefresh);
document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleRefresh(); });
async function authChanged(session) {
  const next = session?.user || null;
  if (authUserId === next?.id && user) { user = next; return; }
  authUserId = next?.id || null; user = next;
  if (!user) {
    await leaveRoom(); $('participants').replaceChildren(node('p', 'Your friends will appear here.', 'muted'));
    $('queue').replaceChildren(); $('messages').replaceChildren(); $('roomName').textContent = 'Your forest watch party';
    $('nowPlaying').textContent = 'Nothing playing yet'; $('queueCount').textContent = '0';
    $('startRoom').hidden = false; $('emptyHint').textContent = 'Make a room, add a video and settle in together.';
    $('account').textContent = 'Sign in'; $('chooseAvatar').disabled = true;
    $('lobby').close(); modal('auth'); return;
  }
  $('auth').close(); $('account').textContent = user.user_metadata?.username || 'My account';
  try {
    const profile = await rpc('profile'); myAvatar = profile.avatar_id; applyAvatar($('myAvatar'), myAvatar); $('chooseAvatar').disabled = false;
    const code = new URLSearchParams(location.search).get('room');
    if (validRoom(code)) await join(code); else modal('lobby');
  } catch (error) { modal('lobby'); $('lobbyError').textContent = friendly(error); }
}
if (!db) notify('The account service could not load. Check your connection and refresh.');
else {
  // Deferring avoids making another Supabase auth request inside its auth callback lock.
  db.auth.onAuthStateChange((_event, session) => { setTimeout(() => { authChanged(session).catch(error => notify(friendly(error))); }, 0); });
  db.auth.getSession().then(({ data, error }) => { if (error) throw error; return authChanged(data.session); }).catch(error => notify(friendly(error)));
}
applyAvatar($('myAvatar'), 0);
