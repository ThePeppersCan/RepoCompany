/* Velmora Dragonbound — day cycle V33.31 style + persistence hotfix */
(function(){
  if(window.__velmoraDayCycleV3331)return;
  window.__velmoraDayCycleV3331=true;

  const REAL_MS_PER_GAME_MINUTE=3000;
  const MORNING_MINUTES=7*60;
  const CLOSING_SOON_MINUTES=17*60+30;
  const BUSINESS_HOURS={
    adoption:{key:'adoption',displayName:"Bonnie's Adoption Centre",open:8*60,close:18*60,tags:['adoption','bonnie','egg']},
    estate:{key:'estate',displayName:'Velmora Hearth & Key',open:8*60,close:18*60,tags:['estate','hearth & key','mira','housing district','starter home','property board']},
    racing:{key:'racing',displayName:'Dragon Racing Grounds',open:10*60,close:22*60,tags:['racing','racecourse','racetrack','track']}
  };
  const PRESETS={
    night:{top:'rgba(7,17,39,.56)',bottom:'rgba(18,35,68,.38)',glow:'rgba(183,207,255,.12)',opacity:.72,bedTop:'rgba(10,18,35,.18)',bedBottom:'rgba(24,36,58,.11)',bedGlow:'rgba(255,194,134,.10)',bedOpacity:.46},
    sunrise:{top:'rgba(29,47,72,.23)',bottom:'rgba(181,127,82,.16)',glow:'rgba(255,218,156,.31)',opacity:.48,bedTop:'rgba(43,54,79,.09)',bedBottom:'rgba(236,178,132,.07)',bedGlow:'rgba(255,217,170,.09)',bedOpacity:.24},
    day:{top:'rgba(82,131,177,.045)',bottom:'rgba(255,255,255,0)',glow:'rgba(255,248,224,.14)',opacity:.18,bedTop:'rgba(255,255,255,0)',bedBottom:'rgba(255,255,255,0)',bedGlow:'rgba(255,248,224,.04)',bedOpacity:.08},
    sunset:{top:'rgba(62,44,94,.20)',bottom:'rgba(186,92,48,.19)',glow:'rgba(255,195,136,.28)',opacity:.53,bedTop:'rgba(74,57,98,.08)',bedBottom:'rgba(219,150,99,.07)',bedGlow:'rgba(255,198,145,.09)',bedOpacity:.24}
  };

  let activeUser=readUsername();
  let state=loadState();
  let realRemainderMs=0,lastReal=Date.now(),lastMinute=-1,lastScene='none';
  let timer=0,clockEl=null,fxEl=null,toastEl=null,bedFxEl=null,stylesReady=false,lastUserCheck=0;

  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
  function readUsername(){
    try{
      if(typeof character!=='undefined' && character) return String(character.username||character.displayName||'guest').trim()||'guest';
      return String(window.character?.username||window.character?.displayName||'guest').trim()||'guest';
    }catch(_){return 'guest';}
  }
  function storageKey(){return `velmoraDragonboundDayCycle:v2:${String(activeUser||'guest').toLowerCase()}`;}
  function loadState(){
    try{
      const raw=JSON.parse(localStorage.getItem(storageKey())||'null')||{};
      return {
        day:Number.isFinite(raw.day)?Math.max(1,Math.floor(raw.day)):1,
        minuteOfDay:Number.isFinite(raw.minuteOfDay)?clamp(Math.round(raw.minuteOfDay),0,1439):8*60,
        lastWarningDay:raw.lastWarningDay&&typeof raw.lastWarningDay==='object'?raw.lastWarningDay:{},
        updatedAt:Number.isFinite(raw.updatedAt)?raw.updatedAt:Date.now()
      };
    }catch(_){return {day:1,minuteOfDay:8*60,lastWarningDay:{},updatedAt:Date.now()};}
  }
  function saveState(markTime=true){
    if(markTime) state.updatedAt = Date.now();
    try{localStorage.setItem(storageKey(),JSON.stringify(state));}catch(_){}
  }
  function applyElapsedProgress(elapsedMs){
    const safeMs=Math.max(0, Math.min(1000*60*60*24*14, Number(elapsedMs)||0));
    if(!safeMs) return false;
    realRemainderMs += safeMs;
    const mins=Math.floor(realRemainderMs/REAL_MS_PER_GAME_MINUTE);
    if(mins<=0) return false;
    realRemainderMs -= mins*REAL_MS_PER_GAME_MINUTE;
    state.minuteOfDay += mins;
    while(state.minuteOfDay>=1440){state.minuteOfDay-=1440;state.day+=1;state.lastWarningDay={};}
    state.updatedAt = Date.now();
    saveState(false);
    return true;
  }
  function maybeRefreshUser(nowMs){
    if(nowMs-lastUserCheck<5000)return;lastUserCheck=nowMs;
    const next=readUsername();if(next===activeUser)return;
    activeUser=next;state=loadState();realRemainderMs=0;
    applyElapsedProgress(Date.now() - (state.updatedAt||Date.now()));
    lastMinute=-1;dispatchTimeChange();
  }
  function formatTime(min){const h24=Math.floor(min/60)%24,m=min%60,suffix=h24>=12?'PM':'AM',h12=((h24+11)%12)+1;return `${h12}:${String(m).padStart(2,'0')} ${suffix}`;}
  function phaseForMinutes(min){if(min>=300&&min<480)return 'sunrise';if(min>=480&&min<1020)return 'day';if(min>=1020&&min<1200)return 'sunset';return 'night';}
  function phaseLabel(p){return p==='sunrise'?'SUNRISE':p==='sunset'?'SUNSET':p==='night'?'NIGHT':'DAY';}
  function now(){const min=state.minuteOfDay|0;return {day:state.day,minuteOfDay:min,formatted:formatTime(min),phase:phaseForMinutes(min)};}

  // Cheap state tests only. Do not scan the whole Dragonbound DOM every tick.
  function dragonboundOverlay(){return document.getElementById('dragonboundOverlay');}
  function isDragonboundOpen(){const overlay=dragonboundOverlay();return !!overlay?.classList.contains('is-open');}
  function isPlayableDragonboundView(){const overlay=dragonboundOverlay();if(!overlay?.classList.contains('is-open'))return false;return !!overlay.querySelector('.dragonbound-new-game-stage.is-active');}
  function isBedroomOpen(){return document.body.classList.contains('velmora-bedroom-open');}
  function sceneKey(){if(isBedroomOpen())return 'bedroom';if(isPlayableDragonboundView())return 'dragonbound';return 'none';}

  function ensureStyles(){
    if(stylesReady)return;stylesReady=true;
    const style=document.createElement('style');style.id='velmoraDayCycleStylesV3330';style.textContent=`
      .velmora-daycycle-fx{position:absolute;inset:0;pointer-events:none;z-index:1;opacity:0;transition:opacity .6s ease,background .6s ease}
      .velmora-daycycle-fx::before,.velmora-daycycle-fx::after,.velmora-bedroom-daycycle-fx::before,.velmora-bedroom-daycycle-fx::after{content:'';position:absolute;inset:0;pointer-events:none}
      .velmora-daycycle-fx::before{background:radial-gradient(circle at 78% 22%,var(--velmora-glow),rgba(255,255,255,0) 28%)}
      .velmora-daycycle-fx::after{background:linear-gradient(180deg,var(--velmora-top),var(--velmora-bottom));mix-blend-mode:multiply}
      .velmora-daycycle-clock{position:absolute;right:18px;bottom:18px;z-index:30;pointer-events:none;display:flex;flex-direction:column;align-items:flex-end;gap:2px;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.62),0 1px 2px rgba(0,0,0,.72);font-family:'Trebuchet MS',Arial,sans-serif;opacity:0;transition:opacity .25s ease}
      .velmora-daycycle-clock .time{font-size:28px;font-weight:700;letter-spacing:.6px;line-height:1}.velmora-daycycle-clock .meta{font-size:11px;font-weight:700;letter-spacing:1.25px;opacity:.82;text-transform:uppercase}
      .velmora-daycycle-toast{position:absolute;left:50%;bottom:24px;transform:translateX(-50%) translateY(12px);z-index:35;max-width:min(88vw,560px);padding:12px 17px;border-radius:15px;border:1px solid rgba(255,255,255,.13);background:rgba(8,16,24,.86);color:#f7f9ff;font:700 14px/1.35 'Trebuchet MS',Arial,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.32);opacity:0;pointer-events:none;transition:opacity .22s ease,transform .22s ease}.velmora-daycycle-toast.is-visible{opacity:1;transform:translateX(-50%) translateY(0)}
      .velmora-bedroom-daycycle-fx{position:absolute;inset:0;pointer-events:none;z-index:2;opacity:0;transition:opacity .6s ease}.velmora-bedroom-daycycle-fx::before{background:radial-gradient(circle at 72% 24%,var(--velmora-bed-glow),rgba(255,255,255,0) 24%)}.velmora-bedroom-daycycle-fx::after{background:linear-gradient(180deg,var(--velmora-bed-top),var(--velmora-bed-bottom));mix-blend-mode:multiply}
      [data-velmora-closed='1']{filter:saturate(.84)}
      @media(max-width:760px){.velmora-daycycle-clock{right:12px;bottom:12px}.velmora-daycycle-clock .time{font-size:21px}.velmora-daycycle-clock .meta{font-size:10px}}
    `;document.head.appendChild(style);
  }
  function ensureDragonboundUi(){
    const overlay=dragonboundOverlay();if(!overlay)return null;ensureStyles();
    if(!fxEl?.isConnected){fxEl=overlay.querySelector('.velmora-daycycle-fx')||document.createElement('div');fxEl.className='velmora-daycycle-fx';if(!fxEl.isConnected)overlay.insertBefore(fxEl,overlay.firstChild);}
    if(!clockEl?.isConnected){clockEl=overlay.querySelector('.velmora-daycycle-clock')||document.createElement('div');clockEl.className='velmora-daycycle-clock';clockEl.innerHTML='<div class="time">8:00 AM</div><div class="meta">DAY 1</div>';if(!clockEl.isConnected)overlay.appendChild(clockEl);}
    if(!toastEl?.isConnected){toastEl=overlay.querySelector('.velmora-daycycle-toast')||document.createElement('div');toastEl.className='velmora-daycycle-toast';if(!toastEl.isConnected)overlay.appendChild(toastEl);}
    return overlay;
  }
  function ensureBedroomFx(){
    if(!isBedroomOpen())return null;ensureStyles();
    const stage=document.querySelector('.velmora-bedroom-overlay.is-visible [data-bedroom-stage]');if(!stage)return null;
    if(!bedFxEl?.isConnected){bedFxEl=stage.querySelector('.velmora-bedroom-daycycle-fx')||document.createElement('div');bedFxEl.className='velmora-bedroom-daycycle-fx';if(!bedFxEl.isConnected)stage.appendChild(bedFxEl);}
    return stage;
  }
  function lightingPreset(min){return PRESETS[phaseForMinutes(min)]||PRESETS.day;}
  function renderLighting(force=false){
    const scene=sceneKey(), info=now(), preset=lightingPreset(info.minuteOfDay);
    if(scene==='dragonbound'){
      const overlay=ensureDragonboundUi();if(overlay){
        overlay.dataset.velmoraPhase=info.phase;overlay.style.setProperty('--velmora-top',preset.top);overlay.style.setProperty('--velmora-bottom',preset.bottom);overlay.style.setProperty('--velmora-glow',preset.glow);
        if(fxEl){fxEl.style.display='block';fxEl.style.opacity=String(preset.opacity);}if(clockEl){clockEl.querySelector('.time').textContent=info.formatted;clockEl.querySelector('.meta').textContent=`DAY ${info.day} · ${phaseLabel(info.phase)}`;clockEl.style.opacity='0.96';}
      }
    }else{if(fxEl)fxEl.style.display='none';if(clockEl)clockEl.style.opacity='0';}
    if(scene==='bedroom'){
      const stage=ensureBedroomFx();if(stage&&bedFxEl){stage.style.setProperty('--velmora-bed-top',preset.bedTop);stage.style.setProperty('--velmora-bed-bottom',preset.bedBottom);stage.style.setProperty('--velmora-bed-glow',preset.bedGlow);bedFxEl.style.display='block';bedFxEl.style.opacity=String(preset.bedOpacity);}
    }else if(bedFxEl){bedFxEl.style.display='none';}
    if(force||scene!==lastScene)updateClosedDecorations();
    lastScene=scene;
  }
  function dispatchTimeChange(){try{document.dispatchEvent(new CustomEvent('velmora:time-changed',{detail:now()}));}catch(_){} }
  function showToast(message,duration=2600){const overlay=ensureDragonboundUi();if(!overlay||!toastEl)return;toastEl.textContent=String(message||'');toastEl.classList.add('is-visible');clearTimeout(showToast._timer);showToast._timer=setTimeout(()=>toastEl?.classList.remove('is-visible'),duration);}
  function keyFromAny(input){const txt=String(input||'').toLowerCase();for(const item of Object.values(BUSINESS_HOURS)){if(txt===item.key||item.tags.some(tag=>txt.includes(tag)))return item.key;}return null;}
  function getBusinessState(key,min=state.minuteOfDay){const k=keyFromAny(key),info=BUSINESS_HOURS[k];if(!info)return {known:false,isOpen:true};const isOpen=min>=info.open&&min<info.close;return {known:true,key:k,displayName:info.displayName,isOpen,closingSoon:min>=CLOSING_SOON_MINUTES&&min<info.close,openingTime:formatTime(info.open),closingTime:formatTime(info.close)};}
  function isBusinessOpen(key,min=state.minuteOfDay){return getBusinessState(key,min).isOpen;}
  function getTargetLabel(el){return [el?.dataset?.dragonboundTravel,el?.dataset?.destinationKey,el?.getAttribute?.('aria-label'),el?.getAttribute?.('title'),el?.textContent].filter(Boolean).join(' ').replace(/\s+/g,' ').trim().toLowerCase();}
  function updateClosedDecorations(){
    const overlay=dragonboundOverlay();if(!overlay||!isDragonboundOpen())return;
    overlay.querySelectorAll('[data-dragonbound-travel],.dragonbound-adoption-door-hotspot,.dragonbound-estate-door-hotspot,.velmora-travel-map-hotspot').forEach(el=>{const key=keyFromAny(getTargetLabel(el));if(!key)return;const closed=!isBusinessOpen(key);if(closed){el.dataset.velmoraClosed='1';el.setAttribute('aria-disabled','true');}else{el.removeAttribute('data-velmora-closed');if(el.getAttribute('aria-disabled')==='true')el.removeAttribute('aria-disabled');}});
  }
  function canSleepNow(){const min=state.minuteOfDay;return min>=18*60||min<MORNING_MINUTES;}
  function sleepToMorning(){if(state.minuteOfDay>=MORNING_MINUTES)state.day+=1;state.minuteOfDay=MORNING_MINUTES;state.lastWarningDay={};saveState();lastMinute=-1;dispatchTimeChange();renderLighting(true);return now();}
  function advance(realMs){return applyElapsedProgress(realMs)?(dispatchTimeChange(),true):false;}
  function tick(){
    const stamp=Date.now();maybeRefreshUser(stamp);const delta=Math.max(0,Math.min(2500,stamp-lastReal));lastReal=stamp;
    const scene=sceneKey();if(document.visibilityState!=='hidden')advance(delta);
    if(lastMinute!==state.minuteOfDay||scene!==lastScene){lastMinute=state.minuteOfDay;renderLighting(true);}
  }
  function setTime(value){const m=String(value||'').match(/^(\d{1,2}):(\d{2})$/);if(!m)return false;state.minuteOfDay=clamp(+m[1],0,23)*60+clamp(+m[2],0,59);saveState();lastMinute=-1;dispatchTimeChange();tick();return true;}
  function nextDay(){state.day+=1;state.lastWarningDay={};saveState();lastMinute=-1;dispatchTimeChange();tick();return now();}
  function inspect(){return {user:activeUser,...now(),businessHours:JSON.parse(JSON.stringify(BUSINESS_HOURS))};}

  document.addEventListener('click',event=>{
    const target=event.target?.closest?.('[data-dragonbound-travel],.dragonbound-adoption-door-hotspot,.dragonbound-estate-door-hotspot,.velmora-travel-map-hotspot');if(!target)return;
    const label=getTargetLabel(target),key=keyFromAny(label);if(!key)return;
    const entryIntent=!!target.dataset?.dragonboundTravel||!!target.dataset?.destinationKey||/enter|travel|visit/.test(label);
    if(!entryIntent)return;
    const info=getBusinessState(key);if(!info.isOpen){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();showToast(`${info.displayName} is closed for the evening. Opens at ${info.openingTime}.`,2800);return;}
    if(info.closingSoon && state.lastWarningDay?.[key]!==state.day){state.lastWarningDay[key]=state.day;saveState();showToast(`${info.displayName} will be closing soon.`,2200);}
  },true);
  document.addEventListener('visibilitychange',()=>{lastReal=Date.now(); if(document.visibilityState==='visible'){applyElapsedProgress(Date.now() - (state.updatedAt||Date.now())); lastMinute=-1; renderLighting(true); dispatchTimeChange();}});
  window.addEventListener('dragonbound:home-ready',()=>{lastScene='';tick();});
  document.addEventListener('velmora:travel-map-opened',()=>{updateClosedDecorations();});
  applyElapsedProgress(Date.now() - (state.updatedAt||Date.now()));
  timer=setInterval(tick,1000);tick();
  window.VelmoraDayCycle={now,formatTime,phaseForMinutes,phaseLabel,businessHours:JSON.parse(JSON.stringify(BUSINESS_HOURS)),isBusinessOpen,getBusinessState,canSleepNow,sleepToMorning,showToast,setTime,nextDay,openHour:8,closeHour:18,morningHour:7};
  window.VelmoraDayCycleDebug={setTime,nextDay,inspect};
})();
