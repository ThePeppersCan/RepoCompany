(() => {
  'use strict';
  // The supplied recordings are copied locally; no third-party audio service is used.
  const files = {
    music: 'audio/ambient-music.mp3',
    hover: 'audio/case-hover-v2.mp3',
    open: 'audio/case-open-v2.mp3',
    screenshot: 'audio/screenshot-open.mp3',
    wibsworthComplete: '/audio/wibsworth-answer-complete.mp3',
    spin: 'audio/disc-spin-balanced.wav'
  };
  // The very quiet spin recording has a derived PCM copy with 15.88x gain and a safe .85 peak.
  const levels = {music: .085, hover: .38, open: .30, screenshot: .26, spin: .06, wibsworthComplete: .4};
  const mix={music:1,effects:1,disc:1};
  try{const saved=JSON.parse(localStorage.getItem('repo-dashboard-mix')||'{}');for(const key of Object.keys(mix))if(Number.isFinite(saved[key]))mix[key]=Math.max(0,Math.min(1,saved[key]));}catch(_){}
  const tracks = Object.fromEntries(Object.entries(files).map(([name, path]) => {
    const audio = new Audio(path);
    audio.preload = name === 'music' || name === 'spin' ? 'metadata' : 'auto';
    audio.loop = name === 'music' || name === 'spin';
    audio.volume = 0;
    audio.dataset.sound = name;
    return [name, audio];
  }));
  const toggle = document.querySelector('[data-audio]');
  const fades = new Map(), lastEffect = new Map();
  let muted = false, unlocked = false, spinning = false, launching = false, ducked = false, suspended = false;
  let messagesOpen = !!window.repoMessaging?.getState().open;
  try { muted = localStorage.getItem('repo-dashboard-muted') === 'true'; } catch (_) {}

  function play(audio) {
    try { audio.play()?.catch(() => {}); } catch (_) { /* A blocked or missing sound must not block navigation. */ }
  }
  function fade(audio, target, duration = 300, pauseAtEnd = false) {
    cancelAnimationFrame(fades.get(audio));
    const from = audio.volume, start = performance.now();
    if (duration === 0) {
      audio.volume = target;
      if (pauseAtEnd) audio.pause();
      fades.delete(audio);
      return;
    }
    const step = now => {
      const t = Math.min(1, (now - start) / duration);
      audio.volume = Math.max(0, Math.min(1, from + (target - from) * t * t * (3 - 2 * t)));
      if (t < 1) fades.set(audio, requestAnimationFrame(step));
      else { fades.delete(audio); if (pauseAtEnd) audio.pause(); }
    };
    fades.set(audio, requestAnimationFrame(step));
  }
  function available() { return unlocked && !muted && !document.hidden && !suspended; }
  function completionAvailable() { return unlocked && !muted && mix.effects > 0; }
  function sync() {
    toggle.setAttribute('aria-pressed', String(muted));
    toggle.setAttribute('aria-label', muted ? 'Unmute audio' : 'Mute audio');
    toggle.title = muted ? 'Sound off' : unlocked ? 'Sound on' : 'Sound starts when you interact';
    toggle.querySelector('.sound-waves').style.opacity = muted ? 0 : 1;
    toggle.dataset.audioState = muted ? 'muted' : unlocked ? 'on' : 'waiting';
    // Completion is a notification: backgrounding the app must not silence it.
    fade(tracks.wibsworthComplete, completionAvailable() ? levels.wibsworthComplete * mix.effects : 0, 0, !completionAvailable());
    if (!available()) {
      Object.entries(tracks).forEach(([name,audio]) => { if(name !== 'wibsworthComplete') fade(audio, 0, 0, true); });
      return;
    }
    // Wibs pauses only collection music; call audio and the saved sound preference stay independent.
    if (messagesOpen || window.repoMedia?.getState().reparty.active) fade(tracks.music, 0, 0, true);
    if (launching) return;
    if (!messagesOpen && !window.repoMedia?.getState().reparty.active) {
      play(tracks.music);
      fade(tracks.music, levels.music * mix.music * (ducked ? .42 : 1), 550);
    }
    if (spinning) {
      play(tracks.spin);
      fade(tracks.spin, levels.spin * mix.disc, 350);
    } else fade(tracks.spin, 0, 500, true);
  }
  function unlock(event) {
    if (!event.isTrusted || unlocked || event.target.closest?.('[data-audio]')) return;
    // Browsers require a click/key before sound. Hover alone deliberately stays silent.
    unlocked = true;
    sync();
  }
  addEventListener('pointerdown', unlock, {capture: true});
  addEventListener('keydown', event => {
    if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key !== 'Escape') unlock(event);
  }, {capture: true});
  toggle.addEventListener('click', () => {
    unlocked = true;
    muted = !muted;
    try { localStorage.setItem('repo-dashboard-muted', String(muted)); } catch (_) {}
    sync();
  });

  window.dashboardAudio = Object.freeze({
    effect(name) {
      if (!['hover', 'open', 'screenshot', 'wibsworthComplete'].includes(name)) return;
      if (name === 'wibsworthComplete' ? !completionAvailable() : !available() || launching) return;
      const now = performance.now();
      if (name !== 'wibsworthComplete' && now - (lastEffect.get(name) ?? -Infinity) < (name === 'hover' ? 150 : 100)) return;
      lastEffect.set(name, now);
      const audio = tracks[name];
      audio.currentTime = 0;
      audio.volume = levels[name] * mix.effects;
      play(audio);
    },
    spin(value) {
      if (launching || spinning === value) return;
      spinning = value;
      if (spinning && tracks.spin.paused) tracks.spin.currentTime = 0;
      sync();
    },
    gallery(value) { ducked = value; sync(); },
    launch(duration) {
      launching = true;
      if (!available()) return;
      play(tracks.spin);
      fade(tracks.spin, .085 * mix.disc, 450);
      fade(tracks.music, 0, duration, true);
      ['hover', 'open', 'screenshot'].forEach(name => fade(tracks[name], 0, 180, true));
    },
    finish() { Object.entries(tracks).forEach(([name,audio]) => { if(name !== 'wibsworthComplete') fade(audio, 0, 280, true); }); },
    reset() { launching = spinning = ducked = false; sync(); },
    suspend(value) { suspended=!!value; sync(); },
    preferences() { return {...mix,muted}; },
    setMix(key,value) {
      if(!Object.hasOwn(mix,key)||!Number.isFinite(value))return;
      mix[key]=Math.max(0,Math.min(1,value));
      try{localStorage.setItem('repo-dashboard-mix',JSON.stringify(mix));}catch(_){}
      sync();
    }
  });
  addEventListener('repo-media-state',sync);
  document.addEventListener('visibilitychange', sync);
  addEventListener('repo-messaging-state', event => {
    if (typeof event.detail?.open !== 'boolean' || event.detail.open === messagesOpen) return;
    messagesOpen = event.detail.open;
    sync();
  });
  addEventListener('pagehide', () => Object.values(tracks).forEach(audio => fade(audio, 0, 0, true)));
  addEventListener('pageshow', event => { if (event.persisted) window.dashboardAudio.reset(); });
  sync();
})();
