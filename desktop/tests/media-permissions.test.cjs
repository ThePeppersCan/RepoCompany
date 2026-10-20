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
test('fullscreen is available only in the signed-in portal main frame',async()=>{
 const f=setup();assert.equal(await f.request('fullscreen'),true);
 assert.equal(f.handlers.check(f.portal,'fullscreen','https://repocompany.uk',f.details),true);
 assert.equal(await f.request('fullscreen',{isMainFrame:false}),false);
 assert.equal(await f.request('fullscreen',{requestingUrl:'https://other.example'}),false);
 assert.equal(await f.request('fullscreen',{}, {...f.portal}),false);
 f.setAccount({identity:null,state:{status:'signed-out'}});assert.equal(await f.request('fullscreen'),false);
});
test('speaker selection is explicit and isolated from capture, games, frames and account changes',async()=>{
  const f=setup(),check=()=>f.handlers.check(f.portal,'speaker-selection','https://repocompany.uk',f.details);
  assert.equal(check(),false);
  assert.equal(await f.request('speaker-selection',{isMainFrame:false}),false);
  assert.equal(await f.request('speaker-selection',{requestingUrl:'https://morogue.repocompany.uk/'}),false);
  assert.equal(await f.request('speaker-selection',{}, {...f.portal}),false);
  const selection=f.request('speaker-selection');await tick();f.answer(1);assert.equal(await selection,true);await tick();
  assert.equal(check(),true);assert.equal(f.handlers.check(f.portal,'media','https://repocompany.uk',{...f.details,mediaType:'audio'}),false);
  f.controller.reset();assert.equal(check(),false);
  const pending=f.request('speaker-selection');await tick();f.setAccount({identity:null,state:{status:'signed-out'}});f.answer(1);assert.equal(await pending,false);await tick();
  assert.equal(await f.request('speaker-selection'),false);
});
test('only a verified portal main frame can ask for microphone/camera, all other access is denied', async () => {
  const f = setup();
  for (const permission of ['pointerLock', 'display-capture', 'notifications', 'geolocation', 'clipboard-read']) assert.equal(await f.request(permission), false);
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

test('mouse capture delegates both permission paths to the current demo without granting device access', () => {
  const handlers = {}, contents = {}, details = { isMainFrame: false, requestingUrl: 'https://repocompany.uk/repo-runners/?embedded=1' };
  let active = true;
  const controller = configureMediaPermissions({ setPermissionCheckHandler(fn) { handlers.check=fn; }, setPermissionRequestHandler(fn) { handlers.request=fn; } }, {
    getPortal: () => null, getAccount: () => null, getWindow: () => null, isPortalUrl: () => false,
    canUseGamePointer: (sender, frame, origin) => active && sender === contents && frame === details && (!origin || origin === 'https://repocompany.uk')
  });
  const request = permission => { let allowed; handlers.request(contents, permission, result => { allowed=result; }, details); return allowed; };
  assert.equal(handlers.check(contents, 'pointerLock', 'https://repocompany.uk', details), true);
  assert.equal(request('pointerLock'), true);
  assert.equal(request('media'), false); assert.equal(request('display-capture'), false);
  active=false;
  assert.equal(handlers.check(contents, 'pointerLock', 'https://repocompany.uk', details), false);
  assert.equal(request('pointerLock'), false);
  active=true; controller.dispose(); assert.equal(request('pointerLock'), false);
});
