import { createSunoPlayer } from './suno-player.js';
import { config } from './config.js';
import { createRepartyAuth } from './session-auth.mjs';
import { createProfiles } from './profiles.js';
import { parseVideo, parseSunoLink, isSuno, sunoQueueDuration, playbackPosition, formatTime, validRoom } from './core.mjs';

const $ = id => document.getElementById(id);
const sessionAuth = window.supabase && createRepartyAuth({
  createClient: (...args) => window.supabase.createClient(...args), config,
  onError: error => notify(friendly(error)),
  async onSession(client, session) {
    if (user && user.id !== session?.user?.id) await leaveRoom();
    db = client; accessToken = session?.access_token || null;
    await authChanged(session);
  }
});
let db = sessionAuth?.account;
let user = null, room = null, roomId = null, selectedPlaylist = null, channel = null;
let player = null, playerReady = false, playerVideo = null, youtubePromise = null;
let playerReadyTimer = null, loadGuardUntil = 0, skipTimer = null, shieldTimer = null;
let offset = 0, suppressUntil = 0, blocked = false, pendingPlayback = false;
let poll = null, refreshing = false, refreshAgain = false, toastTimer = null, refreshTimer = null;
let queueSignature = '', membersSignature = '', messageSignature = '', lastMessageId = 0, unread = 0, messagesLoaded = false;
let lastCorrection = 0, editAction = null;
let connectionReady = false, generation = 0, authUserId = null, accessToken = null;
let queueFilter = '', renderedPlaying = null, centreOnPlaying = true;
const UNPLAYABLE = [2, 100, 101, 150];
const profiles = createProfiles(() => accessToken);
let latestMembers = [];
let lobbyMode = null, lobbyRequest = 0, lobbyOffset = 0, lobbyRooms = [], lobbyLoading = false;
const sunoPlayer = createSunoPlayer($('sunoPlayer'), $('sunoNotice'));
let sunoAdvancing = false, lastSunoAdvance = 0;
let entering=null, entryEpoch=0;
let localPaused=false,localMuted=false,localVolume=70,lastMediaState='';
try{const prefs=JSON.parse(localStorage.getItem('repo-reparty-audio')||'{}');if(Number.isFinite(prefs.volume))localVolume=Math.max(0,Math.min(100,prefs.volume));localMuted=prefs.muted===true;}catch{}
$('volume').value=localVolume;
function mediaState(){return {authenticated:!!user,active:!!roomId,room:room?.name||'',roomId:roomId||'',title:playingEntry()?.item.title||'',playing:!!room?.playback?.playing&&!localPaused,paused:localPaused,muted:localMuted,volume:localVolume,canControl:!!room?.playback?.video_id,canVolume:!sunoActive(),provider:sunoActive()?'suno':'youtube',connected:connectionReady};}
function publishMedia(){const next=mediaState(),signature=JSON.stringify(next);if(signature===lastMediaState)return;lastMediaState=signature;if(parent!==window)parent.postMessage({type:'repo-reparty-state',state:next},location.origin);}
function saveAudio(){try{localStorage.setItem('repo-reparty-audio',JSON.stringify({volume:localVolume,muted:localMuted}));}catch{}}
async function localControl(action,value){
 if(action==='enter'){if(!roomId)await enterSharedRoom();return;}
 if(action==='join'){if(validRoom(value)&&roomId!==value){if(!requireUser()){history.replaceState(null,'','?embedded=1&room='+value);return;}await join(value);}return;}
 if(action==='leave'){await goHome();return;}
 if(action==='pause')localPaused=!localPaused;
 else if(action==='mute')localMuted=!localMuted;
 else if(action==='volume'&&Number.isFinite(value)){localVolume=Math.max(0,Math.min(100,value));localMuted=false;$('volume').value=localVolume;}
 else return;
 saveAudio();if(playerReady){player.setVolume(localVolume);if(localMuted)player.mute();else player.unMute();}mediaControls();
 if(action==='pause'||(action==='mute'&&sunoActive()))await applyPlayback(true);
}
addEventListener('message',event=>{if(event.source!==parent||parent===window||event.origin!==location.origin||event.data?.type!=='repo-reparty-control')return;const {action,value}=event.data;if(['pause','mute','volume','join','leave','enter'].includes(action))run(()=>localControl(action,value));});
window.repoRepartyPlayer=Object.freeze({getState:mediaState,control:localControl});

