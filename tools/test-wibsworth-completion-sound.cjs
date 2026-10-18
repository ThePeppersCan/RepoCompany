'use strict';
// Test the actual chat completion and audio mixer, with isolated AI responses.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fixture=await createFixture();let browser,release;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await fixture.browserContext(browser,'alice');
  const usage={used:2,limit:100,available:true,daily:{used:1,limit:10,resetAt:Date.now()+86400000}};
  await context.route(fixture.base+'/api/wibsworth/state',route=>route.fulfill({json:{available:true,usage,settings:{}}}));
  await context.route(fixture.base+'/api/wibsworth/chat',async route=>{
   const outcome=await new Promise(resolve=>release=resolve);release=null;
   try{await route.fulfill(outcome==='error'?{status:503,json:{error:'Test connection interrupted'}}:{json:{answer:'This answer should play the supplied sound only after all of its text has finished appearing. '.repeat(5),sources:[],usage}});}catch{}
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   window.__completionPlays=[];window.__completionAudio=null;
   const play=HTMLMediaElement.prototype.play;
   HTMLMediaElement.prototype.play=function(...args){
    if(this.dataset.sound==='wibsworthComplete'){
     window.__completionAudio=this;
     window.__completionPlays.push({src:this.src,volume:this.volume,hiddenBlocks:document.querySelectorAll('.ws-chat-assistant .ws-answer-text [hidden]').length});
    }
    return play.apply(this,args);
   };
  });
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto(fixture.base);await page.waitForFunction(()=>window.repoWibsworth&&window.repoAccount?.state.user);await page.evaluate(()=>repoWibsworth.open());
  const count=()=>page.evaluate(()=>__completionPlays.length);
  async function ask(){await page.getByRole('textbox',{name:'Ask Wibsworth',exact:true}).fill('Test the completion sound.');await page.getByRole('button',{name:'Send question',exact:true}).click();while(!release)await page.waitForTimeout(10);}
  async function done(){await page.waitForFunction(()=>document.querySelector('.ws-transcript').getAttribute('aria-busy')==='false');}
  assert.equal(await count(),0,'no sound on opening Wibsworth');
  await ask();assert.equal(await count(),0,'no sound while waiting for the answer');release('answer');
  await page.getByRole('button',{name:'Show answer',exact:true}).waitFor();await page.waitForTimeout(250);
  assert.equal(await count(),0,'no sound while text is still appearing');await done();assert.equal(await count(),1,'one sound after the full answer');
  await page.waitForFunction(()=>window.__completionAudio?.currentTime>0&&!window.__completionAudio.error);
  const playback=await page.evaluate(()=>({duration:__completionAudio.duration,record:__completionPlays[0]}));
  assert(Number.isFinite(playback.duration)&&playback.duration>0,'supplied MP3 decodes and plays');
  assert(playback.record.src.endsWith('/audio/wibsworth-answer-complete.mp3'),'correct supplied sound');assert.equal(playback.record.hiddenBlocks,0);
  console.log('PASS: supplied MP3 plays exactly once after the full answer; duration '+playback.duration.toFixed(2)+'s.');
  await ask();await page.getByRole('button',{name:'Stop',exact:true}).click();release('answer');await done();assert.equal(await count(),1,'stopped request is silent');
  await ask();release('error');await done();assert.equal(await count(),1,'failed request is silent');
  await ask();release('answer');await page.getByRole('button',{name:'Show answer',exact:true}).click();await done();assert.equal(await count(),2,'Show answer completes with one sound');
  await page.evaluate(()=>repoWorkspace.select('wibs'));await page.evaluate(()=>repoWibsworth.open());assert.equal(await count(),2,'returning to an existing answer is silent');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>document.querySelector('[data-audio]').click());assert.equal(await page.evaluate(()=>dashboardAudio.preferences().muted),true);
  await ask();release('answer');await done();assert.equal(await count(),2,'mute suppresses completion sound');
  await page.evaluate(()=>{document.querySelector('[data-audio]').click();dashboardAudio.setMix('effects',0);});
  await ask();release('answer');await done();assert.equal(await count(),2,'zero effects volume suppresses sound');
  await page.evaluate(()=>dashboardAudio.setMix('effects',.5));
  await ask();release('answer');await done();assert.equal(await count(),3,'next unmuted response plays normally with reduced motion');
  assert.equal(await page.evaluate(()=>__completionPlays.at(-1).volume),.2,'existing effects volume is respected');
  // Deterministic browser visibility models a minimized client or background tab.
  // The media element still decodes/plays, rather than merely counting an event.
  await page.evaluate(()=>{
   window.__background=false;
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>__background});
   Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>__background?'hidden':'visible'});
   window.__setBackground=value=>{__background=value;document.dispatchEvent(new Event('visibilitychange'));};
  });
  await ask();await page.evaluate(()=>{__setBackground(true);dashboardAudio.suspend(true);});release('answer');await done();
  assert.equal(await count(),4,'completion plays while hidden and launcher audio is suspended');
  await page.waitForFunction(()=>__completionAudio.currentTime>.05&&!__completionAudio.paused&&!__completionAudio.error);
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  assert.equal(await page.evaluate(()=>__completionAudio.paused),false,'visibility sync must not cut off the notification');
  await page.evaluate(()=>{__setBackground(false);dashboardAudio.suspend(false);});assert.equal(await count(),4,'restoring the client never replays it');
  await ask();await page.evaluate(()=>{__setBackground(true);document.querySelector('[data-audio]').click();});release('answer');await done();
  assert.equal(await count(),4,'background notifications still respect mute');
  await page.evaluate(()=>{__setBackground(false);document.querySelector('[data-audio]').click();});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await ask();release('answer');await page.getByRole('button',{name:'Show answer',exact:true}).waitFor();
  await page.evaluate(()=>__setBackground(true));await done();assert.equal(await count(),5,'switching tabs during the reveal completes and sounds once');
  await page.evaluate(()=>__setBackground(false));
  assert.deepEqual(errors,[]);console.log('PASS: cancellation, errors, Show answer, workspace switching, mute, effects volume, reduced motion, and no runtime errors.');
  console.log('PASS: hidden/minimized completion playback, uninterrupted notification, mute in background, and no replay on returning.');
 }finally{release?.('answer');await browser?.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
