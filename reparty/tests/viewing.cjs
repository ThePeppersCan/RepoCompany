const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');

async function test() {
  const browser = await chromium.launch({executablePath:process.env.CHROME_BIN || undefined});
  try {
    const page = await browser.newPage({viewport:{width:1280,height:720}});
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    const root = path.resolve(__dirname,'../..');
    const origin = 'http://localhost:8448';
    await page.route('**/*',async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname === '/shell') return route.fulfill({contentType:'text/html',body:
        '<style>body{margin:0}iframe{border:0;width:100%;height:calc(100vh - 44px)}</style><header>Launcher</header><iframe title="Reparty" allow="autoplay; fullscreen" src="/reparty/?embedded=1"></iframe>'});
      if (url.pathname === '/vendor/supabase.js') return route.fulfill({contentType:'text/javascript',body:
        'window.supabase={createClient(){return {auth:{onAuthStateChange(){},async getSession(){return {data:{session:null}}}}}}}'});
      const file = path.join(root,url.pathname.endsWith('/') ? url.pathname+'index.html' : url.pathname);
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({status:404,body:''});
      const mime = {'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'};
      return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
    });
    async function dismiss(f) {await f.locator('#auth[open] [data-close=auth]').click();}
    async function measure(f) {return f.locator('#screen').boundingBox();}
    for (const embedded of [false,true]) {
      await page.goto(origin+(embedded?'/shell':'/reparty/?embedded=1'));
      const f = embedded ? page.frameLocator('iframe') : page;
      await dismiss(f);
      const original = await measure(f);
      await f.locator('#fullscreen').click();
      await f.locator('html.video-fullscreen').waitFor();
      const box = await measure(f);
      assert.equal(box.x,0);assert.equal(box.y,0);assert.equal(box.width,1280);assert.equal(box.height,720);
      assert.equal(await f.locator('#tvChatForm').isVisible(),false);
      await f.locator('#television.controls-asleep').waitFor();
      await page.waitForFunction(() => {
        const doc=document.querySelector('iframe')?.contentDocument || document;
        return getComputedStyle(doc.querySelector('.playback-controls')).opacity==='0';
      });
      await page.mouse.move(60,80);
      await f.locator('#fullscreen').click();
      await f.locator('html.video-fullscreen').waitFor({state:'detached'});
      assert.deepEqual(await measure(f),original);
    }
    await page.goto(origin+'/reparty/?embedded=1');
    await dismiss(page);
    await page.setViewportSize({width:1024,height:520});
    await page.getByRole('separator',{name:'Resize people in this room'}).press('End');
    const small = await measure(page), join = await page.locator('#startRoom').boundingBox();
    assert.ok(small.height>=200,'short desktop still has usable picture');
    assert.ok(join.y>=small.y && join.y+join.height<=small.y+small.height,'Join is fully visible');
    await page.getByRole('button',{name:'Reset layout'}).click();
    assert.ok((await measure(page)).height>=small.height);
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('tab',{name:/People/}).click();
    assert.ok(await page.locator('#peoplePanel').isVisible());
    await page.getByRole('tab',{name:'Room chat'}).click();
    assert.equal(await page.locator('#peoplePanel').isVisible(),false);
    await page.getByRole('tab',{name:/Queue/}).click();
    await page.getByRole('button',{name:/Add a YouTube/}).click();
    assert.ok(await page.locator('#videoUrl').isVisible());
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
    await page.setViewportSize({width:1280,height:720});
    await page.locator('.ws-player-content > #peoplePanel').waitFor();

    // Drive the actual signed-in rendering path with deterministic media and RPC responses.
    function partyFixture() {
      const user = {id:'00000000-0000-0000-0000-000000000001',user_metadata:{username:'CatAsthma'}};
      const id = '123456789abc', item = {id:'qa',video_id:'abcdefghijk',title:'Test screening',added_by:'CatAsthma'};
      const playback = {item_id:item.id,video_id:item.video_id,position:0,playing:true,updated_at:new Date().toISOString()};
      const room = {id,name:'Screening room',revision:1,playback,settings:{},playlists:[{id:'p',name:'Test playlist',items:[item]}]};
      const snapshot = {room,members:[{user_id:user.id,name:'CatAsthma'}],messages:[]};
      const channel = {on(){return this},subscribe(){return this}};
      let watched = 595000;
      window.supabase={createClient(){return {
        auth:{onAuthStateChange(){},async getSession(){return {data:{session:{user,access_token:'fixture'}}}}},
        channel:()=>channel, removeChannel(){},
        rpc(name,params) {
          if(name==='reparty_watch_tick') {
            watched += params.p_elapsed_ms;
            return {abortSignal:async()=>({data:[{member_id:user.id,watched_ms:watched}]})};
          }
          if(name==='reparty_lobby_action')return Promise.resolve({data:params.p_action==='default'?{id}:{rooms:[],has_more:false}});
          return Promise.resolve({data:snapshot});
        }
      }}};
      window.YT={Player:class {
        constructor(id,options){this.start=performance.now();this.id='';this.playing=false;setTimeout(options.events.onReady,0)}
        loadVideoById(v){this.id=v.videoId;this.playing=true} getVideoData(){return {video_id:this.id}}
        getPlayerState(){return this.playing?1:2} getCurrentTime(){return (performance.now()-this.start)/1000}
        getDuration(){return 600} setVolume(){} mute(){} unMute(){} seekTo(){} playVideo(){this.playing=true}
        pauseVideo(){this.playing=false} stopVideo(){this.playing=false}
      }};
    }
    await page.route('**/vendor/supabase.js',route=>route.fulfill({contentType:'text/javascript',body:'('+partyFixture.toString()+')()'}));
    await page.goto(origin+'/reparty/?embedded=1');
    await page.locator('#participants .person .level-caption b').waitFor();
    await page.waitForFunction(()=>document.querySelector('.level-caption small')?.textContent==='99%');
    assert.equal(await page.getByRole('progressbar',{name:'CatAsthma watch level 1'}).count(),1);
    await page.locator('#screenShield').dblclick();
    await page.locator('html.video-fullscreen').waitFor();
    await page.keyboard.press('f');
    await page.locator('html.video-fullscreen').waitFor({state:'detached'});
    await page.locator('.level-burst i').first().waitFor({timeout:22000});
    assert.equal(await page.locator('.level-burst i').count(),9);
    assert.equal(await page.getByRole('progressbar',{name:'CatAsthma watch level 2'}).count(),1);
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('.level-rail').evaluate(el=>getComputedStyle(el,'::after').animationName),'none');
    assert.deepEqual(errors,[]);
    console.log('PASS fullscreen entry, idle, exit and restore in player and portal; short desktop, mobile tabs, level bar and avatar burst');
  } finally {await browser.close();}
}
test().catch(error=>{console.error(error);process.exitCode=1;});
