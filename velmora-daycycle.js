/* Velmora Dragonbound — day cycle V33.27 */
(function(){
  if(window.__velmoraDayCycleV3327)return;
  window.__velmoraDayCycleV3327=true;
  const STORAGE_KEY='velmoraDragonboundDayCycle:v1';
  const GAME_MINUTE_PER_REAL_MS=1/3000;
  const OPEN_MINUTES=8*60;
  const CLOSE_MINUTES=18*60;
  const MORNING_MINUTES=7*60;
  let state=loadState();
  let timer=0,lastReal=Date.now(),realRemainderMs=0,lastRenderedMinute=-1,host=null,clockEl=null,fxEl=null,toastEl=null,styleEl=null,obs=null,mutationTimer=0;
  function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
  function loadState(){
    try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')||{};return {day:Number.isFinite(raw.day)?Math.max(1,Math.floor(raw.day)):1,minuteOfDay:Number.isFinite(raw.minuteOfDay)?clamp(Math.round(raw.minuteOfDay),0,1439):OPEN_MINUTES,updatedAt:Date.now()};}
    catch(_){return {day:1,minuteOfDay:OPEN_MINUTES,updatedAt:Date.now()};}
  }
  function saveState(){state.updatedAt=Date.now();try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){} }
  function minuteOfDay(){return state.minuteOfDay|0;}
  function phaseForMinutes(min){if(min>=360&&min<480)return 'sunrise';if(min>=480&&min<1020)return 'day';if(min>=1020&&min<1200)return 'sunset';return 'night';}
  function pad(n){return String(n).padStart(2,'0');}
  function formatTime(min){const hour24=Math.floor(min/60)%24;const minute=min%60;const suffix=hour24>=12?'PM':'AM';const hour12=((hour24+11)%12)+1;return `${hour12}:${pad(minute)} ${suffix}`;}
  function phaseLabel(phase){return phase==='sunrise'?'SUNRISE':phase==='sunset'?'SUNSET':phase==='night'?'NIGHT':'DAY';}
  function isDragonboundVisible(){const overlay=document.getElementById('dragonboundOverlay');if(!overlay)return false;const style=getComputedStyle(overlay);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity||1)<0.02)return false;const rect=overlay.getBoundingClientRect();return rect.width>50&&rect.height>50;}
  function isBedroomOpen(){return document.body.classList.contains('velmora-bedroom-open');}
  function isElementActuallyVisible(el){
    if(!el)return false;
    const style=getComputedStyle(el);
    if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity||1)<.02)return false;
    const r=el.getBoundingClientRect();
    return r.width>2&&r.height>2&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth;
  }
  function isTitleMenuVisible(){
    const overlay=document.getElementById('dragonboundOverlay');
    if(!overlay)return false;
    let hits=0;
    overlay.querySelectorAll('button,[role="button"],a').forEach(el=>{
      if(!isElementActuallyVisible(el))return;
      const label=((el.textContent||'')+' '+(el.getAttribute?.('aria-label')||'')).replace(/\s+/g,' ').trim().toLowerCase();
      if(label==='new game'||label==='load game'||label==='rules'||label.includes('new game')||label.includes('load game'))hits++;
    });
    return hits>=2;
  }
  function isPlayableDragonboundView(){return isDragonboundVisible()&&!isTitleMenuVisible();}
  function ensureStyle(){
    if(styleEl?.isConnected)return;styleEl=document.createElement('style');styleEl.id='velmoraDayCycleStyles';styleEl.textContent=`
      .velmora-daycycle-fx{position:absolute;inset:0;pointer-events:none;z-index:1;mix-blend-mode:multiply;opacity:.55;transition:opacity .55s ease,background .55s ease,box-shadow .55s ease}
      .velmora-daycycle-fx::before,.velmora-daycycle-fx::after{content:'';position:absolute;inset:0;pointer-events:none;transition:opacity .55s ease,background .55s ease,filter .55s ease}
      .velmora-daycycle-fx::after{mix-blend-mode:screen;opacity:.18}
      #dragonboundOverlay[data-velmora-phase='sunrise'] .velmora-daycycle-fx{background:linear-gradient(180deg,rgba(29,47,72,.26) 0%,rgba(181,127,82,.18) 52%,rgba(255,220,167,.08) 100%);opacity:.5}
      #dragonboundOverlay[data-velmora-phase='sunrise'] .velmora-daycycle-fx::after{background:radial-gradient(circle at 72% 28%,rgba(255,218,156,.45),rgba(255,218,156,0) 28%),linear-gradient(180deg,rgba(255,193,119,.12),rgba(255,255,255,0));opacity:.34}
      #dragonboundOverlay[data-velmora-phase='day'] .velmora-daycycle-fx{background:linear-gradient(180deg,rgba(82,131,177,.06),rgba(255,255,255,0));opacity:.26}
      #dragonboundOverlay[data-velmora-phase='day'] .velmora-daycycle-fx::after{background:radial-gradient(circle at 76% 20%,rgba(255,248,224,.18),rgba(255,248,224,0) 24%);opacity:.2}
      #dragonboundOverlay[data-velmora-phase='sunset'] .velmora-daycycle-fx{background:linear-gradient(180deg,rgba(62,44,94,.22) 0%,rgba(186,92,48,.22) 58%,rgba(255,207,150,.10) 100%);opacity:.58}
      #dragonboundOverlay[data-velmora-phase='sunset'] .velmora-daycycle-fx::after{background:radial-gradient(circle at 76% 30%,rgba(255,195,136,.34),rgba(255,195,136,0) 28%),linear-gradient(180deg,rgba(255,171,105,.11),rgba(255,255,255,0));opacity:.32}
      #dragonboundOverlay[data-velmora-phase='night'] .velmora-daycycle-fx{background:linear-gradient(180deg,rgba(7,17,39,.56) 0%,rgba(18,35,68,.38) 55%,rgba(21,31,46,.24) 100%);opacity:.74;box-shadow:inset 0 0 120px rgba(6,10,22,.42)}
      #dragonboundOverlay[data-velmora-phase='night'] .velmora-daycycle-fx::before{background:radial-gradient(circle at 80% 17%,rgba(183,207,255,.12),rgba(183,207,255,0) 18%),radial-gradient(circle at 18% 20%,rgba(145,173,232,.06),rgba(145,173,232,0) 16%);opacity:1}
      #dragonboundOverlay[data-velmora-phase='night'] .velmora-daycycle-fx::after{background:linear-gradient(180deg,rgba(148,172,214,.08),rgba(255,255,255,0));opacity:.18}
      .velmora-daycycle-clock{position:absolute;right:18px;bottom:18px;z-index:30;pointer-events:none;display:flex;flex-direction:column;align-items:flex-end;gap:2px;color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.62),0 1px 2px rgba(0,0,0,.72);font-family:'Trebuchet MS',Arial,sans-serif;opacity:.96;transition:opacity .25s ease}
      .velmora-daycycle-clock .time{font-size:28px;font-weight:700;letter-spacing:.6px;line-height:1}
      .velmora-daycycle-clock .meta{font-size:11px;font-weight:700;letter-spacing:1.25px;opacity:.86;text-transform:uppercase}
      .velmora-daycycle-toast{position:absolute;left:50%;bottom:24px;transform:translateX(-50%) translateY(16px);z-index:35;max-width:min(88vw,540px);padding:13px 18px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(8,16,24,.84);backdrop-filter:blur(10px);color:#f7f9ff;font:700 15px/1.3 'Trebuchet MS',Arial,sans-serif;box-shadow:0 12px 34px rgba(0,0,0,.34);opacity:0;pointer-events:none;transition:opacity .24s ease,transform .24s ease}
      .velmora-daycycle-toast.is-visible{opacity:1;transform:translateX(-50%) translateY(0)}
      .velmora-daycycle-closed-badge{display:inline-flex;align-items:center;justify-content:center;margin-left:8px;padding:3px 8px;border-radius:999px;background:rgba(36,10,10,.88);border:1px solid rgba(255,180,180,.24);color:#ffe4e4;font:800 10px/1 Arial,sans-serif;letter-spacing:.9px;text-transform:uppercase;box-shadow:0 6px 14px rgba(0,0,0,.18)}
      [data-velmora-closed='1']{filter:saturate(.84)}
      [data-velmora-closed='1'][aria-disabled='true']{cursor:not-allowed}
      @media (max-width:760px){.velmora-daycycle-clock{right:12px;bottom:12px}.velmora-daycycle-clock .time{font-size:21px}.velmora-daycycle-clock .meta{font-size:10px}.velmora-daycycle-toast{max-width:92vw;padding:12px 14px;font-size:13px}}
    `;document.head.appendChild(styleEl);
  }
  function ensureHost(){ensureStyle();const overlay=document.getElementById('dragonboundOverlay');if(!overlay)return null;host=overlay;fxEl=host.querySelector('.velmora-daycycle-fx');if(!fxEl){fxEl=document.createElement('div');fxEl.className='velmora-daycycle-fx';host.insertBefore(fxEl,host.firstChild);}clockEl=host.querySelector('.velmora-daycycle-clock');if(!clockEl){clockEl=document.createElement('div');clockEl.className='velmora-daycycle-clock';clockEl.innerHTML='<div class="time">8:00 AM</div><div class="meta">DAY 1 · DAY</div>';host.appendChild(clockEl);}toastEl=host.querySelector('.velmora-daycycle-toast');if(!toastEl){toastEl=document.createElement('div');toastEl.className='velmora-daycycle-toast';host.appendChild(toastEl);}return host;}
  function showToast(message){const parent=ensureHost();if(!parent||!toastEl)return;toastEl.textContent=String(message||'');toastEl.classList.add('is-visible');clearTimeout(showToast._timer);showToast._timer=setTimeout(()=>toastEl&&toastEl.classList.remove('is-visible'),2400);}
  function render(force=false){
    const overlay=ensureHost();if(!overlay||!clockEl)return;
    const minute=minuteOfDay();
    const phase=phaseForMinutes(minute);
    if(force||lastRenderedMinute!==minute){
      lastRenderedMinute=minute;
      overlay.dataset.velmoraPhase=phase;
      clockEl.querySelector('.time').textContent=formatTime(minute);
      clockEl.querySelector('.meta').textContent=`DAY ${state.day} · ${phaseLabel(phase)}`;
      updateClosedDecorations();
    }
    const playable=isPlayableDragonboundView();
    const wanted=playable?'0.96':'0';
    if(clockEl.style.opacity!==wanted)clockEl.style.opacity=wanted;
    if(fxEl)fxEl.style.display=playable?'block':'none';
  }
  function advanceRealMs(realMs){
    if(realMs<=0)return false;
    realRemainderMs+=realMs;
    const wholeMinutes=Math.floor(realRemainderMs/3000);
    if(wholeMinutes<=0)return false;
    realRemainderMs-=wholeMinutes*3000;
    state.minuteOfDay+=wholeMinutes;
    while(state.minuteOfDay>=1440){state.minuteOfDay-=1440;state.day+=1;}
    saveState();maybeBroadcastTimeChange();return true;
  }
  function tick(){
    const nowReal=Date.now();
    const delta=Math.max(0,Math.min(2000,nowReal-lastReal));
    lastReal=nowReal;
    if(isPlayableDragonboundView()&&document.visibilityState!=='hidden')advanceRealMs(delta);
    render(false);
  }
  function start(){if(timer)return;lastReal=Date.now();timer=setInterval(tick,250);tick();}
  function now(){return {day:state.day,minuteOfDay:minuteOfDay(),formatted:formatTime(minuteOfDay()),phase:phaseForMinutes(minuteOfDay())};}
  function isPlaceOpen(){const min=minuteOfDay();return min>=OPEN_MINUTES&&min<CLOSE_MINUTES;}
  function canSleepNow(){const min=minuteOfDay();return min>=CLOSE_MINUTES||min<MORNING_MINUTES;}
  function sleepToMorning(){if(minuteOfDay()>=MORNING_MINUTES)state.day+=1;state.minuteOfDay=MORNING_MINUTES;saveState();maybeBroadcastTimeChange();render(true);return now();}
  function getInteractiveLabel(el){if(!el)return '';const attrs=[el.getAttribute?.('aria-label'),el.getAttribute?.('title'),el.dataset?.locationName,el.dataset?.travelName,el.dataset?.name];return (attrs.filter(Boolean).join(' ')+' '+(el.textContent||'')).replace(/\s+/g,' ').trim().toLowerCase();}
  function closureRuleForLabel(label){if(/adoption|bonnie/.test(label))return {name:'Adoption Centre'};if(/estate|agents|housing district|house shop|starter home/.test(label))return {name:'Estate Agents'};if(/racing|racecourse|racetrack|track/.test(label))return {name:'Racing Grounds'};return null;}
  function updateClosedDecorations(){const overlay=document.getElementById('dragonboundOverlay');if(!overlay)return;overlay.querySelectorAll('button,a,[role="button"],.dragonbound-travel-location,.dragonbound-travel-node,.dragonbound-location-card,.dragonbound-menu-card').forEach(el=>{const rule=closureRuleForLabel(getInteractiveLabel(el));const isClosed=!!rule&&!isPlaceOpen();if(isClosed){el.dataset.velmoraClosed='1';el.setAttribute('aria-disabled','true');let badge=el.querySelector('.velmora-daycycle-closed-badge');if(!badge){badge=document.createElement('span');badge.className='velmora-daycycle-closed-badge';badge.textContent='Closed';el.appendChild(badge);}}else{delete el.dataset.velmoraClosed;if(el.getAttribute('aria-disabled')==='true')el.removeAttribute('aria-disabled');el.querySelectorAll('.velmora-daycycle-closed-badge').forEach(b=>b.remove());}});}
  function handleClick(event){if(!isDragonboundVisible()||isBedroomOpen())return;const target=event.target?.closest?.('button,a,[role="button"],.dragonbound-travel-location,.dragonbound-travel-node,.dragonbound-location-card,.dragonbound-menu-card');if(!target)return;const rule=closureRuleForLabel(getInteractiveLabel(target));if(!rule||isPlaceOpen())return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();showToast(`${rule.name} is closed right now. Open daily from 8:00 AM to 6:00 PM.`);}
  function observe(){
    if(obs)return;
    obs=new MutationObserver(()=>{
      clearTimeout(mutationTimer);
      mutationTimer=setTimeout(()=>{ensureHost();render(true);},120);
    });
    // Child-list only. Observing class/style caused a self-triggering render loop in V33.25.
    obs.observe(document.documentElement,{subtree:true,childList:true});
  }
  document.addEventListener('click',handleClick,true);
  document.addEventListener('visibilitychange',()=>{lastReal=Date.now();});
  window.addEventListener('resize',()=>render(true),{passive:true});
  window.addEventListener('dragonbound:home-ready',()=>{ensureHost();render(true);});
  observe();start();
  window.VelmoraDayCycle={now,isPlaceOpen,canSleepNow,sleepToMorning,showToast,phaseForMinutes,formatTime,openHour:8,closeHour:18,morningHour:7};
})();
