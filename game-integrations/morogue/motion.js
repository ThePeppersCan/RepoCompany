/* Native-pixel character rig. All colours, faces and garments come from the saved creator look. */
(function(root){
 'use strict';
 const TAU=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));

 // Dual grips are presentation data. No random numbers or combat state are consumed.
 function espressoPose(pose,moving=false){
  const t=clamp(pose.phase),smooth=v=>(v=clamp(v))*v*(3-2*v),aim=pose.aimAngle||0,dx=Math.cos(aim),dy=Math.sin(aim),step=pose.step||1;
  const active=['windup','strike','recover'].includes(pose.kind),heavy=step===3;
  const lift=pose.kind==='windup'?smooth(t):active?1:0;
  const recoil=pose.kind==='strike'?Math.exp(-t*4.5):pose.kind==='recover'?Math.exp(-4.5)*(1-smooth(t)):0;
  const settle=pose.kind==='recover'?1-smooth(t):lift,beat=(pose.gait||0)*TAU;
  const hands=[0,1].map(i=>{
   const selected=heavy||i===(step===2?0:1),kick=selected?recoil:0,side=i?1:-1;
   const reach=9+settle*5-kick*(heavy?4.5:3),sway=moving?Math.sin(beat+side)*.8:Math.sin(beat*.4)*.3;
   return {x:24+dx*reach-dy*side*7,y:38+dy*reach*.65+side*3+sway-kick*2.2};
  });
  const kicks=[0,1].map(i=>(heavy||i===(step===2?0:1))?recoil:0);
  return {coffee:true,heavy,step,aim,angle:aim,tilt:0,lean:-dx*recoil*1.7,crouch:active?settle*.65:0,coil:0,drive:recoil,moving,active,hand:hands[1],hands,
   gunAngles:kicks.map((k,i)=>aim-(dx<0?-1:1)*(k*.24+(1-settle)*.22)),kicks};
 }

 // Presentation only: attack clocks and collision remain entirely in game.js.
 // Each channel shares its boundary poses; recovery lands on the next guard.
 function combatPose(pose,moving=false){
  if(pose.weapon==='espresso')return espressoPose(pose,moving);
  const t=clamp(pose.phase),smooth=v=>(v=clamp(v))*v*(3-2*v),mix=(a,b,v)=>a+(b-a)*v;
  const coffee=pose.weapon==='espresso',step=pose.step||1,reverse=step===2?-1:1,heavy=step===3;
  const aim=pose.aimAngle||0,dx=Math.cos(aim),dy=Math.sin(aim),active=['windup','strike','recover','whirl'].includes(pose.kind);
  let sweep=.48,drive=0,coil=0,lift=0,tilt=0,turn=0;
  if(active){
   const wind=-reverse*(heavy?1.48:1.16),end=heavy?TAU+wind:reverse*1.38;
   if(pose.kind==='windup'){const u=smooth(t);sweep=mix(.48,wind,u);coil=u;lift=u*(coffee?(heavy?9:2.5):1);tilt=u*.34;turn=-reverse*u;}
   else if(pose.kind==='strike'||pose.kind==='whirl'){const u=smooth(t);sweep=mix(wind,end,u);coil=1-u;drive=Math.sin(u*Math.PI*.85);lift=coffee?mix(heavy?9:2.5,heavy?-2:0,u):Math.sin(u*Math.PI)*(heavy?2:0);tilt=mix(.34,heavy?-1.02:-.65,u);turn=reverse*(2*u-1);}
   else{const u=smooth(t);sweep=mix(end,heavy?TAU+.48:.48,u);drive=Math.sin(Math.PI*.85)*(1-u);lift=coffee?(heavy?-2:0)*(1-u):0;tilt=(heavy?-1.02:-.65)*(1-u);turn=reverse*(1-u);}
  }
  if(pose.dashAttack&&!coffee&&active)sweep=pose.kind==='windup'?.48*(1-smooth(t)):pose.kind==='recover'?.48*smooth(t):0;
  const breath=pose.kind==='idle'?Math.sin((pose.gait||0)*2)*.18:0;
  const envelope=pose.kind==='windup'?smooth(t):pose.kind==='recover'?1-smooth(t):1;
  const lean=dx*(drive*4.5-coil*2)+turn*2,crouch=active?.5*envelope+coil*1.5+drive*(heavy?3:1.5):pose.kind==='run'?1:0;
  const angle=aim+(coffee?.15:sweep),guardX=24+dx*8-dy*5,guardY=40+dy*4;
  const hand={x:clamp(guardX+(coffee?dx*drive*(heavy?6:3):(Math.cos(angle)-dx)*5+(pose.dashAttack?dx*drive*5:0))+lean*.35,8,40),y:clamp(guardY+(coffee?-lift+drive*2:Math.sin(angle)*5)+crouch+breath,29,49)};
  return {angle,tilt:tilt*(dx<0?-1:1),lean,crouch,hand,turn,drive,coil,moving,active,coffee,heavy,aim,step};
 }

 // Authored player locomotion. Travel drives cadence; combat never waits for a pose.
 function locomotionPose(pose,view='right'){
  const smooth=v=>(v=clamp(v))*v*(3-2*v),mix=(a,b,t)=>a+(b-a)*t,side=view==='right'||view==='left',mirror=view==='left',t=clamp(pose.phase),coffee=pose.weapon==='espresso';
  const gait=(pose.gait||0)*1.35,beat=gait*TAU,run=pose.kind==='run',dash=pose.kind==='dash',land=pose.kind==='landing';
  const lift=run?Math.cos(beat*2)*.95:0,twist=run?Math.sin(beat)*1.6:0;
  let lean=run?(side?4.3+Math.sin(beat)*.9:twist*.8):0,drop=run?1.5:Math.sin(t*TAU)*.3,head=run?Math.sin(beat)*.025:0;
  if(dash){const drive=smooth(t/.23);lean=side?mix(3,8,drive)-smooth((t-.73)/.27)*2:0;drop=5+Math.sin(t*Math.PI)*4.5;head=side?.12*drive:0;}
  if(land){const u=1-smooth(t);lean=(side?6:0)*u;drop=5*u+Math.sin(t*Math.PI)*2.5;head=(side?.08:0)*u;}
  const hips=[{x:side?25:20,y:44+drop*.33+lift},{x:side?24:28,y:44+drop*.33+lift}];
  const legs=hips.map((hip,i)=>{
   const far=i===0,u=((gait+(far?.5:0))%1+1)%1,planted=u<.58,flight=clamp((u-.58)/.42),along=planted?14-28*u/.58:-14+28*smooth(flight),rise=planted?0:Math.sin(flight*Math.PI)*10;
   let foot={x:side?24+along:hip.x+(far?-1:1)+Math.sin(beat)*.7,y:63+(side?0:along*.1)-rise};
   let contact=planted,pitch=side?(planted?-.11+u*.48:Math.sin(flight*Math.PI)*-.65):0;
   if(!run){foot={x:hip.x+(far?-2:2),y:63};pitch=0;contact=true;}
   if(dash){foot={x:side?(far?mix(13,7,smooth(t/.4)):mix(34,39,smooth(t))):hip.x+(far?-4:4),y:far?60-Math.sin(t*Math.PI)*4:60+smooth(t)*3};contact=t<.12&&far||t>.84&&!far;pitch=far?-.55:.2;}
   if(land){const u=1-smooth(t),target=pose.bodyMoving?{x:side?24+along:hip.x+(far?-1:1),y:63-rise}: {x:hip.x+(far?-2:2),y:63};foot={x:mix(target.x,side?(far?7:39):hip.x+(far?-4:4),u),y:mix(target.y,far?60:63,u)};pitch=(far?-.45:.15)*u;contact=!far||t>.6;}
   const vx=foot.x-hip.x,vy=foot.y-hip.y,d=Math.max(1,Math.hypot(vx,vy)),bend=Math.sqrt(Math.max(0,12*12-Math.min(23.8,d)**2/4))*(side?.9:(far?-.35:.35));
   const knee={x:(hip.x+foot.x)*.5+vy/d*bend,y:(hip.y+foot.y)*.5-vx/d*bend};return {hip,knee,foot,pitch,contact};
  });
  const arms=[0,1].map(i=>{const far=i===0,sign=far?-1:1,swing=Math.sin(beat+(far?Math.PI:0)),shoulder={x:side?24+lean*.65:24+sign*6+twist*.35,y:31+drop+lift+(far?0:1)};
   let elbow={x:shoulder.x+(side?-swing*5:sign*3),y:shoulder.y+9},hand={x:shoulder.x+(side?3+swing*(far?8:coffee?3:5):sign*4),y:shoulder.y+5-swing*(side?2.8:5)};
   if(!run){hand={x:side?30:24+sign*9,y:40+drop};elbow={x:side?22:24+sign*8,y:38+drop};}
   if(dash||land){const u=dash?1:1-smooth(t),a=dash?smooth(t):1,dx=side?(far?mix(36,31,a):mix(17,22,a)):24+sign*11,dy=far?37+drop*.4:40+drop*.45;hand={x:mix(hand.x,dx,u),y:mix(hand.y,dy,u)};elbow={x:mix(elbow.x,side?(far?28:13):24+sign*13,u),y:mix(elbow.y,42+drop*.45,u)};}
   return {shoulder,elbow,hand};
  });
  if(pose.kind==='infection'){
   const reach=smooth(t/.12),bite=smooth((t-.22)/.10),seize=smooth((t-.35)/.13)*(1-smooth((t-.76)/.24));
   drop=seize*6;lean=-seize*2;head=-seize*.09;
   for(let i=0;i<2;i++){const sign=i?1:-1,hip=legs[i].hip;hip.y=44+drop*.3;legs[i].knee={x:hip.x+sign*(2+seize*3),y:54+drop*.4};legs[i].foot={x:hip.x+sign*(3+seize*2),y:63};arms[i].shoulder.y=32+drop;}
   const h=arms[1];h.hand={x:mix(mix(33,38,reach),26,bite),y:mix(mix(42,34,reach),36,bite)};
   const release=smooth((t-.76)/.24);h.hand.x=mix(mix(h.hand.x,34,seize),33,release);h.hand.y=mix(mix(h.hand.y,40+drop,seize),42,release);h.elbow={x:35,y:37+drop};
   arms[0].hand={x:mix(17,23,seize),y:42+drop*.5};arms[0].elbow={x:16,y:40+drop*.5};
  }
  const hand=arms[1].hand,move=pose.moveAngle??pose.aimAngle??0,angle=move+(dash?(coffee?.05:2.6):land?(coffee?.08:2.6*(1-smooth(t))+.8*smooth(t)):coffee?.12:.8+Math.sin(beat)*.13);
  return {lean,drop,bob:lift,head,twist,legs,arms,weaponPose:{angle,tilt:coffee?(mirror?-1:1)*(dash?.22:run?Math.sin(beat)*.075:land?.22*(1-smooth(t)):0):0,drive:dash?1:0,heavy:false}};
 }
 function create(model,pack,look,makeCanvas){
  const original=root.createCharacterAnimator(model,pack,look,makeCanvas),selection=model.normalize(look),cache=new Map();
  const rgba=h=>{const n=parseInt(h.replace('#',''),16);return [n>>16&255,n>>8&255,n&255,255];};
  const palette=pack.palette.map(rgba);
  for(const key of ['skin','hair_colour','eye_colour'])for(const [id,h]of Object.entries(model.selected(key,selection).overrides))palette[+id]=rgba(h);
  function material(slot){const item=model.selected(slot,selection),dye=model.selected(slot+'_colour',selection),out=[];for(const [i,shade]of Object.entries(item.dye_slots))if(!out[shade])out[shade]=dye.ramp?rgba(dye.ramp[shade]):palette[+i];return [0,1,2,3].map(i=>out[i]||out[2]||palette[3]);}
  const pants=material('trousers'),shirt=material('shirt'),boots=material('shoes'),skin=[2,3,4,5].map(i=>palette[i]);
  const shorts=selection.trousers==='trousers_shorts',skirt=selection.trousers==='trousers_apronskirt';
  function sockets(result,view,lean=0,drop=0){
   const side=view==='left'||view==='right',mirror=x=>view==='left'?47-x:x;
   // The neck seam is copied from row 28; use the exact same lean and crouch as the torso.
   result.capeSocket={x:mirror((side?21:23.5)+lean*.8),y:29+Math.round(drop),side};
   if(!result.grip)result.grip={x:mirror(side?27:34),y:43};
   return result;
  }
  function frame(view='front',index=-1,pose=null){
   if(!pose||pose.kind==='idle'&&!pose.combat&&!pose.body)return sockets(original.frame(view,index),view);
   const emote=pose.kind==='emote'?pose.emote:null,steps=emote?63:pose.combat||pose.body?47:11;
   const gaitSteps=pose.body?48:12,phase=Math.round(clamp(pose.phase)*steps)/steps,gait=Math.floor((pose.gait||0)*(pose.body?1.35:1)*gaitSteps)%gaitSteps,key=[view,pose.kind,!!pose.chainRide,emote,phase,gait,pose.step,pose.weapon,pose.style,Math.round((pose.aimAngle||0)*(pose.combat?24:4)),!!pose.combat,!!pose.combatMoving,!!pose.dashAttack,!!pose.body,!!pose.bodyMoving,Math.round((pose.moveAngle||0)*12)].join(':');
   if(cache.has(key))return cache.get(key);
   const source=original.frame(view==='left'?'right':view,-1).getContext('2d').getImageData(0,0,48,68).data;
   const rig=pose.combat?combatPose({...pose,phase},!!pose.combatMoving):null,mirrorX=x=>view==='left'?47-x:x;
   const body=pose.body?locomotionPose({...pose,phase,gait:gait/gaitSteps/1.35},view):null;
   let grip=null;const grips=[];const data=new Uint8ClampedArray(48*68*4),side=view==='left'||view==='right',dash=pose.kind==='dash',run=pose.kind==='run',hurt=pose.kind==='hurt';
   const winding=pose.kind==='windup',whirl=pose.kind==='whirl',striking=pose.kind==='strike'||whirl,recover=pose.kind==='recover',heavy=pose.step===3;
   const acrobatic=pose.kind==='roll'||pose.kind==='flip',tuck=acrobatic?Math.sin(clamp((phase-.08)/.84)*Math.PI)**.6:0;
   const casting=pose.kind==='cast'||pose.kind==='vault',gesture=pose.style||'cast';
   const beat=gait/12*TAU,swing=run?Math.sin(beat):0;
   const impulse=striking?Math.sin(phase*Math.PI*.7):recover?(1-phase)*.65:0;
   const castMotion=phase<.24?phase/.24:Math.max(0,1-(phase-.24)/.76)**.65;
   const castBend=casting?gesture==='guard'?4*phase:['grow','heave'].includes(gesture)?Math.sin(phase*Math.PI)*5:gesture==='focus'?2*phase:gesture==='tide'?Math.sin(phase*Math.PI)*2:0:0;
   const blend=clamp(phase/.13)*clamp((1-phase)/.16),rhythm=phase*TAU*(emote==='jig'?6:emote==='dance'?5:4);
   const emoteBend=emote==='bow'?Math.sin(phase*Math.PI)**2*6:emote==='flip'?Math.sin(phase*Math.PI)**2*5:['dance','jig'].includes(emote)?(1+Math.sin(rhythm))*1.5*blend:0;
   const crouch=body?body.drop:rig?rig.crouch:emote?emoteBend:whirl?4:dash?9:winding?(heavy?5:2)*phase:hurt?3:run?1+Math.abs(Math.sin(beat))*2:casting?castBend:impulse*2;
   const lean=body?body.lean:rig?rig.lean*(view==='left'?-1:1):side?(emote==='bow'?emoteBend:dash?8:run?3:winding?-2*phase:striking?5*impulse:recover?3*(1-phase):hurt?-3:casting?(gesture==='focus'?4:gesture==='guard'?-2:gesture==='tick'?-1:3)*phase:0):0;
   const bob=body?body.bob:run?-Math.abs(Math.sin(beat))*3:casting&&gesture==='heave'?phase*3:casting&&gesture==='levitate'?-phase*3:0;
   function pixel(x,y,c){x=Math.round(x);y=Math.round(y);if(x>=0&&x<48&&y>=0&&y<68&&c)data.set(c,(y*48+x)*4);}
   function polygon(points,c){const min=Math.floor(Math.min(...points.map(p=>p[1]))),max=Math.ceil(Math.max(...points.map(p=>p[1])));for(let y=min;y<=max;y++){const nodes=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))nodes.push(a[0]+(y-a[1])/(b[1]-a[1])*(b[0]-a[0]));}nodes.sort((a,b)=>a-b);for(let i=0;i<nodes.length;i+=2)for(let x=Math.ceil(nodes[i]);x<Math.ceil(nodes[i+1]);x++)pixel(x,y,c);}}
   function segment(a,b,width,c){const dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy)||1,nx=-dy/n*width/2,ny=dx/n*width/2;polygon([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],c);}
   function limb(a,b,c,colors,width=5,far=false){segment(a,b,width+2,colors[0]);segment(b,c,width+1,colors[0]);segment(a,b,width,colors[far?1:2]);segment(b,c,width-1,colors[far?1:2]);segment(a,b,1,colors[3]);}
   function copy(x0,x1,y0,y1,shiftX=0,shiftY=0,shear=0,rotation=0){for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*48+x)*4;if(source[i+3]){const dx=x-24,dy=y-28;pixel(24+dx*Math.cos(rotation)-dy*Math.sin(rotation)+shiftX+(44-y)/20*shear,28+dx*Math.sin(rotation)+dy*Math.cos(rotation)+shiftY,source.subarray(i,i+4));}}}
   const hipY=44+crouch*.35+bob;
   function leg(far){
    const dir=far?-1:1;let hip=[side?25+dir:24+dir*4,hipY];const stride=run?Math.sin(beat+(far?Math.PI:0)):striking?(far?-.6:.8)*impulse:casting&&gesture!=='tick'?(far?-.4:.65)*phase:0;
    let knee=[hip[0]+(side?stride*7:dir*(1+Math.abs(stride))),53+crouch*.3-Math.max(0,stride)*4],foot=[hip[0]+(side?stride*11:dir*1.5),63-Math.max(0,stride)*7];
    if(rig){const stride=rig.moving?Math.sin(beat+(far?Math.PI:0)):0;
     const plant=(far?-1:1)*(2+rig.coil*1.5+rig.drive*3),aimX=Math.cos(rig.aim)*(view==='left'?-1:1);
     knee=[hip[0]+plant*.45*aimX+stride*3,53+crouch*.3-Math.max(0,stride)*3];
     foot=[hip[0]+plant*aimX+stride*7,63-Math.max(0,stride)*5];
    }
    if(dash){knee=[hip[0]+(far?-8:9),54];foot=[hip[0]+(far?-14:6),60];}
    if(acrobatic){knee=[hip[0]+dir*(3+6*tuck),53-10*tuck];foot=[hip[0]-dir*3*tuck,63-19*tuck];}
    if(pose.chainRide){knee=[hip[0]+dir*5,51+(far?0:2)];foot=[hip[0]-dir*3,57+(far?0:3)];}
    if(pose.kind==='vault'){knee=[hip[0]+dir*7,49];foot=[hip[0]+dir*10,55];}
    if(winding&&!rig){knee[0]+=dir*phase*2;foot[0]+=dir*phase*3;}
    if(emote){
     const kick=Math.sin(rhythm+(far?Math.PI:0))*blend;
     if(emote==='dance'){knee[0]+=kick*4;foot[0]+=kick*5;foot[1]-=Math.max(0,kick)*4;}
     if(emote==='jig'){knee[0]+=dir*5*blend;knee[1]-=Math.max(0,kick)*8;foot[0]+=kick*7;foot[1]-=Math.max(0,kick)*12;}
     if(emote==='moonwalk'){knee[0]+=kick*5;foot[0]+=kick*10;foot[1]-=Math.max(0,-kick)*4;}
     if(emote==='flip'){const tuck=Math.sin(clamp((phase-.16)/.65)*Math.PI);knee=[hip[0]+dir*6*tuck,53-tuck*11];foot=[hip[0]-dir*4*tuck,63-tuck*17];}
     if(emote==='spin'){foot[0]-=dir*3*blend;knee[0]-=dir*2*blend;}
    }
    let footPitch=0;if(body){const l=body.legs[far?0:1];hip=[l.hip.x,l.hip.y];knee=[l.knee.x,l.knee.y];foot=[l.foot.x,l.foot.y];footPitch=l.pitch;}
    limb(hip,knee,foot,pants,5,far);if(shorts)limb(knee,[knee[0]+(foot[0]-knee[0])*.5,(knee[1]+foot[1])/2],foot,skin,3,far);
    if(body){const at=(x,y)=>[foot[0]+x*Math.cos(footPitch)-y*Math.sin(footPitch),foot[1]+x*Math.sin(footPitch)+y*Math.cos(footPitch)];polygon([at(-3,-3),at(2,-3),at(side?6:3,0),at(side?6:3,2),at(-3,2)],boots[0]);segment(at(-2,0),at(side?4:2,0),3,boots[far?1:2]);segment(at(-2,2),at(side?4:2,2),1,boots[1]);return;}
    polygon([[foot[0]-3,foot[1]-3],[foot[0]+2,foot[1]-3],[foot[0]+2+(side?3:1),foot[1]],[foot[0]+2+(side?3:1),foot[1]+2],[foot[0]-3,foot[1]+2]],boots[0]);
    segment([foot[0]-2,foot[1]],[foot[0]+(side?3:1),foot[1]],3,boots[far?1:2]);segment([foot[0]-2,foot[1]+2],[foot[0]+(side?3:1),foot[1]+2],1,boots[1]);
   }
   leg(true);leg(false);
   // Keep the garment's collar, dyes and seams; articulate limbs independently.
   copy(side?20:19,side?32:30,28,46,0,crouch+bob,lean);
   if(skirt)copy(15,35,44,57,0,bob+crouch*.3,lean*.2);
   const shoulderY=31+crouch+bob;
   function arm(far){
    const dir=far?-1:1;let shoulder=[side?24+lean*.65:24+dir*7,shoulderY+(far?0:1)];
    let elbow=[shoulder[0]+(side?-swing*5:dir*2),shoulderY+7-(side?0:Math.sin(beat+(far?Math.PI:0))*3)],hand=[shoulder[0]+(side?-swing*9:dir*3),shoulderY+14-(side?Math.abs(swing)*3:Math.sin(beat+(far?Math.PI:0))*5)];
    if(dash){elbow=[shoulder[0]-9,shoulderY+3];hand=[shoulder[0]-15,shoulderY-1];}
    if(winding){elbow=[shoulder[0]-(side?5:dir*4)*phase,shoulderY+4];hand=[shoulder[0]-(side?9:dir*7)*phase,shoulderY-2*phase];}
    if(striking||recover){
     const direction=pose.step===2?-1:1,arc=whirl?phase*TAU:direction*(-1.15+impulse*2.4),r=far?9:16;
     elbow=[shoulder[0]+(side?Math.cos(arc)*8:Math.sin(arc)*7),shoulderY+(side?Math.sin(arc)*5:2)];
     hand=[shoulder[0]+(side?Math.cos(arc)*r:Math.sin(arc)*r),shoulderY+(pose.weapon==='espresso'?-1:side?Math.sin(arc)*r*.65:Math.cos(arc)*7-4)];
     if(heavy&&!side)hand[0]=shoulder[0]+dir*15*impulse;
    }
    if(casting){
     const phase=castMotion;
     const d=side?1:dir,lift=Math.sin(phase*Math.PI*.8);
     if(gesture==='draw'){elbow=[shoulder[0]+(far?9:-7),shoulderY-1];hand=[shoulder[0]+(far?16:-12*phase),shoulderY-3];}
     else if(gesture==='guard'){elbow=[shoulder[0]+dir*6,shoulderY+4];hand=[shoulder[0]+dir*9,shoulderY-2-phase*5];}
     else if(gesture==='sweep'||gesture==='fence'){const a=-1.7+phase*3.5;elbow=[shoulder[0]+Math.cos(a)*9,shoulderY+Math.sin(a)*6];hand=[shoulder[0]+Math.cos(a)*18,shoulderY+Math.sin(a)*14];}
     else if(gesture==='conduct'){elbow=[shoulder[0]+dir*(5+phase*6),shoulderY-8+phase*10];hand=[shoulder[0]+dir*(9+phase*8),shoulderY-20+phase*27];}
     else if(gesture==='swarm'||gesture==='tide'){elbow=[shoulder[0]+dir*8,shoulderY+4-phase*8];hand=[shoulder[0]+dir*(10+phase*7),shoulderY+10-phase*25];}
     else if(gesture==='inscribe'){elbow=[shoulder[0]+d*8,shoulderY+2];hand=[shoulder[0]+d*(8+Math.sin(phase*TAU)*9),shoulderY-5+phase*12];}
     else if(gesture==='crank'){elbow=[shoulder[0]+dir*(8+phase*3),shoulderY+Math.sin(phase*Math.PI*1.5)*5];hand=[shoulder[0]+dir*(11+phase*3),shoulderY-5+Math.cos(phase*Math.PI*1.5)*9];}
     else if(gesture==='heave'){elbow=[shoulder[0]+d*7,shoulderY-5*lift];hand=[shoulder[0]+d*10,shoulderY-13*lift+(phase>.7?(phase-.7)*48:0)];}
     else if(gesture==='command'){elbow=[shoulder[0]+d*8,shoulderY+(far?4:-2)];hand=[shoulder[0]+d*(far?6:16)*phase,shoulderY+(far?10:-7)*phase];}
     else if(gesture==='grow'){elbow=[shoulder[0]+dir*8,shoulderY+3-phase*9];hand=[shoulder[0]+dir*14,shoulderY+8-phase*22];}
     else if(gesture==='focus'){elbow=[shoulder[0]+d*5,shoulderY+4];hand=[shoulder[0]+d*(9+phase*6),shoulderY-(far?0:5)];}
     else if(gesture==='tick'){elbow=[shoulder[0]+dir*8,shoulderY+Math.sin(phase*Math.PI)*dir*5];hand=[shoulder[0]+dir*13,shoulderY+(far?-1:1)*(phase*22-11)];}
     else if(gesture==='levitate'){elbow=[shoulder[0]+dir*9,shoulderY+7];hand=[shoulder[0]+dir*15,shoulderY+3-phase*16];}
     else{elbow=[shoulder[0]+d*7,shoulderY+3];hand=[shoulder[0]+d*12,shoulderY+5-phase*16];}
    }
    if(rig){
     const h=rig.hands?.[far?0:1],target=h?[h.x,h.y]:far?[24-(rig.hand.x-24)*.48,40+rig.coil*3-rig.drive*3]:[rig.hand.x,rig.hand.y];
     hand=[mirrorX(target[0]),target[1]];
     const vx=hand[0]-shoulder[0],vy=hand[1]-shoulder[1],length=Math.hypot(vx,vy)||1;
     // Bent elbow stays connected to the shoulder and wrist in every direction.
     const bend=(far?-1:1)*(side?1:.85),nx=-vy/length,ny=vx/length;
     elbow=[(shoulder[0]+hand[0])*.5+nx*bend*4,(shoulder[1]+hand[1])*.5+ny*bend*4];
    }
    if(body&&!rig?.coffee){const a=body.arms[far?0:1];shoulder=[a.shoulder.x,a.shoulder.y];elbow=[a.elbow.x,a.elbow.y];hand=[a.hand.x,a.hand.y];}
    if(acrobatic){elbow=[shoulder[0]+dir*6,shoulderY+5];hand=[shoulder[0]+dir*(5-3*tuck),shoulderY+12-5*tuck];}
    if(pose.chainRide&&far){elbow=[shoulder[0]-5,shoulderY-9];hand=[shoulder[0]-6,shoulderY-18];}
    if(emote){
     const sx=shoulder[0],sy=shoulderY;let bend=elbow,palm=hand;
     if(emote==='wave'&&!far){bend=[sx+8,sy-7];palm=[sx+5+Math.sin(rhythm)*4,sy-19];}
     if(emote==='dance'){bend=[sx+dir*6,sy-3+Math.sin(rhythm)*dir*5];palm=[sx+dir*9,sy-10+Math.sin(rhythm)*dir*7];}
     if(emote==='bow'){bend=[sx+(far?-6:7),sy+6];palm=[sx+(far?-4:-5),sy+10];}
     if(emote==='flip'){bend=[sx+dir*6,sy+5];palm=[sx-dir*3,sy+9];}
     if(emote==='spin'){bend=[sx+dir*7,sy+1];palm=[sx+dir*10,sy-2];}
     if(emote==='cheer'){bend=[sx+dir*5,sy-7];palm=[sx+dir*8,sy-19];}
     if(emote==='salute'&&!far){bend=[sx+9,sy-6];palm=[sx-1,sy-14];}
     if(emote==='clap'){const apart=(1+Math.cos(rhythm))*3;bend=[sx+dir*5,sy+7];palm=[24+dir*apart,sy+1];}
     if(emote==='heart'){bend=[sx+dir*4,sy+7];palm=[24+dir*2,sy+2];}
     if(emote==='moonwalk'){bend=[sx-dir*Math.sin(rhythm)*7,sy+7];palm=[sx-dir*Math.sin(rhythm)*11,sy+10];}
     if(emote==='jig'){bend=[sx+dir*8,sy+3];palm=far?[sx+dir*4,sy+10]:[sx+dir*9,sy-9];}
     if(emote==='shrug'){bend=[sx+dir*7,sy+6];palm=[sx+dir*11,sy-2];}
     elbow=elbow.map((v,i)=>v+(bend[i]-v)*blend);hand=hand.map((v,i)=>v+(palm[i]-v)*blend);
    }
    grips[far?0:1]={x:hand[0],y:hand[1]};if(!far)grip=grips[1];limb(shoulder,elbow,hand,shirt,4,far);segment(elbow,hand,3,skin[far?1:2]);if(selection.shirt!=='shirt_short'){const cuff=[elbow[0]+(hand[0]-elbow[0])*.65,elbow[1]+(hand[1]-elbow[1])*.65];segment(elbow,cuff,5,shirt[0]);segment(elbow,cuff,3,shirt[far?1:2]);}
    polygon([[hand[0]-2,hand[1]-2],[hand[0]+2,hand[1]-2],[hand[0]+2,hand[1]+2],[hand[0]-2,hand[1]+2]],skin[0]);pixel(hand[0],hand[1],skin[2]);pixel(hand[0]+1,hand[1],skin[2]);
   }
   arm(true);if(pose.kind!=='infection')arm(false);
   // Sample the saved creator face, hair and hat while posing the head as one piece.
   copy(0,48,0,29,lean,Math.round(crouch+bob),0,body?.head||0);
   if(pose.kind==='infection')arm(false);
   if(view==='left'){for(const h of grips)h.x=47-h.x;const src=data.slice();for(let y=0;y<68;y++)for(let x=0;x<48;x++)data.set(src.subarray((y*48+47-x)*4,(y*48+48-x)*4),(y*48+x)*4);}
   const result=makeCanvas(48,68),g=result.getContext('2d'),im=g.createImageData(48,68);im.data.set(data);g.putImageData(im,0,0);result.grip=grip;result.weaponPose=body?body.weaponPose:rig?{angle:rig.angle,tilt:rig.tilt,drive:rig.drive,heavy:rig.heavy}:null;
   sockets(result,view,lean,crouch+bob);
   result.grips=grips;result.pistols=rig?.coffee?grips.map((h,i)=>({...h,angle:rig.gunAngles[i],recoil:rig.kicks[i],rear:view==='back'||side&&i===0})):pose.weapon==='espresso'?grips.map((h,i)=>({...h,angle:acrobatic?(view==='left'?Math.PI-.9:.9):(pose.moveAngle??pose.aimAngle??0)+.3,recoil:0,rear:view==='back'||side&&i===0})):null;
   if(cache.size>768)cache.clear();cache.set(key,result);return result;
  }
  return {frame,selection:original.selection};
 }
 root.MORATALES_SURVIVOR_MOTION={create,combatPose,locomotionPose,espressoPose};
})(globalThis);

