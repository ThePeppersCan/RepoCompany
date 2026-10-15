const fs=require('fs'),assert=require('assert/strict'),{DatabaseSync}=require('node:sqlite');
(async()=>{
 const catalog=JSON.parse(fs.readFileSync('account-assets/avatar-v2/catalog.json','utf8'));
 const source=fs.readFileSync('functions/api/dashboard/[[path]].js','utf8').replace("import frameCatalog from '../../../avatar-frame-catalog.json';",'const frameCatalog='+fs.readFileSync('avatar-frame-catalog.json','utf8')+';').replace("import config from '../../../dashboard-config.json';","const config={url:'https://auth.test',key:'public'};").replace("import avatarCatalog from '../../../account-assets/avatar-v2/catalog.json';",'const avatarCatalog='+JSON.stringify(catalog)+';');
 const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const sql=new DatabaseSync(':memory:');for(const file of ['dashboard-social-schema.sql','dashboard-playtime-schema.sql','dashboard-avatar-schema.sql','dashboard-frames-schema.sql','dashboard-privacy-schema.sql'])sql.exec(fs.readFileSync(file,'utf8'));
 const prepare=(q,args=[])=>({bind(...a){return prepare(q,a)},async first(){return sql.prepare(q).get(...args)||null},async all(){return{results:sql.prepare(q).all(...args)}},async run(){return sql.prepare(q).run(...args)}});
 const env={DASHBOARD_DB:{prepare,async batch(ss){for(const s of ss)await s.run()}}};
 global.fetch=async(url,opts)=>{const who=opts.headers.Authorization.slice(7);if(!['alice','bob'].includes(who))return Response.json({}, {status:401});if(url.endsWith('/auth/v1/user'))return Response.json({id:'uuid-'+who});if(url.endsWith('/get_my_character'))return Response.json([{username:who}]);return Response.json([{username:JSON.parse(opts.body).p_username}]);};
 async function call(who,path,body,origin='https://stage.test'){const response=await onRequest({env,params:{path},request:new Request('https://stage.test/api/dashboard/'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+who,Origin:origin},...(body===undefined?{}:{body:JSON.stringify(body)})})});return{status:response.status,body:await response.json()};}
 assert.equal((await call('alice','state')).body.profile.avatar,null);
 assert.equal((await call('bad','avatar',{avatar:catalog.defaults})).status,401);
 assert.equal((await call('alice','avatar',{avatar:catalog.defaults},'https://evil.test')).status,403);
 const value={...catalog.defaults,body:'female',hair:'24',beard:'06',eyes:'08',nose:'08',mouth:'08',ears:'05',skinColor:'#513025',hairColor:'#FADEAB',beardColor:'#123456',clothing:'hoodie',clothingColor:'#B27C42'};
 let saved=await call('alice','avatar',{avatar:value,username:'bob',repo_score:999999});assert.equal(saved.status,200);assert.equal(saved.body.avatar.hairColor,'#fadeab');assert.equal(saved.body.avatar.beardColor,'#fadeab');
 let profile=(await call('alice','state')).body.profile;assert.deepEqual(profile.avatar,saved.body.avatar);assert.equal(profile.repo_score,0);
 assert.equal(profile.avatar.clothing,'hoodie');assert.equal(profile.avatar.clothingColor,'#b27c42');
 for(const patch of [{clothing:'other'},{clothing:null},{clothingColor:'#fff'},{clothingColor:null}])assert.equal((await call('alice','avatar',{avatar:{...value,...patch}})).status,400);
 assert.equal((await call('bob','state')).body.profile.avatar,null,'Cannot write another account avatar');
 for(const patch of [{hair:'missing'},{eyes:'missing'},{nose:'00'},{mouth:'missing'},{face:'missing'},{face:null},{ears:'06'},{beard:'07'},{body:'other'},{hairColor:'url(https://evil.test)'},{skinColor:'#fff'},{version:2},{linkHairBeard:'false'}])assert.equal((await call('alice','avatar',{avatar:{...value,...patch}})).status,400);
 assert.equal((await call('alice','avatar',{avatar:null})).status,400);
 await call('alice','friends',{action:'request',username:'bob'});await call('bob','friends',{action:'accept',username:'alice'});
 assert.deepEqual((await call('bob','state')).body.friends[0].avatar,saved.body.avatar,'Friends receive saved avatar');
 await call('alice','avatar',{avatar:{...value,hair:'none',beard:'none',linkHairBeard:false,beardColor:'#121212'}});
 profile=(await call('alice','state')).body.profile;assert.equal(profile.avatar.hair,'none');assert.equal(profile.avatar.beardColor,'#121212');
 for(const body of ['male','female']){
  const expanded={...value,body,face:'square',hair:'36',eyes:'12',mouth:'09',clothing:'armour'};
  const result=await call('alice','avatar',{avatar:expanded});assert.equal(result.status,200);
  assert.equal(result.body.avatar.face,'square');assert.equal(result.body.avatar.hair,'36');assert.equal(result.body.avatar.clothing,'armour');
  assert.deepEqual((await call('bob','state')).body.friends[0].avatar,result.body.avatar,'Friends receive sheet selections');
 }
 const legacy={...value};delete legacy.clothing;delete legacy.clothingColor;delete legacy.face;
 sql.prepare('UPDATE dashboard_avatars SET config=? WHERE username=?').run(JSON.stringify(legacy),'alice');
 profile=(await call('alice','state')).body.profile;assert.equal(profile.avatar.hair,'24');assert.equal(profile.avatar.clothing,'jacket');assert.equal(profile.avatar.clothingColor,'#41434f');
 assert.equal(profile.avatar.face,'classic','Old saved avatars retain their face');
 assert.equal((await call('alice','avatar',{avatar:legacy})).body.avatar.face,'classic','Older clients can still save');
 await call('alice','friends',{action:'block',username:'bob'});assert.equal((await call('bob','state')).body.friends.length,0,'Blocked profiles stay unavailable');
 assert.equal(sql.prepare('SELECT count(*) AS n FROM dashboard_avatars').get().n,1);
 sql.close();console.log('PASS: avatar persistence, linked/separate colours, feature validation, account ownership, friends and blocking.');
})().catch(e=>{console.error(e);process.exit(1)});
