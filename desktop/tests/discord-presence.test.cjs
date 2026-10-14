'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { DiscordPresence } = require('../lib/discord-presence.cjs');
const applications = { morogue: { clientId: '123456789012345678', name: 'Morogue' }, moratales: { clientId: '234567890123456789', name: 'Moratales' } };

function frame(opcode, value) {
  const body = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value));
  const header = Buffer.alloc(8); header.writeUInt32LE(opcode, 0); header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}
class Clock {
  constructor() { this.now = 1700000000000; this.timers = new Set(); }
  set = (fn, delay) => {
    const timer = { fn, at: this.now + delay, unreferenced: false, unref() { this.unreferenced = true; } };
    this.timers.add(timer); return timer;
  };
  clear = timer => this.timers.delete(timer);
  tick(ms) {
    const until = this.now + ms; let steps = 0;
    while (true) {
      const next = [...this.timers].filter(t => t.at <= until).sort((a, b) => a.at - b.at)[0];
      if (!next) break;
      assert.ok(++steps < 1000, 'bounded timer work'); this.now = next.at; this.timers.delete(next); next.fn();
    }
    this.now = until;
  }
}
class Pipe extends EventEmitter {
  constructor(path) { super(); this.path = path; this.writes = []; this.destroyed = false; this.writableLength = 0; }
  unref() { this.unreferenced = true; }
  write(data) { assert.ok(Buffer.isBuffer(data)); this.writes.push(Buffer.from(data)); return true; }
  destroy() { if (this.destroyed) return; this.destroyed = true; this.emit('close'); }
  messages() { return this.writes.map(data => ({ opcode: data.readUInt32LE(0), length: data.readUInt32LE(4), body: JSON.parse(data.subarray(8).toString()) })); }
  receive(opcode, value) { this.emit('data', frame(opcode, value)); }
  ready() { this.emit('connect'); this.receive(1, { cmd: 'DISPATCH', evt: 'READY', data: { user: { id: 'private-user', username: 'private-name' } } }); }
  ack(error = false) {
    const command = this.messages().filter(m => m.opcode === 1).at(-1).body;
    this.receive(1, { cmd: command.cmd, nonce: command.nonce, evt: error ? 'ERROR' : null, data: error ? { message: 'private Discord error' } : {} });
  }
}
function setup(options = {}) {
  const clock = new Clock(), pipes = [], events = [];
  const presence = new DiscordPresence({ applications, ...options }, {
    connect: ({ path }) => { const pipe = new Pipe(path); pipes.push(pipe); return pipe; },
    setTimeout: clock.set, clearTimeout: clock.clear, now: () => clock.now, platform: 'win32', pid: 7654
  });
  presence.on('change', state => events.push(state));
  return { presence, clock, pipes, events };
}

test('no IPC is opened for idle, disabled, unconfigured, public keys or unsafe numeric IDs', () => {
  const h = setup({ enabled: false }); h.presence.gameStarted('morogue'); assert.equal(h.pipes.length, 0);
  h.presence.setEnabled(true); assert.equal(h.pipes.length, 1); h.presence.dispose();
  for (const clientId of ['a'.repeat(64), '0', '18446744073709551616', 123456789012345678, null]) {
    const x = setup({ applications: { morogue: { clientId } } }); x.presence.gameStarted('morogue');
    assert.equal(x.presence.snapshot().status, 'unconfigured'); assert.equal(x.pipes.length, 0); x.presence.dispose();
  }
  const x = setup(); x.presence.gameStarted('unknown'); assert.equal(x.pipes.length, 0); x.presence.dispose();
});

