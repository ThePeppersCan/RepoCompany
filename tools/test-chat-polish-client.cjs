const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fetch=global.fetch,f=await createFixture(),browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],activity=[];
 const req=async(who,area,route,body)=>{const r=await fetch(f.base+'/api/'+area+'/'+route,{method:'POST',headers:{Authorization:'Bearer '+f.sessions[who].access_token,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(r.status,200,await r.text());};
 const bottom=page=>page.waitForFunction(()=>{const e=document.querySelector('.rc-log');return e.scrollHeight-e.scrollTop-e.clientHeight<4;});
 try{
  f.sql.exec("UPDATE dashboard_players SET display_name='CovidPanda' WHERE username='alice'");
  const insert=f.sql.prepare('INSERT INTO community_messages(channel_id,sender_id,sender_name,client_id,text,created_at) VALUES(?,?,?,?,?,?)');
  for(let i=0;i<65;i++)insert.run('general',f.sessions.alice.user.id,'alice',crypto.randomUUID(),'Earlier message '+i+' — keeping everyone up to date.',Date.now()-3600000+i*1000);
  const a=await f.browserContext(browser,'alice'),b=await f.browserContext(browser,'bob'),page=await a.newPage(),peer=await b.newPage();
  for(const p of [page,peer]){p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url().includes('/typing'))activity.push({method:r.method(),body:r.postDataJSON()});});await p.goto(f.base);await p.waitForFunction(()=>window.repoCommunity&&window.repoAccount.state.user);await p.evaluate(()=>repoMessaging.open());await p.locator('.rc-log [data-message-id],.rc-log .rc-message').first().waitFor();}
  const input=page.locator('.rc-composer textarea'),indicator=peer.locator('.rc-channel-view>.repo-typing');
  const writing=input.pressSequentially('Here comes a message to our friends',{delay:150});
  try{await indicator.filter({hasText:'CovidPanda is typing…'}).waitFor({timeout:12000});await writing;}catch(error){console.error({activity,rows:f.sql.prepare('SELECT * FROM wibs_typing').all(),errors,view:await page.locator('#repo-messages').evaluate(e=>({open:e.open,mode:e.dataset.communityView,hidden:document.hidden,text:e.querySelector('.rc-composer textarea').value})),peer:await indicator.textContent()});throw error;}
  assert(await indicator.evaluate(e=>e.classList.contains('is-active')));assert(activity.filter(r=>r.body.active).length<=2,'keystrokes are throttled');assert(activity.every(r=>r.method==='POST'),'no extra typing poll loop');
  await peer.emulateMedia({reducedMotion:'no-preference'});assert.equal(await indicator.locator('i').first().evaluate(e=>getComputedStyle(e).animationName),'repo-typing-wave');
  const out=path.resolve(__dirname,'../../../outputs');fs.mkdirSync(out,{recursive:true});await peer.screenshot({path:path.join(out,'wibs-typing.png')});
  // Scroll up deliberately: the next actual incoming message follows the conversation.
  await peer.locator('.rc-log').evaluate(e=>{e.scrollTop=0;});await page.locator('.rc-send').click();
  await peer.getByText('Here comes a message to our friends',{exact:true}).waitFor({timeout:15000});await bottom(peer);
  await peer.waitForFunction(()=>!document.querySelector('.rc-channel-view>.repo-typing').classList.contains('is-active'));
  // Reproduce the native file input's bubbling cancel event. Wibs and draft stay open.
  await input.fill('Keep my draft');
  await page.locator('.rc-composer input[type=file]').evaluate(e=>e.dispatchEvent(new Event('cancel',{bubbles:true,cancelable:false})));
  assert(await page.locator('#repo-messages').evaluate(e=>e.open));assert.equal(await input.inputValue(),'Keep my draft');
  // Slow media growth after rendering must not push the latest message below the viewport.
  await peer.locator('.rc-log').evaluate(e=>{const image=document.createElement('div');image.id='delayed-media';image.style.height='1px';e.lastElementChild.append(image);});
  await peer.waitForTimeout(100);await peer.locator('#delayed-media').evaluate(e=>{e.style.height='700px';});await bottom(peer);
  await peer.locator('.rc-log').evaluate(e=>{e.scrollTop=0;});await peer.getByRole('button',{name:'Earlier messages',exact:true}).click();await peer.waitForTimeout(300);
  assert(await peer.locator('.rc-log').evaluate(e=>e.scrollHeight-e.scrollTop-e.clientHeight>200),'older history stays in place');
  await page.getByRole('button',{name:'Direct messages',exact:true}).click();await page.getByRole('button',{name:'Message Bob',exact:true}).click();
  await peer.getByRole('button',{name:'Direct messages',exact:true}).click();await peer.getByRole('button',{name:'Message Alice',exact:true}).click();
  await req('alice','social','messages',{username:'bob',text:'Start our private chat',clientId:crypto.randomUUID()});
  const conversation=f.sql.prepare('SELECT id FROM social_conversations').get();
  const dmInsert=f.sql.prepare('INSERT INTO social_messages(conversation_id,sender_id,sender_name,client_id,text,created_at) VALUES(?,?,?,?,?,?)');
  for(let i=0;i<60;i++)dmInsert.run(conversation.id,f.sessions.alice.user.id,'alice',crypto.randomUUID(),'Private earlier message '+i,Date.now()-3600000+i*1000);
  await peer.getByText('Private earlier message 59',{exact:true}).waitFor({timeout:15000});
  f.sql.exec('UPDATE wibs_typing SET updated_at=0');
  const dmInput=page.locator('.repo-message-composer textarea'),dmIndicator=peer.locator('.repo-message-conversation>.repo-typing');
  const dmWriting=dmInput.pressSequentially('A private typing indicator',{delay:180});await dmIndicator.filter({hasText:'CovidPanda is typing…'}).waitFor({timeout:10000});await dmWriting;
  await peer.locator('.repo-message-history').evaluate(e=>{e.scrollTop=0;});
  await page.locator('.repo-message-send').click();await peer.getByText('A private typing indicator',{exact:true}).waitFor({timeout:15000});
  await peer.waitForFunction(()=>{const e=document.querySelector('.repo-message-history');return e.scrollHeight-e.scrollTop-e.clientHeight<4;});
  await peer.locator('.repo-message-history').evaluate(e=>{const media=document.createElement('div');media.style.height='600px';e.lastElementChild.append(media);});
  await peer.waitForFunction(()=>{const e=document.querySelector('.repo-message-history');return e.scrollHeight-e.scrollTop-e.clientHeight<4;});
  await page.locator('.repo-message-composer input[type=file]').evaluate(e=>e.dispatchEvent(new Event('cancel',{bubbles:true})));assert(await page.locator('#repo-messages').evaluate(e=>e.open));
  f.sql.exec('UPDATE wibs_typing SET updated_at=0');await dmInput.fill('Still here');await page.evaluate(()=>repoMessaging.close());
  await peer.waitForFunction(()=>!document.querySelector('.repo-message-conversation>.repo-typing').classList.contains('is-active'),null,{timeout:15000});
  await peer.setViewportSize({width:390,height:844});assert.equal(await peer.evaluate(()=>document.querySelector('#repo-messages').scrollWidth>innerWidth),false);await peer.screenshot({path:path.join(out,'wibs-typing-mobile.png')});
  assert.deepEqual(errors,[]);console.log('PASS: two-account typing, animation, throttling/no new poll loop, send/leave clearing, file-picker cancellation, new-message scrolling, delayed media, older-history position and mobile layout.');
 }finally{await browser.close();await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
