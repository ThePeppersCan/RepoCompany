'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'repo-game-artwork.js'),'utf8');
const image=id=>'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/'+id+'/capsule_184x69.jpg';
const alternate=id=>image(id).replace('shared.akamai','shared.fastly');
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="184" height="69"><rect width="184" height="69" fill="#466348"/></svg>';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),requests=[];
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/repo-game-artwork.js'?'application/javascript':req.url.includes('.svg')?'image/svg+xml':'text/html');res.end(req.url==='/repo-game-artwork.js'?source:req.url.includes('.svg')?svg:'<!doctype html><style>img{width:74px;height:40px}</style><div id="hidden" style="display:none"></div><div id="shown"></div><div id="far" style="margin-top:2500px"></div><script src="/repo-game-artwork.js"></script>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
  const context=await browser.newContext(),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await context.route('**/api/steam-artwork?*',route=>{const id=new URL(route.request().url()).searchParams.get('app');requests.push('metadata:'+id);return route.fulfill({json:{resolved:true,images:['https://evil.test/never.jpg',image(id),alternate(id)]}});});
  await context.route('https://**.steamstatic.com/**',route=>{const url=route.request().url();requests.push(url);if(url===image('730')||url.includes('/570/'))return route.abort();return route.fulfill({contentType:'image/svg+xml',body:svg,headers:{'Cache-Control':'public,max-age=31536000'}});});
  await context.route('https://evil.test/**',()=>{throw Error('Untrusted artwork requested');});
  await p.goto(base);
  const add=async(id,container='shown',name=id)=>p.evaluate(({id,container,name})=>{const img=document.createElement('img');img.id='art-'+name;const accepted=repoGameArtwork.attach(img,'steam:'+id);document.getElementById(container).append(img);return accepted;},{id,container,name});
  const loaded=async(name)=>p.waitForFunction(name=>{const img=document.getElementById('art-'+name);return img.complete&&img.naturalWidth===184&&img.src.includes('steamstatic.com');},name);
  await add('1139980','hidden');await add('413150','far');await p.waitForTimeout(200);assert.deepEqual(requests,[],'hidden and offscreen artwork makes no requests');
  await p.locator('#hidden').evaluate(n=>n.style.display='block');await loaded('1139980');assert.equal(requests.filter(x=>x==='metadata:1139980').length,1);
  await add('1139980','shown','repeat');await loaded('repeat');assert.equal(requests.filter(x=>x==='metadata:1139980').length,1,'same game shares metadata');
  await p.evaluate(()=>{const section=document.createElement('section');for(const id of ['440','400','620']){const img=document.createElement('img');img.id='art-'+id;repoGameArtwork.attach(img,'steam:'+id);section.append(img);}document.getElementById('shown').append(section);});
  for(const id of ['440','400','620'])await loaded(id);
  await Promise.all([add('730','shown','first730'),add('730','shown','second730')]);await loaded('first730');await loaded('second730');assert.equal(requests.filter(x=>x==='metadata:730').length,1,'simultaneous cards share metadata');assert.equal(await p.locator('#art-first730').getAttribute('src'),alternate('730'),'failed primary uses alternate Steam host');
  const failedAttempts=requests.filter(x=>x===image('730')).length;await add('730','shown','third730');await loaded('third730');assert.equal(requests.filter(x=>x===image('730')).length,failedAttempts,'failed host is not retried on every card');
  await Promise.all([p.waitForRequest(alternate('570')),add('570')]);await p.waitForFunction(()=>document.getElementById('art-570').src.endsWith('/assets/game-activity.svg')&&document.getElementById('art-570').complete);await p.waitForFunction(()=>document.getElementById('art-570').onerror===null);assert.equal(requests.filter(x=>x.includes('/570/')).length,2,'all-source failure has bounded requests');
  await p.evaluate(()=>{const original=Date.now;Date.now=()=>original()+61000;});await Promise.all([p.waitForRequest(alternate('570')),add('570','shown','retry570')]);await p.waitForFunction(()=>document.getElementById('art-retry570').onerror===null);assert.equal(requests.filter(x=>x==='metadata:570').length,2,'temporary failures can recover after one minute');
  await p.locator('#art-413150').scrollIntoViewIfNeeded();await loaded('413150');assert.equal(requests.filter(x=>x==='metadata:413150').length,1);
  assert.deepEqual(errors,[]);await context.close();console.log('PASS: visible-only requests, shared metadata, safe URLs, alternate host, bounded failures and retry.');
  await integration(browser);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});

