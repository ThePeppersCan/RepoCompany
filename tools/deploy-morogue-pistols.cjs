'use strict';
// Update the reviewed animation scripts, retaining all other live Worker modules,
// asset bindings and game state. Public files must already match the release.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),capture=path.resolve(process.argv[2]||'');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=['art.js','app.js','motion.js','cosmetics.js','cosmetic-art.js'];
(async()=>{
 if(!process.argv[2])throw Error('Pass a fresh Worker capture directory.');
 const token=fs.readFileSync(path.join(process.env.USERPROFILE,'.wrangler/config/default.toml'),'utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];if(!token)throw Error('Cloudflare access unavailable');
 const api='https://api.cloudflare.com/client/v4/accounts/a51cff0a015e6c78d886b2f0a92735cc/workers/scripts/moratales';
 const request=async(suffix,options={})=>{const r=await fetch(api+suffix,{...options,headers:{Authorization:'Bearer '+token,...options.headers}});if(!r.ok)throw Error('Worker request '+r.status);return r;};
 const headers=JSON.parse(fs.readFileSync(path.join(capture,'content-headers.json'))),recorded=await new Response(fs.readFileSync(path.join(capture,'content')),{headers:{'Content-Type':headers['content-type']}}).formData(),current=await(await request('/content/v2')).formData(),modules={};
 for(const[name,body]of recorded){const live=current.get(name),bytes=Buffer.from(await body.arrayBuffer());if(!live||hash(bytes)!==hash(Buffer.from(await live.arrayBuffer())))throw Error('Worker changed; review a fresh capture.');modules[name]=bytes;}
 if([...current.keys()].length!==Object.keys(modules).length)throw Error('Worker module set changed.');
 const manifest=JSON.parse(modules['manifest.mjs'].toString().replace(/^export default\s*/,'').replace(/;\s*$/,''));
 for(const file of files){const local=fs.readFileSync(path.join(root,'game-integrations/morogue',file),'utf8').replace(/\r\n/g,'\n'),url='https://repocompany.uk/game-integrations/morogue/'+file,r=await fetch(url+'?verify='+Date.now());if(!r.ok)throw Error('Published asset unavailable: '+file);const bytes=Buffer.from(await r.arrayBuffer());if(hash(bytes)!==hash(local))throw Error('Published asset differs: '+file);manifest.hashes['game-integrations/morogue/'+file]=hash(bytes).slice(0,12);}
 let integration=modules['integration.mjs'].toString();
 for(const file of ['motion.js','cosmetic-art.js','cosmetics.js']){const line=`  '/interface/vampire-survivor/${file}':['morogue','${file}'],`;if(!integration.includes(line)){const anchor="  '/interface/vampire-survivor/art.js':['morogue','art.js'],";if(!integration.includes(anchor))throw Error('Unexpected integration format');integration=integration.replace(anchor,anchor+'\n'+line);}}
 modules['integration.mjs']=Buffer.from(integration);modules['manifest.mjs']=Buffer.from('export default '+JSON.stringify(manifest,null,2)+';');
 const plan={files,entry:headers['cf-entrypoint'],modules:Object.fromEntries(Object.entries(modules).map(([name,b])=>[name,hash(b)]))};fs.writeFileSync(path.join(capture,'pistols-plan.json'),JSON.stringify(plan,null,2));
 console.log('Public assets verified; five animation/UI scripts reviewed. All other modules retained.');if(!process.argv.includes('--deploy'))return;
 const settings=(await(await request('/settings')).json()).result;
 const metadata={main_module:plan.entry,compatibility_date:settings.compatibility_date,compatibility_flags:settings.compatibility_flags||[],keep_assets:true,assets:{config:{run_worker_first:true,html_handling:'none'}},bindings:[{name:'ASSETS',type:'assets'}],keep_bindings:[...new Set(settings.bindings.filter(b=>b.type!=='assets').map(b=>b.type))],...(settings.observability?{observability:settings.observability}:{}),annotations:{'workers/message':'Dual espresso pistols and embedded viewport visibility fix'}};
 const form=new FormData();form.set('metadata',JSON.stringify(metadata));for(const[name,b]of Object.entries(modules))form.set(name,new Blob([b],{type:'application/javascript+module'}),name);
 const result=await(await request('',{method:'PUT',body:form})).json();if(!result.success)throw Error(JSON.stringify(result.errors));fs.writeFileSync(path.join(capture,'pistols-result.json'),JSON.stringify({version:result.result.version_id||result.result.deployment_id,...plan},null,2));console.log('Published Morogue animation integration:',result.result.version_id||result.result.deployment_id);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
