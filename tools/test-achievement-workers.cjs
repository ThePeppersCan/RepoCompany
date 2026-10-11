const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
const root=path.resolve(__dirname,'..'),arg=process.argv.indexOf('--work-dir');if(arg<0)throw Error('--work-dir required');const work=path.resolve(process.argv[arg+1]);
(async()=>{
 const integration=fs.readFileSync(path.join(root,'tools/game-workers/integration.mjs'),'utf8').replace('export function','function');
 const manifest=fs.readFileSync(path.join(root,'game-integrations/manifest.json'),'utf8');
 for(const [game,host,patches]of [['moratales','moratales',5],['manager','manager',2],['morogue','morogue',2]]){
  const html=fs.readFileSync(path.join(work,'live',game,'index.html'),'utf8');
  const mf=new Miniflare(convertV4MiniflareOptions({workers:[{name:'achievement-test',modules:true,compatibilityDate:'2026-09-01',script:integration+`\nconst manifest=${manifest};export default{fetch(request){return withAchievements(new Response(${JSON.stringify(html)},{headers:{'Content-Type':'text/html'}}),request,manifest)}};`}]}));
  try{
   const response=await mf.dispatchFetch('https://'+host+'.repocompany.uk/'),out=await response.text();
   assert.equal(response.status,200);assert.equal(response.headers.get('x-repo-achievements'),'1');
   assert.equal((out.match(/data-bundled="true"/g)||[]).length,1,game+' gets exactly one client');
   assert.equal((out.match(/src="https:\/\/repocompany.uk\/game-integrations\//g)||[]).length,patches+1);
   const originalScripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/g)].map(m=>m[1]),newScripts=[...out.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>/g)].map(m=>m[1]);
   assert.equal(newScripts.length,originalScripts.length+1);assert.equal(originalScripts.filter(s=>!newScripts.includes(s)).length,patches);
   const runtime=out.match(/<script[^>]*achievement-runtime\.js[^>]*>/)[0];assert.equal(/\bdefer\b/.test(runtime),game==='morogue');
   const anchor=game==='moratales'?'town-explorer.js':game==='morogue'?'vampire-survivor/app.js':'career-bootstrap.js';assert(out.indexOf('achievement-runtime.js')<out.indexOf(anchor));
   fs.writeFileSync(path.join(work,game+'-release-preview.html'),out);
   console.log('PASS: '+game+' HTML preserved; exact patches, one runtime, correct loading order.');
  }finally{await mf.dispose();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
