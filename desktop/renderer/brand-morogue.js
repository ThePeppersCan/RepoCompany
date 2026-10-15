(() => {
 'use strict';
 const NS='http://www.w3.org/2000/svg',clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
 const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
 const shape=p=>'M'+p.map(([x,y])=>x.toFixed(2)+' '+y.toFixed(2)).join('L')+'Z';
 // The Uncrowned: seven swept spires, a fractured brow and a long, hollow jaw.
 // A single perimeter lets the actual RC silhouette become the crown/skull.
 const skull=[[390,108],[384,184],[362,241],[341,273],[330,318],[316,367],[300,406],[285,453],[261,484],[246,497],[224,475],[207,438],[190,395],[176,349],[169,304],[153,274],[129,243],[113,200],[108,144],[119,98],[123,165],[139,203],[157,228],[168,228],[157,185],[155,133],[166,77],[185,37],[173,128],[179,179],[195,215],[209,228],[218,213],[215,171],[222,111],[239,55],[261,8],[247,101],[246,157],[252,200],[262,219],[278,203],[293,162],[304,105],[307,40],[319,91],[317,148],[305,210],[301,231],[316,218],[337,179],[350,124],[357,75],[361,131],[350,193],[336,237],[350,231],[368,201],[384,155]];
 const cuts=[
  [[175,292],[197,299],[221,316],[234,318],[225,339],[208,342],[188,327]],
  [[274,317],[297,297],[322,285],[310,323],[291,339],[274,338],[265,327]],
  [[250,333],[260,355],[267,377],[252,369],[239,378],[242,353]],
  [[203,363],[214,374],[226,420],[228,447],[218,431]],
  [[230,386],[239,391],[247,446],[244,472],[235,454]],
  [[258,389],[268,384],[266,441],[255,470],[253,442]],
  [[281,375],[297,355],[284,406],[273,432],[274,406]],
  [[179,241],[198,260],[216,271],[231,290],[212,275],[194,262]],
  [[280,282],[294,257],[316,244],[298,260]],
  [[243,228],[251,243],[252,290],[245,275]]
 ];
 function resample(points,n){
  const lengths=points.map((p,i)=>Math.hypot(p[0]-points[(i+1)%points.length][0],p[1]-points[(i+1)%points.length][1]));
  const perimeter=lengths.reduce((a,b)=>a+b,0);let edge=0,start=0;
  return Array.from({length:n},(_,i)=>{const d=perimeter*i/n;while(edge<points.length-1&&start+lengths[edge]<d)start+=lengths[edge++];const a=points[edge],b=points[(edge+1)%points.length],t=(d-start)/lengths[edge];return[mix(a[0],b[0],t),mix(a[1],b[1],t)];});
 }
 function align(source,target){
  let best=Infinity,result;
  for(const points of [target,[...target].reverse()])for(let offset=0;offset<points.length;offset++){
   let cost=0;for(let i=0;i<source.length;i+=4){const a=source[i],b=points[(i+offset)%points.length];cost+=(a[0]-b[0])**2+(a[1]-b[1])**2;}
   if(cost<best){best=cost;result=source.map((_,i)=>points[(i+offset)%points.length]);}
  }return result;
 }
 window.createMorogueBrandMotion=function(svg,outline){
  function el(name,attributes,parent){const e=document.createElementNS(NS,name);for(const[k,v]of Object.entries(attributes))e.setAttribute(k,v);parent.append(e);return e;}
  const defs=svg.querySelector('defs'),id='uncrowned-mask-'+Math.random().toString(36).slice(2);
  const mask=el('mask',{id,maskUnits:'userSpaceOnUse',x:-100,y:-100,width:712,height:712},defs);
  el('rect',{x:-100,y:-100,width:712,height:712,fill:'white'},mask);
  const holes=cuts.map(p=>({points:p,center:p.reduce((s,v)=>[s[0]+v[0]/p.length,s[1]+v[1]/p.length],[0,0]),node:el('path',{fill:'black'},mask)}));
  const group=el('g',{'class':'motion-uncrowned',opacity:0},svg),body=el('g',{mask:`url(#${id})`},group),perimeter=el('path',{},body);
  const core=svg.querySelector('.motion-core').cloneNode(true);core.setAttribute('class','uncrowned-core');body.append(core);
  const source=resample([...outline.outer,...[...outline.inner].reverse()],360),target=align(source,resample(skull,360));
  const rest=svg.querySelector('.motion-rest');
  function hide(){group.setAttribute('opacity','0');}
  function draw(ms){
   const t=(ms%5600)/5600;
   const into=ease((t-.16)/.25),back=ease((t-.66)/.23),amount=into*(1-back);
   // Freeze the source image during the rest; use its matching outline in motion.
   const active=t>.155&&t<.895;
   group.setAttribute('opacity',active?'1':'0');rest.setAttribute('opacity',active?'0':'1');
   const anticipate=-.045*Math.sin(Math.PI*clamp((t-.07)/.12));
   const settle=t>.86?Math.sin((t-.86)*66)*Math.exp(-(t-.86)*31)*.028:0;
   const coil=Math.sin(Math.PI*amount)**2;
   const scale=(1+anticipate+settle)*(1-.68*coil);
   const tilt=-24*Math.sin(Math.PI*amount)+Math.sin(Math.PI*clamp((t-.47)/.17))*1.4*amount;
   const lift=-8*Math.sin(Math.PI*clamp((t-.16)/.30))+3*Math.sin(Math.PI*clamp((t-.48)/.17))*amount;
   const transform=`translate(256 ${256+lift}) rotate(${tilt}) scale(${scale}) translate(-256 -256)`;
   group.setAttribute('transform',transform);rest.setAttribute('transform',transform);
   perimeter.setAttribute('d',shape(source.map((p,i)=>{
    const q=target[i],crown=q[1]<240?clamp((240-q[1])/220):0;
    const lag=.035*crown*Math.sin(Math.PI*amount),a=clamp(amount-lag);
    return[mix(p[0],q[0],a),mix(p[1],q[1],a)-Math.sin(Math.PI*a)*crown*16];
   })));
   core.setAttribute('opacity',(1-ease(amount/.72)).toFixed(3));
   core.setAttribute('transform',`translate(256 275) scale(${1-amount*.65} ${1+amount*.18}) translate(-256 -275)`);
   for(let i=0;i<holes.length;i++){
    const h=holes[i],reveal=ease((amount-(i<3?.40:.56))/(i<3?.50:.42));
    // Open the sockets and tooth slots out of the forming face, not a crossfade.
    h.node.setAttribute('d',shape(h.points.map(p=>[mix(h.center[0],p[0],reveal),mix(h.center[1],p[1],reveal)])));
   }
  }
  return Object.freeze({draw,hide,duration:5600});
 };
})();
