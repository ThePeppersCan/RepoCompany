'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const {createFixture}=require('./messaging-test-server.cjs');
const dist=path.resolve(__dirname,'../dist'),shots=process.env.BROOMFLIGHT_SCREENSHOTS;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.json':'application/json','.webp':'image/webp','.mp3':'audio/mpeg','.woff2':'font/woff2'};
(async()=>{
 const fixture=await createFixture(),browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true}),errors=[],failed=[];
 try{
  async function serve(c,native=false){
   await c.route(fixture.base+'/**',async route=>{
    const u=new URL(route.request().url());if(u.pathname.startsWith('/api/'))return route.fallback();
    let p=/^\/(?:Demos(?:\/.*)?)?$/.test(u.pathname)?'/index.html':u.pathname;
    if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(dist,'.'+p);
    if(!file.startsWith(dist+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
    if(native&&p==='/index.html')return route.fulfill({contentType:'text/html',body:fs.readFileSync(file,'utf8').replace('<html','<html data-repo-launcher="true"')});
    return route.fulfill({path:file,contentType:mime[path.extname(file)]||'application/octet-stream'});
   });
   c.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().includes('/broomflight/')&&r.status()>=400)failed.push(r.url());});});
  }
  const c=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});await serve(c);
  const page=await c.newPage();
  const state=()=>page.evaluate(()=>__BROOMFLIGHT.state());
  const step=(n,draw=false)=>page.evaluate(({n,draw})=>__BROOMFLIGHT.step(n,draw),{n,draw});
  async function shot(name){if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,name+'.png')});}}
  await page.goto(fixture.base+'/broomflight/?capture=1');await page.waitForFunction(()=>window.__BROOMFLIGHT?.ready);
  assert.equal((await state()).phase,'title');assert.equal((await state()).effects.enabled,false,'Reduced-motion preference is respected');
  assert.equal(await page.locator('#loading').isVisible(),false);
  await shot('title');
  await page.getByRole('button',{name:/Take flight/}).click();await page.keyboard.down('w');await step(421,true);
  let s=await state();assert.equal(s.phase,'racing');assert(s.player.speed>20);assert(s.player.s>50);assert(s.riders.every(r=>r.s>30),'All four broom riders race');
  await shot('flight');
  const startLane=s.player.lateral;
  await page.keyboard.down('d');await step(20);await page.keyboard.up('d');assert((await state()).player.lateral>startLane+.2,'Keyboard steering changes the flight line');
  await page.keyboard.down('Space');await step(90);s=await state();assert(s.player.y>7&&s.player.y<10&&s.player.airborne,'Space climbs within the flight envelope');
  await page.keyboard.down('4');await step(100);s=await state();assert(s.player.score>=350,'A completed barrel roll scores');const score=s.player.score;
  await step(100);assert.equal((await state()).player.score,score,'Holding a trick cannot repeatedly award points');
  await page.keyboard.up('4');await page.keyboard.up('Space');await step(150);s=await state();assert(s.player.y<2.4&&!s.player.airborne,'Releasing Space swoops back to low flight');
  const boost=s.player.boost;
  await page.keyboard.down('Shift');await step(50);await page.keyboard.up('Shift');s=await state();assert(s.player.boost<boost);assert(s.player.speed>30);
  await page.keyboard.up('w');const speed=s.player.speed;await page.keyboard.down('s');await step(60);await page.keyboard.up('s');assert((await state()).player.speed<speed-8,'Braking slows the broom');
  await page.keyboard.press('Escape');await step(1);s=await state();assert.equal(s.phase,'paused');const pausedS=s.player.s,pausedTime=s.time;
  await step(120);s=await state();assert.equal(s.player.s,pausedS);assert.equal(s.time,pausedTime);
  assert.equal(await page.locator('#pause-panel').isVisible(),true);
  await page.keyboard.press('Escape');await step(1);assert.equal((await state()).phase,'racing');
  await page.getByRole('button',{name:'Toggle game sound'}).click();assert.equal(await page.locator('#sound-state').textContent(),'Off');
  await page.keyboard.down('w');await step(60);assert((await state()).player.speed>0,'Controls retain focus after using the sound button');await page.keyboard.up('w');
  // A full uninterrupted race exercises all course segments, AI, rocks, finish and persistence.
  await page.evaluate(()=>{__BROOMFLIGHT.reset();__BROOMFLIGHT.input({pedal:true,steer:0,crouch:false,boost:false,trick:0});});
  for(let i=0;i<12&&(await state()).phase!=='results';i++)await step(600);
  s=await state();assert.equal(s.phase,'results');assert.equal(s.checkpoints,4);assert(s.player.finishTime>50&&s.player.finishTime<130);assert(s.player.finished);
  await step(700,true);assert.equal(await page.locator('#results-panel').isVisible(),true);await shot('results');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('repo.broomflight.best.v1')));
  assert(saved.time>0&&saved.ghost.length>400);assert.equal(saved.checkpoints.length,4);
  await page.reload();await page.waitForFunction(()=>window.__BROOMFLIGHT?.ready);assert.equal((await state()).phase,'title');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('repo.broomflight.best.v1')).time),saved.time);
  // Landmark views and close rider silhouette are useful visual regression evidence.
  for(const [name,progress] of [['vineyards',.57],['elvara',.94],['viaduct',.71]]){
   await page.evaluate(progress=>{__BROOMFLIGHT.seek(progress);__BROOMFLIGHT.input({pedal:true,crouch:true});__BROOMFLIGHT.step(65,true);},progress);await shot(name);
  }
  await c.close();
  // Real pointer input, automatic throttle and a small landscape screen.
  const mobile=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:1,hasTouch:true,isMobile:true,reducedMotion:'reduce'});await serve(mobile);
  const m=await mobile.newPage();await m.goto(fixture.base+'/broomflight/?capture=1');await m.waitForFunction(()=>window.__BROOMFLIGHT?.ready);
  assert(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await m.getByRole('button',{name:/Take flight/}).click();await m.evaluate(()=>__BROOMFLIGHT.step(420,true));
  assert((await m.evaluate(()=>__BROOMFLIGHT.state())).player.speed>20);
  const climb=m.getByRole('button',{name:'Climb',exact:true}),box=await climb.boundingBox();assert(box&&box.y+box.height<=390);
  assert.equal(await m.locator('.leaderboard').isVisible(),false,'Small landscape layouts leave the course unobscured');
  const client=await mobile.newCDPSession(m);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
  await m.evaluate(()=>__BROOMFLIGHT.step(90,true));assert((await m.evaluate(()=>__BROOMFLIGHT.state())).player.y>7);
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await m.evaluate(()=>__BROOMFLIGHT.step(150,true));assert((await m.evaluate(()=>__BROOMFLIGHT.state())).player.y<2.5);
  if(shots)await m.screenshot({path:path.join(shots,'mobile.png')});await mobile.close();
  const portrait=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});await serve(portrait);
  const portraitPage=await portrait.newPage();await portraitPage.goto(fixture.base+'/broomflight/?capture=1');await portraitPage.waitForFunction(()=>window.__BROOMFLIGHT?.ready);
  const takeFlight=await portraitPage.getByRole('button',{name:/Take flight/}).boundingBox();assert(takeFlight&&takeFlight.y+takeFlight.height<844);
  await portraitPage.getByRole('button',{name:/Take flight/}).click();await portraitPage.evaluate(()=>__BROOMFLIGHT.step(400,true));
  assert(await portraitPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(shots)await portraitPage.screenshot({path:path.join(shots,'portrait.png')});await portrait.close();
  // Authenticated clean URL mounts the actual game and keeps playtime lifecycle intact.
  const app=await fixture.browserContext(browser,'alice');await serve(app);const p=await app.newPage(),plays=[];
  p.on('request',r=>{if(new URL(r.url()).pathname==='/api/dashboard/play')plays.push(r.postDataJSON());});
  await p.goto(fixture.base+'/Demos/broomflight');
  await p.waitForFunction(()=>repoPlaytime?.game==='broomflight');
  assert.equal(await p.locator('#demo-library').getAttribute('data-selected-demo'),'broomflight');
  assert.equal(await p.locator('#legacy-feature .legacy-loading').isVisible(),false);
  const frame=p.frames().find(f=>new URL(f.url()||'about:blank').pathname==='/broomflight/');assert(frame);
  await frame.getByRole('button',{name:/Take flight/}).click();await frame.waitForFunction(()=>__BROOMFLIGHT.state().phase==='racing');
  await frame.locator('canvas').focus();await p.keyboard.press('Escape');await frame.waitForFunction(()=>__BROOMFLIGHT.state().phase==='paused');assert.equal(await p.locator('#legacy-feature').evaluate(e=>e.open),true,'Escape pauses without closing the embedded demo');
  await p.keyboard.press('Escape');await frame.waitForFunction(()=>__BROOMFLIGHT.state().phase==='racing');
  await frame.getByRole('button',{name:/Back to demos/}).first().click();await p.waitForFunction(()=>!document.getElementById('legacy-feature').open&&!repoPlaytime.game);
  assert(plays.some(x=>x.game==='broomflight'&&x.action==='start'));assert(plays.some(x=>x.game==='broomflight'&&x.action==='stop'));
  assert.equal(await p.locator('#demo-library').evaluate(e=>e.open),true);
  assert.equal(new URL(p.url()).pathname,'/Demos','Leaving a demo returns its URL to the collection');
  await p.locator('#demo-launch').click();await p.waitForFunction(()=>repoPlaytime?.game==='broomflight');assert.equal(new URL(p.url()).pathname,'/Demos/broomflight','Launching from the collection updates the URL');
  await p.goBack();await p.waitForFunction(()=>!document.getElementById('legacy-feature').open&&!repoPlaytime.game);assert.equal(new URL(p.url()).pathname,'/Demos');
  await p.goForward();await p.waitForFunction(()=>repoPlaytime?.game==='broomflight');assert.equal(new URL(p.url()).pathname,'/Demos/broomflight');
  await app.close();
  const native=await fixture.browserContext(browser,'alice');await serve(native,true);const n=await native.newPage();await n.goto(fixture.base);
  await n.waitForFunction(()=>window.demoLibrary);assert.equal(await n.evaluate(()=>demoLibrary.games.some(g=>g.id==='broomflight')),false,'Existing launchers do not offer a game missing from their native catalogue');await native.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  console.log('PASS: real WebGL rendering, keyboard/touch flight, climb and swoop, tricks, boost/brake, pause/resume, complete race, best-run persistence, direct demo URL, embedded ready/exit and playtime lifecycle.');
 }finally{await browser.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
