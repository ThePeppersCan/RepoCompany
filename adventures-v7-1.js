/* VELMORA ADVENTURES — Phase 7
   People, companions and consequences are persistent server-owned Adventure state. */
(()=>{
  'use strict';
  const VERSION='7.0.0-phase7';
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

const PHASE3_ACTIONS=new Set(['observe','talk','ask','tell','travel','investigate','manipulate','use_item','give_item','threaten','persuade','deceive','sneak','climb','wait','forage','track','help','steal','buy','sell','attack','flee','follow','rest','search','custom']);
const PHASE3_TARGETS=new Set(['npc','feature','event','item','location','creature','environment','self']);
const COMMAND_PLACEHOLDERS=['Ask Nell about the token…','Look beneath the bridge…','Wait until evening…','Show Orla the rubbing…','Climb onto the mill roof…','Follow the muddy tracks…','Listen behind the old wall…'];
const PHASE3_ADMIN_EVENTS={
  canto_crossing:['merchant_cart_breakdown','lost_courier_satchel','market_argument','travelling_scholar'],
  willowmere:['storm_footbridge'],riverglass_ford:['storm_footbridge','lost_courier_satchel','unusual_river_object'],
  animal_centre_gate:['missing_goat'],canto_plains_verge:['merchant_cart_breakdown','missing_goat','lost_courier_satchel'],
  bellmead:['merchant_cart_breakdown','travelling_scholar','orchard_festival'],whisperbank_grove:['rare_wildlife_sighting','watch_strange_lights'],
  old_canto_watch:['travelling_scholar','watch_strange_lights'],lake_eira:['rare_wildlife_sighting','unusual_river_object'],redbank_hollow:['missing_goat','rare_wildlife_sighting']
};

const HOMELAND_ICONS={Vardesh:'❄',Lumerre:'✦',Kordesh:'⚒',Nambara:'☼',Norveth:'▲',Zafran:'✧',Elvane:'❀',Qasmir:'☽',Calvora:'✺',Rovarn:'⚑',Talune:'≈',Drazhen:'⛓',Belros:'♜',Marovar:'⚓',Sorevia:'❈',Iskandar:'◈'};
const BACKGROUND_ICONS={'Apprentice Explorer':'🧭','Animal Keeper':'🦊','Travelling Merchant':'🜚','Fisher':'🐟','Cook':'🍲','Hunter':'🏹','Scholar':'📜','Courier':'✉','Street Rogue':'🗝','Craftsman':'🛠','Investigator':'🔍','Ruin Hunter':'🏛','Former Repo Sports Prospect':'🏆','Farmhand':'🌾','Sailor':'⛵','Miner':'⛏','Herbalist':'🌿','Nobody Particularly Important':'•'};
const ARCHETYPE_ICONS={Warrior:'⚔',Ranger:'🏹',Rogue:'🗡',Mage:'✧',Alchemist:'⚗',Bard:'♫',Guardian:'🛡',Beastkeeper:'🐾',Investigator:'🔎'};

  let state=null,phase2={},phase3={},phase4={},phase5={},phase6={},phase7={},phase5Shops=[],view='entry',drawer=null,busy=false,sceneFrame=0,heartbeat=0,saveToastTimer=0,lastNarrative='',activeConversation=null,lastNpcKey=null,narrativeTimer=0,lastRenderedNarrative='',uiFxQueue=[],fxActive=false,processingState=null,transitionTimer=0,placeholderTimer=0,placeholderIndex=0,dynamicSuggestions=[],commandHistory=[],commandIndex=-1,pendingAmbiguityRaw='',lastPhase3Debug=null,mapRegionKey=null;
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
    async interpret(context){
      if(this.provider&&typeof this.provider.interpret==='function'){
        try{const out=await this.provider.interpret(context);const normal=normaliseIntent(out?.intent||out,context?.rawText||'');if(normal)return {intent:normal,source:'provider'}}catch(err){console.warn('[Adventures] narrator interpreter fell back safely',err)}
      }
      return localInterpret(context?.rawText||'',context?.forcedNpcKey||null);
    },
    async narrate(context){
      if(this.provider&&typeof this.provider.narrate==='function'){
        try{const out=await this.provider.narrate(context);if(out&&typeof out.narration==='string'&&out.narration.length<=900)return {narration:out.narration,dialogue:Array.isArray(out.dialogue)?out.dialogue:[],suggestedActions:Array.isArray(out.suggestedActions)?out.suggestedActions:[]}}catch(err){console.warn('[Adventures] narrator presentation fell back safely',err)}
      }
      return {narration:context?.authoritative?.message||fallbackNarration(context),dialogue:[],suggestedActions:[]};
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
  function mergePhase23(base,p23={}){if(!base?.exists)return base;return {...base,...(p23||{})}}
  function mergePhase3(base,p3={}){
    if(!base?.exists){phase3={};return base}
    phase3=p3||{};
    return {...base,phase3,
      phase3_features:safeArray(p3.features),clues:safeArray(p3.clues),rumours:safeArray(p3.rumours),active_events:safeArray(p3.active_events),dynamic_quests:safeArray(p3.dynamic_quests),
      reputations:safeArray(p3.reputations),npc_moods:safeArray(p3.npc_moods),recent_dynamic_actions:safeArray(p3.recent_dynamic_actions),session_recap:safeArray(p3.session_recap),phase3_debug:p3.debug||null};
  }

function mergePhase4(base,p4={}){
  if(!base?.exists){phase4={};return base}
  phase4=p4||{};
  const worlds=safeArray(p4.world_locations);
  return {...base,phase4,world_regions:safeArray(p4.regions),world_locations:worlds.length?worlds:safeArray(base.map_locations),current_region_key:p4.current_region_key||'canto_plains',world_summary:p4.world_summary||{}};
}
function mergePhase5(base,p5={}){
  if(!base?.exists){phase5={};return base}
  phase5=p5||{};
  return {...base,phase5,
    danger:p5.danger||{danger_tier:'safe',encounter_rate:0,warning:''},danger_map:safeArray(p5.danger_map),combat_abilities:safeArray(p5.abilities),equipment_detail:safeArray(p5.equipment_detail),
    active_combat:p5.active_combat||null,expedition:p5.expedition||null,available_expeditions:safeArray(p5.available_expeditions),combat_log_recent:safeArray(p5.combat_log_recent),shop:p5.shop||null};
}

function mergePhase6(base,p6={}){
  if(!base?.exists){phase6={};return base}
  phase6=p6||{};
  return {...base,phase6,current_home:p6.current_home||null,properties:safeArray(p6.properties),home_storage:safeArray(p6.home_storage),home_storage_used:Number(p6.home_storage_used)||0,home_storage_capacity:Number(p6.home_storage_capacity)||0,home_displays:safeArray(p6.home_displays),home_display_capacity:Number(p6.home_display_capacity)||0,home_decor:safeArray(p6.home_decor),decor_offers:safeArray(p6.decor_offers),transport_routes:safeArray(p6.transport_routes),town_shops:safeArray(p6.town_shops),work_shifts:safeArray(p6.work_shifts),crafting_recipes:safeArray(p6.crafting_recipes),letters:safeArray(p6.letters),unread_letters:Number(p6.unread_letters)||0,adventure_titles:safeArray(p6.titles),collections:safeArray(p6.collections),regional_progress:safeArray(p6.regional_progress),transactions:safeArray(p6.transactions),town_services:p6.town_services||{}};
}


function mergePhase7(base,p7={}){
  if(!base?.exists){phase7={};return base}
  phase7=p7||{};
  return {...base,phase7,
    people:safeArray(p7.people),companion:p7.companion||null,companion_candidates:safeArray(p7.companion_candidates),social_promises:safeArray(p7.promises),social_invitations:safeArray(p7.invitations),social_favours:safeArray(p7.favours),social_scenes:safeArray(p7.social_scenes),social_stories:safeArray(p7.stories),social_secrets:safeArray(p7.secrets),npc_links:safeArray(p7.npc_links),world_changes:safeArray(p7.world_changes),phase7_debug:p7.debug||null};
}

async function loadFullState(opts={}){
  const base=await callRpc('adventure_get_state',{},opts);
  if(!base?.exists){phase2={};phase3={};phase4={};phase5={};phase6={};phase7={};phase5Shops=[];return base}
  const p2=await callRpc('adventure_phase2_get_state',{}, {...opts,silent:true});
  const merged=mergePhase2(base,p2);
  const p23=await callRpc('adventure_phase23_get_state',{}, {...opts,silent:true});
  const merged23=mergePhase23(merged,p23);
  const p3=await callRpc('adventure_phase3_get_state',{}, {...opts,silent:true});
  const merged3=mergePhase3(merged23,p3);
  const p4=await callRpc('adventure_phase4_get_state',{}, {...opts,silent:true});
  const merged4=mergePhase4(merged3,p4);
  const p5=await callRpc('adventure_phase5_get_state',{}, {...opts,silent:true});
  try{phase5Shops=safeArray(await callRpc('adventure_phase5_get_shops',{}, {...opts,silent:true}))}catch(_){phase5Shops=p5?.shop?[p5.shop]:[]}
  const merged5=mergePhase5(merged4,p5);
  const p6=await callRpc('adventure_phase6_get_state',{}, {...opts,silent:true});
  const merged6=mergePhase6(merged5,p6);
  const p7=await callRpc('adventure_phase7_get_state',{}, {...opts,silent:true});
  return mergePhase7(merged6,p7);
}

function takePhase2Result(res){
  if(res?.base){
    const existing23={local_activities:state?.local_activities||[],activity_mastered_count:Number(state?.activity_mastered_count)||0,activity_total_count:Number(state?.activity_total_count)||0};
    const existing3=state?.phase3||phase3||{};
    const existing4=state?.phase4||phase4||{};
    const existing5=state?.phase5||phase5||{};
    const existing6=state?.phase6||phase6||{};
    const existing7=state?.phase7||phase7||{};
    state=mergePhase7(mergePhase6(mergePhase5(mergePhase4(mergePhase3(mergePhase23(mergePhase2(res.base,res.phase2||{}),res.phase23||existing23),res.phase3||existing3),res.phase4||existing4),res.phase5||existing5),res.phase6||existing6),res.phase7||existing7);return res;
  }
  return res;
}
function takePhase5Result(res){return takePhase2Result(res)}
async function refreshPhase23(){if(!state?.exists)return state;const p23=await callRpc('adventure_phase23_get_state',{}, {silent:true});state=mergePhase23(state,p23);return state}
async function refreshPhase3(){if(!state?.exists)return state;const p3=await callRpc('adventure_phase3_get_state',{}, {silent:true});state=mergePhase3(state,p3);return state}
async function refreshPhase4(){if(!state?.exists)return state;const p4=await callRpc('adventure_phase4_get_state',{}, {silent:true});state=mergePhase4(state,p4);return state}
async function refreshPhase5(){if(!state?.exists)return state;const p5=await callRpc('adventure_phase5_get_state',{}, {silent:true});state=mergePhase5(state,p5);try{phase5Shops=safeArray(await callRpc('adventure_phase5_get_shops',{}, {silent:true}))}catch(_){phase5Shops=p5?.shop?[p5.shop]:[]}return state}
async function refreshPhase6(){if(!state?.exists)return state;const p6=await callRpc('adventure_phase6_get_state',{}, {silent:true});state=mergePhase6(state,p6);return state}
async function refreshPhase7(){if(!state?.exists)return state;const p7=await callRpc('adventure_phase7_get_state',{}, {silent:true});state=mergePhase7(state,p7);return state}
function takePhase6Result(res){if(res?.base){const existing23={local_activities:state?.local_activities||[],activity_mastered_count:Number(state?.activity_mastered_count)||0,activity_total_count:Number(state?.activity_total_count)||0};state=mergePhase7(mergePhase6(mergePhase5(mergePhase4(mergePhase3(mergePhase23(mergePhase2(res.base,phase2||{}),existing23),phase3||{}),phase4||{}),phase5||{}),res.phase6||phase6||{}),res.phase7||phase7||{});return res}if(res?.phase6){state=mergePhase6(state,res.phase6);if(res.phase7)state=mergePhase7(state,res.phase7);return res}return res}
function takePhase7Result(res){if(res?.base)takePhase2Result(res);if(res?.phase7)state=mergePhase7(state,res.phase7);return res}
async function refreshAllAdventure(){state=await loadFullState({silent:true});mapRegionKey=state?.current_region_key||mapRegionKey;return state}
async function refreshFull(){state=await loadFullState();return state}



function currentReputation(){const r=safeArray(state?.reputations).find(x=>x.location_id===state?.location?.id);return r||{score:0,label:'Unknown',location_name:state?.location?.name||''}}
function moodForNpc(key){return safeArray(state?.npc_moods).find(x=>x.npc_key===key)?.mood||'calm'}
function buildContextPack(){
  return {
    player:{stats:state?.stats||{},archetype:state?.adventure?.archetype,background:state?.adventure?.background,homeland:state?.adventure?.homeland,hp:state?.adventure?.hp,professions:safeArray(state?.professions).map(p=>({key:p.profession_key,level:p.level})),inventory:safeArray(state?.inventory).slice(0,20).map(i=>({key:i.item_key,name:i.name,category:i.category,tags:i.tags,quantity:i.quantity}))},
    location:{id:state?.location?.id,name:state?.location?.name,time:state?.adventure?.world_minute,day:state?.adventure?.world_day,weather:state?.adventure?.weather,features:safeArray(state?.phase3_features).slice(0,12),activities:safeArray(state?.local_activities).slice(0,8),nearbyNpcs:safeArray(state?.nearby_npcs).slice(0,8).map(n=>({npc_key:n.npc_key,name:n.name,occupation:n.occupation,mood:moodForNpc(n.npc_key)})),events:safeArray(state?.active_events).slice(0,4)},
    story:{quests:safeArray(state?.quests).filter(x=>x.status==='active').slice(0,6).map(q=>({key:q.quest_key,title:q.title,stage:q.stage,objective:q.progress?.objective})),clues:safeArray(state?.clues).slice(0,10),rumours:safeArray(state?.rumours).slice(0,8),recentActions:safeArray(state?.recent_dynamic_actions).slice(0,8)},
    social:{people:safeArray(state?.people).filter(p=>p.here_now||p.npc_key===state?.companion?.npc_key).slice(0,8).map(p=>({npc_key:p.npc_key,name:p.name,label:p.label,mood:p.current_mood,memories:safeArray(p.memories).slice(0,3).map(m=>m.summary)})),companion:state?.companion?{npc_key:state.companion.npc_key,name:state.companion.name,role:state.companion.role_text}:null,promises:safeArray(state?.social_promises).filter(p=>p.status==='active').slice(0,5).map(p=>({npc_key:p.npc_key,description:p.description,deadline_stamp:p.deadline_stamp})),invitations:safeArray(state?.social_invitations).filter(i=>i.status==='active').slice(0,4).map(i=>({npc_key:i.npc_key,title:i.title,location:i.location_name,starts_stamp:i.starts_stamp}))}
  };
}
function normaliseIntent(raw,rawText=''){
  if(!raw||typeof raw!=='object')return null;
  const actionType=String(raw.actionType||'custom').toLowerCase(),targetType=String(raw.targetType||'environment').toLowerCase();
  if(!PHASE3_ACTIONS.has(actionType)||!PHASE3_TARGETS.has(targetType))return null;
  return {actionType,targetType,targetKey:String(raw.targetKey||'').slice(0,120),secondaryTarget:String(raw.secondaryTarget||'').slice(0,160),method:String(raw.method||'').slice(0,120),intendedOutcome:String(raw.intendedOutcome||rawText||'').slice(0,240),rawText:String(raw.rawText||rawText||'').slice(0,300),itemKey:String(raw.itemKey||'').slice(0,120),subject:String(raw.subject||'').slice(0,160),timeCostMinutes:Math.max(0,Math.min(720,Number(raw.timeCostMinutes)||0))};
}
function phraseIncludes(text,phrase){const p=String(phrase||'').toLowerCase().trim();return p.length>=3&&text.includes(p)}
function findNpcMention(s,forcedKey=null){const npcs=safeArray(state?.nearby_npcs);if(forcedKey)return npcs.find(n=>n.npc_key===forcedKey)||null;let best=null,bestLen=0;for(const n of npcs){const names=[String(n.name||'').toLowerCase(),String(n.name||'').split(' ')[0].toLowerCase()];for(const name of names){if(name.length>=3&&s.includes(name)&&name.length>bestLen){best=n;bestLen=name.length}}}if(!best&&lastNpcKey&&/\b(her|him|them|that person|she|he)\b/.test(s))best=npcs.find(n=>n.npc_key===lastNpcKey)||null;return best}
function findFeatureMention(s){let best=null,bestLen=0;for(const f of safeArray(state?.phase3_features)){for(const phrase of [f.name,...safeArray(f.aliases)]){const p=String(phrase||'').toLowerCase();if(p.length>=3&&s.includes(p)&&p.length>bestLen){best=f;bestLen=p.length}}}return best}
function findItemMention(s){let best=null,bestScore=0;for(const i of safeArray(state?.inventory)){const variants=[String(i.name||'').toLowerCase(),String(i.item_key||'').replaceAll('_',' ').toLowerCase()];for(const v of variants){const words=v.split(/\s+/).filter(w=>w.length>2),score=words.filter(w=>s.includes(w)).length;if((s.includes(v)||score>=Math.min(2,words.length))&&score>=bestScore){best=i;bestScore=score}}}return best}
function findEventMention(s){let best=null,bestScore=0;for(const e of safeArray(state?.active_events)){const words=String(e.title||'').toLowerCase().split(/\s+/).filter(w=>w.length>3),score=words.filter(w=>s.includes(w)).length;if(score>bestScore){best=e;bestScore=score}}return bestScore?best:(safeArray(state?.active_events).length===1&&/\b(help|investigate|look|check|deal|sort|fix)\b/.test(s)?state.active_events[0]:null)}
function findKnownFactMention(s){const facts=[...safeArray(state?.clues).map(x=>({key:x.clue_key,name:x.name,text:x.text})),...safeArray(state?.rumours).map(x=>({key:x.rumour_key,name:x.subject,text:x.text}))];let best=null,bestScore=0;for(const f of facts){const words=(String(f.name||'')+' '+String(f.text||'')).toLowerCase().split(/\W+/).filter(w=>w.length>4),score=words.filter(w=>s.includes(w)).length;if(score>bestScore){best=f;bestScore=score}}return bestScore?best:null}
function parseWaitMinutes(s){const cur=Number(state?.adventure?.world_minute)||480;let m=s.match(/(\d{1,3})\s*(minute|min)s?/);if(m)return Math.min(720,Math.max(1,Number(m[1])));m=s.match(/(\d{1,2})\s*(hour|hr)s?/);if(m)return Math.min(720,Math.max(1,Number(m[1])*60));const target=/midnight/.test(s)?0:/morning|dawn/.test(s)?480:/noon/.test(s)?720:/afternoon/.test(s)?900:/evening|sunset/.test(s)?1140:/night/.test(s)?1260:null;if(target===null)return 30;let delta=(target-cur+1440)%1440;if(delta===0)delta=60;return Math.min(720,delta)}
function inferSubject(s){if(/token|three[- ]?prong|three prong/.test(s))return 'brass token';if(/rumou?r|gossip|heard|news/.test(s))return 'rumours';if(/work|job|contract|favour/.test(s))return 'work';if(/watch|watchtower|watch house/.test(s))return 'Old Canto Watch';if(/mill/.test(s))return 'Willowmere mill';if(/wildlife|animal|ferret|quail/.test(s))return 'wildlife';if(/archive|record|survey/.test(s))return 'records';return ''}
function localInterpret(rawText,forcedNpcKey=null){
  const raw=String(rawText||'').trim(),s=raw.toLowerCase(),npc=findNpcMention(s,forcedNpcKey),feature=findFeatureMention(s),item=findItemMention(s),event=findEventMention(s),fact=findKnownFactMention(s);let actionType='custom';
  if(/\b(attack|hit|stab|kill|fight)\b/.test(s))actionType='attack';
  else if(/\b(wait|pass time|until evening|until night|until morning|until midnight|until dawn)\b/.test(s))actionType='wait';
  else if(/\b(rest|sleep|nap)\b/.test(s))actionType='rest';
  else if(/\b(follow|tail|shadow)\b/.test(s)&&npc)actionType='follow';
  else if(/\b(threaten|intimidate|scare)\b/.test(s))actionType='threaten';
  else if(/\b(persuade|convince|talk .* into|reason with)\b/.test(s))actionType='persuade';
  else if(/\b(lie|deceive|bluff|pretend)\b/.test(s))actionType='deceive';
  else if(/\b(steal|pickpocket|nick|take without)\b/.test(s))actionType='steal';
  else if(/\b(climb|scale|scramble up|get onto|get on the roof)\b/.test(s))actionType='climb';
  else if(/\b(sneak|hide|creep|stay out of sight)\b/.test(s))actionType='sneak';
  else if(/\b(tell|explain to|inform)\b/.test(s)&&npc)actionType='tell';
  else if(/\b(ask|question|speak to|talk to|say to)\b/.test(s)&&npc)actionType='ask';
  else if(/\b(give|offer|hand .* to)\b/.test(s)&&npc&&item)actionType='give_item';
  else if(/\b(show|use|hold up|present)\b/.test(s)&&item)actionType='use_item';
  else if(/\b(help|repair|fix|assist)\b/.test(s))actionType='help';
  else if(/\b(track|follow the tracks|follow .* trail|trail)\b/.test(s))actionType='track';
  else if(/\b(forage|gather|pick plants|look for herbs)\b/.test(s))actionType='forage';
  else if(/\b(pry|push|pull|open|knock|throw|move|lift|reach)\b/.test(s))actionType='manipulate';
  else if(/\b(search|investigate|study|examine|inspect|listen|look behind|look beneath|look under|check)\b/.test(s))actionType=/\b(search|investigate|study|examine)\b/.test(s)?'investigate':'observe';
  else if(/\b(look|survey|watch|observe)\b/.test(s))actionType='observe';
  const social=['ask','talk','tell','threaten','persuade','deceive','follow'].includes(actionType);
  if(social&&!npc&&/\b(her|him|them|that person|she|he)\b/.test(s)&&safeArray(state?.nearby_npcs).length>1&&!lastNpcKey)return {ambiguous:true,rawText:raw,options:safeArray(state.nearby_npcs).slice(0,3)};
  let targetType='environment',targetKey='';
  if(npc){targetType='npc';targetKey=npc.npc_key}
  else if(feature){targetType='feature';targetKey=feature.feature_key}
  else if(event){targetType='event';targetKey=String(event.id)}
  else if(item){targetType='item';targetKey=item.item_key}
  else if(actionType==='wait'||actionType==='rest'){targetType='self';targetKey='self'}
  return {intent:normaliseIntent({actionType,targetType,targetKey,itemKey:item?.item_key||'',secondaryTarget:fact?.key||'',method:feature?.name||event?.title||'',subject:inferSubject(s),intendedOutcome:raw,rawText:raw,timeCostMinutes:(actionType==='wait'||actionType==='rest')?parseWaitMinutes(s):0},raw),source:'rules'};
}
function renderDynamicSuggestions(){if(!dynamicSuggestions.length)return '';return `<div class="va-phase3-suggestions"><small>YOU COULD…</small><div>${dynamicSuggestions.slice(0,4).map(x=>`<button data-va="dynamic-suggestion" data-text="${esc(x)}" type="button">${esc(x)}</button>`).join('')}</div></div>`}
function renderWorldAffordances(){const fs=safeArray(state?.phase3_features).slice(0,7);if(!fs.length)return '';return `<section class="va-affordances"><div class="va-affordances-head"><small>WORLD DETAILS</small><span>Reference these naturally in WHAT DO YOU DO?</span></div><div>${fs.map(f=>`<button data-va="feature-prompt" data-feature="${esc(f.name)}" type="button"><b>${esc(f.name)}</b><small>${esc(f.feature_type)} · ${esc(f.risk_level)} risk</small></button>`).join('')}</div></section>`}
function renderActiveEvents(){const events=safeArray(state?.active_events);if(!events.length)return '';return events.map(e=>`<section class="va-world-event"><div class="va-world-event-icon">!</div><div><small>${esc(String(e.category).toUpperCase())} · ${Number(e.minutes_left)||0}M REMAINING</small><b>${esc(e.title)}</b><p>${esc(e.description)}</p><div><button data-va="phase3-event-action" data-event="${esc(e.id)}" data-kind="help" type="button">HELP</button><button data-va="phase3-event-action" data-event="${esc(e.id)}" data-kind="investigate" type="button">INVESTIGATE</button></div></div></section>`).join('')}
function renderInvestigationBoard(){const clues=safeArray(state?.clues);if(!clues.length)return `<section class="va-investigation-board"><div class="va-investigation-head"><small>INVESTIGATION BOARD</small><b>No major clues recorded yet.</b></div><p>Important facts will collect here separately from ordinary discoveries.</p></section>`;return `<section class="va-investigation-board"><div class="va-investigation-head"><small>INVESTIGATION BOARD</small><b>${clues.length} clue${clues.length===1?'':'s'} recorded</b></div><div class="va-clue-list">${clues.slice(0,10).map(c=>`<article><i>✦</i><div><b>${esc(c.name)}</b><p>${esc(c.text||'Recorded in your field notes.')}</p></div></article>`).join('')}</div></section>`}
function renderDynamicQuests(){const qs=safeArray(state?.dynamic_quests);if(!qs.length)return '<p class="va-muted">No small local jobs active.</p>';return `<div class="va-panel-list">${qs.map(q=>`<article class="va-list-card ${q.status==='completed'?'completed':''}"><h5>${esc(q.title)}</h5><p>${esc(q.description)}</p><div class="va-list-meta"><span class="va-pill">${esc(q.objective_type)}</span><span class="va-pill">${esc(q.difficulty)}</span><span class="va-pill">${esc(q.status)}</span></div><p><b>Destination:</b> ${esc(q.target_name)} · <b>Expires:</b> ${Number(q.minutes_left)||0}m</p><p><b>Rewards:</b> ${Number(q.reward_gold)||0} gold · ${Number(q.reward_adventure_xp)||0} Adventure XP${q.profession_key?` · ${Number(q.reward_profession_xp)||0} ${esc(PROF_LABELS[q.profession_key]||q.profession_key)} XP`:''}</p>${q.status==='active'?`<div class="va-list-actions"><button class="va-primary" data-va="microquest-resolve" data-quest="${esc(q.id)}" ${state.location?.id===q.target_location_id?'':'disabled'} type="button">${state.location?.id===q.target_location_id?'RESOLVE HERE':'TRAVEL TO '+esc(String(q.target_name).toUpperCase())}</button><button class="va-secondary" data-va="microquest-abandon" data-quest="${esc(q.id)}" type="button">ABANDON</button></div>`:''}</article>`).join('')}</div>`}
function renderReturningRecap(){const rows=safeArray(state?.session_recap).slice(0,3),prom=safeArray(state?.social_promises).filter(p=>p.status==='active'),inv=safeArray(state?.social_invitations).find(i=>i.status==='active'),comp=state?.companion?.status==='active'?state.companion:null;if(!rows.length&&!prom.length&&!inv&&!comp)return '';return `<div class="va-return-recap phase7"><small>WELCOME BACK TO VELMORA</small>${comp?`<span><b>TRAVELLING WITH</b> ${esc(comp.name)} · ${esc(comp.role_text)}</span>`:''}${prom.length?`<span><b>PROMISES</b> ${prom.length} still active</span>`:''}${inv?`<span><b>NEXT INVITATION</b> ${esc(inv.title)} · ${esc(inv.location_name)}</span>`:''}${rows.map(r=>`<span>${esc(String(r.type||'').replaceAll('_',' '))}</span>`).join('')}</div>`}
function showAmbiguity(raw,options){hideProcessing();pendingAmbiguityRaw=raw;const host=el('vaStage');if(!host)return;const o=document.createElement('div');o.className='va-ambiguity-overlay';o.innerHTML=`<div class="va-ambiguity-card"><small>WHO DO YOU MEAN?</small><h4>Choose who that action is aimed at.</h4><div>${options.map(n=>`<button data-va="ambiguity-npc" data-npc="${esc(n.npc_key)}" type="button"><b>${esc(n.name)}</b><span>${esc(n.occupation)}</span></button>`).join('')}</div><button class="va-secondary" data-va="ambiguity-cancel" type="button">CANCEL</button></div>`;host.appendChild(o);requestAnimationFrame(()=>o.classList.add('show'))}
function showPhase3Check(r){if(r?.roll==null)return;const host=el('vaStage');if(!host)return;const o=document.createElement('div');o.className='va-phase3-check';const nice=String(r.degree||'failure').replaceAll('_',' ').toUpperCase();o.innerHTML=`<div class="va-phase3-check-card"><small>${esc(String(r.stat||'CHECK').toUpperCase())}${r.profession?` · ${esc(String(PROF_LABELS[r.profession]||r.profession).toUpperCase())}`:''}</small><div class="va-phase3-check-main"><div class="va-die is-rolling">?</div><div><b>${Number(r.roll)||0} + ${Number(r.modifier)||0}${Number(r.profession_bonus)?` + ${Number(r.profession_bonus)} prof`:''}${Number(r.circumstance)?` + ${Number(r.circumstance)} situational`:''}</b><span>DC ${Number(r.dc)||0}</span></div></div><strong class="va-degree ${esc(String(r.degree||''))}">${esc(nice)}</strong><p>${esc(r.message||'')}</p><button class="va-primary" data-va="phase3-check-close" type="button">CONTINUE</button></div>`;host.appendChild(o);requestAnimationFrame(()=>o.classList.add('show'));setTimeout(()=>{const d=o.querySelector('.va-die');if(d){d.classList.remove('is-rolling');d.textContent=String(Number(r.roll)||1)}},360)}
function startCommandPlaceholder(){clearInterval(placeholderTimer);const input=el('vaCustomInput');if(!input)return;input.placeholder=COMMAND_PLACEHOLDERS[placeholderIndex%COMMAND_PLACEHOLDERS.length];placeholderTimer=setInterval(()=>{const i=el('vaCustomInput');if(!i||document.activeElement===i||i.value)return;placeholderIndex=(placeholderIndex+1)%COMMAND_PLACEHOLDERS.length;i.placeholder=COMMAND_PLACEHOLDERS[placeholderIndex]},4200)}
function pushCommand(raw){if(!raw)return;if(commandHistory[commandHistory.length-1]!==raw)commandHistory.push(raw);if(commandHistory.length>10)commandHistory.shift();commandIndex=commandHistory.length}

function snapshotState(src=state){
  if(!src?.exists)return null;
  return {
    locationId:src.location?.id||'',
    locationName:src.location?.real_name||src.location?.name||'',
    gold:Number(src.adventure?.gold)||0,
    xp:Number(src.adventure?.xp)||0,
    hp:Number(src.adventure?.hp)||0,
    jobs:new Map(safeArray(src.jobs).map(j=>[String(j.id),{status:j.status,title:j.title,destination:j.destination_name}])),
    quests:new Map(safeArray(src.quests).map(q=>[q.quest_key,{status:q.status,stage:Number(q.stage)||0,title:q.title}])),
    discoveries:new Set(safeArray(src.discoveries).map(d=>`${d.discovery_type}:${d.discovery_key||d.name}`)),
    locations:new Set(safeArray(src.map_locations).filter(x=>x.discovered).map(x=>x.id)),
    relationships:new Map(safeArray(src.relationships).map(r=>[r.npc_key||r.name,{name:r.name,relationship:Number(r.relationship)||0,trust:Number(r.trust)||0,respect:Number(r.respect)||0}])),
    wildlifeKey:src.active_wildlife?.wildlife_key||src.active_wildlife?.name||'',
    wildlifeName:src.active_wildlife?.name||'',
    clues:new Set(safeArray(src.clues).map(c=>c.clue_key)),
    events:new Set(safeArray(src.active_events).map(e=>String(e.id))),
    dynamicQuests:new Map(safeArray(src.dynamic_quests).map(q=>[String(q.id),{status:q.status,title:q.title}])),
    reputations:new Map(safeArray(src.reputations).map(r=>[r.location_id,Number(r.score)||0]))
  };
}
function cleanupTransientUi(){
  clearTimeout(narrativeTimer); clearTimeout(transitionTimer);
  clearInterval(placeholderTimer); placeholderTimer=0; qAll('.va-processing,.va-scene-transition,.va-banner-stack,.va-dialogue-overlay,.va-dice-overlay,.va-activity-result,.va-phase3-check,.va-ambiguity-overlay').forEach(x=>x.remove());
  processingState=null; fxActive=false; uiFxQueue.length=0; pendingAmbiguityRaw='';
}
function qAll(sel){return Array.from(document.querySelectorAll(sel))}
function setNarrative(text,instant=false){
  lastNarrative=String(text||'');
  const n=el('vaNarrative'); if(!n)return;
  if(lastRenderedNarrative===lastNarrative&&!instant)return;
  lastRenderedNarrative=lastNarrative;
  typeText(n,lastNarrative,{instant,speed:lastNarrative.length>220?7:12});
}
function typeText(node,text,opts={}){
  if(!node)return;
  clearTimeout(narrativeTimer);
  const full=String(text||'');
  if(opts.instant||full.length<8){ node.textContent=full; node.classList.remove('typing'); return; }
  node.classList.add('typing');
  node.textContent='';
  let i=0;
  const chunk=Math.max(1,Math.ceil(full.length/90));
  const speed=Math.max(8,Number(opts.speed)||12);
  const step=()=>{
    i=Math.min(full.length,i+chunk);
    node.textContent=full.slice(0,i);
    if(i<full.length){ narrativeTimer=setTimeout(step,speed); }
    else node.classList.remove('typing');
  };
  step();
}
function showProcessing(kicker,title,detail=''){ hideProcessing(); const host=q(`#${DIALOG_ID} .va-shell`); if(!host)return; const overlay=document.createElement('div'); overlay.className='va-processing'; overlay.innerHTML=`<div class="va-processing-card"><small>${esc(kicker)}</small><b>${esc(title)}</b>${detail?`<p>${esc(detail)}</p>`:''}<i></i></div>`; host.appendChild(overlay); requestAnimationFrame(()=>overlay.classList.add('show')); processingState=overlay; }
function hideProcessing(){ const overlay=processingState||q('.va-processing'); if(!overlay)return; overlay.classList.remove('show'); setTimeout(()=>overlay.remove(),180); processingState=null; }
function showSceneTransition(kicker,title){ const host=q('#vaStage')||q(`#${DIALOG_ID} .va-shell`); if(!host)return; const overlay=document.createElement('div'); overlay.className='va-scene-transition'; overlay.innerHTML=`<div class="va-scene-transition-card"><small>${esc(kicker)}</small><b>${esc(title)}</b><p>Following the road through Canto Plains…</p></div>`; host.appendChild(overlay); requestAnimationFrame(()=>overlay.classList.add('show')); }
function hideSceneTransition(delay=380){ clearTimeout(transitionTimer); transitionTimer=setTimeout(()=>{ const overlay=q('.va-scene-transition'); if(!overlay)return; overlay.classList.remove('show'); setTimeout(()=>overlay.remove(),220); },delay); }
function queueBanner(kicker,title,text='',variant='neutral'){
  uiFxQueue.push({kicker,title,text,variant}); flushBanners();
}
function flushBanners(){
  if(fxActive||!uiFxQueue.length)return;
  const host=q(`#${DIALOG_ID} .va-shell`); if(!host)return; fxActive=true;
  let stack=q('.va-banner-stack'); if(!stack){ stack=document.createElement('div'); stack.className='va-banner-stack'; host.appendChild(stack); }
  const next=()=>{
    if(!uiFxQueue.length){ fxActive=false; setTimeout(()=>{ if(!uiFxQueue.length) stack.remove(); },240); return; }
    const item=uiFxQueue.shift();
    const card=document.createElement('div'); card.className=`va-banner ${item.variant}`;
    card.innerHTML=`<small>${esc(item.kicker)}</small><b>${esc(item.title)}</b>${item.text?`<p>${esc(item.text)}</p>`:''}`;
    stack.appendChild(card); requestAnimationFrame(()=>card.classList.add('show'));
    setTimeout(()=>{ card.classList.remove('show'); setTimeout(()=>{ card.remove(); next(); },240); }, 2100);
  };
  next();
}
function setActiveNav(){ qAll('.va-nav button').forEach(b=>b.classList.toggle('active', !!drawer && b.dataset.drawer===drawer)); }
function renderStateFeedback(prev,next,reason=''){
  if(!prev||!next?.exists)return;
  const ns=snapshotState(next); if(!ns)return;
  if(reason==='travel' && prev.locationId!==ns.locationId) queueBanner('TRAVEL', ns.locationName || 'New location', `Arrived from ${prev.locationName||'the road'}.`, 'travel');
  const goldDelta=ns.gold-prev.gold; if(goldDelta>0) queueBanner('REWARD', `+${goldDelta.toLocaleString('en-GB')} Velmoran Gold`, 'Your pouch feels a little heavier.', 'reward');
  const xpDelta=ns.xp-prev.xp; if(xpDelta>0) queueBanner('PROGRESS', `+${xpDelta.toLocaleString('en-GB')} Adventure XP`, 'Your story pushes forward.', 'xp');
  const newLocs=[...ns.locations].filter(x=>!prev.locations.has(x));
  newLocs.slice(0,2).forEach(id=>{ const loc=safeArray(next.map_locations).find(m=>m.id===id); if(loc) queueBanner('DISCOVERY', `New location discovered`, loc.real_name||loc.name, 'discovery'); });
  const newDisc=[...ns.discoveries].filter(x=>!prev.discoveries.has(x));
  if(newDisc.length) queueBanner('CODEX', `${newDisc.length} new discovery${newDisc.length>1?'ies':'y'}`, 'Your field notes gain new detail.', 'discovery');
  safeArray(next.quests).forEach(q=>{ const old=prev.quests.get(q.quest_key)?.status||''; if(old!==q.status){ if(q.status==='active') queueBanner('QUEST STARTED', q.title, q.progress?.objective||'A new lead awaits.', 'quest'); if(q.status==='completed') queueBanner('QUEST COMPLETE', q.title, q.progress?.outcome||'Another thread tied off.', 'quest'); } });
  safeArray(next.jobs).forEach(j=>{ const old=prev.jobs.get(String(j.id))?.status||''; if(old!==j.status){ if(j.status==='active') queueBanner('CONTRACT ACCEPTED', j.title, j.destination_name||j.destination, 'quest'); if(j.status==='completed') queueBanner('CONTRACT COMPLETE', j.title, 'Board work settled cleanly.', 'quest'); } });
  safeArray(next.relationships).forEach(r=>{ const old=prev.relationships.get(r.npc_key||r.name); if(old && (Number(r.relationship)||0) > old.relationship){ queueBanner('RELATIONSHIP', `${r.name} warmed to you`, relationshipLabel(r.relationship), 'social'); } });
  if(!prev.wildlifeKey && ns.wildlifeKey) queueBanner('WILDLIFE SPOTTED', ns.wildlifeName||'A creature appears', 'Stay still and choose how to approach.', 'wildlife');
  flushBanners();
}
function afterGameRender(){ setActiveNav(); setNarrative(lastNarrative||state?.adventure?.last_summary||state?.location?.description||'', false); hideProcessing(); flushBanners(); startCommandPlaceholder(); }
async function runServerAction(meta, fn){
  const prev=snapshotState(); if(meta?.processing) showProcessing(meta.processing, meta.title||'Working…', meta.detail||'');
  try{ const out=await fn(prev); return out; }
  catch(err){ hideProcessing(); throw err; }
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
    d.innerHTML=`<div class="va-shell"><header class="va-topbar"><div class="va-brand-mark"><span>V</span></div><div class="va-brand-copy"><small>REPO COMPANY PRESENTS</small><h2>VELMORA ADVENTURES</h2></div><div class="va-top-spacer"></div><span class="va-phase-chip">PERSISTENT RPG · PHASE 7</span><button class="va-close" type="button" aria-label="Close Velmora Adventures">×</button></header><main class="va-stage" id="vaStage"></main><div class="va-saved" id="vaSaved">ADVENTURE SAVED</div></div>`;
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
      if(e.target?.id==='vaCustomInput'&&e.key==='ArrowUp'){e.preventDefault();if(commandHistory.length){commandIndex=Math.max(0,commandIndex-1);e.target.value=commandHistory[commandIndex]||''}return}
      if(e.target?.id==='vaCustomInput'&&e.key==='ArrowDown'){e.preventDefault();if(commandHistory.length){commandIndex=Math.min(commandHistory.length,commandIndex+1);e.target.value=commandIndex>=commandHistory.length?'':commandHistory[commandIndex]||''}return}
      if(e.key==='Enter'&&e.target?.id==='vaCustomInput'){e.preventDefault();customAction().catch(err=>{console.error('[Velmora Adventures]',err);notify(err?.message||'Adventure action failed.')})}
      if(e.key==='Enter'&&e.target?.id==='vaCombatInput'){e.preventDefault();combatFreeAction().catch(err=>{console.error('[Velmora Adventures]',err);notify(err?.message||'Combat action failed.')})}
      if(e.key==='Enter'&&e.target?.id==='vaExpInput'){e.preventDefault();expeditionFreeAction().catch(err=>{console.error('[Velmora Adventures]',err);notify(err?.message||'Expedition action failed.')})}
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
  function close(){cancelAnimationFrame(sceneFrame);sceneFrame=0;clearInterval(heartbeat);heartbeat=0;drawer=null;cleanupTransientUi();el(DIALOG_ID)?.close()}
  function backToQuests(){close();const d=el('questsDialog');if(d&&!d.open){d.showModal();try{if(typeof loadQuestProfile==='function')loadQuestProfile().then(()=>renderQuestJournal?.())}catch(_){}}}
  function startHeartbeat(){clearInterval(heartbeat);heartbeat=setInterval(async()=>{if(!state?.exists||!el(DIALOG_ID)?.open)return;try{const next=await callRpc('adventure_touch',{}, {silent:true});if(next?.exists)state=mergePhase2(next,phase2)}catch(_){ }},60000)}

  function renderLoading(text){const s=el('vaStage');if(s)s.innerHTML=`<section class="va-loading"><div><small>VELMORA ADVENTURES</small><i></i><b>${esc(text)}</b><p>Preparing the next beat of your journey…</p></div></section>`}
  function renderError(err){const msg=err?.message||String(err||'Unknown error');el('vaStage').innerHTML=`<section class="va-screen"><div class="va-error-card"><h3>Adventure could not load</h3><p>${esc(msg)}</p><div class="va-entry-actions"><button class="va-secondary" data-va="retry" type="button">TRY AGAIN</button><button class="va-secondary" data-va="back-quests" type="button">BACK TO QUESTS</button></div></div></section>`}
  function render(){cancelAnimationFrame(sceneFrame);sceneFrame=0;if(view==='create')return renderCreate();if(view==='reset')return renderReset();if(view==='game'&&state?.exists){if(state.active_combat)return renderCombat();if(state.expedition)return renderExpedition();return renderGame()}return renderEntry()}

  function renderEntry(){
    if(!state){return renderLoading('Loading your Adventure…')}
    const stage=el('vaStage');stage.className='va-stage';
    if(!state.exists){
      stage.innerHTML=`<section class="va-screen"><div class="va-entry"><div class="va-entry-hero"><small class="va-entry-kicker">A LIFE WAITING TO HAPPEN</small><h3>Live another life in Velmora.</h3><p>Take jobs, travel the world, meet its people and create your own story. Adventures saves separately from your normal site progress and can be continued whenever you return.</p><div class="va-entry-actions"><button class="va-primary" data-va="begin-create" type="button">BEGIN YOUR ADVENTURE</button><button class="va-secondary" data-va="back-quests" type="button">BACK TO QUESTS</button></div></div><div class="va-resume-summary"><b>Phase 4 is live:</b> Canto is no longer the whole map. Greenwater Vale, Silvercoast and Highweald now open across Elvane, while the Phase 3 free-action engine, NPC memory, rumours and local events continue across the expanded world.</div></div></section>`;return;
    }
    const a=state.adventure,loc=state.location,activeQuest=safeArray(state.quests).find(x=>x.status==='active'&&x.is_main_story);
    stage.innerHTML=`<section class="va-screen"><div class="va-entry"><div class="va-entry-hero"><small class="va-entry-kicker">YOUR VELMORA SAVE</small><h3>Welcome back, ${esc(a.name)}.</h3><p>${esc(a.last_summary||'Your story is waiting where you left it.')}</p></div><div class="va-save-card"><div class="va-portrait">${esc(String(a.name||'?').charAt(0))}</div><div class="va-save-copy"><h4>${esc(a.name)}</h4><span>LEVEL ${Number(a.level)||1} ${esc(String(a.archetype||'Adventurer').toUpperCase())} · ${esc(a.homeland)}</span><div class="va-save-stats"><div><small>CURRENT LOCATION</small><b>${esc(loc?.name||a.location_id)}</b></div><div><small>ADVENTURE TIME</small><b>${formatPlay(a.play_seconds)}</b></div><div><small>MAIN QUEST</small><b>${esc(activeQuest?.title||'Untracked')}</b></div><div><small>VELMORAN GOLD</small><b>${Number(a.gold||0).toLocaleString('en-GB')}</b></div></div></div><div class="va-save-buttons"><button class="va-primary" data-va="continue" type="button">CONTINUE ADVENTURE</button><button class="va-secondary" data-va="journal-entry" type="button">JOURNAL</button><button class="va-danger" data-va="new-adventure" type="button">NEW ADVENTURE</button></div></div><div class="va-resume-summary"><b>Last played:</b> ${formatLastPlayed(a.last_played_at)} · <b>Day ${Number(a.world_day)||1}, ${formatWorldTime(a.world_minute)}</b><br>${esc(objectiveText())}</div>${renderReturningRecap()}</div></section>`;
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
  if(key==='open-shop')return ['¤','SUPPLIES'];
  if(key==='town-life')return ['⌂','TOWN LIFE'];
  if(key==='go-home')return ['▣','HOME'];
  if(key==='camp')return ['⌂','CAMP'];
  if(String(key).startsWith('expedition:'))return ['⌖','EXPEDITION'];
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


function activityCategoryLabel(cat){return ({investigation:'Investigation',exploration:'Exploration',wildlife:'Wildlife',herbalism:'Herbalism',crafting:'Crafting',work:'Local Work',social:'Local Rumour'})[cat]||String(cat||'Local Activity')}
function renderLocalActivities(){
  if(state?.active_wildlife)return '';
  const activities=safeArray(state?.local_activities); if(!activities.length)return '';
  const mastered=activities.filter(a=>a.mastered).length;
  return `<section class="va-local-life"><div class="va-local-life-head"><div><small>LOCAL LIFE</small><b>Things to do in ${esc(state.location?.name||'this place')}</b></div><span>${mastered}/${activities.length} mastered here</span></div><div class="va-local-life-rail">${activities.map(a=>renderLocalActivityCard(a)).join('')}</div></section>`;
}
function renderLocalActivityCard(a){
  const cd=Math.max(0,Number(a.cooldown_minutes)||0), mastered=!!a.mastered, stat=STAT_LABELS[a.check_stat]||a.check_stat||'Check';
  const reward=a.reward_preview||{}; const rewardBits=[];
  if(!mastered&&Number(reward.adventure_xp)>0)rewardBits.push(`+${Number(reward.adventure_xp)} XP`);
  if(!mastered&&Number(reward.gold)>0)rewardBits.push(`+${Number(reward.gold)} gold`);
  if(!mastered&&Number(reward.profession_xp)>0)rewardBits.push(`+${Number(reward.profession_xp)} ${PROF_LABELS[a.profession_key]||a.profession_key||'profession'} XP`);
  if(!mastered&&a.reward_item?.name)rewardBits.push(a.reward_item.name);
  const status=cd>0?`${cd}m`:(mastered?'REVISIT':'TRY');
  return `<button class="va-local-activity ${mastered?'mastered':''} ${cd>0?'cooling':''}" data-va="local-activity" data-activity="${esc(a.activity_key)}" ${cd>0?'disabled':''} type="button"><span class="va-local-icon">${esc(a.icon||'•')}</span><span class="va-local-copy"><small>${esc(activityCategoryLabel(a.category).toUpperCase())} · ${esc(String(stat).toUpperCase())} DC ${Number(a.dc)||0}</small><b>${esc(a.name)}</b><p>${esc(a.description)}</p><em>${Number(a.time_minutes)||0}m${rewardBits.length?` · First clear: ${esc(rewardBits.join(' · '))}`:''}</em></span><span class="va-local-status">${mastered?'<i>✓</i>':''}${esc(status)}</span></button>`;
}
function showActivityResult(res,before){
  const degree=String(res?.degree||'failure'),nice=degree.replaceAll('_',' ').toUpperCase(),message=String(res?.message||'Nothing unusual happens.');
  const host=el('vaStage'); if(!host)return; q('.va-activity-result')?.remove();
  const overlay=document.createElement('div'); overlay.className='va-activity-result';
  const first=!!res?.mastered_now, reward=before?.reward_preview||{}; const rewards=[];
  if(first&&Number(reward.adventure_xp)>0)rewards.push(`+${Number(reward.adventure_xp)} Adventure XP`);
  if(first&&Number(reward.gold)>0)rewards.push(`+${Number(reward.gold)} gold`);
  if(first&&Number(reward.profession_xp)>0)rewards.push(`+${Number(reward.profession_xp)} ${PROF_LABELS[before?.profession_key]||before?.profession_key||'profession'} XP`);
  if(first&&before?.reward_item?.name)rewards.push(before.reward_item.name);
  overlay.innerHTML=`<div class="va-activity-result-card ${esc(degree)}"><div class="va-activity-result-top"><span class="va-activity-result-icon">${esc(res?.activity?.icon||before?.icon||'•')}</span><div><small>${esc(activityCategoryLabel(res?.activity?.category||before?.category).toUpperCase())}</small><h4>${esc(res?.activity?.name||before?.name||'Local Activity')}</h4></div></div><div class="va-activity-roll"><div class="va-die is-rolling">?</div><div class="va-activity-roll-copy"><small>${esc(String(before?.check_stat||'check').toUpperCase())} CHECK</small><b>${Number(res?.roll)||0} + ${Number(res?.modifier)||0} = ${Number(res?.total)||0}</b><span>DC ${Number(res?.dc)||0}</span></div></div><span class="va-degree ${esc(degree)}">${esc(nice)}</span><p class="va-activity-result-text"></p>${first?`<div class="va-first-clear"><small>FIRST CLEAR</small><b>${rewards.length?esc(rewards.join(' · ')):'Field note mastered'}</b></div>`:''}<button class="va-primary" data-va="activity-result-close" type="button">CONTINUE</button></div>`;
  host.appendChild(overlay); requestAnimationFrame(()=>overlay.classList.add('show'));
  const die=overlay.querySelector('.va-die'), text=overlay.querySelector('.va-activity-result-text');
  setTimeout(()=>{die.classList.remove('is-rolling');die.textContent=String(Number(res?.roll)||1);typeText(text,message,{speed:10});},380);
}
async function doLocalActivity(key){
  const before=safeArray(state?.local_activities).find(a=>a.activity_key===key); if(!before)return;
  const prev=snapshotState(); showProcessing(activityCategoryLabel(before.category).toUpperCase(),before.name,`${STAT_LABELS[before.check_stat]||before.check_stat} check · about ${Number(before.time_minutes)||0} world minutes.`);
  const res=await callRpc('adventure_phase23_do_activity',{p_activity_key:key}); takePhase2Result(res); await refreshPhase3(); lastRenderedNarrative=''; lastNarrative=res.message||state.adventure?.last_summary||''; render(); renderStateFeedback(prev,state,'activity'); showActivityResult(res,before); saved();
}



function dangerFor(id){return safeArray(state?.danger_map).find(d=>d.location_id===id)||{location_id:id,danger_tier:'safe',encounter_rate:0,warning:'No unusual danger is expected here.'}}
function dangerLabel(tier){return ({safe:'SAFE',low:'LOW',moderate:'MODERATE',high:'HIGH'})[String(tier||'safe').toLowerCase()]||'SAFE'}
function combatGear(slot){return safeArray(state?.equipment_detail).find(x=>x.slot===slot)||null}
function healingItems(){return safeArray(state?.inventory).filter(i=>Number(i?.check_bonuses?.combat?.heal)>0)}
function renderDangerSide(){const d=state?.danger||dangerFor(state?.location?.id);return `<div class="va-danger-side ${esc(d.danger_tier||'safe')}"><small>LOCAL DANGER</small><b>${esc(dangerLabel(d.danger_tier))}</b><span>${esc(d.warning||'No unusual danger is expected here.')}</span></div>`}
function renderEquipmentSummary(){const weapon=combatGear('weapon'),body=combatGear('body');return `<div class="va-gear-summary"><div><small>MAIN HAND</small><b>${weapon?`${esc(weapon.icon||'•')} ${esc(weapon.name)}`:'Unarmed'}</b></div><div><small>BODY</small><b>${body?`${esc(body.icon||'•')} ${esc(body.name)}`:'Travel clothes'}</b></div></div>`}
function renderShops(){
  const shops=safeArray(phase5Shops); if(!shops.length)return `<div class="va-list-card"><h5>No Adventure shop here.</h5><p>The local economy is doing something inconveniently realistic and requires you to visit a settlement.</p></div>`;
  const inv=safeArray(state.inventory);
  return shops.map(sh=>`<section class="va-shop"><header><small>ADVENTURE GOLD · ${Number(state.adventure?.gold||0).toLocaleString('en-GB')}</small><h5>${esc(sh.name)}</h5><p>${esc(sh.description)}</p></header><div class="va-shop-grid">${safeArray(sh.stock).map(i=>`<article class="va-shop-item"><span>${esc(i.icon||'•')}</span><div><small>${esc(String(i.rarity||'common').toUpperCase())} · ${esc(i.category)}</small><b>${esc(i.name)}</b><p>${esc(i.description)}</p>${i.combat?`<em>${i.combat.damage_min?`DMG ${i.combat.damage_min}-${i.combat.damage_max}`:''}${i.combat.armor?`ARMOUR ${i.combat.armor}`:''}${i.combat.heal?`HEAL ${i.combat.heal}`:''}</em>`:''}</div><button data-va="phase5-shop" data-shop="${esc(sh.shop_key)}" data-kind="buy" data-item="${esc(i.item_key)}" type="button">BUY · ${Number(i.price)}G</button></article>`).join('')}</div><h6>SELL FROM SATCHEL</h6><div class="va-shop-sell">${inv.filter(i=>!['Quest Items','document','Books'].includes(i.category)&&!safeArray(state.equipment_detail).some(e=>e.item_key===i.item_key)).slice(0,16).map(i=>`<button data-va="phase5-shop" data-shop="${esc(sh.shop_key)}" data-kind="sell" data-item="${esc(i.item_key)}" type="button">${esc(i.name)} ×${Number(i.quantity)||1}</button>`).join('')||'<small>Nothing suitable to sell.</small>'}</div></section>`).join('');
}
function renderCombat(){
  const c=state.active_combat;if(!c)return renderGame(); const a=state.adventure,stage=el('vaStage');stage.className='va-stage';
  const hpP=Math.round(clamp(Number(a.hp||0)/Math.max(1,Number(a.max_hp)||1),0,1)*100),ehpP=Math.round(clamp(Number(c.enemy_hp||0)/Math.max(1,Number(c.enemy_max_hp)||1),0,1)*100);
  const abilities=safeArray(state.combat_abilities),items=healingItems(),weapon=combatGear('weapon'),body=combatGear('body');
  const env=(c.enemy_key==='surveyors_automaton'&&safeArray(state.inventory).some(i=>['watchhouse_rubbing','odd_brass_token'].includes(i.item_key)))?`<button class="va-combat-special" data-va="combat-action" data-kind="environment" type="button"><small>ENVIRONMENT</small><b>PRESENT THE SURVEY MARK</b></button>`:'';
  const logs=safeArray(c.log).slice(-8).reverse();
  stage.innerHTML=`<section class="va-screen va-combat-screen"><div class="va-combat-shell"><header class="va-combat-header"><div><small>${esc(String(state.location?.region||'VELMORA').toUpperCase())} · ENCOUNTER</small><h3>${esc(state.location?.name||'On the road')}</h3></div><span class="va-danger-badge ${esc((state.danger||{}).danger_tier||'moderate')}">${esc(dangerLabel((state.danger||{}).danger_tier||'moderate'))}</span></header><div class="va-combat-arena"><article class="va-combatant player"><div class="va-combat-avatar">${esc(a.name?.charAt(0)||'?')}</div><small>YOU · ${esc(String(a.archetype).toUpperCase())}</small><h4>${esc(a.name)}</h4><div class="va-combat-hp"><i style="--p:${hpP}%"></i><b>${Number(a.hp)}/${Number(a.max_hp)} HP</b></div><span>${weapon?`${esc(weapon.name)}`:'Unarmed'}${body?` · ${esc(body.name)}`:''}</span>${state.companion?.status==='active'?`<div class="va-combat-companion"><i>${esc(state.companion.portrait_icon||state.companion.name?.charAt(0)||'•')}</i><span><small>COMPANION</small><b>${esc(state.companion.name)}</b><em>${esc(state.companion.role_text)}</em></span></div>`:''}</article><div class="va-combat-middle"><small>POSITION</small><div class="va-position-track">${['close','mid','far'].map(p=>`<button class="${c.position===p?'active':''}" data-va="combat-action" data-kind="position" data-position="${p}" type="button">${p.toUpperCase()}</button>`).join('')}</div><div class="va-enemy-intent"><small>ENEMY INTENT</small><b>${esc(c.intent_text||String(c.enemy_intent).toUpperCase())}</b></div><div class="va-focus"><small>FOCUS</small><span>${Array.from({length:5},(_,i)=>`<i class="${i<Number(c.focus)?'on':''}"></i>`).join('')}</span><b>${Number(c.focus)}/5</b></div></div><article class="va-combatant enemy"><div class="va-combat-avatar enemy">${esc(c.enemy_icon||'◆')}</div><small>${esc(String(c.enemy_type||'threat').toUpperCase())}</small><h4>${esc(c.enemy_name)}</h4><div class="va-combat-hp enemy"><i style="--p:${ehpP}%"></i><b>${Number(c.enemy_hp)}/${Number(c.enemy_max_hp)} HP</b></div><span>${esc(c.enemy_description||'')}</span></article></div><div class="va-combat-controls"><div class="va-combat-primary"><button data-va="combat-action" data-kind="attack" type="button"><small>BASIC</small><b>ATTACK</b></button><button data-va="combat-action" data-kind="defend" type="button"><small>TACTICAL</small><b>DEFEND</b></button><button data-va="combat-action" data-kind="flee" type="button"><small>ESCAPE</small><b>FLEE</b></button>${env}</div><section><h5>ABILITIES</h5><div class="va-ability-grid">${abilities.map(ab=>`<button data-va="combat-action" data-kind="ability" data-ability="${esc(ab.ability_key)}" ${Number(ab.focus_cost)>Number(c.focus)?'disabled':''} type="button"><small>${Number(ab.focus_cost)} FOCUS</small><b>${esc(ab.name)}</b><span>${esc(ab.description)}</span></button>`).join('')}</div></section>${items.length?`<section><h5>FIELD ITEMS</h5><div class="va-combat-items">${items.map(i=>`<button data-va="combat-action" data-kind="use_item" data-item="${esc(i.item_key)}" type="button">${esc(i.icon||'+')} ${esc(i.name)} ×${Number(i.quantity)||1} · +${Number(i.check_bonuses.combat.heal)} HP</button>`).join('')}</div></section>`:''}<form class="va-combat-command"><input id="vaCombatInput" maxlength="160" placeholder="Try: defend, move far, flee, attack…"><button data-va="combat-free" type="button">TRY IT</button></form></div><aside class="va-combat-log"><header><small>ROUND ${Number(c.round_no)}</small><b>ENCOUNTER LOG</b></header>${logs.map(l=>`<p class="${esc(l.type||'')}">${esc(l.text||'')}</p>`).join('')}</aside><footer class="va-combat-footer"><span>Combat is server resolved. Free text maps only to validated combat actions.</span><button data-va="exit-game" type="button">SAVE & EXIT</button></footer></div></section>`;
}
function renderExpedition(){
  const ex=state.expedition;if(!ex)return renderGame();const stage=el('vaStage'),room=ex.room||{},resolved=new Set(safeArray(ex.resolved_rooms));stage.className='va-stage';
  const gear=renderEquipmentSummary(); const isResolved=resolved.has(room.room_key); const connections=safeArray(room.connections);
  stage.innerHTML=`<section class="va-screen va-expedition-screen"><div class="va-expedition-shell"><header><div><small>EXPEDITION · ${esc(String(state.location?.region||'CANTO PLAINS').toUpperCase())}</small><h3>${esc(ex.name)}</h3></div><span class="va-danger-badge moderate">${esc(dangerLabel('moderate'))}</span></header><div class="va-expedition-main"><aside class="va-expedition-map"><small>DEPTHS MAP</small>${safeArray(ex.rooms).map(r=>`<div class="va-exp-node ${r.room_key===ex.current_room_key?'current ':''}${r.resolved?'resolved ':''}${r.known?'':'unknown'}"><i></i><span>${r.known?esc(r.name):'Unknown chamber'}</span>${r.resolved?'<b>✓</b>':''}</div>`).join('')}</aside><section class="va-exp-room"><small>${esc(String(room.room_type||'EXPLORATION').toUpperCase())}</small><h4>${esc(room.name||'Unknown room')}</h4><p>${esc(room.description||'')}</p>${room.hazard_dc?`<div class="va-exp-hazard"><b>${esc(String(room.hazard_stat||'PERCEPTION').toUpperCase())} · DC ${Number(room.hazard_dc)}</b><span>Multiple approaches can work; the server resolves the check.</span></div>`:''}<div class="va-exp-actions">${!isResolved?`<button class="va-primary" data-va="expedition-action" data-kind="resolve" type="button">${['encounter','boss'].includes(room.room_type)?'FACE WHAT IS HERE':'RESOLVE THIS ROOM'}</button>`:connections.map(k=>{const rr=safeArray(ex.rooms).find(x=>x.room_key===k);return `<button data-va="expedition-action" data-kind="move" data-room="${esc(k)}" type="button">CONTINUE TO ${esc(rr?.name||k)}</button>`}).join('')}${isResolved&&!connections.length?'<span class="va-exp-complete">Nothing deeper is open from this room.</span>':''}</div><form class="va-exp-command"><input id="vaExpInput" maxlength="160" placeholder="Try: inspect the room, use Strength, leave…"><button data-va="expedition-free" type="button">TRY IT</button></form></section><aside class="va-exp-status"><div class="va-exp-hp"><small>EXPEDITION CONDITION</small><b>${Number(state.adventure?.hp)}/${Number(state.adventure?.max_hp)} HP</b></div>${gear}${state.companion?.status==='active'?`<div class="va-exp-companion"><small>COMPANION</small><b>${esc(state.companion.name)}</b><span>${esc(state.companion.support_text||state.companion.role_text)}</span></div>`:''}<div><small>HEALING</small><b>${healingItems().reduce((n,i)=>n+Number(i.quantity||0),0)} field supplies</b></div><button data-va="expedition-action" data-kind="exit" type="button">RETURN TO SURFACE</button><button data-va="exit-game" type="button">SAVE & EXIT</button></aside></div></div></section>`;
}
function showTravelPreparation(id){const dest=safeArray(state.world_locations||state.map_locations).find(x=>x.id===id),d=dangerFor(id);if(!dest)return travel(id,true);const host=el('vaStage');q('.va-prep-overlay')?.remove();const weapon=combatGear('weapon'),body=combatGear('body');const o=document.createElement('div');o.className='va-prep-overlay';o.innerHTML=`<div class="va-prep-card"><small>ROAD DANGER · ${esc(dangerLabel(d.danger_tier))}</small><h4>Travel to ${esc(dest.real_name||dest.name)}</h4><p>${esc(d.warning||'The road may be less predictable than town streets.')}</p><div class="va-prep-grid"><div><small>HP</small><b>${Number(state.adventure.hp)}/${Number(state.adventure.max_hp)}</b></div><div><small>WEAPON</small><b>${esc(weapon?.name||'Unarmed')}</b></div><div><small>ARMOUR</small><b>${esc(body?.name||'Travel clothes')}</b></div><div><small>HEALING</small><b>${healingItems().reduce((n,i)=>n+Number(i.quantity||0),0)} supplies</b></div></div><div class="va-prep-actions"><button class="va-secondary" data-va="prep-cancel" type="button">NOT YET</button><button class="va-primary" data-va="travel-confirm" data-location="${esc(id)}" type="button">TAKE THE ROAD</button></div></div>`;host.appendChild(o);requestAnimationFrame(()=>o.classList.add('show'))}
function showExpeditionPreparation(key){const ex=safeArray(state.available_expeditions).find(x=>x.expedition_key===key);if(!ex)return;const host=el('vaStage');q('.va-prep-overlay')?.remove();const weapon=combatGear('weapon'),body=combatGear('body');const o=document.createElement('div');o.className='va-prep-overlay';o.innerHTML=`<div class="va-prep-card expedition"><small>EXPEDITION PREPARATION · ${esc(dangerLabel(ex.danger_tier))}</small><h4>${esc(ex.name)}</h4><p>${esc(ex.description)}</p><div class="va-prep-grid"><div><small>HP</small><b>${Number(state.adventure.hp)}/${Number(state.adventure.max_hp)}</b></div><div><small>WEAPON</small><b>${esc(weapon?.name||'Unarmed')}</b></div><div><small>ARMOUR</small><b>${esc(body?.name||'Travel clothes')}</b></div><div><small>HEALING</small><b>${healingItems().reduce((n,i)=>n+Number(i.quantity||0),0)} supplies</b></div><div><small>RECOMMENDED</small><b>Adventure LV ${Number(ex.recommended_level)||1}</b></div></div><div class="va-prep-actions"><button class="va-secondary" data-va="prep-cancel" type="button">RETURN TO SURFACE</button><button class="va-primary" data-va="expedition-enter" data-expedition="${esc(key)}" type="button" ${ex.unlocked?'':'disabled'}>${ex.unlocked?'ENTER THE DEPTHS':'ENTRANCE NOT FOUND'}</button></div></div>`;host.appendChild(o);requestAnimationFrame(()=>o.classList.add('show'))}

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




function activeAdventureTitle(){return safeArray(state?.adventure_titles).find(t=>t.active)?.title||''}
function currentHomeAtLocation(){return state?.current_home&&state.current_home.location_id===state?.location?.id?state.current_home:null}
function renderMainNav(){const h=state.current_home,t=state.town_services||{};return `<nav class="va-nav phase6"><button data-va="open-drawer" data-drawer="map" type="button">MAP</button>${t.is_major_town?'<button data-va="open-drawer" data-drawer="town" type="button">TOWN</button>':''}${h?`<button data-va="open-drawer" data-drawer="home" type="button">HOME${h.rent_due?' !':''}</button>`:''}<button data-va="open-drawer" data-drawer="character" type="button">CHARACTER</button><button data-va="open-drawer" data-drawer="inventory" type="button">INVENTORY</button><button data-va="open-drawer" data-drawer="journal" type="button">JOURNAL</button><button data-va="open-drawer" data-drawer="journey" type="button">JOURNEY</button><button data-va="open-drawer" data-drawer="relationships" type="button">PEOPLE</button><button data-va="open-drawer" data-drawer="mail" type="button">MAIL${state.unread_letters?` (${state.unread_letters})`:''}</button><button class="va-exit" data-va="exit-game" type="button">SAVE & EXIT</button></nav>`}
function renderTownLifeStrip(){if(!state.town_services?.is_major_town)return '';const h=currentHomeAtLocation();return `<section class="va-town-strip"><div class="va-town-strip-head"><div><small>TOWN LIFE</small><b>${esc(state.location.name)}</b></div><span>${esc(currentReputation().label)} LOCALLY</span></div><div class="va-town-services-mini"><button data-va="open-drawer" data-drawer="town"><i>⌂</i><b>TOWN SERVICES</b><small>Inn · work · transport</small></button>${state.town_shops.length?'<button data-va="open-drawer" data-drawer="shops"><i>¤</i><b>LOCAL SHOPS</b><small>Buy & sell</small></button>':''}${h?`<button data-va="open-drawer" data-drawer="home"><i>▣</i><b>GO HOME</b><small>${esc(h.name)}</small></button>`:''}${state.crafting_recipes.some(r=>r.station_ok)?'<button data-va="open-drawer" data-drawer="crafting"><i>⚒</i><b>CRAFT / COOK</b><small>Local stations</small></button>':''}</div></section>`}
function renderPropertyOffers(){const ps=state.properties.filter(p=>p.available_here);if(!ps.length)return '<p class="va-muted">No property office here.</p>';return `<div class="va-property-grid">${ps.map(p=>{let a='';if(!p.tenure){if(p.rent_price)a+=`<button data-va="p6-property" data-property="${esc(p.property_key)}" data-kind="rent" ${p.eligible?'':'disabled'}>RENT · ${p.rent_price}G / 7 DAYS</button>`;if(p.purchase_price)a+=`<button data-va="p6-property" data-property="${esc(p.property_key)}" data-kind="buy" ${p.eligible?'':'disabled'}>BUY · ${Number(p.purchase_price).toLocaleString('en-GB')}G</button>`}else{if(p.rent_due)a+=`<button data-va="p6-property" data-property="${esc(p.property_key)}" data-kind="pay_rent">PAY RENT · ${p.rent_price}G</button>`;if(!p.current_home&&!p.rent_due)a+=`<button data-va="p6-property" data-property="${esc(p.property_key)}" data-kind="set_home">MAKE CURRENT HOME</button>`;if(p.tenure==='rented'&&p.purchase_price)a+=`<button data-va="p6-property" data-property="${esc(p.property_key)}" data-kind="buy">BUY OUTRIGHT</button>`}return `<article class="va-property-card ${p.tenure?'held':''}"><div class="va-property-art ${esc(p.architecture_key)}"><span>⌂</span></div><div><small>${esc(String(p.property_type).toUpperCase())}${p.current_home?' · CURRENT HOME':''}</small><h5>${esc(p.name)}</h5><p>${esc(p.description)}</p><div class="va-list-meta"><span class="va-pill">REP ${p.required_reputation}</span>${p.tenure?`<span class="va-pill">${esc(String(p.tenure).toUpperCase())}</span>`:''}</div>${p.eligible?'':'<em>Build more local reputation first.</em>'}<div class="va-list-actions">${a}</div></div></article>`}).join('')}</div>`}
function renderTownServices(){if(!state.town_services?.is_major_town)return '<div class="va-list-card"><h5>No organised town services here.</h5></div>';return `<section class="va-town-hero"><small>SETTLEMENT SERVICES</small><h5>${esc(state.location.name)}</h5><p>Safe work, proper beds, property and transport. All use Adventure Gold only.</p><div class="va-town-service-buttons"><button data-va="p6-rest" data-kind="inn" data-mode="short">REST AT INN · 10G</button><button data-va="p6-rest" data-kind="inn" data-mode="morning">SLEEP UNTIL MORNING · 18G</button>${state.town_shops.length?'<button data-va="open-drawer" data-drawer="shops">LOCAL SHOPS</button>':''}<button data-va="open-drawer" data-drawer="crafting">CRAFT / COOK</button></div></section><section class="va-codex-section"><h5>PROPERTY OFFICE</h5>${renderPropertyOffers()}</section><section class="va-codex-section"><h5>LOCAL WORK</h5><div class="va-work-grid">${state.work_shifts.map(w=>`<article><small>${esc(PROF_LABELS[w.profession_key]||w.profession_key)}</small><b>${esc(w.name)}</b><p>${esc(w.description)}</p><span>${w.minutes}m · base ${w.base_gold}G · ${w.done_today}/${w.max_daily} today</span><button data-va="p6-work" data-shift="${esc(w.shift_key)}" ${w.done_today>=w.max_daily?'disabled':''}>WORK SHIFT</button></article>`).join('')||'<p class="va-muted">No structured work here.</p>'}</div></section><section class="va-codex-section"><h5>PUBLIC TRANSPORT</h5><div class="va-transport-list">${state.transport_routes.map(r=>`<article class="${r.unlocked?'':'locked'}"><i>${r.route_type==='boat'?'≈':r.route_type==='coach'?'▣':'◇'}</i><div><small>${esc(String(r.route_type).toUpperCase())} · ${r.travel_minutes} MIN</small><b>${esc(r.service_name)} → ${esc(r.destination_name)}</b><p>${esc(r.description)}</p></div><button data-va="p6-transport" data-route="${esc(r.route_key)}" ${(!r.unlocked||!r.open_now)?'disabled':''}>${!r.unlocked?'LOCKED':!r.open_now?'CLOSED':`TRAVEL · ${r.cost}G`}</button></article>`).join('')||'<p class="va-muted">No long-distance service leaves from here.</p>'}</div></section>`}
function renderHomeScene(h){return `<div class="va-home-scene ${esc(h.architecture_key||'room')}"><div class="va-home-wall"><div class="va-home-window"></div><div class="va-home-shelf">${state.home_displays.slice(0,4).map(d=>`<span title="${esc(d.label)}">${d.source_type==='trophy'?'⌖':'✦'}</span>`).join('')}</div></div><div class="va-home-floor"><div class="va-home-bed"></div><div class="va-home-chest">▣</div><div class="va-home-table"></div>${state.home_decor.slice(0,8).map((d,i)=>`<span class="va-room-decor d${i}">${esc(d.icon)}</span>`).join('')}</div><div class="va-home-caption"><small>CURRENT HOME</small><b>${esc(h.name)}</b></div></div>`}
function renderHome(){const h=state.current_home;if(!h)return `<section class="va-home-empty"><h5>No current home yet.</h5><p>Rent a room or buy somewhere modest at a property office.</p>${renderPropertyOffers()}</section>`;const at=h.at_home,ok=h.access_ok,inv=state.inventory.filter(i=>i.category!=='Quest Items'&&!(Array.isArray(i.tags)&&i.tags.includes('quest'))),u=h.upgrades||{};return `${renderHomeScene(h)}<div class="va-home-status"><div><small>${esc(String(h.tenure).toUpperCase())}</small><b>${esc(h.location_name)}</b></div><span>${h.rent_due?'RENT OVERDUE':ok?'SERVICES ACTIVE':'SERVICES PAUSED'}</span></div>${!at?`<div class="va-list-card"><h5>You are away from home.</h5><p>Your things are safe in ${esc(h.name)}.</p></div>`:''}${at&&h.rent_due?`<div class="va-list-card warning"><h5>Rent overdue.</h5><button data-va="p6-property" data-property="${esc(h.property_key)}" data-kind="pay_rent">PAY ${h.rent_price}G</button></div>`:''}${at&&ok?`<section class="va-home-actions"><button data-va="p6-rest" data-kind="home" data-mode="short">REST 2 HOURS</button><button data-va="p6-rest" data-kind="home" data-mode="morning">SLEEP UNTIL MORNING</button><button data-va="p6-rest" data-kind="home" data-mode="evening">WAIT UNTIL EVENING</button></section><section class="va-codex-section"><h5>HOME STORAGE · ${state.home_storage_used}/${state.home_storage_capacity} STACKS</h5><div class="va-home-storage"><div><small>IN STORAGE</small>${state.home_storage.map(i=>`<article><span>${esc(i.icon)}</span><b>${esc(i.name)} ×${i.quantity}</b><button data-va="p6-storage" data-kind="withdraw" data-item="${esc(i.item_key)}" data-qty="1">TAKE 1</button><button data-va="p6-storage" data-kind="withdraw" data-item="${esc(i.item_key)}" data-qty="${i.quantity}">ALL</button></article>`).join('')||'<p class="va-muted">Empty.</p>'}</div><div><small>SATCHEL</small>${inv.slice(0,20).map(i=>`<article><span>${esc(i.icon)}</span><b>${esc(i.name)} ×${i.quantity}</b><button data-va="p6-storage" data-kind="deposit" data-item="${esc(i.item_key)}" data-qty="1">STORE 1</button>${i.quantity>1?`<button data-va="p6-storage" data-kind="deposit" data-item="${esc(i.item_key)}" data-qty="${i.quantity}">ALL</button>`:''}</article>`).join('')}</div></div></section><section class="va-codex-section"><h5>DISPLAY · ${state.home_displays.length}/${state.home_display_capacity}</h5><div class="va-display-grid">${state.home_displays.map(d=>`<article><i>✦</i><b>${esc(d.label)}</b><button data-va="p6-display-remove" data-slot="${d.slot_no}">REMOVE</button></article>`).join('')||'<p class="va-muted">Nothing displayed yet.</p>'}</div><div class="va-display-add"><small>DISPLAY SOMETHING EARNED</small>${inv.filter(i=>!['Food','Ingredients','Materials','Supplies'].includes(i.category)).slice(0,5).map(i=>`<button data-va="p6-display-add" data-type="item" data-key="${esc(i.item_key)}">${esc(i.name)}</button>`).join('')}${state.discoveries.slice(0,5).map(d=>`<button data-va="p6-display-add" data-type="discovery" data-key="${esc(d.discovery_key)}">${esc(d.name)}</button>`).join('')}${state.available_expeditions.some(e=>e.progress_status==='completed')?'<button data-va="p6-display-add" data-type="trophy" data-key="old_canto_watch_depths">Surveyor’s Measure</button>':''}</div></section><section class="va-codex-section"><h5>DECORATION</h5><div class="va-decor-grid">${state.home_decor.map(d=>`<article><i>${esc(d.icon)}</i><b>${esc(d.name)}</b><button data-va="p6-decor-remove" data-slot="${d.slot_no}">REMOVE</button></article>`).join('')||'<p class="va-muted">Minimalism is winning.</p>'}</div><div class="va-decor-offers">${state.decor_offers.filter(d=>d.unlocked).map(d=>`<button data-va="p6-decor" data-decor="${esc(d.decor_key)}"><i>${esc(d.icon)}</i><b>${esc(d.name)}</b><small>${d.price?`${d.price}G`:'EARNED'}</small></button>`).join('')}</div></section>${h.tenure==='owned'?`<section class="va-codex-section"><h5>HOME UPGRADES</h5><div class="va-upgrade-grid">${[['storage','Storage',160,3],['display','Display',180,3],['workbench','Workbench',240,1],['kitchen','Kitchen',260,1],['herbalism','Herb Station',220,1]].map(([k,n,p,m])=>{const lv=Number(u[k])||0;return `<button data-va="p6-upgrade" data-upgrade="${k}" ${lv>=m?'disabled':''}><small>${n.toUpperCase()}</small><b>${lv}/${m}</b><span>${lv>=m?'MAX':`${p*(lv+1)}G`}</span></button>`}).join('')}</div></section>`:''}`:'<div class="va-list-card"><h5>Home services paused.</h5></div>'}`}
function renderJourney(){return `<section class="va-journey-hero"><small>YOUR LIFE IN ELVANE</small><h5>Journey & Collections</h5><p>Completion records what you have lived through; it does not tell you how to play.</p></section><div class="va-region-progress-grid">${state.regional_progress.map(r=>`<article><small>${esc(r.region.toUpperCase())}</small><b>${r.locations_found}/${r.locations_total} locations</b><span>${r.activities_mastered}/${r.activities_total} local activities</span></article>`).join('')}</div><section class="va-codex-section"><h5>COLLECTIONS</h5>${state.collections.map(c=>`<article class="va-list-card ${c.completed?'completed':''}"><h5>${esc(c.name)}</h5><p>${esc(c.description)}</p><div class="va-list-meta"><span class="va-pill">${c.found}/${c.required}</span>${c.completed?'<span class="va-pill">COMPLETE</span>':''}</div></article>`).join('')}</section><section class="va-codex-section"><h5>ADVENTURE TITLES</h5><div class="va-title-grid">${state.adventure_titles.map(t=>`<button class="${t.active?'active':''}" data-va="p6-title" data-title="${esc(t.title_key)}"><b>${esc(t.title)}</b><small>${esc(t.description)}</small></button>`).join('')||'<p class="va-muted">Keep travelling.</p>'}</div></section>`}
function renderMail(){return `<section class="va-mail-head"><small>ADVENTURE POST</small><h5>${state.unread_letters} unread</h5><p>Structured letters from people and story events.</p></section><div class="va-mail-list">${state.letters.map(l=>`<article class="${l.read?'read':'unread'}"><div><small>DAY ${l.created_world_day} · ${formatWorldTime(l.created_world_minute)}</small><b>${esc(l.sender)} — ${esc(l.subject)}</b><p>${esc(l.body)}</p></div>${l.read?'':`<button data-va="p6-letter" data-letter="${esc(l.id)}">MARK READ</button>`}</article>`).join('')||'<p class="va-muted">No post waiting.</p>'}</div>`}
function renderCrafting(){const inv=new Map(state.inventory.map(i=>[i.item_key,Number(i.quantity)||0]));return `<section class="va-crafting-head"><small>WORKBENCH & KITCHEN</small><h5>Make useful things predictably.</h5><p>No quality roulette: recipe + materials + station = item.</p></section><div class="va-recipe-grid">${state.crafting_recipes.map(r=>{const ins=Object.entries(r.ingredients||{}),en=ins.every(([k,q])=>(inv.get(k)||0)>=Number(q));return `<article class="${r.station_ok&&r.level_ok?'ready':'locked'}"><span>${esc(r.output_icon||'⚒')}</span><div><small>${esc(r.category)} · ${r.time_minutes} MIN</small><b>${esc(r.name)}</b><p>${esc(r.description)}</p><em>${ins.map(([k,q])=>`${q} × ${esc(state.inventory.find(i=>i.item_key===k)?.name||k.replaceAll('_',' '))}`).join(' · ')}</em></div><button data-va="p6-craft" data-recipe="${esc(r.recipe_key)}" ${(!r.station_ok||!r.level_ok||!en)?'disabled':''}>${!r.station_ok?'NEED STATION':!r.level_ok?`CRAFTING ${r.required_crafting_level}`:!en?'MISSING MATERIALS':'MAKE'}</button></article>`}).join('')}</div>`}
function renderPhase6Shops(){if(!state.town_shops.length)return renderShops();const eq=new Set(state.equipment_detail.map(e=>e.item_key));return state.town_shops.map(sh=>`<section class="va-shop phase6-shop"><header><small>${sh.open_now?'OPEN':'CLOSED'} · 08:00–20:00 · ${Number(state.adventure.gold).toLocaleString('en-GB')}G</small><h5>${esc(sh.name)}</h5><p>${esc(sh.description)}</p></header><div class="va-shop-grid">${sh.stock.map(i=>`<article class="va-shop-item"><span>${esc(i.icon)}</span><div><small>${esc(String(i.rarity).toUpperCase())} · ${esc(i.category)}</small><b>${esc(i.name)}</b><p>${esc(i.description)}</p></div><div class="va-shop-buy-actions"><button data-va="p6-shop" data-shop="${esc(sh.shop_key)}" data-kind="buy" data-item="${esc(i.item_key)}" data-qty="1" ${sh.open_now?'':'disabled'}>BUY · ${i.buy_price}G</button><button data-va="p6-shop" data-shop="${esc(sh.shop_key)}" data-kind="buy" data-item="${esc(i.item_key)}" data-qty="5" ${sh.open_now?'':'disabled'}>×5</button></div></article>`).join('')}</div><h6>SELL FROM SATCHEL</h6><div class="va-shop-sell">${state.inventory.filter(i=>!['Quest Items','document','Books'].includes(i.category)&&!eq.has(i.item_key)).slice(0,20).map(i=>{const st=sh.stock.find(x=>x.item_key===i.item_key),price=st?.sell_price||Math.max(1,Math.floor(Number(i.value||1)*.4));return `<span><b>${esc(i.name)} ×${i.quantity}</b><button data-va="p6-shop" data-shop="${esc(sh.shop_key)}" data-kind="sell" data-item="${esc(i.item_key)}" data-qty="1" ${sh.open_now?'':'disabled'}>SELL 1 · ${price}G</button>${i.quantity>1?`<button data-va="p6-shop" data-shop="${esc(sh.shop_key)}" data-kind="sell" data-item="${esc(i.item_key)}" data-qty="${Math.min(20,i.quantity)}" ${sh.open_now?'':'disabled'}>SELL ${Math.min(20,i.quantity)}</button>`:''}</span>`}).join('')||'<small>Nothing suitable to sell.</small>'}</div></section>`).join('')}


function phase7StampText(stamp){if(stamp==null)return 'No deadline';const d=Math.max(1,Math.floor(Number(stamp)/1440)),m=((Number(stamp)%1440)+1440)%1440;return `Day ${d} · ${formatWorldTime(m)}`}
function renderCompanionMini(){const c=state?.companion;if(!c||c.status==='dismissed')return '';return `<div class="va-companion-mini ${esc(c.condition||'ready')}"><div class="va-companion-portrait">${esc(c.portrait_icon||c.name?.charAt(0)||'•')}</div><div><small>${c.status==='waiting'?'WAITING COMPANION':'COMPANION'}</small><b>${esc(c.name)}</b><span>${esc(c.role_text||c.occupation||'Companion')} · ${esc(String(c.condition||'ready').toUpperCase())}</span></div><button data-va="open-drawer" data-drawer="relationships" type="button">PEOPLE</button></div>`}
function renderSocialSceneStrip(){const scenes=safeArray(state?.social_scenes),inv=safeArray(state?.social_invitations).filter(i=>i.can_attend);if(!scenes.length&&!inv.length)return '';return `<section class="va-social-now"><header><small>SOCIAL LIFE · HAPPENING NOW</small><span>People do not wait in place for you.</span></header>${inv.map(i=>`<article class="va-social-now-card invitation"><div><small>INVITATION · ${esc(i.npc_name)}</small><b>${esc(i.title)}</b><p>${esc(i.description)}</p></div><button data-va="p7-invite" data-id="${esc(i.id)}" data-kind="attend" type="button">ATTEND</button></article>`).join('')}${scenes.map(s=>`<article class="va-social-now-card"><div><small>${safeArray(s.npcs).map(n=>esc(n.name)).join(' · ')}</small><b>${esc(s.title)}</b><p>${esc(s.description)}</p></div><button data-va="p7-scene" data-scene="${esc(s.scene_key)}" type="button">JOIN THEM</button></article>`).join('')}</section>`}
function renderPhase7Story(st){const opts=safeArray(st.options);let buttons='';if(st.status==='available'&&st.at_start_location&&st.npc_here)buttons=`<button data-va="p7-story" data-story="${esc(st.story_key)}" data-kind="start" type="button">START THIS THREAD</button>`;else if(st.status==='active'&&st.at_start_location&&st.npc_here){buttons=st.stage>=2?opts.map(o=>`<button data-va="p7-story" data-story="${esc(st.story_key)}" data-kind="choose" data-option="${esc(o.key)}" type="button">${esc(o.label)}</button>`).join(''):`<button data-va="p7-story" data-story="${esc(st.story_key)}" data-kind="progress" type="button">CONTINUE</button>`}return `<article class="va-social-story ${esc(st.story_type)} ${esc(st.status)}"><small>${esc(String(st.story_type).replace('_',' ').toUpperCase())} · ${esc(String(st.status).toUpperCase())}</small><h5>${esc(st.title)}</h5><p>${esc(st.stage_text||st.description)}</p>${st.choice?`<span class="va-story-choice">CHOICE · ${esc(String(st.choice).replaceAll('_',' ').toUpperCase())}</span>`:''}${buttons?`<div class="va-social-story-actions">${buttons}</div>`:''}</article>`}
function findPhase7Person(text){const s=String(text||'').toLowerCase();let best=null,bestLen=0;for(const p of safeArray(state?.people)){for(const name of [p.name,String(p.name||'').split(' ')[0]]){const n=String(name||'').toLowerCase();if(n.length>=3&&s.includes(n)&&n.length>bestLen){best=p;bestLen=n.length}}}if(!best&&lastNpcKey)best=safeArray(state?.people).find(p=>p.npc_key===lastNpcKey)||null;if(!best&&state?.companion?.status==='active')best=safeArray(state?.people).find(p=>p.npc_key===state.companion.npc_key)||state.companion;return best}
function findPhase7Fact(text){const s=String(text||'').toLowerCase();for(const f of safeArray(state?.social_secrets)){if(s.includes(String(f.summary||'').toLowerCase().split(' ').filter(w=>w.length>5)[0]||'')||s.includes(String(f.secret_key).replaceAll('_',' ')))return {key:f.secret_key,type:'secret'}}for(const d of safeArray(state?.discoveries)){const nm=String(d.name||'').toLowerCase(),key=String(d.discovery_key||'').replaceAll('_',' ');if((nm&&s.includes(nm))||(key&&s.includes(key)))return {key:d.discovery_key,type:'discovery'}}return null}

function renderGame(){
  const a=state.adventure,loc=state.location,level=Number(a.level)||1,cur=xpForAdventureLevel(level),next=level>=99?13034431:xpForAdventureLevel(level+1),xp=Number(a.xp)||0,xpP=level>=99?100:Math.round(clamp((xp-cur)/Math.max(1,next-cur),0,1)*100),hpP=Math.round(clamp((Number(a.hp)||0)/Math.max(1,Number(a.max_hp)||1),0,1)*100);
  const stage=el('vaStage');stage.className='va-stage';
  const admin=state.admin?`<div class="va-mini-card"><small>ADMIN TESTING</small><b>Adventure debug tools enabled.</b><div class="va-list-actions"><button class="va-secondary" data-va="open-drawer" data-drawer="admin" type="button">OPEN DEBUG</button></div></div>`:'';
  const nearbyCount=safeArray(state.nearby_npcs).length;
  const openRoads=safeArray(state.world_locations||state.map_locations).filter(x=>x.connected&&x.known!==false&&x.id!==loc.id).length; const worldSummary=state.world_summary||{}; const currentRegion=safeArray(state.world_regions).find(r=>r.region_key===state.current_region_key);
  stage.innerHTML=`<section class="va-screen is-game"><div class="va-game"><div class="va-game-main"><section class="va-world"><header class="va-location-head"><div class="va-location-title"><small class="va-zone-kicker">${esc(String(loc.country).toUpperCase())} · ${esc(String(loc.region).toUpperCase())}</small><h3>${esc(loc.name)}</h3><span>${esc(loc.description||'')}</span></div><div class="va-head-chips"><span class="va-head-chip">DAY ${Number(a.world_day)||1} · ${formatWorldTime(a.world_minute)}</span><span class="va-head-chip weather">${esc(WEATHER_LABELS[a.weather]||a.weather)}</span></div></header><div class="va-scene-wrap"><canvas id="vaScene" width="960" height="420" aria-label="${esc(loc.name)}"></canvas><div class="va-weather-layer ${esc(a.weather)}"></div><div class="va-scene-caption"><span>${nearbyCount} nearby</span><span>${safeArray(state.local_activities).length} local activities</span><span>${safeArray(state.phase3_features).length} world details</span><span>${openRoads} roads open</span></div><div class="va-scene-vignette"></div></div><section class="va-story"><div class="va-story-head"><span class="va-story-label">CURRENT SCENE</span><small class="va-story-sub">${esc(sceneSubtitle())}</small></div><p id="vaNarrative" class="va-narrative">${esc(lastNarrative||a.last_summary||loc.description)}</p>${renderSocialSceneStrip()}${renderDynamicSuggestions()}${renderActiveEvents()}${renderEncounterStrip()}${renderWorldAffordances()}${renderLocalActivities()}${renderTownLifeStrip()}<div class="va-action-head"><small>QUESTS, TRAVEL & NEXT STEPS</small></div><div class="va-action-row va-action-grid" id="vaActions">${renderActions()}</div><div class="va-command-console"><small>WHAT DO YOU DO?</small><form class="va-custom-action" id="vaCustomForm"><input id="vaCustomInput" maxlength="300" autocomplete="off" placeholder="Ask Nell about the token…"><button class="va-secondary" data-va="custom-submit" type="button">DO IT</button></form><span>Type naturally. ↑ recalls recent commands. The narrator interprets; the server decides reality.</span></div></section></section><aside class="va-side"><div class="va-char-card"><div class="va-char-top"><div class="va-portrait">${esc(a.name.charAt(0))}</div><div class="va-char-copy"><h4>${esc(a.name)}</h4><span>LEVEL ${level} ${esc(String(a.archetype).toUpperCase())}${activeAdventureTitle()?` · ${esc(activeAdventureTitle().toUpperCase())}`:''}</span></div></div><div class="va-bars"><div class="va-bar hp" style="--p:${hpP}%"><small>HP</small><i></i><b>${a.hp}/${a.max_hp}</b></div><div class="va-bar" style="--p:${xpP}%"><small>XP TO NEXT</small><i></i><b>${xp.toLocaleString('en-GB')}</b></div></div></div><div class="va-objective-card"><small>CURRENT OBJECTIVE</small><b>${esc(objectiveTitle())}</b><p>${esc(objectiveText())}</p></div><div class="va-quick-stats"><div><small>GOLD</small><b>${Number(a.gold||0).toLocaleString('en-GB')}</b></div><div><small>TIME PLAYED</small><b>${formatPlay(a.play_seconds)}</b></div><div><small>HOMELAND</small><b>${esc(a.homeland)}</b></div><div><small>BACKGROUND</small><b>${esc(a.background)}</b></div></div><div class="va-reputation-card"><small>LOCAL REPUTATION</small><b>${esc(currentReputation().label)}</b><span>${esc(currentReputation().location_name||loc.name)}</span></div><div class="va-world-progress"><small>WORLD EXPLORATION</small><b>${esc(currentRegion?.name||loc.region)}</b><span>${Number(worldSummary.locations_discovered)||0} / ${Number(worldSummary.locations_total)||0} locations found · ${safeArray(state.world_regions).filter(r=>r.visited).length} / ${Number(worldSummary.regions_total)||safeArray(state.world_regions).length} regions visited</span></div><div class="va-local-progress"><small>LOCAL LIFE</small><div><i style="--p:${Math.round((Number(state.activity_mastered_count)||0)/Math.max(1,Number(state.activity_total_count)||1)*100)}%"></i></div><b>${Number(state.activity_mastered_count)||0} / ${Number(state.activity_total_count)||0} local activities mastered</b></div>${state.current_home?`<div class="va-home-side ${state.current_home.rent_due?'due':''}"><small>HOME</small><b>${esc(state.current_home.name)}</b><span>${state.current_home.rent_due?'Rent overdue':state.current_home.location_name}</span></div>`:''}${renderCompanionMini()}${renderDangerSide()}${admin}</aside></div>${renderMainNav()}<aside class="va-drawer" id="vaDrawer"></aside><div class="va-saved" id="vaSaved">ADVENTURE SAVED</div></div></section>`;
  renderDrawer();startSceneLoop();afterGameRender();
}



function renderEncounterStrip(){
  const wildlife=state.active_wildlife;
  if(wildlife)return `<div class="va-encounter-card"><div class="va-encounter-icon">${esc(wildlife.icon||'◇')}</div><div><small>WILDLIFE ENCOUNTER · ${esc(String(wildlife.rarity||'').toUpperCase())}</small><b>${esc(wildlife.name)}</b><p>${esc(wildlife.description)}</p></div><div class="va-encounter-actions"><button data-va="wildlife-act" data-action="observe" type="button">OBSERVE</button><button data-va="wildlife-act" data-action="feed" type="button">OFFER FEED</button><button data-va="wildlife-act" data-action="leave" type="button">LEAVE</button></div></div>`;
  const npcs=safeArray(state.nearby_npcs).slice(0,4);
  if(!npcs.length)return '';
  return `<div class="va-nearby-strip"><div class="va-nearby-head"><small>PEOPLE HERE NOW</small><span>${npcs.length} available · click to talk</span></div><div>${npcs.map(n=>`<button class="va-nearby-person" data-va="talk-npc" data-npc="${esc(n.npc_key)}" data-topic="hello" type="button" aria-label="Talk to ${esc(n.name)}"><span>${esc(n.portrait_icon||n.name.charAt(0))}</span><b>${esc(n.name)}</b><em>${esc(n.occupation)}</em><strong>TALK</strong></button>`).join('')}</div></div>`;
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
    const wildlifePlaces=new Set(['canto_plains_verge','riverglass_ford','animal_centre_gate','bellmead','whisperbank_grove','lake_eira','redbank_hollow','mere_gardens','mosslight_wood','foxbell_copse','greenwater_marsh','gullstrand','saltwillow','glasswater_quay','tideglass_cliffs','lantern_cape','crownroot_forest','asterfell','stoneveil_pass','old_eiren_road']);
    if(!state.active_wildlife&&wildlifePlaces.has(loc))actions.push(['wildlife-search','Search for wildlife']);
    if(safeArray(state.local_herbs).length)actions.push(['open-codex-herbs','Inspect local plants']);
    const worldLocs=safeArray(state.world_locations||state.map_locations);
    const hiddenConnected=worldLocs.some(x=>x.connected&&x.hidden&&!x.discovered&&x.id!==loc);
    if(hiddenConnected)actions.push(['scout','Scout beyond the familiar road']);
    if(loc==='canto_crossing')actions.push(['drawer-jobs','Read the job board']);
    if(safeArray(state.town_shops).length||safeArray(phase5Shops).length)actions.push(['open-shop','Visit local shops']);
    if(state.town_services?.is_major_town)actions.push(['town-life','Use town services']);
    if(currentHomeAtLocation())actions.push(['go-home','Go home']);
    if(['wilderness','ruin','wetland','mountain','highland','beach','lake','river'].includes(state.location?.kind))actions.push(['camp','Make camp']);
    const exp=safeArray(state.available_expeditions).find(x=>x.unlocked);if(exp)actions.push([`expedition:${exp.expedition_key}`,`Prepare ${exp.name}`]);
    const connected=worldLocs.filter(x=>x.connected&&x.known!==false&&x.id!==loc).slice(0,Math.max(1,5-actions.length));
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
  else if(['greenwater_gate','ossa_mere','mere_gardens','greenwater_village','mosslight','foxbell','marsh'].includes(loc.scene_key))drawGreenwater(ctx,sway,time,loc.scene_key);
  else if(['coast_town','quay','saltwillow','cliffs','cape','beach'].includes(loc.scene_key))drawSilvercoast(ctx,sway,time,loc.scene_key);
  else if(['high_town','crownroot','warden','mountain_pass','asterfell','old_road'].includes(loc.scene_key))drawHighweald(ctx,sway,time,loc.scene_key);
  else drawPlains(ctx,sway,time);
  drawAmbientMotes(ctx,time,daylight,dusk,loc.scene_key);
  drawSceneLife(ctx,time,loc.scene_key,daylight,dusk);
  drawPhase7WorldChanges(ctx,time,loc);
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


function drawPhase7WorldChanges(ctx,time,loc){const changes=safeArray(state?.world_changes).filter(w=>w.location_id===loc.id||w.location_id===state?.location?.id);for(const w of changes){const k=w.story_key,ch=w.choice;ctx.save();if(k==='canto_market_carts'){ctx.fillStyle='#b89b63';if(ch==='restrict_carts'){ctx.fillRect(130,96,3,19);ctx.fillRect(184,96,3,19);ctx.fillRect(127,95,63,3)}else if(ch==='widen_lane'){ctx.fillStyle='#bfae83';ctx.fillRect(120,110,82,8)}else{ctx.fillRect(118,114,94,2);ctx.fillRect(118,119,94,2)}}if(k==='greenwater_boardwalk'){ctx.fillStyle='#aa9160';if(ch==='build_boardwalk'||ch==='limited_crossing'){for(let x=72;x<254;x+=16)ctx.fillRect(x,108,13,3);ctx.fillRect(70,113,187,2)}else{ctx.fillStyle='#d1b76d';ctx.fillRect(150,94,3,23);ctx.fillRect(142,94,19,3)}}if(k==='silvercoast_beacon_fund'){ctx.fillStyle='#f1d87f';const pulse=2+Math.round((Math.sin(time/350)+1));ctx.fillRect(247-pulse,42,5+pulse*2,3);ctx.fillStyle='rgba(241,216,127,.38)';ctx.fillRect(238,44,25,2)}if(k==='highweald_trail_status'){ctx.fillStyle='#a98b58';ctx.fillRect(151,93,4,22);ctx.fillRect(146,94,15,4);if(ch==='close_repair'){ctx.fillStyle='#795749';ctx.fillRect(125,108,70,4)}else if(ch==='warden_only'){ctx.fillStyle='#d2c18c';ctx.fillRect(149,98,9,7)}}ctx.restore();}}

function drawSceneLife(ctx,time,scene,daylight,dusk){
  const walker=(x,y,a,b,c)=>{ctx.fillStyle=a;ctx.fillRect(x,y,4,7);ctx.fillStyle=b;ctx.fillRect(x+1,y-3,2,2);ctx.fillStyle=c;ctx.fillRect(x,y+7,1,3);ctx.fillRect(x+3,y+7,1,3)};
  const smoke=(x,y,w)=>{ctx.fillStyle='rgba(220,220,210,.18)';ctx.fillRect(x,y,w,2);ctx.fillRect(x+2,y-2,Math.max(2,w-3),2)};
  if(scene==='canto_town'){walker(56,104,'#5f7f5e','#d7c8a1','#4c3a2f');walker(242,103,'#7b6150','#d9cfb0','#4c3a2f');if(!daylight)ctx.fillStyle='#efd486',ctx.fillRect(155,68,8,8)}
  if(scene==='willowmere'){walker(72,104,'#657f56','#d6c59d','#48392f');walker(212,104,'#52718b','#cfbf97','#48392f');smoke(199,73,8)}
  if(scene==='animal_centre'){walker(154,104,'#7c684d','#dacaa4','#48392f');walker(191,103,'#5d7c67','#dacaa4','#48392f')}
  if(scene==='bellmead'){walker(98,105,'#6f5e81','#dbc7a3','#48392f');walker(208,104,'#60794f','#d9c59b','#48392f')}
  if(scene==='grove'||scene==='lake'||scene==='redbank'){for(let i=0;i<3;i++){const x=((time/42)+(i*73))%350-16;const y=24+(i*6);ctx.fillStyle=(dusk||!daylight)?'#f0da90':'#f7f3cf';ctx.fillRect(Math.round(x),Math.round(y),2,1);ctx.fillRect(Math.round(x)+1,Math.round(y)+1,1,1)}}
  if(scene==='river'||scene==='lake'){for(let i=0;i<2;i++){const x=((time/55)+(i*102))%360-22;ctx.fillStyle='rgba(251,245,220,.35)';ctx.fillRect(Math.round(x),110+i*6,18,1)}}
  if(['ossa_mere','greenwater_village','coast_town','quay','saltwillow','high_town','warden'].includes(scene)){walker(82,104,'#61765b','#d7c9a2','#493b32');walker(230,103,'#6d607e','#d7c9a2','#493b32')} if(['cliffs','cape','asterfell','mountain_pass'].includes(scene)){for(let i=0;i<3;i++){const x=((time/50)+i*91)%340-10;ctx.fillStyle='#eee6c7';ctx.fillRect(Math.round(x),28+i*5,2,1)}} if(!daylight){ctx.fillStyle='rgba(255,213,124,.6)';if(scene==='canto_town')ctx.fillRect(96,92,3,3); if(scene==='willowmere')ctx.fillRect(206,87,4,4); if(scene==='ossa_mere')ctx.fillRect(222,80,3,3); if(scene==='coast_town')ctx.fillRect(237,85,3,3); if(scene==='high_town')ctx.fillRect(150,88,3,3);}
}

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

function drawGreenwater(ctx,s,time,scene){
  ctx.fillStyle=scene==='marsh'?'#557a54':'#76955c';ctx.fillRect(0,100,320,40);
  if(scene==='ossa_mere'||scene==='mere_gardens'){ctx.fillStyle='#4f8e91';ctx.fillRect(0,106,320,34);ctx.fillStyle='#d1c8a6';ctx.fillRect(58,82,58,25);ctx.fillRect(190,78,72,29);ctx.fillStyle='#7a503e';ctx.fillRect(64,71,46,12);ctx.fillRect(197,66,58,13);ctx.fillStyle='#d8d0ac';for(let x=26;x<310;x+=70){ctx.fillRect(x,95,38,4);ctx.fillRect(x+4,91,4,12);ctx.fillRect(x+30,91,4,12)}}
  else if(scene==='greenwater_gate'){ctx.fillStyle='#99977d';ctx.fillRect(124,66,72,40);ctx.fillStyle='#465d48';ctx.fillRect(137,78,46,28);ctx.fillStyle='#b2a97f';ctx.fillRect(118,62,84,6);tree(ctx,58,94,s);tree(ctx,254,94,-s)}
  else if(scene==='marsh'){ctx.fillStyle='#4e8885';ctx.fillRect(0,104,320,36);for(let x=5;x<320;x+=14){ctx.fillStyle='#4b6f45';ctx.fillRect(x,86+(x%5),2,28);ctx.fillRect(x+4,92,1,22)}ctx.fillStyle='#a6966c';for(let x=40;x<280;x+=28)ctx.fillRect(x,104,22,3)}
  else {for(let x=16;x<320;x+=37)tree(ctx,x,95,(x%2?s:-s));ctx.fillStyle='#c5b789';if(scene==='greenwater_village'){ctx.fillRect(92,82,55,25);ctx.fillRect(205,86,46,21)} }
}
function drawSilvercoast(ctx,s,time,scene){
  ctx.fillStyle='#4e8fa0';ctx.fillRect(0,88,320,52);ctx.fillStyle='rgba(225,239,226,.28)';for(let i=0;i<7;i++)ctx.fillRect(((i*61+time/25)%365)-35,101+i*5,34,1);
  if(scene==='coast_town'||scene==='quay'||scene==='saltwillow'){ctx.fillStyle='#c7baa0';ctx.fillRect(38,78,55,28);ctx.fillRect(118,82,49,24);ctx.fillRect(218,75,62,31);ctx.fillStyle='#6e4d42';ctx.fillRect(32,71,67,9);ctx.fillRect(112,75,61,9);ctx.fillRect(212,68,74,9);ctx.fillStyle='#8b7653';ctx.fillRect(0,107,320,5)}
  if(scene==='cliffs'||scene==='cape'){ctx.fillStyle='#aaa58e';ctx.beginPath();ctx.moveTo(0,82);ctx.lineTo(70,61);ctx.lineTo(145,79);ctx.lineTo(220,54);ctx.lineTo(320,74);ctx.lineTo(320,112);ctx.lineTo(0,112);ctx.fill();if(scene==='cape'){ctx.fillStyle='#d2c5a5';ctx.fillRect(238,50,22,46);ctx.fillStyle='#7b5540';ctx.fillRect(233,48,32,6)}}
  if(scene==='beach'){ctx.fillStyle='#c9bd91';ctx.fillRect(0,103,320,37);ctx.fillStyle='#785942';for(let x=35;x<285;x+=70){ctx.fillRect(x,102,38,3);ctx.fillRect(x+6,97,3,8);ctx.fillRect(x+29,97,3,8)}}
}
function drawHighweald(ctx,s,time,scene){
  ctx.fillStyle='#586f47';ctx.fillRect(0,100,320,40);
  if(scene==='high_town'||scene==='warden'){ctx.fillStyle='#b7aa91';ctx.fillRect(52,79,58,28);ctx.fillRect(128,75,65,32);ctx.fillRect(220,82,45,25);ctx.fillStyle='#4d3b35';ctx.fillRect(45,70,72,11);ctx.fillRect(121,65,79,12);ctx.fillRect(214,74,58,10);ctx.fillStyle='rgba(215,214,202,.22)';ctx.fillRect(168,52,8,18)}
  else if(scene==='mountain_pass'){ctx.fillStyle='#888a83';ctx.beginPath();ctx.moveTo(0,100);ctx.lineTo(55,55);ctx.lineTo(115,91);ctx.lineTo(176,45);ctx.lineTo(250,88);ctx.lineTo(320,58);ctx.lineTo(320,120);ctx.lineTo(0,120);ctx.fill();ctx.fillStyle='#a39578';ctx.fillRect(142,94,37,6)}
  else if(scene==='asterfell'){ctx.fillStyle='#77915b';ctx.fillRect(0,95,320,45);for(let x=15;x<315;x+=22){ctx.fillStyle='#aa94b8';ctx.fillRect(x,104+(x%7),2,2)}ctx.fillStyle='#8b8d80';for(const x of [88,120,156,209])ctx.fillRect(x,70+(x%3),5,35)}
  else {for(let x=7;x<320;x+=25){tree(ctx,x,94,(x%3?s:-s));ctx.fillStyle='#365337';ctx.fillRect(x-12,89,24,7)}if(scene==='old_road'){ctx.fillStyle='#9a8f72';ctx.fillRect(42,104,238,7);ctx.fillStyle='#777469';ctx.fillRect(244,76,6,31)}}
}

  function renderDrawer(){const d=el('vaDrawer');if(!d)return;if(!drawer){d.className='va-drawer';d.innerHTML='';return}d.className='va-drawer open';let title='',body='';
    if(drawer==='map'){title='Map of Elvane';body=renderMap()}
    if(drawer==='character'){title='Character';body=renderCharacterPanel()}
    if(drawer==='inventory'){title='Inventory';body=renderInventory()}
    if(drawer==='journal'){title='Quest Journal';body=renderJournal()}
    if(drawer==='relationships'){title='People & Social Life';body=renderRelationships()}
    if(drawer==='codex'){title='Codex & Fieldcraft';body=renderCodex()}
    if(drawer==='jobs'){title='Job Board';body=renderJobs()}
    if(drawer==='town'){title='Town Life';body=renderTownServices()}
    if(drawer==='home'){title='Home';body=renderHome()}
    if(drawer==='journey'){title='Journey & Collections';body=renderJourney()}
    if(drawer==='mail'){title='Adventure Post';body=renderMail()}
    if(drawer==='crafting'){title='Crafting & Cooking';body=renderCrafting()}
    if(drawer==='shops'){title='Shops & Supplies';body=renderPhase6Shops()}
    if(drawer==='admin'){title='Adventure Debug';body=renderAdmin()}
    d.innerHTML=`<header class="va-drawer-head"><h4>${esc(title)}</h4><button class="va-drawer-close" data-va="close-drawer" type="button">×</button></header><div class="va-drawer-body">${body}</div>`; setActiveNav();
  }

function renderMap(){
  const current=state.location?.id,regions=safeArray(state.world_regions),world=safeArray(state.world_locations||state.map_locations);
  if(!mapRegionKey)mapRegionKey=state.current_region_key||'canto_plains';
  const chosen=regions.find(r=>r.region_key===mapRegionKey); if(!chosen||(!chosen.known&&chosen.region_key!==state.current_region_key)){mapRegionKey=state.current_region_key||'canto_plains';}
  const active=regions.find(r=>r.region_key===mapRegionKey)||regions[0]; const locs=world.filter(x=>x.region_key===mapRegionKey);
  const tabs=`<div class="va-region-tabs">${regions.map(r=>`<button data-va="phase4-region" data-region="${esc(r.region_key)}" class="${r.region_key===mapRegionKey?'active ':''}${r.known?'':'locked'}" ${(!r.known&&r.region_key!==state.current_region_key)?'disabled':''} type="button"><small>${esc(r.country)}</small><b>${esc(r.name)}</b><span>${Number(r.discovered_locations)||0}/${Number(r.total_locations)||0}</span></button>`).join('')}</div>`;
  const map=`<div class="va-map va-region-map ${esc(mapRegionKey)}">${locs.map(x=>{const dg=dangerFor(x.id);return `<button class="va-map-node ${x.id===current?'current ':''}${x.connected?'connected ':''}${x.known?'':'locked'} danger-${esc(dg.danger_tier)}" style="left:${Number(x.map_x)||50}%;top:${Number(x.map_y)||50}%" data-va="map-node" data-location="${esc(x.id)}" ${(!x.known||(!x.connected&&x.id!==current))?'disabled':''} type="button">${x.id===current?'◆':x.known?'•':'?'}</button><span class="va-map-label ${x.known?'':'unknown'}" style="left:${Number(x.map_x)||50}%;top:${Number(x.map_y)||50}%">${esc(x.name)}${x.known?`<i class="va-map-danger ${esc(dg.danger_tier)}">${esc(dangerLabel(dg.danger_tier))}</i>`:''}</span>`}).join('')}</div>`;
  const intro=`<div class="va-region-intro"><div><small>${esc(active?.country||'ELVANE')}</small><h5>${esc(active?.name||'Region')}</h5><p>${esc(active?.description||'')}</p></div><span>${Number(active?.discovered_locations)||0} / ${Number(active?.total_locations)||0}<small>FOUND</small></span></div>`;
  return `${tabs}${intro}${map}<div class="va-danger-legend"><span class="safe">SAFE</span><span class="low">LOW</span><span class="moderate">MODERATE</span><span class="high">HIGH</span></div><p class="va-resume-summary"><b>Road danger is now part of exploration.</b> Safe roads are usually peaceful; wilderness and ruins can trigger server-owned encounters. Moderate and High routes show a preparation warning before travel.</p>`;
}
function renderCharacterPanel(){const a=state.adventure,stats=state.stats||{};return `<div class="va-review"><div class="va-portrait">${esc(a.name.charAt(0))}</div><dl><div><dt>NAME</dt><dd>${esc(a.name)}</dd></div><div><dt>LEVEL</dt><dd>${Number(a.level)||1}</dd></div><div><dt>HOMELAND</dt><dd>${esc(a.homeland)}</dd></div><div><dt>BACKGROUND</dt><dd>${esc(a.background)}</dd></div><div><dt>ARCHETYPE</dt><dd>${esc(a.archetype)}</dd></div><div><dt>ADVENTURE XP</dt><dd>${Number(a.xp||0).toLocaleString('en-GB')}</dd></div></dl></div><h5>CORE STATS</h5><div class="va-stat-grid">${Object.keys(STAT_LABELS).map(k=>`<div class="va-stat"><small>${esc(STAT_LABELS[k].toUpperCase())}</small><b>${Number(stats[k])||0}</b></div>`).join('')}</div><h5>PROFESSIONS</h5><div class="va-prof-list">${safeArray(state.professions).map(p=>`<div class="va-prof"><b>${esc(PROF_LABELS[p.profession_key]||p.profession_key)}</b><span>LV ${Number(p.level)||1} · ${Number(p.xp||0).toLocaleString('en-GB')} XP</span></div>`).join('')}</div>`}

function renderInventory(){const items=safeArray(state.inventory),gear=safeArray(state.equipment_detail);const equipped=new Set(gear.map(e=>e.item_key));return `<section class="va-codex-section"><h5>COMBAT GEAR</h5>${renderEquipmentSummary()}<div class="va-equipped-grid">${gear.filter(e=>e.item_key).map(e=>`<div><small>${esc(String(e.slot).toUpperCase())}</small><b>${esc(e.icon||'•')} ${esc(e.name||e.item_key)}</b></div>`).join('')||'<p class="va-muted">No dedicated combat gear equipped yet.</p>'}</div></section><section class="va-codex-section"><h5>SATCHEL</h5>${items.length?`<div class="va-inventory-grid">${items.map(i=>{const equip=i.category==='Weapon'?'weapon':i.category==='Armour'?'body':null;return `<div class="va-item"><span class="va-item-icon">${esc(i.icon||'•')}</span><div><h5>${esc(i.name)}</h5><p>${esc(i.description)}</p><div class="va-list-meta"><span class="va-pill">${esc(i.category)}</span><span class="va-pill">${esc(i.rarity)}</span>${equipped.has(i.item_key)?'<span class="va-pill equipped">EQUIPPED</span>':''}</div>${i.check_bonuses?.combat?`<small class="va-combat-item-meta">${i.check_bonuses.combat.damage_min?`DMG ${i.check_bonuses.combat.damage_min}-${i.check_bonuses.combat.damage_max}`:''}${i.check_bonuses.combat.armor?`ARMOUR ${i.check_bonuses.combat.armor}`:''}${i.check_bonuses.combat.heal?`HEAL ${i.check_bonuses.combat.heal}`:''}</small>`:''}${equip?`<button data-va="phase5-equip" data-item="${esc(i.item_key)}" data-slot="${equip}" type="button">EQUIP ${equip==='weapon'?'MAIN HAND':'BODY'}</button>`:''}</div><strong>×${Number(i.quantity)||1}</strong></div>`}).join('')}</div>`:'<div class="va-list-card"><h5>Your satchel is empty.</h5></div>'}</section>`}
function phase2QuestAction(x){const loc=state.location?.id;if(x.status==='available'&&loc===x.start_location_id)return `<button class="va-primary" data-va="accept-p2-quest" data-quest="${esc(x.quest_key)}" type="button">ACCEPT QUEST</button>`;if(x.status!=='active')return '';if(x.quest_key==='side_mill_knocks'&&x.stage===1&&loc==='willowmere')return '<button class="va-primary" data-va="p2-quest-action" data-quest="side_mill_knocks" data-action="inspect_mill">INSPECT THE MILL</button>';if(x.quest_key==='side_mill_knocks'&&x.stage===2&&loc==='old_canto_watch')return '<button class="va-primary" data-va="p2-quest-action" data-quest="side_mill_knocks" data-action="search_watch">SEARCH THE RUIN</button>';if(x.quest_key==='side_mill_knocks'&&x.stage===3&&loc==='willowmere')return '<button class="va-primary" data-va="p2-quest-action" data-quest="side_mill_knocks" data-action="report_mara">REPORT TO MARA</button>';if(x.quest_key==='side_bitter_green'&&loc==='willowmere')return '<button class="va-primary" data-va="p2-quest-action" data-quest="side_bitter_green" data-action="turn_in">GIVE ELSIE THE HERBS</button>';if(x.quest_key==='side_quiet_tracks'&&x.stage===2&&loc==='animal_centre_gate')return '<button class="va-primary" data-va="p2-quest-action" data-quest="side_quiet_tracks" data-action="report">REPORT TO DARWIN</button>';return ''}

function renderJournal(){const quests=safeArray(state.quests);return `${renderInvestigationBoard()}<div class="va-journal-tabs"><span>MAIN STORY</span><span>SIDE QUESTS</span><span>COMPLETED</span></div><div class="va-panel-list">${quests.map(x=>{let action='';if(x.phase2)action=phase2QuestAction(x);else if(x.status==='available'&&state.location?.id===x.start_location_id)action=`<button class="va-primary" data-va="accept-quest" data-quest="${esc(x.quest_key)}" type="button">ACCEPT QUEST</button>`;if(!x.phase2&&x.status==='active'&&x.quest_key==='the_little_things_01'&&x.stage===1&&state.location?.id==='willowmere')action='<button class="va-primary" data-va="quest-deliver" type="button">DELIVER PARCEL</button>';return `<article class="va-list-card ${x.is_main_story?'main-story':''}"><h5>${esc(x.title)}</h5><p>${esc(x.description)}</p><div class="va-list-meta"><span class="va-pill">${esc(x.category)}</span><span class="va-pill">${esc(x.difficulty)}</span><span class="va-pill">${esc(x.status)}</span></div>${x.progress?.objective?`<p><b>Objective:</b> ${esc(x.progress.objective)}</p>`:''}${x.progress?.outcome?`<p><b>Outcome:</b> ${esc(x.progress.outcome)}</p>`:''}${action?`<div class="va-list-actions">${action}</div>`:''}</article>`}).join('')}</div><section class="va-codex-section"><h5>LOCAL THREADS</h5>${renderDynamicQuests()}</section>`}
function relationshipLabel(v){v=Number(v)||0;return v>=60?'Trusted Ally':v>=25?'Friend':v>=8?'Acquaintance':v<=-60?'Enemy':v<=-25?'Rival':v<=-8?'Wary':'Stranger'}


function renderRelationships(){
 const people=safeArray(state.people),comp=state.companion,prom=safeArray(state.social_promises),inv=safeArray(state.social_invitations),fav=safeArray(state.social_favours),stories=safeArray(state.social_stories),reps=safeArray(state.reputations);
 const activeProm=prom.filter(p=>p.status==='active'),activeInv=inv.filter(i=>i.status==='active');
 const compHtml=comp?`<section class="va-people-hero"><div class="va-people-hero-portrait">${esc(comp.portrait_icon||comp.name?.charAt(0)||'•')}</div><div><small>${comp.status==='active'?'ACTIVE COMPANION':comp.status==='waiting'?'WAITING COMPANION':'COMPANION'}</small><h4>${esc(comp.name)}</h4><p>${esc(comp.support_text||comp.role_text||'')}</p><span>${esc(comp.role_text||'Companion')} · ${esc(String(comp.condition||'ready').toUpperCase())}</span></div><div class="va-people-hero-actions">${comp.status==='active'?`<button data-va="p7-companion" data-kind="comment" type="button">ASK WHAT THEY THINK</button><button data-va="p7-companion" data-kind="wait" type="button">WAIT HERE</button><button data-va="p7-companion" data-kind="dismiss" type="button">HEAD HOME</button>`:comp.status==='waiting'&&comp.wait_location_id===state.location?.id?`<button data-va="p7-companion" data-kind="resume" type="button">COME WITH ME</button><button data-va="p7-companion" data-kind="dismiss" type="button">HEAD HOME</button>`:''}</div></section>`:'';
 const events=`${activeInv.length?`<section class="va-people-section"><h5>INVITATIONS</h5><div class="va-social-stack">${activeInv.map(i=>`<article><small>${esc(i.npc_name)} · ${phase7StampText(i.starts_stamp)}–${formatWorldTime(Number(i.ends_stamp)%1440)}</small><b>${esc(i.title)}</b><p>${esc(i.description)}</p><span>${esc(i.location_name)}</span><div>${i.can_attend?`<button data-va="p7-invite" data-id="${esc(i.id)}" data-kind="attend">ATTEND</button>`:''}<button data-va="p7-invite" data-id="${esc(i.id)}" data-kind="decline">DECLINE</button></div></article>`).join('')}</div></section>`:''}${activeProm.length?`<section class="va-people-section"><h5>PROMISES</h5><div class="va-social-stack">${activeProm.map(p=>`<article><small>${esc(p.npc_name)} · ${p.deadline_stamp?phase7StampText(p.deadline_stamp):'NO FIXED DEADLINE'}</small><b>${esc(p.description)}</b><div><button data-va="p7-promise-keep" data-id="${esc(p.id)}" data-npc="${esc(p.npc_key)}">I KEPT THIS PROMISE</button></div></article>`).join('')}</div></section>`:''}${fav.filter(f=>f.status==='available').length?`<section class="va-people-section"><h5>FAVOURS OWED</h5><div class="va-social-stack">${fav.filter(f=>f.status==='available').map(f=>`<article><small>${esc(f.npc_name)}</small><b>${esc(f.reason)}</b><p>A favour is help, not a magical command.</p><button data-va="p7-favour" data-id="${esc(f.id)}">ASK FOR HELP</button></article>`).join('')}</div></section>`:''}`;
 const storyHtml=stories.length?`<section class="va-people-section"><h5>PERSONAL & LOCAL THREADS</h5><div class="va-social-story-grid">${stories.map(renderPhase7Story).join('')}</div></section>`:'';
 const cards=people.length?`<section class="va-people-section"><h5>FRIENDS & ACQUAINTANCES</h5><div class="va-people-grid">${people.map(p=>`<article class="va-person-v7 ${esc(String(p.label||'stranger').toLowerCase().replaceAll(' ','-'))}"><div class="va-person-v7-head"><span>${esc(p.portrait_icon||p.name.charAt(0))}</span><div><small>${esc(p.occupation)} · ${esc(String(p.current_mood||'calm').toUpperCase())}</small><b>${esc(p.name)}</b><em>${esc(p.label||'STRANGER')}</em></div></div><p>${p.last_seen_location_name?`Last seen: ${esc(p.last_seen_location_name)}${p.here_now?' · HERE NOW':''}`:'You have only just crossed paths.'}</p>${safeArray(p.memories).length?`<div class="va-memory-list">${safeArray(p.memories).slice(0,3).map(mm=>`<span class="${esc(mm.sentiment)}">${esc(mm.summary)}</span>`).join('')}</div>`:''}<div class="va-person-v7-actions">${p.companion_candidate&&p.companion_eligible&&p.here_now&&(!comp||comp.status==='dismissed')?`<button data-va="p7-companion" data-kind="join" data-npc="${esc(p.npc_key)}">ASK TO JOIN</button>`:''}${p.here_now?`<button data-va="p7-social" data-kind="ask_opinion" data-npc="${esc(p.npc_key)}">ASK THEIR OPINION</button><button data-va="p7-social" data-kind="apologize" data-npc="${esc(p.npc_key)}">APOLOGISE</button>${state.current_home?.at_home?`<button data-va="p7-social" data-kind="invite_home" data-npc="${esc(p.npc_key)}">INVITE OVER</button>`:''}`:''}</div><details><summary>RELATIONSHIP DETAILS</summary><div class="va-relation-bars"><span>REL ${Number(p.relationship)||0}</span><span>TRUST ${Number(p.trust)||0}</span><span>RESPECT ${Number(p.respect)||0}</span><span>FEAR ${Number(p.fear)||0}</span></div></details></article>`).join('')}</div></section>`:'<div class="va-list-card"><h5>You have not met anyone important yet.</h5></div>';
 return `${compHtml}${events}${storyHtml}<section class="va-codex-section"><h5>LOCAL REPUTATION</h5><div class="va-reputation-list">${reps.length?reps.map(r=>`<div><b>${esc(r.location_name)}</b><span>${esc(r.label)}</span></div>`).join(''):'<p class="va-muted">Nobody has formed much of an opinion about you yet.</p>'}</div></section>${cards}`;
}
function renderCodex(){const herbs=safeArray(state.local_herbs),discoveries=safeArray(state.discoveries),recipes=safeArray(state.recipes),done=Number(state.activity_mastered_count)||0,total=Number(state.activity_total_count)||0,pct=Math.round(done/Math.max(1,total)*100);return `<section class="va-codex-section"><h5>WORLD FIELDCRAFT</h5><div class="va-codex-mastery"><div><small>LOCAL ACTIVITY MASTERY</small><b>${done} / ${total}</b></div><i style="--p:${pct}%"><span></span></i><p>Explore settlements, ruins, rivers and wild places. First successful clears can add field notes, keepsakes and modest Adventure progression.</p></div></section><section class="va-codex-section"><h5>LOCAL HERBALISM</h5>${herbs.length?herbs.map(h=>`<article class="va-field-card"><span class="va-field-icon">${esc(h.icon||'✦')}</span><div><b>${esc(h.name)}</b><p>${esc(h.description)}</p><small>${esc(h.rarity)}${h.cooldown_minutes?` · regrows in ${Number(h.cooldown_minutes)}m`:''}</small></div><div>${h.identified?`<button data-va="gather-herb" data-herb="${esc(h.herb_key)}" data-method="${esc(h.harvest_method)}" ${h.cooldown_minutes?'disabled':''} type="button">${h.cooldown_minutes?'REGROWING':esc(String(h.harvest_method).toUpperCase())}</button>`:`<button data-va="inspect-herb" data-herb="${esc(h.herb_key)}" type="button">IDENTIFY</button>`}</div></article>`).join(''):'<p class="va-muted">No harvestable plants stand out here.</p>'}</section><section class="va-codex-section"><h5>BREWING</h5>${recipes.map(r=>`<article class="va-list-card"><h5>${esc(r.name)}</h5><p>${esc(r.description)}</p><div class="va-list-actions"><button data-va="brew" data-recipe="${esc(r.recipe_key)}" ${(!r.unlocked||state.location?.id!=='willowmere')?'disabled':''} type="button">${r.unlocked?(state.location?.id==='willowmere'?'BREW AT ELSIE’S BENCH':'BREW IN WILLOWMERE'):'RECIPE UNKNOWN'}</button></div></article>`).join('')}</section><section class="va-codex-section"><h5>DISCOVERIES</h5><div class="va-discovery-grid">${discoveries.slice(0,40).map(d=>`<div><small>${esc(String(d.discovery_type).toUpperCase())}</small><b>${esc(d.name)}</b></div>`).join('')}</div></section>`}

function renderJobs(){const atBoard=state.location?.id==='canto_crossing',jobs=safeArray(state.jobs);return `<p class="va-resume-summary"><b>Canto Crossing Job Board</b><br>Rotating contracts remain predictable work. Phase 3 also lets nearby people generate small local favours from approved templates.</p><div class="va-list-actions"><button class="va-primary" data-va="generate-microquest" type="button">ASK AROUND FOR SMALL WORK</button></div><h5 class="va-section-label">LOCAL THREADS</h5>${renderDynamicQuests()}<h5 class="va-section-label">BOARD CONTRACTS</h5><div class="va-panel-list">${jobs.map(j=>{let action='';if(j.status==='available')action=`<button class="va-primary" data-va="${j.phase2?'accept-p2-job':'accept-job'}" data-job="${esc(j.id)}" ${atBoard?'':'disabled'} type="button">${atBoard?'ACCEPT CONTRACT':'RETURN TO CANTO BOARD'}</button>`;if(j.status==='active'&&state.location?.id===j.destination_location_id)action=`<button class="va-primary" data-va="${j.phase2?'complete-p2-job':'complete-job'}" data-job="${esc(j.id)}" type="button">COMPLETE CONTRACT</button>`;return `<article class="va-list-card"><h5>${esc(j.title)}</h5><p>${esc(j.description)}</p><div class="va-list-meta"><span class="va-pill">${esc(PROF_LABELS[j.profession_key]||j.profession_key)}</span><span class="va-pill">${esc(j.difficulty)}</span><span class="va-pill">${esc(j.status)}</span></div><p><b>Destination:</b> ${esc(j.destination_name)} · <b>Rewards:</b> ${Number(j.reward_gold)} gold · ${Number(j.reward_adventure_xp)} Adventure XP · ${Number(j.reward_profession_xp)} ${esc(PROF_LABELS[j.profession_key]||j.profession_key)} XP</p>${action?`<div class="va-list-actions">${action}</div>`:''}</article>`}).join('')}</div>`}
function renderAdmin(){if(!state.admin)return '<p>Admin only.</p>';const a=state.adventure;return `<div class="va-admin-note">SERVER-VALIDATED TEST PANEL · affects only your Adventures save. Other site systems are untouched.</div><div class="va-admin"><div class="va-admin-row"><label>Adventure XP<input id="vaAdminXp" type="number" min="0" max="13034431" value="${Number(a.xp)||0}"></label><label>Gold<input id="vaAdminGold" type="number" min="0" max="1000000000" value="${Number(a.gold)||0}"></label></div><div class="va-admin-row"><label>World day<input id="vaAdminDay" type="number" min="1" max="9999" value="${Number(a.world_day)||1}"></label><label>Minute of day<input id="vaAdminMinute" type="number" min="0" max="1439" value="${Number(a.world_minute)||480}"></label></div><div class="va-admin-row"><label>Location<select id="vaAdminLocation">${safeArray(state.world_locations||state.map_locations).filter(x=>x.known!==false).map(x=>`<option value="${esc(x.id)}" ${x.id===a.location_id?'selected':''}>${esc(x.real_name||x.name)}</option>`).join('')}</select></label><label>Weather<select id="vaAdminWeather">${['clear','cloudy','rain','mist','storm','snow','heat'].map(x=>`<option ${x===a.weather?'selected':''}>${x}</option>`).join('')}</select></label></div><button class="va-primary" data-va="admin-apply" type="button">APPLY DEBUG STATE</button><div class="va-admin-phase5"><h5>PHASE 5 COMBAT</h5><button data-va="phase5-admin" data-kind="restore_hp" type="button">RESTORE HP</button><button data-va="phase5-admin" data-kind="clear_combat" type="button">CLEAR COMBAT</button><select id="vaAdminEnemy"><option value="angry_boar">Angry Boar</option><option value="marsh_stalker">Marsh Stalker</option><option value="tide_wisp">Tide Wisp</option><option value="highweald_wolf">Highweald Wolf</option><option value="surveyors_automaton">Surveyor's Automaton</option></select><button data-va="phase5-admin-spawn" type="button">SPAWN SELECTED ENCOUNTER</button></div><div class="va-admin-phase5"><h5>PHASE 6 TOWN LIFE</h5><select id="vaAdminP6Property">${safeArray(state.properties).map(p=>`<option value="${esc(p.property_key)}">${esc(p.name)}</option>`).join('')}</select><button data-va="p6-admin-property" type="button">UNLOCK PROPERTY</button><button data-va="p6-admin" data-kind="clear_work" type="button">CLEAR TODAY'S WORK CAPS</button></div><div class="va-admin-phase5 va-admin-phase7"><h5>PHASE 7 PEOPLE</h5><select id="vaAdminP7Npc">${safeArray(state.companion_candidates).map(p=>`<option value="${esc(p.npc_key)}">${esc(p.name)}</option>`).join('')}</select><button data-va="p7-admin" data-kind="unlock_companion" type="button">UNLOCK COMPANION</button><button data-va="p7-admin" data-kind="force_companion" type="button">FORCE ACTIVE</button><button data-va="p7-admin" data-kind="set_relationship" data-value="40" type="button">SET RELATIONSHIP 40</button><button data-va="p7-admin" data-kind="spawn_invitation" type="button">SPAWN INVITATION</button><button data-va="p7-admin" data-kind="advance_consequences" type="button">ADVANCE CONSEQUENCES</button><button data-va="p7-admin" data-kind="clear_social_test" type="button">CLEAR PHASE 7 TEST STATE</button></div></div>`}

  function mainQuest(){const ms=safeArray(state?.quests).filter(x=>x.is_main_story);return ms.find(x=>x.status==='active')||ms.find(x=>x.quest_key==='the_little_things_02'&&x.status==='available')||ms.find(x=>x.status==='available')||ms.slice().reverse().find(x=>x.status==='completed')}
  function objectiveTitle(){const q=mainQuest();if(q?.status==='active')return q.title;const job=safeArray(state?.jobs).find(j=>j.status==='active');if(job)return job.title;return q?.status==='available'?'The Little Things':'No objective tracked'}
  function objectiveText(){const q=mainQuest();if(q?.status==='active'&&q.progress?.objective)return q.progress.objective;if(q?.quest_key==='the_little_things_02'&&q.status==='available')return 'The brass token is still unexplained. Nell Bristlebell may recognise the mark.';if(q?.status==='available')return 'Check the Canto Crossing notice board. A courier has a small job that needs doing.';const job=safeArray(state?.jobs).find(j=>j.status==='active');if(job)return `Reach ${job.destination_name} and complete the contract.`;return 'Talk to people, work a contract, track wildlife, gather plants or scout beyond known roads.'}

  async function onClick(e){const target=e.target.closest('[data-va]');if(!target)return;const action=target.dataset.va;playClick();try{
    if(action==='dialogue-close'){target.closest('.va-dialogue-overlay')?.remove();activeConversation=null;return}
    if(action==='activity-result-close'){const o=target.closest('.va-activity-result');if(o){o.classList.remove('show');setTimeout(()=>o.remove(),180)}return}
    if(action==='retry'){renderLoading('Reloading…');state=await loadFullState();view='entry';render();return}
    if(action==='back-quests'){backToQuests();return}
    if(action==='exit-game'){await saveAndExit();return}
    if(action==='begin-create'){Object.assign(creation,{step:0,name:state?.account_username||'',homeland:'Elvane',background:'Apprentice Explorer',archetype:'Ranger'});view='create';render();return}
    if(action==='continue'){view='game';lastNarrative=state.adventure.last_summary||'';lastRenderedNarrative='';render();return}
    if(action==='journal-entry'){view='game';drawer='journal';lastNarrative=state.adventure.last_summary||'';lastRenderedNarrative='';render();return}
    if(action==='new-adventure'){view='reset';render();return}
    if(action==='cancel-reset'){view='entry';render();return}
    if(action==='confirm-reset'){if(el('vaResetConfirm')?.value!=='RESET')return;renderLoading('Erasing Adventure save…');state=await callRpc('adventure_reset_character');view='create';Object.assign(creation,{step:0,name:state.account_username||'',homeland:'Elvane',background:'Apprentice Explorer',archetype:'Ranger'});render();return}
    if(action==='choose'){creation[target.dataset.key]=target.dataset.value;renderCreate();return}
    if(action==='create-back'){if(creation.step===0){view='entry';render()}else{creation.step--;renderCreate()}return}
    if(action==='create-next'){if(creation.step===0){creation.name=(el('vaCreateName')?.value||'').trim();if(creation.name.length<2){notify('Choose an adventurer name first.');return}}creation.step=Math.min(4,creation.step+1);renderCreate();return}
    if(action==='create-submit'){renderLoading('Creating your persistent Adventure…');const base=await callRpc('adventure_create_character',{p_name:creation.name,p_homeland:creation.homeland,p_background:creation.background,p_archetype:creation.archetype});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});const p23=await callRpc('adventure_phase23_get_state',{}, {silent:true});const p3=await callRpc('adventure_phase3_get_state',{}, {silent:true});const p4=await callRpc('adventure_phase4_get_state',{}, {silent:true});const p5=await callRpc('adventure_phase5_get_state',{}, {silent:true});const p6=await callRpc('adventure_phase6_get_state',{}, {silent:true});const p7=await callRpc('adventure_phase7_get_state',{}, {silent:true});try{phase5Shops=safeArray(await callRpc('adventure_phase5_get_shops',{}, {silent:true}))}catch(_){phase5Shops=[]}state=mergePhase7(mergePhase6(mergePhase5(mergePhase4(mergePhase3(mergePhase23(mergePhase2(base,p2),p23),p3),p4),p5),p6),p7);view='game';lastRenderedNarrative='';lastNarrative=state.adventure.last_summary;mapRegionKey=state.current_region_key;render();queueBanner('WELCOME TO VELMORA', state.location?.name||'Canto Crossing', 'A new life begins. The road beyond Canto is open.');saved();return}
    if(action==='open-drawer'){drawer=target.dataset.drawer;renderDrawer();return}
    if(action==='close-drawer'){drawer=null;renderDrawer();return}
    if(action==='phase4-region'){mapRegionKey=target.dataset.region||state.current_region_key;renderDrawer();return}
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
    if(action==='dynamic-suggestion'){const input=el('vaCustomInput');if(input){input.value=target.dataset.text||'';input.focus()}return}
    if(action==='feature-prompt'){const input=el('vaCustomInput');if(input){input.value=`Inspect ${target.dataset.feature||''}`;input.focus()}return}
    if(action==='phase3-event-action'){await resolveDynamicIntent({actionType:target.dataset.kind||'help',targetType:'event',targetKey:target.dataset.event,rawText:`${target.dataset.kind||'help'} with the local event`});return}
    if(action==='phase3-check-close'){target.closest('.va-phase3-check')?.remove();return}
    if(action==='ambiguity-cancel'){target.closest('.va-ambiguity-overlay')?.remove();pendingAmbiguityRaw='';return}
    if(action==='ambiguity-npc'){const raw=pendingAmbiguityRaw;target.closest('.va-ambiguity-overlay')?.remove();pendingAmbiguityRaw='';await resolveDynamicRaw(raw,target.dataset.npc);return}
    if(action==='generate-microquest'){await generateMicroquest();return}
    if(action==='microquest-resolve'){await microquestAction(target.dataset.quest,'resolve');return}
    if(action==='microquest-abandon'){await microquestAction(target.dataset.quest,'abandon');return}
    if(action==='phase3-admin-event'){await phase3Admin('spawn_event',target.dataset.event);return}
    if(action==='phase3-admin-clear-events'){await phase3Admin('clear_events','');return}
    if(action==='local-activity'){await doLocalActivity(target.dataset.activity);return}
    if(action==='prep-cancel'){target.closest('.va-prep-overlay')?.remove();return}
    if(action==='travel-confirm'){target.closest('.va-prep-overlay')?.remove();await travel(target.dataset.location,true);return}

if(action==='p7-companion'){await phase7Companion(target.dataset.kind,target.dataset.npc||null);return}
if(action==='p7-scene'){await phase7Scene(target.dataset.scene);return}
if(action==='p7-invite'){await phase7Invitation(target.dataset.id,target.dataset.kind);return}
if(action==='p7-social'){await phase7Social(target.dataset.kind,target.dataset.npc,'',null,null);return}
if(action==='p7-promise-keep'){await phase7Social('keep_promise',target.dataset.npc,'',target.dataset.id,null);return}
if(action==='p7-favour'){await phase7Favour(target.dataset.id);return}
if(action==='p7-story'){await phase7Story(target.dataset.story,target.dataset.kind,target.dataset.option||null);return}
if(action==='p7-admin'){await phase7Admin(target.dataset.kind,el('vaAdminP7Npc')?.value||null,target.dataset.value?Number(target.dataset.value):null,null);return}
    if(action==='p6-property'){await phase6Property(target.dataset.property,target.dataset.kind);return}
    if(action==='p6-upgrade'){await phase6Upgrade(target.dataset.upgrade);return}
    if(action==='p6-storage'){await phase6Storage(target.dataset.kind,target.dataset.item,Number(target.dataset.qty)||1);return}
    if(action==='p6-display-add'){await phase6Display('add',target.dataset.type,target.dataset.key,null);return}
    if(action==='p6-display-remove'){await phase6Display('remove',null,null,Number(target.dataset.slot));return}
    if(action==='p6-decor'){await phase6Decor('buy_place',target.dataset.decor,null);return}
    if(action==='p6-decor-remove'){await phase6Decor('remove',null,Number(target.dataset.slot));return}
    if(action==='p6-rest'){await phase6Rest(target.dataset.kind,target.dataset.mode);return}
    if(action==='p6-transport'){await phase6Transport(target.dataset.route);return}
    if(action==='p6-shop'){await phase6Shop(target.dataset.shop,target.dataset.kind,target.dataset.item,Number(target.dataset.qty)||1);return}
    if(action==='p6-work'){await phase6Work(target.dataset.shift);return}
    if(action==='p6-craft'){await phase6Craft(target.dataset.recipe,1);return}
    if(action==='p6-letter'){await phase6ReadLetter(target.dataset.letter);return}
    if(action==='p6-title'){await phase6SetTitle(target.dataset.title);return}
    if(action==='p6-admin-property'){await phase6Admin('unlock_property',el('vaAdminP6Property')?.value,null);return}
    if(action==='p6-admin'){await phase6Admin(target.dataset.kind,target.dataset.key||null,target.dataset.value?Number(target.dataset.value):null);return}
    if(action==='phase5-equip'){await phase5Equip(target.dataset.item,target.dataset.slot);return}
    if(action==='phase5-shop'){await phase5Shop(target.dataset.shop,target.dataset.kind,target.dataset.item);return}
    if(action==='combat-action'){await combatAction(target.dataset.kind,target.dataset.ability||null,target.dataset.item||null,target.dataset.position||null);return}
    if(action==='combat-free'){await combatFreeAction();return}
    if(action==='expedition-enter'){target.closest('.va-prep-overlay')?.remove();await expeditionEnter(target.dataset.expedition);return}
    if(action==='expedition-action'){await expeditionAction(target.dataset.kind,target.dataset.room||null,null);return}
    if(action==='expedition-free'){await expeditionFreeAction();return}
    if(action==='phase5-admin'){await phase5Admin(target.dataset.kind,null);return}
    if(action==='phase5-admin-spawn'){await phase5Admin('spawn_enemy',el('vaAdminEnemy')?.value||'angry_boar');return}
    if(action==='custom-submit'){await customAction();return}
    if(action==='admin-apply'){await adminApply();return}
  }catch(err){hideProcessing();console.error('[Velmora Adventures]',err);notify(err?.message||'Adventure action failed.');if(view==='game')render()}}
  function onInput(e){if(e.target.id==='vaCreateName')creation.name=e.target.value;if(e.target.id==='vaResetConfirm'){const b=q('[data-va="confirm-reset"]');if(b)b.disabled=e.target.value!=='RESET'}}


async function travel(id,confirmed=false){const dest=safeArray(state?.world_locations||state?.map_locations).find(x=>x.id===id),dg=dangerFor(id);if(!confirmed&&['moderate','high'].includes(dg.danger_tier)){showTravelPreparation(id);return}const prev=snapshotState();showSceneTransition('TRAVEL', dest?.real_name||dest?.name||'On the road');showProcessing('TRAVEL', `Heading to ${dest?.real_name||dest?.name||'the next stop'}`, 'Checking the road, weather and whether anything has decided to make itself your problem.');const res=await callRpc('adventure_phase5_travel',{p_location_id:id});takePhase5Result(res);await refreshPhase23();await refreshPhase3();await refreshPhase4();await refreshPhase5();await refreshPhase6();await refreshPhase7();view='game';mapRegionKey=state.current_region_key;lastRenderedNarrative='';lastNarrative=state.active_combat?(res.encounter_detected?'You notice movement before the danger can fully close in.':'The road stops being peaceful rather abruptly.'):state.adventure.last_summary;dynamicSuggestions=[];render();renderStateFeedback(prev,state,'travel');const reg=safeArray(state.world_regions).find(r=>r.region_key===state.current_region_key);if(reg&&prev.locationId!==state.location?.id&&dest?.region_key!==safeArray(state.world_locations).find(x=>x.id===prev.locationId)?.region_key)queueBanner('REGION ENTERED',reg.name,reg.description,'discovery');if(state.active_combat)queueBanner(res.encounter_detected?'DANGER SPOTTED':'ENCOUNTER',state.active_combat.enemy_name,res.encounter_detected?'You saw it coming and begin guarded.':'The road has other plans.','quest');hideSceneTransition();saved()}
async function acceptQuest(key){const prev=snapshotState();showProcessing('MAIN STORY','Accepting quest','A simple errand has a habit of becoming something else.');const base=await callRpc('adventure_accept_quest',{p_quest_key:key});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});state=mergePhase2(base,p2);await refreshPhase3();lastRenderedNarrative='';lastNarrative='A courier presses a green-corded parcel into your hands. “Willowmere. Straight there, ideally.”';render();renderStateFeedback(prev,state,'quest');saved()}
  async function deliverMain(){const prev=snapshotState();showProcessing('MAIN STORY','Delivering parcel','For a moment, it looks like the smallest job in Velmora.');const base=await callRpc('adventure_quest_action',{p_quest_key:'the_little_things_01',p_action:'deliver'});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});state=mergePhase2(base,p2);await refreshPhase3();lastRenderedNarrative='';lastNarrative='The recipient turns the parcel over, then pauses. A thin brass token has been trapped beneath the cord. Three tiny prongs are stamped into one side. “That is not mine,” they say.';render();renderStateFeedback(prev,state,'quest');saved()}
  async function acceptJob(id){const prev=snapshotState();showProcessing('CONTRACT','Taking job','Checking requirements against your satchel and route.');const base=await callRpc('adventure_accept_job',{p_job_id:id});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});state=mergePhase2(base,p2);await refreshPhase3();lastRenderedNarrative='';lastNarrative=state.adventure.last_summary;render();drawer='jobs';renderDrawer();renderStateFeedback(prev,state,'job');saved()}
  async function completeJob(id){const prev=snapshotState();showProcessing('CONTRACT','Completing job','Making sure every detail matches what was asked for.');const base=await callRpc('adventure_complete_job',{p_job_id:id});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});state=mergePhase2(base,p2);await refreshPhase3();lastRenderedNarrative='';lastNarrative=state.adventure.last_summary;render();drawer='jobs';renderDrawer();renderStateFeedback(prev,state,'job');saved()}
  async function acceptP2Job(id){const prev=snapshotState();showProcessing('CONTRACT','Taking contract','Routes, fieldwork and obligations settle into place.');const res=await callRpc('adventure_phase2_accept_job',{p_job_id:id});takePhase2Result(res);await refreshPhase3();lastRenderedNarrative='';lastNarrative='The clerk marks the contract active and points out the route on a battered local map.';render();drawer='jobs';renderDrawer();renderStateFeedback(prev,state,'job');saved()}
  async function completeP2Job(id){const prev=snapshotState();showProcessing('CONTRACT','Completing contract','Turning good fieldwork into something that actually pays.');const res=await callRpc('adventure_phase2_complete_job',{p_job_id:id});takePhase2Result(res);await refreshPhase3();lastRenderedNarrative='';lastNarrative=state.adventure.last_summary;render();drawer='jobs';renderDrawer();renderStateFeedback(prev,state,'job');saved()}
  async function acceptP2Quest(key){const prev=snapshotState();showProcessing('QUEST','Following a lead','Quiet mysteries rarely stay quiet for long.');const res=await callRpc('adventure_phase2_accept_quest',{p_quest_key:key});takePhase2Result(res);await refreshPhase3();lastRenderedNarrative='';lastNarrative=state.adventure.last_summary;render();renderStateFeedback(prev,state,'quest');saved()}
  async function p2QuestAction(key,action){const prev=snapshotState();showProcessing('QUEST','Resolving scene','Pausing just long enough for the world to answer back.');const res=await callRpc('adventure_phase2_quest_action',{p_quest_key:key,p_action:action});takePhase2Result(res);await refreshPhase3();lastRenderedNarrative='';lastNarrative=res.message||state.adventure.last_summary;render();renderStateFeedback(prev,state,'quest');saved()}
  async function talkNpc(key,topic='hello'){
    lastNpcKey=key;
    const prev=snapshotState();
    showProcessing('CONVERSATION','Approaching conversation','Reading posture, tone and what they might not say aloud.');
    let res;
    try{
      res=topic==='hello'
        ?await callRpc('adventure_phase7_greeting',{p_npc_key:key})
        :await callRpc('adventure_phase2_talk',{p_npc_key:key,p_topic:topic});
    }catch(err){
      // Phase 7 greeting is an enhancement. A character card must still work if that enhancement fails.
      if(topic==='hello')res=await callRpc('adventure_phase2_talk',{p_npc_key:key,p_topic:'hello'});
      else throw err;
    }
    takePhase2Result(res);
    if(res?.phase7)state=mergePhase7(state,res.phase7);
    await refreshPhase3();
    try{await refreshPhase7()}catch(_){}
    activeConversation={npc:res?.npc,topics:res?.topics||{},dialogue:res?.dialogue||''};
    if(!activeConversation.npc)throw new Error('That character could not be opened.');
    lastRenderedNarrative='';
    lastNarrative=`${activeConversation.npc.name||'Someone'}: “${activeConversation.dialogue||''}”`;
    render();
    showConversation(activeConversation);
    renderStateFeedback(prev,state,'social');
    saved();
  }
  function showConversation(c){if(!c?.npc)return;hideProcessing();q('.va-dialogue-overlay')?.remove();const overlay=document.createElement('div');overlay.className='va-dialogue-overlay';overlay.innerHTML=`<div class="va-dialogue-card"><div class="va-dialogue-portrait">${esc(c.npc.portrait_icon||c.npc.name.charAt(0))}</div><div class="va-dialogue-copy"><small>${esc(c.npc.occupation)}</small><h4>${esc(c.npc.name)}</h4><p class="va-dialogue-line"></p><div class="va-dialogue-topics">${Object.keys(c.topics||{}).slice(0,5).map(t=>`<button data-va="talk-topic" data-npc="${esc(c.npc.npc_key)}" data-topic="${esc(t)}" type="button">${esc(t.toUpperCase())}</button>`).join('')}<button data-va="dialogue-close" type="button">LEAVE</button></div><small class="va-dialogue-tip">Tap a topic to keep talking, or LEAVE when you're done.</small></div></div>`;el('vaStage').appendChild(overlay);requestAnimationFrame(()=>overlay.classList.add('show'));typeText(overlay.querySelector('.va-dialogue-line'), `“${c.dialogue||''}”`, {speed:10});}
  async function inspectHerb(key){const prev=snapshotState();showProcessing('HERBALISM','Inspecting plant','Checking veins, scent and whether it should be cut or left alone.');const res=await callRpc('adventure_phase2_inspect_herb',{p_herb_key:key});takePhase2Result(res);await refreshPhase3();lastRenderedNarrative='';lastNarrative=res.message;render();drawer='codex';renderDrawer();renderStateFeedback(prev,state,'herbalism');saved()}
  async function gatherHerb(key,method){const prev=snapshotState();showProcessing('HERBALISM','Harvesting carefully', `Using ${String(method||'the right method').toUpperCase()} on the plant.`);const res=await callRpc('adventure_phase2_gather_herb',{p_herb_key:key,p_method:method});takePhase2Result(res);await refreshPhase3();lastRenderedNarrative='';lastNarrative=res.message;render();drawer='codex';renderDrawer();renderStateFeedback(prev,state,'herbalism');saved()}
  async function brew(key){const prev=snapshotState();showProcessing('BREWING','Brewing recipe','Measuring, grinding and watching the colour turn.');const res=await callRpc('adventure_phase2_brew',{p_recipe_key:key});takePhase2Result(res);await refreshPhase3();lastRenderedNarrative='';lastNarrative=res.message;render();drawer='codex';renderDrawer();renderStateFeedback(prev,state,'brew');saved()}
  async function wildlifeSearch(){const prev=snapshotState();showProcessing('WILDLIFE','Searching quietly','Following tracks, listening for brush movement and keeping still.');const res=await callRpc('adventure_phase2_wildlife_search');takePhase2Result(res);await refreshPhase3();lastRenderedNarrative='';lastNarrative=res.message;render();renderStateFeedback(prev,state,'wildlife');saved()}
  async function wildlifeAction(action){const prev=snapshotState();showProcessing('WILDLIFE', action==='observe'?'Observing wildlife':action==='feed'?'Offering feed':'Backing away', 'Tiny movements matter here.');const res=await callRpc('adventure_phase2_wildlife_action',{p_action:action});takePhase2Result(res);await refreshPhase3();lastRenderedNarrative='';lastNarrative=res.message;render();renderStateFeedback(prev,state,'wildlife');saved()}
  async function scout(){const prev=snapshotState();showProcessing('EXPLORATION','Scouting ahead','Looking for an opening beyond the familiar road.');const res=await callRpc('adventure_phase4_scout');takePhase2Result(res);await refreshPhase23();await refreshPhase3();await refreshPhase4();lastRenderedNarrative='';lastNarrative=res.message;render();renderStateFeedback(prev,state,'exploration');saved()}


