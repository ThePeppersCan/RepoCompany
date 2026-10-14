'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fixture=await createFixture(),out=path.resolve(process.env.REPO_SOCIAL_QA_OUTPUT||'QA/messaging');fs.mkdirSync(out,{recursive:true});
 let browser;const errors=[];const report={checks:[],mediaTransport:'Real local WebRTC with synthetic camera/microphone. Public TURN not configured or tested.'};
 try{
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--autoplay-policy=no-user-gesture-required']});
  const a=await fixture.browserContext(browser,'alice'),b=await fixture.browserContext(browser,'bob'),alice=await a.newPage(),bob=await b.newPage();
  for(const page of [alice,bob]){page.on('pageerror',e=>errors.push(e.message));page.on('response',async r=>{if(r.url().includes('/api/social/')&&r.status()>=400)console.log('SOCIAL',r.status(),new URL(r.url()).pathname,(await r.text()).slice(0,200));});}
  await Promise.all([alice.goto(fixture.base+'/#account/friends'),bob.goto(fixture.base+'/#collection')]);
  await Promise.all([alice.waitForFunction(()=>repoAccount.state.social?.friends?.length&&window.repoMessaging),bob.waitForFunction(()=>repoAccount.state.social?.friends?.length&&window.repoMessaging)]);
  await alice.locator('[data-message-player="bob"]').click();
  await alice.getByRole('textbox',{name:'Message',exact:true}).fill('Ready for another night in Morogue?');await alice.getByRole('button',{name:'Send message',exact:true}).click();
  await bob.waitForFunction(()=>repoMessaging.getState().unread===1);
  await bob.screenshot({path:path.join(out,'incoming-message.png')});
  await bob.getByRole('button',{name:'Open message',exact:true}).click();
  await bob.getByRole('log',{name:'Message history'}).getByText('Ready for another night in Morogue?',{exact:true}).waitFor();
  await bob.getByRole('textbox',{name:'Message',exact:true}).fill('Absolutely. Let’s meet at the Salt Oracle.');await bob.getByRole('button',{name:'Send message',exact:true}).click();
  await alice.getByRole('log',{name:'Message history'}).getByText('Absolutely. Let’s meet at the Salt Oracle.',{exact:true}).waitFor();
  await alice.screenshot({path:path.join(out,'conversation-desktop.png')});
  assert.equal(fixture.sql.prepare('SELECT COUNT(*) n FROM social_messages').get().n,2);report.checks.push('Real API persisted messages between isolated accounts; incoming notification and replies rendered.');
  await alice.getByRole('textbox',{name:'Message',exact:true}).fill('<img src=x onerror="alert(1)">');await alice.getByRole('button',{name:'Send message',exact:true}).click();
  await bob.getByRole('log',{name:'Message history'}).getByText('<img src=x onerror="alert(1)">',{exact:true}).waitFor();
  assert.equal(await bob.locator('.repo-message-history img[src="x"]').count(),0);report.checks.push('Message markup displayed as text.');
  await alice.getByRole('button',{name:'Start video call',exact:true}).click();
  await bob.getByRole('button',{name:'Answer call',exact:true}).waitFor({timeout:30000});await bob.screenshot({path:path.join(out,'incoming-call.png')});
  await bob.getByRole('button',{name:'Answer call',exact:true}).click();
  for(const page of [alice,bob])await page.waitForFunction(()=>{const video=document.querySelector('.repo-call-remote');return video?.srcObject?.getVideoTracks().some(t=>t.readyState==='live')&&video.videoWidth>0&&/^\d+:\d\d$/.test(document.querySelector('.repo-call-status')?.textContent||'')},{},{timeout:45000});
  await alice.screenshot({path:path.join(out,'connected-video-call.png')});
  await alice.getByRole('button',{name:'Mute microphone',exact:true}).click();assert.equal(await alice.getByRole('button',{name:'Unmute microphone',exact:true}).getAttribute('aria-pressed'),'true');
  await alice.getByRole('button',{name:'Turn camera off',exact:true}).click();assert.equal(await alice.locator('.repo-call-local').isVisible(),false);
  report.checks.push('Two real RTCPeerConnections negotiated audio/video; remote frames decoded; mute and camera off work.');
  await alice.getByRole('button',{name:'End call',exact:true}).click();
  for(const page of [alice,bob])await page.waitForFunction(()=>!repoMessaging.getState().callActive,{},{timeout:20000});
  assert.equal(fixture.sql.prepare('SELECT COUNT(*) n FROM social_call_slots').get().n,0);report.checks.push('Ending the call cleared both peers and server reservations.');
  await bob.locator('#repo-call').waitFor({state:'hidden'});await bob.setViewportSize({width:390,height:844});await bob.evaluate(()=>repoMessaging.open('alice'));await bob.getByRole('textbox',{name:'Message',exact:true}).waitFor({state:'visible'});await bob.screenshot({path:path.join(out,'conversation-mobile.png')});
  const box=await bob.locator('#repo-messages').boundingBox();assert(box&&box.x>=-1&&box.x+box.width<=391);report.checks.push('Mobile conversation fits the viewport.');
  fixture.sql.prepare("DELETE FROM dashboard_friendships WHERE player_a='alice' AND player_b='bob'").run();
  await alice.getByRole('textbox',{name:'Message',exact:true}).fill('This message must be rejected.');await alice.getByRole('button',{name:'Send message',exact:true}).click();
  await alice.locator('.repo-conversation-empty').filter({hasText:/no longer available/i}).waitFor();
  assert.equal(await alice.getByRole('textbox',{name:'Message',exact:true}).isVisible(),false);
  assert.equal(fixture.sql.prepare('SELECT COUNT(*) n FROM social_messages').get().n,3);report.checks.push('Server rejected sending after friendship removal.');
  assert.deepEqual(errors,[]);report.passed=true;console.log(JSON.stringify(report));
 }catch(error){report.error=error.message;report.pageErrors=errors;if(browser)for(const [i,page]of browser.contexts().flatMap(c=>c.pages()).entries())await page.screenshot({path:path.join(out,'failure-'+i+'.png')}).catch(()=>{});throw error;}
 finally{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2));await browser?.close();await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
