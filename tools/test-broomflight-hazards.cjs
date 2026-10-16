'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http');
const {chromium}=require('playwright');
const dist=path.resolve(__dirname,'../dist'),shots=path.resolve(__dirname,'../../broomflight-qa');
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');const p=path.resolve(dist,'.'+u.pathname+(u.pathname.endsWith('/')?'index.html':''));if(!p.startsWith(dist+path.sep)||!fs.existsSync(p)){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('console',m=>{if(m.type()==='error')console.error(m.text());});
  await page.goto('http://127.0.0.1:'+server.address().port+'/broomflight/?capture=1');await page.waitForFunction(()=>window.__BROOMFLIGHT?.ready,{},{timeout:60000});
  const hazards=(await page.evaluate(()=>__BROOMFLIGHT.state())).world.hazards;
  assert.equal(hazards.length,19);assert(hazards.filter(h=>h.s>hazards.at(-1).s*.4/.956).length>=12);
  fs.mkdirSync(shots,{recursive:true});
  for(const kind of ['thorns','branches','pillars','rockfall']){
   const h=hazards.find(h=>h.kind===kind);
   await page.evaluate(h=>{const length=__BROOMFLIGHT.state().world.length;__BROOMFLIGHT.reset();__BROOMFLIGHT.seek((h.s-36)/length);__BROOMFLIGHT.input({pedal:true,crouch:false,manual:false,steer:0,boost:false});__BROOMFLIGHT.step(1,true);},h);
   await page.screenshot({path:path.join(shots,'hazard-'+kind+'.png')});
  }
  async function pass(h,safe){return page.evaluate(({h,safe})=>{
   const api=__BROOMFLIGHT,world=api.state().world,previous=world.hazards.filter(x=>x.s<h.s).at(-1);api.reset();api.seek((h.s-Math.min(80,previous?h.s-previous.s-25:80))/world.length);
   let state=api.state();for(let frames=0;state.player.s<h.s+24&&frames<1800;frames+=12){
    const lane=h.kind==='pillars'?(safe?-h.side:h.side)*h.width*.44:0;
    api.input({pedal:true,boost:true,brake:false,manual:false,crouch:h.kind==='thorns'?safe:h.kind==='branches'?!safe:false,steer:Math.max(-1,Math.min(1,(lane-state.player.lateral)*.9))});
    api.step(12,false);state=api.state();
   }return state.player;
  },{h,safe});}
  for(const h of hazards.filter(h=>h.kind!=='rockfall')){
   const safe=await pass(h,true);assert.equal(safe.hits,0,'Safe route: '+h.id+' '+h.kind);assert(safe.cleanPasses>=1,h.id+' clean pass');
  }
  for(const kind of ['thorns','branches','pillars']){const bad=await pass(hazards.find(h=>h.kind===kind),false);assert(bad.hits>0,'Ignoring '+kind+' costs speed');}
  // Compare two full races through the actual hilly course using player controls.
  async function fullRace(avoid){return page.evaluate(avoid=>{
   const api=__BROOMFLIGHT;api.reset();let state=api.state();
   for(let frames=0;state.phase!=='results'&&frames<12000;frames+=12){
    const p=state.player,h=state.world.hazards.find(h=>h.s+(h.kind==='rockfall'?13:4)>=p.s&&h.s-p.s<100);
    let lane=0;if(avoid&&h?.kind==='pillars')lane=-h.side*h.width*.44;
    api.input({pedal:true,boost:false,brake:false,trick:0,hop:false,manual:avoid&&h?.kind==='branches',crouch:avoid&&h?.kind==='thorns',steer:avoid?Math.max(-1,Math.min(1,(lane-p.lateral)*.9)):0});api.step(12,false);state=api.state();
   }return state;
  },avoid);}
  const straight=await fullRace(false),skilled=await fullRace(true);
  console.log('Full course:',JSON.stringify({straight:{time:straight.time,hits:straight.player.hits,clean:straight.player.cleanPasses},skilled:{time:skilled.time,hits:skilled.player.hits,clean:skilled.player.cleanPasses},rivals:skilled.riders}));
  assert.equal(skilled.phase,'results');assert.equal(skilled.checkpoints,4);assert(skilled.player.hits<straight.player.hits);assert(skilled.time<straight.time);assert(skilled.player.cleanPasses>=16);assert(skilled.riders.slice(1).every(r=>r.cleanPasses>10&&r.hits<6),'Rivals handle the obstacle course');
  await page.evaluate(()=>{__BROOMFLIGHT.reset();__BROOMFLIGHT.seek(.32);__BROOMFLIGHT.step(1,true);__BROOMFLIGHT.pause();});
  const before=await page.evaluate(()=>__BROOMFLIGHT.state());await page.evaluate(()=>__BROOMFLIGHT.step(300,true));const after=await page.evaluate(()=>__BROOMFLIGHT.state());
  assert.equal(after.time,before.time);assert.deepEqual(after.world.hazards,before.world.hazards,'Pausing freezes every falling boulder');
  await page.evaluate(()=>{__BROOMFLIGHT.reset();__BROOMFLIGHT.seek(.325-50/__BROOMFLIGHT.state().world.length);__BROOMFLIGHT.input({pedal:false,brake:true,steer:0,crouch:false});__BROOMFLIGHT.step(1,true);});
  for(let i=0;i<300;i++){const state=await page.evaluate(()=>__BROOMFLIGHT.state());if(state.world.hazards.find(h=>h.kind==='rockfall').rocks.some(r=>r.active&&r.y<12)){await page.screenshot({path:path.join(shots,'hazard-falling.png')});break;}await page.evaluate(()=>__BROOMFLIGHT.step(2,true));}
  // The compact instruction stays clear of the timer on touch screens.
  for(const [width,height] of [[844,390],[390,844]]){
   await page.setViewportSize({width,height});await page.evaluate(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));__BROOMFLIGHT.seek(.45);__BROOMFLIGHT.step(1,true);});
   const warning=await page.locator('#hazard-warning').boundingBox(),timer=await page.locator('.race-top').boundingBox();assert(warning&&timer&&warning.y>=timer.y+timer.height);assert(warning.x>=0&&warning.x+warning.width<=width);await page.screenshot({path:path.join(shots,'hazard-'+width+'.png')});
  }
  console.log('PASS: visible hazards, every static safe route at boost speed, collision penalties, faster clean full race, rival navigation, frozen rockfalls on pause and responsive warning layout.');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
