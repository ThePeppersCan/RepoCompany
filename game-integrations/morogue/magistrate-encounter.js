/* A brush leads, an unwilling body follows, and a folded spine becomes a living arch.
   This module owns presentation only: the encounter still owns every hit and position. */
(function(root,factory){const api=factory();root.MOROGUE_MAGISTRATE=api;if(typeof module==='object'&&module.exports)module.exports=api;})(globalThis,function(){
 'use strict';const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>{t=clamp(t);return t*t*(3-2*t);},P=(x,y)=>({x,y});
 const rest={arch:0,curl:0,lean:.16,x:0,y:0,head:-.16,rx:48,ry:-75,wr:1.12,lx:-40,ly:-84,free:.2,stance:.1,smile:.65,strain:.15,ink:0};
 const pose=q=>({...rest,...q}),mix=(a,b,t)=>Object.fromEntries(Object.keys(rest).map(k=>[k,lerp(a[k],b[k],t)]));
 const poses={rest,
  study:pose({head:-.4,rx:16,ry:-120,wr:-.25,lx:-17,ly:-155,free:1,arch:.08,smile:.25,strain:.45}),
  dip:pose({x:-7,y:9,lean:.32,rx:16,ry:-58,wr:1.4,lx:-31,ly:-142,arch:.18,smile:.2,strain:.55}),
  load:pose({x:-11,lean:-.14,rx:-45,ry:-142,wr:-.48,lx:60,ly:-117,head:.16,arch:.72,curl:-.6,strain:.75,smile:.9}),
  sweep:pose({x:14,y:11,lean:.37,rx:100,ry:-120,wr:.15,lx:-60,ly:-175,head:-.45,arch:1,curl:.55,stance:.85,strain:1,smile:1,ink:1}),
  cross:pose({x:-13,y:4,lean:-.27,rx:-91,ry:-117,wr:2.9,lx:61,ly:-189,head:.40,arch:.95,curl:-.75,stance:.8,strain:.9,smile:1,ink:1}),
  high:pose({x:3,y:-7,lean:-.13,rx:27,ry:-230,wr:-1.23,lx:-64,ly:-123,head:.38,arch:1,curl:-.30,stance:.25,strain:.75,smile:.95}),
  stamp:pose({x:11,y:27,lean:.50,rx:74,ry:-49,wr:1.42,lx:-66,ly:-167,head:-.55,arch:.83,curl:.9,stance:1,strain:1,smile:1,ink:1}),
  scrape:pose({x:14,y:16,lean:.40,rx:97,ry:-68,wr:.73,lx:-73,ly:-136,head:-.37,arch:.92,curl:.7,stance:.9,strain:.9,smile:1,ink:1}),
  beckon:pose({x:-5,y:4,lean:.05,rx:36,ry:-179,wr:-.55,lx:-93,ly:-161,free:1,head:.31,arch:.76,curl:-.7,strain:.65,smile:.3}),
  judge:pose({x:-8,y:-4,lean:-.09,rx:58,ry:-194,wr:-.20,lx:-19,ly:-183,free:1,head:-.23,arch:1,curl:.1,strain:.85,smile:1}),
  hauled:pose({x:-12,y:13,lean:.38,rx:100,ry:-80,wr:.94,lx:-67,ly:-89,head:-.57,arch:1,curl:.90,stance:.90,strain:1,smile:1,ink:1}),
  recoil:pose({x:-13,y:17,lean:-.3,rx:21,ry:-91,wr:1.1,lx:-42,ly:-132,head:.53,arch:.55,curl:-1,stance:.7,strain:.85,smile:.15}),
  spent:pose({x:2,y:13,lean:.29,rx:56,ry:-70,wr:1.15,lx:-37,ly:-89,head:-.39,arch:.2,curl:.2,strain:.55,smile:.2}),
  broken:pose({x:-9,y:29,lean:.43,rx:14,ry:-56,wr:1.75,lx:-8,ly:-158,free:1,head:-.57,arch:.08,curl:-.6,stance:.6,strain:.8,smile:0})};
 const cache=new WeakMap();
 function compile(q,id){const keys=[],key=(t,p,snap=false)=>keys.push({t:clamp(t,0,q.duration),p:typeof p==='string'?poses[p]:pose(p),snap});key(0,'rest');key(.16,'study');
  const live=q.zones.filter(z=>!z.warningOnly),arcs=live.filter(z=>z.shape==='arc');
  switch(id){
   case 'statement':{const z=live[0];key(z.delay-.32,'load');key(z.delay-.05,{...poses.high,curl:-.8});key(z.delay+.10,'sweep',true);key(z.delay+z.duration,'cross');break;}
   case 'signature':arcs.forEach((z,i)=>{key(z.delay-.27,['load','high','judge'][i]);key(z.delay+.05,['sweep','stamp','cross'][i],true);key(z.delay+z.duration,{...poses.study,arch:.7+i*.1,smile:.7,head:i%2?.37:-.28});});break;
   case 'overruled':{const fake=q.zones.find(z=>z.warningOnly),[line,bar]=live;key(.38,'dip');key(fake.delay,{...poses.study,rx:65,wr:.4,arch:.2,ink:0});key(line.delay-.10,'load');key(line.delay+.06,'cross',true);key(bar.delay-.22,'high');key(bar.delay+.07,'stamp',true);key(q.duration,'recoil');break;}
   case 'ritual':key(.6,'beckon');key(1.28,'judge');arcs.forEach((z,i)=>{key(z.delay-.38,{...poses.judge,curl:(i-1)*.8,head:(i%2?1:-1)*.3});key(z.delay+.08,[poses.sweep,{...poses.high,ink:1},poses.cross][i],true);key(z.delay+z.duration+.23,'judge');});key(q.duration-.62,'spent');key(q.duration,'rest');break;
   case 'examination':key(.48,'load');live.slice().sort((a,b)=>a.delay-b.delay).forEach((z,i)=>{const common={...poses.judge,arch:1,curl:Math.sin(i*1.9)*.55,lx:-46+Math.sin(i*.9)*9,ly:-112,head:i%2?.15:-.28,lean:i%2?.12:.24,smile:1,strain:1};key(z.delay-.065,{...common,rx:i%2?52:28,ry:i%2?-176:-138,wr:i%2?-1.1:-.38});key(z.delay+.045,{...common,rx:i%2?67:93,ry:i%2?-108:-127,wr:i%2?1.1:.2,ink:1},true);});key(q.duration,'spent');break;
   case 'adjourned':{const m=q.motions[0],z=arcs[0];key(m.start-.34,'dip');key(m.start-.08,{...poses.hauled,x:-16,rx:98,wr:.48});key(m.start+.06,'hauled',true);key(m.start+m.duration,'stamp');key(z.delay-.15,'load');key(z.delay+.13,'sweep',true);key(q.duration,'spent');break;}
   case 'witnesses':key(.5,'beckon');key(.95,{...poses.beckon,lx:-109,ly:-120,free:.2,head:-.25,smile:.9});key(1.45,'judge');key(arcs[0].delay-.22,'high');key(arcs[0].delay+.08,{...poses.stamp,lx:-75,ly:-197},true);key(3.15,'recoil');key(q.duration,'spent');break;
   case 'verdict':arcs.forEach((z,i)=>{key(z.delay-.28,{...poses[['high','load','judge'][i]],arch:1,curl:(i-1)*.75});key(z.delay+.09,{...poses[['stamp','cross','sweep'][i]],head:[-.50,.45,-.30][i]},true);key(z.delay+z.duration,{...poses.judge,smile:.5,curl:(i-1)*.6});});break;
   case 'redaction':live.filter((_,i)=>i%2===0).forEach((z,i)=>{key(z.delay-.30,i%2?'high':'dip');key(z.delay+.08,{...poses.scrape,rx:i%2?-86:103,wr:i%2?2.3:.72,curl:i%2?-.9:.9},true);key(z.delay+1.0,{...poses.scrape,rx:i%2?61:-48,wr:i%2?.6:2.2,lean:i%2?.33:-.18,head:i%2?-.30:.35});});key(q.duration,'spent');break;
  }return keys.sort((a,b)=>a.t-b.t);
 }
 function action(q,id,t){let c=cache.get(q);if(!c||c.id!==id){c={id,keys:compile(q,id)};cache.set(q,c);}if(id==='signature'&&q.cancelled?.decree&&t>=2.5)return mix(poses.judge,poses.recoil,ease((t-2.5)/.25));let a=c.keys[0];for(const b of c.keys.slice(1)){if(t<=b.t){const u=clamp((t-a.t)/Math.max(.001,b.t-a.t));return mix(a.p,b.p,b.snap?u*u*u:ease(u));}a=b;}return{...a.p};}
 function target(b){const r=b.magistrateRig;if(b.inkFight){const f=b.inkFight;if(f.mode==='enter'){const t=f.age;return t<1.3?mix(poses.dip,poses.beckon,ease(t/1.3)):t<2.2?mix(poses.beckon,poses.high,ease((t-1.3)/.9)):t<3.65?mix(poses.high,poses.hauled,ease((t-2.2)/1.45)):mix(poses.hauled,poses.sweep,ease((t-3.65)/.5));}if(f.mode==='finish'||f.mode==='exit')return poses.broken;return poses.judge;}if(b.majorPlan){const age=b.majorPlan.duration-b.majorClock,v=action(b.majorPlan,b.majorMove.pattern,age);return age<.16&&r?.from?mix(r.from,v,ease(age/.16)):v;}const t=r?.stateAge||0;
  if(b.majorState==='intro'){const u=2-b.majorClock;return u<.7?mix(poses.broken,rest,ease(u/.7)):mix(rest,poses.study,Math.sin(clamp((u-.7)/1.3)*Math.PI));}
  if(b.majorState==='phase'){const u=1.25-b.majorClock;return u<.47?mix(rest,poses.judge,ease(u/.47)):mix(poses.judge,poses.broken,ease((u-.47)/.78));}
  if(b.majorState==='stagger')return mix(r?.from||rest,poses.broken,ease(t/.3));
  if(b.majorState==='recovery')return t<.35?mix(r?.from||rest,poses.spent,ease(t/.35)):mix(poses.spent,rest,ease((t-.35)/.65));
  // His wrist describes a stroke first. The human body is still for most of the cycle.
  const u=(b.age||0)%2.8;return u<1.75?rest:u<2.1?mix(rest,{...poses.dip,rx:78,ry:-73,wr:.8},ease((u-1.75)/.35)):mix({...poses.dip,rx:78,ry:-73,wr:.8},rest,ease((u-2.1)/.7));
 }
 function init(b){return{x:b.x,y:b.y,channels:{...rest},from:{...rest},stateAge:0,gaze:{x:0,y:0},velocity:{x:0,y:0},torso:{x:0,y:0,a:.16,vx:0,vy:0,va:0},arches:Array.from({length:10},()=>({v:0,a:0})),feet:[-1,1].map(side=>({x:b.x+side*20,y:b.y+side*2,z:0,drag:0,active:false})),nextFoot:0,stepClock:0,cloth:[{a:0,v:0},{a:0,v:0}],marks:[],bursts:[],fired:new Set()};}
 function prepare(q,b,p){q.magistrate={aim:Math.atan2(p.y-b.y,p.x-b.x)};return q;}
 function walk(b,dt,p){const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;if(d>115){b.x+=dx/d*b.speed*dt;b.y+=dy/d*b.speed*dt;}}
 function spring(n,to,dt,freq=20,from=to){for(let left=Math.min(dt,.1);left>1e-8;){const h=Math.min(left,1/120),aim=lerp(from,to,1-(left-h*.5)/dt);n.v+=(freq*freq*(aim-n.a)-freq*1.8*n.v)*h;n.a+=n.v*h;left-=h;}}
 function step(b,dt,api,p){const r=b.magistrateRig||(b.magistrateRig=init(b)),key=b.majorState+':'+b.majorSerial+':'+b.phase,dx=b.x-r.x,dy=b.y-r.y;r.x=b.x;r.y=b.y;if(key!==r.key){r.key=key;r.stateAge=0;r.from={...r.channels};r.fired=new Set();}else r.stateAge+=dt;
  const before=r.channels;r.channels={...target(b)};const c=r.channels;r.velocity.x=lerp(r.velocity.x,dt?clamp(dx/dt,-900,900):0,1-Math.exp(-dt*9));r.velocity.y=lerp(r.velocity.y,dt?clamp(dy/dt,-900,900):0,1-Math.exp(-dt*9));
  const facing=b.majorState==='approach'&&r.velocity.x<-10?1:0;r.turn=lerp(r.turn||0,facing,1-Math.exp(-dt*12));
  if(b.majorState==='approach'){const mirror=1-2*r.turn;c.rx*=mirror;c.lx*=mirror;c.wr=lerp(c.wr,Math.PI-c.wr,r.turn);c.lean*=mirror;c.head*=mirror;}
  if(p){const d=Math.hypot(p.x-b.x,p.y-b.y)||1;r.gaze.x=lerp(r.gaze.x,(p.x-b.x)/d,1-Math.exp(-dt*4));r.gaze.y=lerp(r.gaze.y,(p.y-b.y)/d,1-Math.exp(-dt*4));}
  const aims={x:c.x-clamp(r.velocity.x*.026,-15,15),y:c.y,a:c.lean};for(const[k,v]of[['x','vx'],['y','vy'],['a','va']]){const n={a:r.torso[k],v:r.torso[v]};spring(n,aims[k],dt,18,r.aims?.[k]??aims[k]);r.torso[k]=n.a;r.torso[v]=n.v;}r.aims=aims;
  r.arches.forEach((n,i)=>{spring(n,clamp((c.arch-i*.024)/(1-i*.024)),dt,22-i*.55,clamp((before.arch-i*.024)/(1-i*.024)));n.a=clamp(n.a,0,1.06);});
  r.cloth.forEach((n,i)=>spring(n,(i?1:-1)*c.arch*.32-c.lean*.4-clamp(r.velocity.x*.00035,-.28,.28),dt,10+i*2));
  r.stepClock=Math.max(0,r.stepClock-dt);for(const [i,f]of r.feet.entries()){const side=i?1:-1,home=P(b.x+side*(20+c.stance*24),b.y+side*c.stance*9),d=Math.hypot(home.x-f.x,home.y-f.y);
   if(f.active){f.t+=dt/f.duration;const u=ease(f.t);f.x=lerp(f.from.x,f.to.x,u);f.y=lerp(f.from.y,f.to.y,u);f.z=Math.sin(clamp(f.t)*Math.PI)*f.lift;f.drag=1-clamp(f.t);if(f.t>=1){f.active=false;f.z=0;}}
   else if(d>20&&r.stepClock===0&&(r.nextFoot===i||d>58)){f.active=true;f.t=0;f.from=P(f.x,f.y);f.to=P(home.x+clamp(r.velocity.x*.05,-24,24),home.y+clamp(r.velocity.y*.04,-12,12));f.duration=b.charge?.12:.22;f.lift=b.charge?2:i?8:4;r.nextFoot=1-i;r.stepClock=b.charge?.06:.09;}
   // A dragged toe can slip a limited distance; it must never leave a leg behind a relocation.
   const max=76,fx=f.x-b.x,fy=f.y-b.y,len=Math.hypot(fx,fy);if(len>max){f.x=b.x+fx/len*max;f.y=b.y+fy/len*max;f.active=false;f.z=0;}
  }
  const age=b.age||0,q=b.majorPlan,t=q?q.duration-b.majorClock:0;
  for(const[i,z]of(q?.zones||[]).entries())if(t>=z.delay&&!r.fired.has('stroke'+i)){r.fired.add('stroke'+i);if(!z.warningOnly&&!q.cancelled?.[z.counterKey]){r.bursts.push({at:age,seed:i,angle:z.angle||0});if(i===0||q.zones[i-1].delay!==z.delay)api?.event?.('magistrateStroke',{strength:c.ink});}}
  if(c.arch>.55&&!r.fired.has('unfold')){r.fired.add('unfold');api?.event?.('magistrateUnfold',{});}
  if((!q||c.ink>.5)&&Math.hypot(dx,dy)>.25&&age>=(r.nextMark||0)){r.nextMark=age+.09;r.marks.push({x:b.x+c.rx+Math.cos(c.wr)*105,y:b.y+clamp(c.ry+c.y*.25+Math.sin(c.wr)*105,-2,22),at:age,angle:Math.atan2(dy,dx)});}
  r.bursts=r.bursts.filter(n=>age-n.at<.45).slice(-3);r.marks=r.marks.filter(n=>age-n.at<1.4).slice(-16);
 }
 function snapshot(b){const r=b.magistrateRig;return r?{...r,channels:{...r.channels},from:{...r.from},torso:{...r.torso},gaze:{...r.gaze},velocity:{...r.velocity},feet:r.feet.map(f=>({...f,from:f.from?{...f.from}:null,to:f.to?{...f.to}:null})),arches:r.arches.map(n=>({...n})),cloth:r.cloth.map(n=>({...n})),marks:[],bursts:[],fired:new Set()}:null;}
 // The Magistrate imprisons the player in a portrait. Its opponent is a painted
 // double: one visible target, familiar weapon rhythms, and delayed echoes.
 // Each painted chapter has 15% less health than the previous .85-scaled budget.
 const PAINTED_HEALTH_SCALE=.85*.85;
 const Fight={
  recovery:2.35,
  bounds:{left:175,right:1361,top:230,bottom:875},easel:{x:1040,y:700,w:320,h:480},
  active:b=>!!b?.inkFight,
  inside:b=>!!b?.inkFight&&['duel','tear'].includes(b.inkFight.mode),
  locked:b=>!!b?.inkFight&&['enter','tear','exit'].includes(b.inkFight.mode),
  damageScale(b){const f=b.inkFight;if(!f)return b.phase>=3?0:null;return this.locked(b)?0:f.mode==='finish'?1.8:f.open>0?1.05:.16;},
  floor(b){const f=b.inkFight;if(!f)return b.phase>=3?b.maxHp*.33:0;if(f.mode==='enter')return f.startHp;if(['exit','finish'].includes(f.mode))return f.mode==='exit'?b.maxHp*.011*PAINTED_HEALTH_SCALE:0;return f.startHp*[.66,.33,.035][f.world];},
  stain(f,v){f.markSerial=(f.markSerial||0)+1;f.marks.push({...v,at:f.total,id:f.markSerial});if(f.marks.length>420)f.marks.shift();},
  shot(b,shot){const f=b?.inkFight;if(!f||f.mode!=='duel'||!shot.attack||shot.type!=='espresso'||shot.age<(shot.inkNext||0))return;shot.inkNext=shot.age+.08;this.stain(f,{kind:'attack',x:shot.px,y:shot.py+18,angle:Math.atan2(shot.vy,shot.vx),len:30,width:7,colour:'#8c969e',seed:shot.id});},
  attack(b,p,a){const f=b?.inkFight;if(!f||f.mode!=='duel')return;this.stain(f,{kind:'attack',x:p.x,y:p.y,angle:a.angle,len:a.weapon==='espresso'?32:125,width:a.step===3?19:10,colour:a.weapon==='espresso'?'#748f92':'#b9a484',seed:f.markSerial});f.memory.push({x:p.x,y:p.y,angle:a.angle,weapon:a.weapon,step:a.step,at:f.total});f.memory=f.memory.filter(v=>f.total-v.at<12).slice(-8);},
  wound(b,p){const f=b?.inkFight;if(f?.mode==='duel')this.stain(f,{kind:'blood',x:p.x,y:p.y,len:44,angle:f.total,width:34,colour:'#9e2e4c',seed:f.markSerial});},
  hit(b,p,impact){const f=b?.inkFight;if(f?.mode==='duel')this.stain(f,{kind:'blood',x:b.x,y:b.y,len:40,angle:impact.angle||0,width:24,colour:'#b74960',seed:f.markSerial});},
  begin(b,p,api){b.hp=b.maxHp*.33*PAINTED_HEALTH_SCALE;api.clear(b.id);api.inkScene?.(b);b.majorPlan=null;b.forceMove=null;b.phasePending=false;b.staggerReady=false;b.stagger=0;b.opening=0;b.charge=0;b.motionLift=0;b.inkFight={mode:'enter',age:0,total:0,from:{x:b.x,y:b.y},playerFrom:{x:p.x,y:p.y},startHp:b.maxHp*.33*PAINTED_HEALTH_SCALE,weapon:api.weapon?.()||'baguette',world:0,previousWorld:0,worldBlend:0,marks:[],memory:[],echoes:[],serial:0,open:0,next:1.15,cues:new Set(),gait:0};b.majorState='inkEnter';b.hint='He is making room for you in his collection.';api.event('inkEnter',{});},
  cue(f,api,key,type){if(f.cues.has(key))return;f.cues.add(key);api.event(type,{});},
  sequence(b,p,api){const f=b.inkFight,n=f.chapterSerial||0;f.chapterSerial=n+1;f.serial++;const decks=[
    [['rush','crescent','rush'],['sweep','relocate','rush','sweep'],['echo','rush','echo','rush']],
    [['relocate','wall','stamp','wall','rush'],['rush','stamp','stamp','stamp','sweep'],['cross','echo','wall','rush']],
    [['rush','ray','ring','rush','ray','sweep'],['relocate','ray','ray','ray','rush'],['rush','rush','echo','rush','ring','rush']]
   ],names=[['HUNT BENEATH THE MOON','THE REAPING PORTRAIT','THE SECOND SELF'],['THE CATHEDRAL CLOSES','NAILS FROM HEAVEN','THROUGH THE THORNS'],['THE SUN PURSUES','THE BLEEDING HORIZON','THE LAST REFLECTION']];
   f.act={age:0,zones:[],bolts:[],motions:[],echoes:[],steps:decks[f.world][n%3],index:0,beat:null,kind:n%3,angle:Math.atan2(p.y-b.y,p.x-b.x),start:{x:b.x,y:b.y},name:names[f.world][n%3]};
   b.majorMove={name:f.act.name,pattern:'paintedDouble'};this.beat(b,p,api);api.event('inkPaint',{kind:n%3});
  },
  beat(b,p,api){const f=b.inkFight,q=f.act,kind=q.steps[q.index++],coffee=f.weapon==='espresso',point=(x,y)=>({x:clamp(x,235,1301),y:clamp(y,285,820)}),from={x:b.x,y:b.y},a=Math.atan2(p.y-b.y,p.x-b.x),tell=f.world===2?.86:1.02,beat={kind,age:0,tell,live:.35,rest:.20,from,angle:a,zones:[],to:null,track:false};q.beat=beat;q.angle=a;f.facing=a;f.moving=false;f.lift=0;
   const zone=(v,wait=tell,duration=.35)=>{const z={...v,age:0,delay:wait,duration,life:wait+duration,damage:kind==='stamp'?25:kind==='wall'?24:28,source:'magistrate',owner:b.id,major:true,pattern:'paintedDouble',kind:'eclipse',inkDouble:true,inkWorld:f.world,inkCoffee:coffee,inkKind:kind,inkOrder:q.index};q.zones.push(z);beat.zones.push(z);api.zone(z);return z;};
   const targetRush=()=>{const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1,extend=q.index===q.steps.length?95:195;let to=point(p.x+dx/d*extend,p.y+dy/d*extend);if(Math.hypot(to.x-b.x,to.y-b.y)<240){const away=Math.atan2(550-b.y,768-b.x);to=point(b.x+Math.cos(away)*480,b.y+Math.sin(away)*360);}return to;};
   if(kind==='relocate'){beat.tell=0;beat.to=point(p.x<768?1200:335,p.y<550?740:355);beat.live=Math.max(.6,Math.hypot(beat.to.x-b.x,beat.to.y-b.y)/650);beat.rest=.1;b.hint='Follow your double. Watch where it raises its weapon.';}
   if(kind==='rush'||kind==='cross'){beat.to=targetRush();beat.angle=Math.atan2(beat.to.y-b.y,beat.to.x-b.x);beat.live=clamp(Math.hypot(beat.to.x-b.x,beat.to.y-b.y)/1000,.32,.72);beat.track=true;const length=Math.hypot(beat.to.x-b.x,beat.to.y-b.y);zone({shape:'line',x:b.x,y:b.y,angle:beat.angle,length,width:coffee?92:102,inkPath:true},tell,beat.live);b.hint='SIDESTEP THE INK TRAIL · it locks before the rush.';}
   if(kind==='sweep'){beat.live=.88;beat.angle=a-1.25;zone({shape:'line',x:b.x,y:b.y,angle:beat.angle,length:coffee?510:430,width:58,sweep:2.5,inkBlade:true},tell,beat.live);b.hint='CIRCLE BEHIND · the raised blade sweeps across the floor.';}
   if(kind==='crescent'||kind==='ring'){beat.live=kind==='ring'?1.7:1.4;const gap=kind==='ring'?1.6:2.2,span=Math.PI*2-gap;beat.angle=a;zone({shape:'arc',x:b.x,y:b.y,angle:a,arc:span,r:70,inner:25,expand:kind==='ring'?780:580,inkWave:true},tell,beat.live);b.hint='TRAVELLING CRESCENT · dash through the edge or circle into its open back.';}
   if(kind==='wall'){const side=p.x<768?1:-1,x=side>0?1320:216,gap=clamp(p.y+(p.y<550?130:-130),365,745),half=110;beat.live=2.65;beat.rest=.18;beat.gap=gap;for(const [y,len]of [[235,gap-half-235],[gap+half,865-gap-half]])if(len>2)zone({shape:'line',x,y,angle:Math.PI/2,length:len,width:62,travel:{x:-side*1100,y:0},inkWall:true,inkGap:gap},1.08,beat.live);beat.tell=1.08;b.hint='THROUGH THE GAP · the thorn wall travels across the canvas.';}
   if(kind==='stamp'){beat.tell=.92;beat.live=.32;beat.rest=.12;zone({shape:'circle',x:p.x,y:p.y,r:123,inkFall:true},beat.tell,beat.live);b.hint='KEEP MOVING · falling stakes strike your last position.';}
   if(kind==='ray'){beat.tell=.94;beat.live=.48;beat.rest=.20;const k=(q.index+(f.serial%2)*2)%4,origins=[{x:195,y:245},{x:1341,y:245},{x:1341,y:855},{x:195,y:855}],origin=origins[k];beat.from=origin;beat.angle=Math.atan2(p.y-origin.y,p.x-origin.x);beat.track=true;zone({shape:'line',...origin,angle:beat.angle,length:1420,width:96,inkRay:true},beat.tell,beat.live);b.hint='CROSS THE RAY · move when its ink trail locks.';}
   if(kind==='echo'){beat.tell=1.10;beat.live=.38;beat.rest=.25;const memories=f.memory.filter(v=>f.total-v.at>1).slice(-2);if(!memories.length)memories.push({x:p.x,y:p.y,angle:a,weapon:f.weapon});for(const [i,v]of memories.entries()){const at=beat.tell+i*.50,angle=v.angle+(coffee?0:.3);q.echoes.push({...v,angle,at:q.age+at,weapon:f.weapon});zone({shape:'line',x:v.x-Math.cos(angle)*90,y:v.y-Math.sin(angle)*90,angle,length:coffee?680:420,width:100,inkEcho:true},at,.34);}beat.live+=Math.max(0,memories.length-1)*.5;b.hint='LEAVE YOUR OLD FOOTSTEPS · painted echoes cut along your previous attacks.';}
   beat.duration=beat.tell+beat.live+beat.rest;
  },
  walkDouble(b,p,dt,orbit=false){const f=b.inkFight,dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1,a=Math.atan2(dy,dx),side=f.serial%2?1:-1,approach=d>270?1:d<170?-.7:0,speed=orbit?150:220,vx=dx/d*approach-dy/d*side*(orbit?.9:.35),vy=dy/d*approach+dx/d*side*(orbit?.9:.35),len=Math.hypot(vx,vy)||1,old={x:b.x,y:b.y};b.x=clamp(b.x+vx/len*speed*dt,235,1301);b.y=clamp(b.y+vy/len*speed*dt,285,820);const moved=Math.hypot(b.x-old.x,b.y-old.y);f.gait+=moved/90;f.moving=moved>.05;f.facing=a;},
  combat(b,dt,p,api){const f=b.inkFight;f.open=Math.max(0,f.open-dt);f.worldBlend=1;f.lift=0;f.moving=false;
   if(!f.act&&b.hp<=this.floor(b)+1e-4){api.clear(b.id);f.echoes=[];if(f.world<2){f.previousWorld=f.world;f.world++;f.chapterSerial=0;f.chapterDone=0;f.mode='tear';f.age=0;f.worldBlend=0;api.event('inkTear',{world:f.world});}else{f.mode='exit';f.age=0;b.hp=b.maxHp*.011*PAINTED_HEALTH_SCALE;api.event('inkShatter',{});}return;}
   if(f.act){const q=f.act,k=q.beat;q.age+=dt;k.age+=dt;f.facing=k.angle;
    if(k.track&&k.age<k.tell-.42){if(k.kind==='rush'||k.kind==='cross'){const dx=p.x-k.from.x,dy=p.y-k.from.y,d=Math.hypot(dx,dy)||1,extend=q.index===q.steps.length?95:195;let to={x:clamp(p.x+dx/d*extend,235,1301),y:clamp(p.y+dy/d*extend,285,820)};if(Math.hypot(to.x-k.from.x,to.y-k.from.y)>240)k.to=to;k.angle=Math.atan2(k.to.y-k.from.y,k.to.x-k.from.x);k.zones[0].angle=k.angle;k.zones[0].length=Math.hypot(k.to.x-k.from.x,k.to.y-k.from.y);}else{k.angle=Math.atan2(p.y-k.from.y,p.x-k.from.x);k.zones[0].angle=k.angle;}}
    for(const z of k.zones)z.inkLocked=!k.track||k.age>=k.tell-.42;
    if(k.to&&k.age>=k.tell){const u=ease((k.age-k.tell)/k.live),x=lerp(k.from.x,k.to.x,u),y=lerp(k.from.y,k.to.y,u);f.gait+=Math.hypot(x-b.x,y-b.y)/90;b.x=x;b.y=y;f.moving=u<1;f.lift=k.kind==='relocate'?Math.sin(u*Math.PI)*32:0;}
    else if(['wall','stamp','echo','ray'].includes(k.kind))this.walkDouble(b,p,dt,true);
    if(k.kind==='sweep')f.facing=k.angle+2.5*clamp((k.age-k.tell)/k.live);
    for(const z of k.zones)if(!z.inkStamped&&z.age>=z.delay){z.inkStamped=true;this.stain(f,{kind:'stroke',x:z.x,y:z.y,angle:z.angle||0,len:z.length||z.r||160,width:z.width||38,colour:z.inkEcho?'#7b526d':f.world===1?'#597569':'#973e52',seed:f.markSerial});}
    if(k.age>=k.duration){if(q.index<q.steps.length)this.beat(b,p,api);else{f.act=null;f.chapterDone=(f.chapterDone||0)+1;f.open=this.recovery;f.next=this.recovery+.20;f.lift=0;b.hint='OPENING · close in and attack your double.';api.event('inkOpening',{});}}return;
   }
   f.next-=dt;if(f.open<=0)this.walkDouble(b,p,dt);if(f.next<=0)this.sequence(b,p,api);
  },
  update(b,dt,p,api){if(!b.inkFight){if(b.phase<3||b.magistrateInspect)return false;this.begin(b,p,api);}const f=b.inkFight;f.age+=dt;f.total+=dt;b.stagger=b.opening=0;b.staggerReady=false;b.majorClock=0;b.majorPlan=null;
   if(f.mode==='enter'){const t=f.age;p.invulnerable=Math.max(p.invulnerable,.25);p.attack=null;p.dash=0;p.moving=false;
    if(t<2.15){p.x=f.playerFrom.x;p.y=f.playerFrom.y;}else if(t<3.65){const u=ease((t-2.15)/1.5);p.x=lerp(f.playerFrom.x,b.x+135,u);p.y=lerp(f.playerFrom.y,b.y-125,u);p.inkCaptured={angle:lerp(0,-.85,u),scale:1};}else if(t<4.65){const u=ease((t-3.65));p.x=lerp(b.x+135,1040,u);p.y=lerp(b.y-125,440,u)-Math.sin(u*Math.PI)*80;p.inkCaptured={angle:lerp(-.85,.12,u),scale:lerp(1,.08,u)};}else{p.inkCaptured={angle:0,scale:0};}
    if(t>.9)this.cue(f,api,'easel','inkEasel');if(t>2.15)this.cue(f,api,'grab','inkGrab');if(t>3.65)this.cue(f,api,'throw','inkThrow');if(t>4.65)this.cue(f,api,'through','inkCanvas');
    if(t>=7.8){f.mode='duel';f.age=0;f.open=0;f.worldBlend=1;b.majorState='inkDuel';b.x=768;b.y=485;p.x=768;p.y=730;delete p.inkCaptured;p.invulnerable=.8;f.next=1.6;b.hint='DEFEAT YOUR PAINTED DOUBLE · dodge its combo, then strike its recovery.';}return true;
   }
   if(f.mode==='tear'){p.invulnerable=Math.max(p.invulnerable,.2);f.worldBlend=ease(f.age/2.1);if(f.age>=2.4){f.mode='duel';f.age=0;f.next=.8;b.hint='The portrait changes. Your double remembers your attacks.';}return true;}
   if(f.mode==='exit'){p.invulnerable=Math.max(p.invulnerable,.2);const u=ease((f.age-2.3)/1.8);if(f.age>1.8)p.inkCaptured={angle:lerp(.3,0,u),scale:f.age<2.3?1-ease((f.age-1.8)/.5):ease((f.age-2.3)/.35)};if(f.age>=2.3){p.x=lerp(1040,800,u);p.y=lerp(440,700,u)-Math.sin(u*Math.PI)*65;b.x=1040;b.y=660;}if(f.age>=4.4){f.mode='finish';f.age=0;delete p.inkCaptured;api.inkScene?.(b);b.x=1040;b.y=660;p.x=800;p.y=700;f.open=99;b.majorState='inkFinish';b.hint='THE PORTRAIT IS BROKEN · finish the Magistrate.';api.event('inkShatter',{});}return true;}
   if(f.mode==='finish'){b.majorState='inkFinish';b.hint='THE PORTRAIT IS BROKEN · finish the Magistrate.';return true;}
   b.majorState='inkDuel';this.combat(b,dt,p,api);return true;
  }
 };

 return{clamp,lerp,ease,rest,poses,mix,compile,action,target,init,prepare,walk,step,snapshot,Fight};
});
