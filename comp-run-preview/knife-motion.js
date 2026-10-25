// Cosmetic, authored viewmodel motion. No gameplay state is read or written.
// The same returned pose is reused, and elapsed animation time only advances
// with dt: pausing or rendering a second pass cannot advance a flourish.
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t,0,1);return clamp(t*t*t*(t*(t*6-15)+10),0,1);};
const between=(t,a,b)=>smooth((t-a)/(b-a));
const window=(t,a=.18,b=.78)=>between(t,0,a)*(1-between(t,b,1));

export const KNIFE_MOTIONS=Object.freeze({
 'mawbound-awakening':{duration:4.5,label:'Mawbound awakening'},
 'gallows-awakening':{duration:4.8,label:'Gallows unbound'},
 'hellhound-awakening':{duration:4.2,label:'Hellhound release'},
 'widow-awakening':{duration:4.7,label:'Widow unfolding'},
 'leviathan-awakening':{duration:5.0,label:'Leviathan rising'},
 'jester-awakening':{duration:4.4,label:'Jester awakening'},
 'blade-study':{duration:2.25,label:'Blade study'},
 'edge-roll':{duration:1.85,label:'Finger roll'},
 'heel-turn':{duration:1.78,label:'Heel turn'},
 'back-edge':{duration:2.10,label:'Reverse edge check'},
 'ring-orbit':{duration:1.75,label:'Ring orbit'},
 'butterfly-fan':{duration:2.05,label:'Butterfly fan'},
 'fold-check':{duration:2.00,label:'Folder check'},
 'latch-check':{duration:1.65,label:'Bolster check'},
 'guard-roll':{duration:1.95,label:'Guard roll'},
 'idle-glance':{duration:1.30,label:'Quiet edge glance'},
 'grip-settle':{duration:.74,label:'Grip adjustment'},
 'pace-roll':{duration:.92,label:'Walking wrist roll'},
 'runner-settle':{duration:.68,label:'Running grip settle'},
 'running-edge-roll':{duration:1.02,label:'Running finger roll'},
 'running-ring-orbit':{duration:1.12,label:'Running ring spin'},
 'running-butterfly':{duration:1.08,label:'Running butterfly catch'},
 'running-folder':{duration:.94,label:'Running pivot check'},
});
const runningGestures={fixed:'running-edge-roll',stiletto:'running-edge-roll',ring:'running-ring-orbit',bayonet:'running-edge-roll',tanto:'running-edge-roll',bowie:'running-edge-roll',folder:'running-folder',butterfly:'running-butterfly'};
const sets={
 fixed:['blade-study','edge-roll','heel-turn','back-edge'],
 stiletto:['latch-check','blade-study','edge-roll','back-edge'],
 ring:['ring-orbit','blade-study','edge-roll','back-edge'],
 bayonet:['guard-roll','blade-study','edge-roll','back-edge'],
 tanto:['back-edge','blade-study','edge-roll','heel-turn'],
 bowie:['blade-study','back-edge','guard-roll','edge-roll'],
 folder:['fold-check','blade-study','edge-roll','back-edge'],
 butterfly:['butterfly-fan','blade-study','edge-roll','back-edge'],
};
const fields=['x','y','z','rx','ry','rz','spin','pivotBlend','release','open','handleSwing','latch'];
const blank=()=>({x:0,y:0,z:0,rx:0,ry:0,rz:0,spin:0,spinAxis:0,pivotBlend:0,release:0,open:1,handleSwing:0,latch:0,name:'',label:'',kind:'',progress:0,active:false,settling:false});

