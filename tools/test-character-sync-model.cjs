'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const Link = require('../game-integrations/moratales/character-sync-assets/interface/moratales-character-link.js'), Saves = require('../game-integrations/moratales/character-sync-assets/interface/vampire-survivor/characters.js');
const A = '11111111-2222-4333-8444-555555555555', B = '66666666-7777-4888-8999-aaaaaaaaaaaa';
const source = fs.readFileSync(path.join(__dirname, '../game-integrations/moratales/character-sync-assets/interface/moratales-account-characters.js'), 'utf8');
const bridgeSource = fs.readFileSync(path.join(__dirname, '../game-integrations/moratales/character-sync-assets/interface/vampire-survivor/character-bridge.js'), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const look = name => ({ name, skin: 'honey', hair: 'f14', shirt: 'shirt_linen' });
const character = (id, name) => ({ id, name, look: look(name) });
function storage() {
  const data = new Map([
    ['hearthfolk-appearance-v7', JSON.stringify(look('Nora'))], ['velmora-cafe', '{"till":321,"story":"untouched"}'],
    ['moratales-save-slots-v1', JSON.stringify({ version: 1, active: 0, slots: [{ entries: { 'hearthfolk-appearance-v7': JSON.stringify(look('Nora')) } }, { entries: { 'hearthfolk-appearance-v7': JSON.stringify(look('Ben')) } }, null] })]
  ]);
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
}
function linked() {
  const store = storage();
  Link.link(store, { userId: A, revision: 1, ids: ['slot-0'], characters: [character('slot-0', 'Nora'), character('slot-1', 'Other cloud character')] });
  return store;
}
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
function autoHarness(store = linked()) {
  const handlers = {}, documentHandlers = {}, messages = [], intervals = new Map(), timeouts = new Map(), statuses = [];
  let frame, next = 0;
  const context = { MORATALES_CHARACTER_LINK: Link, location: { origin: 'https://moratales.repocompany.uk' }, localStorage: store, crypto: { randomUUID: () => String(++next) }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    addEventListener: (type, callback) => { handlers[type] = callback; }, dispatchEvent: event => statuses.push(event.detail.status),
    setTimeout: callback => { const id = ++next; timeouts.set(id, callback); return id; }, clearTimeout: id => timeouts.delete(id), setInterval: callback => { const id = ++next; intervals.set(id, callback); return id; }, clearInterval: id => intervals.delete(id),
    document: { hidden: false, addEventListener: (type, callback) => { documentHandlers[type] = callback; }, createElement: () => (frame = { contentWindow: { postMessage(message, origin) { assert.equal(origin, 'https://repocompany.uk'); messages.push(message); } } }), body: { append() {} } }
  };
  const sandbox = vm.createContext(context); vm.runInContext('parent=globalThis;', sandbox); vm.runInContext(source, sandbox);
  const reply = (request, result, error) => handlers.message({ source: frame.contentWindow, origin: 'https://repocompany.uk', data: { channel: request.channel, nonce: request.nonce, id: request.id, ...(error ? { error: 'Conflict', code: error } : { result }) } });
  return { store, context, messages, statuses, handlers, intervals, timeouts, get frame() { return frame; }, reply,
    request: action => messages.filter(message => message.action === action).at(-1),
    async start() { const loading = frame.onload(); reply(messages[0], true); await loading; await flush(); },
    changed() { const request = messages[0]; handlers.message({ source: frame.contentWindow, origin: 'https://repocompany.uk', data: { channel: request.channel, nonce: request.nonce, event: 'changed' } }); }
  };
}
(async () => {
  let store=storage(),cloud={userId:A,revision:0,characters:[]};
  const originals=new Map(store.data);let plan=Link.prepare(store,cloud);
  assert.equal(plan.changed,true);assert.equal(Link.read(store).userId,A,'first verified account claims unowned local characters before upload');
  assert.deepEqual(plan.characters.map(c=>c.name),['Nora','Ben']);assert.equal(Link.prepare(store,{...cloud,userId:B}).status,'account');
  Link.acknowledge(store,plan,{...cloud,revision:1,characters:plan.characters});
  assert.equal(Link.prepare(store,{userId:A,revision:1,characters:plan.characters}).changed,false);
  assert.deepEqual(new Map([...store.data].filter(([key])=>key!==Link.KEY)),originals,'automatic sync never writes full saves');
  const remote={userId:A,revision:2,characters:[character('slot-0','Remote Nora'),character('slot-1','Ben'),character('slot-2','Cloud only')]};
  plan=Link.prepare(store,remote);assert.equal(plan.changed,false,'unchanged browser must preserve remote updates');Link.acknowledge(store,plan,remote);
  assert.equal(Link.prepare(store,remote).changed,false,'acknowledging remote changes must not make old local data look freshly edited');
  store.setItem('hearthfolk-appearance-v7',JSON.stringify(look('New Nora')));plan=Link.prepare(store,remote);assert.equal(plan.changed,true);assert.deepEqual(plan.characters.map(c=>c.name),['New Nora','Ben','Cloud only']);
  store.setItem('hearthfolk-appearance-v7',JSON.stringify(look('Edited during upload')));Link.acknowledge(store,plan,{userId:A,revision:3,characters:plan.characters});
  assert.equal(Link.prepare(store,{userId:A,revision:3,characters:plan.characters}).characters[0].name,'Edited during upload');
  assert.deepEqual(Link.prepare(store,{userId:A,revision:4,characters:[character('slot-0','Changed elsewhere'),character('slot-1','Ben')]}).conflicts,['slot-0']);
  assert.throws(()=>Link.link(store,{userId:B,revision:1,ids:['slot-0'],characters:[character('slot-0','Edited during upload')]}),/another account/);
  store=storage();store.data.clear();plan=Link.prepare(store,remote);assert.equal(plan.status,'empty');assert.equal(store.getItem(Link.KEY),null,'empty browser never claims ownership or clears cloud');
  store=storage();store.setItem(Link.KEY,'corrupt');assert.throws(()=>Link.prepare(store,cloud),/owner/);
  store=storage();const collision={userId:A,revision:5,characters:[character('slot-0','Other device Nora'),character('slot-2','Cloud only')]};plan=Link.prepare(store,collision);assert.deepEqual(plan.conflicts,['slot-0']);assert.deepEqual(plan.characters.map(c=>c.name),['Other device Nora','Cloud only','Ben']);Link.acknowledge(store,plan,{...collision,revision:6,characters:plan.characters});let repeat=Link.prepare(store,{...collision,revision:6,characters:plan.characters});assert.deepEqual(repeat.conflicts,['slot-0']);assert.equal(repeat.changed,false,'repeated sync cannot adopt an unresolved new-slot collision');
  store=storage();plan=Link.prepare(store,{userId:A,revision:0,characters:[]});Link.acknowledge(store,plan,{userId:A,revision:1,characters:plan.characters});store.setItem('hearthfolk-appearance-v7',JSON.stringify(look('Local changed')));const diverged={userId:A,revision:2,characters:[character('slot-0','Remote changed'),character('slot-1','Ben')]};plan=Link.prepare(store,diverged);assert.deepEqual(plan.conflicts,['slot-0']);Link.acknowledge(store,plan,diverged);repeat=Link.prepare(store,diverged);assert.deepEqual(repeat.conflicts,['slot-0'],'unresolved owned collision survives acknowledgements');assert.equal(repeat.changed,false);
  for(const origin of ['https://morogue.repocompany.uk','https://repocompany.uk','https://www.repocompany.uk','https://evil.test']){
    store=storage();const handlers={},responses=[],parent={postMessage:message=>responses.push(message)};
    vm.runInNewContext(bridgeSource,{parent,window:{},location:{origin:'https://moratales.repocompany.uk'},localStorage:store,MORATALES_SURVIVOR_SAVES:Saves,MORATALES_CHARACTER_LINK:Link,addEventListener:(type,callback)=>handlers[type]=callback});
    handlers.message({source:parent,origin,data:{channel:'morogue-characters-v1',nonce:'12345678-1234-4234-8234-123456789012',id:'plan',action:'sync-plan',payload:cloud}});
    assert.equal(Boolean(Link.read(store)),['https://repocompany.uk','https://www.repocompany.uk'].includes(origin),'only an exact allowed website parent can automatically bind an owner');
  }
  let h=autoHarness(storage());assert.ok(h.frame,'unowned browser now automatically connects on sign-in');await h.start();h.reply(h.request('session'),{user:{id:A}});await flush();h.reply(h.request('characters'),cloud);await flush();
  let sent=h.request('characters-save');assert.ok(sent);assert.deepEqual(sent.payload.characters.map(c=>c.name),['Nora','Ben']);h.reply(sent,{userId:A,revision:1,characters:sent.payload.characters});await flush();assert.equal(Link.read(h.store).userId,A);assert.equal(h.context.MORATALES_ACCOUNT_CHARACTERS.status,'connected');
  const slots=JSON.parse(h.store.getItem('moratales-save-slots-v1'));slots.slots[2]={entries:{'hearthfolk-appearance-v7':JSON.stringify(look('New slot'))}};h.store.setItem('moratales-save-slots-v1',JSON.stringify(slots));
  void h.context.MORATALES_ACCOUNT_CHARACTERS.sync();await flush();h.reply(h.request('session'),{user:{id:A}});await flush();h.reply(h.request('characters'),{userId:A,revision:1,characters:sent.payload.characters});await flush();assert.equal(h.request('characters-save').payload.characters.at(-1).name,'New slot','newly created slots sync without a manual link');
  for(const accountId of [null,B]){h=autoHarness();await h.start();h.reply(h.request('session'),accountId?{user:{id:accountId}}:null);await flush();if(accountId){h.reply(h.request('characters'),{userId:B,revision:0,characters:[]});await flush();}assert.equal(h.request('characters-save'),undefined);assert.equal(h.context.MORATALES_ACCOUNT_CHARACTERS.status,accountId?'account':'signed-out');}
  for(const change of ['account','marker','pagehide','conflict','wrong-user']){
    h=autoHarness();h.store.setItem('hearthfolk-appearance-v7',JSON.stringify(look('Changed')));await h.start();h.reply(h.request('session'),{user:{id:A}});await flush();h.reply(h.request('characters'),{userId:A,revision:1,characters:Link.read(h.store).characters});await flush();sent=h.request('characters-save');assert.ok(sent);
    if(change==='account')h.changed();if(change==='marker'){h.store.setItem(Link.KEY,JSON.stringify({...Link.read(h.store),userId:B}));h.handlers.storage({key:Link.KEY});}if(change==='pagehide')h.handlers.pagehide();const before=h.store.getItem(Link.KEY);
    h.reply(sent,{userId:change==='wrong-user'?B:A,revision:2,characters:sent.payload.characters},change==='conflict'?'revision_conflict':undefined);await flush();assert.equal(h.store.getItem(Link.KEY),before,change+' cannot install a stale owner marker');
    if(change==='pagehide'){assert.equal(h.intervals.size,0);assert.equal(h.timeouts.size,0);}
  }
  console.log('PASS: automatic first sign-in sync, immutable owner, unchanged cloud preservation, empty browser, new local slots, concurrent edits, exact bridge origin and stale account cleanup.');
})().catch(error=>{console.error(error);process.exitCode=1;});
