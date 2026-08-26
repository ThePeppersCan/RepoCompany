(() => {
  'use strict';

  const TEAMS = [
    { id: 'sunscale', name: 'SUNSCALE', captain: 'JALEN CROSS', logo: 'assets/logo-sunscale.png', spread: 'assets/team-spreads/01_Sunscale.png', accent: '#f1b72f', soft: '#b93425', ink: '#06152c', focusX: 11.2, focusY: 39 },
    { id: 'valecroft', name: 'VALECROFT', captain: 'SOFIA MENDES', logo: 'assets/logo-valecroft.png', spread: 'assets/team-spreads/02_Valecroft.png', accent: '#d8e8ce', soft: '#0d6d4c', ink: '#062c22', focusX: 25, focusY: 59 },
    { id: 'ember-oak', name: 'EMBER & OAK', captain: 'LUKA KOVAČ', logo: 'assets/logo-ember-oak.png', spread: 'assets/team-spreads/03_Ember_and_Oak.png', accent: '#d7a34b', soft: '#9e251b', ink: '#250704', focusX: 35.5, focusY: 39 },
    { id: 'quickquill', name: 'QUICKQUILL', captain: 'TYRESE BELL', logo: 'assets/logo-quickquill.png', spread: 'assets/team-spreads/04_Quickquill.png', accent: '#e53d3d', soft: '#ece9df', ink: '#101a2d', focusX: 45.7, focusY: 60 },
    { id: 'wyrmwell', name: 'WYRMWELL', captain: 'REN SATO', logo: 'assets/logo-wyrmwell.png', spread: 'assets/team-spreads/05_Wyrmwell.png', accent: '#52d6df', soft: '#117e83', ink: '#032d35', focusX: 56.2, focusY: 36 },
    { id: 'fizzy-drake', name: 'FIZZY DRAKE', captain: 'MAYA BANKS', logo: 'assets/logo-fizzy-drake.png', spread: 'assets/team-spreads/06_Fizzy_Drake.png', accent: '#44cfff', soft: '#0d66a8', ink: '#031d40', focusX: 65.4, focusY: 58 }
  ];
  const DUST = Array.from({ length: 26 }, (_, index) => ({
    left: `${4 + ((index * 37) % 64)}%`,
    top: `${10 + ((index * 53) % 72)}%`,
    delay: `${-((index * .47) % 7)}s`,
    duration: `${6 + (index % 5) * 1.3}s`,
    size: `${1 + (index % 3)}px`
  }));

  const root = document.getElementById('meetTeamsRoot');
  const params = new URLSearchParams(window.location.search);
  const state = {
    ready: false,
    previewId: null,
    selectedId: null,
    detailId: null,
    transitioning: false,
    soundEnabled: params.get('sound') !== '0',
    inputLock: 0,
    returnFocus: null,
    previousButtons: [],
    previousAxis: 0,
    animationFrame: 0
  };
  let audioContext = null;

  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
  const teamById = id => TEAMS.find(team => team.id === id) || null;
  const styleFor = team => `--team-accent:${team.accent};--team-soft:${team.soft};--team-ink:${team.ink}`;
  const soundIcon = muted => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"></path>${muted ? '<path d="m17 9 4 4m0-4-4 4"></path>' : '<path d="M16 8.2c1.2 1 1.8 2.2 1.8 3.8S17.2 14.8 16 15.8m2.4-10c2 1.7 3.1 3.8 3.1 6.2s-1.1 4.5-3.1 6.2"></path>'}</svg>`;
  const dustMarkup = (items = DUST) => items.map(particle => `<span style="left:${particle.left};top:${particle.top};animation-delay:${particle.delay};animation-duration:${particle.duration};width:${particle.size};height:${particle.size}"></span>`).join('');

  function volumeSetting(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : fallback;
    } catch (_) { return fallback; }
  }

  function music() { return document.getElementById('meetTeamsMusic'); }
  function syncMusic() {
    const track = music();
    if (!track) return;
    track.volume = .23;
    track.loop = true;
    track.muted = !state.soundEnabled;
    if (!state.soundEnabled || document.hidden) { track.pause(); return; }
    void track.play().catch(() => undefined);
  }

  function playSound(kind) {
    if (!state.soundEnabled) return;
    const event = new CustomEvent('velmora:ui-sound', { cancelable: true, detail: { kind } });
    if (!window.dispatchEvent(event)) return;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      audioContext ||= new AudioCtor();
      const master = volumeSetting('velmora.masterVolume', .7);
      const effects = volumeSetting('velmora.effectsVolume', .55);
      if (master * effects <= 0) return;
      const settings = {
        move: [310, .035, .018], select: [480, .055, .05],
        back: [205, .06, .04], open: [620, .085, .065]
      };
      const [frequency, duration, level] = settings[kind] || settings.move;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      oscillator.type = kind === 'open' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .72, now + duration);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(level * master * effects, now + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + .01);
    } catch (_) {}
  }

  function renderShell() {
    root.innerHTML = `
      <div class="game-stage is-loading" id="meetTeamsStage" aria-busy="true">
        <audio id="meetTeamsMusic" src="assets/menu-theme.mp3" preload="none" loop aria-hidden="true"></audio>
        <h1 class="sr-only">Meet the Teams</h1><p class="sr-only">Dragon Racing Grid</p>
        <div class="scene" aria-hidden="true"><div class="scene-art"></div><div class="moving-daylight"></div><div class="captain-focus"></div><div class="ambient-vignette"></div><div class="trophy-glint glint-one"></div><div class="trophy-glint glint-two"></div><div class="mug-steam steam-one"></div><div class="mug-steam steam-two"></div><div class="dust-field">${dustMarkup()}</div></div>
        <header class="mobile-heading"><span>MEET THE TEAMS</span><small>DRAGON RACING GRID</small></header>
        <section class="team-panel" aria-label="Dragon racing teams">
          <div class="panel-kicker" aria-hidden="true"><span>GRID ROSTER</span><span>06 TEAMS</span></div>
          <div class="team-list" role="list">${TEAMS.map((team, index) => `
            <button type="button" class="team-row" style="${styleFor(team)}" data-team="${team.id}" data-team-index="${index}" aria-label="${escapeHtml(team.name)}, captain ${escapeHtml(team.captain)}. Preview team" aria-pressed="false">
              <span class="row-edge" aria-hidden="true"></span><span class="logo-cell"><img src="${team.logo}" alt="" draggable="false"><span class="logo-sweep" aria-hidden="true"></span></span>
              <span class="team-copy"><span class="team-name">${escapeHtml(team.name)}</span><span class="captain-name">${escapeHtml(team.captain)}</span><span class="preview-label" aria-hidden="true">PREVIEW TEAM</span></span><span class="selection-pip" aria-hidden="true"></span>
            </button>`).join('')}</div>
        </section>
        <div class="selection-strip" aria-live="polite"></div>
        <footer class="control-bar">
          <button class="control control-back" type="button" data-back><span class="control-key key-b">B</span><span>BACK</span></button>
          <div class="control-center" aria-live="polite"><span class="input-hint">W/S OR ↑/↓</span><span data-control-status>CHOOSE A RACING SPONSOR</span></div>
          <div class="right-controls"><button class="sound-toggle" type="button" data-sound aria-label="${state.soundEnabled ? 'Mute' : 'Enable'} menu audio" aria-pressed="${state.soundEnabled}" title="${state.soundEnabled ? 'Mute' : 'Enable'} menu audio">${soundIcon(!state.soundEnabled)}</button><button class="control control-view" type="button" data-view disabled aria-label="View Team, select a team first"><span class="control-key key-a">A</span><span>VIEW TEAM</span></button></div>
        </footer>
        <div class="cinematic-wipe" aria-hidden="true"></div><div class="film-grain" aria-hidden="true"></div>
        <div class="loading-screen" role="status"><div class="loading-crest">V</div><span>ASSEMBLING THE GRID</span><i></i></div>
        <div id="teamDetailMount"></div>
      </div>`;
    bindShell();
    syncMusic();
    preloadMenu();
  }

  function stage() { return document.getElementById('meetTeamsStage'); }
  function rows() { return [...root.querySelectorAll('[data-team]')]; }

  function applyVisualState() {
    const visual = teamById(state.previewId || state.selectedId);
    const selected = teamById(state.selectedId);
    const shell = stage();
    if (!shell) return;
    shell.classList.toggle('has-preview', !!visual);
    shell.classList.toggle('has-selection', !!selected);
    if (visual) {
      shell.style.setProperty('--focus-x', `${visual.focusX}%`);
      shell.style.setProperty('--focus-y', `${visual.focusY}%`);
      shell.style.setProperty('--active-color', visual.accent);
      shell.style.setProperty('--active-soft', visual.soft);
    }
    rows().forEach(row => {
      const isSelected = row.dataset.team === state.selectedId;
      const isPreviewed = row.dataset.team === state.previewId;
      row.classList.toggle('is-selected', isSelected);
      row.classList.toggle('is-previewed', isPreviewed);
      row.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      const team = teamById(row.dataset.team);
      row.setAttribute('aria-label', `${team.name}, captain ${team.captain}. ${isSelected ? 'Selected' : 'Preview team'}`);
      const label = row.querySelector('.preview-label');
      if (label) label.textContent = isSelected ? 'TEAM READY' : 'PREVIEW TEAM';
    });
    const strip = root.querySelector('.selection-strip');
    if (strip) {
      strip.classList.toggle('is-visible', !!selected);
      strip.innerHTML = selected ? `<span class="strip-dot" style="background:${selected.accent}"></span><span>${escapeHtml(selected.name)}</span><i></i><small>CAPTAIN</small><strong>${escapeHtml(selected.captain)}</strong>` : '';
    }
    const view = root.querySelector('[data-view]');
    if (view) {
      view.disabled = !selected || state.transitioning;
      view.setAttribute('aria-label', selected ? `View ${selected.name}` : 'View Team, select a team first');
    }
    const status = root.querySelector('[data-control-status]');
    if (status) status.textContent = selected ? 'TEAM SELECTED' : 'CHOOSE A RACING SPONSOR';
  }

  function setPreview(id) { state.previewId = id; applyVisualState(); }
  function chooseTeam(team) {
    if (!team || state.transitioning) return;
    state.selectedId = team.id;
    state.previewId = team.id;
    playSound('select');
    applyVisualState();
  }

  function currentTeamIndex() {
    const focused = document.activeElement;
    const byFocus = rows().findIndex(row => row === focused);
    if (byFocus >= 0) return byFocus;
    const activeId = state.previewId || state.selectedId;
    const byState = TEAMS.findIndex(team => team.id === activeId);
    return byState >= 0 ? byState : 0;
  }

  function focusTeam(index) {
    const safe = (index + TEAMS.length) % TEAMS.length;
    const row = rows()[safe];
    row?.focus();
    setPreview(TEAMS[safe].id);
  }

  function openTeamDetails(team) {
    if (!team || state.transitioning || state.detailId) return;
    state.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    state.selectedId = team.id;
    state.previewId = team.id;
    state.transitioning = true;
    stage()?.classList.add('is-transitioning');
    playSound('open');
    applyVisualState();
    window.setTimeout(() => {
      state.detailId = team.id;
      state.transitioning = false;
      stage()?.classList.remove('is-transitioning');
      renderDetail(team);
      applyVisualState();
    }, 480);
  }

  function renderDetail(team) {
    const mount = document.getElementById('teamDetailMount');
    if (!mount) return;
    mount.innerHTML = `<section class="team-detail" style="${styleFor(team)}" role="dialog" aria-modal="true" aria-labelledby="team-detail-title">
      <div class="detail-color-field" aria-hidden="true"></div><div class="detail-grid-lines" aria-hidden="true"></div><div class="detail-particles" aria-hidden="true">${dustMarkup(DUST.slice(0, 14))}</div>
      <header class="detail-header"><span>${String(TEAMS.indexOf(team) + 1).padStart(2, '0')} / 06</span><div><small>TEAM DOSSIER</small><strong id="team-detail-title">${escapeHtml(team.name)}</strong></div><span>${escapeHtml(team.captain)}</span></header>
      <div class="detail-spread-frame"><div class="spread-loader" aria-hidden="true"><span>OPENING TEAM ARCHIVE</span></div><img src="${team.spread}" alt="${escapeHtml(team.name)} team and sponsor profile spread featuring captain ${escapeHtml(team.captain)}"><div class="spread-spine" aria-hidden="true"></div><div class="spread-glint" aria-hidden="true"></div></div>
      <div class="detail-footer"><button type="button" data-close-detail><span class="control-key key-b">B</span>RETURN TO TEAM GRID</button><span>VELMORA · DRAGONBOUND CAREER MODE</span></div>
    </section>`;
    const detail = mount.querySelector('.team-detail');
    const image = mount.querySelector('.detail-spread-frame img');
    const markLoaded = () => image?.closest('.detail-spread-frame')?.classList.add('is-loaded');
    image?.addEventListener('load', markLoaded, { once: true });
    if (image?.complete) queueMicrotask(markLoaded);
    mount.querySelector('[data-close-detail]')?.addEventListener('click', closeDetail);
    detail?.addEventListener('keydown', event => {
      if (event.key === 'Tab') { event.preventDefault(); mount.querySelector('[data-close-detail]')?.focus(); }
    });
    window.setTimeout(() => mount.querySelector('[data-close-detail]')?.focus(), 80);
  }

  function closeDetail() {
    if (!state.detailId || state.transitioning) return;
    state.transitioning = true;
    playSound('back');
    const detail = root.querySelector('.team-detail');
    detail?.classList.add('is-closing');
    window.setTimeout(() => {
      document.getElementById('teamDetailMount').innerHTML = '';
      state.detailId = null;
      state.transitioning = false;
      applyVisualState();
      window.setTimeout(() => (state.returnFocus || root.querySelector('[data-view]'))?.focus(), 30);
    }, 320);
  }

  function leaveMeetTeams() {
    music()?.pause();
    try {
      if (typeof window.parent?.DragonboundCareerMeetTeamsClose === 'function') {
        window.parent.DragonboundCareerMeetTeamsClose();
        return;
      }
    } catch (_) {}
    try { window.parent.postMessage({ type: 'dragonbound-career-meet-teams-close' }, window.location.origin); }
    catch (_) { window.parent.postMessage({ type: 'dragonbound-career-meet-teams-close' }, '*'); }
  }

  function goBack() {
    if (state.transitioning) return;
    if (state.detailId) { closeDetail(); return; }
    playSound('back');
    leaveMeetTeams();
  }

  function bindShell() {
    rows().forEach(row => {
      const team = teamById(row.dataset.team);
      row.addEventListener('pointerenter', () => {
        if (state.previewId !== team.id) playSound('move');
        setPreview(team.id);
      });
      row.addEventListener('focus', () => setPreview(team.id));
      row.addEventListener('blur', event => {
        if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) setPreview(state.selectedId);
      });
      row.addEventListener('click', () => openTeamDetails(team));
    });
    root.querySelector('[data-back]')?.addEventListener('click', goBack);
    root.querySelector('[data-view]')?.addEventListener('click', () => openTeamDetails(teamById(state.selectedId)));
    root.querySelector('[data-sound]')?.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      const button = root.querySelector('[data-sound]');
      button.innerHTML = soundIcon(!state.soundEnabled);
      button.setAttribute('aria-label', `${state.soundEnabled ? 'Mute' : 'Enable'} menu audio`);
      button.setAttribute('aria-pressed', state.soundEnabled ? 'true' : 'false');
      button.title = `${state.soundEnabled ? 'Mute' : 'Enable'} menu audio`;
      if (state.soundEnabled) playSound('select');
      syncMusic();
    });
    const shell = stage();
    shell?.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const rect = shell.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - .5) * 2;
      shell.style.setProperty('--parallax-x', `${x * -5}px`);
      shell.style.setProperty('--parallax-y', `${y * -3}px`);
    });
    shell?.addEventListener('pointerleave', () => {
      shell.style.setProperty('--parallax-x', '0px');
      shell.style.setProperty('--parallax-y', '0px');
      setPreview(state.selectedId);
    });
  }

  function preloadMenu() {
    const sources = ['assets/clubhouse-grid.png', ...TEAMS.map(team => team.logo)];
    Promise.all(sources.map(source => new Promise(resolve => {
      const image = new Image();
      image.onload = resolve; image.onerror = resolve; image.src = source;
    }))).then(() => window.setTimeout(() => {
      state.ready = true;
      stage()?.classList.add('is-ready');
      stage()?.classList.remove('is-loading');
      stage()?.setAttribute('aria-busy', 'false');
      try { window.parent.postMessage({ type: 'dragonbound-career-meet-teams-ready' }, window.location.origin); } catch (_) {}
    }, 120));
  }

  function handleKey(event) {
    if (event.repeat || state.transitioning) return;
    const key = event.key.toLowerCase();
    if (state.detailId) {
      if (key === 'escape' || key === 'b') { event.preventDefault(); closeDetail(); }
      return;
    }
    if (key === 'arrowdown' || key === 's') { event.preventDefault(); focusTeam(currentTeamIndex() + 1); playSound('move'); }
    else if (key === 'arrowup' || key === 'w') { event.preventDefault(); focusTeam(currentTeamIndex() - 1); playSound('move'); }
    else if (key === 'escape' || key === 'b') { event.preventDefault(); goBack(); }
    else if (key === 'a' && state.selectedId) { event.preventDefault(); openTeamDetails(teamById(state.selectedId)); }
  }

  function pollGamepad() {
    const pad = navigator.getGamepads?.()[0];
    if (pad && !state.transitioning) {
      const buttons = pad.buttons.map(button => button.pressed);
      const axis = Math.abs(pad.axes[1] || 0) > .62 ? Math.sign(pad.axes[1] || 0) : 0;
      const now = performance.now();
      const up = !!buttons[12] || axis < 0, down = !!buttons[13] || axis > 0;
      const wasUp = !!state.previousButtons[12] || state.previousAxis < 0;
      const wasDown = !!state.previousButtons[13] || state.previousAxis > 0;
      if (now > state.inputLock && up && !wasUp) { focusTeam(currentTeamIndex() - 1); playSound('move'); state.inputLock = now + 145; }
      else if (now > state.inputLock && down && !wasDown) { focusTeam(currentTeamIndex() + 1); playSound('move'); state.inputLock = now + 145; }
      if (now > state.inputLock && buttons[0] && !state.previousButtons[0]) {
        if (state.detailId) closeDetail();
        else if (state.selectedId) openTeamDetails(teamById(state.selectedId));
        else chooseTeam(TEAMS[currentTeamIndex()]);
        state.inputLock = now + 260;
      }
      if (now > state.inputLock && buttons[1] && !state.previousButtons[1]) { goBack(); state.inputLock = now + 220; }
      state.previousButtons = buttons;
      state.previousAxis = axis;
    }
    state.animationFrame = requestAnimationFrame(pollGamepad);
  }

  document.addEventListener('visibilitychange', syncMusic);
  window.addEventListener('keydown', handleKey);
  window.addEventListener('pointerdown', syncMusic, { once: true });
  window.addEventListener('keydown', syncMusic, { once: true });
  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === 'dragonbound-career-meet-teams-sound') {
      state.soundEnabled = !!event.data.soundOn;
      syncMusic();
    }
  });
  window.addEventListener('beforeunload', () => cancelAnimationFrame(state.animationFrame));

  renderShell();
  state.animationFrame = requestAnimationFrame(pollGamepad);
})();
