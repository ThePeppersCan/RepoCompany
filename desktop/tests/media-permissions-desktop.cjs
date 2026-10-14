'use strict';
// Synthetic devices only: this test never opens a physical camera/microphone.
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const profile=await fs.mkdtemp(path.join(root,'qa/media-permission-')),env={...process.env,REPO_LAUNCHER_FIXTURES:'1',REPO_LAUNCHER_HIDDEN_TEST:'1',REPO_LAUNCHER_TEST_PROFILE:profile};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:require('electron'),args:[root,'--use-fake-device-for-media-stream'],env});
 try{
  const shell=await app.firstWindow();await shell.waitForFunction(()=>window.repoLauncher);
  let portal;for(let i=0;i<200;i++){portal=app.context().pages().find(p=>p.url().startsWith('https://repocompany.uk/'));if(portal)break;await new Promise(r=>setTimeout(r,50));}assert(portal);
  await portal.locator('#sign-in').click();await shell.evaluate(()=>repoLauncher.refresh());await shell.waitForFunction(async()=>(await repoLauncher.getState()).account.status==='online');
  await app.evaluate(({dialog})=>{globalThis.__mediaPrompts=[];dialog.showMessageBox=async(_window,options)=>{globalThis.__mediaPrompts.push(options.message);return {response:1};};});
  const capture=await portal.evaluate(async()=>{const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:true});const result=stream.getTracks().map(t=>({kind:t.kind,state:t.readyState}));stream.getTracks().forEach(t=>t.stop());return result;});
  assert.deepEqual(capture.map(t=>t.kind).sort(),['audio','video']);assert(capture.every(t=>t.state==='live'));
  const prompts=await app.evaluate(()=>globalThis.__mediaPrompts);assert.deepEqual(prompts,['Allow your microphone and camera for calls?']);
  await portal.evaluate(()=>new Promise(resolve=>{const frame=document.createElement('iframe');frame.id='media-child';frame.srcdoc='<p>Permission isolation fixture</p>';frame.onload=resolve;document.body.append(frame);}));
  const child=portal.frames().find(f=>f!==portal.mainFrame());assert(child);
  const denied=await child.evaluate(async()=>{try{const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop());return false;}catch(e){return e.name==='NotAllowedError';}});assert.equal(denied,true);
  await portal.locator('#sign-out').click();await shell.evaluate(()=>repoLauncher.refresh());
  const signedOut=await portal.evaluate(async()=>{try{const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop());return false;}catch(e){return e.name==='NotAllowedError';}});assert.equal(signedOut,true);
  assert.equal((await app.evaluate(()=>globalThis.__mediaPrompts)).length,1);
  console.log('PASS native media permissions: explicit portal prompt, synthetic audio/video, iframe denied, sign-out revokes access.');
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
