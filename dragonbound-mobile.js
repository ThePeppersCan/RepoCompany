/* Dragonbound V34.21.2 — iPad Dragon Racing coordinate tap hotfix. */
(()=>{
  'use strict';
  const coarse=()=>matchMedia?.('(pointer: coarse)')?.matches||navigator.maxTouchPoints>0;
  if(!coarse())return;
  document.documentElement.classList.add('dragonbound-touch-device');

  const keyInfo={
    up:{key:'w',code:'KeyW',keyCode:87},down:{key:'s',code:'KeyS',keyCode:83},left:{key:'a',code:'KeyA',keyCode:65},right:{key:'d',code:'KeyD',keyCode:68},
    action:{key:'e',code:'KeyE',keyCode:69},run:{key:'Shift',code:'ShiftLeft',keyCode:16}
  };
  const held=new Map();
  const dispatch=(info,type)=>{
    const init={key:info.key,code:info.code,keyCode:info.keyCode,which:info.keyCode,bubbles:true,cancelable:true,repeat:false};
    const target=(document.activeElement&&document.body?.contains(document.activeElement))?document.activeElement:document.body;
    try{(target||window).dispatchEvent(new KeyboardEvent(type,init));}catch(_){/* noop */}
  };
  const releaseAll=()=>{for(const [name,info] of held){dispatch(info,'keyup');held.delete(name);}};
  const press=(name,button)=>{const info=keyInfo[name];if(!info||held.has(name))return;held.set(name,info);button?.classList.add('is-held');dispatch(info,'keydown');};
  const release=(name,button)=>{const info=held.get(name)||keyInfo[name];if(!info)return;held.delete(name);button?.classList.remove('is-held');dispatch(info,'keyup');};

  const controls=document.createElement('div');
  controls.className='dragonbound-touch-controls';
  controls.setAttribute('aria-label','Dragonbound touch controls');
  controls.innerHTML=`<div class="dragonbound-touch-dpad" aria-label="Movement controls">
    <button type="button" class="dragonbound-touch-btn dragonbound-touch-up" data-db-touch="up" aria-label="Move up">▲</button>
    <button type="button" class="dragonbound-touch-btn dragonbound-touch-left" data-db-touch="left" aria-label="Move left">◀</button>
    <button type="button" class="dragonbound-touch-btn dragonbound-touch-right" data-db-touch="right" aria-label="Move right">▶</button>
    <button type="button" class="dragonbound-touch-btn dragonbound-touch-down" data-db-touch="down" aria-label="Move down">▼</button>
  </div><div class="dragonbound-touch-actions">
    <button type="button" class="dragonbound-touch-btn dragonbound-touch-run" data-db-touch="run" aria-label="Run">RUN</button>
    <button type="button" class="dragonbound-touch-btn dragonbound-touch-action" data-db-touch="action" aria-label="Interact">ACT</button>
  </div>`;
  document.body.appendChild(controls);
  const hint=document.createElement('div');hint.className='dragonbound-orientation-hint';hint.textContent='Landscape gives Dragonbound more room';document.body.appendChild(hint);

  controls.querySelectorAll('[data-db-touch]').forEach(button=>{
    const name=button.dataset.dbTouch;
    button.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();button.setPointerCapture?.(e.pointerId);press(name,button);},{passive:false});
    const end=e=>{e.preventDefault();e.stopPropagation();release(name,button);};
    button.addEventListener('pointerup',end,{passive:false});
    button.addEventListener('pointercancel',end,{passive:false});
    button.addEventListener('lostpointercapture',()=>release(name,button));
  });

  /* Normal Dragonbound home is click/tap driven. V34.19 incorrectly placed a
     virtual D-pad over the home sidebar and part of the dragon, stealing taps.
     Only show this controller in actual direct-control outing scenes. Career's
     Blackglass After Hours has its own dedicated touch controls. */
  const update=()=>{
    const overlay=document.getElementById('dragonboundOverlay');
    const open=!!overlay?.classList.contains('is-open');
    const outing=document.body.classList.contains('dragonbound-outing-active');
    const explicitDirect=!!overlay?.querySelector?.('[data-dragonbound-direct-control="true"].is-visible,.dragonbound-direct-control.is-visible');
    const careerOpen=document.body.classList.contains('dragonbound-career-open');
    const show=!careerOpen&&(outing||explicitDirect);
    document.body.classList.toggle('dragonbound-touch-controls-visible',show);
    document.body.classList.toggle('dragonbound-touch-game-open',open);
    if(!show)releaseAll();
  };
  let updateRaf=0;
  const scheduleUpdate=()=>{if(updateRaf)return;updateRaf=requestAnimationFrame(()=>{updateRaf=0;update();});};

  /* Avoid a subtree-wide MutationObserver on the entire game. On iPad it was
     waking up constantly as Dragonbound updated state/classes. Body/overlay
     class observation plus ordinary input/visibility events is enough. */
  const bodyObserver=new MutationObserver(scheduleUpdate);
  bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  const bindOverlayObserver=()=>{
    const overlay=document.getElementById('dragonboundOverlay');
    if(!overlay||overlay.__dbMobileObserved)return false;
    overlay.__dbMobileObserved=true;
    new MutationObserver(scheduleUpdate).observe(overlay,{attributes:true,attributeFilter:['class']});
    return true;
  };
  if(!bindOverlayObserver()){
    // Watch only for the overlay being attached, then disconnect. Do not run
    // mobile bookkeeping on every click across the whole website.
    const bootObserver=new MutationObserver(()=>{if(bindOverlayObserver())bootObserver.disconnect();});
    bootObserver.observe(document.body,{childList:true});
  }
  window.addEventListener('dragonbound:visibility',scheduleUpdate);
  window.addEventListener('dragonracing:visibility',scheduleUpdate);
  window.addEventListener('blur',releaseAll);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();scheduleUpdate();});
  window.addEventListener('orientationchange',()=>setTimeout(scheduleUpdate,120),{passive:true});
  window.addEventListener('resize',scheduleUpdate,{passive:true});

  /* iOS Safari occasionally fails to synthesise click reliably for IMG-based
     role=button controls when the page has just resized. Provide a tiny tap
     bridge for the two controls users actually reported: the baby dragon and
     Dragon Racing. Native mouse/desktop behaviour is untouched. */
  let tap=null;
  let bridgedTarget=null;
  let bridgedAt=0;
  const normalTapTarget=node=>node?.closest?.('.dragonbound-baby-sprite')||null;
  const racingButton=()=>document.querySelector('#dragonboundOverlay .dragon-racing-sidebar-button');
  const pointInside=(el,x,y,pad=0)=>{
    if(!el||el.hidden)return false;
    const style=getComputedStyle(el);
    if(style.display==='none'||style.visibility==='hidden'||style.pointerEvents==='none'||Number(style.opacity)===0)return false;
    const r=el.getBoundingClientRect();
    if(r.width<8||r.height<8)return false;
    return x>=r.left-pad&&x<=r.right+pad&&y>=r.top-pad&&y<=r.bottom+pad;
  };
  const hitTarget=(node,x,y)=>{
    /* V34.21.2: do not trust event.target for Dragon Racing on iPad. Safari can
       report a transparent/overlapping sibling even though the finger is visibly
       on the racing artwork. Hit-test the button's real screen rectangle instead. */
    const race=racingButton();
    if(pointInside(race,x,y,3))return {target:race,kind:'racing'};
    const target=normalTapTarget(node);
    return target?{target,kind:'normal'}:null;
  };
  document.addEventListener('pointerdown',e=>{
    if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
    const hit=hitTarget(e.target,e.clientX,e.clientY);if(!hit)return;
    tap={id:e.pointerId,target:hit.target,kind:hit.kind,x:e.clientX,y:e.clientY};
  },{passive:true,capture:true});
  document.addEventListener('pointercancel',()=>{tap=null;},{passive:true,capture:true});
  document.addEventListener('pointerup',e=>{
    if(!tap||tap.id!==e.pointerId)return;
    const start=tap;
    const dx=e.clientX-start.x,dy=e.clientY-start.y;
    const stillInside=start.kind==='racing'
      ? pointInside(start.target,e.clientX,e.clientY,8)
      : normalTapTarget(e.target)===start.target;
    const valid=stillInside&&(dx*dx+dy*dy)<=324;
    tap=null;
    if(!valid)return;
    bridgedTarget=start.target;bridgedAt=performance.now();
    e.preventDefault();
    if(start.kind==='racing'){
      /* Call the racing UI directly. This works even when a stale transparent
         layer is what Safari reports as the pointer target. */
      try{
        if(typeof window.DragonRacingUi?.open==='function')window.DragonRacingUi.open();
        else start.target.click();
      }catch(_){try{start.target.click();}catch(__){/* noop */}}
    }else{
      try{start.target.click();}catch(_){/* native click may still follow */}
    }
  },{passive:false,capture:true});
  document.addEventListener('click',e=>{
    if(!e.isTrusted||!bridgedTarget)return;
    const now=performance.now();
    const same=e.target===bridgedTarget||e.target?.closest?.('.dragon-racing-sidebar-button,.dragonbound-baby-sprite')===bridgedTarget;
    if(same&&now-bridgedAt<650){
      e.preventDefault();e.stopImmediatePropagation();
      bridgedTarget=null;bridgedAt=0;
    }
  },true);

  update();
})();
