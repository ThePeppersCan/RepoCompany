'use strict';
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const {createFixture} = require('./messaging-test-server.cjs');

(async () => {
  const fixture = await createFixture();
  let browser;
  const checks = [], errors = [];
  try {
    browser = await chromium.launch({channel:'msedge', headless:true, args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
    const context = await fixture.browserContext(browser, 'alice'), page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    let first = true; const ids = [];
    await context.route(fixture.base + '/api/social/messages', async route => {
      if (route.request().method() !== 'POST') return route.fallback();
      ids.push(route.request().postDataJSON().clientId);
      const response = await route.fetch();
      if (first) { first = false; return route.fulfill({status:503,json:{error:'The response was interrupted.'}}); }
      return route.fulfill({response});
    });
    await page.goto(fixture.base + '/#account/friends');
    await page.waitForFunction(() => repoAccount.state.social?.friends?.length && window.repoMessaging);
    await page.locator('[data-message-player="bob"]').click();
    await page.getByRole('textbox',{name:'Message',exact:true}).fill('One message, even after an interrupted response.');
    await page.getByRole('button',{name:'Send message',exact:true}).click();
    await page.locator('.repo-message-feedback').filter({hasText:'press Send to retry'}).waitFor();
    assert.equal(await page.getByRole('textbox',{name:'Message',exact:true}).inputValue(),'One message, even after an interrupted response.');
    await page.getByRole('button',{name:'Send message',exact:true}).click();
    await page.getByRole('log').getByText('One message, even after an interrupted response.',{exact:true}).waitFor();
    assert.equal(ids.length,2); assert.equal(ids[0],ids[1]);
    assert.equal(fixture.sql.prepare('SELECT COUNT(*) n FROM social_messages').get().n,1);
    checks.push('Retry preserves the draft and idempotency ID after an uncertain response; only one server message exists.');

    let release, pending = false;
    await context.route(fixture.base + '/api/social/messages?*', async route => {
      pending = true; await new Promise(resolve => { release = resolve; });
      await route.fulfill({json:{messages:[{id:999,sender:'bob',text:'OLD ACCOUNT CONTENT',createdAt:Date.now()}],readThrough:0,peerReadThrough:0,hasMore:false}}).catch(() => {});
    });
    await page.evaluate(() => repoMessaging.open('bob'));
    await page.waitForTimeout(150); assert(pending);
    await page.evaluate(() => { repoAccount.state.user = null; dispatchEvent(new CustomEvent('repo-account-state')); });
    release(); await page.waitForTimeout(300);
    assert.equal(await page.locator('#repo-messages').isVisible(),false);
    assert.equal(await page.locator('.repo-message-history').textContent(),'');
    assert.equal(await page.evaluate(() => repoMessaging.getState().unread),0);
    checks.push('Signing out discards pending history responses, clears visible messages and unread counts.');
    await context.close();

    const bobContext = await fixture.browserContext(browser, 'bob');
    await bobContext.addInitScript(() => {
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      window.__permissionRequests = 0; window.__pendingMedia = [];
      navigator.mediaDevices.getUserMedia = async constraints => {
        window.__permissionRequests++;
        const stream = await original(constraints); window.__pendingMedia.push(stream);
        await new Promise(resolve => { window.__releaseCapture = resolve; });
        return stream;
      };
    });
    const callResponse = await bobContext.request.post(fixture.base + '/api/social/calls', {headers:{Authorization:'Bearer '+fixture.sessions.alice.access_token,Origin:fixture.base},data:{username:'bob',kind:'video',clientId:crypto.randomUUID()}});
    assert.equal(callResponse.status(),200);
    const bob = await bobContext.newPage(); bob.on('pageerror', error => errors.push(error.message));
    await bob.goto(fixture.base + '/');
    await bob.getByRole('button',{name:'Answer call',exact:true}).waitFor();
    assert.equal(await bob.evaluate(() => window.__permissionRequests),0);
    assert.equal(await bob.evaluate(() => repoMessaging.getState().incomingCall),true);
    await bob.getByRole('button',{name:'Answer call',exact:true}).click();
    await bob.waitForFunction(() => !!window.__releaseCapture);
    assert.equal(await bob.getByRole('button',{name:'Decline call',exact:true}).isEnabled(),true,'A pending device request must remain cancellable.');
    await bob.evaluate(() => { repoAccount.state.user = null; dispatchEvent(new CustomEvent('repo-account-state')); window.__releaseCapture(); });
    await bob.waitForFunction(() => window.__pendingMedia.every(stream => stream.getTracks().every(track => track.readyState === 'ended')));
    assert.equal(await bob.evaluate(() => repoMessaging.getState().callActive),false);
    checks.push('Incoming calls do not request devices. Signing out during a pending permission/capture request stops every returned track.');
    await bobContext.close();

    fixture.sql.exec('DELETE FROM social_signals; DELETE FROM social_call_slots; DELETE FROM social_calls;');
    delete fixture.env.SOCIAL_TURN_KEY_ID; delete fixture.env.SOCIAL_TURN_KEY_API_TOKEN;
    const noCalls = await fixture.browserContext(browser,'alice'), plain = await noCalls.newPage();
    plain.on('pageerror', error => errors.push(error.message));
    await plain.goto(fixture.base + '/#account/friends');
    await plain.waitForFunction(() => repoAccount.state.social?.friends?.length && window.repoMessaging);
    await plain.locator('[data-message-player="bob"]').click();
    await plain.locator('.repo-message-row').first().waitFor();
    assert.equal(await plain.getByRole('button',{name:'Start voice call',exact:true}).isVisible(),false);
    assert.equal(await plain.getByRole('button',{name:'Start video call',exact:true}).isVisible(),false);
    assert.equal(await plain.getByText('Calls are being set up. Messaging is available.',{exact:true}).count(),0);
    assert.equal(await plain.getByRole('textbox',{name:'Message',exact:true}).isEnabled(),true);
    checks.push('Disabled calling has no controls or setup promises; text messaging remains available.');
    await noCalls.close();

    fixture.sql.exec('DELETE FROM social_messages; DELETE FROM social_conversations; DELETE FROM social_rate_limits;');
    for(let i=0;i<60;i++) {
      const username='friend'+String(i).padStart(2,'0'), id='44444444-4444-4444-8444-'+String(i).padStart(12,'0'), conversation=crypto.randomUUID();
      fixture.sql.prepare('INSERT INTO dashboard_players(username,user_id,display_name) VALUES(?,?,?)').run(username,id,username);
      fixture.sql.prepare("INSERT INTO dashboard_friendships VALUES('alice',?,'alice','accepted',?)").run(username,Date.now());
      fixture.sql.prepare('INSERT INTO social_conversations(id,a_id,b_id,a_name,b_name,updated_at) VALUES(?,?,?,?,?,?)').run(conversation,fixture.sessions.alice.user.id,id,'alice',username,Date.now());
      fixture.sql.prepare('INSERT INTO social_messages(conversation_id,sender_id,sender_name,client_id,text,created_at) VALUES(?,?,?,?,?,?)').run(conversation,id,username,crypto.randomUUID(),'A message from '+username,Date.now());
    }
    const large = await fixture.browserContext(browser,'alice'), list = await large.newPage();
    list.on('pageerror',error=>errors.push(error.message));
    await list.goto(fixture.base+'/');
    await list.waitForFunction(()=>window.repoMessaging?.getState().unread===60);
    await list.evaluate(()=>repoMessaging.open());
    await list.locator('.repo-message-friend[data-username="friend00"] .repo-message-preview').filter({hasText:'A message from friend00'}).waitFor();
    assert.equal(await list.locator('.repo-message-friend[data-username="friend00"] .repo-message-count').textContent(),'1');
    checks.push('Conversations beyond the newest inbox page retain their message previews and unread badges.');
    await list.evaluate(()=>repoMessaging.open('friend59'));
    await list.getByRole('log').getByText('A message from friend59',{exact:true}).waitFor();
    fixture.sql.prepare("DELETE FROM dashboard_friendships WHERE player_a='alice' AND player_b='friend59'").run();
    await list.waitForFunction(()=>!document.querySelector('.repo-message-conversation').classList.contains('has-peer'));
    assert.equal(await list.locator('.repo-message-history').textContent(),'');
    assert.equal(await list.getByRole('textbox',{name:'Message',exact:true}).isVisible(),false);
    checks.push('Remote friendship removal clears cached history and removes the active composer without requiring an account-page visit.');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,checks}));
  } finally { await browser?.close(); await fixture.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
