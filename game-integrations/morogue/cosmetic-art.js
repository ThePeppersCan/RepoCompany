/* Small, bounded pixel silhouettes. Shared by the wardrobe and arena renderer. */
(function(root){
 'use strict';
 const ink='#292632',cream='#f0dab1',gold='#bf9251',TAU=Math.PI*2;
 const palettes={porcelain:['#485d82','#94b6c0','#f1e5c5'],witchbrew:['#513e65','#aa7aa8','#e6bfce'],stormcup:['#465b6b','#a5ced4','#eee1b8']};
 function rect(g,c,x,y,w,h){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);}
 function star(g,x,y,c,size=2){rect(g,c,x-size,y,1+size*2,1);rect(g,c,x,y-size,1,1+size*2);}
 // Grip at (0,0), muzzle at (24,-5). Chunky slides and a glass brew chamber
 // read at the character's native scale; the wardrobe uses the same geometry.
 function pistol(g,id='roast',time=0,recoil=0){
  const p=palettes[id]||['#573b2f','#b37c45','#edc98f'],steel=id==='porcelain'?'#c6d4d0':id==='witchbrew'?'#51445e':id==='stormcup'?'#8ba9b2':'#707a79';
  poly(g,'#171e23',[[-5,-9],[19,-9],[25,-6],[25,-2],[11,-2],[8,4],[3,5],[1,12],[-6,12],[-3,1],[-6,-1]]);
  poly(g,p[0],[[-3,0],[4,1],[1,10],[-4,10]]);rect(g,p[1],-3,2,2,7);
  for(let i=0;i<3;i++)rect(g,'#241f20',-2,3+i*2,4,1);
  poly(g,steel,[[-4,-2],[13,-2],[10,2],[5,2],[3,-1],[-4,-1]]);
  rect(g,'#d1b17e',5,1,1,2);rect(g,'#424e52',7,2,3,1);rect(g,p[2],-5,10,6,1);
  const slide=Math.round(recoil*3);g.save();g.translate(-slide,0);
  poly(g,steel,[[-5,-8],[18,-8],[23,-6],[23,-3],[-5,-3]]);
  poly(g,'#c0cbc3',[[-4,-8],[18,-8],[21,-6],[-4,-6]]);
  rect(g,'#34424a',-4,-4,26,1);rect(g,p[1],9,-6,10,2);rect(g,'#f1d6a0',10,-6,8,1);
  rect(g,'#18252a',22,-6,2,3);rect(g,'#d9d8bb',21,-6,1,3);
  for(let i=0;i<3;i++)rect(g,'#38474c',-3+i*2,-7,1,3);
  rect(g,'#222c32',18,-10,3,2);rect(g,p[2],19,-10,1,1);g.restore();
  // A capped cylindrical reservoir, with visible coffee and a cream meniscus.
  rect(g,'#19272b',1,-15,9,10);rect(g,p[1],1,-14,9,2);rect(g,'#87a5a3',2,-12,7,6);
  rect(g,'#3b251b',3,-10,5,4);rect(g,'#ba7c3e',3,-10,5,1);rect(g,'#ecd09b',3,-11,5,1);
  rect(g,'#d5e2cf',2,-12,1,6);rect(g,'#486466',8,-12,1,6);rect(g,p[1],1,-6,9,2);
  rect(g,'#f2d5a0',2,-14,6,1);rect(g,'#344648',10,-9,2,3);rect(g,p[2],11,-8,1,1);
  if(time&&recoil<.05){const u=(time*.65)%1;g.save();g.globalAlpha*=Math.sin(u*Math.PI)*.26;rect(g,'#e2dfca',5+Math.sin(u*4),-17-u*5,1,2);g.restore();}
 }
 function pistolPair(g,id='roast',time=0){
  g.save();g.translate(10,18);g.rotate(-.38);g.scale(.85,.85);pistol(g,id,time);g.restore();
  g.save();g.translate(21,30);g.rotate(Math.PI+.38);g.scale(.85,-.85);pistol(g,id,time);g.restore();
 }
 function pistolSockets(frame){return (frame.pistols||[]).map(p=>{
  const mirror=Math.cos(p.angle)<0?-1:1,x=24*.67,y=-5*.67*mirror;
  return {x:p.x-24+Math.cos(p.angle)*x-Math.sin(p.angle)*y,y:p.y-65+Math.sin(p.angle)*x+Math.cos(p.angle)*y};
 });}
 function heldPistols(g,id,frame,time=0,rear=false){
  for(const p of frame.pistols||[]){if(p.rear!==rear)continue;g.save();g.translate(p.x-24,p.y-65);g.rotate(p.angle);g.scale(.67,Math.cos(p.angle)<0?-.67:.67);pistol(g,id,time,p.recoil);g.restore();
   const x=Math.round(p.x)-2,y=Math.round(p.y)-2;g.drawImage(frame,x,y,5,5,x-24,y-65,5,5);
  }
 }
 function cup(g,id,time=0){
  const p=palettes[id]||['#744a30','#ba7f43',cream];
  // Each vessel has its own outline, handle and base at the same hand-sized scale.
  if(id==='porcelain'){
   poly(g,ink,[[-10,-5],[6,-5],[6,-3],[11,-3],[12,-1],[11,3],[5,4],[2,7],[-5,7],[-8,3]]);
   rect(g,p[1],6,-2,4,4);rect(g,ink,7,-1,2,2);
   poly(g,p[2],[[-9,-4],[5,-4],[4,2],[1,5],[-4,5],[-7,2]]);
   rect(g,p[0],-8,-4,13,1);rect(g,'#5a3c32',-6,-3,9,1);rect(g,p[0],-4,0,2,3);rect(g,p[0],-2,2,4,1);
   rect(g,ink,-10,7,18,3);rect(g,p[2],-9,7,16,1);rect(g,p[1],-5,8,9,1);
  }else if(id==='witchbrew'){
   poly(g,ink,[[-5,-7],[4,-7],[5,-4],[8,-3],[9,4],[6,7],[4,7],[4,10],[1,10],[0,8],[-5,8],[-7,10],[-9,9],[-8,6],[-10,3],[-9,-2]]);
   rect(g,ink,8,-4,4,7);rect(g,p[1],9,-3,2,4);rect(g,ink,9,-2,1,2);
   poly(g,p[0],[[-7,-3],[5,-3],[7,0],[7,4],[3,6],[-5,6],[-8,3],[-8,0]]);
   rect(g,p[1],-7,-1,2,5);rect(g,p[2],-5,-6,9,2);rect(g,'#302d40',-4,-5,7,1);star(g,0,1,p[2],2);
  }else if(id==='stormcup'){
   poly(g,ink,[[-7,-9],[6,-9],[6,-4],[11,-4],[12,-2],[12,3],[8,5],[4,5],[1,8],[1,11],[5,11],[5,14],[-7,14],[-7,11],[-3,11],[-3,8],[-6,4]]);
   rect(g,p[1],6,-3,4,6);rect(g,ink,7,-1,2,3);
   poly(g,p[0],[[-6,-8],[5,-8],[4,2],[0,6],[-2,6],[-5,2]]);rect(g,p[2],-6,-8,11,2);rect(g,p[1],-5,-5,2,7);
   rect(g,p[2],-2,-3,3,2);rect(g,p[2],-3,-1,3,2);rect(g,p[2],-2,1,2,2);rect(g,p[1],-2,7,2,5);rect(g,p[2],-6,12,10,1);
  }else{
   // Faceted copper, a rolled cream rim and a hooked handle remain readable at game scale.
   poly(g,ink,[[-10,-6],[6,-6],[7,-3],[12,-3],[14,0],[12,6],[6,7],[4,10],[-5,10],[-8,7]]);
   poly(g,'#d5a163',[[6,-2],[11,-2],[12,0],[10,4],[6,5],[6,3],[9,3],[10,0],[6,0]]);
   poly(g,'#684533',[[-8,-3],[5,-3],[4,7],[2,9],[-4,9],[-6,7]]);
   poly(g,'#ad713d',[[-7,-3],[2,-3],[1,8],[-4,8],[-6,6]]);
   poly(g,'#e3b77a',[[-7,-3],[-4,-3],[-3,6],[-4,7],[-6,5]]);
   rect(g,'#82502f',-1,-2,2,9);rect(g,'#ce9653',2,-2,1,8);
   poly(g,'#f2d3a1',[[-9,-6],[5,-6],[6,-4],[4,-2],[-7,-2],[-9,-4]]);
   rect(g,'#392b28',-7,-5,11,2);rect(g,'#be8751',-5,-4,7,1);
   rect(g,'#362a29',-6,9,10,2);rect(g,'#bf9455',-5,9,8,1);
   rect(g,'#edc989',-2,1,2,3);rect(g,'#edc989',-3,2,4,1);
  }
  const wave=Math.round(Math.sin(time*3)),top=id==='stormcup'?-12:id==='witchbrew'?-10:-9;
  rect(g,p[1],-3+wave,top-2,1,3);rect(g,p[2],wave,top-6,1,3);
 }
 function cupBehind(frame,view){
  const hand=frame.grip,neck=frame.capeSocket;
  return view==='back'||(view==='right'&&hand.x<neck.x+2)||(view==='left'&&hand.x>neck.x-2);
 }
 function heldCup(g,id,frame,view,time=0){
  const hand=frame.grip||{x:view==='left'?20:27,y:43},direction=view==='left'?1:-1;
  g.save();g.translate(Math.round(hand.x-24),Math.round(hand.y-65));g.rotate(frame.weaponPose?.tilt||0);g.scale(direction*.7,.7);g.translate(-9,0);cup(g,id,time);g.restore();
  // Fingers close around the handle rather than being painted over by the cup.
  const x=Math.round(hand.x)-2,y=Math.round(hand.y)-2;g.drawImage(frame,x,y,5,5,x-24,y-65,5,5);
 }
 // Scan-converted polygons keep every cloth edge on the character's native pixel grid.
 function poly(g,c,points){
  g.fillStyle=c;const lo=Math.floor(Math.min(...points.map(p=>p[1]))),hi=Math.ceil(Math.max(...points.map(p=>p[1])));
  for(let y=lo;y<hi;y++){const xs=[];for(let i=0,j=points.length-1;i<points.length;j=i++){
   const a=points[i],b=points[j],scan=y+.5;if((a[1]<=scan&&b[1]>scan)||(b[1]<=scan&&a[1]>scan))xs.push(a[0]+(scan-a[1])/(b[1]-a[1])*(b[0]-a[0]));
  }xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)g.fillRect(Math.round(xs[i]),y,Math.max(1,Math.round(xs[i+1])-Math.round(xs[i])),1);}
 }
 function blade(g,id,phase=0,active=false,kind='idle'){
  // Grip at zero; the tip never extends beyond the original 75-unit blade.
  rect(g,ink,-5,-5,20,10);rect(g,'#684936',-4,-3,16,6);rect(g,gold,7,-8,5,16);rect(g,cream,8,-6,2,5);
  if(id==='crust'){
   // Scored amber spine over a sharpened steel edge: the original warm identity,
   // with a deliberate guard, grip and cutting silhouette.
   poly(g,ink,[[12,-5],[57,-8],[73,-5],[75,-2],[62,5],[15,6]]);
   poly(g,'#77817e',[[14,-3],[57,-6],[71,-4],[62,3],[15,4]]);
   poly(g,'#e1d7b5',[[15,2],[57,0],[72,-3],[62,4],[15,5]]);
   poly(g,'#ad703c',[[14,-4],[56,-7],[66,-5],[57,0],[14,1]]);
   poly(g,'#dfb169',[[15,-4],[56,-6],[63,-5],[55,-2],[15,0]]);
   for(let i=0;i<4;i++){const x=21+i*10;poly(g,'#765039',[[x,-4-i*.45],[x+3,-4-i*.45],[x+6,-1],[x+3,0]]);rect(g,'#f0d598',x+1,-4-i*.45,2,1);}
   rect(g,'#272c2e',-5,-4,12,8);rect(g,'#62433c',-4,-3,11,6);
   for(let i=0;i<3;i++)poly(g,'#b89363',[[-3+i*3,-3],[-1+i*3,-3],[1+i*3,3],[-1+i*3,3]]);
   poly(g,ink,[[6,-10],[10,-11],[13,-6],[12,8],[9,11],[6,9],[9,5],[9,-5]]);
   poly(g,'#c7a163',[[7,-9],[9,-9],[11,-5],[10,7],[8,9],[9,5],[9,-5]]);
   rect(g,'#eed4a0',-5,-3,2,6);
   if(kind==='strike'&&phase>.1&&phase<.65)star(g,22+phase*65,-2,cream,1);
  }else if(id==='sabre'){
   for(let i=0;i<28;i++){const x=14+i*2,y=-Math.round((i/27)**2*6);rect(g,ink,x,y-3,3,8);rect(g,'#859798',x,y-2,2,5);rect(g,'#dee2ce',x,y-2,2,2);}rect(g,cream,70,-9,3,3);rect(g,gold,-4,5,13,2);if(kind==='strike'&&phase>.12&&phase<.7)star(g,18+phase*65,-2-phase*5,cream,2);
  }else{
   const gilded=id==='giltlash',a=gilded?'#be9858':'#738467',b=gilded?'#f2d6a0':'#bed096',striking=kind==='strike'||kind==='whirl',curl=kind==='windup'?-13-phase*5:striking?-16*(1-phase)**2:kind==='recover'?phase*12:12;
   const points=[];for(let i=0;i<=12;i++){const t=i/12,x=14+t*56,y=curl*t*t+Math.sin(t*6-phase*5)*(striking?3:1.5)*t;points.push({x,y});}
   for(let i=0;i<12;i++){const pt=points[i],next=points[i+1];g.save();g.translate(Math.round(pt.x),Math.round(pt.y));g.rotate(Math.atan2(next.y-pt.y,next.x-pt.x));rect(g,ink,0,-3,6,6);rect(g,a,0,-2,5,4);rect(g,b,0,-2,3,1);if(gilded)rect(g,ink,2,0,2,1);else if(i%3===1)rect(g,cream,2,-5,2,3);g.restore();}
   const tip=points[12];rect(g,ink,tip.x-2,tip.y-3,6,5);rect(g,gilded?'#bb6b70':cream,tip.x-1,tip.y-2,4,2);if(striking&&phase>.42&&phase<.6)star(g,tip.x,tip.y,cream,3);
  }
 }
 const cuts={
  courier:{length:21,width:8,spring:190,damping:22,palette:['#303c50','#4c6176','#9cacac'],outline:[[-.7,0],[.65,0],[1,.55],[.85,.84],[.35,1],[-.45,.95],[-1,.77],[-.9,.4]]},
  cinder:{length:30,width:7,spring:145,damping:16,palette:['#582f36','#96483f','#c69258'],outline:[[-.85,0],[.8,0],[1,.35],[.78,.61],[.8,.91],[.38,1],[.1,.54],[-.08,.54],[-.48,.96],[-.92,.83],[-.75,.48],[-1,.3]]},
  uncrowned:{length:31,width:10,spring:100,damping:19,palette:['#493039','#753947','#ba965f'],outline:[[-.7,0],[.8,0],[1.05,.24],[.85,.57],[.75,.88],[.35,.76],[.26,1],[-.05,.94],[-.16,.77],[-.42,.88],[-.65,.66],[-.95,.72],[-1.1,.38]]}
 };
 function stepCape(state,{id,time,x,y,reduced=false}){
  const cut=cuts[id]||cuts.courier,dt=time-(state.time??time),dx=x-(state.x??x),dy=y-(state.y??y);
  if(!state.angles||state.id!==id||dt<0||dt>.2||Math.hypot(dx,dy)>180){Object.assign(state,{id,time,x,y,angles:Array(6).fill(0),velocity:Array(6).fill(0),speed:0,lift:0});return state;}
  if(dt<=0)return state; // Simulation time freezes the cloth along with combat and pause.
  const vx=dx/dt,vy=dy/dt,speed=Math.min(1,Math.hypot(vx,vy)/850),target=Math.max(-1.3,Math.min(1.3,Math.atan2(-vx*.003,Math.max(.5,1-vy*.001))));
  const n=Math.ceil(dt*120),h=dt/n;
  for(let tick=0;tick<n;tick++)for(let i=0;i<6;i++){
   const t=(i+1)/6,wave=reduced?0:Math.sin((state.time+tick*h)*4.1-i*.8)*(.014+speed*.065)*t;
   const goal=target*(.3+.7*t)+wave+(i?state.angles[i-1]-target*(.3+.7*i/6):0)*.24,pressure=1+speed*2.5;
   state.velocity[i]+=(cut.spring*pressure*(goal-state.angles[i])-cut.damping*Math.sqrt(pressure)*state.velocity[i])*h;
   state.angles[i]=Math.max(-1.4,Math.min(1.4,state.angles[i]+state.velocity[i]*h));
  }
  state.lift+=(Math.max(-.06,Math.min(.3,vy/2500))-(state.lift||0))*(1-Math.exp(-dt*12));
  Object.assign(state,{time,x,y,speed});return state;
 }
 function cape(g,id,view,time=0,moving=false,front=false,reduced=false,motion={},frame=null){
  const cut=cuts[id];if(!cut||(view==='back')!==front)return;
  const side=view==='left'||view==='right',dir=view==='left'?-1:1,socket=frame?.capeSocket||{x:side?24-dir*3:23.5,y:29},p=cut.palette;
  const points=[[0,0]],angles=motion.angles||Array.from({length:6},(_,i)=>reduced?0:Math.sin(time*4.1-i*.8)*.035*(i+1));
  for(let i=0;i<6;i++){const a=angles[i],last=points[i];points.push([last[0]+Math.sin(a)*cut.length/6,last[1]+Math.cos(a)*cut.length/6*(1-(motion.lift||0))]);}
  function at(u,v){
   const pos=Math.max(0,Math.min(6,v*6)),i=Math.min(5,Math.floor(pos)),f=pos-i,a=angles[i]*.65;
   const sway=id==='cinder'&&!reduced?Math.sin(time*5.3-v*5+(u<0?0:1.8))*v*v*(motion.speed||0)*2:0;
   return [socket.x-24+points[i][0]*(1-f)+points[i+1][0]*f+u*cut.width*(side?.48:1)*Math.cos(a)+sway-(side?dir*v*2:0),socket.y-65+Math.max(0,points[i][1]*(1-f)+points[i+1][1]*f-u*cut.width*(side?.48:1)*Math.sin(a))];
  }
  const shape=cut.outline.map(([u,v])=>at(u,v));poly(g,ink,shape);
  const inset=cut.outline.map(([u,v])=>at(u*.86,v*.95+.015));poly(g,p[0],inset);
  // Sewn panels bend through the same mesh as the silhouette and embroidery.
  function panel(coords,c){poly(g,c,coords.map(([u,v])=>at(u,v)));}
  panel([[-.57,.08],[-.21,.13],[-.25,.62],[-.45,id==='cinder'?.88:.77],[-.65,.68]],p[1]);
  panel([[.17,.1],[.3,.22],[.55,.7],[.36,.76],[.12,.43]],p[1]);
  if(id==='cinder'){
   panel([[.55,.56],[.7,.85],[.39,.93],[.28,.66]],p[2]);panel([[-.48,.57],[-.72,.79],[-.49,.86],[-.28,.65]],p[2]);
  }else if(id==='courier'){
   panel([[-.78,.72],[-.39,.88],[.31,.93],[.7,.79],[.67,.84],[.3,.96],[-.41,.91]],p[2]);
   if(!side)panel([[-.04,.23],[-.29,.31],[-.29,.45],[-.07,.53],[.15,.48],[-.04,.46],[-.13,.35]],p[2]);
  }else{
   panel([[.78,.27],[.7,.62],[.6,.73],[.56,.58],[.68,.28]],p[2]);
   if(!side)panel([[-.37,.26],[-.24,.34],[-.08,.22],[.08,.34],[.29,.25],[.22,.43],[-.3,.43]],p[2]);
   panel([[-.06,.8],[.07,.87],[.11,.94],[-.02,.91]],p[1]);
  }
  // Only the short collar is rigid; it follows the animated neck socket exactly.
  const x=Math.round(socket.x-24),y=Math.round(socket.y-65);rect(g,p[0],x-(side?2:5),y,side?5:11,3);rect(g,p[2],x-(side?1:4),y+1,side?3:9,1);
 }
 function trail(g,id,x,y,t,alpha=1,reduced=false){
  if(!id||id==='plaintrail')return;g.save();g.globalAlpha*=Math.max(0,alpha)*.75;
  for(let i=0;i<(reduced?2:6);i++){const a=i*2.4+t*2,r=4+i*2,px=Math.round(x+Math.cos(a)*r),py=Math.round(y+Math.sin(a)*r*.4-5-i*2);if(id==='moonwake')star(g,px,py,i%2?'#9abac9':cream,i%3?1:2);else{rect(g,i%2?'#d29653':cream,px,py,2,2);if(i%2===0)rect(g,'#947856',px+2,py-1,1,1);}}
  g.restore();
 }
 function flourish(g,id,x,y,angle,radius,phase,alpha=1,reduced=false){
  if(!id||id==='plainstrike')return;g.save();g.globalAlpha*=Math.max(0,alpha)*.8;
  let previous=null;for(let i=0;i<(reduced?2:5);i++){const a=angle+(i-2)*.18,r=radius-5-i*2+Math.min(.8,phase)*(i%2?4:-3),px=Math.round(x+Math.cos(a)*r),py=Math.round(y+Math.sin(a)*r);if(id==='constellation'){if(previous&&!reduced){g.strokeStyle='#8c8fb666';g.lineWidth=1;g.beginPath();g.moveTo(previous.x,previous.y);g.lineTo(px,py);g.stroke();}star(g,px,py,i%2?'#b1b4de':cream,i%3?1:2);}else rect(g,i%2?'#d79257':'#eed096',px,py,2+(i===0),2);previous={x:px,y:py};}
  g.restore();
 }
 function shot(g,id,x,y,angle,time,reduced,radius=7){
  const tint=palettes[id],dark=id==='roast'?'#211916':tint?.[0]||'#211916',shine=id==='roast'?'#b7b5a5':tint?.[1]||'#b7b5a5';
  g.save();g.translate(x,y);g.rotate(angle);g.scale(radius/7,radius/7);
  // A continuous, glossy coffee jet; highlights are thin wet reflections, not chunks.
  const ripple=reduced?0:Math.sin(time*27)*1.2;
  g.fillStyle=dark;g.beginPath();g.moveTo(7,0);g.bezierCurveTo(4,-4,-2,-5,-12,-2+ripple);g.bezierCurveTo(-18,ripple,-25,-1-ripple,-34,-.5+ripple);g.bezierCurveTo(-21,4-ripple,-11,2+ripple,-5,4);g.bezierCurveTo(1,5,5,3,7,0);g.fill();
  g.strokeStyle='#4c3529';g.lineWidth=1.8;g.beginPath();g.moveTo(-21,1);g.bezierCurveTo(-10,0,-3,2,4,0);g.stroke();
  g.strokeStyle=shine;g.lineWidth=.85;g.beginPath();g.moveTo(-8,-2);g.quadraticCurveTo(0,-4,4,-1);g.stroke();
  if(!reduced){
   g.strokeStyle='#d1cec03a';g.lineWidth=.8;for(let i=0;i<2;i++){const drift=Math.sin(time*17+i*2)*1.4;g.beginPath();g.moveTo(-12-i*6,-4-i*2);g.bezierCurveTo(-19,-6+drift,-25,-4-i*3,-35-i*7,-6-i*3);g.stroke();}
   g.fillStyle='#38271f';for(let i=0;i<4;i++){const d=Math.sin(time*21+i*2.3)*3;g.beginPath();g.ellipse(-17-i*6,d,1.5-i*.2,.7,0,0,TAU);g.fill();}
  }g.restore();return true;
 }
 function tonic(g,x,y,t,reduced){
  const bob=reduced?0:Math.round(Math.sin(t*3)*2);g.save();g.translate(Math.round(x),Math.round(y)+bob);
  rect(g,'#232b2b99',-10,0,20,3);rect(g,ink,-6,-20,12,18);rect(g,ink,-3,-25,6,6);rect(g,gold,-3,-25,6,3);rect(g,'#5f8b76',-4,-18,8,14);rect(g,'#b9d6b0',-3,-17,2,11);rect(g,'#e5d4a9',-4,-13,8,5);rect(g,'#5b735b',-1,-12,2,3);rect(g,'#5b735b',-2,-11,4,1);
  if(!reduced)star(g,11,-19+Math.round(Math.sin(t*2)*4),'#dbe0b0',2);g.restore();
 }
 function icon(item,size=40){
  const c=document.createElement('canvas');c.width=c.height=48;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  if(item.slot==='espresso'){g.translate(5,2);g.scale(1.05,1.05);pistolPair(g,item.id);}
  if(item.slot==='baguette'){g.translate(7,38);g.rotate(-.85);g.scale(.62,.62);blade(g,item.id);}
  if(item.slot==='cape'){g.translate(24,46);if(item.id==='bare'){rect(g,'#66594d',-12,-24,24,1);}else cape(g,item.id,'back',0,false,true,true);}
  if(item.slot==='trail')trail(g,item.id,24,33,1,1,false);
  if(item.slot==='strike')flourish(g,item.id,8,34,-.6,29,.4,1,false);
  c.style.width=c.style.height=size+'px';c.setAttribute('aria-hidden','true');return c;
 }
 root.MOROGUE_COSMETIC_ART={cup,cupBehind,heldCup,pistol,pistolPair,pistolSockets,heldPistols,blade,cape,stepCape,trail,flourish,shot,tonic,icon};
})(globalThis);
