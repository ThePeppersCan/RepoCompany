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
  await page.getByRole('progressbar',{name:'Your daily AI allowance'}).waitFor();
  assert.equal(await page.locator('.ws-ai-usage-heading').innerText(),'Daily usage');
  assert.match(await page.locator('.ws-ai-usage-detail').innerText(),/96 \/ 100 messages left/);
  assert.match(await page.locator('.ws-ai-usage').getAttribute('title'),/Other members do not use your allowance/);
  assert.equal(await page.locator('.ws-ai-usage time').getAttribute('datetime'),new Date(reset).toISOString());
  await page.getByRole('textbox',{name:'Ask Wibsworth',exact:true}).fill('Hello');
  await page.getByRole('button',{name:'Send question',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.ws-transcript').getAttribute('aria-busy')==='false');
  assert.match(await page.locator('.ws-answer-text').last().innerText(),/verified answer/);
  assert.match(await page.locator('.ws-ai-usage-detail').innerText(),/95 \/ 100 messages left/);
  assert.deepEqual(errors,[]);
  console.log('PASS: existing chat renders self-hosted personal daily usage, answer animation completes, and layout has no script errors.');
 }finally{await browser?.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
