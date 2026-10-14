(function(root){
 'use strict';const TAU=Math.PI*2;
 function icon(id,size=64){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);},outline='#302e28',gold='#e0c38b',light='#f5e6b9',teal='#97c9bc';
  if(id==='steam'){r(6,12,19,14,outline);r(8,13,14,10,'#ad723f');r(10,14,4,8,gold);r(22,14,7,3,gold);r(25,17,4,4,gold);r(11,8,10,4,outline);r(12,8,8,2,gold);r(15,3,3,5,teal);r(19,1,3,4,light);r(5,26,22,2,gold);}
  else if(id==='bell'){r(14,4,4,4,gold);r(10,8,12,5,outline);r(8,13,16,10,outline);r(10,10,12,13,gold);r(7,22,18,4,gold);r(6,25,20,2,outline);r(14,27,4,3,gold);r(12,11,3,9,light);r(22,9,4,2,teal);r(26,14,3,2,teal);}
  else if(id==='garden'){r(12,4,8,3,gold);r(10,8,12,19,outline);r(12,10,8,14,gold);r(14,12,4,9,'#6b925c');r(8,26,17,2,gold);r(5,17,6,4,'#8eb07b');r(21,19,7,4,'#aac791');r(8,21,3,6,'#6f895a');r(21,23,3,7,'#6f895a');r(14,14,3,3,light);}
  else if(id==='comet'){r(22,3,3,7,'#b8a0cf');r(25,1,3,4,light);r(18,8,4,7,'#d1b7e7');r(13,14,8,12,outline);r(8,17,17,6,outline);r(14,12,5,15,gold);r(9,17,15,5,gold);r(13,16,8,8,light);r(12,25,3,3,'#b8a0cf');}
  else if(id==='tide'){for(let i=0;i<3;i++){const y=8+i*7;r(4,y,7,2,teal);r(10,y-3,8,2,light);r(16,y,11,2,teal);r(24,y-2,4,2,'#659fa7');}r(14,4,3,23,'#baaf89');r(12,22,7,3,gold);}
  else if(id==='clock'){r(8,4,16,3,gold);r(9,26,14,3,gold);r(11,7,2,6,teal);r(19,7,2,6,teal);r(13,12,6,3,teal);r(15,15,2,4,gold);r(12,19,8,6,teal);r(14,21,4,4,gold);r(7,2,18,2,outline);r(7,29,18,2,outline);}
  else if(id==='volley'){r(6,19,13,8,outline);r(8,20,9,5,gold);r(17,20,5,2,gold);r(20,22,2,3,gold);for(const [x,y]of [[7,10],[15,5],[24,9]]){r(x,y,3,5,teal);r(x+1,y-2,2,2,light);}}
  else if(id==='surge'){r(9,13,15,14,outline);r(11,15,11,10,'#a66e3d');r(12,16,3,7,gold);r(23,15,5,3,outline);r(26,17,2,7,outline);r(22,23,5,2,outline);r(14,5,4,8,'#a16b43');r(17,2,3,9,'#ca9152');r(16,7,2,7,light);r(7,27,20,2,outline);}
  else if(id==='echo'){for(let i=0;i<2;i++){const x=5+i*10;r(x+3,4,5,18,outline);r(x+4,5,2,14,i?'#788b81':'#b78e57');r(x+3,20,7,3,outline);r(x,20,3,3,outline);r(x+4,23,3,6,'#8b5c38');r(x+3,29,5,2,outline);}r(3,9,2,5,'#8b9a85');}
  else if(id==='quickdraw'){r(16,7,9,15,outline);r(13,20,15,8,outline);r(12,23,3,5,outline);r(18,9,5,12,'#997044');r(15,22,11,4,'#b68b55');r(17,25,10,1,gold);r(11,28,18,2,outline);r(4,13,9,2,'#677c70');r(2,18,8,2,'#677c70');r(6,23,4,2,'#677c70');}
  else{r(7,5,18,23,outline);r(9,6,14,20,gold);r(11,8,10,16,'#425b48');r(15,10,3,12,light);r(11,15,11,3,light);r(23,8,2,16,'#98784d');}
  c.style.width=c.style.height=size+'px';c.setAttribute('aria-hidden','true');return c;
 }
 // Effects use stepped geometry and the game's small copper / leaf / steam palette.
 // Draw from simulation age: pausing freezes them, and reduced effects keep every tell.
 const clamp01=n=>Math.max(0,Math.min(1,n)),snap=n=>Math.round(n/2)*2;
 function chip(g,x,y,w,h,colour,alpha=1){g.globalAlpha=alpha;g.fillStyle=colour;g.fillRect(snap(x),snap(y),Math.max(2,snap(w)),Math.max(2,snap(h)));}
 function arc(g,x,y,r,colour,alpha=1,start=0,end=TAU){g.globalAlpha=alpha;g.strokeStyle=colour;g.lineWidth=2;g.beginPath();const n=Math.max(2,Math.ceil((end-start)*r/12));for(let i=0;i<=n;i++){const a=start+(end-start)*i/n,px=snap(x+Math.cos(a)*r),py=snap(y+Math.sin(a)*r);i?g.lineTo(px,py):g.moveTo(px,py);}g.stroke();}
 function burst(g,f,q,reduced,colour=f.colour){const n=reduced?8:20;for(let i=0;i<n;i++){const a=i*2.399,r=f.radius*(.18+q*.85)*(i%3?1:.7),x=f.x+Math.cos(a)*r,y=f.y+Math.sin(a)*r;chip(g,x,y-Math.sin(q*Math.PI)*(8+i%4*4),i%3?3:5,2+i%3,colour,(1-q)*.85);}arc(g,f.x,f.y,f.radius*(.3+.7*q),colour,(1-q)*.7);}
 function special(g,f,reduced){
  const t=clamp01(f.age/f.life),fade=clamp01((f.life-f.age)/.35),ivory='#f0dfb5',shadow='#302c2c';
  if(f.kind==='stitch'){g.translate(f.x,f.y-18);g.rotate(f.angle);for(let i=0;i<3;i++){g.strokeStyle=i===1?'#eee0ab':'#6a7454';g.lineWidth=i===1?2:3;g.globalAlpha=(1-t)*.75;g.beginPath();g.moveTo(0,i-1);g.quadraticCurveTo(f.length*.5,Math.sin(t*Math.PI)*9*(i-1),f.length,0);g.stroke();}return true;}
  if((f.kind==='petals'||f.kind==='faultline')){if(f.fired)burst(g,f,clamp01((f.age-f.delay)/(f.life-f.delay)),reduced,'#baceaa');else for(let i=0;i<8;i++){const a=i*TAU/8,r=f.radius*(1-clamp01(f.age/f.delay)*.55);chip(g,f.x+Math.cos(a)*r,f.y+Math.sin(a)*r,4,2,'#bccb9e',.7);}return true;}
  if(f.kind==='lance'){
   g.translate(f.x,f.y-18);g.rotate(f.angle);
   const q=clamp01((f.age-f.delay)/(f.life-f.delay));
   if(!f.fired){const k=clamp01(f.age/f.delay);chip(g,8,-5,10+16*k,10,shadow,.8);chip(g,12,-2,10+12*k,4,ivory,.85);for(const side of [-1,1])chip(g,6+14*k,side*(12-6*k),4,3,f.colour,.7);}
   else{const tip=f.length,alpha=(1-q);for(let y=-f.width;y<=f.width;y+=4){const inset=Math.abs(y)*2;chip(g,12+inset,y,tip-24-inset*2,4,f.colour,alpha*.12);}chip(g,12,-4,tip-12,8,shadow,alpha*.65);chip(g,14,-2,tip-18,4,ivory,alpha*.95);for(let i=0;i<(reduced?6:16);i++){const x=20+i*(tip-30)/(reduced?6:16)+q*18,spread=(.35+q*.65)*f.width;chip(g,x,Math.sin(i*2.3)*spread,8+i%3*5,2,i%3?f.colour:ivory,alpha*.7);if(!reduced)chip(g,x-12,Math.sin(i*2.3)*spread-3,7,2,'#948875',alpha*.35);}for(const side of [-1,1]){g.globalAlpha=alpha*.7;g.strokeStyle=f.colour;g.beginPath();g.moveTo(tip-22,side*9);g.lineTo(tip,0);g.stroke();}}
   return true;
  }
  if(f.kind==='bellwave'||f.kind==='bloom'){burst(g,f,t,reduced);if(f.kind==='bellwave')arc(g,f.x,f.y-10,f.radius*(.1+.9*t),'#f5e5bc',(1-t)*.65,.15,TAU-.15);return true;}
  if(f.kind==='guard'){
   const pulse=reduced?0:Math.sin(t*Math.PI)*3;
   arc(g,f.x,f.y-22,30+pulse,shadow,.8,Math.PI*.15,Math.PI*.85);arc(g,f.x,f.y-22,32+pulse,ivory,fade*.8,Math.PI*.15,Math.PI*.85);
   for(const side of [-1,1]){chip(g,f.x+side*22-2,f.y-48,4,18,f.colour,fade*.85);chip(g,f.x+side*18-2,f.y-51,4,5,ivory,fade*.8);}return true;
  }
  if(f.kind==='comet'){
   if(f.impactId==='bell'){if(f.fired)burst(g,f,clamp01((f.age-f.delay)/.4),reduced,'#ecd8a0');return true;}
   if(!f.fired){const q=clamp01(f.age/f.delay);for(let i=0;i<4;i++){const a=i*Math.PI/2;arc(g,f.x,f.y,f.radius,f.colour,.55,a-.14,a+.14);}arc(g,f.x,f.y,f.radius*(1-q)*.8,f.colour,.4);chip(g,f.x-3,f.y-3,6,6,ivory,.8);
    const h=reduced?24:205*(1-q*q*q),x=f.x-h*.3,y=f.y-h-14;g.globalAlpha=1;g.drawImage(iconCache.comet,snap(x)-14,snap(y)-14,28,28);
    if(!reduced)for(let i=1;i<7;i++)chip(g,x-i*6,y-i*15,Math.max(2,8-i),10-i,f.colour,(1-i/7)*.65);
   }else{const q=clamp01((f.age-f.delay)/(f.life-f.delay));burst(g,f,q,reduced);arc(g,f.x,f.y,f.radius*(.55+.45*q),ivory,(1-q)*.5);for(let i=0;i<(reduced?4:9);i++){const a=i*2.399,x=f.x+Math.cos(a)*q*f.radius*.6,y=f.y+Math.sin(a)*q*f.radius*.6;chip(g,x,y-Math.sin(q*Math.PI)*25,4,5,shadow,(1-q)*.8);chip(g,x,y-Math.sin(q*Math.PI)*25,2,2,f.colour,(1-q)*.9);}}
   return true;
  }
  if(f.kind==='garden'){
   if(f.fired){burst(g,f,clamp01((f.age-f.activeLife)/.45),reduced);return true;}
   const growth=clamp01(f.age/.38),pulse=clamp01(1-Math.max(0,f.age-(f.tick-.8))/.28),n=reduced?12:24;
   for(let i=0;i<n;i++){const a=i*2.399,rr=f.radius*(i<8?.92:.2+.65*Math.sqrt((i-7)/(n-7))),x=f.x+Math.cos(a)*rr,y=f.y+Math.sin(a)*rr,h=(10+i%5*3)*growth;
    if(i<8){g.globalAlpha=.35*growth;g.strokeStyle='#566249';g.beginPath();g.moveTo(snap(f.x),snap(f.y));g.lineTo(snap((f.x+x)/2-7),snap((f.y+y)/2+5));g.lineTo(snap(x),snap(y));g.stroke();}
    chip(g,x-4,y+2,10,3,shadow,.4);chip(g,x-2,y-h,4,h,shadow,.8);chip(g,x,y-h,2,h,'#6e8057',.95);chip(g,x-4,y-h*.62,6,3,'#9eb77a',.95);chip(g,x+2,y-h*.84,4,2,ivory,.6+pulse*.35);
    if(!reduced&&pulse>0)chip(g,x,y-h-6-pulse*8,2,3,'#c4d28d',pulse*.7);
   }
   for(let i=0;i<8;i++){const a=i*Math.PI/4;arc(g,f.x,f.y,f.radius,'#87966a',.35,a-.07,a+.07);}
   g.globalAlpha=1;g.drawImage(iconCache.garden,snap(f.x)-12,snap(f.y)-28,24,24);chip(g,f.x-2,f.y-16,4,5,ivory,.5+pulse*.5);return true;
  }
  if(f.kind==='tide'){
   const q=f.fired?clamp01((f.age-f.delay)/(f.life-f.delay)):clamp01(f.age/f.delay),rr=f.radius*(f.fired?.3+.7*q:1-.7*q),n=reduced?12:28;
   for(let i=0;i<n;i++){const a=i*TAU/n+q*.3,x=f.x+Math.cos(a)*rr,y=f.y+Math.sin(a)*rr;chip(g,x-5,y,10,2,f.colour,(f.fired?1-q:.7)*.85);chip(g,x-2,y-3,5,2,ivory,(f.fired?1-q:.7)*.65);if(!reduced)chip(g,x+Math.cos(a)*10,y+Math.sin(a)*10,6,2,'#668f91',.35*fade);}
   return true;
  }
  if(f.kind==='clock'){
   if(f.fired){burst(g,f,clamp01((f.age-f.activeLife)/.45),reduced);return true;}
   const q=clamp01(f.age/f.activeLife),stored=clamp01(f.stored/f.capacity);
   for(let i=0;i<12;i++){const a=i*TAU/12,x=f.x+Math.cos(a)*f.radius,y=f.y+Math.sin(a)*f.radius,lit=i/12<q;chip(g,x-2,y-2,4,i%3?4:8,lit?ivory:'#759a8f',lit?.7:.45);}
   arc(g,f.x,f.y,f.radius,f.colour,.25,-Math.PI/2,-Math.PI/2+q*TAU);
   g.globalAlpha=.85;g.drawImage(iconCache.clock,snap(f.x)-12,snap(f.y)-26,24,24);
   for(let i=0;i<6;i++){const a=i*TAU/6-Math.PI/2;chip(g,f.x+Math.cos(a)*23-2,f.y-14+Math.sin(a)*23-2,4,4,i/6<stored?ivory:'#61786f',i/6<stored?.9:.4);}
   if(!reduced)for(let i=0;i<10;i++){const a=i*2.399,r=f.radius*(.3+((i*17)%60)/100);chip(g,f.x+Math.cos(a)*r,f.y+Math.sin(a)*r-((f.age*5+i*9)%16),2,3,f.colour,.3);}
   return true;
  }
  return false;
 }
 function render(g,s,reduced){const b=s.build;if(!b)return;g.save();g.imageSmoothingEnabled=false;
  for(const f of b.fields){g.save();if(special(g,f,reduced)){g.restore();continue;}const fade=clamp01((f.life-f.age)/.3);
   if(f.kind==='spill'){g.fillStyle='#a67c45';g.globalAlpha=fade*.2;g.beginPath();g.ellipse(f.x,f.y,f.radius,f.radius,0,0,TAU);g.fill();for(let i=0;i<5;i++)chip(g,f.x-25+i*11,f.y-7-(reduced?0:(f.age*14+i*7)%15),2,4,'#c6ad79',fade*.6);}
   else if(f.kind==='pin'){g.translate(f.x,f.y-8);g.rotate(-.5);chip(g,-2,-27,4,27,'#edcd87',fade);chip(g,-7,-27,14,3,'#594935',fade);chip(g,-2,-34,4,7,'#594935',fade);}
   else if(f.kind==='decoy'){g.globalAlpha=fade*.6;g.strokeStyle=f.colour;g.setLineDash([4,5]);g.beginPath();g.ellipse(f.x,f.y,18,7,0,0,TAU);g.stroke();}
   g.restore();
  }
  for(const e of s.enemies)if(e.hp>0&&e.buildMarkUntil>s.time){const x=Math.round(e.x),y=Math.round(e.y)-63;chip(g,x-1,y-5,3,11,'#cce5ba',.85);chip(g,x-4,y-1,9,3,'#cce5ba',.85);}
  if(b.ward>0){g.strokeStyle='#dfc183';g.globalAlpha=.7;g.beginPath();g.ellipse(s.player.x,s.player.y-20,23,32,0,0,TAU);g.stroke();}g.restore();
 }

 const iconCache=Object.fromEntries(['steam','garden','bell','comet','tide','clock'].map(id=>[id,icon(id)]));
 function prop(g,cast,x,y){g.save();const q=Math.min(1,cast.age/cast.duration);g.translate(Math.round(x),Math.round(y));g.rotate(Math.sin(q*Math.PI)*.2);g.drawImage(iconCache[cast.id],-8,-14,16,16);g.globalAlpha=Math.sin(q*Math.PI)*.6;g.fillStyle=root.ROUGE_MORA_BUILDS.ABILITIES[cast.id].colour;for(let i=0;i<4;i++){const a=i*TAU/4+q*3;g.fillRect(Math.round(Math.cos(a)*14),Math.round(Math.sin(a)*12)-10,2,2);}g.restore();}
 // A one-second shimmer follows the character; cooldown information lives in the HUD.
 function ready(g,s,reduced,camera){
  const b=s.build;if(!b?.ability||b.readyAt==null||b.cooldown>0||s.status!=='playing'||s.transition)return;
  const t=s.time-b.readyAt;if(t<0||t>=1)return;
  const z=camera.zoom||1,p=s.player,lift=p.finaleLeap?Math.sin(Math.min(1,p.finaleLeap.age/p.finaleLeap.duration)*Math.PI)*78:0;
  const x=(p.x-camera.x)*z+(camera.shakeX||0),y=(p.y-30-lift-camera.y)*z+(camera.shakeY||0),alpha=Math.min(1,t/.12)*Math.min(1,(1-t)/.35),colour=root.ROUGE_MORA_BUILDS.ABILITIES[b.ability].colour;
  g.save();g.translate(x,y);g.globalAlpha=alpha;g.imageSmoothingEnabled=false;
  for(let i=0;i<(reduced?4:9);i++){const a=i*2.399+(reduced?0:t*.65),r=(12+i%3*4)*z,px=Math.round(Math.cos(a)*r),py=Math.round(Math.sin(a)*r*.8+(reduced?0:10-t*27)*z),size=Math.max(1,Math.round((i%3?2:3)*z));
   g.fillStyle=i%3?colour:'#fff0ca';g.fillRect(px,py,size,size);if(i%3===0){g.globalAlpha=alpha*.5;g.fillRect(px-size,py+Math.floor(size/2),size*3,1);g.globalAlpha=alpha;}
  }
  g.restore();
 }

 root.ROUGE_MORA_BUILD_ART={icon,render,prop,ready};
})(globalThis);
