'use strict';
const fs=require('node:fs'),fsp=fs.promises,path=require('node:path'),crypto=require('node:crypto');
const { _electron: electron }=require('playwright');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'qa/espresso-visibility');
const candidate=process.argv.includes('--candidate');
const release=process.argv.find((x,i)=>i>1&&!x.startsWith('--'))||path.join(root,'releases/morogue');
const installed=path.join(release,'payload');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const poll=async fn=>{for(let i=0;i<150;i++){if(await fn())return;await new Promise(r=>setTimeout(r,200));}throw Error('Timed out waiting for test launcher');};
(async()=>{
 await fsp.mkdir(qa,{recursive:true});const profile=await fsp.mkdtemp(path.join(qa,'profile-')),manifest=JSON.parse(await fsp.readFile(path.join(release,'manifest.json'))),installId=crypto.randomUUID(),dir=path.join(profile,'library/games/morogue'),payload=path.join(dir,'versions',installId);
 const report={version:manifest.version,errors:[],missing:[],corrupt:[],samples:[]};let app,game;
 for(const file of manifest.files){const source=path.join(release.includes('morogue-preview3')?installed:path.join(release,'payload'),file.path),bytes=await fsp.readFile(source);if(hash(bytes)!==file.sha256)report.corrupt.push(file.path);const target=path.join(payload,file.path);await fsp.mkdir(path.dirname(target),{recursive:true});
  if(candidate&&/^(?:interface\/vampire-survivor|game-integrations\/morogue)\//.test(file.path)&&['art.js','motion.js','cosmetics.js','cosmetic-art.js','app.js'].includes(path.basename(file.path)))await fsp.copyFile(path.join(root,'../game-integrations/morogue',path.basename(file.path)),target);else await fsp.link(source,target);
 }
 await fsp.writeFile(path.join(dir,'active.json'),JSON.stringify({schemaVersion:1,gameId:'morogue',version:manifest.version,entry:manifest.entry,installId}));
 await fsp.writeFile(path.join(profile,'preferences.json'),JSON.stringify({version:1,automaticGameUpdates:false,discordPresence:false}));
 const env={...process.env,NODE_PATH:process.env.NODE_PATH,REPO_LAUNCHER_FIXTURES:'1',REPO_LAUNCHER_TEST_PROFILE:profile,REPO_LAUNCHER_HIDDEN_TEST:'1',REPO_LAUNCHER_TEST_MOROGUE_RELEASE:release};delete env.ELECTRON_RUN_AS_NODE;
 try{
 app=await electron.launch({executablePath:require('electron'),args:[root,'--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-background-timer-throttling'],env,timeout:30000});
 app.on('window',p=>{p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.missing.push({url:r.url(),status:r.status()});});});
 const shell=await app.firstWindow();await poll(()=>shell.evaluate(()=>window.repoLauncher?.getState()).then(s=>s?.library.morogue?.status==='installed'));
 await poll(()=>app.evaluate(async({webContents})=>{const p=webContents.getAllWebContents().find(c=>c.getURL().startsWith('https://repocompany.uk/'));return p?await p.executeJavaScript('!!document.getElementById("sign-in")'):false;}));
 await app.evaluate(async({webContents})=>{const p=webContents.getAllWebContents().find(c=>c.getURL().startsWith('https://repocompany.uk/'));await p.executeJavaScript('document.getElementById("sign-in").click()');});await shell.evaluate(()=>window.repoLauncher.refresh());
 const next=app.waitForEvent('window');await shell.evaluate(()=>window.repoLauncher.play('morogue'));game=await next;game.setDefaultTimeout(25000);
 const cdp=await game.context().newCDPSession(game);cdp.on('Page.screencastFrame',f=>void cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{}));await cdp.send('Page.startScreencast',{format:'jpeg',quality:20,maxWidth:640,maxHeight:360,everyNthFrame:1});
 await game.getByRole('button',{name:'Play',exact:true}).click();await game.getByRole('button',{name:'Endless Night',exact:true}).click();await game.getByRole('button',{name:'Begin run',exact:true}).click();
 for(const seconds of [1,5,10]){await game.waitForFunction(t=>window.__moratalesSurvivor?.game?.state.runTime>=t,seconds,{timeout:90000});
  report.samples.push(await game.evaluate(()=>{const s=__moratalesSurvivor.game.state,c=document.getElementById('vs-world')||document.querySelector('canvas'),m=createCharacterModel(MORATALES_SURVIVOR_PACK),a=MORATALES_SURVIVOR_MOTION.create(m,MORATALES_SURVIVOR_PACK,m.initial,MORATALES_SURVIVOR_ART.makeCanvas),f=a.frame('front',-1,{kind:'run',phase:.2,body:true,gait:.3}),pixels=f.getContext('2d').getImageData(0,0,48,68).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])visible++;return{time:s.runTime,hp:s.player.hp,enemies:s.enemies.length,player:{x:s.player.x,y:s.player.y,view:s.player.view},canvas:c?.id,visibleRigPixels:visible,camera:__moratalesSurvivor.camera};}));
  const image=await app.evaluate(async({webContents})=>{const w=webContents.getAllWebContents().find(c=>c.getURL().startsWith('https://morogue.repocompany.uk/'));return(await w.capturePage(undefined,{stayHidden:true,stayAwake:true})).toPNG().toString('base64');});await fsp.writeFile(path.join(qa,'installed-'+seconds+'.png'),Buffer.from(image,'base64'));
 }
 for(const s of report.samples){if(s.camera.width<100||s.camera.height<100||s.camera.zoom<.1||s.visibleRigPixels<100)throw Error('Invalid embedded game camera or invisible character');}
 if(report.errors.length||report.missing.length||report.corrupt.length)throw Error('Installed game errors or content corruption');console.log(JSON.stringify(report));
 }catch(e){report.failure=e.message;console.error(e);process.exitCode=1;}
 finally{await fsp.writeFile(path.join(qa,'report.json'),JSON.stringify(report,null,2));await app?.evaluate(({app})=>app.exit(0)).catch(()=>{});await app?.close().catch(()=>{});}
})();