async function resolveDynamicRaw(raw,forcedNpcKey=null){
  const text=String(raw||'').trim();if(!text)return;pushCommand(text);showProcessing('YOUR ACTION','Considering your approach…','Reading the scene, your inventory and what the world actually knows.');
  const context=buildContextPack();const interpreted=await AdventureNarrator.interpret({rawText:text,forcedNpcKey,context});
  if(interpreted?.ambiguous){showAmbiguity(text,interpreted.options||[]);return}
  const intent=normaliseIntent(interpreted?.intent||interpreted,text);if(!intent){hideProcessing();lastRenderedNarrative='';setNarrative('You can phrase that another way, or use one of the visible world details as an anchor.');return}
  lastPhase3Debug={input:text,context,interpretedIntent:intent,interpreterSource:interpreted?.source||'rules'};
  return resolveDynamicIntent(intent);
}
async function resolveDynamicIntent(intent){
  const normal=normaliseIntent(intent,intent?.rawText||'');if(!normal)throw new Error('That action could not be safely interpreted.');const prev=snapshotState();
  if(!processingState)showProcessing('YOUR ACTION','Resolving in Velmora…','The server is checking the target, difficulty, time and allowed consequences.');
  const res=await callRpc('adventure_phase3_resolve_action',{p_intent:normal});takePhase2Result(res);await refreshPhase7();dynamicSuggestions=safeArray(res?.resolution?.suggested_actions);lastRenderedNarrative='';lastNarrative=res?.resolution?.message||state?.adventure?.last_summary||'';lastPhase3Debug={...(lastPhase3Debug||{}),serverResult:res?.resolution||null};view='game';render();renderStateFeedback(prev,state,'dynamic');if(res?.resolution?.roll!=null)showPhase3Check(res.resolution);saved();return res;
}
async function generateMicroquest(npcKey=null){const prev=snapshotState();showProcessing('LOCAL WORK','Asking around…','Looking for a small problem that fits the people and roads around you.');const res=await callRpc('adventure_phase3_generate_microquest',{p_npc_key:npcKey||null});takePhase2Result(res);lastRenderedNarrative='';lastNarrative=res.message||state.adventure?.last_summary||'';render();drawer='jobs';renderDrawer();renderStateFeedback(prev,state,'microquest');saved()}
async function microquestAction(id,action='resolve'){const prev=snapshotState();showProcessing('LOCAL WORK',action==='abandon'?'Letting the job go…':'Resolving the job…','The server checks place, difficulty and one-time rewards.');const res=await callRpc('adventure_phase3_microquest_action',{p_quest_id:id,p_action:action});takePhase2Result(res);lastRenderedNarrative='';lastNarrative=res?.resolution?.message||res?.message||state.adventure?.last_summary||'';render();drawer='jobs';renderDrawer();renderStateFeedback(prev,state,'microquest');if(res?.resolution?.roll!=null)showPhase3Check(res.resolution);saved()}
async function phase3Admin(action,key=''){if(!state.admin)return;showProcessing('ADMIN','Updating Phase 3 debug state…','Adventure-only testing.');const res=await callRpc('adventure_phase3_admin',{p_action:action,p_key:key||null});state=mergePhase3(state,res.phase3||{});lastRenderedNarrative='';render();drawer='admin';renderDrawer();saved()}
async function saveAndExit(){try{showProcessing('SAVE','Writing today into your journal…','Structuring the last few things you actually did.');const res=await callRpc('adventure_phase3_save_recap');if(res?.base)state=mergePhase3(mergePhase23(mergePhase2(res.base,phase2||{}),{local_activities:state.local_activities,activity_mastered_count:state.activity_mastered_count,activity_total_count:state.activity_total_count}),res.phase3||phase3)}catch(err){console.warn('[Adventures] recap save fell back to normal autosave',err)}finally{hideProcessing();backToQuests()}}


