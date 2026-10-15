'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
  const fixture=await createFixture(),browser=await chromium.launch({channel:'msedge',headless:true});
  const output=path.resolve(__dirname,'../../chat-extras-qa');await fs.mkdir(output,{recursive:true});
  const errors=[];
  try{
    const ac=await fixture.browserContext(browser,'alice'),bc=await fixture.browserContext(browser,'bob'),alice=await ac.newPage(),bob=await bc.newPage();
    for(const page of [alice,bob]){page.on('pageerror',e=>errors.push(e.message));await page.goto(fixture.base);await page.waitForFunction(()=>window.repoMessaging&&window.repoAccount?.state.user);}
    const call=(page,route,data)=>page.evaluate(async({route,data})=>{const {data:{session}}=await repoAccount.db.auth.getSession();const r=await fetch('/api/social/'+route,{method:data===undefined?'GET':'POST',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},...(data===undefined?{}:{body:JSON.stringify(data)})});return{status:r.status,headers:Object.fromEntries(r.headers),body:r.headers.get('content-type')?.includes('json')?await r.json():Array.from(new Uint8Array(await r.arrayBuffer()))};},{route,data});
    const send=await call(alice,'messages',{username:'bob',clientId:crypto.randomUUID(),text:'Ready for the Uncrowned?'});assert.equal(send.status,200);const messageId=send.body.message.id;
    await alice.evaluate(()=>repoMessaging.open('bob'));await bob.evaluate(()=>repoMessaging.open('alice'));
    await alice.locator('[data-reaction-for="'+messageId+'"]').click({force:true});
    await alice.getByRole('button',{name:'Morogue · Thumbs up',exact:true}).click();
    await bob.locator('.repo-reaction-chip').waitFor();assert.equal(await bob.locator('.repo-reaction-chip').getAttribute('aria-pressed'),'false');
    await bob.locator('.repo-reaction-chip').click();await bob.waitForFunction(()=>document.querySelector('.repo-reaction-chip span')?.textContent==='2');
    assert.equal((await call(alice,'reactions',{messageId,emote:'not-a-reaction'})).status,400);
    assert.equal((await call(alice,'reactions',{messageId,emote:null})).status,200);
    await alice.locator('[data-reaction-for="'+messageId+'"]').click({force:true});await alice.screenshot({path:path.join(output,'reactions.png')});await alice.keyboard.press('Escape');
    fixture.sql.prepare("INSERT INTO dashboard_blocks(blocker,blocked) VALUES('bob','alice')").run();
    assert.equal((await call(alice,'reactions',{messageId,emote:'manager-love'})).status,404);
    fixture.sql.prepare('DELETE FROM dashboard_blocks').run();
    assert.equal((await call(alice,'images',{username:'bob',clientId:crypto.randomUUID(),image:'anything'})).status,404,'Image uploads are not implemented');
    await alice.evaluate(()=>repoMessaging.close());await alice.locator('.repo-message-launch').click();await alice.getByRole('button',{name:'Close messages',exact:true}).click();
    await call(bob,'messages',{username:'alice',clientId:crypto.randomUUID(),text:'One more attempt then!'});
    await alice.locator('.repo-message-toast:popover-open').waitFor();
    const anchor=await alice.locator('.repo-message-launch').boundingBox(),notice=await alice.locator('.repo-message-toast').boundingBox();assert.ok(notice.y>=anchor.y+anchor.height);assert.ok(notice.y<anchor.y+anchor.height+20);assert.equal(await alice.evaluate(()=>!!document.activeElement.closest('.repo-message-toast')),false);
    await alice.screenshot({path:path.join(output,'notification.png')});
    // The link is an actual keyboard-operable control routed to the selected game.
    await alice.evaluate(()=>{repoMessaging.close();accountMenu.open({tab:'profile',player:'bob'});});
    await alice.getByRole('button',{name:'View the achievement collection',exact:true}).click();assert.ok((await alice.url()).includes('#account/achievements/morogue'));
    await alice.evaluate(()=>accountMenu.close());
    await ac.route('https://morogue.repocompany.uk/**',route=>route.fulfill({contentType:'text/html',body:'<html><body style="background:#16121b;color:#ebd5a6;font:40px Georgia"><h1>Morogue</h1><button>Continue</button></body></html>'}));
    await alice.evaluate(()=>repoWebGame.open('morogue'));
    await alice.locator('#repo-web-game .repo-message-launch').click();
    await alice.locator('.repo-message-friend[data-username="bob"]').click();
    const panel=await alice.locator('#repo-messages').boundingBox(),game=await alice.locator('#repo-web-game iframe').boundingBox();
    assert.ok(panel.width<=440&&game.width>panel.width*2,'Web chat leaves the game visible');
    await alice.getByRole('button',{name:'Close messages',exact:true}).click();
    assert.equal(await alice.evaluate(()=>document.activeElement===document.querySelector('#repo-web-game iframe')),true);
    await alice.locator('#repo-web-game .repo-message-launch').click();
    await alice.setViewportSize({width:390,height:844});
    assert.ok(await alice.locator('#repo-messages').evaluate(e=>e.scrollWidth<=e.clientWidth),'Mobile panel fits');
    await alice.screenshot({path:path.join(output,'console-mobile.png')});
    await alice.setViewportSize({width:1440,height:900});
    await alice.screenshot({path:path.join(output,'console-game.png')});
    await alice.evaluate(()=>repoWebGame.close());
    assert.deepEqual(errors,[]);console.log('PASS: two-player reactions, change/remove, blocked friends, image uploads unavailable, anchored notification without focus theft, achievement navigation.');
  }finally{await browser.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
