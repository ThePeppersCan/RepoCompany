(() => {
 'use strict';
 const catalog=Object.freeze([
  {id:'ember-crown',name:'Ember Crown',price:1800,color:'#ff9b51',tone:'200,77,27',description:'Forged in obsidian. Molten seams breathe as sparks rise from the crown.'},
  {id:'moonlit-grove',name:'Moonlit Grove',price:1500,color:'#cce7b0',tone:'102,148,104',description:'Silver leaves, pearl dew and fireflies wandering through a moonlit garden.'},
  {id:'arcane-orbit',name:'Arcane Orbit',price:2000,color:'#c7a0ff',tone:'126,78,199',description:'An amethyst astrolabe, alive with orbiting stars and a slow celestial current.'},
  {id:'deepwater',name:'Deepwater',price:1500,color:'#8cecff',tone:'41,137,159',description:'Sea glass catches the light. Tiny bubbles rise through luminous tidal currents.'},
  {id:'stormglass',name:'Stormglass',price:2200,color:'#72d7ff',tone:'50,108,196',description:'Electric blue crystal charged with branching lightning along its dark metal edges.'},
  {id:'royal-gilt',name:'Royal Gilt',price:1800,color:'#ffe0a0',tone:'161,116,42',description:'Warm gold, ruby and laurel. A travelling gleam reveals every crafted edge.'},
  {id:'blossom-drift',name:'Blossom Drift',price:1000,color:'#ffb7cc',tone:'177,89,120',description:'Rosewood and spring blossoms, with delicate petals carried on a gentle breeze.'},
  {id:'astral-eclipse',name:'Astral Eclipse',price:2500,color:'#e6b2ff',tone:'146,72,170',description:'A dark sun with a living corona. Violet stardust traces the edge of the eclipse.'}
 ].map(Object.freeze));
 const get=id=>catalog.find(f=>f.id===id),esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function markup(id){const f=get(id);return f?`<span class="repo-avatar-frame" data-avatar-frame="${f.id}" aria-hidden="true"><img src="account-assets/frames/${f.id}.webp" alt="" width="512" height="512" loading="lazy" decoding="async"><canvas width="320" height="320"></canvas></span>`:'';}
 function portrait(id,avatar,label='Your avatar'){return `<span class="frame-portrait">${window.repoAvatar?.markup(avatar,label)||`<span class="frame-monogram">${esc(label.slice(0,1).toUpperCase()||'R')}</span>`}${markup(id)}</span>`;}
 const nodes=new Map(),motion=matchMedia('(prefers-reduced-motion: reduce)');let clock=0,last=0;
 const observer=new IntersectionObserver(entries=>{for(const e of entries){const item=nodes.get(e.target);if(item)item.visible=e.isIntersecting;}schedule();},{threshold:0.02});
 function hydrate(root=document){
  for(const [node] of nodes)if(!node.isConnected){observer.unobserve(node);nodes.delete(node);}
  root.querySelectorAll('[data-avatar-frame]').forEach(node=>{
   if(nodes.has(node))return;const f=get(node.dataset.avatarFrame);if(!f)return;
   node.parentElement.classList.add('has-avatar-frame');
   const canvas=node.querySelector('canvas'),image=node.querySelector('img'),ctx=canvas.getContext('2d'),surface=document.createElement('canvas');surface.width=surface.height=320;
   nodes.set(node,{f,canvas,ctx,image,surface,sc:surface.getContext('2d'),visible:false});observer.observe(node);
  });schedule();
 }
 const point=(a,r=134)=>[160+Math.cos(a)*r,160+Math.sin(a)*r];
 function sparkle(c,x,y,r,color,alpha=1){c.globalAlpha=alpha;c.fillStyle=color;c.beginPath();c.moveTo(x,y-r);c.quadraticCurveTo(x+1,y-1,x+r,y);c.quadraticCurveTo(x+1,y+1,x,y+r);c.quadraticCurveTo(x-1,y+1,x-r,y);c.quadraticCurveTo(x-1,y-1,x,y-r);c.fill();}
 function render(item,t){
  const {ctx:c,sc:s,canvas,f,image}=item;c.clearRect(0,0,320,320);if(!image.complete||!image.naturalWidth)return;
  const index=catalog.indexOf(f),phase=t+index*.71,color=f.color;
  // Lighting is masked by the original alpha: it follows the metal, leaves and
  // crystal, while the portrait and transparent silhouette remain untouched.
  s.clearRect(0,0,320,320);s.globalCompositeOperation='source-over';
  const [lx,ly]=point(phase*.57-1.8,132),g=s.createRadialGradient(lx,ly,0,lx,ly,95);
  g.addColorStop(0,color);g.addColorStop(.22,color+'bb');g.addColorStop(1,color+'00');s.fillStyle=g;s.fillRect(0,0,320,320);
  s.globalCompositeOperation='destination-in';s.drawImage(image,0,0,320,320);s.globalCompositeOperation='source-over';
  c.globalCompositeOperation='screen';c.globalAlpha=f.id==='royal-gilt'?.65:.38;c.drawImage(item.surface,0,0);c.globalAlpha=1;
  c.save();c.beginPath();c.rect(0,0,320,320);c.arc(160,160,105,0,Math.PI*2,true);c.clip('evenodd');
  if(f.id==='ember-crown'){
   for(let i=0;i<18;i++){const life=(phase*.22+i*.193)%1,a=i*2.399,x=160+Math.cos(a)*(128+life*22)+Math.sin(phase*2+i)*4,y=160+Math.sin(a)*125-life*35;
    c.globalAlpha=Math.sin(life*Math.PI)*.9;c.fillStyle=i%3?'#ffc174':'#ff7139';c.shadowColor='#ff6c24';c.shadowBlur=7;c.fillRect(x,y,1.4,2.6+life*2);}
   c.shadowBlur=0;
   for(let i=0;i<5;i++){const a=phase*.3+i*1.25,[x,y]=point(a,131);c.globalAlpha=.35+.2*Math.sin(phase*3+i);c.strokeStyle='#ffad55';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+9*Math.sin(phase*2+i),y-10,x+4,y-21);c.stroke();}
  }else if(f.id==='moonlit-grove'){
   for(let i=0;i<10;i++){const a=i*2.399+phase*(i%2?.12:-.09),[x,y]=point(a,139+Math.sin(phase*.8+i)*9),alpha=.2+.7*(.5+.5*Math.sin(phase*1.6+i*2));c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,0,x,y,5);g.addColorStop(0,'#f3ffbd');g.addColorStop(.25,'#dcffafbb');g.addColorStop(1,'#dcffaf00');c.fillStyle=g;c.fillRect(x-5,y-5,10,10);}
  }else if(f.id==='arcane-orbit'){
   c.lineWidth=.7;c.strokeStyle='#b795ff';c.globalAlpha=.28;c.setLineDash([2,8,9,5]);c.lineDashOffset=-phase*9;c.beginPath();c.arc(160,160,120,0,Math.PI*2);c.stroke();c.setLineDash([]);
   for(let i=0;i<3;i++)for(let j=0;j<17;j++){const [x,y]=point(phase*.48+i*2.095-j*.018,123);c.globalAlpha=(1-j/17)*.7;c.fillStyle=j===0?'#fff0ff':'#b884ff';c.beginPath();c.arc(x,y,j===0?2.3:1.2,0,7);c.fill();}
   for(let i=0;i<4;i++){const [x,y]=point(i*Math.PI/2,139);sparkle(c,x,y,4+Math.sin(phase*2+i)*2,'#f2dfff',.5);}
  }else if(f.id==='deepwater'){
   for(let i=0;i<12;i++){const life=(phase*.13+i*.127)%1,side=i%2?1:-1,x=160+side*(116+Math.sin(i+phase*.4)*18),y=285-life*255;c.globalAlpha=Math.sin(life*Math.PI)*.65;c.lineWidth=.8;c.strokeStyle='#b0f8ff';c.beginPath();c.arc(x,y,1.5+i%3,0,7);c.stroke();}
   for(let i=0;i<3;i++){c.globalAlpha=.24;c.strokeStyle='#b7ffff';c.lineWidth=1.1;c.beginPath();for(let j=0;j<=55;j++){const a=phase*.32+i*2.1+j*.012,r=133+Math.sin(a*11+phase*2)*3,[x,y]=point(a,r);j?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
  }else if(f.id==='stormglass'){
   for(let i=0;i<3;i++){const pulse=Math.pow(Math.max(0,Math.sin(phase*2.7+i*2.1)),5),start=i*2.1+Math.floor(phase*.43)*.5;
    c.globalAlpha=pulse*.85;c.strokeStyle='#9feeff';c.shadowColor='#26a6ff';c.shadowBlur=8;c.lineWidth=1.25;c.beginPath();
    for(let j=0;j<18;j++){const a=start+j*.045,r=134+Math.sin(j*19.2+Math.floor(phase*7))*5,[x,y]=point(a,r);j?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
    const [x,y]=point(start+.3,135),[xx,yy]=point(start+.35,148);c.beginPath();c.moveTo(x,y);c.lineTo(xx-3,yy+3);c.lineTo(xx,yy);c.stroke();}c.shadowBlur=0;
  }else if(f.id==='royal-gilt'){
   for(let i=0;i<7;i++){const a=i*2.399,alpha=Math.pow(Math.max(0,Math.sin(phase*1.15-i)),8),[x,y]=point(a,130+i%3*3);sparkle(c,x,y,3+alpha*4,'#fff0c1',alpha);}
  }else if(f.id==='blossom-drift'){
   c.globalCompositeOperation='source-over';for(let i=0;i<10;i++){const life=(phase*.105+i*.153)%1,side=i%2?1:-1,x=160+side*(130+Math.sin(life*5+i)*12),y=10+life*295;
    c.save();c.globalAlpha=Math.sin(life*Math.PI)*.9;c.translate(x,y);c.rotate(phase*.7+i);c.scale(Math.cos(phase*1.3+i)*.6+.8,1);c.fillStyle=i%2?'#ffc5d6':'#e98ba8';c.beginPath();c.moveTo(0,-3.8);c.bezierCurveTo(6,-3,5,3,0,5);c.bezierCurveTo(-3,1,-4,-2,0,-3.8);c.fill();c.restore();}
  }else{
   for(let i=0;i<4;i++){const a=phase*.27+i*Math.PI/2;c.globalAlpha=.3;c.strokeStyle=i%2?'#e2a0ff':'#ffc679';c.lineWidth=1.8;c.beginPath();for(let j=0;j<42;j++){const b=a+j*.017,r=133+Math.sin(b*12-phase*2)*3,[x,y]=point(b,r);j?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}
   for(let i=0;i<9;i++){const [x,y]=point(i*2.399-phase*.12,140+Math.sin(i+phase)*5);sparkle(c,x,y,2.5,color,.3+.4*Math.sin(phase+i)**2);}
  }
  c.restore();c.globalAlpha=1;c.globalCompositeOperation='source-over';
 }
 function active(item){return item.visible&&item.canvas.isConnected&&!item.canvas.closest('dialog:not([open])')&&document.documentElement.dataset.repoPortalVisible!=='false';}
 function tick(now){clock=0;if(document.hidden||motion.matches)return;if(now-last>32){last=now;for(const [node,item]of nodes){if(!node.isConnected){observer.unobserve(node);nodes.delete(node);}else if(active(item))render(item,now/1000);}}if([...nodes.values()].some(active))clock=requestAnimationFrame(tick);}
 function schedule(){if(clock)cancelAnimationFrame(clock);clock=0;if(motion.matches){for(const item of nodes.values())item.ctx.clearRect(0,0,320,320);return;}if(!document.hidden&&[...nodes.values()].some(active))clock=requestAnimationFrame(tick);}
 motion.addEventListener('change',schedule);document.addEventListener('visibilitychange',schedule);
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-repo-portal-visible']});
 window.repoFrames=Object.freeze({catalog,get,markup,portrait,hydrate});
})();
