(() => {
  'use strict';
  const account = window.repoAccount;
  if (!account || window.repoMessaging) return;
  const terminal = new Set(['ended', 'rejected']);
  const icons = {
    mail: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    message: '<path d="M20 11.5a8 8 0 0 1-8 8H5l-4 3v-11a9 9 0 0 1 18-1Z"/><path d="M6 9h8M6 13h5"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    back: '<path d="m14 5-7 7 7 7"/>',
    send: '<path d="m3 3 19 9-19 9 4-9-4-9Zm4 9h15"/>',
    phone: '<path d="m8 3 3 5-3 3a15 15 0 0 0 5 5l3-3 5 3-1 4C11 23 1 13 4 4Z"/>',
    video: '<rect x="2" y="5" width="13" height="14" rx="3"/><path d="m15 9 7-4v14l-7-4"/>',
    mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/>',
    down: '<path d="m5 9 7 7 7-7"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>'
  };
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function icon(name) {
    if(name==='mail'){const n=el('span','repo-wibs-icon');n.setAttribute('aria-hidden','true');return n;}
    const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    n.setAttribute('viewBox', '0 0 24 24'); n.setAttribute('aria-hidden', 'true');
    // Only fixed, developer-authored SVG strings reach this sink.
    n.innerHTML = icons[name] || icons.message;
    return n;
  }
  function button(label, glyph, cls, action) {
    const b = el('button', cls); b.type = 'button'; b.setAttribute('aria-label', label);
    b.title = label; if (glyph) b.append(icon(glyph));
    if (action) b.addEventListener('click', action);
    return b;
  }
  const norm = v => String(v || '').toLowerCase();
  const ownName = () => norm(account.state.social?.username || account.state.character?.username);
  const revoked = new Set();
  const accepted = () => (account.state.social?.friends || []).filter(f => f.status === 'accepted' && !revoked.has(norm(f.username)));
  const friend = name => accepted().find(f => norm(f.username) === norm(name));
  const display = name => friend(name)?.display_name || friend(name)?.username || name;
  const initials = name => String(name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  function paintAvatar(node, username) {
    const name = display(username), avatar = friend(username)?.avatar;
    const frameId=friend(username)?.frame_id;
    const key = JSON.stringify([name, avatar || null, frameId || null]);
    if (node.dataset.portraitKey === key) return;
    node.dataset.portraitKey = key; node.textContent = initials(name);node.classList.remove('has-avatar-frame');
    const frame=window.repoFrames?.markup(frameId);if(frame){node.insertAdjacentHTML('beforeend',frame);window.repoFrames.hydrate(node);}
    if (!avatar || !window.repoAvatar?.draw) return;
    const canvas = el('canvas', 'repo-social-portrait'); canvas.width = canvas.height = 256;
    canvas.setAttribute('aria-hidden', 'true'); node.append(canvas);
    window.repoAvatar.draw(canvas, avatar).catch(() => canvas.remove());
  }
  const timestamp = value => { const n = Number(value); return n && n < 1e12 ? n * 1000 : n; };
  const time = value => new Date(timestamp(value)).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  const date = value => new Date(timestamp(value)).toLocaleDateString([], {day: 'numeric', month: 'long'});
  let userId = account.state.user?.id || null, epoch = 0, selection = '', selectionEpoch = 0;
  let inbox = [], messages = [], draftIds = new Map(), drafts = new Map(), gifIds = new Map(), unread = 0, communityUnread = 0, initialized = false;
  let selectedRead = 0, peerRead = 0, hasOlder = false, listSignature = '', sending = false, loading = false;
  let timer, inboxAt = 0, inboxArchiveAt = 0, inboxPageCursor = null, messageAt = 0, signalAt = 0, heartbeatAt = 0, polling = false;
  let call = null, callOwned = false, callEpoch = 0, pc = null, stream = null, remoteStream = null;
  let signalCursor = 0, queuedIce = [], signalQueue = Promise.resolve(), offered = false;
  let connectedAt = 0, lastCallContact = 0, connectionTimer, callBusy = false, callBusyRevision = 0, micMuted = false, cameraOff = false;
  let opener = null, callOpener = null, toastTimer, callEndTimer, previousEvent = '';
  const messageRevisions=new Map();
  let portalVisible = document.documentElement.dataset.repoPortalVisible !== 'false', pageSuspended = false, pollRevision = 0;
  let notificationBuffer = null, notificationBufferLoading = false;
  let notificationAudio = null, audioUnlocked = false, lastChime = 0;
  const soundedMessages=new Set(),seenThreads=new Map();
  let friendRefreshAt = 0, socialSnapshot = account.state.social;
  const requests = new Set();

  const launch = button('Messages', 'mail', 'repo-message-launch', () => open());
  const launchCount = el('span', 'repo-message-count'); launchCount.hidden = true; launchCount.setAttribute('aria-hidden', 'true');
  launch.setAttribute('aria-haspopup', 'dialog'); launch.setAttribute('aria-controls', 'repo-messages');
  launch.append(launchCount); launch.hidden = !userId;
  const drawer = el('dialog', 'repo-messages'); drawer.id = 'repo-messages';
  drawer.setAttribute('aria-labelledby', 'repo-messages-title');
  const head = el('header', 'repo-messages-head');
  const heading = el('div');
  const title = el('h2', '', 'Messages'); title.id = 'repo-messages-title'; heading.append(title);
  const closeButton = button('Close messages', 'close', 'repo-social-icon', close);
  head.append(heading, closeButton);
  const body = el('div', 'repo-messages-body'), aside = el('aside', 'repo-message-sidebar');
  const searchLabel = el('label', 'repo-message-search'); searchLabel.append(icon('search'));
  const search = el('input'); search.type = 'search'; search.placeholder = 'Find a friend'; search.setAttribute('aria-label', 'Find a friend');
  searchLabel.append(search);
  const friendList = el('div', 'repo-message-friends'); friendList.setAttribute('aria-label', 'Conversations');
  const onlyFriends = el('p', 'repo-message-private', 'A space for accepted friends.');
  const moreConversations = el('button', 'repo-social-text-button', 'Load older conversations'); moreConversations.type = 'button'; moreConversations.hidden = true;
  moreConversations.onclick = async () => { moreConversations.disabled = true; try { await loadInboxArchive(inboxPageCursor); renderFriends(); } catch (error) { feedback.textContent = safeError(error); } finally { moreConversations.disabled = false; } };
  aside.append(searchLabel, friendList, moreConversations);
  const conversation = el('section', 'repo-message-conversation');
  const conversationHead = el('header', 'repo-conversation-head');
  const back = button('All conversations', 'back', 'repo-social-icon repo-message-back', () => { drawer.classList.remove('has-conversation'); search.focus(); });
  const peerAvatar = el('span', 'repo-social-avatar'), peerInfo = el('div', 'repo-peer-info');
  const peerName = el('h3'), peerStatus = el('p'); peerInfo.append(peerName, peerStatus);
  const voice = button('Start voice call', 'phone', 'repo-social-icon', () => window.repoVoice?.getState().enabled ? window.repoVoice.startPrivate(selection) : startCall('audio'));
  const video = button('Start video call', 'video', 'repo-social-icon', () => startCall('video'));
  voice.hidden = video.hidden = true;
  conversationHead.append(back, peerAvatar, peerInfo, voice, video);
  const historyWrap = el('div', 'repo-message-history-wrap'), history = el('div', 'repo-message-history');
  history.setAttribute('role', 'log'); history.setAttribute('aria-label', 'Message history'); history.setAttribute('aria-live', 'polite'); history.setAttribute('aria-relevant', 'additions'); history.tabIndex = 0;
  const older = el('button', 'repo-message-older', 'Earlier messages'); older.type = 'button'; older.onclick = () => loadMessages(true);
  const jump = button('Scroll to newest messages', 'down', 'repo-message-jump', () => { history.scrollTop = history.scrollHeight; jump.hidden = true; }); jump.hidden = true;
  historyWrap.append(history, jump);
  const feedback = el('p', 'repo-message-feedback'); feedback.setAttribute('role', 'status');
  const composer = el('form', 'repo-message-composer');
  const input = el('textarea'); input.rows = 1; input.maxLength = 4000; input.placeholder = 'Write a message…'; input.setAttribute('aria-label', 'Message');
  const send = button('Send message', 'send', 'repo-message-send'); send.type = 'submit';
  composer.append(input, send);
  const composerHint = el('p', 'repo-composer-hint', 'Enter to send · Shift + Enter for a new line');
  const empty = el('div', 'repo-conversation-empty'); empty.append(icon('mail'), el('h3', '', 'Messages'), el('p', '', 'Choose a friend.'));
  conversation.append(empty, conversationHead, historyWrap, feedback, composer, composerHint);
  body.append(aside, conversation); drawer.append(head, body); document.body.append(drawer);

  const typing=window.repoChatTyping?.mount({form:composer,input,context:()=>({user:userId,target:selection,visible:drawer.open&&portalVisible&&drawer.dataset.communityView!=='community'&&!!friend(selection)}),send:(target,active)=>api('typing',{username:target,active})});
  const chatScroll=window.repoChatScroll?.mount(history);
  const extras = window.repoChatExtras?.mount({drawer,composer,history,feedback,api,context:()=>({selection,userId}),replaceMessage:message=>{const i=messages.findIndex(m=>m.id===message.id);if(i<0)messages.push(message);else messages[i]=message;renderMessages();inboxAt=0;}});
  const gifPicker=window.repoChatExtras.createGifPicker(drawer,text=>sendText(text,true),id=>window.repoChatExtras.insertEmote(input,id));
  const gifButton=button('Emotes and GIFs',null,'repo-gif-button',()=>gifPicker.choose(gifButton));gifButton.append(window.repoChatExtras.emote('wibs-wave'));gifButton.setAttribute('aria-haspopup','dialog');composer.insertBefore(gifButton,send);
  const toast = el('div', 'repo-message-toast'); toast.setAttribute('role', 'status'); toast.setAttribute('popover', 'manual');
  const toastOpen = button('Open message', null, 'repo-toast-content');
  const toastAvatar = el('span', 'repo-social-avatar'), toastCopy = el('span'), toastName = el('b'), toastText = el('span');
  toastCopy.append(toastName, toastText); toastOpen.append(toastAvatar, toastCopy);
  toast.append(toastOpen, button('Dismiss notification', 'close', 'repo-social-icon', hideToast)); document.body.append(toast);

  const callPanel = el('dialog', 'repo-call'); callPanel.id = 'repo-call'; callPanel.setAttribute('aria-labelledby', 'repo-call-name');
  const callTop = el('div', 'repo-call-top'); callTop.append(el('span', 'repo-social-eyebrow', 'REPO COMPANY / TOGETHER'), button('Minimize call', 'down', 'repo-social-icon', minimizeCall));
  const remoteVideo = el('video', 'repo-call-remote'); remoteVideo.autoplay = true; remoteVideo.playsInline = true;
  const remoteAudio = el('audio'); remoteAudio.autoplay = true;
  const localVideo = el('video', 'repo-call-local'); localVideo.autoplay = true; localVideo.playsInline = true; localVideo.muted = true;
  const callIdentity = el('div', 'repo-call-identity'), callAvatar = el('span', 'repo-call-avatar');
  const callName = el('h2'); callName.id = 'repo-call-name';
  const callStatus = el('p', 'repo-call-status'); callStatus.setAttribute('role', 'status');
  callIdentity.append(callAvatar, callName, callStatus);
  const callFeedback = el('p', 'repo-call-feedback'); callFeedback.setAttribute('role', 'status');
  const callActions = el('div', 'repo-call-actions');
  const accept = button('Answer call', 'phone', 'repo-call-control is-accept', acceptCall); accept.append(el('span', '', 'Answer'));
  const mic = button('Mute microphone', 'mic', 'repo-call-control', toggleMic); mic.append(el('span', '', 'Microphone'));
  const camera = button('Turn camera off', 'video', 'repo-call-control', toggleCamera); camera.append(el('span', '', 'Camera'));
  const end = button('End call', 'phone', 'repo-call-control is-end', () => endCall(call?.status === 'ringing' && norm(call.callee) === ownName() ? 'reject' : 'end')); end.append(el('span', '', 'End call'));
  const retryAudio = el('button', 'repo-call-audio-retry', 'Enable call audio'); retryAudio.type = 'button'; retryAudio.hidden = true;
  retryAudio.onclick = () => { remoteAudio.play().then(() => { retryAudio.hidden = true; }).catch(() => {}); };
  callActions.append(accept, mic, camera, end);
  callPanel.append(remoteVideo, remoteAudio, localVideo, callTop, callIdentity, callFeedback, retryAudio, callActions); document.body.append(callPanel);
  const callChip = button('Return to call', 'phone', 'repo-call-chip', showCall); callChip.hidden = true; const chipLabel = el('span'); callChip.append(chipLabel); document.body.append(callChip);

  function safeError(error, fallback = 'Something went wrong. Please try again.') {
    if (error?.name === 'AbortError' || error?.stale) return '';
    return String(error?.message || fallback).slice(0, 240);
  }
  function messagingState() {
    const hosted = window.repoVoice?.getState();
    return {open: drawer.open, unread: Math.min(999, unread + communityUnread), callActive: !!hosted?.callActive || (!!call && !terminal.has(call.status)), callStatus: hosted?.callStatus || call?.status || '', incomingCall: !!hosted?.incomingCall || (call?.status === 'ringing' && norm(call.callee) === ownName())};
  }
  function announce() {
    const state = messagingState();
    const signature = JSON.stringify(state);
    if (signature !== previousEvent) { previousEvent = signature; dispatchEvent(new CustomEvent('repo-messaging-state', {detail: state})); }
    const total = unread + communityUnread;
    launchCount.hidden = !total; launchCount.textContent = total > 99 ? '99+' : String(total);
    launch.setAttribute('aria-label', total ? `Wibs, ${total} unread message${total === 1 ? '' : 's'}` : 'Open Wibs');
    launch.title = launch.getAttribute('aria-label'); launch.setAttribute('aria-expanded', String(drawer.open));
  }
  async function api(route, payload, valid = () => true) {
    const revision = epoch, identity = userId;
    if (!identity) throw new Error('Sign in to use messages.');
    const {data: {session}} = await account.db.auth.getSession();
    if (revision !== epoch || userId !== identity || session?.user?.id !== identity || !valid()) throw Object.assign(new Error('Your account changed. Sign in again.'), {stale: true});
    const controller = new AbortController(); requests.add(controller);
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch('/api/social/' + route, {method: payload === undefined ? 'GET' : 'POST', cache: 'no-store', credentials: 'same-origin', signal: controller.signal, headers: {Authorization: 'Bearer ' + session.access_token, ...(payload === undefined ? {} : {'Content-Type': 'application/json'})}, ...(payload === undefined ? {} : {body: JSON.stringify(payload)})});
      const result = await response.json();
      if (revision !== epoch || identity !== userId || !valid()) throw Object.assign(new Error('Account changed.'), {stale: true});
      if (!response.ok) {
        const error = Object.assign(new Error(result.error || 'Messages are temporarily unavailable.'), {status: response.status});
        if (response.status === 401) disposeCall('Sign in again to continue your call.');
        throw error;
      }
      return result;
    } catch (error) {
      if (revision !== epoch) throw Object.assign(new Error('Account changed.'), {stale: true});
      if (error.name === 'AbortError') throw new Error('Connection timed out. Please try again.');
      throw error;
    } finally { clearTimeout(timeout); requests.delete(controller); }
  }
  function mountLaunch() {
    const accountDialog = document.getElementById('account-menu');
    const accountButton = document.querySelector('.account [data-note="Account"]');
    const gameControls=document.querySelector('#repo-web-game[open] .repo-web-game-controls') || document.querySelector('#legacy-feature[open]>header');
    const destination = gameControls || (accountDialog?.open && accountDialog.querySelector('.account-header-end')) || accountButton?.parentElement;
    if (destination === accountButton?.parentElement && destination) {
      if (launch.parentElement !== destination || launch.nextElementSibling !== accountButton) destination.insertBefore(launch, accountButton);
    } else if (destination && launch.parentElement !== destination) destination.append(launch);
    launch.classList.toggle('is-account', !!accountDialog?.open);
    const callDestination = drawer.open ? head : destination || document.body;
    if (callChip.parentElement !== callDestination && callDestination) callDestination.append(callChip);
    callChip.classList.toggle('is-account', !!accountDialog?.open || drawer.open);
  }
  const mountObserver = new MutationObserver(mountLaunch);
  mountObserver.observe(document.body, {subtree: true, childList: true, attributes: true, attributeFilter: ['open']});
  mountLaunch();
  function open(name) {
    if (!userId) { window.accountMenu?.open({tab: 'profile'}); return; }
    window.repoRoutes?.enter('wibs');
    const opening = !drawer.open;
    if (!drawer.open) { opener = document.activeElement; drawer.showModal(); inboxArchiveAt = 0; }
    if (name) select(name); else { renderFriends(); if (!selection) search.focus(); }
    window.repoCommunity?.show(name ? 'dm' : 'community');
    if (opening) window.repoWibsIntro?.play(drawer);
    if (callPanel.open) { callPanel.close(); callPanel.showModal(); }
    announce(); inboxAt = 0; tick();
  }
  function close() {
    if (!drawer.open) return;
    window.repoWibsIntro?.stop();
    window.repoRoutes?.leave('wibs');
    drawer.close(); if(window.repoWebGame?.active)window.repoWebGame.focus();else if(opener?.isConnected)opener.focus(); announce();
  }
  drawer.addEventListener('cancel', e => { if(e.target!==drawer)return;e.preventDefault(); close(); });
  drawer.addEventListener('click', e => { if (e.target === drawer && e.clientX < drawer.getBoundingClientRect().left) close(); });
  drawer.addEventListener('close', announce);
  document.addEventListener('click', e => { const b = e.target.closest('[data-message-player]'); if (b) { e.preventDefault(); open(b.dataset.messagePlayer); } });
  function renderFriends() {
    const term = norm(search.value), friends = accepted().filter(f => norm(f.username + ' ' + (f.display_name || '')).includes(term));
    const entries = friends.map(f => ({f, thread: inbox.find(c => norm(c.username) === norm(f.username))}));
    entries.sort((a, b) => Number(b.thread?.lastMessage?.createdAt || 0) - Number(a.thread?.lastMessage?.createdAt || 0) || Number(b.f.online) - Number(a.f.online) || a.f.username.localeCompare(b.f.username));
    const signature = JSON.stringify([selection, entries, term]);
    if (signature === listSignature) return; listSignature = signature; friendList.replaceChildren();
    for (const {f, thread} of entries) {
      const name = f.display_name || f.username;
      const item = button(`Message ${name}`, null, 'repo-message-friend', () => select(f.username));
      item.dataset.username = f.username; item.setAttribute('aria-current', String(norm(f.username) === norm(selection)));
      const avatar = el('span', 'repo-social-avatar'); paintAvatar(avatar, f.username); avatar.classList.toggle('is-online', !!f.online);
      const copy = el('span', 'repo-message-friend-copy'), row = el('span', 'repo-message-friend-title'); row.append(el('b', '', name));
      if (thread?.lastMessage) row.append(el('time', '', time(thread.lastMessage.createdAt)));
      copy.append(row, el('span', 'repo-message-preview', thread?.lastMessage ? ((norm(thread.lastMessage.sender) === ownName() ? 'You: ' : '') + window.repoChatExtras.preview(thread.lastMessage.text)) : f.online ? 'Online · Say hello' : 'Start a conversation'));
      item.append(avatar, copy);
      if (thread?.unread) item.append(el('span', 'repo-message-count', thread.unread > 99 ? '99+' : String(thread.unread)));
      friendList.append(item);
    }
    if (!entries.length) {
      const emptyFriends = el('div', 'repo-message-no-friends'); emptyFriends.append(el('h3', '', term ? 'No matches.' : 'Your people, right here.'), el('p', '', term ? 'Try another name.' : 'Add a friend from your account to start a private conversation.'));
      if (!term) { const b = el('button', 'repo-social-text-button', 'Find friends →'); b.type = 'button'; b.onclick = () => { close(); window.accountMenu?.open({tab: 'friends'}); }; emptyFriends.append(b); }
      friendList.append(emptyFriends);
    }
    updatePeer();
  }
  search.addEventListener('input', renderFriends);
  function updatePeer() {
    const f = friend(selection); const available = !!f;
    conversation.classList.toggle('has-peer', available);
    if (!available) { selection = ''; return; }
    peerName.textContent = f.display_name || f.username; paintAvatar(peerAvatar, f.username); peerAvatar.classList.toggle('is-online', !!f.online);
    peerStatus.textContent = f.online ? (f.current_game ? 'Playing ' + ({morogue: 'Morogue', moratales: 'Moratales', manager: 'Velmora Manager'}[f.current_game] || 'a game') : 'Online') : 'Offline';
    voice.disabled = video.disabled = !initialized || !callsEnabled || !!call || callBusy || loading;
    voice.hidden = video.hidden = !initialized || !callsEnabled;
    if (window.repoVoice?.getState().enabled) {
      voice.hidden = false;
      voice.disabled = !initialized || !!call || callBusy || loading || !window.repoVoice.getState().available || window.repoVoice.getState().callActive;
    }
    voice.title = video.title = call ? 'A call is already in progress' : '';
    input.disabled = send.disabled = gifButton.disabled = !available || sending || loading;
  }
  let callsEnabled = false;
  async function select(name) {
    if (!friend(name)) { feedback.textContent = 'Only accepted friends can message each other.'; return; }
    window.repoCommunity?.show('dm');
    if (selection) drafts.set(norm(selection), input.value);
    typing?.reset();extras?.clear(); gifPicker.clear(); selection = friend(name).username; const revision = ++selectionEpoch;
    messages = []; selectedRead = peerRead = 0; hasOlder = false; loading = true;
    input.value = drafts.get(norm(selection)) || ''; resizeComposer();
    feedback.textContent = 'Loading your conversation…'; drawer.classList.add('has-conversation');
    imageDraft?.clear();messageRevisions.clear();renderFriends(); renderMessages(true); updatePeer();
    try { await loadMessages(false, revision); if (revision === selectionEpoch) input.focus(); }
    finally { if (revision === selectionEpoch) { loading = false; updatePeer(); } }
  }
  async function loadMessages(before = false, expected = selectionEpoch) {
    const name = selection; if (!name || !userId) return;
    const suffix = before && messages.length ? '&before=' + messages[0].id : '';
    const height = history.scrollHeight, scroll = history.scrollTop;
    older.disabled = true;
    try {
      const result = await api('messages?username=' + encodeURIComponent(name) + suffix);
      if (expected !== selectionEpoch || selection !== name) return;
      if(!before)typing?.update(result);else chatScroll?.pause();
      if(!before){const previous=seenThreads.get(norm(name)),latest=Math.max(0,...result.messages.map(m=>m.id));if(previous!==undefined){const incoming=result.messages.filter(m=>m.id>previous&&norm(m.sender)!==ownName()).at(-1);if(incoming)notificationSound('dm:'+incoming.id);}seenThreads.set(norm(name),Math.max(previous||0,latest));}
      if (before) messages = [...result.messages.filter(m => !messages.some(n => n.id === m.id)), ...messages]; else messages = result.messages;
      hasOlder = !!result.hasMore; selectedRead = Number(result.readThrough || 0); peerRead = Number(result.peerReadThrough || 0); if (!before) loading = false;
      renderMessages(!before); if (before) history.scrollTop = scroll + history.scrollHeight - height;
      feedback.textContent = ''; messageAt = Date.now(); markRead();
    } catch (e) { if (expected === selectionEpoch) { if (!invalidateConversation(name, e)) feedback.textContent = safeError(e); } }
    finally { older.disabled = false; }
  }
  function renderMessages(bottom = false) {
    const nearBottom = history.scrollHeight - history.scrollTop - history.clientHeight < 100;
    const previousHeight = history.scrollHeight, previousScroll = history.scrollTop;
    const existingIds = new Set(Array.from(history.querySelectorAll('[data-message-id]'), n => n.dataset.messageId));
    history.replaceChildren(); older.hidden = !hasOlder; history.append(older);
    if (!messages.length && !loading) { const welcome = el('div', 'repo-thread-welcome'); welcome.append(el('span', 'repo-social-avatar', initials(display(selection))), el('h3', '', 'Say hello to ' + display(selection) + '.'), el('p', '', 'Just the two of you. Your conversation starts here.')); history.append(welcome); }
    let previousDay = '', previousMessage = null, previousRow = null;
    for (const message of messages) {
      const day = date(message.createdAt), grouped = previousMessage && norm(previousMessage.sender) === norm(message.sender) && day === previousDay && timestamp(message.createdAt) >= timestamp(previousMessage.createdAt) && timestamp(message.createdAt) - timestamp(previousMessage.createdAt) < 300000;
      if (day !== previousDay) { history.append(el('div', 'repo-message-day', day)); previousDay = day; }
      const own = norm(message.sender) === ownName(), row = el('div', 'repo-message-row' + (own ? ' is-own' : ''));
      row.dataset.messageId = String(message.id);
      row.title = new Date(timestamp(message.createdAt)).toLocaleString();
      if (grouped) { row.classList.add('is-continuation'); previousRow.classList.add('has-continuation'); }
      if (!existingIds.has(String(message.id))) row.classList.add('is-new');
      const bubble = el('div', 'repo-message-bubble'), meta = el('div', 'repo-message-meta');window.repoChatExtras.renderText(bubble,message.text,'dm:'+message.id);
      meta.append(el('time', '', time(message.createdAt)));
      if (own) { const receipt = el('span', 'repo-message-receipt', message.id <= peerRead ? 'Seen' : 'Sent'); receipt.prepend(icon('check')); meta.append(receipt); }
      row.append(bubble, meta); history.append(row); extras?.decorate(row,message);
      previousMessage = message; previousRow = row;
    }
    if (bottom || nearBottom) { history.scrollTop = history.scrollHeight; jump.hidden = true;chatScroll?.follow(); }
    else { history.scrollTop = previousScroll; if (history.scrollHeight > previousHeight) jump.hidden = false; }
  }
  let reading = false;
  const viewingConversation = () => drawer.open && !drawer.hasAttribute('data-wibs-opening') && portalVisible && !document.hidden && !!conversation.getClientRects().length;
  async function markRead() {
    if (reading || !viewingConversation() || !selection || !messages.length || history.scrollHeight - history.scrollTop - history.clientHeight > 100) return;
    const last = Number(messages[messages.length - 1].id), name = selection, revision = selectionEpoch;
    if (last <= selectedRead) return;
    reading = true;
    try { const result = await api('read', {username: name, messageId: last}); if (revision !== selectionEpoch) return; selectedRead = Number(result.readThrough || last); const thread = inbox.find(c => norm(c.username) === norm(name)); if (thread) { unread = Math.max(0, unread - Number(thread.unread || 0)); thread.unread = 0; } renderFriends(); announce(); }
    catch (_) {} finally { reading = false; }
  }
  function resizeComposer() { input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; }
  input.addEventListener('input', () => { if (selection) { drafts.set(norm(selection), input.value); draftIds.delete(norm(selection)); } resizeComposer(); });
  const imageDraft=window.repoChatImages?.mount({form:composer,input,send,feedback,context:()=>({user:userId,scope:'dm',target:selection}),onChange:()=>draftIds.delete(norm(selection))});
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); composer.requestSubmit(); } });
  composer.addEventListener('submit', e => {e.preventDefault();sendText(input.value.trim());});
  async function sendText(text,keepDraft=false) {
    typing?.stop();
    const name = selection, revision = selectionEpoch, auth=epoch;
    if ((!text && !(imageDraft?.has()&&!keepDraft)) || !friend(name) || sending) return;
    const keys=keepDraft?gifIds:draftIds,key=keepDraft?norm(name)+':'+text:norm(name),clientId=keys.get(key)||crypto.randomUUID();keys.set(key,clientId);
    sending = true; updatePeer(); feedback.textContent = 'Sending…';
    try {
      const content=keepDraft?text:await imageDraft?.prepare(text,clientId)||text;
      const result = await api('messages', {username: name, text:content, clientId});
      keys.delete(key);if(!keepDraft)drafts.delete(key);
      if (revision !== selectionEpoch) return;
      if (!messages.some(m => m.id === result.message.id)) messages.push(result.message);
      if(!keepDraft){imageDraft?.clear();input.value = ''; resizeComposer();}
      renderMessages(true); feedback.textContent = ''; inboxAt = 0;
    } catch (error) { if (revision === selectionEpoch && !invalidateConversation(name, error)) feedback.textContent = safeError(error) + (keepDraft?' Choose the GIF again to retry.':' Your message is still here; press Send to retry.'); }
    finally { if(auth===epoch){sending = false; updatePeer(); if (revision === selectionEpoch) input.focus();} }
  }
  history.addEventListener('scroll', () => { if (history.scrollHeight - history.scrollTop - history.clientHeight < 100) { jump.hidden = true; markRead(); } });

  function showToast(thread) {
    if (!thread?.lastMessage) return;
    notificationSound((thread.channel?'community:':'dm:')+thread.lastMessage.id);
    if (!thread.channel && viewingConversation() && norm(selection) === norm(thread.username)) return;
    if (thread.channel && window.repoCommunity?.isReading(thread.channel)) return;
    if (!portalVisible && document.documentElement.dataset.repoLauncher === 'true') {
      // Sound has its own background-capable bridge. Keep the visual preview
      // silent so one message cannot play two notification sounds.
      dispatchEvent(new CustomEvent('repo-message-notification',{detail:{id:thread.lastMessage.id,username:thread.username,channel:thread.channel||'',name:thread.channel?'#'+thread.channelName+' · '+(thread.display||thread.username):display(thread.username),text:window.repoChatExtras.preview(thread.lastMessage.text).slice(0,160),volume:0}}));return;
    }
    if (document.hidden || !portalVisible) return;
    const name = thread.channel ? '#'+thread.channelName+' · '+(thread.display||thread.username) : display(thread.username); toastName.textContent = name; toastText.textContent = window.repoChatExtras.preview(thread.lastMessage.text);
    paintAvatar(toastAvatar, thread.username); toastOpen.onclick = () => { hideToast(); if(thread.channel)window.repoCommunity?.openChannel(thread.channel);else open(thread.username); };
    const anchor=launch.getBoundingClientRect();toast.style.left=Math.max(12,Math.min(innerWidth-332,anchor.right-320))+'px';toast.style.top=Math.max(12,anchor.bottom+10)+'px';
    try { toast.showPopover(); } catch (_) { return; }
    clearTimeout(toastTimer); toastTimer = setTimeout(hideToast, 6500);
  }
  function hideToast() { clearTimeout(toastTimer); try { toast.hidePopover(); } catch (_) {} }
  function refreshFriends() {
    if (!userId || Date.now() - friendRefreshAt < 5000) return Promise.resolve();
    friendRefreshAt = Date.now(); return account.refreshSocial().catch(() => {});
  }
  function invalidateConversation(name, error) {
    if (![403, 404].includes(error.status)) return false;
    extras?.clear(); revoked.add(norm(name));
    const old = inbox.find(c => norm(c.username) === norm(name)); unread = Math.max(0, unread - Number(old?.unread || 0));
    inbox = inbox.filter(c => norm(c.username) !== norm(name));
    if (norm(selection) === norm(name)) {
      selection = ''; selectionEpoch++; messages = []; history.replaceChildren(); input.value = ''; feedback.textContent = ''; loading = false;
      empty.lastElementChild.textContent = 'This conversation is no longer available. Only accepted friends can contact each other.';
    }
    if (call && norm(callPeer()) === norm(name)) endCall('end', 'Calls are available to accepted friends only.');
    renderFriends(); announce(); refreshFriends(); return true;
  }
  function unlockNotificationAudio(event) {
    if (!event.isTrusted) return;
    audioUnlocked = true;
    const preferences = window.dashboardAudio?.preferences();
    if (!preferences || preferences.muted || !preferences.effects) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!notificationAudio && Audio) notificationAudio = new Audio();
      notificationAudio?.resume().catch(() => {});
      if(notificationAudio&&!notificationBuffer&&!notificationBufferLoading){notificationBufferLoading=true;fetch('/audio/wibs-message-notification.mp3').then(r=>r.arrayBuffer()).then(b=>notificationAudio.decodeAudioData(b)).then(b=>{notificationBuffer=b;}).catch(()=>{}).finally(()=>{notificationBufferLoading=false;});}
    } catch (_) {}
  }
  function notificationSound(key) {
    const preferences = window.dashboardAudio?.preferences();
    if (!key && call?.id) key = 'call:'+call.id;
    if (document.documentElement.dataset.repoNativeMessageSound === 'true' && typeof key === 'string') {
      dispatchEvent(new CustomEvent('repo-message-sound',{detail:{key,volume:preferences&&!preferences.muted?Number(preferences.effects)||0:0}}));return;
    }
    if(typeof key==='string'){if(soundedMessages.has(key))return;soundedMessages.add(key);if(soundedMessages.size>300)soundedMessages.delete(soundedMessages.values().next().value);}
    if (!audioUnlocked || !notificationAudio || notificationAudio.state !== 'running' || !preferences || preferences.muted || !preferences.effects || Date.now() - lastChime < Math.max(2000,(notificationBuffer?.duration||0)*1000)) return;
    if(!notificationBuffer)return;
    lastChime=Date.now();
    try{const source=notificationAudio.createBufferSource(),gain=notificationAudio.createGain();source.buffer=notificationBuffer;gain.gain.value=Math.min(1,Math.max(0,preferences.effects))*.24;source.connect(gain);gain.connect(notificationAudio.destination);source.start();source.onended=()=>{source.disconnect();gain.disconnect();};}catch{}
  }
  addEventListener('pointerdown', unlockNotificationAudio, {capture: true});
  addEventListener('keydown', unlockNotificationAudio, {capture: true});
  async function refreshInbox() {
    const revision = epoch, result = await api('inbox?limit=50'); const previous = inbox;
    const newest = result.conversations || [], newestIds = new Set(newest.map(c => c.id));
    inbox = result.hasMore ? [...newest, ...previous.filter(c => !newestIds.has(c.id) && friend(c.username))] : newest;
    if (result.hasMore && (!initialized || (drawer.open && Date.now() - inboxArchiveAt >= 60000))) {
      await loadInboxArchive(result.nextCursor);
      if (revision !== epoch) return;
      inboxArchiveAt = Date.now();
    } else if (!result.hasMore) { inboxPageCursor = null; moreConversations.hidden = true; }
    callsEnabled = !!result.iceConfigured;
    unread = Number.isFinite(Number(result.totalUnread)) ? Math.max(0, Number(result.totalUnread)) : inbox.reduce((n, c) => n + Number(c.unread || 0), 0);
    if (initialized) {
      const newThread = inbox.find(c => c.lastMessage && norm(c.lastMessage.sender) !== ownName() && c.unread && Number(c.lastMessage.id) > Number(previous.find(p => p.id === c.id)?.lastMessage?.id || 0));
      if (newThread) showToast(newThread);
    }
    initialized = true; renderFriends(); announce();
    const incoming = result.call;
    if (incoming && !terminal.has(incoming.status)) {
      if (!call) { call = incoming; callOwned = false; callEpoch++; lastCallContact = Date.now(); renderCall(); if (incoming.status === 'ringing' && norm(incoming.callee) === ownName()) { notificationSound(); showCall(); } }
      else if (call.id === incoming.id) { try { await applyCall(incoming); } catch (e) { await failCall(e); } }
    } else if (call && !callOwned && !terminal.has(call.status)) disposeCall('Call ended.');
  }
  async function loadInboxArchive(cursor) {
    const revision = epoch;
    // Large friend lists are paged in bounded batches so opening chat cannot
    // exhaust the service rate limit. Further history has an explicit control.
    for (let page = 0; cursor && page < 5; page++) {
      const result = await api('inbox?limit=50&before=' + cursor);
      if (revision !== epoch) return;
      const additions = result.conversations || [], ids = new Set(additions.map(c => c.id));
      inbox = [...inbox.filter(c => !ids.has(c.id)), ...additions];
      cursor = result.hasMore && result.nextCursor !== cursor ? result.nextCursor : null;
    }
    inboxPageCursor = cursor; moreConversations.hidden = !cursor;
  }

  const callPeer = () => call && (norm(call.caller) === ownName() ? call.callee : call.caller);
  function mediaError(error) {
    return ({NotAllowedError: 'Microphone or camera permission was not granted. You can allow access in your browser or Windows settings and call again.', NotFoundError: 'No microphone or camera was found. Connect a device and try again.', NotReadableError: 'Your microphone or camera is being used by another app. Close it there and try again.'})[error?.name] || safeError(error, 'The call could not connect. Please try again.');
  }
  function showCall() { if (!call) return; if (!callPanel.open) { callOpener = document.activeElement; callPanel.showModal(); } callChip.hidden = true; renderCall(); }
  function minimizeCall() { callPanel.close(); callChip.hidden = !call || terminal.has(call.status); callOpener?.isConnected && callOpener.focus(); }
  callPanel.addEventListener('cancel', e => { e.preventDefault(); minimizeCall(); });
  function renderCall() {
    if (!call) return;
    const incoming = call.status === 'ringing' && norm(call.callee) === ownName(), name = display(callPeer());
    callName.textContent = name; paintAvatar(callAvatar, callPeer());
    callPanel.classList.toggle('is-ringing', call.status === 'ringing');
    callPanel.classList.toggle('has-video', !!remoteStream?.getVideoTracks().some(t => t.readyState === 'live' && !t.muted));
    callPanel.classList.toggle('is-ended', terminal.has(call.status));
    let label = terminal.has(call.status) ? (call.reason === 'busy' ? 'Busy right now' : call.reason === 'timeout' ? 'No answer' : call.status === 'rejected' ? 'Call declined' : 'Call ended') : incoming ? 'Incoming ' + (call.kind === 'video' ? 'video' : 'voice') + ' call' : call.status === 'ringing' ? 'Calling…' : connectedAt ? elapsed() : callOwned ? 'Connecting…' : 'Call active in another window';
    callStatus.textContent = label; chipLabel.textContent = (incoming ? 'Incoming call · ' : '') + name + (connectedAt ? ' · ' + elapsed() : '');
    accept.hidden = !incoming; accept.disabled = callBusy; mic.hidden = camera.hidden = !callOwned || call.status !== 'active';
    camera.hidden = camera.hidden || call.kind !== 'video';
    end.hidden = terminal.has(call.status); end.disabled = false;
    end.querySelector('span').textContent = incoming ? 'Decline' : 'End call'; end.setAttribute('aria-label', incoming ? 'Decline call' : 'End call');
    mic.classList.toggle('is-off', micMuted); mic.setAttribute('aria-pressed', String(micMuted)); mic.setAttribute('aria-label', micMuted ? 'Unmute microphone' : 'Mute microphone');
    camera.classList.toggle('is-off', cameraOff); camera.setAttribute('aria-pressed', String(cameraOff)); camera.setAttribute('aria-label', cameraOff ? 'Turn camera on' : 'Turn camera off');
    localVideo.hidden = !stream || call.kind !== 'video' || cameraOff;
    if (!callPanel.open && !terminal.has(call.status)) callChip.hidden = false;
    updatePeer(); announce();
  }
  const elapsed = () => { const seconds = Math.max(0, Math.floor((Date.now() - connectedAt) / 1000)); return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'); };
  async function captureMedia(revision) {
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error('Voice and video calls need a supported browser over a secure connection.');
    const media = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true}, video: call.kind === 'video' ? {width: {ideal: 1280}, height: {ideal: 720}, frameRate: {ideal: 24, max: 30}} : false});
    if (revision !== callEpoch || !call || terminal.has(call.status)) { media.getTracks().forEach(t => t.stop()); return false; }
    stream = media; localVideo.srcObject = stream;
    for (const track of stream.getTracks()) track.addEventListener('ended', () => { if (revision === callEpoch) endCall('end', 'Your media device disconnected.'); });
    renderCall(); return true;
  }
  async function startCall(kind) {
    if (call || callBusy || !friend(selection) || !callsEnabled) return;
    const revision = epoch, operation = ++callBusyRevision; callBusy = true; feedback.textContent = 'Starting your call…'; updatePeer();
    try {
      const result = await api('calls', {username: selection, clientId: crypto.randomUUID(), kind});
      if (revision !== epoch) return;
      call = result.call; callOwned = true; const mediaRevision = ++callEpoch;
      callFeedback.textContent = ''; feedback.textContent = ''; lastCallContact = Date.now(); showCall();
      if (!await captureMedia(mediaRevision)) return;
      signalAt = heartbeatAt = 0;
    } catch (error) { if (revision !== epoch || operation !== callBusyRevision) return; if (call) await endCall('end', mediaError(error)); else feedback.textContent = safeError(error); }
    finally { if (revision === epoch && operation === callBusyRevision) { callBusy = false; updatePeer(); renderCall(); } }
  }
  async function acceptCall() {
    if (!call || call.status !== 'ringing' || callBusy) return;
    callBusy = true; callOwned = true; const revision = callEpoch, operation = ++callBusyRevision; renderCall();
    try {
      if (!await captureMedia(revision)) return;
      const result = await api('calls/' + call.id, {action: 'accept'});
      if (revision !== callEpoch) return;
      await applyCall(result.call); signalAt = heartbeatAt = 0;
    } catch (error) { if (revision === callEpoch) await endCall('end', mediaError(error)); }
    finally { if (operation === callBusyRevision) { callBusy = false; renderCall(); } }
  }
  async function applyCall(next) {
    if (!call || next.id !== call.id || terminal.has(call.status)) return;
    call = next; lastCallContact = Date.now();
    if (terminal.has(call.status)) { disposeCall(call.status === 'rejected' ? 'Call declined.' : call.reason === 'timeout' ? 'The call timed out.' : call.reason === 'duration-limit' ? 'This call reached the 3 hour 55 minute limit. You can start another call.' : 'Call ended.'); return; }
    renderCall();
    if (call.status === 'active' && callOwned && stream && !pc) await connectPeer();
  }
  const currentCall = context => context.revision === callEpoch && context.accountRevision === epoch && context.id === call?.id && call.status === 'active' && callOwned;
  const currentPeer = context => currentCall(context) && context.connection === pc;
  async function sendSignal(context, type, data) {
    if (!currentPeer(context)) return;
    signalQueue = signalQueue.catch(() => {}).then(async () => {
      if (!currentPeer(context)) return;
      try { await api('calls/' + context.id + '/signals', {clientId: crypto.randomUUID(), type, data}, () => currentPeer(context)); }
      catch (e) { if (currentPeer(context)) await failCall(e); }
    });
    return signalQueue;
  }
  async function connectPeer() {
    const context = {revision: callEpoch, accountRevision: epoch, id: call.id, connection: null};
    const config = await api('ice?callId=' + encodeURIComponent(context.id), undefined, () => currentCall(context));
    if (!currentCall(context) || pc || !stream) return;
    if (!config.iceServers?.length) throw new Error('Calling is temporarily unavailable. Please try again later.');
    const connection = new RTCPeerConnection({iceServers: config.iceServers, iceTransportPolicy: config.iceTransportPolicy || 'relay'});
    context.connection = pc = connection;
    const receiving = new MediaStream(); remoteStream = receiving; remoteAudio.srcObject = receiving; remoteVideo.srcObject = receiving; remoteVideo.muted = true;
    for (const track of stream.getTracks()) connection.addTrack(track, stream);
    connection.onicecandidate = event => { if (currentPeer(context) && event.candidate) sendSignal(context, 'ice', event.candidate.toJSON()); };
    connection.ontrack = event => {
      if (!currentPeer(context)) return;
      if (!receiving.getTracks().some(t => t.id === event.track.id)) receiving.addTrack(event.track);
      const update = () => { if (currentPeer(context)) renderCall(); };
      event.track.onmute = event.track.onunmute = event.track.onended = update;
      remoteAudio.play().catch(() => { if (currentPeer(context)) retryAudio.hidden = false; }); remoteVideo.play().catch(() => {}); renderCall();
    };
    connection.onconnectionstatechange = () => {
      if (!currentPeer(context)) return;
      if (connection.connectionState === 'connected') { clearTimeout(connectionTimer); if (!connectedAt) connectedAt = Date.now(); callFeedback.textContent = ''; renderCall(); }
      if (connection.connectionState === 'disconnected') { callFeedback.textContent = 'Connection interrupted. Reconnecting…'; clearTimeout(connectionTimer); connectionTimer = setTimeout(() => { if (currentPeer(context)) endCall('end', 'Connection lost. Start another call when you are back online.'); }, 12000); }
      if (connection.connectionState === 'failed') endCall('end', 'The call could not connect. Please try again.');
    };
    connectionTimer = setTimeout(() => { if (currentPeer(context) && !connectedAt) endCall('end', 'The call could not connect. Please try again.'); }, 25000);
    if (norm(call.caller) === ownName() && !offered) {
      offered = true;
      const offer = await connection.createOffer(); if (!currentPeer(context)) return;
      await connection.setLocalDescription(offer); if (!currentPeer(context)) return;
      await sendSignal(context, 'offer', {type: 'offer', sdp: connection.localDescription.sdp});
    }
  }
  async function receiveSignals() {
    if (!call || !callOwned) return;
    const context = {revision: callEpoch, accountRevision: epoch, id: call.id, connection: pc};
    const result = await api('calls/' + context.id + '/signals?after=' + signalCursor, undefined, () => currentCall(context));
    if (!currentCall(context)) return;
    await applyCall(result.call); if (!currentCall(context) || !pc) return;
    const connection = context.connection = pc;
    for (const signal of result.signals || []) {
      if (!currentPeer(context)) return;
      if (norm(signal.sender) === ownName()) { signalCursor = Math.max(signalCursor, Number(signal.id)); continue; }
      if (signal.type === 'offer' && norm(call.callee) === ownName() && !connection.remoteDescription) {
        await connection.setRemoteDescription(signal.data); if (!currentPeer(context)) return;
        for (const ice of queuedIce.splice(0)) { await connection.addIceCandidate(ice); if (!currentPeer(context)) return; }
        const answer = await connection.createAnswer(); if (!currentPeer(context)) return;
        await connection.setLocalDescription(answer); if (!currentPeer(context)) return;
        await sendSignal(context, 'answer', {type: 'answer', sdp: connection.localDescription.sdp}); if (!currentPeer(context)) return;
      } else if (signal.type === 'answer' && norm(call.caller) === ownName() && !connection.remoteDescription) {
        await connection.setRemoteDescription(signal.data); if (!currentPeer(context)) return;
        for (const ice of queuedIce.splice(0)) { await connection.addIceCandidate(ice); if (!currentPeer(context)) return; }
      } else if (signal.type === 'ice' && signal.data) {
        if (connection.remoteDescription) { await connection.addIceCandidate(signal.data); if (!currentPeer(context)) return; } else queuedIce.push(signal.data);
      }
      signalCursor = Math.max(signalCursor, Number(signal.id));
    }
  }
  function toggleMic() { micMuted = !micMuted; stream?.getAudioTracks().forEach(t => { t.enabled = !micMuted; }); renderCall(); }
  function toggleCamera() { cameraOff = !cameraOff; stream?.getVideoTracks().forEach(t => { t.enabled = !cameraOff; }); renderCall(); }
  function stopMedia() {
    pollRevision++; polling = false;
    callEpoch++; clearTimeout(connectionTimer); queuedIce = []; signalCursor = 0; signalQueue = Promise.resolve(); offered = false; connectedAt = 0; micMuted = cameraOff = false;
    if (pc) { pc.onconnectionstatechange = pc.ontrack = pc.onicecandidate = null; pc.close(); pc = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    remoteStream = null; remoteVideo.srcObject = localVideo.srcObject = remoteAudio.srcObject = null; retryAudio.hidden = true;
  }
  function disposeCall(reason = '') {
    if (!call) return;
    stopMedia(); callOwned = false; callBusy = false; callBusyRevision++; call.status = 'ended'; callChip.hidden = true;
    callFeedback.textContent = reason; renderCall();
    clearTimeout(callEndTimer); callEndTimer = setTimeout(() => { call = null; callPanel.close(); callOpener?.isConnected && callOpener.focus(); updatePeer(); announce(); }, 3500);
  }
  async function endCall(action = 'end', reason = '') {
    const id = call?.id; if (!id) return;
    // Devices stop immediately; the server request cannot keep a microphone alive.
    disposeCall(reason || (action === 'reject' ? 'Call declined.' : 'Call ended.'));
    try { await api('calls/' + id, {action}); } catch (_) {}
  }
  async function failCall(error) {
    if (!call) return;
    if ([401, 403, 404, 409, 410].includes(error.status)) return endCall('end', 'This call is no longer available.');
    callFeedback.textContent = 'Connection interrupted. Reconnecting…';
    if (Date.now() - lastCallContact > 20000) await endCall('end', 'Connection lost. Please try calling again.');
  }

  async function tick() {
    if (polling || !userId || pageSuspended) return;
    polling = true; const revision = epoch, thisPoll = pollRevision, now = Date.now();
    try {
      const tasks = [];
      const inboxInterval = 5000;
      if (now - inboxAt >= inboxInterval) { inboxAt = now; tasks.push(refreshInbox().catch(e => { if (revision === epoch && drawer.open) feedback.textContent = safeError(e); })); }
      if (drawer.open && now - friendRefreshAt >= 60000) tasks.push(refreshFriends());
      if (selection && viewingConversation() && !loading && now - messageAt >= 4000) {
        messageAt = now; const selected = selection, selectedRevision = selectionEpoch, after = messages.at(-1)?.id || 0;
        tasks.push(api('messages?username=' + encodeURIComponent(selected) + '&limit=100&refresh=1&after=' + after + (messageRevisions.has(userId+':'+selected)?'&revision='+messageRevisions.get(userId+':'+selected):'')).then(result => {
          if (selectedRevision !== selectionEpoch || revision !== epoch) return;
          typing?.update(result);
          if(!result.hasMore&&result.revision!==undefined)messageRevisions.set(userId+':'+selected,result.revision);
          const fresh = result.messages.filter(m => !messages.some(n => n.id === m.id));
          const refreshed = new Map((result.refreshed || []).map(m => [m.id,m.reactions]));
          const changedExtras = messages.some(m => refreshed.has(m.id) && JSON.stringify(m.reactions || []) !== JSON.stringify(refreshed.get(m.id)));
          const changedRead = Number(result.peerReadThrough || 0) !== peerRead;
          messages=messages.map(m=>refreshed.has(m.id)?{...m,reactions:refreshed.get(m.id)}:m);messages.push(...fresh); peerRead = Number(result.peerReadThrough || 0);
          if (result.hasMore) messageAt = 0;
          if (fresh.length || changedRead || changedExtras) renderMessages(fresh.length>0); markRead();
        }).catch(e => { if (selectedRevision === selectionEpoch && !invalidateConversation(selected, e)) feedback.textContent = safeError(e); }));
      }
      if (call && !terminal.has(call.status) && now - signalAt >= 2000) {
        signalAt = now; const currentCallEpoch = callEpoch;
        tasks.push((async () => {
          try {
            if (call.status === 'active' && callOwned) await receiveSignals();
            else { const result = await api('calls/' + call.id); if (currentCallEpoch === callEpoch) await applyCall(result.call); }
          } catch (e) { if (currentCallEpoch === callEpoch) await failCall(e); }
        })());
      }
      if (call?.status === 'active' && callOwned && now - heartbeatAt >= 10000) {
        heartbeatAt = now; const currentCallEpoch = callEpoch;
        tasks.push(api('calls/' + call.id, {action: 'heartbeat'}).then(result => { if (currentCallEpoch === callEpoch) return applyCall(result.call); }).catch(e => { if (currentCallEpoch === callEpoch) return failCall(e); }));
      }
      await Promise.allSettled(tasks);
      if (revision === epoch && call?.status === 'active' && connectedAt) renderCall();
    } finally { if (thisPoll === pollRevision) polling = false; }
  }
  function accountChanged() {
    const next = account.state.user?.id || null;
    if (socialSnapshot !== account.state.social) { socialSnapshot = account.state.social; revoked.clear(); }
    if (next !== userId) {
      typing?.accountChanged();
      extras?.clear(); gifPicker.clear(); epoch++; selectionEpoch++; requests.forEach(r => r.abort()); requests.clear();
      soundedMessages.clear();seenThreads.clear();lastChime=0;
      userId = next; stopMedia(); clearTimeout(callEndTimer); call = null; callOwned = false; callBusy = false; callBusyRevision++; callPanel.close(); callChip.hidden = true;
      selection = ''; inbox = []; messages = []; drafts.clear(); draftIds.clear(); gifIds.clear(); revoked.clear(); unread = communityUnread = 0; initialized = false; callsEnabled = false; inboxAt = inboxArchiveAt = messageAt = signalAt = heartbeatAt = friendRefreshAt = 0; inboxPageCursor = null; moreConversations.hidden = true;
      sending = loading = reading = false; input.value = ''; feedback.textContent = ''; history.replaceChildren(); listSignature = ''; hideToast(); close();
    }
    launch.hidden = !userId;
    if (selection && account.state.social && !friend(selection)) { extras?.clear(); selection = ''; selectionEpoch++; messages = []; input.value = ''; history.replaceChildren(); feedback.textContent = ''; }
    if (call && account.state.social && !friend(callPeer())) endCall('end', 'Calls are available to accepted friends only.');
    renderFriends(); announce(); if (userId) tick();
  }
  addEventListener('repo-account-state', accountChanged);
  addEventListener('repo-messaging-request', () => { previousEvent = ''; announce(); });
  addEventListener('repo-background-messages', () => { inboxAt = 0; tick(); });
  addEventListener('repo-launcher-portal-visibility', event => {
    if (typeof event.detail?.visible !== 'boolean') return;
    portalVisible = event.detail.visible;
    if (portalVisible) { inboxAt = messageAt = 0; markRead(); tick(); } else hideToast();
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { inboxAt = 0; messageAt = 0; markRead(); tick(); } });
  addEventListener('online', () => { inboxAt = signalAt = 0; tick(); });
  addEventListener('offline', () => { feedback.textContent = 'You are offline. Messages will be available when you reconnect.'; if (call) endCall('end', 'Connection lost. Please call again when you are online.'); });
  addEventListener('pagehide', () => {
    pageSuspended = true; pollRevision++; polling = false; clearInterval(timer); requests.forEach(r => r.abort());
    stopMedia(); call = null; callOwned = false; callBusy = false; callBusyRevision++; clearTimeout(callEndTimer); callPanel.close(); callChip.hidden = true;
    notificationAudio?.suspend().catch(() => {}); announce();
  });
  addEventListener('pageshow', event => {
    if (!event.persisted && !pageSuspended) return;
    pageSuspended = false; pollRevision++; polling = false; inboxAt = messageAt = signalAt = heartbeatAt = 0;
    clearInterval(timer); timer = setInterval(tick, 1000); accountChanged();
    if (audioUnlocked) notificationAudio?.resume().catch(() => {});
  });
  window.repoMessaging = Object.freeze({open, close, getState: messagingState, messageSound: notificationSound, setCommunityUnread: count => {communityUnread=Number.isSafeInteger(count)&&count>0?count:0;announce();}, notifyCommunity: showToast});
  addEventListener('repo-voice-state', () => { updatePeer(); announce(); });
  window.repoVoice?.mount({drawer,head,context:()=>({selection,userId})});
  timer = setInterval(tick, 1000); accountChanged();
})();
