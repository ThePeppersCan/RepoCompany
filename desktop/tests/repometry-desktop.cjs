'use strict';
// Real Electron portal/preload and built game, with isolated account services.
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
async function poll(fn,accept,timeout=30000){const end=Date.now()+timeout;while(Date.now()<end){const value=await fn();if(accept(value))return value;await new Promise(r=>setTimeout(r,100));}throw Error('Launcher condition timed out');}
(async()=>{
 await fs.mkdir(path.join(root,'qa'),{recursive:true});
 const profile=await fs.mkdtemp(path.join(root,'qa/repometry-')),env={...process.env,REPO_LAUNCHER_FIXTURES:'1',REPO_LAUNCHER_HIDDEN_TEST:'1',REPO_LAUNCHER_TEST_PROFILE:profile};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:require('electron'),args:[root],env});
 try{
  const shell=await app.firstWindow();shell.setDefaultTimeout(25000);console.log('Shell ready');await shell.waitForFunction(()=>window.repoLauncher);
  const portal=await poll(()=>app.context().pages().find(p=>p.url().startsWith('https://repocompany.uk/')),Boolean);
  portal.setDefaultTimeout(25000);console.log('Portal ready');const errors=[];portal.on('pageerror',e=>errors.push(e.message));
  console.log('Signing in');await portal.locator('#sign-in').evaluate(n=>n.click());await shell.evaluate(()=>repoLauncher.refresh());
  await app.evaluate(({},root)=>{
   const services=globalThis.__repoLauncherTestServices,original=services.fetch;
   const path=process.getBuiltinModule('node:path'),fs=process.getBuiltinModule('node:fs');
   services.fetch=(input,init)=>{const request=input instanceof Request?input:new Request(input,init),url=new URL(request.url);
    if(url.origin==='https://deadbeat-nightmare-dash.fluffy-star-4855.chatgpt.site'){
     const base=path.resolve(root,'../../repometry/dist'),file=path.resolve(base,'.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));
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
  assert.equal(await portal.evaluate(()=>demoLibrary.games.some(g=>g.id==='deadbeat')),true);
  await portal.evaluate(()=>demoLibrary.open({gameId:'deadbeat',route:false}));
  console.log('Launching');await portal.locator('#demo-launch').click({force:true});
  await poll(()=>shell.evaluate(()=>repoLauncher.getState()),s=>s.running.includes('deadbeat'));
  await poll(()=>shell.evaluate(()=>repoLauncher.getState()),s=>s.running.includes('deadbeat'));
  console.log('Running',portal.frames().map(f=>f.url()));const frame=await poll(()=>portal.frames().find(f=>f.url().startsWith('https://deadbeat-nightmare-dash.fluffy-star-4855.chatgpt.site/')),Boolean);
  const cdp=await portal.context().newCDPSession(portal);cdp.on('Page.screencastFrame',f=>void cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{}));await cdp.send('Page.startScreencast',{format:'jpeg',quality:20,maxWidth:640,maxHeight:360});
  await frame.locator('#playBtn').waitFor({state:'visible',timeout:60000});
  assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1);
  await frame.locator('#playBtn').click();
  await frame.waitForFunction(()=>document.getElementById('app').classList.contains('playmode'));
  await frame.waitForTimeout(1800);
  await frame.locator('#pauseBtn').click();await frame.locator('#pauseDialog').waitFor({state:'visible'});
  await portal.screenshot({path:path.join(root,'qa/repometry-running.png')});
  await portal.locator('[data-legacy-close]').click();
  await poll(()=>shell.evaluate(()=>repoLauncher.getState()),s=>!s.running.includes('deadbeat'));
  assert.equal(await portal.evaluate(()=>repoPlaytime.game),'');
  assert.equal(portal.frames().some(f=>f.url().startsWith('https://deadbeat-nightmare-dash.fluffy-star-4855.chatgpt.site/')),false);
  // The collection can launch a fresh run after cleanup; losing the verified
  // account must remove the iframe and clear native running state as well.
  await portal.evaluate(()=>demoLibrary.open({gameId:'deadbeat',route:false}));await portal.locator('#demo-launch').click({force:true});
  await poll(()=>shell.evaluate(()=>repoLauncher.getState()),s=>s.running.includes('deadbeat'));
  await portal.evaluate(()=>document.getElementById('sign-out').click());await shell.evaluate(()=>repoLauncher.refresh());
  await poll(()=>shell.evaluate(()=>repoLauncher.getState()),s=>!s.running.length);
  await portal.waitForFunction(()=>!document.getElementById('legacy-feature').open);
  assert.deepEqual(errors,[]);
  console.log('PASS: native REPOMETRY collection launch, real rendered game and start, pause, one window, exit cleanup, relaunch and account-loss cleanup.');
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