function sample(name,t,o,reduced){
 const s=window(t),turn=between(t,.23,.76),fidget=window(t,.32,.64);
 o.x=o.y=o.z=o.rx=o.ry=o.rz=o.spin=o.pivotBlend=o.release=o.handleSwing=o.latch=0;o.open=1;o.spinAxis=0;
 if(reduced){o.y=.013*s;o.rz=-.11*s;o.ry=-.07*s;return;}
 switch(name){
  case 'mawbound-awakening':
   o.x=-.042*s;o.y=.105*s;o.rx=-.12*s;o.ry=-.22*s;o.rz=(-.24+Math.sin(t*TAU)*.05)*s;o.z=-.025*s;break;
  case 'gallows-awakening':
   o.x=-.04*s;o.y=(.10+Math.sin(t*Math.PI)*.018)*s;o.rx=-.18*s;o.ry=Math.sin(t*TAU)*.16*s;o.rz=-.30*s;o.z=-.02*s;break;
  case 'hellhound-awakening':
   o.x=-.04*s;o.y=.09*s;o.z=(-.02+Math.sin(between(t,.38,.64)*Math.PI)*.024)*s;o.rx=-.17*s;o.ry=-.16*s;o.rz=-.27*s;break;
  case 'widow-awakening':
   o.x=-.055*s;o.y=.095*s;o.rx=-.22*s;o.ry=(-.22+Math.sin(t*TAU)*.09)*s;o.rz=-.31*s;o.z=-.03*s;break;
  case 'leviathan-awakening':
   o.x=-.045*s;o.y=.115*s;o.rx=-.12*s;o.ry=(-.16+Math.sin(t*TAU)*.12)*s;o.rz=-.25*s;o.z=-.025*s;break;
  case 'jester-awakening':
   o.x=-.055*s;o.y=.10*s;o.z=-.02*s;o.rx=-.14*s;o.ry=-.18*s;o.rz=-.32*s;break;
  case 'blade-study':
   o.x=-.055*s;o.y=.050*s;o.z=-.012*s;o.rx=-.10*s;o.ry=-.32*s;o.rz=-.40*s;
   o.ry+=Math.sin(between(t,.30,.70)*TAU)*.10*s;o.release=.08*s;break;
  case 'back-edge':
   o.x=-.030*s;o.y=.041*s;o.z=.005*s;o.rx=-.18*s;o.ry=.37*s;o.rz=-.57*s;
   o.spinAxis=3;o.spin=Math.PI*.60*s;o.release=.16*s;break;
  case 'edge-roll':
   o.x=-.025*s;o.y=.031*s;o.rx=-.05*s;o.rz=-.18*s;
   o.spinAxis=3;o.spin=TAU*turn;o.release=.50*window(t,.25,.70);break;
  case 'heel-turn':
   o.x=-.012*s;o.y=.125*s;o.z=-.035*s;o.rx=.14*s;o.ry=.50*s;o.rz=-.18*s;
   o.spinAxis=1;o.spin=TAU*between(t,.27,.72);o.release=.78*window(t,.24,.73);break;
  case 'ring-orbit':
   // Present the ring plane towards the camera before the spin; a horizontal
   // orbit would throw its blade towards the near plane and below the frame.
   o.x=-.024*s;o.y=.100*s;o.z=-.035*s;o.rx=1.30*s;o.rz=.28*s;
   o.spinAxis=2;o.spin=TAU*turn;o.pivotBlend=s;o.release=.85*window(t,.19,.77);break;
  case 'butterfly-fan':{
   const fan=between(t,.22,.72);
   o.x=-.028*s;o.y=.039*s;o.z=-.016*s;o.rx=-.10*s;o.rz=-.21*s;
   // The safe handle remains in the palm. Only the free handle and latch fan
   // around their own hinges; folding both would break the held contact.
   o.open=1;o.handleSwing=.58*Math.sin(TAU*fan)*Math.sin(Math.PI*fan);o.latch=Math.sin(Math.PI*between(t,.05,.34))*.7*window(t,.10,.62);
   o.release=.38*window(t,.19,.76);break;
  }
  case 'fold-check':
   o.x=-.030*s;o.y=.042*s;o.ry=-.35*s;o.rz=-.29*s;
   o.open=1-.79*window(t,.34,.48);o.latch=window(t,.18,.40);o.release=.27*s;break;
  case 'latch-check':
   o.x=-.018*s;o.y=.036*s;o.ry=-.25*s;o.rz=-.23*s;
   o.rx=-.12*Math.sin(Math.PI*between(t,.20,.70))*s;o.release=.19*s;break;
  case 'guard-roll':
   o.x=-.025*s;o.y=.043*s;o.z=-.008*s;o.ry=-.14*s;o.rz=-.24*s;
   o.spinAxis=3;o.spin=TAU*turn;o.release=.42*window(t,.27,.70);break;
  case 'idle-glance':
   o.x=-.010*fidget;o.y=.014*fidget;o.ry=-.10*fidget;o.rz=-.17*fidget;o.release=.06*fidget;break;
  case 'pace-roll':
   o.y=.010*fidget;o.rx=-.04*fidget;o.rz=-.13*fidget;o.ry=.055*fidget;o.release=.10*fidget;break;
  case 'runner-settle':
   o.y=.006*fidget;o.z=.006*fidget;o.rz=-.065*fidget;o.release=.08*fidget;break;
  case 'running-edge-roll':
   o.x=-.012*s;o.y=.024*s;o.z=-.006*s;o.rz=-.16*s;o.ry=-.08*s;
   o.spinAxis=3;o.spin=TAU*turn;o.release=.38*window(t,.23,.73);break;
  case 'running-ring-orbit':
   o.x=-.020*s;o.y=.125*s;o.z=-.050*s;o.rx=1.30*s;o.rz=.28*s;
   o.spinAxis=2;o.spin=TAU*turn;o.pivotBlend=s;o.release=.72*window(t,.19,.77);break;
  case 'running-butterfly':{
   const fan=between(t,.20,.75);
   o.x=-.018*s;o.y=.032*s;o.z=-.012*s;o.rx=-.08*s;o.rz=-.22*s;
   o.open=1;o.handleSwing=.70*Math.sin(TAU*fan)*Math.sin(Math.PI*fan);
   o.latch=.55*Math.sin(Math.PI*between(t,.04,.32))*window(t,.10,.62);o.release=.30*s;break;
  }
  case 'running-folder':
   o.x=-.015*s;o.y=.027*s;o.rz=-.19*s;o.ry=-.23*s;
   o.open=1-.48*window(t,.30,.53);o.latch=.6*window(t,.18,.4);o.release=.20*s;break;
  default:
   o.y=.007*fidget;o.rx=-.045*fidget;o.release=.13*fidget;
 }
}

