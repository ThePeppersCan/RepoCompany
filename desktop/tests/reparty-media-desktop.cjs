'use strict';
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const profile=await fs.mkdtemp(path.resolve(__dirname,'../qa/reparty-media-')),env={...process.env,REPARTY_TEST_PROFILE:profile};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:require('electron'),args:[path.join(__dirname,'reparty-media-fixture.cjs')],env});
 try{
  const first=await app.firstWindow();await first.waitForLoadState('domcontentloaded');
  await first.waitForFunction(()=>window.__states?.includes(1),null,{timeout:30000,polling:250});
  await app.evaluate(async()=>{for(let i=0;i<100&&global.mediaTest.windows.length<2;i++)await new Promise(r=>setTimeout(r,100));});
  if(app.windows().length<2)await app.waitForEvent("window",{timeout:15000});const pages=app.windows();assert.equal(pages.length,2);
  const providers=[];
  for(const page of pages){await page.frameLocator('#reparty').frameLocator('iframe').locator('audio').waitFor({state:'attached',timeout:30000});const frame=page.frames().find(f=>f.url().startsWith('https://suno.com/'));await frame.waitForFunction(()=>{const a=document.querySelector('audio');return a?.readyState>=2&&!a.paused&&a.currentTime>20&&a.volume===.25;},null,{timeout:30000,polling:250});providers.push(frame);}
  const read=frame=>frame.evaluate(()=>{const a=document.querySelector('audio');return {time:a.currentTime,at:Date.now(),volume:a.volume,paused:a.paused,ready:a.readyState,bridge:typeof window.repoDesktop,node:typeof require};});
  const before=await Promise.all(providers.map(read));
  // Simulate a listener falling behind while both windows and the panel are hidden.
  await providers[1].evaluate(()=>{const a=document.querySelector('audio');a.pause();a.currentTime=3;});
  await providers[1].waitForFunction(()=>{const a=document.querySelector('audio');return !a.paused&&a.currentTime>20;},null,{timeout:10000,polling:250});
  const synced=await Promise.all(providers.map(read));const drift=Math.abs((synced[0].time-synced[0].at/1000)-(synced[1].time-synced[1].at/1000));assert(drift<.7,'listeners should converge to the room clock: '+drift);
  const update=async(volume,playing=true)=>app.evaluate((_,args)=>{const t=global.mediaTest;t.controllers[0].update({active:true,volume:args.volume,suno:{id:t.id,position:20+(Date.now()-t.start)/1000,sampledAt:Date.now(),playing:args.playing}});},{volume,playing});
  await update(0);await providers[0].waitForFunction(()=>document.querySelector('audio').volume===0);assert.equal((await read(providers[1])).volume,.25);
  await update(100);await providers[0].waitForFunction(()=>document.querySelector('audio').volume===1);
  await update(45,false);await providers[0].waitForFunction(()=>document.querySelector('audio').paused);assert.equal((await read(providers[1])).paused,false);
  await update(45,true);await providers[0].waitForFunction(()=>!document.querySelector('audio').paused);
  for(const p of pages){assert.equal(await p.locator('#call').evaluate(a=>a.volume),.35);assert.equal(await p.locator('#reparty').isVisible(),false);}
  assert((await app.evaluate(()=>global.mediaTest.windows.map(w=>w.isVisible()))).every(v=>!v));
  assert(synced.every(s=>s.bridge==='undefined'&&s.node==='undefined'));
  console.log(JSON.stringify({result:'PASS: two real Suno players start hidden, catch up after a stall, use independent volume/pause, preserve call volume, and expose no native bridge',driftSeconds:drift,before,synced,blocked:await app.evaluate(()=>global.mediaTest.blocked)},null,2));
 }catch(error){console.log(JSON.stringify(await app.evaluate(async()=>Promise.all(global.mediaTest.windows.map(async w=>({frames:await Promise.all(w.webContents.mainFrame.framesInSubtree.filter(f=>f.url.startsWith("https://suno.com/")).map(async f=>({url:f.url,parent:f.parent?.url,top:f.top?.url,equal:f.parent?.parent===f.top,media:await Promise.race([new Promise(r=>setTimeout(()=>r("inspection timeout"),2000)),f.executeJavaScript('JSON.stringify({hidden:document.hidden,installed:!!window.__repoSunoPlayback,audio:[...document.querySelectorAll("audio")].map(a=>({volume:a.volume,ready:a.readyState,paused:a.paused,time:a.currentTime,error:a.error?.message,src:a.currentSrc}))})').catch(e=>e.message)])})))})))),null,2));throw error;}finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
