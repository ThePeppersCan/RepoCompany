'use strict';
// All accounts and requests are isolated fixtures. Never opens the user's profile.
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {_electron}=require('playwright');
const root=path.resolve(__dirname,'..');
async function run(){
  const output=path.resolve(process.env.REPO_LOGIN_QA_OUTPUT||path.join(root,'qa/login'));
  await fs.mkdir(output,{recursive:true});
  const profile=await fs.mkdtemp(path.join(os.tmpdir(),'repo-login-test-'));
  const env={...process.env,REPO_LAUNCHER_FIXTURES:'1',REPO_LAUNCHER_HIDDEN_TEST:'1',REPO_LAUNCHER_TEST_PROFILE:profile,REPO_LAUNCHER_FIXTURE_EXPIRY:String(Math.floor(Date.now()/1000)+36000)};delete env.ELECTRON_RUN_AS_NODE;
  let app;const report={checks:[]};
  async function start(){
    app=await _electron.launch({executablePath:require('electron'),args:[root,'--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--disable-background-timer-throttling'],env});
    const shell=await app.firstWindow();await shell.waitForFunction(()=>window.repoLauncher);
    const capture=await app.context().newCDPSession(shell);
    capture.on('Page.screencastFrame',frame=>void capture.send('Page.screencastFrameAck',{sessionId:frame.sessionId}).catch(()=>{}));
    await capture.send('Page.startScreencast',{format:'jpeg',quality:20,maxWidth:640,maxHeight:360});
    await shell.waitForFunction(async()=> (await repoLauncher.getState()).portalReady);
    return shell;
  }
  const portalEval=script=>app.evaluate(async({webContents},script)=>webContents.getAllWebContents().find(w=>w.getURL().startsWith('https://repocompany.uk/')).executeJavaScript(script),script);
  const hiddenPortal=()=>app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].contentView.children[0].getVisible()===false);
  try{
    let shell=await start();await shell.locator('#sign-in-form').waitFor({state:'visible'});
    assert.equal(await hiddenPortal(),true);await shell.keyboard.press('Escape');assert.equal(await hiddenPortal(),true);
    assert.match(await shell.evaluate(async()=>{try{await repoLauncher.navigate('home');return 'bypassed';}catch(e){return e.message;}}),/Sign in/);
    await shell.waitForTimeout(400);await shell.screenshot({path:path.join(output,'sign-in.png'),timeout:10000});
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1100,720));
    const bottom=await shell.locator('#sign-in-mode').evaluate(e=>e.getBoundingClientRect().bottom);assert.ok(bottom<720);
    await shell.screenshot({path:path.join(output,'sign-in-small.png'),timeout:10000});
    await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(1480,940));
    await shell.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await shell.locator('.motion-rest').getAttribute('opacity'),'1');
    assert.equal(await shell.locator('.motion-core').getAttribute('opacity'),'0');
    assert.equal(await shell.locator('.entry-atmosphere').evaluate(e=>getComputedStyle(e,'::before').animationName),'none');
    await shell.emulateMedia({reducedMotion:'no-preference'});
    await shell.locator('#sign-in-username').fill('LauncherTest');await shell.locator('#sign-in-password').fill('wrong-password');
    await shell.locator('#sign-in-submit').click();await shell.locator('#sign-in-error').waitFor({state:'visible'});
    assert.match(await shell.locator('#sign-in-error').innerText(),/Invalid login/);assert.equal(await hiddenPortal(),true);
    assert.equal(await shell.locator('#sign-in-password').inputValue(),'');
    report.checks.push('signed-out gate, Escape and native navigation cannot bypass; invalid credentials remain locked; reduced motion');
    // Hold the fixture response to inspect the real loading animation.
    await portalEval('window.originalSignIn=repoAccount.signIn;repoAccount.signIn=async(...args)=>{await new Promise(resolve=>window.finishLogin=resolve);return originalSignIn(...args)};true');
    await shell.locator('#sign-in-password').fill('fixture-password');await shell.locator('#sign-in-submit').click();
    await shell.waitForFunction(()=>document.querySelector('.website-fallback').dataset.phase==='signing-in');
    assert.equal(await hiddenPortal(),true);await shell.screenshot({path:path.join(output,'signing-in.png'),timeout:10000});
    await portalEval('finishLogin();true');await shell.waitForFunction(async()=> (await repoLauncher.getState()).account.status==='online' && !(await repoLauncher.getState()).signingIn);
    assert.equal(await hiddenPortal(),false);assert.equal(await shell.locator('#sign-in-password').inputValue(),'');
    report.checks.push('native sign-in uses existing website session; hides collection while verifying; clears password');
    await shell.evaluate(async()=>{await repoLauncher.setAutomaticGameUpdates(false);await repoLauncher.setDiscordPresence(false);});
    await app.close();app=null;shell=await start();await shell.waitForFunction(async()=> (await repoLauncher.getState()).account.status==='online');
    await shell.waitForTimeout(300);
    assert.equal(await hiddenPortal(),false);report.checks.push('verified remembered session opens collection without asking again');
    assert.deepEqual(await shell.evaluate(async()=> (await repoLauncher.getState()).preferences),{automaticGameUpdates:false,discordPresence:false});
    report.checks.push('authenticated update and Discord settings persist across restart');
    await app.evaluate(()=>{globalThis.__repoLauncherTestServices.stats.offline=true;});
    await shell.evaluate(()=>repoLauncher.refresh());assert.equal(await hiddenPortal(),true);
    await shell.locator('#connection-actions').waitFor({state:'visible'});
    await app.evaluate(()=>{globalThis.__repoLauncherTestServices.stats.offline=false;});
    await shell.locator('#reconnect').click();await shell.waitForFunction(async()=> (await repoLauncher.getState()).account.status==='online');assert.equal(await hiddenPortal(),false);
    await portalEval('document.querySelector("#sign-out").click();true');await shell.evaluate(()=>repoLauncher.refresh());
    await shell.locator('#sign-in-form').waitFor({state:'visible'});assert.equal(await hiddenPortal(),true);
    await shell.locator('#sign-in-mode').click();assert.equal(await shell.locator('#sign-in-submit').innerText(),'Create account');
    report.checks.push('connection loss locks collection, reconnect restores same account, sign-out immediately returns to login, create-account form available');
    await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  }finally{if(app)await app.close();const real=await fs.realpath(profile);assert.equal(path.dirname(real).toLowerCase(),(await fs.realpath(os.tmpdir())).toLowerCase());assert.ok(path.basename(real).startsWith('repo-login-test-'));await fs.rm(real,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
