/* Velmora Dragonbound V33.00 — Command Menu Hotfix & Premium Training UI */
(()=>{
  'use strict';

  const VERSION='v33-01-command-ux-hotfix-20260822';
  const COMMAND_ORDER=['comeHere','sit','stay','goToBed','eat','bathTime','fetch','dropIt','goToFurniture','roar','tinyFlame','flyToPerch'];
  const STAGES=[
    {name:'Unknown',min:0,max:0},
    {name:'Learning',min:.01,max:24.999},
    {name:'Familiar',min:25,max:49.999},
    {name:'Reliable',min:50,max:79.999},
    {name:'Mastered',min:80,max:100}
  ];
  const RECOVERY_MS={Unknown:8*60*1000,Learning:10*60*1000,Familiar:15*60*1000,Reliable:22*60*1000,Mastered:30*60*1000};
  const DEF={
    comeHere:{label:'Come Here',icon:'⌁',summary:'Ask your dragon to come to you.',skills:['confidence'],basic:true},
    sit:{label:'Sit',icon:'◒',summary:'Ask for a calm sit nearby.',skills:['intelligence'],basic:true},
    stay:{label:'Stay',icon:'⌛',summary:'Ask your dragon to remain in one safe spot.',skills:['intelligence','confidence'],bond:15,skill:{intelligence:3}},
    goToBed:{label:'Go to Bed',icon:'☾',summary:'Send them to a suitable bed or rest spot.',skills:[],basic:true,furniture:'sleep'},
    eat:{label:'Eat',icon:'♨',summary:'Guide them to their feeding furniture.',skills:[],basic:true,furniture:'feeding'},
    bathTime:{label:'Bath Time',icon:'≈',summary:'Guide them to a bath, sand bath or grooming spot.',skills:['confidence'],basic:true,furniture:'bath'},
    fetch:{label:'Fetch',icon:'◆',summary:'Retrieve a small carryable toy and bring it back.',skills:['intelligence','agility'],bond:20,skill:{intelligence:5},furniture:'carryable'},
    dropIt:{label:'Drop It',icon:'↓',summary:'Ask them to release what they are carrying.',skills:['intelligence'],prerequisite:'fetch'},
    goToFurniture:{label:'Go to Furniture',icon:'⌂',summary:'Choose a placed furnishing for your dragon to use.',skills:['intelligence'],bond:10,furniture:'any'},
    roar:{label:'Roar',icon:'◖',summary:'Practise a confident little baby roar.',skills:['confidence'],skill:{confidence:5}},
    tinyFlame:{label:'Tiny Flame',icon:'♨',summary:'Practise one small, controlled flame.',skills:['fireControl'],bond:20,skill:{fireControl:10}},
    flyToPerch:{label:'Fly to Perch',icon:'⌃',summary:'Take a safe indoor flight and land at a perch.',skills:['flying','confidence'],bond:20,skill:{flying:10,confidence:8},furniture:'perch'}
  };

  const clamp=(v,a=0,b=100)=>Math.min(b,Math.max(a,Number(v)||0));
  const now=()=>Date.now();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtMs=ms=>{ms=Math.max(0,Number(ms)||0);if(ms<=0)return'Ready to practise';const min=Math.ceil(ms/60000);return min<60?`Learning recovery · ${min}m`:`Learning recovery · ${Math.ceil(min/60)}h`;};
  const currentAccountSlug=()=>String(window.currentAccount?.username||window.character?.username||window.character?.name||localStorage.getItem('repoAccountSlug')||'').toLowerCase();

  function stageFor(xp){xp=clamp(xp);if(xp>=80)return STAGES[4];if(xp>=50)return STAGES[3];if(xp>=25)return STAGES[2];if(xp>0)return STAGES[1];return STAGES[0];}
  function stageProgress(xp){xp=clamp(xp);const s=stageFor(xp);if(s.name==='Mastered')return 100;if(s.name==='Unknown')return 0;return clamp(((xp-s.min)/(s.max-s.min+.001))*100);}
  function traitSet(a){return new Set([...(a?.signatureTraits||[]),...(a?.assignedTraits||[]),...(a?.discoveredTraits||[])]);}
  function care(a){try{return a?.careStats?.()||{};}catch(_){return {};}}
  function floorFurniture(a){try{return (window.dragonboundFurnitureInteractionProvider?.()||[]).filter(x=>x&&x.roomId===a?.floorId);}catch(_){return [];}}
  function kindOf(a,m){try{return a?.furnitureKind?.(m)||'';}catch(_){return '';}}
  function classOf(a,m){try{return a?.physicalClassification?.(m,kindOf(a,m))||{};}catch(_){return {};}}
  function sourceSkills(a,m){try{return a?.furnitureSkillSources?.(m,kindOf(a,m))||[];}catch(_){return [];}}
  function isPerch(a,m){const k=kindOf(a,m),tags=new Set(m?.tags||[]),text=`${m?.name||''} ${m?.itemId||''}`.toLowerCase();return k==='perch'||tags.has('flight-practice')||/perch|landing|flight post|flying post|launch post|launch perch/.test(text);}
  function matchesFurniture(a,m,type){const k=kindOf(a,m),c=classOf(a,m);if(type==='any')return true;if(type==='sleep')return k==='sleep'||k==='rest'||c.sleep;if(type==='feeding')return k==='eat'||k==='drink'||c.feeding;if(type==='bath')return k==='wash'||k==='sandbath'||k==='groom'||c.bath;if(type==='carryable')return !!c.carryable;if(type==='perch')return isPerch(a,m);return false;}
  function furnitureFor(a,type){return floorFurniture(a).filter(m=>matchesFurniture(a,m,type));}
  function skillLevel(a,key){return Number(a?.skills?.[key]?.level||0);}

  function ensureState(a){
    if(!a?.memory)return null;
    let root=a.memory.commands;
    if(!root||typeof root!=='object'||Array.isArray(root))root={};
    root.version=2;root.entries=root.entries&&typeof root.entries==='object'?root.entries:{};root.recent=Array.isArray(root.recent)?root.recent.slice(-12):[];root.hourlyAttempts=Array.isArray(root.hourlyAttempts)?root.hourlyAttempts.filter(t=>now()-Number(t)<60*60*1000).slice(-20):[];root.firsts=root.firsts&&typeof root.firsts==='object'?root.firsts:{};root.seededAt=Number(root.seededAt||0);
    for(const key of COMMAND_ORDER){const old=root.entries[key]&&typeof root.entries[key]==='object'?root.entries[key]:{};root.entries[key]={xp:clamp(old.xp),attempts:Math.max(0,Number(old.attempts)||0),successes:Math.max(0,Number(old.successes)||0),lastAttemptAt:Number(old.lastAttemptAt||0),lastXpAt:Number(old.lastXpAt||0),xpReadyAt:Number(old.xpReadyAt||0),lastResult:String(old.lastResult||'').slice(0,80),unlockedAt:Number(old.unlockedAt||0),masteredAt:Number(old.masteredAt||0)};}
    if(!root.seededAt){
      const obs=a.memory.observationCounters||{};
      if(Number(a.bond||0)>=55)root.entries.comeHere.xp=Math.min(14,4+(Number(a.bond||0)-55)*.22);
      root.entries.goToBed.xp=Math.min(18,(Number(obs.bedSleeps||0)+Number(obs.furnitureRests||0))*2);
      root.entries.fetch.xp=Math.min(15,Number(obs.objectsCarried||0)*2);
      root.entries.tinyFlame.xp=Math.min(12,(Number(obs.firePracticeUses||0)||0)*1.5);
      root.seededAt=now();
    }
    a.memory.commands=root;a.behaviourDirty=true;return root;
  }

  function availability(a,key){
    const def=DEF[key],root=ensureState(a),entry=root?.entries?.[key];if(!def||!a||!entry)return{ok:false,reason:'Not available yet.'};
    if(def.prerequisite){const p=root.entries[def.prerequisite];if(!p||p.xp<=0)return{ok:false,reason:`Learn ${DEF[def.prerequisite].label} first.`};}
    if(Number(def.bond||0)>Number(a.bond||0))return{ok:false,reason:`Bond ${def.bond} required.`};
    for(const [skill,min] of Object.entries(def.skill||{})){if(skillLevel(a,skill)<Number(min))return{ok:false,reason:`${skillLabel(skill)} ${min} required.`};}
    if(def.furniture&&def.furniture!=='any'&&!furnitureFor(a,def.furniture).length)return{ok:false,reason:`Place suitable ${def.furniture==='sleep'?'sleeping':def.furniture==='feeding'?'feeding':def.furniture==='bath'?'bathing':def.furniture==='carryable'?'toy':'perch'} furniture first.`};
    if(def.furniture==='any'&&!floorFurniture(a).length)return{ok:false,reason:'Place some furniture first.'};
    return{ok:true,reason:entry.xp>0?stageFor(entry.xp).name:'Ready to learn'};
  }
  function skillLabel(k){return({flying:'Flying',agility:'Agility',strength:'Strength',fireControl:'Fire Control',intelligence:'Intelligence',confidence:'Confidence'})[k]||k;}

  function successChance(a,key){
    const root=ensureState(a),entry=root.entries[key],stage=stageFor(entry.xp),traits=traitSet(a),c=care(a);let p=stage.name==='Unknown'?.56:stage.name==='Learning'?.64:stage.name==='Familiar'?.79:stage.name==='Reliable'?.92:.985;
    p+=(Number(a.bond||0)-45)*.0016;
    const def=DEF[key];if(def?.skills?.length){const avg=def.skills.reduce((sum,k)=>sum+skillLevel(a,k),0)/def.skills.length;p+=(avg-20)*.00065;}
    if(Math.min(Number(c.hunger??100),Number(c.energy??100),Number(c.fun??100),Number(c.hygiene??100))<25)p-=.16;
    const mood=String(a?.moodSummary?.()||'');if(mood==='Grumpy'||mood==='Sulking')p-=.08;if(mood==='Excited'||mood==='Proud')p+=.025;
    if(key==='comeHere'){if(traits.has('Velcro Baby'))p+=.12;if(traits.has('Clingy')||traits.has('Affectionate'))p+=.055;if(traits.has('Independent Spirit'))p-=.08;if(traits.has('Independent'))p-=.035;}
    if(key==='stay'){if(traits.has('Patient'))p+=.09;if(traits.has('Impatient'))p-=.08;if(traits.has('Calm'))p+=.035;}
    if(key==='fetch'){if(traits.has('Toy Obsessed'))p+=.12;if(traits.has('Playful'))p+=.055;if(traits.has('Hoarder'))p-=.035;}
    if(key==='goToBed'){if(traits.has('Professional Napper'))p+=.14;if(traits.has('Sleepy')||traits.has('Lazy'))p+=.06;}
    if(key==='eat'&&traits.has('Food Obsessed'))p+=.075;
    if(key==='bathTime'){if(traits.has('Splash Addict'))p+=.15;if(traits.has('Clean'))p+=.07;if(traits.has('Messy'))p-=.035;if(traits.has('Coward'))p-=.07;}
    if(traits.has('Stubborn'))p-=.022;
    if(['fetch','stay'].includes(key)&&traits.has('Little Athlete'))p+=.025;
    if(key==='flyToPerch'){if(traits.has('Little Pilot'))p+=.14;if(traits.has('Fearless'))p+=.06;if(traits.has('Coward'))p-=.12;}
    if(key==='tinyFlame'){if(traits.has('Fearless'))p+=.05;if(traits.has('Coward'))p-=.06;}
    return clamp(p,.22,.995);
  }

  function meaningfulXpFactor(root){
    const cutoff=now()-60*60*1000;root.hourlyAttempts=(root.hourlyAttempts||[]).filter(t=>Number(t)>=cutoff);const n=root.hourlyAttempts.length;if(n>=8)return 0;if(n>=6)return .28;if(n>=4)return .58;return 1;
  }
  function recordAttempt(a,key,success,result){
    const root=ensureState(a),e=root.entries[key],before=stageFor(e.xp).name,t=now();e.attempts++;if(success)e.successes++;e.lastAttemptAt=t;e.lastResult=String(result||'').slice(0,80);root.recent.push({key,success:!!success,at:t,result:e.lastResult});root.recent=root.recent.slice(-12);
    let gained=0;if(t>=Number(e.xpReadyAt||0)){
      const fatigue=meaningfulXpFactor(root);const base=success?(stageFor(e.xp).name==='Unknown'?9:7):(stageFor(e.xp).name==='Unknown'?4:2.4);gained=base*fatigue;if(gained>0){e.xp=clamp(e.xp+gained);e.lastXpAt=t;root.hourlyAttempts.push(t);e.xpReadyAt=t+(RECOVERY_MS[stageFor(e.xp).name]||10*60*1000);}
    }
    const after=stageFor(e.xp).name;if(!e.unlockedAt&&e.xp>0)e.unlockedAt=t;if(after==='Mastered'&&!e.masteredAt)e.masteredAt=t;
    const obs=a.memory.observationCounters||(a.memory.observationCounters={});obs.commandsAttempted=(Number(obs.commandsAttempted)||0)+1;if(success)obs.commandsSucceeded=(Number(obs.commandsSucceeded)||0)+1;else obs.commandsFailed=(Number(obs.commandsFailed)||0)+1;if(key==='fetch'&&success)obs.fetchesCompleted=(Number(obs.fetchesCompleted)||0)+1;if(key==='comeHere'&&success)obs.successfulRecalls=(Number(obs.successfulRecalls)||0)+1;if(key==='tinyFlame'&&success)obs.tinyFlames=(Number(obs.tinyFlames)||0)+1;if(key==='flyToPerch'&&success)obs.perchFlights=(Number(obs.perchFlights)||0)+1;
    if(success&&!root.firsts.firstCommand){root.firsts.firstCommand=t;try{a.rememberLifeEvent?.('command','First command understood',`${a.dragon?.name||'Your dragon'} understood ${DEF[key].label} for the first time.`,`command-first-ever`);}catch(_){ }}
    if(success&&key==='fetch'&&!root.firsts.fetch){root.firsts.fetch=t;try{a.rememberLifeEvent?.('command','First Fetch',`${a.dragon?.name||'Your dragon'} brought a toy back for the first time.`,`command-first-fetch`);}catch(_){ }}
    if(success&&key==='tinyFlame'&&!root.firsts.tinyFlame){root.firsts.tinyFlame=t;try{a.rememberLifeEvent?.('command','First Tiny Flame',`${a.dragon?.name||'Your dragon'} produced a small controlled flame.`,`command-first-flame`);}catch(_){ }}
    a.memory.commands=root;a.behaviourDirty=true;window.DragonboundBabyEngine?.saveBehaviourLocal?.();
    if(before!==after&&after!=='Unknown'){
      try{a.rememberLifeEvent?.('command',`${DEF[key].label} · ${after}`,after==='Mastered'?`${a.dragon?.name||'Your dragon'} now understands ${DEF[key].label} with remarkable confidence.`:`${a.dragon?.name||'Your dragon'} is beginning to understand ${DEF[key].label}.`,`command-${key}-${after.toLowerCase()}`);}catch(_){ }
      manager.notice(after==='Mastered'?`${DEF[key].label} mastered!`:`${DEF[key].label} · ${after}`,'success');
    }
    if(success){try{a.awardBond?.('command-training',.08,12*60*1000);}catch(_){ }}
    return{gained,before,after};
  }

  function safeKeeperPoint(a){
    const floor=a?.map?.floors?.find(f=>f.id===a.floorId),nodes=(floor?.navigationNodes||[]).filter(p=>window.DragonboundBabyEngine?.isWalkable?.(a.floorId,p));if(!nodes.length)return null;
    return nodes.slice().sort((p,q)=>{const ps=(p[1]*1.4)-Math.abs(p[0]-.24)*.35,qs=(q[1]*1.4)-Math.abs(q[0]-.24)*.35;return qs-ps;})[0]?.slice()||null;
  }
  function nearPoint(a,p,ratio=.55){if(!p)return null;const q=[a.pos[0]+(p[0]-a.pos[0])*ratio,a.pos[1]+(p[1]-a.pos[1])*ratio];return window.DragonboundBabyEngine?.isWalkable?.(a.floorId,q)?q:p;}
  function pickFurniture(a,type,preferFavourite=''){
    const rows=furnitureFor(a,type);if(!rows.length)return null;const fav=a?.memory?.furnitureFavourites||{};const favIds=new Set(Object.values(fav).map(v=>String(v?.placementId||'')));return rows.slice().sort((x,y)=>{let sx=0,sy=0;if(favIds.has(String(x.placementId)))sx+=20;if(favIds.has(String(y.placementId)))sy+=20;if(preferFavourite&&String(x.placementId)===preferFavourite)sx+=20;if(preferFavourite&&String(y.placementId)===preferFavourite)sy+=20;return sy-sx;})[0];
  }

  class CommandManager{
    constructor(){this.engine=null;this.actor=null;this.active=null;this.pending=null;this.button=null;this.overlay=null;this.hud=null;this.hudFlash=null;this.journal=null;this.detailKey='';this.launchPointerId=null;this.launchPointerStart=null;this.lastPointerToggleAt=0;this.timer=setInterval(()=>this.tick(),450);this.uiTimer=setInterval(()=>this.ensureUi(),1500);window.addEventListener('dragonbound:house-selected',()=>setTimeout(()=>this.ensureUi(),100));window.addEventListener('dragonbound:dragon-named',()=>setTimeout(()=>this.ensureUi(),100));window.addEventListener('resize',()=>this.syncFloatingUi());window.addEventListener('scroll',()=>this.syncFloatingUi(),true);document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(this.overlay?.classList.contains('is-visible'))this.close();else if(this.active)this.cancel('Command cancelled.');}});}
    getActor(){const e=window.DragonboundBabyEngine;return e?.actor||null;}
    homeAvailable(){
      const e=window.DragonboundBabyEngine,home=e?.homeScene,stage=e?.stage;
      if(!e?.actor||!home?.classList.contains('is-visible'))return false;
      if(stage?.classList.contains('is-visiting-house')||home.classList.contains('is-build-editing')||home.classList.contains('is-build-placing'))return false;
      return true;
    }
    createOverlay(){
      if(this.overlay?.isConnected)return this.overlay;
      const overlay=document.createElement('div');overlay.className='dragonbound-command-overlay';overlay.setAttribute('aria-hidden','true');overlay.innerHTML=`<div class="dragonbound-command-backdrop"></div><section class="dragonbound-command-panel" role="dialog" aria-modal="true" aria-label="Dragon commands"><header class="dragonbound-command-panel-head"><span class="dragonbound-command-panel-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h3M10 8v8M14 5v14M18 9v6"/></svg></span><div><small>KEEPER TRAINING</small><h2>Commands <span>&</span> Tricks</h2><p>Choose one cue. Your dragon will listen, think, then respond.</p></div><button type="button" data-command-close aria-label="Close commands">×</button></header><div class="dragonbound-command-status" data-command-status></div><div class="dragonbound-command-section-head"><span>YOUR CUES</span><small>Understanding improves through patient practice</small></div><div class="dragonbound-command-grid" data-command-grid></div><div class="dragonbound-command-furniture-picker" data-command-furniture-picker hidden></div><footer><span>Learning recovery pauses proficiency XP, not the command itself.</span><button type="button" data-command-cancel hidden>Cancel current cue</button></footer></section>`;
      document.body.appendChild(overlay);
      overlay.querySelector('.dragonbound-command-backdrop').addEventListener('click',()=>this.close());
      overlay.querySelector('[data-command-close]').addEventListener('click',()=>this.close());
      overlay.querySelector('[data-command-cancel]').addEventListener('click',()=>this.cancel('Command cancelled.'));
      overlay.querySelector('[data-command-grid]').addEventListener('click',e=>{const btn=e.target.closest('[data-command-key]');if(!btn)return;e.preventDefault();e.stopPropagation();const key=btn.dataset.commandKey;const accepted=this.issue(key);if(accepted&&key!=='goToFurniture')this.close();});
      this.overlay=overlay;return overlay;
    }
    createHud(){
      if(this.hud?.isConnected)return this.hud;
      const hud=document.createElement('div');hud.className='dragonbound-command-live-hud';hud.hidden=true;hud.setAttribute('aria-live','polite');hud.setAttribute('aria-atomic','true');hud.innerHTML=`<span class="dragonbound-command-live-pulse" aria-hidden="true"><i></i><i></i><i></i></span><span class="dragonbound-command-live-copy"><small data-command-hud-kicker>KEEPER COMMAND</small><strong data-command-hud-title>Listening…</strong><span data-command-hud-status></span></span><span class="dragonbound-command-live-next" data-command-hud-next hidden></span>`;document.body.appendChild(hud);this.hud=hud;return hud;
    }
    createLauncher(){
      if(this.button?.isConnected)return this.button;
      const b=document.createElement('button');b.type='button';b.className='dragonbound-command-button';b.setAttribute('aria-label','Open dragon commands and training');b.innerHTML='<span class="dragonbound-command-button-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M4 12h3M10 8v8M14 5v14M18 9v6"/></svg></span><span class="dragonbound-command-button-copy"><small data-command-launcher-kicker>DRAGON TRAINING</small><strong>Commands</strong></span><span class="dragonbound-command-button-arrow" aria-hidden="true">›</span>';
      b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();this.launchPointerId=e.pointerId;this.launchPointerStart=[e.clientX,e.clientY];try{b.setPointerCapture?.(e.pointerId);}catch(_){}} ,{capture:true});
      b.addEventListener('pointerup',e=>{if(this.launchPointerId!==e.pointerId)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const st=this.launchPointerStart||[e.clientX,e.clientY],moved=Math.hypot(e.clientX-st[0],e.clientY-st[1]);try{b.releasePointerCapture?.(e.pointerId);}catch(_){}this.launchPointerId=null;this.launchPointerStart=null;if(moved<=12){this.lastPointerToggleAt=now();this.toggle();}}, {capture:true});
      b.addEventListener('pointercancel',e=>{if(this.launchPointerId===e.pointerId){this.launchPointerId=null;this.launchPointerStart=null;}e.stopPropagation();},{capture:true});
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(now()-this.lastPointerToggleAt<650)return;this.toggle();});
      document.body.appendChild(b);this.button=b;return b;
    }
    syncFloatingUi(){
      const home=this.engine?.homeScene;if(!home)return;const r=home.getBoundingClientRect();if(!r.width||!r.height)return;
      if(this.button?.isConnected){const w=190,h=56,left=Math.max(10,Math.min(window.innerWidth-w-10,r.left+18)),top=Math.max(10,Math.min(window.innerHeight-h-10,r.bottom-h-18));this.button.style.left=`${Math.round(left)}px`;this.button.style.top=`${Math.round(top)}px`;}
      if(this.hud?.isConnected){const w=Math.min(390,Math.max(280,r.width*.46));const left=Math.max(10,Math.min(window.innerWidth-w-10,r.left+(r.width-w)/2)),top=Math.max(10,Math.min(window.innerHeight-72,r.top+18));this.hud.style.width=`${Math.round(w)}px`;this.hud.style.left=`${Math.round(left)}px`;this.hud.style.top=`${Math.round(top)}px`;}
    }
    syncHud(){
      const hud=this.createHud(),a=this.getActor(),t=now();if(this.hudFlash&&this.hudFlash.until<=t)this.hudFlash=null;const active=this.active,pending=this.pending,flash=this.hudFlash;const show=!!a&&this.homeAvailable()&&!!(active||pending||flash);hud.hidden=!show;hud.classList.toggle('is-listening',!!active);hud.classList.toggle('is-queued',!active&&!!pending);hud.classList.toggle('is-success',!active&&!pending&&flash?.tone==='success');
      const kicker=hud.querySelector('[data-command-hud-kicker]'),title=hud.querySelector('[data-command-hud-title]'),status=hud.querySelector('[data-command-hud-status]'),next=hud.querySelector('[data-command-hud-next]');if(show){if(active){kicker.textContent='KEEPER COMMAND';title.textContent=DEF[active.key]?.label||'Command';status.textContent=active.label||'Listening…';}else if(pending){kicker.textContent='COMMAND QUEUED';title.textContent=DEF[pending.key]?.label||'Command';status.textContent='Waiting for a safe moment…';}else{kicker.textContent=flash?.kicker||'COMMAND';title.textContent=flash?.title||'Done';status.textContent=flash?.status||'';}if(active&&pending){next.hidden=false;next.textContent=`NEXT · ${DEF[pending.key]?.label||'Command'}`;}else next.hidden=true;}
      if(this.button?.isConnected){const k=this.button.querySelector('[data-command-launcher-kicker]');this.button.classList.toggle('is-command-active',!!active);this.button.classList.toggle('is-command-queued',!active&&!!pending);if(k)k.textContent=active?'LISTENING':pending?'COMMAND QUEUED':'DRAGON TRAINING';}
      this.syncFloatingUi();
    }
    ensureUi(){
      this.engine=window.DragonboundBabyEngine||null;const actor=this.getActor();if(actor!==this.actor){this.actor=actor;if(actor)ensureState(actor);this.active=null;this.pending=null;this.hudFlash=null;}
      if(this.engine?.homeScene)this.createLauncher();this.createOverlay();this.createHud();
      if(this.button){const ok=this.homeAvailable()&&!!actor;this.button.hidden=!ok;this.button.disabled=!ok;}
      if(!this.homeAvailable()&&this.overlay?.classList.contains('is-visible'))this.close();
      this.syncHud();this.syncFloatingUi();this.ensureJournal();if(this.overlay?.classList.contains('is-visible'))this.render();if(this.journal&&document.querySelector('.dragonbound-my-dragon-overlay.is-visible'))this.renderJournal();
    }
    ensureJournal(){
      const page=document.querySelector('.dragonbound-my-dragon-page--right');if(!page)return;if(this.journal?.isConnected)return;
      const block=document.createElement('div');block.className='dragonbound-my-dragon-commands';block.innerHTML=`<div class="dragonbound-my-dragon-section-title"><span>Training & Commands</span><small>Understanding grows with practice</small></div><div class="dragonbound-journal-command-summary" data-journal-command-summary></div><div class="dragonbound-journal-command-grid" data-journal-command-grid></div><div class="dragonbound-journal-command-detail" data-journal-command-detail hidden></div>`;
      const life=page.querySelector('.dragonbound-my-dragon-life');page.insertBefore(block,life||null);block.querySelector('[data-journal-command-grid]').addEventListener('click',e=>{const btn=e.target.closest('[data-journal-command-key]');if(!btn)return;this.detailKey=this.detailKey===btn.dataset.journalCommandKey?'':btn.dataset.journalCommandKey;this.renderJournal();});this.journal=block;
    }
    toggle(){if(this.overlay?.classList.contains('is-visible')){this.close();return;}this.open();}
    open(){
      this.engine=window.DragonboundBabyEngine||null;const actor=this.getActor();
      if(!actor||!this.homeAvailable())return false;
      this.actor=actor;ensureState(actor);this.createOverlay();if(!this.overlay)return false;
      this.render();this.overlay.classList.add('is-visible');this.overlay.setAttribute('aria-hidden','false');document.body.classList.add('dragonbound-command-menu-open');
      requestAnimationFrame(()=>this.overlay?.querySelector('[data-command-close]')?.focus({preventScroll:true}));
      return true;
    }
    close(){this.overlay?.classList.remove('is-visible');this.overlay?.setAttribute('aria-hidden','true');document.body.classList.remove('dragonbound-command-menu-open');}
    render(){
      const a=this.actor;if(!a||!this.overlay)return;const root=ensureState(a),grid=this.overlay.querySelector('[data-command-grid]'),status=this.overlay.querySelector('[data-command-status]'),cancel=this.overlay.querySelector('[data-command-cancel]');if(status)status.innerHTML=this.active?`<span class="dragonbound-command-status-dot"></span><div><small>${esc(a.dragon?.name||'Your dragon')} IS LISTENING</small><strong>${esc(DEF[this.active.key]?.label||'Command')}</strong><span>${esc(this.active.label||'In progress…')}</span></div>`:`<span class="dragonbound-command-status-avatar">${esc((a.dragon?.name||'D').slice(0,1).toUpperCase())}</span><div><small>CURRENT DRAGON</small><strong>${esc(a.dragon?.name||'Your dragon')}</strong><span>${Math.round(a.bond||0)} Bond · ${esc(a.moodSummary?.()||'Content')}</span></div>`;if(cancel)cancel.hidden=!this.active;
      grid.innerHTML=COMMAND_ORDER.map(key=>{const def=DEF[key],entry=root.entries[key],av=availability(a,key),s=stageFor(entry.xp),chance=Math.round(successChance(a,key)*100),cool=Math.max(0,entry.xpReadyAt-now()),locked=!av.ok;const tag=locked?'Locked':s.name==='Mastered'?'Mastered':cool>0?'Recovering':s.name==='Unknown'?'Ready':'Practice';const detail=locked?esc(av.reason):s.name==='Unknown'?'Ready to start learning':`${esc(s.name)} · ~${chance}% response`;const foot=locked?'Requirement not met':cool>0?`Learning recovery · ${fmtMs(cool)}`:'Ready for meaningful practice';return`<button type="button" class="dragonbound-command-card${locked?' is-locked':''}${s.name==='Mastered'?' is-mastered':''}" data-command-key="${key}" ${locked?'aria-disabled="true"':''}><span class="dragonbound-command-card-icon">${def.icon}</span><span class="dragonbound-command-card-copy"><span class="dragonbound-command-card-top"><strong>${esc(def.label)}</strong><em>${tag}</em></span><small>${detail}</small><span class="dragonbound-command-progress"><i style="width:${entry.xp}%"></i></span><b>${foot}</b></span><span class="dragonbound-command-card-arrow" aria-hidden="true">›</span></button>`;}).join('');
      const picker=this.overlay.querySelector('[data-command-furniture-picker]');if(picker&&!picker.dataset.open)picker.hidden=true;
    }
    renderJournal(){
      const a=this.getActor();if(!a||!this.journal)return;const root=ensureState(a),grid=this.journal.querySelector('[data-journal-command-grid]'),summary=this.journal.querySelector('[data-journal-command-summary]'),detail=this.journal.querySelector('[data-journal-command-detail]');const learned=COMMAND_ORDER.filter(k=>root.entries[k].xp>0).length,mastered=COMMAND_ORDER.filter(k=>stageFor(root.entries[k].xp).name==='Mastered').length;summary.innerHTML=`<span><small>KNOWN / LEARNING</small><strong>${learned}</strong></span><span><small>MASTERED</small><strong>${mastered}</strong></span><span><small>ATTEMPTS</small><strong>${COMMAND_ORDER.reduce((s,k)=>s+root.entries[k].attempts,0)}</strong></span>`;
      grid.innerHTML=COMMAND_ORDER.map(key=>{const def=DEF[key],e=root.entries[key],av=availability(a,key),s=stageFor(e.xp),cool=Math.max(0,e.xpReadyAt-now()),rate=e.attempts?Math.round((e.successes/e.attempts)*100):Math.round(successChance(a,key)*100);if(!av.ok&&e.xp<=0&&!['tinyFlame','flyToPerch','fetch'].includes(key))return'';return`<button type="button" class="dragonbound-journal-command-card${this.detailKey===key?' is-selected':''}${!av.ok?' is-locked':''}" data-journal-command-key="${key}"><span>${def.icon}</span><div><strong>${esc(def.label)}</strong><small>${!av.ok&&e.xp<=0?esc(av.reason):`${esc(s.name)} · ${rate}% response`}</small><i><em style="width:${e.xp}%"></em></i><b>${fmtMs(cool)}</b></div></button>`;}).join('');
      if(!this.detailKey){detail.hidden=true;detail.innerHTML='';return;}const key=this.detailKey,def=DEF[key],e=root.entries[key],av=availability(a,key),s=stageFor(e.xp);detail.hidden=false;detail.innerHTML=`<small>COMMAND DETAILS</small><h4>${esc(def.label)} · ${esc(s.name)}</h4><p>${esc(def.summary)}</p><div><span><b>Uses</b>${def.skills.length?def.skills.map(skillLabel).join(' · '):'Bond & routine'}</span><span><b>Practice</b>${e.xpReadyAt>now()?fmtMs(e.xpReadyAt-now()):'Ready for meaningful learning XP'}</span><span><b>Current response</b>~${Math.round(successChance(a,key)*100)}%</span>${!av.ok?`<span><b>Requirement</b>${esc(av.reason)}</span>`:''}</div>`;
    }
    notice(text,tone=''){
      const a=this.getActor();if(!a?.el)return;a.el.querySelector('.dragonbound-command-float')?.remove();const n=document.createElement('span');n.className=`dragonbound-command-float${tone?' is-'+tone:''}`;n.textContent=String(text||'');a.el.appendChild(n);setTimeout(()=>n.remove(),2600);
    }
    reactionFx(type){const a=this.getActor();if(!a?.el)return;const fx=document.createElement('span');fx.className=`dragonbound-command-reaction dragonbound-command-reaction--${type}`;fx.setAttribute('aria-hidden','true');fx.innerHTML=type==='flame'?'<i></i><i></i><i></i>':type==='roar'?'<b>ROAR!</b><i></i>':'<i></i>';a.el.appendChild(fx);setTimeout(()=>fx.remove(),1800);}
    unsafeBusy(a){const state=String(a?.state||'');return ['approachingStairs','climbingStairs','takingOff','flying','landing'].includes(state)||state.startsWith('furniture');}
    criticalReason(a,key){const c=care(a);if(['eat','goToBed','bathTime'].includes(key))return'';if(Number(c.energy??100)<20)return`${a.dragon?.name||'Your dragon'} is too sleepy for training.`;if(Number(c.hunger??100)<20)return`${a.dragon?.name||'Your dragon'} is too hungry to concentrate.`;return'';}
    issue(key,opts={}){
      const a=this.getActor(),def=DEF[key];if(!a||!def||!this.homeAvailable())return false;const av=availability(a,key);if(!av.ok){this.notice(av.reason,'soft');return false;}const critical=this.criticalReason(a,key);if(critical){this.notice(critical,'soft');return false;}
      if(key==='goToFurniture'&&!opts.target){this.openFurniturePicker();return true;}
      if(this.active){this.pending={key,opts};this.notice(`${def.label} queued`,'soft');this.render();this.syncHud();return true;}
      if(key==='dropIt'&&a.physicalInteraction?.flags?.carryable){/* Drop It is the one command allowed to interrupt an active carry. */}
      else if(this.unsafeBusy(a)){this.pending={key,opts};this.notice(`${def.label} — waiting for a safe moment`,'soft');this.syncHud();return true;}
      if(a.currentLifeEvent){try{a.interruptDailyLifeEvent?.('player-command');}catch(_){ }}
      const e=ensureState(a).entries[key],s=stageFor(e.xp),traits=traitSet(a);let delay=s.name==='Unknown'?1600+Math.random()*1200:s.name==='Learning'?1300+Math.random()*900:s.name==='Familiar'?850+Math.random()*750:s.name==='Reliable'?450+Math.random()*550:300+Math.random()*450;if(traits.has('Impatient'))delay*=.82;if(traits.has('Stubborn'))delay*=1.24;if(traits.has('Lazy'))delay*=1.10;if(traits.has('Energetic')||traits.has('Easily Excited'))delay*=.91;if(key==='comeHere'&&traits.has('Velcro Baby'))delay*=.72;if(key==='comeHere'&&(traits.has('Clingy')||traits.has('Affectionate')))delay*=.82;
      const id=`${now()}-${Math.random()}`;this.active={id,key,opts,startedAt:now(),phase:'reacting',label:`${a.dragon?.name||'Your dragon'} is listening…`};this.hudFlash=null;a.path=[];a.stateUntil=0;a.nextDecision=now()+Math.max(4000,delay+3000);a.setState?.('looking',delay+250);this.notice(`${def.label}…`,'command');a.noteKeeperRelationship?.('command',{label:def.label,key});a.noteRoutineCommand?.(key);a.maybeShowDragonThought?.('command',{key,label:def.label});this.render();this.syncHud();setTimeout(()=>{if(this.active?.id!==id)return;this.decideActive();},delay);return true;
    }
    decideActive(){
      const a=this.getActor(),cmd=this.active;if(!a||!cmd)return this.cancel();const key=cmd.key,chance=successChance(a,key),success=Math.random()<chance;if(!success){recordAttempt(a,key,false,'Still learning');this.performFailure(key,cmd.opts);return;}
      const ok=this.executeSuccess(key,cmd.opts);if(ok===false){recordAttempt(a,key,false,'Could not perform safely');this.notice('Couldn’t quite work that one out.','soft');this.finish(false);return;}recordAttempt(a,key,true,'Understood');cmd.phase='performing';cmd.label=this.actionPhrase(key);cmd.seenAction=false;cmd.performStartedAt=now();this.notice(this.successPhrase(key),'success');this.render();this.syncHud();
    }
    successPhrase(key){const a=this.actor,traits=traitSet(a);if(key==='eat'&&(traits.has('Food Obsessed')||traits.has('Food Goblin')||traits.has('Greedy')))return'Immediately understood!';if(key==='bathTime'&&traits.has('Splash Addict'))return'Bath time! ♥';if(key==='goToBed'&&traits.has('Professional Napper'))return'Best command ever.';return['Got it!','Good dragon!','Understood!','Nice!'][Math.floor(Math.random()*4)];}
    actionPhrase(key){return({comeHere:'Coming to you…',sit:'Settling into a sit…',stay:'Staying put…',goToBed:'Heading to bed…',eat:'Going to eat…',bathTime:'Heading for a wash…',fetch:'Fetching a toy…',dropIt:'Dropping it…',goToFurniture:'Going to the furniture…',roar:'Getting ready to roar…',tinyFlame:'Concentrating on a tiny flame…',flyToPerch:'Preparing to fly…'})[key]||'Understood — doing it now…';}
    performFailure(key,opts){
      const a=this.getActor();if(!a)return this.finish(false);const traits=traitSet(a);let text='Still learning…';if(this.active){this.active.label='Still learning this cue…';this.syncHud();}
      if(key==='comeHere'){const target=nearPoint(a,safeKeeperPoint(a),.48);if(target)a.startWalk?.(target,'command-learning');text='Came halfway… then got distracted.';}
      else if(key==='sit'){a.setState?.('resting',2600);text='Close — lying down instead.';}
      else if(key==='stay'){a.setState?.('sitting',1800);text='Stayed for a moment.';}
      else if(key==='fetch'){const toy=pickFurniture(a,'carryable');if(toy)a.commandFurniture?.(toy);text=traits.has('Tiny Menace')?'Found a toy. Kept it.':'Got distracted by the toy.';}
      else if(key==='roar'){this.reactionFx('roar');text='A very tiny squeak.';}
      else if(key==='tinyFlame'){this.reactionFx('smoke');text='Just a little puff of smoke.';}
      else if(key==='flyToPerch'){text='Thought about flying… maybe next time.';a.setState?.('looking',2600);}
      else if(key==='goToBed'&&traits.has('Professional Napper')){const bed=pickFurniture(a,'sleep');if(bed)a.commandFurniture?.(bed);text='That one was understood perfectly.';}
      else a.setState?.('looking',2200);
      this.notice(text,'soft');setTimeout(()=>this.finish(false),Math.max(1900,key==='fetch'?5200:2300));
    }
    executeSuccess(key,opts){
      const a=this.getActor();if(!a)return false;
      if(key==='comeHere'){const target=safeKeeperPoint(a);if(!target)return false;this.active.target=target;this.active.mode='walk';return !!a.startWalk?.(target,'command-come');}
      if(key==='sit'){a.path=[];a.setState?.('sitting',5200);this.active.mode='timer';this.active.completeAt=now()+1500;return true;}
      if(key==='stay'){const e=ensureState(a).entries[key],stage=stageFor(e.xp),duration=stage.name==='Mastered'?12000:stage.name==='Reliable'?9500:stage.name==='Familiar'?7000:4800;a.path=[];a.setState?.('sitting',duration);a.nextDecision=now()+duration+500;this.active.mode='stay';this.active.completeAt=now()+duration;return true;}
      if(key==='goToBed'){const m=opts.target||pickFurniture(a,'sleep');return this.startFurnitureCommand(m,'furniture');}
      if(key==='eat'){const m=opts.target||pickFurniture(a,'feeding');return this.startFurnitureCommand(m,'furniture');}
      if(key==='bathTime'){const m=opts.target||pickFurniture(a,'bath');return this.startFurnitureCommand(m,'furniture');}
      if(key==='fetch'){const m=opts.target||pickFurniture(a,'carryable');if(!m)return false;this.active.fetchMeta=m;this.active.fetchTarget=safeKeeperPoint(a);return this.startFurnitureCommand(m,'fetch');}
      if(key==='dropIt'){if(a.physicalInteraction?.flags?.carryable){a.finishFurnitureUse?.();this.active.mode='timer';this.active.completeAt=now()+500;return true;}this.notice('Nothing to drop right now.','soft');this.active.mode='timer';this.active.completeAt=now()+600;return true;}
      if(key==='goToFurniture'){return this.startFurnitureCommand(opts.target,'furniture');}
      if(key==='roar'){a.setState?.('looking',2300);this.reactionFx('roar');this.active.mode='timer';this.active.completeAt=now()+1700;return true;}
      if(key==='tinyFlame'){a.setState?.('looking',2400);this.reactionFx('flame');this.active.mode='timer';this.active.completeAt=now()+1800;return true;}
      if(key==='flyToPerch'){const m=opts.target||pickFurniture(a,'perch');if(!m)return false;this.active.perchMeta=m;this.active.mode='flight-first';const started=a.startFlight?.();if(!started){this.active.mode='furniture';return !!a.commandFurniture?.(m);}return true;}
      return false;
    }
    startFurnitureCommand(meta,mode='furniture'){if(!meta||!this.actor)return false;this.active.mode=mode;this.active.targetPlacementId=String(meta.placementId||'');return !!this.actor.commandFurniture?.(meta);}
    openFurniturePicker(){
      const a=this.getActor(),picker=this.overlay?.querySelector('[data-command-furniture-picker]');if(!a||!picker)return;const rows=floorFurniture(a);picker.hidden=false;picker.dataset.open='1';picker.innerHTML=`<div><strong>Choose Furniture</strong><button type="button" data-picker-close>×</button></div><p>Ask ${esc(a.dragon?.name||'your dragon')} to use one of the furnishings already in this room.</p><div>${rows.slice(0,30).map(m=>`<button type="button" data-picker-placement="${esc(m.placementId)}"><span>${esc(m.name||m.itemId)}</span><small>${esc(kindOf(a,m)||'Interact')}</small></button>`).join('')}</div>`;picker.querySelector('[data-picker-close]').onclick=()=>{picker.hidden=true;delete picker.dataset.open;};picker.querySelectorAll('[data-picker-placement]').forEach(btn=>btn.onclick=()=>{const m=rows.find(x=>String(x.placementId)===String(btn.dataset.pickerPlacement));picker.hidden=true;delete picker.dataset.open;if(m){const accepted=this.issue('goToFurniture',{target:m});if(accepted)this.close();}});
    }
    tick(){
      this.engine=window.DragonboundBabyEngine||null;const a=this.getActor();if(a!==this.actor){this.actor=a;if(a)ensureState(a);this.active=null;this.pending=null;}
      if(!a)return;
      const buildOrVisit=!!(this.engine?.stage?.classList.contains('is-visiting-house')||this.engine?.homeScene?.classList.contains('is-build-editing')||this.engine?.homeScene?.classList.contains('is-build-placing')||!this.engine?.stage?.classList.contains('is-home'));if(this.active&&buildOrVisit){this.cancel();return;}
      if(this.active){
        const c=care(a);if(this.active.key==='stay'&&(Number(c.energy??100)<18||Number(c.hunger??100)<18)){this.notice('Stay ended — something else is more important.','soft');this.finish(true);return;}
        if(this.active.phase==='performing')this.monitorActive(a);
      }else if(this.pending&&!this.unsafeBusy(a)&&this.homeAvailable()){const p=this.pending;this.pending=null;this.issue(p.key,p.opts);}
      if(this.button){const ok=this.homeAvailable();this.button.hidden=!ok;this.button.disabled=!ok;}
      this.syncHud();this.syncFloatingUi();if(this.overlay?.classList.contains('is-visible'))this.render();if(this.journal&&document.querySelector('.dragonbound-my-dragon-overlay.is-visible'))this.renderJournal();
    }
    monitorActive(a){
      const cmd=this.active;if(!cmd)return;const elapsed=now()-cmd.performStartedAt;
      if(cmd.mode==='timer'){if(now()>=cmd.completeAt)this.finish(true);return;}
      if(cmd.mode==='stay'){if(now()>=cmd.completeAt)this.finish(true);return;}
      if(cmd.mode==='walk'){if(String(a.state)==='walking'||a.pendingMoveMode==='command-come'||(a.path&&a.path.length))cmd.seenAction=true;if(cmd.seenAction&&String(a.state)!=='walking'&&!a.path?.length&&a.pendingMoveMode!=='command-come')this.finish(true);else if(elapsed>14000)this.finish(true);return;}
      if(cmd.mode==='flight-first'){if(['takingOff','flying','landing'].includes(String(a.state)))cmd.seenAction=true;if(cmd.seenAction&&!['takingOff','flying','landing'].includes(String(a.state))){cmd.mode='furniture';cmd.seenAction=false;a.commandFurniture?.(cmd.perchMeta);}else if(elapsed>16000){cmd.mode='furniture';cmd.seenAction=false;a.commandFurniture?.(cmd.perchMeta);}return;}
      if(cmd.mode==='fetch'||cmd.mode==='furniture'){
        const busy=String(a.state).startsWith('furniture')||String(a.state)==='walking'||!!a.furniturePlan||!!a.physicalInteraction;
        if(busy)cmd.seenAction=true;
        if(cmd.mode==='fetch'&&a.physicalInteraction?.flags?.carryable){const p=a.physicalInteraction;p.carryOneWay=true;if(cmd.fetchTarget)p.carryTarget=cmd.fetchTarget.slice();cmd.seenCarry=true;}
        if(cmd.seenAction&&!busy&&elapsed>900)this.finish(true);else if(elapsed>45000)this.finish(true);return;
      }
    }
    finish(success=true){const cmd=this.active;this.active=null;if(cmd&&success&&cmd.key==='fetch')this.notice('Brought it back!','success');if(cmd){this.hudFlash={kicker:success?'COMMAND UNDERSTOOD':'STILL LEARNING',title:DEF[cmd.key]?.label||'Command',status:success?'Cue complete.':'Not quite this time.',tone:success?'success':'soft',until:now()+1450};}this.render();this.syncHud();if(this.pending){const p=this.pending;this.pending=null;setTimeout(()=>this.issue(p.key,p.opts),700);}}
    cancel(message=''){const a=this.getActor();if(this.active){try{if(String(a?.state||'').startsWith('furniture'))a.finishFurnitureUse?.();a.path=[];a.pendingMoveMode='';a.setState?.('looking',900);}catch(_){ }}this.active=null;this.pending=null;this.hudFlash=message?{kicker:'COMMAND CANCELLED',title:'Training paused',status:message,tone:'soft',until:now()+1200}:null;if(message)this.notice(message,'soft');this.render();this.syncHud();}
    debug(){const a=this.getActor();if(!a)return null;const root=ensureState(a);return{active:this.active?{...this.active}:null,pending:this.pending?{key:this.pending.key}:null,commands:Object.fromEntries(COMMAND_ORDER.map(k=>[k,{...root.entries[k],stage:stageFor(root.entries[k].xp).name,available:availability(a,k),successChance:+successChance(a,k).toFixed(3)}])),recent:[...(root.recent||[])],hourlyMeaningfulAttempts:(root.hourlyAttempts||[]).length};}
  }

  const manager=new CommandManager();
  window.DragonboundCommands={version:VERSION,open:()=>manager.open(),close:()=>manager.close(),issue:(key,opts)=>manager.issue(key,opts),cancel:()=>manager.cancel('Command cancelled.'),state:()=>manager.debug(),definitions:DEF};
  window.DragonboundCommandDebug={
    inspect(){if(currentAccountSlug()!=='admin')return null;return manager.debug();},
    trigger(key){if(currentAccountSlug()!=='admin')return false;return manager.issue(String(key||''));},
    set(key,xp){if(currentAccountSlug()!=='admin')return null;const a=manager.getActor();if(!a||!DEF[key])return null;const root=ensureState(a);root.entries[key].xp=clamp(xp);root.entries[key].xpReadyAt=0;a.behaviourDirty=true;manager.engine?.saveBehaviourLocal?.();manager.render();manager.renderJournal();return manager.debug();}
  };
})();
