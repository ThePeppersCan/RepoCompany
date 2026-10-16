'use strict';
const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const nativeFetch=global.fetch,f=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture'}}),{sql,sessions,base}=f;
 const req=async(who,route,body,status=200)=>{const r=await nativeFetch(base+'/api/community/'+route,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+sessions[who].access_token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;};
 try{
  sql.prepare("INSERT INTO community_roles VALUES(?,'Developer','fixture',?)").run(sessions.alice.user.id,Date.now());
  await req('bob','voice-name',{name:'Forged'},403);
  const clients={alice:crypto.randomUUID(),bob:crypto.randomUUID()};await f.voiceHub.ready;
  const voice=async(who,op,body={})=>{const r=await f.voiceHub.fetch(new Request('https://voice.internal',{method:'POST',body:JSON.stringify({me:{id:sessions[who].user.id,name:who},op,body:{...body,client:clients[who]}})}));assert.equal(r.status,200);return r.json();};
  const call=await voice('alice','community');await voice('bob','community');
  await req('alice','voice-name',{name:'The Lounge'});
  assert.equal((await req('bob','state')).voiceName,'The Lounge');
  const active=(await voice('alice','state')).rooms.find(r=>r.id===call.room);assert(active&&!active.ended);assert.equal(active.members.length,2,'a rename does not replace the voice room');
  for(const name of ['', 'a'.repeat(33),'Two\nlines'])await req('alice','voice-name',{name},400);
  const details={display:'Wibs Alice',bio:'Hello',background:'#14231b',accent:'#b5d39c',nameColor:'#ed94c6',theme:{background:'#101827',accent:'#a9c5fa'},user_id:sessions.bob.user.id};
  await req('alice','profile-details',details);
  assert.equal(sql.prepare('SELECT user_id FROM community_appearance').get().user_id,sessions.alice.user.id,'cannot change another account');
  const alice=await req('alice','state'),bob=await req('bob','state');assert.deepEqual(alice.appearance,details.theme);assert.equal(bob.appearance.background,'#0c1913');assert.equal(bob.members.find(m=>m.username==='alice').name_color,details.nameColor);
  const profile=await req('bob','profile?username=alice');assert.equal(profile.nameColor,details.nameColor);assert(!('appearance' in profile)&&!('theme' in profile),'private theme is not exposed on a public profile');
  await req('alice','messages',{channel:'general',text:'Colour test',clientId:crypto.randomUUID()});assert.equal((await req('bob','messages')).messages[0].nameColor,details.nameColor);
  for(const patch of [{nameColor:'red'},{nameColor:'url(https://bad.test)'},{theme:{background:'#123',accent:'#112233'}},{theme:null}])await req('alice','profile-details',{...details,...patch},400);
  assert.equal((await req('alice','profile')).nameColor,details.nameColor,'invalid updates are atomic');
  const legacy={...details};delete legacy.nameColor;delete legacy.theme;await req('alice','profile-details',legacy);assert.equal((await req('alice','profile')).nameColor,details.nameColor,'old clients preserve new preferences');
  await req('alice','profile-details',{...legacy,nameColor:null});assert.equal((await req('alice','profile')).nameColor,null);
  await req('mallory','state');await req('mallory','profile-details',{...details,display:'Mallory'});sql.prepare('INSERT INTO dashboard_profile_privacy VALUES(?,1)').run('mallory');
  assert.equal((await req('bob','state')).members.find(m=>m.username==='mallory').name_color,null);assert(!('nameColor' in await req('bob','profile?username=mallory')));
  console.log('PASS: Developer-only voice rename preserves the active room; own-account theme/name-colour persistence, public name colours, private themes, validation, legacy updates and profile privacy.');
 }finally{await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
