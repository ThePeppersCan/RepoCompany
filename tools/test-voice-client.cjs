'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fixture=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture-only',SFU_APP_SECRET:'fixture-only'}});let browser;
 fixture.voiceHub.sfu=async()=>{throw Error('No SFU operation should happen before microphone consent.');};
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await fixture.browserContext(browser,'bob');
  await context.addInitScript(()=>{window.__captures=0;window.__stops=0;Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:()=>{window.__captures++;return new Promise(resolve=>{window.__captureResult=()=>resolve({getTracks:()=>[{stop:()=>{window.__stops++;}}]});});}});});
  const page=await context.newPage();await page.goto(fixture.base);await page.waitForFunction(()=>window.repoVoice?.getState().enabled);
  const caller={id:fixture.sessions.alice.user.id,name:'alice'};
  const created=await fixture.voiceHub.fetch(new Request('https://voice.internal/',{method:'POST',body:JSON.stringify({me:caller,op:'create',body:{client:crypto.randomUUID(),kind:'private',friends:['bob']}})}));assert.equal(created.status,200);
  await page.waitForFunction(()=>window.repoVoice.getState().incomingCall,{},{timeout:25000});assert.equal(await page.evaluate(()=>window.__captures),0);
  await page.evaluate(()=>window.repoMessaging.open());await page.getByRole('button',{name:'Answer',exact:true}).click();await page.waitForFunction(()=>window.__captures===1);
  await page.evaluate(()=>{window.repoAccount.state.user=null;dispatchEvent(new Event('repo-account-state'));window.__captureResult();});
  await page.waitForFunction(()=>window.__stops===1);assert.equal(await page.evaluate(()=>window.repoVoice.getState().callActive),false);
  console.log('PASS: an incoming hosted call never requests a microphone; signing out during a pending capture stops the late microphone track and clears native call state.');
  await context.close();
  const publicContext=await fixture.browserContext(browser,'mallory');
  await publicContext.addInitScript(()=>{window.__captures=0;Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:()=>{window.__captures++;return new Promise(()=>{});}});});
  const publicPage=await publicContext.newPage();await publicPage.goto(fixture.base);await publicPage.waitForFunction(()=>window.repoVoice?.getState().enabled);
  await publicPage.evaluate(()=>repoMessaging.open());
  assert.equal(await publicPage.getByRole('button',{name:'Join voice',exact:true}).count(),0);
  await publicPage.getByRole('button',{name:'Join RE-COMP voice',exact:true}).click();await publicPage.waitForFunction(()=>window.__captures===1);
  assert(fixture.voiceHub.state.rooms.some(r=>r.kind==='community'&&r.members[fixture.sessions.mallory.user.id]?.status==='joining'));
  console.log('PASS: the RE-COMP channel itself joins public voice and requests a microphone only after the click; there is no separate Join voice button.');
  await publicContext.close();
  const recovery=await fixture.browserContext(browser,'alice');
  await recovery.addInitScript(()=>{window.__failVoice=true;const original=window.fetch;window.fetch=(url,options)=>String(url).includes('/api/voice/state')&&window.__failVoice?Promise.reject(new DOMException('signal is aborted without reason','AbortError')):original(url,options);});
  const recoveryPage=await recovery.newPage();await recoveryPage.goto(fixture.base);await recoveryPage.waitForFunction(()=>repoVoice?.getState().serviceError);await recoveryPage.evaluate(()=>repoMessaging.open());
  await recoveryPage.getByText('Voice took too long to respond. Please try joining again.',{exact:true}).waitFor();assert.equal(await recoveryPage.getByText('signal is aborted without reason',{exact:true}).count(),0);
  await recoveryPage.evaluate(()=>{__failVoice=false;dispatchEvent(new Event('online'));});await recoveryPage.waitForFunction(()=>repoVoice.getState().enabled&&!repoVoice.getState().serviceError);assert.equal(await recoveryPage.locator('.repo-voice-panel').isVisible(),false);
  await recovery.close();console.log('PASS: interrupted voice requests display a useful error and recover automatically without endless loading.');
 }finally{await browser?.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
