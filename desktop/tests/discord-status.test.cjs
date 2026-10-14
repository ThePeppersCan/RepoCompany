'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
// Load the actual isolated preload without initializing any website or IPC.
const context = vm.createContext({ process: { isMainFrame: false }, require: name => { assert.equal(name, 'electron'); return { ipcRenderer: {} }; } });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../portal-preload.cjs'), 'utf8'), context);
const status = (value, enabled = true) => context.discordStatusText(value, enabled);

test('idle invites a game launch while an ACK describes acceptance without claiming visibility', () => {
  assert.match(status({ status: 'idle' }), /^Launch a game/);
  assert.match(status({ status: 'connected' }), /Discord accepted/);
  assert.match(status({ status: 'connected' }), /Privacy settings control/);
  assert.doesNotMatch(status({ status: 'connected' }), /is shared/);
  assert.match(status({ status: 'connected' }, false), /is off/);
});

test('settings explain actual connection failure classes and never echo arbitrary diagnostics', () => {
  const unavailable = (reason, code) => status({ status: 'unavailable', reason, code });
  assert.match(unavailable('pipe-not-found'), /was not found/);
  assert.match(unavailable('pipe-access-denied'), /Windows blocked/);
  assert.match(unavailable('handshake-rejected', 4000), /rejected the game connection \(code 4000\)/);
  assert.match(unavailable('activity-rejected', 4002), /rejected the game activity \(code 4002\)/);
  assert.match(unavailable('activity-timeout'), /too long/);
  assert.match(unavailable('discord-closed'), /closed the connection/);
  assert.doesNotMatch(unavailable('private payload', 'private token'), /private/);
  assert.doesNotMatch(unavailable('activity-rejected', 999999999), /999999999/);
});
