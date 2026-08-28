(function(){
  'use strict';
  // V34.32.1 — real Quick Sim / Full Sim acceleration for Career Season races; same Dragon Racing engine.
  if(window.__dragonRacingRaceV3432)return;
  window.__dragonRacingRaceV3432=true;

  const WORLD_W=1536,WORLD_H=1024,RACER_COUNT=6;
  // V34.29.7 — Competitive Field & Overtake Resolution
  const LUMERRE_TRACK_ID='lumerre_crown_circuit';
  const LUMERRE_WORLD_W=1672,LUMERRE_WORLD_H=941;
  const DEFAULT_TRACK_ID='velmora_city_circuit';
  const SHARED_RACE_MUSIC='dragon-racing-assets/audio/velmora-city-circuit.mp3';
  const CANTO_RACE_MUSIC='dragon-racing-assets/audio/canto-meadow-race.mp3';
  const BLACKGLASS_RACE_MUSIC='dragon-racing-assets/audio/blackglass-race-theme.mp3';
  const WING_SOUNDS=['dragon-racing-assets/audio/wing-flap-01.mp3','dragon-racing-assets/audio/wing-flap-02.mp3'];
  const CROWD_SOUND='dragon-racing-assets/audio/stadium-crowd.mp3';
  const COUNTDOWN_SOUND='dragon-racing-assets/audio/city-circuit-countdown.mp3';
  const DEFAULT_RACE_MUSIC_VOLUME=.36,CROWD_VOLUME=.07,COUNTDOWN_VOLUME=.45,RACE_NUMBER=1;
  const CITY_CIRCUIT_MARKS=[75,60,52,45,40,35];
  const CANTO_MEADOW_MARKS=[85,68,58,50,44,39];
  const CITY_CIRCUIT_GP=[3000,2600,2300,2100,1900,1700];
  const CANTO_MEADOW_GP=[3800,3300,3000,2700,2400,2200];
  const BLACKGLASS_MARKS=[0,0,0,0,0,0];
  const BLACKGLASS_GP=[0,0,0,0,0,0];
  const TRACK_CONFIGS={
    velmora_city_circuit:{
      id:'velmora_city_circuit',name:'Velmora City Circuit',shortName:'VELMORA CITY CIRCUIT',
      asset:'dragon-racing-assets/velmora-city-circuit.webp',laps:3,marks:CITY_CIRCUIT_MARKS,gp:CITY_CIRCUIT_GP,estimatedCycleMs:122000,
      music:SHARED_RACE_MUSIC,musicVolume:DEFAULT_RACE_MUSIC_VOLUME,crowdVolume:.07,paceMultiplier:1,cameraZoomMultiplier:1,roadBase:44,roadDepth:18,
      checkpoints:[.055,.12,.185,.25,.315,.38,.445,.51,.575,.64,.705,.77,.835,.9,.955],
      sectors:[
        {id:'harbour-launch',name:'Harbour Launch',start:0,end:.18},
        {id:'crown-avenue',name:'Crown Avenue',start:.18,end:.38},
        {id:'north-arc',name:'North Arc',start:.38,end:.58},
        {id:'lantern-bend',name:'Lantern Bend',start:.58,end:.78},
        {id:'velmora-straight',name:'Velmora Straight',start:.78,end:1}
      ],
      controlPoints:[
        [329,630],[365,660],[420,706],[490,754],[575,793],[670,818],[770,820],[870,800],
        [970,758],[1060,704],[1145,637],[1220,566],[1280,500],[1310,438],[1302,380],
        [1268,335],[1215,302],[1150,276],[1080,252],[1005,226],[930,202],[850,181],
        [775,169],[705,176],[650,195],[605,222],[565,252],[520,280],[466,306],
        [408,330],[350,353],[304,382],[270,418],[247,458],[238,500],[242,542],
        [258,578],[285,608],[329,630]
      ]
    },
    canto_meadow_circuit:{
      id:'canto_meadow_circuit',name:'Canto Meadow Circuit',shortName:'CANTO MEADOW CIRCUIT',
      asset:'dragon-racing-assets/canto-meadow-circuit.webp',laps:3,marks:CANTO_MEADOW_MARKS,gp:CANTO_MEADOW_GP,estimatedCycleMs:122000,
      music:CANTO_RACE_MUSIC,musicVolume:.40,crowdVolume:.08,paceMultiplier:1.012,cameraZoomMultiplier:.965,roadBase:50,roadDepth:20,
      checkpoints:[.055,.12,.185,.25,.315,.38,.445,.51,.575,.64,.705,.77,.835,.9,.955],
      sectors:[
        {id:'meadow-launch',name:'Meadow Launch',start:0,end:.18},
        {id:'windmill-rise',name:'Windmill Rise',start:.18,end:.38},
        {id:'willow-chicane',name:'Willow Chicane',start:.38,end:.58},
        {id:'river-run',name:'River Run',start:.58,end:.78},
        {id:'canto-straight',name:'Canto Straight',start:.78,end:1}
      ],
      controlPoints:[
        [260,650],[300,682],[360,715],[440,758],[530,795],[630,824],[740,842],[850,844],
        [960,826],[1060,790],[1145,742],[1220,690],[1280,635],[1320,580],[1338,525],
        [1330,474],[1300,430],[1260,394],[1205,360],[1140,329],[1070,300],[995,270],
        [920,240],[845,210],[775,188],[710,181],[650,190],[600,212],[560,245],[535,282],
        [505,315],[462,345],[415,370],[360,397],[315,425],[280,458],[255,495],[238,535],
        [230,575],[235,612],[248,635],[260,650]
      ]
    },
    blackglass_night_circuit:{
      id:'blackglass_night_circuit',name:'Blackglass Night Circuit',shortName:'BLACKGLASS NIGHT CIRCUIT',
      asset:'dragon-racing-assets/blackglass-night-circuit.webp',worldWidth:1672,worldHeight:941,laps:3,marks:BLACKGLASS_MARKS,gp:BLACKGLASS_GP,estimatedCycleMs:128000,
      music:BLACKGLASS_RACE_MUSIC,musicVolume:.40,crowdVolume:.065,paceMultiplier:1.004,cameraZoomMultiplier:.965,roadBase:39,roadDepth:8,
      checkpoints:[.05,.11,.17,.23,.29,.35,.41,.47,.53,.59,.65,.71,.77,.83,.89,.95],
      sectors:[
        {id:'blackglass-straight',name:'Blackglass Straight',start:0,end:.14},
        {id:'crown-descent',name:'Crown Descent',start:.14,end:.30},
        {id:'saltwake-run',name:'Saltwake Run',start:.30,end:.49},
        {id:'needle-gate',name:'Needle Gate',start:.49,end:.65},
        {id:'ember-steps',name:'Ember Steps',start:.65,end:.81},
        {id:'storm-span',name:'Storm Span',start:.81,end:1}
      ],
      controlPoints:[
        [1185,305],[1310,350],[1420,405],[1505,485],[1540,565],[1528,640],[1470,710],[1370,760],
        [1240,800],[1090,823],[930,833],[760,827],[600,816],[455,800],[330,770],[225,725],
        [150,665],[105,600],[105,550],[130,510],[190,480],[275,455],[350,430],[395,400],
        [400,365],[365,340],[300,320],[230,300],[185,270],[160,230],[172,190],[210,160],
        [280,145],[380,150],[500,170],[630,195],[760,215],[900,225],[1020,235],[1110,252],
        [1185,305]
      ]
    }
  };
  const COUNTDOWN_CUES=[{at:0,label:'3',lights:1},{at:1312,label:'2',lights:2},{at:2446,label:'1',lights:3},{at:3829,label:'GO!',lights:4}];
  const TAKEOFF_RUN_MS=720,TAKEOFF_MS=420,LAND_MS=390,LAND_RUN_MS=720;
  const FALLBACK_ANIMS={idle:[0],walk:[5,6,7],takeOff:[12,13],fly:[8,9,10,11,10,9],land:[14,15]};
  const STORY_RACER_SPRITES={
    'story-catasthma':'catasthma','story-covidpanda':'covidpanda','story-emlux':'emlux','story-kat':'kat','story-proco':'proco','story-smokedrope1028':'smokedrope1028',
    'story-tyrese':'tyrese','story-jalen':'jalen','story-kestrel':'kestrel'
  };
  const STORY_PLAYER_BREEDS={catasthma:'story-catasthma',covidpanda:'story-covidpanda',emlux:'story-emlux',kat:'story-kat',proco:'story-proco',smokedrope1028:'story-smokedrope1028'};
  const RACE_BREED_PROFILES={
    'story-catasthma':{facing:'right',fly:[8,9,10,11,10,9],takeOff:[12,13],land:[14,15]},
    'story-covidpanda':{facing:'right',fly:[8,9,10,11,10,9],takeOff:[12,13],land:[14,15]},
    'story-emlux':{facing:'right',fly:[8,9,10,11,10,9],takeOff:[12,13],land:[14,15]},
    'story-kat':{facing:'right',fly:[8,9,10,11,10,9],takeOff:[12,13],land:[14,15]},
    'story-proco':{facing:'right',fly:[8,9,10,11,10,9],takeOff:[12,13],land:[14,15]},
    'story-smokedrope1028':{facing:'right',fly:[8,9,10,11,10,9],takeOff:[12,13],land:[14,15]},
    'story-tyrese':{facing:'right',fly:[8,9,10,11,10,9],takeOff:[12,13],land:[14,15]},
    'story-jalen':{facing:'right',fly:[8,9,10,11,10,9],takeOff:[12,13],land:[14,15]},
    'story-kestrel':{facing:'right',fly:[8,9,10,11,10,9],takeOff:[12,13],land:[14,15]},
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
    'iskandar':{facing:'left',groundFacing:'right',airFacing:'left',takeOffFacing:'left',landFacing:'left',fly:[8, 9, 10, 9],takeOff:[12, 13],land:[14, 15]},
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
  const RACING_MAX_XP=13034431;
  function racingXpForLevel(level){const target=Math.max(1,Math.min(99,Math.floor(Number(level)||1)));if(target<=1)return 0;let points=0;for(let lvl=1;lvl<target;lvl++)points+=Math.floor(lvl+300*Math.pow(2,lvl/7));return Math.floor(points/4);}
  function racingLevelFromXp(xp){const value=Math.max(0,Math.min(RACING_MAX_XP,Number(xp)||0));for(let level=2;level<=99;level++)if(value<racingXpForLevel(level))return level-1;return 99;}
  const state={trackId:DEFAULT_TRACK_ID,phase:'closed',game:null,viewport:null,world:null,racers:[],player:null,raf:0,lastT:0,simClock:0,raceStartedAt:0,raceStartedEpochMs:0,finishAt:0,keys:{up:false,down:false,left:false,right:false,boost:false},camera:{x:WORLD_W/2,y:WORLD_H/2,zoom:1,targetX:WORLD_W/2,targetY:WORLD_H/2,targetZoom:1,mode:'wide',eventUntil:0,nextDecisionAt:0,nextEventAt:0,subjectIds:[],finalLapShown:false,finalStraightShown:false,photoFinishDone:false,forcedMode:''},samples:[],totalLength:0,debugPath:false,countdownToken:0,resultOrder:[],lapBannerTimer:0,raceMusic:null,finalLapMusic:null,wingAudio:[],crowdAudio:null,countdownAudio:null,nextWingAt:0,sequenceTimers:[],audioFadeToken:0,aiStatsPersisted:false,nextHudLayoutAt:0,nextHudTickAt:0,nextRaceStoryAt:0,nextCameraEvalAt:0,nextFocusAt:0,rewardRunId:0,raceRewardSessionId:'',raceRewardPromise:null,raceRewardClaim:null,raceOrderIds:[],pendingOrderKey:'',pendingOrderAt:0,lastLeaderId:'',lastRaceEventAt:0,raceEventTimer:0,raceStory:{overtakes:0,leadChanges:0},storyRace:null,finalLapDramaStarted:false,photoFinishHoldUntil:0,finishRevealTimer:0,broadcastEvents:[],battleWatch:{},activeBattleKey:'',lastBattleCalloutAt:0,lastFastestEventAt:0,fastestSectors:{},nextBroadcastHudAt:0,director:{lastCutAt:0,holdUntil:0,lastSubjectKey:'',lastMode:'follow'},raceStoryMemoryLimit:14,finalLapAudioFadeToken:0};

  function activeTrack(){return TRACK_CONFIGS[state.trackId]||TRACK_CONFIGS[DEFAULT_TRACK_ID];}
  function activeWorldWidth(){return Math.max(1,Number(activeTrack().worldWidth)||WORLD_W);}
  function activeWorldHeight(){return Math.max(1,Number(activeTrack().worldHeight)||WORLD_H);}
  function activeMusicVolume(){const v=Number(activeTrack().musicVolume);return Number.isFinite(v)&&v>=0?v:DEFAULT_RACE_MUSIC_VOLUME;}
  function isBlackglassMusicScene(){return activeTrack().id==='blackglass_night_circuit';}
  function isLumerreTrack(){return activeTrack().id===LUMERRE_TRACK_ID;}
  function isLumerreStoryRace(){return isStoryRace()&&state.trackId===LUMERRE_TRACK_ID;}
  function isSeasonStoryRace(){return isStoryRace()&&Number(state.storyRace?.seasonRound)>0;}
  function displayRaceNumber(){return isSeasonStoryRace()?Math.max(1,Number(state.storyRace?.seasonRound)||1):RACE_NUMBER;}
  function broadcastRaceModeLabel(){const mode=normKey(state.storyRace?.presentationMode||'watch');return isSeasonStoryRace()?(mode==='full'?'FULL SIM · LIVE ENGINE':mode==='quick'?'QUICK SIM · DECISIVE WINDOWS':'WATCH LIVE · AUTONOMOUS RACE'):'LIVE AUTONOMOUS RACE';}
  function raceMusicTarget(multiplier=1){return isBlackglassMusicScene()?activeMusicVolume():activeMusicVolume()*multiplier;}
  function activeCrowdVolume(){const v=Number(activeTrack().crowdVolume);return Number.isFinite(v)&&v>=0?v:CROWD_VOLUME;}
  function activeCountdownVolume(){const v=Number(activeTrack().countdownVolume);return Number.isFinite(v)&&v>=0?v:COUNTDOWN_VOLUME;}
  function crowdTarget(lift=0){return clamp(activeCrowdVolume()+Number(lift||0),0,.16);}
  function trackById(id){return TRACK_CONFIGS[id]||null;}
  function normalizedDescriptorPoint(point,width,height){
    const rawX=Number(point?.x ?? point?.[0]),rawY=Number(point?.y ?? point?.[1]);
    if(!Number.isFinite(rawX)||!Number.isFinite(rawY))return null;
    const x=Math.abs(rawX)<=1.5?rawX*width:rawX;
    const y=Math.abs(rawY)<=1.5?rawY*height:rawY;
    return [clamp(x,0,width),clamp(y,0,height)];
  }
  function registerLumerreCareerTrack(descriptor={},audio={}){
    const id=String(descriptor?.id||descriptor?.trackId||descriptor?.key||LUMERRE_TRACK_ID);
    if(id!==LUMERRE_TRACK_ID)return null;
    const width=Math.max(900,Number(descriptor?.worldWidth)||LUMERRE_WORLD_W),height=Math.max(600,Number(descriptor?.worldHeight)||LUMERRE_WORLD_H);
    const rawPoints=Array.isArray(descriptor?.waypoints)&&descriptor.waypoints.length>=8?descriptor.waypoints:Array.isArray(descriptor?.waypointPercent)?descriptor.waypointPercent.map(p=>({x:Number(p?.[0])/100,y:Number(p?.[1])/100})):[];
    let controlPoints=rawPoints.map(point=>normalizedDescriptorPoint(point,width,height)).filter(Boolean);
    if(controlPoints.length<8)return null;
    const first=controlPoints[0],last=controlPoints[controlPoints.length-1];
    if(Math.hypot(first[0]-last[0],first[1]-last[1])>2)controlPoints.push([...first]);
    const mainMusic=String(audio?.main||audio?.music||descriptor?.music||'').trim();
    const finalLapMusic=String(audio?.finalLap||descriptor?.finalLapMusic||'').trim();
    TRACK_CONFIGS[LUMERRE_TRACK_ID]={
      id:LUMERRE_TRACK_ID,name:String(descriptor?.name||'Lumerre Crown Circuit'),shortName:'LUMERRE CROWN CIRCUIT',
      asset:String(descriptor?.background||descriptor?.circuitImage||descriptor?.image||'dragonbound-career-mode/story/chapter6/race/lumerre-crown-full-map.png'),
      worldWidth:width,worldHeight:height,laps:Math.max(1,Number(descriptor?.laps||descriptor?.totalLaps)||10),marks:[0,0,0,0,0,0],gp:[0,0,0,0,0,0],estimatedCycleMs:390000,
      music:mainMusic||SHARED_RACE_MUSIC,finalLapMusic:finalLapMusic||'',musicVolume:clamp(Number(audio?.mainVolume ?? descriptor?.musicVolume ?? .24),0,1),finalLapMusicVolume:clamp(Number(audio?.finalLapVolume ?? descriptor?.finalLapMusicVolume ?? .28),0,1),
      crowdVolume:clamp(Number(audio?.crowdVolume ?? descriptor?.crowdVolume ?? .12),0,.16),countdownVolume:clamp(Number(audio?.countdownVolume ?? descriptor?.countdownVolume ?? .05),0,1),
      paceMultiplier:1.012,cameraZoomMultiplier:.955,roadBase:30,roadDepth:6,arcLengthProgress:true,
      checkpoints:[.05,.11,.17,.23,.29,.35,.41,.47,.53,.59,.65,.71,.77,.83,.89,.95],
      sectors:[
        {id:'crown-gate',name:'Crown Gate',start:0,end:.12},
        {id:'lower-terraces',name:'Lower Terraces',start:.12,end:.30},
        {id:'garden-sweep',name:'Garden Sweep',start:.30,end:.45},
        {id:'grand-ascent',name:'Grand Ascent',start:.45,end:.58},
        {id:'upper-terrace',name:'Upper Terrace',start:.58,end:.76},
        {id:'crown-descent',name:'Crown Descent',start:.76,end:.90},
        {id:'final-arch',name:'Final Arch',start:.90,end:1}
      ],
      controlPoints,presentation:{...(descriptor?.presentation||{})},careerOnly:true
    };
    return TRACK_CONFIGS[LUMERRE_TRACK_ID];
  }
  function activeLaps(){return Math.max(1,Number(activeTrack().laps)||3);}
  function activeCheckpoints(){return activeTrack().checkpoints||TRACK_CONFIGS[DEFAULT_TRACK_ID].checkpoints;}
  function activeControlPoints(){return activeTrack().controlPoints||TRACK_CONFIGS[DEFAULT_TRACK_ID].controlPoints;}
  function raceClockNow(){return state.raceStartedAt&&state.simClock?Math.max(state.raceStartedAt,state.simClock):now();}
  function raceElapsedMs(){return state.raceStartedAt?Math.max(0,raceClockNow()-state.raceStartedAt):(state.raceStartedEpochMs?Math.max(0,Date.now()-state.raceStartedEpochMs):0);}
  function seasonPresentationMode(){return isSeasonStoryRace()?normKey(state.storyRace?.presentationMode||'watch'):'watch';}
  function seasonSimulationRate(){
    const mode=seasonPresentationMode();
    if(mode==='full')return 12;
    if(mode!=='quick')return 1;
    // Quick Sim races through the routine laps, slows to real time for the decisive call, then accelerates to the flag.
    const callIndex=Math.max(0,Number(state.storyRace?.seasonCallIndex)||0);
    const distance=Math.max(0,Number(state.player?.distance)||0);
    const decisive=seasonRaceCallDefinition(1);
    if(callIndex===1&&distance>=(Number(decisive?.trigger)||Infinity)-.045)return 1;
    return 7;
  }
  function activeSectors(){return activeTrack().sectors||[{id:'circuit',name:'Circuit',start:0,end:1}];}
  function sectorIndexForDistance(distance){const f=mod1(Math.max(0,Number(distance)||0)),sectors=activeSectors();for(let i=0;i<sectors.length;i++){const s=sectors[i];if(f>=Number(s.start||0)&&f<Number(s.end??1))return i;}return Math.max(0,sectors.length-1);}
  function sectorForDistance(distance){const sectors=activeSectors();return sectors[sectorIndexForDistance(distance)]||sectors[0];}
  function raceGapEstimateMs(ahead,behind){if(!ahead||!behind)return 0;const gap=Math.max(0,(Number(ahead.distance)||0)-(Number(behind.distance)||0));const pace=Math.max(.018,((Number(ahead.speed)||0)+(Number(behind.speed)||0))/2||Number(ahead.ai?.base)||.0265);return gap/pace*1000;}
  function formatInterval(ms){const sec=Math.max(0,Number(ms)||0)/1000;return sec<10?`+${sec.toFixed(2)}`:sec<60?`+${sec.toFixed(1)}`:`+${Math.floor(sec/60)}:${(sec%60).toFixed(1).padStart(4,'0')}`;}
  function directorPairKey(a,b){return a&&b?`${a.id}>${b.id}`:'';}
  function raceMemory(type,data={}){const memory=state.raceStory.events||(state.raceStory.events=[]);memory.push({type,atMs:Math.round(raceElapsedMs()),lap:Math.min(activeLaps(),Math.floor(Math.max(0,Number(data.distance ?? state.player?.distance ?? 0)||0))+1),sector:String(data.sector||sectorForDistance(data.distance ?? state.player?.distance ?? 0)?.name||''),...data});if(memory.length>state.raceStoryMemoryLimit)memory.splice(0,memory.length-state.raceStoryMemoryLimit);}

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
      const {data,error}=await dbc.rpc('dragonbound_start_race_reward',{p_track_id:state.trackId});
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
  function marksForPosition(position,trackId=state.trackId){
    const track=trackById(trackId)||activeTrack(),payouts=track.marks||CITY_CIRCUIT_MARKS;
    const index=Math.max(0,Math.min(payouts.length-1,(Number(position)||1)-1));
    return Number(payouts[index])||0;
  }
  function getRewardInfo(trackId=state.trackId){
    const track=trackById(trackId);
    if(!track)return null;
    const payouts=[...(track.marks||[])],gpPayouts=[...(track.gp||[])],averageBaseMarksPerRace=payouts.reduce((sum,v)=>sum+Number(v||0),0)/Math.max(1,payouts.length),averageGpPerRace=gpPayouts.reduce((sum,v)=>sum+Number(v||0),0)/Math.max(1,gpPayouts.length);
    const estimatedCycleMs=Math.max(1,Number(track.estimatedCycleMs)||122000);
    return {payouts,gpPayouts,averageBaseMarksPerRace,averageGpPerRace,estimatedCycleMs,averageMarksPerHour:Math.round(averageBaseMarksPerRace*(3600000/estimatedCycleMs)),averageGpPerHour:Math.round(averageGpPerRace*(3600000/estimatedCycleMs))};
  }

  function rewardBreakdownText(reward){
    const b=reward?.breakdown||{},parts=[];
    if(Number(b.finish)>0)parts.push(`Finish ${Number(b.finish).toLocaleString('en-GB')}`);
    if(Number(b.personalBest)>0)parts.push(`PB +${Number(b.personalBest).toLocaleString('en-GB')}`);
    if(Number(b.bestLap)>0)parts.push(`Best lap +${Number(b.bestLap).toLocaleString('en-GB')}`);
    if(Number(b.firstRaceToday)>0)parts.push(`First race +${Number(b.firstRaceToday).toLocaleString('en-GB')}`);
    if(Number(b.firstWinToday)>0)parts.push(`First win +${Number(b.firstWinToday).toLocaleString('en-GB')}`);
    if(Number(reward?.gpAwarded)>0)parts.push(`+${Number(reward.gpAwarded).toLocaleString('en-GB')} GP`);
    if(Number(reward?.xpAwarded)>0)parts.push(`Racing +${Number(reward.xpAwarded).toLocaleString('en-GB')} XP`);
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
    const dbc=raceDb(),beforeProgress=getProgression();
    if(!dbc){if(status)status.textContent='Race rewards require a signed-in connection.';return null;}
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
      const progression=syncProgressionCache(reward.dragonRacingXp,reward.dragonRacingLevel,reward.nextLevelXp);
      if(balanceEl)balanceEl.textContent=`${Number(reward.balance||0).toLocaleString('en-GB')} Marks · ${Number(reward.gpBalance||0).toLocaleString('en-GB')} GP · Dragon Racing Lv. ${progression.level} · ${progression.xp.toLocaleString('en-GB')} XP`;
      if(rewardCard){rewardCard.classList.remove('is-pending');rewardCard.classList.add('is-awarded');}
      if(rewardKicker)rewardKicker.textContent='MARKS + GP + DRAGON RACING XP';
      const playerMarks=card?.querySelector('[data-race-marks-racer="player"]');
      if(playerMarks){
        const value=playerMarks.querySelector('b');
        if(value)value.textContent=`+${Number(reward.totalMarks||0).toLocaleString('en-GB')}`;
        playerMarks.classList.toggle('has-bonus',Number(reward.totalMarks||0)>marksForPosition(rank));
        playerMarks.title=Number(reward.totalMarks||0)>marksForPosition(rank)?'Includes your race bonuses':'Finish-position reward';
      }
      try{if(typeof character!=='undefined'&&character&&reward.gpBalance!=null)character.gp=Number(reward.gpBalance)||0;}catch(_e){}
      try{window.DragonboundFurniture?.refresh?.(false,true);}catch(_e){}
      try{window.dispatchEvent(new CustomEvent('dragonbound:keeper-marks-changed',{detail:{source:'dragon-racing',marks:Number(reward.totalMarks||0),balance:Number(reward.balance||0)}}));}catch(_e){}
      try{window.dispatchEvent(new CustomEvent('dragon-racing:progression-changed',{detail:{source:'race-complete',xpAwarded:Number(reward.xpAwarded||0),xp:progression.xp,level:progression.level,previousLevel:Number(beforeProgress.level)||1}}));}catch(_e){}
      try{window.dispatchEvent(new CustomEvent('dragonbound:race-finished',{detail:{source:'dragon-racing',trackId:String(state.trackId||''),finishPosition:Math.max(1,Math.min(6,Number(rank)||6)),won:Number(rank)===1,xpAwarded:Number(reward.xpAwarded||0),gpAwarded:Number(reward.gpAwarded||0),raceStory:JSON.parse(JSON.stringify(state.raceStory||{})),at:Date.now()}}));}catch(_e){}
      if(progression.level>Number(beforeProgress.level||1)){try{if(typeof toast==='function')toast(`Dragon Racing Level ${progression.level}!`,4200);}catch(_e){}if(Number(beforeProgress.level||1)<9&&progression.level>=9){try{if(typeof toast==='function')setTimeout(()=>toast('Canto Meadow Circuit unlocked!',4800),700);}catch(_e){}}}
      try{if(typeof renderCharacter==='function')renderCharacter();}catch(_e){}
      return reward;
    }catch(err){
      console.warn('[Dragon Racing] Race reward claim failed.',err);
      if(status)status.textContent='Race rewards unavailable for this race.';
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
  function isStoryRace(){return !!state.storyRace;}
  function storyPlayerInfo(){
    if(!state.storyRace)return getPlayerInfo();
    const key=String(state.storyRace.playerKey||state.storyRace.accountKey||currentAccount()).toLowerCase().replace(/[^a-z0-9]/g,'');
    const breed=STORY_PLAYER_BREEDS[key]||STORY_PLAYER_BREEDS[currentAccount()]||'story-catasthma';
    const name=String(state.storyRace.playerName||getPlayerInfo().name||'Your Dragon');
    return{name,breed,account:key||currentAccount(),sprite:spriteSrc(breed,8)};
  }
  function storyStrategyIdentity(){const strategy=normKey(state.storyRace?.strategy||'focus');return strategy==='fire'?{style:'bold'}:strategy==='heart'?{style:'late'}:{style:'smooth'};}
  function saveKey(){const p=getPlayerInfo();return `velmoraDragonRacing:v1:${p.account}:${normKey(p.name)}:${p.breed}`;}
  function loadSave(){
    let data={version:2,level:1,xp:0,tracks:{},aiPool:{}};
    try{const raw=JSON.parse(localStorage.getItem(saveKey())||'null');if(raw&&typeof raw==='object')data={...data,...raw,tracks:{...(raw.tracks||{})},aiPool:{...(raw.aiPool||{})}};}catch(_e){}
    data.level=Math.max(1,Number(data.level)||1);data.xp=Math.max(0,Number(data.xp)||0);return data;
  }
  function saveData(data){try{localStorage.setItem(saveKey(),JSON.stringify({...data,lastSavedAt:Date.now()}));}catch(_e){}}
  function syncProgressionCache(xp,serverLevel=0,nextLevelXp=0){const value=Math.max(0,Math.min(RACING_MAX_XP,Number(xp)||0)),level=Math.max(1,Number(serverLevel)||racingLevelFromXp(value));const s=loadSave();s.xp=value;s.level=level;saveData(s);try{if(typeof character!=='undefined'&&character)character.dragon_racing_xp=value;}catch(_e){}return{xp:value,level,nextLevelXp:Number(nextLevelXp)||racingXpForLevel(Math.min(99,level+1))};}
  function getProgression(){let accountXp=NaN;try{if(typeof character!=='undefined'&&character)accountXp=Number(character.dragon_racing_xp);}catch(_e){}const s=loadSave(),xp=Number.isFinite(accountXp)?Math.max(0,accountXp):Math.max(0,Number(s.xp)||0),level=racingLevelFromXp(xp);return{level,xp,nextLevelXp:level>=99?RACING_MAX_XP:racingXpForLevel(level+1)};}
  async function refreshProgression(){const dbc=raceDb();if(!dbc)return getProgression();try{const {data,error}=await dbc.rpc('get_my_dragon_racing_progression');if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(!row)return getProgression();return syncProgressionCache(row.xp,row.level,row.nextLevelXp);}catch(err){console.warn('[Dragon Racing] Could not refresh account racing XP.',err);return getProgression();}}
  function getTrackStats(id=state.trackId||DEFAULT_TRACK_ID){const s=loadSave();return {...(s.tracks?.[id]||{})};}
  function spriteSrc(breed,frame=8){const storyDir=STORY_RACER_SPRITES[normKey(breed)];if(storyDir)return `dragon-racing-assets/story-racers/${storyDir}/frame-${String(frame).padStart(2,'0')}.webp`;return `assets/dragonbound/baby-dragons/${breed}/frame-${String(frame).padStart(2,'0')}.webp`;}
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
  function nativeFacingRight(breed,motion='fly'){
    const profile=raceBreedProfile(breed);
    // V33.76: some source sheets use a different native direction for ground and air frames.
    // Iskandar's walk/idle frames face right, while its race flight/transition frames face left.
    let facing=profile.facing;
    if(motion==='walk'||motion==='idle')facing=profile.groundFacing||profile.facing;
    else if(motion==='takeOff')facing=profile.takeOffFacing||profile.airFacing||profile.facing;
    else if(motion==='land')facing=profile.landFacing||profile.airFacing||profile.facing;
    else if(motion==='fly')facing=profile.airFacing||profile.facing;
    return facing!=='left';
  }
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
      return {breed,displayName:registry?.displayName||breed,facing:p.facing,groundFacing:p.groundFacing||p.facing,airFacing:p.airFacing||p.facing,takeOffFacing:p.takeOffFacing||p.airFacing||p.facing,landFacing:p.landFacing||p.airFacing||p.facing,flyFrames:[...p.fly],takeOffFrames:[...p.takeOff],landFrames:[...p.land],registryFacing:String(registry?.nativeFacing||''),registered:!!registry};
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
    const wantedMusic=activeTrack().music||SHARED_RACE_MUSIC;
    if(!state.raceMusic||state.raceMusic.dataset?.trackSrc!==wantedMusic){
      try{state.raceMusic?.pause();}catch(_e){}
      state.raceMusic=new Audio(wantedMusic);state.raceMusic.loop=true;state.raceMusic.preload='auto';state.raceMusic.volume=activeMusicVolume();
      try{state.raceMusic.dataset.trackSrc=wantedMusic;}catch(_e){}
    }
    const wantedFinal=String(activeTrack().finalLapMusic||'');
    if(wantedFinal&&(!state.finalLapMusic||state.finalLapMusic.dataset?.trackSrc!==wantedFinal)){
      try{state.finalLapMusic?.pause();}catch(_e){}
      state.finalLapMusic=new Audio(wantedFinal);state.finalLapMusic.loop=true;state.finalLapMusic.preload='auto';state.finalLapMusic.volume=0;
      try{state.finalLapMusic.dataset.trackSrc=wantedFinal;}catch(_e){}
    }else if(!wantedFinal&&state.finalLapMusic){try{state.finalLapMusic.pause();state.finalLapMusic.currentTime=0;}catch(_e){}state.finalLapMusic=null;}
    if(!state.wingAudio.length)state.wingAudio=WING_SOUNDS.map(src=>{const a=new Audio(src);a.preload='auto';return a;});
    if(!state.crowdAudio){state.crowdAudio=new Audio(CROWD_SOUND);state.crowdAudio.loop=true;state.crowdAudio.preload='auto';}
    state.crowdAudio.volume=activeCrowdVolume();
    if(!state.countdownAudio){state.countdownAudio=new Audio(COUNTDOWN_SOUND);state.countdownAudio.preload='auto';}
    state.countdownAudio.volume=activeCountdownVolume();
  }
  function crossfadeToFinalLapMusic(duration=1050){
    ensureRaceAudio();
    const next=state.finalLapMusic;if(!next||!activeTrack().finalLapMusic)return false;
    const previous=state.raceMusic,token=++state.finalLapAudioFadeToken,start=now(),fromPrev=Number(previous?.volume)||0,fromNext=Number(next.volume)||0,target=clamp(Number(activeTrack().finalLapMusicVolume)||.28,0,1);
    try{next.currentTime=0;const play=next.play();if(play&&typeof play.catch==='function')play.catch(()=>{});}catch(_e){}
    const tick=t=>{if(token!==state.finalLapAudioFadeToken)return;const q=clamp((t-start)/Math.max(1,duration),0,1),ease=1-Math.pow(1-q,2);if(previous)previous.volume=lerp(fromPrev,0,ease);next.volume=lerp(fromNext,target,ease);if(q<1)requestAnimationFrame(tick);else if(previous){try{previous.pause();}catch(_e){}}};
    requestAnimationFrame(tick);return true;
  }
  function fadeAudio(audio,target,ms=500){
    if(!audio)return;const token=++state.audioFadeToken,start=Number(audio.volume)||0,end=clamp(target,0,1),started=now(),duration=Math.max(1,ms);
    const tick=t=>{if(token!==state.audioFadeToken)return;const f=clamp((t-started)/duration,0,1);audio.volume=lerp(start,end,f);if(f<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);
  }
  function startRaceAudio(){
    ensureRaceAudio();
    state.finalLapAudioFadeToken++;if(state.finalLapMusic){try{state.finalLapMusic.pause();state.finalLapMusic.currentTime=0;state.finalLapMusic.volume=0;}catch(_e){}}
    const a=state.raceMusic;a.volume=isBlackglassMusicScene()?activeMusicVolume():Math.max(isLumerreTrack()?.12:.18,activeMusicVolume()*.64);
    try{a.currentTime=0;const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_e){}
    const crowd=state.crowdAudio;crowd.volume=activeCrowdVolume();
    try{crowd.currentTime=0;const p=crowd.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_e){}
    state.nextWingAt=now()+5000+Math.random()*5000;
  }
  function playCountdownAudio(){
    ensureRaceAudio();const a=state.countdownAudio;
    try{a.pause();a.currentTime=0;a.volume=activeCountdownVolume();const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_e){}
  }
  function stopRaceAudio(reset=true){
    state.audioFadeToken++;
    state.finalLapAudioFadeToken++;
    if(state.raceMusic){try{state.raceMusic.pause();if(reset)state.raceMusic.currentTime=0;}catch(_e){}}
    if(state.finalLapMusic){try{state.finalLapMusic.pause();if(reset)state.finalLapMusic.currentTime=0;state.finalLapMusic.volume=0;}catch(_e){}}
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
    const pts=activeControlPoints().slice(0,-1),raw=[];
    for(let i=0;i<pts.length;i++){
      const p0=pts[(i-1+pts.length)%pts.length],p1=pts[i],p2=pts[(i+1)%pts.length],p3=pts[(i+2)%pts.length];
      for(let s=0;s<10;s++)raw.push(catmull(p0,p1,p2,p3,s/10));
    }
    let total=0;for(let i=0;i<raw.length;i++){const a=raw[i],b=raw[(i+1)%raw.length];total+=Math.hypot(b[0]-a[0],b[1]-a[1]);a._len=total;}
    state.totalLength=total;state.samples=raw;
  }
  function pointAt(progress){
    const p=mod1(progress),samples=state.samples,n=samples.length;
    let i=0,f=0;
    // V34.29.6: Lumerre's hand-traced route has deliberately dense control points in
    // technical corners and sparse points on long straights. Index-based progress made
    // equal simulation speed cover wildly different pixel distances: dragons appeared
    // to rocket down straights and almost stop in bends. For Lumerre only, map race
    // progress to cumulative physical path length so 1% of a lap always means 1% of the
    // visible road distance. Existing City/Canto/Blackglass timing remains byte-for-byte
    // on its established index-based geometry behaviour.
    if(activeTrack().arcLengthProgress&&state.totalLength>0&&n>1){
      const target=p*state.totalLength;
      let lo=0,hi=n-1;
      while(lo<hi){const mid=(lo+hi)>>1;if((Number(samples[mid]._len)||0)<target)lo=mid+1;else hi=mid;}
      i=lo;
      const segEnd=Number(samples[i]._len)||0,segStart=i===0?0:(Number(samples[i-1]._len)||0),segLen=Math.max(.000001,segEnd-segStart);
      f=clamp((target-segStart)/segLen,0,1);
    }else{
      const idx=p*n;
      i=Math.floor(idx)%n;
      f=idx-Math.floor(idx);
    }
    const a=samples[i],b=samples[(i+1)%n],prev=samples[(i-1+n)%n],next=samples[(i+2)%n];
    const x=lerp(a[0],b[0],f),y=lerp(a[1],b[1],f),tx=next[0]-prev[0],ty=next[1]-prev[1],mag=Math.hypot(tx,ty)||1,nx=-ty/mag,ny=tx/mag;
    const tx2=(b[0]-a[0]),ty2=(b[1]-a[1]),ang=Math.atan2(ty2,tx2);
    const track=activeTrack(),halfWidth=(Number(track.roadBase)||44)+(y/activeWorldHeight())*(Number(track.roadDepth)||18);
    const prevAng=Math.atan2(a[1]-prev[1],a[0]-prev[0]),nextAng=Math.atan2(next[1]-b[1],next[0]-b[0]);
    let da=Math.abs(nextAng-prevAng);if(da>Math.PI)da=2*Math.PI-da;const curvature=clamp(da/.55,0,1);
    return {x,y,nx,ny,ang,halfWidth,curvature};
  }
  function worldPoint(racer){const p=pointAt(racer.distance);return {...p,x:p.x+p.nx*p.halfWidth*racer.lateral,y:p.y+p.ny*p.halfWidth*racer.lateral};}

  function makeAtmosphere(){
    const confettiColors=['#f4ce63','#ef6559','#5eb7e2','#73c686','#ffffff','#c481ff'];
    const burstPoints=[
      {left:18,top:32},{left:71,top:22},{left:22,top:61},{left:78,top:58},{left:57,top:76}
    ];
    const bursts=burstPoints.map((p,idx)=>`<div class="dragon-race-crowd-burst" style="left:${p.left}%;top:${p.top}%;--delay:${-(idx*2.1)}s;--d:${8.5+(idx%3)*1.8}s">${Array.from({length:10},(_,i)=>`<span class="dragon-race-crowd-burst-piece" style="--x:${-34+(i*7)}px;--y:${-16-(i%5)*8}px;--rot:${180+i*36}deg;background:${confettiColors[(i+idx)%confettiColors.length]}"></span>`).join('')}</div>`).join('');
    if(activeTrack().id==='blackglass_night_circuit'){
      const rain=Array.from({length:34},(_,i)=>`<i class="dragon-race-blackglass-rain" style="left:${(i*29)%100}%;top:${(i*17)%100}%;--delay:${-(i*.19)}s;--d:${1.2+(i%5)*.13}s"></i>`).join('');
      const embers=Array.from({length:13},(_,i)=>`<i class="dragon-race-blackglass-ember" style="left:${8+(i*37)%87}%;top:${20+(i*23)%68}%;--delay:${-(i*.61)}s"></i>`).join('');
      return `<div class="dragon-race-blackglass-moon"></div><div class="dragon-race-blackglass-rainfield">${rain}</div><div class="dragon-race-blackglass-embers">${embers}</div><div class="dragon-race-crowd-bursts">${bursts}</div>`;
    }
    if(activeTrack().id==='canto_meadow_circuit'){
      const leafPalette=['#d98b2b','#b24f2f','#e7b44d','#95b857','#c7663d','#7fa84d'];
      const leafs=Array.from({length:10},(_,i)=>{
        const color=leafPalette[i%leafPalette.length];
        const left=-8-(i%3)*5;
        const top=10+(i*7)%74;
        return `<span class="dragon-race-leaf" style="left:${left}%;top:${top}%;--delay:${-(i*1.85)}s;--d:${17+(i%4)*2.5}s;--driftY:${-18+(i%5)*9}px;--rot:${170+(i%4)*70}deg;--scale:${.72+(i%4)*.09};--travel:${28+(i%4)*9}px;--leaf:${color};"></span>`;
      }).join('');
      const motes=Array.from({length:20},(_,i)=>`<i class="dragon-race-sun-mote" style="left:${8+(i*9)%82}%;top:${12+(i*13)%70}%;--d:${6.2+(i%5)*1.35}s;--delay:${-(i*.75)}s;--dx:${8+(i%4)*6}px;--dy:${-10-(i%5)*5}px;--size:${2+(i%3)}px"></i>`).join('');
      const crowdFlags=[
        [15,27],[32,17],[50,13],[70,16],[86,31],[88,60],[73,76],[48,79],[27,72]
      ].map((p,i)=>`<span class="dragon-race-canto-crowd-flag" style="left:${p[0]}%;top:${p[1]}%;--delay:${-(i*.72)}s;--d:${2.8+(i%3)*.45}s;--flag-a:${leafPalette[(i+1)%leafPalette.length]};--flag-b:${leafPalette[(i+3)%leafPalette.length]}"><i></i><b></b></span>`).join('');
      const festivalGlints=Array.from({length:8},(_,i)=>`<i class="dragon-race-canto-festival-glint" style="left:${12+(i*11)%78}%;top:${20+(i*19)%59}%;--delay:${-(i*1.15)}s;--d:${7+(i%4)*1.4}s"></i>`).join('');
      return `<div class="dragon-race-sun-glow is-canto"></div><div class="dragon-race-sun-rays is-canto"></div><div class="dragon-race-sun-motes">${motes}</div><div class="dragon-race-leaf-stream">${leafs}</div><div class="dragon-race-canto-crowd-detail">${crowdFlags}${festivalGlints}</div><div class="dragon-race-crowd-bursts">${bursts}</div>`;
    }
    const palette=[
      {flag:'#d85e4f',trim:'#ffe3a7'},{flag:'#f2bf53',trim:'#fff3c8'},{flag:'#56a9d9',trim:'#eefaff'},
      {flag:'#74c07f',trim:'#eef9e7'},{flag:'#9b73d9',trim:'#faf0ff'},{flag:'#d95f9d',trim:'#fff1f7'}
    ];
    const sparkles=Array.from({length:18},(_,i)=>`<i class="dragon-race-spark" style="left:${6+(i*11)%90}%;top:${8+(i*17)%78}%;--d:${5+(i%6)}s;--delay:${-(i%8)}s;--dx:${-12+(i%5)*7}px;--dy:${-5-(i%4)*4}px"></i>`).join('');
    const flags=Array.from({length:10},(_,i)=>{
      const color=palette[i%palette.length];
      return `<span class="dragon-race-fly-flag" style="left:${4+i*9.2}%;top:${13+(i%5)*8}%;--d:${13+(i%4)*2.4}s;--delay:${-(i*1.6)}s;--travel:${115+(i%3)*24}px;--lift:${-10-(i%4)*4}px;--sway:${2+(i%3)*1.8}deg;--flag:${color.flag};--trim:${color.trim};"></span>`;
    }).join('');
    const confetti=Array.from({length:24},(_,i)=>{
      const c=confettiColors[i%confettiColors.length];
      return `<span class="dragon-race-confetti" style="left:${5+(i*3.7)%90}%;top:${-12-(i%4)*3}%;--x:${-28+(i%7)*9}px;--fall:${86+(i%4)*5}%;--rot:${420+(i%5)*110}deg;--delay:${-(i*0.8)}s;--d:${11+(i%5)*1.4}s;background:${c};"></span>`;
    }).join('');
    return `<div class="dragon-race-sun-glow"></div><div class="dragon-race-sun-rays"></div><div class="dragon-race-sparkles">${sparkles}</div><div class="dragon-race-fly-flags">${flags}</div><div class="dragon-race-confetti-field">${confetti}</div><div class="dragon-race-crowd-bursts">${bursts}</div>`;
  }


  function debugSvg(){
    const pts=state.samples.filter((_,i)=>i%3===0).map(p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const cps=activeCheckpoints().map((p,i)=>{const q=pointAt(p);return `<circle cx="${q.x}" cy="${q.y}" r="7"><title>CP ${i+1}</title></circle>`}).join('');
    return `<svg class="dragon-race-debug-svg" viewBox="0 0 ${activeWorldWidth()} ${activeWorldHeight()}"><polyline points="${pts}"></polyline>${cps}</svg>`;
  }

  function expectedRacerCount(){return (isLumerreStoryRace()||isSeasonStoryRace())?Math.max(2,Math.min(7,Array.isArray(state.storyRace?.entrants)?state.storyRace.entrants.length:7)):RACER_COUNT;}

  function ensureGame(){
    document.getElementById('dragon-race-sky-styles-v3360')?.remove();
    document.getElementById('dragon-race-sky-styles')?.remove();
    const shell=document.querySelector('#dragonRacingModal .dragon-racing-shell');if(!shell)return null;
    let game=shell.querySelector('.dragon-race-game');
    const raceKind=isSeasonStoryRace()?'season-story':isLumerreStoryRace()?'lumerre-story':isStoryRace()?'career-story':'standard';
    if(game&&(game.dataset.trackId!==activeTrack().id||game.dataset.raceKind!==raceKind)){game.remove();game=null;}if(game){game.querySelector('.dragon-race-sky-overlay')?.remove();state.game=game;state.viewport=game.querySelector('.dragon-race-viewport');state.world=game.querySelector('.dragon-race-world');return game;}
    game=document.createElement('div');game.className='dragon-race-game';game.classList.toggle('is-lumerre-crown',isLumerreTrack());
    const track=activeTrack();
    game.dataset.trackId=track.id;game.dataset.raceKind=raceKind;
    game.innerHTML=`<div class="dragon-race-viewport"><div class="dragon-race-world" style="width:${activeWorldWidth()}px;height:${activeWorldHeight()}px"><img class="dragon-race-world-bg" src="${track.asset}" alt="${escapeRaceText(track.name)}"><div class="dragon-race-atmosphere ${track.id==='canto_meadow_circuit'?'is-canto':track.id==='blackglass_night_circuit'?'is-blackglass':track.id===LUMERRE_TRACK_ID?'is-lumerre':''}">${makeAtmosphere()}</div>${debugSvg()}<div class="dragon-race-racers"></div></div><div class="dragon-race-cinematic-pass" aria-hidden="true"></div><div class="dragon-race-tv-glass" aria-hidden="true"></div><div class="dragon-race-hud"><div class="dragon-race-hud-top"><div class="dragon-race-hud-cluster"><div class="dragon-race-hud-box is-position"><small>POSITION</small><b data-race-position>— / ${expectedRacerCount()}</b></div><div class="dragon-race-hud-box"><small>LAP</small><b data-race-lap>1 / ${activeLaps()}</b></div><div class="dragon-race-hud-box"><small>TIME</small><b data-race-time>00:00.00</b></div></div><div class="dragon-race-hud-box dragon-race-hud-dragon"><img data-race-player-icon alt=""><span><strong data-race-player-name>Your Dragon</strong><em>${track.shortName}</em></span></div></div><div class="dragon-race-auto-badge"><b>${broadcastRaceModeLabel()}</b> · Velmora Racing Network</div><div class="dragon-race-live-leaderboard" aria-label="Live race order"><div class="dragon-race-live-leaderboard-head"><span>ORDER</span><em>GAP</em></div><div class="dragon-race-live-leaderboard-list"></div><div class="dragon-race-event-feed" aria-label="Race event feed"></div></div><div class="dragon-race-lap-banner"></div><div class="dragon-race-event-callout" aria-live="polite"><small data-race-event-kicker></small><b data-race-event-text></b></div><div class="dragon-race-team-order" aria-hidden="true"><small>QUICKQUILL TEAM ORDER</small><strong data-team-order-title>HOLD POSITION</strong><span data-team-order-copy>Do not attack Tyrese through this phase.</span><div class="dragon-race-team-order-actions"><button type="button" data-team-order="obey">OBEY</button><button type="button" data-team-order="wait">WAIT</button><button type="button" data-team-order="ignore">IGNORE</button></div></div><div class="dragon-race-broadcast-strip" aria-live="polite"><div class="dragon-race-sector-chip"><small>SECTION</small><b data-race-sector>—</b><em data-race-sector-lap></em></div><div class="dragon-race-battle-chip"><small data-race-battle-kicker>RACE DIRECTOR</small><b data-race-battle-text>FIELD IN VIEW</b></div><div class="dragon-race-fastest-chip"><small>FASTEST SECTION</small><b data-race-fastest-sector>—</b><em data-race-fastest-racer></em></div></div><div class="dragon-race-exit" role="button" tabindex="0">EXIT RACE</div></div><div class="dragon-race-starting-grid" aria-hidden="true"><div class="dragon-race-grid-card"><header><small>VELMORA RACING NETWORK</small><b>STARTING GRID</b><em>${track.shortName}</em></header><div class="dragon-race-grid-list"></div></div></div><div class="dragon-race-broadcast-title"><small>LIVE FROM VELMORA</small><b>${track.shortName}</b><em>RACE ${displayRaceNumber()}</em></div><div class="dragon-race-start-lights" aria-hidden="true"><i></i><i></i><i></i></div><div class="dragon-race-camera-cut" aria-hidden="true"></div><div class="dragon-race-countdown"><b></b></div></div><div class="dragon-race-results"><div class="dragon-race-results-card"></div></div>`;
    shell.appendChild(game);state.game=game;state.viewport=game.querySelector('.dragon-race-viewport');state.world=game.querySelector('.dragon-race-world');
    const exit=game.querySelector('.dragon-race-exit');bindAction(exit,()=>isStoryRace()?returnStoryRace({aborted:true,message:'Race exited.'}):exitToTrackSelect());
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

  const RACE_STYLE_FEEL={
    neutral:{laneRange:.58,laneHold:[3200,5400],laneRate:.26,attackRange:.0080,attackGap:.0100,curvePenalty:.080,paceWobble:.0060,mistakeChance:.055,boostChance:.030,finalPush:.0024},
    smooth:{laneRange:.46,laneHold:[4200,6500],laneRate:.22,attackRange:.0062,attackGap:.0088,curvePenalty:.074,paceWobble:.0035,mistakeChance:.025,boostChance:.024,finalPush:.0020},
    overtaker:{laneRange:.68,laneHold:[2700,4400],laneRate:.32,attackRange:.0105,attackGap:.0128,curvePenalty:.082,paceWobble:.0065,mistakeChance:.060,boostChance:.042,finalPush:.0031},
    bold:{laneRange:.64,laneHold:[2900,4700],laneRate:.30,attackRange:.0095,attackGap:.0115,curvePenalty:.071,paceWobble:.0070,mistakeChance:.080,boostChance:.038,finalPush:.0030},
    cautious:{laneRange:.42,laneHold:[4600,7000],laneRate:.20,attackRange:.0052,attackGap:.0078,curvePenalty:.092,paceWobble:.0038,mistakeChance:.030,boostChance:.018,finalPush:.0018},
    late:{laneRange:.54,laneHold:[3500,5700],laneRate:.25,attackRange:.0083,attackGap:.0102,curvePenalty:.080,paceWobble:.0052,mistakeChance:.045,boostChance:.022,finalPush:.0042}
  };
  const raceStyleFeel=style=>RACE_STYLE_FEEL[style]||RACE_STYLE_FEEL.neutral;
  const approachValue=(value,target,maxStep)=>value<target?Math.min(target,value+maxStep):Math.max(target,value-maxStep);
  function makeAutoProfile(extraBias=0,identity=null){
    // Luck remains the dominant factor. V34.15 changes *how* a racer reaches its pace,
    // rather than handing any style a large hidden speed advantage.
    const raceLuck=(Math.random()-.5)*.064; // ±3.2%
    const style=identity?.style||'neutral',feel=raceStyleFeel(style);
    return {
      base:.0265*(Number(activeTrack().paceMultiplier)||1)*(1+raceLuck+extraBias),raceLuck,extraBias,style,
      targetLane:(Math.random()-.5)*feel.laneRange,laneAt:0,
      paceBias:0,paceTarget:0,paceAt:0,
      surge:0,surgeAt:0,
      mistake:style==='smooth'?.47:style==='cautious'?.44:Math.random(),mistakeUntil:0,mistakeStrength:0,nextMistakeAt:0,
      battle:null,battleCooldownUntil:0,pairCooldown:{},battleWins:0,battleLosses:0,
      lumerrePhaseAt:0,lumerrePhaseTarget:0,lumerrePhaseBias:0,
      boost:100,boostUntil:0,boostCooldown:700+Math.random()*1800
    };
  }

  const RACER_ACCENTS=['#66d5e8','#f0c45e','#ec7d6e','#7fc894','#9e83e0','#72aee8','#e85d9b'];
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
      row.innerHTML=`<b class="dragon-race-live-rank">${index+1}</b><i class="dragon-race-live-marker"></i><span class="dragon-race-live-name">${r.name}</span><small class="dragon-race-live-gap" data-race-gap>${index?'—':'LEADER'}</small><em class="dragon-race-live-change"></em>`;
      list.appendChild(row);
      r.leaderRow=row;r.lastBoardRank=index;r.rankFlashUntil=0;r.rankDirection=0;
    });
  }
  function updateLeaderboard(order,t){
    if(!order?.length)return;
    order.forEach((r,rank)=>{
      const row=r.leaderRow;if(!row)return;
      if(Number.isFinite(r.lastBoardRank)&&r.lastBoardRank!==rank){r.rankDirection=rank<r.lastBoardRank?1:-1;r.rankFlashUntil=t+560;}
      r.lastBoardRank=rank;
      row.style.transform=`translate3d(0,${rank*22}px,0)`;
      const rankEl=row.querySelector('.dragon-race-live-rank');if(rankEl)rankEl.textContent=String(rank+1);
      const gapEl=row.querySelector('[data-race-gap]');if(gapEl)gapEl.textContent=rank===0?'LEADER':formatInterval(raceGapEstimateMs(order[rank-1],r));
      const change=row.querySelector('.dragon-race-live-change'),flashing=t<r.rankFlashUntil;
      row.classList.toggle('is-up',flashing&&r.rankDirection>0);row.classList.toggle('is-down',flashing&&r.rankDirection<0);
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

  function renderStartingGrid(){
    const overlay=state.game?.querySelector('.dragon-race-starting-grid'),list=overlay?.querySelector('.dragon-race-grid-list');if(!list)return;
    const grid=state.racers.slice().sort((a,b)=>(Number(a.slot)||0)-(Number(b.slot)||0));
    list.innerHTML=grid.map((r,index)=>`<div class="dragon-race-grid-row${r.isPlayer?' is-player':''}" style="--grid-delay:${index*55}ms;--racer-accent:${r.accent||racerAccent(r,index)}"><b>${index+1}</b><i></i><span><strong>${escapeRaceText(r.name)}</strong><small>${escapeRaceText(r.isPlayer?'YOUR DRAGON':r.personality||String(r.style||'RACER').toUpperCase())}</small></span>${r.isPlayer?'<em>YOU</em>':''}</div>`).join('');
  }
  function renderBroadcastFeed(){
    const feed=state.game?.querySelector('.dragon-race-event-feed');if(!feed)return;
    feed.innerHTML=state.broadcastEvents.slice(-3).reverse().map(e=>`<div class="dragon-race-feed-row is-${escapeRaceText(e.kind||'race')}"><small>${escapeRaceText(e.time||'')}</small><span>${escapeRaceText(e.kicker||'UPDATE')}</span><b>${escapeRaceText(e.text||'')}</b></div>`).join('');
  }
  function pushBroadcastEvent(kicker,text,kind='race',meta={}){
    const event={kicker:String(kicker||'RACE UPDATE'),text:String(text||''),kind:String(kind||'race'),time:formatTime(raceElapsedMs()),at:Date.now(),...meta};
    const previous=state.broadcastEvents[state.broadcastEvents.length-1];if(previous&&previous.kicker===event.kicker&&previous.text===event.text&&event.at-previous.at<5000)return;
    state.broadcastEvents.push(event);if(state.broadcastEvents.length>8)state.broadcastEvents.splice(0,state.broadcastEvents.length-8);renderBroadcastFeed();
  }
  function recordFastestSector(index,ms,racer,lap){
    if(!Number.isFinite(ms)||ms<500||ms>30000||index<0)return;const current=state.fastestSectors[index];
    if(current&&ms>=current.ms-8)return;state.fastestSectors[index]={ms,racerId:racer.id,racerName:racer.name,lap};
    if(current&&Date.now()-(state.lastFastestEventAt||0)>6500&&raceElapsedMs()>12000){state.lastFastestEventAt=Date.now();const sector=activeSectors()[index];pushBroadcastEvent('FASTEST SECTION',`${racer.name} · ${sector?.name||'SECTOR'} · ${(ms/1000).toFixed(2)}s`,'sector');if(racer.isPlayer||standings().findIndex(x=>x.id===racer.id)<2)showRaceEvent('FASTEST SECTION',`${racer.name} · ${(ms/1000).toFixed(2)}s`,'leader',false);}
  }
  function updateSectorTiming(r,t){
    if(!r||r.finished||r.distance<0)return;const lap=Math.floor(Math.max(0,r.distance)),index=sectorIndexForDistance(r.distance);
    if(!Number.isFinite(r.sectorIndex)||!Number.isFinite(r.sectorLap)||!Number.isFinite(r.sectorStartedAt)||r.sectorStartedAt<=0){r.sectorIndex=index;r.sectorLap=lap;r.sectorStartedAt=t;return;}
    if(index===r.sectorIndex&&lap===r.sectorLap)return;
    const elapsed=Math.max(1,t-r.sectorStartedAt);recordFastestSector(r.sectorIndex,elapsed,r,r.sectorLap+1);r.sectorIndex=index;r.sectorLap=lap;r.sectorStartedAt=t;
  }
  function bestBattleCandidate(order){
    const active=(order||[]).filter(r=>r&&!r.finished),finalLap=active[0]&&active[0].distance>=activeLaps()-1;let best=null;
    for(let i=0;i<active.length-1;i++){const ahead=active[i],behind=active[i+1],gap=Math.max(0,ahead.distance-behind.distance),live=!!ahead.ai?.battle||!!behind.ai?.battle;if(!live&&gap>.0075)continue;let score=clamp((.008-gap)/.008,0,1)*62+(live?24:0)+(i===0?27:i<3?14:4)+(ahead.isPlayer||behind.isPlayer?24:0)+(finalLap?10:0);if(!best||score>best.score)best={ahead,behind,gap,rank:i+1,score,key:directorPairKey(ahead,behind),live};}
    return best;
  }
  function updateBattleMoments(t){
    if(state.phase!=='racing'&&state.phase!=='player_finished')return;const order=standings(),best=bestBattleCandidate(order),seen=new Set();
    for(let i=0;i<order.length-1;i++){const a=order[i],b=order[i+1];if(a.finished||b.finished)continue;const gap=Math.max(0,a.distance-b.distance),live=!!a.ai?.battle||!!b.ai?.battle;if(!live&&gap>.0075)continue;const key=directorPairKey(a,b);seen.add(key);const watch=state.battleWatch[key]||(state.battleWatch[key]={startedAt:t,lastAt:t,lastGap:gap,shownAt:0});const duration=t-watch.startedAt,closing=(watch.lastGap-gap)/Math.max(.001,(t-watch.lastAt)/1000);watch.lastGap=gap;watch.lastAt=t;watch.closing=lerp(Number(watch.closing)||0,closing,.3);if(duration>850&&t-(watch.shownAt||0)>9000&&t-(state.lastBattleCalloutAt||0)>4200&&(a.isPlayer||b.isPlayer||i<2)){watch.shownAt=t;state.lastBattleCalloutAt=t;const sideBySide=gap<.0017,label=sideBySide?'SIDE BY SIDE':watch.closing>.0012?'CLOSING GAP':`BATTLE FOR ${ordinal(i+1)}`,copy=sideBySide?`${a.name} · ${b.name}`:`${b.name} CHALLENGES ${a.name}`;showRaceEvent(label,copy,'overtake',false);raceMemory('battle',{distance:b.distance,position:i+1,racers:[a.name,b.name],text:`${b.name} challenged ${a.name} for ${ordinal(i+1)}`});}}
    for(const key of Object.keys(state.battleWatch)){if(!seen.has(key)&&t-(state.battleWatch[key]?.lastAt||0)>1800)delete state.battleWatch[key];}
    state.activeBattleKey=best&&best.score>=55?best.key:'';
  }
  function updateBroadcastHud(order,t){
    if(t<(state.nextBroadcastHudAt||0))return;state.nextBroadcastHudAt=t+120;const active=(order||[]).filter(r=>!r.finished),leader=active[0]||order?.[0]||state.player,subject=state.camera.subjectIds.map(racerById).find(Boolean)||leader;
    const sector=sectorForDistance(subject?.distance||0),sectorIndex=sectorIndexForDistance(subject?.distance||0),sectorEl=state.game?.querySelector('[data-race-sector]'),sectorLap=state.game?.querySelector('[data-race-sector-lap]');if(sectorEl)sectorEl.textContent=sector?.name||'Circuit';if(sectorLap)sectorLap.textContent=`${sectorIndex+1}/${activeSectors().length} · LAP ${Math.min(activeLaps(),Math.floor(Math.max(0,subject?.distance||0))+1)}`;
    const best=bestBattleCandidate(order),battleChip=state.game?.querySelector('.dragon-race-battle-chip'),battleKicker=state.game?.querySelector('[data-race-battle-kicker]'),battleText=state.game?.querySelector('[data-race-battle-text]');if(battleChip){const show=!!best&&best.score>=55;battleChip.classList.toggle('is-live',show);if(battleKicker)battleKicker.textContent=show?`BATTLE FOR ${ordinal(best.rank)}`:'RACE DIRECTOR';if(battleText)battleText.textContent=show?`${best.ahead.name} · ${best.behind.name}`:'FIELD IN VIEW';}
    const fastest=state.fastestSectors[sectorIndex],fastEl=state.game?.querySelector('[data-race-fastest-sector]'),fastRacer=state.game?.querySelector('[data-race-fastest-racer]');if(fastEl)fastEl.textContent=fastest?`${(fastest.ms/1000).toFixed(2)}s`:'—';if(fastRacer)fastRacer.textContent=fastest?fastest.racerName:'';
  }

  function makeRacerRecord({id,identityId='',name,breed,personality='',style='smooth',isPlayer=false,slot=0,lateral=0,skills=null,traits='',bias=0,takeoffDelay=0}){
    const identity={style};
    return {id,identityId,name,breed,personality,style,isPlayer,slot,distance:-slot*.0056,lateral,speed:0,boost:100,finished:false,finishMs:0,bestLapMs:0,lapStartedAt:0,lapStartedEpochMs:0,lastLapCross:0,nextCp:0,frame:0,frameAt:0,animKey:'idle',animIndex:0,finishAnimAt:0,takeoffDelay,skills,traits,ai:makeAutoProfile(bias,identity)};
  }


  const LUMERRE_STORY_BREEDS={tyrese:'story-tyrese',jalen:'story-jalen',sofia:'lumerre',luka:'calvora',ren:'qasmir',maya:'zafran'};
  const LUMERRE_STORY_STYLES={tyrese:'smooth',jalen:'bold',sofia:'cautious',luka:'overtaker',ren:'smooth',maya:'overtaker'};
  function lumerreEntrantId(entry,index=0){return normKey(entry?.id||entry?.racerId||entry?.key||entry?.name||`racer-${index+1}`);}
  function lumerreCareerAiBias(ai={}){
    const pace=Number(ai?.pace);
    // Career pace matters at Lumerre, but it no longer gets drowned by the generic ±3.2% race-luck roll.
    return Number.isFinite(pace)?clamp((pace-84)*.00145,-.0040,.0070):0;
  }
  function compactLumerreLuck(span=.0075){return (Math.random()-.5)*2*span;}
  function setLumerreBasePace(r,paceBias=0,extraBias=0,luckSpan=.0075){
    if(!r?.ai)return;
    const luck=compactLumerreLuck(luckSpan);
    r.ai.raceLuck=luck;r.ai.extraBias=extraBias;
    r.ai.base=.0265*(Number(activeTrack().paceMultiplier)||1)*(1+luck+paceBias+extraBias);
  }
  function tuneLumerreCareerAi(r,entry={}){
    if(!r?.ai)return;const ai=entry?.ai&&typeof entry.ai==='object'?entry.ai:{};
    const consistency=clamp(Number(ai.consistency)||82,55,98),aggression=clamp(Number(ai.aggression)||75,50,98),overtaking=clamp(Number(ai.overtaking)||80,50,98),defending=clamp(Number(ai.defending)||82,50,98),stamina=clamp(Number(ai.stamina)||84,50,98);
    setLumerreBasePace(r,lumerreCareerAiBias(ai),0,.0075);
    r.ai.careerMistakeMult=clamp(1.30-(consistency-55)/75,.58,1.24);
    r.ai.careerAttackFactor=clamp(.91+(aggression+overtaking-130)/165,.91,1.23);
    r.ai.careerDefendFactor=clamp(.91+(defending+consistency-130)/175,.91,1.20);
    r.ai.careerConsistency=consistency;
    r.ai.careerStamina=stamina;
  }
  function createLumerreStoryRacers(playerInfo,skills,traits){
    const entrants=Array.isArray(state.storyRace?.entrants)?state.storyRace.entrants.slice(0,7):[];
    const sorted=entrants.slice().sort((a,b)=>(Number(a?.gridPosition)||99)-(Number(b?.gridPosition)||99));
    const playerEntry=sorted.find(e=>e?.isPlayer||lumerreEntrantId(e)==='player')||{id:'player',name:playerInfo.name,gridPosition:Number(state.storyRace?.startPosition)||4,isPlayer:true};
    const usedSlots=new Set(),slotFor=entry=>{let slot=clamp(Math.round(Number(entry?.gridPosition)||1),1,7)-1;while(usedSlots.has(slot)&&slot<6)slot++;while(usedSlots.has(slot)&&slot>0)slot--;usedSlots.add(slot);return slot;};
    const strategy=normKey(state.storyRace?.strategy||'focus'),strategyIdentity=storyStrategyIdentity();
    // V34.29.7: the rookie is now competitive rather than secretly protected. Training still matters,
    // but the old +0.16% Lumerre-only free pace plus full training stack has been removed.
    let playerBias=tinyPlayerRaceBias(skills,traits)*.48+.00015;if(strategy==='focus')playerBias+=.00018;else if(strategy==='fire')playerBias+=.00012;else if(strategy==='heart')playerBias+=.00008;
    const playerSlot=slotFor(playerEntry);
    const player=makeRacerRecord({id:'player',name:String(playerEntry?.name||state.storyRace?.playerName||playerInfo.name),breed:playerInfo.breed,isPlayer:true,slot:playerSlot,lateral:(playerSlot%2?-.22:.22),skills,traits,bias:0,style:strategyIdentity.style,takeoffDelay:strategy==='fire'?-90:0});
    setLumerreBasePace(player,0,playerBias,.0060);
    player.ai.careerAttackFactor=clamp(1+(Number(state.storyRace?.careerEvolution?.playerModel?.racecraft?.overtaking)||0)*.010,1,1.09);
    player.ai.careerDefendFactor=clamp(1+(Number(state.storyRace?.careerEvolution?.playerModel?.racecraft?.defending)||0)*.010,1,1.09);
    player.ai.careerConsistency=clamp(82+(Number(state.storyRace?.careerEvolution?.playerModel?.racecraft?.pressureHandling)||0)*2,82,94);
    player.ai.careerStamina=clamp(82+(Number(state.storyRace?.careerEvolution?.playerModel?.racecraft?.staminaManagement)||0)*2,82,94);
    if(strategy==='focus')player.ai.mistake=.28;if(strategy==='heart')player.ai.boostCooldown=560+Math.random()*1200;state.player=player;state.racers.push(player);
    for(const [index,entry] of sorted.entries()){
      const id=lumerreEntrantId(entry,index);if(id==='player'||entry?.isPlayer)continue;
      const slot=slotFor(entry),style=LUMERRE_STORY_STYLES[id]||'smooth',breed=LUMERRE_STORY_BREEDS[id]||'lumerre';
      const personality=String(entry?.ai?.style||entry?.team||'Lumerre Crown racer');
      const racer=makeRacerRecord({id,identityId:`story-${id}`,name:String(entry?.name||id),breed,personality,style,slot,lateral:(slot%2?-.25:.25)+((index%3)-1)*.045,bias:0});
      tuneLumerreCareerAi(racer,entry);state.racers.push(racer);
    }
    // Defensive contract: if an incomplete payload ever arrives, still field all seven named Crown entrants.
    const fallbacks=[['tyrese','Tyrese Bell'],['jalen','Jalen Cross'],['sofia','Sofia Mendes'],['luka','Luka Kovač'],['ren','Ren Sato'],['maya','Maya Banks']];
    for(const [id,name] of fallbacks){if(state.racers.some(r=>r.id===id))continue;const open=[0,1,2,3,4,5,6].find(slot=>!usedSlots.has(slot));if(open===undefined)break;usedSlots.add(open);const racer=makeRacerRecord({id,identityId:`story-${id}`,name,breed:LUMERRE_STORY_BREEDS[id],personality:'Lumerre Crown racer',style:LUMERRE_STORY_STYLES[id],slot:open,lateral:open%2?-.25:.25,bias:0});setLumerreBasePace(racer,0,0,.0075);racer.ai.careerAttackFactor=1.02;racer.ai.careerDefendFactor=1.02;racer.ai.careerConsistency=84;racer.ai.careerStamina=84;state.racers.push(racer);}
  }


  function seasonStoryProfile(){return state.storyRace?.seasonProfile&&typeof state.storyRace.seasonProfile==='object'?state.storyRace.seasonProfile:{};}
  function seasonCareerPlayerRating(){
    const window=state.storyRace?.careerEvolution?.performanceWindow||{};
    const target=Math.max(42,Number(window.paceTarget)||Number(state.storyRace?.careerEvolution?.playerModel?.growthPaceTarget)||58);
    const readiness=state.storyRace?.openingReadiness||{};
    let rating=78.5+(target-42)*.20+(Math.max(0,Number(readiness.pace)||50)-50)*.022+(Math.max(0,Number(readiness.control)||50)-50)*.014;
    if(state.storyRace?.telemetryCorrect)rating+=.55;
    rating+=Math.max(0,Number(state.storyRace?.pitwallScore)||0)*.035;
    const plan=normKey(state.storyRace?.seasonStrategy||'adaptive');
    if(plan==='attack')rating+=.18;
    if(plan==='clean')rating-=.08;
    return clamp(rating,78,90);
  }
  function tuneSeasonProfile(r,entry={}){
    if(!r?.ai)return;
    const profile=seasonStoryProfile();
    const mistakePressure=clamp(Number(profile.mistakePressure)||1,.82,1.24);
    const attackPressure=clamp(Number(profile.attackPressure)||1,.82,1.24);
    const staminaPressure=clamp(Number(profile.staminaPressure)||1,.88,1.24);
    r.ai.careerMistakeMult=clamp((Number(r.ai.careerMistakeMult)||1)*mistakePressure,.48,1.45);
    r.ai.careerAttackFactor=clamp((Number(r.ai.careerAttackFactor)||1)*attackPressure,.84,1.34);
    r.ai.careerStamina=clamp((Number(r.ai.careerStamina)||84)-(staminaPressure-1)*22,50,98);
    if(normKey(entry?.id||entry?.racerId)==='maya'&&Number(state.storyRace?.seasonRound)===1){
      r.ai.careerAttackFactor=clamp(r.ai.careerAttackFactor*1.055,.84,1.36);
      r.ai.careerMistakeMult=clamp(r.ai.careerMistakeMult*1.035,.48,1.48);
    }
  }
  function createSeasonStoryRacers(playerInfo,skills,traits){
    const entrants=Array.isArray(state.storyRace?.entrants)?state.storyRace.entrants.slice(0,7):[];
    const sorted=entrants.slice().sort((a,b)=>(Number(a?.gridPosition)||99)-(Number(b?.gridPosition)||99));
    const playerEntry=sorted.find(e=>e?.isPlayer||lumerreEntrantId(e)==='player')||{id:'player',name:playerInfo.name,gridPosition:Number(state.storyRace?.startPosition)||5,isPlayer:true};
    const usedSlots=new Set(),slotFor=entry=>{let slot=clamp(Math.round(Number(entry?.gridPosition)||1),1,7)-1;while(usedSlots.has(slot)&&slot<6)slot++;while(usedSlots.has(slot)&&slot>0)slot--;usedSlots.add(slot);return slot;};
    const plan=normKey(state.storyRace?.seasonStrategy||'adaptive'),playerSlot=slotFor(playerEntry),rating=seasonCareerPlayerRating();
    const style=plan==='attack'?'overtaker':plan==='clean'?'cautious':'smooth';
    const player=makeRacerRecord({id:'player',name:String(playerEntry?.name||state.storyRace?.playerName||playerInfo.name),breed:playerInfo.breed,isPlayer:true,slot:playerSlot,lateral:(playerSlot%2?-.22:.22),skills,traits,bias:0,style,takeoffDelay:plan==='attack'?-70:plan==='clean'?35:0});
    const racecraft=state.storyRace?.careerEvolution?.playerModel?.racecraft||{};
    const playerPaceBias=clamp((rating-84)*.00145,-.0065,.0090)+tinyPlayerRaceBias(skills,traits)*.34;
    setLumerreBasePace(player,playerPaceBias,0,.0063);
    player.ai.careerAttackFactor=clamp(1+(Number(racecraft.overtaking||50)-50)*.0018,.94,1.10);
    player.ai.careerDefendFactor=clamp(1+(Number(racecraft.defending||50)-50)*.0017,.94,1.10);
    player.ai.careerConsistency=clamp(78+(Number(racecraft.pressureHandling||50)-50)*.22,72,94);
    player.ai.careerStamina=clamp(Number(state.storyRace?.openingReadiness?.stamina)||84,58,98);
    player.ai.careerMistakeMult=clamp(1.10-(Number(racecraft.consistency||50)-50)*.004,.72,1.20);
    if(plan==='attack'){player.ai.careerAttackFactor=clamp(player.ai.careerAttackFactor*1.075,.94,1.18);player.ai.careerMistakeMult*=1.06;}
    else if(plan==='clean'){player.ai.careerAttackFactor*=.95;player.ai.careerDefendFactor=clamp(player.ai.careerDefendFactor*1.04,.94,1.14);player.ai.careerMistakeMult*=.84;}
    tuneSeasonProfile(player,{id:'player'});state.player=player;state.racers.push(player);
    for(const [index,entry] of sorted.entries()){
      const id=lumerreEntrantId(entry,index);if(id==='player'||entry?.isPlayer)continue;
      const slot=slotFor(entry),styleName=LUMERRE_STORY_STYLES[id]||'smooth',breed=LUMERRE_STORY_BREEDS[id]||'lumerre';
      const racer=makeRacerRecord({id,identityId:`story-${id}`,name:String(entry?.name||id),breed,personality:String(entry?.ai?.style||entry?.team||'Championship racer'),style:styleName,slot,lateral:(slot%2?-.25:.25)+((index%3)-1)*.045,bias:0});
      tuneLumerreCareerAi(racer,entry);tuneSeasonProfile(racer,entry);state.racers.push(racer);
    }
    const fallbacks=[['tyrese','Tyrese Bell'],['jalen','Jalen Cross'],['sofia','Sofia Mendes'],['luka','Luka Kovač'],['ren','Ren Sato'],['maya','Maya Banks']];
    for(const [id,name] of fallbacks){
      if(state.racers.some(r=>r.id===id))continue;
      const open=[0,1,2,3,4,5,6].find(slot=>!usedSlots.has(slot));if(open===undefined)break;usedSlots.add(open);
      const racer=makeRacerRecord({id,identityId:`story-${id}`,name,breed:LUMERRE_STORY_BREEDS[id],personality:'Championship racer',style:LUMERRE_STORY_STYLES[id],slot:open,lateral:open%2?-.25:.25,bias:0});
      setLumerreBasePace(racer,0,0,.0075);racer.ai.careerAttackFactor=1.02;racer.ai.careerDefendFactor=1.02;racer.ai.careerConsistency=84;racer.ai.careerStamina=84;tuneSeasonProfile(racer,{id});state.racers.push(racer);
    }
  }

  function createRacers(){
    clearRacers();
    const holder=state.game.querySelector('.dragon-race-racers'),playerInfo=storyPlayerInfo(),skills=trainingModifiers(),traits=traitText();
    if(isStoryRace()){
      if(isSeasonStoryRace()){
        createSeasonStoryRacers(playerInfo,skills,traits);
      }else if(isLumerreStoryRace()){
        createLumerreStoryRacers(playerInfo,skills,traits);
      }else{
      const playerSlot=clamp(Math.round(Number(state.storyRace.startPosition)||3),1,6)-1;
      const aiSlots=[0,1,2,3,4,5].filter(i=>i!==playerSlot),strategy=normKey(state.storyRace.strategy||'focus'),strategyIdentity=storyStrategyIdentity();
      let playerBias=tinyPlayerRaceBias(skills,traits);
      if(strategy==='focus')playerBias+=.00035;
      if(strategy==='fire')playerBias+=.00025;
      if(strategy==='heart')playerBias+=.00020;
      const player=makeRacerRecord({id:'player',name:playerInfo.name,breed:playerInfo.breed,isPlayer:true,slot:playerSlot,lateral:(playerSlot%2?-.22:.22),skills,traits,bias:playerBias,style:strategyIdentity.style,takeoffDelay:strategy==='fire'?-90:0});
      if(strategy==='focus')player.ai.mistake=.28;
      if(strategy==='heart')player.ai.boostCooldown=560+Math.random()*1200;
      if(normKey(state.storyRace?.morningPrep)==='warmup')player.takeoffDelay-=95;
      if(normKey(state.storyRace?.dragonState)==='sharp')player.takeoffDelay-=55;
      if(normKey(state.storyRace?.setupPlan)==='stable')player.ai.mistake=Math.min(player.ai.mistake,.26);
      if(normKey(state.storyRace?.setupPlan)==='forgiving')player.ai.mistake=Math.min(player.ai.mistake,.30);
      state.player=player;state.racers.push(player);
      const storyGrid=[
        {id:'tyrese',name:'Tyrese Bell',breed:'story-tyrese',personality:'Quickquill captain · precise and composed',style:'smooth'},
        {id:'jalen',name:'Jalen Cross',breed:'story-jalen',personality:'Aggressive young rival · fearless starter',style:'bold'},
        {id:'kestrel',name:'Kestrel',breed:'story-kestrel',personality:'Patient drafter · waits for openings',style:'late'},
        {id:'sofia',name:'Sofia Mendes',breed:'lumerre',personality:'Clean, technical racer',style:'cautious'},
        {id:'luka',name:'Luka Kovač',breed:'calvora',personality:'Fast line-hunter from Ember & Oak',style:'overtaker'}
      ];
      const suppliedGrid=Array.isArray(state.storyRace?.qualifyingGrid)?state.storyRace.qualifyingGrid:[];
      const suppliedSlotFor=name=>{const target=normKey(name),row=suppliedGrid.find(entry=>normKey(entry?.name)===target);const slot=Number(row?.position)-1;return Number.isInteger(slot)&&slot>=0&&slot<6&&slot!==playerSlot?slot:null;};
      const usedSlots=new Set([playerSlot]);
      storyGrid.forEach((identity,i)=>{
        let slot=suppliedSlotFor(identity.name);
        if(slot===null||usedSlots.has(slot))slot=aiSlots.find(candidate=>!usedSlots.has(candidate));
        if(slot===undefined)slot=aiSlots[i]??i;
        usedSlots.add(slot);
        state.racers.push(makeRacerRecord({id:`story-${identity.id}`,identityId:`story-${identity.id}`,name:identity.name,breed:identity.breed,personality:identity.personality,style:identity.style,slot,lateral:(slot%2?-.25:.25)+((i%3)-1)*.045,bias:0}));
      });
      }
    }else{
      const playerStart=1+Math.floor(Math.random()*4); // 2nd–5th grid placement
      const playerSlot=playerStart,aiSlots=[0,1,2,3,4,5].filter(i=>i!==playerSlot),playerBias=tinyPlayerRaceBias(skills,traits);
      const player=makeRacerRecord({id:'player',name:playerInfo.name,breed:playerInfo.breed,isPlayer:true,slot:playerSlot,lateral:(playerSlot%2?-.27:.27),skills,traits,bias:playerBias,style:'smooth'});
      state.player=player;state.racers.push(player);
      selectedAiPool().forEach((identity,i)=>{
        const slot=aiSlots[i];
        state.racers.push(makeRacerRecord({id:`ai-${identity.id}`,identityId:identity.id,name:identity.name,breed:identity.breed,personality:identity.personality,style:identity.style,slot,lateral:(slot%2?-.25:.25)+((i%3)-1)*.05,bias:0}));
      });
    }
    state.racers.forEach((r,index)=>{
      const el=document.createElement('div');el.className=`dragon-race-racer${r.isPlayer?' is-player':''}`;el.dataset.racerId=r.id;
      r.accent=racerAccent(r,index);el.style.setProperty('--racer-accent',r.accent);
      el.innerHTML=`<span class="dragon-race-flight-shadow" aria-hidden="true"></span><span class="dragon-race-speed-trail" aria-hidden="true"><i></i><i></i><i></i></span><div class="dragon-race-racer-sprite-wrap"><img src="${animationFrames(r.breed,'idle')[0]?.src||spriteSrc(r.breed,0)}" alt=""></div><span class="dragon-race-racer-tag"><i class="dragon-race-racer-marker"></i><b data-racer-position>${index+1}</b><span>${r.name}</span>${r.isPlayer?'<em>YOU</em>':''}</span>`;
      holder.appendChild(el);r.el=el;r.img=el.querySelector('img');r.spriteWrap=el.querySelector('.dragon-race-racer-sprite-wrap');r.shadow=el.querySelector('.dragon-race-flight-shadow');r.tag=el.querySelector('.dragon-race-racer-tag');r.trail=el.querySelector('.dragon-race-speed-trail');
      r.raceSpriteProfile=raceBreedProfile(r.breed);el.dataset.raceBreed=r.breed;el.dataset.raceFacing=r.raceSpriteProfile.facing;installRaceSpriteSafety(r);
      const altitudeSeed=((index*37)%9)-4;
      r.visual={bank:0,lean:0,lastLateral:r.lateral,lastSpeed:0,lastAt:0,bobPhase:Math.random()*Math.PI*2,altitudeBias:altitudeSeed*.42,nextShadowAt:0};
    });
    initLeaderboard();renderStartingGrid();
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


  function careerBridgeTarget(){return state.storyRace?.__careerBridgeSource||null;}
  function careerBridgeToken(){return String(state.storyRace?.__careerBridgeToken||'');}
  function postCareerBridge(type,payload={}){const target=careerBridgeTarget(),bridge=careerBridgeToken();if(!target)return false;try{target.postMessage({type,bridge,...payload},'*');return true;}catch(_e){return false;}}
  function hideLumerreTeamOrder(){const el=state.game?.querySelector('.dragon-race-team-order');if(!el)return;el.classList.remove('is-visible');el.setAttribute('aria-hidden','true');}
  function chooseLumerreTeamOrder(choice='wait'){
    if(!isLumerreStoryRace()||state.storyRace?.teamOrderResponse)return false;
    const response=['obey','wait','ignore'].includes(normKey(choice))?normKey(choice):'wait';
    state.storyRace.teamOrderResponse=response;state.storyRace.teamOrderEffectUntil=now()+12500;hideLumerreTeamOrder();
    const label=response==='obey'?'ORDER ACKNOWLEDGED':response==='ignore'?'ORDER OVERRIDDEN':'ORDER HELD';
    raceMemory('team-order',{distance:state.player?.distance||0,response,text:`Quickquill team order: ${response.toUpperCase()}`});showRaceEvent('QUICKQUILL',label,response==='ignore'?'overtake':'leader',true);
    postCareerBridge('dragonbound-career-evolution-team-order',{order:{raceNumber:Number(state.storyRace?.raceNumber)||3,trackId:LUMERRE_TRACK_ID,raceKey:'lumerre',response,choice:response,lap:Math.min(activeLaps(),Math.floor(Math.max(0,state.player?.distance||0))+1),teammateId:'tyrese',at:new Date().toISOString()}});
    return true;
  }
  function maybeOfferLumerreTeamOrder(t){
    if(!isLumerreStoryRace()||state.phase!=='racing'||state.storyRace?.teamOrderResponse||state.storyRace?.teamOrderShown)return;
    const config=state.storyRace?.teamOrder||{};if(config.enabled===false)return;const preferred=Math.max(2,Math.min(activeLaps()-1,Number(config.preferredLap)||4));
    if((state.player?.distance||0)<preferred-1+.08)return;
    state.storyRace.teamOrderShown=true;const el=state.game?.querySelector('.dragon-race-team-order');if(!el)return;
    const tyrese=state.racers.find(r=>r.id==='tyrese'),order=standings(),playerRank=order.findIndex(r=>r.isPlayer)+1,tyreseRank=order.findIndex(r=>r.id==='tyrese')+1;
    const title=el.querySelector('[data-team-order-title]'),copy=el.querySelector('[data-team-order-copy]');
    if(title)title.textContent=playerRank&&tyreseRank&&playerRank<tyreseRank?'PROTECT TYRESE':'HOLD POSITION';
    if(copy)copy.textContent=playerRank&&tyreseRank&&playerRank<tyreseRank?'Manage the gap and avoid compromising the Quickquill pair.':'Do not attack Tyrese through this phase.';
    el.querySelectorAll('[data-team-order]').forEach(btn=>{btn.onclick=()=>chooseLumerreTeamOrder(btn.dataset.teamOrder);});
    el.classList.add('is-visible');el.setAttribute('aria-hidden','false');raceMemory('team-order-issued',{distance:state.player?.distance||0,playerRank,tyreseRank,text:'Quickquill issued a live team order'});
  }


  function seasonRaceCallDefinition(index=0){
    if(index===0)return {
      id:'street-exit',title:'STREET COMPRESSION',copy:'The field is stacking into the wall-lined middle sector. Pick the shape of the next two corners.',
      choices:{
        obey:{label:'BUILD EXIT',effect:{mistakeMult:.84,attackFactor:.96,paceFactor:1.0006,finalFactor:1}},
        wait:{label:'HOLD CENTRE',effect:{mistakeMult:.93,attackFactor:1,paceFactor:1.0002,finalFactor:1}},
        ignore:{label:'FORCE INSIDE',effect:{mistakeMult:1.10,attackFactor:1.12,paceFactor:1.0010,finalFactor:1}}
      },
      trigger:.58
    };
    return {
      id:'decisive-window',title:'DECISIVE WINDOW',copy:'Final lap. The gaps are real now. Decide what the points are worth.',
      choices:{
        obey:{label:'COMMIT',effect:{mistakeMult:1.08,attackFactor:1.14,paceFactor:1.0014,finalFactor:1.0015}},
        wait:{label:'PRESSURE',effect:{mistakeMult:.98,attackFactor:1.06,paceFactor:1.0007,finalFactor:1.0008}},
        ignore:{label:'BANK POINTS',effect:{mistakeMult:.82,attackFactor:.78,paceFactor:.9998,finalFactor:.9996}}
      },
      trigger:Math.max(1.35,activeLaps()-.78)
    };
  }
  function seasonAutoCallChoice(index=0){
    const plan=normKey(state.storyRace?.seasonStrategy||'adaptive');
    if(index===0)return plan==='attack'?'ignore':plan==='clean'?'obey':'wait';
    return plan==='attack'?'obey':plan==='clean'?'ignore':'wait';
  }
  function chooseSeasonRaceCall(choice='wait',auto=false){
    if(!isSeasonStoryRace())return false;
    const index=Math.max(0,Number(state.storyRace?.seasonCallIndex)||0),definition=seasonRaceCallDefinition(index);
    if(!definition)return false;
    const key=['obey','wait','ignore'].includes(normKey(choice))?normKey(choice):'wait',selected=definition.choices[key]||definition.choices.wait;
    state.storyRace.seasonCallResponses=Array.isArray(state.storyRace.seasonCallResponses)?state.storyRace.seasonCallResponses:[];
    state.storyRace.seasonCallResponses.push({call:definition.id,title:definition.title,choice:key,label:selected.label,auto:!!auto,lap:Math.min(activeLaps(),Math.floor(Math.max(0,state.player?.distance||0))+1)});
    state.storyRace.seasonCallEffect={...selected.effect};
    state.storyRace.seasonCallEffectUntil=raceClockNow()+11500;
    state.storyRace.seasonCallIndex=index+1;
    hideLumerreTeamOrder();
    raceMemory('season-race-call',{distance:state.player?.distance||0,call:definition.id,choice:key,text:`${definition.title}: ${selected.label}`});
    showRaceEvent(auto?'QUICKQUILL AUTO CALL':'QUICKQUILL',selected.label,key==='ignore'?'overtake':'leader',true);
    return true;
  }
  function maybeOfferSeasonRaceCall(t){
    if(!isSeasonStoryRace()||state.phase!=='racing')return;
    const index=Math.max(0,Number(state.storyRace?.seasonCallIndex)||0);
    if(index>=2)return;
    const definition=seasonRaceCallDefinition(index);
    if((state.player?.distance||0)<definition.trigger)return;
    const mode=normKey(state.storyRace?.presentationMode||'watch');
    if(mode==='full'||(mode==='quick'&&index===0)){chooseSeasonRaceCall(seasonAutoCallChoice(index),true);return;}
    if(state.storyRace?.seasonCallVisible===index)return;
    state.storyRace.seasonCallVisible=index;
    const el=state.game?.querySelector('.dragon-race-team-order');if(!el)return;
    const kicker=el.querySelector('small'),title=el.querySelector('[data-team-order-title]'),copy=el.querySelector('[data-team-order-copy]');
    if(kicker)kicker.textContent=mode==='quick'?'DECISIVE QUICK-SIM WINDOW':'QUICKQUILL LIVE CALL';
    if(title)title.textContent=definition.title;
    if(copy)copy.textContent=definition.copy;
    const buttons=[...el.querySelectorAll('[data-team-order]')],keys=['obey','wait','ignore'];
    buttons.forEach((btn,i)=>{const key=keys[i]||'wait';btn.textContent=definition.choices[key].label;btn.onclick=()=>chooseSeasonRaceCall(key,false);});
    el.classList.add('is-visible');el.setAttribute('aria-hidden','false');
    raceMemory('season-race-call-issued',{distance:state.player?.distance||0,call:definition.id,text:`Quickquill asks for ${definition.title}`});
  }

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
    pushBroadcastEvent(kicker,text,kind);
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
    const playerBefore=prevPos.has('player')?prevPos.get('player')+1:null,playerAfter=currentPos.has('player')?currentPos.get('player')+1:null;
    if(playerBefore&&playerAfter&&playerAfter<playerBefore){const gained=playerBefore-playerAfter;state.raceStory.playerOvertakes=(Number(state.raceStory.playerOvertakes)||0)+gained;raceMemory('player-overtake',{distance:state.player?.distance||0,from:playerBefore,to:playerAfter,text:`${state.player?.name||'Player'} moved from ${ordinal(playerBefore)} to ${ordinal(playerAfter)}`});state.raceStory.notableMoment=`Moved into ${ordinal(playerAfter)} in ${sectorForDistance(state.player?.distance||0)?.name||'the circuit'}`;}
    else if(playerBefore&&playerAfter&&playerAfter>playerBefore){const lost=playerAfter-playerBefore;state.raceStory.playerLostPositions=(Number(state.raceStory.playerLostPositions)||0)+lost;raceMemory('player-lost-position',{distance:state.player?.distance||0,from:playerBefore,to:playerAfter,text:`Dropped from ${ordinal(playerBefore)} to ${ordinal(playerAfter)}`});}

    if(oldLeader&&newLeader&&oldLeader!==newLeader){
      state.raceStory.leadChanges++;
      const leader=racerById(newLeader);raceMemory('lead-change',{distance:leader?.distance||0,leader:leader?.name||'',text:`${leader?.name||'A racer'} took the lead`});if(leader?.isPlayer)state.raceStory.notableMoment=`Took the race lead in ${sectorForDistance(leader.distance)?.name||'the circuit'}`;
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
    state.game?.classList.add('is-final-lap');if(isLumerreTrack())crossfadeToFinalLapMusic(1050);raceMemory('final-lap',{distance:leader?.distance||0,leader:leader?.name||'',text:`Final lap led by ${leader?.name||'the leader'}`});
    showRaceEvent('FINAL LAP',`${leader?.name||'THE LEADER'} LEADS THE FIELD`,'final',true);
    if(state.crowdAudio)fadeAudio(state.crowdAudio,crowdTarget(.015),780);
  }
  function triggerPhotoFinish(a,b,t){
    if(state.camera.photoFinishDone)return;
    state.camera.photoFinishDone=true;raceMemory('photo-finish',{distance:a?.distance||0,racers:[a?.name,b?.name].filter(Boolean),text:`Photo finish: ${a?.name||''} and ${b?.name||''}`});
    state.photoFinishHoldUntil=Math.max(state.photoFinishHoldUntil,now()+1950);
    state.game?.classList.add('is-photo-finish');
    setCameraMode('photoFinish',1900,true,[a.id,b.id]);
    showRaceEvent('PHOTO FINISH',`${a.name} · ${b.name}`,'photo',true);
    if(state.crowdAudio)fadeAudio(state.crowdAudio,crowdTarget(.025),260);
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
    clearSequenceTimers();state.countdownToken++;const token=state.countdownToken;setPhase('ceremony');state.raceStartedAt=0;state.raceStartedEpochMs=0;
    const title=state.game.querySelector('.dragon-race-broadcast-title'),grid=state.game.querySelector('.dragon-race-starting-grid'),lights=state.game.querySelector('.dragon-race-start-lights'),count=state.game.querySelector('.dragon-race-countdown');
    grid?.classList.remove('is-visible');title?.classList.add('is-visible');lights?.classList.remove('is-visible','is-go');if(count){count.classList.remove('is-pop');count.querySelector('b').textContent='';}
    setCameraMode('ceremonyWide',0,false);
    const seasonMode=seasonPresentationMode(),ceremonyScale=seasonMode==='full'?.16:seasonMode==='quick'?.32:1;
    queueSequence(()=>{title?.classList.remove('is-visible');grid?.classList.add('is-visible');setCameraMode('grid',0,false);},Math.round(1450*ceremonyScale),token);
    queueSequence(()=>{grid?.classList.remove('is-visible');},Math.round(4050*ceremonyScale),token);
    queueSequence(()=>beginCountdown(token),Math.round(4450*ceremonyScale),token);
  }
  function setStartingLights(count){const lights=state.game?.querySelector('.dragon-race-start-lights');if(!lights)return;lights.classList.add('is-visible');lights.classList.toggle('is-go',count>=4);[...lights.querySelectorAll('i')].forEach((el,i)=>el.classList.toggle('is-on',i<count&&count<4));}
  function beginCountdown(token=state.countdownToken){
    if(token!==state.countdownToken)return;setPhase('countdown');
    const el=state.game.querySelector('.dragon-race-countdown'),b=el.querySelector('b');setStartingLights(0);ensureRaceAudio();fadeAudio(state.raceMusic,raceMusicTarget(.70),420);playCountdownAudio();
    const seasonMode=seasonPresentationMode(),countdownScale=seasonMode==='full'?.18:seasonMode==='quick'?.35:1;
    COUNTDOWN_CUES.forEach((cue,index)=>queueSequence(()=>{
      if(state.phase!=='countdown')return;b.textContent=cue.label;el.classList.remove('is-pop');void el.offsetWidth;el.classList.add('is-pop');setStartingLights(cue.lights);
      if(index===COUNTDOWN_CUES.length-1){
        setPhase('racing');state.raceStartedAt=now();state.simClock=state.raceStartedAt;state.raceStartedEpochMs=Date.now();state.racers.forEach(r=>{r.lapStartedAt=state.raceStartedAt;r.lapStartedEpochMs=state.raceStartedEpochMs;r.takeoffDelay=Math.random()*400;r.sectorIndex=0;r.sectorLap=0;r.sectorStartedAt=0;});
        state.camera.nextDecisionAt=state.raceStartedAt+2600;state.camera.nextEventAt=state.raceStartedAt+5200;state.director.holdUntil=state.raceStartedAt+3600;state.director.lastCutAt=state.raceStartedAt;setCameraMode('follow',0,false);
        fadeAudio(state.raceMusic,raceMusicTarget(1),1000);
        if(state.crowdAudio){state.crowdAudio.volume=crowdTarget(.03);queueSequence(()=>{if(state.crowdAudio)state.crowdAudio.volume=activeCrowdVolume();},900,token);}
        queueSequence(()=>{b.textContent='';el.classList.remove('is-pop');state.game?.querySelector('.dragon-race-start-lights')?.classList.remove('is-visible','is-go');},850,token);
      }
    },Math.round(cue.at*countdownScale),token));
  }

  function storyPlayerRaceModifiers(r){
    const base={mistakeMult:1,paceFactor:1,attackFactor:1,curveAdjust:0,finalFactor:1};
    if(!r?.isPlayer||!isStoryRace())return base;
    if(isSeasonStoryRace()){
      const readiness=state.storyRace?.openingReadiness||{},plan=normKey(state.storyRace?.seasonStrategy||'adaptive');
      base.mistakeMult*=clamp(1-(Math.max(0,Number(readiness.control)||50)-50)*.0045,.78,1);
      base.finalFactor*=clamp(1+(Math.max(0,Number(readiness.stamina)||50)-50)*.00005,1,1.0024);
      if(state.storyRace?.telemetryCorrect){base.mistakeMult*=.90;base.curveAdjust-=.0020;}
      if(Number(state.storyRace?.pitwallScore)>=8)base.attackFactor*=1.025;
      if(plan==='clean'){base.mistakeMult*=.86;base.attackFactor*=.94;base.curveAdjust-=.0020;}
      else if(plan==='attack'){base.mistakeMult*=1.07;base.attackFactor*=1.08;base.paceFactor*=1.0005;}
      else{base.mistakeMult*=.96;base.attackFactor*=1.015;}
      const effect=state.storyRace?.seasonCallEffect||{},live=raceClockNow()<(Number(state.storyRace?.seasonCallEffectUntil)||0);
      if(live){base.mistakeMult*=Number(effect.mistakeMult)||1;base.attackFactor*=Number(effect.attackFactor)||1;base.paceFactor*=Number(effect.paceFactor)||1;base.finalFactor*=Number(effect.finalFactor)||1;}
      return base;
    }
    if(isLumerreStoryRace()){
      const response=normKey(state.storyRace?.teamOrderResponse||'');const live=now()<(Number(state.storyRace?.teamOrderEffectUntil)||0);
      if(response==='obey'){base.mistakeMult*=.88;base.attackFactor*=live?.68:.93;base.paceFactor*=live?.9980:.9996;}
      else if(response==='wait'){base.mistakeMult*=.95;base.attackFactor*=live?.88:.98;base.paceFactor*=live?.9992:1;}
      else if(response==='ignore'){base.mistakeMult*=live?1.08:1.02;base.attackFactor*=live?1.10:1.03;base.paceFactor*=live?1.0016:1.0003;}
      const evo=state.storyRace?.careerEvolution?.playerModel||{};const pressure=Number(evo?.racecraft?.pressureHandling)||0,overtaking=Number(evo?.racecraft?.overtaking)||0,stamina=Number(evo?.racecraft?.staminaManagement)||0;
      base.mistakeMult*=clamp(1-(pressure*.018),.82,1);base.attackFactor*=clamp(1+(overtaking*.012),1,1.10);base.finalFactor*=clamp(1+(stamina*.00035),1,1.003);
      return base;
    }
    if(activeTrack().id!=='blackglass_night_circuit')return base;
    const section=sectorForDistance(r.distance),studied=Array.isArray(state.storyRace?.studiedSections)&&state.storyRace.studiedSections.includes(section?.id);
    if(studied){base.mistakeMult*=.68;base.paceFactor*=1.0014;}
    const setup=normKey(state.storyRace?.setupPlan||'');
    if(setup==='stable'){base.mistakeMult*=.78;base.curveAdjust-=.006;base.attackFactor*=.96;}
    else if(setup==='attack'){base.attackFactor*=1.10;base.mistakeMult*=1.06;}
    else if(setup==='forgiving'){base.mistakeMult*=.84;base.finalFactor*=1.0015;}
    const dragonState=normKey(state.storyRace?.dragonState||'steady');
    if(dragonState==='settled'){base.mistakeMult*=.80;base.paceFactor*=1.0005;}
    else if(dragonState==='rested'){base.mistakeMult*=.90;base.paceFactor*=1.0007;}
    else if(dragonState==='sharp'){base.attackFactor*=1.05;base.paceFactor*=1.0008;}
    const prep=normKey(state.storyRace?.morningPrep||'');
    if(prep==='technical'){base.curveAdjust-=.0045;base.mistakeMult*=.90;}
    else if(prep==='balcony'){base.mistakeMult*=.86;}
    else if(prep==='breakfast'){base.paceFactor*=1.0008;}
    else if(prep==='warmup'){base.attackFactor*=1.04;}
    if(state.storyRace?.telemetryReady){base.curveAdjust-=.0025;base.mistakeMult*=.94;}
    if(state.storyRace?.tyreseCallout){base.mistakeMult*=.94;}
    const localTip=normKey(state.storyRace?.localTip||'');
    if(localTip&&section?.id===localTip){base.mistakeMult*=.82;base.paceFactor*=1.0007;}
    const finalWord=normKey(state.storyRace?.finalWord||'');
    if(finalWord==='anchors'&&studied){base.paceFactor*=1.0008;base.mistakeMult*=.90;}
    else if(finalWord==='gap'){base.attackFactor*=1.06;}
    else if(finalWord==='together'||finalWord==='quiet'){base.mistakeMult*=.88;}
    return base;
  }

  function autoRacerUpdate(r,dt,t){
    const p=pointAt(r.distance),ai=r.ai||makeAutoProfile(0),feel=raceStyleFeel(ai.style),storyMods=storyPlayerRaceModifiers(r);
    r.ai=ai;
    const raceAge=Math.max(0,t-state.raceStartedAt-(r.takeoffDelay||0));
    const finalLap=Math.max(0,r.distance)>=activeLaps()-1;
    const nearFinish=Math.max(0,r.distance)>=activeLaps()-.18;

    // Look a little way ahead so dragons begin settling for a bend *before* they hit it.
    // This removes the old accelerate/brake twitch at the exact curvature sample.
    const aheadCurve=pointAt(r.distance+.010),farCurve=pointAt(r.distance+.020);
    const curve=Math.max(p.curvature,aheadCurve.curvature*.88,farCurve.curvature*.68);
    const before=pointAt(r.distance-.009),after=pointAt(r.distance+.012);
    const turn=normalizeAngle(after.ang-before.ang);
    const insideLane=turn>.035?-.17:turn<-.035?.17:0;

    // Base racing line changes are deliberately infrequent. A dragon now commits to a line
    // for several seconds instead of twitching to a new random lateral target every second.
    if(t>(ai.laneAt||0)&&!ai.battle){
      const hold=feel.laneHold[0]+Math.random()*(feel.laneHold[1]-feel.laneHold[0]);
      ai.laneAt=t+hold;
      const wander=(Math.random()-.5)*feel.laneRange;
      const cornerWeight=clamp(curve*.42,0,.34);
      ai.targetLane=clamp(lerp(wander,insideLane,cornerWeight),-feel.laneRange,feel.laneRange);
    }

    // Find the nearest dragon ahead. Position changes are now built as actual passes:
    // close -> pull out -> run alongside -> clear the rival. Same-lane followers do not
    // simply phase through one another because of a tiny random speed delta.
    let ahead=null,bestGap=Infinity;
    for(const other of state.racers){
      if(other===r||other.finished)continue;
      const gap=other.distance-r.distance;
      if(gap>0&&gap<bestGap){bestGap=gap;ahead=other;}
    }
    if(ai.battle){
      const rival=racerById(ai.battle.opponentId);
      const gap=rival?rival.distance-r.distance:Infinity;
      const cleared=rival&&r.distance-rival.distance>.0022;
      const dropped=rival&&rival.distance-r.distance>.016;
      if(rival&&!rival.finished&&!ai.battle.resolved&&t>=ai.battle.resolveAt){
        const laneClearance=Math.abs(r.lateral-rival.lateral);
        const baseEdge=clamp(((r.ai?.base||.0265)-(rival.ai?.base||.0265))/.0018,-.22,.22);
        const attackEdge=(Number(ai.careerAttackFactor)||1)-1;
        const defendEdge=(Number(rival.ai?.careerDefendFactor)||1)-1;
        const styleEdge=ai.style==='overtaker'?.055:ai.style==='bold'?.035:ai.style==='cautious'?-.025:0;
        const laneEdge=laneClearance>.18?.055:-.035;
        const storyEdge=r.isPlayer?clamp((storyMods.attackFactor-1)*.55,-.10,.10):0;
        const passChance=clamp(.48+baseEdge+attackEdge*.72-defendEdge*.62+styleEdge+laneEdge+storyEdge,.22,.79);
        ai.battle.resolved=true;
        ai.battle.outcome=Math.random()<passChance?'pass':'defended';
        ai.battle.resolveUntil=t+(ai.battle.outcome==='pass'?2500:1500);
        if(ai.battle.outcome==='pass')ai.battleWins=(Number(ai.battleWins)||0)+1;else ai.battleLosses=(Number(ai.battleLosses)||0)+1;
      }
      const expired=t>ai.battle.until||!rival||rival.finished||(ai.battle.resolved&&t>ai.battle.resolveUntil);
      if(expired||cleared||dropped){
        const opponentId=ai.battle.opponentId;
        const longCooldown=12000+Math.random()*7000;
        ai.pairCooldown=ai.pairCooldown||{};ai.pairCooldown[opponentId]=t+longCooldown;
        if(rival?.ai){rival.ai.pairCooldown=rival.ai.pairCooldown||{};rival.ai.pairCooldown[r.id]=t+longCooldown*.82;}
        ai.battle=null;ai.battleCooldownUntil=t+3600+Math.random()*2600;ai.laneAt=t+1900;
      }
    }
    const pairLocked=ahead&&t<Number(ai.pairCooldown?.[ahead.id]||0);
    if(!ai.battle&&ahead&&bestGap<feel.attackGap&&t>(ai.battleCooldownUntil||0)&&!pairLocked&&raceAge>2400){
      const roomLeft=ahead.lateral>-.42,roomRight=ahead.lateral<.42;
      let side;
      if(roomLeft&&roomRight)side=(r.lateral<=ahead.lateral)?1:-1;
      else side=roomRight?1:-1;
      if(Math.random()<.24)side*=-1;
      const commitAt=t+700+Math.random()*450;
      ai.battle={opponentId:ahead.id,side,startedAt:t,commitAt,resolveAt:commitAt+1200+Math.random()*850,until:commitAt+5200+Math.random()*1300,resolved:false,outcome:'',resolveUntil:0};
    }

    let battleAttack=0,directlyBlocked=false;
    if(ai.battle){
      const rival=racerById(ai.battle.opponentId);
      if(rival&&!rival.finished){
        const gap=rival.distance-r.distance;
        const side=ai.battle.side||1;
        const desired=clamp(rival.lateral+side*(ai.style==='overtaker'?.36:.32),-.72,.72);
        ai.targetLane=desired;
        const laneClearance=Math.abs(r.lateral-rival.lateral);
        const committed=clamp((t-ai.battle.startedAt)/Math.max(1,ai.battle.commitAt-ai.battle.startedAt),0,1);
        if(laneClearance>.17&&t>=ai.battle.commitAt)battleAttack=feel.attackRange*(.38+.42*committed)*storyMods.attackFactor*(Number(ai.careerAttackFactor)||1);
        if(ai.battle.resolved&&ai.battle.outcome==='pass'&&t<ai.battle.resolveUntil){
          // A winning move gets a visible two-to-three second clearing burst, so "side by side"
          // actually resolves into a pass instead of looping fifty times without rank changing.
          battleAttack+=.078;
        }else if(ai.battle.resolved&&ai.battle.outcome==='defended'&&t<ai.battle.resolveUntil){
          // A successful defence opens the gap and makes the attacker reset before trying again.
          battleAttack-=.050;ai.targetLane=approachValue(ai.targetLane,0,.08);
        }
        if(gap>0&&gap<.0048&&laneClearance<.15&&!ai.battle.resolved)directlyBlocked=true;
      }
    }

    // Smooth lateral momentum. There is no per-frame randomness in the steering response.
    const laneStep=feel.laneRate*dt*(curve>.62?.82:1);
    r.lateral=approachValue(r.lateral,ai.targetLane,laneStep);

    // Pace variation is slow-moving rather than abrupt. The target changes every few seconds
    // and the actual bias eases toward it, so the pack breathes without looking jittery.
    if(t>(ai.paceAt||0)){
      ai.paceAt=t+3300+Math.random()*3300;
      ai.paceTarget=(Math.random()-.5)*2*feel.paceWobble;
      if(ai.style==='smooth')ai.paceTarget*=.72;
    }
    ai.paceBias=lerp(ai.paceBias||0,ai.paceTarget||0,clamp(dt*.62,0,1));

    // V34.29.7 Lumerre race phases: every Crown racer gets changing good/bad spells.
    // This is deliberately small (tenths of a percent), but enough to stop one early leader
    // from being permanently locked in place for all ten laps.
    let lumerrePhaseFactor=1;
    if(isLumerreStoryRace()){
      if(t>(ai.lumerrePhaseAt||0)){
        ai.lumerrePhaseAt=t+5200+Math.random()*6200;
        const range=r.isPlayer?.0028:(ai.style==='overtaker'||ai.style==='bold'?.0052:.0043);
        ai.lumerrePhaseTarget=(Math.random()-.5)*2*range;
        if(r.id==='tyrese')ai.lumerrePhaseTarget+=.0006;
        else if(r.id==='jalen'&&r.distance<3.2)ai.lumerrePhaseTarget+=.00045;
        else if(r.id==='ren'&&r.distance>3&&r.distance<8)ai.lumerrePhaseTarget+=.00035;
        else if(r.id==='maya'&&r.distance>6)ai.lumerrePhaseTarget+=.00035;
      }
      ai.lumerrePhaseBias=lerp(Number(ai.lumerrePhaseBias)||0,Number(ai.lumerrePhaseTarget)||0,clamp(dt*.34,0,1));
      lumerrePhaseFactor=1+(Number(ai.lumerrePhaseBias)||0);
    }

    // Rare mistakes are softened over more than a second instead of instant speed chops.
    if(!(ai.nextMistakeAt>0))ai.nextMistakeAt=t+5200+Math.random()*6200;
    if(t>ai.nextMistakeAt){
      ai.nextMistakeAt=t+6500+Math.random()*8500;
      if(Math.random()<feel.mistakeChance*storyMods.mistakeMult*(Number(ai.careerMistakeMult)||1)){
        ai.mistakeUntil=t+900+Math.random()*1050;
        ai.mistakeStrength=.004+Math.random()*.005;
        ai.targetLane=clamp(ai.targetLane+(Math.random()-.5)*.13,-feel.laneRange,feel.laneRange);
      }
    }
    const mistakeFactor=t<(ai.mistakeUntil||0)?1-(ai.mistakeStrength||0):1;

    // Boost logic is tied more closely to circumstances. Overtakers are more willing to use
    // a burst while alongside; late chargers preserve more for the final lap.
    const canRandomBoost=!(ai.style==='late'&&!finalLap);
    const battleBoost=!!ai.battle&&t>=ai.battle.commitAt;
    if(t>ai.boostUntil&&ai.boost>18&&(battleBoost&&Math.random()<dt*.30||(canRandomBoost&&Math.random()<dt*feel.boostChance))){
      ai.boostUntil=t+620+Math.random()*720;
    }
    let boostFactor=1;
    if(t<ai.boostUntil&&ai.boost>0){
      ai.boost=Math.max(0,ai.boost-19*dt);
      boostFactor=1.012;
    }else ai.boost=Math.min(100,ai.boost+(ai.style==='late'&&!finalLap?7.0:5.8)*dt);
    r.boost=ai.boost;

    const curvePenalty=Math.max(.045,feel.curvePenalty+(ai.mistake-.5)*.005+storyMods.curveAdjust);
    const curveFactor=1-curve*curvePenalty;
    const finalFactor=(finalLap?1+feel.finalPush*(nearFinish?1.28:1):1)*storyMods.finalFactor;
    const draftStrength=isLumerreStoryRace()?.0044:isSeasonStoryRace()?.0034:.0018;
    const draftFactor=ahead&&bestGap<.0115&&bestGap>.0030&&Math.abs(ahead.lateral-r.lateral)<.23?1+draftStrength:1;
    const launchFactor=raceAge<600?.72+raceAge/600*.18:raceAge<2100?.90+(raceAge-600)/1500*.10:1;
    const staminaScore=clamp(Number(ai.careerStamina)||84,50,98),raceProgress=clamp(Math.max(0,r.distance)/Math.max(1,activeLaps()),0,1);
    const staminaFactor=(isLumerreStoryRace()||isSeasonStoryRace())?1-clamp((86-staminaScore)*.00010*clamp((raceProgress-.48)/.52,0,1),-.0010,.0030):1;
    let target=ai.base*(1+(ai.paceBias||0)+battleAttack)*curveFactor*boostFactor*finalFactor*draftFactor*mistakeFactor*launchFactor*storyMods.paceFactor*lumerrePhaseFactor*staminaFactor;

    // A dragon tucked directly behind another has to pull out before passing. This small cap
    // is the main anti-'position flicker' rule: rank swaps happen after visible lane movement.
    if(directlyBlocked&&ahead)target=Math.min(target,Math.max(.0228,(ahead.speed||target)*.9985));
    target=clamp(target,.0218,(isLumerreStoryRace()||isSeasonStoryRace())?.0318:.0310);

    // Momentum: fast launch acceleration, then restrained race acceleration/deceleration.
    // Target pace can change, but visible speed does not jump with it.
    const accelRate=raceAge<2600?.0145:.00235;
    const decelRate=raceAge<2600?.0155:.00305;
    r.speed=approachValue(r.speed,target,(target>=r.speed?accelRate:decelRate)*dt);
    r.distance+=r.speed*dt;
  }
  function updateCheckpointAndLap(r,t){
    if(r.finished||r.distance<0)return;const completed=Math.floor(Math.max(0,r.distance));const frac=mod1(r.distance);while(r.nextCp<activeCheckpoints().length&&frac>=activeCheckpoints()[r.nextCp]&&completed===r.lastLapCross){r.nextCp++;}
    if(completed>r.lastLapCross){
      if(r.nextCp>=activeCheckpoints().length){const lapMs=Math.max(1,t-r.lapStartedAt);r.bestLapMs=!r.bestLapMs?lapMs:Math.min(r.bestLapMs,lapMs);r.lapStartedAt=t;r.lapStartedEpochMs=state.raceStartedEpochMs+Math.max(0,t-state.raceStartedAt);r.lastLapCross=completed;r.nextCp=0;if(r.isPlayer&&completed<activeLaps()&&completed!==activeLaps()-1)showLapBanner(`LAP ${completed+1} / ${activeLaps()}`);}else{r.lastLapCross=completed;r.nextCp=0;}
    }
    if(r.distance>=activeLaps()&&!r.finished){
      r.finished=true;r.finishMs=Math.max(0,t-state.raceStartedAt);r.finishAnimAt=t;state.resultOrder.push(r);r.el?.classList.add('is-finished');if(state.resultOrder.length===1){r.el?.classList.add('is-race-winner');state.raceStory.winner=r.name;showRaceEvent('CHECKERED FLAG',`${r.name} WINS ${activeTrack().shortName}`,'leader',true);raceMemory('winner',{distance:r.distance,winner:r.name,text:`${r.name} won the race`});}else if(state.resultOrder.length<=3)r.el?.classList.add('is-podium-finish');
      if(state.resultOrder.length===2&&!state.camera.photoFinishDone){const gap=Math.abs(state.resultOrder[1].finishMs-state.resultOrder[0].finishMs);if(gap<=250)triggerPhotoFinish(state.resultOrder[0],state.resultOrder[1],t);}
      if(r.isPlayer)onPlayerFinish(t);
    }
  }
  function separateRacers(){
    for(let i=0;i<state.racers.length;i++)for(let j=i+1;j<state.racers.length;j++){
      const a=state.racers[i],b=state.racers[j];if(a.finished||b.finished)continue;
      if(Math.abs(a.distance-b.distance)<.0032&&Math.abs(a.lateral-b.lateral)<.16){
        const dir=a.lateral<=b.lateral?-1:1,push=.055;
        if(a.ai)a.ai.targetLane=clamp((a.ai.targetLane??a.lateral)+dir*push,-.74,.74);
        if(b.ai)b.ai.targetLane=clamp((b.ai.targetLane??b.lateral)-dir*push,-.74,.74);
      }
    }
  }

  function renderRacer(r,t){
    const p=worldPoint(r),motion=racerMotionState(r,t),lift=motion==='fly'?-77:motion==='takeOff'||motion==='land'?-73:-68;
    const visual=r.visual||(r.visual={bank:0,lean:0,lastLateral:r.lateral,lastSpeed:r.speed||0,lastAt:t,bobPhase:Math.random()*Math.PI*2,altitudeBias:0,nextShadowAt:0});
    const perspectiveScale=.69+(p.y/activeWorldHeight())*.42;
    const altitudeOffset=motion==='fly'?visual.altitudeBias:motion==='takeOff'||motion==='land'?visual.altitudeBias*.42:0;
    r.el.style.left='0px';r.el.style.top='0px';r.el.style.transform=`translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0) translate(-50%,${lift}%) translateY(${altitudeOffset.toFixed(2)}px) scale(${perspectiveScale.toFixed(3)})`;r.el.style.zIndex=String(20+Math.round(p.y/9)+(r.isPlayer?20:0));
    r.el.classList.toggle('is-flying',motion==='fly');r.el.classList.toggle('is-taking-off',motion==='takeOff');r.el.classList.toggle('is-landing',motion==='land');
    const movingRight=Math.cos(p.ang)>=0,nativeRight=nativeFacingRight(r.breed,motion);r.el.classList.toggle('is-flipped',movingRight!==nativeRight);

    const visualDt=clamp((t-(visual.lastAt||t))/1000,.001,.05),before=pointAt(r.distance-.006),after=pointAt(r.distance+.006);
    const signedTurn=normalizeAngle(after.ang-before.ang),laneVelocity=(r.lateral-visual.lastLateral)/visualDt,baseSpeed=Math.max(.0001,r.ai?.base||.0265),speedRatio=(r.speed||0)/baseSpeed;
    const bankTarget=motion==='fly'?clamp(signedTurn*72+laneVelocity*7.5,-8.5,8.5):0;
    const leanTarget=motion==='fly'?clamp((speedRatio-1)*22,-1.3,1.6):0;
    visual.bank=lerp(visual.bank,bankTarget,clamp(visualDt*5.2,0,1));
    visual.lean=lerp(visual.lean,leanTarget,clamp(visualDt*4.2,0,1));
    const bob=motion==='fly'?Math.sin(t/235+visual.bobPhase)*1.35:0;
    if(r.spriteWrap){r.spriteWrap.style.setProperty('--flight-bank',`${visual.bank.toFixed(2)}deg`);r.spriteWrap.style.setProperty('--flight-lean',`${visual.lean.toFixed(2)}deg`);r.spriteWrap.style.setProperty('--flight-bob',`${bob.toFixed(2)}px`);}
    if(r.shadow&&t>=(visual.nextShadowAt||0)){
      const airborne=motion==='fly',transitioning=motion==='takeOff'||motion==='land';
      const lag=airborne?5.2+Math.max(0,speedRatio-1)*18:transitioning?3.2:1.6;
      const shadowX=-Math.cos(p.ang)*lag,shadowY=-Math.sin(p.ang)*lag+4.2;
      const speedStretch=clamp(1.02+Math.max(0,speedRatio-1)*2.8,1.02,1.16);
      const shadowOpacity=airborne?.30:transitioning?.36:.40;
      r.shadow.style.transform=`translate(calc(-50% + ${shadowX.toFixed(2)}px),${shadowY.toFixed(2)}px) rotate(${(p.ang*180/Math.PI).toFixed(1)}deg) scaleX(${speedStretch.toFixed(3)})`;
      r.shadow.style.opacity=shadowOpacity.toFixed(2);
      visual.nextShadowAt=t+32;
    }
    visual.lastLateral=r.lateral;visual.lastSpeed=r.speed||0;visual.lastAt=t;

    const finalPush=r.distance>=activeLaps()-.14,bursting=t<(r.ai?.boostUntil||0)||(r.ai?.surge||0)>.0105||speedRatio>1.032;
    const speedFx=motion==='fly'&&(finalPush||bursting);
    r.el.classList.toggle('is-speeding',speedFx);
    if(r.trail)r.trail.style.transform=`translate(-100%,-50%) rotate(${(p.ang*180/Math.PI).toFixed(1)}deg)`;

    const frames=animationFrames(r.breed,motion);
    if(r.animKey!==motion){r.animKey=motion;r.animIndex=0;r.frameAt=t;const first=frames[0];if(first?.src&&r.img.getAttribute('src')!==first.src)r.img.src=first.src;}
    let current=frames[r.animIndex%frames.length]||frames[0],guard=0;
    while(current&&t-r.frameAt>=Math.max(1,current.durationMs||1)&&guard<Math.max(2,frames.length*2)){r.frameAt+=Math.max(1,current.durationMs||1);r.animIndex=(r.animIndex+1)%frames.length;current=frames[r.animIndex]||frames[0];guard++;}
    if(current?.src&&r.img.getAttribute('src')!==current.src)r.img.src=current.src;
  }
  function standings(){return state.racers.slice().sort((a,b)=>{if(a.finished&&b.finished)return a.finishMs-b.finishMs;if(a.finished)return-1;if(b.finished)return 1;return b.distance-a.distance;});}
  function updateHud(t){
    const time=state.game?.querySelector('[data-race-time]');if(time)time.textContent=formatTime(state.raceStartedAt?raceElapsedMs():0);if(t<(state.nextHudTickAt||0))return;state.nextHudTickAt=t+66;
    const order=standings(),rank=Math.max(1,order.findIndex(r=>r.isPlayer)+1),p=state.player,pos=state.game.querySelector('[data-race-position]'),lap=state.game.querySelector('[data-race-lap]');if(pos)pos.textContent=`${rank} / ${state.racers.length||expectedRacerCount()}`;if(lap)lap.textContent=`${Math.min(activeLaps(),Math.floor(Math.max(0,p.distance))+1)} / ${activeLaps()}`;
    updateBroadcastHud(order,t);if(t>=state.nextHudLayoutAt){updateLeaderboard(order,t);updateNameplates(order);state.nextHudLayoutAt=t+120;}
  }
  function racerById(id){return state.racers.find(r=>r.id===id)||null;}
  function meanWorld(racers){const pts=(racers||[]).filter(Boolean).map(worldPoint);if(!pts.length)return{x:activeWorldWidth()/2,y:activeWorldHeight()/2};return{x:pts.reduce((s,p)=>s+p.x,0)/pts.length,y:pts.reduce((s,p)=>s+p.y,0)/pts.length};}

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
    const cam=state.camera,order=standings(),active=order.filter(r=>!r.finished),leader=active[0]||order[0]||state.player,pack=focusPack(order);
    // Race zoom is intentionally almost fixed. Drama comes from *where* we frame, not pumping the lens.
    if(cam.mode==='ceremonyWide')return{x:activeWorldWidth()/2,y:activeWorldHeight()/2,zoom:1.06};
    if(cam.mode==='grid'){const p=pointAt(0);return{x:p.x+24,y:p.y+7,zoom:1.43};}
    if(cam.mode==='photoFinish'){const p=pointAt(.002);return{x:p.x+20,y:p.y+4,zoom:1.53};}
    if(cam.mode==='finalLeader'&&leader){const p=worldPoint(leader),ahead=pointAt(leader.distance+.012);return{x:lerp(p.x,ahead.x,.25),y:lerp(p.y,ahead.y,.25),zoom:1.485};}
    if(cam.mode==='finalStraight'){const top=(pack.length?pack:order.slice(0,3)).filter(Boolean),focus=meanWorld(top),p=leader?pointAt(leader.distance+.014):null;return{x:p?lerp(focus.x,p.x,.38):focus.x,y:p?lerp(focus.y,p.y,.38):focus.y,zoom:1.49};}
    if(cam.mode==='closeBattle'){const subjects=cam.subjectIds.map(racerById).filter(r=>r&&!r.finished),focus=meanWorld(subjects),ref=subjects[0],ahead=ref?pointAt(ref.distance+.009):null;return{x:ahead?lerp(focus.x,ahead.x,.20):focus.x,y:ahead?lerp(focus.y,ahead.y,.20):focus.y,zoom:1.49};}
    if(cam.mode==='widePack'){const focus=meanWorld(active.length?active:order);return{x:focus.x,y:focus.y,zoom:1.455};}
    if(cam.mode==='panAhead'){const focusGroup=(pack.length?pack:order.slice(0,4)).filter(Boolean),focus=meanWorld(focusGroup),ref=focusGroup[0]||state.player||leader,p=ref?pointAt(ref.distance+.018):null;return{x:p?lerp(focus.x,p.x,.42):focus.x,y:p?lerp(focus.y,p.y,.42):focus.y,zoom:1.475};}
    const followGroup=(pack.length?pack:order.slice(0,4)).filter(Boolean),packPoint=meanWorld(followGroup.length?followGroup:order),packLeader=followGroup[0]||leader,playerPoint=state.player&&!state.player.finished?worldPoint(state.player):packPoint,anchor=packLeader?pointAt(packLeader.distance+.012):null;return{x:anchor?lerp(lerp(playerPoint.x,packPoint.x,.36),anchor.x,.27):lerp(playerPoint.x,packPoint.x,.36),y:anchor?lerp(lerp(playerPoint.y,packPoint.y,.36),anchor.y,.27):lerp(playerPoint.y,packPoint.y,.36),zoom:1.475};
  }
  function evaluateCamera(t){
    if(state.phase!=='racing'&&state.phase!=='player_finished')return;const cam=state.camera,order=standings(),active=order.filter(r=>!r.finished);if(!active.length)return;const leader=active[0],leaderLap=Math.floor(Math.max(0,leader.distance))+1;
    if(!cam.finalLapShown&&leaderLap>=activeLaps()){cam.finalLapShown=true;startFinalLapDrama(leader,t);setCameraMode('finalLeader',1650,false,[leader.id]);state.director.holdUntil=t+2100;cam.nextEventAt=t+6000;return;}
    if(!cam.finalStraightShown&&leader.distance>=activeLaps()-.13){cam.finalStraightShown=true;setCameraMode('finalStraight',4600,false,active.slice(0,3).map(r=>r.id));state.director.holdUntil=t+4600;if(state.crowdAudio)fadeAudio(state.crowdAudio,crowdTarget(.022),520);cam.nextEventAt=t+7600;return;}
    if(cam.eventUntil&&t<cam.eventUntil)return;if(cam.eventUntil&&t>=cam.eventUntil){cam.eventUntil=0;cam.mode='follow';cam.subjectIds=[];}
    if(t<state.director.holdUntil||t<cam.nextDecisionAt)return;cam.nextDecisionAt=t+850;
    const battle=bestBattleCandidate(order);
    if(battle&&battle.score>=58){const key=battle.key,same=key===state.director.lastSubjectKey;state.director.holdUntil=t+(same?3000:4200);state.director.lastSubjectKey=key;const canCut=!same&&t-(state.director.lastCutAt||0)>6200;if(canCut)state.director.lastCutAt=t;setCameraMode('closeBattle',same?3000:4200,canCut,[battle.ahead.id,battle.behind.id]);return;}
    if(cam.mode!=='follow'||cam.subjectIds.length){state.director.holdUntil=t+3200;state.director.lastSubjectKey='';setCameraMode('follow',0,false,[]);return;}
    state.director.holdUntil=t+2600;
  }
  function updateCamera(dt,t){
    if(!state.viewport||!state.world)return;
    const width=Math.max(1,state.viewport.clientWidth),height=Math.max(1,state.viewport.clientHeight),baseScale=Math.min(width/activeWorldWidth(),height/activeWorldHeight()),target=cameraTarget(t),cam=state.camera;target.zoom*=Number(activeTrack().cameraZoomMultiplier)||1;
    const posEase=1-Math.exp(-dt*(cam.mode==='ceremonyWide'?1.05:cam.mode==='grid'?1.42:2.05));
    const zoomEase=1-Math.exp(-dt*(cam.mode==='ceremonyWide'?.72:.30));
    const driftStrength=(state.phase==='racing'||state.phase==='player_finished') ? (cam.mode==='follow'?.16:cam.mode==='closeBattle'?.10:.07) : 0;
    const driftX=((Math.sin(t/3100)*6.2)+(Math.sin(t/1775)*1.8))*driftStrength;
    const driftY=((Math.cos(t/3480)*3.8)+(Math.sin(t/2050)*1.4))*driftStrength;
    cam.x=lerp(cam.x,target.x+driftX,posEase);
    cam.y=lerp(cam.y,target.y+driftY,posEase);
    cam.zoom=lerp(cam.zoom,target.zoom,zoomEase);
    const scale=baseScale*clamp(cam.zoom,1,1.9),worldW=activeWorldWidth()*scale,worldH=activeWorldHeight()*scale;
    let x=width/2-cam.x*scale,y=height/2-cam.y*scale;
    x=clamp(x,width-worldW,0);
    y=clamp(y,height-worldH,0);
    state.world.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
    updateViewportFocus(width,height,scale,x,y,t);
  }


  function updateViewportFocus(width,height,scale,offsetX,offsetY,t){
    if(!state.viewport)return;
    if(t<(state.nextFocusAt||0))return;
    state.nextFocusAt=t+84;
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

  function onPlayerFinish(t){state.phase='player_finished';state.finishAt=now();const p=state.player,rank=standings().findIndex(r=>r.isPlayer)+1;state.raceStory.finishPosition=rank;state.raceStory.finishTimeMs=Math.round(Number(p.finishMs)||raceElapsedMs());state.raceStory.bestLapMs=Math.round(Number(p.bestLapMs)||0);state.raceStory.startPosition=Math.max(1,(Number(p.slot)||0)+1);raceMemory('player-finish',{distance:p.distance,position:rank,text:`Finished ${ordinal(rank)}`});if(!isStoryRace())persistResult(p,rank);showLapBanner(`${ordinal(rank)} PLACE · FINISH`);scheduleResultsReveal();}
  function persistResult(player,rank){
    const data=loadSave(),tracks=data.tracks||(data.tracks={}),trackId=state.trackId||DEFAULT_TRACK_ID,s=tracks[trackId]||(tracks[trackId]={races:0,wins:0,podiums:0,bestTimeMs:0,bestLapMs:0});s.races=(Number(s.races)||0)+1;if(rank===1)s.wins=(Number(s.wins)||0)+1;if(rank<=3)s.podiums=(Number(s.podiums)||0)+1;if(!s.bestTimeMs||player.finishMs<s.bestTimeMs)s.bestTimeMs=Math.round(player.finishMs);if(player.bestLapMs&&(!s.bestLapMs||player.bestLapMs<s.bestLapMs))s.bestLapMs=Math.round(player.bestLapMs);s.lastFinishPosition=rank;s.lastFinishTimeMs=Math.round(player.finishMs);s.updatedAt=Date.now();data.level=Math.max(1,Number(data.level)||1);data.xp=Math.max(0,Number(data.xp)||0);saveData(data);
    // Account Dragon Racing XP is granted server-side when the verified race reward is claimed.
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
    if(isLumerreTrack()&&state.finalLapMusic&&!state.finalLapMusic.paused)fadeAudio(state.finalLapMusic,Math.max(.12,Number(activeTrack().finalLapMusicVolume)||.28)*.82,700);else fadeAudio(state.raceMusic,raceMusicTarget(.92),700);
    if(state.crowdAudio)fadeAudio(state.crowdAudio,activeCrowdVolume(),500);

    const elapsed=raceElapsedMs();
    for(const r of state.racers){
      if(r.finished)continue;
      const remaining=Math.max(0,activeLaps()-r.distance),projected=remaining/Math.max(.021,r.speed||.024)*1000;
      r.finished=true;r.finishMs=elapsed+projected;
      if(!r.bestLapMs)r.bestLapMs=Math.max(1,r.finishMs/activeLaps());
    }

    const results=state.game.querySelector('.dragon-race-results');
    const card=results.querySelector('.dragon-race-results-card');
    const order=standings();
    const rank=order.findIndex(r=>r.isPlayer)+1;
    const p=state.player;
    const leader=order[0]||p;
    const playerInfo=storyPlayerInfo();
    const previous={...(state.preRaceTrackStats||{})};
    const current=getTrackStats(state.trackId);
    const startPosition=Math.max(1,(Number(p.slot)||0)+1);
    const positionDelta=startPosition-rank;
    const quickestLap=Math.min(...order.map(r=>Number(r.bestLapMs)||Infinity).filter(Number.isFinite));
    const gapToWinner=Math.max(0,(Number(p.finishMs)||0)-(Number(leader.finishMs)||0));
    const storyRace=isStoryRace();
    const wasFirstRecordedRace=!storyRace&&!(Number(previous.races)||0);
    const isNewPersonalBest=!storyRace&&(wasFirstRecordedRace||!(Number(previous.bestTimeMs)||0)||p.finishMs<Number(previous.bestTimeMs));
    const isNewBestLap=!storyRace&&(wasFirstRecordedRace||!(Number(previous.bestLapMs)||0)||p.bestLapMs<Number(previous.bestLapMs));
    const firstWin=!storyRace&&rank===1&&!(Number(previous.wins)||0);
    const firstPodium=!storyRace&&rank<=3&&!(Number(previous.podiums)||0);
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

    if(state.raceStory.notableMoment)notes.push(state.raceStory.notableMoment);
    if(state.raceStory.leadChanges||state.raceStory.overtakes){
      const parts=[];
      if(state.raceStory.overtakes)parts.push(`${state.raceStory.overtakes} recorded overtake${state.raceStory.overtakes===1?'':'s'}`);
      if(state.raceStory.leadChanges)parts.push(`${state.raceStory.leadChanges} lead change${state.raceStory.leadChanges===1?'':'s'}`);
      notes.push(parts.join(' · '));
    }

    const movementLabel=positionDelta>0?'POSITIONS GAINED':positionDelta<0?'POSITIONS LOST':'GRID MOVEMENT';
    const movementValue=positionDelta>0?`+${positionDelta}`:positionDelta<0?`−${Math.abs(positionDelta)}`:'—';
    const pbValue=storyRace?String(isSeasonStoryRace()?(state.storyRace?.seasonStrategy||'adaptive'):(state.storyRace?.strategy||'focus')).toUpperCase():(isNewPersonalBest?formatTime(p.finishMs):(current.bestTimeMs?formatTime(current.bestTimeMs):formatTime(p.finishMs)));
    const pbHint=storyRace?'Career strategy · ordinary race records unchanged':(isNewPersonalBest?(wasFirstRecordedRace?'First benchmark recorded':(Number(previous.bestTimeMs)>p.finishMs?`${formatDeltaMs(Number(previous.bestTimeMs)-p.finishMs)} quicker`:'New best')):'Current circuit record');

    if(!isStoryRace())persistAiResults(order);

    card.classList.remove('is-first','is-second','is-third','is-standard');
    card.classList.add(finishClass);
    card.innerHTML=`
      <div class="dragon-race-result-topline"><span>VELMORA RACING NETWORK</span><em>OFFICIAL RESULT · RACE ${displayRaceNumber()}</em></div>

      <div class="dragon-race-result-hero">
        <div class="dragon-race-result-dragon">
          <img src="${escapeRaceText(playerInfo.sprite)}" alt="">
          <div>
            <small>${escapeRaceText(activeTrack().shortName)}</small>
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
        <div class="dragon-race-result-metric"><b>${storyRace?'STRATEGY':'PERSONAL BEST'}</b><em>${pbValue}</em><small>${pbHint}</small></div>
        <div class="dragon-race-result-metric"><b>GRID</b><em>${ordinal(startPosition)}</em><small>Starting position</small></div>
        <div class="dragon-race-result-metric"><b>${movementLabel}</b><em>${movementValue}</em><small>${ordinal(startPosition)} → ${ordinal(rank)}</small></div>
      </div>

      ${isStoryRace()?'':`<div class="dragon-race-reward-strip is-pending" data-race-reward-card>
        <div class="dragon-race-reward-medallion" aria-hidden="true"><b>M</b></div>
        <div class="dragon-race-reward-copy"><small data-race-reward-kicker>RACE REWARD</small><strong data-race-reward-status>Verifying Keeper Marks + GP + Dragon Racing XP…</strong><em data-race-reward-balance></em></div>
        <div class="dragon-race-reward-total"><b data-race-reward-total>…</b><span>KEEPER MARKS</span></div>
      </div>`}

      <div class="dragon-race-result-lower">
        <section class="dragon-race-classification">
          <header><span>FINAL CLASSIFICATION</span><em>${isStoryRace()?'TIME':'TIME · MARKS'}</em></header>
          <div class="dragon-race-classification-list">
            ${order.map((r,i)=>`<div class="dragon-race-classification-row${r.isPlayer?' is-player':''}${i===0?' is-winner':''}" style="--reveal:${i*45}ms"><b>${i+1}</b><i style="--racer-accent:${r.accent||racerAccent(r,i)}"></i><span>${escapeRaceText(r.name)}${r.isPlayer?'<small>YOU</small>':''}</span><em>${i===0?formatTime(r.finishMs):formatRaceGap(r.finishMs-leader.finishMs)}</em>${isStoryRace()?'':`<strong class="dragon-race-classification-marks" data-race-marks-racer="${r.isPlayer?'player':escapeRaceText(r.id)}"><b>+${marksForPosition(i+1)}</b><small>MARKS</small></strong>`}</div>`).join('')}
          </div>
        </section>

        <section class="dragon-race-result-notes">
          <header>RACE NOTES</header>
          <div>${notes.slice(0,4).map((note,i)=>`<p style="--reveal:${100+i*70}ms"><i></i><span>${escapeRaceText(note)}</span></p>`).join('')}</div>
        </section>
      </div>

      <div class="dragon-race-result-footer">
        <small>${isLumerreStoryRace()?'LUMERRE CROWN · THE WEEKEND CONTINUES':isStoryRace()?'STORY RESULT · SAVED WHEN YOU CONTINUE':'KEEPER MARKS + GP + DRAGON RACING XP AWARDED'}</small>
        <div class="dragon-race-results-actions">${isStoryRace()?`<div class="is-primary" role="button" tabindex="0" data-race-continue-story>${isLumerreStoryRace()?'CONTINUE · AFTER THE FLAG':'CONTINUE STORY'}</div>`:'<div class="is-primary" role="button" tabindex="0" data-race-again>RACE AGAIN</div><div role="button" tabindex="0" data-race-track-select>TRACK SELECT</div><div role="button" tabindex="0" data-race-leave>LEAVE RACEWAY</div>'}</div>
      </div>`;

    results.classList.remove('is-visible');
    requestAnimationFrame(()=>results.classList.add('is-visible'));
    if(isStoryRace()){
      bindAction(card.querySelector('[data-race-continue-story]'),()=>returnStoryRace({rank,finishMs:p.finishMs,bestLapMs:p.bestLapMs,startPosition,positionsGained:Math.max(0,positionDelta),positionDelta,playerOvertakes:state.raceStory.playerOvertakes,totalOvertakes:state.raceStory.overtakes,leadChanges:state.raceStory.leadChanges,photoFinish:!!state.camera.photoFinishDone,notableMoment:String(state.raceStory.notableMoment||''),events:(state.raceStory.events||[]).slice(-12)}));
    }else{
      bindAction(card.querySelector('[data-race-again]'),()=>start({id:state.trackId}));
      bindAction(card.querySelector('[data-race-track-select]'),()=>exitToTrackSelect());
      bindAction(card.querySelector('[data-race-leave]'),()=>{stop();window.DragonRacingUi?.close?.();});
      const rewardRunId=state.rewardRunId;
      void claimRaceReward(rank,p.finishMs,p.bestLapMs,card,rewardRunId);
    }
  }

  function returnStoryRace(result={}){
    if(!isStoryRace())return false;
    const config={...state.storyRace},order=standings();
    const classification=order.map((r,index)=>({id:String(r.id||'').replace(/^story-/,''),racerId:String(r.id||'').replace(/^story-/,''),name:String(r.name||''),rank:index+1,position:index+1,isPlayer:!!r.isPlayer,finishMs:Math.round(Number(r.finishMs)||0),bestLapMs:Math.round(Number(r.bestLapMs)||0),gridPosition:Math.max(1,(Number(r.slot)||0)+1)}));
    const rivalRanks=Object.fromEntries(classification.filter(row=>!row.isPlayer).map(row=>[row.id,row.rank]));
    const detail={source:'dragonbound-career',trackId:state.trackId,careerSaveId:String(config.careerSaveId||''),runId:String(config.runId||''),raceKey:String(config.raceKey||''),strategy:String(config.strategy||'focus'),seasonStrategy:String(config.seasonStrategy||''),seasonRound:Number(config.seasonRound)||0,seasonRoundId:String(config.seasonRoundId||''),presentationMode:String(config.presentationMode||''),seasonCallResponses:Array.isArray(config.seasonCallResponses)?config.seasonCallResponses.map(row=>({...row})):[],classification,standings:classification,finishOrder:classification.map(row=>row.id),rivalRanks,teamOrderResponse:String(config.teamOrderResponse||''),...result};
    const type=result.aborted?'dragonbound-career-story-race-aborted':'dragonbound-career-story-race-result';
    postCareerBridge(type,{result:detail});
    try{window.dispatchEvent(new CustomEvent(result.aborted?'dragonbound:story-race-aborted':'dragonbound:story-race-complete',{detail}));}catch(_e){}
    stop();window.DragonRacingUi?.close?.();
    return true;
  }

  function loop(t){
    if(!state.game||state.phase==='closed')return;
    state.raf=requestAnimationFrame(loop);
    const rawDt=Math.max(0,(t-state.lastT)/1000)||.016;state.lastT=t;
    let renderClock=t;
    if(state.phase==='racing'||state.phase==='player_finished'){
      const simRate=seasonSimulationRate();
      const simDt=Math.min(simRate>1?.42:.5,rawDt*simRate);
      let remaining=simDt,simT=state.simClock||t,steps=0;
      while(remaining>.00001&&steps<180){
        const step=Math.min(1/60,remaining);simT+=step*1000;
        for(const r of state.racers){if(r.finished)continue;autoRacerUpdate(r,step,simT);updateSectorTiming(r,simT);updateCheckpointAndLap(r,simT);}
        separateRacers();remaining-=step;steps++;
      }
      state.simClock=simT;renderClock=simT;
      if(t>=(state.nextRaceStoryAt||0)){detectRaceEvents(simT);updateBattleMoments(simT);maybeOfferLumerreTeamOrder(simT);maybeOfferSeasonRaceCall(simT);state.nextRaceStoryAt=t+120;}
      maybePlayWingSound(t);
      if(t>=(state.nextCameraEvalAt||0)){evaluateCamera(t);state.nextCameraEvalAt=t+100;}
    }
    updateCamera(Math.min(.1,rawDt),t);for(const r of state.racers)renderRacer(r,renderClock);updateHud(t);
  }

  function start(track={id:DEFAULT_TRACK_ID}){
    const requested=trackById(track?.id||DEFAULT_TRACK_ID);if(!requested)return false;const storyConfig=track?.story&&typeof track.story==='object'?{...track.story}:null;stop(false);state.storyRace=storyConfig;state.trackId=requested.id;state.samples=[];state.totalLength=0;if(!isStoryRace()){const progression=loadSave();saveData(progression);}state.preRaceTrackStats=getTrackStats(state.trackId);buildSamples();const game=ensureGame();if(!game)return false;
    document.getElementById('dragonRacingModal')?.classList.add('is-race-active');game.querySelector('.dragon-race-results')?.classList.remove('is-visible');game.classList.toggle('is-debug-path',state.debugPath);game.classList.toggle('is-story-race',isStoryRace());game.classList.toggle('is-lumerre-crown',isLumerreTrack());createRacers();setPhase('setup');state.resultOrder=[];state.finishAt=0;state.simClock=0;state.raceStartedEpochMs=0;state.aiStatsPersisted=false;state.nextHudLayoutAt=0;state.nextHudTickAt=0;state.nextRaceStoryAt=0;state.nextCameraEvalAt=0;state.nextFocusAt=0;state.raceOrderIds=[];state.pendingOrderKey='';state.pendingOrderAt=0;state.lastLeaderId='';state.lastRaceEventAt=0;state.raceStory={overtakes:0,leadChanges:0,playerOvertakes:0,playerLostPositions:0,events:[],notableMoment:''};state.broadcastEvents=[];state.battleWatch={};state.activeBattleKey='';state.fastestSectors={};state.lastBattleCalloutAt=0;state.lastFastestEventAt=0;state.nextBroadcastHudAt=0;state.director={lastCutAt:0,holdUntil:0,lastSubjectKey:'',lastMode:'follow'};renderBroadcastFeed();state.finalLapDramaStarted=false;state.photoFinishHoldUntil=0;clearTimeout(state.finishRevealTimer);state.finishRevealTimer=0;clearTimeout(state.raceEventTimer);state.raceEventTimer=0;game.classList.remove('is-final-lap','is-photo-finish');game.querySelector('.dragon-race-starting-grid')?.classList.remove('is-visible');hideRaceEvent();hideLumerreTeamOrder();if(isLumerreStoryRace()){state.storyRace.teamOrderShown=false;state.storyRace.teamOrderResponse='';state.storyRace.teamOrderEffectUntil=0;}if(isSeasonStoryRace()){state.storyRace.seasonCallIndex=0;state.storyRace.seasonCallVisible=-1;state.storyRace.seasonCallResponses=[];state.storyRace.seasonCallEffect={};state.storyRace.seasonCallEffectUntil=0;}state.camera={x:activeWorldWidth()/2,y:activeWorldHeight()/2,zoom:1,targetX:activeWorldWidth()/2,targetY:activeWorldHeight()/2,targetZoom:1,mode:'wide',eventUntil:0,nextDecisionAt:0,nextEventAt:0,subjectIds:[],finalLapShown:false,finalStraightShown:false,photoFinishDone:false,forcedMode:''};state.keys={up:false,down:false,left:false,right:false,boost:false};const rewardRunId=++state.rewardRunId;state.raceRewardSessionId='';state.raceRewardClaim=null;state.raceRewardPromise=isStoryRace()?Promise.resolve(null):beginRaceRewardSession(rewardRunId);game.classList.add('is-visible');window.DragonRacingUi?.fadeMenuAudioOut?.(650);startRaceAudio();state.lastT=now();if(state.raf)cancelAnimationFrame(state.raf);state.raf=requestAnimationFrame(loop);queueSequence(()=>{if(state.phase==='setup')startCeremony();},320,state.countdownToken);return true;
  }
  function stop(remove=false){
    state.storyRace=null;
    state.countdownToken++;clearSequenceTimers();state.audioFadeToken++;if(state.raf){cancelAnimationFrame(state.raf);state.raf=0;}clearTimeout(state.lapBannerTimer);state.lapBannerTimer=0;clearTimeout(state.raceEventTimer);state.raceEventTimer=0;clearTimeout(state.finishRevealTimer);state.finishRevealTimer=0;stopRaceAudio(true);setPhase('closed');state.keys={up:false,down:false,left:false,right:false,boost:false};document.getElementById('dragonRacingModal')?.classList.remove('is-race-active');
    if(state.game){state.game.classList.remove('is-visible','is-debug-path','is-final-lap','is-photo-finish','is-story-race','is-lumerre-crown');hideRaceEvent();hideLumerreTeamOrder();state.game.querySelector('.dragon-race-results')?.classList.remove('is-visible');state.game.querySelector('.dragon-race-countdown')?.classList.remove('is-pop');state.game.querySelector('.dragon-race-broadcast-title')?.classList.remove('is-visible');state.game.querySelector('.dragon-race-starting-grid')?.classList.remove('is-visible');state.game.querySelector('.dragon-race-start-lights')?.classList.remove('is-visible','is-go');const lapBanner=state.game.querySelector('.dragon-race-lap-banner');if(lapBanner){lapBanner.classList.remove('is-visible');lapBanner.textContent='';}if(remove){state.game.remove();state.game=null;state.viewport=null;state.world=null;}}
  }
  function exitToTrackSelect(){stop();window.DragonRacingUi?.closeRaceConfirm?.();requestAnimationFrame(()=>{window.DragonRacingUi?.showScene?.('menu');window.DragonRacingUi?.restoreMenuAudio?.(450);});}
  function isActive(){return state.phase!=='closed';}

  // V33.48: races are fully autonomous; there are deliberately no steering/boost keybinds.



  function sendCareerLaunchReply(target,bridge,type,payload={}){if(!target)return false;try{target.postMessage({type,bridge,...payload},'*');return true;}catch(_e){return false;}}
  function isLumerreCareerMessage(data){return !!data&&(String(data.raceKey||'')==='lumerre'||String(data.trackId||data.descriptor?.trackId||data.descriptor?.id||'')===LUMERRE_TRACK_ID);}
  function handleCareerRaceBridgeMessage(event){
    const data=event?.data;if(!data||typeof data!=='object'||!event.source||event.source===window)return;
    const type=String(data.type||'');if(type!=='dragonbound-career-story-track-register'&&type!=='dragonbound-career-story-race-start')return;
    if(!isLumerreCareerMessage(data))return;const bridge=typeof data.bridge==='string'?data.bridge:String(data.bridge||'');
    if(type==='dragonbound-career-story-track-register'){registerLumerreCareerTrack(data.descriptor||data.trackDescriptor||data.track||{},data.audio||{});return;}
    const descriptor=data.trackDescriptor||data.track||data.trackRegistration?.descriptor||window.DragonboundCareerTrackDescriptors?.[LUMERRE_TRACK_ID]||{};
    const registered=registerLumerreCareerTrack(descriptor,data.audio||{});
    if(!registered){sendCareerLaunchReply(event.source,bridge,'dragonbound-career-story-race-error',{error:'Lumerre Crown track registration failed.',result:{raceKey:'lumerre',trackId:LUMERRE_TRACK_ID,careerSaveId:String(data.careerSaveId||''),runId:String(data.runId||'')}});return;}
    try{
      if(!window.DragonRacingUi?.open)throw new Error('Dragon Racing UI is not loaded.');
      window.DragonRacingUi.open();
      const story={...data,__careerBridgeSource:event.source,__careerBridgeToken:bridge};
      const ok=start({id:LUMERRE_TRACK_ID,story});
      if(!ok)throw new Error('Dragon Racing engine rejected Lumerre Crown Circuit.');
      sendCareerLaunchReply(event.source,bridge,'dragonbound-career-story-race-started',{result:{raceKey:'lumerre',trackId:LUMERRE_TRACK_ID,careerSaveId:String(data.careerSaveId||''),runId:String(data.runId||''),engine:'DragonRacingRace',racerCount:state.racers.length,laps:activeLaps()}});
    }catch(error){
      try{stop(false);window.DragonRacingUi?.close?.();}catch(_e){}
      sendCareerLaunchReply(event.source,bridge,'dragonbound-career-story-race-error',{error:String(error?.message||error||'Lumerre race could not start.'),result:{raceKey:'lumerre',trackId:LUMERRE_TRACK_ID,careerSaveId:String(data.careerSaveId||''),runId:String(data.runId||'')}});
    }
  }
  window.addEventListener('message',handleCareerRaceBridgeMessage);

  function admin(){return currentAccount()==='admin';}
  window.DragonRacingRace={start,stop,exitToTrackSelect,isActive,isStoryRace,getPlayerInfo,getProgression,refreshProgression,getTrackStats,getRewardInfo,formatTime,registerCareerTrack:registerLumerreCareerTrack};
  window.DragonRacingDebug={
    inspect(){if(!admin())return null;return{phase:state.phase,player:state.player?{distance:state.player.distance,lateral:state.player.lateral,speed:state.player.speed,boost:state.player.boost,finished:state.player.finished,auto:true,raceLuck:state.player.ai?.raceLuck||0,tinyBias:state.player.ai?.extraBias||0,motion:racerMotionState(state.player,now())}:null,progression:getProgression(),stats:getTrackStats(),raceStory:{...state.raceStory},finalLap:state.finalLapDramaStarted};},
    showPath(on=true){if(!admin())return false;state.debugPath=on!==false;state.game?.classList.toggle('is-debug-path',state.debugPath);return state.debugPath;},
    showCheckpoints(on=true){return this.showPath(on);},
    setLap(lap=1){if(!admin()||!state.player)return null;state.player.distance=Math.max(0,Number(lap)-1)+mod1(state.player.distance);return state.player.distance;},
    teleportToCheckpoint(index=0){if(!admin()||!state.player)return null;const i=clamp(Math.floor(index),0,activeCheckpoints().length-1);state.player.distance=Math.floor(Math.max(0,state.player.distance))+activeCheckpoints()[i];state.player.nextCp=i+1;return state.player.distance;},
    setSpeed(value=.025){if(!admin()||!state.player)return null;state.player.speed=clamp(value,0,.06);return state.player.speed;},
    finishRace(){if(!admin()||!state.player)return false;state.player.distance=activeLaps()+.001;updateCheckpointAndLap(state.player,now());if(!state.player.finished){state.player.finished=true;state.player.finishMs=raceElapsedMs();onPlayerFinish(now());}return true;},
    camera(){if(!admin())return null;return{mode:state.camera.mode,x:+state.camera.x.toFixed(1),y:+state.camera.y.toFixed(1),zoom:+state.camera.zoom.toFixed(3),eventUntil:state.camera.eventUntil,subjects:[...state.camera.subjectIds]};},
    forceCamera(mode='follow'){if(!admin())return false;const valid=['follow','closeBattle','widePack','panAhead','finalLeader','finalStraight','photoFinish','grid','ceremonyWide'];if(!valid.includes(mode))return false;let subjects=[];if(mode==='closeBattle')subjects=standings().slice(0,2).map(r=>r.id);setCameraMode(mode,4000,true,subjects);return true;},
    inspectAiPool(){if(!admin())return null;const saved=loadSave().aiPool||{};return expandedAiPool().map(r=>({...r,stats:{races:0,wins:0,podiums:0,bestFinish:0,...(saved[r.id]||{})}}));},
    forcePhotoFinish(){if(!admin())return false;const pair=standings().slice(0,2);if(pair.length<2)return false;triggerPhotoFinish(pair[0],pair[1],now());return true;},
    inspectRacers(){if(!admin())return null;return standings().map((r,i)=>({position:i+1,id:r.id,name:r.name,breed:r.breed,personality:r.personality||'',style:r.style||'',facing:raceBreedProfile(r.breed).facing,flyFrames:[...raceBreedProfile(r.breed).fly],distance:+r.distance.toFixed(4),lane:+r.lateral.toFixed(2),speed:+r.speed.toFixed(4),finished:r.finished}));},
    spriteQa(){if(!admin())return null;return raceSpriteQaReport();},
    spriteProfile(breed){if(!admin())return null;const key=normKey(breed);return {breed:key,...raceBreedProfile(key),registry:registryBreed(key)||null};}
  };
})();