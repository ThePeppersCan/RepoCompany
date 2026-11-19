const fs=require('node:fs'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const moduleSource=path.resolve(__dirname,'../game-integrations/kure/account-saves.mjs');
function integrate(web){
  const hooks={
    'game.js':[['createSaveSlots(window.localStorage, window.sessionStorage)','createSaveSlots(accountStorage, accountSession)']],
    'network.js':[
      ['crewDirectory(localStorage,sessionStorage)','crewDirectory(accountStorage,accountSession)'],
      ['sessionStorage.getItem(resumeKey)||localStorage.getItem(resumeKey)','accountSession.getItem(resumeKey)||accountStorage.getItem(resumeKey)'],
      ['sessionStorage.setItem(resumeKey,data.resume);localStorage.setItem(resumeKey,data.resume);localStorage.setItem("kure.visited."+resumeKey','accountSession.setItem(resumeKey,data.resume);accountStorage.setItem(resumeKey,data.resume);accountStorage.setItem("kure.visited."+resumeKey']
    ]
  };
  const files=[];
  for(const [name,changes] of Object.entries(hooks)){
    const file=path.join(web,name);let data=fs.readFileSync(file,'utf8');
    for(const [before,after] of changes){
      if(data.includes(after))continue;
      if(data.split(before).length!==2)throw Error('The save interface changed in '+name+'. Review the integration before deploying.');
      data=data.replace(before,after);
    }
    const line='import {accountStorage,accountSession} from "./account-saves.mjs";';
    if(!data.includes(line))data=line+'\n'+data;
    files.push([file,data]);
  }
  fs.copyFileSync(moduleSource,path.join(web,'account-saves.mjs'));
  for(const [file,text] of files)fs.writeFileSync(file,text);
}
module.exports={integrate};
if(require.main===module)(async()=>{
  const base=process.argv[2],response=await fetch('https://kure.repocompany.uk/build-version.json?sync='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Could not identify the live KURE build.');
  const live=await response.json();if(!/^\d+\.\d+\.\d+$/.test(live.version))throw Error('Unrecognised game version.');
  const dir=path.resolve(base,'KURE-'+live.version),web=path.join(dir,'web');
  const local=JSON.parse(fs.readFileSync(path.join(web,'build-version.json'),'utf8'));
  if(!live.release||local.release!==live.release||local.version!==live.version)throw Error('The local game build differs from live KURE.');
  integrate(web);
  const result=spawnSync('cmd.exe',['/d','/c','Deploy-KURE.cmd'],{cwd:dir,stdio:'inherit'});if(result.status!==0)throw Error('Game deployment did not finish.');
  const check=await fetch('https://kure.repocompany.uk/account-saves.mjs?v='+Date.now(),{cache:'no-store'});
  if(!check.ok||(await check.text()).trim()!==fs.readFileSync(moduleSource,'utf8').trim())throw Error('The save integration has not yet been verified on the game domain.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
