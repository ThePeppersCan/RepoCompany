const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fixture=await createFixture();let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await fixture.browserContext(browser,'alice'),reset=Date.UTC(2026,10,1);
  const usage={provider:'self-hosted',unit:'messages',used:4,limit:100,resetAt:reset,available:true,exhaustedPeriod:null,daily:{used:4,limit:100,resetAt:Date.now()+86400000,available:true}};
  await context.route(fixture.base+'/api/wibsworth/state',route=>route.fulfill({json:{available:true,usage,settings:{}}}));
  await context.route(fixture.base+'/api/wibsworth/chat',route=>route.fulfill({json:{answer:'Here is the verified answer.',sources:[],usage:{...usage,used:5,daily:{...usage.daily,used:5}}}}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(fixture.base);await page.waitForFunction(()=>window.repoWibsworth&&window.repoAccount?.state.user);
  await page.evaluate(()=>repoWibsworth.open());
  await page.getByRole('progressbar',{name:'Your daily AI allowance'}).waitFor().catch(async error=>{console.error({errors,usage:await page.locator('.ws-ai-usage').count(),note:await page.locator('.ws-compose-note').allTextContents()});throw error;});
  assert.equal(await page.locator('.ws-ai-usage-heading').innerText(),'Daily usage');
  assert.match(await page.locator('.ws-ai-usage-detail').innerText(),/96 \/ 100 messages left/);
  assert.match(await page.locator('.ws-ai-usage').getAttribute('title'),/Other members do not use your allowance/);
  assert.equal(await page.locator('.ws-ai-usage time').getAttribute('datetime'),new Date(reset).toISOString());
  await page.getByRole('textbox',{name:'Ask Wibsworth',exact:true}).fill('Hello');
  await page.getByRole('button',{name:'Send question',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.ws-transcript').getAttribute('aria-busy')==='false');
  assert.match(await page.locator('.ws-answer-text').last().innerText(),/verified answer/);
  assert.match(await page.locator('.ws-ai-usage-detail').innerText(),/95 \/ 100 messages left/);
  // A launcher shell and a previously saved version choice must not impose a
  // gameplay-version gate. Rate errors retain the question and count down.
  await page.evaluate(()=>{document.documentElement.dataset.repoLauncher='true';localStorage.setItem('repo-wibsworth-game-context:'+repoAccount.state.user.id,'launcher-unknown');});
  let posted,attempt=0;
  await context.unroute(fixture.base+'/api/wibsworth/chat');
  await context.route(fixture.base+'/api/wibsworth/chat',route=>{
    posted=route.request().postDataJSON();attempt++;
    return route.fulfill(attempt===1?{status:429,json:{error:'You’ve sent three messages within a minute.',reason:'message-rate',retryAfterSeconds:2,retryAt:Date.now()+2000,usage}}:{json:{answer:'Glass Pepper increases incoming damage by 20%.',sources:[],usage}});
  });
  const input=page.getByRole('textbox',{name:'Ask Wibsworth',exact:true}),send=page.getByRole('button',{name:'Send question',exact:true});
  await input.fill('High damage on it');await send.click();
  await page.waitForFunction(()=>document.querySelector('.ws-chat-error').textContent.includes('Try again in'));
  assert.equal(await input.inputValue(),'High damage on it');assert.equal(await send.isDisabled(),true);
  assert.equal(Object.hasOwn(posted,'platform'),false);assert.equal(Object.hasOwn(posted,'gameVersion'),false);
  await page.waitForFunction(()=>document.querySelector('.ws-chat-error').textContent.includes('You can try again now.'));
  assert.equal(await send.isDisabled(),false);await send.click();
  await page.waitForFunction(()=>document.querySelector('.ws-transcript').getAttribute('aria-busy')==='false');
  assert.match(await page.locator('.ws-answer-text').last().innerText(),/incoming damage by 20%/);
  assert.deepEqual(errors,[]);
  console.log('PASS: daily usage, answer animation, launcher-independent gameplay context, visible retry countdown, retained question and no script errors.');
 }finally{await browser?.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