async function sceneAction(key){if(!key)return;if(key.startsWith('travel:'))return travel(key.split(':')[1]);if(key==='accept-main')return acceptQuest('the_little_things_01');if(key==='deliver-main')return deliverMain();if(key.startsWith('accept-p2:'))return acceptP2Quest(key.split(':')[1]);if(key.startsWith('quest-p2:')){const [,q,a]=key.split(':');return p2QuestAction(q,a)}if(key==='wildlife-search')return wildlifeSearch();if(key==='scout')return scout();if(key==='open-codex-herbs'){drawer='codex';renderDrawer();return}if(key==='drawer-jobs'){drawer='jobs';renderDrawer();return}if(key==='open-shop'){drawer='shops';renderDrawer();return}if(key==='town-life'){drawer='town';renderDrawer();return}if(key==='go-home'){drawer='home';renderDrawer();return}if(key==='camp')return phase5Camp();if(key.startsWith('expedition:'))return showExpeditionPreparation(key.split(':')[1]);if(key==='finish-job'){const j=safeArray(state.jobs).find(x=>x.status==='active'&&x.destination_location_id===state.location.id);if(j)return j.phase2?completeP2Job(j.id):completeJob(j.id)}if(key==='check-perception')return doCheck('perception',12,checkContext());if(key==='check-survival')return doCheck('survival',11,checkContext())}

