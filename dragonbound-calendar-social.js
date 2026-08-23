(function(){
  'use strict';
  if(window.__dragonboundCalendarSocialV3383)return;
  window.__dragonboundCalendarSocialV3383=true;

  const VERSION='33.83';
  const UK_ZONE='Europe/London';
  const DAY_MS=86400000;
  const EPOCH_UTC=Date.UTC(2026,6,30); // Day 1: 30 July 2026. 23 Aug 2026 is Day 25.
  const ASSET_ROOT='assets/dragonbound/calendar/';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const slug=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'unknown';
  const clone=v=>{try{return typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v));}catch(_e){return v;}};

  const event=(day,id,name,importance,icon,description,accent,atmosphere,behaviourBias={},furnitureBias={})=>({day,id,name,shortName:name,importance,icon:ASSET_ROOT+icon,description,accent,atmosphere,behaviourBias,furnitureBias});
  const EVENTS={
    1:event(1,'newleaf-morning','Newleaf Morning','minor','newleaf-morning.png','A fresh Velmoran cycle begins. Homes are aired, gardens are tended and new stories take root.','#718f50','newleaf',{looking:3,explore:6,furniture:4},{nature:9,inspectable:5}),
    4:event(4,'tinkerday','Tinkerday','tradition','tinkerday.png','A lighthearted household day for repairing, rearranging and making things.','#9a7246','tinker',{looking:3,furniture:6},{inspectable:8,training:2}),
    7:event(7,'nest-market-day','Nest Market Day','tradition','nest-market-day.png','Keepers traditionally stock up on treats, furnishings and useful household goods.','#b45f4a','market',{furniture:4,looking:2},{food:5,drink:4,hoardable:3,inspectable:3}),
    10:event(10,'mudhop-day','Mudhop Day','minor','mudhop-day.png','A cheerfully messy Velmoran tradition devoted to puddles, outdoor play and very questionable footprints.','#89603d','mudhop',{zoomies:6,explore:5,walking:3},{diggable:10,nature:5,washable:-2}),
    13:event(13,'moonwatch','Moonwatch','tradition','moonwatch.png','A quiet evening tradition for windows, night skies and comfortable company.','#68729b','moonwatch',{looking:7,resting:4,sitting:4},{window:12,comfortable:5}),
    16:event(16,'heartbond-day','Heartbond Day','major','heartbond-day.png','Velmora celebrates keepers, pets, friends and every form of companionship.','#a85b71','heartbond',{resting:4,sitting:4,looking:2},{comfortable:6,restable:5}),
    19:event(19,'greenwater-fair','Greenwater Fair','major','greenwater-fair.png','Games, food, music and ribbons fill the greener corners of Velmora.','#4f8874','fair',{zoomies:5,walking:4,explore:5,furniture:2},{playable:8,nature:6}),
    22:event(22,'hatchling-day','Hatchling Day','major','hatchling-day.png','Young dragons are celebrated across Velmora with games, affection and very little expectation of dignity.','#8d70a4','hatchling',{zoomies:5,explore:3,furniture:3},{playable:8,comfortable:4}),
    25:event(25,'lantern-night','Lantern Night','major','lantern-night.png','As evening falls, lanterns are lit across Velmora. Homes warm, spirits brighten and companions gather close.','#c78939','lantern',{resting:6,sitting:5,looking:4,sleeping:2},{warm:14,window:7,comfortable:9,restable:6}),
    27:event(27,'keepers-feast',"Keeper's Feast",'major','keepers-feast.png','Food, treats and good company take centre stage for one especially well-fed day.','#9a6738','feast',{furniture:5,resting:2},{food:14,drink:8,comfortable:3}),
    29:event(29,'frostwake','Frostwake','major','frostwake.png',"Velmora's first winter whisper brings frost-bright decorations and an excuse to find somewhere warm.",'#6c9eb3','frostwake',{resting:6,sleeping:3,looking:3},{warm:14,comfortable:8,window:3}),
    30:event(30,'starhearth-eve','Starhearth Eve','major','starhearth-eve.png','The night before Starhearth. Lights appear in windows and households settle in together.','#c99742','starhearth-eve',{resting:6,sitting:5,looking:3},{warm:12,comfortable:10,restable:7}),
    31:event(31,'starhearth','Starhearth','major','starhearth.png','Home, hearth and every creature who makes them worth returning to. Velmora celebrates its greatest household festival.','#c89b36','starhearth',{resting:7,sitting:6,looking:4,zoomies:2},{warm:15,comfortable:12,restable:8,playable:3})
  };
  const EVENT_LIST=Object.values(EVENTS).sort((a,b)=>a.day-b.day);

  const ukParts=(date=new Date())=>{
    try{
      const parts=new Intl.DateTimeFormat('en-GB',{timeZone:UK_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
      const get=t=>Number(parts.find(p=>p.type===t)?.value||0);
      return{year:get('year'),month:get('month'),day:get('day')};
    }catch(_e){return{year:date.getUTCFullYear(),month:date.getUTCMonth()+1,day:date.getUTCDate()};}
  };
  const dateSerial=(date=new Date())=>{const p=ukParts(date);return Date.UTC(p.year,p.month-1,p.day);};
  const dateKey=(date=new Date())=>{const p=ukParts(date);return`${p.year}-${String(p.month).padStart(2,'0')}-${String(p.day).padStart(2,'0')}`;};
  const realCalendar=()=>{
    const delta=Math.floor((dateSerial()-EPOCH_UTC)/DAY_MS);
    const day=((delta%31)+31)%31+1;
    const cycle=Math.floor(delta/31)+1;
    return{day,cycle,delta,dateKey:dateKey(),preview:false};
  };
  const accountSlug=()=>{
    const keys=['currentUsername','username','loggedInUser','repoUser','activeUser'];
    for(const key of keys){try{const v=localStorage.getItem(key);if(v)return slug(v);}catch(_e){}}
    return slug(document.querySelector('[data-account-username],.velmora-account-avatar-label,#currentUserName,.account-username')?.textContent||'guest');
  };
  const isAdmin=()=>accountSlug()==='admin';
  const previewDay=()=>{if(!isAdmin())return 0;try{const n=Number(sessionStorage.getItem('dragonboundCalendarPreviewDay')||0);return n>=1&&n<=31?n:0;}catch(_e){return 0;}};
  const calendarState=()=>{const real=realCalendar(),preview=previewDay();return preview?{...real,day:preview,preview:true}:real;};
  const getEvent=day=>EVENTS[Math.max(1,Math.min(31,Number(day)||0))]||null;
  const getToday=()=>{const c=calendarState(),ev=getEvent(c.day);return{...c,event:ev?clone(ev):null};};
  const daysUntil=id=>{const target=EVENT_LIST.find(e=>e.id===id);if(!target)return null;const d=calendarState().day;return(target.day-d+31)%31;};
  const getUpcoming=(limit=4)=>{
    const d=calendarState().day;
    return EVENT_LIST.map(e=>({...e,daysAway:(e.day-d+31)%31})).filter(e=>e.daysAway>0).sort((a,b)=>a.daysAway-b.daysAway).slice(0,Math.max(1,limit));
  };
  const currentEventInternal=()=>getEvent(calendarState().day);

  const traitSet=actor=>new Set([...(actor?.assignedTraits||[]),...(actor?.personalityUniverseAllTraits?.()||[])].map(String));
  const actionBias=(action,actor)=>{
    const ev=currentEventInternal();if(!ev)return 0;
    let score=Number(ev.behaviourBias?.[action]||0),traits=traitSet(actor);
    if(ev.id==='heartbond-day'&&(traits.has('Affectionate')||traits.has('Cuddlebug')||traits.has('Keeper-Focused'))&&(action==='resting'||action==='sitting'))score+=3;
    if(ev.id==='mudhop-day'&&(traits.has('Mud Lover')||traits.has('Playful')||traits.has('Messy'))&&(action==='zoomies'||action==='explore'))score+=5;
    if(ev.id==='moonwatch'&&(traits.has('Window Watcher')||traits.has('Night Owl'))&&(action==='looking'||action==='resting'))score+=4;
    if((ev.id==='starhearth'||ev.id==='starhearth-eve')&&traits.has('Sleepy')&&(action==='resting'||action==='sleeping'))score+=4;
    if((ev.id==='starhearth'||ev.id==='starhearth-eve')&&traits.has('Hyper')&&action==='zoomies')score+=3;
    return Math.min(18,score);
  };
  const furnitureBias=(tags,meta,actor)=>{
    const ev=currentEventInternal();if(!ev)return 0;
    const set=new Set((tags||[]).map(String));let score=0;
    Object.entries(ev.furnitureBias||{}).forEach(([tag,val])=>{if(set.has(tag))score+=Number(val)||0;});
    const traits=traitSet(actor);
    if(ev.id==='keepers-feast'&&(traits.has('Greedy')||traits.has('Foodie')||traits.has('Treat Obsessed'))&&(set.has('food')||set.has('drink')))score+=5;
    if(ev.id==='lantern-night'&&traits.has('Fireplace Lover')&&set.has('warm'))score+=5;
    if(ev.id==='moonwatch'&&traits.has('Window Watcher')&&set.has('window'))score+=5;
    return Math.min(22,score);
  };

  window.DragonboundCalendar={
    version:VERSION,getDay:()=>calendarState().day,getToday:()=>clone(getToday()),today:()=>clone(getToday()),getUpcoming:n=>clone(getUpcoming(n)),getEvent:day=>clone(getEvent(day)),event:()=>clone(currentEventInternal()),isEvent:id=>currentEventInternal()?.id===id,daysUntil,actionBias,furnitureBias
  };

  const engine=()=>window.DragonboundBabyEngine||null;
  const actor=()=>engine()?.actor||null;
  const ensureSocial=()=>{
    const a=actor();if(!a)return null;a.memory=a.memory||{};
    const s=a.memory.socialUniverse&&typeof a.memory.socialUniverse==='object'?a.memory.socialUniverse:(a.memory.socialUniverse={version:1,relationships:{},socialMoments:[],milestones:{}});
    s.version=1;s.relationships=s.relationships&&typeof s.relationships==='object'?s.relationships:{};s.socialMoments=Array.isArray(s.socialMoments)?s.socialMoments.slice(-30):[];s.milestones=s.milestones&&typeof s.milestones==='object'?s.milestones:{};
    if(!s.relationships.keeper){const b=clamp(a.bond||0,0,100);s.relationships.keeper={id:'keeper',name:'Keeper',type:'keeper',familiarity:clamp(14+b*.54,0,100),trust:clamp(8+b*.48,0,100),affection:clamp(8+b*.44,0,100),comfort:clamp(8+b*.35,0,100),playAffinity:clamp(5+b*.14,0,100),curiosity:20,tolerance:70,protectiveness:0,jealousy:0,evidenceCounts:{},firstAt:Date.now(),lastAt:Date.now()};}
    return s;
  };
  const ensureCalendarHistory=()=>{
    const a=actor();if(!a)return null;a.memory=a.memory||{};
    const h=a.memory.calendarHistory&&typeof a.memory.calendarHistory==='object'?a.memory.calendarHistory:(a.memory.calendarHistory={version:1,firstEvents:{},eventMoments:[],eventStats:{}});
    h.version=1;h.firstEvents=h.firstEvents&&typeof h.firstEvents==='object'?h.firstEvents:{};h.eventMoments=Array.isArray(h.eventMoments)?h.eventMoments.slice(-25):[];h.eventStats=h.eventStats&&typeof h.eventStats==='object'?h.eventStats:{};return h;
  };
  const markDirty=()=>{const a=actor();if(!a)return;a.behaviourDirty=true;try{engine()?.saveBehaviourLocal?.();}catch(_e){}};
  const relationScore=r=>clamp((Number(r?.familiarity||0)*.22)+(Number(r?.trust||0)*.18)+(Number(r?.affection||0)*.22)+(Number(r?.comfort||0)*.22)+(Number(r?.playAffinity||0)*.11)+(Number(r?.curiosity||0)*.05),0,100);
  const relationStage=(r,social=null)=>{
    if(!r)return{name:'Not Met',rank:0,note:'No shared household moments have been recorded yet.'};
    if(social?.favouriteCompanion&&social.favouriteCompanion===r.id)return{name:'Favourite Companion',rank:7,note:'Again and again, this is the companion your dragon chooses.'};
    const score=relationScore(r),play=Number(r.playAffinity||0);
    if(score>=76)return{name:'Deeply Bonded',rank:6,note:'Comfort and trust have become part of everyday life.'};
    if(score>=61)return{name:'Close Friend',rank:5,note:'Frequently chooses to spend calm, comfortable time nearby.'};
    if(play>=52&&score>=45)return{name:'Playmate',rank:4,note:'Shared play has become a recognisable part of their relationship.'};
    if(score>=43)return{name:'Friendly',rank:3,note:'The household feels easier when this familiar face is around.'};
    if(score>=26)return{name:'Familiar',rank:2,note:'They recognise one another and are settling into a shared routine.'};
    if(score>=12)return{name:'Curious',rank:1,note:'Your dragon has started paying real attention to this companion.'};
    return{name:'Noticed',rank:1,note:'A new face in the household is beginning to register.'};
  };
  const petTargetId=pet=>pet?`pet:${slug(pet.breedId||pet.id)}`:'';
  const safeJson=(value,fallback={})=>{try{return JSON.parse(value||'null')||fallback;}catch(_e){return fallback;}};
  const bedroomPetCandidates=()=>{
    const rows=[];
    try{
      const rawUser=(localStorage.getItem('currentUsername')||localStorage.getItem('username')||localStorage.getItem('loggedInUser')||localStorage.getItem('repoUser')||localStorage.getItem('activeUser')||'').trim();
      const keys=new Set([
        `velmoraBedroomPet:v1:${accountSlug()}`,
        rawUser?`velmoraBedroomPet:v1:${rawUser.toLowerCase()}`:'',
        rawUser?`velmoraBedroomPet:v1:${slug(rawUser)}`:''
      ].filter(Boolean));
      for(let i=0;i<localStorage.length;i++){
        const key=localStorage.key(i);
        if(key&&key.startsWith('velmoraBedroomPet:v1:'))keys.add(key);
      }
      keys.forEach(key=>{
        const value=safeJson(localStorage.getItem(key),{});
        if(value&&typeof value==='object')rows.push({...value,_key:key});
      });
    }catch(_e){}
    return rows;
  };
  const activeBedroomPet=()=>{
    try{
      const api=window.VelmoraBedroom,apiState=api?.petState?.()||{},saved=bedroomPetCandidates();
      const selectedId=String(apiState?.selectedId||saved.find(v=>v?.selectedId)?.selectedId||'').trim();
      if(!selectedId)return null;
      const matching=saved.filter(v=>String(v?.selectedId||'').trim()===selectedId);
      const newest=matching.sort((a,b)=>new Date(b?.updatedAt||0).getTime()-new Date(a?.updatedAt||0).getTime())[0]||saved[0]||{};
      const ps={...newest,...apiState,selectedId};
      const def=(api?.pets||[]).find(p=>p.id===selectedId)||{id:selectedId,name:selectedId.replace(/^(cat|dog)_/,'').split('_').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '),type:selectedId.startsWith('cat_')?'cat':selectedId.startsWith('dog_')?'dog':'pet',width:selectedId.startsWith('dog_')?5.2:4,speed:.072};
      const name=String(newest?.nickname||ps?.nickname||'').trim()||String(def?.name||'Companion').trim()||'Companion';
      return{id:petTargetId({breedId:def.id,name}),breedId:def.id,name,type:def.type||'pet',width:Number(def.width)||5,speed:Number(def.speed)||.072,portrait:`assets/bedroom/pets/${def.id}/idle-0.png`};
    }catch(_e){return null;}
  };
  const relationshipModifiers=(kind,a)=>{
    const traits=traitSet(a),m={familiarity:1,trust:1,affection:1,comfort:1,playAffinity:1,curiosity:1};
    if(traits.has('Affectionate')||traits.has('Cuddlebug')){m.affection*=1.18;m.comfort*=1.08;}
    if(traits.has('Shy')){m.familiarity*=.84;m.curiosity*=.82;m.trust*=1.04;}
    if(traits.has('Independent')||traits.has('Independent Friend'))m.affection*=.88;
    if(traits.has('Curious')||traits.has('Explorer'))m.curiosity*=1.18;
    if(traits.has('Playful')||traits.has('Hyper'))m.playAffinity*=1.2;
    if(kind==='shared_rest'&&(traits.has('Sleepy')||traits.has('Quiet Companion')))m.comfort*=1.22;
    return m;
  };
  const RELATION_DELTAS={
    keeper_pet:{familiarity:.45,trust:1.5,affection:1.75,comfort:.9},keeper_greeting:{familiarity:1.0,trust:.55,affection:.7,comfort:.35},visit:{familiarity:2.6,curiosity:2.2,tolerance:.8},near:{familiarity:.85,comfort:.65,curiosity:.3},follow:{familiarity:1.0,curiosity:.9,playAffinity:.45},play:{familiarity:.8,affection:.45,playAffinity:2.5,curiosity:.5},shared_rest:{familiarity:.8,trust:.75,affection:1.0,comfort:2.5},window:{familiarity:.6,comfort:1.3,affection:.35},protective:{trust:.8,affection:.55,protectiveness:2.0}
  };
  const notableKinds=new Set(['visit','follow','play','shared_rest','window','protective']);
  const socialNotice=(title,copy)=>{
    const scene=document.querySelector('#dragonboundOverlay .dragonbound-home-scene');if(!scene||!scene.classList.contains('is-visible'))return;
    let el=scene.querySelector('.dragonbound-social-notice');if(!el){el=document.createElement('div');el.className='dragonbound-social-notice';scene.appendChild(el);}el.innerHTML=`<small>NEW BOND OBSERVATION</small><strong>${esc(title)}</strong><span>${esc(copy)}</span>`;el.classList.remove('is-visible');void el.offsetWidth;el.classList.add('is-visible');clearTimeout(el._hide);el._hide=setTimeout(()=>el.classList.remove('is-visible'),5200);
  };
  const updateFavouriteCompanion=s=>{
    const pets=Object.values(s.relationships||{}).filter(r=>r?.type==='cat'||r?.type==='dog'||r?.type==='pet');if(!pets.length)return;
    const ranked=pets.map(r=>({r,score:relationScore(r)})).sort((a,b)=>b.score-a.score);const best=ranked[0],second=ranked[1];if(best.score>=62&&(!second||best.score-second.score>=7))s.favouriteCompanion=best.r.id;
  };
  const recordSocialMoment=(targetId,kind,detail={})=>{
    const a=actor(),s=ensureSocial();if(!a||!s||!targetId)return null;
    const now=Date.now(),pet=detail.pet||null;let r=s.relationships[targetId];
    if(!r){r=s.relationships[targetId]={id:targetId,name:pet?.name||detail.name||(targetId==='keeper'?'Keeper':'Household companion'),type:pet?.type||detail.type||(targetId==='keeper'?'keeper':'pet'),breedId:pet?.breedId||'',portrait:pet?.portrait||'',familiarity:0,trust:0,affection:0,comfort:0,playAffinity:0,curiosity:8,tolerance:45,protectiveness:0,jealousy:0,evidenceCounts:{},firstAt:now,lastAt:now};}
    if(pet){r.name=pet.name;r.type=pet.type;r.breedId=pet.breedId;r.portrait=pet.portrait;}
    r.evidenceCounts=r.evidenceCounts&&typeof r.evidenceCounts==='object'?r.evidenceCounts:{};const lastKey=`last_${kind}`,cooldown=kind==='near'?22000:String(kind).startsWith('keeper_')?7000:26000;if(now-Number(r[lastKey]||0)<cooldown)return clone(r);r[lastKey]=now;
    const before=relationStage(r,s),delta=RELATION_DELTAS[kind]||RELATION_DELTAS.near,mods=relationshipModifiers(kind,a);
    for(const [key,val] of Object.entries(delta)){const mult=mods[key]||1;r[key]=clamp(Number(r[key]||0)+Number(val)*mult,0,100);}
    r.evidenceCounts[kind]=(Number(r.evidenceCounts[kind])||0)+1;r.lastAt=now;s.lastSocialAt=now;
    if(notableKinds.has(kind)){s.socialMoments.push({targetId,kind,name:r.name,at:now,eventId:currentEventInternal()?.id||'',detail:String(detail.note||'').slice(0,120)});s.socialMoments=s.socialMoments.slice(-30);}
    updateFavouriteCompanion(s);const after=relationStage(r,s);
    if(after.rank>before.rank&&after.rank>=3){const key=`stage:${targetId}:${after.name}`;if(!s.milestones[key]){s.milestones[key]=now;socialNotice(`${after.name} · ${r.name}`,after.note);try{a.rememberLifeEvent?.('bond',`${after.name}: ${r.name}`,after.note,`social-${slug(targetId)}-${slug(after.name)}`);}catch(_e){}}}
    if(kind==='shared_rest'){const key=`shared-rest:${targetId}`;if(!s.milestones[key]){s.milestones[key]=now;try{a.rememberLifeEvent?.('bond',`First shared rest with ${r.name}`,`${a.dragon?.name||'Your dragon'} settled down beside ${r.name}.`,`social-shared-rest-${slug(targetId)}`);}catch(_e){}}}
    markDirty();noteFestivalActivity(`social:${kind}`,{targetName:r.name,targetId});return clone(r);
  };
  const getRelationships=()=>clone(ensureSocial()?.relationships||{});
  const getRelationship=id=>clone(ensureSocial()?.relationships?.[id]||null);
  const getClosestCompanion=()=>{
    const s=ensureSocial();if(!s)return null;const rows=Object.values(s.relationships||{}).filter(r=>r.id!=='keeper').sort((a,b)=>relationScore(b)-relationScore(a));return rows[0]?clone(rows[0]):null;
  };
  window.DragonRelationshipSystem={version:VERSION,getRelationships,getRelationship,getKeeperRelationship:()=>getRelationship('keeper'),recordSocialMoment,getClosestCompanion,getActiveHouseholdPet:()=>clone(activeBedroomPet()),inviteHouseholdPet:()=>inviteHouseholdPet({manual:true})};

  const state={modal:null,launcher:null,selectedDay:0,boundaryTimer:0,announcementTimer:0,visitor:null,visitorRaf:0,visitorLast:0,visitorEndsAt:0,visitorNextDecisionAt:0,visitorNextSocialAt:0,festivalSession:null,autoInviteTimer:0};

  const petVisitPrefKey=()=>`dragonboundHouseholdVisits:${accountSlug()}`;
  const petVisitsEnabled=()=>{try{return localStorage.getItem(petVisitPrefKey())!=='off';}catch(_e){return true;}};
  const setPetVisitsEnabled=value=>{try{localStorage.setItem(petVisitPrefKey(),value?'on':'off');}catch(_e){}if(!value)stopVisitor();renderJournal();};

  const festivalSessionKey=()=>{const c=realCalendar(),ev=getEvent(c.day);return ev?`${c.dateKey}:${ev.id}`:'';};
  const startFestivalSession=()=>{
    if(previewDay())return;const c=realCalendar(),ev=getEvent(c.day);if(!ev){state.festivalSession=null;return;}
    const key=`${c.dateKey}:${ev.id}`;if(state.festivalSession?.key===key)return;
    state.festivalSession={key,eventId:ev.id,day:c.day,cycle:c.cycle,dateKey:c.dateKey,startedAt:Date.now(),activities:{},lastTargetName:'',meaningful:0,recorded:false};
  };
  function noteFestivalActivity(kind,detail={}){
    if(previewDay())return;startFestivalSession();const s=state.festivalSession;if(!s)return;s.activities[kind]=(Number(s.activities[kind])||0)+1;s.meaningful++;if(detail.targetName)s.lastTargetName=String(detail.targetName).slice(0,64);if(s.meaningful>=6&&Date.now()-s.startedAt>45000)finalizeFestivalSession(false);
  }
  const festivalCopy=(ev,s)=>{
    const keys=Object.entries(s.activities||{}).sort((a,b)=>Number(b[1])-Number(a[1]));const top=keys[0]?.[0]||'';
    if(top.startsWith('social:shared_rest')&&s.lastTargetName)return`Spent part of ${ev.name} settled comfortably beside ${s.lastTargetName}.`;
    if(top.startsWith('social:')&&s.lastTargetName)return`Kept drifting back toward ${s.lastTargetName} during ${ev.name}.`;
    if(top==='window')return ev.id==='lantern-night'?'Spent a while watching the Lantern Night glow from home.':`Spent part of ${ev.name} quietly watching the world outside.`;
    if(top==='sleep'||top==='rest')return`Found a comfortable place to settle during ${ev.name}.`;
    if(top==='play'||top==='zoomies')return`Turned ${ev.name} into an excuse for an especially lively spell around the house.`;
    if(top==='keeper')return`Kept checking in with the keeper during ${ev.name}.`;
    if(top==='eat')return`Made the food side of ${ev.name} a personal priority.`;
    if(top==='training')return`Still found time for a little practice during ${ev.name}.`;
    if(top==='bath')return`Apparently ${ev.name} was also an excellent day for a proper clean.`;
    if(top==='furniture')return`Spent part of ${ev.name} inspecting the household as if something had changed.`;
    return`Spent a little time at home during ${ev.name}.`;
  };
  function finalizeFestivalSession(force=false){
    const s=state.festivalSession,a=actor();if(!s||s.recorded||previewDay()||!a)return;if(s.meaningful<1)return;if(s.meaningful<2&&!force)return;
    const ev=EVENT_LIST.find(e=>e.id===s.eventId);if(!ev)return;const h=ensureCalendarHistory();if(!h)return;const unique=s.key;
    if(h.eventMoments.some(m=>m.key===unique)){s.recorded=true;return;}
    const copy=festivalCopy(ev,s),moment={key:unique,eventId:ev.id,eventName:ev.name,day:s.day,cycle:s.cycle,at:Date.now(),detail:copy};h.eventMoments.push(moment);h.eventMoments=h.eventMoments.slice(-25);h.firstEvents[ev.id]=h.firstEvents[ev.id]||moment.at;h.eventStats[ev.id]=(Number(h.eventStats[ev.id])||0)+1;s.recorded=true;
    if(ev.id==='starhearth'&&!h.firstEvents.firstStarhearth){h.firstEvents.firstStarhearth=moment.at;try{a.rememberLifeEvent?.('festival','First Starhearth','Our first Starhearth together.','first-starhearth');}catch(_e){}}
    if(ev.importance==='major'){try{a.rememberLifeEvent?.('festival',`${ev.name} · Cycle ${s.cycle}`,copy,`festival-${ev.id}-${s.cycle}`);}catch(_e){}}
    markDirty();
  }

  const eventIcon=ev=>ev?`<img src="${esc(ev.icon)}" alt="">`:'';
  const launcherText=()=>{const c=getToday(),ev=c.event,next=getUpcoming(1)[0],note=ev?.name||(next?.daysAway===1?`Tomorrow · ${next.name}`:'A quiet day');return`<span class="velmora-calendar-pin"></span>${ev?eventIcon(ev):`<b class="velmora-calendar-mini-day">${c.day}</b>`}<span><small>VELMORAN DAY</small><strong>${c.day}</strong><em>${esc(note)}</em></span>`;};
  const ensureLauncher=()=>{
    const scene=document.querySelector('#dragonboundOverlay .dragonbound-home-scene');if(!scene)return null;let el=scene.querySelector('.velmora-calendar-launcher');
    if(!el){el=document.createElement('div');el.className='velmora-calendar-launcher';el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label','Open the Velmoran Calendar');el.addEventListener('click',openCalendar);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openCalendar();}});scene.appendChild(el);}el.innerHTML=launcherText();state.launcher=el;return el;
  };
  const ensureModal=()=>{
    const root=document.querySelector('#dragonboundOverlay')||document.body;if(state.modal?.isConnected)return state.modal;let modal=root.querySelector('.velmora-calendar-overlay');
    if(!modal){modal=document.createElement('div');modal.className='velmora-calendar-overlay';modal.setAttribute('aria-hidden','true');modal.innerHTML=`<div class="velmora-calendar-backdrop"></div><section class="velmora-calendar-book" role="dialog" aria-modal="true" aria-label="Velmoran Calendar"><div class="velmora-calendar-ribbon">VELMORAN CYCLE</div><div class="velmora-calendar-heading"><div><small>DRAGONBOUND HOUSEHOLD ALMANAC</small><h2>The Velmoran Calendar</h2><p>31 days · one shared cycle · many little stories</p></div><div class="velmora-calendar-cycle" data-cycle></div></div><div class="velmora-calendar-layout"><div class="velmora-calendar-grid-wrap"><div class="velmora-calendar-grid" data-calendar-grid></div><div class="velmora-calendar-legend"><span><i class="is-major"></i>Major festival</span><span><i class="is-tradition"></i>Tradition</span><span><i class="is-minor"></i>Special day</span></div></div><aside class="velmora-calendar-detail" data-calendar-detail></aside></div><div class="velmora-calendar-upcoming" data-calendar-upcoming></div><div class="velmora-calendar-close" role="button" tabindex="0" aria-label="Close calendar">×</div></section>`;root.appendChild(modal);
      const close=()=>closeCalendar();modal.querySelector('.velmora-calendar-backdrop').addEventListener('click',close);const x=modal.querySelector('.velmora-calendar-close');x.addEventListener('click',close);x.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();close();}});modal.querySelector('[data-calendar-grid]').addEventListener('click',e=>{const cell=e.target.closest('[data-day]');if(!cell)return;state.selectedDay=Number(cell.dataset.day)||getToday().day;renderCalendarModal();});modal.querySelector('[data-calendar-grid]').addEventListener('keydown',e=>{const cell=e.target.closest('[data-day]');if(!cell||(e.key!=='Enter'&&e.key!==' '))return;e.preventDefault();state.selectedDay=Number(cell.dataset.day)||getToday().day;renderCalendarModal();});
    }state.modal=modal;return modal;
  };
  const renderCalendarModal=()=>{
    const modal=ensureModal(),today=getToday(),selected=state.selectedDay||today.day,ev=getEvent(selected);if(!modal)return;
    modal.querySelector('[data-cycle]').innerHTML=`<small>CURRENT CYCLE</small><strong>${today.cycle}</strong><span>${today.preview?'ADMIN PREVIEW · ':''}Day ${today.day} / 31</span>`;
    modal.querySelector('[data-calendar-grid]').innerHTML=Array.from({length:31},(_,i)=>i+1).map(day=>{const e=getEvent(day),classes=['velmora-calendar-day'];if(day===today.day)classes.push('is-today');if(day===selected)classes.push('is-selected');if(e)classes.push(`is-${e.importance}`);return`<div class="${classes.join(' ')}" data-day="${day}" role="button" tabindex="0" title="${e?esc(e.name):`Day ${day}`}" style="--event-accent:${e?.accent||'#7a6848'}"><b>${day}</b>${e?`${eventIcon(e)}<small>${esc(e.name)}</small>`:'<span class="velmora-calendar-day-mark">·</span>'}${day===today.day?'<em>TODAY</em>':''}</div>`;}).join('');
    const detail=modal.querySelector('[data-calendar-detail]');if(ev){const until=(ev.day-today.day+31)%31;detail.innerHTML=`<div class="velmora-calendar-detail-icon" style="--event-accent:${ev.accent}">${eventIcon(ev)}</div><small>${selected===today.day?'TODAY · ':''}DAY ${selected}</small><h3>${esc(ev.name)}</h3><p>${esc(ev.description)}</p><div class="velmora-calendar-detail-note"><span>${until===0?'Happening across Velmora today':`${until} day${until===1?'':'s'} from now`}</span><em>${ev.importance==='major'?'Major festival':ev.importance==='tradition'?'Velmoran tradition':'Special day'}</em></div>`;}else detail.innerHTML=`<div class="velmora-calendar-quiet-seal"><span>${selected}</span></div><small>DAY ${selected}</small><h3>A quiet Velmoran day</h3><p>No formal festival is marked here. Ordinary days are where most household habits, favourite spots and little stories happen.</p><div class="velmora-calendar-detail-note"><span>No chores. No missed rewards.</span><em>Just another day together.</em></div>`;
    const upcoming=getUpcoming(4);modal.querySelector('[data-calendar-upcoming]').innerHTML=`<strong>COMING UP</strong>${upcoming.map(e=>`<div><img src="${esc(e.icon)}" alt=""><span><b>${esc(e.name)}</b><small>Day ${e.day} · ${e.daysAway} day${e.daysAway===1?'':'s'} away</small></span></div>`).join('')}`;
  };
  function openCalendar(){state.selectedDay=getToday().day;const modal=ensureModal();renderCalendarModal();modal?.classList.add('is-visible');modal?.setAttribute('aria-hidden','false');}
  function closeCalendar(){state.modal?.classList.remove('is-visible');state.modal?.setAttribute('aria-hidden','true');}

  const decorHtml=ev=>{
    const dots=(cls,n)=>Array.from({length:n},(_,i)=>`<i class="${cls}" style="--i:${i};--x:${8+(i*13)%86}%;--y:${10+(i*17)%78}%;--d:${8+(i%5)*1.7}s;--delay:${-(i*.8)}s"></i>`).join('');
    switch(ev?.atmosphere){
      case'newleaf':return`<div class="velmora-event-leaves">${dots('velmora-event-leaf',7)}</div>`;
      case'mudhop':return'<div class="velmora-event-footprints"><i></i><i></i><i></i></div>';
      case'moonwatch':return`<div class="velmora-event-moonwash"></div>${dots('velmora-event-star',8)}`;
      case'heartbond':return`${dots('velmora-event-heartglint',5)}`;
      case'fair':return'<div class="velmora-event-bunting"><i></i><i></i><i></i><i></i><i></i><i></i></div>';
      case'hatchling':return`${dots('velmora-event-star',6)}`;
      case'lantern':return`<div class="velmora-event-warmth"></div><div class="velmora-event-lanterns"><i></i><i></i><i></i></div>${dots('velmora-event-mote',10)}`;
      case'feast':return'<div class="velmora-event-feast-garland"></div>';
      case'frostwake':return`<div class="velmora-event-frost"></div>${dots('velmora-event-frostspark',9)}`;
      case'starhearth-eve':return`<div class="velmora-event-star-garland"></div>${dots('velmora-event-mote',10)}${dots('velmora-event-star',7)}`;
      case'starhearth':return`<div class="velmora-event-starhearth-warmth"></div><div class="velmora-event-star-garland is-full"></div><div class="velmora-event-lanterns is-starhearth"><i></i><i></i><i></i></div>${dots('velmora-event-mote',12)}${dots('velmora-event-star',10)}`;
      default:return'';
    }
  };
  const syncDecor=()=>{
    const scene=document.querySelector('#dragonboundOverlay .dragonbound-home-scene');if(!scene)return;scene.querySelector('.velmora-festival-layer')?.remove();const ev=currentEventInternal();if(!ev)return;const layer=document.createElement('div');layer.className=`velmora-festival-layer is-${ev.id}`;layer.setAttribute('aria-hidden','true');layer.innerHTML=decorHtml(ev);scene.appendChild(layer);
  };
  const festivalSeenKey=ev=>{const a=actor();return`dragonboundFestivalSeen:${slug(a?.dragon?.id||accountSlug())}:${realCalendar().dateKey}:${ev.id}`;};
  const showFestivalAnnouncement=()=>{
    const ev=currentEventInternal(),scene=document.querySelector('#dragonboundOverlay .dragonbound-home-scene');if(!ev||!scene)return;const preview=!!previewDay();if(!preview){try{if(localStorage.getItem(festivalSeenKey(ev))==='1')return;localStorage.setItem(festivalSeenKey(ev),'1');}catch(_e){}}
    let el=scene.querySelector('.velmora-festival-announcement');if(!el){el=document.createElement('div');el.className='velmora-festival-announcement';scene.appendChild(el);}el.innerHTML=`${eventIcon(ev)}<div><small>${preview?'ADMIN EVENT PREVIEW':'TODAY ACROSS VELMORA'} · DAY ${calendarState().day}</small><strong>${esc(ev.name)}</strong><p>${esc(ev.description)}</p></div>`;el.classList.remove('is-visible');void el.offsetWidth;el.classList.add('is-visible');clearTimeout(state.announcementTimer);state.announcementTimer=setTimeout(()=>el.classList.remove('is-visible'),6800);
  };

  const relationshipObservation=r=>{
    const stage=relationStage(r,ensureSocial());const c=r?.evidenceCounts||{};
    if(Number(c.shared_rest)>=2)return'Frequently chooses to settle nearby when things get quiet.';
    if(Number(c.play)>=2)return'Play is becoming the easiest way for these two to spend time together.';
    if(Number(c.follow)>=2)return'Has started following this familiar face around the house.';
    if(Number(c.window)>=2)return'They have developed a surprisingly peaceful habit of watching the world together.';
    return stage.note;
  };
  const renderBonds=(src)=>{
    const root=document.querySelector('#dragonboundOverlay [data-dragon-profile-bonds]');if(!root)return;const s=ensureSocial(),a=actor();if(!s||!a){root.innerHTML='<div class="dragonbound-social-empty"><strong>Still getting to know the household.</strong><span>Relationships begin once your dragon is home.</span></div>';return;}
    const keeper=s.relationships.keeper,keeperStage=relationStage(keeper,s),active=activeBedroomPet();const activeRel=active?s.relationships[active.id]:null,favourite=s.favouriteCompanion?s.relationships[s.favouriteCompanion]:null;
    const historic=Object.values(s.relationships).filter(r=>r.id!=='keeper'&&(!active||r.id!==active.id)).sort((x,y)=>relationScore(y)-relationScore(x)).slice(0,4);
    const rows=[];if(active)rows.push({pet:active,rel:activeRel});historic.forEach(rel=>rows.push({pet:{id:rel.id,name:rel.name,type:rel.type,breedId:rel.breedId,portrait:rel.portrait||`assets/bedroom/pets/${rel.breedId}/idle-0.png`},rel}));
    root.innerHTML=`<div class="dragonbound-social-lead"><div><small>KEEPER BOND</small><strong>${esc(keeperStage.name)}</strong><p>${esc(relationshipObservation(keeper))}</p></div><span class="dragonbound-social-seal"><i></i><b>HOME</b></span></div><div class="dragonbound-social-favourite"><small>FAVOURITE COMPANION</small><strong>${esc(favourite?.name||'Still choosing')}</strong><span>${esc(favourite?'This is the household companion your dragon keeps choosing when given the chance.':"Hasn't chosen a clear favourite companion yet.")}</span></div><div class="dragonbound-social-section-head"><span>Household Companions</span><small>Friendship is learned from real time spent together</small></div><div class="dragonbound-social-list">${rows.length?rows.map(({pet,rel})=>{const st=relationStage(rel,s);return`<article data-social-target="${esc(pet.id)}"><div class="dragonbound-social-portrait"><img src="${esc(pet.portrait||`assets/bedroom/pets/${pet.breedId}/idle-0.png`)}" alt="${esc(pet.name)}"></div><div class="dragonbound-social-copy"><small>${esc(String(pet.type||'pet').toUpperCase())}</small><strong>${esc(pet.name)}</strong><b>${esc(st.name)}</b><p>${esc(rel?relationshipObservation(rel):'Your dragon has not spent time with this household pet in the main house yet.')}</p></div>${active&&pet.id===active.id?`<div class="dragonbound-social-invite" role="button" tabindex="0" data-social-invite="${esc(active.id)}">${state.visitor?.pet?.id===active.id?'VISITING NOW':'INVITE TO HOME'}</div>`:''}</article>`;}).join(''):'<div class="dragonbound-social-empty"><strong>No household pet selected yet.</strong><span>Choose a cat or dog in your bedroom and they can gradually become part of your dragon\'s social world.</span></div>'}</div><div class="dragonbound-social-routines-book">${renderSocialRoutineText(s)}</div>`;
    if(!root.dataset.boundInvite){root.dataset.boundInvite='1';root.addEventListener('click',e=>{const btn=e.target.closest('[data-social-invite]');if(!btn)return;e.preventDefault();inviteHouseholdPet({manual:true});setTimeout(()=>renderBonds(src),80);});root.addEventListener('keydown',e=>{const btn=e.target.closest('[data-social-invite]');if(!btn||(e.key!=='Enter'&&e.key!==' '))return;e.preventDefault();inviteHouseholdPet({manual:true});setTimeout(()=>renderBonds(src),80);});}
  };
  const renderSocialRoutineText=s=>{
    const moments=Array.isArray(s?.socialMoments)?s.socialMoments:[],counts={};for(const m of moments){const key=`${m.targetId}|${m.kind}`,row=counts[key]||(counts[key]={targetId:m.targetId,kind:m.kind,name:m.name,count:0});row.count++;}const top=Object.values(counts).filter(r=>r.count>=2).sort((a,b)=>b.count-a.count).slice(0,3);
    if(!top.length)return'<small>SOCIAL ROUTINES</small><p>No repeating household routines confirmed yet.</p>';
    const phrase=r=>r.kind==='shared_rest'?`Often settles down beside ${r.name}.`:r.kind==='follow'?`Frequently follows ${r.name} for a while.`:r.kind==='play'?`Regularly tries to play with ${r.name}.`:r.kind==='window'?`Likes quiet window time with ${r.name}.`:`Often chooses to spend time near ${r.name}.`;
    return`<small>SOCIAL ROUTINES</small>${top.map(r=>`<p>${esc(phrase(r))}</p>`).join('')}`;
  };
  const hatchAnniversary=src=>{const ts=Number(src?.hatchedAt||0);if(!ts)return false;const a=ukParts(new Date(ts)),b=ukParts(new Date());return a.month===b.month&&a.day===b.day;}
  const renderCalendarJournal=(src={})=>{
    const root=document.querySelector('#dragonboundOverlay [data-dragon-profile-calendar]');if(!root)return;const today=getToday(),ev=today.event,up=getUpcoming(3),h=ensureCalendarHistory(),moments=(h?.eventMoments||[]).slice().sort((a,b)=>Number(b.at)-Number(a.at)).slice(0,5),anniversary=hatchAnniversary(src);
    root.innerHTML=`${anniversary?`<div class="dragonbound-calendar-anniversary"><img src="${ASSET_ROOT}hatchling-day.png" alt=""><div><small>HATCH DAY ANNIVERSARY</small><strong>Another year of your story together</strong><span>No aging change — just a little date worth remembering.</span></div></div>`:''}<div class="dragonbound-calendar-today" style="--event-accent:${ev?.accent||'#6e805d'}">${ev?eventIcon(ev):'<div class="dragonbound-calendar-day-number">'+today.day+'</div>'}<div><small>${today.preview?'ADMIN PREVIEW · ':''}DAY ${today.day} · CYCLE ${today.cycle}</small><strong>${esc(ev?.name||'A quiet Velmoran day')}</strong><p>${esc(ev?.description||'No formal festival is marked today. Ordinary days are where favourite spots, routines and tiny household stories take shape.')}</p></div><div class="dragonbound-calendar-open-full" role="button" tabindex="0" data-open-full-calendar>OPEN CALENDAR</div></div><div class="dragonbound-calendar-journal-grid"><section><div class="dragonbound-social-section-head"><span>Coming Up</span><small>No urgency — just things to look forward to</small></div>${up.map(e=>`<article class="dragonbound-calendar-upcoming-row"><img src="${esc(e.icon)}" alt=""><div><strong>${esc(e.name)}</strong><span>Day ${e.day} · ${e.daysAway} day${e.daysAway===1?'':'s'} away</span></div></article>`).join('')}</section><section><div class="dragonbound-social-section-head"><span>Festival Memories</span><small>Only moments that actually happened</small></div>${moments.length?moments.map(m=>`<article class="dragonbound-calendar-memory"><time>Cycle ${Number(m.cycle)||'—'} · Day ${Number(m.day)||'—'}</time><strong>${esc(m.eventName||getEvent(m.day)?.name||'Velmoran day')}</strong><p>${esc(m.detail||'')}</p></article>`).join(''):'<div class="dragonbound-social-empty is-small"><strong>No festival memories yet.</strong><span>They will appear only when something meaningful really happens.</span></div>'}</section></div>`;
    if(!root.dataset.boundCalendar){root.dataset.boundCalendar='1';const open=e=>{const btn=e.target.closest('[data-open-full-calendar]');if(!btn)return;e.preventDefault();openCalendar();};root.addEventListener('click',open);root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-open-full-calendar]'))open(e);});}
  };
  const renderJournal=src=>{renderBonds(src);renderCalendarJournal(src||{});const habitsPanel=document.querySelector('#dragonboundOverlay [data-dragon-journal-panel="habits"]');if(habitsPanel){let social=habitsPanel.querySelector('.dragonbound-habits-social-note');if(!social){social=document.createElement('div');social.className='dragonbound-habits-social-note';habitsPanel.appendChild(social);}const s=ensureSocial();social.innerHTML=s?renderSocialRoutineText(s):'';}};

  const visitorAsset=(pet,mode,frame)=>`assets/bedroom/pets/${pet.breedId}/${mode}-${frame%4}.png`;
  const chooseNearActorPoint=(a,eng)=>{
    if(!a||!eng)return null;for(let i=0;i<18;i++){const angle=Math.random()*Math.PI*2,r=.035+Math.random()*.065,p=[a.pos[0]+Math.cos(angle)*r,a.pos[1]+Math.sin(angle)*r*.7];if(eng.isWalkable?.(a.floorId,p))return p;}const nodes=eng.map?.floors?.find(f=>f.id===a.floorId)?.navigationNodes||[];return nodes.find(p=>eng.isWalkable?.(a.floorId,p))?.slice()||null;
  };
  const visitorRender=()=>{const v=state.visitor,eng=engine();if(!v?.el||!eng?.world)return;const p=eng.toPixels?.(v.pos);if(!p)return;v.el.style.left=`${p.x}px`;v.el.style.top=`${p.y}px`;v.el.style.width=`${v.pet.width}%`;v.el.style.zIndex=String(2400+Math.round(v.pos[1]*1200));v.el.classList.toggle('is-flipped',v.dir==='left');v.el.classList.toggle('is-sleeping',v.mode==='sleep');const img=v.el.querySelector('img'),src=visitorAsset(v.pet,v.mode==='walk'?'walk':v.mode==='sleep'?'sleep':'idle',v.frame);if(img&&img.getAttribute('src')!==src)img.src=src;};
  const stopVisitor=()=>{cancelAnimationFrame(state.visitorRaf);state.visitorRaf=0;if(state.visitor?.el?.isConnected)state.visitor.el.remove();state.visitor=null;};
  const visitorDecision=now=>{
    const v=state.visitor,a=actor(),eng=engine();if(!v||!a||!eng)return;if(v.floorId!==a.floorId){stopVisitor();return;}
    const target=Math.random()<.78?chooseNearActorPoint(a,eng):((eng.map?.floors?.find(f=>f.id===v.floorId)?.navigationNodes||[]).filter(p=>eng.isWalkable?.(v.floorId,p)).sort(()=>Math.random()-.5)[0]?.slice());
    if(!target){v.mode='idle';state.visitorNextDecisionAt=now+2800;return;}const path=eng.findPath?.(v.floorId,v.pos,target)||[];if(path.length){v.path=path;v.pathIndex=0;v.mode='walk';}else v.mode='idle';state.visitorNextDecisionAt=now+3500+Math.random()*3500;
  };
  const visitorSocialSample=now=>{
    const v=state.visitor,a=actor();if(!v||!a||now<state.visitorNextSocialAt)return;state.visitorNextSocialAt=now+4500;const d=Math.hypot(v.pos[0]-a.pos[0],(v.pos[1]-a.pos[1])*.8);if(d>.115)return;
    const stateName=String(a.state||''),resting=/sleep|rest|sit/.test(stateName)||/nap|quiet/.test(String(a.currentLifeEvent?.type||'')),lastActivity=String(a.universeLastActivity?.()?.kind||''),traits=traitSet(a);
    if(lastActivity==='window'&&Math.random()<.45)recordSocialMoment(v.pet.id,'window',{pet:v.pet,note:'Spent some quiet time watching the world together.'});
    else if(v.mode==='sleep'&&(traits.has('Protective')||traits.has('Protective Companion'))&&Math.random()<.36)recordSocialMoment(v.pet.id,'protective',{pet:v.pet,note:'Stayed close while a household companion rested.'});
    else if(resting&&Math.random()<.42){v.mode='sleep';v.path=[];v.pathIndex=0;state.visitorNextDecisionAt=now+7000+Math.random()*5000;recordSocialMoment(v.pet.id,'shared_rest',{pet:v.pet,note:'Rested nearby in the main house.'});}
    else if((traits.has('Playful')||traits.has('Hyper'))&&Math.random()<.24)recordSocialMoment(v.pet.id,'play',{pet:v.pet,note:'A little shared play broke out.'});
    else recordSocialMoment(v.pet.id,'near',{pet:v.pet,note:'Spent calm time nearby.'});
  };
  const visitorLoop=t=>{
    const v=state.visitor,eng=engine(),a=actor(),scene=document.querySelector('#dragonboundOverlay .dragonbound-home-scene'),covered=!!document.querySelector('.dragonbound-my-dragon-overlay.is-visible,.dragonbound-travel-menu.is-visible,.velmora-calendar-overlay.is-visible');if(!v||!eng||!a||!scene?.classList.contains('is-visible')||covered||Date.now()>=state.visitorEndsAt){stopVisitor();return;}const dt=Math.min(.05,((t-state.visitorLast)||16)/1000);state.visitorLast=t;
    if(v.mode==='walk'&&v.path?.length){const target=v.path[v.pathIndex];if(target){const dx=target[0]-v.pos[0],dy=target[1]-v.pos[1],dist=Math.hypot(dx,dy);if(Math.abs(dx)>.002)v.dir=dx<0?'left':'right';if(dist<.006){v.pos=target.slice();v.pathIndex++;if(v.pathIndex>=v.path.length){v.mode='idle';v.path=[];state.visitorNextDecisionAt=t+1200+Math.random()*2600;recordSocialMoment(v.pet.id,'follow',{pet:v.pet,note:'Followed the dragon around the house.'});}}else{const step=Math.min(dist,v.pet.speed*dt);v.pos=[v.pos[0]+dx/dist*step,v.pos[1]+dy/dist*step];}}}else if(v.mode==='sleep'){if(t>=state.visitorNextDecisionAt){v.mode='idle';state.visitorNextDecisionAt=t+1200;}}else if(t>=state.visitorNextDecisionAt)visitorDecision(t);
    v.frameTimer+=dt;const frameEvery=v.mode==='walk'?.15:v.mode==='sleep'?.62:.48;if(v.frameTimer>=frameEvery){v.frame=(v.frame+1)%4;v.frameTimer=0;}visitorSocialSample(t);visitorRender();state.visitorRaf=requestAnimationFrame(visitorLoop);
  };
  function inviteHouseholdPet({manual=false,source='manual'}={}){
    if(state.visitor)return clone(state.visitor.pet);const pet=activeBedroomPet(),a=actor(),eng=engine(),scene=document.querySelector('#dragonboundOverlay .dragonbound-home-scene'),covered=!!document.querySelector('.dragonbound-my-dragon-overlay.is-visible,.dragonbound-travel-menu.is-visible,.velmora-calendar-overlay.is-visible');if(!pet||!a||!eng?.world||!scene?.classList.contains('is-visible')||covered)return null;
    const sp=(eng.map?.spawnPoints||[]).find(s=>s.floorId===a.floorId&&eng.isWalkable?.(a.floorId,s.p))||{floorId:a.floorId,p:chooseNearActorPoint(a,eng)||a.pos.slice()};if(!sp?.p)return null;
    const el=document.createElement('div');el.className='dragonbound-social-pet-visitor';el.innerHTML=`<img src="${esc(visitorAsset(pet,'idle',0))}" alt="${esc(pet.name)}"><span>${esc(pet.name)}</span>`;eng.world.appendChild(el);
    state.visitor={pet,pos:sp.p.slice(),floorId:a.floorId,path:[],pathIndex:0,dir:'right',mode:'idle',frame:0,frameTimer:0,el};state.visitorEndsAt=Date.now()+90000+Math.random()*30000;state.visitorLast=performance.now();state.visitorNextDecisionAt=state.visitorLast+900;state.visitorNextSocialAt=state.visitorLast+2500;recordSocialMoment(pet.id,'visit',{pet,note:manual?'Invited into the main house.':'Visited during a special Velmoran day.'});visitorRender();state.visitorRaf=requestAnimationFrame(visitorLoop);return clone(pet);
  }

  const maybeAutoInviteFestivalPet=()=>{
    clearTimeout(state.autoInviteTimer);state.autoInviteTimer=0;if(previewDay())return;const ev=currentEventInternal();if(!ev||!['heartbond-day','lantern-night','starhearth-eve','starhearth'].includes(ev.id)||!activeBedroomPet())return;const key=`dragonboundFestivalPetVisit:${dateKey()}:${ev.id}`;try{if(sessionStorage.getItem(key)==='1')return;sessionStorage.setItem(key,'1');}catch(_e){}state.autoInviteTimer=setTimeout(()=>inviteHouseholdPet({manual:false,source:'festival-auto'}),3600);
  };

  const refreshAll=({announce=false}={})=>{ensureLauncher();if(state.launcher)state.launcher.innerHTML=launcherText();syncDecor();if(state.modal?.classList.contains('is-visible'))renderCalendarModal();renderJournal();if(announce)showFestivalAnnouncement();startFestivalSession();};
  const onHomeVisible=()=>{setTimeout(()=>refreshAll({announce:true}),60);maybeAutoInviteFestivalPet();};
  const onHouseClosed=()=>{finalizeFestivalSession(true);closeCalendar();stopVisitor();clearTimeout(state.autoInviteTimer);state.autoInviteTimer=0;const scene=document.querySelector('#dragonboundOverlay .dragonbound-home-scene');scene?.querySelector('.velmora-festival-layer')?.remove();scene?.querySelector('.velmora-festival-announcement')?.classList.remove('is-visible');};
  const onPersonalityActivity=e=>{const d=e?.detail||{},a=actor();if(!a||String(d.dragonId||'')&&String(d.dragonId)!==String(a.dragon?.id||''))return;const raw=String(d.raw||''),kind=String(d.kind||'');if(raw==='keeper:pet')recordSocialMoment('keeper','keeper_pet',{name:'Keeper',type:'keeper'});else if(raw==='keeper:greeting')recordSocialMoment('keeper','keeper_greeting',{name:'Keeper',type:'keeper'});noteFestivalActivity(kind,{name:d.meta?.name||''});};

  const nextUKBoundaryDelay=()=>{const start=dateKey(),now=Date.now();for(let step=1;step<=60;step++){const t=now+step*30*60*1000;if(dateKey(new Date(t))!==start)return Math.max(1000,t-now+1500);}return 6*60*60*1000;};
  const scheduleBoundary=()=>{clearTimeout(state.boundaryTimer);state.boundaryTimer=setTimeout(()=>{finalizeFestivalSession(true);state.festivalSession=null;refreshAll({announce:true});scheduleBoundary();},nextUKBoundaryDelay());};

  const debugSync=()=>{state.festivalSession=null;refreshAll({announce:true});};
  window.DragonCalendarDebug={version:VERSION,today(){if(!isAdmin())return null;return clone(getToday());},setPreviewDay(day){if(!isAdmin())return null;const n=Math.max(1,Math.min(31,Number(day)||1));try{sessionStorage.setItem('dragonboundCalendarPreviewDay',String(n));}catch(_e){}debugSync();return clone(getToday());},clearPreview(){if(!isAdmin())return null;try{sessionStorage.removeItem('dragonboundCalendarPreviewDay');}catch(_e){}debugSync();return clone(getToday());},events(){return isAdmin()?clone(EVENT_LIST):null;}};
  window.DragonRelationshipDebug={version:VERSION,inspect(){if(!isAdmin())return null;const s=ensureSocial();return s?clone({...s,relationships:Object.fromEntries(Object.entries(s.relationships).map(([k,r])=>[k,{...r,score:+relationScore(r).toFixed(2),stage:relationStage(r,s).name}]))}):null;},target(id){if(!isAdmin())return null;const s=ensureSocial(),r=s?.relationships?.[id];return r?clone({...r,score:+relationScore(r).toFixed(2),stage:relationStage(r,s)}):null;},explain(id){if(!isAdmin())return null;const s=ensureSocial(),r=s?.relationships?.[id];if(!r)return null;return{name:r.name,stage:relationStage(r,s).name,score:+relationScore(r).toFixed(2),evidence:clone(r.evidenceCounts||{}),traits:[...traitSet(actor())]};}};

  const init=()=>{ensureLauncher();ensureModal();renderJournal();refreshAll();scheduleBoundary();};
  window.addEventListener('dragonbound:home-visible',onHomeVisible);
  window.addEventListener('dragonbound:house-selected',()=>setTimeout(()=>refreshAll(),120));
  window.addEventListener('dragonbound:dragon-named',()=>setTimeout(()=>refreshAll(),160));
  window.addEventListener('dragonbound:house-closed',onHouseClosed);
  window.addEventListener('dragonbound:personality-activity',onPersonalityActivity);
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modal?.classList.contains('is-visible'))closeCalendar();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);

  window.DragonboundSocialCalendar={version:VERSION,renderJournal,openCalendar,closeCalendar,refresh:refreshAll,finalizeFestivalSession,inviteHouseholdPet,stopVisitor,petVisitsEnabled:()=>petVisitsEnabled(),setPetVisitsEnabled};
})();
