/* VELMORA ADVENTURES — Phase 1
   Persistent state is owned by Supabase RPCs. Narration may describe state but never grants rewards. */
(()=>{
  'use strict';
  const VERSION='1.0.0-phase1';
  const DIALOG_ID='velmoraAdventuresDialog';
  const HOMELANDS=['Vardesh','Lumerre','Kordesh','Nambara','Norveth','Zafran','Elvane','Qasmir','Calvora','Rovarn','Talune','Drazhen','Belros','Marovar','Sorevia','Iskandar'];
  const BACKGROUNDS=[
    ['Apprentice Explorer','Curious generalist. Starts prepared for the road.'],['Animal Keeper','Patient around wildlife and practical in the field.'],['Travelling Merchant','Comfortable with people, prices and long roads.'],['Fisher','River knowledge, patience and a simple hook.'],['Cook','Good with people and used to solving small crises quickly.'],['Hunter','Tracks, weather and cautious fieldcraft.'],['Scholar','Books, records and a habit of asking one more question.'],['Courier','Fast, observant and familiar with route work.'],['Street Rogue','Quick thinking, charm and flexible ideas about rules.'],['Craftsman','Strong hands and a practical eye for how things fit together.'],['Investigator','Clues, contradictions and careful notes.'],['Ruin Hunter','Old stones, bad paths and a willingness to look twice.'],['Former Repo Sports Prospect','Athletic, competitive and used to pressure.'],['Farmhand','Practical, durable and comfortable outdoors.'],['Sailor','Agile, weather-aware and used to travel.'],['Miner','Strong, patient and equipped for stonework.'],['Herbalist','Plant knowledge and a clean cutting tool.'],['Nobody Particularly Important','No grand history. Plenty of room to become interesting.']
  ];
  const ARCHETYPES=[
    ['Warrior','Strength and endurance. Direct solutions without locking out clever ones.'],['Ranger','Perception, survival and exploration.'],['Rogue','Agility, awareness and unconventional routes.'],['Mage','Arcana and intelligence for unusual solutions.'],['Alchemist','Knowledge, ingredients and practical experimentation.'],['Bard','Charisma, agility and social problem-solving.'],['Guardian','Endurance, protection and steady pressure.'],['Beastkeeper','Survival, empathy and animal handling.'],['Investigator','Perception, intelligence and deduction.']
  ];
  const HOMELAND_HINT={Vardesh:'Endurance',Lumerre:'Charisma',Kordesh:'Strength',Nambara:'Survival',Norveth:'Perception',Zafran:'Intelligence',Elvane:'Survival',Qasmir:'Arcana',Calvora:'Agility',Rovarn:'Perception',Talune:'Charisma',Drazhen:'Endurance',Belros:'Strength',Marovar:'Intelligence',Sorevia:'Agility',Iskandar:'Arcana'};
  const STAT_LABELS={strength:'Strength',agility:'Agility',endurance:'Endurance',perception:'Perception',intelligence:'Intelligence',charisma:'Charisma',survival:'Survival',arcana:'Arcana'};
  const PROF_LABELS={courier:'Courier',herbalism:'Herbalism',investigation:'Investigation',exploration:'Exploration',animal_handling:'Animal Handling',mercantile:'Mercantile',survival:'Survival',crafting:'Crafting'};
  const WEATHER_LABELS={clear:'Clear',cloudy:'Cloudy',rain:'Rain',mist:'Mist',storm:'Storm',snow:'Snow',heat:'Heat'};

  let state=null,view='entry',drawer=null,busy=false,sceneFrame=0,heartbeat=0,saveToastTimer=0,lastNarrative='';
  const creation={step:0,name:'',homeland:'Elvane',background:'Apprentice Explorer',archetype:'Ranger'};

  const q=s=>document.querySelector(s), el=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const safeArray=v=>Array.isArray(v)?v:[];
  const playClick=()=>{try{if(typeof playClickSound==='function')playClickSound()}catch(_){}};
  const notify=(m)=>{try{if(typeof toast==='function')toast(m);else console.info('[Adventures]',m)}catch(_){console.info('[Adventures]',m)}};

  const AdventureNarrator={
    provider:null,
    setProvider(provider){this.provider=provider||null},
    async narrate(context){
      if(this.provider&&typeof this.provider.narrate==='function'){
        const out=await this.provider.narrate(context);
        if(out&&typeof out.narration==='string')return {narration:out.narration,dialogue:Array.isArray(out.dialogue)?out.dialogue:[],suggestedActions:Array.isArray(out.suggestedActions)?out.suggestedActions:[],requestedChecks:Array.isArray(out.requestedChecks)?out.requestedChecks:[],proposedStateChanges:Array.isArray(out.proposedStateChanges)?out.proposedStateChanges:[]};
      }
      return {narration:fallbackNarration(context),dialogue:[],suggestedActions:[],requestedChecks:[],proposedStateChanges:[]};
    }
  };
  window.AdventureNarrator=AdventureNarrator;

  function fallbackNarration(ctx){
    const loc=state?.location;
    const action=String(ctx?.action||'').toLowerCase();
    if(action.includes('look')||action.includes('survey'))return loc?.description||'You take a moment to look around.';
    if(action.includes('guard'))return 'There is no guard close enough to involve in that idea. Canto Crossing remains disappointingly bread-safe for now.';
    if(action.includes('bread'))return 'You consider wasting perfectly serviceable bread. Nobody nearby gives you a compelling enough reason.';
    return `You can attempt that, but Phase 1 does not yet have enough people or objects here to resolve it meaningfully. The world records nothing and you remain in ${loc?.name||'place'}.`;
  }

  async function callRpc(name,args={},opts={}){
    if(busy&&!opts.silent)throw new Error('Adventure action already in progress.');
    if(!opts.silent)busy=true;
    try{
      if(typeof db==='undefined')throw new Error('Velmora database connection is not available.');
      const {data,error}=await db.rpc(name,args);
      if(error)throw error;
      return data;
    }finally{if(!opts.silent)busy=false}
  }

  function inject(){
    if(el(DIALOG_ID))return;
    const questPanel=q('#questsDialog .quest-list-panel');
    if(questPanel&&!el('openVelmoraAdventures')){
      const b=document.createElement('button');
      b.type='button';b.id='openVelmoraAdventures';b.className='va-launch-card';
      b.innerHTML=`<span class="va-launch-inner"><span class="va-launch-rune"><i>V</i></span><span class="va-launch-copy"><b>VELMORA ADVENTURES</b><small>Persistent RPG · create a life in Velmora</small></span><span class="va-launch-tag">NEW</span></span>`;
      const marker=questPanel.querySelector('b');
      marker?.insertAdjacentElement('afterend',b);
    }
    const d=document.createElement('dialog');d.id=DIALOG_ID;d.className='va-dialog';
    d.innerHTML=`<div class="va-shell"><header class="va-topbar"><div class="va-brand-mark"><span>V</span></div><div class="va-brand-copy"><small>REPO COMPANY PRESENTS</small><h2>VELMORA ADVENTURES</h2></div><div class="va-top-spacer"></div><span class="va-phase-chip">PERSISTENT RPG · PHASE 1</span><button class="va-close" type="button" aria-label="Close Velmora Adventures">×</button></header><main class="va-stage" id="vaStage"></main><div class="va-saved" id="vaSaved">ADVENTURE SAVED</div></div>`;
    document.body.appendChild(d);
    bind();
  }

  function bind(){
    el('openVelmoraAdventures')?.addEventListener('click',open);
    q(`#${DIALOG_ID} .va-close`)?.addEventListener('click',close);
    el(DIALOG_ID)?.addEventListener('cancel',e=>{e.preventDefault();close()});
    el(DIALOG_ID)?.addEventListener('click',onClick);
    el(DIALOG_ID)?.addEventListener('input',onInput);
    el(DIALOG_ID)?.addEventListener('keydown',e=>{
      if(e.key==='Enter'&&e.target?.id==='vaCustomInput'){e.preventDefault();customAction().catch(err=>{console.error('[Velmora Adventures]',err);notify(err?.message||'Adventure action failed.')})}
      if(e.key==='Enter'&&e.target?.id==='vaCreateName'&&creation.step===0){e.preventDefault();creation.name=(e.target.value||'').trim();if(creation.name.length>=2){creation.step=1;renderCreate()}}
    });
    el(DIALOG_ID)?.addEventListener('submit',e=>e.preventDefault());
  }

  async function open(){
    playClick();
    const session=typeof db!=='undefined'?(await db.auth.getSession()).data?.session:null;
    if(!session){notify('Log in before beginning a Velmora Adventure.');try{if(typeof openCharacterDialog==='function')openCharacterDialog('login')}catch(_){}return}
    const quests=el('questsDialog');if(quests?.open)quests.close();
    const d=el(DIALOG_ID);if(!d.open)d.showModal();
    view='entry';renderLoading('Loading your Adventure…');
    try{state=await callRpc('adventure_get_state',{},{});render()}
    catch(err){console.error('[Velmora Adventures] load failed',err);renderError(err)}
    startHeartbeat();
  }
  function close(){cancelAnimationFrame(sceneFrame);sceneFrame=0;clearInterval(heartbeat);heartbeat=0;drawer=null;el(DIALOG_ID)?.close()}
  function backToQuests(){close();const d=el('questsDialog');if(d&&!d.open){d.showModal();try{if(typeof loadQuestProfile==='function')loadQuestProfile().then(()=>renderQuestJournal?.())}catch(_){}}}
  function startHeartbeat(){clearInterval(heartbeat);heartbeat=setInterval(async()=>{if(!state?.exists||!el(DIALOG_ID)?.open)return;try{const next=await callRpc('adventure_touch',{}, {silent:true});if(next?.exists)state=next}catch(_){ }},60000)}

  function renderLoading(text){const s=el('vaStage');if(s)s.innerHTML=`<section class="va-loading"><div><i></i><b>${esc(text)}</b></div></section>`}
  function renderError(err){const msg=err?.message||String(err||'Unknown error');el('vaStage').innerHTML=`<section class="va-screen"><div class="va-error-card"><h3>Adventure could not load</h3><p>${esc(msg)}</p><div class="va-entry-actions"><button class="va-secondary" data-va="retry" type="button">TRY AGAIN</button><button class="va-secondary" data-va="back-quests" type="button">BACK TO QUESTS</button></div></div></section>`}
  function render(){cancelAnimationFrame(sceneFrame);sceneFrame=0;if(view==='create')return renderCreate();if(view==='reset')return renderReset();if(view==='game'&&state?.exists)return renderGame();return renderEntry()}

  function renderEntry(){
    if(!state){return renderLoading('Loading your Adventure…')}
    const stage=el('vaStage');stage.className='va-stage';
    if(!state.exists){
      stage.innerHTML=`<section class="va-screen"><div class="va-entry"><div class="va-entry-hero"><small class="va-entry-kicker">A LIFE WAITING TO HAPPEN</small><h3>Live another life in Velmora.</h3><p>Take jobs, travel the world, meet its people and create your own story. Adventures saves separately from your normal site progress and can be continued whenever you return.</p><div class="va-entry-actions"><button class="va-primary" data-va="begin-create" type="button">BEGIN YOUR ADVENTURE</button><button class="va-secondary" data-va="back-quests" type="button">BACK TO QUESTS</button></div></div><div class="va-resume-summary"><b>Phase 1 is live:</b> persistent character creation, Elvane travel, server-side dice checks, inventory, quest journal, daily job board and automatic saves. The deeper NPC/AI systems build on this state rather than replacing it.</div></div></section>`;return;
    }
    const a=state.adventure,loc=state.location,activeQuest=safeArray(state.quests).find(x=>x.status==='active'&&x.is_main_story);
    stage.innerHTML=`<section class="va-screen"><div class="va-entry"><div class="va-entry-hero"><small class="va-entry-kicker">YOUR VELMORA SAVE</small><h3>Welcome back, ${esc(a.name)}.</h3><p>${esc(a.last_summary||'Your story is waiting where you left it.')}</p></div><div class="va-save-card"><div class="va-portrait">${esc(String(a.name||'?').charAt(0))}</div><div class="va-save-copy"><h4>${esc(a.name)}</h4><span>LEVEL ${Number(a.level)||1} ${esc(String(a.archetype||'Adventurer').toUpperCase())} · ${esc(a.homeland)}</span><div class="va-save-stats"><div><small>CURRENT LOCATION</small><b>${esc(loc?.name||a.location_id)}</b></div><div><small>ADVENTURE TIME</small><b>${formatPlay(a.play_seconds)}</b></div><div><small>MAIN QUEST</small><b>${esc(activeQuest?.title||'Untracked')}</b></div><div><small>VELMORAN GOLD</small><b>${Number(a.gold||0).toLocaleString('en-GB')}</b></div></div></div><div class="va-save-buttons"><button class="va-primary" data-va="continue" type="button">CONTINUE ADVENTURE</button><button class="va-secondary" data-va="journal-entry" type="button">JOURNAL</button><button class="va-danger" data-va="new-adventure" type="button">NEW ADVENTURE</button></div></div><div class="va-resume-summary"><b>Last played:</b> ${formatLastPlayed(a.last_played_at)} · <b>Day ${Number(a.world_day)||1}, ${formatWorldTime(a.world_minute)}</b><br>${esc(objectiveText())}</div></div></section>`;
  }

  function renderReset(){
    const a=state?.adventure;el('vaStage').innerHTML=`<section class="va-screen"><div class="va-create"><div class="va-create-head"><div><h3>Start a new life?</h3><p>This permanently deletes the current Adventures save only. It does not touch your normal Repo Company account, skills, TCG or other site systems.</p></div></div><div class="va-create-panel"><h4>Erase ${esc(a?.name||'this Adventure')}</h4><p>Type <b>RESET</b> below to confirm. This cannot be undone.</p><input class="va-reset-input" id="vaResetConfirm" autocomplete="off" placeholder="Type RESET"><div class="va-create-actions"><button class="va-secondary" data-va="cancel-reset" type="button">CANCEL</button><button class="va-danger" data-va="confirm-reset" type="button" disabled>ERASE ADVENTURE</button></div></div></div></section>`;
  }

  function renderCreate(){
    const stage=el('vaStage');stage.className='va-stage';
    const dots=Array.from({length:5},(_,i)=>`<i class="${i<=creation.step?'on':''}"></i>`).join('');
    let body='';
    if(creation.step===0)body=`<h4>Name your adventurer</h4><p>This is your Adventures character, separate from your Repo Company username.</p><input id="vaCreateName" class="va-name-input" maxlength="24" value="${esc(creation.name)}" placeholder="Adventurer name" autocomplete="off">`;
    if(creation.step===1)body=`<h4>Choose a homeland</h4><p>Homeland adds one small thematic stat bonus. Every country grants the same total value.</p><div class="va-choice-grid">${HOMELANDS.map(x=>choice(x,`+1 ${HOMELAND_HINT[x]}`,creation.homeland===x,'homeland')).join('')}</div>`;
    if(creation.step===2)body=`<h4>Choose a background</h4><p>Your background gives two small starting stat nudges, a practical item and later dialogue hooks.</p><div class="va-choice-grid">${BACKGROUNDS.map(([x,d])=>choice(x,d,creation.background===x,'background')).join('')}</div>`;
    if(creation.step===3)body=`<h4>Choose an archetype</h4><p>Archetypes influence how you solve problems, but they will never permanently lock you out of the game.</p><div class="va-choice-grid">${ARCHETYPES.map(([x,d])=>choice(x,d,creation.archetype===x,'archetype')).join('')}</div>`;
    if(creation.step===4)body=`<h4>Ready to enter Elvane?</h4><p>Your exact stats and starter equipment are calculated on the server from these balanced choices.</p><div class="va-review"><div class="va-portrait">${esc((creation.name||'?').charAt(0))}</div><dl><div><dt>NAME</dt><dd>${esc(creation.name)}</dd></div><div><dt>HOMELAND</dt><dd>${esc(creation.homeland)}</dd></div><div><dt>BACKGROUND</dt><dd>${esc(creation.background)}</dd></div><div><dt>ARCHETYPE</dt><dd>${esc(creation.archetype)}</dd></div><div><dt>STARTING REGION</dt><dd>Elvane · Canto Plains</dd></div><div><dt>SAVE MODE</dt><dd>Automatic</dd></div></dl></div>`;
    stage.innerHTML=`<section class="va-screen"><div class="va-create"><div class="va-create-head"><div><h3>Create your adventurer</h3><p>Step ${creation.step+1} of 5</p></div><div class="va-step-dots">${dots}</div></div><div class="va-create-panel">${body}<div class="va-create-actions"><button class="va-secondary" data-va="create-back" type="button">${creation.step===0?'CANCEL':'BACK'}</button>${creation.step===4?'<button class="va-primary" data-va="create-submit" type="button">BEGIN IN CANTO CROSSING</button>':'<button class="va-primary" data-va="create-next" type="button">CONTINUE</button>'}</div></div></div></section>`;
  }
  function choice(name,desc,selected,key){return `<button class="va-choice ${selected?'selected':''}" data-va="choose" data-key="${esc(key)}" data-value="${esc(name)}" type="button"><b>${esc(name)}</b><small>${esc(desc)}</small></button>`}

  function renderGame(){
    const a=state.adventure,loc=state.location,level=Number(a.level)||1,cur=xpForAdventureLevel(level),next=level>=99?13034431:xpForAdventureLevel(level+1),xp=Number(a.xp)||0,xpP=level>=99?100:Math.round(clamp((xp-cur)/Math.max(1,next-cur),0,1)*100),hpP=Math.round(clamp((Number(a.hp)||0)/Math.max(1,Number(a.max_hp)||1),0,1)*100);
    const stage=el('vaStage');stage.className='va-stage';
    const admin=state.admin?`<div class="va-mini-card"><small>ADMIN TESTING</small><b>Adventure debug tools enabled.</b><div class="va-list-actions"><button class="va-secondary" data-va="open-drawer" data-drawer="admin" type="button">OPEN DEBUG</button></div></div>`:'';
    stage.innerHTML=`<section class="va-screen is-game"><div class="va-game"><div class="va-game-main"><section class="va-world"><header class="va-location-head"><div class="va-location-title"><h3>${esc(loc.name)}</h3><span>${esc(loc.country)} · ${esc(loc.region)}</span></div><div class="va-time-weather"><b>Day ${Number(a.world_day)||1} · ${formatWorldTime(a.world_minute)}</b><small>${esc(WEATHER_LABELS[a.weather]||a.weather)}</small></div></header><div class="va-scene-wrap"><canvas id="vaScene" width="960" height="420" aria-label="${esc(loc.name)}"></canvas><div class="va-weather-layer ${esc(a.weather)}"></div><div class="va-scene-vignette"></div></div><section class="va-story"><span class="va-story-label">ADVENTURE</span><p id="vaNarrative">${esc(lastNarrative||a.last_summary||loc.description)}</p><div class="va-action-row" id="vaActions">${renderActions()}</div><form class="va-custom-action" id="vaCustomForm"><input id="vaCustomInput" maxlength="180" autocomplete="off" placeholder="Do something else…"><button class="va-secondary" data-va="custom-submit" type="button">TRY IT</button></form><small class="va-custom-hint">Free actions use the Phase 1 rules interpreter. Mechanical changes still require server validation.</small></section></section><aside class="va-side"><div class="va-char-card"><div class="va-char-top"><div class="va-portrait">${esc(a.name.charAt(0))}</div><div class="va-char-copy"><h4>${esc(a.name)}</h4><span>LEVEL ${level} ${esc(String(a.archetype).toUpperCase())}</span></div></div><div class="va-bars"><div class="va-bar hp" style="--p:${hpP}%"><small>HP</small><i></i><b>${a.hp}/${a.max_hp}</b></div><div class="va-bar" style="--p:${xpP}%"><small>XP</small><i></i><b>${xp.toLocaleString('en-GB')}</b></div></div></div><div class="va-objective-card"><small>CURRENT OBJECTIVE</small><b>${esc(objectiveTitle())}</b><p>${esc(objectiveText())}</p></div><div class="va-quick-stats"><div><small>GOLD</small><b>${Number(a.gold||0).toLocaleString('en-GB')}</b></div><div><small>TIME PLAYED</small><b>${formatPlay(a.play_seconds)}</b></div><div><small>HOMELAND</small><b>${esc(a.homeland)}</b></div><div><small>BACKGROUND</small><b>${esc(a.background)}</b></div></div>${admin}</aside></div><nav class="va-nav"><button data-va="open-drawer" data-drawer="map" type="button">MAP</button><button data-va="open-drawer" data-drawer="character" type="button">CHARACTER</button><button data-va="open-drawer" data-drawer="inventory" type="button">INVENTORY</button><button data-va="open-drawer" data-drawer="journal" type="button">JOURNAL</button><button data-va="open-drawer" data-drawer="jobs" type="button">JOBS</button><button class="back" data-va="exit-game" type="button">SAVE & EXIT</button></nav><aside class="va-drawer" id="vaDrawer"></aside><div class="va-saved" id="vaSaved">ADVENTURE SAVED</div></div></section>`;
    renderDrawer();startSceneLoop();
  }

  function renderActions(){
    const loc=state.location?.id,actions=[];
    const main=mainQuest();
    const readyJobs=safeArray(state.jobs).filter(j=>j.status==='active'&&j.destination_location_id===loc);
    if(main?.status==='available'&&loc==='canto_crossing')actions.push(['accept-main','Take the sealed parcel']);
    if(main?.status==='active'&&main.stage===1&&loc==='willowmere')actions.push(['deliver-main','Deliver the parcel']);
    if(readyJobs.length)actions.push(['finish-job','Complete arriving contract']);
    if(loc==='canto_crossing')actions.push(['drawer-jobs','Read the job board'],['check-perception','Study the old clock markings']);
    else if(loc==='willowmere')actions.push(['check-perception','Listen beside the mill wheel']);
    else if(loc==='riverglass_ford')actions.push(['check-survival','Inspect the crossing stones']);
    else if(loc==='canto_plains_verge')actions.push(['check-perception','Scan the meadow']);
    else if(loc==='animal_centre_gate')actions.push(['check-survival','Read the keeper notices']);
    const connected=safeArray(state.map_locations).filter(x=>x.connected&&x.discovered&&x.id!==loc).slice(0,Math.max(1,5-actions.length));
    connected.forEach(x=>actions.push([`travel:${x.id}`,`Travel to ${x.real_name||x.name}`]));
    return actions.slice(0,5).map(([key,label])=>`<button class="va-action" data-va="scene-action" data-action="${esc(key)}" type="button">${esc(label)}</button>`).join('');
  }

  function startSceneLoop(){cancelAnimationFrame(sceneFrame);const tick=t=>{const c=el('vaScene');if(!c||view!=='game'||!el(DIALOG_ID)?.open)return;drawScene(c,t);sceneFrame=requestAnimationFrame(tick)};sceneFrame=requestAnimationFrame(tick)}
  function drawScene(canvas,time){
    const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const W=320,H=140;ctx.save();ctx.setTransform(3,0,0,3,0,0);const a=state.adventure,loc=state.location,minute=Number(a.world_minute)||480;const daylight=minute>=360&&minute<1140;const dusk=minute>=1020&&minute<1200;
    ctx.fillStyle=daylight?(dusk?'#b78772':'#73a6b4'):'#17293c';ctx.fillRect(0,0,W,H);
    // pixel clouds / stars
    if(daylight){ctx.fillStyle='rgba(229,237,218,.72)';for(let i=0;i<4;i++){let x=((i*93+time*.004)%390)-55,y=12+(i%2)*13;ctx.fillRect(x,y,30,5);ctx.fillRect(x+6,y-4,18,5)}}else{ctx.fillStyle='#d9d6b4';for(let i=0;i<24;i++){const x=(i*47)%320,y=(i*29)%70;ctx.fillRect(x,y,1,1)}}
    ctx.fillStyle=daylight?'#466f5a':'#263b42';ctx.beginPath();ctx.moveTo(0,76);for(let x=0;x<=320;x+=24)ctx.lineTo(x,52+((x*7)%23));ctx.lineTo(320,90);ctx.lineTo(0,90);ctx.fill();
    ctx.fillStyle=daylight?'#4f7c50':'#263e35';ctx.fillRect(0,77,W,63);
    const sway=Math.round(Math.sin(time/700)*1);
    if(loc.scene_key==='canto_town')drawTown(ctx,sway);
    else if(loc.scene_key==='willowmere')drawWillowmere(ctx,sway,time);
    else if(loc.scene_key==='river')drawRiver(ctx,sway,time);
    else if(loc.scene_key==='animal_centre')drawCentre(ctx,sway);
    else drawPlains(ctx,sway,time);
    if(a.weather==='cloudy'){ctx.fillStyle='rgba(41,63,68,.18)';ctx.fillRect(0,0,W,H)}
    if(a.weather==='rain'){ctx.strokeStyle='rgba(190,221,220,.32)';ctx.lineWidth=1;for(let i=0;i<28;i++){let x=(i*17+(time/13))%340-10,y=(i*23+(time/9))%150-10;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+9);ctx.stroke()}}
    if(a.weather==='mist'){ctx.fillStyle='rgba(220,229,216,.12)';ctx.fillRect(0,50,W,45)}
    ctx.restore();
  }
  function tree(ctx,x,y,sway=0){ctx.fillStyle='#315235';ctx.fillRect(x-2,y,4,18);ctx.fillStyle='#2c5c39';ctx.fillRect(x-9+sway,y-13,18,15);ctx.fillStyle='#3e7143';ctx.fillRect(x-6+sway,y-18,12,9)}
  function drawTown(ctx,s){ctx.fillStyle='#b79f6a';ctx.fillRect(0,105,320,22);ctx.fillRect(142,76,34,64);for(const [x,w,c] of [[25,50,'#d4c7a2'],[83,42,'#c9b78f'],[210,48,'#d8ceb0'],[270,34,'#c6b48a']]){ctx.fillStyle=c;ctx.fillRect(x,83,w,25);ctx.fillStyle='#734e3d';ctx.beginPath();ctx.moveTo(x-4,83);ctx.lineTo(x+w/2,67);ctx.lineTo(x+w+4,83);ctx.fill();ctx.fillStyle='#4b382f';ctx.fillRect(x+w/2-4,96,8,12)}ctx.fillStyle='#b7aa8d';ctx.fillRect(148,54,22,52);ctx.fillStyle='#746b5a';ctx.fillRect(143,54,32,6);ctx.fillStyle='#e5d37d';ctx.fillRect(154,63,10,10);ctx.fillStyle='#523c2e';ctx.fillRect(155,86,8,20);ctx.fillStyle='#8b653d';ctx.fillRect(184,88,22,18);ctx.fillStyle='#c7a75f';ctx.fillRect(181,84,28,5);tree(ctx,14,90,s);tree(ctx,309,91,-s)}
  function drawWillowmere(ctx,s,time){ctx.fillStyle='#4a8990';ctx.fillRect(0,101,320,39);ctx.fillStyle='rgba(201,229,215,.3)';for(let y=106;y<140;y+=8)ctx.fillRect(((time/30+y*3)%350)-30,y,34,1);ctx.fillStyle='#c5b98e';ctx.fillRect(58,81,60,28);ctx.fillStyle='#6d4839';ctx.beginPath();ctx.moveTo(53,81);ctx.lineTo(88,63);ctx.lineTo(123,81);ctx.fill();ctx.fillStyle='#cfc49c';ctx.fillRect(188,77,54,31);ctx.fillStyle='#734a3b';ctx.beginPath();ctx.moveTo(183,77);ctx.lineTo(215,61);ctx.lineTo(247,77);ctx.fill();ctx.strokeStyle='#7e6b46';ctx.lineWidth=4;ctx.beginPath();ctx.arc(260,97,18,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#7e6b46';ctx.fillRect(259,78,2,38);ctx.fillRect(242,96,36,2);tree(ctx,26,92,s);tree(ctx,151,92,-s)}
  function drawRiver(ctx,s,time){ctx.fillStyle='#4c8e9c';ctx.fillRect(0,88,320,52);ctx.fillStyle='rgba(208,235,221,.32)';for(let i=0;i<8;i++)ctx.fillRect(((i*57+time/24)%370)-40,96+i*5,36,1);ctx.fillStyle='#b9aa82';for(let x=58;x<260;x+=28)ctx.fillRect(x,96+(x%3)*2,19,8);ctx.fillStyle='#3d6f46';for(let x=8;x<320;x+=21){ctx.fillRect(x,82,2,17);ctx.fillRect(x+3,85,2,14)}tree(ctx,28,78,s);tree(ctx,294,79,-s)}
  function drawCentre(ctx,s){ctx.fillStyle='#b39e68';ctx.fillRect(0,106,320,17);ctx.fillStyle='#d2c7a5';ctx.fillRect(98,63,124,45);ctx.fillStyle='#6d4438';ctx.beginPath();ctx.moveTo(92,63);ctx.lineTo(160,39);ctx.lineTo(228,63);ctx.fill();ctx.fillStyle='#335b46';ctx.fillRect(145,78,30,30);ctx.fillStyle='#92734a';ctx.fillRect(45,84,6,34);ctx.fillRect(269,84,6,34);ctx.fillRect(45,87,230,5);ctx.fillStyle='#e0c776';ctx.fillRect(133,50,54,8);tree(ctx,18,93,s);tree(ctx,300,94,-s)}
  function drawPlains(ctx,s,time){ctx.fillStyle='#7d9a57';ctx.fillRect(0,105,320,35);for(let x=3;x<320;x+=13){ctx.fillStyle=x%26?'#648447':'#a6aa63';ctx.fillRect(x,101+(x%5),1,7)}ctx.fillStyle='#9b9279';ctx.fillRect(135,92,9,16);ctx.fillRect(173,96,6,12);ctx.fillStyle='#c6b47f';ctx.fillRect(245,61,6,44);ctx.fillStyle='#8d7049';ctx.fillRect(237,60,22,4);ctx.save();ctx.translate(248,60);ctx.rotate((time/9000)%6.28);ctx.fillRect(-1,-18,2,36);ctx.fillRect(-18,-1,36,2);ctx.restore();tree(ctx,31,91,s);tree(ctx,64,89,-s);tree(ctx,300,90,s)}

  function renderDrawer(){const d=el('vaDrawer');if(!d)return;if(!drawer){d.className='va-drawer';d.innerHTML='';return}d.className='va-drawer open';let title='',body='';
    if(drawer==='map'){title='Map of Canto Plains';body=renderMap()}
    if(drawer==='character'){title='Character';body=renderCharacterPanel()}
    if(drawer==='inventory'){title='Inventory';body=renderInventory()}
    if(drawer==='journal'){title='Quest Journal';body=renderJournal()}
    if(drawer==='jobs'){title='Job Board';body=renderJobs()}
    if(drawer==='admin'){title='Adventure Debug';body=renderAdmin()}
    d.innerHTML=`<header class="va-drawer-head"><h4>${esc(title)}</h4><button class="va-drawer-close" data-va="close-drawer" type="button">×</button></header><div class="va-drawer-body">${body}</div>`;
  }
  function renderMap(){const current=state.location?.id;return `<div class="va-map">${safeArray(state.map_locations).map(x=>{const cls=[x.current?'current':'',x.connected?'connected':'',!x.discovered?'locked':''].join(' ');return `<button class="va-map-node ${x.id===current?'current ':''}${x.connected?'connected ':''}${!x.discovered?'locked':''}" style="left:${Number(x.map_x)||50}%;top:${Number(x.map_y)||50}%" data-va="map-node" data-location="${esc(x.id)}" ${(!x.discovered||(!x.connected&&x.id!==current))?'disabled':''} type="button">${x.id===current?'◆':'•'}</button><span class="va-map-label" style="left:${Number(x.map_x)||50}%;top:${Number(x.map_y)||50}%">${esc(x.name)}</span>`}).join('')}</div><p class="va-resume-summary">Connected gold-ring locations can be travelled to immediately. Travel advances world time and auto-saves.</p>`}
  function renderCharacterPanel(){const a=state.adventure,stats=state.stats||{};return `<div class="va-review"><div class="va-portrait">${esc(a.name.charAt(0))}</div><dl><div><dt>NAME</dt><dd>${esc(a.name)}</dd></div><div><dt>LEVEL</dt><dd>${Number(a.level)||1}</dd></div><div><dt>HOMELAND</dt><dd>${esc(a.homeland)}</dd></div><div><dt>BACKGROUND</dt><dd>${esc(a.background)}</dd></div><div><dt>ARCHETYPE</dt><dd>${esc(a.archetype)}</dd></div><div><dt>ADVENTURE XP</dt><dd>${Number(a.xp||0).toLocaleString('en-GB')}</dd></div></dl></div><h5>CORE STATS</h5><div class="va-stat-grid">${Object.keys(STAT_LABELS).map(k=>`<div class="va-stat"><small>${esc(STAT_LABELS[k].toUpperCase())}</small><b>${Number(stats[k])||0}</b></div>`).join('')}</div><h5>PROFESSIONS</h5><div class="va-prof-list">${safeArray(state.professions).map(p=>`<div class="va-prof"><b>${esc(PROF_LABELS[p.profession_key]||p.profession_key)}</b><span>LV ${Number(p.level)||1} · ${Number(p.xp||0).toLocaleString('en-GB')} XP</span></div>`).join('')}</div>`}
  function renderInventory(){const items=safeArray(state.inventory);return items.length?`<div class="va-inventory-grid">${items.map(i=>`<div class="va-item"><span class="va-item-icon">${esc(i.icon||'•')}</span><div><h5>${esc(i.name)}</h5><p>${esc(i.description)}</p><div class="va-list-meta"><span class="va-pill">${esc(i.category)}</span><span class="va-pill">${esc(i.rarity)}</span></div></div><strong>×${Number(i.quantity)||1}</strong></div>`).join('')}</div>`:'<div class="va-list-card"><h5>Your satchel is empty.</h5></div>'}
  function renderJournal(){const quests=safeArray(state.quests);return `<div class="va-panel-list">${quests.map(x=>{let actions='';if(x.status==='available'&&state.location?.id===x.start_location_id)actions=`<div class="va-list-actions"><button class="va-primary" data-va="accept-quest" data-quest="${esc(x.quest_key)}" type="button">ACCEPT QUEST</button></div>`;if(x.status==='active'&&x.quest_key==='the_little_things_01'&&x.stage===1&&state.location?.id==='willowmere')actions=`<div class="va-list-actions"><button class="va-primary" data-va="quest-deliver" type="button">DELIVER PARCEL</button></div>`;return `<article class="va-list-card"><h5>${esc(x.title)}</h5><p>${esc(x.description)}</p><div class="va-list-meta"><span class="va-pill">${esc(x.category)}</span><span class="va-pill">${esc(x.difficulty)}</span><span class="va-pill">${esc(x.status)}</span></div>${x.progress?.objective?`<p><b>Objective:</b> ${esc(x.progress.objective)}</p>`:''}${x.progress?.outcome?`<p><b>Outcome:</b> ${esc(x.progress.outcome)}</p>`:''}${actions}</article>`}).join('')}</div>`}
  function renderJobs(){const atBoard=state.location?.id==='canto_crossing',jobs=safeArray(state.jobs);return `<p class="va-resume-summary"><b>Canto Crossing Job Board</b><br>Three server-generated Phase 1 contracts refresh each day. Each contract can pay out once and rewards Adventure XP plus profession XP.</p><div class="va-panel-list">${jobs.map(j=>{let action='';if(j.status==='available')action=`<button class="va-primary" data-va="accept-job" data-job="${esc(j.id)}" ${atBoard?'':'disabled'} type="button">${atBoard?'ACCEPT CONTRACT':'RETURN TO CANTO BOARD'}</button>`;if(j.status==='active'&&state.location?.id===j.destination_location_id)action=`<button class="va-primary" data-va="complete-job" data-job="${esc(j.id)}" type="button">COMPLETE CONTRACT</button>`;return `<article class="va-list-card"><h5>${esc(j.title)}</h5><p>${esc(j.description)}</p><div class="va-list-meta"><span class="va-pill">${esc(PROF_LABELS[j.profession_key]||j.profession_key)}</span><span class="va-pill">${esc(j.difficulty)}</span><span class="va-pill">${esc(j.status)}</span></div><p><b>Destination:</b> ${esc(j.destination_name)} · <b>Rewards:</b> ${Number(j.reward_gold)} gold · ${Number(j.reward_adventure_xp)} Adventure XP · ${Number(j.reward_profession_xp)} ${esc(PROF_LABELS[j.profession_key]||j.profession_key)} XP</p>${action?`<div class="va-list-actions">${action}</div>`:''}</article>`}).join('')}</div>`}
  function renderAdmin(){if(!state.admin)return '<p>Admin only.</p>';const a=state.adventure;return `<div class="va-admin-note">SERVER-VALIDATED TEST PANEL · affects only your Adventures save. Other site systems are untouched.</div><div class="va-admin"><div class="va-admin-row"><label>Adventure XP<input id="vaAdminXp" type="number" min="0" max="13034431" value="${Number(a.xp)||0}"></label><label>Gold<input id="vaAdminGold" type="number" min="0" max="1000000000" value="${Number(a.gold)||0}"></label></div><div class="va-admin-row"><label>World day<input id="vaAdminDay" type="number" min="1" max="9999" value="${Number(a.world_day)||1}"></label><label>Minute of day<input id="vaAdminMinute" type="number" min="0" max="1439" value="${Number(a.world_minute)||480}"></label></div><div class="va-admin-row"><label>Location<select id="vaAdminLocation">${safeArray(state.map_locations).filter(x=>x.discovered).map(x=>`<option value="${esc(x.id)}" ${x.id===a.location_id?'selected':''}>${esc(x.real_name||x.name)}</option>`).join('')}</select></label><label>Weather<select id="vaAdminWeather">${['clear','cloudy','rain','mist','storm','snow','heat'].map(x=>`<option ${x===a.weather?'selected':''}>${x}</option>`).join('')}</select></label></div><button class="va-primary" data-va="admin-apply" type="button">APPLY DEBUG STATE</button></div>`}

  function mainQuest(){return safeArray(state?.quests).find(x=>x.is_main_story)}
  function objectiveTitle(){const q=mainQuest();if(q?.status==='active')return q.title;const job=safeArray(state?.jobs).find(j=>j.status==='active');if(job)return job.title;return q?.status==='available'?'The Little Things':'No objective tracked'}
  function objectiveText(){const q=mainQuest();if(q?.status==='active'&&q.progress?.objective)return q.progress.objective;if(q?.status==='available')return 'Check the Canto Crossing notice board. A courier has a small job that needs doing.';const job=safeArray(state?.jobs).find(j=>j.status==='active');if(job)return `Reach ${job.destination_name} and complete the contract.`;if(q?.status==='completed')return 'The ordinary parcel is delivered. The strange brass token remains unexplained.';return 'Explore Canto Plains, take a contract or simply look around.'}

  async function onClick(e){const target=e.target.closest('[data-va]');if(!target)return;const action=target.dataset.va;playClick();try{
    if(action==='retry'){renderLoading('Reloading…');state=await callRpc('adventure_get_state');view='entry';render();return}
    if(action==='back-quests'||action==='exit-game'){backToQuests();return}
    if(action==='begin-create'){Object.assign(creation,{step:0,name:state?.account_username||'',homeland:'Elvane',background:'Apprentice Explorer',archetype:'Ranger'});view='create';render();return}
    if(action==='continue'){view='game';lastNarrative=state.adventure.last_summary||'';render();return}
    if(action==='journal-entry'){view='game';drawer='journal';lastNarrative=state.adventure.last_summary||'';render();return}
    if(action==='new-adventure'){view='reset';render();return}
    if(action==='cancel-reset'){view='entry';render();return}
    if(action==='confirm-reset'){if(el('vaResetConfirm')?.value!=='RESET')return;renderLoading('Erasing Adventure save…');state=await callRpc('adventure_reset_character');view='create';Object.assign(creation,{step:0,name:state.account_username||'',homeland:'Elvane',background:'Apprentice Explorer',archetype:'Ranger'});render();return}
    if(action==='choose'){creation[target.dataset.key]=target.dataset.value;renderCreate();return}
    if(action==='create-back'){if(creation.step===0){view='entry';render()}else{creation.step--;renderCreate()}return}
    if(action==='create-next'){if(creation.step===0){creation.name=(el('vaCreateName')?.value||'').trim();if(creation.name.length<2){notify('Choose an adventurer name first.');return}}creation.step=Math.min(4,creation.step+1);renderCreate();return}
    if(action==='create-submit'){renderLoading('Creating your persistent Adventure…');state=await callRpc('adventure_create_character',{p_name:creation.name,p_homeland:creation.homeland,p_background:creation.background,p_archetype:creation.archetype});view='game';lastNarrative=state.adventure.last_summary;render();saved();return}
    if(action==='open-drawer'){drawer=target.dataset.drawer;renderDrawer();return}
    if(action==='close-drawer'){drawer=null;renderDrawer();return}
    if(action==='map-node'){const id=target.dataset.location;if(id&&id!==state.location.id)await travel(id);return}
    if(action==='scene-action'){await sceneAction(target.dataset.action);return}
    if(action==='drawer-jobs'){drawer='jobs';renderDrawer();return}
    if(action==='accept-quest'){await acceptQuest(target.dataset.quest);return}
    if(action==='quest-deliver'||action==='deliver-main'){await deliverMain();return}
    if(action==='accept-job'){await acceptJob(target.dataset.job);return}
    if(action==='complete-job'){await completeJob(target.dataset.job);return}
    if(action==='custom-submit'){await customAction();return}
    if(action==='admin-apply'){await adminApply();return}
  }catch(err){console.error('[Velmora Adventures]',err);notify(err?.message||'Adventure action failed.');if(view==='game')render()}}
  function onInput(e){if(e.target.id==='vaCreateName')creation.name=e.target.value;if(e.target.id==='vaResetConfirm'){const b=q('[data-va="confirm-reset"]');if(b)b.disabled=e.target.value!=='RESET'}}

  async function travel(id){lastNarrative='You set out along the Canto roads…';renderLoading('Travelling…');state=await callRpc('adventure_travel',{p_location_id:id});view='game';lastNarrative=state.adventure.last_summary;render();saved()}
  async function acceptQuest(key){state=await callRpc('adventure_accept_quest',{p_quest_key:key});lastNarrative='A courier presses a green-corded parcel into your hands. “Willowmere. Straight there, ideally.”';render();saved()}
  async function deliverMain(){state=await callRpc('adventure_quest_action',{p_quest_key:'the_little_things_01',p_action:'deliver'});lastNarrative='The recipient turns the parcel over, then pauses. A thin brass token has been trapped beneath the cord. Three tiny prongs are stamped into one side. “That is not mine,” they say.';render();saved()}
  async function acceptJob(id){state=await callRpc('adventure_accept_job',{p_job_id:id});lastNarrative=state.adventure.last_summary;render();drawer='jobs';renderDrawer();saved()}
  async function completeJob(id){state=await callRpc('adventure_complete_job',{p_job_id:id});lastNarrative=state.adventure.last_summary;render();drawer='jobs';renderDrawer();saved()}

  async function sceneAction(key){if(!key)return;if(key.startsWith('travel:'))return travel(key.split(':')[1]);if(key==='accept-main')return acceptQuest('the_little_things_01');if(key==='deliver-main')return deliverMain();if(key==='drawer-jobs'){drawer='jobs';renderDrawer();return}if(key==='finish-job'){const j=safeArray(state.jobs).find(x=>x.status==='active'&&x.destination_location_id===state.location.id);if(j)return completeJob(j.id)}if(key==='check-perception')return doCheck('perception',12,checkContext());if(key==='check-survival')return doCheck('survival',11,checkContext())}

  function checkContext(){const id=state.location?.id;return id==='canto_crossing'?'old clock markings':id==='willowmere'?'mill wheel':id==='riverglass_ford'?'crossing stones':id==='animal_centre_gate'?'keeper notices':'meadow survey'}
  async function doCheck(stat,dc,context){const r=await callRpc('adventure_roll_check',{p_stat:stat,p_dc:dc,p_context:context});showDice(r,context)}
  function showDice(r,context){const degree=String(r.degree||'failure');const nice=degree.replaceAll('_',' ').toUpperCase();const outcomes={critical_success:'You catch a detail that would have been easy to miss.',success:'You notice enough to form a useful impression.',failure:'Nothing certain separates itself from the ordinary details.',critical_failure:'You become very confident about something that is probably irrelevant.'};const overlay=document.createElement('div');overlay.className='va-dice-overlay';overlay.innerHTML=`<div class="va-dice-card"><small>${esc(String(r.stat).toUpperCase())} CHECK · ${esc(context)}</small><div class="va-die">${Number(r.roll)||1}</div><h4>${Number(r.roll)||0} + ${Number(r.modifier)||0} = ${Number(r.total)||0}</h4><div class="va-dice-total">DC ${Number(r.dc)||0}</div><span class="va-degree ${esc(degree)}">${esc(nice)}</span><p>${esc(outcomes[degree]||outcomes.failure)}</p><button class="va-primary" data-va="dice-close" type="button">CONTINUE</button></div>`;el('vaStage').appendChild(overlay);overlay.querySelector('[data-va="dice-close"]').addEventListener('click',()=>{playClick();lastNarrative=outcomes[degree]||outcomes.failure;overlay.remove();const n=el('vaNarrative');if(n)n.textContent=lastNarrative;saved()},{once:true})}

  async function customAction(){const input=el('vaCustomInput'),raw=(input?.value||'').trim();if(!raw)return;input.value='';const s=raw.toLowerCase();
    if(/\b(inventory|bag|satchel)\b/.test(s)){drawer='inventory';renderDrawer();return}
    if(/\b(map|where am i|travel options)\b/.test(s)){drawer='map';renderDrawer();return}
    if(/\b(journal|quest)\b/.test(s)&&!s.includes('accept')){drawer='journal';renderDrawer();return}
    if(/\b(job|contract|notice board|job board)\b/.test(s)){drawer='jobs';renderDrawer();return}
    if(/\b(character|stats|skills)\b/.test(s)){drawer='character';renderDrawer();return}
    if(/deliver|hand over|give.*parcel/.test(s)&&mainQuest()?.status==='active'&&state.location?.id==='willowmere')return deliverMain();
    const ready=safeArray(state.jobs).find(j=>j.status==='active'&&j.destination_location_id===state.location?.id);if(ready&&/deliver|hand over|finish|complete/.test(s))return completeJob(ready.id);
    if(mainQuest()?.status==='available'&&state.location?.id==='canto_crossing'&&/parcel|courier.*job|accept.*quest/.test(s))return acceptQuest('the_little_things_01');
    const locations=safeArray(state.map_locations).filter(x=>x.connected&&x.discovered&&x.id!==state.location?.id);const wanted=locations.find(x=>s.includes(String(x.real_name||x.name).toLowerCase())||s.includes(x.id.replaceAll('_',' ')));if(wanted&&/go|walk|travel|head|leave|make.*way/.test(s))return travel(wanted.id);
    if(/look|inspect|search|study|listen|survey|examine/.test(s))return doCheck(/track|path|stone|weather|plant/.test(s)?'survival':'perception',12,'free action observation');
    const out=await AdventureNarrator.narrate({action:raw,player:state.adventure,location:state.location,quest:mainQuest(),recentActions:safeArray(state.recent_actions).slice(0,4)});lastNarrative=out.narration;const n=el('vaNarrative');if(n)n.textContent=lastNarrative;
  }

  async function adminApply(){if(!state.admin)return;const patch={xp:Number(el('vaAdminXp')?.value||0),gold:Number(el('vaAdminGold')?.value||0),world_day:Number(el('vaAdminDay')?.value||1),world_minute:Number(el('vaAdminMinute')?.value||480),location_id:el('vaAdminLocation')?.value,weather:el('vaAdminWeather')?.value};state=await callRpc('adventure_admin_patch_self',{p_patch:patch});lastNarrative='Admin test state applied.';render();drawer='admin';renderDrawer();saved()}

  function saved(){clearTimeout(saveToastTimer);const s=el('vaSaved');if(!s)return;s.classList.add('show');saveToastTimer=setTimeout(()=>s.classList.remove('show'),1200)}
  function formatWorldTime(min){min=clamp(Number(min)||0,0,1439);return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`}
  function formatPlay(sec){sec=Math.max(0,Number(sec)||0);const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);return h?`${h}h ${m}m`:`${m}m`}
  function formatLastPlayed(value){const t=Date.parse(value||'');if(!Number.isFinite(t))return 'Recently';const diff=Math.max(0,Date.now()-t),m=Math.floor(diff/60000);if(m<1)return 'Just now';if(m<60)return `${m}m ago`;const h=Math.floor(m/60);if(h<24)return `${h}h ago`;return `${Math.floor(h/24)}d ago`}
  function xpForAdventureLevel(level){if(typeof xpForLevel==='function')return Number(xpForLevel(level))||0;let p=0;for(let i=1;i<level;i++)p+=Math.floor(i+300*Math.pow(2,i/7));return Math.floor(p/4)}

  // Re-sync launcher state after login/logout without patching the site's auth system.
  window.addEventListener('repo-character-changed',()=>{if(el(DIALOG_ID)?.open){view='entry';open().catch(()=>{})}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});else inject();
  window.VelmoraAdventures={version:VERSION,open,close,getState:()=>state,refresh:async()=>{state=await callRpc('adventure_get_state');render();return state},narrator:AdventureNarrator};
})();