function sunoActive() { return isSuno(room?.playback?.video_id); }
function mediaControls() {
  const suno = sunoActive();publishMedia();$('mute').setAttribute('aria-label',localMuted?'Unmute my audio':'Mute my audio');$('mute').setAttribute('aria-pressed',String(localMuted));
  $('seek').disabled = !connectionReady || !room?.playback?.video_id || suno;
  $('seek').setAttribute('aria-label', suno ? 'Shared queue timer; Suno seeking is local' : 'Seek for everyone');
  $('mute').disabled = !room?.playback?.video_id;$('volume').disabled = suno || !playerReady;
  $('mute').title=localMuted?'Unmute my audio':'Mute my audio (M)';
  $('resync').title = suno ? 'Refresh the shared queue' : 'Catch up with the room';
  $('syncLabel').textContent = connectionReady ? (suno ? 'Queue timer' : 'In sync') : roomId ? 'Reconnecting' : 'Not connected';
  $('sunoRestart').disabled = !connectionReady;
  $('togglePlay').setAttribute('aria-label', room?.playback?.playing ? 'Pause for everyone' : suno ? 'Restart Suno for everyone' : 'Play for everyone');
  $('togglePlay').title = suno ? 'Pause for everyone; playing again restarts the song' : 'Play or pause for everyone (K)';
}

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
  if (/anonymous.*disabled/i.test(message)) return 'Guest access is temporarily unavailable. Please try again shortly or sign in.';
  if (/rate limit|too many requests/i.test(message)) return 'A few too many attempts. Please wait a moment and try again.';
  return message;
}
function modal(id) { if (!$(id).open) $(id).showModal(); }
async function lobbyRpc(action,data={}) {
  const {data:response,error}=await db.rpc('reparty_lobby_action',{p_action:action,p_room:null,p_data:data});
  if(error)throw error;return response;
}
function openLobby(mode='video') {
  lobbyMode='video';
  if(!requireUser())return;
  $('lobbyTitle').textContent='Rooms';
  $('lobbyEyebrow').textContent='REPARTY ROOMS';
  $('lobbyIntro').textContent='Join another room or create one.';
  $('lobbyError').textContent='';modal('lobby');loadRooms();
}
async function loadRooms(more=false) {
  const request=++lobbyRequest,mode=lobbyMode,who=user?.id;
  if(!who)return;
  lobbyLoading=true;$('refreshRooms').disabled=$('moreRooms').disabled=true;
  if(!more){lobbyOffset=0;lobbyRooms=[];$('roomDirectory').replaceChildren(node('p','Loading rooms…','directory-empty'));$('moreRooms').hidden=true;}
  try {
    const data=await lobbyRpc('list',{mode,offset:lobbyOffset});
    if(request!==lobbyRequest||who!==user?.id||mode!==lobbyMode)return;
    lobbyOffset+=data.rooms.length;
    const known=new Map(lobbyRooms.map(r=>[r.id,r]));data.rooms.forEach(r=>known.set(r.id,r));lobbyRooms=[...known.values()];
    $('roomDirectory').replaceChildren(...lobbyRooms.map(r=>{
      const item=node('article',undefined,'directory-room'),copy=node('div'),button=node('button','Join room');
      const age=Math.max(0,Date.parse(data.server_time)-Date.parse(r.last_used));
      const ago=age<60000?'just now':age<3600000?`${Math.floor(age/60000)}m ago`:age<86400000?`${Math.floor(age/3600000)}h ago`:`${Math.floor(age/86400000)}d ago`;
      copy.append(node('strong',r.name),node('p',`${r.is_default?'Shared room · ':''}${r.people?`${r.people} listening`:`Last used ${ago}`}`));
      if(r.id===roomId){button.textContent='Current room';button.disabled=true;}
      button.setAttribute('aria-label',`Join ${r.name}`);button.onclick=async()=>{button.disabled=true;await run(()=>join(r.id),'lobbyError');button.disabled=r.id===roomId;};item.append(copy,button);return item;
    }));
    if(!lobbyRooms.length)$('roomDirectory').append(node('p','No rooms open yet. Start one below and invite your friends.','directory-empty'));
    $('moreRooms').hidden=!data.has_more;
  }catch(error){if(request===lobbyRequest){$('lobbyError').textContent=friendly(error);if(!more)$('roomDirectory').replaceChildren(node('p','Rooms could not load. Try Refresh rooms.','directory-empty'));}}
  finally{if(request===lobbyRequest){lobbyLoading=false;$('refreshRooms').disabled=$('moreRooms').disabled=false;}}
}
async function enterSharedRoom() {
  if(roomId)return;
  if(!requireUser())return;
  if(entering)return entering;
  const epoch=++entryEpoch,who=user.id;
  setConnected(false,'Joining shared room…');$('startRoom').disabled=true;
  const request=(async()=>{
    try {
      const target=await lobbyRpc('default');
      if(epoch!==entryEpoch||who!==user?.id)return;
      await join(target.id);
    } catch(error) {
      if(epoch===entryEpoch||!roomId){setConnected(false,'Could not connect');$('emptyHint').textContent=friendly(error);$('startRoom').hidden=false;$('startRoom').textContent='Retry connection';}
      throw error;
    } finally {if(entering===request)entering=null;$('startRoom').disabled=false;}
  })();
  entering=request;return request;
}
async function goHome() {
  lobbyRequest++;lobbyMode=null;$('lobby').close();
  await leaveRoom();history.replaceState(null,'',location.pathname+'?embedded=1');
  document.title='Reparty · RepoCompany';$('roomName').textContent='Reparty';
  $('startRoom').hidden=false;$('startRoom').textContent='Join shared room';$('emptyHint').textContent='You left the room.';$('startRoom').focus();
}
$('lobbyBack').onclick=()=>{$('lobby').close();lobbyRequest++;lobbyMode=null;$('changeRoom').focus();};
$('refreshRooms').onclick=()=>loadRooms();$('moreRooms').onclick=()=>loadRooms(true);
setInterval(()=>{if($('lobby').open&&user&&!lobbyLoading)loadRooms();},30000);
const avatarElement = (id, name) => profiles.avatar(id, name);

function theatreActive() {
  return document.documentElement.classList.contains('theatre') && matchMedia('(min-width: 851px)').matches;
}
function applyTheatre(enabled, save = false) {
  document.documentElement.classList.toggle('theatre', enabled);
  $('theatreToggle').setAttribute('aria-pressed', String(enabled));
  $('theatreToggle').title = enabled ? 'Exit theatre mode (T)' : 'Theatre mode: a bigger TV (T)';
  if (save) { try { localStorage.setItem('reparty-layout', enabled ? 'theatre' : 'standard'); } catch {} }
  if (!enabled && !document.fullscreenElement) $('tvChat').replaceChildren();
}
applyTheatre(document.documentElement.classList.contains('theatre'));
$('theatreToggle').onclick = () => applyTheatre(!document.documentElement.classList.contains('theatre'), true);

