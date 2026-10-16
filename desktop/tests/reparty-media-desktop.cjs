'use strict';
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const profile=await fs.mkdtemp(path.resolve(__dirname,'../qa/reparty-media-')),env={...process.env,REPARTY_TEST_PROFILE:profile};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:require('electron'),args:[path.join(__dirname,'reparty-media-fixture.cjs')],env});
 try{
  const page=await app.firstWindow();await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(()=>window.__states?.some(s=>s===1||String(s).startsWith('error:')),null,{timeout:30000,polling:250}).catch(()=>{});
  const sunoFrame=page.frames().find(f=>f.url().startsWith('https://suno.com/'));
  if(sunoFrame)await sunoFrame.waitForFunction(()=>document.querySelector('audio')?.readyState>=2,null,{timeout:30000,polling:250}).catch(()=>{});
  const result={blocked:await app.evaluate(()=>global.mediaTest.blocked),youtube:await page.evaluate(()=>window.__states),frames:[]};
  for(const frame of page.frames().slice(1))result.frames.push(await frame.evaluate(()=>({url:location.origin,body:document.body?.innerText?.slice(0,600),bridge:typeof window.repoDesktop,node:typeof require,media:[...document.querySelectorAll('audio,video')].map(e=>({paused:e.paused,ready:e.readyState,source:e.currentSrc?new URL(e.currentSrc).origin:''}))})).catch(e=>({error:e.message})));
  console.log(JSON.stringify(result,null,2));
  const pixels=await app.evaluate(async({BrowserWindow})=>(await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString('base64'));
  await fs.writeFile(path.resolve(__dirname,'../../../../outputs/reparty-provider-check.png'),Buffer.from(pixels,'base64'));
  assert(result.youtube.includes(1),'YouTube should reach actual playing state');
  const suno=result.frames.find(f=>f.url==='https://suno.com');assert(suno&&!suno.body.includes('This address is not part'),'Suno player should load');assert(suno.media.some(m=>m.ready>=2),'Suno audio should load through the official player');
  assert(result.frames.filter(f=>!f.error).every(f=>f.node==='undefined'&&f.bridge==='undefined'),'provider frames cannot access Node or the launcher bridge');
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
