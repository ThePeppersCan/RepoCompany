'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const selectors={morogue:'.motion-uncrowned',moratales:'.motion-moratales',manager:'.motion-manager'};
const gameId=process.argv[2]||'morogue';assert.ok(Object.hasOwn(selectors,gameId));
const selector=selectors[gameId];
(async()=>{
 const output=path.resolve(process.env.REPO_MOTION_OUTPUT||path.join(__dirname,'../../../'+gameId+'-loader-preview'));await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:600,height:600},deviceScaleFactor:1,bypassCSP:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(gameId=>{
   let id=0;const callbacks=new Map();window.motionTime=0;
   window.requestAnimationFrame=cb=>{callbacks.set(++id,cb);return id;};window.cancelAnimationFrame=id=>callbacks.delete(id);
   Object.defineProperty(performance,'now',{value:()=>window.motionTime});
   window.stepMotion=t=>{window.motionTime=t;const pending=[...callbacks.values()];callbacks.clear();for(const cb of pending)cb(t);};
   window.fixture={entryVisible:true,portalReady:true,account:{status:'online'},activeGame:{id:gameId,name:gameId,loading:true},library:{}};
   window.repoLauncher={getState:async()=>fixture,onState:fn=>{window.receiveFixture=fn;return()=>{};}};
  },gameId);
  await page.goto(pathToFileURL(path.join(__dirname,'../renderer/index.html')).href);
  await page.waitForFunction(()=>window.repoBrandMotion&&window.receiveFixture);
  await page.addStyleTag({content:'.titlebar{display:none!important}.website-fallback{inset:0;padding:0;background:#000}.entry-atmosphere{display:none}.connection-card{padding:0;width:100%}.brand-loader{width:360px;height:360px;margin:0 auto;animation:none!important}'});
  for(let i=0;i<140;i++){await page.evaluate(t=>stepMotion(t),i*40);await page.screenshot({path:path.join(output,String(i).padStart(3,'0')+'.png')});}
  await page.evaluate(()=>stepMotion(5600));assert.deepEqual(await page.screenshot(),await fs.readFile(path.join(output,'000.png')),'Loop returns exactly to its first frame.');
  await page.evaluate(()=>{repoBrandMotion.setActive(false);});assert.equal(await page.locator(selector).getAttribute('opacity'),'0');assert.equal(await page.locator('.motion-rest').getAttribute('opacity'),'1');
  await page.evaluate(()=>{repoBrandMotion.setActive(true);stepMotion(8500);});await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>stepMotion(8501));assert.equal(await page.locator(selector).getAttribute('opacity'),'0');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>{receiveFixture({...fixture,activeGame:{id:'dragonbound',name:'Dragonbound',loading:true}});stepMotion(10000);});assert.equal(await page.locator(selector).getAttribute('opacity'),'0');
  await page.evaluate(()=>{receiveFixture({...fixture,requiredUpdate:{locked:true,phase:'downloading'},launcherUpdate:{status:'downloading',progress:.5}});stepMotion(12000);});assert.equal(await page.locator(selector).getAttribute('opacity'),'0');
  await page.evaluate(()=>{receiveFixture(fixture);stepMotion(13456);});assert.equal(await page.locator(selector).getAttribute('opacity'),'1');
  for(const other of Object.values(selectors).filter(s=>s!==selector))assert.equal(await page.locator(other).getAttribute('opacity'),'0','Only the current game animation is visible.');
  await page.addStyleTag({content:'.brand-loader{width:164px;height:164px}'});await page.screenshot({path:path.join(output,'actual-size.png')});
  await page.evaluate(()=>{window.completions=0;repoBrandMotion.setIntro('two-loops',2,()=>completions++);repoBrandMotion.setActive(true);stepMotion(16000);stepMotion(18800);});
  assert.equal(await page.evaluate(()=>completions),0,'One loop must not reveal the game.');
  await page.evaluate(()=>stepMotion(21599));assert.equal(await page.evaluate(()=>completions),0);
  await page.evaluate(()=>stepMotion(21600));assert.equal(await page.evaluate(()=>completions),1);
  await page.evaluate(()=>{repoBrandMotion.setIntro('two-loops',2,()=>completions++);repoBrandMotion.setActive(true);stepMotion(30000);});assert.equal(await page.evaluate(()=>completions),1,'Repeated state updates must not restart a completed intro.');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(()=>{repoBrandMotion.setIntro('reduced',2,()=>completions++);repoBrandMotion.setActive(true);stepMotion(40000);stepMotion(45600);});assert.equal(await page.evaluate(()=>completions),2);assert.equal(await page.locator('.motion-rest').getAttribute('opacity'),'1');
  await page.evaluate(()=>{repoBrandMotion.setIntro('cancelled',2,()=>completions++);repoBrandMotion.setActive(true);stepMotion(60000);repoBrandMotion.setIntro(null);repoBrandMotion.setActive(false);stepMotion(80000);});assert.equal(await page.evaluate(()=>completions),2);
  assert.deepEqual(errors,[]);console.log('PASS '+gameId+': 140 rendered frames, exact loop seam, two-loop completion once, reduced-motion timing, cancellation, game selection and generic update animation. Preview: '+output);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});


