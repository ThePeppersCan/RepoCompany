(function(){
  if(window.__dragonRacingUiV3395)return;
  window.__dragonRacingUiV3395=true;

  const ASSET_BASE='dragon-racing-assets';
  const state={scene:'exterior',audio:null,observer:null,selectedTrackIndex:0,syncTrackUi:null};

  const TRACK_PREVIEW_BASE=`${ASSET_BASE}/track-previews`;
  const TRACK_AVATAR_BASE=`${ASSET_BASE}/course-avatars`;
  const DRAGON_RACING_ICON=`${ASSET_BASE}/dragon-racing-icon.png`;
  const TRACKS=[
    {id:'velmora_city_circuit',name:'Velmora City Circuit',file:'velmora_city_circuit_preview.png',avatar:'velmora_city_circuit_64.png',region:'Velmora City',style:'City Circuit',difficulty:'Easy',difficultyRank:1,level:1,gpPerHour:67000},
    {id:'canto_meadow_circuit',name:'Canto Meadow Circuit',file:'canto_meadow_circuit_preview.png',avatar:'canto_meadow_circuit_64.png',region:'Canto Meadows',style:'Open Circuit',difficulty:'Easy–Medium',difficultyRank:2,level:9,gpPerHour:86000},
    {id:'greenwater_canopy_arena',name:'Greenwater Canopy Arena',file:'greenwater_canopy_arena_preview.png',avatar:'greenwater_canopy_arena_64.png',region:'Greenwater',style:'Forest Arena',difficulty:'Medium',difficultyRank:3,level:17,gpPerHour:100000},
    {id:'talune_greenwater_canopy',name:'Talune Greenwater Canopy',file:'talune_greenwater_canopy_preview.png',avatar:'talune_greenwater_canopy_64.png',region:'Talune',style:'Canopy Circuit',difficulty:'Medium',difficultyRank:3,level:25,gpPerHour:110000},
    {id:'sunfire_oasis_arena',name:'Sunfire Oasis Arena',file:'sunfire_oasis_arena_preview.png',avatar:'sunfire_oasis_arena_64.png',region:'Sunfire Oasis',style:'Oasis Arena',difficulty:'Medium–Hard',difficultyRank:4,level:33,gpPerHour:120000},
    {id:'skarholt_aurora_circuit',name:'Skarholt Aurora Circuit',file:'skarholt_aurora_circuit_preview.png',avatar:'skarholt_aurora_circuit_64.png',region:'Skarholt',style:'Aurora Circuit',difficulty:'Hard',difficultyRank:4,level:41,gpPerHour:130000},
    {id:'hollowfire_citadel_circuit',name:'Hollowfire Citadel Circuit',file:'hollowfire_citadel_circuit_preview.png',avatar:'hollowfire_citadel_circuit_64.png',region:'Hollowfire Citadel',style:'Citadel Circuit',difficulty:'Hard',difficultyRank:4,level:49,gpPerHour:138000},
    {id:'iskara_crown_arena',name:'Iskara Crown Arena',file:'iskara_crown_arena_preview.png',avatar:'iskara_crown_arena_64.png',region:'Iskara',style:'Crown Arena',difficulty:'Hard',difficultyRank:4,level:57,gpPerHour:145000},
    {id:'qasira_moon_orbit',name:'Qasira Moon Orbit',file:'qasira_moon_orbit_preview.png',avatar:'qasira_moon_orbit_64.png',region:'Qasira',style:'Aerial Orbit',difficulty:'Expert',difficultyRank:5,level:65,gpPerHour:150000}
  ];

  const PLAYABLE_TRACK_IDS=new Set(['velmora_city_circuit','canto_meadow_circuit']);
  const trackIsPlayable=track=>Boolean(track&&PLAYABLE_TRACK_IDS.has(track.id));
  const trackIsUnlocked=(track,progression)=>Boolean(trackIsPlayable(track)&&Number(progression?.level||1)>=Number(track.level||1));

  const escHtml=value=>String(value??'').replace(/[&<>\"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]));

  const roundedMarksPerHour=value=>{
    const n=Math.max(0,Number(value)||0);
    return n?Math.round(n/50)*50:0;
  };
  const rewardInfoForTrack=track=>{
    try{
      const live=window.DragonRacingRace?.getRewardInfo?.(track.id);
      if(live?.averageGpPerHour)return live;
    }catch(_e){}
    if(track?.gpPerHour)return {averageGpPerHour:Number(track.gpPerHour)||0};
    return null;
  };


  const trackRowHtml=(track,index)=>`<div class="dragon-racing-track-row${index===state.selectedTrackIndex?' is-selected':''}" role="button" tabindex="0" data-track-index="${index}" aria-label="Select ${escHtml(track.name)}"><span class="dragon-racing-track-thumb"><img src="${TRACK_AVATAR_BASE}/${track.avatar}" alt="" aria-hidden="true"></span><span class="dragon-racing-track-copy"><strong>${escHtml(track.name)}</strong><small>${escHtml(track.region)} · ${escHtml(track.difficulty)}</small></span><em>LV. ${track.level}</em></div>`;

  const renderTrackSelect=(modal)=>{
    const ui=modal?.querySelector('.dragon-racing-track-ui');
    if(!ui)return;
    const track=TRACKS[state.selectedTrackIndex]||TRACKS[0];
    const progression=window.DragonRacingRace?.getProgression?.()||{level:1,xp:0,nextLevelXp:83};
    const list=ui.querySelector('.dragon-racing-track-list');
    if(list)list.innerHTML=TRACKS.map(trackRowHtml).join('');
    const preview=ui.querySelector('.dragon-racing-track-preview-img');
    if(preview){preview.src=`${TRACK_PREVIEW_BASE}/${track.file}`;preview.alt=`${track.name} track preview`;}
    const previewName=ui.querySelector('.dragon-racing-track-preview-name');
    if(previewName)previewName.textContent=track.name;
    const style=ui.querySelector('[data-track-race-style]');
    if(style)style.textContent=track.style;
    const difficulty=ui.querySelector('[data-track-detail="difficulty"]');
    if(difficulty){
      const rank=Math.max(1,Math.min(5,Number(track.difficultyRank)||1));
      difficulty.innerHTML=`<div class="dragon-racing-detail-heading">DIFFICULTY</div><div class="dragon-racing-detail-primary"><strong>${escHtml(track.difficulty)}</strong><span class="dragon-racing-difficulty-meter" aria-hidden="true">${[1,2,3,4,5].map(i=>`<i class="${i<=rank?'is-on':''}"></i>`).join('')}</span></div>`;
    }
    const setting=ui.querySelector('[data-track-detail="region"]');
    if(setting){setting.innerHTML=`<div class="dragon-racing-detail-heading">SETTING</div><div class="dragon-racing-detail-primary"><strong>${escHtml(track.region)}</strong><span>${escHtml(track.style)}</span></div>`;}
    const access=ui.querySelector('[data-track-detail="access"]');
    if(access){
      const rewardInfo=rewardInfoForTrack(track),marksPerHour=roundedMarksPerHour(rewardInfo?.averageMarksPerHour),gpPerHour=Math.max(0,Math.round(Number(rewardInfo?.averageGpPerHour)||0));
      const rewardRate=gpPerHour?`≈ ${gpPerHour.toLocaleString('en-GB')} GP / hr`:'Reward rate TBA';
      const rewardSub=gpPerHour?(trackIsPlayable(track)?`${marksPerHour?`≈ ${marksPerHour.toLocaleString('en-GB')} Marks / hr · `:''}average across finishes`:'Projected higher-level payout'):'Available when course rewards launch';
      const playerLevel=Math.max(1,Number(progression.level)||1),playerXp=Math.max(0,Number(progression.xp)||0),unlocked=trackIsUnlocked(track,progression);
      const accessLine=!trackIsPlayable(track)?`Future course · Lv. ${track.level}`:unlocked?`Unlocked · Lv. ${track.level}`:`Requires Dragon Racing Lv. ${track.level}`;
      const accessSub=`Your Dragon Racing · Lv. ${playerLevel} · ${playerXp.toLocaleString('en-GB')} XP`;
      access.innerHTML=`<div class="dragon-racing-access-lockup"><img src="${DRAGON_RACING_ICON}" alt="" aria-hidden="true"><div class="dragon-racing-access-main"><div class="dragon-racing-detail-heading">ACCESS</div><strong>${accessLine}</strong><span>${accessSub}</span></div><div class="dragon-racing-track-reward-rate${gpPerHour?' is-live':''}"><small>REWARD RATE</small><strong>${rewardRate}</strong><span>${rewardSub}</span></div></div>`;
    }
    const enterNote=ui.querySelector('[data-track-enter-note]');
    if(enterNote)enterNote.textContent=`${track.name} · Lv. ${track.level}`;
    ui.dataset.trackId=track.id;
  };

  const selectTrack=(modal,index)=>{
    const next=Math.max(0,Math.min(TRACKS.length-1,Number(index)||0));
    if(next===state.selectedTrackIndex){renderTrackSelect(modal);return;}
    state.selectedTrackIndex=next;
    const ui=modal?.querySelector('.dragon-racing-track-ui');
    if(ui){ui.classList.remove('is-changing');void ui.offsetWidth;ui.classList.add('is-changing');}
    renderTrackSelect(modal);
  };

  const cycleTrack=(modal,delta)=>{
    const total=TRACKS.length;
    state.selectedTrackIndex=(state.selectedTrackIndex+delta+total)%total;
    const ui=modal?.querySelector('.dragon-racing-track-ui');
    if(ui){ui.classList.remove('is-changing');void ui.offsetWidth;ui.classList.add('is-changing');}
    renderTrackSelect(modal);
  };


  const matchLabel=(el,parts)=>{
    if(!el)return false;
    const fields=[
      el.textContent||'',
      el.getAttribute?.('aria-label')||'',
      el.getAttribute?.('title')||'',
      el.id||'',
      el.className||'',
      el.dataset?.action||'',
      (el.querySelector?.('img')?.alt)||'',
      (el.querySelector?.('img')?.src)||''
    ].join(' ').toLowerCase();
    return parts.every(p=>fields.includes(p));
  };

  const throttle=(fn,wait=180)=>{
    let t=0, raf=0;
    return (...args)=>{
      const now=Date.now();
      const run=()=>{raf=0;t=Date.now();fn(...args)};
      if(now-t>=wait){run();return}
      if(raf)cancelAnimationFrame(raf);
      raf=requestAnimationFrame(run);
    };
  };

  const createParticles=(container,kind,count)=>{
    for(let i=0;i<count;i++){
      const s=document.createElement('span');
      s.className=`dragon-racing-particle is-${kind}`;
      s.style.left=`${Math.random()*100}%`;
      s.style.top=kind==='leaf'?`${-10-Math.random()*20}%`:`${76+Math.random()*18}%`;
      s.style.setProperty('--dur',`${kind==='leaf' ? 13+Math.random()*7 : 9+Math.random()*6}s`);
      s.style.setProperty('--delay',`${Math.random()*-14}s`);
      s.style.setProperty('--drift',`${(kind==='leaf' ? -120 : -55) + Math.random()*(kind==='leaf'?240:110)}px`);
      container.appendChild(s);
    }
  };

  const formatRaceTime=ms=>{
    const value=Math.max(0,Number(ms)||0),minutes=Math.floor(value/60000),seconds=Math.floor((value%60000)/1000),hundredths=Math.floor((value%1000)/10);
    return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(hundredths).padStart(2,'0')}`;
  };

  const closeRaceConfirm=modal=>{
    const confirm=modal?.querySelector('.dragon-racing-track-confirm');
    if(!confirm)return;
    confirm.classList.remove('is-visible');
    confirm.setAttribute('aria-hidden','true');
  };

  const openRaceConfirm=modal=>{
    const track=TRACKS[state.selectedTrackIndex]||TRACKS[0],confirm=modal?.querySelector('.dragon-racing-track-confirm');
    if(!confirm)return;
    const player=window.DragonRacingRace?.getPlayerInfo?.()||{};
    const progression=window.DragonRacingRace?.getProgression?.()||{level:1};
    const stats=window.DragonRacingRace?.getTrackStats?.(track.id)||{};
    const name=confirm.querySelector('[data-race-confirm-name]');if(name)name.textContent=track.name;
    const diff=confirm.querySelector('[data-race-confirm-difficulty]');if(diff)diff.textContent=track.difficulty;
    const level=confirm.querySelector('[data-race-confirm-level]');if(level)level.textContent=`Dragon Racing Lv. ${track.level}`;
    const best=confirm.querySelector('[data-race-confirm-best]');if(best)best.textContent=stats.bestTimeMs?formatRaceTime(stats.bestTimeMs):'—';
    const note=confirm.querySelector('[data-race-confirm-note]');
    if(note){
      if(!trackIsPlayable(track))note.textContent='Race course not yet available. You can still preview this course.';
      else if(Number(progression.level||1)<track.level)note.textContent=`Requires Dragon Racing Lv. ${track.level}. Complete races to earn Dragon Racing XP.`;
      else note.textContent=`${player.name||'Your dragon'} is ready for the ${track.name}.`;
    }
    const enter=confirm.querySelector('[data-race-confirm-enter]');
    if(enter){
      enter.classList.toggle('is-disabled',!trackIsUnlocked(track,progression));
      enter.setAttribute('aria-disabled',enter.classList.contains('is-disabled')?'true':'false');
    }
    confirm.classList.add('is-visible');
    confirm.setAttribute('aria-hidden','false');
  };

  const startSelectedRace=modal=>{
    const track=TRACKS[state.selectedTrackIndex]||TRACKS[0];
    const progression=window.DragonRacingRace?.getProgression?.()||{level:1};
    if(!trackIsUnlocked(track,progression)){
      const note=modal?.querySelector('[data-race-confirm-note]');if(note)note.textContent=trackIsPlayable(track)?`Requires Dragon Racing Lv. ${track.level}. Complete races to earn XP.`:'Race course not yet available. You can still preview this course.';
      return false;
    }
    closeRaceConfirm(modal);
    window.DragonRacingRace?.start?.(track);
    return true;
  };

  const fadeMenuAudioTo=(target=.30,duration=500)=>{
    const audio=state.audio;if(!audio)return;
    const from=Number(audio.volume)||0,to=Math.max(0,Math.min(1,Number(target)||0)),start=performance.now();
    const step=now=>{const p=Math.min(1,(now-start)/Math.max(1,duration)),v=from+(to-from)*p;audio.volume=v;if(p<1)requestAnimationFrame(step);else if(to<=.001){try{audio.pause();}catch(_e){}}};
    requestAnimationFrame(step);
  };

  const ensureModal=()=>{
    let modal=document.getElementById('dragonRacingModal');
    if(modal)return modal;
    modal=document.createElement('div');
    modal.id='dragonRacingModal';
    modal.className='dragon-racing-modal';
    modal.innerHTML=`
      <div class="dragon-racing-shell" role="dialog" aria-modal="true" aria-labelledby="dragonRacingTitle">
        <button class="dragon-racing-back" id="dragonRacingBack" type="button" hidden aria-label="Back to previous Dragon Racing scene">← Back</button>
        <button class="dragon-racing-close" id="dragonRacingClose" type="button" aria-label="Close Dragon Racing">✕</button>
        <div class="dragon-racing-header"><small>VELMORA DRAGONBOUND</small><b id="dragonRacingTitle">Dragon Racing</b></div>
        <div class="dragon-racing-stage">
          <section class="dragon-racing-scene is-active" data-scene="exterior">
            <div class="dragon-racing-image-wrap"><img alt="The Great Velmoran Raceway entrance" src="${ASSET_BASE}/exterior.png"/></div>
            <div class="dragon-racing-ambient" id="dragonRacingExteriorAmbient">
              <div class="dragon-racing-sun"></div>
              <div class="dragon-racing-exterior-glow"></div>
            </div>
            <div class="dragon-racing-hotspot" id="dragonRacingGateHotspot" role="button" tabindex="0" aria-label="Enter the raceway" style="left:22%;top:39%;width:56%;height:45%"></div>
          </section>
          <section class="dragon-racing-scene" data-scene="desk">
            <div class="dragon-racing-image-wrap"><img alt="Race desk at The Great Velmoran Raceway" src="${ASSET_BASE}/race-desk.png"/></div>
            <div class="dragon-racing-ambient"><div class="dragon-racing-desk-glow"></div><div class="dragon-racing-light-pass"></div></div>
            <div class="dragon-racing-hotspot" id="dragonRacingBoltHotspot" role="button" tabindex="0" aria-label="Speak to Bolt Bramble" style="left:33%;top:40%;width:28%;height:42%"></div>
          </section>
          <section class="dragon-racing-scene" data-scene="menu">
            <div class="dragon-racing-menu-shell"><img alt="Dragon racing track select" src="${ASSET_BASE}/track-select.png"/><div class="dragon-racing-menu-fx" aria-hidden="true"></div><div class="dragon-racing-menu-shine" aria-hidden="true"></div><div class="dragon-racing-menu-glints" aria-hidden="true"><i class="dragon-racing-menu-glint"></i><i class="dragon-racing-menu-glint"></i><i class="dragon-racing-menu-glint"></i><i class="dragon-racing-menu-glint"></i></div><div class="dragon-racing-menu-vignette" aria-hidden="true"></div><div class="dragon-racing-track-ui"><div class="dragon-racing-track-list"></div><div class="dragon-racing-race-style" data-track-race-style></div><div class="dragon-racing-track-preview"><img class="dragon-racing-track-preview-img" alt=""><div class="dragon-racing-track-preview-shade"></div><strong class="dragon-racing-track-preview-name"></strong></div><div class="dragon-racing-track-detail-grid"><div class="dragon-racing-track-detail dragon-racing-track-detail--difficulty" data-track-detail="difficulty"></div><div class="dragon-racing-track-detail dragon-racing-track-detail--setting" data-track-detail="region"></div><div class="dragon-racing-track-detail dragon-racing-track-detail--access" data-track-detail="access"></div></div><div class="dragon-racing-track-enter" role="button" tabindex="0" aria-label="Enter selected race"><span>ENTER RACE</span><small data-track-enter-note>Velmora City Circuit · Lv. 1</small></div><div class="dragon-racing-track-prev" role="button" tabindex="0" aria-label="Previous track"></div><div class="dragon-racing-track-next" role="button" tabindex="0" aria-label="Next track"></div><div class="dragon-racing-track-confirm" aria-hidden="true"><div class="dragon-racing-track-confirm-card"><small>RACE ENTRY</small><strong data-race-confirm-name>Velmora City Circuit</strong><div class="dragon-racing-track-confirm-meta"><span><b>DIFFICULTY</b><em data-race-confirm-difficulty>Easy</em></span><span><b>REQUIRED</b><em data-race-confirm-level>Dragon Racing Lv. 1</em></span><span><b>LAPS</b><em>3</em></span><span><b>BEST TIME</b><em data-race-confirm-best>—</em></span></div><p data-race-confirm-note>Your dragon is ready for the Velmora City Circuit.</p><div class="dragon-racing-track-confirm-actions"><div role="button" tabindex="0" data-race-confirm-enter>ENTER RACE</div><div role="button" tabindex="0" data-race-confirm-back>BACK</div></div></div></div></div></div>
            <div class="dragon-racing-menu-audio"><b>NOW PLAYING</b><span>Dream Island · 30% volume</span></div>
          </section>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const exteriorAmbient=modal.querySelector('#dragonRacingExteriorAmbient');
    createParticles(exteriorAmbient,'ember',22);
    createParticles(exteriorAmbient,'leaf',12);

    const menuScene=modal.querySelector('.dragon-racing-scene[data-scene="menu"]');
    let menuPointerRaf=0;
    menuScene?.addEventListener('pointermove',event=>{
      if(menuPointerRaf)return;
      const x=event.clientX,y=event.clientY;
      menuPointerRaf=requestAnimationFrame(()=>{
        menuPointerRaf=0;
        const r=menuScene.getBoundingClientRect();
        if(!r.width||!r.height)return;
        menuScene.style.setProperty('--menu-mx',`${Math.max(0,Math.min(100,((x-r.left)/r.width)*100)).toFixed(1)}%`);
        menuScene.style.setProperty('--menu-my',`${Math.max(0,Math.min(100,((y-r.top)/r.height)*100)).toFixed(1)}%`);
      });
    },{passive:true});
    menuScene?.addEventListener('pointerleave',()=>{
      menuScene.style.setProperty('--menu-mx','50%');
      menuScene.style.setProperty('--menu-my','48%');
    },{passive:true});


    const trackUi=menuScene?.querySelector('.dragon-racing-track-ui');
    const syncTrackUiGeometry=()=>{
      const shell=menuScene?.querySelector('.dragon-racing-menu-shell');
      if(!shell||!trackUi)return;
      const r=shell.getBoundingClientRect();
      if(!r.width||!r.height)return;
      const sourceW=1672,sourceH=941,scale=Math.max(r.width/sourceW,r.height/sourceH);
      const renderW=sourceW*scale,renderH=sourceH*scale;
      trackUi.style.left=`${(r.width-renderW)/2}px`;
      trackUi.style.top=`${(r.height-renderH)/2}px`;
      trackUi.style.width=`${renderW}px`;
      trackUi.style.height=`${renderH}px`;
    };
    state.syncTrackUi=syncTrackUiGeometry;
    renderTrackSelect(modal);
    syncTrackUiGeometry();
    window.addEventListener('resize',syncTrackUiGeometry,{passive:true});
    trackUi?.addEventListener('click',event=>{
      const row=event.target.closest('.dragon-racing-track-row');
      if(row){closeRaceConfirm(modal);selectTrack(modal,Number(row.dataset.trackIndex));return;}
      if(event.target.closest('.dragon-racing-track-prev')){closeRaceConfirm(modal);cycleTrack(modal,-1);return;}
      if(event.target.closest('.dragon-racing-track-next')){closeRaceConfirm(modal);cycleTrack(modal,1);return;}
      if(event.target.closest('.dragon-racing-track-enter')){openRaceConfirm(modal);return;}
      if(event.target.closest('[data-race-confirm-back]')){closeRaceConfirm(modal);return;}
      if(event.target.closest('[data-race-confirm-enter]')){if(!event.target.closest('[data-race-confirm-enter]').classList.contains('is-disabled'))startSelectedRace(modal);return;}
    });
    trackUi?.addEventListener('keydown',event=>{
      const row=event.target.closest('.dragon-racing-track-row');
      if(row&&(event.key==='Enter'||event.key===' ')){event.preventDefault();closeRaceConfirm(modal);selectTrack(modal,Number(row.dataset.trackIndex));return;}
      if(event.target.closest('.dragon-racing-track-prev')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();closeRaceConfirm(modal);cycleTrack(modal,-1);return;}
      if(event.target.closest('.dragon-racing-track-next')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();closeRaceConfirm(modal);cycleTrack(modal,1);return;}
      if(event.target.closest('.dragon-racing-track-enter')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openRaceConfirm(modal);return;}
      if(event.target.closest('[data-race-confirm-back]')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();closeRaceConfirm(modal);return;}
      if(event.target.closest('[data-race-confirm-enter]')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();if(!event.target.closest('[data-race-confirm-enter]').classList.contains('is-disabled'))startSelectedRace(modal);return;}
      if(event.key==='ArrowUp'||event.key==='ArrowLeft'){event.preventDefault();closeRaceConfirm(modal);cycleTrack(modal,-1);}
      if(event.key==='ArrowDown'||event.key==='ArrowRight'){event.preventDefault();closeRaceConfirm(modal);cycleTrack(modal,1);}
    });

    modal.querySelector('#dragonRacingClose').addEventListener('click',closeModal);
    modal.addEventListener('click',e=>{if(e.target===modal)closeModal();});
    modal.querySelector('#dragonRacingBack').addEventListener('click',()=>{
      if(state.scene==='menu')showScene('desk');
      else if(state.scene==='desk')showScene('exterior');
    });
    const gateHotspot=modal.querySelector('#dragonRacingGateHotspot');
    const boltHotspot=modal.querySelector('#dragonRacingBoltHotspot');
    const bindHotspot=(el,activate)=>{if(!el)return;el.addEventListener('click',activate);el.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();activate();});};
    bindHotspot(gateHotspot,()=>showScene('desk'));
    bindHotspot(boltHotspot,()=>showScene('menu'));
    document.addEventListener('keydown',e=>{
      if(!modal.classList.contains('is-visible'))return;
      if(e.key==='Escape'){
        const confirm=modal.querySelector('.dragon-racing-track-confirm');
        if(confirm?.classList.contains('is-visible')){closeRaceConfirm(modal);return;}
        if(window.DragonRacingRace?.isActive?.()){window.DragonRacingRace.exitToTrackSelect();return;}
        if(state.scene==='menu')showScene('desk');
        else if(state.scene==='desk')showScene('exterior');
        else closeModal();
      }
    });
    return modal;
  };

  const ensureAudio=()=>{
    if(state.audio)return state.audio;
    const a=new Audio(`${ASSET_BASE}/home-menu.mp3`);
    a.volume=.30;
    a.loop=true;
    state.audio=a;
    return a;
  };

  const syncAudio=()=>{
    const a=state.audio;
    if(!a)return;
    if(state.scene==='menu'){
      a.volume=.30;
      try{const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_e){}
    }else if(!a.paused){
      try{a.pause();}catch(_e){}
    }
  };

  const showScene=(name)=>{
    const modal=ensureModal();
    state.scene=name;
    modal.querySelectorAll('.dragon-racing-scene').forEach(el=>el.classList.toggle('is-active',el.dataset.scene===name));
    const back=modal.querySelector('#dragonRacingBack');
    back.hidden=name==='exterior';
    const title=modal.querySelector('#dragonRacingTitle');
    title.textContent=name==='exterior'?'Dragon Racing':name==='desk'?'The Great Velmoran Raceway':'Track Select';
    if(name==='menu'){
      ensureAudio();
      renderTrackSelect(modal);
      const refresh=window.DragonRacingRace?.refreshProgression?.();
      if(refresh&&typeof refresh.then==='function')refresh.then(()=>{if(state.scene==='menu')renderTrackSelect(modal);}).catch(()=>{});
      requestAnimationFrame(()=>state.syncTrackUi?.());
    }
    syncAudio();
  };

  function openModal(){
    const modal=ensureModal();
    modal.classList.add('is-visible');
    document.body.classList.add('dragon-racing-modal-open');
    window.dispatchEvent(new CustomEvent('dragonracing:visibility',{detail:{open:true}}));
    showScene('exterior');
  }

  function closeModal(){
    if(window.DragonRacingRace?.isActive?.())window.DragonRacingRace.stop?.();
    const modal=document.getElementById('dragonRacingModal');
    if(!modal)return;
    modal.classList.remove('is-visible');
    document.body.classList.remove('dragon-racing-modal-open');
    window.dispatchEvent(new CustomEvent('dragonracing:visibility',{detail:{open:false}}));
    if(state.audio&&!state.audio.paused){
      try{state.audio.pause();state.audio.currentTime=0;}catch(_e){}
    }
    state.scene='exterior';
  }

  const makeSidebarButton=()=>{
    const sidebar=document.querySelector('#dragonboundOverlay .dragonbound-home-sidebar');
    if(!sidebar)return false;
    let btn=sidebar.querySelector('.dragon-racing-sidebar-button');
    if(btn)return true;

    btn=document.createElement('img');
    btn.id='dragonRacingSidebarButton';
    btn.className='dragon-racing-sidebar-button';
    btn.src=`${ASSET_BASE}/button.png`;
    btn.alt='Dragon Racing';
    btn.setAttribute('role','button');
    btn.setAttribute('tabindex','0');
    btn.setAttribute('aria-label','Open Dragon Racing');
    btn.draggable=false;
    const activate=e=>{
      if(e){e.preventDefault();e.stopPropagation();}
      openModal();
    };
    btn.addEventListener('click',activate);
    btn.addEventListener('keydown',e=>{
      if(e.key!=='Enter'&&e.key!==' ')return;
      activate(e);
    });
    sidebar.appendChild(btn);
    return true;
  };

  // V33.73 performance recovery: do not watch every DOM mutation on the whole site.
  // The Dragonbound sidebar is created on demand, so a short event-driven retry burst
  // when Dragonbound opens is enough and costs nothing while other games are running.
  const boot=throttle(()=>makeSidebarButton(),120);
  const bootBurst=()=>{
    [0,80,220,520,1000].forEach(delay=>setTimeout(boot,delay));
  };
  const startWatching=()=>{
    boot();
    document.addEventListener('click',e=>{
      if(e.target?.closest?.('#openDragonbound'))bootBurst();
    },true);
    window.addEventListener('dragonbound:opened',bootBurst,{passive:true});
    window.addEventListener('load',boot,{once:true});
  };

  startWatching();
  window.addEventListener('dragon-racing:progression-changed',()=>{const modal=document.getElementById('dragonRacingModal');if(modal&&state.scene==='menu')renderTrackSelect(modal);},{passive:true});
  window.DragonRacingUi={open:openModal,close:closeModal,showScene,getSelectedTrack:()=>({...TRACKS[state.selectedTrackIndex]}),tracks:()=>TRACKS.map(track=>({...track})),fadeMenuAudioOut:(duration=650)=>fadeMenuAudioTo(0,duration),restoreMenuAudio:(duration=450)=>{ensureAudio();try{const p=state.audio.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_e){}fadeMenuAudioTo(.30,duration);},closeRaceConfirm:()=>closeRaceConfirm(document.getElementById('dragonRacingModal'))};
})();