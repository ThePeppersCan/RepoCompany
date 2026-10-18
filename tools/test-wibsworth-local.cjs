const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
(async()=>{
 const service=await import('../lib/wibsworth-service.mjs'),local=await import('../lib/wibsworth-local.mjs'),knowledge=await import('../lib/wibsworth-knowledge.mjs');
 const sql=new DatabaseSync(':memory:'),now=Date.now(),alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
 sql.exec('CREATE TABLE community_roles(user_id TEXT,role TEXT)');
 for(const schema of ['dashboard-wibsworth-schema.sql','dashboard-wibsworth-local-schema.sql'])sql.exec(fs.readFileSync(path.join(__dirname,'..',schema),'utf8'));
 const db={withSession(){return this;},prepare(query){function stmt(args=[]){return{async first(){return sql.prepare(query).get(...args)||null;},async all(){return{results:sql.prepare(query).all(...args)};},async run(){return sql.prepare(query).run(...args);}};}return{...stmt(),bind(...args){return stmt(args);}};}};
 const env={DASHBOARD_DB:db,WIBSWORTH_AI_ENABLED:'true',WIBSWORTH_PROVIDER:'ks5b',WIBSWORTH_BRIDGE_SECRET:'s'.repeat(64),AI:{run(){throw Error('PAID PROVIDER MUST NOT RUN');}}};
 const handler=service.createWibsworthHandler({config:{},retrieveKnowledge:knowledge.retrieveKnowledge,isCanonicalProduct:knowledge.isCanonicalProduct,identify:async request=>{const id=request.headers.get('Authorization');if(![alice,bob].includes(id))throw Object.assign(Error('Sign in'),{status:401});return{id};}});
 async function call(route,body,who=alice){const r=await handler({request:new Request('https://repocompany.uk/api/wibsworth/'+route,{method:body?'POST':'GET',headers:{Authorization:who,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env,params:{path:[route]}});return{status:r.status,body:await r.json()};}
 assert.equal((await call('state',undefined,'nobody')).status,401);
 assert.equal((await call('state')).body.available,false,'missing endpoint fails closed');
 const hb=(url,secret=env.WIBSWORTH_BRIDGE_SECRET)=>local.heartbeat(new Request('https://repocompany.uk/api/wibsworth/bridge-heartbeat',{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({url})}),env,now,async()=>Response.json({model:'Qwen3 1.7B'}));
 assert.equal((await hb('https://safe-bridge.trycloudflare.com','wrong')).status,403);
 for(const url of ['http://127.0.0.1','https://evil.test','https://safe.trycloudflare.com@evil.test','https://safe.trycloudflare.com/path','https://safe.trycloudflare.com:444'])assert.equal((await hb(url)).status,400);
 assert.equal((await hb('https://safe-bridge.trycloudflare.com')).status,200);
 assert.equal(await local.bridgeFor(db,now+181000),null,'stale endpoint is disabled');
 let state=(await call('state')).body;
 assert.equal(state.available,true);assert.equal(state.usage.limit,10000);assert.equal(state.usage.daily.limit,100);assert.equal(state.usage.provider,'self-hosted');
 const original=global.fetch;let calls=0;
 global.fetch=async(url,options)=>{calls++;assert.equal(url,'https://safe-bridge.trycloudflare.com/infer');assert.equal(options.headers.Authorization,'Bearer '+env.WIBSWORTH_BRIDGE_SECRET);assert.equal(options.redirect,'error');const body=JSON.parse(options.body);assert(!Object.hasOwn(body,'model'));assert(body.messages[0].content.includes('ordinary general-knowledge'));return Response.json({answer:'A cow is a female adult of domestic cattle.'});};
 try{
  const answer=await call('chat',{question:'What is a cow?'});assert.equal(answer.status,200);assert.equal(calls,1);assert.equal(answer.body.usage.used,1);assert.equal(answer.body.usage.daily.used,1);
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM wibsworth_requests').get().n,0,'paid ledger untouched');
  const games=await call('chat',{question:'what games are available'});assert.equal(calls,1);assert.match(games.body.answer,/Moratales/);assert.match(games.body.answer,/Repo Runners/);assert(!games.body.answer.includes('Glass Pepper'));
  const typo=await call('chat',{question:'Who are the bosses in Roguemora?'});assert.match(typo.body.answer,/Did you mean Morogue/);assert.equal(calls,1);
  const prompt=await call('chat',{question:'List all Morogue bosses'});assert.equal(prompt.body.needsSpoilerConsent,true);assert(!prompt.body.answer.includes('Uncrowned'));
  const bosses=await call('chat',{question:'List all Morogue bosses',spoilers:true});assert.equal(bosses.status,200);assert.equal((bosses.body.answer.match(/• /g)||[]).length,23);assert.match(bosses.body.answer,/The Uncrowned/);assert(!bosses.body.answer.includes('Maw of the Deep'));assert.equal(calls,1);
  sql.prepare('INSERT INTO wibsworth_local_requests VALUES(?,?,?,?,?,0)').run('inflight',alice,new Date(now).toISOString().slice(0,10),now,now+120000);
  assert.equal((await call('chat',{question:'What is a cow?'},bob)).status,429);assert.equal(calls,1,'concurrent inference denied before bridge');
  sql.prepare('UPDATE wibsworth_local_requests SET completed=1').run();
  global.fetch=async()=>{calls++;throw Error('offline');};
  const offline=await call('chat',{question:'What is a cow?'},bob);assert.equal(offline.status,504);assert.equal(calls,2);assert.equal(sql.prepare('SELECT COUNT(*) n FROM wibsworth_local_requests WHERE completed=0').get().n,1,'ambiguous failures keep lease');
  sql.exec('DELETE FROM wibsworth_local_requests');
  const day=new Date(now).toISOString().slice(0,10);
  for(let i=0;i<100;i++)sql.prepare('INSERT INTO wibsworth_local_requests VALUES(?,?,?,?,?,1)').run('cap'+i,alice,day,now-7200000+i*61000,now-7200000);
  const capped=await call('chat',{question:'What is a cow?'});assert.equal(capped.status,429);assert(capped.body.allowanceResetAt>now);assert.equal(calls,2);assert.equal(capped.body.usage.daily.used,100);
  assert.equal((await call('state',undefined,bob)).body.usage.daily.used,0,'personal allowance isolated');
  sql.exec('DROP TRIGGER wibsworth_local_limits');
  sql.exec("WITH RECURSIVE seq(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM seq WHERE x<9900) INSERT INTO wibsworth_local_requests SELECT 'shared'||x,'shared',date('now'),0,0,1 FROM seq");
  sql.exec(fs.readFileSync(path.join(__dirname,'../dashboard-wibsworth-local-schema.sql'),'utf8'));
  assert.equal((await call('chat',{question:'What is a cow?'},bob)).status,429);assert.equal(calls,2);
  assert.equal((await call('state',undefined,bob)).body.usage.exhaustedPeriod,'month');
  for(const question of ['What are the best combos in Morogue?','What is a cow?','Tell me about the Repo Sports World Cup']){
   const chat={question,history:[],platform:'web',spoilers:false};const k=knowledge.retrieveKnowledge({message:question,...chat});
   assert(Buffer.byteLength(JSON.stringify(local.localMessages(chat,k,[],'')))<=9000);
  }
  console.log('PASS: server-only authentication, endpoint validation and expiry, separate usage, atomic concurrency/month/member limits, no paid fallback, compact prompts, verified catalogue/boss list and spoiler guard.');
 }finally{global.fetch=original;sql.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
