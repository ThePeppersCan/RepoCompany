/* ============================================================
   REPO SPORTS WORLD CUP — AUTOMATED QUIDDITCH BROADCAST V1
   Belros vs Zafran prototype. 50/50 team balance by construction.
   No Golden Snitch. Standard RepoSports Quidditch remains untouched.
   PREMIUM WORLD CUP BROADCAST PASS — camera director, replay, celebrations,
   live story cards, Barry reactions, ambience and World Cup-only presentation.
   ============================================================ */
(() => {
  if (window.__repoWorldCupQuidditchV1Installed) return;
  window.__repoWorldCupQuidditchV1Installed = true;

  const BASE = 'assets/world-cup-game-v1/';
  const W = 1672, H = 941;
  const INTRO_SECONDS = 30;
  const WORLD_CUP_STADIUM_INTROS = Object.freeze({
    'crown-of-vardesh-glacier':{src:BASE+'BUILDUPBELROS.mp4',duration:22.3},
    'hestholm-fjord':{src:BASE+'hestholm-intro.mp4',duration:22.3}
  });
  // Faster flight around the arena without accelerating the match clock or increasing shot probability.
  const WORLD_CUP_MOVEMENT_PACE = 1.34;
  const WORLD_CUP_REF_PACE = 1.16;
  const WORLD_CUP_RIDE_BOB_PX = 0;
  const WORLD_CUP_AIR_LIFT_PX = 24;
  const PREMATCH_ANTHEM = BASE+'prematch-anthem.mp3';
  const WORLD_CUP_KICKOFF_TRACK_1 = BASE+'world-cup-kickoff-song-1.mp3';
  const WORLD_CUP_KICKOFF_TRACK_2 = BASE+'world-cup-kickoff-song-2.mp3';
  const CLUB_MATCH_TRACKS = [BASE+'match-music.mp3', BASE+'loop.mp3', BASE+'eternal-throne.mp3', BASE+'music-3.mp3'];
  const PLAYER_RIDE_HEIGHT = 113.4, PLAYER_STAND_HEIGHT = 90.3;
  const REF_FLY_HEIGHT = 57.5, REF_STAND_HEIGHT = 55.2;
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
  // World Cup spatial-flow pass: port the mature anti-loiter/anti-pack ideas from
  // Club Mode without changing match clock, action cadence, shot/pass odds or scoring.
  const WORLD_CUP_FLOW = Object.freeze({
    minCruise:.067,
    arrivalRadius:.046,
    hoverTrigger:.22,
    escapeImpulse:.092,
    packRadius:.126,
    packTrigger:.27
  });
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

  // Six World Cup stadiums.  The opener is fixed to the Crown of Vardesh Glacier.
  // All later fixtures use one shared deterministic shuffle so every watcher sees
  // the same arena while the tournament still gets a varied stadium rotation.
  const WORLD_CUP_ARENAS = Object.freeze({
    'crown-of-vardesh-glacier':{id:'crown-of-vardesh-glacier',name:'CROWN OF VARDESH GLACIER',shortName:'the Glacier',src:BASE+'stadiums/crown-of-vardesh-glacier.png',ambience:'aurora',standingOffsetPx:0},
    'warmvein':{id:'warmvein',name:'WARMVEIN ARENA',shortName:'Warmvein',src:BASE+'stadiums/warmvein.png',ambience:'embers',standingOffsetPx:104},
    'yrsa-varn':{id:'yrsa-varn',name:'YRSA VARN WORLD STADIUM',shortName:'Yrsa Varn',src:BASE+'stadiums/yrsa-varn.png',ambience:'indoor',standingOffsetPx:110},
    'basalt-coast':{id:'basalt-coast',name:'BASALT COAST ARENA',shortName:'Basalt Coast',src:BASE+'stadiums/basalt-coast.png',ambience:'blizzard',standingOffsetPx:106},
    'hestholm-fjord':{id:'hestholm-fjord',name:'HESTHOLM FJORD ARENA',shortName:'Hestholm Fjord',src:BASE+'stadiums/hestholm-fjord-arena.png',ambience:'daylight',standingOffsetPx:114},
    'treedesh-forest':{id:'treedesh-forest',name:'TREEDESH FOREST ARENA',shortName:'Treedesh Forest',src:BASE+'stadiums/treedesh-forest.png',ambience:'aurora-forest',standingOffsetPx:102}
  });
  const WORLD_CUP_FIXTURE_ORDER = Object.freeze([
    'belros-zafran','iskandar-calvora','sorevia-lumerre','talune-kordesh',
    'norveth-qasmir','nambara-elvane','drazhen-rovarn','vardesh-marovar'
  ]);
  function shuffledArenaIds(ids,rand){
    const a=ids.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a;
  }
  function buildWorldCupArenaAssignments(){
    const map={'belros-zafran':'crown-of-vardesh-glacier'};
    const rand=mulberry32(hashSeed('REPO SPORTS WORLD CUP 2026 · STADIUM ROTATION'));
    const all=Object.keys(WORLD_CUP_ARENAS),nonOpener=all.filter(id=>id!=='crown-of-vardesh-glacier');
    let bag=shuffledArenaIds(nonOpener,rand),last='crown-of-vardesh-glacier';
    for(const fixtureId of WORLD_CUP_FIXTURE_ORDER.slice(1)){
      if(!bag.length){bag=shuffledArenaIds(all,rand);if(bag[0]===last&&bag.length>1)[bag[0],bag[1]]=[bag[1],bag[0]]}
      const arenaId=bag.shift();map[fixtureId]=arenaId;last=arenaId;
    }
    return Object.freeze(map);
  }
  const WORLD_CUP_FIXTURE_ARENAS = buildWorldCupArenaAssignments();
  function arenaForFixture(fixtureId){
    const id=String(fixtureId||'').trim().toLowerCase();
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
      id,name:String(name).toUpperCase(),displayName:String(name),role,risk:Number(opts.risk)||1,
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
      `${teamMeta.belros.name} against ${teamMeta.zafran.name}. Six players, one frozen arena, and nowhere to hide.`,
      'No Golden Snitch tonight. Goals, defending, discipline and decision-making settle this one.',
      'The temperature is brutal. The atmosphere is not. Welcome to the Repo Sports World Cup.'
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
      'The temperature is brutal. The atmosphere is not. Welcome to the Repo Sports World Cup.'
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
    broadcastState:'CLOSED', presentationKey:'', halftimeElapsed:0, halftimeReady:false, secondCountdown:0,
    fulltimeElapsed:0, fulltimeData:null, events:[], kickoffToss:null, kickoffReceiver:null, prematchAudioFailed:false,
    packFixture:null, packRewardHandled:false, packHeartbeatAt:0,
    replay:null,replayIntro:null,replayOutro:null,replayBuffer:[],replayCaptureAccum:0,lastReplayAt:-999,
    storyGraphicTimer:34,storyGraphicUntil:0,storyGraphicIndex:0,
    cameraDirector:{shot:'MAIN',timer:0,lastShot:'',cutSerial:0},
    broadcast:null,bigMomentTimer:0,arena:null,ambienceId:'crown-of-vardesh-glacier',
    openingFilmActive:false,openingFilmDone:false,openingFilmMutedFallback:false,openingFilmSrc:'',openingFilmDuration:0,gameplayStartedAt:0,gameplayAssetsReady:false,gameplayAssetsFailed:false
  };

  function blankTeamStats(){return {shots:0,onTarget:0,passes:0,completed:0,interceptions:0,rebounds:0,fouls:0,penalties:0,var:0,possession:0}}
  function resetStats(){
    state.teamStats={belros:blankTeamStats(),zafran:blankTeamStats()};
    state.playerStats=Object.fromEntries(allPlayers.map(p=>[p.id,{goals:0,assists:0,shots:0,interceptions:0,fouls:0,passes:0,completed:0,saves:0,rebounds:0}]));
  }

  function createUi(){
    if ($('wcWorldCupBroadcast')) return;
    const root=document.createElement('div');root.id='wcWorldCupBroadcast';root.setAttribute('aria-hidden','true');
    root.innerHTML=`<div id="wcgBackdropFx" class="wcg-backdrop-fx" aria-hidden="true"></div><div class="wcg-shell" role="dialog" aria-modal="true" aria-label="Repo Sports World Cup live match">
      <div id="wcgOpeningFilm" class="wcg-opening-film" aria-hidden="true"><video id="wcgOpeningFilmVideo" playsinline preload="auto"></video><button id="wcgOpeningFilmSound" type="button" hidden>CLICK FOR SOUND</button></div>
      <canvas id="wcgCanvas" class="wcg-canvas" width="${W}" height="${H}"></canvas>
      <div id="wcgSnow" class="wcg-snow" aria-hidden="true"></div>
      <div id="wcgWorldCupAtmosphere" class="wcg-worldcup-atmosphere" data-arena="crown-of-vardesh-glacier" aria-hidden="true"><i class="wcg-atmos-aurora"></i><i class="wcg-atmos-mist"></i></div>
      <div class="wcg-scorebar">
        <div class="wcg-team-score"><span class="wcg-team-badge"><span>BEL</span></span><div class="wcg-team-copy"><b>BELROS</b><small>JUD · NIMBLER 2000 · BRAMBLE</small></div><strong id="wcgScoreBelros" class="wcg-team-goals">0</strong></div>
        <div class="wcg-clock"><b id="wcgClock">PRE</b><span id="wcgPhase">WORLD CUP</span><em id="wcgArena">CROWN OF VARDESH GLACIER</em></div>
        <div class="wcg-team-score"><strong id="wcgScoreZafran" class="wcg-team-goals">0</strong><div class="wcg-team-copy"><b>ZAFRAN</b><small>ZIZI · RAFI · SAFFI</small></div><span class="wcg-team-badge"><span>ZAF</span></span></div>
      </div>
      <div class="wcg-live-chip">REPO SPORTS · LIVE</div>
      <div id="wcgReplaySponsor" class="wcg-worldcup-replay-sponsor" aria-hidden="true"><div><img src="assets/repo-sports-logo.png" alt=""><span>WORLD CUP REPLAY</span></div></div>
      <div id="wcgReplayBug" class="wcg-worldcup-replay-bug" aria-hidden="true"><b>REPLAY</b><span>SLOW MOTION · REPO SPORTS WORLD CUP</span></div>
      <div id="wcgStoryCard" class="wcg-worldcup-story-card" aria-hidden="true"><div class="wcg-worldcup-story-accent"></div><div class="wcg-worldcup-story-copy"><small id="wcgStoryKicker">WORLD CUP LIVE</small><b id="wcgStoryTitle"></b><span id="wcgStoryBody"></span></div><img id="wcgStoryPlayer" class="wcg-worldcup-story-player" alt=""></div>
      <div id="wcgWorldCupMoment" class="wcg-worldcup-big-moment" aria-hidden="true"><div class="wcg-worldcup-big-moment-flash"></div><div id="wcgWorldCupMomentParticles" class="wcg-worldcup-big-moment-particles"></div><div class="wcg-worldcup-big-moment-card"><small id="wcgWorldCupMomentKicker">REPO SPORTS WORLD CUP</small><strong id="wcgWorldCupMomentTitle">HAT TRICK</strong><b id="wcgWorldCupMomentPlayer"></b><span id="wcgWorldCupMomentTeam"></span></div></div>
      <div id="wcgPresentation" class="wcg-presentation" aria-hidden="true"><div id="wcgPresentationPanel" class="wcg-presentation-panel"><small id="wcgPresentationKicker"></small><h1 id="wcgPresentationTitle"></h1><div id="wcgPresentationBody" class="wcg-presentation-body"></div><footer id="wcgPresentationFooter"></footer></div></div>
      <div id="wcgEventBanner" class="wcg-event-banner"></div>
      <div id="wcgCommentator" class="wcg-commentator" data-barry-state="NEUTRAL"><img id="wcgBarrySprite" class="wcg-barry" src="assets/commentator-22.png" alt="Barry Bramble"><div class="wcg-comment-box"><b>BARRY BRAMBLE · REPO SPORTS</b><p id="wcgCommentary">Welcome to the Repo Sports World Cup.</p></div></div>
      <div class="wcg-mini-stats"><header><span>BELROS</span><span>LIVE MATCH STATS</span><span>ZAFRAN</span></header><div id="wcgMiniStats"></div></div>
      <div id="wcgVar" class="wcg-var-box"><div class="wcg-var-card"><b id="wcgVarTitle">VAR CHECK</b><span id="wcgVarText">Reviewing the incident…</span></div></div>
      <div id="wcgHalftime" class="wcg-overlay-card"><div class="wcg-panel"><h2 id="wcgHalfTitle">SECOND HALF READY</h2><h3 id="wcgHalfArena">CROWN OF VARDESH GLACIER · WORLD CUP 2026</h3><div class="wcg-halftime-stats"><div class="wcg-half-team"><b>BELROS</b><strong id="wcgHalfBelros">0</strong></div><div class="wcg-half-centre">9 MINUTES<br>COMPLETE<br><span id="wcgHalfShots"></span></div><div class="wcg-half-team"><b>ZAFRAN</b><strong id="wcgHalfZafran">0</strong></div></div><p id="wcgHalfCopy">Waiting for CatAsthma to continue the broadcast.</p><button id="wcgContinueHalf" type="button">CONTINUE SECOND HALF</button></div></div>
      <div id="wcgFulltime" class="wcg-overlay-card"><div class="wcg-panel"><h2 id="wcgFullTitle">FULL TIME</h2><h3 id="wcgFullSubtitle">BELROS · ZAFRAN</h3><p id="wcgFullScore"></p><div id="wcgFullStats" class="wcg-fulltime-grid"></div><div id="wcgFullPlayers" class="wcg-worldcup-player-report"></div><p id="wcgMvp"></p><button id="wcgReturnLobby" type="button">RETURN TO WAITING ROOM</button></div></div>
      <div class="wcg-controls"><button id="wcgSkipHalf" class="wcg-control wcg-admin-only" type="button" hidden>SKIP TO HALF TIME</button><button id="wcgSpeed" class="wcg-control wcg-admin-only" type="button" hidden>TEST SPEED ×4</button><button id="wcgAdminEvents" class="wcg-control wcg-admin-only" type="button" hidden>ADMIN EVENT TESTS</button><button id="wcgExit" class="wcg-control" type="button">EXIT BROADCAST</button></div><div id="wcgAdminPanel" class="wcg-admin-panel" hidden><div class="wcg-admin-title">WORLD CUP · ADMIN TEST DECK</div><div class="wcg-admin-grid"><button data-test-event="goal">GOAL</button><button data-test-event="save">SAVE</button><button data-test-event="miss">MISS</button><button data-test-event="post">POST / REBOUND</button><button data-test-event="foul">FOUL</button><button data-test-event="penalty">PENALTY</button><button data-test-event="hattrick">HAT TRICK POPUP</button><button data-test-event="penaltypopup">PENALTY POPUP</button><button data-test-event="var">VAR CHECK</button><button data-test-event="intercept">INTERCEPTION</button></div></div>
      <div class="wcg-screen-effects"></div><img class="wcg-tv-frame" src="${BASE}broadcast-tv-frame.webp" alt="" aria-hidden="true">
    </div>`;
    document.body.appendChild(root);
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
    $('wcgOpeningFilmSound')?.addEventListener('click',()=>{const v=$('wcgOpeningFilmVideo');if(!v)return;v.muted=false;v.volume=1;state.openingFilmMutedFallback=false;$('wcgOpeningFilmSound').hidden=true;v.play()?.catch?.(()=>{})});
    $('wcgContinueHalf').addEventListener('click',continueSecondHalf);
    $('wcgReturnLobby').addEventListener('click',()=>closeBroadcast(true));
    $('wcgExit').addEventListener('click',()=>closeBroadcast(true));
    $('wcgSpeed').addEventListener('click',toggleSpeed);
    $('wcgSkipHalf').addEventListener('click',skipToHalftime);
    $('wcgAdminEvents').addEventListener('click',()=>{const panel=$('wcgAdminPanel');panel.hidden=!panel.hidden});
    document.querySelectorAll('[data-test-event]').forEach(btn=>btn.addEventListener('click',()=>previewAdminEvent(btn.dataset.testEvent)));
    document.addEventListener('keydown',e=>{if(state.open&&e.key==='Escape'&&state.phase!=='halftime'){e.preventDefault();e.stopPropagation();closeBroadcast(true)}},true);
  }

  const img = src => new Promise((resolve,reject)=>{const i=new Image();i.decoding='async';i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
  function applyFixtureUiLabels(){
    const root=$('wcWorldCupBroadcast');if(!root)return;
    const teams=root.querySelectorAll('.wcg-team-score');
    if(teams[0]){
      teams[0].querySelector('.wcg-team-badge span').textContent=teamMeta.belros.abbr;
      teams[0].querySelector('.wcg-team-copy b').textContent=teamMeta.belros.name;
      teams[0].querySelector('.wcg-team-copy small').textContent=roster.belros.map(p=>p.name).join(' · ');
    }
    if(teams[1]){
      teams[1].querySelector('.wcg-team-badge span').textContent=teamMeta.zafran.abbr;
      teams[1].querySelector('.wcg-team-copy b').textContent=teamMeta.zafran.name;
      teams[1].querySelector('.wcg-team-copy small').textContent=roster.zafran.map(p=>p.name).join(' · ');
    }
    const statHeads=root.querySelectorAll('.wcg-mini-stats header span');
    if(statHeads[0])statHeads[0].textContent=teamMeta.belros.name;
    if(statHeads[2])statHeads[2].textContent=teamMeta.zafran.name;
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
    crowd:null,whistle:null,goal:null,prematch:null,intercepts:[],shots:[],rebounds:[],windCtx:null,windSource:null,
    worldCupTrack1:null,worldCupTrack2:null,clubMatchTracks:[],musicSequenceStarted:false,currentMusic:null,currentMusicIndex:-1,currentMusicType:'',
    ensure(){
      if(this.crowd)return;
      this.crowd=new Audio('assets/quidditch-crowd.mp3');this.crowd.loop=true;this.crowd.preload='auto';
      this.whistle=new Audio('assets/quidditch-kickoff-whistle.mp3');
      this.goal=new Audio('assets/quidditch-sfx/goal.mp3');
      this.prematch=new Audio(PREMATCH_ANTHEM);this.prematch.preload='auto';this.prematch.loop=false;
      this.worldCupTrack1=new Audio(WORLD_CUP_KICKOFF_TRACK_1);this.worldCupTrack1.preload='auto';this.worldCupTrack1.loop=false;
      this.worldCupTrack2=new Audio(WORLD_CUP_KICKOFF_TRACK_2);this.worldCupTrack2.preload='auto';this.worldCupTrack2.loop=false;
      this.clubMatchTracks=CLUB_MATCH_TRACKS.map(src=>{const a=new Audio(src);a.preload='auto';a.loop=false;return a;});
      this.intercepts=[1,2].map(n=>new Audio(`assets/quidditch-intercept-${n}.mp3`));
      this.shots=[1,2,3,4,5].map(n=>new Audio(`assets/quidditch-sfx/shot-${n}.mp3`));
      this.rebounds=[1,2,3,4].map(n=>new Audio(`assets/quidditch-sfx/rebound-${n}.mp3`));
    },
    play(a,vol=.55){try{if(!a)return;a.pause();a.currentTime=0;a.volume=clamp(vol,0,1);const p=a.play();p?.catch?.(()=>{})}catch(_){}},
    start(){this.ensure();try{this.crowd.volume=state.phase==='intro'?.09:state.crowdBase;this.crowd.currentTime=0;this.crowd.play()?.catch?.(()=>{})}catch(_){};this.startWind()},
    startPrematch(offset=0){this.ensure();const a=this.prematch;if(!a)return;try{a.pause();a.volume=.50;a.playbackRate=1;const begin=()=>{try{a.currentTime=clamp(offset,0,Math.max(0,(a.duration||INTRO_SECONDS)-.08));const pr=a.play();pr?.catch?.(()=>{state.prematchAudioFailed=true})}catch(_){state.prematchAudioFailed=true}};a.onended=()=>{if(state.open&&state.phase==='intro')completePrematch()};if(Number.isFinite(a.duration)&&a.duration>0)begin();else a.addEventListener('loadedmetadata',begin,{once:true})}catch(_){state.prematchAudioFailed=true}},
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
      try{a.pause();a.currentTime=0;a.loop=false;a.volume=clamp(volume,0,1);}catch(_){}
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
      try{a.pause();a.currentTime=0;a.loop=false;a.volume=.25;}catch(_){}
      const done=()=>{if(a.__repoOnEnded){a.removeEventListener('ended',a.__repoOnEnded);a.__repoOnEnded=null;}if(this.currentMusic===a)this.currentMusic=null;this.playTrackByIndex((safe+1)%tracks.length,'club');};
      a.__repoOnEnded=done;a.addEventListener('ended',done,{once:true});
      const pr=a.play();pr?.catch?.(()=>{});
    },
    pauseWorldCupMatchMusic(){const a=this.currentMusic;if(!a)return;try{a.pause()}catch(_){}},
    resumeWorldCupMatchMusic(){if(!this.musicSequenceStarted)return this.startWorldCupMatchMusic();const a=this.currentMusic;if(!a)return;const pr=a.play?.();pr?.catch?.(()=>{});},
    startWind(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC||this.windCtx)return;const ctx=new AC(),buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.42;const src=ctx.createBufferSource(),low=ctx.createBiquadFilter(),high=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=buffer;src.loop=true;low.type='lowpass';low.frequency.value=780;high.type='highpass';high.frequency.value=90;gain.gain.value=.018;src.connect(low);low.connect(high);high.connect(gain);gain.connect(ctx.destination);src.start();this.windCtx=ctx;this.windSource=src}catch(_){}} ,
    stop(){this.ensure();this.stopCurrentMusic();this.musicSequenceStarted=false;this.currentMusicIndex=-1;this.currentMusicType='';[this.crowd,this.whistle,this.goal,this.prematch,this.worldCupTrack1,this.worldCupTrack2,...(this.clubMatchTracks||[]),...this.intercepts,...this.shots,...this.rebounds].forEach(a=>{try{a.pause();a.currentTime=0}catch(_){}});try{this.windSource?.stop()}catch(_){};try{this.windCtx?.close()}catch(_){};this.windSource=null;this.windCtx=null},
    crowdHit(amount=.22){state.crowdBoost=Math.max(state.crowdBoost,amount)},
    shot(){this.ensure();this.play(this.shots[Math.floor((state.visualRand?.()||Math.random())*this.shots.length)],.48)},
    rebound(){this.ensure();this.play(this.rebounds[Math.floor((state.visualRand?.()||Math.random())*this.rebounds.length)],.55)},
    intercept(){this.ensure();this.play(this.intercepts[Math.floor((state.visualRand?.()||Math.random())*this.intercepts.length)],.46)},
    varTone(){
      try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC();const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.setValueAtTime(620,ctx.currentTime);o.frequency.setValueAtTime(440,ctx.currentTime+.16);g.gain.setValueAtTime(.045,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.42);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.45)}catch(_){}
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

  function showBanner(text,type='',seconds=1.8){const el=$('wcgEventBanner');if(!el)return;el.textContent=text;el.className='wcg-event-banner is-visible'+(type?` is-${type}`:'');state.eventBannerTimer=seconds}
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
    state.replayIntro=null;state.replay={...payload,elapsed:0};const sponsor=$('wcgReplaySponsor');sponsor?.classList.remove('is-visible');sponsor?.setAttribute('aria-hidden','true');const bug=$('wcgReplayBug');if(bug){bug.classList.add('is-visible');bug.setAttribute('aria-hidden','false')}setBroadcastState('REPLAY');
  }
  function beginWorldCupReplay(label='WORLD CUP REPLAY',frames=null,opts={}){
    if(state.replay||state.replayIntro||state.replayOutro)return false;frames=(frames||state.replayBuffer).slice(-(opts.frames||52));if(frames.length<10)return false;hideWorldCupStoryCard();const duration=opts.duration||clamp((frames.length*REPLAY_FRAME_STEP)/(opts.slow||.62),2.15,3.35),payload={frames,elapsed:0,duration,label,onDone:opts.onDone||null};state.lastReplayAt=state.matchTime;const introDuration=opts.introDuration==null?.48:opts.introDuration;
    if(introDuration>0){state.replayIntro={elapsed:0,duration:introDuration,payload};const sponsor=$('wcgReplaySponsor');if(sponsor){sponsor.querySelector('span').textContent=label;sponsor.classList.add('is-visible');sponsor.setAttribute('aria-hidden','false')}setBroadcastState('REPLAY');return true}startWorldCupReplayNow(payload);return true;
  }
  function updateWorldCupReplayIntro(dt){const s=state.replayIntro;if(!s)return;s.elapsed+=dt;if(s.elapsed>=s.duration)startWorldCupReplayNow(s.payload)}
  function finishWorldCupReplay(){
    const r=state.replay;if(!r)return;state.replay=null;const bug=$('wcgReplayBug');if(bug){bug.classList.remove('is-visible');bug.setAttribute('aria-hidden','true')}state.replayOutro={elapsed:0,duration:.48,onDone:r.onDone||null};const sponsor=$('wcgReplaySponsor');if(sponsor){sponsor.querySelector('span').textContent='BACK TO LIVE';sponsor.classList.add('is-visible');sponsor.setAttribute('aria-hidden','false')}
  }
  function updateWorldCupReplay(dt){const r=state.replay;if(!r)return;r.elapsed+=dt;if(r.elapsed>=r.duration)finishWorldCupReplay()}
  function updateWorldCupReplayOutro(dt){
    const s=state.replayOutro;if(!s)return;s.elapsed+=dt;if(s.elapsed<s.duration)return;state.replayOutro=null;const sponsor=$('wcgReplaySponsor');if(sponsor){sponsor.classList.remove('is-visible');sponsor.setAttribute('aria-hidden','true')}const done=s.onDone;done?.();if(!state.special&&!state.replay&&!state.replayIntro&&!state.replayOutro&&(state.phase==='first'||state.phase==='second'))setBroadcastState('LIVE');
  }
  function drawWorldCupReplayScene(ctx,frame){
    for(const snap of frame.entities||[]){const p=byId[snap.id],e=p?{player:p,team:entityById(p.id)?.team||'',x:snap.x,y:snap.y,dir:snap.dir,bank:snap.bank,celebrate:0}:null;if(e)drawSprite(ctx,state.assets[p.id+'Riding'],e,playerSpriteHeight(e,false),false)}
    const rr={x:frame.ref.x,y:frame.ref.y,dir:frame.ref.dir,bank:0,player:{name:'REFEREE'}};drawSprite(ctx,state.assets.refFlying,rr,REF_FLY_HEIGHT,false);if(frame.ball.visible)drawBall(ctx,frame.ball.x,frame.ball.y,frame.ball.flight);
  }

  // ---------- WORLD CUP GOAL CELEBRATION DIRECTOR ----------
  function celebrationPalette(team){
    const base=teamMeta[team]?.colour||'#d2aa36';
    return [base,'#ffe2a0','#f7f0d2',team==='belros'?'#dfefff':'#bdeaff'];
  }
  function worldCupCelebrationTargetY(offset=0){return clamp(.49+offset,FLIGHT.softY0+.09,lowerSoftLimit({player:null})-.13)}
  function makeWorldCupCelebrationParticle(c){
    const vr=()=>state.visualRand?.()||Math.random(),palette=celebrationPalette(c.team),fromLeft=vr()<.5;
    return {x:fromLeft?.045:.955,y:.26+vr()*.20,vx:(c.centerX+(vr()-.5)*.28-(fromLeft?.045:.955))/(1.6+vr()*.8),vy:-.055-vr()*.055,g:.13+vr()*.04,age:0,life:3.2+vr()*1.5,size:1.4+vr()*2.3,colour:palette[Math.floor(vr()*palette.length)],phase:vr()*Math.PI*2};
  }
  function beginWorldCupGoalCelebration(team,scorer,restartTeam,opts={}){
    const vr=()=>state.visualRand?.()||Math.random(),players=teamEntities(team),others=players.filter(e=>e!==scorer).sort((a,b)=>dist2(a,scorer)-dist2(b,scorer));
    const style=['SCORER_ORBIT','TEAM_ARC','FLY_BY','DOUBLE_SWEEP'][Math.floor(vr()*4)],fullTeam=vr()<.13;
    const participants=fullTeam?[scorer,...others]:[scorer,others[0]].filter(Boolean),aerialDuration=1.15+vr()*.38,settleDuration=.66,settledAt=aerialDuration+settleDuration;
    const duration=clamp(settledAt+(fullTeam?2.05:1.72)+vr()*.45,3.55,5.25);
    const centerX=team==='belros'?.66:.34,centerY=.49+(vr()-.5)*.025,starts={},targets={},otherStarts={},otherTargets={};
    players.forEach((e,i)=>{
      starts[e.player.id]={x:e.x,y:e.y};
      const active=participants.includes(e),slot=participants.indexOf(e),side=e===scorer?0:(slot%2?1:-1);
      if(active)targets[e.player.id]={x:safeX(centerX+(e===scorer?0:side*(.055+.018*slot))),y:worldCupCelebrationTargetY((slot-(participants.length-1)/2)*.028)};
      else targets[e.player.id]={x:safeX(centerX+(e.x<centerX?-1:1)*(.12+i*.018)),y:worldCupCelebrationTargetY((i-1)*.06)};
      e.celebrate=duration;e.intent='celebrate-aerial';
    });
    teamEntities(restartTeam).forEach((e,i)=>{
      otherStarts[e.player.id]={x:e.x,y:e.y};
      otherTargets[e.player.id]={x:restartTeam==='belros'?.43:.57,y:.40+i*.12};
      e.intent='restart-retreat';
    });
    state.ball.flight=null;state.ball.visible=false;state.carrier=null;state.pendingPass=null;state.delay=null;
    const replayFrames=(opts.replayFrames||state.replayBuffer.slice(-52)).slice();
    state.celebration={team,scorer,restartTeam,elapsed:0,duration,aerialDuration,settleDuration,settledAt,style,fullTeam,participants,starts,targets,otherStarts,otherTargets,centerX,centerY,replayFrames,varContext:opts.varContext||null,hatTrickPending:!!opts.hatTrickPending,onDone:opts.onDone||null,particles:[],nextParticleAt:.08};
    for(let i=0;i<(fullTeam?11:7);i++)state.celebration.particles.push(makeWorldCupCelebrationParticle(state.celebration));
    setBroadcastState('GOAL_CELEBRATION');$('wcWorldCupBroadcast')?.classList.add('is-goal-celebration');
    state.camera.shake=Math.max(state.camera.shake,.010);audio.crowdHit(.56);barryReaction('GOAL_REACTION',10,2300);
  }
  function finishWorldCupGoalCelebration(){
    const c=state.celebration;if(!c)return;
    teamEntities(c.restartTeam).forEach(e=>{const t=c.otherTargets[e.player.id];if(t){e.x=t.x;e.y=t.y;e.tx=t.x;e.ty=t.y;e.vx=e.vy=0;e.intent='restart-ready'}});
    state.celebration=null;$('wcWorldCupBroadcast')?.classList.remove('is-goal-celebration');
    Object.assign(state.camera,{x:.5,y:.515,zoom:1.022,tx:.5,ty:.515,tz:1.022,vx:0,vy:0,vz:0,mode:'LIVE_BROADCAST'});
    if(state.cameraDirector){state.cameraDirector.shot='MAIN';state.cameraDirector.lastShot='';state.cameraDirector.timer=2.4}
    if(c.onDone){c.onDone();return}
    if(c.varContext){startVar(c.varContext);return}
    const finish=()=>restartAfterScore(c.restartTeam);
    if(c.replayFrames?.length>=10&&beginWorldCupReplay('GOAL REPLAY',c.replayFrames,{frames:38,duration:2.55,slow:.68,introDuration:.48,onDone:finish}))return;
    finish();
  }
  function updateWorldCupGoalCelebration(dt){
    const c=state.celebration;if(!c)return;c.elapsed+=dt;
    if(c.elapsed<c.duration-.6&&c.elapsed>=(c.nextParticleAt||0)){c.particles.push(makeWorldCupCelebrationParticle(c));c.nextParticleAt=c.elapsed+.34+(state.visualRand?.()||Math.random())*.35}
    for(const p of c.particles){p.age+=dt;p.vy+=p.g*dt;p.x+=p.vx*dt+Math.sin(p.age*7+p.phase)*.004*dt;p.y+=p.vy*dt}
    c.particles=c.particles.filter(p=>p.age<p.life&&p.y<.84);
    const airU=ease(clamp(c.elapsed/Math.max(.01,c.aerialDuration),0,1)),settleU=ease(clamp((c.elapsed-c.aerialDuration)/Math.max(.01,c.settleDuration),0,1));
    for(const e of state.entities){
      const px=e.x,py=e.y;
      if(e.team===c.team){
        const s=c.starts[e.player.id]||{x:e.x,y:e.y},t=c.targets[e.player.id]||s,active=c.participants.includes(e);
        if(c.elapsed<c.aerialDuration){
          const arch=active?Math.sin(Math.PI*airU)*(.075+(e===c.scorer?.025:0)):.035*Math.sin(Math.PI*airU);
          let tx=lerp(s.x,t.x,airU),ty=lerp(s.y,t.y,airU)-arch;
          if(c.style==='SCORER_ORBIT'&&active&&e!==c.scorer){tx+=Math.sin(airU*Math.PI*1.4)*(e.x<c.centerX?-.045:.045)}
          else if(c.style==='FLY_BY'&&active&&e!==c.scorer){tx+=teamMeta[c.team].attack*Math.sin(Math.PI*airU)*.055}
          else if(c.style==='DOUBLE_SWEEP'&&active){ty-=Math.sin(airU*Math.PI*2)*.018}
          e.x=safeX(tx);e.y=clamp(ty,FLIGHT.softY0+.045,lowerSoftLimit(e)-.08);e.intent='celebrate-aerial';
        }else if(c.elapsed<c.settledAt){
          e.x=lerp(e.x,t.x,settleU);e.y=lerp(e.y,t.y,settleU);e.intent='celebration-settle';
        }else{
          const g=c.elapsed-c.settledAt,phase=(e.flowPhase||0)+(e===c.scorer?0:1.5);
          e.x=safeX(t.x+Math.sin(g*1.65+phase)*(active?.010:.006));
          e.y=clamp(t.y+Math.sin(g*2.0+phase)*.004,FLIGHT.softY0+.05,lowerSoftLimit(e)-.08);
          e.intent=active?'celebrate':'celebrate-support';
        }
      }else{
        const a=c.otherStarts[e.player.id],b=c.otherTargets[e.player.id];
        if(a&&b){const raw=clamp((c.elapsed-.25)/Math.max(1.0,c.duration-.55),0,1),q=raw*raw*(3-2*raw);e.x=lerp(a.x,b.x,q);e.y=lerp(a.y,b.y,q);e.intent='restart-retreat'}
      }
      e.vx=(e.x-px)/Math.max(.001,dt);e.vy=(e.y-py)/Math.max(.001,dt);
      if(Math.abs(e.vx)>.006){e.facing=e.vx>0?1:-1;e.dir=-e.facing}
    }
    state.ref.tx=safeX(lerp(state.ref.x,c.centerX,.28));state.ref.ty=.54;
    const r=state.ref,rx=r.x,ry=r.y,rk=1-Math.exp(-dt*2.8);r.x=lerp(r.x,r.tx,rk);r.y=lerp(r.y,r.ty,rk);r.vx=(r.x-rx)/Math.max(.001,dt);r.vy=(r.y-ry)/Math.max(.001,dt);
    if(c.elapsed>=c.duration)finishWorldCupGoalCelebration();
  }
  function drawWorldCupGoalCelebrationEffects(ctx){
    const c=state.celebration;if(!c)return;ctx.save();ctx.globalCompositeOperation='screen';
    const palette=celebrationPalette(c.team);
    for(const p of c.particles){const u=clamp(p.age/p.life,0,1);ctx.globalAlpha=(1-u)*.86;ctx.fillStyle=p.colour;const s=Math.max(2,Math.round(p.size));ctx.fillRect(Math.round(p.x*W),Math.round(p.y*H),s,s)}
    if(c.elapsed<1.5){const x=c.scorer.x*W,y=(c.scorer.y*H-WORLD_CUP_AIR_LIFT_PX),ring=18+c.elapsed*48;ctx.globalAlpha=Math.max(0,.30-c.elapsed*.16);ctx.strokeStyle=palette[1];ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,ring,0,Math.PI*2);ctx.stroke()}
    ctx.restore();
  }

  // ---------- WORLD CUP BROADCAST / CAMERA DIRECTOR ----------
  function cameraBoundsForZoom(z){const hx=.5/z,hy=.5/z;return {x0:hx,x1:1-hx,y0:hy,y1:1-hy}}
  function updateWorldCupCameraDirector(dt){
    const d=state.cameraDirector||(state.cameraDirector={shot:'MAIN',timer:0,lastShot:'',cutSerial:0});if(state.replay||state.replayIntro||state.replayOutro||state.celebration||state.special)return;d.timer-=dt;if(d.timer>0)return;const phase=state.director?.phase||'BUILD-UP',flight=state.ball.flight;let choices=['MAIN','WIDE'];if(flight?.meta?.kind==='shot'||phase==='GOAL CHANCE')choices=['CLOSE_ATTACK','GOAL_END','MAIN'];else if(phase==='COUNTERATTACK')choices=['TRACKING','WIDE','MAIN'];else if(phase==='ATTACK')choices=['TRACKING','MAIN','WIDE'];const pool=choices.filter(x=>x!==d.lastShot);const use=pool.length?pool:choices;d.shot=use[Math.floor((state.visualRand?.()||Math.random())*use.length)]||'MAIN';d.lastShot=d.shot;d.cutSerial++;d.timer=(d.shot==='WIDE'?6.2:4.2)+(state.visualRand?.()||Math.random())*2.8;
  }
  function worldCupCameraFramePoints(){
    const pts=[],carrier=state.carrier,flight=state.ball.flight,ball=flight?state.ball:(carrier||state.ball);if(ball)pts.push({x:ball.x,y:ball.y,w:1.7});if(carrier)pts.push({x:carrier.x,y:carrier.y,w:1.55});if(flight?.meta?.receiver)pts.push({x:flight.meta.receiver.x,y:flight.meta.receiver.y,w:1.1});if(flight?.meta?.challenger)pts.push({x:flight.meta.challenger.x,y:flight.meta.challenger.y,w:1.15});if(carrier){teamEntities(other(carrier.team)).slice().sort((a,b)=>dist2(a,carrier)-dist2(b,carrier)).slice(0,2).forEach((e,i)=>pts.push({x:e.x,y:e.y,w:i?.72:1.02}));teamEntities(carrier.team).filter(e=>e!==carrier&&dist2(e,carrier)<.30).forEach(e=>pts.push({x:e.x,y:e.y,w:.55}))}return pts;
  }
  function updateWorldCupBroadcastDirector(dt){
    const b=state.broadcast;if(!b)return;const phase=state.director?.phase||'BUILD-UP',targetByPhase={'BUILD-UP':.14,ATTACK:.20,COUNTERATTACK:.29,'GOAL CHANCE':.38,RESET:.19,'SET PIECE':.25};let target=targetByPhase[phase]||.17;if(state.celebration)target=.60;if(state.special?.type==='var')target=.12;if(state.replay||state.replayIntro||state.replayOutro)target=.16;if(state.phase==='intro')target=.09;b.crowdLevel=lerp(Number(b.crowdLevel)||.12,clamp(target+state.crowdBoost,0,.68),1-Math.exp(-dt*1.8));if(audio.crowd)audio.crowd.volume=clamp(b.crowdLevel,0,.68);
    if((state.phase==='first'||state.phase==='second')&&!state.special&&!state.celebration&&!state.replay&&!state.replayIntro&&!state.replayOutro&&phase!==b.phaseSeen){b.phaseSeen=phase;const now=performance.now();if(now-(b.lastPhaseCommentAt||0)>6500&&state.carrier){if(phase==='COUNTERATTACK'){b.lastPhaseCommentAt=now;say(`${state.carrier.player.name} turns this into a World Cup counter — ${teamMeta[state.carrier.team].name} are flying forward.`,{priority:4,intensity:'interested'})}else if(phase==='GOAL CHANCE'){b.lastPhaseCommentAt=now;say(`${state.carrier.player.name} is into the danger area. The crowd rises with the chance.`,{priority:5,intensity:'excited'})}}
    }
    updateWorldCupStoryGraphics(dt);
  }
  function playerSpriteHeight(e,standing=false){const base=standing?PLAYER_STAND_HEIGHT:PLAYER_RIDE_HEIGHT;return base*(PLAYER_SCALE[e?.player?.id]||1)}
  function recordEvent(type,data={},weight=1){state.events.push({type,data,weight,time:state.matchTime,half:state.half,score:{...state.score}});if(state.events.length>80)state.events.shift()}
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
    else if(remaining>5){setBroadcastState('PRE_MATCH');showPresentation('pre-arena','LIVE FROM VARDESH',activeArena().name,'<p class="wcg-arena-copy">Frozen stands. Full crowd. The referee has the Quaffle and both teams are set.</p>','MUSIC BUILDING · KICKOFF NEXT','arena')}
    else {const n=Math.max(1,Math.ceil(remaining));setBroadcastState('KICKOFF_COUNTDOWN');showPresentation(`pre-count-${n}`,'KICKOFF',String(n),'<div class="wcg-count-copy">REFEREE READY · QUAFFLE IN HAND</div>','QUILL ON!','countdown')}
  }
  function refStandingBallPoint(){const image=state.assets.refStanding,h=REF_STAND_HEIGHT,w=image?h*(image.width/image.height):h*.56;return {x:state.ref.x+(w*.34)/W,y:state.ref.y+(h*.08)/H}}
  function updateKickoffToss(dt){
    const remain=INTRO_SECONDS-state.introElapsed;if(remain>1.2){const h=refStandingBallPoint();state.ball.x=h.x;state.ball.y=h.y;state.ball.visible=true;return}
    if(!state.kickoffToss){const h=refStandingBallPoint();state.kickoffToss={elapsed:0,duration:1.18,sx:h.x,sy:h.y,tx:.5,ty:.535};showBanner('REFEREE RELEASES THE QUAFFLE','',1.1)}
    const k=state.kickoffToss;k.elapsed=Math.min(k.duration,k.elapsed+dt);const t=clamp(k.elapsed/k.duration,0,1),q=ease(t);state.ball.x=lerp(k.sx,k.tx,q);state.ball.y=lerp(k.sy,k.ty,q)-Math.sin(Math.PI*t)*.022;state.ball.visible=true;
  }
  function completePrematch(){if(state.phase!=='intro')return;state.introElapsed=INTRO_SECONDS;updateKickoffToss(.2);hidePresentation();state.firstKickoff=state.simRand()<.5?'belros':'zafran';beginKickoff(state.firstKickoff,false)}
  function halftimeSummary(){const a=state.teamStats.belros,b=state.teamStats.zafran;if(state.score.belros!==state.score.zafran){const lead=state.score.belros>state.score.zafran?teamMeta.belros.name:teamMeta.zafran.name;return `${lead} take the advantage into the interval. The first half produced ${a.shots+b.shots} shots and ${a.interceptions+b.interceptions} interceptions.`}return `Level at the interval. ${a.shots+b.shots} shots and ${a.interceptions+b.interceptions} interceptions tell the story of a closely fought first half.`}
  function halftimeStatsMarkup(){const a=state.teamStats.belros,b=state.teamStats.zafran,tot=Math.max(.001,a.possession+b.possession),pa=Math.round(a.possession/tot*100),pb=100-pa;return `<div class="wcg-broadcast-stats"><div><b>${a.shots}</b><span>SHOTS</span><b>${b.shots}</b></div><div><b>${pa}%</b><span>POSSESSION</span><b>${pb}%</b></div><div><b>${a.interceptions}</b><span>INTERCEPTIONS</span><b>${b.interceptions}</b></div><div><b>${a.completed}</b><span>SUCCESSFUL PASSES</span><b>${b.completed}</b></div><div><b>${a.fouls}</b><span>FOULS</span><b>${b.fouls}</b></div></div>`}
  function updateHalftimePresentation(dt){
    state.halftimeElapsed+=dt;const t=state.halftimeElapsed;
    if(t<3){setBroadcastState('HALFTIME');showPresentation('half-score','HALF TIME',scoreLine(),'<div class="wcg-half-big">9 MINUTES COMPLETE</div>',activeArena().name,'halftime')}
    else if(t<6){setBroadcastState('HALFTIME_STATS');showPresentation('half-stats','FIRST HALF','MATCH STATISTICS',halftimeStatsMarkup(),'LIVE SIMULATION DATA','stats')}
    else if(t<9){const p=playerOfPeriod(1),s=state.playerStats[p.id];showPresentation('half-player','PLAYER OF THE HALF',p.name,`<div class="wcg-player-half"><img src="${p.standing}" alt=""><p>${s.goals} GOALS · ${s.interceptions} INTERCEPTIONS · ${s.completed} COMPLETED PASSES</p></div>`,'SELECTED FROM FIRST-HALF IMPACT','player')}
    else if(t<12){const ev=bestEvent(1);showPresentation('half-moment','MOMENT OF THE HALF',ev?ev.type.toUpperCase():'TACTICAL BATTLE',`<p class="wcg-moment-copy">${eventDescription(ev)}</p>`,'BASED ON STORED MATCH EVENTS','moment')}
    else if(t<15){showPresentation('half-commentary','BARRY BRAMBLE · HALF-TIME',state.score.belros===state.score.zafran?'ALL SQUARE':'ADVANTAGE AT THE BREAK',`<p class="wcg-moment-copy">${halftimeSummary()}</p>`,'THE SECOND HALF AWAITS','summary')}
    else if(!state.halftimeReady){state.halftimeReady=true;hidePresentation();setBroadcastState('HALFTIME_READY');$('wcgHalfTitle').textContent='SECOND HALF READY';$('wcgHalfBelros').textContent=state.score.belros;$('wcgHalfZafran').textContent=state.score.zafran;$('wcgHalfShots').textContent=`SHOTS ${state.teamStats.belros.shots}-${state.teamStats.zafran.shots}`;$('wcgContinueHalf').hidden=!isHost();$('wcgHalfCopy').textContent=isHost()?'CatAsthma must continue the match.':'Waiting for host · CatAsthma must continue the match.';$('wcgHalftime').classList.add('is-open')}
  }
  function updateSecondHalfCountdown(dt){state.secondCountdown=Math.max(0,state.secondCountdown-dt);const n=Math.max(1,Math.ceil(state.secondCountdown));showPresentation(`second-${n}`,'SECOND HALF',String(n),'<div class="wcg-count-copy">PLAYERS SET · REFEREE READY</div>','PLAY!','countdown');if(state.secondCountdown<=0){hidePresentation();beginKickoff(other(state.firstKickoff),true)}}
  function fulltimeMomentMarkup(){const ev=bestEvent(null);return `<p class="wcg-moment-copy">${eventDescription(ev)}</p>`}
  function updateFulltimePresentation(dt){state.fulltimeElapsed+=dt;const data=state.fulltimeData;if(!data)return;const t=state.fulltimeElapsed;if(t<3){showPresentation('full-score','FULL TIME',scoreLine(),`<div class="wcg-half-big">${teamMeta[data.winner].name} ${data.fromShootout?'WIN ON PENALTIES':'WIN'}</div>`,`FINAL WHISTLE · ${activeArena().name}`,'fulltime')}else if(t<6){const p=data.mvp,s=state.playerStats[p.id];showPresentation('full-mvp','PLAYER OF THE MATCH',p.name,`<div class="wcg-player-half"><img src="${p.standing}" alt=""><p>${s.goals} GOALS · ${s.assists} ASSISTS · ${s.interceptions} INTERCEPTIONS</p></div>`,'MATCH IMPACT · LIVE STATS','player')}else if(t<9){showPresentation('full-moment','MATCH MOMENT',bestEvent()?.type.toUpperCase()||'FINAL WHISTLE',fulltimeMomentMarkup(),'THE MOMENT THAT DEFINED THE MATCH','moment')}else if(!$('wcgFulltime').classList.contains('is-open')){hidePresentation();populateFulltimePanel(data);$('wcgFulltime').classList.add('is-open');setBroadcastState('POST_MATCH');if(!state.packRewardHandled){state.packRewardHandled=true;setTimeout(()=>window.RepoWorldCupPacks?.completeFixture({...state.packFixture,phase:'fulltime',elapsedSeconds:Math.max(MATCH_SECONDS,state.matchTime)}),1700)}}}
  function updateScoreUi(){
    $('wcgScoreBelros').textContent=state.score.belros;$('wcgScoreZafran').textContent=state.score.zafran;
    let t=state.matchTime,phase='1ST HALF';
    if(state.phase==='intro'){ $('wcgClock').textContent=`-${Math.max(0,Math.ceil(INTRO_SECONDS-state.introElapsed))}`;phase='PRE-MATCH'; }
    else { if(state.phase==='second')phase='2ND HALF';else if(state.phase==='halftime')phase='HALF TIME';else if(state.phase==='secondcountdown')phase='2ND HALF SOON';else if(state.phase==='shootout')phase='PENALTIES';else if(state.phase==='fulltime')phase='FULL TIME'; const m=Math.floor(t/60),s=Math.floor(t%60);$('wcgClock').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
    $('wcgPhase').textContent=phase;
    const a=state.teamStats.belros,b=state.teamStats.zafran;
    const possTotal=Math.max(.001,a.possession+b.possession),pa=Math.round(a.possession/possTotal*100),pb=100-pa;
    $('wcgMiniStats').innerHTML=`<div class="wcg-stat-row"><span>${a.shots}</span><b>SHOTS</b><span>${b.shots}</span></div><div class="wcg-stat-row"><span>${a.onTarget}</span><b>ON TARGET</b><span>${b.onTarget}</span></div><div class="wcg-stat-row"><span>${pa}%</span><b>POSSESSION</b><span>${pb}%</span></div><div class="wcg-stat-row"><span>${a.interceptions}</span><b>INTERCEPTS</b><span>${b.interceptions}</span></div><div class="wcg-stat-row"><span>${a.fouls}</span><b>FOULS</b><span>${b.fouls}</span></div><div class="wcg-stat-row"><span>${a.var}</span><b>VAR</b><span>${b.var}</span></div>`;
  }

  function createEntities(){
    state.entities=[];
    const groundY=.685;
    const belrosX=[.27,.34,.41], zafranX=[.73,.66,.59];
    const profiles={
      jud:{personality:'tactical',speed:.91,accel:.90,turn:.90,passing:.82,catching:.86,shooting:.68,interception:.96,awareness:.97,positioning:.97,reaction:.91,anticipation:.97,decision:.94,composure:.94,aggression:.82,stamina:.94,recovery:.91},
      nimbler:{personality:'aggressive',speed:.99,accel:.99,turn:.96,passing:.87,catching:.91,shooting:.96,interception:.76,awareness:.74,positioning:.80,reaction:.94,anticipation:.89,decision:.79,composure:.84,aggression:.98,stamina:.90,recovery:.94},
      bramble:{personality:'cautious',speed:.90,accel:.91,turn:.88,passing:.91,catching:.94,shooting:.82,interception:.84,awareness:.91,positioning:.94,reaction:.86,anticipation:.88,decision:.93,composure:.95,aggression:.70,stamina:.97,recovery:.90},
      zizi:{personality:'creative',speed:.98,accel:.98,turn:.98,passing:.94,catching:.89,shooting:.92,interception:.77,awareness:.83,positioning:.88,reaction:.95,anticipation:.95,decision:.92,composure:.91,aggression:.84,stamina:.91,recovery:.95},
      rafi:{personality:'tactical',speed:.89,accel:.88,turn:.91,passing:.84,catching:.90,shooting:.70,interception:.97,awareness:.98,positioning:.98,reaction:.90,anticipation:.98,decision:.96,composure:.97,aggression:.72,stamina:.96,recovery:.92},
      saffi:{personality:'creative',speed:.92,accel:.93,turn:.95,passing:.97,catching:.93,shooting:.83,interception:.82,awareness:.91,positioning:.93,reaction:.90,anticipation:.95,decision:.96,composure:.94,aggression:.72,stamina:.95,recovery:.91}
    };
    const makeEntity=(p,team,x,i)=>{
      const a=profiles[p.id]||{
        personality:p.role==='attacker'?'aggressive':p.role==='defender'?'tactical':'creative',
        speed:.93,accel:.93,turn:.93,passing:.90,catching:.90,shooting:.86,interception:.88,
        awareness:.90,positioning:.90,reaction:.90,anticipation:.90,decision:.90,composure:.90,
        aggression:.80,stamina:.94,recovery:.92
      };
      return {player:p,team,x,y:groundY,vx:0,vy:0,ax:0,ay:0,tx:x,ty:groundY,
        facing:teamMeta[team].attack,dir:-teamMeta[team].attack,bank:0,celebrate:0,intent:'shape',mark:null,currentThreat:null,
        personality:a.personality,attributes:a,form:0,fatigue:0,mistakes:0,recentSuccess:0,
        maxSpeed:(p.role==='attacker'?.205:p.role==='defender'?.19:.198)*(0.88+a.speed*.16),
        accel:(p.role==='attacker'?.74:.68)*(0.86+a.accel*.20),turnRate:(p.role==='attacker'?5.6:5.0)*(0.85+a.turn*.22),
        wander:(i-1)*.37,decisionNoise:(state.simRand?.()||.5)-.5,decisionClock:.05+(state.simRand?.()||.5)*.12,
        recoveryTarget:null,lastIntent:'shape',lastDecisionAt:0,edgeStall:0,
        hoverTime:0,flowSign:((i%2)?1:-1)*(team==='belros'?1:-1),
        flowPhase:(state.simRand?.()||.5)*Math.PI*2,
        packCrowdTime:0,packDisperseTime:0,packDisperseTarget:null};
    };
    roster.belros.forEach((p,i)=>state.entities.push(makeEntity(p,'belros',belrosX[i],i)));
    roster.zafran.forEach((p,i)=>state.entities.push(makeEntity(p,'zafran',zafranX[i],i)));
    state.ref={x:.5,y:.685,vx:0,vy:0,tx:.5,ty:.685,dir:1,maxSpeed:.175,accel:.58,edgeStall:0};
  }
  function entityById(id){return state.entities.find(e=>e.player.id===id)}
  function teamEntities(team){return state.entities.filter(e=>e.team===team)}
  function rolePlayer(team,role){return teamEntities(team).find(e=>e.player.role===role)||teamEntities(team)[0]}

  function setNormalFormation(){
    if(!state.carrier)return;
    refreshMovementTargets(true);
  }
  function setPossession(team,carrier,zone=.15){const changed=state.possession!==team;state.possession=team;state.carrier=carrier;state.zone=zone;state.passesSinceShot=0;state.lastPasser=null;state.ball.visible=true;state.pendingPass=null;if(changed)state.possessionChangedAt=performance.now();setNormalFormation()}

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
    const from=state.carrier;if(!from){scheduleNext();return}
    const team=from.team,opp=other(team),dir=teamMeta[team].attack,choices=teamEntities(team).filter(e=>e!==from);
    const ranked=choices.map(to=>{const defenders=teamEntities(opp),space=Math.min(...defenders.map(d=>dist2(to,d))),forward=(to.x-from.x)*dir,lane=passingLaneRisk(from,to,opp),a=from.attributes||{};return {to,score:forward*.36+space*.54-lane*.62+(a.passing||.85)*.08+(state.simRand()-.5)*.055}}).sort((a,b)=>b.score-a.score);
    const to=ranked[0]?.to||weightedPlayer(team,from);state.teamStats[team].passes++;state.playerStats[from.player.id].passes++;state.passesSinceShot++;
    const defenders=teamEntities(opp),passerA=from.attributes||{},receiverA=to.attributes||{};
    // Pass into space: weight the target by receiver movement, anticipation and passer quality.
    const lead=.055+.055*(receiverA.anticipation||.85)+.018*(passerA.passing||.85);
    to.tx=safeX(to.x+dir*lead+to.vx*.20);to.ty=safeY(to.y+to.vy*.24+(state.simRand()-.5)*(.09-.035*(passerA.decision||.85)));
    const start=ballHoldPoint(from),target={x:to.tx,y:to.ty};
    const laneScore=d=>{
      const vx=target.x-start.x,vy=target.y-start.y,len2=vx*vx+vy*vy||.001;
      const q=clamp(((d.x-start.x)*vx+(d.y-start.y)*vy)/len2,0,1),px=start.x+vx*q,py=start.y+vy*q;
      const laneDist=Math.hypot(d.x-px,d.y-py),goalSide=(opp==='belros'?d.x<from.x:d.x>from.x)?-.015:0;
      return laneDist+Math.abs(q-.58)*.045+goalSide+(state.simRand()-.5)*.018;
    };
    const challenger=[...defenders].sort((a,b)=>laneScore(a)-laneScore(b))[0];
    const risk=(from.player.risk-1)*.07,distToLane=Math.min(...defenders.map(laneScore)),ca=challenger?.attributes||{};
    const readWindow=.155+.05*(ca.anticipation||.85),attemptChance=.22+.21*(ca.interception||.85)+.15*(ca.anticipation||.85)-distToLane*1.35+risk;
    const attempt=distToLane<readWindow && state.simRand()<clamp(attemptChance,.06,.62);
    const passDist=Math.hypot(target.x-start.x,target.y-start.y),duration=clamp(.48+passDist*1.05,.54,.92);
    state.pendingPass={from,to,challenger:attempt?challenger:null};audio.shot();
    startFlight(start,target,duration,.032,()=>{
      if(attempt&&challenger){challenger.intent='recover';challenger.tx=safeX(lerp(challenger.x,opp==='belros'?.11:.89,.20));challenger.ty=safeY(challenger.y+(state.simRand()-.5)*.055);challenger.form=clamp((challenger.form||0)-.008,-.12,.12)}
      state.pendingPass=null;state.teamStats[team].completed++;state.playerStats[from.player.id].completed++;from.form=clamp((from.form||0)+.006,-.12,.12);state.lastPasser=from;state.carrier=to;state.possession=team;
      state.zone=clamp(state.zone+.065+.045*state.simRand(),.1,.94);eventLine('pass',{from:from.player.name,to:to.player.name},to.player,.05);
      setNormalFormation();scheduleNext();
    },{kind:'pass',from,receiver:to,defenders,challenger:attempt?challenger:null,resolved:false});
  }

  function performDrive(){
    const e=state.carrier;if(!e){scheduleNext();return}state.zone=clamp(state.zone+.15+.11*state.simRand(),.08,.97);e.tx=clamp(e.tx+teamMeta[e.team].attack*(.075+.025*state.simRand()),.18,.82);e.ty=clamp(e.ty+(state.simRand()-.5)*.12,.34,.70);eventLine('drive',{pet:e.player.name},e.player,.08);setNormalFormation();scheduleNext(.9,1.55);
  }

  const hoops={
    belros:[{x:.882,y:.529},{x:.902,y:.467},{x:.923,y:.529}],
    zafran:[{x:.077,y:.529},{x:.098,y:.467},{x:.118,y:.529}]
  };

  function chooseShotOutcome(shooter,penalty=false){
    const a=shooter.attributes||{},speed=Math.hypot(shooter.vx,shooter.vy),defenders=teamEntities(other(shooter.team)),pressure=Math.min(...defenders.map(d=>dist2(shooter,d))),goalX=shooter.team==='belros'?.91:.09,distGoal=Math.abs(goalX-shooter.x);
    const pressurePenalty=clamp((.16-pressure)*.72,0,.10),distancePenalty=clamp((distGoal-.18)*.18,0,.055),motionPenalty=clamp(speed-.13,0,.08)*.22;
    if(penalty){const quality=.58+.16*(a.shooting||.85)+.08*(a.composure||.85)+(shooter.form||0);const r=state.simRand();return r<clamp(quality,.61,.82)?'goal':r<.88?'save':r<.95?'post':'miss'}
    const roleBoost=shooter.player.role==='attacker'?.025:shooter.player.role==='defender'?-.015:0,quality=.07*(a.shooting||.85)+.045*(a.composure||.85)+(shooter.form||0)*.18;
    const goalP=clamp(.145+state.zone*.15+roleBoost+quality-pressurePenalty-distancePenalty-motionPenalty,.14,.43),saveP=clamp(.19+pressurePenalty*.5,.15,.25),postP=.15;const r=state.simRand();return r<goalP?'goal':r<goalP+saveP?'save':r<goalP+saveP+postP?'post':'miss';
  }

  function performShot(opts={}){
    const shooter=opts.shooter||state.carrier;if(!shooter)return;
    // Normal shots are only allowed from the attacker's half of the pitch, close enough
    // to the hoops to feel like a real scoring chance. Admin penalty previews bypass this.
    if(!opts.penalty && ((shooter.team==='belros' && (state.zone<.58 || shooter.x<.52)) || (shooter.team==='zafran' && (state.zone<.58 || shooter.x>.48)))) {
      performDrive(); return;
    }
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
    const carrier=teamEntities(team)[Math.floor(state.simRand()*3)];teamEntities(team).forEach((e,i)=>{e.tx=team==='belros'?.43:.57;e.ty=.40+i*.12});teamEntities(other(team)).forEach((e,i)=>{e.tx=team==='belros'?.61:.39;e.ty=.40+i*.12});setPossession(team,carrier,.13);state.camera.tx=.5;state.camera.ty=.5;state.camera.tz=1.015;scheduleNext(.9,1.6);
  }

  function performFoul(offender=null){
    const victim=state.carrier;if(!victim){scheduleNext();return}offender=offender||teamEntities(other(victim.team)).slice().sort((a,b)=>dist2(a,victim)-dist2(b,victim))[0];if(!offender||dist2(offender,victim)>.13){scheduleNext(.45,.8);return}state.teamStats[offender.team].fouls++;state.playerStats[offender.player.id].fouls++;recordEvent('foul',{player:offender.player.name,team:offender.team,victim:victim.player.name},2.4);offender.form=clamp((offender.form||0)-.018,-.12,.12);offender.tx=victim.x;offender.ty=victim.y;state.ref.tx=clamp(victim.x+.025,.2,.8);state.ref.ty=clamp(victim.y-.08,.3,.7);audio.ensure();audio.play(audio.whistle,.62);audio.crowdHit(.15);state.camera.shake=.008;showBanner(`FOUL · ${offender.player.name}`,'danger',1.8);eventLine('foul',{offender:offender.player.name,victim:victim.player.name},offender.player,.08);
    const inDanger=state.zone>.62,possiblePenalty=inDanger&&state.simRand()<.58;
    if(possiblePenalty && state.simRand()<.30){state.delay={t:1.2,cb:()=>startVar({kind:'foul',team:victim.team,offender,victim,possiblePenalty:true,replayFrames:state.replayBuffer.slice(-46)})};}
    else if(possiblePenalty){state.delay={t:1.1,cb:()=>startPenalty(victim.team,false)};}
    else {state.delay={t:1.2,cb:()=>{setPossession(victim.team,victim,clamp(state.zone-.04,.12,.9));scheduleNext(.75,1.4)}};}
  }

  function startVar(ctx){
    if(state.special)return;if(ctx?.replayFrames?.length&&!ctx.replayShown){const next={...ctx,replayShown:true};if(beginWorldCupReplay('VAR REVIEW',ctx.replayFrames,{frames:48,slow:.50,introDuration:.58,onDone:()=>startVar(next)}))return}
    recordEvent('var',{team:ctx.team,kind:ctx.kind},4.0);state.special={type:'var',elapsed:0,duration:4.8,ctx,decisionShown:false};state.varContext=ctx;state.teamStats[ctx.team].var++;state.camera.tx=ctx.kind==='goal'?(ctx.team==='belros'?.54:.46):clamp((ctx.victim?.x||.5)-.5,-.04,.04)+.5;state.camera.ty=ctx.victim?.y||.52;state.camera.tz=1.075;state.ref.tx=ctx.victim?.x||((ctx.team==='belros')?.84:.16);state.ref.ty=ctx.victim?.y||.54;
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

  function startPenalty(team,shootout=false){
    if(!shootout)state.teamStats[team].penalties++;
    const shooter=teamEntities(team).find(e=>e.player.role==='attacker')||teamEntities(team)[0];state.special={type:'penalty',elapsed:0,team,shooter,shootout,shot:false};if(!shootout)triggerWorldCupBigMoment('penalty',shooter.player,team);
    const dir=teamMeta[team].attack;shooter.tx=team==='belros'?.72:.28;shooter.ty=.52;teamEntities(team).filter(e=>e!==shooter).forEach((e,i)=>{e.tx=.5-dir*.08;e.ty=.39+i*.24});teamEntities(other(team)).forEach((e,i)=>{e.tx=.5+dir*.08;e.ty=.39+i*.12});state.ref.tx=.5;state.ref.ty=.42;state.camera.tx=team==='belros'?.535:.465;state.camera.ty=.52;state.camera.tz=1.06;showBanner(shootout?'SHOOTOUT PENALTY':`PENALTY · ${teamMeta[team].name}`,'danger',2.0);eventLine('penalty',{team:teamMeta[team].name,pet:shooter.player.name},shooter.player,.06);audio.ensure();audio.play(audio.whistle,.55);
  }
  function updatePenalty(dt){
    const s=state.special;if(!s||s.type!=='penalty')return;s.elapsed+=dt;
    if(s.elapsed>=1.45&&!s.shot){s.shot=true;const shooter=s.shooter,team=s.team,shootout=s.shootout;state.special=null;state.carrier=shooter;state.possession=team;performShot({shooter,team,penalty:true,shootout});}
  }

  function nextAction(){
    if(state.phase!=='first'&&state.phase!=='second')return;if(state.special||state.delay||state.ball.flight)return;
    if(!state.carrier){setPossession(state.possession,weightedPlayer(state.possession),.15)}
    const nearestDef=teamEntities(other(state.carrier.team)).slice().sort((a,b)=>dist2(a,state.carrier)-dist2(b,state.carrier))[0],contact=nearestDef?dist2(nearestDef,state.carrier):1,aggr=nearestDef?.attributes?.aggression||.7;
    const foulChance=contact<.09?clamp(.012+(aggr-.65)*.09+Math.max(0,.05-contact)*.8,.005,.075):0;
    if(foulChance&&state.simRand()<foulChance){performFoul(nearestDef);return}
    const shotChance=state.zone>.58 ? .10 + state.passesSinceShot*.095 + state.zone*.12 + (state.carrier.attributes?.decision||.85)*.025 : .008;
    if(state.simRand()<clamp(shotChance,.02,.63)){performShot();return}
    if(state.simRand()<.24){performDrive();return}
    performPass();
  }

  function beginKickoff(team,second=false){
    state.phase=second?'second':'first';state.half=second?2:1;setBroadcastState('LIVE');const receiver=teamEntities(team)[second?1:0];state.possession=team;state.carrier=null;state.kickoffReceiver=receiver;state.zone=.12;state.passesSinceShot=0;state.lastPasser=null;state.camera.tx=.5;state.camera.ty=.5;state.camera.tz=1.015;audio.ensure();try{if(audio.prematch){audio.prematch.pause();audio.prematch.currentTime=0}if(audio.crowd)audio.crowd.volume=state.crowdBase}catch(_){}audio.play(audio.whistle,.62);audio.startWorldCupMatchMusic();audio.crowdHit(.16);showBanner(second?'SECOND HALF · PLAY!':'QUILL ON!','',1.8);say(formatLine('kickoff'));
    const from=second?{x:.5,y:.56}:{x:state.ball.x||.5,y:state.ball.y||.535};receiver.intent='receive';receiver.tx=safeX(.5+(team==='belros'?-.025:.025));receiver.ty=.575;state.ball.visible=true;
    startFlight(from,{x:receiver.tx,y:receiver.ty},second?.62:.78,-.025,()=>{state.kickoffReceiver=null;setPossession(team,receiver,.12);scheduleNext(.75,1.3)},{kind:'kickoff',receiver});
  }

  function beginHalftime(){
    if(state.phase==='halftime')return;state.phase='halftime';state.special=null;state.delay=null;state.ball.flight=null;state.carrier=null;state.ball.visible=false;state.halftimeElapsed=0;state.halftimeReady=false;setBroadcastState('HALFTIME');audio.ensure();audio.pauseWorldCupMatchMusic();audio.play(audio.whistle,.55);say(formatLine('halftime'));showBanner('HALF TIME','',2.2);$('wcgHalftime').classList.remove('is-open');const bx=[.29,.36,.43],zx=[.71,.64,.57];teamEntities('belros').forEach((e,i)=>{e.tx=bx[i];e.ty=.685});teamEntities('zafran').forEach((e,i)=>{e.tx=zx[i];e.ty=.685});state.ref.tx=.5;state.ref.ty=.685;state.camera.tx=.5;state.camera.ty=.54;state.camera.tz=.985;updateHalftimePresentation(0);
  }
  async function continueSecondHalf(){
    if(!isHost()||state.phase!=='halftime'||!state.halftimeReady)return;await sendMatch('second-half',{host:'CatAsthma',at:Date.now()});handleSecondHalf();
  }
  function handleSecondHalf(){
    if(state.phase!=='halftime')return;for(const e of state.entities){e.fatigue*=.28;e.form*=.82;e.vx*=.25;e.vy*=.25}$('wcgHalftime').classList.remove('is-open');state.phase='secondcountdown';state.secondCountdown=3.05;setBroadcastState('SECOND_HALF_COUNTDOWN');state.ball.visible=true;const h=refStandingBallPoint();state.ball.x=h.x;state.ball.y=h.y;updateSecondHalfCountdown(0);
  }

  function beginShootout(){
    state.phase='shootout';state.shootout={score:{belros:0,zafran:0},attempts:{belros:0,zafran:0},turn:0,order:['belros','zafran'],round:0};state.special=null;state.delay={t:2.0,cb:shootoutNext};showBanner('PENALTY SHOOTOUT','var',2.4);say(`Eighteen minutes cannot separate them. No Golden Snitch here — ${teamMeta.belros.name} and ${teamMeta.zafran.name} settle it from the penalty line.`);audio.ensure();audio.play(audio.whistle,.6);
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

  function finishMatch(fromShootout=false){
    if(state.phase==='fulltime')return;state.phase='fulltime';state.special=null;state.delay=null;state.ball.flight=null;state.carrier=null;state.ball.visible=false;state.fulltimeElapsed=0;setBroadcastState('FULL_TIME');audio.ensure();audio.pauseWorldCupMatchMusic();audio.play(audio.whistle,.65);say(formatLine('fulltime'));showBanner('FULL TIME','',2.4);
    const so=state.shootout;let winner;if(fromShootout&&so)winner=so.score.belros>so.score.zafran?'belros':'zafran';else winner=state.score.belros>state.score.zafran?'belros':'zafran';const mvp=playerOfPeriod(null);state.fulltimeData={fromShootout,winner,so,mvp};
    const losers=other(winner),hero=teamEntities(winner).slice().sort((a,b)=>impactFor(b.player)-impactFor(a.player))[0]||teamEntities(winner)[0];teamEntities(winner).forEach((e,i)=>{e.tx=safeX(hero.x-teamMeta[winner].attack*(.025+i*.035));e.ty=safeY(hero.y+(i-1)*.055);e.celebrate=6});teamEntities(losers).forEach((e,i)=>{e.tx=safeX(lerp(e.x,losers==='belros'?.32:.68,.24));e.ty=safeY(.40+i*.12)});state.camera.tx=.5;state.camera.ty=.53;state.camera.tz=.98;updateFulltimePresentation(0);
  }

  function adminEnabled(){try{return isHost() && typeof toaState!=='undefined' && !!toaState.adminMode}catch(_){return false}}
  function skipToHalftime(){if(!adminEnabled()||state.phase!=='first')return;state.matchTime=HALF_SECONDS;beginHalftime()}
  function previewAdminEvent(kind){
    if(!adminEnabled())return;
    const scorer=state.carrier||rolePlayer('belros','attacker'), defender=rolePlayer(other(scorer.team),'defender');
    const team=kind==='goal'?'belros':scorer.team, teamName=teamMeta[team].name;
    const messages={goal:[`GOAL · ${scorer.player.name} · TEST`,''],save:[`SAVE · ${defender.player.name} · TEST`,''],miss:[`MISS · ${scorer.player.name} · TEST`,''],post:['OFF THE RING! · TEST','danger'],foul:[`FOUL · ${defender.player.name} · TEST`,'danger'],penalty:[`PENALTY · ${teamName} · TEST`,'danger'],hattrick:[`HAT TRICK · ${scorer.player.name} · TEST`,''],penaltypopup:[`PENALTY POPUP · ${teamName} · TEST`,'danger'],var:['VAR CHECK · TEST','var'],intercept:[`INTERCEPTION · ${defender.player.name} · TEST`,'']};
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
    const d=state.director||(state.director={phase:'BUILD-UP',momentum:{belros:0,zafran:0},pressure:{belros:0,zafran:0},recent:[],pulse:0});
    d.pulse-=dt;if(d.pulse>0)return;d.pulse=.32;
    const carrier=state.carrier,flight=state.ball.flight,zone=state.zone||.15;
    if(flight?.meta?.kind==='pass')d.phase='ATTACK';
    else if(state.special?.type==='penalty')d.phase='SET PIECE';
    else if(state.celebration)d.phase='RESET';
    else if(performance.now()-(state.possessionChangedAt||0)<1800)d.phase='COUNTERATTACK';
    else if(zone>.66)d.phase='GOAL CHANCE';
    else if(zone>.42)d.phase='ATTACK';
    else d.phase='BUILD-UP';
    for(const team of ['belros','zafran']){
      const st=state.teamStats[team],opp=state.teamStats[other(team)];
      const raw=(st.completed-opp.completed)*.012+(st.interceptions-opp.interceptions)*.06+(st.shots-opp.shots)*.045+(state.score[team]-state.score[other(team)])*.08;
      d.momentum[team]=lerp(d.momentum[team],clamp(raw,-.32,.32),.18);
      d.pressure[team]=lerp(d.pressure[team],carrier&&carrier.team!==team?clamp(zone,.1,.95):.12,.22);
    }
    for(const e of state.entities){
      const a=e.attributes||{};const halfProgress=clamp((state.matchTime%(HALF_SECONDS||540))/HALF_SECONDS,0,1);
      e.fatigue=clamp(halfProgress*(1-(a.stamina||.9))*.34 + (state.half===2?.025:0),0,.10);
      e.form=clamp(e.form*.985,-.12,.12);
    }
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
    if(state.phase!=='first'&&state.phase!=='second')return;
    const ball=state.ball.flight?state.ball:(state.carrier||{x:.5,y:.5,vx:0,vy:0});
    const poss=state.possession,attackDir=teamMeta[poss].attack,defTeam=other(poss),carrier=state.carrier;
    const phase=state.director?.phase||'BUILD-UP',counter=phase==='COUNTERATTACK',phaseLead=state.ball.flight?.meta?.kind==='pass'?.055:0;
    const ballFuture={x:safeX(ball.x+(state.ball.flight?(state.ball.flight.tx-ball.x)*.42:(carrier?.vx||0)*(.35+.16*(carrier?.attributes?.anticipation||.8)))),y:safeY(ball.y+(state.ball.flight?(state.ball.flight.ty-ball.y)*.42:(carrier?.vy||0)*.42))};
    const attackers=teamEntities(poss),defenders=teamEntities(defTeam);assignMarks(defTeam,attackers,carrier);
    attackers.forEach((e,i)=>{
      if(state.kickoffReceiver===e){const b=state.ball; e.intent='receive';e.tx=safeX(b.x+teamMeta[e.team].attack*.008);e.ty=safeY(b.y+.025);return}
      if(e===carrier){
        const a=e.attributes||{},goalX=attackDir>0?FLIGHT.softX1:FLIGHT.softX0,nearest=nearestOpponent(e),pressure=nearest?dist2(e,nearest):1;
        let laneY=e.y+(state.simRand()-.5)*(.025+.035*(1-a.decision));
        if(nearest&&pressure<.13)laneY+=Math.sign(e.y-nearest.y||((state.simRand()-.5)||1))*(.045+.035*a.turn);
        e.intent=pressure<.12?'evade':'carry';e.tx=safeX(lerp(e.x,goalX,counter?.14:.075)+attackDir*phaseLead);e.ty=safeY(laneY);return;
      }
      if(state.ball.flight?.meta?.receiver===e)return;
      const mates=attackers.filter(x=>x!==carrier),slot=mates.indexOf(e),t=chooseSupportTarget(e,carrier,ballFuture,slot);
      e.intent=counter?'break':'support';e.tx=t.x;e.ty=t.y;
    });
    defenders.forEach((e,i)=>{
      if(state.ball.flight?.meta?.challenger===e)return;
      const a=e.attributes||{},ownGoalX=defTeam==='belros'?.085:.915,marked=e.mark||carrier;
      const goalSideAmount=.17+i*.065+.05*(a.positioning||.8),goalSideX=lerp(ballFuture.x,ownGoalX,goalSideAmount);
      const canPress=carrier&&i===0&&dist2(e,carrier)<(.20+.07*(a.aggression||.7));
      e.intent=canPress?'press':'mark';e.currentThreat=marked;
      e.tx=safeX(canPress?lerp(carrier.x,ownGoalX,.095):goalSideX);
      const markY=marked?.y??ballFuture.y;e.ty=safeY(lerp(ballFuture.y,markY,.62)+(i-1)*.055);
      // On an active pass, good anticipators shade toward the future lane before deciding to challenge.
      if(state.ball.flight&&a.anticipation>.9){e.tx=safeX(lerp(e.tx,ballFuture.x,.18));e.ty=safeY(lerp(e.ty,ballFuture.y,.18))}
    });

    // The five later World Cup arenas have a much deeper lower half than the Crown.
    // Rotate one off-ball rider from each side through that lower lane so it is part
    // of normal play rather than an unlocked-but-never-targeted dead zone.
    if(activeArena().id!=='crown-of-vardesh-glacier'){
      const lowerLane=clamp(activeSoftY1()-.075,FLIGHT.softY0+.12,activeSoftY1()-.035);
      for(const team of ['belros','zafran']){
        const off=teamEntities(team).filter(e=>e!==state.carrier&&state.ball.flight?.meta?.receiver!==e&&state.ball.flight?.meta?.challenger!==e);
        if(off.length){
          const idx=Math.floor(((state.matchTime||0)/7.5)+(team==='zafran'?1:0))%off.length,runner=off[idx];
          if(runner&&runner.intent!=='press'){
            runner.ty=safeY(lerp(runner.ty,lowerLane,.72));
            runner.intent=runner.intent==='mark'?'mark-wide':'wide-lane';
          }
        }
      }
    }
    // Keep the real contest compact, but stop teammates being assigned almost the
    // same destination.  This mirrors the Club build's stable target-space separation.
    for(const team of ['belros','zafran']){
      const players=teamEntities(team);
      for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){
        const a=players[i],b=players[j],dx=a.tx-b.tx,dy=a.ty-b.ty,d=Math.hypot(dx,dy)||.001;
        if(d<.118){
          const push=(.118-d)*.37,nx=dx/d,ny=dy/d;
          a.tx=safeX(a.tx+nx*push);a.ty=safeY(a.ty+ny*push);
          b.tx=safeX(b.tx-nx*push);b.ty=safeY(b.ty-ny*push);
        }
      }
    }

    // When play reaches a goal end, only the actual carrier/receiver and the two
    // nearest live defenders are allowed to collapse into the goal mouth. Everyone
    // else holds width/depth. This specifically prevents the whole six-player pack
    // collecting down one side while leaving the real contest untouched.
    const contest=activeContestEntities();
    for(const e of state.entities){
      if(contest.has(e))continue;
      for(const g of [{x:.098,y:.508,away:1},{x:.902,y:.508,away:-1}]){
        const dx=e.tx-g.x,dy=e.ty-g.y,d=Math.hypot(dx,dy);
        if(d<.155){
          const fan=e.flowSign||1;
          e.tx=safeX(g.x+g.away*.165);
          e.ty=clamp(g.y+fan*.125,FLIGHT.softY0+.035,lowerSoftLimit(e)-.025);
          e.intent='spread';
          break;
        }
      }
    }
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
    for(let i=0;i<entities.length;i++){
      const e=entities[i];
      const close=entities.filter(o=>o!==e&&Math.hypot(o.x-e.x,o.y-e.y)<WORLD_CUP_FLOW.packRadius);
      if(close.length>=3)e.packCrowdTime=(e.packCrowdTime||0)+dt;
      else e.packCrowdTime=Math.max(0,(e.packCrowdTime||0)-dt*3.4);

      if((e.packDisperseTime||0)>0&&e.packDisperseTarget){
        e.packDisperseTime=Math.max(0,e.packDisperseTime-dt);
        const strength=contest.has(e)?.28:.74;
        e.tx=lerp(e.tx,e.packDisperseTarget.x,strength);
        e.ty=lerp(e.ty,e.packDisperseTarget.y,strength);
        if(!contest.has(e))e.intent='spread';
        if(e.packDisperseTime<=0)e.packDisperseTarget=null;
      }

      if(e.packCrowdTime<WORLD_CUP_FLOW.packTrigger||close.length<3||e.packDisperseTime>0)continue;
      const group=[e,...close];
      const cx=group.reduce((n,o)=>n+o.x,0)/group.length;
      const cy=group.reduce((n,o)=>n+o.y,0)/group.length;
      let dx=e.x-cx,dy=e.y-cy,d=Math.hypot(dx,dy);
      if(d<.012){
        const angle=(-Math.PI*.72)+(i/Math.max(1,entities.length-1))*Math.PI*1.44;
        dx=Math.cos(angle);dy=Math.sin(angle);d=1;
      }
      dx/=d;dy/=d;
      const essential=contest.has(e),distance=essential?.060:.145;
      const tx=safeX(e.x+dx*distance);
      const ty=clamp(e.y+dy*distance,FLIGHT.softY0+.035,lowerSoftLimit(e)-.030);
      e.packDisperseTarget={x:tx,y:ty};
      e.packDisperseTime=essential?.48:1.35;
      e.packCrowdTime=0;
    }
  }

  function lowerSoftLimit(e){
    const bottom=activeSoftY1();
    if(!e?.player)return bottom;
    const scale=PLAYER_SCALE[e.player.id]||1;
    return bottom-.018-Math.max(0,scale-1)*.060;
  }
  function lowerHardLimit(e){
    const bottom=activeHardY1();
    if(!e?.player)return bottom;
    const scale=PLAYER_SCALE[e.player.id]||1;
    return bottom-.016-Math.max(0,scale-1)*.050;
  }

  function enforceInteriorIntent(e,dt){
    const mx=.040,my=.038,softBottom=lowerSoftLimit(e);let threatened=false,bottomThreat=false;
    if(e.x<FLIGHT.softX0+mx){e.tx=Math.max(e.tx,FLIGHT.softX0+.090);if(e.vx<0)e.vx=lerp(e.vx,.068,.30);threatened=true}
    else if(e.x>FLIGHT.softX1-mx){e.tx=Math.min(e.tx,FLIGHT.softX1-.090);if(e.vx>0)e.vx=lerp(e.vx,-.068,.30);threatened=true}
    if(e.y<FLIGHT.softY0+my){e.ty=Math.max(e.ty,FLIGHT.softY0+.085);if(e.vy<0)e.vy=lerp(e.vy,.066,.30);threatened=true}
    else if(e.y>softBottom-my*1.9){e.ty=Math.min(e.ty,softBottom-.135);if(e.vy>-.030)e.vy=lerp(e.vy,-.135,.58);threatened=true;bottomThreat=true}
    const slow=Math.hypot(e.vx,e.vy)<.036;
    e.edgeStall=threatened&&slow?(e.edgeStall||0)+dt:Math.max(0,(e.edgeStall||0)-dt*3);
    if(bottomThreat&&e.y>softBottom-.030){
      const side=e.x<.5?1:-1;
      e.ty=Math.min(e.ty,activeFlightProfile().bottomRecoverY);e.tx=safeX(e.tx+side*.062);
      e.vy=Math.min(e.vy,-.105);e.vx+=side*.022;e.intent='recover';
    }
    if(e.edgeStall>(bottomThreat?.085:.19)){
      const recoverY=activeArena().id==='crown-of-vardesh-glacier'?.47:.575;
      e.tx=safeX(lerp(e.x,.5,.44));e.ty=clamp(lerp(e.y,recoverY,.54),FLIGHT.softY0,softBottom-.025);
      const ix=.5-e.x,iy=recoverY-e.y,d=Math.hypot(ix,iy)||1;
      e.vx+=ix/d*.080;e.vy+=iy/d*(bottomThreat?.125:.082);
      e.edgeStall=0;e.intent='recover';
    }
  }

  function applyBoundarySteering(e,dvx,dvy){
    // Anticipate walls before contact. This is intentionally a steering field rather than a hard bounce.
    const px=e.x+e.vx*.42,py=e.y+e.vy*.42;const left=(px-FLIGHT.hardX0)/FLIGHT.wallLook,right=(FLIGHT.hardX1-px)/FLIGHT.wallLook;
    const top=(py-FLIGHT.hardY0)/FLIGHT.wallLook,bottom=(lowerHardLimit(e)-py)/FLIGHT.wallLook;
    if(left<1)dvx+=Math.pow(1-clamp(left,0,1),2)*.26;
    if(right<1)dvx-=Math.pow(1-clamp(right,0,1),2)*.26;
    if(top<1)dvy+=Math.pow(1-clamp(top,0,1),2)*.22;
    if(bottom<1)dvy-=Math.pow(1-clamp(bottom,0,1),2)*.30;
    return [dvx,dvy];
  }

  function steerEntity(e,dt){
    enforceInteriorIntent(e,dt);
    const dx=e.tx-e.x,dy=e.ty-e.y,dist=Math.hypot(dx,dy),a=e.attributes||{},fatigue=1-(e.fatigue||0);
    const live=(state.phase==='first'||state.phase==='second'||state.phase==='shootout')&&!state.special&&!state.celebration;
    const movementCap=(e.maxSpeed||.19)*fatigue*WORLD_CUP_MOVEMENT_PACE;
    let desiredSpeed=Math.min(movementCap,dist*2.05+.025);
    let dvx=dist>.001?dx/dist*desiredSpeed:0,dvy=dist>.001?dy/dist*desiredSpeed:0;

    // Do not "arrive and park" on a target in open play. Preserve a small cruise
    // vector through the tactical point, which removes the 3–5 second floor-tapping
    // / hovering beats without making actions, passes or shots happen more often.
    if(live&&dist<WORLD_CUP_FLOW.arrivalRadius&&e.intent!=='intercept'&&e.intent!=='receive'){
      const sp0=Math.hypot(e.vx,e.vy);
      const cruise=WORLD_CUP_FLOW.minCruise*(e.intent==='press'?1.08:e===state.carrier?1.05:.92);
      if(sp0>.016){
        const keep=Math.max(cruise,Math.min(sp0,movementCap*.72));
        dvx=e.vx/sp0*keep;dvy=e.vy/sp0*keep;
      }else{
        const attack=teamMeta[e.team].attack,side=e.flowSign||1;
        dvx=attack*cruise*.72;dvy=side*cruise*.56;
      }
      desiredSpeed=Math.max(desiredSpeed,cruise);
    }

    // Very small deterministic lateral flow prevents everyone tracing exactly the
    // same line; use matchTime rather than wall-clock randomness.
    const wobble=Math.sin((state.matchTime||0)*1.55+(e.flowPhase||e.wander||0))*(.0028+.0025*(1-(a.composure||.85)));
    dvx+=-dy/(dist||1)*wobble;dvy+=dx/(dist||1)*wobble;

    [dvx,dvy]=applyBoundarySteering(e,dvx,dvy);
    const responsiveness=1-Math.exp(-dt*(e.turnRate||5)*fatigue*1.10);
    e.vx=lerp(e.vx,dvx,responsiveness);e.vy=lerp(e.vy,dvy,responsiveness);

    // Physical correction only when sprites are genuinely converging. Normal spacing
    // is handled by targets, avoiding the old "ping-pong" vibration.
    if(live){
      for(const o of state.entities){
        if(o===e)continue;
        const sx=e.x-o.x,sy=e.y-o.y,sd=Math.hypot(sx,sy);
        if(sd>0&&sd<.048){
          const nx=sx/sd,ny=sy/sd,closing=(e.vx-o.vx)*nx+(e.vy-o.vy)*ny;
          if(closing<0){const push=(.048-sd)*.20;e.vx+=nx*push;e.vy+=ny*push}
        }
      }
    }

    let sp=Math.hypot(e.vx,e.vy);
    if(sp>movementCap){e.vx=e.vx/sp*movementCap;e.vy=e.vy/sp*movementCap;sp=movementCap}

    e.hoverTime=live&&sp<.026?(e.hoverTime||0)+dt:Math.max(0,(e.hoverTime||0)-dt*2.8);
    if(live&&e.hoverTime>WORLD_CUP_FLOW.hoverTrigger){
      const attack=teamMeta[e.team].attack,side=e.flowSign||1;
      e.tx=safeX(e.x+attack*(e===state.carrier?.085:.050));
      e.ty=clamp(e.y+side*.075,FLIGHT.softY0+.035,lowerSoftLimit(e)-.030);
      e.vx+=attack*WORLD_CUP_FLOW.escapeImpulse*.80;
      e.vy+=side*WORLD_CUP_FLOW.escapeImpulse;
      e.hoverTime=0;e.flowSign*=-1;
      if(e.intent==='shape')e.intent='rotate';
    }

    let nx=e.x+e.vx*dt,ny=e.y+e.vy*dt;
    if(nx<FLIGHT.hardX0){nx=FLIGHT.hardX0+.003;e.vx=Math.abs(e.vx)*.28;e.tx=Math.max(e.tx,FLIGHT.softX0+.035)}
    else if(nx>FLIGHT.hardX1){nx=FLIGHT.hardX1-.003;e.vx=-Math.abs(e.vx)*.28;e.tx=Math.min(e.tx,FLIGHT.softX1-.035)}
    const hardBottom=lowerHardLimit(e),softBottom=lowerSoftLimit(e);
    if(ny<FLIGHT.hardY0){ny=FLIGHT.hardY0+.003;e.vy=Math.abs(e.vy)*.28;e.ty=Math.max(e.ty,FLIGHT.softY0+.07)}
    else if(ny>hardBottom){
      ny=hardBottom-.004;e.vy=-Math.max(.080,Math.abs(e.vy)*.55);
      e.ty=Math.min(e.ty,softBottom-.115);e.tx=safeX(lerp(e.tx,.5,.10));e.intent='recover';
    }
    e.x=nx;e.y=ny;
    if(Math.abs(e.vx)>.008){e.facing=e.vx>=0?1:-1;e.dir=-e.facing}

    // Much smaller roll than the old vertical-velocity bank. The old ±0.30 rad tilt
    // made broom ends repeatedly touch the ice when riders travelled vertically.
    const visualBank=clamp(e.vy*1.10,-.060,.060);
    e.bank=lerp(e.bank,visualBank,1-Math.exp(-dt*4.4));
    if(e.celebrate>0)e.celebrate=Math.max(0,e.celebrate-dt);
  }

  function updateEntities(dt){
    if(state.celebration){for(const e of state.entities)steerEntity(e,dt*.82);state.ref.vx=lerp(state.ref.vx,0,1-Math.exp(-dt*7));state.ref.vy=lerp(state.ref.vy,0,1-Math.exp(-dt*7));return}
    if(state.phase==='intro'){for(const e of state.entities)e.vx=e.vy=0;state.ref.vx=state.ref.vy=0;return}
    if(state.phase==='secondcountdown'){for(const e of state.entities){e.vx=lerp(e.vx,0,1-Math.exp(-dt*8));e.vy=lerp(e.vy,0,1-Math.exp(-dt*8))}state.ref.vx=state.ref.vy=0;return}
    if(state.phase==='halftime'){
      for(const e of state.entities){if(state.halftimeElapsed<2.4)steerEntity(e,dt*.68);else{e.vx=lerp(e.vx,0,1-Math.exp(-dt*7));e.vy=lerp(e.vy,0,1-Math.exp(-dt*7))}}
      state.ref.vx=lerp(state.ref.vx,0,1-Math.exp(-dt*7));state.ref.vy=lerp(state.ref.vy,0,1-Math.exp(-dt*7));return;
    }
    updateMatchDirector(dt);
    state.movementPulse-=dt;if(state.movementPulse<=0){refreshMovementTargets();state.movementPulse=.105+state.simRand()*.075}
    breakGeneralPackGrouping(dt,true);
    for(const e of state.entities)steerEntity(e,dt);
    const target=state.ball.flight?state.ball:(state.carrier||{x:.5,y:.5});
    const refBehind=state.possession==='belros'?.115:state.possession==='zafran'?-.115:0;
    const refVertical=target.y<.50?.110:-.110;
    state.ref.tx=safeX(target.x-refBehind);state.ref.ty=safeY(target.y+refVertical);
    const r=state.ref;enforceInteriorIntent(r,dt);const dx=r.tx-r.x,dy=r.ty-r.y,dist=Math.hypot(dx,dy),ds=Math.min(r.maxSpeed*WORLD_CUP_REF_PACE,dist*1.72+.023);let rvx=dist?dx/dist*ds:0,rvy=dist?dy/dist*ds:0;[rvx,rvy]=applyBoundarySteering(r,rvx,rvy);const k=1-Math.exp(-dt*4.2);
    r.vx=lerp(r.vx,rvx,k);r.vy=lerp(r.vy,rvy,k);let rx=r.x+r.vx*dt,ry=r.y+r.vy*dt;
    if(rx<FLIGHT.hardX0){rx=FLIGHT.hardX0+.004;r.vx=Math.abs(r.vx)*.3;r.tx=FLIGHT.softX0+.07}else if(rx>FLIGHT.hardX1){rx=FLIGHT.hardX1-.004;r.vx=-Math.abs(r.vx)*.3;r.tx=FLIGHT.softX1-.07}
    if(ry<FLIGHT.hardY0){ry=FLIGHT.hardY0+.004;r.vy=Math.abs(r.vy)*.3;r.ty=FLIGHT.softY0+.07}else if(ry>lowerHardLimit(r)){ry=lowerHardLimit(r)-.004;r.vy=-Math.max(.070,Math.abs(r.vy)*.50);r.ty=lowerSoftLimit(r)-.10}
    r.x=rx;r.y=ry;if(Math.abs(r.vx)>.003)r.dir=r.vx>=0?1:-1;
  }

  function updateCamera(dt){
    const c=state.camera;if(c.vx==null){c.vx=0;c.vy=0;c.vz=0;c.mode='LIVE_BROADCAST'};updateWorldCupCameraDirector(dt);
    const live=state.phase==='first'||state.phase==='second'||state.phase==='shootout';
    if(live&&!state.special){
      if(state.celebration){const gc=state.celebration;c.mode='CELEBRATION_CAMERA';c.tx=clamp(lerp(.5,gc.scorer.x,.26),.47,.53);c.ty=clamp(lerp(.515,gc.scorer.y,.22),.49,.55);c.tz=1.052;}
      else{const flight=state.ball.flight,carrier=state.carrier,dir=carrier?teamMeta[carrier.team].attack:(state.possession?teamMeta[state.possession].attack:0);let mode='LIVE_BROADCAST',zoom=1.025;if(flight?.meta?.kind==='shot'){mode='SHOT_CAMERA';zoom=1.070}else if(state.director?.phase==='COUNTERATTACK'){mode='ATTACK_CAMERA';zoom=1.047}else if(state.director?.phase==='GOAL CHANCE'){mode='ATTACK_CAMERA';zoom=1.060}else if(flight?.meta?.kind==='pass')zoom=1.036;const virtual=state.cameraDirector?.shot||'MAIN';if(virtual==='WIDE'){mode='WIDE_CAMERA';zoom=Math.min(zoom,1.006)}else if(virtual==='TRACKING'){mode='TRACKING_CAMERA';zoom=Math.max(zoom,1.040)}else if(virtual==='CLOSE_ATTACK'){mode='CLOSE_ATTACK_CAMERA';zoom=Math.max(zoom,1.070)}else if(virtual==='GOAL_END'){mode='GOAL_END_CAMERA';zoom=Math.max(zoom,1.058)};
        const pts=worldCupCameraFramePoints();let sx=0,sy=0,sw=0;for(const p of pts){sx+=p.x*(p.w||1);sy+=p.y*(p.w||1);sw+=p.w||1}let fx=sw?sx/sw:.5,fy=sw?sy/sw:.5;const focus=flight?state.ball:(carrier||{x:.5,y:.5});let lookX=0,lookY=0;if(flight){lookX=(flight.tx-focus.x)*.32;lookY=(flight.ty-focus.y)*.22}else if(carrier){lookX=(carrier.vx||0)*.66+dir*.016;lookY=(carrier.vy||0)*.44}fx=lerp(fx,focus.x,.38)+lookX;fy=lerp(fy,focus.y,.34)+lookY;if(virtual==='WIDE'){fx=lerp(fx,.5,.24);fy=lerp(fy,.50,.18)}else if(virtual==='GOAL_END'&&carrier){const gx=carrier.team==='belros'?.82:.18;fx=lerp(fx,gx,.27);fy=lerp(fy,.515,.18)}else if(virtual==='CLOSE_ATTACK'&&carrier){fx=lerp(fx,carrier.x,.35);fy=lerp(fy,carrier.y,.30)}const zb=cameraBoundsForZoom(zoom);c.tx=clamp(fx,zb.x0+.004,zb.x1-.004);c.ty=clamp(fy,zb.y0+.004,zb.y1-.004);c.tz=zoom;c.mode=mode;}
    }else if(state.special?.type==='var')c.mode='VAR_CAMERA';else if(state.special?.type==='penalty')c.mode='SET_PIECE_CAMERA';else if(state.phase==='halftime')c.mode='HALFTIME_CAMERA';else if(state.phase==='fulltime')c.mode='FULL_TIME_CAMERA';
    const fast=['ATTACK_CAMERA','SHOT_CAMERA','TRACKING_CAMERA','CLOSE_ATTACK_CAMERA','GOAL_END_CAMERA'].includes(c.mode),accel=fast?5.25:4.0,damping=fast?5.0:4.7;c.vx+=(c.tx-c.x)*accel*dt;c.vy+=(c.ty-c.y)*accel*dt;c.vz+=(c.tz-c.zoom)*3.8*dt;const damp=Math.exp(-damping*dt);c.vx*=damp;c.vy*=damp;c.vz*=Math.exp(-4.7*dt);c.x+=c.vx*dt;c.y+=c.vy*dt;c.zoom+=c.vz*dt;c.zoom=clamp(c.zoom,.985,1.095);const bounds=cameraBoundsForZoom(Math.max(1,c.zoom));c.x=clamp(c.x,bounds.x0,bounds.x1);c.y=clamp(c.y,bounds.y0,bounds.y1);c.shake=Math.max(0,c.shake-dt*.018);
  }

  function drawSprite(ctx,image,e,height,standing=false){
    if(!image)return;const aspect=image.width/image.height,w=height*aspect,airLift=standing?0:WORLD_CUP_AIR_LIFT_PX,standingDrop=standing?standingFloorOffsetPx():0;ctx.save();ctx.translate(e.x*W,e.y*H-airLift+standingDrop);const bob=0;if(!standing){ctx.rotate((e.bank||0)+(e.celebrate>0?Math.sin(performance.now()/120)*.025:0))}ctx.scale(e.dir||1,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,-w/2,-height/2,w,height);ctx.restore();
    ctx.save();const tagText=e.player?.name||'REFEREE',tagY=e.y*H-(standing?0:WORLD_CUP_AIR_LIFT_PX)+(standing?standingFloorOffsetPx():0)-height/2-9,isHome=e.team==='belros',isAway=e.team==='zafran',carrier=!standing&&state.carrier===e;ctx.font='900 9px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';const tw=Math.ceil(ctx.measureText(tagText).width)+12,th=15,left=Math.round(e.x*W-tw/2),top=Math.round(tagY-th+2);ctx.fillStyle=isHome?'rgba(26,48,73,.94)':isAway?'rgba(20,42,67,.94)':'rgba(12,25,38,.92)';ctx.fillRect(left,top,tw,th);ctx.strokeStyle=carrier?'#fff0a6':isHome?'#d3a250':isAway?'#83c9e8':'#b8c7d0';ctx.lineWidth=carrier?2:1;ctx.strokeRect(left+.5,top+.5,tw-1,th-1);ctx.fillStyle=isHome?'#e2b55f':isAway?'#79c5e5':'#b9cad4';ctx.fillRect(left+1,top+1,tw-2,2);ctx.fillStyle='#f7eed3';ctx.strokeStyle='rgba(0,0,0,.92)';ctx.lineWidth=2.5;ctx.strokeText(tagText,e.x*W,tagY);ctx.fillText(tagText,e.x*W,tagY);if(carrier){ctx.fillStyle='#ffe581';ctx.beginPath();ctx.arc(e.x*W,top-4,2.7,0,Math.PI*2);ctx.fill()}ctx.restore();
  }

  function drawBall(ctx,x,y,flight=false){if(!state.assets.ball)return;ctx.save();ctx.translate(x*W,y*H);const size=flight?29:23;if(flight){ctx.globalAlpha=.13;ctx.drawImage(state.assets.ball,-size*1.45,-size*.5,size,size);ctx.globalAlpha=1}else{ctx.globalAlpha=.18;ctx.drawImage(state.assets.ball,-size*.62,-size*.52,size,size);ctx.globalAlpha=1}ctx.drawImage(state.assets.ball,-size/2,-size/2,size,size);ctx.restore()}

  function render(){
    const canvas=$('wcgCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx||!state.assets.arena)return;ctx.clearRect(0,0,W,H);ctx.save();const replayFrame=currentWorldCupReplayFrame(),shake=!replayFrame&&state.camera.shake?((state.visualRand()-.5)*state.camera.shake*W):0,cam=replayFrame?.camera||state.camera,replayZoom=replayFrame?clamp((cam.zoom||1.03)+.028,1.025,1.092):cam.zoom;ctx.translate(W/2+shake,H/2+shake*.5);ctx.scale(replayZoom,replayZoom);ctx.translate(-(cam.x||.5)*W,-(cam.y||.5)*H);ctx.imageSmoothingEnabled=false;ctx.drawImage(state.assets.arena,0,0,W,H);
    if(replayFrame){drawWorldCupReplayScene(ctx,replayFrame);ctx.restore();return}
    const standing=state.phase==='intro'||state.phase==='secondcountdown'||(state.phase==='halftime'&&state.halftimeElapsed>2.15);
    if(standing){for(const e of state.entities)drawSprite(ctx,state.assets[e.player.id+'Standing'],e,playerSpriteHeight(e,true),true);const rr={...state.ref,player:{name:'REFEREE'},dir:1};drawSprite(ctx,state.assets.refStanding,rr,REF_STAND_HEIGHT,true);if(state.ball.visible)drawBall(ctx,state.ball.x,state.ball.y,false)}
    else{for(const e of state.entities)drawSprite(ctx,state.assets[e.player.id+'Riding'],e,playerSpriteHeight(e,false),false);const rr={...state.ref,player:{name:'REFEREE'}};drawSprite(ctx,state.assets.refFlying,rr,REF_FLY_HEIGHT,false);if(state.ball.visible&&state.assets.ball){const hold=state.carrier?ballHoldPoint(state.carrier):null;drawBall(ctx,hold?hold.x:state.ball.x,hold?hold.y:state.ball.y,!!state.ball.flight)}}
    drawWorldCupGoalCelebrationEffects(ctx);ctx.restore();
  }

  function update(ts){
    if(!state.open)return;const rawDt=state.lastTs?Math.min(.05,(ts-state.lastTs)/1000):0;state.lastTs=ts;const dt=rawDt*state.speed;
    if(state.openingFilmActive){syncWorldCupOpeningFilm();state.raf=requestAnimationFrame(update);return}
    if(state.eventBannerTimer>0){state.eventBannerTimer-=rawDt;if(state.eventBannerTimer<=0)$('wcgEventBanner')?.classList.remove('is-visible')}updateWorldCupBigMoment(rawDt);if(state.crowdBoost>0)state.crowdBoost=Math.max(0,state.crowdBoost-rawDt*.16);
    // Replays are 100% visual. Match clock, RNG and authoritative simulation freeze until live returns.
    if(state.replayIntro||state.replay||state.replayOutro){if(state.replayIntro)updateWorldCupReplayIntro(rawDt);else if(state.replay)updateWorldCupReplay(rawDt);else updateWorldCupReplayOutro(rawDt);updateWorldCupBroadcastDirector(rawDt);updateScoreUi();render();state.raf=requestAnimationFrame(update);return}
    // Goal celebration choreography is also presentation time; no match actions/RNG advance.
    if(state.celebration){updateWorldCupGoalCelebration(rawDt);updateCamera(rawDt);updateWorldCupBroadcastDirector(rawDt);updateScoreUi();render();state.raf=requestAnimationFrame(update);return}
    if(state.phase==='intro')updateIntro(rawDt);
    else if(state.phase==='first'||state.phase==='second'){
      if(!state.special){state.matchTime+=dt;state.teamStats[state.possession].possession+=dt}
      if(state.phase==='first'&&state.matchTime>=HALF_SECONDS){state.matchTime=HALF_SECONDS;beginHalftime()}
      else if(state.phase==='second'&&state.matchTime>=MATCH_SECONDS){state.matchTime=MATCH_SECONDS;if(state.score.belros===state.score.zafran)beginShootout();else finishMatch(false)}
      if(state.phase==='first'||state.phase==='second'){updateFlight(dt);updateDelay(dt);if(state.special?.type==='var')updateVar(dt);else if(state.special?.type==='penalty')updatePenalty(dt);if(!state.special&&!state.delay&&!state.ball.flight){state.actionTimer-=dt;if(state.actionTimer<=0)nextAction()}}
    }else if(state.phase==='halftime')updateHalftimePresentation(rawDt);else if(state.phase==='secondcountdown')updateSecondHalfCountdown(rawDt);else if(state.phase==='shootout'){updateFlight(dt);updateDelay(dt);if(state.special?.type==='penalty')updatePenalty(dt)}else if(state.phase==='fulltime')updateFulltimePresentation(rawDt);
    if((state.phase==='first'||state.phase==='second'||state.phase==='shootout')&&performance.now()-(state.packHeartbeatAt||0)>=10000){state.packHeartbeatAt=performance.now();window.RepoWorldCupPacks?.heartbeatFixture({...state.packFixture,phase:state.phase,elapsedSeconds:state.matchTime})}
    updateEntities(dt);updateCamera(rawDt);captureWorldCupReplayFrame(rawDt);updateWorldCupBroadcastDirector(rawDt);updateScoreUi();render();state.raf=requestAnimationFrame(update);
  }

  async function joinMatchChannel(){
    if(state.channel)return;let database=null;try{database=typeof db!=='undefined'?db:null}catch(_){}if(!database?.channel)return;
    const ch=database.channel(MATCH_CHANNEL,{config:{broadcast:{self:false,ack:false}}});state.channel=ch;
    ch.on('broadcast',{event:'second-half'},()=>handleSecondHalf());ch.on('broadcast',{event:'speed'},({payload})=>setSpeed(Number(payload?.speed)||1,false));ch.on('broadcast',{event:'close'},()=>closeBroadcast(false));
    ch.subscribe(status=>{state.subscribed=status==='SUBSCRIBED'});
  }
  async function sendMatch(event,payload){if(!state.channel)return false;try{const r=await state.channel.send({type:'broadcast',event,payload});return r==='ok'||r===true||r?.status==='ok'}catch(_){return false}}
  async function leaveMatchChannel(){const ch=state.channel;state.channel=null;state.subscribed=false;if(!ch)return;try{const database=typeof db!=='undefined'?db:null;if(database?.removeChannel)await database.removeChannel(ch);else await ch.unsubscribe()}catch(_){}}

  function openingFilmForActiveArena(){
    const arena=activeArena();
    return WORLD_CUP_STADIUM_INTROS[arena?.id]||null;
  }


  function openingFilmWallElapsed(){
    return Math.max(0,(Date.now()-(Number(state.startedAt)||Date.now()))/1000);
  }

  function stopWorldCupOpeningFilm(){
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
    state.gameplayStartedAt=(Number(state.startedAt)||Date.now())+duration*1000;
    if(elapsed>=duration-.035)return false;
    const wrap=$('wcgOpeningFilm'),video=$('wcgOpeningFilmVideo'),sound=$('wcgOpeningFilmSound');if(!wrap||!video)return false;
    state.phase='openingfilm';state.openingFilmActive=true;state.openingFilmDone=false;state.openingFilmMutedFallback=false;
    wrap.classList.add('is-visible');wrap.classList.remove('is-muted-fallback');wrap.setAttribute('aria-hidden','false');$('wcWorldCupBroadcast')?.classList.add('is-opening-film');
    if(sound)sound.hidden=true;
    video.src=film.src;video.preload='auto';video.playsInline=true;video.muted=false;video.volume=1;video.playbackRate=1;
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
    return {fixtureId,label:String(f.label||f.name||f.title||`${teamA} vs ${teamB}`),teamA,teamB,stage:String(f.stage||f.round||f.tournament_stage||'Group Stage'),startedAt:started,elapsedSeconds:0,date};
  }

  function setSpeed(speed,broadcast=false){state.speed=speed===4?4:1;const b=$('wcgSpeed');if(b)b.textContent=state.speed===1?'TEST SPEED ×4':'RETURN TO ×1';if(broadcast&&isHost())sendMatch('speed',{speed:state.speed})}
  function toggleSpeed(){if(!isHost())return;setSpeed(state.speed===1?4:1,true)}

  async function openBroadcast(opts={}){
    if(state.open||state.opening)return;state.opening=true;createUi();configureFixtureTeams(opts);applyFixtureUiLabels();
    state.open=true;state.opening=false;state.startedAt=Number(opts.startedAt)||Date.now();state.seed=hashSeed(`${state.startedAt}|${state.fixtureId}|${teamMeta.belros.name} vs ${teamMeta.zafran.name}|WC2026`);state.simRand=mulberry32(state.seed);state.visualRand=mulberry32(state.seed^0x9e3779b9);
    state.packFixture=wcPackFixtureMeta(opts);state.gameplayStartedAt=state.startedAt;state.phase='intro';state.introElapsed=0;state.matchTime=0;state.speed=1;state.half=1;state.firstKickoff='belros';state.score={belros:0,zafran:0};state.shootout=null;state.special=null;state.delay=null;state.celebration=null;state.varContext=null;state.actionTimer=2.5;state.ball={x:.5,y:.5,flight:null,visible:true};state.pendingPass=null;state.possessionChangedAt=performance.now();state.loreUsed=new Set();state.introCue=-1;state.presentationKey='';state.broadcastState='PRE_MATCH';state.halftimeElapsed=0;state.halftimeReady=false;state.secondCountdown=0;state.fulltimeElapsed=0;state.fulltimeData=null;state.events=[];state.kickoffToss=null;state.kickoffReceiver=null;state.prematchAudioFailed=false;state.packRewardHandled=false;state.packHeartbeatAt=0;state.replay=null;state.replayIntro=null;state.replayOutro=null;state.replayBuffer=[];state.replayCaptureAccum=0;state.lastReplayAt=-999;state.storyGraphicTimer=34;state.storyGraphicUntil=0;state.storyGraphicIndex=0;state.bigMomentTimer=0;state.cameraDirector={shot:'MAIN',timer:3.4,lastShot:'',cutSerial:0};state.broadcast={barryPriority:0,barryUntil:0,barryState:'NEUTRAL',reactionTimer:0,talkTimer:0,speakTimer:0,speaking:false,queue:null,lastSpokenAt:0,lastPhaseCommentAt:0,phaseSeen:'',crowdLevel:.09};state.camera={x:.5,y:.5,zoom:1,tx:.5,ty:.5,tz:1,shake:0,vx:0,vy:0,vz:0,mode:'PRE_MATCH'};state.lastTs=0;state.crowdBoost=0;state.movementPulse=.1;state.director={phase:'BUILD-UP',momentum:{belros:0,zafran:0},pressure:{belros:0,zafran:0},recent:[],pulse:0};state.openingFilmActive=false;state.openingFilmDone=false;state.openingFilmMutedFallback=false;state.openingFilmSrc='';state.openingFilmDuration=0;state.gameplayAssetsReady=false;state.gameplayAssetsFailed=false;audio.musicSequenceStarted=false;audio.currentMusic=null;audio.currentMusicIndex=-1;audio.currentMusicType='';
    resetStats();createEntities();stopWorldCupMenuAudio();
    const root=$('wcWorldCupBroadcast');root.classList.add('is-open');root.setAttribute('aria-hidden','false');window.RepoWorldCupPacks?.beginFixture({...state.packFixture,phase:'intro',elapsedSeconds:state.matchTime});$('wcgHalftime').classList.remove('is-open');$('wcgFulltime').classList.remove('is-open');hidePresentation();$('wcgVar').classList.remove('is-open','is-decision');hideWorldCupStoryCard();hideWorldCupBigMoment();$('wcgReplayBug')?.classList.remove('is-visible');$('wcgReplaySponsor')?.classList.remove('is-visible');resetBarryVisual();const atmos=$('wcgWorldCupAtmosphere');if(atmos)atmos.dataset.arena=state.ambienceId;const admin=adminEnabled();$('wcgSpeed').hidden=!admin;$('wcgSkipHalf').hidden=!admin;$('wcgAdminEvents').hidden=!admin;$('wcgAdminPanel').hidden=true;setSpeed(1,false);
    // Do not block the host's parent-page START broadcast on gameplay-image loading.
    // The 22.3s opening film gives all viewers the same wall-clock lead-in while assets preload in parallel.
    preload().then(()=>{state.gameplayAssetsReady=true;if(!state.openingFilmActive&&state.phase==='intro')render()}).catch(error=>{state.gameplayAssetsFailed=true;console.error('[WORLD CUP] Gameplay assets failed to load',error)});
    void joinMatchChannel();
    const filmStarted=startWorldCupOpeningFilm();
    if(!filmStarted)beginPreGameAfterOpeningFilm()
    updateScoreUi();state.raf=requestAnimationFrame(update);return true;
  }

  async function closeBroadcast(broadcastClose=false){
    if(!state.open)return;if(broadcastClose&&isHost())await sendMatch('close',{host:'CatAsthma'});window.RepoWorldCupPacks?.endFixture();stopWorldCupOpeningFilm();state.open=false;cancelAnimationFrame(state.raf);state.phase='closed';setBroadcastState('CLOSED');hidePresentation();hideWorldCupStoryCard();hideWorldCupBigMoment();stopBarryTalking();clearTimeout(state.broadcast?.reactionTimer);state.replay=null;state.replayIntro=null;state.replayOutro=null;audio.stop();await leaveMatchChannel();const root=$('wcWorldCupBroadcast');root?.classList.remove('is-open');root?.setAttribute('aria-hidden','true');restoreWorldCupMenuAudio();
  }

  window.RepoSportsWorldCupGameplay={open:openBroadcast,close:closeBroadcast};
  window.addEventListener('repo-world-cup-live-start',e=>{const d=e.detail||{};openBroadcast({fixtureId:d.fixtureId,fixture:d.fixture,home:d.home,away:d.away,host:d.host,startedAt:d.startedAt})});
})();
