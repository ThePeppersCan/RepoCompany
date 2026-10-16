'use strict';
const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fixture=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture-only'}}),hub=fixture.voiceHub;await hub.ready;
 let release,attempts=0;const pending=new Promise(resolve=>release=resolve),now=Date.now();
 const retired={id:'retired',name:'retired',status:'left',client:crypto.randomUUID(),pub:{id:'old-pub'},recv:{id:'old-recv'}};
 hub.state.rooms.push({id:'old-room',kind:'community',ended:now-1000,expires:now-1000,members:{retired}});
 hub.sfu=async()=>{attempts++;await pending;return{tracks:[]};};
 const client=crypto.randomUUID(),me={id:fixture.sessions.alice.user.id,name:'alice'};
 async function call(op,body={}){const r=await hub.fetch(new Request('https://voice.internal/',{method:'POST',body:JSON.stringify({me,op,body:{client,...body}})}));assert.equal(r.status,200);return r.json();}
 try{
  let bodyStream;const interrupted=hub.fetch(new Request('https://voice.internal/',{method:'POST',duplex:'half',body:new ReadableStream({start(c){bodyStream=c;}})}));
  const alarm=hub.alarm();
  const first=await Promise.race([call('state'),new Promise((_,reject)=>setTimeout(()=>reject(Error('State blocked by old cleanup')),1000))]);
  bodyStream.error(new Error('Caller disconnected'));assert.equal((await interrupted).status,400,'Interrupted bodies are rejected outside the state queue');
  assert.equal(first.enabled,true);assert(retired.pub&&retired.recv&&retired.client,'Unknown media stays reserved');
  const scheduled=hub.ctx.storage.alarm;
  const joined=await call('community');assert(joined.room);
  await call('heartbeat',{room:joined.room});await call('state');
  assert.equal(attempts,2,'Repeated polling does not start duplicate cleanup');
  assert.equal(hub.ctx.storage.alarm,scheduled,'Polling must not postpone the cutoff alarm');
  const retained=new (hub.constructor)(hub.ctx,hub.env);await retained.ready;assert(retained.state.rooms[0].members.retired.pub,'Unknown sessions survive a restart');
  release();await alarm;await Promise.allSettled([...hub.cleanups.values()]);
  assert.equal(retired.pub,null);assert.equal(retired.recv,null);assert.equal(retired.client,null);
  console.log('PASS: stalled cleanup does not block state/join/heartbeat, no duplicate closes, durable reservations, alarm not postponed, confirmed closure releases reservation.');
 }finally{release();await Promise.allSettled([...hub.cleanups.values()]);await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
