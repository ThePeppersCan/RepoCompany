'use strict';
// Explicit integration test against the dedicated SFU app. Fake microphones and
// isolated fixture identities; no real users are called and no audio is recorded.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
async function received(page,expected){
 const deadline=Date.now()+90000;let stats=[];
 do{
  stats=await page.evaluate(async()=>{const result=[];for(const pc of window.__voicePCs.filter(p=>p.connectionState==='connected'))for(const s of(await pc.getStats()).values())if(s.type==='inbound-rtp'&&s.kind==='audio')result.push({bytes:s.bytesReceived,packets:s.packetsReceived,remote:pc.remoteDescription?.type});return result;});
  if(stats.filter(s=>s.bytes>1000&&s.remote==='offer').length>=expected)return stats;
  await new Promise(r=>setTimeout(r,500));
 }while(Date.now()<deadline);
 assert.fail('Expected '+expected+' received SFU audio tracks: '+JSON.stringify(stats));
}
(async()=>{
 const secrets=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../.wrangler/voice-secrets.json'),'utf8'));
 const fixture=await createFixture({voiceSecrets:secrets});
 fixture.sql.prepare("INSERT INTO dashboard_friendships VALUES('alice','mallory','alice','accepted',?)").run(Date.now());
 const browser=await chromium.launch({channel:"msedge",headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 const contexts=[];const errors=[];
 try{
  const pages=[];
  for(const who of ['alice','bob','mallory']){
   const context=await fixture.browserContext(browser,who);contexts.push(context);
   await context.addInitScript(()=>{const Base=RTCPeerConnection;window.__voicePCs=[];window.RTCPeerConnection=class extends Base{constructor(...args){super(...args);window.__voicePCs.push(this);}};});
   const page=await context.newPage();page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',who,e.message);});
   page.on('response',async r=>{if(r.url().includes('/api/voice/')&&r.status()>=400)console.log('VOICE API',who,new URL(r.url()).pathname,r.status(),await r.text());});
   await page.goto(fixture.base);await page.waitForFunction(()=>window.repoVoice?.getState().enabled);pages.push(page);
  }
  const [alice,bob,mallory]=pages;
  await alice.evaluate(()=>window.repoMessaging.open());
  await alice.evaluate(()=>window.repoVoice.startPrivate('bob'));
  await bob.waitForFunction(()=>window.repoVoice.getState().incomingCall,{},{timeout:40000});
  await bob.evaluate(()=>window.repoMessaging.open());await bob.getByRole('button',{name:'Answer',exact:true}).click();
  for(const page of [alice,bob])console.log('Received audio',await received(page,1));
  console.log('PASS: two real browser microphones connected through Cloudflare; both received audio bytes.');
  await alice.getByRole('button',{name:'Mute',exact:true}).click();assert.equal(await alice.getByRole('button',{name:'Unmute',exact:true}).getAttribute('aria-pressed'),'true');
  await alice.getByRole('button',{name:'Deafen',exact:true}).click();
  const shot=path.resolve(__dirname,'../../../outputs/voice-call-preview.png');fs.mkdirSync(path.dirname(shot),{recursive:true});await alice.screenshot({path:shot});
  await alice.evaluate(()=>window.repoMessaging.close());assert(await alice.evaluate(()=>window.repoMessaging.getState().callActive),'client state remains active while chat minimized');
  await alice.evaluate(()=>window.repoVoice.leave());await bob.waitForFunction(()=>!window.repoVoice.getState().callActive,{},{timeout:30000});
  assert.equal(await alice.evaluate(()=>window.__voicePCs.some(p=>p.connectionState!=='closed')),false);
  await alice.evaluate(()=>window.repoMessaging.open());await alice.getByRole('button',{name:'Voice room',exact:true}).click();
  await alice.getByRole('textbox',{name:'Voice room name'}).fill('Evening games');
  await alice.getByLabel('Bob',{exact:true}).check();await alice.getByLabel('Mallory',{exact:true}).check();await alice.getByRole('button',{name:'Start room',exact:true}).click();
  for(const page of [bob,mallory]){await page.evaluate(()=>window.repoMessaging.open());await page.getByRole('button',{name:'Join room',exact:true}).click({timeout:40000});}
  for(const page of pages)console.log('Received group audio',await received(page,2));
  console.log('PASS: three-person room, each browser receives both other microphones through Cloudflare.');
  await alice.screenshot({path:path.resolve(__dirname,'../../../outputs/voice-room-preview.png')});
  const room=fixture.voiceHub.state.rooms.find(r=>!r.ended),sessionIds=Object.values(room.members).flatMap(m=>[m.pub?.id,m.recv?.id]).filter(Boolean);
  fixture.voiceHub.state.usage[new Date().toISOString().slice(0,7)]=800000000000-1000;
  await fixture.voiceHub.alarm();assert(room.ended);
  for(const id of sessionIds){const response=await fixture.voiceHub.sfu('/sessions/'+id,undefined,'GET');assert((response.tracks||[]).every(t=>['inactive','closed'].includes(t.status)),'server closed every Cloudflare track at cutoff');}
  for(const page of pages)await page.waitForFunction(()=>!window.repoVoice.getState().callActive,{},{timeout:30000});
  console.log('PASS: the server forcibly closed all live Cloudflare audio tracks at the cutoff; clients stopped.');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: mute/deafen, minimized native-client state, remote hangup and local microphone cleanup.');
 }catch(error){
  console.log('Room diagnostics',JSON.stringify(fixture.voiceHub.state.rooms.map(r=>({kind:r.kind,ended:r.ended,reason:r.reason,members:Object.values(r.members).map(m=>({name:m.name,status:m.status,lease:m.lease-Date.now()}))}))));
  for(const c of contexts)for(const p of c.pages())console.log('Browser voice diagnostics',await p.evaluate(()=>({state:window.repoVoice?.getState(),panel:document.querySelector('.repo-voice-panel')?.textContent,open:document.querySelector('.repo-messages')?.open})));
  throw error;
 }finally{
  for(const r of fixture.voiceHub.state.rooms)fixture.voiceHub.end(r,'Test complete',Date.now());
  await fixture.voiceHub.alarm();
  await Promise.all(contexts.map(c=>c.close()));await browser.close();await fixture.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
