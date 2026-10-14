'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { auditAssetClosure, transformHTML, nativeSaveHooks, verifyRelease, writeRelease } = require('../tools/prepare-moratales.cjs');
const buffer = text => ({ buffer: Buffer.from(text) });
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

test('asset audit catches nested bridge, embedded and dynamic-family omissions', async () => {
  const files = new Map([
    ['preview.html', buffer('<script src="interface/town.js"></script>')],
    ['interface/town.js', buffer('const a="/embedded/abc.png",b="maps/room.png";')],
    ['interface/bridge/index.html', buffer('<script src="../shared.js"></script>')],
    ['interface/shared.js', buffer('')], ['embedded/abc.png', buffer('image')], ['maps/room.png', buffer('map')]
  ]);
  assert.equal((await auditAssetClosure(files)).missing.length, 0);
  files.delete('embedded/abc.png'); await assert.rejects(auditAssetClosure(files), /Missing Moratales dependencies: embedded\/abc.png/);
  files.set('embedded/abc.png', buffer('image')); files.delete('interface/shared.js');
  await assert.rejects(auditAssetClosure(files), /interface\/shared.js/);
});

test('entry keeps exactly one ordered character overlay and removes online duplicate runtime', () => {
  const names = ['town-cafe-day.js','town-cafe-service.js','town-kitchen.js','town-pleasure.js','town-roastery.js'];
  const input = `<html><body><script src="https://repocompany.uk/game-integrations/moratales/achievement-runtime.js"></script>${names.map(name => `<script src="https://repocompany.uk/game-integrations/moratales/${name}?v=1"></script>`).join('')}<script src="interface/town-explorer.js"></script></body></html>`;
  const output = transformHTML(transformHTML(input));
  assert(!output.includes('game-integrations/moratales/'));
  assert.equal(output.match(/moratales-account-characters\.js/g).length, 1);
  assert(output.indexOf('/interface/vampire-survivor/characters.js') < output.indexOf('/interface/moratales-character-link.js'));
  assert.throws(() => transformHTML('<body></body>'), /entry structure/);
});

test('native save hooks refuse unknown or repeated source markers', () => {
  for (const file of ['interface/town-explorer.js', 'coop/client.js', 'coop/worker.js']) assert.throws(() => nativeSaveHooks(file, '// changed upstream'), /Unrecognised prepared/);
  assert.throws(() => nativeSaveHooks('interface/town-explorer.js', 'const api={coopNotice:const api={coopNotice:'), /Unrecognised/);
});

test('prepared solo hook uses existing guarded save and pauses existing input/audio', () => {
  const calls = [], root = { MORATALES_COOP_ACTIVE: false, MORATALES_MENU_OPEN: false };
  const source = 'const api={coopNotice:null};globalThis.api=api;';
  const context = { root, life: {}, commitSlot: () => { calls.push('save'); }, clear: () => calls.push('clear'), townAudio: { pause: () => calls.push('pause') } };
  vm.runInNewContext(nativeSaveHooks('interface/town-explorer.js', source), context);
  context.api.nativeSave(); context.api.nativePause(); assert.deepEqual(calls, ['save','clear','pause']);
  root.MORATALES_MENU_OPEN = true; context.api.nativeSave(); assert.equal(calls.length, 3);
  root.MORATALES_MENU_OPEN = false; context.commitSlot = () => { throw Error('Storage full'); };
  assert.throws(() => context.api.nativeSave(), /Storage full/);
});

test('prepared worker acknowledges exact checkpoint before close and rejects unsafe moments', () => {
  const sent = [], context = { V: { type: 'launcher-save', request: 7 }, Qt: { checkpoint: () => ({ revision: 4 }) }, postMessage: message => sent.push(message), Do: false, cs() {} };
  vm.runInNewContext(nativeSaveHooks('coop/worker.js', 'V.type==="save"&&(Do=!0,cs())'), context);
  assert.deepEqual(sent.map(message => message.type), ['checkpoint', 'launcher-save-result']); assert.equal(sent[1].request, 7);
  sent.length = 0; context.Qt.checkpoint = () => null;
  vm.runInNewContext(nativeSaveHooks('coop/worker.js', 'V.type==="save"&&(Do=!0,cs())'), context);
  assert.equal(sent.length, 1); assert.match(sent[0].error, /Finish the current shared action/);
});

