'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const f=await createFixture(),browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const now=Date.now(),avatar=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../account-assets/avatar-v2/catalog.json'))).defaults;
  for(const who of ['alice','bob','mallory']){f.sql.prepare('INSERT INTO community_members VALUES(?,?,?)').run(f.sessions[who].user.id,now,now);f.sql.prepare('INSERT INTO dashboard_avatars VALUES(?,?,?)').run(who,JSON.stringify(avatar),now);}
  f.sql.prepare('INSERT INTO dashboard_game_activity VALUES(?,?,?,?)').run('alice','morogue',12*3600000,now-86400000);
  f.sql.prepare('INSERT INTO community_activity_preferences VALUES(?,1,1)').run(f.sessions.bob.user.id);
  f.sql.prepare('INSERT INTO community_external_sessions VALUES(?,?,?,?,?,?,?,1)').run(f.sessions.bob.user.id,'test-session','runelite','RuneLite',now-600000,now,1);
  f.sql.prepare('INSERT INTO community_external_activity VALUES(?,?,?,?,?)').run(f.sessions.bob.user.id,'runelite','RuneLite',3*3600000,now);
  f.sql.prepare('INSERT INTO community_activity_preferences VALUES(?,1,1)').run(f.sessions.mallory.user.id);
  f.sql.prepare('INSERT INTO community_external_activity VALUES(?,?,?,?,?)').run(f.sessions.mallory.user.id,'steam:413150','Stardew Valley',10*3600000,now-3600000);
  const context=await f.browserContext(browser,'alice'),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.setViewportSize({width:1600,height:1000});await p.goto(f.base);await p.waitForFunction(()=>window.repoCommunity&&repoAccount.state.user);await p.evaluate(()=>repoMessaging.open());
  const cards=p.locator('.rc-activity-card');await cards.nth(2).waitFor();assert.match(await cards.first().innerText(),/Bob\s+RuneLite\s+Playing now\s+3h played/);assert.match(await cards.nth(1).innerText(),/Stardew Valley/);assert.match(await cards.nth(2).innerText(),/12h played/);
  await p.waitForFunction(()=>[...document.querySelectorAll('.rc-activity-art')].every(n=>n.complete&&n.naturalWidth>0));
  assert.equal(await p.locator('.rc-member[data-voice-name="bob"] .rc-game-name').innerText(),'Playing RuneLite');
  const out=path.resolve(__dirname,'../../../outputs');fs.mkdirSync(out,{recursive:true});await p.screenshot({path:path.join(out,'wibs-recent-activity.png')});
  await cards.first().click();await p.locator('.rc-profile-popover .rc-game-name').waitFor();assert.equal(await p.locator('.rc-profile-popover .rc-game-name').innerText(),'RuneLite');await p.keyboard.press('Escape');
  await p.getByRole('button',{name:'Game activity settings',exact:true}).click();await p.getByLabel('Share game activity',{exact:false}).waitFor();assert.equal(await p.getByLabel('Detect Steam & RuneLite',{exact:false}).isChecked(),false);
  await p.getByLabel('Share game activity',{exact:false}).uncheck();await p.getByRole('button',{name:'Save changes',exact:true}).click();await p.waitForFunction(()=>!document.querySelector('.rc-editor').open);assert.equal(await cards.count(),2,'own activity hides immediately');
  await p.evaluate(()=>document.documentElement.dataset.repoLauncher='true');await p.getByRole('button',{name:'Game activity settings',exact:true}).click();await p.getByLabel('Other game name').waitFor();
  await p.evaluate(()=>dispatchEvent(new CustomEvent('repo-registered-games',{detail:[{game:'custom:'+'a'.repeat(24),title:'A registered game'}]})));assert.equal(await p.getByRole('button',{name:'Remove A registered game from detected games'}).count(),1);
  await p.getByRole('button',{name:'Cancel',exact:true}).click();
  for(const [width,height]of [[1280,800],[390,844]]){await p.setViewportSize({width,height});if(width<960)await p.getByRole('button',{name:'Show or hide members'}).click();assert.equal(await p.locator('.rc-members').evaluate(n=>n.scrollWidth>n.clientWidth),false);const card=await cards.first().boundingBox();assert(card&&card.x>=0&&card.x+card.width<=width);}
  assert.deepEqual(errors,[]);console.log('PASS: activity order/artwork, live RuneLite in members and profile, recorded hours, settings and immediate privacy update, registered-game controls, desktop/mobile layout.');
 }finally{await browser.close();await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
