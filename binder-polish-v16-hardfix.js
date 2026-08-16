/*
 * Repo Company V18.1 — Binder Polish V16 HARD FIX
 * ------------------------------------------------
 * This file is intentionally standalone and is loaded AFTER the existing site.
 * It does not depend on the older V13/V14/V15 binder wrappers having executed.
 *
 * Fixes:
 * - moves Binder Style out of the bottom collection plaque
 * - uses the supplied multicolour paintbrush as the actual Binder Style control
 * - pins Hidden Cards level with the open binder's top edge
 * - freezes the side controls during page turns so the holder cannot jump/shake
 * - adds first-click brush burst + soft magical click
 * - adds visible fly-to-hidden / fly-back animations while preserving the
 *   existing authoritative binder hide/restore handlers
 */
(()=>{
  if(window.__repoBinderPolishV16HardfixInstalled)return;
  window.__repoBinderPolishV16HardfixInstalled=true;

  const ICON='assets/quidditch-tcg-binder/binder-style-icon-v16.png';
  const HOLDER='assets/quidditch-tcg-binder/hidden-cards-holder.png';
  const DIALOG_ID='quidditchTcgBinderDialog';
  const SCOPE=`#${DIALOG_ID}`;
  const state={coords:null,dialog:null,stage:null,spread:null,lastOpen:false,raf:0,recalcTimer:0,lastPage:'',synthetic:new WeakSet()};

  const style=document.createElement('style');
  style.id='repoBinderPolishV16HardfixStyles';
  style.textContent=`
    /* V16 wins over every earlier binder-side-control rule. */
    ${SCOPE}.repo-binder-book-mode[data-binder-page^='open'] .repo-binder-storage-launch.repo-hidden-card-holder,
    ${SCOPE}[data-binder-page^='open'] .repo-binder-storage-launch.repo-hidden-card-holder{
      position:absolute!important;
      right:auto!important;
      bottom:auto!important;
      margin:0!important;
      padding:0!important;
      min-width:0!important;
      max-width:none!important;
      min-height:0!important;
      height:auto!important;
      aspect-ratio:684 / 1229!important;
      display:block!important;
      visibility:visible!important;
      opacity:1!important;
      z-index:2140!important;
      overflow:visible!important;
      appearance:none!important;
      -webkit-appearance:none!important;
      border:0!important;
      outline:0!important;
      border-radius:0!important;
      background-color:transparent!important;
      background-image:url('${HOLDER}')!important;
      background-position:center!important;
      background-repeat:no-repeat!important;
      background-size:contain!important;
      box-shadow:none!important;
      color:transparent!important;
      font-size:0!important;
      line-height:0!important;
      letter-spacing:0!important;
      text-shadow:none!important;
      cursor:pointer!important;
      transform:none!important;
      transform-origin:center!important;
      transition:none!important;
      animation:none!important;
      backface-visibility:hidden!important;
      will-change:auto!important;
      filter:drop-shadow(0 15px 22px rgba(0,0,0,.72))!important;
    }
    ${SCOPE}.repo-binder-book-mode[data-binder-page^='open'] .repo-binder-storage-launch.repo-hidden-card-holder:hover,
    ${SCOPE}.repo-binder-book-mode[data-binder-page^='open'] .repo-binder-storage-launch.repo-hidden-card-holder:focus-visible,
    ${SCOPE}.repo-binder-book-mode[data-binder-page^='open'] .repo-binder-storage-launch.repo-hidden-card-holder:active{
      transform:none!important;
      transition:none!important;
      animation:none!important;
      filter:drop-shadow(0 17px 24px rgba(0,0,0,.76)) drop-shadow(0 0 10px rgba(89,177,255,.18))!important;
    }
    ${SCOPE}[data-binder-page^='open'] .repo-binder-storage-launch.repo-hidden-card-holder > span{
      position:absolute!important;
      right:3px!important;
      top:8px!important;
      min-width:21px!important;
      height:21px!important;
      padding:0 5px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      border:1px solid rgba(230,190,94,.84)!important;
      border-radius:999px!important;
      background:rgba(3,8,14,.92)!important;
      color:#ffe2a0!important;
      font:900 10px/20px Georgia,serif!important;
      box-shadow:0 3px 9px rgba(0,0,0,.55)!important;
    }

    /* The real Binder Style control now lives beside the binder, not in the plaque. */
    ${SCOPE} #binderStyleControl.repo-binder-style-v16{
      position:absolute!important;
      right:auto!important;
      bottom:auto!important;
      width:auto!important;
      min-width:0!important;
      height:auto!important;
      margin:0!important;
      padding:0!important;
      display:block!important;
      overflow:visible!important;
      z-index:2150!important;
      transform:none!important;
      pointer-events:auto!important;
    }
    ${SCOPE} #binderStyleControl.repo-binder-style-v16[hidden]{display:none!important}
    ${SCOPE} #binderStyleControl.repo-binder-style-v16 #binderStyleTrigger{
      position:relative!important;
      inset:auto!important;
      display:grid!important;
      place-items:center!important;
      width:var(--repo-v16-brush-size,88px)!important;
      height:var(--repo-v16-brush-size,88px)!important;
      min-width:0!important;
      min-height:0!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      outline:0!important;
      border-radius:0!important;
      background:transparent!important;
      box-shadow:none!important;
      color:transparent!important;
      font-size:0!important;
      overflow:visible!important;
      cursor:pointer!important;
      transform:none!important;
      transition:none!important;
      isolation:isolate!important;
    }
    ${SCOPE} #binderStyleControl.repo-binder-style-v16 #binderStyleTrigger::before,
    ${SCOPE} #binderStyleControl.repo-binder-style-v16 #binderStyleTrigger::after{content:none!important;display:none!important}
    ${SCOPE} #binderStyleControl.repo-binder-style-v16 #binderStyleTrigger > i,
    ${SCOPE} #binderStyleControl.repo-binder-style-v16 #binderStyleTrigger > span:not(.repo-v16-brush-a11y){display:none!important}
    ${SCOPE} #binderStyleControl.repo-binder-style-v16 #binderStyleTrigger .repo-v16-brush-icon{
      display:block!important;
      width:100%!important;
      height:100%!important;
      object-fit:contain!important;
      pointer-events:none!important;
      filter:drop-shadow(0 11px 18px rgba(0,0,0,.68)) drop-shadow(0 0 10px rgba(78,174,255,.16))!important;
      transform:rotate(-4deg) scale(.98)!important;
      transform-origin:center!important;
      transition:filter .14s ease,transform .14s ease!important;
    }
    ${SCOPE} #binderStyleControl.repo-binder-style-v16 #binderStyleTrigger:hover .repo-v16-brush-icon,
    ${SCOPE} #binderStyleControl.repo-binder-style-v16 #binderStyleTrigger:focus-visible .repo-v16-brush-icon{
      transform:translateY(-2px) rotate(-5deg) scale(1.035)!important;
      filter:drop-shadow(0 13px 21px rgba(0,0,0,.7)) drop-shadow(0 0 14px rgba(82,183,255,.28)) brightness(1.05)!important;
    }
    ${SCOPE} #binderStyleControl.repo-binder-style-v16 #binderStyleTrigger.repo-v16-brush-click .repo-v16-brush-icon{
      transform:translateY(1px) rotate(-2deg) scale(.965)!important;
      filter:drop-shadow(0 7px 14px rgba(0,0,0,.64)) saturate(1.1) brightness(1.09)!important;
    }
    ${SCOPE} #binderStyleControl.repo-binder-style-v16 .binder-style-menu{
      z-index:5000!important;
      max-width:min(620px,calc(100vw - 32px))!important;
      max-height:min(72vh,680px)!important;
      overflow:auto!important;
    }

    /* Keep the bottom plaque as page information only. */
    ${SCOPE}[data-binder-page^='open'] .quidditch-tcg-binder-status #binderStyleControl{display:none!important}

    .repo-v16-brush-burst{
      position:fixed!important;
      width:0!important;height:0!important;
      pointer-events:none!important;
      z-index:1000000!important;
    }
    .repo-v16-brush-burst .ring{
      position:absolute;left:-23px;top:-23px;width:46px;height:46px;border-radius:50%;
      border:2px solid rgba(255,220,126,.88);box-shadow:0 0 14px rgba(86,181,255,.35),inset 0 0 0 1px rgba(103,195,255,.45);
      animation:repoV16BrushRing .58s cubic-bezier(.18,.78,.2,1) forwards;
    }
    .repo-v16-brush-burst .spark{
      position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;
      background:radial-gradient(circle,#fffbe2 0 22%,#80d8ff 42%,#8c72ff 66%,transparent 72%);
      box-shadow:0 0 9px rgba(255,231,145,.62),0 0 15px rgba(84,189,255,.4);
      transform:rotate(var(--a)) translateY(0);
      animation:repoV16BrushSpark .62s ease-out forwards;
    }
    @keyframes repoV16BrushRing{from{opacity:1;transform:scale(.35)}to{opacity:0;transform:scale(2.35)}}
    @keyframes repoV16BrushSpark{from{opacity:1;transform:rotate(var(--a)) translateY(0) scale(1)}to{opacity:0;transform:rotate(var(--a)) translateY(calc(-36px - var(--d))) scale(.2)}}

    .repo-v16-card-ghost{
      position:fixed!important;left:0!important;top:0!important;z-index:999999!important;
      pointer-events:none!important;overflow:hidden!important;border-radius:8px!important;
      transform-origin:top left!important;will-change:transform,opacity!important;
      filter:drop-shadow(0 14px 22px rgba(0,0,0,.62))!important;
    }
    .repo-v16-card-ghost img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important}

    @media(max-width:900px){
      ${SCOPE} #binderStyleControl.repo-binder-style-v16 #binderStyleTrigger{--repo-v16-brush-size:72px}
    }
    @media(prefers-reduced-motion:reduce){
      .repo-v16-brush-burst,.repo-v16-card-ghost{display:none!important}
      ${SCOPE} #binderStyleControl.repo-binder-style-v16 #binderStyleTrigger .repo-v16-brush-icon{transition:none!important}
    }
  `;
  document.head.appendChild(style);

  function dialog(){return document.getElementById(DIALOG_ID)}
  function isOpenPage(d=dialog()){return !!(d&&d.open&&String(d.dataset.binderPage||'').startsWith('open'))}
  function publicBinder(d=dialog()){return d?.dataset.publicBinder==='true'||Boolean(window.__repoTcgDisplayedCollection?.isPublic)}

  function ensureBrushMarkup(trigger){
    if(!trigger)return;
    trigger.setAttribute('aria-label','Binder Style');
    trigger.setAttribute('title','Binder Style');
    let img=trigger.querySelector('.repo-v16-brush-icon');
    if(!img){
      img=document.createElement('img');
      img.className='repo-v16-brush-icon';
      img.src=ICON;
      img.alt='';
      img.setAttribute('aria-hidden','true');
      trigger.appendChild(img);
    }else if(img.getAttribute('src')!==ICON){img.src=ICON;}
  }

  function prepareBinder(){
    const d=dialog();
    if(!d)return false;
    const stage=d.querySelector('.quidditch-tcg-binder-stage');
    const spread=d.querySelector('.repo-binder-spread-126');
    const holder=d.querySelector('.repo-binder-storage-launch');
    const control=d.querySelector('#binderStyleControl');
    const trigger=d.querySelector('#binderStyleTrigger');
    if(!stage)return false;
    state.dialog=d;state.stage=stage;state.spread=spread||state.spread;

    if(holder){
      holder.classList.add('repo-hidden-card-holder');
      holder.setAttribute('aria-label','Hidden cards');
      holder.title='Hidden Cards';
      // The stage is stable; old versions attached this to changing spread DOM.
      if(holder.parentElement!==stage)stage.appendChild(holder);
    }
    if(control&&trigger){
      control.classList.add('repo-binder-style-v16');
      ensureBrushMarkup(trigger);
      // Physically remove it from the bottom status plaque.
      if(control.parentElement!==stage)stage.appendChild(control);
    }
    return !!(spread&&holder&&control&&trigger);
  }

  function sizeForViewport(){
    const vw=document.documentElement.clientWidth||window.innerWidth||1280;
    const holderW=Math.round(Math.max(92,Math.min(136,vw*.070)));
    const brush=Math.round(Math.max(70,Math.min(92,vw*.0505)));
    return {holderW,holderH:holderW*(1229/684),brush};
  }

  function calculateCoords(force=false){
    if(!prepareBinder()||!isOpenPage())return;
    const {stage,spread}=state;
    if(!stage||!spread)return;
    const sr=stage.getBoundingClientRect(),br=spread.getBoundingClientRect();
    if(!sr.width||!sr.height||!br.width||!br.height)return;
    const {holderW,holderH,brush}=sizeForViewport();
    const gap=Math.max(8,Math.min(14,sr.width*.007));
    let left=br.right-sr.left+gap;
    let top=br.top-sr.top+1;
    left=Math.max(8,Math.min(left,sr.width-holderW-8));
    top=Math.max(8,Math.min(top,sr.height-holderH-brush-14));
    const brushLeft=Math.max(8,Math.min(left+(holderW-brush)/2,sr.width-brush-8));
    const brushTop=Math.max(8,Math.min(top+holderH+8,sr.height-brush-8));
    const next={left,top,holderW,holderH,brushLeft,brushTop,brush};
    if(force||!state.coords)state.coords=next;
    else{
      // Only accept geometry updates when the binder has genuinely moved/resized.
      // Tiny page-turn measurements are deliberately ignored.
      const delta=Math.max(Math.abs(next.left-state.coords.left),Math.abs(next.top-state.coords.top),Math.abs(next.holderW-state.coords.holderW));
      if(delta>8)state.coords=next;
    }
  }

  function setImp(el,prop,value){if(el)el.style.setProperty(prop,value,'important')}
  function placeMenu(control){
    const menu=control?.querySelector('.binder-style-menu');
    if(!menu||menu.hidden)return;
    const trigger=control.querySelector('#binderStyleTrigger');
    if(!trigger)return;
    const r=trigger.getBoundingClientRect();
    const vw=document.documentElement.clientWidth||window.innerWidth;
    const vh=document.documentElement.clientHeight||window.innerHeight;
    setImp(menu,'position','fixed');setImp(menu,'transform','none');setImp(menu,'right','auto');setImp(menu,'bottom','auto');
    const mw=Math.min(620,Math.max(360,vw*.55));
    setImp(menu,'width',`${Math.round(mw)}px`);
    const measuredH=Math.min(menu.scrollHeight||560,Math.min(vh*.72,680));
    const left=Math.max(12,Math.min(r.left-mw-16,vw-mw-12));
    const top=Math.max(12,Math.min(r.top, vh-measuredH-12));
    setImp(menu,'left',`${Math.round(left)}px`);setImp(menu,'top',`${Math.round(top)}px`);
  }

  function applyFrozenCoords(){
    const d=dialog();
    if(!isOpenPage(d)||!state.coords)return;
    const holder=d.querySelector('.repo-binder-storage-launch.repo-hidden-card-holder');
    const control=d.querySelector('#binderStyleControl.repo-binder-style-v16');
    const trigger=d.querySelector('#binderStyleTrigger');
    const c=state.coords;
    if(holder){
      setImp(holder,'position','absolute');setImp(holder,'left',`${Math.round(c.left)}px`);setImp(holder,'top',`${Math.round(c.top)}px`);
      setImp(holder,'right','auto');setImp(holder,'bottom','auto');setImp(holder,'width',`${Math.round(c.holderW)}px`);
      setImp(holder,'min-width',`${Math.round(c.holderW)}px`);setImp(holder,'max-width',`${Math.round(c.holderW)}px`);
      setImp(holder,'transform','none');setImp(holder,'transition','none');setImp(holder,'animation','none');
    }
    if(control){
      setImp(control,'position','absolute');setImp(control,'left',`${Math.round(c.brushLeft)}px`);setImp(control,'top',`${Math.round(c.brushTop)}px`);
      setImp(control,'right','auto');setImp(control,'bottom','auto');setImp(control,'transform','none');
      control.style.setProperty('--repo-v16-brush-size',`${Math.round(c.brush)}px`);
      placeMenu(control);
    }
    ensureBrushMarkup(trigger);
  }

  function loop(){
    state.raf=0;
    const d=dialog();
    if(d&&d.open){
      const open=isOpenPage(d);
      if(open&&!state.lastOpen){state.coords=null;calculateCoords(true);setTimeout(()=>{calculateCoords(true);applyFrozenCoords()},90);setTimeout(()=>{calculateCoords(true);applyFrozenCoords()},240);}
      if(open&&!state.coords)calculateCoords(true);
      if(open)applyFrozenCoords();
      state.lastOpen=open;
      state.lastPage=String(d.dataset.binderPage||'');
    }else{state.lastOpen=false;state.coords=null;}
    state.raf=requestAnimationFrame(loop);
  }

  function softMagicClick(){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      const ctx=softMagicClick.ctx||(softMagicClick.ctx=new AC());if(ctx.state==='suspended')ctx.resume?.();
      const now=ctx.currentTime,master=ctx.createGain();master.gain.setValueAtTime(.0001,now);master.gain.exponentialRampToValueAtTime(.105,now+.018);master.gain.exponentialRampToValueAtTime(.0001,now+.38);master.connect(ctx.destination);
      [[690,1040,'triangle',.42],[1080,1550,'sine',.28]].forEach(([a,b,type,amp],i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),start=now+i*.018;o.type=type;o.frequency.setValueAtTime(a,start);o.frequency.exponentialRampToValueAtTime(b,start+.18);g.gain.setValueAtTime(.001,start);g.gain.exponentialRampToValueAtTime(amp,start+.025);g.gain.exponentialRampToValueAtTime(.001,start+.30);o.connect(g).connect(master);o.start(start);o.stop(start+.32)});
    }catch(_){ }
  }

  function brushBurst(trigger){
    const d=dialog();if(!trigger||!d)return;
    const r=trigger.getBoundingClientRect();
    const burst=document.createElement('div');burst.className='repo-v16-brush-burst';burst.style.left=`${r.left+r.width/2}px`;burst.style.top=`${r.top+r.height/2}px`;
    burst.innerHTML='<span class="ring"></span>';
    for(let i=0;i<8;i++){const s=document.createElement('span');s.className='spark';s.style.setProperty('--a',`${i*45}deg`);s.style.setProperty('--d',`${12+(i%3)*7}px`);burst.appendChild(s)}
    d.appendChild(burst);setTimeout(()=>burst.remove(),720);
  }

  function animateGhost(source,target,{duration=480,scale=.55,rotate=7,done}={}){
    const d=dialog();if(!d||!source||!target){done?.();return}
    const src=source.getBoundingClientRect(),dst=target.getBoundingClientRect();
    if(!src.width||!src.height||!dst.width||!dst.height||matchMedia('(prefers-reduced-motion: reduce)').matches){done?.();return}
    const image=source.matches('img')?source:source.querySelector('img');if(!image){done?.();return}
    const ghost=document.createElement('div');ghost.className='repo-v16-card-ghost';ghost.style.width=`${src.width}px`;ghost.style.height=`${src.height}px`;
    const cloned=image.cloneNode(true);cloned.removeAttribute('draggable');ghost.appendChild(cloned);d.appendChild(ghost);
    ghost.style.transform=`translate(${src.left}px,${src.top}px) scale(1) rotate(0deg)`;ghost.style.opacity='1';
    const finalScale=Math.min(1,Math.max(.28,Math.min(dst.width/src.width,dst.height/src.height)*scale));
    const x=dst.left+(dst.width-src.width*finalScale)/2,y=dst.top+(dst.height-src.height*finalScale)/2;
    requestAnimationFrame(()=>{ghost.style.transition=`transform ${duration}ms cubic-bezier(.18,.82,.2,1),opacity ${duration}ms ease`;ghost.style.transform=`translate(${x}px,${y}px) scale(${finalScale}) rotate(${rotate}deg)`;ghost.style.opacity='.84'});
    setTimeout(()=>{ghost.remove();done?.()},duration+24);
  }

  function syntheticMouse(type,target,sourceEvent){
    if(!target)return;
    const ev=new MouseEvent(type,{bubbles:true,cancelable:true,view:window,button:sourceEvent?.button||0,buttons:0,clientX:sourceEvent?.clientX||0,clientY:sourceEvent?.clientY||0});
    state.synthetic.add(ev);target.dispatchEvent(ev);
  }

  document.addEventListener('click',event=>{
    const trigger=event.target.closest?.(`${SCOPE} #binderStyleTrigger`);
    if(!trigger)return;
    // If V14 really attached its own click FX listener, its decoration marker is
    // present. In that case keep the V16 layout fix but do not double-play FX.
    if(trigger.dataset.repoStyleDecoratedV14==='true'){setTimeout(applyFrozenCoords,0);setTimeout(applyFrozenCoords,180);return;}
    trigger.classList.remove('repo-v16-brush-click');void trigger.offsetWidth;trigger.classList.add('repo-v16-brush-click');setTimeout(()=>trigger.classList.remove('repo-v16-brush-click'),170);
    softMagicClick();brushBurst(trigger);setTimeout(applyFrozenCoords,0);setTimeout(applyFrozenCoords,180);
  },true);

  // Animate right-click hide, then hand the same action back to the site's
  // existing binder handler so no collection/storage logic is duplicated here.
  document.addEventListener('contextmenu',event=>{
    if(state.synthetic.has(event))return;
    const img=event.target.closest?.(`${SCOPE} .repo-binder-slot-126 img[data-card-id]`);
    const d=dialog();if(!img||!d||publicBinder(d))return;
    const holder=d.querySelector('.repo-binder-storage-launch.repo-hidden-card-holder');if(!holder)return;
    event.preventDefault();event.stopImmediatePropagation();
    animateGhost(img,holder,{duration:500,scale:.48,rotate:8,done:()=>syntheticMouse('contextmenu',img,event)});
  },true);

  // Animate restore button before allowing the original restore handler to run.
  document.addEventListener('click',event=>{
    if(state.synthetic.has(event))return;
    const button=event.target.closest?.(`${SCOPE} .repo-binder-storage [data-action="restore"]`);
    const d=dialog();if(!button||!d||publicBinder(d))return;
    const item=button.closest('.repo-binder-storage-card');const source=item?.querySelector('img')||item;
    const target=[...d.querySelectorAll('.repo-binder-slot-126')].find(slot=>!slot.querySelector('img[data-card-id]'));
    if(!source||!target)return;
    event.preventDefault();event.stopImmediatePropagation();
    animateGhost(source,target,{duration:520,scale:.94,rotate:-6,done:()=>syntheticMouse('click',button,event)});
  },true);

  // Prevent double-click restore from bypassing the visual transition.
  document.addEventListener('dblclick',event=>{
    if(state.synthetic.has(event))return;
    const item=event.target.closest?.(`${SCOPE} .repo-binder-storage .repo-binder-storage-card`);if(!item||event.target.closest('button,input')||publicBinder())return;
    const button=item.querySelector('[data-action="restore"]');if(!button)return;
    event.preventDefault();event.stopImmediatePropagation();syntheticMouse('click',button,event);
  },true);

  const observer=new MutationObserver(()=>{
    if(prepareBinder()&&isOpenPage()&&!state.coords){calculateCoords(true);applyFrozenCoords();}
  });
  const start=()=>{
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-binder-page','open','hidden','class']});
    prepareBinder();calculateCoords(true);applyFrozenCoords();
    if(!state.raf)state.raf=requestAnimationFrame(loop);
  };
  window.addEventListener('resize',()=>{clearTimeout(state.recalcTimer);state.recalcTimer=setTimeout(()=>{state.coords=null;calculateCoords(true);applyFrozenCoords()},120)},{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
