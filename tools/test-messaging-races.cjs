'use strict';
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const {createFixture} = require('./messaging-test-server.cjs');

(async () => {
  const fixture = await createFixture(); let browser;
  const checks = [], errors = [];
  try {
    browser = await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
    for (const heldMethod of ['setRemoteDescription','createAnswer']) {
      fixture.sql.exec('DELETE FROM social_signals; DELETE FROM social_call_slots; DELETE FROM social_calls; DELETE FROM social_rate_limits;');
      const a = await fixture.browserContext(browser,'alice'), b = await fixture.browserContext(browser,'bob');
      await b.addInitScript(({heldMethod}) => {
        const Native = window.RTCPeerConnection;
        window.__pcs = []; window.__rtcOperations = [];
        window.RTCPeerConnection = class extends Native {
          constructor(...args) {
            super(...args); const index = window.__pcs.push(this) - 1;
            for (const method of ['setRemoteDescription','createAnswer','setLocalDescription','createOffer','addIceCandidate']) {
              const original = this[method].bind(this);
              this[method] = async (...values) => {
                window.__rtcOperations.push({index,method}); const result = await original(...values);
                if (index === 0 && method === heldMethod && !window.__heldOnce) {
                  window.__heldOnce = true; await new Promise(resolve => { window.__releaseRtc = resolve; });
                }
                return result;
              };
            }
          }
        };
      }, {heldMethod});
      const alice = await a.newPage(), bob = await b.newPage();
      for (const page of [alice,bob]) page.on('pageerror',error => errors.push(error.message));
      await Promise.all([alice.goto(fixture.base+'/'),bob.goto(fixture.base+'/')]);
      for (const page of [alice,bob]) await page.waitForFunction(() => window.repoMessaging && repoAccount.state.social?.friends?.length);
      await alice.evaluate(() => repoMessaging.open('bob'));
      await alice.getByRole('button',{name:'Start voice call',exact:true}).click();
      await bob.getByRole('button',{name:'Answer call',exact:true}).click();
      await bob.waitForFunction(() => !!window.__releaseRtc);
      const oldId = fixture.sql.prepare("SELECT id FROM social_calls WHERE status='active'").get().id;
      if (heldMethod === 'createAnswer') {
        await bob.evaluate(() => { window.__priorUser=repoAccount.state.user; repoAccount.state.user={id:'33333333-3333-4333-8333-333333333333'}; dispatchEvent(new CustomEvent('repo-account-state')); });
        await alice.getByRole('button',{name:'End call',exact:true}).click();
        await bob.evaluate(() => { repoAccount.state.user=window.__priorUser; dispatchEvent(new CustomEvent('repo-account-state')); });
      } else await bob.getByRole('button',{name:'End call',exact:true}).click();
      for (const page of [alice,bob]) await page.locator('#repo-call').waitFor({state:'hidden'});
      // Create and connect a replacement while the old RTC promise is still held.
      await bob.evaluate(() => repoMessaging.open('alice'));
      await bob.getByRole('button',{name:'Start voice call',exact:true}).click();
      await alice.getByRole('button',{name:'Answer call',exact:true}).click();
      await bob.waitForFunction(() => window.__pcs.length === 2 && window.__pcs[1].connectionState === 'connected',{},{timeout:30000});
      const newId = fixture.sql.prepare("SELECT id FROM social_calls WHERE status='active'").get().id;
      assert.notEqual(newId,oldId);
      await bob.evaluate(() => window.__releaseRtc());
      await bob.waitForTimeout(400);
      const calls = await bob.evaluate(() => window.__rtcOperations);
      assert.equal(calls.filter(c => c.index===1 && c.method==='createAnswer').length,0,'Old callee work must never create an answer on the new caller PC.');
      assert.equal(calls.filter(c => c.index===0 && c.method==='setLocalDescription').length,0,'Cancelled peer must never receive a late answer.');
      assert.equal(fixture.sql.prepare("SELECT COUNT(*) n FROM social_signals WHERE call_id=? AND type='answer'").get(oldId).n,0);
      assert.equal(fixture.sql.prepare("SELECT COUNT(*) n FROM social_signals WHERE call_id=? AND type='answer'").get(newId).n,1);
      assert.equal(await bob.evaluate(() => repoMessaging.getState().callActive),true);
      await bob.getByRole('button',{name:'End call',exact:true}).click();
      checks.push('Deferred '+heldMethod+' after '+(heldMethod==='createAnswer'?'an account switch':'cancelling')+' cannot mutate or signal a connected replacement call.');
      await a.close(); await b.close();
    }

    fixture.sql.exec('DELETE FROM social_signals; DELETE FROM social_call_slots; DELETE FROM social_calls; DELETE FROM social_messages; DELETE FROM social_conversations; DELETE FROM social_rate_limits;');
    const a = await fixture.browserContext(browser,'alice'), b = await fixture.browserContext(browser,'bob'), alice = await a.newPage(), bob = await b.newPage();
    for (const page of [alice,bob]) page.on('pageerror',error => errors.push(error.message));
    await b.addInitScript(() => {
      document.addEventListener('DOMContentLoaded',()=>{document.documentElement.dataset.repoLauncher='true';});
      const Native = window.AudioContext;
      window.__chimes = 0;
      if (Native) window.AudioContext = class extends Native { createOscillator() { window.__chimes++; return super.createOscillator(); } };
    });
    await Promise.all([alice.goto(fixture.base+'/'),bob.goto(fixture.base+'/')]);
    for (const page of [alice,bob]) await page.waitForFunction(() => window.repoMessaging && repoAccount.state.social?.friends?.length);
    await bob.evaluate(() => repoMessaging.open('alice'));
    await bob.getByRole('textbox',{name:'Message',exact:true}).click(); // Trusted gesture unlocks only the notification context.
    await bob.evaluate(() => { window.__testPrefs={muted:false,effects:1}; window.dashboardAudio={...window.dashboardAudio,preferences:()=>window.__testPrefs}; dispatchEvent(new CustomEvent('repo-launcher-portal-visibility',{detail:{visible:false}})); });
    await alice.evaluate(() => repoMessaging.open('bob'));
    await alice.getByRole('textbox',{name:'Message',exact:true}).fill('Unread while the game is in front.');
    await alice.getByRole('button',{name:'Send message',exact:true}).click();
    await bob.waitForFunction(() => repoMessaging.getState().unread===1);
    assert.equal(fixture.sql.prepare('SELECT read_b FROM social_conversations').get().read_b,0);
    assert.equal(await bob.evaluate(() => window.__chimes),2);
    await bob.evaluate(() => { window.__testPrefs.muted=true; });
    await alice.getByRole('textbox',{name:'Message',exact:true}).fill('Muted notifications stay silent.');
    await alice.getByRole('button',{name:'Send message',exact:true}).click();
    await bob.waitForFunction(() => repoMessaging.getState().unread===2);
    assert.equal(await bob.evaluate(() => window.__chimes),2);
    await bob.evaluate(() => dispatchEvent(new CustomEvent('repo-launcher-portal-visibility',{detail:{visible:true}})));
    await bob.waitForFunction(() => repoMessaging.getState().unread===0);
    assert(fixture.sql.prepare('SELECT read_b FROM social_conversations').get().read_b>0);
    checks.push('Hidden launcher portal preserves unread messages and plays only an allowed notification chime; restoring the portal marks visible messages read.');
    await bob.evaluate(() => { dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})); dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})); repoMessaging.close(); });
    await alice.getByRole('textbox',{name:'Message',exact:true}).fill('Messages continue after browser back.');
    await alice.getByRole('button',{name:'Send message',exact:true}).click();
    await bob.waitForFunction(() => repoMessaging.getState().unread===1);
    checks.push('Polling resumes after a persisted pagehide/pageshow lifecycle.');
    assert.deepEqual(errors,[]); console.log(JSON.stringify({passed:true,checks}));
  } finally { await browser?.close(); await fixture.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
