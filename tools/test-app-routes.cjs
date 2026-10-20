'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const {createFixture}=require('./messaging-test-server.cjs');
const dist=path.resolve(__dirname,'../dist');
const player='<!doctype html><title>Persistent player fixture</title><script>window.playerId=Math.random();window.playing=true;parent.postMessage({type:"repo-reparty-state",state:{active:true,playing:true,connected:true,authenticated:true,canControl:true,canVolume:true,volume:70}},location.origin);</script>';
(async()=>{
 const fixture=await createFixture(),browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{
  async function context(signedIn=true,native=false){
   const c=await fixture.browserContext(browser,'alice',{signedIn});
   await c.route(fixture.base+'/**',async route=>{
    const u=new URL(route.request().url());if(u.pathname.startsWith('/api/'))return route.fallback();
    if(u.pathname==='/reparty/')return route.fulfill({contentType:'text/html',body:player});
    const p=/^\/(?:Wibs|Reparty|Account(?:\/.*)?|Moratales|Morogue|VelmoraManager|VelmoraTales|Demos(?:\/.*)?)?$/.test(u.pathname)?'/index.html':u.pathname;
    const file=path.resolve(dist,'.'+p);if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp','.mp3':'audio/mpeg'};
    if(native&&p==='/index.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync(file,'utf8').replace('<html','<html data-repo-launcher="true"')});
    return route.fulfill({path:file,contentType:types[path.extname(file)]||'application/octet-stream'});
   });
   await c.route('https://morogue.repocompany.uk/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><p>Persistent game fixture</p>'}));
   c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));return c;
  }
  const c=await context(),page=await c.newPage();await page.goto(fixture.base);await page.waitForFunction(()=>repoAccount.state.user&&document.documentElement.dataset.repoAuth==='ready');
  await page.evaluate(()=>{history.replaceState({scene:'morogue',fixture:'retained'},'','/#morogue');dispatchEvent(new PopStateEvent('popstate'));window.documentId=Math.random();repoWebGame.open('morogue');const audio=new AudioContext(),tone=audio.createOscillator(),dest=audio.createMediaStreamDestination();tone.connect(dest);tone.start();window.callTrack=dest.stream.getAudioTracks()[0];});
  const upcomingPage=await c.newPage();await upcomingPage.goto(fixture.base+'/VelmoraTales');await upcomingPage.waitForFunction(()=>document.querySelector('#dashboard').dataset.openGame==='velmora-tales');assert.equal(new URL(upcomingPage.url()).pathname,'/VelmoraTales');assert(await upcomingPage.locator('[data-note="Play"]').isDisabled());assert.equal(await upcomingPage.locator('[data-shot]:disabled').count(),3);await upcomingPage.close();
  const documentId=await page.evaluate(()=>documentId),game=await page.locator('#repo-web-game iframe').elementHandle();
  await page.evaluate(()=>repoMessaging.open());assert.equal(new URL(page.url()).pathname,'/Wibs');assert.equal(new URL(page.url()).hash,'');
  await page.evaluate(()=>repoReparty.open());assert.equal(new URL(page.url()).pathname,'/Reparty');assert.equal(await page.locator('#repo-messages').evaluate(e=>e.open),false);
  const frame=await page.locator('#repo-reparty iframe').elementHandle();await page.waitForFunction(()=>repoReparty.getState().playing);
  const playerId=await frame.evaluate(e=>e.contentWindow.playerId);
  await page.evaluate(()=>repoMessaging.open());assert.equal(new URL(page.url()).pathname,'/Wibs');assert.equal(await frame.evaluate(e=>e.contentWindow.playerId),playerId);assert.equal(await frame.evaluate(e=>e.contentWindow.playing),true);
  assert.equal(await game.evaluate(e=>e.isConnected),true);assert.equal(await page.evaluate(()=>callTrack.readyState),'live');assert.equal(await page.evaluate(()=>documentId),documentId);
  await page.evaluate(()=>repoMessaging.close());assert.equal(page.url(),fixture.base+'/Morogue');assert.equal(await page.evaluate(()=>history.state.fixture),'retained');
  await page.evaluate(()=>repoReparty.open());await page.locator('#repo-reparty .rc-back').click();assert.equal(page.url(),fixture.base+'/');assert.equal(await frame.evaluate(e=>e.isConnected),true);
  await page.evaluate(()=>repoWebGame.close());
  // An existing game-history entry can become a Wibs URL without reloading.
  await page.evaluate(()=>{history.pushState({scene:'morogue'},'','/#morogue');repoMessaging.open();});
  await page.goBack();assert.equal(new URL(page.url()).pathname,'/');assert.equal(await page.locator('#repo-messages').evaluate(e=>e.open),false);
  await page.goForward();await page.waitForFunction(()=>document.getElementById('repo-messages').open);assert.equal(new URL(page.url()).pathname,'/Wibs');
  await page.reload();await page.waitForFunction(()=>document.getElementById('repo-messages')?.open);assert.equal(new URL(page.url()).pathname,'/Wibs');
  await page.goto(fixture.base+'/Reparty?room=abcdef123456');await page.waitForFunction(()=>repoReparty.getState().open);assert.match(await page.locator('#repo-reparty iframe').getAttribute('src'),/room=abcdef123456/);assert.equal(new URL(page.url()).hash,'');
  // Account and game changes stay in the same document and keep music alive.
  await page.evaluate(()=>{repoReparty.close();accountMenu.open();});assert.equal(page.url(),fixture.base+'/Account');
  await page.locator('#account-tab-friends').click();assert.equal(page.url(),fixture.base+'/Account/Friends');
  await page.evaluate(()=>repoMessaging.open());assert.equal(page.url(),fixture.base+'/Wibs');
  await page.evaluate(()=>repoMessaging.close());assert.equal(page.url(),fixture.base+'/Account/Friends');
  const accountPlayer=await page.locator('#repo-reparty iframe').elementHandle();
  await page.evaluate(()=>accountMenu.openAchievements('morogue'));assert.equal(page.url(),fixture.base+'/Account/Achievements/Morogue');
  await page.goBack();await page.waitForFunction(()=>document.getElementById('account-menu').dataset.accountTab==='friends');
  await page.goForward();await page.waitForFunction(()=>document.getElementById('account-menu').dataset.accountTab==='achievements');
  await page.evaluate(()=>accountMenu.close());assert.equal(page.url(),fixture.base+'/');
  assert.equal(await accountPlayer.evaluate(e=>e.isConnected&&e.contentWindow.playing),true);
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const [id,name,pathName] of [['moratales','Moratales','Moratales'],['manager','Velmora Manager','VelmoraManager'],['morogue','Morogue','Morogue']]){
   await page.getByRole('button',{name:'Select '+name,exact:true}).focus();await page.locator('#open-selected').click();
   await page.waitForURL(fixture.base+'/'+pathName);assert.equal(await page.locator('#dashboard').getAttribute('data-open-game'),id);
   assert.equal(await accountPlayer.evaluate(e=>e.isConnected&&e.contentWindow.playing),true);
   await page.locator('.close-case').click();await page.waitForURL(fixture.base+'/');
  }
  await page.evaluate(()=>demoLibrary.open());assert.equal(page.url(),fixture.base+'/Demos');
  assert.match(await page.locator('#demo-launch').getAttribute('href'),/^\/Demos\//);
  await page.evaluate(()=>demoLibrary.close());assert.equal(page.url(),fixture.base+'/');
  const destinations=[['/Account','account/profile'],['/Account/Friends','account/friends'],['/Account/Profile/bob','account/profile/bob'],['/Account/Achievements/Morogue','account/achievements/morogue'],['/Account/Binder','account/binder'],['/Account/Slabs','account/slabs'],['/Moratales','moratales'],['/VelmoraManager','manager'],['/Morogue','morogue'],['/Demos','demos']];
  async function ready(p,id){
   await p.waitForFunction(()=>repoAccount.state.user&&document.documentElement.dataset.repoAuth==='ready');
   if(id.startsWith('account/'))await p.waitForFunction(tab=>document.getElementById('account-menu').open&&document.getElementById('account-menu').dataset.accountTab===tab,id.split('/')[1]);
   else if(id==='demos')await p.waitForFunction(()=>document.getElementById('demo-library').open);
   else await p.waitForFunction(id=>!document.getElementById('dashboard').classList.contains('home-mode')&&document.getElementById('dashboard').dataset.openGame===id,id);
  }
  for(const [url,id] of destinations){
   await page.goto(fixture.base+url);await ready(page,id);assert.equal(new URL(page.url()).hash,'');
   assert.equal(await page.evaluate(()=>document.baseURI),fixture.base+'/');
   await page.reload();await ready(page,id);assert.equal(page.url(),fixture.base+url);
  }
  for(const id of ['account/friends','account/achievements/morogue','moratales','manager','morogue','demos']){
   await page.goto(fixture.base+'/#'+id);await ready(page,id);assert.equal(page.url(),fixture.base+destinations.find(item=>item[1]===id)[0]);
  }
  // Deep links wait for the normal login gate, then open the requested view.
  for(const name of ['Wibs','Reparty','Account/Friends','Morogue','Demos']){
   const loggedOut=await context(false),p=await loggedOut.newPage();await p.goto(fixture.base+'/'+name);
   const login=p.locator('#repo-login');await login.locator('#sign-in-form').waitFor({state:'visible'});
   assert.equal(await p.locator('#repo-messages').evaluate(e=>e.open),false);assert.equal(await p.locator('#repo-reparty iframe').count(),0);
   await login.locator('#sign-in-username').fill('alice');await login.locator('#sign-in-password').fill('fixture-password');await login.locator('#sign-in-submit').click();
   if(['Wibs','Reparty'].includes(name))await p.waitForFunction(name=>document.getElementById(name==='Wibs'?'repo-messages':'repo-reparty').open,name);
   else await ready(p,name==='Account/Friends'?'account/friends':name.toLowerCase());
   assert.equal(new URL(p.url()).pathname,'/'+name);assert.equal(await login.evaluate(e=>e.open),false);
   await p.evaluate(()=>repoAccount.signOut());await login.locator('#sign-in-form').waitFor({state:'visible'});await loggedOut.close();
  }
  const launcher=await context(true,true),nativePage=await launcher.newPage();await nativePage.goto(fixture.base);await nativePage.waitForFunction(()=>repoAccount.state.user);
  await nativePage.evaluate(()=>repoMessaging.open());assert.equal(new URL(nativePage.url()).pathname,'/');await nativePage.evaluate(()=>repoReparty.open());assert.equal(new URL(nativePage.url()).pathname,'/');
  await nativePage.evaluate(()=>{repoReparty.close();accountMenu.open({tab:'friends'});});assert.equal(new URL(nativePage.url()).hash,'#account/friends');
  assert.deepEqual(errors,[]);console.log('PASS: clean Account/game/Wibs/Reparty paths, nested Account sections, legacy links, direct links and refresh, deferred login, Back/Forward, collection return, mounted game/player/audio stream, and unchanged native launcher routing.');
 }finally{await browser.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
