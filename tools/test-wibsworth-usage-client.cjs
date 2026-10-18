'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fixture=await createFixture();let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await fixture.browserContext(browser,'alice');
  const tomorrow=Date.now()+86400000,month=tomorrow+86400000*10;
  const exhausted={used:45000,limit:279000,available:false,exhaustedPeriod:'day',blockedUntil:tomorrow,resetAt:month,daily:{used:9000,limit:9000,resetAt:tomorrow,available:false}};
  const available={...exhausted,available:true,exhaustedPeriod:null,blockedUntil:null,daily:{...exhausted.daily,used:2250,available:true}};
  let state={available:false,usage:exhausted,settings:{}},chatRequests=0,response={status:200,json:{answer:'The allowance has reset. Here is your answer.',sources:[],usage:available}};
  await context.route(fixture.base+'/api/wibsworth/state',route=>route.fulfill({json:state}));
  await context.route(fixture.base+'/api/wibsworth/chat',route=>{chatRequests++;return route.fulfill(response);});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__sounds=0;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){if(this.dataset.sound==='wibsworthComplete')__sounds++;return play.apply(this,args);};});
  const input=page.getByRole('textbox',{name:'Ask Wibsworth',exact:true}),send=page.getByRole('button',{name:'Send question',exact:true});
  async function open(){await page.goto(fixture.base);await page.waitForFunction(()=>window.repoWibsworth&&window.repoAccount?.state.user);await page.evaluate(()=>repoWibsworth.open());await page.getByRole('progressbar',{name:'Shared daily AI allowance'}).waitFor();await page.waitForFunction(()=>document.querySelector('.ws-ai-usage-detail').textContent.includes('remaining'));}
  async function ask(question='Can you help me?'){await input.fill(question);assert.equal(await send.isDisabled(),false,'exhausted allowance leaves Send enabled');await send.click();}
  async function done(){await page.waitForFunction(()=>document.querySelector('.ws-transcript').getAttribute('aria-busy')==='false');}
  const sounds=()=>page.evaluate(()=>__sounds);
  const lastAnswer=()=>page.locator('.ws-chat-assistant .ws-answer-text').last().innerText();
  await open();await page.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await page.locator('.ws-ai-usage-heading').innerText(),'Daily usage');
  assert.equal(await page.getByRole('progressbar',{name:'Shared daily AI allowance'}).getAttribute('aria-valuenow'),'100','meter uses daily usage, not the monthly amount');
  assert.equal(await page.locator('.ws-ai-usage time').getAttribute('datetime'),new Date(tomorrow).toISOString());
  const start=Date.now();await ask();await page.waitForFunction(()=>document.querySelector('.ws-ai-mascot').dataset.motion==='searching');
  await page.waitForTimeout(650);assert.match(await lastAnswer(),/Having a think/);assert.equal(await sounds(),0);assert.equal(chatRequests,0);
  await done();assert(Date.now()-start>=2100,'thinking remains visible before the local reply');
  const expected=await page.evaluate(when=>"You're out of usage until "+new Date(when).toLocaleString('en-GB',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'})+'.',tomorrow);
  assert.equal(await lastAnswer(),expected);assert.equal(await sounds(),1);assert.equal(chatRequests,0,'known exhausted allowance never calls AI chat');
  await ask('Try again');await done();assert.equal(await sounds(),2);assert.equal(chatRequests,0);
  await ask('Cancel this');await page.getByRole('button',{name:'Stop',exact:true}).click();await done();await page.waitForTimeout(2300);
  assert.equal(await sounds(),2);assert.equal(await input.inputValue(),'Cancel this');assert.equal(chatRequests,0,'cancelling local thinking is silent and costs nothing');
  state={available:false,usage:{...exhausted,exhaustedPeriod:'month',blockedUntil:month,daily:available.daily},settings:{}};
  await open();await page.emulateMedia({reducedMotion:'reduce'});await ask();await done();
  assert.equal(await page.getByRole('progressbar',{name:'Shared daily AI allowance'}).getAttribute('aria-valuenow'),'25');
  assert.match(await page.locator('.ws-ai-daily-pause').innerText(),/Monthly allowance reached/);assert.equal(chatRequests,0);
  assert((await lastAnswer()).includes(await page.evaluate(when=>new Date(when).toLocaleString('en-GB',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}),month)),'monthly cap uses its true reset');
  state={available:true,usage:available,settings:{}};
  response={status:429,json:{error:'Daily allowance reached',allowanceResetAt:tomorrow,usage:exhausted}};
  await open();await ask('Discover the limit');await done();assert.equal(chatRequests,1);assert.equal(await lastAnswer(),expected);assert.equal(await page.locator('.ws-chat-error').innerText(),'');
  await ask('The limit is known now');await done();assert.equal(chatRequests,1);
  response={status:429,json:{error:'Personal allowance reached',allowanceResetAt:tomorrow,usage:available}};
  await open();await ask('Personal limit');await done();assert.equal(chatRequests,2);assert.equal(await lastAnswer(),expected);
  await ask('Personal limit is known');await done();assert.equal(chatRequests,2,'personal limit notice is cached without blocking other users');
  response={status:429,json:{error:'Please try again in a minute.',usage:available}};
  await open();await ask('A temporary rate limit');await done();assert.match(await page.locator('.ws-chat-error').innerText(),/try again in a minute/);assert.equal(await sounds(),0,'ordinary API errors do not masquerade as quota replies');
  state={available:false,usage:{...exhausted,blockedUntil:Date.now()-1000},settings:{}};
  response={status:200,json:{answer:'The allowance has reset. Here is your answer.',sources:[],usage:available}};
  await open();await ask('After reset');await done();assert.equal(await lastAnswer(),response.json.answer);assert.equal(chatRequests,4,'expired usage notice lets the server admit a new answer');
  assert.deepEqual(errors,[]);
  console.log('PASS: daily meter, local timed thinking and completion sound, no chat calls while exhausted, repeat/cancel, shared/personal/monthly reset replies, quota discovery, ordinary errors, and reset recovery.');
 }finally{await browser?.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
