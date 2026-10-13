/* The dying star casts a refuge; the shattered observatory becomes ten small worlds. */
(function(root,factory){const api=factory();root.MOROGUE_STAR_MECHANICS=api;if(typeof module==='object'&&module.exports)module.exports=api;})(globalThis,function(){
 'use strict';
 const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>(t=clamp(t))*t*(3-2*t),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const LAYOUT=[[390,475,'anchor'],[640,424,'crumble'],[892,424,'hot'],[1140,475,'anchor'],[1230,650,'drift'],[1010,753,'crumble'],[768,714,'anchor'],[525,753,'hot'],[305,650,'crumble'],[768,552,'anchor']];
 const CORE_ROUTE=[9,1,0,8,7,6,5,4,3,2,1,9,6];
 const state=b=>b.starFight||(b.starFight={age:0,active:null,lastShadow:0,cycle:0,blend:0,leaps:0,falls:0,platforms:[]});
 function platforms(){return LAYOUT.map(([x,y,kind],id)=>({id,x,y,bx:x,by:y,rx:76,ry:41,kind,crumbleAt:null,goneUntil:0,hot:false,warning:false,protectedUntil:0}));}
 const inside=(q,p,margin=0)=>Math.hypot((p.x-q.x)/(q.rx+margin),(p.y-q.y)/(q.ry+margin))<=1;
 const solid=(q,f)=>q.goneUntil<=f.age;
 function support(b,p){const f=b?.starFight;return f?.platforms.find(q=>solid(q,f)&&inside(q,p,6))||null;}
 function next(b,p,dx=p.dx,dy=p.dy){const f=b?.starFight;if(!f?.galaxy)return null;const from=support(b,p)||f.platforms.find(q=>q.id===p.starPlatform),n=Math.hypot(dx,dy);if(!from||n<.1)return null;
  return f.platforms.filter(q=>q!==from&&solid(q,f)&&dist(from,q)<=335).map(q=>{const d=dist(p,q),dot=((q.x-p.x)*dx+(q.y-p.y)*dy)/(Math.max(1,d)*n);return {q,dot,score:dot*3-d/750};}).filter(v=>v.dot>.38).sort((a,b)=>b.score-a.score)[0]?.q||null;
 }
 function leap(b,p){const f=b?.starFight;if(!f?.galaxy||f.active?.kind==='reveal'||p.starLeap)return false;const q=next(b,p);if(!q)return false;p.starLeap={from:{x:p.x,y:p.y},to:q.id,age:0,duration:.48};p.attack=null;p.cast=null;f.leaps++;return true;}
 function safePoint(z){const t=ease((z.age||0)/Math.max(.01,z.delay));return {x:lerp(z.safeFrom.x,z.safeTo.x,t),y:lerp(z.safeFrom.y,z.safeTo.y,t),rx:z.safeRx||86,ry:z.safeRy||58};}
 function contains(z,p,margin=0){if(p.starLeap)return false;if(z.starEruption){const q=safePoint(z);return !inside(q,p,-margin);}
  if(z.starMeteor)return Math.hypot((p.x-z.x)/(z.r+margin),(p.y-z.y)/(z.r*.68+margin))<=1;
  return null;
 }
 function zone(b,api,v){const z={shape:'circle',x:768,y:575,r:900,age:0,source:'star',owner:b.id,major:true,kind:'eclipse',counterKey:'starGalaxy',damage:34+Math.min(b.phase,3)*4,...v};z.life=z.delay+z.duration;api.zone(z);return z;}
 function start(b,p,api,kind){const f=state(b);api.clear(b.id);b.majorPlan=null;b.charge=0;b.motionLift=0;b.majorState='star'+kind;b.majorMove={name:kind==='reveal'?'The Observatory Unravels':kind==='galaxy'?'A Sky Without Ground':'The Dying Shadow',pattern:'star'+kind};
  const a=f.active={kind,age:0,duration:kind==='reveal'?3.2:kind==='galaxy'?22:5.6,from:{x:b.x,y:b.y},marks:[]};b.majorClock=a.duration;b.opening=0;
  if(kind==='reveal'){f.galaxy=true;f.platforms=platforms();f.core={x:b.x+8,y:b.y-56,from:{x:b.x+8,y:b.y-56},id:CORE_ROUTE[0],hop:0,age:1.1};a.landing=f.platforms.reduce((q,v)=>dist(v,p)<dist(q,p)?v:q);a.playerFrom={x:p.x,y:p.y};p.starPlatform=a.landing.id;p.starSafe=a.landing.id;b.hint='CHASE THE DYING STAR · direction + DASH leaps to another world. Aim at the core from any island.';api.event('starUnfold',{id:'star'});}
  if(kind==='galaxy'){f.cycle++;a.heat=f.cycle%2?2:7;b.hint='CHASE THE DYING STAR · aim at its core from any island. The creature is still hunting you.';}
  if(kind==='shadow'){f.lastShadow=b.completedMoves||0;const from={x:p.x,y:p.y},to={x:clamp(p.x+(p.x<768?140:-140),280,1245),y:clamp(p.y+(p.y<580?40:-40),410,750)};
   a.eruption=zone(b,api,{starEruption:true,safeFrom:from,safeTo:to,safeRx:96,safeRy:69,delay:3.25,duration:.55,pattern:'starShadow'});a.marks.push(a.eruption);
   const cut={x:clamp(from.x+(to.x>from.x?-95:95),235,1300),y:from.y-70};a.marks.push(zone(b,api,{shape:'line',...cut,angle:Math.PI/2,length:140,width:36,delay:1.6,duration:.4,starTendril:true,pattern:'starTendril'}));a.reach={x:cut.x,y:cut.y+70,at:0,delay:1.6};
   b.hint='FOLLOW THE STAR’S SHADOW · stay beneath the dark, pale-edged refuge when the star erupts.';api.event('starGravity',{id:'star'});}
  return a;
 }
 function meteor(b,p,api,a){const z=zone(b,api,{x:p.x,y:p.y,r:39,starMeteor:true,delay:1.35,duration:.32,pattern:'starComet'});a.marks.push(z);a.reach={x:p.x,y:p.y,at:a.age,delay:z.delay};api.event('starStrain',{id:'star'});}
 function update(b,dt,p,api){const f=state(b);f.age+=dt;if(b.hp<=0){f.active=null;p.starLeap=null;return false;}const a=f.active;
  if(a){a.age+=dt;b.majorClock=Math.max(0,a.duration-a.age);a.marks=a.marks.filter(z=>z.age<z.life);
   if(a.kind==='reveal'){f.blend=ease(a.age/3.2);const t=ease(a.age/2.1),q=f.platforms[f.core.id];p.x=lerp(a.playerFrom.x,a.landing.x,t);p.y=lerp(a.playerFrom.y,a.landing.y,t);f.core.x=lerp(f.core.from.x,q.x+8,t);f.core.y=lerp(f.core.from.y,q.y-22,t);p.invulnerable=Math.max(p.invulnerable||0,.2);}
   if(a.kind==='shadow'){const t=a.age;const q=safePoint(a.eruption);b.opening=t>3.9?1.5:.58;if(t>3.9)b.hint='THE STAR DIMS · attack while its feeding tendrils recoil.';a.look={x:p.x,y:p.y};a.refuge=q;}
   if(a.kind==='galaxy'){
    f.blend=1;const t=a.age,c=f.core;c.age+=dt;if(c.age>=6.5){const old=f.platforms[c.id];old.protectedUntil=f.age+1.1;c.hop=(c.hop+1)%CORE_ROUTE.length;c.id=CORE_ROUTE[c.hop];c.from={x:c.x,y:c.y};c.age=0;api.event('starCoreDrift',{id:'star'});}
    const refuge=f.platforms[c.id];refuge.protectedUntil=f.age+1.2;refuge.crumbleAt=null;refuge.goneUntil=0;
    for(const q of f.platforms){const ox=q.x,oy=q.y;if(q.kind==='drift'){q.x=q.bx+Math.sin(f.age*.28)*22;q.y=q.by+Math.sin(f.age*.36)*13;}q.dx=q.x-ox;q.dy=q.y-oy;q.warning=q.id===a.heat&&t>=1&&t<3&&q.protectedUntil<f.age;q.hot=q.id===a.heat&&t>=3&&t<5.4&&q.protectedUntil<f.age;
     if(q.crumbleAt!==null&&f.age>=q.crumbleAt&&q.protectedUntil<f.age){q.goneUntil=f.age+4.4;q.crumbleAt=null;api.event('starPlatformBreak',{id:'star'});}}
    const flight=ease(c.age/1.05);c.x=lerp(c.from.x,refuge.x+8,flight);c.y=lerp(c.from.y,refuge.y-22,flight)-Math.sin(flight*Math.PI)*36;
    for(const [i,at]of [1.3,4.8,8.3,11.8,15.3,18.8].entries())if(t>=at&&!a['comet'+i]){a['comet'+i]=true;meteor(b,p,api,a);}
    // The exposed core can be hit from any ledge; actual weapon range still applies.
    const opening=c.age>=1.05;
    b.hint=c.age<1.05?'THE CORE DRIFTS · aim for where it lands while the creature pursues!':'ATTACK THE DYING STAR · hit its core from any island; dodge the reaching tendrils.';
    const orbit=f.age*.55,pt={x:clamp(p.x+Math.cos(orbit)*95,280,1250),y:clamp(p.y+82+Math.sin(orbit)*30,440,810)},d=dist(b,pt),k=Math.min(1,145*dt/Math.max(1,d));b.x=lerp(b.x,pt.x,k);b.y=lerp(b.y,pt.y,k);b.opening=opening?2:0;a.look={x:p.x,y:p.y};
   }
   if(a.age>=a.duration){api.cancel(b.id,'starGalaxy');if(a.kind==='shadow'){f.active=null;b.completedMoves++;b.majorState='recovery';b.majorClock=.65;b.opening=1.5;}else start(b,p,api,'galaxy');}return true;
  }
  if(b.phasePending||['intro','phase'].includes(b.majorState))return false;
  if(b.majorState!=='approach'||b.majorClock>dt||b.forceMove||b.forceRitual)return false;
  if(b.phase===3){start(b,p,api,'reveal');return true;}
  if((b.completedMoves||0)-f.lastShadow>=3){start(b,p,api,'shadow');return true;}return false;
 }
 function move(b,p,old,dt,api){const f=b?.starFight;if(!f?.galaxy||b.hp<=0){p.starLeap=null;p.starPlatform=null;return;}if(f.active?.kind==='reveal')return;
  if(p.starLeap){const j=p.starLeap;j.age+=dt;const q=f.platforms[j.to],t=clamp(j.age/j.duration);p.x=lerp(j.from.x,q.x,t);p.y=lerp(j.from.y,q.y,t);p.moving=true;if(t>=1){p.starLeap=null;p.land=.13;p.starPlatform=q.id;f.unsupported=0;api.event('starLand',{id:'star'});}else return;}
  const last=f.platforms.find(q=>q.id===p.starPlatform);if(last&&solid(last,f)&&inside(last,old,8)){p.x+=last.dx||0;p.y+=last.dy||0;}
  // Walking slides along the rim of a solid island. Deliberate leaps still
  // cross the void; a warned crumbling island can still collapse beneath you.
  if(last&&solid(last,f)&&inside(last,old,8)&&!support(b,p)){
   const rx=last.rx-3,ry=last.ry-3,dx=p.x-last.x,dy=p.y-last.y,n=Math.hypot(dx/rx,dy/ry);
   if(n>1){p.x=last.x+dx/n;p.y=last.y+dy/n;}
  }
  const q=support(b,p);if(q){p.starPlatform=q.id;f.unsupported=0;if(!q.hot)p.starSafe=q.id;
   if(q.kind==='crumble'&&q.crumbleAt===null&&q.protectedUntil<f.age&&!f.platforms.some(v=>v.crumbleAt!==null)){q.crumbleAt=f.age+3.4;api.event('starPlatformWarning',{id:'star'});}
   if(q.hot)api.fall(46,'starHeat');return;}
  f.unsupported=(f.unsupported||0)+dt;if(f.unsupported<.16)return;f.unsupported=0;f.falls++;
  const safe=f.platforms.find(v=>v.id===p.starSafe&&solid(v,f)&&!v.hot&&v.crumbleAt===null)||f.platforms.filter(v=>v.kind==='anchor').reduce((a,v)=>dist(v,p)<dist(a,p)?v:a);
  p.x=safe.x;p.y=safe.y;p.dash=0;p.attack=null;p.cast=null;p.starPlatform=safe.id;const protectedBefore=p.invulnerable>0;api.fall(46,'starFall');if(!protectedBefore)p.invulnerable=Math.max(p.invulnerable||0,1);p.dashCharges=Math.max(1,p.dashCharges);p.starFall=.3;api.event('starFall',{id:'star'});
 }
 function canPursue(b){return !b.starFight?.active&&['approach','recovery'].includes(b.majorState);}
 function channels(b,rest){const a=b.starFight?.active;if(!a)return null;const t=a.age,c={...rest};if(a.kind==='reveal')return {...c,bodyY:-ease(t/3)*28,spread:1.2,reachL:1.15,reachR:1.25,curl:.2,feed:1,pulse:ease(t/3),eye:1};
  const z=a.eruption,charge=z&&z.age<z.delay?ease(z.age/z.delay):0,burst=z&&z.age>=z.delay?1-ease((z.age-z.delay)/.8):0,exposed=a.kind==='galaxy'&&b.opening>0,reach=a.reach?ease((t-a.reach.at)/1.1)*(1-ease((t-a.reach.at-1.4)/.5)):0;
  return {...c,bodyY:-charge*20+burst*15,roll:Math.sin(t*.7)*.09,head:-Math.sin(t*.7)*.09,starY:exposed?-56:-56-charge*36+burst*25,jaw:.3+charge*.7,spread:.5+burst*.65,reachL:.45+reach*.9,reachR:.6+reach*.65,curl:1-charge*.5,feed:exposed?.25:1,pulse:charge+burst,eye:1};
 }
 return {state,platforms,support,next,leap,move,update,start,inside,solid,safePoint,contains,canPursue,channels,LAYOUT,CORE_ROUTE,clamp,ease};
});
