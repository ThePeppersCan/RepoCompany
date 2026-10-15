'use strict';
// Assemble the published manager assets with this repository's actual overlays.
// Saves use the in-memory test adapter, never the browser or a personal career.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),args=process.argv.slice(2),baseArg=args.indexOf('--base'),base=path.resolve(baseArg>=0?args[baseArg+1]:path.join(repo,'../velmora-manager-web/dist')),staging=path.join(repo,'work/manager-balance-tests');
if(!fs.existsSync(path.join(base,'player-performance.js')))throw Error('Supply the original manager dist directory with --base.');
fs.mkdirSync(staging,{recursive:true});
for(const name of fs.readdirSync(base))if(/\.(js|css|html)$/.test(name))fs.copyFileSync(path.join(base,name),path.join(staging,name));
for(const dir of ['data','vendor','assets/manager']){fs.mkdirSync(path.join(staging,dir),{recursive:true});for(const name of fs.readdirSync(path.join(base,dir)))if(name.endsWith('.js'))fs.copyFileSync(path.join(base,dir,name),path.join(staging,dir,name));}
for(const name of ['app.js','career-expansion.js','velmora-quidditch-engine.js'])fs.copyFileSync(path.join(repo,'game-integrations/manager',name),path.join(staging,name));
fs.mkdirSync(path.join(staging,'tools'),{recursive:true});for(const name of fs.readdirSync(path.join(__dirname,'manager-balance')))if(name.endsWith('.cjs'))fs.copyFileSync(path.join(__dirname,'manager-balance',name),path.join(staging,'tools',name));
const tests=['test_current_fairness.cjs','test_player_quality.cjs','test_matchday_engine.cjs','test_v71_performance_career.cjs','test_v104_8_match_balance.cjs','test_discipline.cjs','test_discipline_engine.cjs','test_v104_2_expected_goals.cjs','test_training_career.cjs','test_v46_1_matchday_readiness.cjs','audit_discipline_order.cjs','audit_roster_and_results.cjs'],results=[];
for(const test of tests){const started=Date.now(),r=spawnSync(process.execPath,[path.join(staging,'tools',test)],{cwd:staging,encoding:'utf8',maxBuffer:8*1024*1024});results.push({test,status:r.status===0?'PASS':'FAIL',seconds:+((Date.now()-started)/1000).toFixed(1),output:r.stdout,error:r.stderr});console.log(results.at(-1).status+' '+test);if(r.status!==0){console.error(r.stderr||r.stdout);break;}}
const report={status:results.length===tests.length&&results.every(r=>r.status==='PASS')?'PASS':'FAIL',results};fs.writeFileSync(path.join(staging,'validation.json'),JSON.stringify(report,null,2));
if(report.status!=='PASS')process.exitCode=1;
else if(args.includes('--matches')){const i=args.indexOf('--matches'),count=Number(args[i+1]||64);if(!Number.isInteger(count)||count<1||count>1000)throw Error('--matches must be 1–1000 per scenario.');const r=spawnSync(process.execPath,[path.join(staging,'tools/audit_match_fairness.cjs'),path.join(staging,'velmora-quidditch-engine.js'),path.join(staging,'fairness-results.json'),String(count)],{cwd:staging,stdio:'inherit'});process.exitCode=r.status;}
console.log('Validation report: '+path.join(staging,'validation.json'));
