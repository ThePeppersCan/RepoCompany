'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { resolveAsset, serveFile, injectMorogue, injectGame, createHandler } = require('../lib/protocol.cjs');

test('local game routes reject encoded traversal, ADS, device names and hidden paths', () => {
  const root = path.resolve('managed-library');
  for (const url of ['/../secret.js', '/%2e%2e/secret.js', '/assets/a%5cb.js', '/assets/a:secret.js', '/assets/NUL.js', '/assets/CONIN$.js', '/assets/CONOUT$.js', '/assets/COM0.js', '/assets/LPT%C2%B9.js', '/assets/%252e%252e/secret.js', '/assets/.secret.js', '/assets/a.js%00', '/assets/a.js%20', '/assets//a.js']) assert.equal(resolveAsset(root, url), null, url);
  assert.equal(resolveAsset(root, '/assets/hero.png'), path.join(root, 'assets', 'hero.png'));
});
test('installed static media supports ranges, HEAD, and rejects linked outside files', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-protocol-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'song.mp3'), '0123456789');
  const r = await serveFile(new Request('https://morogue.repocompany.uk/song.mp3', { headers: { Range: 'bytes=2-5' } }), root, '/song.mp3');
  assert.equal(r.status, 206); assert.equal(await r.text(), '2345'); assert.equal(r.headers.get('Content-Range'), 'bytes 2-5/10');
  const head = await serveFile(new Request('https://morogue.repocompany.uk/song.mp3', { method: 'HEAD' }), root, '/song.mp3');
  assert.equal(head.headers.get('Content-Length'), '10'); assert.equal(await head.text(), '');
  const outside = path.join(root, 'outside'); await fs.mkdir(outside); await fs.writeFile(path.join(outside, 'secret.js'), 'private');
  const inside = path.join(root, 'inside'); await fs.mkdir(inside); await fs.symlink(outside, path.join(inside, 'linked'), 'junction');
  assert.equal((await serveFile(new Request('https://example.test/linked/secret.js'), inside, '/linked/secret.js')).status, 403);
});
test('game entry injects launcher gate before app and preserves website auth origin', () => {
  const html = '<html><head><script defer src="interface/vampire-survivor/leaderboards.js"></script><script defer src="interface/vampire-survivor/app.js"></script></head><body></body></html>';
  const injected = injectMorogue(html);
  assert.ok(injected.indexOf('account-storage.js') < injected.indexOf('leaderboards.js'));
  assert.ok(injected.indexOf('/__repo-launcher/morogue.js') < injected.indexOf('survivor/app.js'));
  assert.match(injected, /https:\/\/repocompany.uk\/__repo-launcher\/morogue-achievements.js/);
  assert.throws(() => injectMorogue('<html>unknown entry</html>'), /not compatible/);
});

test('downloaded adventures bind storage and native account before source scripts', () => {
  for (const id of ['moratales', 'manager']) {
    const html = injectGame('<html><head><script src="career-storage.js"></script></head></html>', id);
    assert(html.indexOf('account-storage.js') < html.indexOf('/__repo-launcher/' + id + '.js'));
    assert(html.indexOf('/__repo-launcher/' + id + '.js') < html.indexOf('career-storage.js'));
    assert(html.includes('https://repocompany.uk/__repo-launcher/' + id + '-achievements.js'));
  }
});
test('shared HTTPS handler forwards website auth and game APIs but blocks unknown origins', async () => {
  const calls = [];
  const handler = createHandler({ config: { approvedOrigins: ['https://repocompany.uk', 'https://morogue.repocompany.uk', 'https://manager.repocompany.uk'], portalOrigin: 'https://repocompany.uk', games: [{ id: 'morogue', installable: true, origin: 'https://morogue.repocompany.uk' }, { id: 'manager', installable: false, origin: 'https://manager.repocompany.uk' }] }, library: { getInstalled: () => null }, desktopRoot: '.', fetchNetwork: async request => { calls.push(request.url); return new Response('network'); } });
  for (const url of ['https://repocompany.uk/morogue-account-bridge.html', 'https://morogue.repocompany.uk/api/leaderboards/account', 'https://manager.repocompany.uk/']) assert.equal(await (await handler(new Request(url))).text(), 'network');
  assert.equal((await handler(new Request('https://untrusted.test/'))).status, 403);
  assert.equal((await handler({ url: 'https://user:password@repocompany.uk/', method: 'GET', headers: new Headers() })).status, 403);
  assert.equal(calls.length, 3);
});

