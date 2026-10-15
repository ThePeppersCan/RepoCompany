'use strict';
const assert=require('node:assert/strict');
const {createFixture}=require('./messaging-test-server.cjs');
const path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const {LIMIT,month,nextMonth,settle,hasBudget,audioDescription}=await import(pathToFileURL(path.resolve(__dirname,'../workers/voice/budget.mjs')));
 const nativeFetch=global.fetch;
 const fixture=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture-only'}});
 const hub=fixture.voiceHub;await hub.ready;
 const clients={alice:crypto.randomUUID(),bob:crypto.randomUUID(),mallory:crypto.randomUUID()};
 const me=who=>({id:fixture.sessions[who].user.id,name:who});
 const sdp={type:'offer',sdp:'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=mid:0\r\na=rtpmap:111 opus/48000/2\r\n'};
 const sessions=new Map();let closeFailure=false,closed=0;
 hub.sfu=async(route,body,method)=>{
  if(route==='/sessions/new'){const sessionId=crypto.randomUUID();sessions.set(sessionId,[]);return{sessionId};}
  const id=route.split('/')[2];
  if(method==='GET')return{tracks:sessions.get(id)||[]};
  if(route.endsWith('/tracks/close')){assert.equal(body.force,true);if(closeFailure)throw Error('Simulated outage');sessions.set(id,(sessions.get(id)||[]).map(t=>({...t,status:'inactive'})));for(const [key,tracks]of sessions)sessions.set(key,tracks.map(t=>t.sessionId===id?{...t,status:'inactive'}:t));closed++;return{tracks:body.tracks};}
  if(route.endsWith('/renegotiate'))return{};
  const tracks=body.tracks.map((t,i)=>({...t,mid:String(i),status:'active'}));sessions.set(id,tracks);
  return{tracks,sessionDescription:{...sdp,type:body.sessionDescription?'answer':'offer'}};
 };
 async function call(who,op,body={},status=200){const r=await hub.fetch(new Request('https://voice.internal/',{method:'POST',body:JSON.stringify({me:me(who),op,body:{client:clients[who],...body}})}));const result=await r.json();assert.equal(r.status,status,JSON.stringify(result));return result;}
 async function room(kind='private',friends=['bob']){return(await call('alice','create',{kind,friends,title:'Test room'})).room;}
 async function connect(who,id){await call(who,'join',{room:id});await call(who,'publish',{room:id,mid:'0',sessionDescription:sdp});await call(who,'ready',{room:id});}
 try{
  for(const [headers,status]of [[{},401],[{Origin:'https://attacker.example',Authorization:'Bearer '+fixture.sessions.alice.access_token},403]]){
   const r=await nativeFetch(fixture.base+'/api/voice/state',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({client:clients.alice})});assert.equal(r.status,status);
  }
  await call('mallory','create',{kind:'private',friends:['bob']},403);
  const id=await room();await call('alice','create',{kind:'private',friends:['bob']},409);
  await call('mallory','join',{room:id},404);
  await call('alice','heartbeat',{room:id,client:crypto.randomUUID()},403);
  await connect('alice',id);await connect('bob',id);
  await call('alice','publish',{room:id,mid:'0',sessionDescription:sdp},409);
  const sub=await call('bob','subscribe',{room:id,tracks:[{sessionId:'attacker-controlled',trackName:'forged'}]});
  assert.equal(sub.tracks.length,1);assert.equal(sub.tracks[0].sessionId,hub.state.rooms[0].members[me('alice').id].pub.id);
  await call('bob','subscribe',{room:id},409);
  await call('bob','answer',{room:id,sessionDescription:{...sdp,type:'answer'}});
  await call('alice','subscribe',{room:id});await call('alice','answer',{room:id,sessionDescription:{...sdp,type:'answer'}});
  const oldReceiver=hub.state.rooms[0].members[me('bob').id].recv.id;
  await call('bob','reset-receiver',{room:id});
  assert.equal(hub.state.rooms[0].members[me('bob').id].recv,null);
  assert(sessions.get(oldReceiver).every(t=>t.status==='inactive'),'retired receiver tracks are forcibly closed before reconnecting');
  assert(hub.state.rooms[0].members[me('bob').id].pub.ready,'receiver renewal preserves the microphone');
  await call('bob','subscribe',{room:id});await call('bob','answer',{room:id,sessionDescription:{...sdp,type:'answer'}});
  hub.state.usage[month(Date.now())]=LIMIT-1000;await hub.alarm();
  assert(hub.state.rooms[0].ended);assert.equal((await call('alice','state')).budget.available,false);assert(closed>=2);
  assert([...sessions.values()].every(tracks=>tracks.every(t=>t.status==='inactive')),'cutoff forcibly closes upstream tracks without a client request');
  const {VoiceHub}=await import(pathToFileURL(path.resolve(__dirname,'../workers/voice/worker.mjs')));
  const restarted=new VoiceHub(hub.ctx,hub.env);await restarted.ready;assert.equal(restarted.state.stopped,month(Date.now()));assert.equal(restarted.state.usage[month(Date.now())],hub.state.usage[month(Date.now())]);
  hub.state.rooms=[];hub.state.usage={};hub.state.stopped=null;
  const second=await room('group');await connect('alice',second);await connect('bob',second);
  closeFailure=true;await call('bob','leave',{room:second});
  const retired=hub.state.rooms[0].members[me('bob').id];assert(retired.pub&&retired.client,'failed cleanup retains reservation');
  const before=hub.state.usage[month(Date.now())]||0;settle(hub.state,Date.now()+1000);assert(hub.state.usage[month(Date.now())]>before);
  closeFailure=false;await hub.alarm();assert.equal(retired.pub,null);
  await call('alice','leave',{room:second});
  const third=await room();
  fixture.sql.prepare('INSERT INTO dashboard_blocks(blocker,blocked) VALUES(?,?)').run('bob','alice');
  await hub.alarm();assert(hub.state.rooms.find(r=>r.id===third).ended,'block closes the entire room');
  const monthEnd=Date.UTC(2026,9,31,23,59,59),state={at:monthEnd,usage:{},rooms:[{members:{a:{client:'a'},b:{client:'b'}}}]};
  settle(state,monthEnd+2000);assert.equal(state.usage['2026-10'],250000);assert.equal(state.usage['2026-11'],250000);
  state.usage['2026-10']=LIMIT;assert.equal(hasBudget(state,monthEnd),false);assert.equal(hasBudget(state,monthEnd+2000),true);
  const billingBoundary=Date.UTC(2026,10,15),billing={at:billingBoundary-1000,billingDay:15,usage:{},daily:{},rooms:[{members:{a:{client:'a'},b:{client:'b'}}}]};
  settle(billing,billingBoundary+1000);assert.equal(billing.usage['2026-10'],250000);assert.equal(billing.usage['2026-11'],250000);assert.equal(nextMonth(Date.UTC(2026,10,1),15),billingBoundary);
  billing.daily[Math.floor((billingBoundary-86400000)/86400000)]=LIMIT;assert.equal(hasBudget(billing,billingBoundary+1000),false,'rolling guard survives a monthly reset');
  assert.equal(hasBudget(billing,billingBoundary+34*86400000),true,'rolling guard releases expired usage');
  assert.throws(()=>audioDescription({type:'offer',sdp:sdp.sdp+'m=video 9 UDP/TLS/RTP/SAVPF 96\r\n'},'offer'));
  assert.throws(()=>audioDescription({...sdp,sdp:sdp.sdp+'a=simulcast:send 1;2\r\n'},'offer'));
  console.log('PASS: voice auth/origin boundaries, friend-only invitations, account/device ownership, server-chosen tracks, negotiation serialization, cutoff without clients, retained failed shutdowns, block revocation, calendar rollover, audio-only validation.');
 }finally{await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
