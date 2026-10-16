'use strict';
const {_electron}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const profile=await fs.mkdtemp(path.join(root,'qa/wibs-background-')),env={...process.env,REPO_LAUNCHER_FIXTURES:'1',REPO_LAUNCHER_HIDDEN_TEST:'1',REPO_LAUNCHER_TEST_PROFILE:profile};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:require('electron'),args:[root],env});
 try{
  const shell=await app.firstWindow();await shell.waitForFunction(()=>window.repoLauncher);
  let portal;for(let i=0;i<200;i++){portal=app.context().pages().find(p=>p.url().startsWith('https://repocompany.uk/'));if(portal)break;await new Promise(r=>setTimeout(r,50));}assert(portal);
  const errors=[];portal.on('pageerror',e=>errors.push(e.message));
  await portal.locator('#sign-in').evaluate(n=>n.click());await shell.evaluate(()=>repoLauncher.refresh());
  await portal.evaluate(async()=>{
   const session=(await repoAccount.db.auth.getSession()).data.session;
   repoAccount.state={user:session.user,social:{username:'alice',friends:[{username:'bob',display_name:'Bob',status:'accepted'}]}};repoAccount.refreshSocial=async()=>{};
   window.dashboardAudio={preferences:()=>({muted:window.__muted||false,effects:.5})};
   const anchor=document.createElement('div');anchor.className='account';anchor.innerHTML='<button data-note="Account">Account</button>';document.body.append(anchor);
   window.__dm=[];window.__groups=[];window.__polls=[];window.__sounds=[];window.__notices=[];
   addEventListener('repo-message-sound',e=>__sounds.push(e.detail));addEventListener('repo-message-notification',e=>__notices.push(e.detail));
   const fetchOriginal=window.fetch;
   window.fetch=async(url,options)=>{
    if(String(url).startsWith('/api/social/inbox')){__polls.push('dm');return Response.json({conversations:__dm,totalUnread:__dm.reduce((n,m)=>n+m.unread,0),iceConfigured:false});}
    if(url==='/api/community/inbox'){__polls.push('group');return Response.json({channels:[{id:'general',name:'general',readThrough:0,unread:__groups.length,lastMessage:__groups.at(-1)||null}],totalUnread:__groups.length});}
    return fetchOriginal(url,options);
   };
   // Simulate page timers being suspended. Native background wakeups must suffice.
   window.setInterval=()=>0;
  });
  for(const file of ['repo-chat-extras.js','repo-messaging.js','repo-community.js'])await portal.addScriptTag({path:path.resolve(root,'..',file)});
  await portal.waitForFunction(()=>__polls.includes('dm')&&__polls.includes('group'));
  await app.evaluate(({BrowserWindow})=>{const w=BrowserWindow.getAllWindows()[0];globalThis.__backgroundWindow=w;globalThis.__flashes=[];const flash=w.flashFrame.bind(w);w.flashFrame=v=>{__flashes.push(v);flash(v);};w.showInactive();});
  await new Promise(r=>setTimeout(r,300));await app.evaluate(()=>__backgroundWindow.minimize());await new Promise(r=>setTimeout(r,300));
  assert.equal(await app.evaluate(()=>__backgroundWindow.isMinimized()),true);
  await portal.waitForFunction(()=>document.documentElement.dataset.repoPortalVisible==='false');
  await portal.evaluate(()=>__dm.push({id:'conversation',username:'bob',unread:1,lastMessage:{id:1,sender:'bob',text:'Minimized direct message',createdAt:Date.now()}}));
  await shell.waitForFunction(async()=>(await repoLauncher.getState()).social.unread===1,{},{timeout:12000});
  let audio;for(let i=0;i<100;i++){audio=app.context().pages().find(p=>p.url()==='repo-launcher://app/notification-sound.html');if(audio)break;await new Promise(r=>setTimeout(r,50));}assert(audio);
  // The supplied notification is short; observe both an in-flight or completed playback.
  await audio.waitForFunction(()=>document.querySelector('audio').currentTime>0,{},{timeout:8000});
  assert.equal(await audio.locator('audio').evaluate(a=>a.volume),.12);assert.equal(await app.evaluate(()=>__backgroundWindow.isMinimized()),true);
  await audio.evaluate(()=>{window.__played=0;document.querySelector('audio').addEventListener('playing',()=>__played++);});
  await portal.evaluate(()=>__groups.push({id:1,sender:'bob',display:'Bob',text:'Minimized group message',createdAt:Date.now()}));
  await shell.waitForFunction(async()=>(await repoLauncher.getState()).social.unread===2,{},{timeout:12000});await audio.waitForFunction(()=>__played===1);
  assert.equal(await app.evaluate(()=>__backgroundWindow.isMinimized()),true);assert.deepEqual(await app.evaluate(()=>__flashes),[true]);
  assert.equal(await portal.evaluate(()=>__notices.length),2);assert.equal(await portal.locator('#repo-messages').isVisible(),false);
  await portal.evaluate(()=>{__muted=true;__groups.push({id:2,sender:'bob',display:'Bob',text:'Muted message',createdAt:Date.now()});});
  await shell.waitForFunction(async()=>(await repoLauncher.getState()).social.unread===3,{},{timeout:12000});assert.equal(await audio.evaluate(()=>__played),1);
  await portal.locator('#sign-out').evaluate(n=>n.click());await shell.evaluate(()=>repoLauncher.refresh());assert.equal(await audio.locator('audio').evaluate(a=>a.paused),true);
  assert.deepEqual(errors,[]);console.log('PASS: actual minimized Windows launcher receives DM and group messages with page timers disabled, advances real notification audio, updates taskbar counts without focus, and respects mute/sign-out.');
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
