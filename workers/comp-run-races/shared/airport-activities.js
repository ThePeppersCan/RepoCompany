// Deterministic, renderer-free sports. Also used by the multiplayer room authority.
export const SPORTS_BOUNDS={basketball:{minX:-44.5,maxX:-19.5,minZ:-69.5,maxZ:-40.5},football:{minX:18.5,maxX:45.5,minZ:-34,maxZ:-4}};
export const GOLF_LANES=[24,32,40].map((x,i)=>({id:'golf-'+i,x,z:-51,holeX:x+(i===1?1.5:0),holeZ:-78,minX:x-2.8,maxX:x+2.8,minZ:-80.7,maxZ:-47.3}));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createAirportActivities(){return {time:0,basket:0,goals:[0,0],holes:[0,0,0],strokes:[0,0,0],balls:[{id:'basketball',x:-32,y:.3,z:-53,r:.3},{id:'football',x:32,y:.32,z:-19,r:.32},...GOLF_LANES.map(g=>({id:g.id,x:g.x,y:.17,z:g.z,r:.11}))].map(b=>({...b,spawn:{x:b.x,y:b.y,z:b.z},vx:0,vy:0,vz:0,owner:null,resetAt:0})),event:null};}
export function resetAirportBall(b){Object.assign(b,b.spawn,{vx:0,vy:0,vz:0,owner:null,resetAt:0});}
export function airportSportAction(state,action,player,owner='solo'){
 if(!action||!player||![player.x,player.y,player.z,player.yaw,player.pitch||0].every(Number.isFinite))return false;
 const b=state.balls.find(b=>b.id===action.id);if(!b)return false;
 const close=Math.hypot(b.x-player.x,b.y-(player.y+.6),b.z-player.z)<3;
 if(action.kind==='pickup'&&b.id==='basketball'&&!b.owner&&close){b.owner=owner;b.vx=b.vy=b.vz=0;return true;}
 if(action.kind==='drop'&&b.owner===owner){b.owner=null;b.vx=b.vz=0;b.vy=0;return true;}
 if(action.kind==='reset'&&!b.owner&&Math.hypot(b.spawn.x-player.x,b.spawn.z-player.z)<3){resetAirportBall(b);return true;}
 if(action.kind!=='strike'||b.resetAt)return false;
 if(b.id==='basketball'&&b.owner!==owner||b.id!=='basketball'&&(b.owner||!close))return false;
 const golf=b.id.startsWith('golf-');if(golf&&Math.hypot(b.vx,b.vz)>.6)return false;
 const power=clamp(Number(action.power)||.15,.05,1),yaw=player.yaw,pitch=clamp(player.pitch||0,-1.3,.5);
 if(b.id==='basketball'){
  b.x=player.x-Math.sin(yaw)*.72;b.y=player.y+1.45;b.z=player.z-Math.cos(yaw)*.72;
  const speed=6+power*9,elevation=clamp(-pitch+.12,.12,1.25);b.vx=-Math.sin(yaw)*Math.cos(elevation)*speed;b.vz=-Math.cos(yaw)*Math.cos(elevation)*speed;b.vy=Math.sin(elevation)*speed;
 }else{const speed=golf?2+power*15:7+power*15;b.vx=-Math.sin(yaw)*speed;b.vz=-Math.cos(yaw)*speed;b.vy=golf?0:Math.max(0,-pitch)*speed*.5;if(golf)state.strokes[Number(b.id.slice(-1))]++;}
 b.owner=null;return true;
}
export function stepAirportActivities(state,dt,players=[]){
 dt=clamp(dt,0,.1);state.time+=dt;
 for(const b of state.balls){
  if(b.resetAt){if(state.time>=b.resetAt)resetAirportBall(b);else continue;}
  if(b.owner){const p=players.find(p=>p.id===b.owner);if(!p){resetAirportBall(b);continue;}b.x=p.x-Math.sin(p.yaw)*.75;b.y=p.y+1.25;b.z=p.z-Math.cos(p.yaw)*.75;continue;}
  const golf=b.id.startsWith('golf-'),floor=golf?.06:0,old={x:b.x,y:b.y,z:b.z};
  b.vy-=14*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
  if(b.y<floor+b.r){b.y=floor+b.r;b.vy=Math.abs(b.vy)<.7?0:-b.vy*(golf?.1:.66);const drag=Math.exp(-(golf?1.65:1.1)*dt);b.vx*=drag;b.vz*=drag;}
  if(golf){
   const i=Number(b.id.slice(-1)),g=GOLF_LANES[i];
   if(Math.hypot(b.x-g.holeX,b.z-g.holeZ)<.48&&Math.hypot(b.vx,b.vz)<5){state.holes[i]++;state.event={kind:'golf',at:state.time,text:`HOLE ${i+1} · ${state.strokes[i]} SHOTS`};state.strokes[i]=0;b.resetAt=state.time+1.5;b.y=-.1;continue;}
   const obstacles=i===1?[{x:32,z:-65,w:3,d:1}]:i===2?[{x:38.5,z:-67,w:2.5,d:1},{x:41.5,z:-72,w:2.5,d:1}]:[];
   for(const o of obstacles)if(Math.abs(b.x-o.x)<o.w/2+b.r&&Math.abs(b.z-o.z)<o.d/2+b.r){if(Math.abs(old.z-o.z)>=o.d/2+b.r){b.z=old.z;b.vz*=-.78;}else{b.x=old.x;b.vx*=-.78;}}
  }
  if(b.id==='basketball'){
   for(const z of[-43,-67]){
    if(old.y>3.05&&b.y<=3.05&&b.vy<0&&Math.hypot(b.x+32,b.z-z)<.58){state.basket++;state.event={kind:'basket',at:state.time,text:'BASKET · '+state.basket};}
    const back=z===-43?-41.9:-68.1;if(b.y>2.65&&b.y<4.5&&Math.abs(b.x+32)<1.55&&((old.z-back)*(b.z-back)<0)){b.z=old.z;b.vz*=-.72;}
   }
  }
  if(b.id==='football'&&b.y<2.4&&Math.abs(b.x-32)<3.7){
   const side=b.z<-34?0:b.z>-4?1:-1;if(side>=0){state.goals[side]++;state.event={kind:'goal',at:state.time,text:`GOAL · ${state.goals[0]} : ${state.goals[1]}`};b.resetAt=state.time+1.7;continue;}
  }
  const bounds=golf?GOLF_LANES[Number(b.id.slice(-1))]:SPORTS_BOUNDS[b.id];
  for(const axis of['x','z']){if(b.id==='football'&&axis==='z'&&b.y<2.4&&Math.abs(b.x-32)<3.7)continue;const lo=bounds[axis==='x'?'minX':'minZ']+b.r,hi=bounds[axis==='x'?'maxX':'maxZ']-b.r;if(b[axis]<lo||b[axis]>hi){b[axis]=clamp(b[axis],lo,hi);b['v'+axis]*=-.76;}}
  if(b.y>26||![b.x,b.y,b.z].every(Number.isFinite))resetAirportBall(b);
 }
}
export function airportActivitySnapshot(s){return {time:s.time,basket:s.basket,goals:[...s.goals],holes:[...s.holes],strokes:[...s.strokes],event:s.event,balls:s.balls.map(({id,x,y,z,vx,vy,vz,owner,resetAt})=>({id,x,y,z,vx,vy,vz,owner,resetAt}))};}
export function applyAirportSnapshot(s,next){if(!next||!Array.isArray(next.balls)||next.balls.length!==5)return false;for(const key of['time','basket','goals','holes','strokes','event'])s[key]=next[key];for(const b of next.balls){const target=s.balls.find(x=>x.id===b.id);if(target&&[b.x,b.y,b.z,b.vx,b.vy,b.vz].every(Number.isFinite))Object.assign(target,b);}return true;}
