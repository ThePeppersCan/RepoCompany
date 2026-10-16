const assert=require('node:assert/strict'),{createFixture}=require('./messaging-test-server.cjs');
(async()=>{
 const nativeFetch=global.fetch,f=await createFixture(),queries=[],prepare=f.env.DASHBOARD_DB.prepare;
 f.env.DASHBOARD_DB.prepare=(query,...args)=>{queries.push(query);return prepare(query,...args);};
 const req=async(who,area,path,body)=>{const r=await nativeFetch(f.base+'/api/'+area+'/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+f.sessions[who].access_token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert.equal(r.status,200,JSON.stringify(data));return data;};
 try{
  f.sql.exec('CREATE TABLE identity_updates(n INTEGER);INSERT INTO identity_updates VALUES(0);CREATE TRIGGER count_identity AFTER UPDATE OF user_id ON dashboard_players BEGIN UPDATE identity_updates SET n=n+1;END;');
  await req('alice','community','messages',{channel:'general',text:'hello',clientId:crypto.randomUUID()});
  const first=await req('bob','community','messages?channel=general');queries.length=0;
  for(let i=0;i<10;i++)assert((await req('bob','community','messages?channel=general&revision='+encodeURIComponent(first.revision))).unchanged);
  assert.equal(queries.filter(q=>q.includes('SELECT m.*')).length,0,'unchanged community polls never reread histories');
  await req('bob','community','reaction',{id:first.messages[0].id,emoji:'wibs-love'});
  assert(!(await req('bob','community','messages?channel=general&revision='+encodeURIComponent(first.revision))).unchanged,'reaction invalidates token');
  const fresh=await req('bob','community','messages?channel=general');f.sql.prepare('INSERT INTO dashboard_blocks VALUES(?,?)').run('bob','alice');
  assert.deepEqual((await req('bob','community','messages?channel=general&revision='+encodeURIComponent(fresh.revision))).messages,[],'block invalidates old visibility');f.sql.exec('DELETE FROM dashboard_blocks');
  await req('alice','social','messages',{username:'bob',text:'private',clientId:crypto.randomUUID()});
  const dm=await req('bob','social','messages?username=alice&after=0');queries.length=0;
  for(let i=0;i<10;i++)assert((await req('bob','social','messages?username=alice&after='+dm.messages.at(-1).id+'&refresh=1&revision='+dm.revision)).unchanged);
  assert.equal(queries.filter(q=>q.includes('SELECT m.*')).length,0,'unchanged DM polls never reread histories or reactions');
  assert.equal(f.sql.prepare('SELECT n FROM identity_updates').get().n,0,'unchanged profiles produce no identity writes');
  console.log('PASS: repeated community/DM polls skip histories; reactions and blocking invalidate caches; unchanged accounts cause zero identity rewrites.');
 }finally{await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