test('prepared co-op hook waits for persisted checkpoint and rejects storage or session changes', async () => {
  const client = `let worker=root.worker,slot=0,epoch=1,identity={id:'host'},lobby={hostId:'host'},lastPlayingLobby=lobby;const keys=new Set();
 function send(m){}function isHost(){return lobby.hostId===identity.id;}function error(m){root.errors.push(m);}function publishSlots(){}function open(){}function frame(){}function command(){}
 worker.onmessage=({data:d})=>{
 if(d.type==='checkpoint'){try{if(lastPlayingLobby){const save=root.MORATALES_COOP_SAVES.write(localStorage,slot,d.save,{...lastPlayingLobby,localPlayerId:identity.id});send({type:'checkpoint',save});publishSlots();}}catch(e){error('Could not save the shared adventure: '+e.message);}}
 };
 root.MORATALES_COOP={open,frame,command,changeEpoch(){epoch++;}};`;
  const posted = [], saved = [], root = { worker: { postMessage: value => posted.push(value) }, MORATALES_COOP_ACTIVE: true, errors: [], MORATALES_COOP_SAVES: { write: (_storage, slot, state) => { saved.push({ slot, state }); return state; } } };
  vm.runInNewContext(nativeSaveHooks('coop/client.js', client), { root, localStorage: {}, setTimeout, clearTimeout });
  const first = root.MORATALES_COOP.nativeSave(); assert.equal(root.MORATALES_COOP.nativeSave(), first);
  root.worker.onmessage({ data: { type: 'checkpoint', launcherRequest: posted[0].request, save: { revision: 4 } } });
  root.worker.onmessage({ data: { type: 'launcher-save-result', request: posted[0].request } }); await first; assert.equal(saved.length, 1);
  root.MORATALES_COOP_SAVES.write = () => { throw Error('Storage full'); };
  const second = root.MORATALES_COOP.nativeSave();
  root.worker.onmessage({ data: { type: 'checkpoint', launcherRequest: posted[1].request, save: { revision: 5 } } });
  root.worker.onmessage({ data: { type: 'launcher-save-result', request: posted[1].request } }); await assert.rejects(second, /Storage full/);
  const third = root.MORATALES_COOP.nativeSave(); root.MORATALES_COOP.changeEpoch();
  root.worker.onmessage({ data: { type: 'checkpoint', launcherRequest: posted[2].request, save: { revision: 6 } } });
  root.worker.onmessage({ data: { type: 'launcher-save-result', request: posted[2].request } }); await assert.rejects(third, /shared adventure changed/);
  assert.equal(saved.length, 1);
});

test('release copies code, hardlinks media, rejects overwrite and detects staging changes', async t => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-moratales-package-'));
  t.after(async () => { const resolved = path.resolve(temporary); assert(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep)); await fs.rm(resolved, { recursive: true, force: true }); });
  const source = path.join(temporary, 'source'); await fs.mkdir(source);
  const text = path.join(source, 'game.js'), binary = path.join(source, 'image.png');
  await fs.writeFile(text, 'original code'); await fs.writeFile(binary, 'original media');
  const files = new Map([['preview.html', buffer('<body>Game</body>')], ['game.js', { source: text }], ['image.png', { source: binary }]]);
  const manifest = { gameId: 'moratales', version: 'fixture', files: [{ path: 'preview.html', size: 17, sha256: hash('<body>Game</body>') }, { path: 'game.js', size: 13, sha256: hash('original code') }, { path: 'image.png', size: 14, sha256: hash('original media') }] };
  const output = path.join(temporary, 'release'); await writeRelease(output, files, manifest, {});
  assert.equal((await fs.stat(binary)).ino, (await fs.stat(path.join(output, 'payload/image.png'))).ino);
  await fs.writeFile(text, 'changed source'); assert.equal(await fs.readFile(path.join(output, 'payload/game.js'), 'utf8'), 'original code');
  assert.equal((await verifyRelease(output, manifest)).verifiedFiles, 3);
  await assert.rejects(writeRelease(output, files, manifest, {}), /Release already exists/);
  await fs.writeFile(binary, 'changed media!'); await assert.rejects(verifyRelease(output, manifest), /Release content changed: image.png/);
});