async function integration(browser){
 let live;
 if(process.argv.includes('--live')){
  const api=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'functions/api/steam-artwork.js'),'utf8')).toString('base64'));
  live=await api.resolveArtwork('1139980');assert(live.resolved,'Live Steam metadata resolves');
 }
 const {createFixture}=require('./messaging-test-server.cjs'),f=await createFixture();
 try{
  const now=Date.now();for(const who of ['alice','bob'])f.sql.prepare('INSERT INTO community_members VALUES(?,?,?)').run(f.sessions[who].user.id,now,now);
  const id=f.sessions.bob.user.id;f.sql.prepare('INSERT INTO community_activity_preferences VALUES(?,1,1)').run(id);
  f.sql.prepare('INSERT INTO community_external_sessions VALUES(?,?,?,?,?,?,?,1)').run(id,'steam-art-test','steam:1139980','Travellers Rest',now-60000,now,1);
  f.sql.prepare('INSERT INTO community_external_activity VALUES(?,?,?,?,?)').run(id,'steam:1139980','Travellers Rest',3600000,now);
  const c=await f.browserContext(browser,'alice');let metadata=0;
  await c.route(f.base+'/api/steam-artwork?*',route=>{metadata++;return route.fulfill({json:live||{resolved:true,images:[image('1139980')]}});});
  await c.route('https://**.steamstatic.com/**',route=>live?route.continue():route.fulfill({contentType:'image/svg+xml',body:svg}));
  const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.setViewportSize({width:1280,height:800});await p.goto(f.base);await p.waitForFunction(()=>window.repoCommunity&&repoAccount.state.user);assert.equal(metadata,0);
  await p.evaluate(()=>repoMessaging.open());
  await p.waitForFunction(()=>{const img=document.querySelector('.rc-activity-art[data-steam=true]');return img?.complete&&img.naturalWidth===184&&img.src.includes('steamstatic.com');});
  assert.equal(metadata,1);const card=p.locator('.rc-activity-card');assert.match(await card.innerText(),/Travellers Rest/);
  const art=card.locator('img'),box=await art.boundingBox();assert.equal(box.width,74);assert.equal(box.height,40);assert.equal(await art.evaluate(n=>getComputedStyle(n).objectFit),'contain');
  assert.equal(await p.locator('.rc-members').evaluate(n=>n.scrollWidth>n.clientWidth),false);
  const out=path.resolve(root,'../../outputs');fs.mkdirSync(out,{recursive:true});await p.screenshot({path:path.join(out,'wibs-steam-artwork-desktop.png')});
  await card.click();await p.waitForFunction(()=>{const img=document.querySelector('.rc-profile-popover .rc-game-icon');return img?.complete&&img.naturalWidth===184&&img.src.includes('steamstatic.com');});assert.equal(metadata,1,'profile uses same artwork metadata');await p.keyboard.press('Escape');
  await p.setViewportSize({width:390,height:844});await p.getByRole('button',{name:'Show or hide members',exact:true}).click();const bounds=await card.boundingBox();assert(bounds&&bounds.x>=0&&bounds.x+bounds.width<=390);assert.equal(await p.locator('.rc-members').evaluate(n=>n.scrollWidth>n.clientWidth),false);await p.screenshot({path:path.join(out,'wibs-steam-artwork-mobile.png')});
  assert.deepEqual(errors,[]);await c.close();console.log('PASS: Wibs recent activity and profile share Steam artwork; desktop/mobile fit.'+(live?' Live Travellers Rest thumbnail loaded directly from Steam.':''));
 }finally{await f.close();}
}
