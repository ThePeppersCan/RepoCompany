const {chromium}=require('playwright');
const fs=require('fs'),assert=require('assert/strict'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1672,height:941}});const page=await context.newPage(),errors=[],rpcs=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.log('BROWSER',m.text().slice(0,350));});
  const config=JSON.parse(fs.readFileSync('dashboard-config.json','utf8')),base=process.env.DASHBOARD_TEST_URL||'http://127.0.0.1:8788';
  const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'qaplayer@'+config.authDomain,user_metadata:{username:'QAPlayer'},created_at:new Date().toISOString()};
  const token=Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')+'.test';
  const session={access_token:token,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'test-refresh',user};
  let bank={gp:50000,items:{quidditch_tcg_pack:2}},social={username:'QAPlayer',profile:{display_name:'QAPlayer',bio:'',invisible:0,repo_score:0},friends:[],blocks:[]};
  const send=(route,data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  await context.route(config.url+'/**',async route=>{
   const url=new URL(route.request().url()),p=url.pathname;
   if(p.endsWith('/auth/v1/token'))return send(route,session);
   if(p.endsWith('/auth/v1/user'))return send(route,user);
   if(p.endsWith('/auth/v1/logout'))return send(route,{});
   const rpc=p.split('/rpc/')[1];if(['get_my_favourite_quidditch_tcg_card','get_favourite_quidditch_tcg_cards'].includes(rpc))await new Promise(resolve=>setTimeout(resolve,750));if(rpc){rpcs.push(rpc);if(rpc==='get_my_character')return send(route,[{id:user.id,username:'QAPlayer',gp:bank.gp,harmony_xp:0}]);if(rpc==='get_my_bank')return send(route,[bank]);if(rpc==='get_my_quidditch_tcg_collection'||rpc==='get_public_quidditch_tcg_collection')return send(route,[{username:'QAPlayer',cards:['boomstick','barrys_tip_jar']}]);if(rpc==='get_my_rcg_slab_binder_view')return send(route,[{slabs:[],layout:[],username:'QAPlayer'}]);if(rpc==='buy_quidditch_tcg_pack'){bank={gp:25000,items:{quidditch_tcg_pack:3}};return send(route,[{new_gp:25000,bank_items:bank.items}]);}return send(route,[]);}
   return send(route,[]);
  });
  await context.route(base+'/api/dashboard/**',async route=>{const p=new URL(route.request().url()).pathname.split('/').pop();if(p==='state')return send(route,social);if(p==='search')return send(route,{players:[{username:'Fern'}]});const body=route.request().postDataJSON();if(p==='profile'){social.profile={...social.profile,display_name:body.displayName,bio:body.bio,invisible:body.invisible?1:0};}if(p==='friends'&&body.action==='request')social.friends=[{username:'fern',display_name:'Fern',requester:'qaplayer',status:'pending',online:0,repo_score:0}];return send(route,{ok:true});});
  await page.goto(base+'/#account/profile');await page.getByRole('button',{name:'Sign in →',exact:true}).click();
  await page.locator('[name="username"]').fill('QAPlayer');await page.locator('[name="password"]').fill('test-password-123');await page.locator('#account-login-form [type="submit"]').click();
  await page.waitForFunction(()=>repoAccount.state.bank?.gp===50000);await page.waitForFunction(()=>!document.querySelector('#account-detail').open);
  assert.equal(await page.locator('.account-profile-copy h2').textContent(),'QAPlayer');
  const out=path.resolve('QA/dashboard-staging');fs.mkdirSync(out,{recursive:true});
  await page.screenshot({path:path.join(out,'profile.png')});
  await page.locator('#account-tab-inventory').click();assert((await page.locator('.account-owned-pack').textContent()).includes('2 unopened'));await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'inventory.png')});
  await page.locator('#account-tab-shop').click();assert.equal(await page.locator('.account-shop-pack').count(),1);await page.locator('.account-pack-copy [data-pack]').click();
  await page.locator('#buy-original-pack').click();await page.waitForFunction(()=>repoAccount.state.bank?.gp===25000);assert.equal(rpcs.filter(r=>r==='buy_quidditch_tcg_pack').length,1);await page.keyboard.press('Escape');
  await page.locator('#account-tab-friends').click();assert.equal(await page.locator('.hub-friend-card').count(),0);await page.locator('[data-add-friend]').first().click();await page.locator('#friend-search input').fill('Fern');await page.getByRole('button',{name:'Find player',exact:true}).click();await page.locator('[data-send-request]').click();await page.waitForFunction(()=>document.querySelector('#friend-results')?.textContent==='Friend request sent.');await page.keyboard.press('Escape');await page.locator('[data-filter="requests"]').last().click();assert.equal(await page.locator('.hub-friend-card').count(),1);
  await page.locator('#account-tab-settings').click();await page.locator('[data-invisible]').click();await page.waitForFunction(()=>repoAccount.state.social.profile.invisible===1);
  await page.locator('#account-tab-binder').click();await page.locator('.binder-book').waitFor();
  await page.screenshot({path:path.join(out,'binder-shelf.png')});
  await page.locator('.binder-types [data-binder="slabs"]').click();await page.locator('.binder-book-slabs').waitFor();
  await page.screenshot({path:path.join(out,'slab-binder.png')});
  assert.equal(await page.locator('#legacy-feature iframe').count(),0);
  const demoSelectors={dragonbound:'#dragonboundOverlay.is-open',diver:'#repoDiverDialog[open]',goblin:'#goblinBombDialog[open]',rooftops:'#repoRooftopsDialog[open]',seas:'#sailingDialog[open]',sports:'#repoSportsV2TestOverlay[aria-hidden="false"]'};
  for(const [id,selector] of Object.entries(demoSelectors)){
   console.log('Checking demo:',id);
   const demoPage=await context.newPage();demoPage.on('pageerror',e=>errors.push(id+': '+e.message));demoPage.on('console',m=>{if(m.type()==='warning')console.log(id,m.text().slice(0,200));});
   await demoPage.goto(base+'/#demos');await demoPage.waitForFunction(()=>repoAccount.state.user);
   await demoPage.locator('[data-demo="'+id+'"]').click();await demoPage.locator('#demo-launch').click();const demo=demoPage.frameLocator('#legacy-feature iframe');
   await demo.locator(selector).waitFor({state:'visible',timeout:30000});
   await demoPage.screenshot({path:path.join(out,'demo-'+id+'.png')});
   assert(demoPage.url().startsWith(base),'Game launches keep the new site open');
   if(id==='dragonbound'){assert.equal(new URL(await demoPage.locator('#legacy-feature iframe').getAttribute('src')).origin,'https://dragonbound.repocompany.uk');await demo.locator('#closeDragonboundOverlay').click();await demoPage.locator('#legacy-feature').waitFor({state:'hidden'});}
   else await demoPage.locator('[data-legacy-close]').click();
   await demoPage.locator('#demo-library[open]').waitFor();assert.equal(await demoPage.locator('#legacy-feature iframe').count(),0);await demoPage.close();
  }
  await page.locator('#account-tab-settings').click();await page.locator('[data-signout]').click();await page.getByRole('button',{name:'Sign in →',exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'mobile-signed-out.png')});assert(await page.locator('#account-content').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  const report={authentication:true,walletOneToOne:true,oneShopProduct:true,onePurchaseRpc:true,ownedInventory:true,friendRequest:true,privacy:true,existingDualBinder:true,existingSlabBinder:true,demos:Object.keys(demoSelectors),mobile:true,errors};
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  // Existing runtime errors are reported distinctly from the new dashboard.
  assert(!errors.length,'Browser errors: '+errors.join('; '));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
