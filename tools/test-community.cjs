'use strict';
const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fetch=global.fetch,fixture=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture'}}),{sql,sessions,base}=fixture;
 const request=async(who,route,body,status=200)=>{const r=await fetch(base+'/api/community/'+route,{method:body===undefined?'GET':'POST',headers:{...(who?{Authorization:'Bearer '+sessions[who].access_token}:{}),'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;};
 try{
  await request(null,'state',undefined,401);
  const alien=await fetch(base+'/api/community/state',{headers:{Authorization:'Bearer '+sessions.alice.access_token,Origin:'https://attacker.test'}});assert.equal(alien.status,403);
  assert.equal((await request('mallory','state')).developer,false);
  await request('mallory','channel',{name:'forged'},403);await request('mallory','role',{username:'mallory',enabled:true},403);
  sql.prepare("INSERT INTO community_roles VALUES(?,'Developer','fixture',?)").run(sessions.alice.user.id,Date.now());
  assert.equal((await request('alice','state')).developer,true);
  await request('alice','channel',{id:'general',name:'lobby',description:'Welcome'});
  await request('alice','channel',{name:'screenshots'});
  assert.deepEqual((await request('bob','state')).channels.map(c=>c.name),['lobby','screenshots']);
  const clientId=crypto.randomUUID();const sent=await request('mallory','messages',{channel:'general',text:'Shared community hello',clientId});
  assert.equal((await request('mallory','messages',{channel:'general',text:'Shared community hello',clientId})).id,sent.id);
  await request('mallory','messages',{channel:'general',text:'Different',clientId},409);
  assert.equal((await request('bob','messages?channel=general')).messages[0].text,'Shared community hello');
  await request('bob','reaction',{id:sent.id,emoji:'❤️'});assert.equal((await request('bob','messages?channel=general')).messages[0].reactions[0].mine,1);
  await request('bob','delete',{id:sent.id},403);
  await request('alice','settings',{title:'Our community',height:240,zoom:120,x:40,y:30});assert.equal((await request('bob','state')).settings.title,'Our community');
  const gif='R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  await request('alice','banner',{data:gif});await request('bob','banner',{data:null},403);
  await request('alice','banner',{data:Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')},400);
  await request('mallory','profile-banner',{data:gif,user_id:sessions.alice.user.id});
  assert.equal(sql.prepare('SELECT user_id FROM community_profiles').get().user_id,sessions.mallory.user.id,'profile writes cannot choose another account');
  await request('mallory','profile-settings',{height:180,zoom:150,x:10,y:90});assert.equal((await request('bob','profile?username=mallory')).settings.zoom,150);
  sql.prepare('INSERT INTO dashboard_profile_privacy VALUES(?,1)').run('mallory');
  assert.equal((await request('bob','profile?username=mallory')).locked,true);
  await request('bob','profile-banner?username=mallory',undefined,403);
  assert.equal((await request('mallory','profile')).own,true);
  sql.prepare('INSERT INTO dashboard_blocks VALUES(?,?)').run('bob','mallory');
  assert.equal((await request('bob','messages?channel=general')).messages.length,0);await request('bob','profile?username=mallory',undefined,404);
  await request('alice','role',{username:'bob',enabled:true});assert.equal((await request('bob','state')).developer,true);
  await request('alice','role',{username:'alice',enabled:false},400);
  await request('bob','role',{username:'alice',enabled:false});await request('alice','channel',{name:'denied'},403);
  const hub=fixture.voiceHub;await hub.ready;const clients=Object.fromEntries(Object.keys(sessions).map(n=>[n,crypto.randomUUID()]));
  async function voice(who,op,body={},status=200){const r=await hub.fetch(new Request('https://voice.internal',{method:'POST',body:JSON.stringify({me:{id:sessions[who].user.id,name:who},op,body:{...body,client:clients[who]}})}));const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;}
  const first=await voice('alice','community');const second=await voice('mallory','community');assert.equal(first.room,second.room,'non-friends share the one permanent channel');
  await voice('bob','community',{},403);
  await voice('alice','leave',{room:first.room});assert.equal((await voice('mallory','state')).rooms[0].ended,null,'first entrant leaving does not end community voice');
  assert.equal((await voice('bob','state')).community.members.length,1);
  const {LIMIT,month}=await import('../workers/voice/budget.mjs');hub.state.usage[month(Date.now())]=LIMIT;
  await hub.alarm();assert.equal((await voice('mallory','state')).budget.available,false);await voice('alice','community',{},429);
  console.log('PASS: community auth, Developer permissions/revocation, channel editing, shared messages, idempotency, reactions, moderation, image validation, own profile isolation/privacy, single public voice channel, blocking, independent departures and shared cutoff.');
 }finally{await fixture.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
