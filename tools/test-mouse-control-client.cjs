const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises'),{chromium,_electron}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs'),{localSFU}=require('./local-sfu.cjs');
(async()=>{
 const f=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture',SCREEN_ENABLED:'true'}}),browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']}),relay=await localSFU(browser),errors=[];let app;
 f.voiceHub.sfu=relay.request;
 try{
  const profile=await fs.mkdtemp(path.resolve(__dirname,'../desktop/qa/screen-test-')),env={...process.env,SCREEN_TEST_BASE:f.base,SCREEN_TEST_PROFILE:profile,SCREEN_TEST_LOGIN:JSON.stringify(f.sessions.alice)};delete env.ELECTRON_RUN_AS_NODE;
  app=await _electron.launch({executablePath:require('../desktop/node_modules/electron'),args:[path.resolve(__dirname,'../desktop/tests/mouse-control-fixture.cjs')],env});
  const native=app.windows().find(p=>p.url()==='https://repocompany.uk/')||await app.waitForEvent('window',{predicate:p=>p.url().startsWith('https://repocompany.uk/')&&!p.url().includes('/test-pattern')});await native.emulateMedia({reducedMotion:'reduce'});await native.waitForFunction(()=>window.repoVoice?.getState().enabled);
  const context=await f.browserContext(browser,'bob'),web=await context.newPage();await web.goto(f.base);await web.waitForFunction(()=>repoVoice?.getState().enabled);
  native.setDefaultTimeout(10000);web.setDefaultTimeout(10000);
  for(const p of [native,web]){p.on('pageerror',e=>{errors.push(e.message);});await p.evaluate(()=>repoMessaging.open());await p.getByRole('button',{name:'Join RE-COMP voice',exact:true}).click();await p.waitForFunction(()=>repoVoice.getState().callStatus==='active',null,{timeout:35000});}
  await native.getByRole('button',{name:'Share screen',exact:true}).click();let picker=await app.waitForEvent('window',{predicate:p=>p.url().includes('screen-picker.html')});await picker.getByRole('button',{name:'Cancel',exact:true}).click();await native.getByRole('button',{name:'Share screen',exact:true}).waitFor();assert(await native.evaluate(()=>repoVoice.getState().callStatus==='active'));
  await native.getByRole('button',{name:'Share screen',exact:true}).click();picker=await app.waitForEvent('window',{predicate:p=>p.url().includes('screen-picker.html')});await picker.getByRole('button',{name:'Share Wibs test pattern',exact:true}).click();
  const bob=native.locator('.repo-call-stage-person[data-voice-name="bob"]');
  await native.getByRole('button',{name:'Stop sharing',exact:true}).waitFor();
  const peopleMenu=native.getByRole('menu',{name:'Player actions',exact:true});
  await web.waitForFunction(()=>{const v=document.querySelector('.repo-screen-viewer video');return v?.videoWidth>0&&v.currentTime>.3;},null,{timeout:30000});
  await native.getByRole('button',{name:'Full screen',exact:true}).click();
  await native.waitForFunction(()=>!!document.fullscreenElement,null,{timeout:5000});
  assert(await native.getByRole('button',{name:'Exit full screen',exact:true}).isVisible());
  await native.getByRole('button',{name:'Exit full screen',exact:true}).click();
  await native.waitForFunction(()=>!document.fullscreenElement&&!document.querySelector('.repo-screen-window'));
  console.log('PASS: native full screen entered and exit clicked.');
  const take=async()=>{const prompt=web.getByRole('dialog',{name:'Take control',exact:true});await prompt.waitFor({timeout:35000});await prompt.getByRole('button',{name:'Take control',exact:true}).click({timeout:35000});};
  await native.waitForFunction(()=>!document.querySelector('[data-mouse-give]').disabled);
  await native.getByRole('button',{name:'Give control',exact:true}).click();
  await take();await web.getByText('You have control',{exact:false}).waitFor({timeout:35000});
  await native.screenshot({path:path.resolve(__dirname,'../desktop/qa/mouse-control-host.png')});await web.screenshot({path:path.resolve(__dirname,'../desktop/qa/mouse-control-viewer.png')});
  if(process.env.WIBS_REAL_INPUT_TEST==='1')await app.evaluate(()=>{global.screenTest.source.show();global.screenTest.source.focus();});
  const video=web.locator('.repo-screen-viewer video');await video.click();await web.keyboard.type('Wibs');await web.keyboard.press('Control+a');await web.keyboard.press('Tab');assert(await video.evaluate(v=>document.activeElement===v),'remote Tab must not leave the viewer');await video.hover();await web.mouse.wheel(0,120);
  await new Promise(r=>setTimeout(r,700));
  let writes=await app.evaluate(()=>global.screenTest.writes);console.log('Native input count',writes.length);assert(writes.some(s=>/^mouse \d+ \d+ 1 /.test(s)),'native bridge received left down');assert(writes.some(s=>/^mouse \d+ \d+ 0 /.test(s)),'native bridge received left up');assert(writes.some(s=>s.startsWith('mouse ')&&s.trim().endsWith('-120')),'native bridge received scrolling');
  assert(writes.includes('text 87\n')&&writes.includes('text 105\n'),'native bridge received typed text');assert(writes.includes('key 162 1\n')&&writes.includes('key 162 0\n'),'native bridge received Ctrl shortcut and release');assert(writes.includes('key 9 1\n'),'native bridge received Tab');
  if(process.env.WIBS_REAL_INPUT_TEST==='1'){
   const received=await app.evaluate(()=>global.screenTest.source.webContents.executeJavaScript('JSON.stringify(inputEvents)'));
   console.log('REAL INPUT',received,await app.evaluate(({screen})=>({cursor:screen.getCursorScreenPoint(),bounds:global.screenTest.source.getContentBounds(),focused:global.screenTest.source.isFocused(),events:global.screenTest.events.filter(e=>e.helper||e.helperError||e.helperExit!==undefined),writes:global.screenTest.writes.slice(0,18)})));
   const input=JSON.parse(received);assert(input.some(e=>e.type==='pointerdown'),'Windows delivered the remote click');assert(input.some(e=>e.type==='input'&&e.text.includes('Wibs')),'Windows delivered remote typing');assert(input.some(e=>e.type==='keydown'&&e.key==='Control'),'Windows delivered remote Ctrl');
   console.log('PASS: real Windows input delivered from the remote browser into the owned test window.');
  }
  const hostVideo=native.locator('.repo-screen-viewer video'),screenMenu=native.getByRole('menu',{name:'Screen control',exact:true});
  await hostVideo.click({button:'right'});await screenMenu.getByRole('menuitem',{name:'Stop control',exact:true}).click();await web.getByText('You have control',{exact:false}).waitFor({state:'hidden'});assert(await web.evaluate(()=>repoVoice.getState().callActive));assert(await video.isVisible());
  await hostVideo.focus();await native.keyboard.press('Shift+F10');await screenMenu.getByRole('menuitem',{name:/Give control to/}).click();await take();await web.getByText('You have control',{exact:false}).waitFor({timeout:35000});
  await app.evaluate(()=>global.screenTest.emergency());await web.getByText('You have control',{exact:false}).waitFor({state:'hidden'});
  await native.getByRole('button',{name:'Give control',exact:true}).click();await take();await web.getByText('You have control',{exact:false}).waitFor({timeout:35000});
  await web.getByRole('button',{name:'Exit full screen',exact:true}).click();await web.getByRole('button',{name:'Stop watching',exact:true}).click();await native.getByRole('button',{name:'Stop control',exact:true}).waitFor({state:'hidden'});
  assert(await native.evaluate(()=>repoVoice.getState().callActive));assert(await native.getByRole('button',{name:'Stop sharing',exact:true}).isVisible());
  assert.deepEqual(errors,[]);console.log('PASS: actual Electron preload, real browser WebRTC mouse channel, click/release/scroll, typing, shortcuts and Tab to native boundary, stop control, emergency shortcut, revoke on unwatch, voice and screen preserved. Native OS input is stubbed in this test.');
 }catch(error){if(app){console.log('Permissions',await app.evaluate(()=>global.screenTest.events));for(const p of app.windows())console.log('NATIVE',p.url(),await p.locator('body').innerText().catch(()=>''));}throw error;}
 finally{await app?.close();await relay.close();await browser.close();await f.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
