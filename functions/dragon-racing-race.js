(function(){
  'use strict';
  if(window.__dragonRacingRaceV3359)return;
  window.__dragonRacingRaceV3359=true;

  const WORLD_W=1536,WORLD_H=1024,ASSET='dragon-racing-assets/velmora-city-circuit.webp',LAPS=3,RACER_COUNT=6;
  const RACE_MUSIC='dragon-racing-assets/audio/velmora-city-circuit.mp3';
  const WING_SOUNDS=['dragon-racing-assets/audio/wing-flap-01.mp3','dragon-racing-assets/audio/wing-flap-02.mp3'];
  const CROWD_SOUND='dragon-racing-assets/audio/stadium-crowd.mp3';
  const COUNTDOWN_SOUND='dragon-racing-assets/audio/city-circuit-countdown.mp3';
  const SKY_AIRSHIPS=['dragon-racing-airship-1.png','dragon-racing-airship-2.png','dragon-racing-airship-3.png','dragon-racing-airship-4.png','dragon-racing-airship-5.png','dragon-racing-airship-6.png'];
  const SKY_CLOUDS=['dragon-racing-cloud-1.png','dragon-racing-cloud-2.png','dragon-racing-cloud-3.png','dragon-racing-cloud-4.png','dragon-racing-cloud-5.png','dragon-racing-cloud-6.png','dragon-racing-cloud-7.png','dragon-racing-cloud-8.png','dragon-racing-cloud-9.png','dragon-racing-cloud-10.png','dragon-racing-cloud-11.png'];
  const RACE_MUSIC_VOLUME=.36,CROWD_VOLUME=.07,COUNTDOWN_VOLUME=.45,RACE_NUMBER=1;
  const COUNTDOWN_CUES=[{at:0,label:'3',lights:1},{at:1312,label:'2',lights:2},{at:2446,label:'1',lights:3},{at:3829,label:'GO!',lights:4}];
  const TAKEOFF_RUN_MS=720,TAKEOFF_MS=420,LAND_MS=390,LAND_RUN_MS=720;
  const FALLBACK_ANIMS={idle:[0],walk:[5,6,7],takeOff:[12,13],fly:[8,9,10,11,10,9],land:[14,15]};
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
  const state={phase:'closed',game:null,viewport:null,world:null,racers:[],player:null,raf:0,lastT:0,raceStartedAt:0,finishAt:0,keys:{up:false,down:false,left:false,right:false,boost:false},camera:{x:WORLD_W/2,y:WORLD_H/2,zoom:1,targetX:WORLD_W/2,targetY:WORLD_H/2,targetZoom:1,mode:'wide',eventUntil:0,nextDecisionAt:0,nextEventAt:0,subjectIds:[],finalLapShown:false,finalStraightShown:false,photoFinishDone:false,forcedMode:''},samples:[],totalLength:0,debugPath:false,countdownToken:0,resultOrder:[],lapBannerTimer:0,raceMusic:null,wingAudio:[],crowdAudio:null,countdownAudio:null,nextWingAt:0,sequenceTimers:[],audioFadeToken:0,aiStatsPersisted:false};

  function currentAccount(){
    try{if(typeof character!=='undefined'&&character?.username)return normKey(character.username);}catch(_e){}
    const candidates=['currentUsername','username','loggedInUser','repoUser','activeUser'];
    for(const key of candidates){try{const v=localStorage.getItem(key);if(v)return normKey(v);}catch(_e){}}
    const label=document.querySelector('.velmora-account-avatar-label,[data-account-username],#currentUserName,.account-username');
    return normKey(label?.textContent||'guest');
  }

  function ensureRaceSkyStyles(){
    if(document.getElementById('dragon-race-sky-styles'))return;
    const style=document.createElement('style');
    style.id='dragon-race-sky-styles';
    style.textContent=`
      .dragon-race-sky-overlay{position:absolute;left:2.4%;right:2.4%;top:4.5%;height:36%;pointer-events:none;overflow:hidden;z-index:2;mask-image:linear-gradient(to bottom, rgba(0,0,0,.98) 0%, rgba(0,0,0,.98) 68%, rgba(0,0,0,.35) 86%, transparent 100%);}
      .dragon-race-sky-item{position:absolute;left:calc(-1 * var(--w,180px));top:var(--top,10%);width:var(--w,180px);height:var(--h,72px);opacity:var(--opacity,.8);will-change:transform,opacity;animation:dragonRaceSkyTraverse var(--dur,90s) linear infinite;animation-delay:var(--delay,0s);}
      .dragon-race-sky-float{width:100%;height:100%;will-change:transform;animation:dragonRaceSkyBob var(--bobdur,8s) ease-in-out infinite;}
      .dragon-race-sky-sprite{display:block;width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none;image-rendering:auto;}
      .dragon-race-sky-item.is-cloud{z-index:1;mix-blend-mode:normal;}
      .dragon-race-sky-item.is-cloud .dragon-race-sky-sprite{filter:drop-shadow(0 5px 14px rgba(7,16,34,.12));}
      .dragon-race-sky-item.is-airship{z-index:2;}
      .dragon-race-sky-item.is-airship .dragon-race-sky-float{animation:dragonRaceSkyBob var(--bobdur,11s) ease-in-out infinite, dragonRaceSkyYaw var(--yawdur,15s) ease-in-out infinite;transform-origin:center center;}
      .dragon-race-sky-item.is-airship .dragon-race-sky-sprite{filter:drop-shadow(0 10px 24px rgba(8,18,38,.22));}
      @keyframes dragonRaceSkyTraverse{0%{transform:translate3d(0,0,0);opacity:0;}8%{opacity:var(--opacity,.8);}92%{opacity:var(--opacity,.8);}100%{transform:translate3d(calc(112vw + var(--w,180px)),0,0);opacity:0;}}
      @keyframes dragonRaceSkyBob{0%,100%{transform:translate3d(0,0,0);}50%{transform:translate3d(0,var(--bob,-8px),0);}}
      @keyframes dragonRaceSkyYaw{0%,100%{transform:translate3d(0,0,0) rotate(0deg);}50%{transform:translate3d(0,var(--bob,-8px),0) rotate(var(--tilt,1.2deg));}}
    `;
    document.head.appendChild(style);
  }

  function rand(min,max){return min+Math.random()*(max-min);}
  function pick(list){return list[Math.floor(Math.random()*list.length)]||list[0];}
  function skyItemMarkup(kind,index){
    return `<div class="dragon-race-sky-item is-${kind}" data-sky-kind="${kind}" data-sky-index="${index}"><div class="dragon-race-sky-float"><img class="dragon-race-sky-sprite" alt="" draggable="false"></div></div>`;
  }
  function configureSkyItem(el,kind,initial=false){
    if(!el)return;
    const img=el.querySelector('.dragon-race-sky-sprite');
    if(!img)return;
    if(kind==='cloud'){
      const w=rand(120,210),h=w*rand(.22,.34),dur=rand(68,112),top=rand(6,31),opacity=rand(.62,.84),bob=rand(-8,-3),bobdur=rand(8.5,14.5);
      img.src=pick(SKY_CLOUDS);
      el.style.setProperty('--w',`${w.toFixed(0)}px`);
      el.style.setProperty('--h',`${h.toFixed(0)}px`);
      el.style.setProperty('--top',`${top.toFixed(2)}%`);
      el.style.setProperty('--opacity',opacity.toFixed(2));
      el.style.setProperty('--dur',`${dur.toFixed(2)}s`);
      el.style.setProperty('--bob',`${bob.toFixed(2)}px`);
      el.style.setProperty('--bobdur',`${bobdur.toFixed(2)}s`);
      if(initial)el.style.setProperty('--delay',`${(-rand(0,dur)).toFixed(2)}s`); else el.style.setProperty('--delay','0s');
    }else{
      const w=rand(92,180),h=w*rand(.46,.68),dur=rand(82,138),top=rand(7,24),opacity=rand(.66,.86),bob=rand(-10,-4),bobdur=rand(10.5,18),tilt=rand(-1.4,1.4),yawdur=rand(13,20);
      img.src=pick(SKY_AIRSHIPS);
      el.style.setProperty('--w',`${w.toFixed(0)}px`);
      el.style.setProperty('--h',`${h.toFixed(0)}px`);
      el.style.setProperty('--top',`${top.toFixed(2)}%`);
      el.style.setProperty('--opacity',opacity.toFixed(2));
      el.style.setProperty('--dur',`${dur.toFixed(2)}s`);
      el.style.setProperty('--bob',`${bob.toFixed(2)}px`);
      el.style.setProperty('--bobdur',`${bobdur.toFixed(2)}s`);
      el.style.setProperty('--tilt',`${tilt.toFixed(2)}deg`);
      el.style.setProperty('--yawdur',`${yawdur.toFixed(2)}s`);
      if(initial)el.style.setProperty('--delay',`${(-rand(0,dur)).toFixed(2)}s`); else el.style.setProperty('--delay','0s');
    }
  }
  function populateSkyOverlay(game){
    const overlay=game?.querySelector('.dragon-race-sky-overlay');
    if(!overlay)return;
    overlay.innerHTML='';
    const cloudCount=5,airshipCount=2;
    for(let i=0;i<cloudCount;i++)overlay.insertAdjacentHTML('beforeend',skyItemMarkup('cloud',i));
    for(let i=0;i<airshipCount;i++)overlay.insertAdjacentHTML('beforeend',skyItemMarkup('airship',i));
    overlay.querySelectorAll('.dragon-race-sky-item').forEach(el=>{
      const kind=el.dataset.skyKind==='airship'?'airship':'cloud';
      configureSkyItem(el,kind,true);
      el.addEventListener('animationiteration',()=>configureSkyItem(el,kind,false));
    });
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
  function animationFrames(breed,key){
    if(key==='fly'){
      const cleanFlight=buildRaceAnimFrames(breed,[8,9,10,11,10,9],'fly');
      if(cleanFlight.length>=4)return cleanFlight;
    }
    if(key==='takeOff'){
      const takeoff=buildRaceAnimFrames(breed,[12,13],'takeOff');
      if(takeoff.length>=2)return takeoff;
    }
    if(key==='land'){
      const landing=buildRaceAnimFrames(breed,[14,15],'land');
      if(landing.length>=2)return landing;
    }
    const frames=registryBreed(breed)?.animations?.[key]?.frames;
    if(Array.isArray(frames)&&frames.length)return frames.map(f=>({src:f.src,durationMs:Math.max(80,Number(f.durationMs)||145)}));
    return (FALLBACK_ANIMS[key]||FALLBACK_ANIMS.idle).map(frame=>({src:spriteSrc(breed,frame),durationMs:key==='walk'?185:key==='takeOff'?170:key==='land'?190:key==='fly'?145:900}));
  }
  function nativeFacingRight(breed){return String(registryBreed(breed)?.nativeFacing||'right').toLowerCase()!=='left';}
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

  function makeSkyOverlay(){
    return '';
  }

  function debugSvg(){
    const pts=state.samples.filter((_,i)=>i%3===0).map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const cps=CHECKPOINTS.map((p,i)=>{const q=pointAt(p);return `<circle cx="${q.x}" cy="${q.y}" r="7"><title>CP ${i+1}</title></circle>`}).join('');
    return `<svg class="dragon-race-debug-svg" viewBox="0 0 ${WORLD_W} ${WORLD_H}"><polyline points="${pts}"></polyline>${cps}</svg>`;
  }

  function ensureGame(){
    ensureRaceSkyStyles();
    const shell=document.querySelector('#dragonRacingModal .dragon-racing-shell');if(!shell)return null;
    let game=shell.querySelector('.dragon-race-game');
    if(game){state.game=game;state.viewport=game.querySelector('.dragon-race-viewport');state.world=game.querySelector('.dragon-race-world');return game;}
    game=document.createElement('div');game.className='dragon-race-game';
    game.innerHTML=`<div class="dragon-race-viewport"><div class="dragon-race-world"><img class="dragon-race-world-bg" src="${ASSET}" alt="Velmora City Circuit"><div class="dragon-race-atmosphere">${makeAtmosphere()}</div>${debugSvg()}<div class="dragon-race-racers"></div></div><div class="dragon-race-tv-glass" aria-hidden="true"></div><div class="dragon-race-sky-overlay" aria-hidden="true">${makeSkyOverlay()}</div><div class="dragon-race-hud"><div class="dragon-race-hud-top"><div class="dragon-race-hud-cluster"><div class="dragon-race-hud-box is-position"><small>POSITION</small><b data-race-position>— / 6</b></div><div class="dragon-race-hud-box"><small>LAP</small><b data-race-lap>1 / 3</b></div><div class="dragon-race-hud-box"><small>TIME</small><b data-race-time>00:00.00</b></div></div><div class="dragon-race-hud-box dragon-race-hud-dragon"><img data-race-player-icon alt=""><span><strong data-race-player-name>Your Dragon</strong><em>VELMORA CITY CIRCUIT</em></span></div></div><div class="dragon-race-auto-badge"><b>LIVE AUTONOMOUS RACE</b> · Velmora Racing Network</div><div class="dragon-race-lap-banner"></div><div class="dragon-race-exit" role="button" tabindex="0">EXIT RACE</div></div><div class="dragon-race-broadcast-title"><small>LIVE FROM VELMORA</small><b>VELMORA CITY CIRCUIT</b><em>RACE ${RACE_NUMBER}</em></div><div class="dragon-race-start-lights" aria-hidden="true"><i></i><i></i><i></i></div><div class="dragon-race-camera-cut" aria-hidden="true"></div><div class="dragon-race-countdown"><b></b></div></div><div class="dragon-race-results"><div class="dragon-race-results-card"></div></div>`;
    populateSkyOverlay(game);
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
    state.racers.forEach(r=>{
      const el=document.createElement('div');el.className=`dragon-race-racer${r.isPlayer?' is-player':''}`;el.dataset.racerId=r.id;
      el.innerHTML=`<img src="${animationFrames(r.breed,'idle')[0]?.src||spriteSrc(r.breed,0)}" alt=""><span class="dragon-race-racer-tag">${r.isPlayer?'YOU':r.name}</span>`;
      holder.appendChild(el);r.el=el;r.img=el.querySelector('img');
    });
    const hudImg=state.game.querySelector('[data-race-player-icon]');if(hudImg)hudImg.src=playerInfo.sprite;
    const hudName=state.game.querySelector('[data-race-player-name]');if(hudName)hudName.textContent=playerInfo.name;
  }

  function formatTime(ms){const v=Math.max(0,Number(ms)||0),m=Math.floor(v/60000),s=Math.floor((v%60000)/1000),h=Math.floor((v%1000)/10);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(h).padStart(2,'0')}`;}
  function formatGap(ms,base=0){return `+${formatTime(Math.max(0,(Number(ms)||0)-(Number(base)||0)))}`;}
  function ordinal(n){const v=n%100;if(v>=11&&v<=13)return`${n}TH`;return`${n}${n%10===1?'ST':n%10===2?'ND':n%10===3?'RD':'TH'}`;}
  function showLapBanner(text){const el=state.game?.querySelector('.dragon-race-lap-banner');if(!el)return;clearTimeout(state.lapBannerTimer);el.textContent=text;el.classList.add('is-visible');state.lapBannerTimer=setTimeout(()=>el.classList.remove('is-visible'),1500);}

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
      if(r.nextCp>=CHECKPOINTS.length){const lapMs=t-r.lapStartedAt;r.bestLapMs=!r.bestLapMs?lapMs:Math.min(r.bestLapMs,lapMs);r.lapStartedAt=t;r.lastLapCross=completed;r.nextCp=0;if(r.isPlayer&&completed<LAPS)showLapBanner(completed===LAPS-1?'FINAL LAP':`LAP ${completed+1} / ${LAPS}`);}else{r.lastLapCross=completed;r.nextCp=0;}
    }
    if(r.distance>=LAPS&&!r.finished){
      r.finished=true;r.finishMs=t-state.raceStartedAt;r.finishAnimAt=t;state.resultOrder.push(r);
      if(state.resultOrder.length===2&&!state.camera.photoFinishDone){const gap=Math.abs(state.resultOrder[1].finishMs-state.resultOrder[0].finishMs);if(gap<=250){state.camera.photoFinishDone=true;setCameraMode('photoFinish',1450,true,state.resultOrder.slice(0,2).map(x=>x.id));showLapBanner('PHOTO FINISH');}}
      if(r.isPlayer)onPlayerFinish(t);
    }
  }
  function separateRacers(){for(let i=0;i<state.racers.length;i++)for(let j=i+1;j<state.racers.length;j++){const a=state.racers[i],b=state.racers[j];if(a.finished||b.finished)continue;if(Math.abs(a.distance-b.distance)<.0035&&Math.abs(a.lateral-b.lateral)<.18){const push=(a.lateral<=b.lateral?-.018:.018);a.lateral=clamp(a.lateral+push,-.82,.82);b.lateral=clamp(b.lateral-push,-.82,.82);}}}

  function renderRacer(r,t){
    const p=worldPoint(r),scale=.72+(p.y/WORLD_H)*.36,motion=racerMotionState(r,t),lift=motion==='fly'?-77:motion==='takeOff'||motion==='land'?-73:-68;
    r.el.style.left=`${p.x}px`;r.el.style.top=`${p.y}px`;r.el.style.transform=`translate(-50%,${lift}%) scale(${scale.toFixed(3)})`;r.el.style.zIndex=String(20+Math.round(p.y/9)+(r.isPlayer?20:0));
    r.el.classList.toggle('is-flying',motion==='fly');r.el.classList.toggle('is-taking-off',motion==='takeOff');r.el.classList.toggle('is-landing',motion==='land');
    const movingRight=Math.cos(p.ang)>=0,nativeRight=nativeFacingRight(r.breed);r.el.classList.toggle('is-flipped',movingRight!==nativeRight);
    const frames=animationFrames(r.breed,motion);
    if(r.animKey!==motion){r.animKey=motion;r.animIndex=0;r.frameAt=t-999;}
    const current=frames[r.animIndex%frames.length]||frames[0];
    if(current&&t-r.frameAt>=current.durationMs){r.frameAt=t;r.animIndex=(r.animIndex+1)%frames.length;const next=frames[r.animIndex]||frames[0];if(next?.src&&r.img.getAttribute('src')!==next.src)r.img.src=next.src;}
    else if(current?.src&&!r.img.getAttribute('src'))r.img.src=current.src;
  }
  function standings(){return state.racers.slice().sort((a,b)=>{if(a.finished&&b.finished)return a.finishMs-b.finishMs;if(a.finished)return-1;if(b.finished)return 1;return b.distance-a.distance;});}
  function updateHud(t){const rank=Math.max(1,standings().findIndex(r=>r.isPlayer)+1),p=state.player;const pos=state.game.querySelector('[data-race-position]'),lap=state.game.querySelector('[data-race-lap]'),time=state.game.querySelector('[data-race-time]');if(pos)pos.textContent=`${rank} / ${RACER_COUNT}`;if(lap)lap.textContent=`${Math.min(LAPS,Math.floor(Math.max(0,p.distance))+1)} / ${LAPS}`;if(time)time.textContent=formatTime(state.raceStartedAt?t-state.raceStartedAt:0);}
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
      return{x:p?lerp(focus.x,p.x,.48):focus.x,y:p?lerp(focus.y,p.y,.48):focus.y,zoom:1.62};
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
    if(!cam.finalStraightShown&&leader.distance>=LAPS-0.13){cam.finalStraightShown=true;setCameraMode('finalStraight',5200,false);cam.nextEventAt=t+7000;return;}
    if(!cam.finalLapShown&&leaderLap>=LAPS){cam.finalLapShown=true;setCameraMode('finalLeader',2400,true,[leader.id]);showLapBanner('FINAL LAP');cam.nextEventAt=t+7200;return;}
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
  }

  function onPlayerFinish(t){state.phase='player_finished';state.finishAt=t;const p=state.player,rank=standings().findIndex(r=>r.isPlayer)+1;persistResult(p,rank);showLapBanner(`${ordinal(rank)} PLACE · FINISH`);setTimeout(()=>{if(state.phase==='player_finished')showResults();},1800);}
  function persistResult(player,rank){
    const data=loadSave(),tracks=data.tracks||(data.tracks={}),s=tracks.velmora_city_circuit||(tracks.velmora_city_circuit={races:0,wins:0,podiums:0,bestTimeMs:0,bestLapMs:0});s.races=(Number(s.races)||0)+1;if(rank===1)s.wins=(Number(s.wins)||0)+1;if(rank<=3)s.podiums=(Number(s.podiums)||0)+1;if(!s.bestTimeMs||player.finishMs<s.bestTimeMs)s.bestTimeMs=Math.round(player.finishMs);if(player.bestLapMs&&(!s.bestLapMs||player.bestLapMs<s.bestLapMs))s.bestLapMs=Math.round(player.bestLapMs);s.lastFinishPosition=rank;s.lastFinishTimeMs=Math.round(player.finishMs);s.updatedAt=Date.now();data.level=Math.max(1,Number(data.level)||1);data.xp=Math.max(0,Number(data.xp)||0);saveData(data);
    // V33.47 intentionally does NOT grant Dragon Racing XP yet.
  }
  function persistAiResults(order){
    if(state.aiStatsPersisted)return;state.aiStatsPersisted=true;const data=loadSave();data.aiPool=data.aiPool||{};
    order.forEach((r,index)=>{if(r.isPlayer||!r.identityId)return;const s=data.aiPool[r.identityId]||(data.aiPool[r.identityId]={races:0,wins:0,podiums:0,bestFinish:0});s.races=(Number(s.races)||0)+1;if(index===0)s.wins=(Number(s.wins)||0)+1;if(index<3)s.podiums=(Number(s.podiums)||0)+1;const finish=index+1;if(!s.bestFinish||finish<s.bestFinish)s.bestFinish=finish;s.lastFinish=finish;s.updatedAt=Date.now();});saveData(data);
  }
  function showResults(){
    state.phase='results';stopTransientRaceAudio(true);
    const elapsed=now()-state.raceStartedAt;
    for(const r of state.racers){
      if(r.finished)continue;
      const remaining=Math.max(0,LAPS-r.distance),projected=remaining/Math.max(.021,r.speed||.024)*1000;
      r.finished=true;r.finishMs=elapsed+projected;
      if(!r.bestLapMs)r.bestLapMs=Math.max(1,r.finishMs/LAPS);
    }
    const results=state.game.querySelector('.dragon-race-results'),card=results.querySelector('.dragon-race-results-card'),order=standings(),rank=order.findIndex(r=>r.isPlayer)+1,p=state.player,stats=getTrackStats();
    const leader=order[0]||p,last=order[order.length-1]||p,leaderBestLap=Math.min(...order.map(r=>Number(r.bestLapMs)||Infinity).filter(Number.isFinite));
    const positionLabel=rank===1?'Race Winner':rank<=3?'Podium Finish':rank<=Math.ceil(RACER_COUNT/2)?'Strong Finish':'Race Complete';
    persistAiResults(order);
    card.innerHTML=`
      <div class="dragon-race-results-hero">
        <div class="dragon-race-results-titlewrap">
          <small class="dragon-race-results-kicker">VELMORA CITY CIRCUIT · RACE ${RACE_NUMBER}</small>
          <h2>Race Complete</h2>
          <p class="dragon-race-result-subtitle">${positionLabel}. ${rank===1?'You took the chequered flag.':`You brought ${p.name} home in ${ordinal(rank)} place.`}</p>
        </div>
        <div class="dragon-race-result-position-badge">
          <span class="dragon-race-result-position-value">${ordinal(rank)}</span>
          <span class="dragon-race-result-position-label">FINAL POSITION</span>
        </div>
      </div>
      <div class="dragon-race-result-stats">
        <div class="dragon-race-result-stat is-accent"><b>Finish Time</b><em>${formatTime(p.finishMs)}</em><small>${rank===1?'Fastest finisher on the circuit today':`${formatGap(p.finishMs,leader.finishMs)} behind ${leader.name}`}</small></div>
        <div class="dragon-race-result-stat"><b>Best Lap</b><em>${formatTime(p.bestLapMs)}</em><small>${Number.isFinite(leaderBestLap)&&p.bestLapMs>leaderBestLap?`${formatGap(p.bestLapMs,leaderBestLap)} off quickest lap`:'Set the pace when it mattered'}</small></div>
        <div class="dragon-race-result-stat"><b>Personal Best</b><em>${stats.bestTimeMs?formatTime(stats.bestTimeMs):formatTime(p.finishMs)}</em><small>${stats.bestTimeMs&&stats.bestTimeMs<p.finishMs?`${formatGap(p.finishMs,stats.bestTimeMs)} off your best`:'New benchmark stored for this track'}</small></div>
        <div class="dragon-race-result-stat"><b>Field Spread</b><em>${formatTime(Math.max(0,(last.finishMs||p.finishMs)-(leader.finishMs||p.finishMs)))}</em><small>${leader.name} to ${last.name}</small></div>
      </div>
      <div class="dragon-race-results-board">
        <div class="dragon-race-results-board-head"><span>Final Standings</span><em>Velmora Racing Network</em></div>
        <div class="dragon-race-standings">${order.map((r,i)=>`<div class="dragon-race-standing${r.isPlayer?' is-player':''}${i===0?' is-winner':''}"><div class="dragon-race-standing-rank">${i+1}</div><div class="dragon-race-standing-info"><span class="dragon-race-standing-name">${r.name}${r.isPlayer?' · YOU':''}</span><span class="dragon-race-standing-note">${r.isPlayer?'Your dragon':(r.personality||'Circuit regular')}</span></div><em class="dragon-race-standing-time">${r.finished?formatTime(r.finishMs):'Racing'}</em></div>`).join('')}</div>
      </div>
      <div class="dragon-race-results-note">Dragon Racing XP rewards are currently disabled while the racing system is being tested.</div>
      <div class="dragon-race-results-actions"><div class="is-primary" role="button" tabindex="0" data-race-again>RACE AGAIN</div><div role="button" tabindex="0" data-race-track-select>TRACK SELECT</div><div role="button" tabindex="0" data-race-leave>LEAVE RACEWAY</div></div>`;
    results.classList.add('is-visible');
    bindAction(card.querySelector('[data-race-again]'),()=>start({id:'velmora_city_circuit'}));
    bindAction(card.querySelector('[data-race-track-select]'),()=>exitToTrackSelect());
    bindAction(card.querySelector('[data-race-leave]'),()=>{stop();window.DragonRacingUi?.close?.();});
  }

  function loop(t){if(!state.game||state.phase==='closed')return;state.raf=requestAnimationFrame(loop);const dt=Math.min(.05,Math.max(0,(t-state.lastT)/1000)||.016);state.lastT=t;if(state.phase==='racing'||state.phase==='player_finished'){for(const r of state.racers){if(r.finished)continue;autoRacerUpdate(r,dt,t);updateCheckpointAndLap(r,t);}separateRacers();maybePlayWingSound(t);evaluateCamera(t);}for(const r of state.racers)renderRacer(r,t);updateHud(t);updateCamera(dt,t);}

  function start(track={id:'velmora_city_circuit'}){
    if(track.id&&track.id!=='velmora_city_circuit')return false;stop(false);const progression=loadSave();saveData(progression);if(!state.samples.length)buildSamples();const game=ensureGame();if(!game)return false;
    document.getElementById('dragonRacingModal')?.classList.add('is-race-active');game.querySelector('.dragon-race-results')?.classList.remove('is-visible');game.classList.toggle('is-debug-path',state.debugPath);createRacers();setPhase('setup');state.resultOrder=[];state.finishAt=0;state.aiStatsPersisted=false;state.camera={x:WORLD_W/2,y:WORLD_H/2,zoom:1,targetX:WORLD_W/2,targetY:WORLD_H/2,targetZoom:1,mode:'wide',eventUntil:0,nextDecisionAt:0,nextEventAt:0,subjectIds:[],finalLapShown:false,finalStraightShown:false,photoFinishDone:false,forcedMode:''};state.keys={up:false,down:false,left:false,right:false,boost:false};game.classList.add('is-visible');window.DragonRacingUi?.fadeMenuAudioOut?.(650);startRaceAudio();state.lastT=now();if(state.raf)cancelAnimationFrame(state.raf);state.raf=requestAnimationFrame(loop);queueSequence(()=>{if(state.phase==='setup')startCeremony();},320,state.countdownToken);return true;
  }
  function stop(remove=false){
    state.countdownToken++;clearSequenceTimers();state.audioFadeToken++;if(state.raf){cancelAnimationFrame(state.raf);state.raf=0;}clearTimeout(state.lapBannerTimer);state.lapBannerTimer=0;stopRaceAudio(true);setPhase('closed');state.keys={up:false,down:false,left:false,right:false,boost:false};document.getElementById('dragonRacingModal')?.classList.remove('is-race-active');
    if(state.game){state.game.classList.remove('is-visible','is-debug-path');state.game.querySelector('.dragon-race-results')?.classList.remove('is-visible');state.game.querySelector('.dragon-race-countdown')?.classList.remove('is-pop');state.game.querySelector('.dragon-race-broadcast-title')?.classList.remove('is-visible');state.game.querySelector('.dragon-race-start-lights')?.classList.remove('is-visible','is-go');const lapBanner=state.game.querySelector('.dragon-race-lap-banner');if(lapBanner){lapBanner.classList.remove('is-visible');lapBanner.textContent='';}if(remove){state.game.remove();state.game=null;state.viewport=null;state.world=null;}}
  }
  function exitToTrackSelect(){stop();window.DragonRacingUi?.closeRaceConfirm?.();requestAnimationFrame(()=>{window.DragonRacingUi?.showScene?.('menu');window.DragonRacingUi?.restoreMenuAudio?.(450);});}
  function isActive(){return state.phase!=='closed';}

  // V33.48: races are fully autonomous; there are deliberately no steering/boost keybinds.


  function admin(){return currentAccount()==='admin';}
  window.DragonRacingRace={start,stop,exitToTrackSelect,isActive,getPlayerInfo,getProgression,getTrackStats,formatTime};
  window.DragonRacingDebug={
    inspect(){if(!admin())return null;return{phase:state.phase,player:state.player?{distance:state.player.distance,lateral:state.player.lateral,speed:state.player.speed,boost:state.player.boost,finished:state.player.finished,auto:true,raceLuck:state.player.ai?.raceLuck||0,tinyBias:state.player.ai?.extraBias||0,motion:racerMotionState(state.player,now())}:null,progression:getProgression(),stats:getTrackStats()};},
    showPath(on=true){if(!admin())return false;state.debugPath=on!==false;state.game?.classList.toggle('is-debug-path',state.debugPath);return state.debugPath;},
    showCheckpoints(on=true){return this.showPath(on);},
    setLap(lap=1){if(!admin()||!state.player)return null;state.player.distance=Math.max(0,Number(lap)-1)+mod1(state.player.distance);return state.player.distance;},
    teleportToCheckpoint(index=0){if(!admin()||!state.player)return null;const i=clamp(Math.floor(index),0,CHECKPOINTS.length-1);state.player.distance=Math.floor(Math.max(0,state.player.distance))+CHECKPOINTS[i];state.player.nextCp=i+1;return state.player.distance;},
    setSpeed(value=.025){if(!admin()||!state.player)return null;state.player.speed=clamp(value,0,.06);return state.player.speed;},
    finishRace(){if(!admin()||!state.player)return false;state.player.distance=LAPS+.001;updateCheckpointAndLap(state.player,now());if(!state.player.finished){state.player.finished=true;state.player.finishMs=now()-state.raceStartedAt;onPlayerFinish(now());}return true;},
    camera(){if(!admin())return null;return{mode:state.camera.mode,x:+state.camera.x.toFixed(1),y:+state.camera.y.toFixed(1),zoom:+state.camera.zoom.toFixed(3),eventUntil:state.camera.eventUntil,subjects:[...state.camera.subjectIds]};},
    forceCamera(mode='follow'){if(!admin())return false;const valid=['follow','closeBattle','widePack','panAhead','finalLeader','finalStraight','photoFinish','grid','ceremonyWide'];if(!valid.includes(mode))return false;let subjects=[];if(mode==='closeBattle')subjects=standings().slice(0,2).map(r=>r.id);setCameraMode(mode,4000,true,subjects);return true;},
    inspectAiPool(){if(!admin())return null;const saved=loadSave().aiPool||{};return expandedAiPool().map(r=>({...r,stats:{races:0,wins:0,podiums:0,bestFinish:0,...(saved[r.id]||{})}}));},
    forcePhotoFinish(){if(!admin())return false;state.camera.photoFinishDone=true;setCameraMode('photoFinish',1800,true,state.racers.slice(0,2).map(r=>r.id));showLapBanner('PHOTO FINISH');return true;},
    inspectRacers(){if(!admin())return null;return standings().map((r,i)=>({position:i+1,id:r.id,name:r.name,personality:r.personality||'',style:r.style||'',distance:+r.distance.toFixed(4),lane:+r.lateral.toFixed(2),speed:+r.speed.toFixed(4),finished:r.finished}));}
  };
})();