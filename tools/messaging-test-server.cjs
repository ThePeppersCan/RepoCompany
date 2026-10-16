'use strict';
// Isolated integration fixture: the actual social API and SQLite schema are
// exercised; identity providers and TURN issuance never touch real accounts.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..'),config=JSON.parse(fs.readFileSync(path.join(root,'dashboard-config.json')));
const people={alice:'11111111-1111-4111-8111-111111111111',bob:'22222222-2222-4222-8222-222222222222',mallory:'33333333-3333-4333-8333-333333333333'};
const encode=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const sessions=Object.fromEntries(Object.entries(people).map(([username,id])=>{const expires=Math.floor(Date.now()/1000)+3600,user={id,aud:'authenticated',role:'authenticated',email:username+'@conofdrpepper.local',user_metadata:{username},created_at:new Date().toISOString()};return [username,{access_token:encode({alg:'HS256'})+'.'+encode({sub:id,exp:expires,role:'authenticated'})+'.fixture',refresh_token:'fixture-'+username,token_type:'bearer',expires_in:3600,expires_at:expires,user}];}));
async function createFixture(fixtureOptions={}){
 const source=fs.readFileSync(path.join(root,'functions/api/social/[[path]].js'),'utf8').replace("import config from '../../../dashboard-config.json';",'const config='+JSON.stringify({...config,socialCallsEnabled:true})+';');
 const {onRequest}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync(path.join(root,'dashboard-social-schema.sql'),'utf8'));sql.exec(fs.readFileSync(path.join(root,'dashboard-messaging-schema.sql'),'utf8'));sql.exec(fs.readFileSync(path.join(root,'dashboard-chat-extras-schema.sql'),'utf8'));
 for(const file of ['dashboard-community-schema.sql','dashboard-avatar-schema.sql','dashboard-frames-schema.sql','dashboard-privacy-schema.sql','dashboard-playtime-schema.sql','dashboard-game-presence-schema.sql','dashboard-community-profile-schema.sql','dashboard-wibs-appearance-schema.sql'])sql.exec(fs.readFileSync(path.join(root,file),'utf8'));
 const communitySource=fs.readFileSync(path.join(root,'functions/api/community/[[path]].js'),'utf8').replace("import config from '../../../dashboard-config.json';",'const config='+JSON.stringify(config)+';');
 const onCommunityRequest=(await import('data:text/javascript;base64,'+Buffer.from(communitySource).toString('base64'))).onRequest;
 const profileSource=fs.readFileSync(path.join(root,'functions/api/reparty-profiles.js'),'utf8').replace("import config from '../../dashboard-config.json';",'const config='+JSON.stringify(config)+';');
 const onRepartyProfiles=(await import('data:text/javascript;base64,'+Buffer.from(profileSource).toString('base64'))).onRequestGet;
 for(const [username,id]of Object.entries(people))sql.prepare('INSERT INTO dashboard_players(username,user_id,display_name) VALUES(?,?,?)').run(username,id,username[0].toUpperCase()+username.slice(1));
 sql.prepare("INSERT INTO dashboard_friendships VALUES('alice','bob','alice','accepted',?)").run(Date.now());
 const prepare=(query,values=[])=>({bind(...args){return prepare(query,args)},async first(){return sql.prepare(query).get(...values)||null},async all(){return {results:sql.prepare(query).all(...values)}},run(){const result=sql.prepare(query).run(...values);return {success:true,meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}}}});
 const db={prepare,withSession(){return this},async batch(statements){sql.exec('BEGIN');try{const results=statements.map(s=>s.run());sql.exec('COMMIT');return results}catch(error){sql.exec('ROLLBACK');throw error}}};
 const env={DASHBOARD_DB:db,SOCIAL_TURN_KEY_ID:'test-key',SOCIAL_TURN_KEY_API_TOKEN:'test-only-never-a-real-key'};
 const originalFetch=global.fetch;
 global.fetch=async(input,options={})=>{const url=String(input),token=new Headers(options.headers).get('Authorization')?.replace(/^Bearer /,''),who=Object.entries(sessions).find(([,s])=>s.access_token===token)?.[0];
  if(url.startsWith('https://rtc.live.cloudflare.com/'))return fixtureOptions.voiceSecrets ? originalFetch(input,options) : Response.json({iceServers:[{urls:['turn:turn.cloudflare.com:3478?transport=udp'],username:'fixture-relay',credential:'fixture-only'}]},{status:201});
  if(!url.startsWith(config.url))throw Error('Unexpected external request in isolated messaging fixture');
  if(!who)return Response.json({error:'invalid fixture identity'},{status:401});
  if(url.endsWith('/auth/v1/user'))return Response.json(sessions[who].user);
  if(url.endsWith('/get_my_character'))return Response.json([{username:who}]);
  throw Error('Unexpected upstream route');
 };
 let voiceHub,onVoiceRequest;
 if(fixtureOptions.voiceSecrets){
  const {VoiceHub}=await import(require('node:url').pathToFileURL(path.join(root,'workers/voice/worker.mjs')));
  const storage={async get(){return this.saved},async put(_key,value){this.saved=structuredClone(value)},async getAlarm(){return this.alarm},async setAlarm(at){this.alarm=at},async deleteAlarm(){this.alarm=null}};
  voiceHub=new VoiceHub({storage,blockConcurrencyWhile:fn=>fn()},{DASHBOARD_DB:db,...fixtureOptions.voiceSecrets});
  env.REPO_VOICE={fetch:(url,init)=>voiceHub.fetch(new Request(url,init))};
  const source=fs.readFileSync(path.join(root,'functions/api/voice/[[path]].js'),'utf8').replace("import config from '../../../dashboard-config.json';",'const config='+JSON.stringify(config)+';');
  onVoiceRequest=(await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))).onRequest;
 }
 const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.gif':'image/gif','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2'};
 const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1');let response;
  if(url.pathname==='/api/reparty-profiles'){
   response=await onRepartyProfiles({request:new Request(base+req.url,{headers:req.headers}),env});
  }else if(url.pathname.startsWith('/api/community/')){
   const chunks=[];for await(const b of req)chunks.push(b);
   const request=new Request(base+req.url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
   response=await onCommunityRequest({request,env,params:{path:url.pathname.slice('/api/community/'.length).split('/')}});
  }else if(url.pathname.startsWith('/api/voice/')&&onVoiceRequest){
   const chunks=[];for await(const b of req)chunks.push(b);
   const request=new Request(base+req.url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
   response=await onVoiceRequest({request,env,params:{path:url.pathname.slice('/api/voice/'.length).split('/')}});
  }else if(url.pathname.startsWith('/api/social/')){
   const chunks=[];for await(const b of req)chunks.push(b);
   const request=new Request(base+req.url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(chunks)}:{})});
   response=await onRequest({request,env,params:{path:url.pathname.slice('/api/social/'.length).split('/')}});
  }else if(url.pathname.startsWith('/api/dashboard/')){
   const who=Object.entries(sessions).find(([,s])=>req.headers.authorization==='Bearer '+s.access_token)?.[0];
   if(!who)response=Response.json({error:'Sign in'},{status:401});
   else if(url.pathname.endsWith('/state')){const friends=sql.prepare("SELECT CASE WHEN player_a=? THEN player_b ELSE player_a END username,status,requester FROM dashboard_friendships WHERE player_a=? OR player_b=?").all(who,who,who).map(f=>({...f,display_name:f.username[0].toUpperCase()+f.username.slice(1),online:1,repo_score:120}));response=Response.json({username:who,profile:{display_name:who[0].toUpperCase()+who.slice(1),bio:'Ready for another adventure.',repo_score:120},friends,blocks:[],activity:[],friend_activity:[]})}
   else if(url.pathname.endsWith('/profile'))response=Response.json({username:'bob',relationship:'accepted',profile:{username:'bob',display_name:'Bob',repo_score:120,online:1},activity:[{game:'morogue',played_ms:3600000,last_played:Date.now()}],mutual_friends:[]});
   else response=Response.json({ok:true});
  }else if(url.pathname.startsWith('/api/'))response=Response.json({characters:[],slots:[],achievements:[]});
  else{let file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!fs.existsSync(file)&&['repo-login-template.js','repo-game-loader.js'].includes(path.basename(file)))file=path.join(root,'dist',path.basename(file));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);return;}
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Fixture failure: '+error.message}));}});
 let base;await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 return {base,sql,env,sessions,config,voiceHub,async close(){await new Promise(r=>server.close(r));sql.close();global.fetch=originalFetch;},async browserContext(browser,who){
  const context=await browser.newContext({viewport:{width:1440,height:900},permissions:['microphone','camera'],reducedMotion:'reduce'});
  await context.route('**/*',route=>{const url=route.request().url();return url.startsWith(base)||url.startsWith(config.url)||url.startsWith('data:')?route.fallback():route.abort();});
  await context.addInitScript(({session})=>{localStorage.setItem('sb-hvdrwmjieguurxvrgzfu-auth-token',JSON.stringify(session));},{session:sessions[who]});
  await context.route(config.url+'/**',route=>{const p=new URL(route.request().url()).pathname;let data=[];if(p.endsWith('/auth/v1/user'))data=sessions[who].user;else if(p.endsWith('/auth/v1/token'))data=sessions[who];else if(p.endsWith('/get_my_character'))data=[{username:who,id:people[who]}];else if(p.endsWith('/get_my_bank'))data=[{gp:100,items:{}}];else if(p.includes('collection'))data=[{cards:[]}];else if(p.includes('slab'))data=[{slabs:[]}];return route.fulfill({contentType:'application/json',body:JSON.stringify(data)});});
  // A local host-candidate connection verifies real offer/answer/ICE and media
  // flow without pretending a paid, unconfigured TURN relay has been tested.
  await context.route(base+'/api/social/ice?*',async route=>{const response=await route.fetch(),data=await response.json();if(response.ok()){data.iceServers=[{urls:'stun:127.0.0.1:9'}];data.iceTransportPolicy='all';}await route.fulfill({response,json:data});});
  return context;
 }};
}
module.exports={createFixture};
