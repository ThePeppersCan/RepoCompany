import * as THREE from 'three';
import type {InputState,PhysicsEvent,RiderState,World} from './types';
import {touchesHazard,hazardNames} from './hazards';
const HOVER=1.85,clamp=THREE.MathUtils.clamp,damp=THREE.MathUtils.damp;
const names=['','WINGOVER','BROOM SWEEP','SKY REACH','BARREL ROLL','SPIRAL','BACKFLIP','FRONTFLIP'];
const scores=[0,150,180,240,350,400,450,500],durations=[0,.8,.9,1,1.25,1.35,1.4,1.4];
type Dynamics={lastS:number;lateral:number;altitude:number;lift:number;cooldown:number;trick:number;trickTime:number;banked:boolean;pulse:number;hit:Set<string>};
const states=new WeakMap<RiderState,Dynamics>();
export function resetPhysics(state:RiderState){states.delete(state);}
export function createRiderState(id:number,name:string,color:number):RiderState {
 return {id,name,color,s:0,lateral:0,speed:0,y:HOVER,vy:0,airborne:false,airTime:0,pitch:0,roll:0,yaw:0,lean:0,compression:0,cadence:0,crash:0,boost:.65,score:0,trick:'',trickRotation:0,finished:false,finishTime:0,position:new THREE.Vector3(),velocity:new THREE.Vector3(),raceTime:0,hits:0,cleanPasses:0,lastHit:''};
}
export function updatePhysics(state:RiderState,input:InputState,world:World,dt:number,time=0):PhysicsEvent[]{
 const events:PhysicsEvent[]=[];dt=clamp(dt,0,1/30);const before=world.sample(state.s,state.lateral);
 let m=states.get(state);
 if(!m||Math.abs(state.s-m.lastS)>25){m={lastS:state.s,lateral:0,altitude:Math.max(HOVER,state.y),lift:0,cooldown:0,trick:0,trickTime:0,banked:false,pulse:0,hit:new Set()};states.set(state,m);state.position.copy(before.position);state.position.y+=m.altitude;state.y=m.altitude;}
 state.raceTime=time;
 if(state.finished||dt===0)return events;
 const previousS=state.s,previousX=state.lateral,previousY=before.position.y+state.y;
 m.cooldown=Math.max(0,m.cooldown-dt);const recovering=state.crash>0;state.crash=Math.max(0,state.crash-dt);
 const steer=recovering?0:clamp(input.steer,-1,1),boosting=!recovering&&input.boost&&state.boost>.005;
 state.boost=clamp(state.boost+dt*(boosting?-.19:.035),0,1);
 let acceleration=4.2+(input.pedal?5.3:0)+clamp(-before.slope,-.35,.6)*7+(boosting?12:0)-state.speed*state.speed*.007;
 if(input.brake)acceleration-=17+state.speed*.2;if(recovering)acceleration=-state.speed*2;
 if(Math.abs(state.lateral)>before.width*.6)acceleration-=6;
 state.speed=clamp(state.speed+acceleration*dt,0,boosting?43:35);
 m.lateral=damp(m.lateral,steer*(3.2+state.speed*.17),input.brake?5:7,dt);m.lateral-=before.curvature*state.speed*state.speed*dt*.12;
 state.lateral+=m.lateral*dt;const edge=before.width*.92;
 if(Math.abs(state.lateral)>edge){state.lateral=clamp(state.lateral,-edge,edge);m.lateral*=-.2;state.speed*=Math.exp(-dt*1.6);}
 state.s=Math.min(world.length,state.s+state.speed*dt);const sample=world.sample(state.s,state.lateral);
 // A bounded, sprung flight envelope: Space climbs, release swoops back down.
 // Marked updrafts lift every competitor through the same physical rules.
 if(input.hop&&m.cooldown===0){m.pulse=1.2;m.cooldown=.7;}m.pulse=Math.max(0,m.pulse-dt);
 const target=recovering?HOVER:input.crouch?8.5:input.manual?1.1:HOVER+sample.jump*5+(m.pulse>0?4:0);
 m.lift+=((target-m.altitude)*10-m.lift*4.8)*dt;m.lift=clamp(m.lift,-6,7);m.altitude=clamp(m.altitude+m.lift*dt,1.05,10);
 const wasHigh=state.airborne;state.y=m.altitude;state.vy=m.lift;state.airborne=m.altitude>2.8;state.airTime=state.airborne?state.airTime+dt:0;
 if(state.airborne&&!wasHigh){events.push({type:'jump',force:5});m.banked=false;}
 if(!recovering&&state.airborne&&input.trick>0&&!m.trick){m.trick=clamp(Math.floor(input.trick),1,7);m.trickTime=0;state.trick=names[m.trick];}
 if(m.trick){m.trickTime+=dt;const t=clamp(m.trickTime/durations[m.trick],0,1);state.trickRotation=t*t*(3-2*t)*Math.PI*2;
  if(t===1&&!m.banked){state.score+=scores[m.trick];state.boost=clamp(state.boost+.18,0,1);m.banked=true;events.push({type:'trick',force:0,score:scores[m.trick],name:names[m.trick]});}}
 if(!state.airborne&&wasHigh){events.push({type:'land',force:Math.abs(m.lift)*.7});if(m.trick&&!m.banked)state.speed*=.8;m.trick=0;m.trickTime=0;state.trickRotation=0;state.trick='';}
 for(const h of world.hazards||[]){
  if(h.s<previousS-24||h.s>state.s+24)continue;
  const baseY=world.sample(h.s).position.y;
  const a={s:previousS,x:previousX,y:previousY-baseY+.75},b={s:state.s,x:state.lateral,y:sample.position.y+state.y-baseY+.75};
  if(!recovering&&m.cooldown===0&&touchesHazard(h,a,b,time,dt)){
   state.speed*=.52;state.crash=.65;state.hits++;state.lastHit=hazardNames[h.kind];m.cooldown=1.65;m.hit.add(h.id);m.trick=0;state.trickRotation=0;state.trick='';
   m.lateral+=(h.kind==='pillars'?-h.side:state.lateral>0?1:-1)*1.5;
   events.push({type:'crash',force:11,name:state.lastHit});
  }
  const exit=h.s+(h.kind==='rockfall'?20:6);
  if(previousS<exit&&state.s>=exit&&!m.hit.has(h.id)&&state.crash===0){
   state.cleanPasses++;state.score+=50;state.boost=clamp(state.boost+.035,0,1);events.push({type:'clear',force:0,score:50,name:hazardNames[h.kind]});
  }
 }
 const pitch=clamp(Math.atan(sample.slope)+m.lift*.035,-.55,.55);state.pitch=damp(state.pitch,pitch,6,dt);state.roll=damp(state.roll,-steer*.62-clamp(sample.curvature*state.speed,-.25,.25)+(m.trick===1?Math.sin(state.trickRotation*.5)*.8:0),7,dt);
 state.yaw=Math.atan2(-sample.tangent.x,-sample.tangent.z)-m.lateral*.02;state.lean=damp(state.lean,-steer*.6,7,dt);
 if(m.trick===4)state.roll=state.trickRotation;if(m.trick===5)state.yaw+=state.trickRotation;if(m.trick===6)state.pitch=pitch+state.trickRotation;if(m.trick===7)state.pitch=pitch-state.trickRotation;
 state.compression=damp(state.compression,input.pedal||boosting?.65:0,5,dt);state.cadence+=dt;
 state.position.copy(sample.position);state.position.y+=state.y;state.velocity.copy(sample.tangent).multiplyScalar(state.speed).addScaledVector(sample.right,m.lateral);state.velocity.y+=m.lift;m.lastS=state.s;return events;
}
