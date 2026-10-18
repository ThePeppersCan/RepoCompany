'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fixture=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture'}});
 let browser;const sessions=new Map(),closed=[];
 fixture.voiceHub.sfu=async(route,body,method)=>{
  if(route==='/sessions/new'){const sessionId=crypto.randomUUID();sessions.set(sessionId,[]);return {sessionId};}
  const id=route.split('/')[2];
  if(method==='GET')return {tracks:sessions.get(id)||[]};
  if(route.endsWith('/tracks/close')){assert.equal(body.force,true);closed.push(id);sessions.set(id,[]);return {tracks:body.tracks};}
  if(route.endsWith('/tracks/new')){const tracks=body.tracks.map(t=>({...t,status:'active'}));sessions.set(id,tracks);return {tracks,sessionDescription:{type:'answer',sdp:body.sessionDescription.sdp}};}
  return {};
 };
 try{
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
  let context=await fixture.browserContext(browser,'alice');
  const setup=async context=>context.addInitScript(()=>{
   // Model a launcher exit that cannot deliver its final HTTP request.
   const original=window.fetch;window.fetch=(url,options)=>options?.keepalive&&String(url).endsWith('/api/voice/leave')?Promise.reject(Error('Client closed')):original(url,options);
   window.RTCPeerConnection=class extends EventTarget{
    constructor(){super();this.connectionState='new';this.signalingState='stable';this.iceGatheringState='new';}
    addTransceiver(){return {mid:'0',setCodecPreferences(){},sender:{getParameters:()=>({encodings:[{}]}),setParameters:async()=>{},getStats:async()=>new Map()}};}
    async createOffer(){return {type:'offer',sdp:'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=mid:0\r\na=rtpmap:111 opus/48000/2\r\na=candidate:1 1 udp 123 192.0.2.1 1234 typ host\r\n'};}
    async setLocalDescription(d){this.localDescription=d;this.iceGatheringState='complete';}
    async setRemoteDescription(){this.connectionState='connected';this.dispatchEvent(new Event('connectionstatechange'));this.onconnectionstatechange?.();}
    close(){this.connectionState='closed';this.signalingState='closed';}
   };
  });
  await setup(context);const errors=[];
  async function open(){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(fixture.base);await page.waitForFunction(()=>repoVoice?.getState().enabled);await page.evaluate(()=>repoMessaging.open());return page;}
  const join=async page=>{await page.getByRole('button',{name:'Join RE-COMP voice',exact:true}).click();await page.waitForFunction(()=>repoVoice.getState().callStatus==='active');};
  const member=()=>fixture.voiceHub.state.rooms.find(r=>!r.ended&&r.members[fixture.sessions.alice.user.id]?.status==='active')?.members[fixture.sessions.alice.user.id];
  const bobClient=crypto.randomUUID();
  const bobJoin=await fixture.voiceHub.fetch(new Request('https://voice.internal/',{method:'POST',body:JSON.stringify({me:{id:fixture.sessions.bob.user.id,name:'bob'},op:'community',body:{client:bobClient}})}));
  assert.equal(bobJoin.status,200);const roomId=(await bobJoin.json()).room;
  const first=await open();await join(first);const oldClient=member().client,oldPub=member().pub.id;
  const second=await open();await second.getByRole('button',{name:'Join RE-COMP voice',exact:true}).click();await second.getByText('Leave your current call first.',{exact:true}).waitFor();
  assert.equal(member().client,oldClient);assert.equal(closed.length,0,'another live tab must not be disconnected');
  await second.close();
  // A process restart preserves local storage, but not session storage or locks.
  const storage=await context.storageState();await context.close();
  assert.equal(member().client,oldClient,'the dropped leave reproduces the stale server membership');
  context=await fixture.browserContext(browser,'alice');
  await context.addInitScript(({storage,origin})=>{if(location.origin===origin)for(const item of storage.origins.find(o=>o.origin===origin)?.localStorage||[])localStorage.setItem(item.name,item.value);},{storage,origin:fixture.base});
  await setup(context);
  const reopened=await open();await join(reopened);
  assert.equal(fixture.voiceHub.state.rooms.find(r=>!r.ended).id,roomId,'rejoin the ongoing channel without ending other members’ calls');
  assert.equal(fixture.voiceHub.state.rooms.find(r=>r.id===roomId).members[fixture.sessions.bob.user.id].client,bobClient);
  assert.notEqual(member().client,oldClient);assert(closed.includes(oldPub),'retire old upstream media before admitting the replacement');
  const newClient=member().client;
  const response=await fixture.voiceHub.fetch(new Request('https://voice.internal/',{method:'POST',body:JSON.stringify({me:{id:fixture.sessions.alice.user.id,name:'alice'},op:'leave',body:{room:fixture.voiceHub.state.rooms.find(r=>!r.ended).id,client:oldClient}})}));
  assert.equal(response.status,409,'a delayed leave from the closed client cannot end the replacement call');assert.equal(member().client,newClient);
  await reopened.evaluate(()=>repoVoice.leave());await reopened.waitForFunction(()=>!repoVoice.getState().callActive);await join(reopened);
  assert.equal(member().client,newClient,'normal leave and rejoin also work');
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('PASS: immediate rejoin after a lost launcher-exit leave, upstream media cleanup, active-tab protection, stale-leave isolation, normal leave/rejoin, and no runtime errors.');
 }finally{await browser?.close();await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
