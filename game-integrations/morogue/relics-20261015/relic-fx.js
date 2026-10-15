/* Relic warnings use the same immutable centres and radii as collision. */
(function(root){'use strict';const TAU=Math.PI*2,clamp=v=>Math.max(0,Math.min(1,v)),meteorImage=typeof Image==='undefined'?null:new Image();if(meteorImage)meteorImage.src='assets/morogue/merchant/meteor-v2.png';
 function circle(g,x,y,r){g.beginPath();g.arc(x,y,r,0,TAU);}
 function stone(g,x,y,size,time,reduced){
  g.save();g.translate(x,y);g.rotate(-.2);if(meteorImage?.complete&&meteorImage.naturalWidth){g.drawImage(meteorImage,-size*1.5,-size*1.5,size*3,size*3);if(!reduced){g.fillStyle='#c48560';for(let i=0;i<8;i++){const t=(time*1.8+i*.17)%1;g.globalAlpha=(1-t)*.6;g.fillRect(Math.sin(i*3.1)*size*(.4+t),-size*(1+t*3),3,6);}}g.restore();return;}g.fillStyle='#20191c';g.strokeStyle='#d77b5e';g.lineWidth=2;g.beginPath();
  for(let i=0;i<13;i++){const a=i/13*TAU,r=size*(.84+(i%3)*.08);const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i)g.lineTo(px,py);else g.moveTo(px,py);}g.closePath();g.fill();g.stroke();
  g.strokeStyle='#ae4e45';g.lineWidth=2;for(let i=0;i<5;i++){const a=i*1.25;g.beginPath();g.moveTo(Math.cos(a)*size*.4,Math.sin(a)*size*.4);g.lineTo(Math.cos(a+.2)*size*.7,Math.sin(a+.2)*size*.7);g.lineTo(Math.cos(a)*size*.94,Math.sin(a)*size*.94);g.stroke();}
  g.fillStyle='#e4d8b5';for(const side of[-1,1]){g.beginPath();g.ellipse(side*size*.3,-size*.16,size*.16,size*.21,side*.2,0,TAU);g.fill();}g.fillStyle='#08090b';g.beginPath();g.ellipse(0,size*.42,size*.23,size*.32,0,0,TAU);g.fill();g.fillStyle='#c9b994';for(let i=-1;i<=1;i++)g.fillRect(i*size*.13-1,size*.17,2,5);
  if(!reduced){g.fillStyle='#c48560';for(let i=0;i<6;i++){const t=(time*1.8+i*.17)%1;g.globalAlpha=(1-t)*.5;g.fillRect(Math.sin(i*3.1)*size*(.4+t),-size*(1+t*2),3,6);}}
  g.restore();
 }
 function draw(g,s,reduced){const r=s.relicState,p=s.player;g.save();
  for(const b of r.blasts||[]){const danger=b.selfDamage>0,meteor=b.kind==='meteor',t=clamp(b.age/b.delay),active=b.fired,colour=danger?'#ef9a7d':'#d7d1be';g.save();
   // Full footprint stays fixed. Only the inner countdown changes size.
   circle(g,b.x,b.y,b.radius);g.fillStyle=danger?'rgba(114,29,31,.24)':'rgba(195,185,155,.12)';g.fill();g.strokeStyle=colour;g.lineWidth=2;g.stroke();
   if(!active){g.strokeStyle=danger?'#edc09a':'#c8d3c9';g.lineWidth=3;g.beginPath();g.arc(b.x,b.y,b.radius-5,-Math.PI/2,-Math.PI/2+TAU*t);g.stroke();
    if(danger){g.fillStyle='#221319';g.fillRect(b.x-38,b.y+b.radius+5,76,16);g.fillStyle='#f6dcc4';g.font='11px "Velmora Pixel",monospace';g.textAlign='center';g.fillText('DANGER',b.x,b.y+b.radius+17);for(let i=0;i<8;i++){const a=i*TAU/8;g.beginPath();g.moveTo(b.x+Math.cos(a)*(b.radius-12),b.y+Math.sin(a)*(b.radius-12));g.lineTo(b.x+Math.cos(a-.06)*(b.radius-20),b.y+Math.sin(a-.06)*(b.radius-20));g.lineTo(b.x+Math.cos(a+.06)*(b.radius-20),b.y+Math.sin(a+.06)*(b.radius-20));g.fill();}}
    if(meteor){const fall=clamp((t-.55)/.45),height=reduced?38:(1-fall)*210+18;g.globalAlpha=.25;g.fillStyle='#120c16';g.beginPath();g.ellipse(b.x,b.y,16+18*fall,6+5*fall,0,0,TAU);g.fill();g.globalAlpha=1;stone(g,b.x-(reduced?0:55*(1-fall)),b.y-height,23,s.time,reduced);}
    else if(b.kind==='emberplum'){g.fillStyle='#e3a275';circle(g,b.x,b.y-5,5);g.fill();}
   }else{const age=clamp((b.age-b.delay)/.45);g.globalAlpha=1-age;g.strokeStyle=colour;g.lineWidth=5*(1-age)+1;circle(g,b.x,b.y,b.radius*age);g.stroke();if(meteor)stone(g,b.x,b.y-18,23*(1-age*.3),s.time,true);if(!reduced){g.fillStyle=colour;for(let i=0;i<12;i++){const a=i/12*TAU,x=b.x+Math.cos(a)*b.radius*age,y=b.y+Math.sin(a)*b.radius*age-18*Math.sin(age*Math.PI);g.fillRect(x,y,3,3);}}}
   g.restore();
  }
  if(r.thimbleReady||r.teaUntil>s.time){g.strokeStyle=r.thimbleReady?'#d9a96b':'#c8dbdd';g.lineWidth=2;circle(g,p.x,p.y-18,21);g.stroke();}
  if(r.sardineUntil>s.time){g.fillStyle='#e8c580';for(let i=0;i<3;i++)g.fillRect(p.x-6+i*6,p.y-54,3,3);}
  cafe(g,s,reduced);g.restore();
 }
 function waffle(g,e,s,reduced){
  const bob=reduced?0:Math.sin((e.gait||0)*8)*2;g.save();if(e.dying)g.globalAlpha*=Math.max(0,1-e.dying);g.translate(Math.round(e.x),Math.round(e.y));g.fillStyle='#17181bb0';g.fillRect(-12,-3,24,5);g.translate(0,-bob);g.fillStyle='#34251e';g.fillRect(-13,-30,26,25);g.fillStyle=e.hit>0?'#eed6a4':'#ba864a';g.fillRect(-11,-28,22,21);g.fillStyle='#65432b';for(let x=-8;x<9;x+=6)for(let y=-25;y<-9;y+=6)g.fillRect(x,y,4,4);g.fillStyle='#f4e4bc';g.fillRect(-7,-22,5,5);g.fillRect(3,-22,5,5);g.fillStyle='#1e1a19';g.fillRect(-5,-21,2,3);g.fillRect(5,-21,2,3);g.fillRect(-3,-12,6,3);g.strokeStyle='#a77a4c';g.lineWidth=3;g.beginPath();g.moveTo(-11,-17);g.lineTo(-18,-22);g.moveTo(11,-17);g.lineTo(18,-22);g.moveTo(-6,-6);g.lineTo(-8,0);g.moveTo(6,-6);g.lineTo(8,0);g.stroke();g.restore();
 }
 function cafe(g,s,reduced){
  const c=s.relicState.cafe;if(!c)return;const p=s.player;
  if(c.link){g.save();g.strokeStyle='#b99d73';g.lineWidth=2;g.setLineDash([5,4]);g.beginPath();g.moveTo(c.link.a.x,c.link.a.y-20);g.lineTo(c.link.b.x,c.link.b.y-20);g.stroke();g.restore();}
  for(const q of c.portals){g.save();g.translate(q.x,q.y);g.fillStyle='#ba955244';g.strokeStyle='#d6bb81';g.lineWidth=2;g.beginPath();g.ellipse(0,0,21,10,0,0,TAU);g.fill();g.stroke();g.fillStyle='#746344';for(let i=0;i<7;i++){const a=i*2.4;g.fillRect(Math.cos(a)*12-1,Math.sin(a)*5-1,3,2);}if(c.portals.length===2){g.strokeStyle='#dae5cf';g.beginPath();g.ellipse(0,-2,25,12,0,0,TAU);g.stroke();}g.restore();}
  if(s.relics.scamp){const x=p.x-29,y=p.y-11-(reduced?0:Math.sin(c.clock*7)*2);g.save();g.translate(x,y);g.fillStyle='#30231c';g.fillRect(-6,-15,12,12);g.fillRect(-5,-4,10,12);g.fillRect(-12,-3,24,5);g.fillRect(-7,6,5,6);g.fillRect(2,6,5,6);g.fillStyle='#b78e57';g.fillRect(-4,-13,8,8);g.fillRect(-3,-3,6,11);g.fillStyle='#f2dfb0';g.fillRect(-3,-10,2,2);g.fillRect(2,-10,2,2);g.fillRect(-1,0,2,2);g.restore();}
  for(const e of s.enemies){if(e.hp<=0)continue;if(e.toffeeUntil>c.clock){g.fillStyle='#573c27';g.fillRect(e.x-10,e.y-44,20,13);g.fillStyle='#d5a563';g.fillRect(e.x-8,e.y-42,16,9);g.fillStyle='#ecd5a0';g.fillRect(e.x-5,e.y-41,5,3);}}
  if(c.confused){const e=c.confused.enemy;g.save();g.translate(e.x,e.y-65);g.fillStyle='#d7d8be';g.fillRect(-10,1,16,8);g.fillRect(3,-8,5,13);g.fillRect(4,-10,7,5);g.fillStyle='#b89858';g.fillRect(10,-8,5,3);g.fillStyle='#232725';g.fillRect(8,-9,2,2);g.restore();}
  if(c.trial){g.strokeStyle='#d1e7dc';g.lineWidth=2;circle(g,p.x,p.y-22,29);g.stroke();}
  if(c.autoAt!=null){g.strokeStyle='#e6bd7a';g.lineWidth=3;g.beginPath();g.arc(p.x,p.y-53,8,-Math.PI/2,-Math.PI/2+TAU*clamp(1-(c.autoAt-c.clock)/.5));g.stroke();}
  for(const v of c.visuals){g.save();g.globalAlpha=clamp((v.until-c.clock)/.6);g.strokeStyle=v.kind==='soda'?'#d4e4d8':'#ceb986';g.lineWidth=2;if(v.to){g.beginPath();g.moveTo(v.x,v.y-18);g.lineTo(v.to.x,v.to.y-18);g.stroke();}else{circle(g,v.x,v.y-22,18);g.stroke();}g.restore();}
 }
 root.MOROGUE_RELIC_FX={draw,waffle};
})(globalThis);
