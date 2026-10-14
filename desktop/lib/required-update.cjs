'use strict';
const { EventEmitter } = require('node:events');

// Native policy owns the lock and deadline; renderer reloads cannot postpone it.
class RequiredUpdate extends EventEmitter {
  constructor({ enabled, prepare, restart, now = Date.now, delay = 10000, setTimer = setTimeout, clearTimer = clearTimeout }) {
    super(); Object.assign(this, { enabled, prepare, restart, now, delay, setTimer, clearTimer });
    this.state = { locked: !!enabled, phase: 'checking', restartAt: null, error: '' };
    this.required = false; this.timer = null; this.pending = null; this.disposed = false;
  }
  snapshot() { return { ...this.state }; }
  set(value) { if (!this.disposed) { this.state = { ...this.state, ...value }; this.emit('change', this.snapshot()); } }
  observe(update) {
    if (!this.enabled || this.disposed || this.pending) return;
    const { status, version } = update || {};
    if (['downloading', 'verifying', 'ready'].includes(status)) this.required = true;
    if (status === 'current' && !this.required) { this.set({ locked: false, phase: 'current', error: '' }); return; }
    if (!this.required && !this.state.locked) return; // Periodic checks keep a verified client usable until a new release is found.
    if (status === 'ready') {
      if (this.timer || this.state.phase === 'save-error') return;
      this.set({ locked: true, phase: 'countdown', version, restartAt: this.now() + this.delay, error: '' });
      this.timer = this.setTimer(() => { this.timer = null; void this.install(); }, this.delay);
      this.timer?.unref?.(); return;
    }
    if (this.timer) { this.clearTimer(this.timer); this.timer = null; }
    this.set({ locked: true, phase: ['checking', 'downloading', 'verifying'].includes(status) ? status : 'error', version: version || this.state.version, restartAt: null, error: '' });
  }
  install() {
    if (this.pending) return this.pending;
    if (!this.required || this.disposed || !['countdown', 'save-error'].includes(this.state.phase)) return Promise.resolve();
    if (this.timer) { this.clearTimer(this.timer); this.timer = null; }
    this.set({ locked: true, phase: 'saving', restartAt: null, error: '' });
    this.pending = Promise.resolve().then(() => this.prepare()).then(() => {
      if (this.disposed) return;
      this.set({ phase: 'restarting' }); this.restart();
    }).catch(() => {
      this.set({ phase: 'save-error', error: 'Your game could not finish saving or a download is still stopping. Retry to update safely.' });
    }).finally(() => { this.pending = null; });
    return this.pending;
  }
  dispose() { this.disposed = true; if (this.timer) this.clearTimer(this.timer); this.timer = null; }
}
module.exports = { RequiredUpdate };
