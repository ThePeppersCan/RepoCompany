/* Usage: node tools/deploy-game-achievements.cjs --work-dir <private capture folder> [--deploy]
 * First compares exact published sources and Worker modules with the captured release.
 * Uploads only tiny Worker wrappers. keep_assets retains the full live asset manifests;
 * keep_bindings retains existing secrets, D1, rate limits and Durable Objects.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),arg=process.argv.indexOf('--work-dir');
if(arg<0)throw Error('Provide --work-dir containing the original live captures.');
const work=path.resolve(process.argv[arg+1]),deploy=process.argv.includes('--deploy');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const token=process.env.CLOUDFLARE_API_TOKEN||fs.readFileSync(path.join(process.env.USERPROFILE,'.wrangler/config/default.toml'),'utf8').match(/oauth_token\s*=\s*"([^"]+)"/)[1];
const api='https://api.cloudflare.com/client/v4/accounts/a51cff0a015e6c78d886b2f0a92735cc';
const auth={Authorization:'Bearer '+token};
async function json(url,options={}){const r=await fetch(api+url,{...options,headers:{...auth,...options.headers}}),j=await r.json();if(!r.ok||!j.success)throw Error(JSON.stringify({status:r.status,errors:j.errors}));return j.result;}
async function modules(name){const r=await fetch(api+'/workers/scripts/'+name+'/content/v2',{headers:auth});if(!r.ok)throw Error(name+' content '+r.status);const bytes=Buffer.from(await r.arrayBuffer());if(!bytes.length)return {};const form=await new Response(bytes,{headers:{'Content-Type':r.headers.get('Content-Type')}}).formData(),out={};for(const [name,value]of form)out[name]=Buffer.from(await value.arrayBuffer());return out;}
(async()=>{
 const manifest=fs.readFileSync(path.join(root,'game-integrations/manifest.json'));
 const integration=fs.readFileSync(path.join(root,'tools/game-workers/integration.mjs'));
 const original=fs.readFileSync(path.join(work,'worker-original/cloudflare.js'));
 const plans=[{name:'moratales',original},{name:'velmora-manager'}];
 const statePath=path.join(work,'achievement-worker-release.json'),prior=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath)):{};
 // Guard against accidentally publishing an older version of any game.
 for(const [game,origin,files]of [
  ['moratales','https://moratales.repocompany.uk',['interface/town-cafe-day.js','interface/town-cafe-service.js','interface/town-kitchen.js','interface/town-roastery.js','interface/town-pleasure.js']],
  ['morogue','https://morogue.repocompany.uk',['interface/vampire-survivor/game.js','interface/vampire-survivor/builds.js']],
  ['manager','https://manager.repocompany.uk',['app.js','career-expansion.js','career-bootstrap.js','velmora-quidditch-engine.js']]
 ])for(const file of files){const r=await fetch(origin+'/'+file+'?achievement-source-check='+Date.now());if(!r.ok||hash(Buffer.from(await r.arrayBuffer()))!==hash(fs.readFileSync(path.join(work,'live',game,file))))throw Error('Live source changed; recapture and rebase '+game+'/'+file);}
 for(const plan of plans){
  const current=await modules(plan.name),fingerprint=Object.fromEntries(Object.entries(current).map(([n,b])=>[n,hash(b)]));
  const expected=prior[plan.name]?.modules||(plan.original?{'cloudflare.js':hash(plan.original)}:{});
  if(JSON.stringify(Object.entries(fingerprint).sort())!==JSON.stringify(Object.entries(expected).sort()))throw Error('Live Worker changed; review before updating '+plan.name);
  plan.settings=await json('/workers/scripts/'+plan.name+'/settings');
  plan.deployments=await json('/workers/scripts/'+plan.name+'/deployments');
  plan.modules={'achievement-entry.mjs':Buffer.from(`import {withAchievements} from './integration.mjs';\nimport manifest from './manifest.mjs';\n${plan.original?"import original from './cloudflare.js';\nexport {CafeRoom} from './cloudflare.js';":"const original={fetch:(request,env)=>env.ASSETS.fetch(request)};"}\nexport default {async fetch(request,env,ctx){return withAchievements(await original.fetch(request,env,ctx),request,manifest);}};\n`),'integration.mjs':integration,'manifest.mjs':Buffer.from('export default '+manifest.toString()+';'),...(plan.original?{'cloudflare.js':plan.original}:{})};
  for(const[label,value]of [['settings',plan.settings],['deployments',plan.deployments]]){const p=path.join(work,plan.name+'-pre-achievements-'+label+'.json');if(!fs.existsSync(p))fs.writeFileSync(p,JSON.stringify(value,null,2));}
  console.log('Verified live source and preserved bindings:',plan.name,plan.settings.bindings.map(x=>x.name).join(', '));
 }
 if(!deploy){console.log('Read-only release check passed. Add --deploy after the website and additive schema are live.');return;}
 for(const plan of plans){
  const s=plan.settings,metadata={main_module:'achievement-entry.mjs',compatibility_date:s.compatibility_date,compatibility_flags:s.compatibility_flags||[],keep_assets:true,assets:{config:{run_worker_first:true}},bindings:[{name:'ASSETS',type:'assets'}],keep_bindings:[...new Set(s.bindings.filter(b=>b.type!=='assets').map(b=>b.type))],...(s.observability?{observability:s.observability}:{}),annotations:{'workers/message':'Achievement gameplay observations; published game assets and saves preserved'}};
  const form=new FormData();form.set('metadata',JSON.stringify(metadata));for(const[name,body]of Object.entries(plan.modules))form.set(name,new Blob([body],{type:name.endsWith('.json')?'application/json':'application/javascript+module'}),name);
  const result=await json('/workers/scripts/'+plan.name,{method:'PUT',body:form});
  prior[plan.name]={deployedAt:new Date().toISOString(),version:result.version_id||result.deployment_id,modules:Object.fromEntries(Object.entries(plan.modules).map(([n,b])=>[n,hash(b)]))};fs.writeFileSync(statePath,JSON.stringify(prior,null,2));
  console.log('Achievement connection deployed:',plan.name,prior[plan.name].version||'published');
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
