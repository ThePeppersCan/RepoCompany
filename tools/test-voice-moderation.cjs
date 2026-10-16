'use strict';
const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fixture=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture-only'}}),hub=fixture.voiceHub;await hub.ready;
 const id=who=>fixture.sessions[who].user.id,clients=Object.fromEntries(['alice','bob','mallory'].map(n=>[n,crypto.randomUUID()]));
 fixture.sql.prepare("INSERT INTO community_roles VALUES(?,'Developer','fixture',?)").run(id('alice'),Date.now());
 const sdp={type:'offer',sdp:'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=mid:0\r\na=rtpmap:111 opus/48000/2\r\n'},sessions=new Map();let failClose=false;
 hub.sfu=async(route,body,method)=>{
  if(route==='/sessions/new'){const sessionId=crypto.randomUUID();sessions.set(sessionId,[]);return{sessionId};}
  const key=route.split('/')[2];if(method==='GET')return{tracks:sessions.get(key)||[]};
  if(route.endsWith('/tracks/close')){assert.equal(body.force,true);if(failClose)throw Error('Upstream temporarily unavailable');sessions.set(key,[]);return{tracks:[]};}
  if(route.endsWith('/renegotiate'))return{};
  const tracks=body.tracks.map((t,i)=>({...t,mid:String(i),status:'active'}));sessions.set(key,tracks);return{tracks,sessionDescription:{...sdp,type:body.sessionDescription?'answer':'offer'}};
 };
 async function call(who,op,body={},status=200){const r=await hub.fetch(new Request('https://voice.internal/',{method:'POST',body:JSON.stringify({me:{id:id(who),name:who,developer:true},op,body:{client:clients[who],...body}})}));await Promise.allSettled([...hub.cleanups.values()]);const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;}
 const mod=(action,options={},status=200)=>call('alice','moderate',{username:'bob',action,...options},status);
 async function publish(who,room){await call(who,'publish',{room,mid:'0',sessionDescription:sdp});await call(who,'ready',{room});}
 async function receive(who,room){await call(who,'subscribe',{room});await call(who,'answer',{room,sessionDescription:{...sdp,type:'answer'}});}
 try{
  await call('bob','moderate',{username:'mallory',action:'ban',seconds:300,developer:true},403);
  await mod('ban',{seconds:1},400);await mod('mute',{enabled:'true'},400);
  await call('alice','moderate',{username:'alice',action:'ban',seconds:300},400);
  const room=(await call('alice','community')).room;await publish('alice',room);await call('bob','community');await publish('bob',room);await receive('bob',room);
  const member=hub.state.rooms.find(r=>r.id===room).members[id('bob')],pub=member.pub.id,recv=member.recv.id;
  await mod('mute',{enabled:true});assert.equal(member.pub,null);assert.equal(sessions.get(pub).length,0);assert.equal(member.recv.id,recv,'Server mute preserves hearing');assert.equal(member.status,'active');
  const heartbeat=await call('bob','heartbeat',{room,muted:false,serverMuted:false});assert.equal(heartbeat.rooms[0].mine.serverMuted,true);assert.equal(heartbeat.community.restrictions.length,0,'Ordinary members cannot read moderation records');
  assert.equal((await call('alice','state')).rooms[0].sources.length,0);await call('bob','publish',{room,mid:'0',sessionDescription:sdp},403);
  await mod('deafen',{enabled:true});assert.equal(member.recv,null);assert.equal(sessions.get(recv).length,0);await call('bob','subscribe',{room},403);await call('bob','answer',{room,sessionDescription:{...sdp,type:'answer'}},403);
  await mod('deafen',{enabled:false});assert.equal((await call('bob','state')).rooms[0].mine.serverMuted,true,'Removing deafen does not remove a separate server mute');await receive('bob',room);
  await mod('mute',{enabled:false});await publish('bob',room);assert.equal((await call('alice','state')).rooms[0].sources.length,1);
  failClose=true;await mod('mute',{enabled:true});assert(member.pub?.revoked&&member.client,'Failed upstream closure retains the session and its allowance reservation');await call('bob','publish',{room,mid:'0',sessionDescription:sdp},403);failClose=false;for(const r of hub.state.rooms)for(const m of Object.values(r.members))for(const k of ["pub","recv"])if(m[k])m[k].retryAt=0;await hub.alarm();assert.equal(member.pub,null);await mod('mute',{enabled:false});await publish('bob',room);
  await mod('disconnect');assert.equal(member.status,'left');assert.equal(member.pub,null);assert.equal(member.recv,null);await call('bob','heartbeat',{room},410);await call('bob','community');await publish('bob',room);
  await mod('ban',{seconds:300});const ban=hub.state.moderation[id('bob')].bannedUntil;assert(ban>Date.now());await call('bob','community',{client:crypto.randomUUID()},403);await call('bob','join',{room},410);
  const restarted=new (hub.constructor)(hub.ctx,hub.env);await restarted.ready;assert.equal(restarted.state.moderation[id('bob')].bannedUntil,ban,'Voice bans survive a Worker restart');
  const privateRoom=(await call('bob','create',{kind:'private',friends:['alice']})).room;await publish('bob',privateRoom);assert.equal((await call('bob','state')).rooms.find(r=>r.id===privateRoom).mine.serverMuted,false,'Community restrictions do not affect private calls');await call('bob','leave',{room:privateRoom});
  await mod('unban');await call('bob','community');await publish('bob',room);
  await mod('ban',{seconds:3600});hub.state.moderation[id('bob')].bannedUntil=Date.now()-1;await call('bob','community');await publish('bob',room);
  await mod('mute',{enabled:true});await call('bob','leave',{room});const rejoin=await call('bob','community');assert.equal(rejoin.serverMuted,true,'Rejoining cannot remove a server mute');await call('bob','ready',{room});await receive('bob',room);
  fixture.sql.prepare('DELETE FROM community_roles WHERE user_id=?').run(id('alice'));await mod('mute',{enabled:false},403);assert.equal(hub.state.moderation[id('bob')].muted,true,'Revoking the role takes effect on the next action');
  console.log('PASS: verified Developer permission, forced upstream mute/deafen/disconnect, forged-client bypass denied, mute retained on rejoin, expiring/revocable durable voice bans, private-call isolation, failed-cleanup reservation and retry, immediate role revocation.');
 }finally{await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
