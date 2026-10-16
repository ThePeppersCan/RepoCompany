'use strict';
const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fetch=global.fetch,f=await createFixture(),{sql,sessions,base}=f;
 const request=async(who,route,body,status=200)=>{const r=await fetch(base+'/api/community/'+route,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+sessions[who].access_token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});const d=await r.json();assert.equal(r.status,status,JSON.stringify(d));return d;};
 try{
  for(const who of ['alice','bob','mallory'])await request(who,'state');
  const start=Date.now()-600000,now=Date.now();
  sql.prepare('INSERT INTO dashboard_game_presence VALUES(?,?,?,?,?,1)').run('bob','fixture-session','morogue',start,now);
  let activity=(await request('alice','state')).members.find(m=>m.username==='bob').activity;assert.equal(activity.game,'morogue');assert.equal(activity.startedAt,start);
  assert.equal((await request('alice','profile?username=bob')).activity.game,'morogue');
  sql.prepare('UPDATE dashboard_players SET invisible=1 WHERE username=?').run('bob');
  assert.equal((await request('alice','state')).members.find(m=>m.username==='bob').activity,null);assert.equal((await request('alice','profile?username=bob')).activity,null);
  sql.prepare('UPDATE dashboard_players SET invisible=0 WHERE username=?').run('bob');
  sql.prepare('INSERT INTO dashboard_profile_privacy VALUES(?,1)').run('bob');
  assert.equal((await request('mallory','state')).members.find(m=>m.username==='bob').activity,null);assert.equal((await request('mallory','profile?username=bob')).activity,undefined);assert.equal((await request('alice','profile?username=bob')).activity.game,'morogue');
  sql.prepare('UPDATE dashboard_game_presence SET last_seen=? WHERE username=?').run(now-91000,'bob');assert.equal((await request('alice','profile?username=bob')).activity,null);
  sql.prepare('UPDATE dashboard_game_presence SET last_seen=?,running=0 WHERE username=?').run(Date.now(),'bob');assert.equal((await request('alice','profile?username=bob')).activity,null);
  sql.prepare('UPDATE dashboard_game_presence SET running=1 WHERE username=?').run('bob');sql.prepare('INSERT INTO dashboard_blocks VALUES(?,?)').run('alice','bob');assert.equal((await request('alice','state')).members.some(m=>m.username==='bob'),false);await request('alice','profile?username=bob',undefined,404);
  sql.prepare('UPDATE dashboard_players SET repo_score=1210,bio=? WHERE username=?').run('Account bio','alice');
  const details={display:'Wibs Alice',bio:'My Wibs bio',background:'#f0e5d5',accent:'#512d88',user_id:sessions.bob.user.id,repoScore:999999};
  await request('alice','profile-details',details);
  const profile=await request('alice','profile');assert.equal(profile.display,'Wibs Alice');assert.equal(profile.bio,'My Wibs bio');assert.equal(profile.repoScore,1210);assert.equal(profile.colors.background,'#f0e5d5');assert.equal(profile.colors.accent,'#512d88');
  assert.equal(sql.prepare('SELECT display_name,bio FROM dashboard_players WHERE username=?').get('alice').bio,'Account bio');assert.equal(sql.prepare('SELECT COUNT(*) n FROM community_profile_details WHERE user_id=?').get(sessions.bob.user.id).n,0);
  await request('alice','profile-details',{...details,background:'url(https://bad.test)'},400);await request('alice','profile-details',{...details,display:'x'.repeat(33)},400);await request('alice','profile-details',{...details,bio:'x'.repeat(301)},400);
  const id=crypto.randomUUID();await request('alice','messages',{channel:'general',text:'Nickname check',clientId:id});assert.equal((await request('mallory','messages')).messages[0].display,'Wibs Alice');assert.equal((await request('mallory','state')).members.find(m=>m.username==='alice').display_name,'Wibs Alice');
  console.log('PASS: live, stopped and expired game presence; invisible/private/blocked protection; Wibs-only name, bio and colours; earned RepoScore read-only; own-profile writes and validation.');
 }finally{await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
