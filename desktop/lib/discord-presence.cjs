'use strict';

// Discord's local IPC protocol: https://discord.com/developers/docs/topics/rpc
// SET_ACTIVITY requires no user token. No Discord user data is retained.
const net = require('node:net');
const { EventEmitter } = require('node:events');
const { randomUUID } = require('node:crypto');
const MAX_PACKET = 64 * 1024;
const PIPE_COUNT = 10;
const validId = value => typeof value === 'string' && /^[1-9]\d{16,19}$/.test(value) && BigInt(value) <= 18446744073709551615n;

function packet(opcode, value) {
  const body = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value), 'utf8');
  if (body.length > MAX_PACKET) throw new Error('Discord packet is too large.');
  const frame = Buffer.allocUnsafe(8 + body.length);
  frame.writeUInt32LE(opcode, 0); frame.writeUInt32LE(body.length, 4); body.copy(frame, 8);
  return frame;
}

class DiscordPresence extends EventEmitter {
  constructor({ applications = {}, enabled = true } = {}, dependencies = {}) {
    super();
    this.applications = new Map();
    for (const [id, value] of Object.entries(applications || {})) {
      if (!/^[a-z0-9-]{1,64}$/.test(id)) continue;
      const entry = typeof value === 'string' ? { clientId: value } : value;
      if (!validId(entry?.clientId)) continue;
      this.applications.set(id, Object.freeze({ clientId: entry.clientId, name: typeof entry.name === 'string' ? entry.name.slice(0, 100) : id }));
    }
    this.enabled = enabled === true; this.disposed = false;
    this.running = new Map(); this.order = 0; this.connection = null; this.retryTimer = null; this.failures = 0;
    this.status = this.enabled ? 'idle' : 'disabled';
    this.connect = dependencies.connect || (options => net.createConnection(options));
    this.now = dependencies.now || Date.now;
    this.setTimer = dependencies.setTimeout || setTimeout;
    this.clearTimer = dependencies.clearTimeout || clearTimeout;
    this.platform = dependencies.platform || process.platform;
    this.pid = dependencies.pid || process.pid;
  }