export function createKnifeMotion(){
 const pose=blank(),cancelPose=blank();
 let name='',kind='',age=0,duration=0,cooldown=0,settleAge=0,settling=false;
 let profile='fixed',manualIndex=0,idleCycle=0,moveCycle=0,idleAge=0,moveAge=0,safeAge=0,airAge=0;
 let finishId='';
 let enabled=false,safe=false,reduced=false,lastMoving=false,sprinting=false;
 function neutral(){for(const key of fields)pose[key]=key==='open'?1:0;pose.spinAxis=0;pose.active=false;pose.settling=false;pose.name=pose.label=pose.kind='';pose.progress=0;}
 function begin(next,type){
  name=next;kind=type;age=0;duration=KNIFE_MOTIONS[next].duration;settling=false;idleAge=moveAge=0;
  pose.name=name;pose.label=KNIFE_MOTIONS[name].label;pose.kind=kind;pose.progress=0;pose.active=true;pose.settling=false;
  sample(name,0,pose,reduced);return true;
 }
 function cancel(){
  if(!name)return false;
  for(const key of fields)cancelPose[key]=pose[key];cancelPose.spinAxis=pose.spinAxis;settleAge=0;settling=true;
  name='';kind='';age=0;pose.active=false;pose.name=pose.label=pose.kind='';idleAge=moveAge=0;cooldown=Math.max(cooldown,.55);
  return true;
 }
 function reset(nextProfile=profile){
  profile=sets[nextProfile]?nextProfile:'fixed';name=kind='';age=duration=cooldown=settleAge=idleAge=moveAge=safeAge=airAge=0;
  settling=false;manualIndex=idleCycle=moveCycle=0;enabled=safe=reduced=lastMoving=false;neutral();
 }
 function request(preview=false){
  if(preview){safe=true;enabled=true;safeAge=1;cooldown=0;name='';settling=false;}
  if(!enabled||!safe||name||settling||cooldown>0)return false;
  const list=sets[profile],awakening=finishId+'-awakening',next=reduced?'blade-study':KNIFE_MOTIONS[awakening]?awakening:list[manualIndex++%list.length];
  return begin(next,'manual');
 }
 function update(dt,context={}){
  dt=Number.isFinite(dt)?clamp(dt,0,.1):0;if(dt===0)return pose;
  const nextProfile=sets[context.profile]?context.profile:'fixed';
  if(nextProfile!==profile)reset(nextProfile);
  finishId=context.finishId||'';
  const nextReduced=context.motion===false;
  if(nextReduced!==reduced&&name)cancel();
  enabled=Boolean(context.enabled);reduced=nextReduced;
  const handsFree=enabled&&!context.traversal&&!context.sliding&&!context.wallRun&&!context.crouch;
  const grounded=context.grounded!==false;
  airAge=grounded?0:airAge+dt;
  // Ordinary parkour jumps remain eligible. Large falls and actions that need
  // the hands still settle the knife; short ground contacts need no dwell.
  const ordinaryJump=airAge<=1.6&&(!Number.isFinite(context.verticalSpeed)||context.verticalSpeed>-19);
  safe=handsFree&&(grounded||ordinaryJump);
  sprinting=Boolean(context.sprinting)||context.speed>9;
  const moving=Number.isFinite(context.speed)&&context.speed>.65;
  cooldown=Math.max(0,cooldown-dt);
  if(!safe){
   if(name)cancel();safeAge=idleAge=moveAge=0;
  }else safeAge=Math.min(1,safeAge+dt);
  if(reduced){idleAge=moveAge=0;if(name&&kind==='automatic')cancel();}
  if(name){
   const overshoot=Math.max(0,age+dt-duration);age=Math.min(duration,age+dt);const t=age/duration;
   sample(name,t,pose,reduced);pose.progress=t;pose.active=true;pose.settling=false;
   if(age>=duration){name='';kind='';neutral();cooldown=Math.max(0,.72-overshoot);}
  }else if(settling){
   settleAge+=dt;const a=1-smooth(settleAge/.18);
   for(const key of fields)pose[key]=(key==='open'?1:0)+(cancelPose[key]-(key==='open'?1:0))*a;
   // Keep complete turns near their equivalent orientation while settling.
   if(cancelPose.spinAxis&&Math.abs(cancelPose.spin)>Math.PI)pose.spin=(cancelPose.spin-Math.round(cancelPose.spin/TAU)*TAU)*a;
   pose.spinAxis=cancelPose.spinAxis;pose.settling=true;pose.active=false;
   if(settleAge>=.18){settling=false;neutral();}
  }else if(safe&&!reduced&&cooldown===0){
   if(moving){
    idleAge=0;moveAge+=dt;
    const delay=sprinting?[5.5,7,6.2,8][moveCycle%4]:9+(moveCycle%3)*1.5;
    if(moveAge>=delay&&safeAge>=.12){
     const gesture=sprinting?(moveCycle%3===1?'runner-settle':runningGestures[profile]):moveCycle%2?'grip-settle':'pace-roll';
     moveCycle++;begin(gesture,'automatic');
    }
   }else{
    moveAge=0;idleAge+=dt;
    if(grounded&&idleAge>=12+(idleCycle%3)*3){idleCycle++;begin(idleCycle%2?'idle-glance':'grip-settle','automatic');}
   }
  }
  if(moving!==lastMoving){idleAge=moveAge=0;lastMoving=moving;}
  return pose;
 }
 return{pose,update,request,cancel,reset,get profile(){return profile;},get cooldown(){return cooldown;}};
}
