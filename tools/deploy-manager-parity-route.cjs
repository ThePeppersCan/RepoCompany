'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
// Defaults to validation only. A fresh reviewed candidate is required.
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i++){const key=args[i];if(key==='--deploy'){options.deploy=true;continue;}if(!['--candidate'].includes(key)||!args[i+1])throw Error('Use --candidate <dir> [--deploy].');options[key.slice(2)]=args[++i];}
if(!options.candidate)throw Error('A reviewed candidate directory is required.');
const candidate=path.resolve(options.candidate);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const report=JSON.parse(await fs.readFile(path.join(candidate,'report.json'),'utf8'));
 const credential=process.env.CLOUDFLARE_API_TOKEN ? '' : await fs.readFile(path.join(process.env.USERPROFILE,'.wrangler/config/default.toml'),'utf8'),token=process.env.CLOUDFLARE_API_TOKEN||credential.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];if(!token)throw Error('Wrangler authentication unavailable.');
 const apiRoot='https://api.cloudflare.com/client/v4',apiBase=apiRoot+'/accounts/a51cff0a015e6c78d886b2f0a92735cc/workers/scripts/repo-manager-achievements';
 async function api(url,options={}){const r=await fetch(url,{...options,headers:{Authorization:'Bearer '+token,...options.headers}});if(!r.ok)throw Error('Cloudflare request failed: HTTP '+r.status);return r;}
 const urls=['https://manager.repocompany.uk/','https://manager.repocompany.uk/app.js','https://manager.repocompany.uk/career-bootstrap.js','https://manager.repocompany.uk/velmora-quidditch-engine.js','https://repocompany.uk/game-integrations/manager/app.js'];
 async function publicHash(url){const r=await fetch(url,{cache:'no-store'});if(r.status!==200)throw Error('Published endpoint unavailable: '+url);return hash(Buffer.from(await r.arrayBuffer()));}
 const untouchedBefore=Object.fromEntries(await Promise.all(urls.map(async url=>[url,await publicHash(url)])));
 if(await publicHash('https://manager.repocompany.uk/player-career.css')!==report.originalCSSSha256)throw Error('The Manager stylesheet changed before deployment.');
 const modules={};for(const[name,info]of Object.entries(report.modules)){const bytes=await fs.readFile(path.join(candidate,'modules',name));if(hash(bytes)!==info.sha256)throw Error('Candidate module changed: '+name);modules[name]=bytes;}
 // Recheck the deployed source, settings and version immediately before PUT.
 for(const[label,suffix,expected]of[['settings','/settings',report.capturedSettingsSha256],['deployments','/deployments',report.capturedDeploymentsSha256]]){const bytes=Buffer.from(await(await api(apiBase+suffix)).arrayBuffer());if(hash(bytes)!==expected)throw Error('Current Manager '+label+' changed; aborting.');}
 const form=await(await api(apiBase+'/content/v2')).formData(),actual={};for(const[name,blob]of form)actual[name]=hash(Buffer.from(await blob.arrayBuffer()));
 const expected=Object.fromEntries(Object.entries(report.originalModules).map(([name,item])=>[name,item.sha256]));
 if(JSON.stringify(Object.entries(actual).sort())!==JSON.stringify(Object.entries(expected).sort()))throw Error('Current Manager modules changed; aborting.');
 const metadataBody=await fs.readFile(path.join(candidate,'metadata.json'));if(hash(metadataBody)!==report.metadataSha256)throw Error('Reviewed candidate metadata changed.');const metadata=JSON.parse(metadataBody);
 if(!options.deploy){console.log('Reviewed Manager modules, settings, deployment and published CSS still match. No changes made.');return;}
 const upload=new FormData();upload.set('metadata',JSON.stringify(metadata));for(const[name,bytes]of Object.entries(modules))upload.set(name,new Blob([bytes],{type:'application/javascript+module'}),name);
 const result=await(await api(apiBase,{method:'PUT',body:upload})).json();if(!result.success)throw Error('Worker upload was not confirmed.');
 await fs.writeFile(path.join(candidate,'deployment-result.json'),JSON.stringify({uploadedAt:new Date().toISOString(),result:result.result},null,2),{flag:'wx'});
 let liveCSS;
 for(let attempt=0;attempt<12;attempt++){liveCSS=await publicHash('https://manager.repocompany.uk/player-career.css?parity='+Date.now());if(liveCSS===report.correctedCSSSha256)break;await new Promise(resolve=>setTimeout(resolve,1000));}
 if(liveCSS!==report.correctedCSSSha256)throw Error('Worker uploaded but corrected live CSS not yet verified.');
 const untouchedAfter=Object.fromEntries(await Promise.all(urls.map(async url=>[url,await publicHash(url)])));
 if(JSON.stringify(untouchedBefore)!==JSON.stringify(untouchedAfter))throw Error('An untouched endpoint changed during deployment; review immediately.');
 const verification={verifiedAt:new Date().toISOString(),worker:'repo-manager-achievements',liveCSSSha256:liveCSS,routeMutationRequested:false,untouched:untouchedAfter,originalModulesPreserved:expected};
 await fs.writeFile(path.join(candidate,'live-verification.json'),JSON.stringify(verification,null,2),{flag:'wx'});
 console.log(JSON.stringify(verification,null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1});
