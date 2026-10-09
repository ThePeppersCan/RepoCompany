const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1672,height:941}}),page=await context.newPage();
  const base=process.env.DASHBOARD_TEST_URL||'http://127.0.0.1:8788',config=require('../dashboard-config.json');
  const user={id:'11111111-1111-4111-8111-111111111111',email:'qaplayer@'+config.authDomain,aud:'authenticated',role:'authenticated',user_metadata:{username:'QAPlayer'}};
  const token=Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.test';
  const session={access_token:token,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'test-refresh',user};
  let packs=4,cards=['boomstick'],calls=0,mode='success';const errors=[],legacyRequests=[];
  const out=path.resolve('QA/dashboard-packs');fs.mkdirSync(out,{recursive:true});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('legacy-runtime.html'))legacyRequests.push(r.url());});
  const send=(route,value,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
  await context.route(config.url+'/**',async route=>{
   const p=new URL(route.request().url()).pathname;
   if(p.endsWith('/auth/v1/token'))return send(route,session);
   if(p.endsWith('/auth/v1/user'))return send(route,user);
   const rpc=p.split('/rpc/')[1];
   if(rpc==='get_my_character')return send(route,[{id:user.id,username:'QAPlayer',gp:50000}]);
   if(rpc==='get_my_bank')return send(route,[{gp:50000,items:{quidditch_tcg_pack:packs}}]);
   if(rpc==='get_my_quidditch_tcg_collection'||rpc==='get_public_quidditch_tcg_collection')return send(route,[{username:'QAPlayer',cards}]);
   if(rpc==='get_my_rcg_slab_binder_view')return send(route,[{slabs:[],layout:[],username:'QAPlayer'}]);
   if(rpc==='open_quidditch_tcg_pack'){
    calls++;await new Promise(resolve=>setTimeout(resolve,350));
    if(mode==='reject')return send(route,{message:'Test request rejected'},400);
    packs--;const id=mode==='unknown'?'new_card_not_in_catalog':'rocky_legendary_full_art';cards.push(id);
    if(mode==='uncertain')return route.abort('failed'); // Server committed, response lost.
    return send(route,[{card_id:id,owned_cards:[...cards],bank_items:{quidditch_tcg_pack:packs},skill_one:'harmony',skill_one_total:5000}]);
   }
   return send(route,[]);
  });
  await context.route(base+'/api/dashboard/**',route=>send(route,{username:'QAPlayer',profile:{display_name:'QAPlayer',repo_score:0},friends:[],blocks:[]}));
  await page.goto(base+'/#account/inventory');
  await page.getByRole('button',{name:'Sign in →',exact:true}).click();
  await page.locator('[name="username"]').fill('QAPlayer');await page.locator('[name="password"]').fill('test-password-123');
  await page.locator('#account-login-form [type="submit"]').click();
  await page.waitForFunction(()=>repoAccount.state.bank?.items.quidditch_tcg_pack===4&&!document.getElementById('account-detail').open);
  const open=async()=>{await page.locator('[data-binder="pack"]').click();await page.locator('#account-pack[open][data-phase="ready"]').waitFor();};
  const returned=async()=>{await page.waitForFunction(()=>!document.getElementById('account-pack').open&&document.getElementById('account-menu').open&&document.getElementById('account-menu').dataset.accountTab==='inventory');await page.waitForFunction(()=>!repoAccount.state.loading);};
  await open();await page.screenshot({path:path.join(out,'pack-ready.png')});
  await page.locator('#account-pack [aria-label="Close pack opening"]').click();await returned();assert.equal(calls,0);
  await open();await page.keyboard.press('Escape');await returned();assert.equal(calls,0);
  await open();
  await page.locator('#account-pack .pack-primary').evaluate(b=>{b.click();b.click();});
  await page.keyboard.press('Escape');assert(await page.locator('#account-pack').evaluate(e=>e.open));
  assert(await page.locator('#account-pack [aria-label="Close pack opening"]').isDisabled());
  await page.locator('#account-pack[data-phase="revealed"]').waitFor();assert.equal(calls,1);assert.equal(packs,3);
  assert.equal(await page.locator('#pack-title').textContent(),'Rocky — Gold Legendary Full Art');
  await page.waitForTimeout(950);await page.screenshot({path:path.join(out,'pack-revealed.png')});
  assert.equal(legacyRequests.length,0,'Opening packs must never load the old site');
  await page.locator('#account-pack [aria-label="Close pack opening"]').click();await returned();
  assert((await page.locator('.account-owned-pack').textContent()).includes('3 unopened'));
  assert(await page.locator('[data-card="rocky_legendary_full_art"]').count());
  // A second copy is retained, and the reveal links to the existing Binder.
  await open();await page.locator('#account-pack .pack-primary').click();await page.locator('#account-pack[data-phase="revealed"]').waitFor();
  assert((await page.locator('.pack-description').textContent()).includes('Copy 2'));
  await page.locator('[data-pack-binder]').click();
  const frame=page.frameLocator('#legacy-feature iframe');
  await frame.locator('#quidditchTcgBinderDialog[open]').waitFor({timeout:60000});
  assert((await page.locator('[data-legacy-close]').textContent()).includes('Back to Account'));
  // Exercise the binder's native close lifecycle, not just the parent back button.
  await frame.locator('.repo-dual-binder-choice-rcg-v2041 img').evaluate(e=>e.decode());
  await frame.getByRole('button',{name:'Open RCG Slab Binder',exact:true}).last().click();
  await frame.locator('#repoRcgBinderDialog[open]').waitFor();
  await frame.locator('.repo-rcg-binder-close').click();
  await frame.locator('#quidditchTcgBinderDialog[open]').waitFor();
  await frame.locator('#quidditchTcgBinderDialog').press('Escape');
  await page.waitForFunction(()=>!document.getElementById('legacy-feature').open);await returned();
  assert.equal(await page.locator('#legacy-feature iframe').count(),0);
  // Unrecognized artwork is still a successful saved pull, never a retry prompt.
  mode='unknown';await open();await page.locator('#account-pack .pack-primary').click();await page.locator('#account-pack[data-phase="revealed"]').waitFor();
  assert.equal(await page.locator('#pack-title').textContent(),'Card added');assert.equal(packs,1);
  await page.keyboard.press('Escape');await returned();
  mode='reject';await open();await page.locator('#account-pack .pack-primary').click();await page.locator('#account-pack[data-phase="error"]').waitFor();
  assert.equal(await page.locator('#account-pack [data-pack-open]:enabled').count(),0);assert.equal(packs,1);
  await page.keyboard.press('Escape');await returned();
  // Reduced-motion mobile layout and mute are respected, including failure exits.
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});mode='uncertain';
  await page.locator('.account-audio').click();await open();
  await page.screenshot({path:path.join(out,'pack-mobile.png')});
  assert(await page.locator('#account-pack').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.locator('#account-pack .pack-primary').click();await page.locator('#account-pack[data-phase="error"]').waitFor();
  await page.locator('#account-pack .pack-primary').click();await returned();
  assert.equal(packs,0);assert.equal(await page.locator('[data-binder="pack"]').count(),0);
  assert.equal(calls,5,'No automatic retries or double consumption');
  assert.equal(legacyRequests.length,1,'Only the explicitly opened Binder loads its preserved runtime');
  assert.equal(errors.length,0,errors.join('\n'));
  const report={closeBeforeOpening:true,closeAfterReveal:true,escape:true,oneRpcPerOpen:true,duplicateCopies:true,nativeBinderReturn:true,noLegacyPageDuringPack:true,missingArtwork:true,rejectedRequest:true,lostResponseRefresh:true,mobile:true,errors};
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(report);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
