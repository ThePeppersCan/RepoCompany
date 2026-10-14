'use strict';
// Live website, anonymous fresh profile: native account gates also protect
// device settings. Authenticated preference persistence is in login-desktop.cjs.
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {_electron}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
  const profile=await fs.mkdtemp(path.join(os.tmpdir(),'repo-settings-gate-'));
  const env={...process.env,REPO_LAUNCHER_TEST_PROFILE:profile,REPO_LAUNCHER_HIDDEN_TEST:'1'};
  delete env.ELECTRON_RUN_AS_NODE;delete env.REPO_LAUNCHER_FIXTURES;
  let app;
  try{
    for(const restarted of [false,true]){
      app=await _electron.launch({executablePath:require('electron'),args:[root,'--disable-renderer-backgrounding','--disable-background-timer-throttling'],env});
      const shell=await app.firstWindow();await shell.waitForFunction(async()=>window.repoLauncher&&(await repoLauncher.getState()).portalReady&&(await repoLauncher.getState()).account.status==='signed-out',null,{timeout:60000});
      assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].contentView.children[0].getVisible()),false);
      for(const action of ['navigate','setAutomaticGameUpdates','setDiscordPresence']){
        const error=await shell.evaluate(async action=>{try{await repoLauncher[action](action==='navigate'?'account':false);return 'bypassed';}catch(error){return error.message;}},action);
        assert.match(error,/sign in/i);
      }
      assert.deepEqual(await shell.evaluate(async()=>(await repoLauncher.getState()).preferences),{automaticGameUpdates:true,discordPresence:true});
      console.log('PASS live anonymous login and settings gate'+(restarted?' after restart':''));
      await app.close();app=null;
    }
  }finally{
    if(app)await app.close();const target=await fs.realpath(profile);
    assert.equal(path.dirname(target).toLowerCase(),(await fs.realpath(os.tmpdir())).toLowerCase());assert.ok(path.basename(target).startsWith('repo-settings-gate-'));
    await fs.rm(target,{recursive:true,force:true,maxRetries:5,retryDelay:200});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
