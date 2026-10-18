const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const f=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture',SCREEN_ENABLED:'true',CAMERA_ENABLED:'true'}}),hub=f.voiceHub;await hub.ready;
 const {LIMIT,CAMERA_BYTES_PER_SECOND,SCREEN_BYTES_PER_SECOND,byteRate,settle,month,hasBudget}=await import('../workers/voice/budget.mjs'),{cameraDescription}=await import('../workers/voice/cameras.mjs');
 const clients=Object.fromEntries(['alice','bob','mallory'].map(n=>[n,crypto.randomUUID()])),sessions=new Map();let failure=false;
 const video={type:'offer',sdp:'v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nc=IN IP4 0.0.0.0\r\na=mid:0\r\na=sendonly\r\na=rtpmap:96 VP8/90000\r\n'},audio={type:'offer',sdp:'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=mid:0\r\na=rtpmap:111 opus/48000/2\r\n'};
 hub.sfu=async(path,body,method)=>{if(path==='/sessions/new'){const sessionId=crypto.randomUUID();sessions.set(sessionId,[]);return {sessionId};}const id=path.split('/')[2];if(method==='GET')return {tracks:sessions.get(id)};if(path.endsWith('/tracks/close')){if(failure)throw Error('Outage');sessions.set(id,[]);return {};}if(path.endsWith('/renegotiate'))return {};const tracks=body.tracks.map((t,i)=>({...t,mid:String(i),status:'active'}));sessions.set(id,tracks);return {tracks,sessionDescription:{...video,type:body.sessionDescription?'answer':'offer'}};};
 async function call(who,op,body={},status=200){const r=await hub.fetch(new Request('https://voice.internal/',{method:'POST',body:JSON.stringify({me:{id:f.sessions[who].user.id,name:who},op,body:{client:clients[who],...body}})}));await Promise.allSettled([...hub.cleanups.values()]);const data=await r.json();assert.equal(r.status,status,op+': '+JSON.stringify(data));return data;}
 const person=n=>Object.values(hub.state.rooms[0].members).find(m=>m.name===n);
 async function cleanup(){failure=false;for(const room of hub.state.rooms)for(const m of Object.values(room.members))for(const k of ['pub','recv','cameraPub','cameraRecv','screenPub','screenRecv'])if(m[k]){m[k].retryAt=0;m[k].pendingUntil=0;}await hub.alarm();}
 try{
  assert.equal(LIMIT,950e9);assert.throws(()=>cameraDescription(audio,'offer'));assert.throws(()=>cameraDescription({...video,sdp:video.sdp+'a=simulcast:send 1;2\r\n'},'offer'));assert.throws(()=>cameraDescription({...video,sdp:video.sdp+'m=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\n'},'offer'));assert.match(cameraDescription(video,'offer').sdp,/b=TIAS:1000000/);
  const room=(await call('alice','community')).room;
  for(const who of ['alice','bob','mallory']){if(who!=='alice')await call(who,'community');await call(who,'publish',{room,mid:'0',sessionDescription:audio});await call(who,'ready',{room});}
  const baseline=byteRate(hub.state.rooms);
  await call('alice','camera-publish',{room,client:crypto.randomUUID(),mid:'0',sessionDescription:video},403);
  for(const who of ['alice','bob']){await call(who,'camera-publish',{room,mid:'0',sessionDescription:video});await call(who,'camera-ready',{room});}
  assert.equal((await call('mallory','state')).rooms[0].cameras.active.length,2);
  for(const who of ['dave','eve']){const id=crypto.randomUUID();f.sessions[who]={user:{id}};clients[who]=crypto.randomUUID();f.sql.prepare('INSERT INTO dashboard_players(username,user_id,display_name) VALUES(?,?,?)').run(who,id,who);await call(who,'community');await call(who,'publish',{room,mid:'0',sessionDescription:audio});await call(who,'ready',{room});}
  for(const who of ['mallory','dave']){await call(who,'camera-publish',{room,mid:'0',sessionDescription:video});await call(who,'camera-ready',{room});}
  await call('eve','camera-publish',{room,mid:'0',sessionDescription:video},429);
  for(const who of ['mallory','dave'])await call(who,'camera-stop',{room});for(const who of ['dave','eve'])await call(who,'leave',{room});
  f.sql.prepare("INSERT INTO community_roles VALUES(?,'Developer','fixture',?)").run(f.sessions.alice.user.id,Date.now());
  await call('alice','moderate',{username:'bob',action:'deafen',enabled:true});assert(!person('bob').cameraPub);await call('bob','camera-publish',{room,mid:'0',sessionDescription:video},403);
  await call('alice','moderate',{username:'bob',action:'deafen',enabled:false});await call('bob','publish',{room,mid:'0',sessionDescription:audio});await call('bob','ready',{room});await call('bob','camera-publish',{room,mid:'0',sessionDescription:video});await call('bob','camera-ready',{room});
  const watched=await call('mallory','camera-watch',{room,tracks:[{sessionId:'forged',trackName:'forged'}]});assert.equal(watched.tracks.length,2);assert(watched.tracks.every(t=>!t.id.includes('forged')));assert.equal(byteRate(hub.state.rooms),baseline+2*CAMERA_BYTES_PER_SECOND);
  await call('mallory','camera-answer',{room,sessionDescription:{type:'answer',sdp:video.sdp.replace('sendonly','recvonly')}});
  await call('mallory','camera-watch',{room},409);
  await call('alice','screen-publish',{room,mid:'0',sessionDescription:video});await call('alice','screen-ready',{room});await call('bob','screen-watch',{room,share:person('alice').screenPub.trackName});
  assert.equal(byteRate(hub.state.rooms),baseline+2*CAMERA_BYTES_PER_SECOND+SCREEN_BYTES_PER_SECOND);
  const previous=hub.state.usage[month(Date.now())]||0;hub.state.at=Date.now()-1000;settle(hub.state,Date.now());assert(hub.state.usage[month(Date.now())]>=previous+byteRate(hub.state.rooms));
  failure=true;await call('alice','camera-stop',{room});assert(person('alice').cameraPub.revoked&&person('mallory').cameraRecv.revoked);assert.equal(byteRate(hub.state.rooms),baseline+2*CAMERA_BYTES_PER_SECOND+SCREEN_BYTES_PER_SECOND,'uncertain media remains charged');await call('mallory','camera-watch',{room},409);
  await cleanup();assert(!person('alice').cameraPub&&!person('mallory').cameraRecv);assert(person('alice').pub&&person('alice').screenPub&&person('bob').cameraPub,'camera stop preserves other media');
  await call('mallory','camera-watch',{room});await call('mallory','camera-unwatch',{room});assert(!person('mallory').cameraRecv);
  person('bob').cameraPub.expires=Date.now()-1;await cleanup();assert(!person('bob').cameraPub&&person('bob').pub,'one hour expiry only stops the camera');
  await call('alice','camera-publish',{room,mid:'0',sessionDescription:video});person('alice').cameraPub.started=Date.now()-61000;await cleanup();assert(!person('alice').cameraPub,'unfinished negotiation expires');
  await call('alice','camera-publish',{room,mid:'0',sessionDescription:video});await call('alice','camera-ready',{room});
  hub.env.CAMERA_ENABLED='false';await cleanup();assert(!person('alice').cameraPub&&person('alice').screenPub);await call('alice','camera-publish',{room,mid:'0',sessionDescription:video},503);hub.env.CAMERA_ENABLED='true';
  await call('alice','camera-publish',{room,mid:'0',sessionDescription:video});await call('alice','camera-ready',{room});
  const rate=byteRate(hub.state.rooms);hub.state.usage[month(Date.now())]=LIMIT-(rate+CAMERA_BYTES_PER_SECOND/2)*120;assert(hasBudget(hub.state,Date.now()));await call('bob','camera-watch',{room},429);assert(!person('bob').cameraRecv);
  hub.state.usage={};hub.state.daily={};await call('bob','camera-watch',{room});hub.state.usage[month(Date.now())]=LIMIT-1000;await cleanup();assert(hub.state.rooms[0].ended);assert(Object.values(hub.state.rooms[0].members).every(m=>!m.pub&&!m.recv&&!m.screenPub&&!m.screenRecv&&!m.cameraPub&&!m.cameraRecv));assert.equal((await call('alice','state')).budget.available,false);
  const {VoiceHub}=await import('../workers/voice/worker.mjs'),restarted=new VoiceHub(hub.ctx,hub.env);await restarted.ready;assert.equal(restarted.state.stopped,month(Date.now()));
  console.log('PASS: multiple cameras, validated media, server-selected sources, one shared 950 GB counter, screens plus cameras, retained failed closures, expiry, kill switch, admission reserve, forced cutoff and persistence.');
 }finally{await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
