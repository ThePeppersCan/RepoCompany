const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1672,height:941}});const page=await context.newPage(),errors=[],rpcs=[],playRequests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.log('BROWSER',m.text().slice(0,350));});
  const config=JSON.parse(fs.readFileSync('dashboard-config.json','utf8')),base='http://127.0.0.1:8788';
  const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'qaplayer@'+config.authDomain,user_metadata:{username:'QAPlayer'},created_at:new Date().toISOString()};
  const token=Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')+'.test';
  const session={access_token:token,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'test-refresh',user};
  let bank={gp:50000,items:{quidditch_tcg_pack:2}},social={username:'QAPlayer',profile:{display_name:'QAPlayer',bio:'A new adventure, every evening.',invisible:0,repo_score:120},friends:[{username:'fern',display_name:'Fern',status:'accepted',online:1,repo_score:250},{username:'rowan',display_name:'Rowan',status:'accepted',online:0,repo_score:80}],blocks:[],activity:[{game:'manager',played_ms:7200000,last_played:Date.now()-86400000},{game:'moratales',played_ms:1800000,last_played:Date.now()},{game:'morogue',played_ms:5400000,last_played:Date.now()-172800000},{game:'diver',played_ms:60000,last_played:Date.now()-172800001}]};
  const send=(route,data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  await context.route(config.url+'/**',async route=>{
   const url=new URL(route.request().url()),p=url.pathname;
   if(p.endsWith('/auth/v1/token'))return send(route,session);
   if(p.endsWith('/auth/v1/user'))return send(route,user);
   if(p.endsWith('/auth/v1/logout'))return send(route,{});
   const rpc=p.split('/rpc/')[1];if(rpc){rpcs.push(rpc);if(rpc==='get_my_character')return send(route,[{id:user.id,username:'QAPlayer',gp:bank.gp,harmony_xp:0}]);if(rpc==='get_my_bank')return send(route,[bank]);if(rpc==='get_my_quidditch_tcg_collection'||rpc==='get_public_quidditch_tcg_collection')return send(route,[{username:'QAPlayer',cards:['boomstick','barrys_tip_jar']}]);if(rpc==='get_my_rcg_slab_binder_view')return send(route,[{slabs:[],layout:[],username:'QAPlayer'}]);if(rpc==='buy_quidditch_tcg_pack'){bank={gp:25000,items:{quidditch_tcg_pack:3}};return send(route,[{new_gp:25000,bank_items:bank.items}]);}return send(route,[]);}
   return send(route,[]);
  });
  await context.route(base+'/api/dashboard/**',async route=>{const p=new URL(route.request().url()).pathname.split('/').pop();if(p==='state')return send(route,social);if(p==='search')return send(route,{players:[{username:'Fern'}]});const body=route.request().postDataJSON();if(p==='play')playRequests.push(body);if(p==='profile'){social.profile={...social.profile,display_name:body.displayName,bio:body.bio,invisible:body.invisible?1:0};}if(p==='friends'&&body.action==='request')social.friends=[{username:'fern',display_name:'Fern',requester:'qaplayer',status:'pending',online:0,repo_score:0}];return send(route,{ok:true});});
  await page.goto(base+'/#account/profile');await page.getByRole('button',{name:'Sign in →',exact:true}).click();
  await page.locator('[name="username"]').fill('QAPlayer');await page.locator('[name="password"]').fill('test-password-123');await page.locator('#account-login-form [type="submit"]').click();
  await page.waitForFunction(()=>repoAccount.state.bank?.gp===50000);await page.waitForFunction(()=>!document.querySelector('#account-detail').open);
  assert.equal(await page.locator('.account-profile-copy h2').textContent(),'QAPlayer');
  const out=path.resolve('QA/dashboard-staging');fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,'profile.png')});

  await page.screenshot({path:path.join(out,'profile-redesign.png')});
  assert.equal(await page.locator('.profile-recent-game').count(),3);
  assert.equal(await page.locator('.profile-recent-game .profile-game-link b').first().textContent(),'Moratales');
  assert.equal(await page.locator('.profile-friend').count(),2);
  const alignment=await page.evaluate(()=>{const a=document.querySelector('#dashboard>.brand').getBoundingClientRect(),b=document.querySelector('.account-back').getBoundingClientRect();return {left:Math.abs(a.left-b.left),top:Math.abs(a.top-b.top),width:Math.abs(a.width-b.width)}});
  assert(alignment.left<1&&alignment.top<1&&alignment.width<1,JSON.stringify(alignment));
  assert.equal(await page.locator('.profile-recent-game .profile-game-banner').count(),3);
  assert(await page.locator('.profile-banner-art').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)));
  for(const origin of ['moratales','manager','morogue','demos']){
   await page.evaluate(id=>{history.pushState({},'','#'+id);dispatchEvent(new PopStateEvent('popstate'));},origin);
   await page.evaluate(()=>accountMenu.open());
   await page.locator(origin==='moratales'?'.account-back':'.account-return').click();
   assert.equal(new URL(page.url()).hash,'#collection');
   assert(await page.locator('#dashboard').evaluate(e=>e.classList.contains('home-mode')&&!e.inert));
   assert.equal(await page.locator('dialog[open]').count(),0);
  }
  await page.evaluate(()=>accountMenu.open());
  await page.locator('#account-tab-achievements').click();assert.equal(await page.locator('.account-section-heading h2').textContent(),'Achievements');
  await page.screenshot({path:path.join(out,'achievements-redesign.png')});
  await page.locator('#account-tab-profile').click();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
  await page.screenshot({path:path.join(out,'profile-mobile.png')});
  assert(await page.locator('#account-content').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.clock.install();
  await page.evaluate(()=>repoPlaytime.start('goblin'));assert.equal(playRequests[0].action,'start');
  await page.clock.fastForward(30000);await page.waitForFunction(()=>true);await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));
  assert(playRequests.some(r=>r.action==='tick'&&r.active));
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForTimeout(20);assert.equal(playRequests.at(-1).active,false);
  await page.clock.fastForward(90000);const pausedCount=playRequests.length;
  await page.clock.fastForward(90000);assert.equal(playRequests.length,pausedCount);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForTimeout(20);assert.equal(playRequests.at(-1).active,true);
  await page.evaluate(()=>repoPlaytime.stop());assert.equal(playRequests.at(-1).action,'stop');
  assert(playRequests.every((r,i)=>r.sequence===i));
  await page.clock.fastForward(60000);assert.equal(playRequests.at(-1).action,'stop');
  assert.equal(errors.length,0,errors.join('; '));console.log('PASS: aligned logo, profile activity, friends scores, Achievements and mobile');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
