import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
import {readFileSync} from 'node:fs';

test('current portal preserves installed-launcher recognition and opens the current web build',async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async request=>{
  const p=new URL(request.url).pathname;
  return new Response(p==='/'?'<script src="game-scenes.js?v=old"></script><script src="repo-web-game.js"></script>':p==='/game-scenes.js'?"const scene={url:'https://comp-run.fluffy-star-4855.chatgpt.site/'}":"const games={'comp-run':['COMP-RUN','https://comp-run.fluffy-star-4855.chatgpt.site/']};",{headers:{'Content-Type':p==='/'?'text/html':'application/javascript','ETag':'old','Content-Length':'10'}});
 };
 try{
  const html=await (await worker.fetch(new Request('https://repocompany.uk/'),{})).text();
  assert.equal((html.match(/launch-repair=20261029/g)||[]).length,2);
  assert.match(html,/v=old&amp;launch-repair/);
  const scene=await worker.fetch(new Request('https://repocompany.uk/game-scenes.js?v=old'),{});
  const code=await scene.text();assert.match(code,/url:'https:\/\/comp-run\.fluffy-star-4855\.chatgpt\.site\/'/);
  assert.equal(scene.headers.get('etag'),null);assert.equal(scene.headers.get('content-length'),null);
  const web=await (await worker.fetch(new Request('https://repocompany.uk/repo-web-game.js'),{})).text();
  assert.match(web,/'https:\/\/repocompany.uk\/comp-run\/'/);assert(!web.includes('chatgpt.site'));
 }finally{globalThis.fetch=previous;}
});

test('multiplayer websocket upgrades and versioned paths reach the current service unchanged',async()=>{
 let seen;
 const result=new Response('service response');
 const response=await worker.fetch(new Request('https://repocompany.uk/api/comp-run/races-v2271/airport/ABCDEFGH',{headers:{Upgrade:'websocket',Origin:'https://repocompany.uk'}}),{RACES:{fetch:async request=>{seen=request;return result;}}});
 assert.equal(response,result);assert.equal(new URL(seen.url).pathname,'/api/comp-run/races/airport/ABCDEFGH');
 assert.equal(seen.headers.get('upgrade'),'websocket');assert.equal(seen.headers.get('origin'),'https://repocompany.uk');
});

test('a portal catalogue using the new browser URL is translated back to the installed identity',async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async()=>new Response("const scene={url:'https://repocompany.uk/comp-run/'}",{headers:{'Content-Type':'application/javascript'}});
 try{
  const code=await (await worker.fetch(new Request('https://repocompany.uk/game-scenes.js'),{})).text();
  assert.match(code,/url:'https:\/\/comp-run\.fluffy-star-4855\.chatgpt\.site\/'/);
 }finally{globalThis.fetch=previous;}
});

test('account hotfix matches the reviewed source and permits the portal as a nested ancestor',async()=>{
 const previous=globalThis.fetch;
 const fixed=readFileSync(new URL('../../morogue-account-bridge.js',import.meta.url),'utf8');
 const original=fixed.replace('authRevision=0,authUser;','authRevision=0;').replace("db.auth.onAuthStateChange((event,value)=>{const next=value?.user?.id||null;if(event==='SIGNED_OUT'||authUser!==undefined&&next!==authUser)authRevision++;authUser=next;",'db.auth.onAuthStateChange(()=>{authRevision++;');
 globalThis.fetch=async r=>new Response(new URL(r.url).pathname.endsWith('.js')?original:'<html>Account bridge</html>',{headers:{'Content-Type':'application/javascript','Content-Security-Policy':"default-src 'none'; frame-ancestors https://morogue.repocompany.uk https://moratales.repocompany.uk; base-uri 'none'"}});
 try{
  assert.equal(await (await worker.fetch(new Request('https://repocompany.uk/morogue-account-bridge.js'),{})).text(),fixed);
  for(const p of ['/morogue-account-bridge','/morogue-account-bridge.html']){
   const r=await worker.fetch(new Request('https://repocompany.uk'+p),{});
   assert.match(r.headers.get('Content-Security-Policy'),/frame-ancestors 'self' https:\/\/www.repocompany.uk/);
   assert.match(r.headers.get('Content-Security-Policy'),/default-src 'none'/);assert.equal(r.headers.get('Cache-Control'),'no-store');
  }
 }finally{globalThis.fetch=previous;}
});
