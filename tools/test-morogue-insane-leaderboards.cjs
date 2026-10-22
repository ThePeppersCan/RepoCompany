'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite'),{patchWorker}=require('./morogue-insane-worker.cjs');
const capture=process.argv[2];if(!capture)throw Error('Pass the fresh shared Worker capture directory.');
const source=patchWorker(fs.readFileSync(path.join(capture,'modules/cloudflare.js'),'utf8'));const start=source.indexOf('// server/morogue-leaderboards.mjs'),end=source.indexOf('// server/cloudflare.mjs');
const context=vm.createContext({Response,Request,URL,AbortSignal,TextEncoder,crypto,console,__name:fn=>fn});vm.runInContext(source.slice(start,end),context);
const sql=new DatabaseSync(':memory:');sql.exec(`CREATE TABLE morogue_players(user_id TEXT PRIMARY KEY,username TEXT,updated_at INTEGER);
CREATE TABLE morogue_limits(key TEXT PRIMARY KEY,window INTEGER,count INTEGER);
CREATE TABLE morogue_runs(id TEXT PRIMARY KEY,user_id TEXT,season TEXT,mode TEXT,weapon TEXT,loadout TEXT,started_at INTEGER,updated_at INTEGER,expires_at INTEGER,status TEXT DEFAULT 'open',seq INTEGER DEFAULT 0,active_ms INTEGER DEFAULT 0,wave_ms INTEGER DEFAULT 0,kills INTEGER DEFAULT 0,bosses INTEGER DEFAULT 0,majors INTEGER DEFAULT 0,finales INTEGER DEFAULT 0,outcome TEXT,score INTEGER DEFAULT 0);
CREATE TABLE morogue_results(run_id TEXT PRIMARY KEY,user_id TEXT,season TEXT,mode TEXT,weapon TEXT,loadout TEXT,active_ms INTEGER,wave_ms INTEGER,kills INTEGER,bosses INTEGER,majors INTEGER,finales INTEGER,outcome TEXT,score INTEGER,finished_at INTEGER);`);
function prepare(q,args=[]){return{bind(...a){return prepare(q,a)},async first(){return sql.prepare(q).get(...args)||null},async all(){return{results:sql.prepare(q).all(...args)}},async run(){return sql.prepare(q).run(...args)}};}
const env={LEADERBOARDS_DB:{prepare,async batch(list){return Promise.all(list.map(s=>s.run()));}}};let now=100000;const handler=context.createLeaderboardApi({authenticate:async r=>({id:r.headers.get('Authorization')||'alice',username:'Alice'}),now:()=>now});
async function call(route,body,who='alice'){const r=await handler(new Request('https://morogue.repocompany.uk/api/leaderboards'+route,{method:body?'POST':'GET',headers:{Authorization:who,Origin:'https://morogue.repocompany.uk'},...(body?{body:JSON.stringify(body)}:{})}),env);return{status:r.status,body:await r.json()};}
(async()=>{for(const [i,season]of ['first-light-1','first-light-insane-1'].entries()){
 const id='12345678-1234-1234-1234-00000000000'+i,start={runId:id,season,mode:'endless',weapon:'espresso',loadout:'solo'};
 assert.equal((await call('/start',start)).status,200);
 assert.equal((await call('/start',{...start,season:i?'first-light-1':'first-light-insane-1'})).status,409,'A retry cannot change difficulty');
 now+=10000;const report={runId:id,seq:1,activeMs:9000,waveMs:8000,kills:4,bosses:0,majors:0,finales:0,score:22,outcome:'lost'};
 assert.equal((await call('/finish',report,'bob')).status,404);assert.equal((await call('/finish',report)).status,200);assert.equal((await call('/finish',report)).body.duplicate,true);
 }
 for(const season of ['first-light-1','first-light-insane-1']){const r=await call('?season='+season);assert.equal(r.status,200);assert.equal(r.body.total,1);assert.equal(r.body.rows.length,1);assert.equal(r.body.season,season);}
 assert.equal((await call('')).body.season,'first-light-1','Old clients keep Normal records');assert.equal((await call('?season=forged')).status,400);
 assert.equal((await call('/start',{runId:'12345678-1234-1234-1234-000000000002',mode:'mora',weapon:'espresso',loadout:'solo',season:'forged'})).status,400);
 sql.close();console.log('PASS: separate Normal/Insane records, retry difficulty locking, ownership, duplicate finish and old-client compatibility.');
})().catch(e=>{console.error(e);process.exitCode=1;});