  snapshot() {
    return { enabled: this.enabled, status: this.status, gameId: this._selected()?.id || null, configuredGames: [...this.applications.keys()] };
  }
  gameStarted(id) {
    if (this.disposed || typeof id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(id)) return;
    if (!this.running.has(id)) {
      if (this.running.size >= 32) return;
      this.running.set(id, { id, start: Math.floor(this.now() / 1000), order: ++this.order });
    }
    this._reconcile();
  }
  gameFocused(id) {
    if (this.disposed || !this.running.has(id)) return;
    this.running.get(id).order = ++this.order;
    this._cancelRetry(); this._reconcile();
  }
  gameStopped(id) {
    if (this.disposed || !this.running.delete(id)) return;
    this._cancelRetry(); this._reconcile();
  }
  setEnabled(enabled) {
    if (this.disposed || typeof enabled !== 'boolean' || this.enabled === enabled) return;
    this.enabled = enabled; this._cancelRetry(); this._reconcile();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.enabled = false; this.running.clear(); this._cancelRetry();
    this._reconcile();
  }
  _selected() {
    let current = null;
    for (const entry of this.running.values()) if (!current || entry.order > current.order) current = entry;
    return current;
  }
  _target() {
    const current = this._selected(), app = current && this.applications.get(current.id);
    return this.enabled && !this.disposed && current && app ? { ...current, ...app } : null;
  }
  _publish(status = this.status) {
    this.status = status;
    const snapshot = this.snapshot(), serialized = JSON.stringify(snapshot);
    if (serialized !== this.lastSnapshot) { this.lastSnapshot = serialized; this.emit('change', snapshot); }
  }
  _later(callback, ms) { const timer = this.setTimer(callback, ms); timer.unref?.(); return timer; }
  _cancelRetry() { if (this.retryTimer) this.clearTimer(this.retryTimer); this.retryTimer = null; }
  _arm(connection, ms, callback) {
    if (connection.timer) this.clearTimer(connection.timer);
    connection.timer = this._later(() => { connection.timer = null; if (!connection.closed) callback(); }, ms);
  }
  _reconcile() {
    const target = this._target(), connection = this.connection;
    if (connection && (!target || connection.target.id !== target.id || connection.closing)) {
      if (target) this._publish('connecting');
      this._retire(connection);
    }
    if (!target) { this._publish(!this.enabled ? 'disabled' : this._selected() ? 'unconfigured' : 'idle'); return; }
    if (this.platform !== 'win32') { this._publish('unavailable'); return; }
    if (!this.connection && !this.retryTimer) this._dial(target, 0);
    else this._publish();
  }
  _dial(target, index) {
    if (this.disposed || !this.enabled || this._target()?.id !== target.id) return this._reconcile();
    const connection = { target, index, socket: null, buffer: Buffer.alloc(0), ready: false, closing: false, closed: false, pending: null, timer: null };
    this.connection = connection; this._publish('connecting');
    try {
      connection.socket = this.connect({ path: `\\\\?\\pipe\\discord-ipc-${index}` });
      const socket = connection.socket;
      socket.unref?.();
      socket.on('connect', () => {
        if (connection.closed || connection.closing) return;
        this._write(connection, 0, { v: 1, client_id: target.clientId });
      });
      socket.on('data', data => this._read(connection, data));
      socket.on('error', () => this._failed(connection));
      socket.on('close', () => this._failed(connection));
      this._arm(connection, 2500, () => this._failed(connection));
    } catch { this._failed(connection); }
  }
  _write(connection, opcode, value) {
    if (connection.closed) return false;
    try {
      if (!connection.socket || connection.socket.destroyed || connection.socket.writableLength > MAX_PACKET) throw new Error('Unavailable pipe');
      connection.socket.write(packet(opcode, value)); return true;
    } catch { this._failed(connection); return false; }
  }
  _read(connection, data) {
    if (connection.closed) return;
    if (!Buffer.isBuffer(data) || data.length + connection.buffer.length > MAX_PACKET * 2 + 16) return this._failed(connection);
    connection.buffer = Buffer.concat([connection.buffer, data]);
    while (!connection.closed && connection.buffer.length >= 8) {
      const opcode = connection.buffer.readUInt32LE(0), size = connection.buffer.readUInt32LE(4);
      if (size > MAX_PACKET || opcode > 4) return this._failed(connection);
      if (connection.buffer.length < 8 + size) return;
      const body = connection.buffer.subarray(8, 8 + size);
      connection.buffer = connection.buffer.subarray(8 + size);
      if (opcode === 3) { this._write(connection, 4, body); continue; }
      if (opcode === 4) continue;
      if (opcode !== 1) return this._failed(connection);
      let message;
      try { message = JSON.parse(body.toString('utf8')); } catch { return this._failed(connection); }
      if (!message || typeof message !== 'object' || Array.isArray(message)) return this._failed(connection);
      if (!connection.ready) {
        if (message.cmd !== 'DISPATCH' || message.evt !== 'READY') return this._failed(connection);
        connection.ready = true;
        if (connection.closing || this._target()?.id !== connection.target.id) this._retire(connection);
        else this._activity(connection, false);
      } else if (connection.pending && message.nonce === connection.pending.nonce) {
        const pending = connection.pending; connection.pending = null;
        if (connection.timer) this.clearTimer(connection.timer); connection.timer = null;
        if (message.evt === 'ERROR' || message.cmd !== 'SET_ACTIVITY') return this._failed(connection);
        if (pending.clear) return this._finish(connection);
        this.failures = 0;
        if (connection.closing || this._target()?.id !== connection.target.id) this._retire(connection);
        else this._publish('connected');
      }
    }
  }
  _activity(connection, clear) {
    if (connection.pending || connection.closed) return;
    const nonce = randomUUID(); connection.pending = { nonce, clear };
    const activity = clear ? null : { type: 0, details: `Playing ${connection.target.name}`, state: 'Via Repo Company', timestamps: { start: connection.target.start }, instance: true };
    this._arm(connection, clear ? 1000 : 5000, () => this._failed(connection));
    this._write(connection, 1, { cmd: 'SET_ACTIVITY', args: { pid: this.pid, activity }, nonce });
  }
  _retire(connection) {
    if (connection.closed) return;
    if (!connection.ready) return this._finish(connection);
    if (!connection.closing) {
      connection.closing = true;
      // Never send a new game's presence before the old game's clear completes.
      // A pending SET_ACTIVITY is followed by its clear, with a bounded shutdown.
      if (connection.pending) this._arm(connection, 1000, () => this._finish(connection));
    }
    if (!connection.pending) this._activity(connection, true);
  }
  _destroy(connection) {
    connection.closed = true;
    if (connection.timer) this.clearTimer(connection.timer); connection.timer = null;
    connection.pending = null; connection.buffer = Buffer.alloc(0);
    if (this.connection === connection) this.connection = null;
    connection.socket?.destroy();
  }
  _finish(connection) { if (connection.closed) return; this._destroy(connection); this._reconcile(); }
  _failed(connection) {
    if (connection.closed) return;
    const wasReady = connection.ready, closing = connection.closing;
    this._destroy(connection);
    const target = this._target();
    if (closing || !target || target.id !== connection.target.id) return this._reconcile();
    if (!wasReady && connection.index + 1 < PIPE_COUNT) return this._dial(target, connection.index + 1);
    this._publish('unavailable');
    const delay = Math.min(30000, 2000 * (2 ** Math.min(this.failures++, 4)));
    this.retryTimer = this._later(() => { this.retryTimer = null; this._reconcile(); }, delay);
  }
}

module.exports = { DiscordPresence };
