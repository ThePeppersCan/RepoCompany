const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext(),page=await context.newPage(),requests=[],errors=[],messages=[];
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
   if(url.pathname.startsWith('/api/')){requests.push(route.request().postDataJSON());return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'});}
   const filename=path.join(process.cwd(),url.pathname.slice(1));
   assert(filename.startsWith(process.cwd()+path.sep));
   return route.fulfill({status:200,contentType:url.pathname.endsWith('.html')?'text/html':'text/javascript',body:fs.readFileSync(filename)});
  });
  const gameOrigins={'https://manager.repocompany.uk':'manager','https://moratales.repocompany.uk':'moratales','https://morogue.repocompany.uk':'morogue','https://dragonbound.repocompany.uk':'dragonbound','https://evil.example':'manager'};
  for(const [origin,game] of Object.entries(gameOrigins))await context.route(origin+'/**',route=>route.fulfill({status:200,contentType:'text/html',body:`<!doctype html><body><h1>Game fixture</h1><script>window.received=[];addEventListener('message',e=>received.push(e.data));</script><script defer src="${host}/game-playtime-client.js" data-game="${game}"></script></body>`}));
  await page.goto(host+'/');await page.evaluate(({storageKey,session})=>localStorage.setItem(storageKey,JSON.stringify(session)),{storageKey,session});
  await page.clock.install();
  for(const [origin,game] of Object.entries(gameOrigins)){
   const before=requests.length;await page.goto(origin);await page.waitForTimeout(250);
   if(origin.includes('evil')){assert.equal(requests.length,before,'Unapproved origins cannot connect');continue;}
   await page.waitForFunction(()=>received.some(m=>m.type==='repo-game-tracker-ready'));
   await page.waitForTimeout(50);
   assert(requests.slice(before).some(r=>r.action==='start'&&r.game===game));
   // Fast forward in small steps so the parent's ten-second lease renewals run.
   for(let i=0;i<4;i++){await page.clock.runFor(10000);}
   assert(requests.slice(before).some(r=>r.action==='tick'&&r.active&&r.game===game));
   const parentMessages=await page.evaluate(()=>JSON.stringify(received));assert(!parentMessages.includes(token));assert(!parentMessages.includes('test-refresh'));
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
   await page.waitForTimeout(50);assert.equal(requests.at(-1).active,false,'Hidden games pause recording');
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
   await page.waitForTimeout(50);assert.equal(requests.at(-1).active,true,'Visible games resume');
  }
  assert.equal(errors.length,0,errors.join('; '));
  console.log('PASS: separate game pages connect through the original account, track visible hours, pause hidden tabs, reject unapproved origins and never receive account tokens.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
