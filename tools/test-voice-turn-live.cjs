'use strict';
// Opt-in paid-service integration test. Uses isolated fixture identities and
// synthetic media; credentials are read only from an ignored local file.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function mediaStats(page){
 return page.evaluate(async()=>{
  const result=[];
  for(const pc of testPeers.filter(p=>p.connectionState==='connected')){
   const audio=pc.getSenders().some(s=>s.track?.kind==='audio')||pc.getReceivers().some(r=>r.track?.kind==='audio');
   if(!audio)continue;
   const stats=await pc.getStats(),transport=[...stats.values()].find(s=>s.type==='transport'&&s.selectedCandidatePairId);
   const pair=stats.get(transport?.selectedCandidatePairId),candidate=stats.get(pair?.localCandidateId);
   result.push({id:pc.testId,type:candidate?.candidateType,relayProtocol:candidate?.relayProtocol,
    sent:[...stats.values()].filter(s=>s.type==='outbound-rtp'&&s.kind==='audio').reduce((n,s)=>n+(s.bytesSent||0),0),
    received:[...stats.values()].filter(s=>s.type==='inbound-rtp'&&s.kind==='audio').reduce((n,s)=>n+(s.bytesReceived||0),0)});
  }
  return result;
 });
}
async function receiving(page,mode){
 const until=Date.now()+45000;let stats=[];
 while(Date.now()<until){
  stats=await mediaStats(page);
  if(stats.some(s=>s.sent>1000)&&stats.some(s=>s.received>1000)){
   assert(stats.every(s=>s.type==='relay'),'every audio transport must use a selected relay candidate');
   assert(stats.every(s=>s.relayProtocol===(mode==='udp'?'udp':'tls')),'selected relay transport must match '+mode);
   return stats;
  }
  await delay(300);
 }
 assert.fail('No two-way relayed audio: '+JSON.stringify(stats));
}
(async()=>{
 const secrets=JSON.parse(fs.readFileSync(process.env.WIBS_TEST_SECRETS||path.resolve(__dirname,'../.wrangler/voice-secrets.json'),'utf8'));
 assert.equal(secrets.TURN_ENABLED,'true');assert(secrets.TURN_KEY_ID&&secrets.TURN_KEY_API_TOKEN&&secrets.SFU_APP_ID&&secrets.SFU_APP_SECRET);
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 try{for(const mode of ['udp','tls443']){
  const f=await createFixture({voiceSecrets:{...secrets,SCREEN_ENABLED:'true'}}),contexts=[],pages=[],errors=[];
  try{
   for(const who of ['alice','bob']){
    const context=await f.browserContext(browser,who);contexts.push(context);
    await context.addInitScript(mode=>{
     const Peer=RTCPeerConnection,capture=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
     window.testPeers=[];window.captureCount=0;
     navigator.mediaDevices.getUserMedia=(...args)=>{captureCount++;return capture(...args);};
     window.RTCPeerConnection=class extends Peer{
      constructor(config){
       const relays=(config?.iceServers||[]).flatMap(s=>{const urls=(Array.isArray(s.urls)?s.urls:[s.urls]).filter(u=>u===(mode==='udp'?'turn:turn.cloudflare.com:3478?transport=udp':'turns:turn.cloudflare.com:443?transport=tcp'));return urls.length?[{...s,urls}]:[];});
       super(relays.length?{...config,iceServers:relays,iceTransportPolicy:'relay'}:config);
       this.testId=testPeers.length;this.requestedConfig=config;testPeers.push(this);
      }
      get connectionState(){return this.testFailed?'failed':super.connectionState;}
      failTransport(){super.close();this.testFailed=true;this.dispatchEvent(new Event('connectionstatechange'));}
     };
     navigator.mediaDevices.getDisplayMedia=async()=>{
      const c=document.createElement('canvas');c.width=640;c.height=360;const x=c.getContext('2d');
      setInterval(()=>{x.fillStyle=`hsl(${Date.now()%360} 70% 40%)`;x.fillRect(0,0,640,360);},60);
      window.testScreen=c.captureStream(15);return testScreen;
     };
    },mode);
    const page=await context.newPage();pages.push(page);page.on('pageerror',e=>errors.push(e.message));
    await page.goto(f.base);await page.waitForFunction(()=>repoVoice?.getState().enabled);
    await page.evaluate(()=>repoMessaging.open());
    const issued=page.waitForResponse(r=>r.url().endsWith('/api/voice/ice'));
    await page.evaluate(()=>repoVoice.joinCommunity());
    assert.equal((await(await issued).json()).turn,true,'real TURN issuer must succeed');
    await page.waitForFunction(()=>repoVoice.getState().callStatus==='active',null,{timeout:45000});
   }
   const [alice,bob]=pages;
   for(const page of pages)await receiving(page,mode);
   const room=f.voiceHub.state.rooms.find(r=>!r.ended),member=room.members[f.sessions.alice.user.id],expiry=room.expires;
   await alice.getByRole('button',{name:'Share screen',exact:true}).click();
   await bob.waitForFunction(()=>document.querySelector('.repo-screen-viewer video')?.currentTime>.3,null,{timeout:30000});
   const screenId=member.screenPub.id,captures=await alice.evaluate(()=>captureCount);
   await alice.evaluate(()=>{window.originalVideo=document.querySelector('.repo-screen-viewer video');repoVoice.toggleMute();repoVoice.toggleDeafen();});
   const previous=member.pub.id,start=Date.now();
   // Close the actual transport and deliver the corresponding failure event.
   // The replacement call uses real TURN and SFU, not a mocked media server.
   await alice.evaluate(()=>testPeers.find(p=>p.connectionState==='connected'&&p.getSenders().some(s=>s.track?.kind==='audio')).failTransport());
   await alice.waitForFunction(()=>repoVoice.getState().busy);
   await alice.waitForFunction(()=>!repoVoice.getState().busy&&repoVoice.getState().callStatus==='active',null,{timeout:45000});
   assert.notEqual(member.pub.id,previous);assert.equal(member.screenPub.id,screenId);assert.equal(room.expires,expiry);
   assert.deepEqual(await alice.evaluate(()=>({muted:repoVoice.getState().muted,deafened:repoVoice.getState().deafened,captures:captureCount,screen:testScreen.getTracks()[0].readyState,sameVideo:originalVideo===document.querySelector('.repo-screen-viewer video')})),{muted:true,deafened:true,captures,screen:'live',sameVideo:true});
   assert(await alice.evaluate(()=>testPeers.some(p=>p.connectionState==='connected'&&p.requestedConfig.iceTransportPolicy==='relay')));
   await alice.evaluate(()=>{repoVoice.toggleDeafen();repoVoice.toggleMute();});
   for(const page of pages)await receiving(page,mode);
   console.log(JSON.stringify({mode,reconnectedMs:Date.now()-start,screenPreserved:true,capturePreserved:true}));
   const before=await Promise.all(pages.map(mediaStats));
   await delay(Number(process.env.WIBS_SOAK_MS||30000));
   const after=await Promise.all(pages.map(p=>receiving(p,mode)));
   for(let i=0;i<pages.length;i++){
    assert(after[i].reduce((n,s)=>n+s.received,0)>before[i].reduce((n,s)=>n+s.received,0),'received audio must continue increasing');
    assert(after[i].reduce((n,s)=>n+s.sent,0)>before[i].reduce((n,s)=>n+s.sent,0),'sent audio must continue increasing');
   }
   console.log(JSON.stringify({mode,selectedAudioTransports:after.flat(),continuousMedia:true}));
   await alice.evaluate(()=>repoVoice.leave());
   assert(await alice.evaluate(()=>testPeers.every(p=>p.signalingState==='closed')&&testScreen.getTracks().every(t=>t.readyState==='ended')));
   assert.deepEqual(errors,[]);
  }finally{
   for(const room of f.voiceHub.state.rooms)f.voiceHub.end(room,'Relay validation complete',Date.now());
   await f.voiceHub.alarm();await Promise.all(contexts.map(c=>c.close()));await f.close();
  }
 }}finally{await browser.close();}
 console.log('PASS: real Cloudflare TURN UDP and TURN/TLS 443, selected relay candidates, two-way RTP, automatic audio rebuild after transport failure, screen/mute/deafen/capture preservation, continuing media and hangup cleanup.');
})().catch(e=>{console.error(e);process.exitCode=1;});
