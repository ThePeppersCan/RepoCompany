'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const accountId = '11111111-2222-4333-8444-555555555555';
const otherId = '66666666-2222-4333-8444-555555555555';
const key = 'moratales-vampire-survivor-v1';
const character = { id: 'slot-1', name: 'Mora Test', look: { name: 'Mora Test', skin: 'warm', hair: 'short' } };
const nextTurn = () => new Promise(resolve => setImmediate(resolve));

function fixture({ selected = 'survivor', characters = [character] } = {}) {
  const events = new EventTarget(), timers = new Map(), frames = [], requests = [], imports = [];
  const underlying = new Map([
    ['moratales-save-slots-v1', 'original Moratales save'],
    [key, 'unscoped other player record'],
    ['repo-launcher-account-v1:' + otherId + ':' + key, 'another launcher account'],
    ['repo-launcher-account-v1:' + accountId + ':' + key, JSON.stringify({ character: { name: 'Old local survivor' }, selectedCharacter: selected, coins: 75 })]
  ]);
  const storage = { getItem: name => underlying.get(name) ?? null, setItem: (name, value) => underlying.set(name, String(value)), removeItem: name => underlying.delete(name), key: index => [...underlying.keys()][index] ?? null, get length() { return underlying.size; } };
  const controls = { account: accountId, envelope: { userId: accountId, revision: 3, characters, updatedAt: '2026-10-15T10:00:00Z' }, error: null, hold: null };
  let timerId = 0;
  const root = {
    Event, CustomEvent, crypto: { randomUUID }, localStorage: storage,
    REPO_LAUNCHER_CONTEXT: { accountId },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events),
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; }, clearTimeout(id) { timers.delete(id); }
  };
  function deliver(frame, data, result, error) {
    const event = new Event('message');
    Object.assign(event, { origin: 'https://repocompany.uk', source: frame.contentWindow, data: { channel: data.channel, nonce: data.nonce, id: data.id, result, error } });
    root.dispatchEvent(event);
  }
  root.document = {
    createElement(tag) {
      assert.equal(tag, 'iframe');
      const frame = { remove() { this.removed = true; } };
      frame.contentWindow = { postMessage(data, origin) {
        assert.equal(origin, 'https://repocompany.uk'); requests.push(data);
        queueMicrotask(() => {
          if (data.action === 'characters') {
            if (controls.hold) controls.hold(() => deliver(frame, data, controls.envelope, controls.error));
            else deliver(frame, data, controls.envelope, controls.error);
          } else deliver(frame, data, data.action === 'session' ? { access_token: 'FIXTURE_TOKEN', user: { id: controls.account } } : true);
        });
      } };
      frames.push(frame); return frame;
    },
    body: { append(frame) { queueMicrotask(() => frame.onload()); } }
  };
  function read(s) { return { data: JSON.parse(s.getItem(key) || '{}') }; }
  function write(s, update) { s.setItem(key, JSON.stringify({ ...read(s).data, ...update })); }
  root.MORATALES_SURVIVOR_SAVES = { read, write, importCharacters(s, values) { imports.push(values); write(s, { cafeCharacters: values }); return values; } };
  const context = vm.createContext(root);
  for (const filename of ['account-storage.js', 'morogue-site-bridge.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../game', filename), 'utf8'), context);
  return { root, controls, frames, requests, imports, underlying, timers, bridge: root.MOROGUE_SITE_BRIDGE, read: () => read(root.localStorage).data, dispose: () => root.dispatchEvent(new Event('pagehide')) };
}

test('shared characters are verified, account-scoped and selected ahead of an old local survivor', async () => {
  const f = fixture(); await f.bridge.characters;
  assert.equal(f.bridge.characterState, 'ready'); assert.equal(f.imports.length, 1);
  assert.equal(f.read().selectedCharacter, 'cafe-slot-1'); assert.equal(f.read().coins, 75); assert.equal(f.read().character.name, 'Old local survivor');
  assert.equal(f.read().cafeCharacters[0].name, 'Mora Test');
  assert.equal(f.underlying.get('moratales-save-slots-v1'), 'original Moratales save');
  assert.equal(f.underlying.get(key), 'unscoped other player record');
  assert.equal(f.underlying.get('repo-launcher-account-v1:' + otherId + ':' + key), 'another launcher account');
  assert.equal(f.frames.length, 1); assert.equal(f.frames[0].src, 'https://repocompany.uk/morogue-account-bridge.html');
  assert.equal(f.requests.find(item => item.action === 'characters').payload.userId, accountId);
  await f.bridge.retryCharacters(); assert.equal(f.imports.length, 1, 'reconnect does not replace character selection during a run');
  f.dispose();
});

test('an existing selected cloud character is preserved when it is still in the shared list', async () => {
  const f = fixture({ selected: 'cafe-current', characters: [character, { ...character, id: 'current' }] });
  await f.bridge.characters; assert.equal(f.read().selectedCharacter, 'cafe-current'); f.dispose();
});

test('empty shared characters and outages keep startup pending and allow an explicit retry', async () => {
  for (const failure of ['empty', 'outage']) {
    const f = fixture({ characters: failure === 'empty' ? [] : [character] });
    if (failure === 'outage') f.controls.error = 'Service unavailable';
    let ready = false; f.bridge.characters.then(() => { ready = true; });
    await nextTurn(); assert.equal(ready, false); assert.equal(f.imports.length, 0);
    await assert.rejects(f.bridge.retryCharacters(), error => error.gateReason === (failure === 'empty' ? 'characters-empty' : 'characters'));
    f.controls.error = null; f.controls.envelope.characters = [character];
    const first = f.bridge.retryCharacters(), second = f.bridge.retryCharacters(); assert.equal(first, second);
    await first; await f.bridge.characters; assert.equal(ready, true); assert.equal(f.imports.length, 1); f.dispose();
  }
});

test('wrong account responses and mid-request account switches never import characters', async () => {
  for (const failure of ['envelope', 'session']) {
    const f = fixture(); let release;
    f.controls.hold = callback => { release = callback; };
    await nextTurn();
    if (failure === 'envelope') f.controls.envelope.userId = otherId;
    else f.controls.account = otherId;
    const pending = f.bridge.retryCharacters(); release();
    await assert.rejects(pending, error => error.gateReason === 'account');
    assert.equal(f.imports.length, 0); assert.equal(f.read().selectedCharacter, 'survivor'); f.dispose();
  }
});

test('a timed-out or closed character request cannot import after its late response', async () => {
  for (const failure of ['timeout', 'close']) {
    const f = fixture(); let release;
    f.controls.hold = callback => { release = callback; }; await nextTurn();
    const pending = f.bridge.retryCharacters();
    if (failure === 'timeout') [...f.timers.values()].find(timer => timer.delay === 20000).callback();
    else f.dispose();
    await assert.rejects(pending);
    release(); await nextTurn(); assert.equal(f.imports.length, 0);
    f.dispose(); assert.equal(f.frames[0].removed, true);
  }
});
