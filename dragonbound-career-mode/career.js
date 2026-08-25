(() => {
  'use strict';

  const SUPABASE_URL = 'https://hvdrwmjieguurxvrgzfu.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_bln84LaJ8iYmnkYK9mh0Pg_XxP7O1OZ';
  const SAVE_TABLE = 'dragonbound_career_saves';
  const BRIDGE_TOKEN = new URLSearchParams(window.location.search).get('bridge') || '';
  const OPENING_FRAMES = [
    'opening/01_race_over.png',
    'opening/02_crosswind.png',
    'opening/03_scouted.png',
    'opening/04_rufus_reveal.png',
    'opening/05_instinct.png',
    'opening/06_dragonbound_invitation.png'
  ];
  const TEAMS = [
    { id: 'sunscale', sponsor: 'Sunscale', racer: 'Jalen Cross', left: '3.9%', accent: '#ef4b32', room: 'team-rooms/sunscale.png' },
    { id: 'valecroft', sponsor: 'Valecroft', racer: 'Sofia Mendes', left: '19.7%', accent: '#58c28b', room: 'team-rooms/valecroft.png' },
    { id: 'ember-oak', sponsor: 'Ember & Oak', racer: 'Luka Kovač', left: '35.1%', accent: '#f19a35', room: 'team-rooms/ember-oak.png' },
    { id: 'quickquill', sponsor: 'Quickquill', racer: 'Tyrese Bell', left: '50.1%', accent: '#e4e8ef', room: 'team-rooms/quickquill.png' },
    { id: 'wyrmwell', sponsor: 'Wyrmwell', racer: 'Ren Sato', left: '65.7%', accent: '#50d6d0', room: 'team-rooms/wyrmwell.png' },
    { id: 'fizzy-drake', sponsor: 'Fizzy Drake', racer: 'Maya Banks', left: '80.7%', accent: '#4a9cff', room: 'team-rooms/fizzy-drake.png' }
  ];
  const CAREER_DRAGONS = {
    covidpanda: { name: 'NighLight', owner: 'CovidPanda', asset: 'covidpanda.webp' },
    catasthma: { name: 'September', owner: 'CatAsthma', asset: 'catasthma.webp' },
    kat: { name: 'Opal', owner: 'Kat', asset: 'kat.webp' },
    emlux: { name: 'Turi', owner: 'Emlux', asset: 'emlux.webp' },
    proco: { name: 'Wally', owner: 'Proco', asset: 'proco.webp' },
    smokedrope1028: { name: 'Pipsqueak JR', owner: 'Smokedrope1028', asset: 'smokedrope1028.webp' }
  };
  const HUB_ITEMS = [
    { id: 'story', label: 'Follow the story', left: '4.5%', top: '33.5%', width: '25.8%', height: '11.7%' },
    { id: 'races', label: 'Extra races', left: '69.2%', top: '33.4%', width: '25.9%', height: '11.8%' },
    { id: 'teams', label: 'Teams', left: '4.5%', top: '54.5%', width: '25.8%', height: '11.8%' },
    { id: 'settings', label: 'Settings', left: '69.2%', top: '54.4%', width: '25.9%', height: '11.9%' },
    { id: 'home', label: 'Home', left: '2.4%', top: '92.1%', width: '3.9%', height: '5.3%', footer: true },
    { id: 'profile', label: 'Profile', left: '9.4%', top: '92.1%', width: '3.9%', height: '5.3%', footer: true },
    { id: 'trophies', label: 'Trophies', left: '86.5%', top: '92.1%', width: '4%', height: '5.3%', footer: true },
    { id: 'favourites', label: 'Favourites', left: '92.2%', top: '92.1%', width: '4%', height: '5.3%', footer: true }
  ];
  const EMBERS = [
    [8,82,8,.2],[13,69,6,1.8],[18,91,9,3.1],[24,77,7,4.4],
    [31,88,10,2.6],[37,73,7,.9],[43,94,8,5.2],[48,80,6,3.8],
    [53,89,8,1.1],[59,76,6,4.8],[64,93,9,2.2],[71,84,7,.5],
    [77,71,6,3.5],[83,91,10,1.5],[89,78,7,5.6],[94,87,8,2.9]
  ];

  const root = document.getElementById('careerRoot');
  const music = {
    menu: document.getElementById('careerMenuMusic'),
    opening: document.getElementById('careerOpeningMusic'),
    hub: document.getElementById('careerHubMusic')
  };
  const state = {
    mode: 'menu',
    selectedMenu: 0,
    selectedTeam: null,
    selectedHub: null,
    frameIndex: 0,
    soundOn: true,
    saves: [],
    savesLoading: true,
    savesError: '',
    savePickerOpen: false,
    exitOpen: false,
    teamConfirmOpen: false,
    busy: false,
    blackout: false,
    transitionLocked: false,
    user: null,
    client: null,
    activeSave: null,
    status: 'Loading your career records…'
  };
  let audioContext = null;
  let accountBridgeResolve = null;
  let accountBridgeReject = null;
  let accountBridgeTimer = 0;

  const delay = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));

  function sendParent(type, detail = {}) {
    // The hosted preview intentionally gives embedded pages an opaque `null`
    // origin. postMessage remains safe because both sides validate event.source.
    try { window.parent.postMessage({ type, bridge: BRIDGE_TOKEN, ...detail }, '*'); } catch (_) {}
  }

  function clearAccountBridge() {
    window.clearTimeout(accountBridgeTimer);
    accountBridgeTimer = 0;
    accountBridgeResolve = null;
    accountBridgeReject = null;
  }

  function requestAccountSession() {
    if (window.parent === window) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      clearAccountBridge();
      accountBridgeResolve = resolve;
      accountBridgeReject = reject;
      accountBridgeTimer = window.setTimeout(() => {
        const fail = accountBridgeReject;
        clearAccountBridge();
        fail?.(new Error('The website account connection timed out. Close Career Mode and try again.'));
      }, 10000);
      sendParent('dragonbound-career-auth-request');
    });
  }

  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.data?.type !== 'dragonbound-career-auth' || event.data.bridge !== BRIDGE_TOKEN) return;
    const resolve = accountBridgeResolve;
    const reject = accountBridgeReject;
    const detail = event.data;
    clearAccountBridge();
    if (detail.error) {
      reject?.(new Error(detail.error));
      return;
    }
    if (!detail.accessToken || !detail.refreshToken) {
      reject?.(new Error('Your login session was not available. Close Career Mode and sign in again.'));
      return;
    }
    resolve?.({ accessToken: detail.accessToken, refreshToken: detail.refreshToken });
  });

  function playTone(frequency = 280) {
    if (!state.soundOn) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {
      audioContext ||= new Context();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .66, audioContext.currentTime + .11);
      gain.gain.setValueAtTime(.025, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .12);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + .13);
    } catch (_) {}
  }

  function activeTrack() {
    if (state.mode === 'menu') return music.menu;
    if (state.mode === 'opening' || state.mode === 'team-select') return music.opening;
    return music.hub;
  }

  function syncMusic({ restart = false } = {}) {
    const active = activeTrack();
    Object.values(music).forEach(track => {
      if (!track) return;
      if (track !== active || !state.soundOn) {
        track.pause();
        track.muted = !state.soundOn;
      }
    });
    if (!active || !state.soundOn) return;
    if (restart) active.currentTime = 0;
    active.muted = false;
    active.volume = state.mode === 'menu' ? .5 : state.mode === 'career-hub' ? .2 : .4;
    void active.play().catch(() => undefined);
  }

  function username() {
    const metaName = state.user?.user_metadata?.username;
    if (metaName) return String(metaName);
    return String(state.user?.email || 'Dragonbound Racer').split('@')[0];
  }

  function accountKey(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function careerDragon(save) {
    const candidates = [
      state.user?.user_metadata?.username,
      state.user?.email?.split('@')[0],
      save?.owner_username
    ];
    for (const candidate of candidates) {
      const dragon = CAREER_DRAGONS[accountKey(candidate)];
      if (dragon) return dragon;
    }
    return null;
  }

  async function connectAccount() {
    try {
      const namespace = window.supabase;
      if (!namespace?.createClient) throw new Error('The Career Mode account service did not load. Close Career Mode and try again.');
      state.client = namespace.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false }
      });

      const bridgedSession = await requestAccountSession();
      if (bridgedSession) {
        const { data: sessionData, error: sessionError } = await state.client.auth.setSession({
          access_token: bridgedSession.accessToken,
          refresh_token: bridgedSession.refreshToken
        });
        if (sessionError) throw sessionError;
        state.user = sessionData?.user || sessionData?.session?.user || null;
      } else {
        const { data: localSession, error: localSessionError } = await state.client.auth.getSession();
        if (localSessionError) throw localSessionError;
        state.user = localSession?.session?.user || null;
      }
      if (!state.user) throw new Error('Your login session has expired. Close Career Mode and sign in again.');
      await loadSaves();
    } catch (error) {
      console.error('[Dragonbound Career Mode] Account connection failed', error);
      state.savesLoading = false;
      state.savesError = error?.message || 'Career saves could not be loaded.';
      state.status = state.savesError;
      render();
    }
  }

  async function loadSaves({ preserveStatus = false } = {}) {
    if (!state.client || !state.user) return;
    state.savesLoading = true;
    if (!preserveStatus) state.status = 'Loading your career records…';
    render();
    const { data, error } = await state.client
      .from(SAVE_TABLE)
      .select('id,user_id,owner_username,save_name,team_id,sponsor,racer,state,created_at,updated_at,last_played_at')
      .eq('user_id', state.user.id)
      .order('updated_at', { ascending: false });
    state.savesLoading = false;
    if (error) {
      state.savesError = error.message || 'Career saves could not be loaded.';
      state.status = 'Career records unavailable';
      render();
      throw error;
    }
    state.saves = Array.isArray(data) ? data : [];
    state.savesError = '';
    state.status = state.saves.length
      ? 'Your Career save is ready — select your dragon to continue'
      : 'Start a career to create your first save';
    render();
  }

  function menuItems() {
    return [
      { id: 'career', label: 'Start career mode', y: '58.6%', disabled: state.savesLoading || state.saves.length > 0, disabledLabel: state.savesLoading ? 'loading your account' : 'one Career save is allowed per account' },
      { id: 'dragon', label: 'Select a dragon', y: '65.2%', disabled: state.savesLoading || !state.saves.length, disabledLabel: state.savesLoading ? 'loading your account' : 'create a career first' },
      { id: 'back', label: 'Back', y: '72.3%', disabled: false }
    ];
  }

  function nextEnabled(current, direction) {
    const items = menuItems();
    let next = current;
    do next = (next + direction + items.length) % items.length;
    while (items[next].disabled);
    return next;
  }

  function emberMarkup() {
    return EMBERS.map(([left, top, size, wait], index) =>
      `<i style="left:${left}%;top:${top}%;width:${size / 10}rem;height:${size / 10}rem;animation-delay:${wait}s" data-ember="${index}"></i>`
    ).join('');
  }

  function topControls() {
    return `
      <div class="top-controls">
        ${state.user ? `<span class="career-account-chip"><i></i>${escapeHtml(username())}</span>` : ''}
        <button class="round-button" type="button" data-sound aria-label="${state.soundOn ? 'Mute all sounds' : 'Enable all sounds'}" title="${state.soundOn ? 'Sound on' : 'Sound off'}">
          <span aria-hidden="true">${state.soundOn ? '◖))' : '◖×'}</span>
        </button>
      </div>`;
  }

  function savePickerMarkup() {
    if (!state.savePickerOpen) return '';
    const list = state.saves.map(save => {
      const date = new Date(save.updated_at || save.created_at);
      const dateText = Number.isNaN(date.getTime()) ? 'Career save' : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
      const team = TEAMS.find(item => item.id === save.team_id);
      return `
        <article class="career-save-card" style="--save-accent:${escapeHtml(team?.accent || '#70d0ba')}">
          <div class="career-save-emblem">${escapeHtml(String(save.sponsor || '?').slice(0, 1))}</div>
          <div class="career-save-copy">
            <small>${escapeHtml(save.save_name || 'Dragonbound Career')}</small>
            <strong>${escapeHtml(save.sponsor)}</strong>
            <span>Racing with ${escapeHtml(save.racer)}</span>
            <time>${escapeHtml(dateText)}</time>
          </div>
          <button type="button" data-load-save="${escapeHtml(save.id)}" ${state.busy ? 'disabled' : ''}>${state.busy ? 'LOADING…' : 'LOAD CAREER'}</button>
        </article>`;
    }).join('');
    return `
      <div class="career-save-backdrop" role="presentation">
        <section class="career-save-panel" role="dialog" aria-modal="true" aria-labelledby="careerSaveTitle">
          <header>
            <div><small>YOUR DRAGONBOUND HISTORY</small><h2 id="careerSaveTitle">Load career</h2><p>Continue ${escapeHtml(username())}'s saved racing career.</p></div>
            <button type="button" data-close-saves aria-label="Close saved careers">×</button>
          </header>
          <div class="career-save-list">${list || '<p class="career-save-empty">No careers have been created yet.</p>'}</div>
          ${state.savesError ? `<p class="career-save-error">${escapeHtml(state.savesError)}</p>` : ''}
        </section>
      </div>`;
  }

  function exitMarkup() {
    if (!state.exitOpen) return '';
    return `
      <div class="panel-backdrop" role="presentation">
        <section class="game-panel" role="dialog" aria-modal="true" aria-labelledby="careerExitTitle">
          <span class="panel-corner corner-a" aria-hidden="true"></span><span class="panel-corner corner-b" aria-hidden="true"></span>
          <button class="panel-close" type="button" data-stay aria-label="Close panel">×</button>
          <div class="panel-content exit-content">
            <p class="panel-kicker">Leave the paddock?</p>
            <h2 id="careerExitTitle">Return to Dragonbound</h2>
            <p class="panel-copy">Your Career Mode saves are securely stored on your website account.</p>
            <div class="exit-actions"><button class="secondary-action" type="button" data-stay>Stay here</button><button class="primary-action" type="button" data-leave>Leave career mode</button></div>
          </div>
        </section>
      </div>`;
  }

  function renderMenu() {
    const items = menuItems();
    if (items[state.selectedMenu]?.disabled) state.selectedMenu = nextEnabled(state.selectedMenu, 1);
    root.innerHTML = `
      <div class="scene" aria-hidden="true"><img class="scene-art" src="dragonbound-career.png" alt=""><div class="sky-flash"></div><div class="title-glint"></div></div>
      <div class="vignette" aria-hidden="true"></div><div class="texture" aria-hidden="true"></div><div class="embers" aria-hidden="true">${emberMarkup()}</div>
      <nav class="menu" aria-label="Career mode menu">
        ${items.map((item, index) => `
          <button class="menu-hotspot ${state.selectedMenu === index ? 'is-selected' : ''} ${item.id === 'dragon' && item.disabled && !state.savesLoading ? 'is-no-save' : ''} ${item.id === 'career' && item.disabled && !state.savesLoading ? 'is-save-limit' : ''}"
            style="top:${item.y}" type="button" data-menu="${item.id}" data-menu-index="${index}" ${item.disabled ? 'disabled' : ''}
            aria-label="${escapeHtml(item.disabled ? `${item.label} — ${item.disabledLabel || 'unavailable'}` : item.label)}">
            <span class="sr-only">${escapeHtml(item.label)}</span><span class="menu-marker left" aria-hidden="true"></span><span class="menu-marker right" aria-hidden="true"></span><span class="menu-underline" aria-hidden="true"></span>
          </button>`).join('')}
      </nav>
      ${savePickerMarkup()}${exitMarkup()}
      <div class="status-ribbon" role="status"><span class="status-gem" aria-hidden="true"></span><span>${escapeHtml(state.status)}</span><span class="key-hint" aria-hidden="true">↑ ↓ &nbsp; ENTER</span></div>
      ${topControls()}<div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;

    root.querySelectorAll('[data-menu]').forEach(button => {
      button.addEventListener('pointerenter', () => {
        if (button.disabled) return;
        const index = Number(button.dataset.menuIndex);
        if (state.selectedMenu !== index) playTone(230 + index * 35);
        state.selectedMenu = index;
        button.closest('nav').querySelectorAll('.menu-hotspot').forEach(item => item.classList.toggle('is-selected', item === button));
        state.status = button.dataset.menu === 'dragon' ? `${state.saves.length} saved ${state.saves.length === 1 ? 'career' : 'careers'}` : button.dataset.menu === 'career' ? 'Begin a new Dragonbound career' : 'Return to Dragonbound';
        root.querySelector('.status-ribbon span:nth-child(2)').textContent = state.status;
      });
      button.addEventListener('click', () => activateMenu(button.dataset.menu));
    });
    bindCommon();
    root.querySelectorAll('[data-close-saves]').forEach(button => button.addEventListener('click', closeSavePicker));
    root.querySelectorAll('[data-load-save]').forEach(button => button.addEventListener('click', () => loadCareer(button.dataset.loadSave)));
    root.querySelectorAll('[data-stay]').forEach(button => button.addEventListener('click', () => { state.exitOpen = false; playTone(190); render(); }));
    root.querySelector('[data-leave]')?.addEventListener('click', () => sendParent('dragonbound-career-close'));
  }

  function renderOpening() {
    root.innerHTML = `
      <section class="opening-cinematic" role="button" tabindex="0" aria-label="Opening scene ${state.frameIndex + 1} of ${OPENING_FRAMES.length}. Click anywhere to continue.">
        <img class="opening-backdrop" src="${OPENING_FRAMES[state.frameIndex]}" alt="" aria-hidden="true">
        <img class="opening-frame opening-motion-${state.frameIndex % 3}" src="${OPENING_FRAMES[state.frameIndex]}" alt="Dragonbound opening scene ${state.frameIndex + 1}">
        <div class="opening-rain" aria-hidden="true"></div><div class="opening-light" aria-hidden="true"></div><div class="opening-grain" aria-hidden="true"></div>
        <div class="opening-progress"><span>${state.frameIndex + 1} / ${OPENING_FRAMES.length}</span><b>CLICK TO CONTINUE</b></div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelector('.opening-cinematic').addEventListener('click', advanceOpening);
  }

  function renderTeamSelect() {
    const selected = state.selectedTeam === null ? null : TEAMS[state.selectedTeam];
    root.innerHTML = `
      <section class="team-select-shell" aria-label="Select a racing team and sponsor">
        <img class="team-select-backdrop" src="team-selection.png" alt="" aria-hidden="true">
        <div class="team-select-stage">
          <img class="team-select-art" src="team-selection.png" alt="Six Dragonbound racing teams and their sponsors">
          <div class="team-tech-light" aria-hidden="true"></div><div class="team-scan" aria-hidden="true"></div><div class="team-grain" aria-hidden="true"></div>
          <nav class="team-options" aria-label="Racing team choices">
            ${TEAMS.map((team, index) => `<button type="button" class="team-hotspot ${state.selectedTeam === index ? 'is-selected' : ''}" style="left:${team.left};--team-accent:${team.accent}" data-team="${index}" aria-label="Choose ${escapeHtml(team.sponsor)}, racing with ${escapeHtml(team.racer)}"><span class="sr-only">${escapeHtml(team.sponsor)}, ${escapeHtml(team.racer)}</span><i aria-hidden="true"></i></button>`).join('')}
          </nav>
          <div class="team-select-hint"><span class="team-hint-pip"></span>${selected ? `${escapeHtml(selected.sponsor)} · click to review contract` : 'Select a sponsor to review their contract'}</div>
        </div><div class="team-screen-vignette" aria-hidden="true"></div>
        ${state.teamConfirmOpen && selected ? `
          <div class="team-confirm-overlay" role="presentation"><section class="team-confirm-panel" role="dialog" aria-modal="true" aria-labelledby="teamConfirmTitle" style="--team-accent:${selected.accent}">
            <div class="contract-eyebrow">Official racing contract</div><h2 id="teamConfirmTitle">Join ${escapeHtml(selected.sponsor)}?</h2><div class="contract-rule" aria-hidden="true"></div>
            <p>You’ll begin your Dragonbound career under <strong>${escapeHtml(selected.sponsor)}</strong>, racing alongside <strong>${escapeHtml(selected.racer)}</strong>.</p>
            <div class="contract-choice"><span>Selected sponsor</span><strong>${escapeHtml(selected.sponsor)}</strong></div>
            ${state.savesError ? `<p class="contract-save-error" role="alert">${escapeHtml(state.savesError)}</p>` : ''}
            <div class="team-confirm-actions"><button type="button" class="team-review-button" data-review ${state.busy ? 'disabled' : ''}>Review teams</button><button type="button" class="team-sign-button" data-sign ${state.busy ? 'disabled' : ''}>${state.busy ? 'SAVING CAREER…' : 'Sign contract'}</button></div>
            <div class="contract-corners" aria-hidden="true"></div>
          </section></div>` : ''}
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelectorAll('[data-team]').forEach(button => {
      const preview = () => {
        const index = Number(button.dataset.team);
        if (state.selectedTeam !== index) playTone(220 + index * 22);
        state.selectedTeam = index;
        root.querySelectorAll('[data-team]').forEach(item => item.classList.toggle('is-selected', item === button));
        const hint = root.querySelector('.team-select-hint');
        if (hint) hint.innerHTML = `<span class="team-hint-pip"></span>${escapeHtml(TEAMS[index].sponsor)} · click to review contract`;
      };
      button.addEventListener('pointerenter', preview);
      // Never render during focus: a pointer click focuses first, and replacing
      // the DOM here used to destroy the button before its click could fire.
      button.addEventListener('focus', preview);
      button.addEventListener('click', () => { state.selectedTeam = Number(button.dataset.team); state.teamConfirmOpen = true; state.savesError = ''; playTone(320); render(); });
    });
    root.querySelector('[data-review]')?.addEventListener('click', () => { state.teamConfirmOpen = false; state.savesError = ''; playTone(180); render(); });
    root.querySelector('[data-sign]')?.addEventListener('click', saveNewCareer);
  }

  function renderHub() {
    const save = state.activeSave;
    const activeTeam = save ? TEAMS.find(team => team.id === save.team_id) : null;
    const activeDragon = save ? careerDragon(save) : null;
    const activeAvatar = activeTeam && activeDragon
      ? `team-avatars/${activeTeam.id}/${activeDragon.asset}`
      : '';
    root.innerHTML = `
      <section class="career-hub-shell" aria-label="Dragonbound career hub">
        <img class="career-hub-backdrop" src="career-hub.png" alt="" aria-hidden="true">
        <div class="career-hub-stage"><img class="career-hub-art" src="career-hub.png" alt="Dragonbound Career Mode world map menu">
          <div class="hub-ambient-light" aria-hidden="true"></div><div class="hub-map-sweep" aria-hidden="true"></div>
          <div class="hub-center-display ${activeTeam?.room ? 'has-team-room' : ''} ${activeAvatar ? 'has-team-avatar' : ''}" aria-hidden="true">
            ${activeTeam?.room ? `<img class="hub-team-room" src="${activeTeam.room}" alt="">` : ''}
            ${activeAvatar ? `<span class="hub-team-avatar-shadow"></span><img class="hub-team-avatar" src="${activeAvatar}" alt="">` : ''}
          </div><div class="hub-interface-grain" aria-hidden="true"></div>
          <nav class="career-hub-nav" aria-label="Career hub options">
            ${HUB_ITEMS.map((item, index) => `<button type="button" class="hub-hotspot ${item.footer ? 'is-footer' : ''} ${state.selectedHub === index ? 'is-selected' : ''}" style="left:${item.left};top:${item.top};width:${item.width};height:${item.height}" data-hub="${index}" aria-label="${escapeHtml(item.label)}"><span class="sr-only">${escapeHtml(item.label)}</span><i aria-hidden="true"></i></button>`).join('')}
          </nav>
          ${save ? `<div class="active-career-chip"><small>ACTIVE CAREER</small><strong>${escapeHtml(save.sponsor)}</strong><span>${escapeHtml(save.racer)}</span></div>` : ''}
        </div><div class="hub-screen-vignette" aria-hidden="true"></div>
        <div class="hub-status-toast" role="status">${escapeHtml(state.status || `${save?.sponsor || 'Career'} loaded`)}</div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelectorAll('[data-hub]').forEach(button => {
      button.addEventListener('pointerenter', () => {
        const index = Number(button.dataset.hub);
        if (state.selectedHub !== index) playTone(210 + index * 14);
        state.selectedHub = index;
        root.querySelectorAll('[data-hub]').forEach(item => item.classList.toggle('is-selected', item === button));
      });
      button.addEventListener('click', () => {
        const item = HUB_ITEMS[Number(button.dataset.hub)];
        playTone(235 + Number(button.dataset.hub) * 17);
        if (item.id === 'home') {
          state.mode = 'menu';
          state.status = `${state.saves.length} career ${state.saves.length === 1 ? 'save' : 'saves'} ready`;
          render();
          return;
        }
        state.status = `${item.label} will continue in the next Career Mode update`;
        const toast = root.querySelector('.hub-status-toast');
        if (toast) { toast.textContent = state.status; toast.classList.add('is-visible'); window.setTimeout(() => toast.classList.remove('is-visible'), 2600); }
      });
    });
  }

  function bindCommon() {
    root.querySelector('[data-sound]')?.addEventListener('click', () => {
      state.soundOn = !state.soundOn;
      playTone(310);
      syncMusic();
      render();
    });
  }

  function render() {
    if (state.mode === 'menu') renderMenu();
    else if (state.mode === 'opening') renderOpening();
    else if (state.mode === 'team-select') renderTeamSelect();
    else renderHub();
    syncMusic();
  }

  async function fadeTo(mode, { restartMusic = true } = {}) {
    if (state.transitionLocked) return;
    state.transitionLocked = true;
    state.blackout = true;
    root.querySelector('.blackout')?.classList.add('is-visible');
    await delay(520);
    state.mode = mode;
    state.blackout = true;
    render();
    await delay(70);
    state.blackout = false;
    root.querySelector('.blackout')?.classList.remove('is-visible');
    syncMusic({ restart: restartMusic });
    await delay(160);
    state.transitionLocked = false;
  }

  function activateMenu(id) {
    if (id === 'career') {
      if (state.savesLoading) {
        state.status = 'Your website account is still loading';
        render();
        return;
      }
      if (state.saves.length) {
        state.selectedMenu = 1;
        state.status = 'Only one Career save is allowed per account — load your existing career';
        render();
        return;
      }
      state.frameIndex = 0;
      state.selectedTeam = null;
      state.teamConfirmOpen = false;
      state.savesError = '';
      playTone(520);
      void fadeTo('opening');
      return;
    }
    if (id === 'dragon') {
      if (!state.saves.length || state.savesLoading) return;
      state.savePickerOpen = true;
      state.status = 'Choose a saved career';
      playTone(340);
      render();
      return;
    }
    state.exitOpen = true;
    playTone(170);
    render();
  }

  function closeSavePicker() {
    state.savePickerOpen = false;
    state.savesError = '';
    state.status = state.saves.length ? `${state.saves.length} career ${state.saves.length === 1 ? 'save' : 'saves'} ready` : 'Start a career to create your first save';
    playTone(190);
    render();
  }

  async function advanceOpening() {
    if (state.transitionLocked || state.mode !== 'opening') return;
    state.transitionLocked = true;
    playTone(260 + state.frameIndex * 22);
    state.blackout = true;
    root.querySelector('.blackout')?.classList.add('is-visible');
    await delay(430);
    if (state.frameIndex < OPENING_FRAMES.length - 1) {
      state.frameIndex += 1;
      state.blackout = true;
      render();
      await delay(70);
      state.blackout = false;
      root.querySelector('.blackout')?.classList.remove('is-visible');
      await delay(140);
      state.transitionLocked = false;
      return;
    }
    state.mode = 'team-select';
    state.selectedTeam = null;
    state.teamConfirmOpen = false;
    state.blackout = true;
    render();
    await delay(90);
    state.blackout = false;
    root.querySelector('.blackout')?.classList.remove('is-visible');
    state.transitionLocked = false;
  }

  async function saveNewCareer() {
    if (state.busy || state.selectedTeam === null) return;
    if (!state.user || !state.client) {
      state.savesError = 'Your website account is still connecting. Close Career Mode, reopen it and try again.';
      render();
      return;
    }
    if (state.saves.length) {
      state.savesError = 'This account already has a Career save. Return to the main menu and load it instead.';
      render();
      return;
    }
    const team = TEAMS[state.selectedTeam];
    state.busy = true;
    state.savesError = '';
    render();
    try {
      const saveName = `${team.sponsor} Career`;
      const payload = {
        user_id: state.user.id,
        owner_username: username(),
        save_name: saveName,
        team_id: team.id,
        sponsor: team.sponsor,
        racer: team.racer,
        state: { version: 1, stage: 'career-hub', team: { id: team.id, sponsor: team.sponsor, racer: team.racer } }
      };
      const { data, error } = await state.client.from(SAVE_TABLE).insert(payload).select().single();
      if (error) throw error;
      if (!data?.id) throw new Error('The career save did not return a save ID.');
      state.activeSave = data;
      state.status = `${team.sponsor} contract saved to ${username()}'s account`;
      await loadSaves({ preserveStatus: true });
      state.busy = false;
      state.teamConfirmOpen = false;
      playTone(610);
      await fadeTo('career-hub');
    } catch (error) {
      console.error('[Dragonbound Career Mode] Career save failed', error);
      state.busy = false;
      if (error?.code === '23505') {
        try { await loadSaves({ preserveStatus: true }); } catch (_) {}
        state.status = 'This account already has a Career save';
        state.savesError = 'Only one Career save is allowed per account. Return to the main menu and load it instead.';
      } else {
        state.savesError = error?.message || 'The contract could not be saved. Please try again.';
      }
      render();
    }
  }

  async function loadCareer(id) {
    if (state.busy || !state.user || !state.client) return;
    const save = state.saves.find(item => item.id === id);
    if (!save) return;
    state.busy = true;
    state.savesError = '';
    render();
    try {
      const timestamp = new Date().toISOString();
      const { data, error } = await state.client
        .from(SAVE_TABLE)
        .update({ last_played_at: timestamp, updated_at: timestamp })
        .eq('id', save.id)
        .eq('user_id', state.user.id)
        .select()
        .single();
      if (error) throw error;
      state.activeSave = data || save;
      state.busy = false;
      state.savePickerOpen = false;
      state.status = `${save.sponsor} career loaded`;
      await loadSaves({ preserveStatus: true });
      playTone(540);
      await fadeTo('career-hub');
    } catch (error) {
      console.error('[Dragonbound Career Mode] Career load failed', error);
      state.busy = false;
      state.savesError = error?.message || 'That career could not be loaded.';
      render();
    }
  }

  function handleKey(event) {
    if (state.transitionLocked || state.busy) return;
    if (state.mode === 'opening') {
      if (['Enter', ' ', 'ArrowRight'].includes(event.key)) { event.preventDefault(); void advanceOpening(); }
      if (event.key === 'Escape') { event.preventDefault(); state.mode = 'menu'; state.status = 'Choose your path'; render(); }
      return;
    }
    if (state.mode === 'team-select') {
      if (state.teamConfirmOpen) {
        if (event.key === 'Escape') { event.preventDefault(); state.teamConfirmOpen = false; state.savesError = ''; render(); }
        if (event.key === 'Enter') { event.preventDefault(); void saveNewCareer(); }
        return;
      }
      if (['ArrowRight', 'd', 'D'].includes(event.key)) { event.preventDefault(); state.selectedTeam = state.selectedTeam === null ? 0 : (state.selectedTeam + 1) % TEAMS.length; playTone(260); render(); }
      if (['ArrowLeft', 'a', 'A'].includes(event.key)) { event.preventDefault(); state.selectedTeam = state.selectedTeam === null ? TEAMS.length - 1 : (state.selectedTeam - 1 + TEAMS.length) % TEAMS.length; playTone(230); render(); }
      if (event.key === 'Enter' && state.selectedTeam !== null) { event.preventDefault(); state.teamConfirmOpen = true; render(); }
      if (event.key === 'Escape') { event.preventDefault(); state.mode = 'menu'; state.status = 'Choose your path'; render(); }
      return;
    }
    if (state.mode === 'career-hub') {
      if (event.key === 'Escape') { event.preventDefault(); state.mode = 'menu'; state.status = `${state.saves.length} career ${state.saves.length === 1 ? 'save' : 'saves'} ready`; render(); }
      return;
    }
    if (state.savePickerOpen) {
      if (event.key === 'Escape') { event.preventDefault(); closeSavePicker(); }
      return;
    }
    if (state.exitOpen) {
      if (event.key === 'Escape') { event.preventDefault(); state.exitOpen = false; render(); }
      return;
    }
    if (['ArrowDown', 's', 'S'].includes(event.key)) { event.preventDefault(); state.selectedMenu = nextEnabled(state.selectedMenu, 1); playTone(240 + state.selectedMenu * 35); render(); }
    if (['ArrowUp', 'w', 'W'].includes(event.key)) { event.preventDefault(); state.selectedMenu = nextEnabled(state.selectedMenu, -1); playTone(240 + state.selectedMenu * 35); render(); }
    if (event.key === 'Enter') { event.preventDefault(); activateMenu(menuItems()[state.selectedMenu].id); }
    if (event.key === 'Escape') { event.preventDefault(); state.exitOpen = true; render(); }
  }

  root.addEventListener('pointermove', event => {
    const x = event.clientX / window.innerWidth - .5;
    const y = event.clientY / window.innerHeight - .5;
    root.querySelector('.scene')?.style.setProperty('--look-x', `${x * -7}px`);
    root.querySelector('.scene')?.style.setProperty('--look-y', `${y * -5}px`);
    root.querySelector('.team-select-stage')?.style.setProperty('--team-x', `${x * -5}px`);
    root.querySelector('.team-select-stage')?.style.setProperty('--team-y', `${y * -4}px`);
    root.querySelector('.career-hub-stage')?.style.setProperty('--hub-x', `${x * -5}px`);
    root.querySelector('.career-hub-stage')?.style.setProperty('--hub-y', `${y * -4}px`);
  });
  window.addEventListener('keydown', handleKey);
  window.addEventListener('pointerdown', () => syncMusic(), { once: true });
  window.addEventListener('keydown', () => syncMusic(), { once: true });

  OPENING_FRAMES.concat(['dragonbound-career.png', 'team-selection.png', 'career-hub.png']).forEach(source => {
    const image = new Image();
    image.src = source;
  });

  render();
  void connectAccount();
})();
