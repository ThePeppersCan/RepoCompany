'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function preload({ rootReady = true } = {}) {
  const handlers = new Map(), events = [], observers = [];
  const document = { documentElement: rootReady ? { dataset: {} } : null, readyState: 'loading', addEventListener() {} };
  const context = vm.createContext({
    process: { isMainFrame: true }, location: { origin: 'https://repocompany.uk' }, document,
    require: () => ({ ipcRenderer: { on: (name, handler) => handlers.set(name, handler), invoke() { throw Error('No native mutation is needed to publish initial visibility.'); } } }),
    addEventListener() {}, dispatchEvent: event => events.push(event),
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    MutationObserver: class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } },
    setTimeout: () => 1, clearTimeout() {}
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../portal-preload.cjs'), 'utf8'), context);
  return { document, handlers, events, observers };
}

test('isolated preload starts hidden before website scripts and relays only explicit native boolean visibility', () => {
  const h = preload();
  assert.equal(h.document.documentElement.dataset.repoLauncher, 'true');
  assert.equal(h.document.documentElement.dataset.repoPortalVisible, 'false');
  h.handlers.get('launcher:portal-visibility')({}, true);
  h.handlers.get('launcher:portal-visibility')({}, true);
  h.handlers.get('launcher:portal-visibility')({}, 'true');
  h.handlers.get('launcher:portal-visibility')({}, { visible: false });
  assert.equal(h.document.documentElement.dataset.repoPortalVisible, 'true');
  h.handlers.get('launcher:state')({}, { portalVisible: false });
  assert.deepEqual(h.events.map(event => [event.type, event.detail.visible]), [
    ['repo-launcher-portal-visibility', false], ['repo-launcher-portal-visibility', true], ['repo-launcher-portal-visibility', false]
  ]);
});

test('the initial visibility marker is installed when the parser creates html, without waiting for DOMContentLoaded', () => {
  const h = preload({ rootReady: false });
  assert.equal(h.events.length, 0); assert.equal(h.observers.length, 1);
  h.document.documentElement = { dataset: {} }; h.observers[0].callback();
  assert.equal(h.document.documentElement.dataset.repoPortalVisible, 'false');
  assert.equal(h.document.documentElement.dataset.repoLauncher, 'true');
  assert.equal(h.observers[0].disconnected, true);
  assert.equal(h.events[0].detail.visible, false);
});
