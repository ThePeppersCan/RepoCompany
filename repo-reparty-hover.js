// Reuse the shipped Reparty ribbon morph, beginning and ending on its TV pose.
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),controllers=[];
 function mount(host){
  if(host.shadowRoot)return;
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML='<style>:host{display:block}svg{display:block;width:100%;height:100%;overflow:visible}.motion-core,.motion-arcs,.motion-trails,.motion-sparks{opacity:0}</style>'+window.repoBrandArt.markup;
  const svg=shadow.querySelector('svg');svg.setAttribute('viewBox','0 0 512 512');svg.setAttribute('aria-hidden','true');
  const motion=window.repoRepartyIntro.createMotion(svg,window.repoBrandArt.outline),duration=window.repoRepartyIntro.duration,rest=duration*.45,cycle=duration+900;
  const trigger=host.closest('button')||host;let hovered=false,focused=false,frame=0,start=null;
  const reset=()=>{cancelAnimationFrame(frame);frame=0;start=null;motion.draw(rest);host.dataset.animating='false';};
  function tick(now){frame=0;if(document.hidden||reduced.matches||!host.isConnected){reset();return;}if(start===null)start=now;const elapsed=now-start,phase=elapsed%cycle;
   if(!(hovered||focused)&&phase>=duration){reset();return;}
   motion.draw((rest+Math.min(phase,duration))%duration);
   frame=requestAnimationFrame(tick);
  }
  function wake(){if(!frame&&!reduced.matches&&!document.hidden){host.dataset.animating='true';frame=requestAnimationFrame(tick);}}
  trigger.addEventListener('pointerenter',()=>{hovered=true;wake();});trigger.addEventListener('pointerleave',()=>{hovered=false;});
  trigger.addEventListener('focus',()=>{focused=trigger.matches(':focus-visible');if(focused)wake();});trigger.addEventListener('blur',()=>{focused=false;});
  const stop=()=>{hovered=false;focused=false;reset();};controllers.push(stop);reset();
 }
 window.repoRepartyHover={mount};
 document.querySelectorAll('[data-reparty-mascot]').forEach(mount);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)controllers.forEach(stop=>stop());});
 document.addEventListener('repo-workspace-view',()=>controllers.forEach(stop=>stop()));
 reduced.addEventListener('change',()=>{if(reduced.matches)controllers.forEach(stop=>stop());});
})();
