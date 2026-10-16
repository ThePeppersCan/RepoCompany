// Track-space hazard definitions are shared by collision, rendering and rival AI.
// The race clock drives rockfalls: pausing, resetting and replaying never use wall time.
export type HazardKind='thorns'|'branches'|'pillars'|'rockfall';
export interface CourseHazard {id:string;kind:HazardKind;s:number;width:number;side:number;offset:number;rise:number[]}
export interface HazardBox {s:number;x:number;y:number;halfS:number;halfX:number;halfY:number}
export interface FallingRock {s:number;x:number;y:number;radius:number;warning:boolean;active:boolean;visible:boolean;phase:number}
export interface FlightPoint {s:number;x:number;y:number}
export const ROCK_PERIOD=10.5,ROCK_WARNING=1.8,ROCK_FALL=1.7,ROCK_ROLL=1.15;
export const hazardNames:Record<HazardKind,string>={thorns:'Thorn barrier',branches:'Low branches',pillars:'Ruined pillars',rockfall:'Falling boulders'};
export function createHazards(length:number,width:(s:number)=>number,height:(s:number)=>number=()=>0):CourseHazard[]{
 const layout:Array<[number,HazardKind,number?]>=[
  [.115,'thorns'],[.17,'pillars',1],[.235,'branches'],[.28,'pillars',-1],
  [.325,'rockfall'],[.365,'thorns'],[.438,'pillars',1],[.478,'thorns'],
  [.52,'branches'],[.565,'pillars',-1],[.625,'rockfall'],[.668,'thorns'],
  [.695,'branches'],[.749,'pillars',1],[.785,'branches'],[.838,'rockfall'],
  [.875,'thorns'],[.918,'pillars',-1],[.956,'branches']
 ];
 return layout.map(([p,kind,side=1],i)=>({id:'hazard-'+i,kind,s:p*length,width:width(p*length),side,offset:(i*1.73)%ROCK_PERIOD,rise:[-7,0,7].map(d=>height(p*length+d)-height(p*length))}));
}
export function staticBox(h:CourseHazard):HazardBox|null{
 if(h.kind==='rockfall')return null;
 if(h.kind==='thorns')return {s:h.s,x:0,y:1.85,halfS:1.3,halfX:h.width*1.05,halfY:1.85};
 if(h.kind==='branches')return {s:h.s,x:0,y:9.3,halfS:1.5,halfX:h.width*1.05,halfY:4.1};
 return {s:h.s,x:h.side*h.width*.55,y:7.1,halfS:1.6,halfX:h.width*.55,halfY:7.1};
}
export function fallingRock(h:CourseHazard,index:number,time:number):FallingRock{
 const phase=((time+h.offset-index*.68)%ROCK_PERIOD+ROCK_PERIOD)%ROCK_PERIOD;
 const age=phase-ROCK_WARNING,radius=1.45,landing=age-ROCK_FALL;
 let x=(index-1)*h.width*.51,y=19;
 if(age>=0&&age<=ROCK_FALL)y=19-(19-radius)*(age/ROCK_FALL)**2;
 else if(landing>0){x+=(index===0?-1:1)*landing*7;y=radius+Math.sin(Math.min(landing,1)*Math.PI)*.6;}
 return {s:h.s+(index-1)*7,x,y:y+h.rise[index],radius,phase,warning:phase<ROCK_WARNING,active:age>=0&&landing<ROCK_ROLL,visible:landing<ROCK_ROLL};
}
// Swept expanded boxes prevent fast boosted riders and falling rocks tunnelling
// through one another. Rider dimensions include head, boots and broom nose.
export function sweptBox(a:FlightPoint,b:FlightPoint,box:HazardBox){
 let lo=0,hi=1;
 for(const [from,to,center,extent] of [[a.s,b.s,box.s,box.halfS+.85],[a.x,b.x,box.x,box.halfX+.43],[a.y,b.y,box.y,box.halfY+.9]]){
  const delta=to-from;if(Math.abs(delta)<1e-8){if(Math.abs(from-center)>extent)return false;continue;}
  const t1=(center-extent-from)/delta,t2=(center+extent-from)/delta;
  lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>hi)return false;
 }return true;
}
export function touchesHazard(h:CourseHazard,a:FlightPoint,b:FlightPoint,time:number,dt:number){
 const box=staticBox(h);if(box)return sweptBox(a,b,box);
 for(let i=0;i<3;i++){
  const now=fallingRock(h,i,time),before=fallingRock(h,i,time-dt);
  if(!now.active&&!before.active)continue;
  // The idle-to-warning cycle reset is not physical movement across the course.
  const previous=before.active?before:now;
  if(sweptBox({s:a.s-previous.s,x:a.x-previous.x,y:a.y-previous.y},{s:b.s-now.s,x:b.x-now.x,y:b.y-now.y},{s:0,x:0,y:0,halfS:now.radius*.86,halfX:now.radius*.86,halfY:now.radius*.86}))return true;
 }return false;
}
export function nextHazard(hazards:CourseHazard[],s:number,lookahead=125){
 return hazards.find(h=>h.s+(h.kind==='rockfall'?13:4)>=s&&h.s-s<lookahead);
}
export function hazardInstruction(h:CourseHazard){
 if(h.kind==='thorns')return 'Climb over';
 if(h.kind==='branches')return 'Release climb · Fly low';
 if(h.kind==='pillars')return h.side>0?'Dodge left':'Dodge right';
 return 'Watch the fall · Brake or boost';
}
