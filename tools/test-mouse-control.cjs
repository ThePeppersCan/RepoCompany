const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const f=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture',SCREEN_ENABLED:'true'}}),h=f.voiceHub;await h.ready;
 const {LIMIT,byteRate,month,settle}=await import('../workers/voice/budget.mjs');
 const {controlDescription}=await import('../workers/voice/control.mjs');
 const clients={alice:crypto.randomUUID(),bob:crypto.randomUUID(),mallory:crypto.randomUUID()};
 const offer={type:'offer',sdp:'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\na=sctp-port:5000\r\n'};
 async function call(who,op,b={},status=200){const r=await h.fetch(new Request('https://voice.internal/',{method:'POST',body:JSON.stringify({me:{id:f.sessions[who].user.id,name:who},op,body:{client:clients[who],...b}})}));const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;}
 try{
  const room=(await call('alice','create',{kind:'group',friends:['bob']})).room;
  await call('bob','join',{room});
  const r=h.state.rooms[0],a=r.members[f.sessions.alice.user.id],b=r.members[f.sessions.bob.user.id];
  a.status=b.status='active';a.screenPub={id:'screen-host',trackName:'share',ready:true,expires:Date.now()+3600000};
  b.screenRecv={id:'screen-viewer',source:'share',pending:false};
  h.sfu=async()=>({tracks:[]});
  assert.equal(LIMIT,950000000000);
  assert.throws(()=>controlDescription({...offer,sdp:offer.sdp+'m=video 9 UDP/TLS/RTP/SAVPF 96\r\n'},'offer'));
  const payload={room,share:'share',viewer:b.id,sessionDescription:offer};
  await call('bob','control-grant',payload,409);await call('mallory','control-grant',payload,404);
  await call('alice','control-grant',{...payload,client:crypto.randomUUID()},403);
  b.screenRecv.pending=true;await call('alice','control-grant',payload,409);b.screenRecv.pending=false;
  const baseline=byteRate(h.state.rooms),id=(await call('alice','control-grant',payload)).control;
  assert.equal(byteRate(h.state.rooms),baseline+125000);
  await call('alice','control-grant',payload,409);
  assert((await call('bob','state')).rooms[0].control.offer);
  assert.equal((await call('bob','state',{client:crypto.randomUUID()})).rooms[0].control,null,'SDP restricted to the joined device');
  await call('alice','control-answer',{room,control:id,sessionDescription:{...offer,type:'answer'}},409);
  await call('bob','control-answer',{room,control:id,sessionDescription:{...offer,type:'answer'}});
  assert((await call('alice','state')).rooms[0].control.answer);
  await call('bob','control-stop',{room,control:'old-grant'});assert(r.control);
  h.state.at=Date.now()-1000;const prior=h.state.usage[month(Date.now())]||0;settle(h.state,Date.now());assert(h.state.usage[month(Date.now())]>=prior+baseline+125000);
  await call('bob','control-stop',{room,control:id});assert.equal(r.control,null);assert.equal(byteRate(h.state.rooms),baseline);assert(a.screenPub&&b.screenRecv);
  await call('alice','control-grant',payload);r.control.started=Date.now()-31000;await call('alice','state');assert.equal(r.control,null,'unanswered invitation expires');
  await call('alice','control-grant',payload);b.screenRecv.revoked=true;await call('alice','state');assert.equal(r.control,null,'stop watching revokes control');
  await Promise.allSettled([...h.cleanups.values()]);b.screenRecv={id:'viewer-2',source:'share'};
  await call('alice','control-grant',payload);b.client=crypto.randomUUID();await call('alice','state');assert.equal(r.control,null,'device changes revoke');b.client=clients.bob;
  await call('alice','control-grant',payload);h.state.usage[month(Date.now())]=LIMIT-1;await h.alarm();assert(r.ended&&!r.control,'shared cap stops control and media');
  console.log('PASS: 950 GB cap, authenticated owner/viewer/device grants, data-only SDP, one controller, stale revocation, expiry, viewing/device changes, accounting and cutoff.');
 }finally{await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