test('official little-endian handshake precedes activity, with no user token or data exposure', () => {
  const h = setup(); h.presence.gameStarted('morogue'); const pipe = h.pipes[0];
  assert.equal(pipe.path, '\\\\?\\pipe\\discord-ipc-0'); assert.equal(pipe.unreferenced, true);
  pipe.emit('connect'); assert.deepEqual(pipe.messages(), [{ opcode: 0, length: 40, body: { v: 1, client_id: applications.morogue.clientId } }]);
  pipe.receive(1, { cmd: 'DISPATCH', evt: 'READY', data: { user: { username: 'private-name' } } });
  const command = pipe.messages()[1].body;
  assert.equal(command.cmd, 'SET_ACTIVITY'); assert.equal(command.args.pid, 7654);
  assert.deepEqual(command.args.activity, { type: 0, details: 'Playing Morogue', state: 'Via Repo Company', timestamps: { start: 1700000000 }, instance: true });
  assert.equal(h.presence.snapshot().status, 'connecting'); pipe.ack(); assert.equal(h.presence.snapshot().status, 'connected');
  assert.ok(!JSON.stringify(h.events).includes('private-name')); assert.ok(!JSON.stringify(pipe.messages()).includes('token'));
  assert.ok(pipe.writes.every(b => b.length === b.readUInt32LE(4) + 8)); h.presence.dispose(); pipe.ack();
});

test('fragmented READY and coalesced frames are parsed; PING receives an exact PONG', () => {
  const h = setup(); h.presence.gameStarted('morogue'); const pipe = h.pipes[0]; pipe.emit('connect');
  const ready = frame(1, { cmd: 'DISPATCH', evt: 'READY' });
  pipe.emit('data', ready.subarray(0, 3)); pipe.emit('data', ready.subarray(3, 11)); assert.equal(pipe.writes.length, 1);
  pipe.emit('data', ready.subarray(11)); const nonce = pipe.messages().at(-1).body.nonce;
  const ping = Buffer.from([0, 1, 255, 123]);
  pipe.emit('data', Buffer.concat([frame(3, ping), frame(1, { cmd: 'SET_ACTIVITY', nonce, evt: null })]));
  const pong = pipe.writes.at(-1); assert.equal(pong.readUInt32LE(0), 4); assert.deepEqual(pong.subarray(8), ping);
  assert.equal(h.presence.snapshot().status, 'connected'); h.presence.dispose();
});

test('most recent game focus switches application after clearing, with original play timestamp', () => {
  const h = setup(); h.presence.gameStarted('morogue'); const a = h.pipes[0]; a.ready(); a.ack();
  h.clock.tick(5000); h.presence.gameStarted('moratales');
  assert.equal(a.messages().at(-1).body.args.activity, null); assert.equal(h.pipes.length, 1);
  a.ack(); const b = h.pipes[1]; b.ready(); b.ack(); assert.equal(b.messages()[0].body.client_id, applications.moratales.clientId);
  h.presence.gameFocused('morogue'); b.ack(); const c = h.pipes[2]; c.ready(); c.ack();
  assert.equal(c.messages()[1].body.args.activity.timestamps.start, 1700000000);
  h.presence.gameStopped('morogue'); c.ack(); const d = h.pipes[3]; d.ready(); d.ack();
  assert.equal(h.presence.snapshot().gameId, 'moratales');
  h.presence.gameStopped('moratales'); d.ack(); assert.equal(h.presence.snapshot().status, 'idle');
  assert.equal(h.clock.timers.size, 0); h.presence.dispose();
});

test('duplicate start/focus calls do not reset elapsed time or flood activity messages', () => {
  const h = setup(); h.presence.gameStarted('morogue'); const pipe = h.pipes[0]; pipe.ready(); pipe.ack();
  for (let i = 0; i < 20; i++) { h.presence.gameStarted('morogue'); h.presence.gameFocused('morogue'); }
  assert.equal(pipe.writes.length, 2); assert.equal(h.pipes.length, 1); h.presence.dispose(); pipe.ack();
});

test('close during pending activity waits for acknowledgement then clears before another game', () => {
  const h = setup(); h.presence.gameStarted('morogue'); const a = h.pipes[0]; a.ready();
  h.presence.gameStarted('moratales'); assert.equal(a.writes.length, 2); assert.equal(h.pipes.length, 1);
  a.ack(); assert.equal(a.messages().at(-1).body.args.activity, null); assert.equal(h.pipes.length, 1);
  a.ack(); assert.equal(a.destroyed, true); assert.equal(h.pipes.length, 2);
  h.presence.gameStopped('moratales'); h.presence.gameStopped('morogue'); h.presence.dispose();
});

