/* Dragonbound Career V34.19 — touch controls for gameplay-only sections. */
(()=>{
  'use strict';
  const isTouch=()=>matchMedia?.('(pointer: coarse)')?.matches||navigator.maxTouchPoints>0;
  if(!isTouch())return;
  document.documentElement.classList.add('career-touch-device');

  const keys={up:{key:'w',code:'KeyW'},down:{key:'s',code:'KeyS'},left:{key:'a',code:'KeyA'},right:{key:'d',code:'KeyD'},run:{key:' ',code:'Space'},creep:{key:'Shift',code:'ShiftLeft'},interact:{key:'e',code:'KeyE'}};
  const held=new Map();
  const fire=(info,type)=>{try{window.dispatchEvent(new KeyboardEvent(type,{key:info.key,code:info.code,bubbles:true,cancelable:true,repeat:false}));}catch(_){}};
  const down=(name,el)=>{if(held.has(name)||!keys[name])return;held.set(name,keys[name]);el?.classList.add('is-held');fire(keys[name],'keydown');};
  const up=(name,el)=>{const info=held.get(name)||keys[name];if(!info)return;held.delete(name);el?.classList.remove('is-held');fire(info,'keyup');};
  const releaseAll=()=>{for(const [name,info] of held){fire(info,'keyup');held.delete(name);}document.querySelectorAll('.career-touch-btn.is-held').forEach(x=>x.classList.remove('is-held'));};

  const wrap=document.createElement('div');wrap.className='career-touch-controls';wrap.setAttribute('aria-label','After Hours touch controls');wrap.innerHTML=`<div class="career-touch-dpad">
    <button type="button" class="career-touch-btn career-touch-up" data-career-touch="up" aria-label="Move up">▲</button>
    <button type="button" class="career-touch-btn career-touch-left" data-career-touch="left" aria-label="Move left">◀</button>
    <button type="button" class="career-touch-btn career-touch-right" data-career-touch="right" aria-label="Move right">▶</button>
    <button type="button" class="career-touch-btn career-touch-down" data-career-touch="down" aria-label="Move down">▼</button>
  </div><div class="career-touch-actions">
    <button type="button" class="career-touch-btn career-touch-creep" data-career-touch="creep" aria-label="Creep">CREEP</button>
    <button type="button" class="career-touch-btn career-touch-run" data-career-touch="run" aria-label="Run">RUN</button>
    <button type="button" class="career-touch-btn career-touch-interact" data-career-touch="interact" aria-label="Interact">ACT</button>
  </div>`;document.body.appendChild(wrap);
  const hint=document.createElement('div');hint.className='career-orientation-hint';hint.textContent='Landscape recommended';document.body.appendChild(hint);

  wrap.querySelectorAll('[data-career-touch]').forEach(btn=>{const name=btn.dataset.careerTouch;btn.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();btn.setPointerCapture?.(e.pointerId);down(name,btn);},{passive:false});const end=e=>{e.preventDefault();e.stopPropagation();up(name,btn);};btn.addEventListener('pointerup',end,{passive:false});btn.addEventListener('pointercancel',end,{passive:false});btn.addEventListener('lostpointercapture',()=>up(name,btn));});

  const update=()=>{
    const game=document.querySelector('.after-hours-game');
    const modal=document.querySelector('.after-hours-modal');
    const active=!!game&&!modal&&!!document.querySelector('.story-stage.is-after-hours-stage');
    document.body.classList.toggle('career-touch-after-hours',active);
    if(!active)releaseAll();
  };
  new MutationObserver(update).observe(document.getElementById('careerRoot')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  addEventListener('blur',releaseAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});addEventListener('orientationchange',()=>setTimeout(update,80),{passive:true});update();
})();
