'use strict';
// Real Electron portal/preload and built game, with isolated account services.
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
async function poll(fn,accept,timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){const value=await fn();if(accept(value))return value;await new Promise(r=>setTimeout(r,100));}throw Error('Launcher condition timed out');}
(async()=>{
 await fs.mkdir(path.join(root,'qa'),{recursive:true});
 const profile=await fs.mkdtemp(path.join(root,'qa/broomflight-')),env={...process.env,REPO_LAUNCHER_FIXTURES:'1',REPO_LAUNCHER_HIDDEN_TEST:'1',REPO_LAUNCHER_TEST_PROFILE:profile};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:require('electron'),args:[root],env});
 try{
  const shell=await app.firstWindow();await shell.waitForFunction(()=>window.repoLauncher);
  const portal=await poll(()=>app.context().pages().find(p=>p.url().startsWith('https://repocompany.uk/')),Boolean);
  const errors=[];portal.on('pageerror',e=>errors.push(e.message));
  await portal.locator('#sign-in').evaluate(n=>n.click());await shell.evaluate(()=>repoLauncher.refresh());
  await app.evaluate(({},root)=>{
   const services=globalThis.__repoLauncherTestServices,original=services.fetch;
   const path=process.getBuiltinModule('node:path'),fs=process.getBuiltinModule('node:fs');
   services.fetch=(input,init)=>{const request=input instanceof Request?input:new Request(input,init),url=new URL(request.url);
    if(url.origin==='https://repocompany.uk'&&url.pathname.startsWith('/broomflight/')){
     const base=path.resolve(root,'../dist'),file=path.resolve(base,'.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));
     if(!file.startsWith(base+path.sep)||!fs.existsSync(file))return new Response('Not found',{status:404});
     const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)];
     return new Response(fs.readFileSync(file),{headers:{'Content-Type':type||'application/octet-stream'}});
    }
    return original(input,init);
   };
  },root);
  await portal.evaluate(async()=>{
   const session=(await repoAccount.db.auth.getSession()).data.session;
   repoAccount.state={user:session.user};repoAccount.refresh=async()=>{};repoAccount.setGame=id=>{window.__activeGame=id;};
   window.repoPlaytime={game:'',start(id){this.game=id;},async stop(){this.game='';}};
   const dashboard=document.createElement('div');dashboard.id='dashboard';dashboard.innerHTML='<button data-audio aria-pressed="false">Audio</button>';document.body.append(dashboard);
  });
  for(const file of ['demo-library.css','dashboard-connected.css'])await portal.addStyleTag({path:path.resolve(root,'..',file)});
  for(const file of ['legacy-launcher.js','demo-library.js'])await portal.addScriptTag({path:path.resolve(root,'..',file)});
  assert.equal(await portal.evaluate(()=>document.documentElement.dataset.repoBroomflight),'true');
  assert.equal(await portal.evaluate(()=>demoLibrary.games.some(g=>g.id==='broomflight')),true);
  await portal.evaluate(()=>demoLibrary.open({gameId:'broomflight',route:false}));
  await portal.locator('#demo-launch').click();
  await poll(()=>shell.evaluate(()=>repoLauncher.getState()),s=>s.running.includes('broomflight'));
  await portal.waitForFunction(()=>repoPlaytime.game==='broomflight',null,{timeout:60000});
  const frame=portal.frames().find(f=>f.url().includes('/broomflight/'));assert(frame);
  await frame.waitForFunction(()=>window.__BROOMFLIGHT?.ready);
  assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1);
  await frame.evaluate(()=>{__BROOMFLIGHT.paused=true;__BROOMFLIGHT.start();__BROOMFLIGHT.step(240,false);});
  const state=await frame.evaluate(()=>__BROOMFLIGHT.state());assert.equal(state.phase,'racing');assert.equal(state.world.hazards.length,19);
  await frame.evaluate(()=>__BROOMFLIGHT.pause());assert.equal(await frame.evaluate(()=>__BROOMFLIGHT.state().phase),'paused');
  await portal.locator('[data-legacy-close]').click();
  await poll(()=>shell.evaluate(()=>repoLauncher.getState()),s=>!s.running.includes('broomflight'));
  assert.equal(await portal.evaluate(()=>repoPlaytime.game),'');
  assert.equal(portal.frames().some(f=>f.url().includes('/broomflight/')),false);
  // The collection can launch a fresh run after cleanup; losing the verified
  // account must remove the iframe and clear native running state as well.
  await portal.evaluate(()=>demoLibrary.open({gameId:'broomflight',route:false}));await portal.locator('#demo-launch').click();
  await portal.waitForFunction(()=>repoPlaytime.game==='broomflight',null,{timeout:60000});
  await portal.evaluate(()=>document.getElementById('sign-out').click());await shell.evaluate(()=>repoLauncher.refresh());
  await poll(()=>shell.evaluate(()=>repoLauncher.getState()),s=>!s.running.length);
  await portal.waitForFunction(()=>!document.getElementById('legacy-feature').open);
  assert.deepEqual(errors,[]);
  console.log('PASS: native collection launch, real WebGL race with 19 hazards, pause, one window, exit cleanup, relaunch and account-loss cleanup.');
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
