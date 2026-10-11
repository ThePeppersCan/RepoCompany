// An assets-only Worker retains serve_directly with keep_assets. A small routing
// Worker adds the HTML hooks while the original service continues serving assets.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),arg=process.argv.indexOf('--work-dir');if(arg<0)throw Error('--work-dir required');const work=path.resolve(process.argv[arg+1]),deploy=process.argv.includes('--deploy');
const token=process.env.CLOUDFLARE_API_TOKEN||fs.readFileSync(path.join(process.env.USERPROFILE,'.wrangler/config/default.toml'),'utf8').match(/oauth_token\s*=\s*"([^"]+)"/)[1],base='https://api.cloudflare.com/client/v4',account='a51cff0a015e6c78d886b2f0a92735cc',name='repo-manager-achievements';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function api(p,o={}){const r=await fetch(base+p,{...o,headers:{Authorization:'Bearer '+token,...o.headers}}),j=await r.json();if(!r.ok||!j.success)throw Error(JSON.stringify({status:r.status,errors:j.errors}));return j.result;}
(async()=>{
 const zones=await api('/zones?name=repocompany.uk');if(zones.length!==1)throw Error('Expected the existing Repo Company zone');const zone=zones[0].id;
 const routes=await api('/zones/'+zone+'/workers/routes'),pattern='manager.repocompany.uk/*',old=routes.find(r=>r.pattern===pattern);
 if(old&&old.script!==name)throw Error('An existing route needs review before deployment');
 const backup=path.join(work,'manager-pre-achievement-routes.json');if(!fs.existsSync(backup))fs.writeFileSync(backup,JSON.stringify(routes,null,2));
 for(const file of ['app.js','career-expansion.js','career-bootstrap.js','velmora-quidditch-engine.js']){const r=await fetch('https://manager.repocompany.uk/'+file+'?source-check='+Date.now());if(!r.ok||hash(Buffer.from(await r.arrayBuffer()))!==hash(fs.readFileSync(path.join(work,'live/manager',file))))throw Error('Live manager source changed: '+file);}
 const modules={'entry.mjs':Buffer.from("import {withAchievements} from './integration.mjs';import manifest from './manifest.mjs';export default {async fetch(request,env){return withAchievements(await env.GAME.fetch(request),request,manifest);}};"),'integration.mjs':fs.readFileSync(path.join(root,'tools/game-workers/integration.mjs')),'manifest.mjs':Buffer.from('export default '+fs.readFileSync(path.join(root,'game-integrations/manifest.json'),'utf8')+';')};
 const statePath=path.join(work,'manager-achievement-route-release.json');
 const existing=await api('/accounts/'+account+'/workers/scripts');
 if(existing.some(s=>s.id===name)&&!fs.existsSync(statePath))throw Error('Route Worker already exists outside this captured release');
 if(existing.some(s=>s.id===name)){const r=await fetch(base+'/accounts/'+account+'/workers/scripts/'+name+'/content/v2',{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('Cannot verify current routing Worker');const form=await r.formData(),actual={};for(const[n,b]of form)actual[n]=hash(Buffer.from(await b.arrayBuffer()));const expected=JSON.parse(fs.readFileSync(statePath)).modules;if(JSON.stringify(Object.entries(actual).sort())!==JSON.stringify(Object.entries(expected).sort()))throw Error('Routing Worker changed; review before updating');}
 if(!deploy){console.log('Verified original Manager sources and available route. Ready to deploy the HTML connection.');return;}
 const metadata={main_module:'entry.mjs',compatibility_date:'2026-09-21',bindings:[{name:'GAME',type:'service',service:'velmora-manager'}],annotations:{'workers/message':'Add achievement hooks to existing Manager HTML; original asset service retained'}};
 const form=new FormData();form.set('metadata',JSON.stringify(metadata));for(const[n,b]of Object.entries(modules))form.set(n,new Blob([b],{type:'application/javascript+module'}),n);
 const result=await api('/accounts/'+account+'/workers/scripts/'+name,{method:'PUT',body:form});
 fs.writeFileSync(statePath,JSON.stringify({worker:name,version:result.deployment_id,zone,pattern,modules:Object.fromEntries(Object.entries(modules).map(([n,b])=>[n,hash(b)]))},null,2));
 if(!old){const route=await api('/zones/'+zone+'/workers/routes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern,script:name})});fs.writeFileSync(path.join(work,'manager-achievement-route.json'),JSON.stringify(route,null,2));}
 console.log('Manager achievement route deployed; original game assets retained.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
