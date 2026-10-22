const fs=require('fs'),assert=require('assert/strict'),{DatabaseSync}=require('node:sqlite');
(async()=>{
 const source=fs.readFileSync('functions/api/dashboard/[[path]].js','utf8').replace("import frameCatalog from '../../../avatar-frame-catalog.json';",'const frameCatalog='+fs.readFileSync('avatar-frame-catalog.json','utf8')+';').replace("import config from '../../../dashboard-config.json';","const config={url:'https://auth.test',key:'public'};").replace("import avatarCatalog from '../../../account-assets/avatar-v2/catalog.json';",'const avatarCatalog='+fs.readFileSync('account-assets/avatar-v2/catalog.json','utf8')+';');
 const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const sql=new DatabaseSync(':memory:');for(const f of ['dashboard-social-schema.sql','dashboard-playtime-schema.sql','dashboard-avatar-schema.sql','dashboard-profile-pictures-schema.sql','dashboard-privacy-schema.sql','dashboard-frames-schema.sql'])sql.exec(fs.readFileSync(f,'utf8'));
 const prep=(q,args=[])=>({bind(...a){return prep(q,a)},async first(){return sql.prepare(q).get(...args)||null},async all(){return{results:sql.prepare(q).all(...args)}},async run(){return sql.prepare(q).run(...args)}}),env={DASHBOARD_DB:{prepare:prep,async batch(ss){for(const s of ss)await s.run()}}};
 let offline=false;
 global.fetch=async(url,opts)=>{const who=opts.headers.Authorization.slice(7);if(!['alice','bob'].includes(who))return Response.json({}, {status:401});if(url.endsWith('/auth/v1/user'))return Response.json({id:'uuid-'+who});if(url.endsWith('/get_my_character'))return Response.json([{username:who}]);if(url.endsWith('/get_my_avatar_frames'))return offline?Response.json({}, {status:503}):Response.json([{owned:who==='alice'?['ember-crown']:[]}]);return Response.json([{username:JSON.parse(opts.body).p_username}]);};
 const call=async(who,p,body,origin='https://stage.test')=>{const r=await onRequest({env,params:{path:p.split('?')[0]},request:new Request('https://stage.test/api/dashboard/'+p,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+who,Origin:origin},...(body===undefined?{}:{body:JSON.stringify(body)})})});return{status:r.status,body:await r.json()};};
 assert.equal((await call('bad','frame',{frameId:'ember-crown'})).status,401);
 assert.equal((await call('alice','frame',{frameId:'ember-crown'},'https://evil.test')).status,403);
 assert.equal((await call('alice','frame',{frameId:'fake'})).status,400);assert.equal((await call('alice','frame',{})).status,400);
 assert.equal((await call('bob','frame',{frameId:'ember-crown',username:'alice',owned:['ember-crown']})).status,403);
 assert.equal((await call('alice','frame',{frameId:'ember-crown',username:'bob'})).status,200);
 assert.equal((await call('alice','state')).body.profile.frame_id,'ember-crown');assert.equal((await call('bob','state')).body.profile.frame_id,null);
 await call('alice','privacy',{privateProfile:true});assert.equal((await call('bob','profile?username=alice')).body.locked,true);
 await call('alice','friends',{action:'request',username:'bob'});assert.equal((await call('bob','state')).body.friends[0].frame_id,undefined);
 await call('bob','friends',{action:'accept',username:'alice'});assert.equal((await call('bob','state')).body.friends[0].frame_id,'ember-crown');
 offline=true;assert.equal((await call('alice','frame',{frameId:'ember-crown'})).status,503);assert.equal((await call('alice','state')).body.profile.frame_id,'ember-crown');
 assert.equal((await call('alice','frame',{frameId:null})).status,200);assert.equal((await call('alice','state')).body.profile.frame_id,null);
 sql.exec(fs.readFileSync('dashboard-achievements-schema.sql','utf8'));offline=false;
 const rewards=JSON.parse(fs.readFileSync('avatar-frame-catalog.json')).filter(f=>f.game==='comp-run');
 assert.equal(rewards.length,8);assert.equal(new Set(rewards.map(f=>f.achievementId)).size,8);
 for(const reward of rewards){
  assert.equal((await call('alice','frame',{frameId:reward.id,owned:[reward.id]})).status,403,'Client cannot forge '+reward.id);
  sql.prepare('INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES(?,?,?,?,?)').run(reward.achievementId,'comp-run','nightmare',1,50);
  sql.prepare('INSERT INTO dashboard_achievement_unlocks(username,achievement_id,score,unlocked_at) VALUES(?,?,?,?)').run('alice',reward.achievementId,50,Date.now()-86400000);
  assert.equal((await call('alice','frame',{frameId:reward.id})).status,200,'Existing achievement earns '+reward.id);
  assert.equal((await call('alice','state')).body.profile.frame_id,reward.id);
  assert.equal((await call('bob','frame',{frameId:reward.id,username:'alice'})).status,403,'Rewards stay with their owner');
 }
 sql.close();console.log('PASS: frame ownership, privacy, outage handling, and all eight COMP-RUN rewards (including prior unlocks and account isolation).');
})().catch(e=>{console.error(e);process.exitCode=1;});
