'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
const {createFixture}=require('./messaging-test-server.cjs');
(async()=>{
  const fixture=await createFixture();let browser;
  try {
    browser=await chromium.launch({channel:'msedge',headless:true});
    const context=await fixture.browserContext(browser,'alice'),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(fixture.base+'/');await page.waitForFunction(()=>window.repoMessaging&&repoAccount.state.social?.friends?.length);
    const badge=page.locator('.repo-message-launch .repo-message-count');assert.equal(await badge.isVisible(),false);
    const response=await context.request.post(fixture.base+'/api/social/messages',{headers:{Authorization:'Bearer '+fixture.sessions.bob.access_token,Origin:fixture.base},data:{username:'alice',text:'Unread badge check',clientId:crypto.randomUUID()}});
    assert.equal(response.status(),200);
    await page.evaluate(()=>dispatchEvent(new Event('online')));
    await page.waitForFunction(()=>repoMessaging.getState().unread===1);await badge.waitFor();
    assert.equal(await badge.textContent(),'1');assert.equal(await page.getByRole('button',{name:'Wibs, 1 unread message',exact:true}).count(),1);
    for(const width of [1100,1920]) {
      await page.setViewportSize({width,height:900});
      await page.waitForFunction(()=>document.querySelector(".repo-message-launch").getBoundingClientRect().right<innerWidth);
      const geometry=await badge.evaluate(b=>{const r=b.getBoundingClientRect(),icon=b.parentElement.querySelector('.repo-wibs-icon').getBoundingClientRect();return {right:r.right,top:r.top,width:r.width,height:r.height,iconRight:icon.right,iconTop:icon.top};});
      assert(geometry.right<=width&&geometry.top>0,JSON.stringify({width,geometry}));assert(geometry.width<=30&&geometry.height<=20);assert(Math.abs(geometry.right-geometry.iconRight)<16);
    }
    await page.locator('.account').screenshot({path:path.resolve(__dirname,'../../../outputs/wibs-unread-homepage.png')});
    await page.evaluate(()=>repoMessaging.open());await page.waitForFunction(()=>document.querySelector('#repo-messages').open);
    assert.equal(await page.evaluate(()=>repoMessaging.getState().unread),1,'merely opening Wibs does not read a direct message');
    await page.evaluate(()=>repoMessaging.open('bob'));await page.waitForFunction(()=>repoMessaging.getState().unread===0);assert.equal(await badge.isVisible(),false);
    await page.evaluate(()=>repoMessaging.close());
    const row=fixture.sql.prepare('SELECT * FROM social_messages LIMIT 1').get();
    for(let i=0;i<103;i++)fixture.sql.prepare('INSERT INTO social_messages(conversation_id,sender_id,sender_name,client_id,text,created_at) VALUES(?,?,?,?,?,?)').run(row.conversation_id,row.sender_id,row.sender_name,crypto.randomUUID(),'Unread '+i,Date.now());
    await page.evaluate(()=>dispatchEvent(new Event('online')));await page.waitForFunction(()=>repoMessaging.getState().unread===103);
    assert.equal(await badge.textContent(),'99+');assert.equal(await page.getByRole('button',{name:'Wibs, 103 unread messages',exact:true}).count(),1);
    await page.locator('.account').screenshot({path:path.resolve(__dirname,'../../../outputs/wibs-unread-homepage-many.png')});
    // Native connection may finish after the inbox. It must be able to request the count again.
    const replay=await page.evaluate(()=>{let value;addEventListener('repo-messaging-state',e=>value=e.detail,{once:true});dispatchEvent(new Event('repo-messaging-request'));return value;});assert.equal(replay.unread,103);
    await page.evaluate(()=>{repoAccount.state.user=null;dispatchEvent(new CustomEvent('repo-account-state'));});
    assert.equal(await page.evaluate(()=>repoMessaging.getState().unread),0);assert.equal(await badge.isVisible(),false);
    assert.deepEqual(errors,[]);console.log('PASS: real unread counts, read-through, initial replay, zero/sign-out, count cap and homepage badge layout at 1100/1920px.');
  } finally {await browser?.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
