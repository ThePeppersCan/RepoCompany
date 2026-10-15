'use strict';
// Executes complete matches in the existing engine. Worker threads only speed
// up independent fixtures; they are not substitute models of the game.
const {Worker,isMainThread,parentPort,workerData}=require('node:worker_threads');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const scenarios=[
 {name:'equal-neutral',home:70,away:70,neutral:true},
 {name:'equal-home',home:70,away:70,neutral:false},
 {name:'better-home-10',home:80,away:70,neutral:false},
 {name:'better-away-10',home:70,away:80,neutral:false},
 {name:'better-home-25',home:85,away:60,neutral:false},
 {name:'better-away-25',home:60,away:85,neutral:false}
];
if(!isMainThread){
 (async()=>{process.env.VELMORA_AUDIT_ENGINE_PATH=workerData.engine;
 const {runtime}=require('./test_matchday_engine.cjs'),{opts}=require('./audit_player_quality.cjs');
 const r=runtime(),c=workerData.scenario,out={...c,matches:0,homeWins:0,draws:0,awayWins:0,homeGoals:0,awayGoals:0,homeShots:0,awayShots:0,homeXg:0,awayXg:0};
 for(let i=0;i<workerData.count;i++){
  const o={...opts(c.home,c.away,901+i*7919),neutralVenue:c.neutral};assert(await r.engine.open(o));r.q.skipCareerToFulltime();assert.equal(r.q.state.phase,'fulltime');const result=r.q.careerResultSnapshot();
  const h=result.homeScore,a=result.awayScore;out.matches++;out[h>a?'homeWins':a>h?'awayWins':'draws']++;out.homeGoals+=h;out.awayGoals+=a;out.homeShots+=result.teamStats.home.shots;out.awayShots+=result.teamStats.away.shots;out.homeXg+=result.teamStats.home.xg||0;out.awayXg+=result.teamStats.away.xg||0;
  await r.engine.close();
 }parentPort.postMessage(out);
 })().catch(e=>{throw e;});
}else{
 const engine=path.resolve(process.argv[2]||path.join(__dirname,'..','velmora-quidditch-engine.js')),file=path.resolve(process.argv[3]||path.join(__dirname,'..','fairness-results.json')),count=Number(process.argv[4]||64),started=Date.now();
 Promise.all(scenarios.map(scenario=>new Promise((resolve,reject)=>{const w=new Worker(__filename,{workerData:{engine,count,scenario}});w.once('message',out=>{console.log(`${out.name}: ${out.homeWins}/${out.draws}/${out.awayWins}, goals ${out.homeGoals}-${out.awayGoals} in ${out.matches}`);resolve(out);});w.once('error',reject);w.once('exit',code=>{if(code)reject(new Error('Audit worker exited '+code));});}))).then(rows=>{
  const report={engineHash:require('node:crypto').createHash('sha256').update(fs.readFileSync(engine)).digest('hex'),matches:count*rows.length,seconds:Math.round((Date.now()-started)/1000),rows};fs.writeFileSync(file,JSON.stringify(report,null,2));console.log(`Saved ${report.matches} complete matches to ${file} (${report.seconds}s)`);
 }).catch(e=>{console.error(e);process.exitCode=1;});
}
