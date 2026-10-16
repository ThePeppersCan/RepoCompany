'use strict';
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
  const profile=await fs.mkdtemp(path.join(root,'qa/taskbar-')),env={...process.env,REPO_LAUNCHER_FIXTURES:'1',REPO_LAUNCHER_HIDDEN_TEST:'1',REPO_LAUNCHER_TEST_PROFILE:profile};delete env.ELECTRON_RUN_AS_NODE;
  const app=await _electron.launch({executablePath:require('electron'),args:[root],env});
  try {
    const shell=await app.firstWindow();await shell.waitForFunction(()=>window.repoLauncher);
    let portal;for(let i=0;i<200;i++){portal=app.context().pages().find(p=>p.url().startsWith('https://repocompany.uk/'));if(portal)break;await new Promise(r=>setTimeout(r,50));}assert(portal);
    await app.evaluate(({BrowserWindow})=>{
      const w=BrowserWindow.getAllWindows()[0];globalThis.__taskbar={window:w,overlays:[],flashes:[]};
      const overlay=w.setOverlayIcon.bind(w),flash=w.flashFrame.bind(w);
      w.setOverlayIcon=(image,description)=>{__taskbar.overlays.push({empty:image===null,description,size:image?.getSize(),scales:image?.getScaleFactors(),png:image?.toPNG().toString('base64')});return overlay(image,description);};
      w.flashFrame=value=>{__taskbar.flashes.push(value);return flash(value);};
    });
    // The website inbox can resolve before the main process verifies sign-in.
    await portal.evaluate(()=>{
      window.__social={unread:3,callActive:false,incomingCall:false,open:false};
      window.__announce=()=>dispatchEvent(new CustomEvent('repo-messaging-state',{detail:__social}));
      addEventListener('repo-messaging-request',__announce);__announce();
    });
    await portal.locator('#sign-in').evaluate(n=>n.click());await shell.evaluate(()=>repoLauncher.refresh());
    await shell.waitForFunction(async()=>(await repoLauncher.getState()).social.unread===3);
    await shell.getByRole('button',{name:'Wibs · 3 unread',exact:true}).waitFor();
    let data=await app.evaluate(()=>({overlays:__taskbar.overlays,flashes:__taskbar.flashes}));
    assert.match(data.overlays.at(-1).description,/3 unread/);assert.deepEqual(data.overlays.at(-1).size,{width:16,height:16});assert.deepEqual(data.overlays.at(-1).scales,[1,2]);assert.deepEqual(data.flashes,[]);
    await fs.writeFile(path.resolve(root,'../../../outputs/wibs-taskbar-3.png'),Buffer.from(data.overlays.at(-1).png,'base64'));
    await portal.evaluate(()=>{window.__message={id:1,username:'alice',name:'Alice',text:'Hello',volume:0};dispatchEvent(new CustomEvent('repo-message-notification',{detail:__message}));});
    await shell.waitForTimeout(100);data=await app.evaluate(()=>__taskbar.flashes);assert.deepEqual(data,[true]);
    await portal.evaluate(()=>dispatchEvent(new CustomEvent('repo-message-notification',{detail:__message})));await shell.waitForTimeout(100);assert.deepEqual(await app.evaluate(()=>__taskbar.flashes),[true]);
    await app.evaluate(()=>__taskbar.window.emit('focus'));assert.deepEqual(await app.evaluate(()=>__taskbar.flashes),[true,false]);assert.equal((await shell.evaluate(()=>repoLauncher.getState())).social.unread,3);
    await portal.evaluate(()=>{__social.unread=103;__announce();});await shell.getByRole('button',{name:'Wibs · 103 unread',exact:true}).waitFor();assert.equal(await shell.locator('.companion-unread').textContent(),'99+');
    await portal.evaluate(()=>{__social.unread=0;__announce();});await shell.waitForFunction(async()=>(await repoLauncher.getState()).social.unread===0);assert.equal(await app.evaluate(()=>__taskbar.overlays.at(-1).empty),true);
    await portal.evaluate(()=>{__social.unread=2;__announce();});await shell.getByRole('button',{name:'Wibs · 2 unread',exact:true}).waitFor();
    await portal.locator('#sign-out').evaluate(n=>n.click());await shell.evaluate(()=>repoLauncher.refresh());assert.equal(await app.evaluate(()=>__taskbar.overlays.at(-1).empty),true);
    console.log('PASS: real Windows overlay API, 16/32px artwork, isolated IPC, delayed sign-in replay, background flash/deduplication, focus/read distinction, count cap and sign-out cleanup.');
  } finally {await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