function checkContext(){const id=state.location?.id;return id==='canto_crossing'?'old clock markings':id==='willowmere'?'mill wheel':id==='riverglass_ford'?'crossing stones':id==='animal_centre_gate'?'keeper notices':'meadow survey'}
  async function doCheck(stat,dc,context){const r=await callRpc('adventure_roll_check',{p_stat:stat,p_dc:dc,p_context:context});showDice(r,context)}
  function showDice(r,context){const degree=String(r.degree||'failure');const nice=degree.replaceAll('_',' ').toUpperCase();const outcomes={critical_success:'You catch a detail that would have been easy to miss.',success:'You notice enough to form a useful impression.',failure:'Nothing certain separates itself from the ordinary details.',critical_failure:'You become very confident about something that is probably irrelevant.'};const overlay=document.createElement('div');overlay.className='va-dice-overlay';overlay.innerHTML=`<div class="va-dice-card"><small>${esc(String(r.stat).toUpperCase())} CHECK · ${esc(context)}</small><div class="va-die is-rolling">?</div><div class="va-dice-breakdown"><h4>${Number(r.roll)||0} + ${Number(r.modifier)||0} = ${Number(r.total)||0}</h4><div class="va-dice-total">DC ${Number(r.dc)||0}</div><span class="va-degree ${esc(degree)}">${esc(nice)}</span><p>${esc(outcomes[degree]||outcomes.failure)}</p><button class="va-primary" data-va="dice-close" type="button">CONTINUE</button></div></div>`;el('vaStage').appendChild(overlay);requestAnimationFrame(()=>overlay.classList.add('show'));const die=overlay.querySelector('.va-die');const breakdown=overlay.querySelector('.va-dice-breakdown');setTimeout(()=>{die.classList.remove('is-rolling');die.textContent=String(Number(r.roll)||1);breakdown.classList.add('show');},420);overlay.querySelector('[data-va="dice-close"]').addEventListener('click',()=>{playClick();lastRenderedNarrative='';lastNarrative=outcomes[degree]||outcomes.failure;overlay.remove();setNarrative(lastNarrative,false);saved()},{once:true})}


