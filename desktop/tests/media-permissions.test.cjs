'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { configureMediaPermissions } = require('../lib/media-permissions.cjs');
function setup() {
  const handlers = {}, session = { setPermissionCheckHandler(fn) { handlers.check = fn; }, setPermissionRequestHandler(fn) { handlers.request = fn; } };
  let account = { identity: 'alice', state: { status: 'online' } }, resolve;
  const portal = { getURL: () => 'https://repocompany.uk/', isDestroyed: () => false }, window = { isDestroyed: () => false };
  let prompts = 0;
  const controller = configureMediaPermissions(session, { getPortal: () => portal, getAccount: () => account, getWindow: () => window, isPortalUrl: value => new URL(value).origin === 'https://repocompany.uk', dialog: { showMessageBox() { prompts++; return new Promise(r => { resolve = r; }); } } });
  const details = { isMainFrame: true, requestingUrl: 'https://repocompany.uk/', mediaTypes: ['audio'] };
  return { handlers, portal, window, details, controller, get prompts() { return prompts; }, setAccount(value) { account = value; }, answer(response) { resolve({ response }); }, request(permission = 'media', override = {}, contents = portal) { return new Promise(r => handlers.request(contents, permission, r, { ...details, ...override })); } };
}
const tick = () => new Promise(r => setImmediate(r));
test('only a verified portal main frame can ask for microphone/camera, all other access is denied', async () => {
  const f = setup();
  for (const permission of ['display-capture', 'notifications', 'geolocation', 'clipboard-read']) assert.equal(await f.request(permission), false);
  for (const details of [{ isMainFrame: false }, { isMainFrame: undefined }, { requestingUrl: 'https://morogue.repocompany.uk/' }, { mediaTypes: ['display'] }, { mediaTypes: [] }]) assert.equal(await f.request('media', details), false);
  assert.equal(await f.request('media', {}, { ...f.portal }), false);
  assert.equal(f.prompts, 0);
});
test('device approval is explicit, per account and device; sign-out revokes the permission check', async () => {
  const f = setup(), check = type => f.handlers.check(f.portal, 'media', 'https://repocompany.uk', { ...f.details, mediaType: type });
  assert.equal(check('audio'), false);
  const first = f.request(); await tick(); f.answer(1); assert.equal(await first, true); await tick();
  assert.equal(check('audio'), true); assert.equal(check('video'), false);
  assert.equal(await f.request(), true);
  const camera = f.request('media', { mediaTypes: ['video'] }); await tick(); f.answer(0); assert.equal(await camera, false); await tick();
  assert.equal(check('video'), false);
  f.setAccount({ identity: 'bob', state: { status: 'online' } }); assert.equal(check('audio'), false);
  f.setAccount({ identity: null, state: { status: 'signed-out' } }); assert.equal(await f.request(), false);
});
test('navigation or account changes during a device prompt cannot grant stale access', async () => {
  const f = setup(), requested = f.request(); await tick();
  f.controller.reset(); f.answer(1); assert.equal(await requested, false); await tick();
  const next = f.request(); await tick(); f.setAccount({ identity: 'bob', state: { status: 'online' } }); f.answer(1); assert.equal(await next, false); await tick();
  f.controller.dispose(); assert.equal(await f.request(), false);
});
