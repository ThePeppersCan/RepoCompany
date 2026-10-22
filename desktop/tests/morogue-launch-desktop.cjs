'use strict';
// Install the selected immutable release through the real library, then launch
// its actual game inside the current client. Only account services are fixtures.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {_electron:electron}=require('playwright');
const root=path.resolve(__dirname,'..'),release=path.resolve(process.argv[2]);
async function poll(fn,accept,timeout=60000){const end=Date.now()+timeout;while(Date.now()<end){const v=await fn();if(accept(v))return v;await new Promise(r=>setTimeout(r,100));}throw Error('Installed Morogue condition timed out');}
async function consumeFrames(page){const cdp=await page.context().newCDPSession(page);cdp.on('Page.screencastFrame',f=>void cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{}));await cdp.send('Page.startScreencast',{format:'jpeg',quality:20,maxWidth:640,maxHeight:360});}
(async()=>{
 const qa=path.join(root,'qa');await fs.mkdir(qa,{recursive:true});const profile=await fs.mkdtemp(path.join(qa,'morogue-launch-'));
 const manifest=JSON.parse(await fs.readFile(path.join(release,'manifest.json'),'utf8'));
 await fs.writeFile(path.join(profile,'preferences.json'),JSON.stringify({version:1,automaticGameUpdates:false,discordPresence:false}));
 const env={...process.env,REPO_LAUNCHER_FIXTURES:'1',REPO_LAUNCHER_HIDDEN_TEST:'1',REPO_LAUNCHER_TEST_PROFILE:profile,REPO_LAUNCHER_TEST_MOROGUE_RELEASE:release};delete env.ELECTRON_RUN_AS_NODE;
 const report={version:manifest.version,files:manifest.files.length,profile,checks:[],errors:[],missing:[],remoteGameplay:[]};let app,game;
 try{
  app=await electron.launch({executablePath:require('electron'),args:[root,'--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-background-timer-throttling'],env,timeout:45000});
  const track=p=>{p.on('pageerror',e=>report.errors.push({page:p.url(),stack:e.stack}));p.on('response',r=>{if(r.status()>=400&&r.url().startsWith('https://morogue.repocompany.uk/'))report.missing.push({url:r.url(),status:r.status()});});p.on('request',r=>{if(r.url().startsWith('https://repocompany.uk/game-integrations/morogue/'))report.remoteGameplay.push(r.url());});};
  app.context().on('page',track);for(const page of app.context().pages())track(page);
  const shell=await app.firstWindow();await consumeFrames(shell);
  await poll(()=>shell.evaluate(()=>window.repoLauncher?.getState()),s=>s?.catalog?.games.some(g=>g.id==='morogue'));
  const portal=await poll(()=>app.context().pages().find(p=>p.url().startsWith('https://repocompany.uk/')),Boolean);
  await portal.locator('#sign-in').evaluate(button=>button.click());await shell.evaluate(()=>repoLauncher.refresh());
  console.log('Installing current Morogue through Library.install');
  await shell.evaluate(()=>repoLauncher.install('morogue'));
  const installed=await poll(()=>shell.evaluate(()=>repoLauncher.getState()),s=>s.library.morogue.status==='installed',120000);
  assert.equal(installed.library.morogue.version,manifest.version);report.checks.push('Actual library installs and verifies every release file');
  for(const difficulty of ['normal','insane']){
   console.log('Launching '+difficulty);
   await shell.evaluate(()=>repoLauncher.play('morogue'));
   game=await poll(()=>app.context().pages().find(p=>p.url().startsWith('https://morogue.repocompany.uk/')),Boolean);game.setDefaultTimeout(45000);await consumeFrames(game);
   await game.getByRole('button',{name:'Play',exact:true}).waitFor();
   await poll(()=>shell.evaluate(()=>repoLauncher.getState()),s=>s.activeGame?.id==='morogue'&&!s.activeGame.loading);
   assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().length),1);
   const hooks=await game.evaluate(()=>({node:typeof require,gate:!!window.MOROGUE_LAUNCHER,account:window.REPO_LAUNCHER_CONTEXT?.accountId,app:[...document.scripts].find(s=>s.src.includes('/relics-20261015/app.js'))?.src}));
   assert.equal(hooks.node,'undefined');assert.equal(hooks.gate,true);assert.equal(hooks.account,'11111111-2222-4333-8444-555555555555');assert.ok(hooks.app);
   const sounds=await game.evaluate(async()=>{
    if(!window.ROUGE_MORA_AUDIO)return null;
    return Promise.all(Object.values(ROUGE_MORA_AUDIO.SHOOTING_STAR_SOUNDS).map(async sound=>{const response=await fetch(sound.url);const bytes=await response.arrayBuffer();return {url:sound.url,status:response.status,bytes:bytes.byteLength,type:response.headers.get('content-type')};}));
   });
   assert.ok(sounds?.length);for(const sound of sounds){assert.equal(new URL(sound.url).origin,'https://morogue.repocompany.uk');assert.equal(sound.status,200);assert.equal(sound.type,'audio/wav');assert(sound.bytes>44);}
   await game.getByRole('button',{name:'Play',exact:true}).click();
   await game.getByRole('button',{name:'Endless Night',exact:true}).click();
   await game.getByRole('button',{name:difficulty==='insane'?'Insane':'Normal',exact:true}).click();
   await game.getByRole('button',{name:'Begin run',exact:true}).click();
   await game.waitForFunction(()=>window.__moratalesSurvivor?.game?.state.runTime>=2,null,{timeout:90000});
   assert.equal(await game.evaluate(()=>__moratalesSurvivor.game.state.difficulty),difficulty);
   await game.keyboard.press('Escape');await game.getByRole('button',{name:'End this run',exact:true}).waitFor();
   assert.equal(await game.evaluate(()=>__moratalesSurvivor.game.state.status),'paused');
   await game.screenshot({path:path.join(qa,'morogue-launch-'+difficulty+'.png')});
   await game.getByRole('button',{name:'End this run',exact:true}).click();await game.getByRole('button',{name:'End run',exact:true}).click();
   await game.getByText('Your leaderboard record is saved.',{exact:true}).waitFor();
   report.checks.push(difficulty+': embedded launch, authenticated shared character, actual combat, pause and saved result');
   await game.evaluate(()=>MOROGUE_LAUNCHER.requestExit());await poll(()=>shell.evaluate(()=>repoLauncher.getState()),s=>!s.running.length);game=null;
  }
  const stats=await app.evaluate(()=>({starts:__repoLauncherTestServices.stats.starts,finishes:__repoLauncherTestServices.stats.finishes}));
  assert.equal(stats.starts.length,2);assert.equal(stats.finishes.length,2);assert.equal(stats.starts[1].season,'first-light-insane-1');assert.notEqual(stats.starts[0].season,stats.starts[1].season);
  report.checks.push('Exit, relaunch and separate Insane run submission');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);assert.deepEqual(report.remoteGameplay,[]);
  report.passed=true;console.log(JSON.stringify(report,null,2));
 }catch(e){report.failure=e.stack;if(game)report.body=await game.locator('body').innerText().catch(()=>null);throw e;}
 finally{await fs.writeFile(path.join(qa,'morogue-launch-report.json'),JSON.stringify(report,null,2));await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});}
})().catch(e=>{console.error(e);process.exitCode=1});
