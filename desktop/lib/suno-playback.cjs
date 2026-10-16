'use strict';
const { performance } = require('node:perf_hooks');
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function syncState(value) {
  if (!value || !uuid.test(value.id) || !Number.isFinite(value.position) || !Number.isFinite(value.sampledAt)) return null;
  return { id: value.id.toLowerCase(), position: Math.max(0, Math.min(86400, value.position)), sampledAt: value.sampledAt, playing: value.playing === true };
}
function isSunoFrame(frame, portalOrigin, id) {
  try {
    const url = new URL(frame.url), parent = new URL(frame.parent.url);
    return url.protocol === 'https:' && ['suno.com','www.suno.com'].includes(url.hostname) && !url.port && !url.username && !url.password &&
      url.pathname.replace(/\/$/, '') === '/embed/' + id && parent.origin === portalOrigin && parent.pathname === '/reparty/' &&
      frame.parent.parent === frame.top && new URL(frame.top.url).origin === portalOrigin;
  } catch { return false; }
}
// Runs inside the official player, never exposing a native bridge or media URL.
// Suno still loads and decodes its audio. Only normal media controls are changed.
function followRoom(next) {
  if (!['https://suno.com','https://www.suno.com'].includes(location.origin) || location.pathname.replace(/\/$/, '') !== '/embed/' + next.id) return;
  let state = window.__repoSunoPlayback;
  if (!state) {
    state = { next, at: performance.now(), busy: false };
    state.apply = () => {
      const target = state.next.position + (state.next.playing ? (performance.now() - state.at) / 1000 : 0);
      for (const audio of document.querySelectorAll('audio')) {
        audio.volume = state.next.volume;
        if (!audio.readyState || !Number.isFinite(audio.duration)) continue;
        const position = Math.min(target, audio.duration), drift = position - audio.currentTime;
        if (Math.abs(drift) > .65) { try { audio.currentTime = position; } catch {} }
        audio.playbackRate = Math.abs(drift) > .08 && Math.abs(drift) <= .65 && state.next.playing ? (drift > 0 ? 1.02 : .98) : 1;
        if (!state.next.playing || target >= audio.duration) { if (!audio.paused) audio.pause(); }
        else if (audio.paused && !state.busy) {
          state.busy = true; audio.play().catch(() => {}).finally(() => { state.busy = false; });
        }
      }
    };
    for (const event of ['loadedmetadata','canplay','play']) document.addEventListener(event, state.apply, true);
    Object.defineProperty(window, '__repoSunoPlayback', { value: state });
  }
  state.next = next; state.at = performance.now(); state.apply();
}
class SunoPlayback {
  constructor(contents, portalOrigin) {
    this.contents = contents; this.origin = portalOrigin; this.state = null; this.pending = new Set();
    contents.on('did-frame-finish-load', () => this.apply());
    // Main-process timing keeps working when the portal/game/window is hidden.
    this.timer = setInterval(() => this.apply(), 500); this.timer.unref();
    contents.once('destroyed', () => clearInterval(this.timer));
  }
  update(value) {
    const sync = value.active === true && syncState(value.suno);
    this.state = sync ? { ...sync, volume: value.muted === true ? 0 : Math.max(0, Math.min(100, Number.isFinite(value.volume) ? value.volume : 70)) / 100,
      position: sync.position + (sync.playing ? Math.max(0, Math.min(5, (Date.now() - sync.sampledAt) / 1000)) : 0) } : null;
    this.at = performance.now(); this.apply();
  }
  apply() {
    if (!this.state || this.contents.isDestroyed()) return;
    const next = { ...this.state, position: this.state.position + (this.state.playing ? (performance.now() - this.at) / 1000 : 0) };
    for (const frame of this.contents.mainFrame.framesInSubtree) {
      if (!isSunoFrame(frame, this.origin, next.id) || this.pending.has(frame)) continue;
      this.pending.add(frame);
      // A bounded state object, never arbitrary code supplied by the portal.
      void frame.executeJavaScript('(' + followRoom.toString() + ')(' + JSON.stringify(next) + ')', true)
        .catch(() => {}).finally(() => this.pending.delete(frame));
    }
  }
}
module.exports = { SunoPlayback, isSunoFrame, syncState };
