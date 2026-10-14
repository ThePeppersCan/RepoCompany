/* The original transparent artwork is sampled directly: independent facial and branch deformation. */
(function(root){'use strict';
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},pulse=(t,at,w)=>Math.exp(-Math.pow((t-at)/w,2));
 const assets={};for(const[id,file]of Object.entries({tree:'grand-tree-v1.png',riv:'riv-rig-v1.png',my:'my-rig-v1.png',ground:'cat-ground-rig-v4.png',botany:'vines-collars-v3.png',backdrop:'grove-backdrop-v3.png',poses:'cat-poses-v3.png',mouth:'mouth-charms-v2.png',title:'title-v2.png'})){const im=new Image();im.crossOrigin='anonymous';im.src='https://repocompany.uk/game-integrations/morogue/grove-assets/'+file;assets[id]=im;}
 const ready=Promise.all(Object.values(assets).map(i=>i.decode()));
 function triangle(ctx,img,a,b,c,p,q,r){const det=a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y);if(Math.abs(det)<.001)return;
  const m=(p.x*(b.y-c.y)+q.x*(c.y-a.y)+r.x*(a.y-b.y))/det,n=(p.y*(b.y-c.y)+q.y*(c.y-a.y)+r.y*(a.y-b.y))/det,o=(p.x*(c.x-b.x)+q.x*(a.x-c.x)+r.x*(b.x-a.x))/det,v=(p.y*(c.x-b.x)+q.y*(a.x-c.x)+r.y*(b.x-a.x))/det,tx=p.x-m*a.x-o*a.y,ty=p.y-n*a.x-v*a.y;
  ctx.save();ctx.beginPath();const center={x:(p.x+q.x+r.x)/3,y:(p.y+q.y+r.y)/3},padding=Math.min(.5,Math.min(Math.hypot(p.x-q.x,p.y-q.y),Math.hypot(p.x-r.x,p.y-r.y))*.012);for(const[i,pt]of[p,q,r].entries()){const dx=pt.x-center.x,dy=pt.y-center.y,len=Math.hypot(dx,dy)||1;ctx[i?'lineTo':'moveTo'](pt.x+dx/len*padding,pt.y+dy/len*padding);}ctx.closePath();ctx.clip();ctx.transform(m,n,o,v,tx,ty);ctx.drawImage(img,0,0);ctx.restore();
 }
 function mesh(ctx,img,rect,cols,rows,deform){if(!img.complete||!img.naturalWidth)return;const points=[];for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)points.push({s:{x:rect[0]+rect[2]*x/cols,y:rect[1]+rect[3]*y/rows},d:deform(x/cols,y/rows)});for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=points[y*(cols+1)+x],b=points[y*(cols+1)+x+1],c=points[(y+1)*(cols+1)+x],d=points[(y+1)*(cols+1)+x+1];triangle(ctx,img,a.s,b.s,c.s,a.d,b.d,c.d);triangle(ctx,img,b.s,d.s,c.s,b.d,d.d,c.d);}}
 function tree(ctx,{x,y,w,h,growth,time,reduced}){const trunk=ease(growth*1.28),crown=ease((growth-.19)/.81);ctx.save();ctx.globalAlpha=ease(growth*7);mesh(ctx,assets.tree,[0,0,1536,1024],14,10,(u,v)=>{const edge=Math.abs(u-.5)*2,fan=(.13+.87*(v>.8?ease(growth*2):crown)),breath=reduced?0:Math.sin(time*.52+u*6+v*2)*(.6+edge*2.6);return{x:x+w*.5+(u-.5)*w*fan+breath*crown,y:y+h-(1-v)*h*trunk+Math.sin(u*10+time*.64)*(reduced?0:edge*2.3)*crown};});ctx.restore();}

 // Textured ribbons follow their centreline; alpha remains the source sprite's real cutout.
 function ribbon(ctx,points,thickness,variant=0){
  if(points.length<2)return;const rect=variant===0?[26,44,1502,249]:variant===1?[27,295,1483,207]:[22,497,1501,234],count=points.length-1;
  // Small overlapping texture slices retain bark detail without thousands of clipped triangles per wave.
  ctx.save();ctx.imageSmoothingEnabled=true;for(let i=0;i<count;i++){const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<.01)continue;const wide=thickness*(.85+.15*Math.sin((i+.5)/count*Math.PI));ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(dy,dx));ctx.drawImage(assets.botany,rect[0]+rect[2]*i/count,rect[1],rect[2]/count,rect[3],-.6,-wide/2,len+1.2,wide);ctx.restore();}ctx.restore();
 }
 function vine(ctx,a,b,bend=0,progress=1,thickness=7,time=0){
  progress=clamp(progress);if(progress<.005)return;const n=thickness>6?15:8,points=[];
  for(let i=0;i<=n;i++){const u=i/n*progress,wave=Math.sin(u*Math.PI)*Math.sin(u*8-time*2.2)*(1-progress)*thickness*2;points.push({x:a.x+(b.x-a.x)*u+Math.sin(u*Math.PI)*bend+wave,y:a.y+(b.y-a.y)*u+Math.sin(u*Math.PI)*Math.sin(time*1.2+u*6)*thickness*.55});}
  ctx.save();ctx.globalAlpha*=.32;ctx.translate(3,5);ribbon(ctx,points,thickness*4.2,2);ctx.restore();ribbon(ctx,points,thickness*4,thickness>6?2:1);
  const tip=points[n],before=points[n-1];ctx.save();ctx.translate(tip.x,tip.y);ctx.rotate(Math.atan2(tip.y-before.y,tip.x-before.x)-.18);const size=thickness*7;ctx.drawImage(assets.botany,33,723,406,285,-size*.65,-size*.36,size,size*.70);ctx.restore();
 }
 function coil(ctx,{x,y,width,height,progress=1,time=0,front=true}){
  const points=[],turns=2.2,steps=28;for(let i=0;i<=steps*clamp(progress);i++){const u=i/steps,a=u*turns*Math.PI*2+time*.18;points.push({x:x+Math.cos(a)*width*(1-u*.18),y:y-u*height+Math.sin(a)*width*.25,front:Math.sin(a)>0});}
  let run=[];for(const p of points){if(p.front===front){run.push(p);}else{if(run.length>1)ribbon(ctx,run,Math.max(10,width*.75),2);run=[];}}if(run.length>1)ribbon(ctx,run,Math.max(10,width*.75),2);
 }
 function branch(ctx,{x,y,size,alpha=1,time=0,reduced=false}){ctx.save();ctx.globalAlpha*=alpha;const pts=[];for(let i=0;i<=12;i++){const u=i/12;pts.push({x:x+(-.65+u*.97)*size,y:y+(.05+Math.sin(u*Math.PI)*.055)*size+(reduced?0:Math.sin(time*.42+u*2)*1.1)});}ribbon(ctx,pts,size*.23,0);ctx.restore();}
 function backdrop(ctx,{w,h,reveal,time,reduced}){if(reveal<=0)return;const im=assets.backdrop,scale=Math.max(w/im.naturalWidth,h/im.naturalHeight)*1.025,iw=im.naturalWidth*scale,ih=im.naturalHeight*scale,parallax=reduced?0:Math.sin(time*.09)*4;
  ctx.save();ctx.globalAlpha=ease(reveal);ctx.beginPath();ctx.moveTo(0,h);const radius=Math.hypot(w,h)*ease(reveal);for(let i=0;i<=60;i++){const a=Math.PI+i/60*Math.PI;ctx.lineTo(w*.5+Math.cos(a)*radius,h*.88+Math.sin(a)*radius);}ctx.lineTo(w,h);ctx.closePath();ctx.clip();ctx.drawImage(im,(w-iw)/2+parallax,(h-ih)/2,iw,ih);ctx.restore();
 }
 function head(ctx,{id,time,reduced=false,rotation=0,watchX=0,inverted=false}){
  const image=assets[id],t=time+(id==='my'?4.9:0),headW=.345,headH=.355,jaw=reduced?.016:.023+Math.sin(t*.61)*.018+pulse(t%23.7,14,.6)*.026;ctx.save();ctx.rotate(rotation);
  mesh(ctx,image,[13,73,526,541],12,12,(u,v)=>{const weight=(cx,cy,rx,ry)=>Math.exp(-Math.pow((u-cx)/rx,2)-Math.pow((v-cy)/ry,2)),left=weight(.38,.46,.092,.065),right=weight(.656,.46,.091,.065),blinkL=reduced?0:pulse(t%8.9,7.4,.095),blinkR=reduced?0:pulse(t%11.3,8.5,.105),ear=v<.35?ease((.35-v)/.26):0,twitch=reduced?0:pulse(t%17.9,5.8,.065)-pulse(t%17.9,5.95,.12)*.4,gaze=clamp(Number.isFinite(watchX)?watchX:0,-.8,.8)*(inverted?-1:1);let dx=reduced?0:(Math.sin(t*.71)*left+Math.sin(t*.93+1.7)*right)*.006+gaze*.014*(left+right)+ear*twitch*(u<.5?-.02:.018),dy=-(v-.46)*(blinkL*left+blinkR*right)*.87;dy+=ease((v-.64)/.32)*jaw;return{x:(u-.5)*headW+dx,y:(v-.71)*headH+dy};});
  if(!reduced){const tongue=.25+.75*(.5+.5*Math.sin(t*.45+1.5));ctx.save();ctx.translate(.008,.011);ctx.rotate(Math.sin(t*.78)*.15);mesh(ctx,image,[211,654,176,330],3,7,(u,v)=>({x:(u-.5)*.076+Math.sin(t*.83+v*3)*v*.011,y:v*(.066+tongue*.067)+jaw*.4}));ctx.restore();}ctx.restore();
 }
 const limbRects={riv:{front:[665,27,186,481],back:[917,41,239,464]},my:{front:[667,521,194,475],back:[919,528,239,465]}};
 function limb(ctx,id,shoulder,elbow,paw,width=.09,hind=false){const rect=limbRects[id][hind?'back':'front'];mesh(ctx,assets.ground,rect,3,12,(u,v)=>{const inv=1-v,cx=inv*inv*shoulder.x+2*inv*v*elbow.x+v*v*paw.x,cy=inv*inv*shoulder.y+2*inv*v*elbow.y+v*v*paw.y,tx=2*inv*(elbow.x-shoulder.x)+2*v*(paw.x-elbow.x),ty=2*inv*(elbow.y-shoulder.y)+2*v*(paw.y-elbow.y),len=Math.hypot(tx,ty)||1,wide=width*(1-.09*v);return{x:cx-ty/len*(u-.5)*wide,y:cy+tx/len*(u-.5)*wide};});}
 function collar(ctx,id,x,y,width=.255){const rect=id==='my'?[1002,746,502,213]:[486,747,478,210],height=width*rect[3]/rect[2];ctx.drawImage(assets.botany,...rect,x-width/2,y,width,height);return{x,y:y+height*.88};}
 function charm(ctx,{id,socket,size,time,reduced=false,impulse=0}){const other=id==='my',rect=other?[1220,581,307,430]:[869,580,334,392],pin=other?{x:84,y:12}:{x:98,y:12},width=size*.071,height=width*rect[3]/rect[2];ctx.save();ctx.translate(socket.x,socket.y);ctx.rotate(reduced?0:Math.sin(time*(other?1.63:1.41)+.5)*.11+impulse*.16);ctx.drawImage(assets.mouth,...rect,-pin.x/rect[2]*width,-pin.y/rect[3]*height,width,height);ctx.restore();return{...socket};}
 function cat(ctx,{id,x,y,size,time,reduced=false,reach=null,active=0,watch=null}){
  const image=assets[id],other=id==='my',t=time+(other?4.9:0),sway=reduced?0:Math.sin(t*(other?.78:.36))*(other?.083:.008),jerk=reduced?0:pulse(t%19.7,8.4,.09)*.035-pulse(t%19.7,8.57,.12)*.016,neckAngle=(other?-.13:.07)+sway*.6+jerk,breath=reduced?0:Math.sin(t*1.41)*.007;
  const pivot=other?{x:.15,y:-.59}:{x:-.28,y:-.12},rotation=sway+active*(other?.24:-.025),co=Math.cos(rotation),si=Math.sin(rotation);
  const world=p=>({x:x+(pivot.x+(p.x-pivot.x)*co-(p.y-pivot.y)*si)*size,y:y+(pivot.y+(p.x-pivot.x)*si+(p.y-pivot.y)*co)*size});
  const local=p=>{const dx=(p.x-x)/size-pivot.x,dy=(p.y-y)/size-pivot.y;return{x:pivot.x+dx*co+dy*si,y:pivot.y-dx*si+dy*co};};
  const point=reach?local(reach):null;ctx.save();ctx.translate(x,y);ctx.scale(size,size);ctx.translate(pivot.x,pivot.y);ctx.rotate(rotation);ctx.translate(-pivot.x,-pivot.y);
  // Each animal has its own anatomy and support: a reclining torso and a tail suspension.
  if(!other){
   mesh(ctx,assets.poses,[982,14,536,460],6,8,(u,v)=>({x:-.69+u*.27+Math.sin(t*.65+v*3)*v*(reduced?0:.021),y:-.32+v*.48}));
   mesh(ctx,assets.poses,[58,59,884,382],9,5,(u,v)=>({x:-.54+u*.64,y:-.25+v*.29+Math.pow(u,3)*.12+Math.sin(u*3+t*.9)*(reduced?0:.004)+breath*v}));
  }else{
   mesh(ctx,assets.poses,[819,465,614,544],7,8,(u,v)=>({x:-.065+u*.34+Math.sin(t*.8+v*3)*(reduced?0:.007)*v,y:-.69+v*.37}));
   mesh(ctx,assets.poses,[181,451,528,552],7,8,(u,v)=>({x:-.16+u*.31+Math.sin(t*.6+v*2)*(reduced?0:.006),y:-.41+v*.37+breath*v}));
  }
  const paws=[];for(let i=0;i<2;i++){
   const shoulder={x:i?.077:-.091,y:other?-.045:-.015},rest=other?{x:i?.215:-.215,y:.22+Math.sin(t*.83+i)*(reduced?0:.017)}:{x:i?.085:-.08,y:.31+Math.sin(t*.61+i)*(reduced?0:.015)},amount=active*(i===(other?0:1)?1:.32),target=point?{x:rest.x+(point.x-rest.x)*amount,y:rest.y+(point.y-rest.y)*amount}:rest,l1=.15,l2=.195,vx=target.x-shoulder.x,vy=target.y-shoulder.y,d=clamp(Math.hypot(vx,vy),.047,l1+l2-.001),angle=Math.atan2(vy,vx),offset=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1)),elbow={x:shoulder.x+Math.cos(angle+(i?-1:1)*offset)*l1,y:shoulder.y+Math.sin(angle+(i?-1:1)*offset)*l1},paw={x:shoulder.x+Math.cos(angle)*d,y:shoulder.y+Math.sin(angle)*d},rect=other?(i?[1138,521,179,480]:[791,520,181,481]):(i?[1137,28,187,479]:[797,20,179,486]);
   limb(ctx,id,shoulder,elbow,paw);paws.push(world(paw));
  }
  ctx.save();ctx.translate(0,other?.045:0);head(ctx,{id,time,reduced,rotation:(other?Math.PI:0)+neckAngle-active*(other?-.12:.12),watchX:watch?(watch.x-x)/size:0,inverted:other});ctx.restore();
  const collarLocal=collar(ctx,id,0,other?-.088:.068),socket=world(collarLocal);ctx.restore();charm(ctx,{id,socket,size,time,reduced,impulse:sway});
  return{id,pose:other?'tail-hanging':'branch-reclining',sway,neckAngle,active,paws,anchor:world(pivot),head:world({x:0,y:other?.14:-.11}),collarSocket:socket,tagSocket:socket,x,y,size};
 }
 function groundCat(ctx,{id,x,y,size,time,direction=1,distance=0,running=0,jump=0,play=0,reach=null,reduced=false,alpha=1,angle=0}){
  const other=id==='my',gait=reduced?0:distance/Math.max(1,size*.82)*Math.PI*2,bob=reduced?0:Math.sin(gait*2)*.012*running,crouch=.055*jump,co=Math.cos(angle),si=Math.sin(angle),toWorld=p=>({x:x+(p.x*direction*co-p.y*si)*size,y:y+(p.x*direction*si+p.y*co)*size});
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.scale(size*direction,size);const paws=[];
  for(const backLayer of [true,false]){
   for(let i=0;i<2;i++){const hind=i===0,phase=gait+(hind?Math.PI:0)+(backLayer?Math.PI:0),stride=Math.sin(phase)*.13*running,lift=Math.max(0,Math.cos(phase))*.11*running,rootX=hind?-.30:.095,rootY=(hind?-.21:-.23)+bob+crouch,shoulder={x:rootX,y:rootY},paw={x:rootX+stride+(backLayer?-.045:.04),y:-lift-.15*jump};
    if(!hind&&!backLayer&&reach&&play>0){const dx=(reach.x-x)/size,dy=(reach.y-y)/size,target={x:(dx*co+dy*si)*direction,y:-dx*si+dy*co};paw.x+=(target.x-paw.x)*play;paw.y+=(target.y-paw.y)*play;const len=Math.hypot(paw.x-shoulder.x,paw.y-shoulder.y);if(len>.38){paw.x=shoulder.x+(paw.x-shoulder.x)/len*.38;paw.y=shoulder.y+(paw.y-shoulder.y)/len*.38;}}
    const elbow={x:(shoulder.x+paw.x)/2+(hind?.085:-.03),y:(shoulder.y+paw.y)/2-.02};ctx.save();if(backLayer)ctx.globalAlpha*=.76;limb(ctx,id,shoulder,elbow,paw,hind?.10:.083,hind);ctx.restore();paws.push(toWorld(paw));
   }
   if(backLayer){const tail=other?[1201,514,325,496]:[1200,25,326,487];mesh(ctx,assets.ground,tail,5,8,(u,v)=>({x:-.57+u*.25+Math.sin(time*1.6+v*4)*.024*v,y:-.51+v*.31+bob+crouch}));const body=other?[13,551,646,414]:[14,69,644,407];mesh(ctx,assets.ground,body,8,5,(u,v)=>({x:-.43+u*.59,y:-.39+v*.29+bob+crouch+Math.sin(u*Math.PI)*Math.sin(gait)*.012*running}));}
  }
  ctx.save();ctx.translate(.15,-.245+bob+crouch);head(ctx,{id,time,reduced,rotation:.06+Math.sin(gait)*.015*running-play*.10,watchX:play});ctx.restore();const localSocket=collar(ctx,id,.15,-.173+bob+crouch,.23),socket=toWorld(localSocket);ctx.restore();ctx.save();ctx.globalAlpha*=alpha;charm(ctx,{id,socket,size,time,reduced,impulse:running*Math.sin(gait)});ctx.restore();return{id,pose:running?'running':jump?'jumping':'ground',x,y,size,paws,collarSocket:socket,tagSocket:socket,alpha};
 }
 function mouth(ctx,{x,y,width,close=0,time=0,reduced=false,layer='back',alpha=1,transform=0}){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha*=alpha;const shake=reduced?0:Math.sin(time*39)*transform*width*.003;ctx.translate(shake,0);
  if(layer==='back'){
   const dark=ctx.createRadialGradient(0,0,0,0,0,width*.48);dark.addColorStop(0,'#01090b');dark.addColorStop(.72,'#060d0e');dark.addColorStop(1,'#1b211900');ctx.fillStyle=dark;ctx.beginPath();ctx.ellipse(0,-width*.14*close,width*.36,width*(.36-.20*close),0,0,Math.PI*2);ctx.fill();
   // Closing jaws cover the platform and its occupant; the player remains behind them.
   ctx.save();ctx.globalAlpha*=1-ease(close);ctx.drawImage(assets.mouth,0,579,817,445,-width*.22,width*.045,width*.44,width*.24);ctx.restore();
  }else{
   ctx.drawImage(assets.mouth,0,0,794,575,-width*.5,-width*.56+close*width*.045,width,width*.724);
   ctx.drawImage(assets.mouth,796,88,740,489,-width*.5,width*.03-close*width*.435,width,width*.661);
   if(transform>0){ctx.globalCompositeOperation='screen';ctx.globalAlpha*=transform*(reduced?.18:.52);ctx.strokeStyle='#e1c77f';ctx.lineWidth=Math.max(1,width*.004);for(let i=0;i<5;i++){ctx.beginPath();for(let j=0;j<70;j++){const a=j*.15+i*1.26+(reduced?0:time*(i%2?-1:1)*.9),r=width*(.035+j*.0021);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r*.72-width*.03);}ctx.stroke();}ctx.globalCompositeOperation='source-over';}
  }ctx.restore();
 }
 root.MOROGUE_GROVE_RIG={ready,assets,tree,cat,groundCat,mouth,vine,coil,branch,backdrop,mesh,ease,clamp};
})(globalThis);
