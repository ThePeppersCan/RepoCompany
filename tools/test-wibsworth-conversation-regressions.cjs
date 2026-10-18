const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
(async()=>{
 const {createWibsworthHandler}=await import('../lib/wibsworth-service.mjs');
 const {retrieveKnowledge,isCanonicalProduct}=await import('../lib/wibsworth-knowledge.mjs');
 const local=await import('../lib/wibsworth-local.mjs');
 const sql=new DatabaseSync(':memory:');
 sql.exec('CREATE TABLE community_roles(user_id TEXT,role TEXT)');
 for(const file of ['dashboard-wibsworth-schema.sql','dashboard-wibsworth-local-schema.sql','dashboard-wibsworth-learning-schema.sql'])sql.exec(fs.readFileSync(path.join(__dirname,'..',file),'utf8'));
 const db={withSession(){return this;},prepare(query){const statement=(args=[])=>({bind:(...next)=>statement(next),first:async()=>sql.prepare(query).get(...args)||null,all:async()=>({results:sql.prepare(query).all(...args)}),run:async()=>sql.prepare(query).run(...args)});return statement();}};
 const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
 let now=Date.UTC(2026,9,18,13),calls=0;
 const env={DASHBOARD_DB:db,WIBSWORTH_AI_ENABLED:'true',WIBSWORTH_PROVIDER:'ks5b',WIBSWORTH_BRIDGE_SECRET:'s'.repeat(64)};
 assert.equal(local.localModel(env),'Qwen3 1.7B');
 assert.equal(local.localModel({...env,WIBSWORTH_MODEL:'qwen3-4b-instruct'}),'Qwen3 4B Instruct');
 assert.equal(local.localConfigured({...env,WIBSWORTH_MODEL:'unapproved-model'}),false);
 const modelHeartbeat=label=>local.heartbeat(new Request('https://repocompany.uk/api/wibsworth/bridge-heartbeat',{method:'POST',headers:{Authorization:'Bearer '+env.WIBSWORTH_BRIDGE_SECRET,'Content-Type':'application/json'},body:JSON.stringify({url:'https://trial-bridge.trycloudflare.com'})}),{...env,WIBSWORTH_MODEL:'qwen3-4b-instruct'},now,async()=>Response.json({model:label}));
 assert.equal((await modelHeartbeat('Qwen3 1.7B')).status,503);
 assert.equal((await modelHeartbeat('Qwen3 4B Instruct')).status,200);
 const handler=createWibsworthHandler({config:{},retrieveKnowledge,isCanonicalProduct,clock:()=>now,identify:async request=>({id:request.headers.get('Authorization')||alice})});
 async function ask(question,extra={},who=alice){const response=await handler({request:new Request('https://repocompany.uk/api/wibsworth/chat',{method:'POST',headers:{Authorization:who,'Content-Type':'application/json'},body:JSON.stringify({question,...extra})}),env,params:{path:['chat']}});return {status:response.status,retryHeader:response.headers.get('Retry-After'),body:await response.json()};}
 const noVersion=answer=>assert.doesNotMatch(answer,/web (?:version|build|game)|launcher|installed (?:version|build|game)|your version/i);
 for(const [question,expected]of [
  ['what are the locations in moratales',/Brindlewick, Glass Mile and Merrowby/],
  ['Where do I buy sugar in Moratales?',/Arthur/],
  ['How do I make scones in Moratales?',/2 Morning Crust flour/],
  ['How do I get to Glass Mile in Moratales?',/seven Brindlewick milestones/],
  ['What worlds are in Velmora Manager?',/Kharova, Caldria and Ezuraya/],
  ['What is the Night pantry in Morogue?',/60, 120 and 180/]
 ]){
  now+=61000;const r=await ask(question,{platform:'launcher'});assert.equal(r.status,200);assert.match(r.body.answer,expected,question);noVersion(r.body.answer);assert(r.body.sources.length);assert.doesNotMatch(r.body.answer,/send a correction|official page link/i);
 }
 for(const question of ['So what is Repo Company then?','Could you tell me a bit about Repo Company please?','What is RepoCompany exactly?']){
  now+=61000;const r=await ask(question);assert.equal(r.status,200);assert.match(r.body.answer,/Wibs/);assert.match(r.body.answer,/Reparty/);
 }
 const history=[{role:'user',content:'Can you help me with Morogue?'},{role:'assistant',content:'What kind of build would you like?'}];
 for(const question of ['I want high damage on it','High damage','What builds can I do on it?']){
  now+=61000;const r=await ask(question,{history,platform:'launcher'});assert.equal(r.status,200);assert.match(r.body.answer,/Glass Pepper/);assert.match(r.body.answer,/62.5%/);assert.match(r.body.answer,/20% more damage/);assert.match(r.body.answer,/10% slower/);noVersion(r.body.answer);
 }
 now+=61000;let r=await ask('the web version',{history:[...history,{role:'user',content:'I want high damage on it'}],platform:'launcher'});assert.equal(r.status,200);assert.match(r.body.answer,/Glass Pepper/);noVersion(r.body.answer);
 const finalQuestion="I can't seem to complete the final boss in Morogue, can you give me tips";
 now+=61000;r=await ask(finalQuestion,{platform:'launcher'});assert.equal(r.body.needsSpoilerConsent,true);assert.doesNotMatch(r.body.answer,/gold seal|Uncrowned/);
 now+=61000;r=await ask(finalQuestion,{platform:'launcher',spoilers:true});assert.match(r.body.answer,/gold seal/);assert.match(r.body.answer,/both anchors/);assert.match(r.body.answer,/four wrist\/ankle joints/);assert.match(r.body.answer,/Boss practice/);noVersion(r.body.answer);assert.doesNotMatch(r.body.answer,/23 bosses|Which boss are you facing/);
  now+=61000;r=await ask('Yes please',{history:[{role:'user',content:finalQuestion},{role:'assistant',content:'That may reveal a story ending, secret boss or hidden unlock. Would you like me to include spoilers?'}]});assert.match(r.body.answer,/gold seal/);
 now+=61000;r=await ask('List all Morogue bosses',{platform:'launcher',spoilers:true});assert.equal((r.body.answer.match(/• /g)||[]).length,23);noVersion(r.body.answer);
 now+=61000;await ask('Who are you?');now+=10000;await ask('What can you do?');now+=10000;await ask('Where am I?');now+=10000;
 r=await ask('Who are you?');assert.equal(r.status,429);assert.equal(r.body.reason,'message-rate');assert.equal(r.body.retryAfterSeconds,30);assert.equal(r.retryHeader,'30');now+=30000;assert.equal((await ask('Who are you?')).status,200);
 // A known bridge admission rejection must not strand a two-minute lease.
 now=Date.now();sql.exec('DELETE FROM wibsworth_local_requests');
 sql.prepare('INSERT OR REPLACE INTO wibsworth_local_bridge VALUES(1,?,?)').run('https://trial-bridge.trycloudflare.com',now);
 const originalFetch=global.fetch;global.fetch=async()=>{calls++;return Response.json({error:'Busy'},{status:429});};
 try{
  r=await ask('Explain why the sky is blue');assert.equal(r.status,429);assert.equal(r.body.reason,'server-busy');assert.equal(r.body.retryAfterSeconds,5);assert.equal(sql.prepare('SELECT COUNT(*) n FROM wibsworth_local_requests WHERE completed=0').get().n,0);
  global.fetch=async()=>{calls++;return Response.json({answer:'Air scatters shorter wavelengths of sunlight more strongly.'});};
  now+=5000;r=await ask('Explain why the sky is blue',{},bob);assert.equal(r.status,200);assert.equal(calls,2);
 }finally{global.fetch=originalFetch;sql.close();}
 console.log('PASS: conversational site questions; damage and game follow-ups; legacy launcher clients; final-boss guidance and spoiler consent; boss roster; exact rate countdown; rejected bridge lease release.');
})().catch(error=>{console.error(error);process.exitCode=1;});