async function customAction(){const input=el('vaCustomInput'),raw=(input?.value||'').trim();if(!raw)return;input.value='';const s=raw.toLowerCase();
  if(await tryPhase7Command(raw))return;
  if(/\b(home|my house|my room|cottage|loft|cabin|storage)\b/.test(s)&&state.current_home){drawer='home';renderDrawer();return}
  if(/sleep until morning/.test(s))return phase6Rest(currentHomeAtLocation()?'home':'inn','morning');
  if(/wait until evening/.test(s)&&currentHomeAtLocation())return phase6Rest('home','evening');
  if(/\b(inn|rest at the inn)\b/.test(s)&&state.town_services?.has_inn)return phase6Rest('inn','short');
  if(/\b(mail|letter|postbox|post box)\b/.test(s)){const l=state.letters.find(x=>!x.read&&(s.includes(String(x.sender).toLowerCase())||s.includes(String(x.subject).toLowerCase())));if(/read/.test(s)&&l)return phase6ReadLetter(l.id);drawer='mail';renderDrawer();return}
  if(/\b(journey|collection|region progress|title)\b/.test(s)){drawer='journey';renderDrawer();return}
  if(/\b(town services|property office|work shift|coach|ferry|carriage|transport)\b/.test(s)){const r=state.transport_routes.find(x=>s.includes(String(x.destination_name).toLowerCase()));if(r&&/take|catch|travel|go/.test(s))return phase6Transport(r.route_key);drawer='town';renderDrawer();return}
  const rec=state.crafting_recipes.find(r=>s.includes(String(r.name).toLowerCase()));if(rec&&/cook|craft|make|prepare/.test(s))return phase6Craft(rec.recipe_key,1);
  const bm=s.match(/\bbuy\s+(?:(\d+)\s+)?(.+)/);if(bm&&state.town_shops.length){const qty=Math.max(1,Math.min(20,Number(bm[1])||1)),nm=bm[2].trim();for(const sh of state.town_shops){const i=sh.stock.find(x=>nm.includes(String(x.name).toLowerCase())||String(x.name).toLowerCase().includes(nm));if(i)return phase6Shop(sh.shop_key,'buy',i.item_key,qty)}}
  const sm=s.match(/\bsell\s+(?:(\d+)\s+)?(.+)/);if(sm&&state.town_shops.length){const qty=Math.max(1,Math.min(20,Number(sm[1])||1)),nm=sm[2].trim(),i=state.inventory.find(x=>nm.includes(String(x.name).toLowerCase())||String(x.name).toLowerCase().includes(nm));if(i)return phase6Shop(state.town_shops[0].shop_key,'sell',i.item_key,qty)}
  if(/\b(inventory|bag|satchel)\b/.test(s)){drawer='inventory';renderDrawer();return}
  if(/\b(map|where am i|travel options)\b/.test(s)){drawer='map';renderDrawer();return}
  if(/\b(journal|quest)\b/.test(s)&&!s.includes('accept')){drawer='journal';renderDrawer();return}
  if(/\b(job board|notice board)\b/.test(s)){drawer='jobs';renderDrawer();return}
  if(/\b(character|stats|skills)\b/.test(s)){drawer='character';renderDrawer();return}
  if(/relationship|friend|trust|people i know/.test(s)){drawer='relationships';renderDrawer();return}
  if(/codex|recipe|brew/.test(s)&&!/use|show|give/.test(s)){drawer='codex';renderDrawer();return}
  if(/wildlife|animal|tracks/.test(s)&&/search|find|look|track/.test(s)&&!findFeatureMention(s))return wildlifeSearch();
  if(/scout|find.*route|explore.*road|unknown path/.test(s))return scout();
  if(/\b(shop|buy supplies|smith|outfitter)\b/.test(s)&&safeArray(phase5Shops).length){drawer='shops';renderDrawer();return}
  if(/\b(camp|make camp)\b/.test(s))return phase5Camp();
  const ex=safeArray(state.available_expeditions).find(x=>x.unlocked);if(ex&&/\b(expedition|depths|go below|enter.*watch)\b/.test(s))return showExpeditionPreparation(ex.expedition_key);
  if(/deliver|hand over|give.*parcel/.test(s)&&mainQuest()?.status==='active'&&state.location?.id==='willowmere')return deliverMain();
  const ready=safeArray(state.jobs).find(j=>j.status==='active'&&j.destination_location_id===state.location?.id);if(ready&&/deliver|hand over|finish|complete/.test(s))return ready.phase2?completeP2Job(ready.id):completeJob(ready.id);
  if(mainQuest()?.quest_key==='the_little_things_01'&&mainQuest()?.status==='available'&&state.location?.id==='canto_crossing'&&/parcel|courier.*job|accept.*quest/.test(s))return acceptQuest('the_little_things_01');
  const locations=safeArray(state.world_locations||state.map_locations).filter(x=>x.connected&&x.known!==false&&x.id!==state.location?.id);const wanted=locations.find(x=>s.includes(String(x.real_name||x.name).toLowerCase())||s.includes(x.id.replaceAll('_',' ')));if(wanted&&/go|walk|travel|head|leave|make.*way/.test(s))return travel(wanted.id);
  return resolveDynamicRaw(raw);
}

