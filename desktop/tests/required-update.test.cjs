'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { RequiredUpdate } = require('../lib/required-update.cjs');
function fixture(options = {}) {
  const timers = [], events = [];
  const gate = new RequiredUpdate({ enabled: true, now: () => 1000, prepare: async () => events.push('saved'), restart: () => events.push('restart'), setTimer(fn, delay) { const timer = { fn, delay }; timers.push(timer); return timer; }, clearTimer(timer) { timer.cancelled = true; }, ...options });
  return { gate, timers, events };
}
test('startup requires a verified current release, including offline/unconfigured failures', () => {
  const { gate } = fixture(); assert.equal(gate.snapshot().locked, true);
  for (const status of ['checking', 'error', 'unconfigured']) { gate.observe({ status }); assert.equal(gate.snapshot().locked, true); }
  gate.observe({ status: 'current' }); assert.equal(gate.snapshot().locked, false);
  gate.observe({ status: 'checking' }); assert.equal(gate.snapshot().locked, false);
  gate.observe({ status: 'error' }); assert.equal(gate.snapshot().locked, false);
});
test('known newer release stays locked after failures, retries and stale current events', () => {
  const { gate } = fixture(); gate.observe({ status: 'current' });
  for (const status of ['downloading', 'error', 'checking', 'current', 'verifying']) { gate.observe({ status, version: '0.1.10' }); assert.equal(gate.snapshot().locked, true); }
});
test('one native deadline survives repeated ready events and restarts only after saving', async () => {
  let saved; const events = [];
  const { gate, timers } = fixture({ prepare: () => new Promise(resolve => { saved = () => { events.push('saved'); resolve(); }; }), restart: () => events.push('restart') });
  gate.observe({ status: 'ready', version: '0.1.10' }); gate.observe({ status: 'ready', version: '0.1.10' });
  assert.equal(timers.length, 1); assert.equal(timers[0].delay, 10000); assert.equal(gate.snapshot().restartAt, 11000);
  timers[0].fn(); await Promise.resolve(); assert.equal(gate.snapshot().phase, 'saving'); assert.deepEqual(events, []);
  const pending = gate.install(); saved(); await pending;
  assert.deepEqual(events, ['saved', 'restart']); assert.equal(gate.snapshot().phase, 'restarting');
});
test('save failure remains locked and explicit retry cannot create concurrent save/restarts', async () => {
  let attempts = 0, restarts = 0;
  const { gate, timers } = fixture({ prepare: async () => { if (++attempts === 1) throw Error('Disk full'); }, restart: () => restarts++ });
  gate.observe({ status: 'ready' }); timers[0].fn(); await gate.pending;
  assert.equal(restarts, 0); assert.equal(gate.snapshot().phase, 'save-error'); assert.equal(gate.snapshot().locked, true);
  gate.observe({ status: 'ready' }); assert.equal(timers.length, 1);
  const retry = gate.install(); assert.equal(retry, gate.install()); await retry; assert.equal(restarts, 1);
});
test('development and disposed gates never schedule an installer', async () => {
  const dev = fixture({ enabled: false }); dev.gate.observe({ status: 'ready' }); assert.equal(dev.gate.state.locked, false); assert.equal(dev.timers.length, 0);
  const { gate, timers, events } = fixture(); gate.observe({ status: 'ready' }); gate.dispose(); timers[0].fn(); await gate.install(); assert.deepEqual(events, []); assert.equal(timers[0].cancelled, true);
});
