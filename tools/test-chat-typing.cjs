const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const nativeFetch=global.fetch,f=await createFixture();
 const req=async(who,area,route,body,status=200)=>{const r=await nativeFetch(f.base+'/api/'+area+'/'+route,{method:body?'POST':'GET',headers:{...(who?{Authorization:'Bearer '+f.sessions[who].access_token}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;};
 const ready=()=>f.sql.exec('UPDATE wibs_typing SET updated_at=0');
 try{
  await req(null,'community','typing',{channel:'general',active:true},401);
  await req('alice','community','typing',{channel:'missing',active:true},404);
  await req('alice','community','typing',{channel:'general',active:'true'},400);
  const before=await req('bob','community','messages?channel=general');
  await req('alice','community','typing',{channel:'general',active:true,user_id:f.sessions.bob.user.id});
  let result=await req('bob','community','messages?channel=general&revision='+encodeURIComponent(before.revision));
  assert(result.unchanged);assert.equal(result.typing[0].username,'alice');assert(result.typing[0].remainingMs<=10000);
  assert.deepEqual((await req('alice','community','messages?channel=general')).typing,[],'no self indicator');
  assert.deepEqual((await req('bob','community','messages?channel=elsewhere')).typing,[],'no cross-channel activity');
  f.sql.exec('CREATE TABLE typing_updates(n INTEGER);INSERT INTO typing_updates VALUES(0);CREATE TRIGGER count_typing AFTER UPDATE ON wibs_typing BEGIN UPDATE typing_updates SET n=n+1;END;');
  await Promise.all(Array.from({length:15},()=>req('alice','community','typing',{channel:'general',active:true})));
  assert.equal(f.sql.prepare('SELECT n FROM typing_updates').get().n,0,'burst cannot rewrite activity');
  f.sql.prepare('INSERT INTO dashboard_blocks VALUES(?,?)').run('bob','alice');
  assert.deepEqual((await req('bob','community','messages?channel=general')).typing,[]);f.sql.exec('DELETE FROM dashboard_blocks');
  f.sql.exec("UPDATE dashboard_players SET invisible=1 WHERE username='alice'");assert.deepEqual((await req('bob','community','messages?channel=general')).typing,[]);f.sql.exec("UPDATE dashboard_players SET invisible=0 WHERE username='alice'");
  await req('alice','community','typing',{channel:'general',active:false});assert.deepEqual((await req('bob','community','messages?channel=general')).typing,[]);
  ready();await req('alice','social','typing',{username:'bob',active:true});
  result=await req('bob','social','messages?username=alice');assert.equal(result.conversationId,null);assert.equal(result.typing[0].username,'alice','typing works before first DM');
  await req('mallory','social','messages?username=alice',undefined,403);await req('alice','social','typing',{username:'mallory',active:true},403);
  await req('alice','social','messages',{username:'bob',text:'sent',clientId:crypto.randomUUID()});assert.deepEqual((await req('bob','social','messages?username=alice')).typing,[],'sending clears activity');
  ready();await req('alice','social','typing',{username:'bob',active:true});const dm=await req('bob','social','messages?username=alice&after=0');
  result=await req('bob','social','messages?username=alice&after='+dm.messages[0].id+'&revision='+dm.revision);assert(result.unchanged);assert.equal(result.typing.length,1,'unchanged DM still returns current typing');
  f.sql.exec("UPDATE dashboard_friendships SET status='pending'");await req('bob','social','messages?username=alice',undefined,403);f.sql.exec("UPDATE dashboard_friendships SET status='accepted'");
  f.sql.exec('UPDATE wibs_typing SET expires_at=0');assert.deepEqual((await req('bob','social','messages?username=alice')).typing,[],'expired activity cannot remain visible');
  assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM wibs_typing').get().n,1,'one bounded row per account');
  console.log('PASS: typing auth, channel/DM isolation, accepted friends, blocks, invisible users, expiry, send clearing, cached polls and bounded writes.');
 }finally{await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
