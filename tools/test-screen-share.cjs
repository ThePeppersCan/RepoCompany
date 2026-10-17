const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const f=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture',SCREEN_ENABLED:'true'}}),hub=f.voiceHub;await hub.ready;
 const {LIMIT,SCREEN_BYTES_PER_SECOND,byteRate,settle,month,hasBudget}=await import('../workers/voice/budget.mjs'),{screenDescription}=await import('../workers/voice/screens.mjs');
 const clients={alice:crypto.randomUUID(),bob:crypto.randomUUID(),mallory:crypto.randomUUID()},sessions=new Map();let failure=false;
 const video={type:'offer',sdp:'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nc=IN IP4 0.0.0.0\r\na=mid:0\r\na=sendonly\r\na=rtpmap:96 VP8/90000\r\n'},audio={type:'offer',sdp:'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=mid:0\r\na=rtpmap:111 opus/48000/2\r\n'};
 hub.sfu=async(path,body,method)=>{if(path==='/sessions/new'){const sessionId=crypto.randomUUID();sessions.set(sessionId,[]);return {sessionId};}const id=path.split('/')[2];if(method==='GET')return {tracks:sessions.get(id)};if(path.endsWith('/tracks/close')){if(failure)throw Error('Outage');sessions.set(id,[]);return {};}if(path.endsWith('/renegotiate'))return {};sessions.set(id,body.tracks.map(t=>({...t,mid:'0',status:'active'})));return {tracks:body.tracks,sessionDescription:{...video,type:body.sessionDescription?'answer':'offer'}};};
 async function call(who,op,body={},status=200){const r=await hub.fetch(new Request('https://voice.internal/',{method:'POST',body:JSON.stringify({me:{id:f.sessions[who].user.id,name:who},op,body:{client:clients[who],...body}})}));await Promise.allSettled([...hub.cleanups.values()]);const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;}
 try{
  assert.throws(()=>screenDescription(audio,'offer'));assert.throws(()=>screenDescription({...video,sdp:video.sdp+'m=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n'},'offer'));assert.throws(()=>screenDescription({...video,sdp:video.sdp+'a=rid:high send\r\n'},'offer'));assert.match(screenDescription(video,'offer').sdp,/b=TIAS:2000000/);
  const room=(await call('alice','create',{kind:'group',friends:['bob'],title:'Screens'})).room;
  for(const who of ['alice','bob']){await call(who,'join',{room});await call(who,'publish',{room,mid:'0',sessionDescription:audio});await call(who,'ready',{room});}
  await call('mallory','screen-watch',{room,share:'forged'},404);await call('alice','screen-publish',{room,client:crypto.randomUUID(),mid:'0',sessionDescription:video},403);
  await call('alice','screen-publish',{room,mid:'0',sessionDescription:video});await call('alice','screen-ready',{room});
  const active=(await call('bob','state')).rooms[0].screen.active;
  await call('bob','screen-publish',{room,mid:'0',sessionDescription:video},409);await call('alice','screen-watch',{room,share:active.id},409);await call('bob','screen-watch',{room,share:'forged'},409);
  const baseline=byteRate(hub.state.rooms);await call('bob','screen-watch',{room,share:active.id});assert.equal(byteRate(hub.state.rooms),baseline+SCREEN_BYTES_PER_SECOND);
  await call('bob','screen-answer',{room,sessionDescription:{type:'answer',sdp:video.sdp.replace('sendonly','recvonly')}});
  const members=Object.values(hub.state.rooms[0].members),alice=members.find(m=>m.name==='alice'),bob=members.find(m=>m.name==='bob');assert(alice.pub&&bob.pub,'screen sessions preserve microphones');
  const used=hub.state.usage[month(Date.now())]||0;hub.state.at=Date.now()-1000;settle(hub.state,Date.now());assert((hub.state.usage[month(Date.now())]||0)>=used+baseline+SCREEN_BYTES_PER_SECOND);
  failure=true;await call('alice','screen-stop',{room});assert(alice.screenPub.revoked&&bob.screenRecv.revoked);assert.equal(byteRate(hub.state.rooms),baseline+SCREEN_BYTES_PER_SECOND,'failed cleanup remains counted');
  await call('alice','screen-publish',{room,mid:'0',sessionDescription:video},409);failure=false;for(const m of members)for(const key of ['screenPub','screenRecv'])if(m[key])m[key].retryAt=0;await hub.alarm();assert(!alice.screenPub&&!bob.screenRecv);assert(alice.pub&&bob.pub,'stopping the screen keeps voice connected');
  await call('alice','screen-publish',{room,mid:'0',sessionDescription:video});await call('alice','screen-ready',{room});alice.screenPub.expires=Date.now()-1;await hub.alarm();assert(!alice.screenPub&&alice.pub&&bob.pub,'one-hour screen expiry preserves voice');
  await call('alice','screen-publish',{room,mid:'0',sessionDescription:video});hub.env.SCREEN_ENABLED='false';await hub.alarm();assert(!alice.screenPub&&alice.pub&&bob.pub,'screen kill switch preserves voice');await call('alice','screen-publish',{room,mid:'0',sessionDescription:video},503);hub.env.SCREEN_ENABLED='true';
  await call('alice','screen-publish',{room,mid:'0',sessionDescription:video});alice.screenPub.started=Date.now()-61000;await hub.alarm();assert(!alice.screenPub,'unfinished screen negotiation expires');
  await call('alice','screen-publish',{room,mid:'0',sessionDescription:video});await call('alice','screen-ready',{room});const next=(await call('bob','state')).rooms[0].screen.active;
  hub.state.usage[month(Date.now())]=LIMIT-(baseline+SCREEN_BYTES_PER_SECOND/2)*120;assert(hasBudget(hub.state,Date.now()));await call('bob','screen-watch',{room,share:next.id},429);assert(!bob.screenRecv);
  hub.state.usage={};hub.state.daily={};await call('bob','screen-watch',{room,share:next.id});hub.state.usage[month(Date.now())]=LIMIT-1000;await hub.alarm();assert(hub.state.rooms[0].ended);assert(members.every(m=>!m.pub&&!m.recv&&!m.screenPub&&!m.screenRecv),'cutoff force-closes both media types');assert.equal((await call('alice','state')).budget.available,false);
  const {VoiceHub}=await import('../workers/voice/worker.mjs'),restarted=new VoiceHub(hub.ctx,hub.env);await restarted.ready;assert.equal(restarted.state.stopped,month(Date.now()));
  console.log('PASS: screen SDP restrictions, identity/room/device checks, single presenter, opt-in viewers, combined conservative usage, retained failed closures, shared cutoff and restart persistence.');
 }finally{await f.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