test('only an installed Morogue receives the authenticated character bridge override', async () => {
  let installed = true;
  const handler = createHandler({ config: { approvedOrigins: ['https://morogue.repocompany.uk', 'https://moratales.repocompany.uk'], games: [{ id: 'morogue', installable: true, origin: 'https://morogue.repocompany.uk' }] }, library: { getInstalled: () => installed ? { directory: '.', entry: 'index.html' } : null }, desktopRoot: path.resolve(__dirname, '..'), fetchNetwork: async () => new Response('original website bridge') });
  const route = '/interface/vampire-survivor/site-bridge.js';
  const local = await handler(new Request('https://morogue.repocompany.uk' + route));
  assert.equal(local.status, 200); assert.match(await local.text(), /service\.request\('characters', \{ userId: expectedAccount \}\)/);
  assert.equal(await (await handler(new Request('https://moratales.repocompany.uk' + route))).text(), 'original website bridge');
  installed = false;
  assert.equal(await (await handler(new Request('https://morogue.repocompany.uk' + route))).text(), 'original website bridge');
});

test('Reparty provider resources are isolated from launcher navigation, credentials and bridges', async () => {
  const calls=[];
  const handler=createHandler({config:{approvedOrigins:['https://repocompany.uk'],portalOrigin:'https://repocompany.uk',games:[]},library:{getInstalled:()=>null},desktopRoot:'.',fetchNetwork:async(request,options)=>{calls.push({url:request.url,options});return new Response('provider');}});
  const request=(url,initiator='https://repocompany.uk',method='GET')=>Object.assign(new Request(url,{method}),{initiatorOrigin:initiator});
  for(const url of ['https://suno.com/embed/c72dcf81-5611-4c75-9a62-07a9c9e51fa8','https://www.youtube.com/iframe_api','https://rr1---sn-abc.googlevideo.com/videoplayback','https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg'])assert.equal(await(await handler(request(url))).text(),'provider');
  assert(calls.every(c=>c.options.redirect==='manual'),'every external redirect is checked again');
  assert(calls.every(c=>c.options.headers.get('Referer')==='https://repocompany.uk/'),'provider receives the real embedding origin');
  for(const url of ['https://suno.com.evil.test/','https://evilgooglevideo.com/','https://suno.com:444/','https://www.youtube.com/__repo-launcher/account-storage.js','https://untrusted.test/'])assert.equal((await handler(request(url))).status,403,url);
  assert.equal((await handler(request('https://suno.com/','https://evil.test'))).status,403);
  assert.equal((await handler(new Request('https://suno.com/'))).status,403,'browser-initiated top-level requests are not media resources');
  assert.equal((await handler(request('https://suno.com/','https://repocompany.uk','DELETE'))).status,403);
  assert.equal((await handler({url:'https://user:password@suno.com/',method:'GET',initiatorOrigin:'https://repocompany.uk'})).status,403);
});

test('Steam thumbnails load only for the Repo portal without credentials or arbitrary external access', async () => {
  const calls=[],config={approvedOrigins:['https://repocompany.uk'],portalOrigin:'https://repocompany.uk',games:[]};
  const handler=createHandler({config,library:{getInstalled:()=>null},desktopRoot:'.',fetchNetwork:async(request,options)=>{calls.push({url:request.url,options});return new Response('thumbnail',{headers:{'Content-Type':'image/jpeg','Cache-Control':'public, max-age=31536000'}});}});
  const request=(url,initiator='https://repocompany.uk',method='GET')=>Object.assign(new Request(url,{method,headers:{Authorization:'Bearer must-not-leak',Cookie:'private=must-not-leak',Referer:'https://repocompany.uk/private'}}),{initiatorOrigin:initiator});
  const image='https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1139980/'+'a'.repeat(40)+'/capsule_184x69.jpg?t=1789987425';
  for(const url of [image,image.replace('shared.akamai','shared.fastly'),'https://shared.steamstatic.com/store_item_assets/steam/apps/3070070/capsule_184x69.jpg','https://cdn.cloudflare.steamstatic.com/steam/apps/1139980/capsule_184x69.jpg']){
    const result=await handler(request(url));assert.equal(await result.text(),'thumbnail');assert.equal(result.headers.get('Cache-Control'),'public, max-age=31536000');
  }
  assert.equal(calls.length,4);for(const {options} of calls){assert.equal(options.redirect,'manual');assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');for(const header of ['Authorization','Cookie','Referer'])assert.equal(options.headers.get(header),null);}
  for(const url of [image.replace('.com/','.com.evil.test/'),image.replace('.com/','.com:444/'),image.replace('https://','https://user:pass@'),image.replace('https:','http:'),image.replace('capsule_184x69.jpg','index.html'),image.replace('capsule_184x69.jpg','app.js'),image+'&next=https://evil.test',image+'#other','https://shared.akamai.steamstatic.com/__repo-launcher/account-storage.js'])assert.equal((await handler({url,method:'GET',headers:new Headers(),initiatorOrigin:config.portalOrigin})).status,403,url);
  for(const initiator of [undefined,'https://evil.test','https://suno.com','https://morogue.repocompany.uk'])assert.equal((await handler(Object.assign(new Request(image),{initiatorOrigin:initiator}))).status,403);
  assert.equal((await handler(request(image,config.portalOrigin,'POST'))).status,403);assert.equal(calls.length,4);
  assert(!config.approvedOrigins.includes(new URL(image).origin),'Steam does not gain top-level navigation or native bridge access');
});
