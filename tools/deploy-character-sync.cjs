/* Deploy only the reviewed character bridge around a captured live Moratales
 * Worker. Never rebuild the game asset manifest or its multiplayer objects.
 * node tools/deploy-character-sync.cjs --capture-dir <capture> [--game-root <game>] [--deploy]
 * Defaults to the reviewed source snapshot committed with this release.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const arg=name=>{const i=process.argv.indexOf(name);if(i<0||!process.argv[i+1])throw Error('Required: '+name);return path.resolve(process.argv[i+1]);};
const capture=arg('--capture-dir'),root=path.resolve(__dirname,'..');
const game=process.argv.includes('--game-root')?arg('--game-root'):path.join(root,'game-integrations/moratales/character-sync-assets');
const hash=b=>crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
const token=process.env.CLOUDFLARE_API_TOKEN||fs.readFileSync(path.join(process.env.USERPROFILE,'.wrangler/config/default.toml'),'utf8').match(/oauth_token\s*=\s*"([^"]+)"/)[1];
const api='https://api.cloudflare.com/client/v4/accounts/a51cff0a015e6c78d886b2f0a92735cc/workers/scripts/moratales',auth={Authorization:'Bearer '+token};
async function get(suffix,options={}){const r=await fetch(api+suffix,{...options,headers:{...auth,...options.headers}});if(!r.ok)throw Error('Worker API failed: '+r.status);return r;}
(async()=>{
 const recordedHeaders=JSON.parse(fs.readFileSync(path.join(capture,'content-headers.json')));
 const recorded=await new Response(fs.readFileSync(path.join(capture,'content')),{headers:{'Content-Type':recordedHeaders['content-type']}}).formData();
 const live=await (await get('/content/v2')).formData(),modules={};
 for(const[name,file]of recorded){const current=live.get(name);if(!current||hash(await current.arrayBuffer())!==hash(await file.arrayBuffer()))throw Error('Live Worker changed: recapture before publishing.');modules[name]=Buffer.from(await file.arrayBuffer());}
 if([...live.keys()].length!==Object.keys(modules).length)throw Error('Live Worker module set changed.');
 const main=recordedHeaders['cf-entrypoint'];
 const wrapper="import previous from './achievement-entry.mjs';\nexport {CafeRoom} from './achievement-entry.mjs';\nimport assets from './character-assets.mjs';\nimport {characterAsset,withCharacterSync} from './character-sync.mjs';\nexport default{async fetch(request,env,ctx){return characterAsset(request,assets)||withCharacterSync(await previous.fetch(request,env,ctx),request);}};\n";
 if(main!=='achievement-entry.mjs' && !(main==='character-entry.mjs' && modules[main]?.toString()===wrapper))throw Error('Review the current Worker entry point before publishing.');
 const settings=(await (await get('/settings')).json()).result;
 const assets={};for(const file of ['interface/vampire-survivor/characters.js','interface/vampire-survivor/character-bridge.html','interface/vampire-survivor/character-bridge.js','interface/moratales-character-link.js','interface/moratales-character-status.js','interface/moratales-account-characters.js'])assets['/'+file]=fs.readFileSync(path.join(game,file),'utf8');
 modules['character-assets.mjs']=Buffer.from('export default '+JSON.stringify(assets)+';');
 modules['character-sync.mjs']=fs.readFileSync(path.join(root,'game-integrations/moratales/character-sync-worker.mjs'));
 modules['character-entry.mjs']=Buffer.from(wrapper);
 const manifest=Object.fromEntries(Object.entries(modules).map(([name,data])=>[name,hash(data)]));
 fs.writeFileSync(path.join(capture,'character-release-plan.json'),JSON.stringify({preserved:Object.keys(Object.fromEntries(recorded)),modules:manifest},null,2));
 console.log('Verified live Worker. Retaining all existing modules, game assets and bindings. Character assets: '+Object.keys(assets).length+'.');
 if(!process.argv.includes('--deploy'))return;
 const metadata={main_module:'character-entry.mjs',compatibility_date:settings.compatibility_date,compatibility_flags:settings.compatibility_flags||[],keep_assets:true,assets:{config:{run_worker_first:true,html_handling:'none'}},bindings:[{name:'ASSETS',type:'assets'}],keep_bindings:[...new Set(settings.bindings.filter(b=>b.type!=='assets').map(b=>b.type))],...(settings.observability?{observability:settings.observability}:{}),annotations:{'workers/message':'Connect Moratales character appearances to Repo accounts; game assets preserved'}};
 const form=new FormData();form.set('metadata',JSON.stringify(metadata));for(const[name,body]of Object.entries(modules))form.set(name,new Blob([body],{type:'application/javascript+module'}),name);
 const result=await (await get('',{method:'PUT',body:form})).json();if(!result.success)throw Error(JSON.stringify(result.errors));
 fs.writeFileSync(path.join(capture,'character-release-result.json'),JSON.stringify({version:result.result.version_id||result.result.deployment_id,modules:manifest},null,2));
 console.log('Character connection deployed:',result.result.version_id||result.result.deployment_id);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
