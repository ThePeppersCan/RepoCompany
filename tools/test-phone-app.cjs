const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const f=await createFixture(),browser=await chromium.launch({channel:'msedge',headless:true}),root=path.resolve(__dirname,'..'),errors=[];
 try{
  const ctx=await f.browserContext(browser,'alice');await ctx.setExtraHTTPHeaders({'X-Phone-Test':'true'});
  await ctx.route(f.base+'/api/accounts/status',r=>r.fulfill({json:{verified:true,email:'alice@example.com',canApprove:true}}));
  const catalogue=JSON.parse(await fs.readFile(path.join(root,'dist/assets/achievements/catalogue.json'),'utf8'));
  await ctx.route(f.base+'/assets/achievements/catalogue.json',r=>r.fulfill({json:catalogue}));
  const achievements=catalogue.games.flatMap(g=>g.achievements.map((a,i)=>({id:a.id,game:g.id,score:a.score,progress:i?0:1,unlocked_at:i?null:Date.now()})));
  await ctx.route(f.base+'/api/achievements/mine',r=>r.fulfill({json:{achievements,repoScore:120}}));
  await ctx.route(f.base+'/api/wibsworth/state',r=>r.fulfill({json:{available:true,usage:{provider:'self-hosted',unit:'messages',used:4,limit:100,resetAt:Date.now()+86400000,available:true,daily:{used:4,limit:100,resetAt:Date.now()+86400000,available:true}},settings:{}}}));
  await ctx.route(f.base+'/app/**',async route=>{const u=new URL(route.request().url()),file=path.join(root,'dist',u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname);try{await route.fulfill({contentType:u.pathname.endsWith('.js')?'application/javascript':u.pathname.endsWith('.webmanifest')?'application/manifest+json':'text/html',body:await fs.readFile(file)});}catch{await route.fulfill({status:404,body:'Not found'});}});
  const p=await ctx.newPage();await p.setViewportSize({width:390,height:844});p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE',e.message);});await p.goto(f.base+'/app/');
  await p.waitForFunction(()=>document.documentElement.dataset.repoAuth==='ready');await p.locator('#repo-messages[open]').waitFor({timeout:15000});
  assert.equal(await p.locator('[data-nav=collection]:visible').count(),0);assert.equal(await p.locator('script[src*=repo-game-loader],script[src*=repo-web-game],script[src*=legacy-launcher],script[src*=homepage]').count(),0);
  assert(await p.evaluate(()=>!window.repoWebGame&&!window.repoLegacy&&!window.demoLibrary));
  // Exercise touch targets with iPhone safe areas, landscape cutouts and a shortened keyboard viewport.
  for(const [width,height,top,bottom,side,label] of [[430,932,59,34,0,'portrait'],[932,430,0,21,59,'landscape'],[390,430,59,0,0,'keyboard'],[320,568,20,0,0,'small']]){
   await p.setViewportSize({width,height});await p.evaluate(({top,bottom,side})=>{const s=document.documentElement.style;for(const [key,value]of [['top',top],['bottom',bottom],['left',side],['right',side]])s.setProperty('--phone-safe-'+key,value+'px','important');},{top,bottom,side});
   const controls=p.locator('#repo-messages .repo-section-nav');await controls.getByRole('button',{name:'Wibsworth',exact:true}).click();
   const geometry=await controls.locator('button:visible').evaluateAll((buttons,{top,bottom,side})=>buttons.map(b=>{const r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {name:b.getAttribute('aria-label'),safe:r.y>=top&&r.bottom<=innerHeight-bottom&&r.x>=side&&r.right<=innerWidth-side,touch:r.width>=44&&r.height>=44,hit:hit===b||b.contains(hit)};}),{top,bottom,side});assert(geometry.every(b=>b.safe&&b.touch&&b.hit),label+': '+JSON.stringify(geometry));
   const compose=await p.locator('.ws-compose').boundingBox();assert(compose&&compose.y>=top&&compose.y+compose.height<=height-bottom+1,label+' composer stays in usable viewport');
   if(label==='portrait')await p.screenshot({path:path.resolve(root,'../../outputs/Phone-safe-area.png')});
   if(label==='keyboard')await p.screenshot({path:path.resolve(root,'../../outputs/Phone-keyboard-fit.png')});
   await controls.getByRole('button',{name:'Account',exact:true}).click();await p.locator('#account-menu[open]').waitFor();await p.locator('#account-menu .repo-section-nav [data-nav=wibs]').click();await p.locator('#repo-messages[open]').waitFor();
  }
  // iOS can report a shorter visual viewport even with its keyboard closed.
  await p.setViewportSize({width:430,height:932});
  await p.evaluate(()=>{const s=document.documentElement.style;s.setProperty('--phone-safe-top','59px','important');s.setProperty('--phone-safe-bottom','34px','important');Object.defineProperty(visualViewport,'height',{configurable:true,value:873});dispatchEvent(new Event('resize'));s.setProperty('--phone-safe-bottom','34px','important');});
  let panel=await p.locator('#repo-messages').boundingBox(),bar=await p.locator('.rc-composer').boundingBox();
  assert.equal(panel.y+panel.height,932,'phone panel fills the window despite shorter idle visual viewport');assert.equal(bar.y+bar.height,932-34-8,'message bar sits just above the home indicator');
  assert(await p.evaluate(()=>document.querySelector('#repo-messages').contains(document.elementFromPoint(215,931))),'themed panel covers the bottom strip');
  await p.screenshot({path:path.resolve(root,'../../outputs/Phone-bottom-bar.png')});
  await p.locator('.rc-composer textarea').focus();
  await p.evaluate(()=>{document.documentElement.style.removeProperty('--phone-safe-bottom');Object.defineProperty(visualViewport,'height',{configurable:true,value:480});Object.defineProperty(visualViewport,'offsetTop',{configurable:true,value:30});visualViewport.dispatchEvent(new Event('resize'));});
  panel=await p.locator('#repo-messages').boundingBox();bar=await p.locator('.rc-composer').boundingBox();assert.equal(panel.y,30);assert.equal(panel.height,480);assert.equal(bar.y+bar.height,502,'keyboard viewport keeps message bar above keyboard without duplicate safe-area padding');
  await p.evaluate(()=>{document.activeElement.blur();delete visualViewport.height;delete visualViewport.offsetTop;for(const k of ['top','bottom','left','right'])document.documentElement.style.removeProperty('--phone-safe-'+k);dispatchEvent(new Event('resize'));});
  await p.setViewportSize({width:390,height:844});
  const nav=p.locator('#repo-messages .repo-section-nav');await nav.getByRole('button',{name:'Wibsworth',exact:true}).click();await p.waitForFunction(()=>document.querySelector('#repo-messages')?.dataset.workspaceView==='wibsworth');assert.match(p.url(),/\/app\/#wibsworth/);
  await p.screenshot({path:path.resolve(root,'../../outputs/Phone-Wibsworth.png')});
  await nav.getByRole('button',{name:'Account',exact:true}).click();await p.locator('#account-menu[open]').waitFor();await p.getByRole('tab',{name:'Achievements',exact:true}).click();await p.locator('.ach-game-card').first().waitFor();assert.equal(await p.locator('.ach-game-card').count(),3);await p.screenshot({path:path.resolve(root,'../../outputs/Phone-achievements.png')});
  assert.match(p.url(),/\/app\/#account\/achievements/);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.locator('.ach-game-card[data-ach-game=morogue]').click();await p.locator('.ach-game-view[data-ach-game-view=morogue]').waitFor();await p.getByLabel('Search achievements',{exact:true}).fill('zzzznotanachievement');await p.getByRole('heading',{name:'No achievements found'}).waitFor();await p.getByRole('button',{name:'Clear filters',exact:true}).click();assert(await p.locator('.ach-list>*').count()>0);assert(await p.evaluate(()=>!window.repoWebGame));
  await p.getByRole('tab',{name:'Settings',exact:true}).click();await p.getByRole('button',{name:'Email & verification',exact:true}).waitFor({timeout:5000}).catch(async e=>{console.log(await p.evaluate(()=>({body:document.querySelector('#account-content')?.innerText,email:!!window.repoAccountEmail,state:window.repoAccount.state.error,tab:document.querySelector('#account-menu').dataset.accountTab})));throw e;});await p.getByRole('button',{name:'Account requests',exact:true}).waitFor();await p.getByRole('tab',{name:'Profile',exact:true}).click();assert.equal(await p.getByRole('button',{name:'Back to Wibs',exact:true}).count(),1);
  await p.locator('#account-menu .repo-section-nav [data-nav=wibs]').click();await p.locator('#repo-messages[open]').waitFor();await p.screenshot({path:path.resolve(root,'../../outputs/Phone-Wibs.png')});
  await p.goto(f.base+'/app/#morogue');await p.locator('#repo-messages[open]').waitFor();assert(await p.evaluate(()=>!window.repoWebGame&&!window.repoLegacy));
  const manifest=JSON.parse(await fs.readFile(path.join(root,'dist/app/manifest.webmanifest'),'utf8'));assert.equal(manifest.start_url,'/app/#wibs');assert.equal(manifest.scope,'/app/');assert.equal(manifest.display,'standalone');
  await ctx.unroute(f.base+'/api/accounts/status');await ctx.route(f.base+'/api/accounts/status',r=>r.fulfill({json:{verified:false,email:null,canApprove:false}}));await ctx.route(f.base+'/api/accounts/email',r=>r.fulfill({json:{ok:true,message:'Check your email and open the verification link.'}}));
  await p.reload();await p.getByRole('heading',{name:'Add your email',exact:true}).waitFor();await p.getByLabel('Email',{exact:true}).fill('alice@example.com');await p.getByLabel('Current password',{exact:true}).fill('correct-password');await p.getByRole('button',{name:'Send verification email',exact:true}).click();await p.getByText('Check your email and open the verification link.',{exact:true}).waitFor();assert.equal(await p.getByLabel('Current password',{exact:true}).inputValue(),'');await p.screenshot({path:path.resolve(root,'../../outputs/Phone-email-verification.png')});await p.getByRole('button',{name:'Later',exact:true}).click();
  assert.deepEqual(errors,[]);console.log('PASS: matching shared phone screens, Wibs/Wibsworth/account navigation stays in app, achievements, mobile width, game runners omitted and game deep links rejected, install manifest.');
 }finally{await browser.close();await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
