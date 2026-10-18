'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const rawFetch=fetch,f=await createFixture(),browser=await chromium.launch({channel:'msedge',headless:true});
 const api=async(who,route,body)=>{const r=await rawFetch(f.base+'/api/community/'+route,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+f.sessions[who].access_token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await r.json();assert(r.ok,JSON.stringify(data));return data;};
 const track={provider:'youtube',id:'abcdefghijk',title:'Evening in the grove',artist:'The Forest Sessions',duration:243,position:65};
 try{
  const now=Date.now(),avatar=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../account-assets/avatar-v2/catalog.json'))).defaults;
  for(const who of ['alice','bob']){f.sql.prepare('INSERT INTO community_members VALUES(?,?,?)').run(f.sessions[who].user.id,now,now);f.sql.prepare('INSERT INTO dashboard_avatars VALUES(?,?,?)').run(who,JSON.stringify(avatar),now);}
  await api('bob','listening-settings',{reparty:true,spotify:false});await api('bob','listening',{source:'reparty',session:crypto.randomUUID(),sequence:1,action:'start',track});
  const context=await f.browserContext(browser,'alice'),p=await context.newPage(),errors=[],posts=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url().endsWith('/api/community/listening')&&r.method()==='POST')posts.push(r.postDataJSON());});
  await context.route('https://i.ytimg.com/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#203b31"/><circle cx="60" cy="60" r="32" fill="#a6be85"/><circle cx="60" cy="60" r="8" fill="#203b31"/></svg>'}));
  await context.route(f.base+'/api/reparty-video?*',route=>route.fulfill({json:{title:track.title,artist:track.artist}}));
  await context.route(f.base+'/reparty/?*',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Simulated Reparty media</title>'}));
  await p.goto(f.base);await p.waitForFunction(()=>window.repoListening&&repoAccount.state.user);await p.evaluate(()=>repoMessaging.open());
  await p.locator('.rc-member[data-voice-name="bob"] .rc-listening-inline').waitFor();await p.locator('.rc-member[data-voice-name="bob"]').click();
  const card=p.locator('.rc-profile-popover .rc-listening-card');await card.waitFor();assert.match(await card.innerText(),/Listening on Reparty/);assert.match(await card.innerText(),/Evening in the grove/);assert.match(await card.innerText(),/The Forest Sessions/);assert.equal(await card.locator('a').getAttribute('href'),'https://www.youtube.com/watch?v=abcdefghijk');
  await card.locator('img').evaluate(img=>img.decode());const initial=await card.locator('progress').evaluate(n=>n.value);await p.waitForFunction(v=>document.querySelector('.rc-listening-card progress').value>v,initial);assert.equal(posts.length,0,'viewing progress makes no listening writes');
  const outputs=path.resolve(__dirname,'../../../outputs');fs.mkdirSync(outputs,{recursive:true});await p.locator('.rc-profile-popover').screenshot({path:path.join(outputs,'wibs-listening-card.png')});
  f.sql.prepare('UPDATE community_listening SET track=? WHERE user_id=?').run(JSON.stringify({...track,title:'The next song'}),f.sessions.bob.user.id);await p.evaluate(()=>repoCommunity.refresh());await p.waitForFunction(()=>document.querySelector('.rc-listening-card strong')?.textContent==='The next song');
  f.sql.prepare('UPDATE dashboard_players SET invisible=1 WHERE username=?').run('bob');await p.evaluate(()=>repoCommunity.refresh());await card.waitFor({state:'detached'});f.sql.prepare('UPDATE dashboard_players SET invisible=0 WHERE username=?').run('bob');await p.evaluate(()=>repoCommunity.refresh());await card.waitFor();
  for(const size of [[1440,900],[390,844]]){await p.setViewportSize({width:size[0],height:size[1]});const box=await card.boundingBox();assert(box&&box.x>=0&&box.x+box.width<=size[0]);assert.equal(await card.evaluate(n=>n.scrollWidth>n.clientWidth),false);}
  await p.keyboard.press('Escape');await p.setViewportSize({width:1440,height:900});await p.getByRole('button',{name:'Your settings',exact:true}).click();await p.getByRole('button',{name:'Listening activity',exact:false}).click();
  await p.getByLabel('Share Reparty listening',{exact:false}).waitFor();assert.equal(await p.getByLabel('Share Reparty listening',{exact:false}).isChecked(),false);assert.equal(await p.getByLabel('Share Spotify listening',{exact:false}).isDisabled(),true);
  await p.getByLabel('Share Reparty listening',{exact:false}).check();await p.getByRole('button',{name:'Save changes',exact:true}).click();await p.waitForFunction(()=>!document.querySelector('.rc-editor').open);
  await p.evaluate(()=>repoReparty.open());await p.waitForFunction(()=>document.querySelector('#repo-reparty iframe')?.contentDocument?.readyState==='complete');
  const frame=p.frames().find(f=>f.url().includes('/reparty/'));
  const state={active:true,connected:true,listening:true,playing:true,paused:false,muted:false,volume:70,provider:'youtube',title:track.title,mediaId:track.id,position:65,duration:243,sampledAt:Date.now()};
  const publish=next=>frame.evaluate(s=>parent.postMessage({type:'repo-reparty-state',state:s},location.origin),next);
  await publish(state);await p.waitForFunction(()=>repoReparty.getState().listening);await p.waitForResponse(r=>r.url().endsWith('/api/community/listening')&&r.request().method()==='POST');
  assert.equal((await api('bob','profile?username=alice')).listening.title,track.title);
  const count=posts.length;for(let i=0;i<4;i++)await publish({...state,position:66+i});await p.waitForTimeout(700);assert.equal(posts.length,count,'timer updates stay local');
  await publish({...state,listening:false,playing:false,paused:true});await p.waitForResponse(r=>r.url().endsWith('/api/community/listening')&&r.request().postDataJSON()?.action==='stop');assert.equal((await api('bob','profile?username=alice')).listening,null);
  // Pausing during a delayed metadata request must not publish a stale song.
  let release;const metadataReady=new Promise(r=>release=r);await context.route(f.base+'/api/reparty-video?id=bcdefghijkl',async route=>{await metadataReady;await route.fulfill({json:{title:'Delayed song'}});});
  await publish({...state,mediaId:'bcdefghijkl',title:'Delayed song'});await p.waitForRequest(r=>r.url().includes('id=bcdefghijkl'));await publish({...state,mediaId:'bcdefghijkl',listening:false,playing:false,paused:true});release();await p.waitForTimeout(900);assert.equal((await api('bob','profile?username=alice')).listening,null);
  await p.evaluate(()=>repoListening.save({reparty:false,spotify:false}));assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM community_listening WHERE user_id=?').get(f.sessions.alice.user.id).n,0);
  assert.deepEqual(errors,[]);console.log('PASS: card/artwork/progress/link, opt-in settings, unavailable Spotify state, mobile layout, Reparty bridge, bounded updates, pause cleanup and delayed-metadata race.');
 }finally{await browser.close();await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
