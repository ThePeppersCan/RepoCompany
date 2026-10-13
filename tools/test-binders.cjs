const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.DASHBOARD_TEST_URL||'http://127.0.0.1:8791';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1672,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
  const config=require('../dashboard-config.json'),catalog=require('../dashboard-card-catalog.json');
  const user={id:'11111111-1111-4111-8111-111111111111',email:'qaplayer@'+config.authDomain,aud:'authenticated',role:'authenticated',user_metadata:{username:'QAPlayer'}};
  const token=Buffer.from('{}').toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')+'.test';
  const session={access_token:token,token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,refresh_token:'test-refresh',user};
  const cards=[...catalog.slice(0,29).map(x=>x.id),catalog[0].id,'unknown_future_card'];
  let slabLayout=Array(270).fill(null);slabLayout[0]='slab-a';slabLayout[3]='slab-b';
  const slabs=[{slab_id:'slab-a',card_id:cards[0],grade:10,certification_number:'RCG-0001'},{slab_id:'slab-b',card_id:cards[0],grade:9,certification_number:'RCG-0002'},{slab_id:'slab-c',card_id:cards[1],grade:8,certification_number:'RCG-0003'}];
  let failSave=false,failSlabLoad=false;const calls=[],errors=[],requests=[];
  const send=(route,data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  await context.route(config.url+'/**',async route=>{
   const p=new URL(route.request().url()).pathname;
   if(p.includes('/auth/v1/token'))return send(route,session);
   if(p.endsWith('/auth/v1/user'))return send(route,user);
   if(p.endsWith('/auth/v1/logout'))return send(route,{});
   const rpc=p.split('/rpc/')[1],args=route.request().postDataJSON();calls.push({rpc,args});
   if(rpc==='get_my_character')return send(route,[{id:user.id,username:'QAPlayer',gp:50000}]);
   if(rpc==='get_my_bank')return send(route,[{gp:50000,items:{quidditch_tcg_pack:2}}]);
   if(rpc==='get_my_quidditch_tcg_collection')return send(route,[{username:'QAPlayer',cards}]);
   if(rpc==='get_my_rcg_slab_binder_view')return failSlabLoad?send(route,{message:'Test offline'},503):send(route,[{slabs,layout:slabLayout,username:'QAPlayer'}]);
   if(rpc==='get_public_quidditch_tcg_binder_layout')return send(route,[{layout:[null,cards[2]],storage:[cards[1]]}]);
   if(rpc==='set_my_quidditch_tcg_binder_layout'||rpc==='set_my_rcg_slab_binder_layout'){
    await new Promise(r=>setTimeout(r,100));if(failSave)return send(route,{message:'Test save unavailable'},503);
    if(rpc==='set_my_rcg_slab_binder_layout'){slabLayout=args.p_layout;return send(route,args.p_layout);}
    return send(route,[{ok:true}]);
   }
   return send(route,[]);
  });
  await context.route(base+'/api/dashboard/**',route=>send(route,{username:'QAPlayer',profile:{display_name:'QAPlayer',repo_score:0},friends:[],blocks:[]}));
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(base+'/#account/inventory');await page.getByRole('button',{name:'Sign in →',exact:true}).click();
  await page.locator('[name=username]').fill('QAPlayer');await page.locator('[name=password]').fill('test-password-123');await page.locator('#account-login-form [type=submit]').click();
  await page.waitForFunction(()=>repoAccount.state.ready&&repoAccount.state.cards.length&&!document.querySelector('#account-detail').open);
  await page.locator('.inventory-card img').first().waitFor();
  const unique=new Set(cards).size;
  assert.equal(await page.locator('.inventory-card').count(),unique);
  await page.locator('[data-inventory-visibility=hide]').first().click();assert.equal(await page.locator('.inventory-card').count(),unique-1);
  await page.getByRole('button',{name:'Hide all cards',exact:true}).click();assert.equal(await page.locator('.inventory-card').count(),0);
  await page.reload();await page.locator('.inventory-card-hidden').waitFor();assert.equal(await page.locator('.inventory-card').count(),0);
  await page.getByRole('button',{name:'Unhide all',exact:true}).click();assert.equal(await page.locator('.inventory-card').count(),unique);
  assert.equal(calls.filter(x=>x.rpc?.startsWith('set_')).length,0,'Inventory visibility never alters binder or collection data');
  const out=path.resolve('QA/native-binders');fs.mkdirSync(out,{recursive:true});
  await page.getByRole('button',{name:'Hide all cards',exact:true}).click();await page.screenshot({path:path.join(out,'inventory-hidden.png')});
  await page.getByRole('button',{name:'Unhide all',exact:true}).click();
  // The old browser layout takes precedence over the server's public snapshot.
  await page.evaluate(cardIds=>{localStorage.setItem('repo_tcg_binder_54_layout_qaplayer',JSON.stringify([null,cardIds[0],cardIds[2]]));localStorage.setItem('repo_tcg_binder_storage_qaplayer',JSON.stringify([cardIds[1]]));},cards);
  await page.locator('#account-tab-binder').click();await page.locator('.binder-book').waitFor();
  assert(page.url().endsWith('#account/binder'));assert.equal(await page.locator('.binder-pocket[data-book-slot="1"] [data-book-inspect]').getAttribute('data-book-inspect'),cards[0]);
  assert.equal(calls.filter(x=>x.rpc==='get_public_quidditch_tcg_binder_layout').length,0);
  assert.equal(requests.filter(x=>x.includes('legacy-runtime')||/\/script\.js/.test(x)).length,0);
  await page.locator('[data-book-inspect]').first().click();await page.locator('#binder-inspector[open]').waitFor();await page.keyboard.press('Escape');
  const saved=()=>page.waitForFunction(()=>document.querySelector('.binder-save-status')?.textContent.includes('Arrangement saved.'));
  await page.locator(`[data-book-action=select][data-id="${cards[0]}"]`).click();
  await page.locator('[data-book-action=next]').click();await page.locator('[data-book-action=place]').first().click();await saved();
  let layout=await page.evaluate(()=>JSON.parse(localStorage.getItem('repo_tcg_binder_54_layout_qaplayer')));assert.equal(layout[1],null);assert(layout.indexOf(cards[0])>=24);
  await page.locator('[data-book-action=hide]').first().click();await saved();
  await page.locator('[data-book-action=storage]').click();assert((await page.locator('.binder-pocket').count())>=2);
  await page.locator('[data-book-action=restore-all]').click();await saved();assert.equal(await page.locator('.binder-pocket').count(),0);
  await page.locator('[data-book-action=displayed]').click();await page.locator('[data-book-page]').selectOption('0');
  await page.locator('[data-book-search]').fill(catalog[0].name);assert.equal(await page.locator('.binder-pocket').count(),1);await page.locator('[data-book-search]').fill('nothing-matches-123');assert.equal(await page.locator('.binder-pocket').count(),0);await page.locator('[data-book-search]').fill('');
  await page.locator('[data-book-action=hide]').first().click();await saved();
  await page.reload();await page.locator('.binder-book').waitFor();assert((await page.locator('.binder-summary').innerText()).includes('1 in storage'));
  // Unknown card IDs remain in the arrangement, and duplicate copies are counted.
  await page.locator('[data-book-search]').fill('unknown_future_card');assert.equal(await page.locator('.binder-missing').count(),1);await page.locator('[data-book-search]').fill('');
  await page.locator('.binder-art-button img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode().catch(()=>{}))));await page.screenshot({path:path.join(out,'tcg-desktop.png'),fullPage:true});
  await page.locator('.binder-types [data-binder=slabs]').click();await page.locator('.binder-book-slabs').waitFor();assert(page.url().endsWith('#account/slabs'));
  assert.equal(await page.locator('.binder-slab').count(),2);
  await page.locator('[data-book-inspect="slab-a"]').click();assert((await page.locator('#binder-inspector').innerText()).includes('RCG-0001'));await page.keyboard.press('Escape');
  await page.locator('[data-book-action=select][data-id="slab-a"]').click();await page.locator('[data-book-inspect="slab-b"]').click();await saved();assert.equal(slabLayout[3],'slab-a');assert.equal(slabLayout[0],'slab-b');
  // A failed save must stay visible and must not silently reload the old arrangement.
  failSave=true;await page.locator('[data-book-action=hide][data-id="slab-a"]').click();await page.locator('[data-book-action=save]').waitFor();assert.equal(await page.locator('[data-book-inspect="slab-a"]').count(),0);assert.equal(slabLayout[3],'slab-a');
  failSave=false;await page.locator('[data-book-action=save]').click();await saved();assert.equal(slabLayout[3],null);
  await page.locator('[data-book-action=restore-all]').click();await saved();assert.equal(slabLayout.filter(Boolean).length,3);assert.equal(new Set(slabLayout.filter(Boolean)).size,3);
  await page.screenshot({path:path.join(out,'slabs-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'slabs-mobile.png'),fullPage:true});assert(await page.locator('#account-content').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'Slabs must fit mobile');
  await page.locator('.binder-types [data-binder=binder]').click();await page.locator('.binder-book').waitFor();assert(await page.locator('#account-content').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'Cards must fit mobile');await page.screenshot({path:path.join(out,'tcg-mobile.png'),fullPage:true});
  // Direct route, error recovery, no save on load, browser history and account isolation.
  failSlabLoad=true;await page.goto(base+'/#account/slabs');await page.reload();await page.getByRole('button',{name:'Try again',exact:true}).waitFor();failSlabLoad=false;await page.getByRole('button',{name:'Try again',exact:true}).click();await page.locator('.binder-book-slabs').waitFor();
  await page.locator('.binder-types [data-tab=inventory]').click();await page.getByRole('button',{name:'Hide all cards',exact:true}).click();
  await page.setViewportSize({width:1672,height:1000});await page.locator('#account-tab-settings').click();await page.locator('[data-signout]').click();await page.getByRole('button',{name:'Sign in →',exact:true}).waitFor();
  assert.equal(await page.locator('.binder-pocket').count(),0);assert.equal(await page.locator('.inventory-card').count(),0);
  assert.equal(requests.filter(x=>x.includes('legacy-runtime')).length,0);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({inventoryHideAll:true,individualHide:true,persistence:true,localLayoutPreserved:true,moveAcrossPages:true,slabSwap:true,storageRestore:true,saveFailureRetry:true,unknownCards:true,duplicateSlabs:true,search:true,mobile:true,nativeNoLegacyRequests:true,errors},null,2));console.log('PASS: inventory visibility, both native binders, saved layouts, moves, storage, failure recovery, search and mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
