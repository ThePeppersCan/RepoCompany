'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const {createFixture}=require('./messaging-test-server.cjs'),{localSFU}=require('./local-sfu.cjs');
(async()=>{
 const f=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture',SCREEN_ENABLED:'true'}});
 let browser,relay;const errors=[];
 try{
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
  relay=await localSFU(browser);f.voiceHub.sfu=relay.request;
  const pages=[];
  for(const who of ['alice','bob']){
   const context=await f.browserContext(browser,who);
   await context.addInitScript(()=>{
    window.testPeers=[];window.captureCount=0;
    const Peer=RTCPeerConnection,capture=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia=(...args)=>{captureCount++;return capture(...args);};
    // Real media and SDP, with deterministic failures. No external STUN/TURN.
    window.RTCPeerConnection=class extends Peer{
     constructor(config){super({...config,iceServers:[],iceTransportPolicy:'all'});this.requestedConfig=config;testPeers.push(this);}
     get connectionState(){return this.testState||super.connectionState;}
     fail(state='failed'){this.testState=state;this.dispatchEvent(new Event('connectionstatechange'));}
     async createOffer(options){if(window.failNextOffer&&this.getSenders().some(s=>s.track?.kind==='audio')){window.failNextOffer=false;throw Error('Simulated initial negotiation failure');}return super.createOffer(options);}
    };
    navigator.mediaDevices.getDisplayMedia=async()=>{
     const canvas=document.createElement('canvas');canvas.width=640;canvas.height=360;
     const ctx=canvas.getContext('2d');setInterval(()=>{ctx.fillStyle=`hsl(${Date.now()%360} 70% 40%)`;ctx.fillRect(0,0,640,360);},60);
     window.testScreen=canvas.captureStream(15);return testScreen;
    };
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   // Check credential delivery and relay selection separately from the local
   // media path. These fake credentials never reach a real TURN endpoint.
   await page.route('**/api/voice/ice',route=>route.fulfill({json:{turn:true,iceServers:[{urls:'stun:stun.cloudflare.com:3478'},{urls:['turn:turn.cloudflare.com:3478?transport=udp','turns:turn.cloudflare.com:443?transport=tcp'],username:'fixture',credential:'fixture'}]}}));
   await page.goto(f.base);await page.waitForFunction(()=>repoVoice?.getState().enabled);
   await page.evaluate(()=>repoMessaging.open());await page.evaluate(()=>repoVoice.joinCommunity());pages.push(page);
  }
  const [alice,bob]=pages;
  async function receiving(page){
   await page.waitForFunction(async()=>{
    for(const pc of testPeers.filter(p=>p.connectionState==='connected'))for(const stat of(await pc.getStats()).values())if(stat.type==='inbound-rtp'&&stat.kind==='audio'&&stat.bytesReceived>0)return true;
    return false;
   },null,{timeout:20000});
  }
  await receiving(alice);await receiving(bob);
  const room=f.voiceHub.state.rooms.find(r=>!r.ended),member=room.members[f.sessions.alice.user.id],roomId=room.id,expiry=room.expires;
  const originalPub=member.pub.id;
  await alice.getByRole('button',{name:'Share screen',exact:true}).click();
  await bob.waitForFunction(()=>document.querySelector('.repo-screen-viewer video')?.videoWidth>0);
  const originalScreen=member.screenPub.id;
  await alice.evaluate(()=>{window.originalVideo=document.querySelector('.repo-screen-viewer video');repoVoice.toggleMute();repoVoice.toggleDeafen();});
  const captures=await alice.evaluate(()=>captureCount);
  // A brief interruption should recover on its own without rebuilding audio.
  await alice.evaluate(()=>{const pc=testPeers.find(p=>p.connectionState==='connected'&&p.getSenders().some(s=>s.track?.kind==='audio'));pc.fail('disconnected');setTimeout(()=>{pc.testState='';pc.dispatchEvent(new Event('connectionstatechange'));},500);});
  await alice.waitForTimeout(1000);assert.equal(member.pub.id,originalPub);
  await alice.evaluate(()=>testPeers.find(p=>p.connectionState==='connected'&&p.getSenders().some(s=>s.track?.kind==='audio')).fail());
  await alice.waitForFunction(()=>repoVoice.getState().busy);assert.equal(member.status,'active');
  await alice.waitForFunction(()=>!repoVoice.getState().busy&&repoVoice.getState().callStatus==='active',null,{timeout:25000});
  assert.notEqual(member.pub.id,originalPub);assert.equal(member.screenPub.id,originalScreen);assert.equal(room.id,roomId);assert.equal(room.expires,expiry);
  assert.deepEqual(await alice.evaluate(()=>({muted:repoVoice.getState().muted,deafened:repoVoice.getState().deafened,captures:captureCount,screenLive:testScreen.getTracks()[0].readyState,sameVideo:originalVideo===document.querySelector('.repo-screen-viewer video')})),{muted:true,deafened:true,captures,screenLive:'live',sameVideo:true});
  assert(await alice.evaluate(()=>testPeers.some(p=>p.connectionState==='connected'&&p.requestedConfig.iceTransportPolicy==='relay')));
  await alice.evaluate(()=>{repoVoice.toggleDeafen();repoVoice.toggleMute();});
  await receiving(alice);await receiving(bob);
  const firstReplacement=member.pub.id;
  // A second failure proves recovered peers still have live lifecycle callbacks.
  await alice.evaluate(()=>testPeers.find(p=>p.connectionState==='connected'&&p.getReceivers().some(r=>r.track?.kind==='audio')).fail());
  await alice.waitForFunction(()=>repoVoice.getState().busy);
  await alice.waitForFunction(()=>!repoVoice.getState().busy&&repoVoice.getState().callStatus==='active',null,{timeout:25000});
  assert.notEqual(member.pub.id,firstReplacement);await receiving(alice);await receiving(bob);
  assert.equal(member.screenPub.id,originalScreen);assert(!room.ended);
  const beforeOffline=member.pub.id;
  await alice.context().setOffline(true);await alice.waitForTimeout(500);await alice.context().setOffline(false);
  await alice.waitForFunction(()=>!repoVoice.getState().busy&&repoVoice.getState().callStatus==='active',null,{timeout:25000});
  assert.notEqual(member.pub.id,beforeOffline);await receiving(alice);
  // Leaving while a reset is in flight must cancel retries and all capture.
  let release,entered;const gate=new Promise(r=>{release=r}),started=new Promise(r=>{entered=r});
  await alice.route('**/api/voice/recover-audio',async route=>{entered();await gate;await route.continue();});
  await alice.evaluate(()=>testPeers.find(p=>p.connectionState==='connected'&&p.getSenders().some(s=>s.track?.kind==='audio')).fail());
  await started;await alice.evaluate(()=>repoVoice.leave());release();
  await alice.waitForTimeout(600);
  assert.equal(await alice.evaluate(()=>repoVoice.getState().callActive),false);
  assert(await alice.evaluate(()=>testPeers.every(p=>p.signalingState==='closed')));
  assert.equal(await alice.evaluate(()=>testScreen.getTracks()[0].readyState),'ended');
  assert.equal(await alice.evaluate(()=>captureCount),captures);
  await alice.unroute('**/api/voice/recover-audio');
  await alice.evaluate(()=>{window.failNextOffer=true;return repoVoice.joinCommunity();});
  await alice.waitForFunction(()=>repoVoice.getState().callStatus==='active'&&!repoVoice.getState().busy);
  await receiving(alice);assert.equal(await alice.evaluate(()=>captureCount),captures+1,'initial connection recovery reuses its microphone consent');
  // Accelerate only the recovery deadline to exercise bounded failure.
  await alice.evaluate(()=>{const timeout=setTimeout;window.setTimeout=(fn,ms,...args)=>timeout(fn,ms===45000?2500:ms,...args);});
  await alice.route('**/api/voice/recover-audio',route=>route.fulfill({json:{closing:true}}));
  await alice.evaluate(()=>testPeers.find(p=>p.connectionState==='connected'&&p.getSenders().some(s=>s.track?.kind==='audio')).fail());
  await alice.waitForFunction(()=>!repoVoice.getState().callActive,null,{timeout:7000});
  assert(await alice.evaluate(()=>testPeers.every(p=>p.signalingState==='closed')),'deadline releases all transports');
  await alice.getByText('Voice could not reconnect. Please join again.',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: real two-way WebRTC recovers after repeated sender/receiver failures, initial negotiation failure and offline/online; preserves room/mute/deafen/screen DOM and capture; selects configured relay fallback; cancels on hangup and bounded timeout. TURN forwarding itself is not exercised by this local test.');
 }finally{await browser?.close();await f.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
