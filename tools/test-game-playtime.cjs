const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext(),page=await context.newPage(),requests=[],errors=[],messages=[];let failNextStart=false;
  const config=JSON.parse(fs.readFileSync('dashboard-config.json','utf8')),host='https://repocompany.uk';
  const user={id:'11111111-1111-4111-8111-111111111111',email:'test@example.test',aud:'authenticated'};
  const token=Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.test';
  const session={access_token:token,refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user};
  const storageKey='sb-'+new URL(config.url).hostname.split('.')[0]+'-auth-token';
  page.on('pageerror',e=>errors.push(e.message));
  await context.route(config.url+'/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(route.request().url().includes('/token')?session:user)}));
  await context.route(host+'/**',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/')return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>RepoCompany account fixture</title>'});
   if(url.pathname.startsWith('/api/')){const body=route.request().postDataJSON();requests.push(body);if(failNextStart&&body.action==='start'){failNextStart=false;return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Temporarily unavailable"}'});}return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});}
   const filename=path.join(process.cwd(),url.pathname.slice(1));
   assert(filename.startsWith(process.cwd()+path.sep));
   return route.fulfill({status:200,contentType:url.pathname.endsWith('.html')?'text/html':'text/javascript',body:fs.readFileSync(filename)});
  });
  const gameOrigins={'https://manager.repocompany.uk':'manager','https://moratales.repocompany.uk':'moratales','https://morogue.repocompany.uk':'morogue','https://comp-run.fluffy-star-4855.chatgpt.site':'comp-run','https://dragonbound.repocompany.uk':'dragonbound','https://evil.example':'manager'};
  for(const [origin,game] of Object.entries(gameOrigins))await context.route(origin+'/**',route=>route.fulfill({status:200,contentType:'text/html',body:`<!doctype html><body><h1>Game fixture</h1><script>if(location.search.includes('direct'))window.repoGameAchievements={identity:'account-id',activitySession:'11111111-1111-4111-8111-111111111111'};window.received=[];addEventListener('message',e=>received.push(e.data));</script><script defer src="${host}/game-playtime-client.js" data-game="${game}"></script></body>`}));
  await page.goto(host+'/');await page.evaluate(({storageKey,session})=>localStorage.setItem(storageKey,JSON.stringify(session)),{storageKey,session});
  await page.clock.install();
  for(const [origin,game] of Object.entries(gameOrigins)){
   const before=requests.length;failNextStart=game==='morogue';await page.goto(origin);await page.waitForTimeout(250);
   if(origin.includes('evil')){assert.equal(requests.length,before,'Unapproved origins cannot connect');continue;}
   await page.waitForFunction(()=>received.some(m=>m.type==='repo-game-tracker-ready'));
   await page.waitForTimeout(50);
   assert(requests.slice(before).some(r=>r.action==='start'&&r.game===game));
   // Fast forward in small steps so the parent's ten-second lease renewals run.
   for(let i=0;i<(game==='morogue'?7:4);i++){await page.clock.runFor(10000);}
   if(game==='morogue'){const starts=requests.slice(before).filter(r=>r.action==='start');assert(starts.length>=2,'Temporary startup failure must retry');assert(starts.every(r=>r.session===starts[0].session),'Retries use the same idempotent session');}
   assert(requests.slice(before).some(r=>r.action==='tick'&&r.active&&r.game===game));
   const parentMessages=await page.evaluate(()=>JSON.stringify(received));assert(!parentMessages.includes(token));assert(!parentMessages.includes('test-refresh'));
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
   await page.waitForTimeout(50);assert.equal(requests.at(-1).active,false,'Hidden games pause recording');
   const hiddenCount=requests.length;for(let i=0;i<4;i++)await page.clock.runFor(10000);
   assert(requests.length>hiddenCount&&requests.at(-1).action==='tick'&&!requests.at(-1).active,'An open hidden game renews presence without earning play time');
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
   await page.waitForTimeout(50);assert.equal(requests.at(-1).active,true,'Visible games resume');
  }
  // Repoints require both a running game clock and recent real input.
  for(const game of ['comp-run','morogue']){
   const origin=Object.keys(gameOrigins).find(o=>gameOrigins[o]===game);await page.goto(origin);await page.waitForFunction(()=>received.some(m=>m.type==='repo-game-tracker-ready'));
   await page.evaluate(()=>{window.sim={active:true,time:0};window.REPO_GAME_REWARD_STATE=()=>sim;window.__moratalesSurvivor={game:{state:{get status(){return sim.active?'playing':'paused'},get actualTime(){return sim.time}}}};window.simTimer=setInterval(()=>{if(sim.active)sim.time++;},1000);});
   await page.keyboard.down('w');await page.clock.runFor(40000);await page.waitForTimeout(100);
   assert.equal(requests.at(-1).rewardActive,true,game+' earns while playing');
   await page.evaluate(()=>sim.active=false);await page.clock.runFor(20000);await page.waitForTimeout(100);assert.equal(requests.at(-1).rewardActive,false,game+' pauses rewards in menus');
   await page.evaluate(()=>sim.active=true);await page.clock.runFor(20000);await page.waitForTimeout(100);assert.equal(requests.at(-1).rewardActive,true,game+' resumes');
   await page.keyboard.up('w');await page.clock.runFor(70000);await page.waitForTimeout(100);assert.equal(requests.at(-1).rewardActive,false,game+' idle does not earn');
   await page.keyboard.down('w');await page.evaluate(()=>clearInterval(simTimer));await page.clock.runFor(40000);await page.waitForTimeout(100);assert.equal(requests.at(-1).rewardActive,false,game+' frozen clock does not earn despite held input');await page.keyboard.up('w');
  }
  const beforeDirect=requests.length;await page.goto('https://comp-run.fluffy-star-4855.chatgpt.site/?direct=1');await page.waitForTimeout(100);
  await page.waitForFunction(()=>window.repoGamePlaytime);assert.equal(await page.locator('iframe').count(),0,'COMP-RUN activity reuses its connected account without another hidden sign-in');
  assert(requests.slice(beforeDirect).some(r=>r.action==='start'&&r.session==='11111111-1111-4111-8111-111111111111'));
  await page.clock.runFor(11000);await page.waitForTimeout(100);assert(requests.slice(beforeDirect).some(r=>r.action==='tick'&&r.active));
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(100);assert.equal(requests.at(-1).active,false);
  await page.evaluate(()=>repoGameAchievements.activitySession=null);const stopped=requests.length;await page.clock.runFor(40000);assert.equal(requests.length,stopped,'Signed-out game cannot keep claiming activity');
  assert.equal(errors.length,0,errors.join('; '));
  console.log('PASS: separate game pages connect through the original account, track visible hours, pause hidden tabs, reject unapproved origins and never receive account tokens.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
