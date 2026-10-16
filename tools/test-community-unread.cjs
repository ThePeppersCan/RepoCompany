'use strict';
const assert=require('node:assert/strict');
const {createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const fetch=global.fetch,f=await createFixture();
 const request=async(who,route,body,status=200)=>{const r=await fetch(f.base+'/api/community/'+route,{method:body?'POST':'GET',headers:{...(who?{Authorization:'Bearer '+f.sessions[who].access_token}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;};
 const send=(who,text,channel='general')=>request(who,'messages',{channel,text,clientId:crypto.randomUUID()});
 try{
  await request(null,'inbox',null,401);await send('bob','Old history');
  assert.equal((await request('alice','inbox')).totalUnread,0,'initial history is a quiet baseline');
  const first=await send('bob','New message'),second=await send('mallory','Another message');await send('alice','My own message');
  let inbox=await request('alice','inbox');assert.equal(inbox.totalUnread,2);assert.equal(inbox.channels[0].lastMessage.id,second.id);
  await request('alice','read',{channel:'general',through:999999},404);
  await request('alice','read',{channel:'missing',through:first.id},404);
  await request('alice','read',{channel:'general',through:first.id,user_id:f.sessions.bob.user.id});
  assert.equal((await request('alice','inbox')).totalUnread,1);
  await request('alice','read',{channel:'general',through:0});assert.equal((await request('alice','inbox')).totalUnread,1,'read positions never move backwards');
  f.sql.prepare('INSERT INTO dashboard_blocks VALUES(?,?)').run('mallory','alice');
  inbox=await request('alice','inbox');assert.equal(inbox.totalUnread,0);assert.equal(inbox.channels[0].lastMessage,null);
  await request('alice','read',{channel:'general',through:second.id},404);
  f.sql.prepare("DELETE FROM dashboard_blocks WHERE blocker='mallory'").run();assert.equal((await request('alice','inbox')).totalUnread,1);
  await request('alice','read',{channel:'general',through:second.id});assert.equal((await request('alice','inbox')).totalUnread,0,'read state is shared by all clients for this account');
  const deleted=await send('bob','Removed before reading');assert.equal((await request('alice','inbox')).totalUnread,1);await request('bob','delete',{id:deleted.id});assert.equal((await request('alice','inbox')).totalUnread,0);
  assert.equal(f.sql.prepare('SELECT count(*) n FROM community_reads WHERE user_id=?').get(f.sessions.bob.user.id).n,0,'caller cannot write another account read state');
  console.log('PASS: group unread baseline, incoming-only counts, shared read cursors, monotonic reads, deletion/block filtering, auth and account isolation.');
 }finally{await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
