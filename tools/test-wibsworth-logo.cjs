'use strict';
// Actual workspace/chat UI with an isolated account and controlled AI replies.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {createFixture}=require('./messaging-test-server.cjs');
(async()=>{
  const fixture=await createFixture();let browser,release=null;
  try{
    browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const context=await fixture.browserContext(browser,'alice');
    const answer='Wibsworth can help you explore Repo Company. This is a controlled test answer that appears progressively, so the logo must keep moving until the final words are visible. '.repeat(6);
    const usage={used:2,limit:100,available:true};
    await context.route(fixture.base+'/api/wibsworth/state',route=>route.fulfill({json:{available:true,usage,settings:{}}}));
    await context.route(fixture.base+'/api/wibsworth/chat',async route=>{
      const outcome=await new Promise(resolve=>release=resolve);release=null;
      try{await route.fulfill(outcome==='error'?{status:503,json:{error:'Test connection interrupted'}}:{json:{answer,sources:[],usage}});}catch{}
    });
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(fixture.base);
    await page.waitForFunction(()=>window.repoWibsworth&&window.repoAccount?.state.user);
    await page.evaluate(()=>window.repoWibsworth.open());
    const mark=page.locator('.ws-ai-mascot'),canvas=mark.locator('canvas');
    await page.waitForFunction(()=>document.querySelector('.ws-ai-mascot')?.dataset.renderer==='webgl');
    await page.mouse.move(5,5);await page.waitForTimeout(300);
    const idle=await canvas.screenshot();await page.waitForTimeout(200);assert.deepEqual(await canvas.screenshot(),idle,'idle must be completely still');
    assert.equal(await page.locator('.ws-welcome-mascot .mascot-face').count(),1,'welcome mascot unchanged');
    assert.equal(await mark.locator('.mascot-face').count(),0,'only sidebar uses new mark');
    const output=process.env.WIBSWORTH_LOGO_QA_DIR;if(output)fs.mkdirSync(output,{recursive:true});
    if(output)await page.screenshot({path:path.join(output,'wibsworth-sidebar-idle.png')});
    await mark.hover();await page.waitForTimeout(500);
    assert.notDeepEqual(await canvas.screenshot(),idle,'hover changes pixels');
    assert.equal(await mark.getAttribute('data-motion'),'hover');
    await page.mouse.move(5,5);await page.waitForFunction(()=>document.querySelector('.ws-ai-mascot').dataset.motion==='idle');
    assert.deepEqual(await canvas.screenshot(),idle,'leaving hover restores exact still image');
    console.log('PASS: exact idle, subtle hover, and original welcome mascot.');
    async function ask(text){await page.getByRole('textbox',{name:'Ask Wibsworth',exact:true}).fill(text);await page.getByRole('button',{name:'Send question',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.ws-ai-mascot').dataset.motion==='searching');while(!release)await page.waitForTimeout(10);}
    async function settled(){await page.waitForFunction(()=>document.querySelector('.ws-transcript').getAttribute('aria-busy')==='false');await page.waitForFunction(()=>document.querySelector('.ws-ai-mascot').dataset.motion==='idle');}
    await ask('Tell me about Repo Company.');await page.waitForTimeout(1700);
    assert.equal(await page.locator('.ws-chat-assistant .mascot-face').count(),1,'small reply mascot unchanged');
    const searching=await canvas.screenshot();await page.waitForTimeout(180);assert.notDeepEqual(await canvas.screenshot(),searching,'search really animates');
    if(output)await page.screenshot({path:path.join(output,'wibsworth-sidebar-searching.png')});
    release('answer');await page.getByRole('button',{name:'Show answer',exact:true}).waitFor();
    await page.waitForTimeout(600);assert.equal(await mark.getAttribute('data-motion'),'searching','search persists while answer is appearing');
    await settled();assert.deepEqual(await canvas.screenshot(),idle,'finished answer restores exact still image');
    assert.equal((await page.locator('.ws-chat-assistant .ws-answer-text').innerText()).trim(),answer.trim());
    console.log('PASS: search continues through answer playback and settles only on completion.');
    await ask('Stop this question.');await page.getByRole('button',{name:'Stop',exact:true}).click();release('answer');await settled();
    assert.equal(await page.getByRole('textbox',{name:'Ask Wibsworth',exact:true}).inputValue(),'Stop this question.');
    await ask('Return a test error.');release('error');await settled();assert.match(await page.locator('.ws-chat-error').innerText(),/Test connection interrupted/);
    await ask('Switch between workspaces.');await page.evaluate(()=>repoWorkspace.select('wibs'));await page.waitForTimeout(250);
    await page.evaluate(()=>repoWibsworth.open());await page.waitForFunction(()=>document.querySelector('.ws-ai-mascot').dataset.motion==='searching');
    release('answer');await page.getByRole('button',{name:'Show answer',exact:true}).click();await settled();
    console.log('PASS: cancellation, failure, workspace switch, and Show answer.');
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
    await askReduced();
    async function askReduced(){await page.getByRole('textbox',{name:'Ask Wibsworth',exact:true}).fill('Respect reduced motion.');await page.getByRole('button',{name:'Send question',exact:true}).click();while(!release)await page.waitForTimeout(10);const still=await canvas.screenshot();await page.waitForTimeout(200);assert.deepEqual(await canvas.screenshot(),still);release('answer');await settled();}
    await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Open sidebar',exact:true}).click();await mark.waitFor({state:'visible'});
    if(output)await page.screenshot({path:path.join(output,'wibsworth-sidebar-mobile.png')});
    assert(await mark.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}),'mobile logo fits');
    const fallbackPage=await context.newPage();await fallbackPage.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl'?null:get.call(this,kind,...args);};});
    await fallbackPage.goto(fixture.base);await fallbackPage.waitForFunction(()=>window.repoWibsworth&&window.repoAccount?.state.user);await fallbackPage.evaluate(()=>repoWibsworth.open());
    await fallbackPage.waitForFunction(()=>document.querySelector('.ws-ai-mascot').dataset.renderer==='static');assert(await fallbackPage.locator('.ws-logo-fallback svg').isVisible(),'WebGL fallback stays visible');
    assert.deepEqual(errors,[],'no runtime errors');console.log('PASS: reduced motion, mobile fit, static fallback, and runtime errors.');
  }finally{release?.('answer');await browser?.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
