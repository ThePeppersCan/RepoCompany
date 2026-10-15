'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fixture=await createFixture(),browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await fixture.browserContext(browser,'alice'),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>{
   window.__inputs=[];window.__constraints=[];
   navigator.mediaDevices.enumerateDevices=async()=>[{kind:'audioinput',deviceId:'mic-a',label:'USB microphone'},{kind:'audioinput',deviceId:'mic-b',label:'Headset microphone'},{kind:'audiooutput',deviceId:'speaker-a',label:'Headphones'},{kind:'audiooutput',deviceId:'bad-output',label:'Disconnected speaker'}];
   HTMLMediaElement.prototype.setSinkId=async function(id){if(id==='bad-output')throw new DOMException('Speaker disconnected','NotFoundError');this.__sink=id;};
   navigator.mediaDevices.getUserMedia=async options=>{__constraints.push(options);const ctx=new AudioContext(),tone=ctx.createOscillator(),gain=ctx.createGain(),dest=ctx.createMediaStreamDestination();gain.gain.value=.0001;tone.connect(gain).connect(dest);tone.start();await ctx.resume();const input={ctx,gain,stream:dest.stream};__inputs.push(input);if(window.__delayCapture)await new Promise(r=>window.__finishCapture=r);return dest.stream;};
  });
  await page.route(fixture.base+'/api/voice/**',route=>route.fulfill({json:{enabled:true,rooms:[],community:{members:[]},budget:{available:true,used:0,resetAt:Date.now()+86400000}}}));
  await page.goto(fixture.base);await page.waitForFunction(()=>window.repoCommunity&&repoVoice.getState().enabled);await page.evaluate(()=>repoMessaging.open());await page.getByRole('button',{name:'Voice settings',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Voice & audio'});await dialog.waitFor();assert.equal(await page.evaluate(()=>__inputs.length),0);
  await dialog.getByLabel('Microphone',{exact:true}).selectOption('mic-a');await page.waitForFunction(()=>repoVoiceAudio.get().inputId==='mic-a');
  await dialog.getByLabel('Speaker',{exact:true}).selectOption('speaker-a');await page.waitForFunction(()=>repoVoiceAudio.get().outputId==='speaker-a');
  await dialog.getByLabel('Speaker',{exact:true}).selectOption('bad-output');await dialog.getByText('That device is unavailable. Choose a connected device or System default.').waitFor();assert.equal(await page.evaluate(()=>repoVoiceAudio.get().outputId),'speaker-a');
  await dialog.getByLabel('Voice volume',{exact:true}).fill('37');await page.waitForFunction(()=>repoVoiceAudio.get().outputVolume===37);
  assert.deepEqual(await page.evaluate(async()=>{const a=new Audio();await repoVoiceAudio.output(a);return {sink:a.__sink,volume:a.volume};}),{sink:'speaker-a',volume:.37});
  await dialog.getByRole('checkbox',{name:'Noise suppression',exact:false}).uncheck();await page.waitForFunction(()=>!repoVoiceAudio.get().noiseSuppression);
  await dialog.getByRole('button',{name:'Test microphone',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.rv-meter-label').textContent==='Microphone is quiet or muted');
  assert.equal(await page.evaluate(()=>__constraints[0].audio.deviceId.exact),'mic-a');assert.equal(await page.evaluate(()=>__constraints[0].audio.noiseSuppression),false);
  await page.evaluate(()=>__inputs[0].gain.gain.value=.1);await page.waitForFunction(()=>document.querySelector('.rv-meter').classList.contains('is-open'));
  await dialog.getByLabel('Sensitivity',{exact:true}).fill('-10');await page.waitForFunction(()=>repoVoiceAudio.get().sensitivity===-10&&!document.querySelector('.rv-meter').classList.contains('is-open'));
  assert.equal(await page.evaluate(()=>__inputs.length),1);assert.equal(await page.evaluate(()=>__inputs[0].stream.getAudioTracks()[0].readyState),'live');
  await dialog.getByRole('button',{name:'Close voice settings'}).click();assert.equal(await page.evaluate(()=>__inputs[0].stream.getAudioTracks()[0].readyState),'ended');
  // Measure the actual processed stream, not only UI flags or worklet messages.
  const measure=async()=>page.evaluate(async()=>{await new Promise(r=>setTimeout(r,350));const b=new Float32Array(__analyser.fftSize);__analyser.getFloatTimeDomainData(b);return Math.sqrt(b.reduce((s,v)=>s+v*v,0)/b.length);});
  await page.evaluate(async()=>{window.__capture=await repoVoiceAudio.capture({...repoVoiceAudio.get(),sensitivity:-30,inputVolume:100,voiceActivation:true});window.__last=__inputs.at(-1);window.__measureContext=new AudioContext();window.__analyser=__measureContext.createAnalyser();__analyser.fftSize=2048;__measureContext.createMediaStreamSource(__capture.stream).connect(__analyser);await __measureContext.resume();__last.gain.gain.value=.001;});
  assert(await measure()<.00001,'quiet sound must be gated in the transmitted stream');
  await page.evaluate(()=>__last.gain.gain.value=.1);const normal=await measure();assert(normal>.05&&normal<.09);
  await page.evaluate(()=>__capture.configure({...repoVoiceAudio.get(),sensitivity:-30,inputVolume:200,voiceActivation:true}));const loud=await measure();assert(loud>normal*1.8&&loud<normal*2.2);
  await page.evaluate(()=>__capture.setMuted(true));assert(await measure()<.00001,'mute must silence actual processed audio');
  await page.evaluate(()=>{__capture.setMuted(false);__last.gain.gain.value=.001;__capture.configure({...repoVoiceAudio.get(),inputVolume:100,voiceActivation:false});});assert(await measure()>.0004,'bypass must pass quiet sound');
  await page.evaluate(()=>__capture.stop());assert.equal(await page.evaluate(()=>__last.stream.getTracks().every(t=>t.readyState==='ended')&&__capture.stream.getTracks().every(t=>t.readyState==='ended')),true);
  await page.reload();await page.waitForFunction(()=>window.repoCommunity);assert.deepEqual(await page.evaluate(()=>({input:repoVoiceAudio.get().inputId,output:repoVoiceAudio.get().outputId,volume:repoVoiceAudio.get().outputVolume})),{input:'mic-a',output:'speaker-a',volume:37});
  await page.evaluate(()=>{repoVoiceAudio.save({...repoVoiceAudio.get(),noiseSuppression:true,sensitivity:-55,outputVolume:100});repoMessaging.open();repoVoice.openSettings();});await page.waitForTimeout(120);await page.screenshot({path:path.resolve(__dirname,'../../../outputs/voice-settings-preview.png')});
  await page.setViewportSize({width:390,height:844});assert.equal(await dialog.evaluate(n=>n.scrollWidth>n.clientWidth),false);const box=await dialog.boundingBox();assert(box.x>=10&&box.x+box.width<=380);await page.screenshot({path:path.resolve(__dirname,'../../../outputs/voice-settings-mobile-preview.png')});
  await page.evaluate(()=>window.__delayCapture=true);await dialog.getByRole('button',{name:'Test microphone',exact:true}).click();await page.waitForFunction(()=>window.__finishCapture);await dialog.getByRole('button',{name:'Close voice settings'}).click();await page.evaluate(()=>__finishCapture());await page.waitForFunction(()=>__inputs[0].stream.getTracks().every(t=>t.readyState==='ended'));
  assert.deepEqual(errors,[]);console.log('PASS: device preferences persist; failed speakers roll back; mic tests require a click and stop on close, including pending capture; real processed audio verifies sensitivity, gain, bypass and mute; settings fit mobile.');
 }finally{await browser.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
