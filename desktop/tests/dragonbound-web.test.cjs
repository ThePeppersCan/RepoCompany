'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const accountId = '11111111-2222-4333-8444-555555555555';
const otherAccountId = '66666666-2222-4333-8444-555555555555';
const gameOrigin = 'https://dragonbound.repocompany.uk';
const session = id => ({ data: { session: { user: { id }, access_token: 'TEST_ONLY_ACCESS', refresh_token: 'TEST_ONLY_REFRESH' } } });
const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture(getSession = async () => session(accountId)) {
  const ids = new Map(), posts = [], frames = [], timers = new Map();
  let nonce = 0, timerId = 0, sessionReads = 0;
  function target() {
    const listeners = new Map();
    return {
      addEventListener(name, callback) { const list = listeners.get(name) || []; list.push(callback); listeners.set(name, list); },
      removeEventListener(name, callback) { listeners.set(name, (listeners.get(name) || []).filter(item => item !== callback)); },
      dispatchEvent(event) { for (const callback of listeners.get(event.type) || []) callback(event); }
    };
  }
  function element(tag) {
    const classes = new Set(), children = new Map();
    const node = Object.assign(target(), {
      tagName: tag.toUpperCase(), hidden: false, src: '', dataset: {}, style: { setProperty() {} },
      classList: { add: (...values) => values.forEach(value => classes.add(value)), remove: (...values) => values.forEach(value => classes.delete(value)), contains: value => classes.has(value) },
      setAttribute(name, value) { this[name] = value; }, removeAttribute(name) { this[name] = ''; },
      appendChild(child) { if (child.id) ids.set(child.id, child); return child; },
      append(child) { return this.appendChild(child); },
      remove() { if (this.id) ids.delete(this.id); }, focus() {},
      querySelector(selector) {
        if (!children.has(selector)) children.set(selector, element(selector === 'iframe' ? 'iframe' : 'div'));
        return children.get(selector);
      }
    });
    if (tag === 'iframe') {
      node.contentWindow = { postMessage(message, origin) { posts.push({ message, origin, frame: node }); } };
      frames.push(node);
    }
    return node;
  }
  const document = Object.assign(target(), {
    head: element('head'), body: element('body'), createElement: element,
    getElementById: id => ids.get(id) || null,
    querySelector: selector => ids.get(selector.replace(/^#/, '')) || null,
    querySelectorAll: () => []
  });
  const window = Object.assign(target(), {
    crypto: { randomUUID: () => 'fixture-nonce-' + (++nonce) },
    setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    repoAccount: { state: { user: { id: accountId } } }
  });
  window.repoAccount.db = { auth: { async getSession() { sessionReads++; return getSession(); } } };
  window.repoSupabaseClient = window.repoAccount.db;
  const world = { window, document, location: new URL('https://repocompany.uk/#demos'), URL, URLSearchParams, Uint32Array, console, setTimeout: window.setTimeout, clearTimeout: window.clearTimeout, requestAnimationFrame: callback => callback() };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../game/dragonbound-web.js'), 'utf8'), world);
  function ready(frame, overrides = {}) {
    const bridge = new URL(frame.src).searchParams.get('repoBridge');
    window.dispatchEvent({ type: 'message', origin: gameOrigin, source: frame.contentWindow, data: { type: 'dragonbound-app-ready', bridge }, ...overrides });
  }
  function accountChanged(id) {
    window.repoAccount.state.user = id ? { id } : null;
    const event = { type: 'repo-account-state', detail: window.repoAccount.state };
    window.dispatchEvent(event); document.dispatchEvent(event);
  }
  return { window, document, frames, posts, ready, accountChanged, get sessionReads() { return sessionReads; }, launcher: window.DragonboundStandaloneLauncher };
}

test('Dragonbound auth requires the exact iframe, origin and per-launch nonce', async () => {
  const h = fixture(); h.launcher.open({ accountId });
  const frame = h.frames.at(-1), bridge = new URL(frame.src).searchParams.get('repoBridge');
  h.ready(frame, { origin: 'https://untrusted.example' });
  h.ready(frame, { source: {} });
  h.ready(frame, { data: { type: 'dragonbound-app-ready', bridge: 'wrong-nonce' } });
  await settle(); assert.equal(h.sessionReads, 0); assert.deepEqual(h.posts, []);
  h.ready(frame); await settle();
  assert.equal(h.sessionReads, 1); assert.equal(h.posts.length, 1);
  assert.equal(h.posts[0].frame, frame); assert.equal(h.posts[0].origin, gameOrigin);
  assert.equal(h.posts[0].message.bridge, bridge); assert.equal(h.posts[0].message.accessToken, 'TEST_ONLY_ACCESS');
  assert.equal(h.posts[0].message.refreshToken, 'TEST_ONLY_REFRESH');
});

test('a delayed Dragonbound session cannot send credentials after close, reopen or retry', async () => {
  for (const action of ['close', 'reopen', 'retry']) {
    let resolveSession;
    const h = fixture(() => new Promise(resolve => { resolveSession = resolve; }));
    h.launcher.open({ accountId }); const original = h.frames.at(-1);
    h.ready(original); assert.equal(typeof resolveSession, 'function');
    if (action === 'retry') h.document.getElementById('dragonboundStandaloneOverlay').querySelector('[data-dragonbound-retry]').dispatchEvent({ type: 'click' });
    else { h.launcher.close(); if (action === 'reopen') h.launcher.open({ accountId }); }
    resolveSession(session(accountId)); await settle();
    assert.deepEqual(h.posts, [], action + ' must invalidate the old frame/nonce handoff');
  }
});

test('account changes while the Dragonbound session is pending never forward stale credentials', async () => {
  for (const change of ['sign-out', 'switch-account', 'switch-back']) {
    let resolveSession;
    const h = fixture(() => new Promise(resolve => { resolveSession = resolve; }));
    h.launcher.open({ accountId }); h.ready(h.frames.at(-1));
    h.accountChanged(change === 'sign-out' ? null : otherAccountId);
    if (change === 'switch-back') h.accountChanged(accountId);
    resolveSession(session(accountId)); await settle();
    assert.equal(h.posts.some(post => post.message.accessToken || post.message.refreshToken), false, change);
  }
});

test('a session belonging to a different account is never sent to Dragonbound', async () => {
  const h = fixture(async () => session(otherAccountId));
  h.launcher.open({ accountId }); h.ready(h.frames.at(-1)); await settle();
  assert.equal(h.sessionReads, 1);
  assert.equal(h.posts.some(post => post.message.accessToken || post.message.refreshToken), false);
});
