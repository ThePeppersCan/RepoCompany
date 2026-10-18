// Exercise actual browser -> request -> chat handler -> reviewed answer -> saved
// context. Only account identity/state are fixtures; there is no model bridge.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fixture=await createFixture();let browser;
 try{
  for(const name of ['dashboard-wibsworth-schema.sql','dashboard-wibsworth-local-schema.sql','dashboard-wibsworth-learning-schema.sql'])fixture.sql.exec(fs.readFileSync(path.join(__dirname,'..',name),'utf8'));
  const {createWibsworthHandler}=await import('../lib/wibsworth-service.mjs');
  const {retrieveKnowledge,isCanonicalProduct}=await import('../lib/wibsworth-knowledge.mjs');
  let now=Date.now();const posts=[];
  const env={...fixture.env,WIBSWORTH_AI_ENABLED:'true',WIBSWORTH_PROVIDER:'ks5b',WIBSWORTH_BRIDGE_SECRET:'s'.repeat(64)};
  const handler=createWibsworthHandler({config:{},retrieveKnowledge,isCanonicalProduct,clock:()=>now,identify:async()=>fixture.sessions.alice.user});
  browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await fixture.browserContext(browser,'alice');
  const usage={provider:'self-hosted',unit:'messages',used:0,limit:100,available:true,resetAt:now+86400000};
  await context.route(fixture.base+'/api/wibsworth/state',route=>route.fulfill({json:{available:true,usage,settings:{}}}));
  await context.route(fixture.base+'/api/wibsworth/chat',async route=>{
   now+=61000;const r=route.request(),body=r.postDataJSON();posts.push(body);
   const response=await handler({request:new Request(r.url(),{method:'POST',headers:r.headers(),body:JSON.stringify(body)}),env,params:{path:['chat']}});
   await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  async function open(){await page.goto(fixture.base);await page.waitForFunction(()=>window.repoWibsworth&&window.repoAccount?.state.user);await page.evaluate(()=>repoWibsworth.open());await page.getByRole('progressbar',{name:'Your daily AI allowance'}).waitFor();}
  const input=page.getByRole('textbox',{name:'Ask Wibsworth',exact:true}),send=page.getByRole('button',{name:'Send question',exact:true});
  async function ask(question,expected){await input.fill(question);await send.click();await page.waitForFunction(()=>document.querySelector('.ws-transcript').getAttribute('aria-busy')==='false');const answer=await page.locator('.ws-chat-assistant .ws-answer-text').last().innerText();assert.match(answer,expected,question);assert.doesNotMatch(answer,/reliable answer|maze|puzzle game|dont have specific information/i,question);return answer;}
  await open();
  await ask('what is repo company',/Repo Company.*Wibs.*Reparty/s);
  const firstMore=await ask('tell me more',/Moratales.*café.*Velmora Manager.*club.*Morogue.*roguelite/s);
  assert.equal(posts.at(-1).context.focus[0],'site-overview');
  await open();await page.locator('.ws-chat-history').getByRole('button',{name:'what is repo company',exact:true}).click();
  const secondMore=await ask('go on',/Wibs.*direct messages.*Reparty.*Account/s);
  assert.notEqual(secondMore,firstMore);assert(posts.at(-1).context.seen.includes('moratales-overview'),'Reopening retains expansion progress');
  await ask('well about the games',/Moratales.*café.*Velmora Manager.*club.*Morogue.*roguelite/s);
  await ask('could you elaborate?',/WASD.*five save slots.*Espresso Brioche/s);
  assert.equal(posts.at(-1).context.section,'games');
  await ask('tell me more about morgue',/Espresso Brioche.*Passive bonuses.*Night pantry/s);
  await ask('what do you know',/Mora Mode.*two rerolls.*Options/s);
  await ask('yeah i am looking for details about the game',/keeps the moon coins/);
  await page.locator('.ws-ai-sidebar .ws-new-chat').click();
  await ask('Tell me about Velmora Manager',/fantasy sports management/);
  assert.equal(posts.at(-1).context,undefined);
  await ask('more details please',/five save slots.*Central.*288 clubs/s);
  await page.locator('.ws-ai-sidebar .ws-new-chat').click();
  await ask('Tell me about Moratales',/story and life simulation/);
  await ask('tell me a little more',/WASD.*Food Wiki.*Greenhouse crops/s);
  assert.deepEqual(errors,[]);
  console.log('PASS: 12 browser turns through the actual handler, screenshot chain, game descriptions, contextual Morgue typo, repeated expansion, reopened-chat progress, new chats and all three games. No bridge or live model requests.');
 }finally{await browser?.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