async function adminApply(){if(!state.admin)return;const patch={xp:Number(el('vaAdminXp')?.value||0),gold:Number(el('vaAdminGold')?.value||0),world_day:Number(el('vaAdminDay')?.value||1),world_minute:Number(el('vaAdminMinute')?.value||480),location_id:el('vaAdminLocation')?.value,weather:el('vaAdminWeather')?.value};const base=await callRpc('adventure_admin_patch_self',{p_patch:patch});const p2=await callRpc('adventure_phase2_get_state',{}, {silent:true});const p23=await callRpc('adventure_phase23_get_state',{}, {silent:true});const p3=await callRpc('adventure_phase3_get_state',{}, {silent:true});const p4=await callRpc('adventure_phase4_get_state',{}, {silent:true});const p5=await callRpc('adventure_phase5_get_state',{}, {silent:true});const p6=await callRpc('adventure_phase6_get_state',{}, {silent:true});const p7=await callRpc('adventure_phase7_get_state',{}, {silent:true});state=mergePhase7(mergePhase6(mergePhase5(mergePhase4(mergePhase3(mergePhase23(mergePhase2(base,p2),p23),p3),p4),p5),p6),p7);await refreshPhase5();await refreshPhase6();await refreshPhase7();mapRegionKey=state.current_region_key;lastNarrative='Admin test state applied.';render();drawer='admin';renderDrawer();saved()}

  function saved(){clearTimeout(saveToastTimer);const s=el('vaSaved');if(!s)return;s.classList.add('show');saveToastTimer=setTimeout(()=>s.classList.remove('show'),1200)}
  function formatWorldTime(min){min=clamp(Number(min)||0,0,1439);return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`}
  function formatPlay(sec){sec=Math.max(0,Number(sec)||0);const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);return h?`${h}h ${m}m`:`${m}m`}
  function formatLastPlayed(value){const t=Date.parse(value||'');if(!Number.isFinite(t))return 'Recently';const diff=Math.max(0,Date.now()-t),m=Math.floor(diff/60000);if(m<1)return 'Just now';if(m<60)return `${m}m ago`;const h=Math.floor(m/60);if(h<24)return `${h}h ago`;return `${Math.floor(h/24)}d ago`}
  function xpForAdventureLevel(level){if(typeof xpForLevel==='function')return Number(xpForLevel(level))||0;let p=0;for(let i=1;i<level;i++)p+=Math.floor(i+300*Math.pow(2,i/7));return Math.floor(p/4)}

  // Re-sync launcher state after login/logout without patching the site's auth system.
  window.addEventListener('repo-character-changed',()=>{if(el(DIALOG_ID)?.open){view='entry';open().catch(()=>{})}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});else inject();
  window.VelmoraAdventures={version:VERSION,open,close,getState:()=>state,refresh:async()=>{state=await loadFullState();render();return state},narrator:AdventureNarrator,interpret:(text)=>AdventureNarrator.interpret({rawText:text,context:buildContextPack()})};
async function phase5Equip(item,slot){const prev=snapshotState();showProcessing('EQUIPMENT','Changing Adventure gear…','This equipment belongs only to your Adventure character.');const res=await callRpc('adventure_phase5_equip',{p_item_key:item,p_slot:slot});takePhase5Result(res);await refreshPhase5();lastRenderedNarrative='';lastNarrative=`Equipped ${safeArray(state.inventory).find(i=>i.item_key===item)?.name||item}.`;render();drawer='inventory';renderDrawer();renderStateFeedback(prev,state,'gear');saved()}
async function phase5Shop(shop,kind,item){const prev=snapshotState();showProcessing('SHOP',kind==='buy'?'Making purchase…':'Selling item…','Adventure Gold only. The server checks stock, ownership and price.');const res=await callRpc('adventure_phase5_shop',{p_shop_key:shop,p_action:kind,p_item_key:item});takePhase5Result(res);await refreshPhase5();lastRenderedNarrative='';lastNarrative=res.message||state.adventure.last_summary;render();drawer='shops';renderDrawer();renderStateFeedback(prev,state,'shop');saved()}
async function phase5Camp(){const prev=snapshotState();showProcessing('CAMP','Making camp…','A couple of hours pass while you rest somewhere sensible.');const res=await callRpc('adventure_phase5_camp');takePhase5Result(res);await refreshPhase23();await refreshPhase3();await refreshPhase4();await refreshPhase5();await refreshPhase6();await refreshPhase7();lastRenderedNarrative='';lastNarrative=res.message||state.adventure.last_summary;render();renderStateFeedback(prev,state,'camp');queueBanner('CAMP','Two hours pass',`HP ${state.adventure.hp}/${state.adventure.max_hp}`,'travel');saved()}
async function combatAction(kind,ability=null,item=null,position=null){showProcessing('COMBAT','Resolving your move…','The server owns rolls, damage, Focus, enemy intent and rewards.');const res=await callRpc('adventure_phase5_combat_action',{p_action:kind,p_ability_key:ability,p_item_key:item,p_position:position});takePhase5Result(res);await refreshPhase5();await refreshPhase7();hideProcessing();const r=res.resolution||{};lastRenderedNarrative='';lastNarrative=[r.player_text,r.enemy_text].filter(Boolean).join(' ');render();if(r.outcome){const title=r.outcome==='victory'?'ENCOUNTER WON':r.outcome==='defeated'?'YOU WERE OVERWHELMED':r.outcome==='fled'?'YOU GOT CLEAR':'ENCOUNTER RESOLVED';queueBanner(title,r.outcome==='victory'?`+${Number(r.reward_xp||0)} Adventure XP`:state.location?.name||'Adventure',r.loot_item?`Loot: ${r.loot_item}`:'The Adventure continues.',r.outcome==='victory'?'reward':'travel')}saved()}
async function combatFreeAction(){const input=el('vaCombatInput'),raw=(input?.value||'').trim().toLowerCase();if(!raw)return;input.value='';if(/\b(flee|run|escape)\b/.test(raw))return combatAction('flee');if(/\b(defend|brace|guard|block)\b/.test(raw))return combatAction('defend');if(/\b(far|back away|distance)\b/.test(raw))return combatAction('position',null,null,'far');if(/\b(mid|middle)\b/.test(raw))return combatAction('position',null,null,'mid');if(/\b(close|approach|get closer)\b/.test(raw))return combatAction('position',null,null,'close');if(/\b(token|rubbing|survey mark|three prong|mark)\b/.test(raw)&&state.active_combat?.enemy_key==='surveyors_automaton')return combatAction('environment');if(/\b(attack|hit|strike|shoot|stab|swing)\b/.test(raw))return combatAction('attack');notify('That combat idea is not a validated combat action yet. Use the visible tactics or a simpler command.')}
async function expeditionEnter(key){showProcessing('EXPEDITION','Entering the depths…','Your room, discoveries and progress will persist if you save and leave.');const res=await callRpc('adventure_phase5_expedition_enter',{p_expedition_key:key});takePhase5Result(res);await refreshPhase5();await refreshPhase7();hideProcessing();lastRenderedNarrative='';lastNarrative='You leave daylight behind and enter the expedition.';render();saved()}
async function expeditionAction(kind,room=null,method=null){showProcessing('EXPEDITION',kind==='move'?'Moving deeper…':kind==='exit'?'Returning to the surface…':'Resolving the room…','The route, hazard and encounter state are server-owned.');const res=await callRpc('adventure_phase5_expedition_action',{p_action:kind,p_target_room:room,p_method:method});takePhase5Result(res);if(res.phase7)state=mergePhase7(state,res.phase7);await refreshPhase5();await refreshPhase7();hideProcessing();lastRenderedNarrative='';lastNarrative=res.message||state.adventure.last_summary;render();if(res.encounter_started&&state.active_combat)queueBanner('EXPEDITION ENCOUNTER',state.active_combat.enemy_name,'The way forward is contested.','quest');saved()}
async function expeditionFreeAction(){const input=el('vaExpInput'),raw=(input?.value||'').trim().toLowerCase();if(!raw)return;input.value='';if(/\b(leave|exit|surface|go back)\b/.test(raw))return expeditionAction('exit');for(const k of safeArray(state.expedition?.room?.connections)){const rr=safeArray(state.expedition?.rooms).find(x=>x.room_key===k);if(rr&&raw.includes(String(rr.name).toLowerCase()))return expeditionAction('move',k,null)}const method=/strength|lift|brace|move beam/.test(raw)?'strength':/agility|jump|climb/.test(raw)?'agility':/survival|route|path/.test(raw)?'survival':/intelligence|study|read|inspect|search/.test(raw)?'intelligence':null;return expeditionAction('resolve',null,method)}
async function phase5Admin(kind,key=null){if(!state.admin)return;showProcessing('ADMIN','Phase 5 debug…','Adventure-only combat testing.');const res=await callRpc('adventure_phase5_admin',{p_action:kind,p_key:key});takePhase5Result(res);await refreshPhase5();hideProcessing();lastRenderedNarrative='';lastNarrative='Phase 5 debug state updated.';render();if(!state.active_combat){drawer='admin';renderDrawer()}saved()}


async function phase7Companion(kind,npc=null){showProcessing('COMPANION',kind==='join'?'Asking them to come with you…':kind==='comment'?'Asking what they think…':'Updating companion plans…','People have schedules, memories and their own lives.');const res=await callRpc('adventure_phase7_companion_action',{p_action:kind,p_npc_key:npc});takePhase7Result(res);await refreshPhase7();hideProcessing();lastRenderedNarrative='';lastNarrative=res.message||state.adventure.last_summary;render();drawer='relationships';renderDrawer();saved()}
async function phase7Scene(key){showProcessing('SOCIAL SCENE','Joining the conversation…','A little world time passes while people actually spend time together.');const res=await callRpc('adventure_phase7_scene_action',{p_scene_key:key});takePhase7Result(res);await refreshPhase7();hideProcessing();lastRenderedNarrative='';lastNarrative=res.message||state.adventure.last_summary;render();queueBanner('SOCIAL SCENE',safeArray(state.social_scenes).find(s=>s.scene_key===key)?.title||'Time with people',res.first_today?'They will remember that you were there.':'No relationship grind from repeating the same scene.','social');saved()}
async function phase7Invitation(id,kind){const res=await callRpc('adventure_phase7_invitation_action',{p_invitation_id:id,p_action:kind});takePhase7Result(res);await refreshPhase7();lastRenderedNarrative='';lastNarrative=res.message||'';render();drawer='relationships';renderDrawer();saved()}
async function phase7Social(kind,npc,text='',related=null,deadline=null){showProcessing('PEOPLE',kind==='promise'?'Giving your word…':kind==='tell'?'Sharing information…':'Talking it through…','Relationship changes come from validated memories and consequences, not dialogue spam.');const res=await callRpc('adventure_phase7_social_action',{p_action:kind,p_npc_key:npc,p_text:text,p_related_key:related,p_deadline_minutes:deadline});takePhase7Result(res);await refreshPhase7();hideProcessing();lastNpcKey=npc;lastRenderedNarrative='';lastNarrative=res.message||'';render();drawer='relationships';renderDrawer();saved()}
async function phase7Favour(id){const res=await callRpc('adventure_phase7_favour_action',{p_favour_id:id});takePhase7Result(res);await refreshPhase7();lastNarrative=res.message||'';render();drawer='relationships';renderDrawer();saved()}
async function phase7Story(key,kind,option=null){showProcessing('LOCAL STORY',kind==='choose'?'Living with the choice…':'Spending time on this thread…','The decision changes social/world state only through server-authored outcomes.');const res=await callRpc('adventure_phase7_story_action',{p_story_key:key,p_action:kind,p_option:option});takePhase7Result(res);await refreshPhase6();await refreshPhase7();hideProcessing();lastRenderedNarrative='';lastNarrative=res.message||'';render();drawer='relationships';renderDrawer();if(kind==='choose')queueBanner('CHOICE REMEMBERED',safeArray(state.social_stories).find(s=>s.story_key===key)?.title||'Local story','This decision is now part of your Adventure state.','quest');saved()}
async function phase7Admin(kind,npc=null,value=null,key=null){if(!state.admin)return;const res=await callRpc('adventure_phase7_admin',{p_action:kind,p_npc_key:npc,p_value:value,p_key:key});takePhase7Result(res);await refreshPhase7();lastNarrative=res.message||'Phase 7 debug updated.';render();drawer='admin';renderDrawer();saved()}
async function tryPhase7Command(raw){const s=String(raw||'').toLowerCase(),p=findPhase7Person(s),comp=state?.companion;
  if(/\b(people|friends|acquaintances|promises|invitations|favours)\b/.test(s)&&!/tell|ask|promise/.test(s)){drawer='relationships';renderDrawer();return true}
  if(comp?.status==='active'&&/\b(what do you think|your thoughts|ask .* what .* think)\b/.test(s)){await phase7Companion('comment');return true}
  if(comp?.status==='active'&&/\b(wait here|stay here)\b/.test(s)){await phase7Companion('wait');return true}
  if(comp&&/\b(head home|go home|dismiss|you can leave)\b/.test(s)){await phase7Companion('dismiss');return true}
  if(comp?.status==='waiting'&&comp.wait_location_id===state.location?.id&&/\b(come with me|join me|come along)\b/.test(s)){await phase7Companion('resume');return true}
  if(p&&/\b(come with me|join me|come along|want to come)\b/.test(s)){await phase7Companion('join',p.npc_key);return true}
  if(p&&/\b(apologi[sz]e|say sorry|i'm sorry|im sorry)\b/.test(s)){await phase7Social('apologize',p.npc_key);return true}
  if(p&&/\b(what do you think|your opinion|what .* think)\b/.test(s)){await phase7Social('ask_opinion',p.npc_key);return true}
  if(p&&/\b(invite|come over|tea at my|drink at my|visit my)\b/.test(s)){await phase7Social('invite_home',p.npc_key);return true}
  if(p&&/\b(i promise|i swear|i'll |i will |won't |will not )/.test(s)){const fact=findPhase7Fact(s),item=findItemMention(s);await phase7Social('promise',p.npc_key,raw,item?.item_key||fact?.key||null,null);return true}
  if(p&&/\b(tell|explain|share)\b/.test(s)){const fact=findPhase7Fact(s);if(fact){await phase7Social('tell',p.npc_key,raw,fact.key,null);return true}}
  const ap=safeArray(state.social_promises).filter(x=>x.status==='active'&&(!p||x.npc_key===p.npc_key));if(ap.length===1&&/\b(kept|fulfilled|did what i promised|promise is done)\b/.test(s)){await phase7Social('keep_promise',ap[0].npc_key,raw,ap[0].id,null);return true}
  return false;
}

async function phase6Property(key,kind){const prev=snapshotState();showProcessing('PROPERTY',kind==='rent'?'Renting a place…':kind==='buy'?'Buying a home…':'Updating your home…','Adventure Gold and property state are server-owned.');const res=await callRpc('adventure_phase6_property_action',{p_property_key:key,p_action:kind});takePhase6Result(res);hideProcessing();lastRenderedNarrative='';lastNarrative=res.message||state.adventure?.last_summary||'';render();drawer='home';renderDrawer();renderStateFeedback(prev,state,'property');saved()}
async function phase6Upgrade(kind){const h=state.current_home;if(!h)return;showProcessing('HOME UPGRADE','Improving your home…','Defined upgrade, defined price.');const res=await callRpc('adventure_phase6_upgrade',{p_property_key:h.property_key,p_upgrade_key:kind});takePhase6Result(res);hideProcessing();lastNarrative=res.message||'';render();drawer='home';renderDrawer();saved()}
async function phase6Storage(kind,item,qty){const h=state.current_home;if(!h)return;const res=await callRpc('adventure_phase6_storage',{p_property_key:h.property_key,p_action:kind,p_item_key:item,p_quantity:qty});takePhase6Result(res);lastNarrative=res.message||'';render();drawer='home';renderDrawer();saved()}
async function phase6Display(kind,type,key,slot){const h=state.current_home;if(!h)return;const res=await callRpc('adventure_phase6_display',{p_property_key:h.property_key,p_action:kind,p_source_type:type||null,p_source_key:key||null,p_slot:slot||null});takePhase6Result(res);render();drawer='home';renderDrawer();saved()}
async function phase6Decor(kind,key,slot){const h=state.current_home;if(!h)return;const res=await callRpc('adventure_phase6_decor',{p_property_key:h.property_key,p_action:kind,p_decor_key:key||null,p_slot:slot||null});takePhase6Result(res);render();drawer='home';renderDrawer();saved()}
async function phase6Rest(kind,mode){showProcessing('REST',mode==='morning'?'Sleeping until morning…':mode==='evening'?'Waiting until evening…':'Taking a proper rest…','World time advances while you recover.');const res=await callRpc('adventure_phase6_rest',{p_kind:kind,p_mode:mode||'short'});await refreshAllAdventure();hideProcessing();lastRenderedNarrative='';lastNarrative=res.message||state.adventure.last_summary;render();if(kind==='home'){drawer='home';renderDrawer()}queueBanner('REST',`${res.minutes||0} minutes pass`,`HP ${state.adventure.hp}/${state.adventure.max_hp}`,'travel');saved()}
async function phase6Transport(route){const r=state.transport_routes.find(x=>x.route_key===route);showProcessing('TRANSPORT',`Taking the ${r?.service_name||'service'}…`,'Safer than the road, at a price.');const res=await callRpc('adventure_phase6_transport',{p_route_key:route});await refreshAllAdventure();hideProcessing();lastRenderedNarrative='';lastNarrative=res.message||state.adventure.last_summary;render();queueBanner('ARRIVED',state.location.name,`${r?.cost||0} Adventure Gold · no road encounter`,'travel');saved()}
async function phase6Shop(shop,kind,item,qty){showProcessing('LOCAL SHOP',kind==='buy'?'Making purchase…':'Selling goods…','Server-owned prices and inventory.');const res=await callRpc('adventure_phase6_shop',{p_shop_key:shop,p_action:kind,p_item_key:item,p_quantity:qty});takePhase6Result(res);hideProcessing();lastNarrative=res.message||'';render();drawer='shops';renderDrawer();saved()}
async function phase6Work(shift){showProcessing('TOWN WORK','Putting in a shift…','Reliable, modest, and deliberately worse than real adventures.');const res=await callRpc('adventure_phase6_work',{p_shift_key:shift});await refreshAllAdventure();hideProcessing();lastNarrative=res.message||state.adventure.last_summary;render();drawer='town';renderDrawer();queueBanner('SHIFT COMPLETE',`+${res.gold||0} Adventure Gold`,'Safe money, not fast money.','reward');saved()}
async function phase6Craft(recipe,qty=1){showProcessing('CRAFTING','Making something useful…','Materials and station access are server-validated.');const res=await callRpc('adventure_phase6_craft',{p_recipe_key:recipe,p_quantity:qty});await refreshAllAdventure();hideProcessing();lastNarrative=res.message||state.adventure.last_summary;render();drawer='crafting';renderDrawer();saved()}
async function phase6ReadLetter(id){const res=await callRpc('adventure_phase6_read_letter',{p_letter_id:id});takePhase6Result(res);render();drawer='mail';renderDrawer();saved()}
async function phase6SetTitle(key){const res=await callRpc('adventure_phase6_set_title',{p_title_key:key});takePhase6Result(res);render();drawer='journey';renderDrawer();saved()}
async function phase6Admin(kind,key=null,value=null){if(!state.admin)return;const res=await callRpc('adventure_phase6_admin',{p_action:kind,p_key:key,p_value:value});await refreshAllAdventure();lastNarrative=res.message||'Phase 6 debug updated.';render();drawer='admin';renderDrawer();saved()}
})();
