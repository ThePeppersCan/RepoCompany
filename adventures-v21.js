/* VELMORA ADVENTURES — Phase 2
   Persistent state is owned by Supabase RPCs. Narration may describe state but never grants rewards. */
(()=>{
  'use strict';
  const VERSION='2.1.0-phase2_1';
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

const HOMELAND_ICONS={Vardesh:'❄',Lumerre:'✦',Kordesh:'⚒',Nambara:'☼',Norveth:'▲',Zafran:'✧',Elvane:'❀',Qasmir:'☽',Calvora:'✺',Rovarn:'⚑',Talune:'≈',Drazhen:'⛓',Belros:'♜',Marovar:'⚓',Sorevia:'❈',Iskandar:'◈'};
const BACKGROUND_ICONS={'Apprentice Explorer':'🧭','Animal Keeper':'🦊','Travelling Merchant':'🜚','Fisher':'🐟','Cook':'🍲','Hunter':'🏹','Scholar':'📜','Courier':'✉','Street Rogue':'🗝','Craftsman':'🛠','Investigator':'🔍','Ruin Hunter':'🏛','Former Repo Sports Prospect':'🏆','Farmhand':'🌾','Sailor':'⛵','Miner':'⛏','Herbalist':'🌿','Nobody Particularly Important':'•'};
const ARCHETYPE_ICONS={Warrior:'⚔',Ranger:'🏹',Rogue:'🗡',Mage:'✧',Alchemist:'⚗',Bard:'♫',Guardian:'🛡',Beastkeeper:'🐾',Investigator:'🔎'};

  let state=null,phase2={},view='entry',drawer=null,busy=false,sceneFrame=0,heartbeat=0,saveToastTimer=0,lastNarrative='',activeConversation=null;
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
    return `You can try that, but the current rules do not have a safe mechanical resolution for it yet. Nothing authoritative changes and you remain in ${loc?.name||'place'}.`;
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

  function mergePhase2(base,p2={}){
    if(!base?.exists){phase2={};return base}
    phase2=p2||{};
    const qmap=new Map(safeArray(base.quests).map(x=>[x.quest_key,x]));
    safeArray(p2.phase2_quests).forEach(x=>qmap.set(x.quest_key,{...qmap.get(x.quest_key),...x,phase2:true}));
    const jmap=new Map(safeArray(base.jobs).map(x=>[x.id,x]));
    safeArray(p2.phase2_jobs).forEach(x=>jmap.set(x.id,{...jmap.get(x.id),...x,phase2:true}));
    const known=new Set(safeArray(p2.known_phase2_locations));
    const maps=safeArray(base.map_locations).map(x=>x.id&&['bellmead','whisperbank_grove','old_canto_watch','lake_eira','redbank_hollow'].includes(x.id)?{...x,discovered:x.discovered||known.has(x.id),name:(x.discovered||known.has(x.id))?(x.real_name||x.name):'???'}:x);
    return {...base,...p2,quests:[...qmap.values()],jobs:[...jmap.values()],map_locations:maps};
  }
  async function loadFullState(opts={}){
    const base=await callRpc('adventure_get_state',{},opts);
    if(!base?.exists){phase2={};return base}
    const p2=await callRpc('adventure_phase2_get_state',{}, {...opts,silent:true});
    return mergePhase2(base,p2);
  }
  function takePhase2Result(res){if(res?.base){state=mergePhase2(res.base,res.phase2||{});return res}return res}
  async function refreshFull(){state=await loadFullState();return state}

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
    d.innerHTML=`<div class="va-shell"><header class="va-topbar"><div class="va-brand-mark"><span>V</span></div><div class="va-brand-copy"><small>REPO COMPANY PRESENTS</small><h2>VELMORA ADVENTURES</h2></div><div class="va-top-spacer"></div><span class="va-phase-chip">PERSISTENT RPG · PHASE 2.1</span><button class="va-close" type="button" aria-label="Close Velmora Adventures">×</button></header><main class="va-stage" id="vaStage"></main><div class="va-saved" id="vaSaved">ADVENTURE SAVED</div></div>`;
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
    try{state=await loadFullState({});render()}
    catch(err){console.error('[Velmora Adventures] load failed',err);renderError(err)}
    startHeartbeat();
  }
  function close(){cancelAnimationFrame(sceneFrame);sceneFrame=0;clearInterval(heartbeat);heartbeat=0;drawer=null;el(DIALOG_ID)?.close()}
  function backToQuests(){close();const d=el('questsDialog');if(d&&!d.open){d.showModal();try{if(typeof loadQuestProfile==='function')loadQuestProfile().then(()=>renderQuestJournal?.())}catch(_){}}}
  function startHeartbeat(){clearInterval(heartbeat);heartbeat=setInterval(async()=>{if(!state?.exists||!el(DIALOG_ID)?.open)return;try{const next=await callRpc('adventure_touch',{}, {silent:true});if(next?.exists)state=mergePhase2(next,phase2)}catch(_){ }},60000)}

  function renderLoading(text){const s=el('vaStage');if(s)s.innerHTML=`<section class="va-loading"><div><i></i><b>${esc(text)}</b></div></section>`}
  function renderError(err){const msg=err?.message||String(err||'Unknown error');el('vaStage').innerHTML=`<section class="va-screen"><div class="va-error-card"><h3>Adventure could not load</h3><p>${esc(msg)}</p><div class="va-entry-actions"><button class="va-secondary" data-va="retry" type="button">TRY AGAIN</button><button class="va-secondary" data-va="back-quests" type="button">BACK TO QUESTS</button></div></div></section>`}
  function render(){cancelAnimationFrame(sceneFrame);sceneFrame=0;if(view==='create')return renderCreate();if(view==='reset')return renderReset();if(view==='game'&&state?.exists)return renderGame();return renderEntry()}

  function renderEntry(){
    if(!state){return renderLoading('Loading your Adventure…')}
    const stage=el('vaStage');stage.className='va-stage';
    if(!state.exists){
      stage.innerHTML=`<section class="va-screen"><div class="va-entry"><div class="va-entry-hero"><small class="va-entry-kicker">A LIFE WAITING TO HAPPEN</small><h3>Live another life in Velmora.</h3><p>Take jobs, travel the world, meet its people and create your own story. Adventures saves separately from your normal site progress and can be continued whenever you return.</p><div class="va-entry-actions"><button class="va-primary" data-va="begin-create" type="button">BEGIN YOUR ADVENTURE</button><button class="va-secondary" data-va="back-quests" type="button">BACK TO QUESTS</button></div></div><div class="va-resume-summary"><b>Phase 2 is live:</b> Canto Plains now has schedules, persistent NPC relationships and memories, herbalism, wildlife encounters, exploration discoveries and longer side stories — all on the same server-owned save.</div></div></section>`;return;
    }
    const a=state.adventure,loc=state.location,activeQuest=safeArray(state.quests).find(x=>x.status==='active'&&x.is_main_story);
    stage.innerHTML=`<section class="va-screen"><div class="va-entry"><div class="va-entry-hero"><small class="va-entry-kicker">YOUR VELMORA SAVE</small><h3>Welcome back, ${esc(a.name)}.</h3><p>${esc(a.last_summary||'Your story is waiting where you left it.')}</p></div><div class="va-save-card"><div class="va-portrait">${esc(String(a.name||'?').charAt(0))}</div><div class="va-save-copy"><h4>${esc(a.name)}</h4><span>LEVEL ${Number(a.level)||1} ${esc(String(a.archetype||'Adventurer').toUpperCase())} · ${esc(a.homeland)}</span><div class="va-save-stats"><div><small>CURRENT LOCATION</small><b>${esc(loc?.name||a.location_id)}</b></div><div><small>ADVENTURE TIME</small><b>${formatPlay(a.play_seconds)}</b></div><div><small>MAIN QUEST</small><b>${esc(activeQuest?.title||'Untracked')}</b></div><div><small>VELMORAN GOLD</small><b>${Number(a.gold||0).toLocaleString('en-GB')}</b></div></div></div><div class="va-save-buttons"><button class="va-primary" data-va="continue" type="button">CONTINUE ADVENTURE</button><button class="va-secondary" data-va="journal-entry" type="button">JOURNAL</button><button class="va-danger" data-va="new-adventure" type="button">NEW ADVENTURE</button></div></div><div class="va-resume-summary"><b>Last played:</b> ${formatLastPlayed(a.last_played_at)} · <b>Day ${Number(a.world_day)||1}, ${formatWorldTime(a.world_minute)}</b><br>${esc(objectiveText())}</div></div></section>`;
  }

  function renderReset(){
    const a=state?.adventure;el('vaStage').innerHTML=`<section class="va-screen"><div class="va-create"><div class="va-create-head"><div><h3>Start a new life?</h3><p>This permanently deletes the current Adventures save only. It does not touch your normal Repo Company account, skills, TCG or other site systems.</p></div></div><div class="va-create-panel"><h4>Erase ${esc(a?.name||'this Adventure')}</h4><p>Type <b>RESET</b> below to confirm. This cannot be undone.</p><input class="va-reset-input" id="vaResetConfirm" autocomplete="off" placeholder="Type RESET"><div class="va-create-actions"><button class="va-secondary" data-va="cancel-reset" type="button">CANCEL</button><button class="va-danger" data-va="confirm-reset" type="button" disabled>ERASE ADVENTURE</button></div></div></div></section>`;
  }


function choiceIconFor(key,name){
  if(key==='homeland')return HOMELAND_ICONS[name]||'◇';
  if(key==='background')return BACKGROUND_ICONS[name]||'◇';
  if(key==='archetype')return ARCHETYPE_ICONS[name]||'◇';
  return '◇';
}
function choiceMetaFor(key,name){
  if(key==='homeland')return `+1 ${HOMELAND_HINT[name]||'Stat'}`;
  if(key==='background')return 'origin & starter gear';
  if(key==='archetype')return 'playstyle focus';
  return '';
}
function renderCreateSummary(){
  const rows=[
    ['Name',creation.name||'Not chosen yet'],
    ['Homeland',creation.homeland||'—'],
    ['Background',creation.background||'—'],
    ['Archetype',creation.archetype||'—'],
    ['Starting Region','Elvane · Canto Plains']
  ];
  const current=creation.step===0?'Choose a name to begin your story.':creation.step===1?'Pick the homeland your adventurer grew up in.':creation.step===2?'Choose the kind of life they have already lived.':creation.step===3?'Choose how they tend to solve problems.':'Everything is ready. Enter Velmora.';
  return `<aside class="va-create-summary"><small class="va-summary-kicker">ADVENTURER PREVIEW</small><div class="va-summary-portrait">${esc((creation.name||'?').charAt(0))}</div><h5>${esc(creation.name||'Unnamed Adventurer')}</h5><p>${esc(current)}</p><div class="va-summary-list">${rows.map(([k,v])=>`<div><small>${esc(String(k).toUpperCase())}</small><b>${esc(v)}</b></div>`).join('')}</div><div class="va-summary-foot">Balanced server-owned stats, separate save data and persistent world state.</div></aside>`;
}
function actionVisualMeta(key,label){
  if(String(key).startsWith('travel:'))return ['⇢','TRAVEL'];
  if(String(key).startsWith('quest-p2:'))return ['✦','QUEST'];
  if(String(key).startsWith('accept-p2:'))return ['✦','MYSTERY'];
  if(key==='accept-main'||key==='deliver-main')return ['✉','MAIN STORY'];
  if(key==='wildlife-search')return ['◌','WILDLIFE'];
  if(key==='open-codex-herbs')return ['❀','HERBALISM'];
  if(key==='scout')return ['◈','EXPLORATION'];
  if(key==='drawer-jobs'||key==='finish-job')return ['☰','CONTRACT'];
  return ['•','ACTION'];
}
function actionCard(key,label){
  const [icon,kicker]=actionVisualMeta(key,label);
  return `<button class="va-action va-action-card" data-va="scene-action" data-action="${esc(key)}" type="button"><span class="va-action-icon">${icon}</span><span class="va-action-copy"><small>${esc(kicker)}</small><b>${esc(label)}</b></span></button>`;
}
function sceneSubtitle(){
  const wild=state?.active_wildlife;
  if(wild)return `A ${String(wild.rarity||'wild').toLowerCase()} creature has appeared nearby.`;
  const main=mainQuest();
  if(main?.status==='active'&&main.progress?.objective)return main.progress.objective;
  return state?.location?.description||'Take a moment to look around.';
}


function renderCreate(){
  const stage=el('vaStage');stage.className='va-stage';
  const dots=Array.from({length:5},(_,i)=>`<i class="${i<=creation.step?'on':''}"></i>`).join('');
  let body='';
  if(creation.step===0)body=`<h4>Name your adventurer</h4><p>This is your Adventures character, separate from your Repo Company username.</p><input id="vaCreateName" class="va-name-input" maxlength="24" value="${esc(creation.name)}" placeholder="Adventurer name" autocomplete="off">`;
  if(creation.step===1)body=`<h4>Choose a homeland</h4><p>Homeland adds one small thematic stat bonus. Every country grants the same total value.</p><div class="va-choice-grid">${HOMELANDS.map(x=>choice(x,`Homeland bonus · +1 ${HOMELAND_HINT[x]}`,creation.homeland===x,'homeland')).join('')}</div>`;
  if(creation.step===2)body=`<h4>Choose a background</h4><p>Your background gives two small starting stat nudges, a practical item and later dialogue hooks.</p><div class="va-choice-grid">${BACKGROUNDS.map(([x,d])=>choice(x,d,creation.background===x,'background')).join('')}</div>`;
  if(creation.step===3)body=`<h4>Choose an archetype</h4><p>Archetypes influence how you solve problems, but they will never permanently lock you out of the game.</p><div class="va-choice-grid">${ARCHETYPES.map(([x,d])=>choice(x,d,creation.archetype===x,'archetype')).join('')}</div>`;
  if(creation.step===4)body=`<h4>Ready to enter Elvane?</h4><p>Your exact stats and starter equipment are calculated on the server from these balanced choices.</p><div class="va-review"><div class="va-portrait">${esc((creation.name||'?').charAt(0))}</div><dl><div><dt>NAME</dt><dd>${esc(creation.name)}</dd></div><div><dt>HOMELAND</dt><dd>${esc(creation.homeland)}</dd></div><div><dt>BACKGROUND</dt><dd>${esc(creation.background)}</dd></div><div><dt>ARCHETYPE</dt><dd>${esc(creation.archetype)}</dd></div><div><dt>STARTING REGION</dt><dd>Elvane · Canto Plains</dd></div><div><dt>SAVE MODE</dt><dd>Automatic</dd></div></dl></div>`;
  stage.innerHTML=`<section class="va-screen va-create-screen"><div class="va-create"><div class="va-create-head"><div><h3>Create your adventurer</h3><p>Step ${creation.step+1} of 5</p></div><div class="va-step-dots">${dots}</div></div><div class="va-create-layout"><div class="va-create-panel"><div class="va-create-body">${body}</div><div class="va-create-actions"><button class="va-secondary" data-va="create-back" type="button">${creation.step===0?'CANCEL':'BACK'}</button>${creation.step===4?'<button class="va-primary" data-va="create-submit" type="button">BEGIN IN CANTO CROSSING</button>':'<button class="va-primary" data-va="create-next" type="button">CONTINUE</button>'}</div></div>${renderCreateSummary()}</div></div></section>`;
  stage.scrollTop=0;
}
function choice(name,desc,selected,key){const icon=choiceIconFor(key,name),meta=choiceMetaFor(key,name);return `<button class="va-choice ${selected?'selected':''}" data-va="choose" data-key="${esc(key)}" data-value="${esc(name)}" type="button"><span class="va-choice-icon">${icon}</span><span class="va-choice-copy"><b>${esc(name)}</b><small>${esc(desc)}</small><em>${esc(meta)}</em></span></button>`}



function renderGame(){
  const a=state.adventure,loc=state.location,level=Number(a.level)||1,cur=xpForAdventureLevel(level),next=level>=99?13034431:xpForAdventureLevel(level+1),xp=Number(a.xp)||0,xpP=level>=99?100:Math.round(clamp((xp-cur)/Math.max(1,next-cur),0,1)*100),hpP=Math.round(clamp((Number(a.hp)||0)/Math.max(1,Number(a.max_hp)||1),0,1)*100);
  const stage=el('vaStage');stage.className='va-stage';
  const admin=state.admin?`<div class="va-mini-card"><small>ADMIN TESTING</small><b>Adventure debug tools enabled.</b><div class="va-list-actions"><button class="va-secondary" data-va="open-drawer" data-drawer="admin" type="button">OPEN DEBUG</button></div></div>`:'';
  const nearbyCount=safeArray(state.nearby_npcs).length;
  const openRoads=safeArray(state.map_locations).filter(x=>x.connected&&x.discovered&&x.id!==loc.id).length;
  stage.innerHTML=`<section class="va-screen is-game"><div class="va-game"><div class="va-game-main"><section class="va-world"><header class="va-location-head"><div class="va-location-title"><small class="va-zone-kicker">${esc(String(loc.country).toUpperCase())} · ${esc(String(loc.region).toUpperCase())}</small><h3>${esc(loc.name)}</h3><span>${esc(loc.description||'')}</span></div><div class="va-head-chips"><span class="va-head-chip">DAY ${Number(a.world_day)||1} · ${formatWorldTime(a.world_minute)}</span><span class="va-head-chip weather">${esc(WEATHER_LABELS[a.weather]||a.weather)}</span></div></header><div class="va-scene-wrap"><canvas id="vaScene" width="960" height="420" aria-label="${esc(loc.name)}"></canvas><div class="va-weather-layer ${esc(a.weather)}"></div><div class="va-scene-caption"><span>${nearbyCount} nearby</span><span>${openRoads} roads open</span></div><div class="va-scene-vignette"></div></div><section class="va-story"><div class="va-story-head"><span class="va-story-label">CURRENT SCENE</span><small class="va-story-sub">${esc(sceneSubtitle())}</small></div><p id="vaNarrative" class="va-narrative">${esc(lastNarrative||a.last_summary||loc.description)}</p>${renderEncounterStrip()}<div class="va-action-head"><small>WHAT DO YOU DO?</small></div><div class="va-action-row va-action-grid" id="vaActions">${renderActions()}</div><form class="va-custom-action" id="vaCustomForm"><input id="vaCustomInput" maxlength="180" autocomplete="off" placeholder="Try something in plain English…"><button class="va-secondary" data-va="custom-submit" type="button">TRY IT</button></form><small class="va-custom-hint">Free actions use the Phase 2 rules interpreter. NPC, item, quest and reward changes are still server validated.</small></section></section><aside class="va-side"><div class="va-char-card"><div class="va-char-top"><div class="va-portrait">${esc(a.name.charAt(0))}</div><div class="va-char-copy"><h4>${esc(a.name)}</h4><span>LEVEL ${level} ${esc(String(a.archetype).toUpperCase())}</span></div></div><div class="va-bars"><div class="va-bar hp" style="--p:${hpP}%"><small>HP</small><i></i><b>${a.hp}/${a.max_hp}</b></div><div class="va-bar" style="--p:${xpP}%"><small>XP TO NEXT</small><i></i><b>${xp.toLocaleString('en-GB')}</b></div></div></div><div class="va-objective-card"><small>CURRENT OBJECTIVE</small><b>${esc(objectiveTitle())}</b><p>${esc(objectiveText())}</p></div><div class="va-quick-stats"><div><small>GOLD</small><b>${Number(a.gold||0).toLocaleString('en-GB')}</b></div><div><small>TIME PLAYED</small><b>${formatPlay(a.play_seconds)}</b></div><div><small>HOMELAND</small><b>${esc(a.homeland)}</b></div><div><small>BACKGROUND</small><b>${esc(a.background)}</b></div></div>${admin}</aside></div><nav class="va-nav"><button data-va="open-drawer" data-drawer="map" type="button">MAP</button><button data-va="open-drawer" data-drawer="character" type="button">CHARACTER</button><button data-va="open-drawer" data-drawer="inventory" type="button">INVENTORY</button><button data-va="open-drawer" data-drawer="journal" type="button">JOURNAL</button><button data-va="open-drawer" data-drawer="relationships" type="button">RELATIONSHIPS</button><button data-va="open-drawer" data-drawer="codex" type="button">CODEX</button><button data-va="open-drawer" data-drawer="jobs" type="button">JOBS</button><button class="va-exit" data-va="exit-game" type="button">SAVE & EXIT</button></nav><aside class="va-drawer" id="vaDrawer"></aside><div class="va-saved" id="vaSaved">ADVENTURE SAVED</div></div></section>`;
  renderDrawer();startSceneLoop();
}



function renderEncounterStrip(){
  const wildlife=state.active_wildlife;
  if(wildlife)return `<div class="va-encounter-card"><div class="va-encounter-icon">${esc(wildlife.icon||'◇')}</div><div><small>WILDLIFE ENCOUNTER · ${esc(String(wildlife.rarity||'').toUpperCase())}</small><b>${esc(wildlife.name)}</b><p>${esc(wildlife.description)}</p></div><div class="va-encounter-actions"><button data-va="wildlife-act" data-action="observe" type="button">OBSERVE</button><button data-va="wildlife-act" data-action="feed" type="button">OFFER FEED</button><button data-va="wildlife-act" data-action="leave" type="button">LEAVE</button></div></div>`;
  const npcs=safeArray(state.nearby_npcs).slice(0,4);
  if(!npcs.length)return '';
  return `<div class="va-nearby-strip"><div class="va-nearby-head"><small>PEOPLE HERE NOW</small><span>${npcs.length} available</span></div><div>${npcs.map(n=>`<button data-va="talk-npc" data-npc="${esc(n.npc_key)}" data-topic="hello" type="button"><span>${esc(n.portrait_icon||n.name.charAt(0))}</span><b>${esc(n.name)}</b><em>${esc(n.occupation)}</em></button>`).join('')}</div></div>`;
}


  function renderActions(){
    const loc=state.location?.id,actions=[],main=mainQuest();
    const readyJobs=safeArray(state.jobs).filter(j=>j.status==='active'&&j.destination_location_id===loc);
    if(main?.quest_key==='the_little_things_01'&&main.status==='available'&&loc==='canto_crossing')actions.push(['accept-main','Take the sealed parcel']);
    if(main?.quest_key==='the_little_things_01'&&main.status==='active'&&main.stage===1&&loc==='willowmere')actions.push(['deliver-main','Deliver the parcel']);
    const p2main=safeArray(state.quests).find(q=>q.quest_key==='the_little_things_02');
    if(p2main?.status==='available'&&loc==='canto_crossing')actions.push(['accept-p2:the_little_things_02','Ask about the brass token']);
    const mq=safeArray(state.quests).find(q=>q.quest_key==='side_mill_knocks');
    if(mq?.status==='active'&&mq.stage===1&&loc==='willowmere')actions.push(['quest-p2:side_mill_knocks:inspect_mill','Investigate the second knock']);
    if(mq?.status==='active'&&mq.stage===2&&loc==='old_canto_watch')actions.push(['quest-p2:side_mill_knocks:search_watch','Search the old watch-house']);
    if(mq?.status==='active'&&mq.stage===3&&loc==='willowmere')actions.push(['quest-p2:side_mill_knocks:report_mara','Report back to Mara']);
    const bg=safeArray(state.quests).find(q=>q.quest_key==='side_bitter_green');
    if(bg?.status==='active'&&loc==='willowmere')actions.push(['quest-p2:side_bitter_green:turn_in','Give Elsie the requested herbs']);
    const qt=safeArray(state.quests).find(q=>q.quest_key==='side_quiet_tracks');
    if(qt?.status==='active'&&qt.stage===2&&loc==='animal_centre_gate')actions.push(['quest-p2:side_quiet_tracks:report','Report the Reedtail sighting']);
    if(readyJobs.length)actions.push(['finish-job','Complete arriving contract']);
    if(!state.active_wildlife&&['canto_plains_verge','riverglass_ford','animal_centre_gate','bellmead','whisperbank_grove','lake_eira','redbank_hollow'].includes(loc))actions.push(['wildlife-search','Search for wildlife']);
    if(safeArray(state.local_herbs).length)actions.push(['open-codex-herbs','Inspect local plants']);
    const hiddenConnected=safeArray(state.map_locations).some(x=>x.connected&&!x.discovered&&x.id!==loc);
    if(hiddenConnected)actions.push(['scout','Scout beyond the familiar road']);
    if(loc==='canto_crossing')actions.push(['drawer-jobs','Read the job board']);
    const connected=safeArray(state.map_locations).filter(x=>x.connected&&x.discovered&&x.id!==loc).slice(0,Math.max(1,5-actions.length));
    connected.forEach(x=>actions.push([`travel:${x.id}`,`Travel to ${x.real_name||x.name}`]));
    return actions.slice(0,6).map(([key,label])=>actionCard(key,label)).join('');
  }

  function startSceneLoop(){cancelAnimationFrame(sceneFrame);const tick=t=>{const c=el('vaScene');if(!c||view!=='game'||!el(DIALOG_ID)?.open)return;drawScene(c,t);sceneFrame=requestAnimationFrame(tick)};sceneFrame=requestAnimationFrame(tick)}

function drawScene(canvas,time){
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;const W=320,H=140;ctx.save();ctx.setTransform(3,0,0,3,0,0);const a=state.adventure,loc=state.location,minute=Number(a.world_minute)||480;const daylight=minute>=360&&minute<1140;const dusk=minute>=1020&&minute<1200;
  const skyTop=daylight?(dusk?'#c07e66':'#7db7c8'):'#17283a'; const skyBottom=daylight?(dusk?'#f0bc88':'#b7dfd8'):'#32415c';
  for(let y=0;y<80;y++){ const p=y/79; ctx.fillStyle=lerpHex(skyTop,skyBottom,p); ctx.fillRect(0,y,W,1); }
  drawCelestial(ctx,minute,daylight,dusk);
  if(daylight){ctx.fillStyle='rgba(229,237,218,.72)';for(let i=0;i<4;i++){let x=((i*93+time*.004)%390)-55,y=12+(i%2)*13;ctx.fillRect(x,y,30,5);ctx.fillRect(x+6,y-4,18,5)}}else{ctx.fillStyle='#d9d6b4';for(let i=0;i<24;i++){const x=(i*47)%320,y=(i*29)%70;ctx.fillRect(x,y,1,1)}}
  ctx.fillStyle=daylight?'#466f5a':'#263b42';ctx.beginPath();ctx.moveTo(0,76);for(let x=0;x<=320;x+=24)ctx.lineTo(x,52+((x*7)%23));ctx.lineTo(320,90);ctx.lineTo(0,90);ctx.fill();
  ctx.fillStyle=daylight?'#4f7c50':'#263e35';ctx.fillRect(0,77,W,63);
  const sway=Math.round(Math.sin(time/700)*1);
  if(loc.scene_key==='canto_town')drawTown(ctx,sway);
  else if(loc.scene_key==='willowmere')drawWillowmere(ctx,sway,time);
  else if(loc.scene_key==='river')drawRiver(ctx,sway,time);
  else if(loc.scene_key==='animal_centre')drawCentre(ctx,sway);
  else if(loc.scene_key==='bellmead')drawBellmead(ctx,sway,time);
  else if(loc.scene_key==='grove')drawGrove(ctx,sway,time);
  else if(loc.scene_key==='ruin')drawRuin(ctx,sway,time);
  else if(loc.scene_key==='lake')drawLake(ctx,sway,time);
  else if(loc.scene_key==='redbank')drawRedbank(ctx,sway,time);
  else drawPlains(ctx,sway,time);
  drawAmbientMotes(ctx,time,daylight,dusk,loc.scene_key);
  if(a.weather==='cloudy'){ctx.fillStyle='rgba(41,63,68,.18)';ctx.fillRect(0,0,W,H)}
  if(a.weather==='rain'){ctx.strokeStyle='rgba(190,221,220,.32)';ctx.lineWidth=1;for(let i=0;i<28;i++){let x=(i*17+(time/13))%340-10,y=(i*23+(time/9))%150-10;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+9);ctx.stroke()}}
  if(a.weather==='mist'){ctx.fillStyle='rgba(220,229,216,.12)';ctx.fillRect(0,50,W,45)}
  drawForegroundDetail(ctx,time,loc.scene_key,daylight,dusk);
  ctx.restore();
}
function lerpHex(a,b,p){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),ar=(pa>>16)&255,ag=(pa>>8)&255,ab=pa&255,br=(pb>>16)&255,bg=(pb>>8)&255,bb=pb&255;const r=Math.round(ar+(br-ar)*p),g=Math.round(ag+(bg-ag)*p),bl=Math.round(ab+(bb-ab)*p);return `rgb(${r},${g},${bl})`}
function drawCelestial(ctx,minute,daylight,dusk){if(daylight){ctx.fillStyle=dusk?'#f0d59b':'#f6e7aa';ctx.fillRect(246,15,8,8);ctx.fillStyle=dusk?'#f6b07c':'#fff0be';ctx.fillRect(247,16,6,6)}else{ctx.fillStyle='#d7d4c8';ctx.fillRect(247,15,7,7);ctx.fillStyle='#17283a';ctx.fillRect(250,15,4,7)}}
function drawAmbientMotes(ctx,time,daylight,dusk,scene){if(!daylight||dusk||scene==='grove'||scene==='redbank'||scene==='lake'){for(let i=0;i<10;i++){const x=((i*31+time/45)%340)-8;const y=78+((i*17+time/120)%40);ctx.fillStyle=(dusk||!daylight)?'#efd676':'rgba(255,244,201,.65)';ctx.fillRect(Math.round(x),Math.round(y),2,2);}}}
function drawForegroundDetail(ctx,time,scene,daylight,dusk){ctx.fillStyle=daylight?'#54784c':'#314539';for(let x=0;x<320;x+=10){ctx.fillRect(x,132+(x%3),1,6);if(x%20===0)ctx.fillRect(x+1,130+(x%5),1,8)} if(scene==='lake'||scene==='river'||scene==='willowmere'){ctx.fillStyle='rgba(236,244,236,.35)';for(let i=0;i<6;i++)ctx.fillRect(((i*61+time/20)%350)-20,112+i*3,20,1)}}

  function tree(ctx,x,y,sway=0){ctx.fillStyle='#315235';ctx.fillRect(x-2,y,4,18);ctx.fillStyle='#2c5c39';ctx.fillRect(x-9+sway,y-13,18,15);ctx.fillStyle='#3e7143';ctx.fillRect(x-6+sway,y-18,12,9)}
  function drawTown(ctx,s){ctx.fillStyle='#b79f6a';ctx.fillRect(0,105,320,22);ctx.fillRect(142,76,34,64);for(const [x,w,c] of [[25,50,'#d4c7a2'],[83,42,'#c9b78f'],[210,48,'#d8ceb0'],[270,34,'#c6b48a']]){ctx.fillStyle=c;ctx.fillRect(x,83,w,25);ctx.fillStyle='#734e3d';ctx.beginPath();ctx.moveTo(x-4,83);ctx.lineTo(x+w/2,67);ctx.lineTo(x+w+4,83);ctx.fill();ctx.fillStyle='#4b382f';ctx.fillRect(x+w/2-4,96,8,12)}ctx.fillStyle='#b7aa8d';ctx.fillRect(148,54,22,52);ctx.fillStyle='#746b5a';ctx.fillRect(143,54,32,6);ctx.fillStyle='#e5d37d';ctx.fillRect(154,63,10,10);ctx.fillStyle='#523c2e';ctx.fillRect(155,86,8,20);ctx.fillStyle='#8b653d';ctx.fillRect(184,88,22,18);ctx.fillStyle='#c7a75f';ctx.fillRect(181,84,28,5);tree(ctx,14,90,s);tree(ctx,309,91,-s)}
  function drawWillowmere(ctx,s,time){ctx.fillStyle='#4a8990';ctx.fillRect(0,101,320,39);ctx.fillStyle='rgba(201,229,215,.3)';for(let y=106;y<140;y+=8)ctx.fillRect(((time/30+y*3)%350)-30,y,34,1);ctx.fillStyle='#c5b98e';ctx.fillRect(58,81,60,28);ctx.fillStyle='#6d4839';ctx.beginPath();ctx.moveTo(53,81);ctx.lineTo(88,63);ctx.lineTo(123,81);ctx.fill();ctx.fillStyle='#cfc49c';ctx.fillRect(188,77,54,31);ctx.fillStyle='#734a3b';ctx.beginPath();ctx.moveTo(183,77);ctx.lineTo(215,61);ctx.lineTo(247,77);ctx.fill();ctx.strokeStyle='#7e6b46';ctx.lineWidth=4;ctx.beginPath();ctx.arc(260,97,18,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#7e6b46';ctx.fillRect(259,78,2,38);ctx.fillRect(242,96,36,2);tree(ctx,26,92,s);tree(ctx,151,92,-s)}
  function drawRiver(ctx,s,time){ctx.fillStyle='#4c8e9c';ctx.fillRect(0,88,320,52);ctx.fillStyle='rgba(208,235,221,.32)';for(let i=0;i<8;i++)ctx.fillRect(((i*57+time/24)%370)-40,96+i*5,36,1);ctx.fillStyle='#b9aa82';for(let x=58;x<260;x+=28)ctx.fillRect(x,96+(x%3)*2,19,8);ctx.fillStyle='#3d6f46';for(let x=8;x<320;x+=21){ctx.fillRect(x,82,2,17);ctx.fillRect(x+3,85,2,14)}tree(ctx,28,78,s);tree(ctx,294,79,-s)}
  function drawCentre(ctx,s){ctx.fillStyle='#b39e68';ctx.fillRect(0,106,320,17);ctx.fillStyle='#d2c7a5';ctx.fillRect(98,63,124,45);ctx.fillStyle='#6d4438';ctx.beginPath();ctx.moveTo(92,63);ctx.lineTo(160,39);ctx.lineTo(228,63);ctx.fill();ctx.fillStyle='#335b46';ctx.fillRect(145,78,30,30);ctx.fillStyle='#92734a';ctx.fillRect(45,84,6,34);ctx.fillRect(269,84,6,34);ctx.fillRect(45,87,230,5);ctx.fillStyle='#e0c776';ctx.fillRect(133,50,54,8);tree(ctx,18,93,s);tree(ctx,300,94,-s)}
  function drawPlains(ctx,s,time){ctx.fillStyle='#7d9a57';ctx.fillRect(0,105,320,35);for(let x=3;x<320;x+=13){ctx.fillStyle=x%26?'#648447':'#a6aa63';ctx.fillRect(x,101+(x%5),1,7)}ctx.fillStyle='#9b9279';ctx.fillRect(135,92,9,16);ctx.fillRect(173,96,6,12);ctx.fillStyle='#c6b47f';ctx.fillRect(245,61,6,44);ctx.fillStyle='#8d7049';ctx.fillRect(237,60,22,4);ctx.save();ctx.translate(248,60);ctx.rotate((time/9000)%6.28);ctx.fillRect(-1,-18,2,36);ctx.fillRect(-18,-1,36,2);ctx.restore();tree(ctx,31,91,s);tree(ctx,64,89,-s);tree(ctx,300,90,s)}
  function drawBellmead(ctx,s,time){ctx.fillStyle='#76915b';ctx.fillRect(0,100,320,40);for(let x=18;x<315;x+=38){tree(ctx,x,96,(x%2?s:-s));ctx.fillStyle='#be9d54';ctx.fillRect(x-7,91,2,2);ctx.fillRect(x+5,87,2,2)}ctx.fillStyle='#cfbea0';ctx.fillRect(126,66,70,40);ctx.fillStyle='#7a503c';ctx.beginPath();ctx.moveTo(119,66);ctx.lineTo(160,46);ctx.lineTo(202,66);ctx.fill();ctx.fillStyle='#8e784f';ctx.fillRect(156,50,8,15);ctx.fillStyle='#dbbf69';ctx.fillRect(151,53,18,5)}
  function drawGrove(ctx,s,time){ctx.fillStyle='#395e42';ctx.fillRect(0,82,320,58);for(let x=8;x<320;x+=27){tree(ctx,x,93,(x%3?s:-s));ctx.fillStyle='#79906a';ctx.fillRect(x+7,105,7,2)}ctx.fillStyle='rgba(196,220,193,.12)';for(let i=0;i<5;i++)ctx.fillRect(((i*71+time/40)%360)-30,66+i*8,48,3)}
  function drawRuin(ctx,s,time){ctx.fillStyle='#73845b';ctx.fillRect(0,104,320,36);ctx.fillStyle='#9c9a83';ctx.fillRect(86,64,20,43);ctx.fillRect(108,78,56,29);ctx.fillRect(180,58,18,49);ctx.fillRect(199,84,38,23);ctx.fillStyle='#6d6c5f';ctx.fillRect(91,71,4,4);ctx.fillRect(116,87,18,3);ctx.fillRect(188,69,4,13);tree(ctx,38,94,s);tree(ctx,285,95,-s)}
  function drawLake(ctx,s,time){ctx.fillStyle='#397f8d';ctx.fillRect(0,86,320,54);ctx.fillStyle='rgba(214,236,224,.3)';for(let i=0;i<8;i++)ctx.fillRect(((i*53+time/28)%360)-35,95+i*5,42,1);ctx.fillStyle='#587449';for(let x=4;x<320;x+=17){ctx.fillRect(x,78,2,22);ctx.fillRect(x+4,82,1,18)}tree(ctx,30,77,s);tree(ctx,292,79,-s)}
  function drawRedbank(ctx,s,time){ctx.fillStyle='#8b604b';ctx.fillRect(0,102,320,38);ctx.fillStyle='#426b45';for(let x=4;x<320;x+=22){ctx.fillRect(x,95+(x%5),2,12);ctx.fillStyle='#a46d8b';ctx.fillRect(x+2,94+(x%7),2,2);ctx.fillStyle='#426b45'}tree(ctx,28,90,s);tree(ctx,68,88,-s);tree(ctx,268,89,s);tree(ctx,304,92,-s)}

  function renderDrawer(){const d=el('vaDrawer');if(!d)return;if(!drawer){d.className='va-drawer';d.innerHTML='';return}d.className='va-drawer open';let title='',body='';
    if(drawer==='map'){title='Map of Canto Plains';body=renderMap()}
    if(drawer==='character'){title='Character';body=renderCharacterPanel()}
    if(drawer==='inventory'){title='Inventory';body=renderInventory()}
    if(drawer==='journal'){title='Quest Journal';body=renderJournal()}
    if(drawer==='relationships'){title='Relationships';body=renderRelationships()}
    if(drawer==='codex'){title='Codex & Fieldcraft';body=renderCodex()}
    if(drawer==='jobs'){title='Job Board';body=renderJobs()}
    if(drawer==='admin'){title='Adventure Debug';body=renderAdmin()}
    d.innerHTML=`<header class="va-drawer-head"><h4>${esc(title)}</h4><button class="va-drawer-close" data-va="close-drawer" type="button">×</button></header><div class="va-drawer-body">${body}</div>`;
  }
  function renderMap(){const current=state.location?.id;return `<div class="va-map">${safeArray(state.map_locations).map(x=>`<button class="va-map-node ${x.id===current?'current ':''}${x.connected?'connected ':''}${!x.discovered?'locked':''}" style="left:${Number(x.map_x)||50}%;top:${Number(x.map_y)||50}%" data-va="map-node" data-location="${esc(x.id)}" ${(!x.discovered||(!x.connected&&x.id!==current))?'disabled':''} type="button">${x.id===current?'◆':'•'}</button><span class="va-map-label" style="left:${Number(x.map_x)||50}%;top:${Number(x.map_y)||50}%">${esc(x.name)}</span>`).join('')}</div><p class="va-resume-summary"><b>Exploration matters now.</b> Unknown paths appear as ??? until found through scouting, quests, rumours or contracts.</p>`}
  function renderCharacterPanel(){const a=state.adventure,stats=state.stats||{};return `<div class="va-review"><div class="va-portrait">${esc(a.name.charAt(0))}</div><dl><div><dt>NAME</dt><dd>${esc(a.name)}</dd></div><div><dt>LEVEL</dt><dd>${Number(a.level)||1}</dd></div><div><dt>HOMELAND</dt><dd>${esc(a.homeland)}</dd></div><div><dt>BACKGROUND</dt><dd>${esc(a.background)}</dd></div><div><dt>ARCHETYPE</dt><dd>${esc(a.archetype)}</dd></div><div><dt>ADVENTURE XP</dt><dd>${Number(a.xp||0).toLocaleString('en-GB')}</dd></div></dl></div><h5>CORE STATS</h5><div class="va-stat-grid">${Object.keys(STAT_LABELS).map(k=>`<div class="va-stat"><small>${esc(STAT_LABELS[k].toUpperCase())}</small><b>${Number(stats[k])||0}</b></div>`).join('')}</div><h5>PROFESSIONS</h5><div class="va-prof-list">${safeArray(state.professions).map(p=>`<div class="va-prof"><b>${esc(PROF_LABELS[p.profession_key]||p.profession_key)}</b><span>LV ${Number(p.level)||1} · ${Number(p.xp||0).toLocaleString('en-GB')} XP</span></div>`).join('')}</div>`}
  function renderInventory(){const items=safeArray(state.inventory);return items.length?`<div class="va-inventory-grid">${items.map(i=>`<div class="va-item"><span class="va-item-icon">${esc(i.icon||'•')}</span><div><h5>${esc(i.name)}</h5><p>${esc(i.description)}</p><div class="va-list-meta"><span class="va-pill">${esc(i.category)}</span><span class="va-pill">${esc(i.rarity)}</span></div></div><strong>×${Number(i.quantity)||1}</strong></div>`).join('')}</div>`:'<div class="va-list-card"><h5>Your satchel is empty.</h5></div>'}
  function phase2QuestAction(x){const loc=state.location?.id;if(x.status==='available'&&loc===x.start_location_id)return `<button class="va-primary" data-va="accept-p2-quest" data-quest="${esc(x.quest_key)}" type="button">ACCEPT QUEST</button>`;if(x.status!=='active')return '';if(x.quest_key==='side_mill_knocks'&&x.stage===1&&loc==='willowmere')return '<button class="va-primary" data-va="p2-quest-action" data-quest="side_mill_knocks" data-action="inspect_mill">INSPECT THE MILL</button>';if(x.quest_key==='side_mill_knocks'&&x.stage===2&&loc==='old_canto_watch')return '<button class="va-primary" data-va="p2-quest-action" data-quest="side_mill_knocks" data-action="search_watch">SEARCH THE RUIN</button>';if(x.quest_key==='side_mill_knocks'&&x.stage===3&&loc==='willowmere')return '<button class="va-primary" data-va="p2-quest-action" data-quest="side_mill_knocks" data-action="report_mara">REPORT TO MARA</button>';if(x.quest_key==='side_bitter_green'&&loc==='willowmere')return '<button class="va-primary" data-va="p2-quest-action" data-quest="side_bitter_green" data-action="turn_in">GIVE ELSIE THE HERBS</button>';if(x.quest_key==='side_quiet_tracks'&&x.stage===2&&loc==='animal_centre_gate')return '<button class="va-primary" data-va="p2-quest-action" data-quest="side_quiet_tracks" data-action="report">REPORT TO DARWIN</button>';return ''}
  function renderJournal(){const quests=safeArray(state.quests);return `<div class="va-journal-tabs"><span>MAIN STORY</span><span>SIDE QUESTS</span><span>COMPLETED</span></div><div class="va-panel-list">${quests.map(x=>{let action='';if(x.phase2)action=phase2QuestAction(x);else if(x.status==='available'&&state.location?.id===x.start_location_id)action=`<button class="va-primary" data-va="accept-quest" data-quest="${esc(x.quest_key)}" type="button">ACCEPT QUEST</button>`;if(!x.phase2&&x.status==='active'&&x.quest_key==='the_little_things_01'&&x.stage===1&&state.location?.id==='willowmere')action='<button class="va-primary" data-va="quest-deliver" type="button">DELIVER PARCEL</button>';return `<article class="va-list-card ${x.is_main_story?'main-story':''}"><h5>${esc(x.title)}</h5><p>${esc(x.description)}</p><div class="va-list-meta"><span class="va-pill">${esc(x.category)}</span><span class="va-pill">${esc(x.difficulty)}</span><span class="va-pill">${esc(x.status)}</span></div>${x.progress?.objective?`<p><b>Objective:</b> ${esc(x.progress.objective)}</p>`:''}${x.progress?.outcome?`<p><b>Outcome:</b> ${esc(x.progress.outcome)}</p>`:''}${action?`<div class="va-list-actions">${action}</div>`:''}</article>`}).join('')}</div>`}
  function relationshipLabel(v){v=Number(v)||0;return v>=60?'Trusted Ally':v>=25?'Friend':v>=8?'Acquaintance':v<=-60?'Enemy':v<=-25?'Rival':v<=-8?'Wary':'Stranger'}
  function renderRelationships(){const rs=safeArray(state.relationships);return rs.length?`<p class="va-resume-summary">Important people remember meaningful interactions. Values run from -100 to +100, but the labels matter more than the numbers.</p><div class="va-panel-list">${rs.map(r=>`<article class="va-person-card"><span class="va-person-portrait">${esc(r.portrait_icon||r.name.charAt(0))}</span><div><h5>${esc(r.name)}</h5><small>${esc(r.occupation)} · ${esc(relationshipLabel(r.relationship))}</small><div class="va-relation-bars"><span>REL ${Number(r.relationship)||0}</span><span>TRUST ${Number(r.trust)||0}</span><span>RESPECT ${Number(r.respect)||0}</span><span>MEMORIES ${Number(r.memories)||0}</span></div></div></article>`).join('')}</div>`:'<div class="va-list-card"><h5>You have not met anyone important yet.</h5></div>'}
  function renderCodex(){const herbs=safeArray(state.local_herbs),discoveries=safeArray(state.discoveries),recipes=safeArray(state.recipes);return `<section class="va-codex-section"><h5>LOCAL HERBALISM</h5>${herbs.length?herbs.map(h=>`<article class="va-field-card"><span class="va-field-icon">${esc(h.icon||'✦')}</span><div><b>${esc(h.name)}</b><p>${esc(h.description)}</p><small>${esc(h.rarity)}${h.cooldown_minutes?` · regrows in ${Number(h.cooldown_minutes)}m`:''}</small></div><div>${h.identified?`<button data-va="gather-herb" data-herb="${esc(h.herb_key)}" data-method="${esc(h.harvest_method)}" ${h.cooldown_minutes?'disabled':''} type="button">${h.cooldown_minutes?'REGROWING':esc(String(h.harvest_method).toUpperCase())}</button>`:`<button data-va="inspect-herb" data-herb="${esc(h.herb_key)}" type="button">IDENTIFY</button>`}</div></article>`).join(''):'<p class="va-muted">No harvestable plants stand out here.</p>'}</section><section class="va-codex-section"><h5>BREWING</h5>${recipes.map(r=>`<article class="va-list-card"><h5>${esc(r.name)}</h5><p>${esc(r.description)}</p><div class="va-list-actions"><button data-va="brew" data-recipe="${esc(r.recipe_key)}" ${(!r.unlocked||state.location?.id!=='willowmere')?'disabled':''} type="button">${r.unlocked?(state.location?.id==='willowmere'?'BREW AT ELSIE’S BENCH':'BREW IN WILLOWMERE'):'RECIPE UNKNOWN'}</button></div></article>`).join('')}</section><section class="va-codex-section"><h5>DISCOVERIES</h5><div class="va-discovery-grid">${discoveries.slice(0,40).map(d=>`<div><small>${esc(String(d.discovery_type).toUpperCase())}</small><b>${esc(d.name)}</b></div>`).join('')}</div></section>`}
  function renderJobs(){const atBoard=state.location?.id==='canto_crossing',jobs=safeArray(state.jobs);return `<p class="va-resume-summary"><b>Canto Crossing Job Board</b><br>Six rotating contracts now connect courier work, exploration, herbalism and animal handling. Special requirements are validated by the server.</p><div class="va-panel-list">${jobs.map(j=>{let action='';if(j.status==='available')action=`<button class="va-primary" data-va="${j.phase2?'accept-p2-job':'accept-job'}" data-job="${esc(j.id)}" ${atBoard?'':'disabled'} type="button">${atBoard?'ACCEPT CONTRACT':'RETURN TO CANTO BOARD'}</button>`;if(j.status==='active'&&state.location?.id===j.destination_location_id)action=`<button class="va-primary" data-va="${j.phase2?'complete-p2-job':'complete-job'}" data-job="${esc(j.id)}" type="button">COMPLETE CONTRACT</button>`;return `<article class="va-list-card"><h5>${esc(j.title)}</h5><p>${esc(j.description)}</p><div class="va-list-meta"><span class="va-pill">${esc(PROF_LABELS[j.profession_key]||j.profession_key)}</span><span class="va-pill">${esc(j.difficulty)}</span><span class="va-pill">${esc(j.status)}</span></div><p><b>Destination:</b> ${esc(j.destination_name)} · <b>Rewards:</b> ${Number(j.reward_gold)} gold · ${Number(j.reward_adventure_xp)} Adventure XP · ${Number(j.reward_profession_xp)} ${esc(PROF_LABELS[j.profession_key]||j.profession_key)} XP</p>${action?`<div class="va-list-actions">${action}</div>`:''}</article>`}).join('')}</div>`}
  function renderAdmin(){if(!state.admin)return '<p>Admin only.</p>';const a=state.adventure;return `<div class="va-admin-note">SERVER-VALIDATED TEST PANEL · affects only your Adventures save. Other site systems are untouched.</div><div class="va-admin"><div class="va-admin-row"><label>Adventure XP<input id="vaAdminXp" type="number" min="0" max="13034431" value="${Number(a.xp)||0}"></label><label>Gold<input id="vaAdminGold" type="number" min="0" max="1000000000" value="${Number(a.gold)||0}"></label></div><div class="va-admin-row"><label>World day<input id="vaAdminDay" type="number" min="1" max="9999" value="${Number(a.world_day)||1}"></label><label>Minute of day<input id="vaAdminMinute" type="number" min="0" max="1439" value="${Number(a.world_minute)||480}"></label></div><div class="va-admin-row"><label>Location<select id="vaAdminLocation">${safeArray(state.map_locations).filter(x=>x.discovered).map(x=>`<option value="${esc(x.id)}" ${x.id===a.location_id?'selected':''}>${esc(x.real_name||x.name)}</option>`).join('')}</select></label><label>Weather<select id="vaAdminWeather">${['clear','cloudy','rain','mist','storm','snow','heat'].map(x=>`<option ${x===a.weather?'selected':''}>${x}</option>`).join('')}</select></label></div><button class="va-primary" data-va="admin-apply" type="button">APPLY DEBUG STATE</button></div>`}

  function mainQuest(){const ms=safeArray(state?.quests).filter(x=>x.is_main_story);return ms.find(x=>x.status==='active')||ms.find(x=>x.quest_key==='the_little_things_02'&&x.status==='available')||ms.find(x=>x.status==='available')||ms.slice().reverse().find(x=>x.status==='completed')}
  function objectiveTitle(){const q=mainQuest();if(q?.status==='active')return q.title;const job=safeArray(state?.jobs).find(j=>j.status==='active');if(job)return job.title;return q?.status==='available'?'The Little Things':'No objective tracked'}
  function objectiveText(){const q=mainQuest();if(q?.status==='active'&&q.progress?.objective)return q.progress.objective;if(q?.quest_key==='the_little_things_02'&&q.status==='available')return 'The brass token is still unexplained. Nell Bristlebell may recognise the mark.';if(q?.status==='available')return 'Check the Canto Crossing notice board. A courier has a small job that needs doing.';const job=safeArray(state?.jobs).find(j=>j.status==='active');if(job)return `Reach ${job.destination_name} and complete the contract.`;return 'Talk to people, work a contract, track wildlife, gather plants or scout beyond known roads.'}

  async function onClick(e){const target=e.target.closest('[data-va]');if(!target)return;const action=target.dataset.va;playClick();try{
    if(action==='dialogue-close'){target.closest('.va-dialogue-overlay')?.remove();activeConversation=null;return}
    if(action==='retry'){renderLoading('Reloading…');state=await loadFullState();view='entry';render();return}
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
    if(action==='create-submit'){renderLoading('Creating your persistent Adventure…');const base=await callRpc('adventure_create_character',{p_name:creation.name,p_homeland:creation.homeland,p_background:creation.background,p_archetype:creation.archetype});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});state=mergePhase2(base,p2);view='game';lastNarrative=state.adventure.last_summary;render();saved();return}
    if(action==='open-drawer'){drawer=target.dataset.drawer;renderDrawer();return}
    if(action==='close-drawer'){drawer=null;renderDrawer();return}
    if(action==='map-node'){const id=target.dataset.location;if(id&&id!==state.location.id)await travel(id);return}
    if(action==='scene-action'){await sceneAction(target.dataset.action);return}
    if(action==='drawer-jobs'){drawer='jobs';renderDrawer();return}
    if(action==='accept-quest'){await acceptQuest(target.dataset.quest);return}
    if(action==='quest-deliver'||action==='deliver-main'){await deliverMain();return}
    if(action==='accept-job'){await acceptJob(target.dataset.job);return}
    if(action==='complete-job'){await completeJob(target.dataset.job);return}
    if(action==='accept-p2-job'){await acceptP2Job(target.dataset.job);return}
    if(action==='complete-p2-job'){await completeP2Job(target.dataset.job);return}
    if(action==='accept-p2-quest'){await acceptP2Quest(target.dataset.quest);return}
    if(action==='p2-quest-action'){await p2QuestAction(target.dataset.quest,target.dataset.action);return}
    if(action==='talk-npc'){await talkNpc(target.dataset.npc,target.dataset.topic||'hello');return}
    if(action==='talk-topic'){await talkNpc(target.dataset.npc,target.dataset.topic);return}
    if(action==='inspect-herb'){await inspectHerb(target.dataset.herb);return}
    if(action==='gather-herb'){await gatherHerb(target.dataset.herb,target.dataset.method);return}
    if(action==='brew'){await brew(target.dataset.recipe);return}
    if(action==='wildlife-act'){await wildlifeAction(target.dataset.action);return}
    if(action==='custom-submit'){await customAction();return}
    if(action==='admin-apply'){await adminApply();return}
  }catch(err){console.error('[Velmora Adventures]',err);notify(err?.message||'Adventure action failed.');if(view==='game')render()}}
  function onInput(e){if(e.target.id==='vaCreateName')creation.name=e.target.value;if(e.target.id==='vaResetConfirm'){const b=q('[data-va="confirm-reset"]');if(b)b.disabled=e.target.value!=='RESET'}}

  async function travel(id){lastNarrative='You set out along the Canto roads…';renderLoading('Travelling…');const res=await callRpc('adventure_phase2_travel',{p_location_id:id});takePhase2Result(res);view='game';lastNarrative=state.adventure.last_summary;render();saved()}
  async function acceptQuest(key){const base=await callRpc('adventure_accept_quest',{p_quest_key:key});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});state=mergePhase2(base,p2);lastNarrative='A courier presses a green-corded parcel into your hands. “Willowmere. Straight there, ideally.”';render();saved()}
  async function deliverMain(){const base=await callRpc('adventure_quest_action',{p_quest_key:'the_little_things_01',p_action:'deliver'});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});state=mergePhase2(base,p2);lastNarrative='The recipient turns the parcel over, then pauses. A thin brass token has been trapped beneath the cord. Three tiny prongs are stamped into one side. “That is not mine,” they say.';render();saved()}
  async function acceptJob(id){const base=await callRpc('adventure_accept_job',{p_job_id:id});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});state=mergePhase2(base,p2);lastNarrative=state.adventure.last_summary;render();drawer='jobs';renderDrawer();saved()}
  async function completeJob(id){const base=await callRpc('adventure_complete_job',{p_job_id:id});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});state=mergePhase2(base,p2);lastNarrative=state.adventure.last_summary;render();drawer='jobs';renderDrawer();saved()}
  async function acceptP2Job(id){const res=await callRpc('adventure_phase2_accept_job',{p_job_id:id});takePhase2Result(res);lastNarrative='The clerk marks the contract active and points out the route on a battered local map.';render();drawer='jobs';renderDrawer();saved()}
  async function completeP2Job(id){const res=await callRpc('adventure_phase2_complete_job',{p_job_id:id});takePhase2Result(res);lastNarrative=state.adventure.last_summary;render();drawer='jobs';renderDrawer();saved()}
  async function acceptP2Quest(key){const res=await callRpc('adventure_phase2_accept_quest',{p_quest_key:key});takePhase2Result(res);lastNarrative=state.adventure.last_summary;render();saved()}
  async function p2QuestAction(key,action){const res=await callRpc('adventure_phase2_quest_action',{p_quest_key:key,p_action:action});takePhase2Result(res);lastNarrative=res.message||state.adventure.last_summary;render();saved()}
  async function talkNpc(key,topic='hello'){const res=await callRpc('adventure_phase2_talk',{p_npc_key:key,p_topic:topic});takePhase2Result(res);activeConversation={npc:res.npc,topics:res.topics||{},dialogue:res.dialogue||''};lastNarrative=`${res.npc?.name||'Someone'}: “${res.dialogue||''}”`;render();showConversation(activeConversation);saved()}
  function showConversation(c){if(!c?.npc)return;const overlay=document.createElement('div');overlay.className='va-dialogue-overlay';overlay.innerHTML=`<div class="va-dialogue-card"><div class="va-dialogue-portrait">${esc(c.npc.portrait_icon||c.npc.name.charAt(0))}</div><div class="va-dialogue-copy"><small>${esc(c.npc.occupation)}</small><h4>${esc(c.npc.name)}</h4><p>“${esc(c.dialogue)}”</p><div class="va-dialogue-topics">${Object.keys(c.topics||{}).slice(0,5).map(t=>`<button data-va="talk-topic" data-npc="${esc(c.npc.npc_key)}" data-topic="${esc(t)}" type="button">${esc(t.toUpperCase())}</button>`).join('')}<button data-va="dialogue-close" type="button">LEAVE</button></div></div></div>`;el('vaStage').appendChild(overlay)}
  async function inspectHerb(key){const res=await callRpc('adventure_phase2_inspect_herb',{p_herb_key:key});takePhase2Result(res);lastNarrative=res.message;render();drawer='codex';renderDrawer();saved()}
  async function gatherHerb(key,method){const res=await callRpc('adventure_phase2_gather_herb',{p_herb_key:key,p_method:method});takePhase2Result(res);lastNarrative=res.message;render();drawer='codex';renderDrawer();saved()}
  async function brew(key){const res=await callRpc('adventure_phase2_brew',{p_recipe_key:key});takePhase2Result(res);lastNarrative=res.message;render();drawer='codex';renderDrawer();saved()}
  async function wildlifeSearch(){const res=await callRpc('adventure_phase2_wildlife_search');takePhase2Result(res);lastNarrative=res.message;render();saved()}
  async function wildlifeAction(action){const res=await callRpc('adventure_phase2_wildlife_action',{p_action:action});takePhase2Result(res);lastNarrative=res.message;render();saved()}
  async function scout(){const res=await callRpc('adventure_phase2_scout');takePhase2Result(res);lastNarrative=res.message;render();saved()}

  async function sceneAction(key){if(!key)return;if(key.startsWith('travel:'))return travel(key.split(':')[1]);if(key==='accept-main')return acceptQuest('the_little_things_01');if(key==='deliver-main')return deliverMain();if(key.startsWith('accept-p2:'))return acceptP2Quest(key.split(':')[1]);if(key.startsWith('quest-p2:')){const [,q,a]=key.split(':');return p2QuestAction(q,a)}if(key==='wildlife-search')return wildlifeSearch();if(key==='scout')return scout();if(key==='open-codex-herbs'){drawer='codex';renderDrawer();return}if(key==='drawer-jobs'){drawer='jobs';renderDrawer();return}if(key==='finish-job'){const j=safeArray(state.jobs).find(x=>x.status==='active'&&x.destination_location_id===state.location.id);if(j)return j.phase2?completeP2Job(j.id):completeJob(j.id)}if(key==='check-perception')return doCheck('perception',12,checkContext());if(key==='check-survival')return doCheck('survival',11,checkContext())}

  function checkContext(){const id=state.location?.id;return id==='canto_crossing'?'old clock markings':id==='willowmere'?'mill wheel':id==='riverglass_ford'?'crossing stones':id==='animal_centre_gate'?'keeper notices':'meadow survey'}
  async function doCheck(stat,dc,context){const r=await callRpc('adventure_roll_check',{p_stat:stat,p_dc:dc,p_context:context});showDice(r,context)}
  function showDice(r,context){const degree=String(r.degree||'failure');const nice=degree.replaceAll('_',' ').toUpperCase();const outcomes={critical_success:'You catch a detail that would have been easy to miss.',success:'You notice enough to form a useful impression.',failure:'Nothing certain separates itself from the ordinary details.',critical_failure:'You become very confident about something that is probably irrelevant.'};const overlay=document.createElement('div');overlay.className='va-dice-overlay';overlay.innerHTML=`<div class="va-dice-card"><small>${esc(String(r.stat).toUpperCase())} CHECK · ${esc(context)}</small><div class="va-die">${Number(r.roll)||1}</div><h4>${Number(r.roll)||0} + ${Number(r.modifier)||0} = ${Number(r.total)||0}</h4><div class="va-dice-total">DC ${Number(r.dc)||0}</div><span class="va-degree ${esc(degree)}">${esc(nice)}</span><p>${esc(outcomes[degree]||outcomes.failure)}</p><button class="va-primary" data-va="dice-close" type="button">CONTINUE</button></div>`;el('vaStage').appendChild(overlay);overlay.querySelector('[data-va="dice-close"]').addEventListener('click',()=>{playClick();lastNarrative=outcomes[degree]||outcomes.failure;overlay.remove();const n=el('vaNarrative');if(n)n.textContent=lastNarrative;saved()},{once:true})}

  async function customAction(){const input=el('vaCustomInput'),raw=(input?.value||'').trim();if(!raw)return;input.value='';const s=raw.toLowerCase();
    if(/\b(inventory|bag|satchel)\b/.test(s)){drawer='inventory';renderDrawer();return}
    if(/\b(map|where am i|travel options)\b/.test(s)){drawer='map';renderDrawer();return}
    if(/\b(journal|quest)\b/.test(s)&&!s.includes('accept')){drawer='journal';renderDrawer();return}
    if(/\b(job|contract|notice board|job board)\b/.test(s)){drawer='jobs';renderDrawer();return}
    if(/\b(character|stats|skills)\b/.test(s)){drawer='character';renderDrawer();return}
    if(/relationship|friend|trust|people i know/.test(s)){drawer='relationships';renderDrawer();return}
    if(/codex|herb|plant|recipe|brew/.test(s)&&!/gather|pick|cut|harvest/.test(s)){drawer='codex';renderDrawer();return}
    if(/wildlife|animal|tracks/.test(s)&&/search|find|look|track/.test(s))return wildlifeSearch();
    if(/scout|find.*route|explore.*road|unknown path/.test(s))return scout();
    const npc=safeArray(state.nearby_npcs).find(n=>s.includes(String(n.name).toLowerCase()));if(npc&&/talk|ask|speak|say|tell/.test(s))return talkNpc(npc.npc_key,s.includes('rumour')?'rumours':s.includes('work')?'work':'hello');
    if(/deliver|hand over|give.*parcel/.test(s)&&mainQuest()?.status==='active'&&state.location?.id==='willowmere')return deliverMain();
    const ready=safeArray(state.jobs).find(j=>j.status==='active'&&j.destination_location_id===state.location?.id);if(ready&&/deliver|hand over|finish|complete/.test(s))return ready.phase2?completeP2Job(ready.id):completeJob(ready.id);
    if(mainQuest()?.quest_key==='the_little_things_01'&&mainQuest()?.status==='available'&&state.location?.id==='canto_crossing'&&/parcel|courier.*job|accept.*quest/.test(s))return acceptQuest('the_little_things_01');
    const locations=safeArray(state.map_locations).filter(x=>x.connected&&x.discovered&&x.id!==state.location?.id);const wanted=locations.find(x=>s.includes(String(x.real_name||x.name).toLowerCase())||s.includes(x.id.replaceAll('_',' ')));if(wanted&&/go|walk|travel|head|leave|make.*way/.test(s))return travel(wanted.id);
    if(/look|inspect|search|study|listen|survey|examine/.test(s))return doCheck(/track|path|stone|weather|plant/.test(s)?'survival':'perception',12,'free action observation');
    const out=await AdventureNarrator.narrate({action:raw,player:state.adventure,location:state.location,quest:mainQuest(),recentActions:safeArray(state.recent_actions).slice(0,4)});lastNarrative=out.narration;const n=el('vaNarrative');if(n)n.textContent=lastNarrative;
  }

  async function adminApply(){if(!state.admin)return;const patch={xp:Number(el('vaAdminXp')?.value||0),gold:Number(el('vaAdminGold')?.value||0),world_day:Number(el('vaAdminDay')?.value||1),world_minute:Number(el('vaAdminMinute')?.value||480),location_id:el('vaAdminLocation')?.value,weather:el('vaAdminWeather')?.value};const base=await callRpc('adventure_admin_patch_self',{p_patch:patch});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});state=mergePhase2(base,p2);lastNarrative='Admin test state applied.';render();drawer='admin';renderDrawer();saved()}

  function saved(){clearTimeout(saveToastTimer);const s=el('vaSaved');if(!s)return;s.classList.add('show');saveToastTimer=setTimeout(()=>s.classList.remove('show'),1200)}
  function formatWorldTime(min){min=clamp(Number(min)||0,0,1439);return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`}
  function formatPlay(sec){sec=Math.max(0,Number(sec)||0);const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);return h?`${h}h ${m}m`:`${m}m`}
  function formatLastPlayed(value){const t=Date.parse(value||'');if(!Number.isFinite(t))return 'Recently';const diff=Math.max(0,Date.now()-t),m=Math.floor(diff/60000);if(m<1)return 'Just now';if(m<60)return `${m}m ago`;const h=Math.floor(m/60);if(h<24)return `${h}h ago`;return `${Math.floor(h/24)}d ago`}
  function xpForAdventureLevel(level){if(typeof xpForLevel==='function')return Number(xpForLevel(level))||0;let p=0;for(let i=1;i<level;i++)p+=Math.floor(i+300*Math.pow(2,i/7));return Math.floor(p/4)}

  // Re-sync launcher state after login/logout without patching the site's auth system.
  window.addEventListener('repo-character-changed',()=>{if(el(DIALOG_ID)?.open){view='entry';open().catch(()=>{})}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});else inject();
  window.VelmoraAdventures={version:VERSION,open,close,getState:()=>state,refresh:async()=>{state=await loadFullState();render();return state},narrator:AdventureNarrator};
})();
