const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const deps=path.join(process.env.COMP_RUN_TEST_DEPS||process.cwd(),'node_modules');
const {Miniflare,convertV4MiniflareOptions,Log,LogLevel}=require(deps+'/miniflare'),{chromium}=require(deps+'/playwright'),{build}=require(deps+'/esbuild');
const root=path.resolve(__dirname,'..'),pause=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const race=await build({entryPoints:[path.join(root,'workers/races/worker.mjs')],bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers']});
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ogg':'audio/ogg','.mp3':'audio/mpeg','.json':'application/json'};
 const mf=new Miniflare({...convertV4MiniflareOptions({workers:[
  {name:'driver',modules:true,compatibilityDate:'2026-10-13',serviceBindings:{RACE:'race',ASSETS:async req=>{try{const name=decodeURIComponent(new URL(req.url).pathname).slice(1)||'index.html',file=path.resolve(root,'game',name);if(!file.startsWith(path.join(root,'game')+path.sep))return new Response('No',{status:403});let data=await fs.readFile(file);if(name==='index.html')data=Buffer.from(data.toString().replace(/<script src="\.\/launcher\/achievement-runtime[^<]*<\/script>/,''));if(name==='main.js')data=Buffer.from(data.toString().replace(/const LOCAL_PREVIEW=.*?;/,'const LOCAL_PREVIEW=false;')+'\nwindow.__qa={get phase(){return phase},get opening(){return opening},get multiplayer(){return multiplayer},get player(){return motion}};');if(name==='airport-multiplayer.js')data=Buffer.from(data.toString().replace('function clearPeers(){','window.__networkSnapshot=()=>({airport,room,id,session:!!session,timelines:Array.from(timelines,([id,t])=>({id,last:t.lastArrival,now:performance.now()}))});window.__peerSnapshot=()=>Array.from(peers,([id,a])=>({id,visible:a.model.group.visible,parent:!!a.model.group.parent,position:a.model.group.position.toArray()}));function clearPeers(){'));return new Response(data,{headers:{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}});}catch{return new Response('Missing',{status:404});}}},script:`export default {async fetch(r,env){const u=new URL(r.url);if(u.pathname==='/ticket'){const identity=await r.json();return Response.json(await env.RACE.airportTicket(identity));}if(u.pathname.startsWith('/api/comp-run/races/')){const headers=new Headers(r.headers);headers.set('Origin','https://repocompany.uk');return env.RACE.fetch(new Request('https://repocompany.uk'+u.pathname,{headers}));}return env.ASSETS.fetch(r);}}`},
  {name:'race',modules:true,compatibilityDate:'2026-10-13',script:race.outputFiles[0].text,durableObjects:{RACE_ROOMS:{className:'RaceRoom',useSQLite:true},AIRPORT_DIRECTORY:{className:'AirportDirectory',useSQLite:true},AIRPORT_ROOMS:{className:'AirportRoom',useSQLite:true},VERIFIED_RACES:{className:'VerifiedRaceRoom',useSQLite:true}}}
 ]}),log:new Log(LogLevel.ERROR)});
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const errors=[];
 try{
  const origin=(await mf.ready).origin;console.log('QA origin',origin);
  async function page(user){const context=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});await context.addInitScript(({user,origin})=>{
   localStorage.setItem('comp-run.settings.v1',JSON.stringify({quality:'performance',motion:false,volume:0,musicVolume:0}));
   const OriginalWebSocket=window.WebSocket;window.__sockets=[];window.WebSocket=class extends OriginalWebSocket{constructor(url,...args){super(url.replace('wss://repocompany.uk/api/comp-run/races-v2271',origin.replace('http:','ws:')+'/api/comp-run/races'),...args);window.__sockets.push(this);}};
   window.repoGameAchievements={identity:{id:user},connect(){},airport:async opts=>{const r=await fetch('/ticket',{method:'POST',body:JSON.stringify({...opts,userId:user,name:user})});const data=await r.json();if(data.error)throw Error(data.error);return data;}};
  },{user,origin});console.log('Loading',user);const p=await context.newPage();p.on('pageerror',e=>{errors.push(user+': '+e.message);console.log('PAGE ERROR',e.message)});await p.goto(origin,{waitUntil:'domcontentloaded'});console.log('Document loaded',user);await p.waitForFunction(()=>window.__qa?.multiplayer,{timeout:60000});await p.evaluate(()=>document.querySelector('#skip-brand')?.click());return p;}
  const a=await page('Party Host'),b=await page('Party Guest');console.log('Both game renderers loaded');
  for(const p of[a,b]){await p.evaluate(()=>window.__qa.multiplayer.launch());await p.waitForFunction(()=>window.__qa.phase==='opening'&&window.__qa.multiplayer.joined,{timeout:60000});}
  await Promise.all([a,b].map(p=>p.waitForFunction(()=>window.__peerSnapshot?.().some(p=>p.visible&&p.parent),{timeout:30000})));console.log('PASS: both actual game clients render each other in the 3D lobby');
  await a.evaluate(()=>{const p=window.__qa.opening.session.player;p.yaw=-Math.PI/2;});await pause(700);
  await a.screenshot({path:path.join(__dirname,'party-lobby-visible.png')});
  await a.evaluate(()=>window.__qa.multiplayer.open());await a.locator('[data-action="invite-options"]').click();await a.locator('[data-ui="nearby"] button').click();await b.waitForFunction(()=>document.querySelector('[data-ui="invites"] button'));
  await b.evaluate(()=>window.__qa.multiplayer.open());await b.locator('[data-ui="invites"] button').first().click();await a.waitForFunction(()=>document.querySelector('[data-ui="members"]').children.length===2);
  await a.screenshot({path:path.join(__dirname,'party-roster.png')});
  const socketsBefore=await a.evaluate(()=>window.__sockets.filter(s=>s.url.includes('/airport/')).length);
  for(const p of[a,b])await p.locator('[data-action="ready"]').click();await a.locator('[data-action="depart"]').click();
  for(const p of[a,b])await p.waitForFunction(()=>window.__qa.phase==='playing',{timeout:60000});
  await a.evaluate(()=>window.__qa.multiplayer.open());await a.locator('[data-action="restart"]').click();
  await a.waitForFunction(()=>window.__sockets.filter(s=>s.url.includes('/flight/')).length===2,{timeout:30000});
  await a.waitForFunction(()=>window.__networkSnapshot().room?.state==='racing'&&window.__sockets.filter(s=>s.url.includes('/flight/')&&s.readyState===1).length===1&&!document.querySelector('#graphics-loading:not(.hidden)'),{timeout:60000});
  await a.evaluate(()=>window.__qa.multiplayer.open());await a.locator('[data-action="return"]').click();
  for(const p of[a,b])await p.waitForFunction(()=>window.__qa.phase==='opening',{timeout:60000});
  await Promise.all([a,b].map(p=>p.waitForFunction(()=>window.__peerSnapshot().some(p=>p.visible&&p.parent),{timeout:30000})));
  assert.equal(await a.evaluate(()=>window.__sockets.filter(s=>s.url.includes('/airport/')).length),socketsBefore);
  console.log('PASS: real UI invitation, ready-up, departure, group restart and return to the same rendered lobby without reconnecting');
  await a.evaluate(()=>window.__sockets.find(s=>s.url.includes('/airport/')&&s.readyState===1).close());
  await a.waitForFunction(()=>window.__sockets.filter(s=>s.url.includes('/airport/')).length===2,{timeout:20000});await a.waitForFunction(()=>!document.querySelector('.party-chip').textContent.includes('RECONNECTING'),{timeout:20000});
  assert.equal(await b.locator('[data-ui="members"] li').count(),2);console.log('PASS: browser automatically reconnects and retains both party members');
  for(const p of[a,b])await p.evaluate(()=>window.__qa.multiplayer.leave());assert.deepEqual(errors,[]);console.log('PASS: no browser runtime errors');
 }catch(e){console.log('BROWSER_ERRORS',errors);for(const ctx of browser.contexts())for(const p of ctx.pages()){console.log('STATE',await p.evaluate(()=>({net:window.__networkSnapshot?.(),peers:window.__peerSnapshot?.(),phase:window.__qa?.phase,player:window.__qa?.opening?.session.player,body:document.body.innerText.slice(-800)})));await p.screenshot({path:require('node:path').join(__dirname,'party-failure-'+browser.contexts().indexOf(ctx)+'.png')});}throw e;}finally{await browser.close();await mf.dispose();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
