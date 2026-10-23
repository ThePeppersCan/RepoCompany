'use strict';
// Real installed payload and native views; only account/network services are fixtures.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {_electron:electron}=require('playwright');
const root=path.resolve(__dirname,'..'),release=path.resolve(process.argv[2]),executable=process.argv[3];
async function poll(fn,test,timeout=45000){const end=Date.now()+timeout;while(Date.now()<end){const v=await fn();if(test(v))return v;await new Promise(r=>setTimeout(r,150));}throw Error('Native COMP-RUN condition timed out');}
(async()=>{
 const qa=path.join(root,'qa');await fs.mkdir(qa,{recursive:true});const profile=await fs.mkdtemp(path.join(qa,'comp-run-'));
 await fs.writeFile(path.join(profile,'preferences.json'),JSON.stringify({version:1,automaticGameUpdates:false,discordPresence:false}));
 const env={...process.env,REPO_LAUNCHER_FIXTURES:'1',REPO_LAUNCHER_HIDDEN_TEST:'1',REPO_LAUNCHER_TEST_PROFILE:profile,REPO_LAUNCHER_TEST_COMP_RUN_RELEASE:release};delete env.ELECTRON_RUN_AS_NODE;
 const report={profile,release,install:'Actual Library.install from immutable local manifest',accountServices:'Isolated fixtures; no production requests',checks:[],errors:[]};let app;
 try{
  app=await electron.launch({executablePath:executable,args:[path.join(__dirname,'fixtures/presentation.cjs'),'--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-background-timer-throttling'],env,timeout:45000});
  app.context().on('page',p=>p.on('pageerror',e=>report.errors.push(e.message)));
  const shell=await app.firstWindow();await poll(()=>shell.evaluate(()=>window.repoLauncher?.getState()),s=>s?.catalog?.games.some(g=>g.id==='comp-run'));
  await app.evaluate(({BrowserWindow,dialog})=>{const host=BrowserWindow.getAllWindows()[0];host.isVisible=()=>true;host.isFocused=()=>true;dialog.showMessageBox=async()=>({response:1});});
  await poll(()=>app.evaluate(async({webContents})=>{const p=webContents.getAllWebContents().find(w=>w.getURL().startsWith('https://repocompany.uk/'));return p&&p.executeJavaScript('!!document.getElementById("sign-in")');}),Boolean);
  await app.evaluate(async({webContents})=>{const p=webContents.getAllWebContents().find(w=>w.getURL().startsWith('https://repocompany.uk/'));await p.executeJavaScript('document.getElementById("sign-in").click()');});await shell.evaluate(()=>window.repoLauncher.refresh());
  await shell.evaluate(()=>window.repoLauncher.install('comp-run'));await poll(()=>shell.evaluate(()=>window.repoLauncher.getState()),s=>s.library['comp-run']?.status==='installed',90000);report.checks.push('Downloaded and verified all manifest files through Library.install');
  const portal=app.context().pages().find(p=>p.url().startsWith('https://repocompany.uk/'));
  const portalCdp=await portal.context().newCDPSession(portal);portalCdp.on('Page.screencastFrame',f=>void portalCdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{}));await portalCdp.send('Page.startScreencast',{format:'jpeg',quality:20,maxWidth:640,maxHeight:360});
  await portal.waitForFunction(()=>window.dashboardAudio&&document.documentElement.dataset.repoPortalVisible==='true');
  await portal.evaluate(()=>accountMenu.close());
  await portal.locator('[data-audio]').click();await portal.locator('[data-audio]').click();
  await portal.waitForFunction(()=>__sounds.some(s=>s.sound==='music'&&!s.audio.paused&&s.audio.currentTime>0&&s.audio.volume>0));
  async function open(){await shell.evaluate(()=>window.repoLauncher.play('comp-run'));const game=await poll(()=>app.context().pages().find(p=>p.url().startsWith('https://comp-run.fluffy-star-4855.chatgpt.site/')),Boolean);const cdp=await game.context().newCDPSession(game);cdp.on('Page.screencastFrame',f=>void cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{}));await cdp.send('Page.startScreencast',{format:'jpeg',quality:20,maxWidth:640,maxHeight:360});await game.waitForFunction(()=>window.compRunReady,null,{timeout:60000});await game.locator('#skip-brand').click().catch(()=>{});await game.waitForFunction(()=>!document.body.classList.contains('booting'));await game.waitForFunction(()=>!!window.repoGameAchievements?.identity);return game;}
  let game=await open();assert.equal(await game.evaluate(()=>typeof window.REPO_LAUNCHER.requestSession),'undefined');assert.equal(await game.evaluate(()=>window.repoGameAchievements.identity),'11111111-2222-4333-8444-555555555555');report.checks.push('Real WebGL game, native identity and token-free account capability');
  const music=()=>portal.evaluate(()=>{const a=__sounds.find(s=>s.sound==='music').audio;return{paused:a.paused,volume:a.volume,hidden:document.hidden,portalVisible:document.documentElement.dataset.repoPortalVisible};});
  assert.deepEqual(await music(),{paused:true,volume:0,hidden:false,portalVisible:'false'});
  await portal.evaluate(()=>{dashboardAudio.reset();dashboardAudio.setMix('music',.8);});assert.equal((await music()).paused,true);
  report.checks.push('Real homepage music stops behind COMP-RUN while document.hidden stays false; audio settings cannot restart it');
  await game.locator('#open-settings').click();await game.locator('#volume').fill('37');await game.locator('#settings-done').click();await game.locator('#choose-run').click();await game.locator('[data-course="uncrowned"]').click();await game.locator('#start-run').click();await game.keyboard.press('Space');
  await game.waitForTimeout(2000);await game.keyboard.press('Escape');await game.locator('#pause').waitFor({state:'visible'});await game.screenshot({path:path.join(qa,'comp-run-pause.png')});report.checks.push('Opening skip, gameplay mouse capture and Escape pause');
  const rpc=await game.evaluate(()=>window.repoGameAchievements.request('run-start',{courseId:'uncrowned',mode:'normal',season:'uncrowned-3',version:'2.7.1'}));assert(rpc.run);report.checks.push('Native ranked request through the authenticated main process');
  await game.evaluate(()=>{void window.REPO_LAUNCHER.requestExit();});await poll(()=>shell.evaluate(()=>window.repoLauncher.getState()),s=>!s.running.includes('comp-run'));
  await poll(music,s=>!s.paused&&s.volume>0&&s.portalVisible==='true');report.checks.push('Music resumes on returning to collection');
  await portal.evaluate(()=>accountMenu.close());
  await portal.locator('[data-audio]').click();assert.equal((await music()).paused,true);
  game=await open();await game.locator('#open-settings').click();assert.equal(await game.locator('#volume').inputValue(),'37');await game.keyboard.press('Escape');report.checks.push('Settings survive return to library and reopening');
  await app.evaluate(()=>{globalThis.__repoLauncherTestServices.stats.offline=true;});await game.evaluate(()=>window.REPO_LAUNCHER.checkConnection());await game.locator('#repo-comp-run-gate').waitFor({state:'visible'});await app.evaluate(()=>{globalThis.__repoLauncherTestServices.stats.offline=false;});await game.locator('#repo-comp-run-gate [data-reconnect]').click();await game.locator('#repo-comp-run-gate').waitFor({state:'hidden'});report.checks.push('Disconnect gate and authenticated reconnect');
  await game.evaluate(()=>{void window.REPO_LAUNCHER.requestExit();});await poll(()=>shell.evaluate(()=>window.repoLauncher.getState()),s=>!s.running.includes('comp-run'));
  assert.equal((await music()).paused,true);assert.equal(await portal.evaluate(()=>dashboardAudio.preferences().muted),true);report.checks.push('Saved mute remains enabled after closing the game');
  await app.evaluate(async({webContents})=>{const id='66666666-2222-4333-8444-555555555555';globalThis.__repoLauncherTestServices.stats.compRunAccountId=id;const p=webContents.getAllWebContents().find(w=>w.getURL().startsWith('https://repocompany.uk/'));await p.executeJavaScript(`(()=>{const k='sb-hvdrwmjieguurxvrgzfu-auth-token',s=JSON.parse(localStorage.getItem(k));s.user.id='${id}';localStorage.setItem(k,JSON.stringify(s));})()`);});await shell.evaluate(()=>window.repoLauncher.refresh());
  game=await open();await game.locator('#open-settings').click();assert.equal(await game.locator('#volume').inputValue(),'65');report.checks.push('Second account receives separate default settings');
  assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify(report,null,2));
 }catch(e){report.error=e.stack;console.error(e);process.exitCode=1;}finally{if(app)await app.close();await fs.writeFile(path.join(qa,'comp-run-native-report.json'),JSON.stringify(report,null,2));}
})();
