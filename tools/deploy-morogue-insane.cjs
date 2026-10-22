'use strict';
// Preserve the shared live Worker, changing only the reviewed Morogue hashes.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),directory=process.argv[2]&&path.resolve(process.argv[2]);
const files=['relics-20261015/app.js','relics-20261015/game.js','leaderboards.js'];
const {patchWorker,patchIntegration}=require('./morogue-insane-worker.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 if(!directory)throw Error('Pass a fresh capture directory and --capture, or a reviewed capture and --deploy.');
 const token=fs.readFileSync(path.join(process.env.USERPROFILE,'.wrangler/config/default.toml'),'utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];if(!token)throw Error('Cloudflare access unavailable');
 const api='https://api.cloudflare.com/client/v4/accounts/a51cff0a015e6c78d886b2f0a92735cc/workers/scripts/moratales';
 const request=async(suffix,options={})=>{const r=await fetch(api+suffix,{...options,headers:{Authorization:'Bearer '+token,...options.headers}});if(!r.ok)throw Error('Worker request '+r.status);return r;};
 if(process.argv.includes('--capture')){
  if(fs.existsSync(directory))throw Error('Capture directory already exists');fs.mkdirSync(directory,{recursive:true});
  for(const [name,suffix]of [['content','/content/v2'],['settings','/settings']]){const r=await request(suffix);fs.writeFileSync(path.join(directory,name),Buffer.from(await r.arrayBuffer()));fs.writeFileSync(path.join(directory,name+'-headers.json'),JSON.stringify(Object.fromEntries(r.headers)));}
  console.log('Fresh shared Worker captured for review.');return;
 }
 const headers=JSON.parse(fs.readFileSync(path.join(directory,'content-headers.json'))),recorded=await new Response(fs.readFileSync(path.join(directory,'content')),{headers:{'Content-Type':headers['content-type']}}).formData(),modules={};
 for(const[name,body]of recorded)modules[name]=Buffer.from(await body.arrayBuffer());
 const manifest=JSON.parse(modules['manifest.mjs'].toString().replace(/^export default\s*/,'').replace(/;\s*$/,''));
 const art=[];
 for(const file of [...files,...art]){const raw=fs.readFileSync(path.join(root,'game-integrations/morogue',file)),local=/\.(js|css)$/.test(file)?Buffer.from(raw.toString().replace(/\r\n/g,'\n')):raw,r=await fetch('https://repocompany.uk/game-integrations/morogue/'+file+'?verify='+Date.now());if(!r.ok)throw Error('Public asset unavailable: '+file);const bytes=Buffer.from(await r.arrayBuffer());if(hash(bytes)!==hash(local))throw Error('Public asset differs: '+file);if(files.includes(file))manifest.hashes['game-integrations/morogue/'+file]=hash(bytes).slice(0,12);}
 // Check the live module set and settings after public asset verification.
 const current=await(await request('/content/v2')).formData();
 for(const[name,body]of current){if(!modules[name]||hash(modules[name])!==hash(Buffer.from(await body.arrayBuffer())))throw Error('Worker changed; review a fresh capture.');}
 if([...current.keys()].length!==Object.keys(modules).length)throw Error('Worker module set changed.');
 const settings=(await(await request('/settings')).json()).result,recordedSettings=JSON.parse(fs.readFileSync(path.join(directory,'settings'))).result;
 if(JSON.stringify(settings)!==JSON.stringify(recordedSettings))throw Error('Worker settings changed; review a fresh capture.');
 modules['cloudflare.js']=Buffer.from(patchWorker(modules['cloudflare.js'].toString()));
 modules['integration.mjs']=Buffer.from(patchIntegration(modules['integration.mjs'].toString()));
 modules['manifest.mjs']=Buffer.from('export default '+JSON.stringify(manifest,null,2)+';');
 const plan={files,art,entry:headers['cf-entrypoint'],modules:Object.fromEntries(Object.entries(modules).map(([name,b])=>[name,hash(b)]))};fs.writeFileSync(path.join(directory,'insane-plan.json'),JSON.stringify(plan,null,2));
 console.log('Verified three published Morogue scripts; scoped leaderboard and integration changes; other game routes preserved.');if(!process.argv.includes('--deploy'))return;
 const metadata={main_module:plan.entry,compatibility_date:settings.compatibility_date,compatibility_flags:settings.compatibility_flags||[],keep_assets:true,assets:{config:{run_worker_first:true,html_handling:'none'}},bindings:[{name:'ASSETS',type:'assets'}],keep_bindings:[...new Set(settings.bindings.filter(b=>b.type!=='assets').map(b=>b.type))],...(settings.observability?{observability:settings.observability}:{}),annotations:{'workers/message':'Morogue Insane: immediate selection, fair boss pacing, separate difficulty records'}};
 const form=new FormData();form.set('metadata',JSON.stringify(metadata));for(const[name,b]of Object.entries(modules))form.set(name,new Blob([b],{type:'application/javascript+module'}),name);
 const result=await(await request('',{method:'PUT',body:form})).json();if(!result.success)throw Error(JSON.stringify(result.errors));fs.writeFileSync(path.join(directory,'insane-result.json'),JSON.stringify({version:result.result.version_id||result.result.deployment_id,...plan},null,2));console.log('Published Insane integration:',result.result.version_id||result.result.deployment_id);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
