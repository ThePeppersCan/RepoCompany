const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{const f=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture'}});let browser,sessions=0,publishes=0;
 f.voiceHub.sfu=async(route,body)=>{if(route==='/sessions/new'){sessions++;return {sessionId:crypto.randomUUID()};}if(route.endsWith('/tracks/new')){publishes++;return {tracks:body.tracks,sessionDescription:{type:'answer',sdp:body.sessionDescription.sdp}};}return {tracks:[]};};
 try{browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});const context=await f.browserContext(browser,'alice');
  await context.addInitScript(()=>{
   window.testPeers=[];window.RTCPeerConnection=class extends EventTarget{
    constructor(config){super();this.config=config;this.connectionState='new';this.signalingState='stable';this.iceGatheringState='new';testPeers.push(this);}
    addTransceiver(){return {mid:'0',setCodecPreferences(){},sender:{getParameters:()=>({encodings:[{}]}),setParameters:async()=>{},getStats:async()=>new Map()}};}
    async createOffer(){return {type:'offer',sdp:'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=mid:0\r\na=rtpmap:111 opus/48000/2\r\n'+(this.config.iceServers.length?'':'a=candidate:1 1 udp 123 192.0.2.1 1234 typ host\r\n')};}
    async setLocalDescription(d){this.localDescription=d;this.iceGatheringState='complete';}
    async setRemoteDescription(){this.connectionState='connected';this.dispatchEvent(new Event('connectionstatechange'));this.onconnectionstatechange?.();}
    close(){this.connectionState='closed';this.signalingState='closed';}
   };
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(f.base);await page.waitForFunction(()=>repoVoice?.getState().enabled);await page.evaluate(()=>repoMessaging.open());await page.getByRole('button',{name:'Join RE-COMP voice',exact:true}).click();await page.waitForFunction(()=>repoVoice.getState().callStatus==='active');
  assert.deepEqual(await page.evaluate(()=>testPeers.map(p=>({servers:p.config.iceServers.length,state:p.connectionState}))),[{servers:1,state:'closed'},{servers:0,state:'connected'}]);assert.equal(sessions,1);assert.equal(publishes,1,'fresh local retry must not reserve a second SFU session');
  await page.evaluate(()=>{repoAccount.state.user=null;dispatchEvent(new Event('repo-account-state'));});assert(await page.evaluate(()=>testPeers.every(p=>p.connectionState==='closed')));assert.deepEqual(errors,[]);
  console.log('PASS: empty candidate gathering retries on a fresh peer, closes the old one, publishes once, connects and cleans up on sign-out.');
 }finally{await browser?.close();await f.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
