'use strict';
// Scoped COMP-RUN release: unchanged games are preserved from the current
// native feed, never reconstructed from potentially newer web versions.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {execFile}=require('node:child_process'),{promisify}=require('node:util');
const {prepareReleaseFeed}=require('./prepare-release-feed.cjs');
const {verifyGameParity}=require('./verify-game-parity.cjs');
const {verifyReceipt}=require('./publish-game-release.cjs');
const {assertPlainPath}=require('../lib/library.cjs');
const {within,validateManifest}=require('../lib/manifest.cjs');
const REPO=path.resolve(__dirname,'../..'),ORIGIN='https://repo-company-games.pages.dev',IDS=['morogue','moratales','manager'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const overlaps=(a,b)=>a===b||within(a,b)||within(b,a);
async function liveManifests(base,fetchImpl){const rows=[];for(const id of IDS){const filename=path.join(base,id,'manifest.json');await assertPlainPath(filename);const bytes=await fs.readFile(filename),r=await fetchImpl(`${ORIGIN}/${id}/manifest.json`,{cache:'no-store',signal:AbortSignal.timeout(30000)});check(r.ok,'Cannot verify current native manifest: '+id);const live=Buffer.from(await r.arrayBuffer());check(live.equals(bytes),'Base is not the current published native manifest: '+id);rows.push({id,sha256:hash(bytes),version:JSON.parse(bytes).version});}return rows;}
async function deployStatic({output}){return promisify(execFile)(process.execPath,[path.join(REPO,'node_modules/wrangler/bin/wrangler.js'),'pages','deploy','.','--project-name','repo-company-games','--branch','main'],{cwd:output,windowsHide:true,shell:false,maxBuffer:16*1024*1024});}
async function publishCompRunRelease(options,{fetchImpl=fetch,verifyImpl=verifyGameParity,prepareImpl=prepareReleaseFeed,deployImpl=deployStatic}={}){
 const {base,release,output,auditOutput}=Object.fromEntries(['base','release','output','auditOutput'].map(k=>{check(typeof options[k]==='string'&&options[k],`Missing ${k}`);return[k,path.resolve(options[k])];}));
 check(!overlaps(output,REPO)&&!overlaps(auditOutput,REPO),'Evidence and static stage must be outside the checkout.');
 for(const a of[base,release])for(const b of[output,auditOutput])check(!overlaps(a,b),'Outputs overlap immutable inputs.');check(!overlaps(output,auditOutput),'Evidence must remain outside the public feed.');
 for(const dir of[base,release,output,auditOutput])await assertPlainPath(dir,true);
 for(const dir of[output,auditOutput])await fs.lstat(dir).then(()=>{throw Error('Use a fresh output directory.');},e=>{if(e.code!=='ENOENT')throw e;});
 const before=await liveManifests(base,fetchImpl),manifestFile=path.join(release,'manifest.json');await assertPlainPath(manifestFile);const manifest=await fs.readFile(manifestFile),raw=JSON.parse(manifest);
 validateManifest(raw,{id:'comp-run',entry:'index.html',origin:ORIGIN},{developmentRoot:path.join(release,'payload')});
 await fs.mkdir(auditOutput,{recursive:true});options.onProgress?.({stage:'comp-run-full-live-parity'});
 const receipt=await verifyImpl({release,output:path.join(auditOutput,'comp-run'),concurrency:16,onProgress:options.onProgress});verifyReceipt(receipt,'comp-run',release,{raw,sha256:hash(manifest)});
 check((await fs.readFile(manifestFile)).equals(manifest),'COMP-RUN changed during verification.');
 const staged=await prepareImpl({output,base,replacements:{'comp-run':release}});
 check(staged.games.filter(g=>g.replaced).length===1&&staged.games.find(g=>g.id==='comp-run')?.replaced,'Only COMP-RUN may change.');
 for(const row of before)check(hash(await fs.readFile(path.join(output,row.id,'manifest.json')))===row.sha256,'Staging changed an existing game: '+row.id);
 const installed=JSON.parse(await fs.readFile(path.join(output,'comp-run','manifest.json')));
 check(installed.version===raw.version&&installed.files.length===raw.files.length,'Staged COMP-RUN identity differs.');
 for(const file of raw.files){const target=installed.files.find(f=>f.path===file.path);check(target?.sha256===file.sha256&&target.size===file.size,'Staged COMP-RUN file differs: '+file.path);}
 check(JSON.stringify(await liveManifests(base,fetchImpl))===JSON.stringify(before),'Published native games changed while preparing the release.');
 const evidence={schemaVersion:1,verifiedAt:new Date().toISOString(),scope:'comp-run-only',unchangedNativeGames:before,parity:{files:receipt.files.length,manifestSha256:receipt.manifestSha256},staged,deployed:false};
 await fs.writeFile(path.join(auditOutput,'release-gate.json'),JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
 if(options.deploy){options.onProgress?.({stage:'deploying-complete-preserved-feed'});const result=await deployImpl({output});evidence.deployed=true;evidence.deploymentOutput=result.stdout;await fs.writeFile(path.join(auditOutput,'deployment.json'),JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});}
 return evidence;
}
if(require.main===module){const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i++){const flag=args[i];if(flag==='--deploy'){options.deploy=true;continue;}const key={'--base':'base','--release':'release','--output':'output','--audit-output':'auditOutput'}[flag];check(key&&args[i+1]&&!options[key],'Invalid publication option.');options[key]=args[++i];}options.onProgress=x=>{if(x.stage)console.log(JSON.stringify(x));};publishCompRunRelease(options).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});}
module.exports={publishCompRunRelease};