test('rapid focus changes while retiring only publish the latest selected game', () => {
  const h = setup(); h.presence.gameStarted('morogue'); const a = h.pipes[0]; a.ready(); a.ack();
  h.presence.gameStarted('moratales'); h.presence.gameFocused('morogue'); a.ack();
  const b = h.pipes[1]; b.ready(); b.ack(); assert.equal(b.messages()[0].body.client_id, applications.morogue.clientId);
  h.presence.dispose(); b.ack();
});

test('Discord pipe scan is bounded, retries are unreferenced and reopening restores active game', () => {
  const h = setup(); h.presence.gameStarted('morogue');
  for (let i = 0; i < 10; i++) { assert.ok(h.pipes[i].path.endsWith('discord-ipc-' + i)); h.pipes[i].emit('error', new Error('ENOENT')); }
  assert.equal(h.presence.snapshot().status, 'unavailable'); assert.equal(h.pipes.length, 10);
  assert.ok([...h.clock.timers].every(t => t.unreferenced)); h.clock.tick(1999); assert.equal(h.pipes.length, 10);
  h.clock.tick(1); const restored = h.pipes[10]; restored.ready(); restored.ack(); assert.equal(h.presence.snapshot().status, 'connected');
  restored.destroy(); assert.equal(h.presence.snapshot().status, 'unavailable'); h.clock.tick(2000);
  const next = h.pipes[11]; next.ready(); next.ack(); h.presence.dispose(); next.ack(); assert.equal(h.clock.timers.size, 0);
});

test('handshake and command acknowledgement timeouts cannot leave a stalled connection', () => {
  const h = setup(); h.presence.gameStarted('morogue'); h.clock.tick(25000);
  assert.equal(h.pipes.length, 10); assert.ok(h.pipes.every(p => p.destroyed));
  h.clock.tick(2000); const pipe = h.pipes[10]; pipe.ready(); h.clock.tick(5000);
  assert.equal(pipe.destroyed, true); assert.equal(h.presence.snapshot().status, 'unavailable'); h.presence.dispose();
  assert.equal(h.clock.timers.size, 0);
});

test('oversized, malformed and unknown frames disconnect without leaking their data', () => {
  const huge = Buffer.alloc(8); huge.writeUInt32LE(1, 0); huge.writeUInt32LE(65537, 4);
  for (const data of [huge, frame(99, {}), frame(1, Buffer.from('{bad')), frame(1, null), Buffer.alloc(131089)]) {
    const h = setup(); h.presence.gameStarted('morogue'); const pipe = h.pipes[0]; pipe.ready(); pipe.ack();
    pipe.emit('data', data); assert.equal(pipe.destroyed, true); assert.equal(h.presence.snapshot().status, 'unavailable'); h.presence.dispose();
  }
});

test('only matching acknowledgement marks activity connected and errors remain public-status-only', () => {
  const h = setup(); h.presence.gameStarted('morogue'); const pipe = h.pipes[0]; pipe.ready();
  pipe.receive(1, { cmd: 'SET_ACTIVITY', nonce: 'not-current', data: { user: 'private' } });
  assert.equal(h.presence.snapshot().status, 'connecting'); pipe.ack(true);
  assert.equal(h.presence.snapshot().status, 'unavailable'); assert.ok(!JSON.stringify(h.events).includes('private')); h.presence.dispose();
});

test('disable and dispose clear once, bound a silent peer, and ignore late events', () => {
  for (const action of ['disable', 'dispose']) {
    const h = setup(); h.presence.gameStarted('morogue'); const pipe = h.pipes[0]; pipe.ready(); pipe.ack();
    if (action === 'disable') h.presence.setEnabled(false); else h.presence.dispose();
    assert.equal(pipe.messages().at(-1).body.args.activity, null); const count = pipe.writes.length;
    h.presence.setEnabled(false); h.clock.tick(1000); assert.equal(pipe.destroyed, true); assert.equal(pipe.writes.length, count);
    pipe.receive(1, { cmd: 'DISPATCH', evt: 'READY' }); pipe.emit('error', new Error('late'));
    h.clock.tick(60000); assert.equal(h.pipes.length, 1); assert.equal(h.clock.timers.size, 0);
    if (action === 'dispose') { h.presence.setEnabled(true); h.presence.gameStarted('moratales'); assert.equal(h.pipes.length, 1); }
    h.presence.dispose();
  }
});
