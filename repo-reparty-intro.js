// The same Repo Company silhouette unfolds into the Reparty TV, then returns.
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg',duration=2400;
  const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
  const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
  const shape=p=>'M'+p.map(v=>v.map(n=>n.toFixed(2)).join(' ')).join('L')+'Z';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let active=null;
  function createMotion(svg,outline) {
    function el(tag,attrs,parent=svg){const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n;}
    function sample(d,scale=1){const path=el('path',{d,visibility:'hidden'}),length=path.getTotalLength();const points=Array.from({length:200},(_,i)=>{const p=path.getPointAtLength(length*i/200);return[p.x*scale,p.y*scale];});path.remove();return points;}
    function align(a,b){let best=Infinity,result=b;for(const points of[b,[...b].reverse()])for(let offset=0;offset<b.length;offset++){let cost=0;for(let i=0;i<a.length;i+=4){const q=points[(i+offset)%b.length];cost+=(a[i][0]-q[0])**2+(a[i][1]-q[1])**2;}if(cost<best){best=cost;result=a.map((_,i)=>points[(i+offset)%b.length]);}}return result;}
    const rest=svg.querySelector('.motion-rest'),actor=el('g',{'class':'reparty-morph',fill:'#f3eed8'});
    // One continuous ribbon preserves the empty centre of the C and TV frame.
    const source=sample(shape([...outline.outer,...outline.inner.slice().reverse()]));
    const ring='M55.5 46.5V30.5Q55.5 22.5 47.5 22.5H15.5Q7.5 22.5 7.5 30.5V46.5Q7.5 54.5 15.5 54.5H47.5Q55.5 54.5 55.5 46.5L53 46.5Q53 52 47.5 52H15.5Q10 52 10 46.5V30.5Q10 25 15.5 25H47.5Q53 25 53 30.5V46.5Z';
    const core=sample(svg.querySelector('clipPath path').getAttribute('d'));
    const triangle='M24 33.3q0-1.2 1.1-.5l8 5q1.1.7 0 1.4l-8 5q-1.1.7-1.1-.5Z';
    const pieces=[{source,target:align(source,sample(ring,8))},{source:core,target:align(core,sample(triangle,8))}].map(p=>({...p,node:el('path',{},actor)}));
    const details=el('g',{transform:'scale(8)',opacity:0},actor);
    const lines=el('g',{fill:'none',stroke:'#f3eed8','stroke-width':2.5,'stroke-linecap':'round','stroke-linejoin':'round'},details);
    el('rect',{x:13,y:28,width:29,height:21,rx:5},lines);
    el('path',{d:'M15 55v3m33-3v3M48 22c0-5-2-9-5-12m4 7 6-6M46 45h4m-4 4h4'},lines);
    el('circle',{cx:48,cy:32.5,r:2.3},details);el('circle',{cx:48,cy:39,r:2},details);
    const leaves=el('path',{d:'M44.4 13C38 13 36.7 7.9 37 4c5.5.5 9 3.3 7.4 9ZM48 16c-.1-5.7 3.6-8.3 9-8-1 5.5-3.7 8.3-9 8Z'},details);
    return {draw(ms){
      const t=clamp(ms/duration),amount=ease((t-.08)/.25)*(1-ease((t-.72)/.23));
      const visible=t>.075&&t<.955;
      rest.setAttribute('opacity',visible?'0':'1');actor.setAttribute('opacity',visible?'1':'0');
      const inhale=-.04*Math.sin(Math.PI*clamp(t/.17)),settle=.025*Math.sin(Math.PI*clamp((t-.33)/.13));
      const transform=`translate(256 256) scale(${1+inhale+settle}) translate(-256 -256)`;
      rest.setAttribute('transform',transform);actor.setAttribute('transform',transform);
      for(const p of pieces)p.node.setAttribute('d',shape(p.source.map((a,i)=>[mix(a[0],p.target[i][0],amount),mix(a[1],p.target[i][1],amount)])));
      details.setAttribute('opacity',ease((amount-.6)/.4).toFixed(3));
      leaves.setAttribute('transform',`rotate(${Math.sin((t-.35)*14)*2*amount} 48 20)`);
    }};
  }
  function play(drawer){
    active?.finish(false);
    if(!drawer.open||reduce.matches||!window.repoBrandArt)return;
    const host=document.createElement('div');host.className='repo-reparty-opening';host.tabIndex=-1;
    host.setAttribute('role','status');host.setAttribute('aria-label','Opening Reparty');
    const shadow=host.attachShadow({mode:'open'});
    shadow.innerHTML=`<style>:host{position:absolute;inset:0;z-index:100;display:grid;place-items:center;background:#0d1913;outline:none}.stage{width:min(320px,80vw)}svg{display:block;width:100%;height:auto;overflow:visible}.motion-core,.motion-arcs,.motion-trails,.motion-sparks{opacity:0}</style><div class="stage" aria-hidden="true">${repoBrandArt.markup}</div>`;
    const previous=document.activeElement,siblings=[...drawer.children].map(n=>[n,n.inert]);
    siblings.forEach(([n])=>n.inert=true);drawer.append(host);
    let motion,frame=0,elapsed=0,last=null,finished=false;
    function finish(restore=true){
      if(finished)return;finished=true;cancelAnimationFrame(frame);
      const focused=document.activeElement===host;siblings.forEach(([n,inert])=>n.inert=inert);host.remove();
      drawer.removeEventListener('close',closed);document.removeEventListener('visibilitychange',sync);window.removeEventListener('repo-launcher-portal-visibility',sync);reduce.removeEventListener('change',preference);
      if(active?.host===host)active=null;
      if(restore&&focused&&drawer.open)(previous?.isConnected&&drawer.contains(previous)?previous:drawer.querySelector('iframe,button'))?.focus({preventScroll:true});
    }
    const visible=()=>!document.hidden&&document.documentElement.dataset.repoPortalVisible!=='false';
    function tick(now){frame=0;if(finished)return;if(!drawer.open){finish(false);return;}if(!visible()){last=null;return;}if(last!==null)elapsed+=Math.max(0,now-last);last=now;if(elapsed>=duration){motion.draw(duration);finish();return;}motion.draw(elapsed);frame=requestAnimationFrame(tick);}
    function sync(){cancelAnimationFrame(frame);frame=0;last=null;if(!finished&&visible())frame=requestAnimationFrame(tick);}
    function closed(){if(!drawer.open)finish(false);}
    function preference(){if(reduce.matches)finish();}
    try{motion=createMotion(shadow.querySelector('svg'),repoBrandArt.outline);}catch{finish(false);return;}
    drawer.addEventListener('close',closed);document.addEventListener('visibilitychange',sync);window.addEventListener('repo-launcher-portal-visibility',sync);reduce.addEventListener('change',preference);
    active={host,finish};motion.draw(0);host.focus({preventScroll:true});sync();
  }
  window.repoRepartyIntro=Object.freeze({play,stop(){active?.finish(false);}});
})();
