'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,'../espresso-qa');
const files=['motion.js','cosmetic-art.js','cosmetics.js','art.js','app.js'];
(async()=>{
 for(const name of files)require('node:child_process').execFileSync(process.execPath,['--check',path.join(root,'game-integrations/morogue',name)]);
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true,args:['--mute-audio']});
 try{
 const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(!process.argv.includes('--live'))await page.route('**/*',route=>{
  const u=new URL(route.request().url()),name=path.posix.basename(u.pathname);
  if(['morogue.repocompany.uk','repocompany.uk'].includes(u.hostname)&&/\/(interface\/vampire-survivor|game-integrations\/morogue)\//.test(u.pathname)&&files.includes(name))return route.fulfill({path:path.join(root,'game-integrations/morogue',name),headers:{'Access-Control-Allow-Origin':'*'}});
  return route.continue();
 });
 await page.goto('https://morogue.repocompany.uk/',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>globalThis.MORATALES_SURVIVOR_ART?.espressoAcrobatics&&globalThis.MORATALES_SURVIVOR_PACK&&globalThis.createCharacterModel);
 const result=await page.evaluate(async()=>{
  const A=MORATALES_SURVIVOR_ART,M=MORATALES_SURVIVOR_MOTION,C=MOROGUE_COSMETIC_ART,pack=MORATALES_SURVIVOR_PACK,model=createCharacterModel(pack),rig=M.create(model,pack,model.initial,A.makeCanvas);
  const check=(v,m)=>{if(!v)throw Error(m);};let frames=0;
  const near=M.espressoPose({weapon:'espresso',kind:'strike',phase:0,step:1,aimAngle:0}),far=M.espressoPose({weapon:'espresso',kind:'strike',phase:0,step:2,aimAngle:0}),both=M.espressoPose({weapon:'espresso',kind:'strike',phase:0,step:3,aimAngle:0});
  check(near.kicks[1]===1&&near.kicks[0]===0&&far.kicks[0]===1&&far.kicks[1]===0&&both.kicks.every(k=>k===1),'Alternating and paired recoil');
  for(const view of ['front','right','back','left'])for(const kind of ['idle','run','windup','strike','recover','dash','landing','roll','flip','vault'])for(const phase of [0,.25,.5,.75,1])for(const step of [1,2,3]){
   const pose={weapon:'espresso',kind,phase,step,aimAngle:({right:0,front:Math.PI/2,left:Math.PI,back:-Math.PI/2})[view],gait:.2,combat:['idle','run','windup','strike','recover'].includes(kind),body:['dash','landing'].includes(kind)};
   const f=rig.frame(view,-1,pose);check(f.pistols?.length===2,'Two pistol sockets '+kind);for(const p of C.pistolSockets(f))check(Number.isFinite(p.x)&&Number.isFinite(p.y),'Finite muzzle');frames++;
  }
  const g=MORATALES_SURVIVOR.create({seed:0,weapon:'espresso'}),s=g.state;s.dashCount=1;s.player.dash=.07;s.player.land=0;
  const before=JSON.stringify(s,(k,v)=>v instanceof Set?[...v]:v instanceof Map?[...v]:v);
  check(A.espressoAcrobatics(s)?.kind==='roll','Occasional ground roll');check(A.espressoAcrobatics(s,true)===null,'Reduced motion');s.dashCount=2;check(A.espressoAcrobatics(s)===null,'Not every dash rolls');s.player.starLeap={age:.3,duration:.6};check(A.espressoAcrobatics(s)?.kind==='flip','Actual gap leap flips');delete s.player.starLeap;s.dashCount=1;
  for(let i=0;i<100;i++)A.espressoAcrobatics(s);check(JSON.stringify(s,(k,v)=>v instanceof Set?[...v]:v instanceof Map?[...v]:v)===before,'Presentation leaves all simulation data unchanged');
  s.player.attack={};check(A.espressoAcrobatics(s)===null,'Attack cancels visual tumble');delete s.player.attack;
  const arena=document.createElement('canvas'),art=A.create(arena,model,pack);await art.ready;art.setPlayer(model.initial);
  const simulation=MORATALES_SURVIVOR.create({seed:1,weapon:'espresso'});simulation.state.nextUpgradeAt=1e8;simulation.state.nextMajor=1e8;
  for(let i=0;i<24;i++){simulation.update(.016,{attack:i%12===0,attackPressed:i%12===0,aimX:1000,aimY:600});for(const e of simulation.state.events)art.feedback(e,false);art.render(simulation.state,simulation.orbitals(),.016,false);}
  globalThis.pistolQA={A,M,C,rig,model,pack,art,simulation};
  const c=document.createElement('canvas');c.id='pistol-review';c.width=1200;c.height=900;c.style='position:fixed;inset:0;z-index:2147483647;width:1200px;height:900px';document.body.append(c);const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#141e20';x.fillRect(0,0,1200,900);x.font='20px sans-serif';x.fillStyle='#ecdec1';x.fillText('ESPRESSO PISTOLS · DIRECTION & RECOIL',32,36);
  ['front','right','back','left'].forEach((view,row)=>{
   x.font='14px sans-serif';x.fillStyle='#adbab4';x.fillText(view,25,115+row*170);
   [['idle',0,1],['windup',.8,1],['strike',.05,1],['strike',.05,2],['strike',.05,3],['recover',.65,3]].forEach(([kind,phase,step],col)=>{
    const f=rig.frame(view,-1,{weapon:'espresso',kind,phase,step,combat:true,aimAngle:({right:0,front:Math.PI/2,left:Math.PI,back:-Math.PI/2})[view],gait:.2});x.save();x.translate(160+col*180,190+row*170);x.scale(2.2,2.2);C.heldPistols(x,'roast',f,1,true);x.drawImage(f,-24,-65);C.heldPistols(x,'roast',f,1,false);x.restore();x.font='12px sans-serif';x.fillStyle='#adbab4';x.fillText(kind+' '+step,126+col*180,210+row*170);
   });
  });
  ['roast','porcelain','witchbrew','stormcup'].forEach((id,i)=>{x.save();x.translate(90+i*280,800);x.scale(2,2);C.pistolPair(x,id);x.restore();x.fillStyle='#ecdec1';x.fillText(id,90+i*280,890);});
  return {frames,checks:['alternating fire','paired finisher','four directions','all movement poses','reduced motion','gap-only flip','no simulation mutation','attack cancellation','arena renderer']};
 });
 await page.locator('#pistol-review').screenshot({path:path.join(out,'pistol-rig.png')});
 await page.evaluate(()=>{
  const c=document.getElementById('pistol-review'),x=c.getContext('2d'),{A,C,rig}=pistolQA;x.fillStyle='#141e20';x.fillRect(0,0,c.width,c.height);x.fillStyle='#ecdec1';x.font='20px sans-serif';x.fillText('ESPRESSO PISTOLS · ROLL & GAP FLIP',32,36);
  [['roll','right'],['flip','right'],['roll','front'],['flip','left']].forEach(([kind,view],row)=>{
   for(let col=0;col<7;col++){const phase=col/6,angle=({right:0,left:Math.PI,front:Math.PI/2})[view],pose={weapon:'espresso',kind,phase,angle},f=rig.frame(view,-1,pose);x.save();x.translate(95+col*166,205+row*205);x.fillStyle='#090f13';x.beginPath();x.ellipse(0,0,28,8,0,0,Math.PI*2);x.fill();x.scale(2,2);if(kind==='flip')x.translate(0,-Math.sin(phase*Math.PI)*26);A.tumble(x,pose);C.heldPistols(x,'roast',f,0,true);x.drawImage(f,-24,-65);C.heldPistols(x,'roast',f,0,false);x.restore();x.font='12px sans-serif';x.fillStyle='#adbab4';x.fillText(kind+' '+view+' '+Math.round(phase*100)+'%',55+col*166,225+row*205);}
  });
 });
 await page.locator('#pistol-review').screenshot({path:path.join(out,'pistol-tumble.png')});
 for(let i=0;i<48;i++){
  const data=await page.evaluate(i=>{
   const c=document.getElementById('pistol-review');c.width=720;c.height=360;const x=c.getContext('2d'),{A,C,rig}=pistolQA;x.imageSmoothingEnabled=false;x.fillStyle='#141e20';x.fillRect(0,0,720,360);x.font='16px sans-serif';x.fillStyle='#ecdec1';x.fillText('ESPRESSO PISTOLS',28,30);
   for(let col=0;col<3;col++){
    const cycle=(i%24)/24,kind=col===0?(cycle<.22?'windup':cycle<.5?'strike':'recover'):col===1?'roll':'flip',phase=col===0?(cycle<.22?cycle/.22:cycle<.5?(cycle-.22)/.28:(cycle-.5)/.5):Math.min(1,cycle*1.35),step=i<24?1:2,pose={weapon:'espresso',kind,phase,step,combat:col===0,aimAngle:0,angle:0},f=rig.frame('right',-1,pose);
    x.save();x.translate(120+col*240,275);x.fillStyle='#090f13';x.beginPath();x.ellipse(0,0,34,8,0,0,Math.PI*2);x.fill();x.scale(3,3);if(col===2)x.translate(0,-Math.sin(phase*Math.PI)*27);if(col)A.tumble(x,pose);C.heldPistols(x,'roast',f,0,true);x.drawImage(f,-24,-65);C.heldPistols(x,'roast',f,0,false);x.restore();x.fillStyle='#b9c3b8';x.font='14px sans-serif';x.fillText(['Alternating shots','Ground roll','Gap flip'][col],60+col*240,322);
   }return c.toDataURL('image/png').split(',')[1];
  },i);fs.writeFileSync(path.join(out,'motion-'+String(i).padStart(2,'0')+'.png'),Buffer.from(data,'base64'));
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(result,null,2));console.log(result);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
