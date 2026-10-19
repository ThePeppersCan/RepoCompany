'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../functions/api/voice/[[path]].js'),'utf8').replace("import config from '../../../dashboard-config.json';",'const config={url:"https://identity.invalid",key:"fixture"};');
 const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const native=global.fetch;
 try{
  for(const [upstream,expected]of [[500,503],[503,503],[429,503],[401,401],[403,401]]){
   global.fetch=async url=>String(url).endsWith('/auth/v1/user')?Response.json({error:'fixture'},{status:upstream}):Response.json([{username:'alice'}]);
   const response=await onRequest({request:new Request('https://repo.test/api/voice/heartbeat',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json'},body:'{}'}),env:{},params:{path:['heartbeat']}});
   assert.equal(response.status,expected,'upstream '+upstream);
  }
 }finally{global.fetch=native;}
 const fixture=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture'}}),hub=fixture.voiceHub;
 try{
  await hub.ready;const client=crypto.randomUUID(),me={id:fixture.sessions.alice.user.id,name:'alice'};
  async function call(op,body={}){return hub.fetch(new Request('https://voice.internal/',{method:'POST',body:JSON.stringify({me,op,body:{client,...body}})}));}
  const joined=await (await call('community')).json(),room=hub.state.rooms.find(r=>r.id===joined.room),permitted=hub.permitted.bind(hub);
  hub.permitted=async()=>{throw Error('Temporary database failure');};
  await hub.alarm();assert(!room.ended,'temporary alarm verification failure preserves the call');
  assert.equal((await call('heartbeat',{room:room.id})).status,503);assert(!room.ended,'temporary action verification failure preserves the call');
  hub.permitted=permitted;assert.equal((await call('heartbeat',{room:room.id})).status,200);
  hub.permitted=async()=>{throw Object.assign(Error('Blocked'),{status:403});};
  await hub.alarm();assert(room.ended,'explicit access revocation still ends the call');
  console.log('PASS: identity outages remain retryable, invalid identities remain denied, transient database verification preserves calls, and explicit revocation still closes calls.');
 }finally{await fixture.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
