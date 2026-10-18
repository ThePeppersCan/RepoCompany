const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
const {chromium}=require('playwright'),{createFixture}=require('./messaging-test-server.cjs'),{localSFU}=require('./local-sfu.cjs');
(async()=>{
 const f=await createFixture({voiceSecrets:{SFU_APP_ID:'fixture',SFU_APP_SECRET:'fixture',SCREEN_ENABLED:'true',CAMERA_ENABLED:'true'}});
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']}),relay=await localSFU(browser);f.voiceHub.sfu=relay.request;
 try{
  const ctx=await f.browserContext(browser,'alice');await ctx.route(f.base+'/api/accounts/status',r=>r.fulfill({json:{verified:true,email:'alice@example.com'}}));
  await ctx.addInitScript(()=>{if(!localStorage.getItem('wibs-panel-sizes-v1'))localStorage.setItem('wibs-panel-sizes-v1',JSON.stringify({voice:480,screen:420}));});
  const p=await ctx.newPage();await p.setViewportSize({width:1920,height:1080});await p.goto(f.base);await p.waitForFunction(()=>window.repoVoice?.getState().enabled);await p.evaluate(()=>repoMessaging.open());
  await p.getByRole('button',{name:'Join RE-COMP voice',exact:true}).click();await p.waitForFunction(()=>repoVoice.getState().callStatus==='active',null,{timeout:35000});
  const bar=p.getByRole('separator',{name:'Resize call area',exact:true});await bar.waitFor();
  const settle=()=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  async function geometry(){await settle();return p.evaluate(()=>{const box=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,scroll:e.scrollHeight,client:e.clientHeight}};return {stage:box('.repo-call-stage'),content:box('.repo-call-stage-content'),avatar:box('.repo-call-stage-avatar'),roster:box('.repo-call-stage-roster'),controls:box('.repo-call-stage-controls')};});}
  function voiceFits(g){assert(g.content.height>60,'call content fills the resized stage');assert(g.avatar.top>=g.roster.top-1,'avatar top is visible');assert(g.avatar.bottom<=g.roster.bottom+1,'avatar bottom is visible');assert(g.controls.bottom<=g.stage.bottom,'controls remain inside the call');assert(g.stage.bottom-g.controls.bottom<30,'no empty second panel below the controls');assert(g.roster.scroll<=g.roster.client+1,'one caller needs no inner scrollbar');}
  voiceFits(await geometry());assert.equal(await bar.count(),1);
  const initial=await bar.boundingBox();await p.mouse.move(initial.x+initial.width/2,initial.y+2);await p.mouse.down();await p.mouse.move(initial.x+initial.width/2,initial.y-160,{steps:12});await p.mouse.up();
  let g=await geometry();voiceFits(g);assert(Math.abs(g.stage.height-320)<3,'drag changes the complete call height');
  await bar.focus();await p.keyboard.press('ArrowDown');g=await geometry();voiceFits(g);assert(Math.abs(g.stage.height-330)<3,'keyboard resizes the same panel');
  await p.getByRole('button',{name:'Collapse call',exact:true}).click();assert(await p.locator('.repo-call-stage-body').isHidden());await bar.waitFor({state:'hidden'});await p.getByRole('button',{name:'Expand call',exact:true}).click();voiceFits(await geometry());
  const out=path.resolve(__dirname,'../../../outputs');await fs.mkdir(out,{recursive:true});await p.screenshot({path:path.join(out,'wibs-divider-fixed.png')});
  // Exercise real stage markup with inert media: resizing must not replace media nodes.
  for(const kind of ['screen','camera','both']){
   await p.evaluate(kind=>{const media=document.querySelector('.repo-call-stage-media'),cameras=document.querySelector('.repo-camera-grid');media.replaceChildren();cameras.replaceChildren();media.hidden=kind==='camera';cameras.hidden=kind==='screen';if(!media.hidden)media.innerHTML='<section class="repo-screen-viewer"><video></video></section>';if(!cameras.hidden)cameras.innerHTML='<section class="repo-camera-tile"><video></video><span>Camera</span></section>';window.resizeTestVideos=[...document.querySelectorAll('.repo-call-stage video')];},kind);
   await settle();await bar.focus();await p.keyboard.press('ArrowDown');await settle();
   const result=await p.evaluate(()=>{const content=document.querySelector('.repo-call-stage-content').getBoundingClientRect();return {stable:resizeTestVideos.every(v=>v.isConnected),videos:resizeTestVideos.map(v=>{const r=v.getBoundingClientRect();return {height:r.height,inside:r.top>=content.top-1&&r.bottom<=content.bottom+1};})};});assert(result.stable);assert(result.videos.every(v=>v.height>40&&v.inside),kind+' media follows the divider');
  }
  await p.evaluate(()=>{for(const selector of ['.repo-call-stage-media','.repo-camera-grid']){const e=document.querySelector(selector);e.replaceChildren();e.hidden=true;}});voiceFits(await geometry());
  await p.setViewportSize({width:390,height:844});await bar.focus();await p.keyboard.press('ArrowDown');voiceFits(await geometry());
  await p.setViewportSize({width:1920,height:1080});await bar.focus();for(let i=0;i<25;i++)await p.keyboard.press('ArrowUp');voiceFits(await geometry());
  const savedHeight=(await geometry()).stage.height;await p.goto(f.base);await p.waitForFunction(()=>window.repoVoice?.getState().enabled);await p.evaluate(()=>repoMessaging.open());if(await p.getByRole('button',{name:'Join RE-COMP voice',exact:true}).isVisible())await p.getByRole('button',{name:'Join RE-COMP voice',exact:true}).click();await p.waitForFunction(()=>repoVoice.getState().callStatus==='active',null,{timeout:35000});voiceFits(await geometry());assert(Math.abs((await geometry()).stage.height-savedHeight)<2,'saved size survives navigation');
  console.log('PASS: saved size, pointer and keyboard resize, one divider, complete avatar visibility, no inner scroll for one caller, collapse/expand, screen/camera/combined sizing, stable media, mobile, minimum and reload.');
 }finally{for(const room of f.voiceHub.state.rooms){room.ended=Date.now();for(const m of Object.values(room.members))m.status='left';}await f.voiceHub.alarm();await relay.close();await browser.close();await f.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
