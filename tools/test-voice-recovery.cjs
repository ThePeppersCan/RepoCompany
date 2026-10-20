'use strict';
const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const f=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture',SCREEN_ENABLED:'true',TURN_ENABLED:'true',TURN_KEY_ID:'fixture-key',TURN_KEY_API_TOKEN:'server-only-secret'}});
 const hub=f.voiceHub;await hub.ready;
 const fetchBefore=global.fetch,clients={alice:crypto.randomUUID(),bob:crypto.randomUUID(),mallory:crypto.randomUUID()};
 const offer={type:'offer',sdp:'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=mid:0\r\na=rtpmap:111 opus/48000/2\r\n'};
 const controlOffer={type:'offer',sdp:'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\na=sctp-port:5000\r\n'};
 let issued=0,ttl,providerFails=false,closeFails=false;
 global.fetch=async(url,options)=>{
  if(String(url).includes('/turn/keys/')){
   issued++;ttl=JSON.parse(options.body).ttl;assert.equal(options.headers.Authorization,'Bearer server-only-secret');
   if(providerFails)throw Error('provider outage: never expose details');
   return Response.json({iceServers:[{urls:['turn:turn.cloudflare.com:3478?transport=udp','turns:turn.cloudflare.com:443?transport=tcp','turn:turn.cloudflare.com:53?transport=udp','turn:attacker.invalid:3478?transport=udp'],username:'ephemeral-user',credential:'ephemeral-password'}]},{status:201});
  }return fetchBefore(url,options);
 };
 const closed=[];
 hub.sfu=async(route,body,method)=>{
  if(route==='/sessions/new')return{sessionId:crypto.randomUUID()};
  if(method==='GET'){if(closeFails)throw Error('cleanup outage');return{tracks:[{mid:'0',status:'active'}]};}
  if(route.endsWith('/tracks/close')){closed.push(route.split('/')[2]);return{tracks:[]};}
  return{tracks:body?.tracks||[],sessionDescription:{...offer,type:body?.sessionDescription?'answer':'offer'}};
 };
 async function call(who,op,body={},status=200){
  const response=await hub.fetch(new Request('https://voice.internal/',{method:'POST',body:JSON.stringify({me:{id:f.sessions[who].user.id,name:who},op,body:{client:clients[who],...body}})}));
  const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));return data;
 }
 try{
  const id=(await call('alice','create',{kind:'private',friends:['bob']})).room;
  await call('bob','ice',{room:id},403);await call('mallory','ice',{room:id},404);
  await call('alice','ice',{room:id,client:crypto.randomUUID()},403);assert.equal(issued,0);
  const ice=await call('alice','ice',{room:id});assert.equal(ice.turn,true);assert.equal(issued,1);assert(ttl>28000&&ttl<=28800);
  assert.deepEqual(ice.iceServers[1].urls,['turn:turn.cloudflare.com:3478?transport=udp','turns:turn.cloudflare.com:443?transport=tcp']);
  await call('alice','ice',{room:id});assert.equal(issued,1,'same membership reuses its credential');
  assert(!JSON.stringify(await call('alice','state')).includes('ephemeral'));
  assert(!JSON.stringify(hub.ctx.storage.saved).includes('ephemeral'));
  await call('bob','join',{room:id});providerFails=true;
  assert.equal((await call('bob','ice',{room:id})).turn,false);assert.equal(issued,2);
  await call('bob','ice',{room:id});assert.equal(issued,2,'failed issuance is backed off');
  for(const who of ['alice','bob']){
   await call(who,'publish',{room:id,mid:'0',sessionDescription:offer});await call(who,'ready',{room:id});
  }
  const room=hub.state.rooms[0],a=room.members[f.sessions.alice.user.id],b=room.members[f.sessions.bob.user.id];
  await call('alice','subscribe',{room:id});await call('alice','answer',{room:id,sessionDescription:{...offer,type:'answer'}});
  a.screenPub={id:'screen-host',trackName:'share',ready:true,expires:Date.now()+3600000};
  b.screenRecv={id:'screen-viewer',source:'share',pending:false};
  const grant=(await call('alice','control-grant',{room:id,share:'share',viewer:b.id,sessionDescription:controlOffer})).control;
  await call('bob','control-answer',{room:id,control:grant,sessionDescription:{...controlOffer,type:'answer'}});
  const screen=a.screenPub,control=room.control,oldPub=a.pub.id,oldRecv=a.recv.id,recovery=crypto.randomUUID(),expiry=room.expires;
  await call('bob','recover-audio',{room:id,recovery,client:clients.alice},403);
  closeFails=true;
  assert.equal((await call('alice','recover-audio',{room:id,recovery})).closing,true);
  await Promise.allSettled([...hub.cleanups.values()]);
  assert.equal(a.status,'active');assert.equal(a.pub.id,oldPub);assert(a.pub.revoked&&a.recv.revoked);
  assert.equal(room.control,control);assert.equal(a.screenPub,screen);assert.equal(room.expires,expiry);assert(!room.ended);
  await call('alice','publish',{room:id,mid:'0',sessionDescription:offer},409);
  closeFails=false;a.pub.retryAt=a.recv.retryAt=0;await hub.alarm();
  assert.equal(a.pub,null);assert.equal(a.recv,null);assert(closed.includes(oldPub)&&closed.includes(oldRecv));
  assert(!closed.includes('screen-host'));assert.equal(room.control,control);assert.equal(a.screenPub,screen);
  assert.equal((await call('alice','recover-audio',{room:id,recovery})).closing,false);
  await call('alice','publish',{room:id,mid:'0',sessionDescription:offer});await call('alice','ready',{room:id});
  const replacement=a.pub;
  await call('alice','recover-audio',{room:id,recovery});assert.equal(a.pub,replacement);assert(!a.pub.revoked,'replayed reset cannot revoke new audio');
  assert.equal(a.status,'active');assert.equal(room.control,control);assert.equal(room.expires,expiry);
  f.sql.prepare('INSERT INTO dashboard_blocks(blocker,blocked) VALUES(?,?)').run('bob','alice');
  await call('alice','recover-audio',{room:id,recovery:crypto.randomUUID()},403);
  assert(room.ended);await call('alice','ice',{room:id},410);
  console.log('PASS: TURN membership/device gating, expiring cached credentials, URL filtering, secret isolation, issuance failure fallback, audio-only recovery, retained failed cleanup, unchanged screen/control/expiry and block revocation.');
 }finally{global.fetch=fetchBefore;await f.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
