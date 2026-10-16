'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fetch=global.fetch,f=await createFixture();let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const context=await f.browserContext(browser,'alice'),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__sounds=[];window.__notices=[];
   addEventListener('repo-message-sound',e=>__sounds.push(e.detail));addEventListener('repo-message-notification',e=>__notices.push(e.detail));
  });
  await page.goto(f.base);await page.waitForFunction(()=>window.repoCommunity&&repoAccount.state.social?.friends?.length);
  await page.waitForFunction(()=>document.querySelector('.repo-message-launch'));
  await page.evaluate(()=>{document.documentElement.dataset.repoLauncher='true';document.documentElement.dataset.repoNativeMessageSound='true';dispatchEvent(new CustomEvent('repo-launcher-portal-visibility',{detail:{visible:false}}));});
  // Wait for the background subscription to establish a baseline, without opening Wibs.
  for(let i=0;i<50&&!f.sql.prepare('SELECT 1 FROM community_reads').get();i++)await page.waitForTimeout(100);
  assert(f.sql.prepare('SELECT 1 FROM community_reads').get());
  const send=async(route,data)=>{const r=await fetch(f.base+'/api/'+route,{method:'POST',headers:{Authorization:'Bearer '+f.sessions.bob.access_token,'Content-Type':'application/json'},body:JSON.stringify({...data,clientId:crypto.randomUUID()})});assert.equal(r.status,200);return r.json();};
  const group=await send('community/messages',{channel:'general',text:'Group while minimized'}),dm=await send('social/messages',{username:'alice',text:'DM while minimized'});
  await page.waitForFunction(()=>repoMessaging.getState().unread===2,{},{timeout:12000});
  assert.equal(await page.locator('#repo-messages').isVisible(),false);
  const soundKeys=await page.evaluate(()=>__sounds.map(s=>s.key));assert(soundKeys.includes('community:'+group.id));assert(soundKeys.includes('dm:'+dm.message.id));
  assert.equal(await page.evaluate(()=>__notices.length),2);assert.equal(await page.locator('.repo-message-count').first().textContent(),'2');
  const through=f.sql.prepare('SELECT read_through FROM community_reads WHERE user_id=?').get(f.sessions.alice.user.id).read_through;assert(through<group.id,'minimized group message remains unread');
  await page.evaluate(()=>dispatchEvent(new CustomEvent('repo-launcher-portal-visibility',{detail:{visible:true}})));
  await page.evaluate(()=>repoCommunity.openChannel('general'));await page.waitForFunction(()=>repoMessaging.getState().unread===1);
  await page.evaluate(()=>repoMessaging.open('bob'));await page.waitForFunction(()=>repoMessaging.getState().unread===0);
  const notificationKeys=await page.evaluate(()=>__notices.map(n=>(n.channel?'community:':'dm:')+n.id));assert.equal(new Set(notificationKeys).size,2,'restoring does not replay notices');
  assert.deepEqual(errors,[]);console.log('PASS: real group and DM API messages arrive with sound events and combined badge while Wibs is hidden; each clears only after reading.');
 }finally{await browser?.close();await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
