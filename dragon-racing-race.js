(function(){
  'use strict';
  if(window.__dragonRacingRaceV3372)return;
  window.__dragonRacingRaceV3372=true;

  const WORLD_W=1536,WORLD_H=1024,ASSET='dragon-racing-assets/velmora-city-circuit.webp',LAPS=3,RACER_COUNT=6;
  const RACE_MUSIC='dragon-racing-assets/audio/velmora-city-circuit.mp3';
  const WING_SOUNDS=['dragon-racing-assets/audio/wing-flap-01.mp3','dragon-racing-assets/audio/wing-flap-02.mp3'];
  const CROWD_SOUND='dragon-racing-assets/audio/stadium-crowd.mp3';
  const COUNTDOWN_SOUND='dragon-racing-assets/audio/city-circuit-countdown.mp3';
  const RACE_MUSIC_VOLUME=.36,CROWD_VOLUME=.07,COUNTDOWN_VOLUME=.45,RACE_NUMBER=1;
  const CITY_CIRCUIT_MARKS=[75,60,52,45,40,35];
  const CITY_CIRCUIT_ESTIMATED_CYCLE_MS=122000;
  const CITY_CIRCUIT_AVG_BASE_MARKS=CITY_CIRCUIT_MARKS.reduce((sum,v)=>sum+v,0)/CITY_CIRCUIT_MARKS.length;
  const CITY_CIRCUIT_AVG_MARKS_PER_HOUR=Math.round(CITY_CIRCUIT_AVG_BASE_MARKS*(3600000/CITY_CIRCUIT_ESTIMATED_CYCLE_MS));
  const COUNTDOWN_CUES=[{at:0,label:'3',lights:1},{at:1312,label:'2',lights:2},{at:2446,label:'1',lights:3},{at:3829,label:'GO!',lights:4}];
  const TAKEOFF_RUN_MS=720,TAKEOFF_MS=420,LAND_MS=390,LAND_RUN_MS=720;
  const FALLBACK_ANIMS={idle:[0],walk:[5,6,7],takeOff:[12,13],fly:[8,9,10,11,10,9],land:[14,15]};
  const RACE_BREED_PROFILES={
    'vardesh':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'lumerre':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'kordesh':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'nambara':{facing:'left',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'norveth':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'zafran':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'elvane':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'qasmir':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'calvora':{facing:'right',fly:[8, 9, 8, 9],takeOff:[12, 13],land:[14, 15]},
    'rovarn':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'talune':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'drazhen':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'belros':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'marovar':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'sorevia':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'iskandar':{facing:'left',fly:[8, 9, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'blackglass-coast':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'skallheim':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'hestholm-fjord':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'nyrgate-aurora':{facing:'left',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'warmvein-krellhaven':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'aurelia':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'orsanne':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'saint-ciro':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'marenza':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'grand-khor':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'rova-end':{facing:'left',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'zafir-row':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'ossa-mere':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
    'ashwick-cinderbank':{facing:'right',fly:[8, 9, 10, 11, 10, 9],takeOff:[12, 13],land:[14, 15]},
  };
  const RACE_SAFE_DEFAULT_PROFILE={facing:'right',fly:[8,9,10,11,10,9],takeOff:[12,13],land:[14,15]};
  const CHECKPOINTS=[.055,.12,.185,.25,.315,.38,.445,.51,.575,.64,.705,.77,.835,.9,.955];
  const CONTROL_POINTS=[
    [329,630],[365,660],[420,706],[490,754],[575,793],[670,818],[770,820],[870,800],[970,758],[1060,704],[1145,637],[1220,566],[1280,500],[1310,438],[1302,380],[1268,335],[1215,302],[1150,276],[1080,252],[1005,226],[930,202],[850,181],[775,169],[705,176],[650,195],[605,222],[565,252],[520,280],[466,306],[408,330],[350,353],[304,382],[270,418],[247,458],[238,500],[242,542],[258,578],[285,608],[329,630]
  ];
  const AI_POOL=[
    {id:'mica',name:'Mica',breed:'lumerre',personality:'Smooth and consistent',style:'smooth'},
    {id:'pip',name:'Pip',breed:'kordesh',personality:'Energetic overtaker',style:'overtaker'},
    {id:'nox',name:'Nox',breed:'zafran',personality:'Bold line-taker',style:'bold'},
    {id:'sorrel',name:'Sorrel',breed:'calvora',personality:'Cautious and clean',style:'cautious'},
    {id:'brindle',name:'Brindle',breed:'talune',personality:'Late-race charger',style:'late'},
    {id:'kestrel',name:'Kestrel',breed:'norveth',personality:'Patient drafter',style:'smooth'},
    {id:'tavi',name:'Tavi',breed:'elvane',personality:'Playful lane-switcher',style:'overtaker'},
    {id:'rook',name:'Rook',breed:'qasmir',personality:'Unflappable racer',style:'cautious'},
    {id:'ember',name:'Ember',breed:'drazhen',personality:'Fiery starter',style:'bold'},
    {id:'lumi',name:'Lumi',breed:'vardesh',personality:'Quiet late mover',style:'late'}
  ];
  const EXTRA_AI_NAMES=['Lark','Sable','Juniper','Rift','Pollen','Marble','Clover','Skiff','Thorn','Dapple','Vesper','Marlow','Quill','Bramble','Morrow','Cinder','Aster','Rill','Zephyr','Pebble','Fable','Torrent','Halo','Mistral'];
  const EXTRA_AI_PERSONALITIES=['Playful but committed','Always hunting a clean line','Crowd favourite flier','Calm under pressure','Quick out of the bends','Patient but sneaky','Loves a late move','Glides through busy corners'];
  const EXTRA_AI_STYLES=['smooth','overtaker','bold','cautious','late'];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const mod1=n=>((n%1)+1)%1;
  const lerp=(a,b,t)=>a+(b-a)*t;
  const normKey=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'guest';
  const now=()=>performance.now();
  const state={phase:'closed',game:null,viewport:null,world:null,racers:[],player:null,raf:0,lastT:0,raceStartedAt:0,finishAt:0,keys:{up:false,down:false,left:false,right:false,boost:false},camera:{x:WORLD_W/2,y:WORLD_H/2,zoom:1,targetX:WORLD_W/2,targetY:WORLD_H/2,targetZoom:1,mode:'wide',eventUntil:0,nextDecisionAt:0,nextEventAt:0,subjectIds:[],finalLapShown:false,finalStraightShown:false,photoFinishDone:false,forcedMode:''},samples:[],totalLength:0,debugPath:false,countdownToken:0,resultOrder:[],lapBannerTimer:0,raceMusic:null,wingAudio:[],crowdAudio:null,countdownAudio:null,nextWingAt:0,sequenceTimers:[],audioFadeToken:0,aiStatsPersisted:false,nextHudLayoutAt:0,rewardRunId:0,raceRewardSessionId:'',raceRewardPromise:null,raceRewardClaim:null,raceOrderIds:[],pendingOrderKey:'',pendingOrderAt:0,lastLeaderId:'',lastRaceEventAt:0,raceEventTimer:0,raceStory:{overtakes:0,leadChanges:0},finalLapDramaStarted:false,photoFinishHoldUntil:0,finishRevealTimer:0};

  function currentAccount(){
    try{if(typeof character!=='undefined'&&character?.username)return normKey(character.username);}catch(_e){}
    const candidates=['currentUsername','username','loggedInUser','repoUser','activeUser'];
    for(const key of candidates){try{const v=localStorage.getItem(key);if(v)return normKey(v);}catch(_e){}}
    const label=document.querySelector('.velmora-account-avatar-label,[data-account-username],#currentUserName,.account-username');
    return normKey(label?.textContent||'guest');
  }

  function raceDb(){try{return typeof db!=='undefined'?db:null;}catch(_e){return null;}}
  async function beginRaceRewardSession(runId){
    const dbc=raceDb();
    if(!dbc)return null;
    try{
      const {data,error}=await dbc.rpc('dragonbound_start_race_reward',{p_track_id:'velmora_city_circuit'});
      if(error)throw error;
      const row=Array.isArray(data)?data[0]:data;
      if(state.rewardRunId!==runId)return null;
      state.raceRewardSessionId=String(row?.sessionId||'');
      return state.raceRewardSessionId||null;
    }catch(err){
      if(state.rewardRunId===runId){state.raceRewardSessionId='';console.warn('[Dragon Racing] Keeper Mark reward session unavailable.',err);}
      return null;
    }
  }
  function marksForPosition(position){
    const index=Math.max(0,Math.min(CITY_CIRCUIT_MARKS.length-1,(Number(position)||1)-1));
    return CITY_CIRCUIT_MARKS[index];
  }
  function getRewardInfo(trackId='velmora_city_circuit'){
    if(trackId!=='velmora_city_circuit')return null;
    return {
      payouts:[...CITY_CIRCUIT_MARKS],
      averageBaseMarksPerRace:CITY_CIRCUIT_AVG_BASE_MARKS,
      estimatedCycleMs:CITY_CIRCUIT_ESTIMATED_CYCLE_MS,
      averageMarksPerHour:CITY_CIRCUIT_AVG_MARKS_PER_HOUR
    };
  }

  function rewardBreakdownText(reward){
    const b=reward?.breakdown||{},parts=[];
    if(Number(b.finish)>0)parts.push(`Finish ${Number(b.finish).toLocaleString('en-GB')}`);
    if(Number(b.personalBest)>0)parts.push(`PB +${Number(b.personalBest).toLocaleString('en-GB')}`);
    if(Number(b.bestLap)>0)parts.push(`Best lap +${Number(b.bestLap).toLocaleString('en-GB')}`);
    if(Number(b.firstRaceToday)>0)parts.push(`First race +${Number(b.firstRaceToday).toLocaleString('en-GB')}`);
    if(Number(b.firstWinToday)>0)parts.push(`First win +${Number(b.firstWinToday).toLocaleString('en-GB')}`);
    return parts.join(' · ');
  }
  function animateRewardNumber(el,total){
    if(!el)return;
    const target=Math.max(0,Number(total)||0),started=performance.now(),duration=620;
    const tick=t=>{const q=Math.min(1,(t-started)/duration),ease=1-Math.pow(1-q,3);el.textContent=`+${Math.round(target*ease).toLocaleString('en-GB')}`;if(q<1)requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
  }
  async function claimRaceReward(rank,finishMs,bestLapMs,card,runId){
    const status=card?.querySelector('[data-race-reward-status]'),totalEl=card?.querySelector('[data-race-reward-total]'),balanceEl=card?.querySelector('[data-race-reward-balance]'),rewardCard=card?.querySelector('[data-race-reward-card]'),rewardKicker=card?.querySelector('[data-race-reward-kicker]');
    const dbc=raceDb();
    if(!dbc){if(status)status.textContent='Keeper Mark rewards require a signed-in connection.';return null;}
    try{
      const sessionId=state.raceRewardSessionId||await state.raceRewardPromise;
      if(!sessionId||state.rewardRunId!==runId){if(status)status.textContent='Race reward could not be verified.';return null;}
      const {data,error}=await dbc.rpc('dragonbound_claim_race_reward',{p_session_id:sessionId,p_finish_position:Math.max(1,Math.min(6,Number(rank)||6)),p_finish_time_ms:Math.max(1,Math.round(Number(finishMs)||0)),p_best_lap_ms:Math.max(1,Math.round(Number(bestLapMs)||0))});
      if(error)throw error;
      if(state.rewardRunId!==runId)return data||null;
      const reward=data||{};
      state.raceRewardClaim=reward;
      if(status)status.textContent=rewardBreakdownText(reward)||'Finish reward';
      animateRewardNumber(totalEl,reward.totalMarks);
      if(balanceEl)balanceEl.textContent=`New balance · ${Number(reward.balance||0).toLocaleString('en-GB')} Marks`;
      if(rewardCard){rewardCard.classList.remove('is-pending');rewardCard.classList.add('is-awarded');}
      if(rewardKicker)rewardKicker.textContent='KEEPER MARKS AWARDED';
      const playerMarks=card?.querySelector('[data-race-marks-racer="player"]');
      if(playerMarks){
        const value=playerMarks.querySelector('b');
        if(value)value.textContent=`+${Number(reward.totalMarks||0).toLocaleString('en-GB')}`;
        playerMarks.classList.toggle('has-bonus',Number(reward.totalMarks||0)>marksForPosition(rank));
        playerMarks.title=Number(reward.totalMarks||0)>marksForPosition(rank)?'Includes your race bonuses':'Finish-position reward';
      }
      try{window.DragonboundFurniture?.refresh?.(false,true);}catch(_e){}
      try{window.dispatchEvent(new CustomEvent('dragonbound:keeper-marks-changed',{detail:{source:'dragon-racing',marks:Number(reward.totalMarks||0),balance:Number(reward.balance||0)}}));}catch(_e){}
      return reward;
    }catch(err){
      console.warn('[Dragon Racing] Keeper Mark reward claim failed.',err);
      if(status)status.textContent='Keeper Mark reward unavailable for this race.';
      if(totalEl)totalEl.textContent='—';
      if(balanceEl)balanceEl.textContent='';
      if(rewardCard){rewardCard.classList.remove('is-pending');rewardCard.classList.add('is-error');}
      return null;
    }
  }

  function getPlayerInfo(){
    const actor=document.querySelector('#dragonboundOverlay .dragonbound-baby-actor')||document.querySelector('.dragonbound-baby-actor');
    const img=actor?.querySelector('.dragonbound-baby-sprite,img');
    const breed=normKey(actor?.dataset?.breedId||'vardesh');
    const name=String(document.querySelector('[data-care-name]')?.textContent||img?.alt||'Your Dragon').trim()||'Your Dragon';
    return {name,breed,account:currentAccount(),sprite:img?.src||spriteSrc(breed,8)};
  }
  function saveKey(){const p=getPlayerInfo();return `velmoraDragonRacing:v1:${p.account}:${normKey(p.name)}:${p.breed}`;}
  function loadSave(){
    let data={version:2,level:1,xp:0,tracks:{},aiPool:{}};
    try{const raw=JSON.parse(localStorage.getItem(saveKey())||'null');if(raw&&typeof raw==='object')data={...data,...raw,tracks:{...(raw.tracks||{})},aiPool:{...(raw.aiPool||{})}};}catch(_e){}
    data.level=Math.max(1,Number(data.level)||1);data.xp=Math.max(0,Number(data.xp)||0);return data;
  }
  function saveData(data){try{localStorage.setItem(saveKey(),JSON.stringify({...data,lastSavedAt:Date.now()}));}catch(_e){}}
  function getProgression(){const s=loadSave();return {level:s.level,xp:s.xp};}
  function getTrackStats(id='velmora_city_circuit'){const s=loadSave();return {...(s.tracks?.[id]||{})};}
  function spriteSrc(breed,frame=8){return `assets/dragonbound/baby-dragons/${breed}/frame-${String(frame).padStart(2,'0')}.webp`;}
  function registryBreed(breed){return window.DragonboundBabyRegistry?.[breed]||null;}
  function registryFrameLookup(breed){
    const anims=registryBreed(breed)?.animations||{};
    const lookup=new Map();
    Object.values(anims).forEach(anim=>{
      (anim?.frames||[]).forEach(frame=>{
        const src=String(frame?.src||'');
        const match=src.match(/frame-(\d{2})\.(?:png|webp)/i);
        if(!match)return;
        const id=Number(match[1]);
        if(!lookup.has(id))lookup.set(id,{src,durationMs:Math.max(80,Number(frame?.durationMs)||145)});
      });
    });
    return lookup;
  }
  function buildRaceAnimFrames(breed,ids,key){
    const lookup=registryFrameLookup(breed);
    const duration=key==='walk'?185:key==='takeOff'?170:key==='land'?190:key==='fly'?145:900;
    const frames=ids.map(id=>lookup.get(id)||{src:spriteSrc(breed,id),durationMs:duration}).filter(f=>f?.src);
    return frames.map(f=>({src:f.src,durationMs:Math.max(80,Number(f.durationMs)||duration)}));
  }
  function raceBreedProfile(breed){
    const key=normKey(breed);
    const profile=RACE_BREED_PROFILES[key]||RACE_SAFE_DEFAULT_PROFILE;
    return {...RACE_SAFE_DEFAULT_PROFILE,...profile,fly:[...(profile.fly||RACE_SAFE_DEFAULT_PROFILE.fly)],takeOff:[...(profile.takeOff||RACE_SAFE_DEFAULT_PROFILE.takeOff)],land:[...(profile.land||RACE_SAFE_DEFAULT_PROFILE.land)]};
  }
  function animationFrames(breed,key){
    const profile=raceBreedProfile(breed);
    const approvedIds=Array.isArray(profile[key])?profile[key]:null;
    if(approvedIds?.length){
      const approvedFrames=buildRaceAnimFrames(breed,approvedIds,key);
      if(approvedFrames.length)return approvedFrames;
    }
    const frames=registryBreed(breed)?.animations?.[key]?.frames;
    if(Array.isArray(frames)&&frames.length)return frames.map(f=>({src:f.src,durationMs:Math.max(80,Number(f.durationMs)||145)}));
    return (FALLBACK_ANIMS[key]||FALLBACK_ANIMS.idle).map(frame=>({src:spriteSrc(breed,frame),durationMs:key==='walk'?185:key==='takeOff'?170:key==='land'?190:key==='fly'?145:900}));
  }
  function nativeFacingRight(breed){return raceBreedProfile(breed).facing!=='left';}
  function installRaceSpriteSafety(r){
    if(!r?.img)return;
    r.img.addEventListener('error',()=>{
      if(r.img.dataset.raceSpriteFallback==='1')return;
      r.img.dataset.raceSpriteFallback='1';
      r.img.src=animationFrames(r.breed,'idle')[0]?.src||spriteSrc(r.breed,0);
    });
  }
  function raceSpriteQaReport(){
    return Object.keys(RACE_BREED_PROFILES).map(breed=>{
      const p=raceBreedProfile(breed),registry=registryBreed(breed);
      return {breed,displayName:registry?.displayName||breed,facing:p.facing,flyFrames:[...p.fly],takeOffFrames:[...p.takeOff],landFrames:[...p.land],registryFacing:String(registry?.nativeFacing||''),registered:!!registry};
    });
  }
  function racerMotionState(r,t){
    if(r.finished){
      const since=Math.max(0,t-(r.finishAnimAt||t));
      if(since<LAND_MS)return'land';
      if(since<LAND_MS+LAND_RUN_MS)return'walk';
      return'idle';
    }
    if(state.phase!=='racing'&&state.phase!=='player_finished')return'idle';
    const elapsed=Math.max(0,t-state.raceStartedAt-(r.takeoffDelay||0));
    if(elapsed<TAKEOFF_RUN_MS)return'walk';
    if(elapsed<TAKEOFF_RUN_MS+TAKEOFF_MS)return'takeOff';
    return'fly';
  }
  function ensureRaceAudio(){
    if(!state.raceMusic){state.raceMusic=new Audio(RACE_MUSIC);state.raceMusic.loop=true;state.raceMusic.preload='auto';state.raceMusic.volume=RACE_MUSIC_VOLUME;}
    if(!state.wingAudio.length)state.wingAudio=WING_SOUNDS.map(src=>{const a=new Audio(src);a.preload='auto';return a;});
    if(!state.crowdAudio){state.crowdAudio=new Audio(CROWD_SOUND);state.crowdAudio.loop=true;state.crowdAudio.preload='auto';state.crowdAudio.volume=CROWD_VOLUME;}
    if(!state.countdownAudio){state.countdownAudio=new Audio(COUNTDOWN_SOUND);state.countdownAudio.preload='auto';state.countdownAudio.volume=COUNTDOWN_VOLUME;}
  }
  function fadeAudio(audio,target,ms=500){
    if(!audio)return;const token=++state.audioFadeToken,start=Number(audio.volume)||0,end=clamp(target,0,1),started=now(),duration=Math.max(1,ms);
    const tick=t=>{if(token!==state.audioFadeToken)return;const f=clamp((t-started)/duration,0,1);audio.volume=lerp(start,end,f);if(f<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);
  }
  function startRaceAudio(){
    ensureRaceAudio();
    const a=state.raceMusic;a.volume=.23;
    try{a.currentTime=0;const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_e){}
    const crowd=state.crowdAudio;crowd.volume=CROWD_VOLUME;
    try{crowd.currentTime=0;const p=crowd.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_e){}
    state.nextWingAt=now()+5000+Math.random()*5000;
  }
  function playCountdownAudio(){
    ensureRaceAudio();const a=state.countdownAudio;
    try{a.pause();a.currentTime=0;a.volume=COUNTDOWN_VOLUME;const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_e){}
  }
  function stopRaceAudio(reset=true){
    state.audioFadeToken++;
    if(state.raceMusic){try{state.raceMusic.pause();if(reset)state.raceMusic.currentTime=0;}catch(_e){}}
    if(state.crowdAudio){try{state.crowdAudio.pause();if(reset)state.crowdAudio.currentTime=0;}catch(_e){}}
    if(state.countdownAudio){try{state.countdownAudio.pause();if(reset)state.countdownAudio.currentTime=0;}catch(_e){}}
    for(const a of state.wingAudio){try{a.pause();if(reset)a.currentTime=0;}catch(_e){}}
    state.nextWingAt=0;
  }
  function stopTransientRaceAudio(reset=true){
    if(state.countdownAudio){try{state.countdownAudio.pause();if(reset)state.countdownAudio.currentTime=0;}catch(_e){}}
    for(const a of state.wingAudio){try{a.pause();if(reset)a.currentTime=0;}catch(_e){}}
    state.nextWingAt=0;
  }
  function maybePlayWingSound(t){
    if((state.phase!=='racing'&&state.phase!=='player_finished')||!state.raceStartedAt)return;
    if(t-state.raceStartedAt<TAKEOFF_RUN_MS+TAKEOFF_MS+900)return;
    if(t<state.nextWingAt)return;
    ensureRaceAudio();
    const choices=state.wingAudio.filter(a=>a.paused||a.ended);
    const a=(choices.length?choices:state.wingAudio)[Math.floor(Math.random()*Math.max(1,(choices.length?choices:state.wingAudio).length))];
    if(a){try{a.currentTime=0;a.volume=.14+Math.random()*.08;a.playbackRate=.96+Math.random()*.08;const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_e){}}
    state.nextWingAt=t+6500+Math.random()*6500;
  }
  function trainingModifiers(){
    const skills=window.DragonTraining?.getSkills?.()||{};
    const level=k=>Math.max(1,Number(skills?.[k]?.level)||1);
    return {agility:level('agility'),strength:level('strength'),endurance:level('endurance'),focus:level('focus'),flightControl:level('flightControl')};
  }
  function traitText(){return String(document.querySelector('[data-care-traits]')?.textContent||'').toLowerCase();}

  function catmull(p0,p1,p2,p3,t){
    const t2=t*t,t3=t2*t;
    return [
      .5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
      .5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
    ];
  }
  function buildSamples(){
    const pts=CONTROL_POINTS.slice(0,-1),raw=[];
    for(let i=0;i<pts.length;i++){
      const p0=pts[(i-1+pts.length)%pts.length],p1=pts[i],p2=pts[(i+1)%pts.length],p3=pts[(i+2)%pts.length];
      for(let s=0;s<10;s++)raw.push(catmull(p0,p1,p2,p3,s/10));
    }
    let total=0;for(let i=0;i<raw.length;i++){const a=raw[i],b=raw[(i+1)%raw.length];total+=Math.hypot(b[0]-a[0],b[1]-a[1]);a._len=total;}
    state.totalLength=total;state.samples=raw;
  }
  function pointAt(progress){
    const p=mod1(progress),samples=state.samples,n=samples.length,idx=p*n,i=Math.floor(idx)%n,f=idx-Math.floor(idx),a=samples[i],b=samples[(i+1)%n],prev=samples[(i-1+n)%n],next=samples[(i+2)%n];
    const x=lerp(a[0],b[0],f),y=lerp(a[1],b[1],f),tx=next[0]-prev[0],ty=next[1]-prev[1],mag=Math.hypot(tx,ty)||1,nx=-ty/mag,ny=tx/mag;
    const tx2=(b[0]-a[0]),ty2=(b[1]-a[1]),ang=Math.atan2(ty2,tx2);
    const halfWidth=44+(y/WORLD_H)*18;
    const prevAng=Math.atan2(a[1]-prev[1],a[0]-prev[0]),nextAng=Math.atan2(next[1]-b[1],next[0]-b[0]);
    let da=Math.abs(nextAng-prevAng);if(da>Math.PI)da=2*Math.PI-da;const curvature=clamp(da/.55,0,1);
    return {x,y,nx,ny,ang,halfWidth,curvature};
  }
  function worldPoint(racer){const p=pointAt(racer.distance);return {...p,x:p.x+p.nx*p.halfWidth*racer.lateral,y:p.y+p.ny*p.halfWidth*racer.lateral};}

  function makeAtmosphere(){
    const palette=[
      {flag:'#d85e4f',trim:'#ffe3a7'},{flag:'#f2bf53',trim:'#fff3c8'},{flag:'#56a9d9',trim:'#eefaff'},
      {flag:'#74c07f',trim:'#eef9e7'},{flag:'#9b73d9',trim:'#faf0ff'},{flag:'#d95f9d',trim:'#fff1f7'}
    ];
    const sparkles=Array.from({length:18},(_,i)=>`<i class="dragon-race-spark" style="left:${6+(i*11)%90}%;top:${8+(i*17)%78}%;--d:${5+(i%6)}s;--delay:${-(i%8)}s;--dx:${-12+(i%5)*7}px;--dy:${-5-(i%4)*4}px"></i>`).join('');
    const flags=Array.from({length:10},(_,i)=>{
      const color=palette[i%palette.length];
      return `<span class="dragon-race-fly-flag" style="left:${4+i*9.2}%;top:${13+(i%5)*8}%;--d:${13+(i%4)*2.4}s;--delay:${-(i*1.6)}s;--travel:${115+(i%3)*24}px;--lift:${-10-(i%4)*4}px;--sway:${2+(i%3)*1.8}deg;--flag:${color.flag};--trim:${color.trim};"></span>`;
    }).join('');
    const confettiColors=['#f4ce63','#ef6559','#5eb7e2','#73c686','#ffffff','#c481ff'];
    const confetti=Array.from({length:24},(_,i)=>{
      const c=confettiColors[i%confettiColors.length];
      return `<span class="dragon-race-confetti" style="left:${5+(i*3.7)%90}%;top:${-12-(i%4)*3}%;--x:${-28+(i%7)*9}px;--fall:${86+(i%4)*5}%;--rot:${420+(i%5)*110}deg;--delay:${-(i*0.8)}s;--d:${11+(i%5)*1.4}s;background:${c};"></span>`;
    }).join('');
    const burstPoints=[
      {left:18,top:32},{left:71,top:22},{left:22,top:61},{left:78,top:58},{left:57,top:76}
    ];
    const bursts=burstPoints.map((p,idx)=>`<div class="dragon-race-crowd-burst" style="left:${p.left}%;top:${p.top}%;--delay:${-(idx*2.1)}s;--d:${8.5+(idx%3)*1.8}s">${Array.from({length:10},(_,i)=>`<span class="dragon-race-crowd-burst-piece" style="--x:${-34+(i*7)}px;--y:${-16-(i%5)*8}px;--rot:${180+i*36}deg;background:${confettiColors[(i+idx)%confettiColors.length]}"></span>`).join('')}</div>`).join('');
    return `<div class="dragon-race-sun-glow"></div><div class="dragon-race-sun-rays"></div><div class="dragon-race-sparkles">${sparkles}</div><div class="dragon-race-fly-flags">${flags}</div><div class="dragon-race-confetti-field">${confetti}</div><div class="dragon-race-crowd-bursts">${bursts}</div>`;
  }


  function debugSvg(){
    const pts=state.samples.filter((_,i)=>i%3===0).map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const cps=CHECKPOINTS.map((p,i)=>{const q=pointAt(p);return `<circle cx="${q.x}" cy="${q.y}" r="7"><title>CP ${i+1}</title></circle>`}).join('');
    return `<svg class="dragon-race-debug-svg" viewBox="0 0 ${WORLD_W} ${WORLD_H}"><polyline points="${pts}"></polyline>${cps}</svg>`;
  }

  function ensureGame(){
    document.getElementById('dragon-race-sky-styles-v3360')?.remove();
    document.getElementById('dragon-race-sky-styles')?.remove();
    const shell=document.querySelector('#dragonRacingModal .dragon-racing-shell');if(!shell)return null;
    let game=shell.querySelector('.dragon-race-game');
    if(game){game.querySelector('.dragon-race-sky-overlay')?.remove();state.game=game;state.viewport=game.querySelector('.dragon-race-viewport');state.world=game.querySelector('.dragon-race-world');return game;}
    game=document.createElement('div');game.className='dragon-race-game';
    game.innerHTML=`<div class="dragon-race-viewport"><div class="dragon-race-world"><img class="dragon-race-world-bg" src="${ASSET}" alt="Velmora City Circuit"><div class="dragon-race-atmosphere">${makeAtmosphere()}</div>${debugSvg()}<div class="dragon-race-racers"></div></div><div class="dragon-race-cinematic-pass" aria-hidden="true"></div><div class="dragon-race-tv-glass" aria-hidden="true"></div><div class="dragon-race-hud"><div class="dragon-race-hud-top"><div class="dragon-race-hud-cluster"><div class="dragon-race-hud-box is-position"><small>POSITION</small><b data-race-position>— / 6</b></div><div class="dragon-race-hud-box"><small>LAP</small><b data-race-lap>1 / 3</b></div><div class="dragon-race-hud-box"><small>TIME</small><b data-race-time>00:00.00</b></div></div><div class="dragon-race-hud-box dragon-race-hud-dragon"><img data-race-player-icon alt=""><span><strong data-race-player-name>Your Dragon</strong><em>VELMORA CITY CIRCUIT</em></span></div></div><div class="dragon-race-auto-badge"><b>LIVE AUTONOMOUS RACE</b> · Velmora Racing Network</div><div class="dragon-race-live-leaderboard" aria-label="Live race order"><div class="dragon-race-live-leaderboard-head"><span>ORDER</span><em>VRN</em></div><div class="dragon-race-live-leaderboard-list"></div></div><div class="dragon-race-lap-banner"></div><div class="dragon-race-event-callout" aria-live="polite"><small data-race-event-kicker></small><b data-race-event-text></b></div><div class="dragon-race-exit" role="button" tabindex="0">EXIT RACE</div></div><div class="dragon-race-broadcast-title"><small>LIVE FROM VELMORA</small><b>VELMORA CITY CIRCUIT</b><em>RACE ${RACE_NUMBER}</em></div><div class="dragon-race-start-lights" aria-hidden="true"><i></i><i></i><i></i></div><div class="dragon-race-camera-cut" aria-hidden="true"></div><div class="dragon-race-countdown"><b></b></div></div><div class="dragon-race-results"><div class="dragon-race-results-card"></div></div>`;
    shell.appendChild(game);state.game=game;state.viewport=game.querySelector('.dragon-race-viewport');state.world=game.querySelector('.dragon-race-world');
    const exit=game.querySelector('.dragon-race-exit');bindAction(exit,()=>exitToTrackSelect());
    return game;
  }
  function bindAction(el,fn){if(!el)return;el.addEventListener('click',e=>{e.preventDefault();fn();});el.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();fn();});}
  function setPhase(phase){state.phase=phase;if(state.game)state.game.dataset.racePhase=phase;}
  function clearSequenceTimers(){for(const id of state.sequenceTimers)clearTimeout(id);state.sequenceTimers=[];}
  function queueSequence(fn,delay,token=state.countdownToken){const id=setTimeout(()=>{if(token!==state.countdownToken)return;fn();},delay);state.sequenceTimers.push(id);return id;}
  function shuffled(list){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function registryBreeds(){
    const keys=Object.keys(window.DragonboundBabyRegistry||{}).map(normKey).filter(Boolean);
    return (keys.length?keys:[...new Set(AI_POOL.map(x=>x.breed))]);
  }
  function expandedAiPool(){
    const pool=[],seenBreeds=new Set(),seenIds=new Set();
    for(const racer of AI_POOL){
      if(seenIds.has(racer.id))continue;
      pool.push({...racer});
      seenIds.add(racer.id);
      seenBreeds.add(racer.breed);
    }
    const breeds=registryBreeds().sort();
    let extraIndex=0;
    for(const breed of breeds){
      if(seenBreeds.has(breed))continue;
      const name=EXTRA_AI_NAMES[extraIndex%EXTRA_AI_NAMES.length];
      const personality=EXTRA_AI_PERSONALITIES[extraIndex%EXTRA_AI_PERSONALITIES.length];
      const style=EXTRA_AI_STYLES[extraIndex%EXTRA_AI_STYLES.length];
      pool.push({id:`${breed}-${normKey(name)}`,name,breed,personality,style});
      extraIndex++;
    }
    return pool;
  }
  function selectedAiPool(){
    const pool=expandedAiPool();
    const data=loadSave();
    const recent=Array.isArray(data.lastRaceAiIds)?data.lastRaceAiIds.filter(Boolean):[];
    const fresh=shuffled(pool.filter(r=>!recent.includes(r.id)));
    const selected=fresh.slice(0,RACER_COUNT-1);
    if(selected.length<RACER_COUNT-1){
      const fallback=shuffled(pool.filter(r=>!selected.some(s=>s.id===r.id))).slice(0,(RACER_COUNT-1)-selected.length);
      selected.push(...fallback);
    }
    data.lastRaceAiIds=selected.map(r=>r.id);
    saveData(data);
    return selected;
  }
  function clearRacers(){state.racers=[];state.player=null;state.game?.querySelector('.dragon-race-racers')?.replaceChildren();}

  function tinyPlayerRaceBias(skills,traits){
    const vals=['agility','strength','endurance','focus','flightControl'].map(k=>clamp(((Number(skills?.[k])||1)-1)/49,0,1));
    const avg=vals.reduce((a,b)=>a+b,0)/Math.max(1,vals.length);
    // Even a fully trained dragon only gains around four-tenths of one percent pace.
    let bias=avg*.004;
    const text=String(traits||'');
    if(/energetic|bold|brave|playful|focused|quick study|natural acrobat|born flyer/.test(text))bias+=.001;
    if(/sleepy|cautious|gentle|homebody/.test(text))bias-=.0005;
    return clamp(bias,-.0015,.005);
  }

  function makeAutoProfile(extraBias=0,identity=null){
    // Luck is intentionally the dominant factor so every dragon can genuinely win.
    const raceLuck=(Math.random()-.5)*.064; // ±3.2%
    const style=identity?.style||'neutral';
    return {
      base:.0265*(1+raceLuck+extraBias),raceLuck,extraBias,style,
      targetLane:(Math.random()-.5)*(style==='cautious'?.45:.72),laneAt:0,surge:0,surgeAt:0,
      mistake:style==='smooth'?.47:style==='cautious'?.44:Math.random(),boost:100,boostUntil:0,boostCooldown:700+Math.random()*1800
    };
  }

  const RACER_ACCENTS=['#66d5e8','#f0c45e','#ec7d6e','#7fc894','#9e83e0','#72aee8'];
  function normalizeAngle(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;}
  function racerAccent(r,index=0){return r?.isPlayer?'#6fd8ee':RACER_ACCENTS[(index+1)%RACER_ACCENTS.length];}
  function initLeaderboard(){
    const list=state.game?.querySelector('.dragon-race-live-leaderboard-list');
    if(!list)return;
    list.replaceChildren();
    state.racers.forEach((r,index)=>{
      r.accent=racerAccent(r,index);
      const row=document.createElement('div');
      row.className=`dragon-race-live-row${r.isPlayer?' is-player':''}`;
      row.dataset.racerId=r.id;
      row.style.setProperty('--racer-accent',r.accent);
      row.innerHTML=`<b class="dragon-race-live-rank">${index+1}</b><i class="dragon-race-live-marker"></i><span class="dragon-race-live-name">${r.name}</span><em class="dragon-race-live-change"></em>`;
      list.appendChild(row);
      r.leaderRow=row;r.lastBoardRank=index;r.rankFlashUntil=0;r.rankDirection=0;
    });
  }
  function updateLeaderboard(order,t){
    if(!order?.length)return;
    order.forEach((r,rank)=>{
      const row=r.leaderRow;if(!row)return;
      if(Number.isFinite(r.lastBoardRank)&&r.lastBoardRank!==rank){
        r.rankDirection=rank<r.lastBoardRank?1:-1;
        r.rankFlashUntil=t+560;
      }
      r.lastBoardRank=rank;
      row.style.transform=`translate3d(0,${rank*20}px,0)`;
      const rankEl=row.querySelector('.dragon-race-live-rank');if(rankEl)rankEl.textContent=String(rank+1);
      const change=row.querySelector('.dragon-race-live-change');
      const flashing=t<r.rankFlashUntil;
      row.classList.toggle('is-up',flashing&&r.rankDirection>0);
      row.classList.toggle('is-down',flashing&&r.rankDirection<0);
      if(change)change.textContent=flashing?(r.rankDirection>0?'▲':'▼'):'';
    });
  }
  function updateNameplates(order){
    const items=(order||[]).filter(r=>r&&!r.finished).map(r=>({r,p:worldPoint(r)})).sort((a,b)=>a.p.y-b.p.y);
    const occupied=[];
    items.forEach((item,index)=>{
      let tier=0;
      while(tier<3&&occupied.some(o=>o.tier===tier&&Math.abs(o.p.x-item.p.x)<74&&Math.abs(o.p.y-item.p.y)<42))tier++;
      tier=Math.min(tier,2);
      const side=tier?((index%2===0)?-1:1):0;
      const x=side*(5+tier*3),y=-(tier*9);
      item.r.tag?.style.setProperty('--tag-x',`${x}px`);
      item.r.tag?.style.setProperty('--tag-y',`${y}px`);
      occupied.push({p:item.p,tier});
    });
    order.forEach((r,rank)=>{const el=r.tag?.querySelector('[data-racer-position]');if(el)el.textContent=String(rank+1);});
  }

  function createRacers(){
    clearRacers();
    const holder=state.game.querySelector('.dragon-race-racers'),playerInfo=getPlayerInfo(),skills=trainingModifiers(),traits=traitText();
    const playerStart=1+Math.floor(Math.random()*4); // 2nd–5th grid placement
    const playerSlot=playerStart,aiSlots=[0,1,2,3,4,5].filter(i=>i!==playerSlot),playerBias=tinyPlayerRaceBias(skills,traits);
    const player={id:'player',name:playerInfo.name,breed:playerInfo.breed,isPlayer:true,slot:playerSlot,distance:-playerSlot*.0056,lateral:(playerSlot%2?-.27:.27),speed:0,boost:100,finished:false,finishMs:0,bestLapMs:0,lapStartedAt:0,lastLapCross:0,nextCp:0,frame:0,frameAt:0,animKey:'idle',animIndex:0,finishAnimAt:0,takeoffDelay:0,skills,traits,ai:makeAutoProfile(playerBias)};
    state.player=player;state.racers.push(player);
    selectedAiPool().forEach((identity,i)=>{
      const slot=aiSlots[i];
      state.racers.push({id:`ai-${identity.id}`,identityId:identity.id,name:identity.name,breed:identity.breed,personality:identity.personality,style:identity.style,isPlayer:false,slot,distance:-slot*.0056,lateral:(slot%2?-.25:.25)+((i%3)-1)*.05,speed:0,boost:100,finished:false,finishMs:0,bestLapMs:0,lapStartedAt:0,lastLapCross:0,nextCp:0,frame:0,frameAt:0,animKey:'idle',animIndex:0,finishAnimAt:0,takeoffDelay:0,ai:makeAutoProfile(0,identity)});
    });
    state.racers.forEach((r,index)=>{
      const el=document.createElement('div');el.className=`dragon-race-racer${r.isPlayer?' is-player':''}`;el.dataset.racerId=r.id;
      r.accent=racerAccent(r,index);el.style.setProperty('--racer-accent',r.accent);
      el.innerHTML=`<span class="dragon-race-flight-shadow" aria-hidden="true"></span><span class="dragon-race-speed-trail" aria-hidden="true"><i></i><i></i><i></i></span><div class="dragon-race-racer-sprite-wrap"><img src="${animationFrames(r.breed,'idle')[0]?.src||spriteSrc(r.breed,0)}" alt=""></div><span class="dragon-race-racer-tag"><i class="dragon-race-racer-marker"></i><b data-racer-position>${index+1}</b><span>${r.name}</span>${r.isPlayer?'<em>YOU</em>':''}</span>`;
      holder.appendChild(el);r.el=el;r.img=el.querySelector('img');r.spriteWrap=el.querySelector('.dragon-race-racer-sprite-wrap');r.shadow=el.querySelector('.dragon-race-flight-shadow');r.tag=el.querySelector('.dragon-race-racer-tag');r.trail=el.querySelector('.dragon-race-speed-trail');
      r.raceSpriteProfile=raceBreedProfile(r.breed);el.dataset.raceBreed=r.breed;el.dataset.raceFacing=r.raceSpriteProfile.facing;installRaceSpriteSafety(r);
      const altitudeSeed=((index*37)%9)-4;
      r.visual={bank:0,lean:0,lastLateral:r.lateral,lastSpeed:0,lastAt:0,bobPhase:Math.random()*Math.PI*2,altitudeBias:altitudeSeed*.42};
    });
    initLeaderboard();
    const hudImg=state.game.querySelector('[data-race-player-icon]');if(hudImg)hudImg.src=playerInfo.sprite;
    const hudName=state.game.querySelector('[data-race-player-name]');if(hudName)hudName.textContent=playerInfo.name;
  }

  function formatTime(ms){const v=Math.max(0,Number(ms)||0),m=Math.floor(v/60000),s=Math.floor((v%60000)/1000),h=Math.floor((v%1000)/10);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(h).padStart(2,'0')}`;}
  function formatGap(ms,base=0){return `+${formatTime(Math.max(0,(Number(ms)||0)-(Number(base)||0)))}`;}
  function formatRaceGap(ms){
    const v=Math.max(0,Number(ms)||0),seconds=v/1000;
    if(seconds<60)return`+${seconds.toFixed(2)}`;
    const m=Math.floor(seconds/60),s=seconds-m*60;
    return`+${m}:${s.toFixed(2).padStart(5,'0')}`;
  }
  function formatDeltaMs(ms,sign='-'){
    const seconds=Math.max(0,Number(ms)||0)/1000;
    return`${sign}${seconds<60?seconds.toFixed(2):`${Math.floor(seconds/60)}:${(seconds%60).toFixed(2).padStart(5,'0')}`}`;
  }
  function escapeRaceText(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function ordinal(n){const v=n%100;if(v>=11&&v<=13)return`${n}TH`;return`${n}${n%10===1?'ST':n%10===2?'ND':n%10===3?'RD':'TH'}`;}
  function showLapBanner(text){const el=state.game?.querySelector('.dragon-race-lap-banner');if(!el)return;clearTimeout(state.lapBannerTimer);el.textContent=text;el.classList.add('is-visible');state.lapBannerTimer=setTimeout(()=>el.classList.remove('is-visible'),1500);}

  function hideRaceEvent(){
    const el=state.game?.querySelector('.dragon-race-event-callout');
    if(!el)return;
    el.classList.remove('is-visible','is-leader','is-overtake','is-final','is-photo');
  }
  function showRaceEvent(kicker,text,kind='overtake',force=false){
    const el=state.game?.querySelector('.dragon-race-event-callout');
    if(!el)return;
    const t=now();
    if(!force&&t-state.lastRaceEventAt<1850)return;
    state.lastRaceEventAt=t;
    clearTimeout(state.raceEventTimer);
    el.classList.remove('is-visible','is-leader','is-overtake','is-final','is-photo');
    el.querySelector('[data-race-event-kicker]').textContent=String(kicker||'RACE UPDATE');
    el.querySelector('[data-race-event-text]').textContent=String(text||'');
    if(kind)el.classList.add(`is-${kind}`);
    void el.offsetWidth;
    el.classList.add('is-visible');
    const hold=kind==='photo'?2200:kind==='final'?1950:1500;
    state.raceEventTimer=setTimeout(()=>hideRaceEvent(),hold);
  }
  function detectRaceEvents(t){
    if((state.phase!=='racing'&&state.phase!=='player_finished')||!state.raceStartedAt||t-state.raceStartedAt<1200)return;
    const order=standings();
    const ids=order.map(r=>r.id);
    if(!state.raceOrderIds.length){state.raceOrderIds=ids;state.lastLeaderId=ids[0]||'';return;}
    const key=ids.join('|'),settledKey=state.raceOrderIds.join('|');
    if(key===settledKey){state.pendingOrderKey='';state.pendingOrderAt=0;return;}
    if(state.pendingOrderKey!==key){state.pendingOrderKey=key;state.pendingOrderAt=t;return;}
    if(t-state.pendingOrderAt<210)return;

    const previous=state.raceOrderIds.slice();
    const prevPos=new Map(previous.map((id,i)=>[id,i]));
    const currentPos=new Map(ids.map((id,i)=>[id,i]));
    const oldLeader=previous[0],newLeader=ids[0];
    let overtakes=0;
    const movers=[];
    for(const id of ids){
      const before=prevPos.get(id),after=currentPos.get(id);
      if(!Number.isFinite(before)||!Number.isFinite(after))continue;
      const gained=before-after;
      if(gained>0){overtakes+=gained;const racer=racerById(id);if(racer)movers.push({racer,gained,rank:after+1,before:before+1});}
    }
    state.raceStory.overtakes+=overtakes;

    if(oldLeader&&newLeader&&oldLeader!==newLeader){
      state.raceStory.leadChanges++;
      const leader=racerById(newLeader);
      if(leader)showRaceEvent('NEW RACE LEADER',`${leader.name} TAKES THE LEAD`,'leader',true);
    }else if(movers.length){
      movers.sort((a,b)=>Number(b.racer.isPlayer)-Number(a.racer.isPlayer)||Number(b.rank<=3)-Number(a.rank<=3)||b.gained-a.gained||a.rank-b.rank);
      const move=movers[0];
      if(move&&(move.racer.isPlayer||move.rank<=3||move.gained>=2)){
        const label=move.gained>=2?'BIG MOVE':'OVERTAKE';
        showRaceEvent(label,`${move.racer.name} MOVES TO ${ordinal(move.rank)}`,'overtake',false);
      }
    }

    state.raceOrderIds=ids;
    state.lastLeaderId=ids[0]||state.lastLeaderId;
    state.pendingOrderKey='';state.pendingOrderAt=0;
  }
  function startFinalLapDrama(leader,t){
    if(state.finalLapDramaStarted)return;
    state.finalLapDramaStarted=true;
    state.game?.classList.add('is-final-lap');
    showRaceEvent('FINAL LAP',`${leader?.name||'THE LEADER'} LEADS THE FIELD`,'final',true);
    if(state.crowdAudio)fadeAudio(state.crowdAudio,.085,780);
  }
  function triggerPhotoFinish(a,b,t){
    if(state.camera.photoFinishDone)return;
    state.camera.photoFinishDone=true;
    state.photoFinishHoldUntil=Math.max(state.photoFinishHoldUntil,t+1950);
    state.game?.classList.add('is-photo-finish');
    setCameraMode('photoFinish',1900,true,[a.id,b.id]);
    showRaceEvent('PHOTO FINISH',`${a.name} · ${b.name}`,'photo',true);
    if(state.crowdAudio)fadeAudio(state.crowdAudio,.095,260);
  }
  function scheduleResultsReveal(){
    clearTimeout(state.finishRevealTimer);
    const reveal=()=>{
      if(state.phase!=='player_finished')return;
      const gate=Math.max((state.finishAt||now())+1450,state.photoFinishHoldUntil||0);
      const wait=gate-now();
      if(wait>20){state.finishRevealTimer=setTimeout(reveal,wait+25);return;}
      showResults();
    };
    state.finishRevealTimer=setTimeout(reveal,1450);
  }

  function cameraCut(){const el=state.game?.querySelector('.dragon-race-camera-cut');if(!el)return;el.classList.remove('is-active');void el.offsetWidth;el.classList.add('is-active');setTimeout(()=>el.classList.remove('is-active'),180);}
  function setCameraMode(mode,duration=0,cut=false,subjectIds=[]){state.camera.mode=mode;state.camera.subjectIds=subjectIds||[];state.camera.eventUntil=duration?now()+duration:0;if(cut)cameraCut();}
  function startCeremony(){
    clearSequenceTimers();state.countdownToken++;const token=state.countdownToken;setPhase('ceremony');state.raceStartedAt=0;
    const title=state.game.querySelector('.dragon-race-broadcast-title'),lights=state.game.querySelector('.dragon-race-start-lights'),count=state.game.querySelector('.dragon-race-countdown');
    title?.classList.add('is-visible');lights?.classList.remove('is-visible','is-go');if(count){count.classList.remove('is-pop');count.querySelector('b').textContent='';}
    setCameraMode('ceremonyWide',0,false);
    queueSequence(()=>{title?.classList.remove('is-visible');setCameraMode('grid',0,false);},2100,token);
    queueSequence(()=>beginCountdown(token),3900,token);
  }
  function setStartingLights(count){const lights=state.game?.querySelector('.dragon-race-start-lights');if(!lights)return;lights.classList.add('is-visible');lights.classList.toggle('is-go',count>=4);[...lights.querySelectorAll('i')].forEach((el,i)=>el.classList.toggle('is-on',i<count&&count<4));}
  function beginCountdown(token=state.countdownToken){
    if(token!==state.countdownToken)return;setPhase('countdown');
    const el=state.game.querySelector('.dragon-race-countdown'),b=el.querySelector('b');setStartingLights(0);ensureRaceAudio();fadeAudio(state.raceMusic,RACE_MUSIC_VOLUME*.70,420);playCountdownAudio();
    COUNTDOWN_CUES.forEach((cue,index)=>queueSequence(()=>{
      if(state.phase!=='countdown')return;b.textContent=cue.label;el.classList.remove('is-pop');void el.offsetWidth;el.classList.add('is-pop');setStartingLights(cue.lights);
      if(index===COUNTDOWN_CUES.length-1){
        setPhase('racing');state.raceStartedAt=now();state.racers.forEach(r=>{r.lapStartedAt=state.raceStartedAt;r.takeoffDelay=Math.random()*400;});
        state.camera.nextDecisionAt=state.raceStartedAt+2200;state.camera.nextEventAt=state.raceStartedAt+5000;setCameraMode('follow',0,false);
        fadeAudio(state.raceMusic,RACE_MUSIC_VOLUME,1000);
        if(state.crowdAudio){state.crowdAudio.volume=.10;queueSequence(()=>{if(state.crowdAudio)state.crowdAudio.volume=CROWD_VOLUME;},900,token);}
        queueSequence(()=>{b.textContent='';el.classList.remove('is-pop');state.game?.querySelector('.dragon-race-start-lights')?.classList.remove('is-visible','is-go');},850,token);
      }
    },cue.at,token));
  }

  function autoRacerUpdate(r,dt,t){
    const p=pointAt(r.distance),ai=r.ai||makeAutoProfile(0);
    r.ai=ai;

    // Change racing line occasionally so the pack looks alive rather than glued to rails.
    if(t>ai.laneAt){
      ai.laneAt=t+1250+Math.random()*2450;
      const laneSwing=ai.style==='cautious'?.34:ai.style==='overtaker'?.58:ai.style==='bold'?.56:.5;
      ai.targetLane=clamp(ai.targetLane+(Math.random()-.5)*laneSwing,ai.style==='cautious'?-.48:-.68,ai.style==='cautious'?.48:.68);
    }

    // Gentle overtaking: move around the nearest racer immediately ahead.
    let ahead=null,bestGap=Infinity;
    for(const other of state.racers){
      if(other===r||other.finished)continue;
      const gap=other.distance-r.distance;
      if(gap>0&&gap<bestGap){bestGap=gap;ahead=other;}
    }
    if(ahead&&bestGap<.012&&Math.abs(ahead.lateral-r.lateral)<.28){
      ai.targetLane=clamp(r.lateral+(r.lateral<=0?.38:-.38),-.72,.72);
    }
    r.lateral=lerp(r.lateral,ai.targetLane,clamp(dt*(1.3+Math.random()*.12),0,1));

    // Small rolling surges/mistakes create organic position changes. They are applied to
    // every racer, including the player's dragon, so nobody gets a scripted advantage.
    if(t>ai.surgeAt){
      ai.surgeAt=t+1600+Math.random()*3200;
      const surgeRange=ai.style==='smooth'?.020:ai.style==='overtaker'?.026:.024;ai.surge=(Math.random()-.5)*surgeRange; // tiny style variance; race luck still dominates
      if(Math.random()<.20)ai.surge-=Math.random()*.006;
    }

    // Automatic short boost bursts. No player input exists in this race mode.
    if(t>ai.boostUntil&&ai.boost>18&&Math.random()<dt*.055){
      ai.boostUntil=t+550+Math.random()*650;
    }
    let boostFactor=1;
    if(t<ai.boostUntil&&ai.boost>0){
      ai.boost=Math.max(0,ai.boost-22*dt);
      boostFactor=1.018;
    }else{
      ai.boost=Math.min(100,ai.boost+5.5*dt);
    }
    r.boost=ai.boost;

    const curveFactor=1-p.curvature*(.082+(ai.mistake-.5)*.006);
    let target=ai.base*(1+ai.surge)*curveFactor*boostFactor;if(ai.style==='late'&&r.distance>=2)target*=1.0015;if(ai.style==='bold'&&p.curvature<.2)target*=1.0007;
    if(ahead&&bestGap<.006)target*=1.006;
    target=clamp(target,.0228,.0308);
    r.speed=lerp(r.speed,target,clamp(dt*1.55,0,1));
    r.distance+=r.speed*dt;
  }
  function updateCheckpointAndLap(r,t){
    if(r.finished||r.distance<0)return;const completed=Math.floor(Math.max(0,r.distance));const frac=mod1(r.distance);while(r.nextCp<CHECKPOINTS.length&&frac>=CHECKPOINTS[r.nextCp]&&completed===r.lastLapCross){r.nextCp++;}
    if(completed>r.lastLapCross){
      if(r.nextCp>=CHECKPOINTS.length){const lapMs=t-r.lapStartedAt;r.bestLapMs=!r.bestLapMs?lapMs:Math.min(r.bestLapMs,lapMs);r.lapStartedAt=t;r.lastLapCross=completed;r.nextCp=0;if(r.isPlayer&&completed<LAPS&&completed!==LAPS-1)showLapBanner(`LAP ${completed+1} / ${LAPS}`);}else{r.lastLapCross=completed;r.nextCp=0;}
    }
    if(r.distance>=LAPS&&!r.finished){
      r.finished=true;r.finishMs=t-state.raceStartedAt;r.finishAnimAt=t;state.resultOrder.push(r);
      if(state.resultOrder.length===2&&!state.camera.photoFinishDone){const gap=Math.abs(state.resultOrder[1].finishMs-state.resultOrder[0].finishMs);if(gap<=250)triggerPhotoFinish(state.resultOrder[0],state.resultOrder[1],t);}
      if(r.isPlayer)onPlayerFinish(t);
    }
  }
  function separateRacers(){for(let i=0;i<state.racers.length;i++)for(let j=i+1;j<state.racers.length;j++){const a=state.racers[i],b=state.racers[j];if(a.finished||b.finished)continue;if(Math.abs(a.distance-b.distance)<.0035&&Math.abs(a.lateral-b.lateral)<.18){const push=(a.lateral<=b.lateral?-.018:.018);a.lateral=clamp(a.lateral+push,-.82,.82);b.lateral=clamp(b.lateral-push,-.82,.82);}}}

  function renderRacer(r,t){
    const p=worldPoint(r),motion=racerMotionState(r,t),lift=motion==='fly'?-77:motion==='takeOff'||motion==='land'?-73:-68;
    const visual=r.visual||(r.visual={bank:0,lean:0,lastLateral:r.lateral,lastSpeed:r.speed||0,lastAt:t,bobPhase:Math.random()*Math.PI*2,altitudeBias:0});
    const perspectiveScale=.69+(p.y/WORLD_H)*.42;
    const altitudeOffset=motion==='fly'?visual.altitudeBias:motion==='takeOff'||motion==='land'?visual.altitudeBias*.42:0;
    r.el.style.left=`${p.x}px`;r.el.style.top=`${p.y}px`;r.el.style.transform=`translate(-50%,${lift}%) translateY(${altitudeOffset.toFixed(2)}px) scale(${perspectiveScale.toFixed(3)})`;r.el.style.zIndex=String(20+Math.round(p.y/9)+(r.isPlayer?20:0));
    r.el.classList.toggle('is-flying',motion==='fly');r.el.classList.toggle('is-taking-off',motion==='takeOff');r.el.classList.toggle('is-landing',motion==='land');
    const movingRight=Math.cos(p.ang)>=0,nativeRight=nativeFacingRight(r.breed);r.el.classList.toggle('is-flipped',movingRight!==nativeRight);

    const visualDt=clamp((t-(visual.lastAt||t))/1000,.001,.05),before=pointAt(r.distance-.006),after=pointAt(r.distance+.006);
    const signedTurn=normalizeAngle(after.ang-before.ang),laneVelocity=(r.lateral-visual.lastLateral)/visualDt,baseSpeed=Math.max(.0001,r.ai?.base||.0265),speedRatio=(r.speed||0)/baseSpeed;
    const bankTarget=motion==='fly'?clamp(signedTurn*72+laneVelocity*7.5,-8.5,8.5):0;
    const leanTarget=motion==='fly'?clamp((speedRatio-1)*22,-1.3,1.6):0;
    visual.bank=lerp(visual.bank,bankTarget,clamp(visualDt*5.2,0,1));
    visual.lean=lerp(visual.lean,leanTarget,clamp(visualDt*4.2,0,1));
    const bob=motion==='fly'?Math.sin(t/235+visual.bobPhase)*1.35:0;
    if(r.spriteWrap){r.spriteWrap.style.setProperty('--flight-bank',`${visual.bank.toFixed(2)}deg`);r.spriteWrap.style.setProperty('--flight-lean',`${visual.lean.toFixed(2)}deg`);r.spriteWrap.style.setProperty('--flight-bob',`${bob.toFixed(2)}px`);}
    if(r.shadow){
      const airborne=motion==='fly',transitioning=motion==='takeOff'||motion==='land';
      const lag=airborne?5.2+Math.max(0,speedRatio-1)*18:transitioning?3.2:1.6;
      const shadowX=-Math.cos(p.ang)*lag,shadowY=-Math.sin(p.ang)*lag+4.2;
      const speedStretch=clamp(1.02+Math.max(0,speedRatio-1)*2.8,1.02,1.16);
      const heightSoftness=airborne?4.2+Math.max(0,-altitudeOffset)*.24:transitioning?3.0:2.0;
      const shadowOpacity=airborne?.30:transitioning?.36:.40;
      r.shadow.style.setProperty('--shadow-x',`${shadowX.toFixed(2)}px`);
      r.shadow.style.setProperty('--shadow-y',`${shadowY.toFixed(2)}px`);
      r.shadow.style.setProperty('--shadow-angle',`${(p.ang*180/Math.PI).toFixed(1)}deg`);
      r.shadow.style.setProperty('--shadow-stretch',speedStretch.toFixed(3));
      r.shadow.style.setProperty('--shadow-blur',`${heightSoftness.toFixed(2)}px`);
      r.shadow.style.setProperty('--shadow-opacity',shadowOpacity.toFixed(2));
    }
    visual.lastLateral=r.lateral;visual.lastSpeed=r.speed||0;visual.lastAt=t;

    const finalPush=r.distance>=LAPS-.14,bursting=t<(r.ai?.boostUntil||0)||(r.ai?.surge||0)>.0105||speedRatio>1.032;
    const speedFx=motion==='fly'&&(finalPush||bursting);
    r.el.classList.toggle('is-speeding',speedFx);
    if(r.trail)r.trail.style.transform=`translate(-100%,-50%) rotate(${(p.ang*180/Math.PI).toFixed(1)}deg)`;

    const frames=animationFrames(r.breed,motion);
    if(r.animKey!==motion){r.animKey=motion;r.animIndex=0;r.frameAt=t-999;}
    const current=frames[r.animIndex%frames.length]||frames[0];
    if(current&&t-r.frameAt>=current.durationMs){r.frameAt=t;r.animIndex=(r.animIndex+1)%frames.length;const next=frames[r.animIndex]||frames[0];if(next?.src&&r.img.getAttribute('src')!==next.src)r.img.src=next.src;}
    else if(current?.src&&!r.img.getAttribute('src'))r.img.src=current.src;
  }
  function standings(){return state.racers.slice().sort((a,b)=>{if(a.finished&&b.finished)return a.finishMs-b.finishMs;if(a.finished)return-1;if(b.finished)return 1;return b.distance-a.distance;});}
  function updateHud(t){const order=standings(),rank=Math.max(1,order.findIndex(r=>r.isPlayer)+1),p=state.player;const pos=state.game.querySelector('[data-race-position]'),lap=state.game.querySelector('[data-race-lap]'),time=state.game.querySelector('[data-race-time]');if(pos)pos.textContent=`${rank} / ${RACER_COUNT}`;if(lap)lap.textContent=`${Math.min(LAPS,Math.floor(Math.max(0,p.distance))+1)} / ${LAPS}`;if(time)time.textContent=formatTime(state.raceStartedAt?t-state.raceStartedAt:0);if(t>=state.nextHudLayoutAt){updateLeaderboard(order,t);updateNameplates(order);state.nextHudLayoutAt=t+90;}}
  function racerById(id){return state.racers.find(r=>r.id===id)||null;}
  function meanWorld(racers){const pts=(racers||[]).filter(Boolean).map(worldPoint);if(!pts.length)return{x:WORLD_W/2,y:WORLD_H/2};return{x:pts.reduce((s,p)=>s+p.x,0)/pts.length,y:pts.reduce((s,p)=>s+p.y,0)/pts.length};}

  function focusPack(order){
    const active=(order||[]).filter(r=>r&&!r.finished);
    if(!active.length)return[];
    const size=Math.min(4,active.length);
    if(active.length<=size)return active.slice();
    let best=active.slice(0,size),bestSpan=Infinity;
    for(let i=0;i<=active.length-size;i++){
      const window=active.slice(i,i+size);
      const span=Math.max(0,window[0].distance-window[window.length-1].distance);
      if(span<bestSpan){best=window;bestSpan=span;}
    }
    const player=state.player;
    if(player&&!player.finished){
      const idx=active.findIndex(r=>r.id===player.id);
      if(idx>=0){
        const start=Math.max(0,Math.min(active.length-size,idx-1));
        const around=active.slice(start,start+size);
        const aroundSpan=Math.max(0,around[0].distance-around[around.length-1].distance);
        const playerNearBest=best.some(r=>Math.abs(r.distance-player.distance)<.05);
        if(playerNearBest||aroundSpan<=bestSpan*1.28)best=around;
      }
    }
    return best;
  }

  function cameraTarget(t){
    const cam=state.camera,order=standings(),active=order.filter(r=>!r.finished),leader=active[0]||order[0]||state.player;
    const pack=focusPack(order);
    if(cam.mode==='ceremonyWide')return{x:WORLD_W/2,y:WORLD_H/2,zoom:1};
    if(cam.mode==='grid'){const p=pointAt(0);return{x:p.x+32,y:p.y+10,zoom:1.48};}
    if(cam.mode==='photoFinish'){const p=pointAt(.002);return{x:p.x+26,y:p.y+6,zoom:1.72};}
    if(cam.mode==='finalLeader'&&leader){const p=worldPoint(leader);return{x:p.x,y:p.y,zoom:1.64};}
    if(cam.mode==='finalStraight'){
      const top=(pack.length?pack:order.slice(0,3)).filter(Boolean),focus=meanWorld(top);const p=leader?pointAt(leader.distance+.016):null;
      return{x:p?lerp(focus.x,p.x,.48):focus.x,y:p?lerp(focus.y,p.y,.48):focus.y,zoom:1.68};
    }
    if(cam.mode==='closeBattle'){const subjects=cam.subjectIds.map(racerById).filter(Boolean),focus=meanWorld(subjects);return{x:focus.x,y:focus.y,zoom:1.64};}
    if(cam.mode==='widePack'){const focus=meanWorld(active.length?active:order);return{x:focus.x,y:focus.y,zoom:1.31};}
    if(cam.mode==='panAhead'){
      const focusGroup=(pack.length?pack:order.slice(0,4)).filter(Boolean),focus=meanWorld(focusGroup),ref=focusGroup[0]||state.player||leader,p=ref?pointAt(ref.distance+.022):null;
      return{x:p?lerp(focus.x,p.x,.56):focus.x,y:p?lerp(focus.y,p.y,.56):focus.y,zoom:1.5};
    }
    const followGroup=(pack.length?pack:order.slice(0,4)).filter(Boolean);
    const packPoint=meanWorld(followGroup.length?followGroup:order);
    const packLeader=followGroup[0]||leader;
    const playerPoint=state.player&&!state.player.finished?worldPoint(state.player):packPoint;
    const anchor=packLeader?pointAt(packLeader.distance+.016):null;
    return{
      x:anchor?lerp(lerp(playerPoint.x,packPoint.x,.3),anchor.x,.34):lerp(playerPoint.x,packPoint.x,.3),
      y:anchor?lerp(lerp(playerPoint.y,packPoint.y,.3),anchor.y,.34):lerp(playerPoint.y,packPoint.y,.3),
      zoom:1.6
    };
  }
  function evaluateCamera(t){
    if(state.phase!=='racing'&&state.phase!=='player_finished')return;
    const cam=state.camera,order=standings(),active=order.filter(r=>!r.finished);
    if(!active.length)return;
    const leader=active[0],leaderLap=Math.floor(Math.max(0,leader.distance))+1;
    if(!cam.finalLapShown&&leaderLap>=LAPS){cam.finalLapShown=true;startFinalLapDrama(leader,t);setCameraMode('finalLeader',2200,true,[leader.id]);cam.nextEventAt=t+5900;return;}
    if(!cam.finalStraightShown&&leader.distance>=LAPS-0.13){cam.finalStraightShown=true;setCameraMode('finalStraight',5200,false);if(state.crowdAudio)fadeAudio(state.crowdAudio,.092,520);cam.nextEventAt=t+7000;return;}
    if(cam.eventUntil&&t<cam.eventUntil)return;
    if(cam.eventUntil&&t>=cam.eventUntil){cam.eventUntil=0;cam.mode='follow';cam.subjectIds=[];}
    if(t<cam.nextDecisionAt)return;
    cam.nextDecisionAt=t+2600;
    if(t<cam.nextEventAt)return;
    let battle=null,battleGap=Infinity;
    for(let i=0;i<active.length-1;i++){
      const gap=Math.abs(active[i].distance-active[i+1].distance);
      if(gap<battleGap){battleGap=gap;battle=[active[i],active[i+1]];}
    }
    if(battle&&battleGap<.0058){setCameraMode('closeBattle',3800,false,battle.map(r=>r.id));cam.nextEventAt=t+9000;return;}
    const spread=active.length>1?Math.max(...active.map(r=>r.distance))-Math.min(...active.map(r=>r.distance)):0;
    if(spread>.26&&leaderLap<3&&Math.random()<.08){setCameraMode('widePack',1650,false);cam.nextEventAt=t+9800;return;}
    if(Math.random()<.035){setCameraMode('panAhead',1900,false);cam.nextEventAt=t+9800;return;}
    cam.mode='follow';
    cam.nextEventAt=t+4600;
  }
  function updateCamera(dt,t){
    if(!state.viewport||!state.world)return;
    const width=Math.max(1,state.viewport.clientWidth),height=Math.max(1,state.viewport.clientHeight),baseScale=Math.min(width/WORLD_W,height/WORLD_H),target=cameraTarget(t),cam=state.camera;
    const posEase=1-Math.exp(-dt*(cam.mode==='ceremonyWide'?1.05:cam.mode==='grid'?1.6:2.16));
    const zoomEase=1-Math.exp(-dt*(cam.mode==='follow'?1.6:1.68));
    const driftStrength=(state.phase==='racing'||state.phase==='player_finished') ? (cam.mode==='follow' ? 1 : (cam.mode==='closeBattle' ? .9 : (cam.mode==='panAhead' ? .75 : (cam.mode==='widePack' ? .55 : .45)))) : 0;
    const driftX=((Math.sin(t/2800)*10)+(Math.sin(t/1375)*3.4))*driftStrength;
    const driftY=((Math.cos(t/3180)*5.8)+(Math.sin(t/1720)*2.2))*driftStrength;
    cam.x=lerp(cam.x,target.x+driftX,posEase);
    cam.y=lerp(cam.y,target.y+driftY,posEase);
    cam.zoom=lerp(cam.zoom,target.zoom,zoomEase);
    const scale=baseScale*clamp(cam.zoom,1,1.9),worldW=WORLD_W*scale,worldH=WORLD_H*scale;
    let x=width/2-cam.x*scale,y=height/2-cam.y*scale;
    x=clamp(x,width-worldW,0);
    y=clamp(y,height-worldH,0);
    state.world.style.transform=`translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${scale.toFixed(4)})`;
    updateViewportFocus(width,height,scale,x,y);
  }


  function updateViewportFocus(width,height,scale,offsetX,offsetY){
    if(!state.viewport)return;
    let focusX=width*.5,focusY=height*.5,focusRx=width*.29,focusRy=height*.26;
    if(state.phase==='racing'||state.phase==='player_finished'){
      const order=standings();
      const pack=focusPack(order);
      const group=(pack.length?pack:order.slice(0,4)).filter(r=>r&&(!r.finished||r.isPlayer));
      if(group.length){
        const pts=group.map(r=>{const p=worldPoint(r);return{x:offsetX+p.x*scale,y:offsetY+p.y*scale};});
        const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
        const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
        focusX=(minX+maxX)/2;
        focusY=(minY+maxY)/2;
        const marginX=Math.max(150,width*.10),marginY=Math.max(110,height*.09);
        focusRx=clamp((maxX-minX)/2+marginX,width*.22,width*.37);
        focusRy=clamp((maxY-minY)/2+marginY,height*.18,height*.33);
      }
    }
    state.viewport.style.setProperty('--focus-x',`${focusX.toFixed(2)}px`);
    state.viewport.style.setProperty('--focus-y',`${focusY.toFixed(2)}px`);
    state.viewport.style.setProperty('--focus-rx',`${focusRx.toFixed(2)}px`);
    state.viewport.style.setProperty('--focus-ry',`${focusRy.toFixed(2)}px`);
  }

  function onPlayerFinish(t){state.phase='player_finished';state.finishAt=t;const p=state.player,rank=standings().findIndex(r=>r.isPlayer)+1;persistResult(p,rank);showLapBanner(`${ordinal(rank)} PLACE · FINISH`);scheduleResultsReveal();}
  function persistResult(player,rank){
    const data=loadSave(),tracks=data.tracks||(data.tracks={}),s=tracks.velmora_city_circuit||(tracks.velmora_city_circuit={races:0,wins:0,podiums:0,bestTimeMs:0,bestLapMs:0});s.races=(Number(s.races)||0)+1;if(rank===1)s.wins=(Number(s.wins)||0)+1;if(rank<=3)s.podiums=(Number(s.podiums)||0)+1;if(!s.bestTimeMs||player.finishMs<s.bestTimeMs)s.bestTimeMs=Math.round(player.finishMs);if(player.bestLapMs&&(!s.bestLapMs||player.bestLapMs<s.bestLapMs))s.bestLapMs=Math.round(player.bestLapMs);s.lastFinishPosition=rank;s.lastFinishTimeMs=Math.round(player.finishMs);s.updatedAt=Date.now();data.level=Math.max(1,Number(data.level)||1);data.xp=Math.max(0,Number(data.xp)||0);saveData(data);
    // V33.47 intentionally does NOT grant Dragon Racing XP yet.
  }
  function persistAiResults(order){
    if(state.aiStatsPersisted)return;state.aiStatsPersisted=true;const data=loadSave();data.aiPool=data.aiPool||{};
    order.forEach((r,index)=>{if(r.isPlayer||!r.identityId)return;const s=data.aiPool[r.identityId]||(data.aiPool[r.identityId]={races:0,wins:0,podiums:0,bestFinish:0});s.races=(Number(s.races)||0)+1;if(index===0)s.wins=(Number(s.wins)||0)+1;if(index<3)s.podiums=(Number(s.podiums)||0)+1;const finish=index+1;if(!s.bestFinish||finish<s.bestFinish)s.bestFinish=finish;s.lastFinish=finish;s.updatedAt=Date.now();});saveData(data);
  }
  function showResults(){
    state.phase='results';
    state.game?.classList.remove('is-final-lap','is-photo-finish');
    hideRaceEvent();
    stopTransientRaceAudio(true);
    fadeAudio(state.raceMusic,RACE_MUSIC_VOLUME*.92,700);
    if(state.crowdAudio)fadeAudio(state.crowdAudio,CROWD_VOLUME,500);

    const elapsed=now()-state.raceStartedAt;
    for(const r of state.racers){
      if(r.finished)continue;
      const remaining=Math.max(0,LAPS-r.distance),projected=remaining/Math.max(.021,r.speed||.024)*1000;
      r.finished=true;r.finishMs=elapsed+projected;
      if(!r.bestLapMs)r.bestLapMs=Math.max(1,r.finishMs/LAPS);
    }

    const results=state.game.querySelector('.dragon-race-results');
    const card=results.querySelector('.dragon-race-results-card');
    const order=standings();
    const rank=order.findIndex(r=>r.isPlayer)+1;
    const p=state.player;
    const leader=order[0]||p;
    const playerInfo=getPlayerInfo();
    const previous={...(state.preRaceTrackStats||{})};
    const current=getTrackStats();
    const startPosition=Math.max(1,(Number(p.slot)||0)+1);
    const positionDelta=startPosition-rank;
    const quickestLap=Math.min(...order.map(r=>Number(r.bestLapMs)||Infinity).filter(Number.isFinite));
    const gapToWinner=Math.max(0,(Number(p.finishMs)||0)-(Number(leader.finishMs)||0));
    const wasFirstRecordedRace=!(Number(previous.races)||0);
    const isNewPersonalBest=wasFirstRecordedRace||!(Number(previous.bestTimeMs)||0)||p.finishMs<Number(previous.bestTimeMs);
    const isNewBestLap=wasFirstRecordedRace||!(Number(previous.bestLapMs)||0)||p.bestLapMs<Number(previous.bestLapMs);
    const firstWin=rank===1&&!(Number(previous.wins)||0);
    const firstPodium=rank<=3&&!(Number(previous.podiums)||0);
    const fastestLap=Number.isFinite(quickestLap)&&Math.abs(p.bestLapMs-quickestLap)<12;
    const status=rank===1?'Race Winner':rank<=3?'Podium Finish':rank===4?'Strong Finish':rank===5?'Hard-fought Finish':'Race Complete';
    const finishClass=rank===1?'is-first':rank===2?'is-second':rank===3?'is-third':'is-standard';

    const achievements=[];
    if(firstWin)achievements.push('FIRST CAREER WIN');
    else if(firstPodium)achievements.push('FIRST PODIUM');
    if(isNewPersonalBest)achievements.push(wasFirstRecordedRace?'FIRST RECORDED TIME':'NEW PERSONAL BEST');
    if(isNewBestLap&&!wasFirstRecordedRace)achievements.push('NEW BEST LAP');
    else if(fastestLap)achievements.push('FASTEST LAP');

    const notes=[];
    if(positionDelta>0)notes.push(`Climbed from ${ordinal(startPosition)} to ${ordinal(rank)} · +${positionDelta} position${positionDelta===1?'':'s'}`);
    else if(positionDelta<0)notes.push(`Started ${ordinal(startPosition)} · finished ${ordinal(rank)} · ${Math.abs(positionDelta)} position${Math.abs(positionDelta)===1?'':'s'} lost`);
    else notes.push(`Held ${ordinal(rank)} from the starting grid to the flag`);
    if(rank>1)notes.push(`Finished ${formatRaceGap(gapToWinner)} behind ${leader.name}`);
    else notes.push(`Won by ${formatRaceGap(Math.max(0,(order[1]?.finishMs||p.finishMs)-p.finishMs)).replace('+','')}`);
    if(isNewPersonalBest&&!wasFirstRecordedRace&&Number(previous.bestTimeMs)>p.finishMs)notes.push(`Personal best improved by ${formatDeltaMs(Number(previous.bestTimeMs)-p.finishMs)}`);
    else if(fastestLap)notes.push(`Quickest lap of the race · ${formatTime(p.bestLapMs)}`);
    else if(Number.isFinite(quickestLap))notes.push(`Best lap ${formatRaceGap(Math.max(0,p.bestLapMs-quickestLap))} off the race's quickest`);

    if(state.raceStory.leadChanges||state.raceStory.overtakes){
      const parts=[];
      if(state.raceStory.overtakes)parts.push(`${state.raceStory.overtakes} recorded overtake${state.raceStory.overtakes===1?'':'s'}`);
      if(state.raceStory.leadChanges)parts.push(`${state.raceStory.leadChanges} lead change${state.raceStory.leadChanges===1?'':'s'}`);
      notes.push(parts.join(' · '));
    }

    const movementLabel=positionDelta>0?'POSITIONS GAINED':positionDelta<0?'POSITIONS LOST':'GRID MOVEMENT';
    const movementValue=positionDelta>0?`+${positionDelta}`:positionDelta<0?`−${Math.abs(positionDelta)}`:'—';
    const pbValue=isNewPersonalBest?formatTime(p.finishMs):(current.bestTimeMs?formatTime(current.bestTimeMs):formatTime(p.finishMs));
    const pbHint=isNewPersonalBest?(wasFirstRecordedRace?'First benchmark recorded':(Number(previous.bestTimeMs)>p.finishMs?`${formatDeltaMs(Number(previous.bestTimeMs)-p.finishMs)} quicker`:'New best')):'Current circuit record';

    persistAiResults(order);

    card.classList.remove('is-first','is-second','is-third','is-standard');
    card.classList.add(finishClass);
    card.innerHTML=`
      <div class="dragon-race-result-topline"><span>VELMORA RACING NETWORK</span><em>OFFICIAL RESULT · RACE ${RACE_NUMBER}</em></div>

      <div class="dragon-race-result-hero">
        <div class="dragon-race-result-dragon">
          <img src="${escapeRaceText(playerInfo.sprite)}" alt="">
          <div>
            <small>VELMORA CITY CIRCUIT</small>
            <h2>${escapeRaceText(p.name)}</h2>
            <p>${status}</p>
          </div>
        </div>
        <div class="dragon-race-result-place">
          <strong>${ordinal(rank)}</strong>
          <span>FINAL POSITION</span>
        </div>
      </div>

      ${achievements.length?`<div class="dragon-race-result-achievements">${achievements.slice(0,3).map(a=>`<span>${a}</span>`).join('')}</div>`:''}

      <div class="dragon-race-result-metrics">
        <div class="dragon-race-result-metric is-primary"><b>FINISH TIME</b><em>${formatTime(p.finishMs)}</em><small>${rank===1?'Official winning time':`${formatRaceGap(gapToWinner)} to winner`}</small></div>
        <div class="dragon-race-result-metric"><b>BEST LAP</b><em>${formatTime(p.bestLapMs)}</em><small>${fastestLap?'Fastest lap of race':`${formatRaceGap(Math.max(0,p.bestLapMs-quickestLap))} off quickest`}</small></div>
        <div class="dragon-race-result-metric"><b>PERSONAL BEST</b><em>${pbValue}</em><small>${pbHint}</small></div>
        <div class="dragon-race-result-metric"><b>GRID</b><em>${ordinal(startPosition)}</em><small>Starting position</small></div>
        <div class="dragon-race-result-metric"><b>${movementLabel}</b><em>${movementValue}</em><small>${ordinal(startPosition)} → ${ordinal(rank)}</small></div>
      </div>

      <div class="dragon-race-reward-strip is-pending" data-race-reward-card>
        <div class="dragon-race-reward-medallion" aria-hidden="true"><b>M</b></div>
        <div class="dragon-race-reward-copy"><small data-race-reward-kicker>RACE REWARD</small><strong data-race-reward-status>Verifying Keeper Mark reward…</strong><em data-race-reward-balance></em></div>
        <div class="dragon-race-reward-total"><b data-race-reward-total>…</b><span>KEEPER MARKS</span></div>
      </div>

      <div class="dragon-race-result-lower">
        <section class="dragon-race-classification">
          <header><span>FINAL CLASSIFICATION</span><em>TIME · MARKS</em></header>
          <div class="dragon-race-classification-list">
            ${order.map((r,i)=>`<div class="dragon-race-classification-row${r.isPlayer?' is-player':''}${i===0?' is-winner':''}" style="--reveal:${i*45}ms"><b>${i+1}</b><i style="--racer-accent:${r.accent||racerAccent(r,i)}"></i><span>${escapeRaceText(r.name)}${r.isPlayer?'<small>YOU</small>':''}</span><em>${i===0?formatTime(r.finishMs):formatRaceGap(r.finishMs-leader.finishMs)}</em><strong class="dragon-race-classification-marks" data-race-marks-racer="${r.isPlayer?'player':escapeRaceText(r.id)}"><b>+${marksForPosition(i+1)}</b><small>MARKS</small></strong></div>`).join('')}
          </div>
        </section>

        <section class="dragon-race-result-notes">
          <header>RACE NOTES</header>
          <div>${notes.slice(0,4).map((note,i)=>`<p style="--reveal:${100+i*70}ms"><i></i><span>${escapeRaceText(note)}</span></p>`).join('')}</div>
        </section>
      </div>

      <div class="dragon-race-result-footer">
        <small>KEEPER MARKS AWARDED · DRAGON RACING XP DISABLED</small>
        <div class="dragon-race-results-actions"><div class="is-primary" role="button" tabindex="0" data-race-again>RACE AGAIN</div><div role="button" tabindex="0" data-race-track-select>TRACK SELECT</div><div role="button" tabindex="0" data-race-leave>LEAVE RACEWAY</div></div>
      </div>`;

    results.classList.remove('is-visible');
    requestAnimationFrame(()=>results.classList.add('is-visible'));
    bindAction(card.querySelector('[data-race-again]'),()=>start({id:'velmora_city_circuit'}));
    bindAction(card.querySelector('[data-race-track-select]'),()=>exitToTrackSelect());
    bindAction(card.querySelector('[data-race-leave]'),()=>{stop();window.DragonRacingUi?.close?.();});
    const rewardRunId=state.rewardRunId;
    void claimRaceReward(rank,p.finishMs,p.bestLapMs,card,rewardRunId);
  }

  function loop(t){if(!state.game||state.phase==='closed')return;state.raf=requestAnimationFrame(loop);const dt=Math.min(.05,Math.max(0,(t-state.lastT)/1000)||.016);state.lastT=t;if(state.phase==='racing'||state.phase==='player_finished'){for(const r of state.racers){if(r.finished)continue;autoRacerUpdate(r,dt,t);updateCheckpointAndLap(r,t);}separateRacers();detectRaceEvents(t);maybePlayWingSound(t);evaluateCamera(t);}for(const r of state.racers)renderRacer(r,t);updateHud(t);updateCamera(dt,t);}

  function start(track={id:'velmora_city_circuit'}){
    if(track.id&&track.id!=='velmora_city_circuit')return false;stop(false);const progression=loadSave();saveData(progression);state.preRaceTrackStats=getTrackStats();if(!state.samples.length)buildSamples();const game=ensureGame();if(!game)return false;
    document.getElementById('dragonRacingModal')?.classList.add('is-race-active');game.querySelector('.dragon-race-results')?.classList.remove('is-visible');game.classList.toggle('is-debug-path',state.debugPath);createRacers();setPhase('setup');state.resultOrder=[];state.finishAt=0;state.aiStatsPersisted=false;state.nextHudLayoutAt=0;state.raceOrderIds=[];state.pendingOrderKey='';state.pendingOrderAt=0;state.lastLeaderId='';state.lastRaceEventAt=0;state.raceStory={overtakes:0,leadChanges:0};state.finalLapDramaStarted=false;state.photoFinishHoldUntil=0;clearTimeout(state.finishRevealTimer);state.finishRevealTimer=0;clearTimeout(state.raceEventTimer);state.raceEventTimer=0;game.classList.remove('is-final-lap','is-photo-finish');hideRaceEvent();state.camera={x:WORLD_W/2,y:WORLD_H/2,zoom:1,targetX:WORLD_W/2,targetY:WORLD_H/2,targetZoom:1,mode:'wide',eventUntil:0,nextDecisionAt:0,nextEventAt:0,subjectIds:[],finalLapShown:false,finalStraightShown:false,photoFinishDone:false,forcedMode:''};state.keys={up:false,down:false,left:false,right:false,boost:false};const rewardRunId=++state.rewardRunId;state.raceRewardSessionId='';state.raceRewardClaim=null;state.raceRewardPromise=beginRaceRewardSession(rewardRunId);game.classList.add('is-visible');window.DragonRacingUi?.fadeMenuAudioOut?.(650);startRaceAudio();state.lastT=now();if(state.raf)cancelAnimationFrame(state.raf);state.raf=requestAnimationFrame(loop);queueSequence(()=>{if(state.phase==='setup')startCeremony();},320,state.countdownToken);return true;
  }
  function stop(remove=false){
    state.countdownToken++;clearSequenceTimers();state.audioFadeToken++;if(state.raf){cancelAnimationFrame(state.raf);state.raf=0;}clearTimeout(state.lapBannerTimer);state.lapBannerTimer=0;clearTimeout(state.raceEventTimer);state.raceEventTimer=0;clearTimeout(state.finishRevealTimer);state.finishRevealTimer=0;stopRaceAudio(true);setPhase('closed');state.keys={up:false,down:false,left:false,right:false,boost:false};document.getElementById('dragonRacingModal')?.classList.remove('is-race-active');
    if(state.game){state.game.classList.remove('is-visible','is-debug-path','is-final-lap','is-photo-finish');hideRaceEvent();state.game.querySelector('.dragon-race-results')?.classList.remove('is-visible');state.game.querySelector('.dragon-race-countdown')?.classList.remove('is-pop');state.game.querySelector('.dragon-race-broadcast-title')?.classList.remove('is-visible');state.game.querySelector('.dragon-race-start-lights')?.classList.remove('is-visible','is-go');const lapBanner=state.game.querySelector('.dragon-race-lap-banner');if(lapBanner){lapBanner.classList.remove('is-visible');lapBanner.textContent='';}if(remove){state.game.remove();state.game=null;state.viewport=null;state.world=null;}}
  }
  function exitToTrackSelect(){stop();window.DragonRacingUi?.closeRaceConfirm?.();requestAnimationFrame(()=>{window.DragonRacingUi?.showScene?.('menu');window.DragonRacingUi?.restoreMenuAudio?.(450);});}
  function isActive(){return state.phase!=='closed';}

  // V33.48: races are fully autonomous; there are deliberately no steering/boost keybinds.


  function admin(){return currentAccount()==='admin';}
  window.DragonRacingRace={start,stop,exitToTrackSelect,isActive,getPlayerInfo,getProgression,getTrackStats,getRewardInfo,formatTime};
  window.DragonRacingDebug={
    inspect(){if(!admin())return null;return{phase:state.phase,player:state.player?{distance:state.player.distance,lateral:state.player.lateral,speed:state.player.speed,boost:state.player.boost,finished:state.player.finished,auto:true,raceLuck:state.player.ai?.raceLuck||0,tinyBias:state.player.ai?.extraBias||0,motion:racerMotionState(state.player,now())}:null,progression:getProgression(),stats:getTrackStats(),raceStory:{...state.raceStory},finalLap:state.finalLapDramaStarted};},
    showPath(on=true){if(!admin())return false;state.debugPath=on!==false;state.game?.classList.toggle('is-debug-path',state.debugPath);return state.debugPath;},
    showCheckpoints(on=true){return this.showPath(on);},
    setLap(lap=1){if(!admin()||!state.player)return null;state.player.distance=Math.max(0,Number(lap)-1)+mod1(state.player.distance);return state.player.distance;},
    teleportToCheckpoint(index=0){if(!admin()||!state.player)return null;const i=clamp(Math.floor(index),0,CHECKPOINTS.length-1);state.player.distance=Math.floor(Math.max(0,state.player.distance))+CHECKPOINTS[i];state.player.nextCp=i+1;return state.player.distance;},
    setSpeed(value=.025){if(!admin()||!state.player)return null;state.player.speed=clamp(value,0,.06);return state.player.speed;},
    finishRace(){if(!admin()||!state.player)return false;state.player.distance=LAPS+.001;updateCheckpointAndLap(state.player,now());if(!state.player.finished){state.player.finished=true;state.player.finishMs=now()-state.raceStartedAt;onPlayerFinish(now());}return true;},
    camera(){if(!admin())return null;return{mode:state.camera.mode,x:+state.camera.x.toFixed(1),y:+state.camera.y.toFixed(1),zoom:+state.camera.zoom.toFixed(3),eventUntil:state.camera.eventUntil,subjects:[...state.camera.subjectIds]};},
    forceCamera(mode='follow'){if(!admin())return false;const valid=['follow','closeBattle','widePack','panAhead','finalLeader','finalStraight','photoFinish','grid','ceremonyWide'];if(!valid.includes(mode))return false;let subjects=[];if(mode==='closeBattle')subjects=standings().slice(0,2).map(r=>r.id);setCameraMode(mode,4000,true,subjects);return true;},
    inspectAiPool(){if(!admin())return null;const saved=loadSave().aiPool||{};return expandedAiPool().map(r=>({...r,stats:{races:0,wins:0,podiums:0,bestFinish:0,...(saved[r.id]||{})}}));},
    forcePhotoFinish(){if(!admin())return false;const pair=standings().slice(0,2);if(pair.length<2)return false;triggerPhotoFinish(pair[0],pair[1],now());return true;},
    inspectRacers(){if(!admin())return null;return standings().map((r,i)=>({position:i+1,id:r.id,name:r.name,breed:r.breed,personality:r.personality||'',style:r.style||'',facing:raceBreedProfile(r.breed).facing,flyFrames:[...raceBreedProfile(r.breed).fly],distance:+r.distance.toFixed(4),lane:+r.lateral.toFixed(2),speed:+r.speed.toFixed(4),finished:r.finished}));},
    spriteQa(){if(!admin())return null;return raceSpriteQaReport();},
    spriteProfile(breed){if(!admin())return null;const key=normKey(breed);return {breed:key,...raceBreedProfile(key),registry:registryBreed(key)||null};}
  };
})();