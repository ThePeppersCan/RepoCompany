'use strict';
const {_electron}=require('playwright'),path=require('node:path'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {createFixture}=require('../../tools/messaging-test-server.cjs');
(async()=>{
 const fetch=global.fetch,f=await createFixture(),root=path.resolve(__dirname,'..'),profile=await fs.mkdtemp(path.join(root,'qa/activity-desktop-'));const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const app=await _electron.launch({executablePath:require('electron'),args:[path.join(__dirname,'fixtures/activity-window.cjs'),'--user-data-dir='+profile],env});
 try{
  await app.firstWindow();const alice=f.sessions.alice,bob=f.sessions.bob;
  const api=async(who,route,body)=>{const r=await fetch(f.base+'/api/community/'+route,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+who.access_token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert(r.ok);return r.json();};
  await api(alice,'state');await api(bob,'state');await api(alice,'activity-settings',{shareActivity:true,externalGames:true});
  await app.evaluate(async({BrowserWindow},{root,profile,base,identity,token})=>{
   globalThis.testActivity=new ExternalActivity({account:{identity,token,state:{status:'online'}},origin:base,fetchImpl:fetch,file:profile+'/registered-games.json'},{roots:async()=>[],catalogue:async()=>[]});
   await testActivity.register(activityExecutable,'Activity test game');await testActivity.pending;
   globalThis.testWindow=BrowserWindow.getAllWindows()[0];testWindow.showInactive();
  },{root,profile,base:f.base,identity:alice.user.id,token:alice.access_token});
  await new Promise(r=>setTimeout(r,300));await app.evaluate(()=>testWindow.minimize());await new Promise(r=>setTimeout(r,300));
  assert.equal(await app.evaluate(()=>testWindow.isMinimized()),true);
  await app.evaluate(()=>testActivity.tick());
  let p=await api(bob,'profile?username=alice');assert.equal(p.activity.title,'Activity test game');assert.match(p.activity.game,/^custom:/);
  assert.equal(await app.evaluate(()=>testWindow.isMinimized()),true,'detecting never restores the game');
  await new Promise(r=>setTimeout(r,1100));await app.evaluate(()=>testActivity.tick());p=await api(bob,'profile?username=alice');assert(p.recentActivity.playedMs>=1000);
  await api(alice,'activity-settings',{shareActivity:false,externalGames:true});await app.evaluate(()=>testActivity.tick());p=await api(bob,'profile?username=alice');assert.equal(p.activity,null);assert.equal(p.recentActivity,null);
  await app.evaluate(()=>testActivity.dispose());console.log('PASS: real Windows process detection while the game is minimized, native heartbeat through actual API/SQLite, recorded playtime and immediate sharing-off privacy.');
 }finally{await app.close();await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
