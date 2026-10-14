'use strict';
// Real downloaded game with isolated account services. Practice writes no run
// results; this checks the content users reported missing, not just startup.
const path=require('node:path'),fs=require('node:fs/promises'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {_electron:electron}=require('playwright');
const {validateManifest,validatePath}=require('../lib/manifest.cjs');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'qa');
const release=path.resolve(process.argv[2]||path.join(root,'releases/morogue'));
async function hash(file){const digest=crypto.createHash('sha256');for await(const chunk of require('node:fs').createReadStream(file))digest.update(chunk);return digest.digest('hex');}
async function poll(fn,accept,ms=60000){const until=Date.now()+ms;while(Date.now()<until){const value=await fn();if(accept(value))return value;await new Promise(r=>setTimeout(r,100));}throw Error('Installed content condition timed out.');}
(async()=>{
 await fs.mkdir(qa,{recursive:true});const profile=await fs.mkdtemp(path.join(qa,'morogue-content-'));
 const raw=JSON.parse(await fs.readFile(path.join(release,'manifest.json'),'utf8'));
 validateManifest(raw,{id:'morogue',entry:'interface/vampire-survivor/index.html'},{developmentRoot:path.join(release,'payload')});
 const installId=crypto.randomUUID(),directory=path.join(profile,'library/games/morogue'),version=path.join(directory,'versions',installId);
 for(const file of raw.files){validatePath(file.path);const source=path.join(release,'payload',file.path),target=path.join(version,file.path);assert.equal(await hash(source),file.sha256,file.path);await fs.mkdir(path.dirname(target),{recursive:true});await fs.link(source,target);}
 await fs.writeFile(path.join(directory,'active.json'),JSON.stringify({schemaVersion:1,gameId:'morogue',version:raw.version,entry:raw.entry,installId}));
 await fs.writeFile(path.join(profile,'preferences.json'),JSON.stringify({version:1,automaticGameUpdates:false,discordPresence:false}));
 const env={...process.env,REPO_LAUNCHER_FIXTURES:'1',REPO_LAUNCHER_TEST_PROFILE:profile,REPO_LAUNCHER_HIDDEN_TEST:'1'};delete env.ELECTRON_RUN_AS_NODE;
 const result={version:raw.version,files:raw.files.length,errors:[],missing:[],remoteGameplay:[]};let app,game;
 try{
  app=await electron.launch({executablePath:require('electron'),args:[root,'--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-background-timer-throttling'],env,timeout:30000});
  app.on('window',page=>{page.on('pageerror',e=>result.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)result.missing.push({url:r.url(),status:r.status()});});page.on('request',r=>{if(r.url().startsWith('https://repocompany.uk/game-integrations/morogue/'))result.remoteGameplay.push(r.url());});});
  const shell=await app.firstWindow();await poll(()=>shell.evaluate(()=>window.repoLauncher?.getState()),s=>s?.library.morogue?.status==='installed');
  await poll(()=>app.evaluate(async({webContents})=>{const p=webContents.getAllWebContents().find(c=>!c.isDestroyed()&&c.getURL().startsWith('https://repocompany.uk/'));return p?await p.executeJavaScript('!!document.getElementById("sign-in")'):false;}),Boolean);
  await app.evaluate(async({webContents})=>{const p=webContents.getAllWebContents().find(c=>!c.isDestroyed()&&c.getURL().startsWith('https://repocompany.uk/'));await p.executeJavaScript('document.getElementById("sign-in").click()');});
  await shell.evaluate(()=>window.repoLauncher.refresh());
  const next=app.waitForEvent('window');await shell.evaluate(()=>window.repoLauncher.play('morogue'));game=await next;game.setDefaultTimeout(30000);
  // Continuously consume compositor frames in this hidden QA window. The game
  // keeps its real clock and inputs; no simulation state is advanced by the test.
  const video=await game.context().newCDPSession(game);
  video.on('Page.screencastFrame',frame=>void video.send('Page.screencastFrameAck',{sessionId:frame.sessionId}).catch(()=>{}));
  await video.send('Page.startScreencast',{format:'jpeg',quality:20,maxWidth:640,maxHeight:360,everyNthFrame:1});
  await game.getByRole('button',{name:'Boss practice',exact:true}).waitFor();
  result.modules=await game.evaluate(()=>({oracle:!!window.MOROGUE_ORACLE_MOTION,grove:!!window.MOROGUE_GROVE_RIG,outcome:!!window.MOROGUE_OUTCOME,character:window.__moratalesSurvivor?.character?.name}));
  assert.equal(result.modules.oracle,true);assert.equal(result.modules.grove,true);assert.equal(result.modules.outcome,true);
  await game.getByRole('button',{name:'Boss practice',exact:true}).click();
  await game.getByRole('button',{name:'Great adversaries',exact:true}).click();
  await game.locator('[data-practice-boss="oracle"]').click();
  result.practiceMenu=await game.locator('body').innerText();assert.match(result.practiceMenu,/Salt Oracle/);
  await fs.writeFile(path.join(qa,'morogue-oracle-menu.txt'),result.practiceMenu);
  const buttons=await game.getByRole('button').allTextContents();result.buttons=buttons;
  // Use the actual practice controls rather than relying on the account's
  // previous weapon selection or the last vaguely matching button on the page.
  await game.getByLabel('Practice weapon',{exact:true}).selectOption('espresso');
  await game.getByLabel('Practice starting phase',{exact:true}).selectOption('1');
  const bossName=(await game.locator('[data-practice-boss="oracle"]').innerText()).trim();
  await game.locator('.mr-practice-form').getByRole('button',{name:'Practice '+bossName,exact:true}).click();
  await game.waitForFunction(()=>window.__moratalesSurvivor?.game?.state?.boss?.bossType==='oracle',null,{timeout:30000});
  await game.waitForFunction(()=>window.__moratalesSurvivor?.game?.state?.time>2,null,{timeout:180000});
  await game.keyboard.press('j');await game.waitForTimeout(350);await game.keyboard.press('j');await game.waitForTimeout(350);await game.keyboard.press('j');await game.waitForTimeout(700);
  result.encounter=await game.evaluate(()=>{const s=window.__moratalesSurvivor.game.state;return {boss:s.boss.bossName,id:s.boss.bossType,phase:s.boss.phase,practice:s.practice,weapon:s.mainWeapon,time:s.time,rig:!!s.boss.oracleRig};});
  assert.equal(result.encounter.id,'oracle');assert.equal(result.encounter.rig,true);assert.equal(result.encounter.weapon,'espresso');
  try{await game.screenshot({path:path.join(qa,'morogue-oracle-installed.png'),timeout:8000});}catch(e){result.captureWarning=e.message;}
  result.services=await app.evaluate(()=>({starts:globalThis.__repoLauncherTestServices.stats.starts.length,finishes:globalThis.__repoLauncherTestServices.stats.finishes.length}));
  assert.deepEqual(result.services,{starts:0,finishes:0});assert.deepEqual(result.errors,[]);assert.deepEqual(result.missing,[]);assert.deepEqual(result.remoteGameplay,[]);
  result.passed=true;console.log(JSON.stringify({passed:true,version:raw.version,modules:result.modules,encounter:result.encounter,services:result.services}));
 }catch(error){result.failure=error.message;if(game){result.diagnostics=await game.evaluate(()=>{const s=window.__moratalesSurvivor?.game?.state;return {hidden:document.hidden,visibility:document.visibilityState,focus:document.hasFocus(),gate:window.MOROGUE_LAUNCHER?.state,status:s?.status,time:s?.time,runTime:s?.runTime,actualTime:s?.actualTime,boss:s?.boss?.bossType,transition:s?.transition,ready:s?.transition&&window.ROUGE_MORA_WORLD_ART.ready(s.transition.to),map:s?.transition&&(()=>{const i=window.ROUGE_MORA_WORLD_ART.getMap(s.transition.to);return i&&{src:i.src,complete:i.complete,width:i.naturalWidth,failed:i.failed};})(),keys:s&&Object.keys(s)};}).catch(()=>null);await fs.writeFile(path.join(qa,'morogue-content-failure.txt'),await game.locator('body').innerText().catch(()=>''));}throw error;}
 finally{await fs.writeFile(path.join(qa,'morogue-content-desktop.json'),JSON.stringify(result,null,2));await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});}
})().catch(e=>{console.error(e);process.exitCode=1;});
