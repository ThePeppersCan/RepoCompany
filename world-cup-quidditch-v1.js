/* ============================================================
   REPO SPORTS WORLD CUP — AUTOMATED QUIDDITCH BROADCAST V1
   Belros vs Zafran prototype. 50/50 team balance by construction.
   No Golden Snitch. Standard RepoSports Quidditch remains untouched.
   PREMIUM WORLD CUP BROADCAST PASS — camera director, replay, celebrations,
   live story cards, Barry reactions, ambience and World Cup-only presentation.
   V50 + opening-night Barry intro — gameplay/layout otherwise unchanged.
   ============================================================ */
(() => {
  if (window.__repoWorldCupQuidditchV1Installed) return;
  window.__repoWorldCupQuidditchV1Installed = true;

  const BASE = 'assets/world-cup-game-v1/';
  const W = 1672, H = 941;
  const INTRO_SECONDS = 30;
  const WORLD_CUP_STADIUM_INTROS = Object.freeze({
    'crown-of-vardesh-glacier':{src:BASE+'BUILDUPBELROS.mp4',duration:22.3},
    'hestholm-fjord':{src:BASE+'hestholm-intro.mp4',duration:22.3},
    'warmvein':{src:BASE+'warmvein-intro.mp4',duration:22.3},
    'yrsa-varn':{src:BASE+'yrsa-varn-intro.mp4',duration:22.3},
    'treedesh-forest':{src:BASE+'treedesh-intro.mp4',duration:22.3},
    'basalt-coast':{src:BASE+'basalt-coast-intro.mp4',duration:22.3}
  });
  const WORLD_CUP_BARRY_OPENING_DURATION = 29.648875;
  const WORLD_CUP_BARRY_OPENING_AUDIO = BASE+'barry-opening-night.mp3';
  const WORLD_CUP_BARRY_OPENING_BACKDROP = BASE+'world-cup-opening-studio.png';
  const WORLD_CUP_BARRY_MOUTH_CUES = [2,2,2,2,2,1,1,1,1,1,1,0,0,0,0,1,1,2,2,2,2,2,1,1,1,2,2,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,0,0,0,0,1,1,2,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,0,1,1,1,2,1,1,1,1,1,2,1,1,1,1,1,0,0,0,0,0,1,1,2,2,2,2,2,2,1,1,1,0,1,1,1,1,0,0,0,1,1,2,2,2,2,1,1,1,1,1,0,0,0,1,1,2,2,2,1,1,1,1,2,1,1,1,0,0,1,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,2,2,2,2,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,2,2,2,2,2,2,1,1,1,0,0,1,1,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,2,2,1,1,1,2,2,2,1,1,1,1,1,1,2,2,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,0,0,0];
  const WORLD_CUP_REF_PACE = 1.16;
  const WORLD_CUP_RIDE_BOB_PX = 0;
  const WORLD_CUP_AIR_LIFT_PX = 24;
  const PREMATCH_ANTHEM = BASE+'prematch-anthem.mp3';
  const WORLD_CUP_KICKOFF_TRACK_1 = BASE+'world-cup-kickoff-song-1.mp3';
  const WORLD_CUP_KICKOFF_TRACK_2 = BASE+'world-cup-kickoff-song-2.mp3';
  const CLUB_MATCH_TRACKS = [BASE+'match-music.mp3', BASE+'loop.mp3', BASE+'eternal-throne.mp3', BASE+'music-3.mp3'];
  const PLAYER_RIDE_HEIGHT = 113.4, PLAYER_STAND_HEIGHT = 90.3;
  const REF_FLY_HEIGHT = 57.5, REF_STAND_HEIGHT = 55.2;
  const WORLD_CUP_REFEREE_NAME = 'WHISTLEWORTH';
  const PLAYER_SCALE = {jud:1.16,nimbler:.86,bramble:1,zizi:1,rafi:1,saffi:1};
  const HALF_SECONDS = 9 * 60;
  const MATCH_SECONDS = 18 * 60;
  let MATCH_CHANNEL = 'repo-world-cup-game-2026-belros-zafran';
  const $ = id => document.getElementById(id);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const ease = t => 1 - Math.pow(1-clamp(t,0,1),3);
  const other = team => team === 'belros' ? 'zafran' : 'belros';
  const REPLAY_FRAME_STEP=.04, REPLAY_MAX_FRAMES=140;
  const BARRY={
    neutral:'assets/commentator-22.png',
    talk:['assets/commentator-23.png','assets/commentator-24.png'],
    interested:'assets/commentator-28.png',
    shocked:'assets/barry-events/barry-04.png',
    goal:'assets/commentator-29.png',
    var:'assets/barry-events/barry-06.png',
    halftime:'assets/commentator-25.png',
    fulltime:'assets/commentator-27.png'
  };

  // Flight envelope. HARD bounds are emergency containment only; AI targets live
  // inside SOFT bounds so riders turn before they ever grind along a screen edge.
  const FLIGHT = {hardX0:.065,hardX1:.935,softX0:.105,softX1:.895,hardY0:.205,hardY1:.775,softY0:.235,softY1:.735,wallLook:.095};

  // ============================================================
  // CLUB GAMEPLAY KERNEL — one-way transplant into World Cup Mode.
  // Club files remain independent/read-only. World Cup keeps its own teams,
  // stadium geometry, match length and presentation, but live play uses the
  // same tempo/flow/positioning/decision model as the perfected Club engine.
  // ============================================================
  const LIVE_TEMPO = 1.18;
  const FLOW = Object.freeze({minCruise:.054,arrivalRadius:.044,hoverTrigger:.30,escapeImpulse:.090,driftX:.006,driftY:.010,clusterRadius:.088,ringRadius:.118,ringHoverTrigger:.10});
  const FLOW_PHASES = Object.freeze({
    RESTART:'restart',BUILDUP:'buildUp',CIRCULATION:'circulation',PROBING:'probing',ATTACKING:'attacking',FINAL_THIRD:'finalThird',
    SHOT_SEQUENCE:'shotSequence',DEFENSIVE_PRESSURE:'defensivePressure',TURNOVER:'turnover',COUNTER:'counterAttack',SCRAMBLE:'scramble',RECOVERY:'recovery',STOPPAGE:'stoppage'
  });
  const FLOW_TEMPLATES = [
    {id:'patient-build',tempo:'slow',weight:1.25},{id:'switch-play',tempo:'normal',weight:1.05},{id:'quick-combination',tempo:'fast',weight:.95},
    {id:'solo-progression',tempo:'normal',weight:.80},{id:'counter-attack',tempo:'fast',weight:.88},{id:'scrappy-attack',tempo:'normal',weight:.52},{id:'quiet-spell',tempo:'slow',weight:.60}
  ];
  const FAIRNESS = Object.freeze({attributeCompression:.55,closeContestVariance:.055});
  function executionSkill(attributes,key,baseline=.86){const raw=Number(attributes?.[key]??baseline);return clamp(baseline+(raw-baseline)*FAIRNESS.attributeCompression,.68,.97)}
  function fairNoise(amount=FAIRNESS.closeContestVariance){return ((state.simRand?.()||Math.random())-.5)*amount}
  function simNow(){return (Number(state.matchTime)||0)*1000}
  const ANIM_PRIORITY = Object.freeze({IDLE:0,MOVING:1,ACCELERATING:2,DECELERATING:2,TURNING:3,RETURNING_TO_POSITION:4,RECOVERING:4,RECEIVING:5,PASSING:6,INTERCEPTING:7,SHOOTING:8,SAVING:8,CELEBRATING:10});
  function setPlayerAnim(e,name,duration=.35,priority=null,meta={}){if(!e?.player)return false;e.animState=name;e.animPriority=priority??ANIM_PRIORITY[name]??2;e.animUntil=simNow()+Math.max(.05,duration)*1000;e.animMeta=meta||{};return true}
  const CLUB_TACTICAL_PROFILES = Object.freeze([
    Object.freeze({id:'PATIENT',width:1.08,runnerDepth:.94,supportDepth:.88,supportWidth:1.06,passBias:.020,directness:-.22,fluid:false,defCompact:1.00}),
    Object.freeze({id:'PRESS',width:.96,runnerDepth:1.02,supportDepth:.96,supportWidth:.92,passBias:0,directness:.02,fluid:false,defCompact:.91}),
    Object.freeze({id:'COUNTER',width:1.04,runnerDepth:1.13,supportDepth:1.01,supportWidth:1.02,passBias:-.012,directness:.20,fluid:false,defCompact:1.02}),
    Object.freeze({id:'WIDE',width:1.17,runnerDepth:1.00,supportDepth:.96,supportWidth:1.20,passBias:.012,directness:-.02,fluid:false,defCompact:1.04}),
    Object.freeze({id:'DIRECT',width:.95,runnerDepth:1.14,supportDepth:1.02,supportWidth:.94,passBias:-.020,directness:.26,fluid:false,defCompact:.99}),
    Object.freeze({id:'FLUID',width:1.07,runnerDepth:1.04,supportDepth:.96,supportWidth:1.08,passBias:.004,directness:.03,fluid:true,defCompact:1.00}),
    Object.freeze({id:'COMPACT',width:.91,runnerDepth:.98,supportDepth:.90,supportWidth:.86,passBias:.018,directness:-.14,fluid:false,defCompact:.88})
  ]);
  function clubTacticalProfile(name){const key=String(name||'WORLD CUP').trim().toUpperCase().replace(/\s+/g,' ');return CLUB_TACTICAL_PROFILES[hashSeed(`REPO_SPORTS_CLUB_TACTIC|${key}`)%CLUB_TACTICAL_PROFILES.length]}
  function tacticalProfileForTeam(team){return state.teamTactics?.[team]?.profile||clubTacticalProfile(teamMeta?.[team]?.name||team)}
  function tacticalAdjustmentForTeam(team){return state.teamTactics?.[team]?.adjustment||{id:'BASE',width:1,runner:1,support:1,press:1,passBias:0}}
  const safeX = x => clamp(x,FLIGHT.softX0,FLIGHT.softX1);
  const safeY = y => clamp(y,FLIGHT.softY0,activeSoftY1());
  const dist2 = (a,b) => Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));
  const currentName = () => { try { return String(window.character?.username || character?.username || 'Guest'); } catch (_) { return 'Guest'; } };
  const isHost = () => currentName().toLowerCase() === 'catasthma';

  function hashSeed(text){
    let h=2166136261>>>0;
    for(let i=0;i<String(text).length;i++){h^=String(text).charCodeAt(i);h=Math.imul(h,16777619)}
    return h>>>0;
  }
  function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

  // Six canonical Vardesh-host World Cup stadiums. Round-of-16 fixtures retain
  // their deterministic legacy rotation. Quarter-finals use the official draw
  // assignments so every watcher sees the exact stadium announced on the bracket.
  const WORLD_CUP_ARENAS = Object.freeze({
    // Existing arena artwork IDs are retained to avoid breaking deployed assets;
    // display names now use the canonical World Cup venue names.
    'crown-of-vardesh-glacier':{id:'crown-of-vardesh-glacier',name:'BLACKGLASS CROWN ARENA',shortName:'Blackglass Crown',src:BASE+'stadiums/crown-of-vardesh-glacier.png',ambience:'aurora',standingOffsetPx:0},
    'warmvein':{id:'warmvein',name:'WARMVEIN ARENA',shortName:'Warmvein',src:BASE+'stadiums/warmvein.png',ambience:'embers',standingOffsetPx:104},
    'yrsa-varn':{id:'yrsa-varn',name:'YRSA VARN WORLD STADIUM',shortName:'Yrsa Varn',src:BASE+'stadiums/yrsa-varn.png',ambience:'indoor',standingOffsetPx:110},
    'basalt-coast':{id:'basalt-coast',name:'SKALLHEIM GRAND ICE',shortName:'Skallheim Grand Ice',src:BASE+'stadiums/basalt-coast.png',ambience:'blizzard',standingOffsetPx:106},
    'hestholm-fjord':{id:'hestholm-fjord',name:'HESTHOLM FJORD GROUND',shortName:'Hestholm Fjord',src:BASE+'stadiums/hestholm-fjord-arena.png',ambience:'daylight',standingOffsetPx:114},
    'treedesh-forest':{id:'treedesh-forest',name:'NYRGATE NORTHERN LIGHTS STADIUM',shortName:'Nyrgate Northern Lights',src:BASE+'stadiums/treedesh-forest.png',ambience:'aurora-forest',standingOffsetPx:102}
  });
  const WORLD_CUP_ROUND16_FIXTURE_ORDER = Object.freeze([
    'belros-zafran','iskandar-calvora','sorevia-lumerre','talune-kordesh',
    'norveth-qasmir','nambara-elvane','drazhen-rovarn','vardesh-marovar'
  ]);
  const WORLD_CUP_QUARTER_FINAL_ARENAS = Object.freeze({
    'qf-zafran-rovarn':'warmvein',
    'qf-nambara-lumerre':'treedesh-forest',
    'qf-talune-iskandar':'basalt-coast',
    'qf-marovar-norveth':'hestholm-fjord'
  });
  // ROUND OF 16 · REPOSPORTS EXPERIENCE EDGE
  // Countries fielding a current/main RepoSports League pet get a deliberately
  // modest 10% finishing boost in the opening Round-of-16 fixtures only.
  // Later knockout rounds revert to the normal 50/50 World Cup engine.
  const WORLD_CUP_MAIN_REPOSPORTS_TEAMS = new Set(['vardesh','norveth','talune','belros','sorevia','iskandar']);
  const WORLD_CUP_ROUND16_REPOSPORTS_WIN_BOOST = 1.10;
  function round16RepoSportsBoost(team){
    const fixtureId=String(state?.fixtureId||'').trim().toLowerCase();
    if(!WORLD_CUP_ROUND16_FIXTURE_ORDER.includes(fixtureId))return 1;
    const nation=String(teamMeta?.[team]?.name||'').trim().toLowerCase();
    return WORLD_CUP_MAIN_REPOSPORTS_TEAMS.has(nation)?WORLD_CUP_ROUND16_REPOSPORTS_WIN_BOOST:1;
  }
  // LIVE COMPETITIVE-BALANCE GUARDRAIL
  // This never scripts a goal or forces a winner. It only resists runaway chance-generation
  // when one otherwise-even side snowballs to a huge shots/interceptions gap. The effect
  // ramps in gently and tops out at a modest 20% action edge for the side being overwhelmed.
  function worldCupCompetitiveBalanceEdge(team){
    if(!state?.teamStats?.[team]||!['first','second'].includes(state.phase))return 0;
    const opp=other(team),a=state.teamStats[team],b=state.teamStats[opp];
    const shotGap=(Number(b.shots)||0)-(Number(a.shots)||0);          // + = this team is behind on shots
    const intGap=(Number(b.interceptions)||0)-(Number(a.interceptions)||0);
    const foulGap=(Number(a.fouls)||0)-(Number(b.fouls)||0);         // + = this team has suffered the foul snowball
    let edge=0;
    if(shotGap>=4)edge+=Math.min(.18,(shotGap-3)*.018);
    else if(shotGap<=-4)edge-=Math.min(.10,(-shotGap-3)*.010);
    if(intGap>=10)edge+=Math.min(.05,(intGap-9)*.0035);
    else if(intGap<=-10)edge-=Math.min(.035,(-intGap-9)*.0025);
    if(foulGap>=6)edge+=Math.min(.035,(foulGap-5)*.005);
    const ramp=clamp(((Number(state.matchTime)||0)-75)/120,0,1);      // no heavy-handed correction early on
    return clamp(edge*ramp,-.12,.20);
  }
  // The Round-of-16 RepoSports pet edge remains subtle, but now helps create chances too
  // instead of existing only at the instant a shot is converted.
  function worldCupActionEdge(team){
    const petEdge=Math.max(0,round16RepoSportsBoost(team)-1)*.35;
    return clamp(worldCupCompetitiveBalanceEdge(team)+petEdge,-.12,.235);
  }
  function shuffledArenaIds(ids,rand){
    const a=ids.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;
  }
  function buildWorldCupArenaAssignments(){
    const map={'belros-zafran':'crown-of-vardesh-glacier'};
    const rand=mulberry32(hashSeed('REPO SPORTS WORLD CUP 2026 · STADIUM ROTATION'));
    const all=Object.keys(WORLD_CUP_ARENAS),nonOpener=all.filter(id=>id!=='crown-of-vardesh-glacier');
    let bag=shuffledArenaIds(nonOpener,rand),last='crown-of-vardesh-glacier';
    for(const fixtureId of WORLD_CUP_ROUND16_FIXTURE_ORDER.slice(1)){
      if(!bag.length){bag=shuffledArenaIds(all,rand);if(bag[0]===last&&bag.length>1)[bag[0],bag[1]]=[bag[1],bag[0]]}
      const arenaId=bag.shift();map[fixtureId]=arenaId;last=arenaId;
    }
    return Object.freeze(map);
  }
  const WORLD_CUP_FIXTURE_ARENAS = buildWorldCupArenaAssignments();
  function arenaForFixture(fixtureId){
    const id=String(fixtureId||'').trim().toLowerCase();
    const quarterFinalArena=WORLD_CUP_QUARTER_FINAL_ARENAS[id];
    if(quarterFinalArena&&WORLD_CUP_ARENAS[quarterFinalArena])return WORLD_CUP_ARENAS[quarterFinalArena];
    if(id==='belros-zafran')return WORLD_CUP_ARENAS['crown-of-vardesh-glacier'];
    const assigned=WORLD_CUP_FIXTURE_ARENAS[id];if(assigned)return WORLD_CUP_ARENAS[assigned];
    const all=Object.keys(WORLD_CUP_ARENAS),idx=hashSeed('WC-ARENA|'+id)%all.length;
    return WORLD_CUP_ARENAS[all[idx]];
  }
  function activeArena(){return state.arena||WORLD_CUP_ARENAS['crown-of-vardesh-glacier']}
  function standingFloorOffsetPx(){return Number(activeArena().standingOffsetPx)||0}
  // Crown's artwork was the original coordinate reference. The other five arenas
  // have a visibly deeper lower flight area, so they use a larger vertical envelope.
  // This changes movement space only; shot/scoring/action probabilities are untouched.
  function activeFlightProfile(){
    if(activeArena().id==='crown-of-vardesh-glacier')return {softY1:FLIGHT.softY1,hardY1:FLIGHT.hardY1,supportWidthBonus:0,bottomRecoverY:.555};
    return {softY1:.855,hardY1:.910,supportWidthBonus:.105,bottomRecoverY:.690};
  }
  function activeSoftY1(){return activeFlightProfile().softY1}
  function activeHardY1(){return activeFlightProfile().hardY1}

  const slugifyPlayer = value => String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  function makeWorldCupPlayer(name,role='support',opts={}){
    const id=opts.id||slugifyPlayer(name);
    const standing=String(opts.standing||'').trim(),riding=String(opts.riding||'').trim();
    if(!standing||!riding||!standing.startsWith('assets/world-cup-teams/')||!riding.startsWith('assets/world-cup-teams/')){
      throw new Error(`[WORLD CUP] Missing exact renamed World Cup sprite pair for ${name}`);
    }
    return {
      id,name:String(name).toUpperCase(),displayName:String(name),role,risk:Number.isFinite(Number(opts.risk))?Number(opts.risk):(role==='attacker'?1.18:role==='defender'?.84:1),
      short:opts.short||`${role[0].toUpperCase()+role.slice(1)} · World Cup squad`,
      lore:Array.isArray(opts.lore)?opts.lore:[],standing,riding
    };
  }

  const WORLD_CUP_TEAMS = Object.freeze({
    vardesh:{name:'VARDESH',abbr:'VAR',colour:'#8dbfe3',players:[
      makeWorldCupPlayer('Pipsqueak','attacker',{standing:'assets/world-cup-teams/vardesh/pipsqueak-standing.png',riding:'assets/world-cup-teams/vardesh/pipsqueak-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Veyri','defender',{standing:'assets/world-cup-teams/vardesh/Veyri-Standing.png',riding:'assets/world-cup-teams/vardesh/Veyri-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Miska','support',{standing:'assets/world-cup-teams/vardesh/Miska-Standing.png',riding:'assets/world-cup-teams/vardesh/Miska-riding.png',short:'World Cup international'})
    ]},
    lumerre:{name:'LUMERRE',abbr:'LUM',colour:'#e6c46a',players:[
      makeWorldCupPlayer('Bijou','attacker',{standing:'assets/world-cup-teams/lumerre/Bijou-standing.png',riding:'assets/world-cup-teams/lumerre/Bijou-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Mimi','defender',{standing:'assets/world-cup-teams/lumerre/Mimi-standing.png',riding:'assets/world-cup-teams/lumerre/Mimi-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Loulou','support',{standing:'assets/world-cup-teams/lumerre/LouLou-standing.png',riding:'assets/world-cup-teams/lumerre/LouLou-riding.png',short:'World Cup international'})
    ]},
    kordesh:{name:'KORDESH',abbr:'KOR',colour:'#b9483f',players:[
      makeWorldCupPlayer('Brakka','attacker',{standing:'assets/world-cup-teams/kordesh/Brakka-standing.png',riding:'assets/world-cup-teams/kordesh/Brakka-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Kovo','defender',{standing:'assets/world-cup-teams/kordesh/Kovo-standing.png',riding:'assets/world-cup-teams/kordesh/Kovo-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Daska','support',{standing:'assets/world-cup-teams/kordesh/Daska-standing.png',riding:'assets/world-cup-teams/kordesh/Daska-riding.png',short:'World Cup international'})
    ]},
    nambara:{name:'NAMBARA',abbr:'NAM',colour:'#d58a39',players:[
      makeWorldCupPlayer('Mad Rager','attacker',{standing:'assets/world-cup-teams/nambara/Mad Rager-standing.png',riding:'assets/world-cup-teams/nambara/Mad Rager-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Zuzu','defender',{standing:'assets/world-cup-teams/nambara/Zuzu-standing.png',riding:'assets/world-cup-teams/nambara/Zuzu-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Kemba','support',{standing:'assets/world-cup-teams/nambara/Kemba-standing.png',riding:'assets/world-cup-teams/nambara/Kemba-riding.png',short:'World Cup international'})
    ]},
    norveth:{name:'NORVETH',abbr:'NOR',colour:'#b9d5e6',players:[
      makeWorldCupPlayer('ROCKY','defender',{standing:'assets/world-cup-teams/norveth/ROCKY-standing.png',riding:'assets/world-cup-teams/norveth/ROCKY-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Frey','attacker',{standing:'assets/world-cup-teams/norveth/frey-standing.png',riding:'assets/world-cup-teams/norveth/frey-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Noki','support',{standing:'assets/world-cup-teams/norveth/Noki-standing.png',riding:'assets/world-cup-teams/norveth/Noki-riding.png',short:'World Cup international'})
    ]},
    zafran:{name:'ZAFRAN',abbr:'ZAF',colour:'#d2aa36',players:[
      makeWorldCupPlayer('Zizi','attacker',{risk:1.18,standing:'assets/world-cup-teams/zafran/Zizi-Standing.png',riding:'assets/world-cup-teams/zafran/Zizi-Riding.png',short:'Counterattack mind'}),
      makeWorldCupPlayer('Rafi','defender',{risk:.84,standing:'assets/world-cup-teams/zafran/Rafi -STANDINg.png',riding:'assets/world-cup-teams/zafran/Rafi -RIDING.png',short:'Patient reader'}),
      makeWorldCupPlayer('Saffi','support',{standing:'assets/world-cup-teams/zafran/Saffi - Standing.png',riding:'assets/world-cup-teams/zafran/Saffi - Riding.png',short:'Patterned passer'})
    ]},
    elvane:{name:'ELVANE',abbr:'ELV',colour:'#6fa46a',players:[
      makeWorldCupPlayer('Fenn','attacker',{standing:'assets/world-cup-teams/elvane/Fenn-standing.png',riding:'assets/world-cup-teams/elvane/Fenn-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Elvi','defender',{standing:'assets/world-cup-teams/elvane/Elvi-standing.png',riding:'assets/world-cup-teams/elvane/Elvi-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Mori','support',{standing:'assets/world-cup-teams/elvane/Mori-standing.png',riding:'assets/world-cup-teams/elvane/Mori-riding.png',short:'World Cup international'})
    ]},
    qasmir:{name:'QASMIR',abbr:'QAS',colour:'#9a78c3',players:[
      makeWorldCupPlayer('Qimi','attacker',{standing:'assets/world-cup-teams/qasmir/Qimi-Standing.png',riding:'assets/world-cup-teams/qasmir/Qimi-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Nuri','defender',{standing:'assets/world-cup-teams/qasmir/Nuri-Standing.png',riding:'assets/world-cup-teams/qasmir/Nuri-Riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Zara','support',{standing:'assets/world-cup-teams/qasmir/Zara-standing.png',riding:'assets/world-cup-teams/qasmir/Zara-riding.png',short:'World Cup international'})
    ]},
    calvora:{name:'CALVORA',abbr:'CAL',colour:'#db7a48',players:[
      makeWorldCupPlayer('Luca','attacker',{standing:'assets/world-cup-teams/calvora/Luca-standing.png',riding:'assets/world-cup-teams/calvora/Luca-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Pico','defender',{standing:'assets/world-cup-teams/calvora/Pico-standing.png',riding:'assets/world-cup-teams/calvora/Pico-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Vivi','support',{standing:'assets/world-cup-teams/calvora/Vivi-standing.png',riding:'assets/world-cup-teams/calvora/Vivi-riding.png',short:'World Cup international'})
    ]},
    rovarn:{name:'ROVARN',abbr:'ROV',colour:'#5f8fb0',players:[
      makeWorldCupPlayer('Volki','attacker',{standing:'assets/world-cup-teams/rovarn/Volki-sTANDING.png',riding:'assets/world-cup-teams/rovarn/Volki-Riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Varko','defender',{standing:'assets/world-cup-teams/rovarn/Varko-Standing.png',riding:'assets/world-cup-teams/rovarn/Varko-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Rovo','support',{standing:'assets/world-cup-teams/rovarn/Kovo-Standing.png',riding:'assets/world-cup-teams/rovarn/Kovo-Riding.png',short:'World Cup international'})
    ]},
    talune:{name:'TALUNE',abbr:'TAL',colour:'#58a89d',players:[
      makeWorldCupPlayer('Soup','support',{standing:'assets/world-cup-teams/talune/soup-standing.png',riding:'assets/world-cup-teams/talune/soup-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Tuli','attacker',{standing:'assets/world-cup-teams/talune/Tuli-Standing.png',riding:'assets/world-cup-teams/talune/Tuli-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Lumi','defender',{standing:'assets/world-cup-teams/talune/Lumi-standing.png',riding:'assets/world-cup-teams/talune/Lumi-Riding.png',short:'World Cup international'})
    ]},
    drazhen:{name:'DRAZHEN',abbr:'DRA',colour:'#8e4c68',players:[
      makeWorldCupPlayer('Dopey Dom','attacker',{standing:'assets/world-cup-teams/drazhen/Dopey Dom-standing.png',riding:'assets/world-cup-teams/drazhen/Dopey Dom--riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Zippy','defender',{standing:'assets/world-cup-teams/drazhen/Zippy-rider-standing.png',riding:'assets/world-cup-teams/drazhen/Zippy-rider-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Drazzi','support',{standing:'assets/world-cup-teams/drazhen/Drazzi-standing.png',riding:'assets/world-cup-teams/drazhen/Drazzi-Riding.png',short:'World Cup international'})
    ]},
    belros:{name:'BELROS',abbr:'BEL',colour:'#b63a2c',players:[
      makeWorldCupPlayer('JUD','defender',{id:'jud',risk:.84,standing:'assets/world-cup-teams/belros/jud-standing.png',riding:'assets/world-cup-teams/belros/jud-riding.png',short:'Veteran wall'}),
      makeWorldCupPlayer('Nimbler 2000','attacker',{id:'nimbler',risk:1.18,standing:'assets/world-cup-teams/belros/nimbler-2000-standing.png',riding:'assets/world-cup-teams/belros/nimbler-2000-riding.png',short:'Brilliant menace'}),
      makeWorldCupPlayer('Bramble','support',{id:'bramble',standing:'assets/world-cup-teams/belros/bramble-standing.png',riding:'assets/world-cup-teams/belros/bramble-riding.png',short:'Downs favourite'})
    ]},
    marovar:{name:'MAROVAR',abbr:'MAR',colour:'#5594a7',players:[
      makeWorldCupPlayer('Maro','attacker',{standing:'assets/world-cup-teams/marovar/maro-standing.png',riding:'assets/world-cup-teams/marovar/maro-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Navi','defender',{standing:'assets/world-cup-teams/marovar/navi-standing.png',riding:'assets/world-cup-teams/marovar/navi-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Rumi','support',{standing:'assets/world-cup-teams/marovar/rumi-standing.png',riding:'assets/world-cup-teams/marovar/rumi-riding.png',short:'World Cup international'})
    ]},
    sorevia:{name:'SOREVIA',abbr:'SOR',colour:'#d58ba7',players:[
      makeWorldCupPlayer('Debbie','attacker',{standing:'assets/world-cup-teams/sorevia/debbie-standing.png',riding:'assets/world-cup-teams/sorevia/debbie-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Jenny','defender',{standing:'assets/world-cup-teams/sorevia/Jenny Standing.png',riding:'assets/world-cup-teams/sorevia/Jenny Riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Rosie','support',{standing:'assets/world-cup-teams/sorevia/Rosie-sTanding.png',riding:'assets/world-cup-teams/sorevia/Rosie-riding.png',short:'World Cup international'})
    ]},
    iskandar:{name:'ISKANDAR',abbr:'ISK',colour:'#8c72b6',players:[
      makeWorldCupPlayer('Besquelcher','attacker',{standing:'assets/world-cup-teams/iskandar/Besquelcher-standing.png',riding:'assets/world-cup-teams/iskandar/Besquelcher-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Kassi','defender',{standing:'assets/world-cup-teams/iskandar/Kassi- standing.png',riding:'assets/world-cup-teams/iskandar/Kassi-riding.png',short:'World Cup international'}),
      makeWorldCupPlayer('Arko','support',{standing:'assets/world-cup-teams/iskandar/Arko-standing.png',riding:'assets/world-cup-teams/iskandar/Arko-riding.png',short:'World Cup international'})
    ]}
  });

  let roster={belros:WORLD_CUP_TEAMS.belros.players.map(p=>({...p})),zafran:WORLD_CUP_TEAMS.zafran.players.map(p=>({...p}))};
  let allPlayers=[...roster.belros,...roster.zafran];
  let byId=Object.fromEntries(allPlayers.map(p=>[p.id,p]));
  let teamMeta={
    belros:{...WORLD_CUP_TEAMS.belros,attack:1,countryKey:'belros'},
    zafran:{...WORLD_CUP_TEAMS.zafran,attack:-1,countryKey:'zafran'}
  };

  function canonicalCountry(value,fallback='belros'){
    const key=String(value||'').trim().toLowerCase().replace(/[^a-z]/g,'');
    return WORLD_CUP_TEAMS[key]?key:fallback;
  }
  function fixtureTeamsFromOptions(opts={}){
    const f=opts.fixture&&typeof opts.fixture==='object'?opts.fixture:{};
    let home=opts.home||opts.teamA||f.home||f.home_team||f.teamA||f.team_a||'';
    let away=opts.away||opts.teamB||f.away||f.away_team||f.teamB||f.team_b||'';
    if((!home||!away)&&typeof opts.fixture==='string'&&opts.fixture.includes(' vs ')){
      const parts=opts.fixture.split(/\s+vs\s+/i);home=home||parts[0];away=away||parts[1];
    }
    const homeKey=canonicalCountry(home,'belros'),awayKey=canonicalCountry(away,'zafran');
    return {homeKey,awayKey,home:WORLD_CUP_TEAMS[homeKey],away:WORLD_CUP_TEAMS[awayKey]};
  }
  function configureFixtureTeams(opts={}){
    const cfg=fixtureTeamsFromOptions(opts),fixtureId=String(opts.fixtureId||opts.id||`${cfg.homeKey}-${cfg.awayKey}`).trim().toLowerCase();
    roster={belros:cfg.home.players.map(p=>({...p})),zafran:cfg.away.players.map(p=>({...p}))};
    allPlayers=[...roster.belros,...roster.zafran];byId=Object.fromEntries(allPlayers.map(p=>[p.id,p]));
    teamMeta={
      belros:{...cfg.home,attack:1,countryKey:cfg.homeKey},
      zafran:{...cfg.away,attack:-1,countryKey:cfg.awayKey}
    };
    state.fixtureId=fixtureId;state.homeCountry=cfg.homeKey;state.awayCountry=cfg.awayKey;
    state.arena=arenaForFixture(fixtureId);state.ambienceId=state.arena.id;
    state.assets={};state.assetFixtureKey='';
    MATCH_CHANNEL=`repo-world-cup-game-2026-${fixtureId.replace(/[^a-z0-9-]+/g,'-')}`;
    commentary.intro=[
      `Good evening from ${activeArena().name}. ${teamMeta.belros.name} meet ${teamMeta.zafran.name} on the World Cup stage.`,
      'The stands are full and World Cup Quidditch is nearly here.',
      `${teamMeta.belros.name} against ${teamMeta.zafran.name}. Six players, one World Cup arena, and nowhere to hide.`,
      'No Golden Snitch tonight. Goals, defending, discipline and decision-making settle this one.',
      'The atmosphere is immense. Welcome to the Repo Sports World Cup.'
    ];
    commentary.kickoff=[
      `The whistle goes — ${teamMeta.belros.name} and ${teamMeta.zafran.name} are airborne at ${activeArena().name}!`,
      `We are under way: ${teamMeta.belros.name} against ${teamMeta.zafran.name}.`,
      'Brooms lift together and the World Cup fixture is live!',
      `The Quaffle is live. ${teamMeta.belros.name} face ${teamMeta.zafran.name}.`
    ];
    return cfg;
  }

  const commentary = {
    intro:[
      'Good evening from the Crown of Vardesh Glacier. Six players, one frozen stage, and absolutely nowhere to hide.',
      'The aurora is out, the stands are full, and I have been told the tea is technically still drinkable. World Cup Quidditch is nearly here.',
      'Belros against Zafran: history and force against patience and design. This should be a fascinating collision of ideas.',
      'No Golden Snitch tonight. This match will be decided by goals, defending, discipline and whatever the referee decides VAR was invented for.',
      'The atmosphere is immense. Welcome to the Repo Sports World Cup.'
    ],
    kickoff:[
      'The whistle goes — Belros and Zafran are airborne!',
      'We are under way at the Crown of Vardesh Glacier!',
      'Brooms lift together and the first World Cup test is live!',
      'The Quaffle is live. Belros face Zafran, and my tea is already in danger.'
    ],
    pass:[
      ({from,to})=>`${from} moves it cleanly to ${to}.`,
      ({from,to})=>`A measured pass from ${from}; ${to} keeps the move alive.`,
      ({from,to})=>`${from} draws pressure and releases ${to}.`,
      ({from,to})=>`Quick circulation — ${from} finds ${to}.`,
      ({from,to})=>`${to} gives ${from} an angle and the ball arrives exactly on cue.`,
      ({from,to})=>`No wasted motion from ${from}; the Quaffle is already with ${to}.`,
      ({from,to})=>`${from} sends it through the lane to ${to}.`,
      ({from,to})=>`Good spacing. ${from} waits, then feeds ${to}.`,
      ({from,to})=>`The defence shifts and ${from} immediately finds ${to}.`,
      ({from,to})=>`${from} keeps possession moving — ${to} is the next link.`
    ],
    drive:[
      ({pet})=>`${pet} carries directly into the space ahead.`,
      ({pet})=>`${pet} accelerates and forces the defence backwards.`,
      ({pet})=>`A change of pace from ${pet}; the hoops are getting closer.`,
      ({pet})=>`${pet} keeps the Quaffle and attacks the gap.`,
      ({pet})=>`No pass this time — ${pet} drives straight through the middle.`
    ],
    intercept:[
      ({pet,from})=>`Brilliant anticipation from ${pet}! The pass from ${from} is gone.`,
      ({pet})=>`${pet} steps into the lane and steals the Quaffle cleanly!`,
      ({pet})=>`That is a proper interception from ${pet} — read before it was thrown.`,
      ({pet})=>`${pet} has seen the picture early and shut the passing lane.`,
      ({pet})=>`Possession changes hands! ${pet} gets there first.`,
      ({pet})=>`Outstanding defensive timing by ${pet}.`,
      ({pet})=>`${pet} turns defence into attack in one movement.`,
      ({pet})=>`The Quaffle was never arriving — ${pet} had already solved the pass.`
    ],
    shot:[
      ({pet})=>`${pet} sees the hoops and lets it fly!`,
      ({pet})=>`A shooting lane opens for ${pet}!`,
      ({pet})=>`${pet} goes for goal — watch the accuracy here.`,
      ({pet})=>`The release is quick from ${pet}; the Quaffle is travelling!`,
      ({pet})=>`${pet} commits to the shot!`,
      ({pet})=>`No second thought from ${pet}. This is heading for the hoops.`,
      ({pet})=>`${pet} takes the angle before the defence can close it.`
    ],
    goal:[
      ({pet,team,score})=>`GOAL! ${pet} for ${team}! ${score}.`,
      ({pet})=>`${pet} threads it through the hoop! That is beautifully placed.`,
      ({pet})=>`That is clinical from ${pet}! The netless target does not matter when the accuracy is that good.`,
      ({pet})=>`${pet} scores! The arena erupts!`,
      ({pet})=>`Right through the centre — ${pet} makes absolutely certain.`,
      ({pet})=>`A World Cup finish from ${pet}! No chance of keeping that out.`,
      ({pet})=>`The pressure becomes a goal and ${pet} is the name on it.`,
      ({pet})=>`Superb finish! ${pet} has picked the hoop and hit it.`,
      ({pet})=>`${pet} converts the opening — that attack deserved an ending.`,
      ({pet})=>`The Quaffle flies home! ${pet} wheels away to celebrate.`
    ],
    miss:[
      ({pet})=>`${pet} pulls it wide! The opening was there, the finish was not.`,
      ({pet})=>`Too high from ${pet}. The crowd could feel that chance building.`,
      ({pet})=>`${pet} misses the target — the angle narrowed faster than expected.`,
      ({pet})=>`That one drifts beyond the hoop. ${pet} knows it was available.`,
      ({pet})=>`A rare waste from ${pet}; both sides know those chances matter.`,
      ({pet})=>`${pet} had the right idea and the wrong final few inches.`
    ],
    save:[
      ({pet,defender})=>`${defender} gets across and denies ${pet}!`,
      ({defender})=>`Strong goal-line defending from ${defender}.`,
      ({defender})=>`${defender} reads the shot and gets something in the way.`,
      ({defender})=>`Saved! ${defender} has covered the hoop beautifully.`,
      ({defender})=>`That is excellent recovery from ${defender}.`
    ],
    post:[
      ({pet})=>`OFF THE RING! ${pet} was inches away.`,
      ({pet})=>`The metal says no to ${pet}! Rebound is live.`,
      ({pet})=>`${pet} clips the hoop and the Quaffle spins back into danger.`,
      ({pet})=>`A brutal sound for ${pet} — straight off the ring!`,
      ({pet})=>`So close! ${pet} finds metal rather than daylight.`
    ],
    rebound:[
      ({pet})=>`${pet} reacts first to the rebound.`,
      ({pet})=>`Loose Quaffle claimed by ${pet}.`,
      ({pet})=>`${pet} gathers the ricochet and this phase is not over yet.`,
      ({pet})=>`The ring sends it back and ${pet} is quickest to the second ball.`,
      ({pet})=>`${pet} wins the scramble beneath the hoops.`
    ],
    foul:[
      ({offender,victim})=>`WHISTLE! ${offender} catches ${victim} late.`,
      ({offender})=>`The referee has seen enough — foul against ${offender}.`,
      ({offender,victim})=>`${victim} is knocked off the line and ${offender} is immediately called for it.`,
      ({offender})=>`Too much broom, not enough Quaffle from ${offender}.`,
      ({offender})=>`${offender} mistimes the challenge. The referee is straight onto it.`,
      ({offender})=>`That is a dangerous angle from ${offender}; play stops.`
    ],
    penalty:[
      ({team})=>`Penalty to ${team}. Everyone clears away — this is one player, three hoops, one decision.`,
      ({pet})=>`${pet} has the penalty. The arena has suddenly become very quiet.`,
      ({pet})=>`A long look at the referee, a longer look at the hoops. ${pet} is ready.`,
      ({pet})=>`${pet} against the goal area. Nothing complicated now — just execution.`
    ],
    var:[
      'Hold on. They are checking this upstairs.',
      'VAR wants another look. Nobody move; apparently we have discovered paperwork on broomsticks.',
      'The referee has been called into the review. The stadium does not enjoy waiting.',
      'We are going frame by frame. Somewhere, somebody is drawing a very serious line.',
      'VAR check in progress. Every replay makes half the stadium more certain and the other half more furious.'
    ],
    halftime:[
      'Half-time in Vardesh. Nine minutes gone and nobody gets to hide from the numbers now.',
      'That is the first half. Brooms down, breath visible, and plenty for both sides to discuss.',
      'The whistle ends the first nine minutes. We wait for CatAsthma to send them back out.'
    ],
    fulltime:[
      'FULL TIME! Eighteen minutes of World Cup Quidditch are complete.',
      'That is it in Vardesh. The referee checks the clock and brings the broadcast to full time.',
      'The final whistle goes. No Snitch, no shortcut — this result was built one possession at a time.'
    ]
  };

  const state = {
    open:false, startedAt:0, seed:0, simRand:null, visualRand:null, assets:{}, entities:[], ref:null,
    phase:'closed', introElapsed:0, matchTime:0, speed:1, half:1, firstKickoff:'belros',
    possession:'belros', carrier:null, lastPasser:null, zone:.18, passesSinceShot:0,
    actionTimer:2.4, delay:null, special:null, ball:{x:.5,y:.5,flight:null,visible:true},
    score:{belros:0,zafran:0}, shootout:null,
    teamStats:{}, playerStats:{}, camera:{x:.5,y:.5,zoom:1,tx:.5,ty:.5,tz:1,shake:0},
    eventBannerTimer:0, celebration:null, varContext:null, channel:null, subscribed:false,
    lastTs:0, raf:0, loreUsed:new Set(), introCue:-1, audioUnlocked:false, crowdBase:.18, crowdBoost:0,
    shootoutPending:false, opening:false, movementPulse:0, adminPreviewTimer:0, pendingPass:null, possessionChangedAt:0,
    broadcastState:'CLOSED', presentationKey:'', halftimeElapsed:0, halftimeReady:false, halftimeGateReady:false, secondCountdown:0,
    fulltimeElapsed:0, fulltimeData:null, events:[], kickoffToss:null, kickoffReceiver:null, prematchAudioFailed:false,
    packFixture:null, packRewardHandled:false, packHeartbeatAt:0,
    replay:null,replayIntro:null,replayOutro:null,replayBuffer:[],replayCaptureAccum:0,lastReplayAt:-999,
    storyGraphicTimer:34,storyGraphicUntil:0,storyGraphicIndex:0,
    cameraDirector:{shot:'MAIN',timer:0,lastShot:'',cutSerial:0},
    broadcast:null,bigMomentTimer:0,arena:null,ambienceId:'crown-of-vardesh-glacier',
    barryOpeningActive:false,barryOpeningDone:false,openingFilmOriginAt:0,
    openingFilmActive:false,openingFilmDone:false,openingFilmMutedFallback:false,openingFilmSrc:'',openingFilmDuration:0,gameplayStartedAt:0,gameplayAssetsReady:false,gameplayAssetsFailed:false,realResultArmed:false,realResultReported:false,
    syncRole:'viewer',syncSeq:0,syncEventSeq:0,syncPresentationSeq:0,syncLastSentAt:0,syncLastReceivedAt:0,syncHasAuthority:false,syncSendBusy:false,
    syncRemote:null,syncRemoteTargets:null,syncClockBase:0,syncClockSentAt:0,syncClockRunning:false,syncClockOffsetMs:0,syncClockOffsetReady:false,syncClockOffsetSamples:[],syncLastFlightKind:'',remoteReplayFrame:null,remoteReplayFrameSmooth:null,remoteReplayStatus:'',remoteReplayLabel:'',syncLastEventSeq:0,syncLastPresentationSeq:0,
    remoteCelebrationTimeline:null,remoteReplayTimeline:null,syncCelebrationTimeline:null,syncReplayTimeline:null
  };

  function blankTeamStats(){return {shots:0,onTarget:0,passes:0,completed:0,interceptions:0,rebounds:0,fouls:0,penalties:0,var:0,possession:0,tacklesAttempted:0,tacklesWon:0,turnovers:0,counterattacks:0,presses:0}}
  function resetStats(){
    state.teamStats={belros:blankTeamStats(),zafran:blankTeamStats()};
    state.playerStats=Object.fromEntries(allPlayers.map(p=>[p.id,{goals:0,assists:0,shots:0,interceptions:0,fouls:0,passes:0,completed:0,saves:0,rebounds:0,tacklesAttempted:0,tacklesWon:0}]));
  }

  function createUi(){
    if ($('wcWorldCupBroadcast')) return;
    const root=document.createElement('div');root.id='wcWorldCupBroadcast';root.setAttribute('aria-hidden','true');
    root.innerHTML=`<div id="wcgBackdropFx" class="wcg-backdrop-fx" aria-hidden="true"></div><div class="wcg-shell" role="dialog" aria-modal="true" aria-label="Repo Sports World Cup live match">
      <div id="wcgBarryOpening" class="wcg-barry-opening" aria-hidden="true">
        <img class="wcg-barry-opening-bg" src="${WORLD_CUP_BARRY_OPENING_BACKDROP}" alt="" aria-hidden="true">
        <div class="wcg-barry-opening-particles" aria-hidden="true"></div>
        <div class="wcg-barry-opening-presenter"><img id="wcgBarryOpeningSprite" src="${BARRY.neutral}" alt="Barry Bramble"></div>
        <img class="wcg-barry-opening-desk" src="${WORLD_CUP_BARRY_OPENING_BACKDROP}" alt="" aria-hidden="true">
        <div class="wcg-barry-opening-vignette" aria-hidden="true"></div>
        <audio id="wcgBarryOpeningAudio" preload="auto"></audio>
        <button id="wcgBarryOpeningSound" type="button" hidden>CLICK FOR SOUND</button>
      </div>
      <div id="wcgOpeningFilm" class="wcg-opening-film" aria-hidden="true"><video id="wcgOpeningFilmVideo" playsinline preload="auto"></video><button id="wcgOpeningFilmSound" type="button" hidden>CLICK FOR SOUND</button></div>
      <canvas id="wcgCanvas" class="wcg-canvas" width="${W}" height="${H}"></canvas>
      <div id="wcgSnow" class="wcg-snow" aria-hidden="true"></div>
      <div id="wcgWorldCupAtmosphere" class="wcg-worldcup-atmosphere" data-arena="crown-of-vardesh-glacier" aria-hidden="true"><i class="wcg-atmos-aurora"></i><i class="wcg-atmos-mist"></i></div>
      <div class="wcg-scorebar wcg-scorebar-premium">
        <img class="wcg-scorebar-frame" src="${BASE}world-cup-scorebar-frame.png" alt="" aria-hidden="true">
        <div class="wcg-score-flag wcg-score-flag-home"><img id="wcgHomeFlag" alt=""></div>
        <div class="wcg-score-team wcg-score-team-home"><span id="wcgHomeAbbr">BEL</span><b id="wcgHomeTeamName">BELROS</b><small id="wcgHomePlayers">JUD · NIMBLER 2000 · BRAMBLE</small></div>
        <small id="wcgHomeScorers" class="wcg-score-scorers wcg-score-scorers-home"></small>
        <strong id="wcgScoreBelros" class="wcg-team-goals wcg-score-home-goals">0</strong>
        <div class="wcg-clock"><b id="wcgClock">PRE</b><span id="wcgPhase">WORLD CUP</span><em id="wcgArena">CROWN OF VARDESH GLACIER</em></div>
        <strong id="wcgScoreZafran" class="wcg-team-goals wcg-score-away-goals">0</strong>
        <div class="wcg-score-team wcg-score-team-away"><span id="wcgAwayAbbr">ZAF</span><b id="wcgAwayTeamName">ZAFRAN</b><small id="wcgAwayPlayers">ZIZI · RAFI · SAFFI</small></div>
        <small id="wcgAwayScorers" class="wcg-score-scorers wcg-score-scorers-away"></small>
        <div class="wcg-score-flag wcg-score-flag-away"><img id="wcgAwayFlag" alt=""></div>
      </div>
      <div class="wcg-live-chip">REPO SPORTS · LIVE</div>
      <div class="wcg-volume-control" title="World Cup TV master volume">
        <span>VOL</span><input id="wcgMasterVolume" type="range" min="0" max="100" step="1" value="80" aria-label="World Cup TV master volume"><b id="wcgMasterVolumeValue">80</b>
      </div>
      <div id="wcgReplaySponsor" class="wcg-worldcup-replay-sponsor" aria-hidden="true"><div><img src="assets/repo-sports-logo.png" alt=""><span>WORLD CUP REPLAY</span></div></div>
      <div id="wcgReplayBug" class="wcg-worldcup-replay-bug" aria-hidden="true"><b>REPLAY</b><span>SLOW MOTION · REPO SPORTS WORLD CUP</span></div>
      <div id="wcgStoryCard" class="wcg-worldcup-story-card" aria-hidden="true"><div class="wcg-worldcup-story-accent"></div><div class="wcg-worldcup-story-copy"><small id="wcgStoryKicker">WORLD CUP LIVE</small><b id="wcgStoryTitle"></b><span id="wcgStoryBody"></span></div><img id="wcgStoryPlayer" class="wcg-worldcup-story-player" alt=""></div>
      <div id="wcgWorldCupMoment" class="wcg-worldcup-big-moment" aria-hidden="true"><div class="wcg-worldcup-big-moment-flash"></div><div id="wcgWorldCupMomentParticles" class="wcg-worldcup-big-moment-particles"></div><div class="wcg-worldcup-big-moment-card"><small id="wcgWorldCupMomentKicker">REPO SPORTS WORLD CUP</small><strong id="wcgWorldCupMomentTitle">HAT TRICK</strong><b id="wcgWorldCupMomentPlayer"></b><span id="wcgWorldCupMomentTeam"></span></div></div>
      <div id="wcgPresentation" class="wcg-presentation" aria-hidden="true"><div id="wcgPresentationPanel" class="wcg-presentation-panel"><small id="wcgPresentationKicker"></small><h1 id="wcgPresentationTitle"></h1><div id="wcgPresentationBody" class="wcg-presentation-body"></div><footer id="wcgPresentationFooter"></footer></div></div>
      <div id="wcgEventBanner" class="wcg-event-banner"></div>
      <aside id="wcgTournamentLeaders" class="wcg-tournament-leaders" aria-label="World Cup goals leaderboard">
        <header>
          <small>REPO SPORTS · WORLD CUP 2026</small>
          <div class="wcg-leaderboard-title"><i aria-hidden="true">◆</i><b>GOAL LEADERS</b><i aria-hidden="true">◆</i></div>
          <span id="wcgTournamentLeadersMode">OFFICIAL REAL RESULTS</span>
        </header>
        <section class="wcg-leaderboard-section wcg-leaderboard-players"><div class="wcg-leaderboard-section-head"><h4>TOP SCORERS</h4><span>GOALS</span></div><div id="wcgTournamentPlayerLeaders" class="wcg-tournament-leader-list"><p>NO REAL GOALS YET</p></div></section>
        <section class="wcg-leaderboard-section wcg-leaderboard-teams"><div class="wcg-leaderboard-section-head"><h4>NATIONS</h4><span>GOALS</span></div><div id="wcgTournamentTeamLeaders" class="wcg-tournament-leader-list"><p>NO REAL GOALS YET</p></div></section>
        <footer><span>LIVE TOURNAMENT TOTALS</span><b>REPO SPORTS</b></footer>
      </aside>
      <div id="wcgCommentator" class="wcg-commentator wcg-commentator-premium" data-barry-state="NEUTRAL">
        <img class="wcg-commentator-frame" src="${BASE}world-cup-commentator-frame.png" alt="" aria-hidden="true">
        <div class="wcg-commentator-portrait"><img id="wcgBarrySprite" class="wcg-barry" src="assets/commentator-22.png" alt="Barry Bramble"></div>
        <div class="wcg-commentator-heading"><b>BARRY BRAMBLE</b><span>LIVE COMMENTARY · REPO SPORTS</span></div>
        <p id="wcgCommentary" class="wcg-commentary-copy">Welcome to the Repo Sports World Cup.</p>
      </div>
      <div class="wcg-mini-stats wcg-mini-stats-premium">
        <img class="wcg-mini-stats-frame" src="${BASE}world-cup-live-stats-frame.png" alt="" aria-hidden="true">
        <b id="wcgStatsHomeTeam" class="wcg-mini-stats-team wcg-mini-stats-team-home">BELROS</b>
        <b id="wcgStatsAwayTeam" class="wcg-mini-stats-team wcg-mini-stats-team-away">ZAFRAN</b>
        <div id="wcgMiniStats" class="wcg-mini-stats-values">
          <div><span id="wcgStatHShots">0</span><span id="wcgStatAShots">0</span></div>
          <div><span id="wcgStatHOnTarget">0</span><span id="wcgStatAOnTarget">0</span></div>
          <div><span id="wcgStatHPoss">50%</span><span id="wcgStatAPoss">50%</span></div>
          <div><span id="wcgStatHInts">0</span><span id="wcgStatAInts">0</span></div>
          <div><span id="wcgStatHFouls">0</span><span id="wcgStatAFouls">0</span></div>
          <div><span id="wcgStatHVar">0</span><span id="wcgStatAVar">0</span></div>
        </div>
      </div>
      <div id="wcgVar" class="wcg-var-box"><div class="wcg-var-card"><b id="wcgVarTitle">VAR CHECK</b><span id="wcgVarText">Reviewing the incident…</span></div></div>
      <div id="wcgHalftime" class="wcg-overlay-card wcg-halftime-overlay"><div class="wcg-panel wcg-halftime-pro">
        <header class="wcg-halftime-pro-head"><img src="assets/repo-sports-logo.png" alt="Repo Sports"><div><small>VELMORA QUIDDITCH WORLD CUP · HALF-TIME DESK</small><h2 id="wcgHalfTitle">HALF TIME</h2><span id="wcgHalfArena">WORLD CUP 2026</span></div><b>LIVE</b></header>
        <section class="wcg-halftime-scoreline"><div><small id="wcgHalfHomeName">HOME</small><strong id="wcgHalfBelros">0</strong></div><span>9 MINUTES COMPLETE</span><div><strong id="wcgHalfZafran">0</strong><small id="wcgHalfAwayName">AWAY</small></div></section>
        <section id="wcgHalfStatBoard" class="wcg-halftime-pro-stats"></section>
        <section class="wcg-halftime-pro-bottom"><article id="wcgHalfPlayerCard" class="wcg-halftime-feature"></article><article id="wcgHalfMomentCard" class="wcg-halftime-feature"></article><article class="wcg-halftime-barry"><small>BARRY BRAMBLE · HALF-TIME</small><p id="wcgHalfCopy">Waiting for CatAsthma to continue the broadcast.</p></article></section>
        <footer class="wcg-halftime-pro-foot"><span id="wcgHalfShots">FIRST-HALF DATA</span><button id="wcgContinueHalf" type="button">CONTINUE SECOND HALF</button></footer>
      </div></div>
      <div id="wcgFulltime" class="wcg-overlay-card"><div class="wcg-panel"><h2 id="wcgFullTitle">FULL TIME</h2><h3 id="wcgFullSubtitle">BELROS · ZAFRAN</h3><p id="wcgFullScore"></p><div id="wcgFullStats" class="wcg-fulltime-grid"></div><div id="wcgFullPlayers" class="wcg-worldcup-player-report"></div><p id="wcgMvp"></p><button id="wcgReturnLobby" type="button">RETURN TO WAITING ROOM</button></div></div>
      <div class="wcg-controls"><button id="wcgSkipHalf" class="wcg-control wcg-admin-only" type="button" hidden>SKIP TO HALF TIME</button><button id="wcgSpeed" class="wcg-control wcg-admin-only" type="button" hidden>TEST SPEED ×4</button><button id="wcgAdminEvents" class="wcg-control wcg-admin-only" type="button" hidden>ADMIN EVENT TESTS</button><button id="wcgExit" class="wcg-control" type="button">EXIT BROADCAST</button></div><div id="wcgAdminPanel" class="wcg-admin-panel" hidden><div class="wcg-admin-title">WORLD CUP · ADMIN TEST DECK</div><div class="wcg-admin-grid"><button data-test-event="goal">GOAL</button><button data-test-event="save">SAVE</button><button data-test-event="miss">MISS</button><button data-test-event="post">POST / REBOUND</button><button data-test-event="foul">FOUL</button><button data-test-event="freekick">FREE KICK</button><button data-test-event="penalty">PENALTY</button><button data-test-event="brawl">BRAWL</button><button data-test-event="hattrick">HAT TRICK POPUP</button><button data-test-event="penaltypopup">PENALTY POPUP</button><button data-test-event="var">VAR CHECK</button><button data-test-event="intercept">INTERCEPTION</button></div></div>
      <div class="wcg-screen-effects"></div><img class="wcg-tv-frame" src="${BASE}broadcast-tv-frame.webp" alt="" aria-hidden="true">
    </div>`;
    document.body.appendChild(root);
    // Keep the TV and its master-volume control as one physical stack. The
    // tournament leaderboard is a separate broadcast sidecar to the RIGHT of
    // the television, never drawn over the game picture.
    const shell=root.querySelector('.wcg-shell');
    const volumeControl=root.querySelector('.wcg-volume-control');
    const tournamentLeaders=root.querySelector('.wcg-tournament-leaders');
    if(shell){
      const tvStack=document.createElement('div');
      tvStack.className='wcg-tv-stack';
      root.insertBefore(tvStack,shell);
      tvStack.appendChild(shell);
      if(volumeControl)tvStack.appendChild(volumeControl);
    }else if(volumeControl)root.appendChild(volumeControl);
    if(tournamentLeaders)root.appendChild(tournamentLeaders);
    const backdropFx=$('wcgBackdropFx');
    if(backdropFx){
      for(let i=0;i<34;i++){const p=document.createElement('i');p.className='wcg-bg-snow';p.style.setProperty('--x',`${(i*41)%101}%`);p.style.setProperty('--drift',`${-38+(i%13)*6}px`);p.style.setProperty('--dur',`${11+(i%9)*1.35}s`);p.style.setProperty('--delay',`-${(i%17)*1.2}s`);p.style.setProperty('--size',`${1+(i%4)*.65}px`);backdropFx.appendChild(p)}
      for(let i=0;i<10;i++){const p=document.createElement('i');p.className='wcg-bg-ember';p.style.setProperty('--x',`${4+(i*29)%93}%`);p.style.setProperty('--dur',`${8+(i%6)*1.8}s`);p.style.setProperty('--delay',`-${(i%11)*2.2}s`);p.style.setProperty('--sway',`${-24+(i%7)*8}px`);backdropFx.appendChild(p)}
      for(let i=0;i<7;i++){const p=document.createElement('i');p.className='wcg-bg-confetti';p.style.setProperty('--x',`${8+(i*17)%84}%`);p.style.setProperty('--dur',`${22+(i%4)*5}s`);p.style.setProperty('--delay',`${4+(i*5)%24}s`);p.style.setProperty('--spin',`${180+(i%4)*120}deg`);p.style.setProperty('--shift',`${-90+(i%5)*45}px`);p.dataset.tone=String(i%3);backdropFx.appendChild(p)}
    }
    const snow=$('wcgSnow');
    for(let i=0;i<54;i++){
      const f=document.createElement('i');const r=(i*37)%101;f.style.left=`${r}%`;f.style.animationDuration=`${7+(i%9)*.7}s`;f.style.animationDelay=`-${(i%13)*.7}s`;f.style.setProperty('--drift',`${-22+(i%11)*4}px`);if(i%5===0){f.style.width='3px';f.style.height='3px';f.style.opacity='.75'}snow.appendChild(f);
    }
    $('wcgOpeningFilmSound')?.addEventListener('click',()=>{const v=$('wcgOpeningFilmVideo');if(!v)return;v.muted=false;audio.setElementVolume(v,1);state.openingFilmMutedFallback=false;$('wcgOpeningFilmSound').hidden=true;v.play()?.catch?.(()=>{})});
    $('wcgBarryOpeningSound')?.addEventListener('click',()=>{const a=$('wcgBarryOpeningAudio');if(!a)return;a.muted=false;audio.setElementVolume(a,.92);$('wcgBarryOpeningSound').hidden=true;const elapsed=barryOpeningWallElapsed();try{a.currentTime=clamp(elapsed,0,Math.max(0,WORLD_CUP_BARRY_OPENING_DURATION-.08))}catch(_){}a.play()?.catch?.(()=>{})});
    $('wcgContinueHalf').addEventListener('click',advanceHalftimeControl);
    $('wcgReturnLobby').addEventListener('click',()=>closeBroadcast(true));
    $('wcgExit').addEventListener('click',()=>closeBroadcast(true));
    $('wcgSpeed').addEventListener('click',toggleSpeed);
    $('wcgSkipHalf').addEventListener('click',skipToHalftime);
    $('wcgAdminEvents').addEventListener('click',()=>{const panel=$('wcgAdminPanel');panel.hidden=!panel.hidden});
    document.querySelectorAll('[data-test-event]').forEach(btn=>btn.addEventListener('click',()=>previewAdminEvent(btn.dataset.testEvent)));
    audio.loadMaster();audio.syncVolumeUi();
    $('wcgMasterVolume')?.addEventListener('input',e=>audio.setMaster(Number(e.currentTarget.value)/100));
    window.addEventListener('repo-world-cup-tournament-state',()=>renderWorldCupTournamentLeaders());
    document.addEventListener('keydown',e=>{if(state.open&&e.key==='Escape'&&state.phase!=='halftime'){e.preventDefault();e.stopPropagation();closeBroadcast(true)}},true);
  }

  const img = src => new Promise((resolve,reject)=>{const i=new Image();i.decoding='async';i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
  // The deployed World Cup flag assets use the canonical "-flag.png" filenames.
  // Keep this isolated to World Cup presentation so Club Mode and the rest of the site remain untouched.
  const worldCupFlagSrc=team=>`assets/world-cup-flags-transparent/${String(team||'').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-flag.png`;
  function scorerSummary(team){
    const scorers=(roster[team]||[]).map(p=>({name:p.name,goals:Number(state.playerStats?.[p.id]?.goals)||0})).filter(p=>p.goals>0);
    return scorers.length?scorers.map(p=>`${p.name} ×${p.goals}`).join(' · '):'';
  }
  function applyFixtureUiLabels(){
    const root=$('wcWorldCupBroadcast');if(!root)return;
    const homeCountry=teamMeta.belros.countryKey||'belros',awayCountry=teamMeta.zafran.countryKey||'zafran';
    const values={
      wcgHomeAbbr:teamMeta.belros.abbr,wcgHomeTeamName:teamMeta.belros.name,wcgHomePlayers:roster.belros.map(p=>p.name).join(' · '),
      wcgAwayAbbr:teamMeta.zafran.abbr,wcgAwayTeamName:teamMeta.zafran.name,wcgAwayPlayers:roster.zafran.map(p=>p.name).join(' · '),
      wcgStatsHomeTeam:teamMeta.belros.name,wcgStatsAwayTeam:teamMeta.zafran.name
    };
    for(const [id,value] of Object.entries(values)){const el=$(id);if(el)el.textContent=value||''}
    const hf=$('wcgHomeFlag'),af=$('wcgAwayFlag');
    if(hf){hf.src=worldCupFlagSrc(homeCountry);hf.alt=`${teamMeta.belros.name} flag`}
    if(af){af.src=worldCupFlagSrc(awayCountry);af.alt=`${teamMeta.zafran.name} flag`}
    const halfTeams=root.querySelectorAll('.wcg-halftime-stats .wcg-half-team b');
    if(halfTeams[0])halfTeams[0].textContent=teamMeta.belros.name;
    if(halfTeams[1])halfTeams[1].textContent=teamMeta.zafran.name;
    const full=$('wcgFullSubtitle');if(full)full.textContent=`${teamMeta.belros.name} · ${teamMeta.zafran.name}`;
    const arena=activeArena(),arenaClock=$('wcgArena'),halfArena=$('wcgHalfArena'),atmos=$('wcgWorldCupAtmosphere');
    if(arenaClock)arenaClock.textContent=arena.name;if(halfArena)halfArena.textContent=`${arena.name} · WORLD CUP 2026`;if(atmos)atmos.dataset.arena=arena.id;
    root.dataset.worldCupArena=arena.id;
    root.style.setProperty('--wc-home-colour',teamMeta.belros.colour||'#c7983e');
    root.style.setProperty('--wc-away-colour',teamMeta.zafran.colour||'#8ac5e6');
  }

  async function loadExactWorldCupPlayerImage(p,kind){
    const src=kind==='standing'?p?.standing:p?.riding;
    if(!src||!src.startsWith('assets/world-cup-teams/')){
      throw new Error(`[WORLD CUP] Invalid ${kind} sprite path for ${p?.name||'unknown player'}: ${src||'missing'}`);
    }
    try{
      const image=await img(src);
      image.__repoSrc=src;
      return image;
    }catch(error){
      console.error('[WORLD CUP] Exact national-team sprite failed to load',{fixture:state.fixtureId,player:p?.name,kind,src,error});
      throw error;
    }
  }
  async function preload(){
    if(!state.assets.arena)state.assets.arena=await img(activeArena().src);
    if(!state.assets.ball)state.assets.ball=await img(BASE+'world-cup-ball.webp');
    if(!state.assets.refStanding)state.assets.refStanding=await img(BASE+'ref-standing.webp');
    if(!state.assets.refFlying)state.assets.refFlying=await img(BASE+'ref-flying.webp');
    for(const p of allPlayers){
      const sk=p.id+'Standing',rk=p.id+'Riding';
      if(!state.assets[sk])state.assets[sk]=await loadExactWorldCupPlayerImage(p,'standing');
      if(!state.assets[rk])state.assets[rk]=await loadExactWorldCupPlayerImage(p,'riding');
    }
    state.assetFixtureKey=state.fixtureId||`${teamMeta.belros.countryKey}-${teamMeta.zafran.countryKey}`;
  }

  const audio = {
    crowd:null,whistle:null,goal:null,goalCheer:null,prematch:null,intercepts:[],shots:[],rebounds:[],windCtx:null,windSource:null,windGain:null,
    worldCupTrack1:null,worldCupTrack2:null,clubMatchTracks:[],musicSequenceStarted:false,currentMusic:null,currentMusicIndex:-1,currentMusicType:'',
    masterVolume:.80,masterLoaded:false,
    loadMaster(){
      if(this.masterLoaded)return this.masterVolume;this.masterLoaded=true;
      try{const saved=Number(localStorage.getItem('repoSportsWorldCupTvVolume'));if(Number.isFinite(saved))this.masterVolume=clamp(saved,0,1)}catch(_){}
      return this.masterVolume;
    },
    scaled(v){this.loadMaster();return clamp(Number(v)||0,0,1)*this.masterVolume},
    setElementVolume(a,base){if(!a)return;const b=clamp(Number(base)||0,0,1);a.__wcgBaseVolume=b;try{a.volume=this.scaled(b)}catch(_){}},
    syncVolumeUi(){const slider=$('wcgMasterVolume'),readout=$('wcgMasterVolumeValue'),pct=Math.round(this.masterVolume*100);if(slider&&Number(slider.value)!==pct)slider.value=String(pct);if(readout)readout.textContent=String(pct)},
    reapplyMaster(){
      const all=[this.crowd,this.whistle,this.goal,this.goalCheer,this.prematch,this.worldCupTrack1,this.worldCupTrack2,...(this.clubMatchTracks||[]),...(this.intercepts||[]),...(this.shots||[]),...(this.rebounds||[])];
      all.forEach(a=>{if(a&&Number.isFinite(a.__wcgBaseVolume))this.setElementVolume(a,a.__wcgBaseVolume)});
      const video=$('wcgOpeningFilmVideo');if(video&&Number.isFinite(video.__wcgBaseVolume))this.setElementVolume(video,video.__wcgBaseVolume);
      const barryOpening=$('wcgBarryOpeningAudio');if(barryOpening&&Number.isFinite(barryOpening.__wcgBaseVolume))this.setElementVolume(barryOpening,barryOpening.__wcgBaseVolume);
      if(this.windGain)try{this.windGain.gain.value=.018*this.masterVolume}catch(_){};this.syncVolumeUi();
    },
    setMaster(v,persist=true){this.masterVolume=clamp(Number(v)||0,0,1);this.masterLoaded=true;if(persist)try{localStorage.setItem('repoSportsWorldCupTvVolume',String(this.masterVolume))}catch(_){}this.reapplyMaster()},
    ensure(){
      this.loadMaster();if(this.crowd)return;
      this.crowd=new Audio('assets/quidditch-crowd.mp3');this.crowd.loop=true;this.crowd.preload='auto';
      this.whistle=new Audio('assets/quidditch-kickoff-whistle.mp3');
      this.goal=new Audio('assets/quidditch-sfx/goal.mp3');
      this.goalCheer=new Audio(`${BASE}crowd-sfx/goal-cheer.mp3`);this.goalCheer.preload='auto';
      this.prematch=new Audio(PREMATCH_ANTHEM);this.prematch.preload='auto';this.prematch.loop=false;
      this.worldCupTrack1=new Audio(WORLD_CUP_KICKOFF_TRACK_1);this.worldCupTrack1.preload='auto';this.worldCupTrack1.loop=false;
      this.worldCupTrack2=new Audio(WORLD_CUP_KICKOFF_TRACK_2);this.worldCupTrack2.preload='auto';this.worldCupTrack2.loop=false;
      this.clubMatchTracks=CLUB_MATCH_TRACKS.map(src=>{const a=new Audio(src);a.preload='auto';a.loop=false;return a;});
      this.intercepts=[1,2].map(n=>new Audio(`assets/quidditch-intercept-${n}.mp3`));
      this.shots=[1,2,3,4,5].map(n=>new Audio(`assets/quidditch-sfx/shot-${n}.mp3`));
      this.rebounds=[1,2,3,4].map(n=>new Audio(`assets/quidditch-sfx/rebound-${n}.mp3`));
    },
    play(a,vol=.55){try{if(!a)return;a.pause();a.currentTime=0;this.setElementVolume(a,vol);const p=a.play();p?.catch?.(()=>{})}catch(_){}},
    start(){this.ensure();try{this.setElementVolume(this.crowd,state.phase==='intro'?.09:state.crowdBase);this.crowd.currentTime=0;this.crowd.play()?.catch?.(()=>{})}catch(_){};this.startWind()},
    startPrematch(offset=0){this.ensure();const a=this.prematch;if(!a)return;try{a.pause();this.setElementVolume(a,.50);a.playbackRate=1;const begin=()=>{try{a.currentTime=clamp(offset,0,Math.max(0,(a.duration||INTRO_SECONDS)-.08));const pr=a.play();pr?.catch?.(()=>{state.prematchAudioFailed=true})}catch(_){state.prematchAudioFailed=true}};a.onended=()=>{if(state.open&&state.phase==='intro')completePrematch()};if(Number.isFinite(a.duration)&&a.duration>0)begin();else a.addEventListener('loadedmetadata',begin,{once:true})}catch(_){state.prematchAudioFailed=true}},
    stopCurrentMusic(resetTime=true){
      const a=this.currentMusic;if(!a)return;
      try{a.pause();if(resetTime)a.currentTime=0;}catch(_){}
      if(a.__repoOnEnded){a.removeEventListener('ended',a.__repoOnEnded);a.__repoOnEnded=null;}
      this.currentMusic=null;
    },
    startWorldCupMatchMusic(){
      this.ensure();
      if(this.musicSequenceStarted&&this.currentMusic){
        const pr=this.currentMusic.play?.();pr?.catch?.(()=>{});
        return;
      }
      if(this.musicSequenceStarted&&!this.currentMusic){
        this.playTrackByIndex(this.currentMusicType==='club' ? Math.max(0,this.currentMusicIndex) : 0,this.currentMusicType||'club');
        return;
      }
      this.musicSequenceStarted=true;
      this.playNamedTrack(this.worldCupTrack1,.25,'worldcup-1',()=>this.playNamedTrack(this.worldCupTrack2,.25,'worldcup-2',()=>this.playTrackByIndex(0,'club')));
    },
    playNamedTrack(a,volume,type,onEnded){
      if(!a)return onEnded?.();
      this.stopCurrentMusic(false);
      this.currentMusic=a;this.currentMusicType=type;this.currentMusicIndex=type==='club'?this.currentMusicIndex:-1;
      try{a.pause();a.currentTime=0;a.loop=false;this.setElementVolume(a,volume);}catch(_){}
      const done=()=>{if(a.__repoOnEnded){a.removeEventListener('ended',a.__repoOnEnded);a.__repoOnEnded=null;}if(this.currentMusic===a)this.currentMusic=null;onEnded?.();};
      a.__repoOnEnded=done;a.addEventListener('ended',done,{once:true});
      const pr=a.play();pr?.catch?.(()=>done());
    },
    playTrackByIndex(index=0,type='club'){
      this.ensure();
      const tracks=this.clubMatchTracks||[];if(!tracks.length)return;
      const safe=((index%tracks.length)+tracks.length)%tracks.length;
      const a=tracks[safe];
      this.stopCurrentMusic(false);
      this.currentMusic=a;this.currentMusicType='club';this.currentMusicIndex=safe;
      try{a.pause();a.currentTime=0;a.loop=false;this.setElementVolume(a,.25);}catch(_){}
      const done=()=>{if(a.__repoOnEnded){a.removeEventListener('ended',a.__repoOnEnded);a.__repoOnEnded=null;}if(this.currentMusic===a)this.currentMusic=null;this.playTrackByIndex((safe+1)%tracks.length,'club');};
      a.__repoOnEnded=done;a.addEventListener('ended',done,{once:true});
      const pr=a.play();pr?.catch?.(()=>{});
    },
    pauseWorldCupMatchMusic(){const a=this.currentMusic;if(!a)return;try{a.pause()}catch(_){}},
    resumeWorldCupMatchMusic(){if(!this.musicSequenceStarted)return this.startWorldCupMatchMusic();const a=this.currentMusic;if(!a)return;const pr=a.play?.();pr?.catch?.(()=>{});},
    startWind(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC||this.windCtx)return;const ctx=new AC(),buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.42;const src=ctx.createBufferSource(),low=ctx.createBiquadFilter(),high=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=buffer;src.loop=true;low.type='lowpass';low.frequency.value=780;high.type='highpass';high.frequency.value=90;gain.gain.value=.018*this.masterVolume;src.connect(low);low.connect(high);high.connect(gain);gain.connect(ctx.destination);src.start();this.windCtx=ctx;this.windSource=src;this.windGain=gain}catch(_){}} ,
    stop(){this.ensure();this.stopCurrentMusic();this.musicSequenceStarted=false;this.currentMusicIndex=-1;this.currentMusicType='';[this.crowd,this.whistle,this.goal,this.goalCheer,this.prematch,this.worldCupTrack1,this.worldCupTrack2,...(this.clubMatchTracks||[]),...this.intercepts,...this.shots,...this.rebounds].forEach(a=>{try{a.pause();a.currentTime=0}catch(_){}});try{this.windSource?.stop()}catch(_){};try{this.windCtx?.close()}catch(_){};this.windSource=null;this.windCtx=null;this.windGain=null},
    crowdHit(amount=.22){state.crowdBoost=Math.max(state.crowdBoost,amount)},
    goalCelebration(){this.ensure();this.play(this.goalCheer,.15);this.crowdHit(.58)},
    shot(){this.ensure();this.play(this.shots[Math.floor((state.visualRand?.()||Math.random())*this.shots.length)],.48)},
    rebound(){this.ensure();this.play(this.rebounds[Math.floor((state.visualRand?.()||Math.random())*this.rebounds.length)],.55)},
    intercept(){this.ensure();this.play(this.intercepts[Math.floor((state.visualRand?.()||Math.random())*this.intercepts.length)],.46)},
    varTone(){
      try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC();const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.setValueAtTime(620,ctx.currentTime);o.frequency.setValueAtTime(440,ctx.currentTime+.16);g.gain.setValueAtTime(.045*this.masterVolume,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.42);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.45)}catch(_){}
    }
  };

  function stopWorldCupMenuAudio(){
    ['worldCupEventMusic','worldCupMeetTeamsMusic','worldCupTvAudio'].forEach(id=>{const a=$(id);if(a){try{a.pause()}catch(_){}}});
  }
  function restoreWorldCupMenuAudio(){
    const a=$('worldCupEventMusic');if(a){try{a.volume=.30;a.play()?.catch?.(()=>{})}catch(_){}}
  }

  function pick(arr){return arr[Math.floor(state.simRand()*arr.length)]}
  function formatLine(kind,data={}){const entry=pick(commentary[kind]);return typeof entry==='function'?entry(data):entry}
  function commentaryOpts(kind){
    const map={goal:[10,'goal',true],var:[9,'var',true],penalty:[8,'shocked',true],save:[7,'excited',true],post:[7,'shocked',true],foul:[6,'interested',true],intercept:[6,'excited',true],shot:[4,'interested',false],rebound:[5,'excited',false],kickoff:[8,'excited',true],halftime:[8,'halftime',true],fulltime:[10,'fulltime',true],pass:[2,'calm',false],drive:[3,'interested',false],miss:[4,'interested',false]};
    const [priority,intensity,force]=map[kind]||[2,'calm',false];return {priority,intensity,force,kind};
  }
  function barryEl(){return $('wcgBarrySprite')}
  function barryAsset(src){const el=barryEl();if(el&&src&&el.getAttribute('src')!==src)el.src=src}
  function stopBarryTalking(){
    const b=state.broadcast;if(!b)return;clearInterval(b.talkTimer);clearTimeout(b.speakTimer);b.talkTimer=0;b.speakTimer=0;b.speaking=false;$('wcgCommentator')?.classList.remove('is-speaking');
  }
  function resetBarryVisual(){
    const b=state.broadcast;if(!b)return;const w=$('wcgCommentator');if(w){w.dataset.barryState='NEUTRAL';w.classList.remove('is-excited','is-shocked','is-goal','is-var','is-interested')}barryAsset(BARRY.neutral);b.barryState='NEUTRAL';b.barryPriority=0;b.barryUntil=0;
  }
  function barryReaction(name='NEUTRAL',priority=1,duration=900){
    const b=state.broadcast;if(!b)return false;const now=performance.now();if(now<(b.barryUntil||0)&&priority<(b.barryPriority||0))return false;
    clearTimeout(b.reactionTimer);b.barryState=name;b.barryPriority=priority;b.barryUntil=now+duration;
    const w=$('wcgCommentator');if(w){w.dataset.barryState=name;w.classList.remove('is-excited','is-shocked','is-goal','is-var','is-interested');}
    if(name==='GOAL_REACTION'){barryAsset(BARRY.goal);w?.classList.add('is-goal')}
    else if(name==='VAR_REACTION'){barryAsset(BARRY.var);w?.classList.add('is-var')}
    else if(name==='SHOCKED'){barryAsset(BARRY.shocked);w?.classList.add('is-shocked')}
    else if(name==='EXCITED'){barryAsset(BARRY.interested);w?.classList.add('is-excited')}
    else if(name==='INTERESTED'){barryAsset(BARRY.interested);w?.classList.add('is-interested')}
    else if(name==='HALFTIME'){barryAsset(BARRY.halftime)}
    else if(name==='FULLTIME'){barryAsset(BARRY.fulltime)}
    else barryAsset(BARRY.neutral);
    b.reactionTimer=setTimeout(()=>{if(!state.open||b.speaking)return;resetBarryVisual();flushBarryQueue()},duration);return true;
  }
  function flushBarryQueue(){const b=state.broadcast;if(!b||b.speaking||!b.queue)return;const q=b.queue;b.queue=null;say(q.text,{...q.opts,force:true})}
  function say(text,opts={}){
    const box=$('wcgCommentary'),wrap=$('wcgCommentator');if(!box)return false;const b=state.broadcast||(state.broadcast={barryPriority:0,barryUntil:0,speaking:false,queue:null});
    const priority=Number(opts.priority)||2,now=performance.now();if(!opts.force&&now<(b.barryUntil||0)&&priority<(b.barryPriority||0)){if(priority>=4)b.queue={text,opts};return false}
    stopBarryTalking();box.textContent=text;b.lastSpokenAt=now;b.barryPriority=priority;
    if(isHost()&&state.subscribed&&!opts.remote)void sendMatch('sync-commentary',{fixtureId:state.fixtureId,sentAt:Date.now(),text:String(text||''),opts:{priority,intensity:opts.intensity||'calm'}});
    const intensity=opts.intensity||'calm';
    if(intensity==='goal')barryReaction('GOAL_REACTION',priority,2200);else if(intensity==='var')barryReaction('VAR_REACTION',priority,1900);else if(intensity==='shocked')barryReaction('SHOCKED',priority,1500);else if(intensity==='excited')barryReaction('EXCITED',priority,1350);else if(intensity==='interested')barryReaction('INTERESTED',priority,1100);else if(intensity==='halftime')barryReaction('HALFTIME',priority,1800);else if(intensity==='fulltime')barryReaction('FULLTIME',priority,2400);else barryReaction('NEUTRAL',priority,900);
    b.speaking=true;wrap?.classList.add('is-speaking');
    if(['calm','interested'].includes(intensity)){
      let i=0;b.talkTimer=setInterval(()=>{if(!state.open||!b.speaking)return;barryAsset(BARRY.talk[i++%BARRY.talk.length])},230);
    }
    const duration=clamp(String(text||'').length*28,1000,3100);b.speakTimer=setTimeout(()=>{stopBarryTalking();if(performance.now()>=(b.barryUntil||0))resetBarryVisual();flushBarryQueue()},duration);return true;
  }
  function maybeLore(player, chance=.12, opts={}){
    if(!player||state.simRand()>chance)return false;
    const available=player.lore.map((line,i)=>({line,key:player.id+':'+i})).filter(x=>!state.loreUsed.has(x.key));
    if(!available.length)return false;const item=available[Math.floor(state.simRand()*available.length)];state.loreUsed.add(item.key);say(item.line,opts);return true;
  }
  function eventLine(kind,data={},player=null,loreChance=.08){const opts=commentaryOpts(kind);if(!maybeLore(player,loreChance,opts))say(formatLine(kind,data),opts)}

  function showBanner(text,type='',seconds=1.8){
    const el=$('wcgEventBanner');if(!el)return;const raw=String(text||'').trim(),parts=raw.split(/\s*·\s*/).filter(Boolean),headline=parts.shift()||'MATCH EVENT',detail=parts.join(' · ');
    const lower=headline.toLowerCase();let kind='play',kicker='REPO SPORTS · LIVE EVENT';
    if(lower.includes('foul')){kind='foul';kicker='MATCH OFFICIAL · FOUL'}
    else if(lower.includes('tempers')||lower.includes('steps in')){kind='foul';kicker='MATCH OFFICIAL · INCIDENT'}
    else if(lower.includes('free kick')){kind='chance';kicker='MATCH OFFICIAL · FREE KICK'}
    else if(lower.includes('penalty')){kind='penalty';kicker='MATCH OFFICIAL · PENALTY'}
    else if(lower.includes('var')||lower.includes('goal confirmed')||lower.includes('no goal')){kind='var';kicker='VIDEO REVIEW · DECISION'}
    else if(lower.includes('goal')){kind='goal';kicker='WORLD CUP · GOAL'}
    else if(lower.includes('save')){kind='save';kicker='WORLD CUP · BIG SAVE'}
    else if(lower.includes('shot')||lower.includes('ring')||lower.includes('rebound')){kind='chance';kicker='WORLD CUP · ATTACK'}
    else if(lower.includes('interception')){kind='intercept';kicker='WORLD CUP · TURNOVER'}
    el.replaceChildren();const k=document.createElement('small'),h=document.createElement('strong');k.className='wcg-event-kicker';k.textContent=kicker;h.className='wcg-event-title';h.textContent=headline;el.append(k,h);if(detail){const d=document.createElement('span');d.className='wcg-event-detail';d.textContent=detail;el.append(d)}
    el.dataset.kind=kind;el.className='wcg-event-banner is-visible'+(type?` is-${type}`:'');state.eventBannerTimer=seconds;
  }
  function setBroadcastState(name){state.broadcastState=name;const root=$('wcWorldCupBroadcast');if(root)root.dataset.broadcastState=name}
  function showPresentation(key,kicker,title,body='',footer='',mode=''){
    const wrap=$('wcgPresentation');if(!wrap)return;if(state.presentationKey===key)return;state.presentationKey=key;
    $('wcgPresentationKicker').textContent=kicker||'';$('wcgPresentationTitle').textContent=title||'';$('wcgPresentationBody').innerHTML=body||'';$('wcgPresentationFooter').textContent=footer||'';
    $('wcgPresentationPanel').className='wcg-presentation-panel'+(mode?` is-${mode}`:'');wrap.classList.add('is-open');wrap.setAttribute('aria-hidden','false');
  }
  function hidePresentation(){const wrap=$('wcgPresentation');if(wrap){wrap.classList.remove('is-open');wrap.setAttribute('aria-hidden','true')}state.presentationKey=''}

  // ---------- WORLD CUP LIVE STORY / TREND CARDS ----------
  function hideWorldCupStoryCard(){const card=$('wcgStoryCard');if(card){card.classList.remove('is-visible');card.setAttribute('aria-hidden','true')}state.storyGraphicUntil=0}
  function showWorldCupStoryCard(kicker,title,body,team='',player=null,seconds=4.4){
    const card=$('wcgStoryCard');if(!card)return;card.dataset.team=team||'';$('wcgStoryKicker').textContent=kicker||'WORLD CUP LIVE';$('wcgStoryTitle').textContent=title||'';$('wcgStoryBody').textContent=body||'';
    const portrait=$('wcgStoryPlayer');if(player?.standing){portrait.src=player.standing;portrait.alt=player.name;portrait.style.display='block'}else{portrait.removeAttribute('src');portrait.alt='';portrait.style.display='none'}
    card.classList.add('is-visible');card.setAttribute('aria-hidden','false');state.storyGraphicUntil=performance.now()+seconds*1000;
  }
  function updateWorldCupStoryGraphics(dt){
    if(state.storyGraphicUntil&&performance.now()>=state.storyGraphicUntil)hideWorldCupStoryCard();
    if(state.phase!=='first'&&state.phase!=='second')return;if(state.celebration||state.special||state.replay||state.replayIntro||state.replayOutro||$('wcgPresentation')?.classList.contains('is-open'))return;
    state.storyGraphicTimer-=dt;if(state.storyGraphicTimer>0)return;
    const a=state.teamStats.belros,b=state.teamStats.zafran,idx=state.storyGraphicIndex++%5;
    if(idx===0){const p=playerOfPeriod(null),ps=state.playerStats[p.id],team=entityById(p.id)?.team||'';showWorldCupStoryCard('WORLD CUP · MATCH LEADER',p.name,`${ps.goals} goals · ${ps.assists} assists · ${ps.shots} shots`,team,p,4.6)}
    else if(idx===1){const total=Math.max(.001,a.possession+b.possession),pa=Math.round(a.possession/total*100),team=pa>=50?'belros':'zafran';showWorldCupStoryCard('LIVE MATCH TREND','POSSESSION',`${teamMeta.belros.name} ${pa}% · ${teamMeta.zafran.name} ${100-pa}%`,team,null,4.2)}
    else if(idx===2){const p=allPlayers.map(p=>({p,n:state.playerStats[p.id]?.interceptions||0,team:entityById(p.id)?.team||''})).sort((x,y)=>y.n-x.n||x.p.name.localeCompare(y.p.name))[0];showWorldCupStoryCard('WORLD CUP · DEFENSIVE READ',p.p.name,`${p.n} interceptions so far`,p.team,p.p,4.3)}
    else if(idx===3){const team=a.shots>=b.shots?'belros':'zafran',st=state.teamStats[team];showWorldCupStoryCard('ATTACKING PRESSURE',teamMeta[team].name,`${st.shots} shots · ${st.onTarget} on target`,team,null,4.2)}
    else {const team=a.completed>=b.completed?'belros':'zafran',st=state.teamStats[team];showWorldCupStoryCard('PASSING RHYTHM',teamMeta[team].name,`${st.completed}/${st.passes||0} passes completed`,team,null,4.2)}
    state.storyGraphicTimer=48+(state.visualRand?.()||Math.random())*34;
  }

  // ---------- WORLD CUP BIG-MOMENT GRAPHICS ----------
  function spawnWorldCupMomentParticles(kind='hattrick'){
    const host=$('wcgWorldCupMomentParticles');if(!host)return;host.innerHTML='';const count=kind==='penalty'?22:30;
    for(let i=0;i<count;i++){const p=document.createElement('i'),angle=(i/count)*Math.PI*2+(state.visualRand?.()||Math.random())*.28,dist=110+(state.visualRand?.()||Math.random())*210;p.style.setProperty('--rot',`${angle}rad`);p.style.setProperty('--dist',`${dist}px`);p.style.setProperty('--rise',`${-25-(state.visualRand?.()||Math.random())*80}px`);p.style.setProperty('--delay',`${(state.visualRand?.()||Math.random())*.16}s`);p.style.setProperty('--dur',`${1.25+(state.visualRand?.()||Math.random())*.65}s`);host.appendChild(p)}
  }
  function hideWorldCupBigMoment(){const root=$('wcgWorldCupMoment');if(root){root.classList.remove('is-visible','is-animate');root.setAttribute('aria-hidden','true')}state.bigMomentTimer=0}
  function triggerWorldCupBigMoment(kind='hattrick',player=null,team=''){
    const root=$('wcgWorldCupMoment');if(!root)return;const penalty=String(kind).toLowerCase()==='penalty';root.dataset.kind=penalty?'penalty':'hattrick';$('wcgWorldCupMomentKicker').textContent='REPO SPORTS · WORLD CUP 2026';$('wcgWorldCupMomentTitle').textContent=penalty?'PENALTY':'HAT TRICK';$('wcgWorldCupMomentPlayer').textContent=player?.name||teamMeta[team]?.name||'';$('wcgWorldCupMomentTeam').textContent=teamMeta[team]?.name||'';spawnWorldCupMomentParticles(penalty?'penalty':'hattrick');root.classList.remove('is-visible','is-animate');void root.offsetWidth;root.classList.add('is-visible','is-animate');root.setAttribute('aria-hidden','false');state.bigMomentTimer=penalty?1.18:2.35;
    if(penalty)barryReaction('SHOCKED',8,1700);else barryReaction('GOAL_REACTION',10,2200);
  }
  function updateWorldCupBigMoment(dt){if(state.bigMomentTimer>0){state.bigMomentTimer-=dt;if(state.bigMomentTimer<=0)hideWorldCupBigMoment()}}

  // ---------- AUTHORITATIVE WORLD CUP LIVE SYNC ----------
  // CatAsthma is the only browser that advances gameplay/RNG. Everyone else renders
  // snapshots from that one simulation, so actions, score, clock and outcomes cannot diverge.
  function syncPlain(value){try{return JSON.parse(JSON.stringify(value))}catch(_){return null}}
  function syncEntitySnap(e){return {id:e.player?.id||'ref',x:e.x,y:e.y,tx:e.tx,ty:e.ty,vx:e.vx||0,vy:e.vy||0,dir:e.dir||1,bank:e.bank||0,intent:e.intent||'',celebrate:e.celebrate||0,fatigue:e.fatigue||0,form:e.form||0}}
  function syncReplayFrame(frame){if(!frame)return null;return {matchTime:frame.matchTime||0,entities:(frame.entities||[]).map(e=>({...e})),ref:frame.ref?{...frame.ref}:null,ball:frame.ball?{...frame.ball}:null,camera:frame.camera?{...frame.camera}:null}}
  function syncCelebrationSnap(c){
    if(!c)return null;
    return {team:c.team,restartTeam:c.restartTeam,scorerId:c.scorer?.player?.id||'',elapsed:c.elapsed||0,duration:c.duration||0,grounded:!!c.grounded,groundedAt:c.groundedAt||0,landingDuration:c.landingDuration||c.groundedAt||0,centerX:c.centerX||.5,fullTeam:!!c.fullTeam,participantIds:(c.participants||[]).map(e=>e.player?.id).filter(Boolean)};
  }
  function syncSpecialSnap(s){
    if(!s)return null;
    return {
      type:s.type||'',elapsed:s.elapsed||0,team:s.team||'',decisionShown:!!s.decisionShown,
      shooterId:s.shooter?.player?.id||s.shooterId||'',takerId:s.taker?.player?.id||s.takerId||'',
      victimId:s.victim?.player?.id||s.victimId||'',offenderId:s.offender?.player?.id||s.offenderId||'',
      participantIds:[...(s.participantIds||[])],standingAt:Number(s.standingAt)||0,mountAt:Number(s.mountAt)||0,
      centerX:Number(s.centerX)||.5,centerY:Number(s.centerY)||.685,executeAt:Number(s.executeAt)||0,
      ctx:s.ctx?{kind:s.ctx.kind||'',team:s.ctx.team||'',decision:s.ctx.decision||''}:null
    };
  }

  // Estimate the host clock from realtime packets. Using the lowest recent one-way
  // delay sample removes device clock skew while keeping all viewers on the same host timeline.
  function updateSyncClockOffset(hostSentAt){
    const sent=Number(hostSentAt);if(!Number.isFinite(sent)||sent<=0)return;
    const sample=Date.now()-sent,arr=state.syncClockOffsetSamples||(state.syncClockOffsetSamples=[]);arr.push(sample);if(arr.length>32)arr.shift();
    const floor=Math.min(...arr);if(!state.syncClockOffsetReady){state.syncClockOffsetMs=floor;state.syncClockOffsetReady=true}else state.syncClockOffsetMs=lerp(state.syncClockOffsetMs,floor,.18);
  }
  function syncedHostNow(){return Date.now()-(state.syncClockOffsetReady?state.syncClockOffsetMs:0)}
  function syncTimelineElapsed(startedAt){return Math.max(0,(syncedHostNow()-Number(startedAt||syncedHostNow()))/1000)}

  function makeCelebrationTimeline(c){
    if(!c)return null;const captureElapsed=Number(c.elapsed)||0;
    return {id:`goal-${state.fixtureId}-${state.syncEventSeq}-${Math.round(state.matchTime*1000)}`,startedAt:Date.now()-captureElapsed*1000,captureElapsed,
      team:c.team,restartTeam:c.restartTeam,scorerId:c.scorer?.player?.id||'',duration:c.duration||0,landingDuration:c.landingDuration||c.groundedAt||0,groundedAt:c.groundedAt||0,fullTeam:!!c.fullTeam,
      participantIds:(c.participants||[]).map(e=>e.player?.id).filter(Boolean),starts:syncPlain(c.starts)||{},targets:syncPlain(c.targets)||{},otherStarts:syncPlain(c.otherStarts)||{},otherTargets:syncPlain(c.otherTargets)||{},centerX:c.centerX||.5,order:[...(c.order||[])],
      particles:(c.particles||[]).map(p=>({...p})),fireworks:(c.fireworks||[]).map(f=>({...f}))};
  }
  function makeReplayTimeline(label,frames,introDuration,duration,outroDuration=.82){
    return {id:`replay-${state.fixtureId}-${++state.syncPresentationSeq}`,startedAt:Date.now(),label:label||'WORLD CUP REPLAY',introDuration:Number(introDuration)||0,duration:Number(duration)||0,outroDuration:Number(outroDuration)||.82,frames:(frames||[]).map(syncReplayFrame)};
  }
  async function sendPresentation(kind,payload){
    if(!isHost()||!state.channel)return false;return sendMatch('sync-presentation',{fixtureId:state.fixtureId,seq:++state.syncPresentationSeq,sentAt:Date.now(),kind,payload:syncPlain(payload)});
  }
  function broadcastCelebrationTimeline(c){if(!isHost()||!c)return;const tl=makeCelebrationTimeline(c);state.syncCelebrationTimeline=tl;void sendPresentation('celebration',tl)}
  function broadcastReplayTimeline(tl){if(!isHost()||!tl)return;state.syncReplayTimeline=tl;state.syncCelebrationTimeline=null;void sendPresentation('replay',tl)}
  function sendPresentationCatchup(){
    if(!isHost()||!state.channel)return;
    if(state.celebration){const tl=makeCelebrationTimeline(state.celebration);state.syncCelebrationTimeline=tl;void sendPresentation('celebration',tl);return}
    if((state.replay||state.replayIntro||state.replayOutro)&&state.syncReplayTimeline){void sendPresentation('replay',state.syncReplayTimeline);return}
    void sendPresentation('clear',{});
  }

  function installRemoteCelebrationTimeline(tl){
    if(!tl)return;state.remoteReplayTimeline=null;state.remoteReplayFrameSmooth=null;state.remoteReplayFrame=null;state.remoteReplayStatus='';state.remoteReplayLabel='';applyRemoteReplayUi();
    const c={...tl,scorer:entityById(tl.scorerId),participants:(tl.participantIds||[]).map(entityById).filter(Boolean),particles:[],fireworks:[],elapsed:0,grounded:false};
    state.remoteCelebrationTimeline=tl;state.celebration=c;$('wcWorldCupBroadcast')?.classList.add('is-goal-celebration');setBroadcastState('GOAL_CELEBRATION');
  }
  function clearRemoteCelebrationTimeline(){state.remoteCelebrationTimeline=null;if(!isHost())state.celebration=null;$('wcWorldCupBroadcast')?.classList.remove('is-goal-celebration')}

  function installRemoteReplayTimeline(tl){
    if(!tl?.frames?.length)return;clearRemoteCelebrationTimeline();state.remoteReplayTimeline=tl;state.remoteReplayLabel=tl.label||'WORLD CUP REPLAY';state.remoteReplayFrame=null;state.remoteReplayFrameSmooth=null;updateRemoteReplayTimeline();
  }
  function clearRemoteReplayTimeline(){state.remoteReplayTimeline=null;state.remoteReplayFrameSmooth=null;state.remoteReplayFrame=null;state.remoteReplayStatus='';state.remoteReplayLabel='';applyRemoteReplayUi()}

  function handleRemotePresentation(message){
    if(isHost()||!message||message.fixtureId!==state.fixtureId)return;const seq=Number(message.seq)||0;if(seq&&seq<=state.syncLastPresentationSeq)return;state.syncLastPresentationSeq=seq;updateSyncClockOffset(message.sentAt);
    if(message.kind==='celebration')installRemoteCelebrationTimeline(message.payload||{});
    else if(message.kind==='replay')installRemoteReplayTimeline(message.payload||{});
    else if(message.kind==='clear'){clearRemoteCelebrationTimeline();clearRemoteReplayTimeline()}
  }

  function updateRemoteCelebrationTimeline(){
    const tl=state.remoteCelebrationTimeline,c=state.celebration;if(!tl||!c)return false;const elapsed=syncTimelineElapsed(tl.startedAt);c.elapsed=elapsed;c.grounded=elapsed>=Number(tl.groundedAt||0);
    if(elapsed>Number(tl.duration||0)+.22){clearRemoteCelebrationTimeline();return false}
    const landingU=clamp(elapsed/Math.max(.01,Number(tl.landingDuration||tl.groundedAt||1)),0,1);
    for(const e of state.entities){
      const px=e.x,py=e.y;
      if(e.team===tl.team){
        if(!c.grounded){const pos=smoothWorldCupLandingPosition(c,e,landingU);e.x=pos.x;e.y=pos.y;e.intent='celebration-landing';e.bank=0}
        else{const g=Math.max(0,elapsed-Number(tl.groundedAt||0)),pos=worldCupGroundCelebrationPosition(c,e,g);e.x=pos.x;e.y=pos.y;e.celebrationJump=pos.jump;e.intent=c.participants.includes(e)?'celebrate-ground':'celebrate-support';e.facing=c.scorer?.x>=e.x?1:-1;e.dir=-e.facing;e.bank=0}
      }else{
        const a=tl.otherStarts?.[e.player.id],b=tl.otherTargets?.[e.player.id];if(a&&b){const delay=.20,duration=Math.max(2.75,Number(tl.duration||0)-delay-.20),raw=clamp((elapsed-delay)/duration,0,1),q=raw*raw*(3-2*raw);e.x=lerp(a.x,b.x,q);e.y=lerp(a.y,b.y,q);e.intent=raw<1?'restart-retreat':'restart-ready'}
      }
      e.vx=(e.x-px)/.016;e.vy=(e.y-py)/.016;
    }
    const delta=Math.max(0,elapsed-Number(tl.captureElapsed||0));
    c.fireworks=(tl.fireworks||[]).map(f=>({...f,age:Number(f.age||0)+delta})).filter(f=>f.age<Number(f.life||1));
    c.particles=(tl.particles||[]).map(p=>{const t=delta,age=Number(p.age||0)+t,vy0=Number(p.vy)||0,g=Number(p.g)||0,phase=Number(p.phase)||0;return {...p,age,x:Number(p.x)+Number(p.vx||0)*t-(.004/7)*(Math.cos(age*7+phase)-Math.cos(Number(p.age||0)*7+phase)),y:Number(p.y)+vy0*t+.5*g*t*t,vy:vy0+g*t}}).filter(p=>p.age<Number(p.life||1)&&p.y<.9);
    return true;
  }

  function updateRemoteReplayTimeline(){
    const tl=state.remoteReplayTimeline;if(!tl)return false;const elapsed=syncTimelineElapsed(tl.startedAt),intro=Number(tl.introDuration)||0,dur=Number(tl.duration)||0,outro=Number(tl.outroDuration)||.82,total=intro+dur+outro;
    if(elapsed<intro){state.remoteReplayStatus='intro';state.remoteReplayLabel=tl.label||'WORLD CUP REPLAY';state.remoteReplayFrameSmooth=null}
    else if(elapsed<intro+dur){state.remoteReplayStatus='playback';state.remoteReplayLabel=tl.label||'GOAL REPLAY';const u=clamp((elapsed-intro)/Math.max(.001,dur),0,1),p=u*(tl.frames.length-1),i=Math.floor(p),q=p-i;state.remoteReplayFrameSmooth=interpolateWorldCupReplayFrame(tl.frames[i],tl.frames[Math.min(tl.frames.length-1,i+1)],q)}
    else if(elapsed<total){state.remoteReplayStatus='outro';state.remoteReplayLabel='RETURN TO LIVE';state.remoteReplayFrameSmooth=null}
    else{clearRemoteReplayTimeline();return false}
    applyRemoteReplayUi();return true;
  }

  function updateRemotePresentationTimeline(){if(state.remoteReplayTimeline)updateRemoteReplayTimeline();else if(state.remoteCelebrationTimeline)updateRemoteCelebrationTimeline()}
  function authoritativeClockRunning(){return (state.phase==='first'||state.phase==='second')&&!state.celebration&&!state.replay&&!state.replayIntro&&!state.replayOutro&&!state.special&&state.delay?.reason!=='foul-stoppage'}
  function makeAuthoritativeSnapshot(){
    const replayStatus=state.replayIntro?'intro':state.replay?'playback':state.replayOutro?'outro':'';
    const replayLabel=state.replay?.label||state.replayIntro?.payload?.label||(state.replayOutro?'RETURN TO LIVE':'');
    return {v:1,fixtureId:state.fixtureId,seq:++state.syncSeq,sentAt:Date.now(),phase:state.phase,broadcastState:state.broadcastState,matchTime:state.matchTime,introElapsed:state.introElapsed,half:state.half,speed:state.speed,firstKickoff:state.firstKickoff,score:{...state.score},possession:state.possession,carrierId:state.carrier?.player?.id||'',lastPasserId:state.lastPasser?.player?.id||'',zone:state.zone,passesSinceShot:state.passesSinceShot,actionTimer:state.actionTimer,ball:{x:state.ball.x,y:state.ball.y,visible:state.ball.visible!==false,flight:state.ball.flight?{kind:state.ball.flight.meta?.kind||'',tx:state.ball.flight.tx,ty:state.ball.flight.ty,duration:state.ball.flight.duration,elapsed:state.ball.flight.elapsed}:null},entities:state.entities.map(syncEntitySnap),ref:state.ref?syncEntitySnap({...state.ref,player:{id:'ref'}}):null,teamStats:syncPlain(state.teamStats),playerStats:syncPlain(state.playerStats),director:syncPlain(state.director),matchFlow:state.matchFlow?{currentPhase:state.matchFlow.currentPhase||'',possessionElapsed:state.matchFlow.possessionElapsed||0,actionIndex:state.matchFlow.actionIndex||0,lastAction:state.matchFlow.lastAction||''}:null,camera:{...state.camera},celebration:syncCelebrationSnap(state.celebration),special:syncSpecialSnap(state.special),halftimeElapsed:state.halftimeElapsed,halftimeReady:!!state.halftimeReady,halftimeGateReady:!!state.halftimeGateReady,secondCountdown:state.secondCountdown,fulltimeElapsed:state.fulltimeElapsed,fulltimeData:state.fulltimeData?{fromShootout:!!state.fulltimeData.fromShootout,winner:state.fulltimeData.winner,so:syncPlain(state.fulltimeData.so),mvpId:state.fulltimeData.mvp?.id||''}:null,replayStatus,replayLabel,replayFrame:syncReplayFrame(currentWorldCupReplayFrame()),clockRunning:authoritativeClockRunning(),realResultArmed:!!state.realResultArmed};
  }
  async function sendAuthoritativeSnapshot(force=false){
    if(!isHost()||!state.channel||!state.subscribed||state.syncSendBusy)return false;
    const now=performance.now();if(!force&&now-(state.syncLastSentAt||0)<65)return false;state.syncLastSentAt=now;state.syncSendBusy=true;
    try{return await sendMatch('sync-state',makeAuthoritativeSnapshot())}finally{state.syncSendBusy=false}
  }
  function remoteEntityTarget(id){return state.syncRemoteTargets?.entities?.[id]||null}
  function applyAuthoritativeSnapshot(snap){
    if(!snap||snap.fixtureId!==state.fixtureId||isHost())return;const seq=Number(snap.seq)||0;if(seq&&seq<=(state.syncRemote?.seq||0))return;
    const oldPhase=state.phase,oldFlight=state.syncLastFlightKind||'';updateSyncClockOffset(snap.sentAt);state.syncRemote=snap;state.syncHasAuthority=true;state.syncLastReceivedAt=Date.now();state.syncClockBase=Number(snap.matchTime)||0;state.syncClockSentAt=Number(snap.sentAt)||syncedHostNow();state.syncClockRunning=!!snap.clockRunning;
    state.phase=snap.phase||state.phase;state.broadcastState=snap.broadcastState||state.broadcastState;state.matchTime=Number(snap.matchTime)||0;state.introElapsed=Number(snap.introElapsed)||0;state.half=Number(snap.half)||1;state.speed=Number(snap.speed)||1;state.firstKickoff=snap.firstKickoff||state.firstKickoff;state.score={belros:Number(snap.score?.belros)||0,zafran:Number(snap.score?.zafran)||0};state.possession=snap.possession||state.possession;state.zone=Number(snap.zone)||0;state.passesSinceShot=Number(snap.passesSinceShot)||0;state.actionTimer=Number(snap.actionTimer)||0;
    if(snap.teamStats)state.teamStats=snap.teamStats;if(snap.playerStats)state.playerStats=snap.playerStats;if(snap.director)state.director=snap.director;if(snap.matchFlow)state.matchFlow={...(state.matchFlow||{}),...snap.matchFlow};
    const targets={entities:{},ref:null,ball:null,camera:snap.camera||null};for(const es of snap.entities||[])targets.entities[es.id]=es;targets.ref=snap.ref||null;targets.ball=snap.ball||null;state.syncRemoteTargets=targets;
    state.carrier=(snap.carrierId&&entityById(snap.carrierId))||null;state.lastPasser=(snap.lastPasserId&&entityById(snap.lastPasserId))||null;
    state.ball.visible=snap.ball?.visible!==false;state.ball.flight=snap.ball?.flight?{meta:{kind:snap.ball.flight.kind||''},tx:snap.ball.flight.tx,ty:snap.ball.flight.ty,duration:snap.ball.flight.duration,elapsed:snap.ball.flight.elapsed}:null;
    const flightKind=snap.ball?.flight?.kind||'';if(flightKind&&flightKind!==oldFlight){audio.ensure();audio.shot()}state.syncLastFlightKind=flightKind;
    if(!state.remoteCelebrationTimeline)state.celebration=snap.celebration?{team:snap.celebration.team,restartTeam:snap.celebration.restartTeam,scorer:entityById(snap.celebration.scorerId),elapsed:snap.celebration.elapsed,duration:snap.celebration.duration,landingDuration:snap.celebration.landingDuration||snap.celebration.groundedAt,grounded:snap.celebration.grounded,groundedAt:snap.celebration.groundedAt,centerX:snap.celebration.centerX,fullTeam:!!snap.celebration.fullTeam,participants:(snap.celebration.participantIds||[]).map(entityById).filter(Boolean),particles:[],fireworks:[]}:null;
    state.special=snap.special?{...snap.special,ctx:snap.special.ctx||null}:null;state.halftimeElapsed=Number(snap.halftimeElapsed)||0;state.halftimeReady=!!snap.halftimeReady;state.halftimeGateReady=!!snap.halftimeGateReady;state.realResultArmed=!!snap.realResultArmed;state.secondCountdown=Number(snap.secondCountdown)||0;state.fulltimeElapsed=Number(snap.fulltimeElapsed)||0;state.fulltimeData=snap.fulltimeData?{fromShootout:!!snap.fulltimeData.fromShootout,winner:snap.fulltimeData.winner,so:snap.fulltimeData.so,mvp:byId[snap.fulltimeData.mvpId]||allPlayers[0]}:null;
    if(!state.remoteReplayTimeline){state.remoteReplayStatus=snap.replayStatus||'';state.remoteReplayLabel=snap.replayLabel||'';state.remoteReplayFrame=snap.replayFrame||null;applyRemoteReplayUi()}
    if(oldPhase!==state.phase)handleRemotePhaseTransition(oldPhase,state.phase);
  }
  function applyRemoteReplayUi(){
    if(isHost())return;const status=state.remoteReplayStatus,root=$('wcWorldCupBroadcast'),sponsor=$('wcgReplaySponsor'),bug=$('wcgReplayBug');root?.classList.toggle('is-replay-transition',status==='intro'||status==='outro');root?.classList.toggle('is-replay-playback',status==='playback');
    if(status==='intro'||status==='outro'){if(sponsor){const span=sponsor.querySelector('span');if(span)span.textContent=status==='outro'?'RETURN TO LIVE':(state.remoteReplayLabel||'WORLD CUP REPLAY');sponsor.classList.add('is-visible');sponsor.setAttribute('aria-hidden','false')}bug?.classList.remove('is-visible')}
    else if(status==='playback'){sponsor?.classList.remove('is-visible');if(bug){const span=bug.querySelector('span');if(span)span.textContent=`${state.remoteReplayLabel||'GOAL REPLAY'} · SLOW MOTION`;bug.classList.add('is-visible');bug.setAttribute('aria-hidden','false')}}
    else{sponsor?.classList.remove('is-visible');bug?.classList.remove('is-visible');root?.classList.remove('is-replay-transition','is-replay-playback')}
  }
  function handleRemotePhaseTransition(from,to){
    if(isHost())return;if(to==='first'||to==='second'){hidePresentation();$('wcgHalftime')?.classList.remove('is-open');setBroadcastState('LIVE');audio.ensure();audio.start();audio.startWorldCupMatchMusic();}
    else if(to==='halftimehold'){audio.pauseWorldCupMatchMusic();setBroadcastState('HALFTIME_HOLD');showHalftimeGate();}
    else if(to==='halftime'){audio.pauseWorldCupMatchMusic();setBroadcastState('HALFTIME')}
    else if(to==='fulltime'){audio.pauseWorldCupMatchMusic();setBroadcastState('FULL_TIME')}
  }
  function updateRemoteInterpolation(dt){
    const snap=state.syncRemote,t=state.syncRemoteTargets;if(!snap||!t)return;const age=clamp((syncedHostNow()-(Number(snap.sentAt)||syncedHostNow()))/1000,0,.18),k=1-Math.exp(-dt*26);
    for(const e of state.entities){const q=t.entities[e.player.id];if(!q)continue;const x=safeX(q.x+(q.vx||0)*age),y=clamp(q.y+(q.vy||0)*age,FLIGHT.hardY0,activeHardY1());e.x=lerp(e.x,x,k);e.y=lerp(e.y,y,k);e.tx=q.tx;e.ty=q.ty;e.vx=q.vx||0;e.vy=q.vy||0;e.dir=q.dir||1;e.bank=q.bank||0;e.intent=q.intent||'';e.celebrate=q.celebrate||0;e.fatigue=q.fatigue||0;e.form=q.form||0}
    if(state.ref&&t.ref){const q=t.ref;state.ref.x=lerp(state.ref.x,safeX(q.x+(q.vx||0)*age),k);state.ref.y=lerp(state.ref.y,clamp(q.y+(q.vy||0)*age,FLIGHT.hardY0,activeHardY1()),k);state.ref.tx=q.tx;state.ref.ty=q.ty;state.ref.vx=q.vx||0;state.ref.vy=q.vy||0;state.ref.dir=q.dir||1}
    if(t.ball){const bk=1-Math.exp(-dt*31);state.ball.x=lerp(state.ball.x,Number(t.ball.x)||0,bk);state.ball.y=lerp(state.ball.y,Number(t.ball.y)||0,bk);state.ball.visible=t.ball.visible!==false}
    if(t.camera){const ck=1-Math.exp(-dt*22);for(const p of ['x','y','zoom','tx','ty','tz'])if(Number.isFinite(Number(t.camera[p])))state.camera[p]=lerp(Number(state.camera[p])||Number(t.camera[p]),Number(t.camera[p]),ck);state.camera.mode=t.camera.mode||state.camera.mode;state.camera.shake=Number(t.camera.shake)||0}
    if(state.syncClockRunning){const elapsed=clamp((syncedHostNow()-(state.syncClockSentAt||syncedHostNow()))/1000,0,.28);state.matchTime=state.syncClockBase+elapsed*(state.speed||1)}else state.matchTime=state.syncClockBase;
    if(state.phase==='halftimehold'){showHalftimeGate()}
    else if(state.phase==='halftime'){state.halftimeElapsed=Number(snap.halftimeElapsed)||0;updateHalftimePresentation(0)}
    else if(state.phase==='secondcountdown'&&state.secondCountdown>0)updateSecondHalfCountdown(0);
    else if(state.phase==='fulltime'&&state.fulltimeData)updateFulltimePresentation(0);
    else if(state.phase==='intro')updatePrematchPresentation();
  }
  function remoteEventText(ev){const d=ev.data||{};if(ev.type==='goal')return `GOAL · ${d.player||''}`;if(ev.type==='save')return `SAVE · ${d.player||''}`;if(ev.type==='intercept')return `INTERCEPTION · ${d.player||''}`;if(ev.type==='post')return 'OFF THE RING!';if(ev.type==='foul')return `FOUL · ${d.player||''}`;if(ev.type==='brawl')return `TEMPERS FLARE · ${d.victim||''} & ${d.offender||''}`;if(ev.type==='var')return 'VAR CHECK';if(ev.type==='rebound')return `REBOUND · ${d.player||''}`;return ''}
  function handleRemoteMatchEvent(payload){
    if(isHost()||!payload||payload.fixtureId!==state.fixtureId)return;const seq=Number(payload.seq)||0;if(seq&&seq<=state.syncLastEventSeq)return;state.syncLastEventSeq=seq;const ev=payload.event||{},text=remoteEventText(ev);audio.ensure();
    if(ev.type==='goal'){audio.play(audio.goal,.70);audio.crowdHit(.52);audio.goalCelebration();state.camera.shake=.012;if(text)showBanner(`${text} · ${state.score.belros}-${state.score.zafran}`,'',2.4)}
    else if(ev.type==='save'){audio.crowdHit(.13);if(text)showBanner(text,'',1.6)}
    else if(ev.type==='intercept'){audio.intercept();audio.crowdHit(.10);if(text)showBanner(text,'',1.4)}
    else if(ev.type==='post'){audio.rebound();audio.crowdHit(.18);showBanner(text,'danger',1.5)}
    else if(ev.type==='foul'){audio.play(audio.whistle,.62);audio.crowdHit(.15);if(text)showBanner(text,'danger',1.8)}
    else if(ev.type==='brawl'){audio.crowdHit(.24);if(text)showBanner(text,'danger',2.25)}
    else if(ev.type==='var'){audio.varTone();showBanner(text,'var',1.8)}
    else if(ev.type==='rebound'){audio.crowdHit(.08)}
  }
  function broadcastAuthoritativeEvent(ev){if(!isHost()||!state.channel)return;void sendMatch('sync-event',{fixtureId:state.fixtureId,seq:++state.syncEventSeq,sentAt:Date.now(),event:syncPlain(ev)})}

  // ---------- WORLD CUP REPLAY BUFFER / SLOW-MOTION REPLAY ----------
  function worldCupReplaySnapshot(){
    const hold=state.carrier?ballHoldPoint(state.carrier):null;return {matchTime:state.matchTime,entities:state.entities.map(e=>({id:e.player.id,x:e.x,y:e.y,dir:e.dir||1,bank:e.bank||0})),ref:{x:state.ref.x,y:state.ref.y,dir:state.ref.dir||1},ball:{x:hold?.x??state.ball.x,y:hold?.y??state.ball.y,visible:state.ball.visible!==false,flight:!!state.ball.flight},camera:{x:state.camera.x,y:state.camera.y,zoom:state.camera.zoom}};
  }
  function captureWorldCupReplayFrame(dt){
    if(state.phase!=='first'&&state.phase!=='second')return;if(state.replay||state.replayIntro||state.replayOutro||state.celebration||state.special)return;state.replayCaptureAccum+=dt;if(state.replayCaptureAccum<REPLAY_FRAME_STEP)return;state.replayCaptureAccum=0;state.replayBuffer.push(worldCupReplaySnapshot());if(state.replayBuffer.length>REPLAY_MAX_FRAMES)state.replayBuffer.splice(0,state.replayBuffer.length-REPLAY_MAX_FRAMES);
  }
  function interpolateWorldCupReplayFrame(a,b,t){
    if(!a)return b;if(!b)return a;const bBy=new Map((b.entities||[]).map(e=>[e.id,e]));return {matchTime:lerp(a.matchTime||0,b.matchTime||0,t),entities:(a.entities||[]).map(e=>{const n=bBy.get(e.id)||e;return {...e,x:lerp(e.x,n.x,t),y:lerp(e.y,n.y,t),bank:lerp(e.bank||0,n.bank||0,t),dir:t<.5?e.dir:n.dir}}),ref:{x:lerp(a.ref.x,b.ref.x,t),y:lerp(a.ref.y,b.ref.y,t),dir:t<.5?a.ref.dir:b.ref.dir},ball:{x:lerp(a.ball.x,b.ball.x,t),y:lerp(a.ball.y,b.ball.y,t),visible:t<.5?a.ball.visible:b.ball.visible,flight:a.ball.flight||b.ball.flight},camera:{x:lerp(a.camera.x,b.camera.x,t),y:lerp(a.camera.y,b.camera.y,t),zoom:lerp(a.camera.zoom,b.camera.zoom,t)}};
  }
  function currentWorldCupReplayFrame(){
    const r=state.replay;if(!r?.frames?.length)return null;const p=clamp(r.elapsed/Math.max(.001,r.duration),0,1)*(r.frames.length-1),i=Math.floor(p),q=p-i;return interpolateWorldCupReplayFrame(r.frames[i],r.frames[Math.min(r.frames.length-1,i+1)],q);
  }
  function startWorldCupReplayNow(payload){
    state.replayIntro=null;state.replay={...payload,elapsed:0};const root=$('wcWorldCupBroadcast'),sponsor=$('wcgReplaySponsor'),bug=$('wcgReplayBug');root?.classList.remove('is-replay-transition');root?.classList.add('is-replay-playback');sponsor?.classList.remove('is-visible');sponsor?.setAttribute('aria-hidden','true');if(bug){const b=bug.querySelector('b'),span=bug.querySelector('span');if(b)b.textContent='REPLAY';if(span)span.textContent=`${payload.label||'WORLD CUP REPLAY'} · SLOW MOTION`;bug.classList.add('is-visible');bug.setAttribute('aria-hidden','false')}setBroadcastState('REPLAY');void sendAuthoritativeSnapshot(true);
  }
  function beginWorldCupReplay(label='WORLD CUP REPLAY',frames=null,opts={}){
    if(state.replay||state.replayIntro||state.replayOutro)return false;frames=(frames||state.replayBuffer).slice(-(opts.frames||52));if(frames.length<10)return false;hideWorldCupStoryCard();const duration=opts.duration||clamp((frames.length*REPLAY_FRAME_STEP)/(opts.slow||.62),2.45,3.55),payload={frames,elapsed:0,duration,label,onDone:opts.onDone||null};state.lastReplayAt=state.matchTime;const introDuration=opts.introDuration==null?.80:opts.introDuration;
    const root=$('wcWorldCupBroadcast');root?.classList.remove('is-replay-playback');root?.classList.add('is-replay-transition');
    const syncTimeline=makeReplayTimeline(label,frames,introDuration,duration,.82);broadcastReplayTimeline(syncTimeline);
    if(introDuration>0){state.replayIntro={elapsed:0,duration:introDuration,payload};const sponsor=$('wcgReplaySponsor');if(sponsor){const span=sponsor.querySelector('span');if(span)span.textContent=label;sponsor.classList.add('is-visible');sponsor.setAttribute('aria-hidden','false')}setBroadcastState('REPLAY');void sendAuthoritativeSnapshot(true);return true}startWorldCupReplayNow(payload);void sendAuthoritativeSnapshot(true);return true;
  }
  function updateWorldCupReplayIntro(dt){const s=state.replayIntro;if(!s)return;s.elapsed+=dt;if(s.elapsed>=s.duration)startWorldCupReplayNow(s.payload)}
  function finishWorldCupReplay(){
    const r=state.replay;if(!r)return;state.replay=null;const root=$('wcWorldCupBroadcast'),bug=$('wcgReplayBug');root?.classList.remove('is-replay-playback');root?.classList.add('is-replay-transition');if(bug){bug.classList.remove('is-visible');bug.setAttribute('aria-hidden','true')}state.replayOutro={elapsed:0,duration:.82,onDone:r.onDone||null};const sponsor=$('wcgReplaySponsor');if(sponsor){const span=sponsor.querySelector('span');if(span)span.textContent='RETURN TO LIVE';sponsor.classList.remove('is-visible');void sponsor.offsetWidth;sponsor.classList.add('is-visible');sponsor.setAttribute('aria-hidden','false')}void sendAuthoritativeSnapshot(true);
  }
  function updateWorldCupReplay(dt){const r=state.replay;if(!r)return;r.elapsed+=dt;if(r.elapsed>=r.duration)finishWorldCupReplay()}
  function updateWorldCupReplayOutro(dt){
    const s=state.replayOutro;if(!s)return;s.elapsed+=dt;if(s.elapsed<s.duration)return;state.replayOutro=null;state.syncReplayTimeline=null;const root=$('wcWorldCupBroadcast'),sponsor=$('wcgReplaySponsor');root?.classList.remove('is-replay-transition','is-replay-playback');if(sponsor){sponsor.classList.remove('is-visible');sponsor.setAttribute('aria-hidden','true')}const done=s.onDone;done?.();if(!state.special&&!state.replay&&!state.replayIntro&&!state.replayOutro&&(state.phase==='first'||state.phase==='second'))setBroadcastState('LIVE');
  }
  function drawWorldCupReplayScene(ctx,frame){
    for(const snap of frame.entities||[]){const p=byId[snap.id],e=p?{player:p,team:entityById(p.id)?.team||'',x:snap.x,y:snap.y,dir:snap.dir,bank:snap.bank,celebrate:0}:null;if(e)drawSprite(ctx,state.assets[p.id+'Riding'],e,playerSpriteHeight(e,false),false)}
    const rr={x:frame.ref.x,y:frame.ref.y,dir:frame.ref.dir,bank:0,player:{name:WORLD_CUP_REFEREE_NAME}};drawSprite(ctx,state.assets.refFlying,rr,REF_FLY_HEIGHT,false);if(frame.ball.visible)drawBall(ctx,frame.ball.x,frame.ball.y,frame.ball.flight);
  }

  // ---------- WORLD CUP GOAL CELEBRATION DIRECTOR ----------
  // Mechanics mirror Club Mode: scoring players gather in flight, descend to the
  // stadium floor, switch to their standing sprites, celebrate together, then replay.
  function celebrationPalette(team){
    const base=teamMeta[team]?.colour||'#d2aa36';
    return [base,'#ffe06d','#fff4c9','#73d9ff','#f06242'];
  }
  function worldCupCelebrationGroundY(offset=0){return clamp(.685+offset,.64,.78)}
  function worldCupCelebrationAirY(offset=0){return clamp(.505+offset,FLIGHT.softY0+.075,activeSoftY1()-.14)}
  function makeWorldCupCelebrationParticle(c){
    const vr=()=>state.visualRand?.()||Math.random(),palette=celebrationPalette(c.team),fromLeft=vr()<.5;
    return {x:fromLeft?.045:.955,y:.26+vr()*.20,vx:(c.centerX+(vr()-.5)*.28-(fromLeft?.045:.955))/(1.6+vr()*.8),vy:-.055-vr()*.055,g:.13+vr()*.04,age:0,life:3.2+vr()*1.5,size:1.4+vr()*2.3,colour:palette[Math.floor(vr()*palette.length)],phase:vr()*Math.PI*2};
  }
  function makeWorldCupFirework(c,delay=0){
    const vr=()=>state.visualRand?.()||Math.random(),palette=celebrationPalette(c.team);
    return {x:.16+vr()*.68,y:.18+vr()*.24,age:-Math.max(0,delay),life:1.35+vr()*.45,seed:vr()*Math.PI*2,colourOffset:Math.floor(vr()*palette.length),rings:vr()<.28?2:1};
  }
  function worldCupGroundCelebrationPosition(c,e,g){
    const idx=Math.max(0,c.order.indexOf(e.player.id)),primary=c.participants.includes(e),phase=(e.flowPhase||0)+idx*1.35;
    const target=c.targets[e.player.id]||{x:c.centerX,y:worldCupCelebrationGroundY(0)};
    const sway=Math.sin(g*2.15+phase)*(primary?.012:.006);
    const jumpGate=(g<.95)||(g>1.35&&g<2.25)||(g>2.65);
    const jump=jumpGate?Math.pow(Math.max(0,Math.sin((g+phase*.12)*(e===c.scorer?5.9:5.0))),1.8)*(primary?(e===c.scorer?.018:.013):.007):0;
    return {x:safeX(target.x+sway),y:worldCupCelebrationGroundY((target.groundOffset||0)-jump),jump};
  }
  function smoothWorldCupLandingPosition(c,e,u){
    const s=c.starts[e.player.id]||{x:e.x,y:e.y},t=c.targets[e.player.id]||s;
    // One continuous cubic flight from the scoring position to the ice. No gather-stop,
    // no second discrete descent phase and no target snap at touchdown.
    const q=u*u*(3-2*u),dir=teamMeta[c.team].attack,primary=c.participants.includes(e);
    const bend=(primary?.050:.032)*(e===c.scorer?1.18:1);
    const cx=lerp(s.x,t.x,.48)+dir*bend*Math.sin(Math.PI*q);
    const cy=lerp(s.y,t.y,.40)-(.035+(primary?.016:.006))*Math.sin(Math.PI*q);
    const omt=1-q;
    return {
      x:safeX(omt*omt*s.x+2*omt*q*cx+q*q*t.x),
      y:clamp(omt*omt*s.y+2*omt*q*cy+q*q*t.y,FLIGHT.softY0+.035,.80)
    };
  }
  function beginWorldCupGoalCelebration(team,scorer,restartTeam,opts={}){
    const vr=()=>state.visualRand?.()||Math.random(),players=teamEntities(team),others=players.filter(e=>e!==scorer).sort((a,b)=>dist2(a,scorer)-dist2(b,scorer));
    const partner=others[0]||null,fullTeam=vr()<.13,participants=fullTeam?[scorer,...others]:[scorer,partner].filter(Boolean);
    const landingDuration=1.65+vr()*.22,groundedAt=landingDuration;
    const duration=clamp(groundedAt+(fullTeam?2.55:2.28)+vr()*.42,4.05,5.35),centerX=team==='belros'?.67:.33;
    const starts={},airTargets={},targets={},otherStarts={},otherTargets={};
    const order=players.slice().sort((a,b)=>a.y-b.y).map(e=>e.player.id);
    players.forEach((e,i)=>{
      starts[e.player.id]={x:e.x,y:e.y};
      const isPrimary=participants.includes(e),slot=Math.max(0,participants.indexOf(e));
      let offset;
      if(isPrimary)offset=participants.length===2?(slot===0?-.038:.038):(slot-(participants.length-1)/2)*.055;
      else offset=(e.x<centerX?-1:1)*(.110+i*.016);
      const groundOffset=Math.abs(offset)*.010;
      // airTargets kept for compatibility/debugging, but landing is now a single continuous curve.
      airTargets[e.player.id]={x:safeX(centerX+offset*.92),y:worldCupCelebrationAirY((i-1)*.022)};
      targets[e.player.id]={x:safeX(centerX+offset),y:worldCupCelebrationGroundY(groundOffset),groundOffset};
      e.celebrate=duration;e.intent='celebration-landing';
    });
    teamEntities(restartTeam).forEach((e,i)=>{
      otherStarts[e.player.id]={x:e.x,y:e.y};
      otherTargets[e.player.id]={x:restartTeam==='belros'?.43:.57,y:.40+i*.12};
      e.intent='restart-retreat';
    });
    state.ball.flight=null;state.ball.visible=false;state.carrier=null;state.pendingPass=null;state.delay=null;
    const replayFrames=(opts.replayFrames||state.replayBuffer.slice(-58)).slice();
    state.celebration={team,scorer,restartTeam,elapsed:0,duration,aerialDuration:landingDuration,descentDuration:0,landingDuration,groundedAt,grounded:false,fullTeam,participants,starts,airTargets,targets,otherStarts,otherTargets,centerX,order,replayFrames,varContext:opts.varContext||null,hatTrickPending:!!opts.hatTrickPending,onDone:opts.onDone||null,particles:[],nextParticleAt:.08,goalGraphicShown:false,fireworks:[]};
    for(let i=0;i<(fullTeam?13:9);i++)state.celebration.particles.push(makeWorldCupCelebrationParticle(state.celebration));
    const fwCount=fullTeam?7:5;for(let i=0;i<fwCount;i++)state.celebration.fireworks.push(makeWorldCupFirework(state.celebration,.10+i*.30+vr()*.10));
    // Schedule the touchdown volley from frame zero so every synchronized viewer sees
    // the exact same fireworks at the same host-relative moment.
    for(let i=0;i<4;i++)state.celebration.fireworks.push(makeWorldCupFirework(state.celebration,groundedAt+i*.18+vr()*.08));
    setBroadcastState('GOAL_CELEBRATION');$('wcWorldCupBroadcast')?.classList.add('is-goal-celebration');
    state.camera.shake=Math.max(state.camera.shake,.010);audio.goalCelebration();barryReaction('GOAL_REACTION',10,2300);broadcastCelebrationTimeline(state.celebration);void sendAuthoritativeSnapshot(true);
  }

  function finishWorldCupGoalCelebration(){
    const c=state.celebration;if(!c)return;
    teamEntities(c.restartTeam).forEach(e=>{const t=c.otherTargets[e.player.id];if(t){e.x=t.x;e.y=t.y;e.tx=t.x;e.ty=t.y;e.vx=e.vy=0;e.intent='restart-ready'}});
    state.celebration=null;state.syncCelebrationTimeline=null;$('wcWorldCupBroadcast')?.classList.remove('is-goal-celebration');
    Object.assign(state.camera,{x:.5,y:.515,zoom:1.022,tx:.5,ty:.515,tz:1.022,vx:0,vy:0,vz:0,mode:'LIVE_BROADCAST'});
    if(state.cameraDirector){state.cameraDirector.shot='MAIN';state.cameraDirector.lastShot='';state.cameraDirector.timer=2.4}
    if(c.onDone){c.onDone();return}
    if(c.varContext){startVar(c.varContext);return}
    const finish=()=>restartAfterScore(c.restartTeam);
    // Replay has a clearly branded intro, persistent SLOW MOTION bug and branded outro.
    if(c.replayFrames?.length>=10&&beginWorldCupReplay('GOAL REPLAY',c.replayFrames,{frames:42,duration:3.10,slow:.68,introDuration:.85,onDone:finish}))return;
    finish();
  }
  function updateWorldCupGoalCelebration(dt){
    const c=state.celebration;if(!c)return;c.elapsed+=dt;
    if(c.elapsed<c.duration-.6&&c.elapsed>=(c.nextParticleAt||0)){c.particles.push(makeWorldCupCelebrationParticle(c));c.nextParticleAt=c.elapsed+.30+(state.visualRand?.()||Math.random())*.32}
    for(const p of c.particles){p.age+=dt;p.vy+=p.g*dt;p.x+=p.vx*dt+Math.sin(p.age*7+p.phase)*.004*dt;p.y+=p.vy*dt}
    c.particles=c.particles.filter(p=>p.age<p.life&&p.y<.88);
    for(const fw of (c.fireworks||[]))fw.age+=dt;
    c.fireworks=(c.fireworks||[]).filter(fw=>fw.age<fw.life);

    const landingU=clamp(c.elapsed/Math.max(.01,c.landingDuration||c.groundedAt),0,1),landingComplete=landingU>=1;
    for(const e of state.entities){
      const px=e.x,py=e.y;
      if(e.team===c.team){
        if(!c.grounded){
          const pos=smoothWorldCupLandingPosition(c,e,landingU);e.x=pos.x;e.y=pos.y;e.intent='celebration-landing';e.bank=lerp(e.bank||0,0,1-Math.exp(-dt*5.6));
        }else{
          const g=Math.max(0,c.elapsed-c.groundedAt),pos=worldCupGroundCelebrationPosition(c,e,g);e.x=pos.x;e.y=pos.y;e.celebrationJump=pos.jump;e.intent=c.participants.includes(e)?'celebrate-ground':'celebrate-support';
          e.facing=c.scorer.x>=e.x?1:-1;e.dir=-e.facing;e.bank=0;
        }
      }else{
        const a=c.otherStarts[e.player.id],b=c.otherTargets[e.player.id];
        if(a&&b){const delay=.20,duration=Math.max(2.75,c.duration-delay-.20),raw=clamp((c.elapsed-delay)/duration,0,1),q=raw*raw*(3-2*raw);e.x=lerp(a.x,b.x,q);e.y=lerp(a.y,b.y,q);e.intent=raw<1?'restart-retreat':'restart-ready'}
      }
      e.vx=(e.x-px)/Math.max(.001,dt);e.vy=(e.y-py)/Math.max(.001,dt);
      if(!c.grounded&&Math.abs(e.vx)>.006){e.facing=e.vx>0?1:-1;e.dir=-e.facing}
    }
    // Flip to standing sprites only once every scorer-side rider has reached the exact ice target.
    // Setting grounded after the final interpolated frame removes the old stop-motion/snap effect.
    if(!c.grounded&&landingComplete){
      for(const e of teamEntities(c.team)){const t=c.targets[e.player.id];if(t){e.x=t.x;e.y=t.y;e.tx=t.x;e.ty=t.y;e.vx=e.vy=0;e.bank=0;e.intent='celebrate-ground';e.facing=c.scorer.x>=e.x?1:-1;e.dir=-e.facing}}
      c.grounded=true;
    }
    state.ref.tx=safeX(lerp(state.ref.x,c.centerX,.28));state.ref.ty=.54;
    const r=state.ref,rx=r.x,ry=r.y,rk=1-Math.exp(-dt*2.8);r.x=lerp(r.x,r.tx,rk);r.y=lerp(r.y,r.ty,rk);r.vx=(r.x-rx)/Math.max(.001,dt);r.vy=(r.y-ry)/Math.max(.001,dt);
    if(c.elapsed>=c.duration)finishWorldCupGoalCelebration();
  }
  function drawWorldCupGoalCelebrationEffects(ctx){
    const c=state.celebration;if(!c)return;const palette=celebrationPalette(c.team);ctx.save();ctx.globalCompositeOperation='screen';
    // Bright World Cup fireworks: large radial bursts behind the celebration, with a second volley on landing.
    for(const fw of (c.fireworks||[])){
      if(fw.age<0)continue;const t=clamp(fw.age/fw.life,0,1),alpha=Math.sin(Math.PI*t)*.92;if(alpha<=0)continue;
      const x=fw.x*W,y=fw.y*H,r=14+t*84;ctx.globalAlpha=alpha;
      const rays=28;for(let i=0;i<rays;i++){
        const a=fw.seed+i*Math.PI*2/rays,rr=r*(.68+(i%5)*.065),inner=rr*(.22+.12*t);ctx.strokeStyle=palette[(i+fw.colourOffset)%palette.length];ctx.lineWidth=i%5===0?2.4:1.25;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*inner,y+Math.sin(a)*inner);ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);ctx.stroke();
        if(i%2===0){ctx.fillStyle=palette[(i+1+fw.colourOffset)%palette.length];const s=i%6===0?4:3;ctx.fillRect(Math.round(x+Math.cos(a)*rr)-1,Math.round(y+Math.sin(a)*rr)-1,s,s)}
      }
      if(fw.rings>1){ctx.globalAlpha=alpha*.40;ctx.strokeStyle='#fff2b0';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,r*.58,0,Math.PI*2);ctx.stroke()}
      ctx.globalAlpha=alpha*.20;ctx.fillStyle='#fff6cf';ctx.beginPath();ctx.arc(x,y,7*(1-t)+2,0,Math.PI*2);ctx.fill();
    }
    for(const p of c.particles){const u=clamp(p.age/p.life,0,1);ctx.globalAlpha=(1-u)*.86;ctx.fillStyle=p.colour;const s=Math.max(2,Math.round(p.size));ctx.fillRect(Math.round(p.x*W),Math.round(p.y*H),s,s)}
    if(c.elapsed<1.5){const x=c.scorer.x*W,y=c.scorer.y*H+(c.grounded?standingFloorOffsetPx():-WORLD_CUP_AIR_LIFT_PX),ring=18+c.elapsed*48;ctx.globalAlpha=Math.max(0,.30-c.elapsed*.16);ctx.strokeStyle=palette[1];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,ring,0,Math.PI*2);ctx.stroke()}
    ctx.restore();
  }

  // ---------- WORLD CUP BROADCAST / CAMERA DIRECTOR ----------
  function cameraBoundsForZoom(z){const hx=.5/z,hy=.5/z;return {x0:hx,x1:1-hx,y0:hy,y1:1-hy}}
  function updateWorldCupCameraDirector(dt){const d=state.cameraDirector||(state.cameraDirector={shot:'MAIN',timer:0,lastShot:'',cutSerial:0});if(state.replay||state.replayIntro||state.replayOutro||state.celebration||state.special)return;d.timer-=dt;if(d.timer>0)return;const phase=state.director?.phase||'BUILD-UP',carrier=state.carrier,flight=state.ball.flight;let choices=['MAIN','WIDE'];if(flight?.meta?.kind==='shot'||phase==='GOAL CHANCE')choices=['CLOSE_ATTACK','GOAL_END','MAIN'];else if(phase==='COUNTERATTACK')choices=['TRACKING','WIDE','MAIN'];else if(phase==='ATTACK')choices=['TRACKING','MAIN','WIDE'];else if(phase==='DEFENSIVE PRESSURE')choices=['MAIN','CLOSE_ATTACK','WIDE'];const filtered=choices.filter(x=>x!==d.lastShot),pool=filtered.length?filtered:choices;d.shot=pool[Math.floor((state.visualRand?.()||Math.random())*pool.length)]||'MAIN';d.lastShot=d.shot;d.cutSerial++;d.timer=(d.shot==='WIDE'?6.5:4.4)+(state.visualRand?.()||Math.random())*3.1;if(carrier&&d.shot==='GOAL_END')d.goalTeam=carrier.team}
  function worldCupCameraFramePoints(){
    const pts=[],carrier=state.carrier,flight=state.ball.flight,ball=flight?state.ball:(carrier||state.ball);if(ball)pts.push({x:ball.x,y:ball.y,w:1.7});if(carrier)pts.push({x:carrier.x,y:carrier.y,w:1.55});if(flight?.meta?.receiver)pts.push({x:flight.meta.receiver.x,y:flight.meta.receiver.y,w:1.1});if(flight?.meta?.challenger)pts.push({x:flight.meta.challenger.x,y:flight.meta.challenger.y,w:1.15});if(carrier){teamEntities(other(carrier.team)).slice().sort((a,b)=>dist2(a,carrier)-dist2(b,carrier)).slice(0,2).forEach((e,i)=>pts.push({x:e.x,y:e.y,w:i?.72:1.02}));teamEntities(carrier.team).filter(e=>e!==carrier&&dist2(e,carrier)<.30).forEach(e=>pts.push({x:e.x,y:e.y,w:.55}))}return pts;
  }
  function updateWorldCupBroadcastDirector(dt){
    const b=state.broadcast;if(!b)return;const phase=state.director?.phase||'BUILD-UP',targetByPhase={'BUILD-UP':.14,ATTACK:.20,COUNTERATTACK:.29,'GOAL CHANCE':.38,RESET:.19,'SET PIECE':.25};let target=targetByPhase[phase]||.17;if(state.celebration)target=.60;if(state.special?.type==='var')target=.12;if(state.replay||state.replayIntro||state.replayOutro)target=.16;if(state.phase==='intro')target=.09;b.crowdLevel=lerp(Number(b.crowdLevel)||.12,clamp(target+state.crowdBoost,0,.68),1-Math.exp(-dt*1.8));if(audio.crowd)audio.setElementVolume(audio.crowd,clamp(b.crowdLevel,0,.68));
    if((state.phase==='first'||state.phase==='second')&&!state.special&&!state.celebration&&!state.replay&&!state.replayIntro&&!state.replayOutro&&phase!==b.phaseSeen){b.phaseSeen=phase;const now=performance.now();if(now-(b.lastPhaseCommentAt||0)>6500&&state.carrier){if(phase==='COUNTERATTACK'){b.lastPhaseCommentAt=now;say(`${state.carrier.player.name} turns this into a World Cup counter — ${teamMeta[state.carrier.team].name} are flying forward.`,{priority:4,intensity:'interested'})}else if(phase==='GOAL CHANCE'){b.lastPhaseCommentAt=now;say(`${state.carrier.player.name} is into the danger area. The crowd rises with the chance.`,{priority:5,intensity:'excited'})}}
    }
    updateWorldCupStoryGraphics(dt);
  }
  function playerSpriteHeight(e,standing=false){const base=standing?PLAYER_STAND_HEIGHT:PLAYER_RIDE_HEIGHT;return base*(PLAYER_SCALE[e?.player?.id]||1)}
  function recordEvent(type,data={},weight=1){const ev={type,data,weight,time:state.matchTime,half:state.half,score:{...state.score}};state.events.push(ev);if(state.events.length>80)state.events.shift();broadcastAuthoritativeEvent(ev)}
  function impactFor(p){const s=state.playerStats[p.id]||{};return (s.goals||0)*5+(s.assists||0)*2.6+(s.interceptions||0)*2.25+(s.saves||0)*2.1+(s.completed||0)*.08+(s.rebounds||0)*.65-(s.fouls||0)*.75}
  function playerOfPeriod(half=null){return allPlayers.map(p=>({p,score:impactFor(p)})).sort((a,b)=>b.score-a.score || a.p.name.localeCompare(b.p.name))[0]?.p||allPlayers[0]}
  function eventDescription(ev){if(!ev)return 'A tense tactical half with neither side producing one single defining moment.';const d=ev.data||{};if(ev.type==='goal')return `${d.player} finishes for ${teamMeta[d.team]?.name||d.team}.`;if(ev.type==='save')return `${d.player} produces a major save under pressure.`;if(ev.type==='post')return `${d.player} rattles the ring and starts a scramble.`;if(ev.type==='intercept')return `${d.player} reads the lane and wins possession.`;if(ev.type==='var')return `VAR interrupts the match after a major incident.`;if(ev.type==='foul')return `${d.player} is penalised for a late challenge.`;return d.text||'A major passage of play swings the momentum.'}
  function bestEvent(half=null){const pool=state.events.filter(e=>half==null||e.half===half);return pool.sort((a,b)=>b.weight-a.weight || b.time-a.time)[0]||null}
  function scoreLine(){return `${teamMeta.belros.name} ${state.score.belros}–${state.score.zafran} ${teamMeta.zafran.name}`}
  function lineupMarkup(team){return `<div class="wcg-lineup-side is-${team}"><h3>${teamMeta[team].name}</h3><div class="wcg-lineup-players">${roster[team].map(p=>`<article><img src="${p.standing}" alt=""><b>${p.name}</b><span>${p.role.toUpperCase()}</span></article>`).join('')}</div></div>`}
  function keyPlayerMarkup(p,team){return `<article class="wcg-key-player is-${team}"><img src="${p.standing}" alt=""><div><small>${teamMeta[team].name} · ${p.role.toUpperCase()}</small><b>${p.name}</b><p>${p.short}</p></div></article>`}
  function updatePrematchPresentation(){
    const remaining=Math.max(0,INTRO_SECONDS-state.introElapsed);
    const homeKey=roster.belros.find(p=>p.role==='attacker')||roster.belros[0],awayKey=roster.zafran.find(p=>p.role==='attacker')||roster.zafran[0];
    if(remaining>25){setBroadcastState('INTRO');showPresentation('pre-intro','VELMORA QUIDDITCH WORLD CUP',`${teamMeta.belros.name}  VS  ${teamMeta.zafran.name}`,`<div class="wcg-versus"><b>${teamMeta.belros.name}</b><span>WORLD CUP 2026</span><b>${teamMeta.zafran.name}</b></div>`,`LIVE FROM · ${activeArena().name}`,'intro')}
    else if(remaining>20){setBroadcastState('PRE_MATCH');showPresentation('pre-lineups','STARTING SIX','LINEUPS',`<div class="wcg-lineups">${lineupMarkup('belros')}${lineupMarkup('zafran')}</div>`,'PLAYERS ARE ON THE PITCH','lineups')}
    else if(remaining>15){setBroadcastState('PRE_MATCH');showPresentation('pre-key','ONES TO WATCH','KEY PLAYERS',`<div class="wcg-key-grid">${keyPlayerMarkup(homeKey,'belros')}${keyPlayerMarkup(awayKey,'zafran')}</div>`,'WORLD CUP SQUADS · LIVE FIXTURE','keys')}
    else if(remaining>10){setBroadcastState('PRE_MATCH');showPresentation('pre-facts','MATCH FACTS',`${teamMeta.belros.name} vs ${teamMeta.zafran.name}`,'<div class="wcg-facts"><span><b>18</b> MINUTES</span><span><b>6</b> PLAYERS</span><span><b>0</b> GOLDEN SNITCH</span></div>','REPO SPORTS WORLD CUP','facts')}
    else if(remaining>5){setBroadcastState('PRE_MATCH');showPresentation('pre-arena','LIVE FROM VARDESH',activeArena().name,'<p class="wcg-arena-copy">Packed stands. Full crowd. Whistleworth has the Quaffle and both teams are set.</p>','MUSIC BUILDING · KICKOFF NEXT','arena')}
    else {const n=Math.max(1,Math.ceil(remaining));setBroadcastState('KICKOFF_COUNTDOWN');showPresentation(`pre-count-${n}`,'KICKOFF',String(n),'<div class="wcg-count-copy">WHISTLEWORTH READY · QUAFFLE IN HAND</div>','QUILL ON!','countdown')}
  }
  function kickoffReadyTarget(e){
    const home=e.team==='belros',side=home?-1:1;
    if(e.player.role==='attacker')return {x:.5+side*.095,y:.535};
    if(e.player.role==='defender')return {x:.5+side*.175,y:.485};
    return {x:.5+side*.155,y:.595};
  }
  function stageKickoffReadyPlayers(dt,immediate=false){
    const k=immediate?1:(1-Math.exp(-Math.max(0,dt)*3.4));
    for(const e of state.entities){
      const t=kickoffReadyTarget(e);e.x=lerp(e.x,t.x,k);e.y=lerp(e.y,t.y,k);e.tx=t.x;e.ty=t.y;e.vx=0;e.vy=0;e.intent='kickoff-ready';
      const face=e.team==='belros'?1:-1;e.facing=face;e.dir=-face;e.bank=0;
    }
  }
  function refStandingBallPoint(){const image=state.assets.refStanding,h=REF_STAND_HEIGHT,w=image?h*(image.width/image.height):h*.56;return {x:state.ref.x+(w*.34)/W,y:state.ref.y+(h*.08)/H}}
  function updateKickoffToss(dt){
    const remain=INTRO_SECONDS-state.introElapsed;
    if(remain<=4.2)stageKickoffReadyPlayers(dt,false);
    if(remain>1.2){const h=refStandingBallPoint();state.ball.x=h.x;state.ball.y=h.y;state.ball.visible=true;return}
    if(!state.kickoffToss){const h=refStandingBallPoint();state.kickoffToss={elapsed:0,duration:1.18,sx:h.x,sy:h.y,tx:.5,ty:.535};showBanner(`${WORLD_CUP_REFEREE_NAME} RELEASES THE QUAFFLE`,'',1.1)}
    const k=state.kickoffToss;k.elapsed=Math.min(k.duration,k.elapsed+dt);const t=clamp(k.elapsed/k.duration,0,1),q=ease(t);state.ball.x=lerp(k.sx,k.tx,q);state.ball.y=lerp(k.sy,k.ty,q)-Math.sin(Math.PI*t)*.022;state.ball.visible=true;
  }
  function completePrematch(){if(state.phase!=='intro')return;state.introElapsed=INTRO_SECONDS;updateKickoffToss(.2);hidePresentation();if(!isHost()){setBroadcastState('SYNCING');showBanner('SYNCING LIVE MATCH','',1.2);void sendMatch('sync-request',{fixtureId:state.fixtureId,requestedAt:Date.now()});return}state.firstKickoff=state.simRand()<.5?'belros':'zafran';beginKickoff(state.firstKickoff,false);void sendAuthoritativeSnapshot(true)}
  function halftimeSummary(){const a=state.teamStats.belros,b=state.teamStats.zafran;if(state.score.belros!==state.score.zafran){const lead=state.score.belros>state.score.zafran?teamMeta.belros.name:teamMeta.zafran.name;return `${lead} take the advantage into the interval. The first half produced ${a.shots+b.shots} shots and ${a.interceptions+b.interceptions} interceptions.`}return `Level at the interval. ${a.shots+b.shots} shots and ${a.interceptions+b.interceptions} interceptions tell the story of a closely fought first half.`}
  function halftimeStatsMarkup(){const a=state.teamStats.belros,b=state.teamStats.zafran,tot=Math.max(.001,a.possession+b.possession),pa=Math.round(a.possession/tot*100),pb=100-pa;return `<div class="wcg-broadcast-stats"><div><b>${a.shots}</b><span>SHOTS</span><b>${b.shots}</b></div><div><b>${pa}%</b><span>POSSESSION</span><b>${pb}%</b></div><div><b>${a.interceptions}</b><span>INTERCEPTIONS</span><b>${b.interceptions}</b></div><div><b>${a.completed}</b><span>SUCCESSFUL PASSES</span><b>${b.completed}</b></div><div><b>${a.fouls}</b><span>FOULS</span><b>${b.fouls}</b></div></div>`}
  function pTeam(playerId){return roster.belros.some(p=>p.id===playerId)?'belros':'zafran'}
  function populateProfessionalHalftime(){
    const a=state.teamStats.belros,b=state.teamStats.zafran,tot=Math.max(.001,a.possession+b.possession),pa=Math.round(a.possession/tot*100),pb=100-pa;
    const accA=a.passes?Math.round((a.completed/a.passes)*100):0,accB=b.passes?Math.round((b.completed/b.passes)*100):0;
    const rows=[['SHOTS',a.shots,b.shots],['ON TARGET',a.onTarget,b.onTarget],['POSSESSION',`${pa}%`,`${pb}%`],['COMPLETED PASSES',`${a.completed}/${a.passes}`,`${b.completed}/${b.passes}`],['PASS ACCURACY',`${accA}%`,`${accB}%`],['INTERCEPTIONS',a.interceptions,b.interceptions],['TACKLES WON',a.tacklesWon||0,b.tacklesWon||0],['TURNOVERS',a.turnovers||0,b.turnovers||0],['REBOUNDS',a.rebounds,b.rebounds],['FOULS',a.fouls,b.fouls],['PENALTIES',a.penalties,b.penalties],['VAR',a.var,b.var]];
    $('wcgHalfHomeName').textContent=teamMeta.belros.name;$('wcgHalfAwayName').textContent=teamMeta.zafran.name;$('wcgHalfArena').textContent=`${activeArena().name} · WORLD CUP 2026`;
    $('wcgHalfBelros').textContent=state.score.belros;$('wcgHalfZafran').textContent=state.score.zafran;$('wcgHalfStatBoard').innerHTML=rows.map(([label,x,y])=>`<div><b>${x}</b><span>${label}</span><b>${y}</b></div>`).join('');
    const p=playerOfPeriod(1),ps=state.playerStats[p.id]||{},pt=pTeam(p.id);$('wcgHalfPlayerCard').innerHTML=`<small>PLAYER OF THE HALF</small><div class="wcg-halftime-player"><img src="${p.standing}" alt=""><div><b>${p.name}</b><span>${teamMeta[pt].name}</span><p>${ps.goals||0} goals · ${ps.assists||0} assists · ${ps.interceptions||0} interceptions · ${ps.completed||0} passes</p></div></div>`;
    const ev=bestEvent(1);$('wcgHalfMomentCard').innerHTML=`<small>MOMENT OF THE HALF</small><b>${ev?String(ev.type).toUpperCase():'TACTICAL BATTLE'}</b><p>${eventDescription(ev)}</p>`;
    $('wcgHalfCopy').textContent=halftimeSummary();$('wcgHalfShots').textContent=`SHOTS ${a.shots}-${b.shots} · ON TARGET ${a.onTarget}-${b.onTarget} · INTERCEPTIONS ${a.interceptions}-${b.interceptions}`;
  }

  function updateHalftimePresentation(dt){
    state.halftimeElapsed+=dt;const t=state.halftimeElapsed;
    if(t<3){setBroadcastState('HALFTIME');showPresentation('half-score','HALF TIME',scoreLine(),'<div class="wcg-half-big">9 MINUTES COMPLETE</div>',activeArena().name,'halftime')}
    else if(t<6){setBroadcastState('HALFTIME_STATS');showPresentation('half-stats','FIRST HALF','MATCH STATISTICS',halftimeStatsMarkup(),'LIVE SIMULATION DATA','stats')}
    else if(t<9){const p=playerOfPeriod(1),s=state.playerStats[p.id];showPresentation('half-player','PLAYER OF THE HALF',p.name,`<div class="wcg-player-half"><img src="${p.standing}" alt=""><p>${s.goals} GOALS · ${s.interceptions} INTERCEPTIONS · ${s.completed} COMPLETED PASSES</p></div>`,'SELECTED FROM FIRST-HALF IMPACT','player')}
    else if(t<12){const ev=bestEvent(1);showPresentation('half-moment','MOMENT OF THE HALF',ev?ev.type.toUpperCase():'TACTICAL BATTLE',`<p class="wcg-moment-copy">${eventDescription(ev)}</p>`,'BASED ON STORED MATCH EVENTS','moment')}
    else if(t<15){showPresentation('half-commentary','BARRY BRAMBLE · HALF-TIME',state.score.belros===state.score.zafran?'ALL SQUARE':'ADVANTAGE AT THE BREAK',`<p class="wcg-moment-copy">${halftimeSummary()}</p>`,'THE SECOND HALF AWAITS','summary')}
    else if(!state.halftimeReady){state.halftimeReady=true;hidePresentation();setBroadcastState('HALFTIME_READY');$('wcgHalfTitle').textContent='HALF TIME';populateProfessionalHalftime();$('wcgContinueHalf').textContent='START SECOND HALF';$('wcgContinueHalf').hidden=!isHost();if(!isHost())$('wcgHalfCopy').textContent+=` Waiting for CatAsthma to start the second half.`;$('wcgHalftime').classList.add('is-open')}
  }
  function updateSecondHalfCountdown(dt){state.secondCountdown=Math.max(0,state.secondCountdown-dt);const n=Math.max(1,Math.ceil(state.secondCountdown));showPresentation(`second-${n}`,'SECOND HALF',String(n),'<div class="wcg-count-copy">PLAYERS SET · WHISTLEWORTH READY</div>','PLAY!','countdown');if(state.secondCountdown<=0){hidePresentation();if(isHost()){beginKickoff(other(state.firstKickoff),true);void sendAuthoritativeSnapshot(true)}}}
  function fulltimeMomentMarkup(){const ev=bestEvent(null);return `<p class="wcg-moment-copy">${eventDescription(ev)}</p>`}
  function updateFulltimePresentation(dt){state.fulltimeElapsed+=dt;const data=state.fulltimeData;if(!data)return;const t=state.fulltimeElapsed;if(t<3){showPresentation('full-score','FULL TIME',scoreLine(),`<div class="wcg-half-big">${teamMeta[data.winner].name} ${data.fromShootout?'WIN ON PENALTIES':'WIN'}</div>`,`FINAL WHISTLE · ${activeArena().name}`,'fulltime')}else if(t<6){const p=data.mvp,s=state.playerStats[p.id];showPresentation('full-mvp','PLAYER OF THE MATCH',p.name,`<div class="wcg-player-half"><img src="${p.standing}" alt=""><p>${s.goals} GOALS · ${s.assists} ASSISTS · ${s.interceptions} INTERCEPTIONS</p></div>`,'MATCH IMPACT · LIVE STATS','player')}else if(t<9){showPresentation('full-moment','MATCH MOMENT',bestEvent()?.type.toUpperCase()||'FINAL WHISTLE',fulltimeMomentMarkup(),'THE MOMENT THAT DEFINED THE MATCH','moment')}else if(!$('wcgFulltime').classList.contains('is-open')){hidePresentation();populateFulltimePanel(data);$('wcgFulltime').classList.add('is-open');setBroadcastState('POST_MATCH');if(!state.packRewardHandled){state.packRewardHandled=true;setTimeout(()=>window.RepoWorldCupPacks?.completeFixture({...state.packFixture,phase:'fulltime',elapsedSeconds:Math.max(MATCH_SECONDS,state.matchTime)}),1700)}}}
  function worldCupTournamentBaseState(){
    try{return window.RepoSportsWorldCupTournament?.getState?.()||{results:{},playerGoals:{},teamGoals:{}}}catch(_){return {results:{},playerGoals:{},teamGoals:{}}}
  }
  function worldCupTournamentCompleted(fixtureId=state.fixtureId){
    try{return !!window.RepoSportsWorldCupTournament?.isCompleted?.(fixtureId)}catch(_){return false}
  }
  function worldCupTournamentLeaderData(){
    const base=worldCupTournamentBaseState(),players={},teams={};
    for(const [key,row] of Object.entries(base.playerGoals||{}))players[key]={name:String(row?.name||key),team:String(row?.team||''),goals:Math.max(0,Number(row?.goals)||0)};
    for(const [key,value] of Object.entries(base.teamGoals||{}))teams[key]=Math.max(0,Number(value)||0);
    const includeLive=!!state.realResultArmed&&!worldCupTournamentCompleted(state.fixtureId)&&['first','halftimehold','halftime','secondcountdown','second','shootout','fulltime'].includes(state.phase);
    if(includeLive){
      for(const p of allPlayers){const goals=Math.max(0,Number(state.playerStats?.[p.id]?.goals)||0);if(!goals)continue;const key=String(p.name||p.id).toLowerCase();const team=teamMeta[pTeam(p.id)]?.name||'';const row=players[key]||{name:p.name,team,goals:0};row.goals+=goals;row.team=team;players[key]=row}
      teams[teamMeta.belros.name]=(teams[teamMeta.belros.name]||0)+Math.max(0,Number(state.score.belros)||0);
      teams[teamMeta.zafran.name]=(teams[teamMeta.zafran.name]||0)+Math.max(0,Number(state.score.zafran)||0);
    }
    const playerRows=Object.values(players).filter(x=>x.goals>0).sort((a,b)=>b.goals-a.goals||a.name.localeCompare(b.name));
    const teamRows=Object.entries(teams).map(([name,goals])=>({name,goals})).filter(x=>x.goals>0).sort((a,b)=>b.goals-a.goals||a.name.localeCompare(b.name));
    return {playerRows,teamRows,includeLive};
  }
  function renderWorldCupTournamentLeaders(){
    const pEl=$('wcgTournamentPlayerLeaders'),tEl=$('wcgTournamentTeamLeaders'),mode=$('wcgTournamentLeadersMode');if(!pEl||!tEl)return;
    const {playerRows,teamRows,includeLive}=worldCupTournamentLeaderData();if(mode)mode.textContent=includeLive?'REAL TOTALS · LIVE MATCH':'REAL RESULTS';
    const rankClass=i=>i===0?' is-first':i===1?' is-second':i===2?' is-third':'';
    pEl.innerHTML=playerRows.length?playerRows.slice(0,5).map((x,i)=>`<div class="wcg-leader-row${rankClass(i)}"><em>${i+1}</em><span><b>${x.name}</b><small>${x.team}</small></span><strong>${x.goals}</strong></div>`).join(''):'<p>NO REAL GOALS YET</p>';
    tEl.innerHTML=teamRows.length?teamRows.slice(0,5).map((x,i)=>`<div class="wcg-leader-row${rankClass(i)}"><em>${i+1}</em><span><b>${x.name}</b><small>WORLD CUP NATION</small></span><strong>${x.goals}</strong></div>`).join(''):'<p>NO REAL GOALS YET</p>';
  }

  function updateScoreUi(){
    $('wcgScoreBelros').textContent=state.score.belros;$('wcgScoreZafran').textContent=state.score.zafran;
    let t=state.matchTime,phase='1ST HALF';
    if(state.phase==='intro'){ $('wcgClock').textContent=`-${Math.max(0,Math.ceil(INTRO_SECONDS-state.introElapsed))}`;phase='PRE-MATCH'; }
    else { if(state.phase==='second')phase='2ND HALF';else if(state.phase==='halftimehold')phase='1ST HALF END';else if(state.phase==='halftime')phase='HALF TIME';else if(state.phase==='secondcountdown')phase='2ND HALF SOON';else if(state.phase==='shootout')phase='PENALTIES';else if(state.phase==='fulltime')phase='FULL TIME'; const m=Math.floor(t/60),s=Math.floor(t%60);$('wcgClock').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
    $('wcgPhase').textContent=phase;
    const a=state.teamStats.belros,b=state.teamStats.zafran;
    const possTotal=Math.max(.001,a.possession+b.possession),pa=Math.round(a.possession/possTotal*100),pb=100-pa;
    const liveValues={wcgStatHShots:a.shots,wcgStatAShots:b.shots,wcgStatHOnTarget:a.onTarget,wcgStatAOnTarget:b.onTarget,wcgStatHPoss:`${pa}%`,wcgStatAPoss:`${pb}%`,wcgStatHInts:a.interceptions,wcgStatAInts:b.interceptions,wcgStatHFouls:a.fouls,wcgStatAFouls:b.fouls,wcgStatHVar:a.var,wcgStatAVar:b.var};
    for(const [id,value] of Object.entries(liveValues)){const el=$(id);if(el)el.textContent=value}
    renderWorldCupTournamentLeaders();
    const homeScorers=$('wcgHomeScorers'),awayScorers=$('wcgAwayScorers');
    if(homeScorers)homeScorers.textContent=scorerSummary('belros');
    if(awayScorers)awayScorers.textContent=scorerSummary('zafran');
  }
  function createEntities(){
    state.entities=[];
    const groundY=.685;
    const belrosX=[.27,.34,.41], zafranX=[.73,.66,.59];
    const roleProfile=role=>{
      const base={personality:'tactical',speed:.93,accel:.93,turn:.93,passing:.90,catching:.90,shooting:.86,interception:.88,awareness:.91,positioning:.91,reaction:.91,anticipation:.91,decision:.91,composure:.91,aggression:.82,stamina:.94,recovery:.92};
      if(role==='attacker')Object.assign(base,{personality:'aggressive',speed:.97,accel:.97,turn:.96,interception:.78,positioning:.87,aggression:.90});
      else if(role==='defender')Object.assign(base,{personality:'tactical',speed:.90,accel:.90,interception:.97,awareness:.97,positioning:.98,anticipation:.97,composure:.95});
      else Object.assign(base,{personality:'creative',speed:.93,accel:.93,passing:.97,catching:.94,interception:.84,awareness:.94,decision:.96});
      return base;
    };
    const profiles={};for(const team of ['belros','zafran'])for(const p of roster[team])profiles[p.id]=roleProfile(p.role);
    state.fairness={belros:1,zafran:1,target:1,teamWinBias:0,rubberBand:false,scriptedGoals:false,principle:'50/50 OPEN COMPETITION · ANTI-SNOWBALL CHANCE BALANCE',roleFinishingBias:false};
    const makeEntity=(p,team,x,i)=>{const a={...profiles[p.id]};return {player:p,team,x,y:groundY,vx:0,vy:0,ax:0,ay:0,tx:x,ty:groundY,
      facing:teamMeta[team].attack,dir:-teamMeta[team].attack,bank:0,celebrate:0,intent:'shape',mark:null,currentThreat:null,
      personality:a.personality,attributes:a,form:0,fatigue:0,mistakes:0,recentSuccess:0,
      maxSpeed:(p.role==='attacker'?.205:p.role==='defender'?.19:.198)*(0.88+a.speed*.16),
      accel:(p.role==='attacker'?.74:.68)*(0.86+a.accel*.20),turnRate:(p.role==='attacker'?5.6:5.0)*(0.85+a.turn*.22),
      wander:(i-1)*.37,decisionNoise:(state.simRand?.()||.5)-.5,decisionClock:.05+(state.simRand?.()||.5)*.12,
      recoveryTarget:null,lastIntent:'shape',lastDecisionAt:0,edgeStall:0,hoverTime:0,flowSign:i%2?1:-1,flowPhase:(state.simRand?.()||.5)*Math.PI*2,
      desiredTx:x,desiredTy:groundY,tacticalRole:'SHAPE',responsibility:'SHAPE',supportTarget:null,pressing:false,smoothedTurn:0,faceCandidate:0,faceCandidateTime:0,
      floorHoverTime:0,ringHoverTime:0,packCrowdTime:0,packDisperseTime:0,packDisperseTarget:null,animState:'IDLE',animPriority:0,animUntil:0,animMeta:{}}};
    roster.belros.forEach((p,i)=>state.entities.push(makeEntity(p,'belros',belrosX[i],i)));
    roster.zafran.forEach((p,i)=>state.entities.push(makeEntity(p,'zafran',zafranX[i],i)));
    state.ref={x:.5,y:groundY,vx:0,vy:0,tx:.5,ty:groundY,dir:1,maxSpeed:.175,accel:.58,edgeStall:0,hoverTime:0,floorHoverTime:0};
    state.entitiesByTeam={belros:state.entities.filter(e=>e.team==='belros'),zafran:state.entities.filter(e=>e.team==='zafran')};
    state.entityByIdMap=new Map(state.entities.map(e=>[e.player.id,e]));
    initTeamTactics();initMatchFlowDirector();
  }
  function entityById(id){return state.entityByIdMap?.get(id)||state.entities.find(e=>e.player.id===id)}
  function teamEntities(team){return state.entitiesByTeam?.[team]||state.entities.filter(e=>e.team===team)}
  function rolePlayer(team,role){return teamEntities(team).find(e=>e.player.role===role)||teamEntities(team)[0]}

  function initTeamTactics(){
    state.teamTactics={};
    // World Cup fairness rule: both national teams get the SAME Club tactical profile
    // for a fixture. The style can vary from match to match, but country/team name can
    // never confer a stronger tactical model. This keeps genuine 50/50 team strength.
    const sharedProfile=CLUB_TACTICAL_PROFILES[hashSeed(`REPO_SPORTS_WORLD_CUP_SHARED_TACTIC|${state.fixtureId||'fixture'}`)%CLUB_TACTICAL_PROFILES.length];
    state.sharedTacticalProfile=sharedProfile;
    for(const team of ['belros','zafran']){
      const profile=sharedProfile;
      state.teamTactics[team]={team,profile,state:'BUILDUP',previousState:'BUILDUP',risk:.50,pressing:.50,width:profile.width,depth:1,tempo:1,lastChange:simNow(),responsibilities:{},memory:{lanePressure:{},hotPlayer:null,lastTurnoverAt:0},adjustment:{id:'BASE',width:1,runner:1,support:1,press:1,passBias:0}};
    }
  }
  function tacticalScoreContext(team){
    const diff=(state.score?.[team]||0)-(state.score?.[other(team)]||0),remaining=Math.max(0,MATCH_SECONDS-(state.matchTime||0)),late=remaining<162,veryLate=remaining<68;
    let urgency=.50;if(diff<0)urgency+=late?.16:.06;if(diff<0&&veryLate)urgency+=.12;if(diff>0)urgency-=late?.13:.04;if(diff>1&&late)urgency-=.07;if(diff===0&&veryLate)urgency+=.06;
    return {diff,remaining,late,veryLate,urgency:clamp(urgency,.25,.78)};
  }
  function tacticalStateFor(team){
    if(state.phase==='halftime'||state.phase==='secondcountdown')return 'HALFTIME';
    if(state.celebration)return state.celebration.team===team?'GOAL_CELEBRATION':'RESTART';
    if(state.special?.type==='penalty')return 'RESTART';
    if(!state.possession)return 'RECOVERY';
    const owns=state.possession===team,recent=simNow()-(state.possessionChangedAt||0)<1650,zone=state.zone||.15;
    if(owns){if(recent&&zone<.72)return 'COUNTERATTACK';if(zone>.68)return 'FINAL_ATTACK';if(zone>.37)return 'ATTACK';return 'BUILDUP'}
    const carrier=state.carrier,nearest=carrier?Math.min(...teamEntities(team).map(e=>dist2(e,carrier))):1;
    if(recent)return 'RECOVERY';if(carrier&&nearest<.18)return 'PRESSING';return 'DEFENSIVE';
  }
  function assignTacticalResponsibilities(team){
    const tt=state.teamTactics?.[team];if(!tt)return;const players=teamEntities(team),carrier=state.carrier;tt.responsibilities={};players.forEach(e=>e.pressing=false);
    if(state.possession===team&&carrier){
      tt.responsibilities[carrier.player.id]='BALL_CARRIER';carrier.tacticalRole='BALL_CARRIER';
      const off=players.filter(e=>e!==carrier),runner=off.slice().sort((a,b)=>((b.player.role==='attacker'?1:.35)+(b.attributes?.speed||0))-((a.player.role==='attacker'?1:.35)+(a.attributes?.speed||0)))[0]||off[0],support=off.find(e=>e!==runner)||off[0];
      if(runner){const p=tt.profile||tacticalProfileForTeam(team),role=(p.id==='WIDE'||(p.id==='PATIENT'&&tt.state==='BUILDUP'))?'WIDTH':'RUNNER';tt.responsibilities[runner.player.id]=role;runner.tacticalRole=role}
      if(support){tt.responsibilities[support.player.id]='SUPPORT';support.tacticalRole='SUPPORT'}
    }else if(carrier){
      const scored=players.map(e=>({e,score:dist2(e,carrier)-.025*(e.attributes?.aggression||.7)})).sort((a,b)=>a.score-b.score),presser=scored[0]?.e,rest=players.filter(e=>e!==presser),cover=rest.slice().sort((a,b)=>(b.attributes?.positioning||0)-(a.attributes?.positioning||0))[0],support=rest.find(e=>e!==cover)||rest[0];
      for(const [e,role] of [[presser,'BALL_PRESSER'],[support,'SUPPORT_COVER'],[cover,'COVER']])if(e){tt.responsibilities[e.player.id]=role;e.tacticalRole=role;e.pressing=role==='BALL_PRESSER'}
    }else{
      const ordered=players.slice().sort((a,b)=>Math.hypot(a.x-state.ball.x,a.y-state.ball.y)-Math.hypot(b.x-state.ball.x,b.y-state.ball.y)),roles=['SECOND_BALL','SUPPORT_COVER','COVER'];ordered.forEach((e,i)=>{tt.responsibilities[e.player.id]=roles[i]||'COVER';e.tacticalRole=roles[i]||'COVER'});
    }
  }
  function updateTeamTacticalDirector(dt,force=false){
    if(!state.teamTactics?.belros)initTeamTactics();state.tacticalPulse=(state.tacticalPulse||0)-dt;if(!force&&state.tacticalPulse>0)return;state.tacticalPulse=.58;
    for(const team of ['belros','zafran']){
      const tt=state.teamTactics[team],next=tacticalStateFor(team),ctx=tacticalScoreContext(team),mom=state.director?.momentum?.[team]||0,p=tt.profile||tacticalProfileForTeam(team),adj=tt.adjustment||tacticalAdjustmentForTeam(team);
      tt.risk=clamp(ctx.urgency+mom*.06,.28,.74);tt.pressing=clamp(.42+(next==='PRESSING'?.18:0)+(ctx.diff<0&&ctx.late?.10:0),.30,.72);tt.width=clamp(p.width*(adj.width||1),.84,1.22);
      if(next!==tt.state){tt.previousState=tt.state;tt.state=next;tt.lastChange=simNow();if(next==='PRESSING')state.teamStats[team].presses++}
      for(const key of Object.keys(tt.memory.lanePressure||{}))tt.memory.lanePressure[key]*=.985;assignTacticalResponsibilities(team);
    }
  }
  function initMatchFlowDirector(){state.matchFlow={currentPhase:FLOW_PHASES.RESTART,possessionTeam:state.possession||null,phaseStartTime:state.matchTime||0,phaseElapsed:0,phaseIntensity:.35,sequenceId:0,template:null,tempo:'normal',recentSequences:[],possessionElapsed:0,actionIndex:0,quietUntil:0,lastMajorAt:-99,lastTurnoverAt:-99,lastSwitchAt:-99,lastAction:'restart',forcedPhaseUntil:0}}
  function flowRand(){return state.simRand?.()||Math.random()}
  function flowTempoScale(){const t=state.matchFlow?.tempo;return t==='fast'?.82:t==='slow'?1.22:1}
  function flowScheduleNext(min=.95,max=1.85){const k=flowTempoScale();scheduleNext(min*k,max*k)}
  function chooseFlowTemplate(preferCounter=false){
    if(!state.matchFlow)initMatchFlowDirector();const f=state.matchFlow,recent=f.recentSequences||[];let pool=FLOW_TEMPLATES.filter(t=>preferCounter?t.id==='counter-attack':t.id!=='counter-attack'),weighted=[];
    for(const t of pool){let w=t.weight;if(recent.includes(t.id))w*=.28;if(t.id==='quiet-spell'&&f.sequenceId<2)w*=1.35;for(let i=0;i<Math.max(1,Math.round(w*10));i++)weighted.push(t)}
    const chosen=weighted[Math.floor(flowRand()*weighted.length)]||pool[0];f.template=chosen;f.tempo=chosen.tempo;f.actionIndex=0;f.sequenceId++;f.recentSequences=[...recent,chosen.id].slice(-3);if(chosen.id==='quiet-spell')f.quietUntil=(state.matchTime||0)+(10+flowRand()*10);return chosen;
  }
  function setFlowPhase(phase){if(!state.matchFlow)initMatchFlowDirector();const f=state.matchFlow;if(f.currentPhase===phase)return;f.currentPhase=phase;f.phaseStartTime=state.matchTime||0;f.phaseElapsed=0;f.actionIndex=0}
  function noteFlowMajor(event){if(!state.matchFlow)initMatchFlowDirector();state.matchFlow.lastMajorAt=state.matchTime||0;state.matchFlow.lastAction=event}
  function flowPossessionChanged(team,previous){if(!state.matchFlow)initMatchFlowDirector();const f=state.matchFlow;f.possessionTeam=team;f.possessionElapsed=0;f.lastTurnoverAt=state.matchTime||0;setFlowPhase(previous?FLOW_PHASES.TURNOVER:FLOW_PHASES.RESTART);chooseFlowTemplate(!!previous);if(previous)f.forcedPhaseUntil=(state.matchTime||0)+(.8+flowRand()*.8)}
  function updateMatchFlowDirector(dt){
    if(!state.matchFlow)initMatchFlowDirector();const f=state.matchFlow;if(state.phase!=='first'&&state.phase!=='second')return;f.phaseElapsed+=dt;if(state.possession)f.possessionElapsed+=dt;
    if(state.celebration||state.replay||state.replayIntro||state.replayOutro||state.special){setFlowPhase(FLOW_PHASES.STOPPAGE);return}if(!state.possession){setFlowPhase(FLOW_PHASES.SCRAMBLE);return}
    if(f.possessionTeam!==state.possession)flowPossessionChanged(state.possession,f.possessionTeam);const now=state.matchTime||0,zone=state.zone||.15,recentTurn=now-(f.lastTurnoverAt||-99)<2.4;
    if(recentTurn&&zone<.70){setFlowPhase(FLOW_PHASES.COUNTER);return}if(now<(f.forcedPhaseUntil||0))return;if(state.chanceBuild){setFlowPhase(FLOW_PHASES.SHOT_SEQUENCE);return}if(zone>.68){setFlowPhase(FLOW_PHASES.FINAL_THIRD);return}
    const quiet=now<(f.quietUntil||0),p=f.possessionElapsed;if(quiet){setFlowPhase(p<3?FLOW_PHASES.BUILDUP:FLOW_PHASES.CIRCULATION);return}if(p<2.4)setFlowPhase(FLOW_PHASES.BUILDUP);else if(p<5.5)setFlowPhase(FLOW_PHASES.CIRCULATION);else if(zone<.38)setFlowPhase(FLOW_PHASES.PROBING);else setFlowPhase(FLOW_PHASES.ATTACKING);if(!f.template||p>20)chooseFlowTemplate(false);
  }
  function flowPassMode(){
    const f=state.matchFlow||{},phase=f.currentPhase,template=f.template?.id,team=state.possession,p=team?tacticalProfileForTeam(team):null,r=flowRand();if(phase===FLOW_PHASES.COUNTER)return 'forward';if(p?.id==='WIDE'&&(phase===FLOW_PHASES.CIRCULATION||phase===FLOW_PHASES.PROBING)&&((f.actionIndex||0)%2===1))return 'switch';if(p?.id==='DIRECT'&&phase!==FLOW_PHASES.BUILDUP)return r<.82?'forward':'sideways';if(p?.id==='PATIENT'&&(phase===FLOW_PHASES.BUILDUP||phase===FLOW_PHASES.CIRCULATION))return r<.58?'recycle':'sideways';if(p?.id==='COMPACT'&&(phase===FLOW_PHASES.BUILDUP||phase===FLOW_PHASES.CIRCULATION))return r<.46?'sideways':'recycle';if(p?.id==='FLUID'&&phase===FLOW_PHASES.PROBING)return r<.28?'switch':r<.52?'sideways':'forward';if(phase===FLOW_PHASES.CIRCULATION||template==='quiet-spell')return r<.48?'sideways':'recycle';if(template==='switch-play'&&((f.actionIndex||0)%3===1))return 'switch';if(phase===FLOW_PHASES.BUILDUP)return r<.55?'sideways':'recycle';if(phase===FLOW_PHASES.PROBING)return r<.30?'sideways':'forward';return 'forward';
  }
  function flowActionWeights(){const f=state.matchFlow||{},phase=f.currentPhase,quiet=(state.matchTime||0)<(f.quietUntil||0);if(quiet)return {shot:.024,drive:.315,pass:.661};if(phase===FLOW_PHASES.BUILDUP)return {shot:.038,drive:.365,pass:.597};if(phase===FLOW_PHASES.CIRCULATION)return {shot:.052,drive:.368,pass:.580};if(phase===FLOW_PHASES.PROBING)return {shot:.108,drive:.425,pass:.467};if(phase===FLOW_PHASES.COUNTER)return {shot:.178,drive:.492,pass:.330};if(phase===FLOW_PHASES.FINAL_THIRD)return {shot:.355,drive:.355,pass:.290};return {shot:.185,drive:.425,pass:.390}}
  function tacticalTarget(e,x,y,intent,force=false){x=safeX(x);y=safeY(y);e.desiredTx=x;e.desiredTy=y;if(intent)e.intent=intent;const blend=force?.78:.42;e.tx=lerp(Number.isFinite(e.tx)?e.tx:e.x,x,blend);e.ty=lerp(Number.isFinite(e.ty)?e.ty:e.y,y,blend)}
  function goalSideScreenPoint(shooter){const gx=shooter.team==='belros'?.902:.098,gy=.508,dx=gx-shooter.x,dy=gy-shooter.y,d=Math.hypot(dx,dy)||.001,step=Math.min(d*.56,.060),u=step/d;return {x:safeX(shooter.x+dx*u),y:safeY(shooter.y+dy*u)}}
  function ringActionParticipants(){const keep=new Set(),flight=state.ball.flight;if(state.carrier){keep.add(state.carrier);const keeper=rolePlayer(other(state.carrier.team),'defender');if(keeper)keep.add(keeper)}if(flight?.meta?.shooter)keep.add(flight.meta.shooter);if(flight?.meta?.keeper)keep.add(flight.meta.keeper);if(flight?.meta?.receiver)keep.add(flight.meta.receiver);if(flight?.meta?.challenger)keep.add(flight.meta.challenger);return keep}
  function nearestHoopInfo(e){let best=null,bestD=999;for(const h of [...hoops.belros,...hoops.zafran]){const d=Math.hypot((e?.x||0)-h.x,(e?.y||0)-h.y);if(d<bestD){bestD=d;best=h}}return {hoop:best,dist:bestD}}
  function goalAreaInfo(e){const left={x:.098,y:.508},right={x:.902,y:.508},dl=Math.hypot(e.x-left.x,e.y-left.y),dr=Math.hypot(e.x-right.x,e.y-right.y);return dl<dr?{goal:left,dist:dl,side:'left'}:{goal:right,dist:dr,side:'right'}}
  function breakGoalAreaCongestion(e,dt,live){if(!live)return;const info=goalAreaInfo(e),participants=ringActionParticipants(),essential=participants.has(e),nearby=state.entities.filter(o=>Math.hypot(o.x-info.goal.x,o.y-info.goal.y)<.205),core=info.dist<.112,busy=nearby.length>=3&&info.dist<.205;if(essential||(!core&&!busy))return;const index=Math.max(0,nearby.filter(o=>!participants.has(o)).indexOf(e)),awayX=info.side==='left'?1:-1,fan=index%2===0?-1:1,spread=.105+(index%3)*.035;e.tx=safeX(info.goal.x+awayX*.185);e.ty=safeY(info.goal.y+fan*spread);const dx=e.tx-e.x,dy=e.ty-e.y,d=Math.hypot(dx,dy)||1,sp=Math.max(.105,Math.hypot(e.vx,e.vy));e.vx=lerp(e.vx,dx/d*sp,1-Math.exp(-dt*11));e.vy=lerp(e.vy,dy/d*sp,1-Math.exp(-dt*11));e.intent='recover';e.ringHoverTime=0}
  function applyLoiterBreak(e,dt,live){if(!live)return;const speed=Math.hypot(e.vx,e.vy),softBottom=lowerSoftLimit(e),hardBottom=lowerHardLimit(e),lowBand=e.y>hardBottom-.034;e.floorHoverTime=lowBand&&speed<.050?(e.floorHoverTime||0)+dt:Math.max(0,(e.floorHoverTime||0)-dt*3.4);if(e.floorHoverTime>.28){const side=e.x<.5?1:-1;e.ty=Math.min(e.ty,softBottom-.045);e.tx=safeX(e.x+side*.050);e.vy=Math.min(e.vy,-.090);e.vx+=side*.020;e.floorHoverTime=0;e.intent='recover'}breakGoalAreaCongestion(e,dt,live);const info=nearestHoopInfo(e),participants=ringActionParticipants(),activeGoalAction=participants.has(e),ringThreat=info.hoop&&info.dist<FLOW.ringRadius&&!activeGoalAction;e.ringHoverTime=ringThreat?(e.ringHoverTime||0)+dt:Math.max(0,(e.ringHoverTime||0)-dt*4.8);if(e.ringHoverTime>Math.min(FLOW.ringHoverTrigger,.10)){const h=info.hoop,awayX=h.x<.5?1:-1,dy=(e.y-h.y)||((e.flowSign||1)*.05),dd=Math.hypot(1,dy)||1;e.tx=safeX(e.x+awayX*.095);e.ty=safeY(h.y+dy/dd*.115-(e.y>h.y?.025:0));e.vx+=awayX*.096;e.vy+=dy/dd*.086-(e.y>h.y?.035:0);e.ringHoverTime=0;e.intent='recover';e.flowSign*=-1}}

  function setBallPossession(carrier){state.ball.owner=carrier?.player?.id||null;state.ball.currentOwner=carrier||null;state.ball.state=carrier?'HELD':'LOOSE';if(carrier){const hold=ballHoldPoint(carrier);state.ball.x=hold.x;state.ball.y=hold.y}}
  function startLooseBall(from,to,duration=.36,opts={}){state.pendingPass=null;state.carrier=null;state.possession=null;startFlight(from,to,duration,opts.arc??.018,()=>{const candidates=state.entities.map(e=>{const d=Math.hypot(e.x-state.ball.x,e.y-state.ball.y),speed=Math.max(.045,Math.hypot(e.vx,e.vy)+(e.maxSpeed||.18)*.45),eta=d/speed-(executionSkill(e.attributes,'reaction')-.86)*.18-(executionSkill(e.attributes,'catching')-.86)*.08+fairNoise();return {e,eta}}).sort((a,b)=>a.eta-b.eta);const winner=candidates[0]?.e;if(winner){winner.intent='receive';winner.tx=safeX(state.ball.x);winner.ty=safeY(state.ball.y);setPossession(winner.team,winner,winner.team===(opts.team||winner.team)?clamp(state.zone,.12,.88):.14)}},{kind:'loose',team:opts.team||null,context:opts.context||'loose'});state.entities.forEach(e=>{if(Math.hypot(e.x-to.x,e.y-to.y)<.30){e.intent='recover';e.tx=safeX(to.x+(e.x-to.x)*.05);e.ty=safeY(to.y+(e.y-to.y)*.05)}})}

  function setNormalFormation(){
    if(!state.carrier)return;
    refreshMovementTargets(true);
  }
  function setPossession(team,carrier,zone=.15){
    const previous=state.possession,changed=previous!==team;state.possession=team;state.carrier=carrier;state.zone=zone;state.passesSinceShot=0;state.lastPasser=null;state.ball.visible=true;state.pendingPass=null;setBallPossession(carrier);
    if(changed){state.possessionChangedAt=simNow();if(previous&&state.teamStats[previous])state.teamStats[previous].turnovers++;if(team&&previous&&state.teamStats[team])state.teamStats[team].counterattacks++;flowPossessionChanged(team,previous);updateTeamTacticalDirector(0,true)}setNormalFormation();
  }

  // All riding sprites face left in their source art.  Keep a separate attack/facing
  // direction so the visual orientation never gets accidentally tied to movement.
  // The Quaffle is anchored to the forward hand rather than the sprite centre.
  const ballHandOffsets = {
    jud:[.235,.105], nimbler:[.255,.095], bramble:[.275,.105],
    zizi:[.245,.115], rafi:[.255,.115], saffi:[.255,.115]
  };
  function spriteMetrics(e,height=null){
    height=height||playerSpriteHeight(e,false);
    const image=state.assets[e.player.id+'Riding'];
    if(!image)return {w:height,h:height};
    return {w:height*(image.width/image.height),h:height};
  }
  function ballHoldPoint(e,height=null){
    height=height||playerSpriteHeight(e,false);
    const m=spriteMetrics(e,height), off=ballHandOffsets[e.player.id]||[.25,.11];
    return {x:clamp(e.x+teamMeta[e.team].attack*(off[0]*m.w/W),.04,.96), y:clamp(e.y-(WORLD_CUP_AIR_LIFT_PX/H)+off[1]*m.h/H,.08,.92)};
  }

  function startFlight(from,to,duration=.72,arc=.06,onDone=null,meta=null){
    state.ball.flight={sx:from.x,sy:from.y,tx:to.x,ty:to.y,elapsed:0,duration,arc,onDone,meta};state.ball.x=from.x;state.ball.y=from.y;state.carrier=null;
  }
  function updateFlight(dt){
    const f=state.ball.flight;if(!f)return;
    f.elapsed+=dt;const t=clamp(f.elapsed/f.duration,0,1),e=ease(t);
    // Pass targets keep moving, so the ball leads the receiver rather than flying to a stale coordinate.
    if(f.meta?.kind==='kickoff'&&f.meta.receiver){f.tx=f.meta.receiver.x;f.ty=f.meta.receiver.y-.015}
    if(f.meta?.kind==='pass'&&f.meta.receiver){
      const lead=.10;f.tx=safeX(f.meta.receiver.x+f.meta.receiver.vx*lead);f.ty=safeY(f.meta.receiver.y+f.meta.receiver.vy*lead);
    }
    state.ball.x=lerp(f.sx,f.tx,e);state.ball.y=lerp(f.sy,f.ty,e)-Math.sin(Math.PI*t)*f.arc;
    if(f.meta?.kind==='pass'){
      const m=f.meta, ball=state.ball;
      m.receiver.intent='receive';m.receiver.tx=safeX(ball.x+m.receiver.vx*.12);m.receiver.ty=safeY(ball.y+m.receiver.vy*.12);
      for(const d of m.defenders){
        const remaining=Math.max(.08,f.duration-f.elapsed),predictX=safeX(ball.x+(f.tx-ball.x)*Math.min(.55,remaining/f.duration)),predictY=safeY(ball.y+(f.ty-ball.y)*Math.min(.55,remaining/f.duration));
        d.intent=d===m.challenger?'intercept':'cover';
        if(d===m.challenger){d.tx=predictX;d.ty=predictY;}
      }
      const d=m.challenger;
      if(d&&!m.resolved){
        const dx=d.x-ball.x,dy=d.y-ball.y,dist=Math.hypot(dx,dy),speed=Math.hypot(d.vx,d.vy);
        const closing=(d.vx*(-dx)+d.vy*(-dy))/(Math.max(.001,speed)*Math.max(.001,dist));
        const ia=d.attributes||{},challengeRadius=.020+.009*(ia.interception||.85),reactionGate=.11+.08*(1-(ia.reaction||.85));
        if(dist<challengeRadius && speed>.035 && closing>.15 && f.elapsed>reactionGate){
          m.resolved=true;state.ball.flight=null;state.pendingPass=null;d.x=clamp(d.x,FLIGHT.hardX0,FLIGHT.hardX1);d.y=clamp(d.y,FLIGHT.hardY0,lowerHardLimit(d));d.form=clamp((d.form||0)+.025,-.12,.12);m.from.form=clamp((m.from.form||0)-.012,-.12,.12);
          state.teamStats[d.team].interceptions++;state.playerStats[d.player.id].interceptions++;recordEvent('intercept',{player:d.player.name,team:d.team,from:m.from.player.name},3.2);audio.intercept();audio.crowdHit(.10);
          showBanner(`INTERCEPTION · ${d.player.name}`,'',1.4);eventLine('intercept',{pet:d.player.name,from:m.from.player.name},d.player,.18);
          setPossession(d.team,d,.16);scheduleNext(.7,1.35);return;
        }
      }
    }
    if(t>=1){state.ball.flight=null;const cb=f.onDone;if(cb)cb()}
  }

  function weightedPlayer(team,exclude=null){
    const pool=teamEntities(team).filter(e=>e!==exclude);return pool[Math.floor(state.simRand()*pool.length)]||teamEntities(team)[0];
  }
  function scheduleNext(min=1.0,max=1.9){state.actionTimer=min+state.simRand()*(max-min)}
  function performPass(){
    const from=state.carrier;if(!from){flowScheduleNext();return}const team=from.team,opp=other(team),dir=teamMeta[team].attack,choices=teamEntities(team).filter(e=>e!==from),passMode=flowPassMode(),tt=state.teamTactics?.[team];
    const ranked=choices.map(to=>{const defenders=teamEntities(opp),space=Math.min(...defenders.map(d=>dist2(to,d))),forward=(to.x-from.x)*dir,lateral=Math.abs(to.y-from.y),lane=passingLaneRisk(from,to,opp),laneMemory=tt?.memory?.lanePressure?.[to.player.id]||0,hot=tt?.memory?.hotPlayer===to.player.id?.018:0,risk=tt?.risk||.5;let flowFit=0;if(passMode==='forward')flowFit=forward*.34;else if(passMode==='recycle')flowFit=-forward*.36+lateral*.08;else if(passMode==='sideways')flowFit=lateral*.24-Math.abs(forward)*.20;else if(passMode==='switch')flowFit=lateral*.38-Math.abs(forward)*.08;return {to,score:forward*(.20+.10*risk)+flowFit+space*.54-lane*(.70-.12*risk)-laneMemory*.035+(from.attributes?.passing||.85)*.08+hot+(state.simRand()-.5)*.025}}).sort((a,b)=>b.score-a.score);
    const to=ranked[0]?.to||weightedPlayer(team,from);from.facing=to.x>=from.x?1:-1;from.dir=-from.facing;state.teamStats[team].passes++;state.playerStats[from.player.id].passes++;state.passesSinceShot++;
    const defenders=teamEntities(opp),passerA=from.attributes||{},receiverA=to.attributes||{},lead=.055+.055*(receiverA.anticipation||.85)+.018*(passerA.passing||.85);to.tx=safeX(to.x+dir*lead+to.vx*.20);to.ty=safeY(to.y+to.vy*.24+(state.simRand()-.5)*(.09-.035*(passerA.decision||.85)));
    const start=ballHoldPoint(from),target={x:to.tx,y:to.ty};const laneScore=d=>{const vx=target.x-start.x,vy=target.y-start.y,len2=vx*vx+vy*vy||.001,q=clamp(((d.x-start.x)*vx+(d.y-start.y)*vy)/len2,0,1),px=start.x+vx*q,py=start.y+vy*q;return Math.hypot(d.x-px,d.y-py)};
    const challenger=[...defenders].sort((a,b)=>laneScore(a)-laneScore(b))[0],distToLane=challenger?laneScore(challenger):1,ca=challenger?.attributes||{},readWindow=.155+.045*(ca.anticipation||.85),actionEdge=worldCupActionEdge(team),attemptChance=(.205+.165*(ca.interception||.85)+.105*(ca.anticipation||.85)-distToLane*1.25+(from.player.risk-1)*.048)*(1-actionEdge*.45),attempt=!!challenger&&distToLane<readWindow&&state.simRand()<clamp(attemptChance,.07,.57),passDist=Math.hypot(target.x-start.x,target.y-start.y),duration=clamp(.48+passDist*1.05,.54,.92);
    state.pendingPass={from,to,challenger:attempt?challenger:null};audio.shot();
    startFlight(start,target,duration,.032,()=>{
      if(attempt&&challenger){challenger.intent='recover';challenger.tx=safeX(lerp(challenger.x,opp==='belros'?.11:.89,.20));challenger.ty=safeY(challenger.y+(state.simRand()-.5)*.055)}
      const receiverGap=Math.hypot(to.x-state.ball.x,to.y-state.ball.y),nearestPress=Math.min(...teamEntities(opp).map(d=>dist2(d,to))),catchSkill=executionSkill(receiverA,'catching')*.55+executionSkill(receiverA,'anticipation')*.22+executionSkill(passerA,'passing')*.15-receiverGap*.75-clamp((.11-nearestPress)*.7,0,.12)+fairNoise(.018)+actionEdge*.055,mishandle=receiverGap>.045||state.simRand()>clamp(catchSkill,.62,.975);
      if(mishandle){audio.crowdHit(.07);showBanner(`LOOSE BALL · ${to.player.name}`,'',1.2);startLooseBall({x:state.ball.x,y:state.ball.y},{x:safeX(state.ball.x+to.vx*.18+(state.simRand()-.5)*.055),y:safeY(state.ball.y+to.vy*.18+(state.simRand()-.5)*.085)},.30,{team,fromEntity:to,context:'mishandle'});setFlowPhase(FLOW_PHASES.SCRAMBLE);flowScheduleNext(.55,1.0);return}
      state.pendingPass=null;state.teamStats[team].completed++;state.playerStats[from.player.id].completed++;if(state.teamTactics?.[team])state.teamTactics[team].memory.hotPlayer=to.player.id;const chain=state.passesSinceShot,assist=from,delta=passMode==='forward'?(.055+.040*state.simRand()):passMode==='recycle'?-(.025+.025*state.simRand()):passMode==='switch'?.012:(state.simRand()-.5)*.018;setPossession(team,to,clamp(state.zone+delta,.1,.94));state.passesSinceShot=chain;state.lastPasser=assist;if(state.matchFlow){state.matchFlow.actionIndex++;state.matchFlow.lastAction=`pass:${passMode}`;if(passMode==='switch')state.matchFlow.lastSwitchAt=state.matchTime||0}eventLine('pass',{from:from.player.name,to:to.player.name},to.player,.05);flowScheduleNext(.48,.88);
    },{kind:'pass',from,receiver:to,defenders,challenger:attempt?challenger:null,resolved:false,challengeAttempted:false});
  }
  function performDrive(){
    const e=state.carrier;if(!e){flowScheduleNext();return}const phase=state.matchFlow?.currentPhase,p=tacticalProfileForTeam(e.team),edge=worldCupActionEdge(e.team),baseStep=phase===FLOW_PHASES.COUNTER?.18:phase===FLOW_PHASES.ATTACKING?.12:phase===FLOW_PHASES.PROBING?.085:.055,step=baseStep*(1+edge*.55);state.zone=clamp(state.zone+step+step*.35*state.simRand(),.08,.97);e.tx=clamp(e.tx+teamMeta[e.team].attack*(.055+step*.28),.18,.82);const laneSpread=p.id==='WIDE'?.145:p.id==='COMPACT'?.095:.12;e.ty=safeY(e.y+(state.simRand()-.5)*(phase===FLOW_PHASES.COUNTER?.08:laneSpread));if(state.matchFlow){state.matchFlow.actionIndex++;state.matchFlow.lastAction='carry'}eventLine('drive',{pet:e.player.name},e.player,.08);setNormalFormation();flowScheduleNext(.46,.84);
  }

  const hoops={
    belros:[{x:.882,y:.529},{x:.902,y:.467},{x:.923,y:.529}],
    zafran:[{x:.077,y:.529},{x:.098,y:.467},{x:.118,y:.529}]
  };
  function openPlayShotAllowed(shooter){
    if(!shooter)return false;const tacticalProgress=clamp(Number(state.zone)||.15,.08,.97),fieldProgress=clamp(shooter.team==='belros'?Number(shooter.x||0):(1-Number(shooter.x||0)),0,1),phase=state.matchFlow?.currentPhase,chain=Math.max(0,Number(state.passesSinceShot)||0),defenders=teamEntities(other(shooter.team)),pressure=defenders.length?Math.min(...defenders.map(d=>dist2(shooter,d))):1,fastCounter=phase===FLOW_PHASES.COUNTER&&(state.matchFlow?.possessionElapsed||0)<3.2,deepChance=tacticalProgress>=.78&&fieldProgress>=.66;
    if(tacticalProgress<.60||fieldProgress<.53)return false;if(!deepChance&&tacticalProgress<.70&&fieldProgress<.59)return false;if(!deepChance&&chain<(fastCounter?1:2))return false;if(!deepChance&&pressure<.070)return false;return true;
  }
  function chooseShotOutcome(shooter,penalty=false){
    const a=shooter.attributes||{},speed=Math.hypot(shooter.vx,shooter.vy),defenders=teamEntities(other(shooter.team)),pressure=defenders.length?Math.min(...defenders.map(d=>dist2(shooter,d))):1,shooting=executionSkill(a,'shooting'),composure=executionSkill(a,'composure'),attackProgress=clamp(Number(state.zone)||.15,.08,.97),pressurePenalty=clamp((.16-pressure)*.72,0,.10),distancePenalty=clamp((.82-attackProgress)*.125,0,.045),motionPenalty=clamp(speed-.13,0,.08)*.22,round16Boost=round16RepoSportsBoost(shooter.team);
    if(penalty){const quality=.58+.16*shooting+.08*composure+(shooter.form||0)*.55+fairNoise(.018),goalP=clamp(clamp(quality,.61,.82)*round16Boost,.61,.88),r=state.simRand();return r<goalP?'goal':r<.88?'save':r<.95?'post':'miss'}
    // World Cup keeps Club Mode's finishing model but deliberately removes Club's
    // role finishing modifier: attacker/defender/support have equal long-run scoring opportunity.
    // During the opening Round of 16 only, current/main RepoSports nations receive
    // the requested 10% finishing edge; it is automatically absent in later rounds.
    const quality=.065*shooting+.040*composure+(shooter.form||0)*.10+fairNoise(.014),baseGoalP=clamp(.155+state.zone*.14+quality-pressurePenalty-distancePenalty-motionPenalty,.145,.415),goalP=clamp(baseGoalP*round16Boost,.145,.457),saveP=clamp(.267+pressurePenalty*.55,.230,.345),postP=.13,r=state.simRand();return r<goalP?'goal':r<goalP+saveP?'save':r<goalP+saveP+postP?'post':'miss';
  }

  function performShot(opts={}){
    const shooter=opts.shooter||state.carrier;if(!shooter)return;
    const setPiece=!!opts.setPiece;
    if(!opts.penalty&&!setPiece&&!openPlayShotAllowed(shooter)){const nearest=teamEntities(other(shooter.team)).slice().sort((a,b)=>dist2(a,shooter)-dist2(b,shooter))[0],pressured=nearest&&dist2(nearest,shooter)<.10;if(pressured||state.passesSinceShot<2)performPass();else performDrive();return}
    const team=opts.team||shooter.team,opp=other(team),penalty=!!opts.penalty,shootout=!!opts.shootout;
    state.teamStats[team].shots++;state.playerStats[shooter.player.id].shots++;
    const hoop=hoops[team][Math.floor(state.simRand()*3)],outcome=chooseShotOutcome(shooter,penalty);
    let target={x:hoop.x,y:hoop.y};
    if(outcome==='goal'||outcome==='save'){target={x:hoop.x+(state.simRand()-.5)*.010,y:hoop.y+(state.simRand()-.5)*.015};state.teamStats[team].onTarget++}
    else if(outcome==='post'){const side=state.simRand()<.5?-1:1;target={x:hoop.x+side*.013,y:hoop.y+(state.simRand()-.5)*.023}}
    else {target={x:hoop.x+(state.simRand()-.5)*.065,y:hoop.y+(state.simRand()-.5)*.11}}
    state.camera.tx=team==='belros'?.54:.46;state.camera.ty=.52;state.camera.tz=1.065;
    audio.shot();audio.crowdHit(.09);eventLine('shot',{pet:shooter.player.name},shooter.player,.12);showBanner(penalty?`PENALTY · ${shooter.player.name}`:`SHOT · ${shooter.player.name}`,'',1.15);
    const from=ballHoldPoint(shooter);
    startFlight(from,target,penalty?.86:.68,penalty?.055:.075,()=>handleShotResult({team,opp,shooter,outcome,hoop,target,penalty,shootout}),{kind:'shot',shooter,team,target});
  }

  function handleShotResult(info){
    const {team,opp,shooter,outcome,hoop,penalty,shootout}=info;
    if(outcome==='goal'){
      if(shootout){resolveShootoutPenalty(team,true,shooter);return}
      state.score[team]++;state.playerStats[shooter.player.id].goals++;recordEvent('goal',{player:shooter.player.name,team},6.0);const assister=(state.lastPasser&&state.lastPasser.team===team)?state.lastPasser:null;if(assister)state.playerStats[assister.player.id].assists++;
      state.replayBuffer.push(worldCupReplaySnapshot());if(state.replayBuffer.length>REPLAY_MAX_FRAMES)state.replayBuffer.shift();const replayFrames=state.replayBuffer.slice(-58);
      audio.ensure();audio.play(audio.goal,.70);audio.crowdHit(.52);state.camera.shake=.012;
      const score=`${state.score.belros}-${state.score.zafran}`,late=state.matchTime>15*60,equal=state.score.belros===state.score.zafran,goAhead=Math.abs(state.score.belros-state.score.zafran)===1;const flavour=late?(equal?'LATE EQUALISER!':'DRAMA!'):equal?'ALL SQUARE!':goAhead?'GO-AHEAD GOAL!':'GOAL!';showBanner(`${flavour} · ${shooter.player.name} · ${score}`,'',2.4);eventLine('goal',{pet:shooter.player.name,team:teamMeta[team].name,score},shooter.player,.24);
      const hatTrickPending=state.playerStats[shooter.player.id].goals===3;
      const varCheck=!penalty&&state.simRand()<.12;if(hatTrickPending&&!varCheck)triggerWorldCupBigMoment('hattrick',shooter.player,team);
      beginWorldCupGoalCelebration(team,shooter,opp,{
        replayFrames,
        hatTrickPending,
        varContext:varCheck?{kind:'goal',team,shooter,assister,replayFrames,hatTrickPending}:null
      });
      void sendAuthoritativeSnapshot(true);
    }else if(outcome==='save'){
      const defender=rolePlayer(opp,'defender');state.playerStats[defender.player.id].saves++;recordEvent('save',{player:defender.player.name,team:opp},3.7);defender.tx=info.hoop.x+(team==='belros'?-.025:.025);defender.ty=info.hoop.y;audio.crowdHit(.13);showBanner(`SAVE · ${defender.player.name}`,'',1.6);eventLine('save',{pet:shooter.player.name,defender:defender.player.name},defender.player,.10);
      if(shootout){resolveShootoutPenalty(team,false,shooter);return}
      setPossession(opp,defender,.12);scheduleNext(.75,1.4);
    }else if(outcome==='post'){
      audio.rebound();audio.crowdHit(.18);state.camera.shake=.007;recordEvent('post',{player:shooter.player.name,team},4.2);showBanner('OFF THE RING!','danger',1.5);eventLine('post',{pet:shooter.player.name},shooter.player,.08);
      if(shootout){resolveShootoutPenalty(team,false,shooter);return}
      const reboundTeam=state.simRand()<.5?team:opp,rebounder=weightedPlayer(reboundTeam);state.teamStats[reboundTeam].rebounds++;state.playerStats[rebounder.player.id].rebounds++;recordEvent('rebound',{player:rebounder.player.name,team:reboundTeam},2.1);const rx=clamp(info.hoop.x+(team==='belros'?-.10:.10)+(state.simRand()-.5)*.055,.15,.85),ry=clamp(info.hoop.y+(state.simRand()-.5)*.16,.32,.72);
      startFlight(info.target,{x:rx,y:ry},.52,-.035,()=>{rebounder.tx=rx;rebounder.ty=ry;eventLine('rebound',{pet:rebounder.player.name},rebounder.player,.08);setPossession(reboundTeam,rebounder,reboundTeam===team?clamp(state.zone-.12,.15,.8):.14);scheduleNext(.7,1.35)});
    }else{
      audio.crowdHit(.06);showBanner(`MISS · ${shooter.player.name}`,'',1.25);eventLine('miss',{pet:shooter.player.name},shooter.player,.07);
      if(shootout){resolveShootoutPenalty(team,false,shooter);return}
      const defender=rolePlayer(opp,'defender');setPossession(opp,defender,.12);scheduleNext(.75,1.4);
    }
  }
  function restartAfterScore(team){
    const restartTeam=team,receivingTeam=teamEntities(restartTeam),carrier=receivingTeam[Math.floor(state.simRand()*Math.max(1,receivingTeam.length))]||receivingTeam[0];if(!carrier){scheduleNext(.65,.95);return}
    receivingTeam.forEach((e,i)=>{e.tx=restartTeam==='belros'?.455:.545;e.ty=safeY(.405+i*.115);e.intent='restart-ready'});teamEntities(other(restartTeam)).forEach((e,i)=>{e.tx=restartTeam==='belros'?.60:.40;e.ty=safeY(.405+i*.115);e.intent='restart-shape'});
    state.possession=restartTeam;state.carrier=null;state.kickoffReceiver=carrier;state.zone=.12;state.passesSinceShot=0;state.lastPasser=null;state.pendingPass=null;state.ball.visible=true;state.ball.flight=null;state.ball.owner=null;state.ball.state='IN_FLIGHT';state.ball.x=.5;state.ball.y=.535;carrier.intent='receive';carrier.tx=safeX(.5+(restartTeam==='belros'?-.028:.028));carrier.ty=safeY(.565);state.camera.tx=.5;state.camera.ty=.5;state.camera.tz=1.015;audio.ensure();audio.play(audio.whistle,.48);showBanner(`${teamMeta[restartTeam].name} RESTART`,'',1.05);startFlight({x:.5,y:.535},{x:carrier.tx,y:carrier.ty},.62,-.025,()=>{state.kickoffReceiver=null;setPossession(restartTeam,carrier,.12);scheduleNext(.72,1.18)},{kind:'kickoff',receiver:carrier,afterGoal:true});
  }
  function setPieceSpotFor(victim){
    return {x:safeX(victim?.x??state.carrier?.x??.5),y:safeY(victim?.y??state.carrier?.y??.52)};
  }
  function stageFreeKickPositions(team,taker,spot){
    const dir=teamMeta[team].attack,attackers=teamEntities(team),defenders=teamEntities(other(team));
    taker.tx=spot.x;taker.ty=spot.y;taker.intent='free-kick-taker';
    attackers.filter(e=>e!==taker).forEach((e,i)=>{
      e.tx=safeX(spot.x+dir*(i===0?.055:-.060));
      e.ty=safeY(spot.y+(i===0?-.115:.095));
      e.intent=i===0?'set-piece-runner':'set-piece-support';
    });
    defenders.forEach((e,i)=>{
      const wallDepth=.135+.018*i;
      e.tx=safeX(spot.x+dir*wallDepth);
      e.ty=safeY(spot.y+(i-1)*.082);
      e.intent='set-piece-defend';
    });
    state.ref.tx=safeX(spot.x-dir*.045);state.ref.ty=safeY(spot.y-.105);
  }
  function startFreeKick(team,victim,spotOverride=null){
    const players=teamEntities(team),taker=(victim&&victim.team===team?victim:null)||players.find(e=>e.player.role==='support')||players[0];if(!taker){scheduleNext(.55,.85);return}
    const spot=spotOverride?{x:safeX(spotOverride.x),y:safeY(spotOverride.y)}:setPieceSpotFor(victim||taker),executeAt=2.55+state.simRand()*.75;
    state.special={type:'freeKick',elapsed:0,team,taker,takerId:taker.player.id,victim:victim||taker,victimId:(victim||taker).player.id,spot,executeAt,taken:false};
    state.possession=team;state.carrier=taker;state.pendingPass=null;state.ball.visible=true;state.ball.flight=null;state.passesSinceShot=0;state.lastPasser=null;setBallPossession(taker);
    stageFreeKickPositions(team,taker,spot);
    state.camera.tx=clamp(lerp(.5,spot.x,.34),.44,.56);state.camera.ty=clamp(lerp(.52,spot.y,.18),.49,.57);state.camera.tz=1.035;
    audio.ensure();audio.play(audio.whistle,.42);showBanner(`FREE KICK · ${teamMeta[team].name}`,'',1.7);
    say(`${teamMeta[other(team)].name} are being marched back by ${WORLD_CUP_REFEREE_NAME}. ${teamMeta[team].name} will take a moment over this free kick.`,{priority:6,intensity:'interested'});
  }
  function updateFreeKick(dt){
    const s=state.special;if(!s||s.type!=='freeKick')return;s.elapsed+=dt;
    const taker=s.taker||entityById(s.takerId);if(!taker){state.special=null;scheduleNext(.55,.9);return}
    stageFreeKickPositions(s.team,taker,s.spot||setPieceSpotFor(taker));
    if(s.elapsed>=Math.max(.7,s.executeAt-.48))s.windup=true;
    if(s.windup){const u=clamp((s.elapsed-(s.executeAt-.48))/.48,0,1);taker.tx=safeX(taker.tx+teamMeta[s.team].attack*.026*u);taker.intent='free-kick-windup'}
    if(s.elapsed<s.executeAt||s.taken)return;
    s.taken=true;
    const team=s.team,dir=teamMeta[team].attack,fieldProgress=clamp(team==='belros'?taker.x:1-taker.x,0,1),closeEnough=(state.zone>=.68&&fieldProgress>=.60);
    const shotChance=closeEnough?clamp(.34+(state.zone-.68)*.85,.34,.62):0;
    state.special=null;state.carrier=taker;state.possession=team;setBallPossession(taker);
    if(closeEnough&&state.simRand()<shotChance){
      showBanner(`FREE KICK SHOT · ${taker.player.name}`,'',1.25);
      performShot({shooter:taker,team,setPiece:true});
    }else{
      const teammate=teamEntities(team).filter(e=>e!==taker).slice().sort((a,b)=>Math.hypot(a.x-taker.x,a.y-taker.y)-Math.hypot(b.x-taker.x,b.y-taker.y))[0];
      if(teammate){teammate.tx=safeX(teammate.x+dir*.035);teammate.ty=safeY(teammate.y)}
      performPass();
    }
  }

  function brawlParticipantIds(offender,victim){
    const ids=[victim?.player?.id,offender?.player?.id];
    for(const team of [victim?.team,offender?.team]){
      const extras=teamEntities(team).filter(e=>e!==victim&&e!==offender).sort((a,b)=>dist2(a,victim)-dist2(b,victim));
      for(const e of extras)ids.push(e.player.id);
    }
    return [...new Set(ids.filter(Boolean))];
  }
  function brawlGroundTarget(s,e,index){
    const victimId=s.victim?.player?.id||s.victimId,offenderId=s.offender?.player?.id||s.offenderId,cx=s.centerX||.5,gy=s.centerY||.685;
    if(e.player.id===victimId)return {x:safeX(cx-.022),y:gy};
    if(e.player.id===offenderId)return {x:safeX(cx+.022),y:gy};
    const side=e.team===s.team?-1:1,slot=Math.max(0,index);
    return {x:safeX(cx+side*(.080+.024*(slot%2))),y:clamp(gy+(slot%2===0?-.028:.018),.64,.72)};
  }
  function startBrawl(offender,victim,next){
    const participantIds=brawlParticipantIds(offender,victim),centerX=safeX((offender.x+victim.x)/2),centerY=.685;
    state.special={type:'brawl',elapsed:0,duration:4.9,standingAt:.82,mountAt:3.85,team:victim.team,offender,victim,offenderId:offender.player.id,victimId:victim.player.id,participantIds,centerX,centerY,next};
    state.ball.visible=true;state.ball.flight=null;state.carrier=victim;state.possession=victim.team;setBallPossession(victim);
    participantIds.map(entityById).filter(Boolean).forEach((e,i)=>{const t=brawlGroundTarget(state.special,e,i);e.tx=t.x;e.ty=t.y;e.intent='incident-descend'});
    state.ref.tx=centerX;state.ref.ty=centerY;
    state.camera.tx=clamp(lerp(.5,centerX,.48),.43,.57);state.camera.ty=.60;state.camera.tz=1.060;
    recordEvent('brawl',{victim:victim.player.name,offender:offender.player.name,team:victim.team},1.6);audio.crowdHit(.24);showBanner(`TEMPERS FLARE · ${victim.player.name} & ${offender.player.name}`,'danger',2.25);
    say(`Tempers flare between ${victim.player.name} and ${offender.player.name}. ${WORLD_CUP_REFEREE_NAME} is straight in, and the teammates are trying to separate them.`,{priority:8,intensity:'shocked',force:true});
  }
  function finishBrawl(s){
    const next=s.next||{},victim=entityById(s.victimId)||s.victim,offender=entityById(s.offenderId)||s.offender;
    state.special=null;
    if(next.kind==='var')startVar({kind:'foul',team:next.team,offender,victim,spot:next.spot,possiblePenalty:true,replayFrames:next.replayFrames||state.replayBuffer.slice(-46)});
    else if(next.kind==='penalty')startPenalty(next.team,false);
    else startFreeKick(next.team||victim?.team,victim,next.spot);
  }
  function updateBrawl(dt){
    const s=state.special;if(!s||s.type!=='brawl')return;s.elapsed+=dt;
    const participants=(s.participantIds||[]).map(entityById).filter(Boolean),standing=s.elapsed>=s.standingAt&&s.elapsed<s.mountAt;
    participants.forEach((e,i)=>{
      const t=brawlGroundTarget(s,e,i),isVictim=e.player.id===s.victimId,isOffender=e.player.id===s.offenderId;
      let shove=0;
      if(standing&&s.elapsed<2.75&&(isVictim||isOffender)){
        const pulse=Math.sin((s.elapsed-s.standingAt)*10.5);
        shove=(isVictim?1:-1)*pulse*.006;
      }
      if(s.elapsed>=2.65&&s.elapsed<s.mountAt){
        const refGap=isVictim?-.040:(isOffender ? .040 : 0);
        e.tx=safeX(t.x+refGap+shove);e.ty=t.y;e.intent=(isVictim||isOffender)?'incident-separated':'break-up';
      }else if(s.elapsed>=s.mountAt){
        e.tx=safeX(t.x+(e.team===s.team?-.055:.055));e.ty=safeY(.58+(i%2)*.025);e.intent='incident-remount';
      }else{
        e.tx=safeX(t.x+shove);e.ty=t.y;e.intent=standing?'incident-standing':'incident-descend';
      }
    });
    if(s.elapsed>=2.55&&!s.breakWhistle){s.breakWhistle=true;audio.ensure();audio.play(audio.whistle,.58);showBanner(`${WORLD_CUP_REFEREE_NAME} STEPS IN`,'',1.35)}
    if(s.elapsed<2.6){state.ref.tx=safeX(s.centerX);state.ref.ty=s.centerY}
    else if(s.elapsed<s.mountAt){state.ref.tx=safeX(s.centerX);state.ref.ty=s.centerY;state.ref.dir=1}
    else{state.ref.tx=safeX(s.centerX);state.ref.ty=safeY(.55)}
    if(s.elapsed>=s.duration)finishBrawl(s);
  }

  function performFoul(offender=null){
    const victim=state.carrier;if(!victim){scheduleNext();return}offender=offender||teamEntities(other(victim.team)).slice().sort((a,b)=>dist2(a,victim)-dist2(b,victim))[0];if(!offender||dist2(offender,victim)>.13){scheduleNext(.45,.8);return}
    state.teamStats[offender.team].fouls++;state.playerStats[offender.player.id].fouls++;recordEvent('foul',{player:offender.player.name,team:offender.team,victim:victim.player.name},2.4);offender.form=clamp((offender.form||0)-.018,-.12,.12);offender.tx=victim.x;offender.ty=victim.y;state.ref.tx=clamp(victim.x+.025,.2,.8);state.ref.ty=safeY(victim.y-.08);audio.ensure();audio.play(audio.whistle,.62);audio.crowdHit(.15);state.camera.shake=.008;showBanner(`FOUL · ${offender.player.name}`,'danger',1.8);eventLine('foul',{offender:offender.player.name,victim:victim.player.name},offender.player,.08);
    const foulSpot={x:victim.x,y:victim.y},inDanger=state.zone>.60,possiblePenalty=inDanger&&state.simRand()<.62;
    const next=possiblePenalty&&state.simRand()<.30?{kind:'var',team:victim.team,spot:foulSpot,replayFrames:state.replayBuffer.slice(-46)}:possiblePenalty?{kind:'penalty',team:victim.team,spot:foulSpot}:{kind:'freeKick',team:victim.team,spot:foulSpot};
    const a1=offender.attributes?.aggression||.8,a2=victim.attributes?.aggression||.8,flareChance=clamp(.045+Math.max(a1,a2)*.028,.045,.075);
    if(state.simRand()<flareChance){startBrawl(offender,victim,next);return}
    state.entities.forEach(e=>{e.tx=e.x;e.ty=e.y;e.intent='stoppage'});
    if(next.kind==='var')state.delay={t:1.55,reason:'foul-stoppage',cb:()=>startVar({kind:'foul',team:victim.team,offender,victim,spot:next.spot,possiblePenalty:true,replayFrames:next.replayFrames})};
    else if(next.kind==='penalty')state.delay={t:1.50,reason:'foul-stoppage',cb:()=>startPenalty(victim.team,false)};
    else state.delay={t:1.45,reason:'foul-stoppage',cb:()=>startFreeKick(victim.team,victim,next.spot)};
  }

  function startVar(ctx){
    if(state.special)return;if(ctx?.replayFrames?.length&&!ctx.replayShown){const next={...ctx,replayShown:true};if(beginWorldCupReplay('VAR REVIEW',ctx.replayFrames,{frames:48,duration:3.15,slow:.50,introDuration:.78,onDone:()=>startVar(next)}))return}
    recordEvent('var',{team:ctx.team,kind:ctx.kind},4.0);state.special={type:'var',elapsed:0,duration:4.8,ctx,decisionShown:false};state.varContext=ctx;state.teamStats[ctx.team].var++;state.camera.tx=ctx.kind==='goal'?(ctx.team==='belros'?.54:.46):clamp(((ctx.spot?.x??ctx.victim?.x??.5)-.5),-.04,.04)+.5;state.camera.ty=ctx.spot?.y??ctx.victim?.y??.52;state.camera.tz=1.075;state.ref.tx=ctx.spot?.x??ctx.victim?.x??((ctx.team==='belros')?.84:.16);state.ref.ty=ctx.spot?.y??ctx.victim?.y??.54;
    if(ctx.kind==='goal')ctx.decision=state.simRand()<.16?'NO GOAL':'GOAL CONFIRMED';else ctx.decision=state.simRand()<.66?'PENALTY':'NO FOUL';
    $('wcgVar').classList.add('is-open');$('wcgVar').classList.remove('is-decision');$('wcgVarTitle').textContent='VAR CHECK';$('wcgVarText').textContent=ctx.kind==='goal'?'Checking the scoring phase…':'Reviewing the contact in the goal area…';audio.varTone();showBanner('VAR CHECK','var',2.2);say(formatLine('var'));
  }
  function updateVar(dt){
    const s=state.special;if(!s||s.type!=='var')return;s.elapsed+=dt;
    if(s.elapsed>2.45&&!s.decisionShown){s.decisionShown=true;$('wcgVar').classList.add('is-decision');$('wcgVarTitle').textContent=s.ctx.decision;$('wcgVarText').textContent=s.ctx.decision==='NO GOAL'?'The goal is overturned.':s.ctx.decision==='GOAL CONFIRMED'?'The goal stands.':s.ctx.decision==='PENALTY'?'Contact upgraded to a penalty.':'No punishable foul found.';audio.varTone();showBanner(s.ctx.decision,s.ctx.decision==='NO GOAL'?'danger':'var',2.0)}
    if(s.elapsed>=s.duration){const ctx=s.ctx;$('wcgVar').classList.remove('is-open','is-decision');state.special=null;state.camera.tx=.5;state.camera.ty=.5;state.camera.tz=1.02;
      if(ctx.kind==='goal'){
        if(ctx.decision==='NO GOAL'){state.score[ctx.team]=Math.max(0,state.score[ctx.team]-1);state.playerStats[ctx.shooter.player.id].goals=Math.max(0,state.playerStats[ctx.shooter.player.id].goals-1);if(ctx.assister)state.playerStats[ctx.assister.player.id].assists=Math.max(0,state.playerStats[ctx.assister.player.id].assists-1);showBanner('GOAL OVERTURNED','danger',2.0);say(`VAR overturns it. ${ctx.shooter.player.name}'s finish is wiped away and ${teamMeta[other(ctx.team)].name} restart.`);restartAfterScore(other(ctx.team));}
        else {if(ctx.hatTrickPending&&state.playerStats[ctx.shooter.player.id].goals===3)triggerWorldCupBigMoment('hattrick',ctx.shooter.player,ctx.team);say(`Decision confirmed. ${ctx.shooter.player.name}'s goal stands.`,{priority:9,intensity:'goal',force:true});restartAfterScore(other(ctx.team));}
      } else {
        if(ctx.decision==='PENALTY'){say(`The review is complete: penalty to ${teamMeta[ctx.team].name}.`);startPenalty(ctx.team,false)}
        else {say('No penalty after review. The referee restarts play.');setPossession(ctx.team,ctx.victim,.38);scheduleNext(.75,1.4)}
      }
    }
  }
  function stagePenaltyPositions(team,shooter){
    const dir=teamMeta[team].attack,opp=other(team),shooterX=team==='belros'?.72:.28,keeper=rolePlayer(opp,'defender'),goalX=team==='belros'?.865:.135;
    shooter.tx=shooterX;shooter.ty=safeY(.52);shooter.intent='penalty-taker';
    teamEntities(team).filter(e=>e!==shooter).forEach((e,i)=>{e.tx=safeX(shooterX-dir*(.145+.025*i));e.ty=safeY(i===0?.405:.635);e.intent='penalty-wait'});
    const defending=teamEntities(opp),keeperIndex=defending.indexOf(keeper);
    defending.forEach((e,i)=>{
      if(e===keeper){e.tx=goalX;e.ty=safeY(.505);e.intent='penalty-keeper'}
      else{const j=i-(keeperIndex<i?1:0);e.tx=safeX(shooterX-dir*(.185+.025*Math.max(0,j)));e.ty=safeY(j%2===0?.430:.610);e.intent='penalty-retreat'}
    });
    state.ref.tx=safeX(shooterX-dir*.070);state.ref.ty=safeY(.405);
  }
  function startPenalty(team,shootout=false){
    if(!shootout)state.teamStats[team].penalties++;const players=teamEntities(team),shooter=shootout&&state.shootout?players[(state.shootout.attempts[team]||0)%Math.max(1,players.length)]:(players.find(e=>e.player.role==='attacker')||players[0]);const executeAt=shootout?2.45+state.simRand()*.40:2.75+state.simRand()*.65;
    state.special={type:'penalty',elapsed:0,team,shooter,shooterId:shooter.player.id,shootout,shot:false,executeAt};if(!shootout)triggerWorldCupBigMoment('penalty',shooter.player,team);
    state.possession=team;state.carrier=shooter;state.pendingPass=null;state.ball.visible=true;state.ball.flight=null;setBallPossession(shooter);stagePenaltyPositions(team,shooter);
    state.camera.tx=team==='belros'?.535:.465;state.camera.ty=.52;state.camera.tz=1.06;showBanner(shootout?'SHOOTOUT PENALTY':`PENALTY · ${teamMeta[team].name}`,'danger',2.0);eventLine('penalty',{team:teamMeta[team].name,pet:shooter.player.name},shooter.player,.06);audio.ensure();audio.play(audio.whistle,.55);
    if(!shootout)say(`${WORLD_CUP_REFEREE_NAME} clears everyone back. ${shooter.player.name} has a few seconds to compose the penalty.`,{priority:7,intensity:'interested'});
  }
  function updatePenalty(dt){
    const s=state.special;if(!s||s.type!=='penalty')return;s.elapsed+=dt;const shooter=s.shooter||entityById(s.shooterId);if(!shooter){state.special=null;return}
    stagePenaltyPositions(s.team,shooter);
    if(s.elapsed>=Math.max(.8,s.executeAt-.52))s.windup=true;
    if(s.windup){const u=clamp((s.elapsed-(s.executeAt-.52))/.52,0,1);shooter.tx=safeX(shooter.tx+teamMeta[s.team].attack*.030*u);shooter.intent='penalty-windup'}
    if(s.elapsed>=s.executeAt&&!s.shot){s.shot=true;const team=s.team,shootout=s.shootout;state.special=null;state.carrier=shooter;state.possession=team;setBallPossession(shooter);performShot({shooter,team,penalty:true,shootout});}
  }
  function attemptCarrierTackle(defender,carrier){
    if(!defender||!carrier||defender.team===carrier.team||state.ball.flight||state.special||state.delay)return false;const gap=dist2(defender,carrier);if(gap>.103)return false;const rvx=(defender.vx||0)-(carrier.vx||0),rvy=(defender.vy||0)-(carrier.vy||0),dx=carrier.x-defender.x,dy=carrier.y-defender.y,rel=Math.hypot(rvx,rvy),d=Math.max(.001,Math.hypot(dx,dy)),closing=rel>.001?clamp((rvx*dx+rvy*dy)/(rel*d),-1,1):0,defEdge=worldCupActionEdge(defender.team),attemptP=clamp((.235+(.103-gap)*2.95+Math.max(0,closing)*.130)*(1+defEdge*.22),.18,.59);if(state.simRand()>=attemptP)return false;state.teamStats[defender.team].tacklesAttempted++;state.playerStats[defender.player.id].tacklesAttempted++;defender.intent='tackle';defender.tx=safeX(lerp(defender.x,carrier.x,.82));defender.ty=safeY(lerp(defender.y,carrier.y,.82));const successP=clamp((.285+(.075-gap)*3.70+Math.max(0,closing)*.110)*(1+defEdge*.30),.21,.61);if(gap<.078&&state.simRand()<successP){const newTeam=defender.team;state.teamStats[newTeam].tacklesWon++;state.playerStats[defender.player.id].tacklesWon++;state.teamStats[newTeam].interceptions++;state.playerStats[defender.player.id].interceptions++;recordEvent('intercept',{player:defender.player.name,team:newTeam,from:carrier.player.name,tackle:true},3.0);audio.intercept();audio.crowdHit(.11);showBanner(`TACKLE · ${defender.player.name}`,'',1.35);eventLine('intercept',{pet:defender.player.name,from:carrier.player.name},defender.player,.16);setFlowPhase(FLOW_PHASES.TURNOVER);noteFlowMajor('tackle');setPossession(newTeam,defender,.16);scheduleNext(.58,1.05);return true}defender.intent='recover';defender.tx=safeX(defender.x-teamMeta[defender.team].attack*.025);defender.ty=safeY(defender.y+(defender.flowSign||1)*.035);return false;
  }
  function nextAction(){
    if(state.phase!=='first'&&state.phase!=='second')return;if(state.special||state.delay||state.ball.flight)return;if(!state.carrier){if(state.possession)setPossession(state.possession,weightedPlayer(state.possession),.15);else{flowScheduleNext(.35,.65);return}}updateMatchFlowDirector(0);updateTeamTacticalDirector(0,true);
    const carrier=state.carrier,team=carrier.team,tt=state.teamTactics?.[team]||{risk:.5},nearestDef=teamEntities(other(team)).slice().sort((a,b)=>dist2(a,carrier)-dist2(b,carrier))[0],contact=nearestDef?dist2(nearestDef,carrier):1,aggr=nearestDef?.attributes?.aggression||.7;if(nearestDef&&attemptCarrierTackle(nearestDef,carrier))return;const defenderEdge=nearestDef?worldCupCompetitiveBalanceEdge(nearestDef.team):0,foulChance=contact<.09?clamp((.012+(aggr-.65)*.09+Math.max(0,.05-contact)*.8)*(1-Math.max(0,defenderEdge)*.45),.004,.075):0;if(foulChance&&state.simRand()<foulChance){setFlowPhase(FLOW_PHASES.STOPPAGE);noteFlowMajor('foul');performFoul(nearestDef);return}
    const flow=flowActionWeights(),phase=state.matchFlow?.currentPhase,actionEdge=worldCupActionEdge(team);let shotW=flow.shot*(1+actionEdge*.75),driveW=flow.drive*(1+actionEdge*.45),passW=flow.pass*(1-actionEdge*.30),profile=tt.profile||tacticalProfileForTeam(team),adjustment=tt.adjustment||tacticalAdjustmentForTeam(team),buildBias=clamp((profile.passBias||0)+(adjustment.passBias||0),-.035,.035);passW=Math.max(.05,passW+buildBias);driveW=Math.max(.05,driveW-buildBias);const shotReady=openPlayShotAllowed(carrier);if(!shotReady){shotW=0;const early=state.zone<.55;passW+=early?.10:.075;driveW+=early?.075:.055}else if(phase===FLOW_PHASES.FINAL_THIRD)shotW+=Math.min(.11,state.passesSinceShot*.026);
    const chain=state.passesSinceShot||0,fastCounter=phase===FLOW_PHASES.COUNTER&&(state.matchFlow?.possessionElapsed||0)<2.4;if(chain===0){shotW*=fastCounter?.82:.64;passW+=fastCounter?.025:.070;driveW+=fastCounter?.015:.020}else if(chain===1){shotW*=fastCounter?.92:.82;passW+=fastCounter?.012:.034;driveW+=.012}if(state.zone>=.40&&state.passesSinceShot>=2){const extra=Math.min(4,state.passesSinceShot-1);shotW+=extra*.024;driveW+=extra*.022;passW*=Math.max(.50,1-extra*.085)}if(state.passesSinceShot>=4){shotW+=.045;driveW+=.030;passW*=.74}if(state.passesSinceShot>=6){shotW+=.040;passW*=.70}if(contact<.07){passW+=.025;driveW=Math.max(.08,driveW-.005)}
    const total=shotW+driveW+passW,r=state.simRand()*total;if(state.matchFlow)state.matchFlow.actionIndex++;if(r<shotW){performShot({shooter:carrier});return}if(r<shotW+driveW){performDrive();return}performPass();
  }

  function updateKickoffRace(dt){
    const s=state.special;if(!s||s.type!=='kickoffRace')return;s.elapsed+=dt;
    const winner=s.winner,challenger=s.challenger,winnerHome=s.team==='belros';
    if(winner){winner.tx=winnerHome?.498:.502;winner.ty=.535;winner.intent='kickoff-race'}
    if(challenger){challenger.tx=winnerHome?.535:.465;challenger.ty=.538;challenger.intent='kickoff-race'}
    for(const e of state.entities){if(e===winner||e===challenger)continue;const t=kickoffReadyTarget(e);e.tx=lerp(t.x,.5,.10);e.ty=t.y;e.intent='kickoff-support'}
    state.ref.tx=.5;state.ref.ty=.645;state.ball.x=.5;state.ball.y=.535;state.ball.visible=true;
    if(s.elapsed>=s.duration){
      state.special=null;state.kickoffReceiver=null;state.ball.x=winner?.x||.5;state.ball.y=winner?.y||.535;
      setPossession(s.team,winner,.12);showBanner(`${winner.player.name.toUpperCase()} WINS THE QUAFFLE`,'',1.45);scheduleNext(.72,1.15);
    }
  }

  function beginKickoff(team,second=false){
    state.phase=second?'second':'first';state.half=second?2:1;setBroadcastState('LIVE');state.zone=.12;state.passesSinceShot=0;state.lastPasser=null;state.camera.tx=.5;state.camera.ty=.5;state.camera.tz=1.015;audio.ensure();try{if(audio.prematch){audio.prematch.pause();audio.prematch.currentTime=0}if(audio.crowd)audio.setElementVolume(audio.crowd,state.crowdBase)}catch(_){}audio.play(audio.whistle,.62);audio.startWorldCupMatchMusic();audio.crowdHit(.16);say(formatLine('kickoff'));
    if(second){
      const receiver=teamEntities(team)[1]||teamEntities(team)[0];state.possession=team;state.carrier=null;state.kickoffReceiver=receiver;showBanner('SECOND HALF · PLAY!','',1.8);
      const from={x:.5,y:.56};receiver.intent='receive';receiver.tx=safeX(.5+(team==='belros'?-.025:.025));receiver.ty=.575;state.ball.visible=true;
      startFlight(from,{x:receiver.tx,y:receiver.ty},.62,-.025,()=>{state.kickoffReceiver=null;setPossession(team,receiver,.12);scheduleNext(.75,1.3)},{kind:'kickoff',receiver});return;
    }
    stageKickoffReadyPlayers(0,true);
    const winner=rolePlayer(team,'attacker'),challenger=rolePlayer(other(team),'attacker');state.possession=null;state.carrier=null;state.kickoffReceiver=winner;state.ball.flight=null;state.ball.x=.5;state.ball.y=.535;state.ball.visible=true;
    state.special={type:'kickoffRace',elapsed:0,duration:1.02,team,winner,challenger};
    showBanner('QUAFFLE CONTEST · GO!','',1.35);
  }

  function showHalftimeGate(){
    const panel=$('wcgHalftime')?.querySelector('.wcg-halftime-pro');if(!panel)return;
    panel.classList.add('is-gate');
    $('wcgHalfTitle').textContent='FIRST HALF COMPLETE';$('wcgHalfArena').textContent='HALF-TIME SHOW AWAITS';
    $('wcgHalfHomeName').textContent=teamMeta.belros.name;$('wcgHalfAwayName').textContent=teamMeta.zafran.name;$('wcgHalfBelros').textContent=state.score.belros;$('wcgHalfZafran').textContent=state.score.zafran;
    $('wcgHalfShots').textContent=isHost()?'MATCH PAUSED AT 09:00 · PRESS GO WHEN READY':'MATCH PAUSED AT 09:00 · WAITING FOR CATASTHMA';
    const button=$('wcgContinueHalf');button.textContent='GO TO HALF TIME';button.hidden=!isHost();
    $('wcgHalftime').classList.add('is-open');setBroadcastState('HALFTIME_HOLD');
  }
  function beginHalftimeGate(){
    if(state.phase==='halftimehold'||state.phase==='halftime')return;state.phase='halftimehold';state.special=null;state.delay=null;state.ball.flight=null;state.carrier=null;state.ball.visible=false;state.halftimeGateReady=true;state.halftimeElapsed=0;state.halftimeReady=false;audio.ensure();audio.pauseWorldCupMatchMusic();audio.play(audio.whistle,.55);showBanner('FIRST HALF COMPLETE','',2.0);for(const e of state.entities){e.vx=0;e.vy=0}state.ref.vx=state.ref.vy=0;showHalftimeGate();void sendAuthoritativeSnapshot(true);
  }
  async function advanceHalftimeControl(){
    if(!isHost())return;
    if(state.phase==='halftimehold'&&state.halftimeGateReady){await sendMatch('halftime-go',{host:'CatAsthma',at:Date.now()});beginHalftime();return}
    if(state.phase==='halftime'&&state.halftimeReady){await continueSecondHalf()}
  }
  function beginHalftime(){
    if(state.phase==='halftime')return;state.phase='halftime';state.halftimeGateReady=false;state.special=null;state.delay=null;state.ball.flight=null;state.carrier=null;state.ball.visible=false;state.halftimeElapsed=0;state.halftimeReady=false;$('wcgHalftime')?.querySelector('.wcg-halftime-pro')?.classList.remove('is-gate');$('wcgContinueHalf').textContent='START SECOND HALF';setBroadcastState('HALFTIME');audio.ensure();audio.pauseWorldCupMatchMusic();audio.play(audio.whistle,.55);say(formatLine('halftime'));showBanner('HALF TIME','',2.2);$('wcgHalftime').classList.remove('is-open');const bx=[.29,.36,.43],zx=[.71,.64,.57];teamEntities('belros').forEach((e,i)=>{e.tx=bx[i];e.ty=.685});teamEntities('zafran').forEach((e,i)=>{e.tx=zx[i];e.ty=.685});state.ref.tx=.5;state.ref.ty=.685;state.camera.tx=.5;state.camera.ty=.54;state.camera.tz=.985;updateHalftimePresentation(0);void sendAuthoritativeSnapshot(true);
  }
  function handleRemoteHalftimeGo(){
    if(isHost()||state.phase!=='halftimehold')return;state.phase='halftime';state.halftimeGateReady=false;state.halftimeElapsed=0;state.halftimeReady=false;$('wcgHalftime')?.querySelector('.wcg-halftime-pro')?.classList.remove('is-gate');$('wcgHalftime')?.classList.remove('is-open');setBroadcastState('HALFTIME');audio.pauseWorldCupMatchMusic();
  }
  async function continueSecondHalf(){
    if(!isHost()||state.phase!=='halftime'||!state.halftimeReady)return;await sendMatch('second-half',{host:'CatAsthma',at:Date.now()});handleSecondHalf();
  }
  function handleSecondHalf(){
    if(state.phase!=='halftime')return;for(const e of state.entities){e.fatigue*=.28;e.form*=.82;e.vx*=.25;e.vy*=.25}$('wcgHalftime').classList.remove('is-open');state.phase='secondcountdown';state.secondCountdown=3.05;setBroadcastState('SECOND_HALF_COUNTDOWN');state.ball.visible=true;const h=refStandingBallPoint();state.ball.x=h.x;state.ball.y=h.y;updateSecondHalfCountdown(0);if(isHost())void sendAuthoritativeSnapshot(true);
  }

  function beginShootout(){
    state.phase='shootout';const shootoutOrder=state.simRand()<.5?['belros','zafran']:['zafran','belros'];state.shootout={score:{belros:0,zafran:0},attempts:{belros:0,zafran:0},turn:0,order:shootoutOrder,round:0};state.special=null;state.delay={t:2.0,cb:shootoutNext};showBanner('PENALTY SHOOTOUT','var',2.4);say(`Eighteen minutes cannot separate them. No Golden Snitch here — ${teamMeta.belros.name} and ${teamMeta.zafran.name} settle it from the penalty line.`);audio.ensure();audio.play(audio.whistle,.6);
  }
  function shootoutNext(){
    const so=state.shootout;if(!so)return;const team=so.order[so.turn%2];const attemptsA=so.attempts.belros,attemptsB=so.attempts.zafran;
    if(attemptsA>=3&&attemptsB>=3&&attemptsA===attemptsB&&so.score.belros!==so.score.zafran){finishMatch(true);return}
    if(attemptsA>=3&&attemptsB>=3&&Math.abs(attemptsA-attemptsB)===0&&so.score.belros===so.score.zafran){/* sudden death continues */}
    startPenalty(team,true);
  }
  function resolveShootoutPenalty(team,scored,shooter){
    const so=state.shootout;if(!so)return;so.attempts[team]++;if(scored){so.score[team]++;audio.ensure();audio.play(audio.goal,.68);audio.crowdHit(.32);showBanner(`PENALTY SCORED · ${shooter.player.name}`,'',1.8);say(`${shooter.player.name} scores in the shootout. ${so.score.belros}-${so.score.zafran} on penalties.`)}else{showBanner(`PENALTY MISSED · ${shooter.player.name}`,'danger',1.8);say(`${shooter.player.name} cannot convert. The shootout remains ${so.score.belros}-${so.score.zafran}.`)}
    so.turn++;
    const a=so.attempts.belros,b=so.attempts.zafran,sa=so.score.belros,sb=so.score.zafran;
    // Early mathematical finish during first three each.
    if(a<=3&&b<=3){const remA=3-a,remB=3-b;if(sa>sb+remB||sb>sa+remA){state.delay={t:2.2,cb:()=>finishMatch(true)};return}}
    if(a>=3&&b>=3&&a===b&&sa!==sb){state.delay={t:2.2,cb:()=>finishMatch(true)};return}
    state.delay={t:2.2,cb:shootoutNext};
  }

  function populateFulltimePanel(data){
    const {fromShootout,winner,so,mvp}=data;$('wcgFullTitle').textContent=`${teamMeta[winner].name} WIN`;$('wcgFullSubtitle').textContent=fromShootout?'DECIDED BY PENALTY SHOOTOUT':`FULL TIME · ${activeArena().name}`;$('wcgFullScore').textContent=fromShootout?`${teamMeta.belros.name} ${state.score.belros}–${state.score.zafran} ${teamMeta.zafran.name} after 18 minutes · Penalties ${so.score.belros}–${so.score.zafran}`:`${teamMeta.belros.name} ${state.score.belros}–${state.score.zafran} ${teamMeta.zafran.name}`;
    const a=state.teamStats.belros,b=state.teamStats.zafran,possTotal=Math.max(.001,a.possession+b.possession),pa=Math.round(a.possession/possTotal*100),pb=100-pa;
    const rows=[['SHOTS',a.shots,b.shots],['ON TARGET',a.onTarget,b.onTarget],['SHOT ACCURACY',`${a.shots?Math.round(a.onTarget/a.shots*100):0}%`,`${b.shots?Math.round(b.onTarget/b.shots*100):0}%`],['POSSESSION',`${pa}%`,`${pb}%`],['PASS COMPLETION',`${a.passes?Math.round(a.completed/a.passes*100):0}%`,`${b.passes?Math.round(b.completed/b.passes*100):0}%`],['INTERCEPTIONS',a.interceptions,b.interceptions],['REBOUNDS',a.rebounds,b.rebounds],['FOULS',a.fouls,b.fouls],['PENALTIES',a.penalties,b.penalties],['VAR REVIEWS',a.var,b.var]];
    $('wcgFullStats').innerHTML=`<div class="h">${teamMeta.belros.name}</div><div></div><div class="h">${teamMeta.zafran.name}</div>`+rows.map(r=>`<div class="val">${r[1]}</div><div class="label">${r[0]}</div><div class="val">${r[2]}</div>`).join('');
    const playerTeamMarkup=team=>`<section class="wcg-worldcup-player-team is-${team}"><h4>${teamMeta[team].name} · PLAYER REPORT</h4>${roster[team].map(p=>{const s=state.playerStats[p.id];return `<article><header><b>${p.name}</b><span>${p.role.toUpperCase()}</span></header><div><span><small>GOALS</small><strong>${s.goals}</strong></span><span><small>ASSISTS</small><strong>${s.assists}</strong></span><span><small>SHOTS</small><strong>${s.shots}</strong></span><span><small>PASSES</small><strong>${s.completed}</strong></span><span><small>INTERCEPTS</small><strong>${s.interceptions}</strong></span></div></article>`}).join('')}</section>`;
    $('wcgFullPlayers').innerHTML=playerTeamMarkup('belros')+playerTeamMarkup('zafran');const ms=state.playerStats[mvp.id];$('wcgMvp').textContent=`PLAYER OF THE MATCH · ${mvp.name} — ${ms.goals} goals, ${ms.assists} assists, ${ms.interceptions} interceptions, ${ms.completed} completed passes.`;
  }

  function reportWorldCupFulltimeResult(data){
    if(state.realResultReported||!data)return;state.realResultReported=true;const winner=data.winner,loser=other(winner),so=data.so;
    const playerGoals=allPlayers.map(p=>({playerId:p.id,name:p.name,team:teamMeta[pTeam(p.id)]?.name||'',goals:Math.max(0,Number(state.playerStats[p.id]?.goals)||0)})).filter(x=>x.goals>0);
    const detail={fixtureId:state.fixtureId,home:teamMeta.belros.name,away:teamMeta.zafran.name,winner:teamMeta[winner].name,loser:teamMeta[loser].name,winnerSide:winner==='belros'?'home':'away',scoreHome:state.score.belros,scoreAway:state.score.zafran,teamGoals:{[teamMeta.belros.name]:state.score.belros,[teamMeta.zafran.name]:state.score.zafran},playerGoals,shootoutHome:data.fromShootout&&so?so.score.belros:null,shootoutAway:data.fromShootout&&so?so.score.zafran:null,fromShootout:!!data.fromShootout,realResult:!!state.realResultArmed,completedAt:Date.now()};
    try{window.dispatchEvent(new CustomEvent('repo-world-cup-fulltime',{detail}))}catch(_){}
  }

  function finishMatch(fromShootout=false){
    if(state.phase==='fulltime')return;state.phase='fulltime';state.special=null;state.delay=null;state.ball.flight=null;state.carrier=null;state.ball.visible=false;state.fulltimeElapsed=0;setBroadcastState('FULL_TIME');audio.ensure();audio.pauseWorldCupMatchMusic();audio.play(audio.whistle,.65);say(formatLine('fulltime'));showBanner('FULL TIME','',2.4);
    const so=state.shootout;let winner;if(fromShootout&&so)winner=so.score.belros>so.score.zafran?'belros':'zafran';else winner=state.score.belros>state.score.zafran?'belros':'zafran';const mvp=playerOfPeriod(null);state.fulltimeData={fromShootout,winner,so,mvp};reportWorldCupFulltimeResult(state.fulltimeData);
    const losers=other(winner),hero=teamEntities(winner).slice().sort((a,b)=>impactFor(b.player)-impactFor(a.player))[0]||teamEntities(winner)[0];teamEntities(winner).forEach((e,i)=>{e.tx=safeX(hero.x-teamMeta[winner].attack*(.025+i*.035));e.ty=safeY(hero.y+(i-1)*.055);e.celebrate=6});teamEntities(losers).forEach((e,i)=>{e.tx=safeX(lerp(e.x,losers==='belros'?.32:.68,.24));e.ty=safeY(.40+i*.12)});state.camera.tx=.5;state.camera.ty=.53;state.camera.tz=.98;updateFulltimePresentation(0);void sendAuthoritativeSnapshot(true);
  }

  function adminEnabled(){try{return isHost() && typeof toaState!=='undefined' && !!toaState.adminMode}catch(_){return false}}
  function skipToHalftime(){if(!adminEnabled()||state.phase!=='first')return;state.matchTime=HALF_SECONDS;beginHalftimeGate()}
  function previewAdminEvent(kind){
    if(!adminEnabled())return;
    const scorer=state.carrier||rolePlayer('belros','attacker'), defender=rolePlayer(other(scorer.team),'defender');
    const team=kind==='goal'?'belros':scorer.team, teamName=teamMeta[team].name;
    if(kind==='freekick'){startFreeKick(team,scorer,{x:scorer.x,y:scorer.y});return}
    if(kind==='penalty'){startPenalty(team,false);return}
    if(kind==='brawl'){startBrawl(defender,scorer,{kind:'freeKick',team:scorer.team,spot:{x:scorer.x,y:scorer.y}});return}
    const messages={goal:[`GOAL · ${scorer.player.name} · TEST`,''],save:[`SAVE · ${defender.player.name} · TEST`,''],miss:[`MISS · ${scorer.player.name} · TEST`,''],post:['OFF THE RING! · TEST','danger'],foul:[`FOUL · ${defender.player.name} · TEST`,'danger'],hattrick:[`HAT TRICK · ${scorer.player.name} · TEST`,''],penaltypopup:[`PENALTY POPUP · ${teamName} · TEST`,'danger'],var:['VAR CHECK · TEST','var'],intercept:[`INTERCEPTION · ${defender.player.name} · TEST`,'']};
    const [text,type]=messages[kind]||['EVENT TEST',''];
    if(kind==='goal'){audio.ensure();audio.play(audio.goal,.7);audio.crowdHit(.38);beginWorldCupGoalCelebration(team,scorer,other(team),{onDone:()=>restartAfterScore(other(team))})}
    if(kind==='hattrick')triggerWorldCupBigMoment('hattrick',scorer.player,team);
    if(kind==='penaltypopup')triggerWorldCupBigMoment('penalty',scorer.player,team);
    if(kind==='foul'||kind==='penalty'){audio.ensure();audio.play(audio.whistle,.62);state.camera.shake=.009}
    if(kind==='save'||kind==='miss'||kind==='post'||kind==='intercept'){audio.crowdHit(.18);state.camera.shake=.006}
    showBanner(text,type,2.0);say(kind==='goal'?`TEST EVENT: ${scorer.player.name} scores for ${teamName}.`:kind==='foul'?'TEST EVENT: referee whistles for a foul.':kind==='penalty'?`TEST EVENT: penalty awarded to ${teamName}.`:kind==='var'?'TEST EVENT: VAR review is now on screen.':`TEST EVENT: ${text.toLowerCase()}.`);
    if(kind==='var'){const box=$('wcgVar');box.classList.add('is-open');box.classList.remove('is-decision');$('wcgVarTitle').textContent='VAR CHECK';$('wcgVarText').textContent='ADMIN PREVIEW · Reviewing the incident…';setTimeout(()=>{if(!state.open||!adminEnabled())return;box.classList.add('is-decision');$('wcgVarTitle').textContent='GOAL CONFIRMED';$('wcgVarText').textContent='ADMIN PREVIEW · The decision stands.'},1450);setTimeout(()=>box.classList.remove('is-open','is-decision'),3000)}
  }

  function updateIntro(dt){
    const a=audio.prematch;if(a&&!state.prematchAudioFailed&&!a.paused&&Number.isFinite(a.currentTime))state.introElapsed=clamp(a.currentTime,0,INTRO_SECONDS);else state.introElapsed=clamp(state.introElapsed+dt,0,INTRO_SECONDS);
    const cue=Math.floor(state.introElapsed/6);if(cue!==state.introCue&&cue<5){state.introCue=cue;say(commentary.intro[Math.min(cue,commentary.intro.length-1)]);if(cue===1){state.camera.tx=.46;state.camera.tz=1.035}else if(cue===2){state.camera.tx=.54;state.camera.tz=1.035}else if(cue===3){state.camera.tx=.5;state.camera.ty=.56;state.camera.tz=1.045}else{state.camera.tx=.5;state.camera.ty=.5;state.camera.tz=1.005}}
    updatePrematchPresentation();updateKickoffToss(dt);if(state.prematchAudioFailed&&state.introElapsed>=INTRO_SECONDS-.02)completePrematch();
  }

  function updateDelay(dt){if(!state.delay)return;state.delay.t-=dt;if(state.delay.t<=0){const cb=state.delay.cb;state.delay=null;cb?.()}}
  function updateMatchDirector(dt){
    const d=state.director||(state.director={phase:'BUILD-UP',momentum:{belros:0,zafran:0},pressure:{belros:0,zafran:0},recent:[],pulse:0});d.pulse-=dt;if(d.pulse>0)return;d.pulse=.32;const carrier=state.carrier,flight=state.ball.flight,zone=state.zone||.15;if(flight?.meta?.kind==='pass')d.phase='ATTACK';else if(state.special?.type==='penalty')d.phase='SET PIECE';else if(state.celebration)d.phase='RESET';else if(simNow()-(state.possessionChangedAt||0)<1800)d.phase='COUNTERATTACK';else if(state.possession&&state.teamTactics?.[other(state.possession)]?.state==='PRESSING'&&zone<.66)d.phase='DEFENSIVE PRESSURE';else if(zone>.66)d.phase='GOAL CHANCE';else if(zone>.42)d.phase='ATTACK';else d.phase='BUILD-UP';for(const team of ['belros','zafran']){const st=state.teamStats[team],opp=state.teamStats[other(team)],balance=worldCupCompetitiveBalanceEdge(team),raw=(st.completed-opp.completed)*.012+(st.interceptions-opp.interceptions)*.06+(st.shots-opp.shots)*.045+(state.score[team]-state.score[other(team)])*.08+balance*.42;d.momentum[team]=lerp(d.momentum[team],clamp(raw,-.32,.32),.18);d.pressure[team]=lerp(d.pressure[team],carrier&&carrier.team!==team?clamp(zone,.1,.95):.12,.22)}for(const e of state.entities){const a=e.attributes||{},halfProgress=clamp((state.matchTime%(HALF_SECONDS||540))/HALF_SECONDS,0,1);e.fatigue=clamp(halfProgress*(1-(a.stamina||.9))*.34+(state.half===2?.025:0),0,.10);e.form=clamp(e.form*.985,-.12,.12)}
  }

  function nearestOpponent(e){return teamEntities(other(e.team)).slice().sort((a,b)=>dist2(e,a)-dist2(e,b))[0]||null}
  function assignMarks(defTeam,attackers,carrier){
    const defenders=teamEntities(defTeam),available=attackers.filter(a=>a!==carrier);
    defenders.forEach((d,i)=>{
      if(i===0&&carrier){d.mark=carrier;return}
      const candidates=available.filter(a=>!defenders.some(x=>x!==d&&x.mark===a));
      d.mark=(candidates.length?candidates:available).slice().sort((a,b)=>dist2(d,a)-dist2(d,b))[0]||carrier||null;
    });
  }

  function passingLaneRisk(from,to,defTeam){
    const vx=to.x-from.x,vy=to.y-from.y,len2=vx*vx+vy*vy||.0001;
    let risk=0;
    for(const d of teamEntities(defTeam)){
      const q=clamp(((d.x-from.x)*vx+(d.y-from.y)*vy)/len2,0,1),px=from.x+vx*q,py=from.y+vy*q;
      const lane=Math.hypot(d.x-px,d.y-py),aw=d.attributes?.awareness||.85;
      risk=Math.max(risk,clamp((.18-lane)*4.2*aw,0,.72));
    }
    return risk;
  }

  function chooseSupportTarget(e,carrier,ballFuture,slot){
    const dir=teamMeta[e.team].attack,a=e.attributes||{},creative=e.personality==='creative';
    const ahead=slot===0 ? (.105+.035*a.anticipation) : (.025+.025*a.positioning);
    const width=(slot===0?-1:1)*(.125+.045*a.positioning+activeFlightProfile().supportWidthBonus);
    let x=ballFuture.x+dir*ahead,y=ballFuture.y+width;
    // Creative/support players occasionally cross or make a decoy run, but only when there is room.
    if(creative&&state.simRand()<.11){y=ballFuture.y-width*.72;x+=dir*.035}
    const nearest=nearestOpponent(e);if(nearest&&dist2({x,y},nearest)<.10)y+=Math.sign(y-nearest.y||1)*.055;
    return {x:safeX(x),y:safeY(y)};
  }
  function refreshMovementTargets(force=false){
    if(state.phase!=='first'&&state.phase!=='second')return;updateTeamTacticalDirector(0,force);const ball=state.ball.flight?state.ball:(state.carrier||state.ball||{x:.5,y:.5,vx:0,vy:0}),poss=state.possession,carrier=state.carrier;
    if(!poss){const bx=safeX(ball.x+(ball.vx||0)*.14),by=safeY(ball.y+(ball.vy||0)*.14);for(const team of ['belros','zafran']){const tt=state.teamTactics[team],players=teamEntities(team),ordered=players.slice().sort((a,b)=>Math.hypot(a.x-bx,a.y-by)-Math.hypot(b.x-bx,b.y-by));ordered.forEach((e,i)=>{const role=tt?.responsibilities?.[e.player.id]||(['SECOND_BALL','SUPPORT_COVER','COVER'][i]);if(role==='SECOND_BALL')tacticalTarget(e,bx+(e.x<bx?-.010:.010),by,'recover',force);else if(role==='SUPPORT_COVER'){const ownGoal=team==='belros'?.10:.90;tacticalTarget(e,lerp(bx,ownGoal,.11),by+(e.flowSign||1)*.085,'cover',force)}else{const ownGoal=team==='belros'?.10:.90;tacticalTarget(e,lerp(bx,ownGoal,.25),safeY(.5+(e.flowSign||1)*.12),'cover',force)}})}return}
    const attackDir=teamMeta[poss].attack,defTeam=other(poss),attT=state.teamTactics[poss],defT=state.teamTactics[defTeam],flowPhase=state.matchFlow?.currentPhase,phase=attT?.state||state.director?.phase||'BUILDUP',counter=flowPhase===FLOW_PHASES.COUNTER||phase==='COUNTERATTACK',shotSequence=flowPhase===FLOW_PHASES.SHOT_SEQUENCE,finalAttack=flowPhase===FLOW_PHASES.FINAL_THIRD||phase==='FINAL_ATTACK'||shotSequence,circulation=flowPhase===FLOW_PHASES.CIRCULATION||flowPhase===FLOW_PHASES.BUILDUP,probing=flowPhase===FLOW_PHASES.PROBING,flight=state.ball.flight,ballFuture={x:safeX(ball.x+(flight?(flight.tx-ball.x)*.44:(carrier?.vx||0)*.42)),y:safeY(ball.y+(flight?(flight.ty-ball.y)*.44:(carrier?.vy||0)*.42))},attackers=teamEntities(poss),defenders=teamEntities(defTeam);assignMarks(defTeam,attackers,carrier);
    attackers.forEach(e=>{if(state.kickoffReceiver===e){tacticalTarget(e,state.ball.x+attackDir*.008,state.ball.y+.025,'receive',true);return}if(flight?.meta?.receiver===e||flight?.meta?.challenger===e)return;const role=attT?.responsibilities?.[e.player.id]||(e===carrier?'BALL_CARRIER':'SUPPORT');if(e===carrier){const goalX=attackDir>0?FLIGHT.softX1:FLIGHT.softX0,nearest=nearestOpponent(e),pressure=nearest?dist2(e,nearest):1,evadeSign=nearest&&pressure<.14?Math.sign(e.y-nearest.y||e.flowSign||1):(e.flowSign||1),stableDrift=Math.sin((state.matchTime||0)*.31+(e.flowPhase||0))*.012,y=e.y+stableDrift+(pressure<.13?evadeSign*(.035+.018*(e.attributes?.turn||.8)):0),advance=counter?.15:finalAttack?.095:.065;tacticalTarget(e,lerp(e.x,goalX,advance),y,pressure<.12?'evade':'carry',force);return}const profile=attT?.profile||tacticalProfileForTeam(poss),adjustment=attT?.adjustment||tacticalAdjustmentForTeam(poss),fluidFlip=profile.fluid&&Math.floor((state.matchTime||0)/7)%2===1?-1:1,side=(role==='WIDTH'?(e.flowSign||1):role==='RUNNER'?(e.flowSign||1)*.55:(e.flowSign||1)*-.55)*fluidFlip,flowWidth=circulation?1.18:finalAttack?.88:counter?1.08:1,roleWidth=role==='WIDTH'?.17:role==='RUNNER'?.105:.085,profileWidth=role==='SUPPORT'?(profile.supportWidth||1):1,width=roleWidth*(attT?.width||1)*flowWidth*profileWidth,baseAhead=role==='RUNNER'?(counter?.18:circulation?.075:probing?.115:.145):role==='SUPPORT'?(circulation?-.075:-.025):(circulation?.015:.055),ahead=baseAhead*(role==='RUNNER'?(profile.runnerDepth||1)*(adjustment.runner||1):role==='SUPPORT'?(profile.supportDepth||1)*(adjustment.support||1):1);let tx=ballFuture.x+attackDir*ahead,ty=ballFuture.y+side*width;if(role==='SUPPORT'){const supportGap=(.045+.02*(1-(attT?.risk||.5)))*(profile.supportDepth||1)*(adjustment.support||1);tx=ballFuture.x-attackDir*supportGap;ty=ballFuture.y+side*.075*(profile.supportWidth||1)}const nearest=nearestOpponent(e);if(nearest&&dist2({x:tx,y:ty},nearest)<.085)ty+=Math.sign(ty-nearest.y||side||1)*.045;tacticalTarget(e,tx,ty,counter?'break':role.toLowerCase(),force)});
    const goalProtector=rolePlayer(defTeam,'defender');defenders.forEach((e,i)=>{if(flight?.meta?.challenger===e)return;const role=defT?.responsibilities?.[e.player.id]||(['BALL_PRESSER','SUPPORT_COVER','COVER'][i]),a=e.attributes||{},ownGoalX=defTeam==='belros'?.085:.915,marked=e.mark||carrier;if(finalAttack&&carrier&&e===goalProtector){const screen=goalSideScreenPoint(carrier);tacticalTarget(e,screen.x,screen.y,'goal-screen',true);return}if(role==='BALL_PRESSER'&&carrier){let x=lerp(carrier.x,ownGoalX,(finalAttack?.035:circulation?.13:.10)+.025*(a.positioning||.8)),y=lerp(e.y,carrier.y,finalAttack?.90:.70);if(finalAttack){const goalLine=defTeam==='belros'?.105:.895;x=lerp(carrier.x,goalLine,.30);y=lerp(carrier.y,.51,.18)}tacticalTarget(e,x,y,'press',force);return}const defProfile=defT?.profile||tacticalProfileForTeam(defTeam),compact=clamp(defProfile.defCompact||1,.84,1.10);if(role==='SUPPORT_COVER'){const markY=marked?.y??ballFuture.y;tacticalTarget(e,lerp(ballFuture.x,ownGoalX,.24+.05*(a.positioning||.8)),lerp(ballFuture.y,markY,.48)+(e.flowSign||1)*.035*compact,'mark',force);return}tacticalTarget(e,lerp(ballFuture.x,ownGoalX,.38+.06*(a.positioning||.8)),lerp(.5,carrier?.y??ballFuture.y,.38*compact),'cover',force)});
    // Dynamic World Cup arenas: unlike the old WC-specific forced lower-lane patch,
    // Club spacing is used everywhere and safeY() naturally exposes each stadium's full bounds.
    const activeRing=ringActionParticipants();for(const e of state.entities){if(activeRing.has(e))continue;for(const g of [{x:.098,y:.508,away:1},{x:.902,y:.508,away:-1}]){const dx=e.tx-g.x,dy=e.ty-g.y,d=Math.hypot(dx,dy);if(d<.145){e.tx=safeX(g.x+g.away*.155);e.ty=safeY(g.y+(e.flowSign||1)*.12);break}}}
    for(const team of ['belros','zafran']){const players=teamEntities(team);for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){const a=players[i],b=players[j],dx=a.tx-b.tx,dy=a.ty-b.ty,d=Math.hypot(dx,dy)||.001;if(d<.120){const push=(.120-d)*.36,nx=dx/d,ny=dy/d;a.tx=safeX(a.tx+nx*push);a.ty=safeY(a.ty+ny*push);b.tx=safeX(b.tx-nx*push);b.ty=safeY(b.ty-ny*push)}}}
  }

  function activeContestEntities(){
    const keep=new Set();
    if(state.carrier)keep.add(state.carrier);
    const flight=state.ball?.flight;
    if(flight?.meta?.receiver)keep.add(flight.meta.receiver);
    if(flight?.meta?.challenger)keep.add(flight.meta.challenger);
    if(state.carrier){
      const defenders=teamEntities(other(state.carrier.team))
        .slice().sort((a,b)=>dist2(a,state.carrier)-dist2(b,state.carrier));
      if(defenders[0])keep.add(defenders[0]);
      if(defenders[1]&&dist2(defenders[1],state.carrier)<.19)keep.add(defenders[1]);
    }
    return keep;
  }
  function breakGeneralPackGrouping(dt,live){
    if(!live||state.celebration||state.special)return;
    const entities=state.entities,contest=activeContestEntities();
    const packRadius=.128,triggerSeconds=.26;
    for(let i=0;i<entities.length;i++){
      const e=entities[i];
      const close=entities.filter(o=>o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<packRadius);
      if(close.length>=3)e.packCrowdTime=(e.packCrowdTime||0)+dt;
      else e.packCrowdTime=Math.max(0,(e.packCrowdTime||0)-dt*3.4);
      if((e.packDisperseTime||0)>0&&e.packDisperseTarget){
        e.packDisperseTime=Math.max(0,e.packDisperseTime-dt);
        const strength=contest.has(e)?.38:.76;
        e.tx=lerp(e.tx,e.packDisperseTarget.x,strength);e.ty=lerp(e.ty,e.packDisperseTarget.y,strength);
        if(!contest.has(e))e.intent='spread';if(e.packDisperseTime<=0)e.packDisperseTarget=null;
      }
      if(e.packCrowdTime<triggerSeconds||close.length<3||e.packDisperseTime>0)continue;
      const group=[e,...close],cx=group.reduce((n,o)=>n+o.x,0)/group.length,cy=group.reduce((n,o)=>n+o.y,0)/group.length;
      let dx=e.x-cx,dy=e.y-cy,d=Math.hypot(dx,dy);
      if(d<.012){const idx=Math.max(0,entities.indexOf(e)),angle=(-Math.PI*.72)+(idx/Math.max(1,entities.length-1))*Math.PI*1.44;dx=Math.cos(angle);dy=Math.sin(angle);d=1}
      dx/=d;dy/=d;const essential=contest.has(e),distance=essential?.080:.145,teamBias=e.team==='belros'?-.015:.015;
      e.packDisperseTarget={x:safeX(e.x+dx*distance+teamBias),y:clamp(e.y+dy*distance,FLIGHT.softY0+.050,lowerSoftLimit(e)-.020)};
      e.packDisperseTime=essential?.62:1.45;e.packCrowdTime=0;
    }
  }

  function lowerSoftLimit(e){
    const bottom=activeSoftY1();
    // Sprite scale is presentation-only. Every player gets identical gameplay bounds.
    return e?.player?bottom-.018:bottom;
  }
  function lowerHardLimit(e){
    const bottom=activeHardY1();
    // Sprite scale is presentation-only. Every player gets identical gameplay bounds.
    return e?.player?bottom-.016:bottom;
  }
  function enforceInteriorIntent(e,dt){
    const mx=.040,my=.038,softBottom=lowerSoftLimit(e);let threatened=false,bottomThreat=false;
    if(Number.isFinite(e.ty))e.ty=Math.min(e.ty,softBottom);
    if(e.x<FLIGHT.softX0+mx){e.tx=Math.max(e.tx,FLIGHT.softX0+.090);if(e.vx<0)e.vx=lerp(e.vx,.070,.30);threatened=true}
    else if(e.x>FLIGHT.softX1-mx){e.tx=Math.min(e.tx,FLIGHT.softX1-.090);if(e.vx>0)e.vx=lerp(e.vx,-.070,.30);threatened=true}
    if(e.y<FLIGHT.softY0+my){e.ty=Math.max(e.ty,FLIGHT.softY0+.085);if(e.vy<0)e.vy=lerp(e.vy,.068,.30);threatened=true}
    else if(e.y>softBottom-.040){e.ty=Math.min(e.ty,softBottom-.012);if(e.vy>-.020)e.vy=lerp(e.vy,-.082,.34);threatened=true;bottomThreat=true}
    const slow=Math.hypot(e.vx,e.vy)<.038;e.edgeStall=threatened&&slow?(e.edgeStall||0)+dt:Math.max(0,(e.edgeStall||0)-dt*3);
    if(bottomThreat&&e.y>softBottom-.012){const side=e.x<.5?1:-1;e.ty=Math.min(e.ty,softBottom-.048);e.tx=safeX(e.tx+side*.045);e.vy=Math.min(e.vy,-.090);e.vx+=side*.018;e.intent='recover'}
    if(e.edgeStall>(bottomThreat?.16:.18)){const recoveryY=bottomThreat?Math.max(.58,softBottom-.10):.455;e.tx=safeX(lerp(e.x,.5,.38));e.ty=safeY(lerp(e.y,recoveryY,.48));const ix=.5-e.x,iy=recoveryY-e.y,d=Math.hypot(ix,iy)||1;e.vx+=ix/d*.072;e.vy+=iy/d*(bottomThreat?.095:.090);e.edgeStall=0;e.intent='recover'}
  }
  function applyBoundarySteering(e,dvx,dvy){const px=e.x+e.vx*.42,py=e.y+e.vy*.42,left=(px-FLIGHT.hardX0)/FLIGHT.wallLook,right=(FLIGHT.hardX1-px)/FLIGHT.wallLook,top=(py-FLIGHT.hardY0)/FLIGHT.wallLook,bottom=(lowerHardLimit(e)-py)/.072;if(left<1)dvx+=Math.pow(1-clamp(left,0,1),2)*.26;if(right<1)dvx-=Math.pow(1-clamp(right,0,1),2)*.26;if(top<1)dvy+=Math.pow(1-clamp(top,0,1),2)*.22;if(bottom<1)dvy-=Math.pow(1-clamp(bottom,0,1),2)*.34;return [dvx,dvy]}
  function steerEntity(e,dt){
    enforceInteriorIntent(e,dt);const dx=e.tx-e.x,dy=e.ty-e.y,dist=Math.hypot(dx,dy),fatigue=1-(e.fatigue||0),live=(state.phase==='first'||state.phase==='second'||state.phase==='shootout')&&!state.special&&!state.celebration;let desiredSpeed=Math.min((e.maxSpeed||.19)*fatigue,dist*1.9+.022),dvx=dist>.001?dx/dist*desiredSpeed:0,dvy=dist>.001?dy/dist*desiredSpeed:0;
    if(live&&dist<FLOW.arrivalRadius&&e.intent!=='intercept'&&e.intent!=='receive'){const sp0=Math.hypot(e.vx,e.vy),cruise=FLOW.minCruise*(e.intent==='press'?1.12:e===state.carrier?1.08:.90);if(sp0>.018){const keep=Math.max(cruise,Math.min(sp0,(e.maxSpeed||.19)*.72));dvx=e.vx/sp0*keep;dvy=e.vy/sp0*keep}desiredSpeed=Math.max(desiredSpeed,cruise)}
    [dvx,dvy]=applyBoundarySteering(e,dvx,dvy);const responsiveness=1-Math.exp(-dt*(e.turnRate||5)*fatigue);e.vx=lerp(e.vx,dvx,responsiveness);e.vy=lerp(e.vy,dvy,responsiveness);
    if(live){for(const o of state.entities){if(o===e)continue;const sx=e.x-o.x,sy=e.y-o.y,sd=Math.hypot(sx,sy);if(sd>0&&sd<.050){const nx=sx/sd,ny=sy/sd,closing=(e.vx-o.vx)*nx+(e.vy-o.vy)*ny;if(closing<0){const push=(.050-sd)*.22;e.vx+=nx*push;e.vy+=ny*push}}}}
    let sp=Math.hypot(e.vx,e.vy),max=(e.maxSpeed||.19)*fatigue;if(sp>max){e.vx=e.vx/sp*max;e.vy=e.vy/sp*max;sp=max}e.hoverTime=live&&sp<.026?(e.hoverTime||0)+dt:Math.max(0,(e.hoverTime||0)-dt*2.8);if(live&&e.hoverTime>FLOW.hoverTrigger){const attack=teamMeta[e.team].attack,side=e.flowSign||1;e.tx=safeX(e.x+attack*(e===state.carrier?.095:.050));e.ty=safeY(e.y+side*.078);e.vx+=attack*FLOW.escapeImpulse*.84;e.vy+=side*FLOW.escapeImpulse;e.hoverTime=0;e.flowSign*=-1;e.intent=e.intent==='shape'?'rotate':e.intent}
    applyLoiterBreak(e,dt,live);
    let nx=e.x+e.vx*dt,ny=e.y+e.vy*dt;if(nx<FLIGHT.hardX0){nx=FLIGHT.hardX0+.003;e.vx=Math.abs(e.vx)*.28;e.tx=Math.max(e.tx,FLIGHT.softX0+.035)}else if(nx>FLIGHT.hardX1){nx=FLIGHT.hardX1-.003;e.vx=-Math.abs(e.vx)*.28;e.tx=Math.min(e.tx,FLIGHT.softX1-.035)}const hardBottom=lowerHardLimit(e),softBottom=lowerSoftLimit(e);if(ny<FLIGHT.hardY0){ny=FLIGHT.hardY0+.003;e.vy=Math.abs(e.vy)*.28;e.ty=Math.max(e.ty,FLIGHT.softY0+.07)}else if(ny>hardBottom){ny=hardBottom-.004;e.vy=-Math.max(.070,Math.abs(e.vy)*.50);e.ty=Math.min(e.ty,softBottom-.040);e.tx=safeX(lerp(e.tx,.5,.07));e.intent='recover'}e.x=nx;e.y=ny;if(Math.abs(e.vx)>.018){const candidate=e.vx>=0?1:-1;if(candidate!==(e.facing||candidate)){if(e.faceCandidate===candidate)e.faceCandidateTime=(e.faceCandidateTime||0)+dt;else{e.faceCandidate=candidate;e.faceCandidateTime=0}}else e.faceCandidateTime=0;if((e.faceCandidateTime||0)>.085){e.facing=candidate;e.dir=-candidate;e.faceCandidateTime=0}}const desiredHeading=Math.atan2(dvy,dvx),currentHeading=Math.atan2(e.vy||.001,e.vx||.001),headingError=Math.atan2(Math.sin(desiredHeading-currentHeading),Math.cos(desiredHeading-currentHeading));e.smoothedTurn=lerp(e.smoothedTurn||0,headingError,1-Math.exp(-dt*2.6));e.bank=lerp(e.bank,clamp((e.smoothedTurn||0)*.07,-.055,.055),1-Math.exp(-dt*2.8));if(e.celebrate>0)e.celebrate=Math.max(0,e.celebrate-dt);
  }
  function steerRefToCurrentTarget(dt){
    const r=state.ref;if(!r)return;const dx=r.tx-r.x,dy=r.ty-r.y,dist=Math.hypot(dx,dy),ds=Math.min(r.maxSpeed,dist*1.55+.02);let rvx=dist?dx/dist*ds:0,rvy=dist?dy/dist*ds:0;[rvx,rvy]=applyBoundarySteering(r,rvx,rvy);const k=1-Math.exp(-dt*4.8);r.vx=lerp(r.vx,rvx,k);r.vy=lerp(r.vy,rvy,k);let rx=r.x+r.vx*dt,ry=r.y+r.vy*dt;if(rx<FLIGHT.hardX0){rx=FLIGHT.hardX0+.004;r.vx=Math.abs(r.vx)*.3}else if(rx>FLIGHT.hardX1){rx=FLIGHT.hardX1-.004;r.vx=-Math.abs(r.vx)*.3}if(ry<FLIGHT.hardY0){ry=FLIGHT.hardY0+.004;r.vy=Math.abs(r.vy)*.3}else if(ry>lowerHardLimit(r)){ry=lowerHardLimit(r)-.004;r.vy=-Math.max(.07,Math.abs(r.vy)*.52)}r.x=rx;r.y=ry;if(Math.abs(r.vx)>.003)r.dir=r.vx>=0?1:-1;
  }
  function updateSpecialStagingEntities(dt){
    if(!state.special||!['freeKick','penalty','brawl','kickoffRace'].includes(state.special.type))return false;
    const kickoff=state.special.type==='kickoffRace';
    for(const e of state.entities)steerEntity(e,dt*(kickoff?1.22:.82));
    steerRefToCurrentTarget(dt*(kickoff?.72:.86));
    return true;
  }

  function updateEntities(dt){
    if(state.phase==='halftimehold'){for(const e of state.entities){e.vx=e.vy=0}state.ref.vx=state.ref.vy=0;return}
    if(state.phase==='intro'){for(const e of state.entities)e.vx=e.vy=0;state.ref.vx=state.ref.vy=0;return}if(state.phase==='secondcountdown'){for(const e of state.entities){e.vx=lerp(e.vx,0,1-Math.exp(-dt*8));e.vy=lerp(e.vy,0,1-Math.exp(-dt*8))}state.ref.vx=state.ref.vy=0;return}if(state.phase==='halftime'){for(const e of state.entities){if(state.halftimeElapsed<2.4)steerEntity(e,dt*.68);else{e.vx=lerp(e.vx,0,1-Math.exp(-dt*7));e.vy=lerp(e.vy,0,1-Math.exp(-dt*7))}}state.ref.vx=lerp(state.ref.vx,0,1-Math.exp(-dt*7));state.ref.vy=lerp(state.ref.vy,0,1-Math.exp(-dt*7));return}
    if(state.delay?.reason==='foul-stoppage'){for(const e of state.entities)steerEntity(e,dt*.55);steerRefToCurrentTarget(dt*.72);return}
    if(updateSpecialStagingEntities(dt))return;
    updateMatchDirector(dt);updateTeamTacticalDirector(dt);state.movementPulse-=dt;if(state.movementPulse<=0){refreshMovementTargets();state.movementPulse=.18}breakGeneralPackGrouping(dt,true);for(const e of state.entities)steerEntity(e,dt);const target=state.ball.flight?state.ball:(state.carrier||{x:.5,y:.5}),refBehind=state.possession==='belros'?.115:state.possession==='zafran'?-.115:0,refVertical=target.y<.50?.115:-.115;state.ref.tx=safeX(target.x-refBehind);state.ref.ty=safeY(target.y+refVertical);steerRefToCurrentTarget(dt);
  }

  function updateCamera(dt){
    const c=state.camera;if(c.vx==null){c.vx=0;c.vy=0;c.vz=0;c.mode='LIVE_BROADCAST'};updateWorldCupCameraDirector(dt);
    const live=state.phase==='first'||state.phase==='second'||state.phase==='shootout';
    if(live&&!state.special){
      if(state.celebration){const gc=state.celebration;c.mode='CELEBRATION_CAMERA';if(gc.grounded){c.tx=clamp(lerp(.5,gc.centerX,.34),.44,.56);c.ty=.600;c.tz=1.060}else{c.tx=clamp(lerp(.5,gc.scorer.x,.26),.47,.53);c.ty=clamp(lerp(.515,gc.scorer.y,.22),.49,.56);c.tz=1.052}}
      else{const flight=state.ball.flight,carrier=state.carrier,dir=carrier?teamMeta[carrier.team].attack:(state.possession?teamMeta[state.possession].attack:0);let mode='LIVE_BROADCAST',zoom=1.025;if(flight?.meta?.kind==='shot'){mode='SHOT_CAMERA';zoom=1.070}else if(state.director?.phase==='COUNTERATTACK'){mode='ATTACK_CAMERA';zoom=1.047}else if(state.director?.phase==='GOAL CHANCE'){mode='ATTACK_CAMERA';zoom=1.060}else if(flight?.meta?.kind==='pass')zoom=1.036;const virtual=state.cameraDirector?.shot||'MAIN';if(virtual==='WIDE'){mode='WIDE_CAMERA';zoom=Math.min(zoom,1.006)}else if(virtual==='TRACKING'){mode='TRACKING_CAMERA';zoom=Math.max(zoom,1.040)}else if(virtual==='CLOSE_ATTACK'){mode='CLOSE_ATTACK_CAMERA';zoom=Math.max(zoom,1.070)}else if(virtual==='GOAL_END'){mode='GOAL_END_CAMERA';zoom=Math.max(zoom,1.058)};
        const pts=worldCupCameraFramePoints();let sx=0,sy=0,sw=0;for(const p of pts){sx+=p.x*(p.w||1);sy+=p.y*(p.w||1);sw+=p.w||1}let fx=sw?sx/sw:.5,fy=sw?sy/sw:.5;const focus=flight?state.ball:(carrier||{x:.5,y:.5});let lookX=0,lookY=0;if(flight){lookX=(flight.tx-focus.x)*.32;lookY=(flight.ty-focus.y)*.22}else if(carrier){lookX=(carrier.vx||0)*.66+dir*.016;lookY=(carrier.vy||0)*.44}fx=lerp(fx,focus.x,.38)+lookX;fy=lerp(fy,focus.y,.34)+lookY;if(virtual==='WIDE'){fx=lerp(fx,.5,.24);fy=lerp(fy,.50,.18)}else if(virtual==='GOAL_END'&&carrier){const gx=carrier.team==='belros'?.82:.18;fx=lerp(fx,gx,.27);fy=lerp(fy,.515,.18)}else if(virtual==='CLOSE_ATTACK'&&carrier){fx=lerp(fx,carrier.x,.35);fy=lerp(fy,carrier.y,.30)}const zb=cameraBoundsForZoom(zoom);c.tx=clamp(fx,zb.x0+.004,zb.x1-.004);c.ty=clamp(fy,zb.y0+.004,zb.y1-.004);c.tz=zoom;c.mode=mode;}
    }else if(state.special?.type==='var')c.mode='VAR_CAMERA';
    else if(state.special?.type==='penalty'||state.special?.type==='freeKick'){const s=state.special,focus=s.shooter||s.taker||entityById(s.shooterId||s.takerId);c.mode='SET_PIECE_CAMERA';if(focus){c.tx=clamp(lerp(.5,focus.x,.34),.44,.56);c.ty=clamp(lerp(.52,focus.y,.16),.49,.57)}c.tz=state.special.type==='penalty'?1.060:1.038}
    else if(state.special?.type==='brawl'){c.mode='INCIDENT_CAMERA';c.tx=clamp(lerp(.5,state.special.centerX||.5,.48),.43,.57);c.ty=.60;c.tz=1.060}
    else if(state.phase==='halftimehold')c.mode='HALFTIME_HOLD';else if(state.phase==='halftime')c.mode='HALFTIME_CAMERA';else if(state.phase==='fulltime')c.mode='FULL_TIME_CAMERA';
    const fast=['ATTACK_CAMERA','SHOT_CAMERA','TRACKING_CAMERA','CLOSE_ATTACK_CAMERA','GOAL_END_CAMERA'].includes(c.mode),accel=fast?5.25:4.0,damping=fast?5.0:4.7;c.vx+=(c.tx-c.x)*accel*dt;c.vy+=(c.ty-c.y)*accel*dt;c.vz+=(c.tz-c.zoom)*3.8*dt;const damp=Math.exp(-damping*dt);c.vx*=damp;c.vy*=damp;c.vz*=Math.exp(-4.7*dt);c.x+=c.vx*dt;c.y+=c.vy*dt;c.zoom+=c.vz*dt;c.zoom=clamp(c.zoom,.985,1.095);const bounds=cameraBoundsForZoom(Math.max(1,c.zoom));c.x=clamp(c.x,bounds.x0,bounds.x1);c.y=clamp(c.y,bounds.y0,bounds.y1);c.shake=Math.max(0,c.shake-dt*.018);
  }

  function drawSprite(ctx,image,e,height,standing=false){
    if(!image)return;const aspect=image.width/image.height,w=height*aspect,airLift=standing?0:WORLD_CUP_AIR_LIFT_PX,standingDrop=standing?standingFloorOffsetPx():0;ctx.save();ctx.translate(e.x*W,e.y*H-airLift+standingDrop);const bob=0;if(!standing){ctx.rotate((e.bank||0)+(e.celebrate>0?Math.sin(performance.now()/120)*.025:0))}ctx.scale(e.dir||1,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,-w/2,-height/2,w,height);ctx.restore();
    ctx.save();const tagText=e.player?.name||WORLD_CUP_REFEREE_NAME,tagY=e.y*H-(standing?0:WORLD_CUP_AIR_LIFT_PX)+(standing?standingFloorOffsetPx():0)-height/2-9,isHome=e.team==='belros',isAway=e.team==='zafran',carrier=!standing&&state.carrier===e;ctx.font='900 9px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';const tw=Math.ceil(ctx.measureText(tagText).width)+12,th=15,left=Math.round(e.x*W-tw/2),top=Math.round(tagY-th+2);ctx.fillStyle=isHome?'rgba(26,48,73,.94)':isAway?'rgba(20,42,67,.94)':'rgba(12,25,38,.92)';ctx.fillRect(left,top,tw,th);ctx.strokeStyle=carrier?'#fff0a6':isHome?'#d3a250':isAway?'#83c9e8':'#b8c7d0';ctx.lineWidth=carrier?2:1;ctx.strokeRect(left+.5,top+.5,tw-1,th-1);ctx.fillStyle=isHome?'#e2b55f':isAway?'#79c5e5':'#b9cad4';ctx.fillRect(left+1,top+1,tw-2,2);ctx.fillStyle='#f7eed3';ctx.strokeStyle='rgba(0,0,0,.92)';ctx.lineWidth=2.5;ctx.strokeText(tagText,e.x*W,tagY);ctx.fillText(tagText,e.x*W,tagY);if(carrier){ctx.fillStyle='#ffe581';ctx.beginPath();ctx.arc(e.x*W,top-4,2.7,0,Math.PI*2);ctx.fill()}ctx.restore();
  }

  function drawBall(ctx,x,y,flight=false){if(!state.assets.ball)return;ctx.save();ctx.translate(x*W,y*H);const size=flight?29:23;if(flight){ctx.globalAlpha=.13;ctx.drawImage(state.assets.ball,-size*1.45,-size*.5,size,size);ctx.globalAlpha=1}else{ctx.globalAlpha=.18;ctx.drawImage(state.assets.ball,-size*.62,-size*.52,size,size);ctx.globalAlpha=1}ctx.drawImage(state.assets.ball,-size/2,-size/2,size,size);ctx.restore()}

  function render(){
    const canvas=$('wcgCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx||!state.assets.arena)return;ctx.clearRect(0,0,W,H);ctx.save();const replayFrame=(!isHost()?(state.remoteReplayFrameSmooth||state.remoteReplayFrame):currentWorldCupReplayFrame()),shake=!replayFrame&&state.camera.shake?((state.visualRand()-.5)*state.camera.shake*W):0,cam=replayFrame?.camera||state.camera,replayZoom=replayFrame?clamp((cam.zoom||1.03)+.028,1.025,1.092):cam.zoom;ctx.translate(W/2+shake,H/2+shake*.5);ctx.scale(replayZoom,replayZoom);ctx.translate(-(cam.x||.5)*W,-(cam.y||.5)*H);ctx.imageSmoothingEnabled=false;ctx.drawImage(state.assets.arena,0,0,W,H);
    if(replayFrame){drawWorldCupReplayScene(ctx,replayFrame);ctx.restore();return}
    const introMounted=state.phase==='intro'&&(INTRO_SECONDS-state.introElapsed)<=4.2;
    const standing=!introMounted&&(state.phase==='intro'||state.phase==='secondcountdown'||(state.phase==='halftime'&&state.halftimeElapsed>2.15));
    if(introMounted){for(const e of state.entities)drawSprite(ctx,state.assets[e.player.id+'Riding'],e,playerSpriteHeight(e,false),false);const rr={...state.ref,player:{name:WORLD_CUP_REFEREE_NAME},dir:1};drawSprite(ctx,state.assets.refStanding,rr,REF_STAND_HEIGHT,true);if(state.ball.visible)drawBall(ctx,state.ball.x,state.ball.y,false)}
    else if(standing){for(const e of state.entities)drawSprite(ctx,state.assets[e.player.id+'Standing'],e,playerSpriteHeight(e,true),true);const rr={...state.ref,player:{name:WORLD_CUP_REFEREE_NAME},dir:1};drawSprite(ctx,state.assets.refStanding,rr,REF_STAND_HEIGHT,true);if(state.ball.visible)drawBall(ctx,state.ball.x,state.ball.y,false)}
    else{
      const incident=state.special?.type==='brawl'?state.special:null,incidentStanding=!!(incident&&incident.elapsed>=Number(incident.standingAt||.82)&&incident.elapsed<Number(incident.mountAt||3.85)),incidentIds=new Set(incident?.participantIds||[]);
      for(const e of state.entities){const goalStanding=!!(state.celebration?.grounded&&e.team===state.celebration.team),brawlStanding=incidentStanding&&incidentIds.has(e.player.id),useStanding=goalStanding||brawlStanding;drawSprite(ctx,state.assets[e.player.id+(useStanding?'Standing':'Riding')],e,playerSpriteHeight(e,useStanding),useStanding)}
      const rr={...state.ref,player:{name:WORLD_CUP_REFEREE_NAME}};drawSprite(ctx,state.assets[incidentStanding?'refStanding':'refFlying'],rr,incidentStanding?REF_STAND_HEIGHT:REF_FLY_HEIGHT,incidentStanding);
      if(state.ball.visible&&state.assets.ball){const incidentHidesBall=incidentStanding&&incidentIds.has(state.carrier?.player?.id);const hold=!incidentHidesBall&&state.carrier?ballHoldPoint(state.carrier):null;if(!incidentHidesBall)drawBall(ctx,hold?hold.x:state.ball.x,hold?hold.y:state.ball.y,!!state.ball.flight)}
    }
    drawWorldCupGoalCelebrationEffects(ctx);ctx.restore();
  }

  function update(ts){
    if(!state.open)return;const rawDt=state.lastTs?Math.min(.05,(ts-state.lastTs)/1000):0;state.lastTs=ts;const dt=rawDt*state.speed;
    if(state.barryOpeningActive){syncBarryOpening();state.raf=requestAnimationFrame(update);return}
    if(state.openingFilmActive){syncWorldCupOpeningFilm();state.raf=requestAnimationFrame(update);return}
    if(!isHost()&&state.syncHasAuthority){
      if(state.eventBannerTimer>0){state.eventBannerTimer-=rawDt;if(state.eventBannerTimer<=0)$('wcgEventBanner')?.classList.remove('is-visible')}
      updateWorldCupBigMoment(rawDt);if(state.crowdBoost>0)state.crowdBoost=Math.max(0,state.crowdBoost-rawDt*.16);updateRemoteInterpolation(rawDt);updateRemotePresentationTimeline();updateScoreUi();render();state.raf=requestAnimationFrame(update);return;
    }
    if(state.eventBannerTimer>0){state.eventBannerTimer-=rawDt;if(state.eventBannerTimer<=0)$('wcgEventBanner')?.classList.remove('is-visible')}updateWorldCupBigMoment(rawDt);if(state.crowdBoost>0)state.crowdBoost=Math.max(0,state.crowdBoost-rawDt*.16);
    // Replays are 100% visual. Match clock, RNG and authoritative simulation freeze until live returns.
    if(state.replayIntro||state.replay||state.replayOutro){if(state.replayIntro)updateWorldCupReplayIntro(rawDt);else if(state.replay)updateWorldCupReplay(rawDt);else updateWorldCupReplayOutro(rawDt);updateWorldCupBroadcastDirector(rawDt);updateScoreUi();render();void sendAuthoritativeSnapshot(false);state.raf=requestAnimationFrame(update);return}
    // Goal celebration choreography is also presentation time; no match actions/RNG advance.
    if(state.celebration){updateWorldCupGoalCelebration(rawDt);updateCamera(rawDt);updateWorldCupBroadcastDirector(rawDt);updateScoreUi();render();void sendAuthoritativeSnapshot(false);state.raf=requestAnimationFrame(update);return}
    if(state.phase==='intro')updateIntro(rawDt);
    else if(state.phase==='first'||state.phase==='second'){
      const liveDt=dt*LIVE_TEMPO;
      const clockRuns=!state.special&&state.delay?.reason!=='foul-stoppage';if(clockRuns){state.matchTime+=dt;if(state.possession&&state.teamStats[state.possession])state.teamStats[state.possession].possession+=dt}
      if(state.phase==='first'&&state.matchTime>=HALF_SECONDS){state.matchTime=HALF_SECONDS;beginHalftimeGate()}
      else if(state.phase==='second'&&state.matchTime>=MATCH_SECONDS){state.matchTime=MATCH_SECONDS;if(state.score.belros===state.score.zafran)beginShootout();else finishMatch(false)}
      if(state.phase==='first'||state.phase==='second'){updateMatchFlowDirector(liveDt);updateFlight(liveDt);updateDelay(liveDt);if(state.special?.type==='var')updateVar(liveDt);else if(state.special?.type==='penalty')updatePenalty(liveDt);else if(state.special?.type==='freeKick')updateFreeKick(liveDt);else if(state.special?.type==='brawl')updateBrawl(liveDt);else if(state.special?.type==='kickoffRace')updateKickoffRace(liveDt);if(!state.special&&!state.delay&&!state.ball.flight){state.actionTimer-=liveDt;if(state.actionTimer<=0)nextAction()}}
    }else if(state.phase==='halftimehold'){showHalftimeGate()}else if(state.phase==='halftime')updateHalftimePresentation(rawDt);else if(state.phase==='secondcountdown')updateSecondHalfCountdown(rawDt);else if(state.phase==='shootout'){updateFlight(dt);updateDelay(dt);if(state.special?.type==='penalty')updatePenalty(dt)}else if(state.phase==='fulltime')updateFulltimePresentation(rawDt);
    if((state.phase==='first'||state.phase==='second'||state.phase==='shootout')&&performance.now()-(state.packHeartbeatAt||0)>=10000){state.packHeartbeatAt=performance.now();window.RepoWorldCupPacks?.heartbeatFixture({...state.packFixture,phase:state.phase,elapsedSeconds:state.matchTime})}
    updateEntities((state.phase==='first'||state.phase==='second')?dt*LIVE_TEMPO:dt);updateCamera(rawDt);captureWorldCupReplayFrame(rawDt);updateWorldCupBroadcastDirector(rawDt);updateScoreUi();render();void sendAuthoritativeSnapshot(false);state.raf=requestAnimationFrame(update);
  }

  async function joinMatchChannel(){
    if(state.channel)return;let database=null;try{database=typeof db!=='undefined'?db:null}catch(_){}if(!database?.channel)return;
    const ch=database.channel(MATCH_CHANNEL,{config:{broadcast:{self:false,ack:false}}});state.channel=ch;
    ch.on('broadcast',{event:'halftime-go'},handleRemoteHalftimeGo);
    ch.on('broadcast',{event:'second-half'},()=>{if(!isHost())handleSecondHalf()});
    ch.on('broadcast',{event:'speed'},({payload})=>{if(!isHost())setSpeed(Number(payload?.speed)||1,false)});
    ch.on('broadcast',{event:'close'},()=>closeBroadcast(false));
    ch.on('broadcast',{event:'sync-state'},({payload})=>applyAuthoritativeSnapshot(payload||{}));
    ch.on('broadcast',{event:'sync-event'},({payload})=>handleRemoteMatchEvent(payload||{}));
    ch.on('broadcast',{event:'sync-presentation'},({payload})=>handleRemotePresentation(payload||{}));
    ch.on('broadcast',{event:'sync-commentary'},({payload})=>{if(isHost()||!payload||payload.fixtureId!==state.fixtureId)return;updateSyncClockOffset(payload.sentAt);say(payload.text||'',{...(payload.opts||{}),remote:true,force:true})});
    ch.on('broadcast',{event:'sync-request'},()=>{if(isHost()){void sendAuthoritativeSnapshot(true);sendPresentationCatchup()}});
    ch.subscribe(status=>{state.subscribed=status==='SUBSCRIBED';if(state.subscribed){if(isHost())void sendAuthoritativeSnapshot(true);else void sendMatch('sync-request',{fixtureId:state.fixtureId,requestedAt:Date.now()})}});
  }
  async function sendMatch(event,payload){if(!state.channel)return false;try{const r=await state.channel.send({type:'broadcast',event,payload});return r==='ok'||r===true||r?.status==='ok'}catch(_){return false}}
  async function leaveMatchChannel(){const ch=state.channel;state.channel=null;state.subscribed=false;if(!ch)return;try{const database=typeof db!=='undefined'?db:null;if(database?.removeChannel)await database.removeChannel(ch);else await ch.unsubscribe()}catch(_){}}

  function openingFilmForActiveArena(){
    const arena=activeArena();
    return WORLD_CUP_STADIUM_INTROS[arena?.id]||null;
  }


  function isBarryOpeningFixture(){
    const home=String(teamMeta?.belros?.name||'').trim().toUpperCase();
    const away=String(teamMeta?.zafran?.name||'').trim().toUpperCase();
    return home==='BELROS'&&away==='ZAFRAN';
  }

  function barryOpeningWallElapsed(){
    return Math.max(0,(Date.now()-(Number(state.startedAt)||Date.now()))/1000);
  }

  function setBarryOpeningMouth(time){
    const sprite=$('wcgBarryOpeningSprite');if(!sprite)return;
    const idx=clamp(Math.floor(Math.max(0,Number(time)||0)*10),0,WORLD_CUP_BARRY_MOUTH_CUES.length-1);
    const cue=WORLD_CUP_BARRY_MOUTH_CUES[idx]||0;
    const src=cue===0?BARRY.neutral:(cue===1?BARRY.talk[0]:BARRY.talk[1]);
    if(sprite.getAttribute('src')!==src)sprite.src=src;
  }

  function stopBarryOpening(){
    const wrap=$('wcgBarryOpening'),a=$('wcgBarryOpeningAudio'),sound=$('wcgBarryOpeningSound');
    if(a){try{a.pause()}catch(_){}a.onended=null;a.onerror=null;a.onloadedmetadata=null;a.oncanplay=null;a.playbackRate=1}
    if(sound)sound.hidden=true;
    if(wrap){wrap.classList.remove('is-visible','is-fading-out');wrap.setAttribute('aria-hidden','true')}
    $('wcWorldCupBroadcast')?.classList.remove('is-barry-opening');
    state.barryOpeningActive=false;
    setBarryOpeningMouth(0);
  }

  function finishBarryOpening(){
    if(!state.open||!state.barryOpeningActive)return;
    stopBarryOpening();state.barryOpeningDone=true;
    const filmStarted=startWorldCupOpeningFilm();
    if(!filmStarted){
      state.gameplayStartedAt=Number(state.openingFilmOriginAt)||Date.now();
      beginPreGameAfterOpeningFilm();
    }
  }

  function syncBarryOpening(){
    if(!state.barryOpeningActive)return;
    const a=$('wcgBarryOpeningAudio'),wrap=$('wcgBarryOpening');
    const elapsed=barryOpeningWallElapsed(),remaining=WORLD_CUP_BARRY_OPENING_DURATION-elapsed;
    if(wrap)wrap.classList.toggle('is-fading-out',remaining<=1.1);
    if(elapsed>=WORLD_CUP_BARRY_OPENING_DURATION-.035){finishBarryOpening();return}
    let mouthTime=elapsed;
    if(a&&a.readyState>=1){
      const drift=(Number(a.currentTime)||0)-elapsed;
      if(Math.abs(drift)>.32){try{a.currentTime=clamp(elapsed,0,Math.max(0,WORLD_CUP_BARRY_OPENING_DURATION-.08))}catch(_){}}
      mouthTime=Number(a.currentTime)||elapsed;
    }
    setBarryOpeningMouth(mouthTime);
  }

  function startBarryOpening(){
    if(!isBarryOpeningFixture())return false;
    const elapsed=barryOpeningWallElapsed();
    state.openingFilmOriginAt=(Number(state.startedAt)||Date.now())+WORLD_CUP_BARRY_OPENING_DURATION*1000;
    if(elapsed>=WORLD_CUP_BARRY_OPENING_DURATION-.035)return false;
    const wrap=$('wcgBarryOpening'),a=$('wcgBarryOpeningAudio'),sound=$('wcgBarryOpeningSound');
    if(!wrap||!a)return false;
    state.phase='barryopening';state.barryOpeningActive=true;state.barryOpeningDone=false;
    wrap.classList.add('is-visible');wrap.classList.remove('is-fading-out');wrap.setAttribute('aria-hidden','false');
    $('wcWorldCupBroadcast')?.classList.add('is-barry-opening');
    if(sound)sound.hidden=true;
    a.src=WORLD_CUP_BARRY_OPENING_AUDIO;a.preload='auto';a.loop=false;a.muted=false;audio.setElementVolume(a,.92);a.playbackRate=1;
    const align=()=>{if(!state.barryOpeningActive)return;const desired=barryOpeningWallElapsed();if(desired>=WORLD_CUP_BARRY_OPENING_DURATION-.035){finishBarryOpening();return}try{if(Math.abs((a.currentTime||0)-desired)>.10)a.currentTime=clamp(desired,0,Math.max(0,WORLD_CUP_BARRY_OPENING_DURATION-.08))}catch(_){}const p=a.play();p?.catch?.(()=>{if(sound)sound.hidden=false})};
    a.onloadedmetadata=align;a.oncanplay=()=>{if(a.paused)align()};a.onended=()=>finishBarryOpening();a.onerror=()=>{console.warn('[WORLD CUP] Barry opening-night audio failed; continuing to stadium intro.');finishBarryOpening()};
    try{a.load()}catch(_){}align();setBarryOpeningMouth(elapsed);
    return true;
  }

  function openingFilmWallElapsed(){
    return Math.max(0,(Date.now()-(Number(state.openingFilmOriginAt)||Number(state.startedAt)||Date.now()))/1000);
  }

  function stopWorldCupOpeningFilm(){
    stopBarryOpening();
    const wrap=$('wcgOpeningFilm'),video=$('wcgOpeningFilmVideo'),sound=$('wcgOpeningFilmSound');
    if(video){try{video.pause()}catch(_){}video.playbackRate=1;video.onended=null;video.onerror=null;video.removeAttribute('src');try{video.load()}catch(_){}}
    if(sound)sound.hidden=true;
    wrap?.classList.remove('is-visible','is-muted-fallback');wrap?.setAttribute('aria-hidden','true');
    $('wcWorldCupBroadcast')?.classList.remove('is-opening-film');
    state.openingFilmActive=false;state.openingFilmMutedFallback=false;state.openingFilmSrc='';state.openingFilmDuration=0;
  }

  function beginPreGameAfterOpeningFilm(){
    if(!state.open||state.phase==='closed'||state.phase==='first'||state.phase==='second')return;
    state.openingFilmActive=false;state.openingFilmDone=true;
    const wrap=$('wcgOpeningFilm'),video=$('wcgOpeningFilmVideo'),sound=$('wcgOpeningFilmSound');
    if(video){try{video.pause()}catch(_){}video.playbackRate=1;video.onended=null;video.onerror=null}
    if(sound)sound.hidden=true;
    wrap?.classList.remove('is-visible','is-muted-fallback');wrap?.setAttribute('aria-hidden','true');
    $('wcWorldCupBroadcast')?.classList.remove('is-opening-film');
    state.phase='intro';state.lastTs=0;state.introCue=-1;
    const introStart=Number(state.gameplayStartedAt)||Number(state.startedAt)||Date.now();
    state.introElapsed=clamp((Date.now()-introStart)/1000,0,INTRO_SECONDS-.08);
    audio.start();audio.startPrematch(state.introElapsed);setBroadcastState('PRE_MATCH');
    // Joiners use the same wall-clock origin, so the normal pre-match immediately lands on the same cue.
    updatePrematchPresentation();updateKickoffToss(0);updateScoreUi();render();
    if(state.introElapsed<2.1)showBanner('VELMORA QUIDDITCH WORLD CUP','',2.0);
    updateIntro(0);
  }

  function syncWorldCupOpeningFilm(){
    if(!state.openingFilmActive)return;
    const video=$('wcgOpeningFilmVideo');if(!video)return;
    const desired=openingFilmWallElapsed();
    if(desired>=Math.max(.1,state.openingFilmDuration)-.035){beginPreGameAfterOpeningFilm();return}
    if(video.readyState>=1){
      const drift=(Number(video.currentTime)||0)-desired;
      if(Math.abs(drift)>.34){try{video.currentTime=clamp(desired,0,Math.max(0,state.openingFilmDuration-.08))}catch(_){}}
      else if(drift>.10)video.playbackRate=.985;
      else if(drift<-.10)video.playbackRate=1.015;
      else video.playbackRate=1;
    }
  }

  function startWorldCupOpeningFilm(){
    const film=openingFilmForActiveArena();
    if(!film)return false;
    const duration=Math.max(.1,Number(film.duration)||22.3),elapsed=openingFilmWallElapsed();
    state.openingFilmSrc=film.src;state.openingFilmDuration=duration;
    state.gameplayStartedAt=(Number(state.openingFilmOriginAt)||Number(state.startedAt)||Date.now())+duration*1000;
    if(elapsed>=duration-.035)return false;
    const wrap=$('wcgOpeningFilm'),video=$('wcgOpeningFilmVideo'),sound=$('wcgOpeningFilmSound');if(!wrap||!video)return false;
    state.phase='openingfilm';state.openingFilmActive=true;state.openingFilmDone=false;state.openingFilmMutedFallback=false;
    wrap.classList.add('is-visible');wrap.classList.remove('is-muted-fallback');wrap.setAttribute('aria-hidden','false');$('wcWorldCupBroadcast')?.classList.add('is-opening-film');
    if(sound)sound.hidden=true;
    video.src=film.src;video.preload='auto';video.playsInline=true;video.muted=false;audio.setElementVolume(video,1);video.playbackRate=1;
    const align=()=>{if(!state.openingFilmActive)return;const desired=openingFilmWallElapsed();if(desired>=duration-.035){beginPreGameAfterOpeningFilm();return}try{if(Math.abs((video.currentTime||0)-desired)>.10)video.currentTime=clamp(desired,0,Math.max(0,duration-.08))}catch(_){}const p=video.play();p?.catch?.(()=>{if(!state.openingFilmActive)return;video.muted=true;state.openingFilmMutedFallback=true;wrap.classList.add('is-muted-fallback');if(sound)sound.hidden=false;video.play()?.catch?.(()=>{})})};
    video.onloadedmetadata=align;video.oncanplay=()=>{if(video.paused)align()};video.onended=()=>beginPreGameAfterOpeningFilm();video.onerror=()=>{console.warn('[WORLD CUP] Stadium opening film could not play; continuing to pre-game.',film.src);beginPreGameAfterOpeningFilm()};
    try{video.load()}catch(_){};align();
    return true;
  }


  function wcPackTeamName(value,fallback){
    if(typeof value==='string'&&value.trim())return value.trim();
    if(value&&typeof value==='object')return String(value.name||value.team_name||value.label||value.country||fallback||'').trim();
    return fallback;
  }
  function wcPackFixtureMeta(opts={}){
    const f=opts.fixture&&typeof opts.fixture==='object'?opts.fixture:{};
    const parsed=fixtureTeamsFromOptions(opts);
    const teamA=wcPackTeamName(opts.home||opts.teamA||f.home_team||f.home||f.team_a||f.teamA||f.left_team||f.leftTeam||f.left,parsed.home.name);
    const teamB=wcPackTeamName(opts.away||opts.teamB||f.away_team||f.away||f.team_b||f.teamB||f.right_team||f.rightTeam||f.right,parsed.away.name);
    const started=Number(opts.startedAt)||Date.now();
    const slug=value=>String(value||'team').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const date=new Date(started).toISOString().slice(0,10);
    const fixtureId=String(opts.fixtureId||f.id||f.fixture_id||f.fixtureId||f.match_id||f.matchId||f.slug||`${slug(teamA)}-${slug(teamB)}`);
    return {fixtureId,label:String(f.label||f.name||f.title||`${teamA} vs ${teamB}`),teamA,teamB,stage:String(opts.stage||f.stage||f.round||f.tournament_stage||'Group Stage'),startedAt:started,elapsedSeconds:0,date};
  }

  function setSpeed(speed,broadcast=false){state.speed=speed===4?4:1;const b=$('wcgSpeed');if(b)b.textContent=state.speed===1?'TEST SPEED ×4':'RETURN TO ×1';if(broadcast&&isHost())sendMatch('speed',{speed:state.speed})}
  function toggleSpeed(){if(!isHost())return;setSpeed(state.speed===1?4:1,true)}

  async function openBroadcast(opts={}){
    if(state.open||state.opening)return;state.opening=true;createUi();configureFixtureTeams(opts);applyFixtureUiLabels();
    state.open=true;state.opening=false;state.startedAt=Number(opts.startedAt)||Date.now();state.seed=hashSeed(`${state.startedAt}|${state.fixtureId}|${teamMeta.belros.name} vs ${teamMeta.zafran.name}|WC2026`);state.simRand=mulberry32(state.seed);state.visualRand=mulberry32(state.seed^0x9e3779b9);
    state.packFixture=wcPackFixtureMeta(opts);state.gameplayStartedAt=state.startedAt;state.phase='intro';state.introElapsed=0;state.matchTime=0;state.speed=1;state.half=1;state.firstKickoff='belros';state.score={belros:0,zafran:0};state.shootout=null;state.special=null;state.delay=null;state.celebration=null;state.varContext=null;state.actionTimer=2.5;state.ball={x:.5,y:.5,flight:null,visible:true};state.pendingPass=null;state.possessionChangedAt=performance.now();state.loreUsed=new Set();state.introCue=-1;state.presentationKey='';state.broadcastState='PRE_MATCH';state.halftimeElapsed=0;state.halftimeReady=false;state.halftimeGateReady=false;state.secondCountdown=0;state.fulltimeElapsed=0;state.fulltimeData=null;state.events=[];state.kickoffToss=null;state.kickoffReceiver=null;state.prematchAudioFailed=false;state.packRewardHandled=false;state.packHeartbeatAt=0;state.replay=null;state.replayIntro=null;state.replayOutro=null;state.replayBuffer=[];state.replayCaptureAccum=0;state.lastReplayAt=-999;state.storyGraphicTimer=34;state.storyGraphicUntil=0;state.storyGraphicIndex=0;state.bigMomentTimer=0;state.cameraDirector={shot:'MAIN',timer:3.4,lastShot:'',cutSerial:0};state.broadcast={barryPriority:0,barryUntil:0,barryState:'NEUTRAL',reactionTimer:0,talkTimer:0,speakTimer:0,speaking:false,queue:null,lastSpokenAt:0,lastPhaseCommentAt:0,phaseSeen:'',crowdLevel:.09};state.camera={x:.5,y:.5,zoom:1,tx:.5,ty:.5,tz:1,shake:0,vx:0,vy:0,vz:0,mode:'PRE_MATCH'};state.lastTs=0;state.crowdBoost=0;state.movementPulse=.1;state.director={phase:'BUILD-UP',momentum:{belros:0,zafran:0},pressure:{belros:0,zafran:0},recent:[],pulse:0};state.matchFlow=null;state.teamTactics=null;state.tacticalPulse=0;state.chanceBuild=null;state.barryOpeningActive=false;state.barryOpeningDone=false;state.openingFilmOriginAt=state.startedAt;state.openingFilmActive=false;state.openingFilmDone=false;state.openingFilmMutedFallback=false;state.openingFilmSrc='';state.openingFilmDuration=0;state.gameplayAssetsReady=false;state.gameplayAssetsFailed=false;state.realResultArmed=!!opts.realResult;state.realResultReported=false;audio.musicSequenceStarted=false;audio.currentMusic=null;audio.currentMusicIndex=-1;audio.currentMusicType='';state.syncRole=isHost()?'host':'viewer';state.syncSeq=0;state.syncEventSeq=0;state.syncPresentationSeq=0;state.syncLastSentAt=0;state.syncLastReceivedAt=0;state.syncHasAuthority=isHost();state.syncSendBusy=false;state.syncRemote=null;state.syncRemoteTargets=null;state.syncClockBase=0;state.syncClockSentAt=0;state.syncClockRunning=false;state.syncClockOffsetMs=0;state.syncClockOffsetReady=false;state.syncClockOffsetSamples=[];state.syncLastFlightKind='';state.remoteReplayFrame=null;state.remoteReplayFrameSmooth=null;state.remoteReplayStatus='';state.remoteReplayLabel='';state.syncLastEventSeq=0;state.syncLastPresentationSeq=0;state.remoteCelebrationTimeline=null;state.remoteReplayTimeline=null;state.syncCelebrationTimeline=null;state.syncReplayTimeline=null;
    resetStats();createEntities();stopWorldCupMenuAudio();
    const root=$('wcWorldCupBroadcast');root.classList.add('is-open');root.setAttribute('aria-hidden','false');window.RepoWorldCupPacks?.beginFixture({...state.packFixture,phase:'intro',elapsedSeconds:state.matchTime});$('wcgHalftime').classList.remove('is-open');$('wcgFulltime').classList.remove('is-open');hidePresentation();$('wcgVar').classList.remove('is-open','is-decision');hideWorldCupStoryCard();hideWorldCupBigMoment();$('wcgReplayBug')?.classList.remove('is-visible');$('wcgReplaySponsor')?.classList.remove('is-visible');root.classList.remove('is-replay-transition','is-replay-playback');resetBarryVisual();const atmos=$('wcgWorldCupAtmosphere');if(atmos)atmos.dataset.arena=state.ambienceId;const admin=adminEnabled();$('wcgSpeed').hidden=!admin;$('wcgSkipHalf').hidden=!admin;$('wcgAdminEvents').hidden=!admin;$('wcgAdminPanel').hidden=true;setSpeed(1,false);
    // Do not block the host's parent-page START broadcast on gameplay-image loading.
    // The 22.3s opening film gives all viewers the same wall-clock lead-in while assets preload in parallel.
    preload().then(()=>{state.gameplayAssetsReady=true;if(!state.barryOpeningActive&&!state.openingFilmActive&&state.phase==='intro')render()}).catch(error=>{state.gameplayAssetsFailed=true;console.error('[WORLD CUP] Gameplay assets failed to load',error)});
    void joinMatchChannel();
    const barryOpeningStarted=startBarryOpening();
    if(!barryOpeningStarted){
      const filmStarted=startWorldCupOpeningFilm();
      if(!filmStarted)beginPreGameAfterOpeningFilm();
    }
    updateScoreUi();state.raf=requestAnimationFrame(update);return true;
  }

  async function closeBroadcast(broadcastClose=false){
    if(!state.open)return;if(broadcastClose&&isHost())await sendMatch('close',{host:'CatAsthma'});window.RepoWorldCupPacks?.endFixture();stopWorldCupOpeningFilm();state.open=false;cancelAnimationFrame(state.raf);state.phase='closed';setBroadcastState('CLOSED');hidePresentation();hideWorldCupStoryCard();hideWorldCupBigMoment();stopBarryTalking();clearTimeout(state.broadcast?.reactionTimer);state.replay=null;state.replayIntro=null;state.replayOutro=null;state.remoteCelebrationTimeline=null;state.remoteReplayTimeline=null;state.remoteReplayFrameSmooth=null;audio.stop();await leaveMatchChannel();const root=$('wcWorldCupBroadcast');root?.classList.remove('is-open','is-replay-transition','is-replay-playback');root?.setAttribute('aria-hidden','true');try{window.dispatchEvent(new CustomEvent('repo-world-cup-broadcast-closed',{detail:{fixtureId:state.fixtureId,realResult:!!state.realResultArmed}}))}catch(_){}restoreWorldCupMenuAudio();
  }

  window.RepoSportsWorldCupGameplay={open:openBroadcast,close:closeBroadcast,syncStatus:()=>({fixtureId:state.fixtureId,role:isHost()?'AUTHORITATIVE_HOST':'SYNCHRONIZED_VIEWER',subscribed:!!state.subscribed,hasAuthority:!!state.syncHasAuthority,lastSnapshotMs:state.syncLastReceivedAt?Date.now()-state.syncLastReceivedAt:null,seq:state.syncRemote?.seq||state.syncSeq,phase:state.phase,matchTime:state.matchTime,score:{...state.score},clockOffsetMs:Math.round(state.syncClockOffsetMs||0),realResult:!!state.realResultArmed,presentation:state.remoteReplayTimeline?'REPLAY':state.remoteCelebrationTimeline?'CELEBRATION':'LIVE'})};
  window.addEventListener('repo-world-cup-live-start',e=>{const d=e.detail||{};openBroadcast({fixtureId:d.fixtureId,fixture:d.fixture,home:d.home,away:d.away,arena:d.arena,arenaId:d.arenaId,stage:d.stage,host:d.host,startedAt:d.startedAt,realResult:d.realResult===true})});
})();
