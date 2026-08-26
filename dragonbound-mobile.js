/* Dragonbound V34.19 — additive touch/input compatibility. */
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
  const releaseAll=()=>{for(const [name,info] of held){dispatch(info,'keyup');held.delete(name);}}
  const press=(name,button)=>{
    const info=keyInfo[name];if(!info||held.has(name))return;
    held.set(name,info);button?.classList.add('is-held');dispatch(info,'keydown');
  };
  const release=(name,button)=>{
    const info=held.get(name)||keyInfo[name];if(!info)return;
    held.delete(name);button?.classList.remove('is-held');dispatch(info,'keyup');
  };

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
    button.addEventListener('pointerup',end,{passive:false});button.addEventListener('pointercancel',end,{passive:false});button.addEventListener('lostpointercapture',()=>release(name,button));
  });

  const anyVisible=(selectors)=>selectors.some(s=>document.querySelector(s));
  const update=()=>{
    const overlay=document.getElementById('dragonboundOverlay');
    const open=!!overlay?.classList.contains('is-open');
    const home=!!overlay?.querySelector('.dragonbound-home-scene.is-visible');
    const outing=document.body.classList.contains('dragonbound-outing-active');
    const blocked=anyVisible([
      '#dragonboundOverlay .dragonbound-dialogue.is-visible','#dragonboundOverlay .dragonbound-dialogue-panel.is-visible',
      '#dragonboundOverlay .dragonbound-travel-menu.is-visible','#dragonboundOverlay .dragonbound-my-dragon-overlay.is-visible',
      '#dragonboundOverlay .dragonbound-outings-overlay.is-visible','#dragonboundOverlay .velmora-calendar-overlay.is-visible',
      '#dragonboundOverlay .dragonbound-property-overlay.is-visible','#dragonboundOverlay .dragonbound-home-scene.is-build-editing',
      '#dragonboundOverlay .dragonbound-home-scene.is-build-placing','body.dragonbound-career-open'
    ]);
    const show=(open&&home&&!blocked)||outing;
    document.body.classList.toggle('dragonbound-touch-controls-visible',show);
    if(!show)releaseAll();
  };
  const observer=new MutationObserver(update);observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','aria-hidden']});
  window.addEventListener('blur',releaseAll);document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAll();});
  window.addEventListener('orientationchange',()=>setTimeout(update,80),{passive:true});window.addEventListener('resize',update,{passive:true});
  update();
})();
