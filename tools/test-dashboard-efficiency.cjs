const fs=require('node:fs'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite');
(async()=>{
 let source=fs.readFileSync('functions/api/dashboard/[[path]].js','utf8');
 for(const [name,file] of [['config','dashboard-config.json'],['frameCatalog','avatar-frame-catalog.json'],['avatarCatalog','account-assets/avatar-v2/catalog.json']]){
  const value=name==='config'?{url:'https://auth.test',key:'test-public-key'}:JSON.parse(fs.readFileSync(file,'utf8'));
  source=source.replace(new RegExp('import '+name+' from [^;]+;'),'const '+name+'='+JSON.stringify(value)+';');
 }
 const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const sql=new DatabaseSync(':memory:');
 for(const file of ['dashboard-social-schema.sql','dashboard-playtime-schema.sql','dashboard-avatar-schema.sql','dashboard-frames-schema.sql','dashboard-privacy-schema.sql'])sql.exec(fs.readFileSync(file,'utf8'));
 const prepare=(query,values=[])=>({bind(...args){return prepare(query,args);},async first(){return sql.prepare(query).get(...values)||null;},async all(){return {results:sql.prepare(query).all(...values)};},async run(){return sql.prepare(query).run(...values);}});
 const env={DASHBOARD_DB:{prepare}};
 const nativeFetch=global.fetch;
 global.fetch=async(url,options)=>{
  const name=options.headers.Authorization.slice(7);
  if(url.endsWith('/auth/v1/user'))return Response.json({id:'uuid-'+name});
  if(url.endsWith('/get_my_character'))return Response.json([{username:name}]);
  if(url.endsWith('/get_public_character'))return Response.json([{username:JSON.parse(options.body).p_username}]);
  throw Error('Unexpected upstream route');
 };
 const call=async(name,route,body)=>{
  const response=await onRequest({env,params:{path:route.split('?')[0]},request:new Request('https://repo.test/api/dashboard/'+route,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+name},...(body===undefined?{}:{body:JSON.stringify(body)})})});
  return {status:response.status,body:await response.json()};
 };
 try{
  assert.equal((await call('alice','state')).status,200,'New players are registered');
  sql.exec('CREATE TABLE identity_updates(n INTEGER);INSERT INTO identity_updates VALUES(0);CREATE TRIGGER count_identity AFTER UPDATE OF user_id ON dashboard_players BEGIN UPDATE identity_updates SET n=n+1;END;');
  const before=sql.prepare('SELECT total_changes() n').get().n;
  for(let i=0;i<100;i++)assert.equal((await call('alice','state')).status,200);
  for(let i=0;i<100;i++)assert.equal((await call('alice','search?username=bob')).status,200);
  assert.equal(sql.prepare('SELECT total_changes() n').get().n,before,'Repeated read requests cause zero database writes');
  for(let i=0;i<20;i++)assert.equal((await call('alice','presence',{online:true})).status,200);
  assert.equal(sql.prepare('SELECT n FROM identity_updates').get().n,0,'Presence does not rewrite account identity');
  sql.prepare('INSERT INTO dashboard_players(username,display_name) VALUES(?,?)').run('legacy','Legacy');
  assert.equal((await call('legacy','state')).status,200,'Unclaimed friend profiles can be linked');
  assert.equal(sql.prepare('SELECT user_id FROM dashboard_players WHERE username=?').get('legacy').user_id,'uuid-legacy');
  assert.equal(sql.prepare('SELECT n FROM identity_updates').get().n,1,'Legacy identity is linked once');
  assert.equal((await call('legacy','state')).status,200);
  assert.equal(sql.prepare('SELECT n FROM identity_updates').get().n,1);
  sql.prepare('INSERT INTO dashboard_players(username,user_id,display_name) VALUES(?,?,?)').run('conflict','another-owner','Existing');
  const conflictBefore=sql.prepare('SELECT total_changes() n').get().n;
  assert.equal((await call('conflict','state')).status,409);
  assert.equal((await call('conflict','presence',{online:true})).status,409);
  assert.equal(sql.prepare('SELECT total_changes() n').get().n,conflictBefore,'Conflicting identities cannot change profile or presence');
  console.log('PASS: 200 repeated dashboard reads produce zero writes; presence preserves identity; new and legacy profiles work; conflicting identities are rejected.');
 }finally{global.fetch=nativeFetch;sql.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