function setConnected(ok, label) {
  connectionReady = ok;
  $('connection').textContent = label;
  $('syncLabel').textContent = ok ? 'In sync' : roomId ? 'Reconnecting' : 'Not connected';
  ['addButton', 'builtinPlaylist', 'repeatMode', 'shuffleMode', 'newPlaylist', 'renamePlaylist', 'deletePlaylist', 'playlistSelect', 'sendMessage', 'message', 'tvMessage'].forEach(id => { $(id).disabled = !ok; });
  const hasVideo = !!room?.playback?.video_id;
  ['togglePlay', 'nextVideo', 'seek', 'jumpNow'].forEach(id => { $(id).disabled = !ok || !hasVideo; });
  $('resync').disabled = !ok;
  $('roomLink').disabled = !roomId;
  mediaControls();
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
  const target = roomId, ticket = generation;
  const response = await rpc(action, data, target);
  if (target === roomId && ticket === generation) {
    if (response.stale) {
      await refresh();
      // Another viewer changed the room first. Advance only if we're still on the same video.
      if (['next', 'skip_unavailable'].includes(action) && retry && room?.playback.item_id === data.item_id) return mutate(action, { ...data, revision: room.revision }, false);
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
  $('roomName').textContent = room.name;
  document.title = `${room.name} · Reparty`;
  $('roomFootnote').textContent = 'Shared playback';
  // On joining, open the playlist that's playing rather than always the first one.
  if (!room.playlists.some(p => p.id === selectedPlaylist)) selectedPlaylist = playingEntry()?.playlist.id || room.playlists[0]?.id;
  latestMembers = data.members;
  renderModes();
  renderPlaylists();
  renderMembers(data.members);
  renderMessages(data.messages);
  setConnected(true, `${data.members.length} listening`);
  $('emptyHint').textContent = 'Add a YouTube or Suno link in the playlist.';
  $('startRoom').hidden = true;
  $('togglePlay').dataset.playing = String(!!room.playback.playing);
  $('togglePlay').setAttribute('aria-label', room.playback.playing ? 'Pause for everyone' : 'Play for everyone');
  $('nowPlaying').textContent = playingEntry()?.item.title || 'Choose a video from your playlist';
  profiles.refresh([...data.members.map(m => m.user_id), ...data.messages.map(m => m.user_id)]);
  mediaControls();
  if (playbackChanged) applyPlayback().catch(error => notify(friendly(error)));
}
async function refresh() {
  if (!roomId || !user) return;
  if (refreshing) { refreshAgain = true; return; }
  refreshing = true;
  const target = roomId, ticket = generation;
  try {
    const data = await rpc('snapshot', {}, target);
    if (roomId === target && ticket === generation) applySnapshot(data);
  } catch (error) {
    if (roomId === target && ticket === generation) setConnected(false, 'Reconnecting…');
    console.warn('Reparty refresh:', error);
  } finally {
    refreshing = false;
    if (refreshAgain) { refreshAgain = false; scheduleRefresh(); }
  }
}
function scheduleRefresh() { clearTimeout(refreshTimer); refreshTimer = setTimeout(refresh, 100); }

// Play modes live on the server (v2 SQL). Older databases simply don't show the toggles.
function renderModes() {
  const settings = room.settings;
  $('repeatMode').hidden = $('shuffleMode').hidden = !settings;
  if (!settings) return;
  $('repeatMode').setAttribute('aria-pressed', String(settings.repeat !== false));
  $('shuffleMode').setAttribute('aria-pressed', String(!!settings.shuffle));
}
function queueRow(el) {
  const list = $('queue');
  return el ? { top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight, view: list.scrollTop, height: list.clientHeight } : null;
}
function isRowVisible(el) { const r = queueRow(el); return !!r && r.bottom > r.view && r.top < r.view + r.height; }
function scrollQueueTo(el, centre) {
  const r = queueRow(el); if (!r) return;
  const list = $('queue');
  if (centre) list.scrollTop = r.top - (r.height - (r.bottom - r.top)) / 2;
  else if (r.top < r.view) list.scrollTop = r.top;
  else if (r.bottom > r.view + r.height) list.scrollTop = r.bottom - r.height;
}
function matchesFilter(item, query) {
  return !query || item.title.toLowerCase().includes(query) || String(item.added_by || '').toLowerCase().includes(query);
}
function actionButton(label, key, aria, onClick, disabled = false) {
  const b = node('button', label);
  b.dataset.key = key; b.disabled = disabled;
  if (aria) { b.setAttribute('aria-label', aria); b.title = aria; }
  b.onclick = onClick;
  return b;
}
function renderPlaylists() {
  const settings = room.settings || null;
  const signature = JSON.stringify([room.playlists, selectedPlaylist, room.playback.item_id, settings?.next_id, !!settings, queueFilter]);
  if (signature === queueSignature) return;
  queueSignature = signature;
  $('playlistSelect').replaceChildren(...room.playlists.map(p => { const o = node('option', p.name); o.value = p.id; return o; }));
  $('playlistSelect').value = selectedPlaylist;
  const p = playlist();
  const count = p?.items.length || 0;
  $('queueCount').textContent = count; $('queueCountSplit').textContent = count;
  $('queueSearch').placeholder = count > 1 ? `Search ${count} tracks…` : 'Search this playlist…';
  $('builtinPlaylist').hidden = room.playlists.some(pl => pl.preset_key === 'playlist-of-gods');
  const list = $('queue');
  const scrollTop = list.scrollTop;
  const focusKey = list.contains(document.activeElement) ? document.activeElement.dataset.key : null;
  const followPlaying = renderedPlaying !== room.playback.item_id && isRowVisible(list.querySelector('.is-playing'));
  list.replaceChildren();
  if (!p?.items.length) {
    const empty = node('li', undefined, 'empty-list');
    empty.append(node('span', '♫'), node('strong', 'Queue is empty'), node('p', 'Add a YouTube or Suno link below.'));
    list.append(empty);
    return;
  }
  const query = queueFilter.trim().toLowerCase();
  const rows = p.items.map((item, index) => ({ item, index })).filter(({ item }) => matchesFilter(item, query));
  if (!rows.length) {
    const empty = node('li', undefined, 'empty-list');
    empty.append(node('span', '⌕'), node('strong', 'No matches.'), node('p', `Nothing in “${p.name}” matches “${queueFilter.trim()}”.`));
    list.append(empty);
    return;
  }
  const fragment = document.createDocumentFragment();
  rows.forEach(({ item, index }) => {
    const isPlaying = room.playback.item_id === item.id;
    const isNext = !isPlaying && settings?.next_id === item.id;
    const li = node('li', undefined, `queue-item${isPlaying ? ' is-playing' : ''}${item.unavailable ? ' is-unavailable' : ''}`);
    li.dataset.id = item.id;
    const img = node('img');
    const suno = isSuno(item.video_id);
    img.src = suno ? `https://cdn2.suno.ai/image_${item.video_id.slice(5)}.jpeg` : `https://i.ytimg.com/vi/${item.video_id}/mqdefault.jpg`;
    img.onerror = () => { img.onerror = null; img.src = '../assets/reparty/reparty-tv.svg'; };
    img.alt = ''; img.loading = 'lazy';
    const copy = node('div');
    const playIt = () => run(() => mutate('play', { playlist_id: p.id, item_id: item.id }));
    const title = node('button', item.title, 'queue-title');
    title.dataset.key = `${item.id}:title`;
    title.title = `Play ${item.title} for everyone`;
    title.onclick = playIt;
    const meta = isPlaying ? node('small', 'NOW PLAYING', 'now')
      : item.unavailable ? node('small', 'Unavailable · skipped. Play it to try again.')
      : isNext ? node('small', 'UP NEXT', 'up-next')
      : node('small', `${suno ? 'Suno · ' : ''}Added by ${item.added_by}`);
    copy.append(title, meta);
    const menu = node('details', undefined, 'queue-menu'), summary = node('summary', '•••');
    summary.setAttribute('aria-label', `Options for ${item.title}`); summary.title = `Options for ${item.title}`;
    menu.append(summary);
    menu.open = !!focusKey?.startsWith(item.id + ':') && !focusKey.endsWith(':title');
    menu.addEventListener('toggle', () => { if (menu.open) list.querySelectorAll('details[open]').forEach(other => { if (other !== menu) other.open = false; }); });
    const actions = node('div', undefined, 'item-actions');
    const move = direction => () => run(() => mutate('move', { playlist_id: p.id, item_id: item.id, direction }));
    actions.append(actionButton('▶ Play', `${item.id}:play`, `Play ${item.title} for everyone`, playIt));
    if (settings && !isPlaying) actions.append(actionButton('Play next', `${item.id}:next`, `Play ${item.title} next`, () => run(async () => {
      await mutate('move', { playlist_id: p.id, item_id: item.id, direction: 'next' });
      notify(`Up next: ${item.title}`);
    })));
    if (settings) actions.append(actionButton('⤒', `${item.id}:top`, `Move ${item.title} to the top`, move('top'), index === 0));
    if (!query) {
      actions.append(actionButton('↑', `${item.id}:up`, `Move ${item.title} up`, move('up'), index === 0));
      actions.append(actionButton('↓', `${item.id}:down`, `Move ${item.title} down`, move('down'), index === p.items.length - 1));
    }
    actions.append(actionButton('×', `${item.id}:remove`, `Remove ${item.title}`, () => run(() => mutate('remove', { playlist_id: p.id, item_id: item.id }))));
    menu.append(actions);li.append(img, copy, menu);
    fragment.append(li);
  });
  list.append(fragment);
  list.scrollTop = scrollTop;
  const playingRow = list.querySelector('.is-playing');
  if (centreOnPlaying && playingRow) { scrollQueueTo(playingRow, true); centreOnPlaying = false; }
  else if (followPlaying && playingRow) scrollQueueTo(playingRow, false);
  renderedPlaying = room.playback.item_id;
  // Keep keyboard focus on the same control after a re-render (e.g. pressing ↑ repeatedly).
  if (focusKey) list.querySelector(`[data-key="${CSS.escape(focusKey)}"]`)?.focus();
}
function jumpToNowPlaying() {
  const current = playingEntry();
  if (!current) { notify('Nothing is playing yet.'); return; }
  showTab('playlist');
  if (selectedPlaylist !== current.playlist.id) selectedPlaylist = current.playlist.id;
  if (!matchesFilter(current.item, queueFilter.trim().toLowerCase())) { queueFilter = ''; $('queueSearch').value = ''; }
  renderPlaylists();
  const row = $('queue').querySelector('.is-playing');
  if (row) { scrollQueueTo(row, true); row.querySelector('.queue-title')?.focus({ preventScroll: true }); }
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
    e.append(avatarElement(m.user_id, m.name), copy); $('participants').append(e);
  });
}
function chatVisible() {
  const panel = $('chatPanel');
  return panel.checkVisibility ? panel.checkVisibility() : !panel.hidden;
}
function overlayMessage(m) {
  const box = $('tvChat');
  const line = node('div', undefined, 'tv-chat-line');
  const body = m.body.length > 200 ? `${m.body.slice(0, 197)}…` : m.body;
  line.append(avatarElement(m.user_id, m.display_name), node('strong', m.display_name), node('span', body));
  box.append(line);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => line.classList.add('fade'), 8000);
  setTimeout(() => line.remove(), 9000);
}
function renderMessages(messages) {
  const signature = JSON.stringify(messages.map(m => m.id));
  if (signature === messageSignature) return;
  messageSignature = signature;
  const container = $('messages');
  const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 70;
  const fresh = messagesLoaded ? messages.filter(m => m.id > lastMessageId) : [];
  messagesLoaded = true;
  if (!chatVisible()) unread += fresh.filter(m => m.user_id !== user.id).length;
  $('unread').hidden = unread === 0; $('unread').textContent = unread;
  if (document.fullscreenElement === $('television')) fresh.forEach(overlayMessage);
  lastMessageId = messages.at(-1)?.id || 0;
  container.replaceChildren();
  if (!messages.length) container.append(node('p', 'First one here? Say hello.', 'muted'));
  messages.forEach(m => {
    const e = node('article', undefined, 'chat-message');
    const copy = node('div');
    const header = node('header');
    const time = node('time', new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); time.dateTime = m.created_at;
    header.append(node('strong', m.display_name), time); copy.append(header, node('p', m.body));
    e.append(avatarElement(m.user_id, m.display_name), copy); container.append(e);
  });
  if (nearBottom) container.scrollTop = container.scrollHeight;
}
async function leaveRoom() {
  generation++;
  const oldRoom = roomId;
  roomId = null; room = null; playerVideo = null; blocked = false;
  latestMembers = [];localPaused=false;
  entryEpoch++;entering=null;
  clearInterval(poll); clearTimeout(refreshTimer); clearTimeout(skipTimer);
  if (channel) { await db.removeChannel(channel); channel = null; }
  suppressUntil = performance.now() + 2000;
  try { player?.stopVideo?.(); } catch {}
  sunoPlayer.clear(); $('screenShield').hidden = false;
  if ($('youtubePlayer')) $('youtubePlayer').hidden = false;
  $('emptyScreen').hidden = false;
  $('enablePlayback').hidden = true;
  setConnected(false, 'Not connected');
  $('queue').replaceChildren();$('messages').replaceChildren();$('participants').replaceChildren();$('queueCount').textContent=$('queueCountSplit').textContent='0';$('nowPlaying').textContent='Nothing playing';
  queueSignature = membersSignature = messageSignature = ''; lastMessageId = unread = 0; messagesLoaded = false;
  renderedPlaying = null; centreOnPlaying = true; queueFilter = ''; $('queueSearch').value = '';
  if (oldRoom && user) rpc('leave', {}, oldRoom).catch(() => {});
}
async function join(code) {
  if (!validRoom(code)) throw new Error('Paste a valid Reparty room link or its 12-character code.');
  await leaveRoom();
  const ticket = generation;
  setConnected(false,'Joining room…');
  const data = await rpc('join', {}, code);
  if (ticket !== generation) return;
  roomId = code;
  history.replaceState(null, '', `?embedded=1&room=${code}`);
  applySnapshot(data);
  $('lobby').close();
  channel = db.channel(`reparty:${code}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reparty_rooms', filter: `id=eq.${code}` }, scheduleRefresh)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reparty_messages', filter: `room_id=eq.${code}` }, scheduleRefresh)
    .subscribe(status => {
      if (roomId !== code) return;
      if (status === 'SUBSCRIBED') refresh();
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') $('connection').textContent = connectionReady ? `${latestMembers.length} listening` : 'Reconnecting…';
    });
  poll = setInterval(refresh, 8000); // Also supplies presence heartbeats and reconnect catch-up.
}
function roomCode(value) {
  const input = value.trim().toLowerCase();
  if (validRoom(input)) return input;
  try { return new URL(input).searchParams.get('room') || new URL(input).searchParams.get('reparty') || ''; } catch { return ''; }
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
// The video the embed actually has loaded, which can differ from the one we asked for.
function loadedVideo() { try { return player?.getVideoData?.()?.video_id || null; } catch { return null; } }
function wrongVideo() {
  if (sunoActive()) return false;
  if (!playerReady || !room?.playback.video_id || performance.now() < loadGuardUntil) return false;
  let state; try { state = player.getPlayerState(); } catch { return false; }
  const loaded = loadedVideo();
  return [1, 2, 3].includes(state) && !!loaded && loaded !== room.playback.video_id;
}
function recoverVideo() { playerVideo = null; applyPlayback(true).catch(() => {}); }
function scheduleSkip() {

  const current = playingEntry();
  if (!current || !connectionReady) return false;
  const { playlist: list, item } = current;
  clearTimeout(skipTimer);
  skipTimer = setTimeout(() => {
    if (!room || room.playback.item_id !== item.id) return; // Someone else already moved the room on.
    const action = room.settings ? 'skip_unavailable' : 'next';
    run(() => mutate(action, { playlist_id: list.id, item_id: item.id, revision: room.revision }));
  }, 2500);
  return true;
}
async function ensurePlayer() {
  await loadYoutube();
  if (sunoActive()) return;
  if (player) return;
  player = new window.YT.Player('youtubePlayer', {
    width: '100%', height: '100%', host: 'https://www.youtube-nocookie.com',
    // Reparty's own controls drive playback; YouTube's are hidden and a click shield covers the embed.
    playerVars: { playsinline: 1, origin: location.origin, controls: 0, disablekb: 1, fs: 0, rel: 0, iv_load_policy: 3 },
    events: {
      onReady: () => { clearTimeout(playerReadyTimer); playerReady = true; player.setVolume(localVolume);if(localMuted)player.mute(); mediaControls(); applyPlayback().catch(error => notify(friendly(error))); },
      onStateChange: onPlayerState,
      onPlaybackRateChange: event => { if (event.data !== 1) player.setPlaybackRate(1); },
      onAutoplayBlocked: () => { if (!sunoActive()) { blocked = true; $('enablePlayback').hidden = false; } },
      onError: event => {
        if (sunoActive()) return;
        const messages = { 100: 'This video is unavailable or private.', 101: 'The owner does not allow this video to play on other websites.', 150: 'The owner does not allow this video to play on other websites.', 153: 'YouTube could not verify this page. Open Reparty from the website rather than a local file.', 2: 'That video link is invalid.', 5: 'This video cannot play in this browser.' };
        const reason = messages[event.data] || 'YouTube could not play this video.';
        if (UNPLAYABLE.includes(event.data) && scheduleSkip()) notify(`${reason} Skipping to the next video…`);
        else notify(`${reason} Choose another video or use Next.`);
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
  if (isSuno(pb?.video_id)) {
    clearTimeout(skipTimer);
    suppressUntil = performance.now() + 1700; playerVideo = null;
    if (playerReady) player.stopVideo();
    if ($('youtubePlayer')) $('youtubePlayer').hidden = true;
    $('screenShield').hidden = true;
    $('emptyScreen').hidden = $('enablePlayback').hidden = true;
    blocked = false;
    if(localPaused||localMuted){sunoPlayer.pause(playingEntry()?.item);}else sunoPlayer.apply(pb, playingEntry()?.item, Date.now() + offset);
    mediaControls();
    return;
  }
  sunoPlayer.clear(); $('screenShield').hidden = false;
  if ($('youtubePlayer')) $('youtubePlayer').hidden = false;
  if (!pb?.video_id) {
    clearTimeout(skipTimer);
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
  const different = playerVideo !== pb.video_id || wrongVideo();
  suppressUntil = performance.now() + 1700;
  if (different) {
    playerVideo = pb.video_id; blocked = false; $('enablePlayback').hidden = true;
    loadGuardUntil = performance.now() + 4000;
    const opts = { videoId: pb.video_id, startSeconds: position };
    if (pb.playing&&!localPaused) player.loadVideoById(opts); else player.cueVideoById(opts);
  } else {
    if (force || Math.abs(player.getCurrentTime() - position) > 1.25) player.seekTo(position, true);
    if (pb.playing && !localPaused && !blocked && player.getPlayerState() !== 1) player.playVideo();
    if ((!pb.playing||localPaused) && player.getPlayerState() !== 2) player.pauseVideo();
  }
}
async function publishPlayback(playing, position) {

  if (!room?.playback.video_id || !connectionReady || pendingPlayback) return;
  pendingPlayback = true;
  try { await mutate('playback', { item_id: room.playback.item_id, playing, position: Math.max(0, Math.min(86400, position)) }); }
  finally { pendingPlayback = false; }
}
function onPlayerState(event) {
  if (sunoActive()||localPaused) return;
  if (!room?.playback.video_id || !connectionReady || playerVideo !== room.playback.video_id) return;
  if (wrongVideo()) { recoverVideo(); return; }
  if (event.data === 1 && blocked) { blocked = false; $('enablePlayback').hidden = true; }
  if (event.data === 0 && room.playback.playing) {
    const current = playingEntry();
    if (current) run(() => mutate('next', { playlist_id: current.playlist.id, item_id: current.item.id, revision: room.revision }));
    return;
  }
  if (performance.now() < suppressUntil || blocked || pendingPlayback) return;
  // Media keys and OS controls can still pause the embed; share that with the room.
  if ((event.data === 1 && !room.playback.playing) || (event.data === 2 && room.playback.playing)) run(() => publishPlayback(event.data === 1, player.getCurrentTime()));
}
setInterval(() => {

  if (sunoActive()) {
    const current = playingEntry();
    if (!current) return;
    const duration = sunoQueueDuration(current.item);
    const position = playbackPosition(room.playback, Date.now() + offset);
    $('seek').max = duration; $('seek').value = Math.min(position, duration);
    $('videoTime').textContent = `${formatTime(Math.min(position, duration))} / ${formatTime(duration)} · queue`;
    if (room.playback.playing && position >= duration && connectionReady && !sunoAdvancing && Date.now() - lastSunoAdvance > 3000) {
      sunoAdvancing = true; lastSunoAdvance = Date.now();
      run(() => mutate('suno_next', { playlist_id: current.playlist.id, item_id: current.item.id, revision: room.revision, started_at: room.playback.updated_at }, false))
        .finally(() => { sunoAdvancing = false; });
    }
    return;
  }
  if (!playerReady || !room?.playback.video_id) return;
  if (wrongVideo()) { recoverVideo(); return; }
  const current = player.getCurrentTime(), duration = player.getDuration(), state = player.getPlayerState(), now = performance.now();
  if (document.activeElement !== $('seek')) { $('seek').max = Math.max(duration, 1); $('seek').value = current; }
  $('videoTime').textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  if (now > suppressUntil && !localPaused && !blocked && !pendingPlayback && connectionReady && [1, 2].includes(state)
    && now - lastCorrection > 5000 && Math.abs(current - playbackPosition(room.playback, Date.now() + offset)) > 2.5) {
    lastCorrection = now; applyPlayback(true).catch(() => {});
  }
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
  const input = $('videoUrl').value.trim();
  const suno = parseSunoLink(input);
  let id = parseVideo(input), title, duration;
  if (!id && !suno) throw new Error('Paste a YouTube video link or a Suno song/share link.');
  const target = roomId, listId = selectedPlaylist;
  if (suno) {
    if (!room.suno_queue) throw new Error('Suno queue support needs the Reparty database update before it can be used.');
    const response = await fetch(`/api/reparty-suno?url=${encodeURIComponent(input)}`, { signal: AbortSignal.timeout(15000) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.id || !data.duration) throw new Error(data.error || 'Suno song details could not load. Please try again.');
    id = `suno:${data.id}`; title = data.title; duration = data.duration;
  } else title = await metadata(id);
  if (target !== roomId) return;
  await mutate('add', { playlist_id: listId, video_id: id, title, ...(suno ? { duration } : {}) });
  $('videoUrl').value = ''; notify('Added to your shared playlist.');
});
onForm('createRoom', async () => {
  if (!requireUser()) return;
  const response = await lobbyRpc('create', { name: $('newRoomName').value, mode:'video' });
  await join(response.id);
}, 'lobbyError');
onForm('joinRoom', async () => { if (requireUser()) await join(roomCode($('roomCode').value)); }, 'lobbyError');
onForm('loginForm', async () => {
  await sessionAuth.signIn($('username').value, $('password').value);
  $('password').value = ''; $('auth').close();
}, 'authError');
onForm('guestForm', async () => {
  await sessionAuth.continueAsGuest($('guestName').value);
  $('auth').close();
}, 'guestError');
onForm('signupForm', async () => {
  await sessionAuth.signUp($('signupUsername').value, $('signupPassword').value);
  $('signupPassword').value = ''; $('auth').close();
}, 'signupError');
for (const kind of ['signin','signup']) $('show'+kind).onclick = () => {
  $('loginForm').hidden = kind !== 'signin'; $('signupForm').hidden = kind !== 'signup';
  $('showsignin').setAttribute('aria-expanded', String(kind === 'signin'));
  $('showsignup').setAttribute('aria-expanded', String(kind === 'signup'));
  $(kind === 'signin' ? 'username' : 'signupUsername').focus();
};
async function sendChat(input) {
  const body = input.value.trim(); if (!body) return;
  await mutate('chat', { body }); input.value = ''; $('messages').scrollTop = $('messages').scrollHeight;
}
onForm('chatForm', () => sendChat($('message')));
onForm('tvChatForm', () => sendChat($('tvMessage')));
$('message').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('chatForm').requestSubmit(); } });
$('playlistSelect').onchange = () => { selectedPlaylist = $('playlistSelect').value; renderPlaylists(); };
$('togglePlay').onclick = () => run(() => publishPlayback(!room.playback.playing, sunoActive() ? (room.playback.playing ? playbackPosition(room.playback, Date.now() + offset) : 0) : playerReady ? player.getCurrentTime() : playbackPosition(room.playback, Date.now() + offset)));
$('sunoRestart').onclick = () => { const current = playingEntry(); if (current && sunoActive()) run(() => mutate('play', { playlist_id: current.playlist.id, item_id: current.item.id })); };
$('nextVideo').onclick = () => { const current = playingEntry(); if (current) run(() => mutate('next', { playlist_id: current.playlist.id, item_id: current.item.id, revision: room.revision })); };
$('seek').onchange = () => run(() => publishPlayback(room.playback.playing, Number($('seek').value)));
$('volume').oninput=()=>run(()=>localControl('volume',Number($('volume').value)));
$('mute').onclick=()=>run(()=>localControl('mute'));
$('resync').onclick = () => run(async () => { await refresh(); await applyPlayback(true); notify(sunoActive() ? 'Queue refreshed. To align Suno playback, use Restart for everyone.' : 'Caught up with your room.'); });
$('enablePlayback').onclick = () => { blocked = false; $('enablePlayback').hidden = true; if (playerReady) { player.playVideo(); suppressUntil = performance.now() + 1700; } applyPlayback(true).catch(error => notify(friendly(error))); };
$('fullscreen').onclick = () => run(async () => { if (document.fullscreenElement) await document.exitFullscreen(); else if ($('television').requestFullscreen) await $('television').requestFullscreen(); });
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) $('tvChat').replaceChildren(); });
$('screenShield').addEventListener('click', () => {
  clearTimeout(shieldTimer);
  shieldTimer = setTimeout(() => {
    if ($('togglePlay').disabled) return;
    $('shieldFlash').textContent = room.playback.playing ? 'Ⅱ' : '▶';
    $('shieldFlash').classList.remove('show'); void $('shieldFlash').offsetWidth; $('shieldFlash').classList.add('show');
    $('togglePlay').click();
  }, 230);
});
$('screenShield').addEventListener('dblclick', () => { clearTimeout(shieldTimer); $('fullscreen').click(); });
$('focusAdd').onclick = () => { $('videoUrl').focus(); $('videoUrl').scrollIntoView({ block: 'center', behavior: 'smooth' }); };
$('startRoom').onclick = () => run(enterSharedRoom);$('changeRoom').onclick = () => openLobby('video');
$('account').onclick = () => { if (user && !user.is_anonymous) { notify(`Connected as ${user.user_metadata?.username || 'your RepoCompany account'}. Manage your account on RepoCompany.`); } else modal('auth'); };
$('roomLink').onclick = () => run(async () => {
  try { await navigator.clipboard.writeText(location.origin+'/reparty/?room='+roomId); notify('Room link copied.'); }
  catch { openEdit('Your room link', 'Copy this link', async () => {}, location.href, false, true); }
});
$('shortcutHelp').onclick = () => modal('shortcutsDialog');
document.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => $(b.dataset.close).close(); });
function showTab(tab) {
  const chat = tab === 'chat';
  ['playlist', 'chat'].forEach(name => { const active = name === tab; $(`${name}Panel`).hidden = !active; $(`${name}Tab`).setAttribute('aria-selected', String(active)); $(`${name}Tab`).tabIndex = active ? 0 : -1; });
  if (chat) { unread = 0; $('unread').hidden = true; $('messages').scrollTop = $('messages').scrollHeight; }
}
['playlist', 'chat'].forEach(name => { $(`${name}Tab`).onclick = () => showTab(name); $(`${name}Tab`).onkeydown = e => { if (['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); const target = name === 'chat' ? 'playlist' : 'chat'; showTab(target); $(`${target}Tab`).focus(); } }; });
$('queueSearch').addEventListener('input', () => { queueFilter = $('queueSearch').value; renderPlaylistsIfRoom(); });
$('queueSearch').addEventListener('keydown', e => { if (e.key === 'Escape' && $('queueSearch').value) { e.preventDefault(); $('queueSearch').value = ''; queueFilter = ''; renderPlaylistsIfRoom(); } });
function renderPlaylistsIfRoom() { if (room) renderPlaylists(); }
$('jumpNow').onclick = jumpToNowPlaying;
$('repeatMode').onclick = () => run(async () => {
  const on = room.settings.repeat === false;
  await mutate('settings', { repeat: on });
  notify(on ? 'Repeat on for everyone: the playlist starts again after the last video.' : 'Repeat off: playback stops after the last video.');
});
$('shuffleMode').onclick = () => run(async () => {
  const on = !room.settings.shuffle;
  await mutate('settings', { shuffle: on });
  notify(on ? 'Shuffle on for everyone. The playlist order stays exactly as it is.' : 'Shuffle off. Videos play in playlist order again.');
});

// Keyboard shortcuts, YouTube-style. Ignored while typing or when a dialog is open.
function seekBy(delta) {
  if ($('seek').disabled || !playerReady) return;
  const duration = player.getDuration() || 86400;
  run(() => publishPlayback(room.playback.playing, Math.max(0, Math.min(duration - 0.5, player.getCurrentTime() + delta))));
}
function press(id) { if (!$(id).disabled) $(id).click(); }
const shortcuts = {
  ' ': () => press('togglePlay'), k: () => press('togglePlay'), n: () => press('nextVideo'), m: () => press('mute'), f: () => press('fullscreen'),
  j: () => seekBy(-10), l: () => seekBy(10), t: () => press('theatreToggle'), '?': () => modal('shortcutsDialog'),
  '/': () => { showTab('playlist'); $('queueSearch').focus(); },
  c: () => {
    if (document.fullscreenElement === $('television')) { $('tvMessage').focus(); return; }
    showTab('chat');
    $('message').focus();
  }
};
document.addEventListener('keydown', e => {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
  const target = e.target instanceof Element ? e.target : null;
  if (target?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]') || document.querySelector('dialog[open]')) return;
  if (e.key === ' ' && target?.closest('button, a, [role=tab]')) return; // Space still activates the focused control.
  const action = shortcuts[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (!action) return;
  e.preventDefault(); action();
});

function openEdit(heading, label, action, value = '', confirm = false, readOnly = false) {
  $('editHeading').textContent = heading; $('editLabel').textContent = label;
  $('editValue').value = value; $('editValue').hidden = confirm; $('editLabel').hidden = confirm;
  $('editValue').required = !confirm; $('editValue').readOnly = readOnly; $('editValue').maxLength = readOnly ? 2048 : 60;
  $('editDescription').textContent = confirm ? label : ''; $('editError').textContent = '';
  $('editSubmit').textContent = confirm ? 'Delete playlist' : readOnly ? 'Done' : 'Save';
  editAction = action; modal('editDialog'); if (!confirm) { $('editValue').focus(); $('editValue').select(); }
}
onForm('editForm', async () => { await editAction($('editValue').value.trim()); $('editDialog').close(); }, 'editError');
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
$('newPlaylist').onclick = () => openEdit('New playlist', 'Playlist name', name => mutate('playlist_create', { name }));
$('renamePlaylist').onclick = () => { const p = playlist(); openEdit('Rename playlist', 'Playlist name', name => mutate('playlist_rename', { playlist_id: p.id, name }), p.name); };
$('deletePlaylist').onclick = () => { const p = playlist(); openEdit('Delete this playlist?', `“${p.name}” and its videos will be removed for everyone in this room.`, () => mutate('playlist_delete', { playlist_id: p.id }), '', true); };
window.addEventListener('online', scheduleRefresh);
document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleRefresh(); });
// Closing the tab leaves straight away instead of lingering in the room for up to a minute.
window.addEventListener('pagehide', () => {
  if (!roomId || !accessToken) return;
  try {
    fetch(`${config.url}/rest/v1/rpc/reparty_action`, {
      method: 'POST', keepalive: true,
      headers: { apikey: config.key, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_action: 'leave', p_room: roomId, p_data: {} })
    }).catch(() => {});
  } catch {}
});
window.addEventListener('pageshow', event => { if (event.persisted) scheduleRefresh(); });
async function authChanged(session) {
  const next = session?.user || null;
  if (authUserId === next?.id && user) { user = next; return; }
  authUserId = next?.id || null; user = next;
  profiles.clear();
  if (!user) {
    await leaveRoom(); $('participants').replaceChildren(node('p', 'Your friends will appear here.', 'muted'));
    $('queue').replaceChildren(); $('messages').replaceChildren(); $('roomName').textContent = 'Reparty';
    $('nowPlaying').textContent = 'Nothing playing yet'; $('queueCount').textContent = $('queueCountSplit').textContent = '0';
    $('startRoom').hidden = false; $('emptyHint').textContent = 'Join to listen with everyone.';
    $('account').textContent = 'Join in';
    $('lobby').close();
    modal('auth');
    return;
  }
  $('auth').close(); $('account').textContent = user.is_anonymous ? `${user.user_metadata?.reparty_name || 'Visitor'} · Guest` : user.user_metadata?.username || 'My account';
  $('guestName').value = user.is_anonymous ? user.user_metadata?.reparty_name || 'Visitor' : '';
  $('guestName').readOnly = !!user.is_anonymous;
  if(!roomId)setConnected(false,'Connecting…');
  try {
    await rpc('profile');
    const code = new URLSearchParams(location.search).get('room');
    if (validRoom(code)) await join(code); else await enterSharedRoom();
  } catch (error) { openLobby(lobbyMode||'video'); $('lobbyError').textContent = friendly(error); }
}
if (!db) notify('The account service could not load. Check your connection and refresh.');
else {
  sessionAuth.start().catch(error => notify(friendly(error)));
}

// Escape opens the same personal audio controls from inside the player.
addEventListener("keydown",event=>{if(event.key!=="Escape"||document.querySelector("dialog[open]")||document.fullscreenElement)return;if(parent!==window){event.preventDefault();parent.postMessage({type:"repo-reparty-settings"},location.origin);}},true);
publishMedia();
