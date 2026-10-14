/* Moratales Vampire Survivor. Pure simulation; no story state or storage access. */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory();
  else root.MORATALES_SURVIVOR=factory();
})(globalThis,function(){
  'use strict';
  const Builds=typeof module==='object'&&module.exports?require('./builds.js'):globalThis.ROUGE_MORA_BUILDS;
  const Endless=typeof module==='object'&&module.exports?require('./endless.js'):globalThis.ROUGE_MORA_ENDLESS;
  const World=typeof module==='object'&&module.exports?require('./world.js'):globalThis.ROUGE_MORA_WORLD,Majors=typeof module==='object'&&module.exports?require('./major-bosses.js'):globalThis.ROUGE_MORA_MAJORS;
  const Finale=typeof module==='object'&&module.exports?require('./finale.js'):globalThis.ROUGE_MORA_FINALE;
  const Relics=typeof module==='object'&&module.exports?require('./relics.js'):globalThis.MOROGUE_RELICS;
  const NewDemis=Object.fromEntries(['baker','groundskeeper','clockmaker','mirrorlord','huntsman','nightmayor'].map(id=>[id,typeof module==='object'&&module.exports?require('./'+id+'-encounter.js'):globalThis['MOROGUE_'+id.toUpperCase()]]));
  const Ferryman=typeof module==='object'&&module.exports?require('./ferryman-encounter.js'):globalThis.MOROGUE_FERRYMAN;
  const Bellkeeper=typeof module==='object'&&module.exports?require('./bellkeeper-encounter.js'):globalThis.MOROGUE_BELLKEEPER;
  const Landlord=typeof module==='object'&&module.exports?require('./landlord-encounter.js'):globalThis.MOROGUE_LANDLORD;
  const Duchess=typeof module==='object'&&module.exports?require('./duchess-encounter.js'):globalThis.MOROGUE_DUCHESS;
  const Recovery=typeof module==='object'&&module.exports?require('./recovery.js'):globalThis.MOROGUE_RECOVERY;
  const Hitboxes=typeof module==='object'&&module.exports?require('./boss-hitboxes.js'):globalThis.MOROGUE_BOSS_HITBOXES;
  const TAU=Math.PI*2, DURATION=360, DASH_LINK_WINDOW=.65, DASH_INPUT_BUFFER=.12, MOVE_SPEED=205, DASH_SPEED=690;
  const LIMITS={enemies:200,shots:160,hazards:160,gems:260,drops:80,effects:150,zones:32};
  const ARENA={width:1536,height:1024,left:175,right:1360,top:330,bottom:835};
  const ENEMY_TYPES=Object.fromEntries([
    ['villager','Shutter Stalker','chaser',0,[30,.25,58,11,1,13],'A hungry neighbour who closes directly.','Keep a route through the crowd.'],
    ['runner','Canal Rusher','charger',15,[24,.19,106,11,1,11],'Plants its feet before a straight rush.','Step across its marked approach.'],
    ['brute','Kettle Bulwark','bruiser',35,[115,.38,44,21,4,19],'A slow, broad obstacle with a heavy swing.','Circle its reach; do not let it pin you.'],
    ['caster','Hex Sipper','caster',70,[56,.25,49,13,3,13],'Fires aimed hexes while keeping its distance.','Move across its line of fire.'],
    ['skulker','Lantern Skulker','flanker',30,[38,.22,83,12,2,12],'Curves around your escape route with paired knives.','Watch the side of a retreat.'],
    ['courier','Night Courier','charger',60,[32,.22,97,12,2,11],'A quick messenger with short, frequent rushes.','Dodge sideways after its brief wind-up.'],
    ['slinger','Bottle Slinger','lobber',45,[50,.24,47,12,2,13],'Lobs a pair of slow bottles along different lanes.','Slip between the bottles.'],
    ['bellringer','Hollow Bell Ringer','zoner',105,[74,.28,43,15,3,14],'Marks the place you were standing for a ringing blast.','Leave the glowing circle before it sounds.'],
    ['lamplighter','Dim Lamplighter','zoner',140,[70,.28,46,14,3,13],'Lights three dangerous pools across the paving.','Move along the clear lane.'],
    ['duelist','Crust Duelist','duelist',85,[66,.29,82,17,3,13],'Sidesteps, then lunges along a locked direction.','Let the lunge commit before you turn.'],
    ['glutton','Pantry Glutton','bruiser',115,[165,.43,37,24,5,20],'Its stomp shakes a wide circle around its feet.','Draw the stomp, then leave its ring.'],
    ['leech','Velvet Leech','leech',95,[36,.23,113,10,2,11],'A fast pursuer that recovers health when it bites.','Keep moving and cut it off before contact.'],
    ['archer','Roofline Archer','sniper',130,[58,.28,41,17,3,12],'Locks a sight line before a fast silver arrow.','Cross the sight line before the shot.'],
    ['mourner','Square Mourner','spreader',155,[82,.29,43,15,3,14],'Spreads four slow tears in a broad fan.','Take the gaps instead of backing straight away.'],
    ['mirror','Mirror Guest','orbiter',175,[80,.28,72,15,3,13],'Circles the fight and fires from changing angles.','Change direction and break its orbit.'],
    ['wisp','Wandering Wisp','wisp',50,[26,.17,79,9,1,11],'A light-footed guest following a winding path.','Watch its body, not only its glow.'],
    ['marshal','Market Marshal','guard',185,[120,.38,46,19,4,17],'Guards nearby guests with a modest protective aura.','Prioritise the marshal to break the group.'],
    ['miller','Moonlit Miller','spinner',195,[85,.31,45,16,3,14],'Throws six spokes of enchanted flour.','Move through the wide gaps between spokes.'],
    ['watchman','Canal Watchman','spearman',210,[105,.34,54,20,4,15],'Marks a short line of paving for its halberd.','Move across the marked line.'],
    ['herald','Midnight Herald','summoner',225,[110,.35,43,16,4,15],'Calls two weaker guests to its banner.','Reach the herald before its next call.']
  ].map(([id,name,role,unlock,stats,description,counterplay],variant)=>[id,{id,name,role,unlock,stats,variant,description,counterplay}]));
  const BOSSES=Object.fromEntries([
    ['landlord','The Last Landlord','rent-ring','A shambling pub landlord who swings heavy keys and stamps out a marked eviction.','Slip through the gap in his brass keys. His raised boot marks a fissure: move sideways out of its path before the paving breaks.'],
    ['bellkeeper','The Bellkeeper','broken-chimes','A stooped bell-ringer drags a heavy handbell, then sends fractured peals through the paving.','Watch him lift the bell. Move through the unbroken gaps in each peal; his high lift announces two tolls.'],
    ['duchess','The Velvet Duchess','velvet-fan','Unfolds a velvet fan into silver needle volleys, then beckons her attendants.','Leave the silver sight lines before her fan snaps. Her raised finger announces attendants.'],
    ['ferryman','The Pale Ferryman','crossing-tides','A white-eyed, drowned fisherman braces his oar and drags black water through the square.','His lifted oar sends three wakes outward. A planted oar draws the tide back. Step between the wet channels before their pale crests arrive.'],
    ['baker','The Crustmaker','ember-cracks','A dough-pale baker hunches over a huge rolling pin, driving its weight into the paving.','Watch the rolling pin lift or lower. Leave the scored paving before ember fronts arrive; the cooled cracks are safe.'],
    ['groundskeeper','The Thorn Warden','shear-cuts','An emaciated groundskeeper braces heavy pruning shears, cutting paths through stone for thorn growth.','The open shears reveal the cuts. Step into the uncut gaps before thorns rise along the scored paving.'],
    ['clockmaker','The Hourless Clockmaker','pendulum-return','A crooked watchmaker winds a heavy chained pendulum; its weight drags his body through each strike.','Watch the chain tighten, then leave the pendulum path. Its return follows the same scars; keep that route clear until it passes.'],
    ['mirrorlord','The Glass Regent','shattered-court','A vain decaying aristocrat braces a cracked hand mirror, driving buried glass up through broken paving.','Cracked patches announce the order of the eruptions. Cross between them after the first shatters; leave the next intact patch before it rises.'],
    ['huntsman','The Pale Huntsman','committed-shot','A young decaying hunter stalks with a fixed smile, shouldering a long rifle for one committed shot.','Wait for his aim to settle, then cross the shot line. His heavy recoil and deliberate reload leave a long opening.'],
    ['nightmayor','The Mayor of Midnight','double-decree','A hollow-eyed, waxen mayor lifts a ceremonial mace with blackened hands, issuing two crushing decrees through a crooked jaw.','Leave the branching fractures before the first strike. Watch the mace lift again and find an unbroken gap before the second impact.']
  ].map(([id,name,pattern,description,counterplay],index)=>[id,{id,name,pattern,description,counterplay,variant:20+index}]));
  const EVENTS={
    lanternfall:{id:'lanternfall',name:'Lantern Rain',duration:13,description:'Falling lanterns mark the square in quick succession.',counterplay:'Keep moving out of the lit circles. A clearing star follows.'},
    marketstampede:{id:'marketstampede',name:'Midnight Delivery',duration:12,description:'Couriers and rushers arrive in timed flanking groups.',counterplay:'Cut across the rush. A collection star rewards the escape.'},
    witchingcircle:{id:'witchingcircle',name:'The Witching Circle',duration:14,description:'Rings of delayed hexes bloom around your path.',counterplay:'Find the clear spaces. A chest waits after the ritual.'},
    breach:{id:'breach',name:'The Shutters Break',duration:12,description:'Guests spill through both sides of the square.',counterplay:'Break one flank before the other closes. Collect the clearing star.'},
    lastorders:{id:'lastorders',name:'Last Orders',duration:14,description:'Imposing guests come to claim the square.',counterplay:'Keep the guests in view. Survival earns a collection star.'},
    treasurehunt:{id:'treasurehunt',name:'The Lost Night Purse',duration:16,description:'A chest appears with a small watch around it.',counterplay:'Take the risk to claim the chest, or leave it for later.'}
  };
  const WEAPONS=[
    {id:'espresso',name:'Midnight Espresso',short:'Espresso',colour:'#f0ba75',tag:'PIERCE THE CROWD',description:'Aim quick espresso shots, then unleash a piercing fan. Dash into a hot-shot follow-up.',evolution:'Triple-shot roast'},
    {id:'baguette',name:'Baguette Ronin',short:'Baguette',colour:'#f3c77d',tag:'THREE CUTS. NO CRUMBS.',description:'Cut, cross, then spin through the crowd. Dash + attack commits to a moving spin. Cut incoming shots with your blade.',evolution:'Thousand-Crust Blade'}
  ];
  const PASSIVES={power:{name:'Extra shot',description:'All weapons deal 22% more damage.',max:4},haste:{name:'Quick service',description:'Attack recovery rate +12% per rank. Does not affect special or dash recharge.',max:3},health:{name:'Hearty supper',description:'+25 maximum health. Recover 20 health.',max:3},magnet:{name:'Pocketful of stars',description:'Collect experience from 35 steps farther away.',max:3},speed:{name:'Walking shoes',description:'Walking speed +10% per rank. Each dash charge refills 0.15 seconds sooner per rank.',max:3},regen:{name:'Second wind',description:'Recover 0.22 health each second.',max:2}};
  const EVOLUTIONS={espresso:{passive:'power',name:'Dawn Roast',description:'Piercing espresso bursts into scalding sunrise blasts.'},baguette:{passive:'speed',name:'Thousand-Crust Blade',description:'Golden cuts strengthen your close-range combos and spinning finishers.'}};
  const TECHNIQUES={surge:{name:'Overdrive',description:'A landed finisher makes your next main attack 30% stronger.'},echo:{name:'Aftercut',description:'Land a finisher to leave a half-strength circular cut at the point of impact.'},volley:{name:'Roast & Riposte',description:'A landed finisher sends three piercing coffee bolts along your aim.'},quickdraw:{name:'Quickdraw',description:'A landed finisher recovers 0.45 seconds of dash recharge, at most once per second.'}};
  const ARTS={relentless:{name:'Relentless',description:'Landed finishers grant 1.5 seconds of Flow: 18% stronger attacks.'},crosscut:{name:'Open a seam',description:'Dash strikes expose enemies for 2 seconds. Every weapon deals 30% more damage to exposed enemies.'},undertow:{name:'Gathering storm',description:'Finishers draw nearby guests into the strike. Your next cut deals 30% more damage.'},secondserve:{name:'Encore',description:'Land a finisher to trigger an extra attack from supporting weapons. Recovers in 1.5 seconds.'}};
  const LOADOUT_RULES={supportMaxRank:3,supportDamage:.36,mainDamage:{espresso:2.7,garlic:4.2,tray:2.1,baguette:4.2},soloBonus:1.2};
  const PROGRESSION={techniqueLevel:4,artLevel:8,earlyGap:20,lateGap:28,endlessGap:50};
  const STYLES={
    slipstream:{name:'Slipstream',tag:'DASH ECHOES',icon:'baguette',description:'Your dash leaves two delayed cuts in its wake.',detail:'Turn an escape into a trap for the pursuing crowd.'},
    crescent:{name:'Crust Comet',tag:'BAGUETTE FINISHER',weapon:'baguette',main:true,icon:'baguette',description:'Your spinning finisher launches a piercing crescent.',detail:'Carry the final cut through enemies beyond your blade.'},
    roast:{name:'Slow Roast',tag:'ESPRESSO SYNERGY',weapon:'espresso',icon:'espresso',description:'Coffee bolts scorch their targets for another 40% damage.',detail:'Burns refresh instead of stacking. Keep pressure on tough guests.'},
    measure:{name:'Perfect Measure',tag:'TIMING REWARD',icon:'espresso',description:'Cleanly timed attacks gain 55% damage instead of 18%.',detail:'Tap near recovery. Each press commits one attack.'},
    lastlight:{name:'Last Light',tag:'ONCE PER RUN',icon:'heal',description:'Below 25% health, recover 30 health and clear nearby shots.',detail:'One rescue for the whole run. Does not revive a lethal hit.'}
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function random(seed){let s=seed>>>0||1977;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
  const formatTime=t=>`${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}`;
  function create({seed=Date.now(),weapon='espresso',difficulty='normal',mode='endless',loadout='solo',powerups={},practice=null}={}){
    const practiceSpec=practice&&((practice.id===Finale.SPEC.id?Finale.SPEC:Majors.BOSSES[practice.id]||BOSSES[practice.id]));practice=practiceSpec?{id:practice.id,major:practice.id===Finale.SPEC.id||!!Majors.BOSSES[practice.id],phase:clamp(Math.floor(Number(practice.phase)||1),1,practice.id==='oracle'?4:3),ability:Builds.ABILITIES[practice.ability]?practice.ability:'steam'}:null;
    mode=practice?'practice':mode==='mora'||mode==='night'?'mora':'endless';const longRun=!practice;loadout='solo';if(practice)powerups={};
    const rng=random(seed),hard=difficulty==='hard'; let nextId=1,spawnClock=0,espressoClock=0,trayClock=0,baguetteClock=0,baguetteStep=0,nextElite=48,nextBoss=300,nextWave=24,nextArenaEvent=52,supplyClock=0,pressureClock=0,pendingWave=null,inputDashHeld=false;
    let bossDeck=[],eventDeck=[],lastBossType='landlord',squareAwake=false,endlessDeck=[],lastChapter=0,lastEndlessPhase='',reliefUntil=0,lastDodgeHeal=-99;
    let dashBufferedUntil=0,dashAge=0,dashPerfect=false,dashTravel=0,attackBufferedUntil=0,inputAttackHeld=false,lastAttackPress=-99,lastManualPress=-99,trailClock=0,techniqueClock=0,artClock=0;
    const echoes=[];let majorDeck=[],worldClock=8,flowKey='',flow=null;
    if(longRun)nextBoss=210;
    const events=[],enemies=[],shots=[],hazards=[],gems=[],drops=[],effects=[],zones=[];
    const rank=key=>clamp(Math.floor(Number(powerups[key])||0),0,3),maxHp=100+rank('health')*10;
    const p={x:768,y:535,hp:maxHp,maxHp,r:13,invulnerable:0,dash:0,dashCooldown:0,dx:0,dy:1,view:'front',moving:false,moveSpeed:MOVE_SPEED,dashCharges:2,dashLock:0,attack:null,gait:0,land:0,hurtTime:0};
    const state={seed,hard,mode,cycle:1,bossKills:0,waveName:'The square stirs',arenaEvent:null,time:0,status:'playing',player:p,enemies,shots,hazards,gems,drops,effects,events,kills:0,level:1,xp:0,nextXp:9,score:0,combo:0,comboTime:0,bestCombo:0,damage:0,bossSpawned:false,bossDead:false,boss:null,choices:[],weapons:{espresso:0,garlic:0,tray:0,baguette:0},passives:{power:0,haste:0,health:0,magnet:0,speed:0,regen:0},dashCount:0,dashChain:0,dashWindow:0,collected:0,technique:null,flowTime:0,perfectDodges:0};
    // Simulation time keeps combat responsive; run time stops for major encounters only.
    state.bossTime=0;
    Object.defineProperty(state,'runTime',{enumerable:true,get:()=>Math.max(0,Math.round((state.time-state.bossTime)*1e9)/1e9)});
    state.practice=practice;state.circuitTotal=Object.keys(Majors.BOSSES).length;state.circuitCleared=[];state.finalePending=false;state.finaleKills=0;state.finaleEnding=0;state.world=World.at(0);state.transition=null;state.majorKills=0;state.nextMajor=300;state.relics={};state.endlessTalents={};state.training={edge:0,vigor:0,tempo:0};state.mastery={focus:0,focusUntil:0,ward:0,wardUntil:0,fleetUntil:0,dashUntil:0};state.offerCounts={};state.recentOffers=[];state.transformationOffers={windows:[],active:null};state.parryReady=false;state.endless=null;
    state.loadout=loadout;state.weaponLimit=loadout==='solo'?1:2;state.lastAttackAt=-99;
    state.mainWeapon=WEAPONS.some(w=>w.id===weapon)?weapon:'espresso';state.weapons[state.mainWeapon]=1;
    Object.assign(state,{aimAngle:Math.PI/2,attackCount:0,attackStep:0,attackWindow:0,attackWindowMax:.85,dashFollow:0,finishers:0,dashStrikes:0,cleanHits:0,momentum:0,momentumTime:0,combatArt:null,nextCut:false,styles:{},lastLightUsed:false,nextUpgradeAt:0,choiceCount:0,upgradesTaken:0,lastUpgradeAt:null,lastOffers:[]});
    state.evolutions={espresso:false,garlic:false,tray:false,baguette:false};state.pendingEvolution=null;state.zones=zones;
    const heal=amount=>Recovery.heal(state,amount);
    const build=Builds.create({state,hit,fx,event,heal,Hitboxes,power:()=>power(),World});
    const relic=Relics.create({state,hit,fx,event,Hitboxes,hurt,heal,power:()=>power(),healingScale:()=>Recovery.scale(state.boss),specialCooldown:()=>Builds.ABILITIES[state.build.ability].cooldown*(state.build.keystone==='duellist'?1.25:1),debtDamage(amount){if(state.status!=='playing'||p.hp<=0)return;p.hp=Math.max(0,p.hp-amount);event('hurt',{amount,source:'nutmeg'});if(p.hp<=0)finish(false);}});
    function event(type,data={}){if(type==='specialCast')relic.cast();if(events.length<80)events.push({type,...data});}
    const power=()=>(1+state.passives.power*.22+rank('power')*.05)*(state.flowTime>0?1.18:1);
    const cooldown=()=>1/(1+state.passives.haste*.12+.3*state.training.tempo/(state.training.tempo+20));
    const dashCapacity=()=>2+(state.endlessTalents.reserve||0);
    function respite(seconds){reliefUntil=Math.max(reliefUntil,state.runTime+seconds);for(const e of enemies)if(e.type!=='boss'){if(e.hp>0)fx('burst',e.x,e.y-20,'#e6d398',.7);e.hp=0;}hazards.length=0;zones.length=0;pendingWave=null;state.arenaEvent=null;nextArenaEvent=reliefUntil+25;heal(p.maxHp*.18);for(const g of gems)g.attracted=true;fx('ring',p.x,p.y-18,'#ffe6a8',5);}
    function updateEndless(){if(!longRun)return;const d=Endless.director(state.runTime),boss=state.boss?.hp>0;
      if(d.chapter!==lastChapter){lastChapter=d.chapter;if(!endlessDeck.length)endlessDeck=shuffled(Object.keys(Endless.ENCOUNTERS));let id=endlessDeck.shift();if(id===state.endless?.encounter){endlessDeck.push(id);id=endlessDeck.shift();}state.endless={...d,encounter:id};if(d.chapter>1&&!boss)respite(Endless.CHAPTER_REST);event('chapter',{chapter:d.chapter,name:Endless.ENCOUNTERS[id].name,hint:Endless.ENCOUNTERS[id].hint});}
      if(boss){d.phase='boss';d.cap=state.boss.major?0:24;d.rangedCap=3;d.rate=.9;d.count=1;}else if(state.runTime<reliefUntil){d.phase='respite';d.cap=0;}
      d.preBoss=!boss&&d.phase!=='respite'&&state.nextMajor-state.runTime>0&&state.nextMajor-state.runTime<=65;if(d.preBoss){d.rate/=1.12;d.cap=Math.min(140,d.cap+8);}
      d.restRemaining=d.phase==='respite'?Math.max(0,reliefUntil-state.runTime,Endless.CHAPTER_REST-d.age):0;
      if(lastEndlessPhase==='respite'&&d.phase!=='respite')spawnClock=0;
      Object.assign(state.endless,d);p.maxDashCharges=dashCapacity();
      if(d.phase!==lastEndlessPhase){lastEndlessPhase=d.phase;event('endlessPhase',{phase:d.phase,chapter:d.chapter,name:Endless.ENCOUNTERS[state.endless.encounter].name});}
    }
    function fx(type,x,y,colour,size=1,detail={}){if(effects.length<LIMITS.effects)effects.push({type,x,y,colour,size,age:0,life:type==='ring'?.65:.4,view:p.view,step:state.dashChain,...detail});}
    function addDrop(drop){if(drops.length<LIMITS.drops)drops.push({...drop,...World.nearest(state.world,drop.x,drop.y,14)});}
    function recoverySpot(b,drop){
      if(!b?.finale?.broken)return World.nearest(state.world,drop.x,drop.y,14);
      if(Finale.floorAt(b,drop))return drop;
      const tile=Finale.floorAt(b,p)||b.finale.platforms.filter(q=>Finale.solid(q,b.finale)).sort((a,c)=>distance(Finale.centre(a),p)-distance(Finale.centre(c),p))[0];
      return tile?Finale.centre(tile):{...b.finale.lastSafe};
    }
    function earnRecovery(b,key){
      if(p.hp<=0||drops.length>=LIMITS.drops)return;
      const amount=Recovery.earn(b,key);if(!amount)return;
      const spot=recoverySpot(b,{x:p.x+38,y:p.y});
      drops.push({type:'recovery',...spot,age:0,amount,owner:b.id});event('recoveryEarned',{x:spot.x,y:spot.y,amount});
    }
    function addHazard(hazard){if(hazards.length<LIMITS.hazards)hazards.push(hazard);}
    function addZone(zone){if(zones.length<LIMITS.zones){if(Number.isInteger(zone.oracleHand)||NewDemis[zone.source]&&zone[zone.source+'Wave'])zone.createdAt=state.time;zones.push(zone);}}
    function shuffled(ids){const list=[...ids];for(let i=list.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[list[i],list[j]]=[list[j],list[i]];}return list;}
    function bossType(){if(!state.bossSpawned)return 'landlord';if(!bossDeck.length){bossDeck=shuffled(Object.keys(BOSSES).filter(id=>state.bossKills<10?id!=='landlord':true));if(bossDeck[0]===lastBossType)bossDeck.push(bossDeck.shift());}return bossDeck.shift();}
    function spawn(type,at,options={}){
      if(longRun&&state.endless&&type!=='boss'&&type!=='elite'){const alive=enemies.filter(e=>e.hp>0),roles=['caster','zoner','sniper','lobber','spreader','spinner','summoner','orbiter'];if(!options.majorSummon&&alive.length>=state.endless.cap)return null;if(!options.majorSummon&&roles.includes(ENEMY_TYPES[type]?.role)&&alive.filter(e=>roles.includes(e.role)).length>=state.endless.rangedCap)type='villager';}
      if(enemies.length>=LIMITS.enemies-4&&type!=='boss'&&type!=='elite')return null;
      if(enemies.length>=LIMITS.enemies){if(type!=='boss')return null;const disposable=enemies.findIndex(e=>e.type!=='boss'&&e.type!=='elite');if(disposable<0)return null;enemies.splice(disposable,1);}
      let x,y;
      if(at){x=at.x;y=at.y;if(!options.precise&&Math.hypot(x-p.x,y-p.y)<140){const angle=Math.atan2(y-p.y,x-p.x);x=clamp(p.x+Math.cos(angle)*155,ARENA.left,ARENA.right);y=clamp(p.y+Math.sin(angle)*155,ARENA.top,ARENA.bottom);if(Math.hypot(x-p.x,y-p.y)<140){x=p.x<768?ARENA.right:ARENA.left;y=clamp(p.y,ARENA.top,ARENA.bottom);}}}else{
        // Arrive through the edges, never materialise on top of the player.
        for(let n=0;n<20;n++){
          const side=Math.floor(rng()*4),a=ARENA;
          x=side===0?a.left:side===1?a.right:a.left+rng()*(a.right-a.left);
          y=side===2?a.top:side===3?a.bottom:a.top+rng()*(a.bottom-a.top);
          if(Math.hypot(x-p.x,y-p.y)>300)break;
        }
        if(Math.hypot(x-p.x,y-p.y)<240){x=p.x<768?ARENA.right:ARENA.left;y=clamp(p.y,ARENA.top,ARENA.bottom);}
      }
      const t=state.runTime,spec=ENEMY_TYPES[type],bossId=type==='boss'?(options.bossType||bossType()):null,bossSpec=bossId===Finale.SPEC.id?Finale.SPEC:options.major?Majors.BOSSES[bossId]:BOSSES[bossId];
      const raw=spec?.stats|| (type==='elite'?[380,1.35,56,24,18,24]:[102000+state.bossKills*(longRun?15000:18000),0,48,29,80,30]);
      const chapter=Math.floor(t/Endless.CHAPTER),longNight=1+chapter*.055+Math.max(0,t-1800)/1800;
      const hp=options.major?(540000+state.majorKills*67500)*(1+Math.max(0,t-300)/6000)*(hard?1.25:1):longRun?(raw[0]+Math.min(t,240)*raw[1])*(hard?1.3:1)*longNight*(type==='boss'?1.08:1+Math.min(t,300)/950):(raw[0]+Math.min(t,480)*raw[1])*(hard?1.3:1)*(type==='boss'?1.15:1+Math.min(t,360)/420);
      // Demibosses use 70% of the previous 1.89 budget in both runs and practice.
      // Major/finale budgets and ordinary enemies remain independent.
      const scaledHp=hp*(options.major?0.578:type==='boss'?0.787185:1)*(!options.major&&type!=='boss'&&!options.majorSummon&&t>=60?1.1:1);
      const e={id:nextId++,type,role:spec?.role||type,x,y,hp:scaledHp,maxHp:scaledHp,speed:raw[2]*(hard?1.1:1)*(longRun?Math.min(1.18,1+Math.max(0,t-360)/9000):1),damage:raw[3]*(longRun?1+Math.max(0,t-900)/9000:1),xp:options.summoned?0:raw[4],r:raw[5],age:0,hit:0,garlicHit:0,attack:spec&&['zoner','sniper','spreader','lobber','spinner'].includes(spec.role)?1.4+rng():1.8+rng()*2,telegraph:0,charge:0,aimX:0,aimY:0,variant:spec?.variant??(bossId?bossSpec.variant:3),view:'front',phase:1,attackNumber:0,summoned:!!options.summoned};
      if(bossId){e.bossType=bossId;e.bossName=bossSpec.name;e.attack=1.6;if(!options.major)lastBossType=bossId;else{Majors.begin(e);e.r=34;e.speed=145;e.damage=38;}}
      // Carry the same run-time, difficulty and circuit scaling as the twelve majors.
      if(bossId===Finale.SPEC.id)Finale.begin(e,state.finaleKills,practice?.phase||1,practice?1:hp/540000);
      Object.assign(e,World.nearest(state.world,e.x,e.y,e.r));enemies.push(e);if(type==='boss'){Recovery.begin(e,p.maxHp);state.boss=e;state.bossSpawned=true;state.bossDead=false;event('boss',{id:bossId,name:e.bossName});}
      return e;
    }
    function closest(x,y,exclude=new Set(),range=10000){let found=null,best=range*range;for(const e of enemies){if(e.hp<=0||e.sealed||exclude.has(e.id))continue;const pt=Hitboxes.custom(e)?Hitboxes.aim(e,{x,y:y-18}):e,d=(pt.x-x)**2+(pt.y-y)**2;if(d<best){found=e;best=d;}}return found;}
    function gem(x,y,value){
      if(gems.length>=LIMITS.gems){let nearest=gems[0];for(const g of gems)if(distance(g,{x,y})<distance(nearest,{x,y}))nearest=g;nearest.value+=value;return;}
      gems.push({x,y,value,phase:rng()*TAU});
    }
    function hit(e,amount,kx=0,ky=0,impact={}){
      if(e.hp<=0||e.type==='sigil'&&e.sealed||e.major&&['intro','phase'].includes(e.majorState)||state.transition)return;if(p.admiralRide&&e===state.boss&&!impact.admiralRide)return;const critical=!impact.relic&&!impact.admiralRide&&rng()<.08,execution=e.hp/e.maxHp<.3?1+(state.endlessTalents.execution||0)*.1:1,pressure=impact.active&&impact.weapon==='espresso'&&distance(e,p)<160?1+(state.endlessTalents.pressure||0)*.12:1,damage=amount*relic.damage(e,impact)*(impact.active&&e.buildMarkUntil>state.time?1.15:1)*execution*pressure*(critical?1.75:1)*(e.shielded?.82:1)*(e.exposed>0?1.3:1);const dealt=e.finalBoss?Finale.damage(e,damage,p,impact):e.major?Majors.damage(e,damage):e.finaleJoint?damage*(e.armour??.3):damage;if(dealt<=0)return;build.record(e,Math.min(e.hp,dealt),impact);e.hp-=dealt;event('achievementDamage',{enemy:e,impact,dealt});e.hit=.12;e.hitAngle=impact.angle;e.hitHeavy=Boolean(impact.heavy);e.hitWeapon=impact.weapon;e.hitCritical=critical;state.damage+=dealt;
      if(e.bossType==='magistrate')Majors.Magistrate.Fight.hit(e,p,impact);
      if(e.major&&!e.finalBoss&&!e.inkFight)Majors.counterHit(e,p,impact,majorApi);
      // Confirmation is separate from damage numbers and camera shake. Rate-limit
      // multi-pellet/continuous hits so the boss never becomes a flashing beacon.
      if(e.bossType==='oracle'){const target=Hitboxes.aim(e,impact.from||{x:p.x,y:p.y-18});e.oracleImpact={part:target.part,at:e.age,heavy:!!impact.heavy};}
      if(e.type==='boss'&&(e.hitConfirmNext??-1)<=e.age){e.hitConfirmNext=e.age+.16;e.hitConfirmUntil=e.age+.09;const pt=Hitboxes.custom(e)?Hitboxes.impact(e,impact.from||{x:p.x,y:p.y-18}):{x:e.x,y:e.y-42};event('bossHit',{...pt,angle:impact.angle||0,heavy:false});}
      if(!e.major&&!e.railCarriageMinion&&e.type!=='sigil')Object.assign(e,World.move(state.world,e,e.x+kx,e.y+ky));
      if(rng()<.32||critical)event('hit',{x:e.x,y:e.y-42,damage:Math.round(dealt),critical,weapon:impact.weapon,heavy:Boolean(impact.heavy),angle:impact.angle});
      if(e.hp>0)return;
      if(e.type==='sigil'){if(e.crownKnight||e.finaleJoint){fx('burst',e.x,e.y-20,'#d7ad6c',e.crownKnight?.55:1.3);return;}if(['oracle','admiral'].includes(e.bossType))event(e.bossType==='oracle'?'oracleShellBreak':'admiralAnchorBreak',{foe:{id:e.id,type:'sigil',bossType:e.bossType,x:e.x,y:e.y,r:e.r,hp:0,maxHp:e.maxHp,age:e.age,phase:e.phase,label:e.label}});fx('burst',e.x,e.y-20,'#c8f0d5',2);if(!e.briarPart)event('ritualBreak',{id:e.bossType});return;}
      relic.earn(e);state.kills++;state.combo++;state.comboTime=2.5;state.bestCombo=Math.max(state.bestCombo,state.combo);state.score+=Math.round(e.xp*10*(1+Math.min(state.combo,50)*.01));
      gem(e.x,e.y,e.xp);fx('burst',e.x,e.y-25,e.type==='boss'?'#f4ce7c':'#bdb4dc',e.type==='boss'?3:1);
      event('banished',{foe:{type:e.type,role:e.role,railCarriageMinion:e.railCarriageMinion,gait:e.gait,bossType:e.bossType,major:e.major,finalBoss:e.finalBoss,summoned:!!e.summoned,x:e.x,y:e.y,view:e.view,age:e.age,hp:0,maxHp:e.maxHp,hit:0,phase:e.phase,...(NewDemis[e.bossType]?{[e.bossType+'Rig']:NewDemis[e.bossType].snapshot(e),[e.bossType+'Release']:e[e.bossType+'Release']}:{}),...(e.bossType==='ferryman'?{ferrymanRig:Ferryman.snapshot(e),ferrymanRelease:e.ferrymanRelease}:{}),...(e.bossType==='bellkeeper'?{bellkeeperRig:Bellkeeper.snapshot(e),bellkeeperRelease:e.bellkeeperRelease}:{}),...(e.bossType==='landlord'?{landlordRig:Landlord.snapshot(e),landlordRelease:e.landlordRelease}:{}),...(e.bossType==='duchess'?{duchessRig:Duchess.snapshot(e),duchessRelease:e.duchessRelease}:{}),...(e.bossType==='kiln'?{kilnRig:e.kilnRig?{...e.kilnRig,feet:e.kilnRig.feet.map(f=>({...f})),hands:e.kilnRig.hands?.map(f=>({...f})),channels:{...e.kilnRig.channels},landings:[]}:null}:{} ),...(e.bossType==='admiral'?{admiralRig:Majors.Admiral.snapshot(e)}:{}),...(e.bossType==='briar'?{briarRig:Majors.Briar.snapshot(e)}:{}),...(e.bossType==='prism'?{prismRig:Majors.Prism.snapshot(e)}:{}),...(e.bossType==='clock'?{clockRig:Majors.Clock.snapshot(e)}:{}),...(e.bossType==='star'?{starRig:Majors.Star.snapshot(e)}:{}),...(e.bossType==='cantor'?{cantorRig:Majors.Cantor.snapshot(e)}:{}),...(e.bossType==='duelist'?{duelistRig:Majors.Duelist.snapshot(e)}:{}),...(e.bossType==='beekeeper'?{beekeeperRig:Majors.Beekeeper.snapshot(e),beeFight:e.beeFight?{...e.beeFight}:null}:{}),...(e.bossType==='magistrate'?{magistrateRig:Majors.Magistrate.snapshot(e)}:{}),...(e.bossType==='railmaster'?{railmasterRig:Majors.Railmaster.snapshot(e),railFight:e.railFight?{...e.railFight}:null}:{}),...(e.bossType==='oracle'?{oracleRig:Majors.Oracle.snapshot(e)}:{})}});
      if(e.major){majorDefeated(e);return;}
      if(e.type==='boss'){if(practice){state.bossDead=true;state.bossKills++;event('bossDown',{name:e.bossName});finish(true);return;}state.bossDead=true;state.bossKills++;event('bossDown');heal(12);if(longRun){addDrop({type:'chest',x:e.x,y:e.y,age:0});respite(Endless.BOSS_REST);nextBoss=state.runTime+150;}}
      else if(e.type==='elite'){addDrop({type:'chest',x:e.x,y:e.y,age:0});event('eliteDown');}
      else if(!e.summoned&&rng()<.007)addDrop({type:'heal',x:e.x,y:e.y,age:0});
    }
    const dashSafe=()=>p.dash>0&&(!p.attack?.whirl||p.attack.age<.055);
    function hurt(amount,source='contact',attacker=null){if(p.starLeap&&source!=='starFall')return false;if(p.finaleLeap&&source==='uncrownedWave')return false;if(p.invulnerable>0||state.transition||dashSafe()||state.status!=='playing')return false;state.achievementAttacker=attacker||enemies.find(e=>e.hp>0&&e.bossType===source)||null;amount=build.defend(relic.incoming(amount));if(amount<=0){p.invulnerable=.12;return false;}amount=relic.defend(amount);if(amount<=0){p.invulnerable=.12;return false;}p.hp=Math.max(0,p.hp-amount);build.wounded();if(state.boss?.finale)state.boss.finale.clean=false;p.invulnerable=.62;p.hurtTime=.22;if(amount>0&&['uncrowned','uncrownedWave'].includes(source))Finale.Colossus.recoverHit(state.boss,p);state.momentum=0;state.momentumTime=0;event('hurt',{amount,source});Majors.Magistrate.Fight.wound(state.boss,p);fx('ring',p.x,p.y-20,'#e77685');if(p.hp<=0)finish(false);else if(state.styles.lastlight&&!state.lastLightUsed&&p.hp<p.maxHp*.25){state.lastLightUsed=true;heal(30);p.invulnerable=.9;for(const h of hazards)if(Math.hypot(h.x-p.x,h.y-p.y+18)<180)h.life=0;fx('ring',p.x,p.y-18,'#f8e2a8',1.4);event('styleProc',{id:'lastlight'});}return true;}
    function finish(win){if(['won','lost','retired'].includes(state.status))return false;dashBufferedUntil=0;attackBufferedUntil=0;lastAttackPress=lastManualPress=-99;inputAttackHeld=false;inputDashHeld=false;state.status=win?'won':'lost';state.score+=Math.floor(state.runTime)*2+(win?3000:0);event(win?'won':'lost');return true;}
    function retire(){if(['won','lost','retired'].includes(state.status))return false;dashBufferedUntil=0;attackBufferedUntil=0;lastAttackPress=lastManualPress=-99;inputAttackHeld=false;inputDashHeld=false;state.status='retired';state.score+=Math.floor(state.runTime)*2;event('retired');return true;}
    function spawnShot(type,angle,level,{damageScale=1,technique,attack=null}={}){
      if(shots.length>=LIMITS.shots)return;
      const speed=type==='espresso'?490:325;
      shots.push({id:nextId++,type,x:p.x,y:p.y-18,px:p.x,py:p.y-18,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:type==='espresso'?7:17,life:type==='espresso'?1.8:3.8,age:0,damage:(type==='espresso'?21+level*6:33+level*8)*power()*damageScale,pierce:type==='espresso'?1+Math.floor(level/2):2+level,bounces:2+level,hit:new Set(),spin:rng()*TAU,technique,attack});if(type==='espresso'&&attack&&build.rank('singleorigin')){const shot=shots[shots.length-1];shot.vx*=1.3;shot.vy*=1.3;shot.pierce+=4;shot.r=9;shot.compressed=true;}
    }
    function orbitals(){
      const lv=state.weapons.garlic;if(!lv)return [];const count=lv+2+(state.evolutions.garlic?2:0),radius=53+lv*7+(state.evolutions.garlic?20:0);
      return Array.from({length:count},(_,i)=>{const a=state.time*(2.7+lv*.1)+i*TAU/count;return {x:p.x+Math.cos(a)*radius,y:p.y-18+Math.sin(a)*radius*.78,r:17+lv};});
    }
    const upgradeGap=()=>state.runTime<180?(state.level<4?20:28):state.runTime<600?42:50;
    function choices(reroll=false,keep=null){
      const owned=[],missing=[],passives=[],changes=Builds.cards(state).filter(c=>!weaponTransformation(c)),ownedCount=Object.values(state.weapons).filter(Boolean).length;
      for(const w of WEAPONS){const from=state.weapons[w.id],main=w.id===state.mainWeapon,max=main?5:LOADOUT_RULES.supportMaxRank,to=from+1;if(from>=max||!from&&ownedCount>=state.weaponLimit)continue;const card={id:w.id,kind:'weapon',name:w.name,from,level:to,icon:w.id,tag:from?(main?'MAIN WEAPON':'AUTOMATIC SUPPORT'):'NEW SUPPORT',description:from?main?weaponUpgrade(w.id,to):'Strengthen your supporting attacks. Maximum rank III.':supportDescription(w.id),detail:from?'Rank '+from+' → '+to:'Uses your one support slot. Only the main weapon evolves.'};(from?owned:missing).push(card);}
      for(const [id,spec]of Object.entries(PASSIVES)){const from=state.passives[id];if(from<spec.max)passives.push({id,kind:'passive',name:spec.name,from,level:from+1,tag:'FOUNDATION',description:passiveDescription(id,1),detail:'Rank '+from+' → '+(from+1)});}
      const taken=[],add=c=>{if(c&&!taken.some(t=>t.id===c.id)&&taken.length<3)taken.push(c);},fresh=list=>{const unseen=list.filter(c=>!state.recentOffers.includes(c.id)),pool=unseen.length?unseen:list;if(!pool.length)return [];const least=Math.min(...pool.map(c=>state.offerCounts[c.kind+':'+c.id]||0));return pool.filter(c=>(state.offerCounts[c.kind+':'+c.id]||0)===least);};
      // One scheduled transformation offer while 0–1, 2–3 and 4–5 slots are occupied.
      // Choosing something else or resting spends the offer; rerolls preserve this draft's category.
      const schedule=state.transformationOffers,slots=Object.keys(state.build.perks).length,window=Math.floor(slots/2);
      const due=slots<Builds.SLOTS&&(reroll&&schedule.active===window||!schedule.windows.includes(window));
      if(!reroll)schedule.active=null;
      add(keep);
      const rare=fresh(changes.filter(c=>c.kind==='perk'&&!c.from&&c.rarity==='rare'));
      if(due&&rare.length){
        if(keep?.rarity!=='rare'){
          const weights=rare.map(c=>1+.35*Builds.transformationAffinity(state,c));let pick=rng()*weights.reduce((a,b)=>a+b,0),chosen=rare.at(-1);
          for(let i=0;i<rare.length;i++){pick-=weights[i];if(pick<0){chosen=rare[i];break;}}add(chosen);
        }
        schedule.active=window;if(!schedule.windows.includes(window))schedule.windows.push(window);
      }else add(shuffled(fresh(changes.filter(c=>!c.from&&c.id!==keep?.id)))[0]);
      // Preserve a main-weapon investment alongside the interaction and wildcard.
      add(owned.find(c=>c.id===state.mainWeapon)||shuffled(fresh(changes.filter(c=>c.from)||[]))[0]);
      if(p.hp<p.maxHp*.4)add(passives.find(c=>c.id==='health'));
      for(const c of shuffled([...changes,...owned,...missing,...passives]).sort((a,b)=>(state.recentOffers.includes(a.id)-state.recentOffers.includes(b.id))||((state.offerCounts[a.kind+':'+a.id]||0)-(state.offerCounts[b.kind+':'+b.id]||0))))add(c);
      // A complete build keeps its six slots. Rotate capped growth and non-stacking provisions.
      for(const c of shuffled(Builds.trainingCards(state)).sort((a,b)=>(state.recentOffers.includes(a.id)-state.recentOffers.includes(b.id))||((state.offerCounts[a.kind+':'+a.id]||0)-(state.offerCounts[b.kind+':'+b.id]||0))))add(c);
      state.lastOffers=taken.map(c=>c.id);state.recentOffers=[...state.recentOffers,...state.lastOffers].slice(-9);for(const c of taken)state.offerCounts[c.kind+':'+c.id]=(state.offerCounts[c.kind+':'+c.id]||0)+1;return taken;
    }
    function applyChoice(c){
      const id=c.id;
      if(Builds.apply(state,c)){if(c.key==='reserve'){p.maxDashCharges=dashCapacity();p.dashCharges=Math.min(dashCapacity(),p.dashCharges+1);}return;}
      if(c.kind==='weapon'){const main=id===state.mainWeapon;if(!state.weapons[id]&&Object.values(state.weapons).filter(Boolean).length>=state.weaponLimit)return;state.weapons[id]=Math.min(main?5:LOADOUT_RULES.supportMaxRank,c.level);}
      else if(c.kind==='passive'){const ranks=c.level-state.passives[id];state.passives[id]=c.level;if(id==='health'){p.maxHp+=25*ranks;heal(20*ranks);}}
      else if(c.kind==='talent'){state.endlessTalents[id]=c.level;if(id==='reserve'){p.maxDashCharges=dashCapacity();p.dashCharges=Math.min(dashCapacity(),p.dashCharges+1);}}
      else if(c.kind==='training'){const spec=Builds.TRAINING[id];if(!spec)return;const before=state.training[id]||0;state.training[id]=Math.min(spec.max||Infinity,c.level);const gained=state.training[id]-before;if(gained<=0)return;
       if(id==='vigor'){p.maxHp+=5*gained;heal(12);}if(id==='soup')heal(24);
       if(id==='charge'){if(p.dashCharges<dashCapacity()){p.dashCharges++;if(p.dashCharges>=dashCapacity())p.dashCooldown=0;}else heal(12);}
       if(id==='infusion'){if(state.build.cooldown>0)state.build.cooldown=Math.max(0,state.build.cooldown-4);else heal(12);}
       if(id==='shell'){state.mastery.ward=12;state.mastery.wardUntil=state.time+60;}
       if(id==='harvest'){for(const g of gems)g.attracted=true;heal(8);}
       if(id==='focus'){state.mastery.focus=4;state.mastery.focusUntil=state.time+60;}
       if(id==='fleetmeal')state.mastery.fleetUntil=state.time+60;
       if(id==='dashmeal')state.mastery.dashUntil=state.time+60;
      }
      else if(c.kind==='style')state.styles[id]=true;
      else if(c.kind==='art'){state.combatArt=id;event('artChosen',{id});}
      else if(c.kind==='technique'){state.technique=id;event('techniqueChosen',{id});}
    }
    function levelUp(){
      dashBufferedUntil=0;attackBufferedUntil=0;lastAttackPress=lastManualPress=-99;inputDashHeld=false;state.level++;
      state.nextXp=Math.floor(8+state.level*3.2+state.level**1.28);
      state.transformationOffers.active=null;
      const special=state.level>=3&&!state.build.ability?'ability':state.level>=PROGRESSION.techniqueLevel&&!state.technique?'technique':state.level>=PROGRESSION.artLevel&&!state.combatArt?'art':null;
      state.choices=special==='ability'?Builds.abilityCards(state,shuffled):special?Object.entries(special==='technique'?TECHNIQUES:ARTS).filter(([id])=>state.loadout==='solo'?!['volley','secondserve'].includes(id):!['surge','relentless'].includes(id)).map(([id,spec])=>({id,kind:special,level:0,tag:special==='technique'?'FINISHING TECHNIQUE':'COMBAT ART',...spec})):choices();
      if(state.choices.length<2){const c=state.choices[0];if(c)applyChoice(c);else state.score+=250;state.choices=[];state.nextUpgradeAt=state.runTime+upgradeGap();event('mastery',{name:c?.name||'Night mastery'});return;}
      state.choiceCount++;state.status='upgrade';if(!openGrove())event('level');
    }
    function reroll(keepId=null){
      if(state.status!=='upgrade'||state.build.rerolls<=0||!state.choices.length)return false;
      const kind=state.choices[0].kind;if(['technique','art'].includes(kind))return false;
      const keep=state.relics.marmalade&&keepId?state.choices.find(c=>c.id===keepId):null;state.build.rerolls--;state.choices=kind==='ability'?Builds.abilityCards(state,ids=>{const old=new Set(state.choices.map(c=>c.key));return [...shuffled(ids.filter(([id])=>!old.has(id))),...shuffled(ids.filter(([id])=>old.has(id)))];}):choices(true,keep);if(keep&&kind==='ability'){state.choices=state.choices.filter(c=>c.id!==keep.id);state.choices.unshift(keep);state.choices=state.choices.slice(0,3);}event('rerolled');return true;
    }
    function skipUpgrade(){if(state.status!=='upgrade'||state.choices.every(c=>c.kind==='ability'))return false;state.choices=[];state.transformationOffers.active=null;state.status='playing';state.nextUpgradeAt=state.runTime+upgradeGap();heal(8);p.invulnerable=.55;event('chosen',{name:'A quiet breath',kind:'skip'});return true;}
    function choose(id){
      if(state.status!=='upgrade')return false;const c=state.choices.find(c=>c.id===id);if(!c)return false;
      applyChoice(c);state.upgradesTaken++;state.lastUpgradeAt=state.runTime;state.nextUpgradeAt=state.runTime+upgradeGap();
      state.choices=[];state.transformationOffers.active=null;state.status='playing';p.invulnerable=Math.max(p.invulnerable,.55);event('chosen',{id,name:c.name,kind:c.kind});
      // Bank surplus experience. Never open a second draft from the selection handler.
      return true;
    }
    function slash(angle,span,radius,damage,{heavy=false,colour='#f3c77d',step=0,seen,visual=true,weapon,origin=p,echo=false,active=false}={}){
      if(visual&&effects.length<LIMITS.effects)effects.push({type:'slash',x:origin.x,y:origin.y-18,angle,span,radius,age:0,life:heavy?.4:.26,colour,heavy,step,weapon,echo,ghost:echo});
      let lethalSparks=0,hits=0;
      for(const e of enemies){if(e.hp<=0||seen?.has(e.id))continue;const d=distance(e,origin),a=Math.atan2(e.y-origin.y,e.x-origin.x),delta=Math.abs(Math.atan2(Math.sin(a-angle),Math.cos(a-angle)));
        if(Hitboxes.custom(e)?Hitboxes.sector(e,{x:origin.x,y:origin.y-18},angle,span,radius):d<=radius+e.r&&(span>=TAU||delta<=span/2+Math.asin(Math.min(1,e.r/Math.max(d,1))))){seen?.add(e.id);hits++;hit(e,damage,Math.cos(a)*(heavy?18:8),Math.sin(a)*(heavy?18:8),{angle:a,heavy,step,weapon,active});if(e.hp<=0&&lethalSparks++<24)event('slashImpact',{x:e.x,y:e.y-35,angle:a,heavy,weapon,critical:e.hitCritical});}}
      if(visual)event('slash',{step,heavy,echo});return hits;
    }
    function perfectDodge(source,owner){if(dashPerfect||!dashSafe()||dashAge>.1||dashTravel<.5||p.invulnerable>0)return;dashPerfect=true;state.perfectDodges++;if(state.boss?.hp>0&&!state.boss.major&&owner===state.boss.bossType)earnRecovery(state.boss,'phase:'+state.boss.phase);build.dodge();relic.dodge(source);state.flowTime=2.5;state.dashFollow=.8;if(state.endlessTalents.recovery&&state.time-lastDodgeHeal>=6){lastDodgeHeal=state.time;const before=p.hp;heal(state.endlessTalents.recovery*2);event('achievementHealing',{kind:'soup',amount:p.hp-before});event('talentProc',{id:'recovery'});}event('perfectDodge',{x:p.x,y:p.y-18,source,owner,duration:2.5});fx('ring',p.x,p.y-18,'#b5efdf',.8);}
    const recharge=()=>Math.max(1.65,2.2-state.passives.speed*.15); // Relic recharge rate is applied per tick so exchanging never leaves a penalty.
    function completeFinisher(strike){
      if(strike.proc)return;strike.proc=true;build.finisher(strike);relic.finisher(strike);state.finishers++;for(const g of gems)if(distance(g,p)<180)g.attracted=true;
      event('finisher',{hits:strike.hits||1,angle:strike.angle,weapon:strike.weapon});
      if(state.endlessTalents.afterimage){const rank=state.endlessTalents.afterimage;for(let i=0;i<Math.ceil(rank/2)&&echoes.length<10;i++)echoes.push({...strike,damage:strike.damage*(.36+rank*.12),radius:100+rank*8,at:state.time+.24+i*.2});}
      if(state.technique==='echo'&&echoes.length<10)echoes.push({...strike,at:state.time+.18});
      if(state.technique==='volley'){for(let i=-1;i<=1;i++)spawnShot('espresso',strike.angle+i*.18,1,{damageScale:.65,technique:'volley'});event('fire',{weapon:'espresso',x:p.x,y:p.y-18,angle:strike.angle,technique:'volley'});}
      if(state.technique==='surge')state.nextCut=true;
      if(state.technique==='quickdraw'&&techniqueClock<=0&&p.dashCharges<dashCapacity()){p.dashCooldown=Math.max(.15,p.dashCooldown-.45);techniqueClock=1;}
      if(state.technique)event('techniqueProc',{id:state.technique,x:strike.x,y:strike.y-18,angle:strike.angle});
      if(state.combatArt==='undertow')state.nextCut=true;
      if(state.combatArt==='relentless')state.flowTime=Math.max(state.flowTime,1.5);
      if(state.combatArt==='secondserve'&&artClock<=0){espressoClock=trayClock=baguetteClock=0;for(const e of enemies)e.garlicHit=0;artClock=1.5;event('artProc',{id:'secondserve'});}
    }
    function landed(strike,e){
      build.landed(strike,e);relic.landed(strike,e);
      if(!e.finalBoss)Majors.stagger(e,{...strike,finisher:strike.step===3,majorHits:strike.majorHits??=new Set()},majorApi);
      if(strike.dash&&state.combatArt==='crosscut')e.exposed=2;
      if(!strike.landed){if(strike.dash&&state.endlessTalents.surge&&echoes.length<10){const rank=state.endlessTalents.surge;echoes.push({...strike,damage:strike.damage*(.36+rank*.14),radius:75+rank*7,at:state.time+.18});}strike.landed=true;state.momentum=Math.min(3+(state.endlessTalents.momentum||0),state.momentum+1);state.momentumTime=3;event('attackImpact',{x:e.x,y:e.y-25,angle:strike.angle,heavy:strike.step===3,weapon:strike.weapon,clean:strike.clean});if(strike.clean)state.cleanHits++;}
      if(strike.step===3)completeFinisher(strike);
    }
    function beginAttack(clean=false){
      if(p.finaleLeap||p.starLeap||p.attack||p.dash>0||p.cast?.age<.14||state.status!=='playing')return false;
      const follow=state.dashFollow>0,step=follow?2:state.attackWindow>0?state.attackStep%3+1:1,weapon=state.mainWeapon;
      const tempo=weapon==='espresso'?.86:weapon==='tray'?1.05:1,rate=cooldown()*tempo/(state.relics.quicksilver?1.15:1)*(weapon==='espresso'&&build.rank('singleorigin')?1.15:1);
      const windup=(follow?.035:step===3?.11:.065)*rate,active=(step===3?.14:.09)*rate,recovery=(step===3?.21:.12)*rate;
      p.attack={weapon,step,age:0,windup,active,recovery,duration:windup+active+recovery,angle:state.aimAngle,dash:follow,clean,hit:false,moveX:p.dx,moveY:p.dy};
      state.lastAttackAt=state.time;state.attackStep=step;state.attackWindow=0;state.dashFollow=0;state.attackCount++;attackBufferedUntil=0;
      if(follow)state.dashStrikes++;event('attackStart',{weapon,step,dash:follow,clean});return true;
    }
    function resolveAttack(a){
      a.hit=true;Majors.Magistrate.Fight.attack(state.boss,p,a);const lv=state.weapons[a.weapon],heavy=a.step===3,evolved=state.evolutions[a.weapon],angle=a.angle;
      const riposte=state.parryReady?1+(state.endlessTalents.riposte||0)*.2:1;state.parryReady=false;
      const bonus=LOADOUT_RULES.mainDamage[a.weapon]*riposte*(1+.6*Math.log1p(state.training.edge/10))*build.mainScale(a)*(state.loadout==='solo'?LOADOUT_RULES.soloBonus:1)*(a.dash?1.25:1)*(a.clean?(state.styles.measure?1.55:1.18):1)*(1+state.momentum*.06)*(state.nextCut?1.3:1);state.nextCut=false;
      const strike={weapon:a.weapon,step:a.step,angle,x:p.x,y:p.y,damage:(26+lv*8)*(heavy?1.75:1)*power()*bonus,dash:a.dash,clean:a.clean,proc:false,landed:false};
      const melee=a.weapon==='baguette'||a.weapon==='garlic',radius=(heavy?(melee?150:112):(melee?110:88))+lv*5+(evolved?12:0),span=a.weapon==='baguette'&&a.step===1&&build.rank('needle')?.9:heavy?TAU:a.dash?1.4:melee?2.65:2.25;
      if(heavy&&state.combatArt==='undertow')for(const e of enemies){const d=distance(e,p);if(e.hp>0&&d>70&&d<185){const pull=Math.min(28,d-70);e.x+=(p.x-e.x)/d*pull;e.y+=(p.y-e.y)/d*pull;}}
      if(a.weapon==='baguette'||a.weapon==='garlic'||a.dash||heavy&&a.weapon==='tray'){
        if(a.weapon==='baguette'&&a.step===1)strike.damage*=1+build.rank('needle')*.1;
        const seen=new Set(),range=a.weapon==='garlic'?radius+22:a.weapon==='baguette'?(heavy?108:78)+lv*3+(evolved?(heavy?7:5):0)+(a.step===1&&build.rank('needle')?12+build.rank('needle')*4:0):radius,colour=WEAPONS.find(w=>w.id===a.weapon).colour;
        strike.hits=slash(angle,span,range,strike.damage*(heavy&&build.rank('returning')?.7:1)*(a.weapon==='garlic'?.82:a.weapon==='tray'?.65:1),{heavy,colour,step:a.step,seen,weapon:a.weapon,active:true});
        for(const e of enemies)if(seen.has(e.id))landed(strike,e);
        // A committed melee swing clears shots inside its visible arc, never floor hazards.
        // This gives short-range mains an active way through ranged pressure.
        if(melee){let sparks=0;for(const h of hazards){
          const dx=h.x-p.x,dy=h.y-(p.y-18),d=Math.hypot(dx,dy),delta=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-angle),Math.cos(Math.atan2(dy,dx)-angle)));
          if(h.life>0&&d<range+h.r&&(span>=TAU||delta<span/2)){h.life=0;if(state.endlessTalents.riposte)state.parryReady=true;if(sparks++<5)fx('spark',h.x,h.y,colour,.7,{weapon:a.weapon,angle});}
        }if(sparks)event('parry',{weapon:a.weapon,count:sparks});}

      }
      if(a.weapon==='espresso'||a.weapon==='tray'){
        const naturalCount=heavy?3+(lv>=4?2:0):lv>=3?2:1,compressed=a.weapon==='espresso'&&build.rank('singleorigin'),wide=a.weapon==='espresso'&&build.rank('fanbrew')&&!compressed,count=compressed?1:naturalCount+(wide?2:0);
        for(let i=0;i<count;i++)spawnShot(a.weapon,angle+(i-(count-1)/2)*(a.weapon==='espresso'?(wide?.23:.12):.28),lv,{damageScale:bonus*(a.weapon==='espresso'?1:.72)*(compressed?Math.max(1,naturalCount*.72):wide?naturalCount/count*.9:1),attack:strike});
        if(heavy)fx('slash',p.x,p.y-18,WEAPONS.find(w=>w.id===a.weapon).colour,1,{angle,span:1.2,radius:64,heavy:true,step:3,weapon:a.weapon,life:.25});
      }
      if(heavy&&a.weapon==='espresso'&&state.endlessTalents.crossfire){const n=state.endlessTalents.crossfire;for(let i=0;i<n;i++)spawnShot('espresso',angle+Math.PI+(i-(n-1)/2)*.18,lv,{damageScale:bonus*.5,attack:strike});}
      if(heavy&&a.weapon==='baguette'&&build.rank('returning')&&shots.length<LIMITS.shots){shots.push({id:nextId++,type:'crescent',returnBlade:true,x:p.x,y:p.y-18,px:p.x,py:p.y-18,vx:Math.cos(angle)*350,vy:Math.sin(angle)*350,r:15,life:.6,age:0,damage:strike.damage*.35,pierce:12,hit:new Set()});event('buildCue',{id:'returning_blade_throw'});}
      if(heavy&&a.weapon==='baguette'&&state.styles.crescent&&shots.length<LIMITS.shots){shots.push({id:nextId++,type:'crescent',x:p.x,y:p.y-18,px:p.x,py:p.y-18,vx:Math.cos(angle)*360,vy:Math.sin(angle)*360,r:19,life:.85,age:0,damage:strike.damage*.65,pierce:5,hit:new Set()});event('styleProc',{id:'crescent'});}
      if(heavy){for(const h of hazards)if(Math.hypot(h.x-p.x,h.y-(p.y-18))<82)h.life=0;fx('ring',p.x,p.y-18,'#efdda6',.65);}
      event('fire',{main:true,weapon:a.weapon,x:p.x,y:p.y-18,angle,step:a.step,heavy,compressed:a.weapon==='espresso'&&!!build.rank('singleorigin')});
    }
    function beginWhirl(){
      const lv=state.weapons.baguette,angle=Math.atan2(p.dy,p.dx),radius=74+lv*3+(state.evolutions.baguette?5:0);
      p.attack={weapon:'baguette',whirl:true,step:2,age:0,windup:.012,active:.18,recovery:.15,duration:.342,angle,dash:true,hit:false,seen:new Set(),radius,trail:0};
      p.dash=Math.max(p.dash,.18);state.attackStep=2;state.attackWindow=0;state.dashFollow=0;state.attackCount++;state.dashStrikes++;state.whirls=(state.whirls||0)+1;state.lastAttackAt=state.time;attackBufferedUntil=0;lastAttackPress=lastManualPress=-99;
      event('attackStart',{weapon:'baguette',step:2,dash:true,whirl:true});
    }
    function resolveWhirl(a){
      if(!a.strike){const lv=state.weapons.baguette,bonus=LOADOUT_RULES.mainDamage.baguette*(state.loadout==='solo'?LOADOUT_RULES.soloBonus:1)*(1+.6*Math.log1p(state.training.edge/10))*build.mainScale(a)*(1+state.momentum*.06)*(state.nextCut?1.3:1);state.nextCut=false;a.strike={weapon:'baguette',step:2,angle:a.angle,x:p.x,y:p.y,damage:(26+lv*8)*power()*bonus*1.45,dash:true,whirl:true,proc:false,landed:false};event('fire',{main:true,weapon:'baguette',whirl:true,x:p.x,y:p.y-18,angle:a.angle,step:2});}
      const fresh=enemies.filter(e=>e.hp>0&&!a.seen.has(e.id));slash(a.angle,TAU,a.radius,a.strike.damage,{seen:a.seen,visual:false,weapon:'baguette',active:true});for(const e of fresh)if(a.seen.has(e.id))landed(a.strike,e);
      let parried=0;for(const h of hazards)if(h.life>0&&Math.hypot(h.x-p.x,h.y-p.y+18)<a.radius+h.r){h.life=0;parried++;if(state.endlessTalents.riposte)state.parryReady=true;}if(parried)event('parry',{weapon:'baguette',count:parried});
      if(a.age>=a.trail){a.trail=a.age+.04;effects.push({type:'slash',x:p.x,y:p.y-18,angle:a.angle+(a.age-a.windup)/a.active*TAU,span:2.4,radius:a.radius,age:0,life:.15,colour:'#f3c77d',heavy:false,step:1,weapon:'baguette',whirl:true});if(effects.length>LIMITS.effects)effects.shift();}
    }
    function dash(){
      if(Majors.Magistrate.Fight.locked(state.boss)||state.status!=='playing'||p.finaleLeap||p.starLeap||p.dash>0||p.dashLock>0||p.dashCharges<=0)return false;
      if(!p.moving){p.dx=Math.cos(state.aimAngle);p.dy=Math.sin(state.aimAngle);}
      // A cancelled wind-up never deals its damage; recovery cancels immediately.
      if(Finale.Colossus.climbing(state.boss)&&Finale.Colossus.landing(state.boss,p)){if(!Finale.Colossus.leap(state.boss,p))return false;dashBufferedUntil=0;event('finaleLeap',{x:p.x,y:p.y});return true;}if(state.boss?.starFight?.galaxy){if(!Majors.Star.Fight.leap(state.boss,p))return false;}else Finale.leap(state.boss,p);p.attack=null;p.dash=.14;p.dashCharges--;if(p.dashCooldown<=0)p.dashCooldown=recharge();
      state.dashFollow=.65;state.attackWindow=.85;state.dashChain=0;state.dashWindow=0;
      dashAge=0;dashPerfect=false;dashTravel=0;dashBufferedUntil=0;state.dashCount++;trailClock=0;
      const angle=Math.atan2(p.dy,p.dx);
      if(state.styles.slipstream&&echoes.length<=8)for(const delay of [.18,.36])echoes.push({x:p.x,y:p.y,angle,damage:(24+state.weapons[state.mainWeapon]*8)*power()*1.8,at:state.time+delay,radius:70,weapon:'baguette',style:'slipstream'});
      if(state.styles.bloom&&state.weapons.garlic&&echoes.length<=9)for(const delay of [.25,.6,.95])echoes.push({x:p.x,y:p.y,angle,damage:(20+state.weapons.garlic*6)*power(),at:state.time+delay,radius:62,weapon:'garlic',style:'bloom'});
      if(state.endlessTalents.soulstep){for(const g of gems)if(distance(g,p)<120+state.endlessTalents.soulstep*35)g.attracted=true;fx('ring',p.x,p.y-18,'#9ae2d6',1.2);}
      build.dash();relic.dash();event('dash',{angle,charges:p.dashCharges,leap:!!p.finaleLeap});return true;
    }
    function continueEvolution(){if(state.status!=='evolution')return false;attackBufferedUntil=0;state.pendingEvolution=null;state.status='playing';state.nextUpgradeAt=Math.max(state.nextUpgradeAt,state.runTime+8);p.invulnerable=1.5;return true;}
    function pause(){if(state.status==='playing'){dashBufferedUntil=0;attackBufferedUntil=0;lastAttackPress=lastManualPress=-99;inputDashHeld=false;state.status='paused';return true;}return false;}
    function resume(){if(state.status==='paused'){state.status='playing';return true;}return false;}
    function ground(x,y,r=48,delay=1.15,damage=22,kind='hex',source=kind){addZone({x:clamp(x,ARENA.left+25,ARENA.right-25),y:clamp(y,ARENA.top+25,ARENA.bottom-25),r,age:0,delay,life:delay+.52,damage,kind,source,pattern:BOSSES[source]?.pattern});}
    function fan(e,angle,count=3,spread=.18,speed=170,damage=14){for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*spread;addHazard({x:e.x,y:e.y-15,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:7,life:6,damage,kind:e.bossType||e.type,source:e.bossType||e.type,pattern:BOSSES[e.bossType]?.pattern});}}
    function ring(e,count=10,speed=140,damage=17,offset=0,gaps=0){for(let i=0;i<count;i++){if(gaps&&i%gaps===0)continue;fan(e,offset+i*TAU/count,1,0,speed,damage);}}
    function summon(e,type,count=2){for(let i=0;i<count;i++){if(e.owner&&enemies.filter(q=>q.owner===e.owner&&q.hp>0).length>=6)break;const child=spawn(type,{x:clamp(e.x+(i-(count-1)/2)*36,ARENA.left,ARENA.right),y:clamp(e.y+22,ARENA.top,ARENA.bottom)},{summoned:true,majorSummon:!!e.owner});if(child&&e.owner)child.owner=e.owner;}}
    function bossAttack(e,angle){e.animAttack=.42;
      const id=e.bossType||'landlord',phase=e.phase||1;e.attackNumber=(e.attackNumber||0)+1;e.attack=Math.max(1.65,3.2-phase*.3);
      const damage=19+phase*2+Math.min(6,state.bossKills),pattern=BOSSES[id].pattern;
      if(id==='landlord'){Landlord.attack(e,{damage,addHazard,addZone,event});return;}
      else if(id==='bellkeeper'){Bellkeeper.attack(e,{damage,addZone,event});return;}
      else if(id==='duchess'){Duchess.attack(e,{damage,addHazard,summon,event});return;}
      else if(id==='ferryman'){Ferryman.attack(e,{damage,addZone,event});return;}
      else if(id==='baker'){NewDemis[id].attack(e,{damage,addZone,event});return;}
      else if(id==='groundskeeper'){NewDemis[id].attack(e,{damage,addZone,event});return;}
      else if(id==='clockmaker'){NewDemis[id].attack(e,{damage,addZone,event});return;}
      else if(id==='mirrorlord'){NewDemis[id].attack(e,{damage,addZone,event});return;}
      else if(id==='huntsman'){NewDemis[id].attack(e,{damage:damage+3,addZone,event});return;}
      else if(id==='nightmayor'){NewDemis[id].attack(e,{damage,addZone,event});return;}
      fx('ring',e.x,e.y-20,'#d581aa',1.6);event('bossAttack',{id,pattern,phase});
    }
    function enemyAttack(e,angle){e.animAttack=.42;
      const type=e.type,role=e.role||ENEMY_TYPES[type]?.role;e.attackNumber=(e.attackNumber||0)+1;e.attack=3.6;
      if(role==='charger'||role==='duelist'){e.charge=type==='courier'?.38:.6;e.chargeSpeed=type==='courier'?285:type==='duelist'?290:250;e.attack=type==='courier'?2.8:3.8;}
      else if(type==='caster'){fan(e,angle,state.runTime>240?3:1,.22,185,14);e.attack=3.1;}
      else if(type==='slinger'){fan(e,angle,2,.48,116,16);e.attack=3.4;}
      else if(type==='bellringer'){ground(p.x,p.y,49,1.2,21,type);e.attack=4.4;}
      else if(type==='lamplighter'){for(let i=-1;i<=1;i++)ground(p.x+i*76,p.y,30,1.3,20,type);e.attack=4.6;}
      else if(type==='brute'){ground(e.x,e.y,48,1.05,20,type);e.attack=4.2;}
      else if(type==='elite'){ground(e.x,e.y,64,1.1,23,type);fan(e,angle,2,.35,145,16);e.attack=4.2;}
      else if(type==='glutton'){ground(e.x,e.y,76,1.0,25,type);e.attack=4;}
      else if(type==='archer'){fan(e,Math.atan2(e.aimY,e.aimX),1,0,285,19);e.attack=3.6;}
      else if(type==='mourner'){fan(e,angle,4,.28,133,17);e.attack=4;}
      else if(type==='mirror'){fan(e,angle,2,.2,168,15);e.attack=3.7;}
      else if(type==='marshal'){fan(e,angle,2,.36,125,17);e.attack=4.5;}
      else if(type==='miller'){ring(e,6,125,16,e.age*.15);e.attack=4.3;}
      else if(type==='watchman'){for(let i=1;i<=3;i++)ground(e.x+e.aimX*i*62,e.y+e.aimY*i*62,29,1.05,22,type);e.attack=4;}
      else if(type==='herald'){summon(e,e.attackNumber%2?'villager':'wisp',2);e.attack=6;}
    }
    function startArenaEvent(){
      if(!eventDeck.length)eventDeck=shuffled(Object.keys(EVENTS));const id=eventDeck.shift(),spec=EVENTS[id];
      state.arenaEvent={id,name:spec.name,remaining:spec.duration+2.4,warning:2.4,started:false,age:0,tick:0,x:ARENA.left+160+rng()*(ARENA.right-ARENA.left-320),y:ARENA.top+85+rng()*(ARENA.bottom-ARENA.top-170)};
      event('arenaEvent',{id,name:spec.name,counterplay:spec.counterplay});
    }
    function updateArenaEvent(dt){
      if(!state.arenaEvent){if(state.runTime>=nextArenaEvent)startArenaEvent();return;}
      const a=state.arenaEvent;a.age+=dt;a.remaining=Math.max(0,EVENTS[a.id].duration+2.4-a.age);a.warning=Math.max(0,2.4-a.age);if(a.age<2.4)return;
      if(!a.started){a.started=true;
        if(a.id==='lastorders'){spawn('elite');if(state.runTime>=120)spawn('elite');}
        if(a.id==='treasurehunt'){if(Math.hypot(a.x-p.x,a.y-p.y)<210){a.x=p.x<768?ARENA.right-140:ARENA.left+140;a.y=p.y<580?ARENA.bottom-100:ARENA.top+100;}addDrop({type:'chest',x:a.x,y:a.y,age:0});for(let i=-1;i<=1;i++)spawn(i?'brute':'archer',{x:a.x+i*50,y:a.y-50});}
      }
      a.tick-=dt;
      if(a.tick<=0){a.tick=2.8;
        if(a.id==='lanternfall'){ground(p.x,p.y,39,1.1,21,a.id);ground(ARENA.left+70+rng()*(ARENA.right-ARENA.left-140),ARENA.top+45+rng()*(ARENA.bottom-ARENA.top-90),47,1.25,21,a.id);}
        else if(a.id==='marketstampede'){const x=p.x<768?ARENA.right:ARENA.left;for(let i=-1;i<=1;i++)spawn(i?'runner':'courier',{x,y:clamp(p.y+i*70,ARENA.top,ARENA.bottom)});}
        else if(a.id==='witchingcircle'){for(let i=0;i<5;i++){const angle=i*TAU/5+a.age*.12;ground(p.x+Math.cos(angle)*98,p.y+Math.sin(angle)*74,29,1.3,21,a.id);}}
        else if(a.id==='breach'){for(const x of [ARENA.left,ARENA.right])for(let i=-1;i<=1;i++)spawn(i?'wisp':'skulker',{x,y:clamp(p.y+i*75,ARENA.top,ARENA.bottom)});}
      }
      if(a.remaining<=0){if(a.id!=='treasurehunt')addDrop({type:a.id==='witchingcircle'?'chest':['lanternfall','breach'].includes(a.id)?'nova':'magnet',x:a.x,y:a.y,age:0});event('arenaEventComplete',{id:a.id,name:a.name});state.arenaEvent=null;nextArenaEvent=state.runTime+27+rng()*12;}
    }
    function announceWave(){
      const index=Math.floor((nextWave-24)/26),kind=index%4,side=p.x<768?1:0;
      const names=['Canal rush — watch the flanks','Heavy footsteps — keep an exit','Hex circle — keep moving','The shutters open — find a gap'];
      state.waveName=names[kind];event('wave',{name:state.waveName});pendingWave={kind,side,delay:1.6};nextWave=state.runTime+(longRun?(state.endless?.preBoss?30:36):26);
      // Ground warnings are visible long before damage and aim at where the player was.
      if(state.runTime>90){const count=2+Math.min(3,Math.floor(state.runTime/180));for(let i=0;i<count;i++)addZone({x:clamp(p.x+(i-(count-1)/2)*96,ARENA.left+40,ARENA.right-40),y:clamp(p.y+(i%2?55:-55),ARENA.top+38,ARENA.bottom-38),r:40,age:0,delay:1.6,life:2.2,damage:17});}
    }
    function releaseWave(wave){
      const a=ARENA,count=Math.min(longRun?10:Infinity,(wave.kind===0?7:wave.kind===1?3:wave.kind===2?4:10)+Math.min(5,Math.floor(state.runTime/180)));
      for(let i=0;i<count;i++){
        let x,y;
        if(wave.kind===3){const angle=i/count*TAU;x=clamp(p.x+Math.cos(angle)*440,a.left,a.right);y=clamp(p.y+Math.sin(angle)*290,a.top,a.bottom);}
        else{x=wave.side?a.right:a.left;y=clamp(p.y+(i-(count-1)/2)*42,a.top+15,a.bottom-15);}
        if(longRun&&enemies.filter(e=>e.hp>0).length>=state.endless.cap)break;
        if(Math.hypot(x-p.x,y-p.y)<170){x=p.x<768?a.right:a.left;}
        const roster=[['runner','courier','skulker'],['brute','glutton','marshal'],['caster','archer','bellringer','lamplighter'],['villager','mourner','mirror','miller','watchman','herald']][wave.kind].filter(id=>ENEMY_TYPES[id].unlock<=state.runTime);spawn(roster[Math.floor(rng()*roster.length)]||'villager',{x,y});
      }
    }
    const summonPoints=types=>types.map((_,i)=>({x:450+i*620/Math.max(1,types.length-1),y:i%2?710:435}));
    const majorApi={event,weapon:()=>state.mainWeapon,fall:(amount,source)=>hurt(amount,source||'starFall'),recovery:earnRecovery,shuffle:shuffled,zone:addZone,alive:id=>enemies.some(e=>e.id===id&&e.hp>0),damage:(b,amount,impact)=>hit(b,amount,0,0,{...impact,weapon:state.mainWeapon}),
      inkScene:(b)=>{for(const e of enemies)if(e.id!==b.id)e.hp=0;hazards.length=zones.length=shots.length=echoes.length=0;},
      beeScene:(b)=>{for(const e of enemies)if(e.id!==b.id)e.hp=0;hazards.length=zones.length=shots.length=echoes.length=0;},
      beeCatch:fatal=>{if(state.status!=='playing')return;const before=p.hp;p.hp=fatal?0:Math.max(1,Math.min(p.hp*.3,p.maxHp*.25));p.invulnerable=fatal?0:3;p.attack=null;p.dash=0;state.combo=0;state.momentum=0;event('hurt',{amount:before-p.hp,source:'beeCatch'});if(fatal)finish(false);},
      railMinion:(b,v)=>{const e=spawn('villager',v,{summoned:true,precise:true,majorSummon:true});if(!e)return null;Object.assign(e,v,{owner:b.id,role:'chaser',hp:1800,maxHp:1800,speed:v.railCarriageMinion==='wing'?102:76,damage:22,r:18,xp:0,emerge:.85});return e.id;},
      broken:id=>enemies.some(e=>e.id===id&&e.hp<=0&&e.hit>0),
      cancel:(owner,key)=>{for(const z of zones)if(z.owner===owner&&z.counterKey===key)z.life=0;},
      prop:(b,v)=>{const pt=v.railCoupling||v.beeGate||v.beeEgg?v:World.nearest(state.world,v.x,v.y,20),hp=v.hp*(1+state.majorKills*.14),e={...v,id:nextId++,type:'sigil',role:'object',owner:b.id,bossType:b.bossType,x:pt.x,y:pt.y,r:20,hp,maxHp:hp,age:0,hit:0,garlicHit:0,xp:0,phase:b.phase,view:'front',speed:0,damage:0,interaction:true};enemies.push(e);return e.id;},
      clear:(owner,keepPattern)=>{for(const h of hazards)if(h.owner===owner)h.life=0;for(let i=zones.length-1;i>=0;i--)if(zones[i].owner===owner&&(!keepPattern||zones[i].pattern!==keepPattern))zones.splice(i,1);for(const e of enemies)if(e.owner===owner)e.hp=0;},
      objects:(b,spec)=>Majors.objectLayout(b,spec).map(({x,y,share,label,orbit})=>{const hp=2100*share*(1+state.majorKills*.14),pt=World.nearest(state.world,x,y,20),e={id:nextId++,type:'sigil',role:'object',owner:b.id,bossType:spec.id,x:pt.x,y:pt.y,r:20,hp,maxHp:hp,age:0,hit:0,garlicHit:0,xp:0,phase:b.phase,view:'front',speed:0,damage:0,label,orbit};enemies.push(e);return e.id;}),
      objectState:(id,props)=>{const e=enemies.find(e=>e.id===id);if(e)Object.assign(e,props);},
      push:(x,y)=>{if(p.dash<=0&&!state.transition)Object.assign(p,World.move(state.world,p,p.x+x,p.y+y));},
      projectile:(bolt,b,damage)=>addHazard({x:bolt.x,y:bolt.y-18,vx:Math.cos(bolt.angle)*bolt.speed,vy:Math.sin(bolt.angle)*bolt.speed,r:bolt.r??12,life:bolt.life??3.1,damage,source:b.bossType,owner:b.id,type:'comet',look:bolt.look||b.bossType}),
      markSummons:(types,b,delay=1.45/Majors.TEMPO,key=null)=>summonPoints(types).forEach(pt=>addZone({...pt,r:32,shape:'circle',age:0,delay,life:delay+.1,warningOnly:true,owner:b.id,counterKey:key,kind:'summon',major:true})),
      summon:(types,b)=>types.forEach((type,i)=>{const e=spawn(type,summonPoints(types)[i],{summoned:true,precise:true,majorSummon:true});if(e){e.owner=b.id;e.hp=e.maxHp=Math.max(e.maxHp*.6,1800*(1+state.majorKills*.1));e.damage=Math.max(e.damage,22);}})
    };
    const finaleApi={...majorApi,healthFraction:id=>{const e=enemies.find(e=>e.id===id);return e?clamp(e.hp/e.maxHp,0,1):0;},fall:amount=>hurt(amount,'fall')};
    const admiralApi={...majorApi,damage:(b,amount,impact)=>hit(b,amount,0,0,{...impact,weapon:state.mainWeapon})};
    function cinematic(stage,title,hint){relic.clearCombat();
      const returning=!!state.world.arena&&!stage.arena;
      state.transition={age:0,duration:returning?4.1:2.8,title,hint,from:state.world,to:stage,returning,playerFrom:{x:p.x,y:p.y},playerTo:World.nearest(stage,p.x,p.y,p.r),weapon:state.mainWeapon};if(returning&&(p.x<0||p.x>1536||p.y<0||p.y>1024))state.transition.playerFrom={...state.transition.playerTo};globalThis.ROUGE_MORA_WORLD_ART?.getMap(stage);
      hazards.length=zones.length=shots.length=echoes.length=0;pendingWave=null;state.arenaEvent=null;
      for(const e of enemies)if(!e.major)e.hp=0;
      state.build.fields.length=0;p.cast=null;state.build.guard=0;state.build.ward=0;
      p.attack=null;p.dash=0;p.invulnerable=1;attackBufferedUntil=dashBufferedUntil=0;lastAttackPress=lastManualPress=-99;
      event('worldTransition',{name:title,hint});
    }
    function startFinale(){
      state.finalePending=false;state.nextMajor=Infinity;enemies.length=0;shots.length=hazards.length=zones.length=gems.length=drops.length=0;state.boss=null;
      const stage={...World.at(state.runTime),arena:Finale.SPEC.id,name:Finale.SPEC.arena,theme:'ash',layout:'open',hazard:'none'};
      cinematic(stage,Finale.SPEC.name,'THE FINAL ADVERSARY · Read the hands. Cross the ruin. Break the crown.');
      Object.assign(p,{x:758,y:640,hp:p.maxHp,dashCharges:dashCapacity(),dashCooldown:0,finaleLeap:null});
      spawn('boss',{x:758,y:510},{major:true,bossType:Finale.SPEC.id,precise:true});nextBoss=nextElite=Infinity;pendingWave=null;event('finaleStart');
    }
    function completeFinale(){
      state.finaleKills++;state.bossDead=true;state.finaleEnding=0;state.score+=12000;event('bossDown',{id:Finale.SPEC.id,name:Finale.SPEC.name,major:true,finale:true});
      if(practice||mode==='mora'){finish(true);return;}
      state.boss=null;state.nextMajor=state.runTime+300;nextBoss=state.runTime+150;nextElite=state.runTime+60;p.hp=p.maxHp;p.dashCharges=dashCapacity();p.dashCooldown=0;state.xp+=state.nextXp;state.nextUpgradeAt=state.runTime+3;
      respite(15);cinematic(World.at(state.runTime),'A harder night awakens','Cycle '+(state.finaleKills+1)+' · The twelve return. The Uncrowned waits beyond them.');
    }
    function startMajor(){
      if(state.majorKills>=(state.finaleKills+1)*state.circuitTotal){startFinale();return;}if(!majorDeck.length){majorDeck=shuffled(Object.keys(Majors.BOSSES));if(majorDeck[0]===state.circuitCleared.at(-1))majorDeck.push(majorDeck.shift());}const id=majorDeck.shift(),spec=Majors.BOSSES[id];
      state.nextMajor=Math.max(state.nextMajor+300,(Math.floor(state.runTime/300)+1)*300);enemies.length=0;state.boss=null;
      const stage={...World.at(state.runTime),arena:id,name:spec.arena,theme:spec.theme,layout:'open',hazard:'none'};
      cinematic(stage,spec.name,spec.arena+' · Break the ritual. Punish the opening.');
      Object.assign(p,{x:768,y:730});spawn('boss',{x:768,y:535},{major:true,bossType:id,precise:true});
      nextBoss=Infinity;nextElite=state.runTime+60;reliefUntil=0;
    }
    function majorDefeated(e){
      if(e.finalBoss){state.finaleEnding=e.finale.colossus?Finale.Colossus.ENDING_DURATION:3.4;Finale.Colossus.end(e,p,finaleApi);e.finale.deathAge=0;hazards.length=zones.length=shots.length=0;p.attack=null;p.cast=null;p.finaleLeap=null;event('finaleDown');return;}
      state.majorKills++;state.circuitCleared.push(e.bossType);state.bossDead=true;if(practice){event('bossDown',{name:e.bossName,major:true});finish(true);return;}if(e.inkFight||e.beeFight){hazards.length=zones.length=shots.length=0;}state.score+=4000;state.xp+=state.nextXp;state.nextUpgradeAt=Math.min(state.nextUpgradeAt,state.runTime+10);
      relic.majorDown();event('bossDown',{id:e.bossType,name:e.bossName,major:true});
      p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.3);p.dashCharges=dashCapacity();p.dashCooldown=0;
      state.build.rerolls=Math.min(3,state.build.rerolls+1);
      if(state.majorKills>=(state.finaleKills+1)*state.circuitTotal){state.finalePending=true;state.nextMajor=state.runTime+12;hazards.length=zones.length=0;respite(12);nextBoss=Infinity;event('finaleApproach');cinematic(World.at(state.runTime),World.at(state.runTime).name,'The last seal breaks. The Uncrowned awaits.');return;}
      respite(10);state.arenaEvent=null;nextBoss=state.runTime+90;state.nextMajor=Math.max(state.nextMajor,Math.ceil((state.runTime+10)/300)*300);
      cinematic(World.at(state.runTime),World.at(state.runTime).name,World.at(state.runTime).hint);
      const at=World.nearest(World.at(state.runTime),p.x,p.y,p.r);addDrop({type:'chest',...at,age:0});
    }
    function updateWorld(dt){
      if(!longRun||state.world.arena)return;
      worldClock-=dt;if(!state.world.id||state.endless?.phase==='respite'||worldClock>0)return;worldClock=10;
      const base={age:0,damage:22,kind:state.world.theme,source:'world',major:true},h=state.world.hazard;
      const zone=z=>addZone({...base,...z,life:z.delay+.45});
      if(h==='scorch')zone({shape:'circle',x:p.x,y:p.y,r:58,delay:1.4});
      if(h==='roots')for(let i=-1;i<=1;i++)zone({shape:'circle',x:clamp(p.x+i*120,220,1315),y:clamp(p.y+(i?65:0),375,790),r:44,delay:1.5});
      if(h==='tide'||h==='ice')for(let i=0;i<(h==='ice'?2:1);i++)zone({shape:'line',x:175,y:clamp(p.y+i*110,355,810),angle:0,length:1185,width:38,delay:1.65+i*.35});
      if(h==='halo')zone({shape:'ring',x:p.x,y:p.y,inner:70,r:158,delay:1.7});
    }
    function update(dt,input={}){
      if(state.status!=='playing'){dashBufferedUntil=0;lastAttackPress=lastManualPress=-99;return;}if(!Number.isFinite(dt)||dt<=0)return;
      dt=Math.min(dt,.05);
      if(state.transition){const tr=state.transition;if(globalThis.ROUGE_MORA_WORLD_ART&&!globalThis.ROUGE_MORA_WORLD_ART.ready(tr.to)){tr.age=Math.min(tr.duration*.35,tr.age+dt);return;}tr.age+=dt;if(tr.age>=tr.duration*.45&&!tr.committed){tr.committed=true;state.world=tr.to;flowKey='';Object.assign(p,tr.returning?tr.playerTo:World.nearest(state.world,p.x,p.y,p.r));if(tr.returning){state.boss=null;for(const e of enemies)if(e.major)e.hp=0;delete p.beeTunnel;delete p.inkCaptured;p.starLeap=null;p.starPlatform=null;p.admiralRide=null;}for(const item of [...gems,...drops])Object.assign(item,World.nearest(state.world,item.x,item.y,12));}inputAttackHeld=Boolean(input.attack);inputDashHeld=Boolean(input.dash);build.resetInput();if(tr.age>=tr.duration){state.transition=null;p.invulnerable=1;worldClock=6;}return;}
      if(state.finaleEnding>0){state.finaleEnding-=dt;state.boss.finale.deathAge+=dt;Finale.Colossus.updateEnding(state.boss,dt,p,finaleApi);if(state.finaleEnding<=0)completeFinale();return;}
      if((!state.grove||state.runTime-state.grove.at>=75)&&relic.visit()){inputAttackHeld=inputDashHeld=true;build.resetInput();return;}
      state.time+=dt;relic.update(dt);if(state.status!=='playing'||state.transition)return;if(!practice&&state.boss?.major&&state.boss.hp>0)state.bossTime+=dt;
      if(longRun&&state.runTime>=state.nextMajor&&(!state.boss||state.boss.hp<=0)){startMajor();return;}
      if(longRun&&!state.world.arena&&state.runTime<state.nextMajor&&World.at(state.runTime).index>state.world.index){const stage=World.at(state.runTime);cinematic(stage,stage.name,stage.hint);return;}
      state.cycle=longRun?1+Math.floor(state.runTime/DURATION):1;updateEndless();
      Majors.Admiral.Fight.control(state.boss,p,dt,input,admiralApi);if(p.admiralRide)input={...input,dash:false,special:false,specialPressed:false};
      if(Finale.Colossus.locked(state.boss)||Majors.Magistrate.Fight.locked(state.boss)||['morph','breach','escape'].includes(state.boss?.beeFight?.mode)){input={};dashBufferedUntil=attackBufferedUntil=0;p.attack=null;}
      const wasDashing=p.dash>0;
      state.flowTime=Math.max(0,state.flowTime-dt);if(wasDashing)dashAge+=dt;
      p.invulnerable=Math.max(0,p.invulnerable-dt);p.hurtTime=Math.max(0,p.hurtTime-dt);p.land=Math.max(0,p.land-dt);p.dashLock=Math.max(0,p.dashLock-dt);
      if(p.dashCharges<dashCapacity()){p.dashCooldown-=dt*(state.mastery.dashUntil>state.time?1.1:1)/(state.relics.quicksilver?1.2:1);if(p.dashCooldown<=0){p.dashCharges++;p.dashCooldown=p.dashCharges<dashCapacity()?recharge():0;event('dashReady',{charges:p.dashCharges});}}
      p.dash=Math.max(0,p.dash-dt);if(wasDashing&&!p.dash){p.dashLock=.09;p.land=.13;state.dashFollow=p.attack?.whirl?0:.65;}
      state.attackWindow=Math.max(0,state.attackWindow-dt);state.dashFollow=Math.max(0,state.dashFollow-dt);
      state.momentumTime=Math.max(0,state.momentumTime-dt);if(!state.momentumTime)state.momentum=0;
      techniqueClock=Math.max(0,techniqueClock-dt);artClock=Math.max(0,artClock-dt);
      heal(state.passives.regen*.22*dt);
      let ix=Number.isFinite(input.x)?input.x:0,iy=Number.isFinite(input.y)?input.y:0;const magnitude=Math.hypot(ix,iy);if(magnitude>1){ix/=magnitude;iy/=magnitude;}
      p.moving=Math.hypot(ix,iy)>.05;
      if(p.moving&&!p.dash){const d=Math.hypot(ix,iy);p.dx=ix/d;p.dy=iy/d;}
      const autoTarget=closest(p.x,p.y),autoPoint=autoTarget?Hitboxes.aim(autoTarget,{x:p.x,y:p.y-18}):null,ax=Number(input.aimX)||0,ay=Number(input.aimY)||0;
      state.aimAngle=Math.hypot(ax,ay)>.12?Math.atan2(ay,ax):autoPoint?Math.atan2(autoPoint.y-(p.y-18),autoPoint.x-p.x):Math.atan2(p.dy,p.dx);
      state.aimDistance=Math.hypot(ax,ay)>2?clamp(Math.hypot(ax,ay),55,330):autoTarget?clamp(distance(autoTarget,p),55,330):210;
      if(p.admiralRide){const j=p.admiralRide.joint;state.aimAngle=Math.atan2(j.y-(p.y-18),j.x-p.x);}
      Finale.Colossus.control(state.boss,p,input);build.update(dt,p.finaleLeap||p.starLeap||p.admiralRide?{...input,special:false,specialPressed:false}:input);if(state.transition||state.status!=='playing')return;
      const facing=p.dash?Math.atan2(p.dy,p.dx):p.attack?p.attack.angle:p.cast?p.cast.angle:input.attack?state.aimAngle:Math.atan2(p.dy,p.dx);
      p.view=Math.abs(Math.cos(facing))>Math.abs(Math.sin(facing))?(Math.cos(facing)<0?'left':'right'):(Math.sin(facing)<0?'back':'front');
      if(input.dash&&!inputDashHeld&&!dash()&&(p.dash<=DASH_INPUT_BUFFER||p.dashCooldown<=DASH_INPUT_BUFFER))dashBufferedUntil=state.time+DASH_INPUT_BUFFER;
      if(dashBufferedUntil){if(state.time>dashBufferedUntil+1e-9)dashBufferedUntil=0;else dash();}
      inputDashHeld=Boolean(input.dash);
      const manualPress=(input.attack&&!inputAttackHeld)||input.attackPressed,repeatPress=input.autoAttack&&input.attack&&inputAttackHeld&&!p.attack&&!p.dash&&state.time-lastAttackPress>.11,pressed=manualPress||repeatPress;Majors.Admiral.Fight.attack(state.boss,p,pressed,admiralApi);if(manualPress)lastManualPress=state.time;if(pressed){attackBufferedUntil=state.time+.16;lastAttackPress=state.time;}
      if(!p.finaleLeap&&!p.starLeap&&state.mainWeapon==='baguette'&&p.dash>0&&dashAge<=.1&&!p.attack?.whirl&&(pressed||state.time-lastAttackPress<.085))beginWhirl();
      let clean=false;if(p.attack){const a=p.attack;a.age+=dt;if(a.whirl){if(a.age>=a.windup&&a.age<a.windup+a.active)resolveWhirl(a);}else if(!a.hit&&a.age>=a.windup)resolveAttack(a);if(a.age>=a.duration){clean=Boolean(manualPress||lastManualPress>=state.time-.16&&attackBufferedUntil>=state.time&&a.age-a.duration<.06);p.attack=null;state.attackWindow=.85;}}
      if(attackBufferedUntil>=state.time&&attackBufferedUntil>0&&!p.attack&&!p.dash)beginAttack(clean||Boolean(manualPress&&state.attackWindow>.69&&state.attackStep>0));
      inputAttackHeld=Boolean(input.attack);
      const velocity=MOVE_SPEED*(1+state.passives.speed*.1)*build.speed()*relic.speed()*(state.mastery.fleetUntil>state.time?1.06:1);p.moveSpeed=velocity;
      const a=p.attack,lunging=a&&!a.whirl&&a.age>=a.windup&&a.age<a.windup+a.active&&(a.weapon==='baguette'||a.dash),lunge=lunging?(a.dash?190:70):0;
      const oldX=p.x,oldY=p.y,moveBounds=Majors.Magistrate.Fight.inside(state.boss)?Majors.Magistrate.Fight.bounds:Majors.Beekeeper.Fight.inside(state.boss)?Majors.Beekeeper.Fight.bounds:Majors.Railmaster.Fight.inside(state.boss)?Majors.Railmaster.Fight.bounds:Finale.Colossus.climbing(state.boss)?{left:45,right:1491,top:60,bottom:964}:ARENA;
      p.x=clamp(p.x+(p.dash>0?p.dx*DASH_SPEED*(a?.whirl?.9:1):ix*velocity+Math.cos(a?.angle||0)*lunge)*dt,moveBounds.left+p.r,moveBounds.right-p.r);
      p.y=clamp(p.y+(p.dash>0?p.dy*DASH_SPEED*(a?.whirl?.9:1):iy*velocity+Math.sin(a?.angle||0)*lunge)*dt,moveBounds.top+p.r,moveBounds.bottom-p.r);
      if(!Majors.Magistrate.Fight.active(state.boss)&&!Majors.Beekeeper.Fight.inside(state.boss)&&!Majors.Railmaster.Fight.inside(state.boss)&&!state.boss?.starFight?.galaxy&&!Finale.Colossus.climbing(state.boss))Object.assign(p,World.move(state.world,{x:oldX,y:oldY,r:p.r},p.x,p.y));
      Majors.Beekeeper.Fight.move(state.boss,p,{x:oldX,y:oldY});

      Majors.Admiral.Fight.move(state.boss,p);
      const prismTravel=Majors.Prism.Fight?.travel(state.boss,p,{x:oldX,y:oldY},dt,majorApi);
      Finale.move(state.boss,p,{x:oldX,y:oldY},dt,finaleApi);p.finaleFall=Math.max(0,(p.finaleFall||0)-dt);
      const travel=prismTravel?0:Math.hypot(p.x-oldX,p.y-oldY);p.gait+=travel/92;
      if(p.dash>0){dashTravel+=travel;trailClock-=dt;if(trailClock<=0){trailClock=.028;fx('trail',p.x,p.y-18,'#b7dcdd',1,{pose:'dash',life:.22});}}
      state.comboTime=Math.max(0,state.comboTime-dt);if(!state.comboTime)state.combo=0;
      if(!practice&&!Majors.Magistrate.Fight.active(state.boss)&&!Majors.Beekeeper.Fight.active(state.boss)&&!(state.boss?.finalBoss&&state.boss.hp>0)){
      spawnClock-=dt;
      if(longRun&&spawnClock<=0){const d=state.endless;spawnClock=d.rate*(hard?.85:1);const alive=enemies.filter(e=>e.hp>0),rangedRoles=['caster','zoner','sniper','lobber','spreader','spinner','summoner','orbiter'];let ranged=alive.filter(e=>rangedRoles.includes(e.role)).length;
        if(d.phase!=='respite'&&alive.length<d.cap){const roster=Endless.ENCOUNTERS[d.encounter].roster.filter(id=>ENEMY_TYPES[id].unlock<=state.runTime);for(let i=0;i<Math.min(d.count,d.cap-alive.length);i++){let id=rng()<.8&&roster.length?roster[Math.floor(rng()*roster.length)]:state.runTime>20&&rng()<.45?'runner':'villager';if(rangedRoles.includes(ENEMY_TYPES[id].role)){if(ranged>=d.rangedCap)id='villager';else ranged++;}spawn(id);}}
      }
      if(!longRun&&spawnClock<=0){spawnClock=Math.max(.25,.78-state.runTime*.002)*(hard?.82:1)/(state.runTime>=60?1.1:1);const count=1+Math.min(3,Math.floor(state.runTime/85)),available=Object.values(ENEMY_TYPES).filter(spec=>spec.unlock<=state.runTime).flatMap(spec=>Array(['caster','zoner','sniper','lobber','spreader','spinner','summoner','orbiter'].includes(spec.role)?1:3).fill(spec));for(let i=0;i<count;i++){const roll=rng(),core=state.runTime>70&&roll>.79?'caster':state.runTime>35&&roll>.62?'brute':state.runTime>15&&roll>.34?'runner':'villager';spawn(rng()<.46?core:available[Math.floor(rng()*available.length)].id);}}
      if(state.runTime>=nextElite){if(!longRun||!['respite','boss'].includes(state.endless.phase)){spawn('elite');event('elite');}nextElite=state.runTime+(longRun?(state.runTime>=90?52:60):55);}
      if(state.runTime>=nextBoss&&(!longRun||state.runTime<state.nextMajor)&&(!state.boss||state.boss.hp<=0)){spawn('boss');nextBoss=longRun?state.runTime+180:Infinity;}
      if(state.runTime>=nextWave){if(!longRun||!['respite','boss'].includes(state.endless.phase))announceWave();else nextWave=state.runTime+12;}
      if(pendingWave){pendingWave.delay-=dt;if(pendingWave.delay<=0){releaseWave(pendingWave);pendingWave=null;}}
      if(!longRun||!['respite','boss'].includes(state.endless.phase))updateArenaEvent(dt);
      if(state.runTime>=240&&(!longRun||state.endless.phase==='surge')){if(!squareAwake){squareAwake=true;event('squareAwakens');}pressureClock+=dt;if(pressureClock>=(longRun?12:8)){pressureClock=0;ground(p.x,p.y,52,1.2,longRun?26:22,'witchingcircle','square');}}
      supplyClock+=dt;if(supplyClock>=42){supplyClock=0;addDrop({type:rng()<.6?'magnet':'nova',x:ARENA.left+90+rng()*(ARENA.right-ARENA.left-180),y:ARENA.top+60+rng()*(ARENA.bottom-ARENA.top-120),age:0});event('supply');}
      }
      if(!Majors.Magistrate.Fight.active(state.boss)&&!Majors.Beekeeper.Fight.inside(state.boss))updateWorld(dt);const key=state.world.index+':'+state.world.arena+':'+Math.floor(p.x/32)+':'+Math.floor(p.y/32);if(key!==flowKey){flowKey=key;flow=World.navigation(state.world,p);}
      // Separation is spatially bucketed so dense late waves do not run an N² pass.
      const grid=new Map(),cell=46,guards=enemies.filter(e=>e.type==='marshal'&&e.hp>0);
      for(const e of enemies){const key=Math.floor(e.x/cell)+','+Math.floor(e.y/cell);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(e);}
      for(const e of enemies){
        if(e.hp<=0)continue;e.age+=dt;e.animAttack=Math.max(0,(e.animAttack||0)-dt);if(e.scorch>0){e.scorch-=dt;e.scorchTick-=dt;if(e.scorchTick<=1e-9){e.scorchTick+=.3;hit(e,e.scorchDamage,0,0,{weapon:'espresso'});fx('spark',e.x,e.y-30,'#ef9c58',.6,{weapon:'espresso'});}if(e.hp<=0)continue;}e.exposed=Math.max(0,(e.exposed||0)-dt);e.hit=Math.max(0,e.hit-dt);e.garlicHit=Math.max(0,e.garlicHit-dt);
        if(e.type==='sigil'){if(Number.isFinite(e.orbit))Object.assign(e,World.nearest(state.world,768+Math.cos(e.age*.32+e.orbit)*265,582+Math.sin(e.age*.32+e.orbit)*135,e.r));continue;}
        if(e.major){
          if(e.finalBoss){Finale.update(e,dt,p,finaleApi);continue;}
          if(!e.admiralFight?.ride&&!e.admiralFight?.trap)Majors.update(e,dt,p,majorApi);
          if(e.bossType==='admiral')Majors.Admiral.Fight.observe(e,p,dt,admiralApi);
          if(e.bossType==='briar')Majors.Briar.Fight.pursuit(e,dt,p,majorApi);
          if(e.majorState==='approach'||e.bossType==='oracle'&&Majors.Oracle.canPursue(e)||e.bossType==='admiral'&&Majors.Admiral.canMove(e)||e.bossType==='briar'&&Majors.Briar.canPursue(e)||e.bossType==='clock'&&Majors.Clock.canPursue(e)||e.bossType==='star'&&Majors.Star.canPursue(e)||e.bossType==='cantor'&&Majors.Cantor.canPursue(e)){
            if(e.bossType==='kiln')Majors.Kiln.walk(e,dt,p);
            else if(e.bossType==='admiral')Majors.Admiral.walk(e,dt,p);
            else if(e.bossType==='briar')Majors.Briar.walk(e,dt,p);
            else if(e.bossType==='prism')Majors.Prism.walk(e,dt,p);
            else if(e.bossType==='clock')Majors.Clock.walk(e,dt,p);
            else if(e.bossType==='star')Majors.Star.walk(e,dt,p);
            else if(e.bossType==='cantor')Majors.Cantor.walk(e,dt,p);
            else if(e.bossType==='duelist')Majors.Duelist.walk(e,dt,p);
            else if(e.bossType==='beekeeper')Majors.Beekeeper.walk(e,dt,p);
            else if(e.bossType==='magistrate')Majors.Magistrate.walk(e,dt,p);
            else if(e.bossType==='railmaster')Majors.Railmaster.walk(e,dt,p);
            else if(e.bossType==='oracle')Majors.Oracle.walk(e,dt,p);
            else{const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;if(d>115){e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt;}}
          }
          if(!Majors.Magistrate.Fight.active(e)&&!Majors.Beekeeper.Fight.active(e))Object.assign(e,World.nearest(state.world,e.x,e.y,e.r));e.view=Math.abs(p.x-e.x)>Math.abs(p.y-e.y)?(p.x<e.x?'left':'right'):(p.y<e.y?'back':'front');
          if(e.bossType==='kiln')Majors.Kiln.step(e,dt,majorApi);
          if(e.bossType==='admiral')Majors.Admiral.step(e,dt,majorApi,p);
          if(e.bossType==='briar')Majors.Briar.step(e,dt,majorApi,p);
          if(e.bossType==='prism')Majors.Prism.step(e,dt,majorApi,p);
          if(e.bossType==='clock')Majors.Clock.step(e,dt,majorApi,p);
          if(e.bossType==='star')Majors.Star.step(e,dt,majorApi,p);
          if(e.bossType==='cantor')Majors.Cantor.step(e,dt,majorApi,p);
          if(e.bossType==='duelist')Majors.Duelist.step(e,dt,majorApi,p);
          if(e.bossType==='beekeeper'&&!e.beeFight)Majors.Beekeeper.step(e,dt,majorApi,p);
          if(e.bossType==='magistrate'&&(!e.inkFight||['enter','exit','finish'].includes(e.inkFight.mode)))Majors.Magistrate.step(e,dt,majorApi,p);
          if(e.bossType==='railmaster')Majors.Railmaster.step(e,dt,majorApi,p);
          if(e.bossType==='oracle')Majors.Oracle.step(e,dt,majorApi,p);
          /* Contact is harmless: all damage comes from the marked attacks. */
          continue;
        }
        const from={x:e.x,y:e.y,r:e.r};const focus=build.target(e);let dx=focus.x-e.x,dy=focus.y-e.y,d=Math.hypot(dx,dy)||1;const ux=dx/d,uy=dy/d,incomingCharge=e.charge>0&&e.aimX*dx+e.aimY*dy>0,role=e.role||ENEMY_TYPES[e.type]?.role||e.type;let speed=e.speed,mx=ux,my=uy;
        if(e.railCarriageMinion&&e.emerge>0){e.emerge=Math.max(0,e.emerge-dt);e.moving=false;continue;}
        e.attack-=dt*build.slow(e)*relic.slow(e);
        if(['caster','lobber','spreader','spinner','zoner','sniper','summoner'].includes(role)){const keep=role==='sniper'?320:role==='zoner'||role==='summoner'?290:230;if(d<keep)speed=d<keep-65?-24:0;}
        if(role==='flanker'||role==='duelist'||role==='wisp'){const sway=Math.sin(e.age*(role==='wisp'?2.7:1.1))* (role==='wisp'?.8:.65),norm=Math.hypot(1,sway);mx=(ux-uy*sway)/norm;my=(uy+ux*sway)/norm;}
        if(role==='orbiter'){const radial=d>215?1:d<165?-.7:0,norm=Math.max(1,Math.hypot(radial,.85));mx=(ux*radial-uy*.85)/norm;my=(uy*radial+ux*.85)/norm;}
        if(e.type==='boss'){const phase=e.hp>e.maxHp*.66?1:e.hp>e.maxHp*.33?2:3;if(phase!==e.phase)event('bossPhase',{id:e.bossType||'landlord',name:e.bossName||BOSSES.landlord.name,phase});e.phase=phase;}
        const canAttack=!['chaser','flanker','leech','wisp'].includes(role);
        if(canAttack&&e.attack<.8&&e.attack>0){e.telegraph=e.attack;if(!e.aimLocked){if(e.type==='boss')event('bossTell',{id:e.bossType,phase:e.phase});e.aimX=ux;e.aimY=uy;e.aimLocked=true;if(NewDemis[e.bossType])NewDemis[e.bossType].lock(e,focus);if(e.bossType==='ferryman')Ferryman.lock(e,focus);if(e.bossType==='bellkeeper')Bellkeeper.lock(e,focus);if(e.bossType==='duchess')Duchess.lock(e,focus);if(e.bossType==='landlord')Landlord.lock(e,focus,ARENA);}if(['charger','duelist','sniper','spearman'].includes(role)||e.bossType==='baker'||e.bossType==='huntsman')speed=Math.min(speed,8);}else e.telegraph=0;
        if(e.attack<=0){if(e.type==='boss')bossAttack(e,Math.atan2(dy,dx));else enemyAttack(e,Math.atan2(dy,dx));e.aimLocked=false;}
        if(e.bossType==='ferryman'){speed=Ferryman.speed(e,speed);const sway=Ferryman.sway(e),norm=Math.hypot(1,sway);mx=(ux-uy*sway)/norm;my=(uy+ux*sway)/norm;}
        if(NewDemis[e.bossType])speed=NewDemis[e.bossType].speed(e,speed);
        if(e.bossType==='bellkeeper')speed=Bellkeeper.speed(e,speed);
        if(e.bossType==='duchess')speed=Duchess.speed(e,speed);
        if(e.bossType==='landlord'){speed=Landlord.speed(e,speed);const sway=Landlord.sway(e),norm=Math.hypot(1,sway);mx=(ux-uy*sway)/norm;my=(uy+ux*sway)/norm;}
        if(e.charge>0){const slow=build.slow(e)*relic.slow(e);e.charge-=dt*slow;e.x+=e.aimX*(e.chargeSpeed||250)*dt*slow;e.y+=e.aimY*(e.chargeSpeed||250)*dt*slow;speed=0;}
        let sx=0,sy=0;const cx=Math.floor(e.x/cell),cy=Math.floor(e.y/cell);e.shielded=guards.some(guard=>guard.id!==e.id&&guard.hp>0&&distance(guard,e)<80);
        for(let gx=cx-1;gx<=cx+1;gx++)for(let gy=cy-1;gy<=cy+1;gy++)for(const other of grid.get(gx+','+gy)||[]){if(other.id===e.id)continue;const ox=e.x-other.x,oy=e.y-other.y,od=Math.hypot(ox,oy),rr=e.r+other.r;if(od>0&&od<rr){sx+=ox/od*(rr-od)*2;sy+=oy/od*(rr-od)*2;}}
        if(!e.railCarriageMinion&&World.blocks(state.world).length&&d>100&&!e.charge){const direction=flow(e);mx=direction.x;my=direction.y;}if(e.railCarriageMinion){const a=Majors.Railmaster.Fight.bounds;e.x=clamp(e.x+(mx*speed*build.slow(e)*relic.slow(e)+sx)*dt,a.left+e.r,a.right-e.r);e.y=clamp(e.y+(my*speed*build.slow(e)*relic.slow(e)+sy)*dt,a.top+e.r,a.bottom-e.r);}else Object.assign(e,World.move(state.world,from,e.x+(mx*speed*build.slow(e)*relic.slow(e)+sx)*dt,e.y+(my*speed*build.slow(e)*relic.slow(e)+sy)*dt));
        const walked=Math.hypot(e.x-from.x,e.y-from.y);e.moving=walked>dt*4;e.gait=(e.gait||0)+walked/(['brute','glutton'].includes(e.type)?66:86);
        e.view=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'back':'front';if(NewDemis[e.bossType])NewDemis[e.bossType].step(e,dt,focus);if(e.bossType==='ferryman')Ferryman.step(e,dt,focus);if(e.bossType==='bellkeeper')Bellkeeper.step(e,dt,focus);if(e.bossType==='duchess')Duchess.step(e,dt,focus);if(e.bossType==='landlord')Landlord.step(e,dt,focus);
        if(distance(e,p)<e.r+p.r){if(incomingCharge)perfectDodge('charge',e.bossType);const bitten=hurt(e.damage,e.type,e);if(bitten&&role==='leech')e.hp=Math.min(e.maxHp,e.hp+18);}
      }
      if(state.status!=='playing')return;
      for(let i=echoes.length-1;i>=0;i--){const echo=echoes[i];if(state.time>=echo.at){echoes.splice(i,1);slash(echo.angle,TAU,echo.radius||104,echo.damage*.5,{heavy:true,colour:'#cbeee5',weapon:echo.weapon,origin:echo,echo:true});if(state.transition||state.status!=='playing')break;}}
      espressoClock-=dt;trayClock-=dt;baguetteClock-=dt;
      const target=closest(p.x,p.y),targetPoint=target?Hitboxes.aim(target,{x:p.x,y:p.y-18}):null,angle=targetPoint?Math.atan2(targetPoint.y-(p.y-18),targetPoint.x-p.x):Math.atan2(p.dy,p.dx);
      if(target&&state.mainWeapon!=='espresso'&&state.weapons.espresso&&espressoClock<=0){const lv=state.weapons.espresso;espressoClock=(.73-lv*.045)*.78*cooldown()*(state.evolutions.espresso?.7:1);const n=lv>=5?3:lv>=3?2:1;for(let i=0;i<n;i++)spawnShot('espresso',angle+(i-(n-1)/2)*.13,lv,{damageScale:LOADOUT_RULES.supportDamage});event('fire',{weapon:'espresso',x:p.x,y:p.y-18,angle});}
      if(target&&state.mainWeapon!=='tray'&&state.weapons.tray&&trayClock<=0){const lv=state.weapons.tray;trayClock=(2.05-lv*.14)*.78*cooldown();const n=state.evolutions.tray?5:lv>=5?3:lv>=3?2:1;for(let i=0;i<n;i++)spawnShot('tray',angle+(i-(n-1)/2)*.5,lv,{damageScale:LOADOUT_RULES.supportDamage});event('fire',{weapon:'tray',x:p.x,y:p.y-18,angle});}
      if(target&&state.mainWeapon!=='baguette'&&state.weapons.baguette&&baguetteClock<=0&&distance(target,p)<205){
        const lv=state.weapons.baguette,evolved=state.evolutions.baguette;baguetteStep=baguetteStep%3+1;const finish=baguetteStep===3;
        baguetteClock=(finish?Math.max(.50,.87-lv*.055):.17)*cooldown();
        slash(angle,finish?(evolved?TAU:.72):(evolved?2.75:1.95),finish?82+lv*5:56+lv*5,(24+lv*9)*(finish?1.85:1)*power()*LOADOUT_RULES.supportDamage,{heavy:finish,colour:evolved?'#fff0bc':'#f3c77d',step:baguetteStep,weapon:'baguette'});event('fire',{weapon:'baguette',x:p.x,y:p.y-18,angle,step:baguetteStep});
      }
      Majors.Clock.Fight?.carry(state.boss,p,{x:oldX,y:oldY},dt,majorApi);
      Majors.Star.Fight?.move(state.boss,p,{x:oldX,y:oldY},dt,majorApi);
      for(const s of shots){
        if(s.returnBlade){if(!s.recalling&&s.life<=dt){s.recalling=true;s.hit.clear();s.life=1.2;s.pierce=12;}if(s.recalling){const angle=Math.atan2(p.y-18-s.y,p.x-s.x);s.vx=Math.cos(angle)*420;s.vy=Math.sin(angle)*420;if(Math.hypot(p.x-s.x,p.y-18-s.y)<20){s.life=0;event('buildCue',{id:'returning_blade_catch'});continue;}}}
        if(s.type==='tray'&&state.styles.recall){if(!s.recalling&&s.life<=dt){s.recalling=true;s.hit.clear();s.pierce=4;s.life=1.6;}if(s.recalling){const a=Math.atan2(p.y-18-s.y,p.x-s.x);s.vx=Math.cos(a)*410;s.vy=Math.sin(a)*410;if(Math.hypot(s.x-p.x,s.y-p.y+18)<22){s.life=0;continue;}}}
        s.life-=dt;s.age+=dt;s.px=s.x;s.py=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;Majors.Magistrate.Fight.shot(state.boss,s);
        if(s.type==='tray'&&(s.x<ARENA.left||s.x>ARENA.right)){s.vx*=-1;s.x=clamp(s.x,ARENA.left,ARENA.right);}
        if(s.type==='tray'&&(s.y<ARENA.top||s.y>ARENA.bottom)){s.vy*=-1;s.y=clamp(s.y,ARENA.top,ARENA.bottom);}
        for(const e of enemies){
          if(e.hp<=0||s.hit.has(e.id))continue;
          // Swept circle prevents fast bolts tunnelling through small enemies.
          const shotFrom={x:s.px,y:s.py};
          if(!Hitboxes.swept(e,shotFrom,s,s.r))continue;
          s.hit.add(e.id);const achievementHp=e.hp,vel=Math.hypot(s.vx,s.vy),impact={weapon:s.type,from:shotFrom,active:!!s.attack,step:s.attack?.step,angle:Math.atan2(s.vy,s.vx),heavy:false};let pelletScale=1;if(e.major&&s.type==='espresso'&&s.attack){s.attack.majorPellets??=new Map();const count=s.attack.majorPellets.get(e.id)||0;pelletScale=count>0?.6:1;s.attack.majorPellets.set(e.id,count+1);}hit(e,s.damage*pelletScale,s.vx/vel*6,s.vy/vel*6,impact);if(e.hp<achievementHp)event('achievementProjectile',{shot:s,enemy:e});if(s.attack)landed(s.attack,e);build.shotHit(s,e);if(s.type==='espresso'&&state.styles.roast){if(!(e.scorch>0)){e.scorchTick=.3;e.scorchDamage=0;}e.scorch=1.2;e.scorchDamage=Math.max(e.scorchDamage||0,s.damage*.1);}fx('spark',s.x,s.y,s.type==='tray'?'#b6e3f3':'#f4b565',1,{...impact,critical:e.hitCritical});
          if(state.evolutions[s.type]){const radius=s.type==='espresso'?66:48;fx('ring',s.x,s.y,s.type==='espresso'?'#ffe0a0':'#c0e5f4',.5);for(const near of enemies)if(near.id!==e.id&&distance(near,e)<radius)hit(near,s.damage*.35,0,0,{weapon:s.type,angle:Math.atan2(near.y-e.y,near.x-e.x),heavy:false});}
          if(s.type==='tray'&&!s.recalling&&s.bounces-->0){const next=closest(s.x,s.y,s.hit,500);if(next){const pt=Hitboxes.aim(next,s),a=Math.atan2(pt.y-s.y,pt.x-s.x);s.vx=Math.cos(a)*350;s.vy=Math.sin(a)*350;}}
          if(--s.pierce<=0){if(build.redirect(s))break;if(s.type==='tray'&&state.styles.recall&&!s.recalling){s.recalling=true;s.hit.clear();s.pierce=4;s.life=1.6;}else s.life=0;break;}
        }
      }
      const garlic=orbitals();for(const e of enemies){if(e.hp<=0||e.garlicHit>0)continue;for(const o of garlic){if(Hitboxes.swept(e,o,o,o.r)){e.garlicHit=.38*cooldown();const impact={weapon:'garlic',angle:Math.atan2(e.y-p.y,e.x-p.x),heavy:false};hit(e,(12+state.weapons.garlic*5)*power()*(state.mainWeapon==='garlic'?(state.time-state.lastAttackAt<1.2?.38:.12):LOADOUT_RULES.supportDamage),0,0,impact);fx('spark',o.x,o.y,'#c8eaa0',1,{...impact,critical:e.hitCritical});break;}}}
      if(state.evolutions.garlic&&state.time-state.lastAttackAt<1.2){heal(dt*.12);for(const e of enemies)if(distance(e,p)<119&&!e.garlicHit){e.garlicHit=.65;hit(e,20*power(),0,0,{weapon:'garlic',angle:Math.atan2(e.y-p.y,e.x-p.x)});}}
      for(const h of hazards){if(h.life<=0)continue;const incoming=(p.x-h.x)*h.vx+(p.y-18-h.y)*h.vy>0&&Math.hypot(h.vx,h.vy)>20;h.life-=dt;h.x+=h.vx*dt*build.slow(h,true);h.y+=h.vy*dt*build.slow(h,true);if(Math.hypot(h.x-p.x,h.y-(p.y-18))<h.r+p.r){if(incoming)perfectDodge('projectile',h.source);hurt(h.damage,h.source||'projectile');h.life=0;}}
      for(const z of zones){if(z.ownerObject&&!enemies.some(e=>e.id===z.ownerObject&&e.hp>0)){z.life=0;continue;}z.previousAge=z.age;z.age+=z.createdAt===state.time?0:dt;const demiWave=!!NewDemis[z.source]&&z[z.source+'Wave'];if(demiWave&&!z.sounded&&z.age>=z.delay){z.sounded=true;if(z.impactSound)event('bossImpact',{id:z.source,move:z.move||z.kind});}if(z.ferrymanWave&&!z.sounded&&z.age>=z.delay){z.sounded=true;if(z.impactSound)event('bossImpact',{id:'ferryman',move:z.reverse?'undertow':'crossing'});}if(z.bellkeeperWave&&!z.sounded&&z.age>=z.delay){z.sounded=true;event('bossImpact',{id:'bellkeeper',move:'peal'});}if(z.landlordWave&&!z.sounded&&z.age>=z.delay){z.sounded=true;event('bossImpact',{id:'landlord',move:'stomp'});}if(z.major&&z.owner&&!z.warningOnly&&!z.sounded&&z.age>=z.delay){z.sounded=true;event('bossImpact',{id:z.source,pattern:z.pattern,shape:z.shape,railKind:z.railKind,railInterior:z.railInterior});}if(!z.warningOnly&&(!z.playerHit||z.clockGear)&&z.age>=z.delay&&z.age<z.life&&(demiWave?NewDemis[z.source].contains(z,z.dodgeType==='projectile'?{x:p.x,y:p.y-18,r:p.r}:p):z.ferrymanWave?Ferryman.contains(z,p):z.bellkeeperWave?Bellkeeper.contains(z,p):z.landlordWave?Landlord.contains(z,p):Majors.contains(z,p))){if(z.major||BOSSES[z.source])perfectDodge(demiWave&&z.dodgeType==='projectile'?'projectile':'ground',z.source);if(hurt(z.damage||20,z.source||z.kind||'ground')&&(z.major||z.bellkeeperWave||z.ferrymanWave||demiWave))z.playerHit=true;}}
      if(state.status!=='playing')return;
      for(const g of gems){const d=distance(g,p),reach=62+state.passives.magnet*35+rank('magnet')*12;if(d<reach||g.attracted){g.attracted=true;const v=(210+Math.max(0,reach-d)*3)*dt;g.x+=(p.x-g.x)/Math.max(1,d)*Math.min(v,d);g.y+=(p.y-g.y)/Math.max(1,d)*Math.min(v,d);}if(distance(g,p)<18){state.xp+=g.value;state.collected+=g.value;g.value=0;event('gem');}}
      for(const drop of drops){
        if(state.status!=='playing')break;
        drop.age+=dt;
        if(drop.type==='recovery'){
          const owner=enemies.find(e=>e.id===drop.owner&&e.hp>0);
          if(!owner){drop.dead=true;continue;}
          const safe=recoverySpot(owner,drop);drop.x=safe.x;drop.y=safe.y;
          if(drop.age<.65||p.finaleLeap||distance(drop,p)>26)continue;
          if(relic.preserve(drop,owner))continue;const amount=Recovery.collect(drop,p);if(amount){owner.recovery.recovered+=amount;event('heal',{amount,x:p.x,y:p.y-48});fx('ring',p.x,p.y-18,'#b6dab2',.65);}
          continue;
        }
        if(distance(drop,p)>30||drop.type==='heal'&&p.hp>=p.maxHp)continue;drop.dead=true;
        if(drop.type==='heal'){heal(12);event('heal');}
        if(drop.type==='magnet'){for(const g of gems)g.attracted=true;event('magnet');}
        if(drop.type==='nova'){for(const e of enemies)hit(e,125*power());fx('ring',p.x,p.y-15,'#edce80',5);event('nova');}
        if(drop.type==='chest'){
          heal(4);state.score+=500;
          const eligible=Object.entries(EVOLUTIONS).find(([id,spec])=>id===state.mainWeapon&&state.runTime>=90&&state.weapons[id]===5&&state.passives[spec.passive]>=2&&!state.evolutions[id]);
          if(eligible){dashBufferedUntil=0;const id=eligible[0];state.evolutions[id]=true;state.pendingEvolution=id;state.status='evolution';event('evolution',{id});}
          else{state.xp+=Math.max(5,Math.floor(state.nextXp*.35));event('chest');}
        }
      }
      for(const f of effects)f.age+=dt;
      function prune(list,keep){let write=0;for(const item of list)if(keep(item))list[write++]=item;list.length=write;}
      prune(enemies,e=>e.hp>0);prune(shots,s=>s.life>0);prune(hazards,h=>h.life>0&&h.x>0&&h.x<ARENA.width&&h.y>0&&h.y<ARENA.height);prune(gems,g=>g.value>0);prune(drops,d=>!d.dead&&(d.type==='recovery'||d.age<65));prune(effects,f=>f.age<f.life);prune(zones,z=>z.age<z.life);
      if(!practice&&state.status==='playing'&&!state.transition&&!state.finaleEnding&&!(state.boss?.major&&state.boss.hp>0)&&state.runTime+1e-9>=state.nextUpgradeAt&&state.xp>=state.nextXp){state.xp-=state.nextXp;levelUp();}
    }
    if(practice){
      state.nextUpgradeAt=state.nextMajor=Infinity;state.build.ability=practice.ability;state.build.abilityRank=2;state.level=14;state.weapons[state.mainWeapon]=5;state.evolutions[state.mainWeapon]=true;Object.assign(state.passives,{power:4,haste:3,health:3,magnet:3,speed:3,regen:0});p.maxHp=p.hp=175;state.technique='quickdraw';state.combatArt='crosscut';state.styles={measure:true};
      const spec=practiceSpec,stage=practice.major?{...World.at(0),arena:spec.id,name:spec.arena,theme:spec.theme,layout:'open',hazard:'none'}:World.at(0);
      cinematic(stage,spec.name,'PRACTICE · '+(practice.major?'Phase '+practice.phase+' · ':'')+'Learn the tell. Find the opening.');Object.assign(p,practice.id===Finale.SPEC.id?{x:758,y:640}:{x:768,y:730});
      const boss=spawn('boss',{x:768,y:535},{major:practice.major,bossType:practice.id,precise:true});if(practice.major&&practice.id!==Finale.SPEC.id&&practice.phase>1){boss.phase=practice.phase;boss.hp=practice.id==='star'?boss.starBaseHp*(practice.phase===2?.609:.31):boss.maxHp*(practice.id==='oracle'?([0,1.04,.79,.54,.29][practice.phase]/1.06):practice.phase===2?.64:.31);boss.forceMove=practice.id==='oracle'?Majors.Oracle.firstMove(spec,practice.phase):spec.moves[practice.phase===2?4:7];}
    }
    // Visits spend an ordinary earned choice. Blocked visits wait for a later draft.
    function weaponTransformation(c){const spec=Builds.PERKS[c.kind==='refinement'?c.parent:c.key];return spec?.rarity==='rare'&&!!spec.weapon;}
    function groveCandidates(){
      // Grove rewards must alter the equipped weapon; general rare combat perks stay in ordinary drafts.
      const forms=Builds.cards(state).filter(c=>c.kind==='perk'&&!c.from&&weaponTransformation(c)&&Builds.PERKS[c.key].weapon===state.mainWeapon);
      const refinements=(Builds.refinementCards?.(state)||[]).filter(c=>weaponTransformation(c)&&Builds.PERKS[c.parent].weapon===state.mainWeapon);
      return [...forms,...refinements];
    }
    function openGrove(){
      const previous=state.grove,visits=previous?.visit||(previous?.visited?1:0),due=[180,480,840][visits];
      if(due===undefined||state.status!=='upgrade'||practice||state.transition||state.boss?.hp>0||state.finalePending||state.runTime<due||visits&&state.runTime-previous.at<210||state.time-(state.merchant?.openAt??-999)<75||state.nextMajor-state.runTime>0&&state.nextMajor-state.runTime<18||nextBoss-state.runTime>0&&nextBoss-state.runTime<18||state.choices.some(c=>['ability','technique','art'].includes(c.kind)))return false;
      const eligible=groveCandidates();if(!eligible.length)return false;
      const original=state.choices.slice(),forms=shuffled(eligible.filter(c=>c.kind==='perk')),refines=shuffled(eligible.filter(c=>c.kind==='refinement')),offers=[];
      // A weapon-specific alteration leads the first hand. Later hands always show a refinement when possible.
      if(refines.length)offers.push(refines.shift());
      const lead=forms.find(c=>Builds.PERKS[c.key].weapon===state.mainWeapon)||forms[0];if(lead){offers.push(lead);forms.splice(forms.indexOf(lead),1);}
      for(const c of [...refines,...forms])if(offers.length<3)offers.push(c);
      const history=[...(previous?.history||[])];if(previous)history.push({visit:visits,at:previous.at,chosen:previous.chosen});
      state.grove={visited:true,visit:visits+1,scene:['bough','theatre','reflection'][visits],history,at:state.runTime,original,offers,chosen:null,cleared:false};state.status='grove';p.attack=p.cast=null;p.dash=0;p.moving=false;event('grove');return true;
    }
    function clearGroveArena(){
      if(state.status!=='grove'||!state.grove||state.grove.cleared)return false;
      enemies.length=shots.length=hazards.length=zones.length=effects.length=echoes.length=0;state.build.fields.length=0;relic.clearCombat();pendingWave=null;state.arenaEvent=null;state.grove.cleared=true;return true;
    }
    function chooseGrove(id){
      if(state.status!=='grove'||!state.grove?.cleared||state.grove.chosen||!state.grove.offers.some(c=>c.id===id)||!groveCandidates().some(c=>c.id===id))return false;
      state.grove.chosen=id;return true;
    }
    function leaveGrove(){
      if(state.status!=='grove')return false;clearGroveArena();const g=state.grove;
      if(g.chosen&&!groveCandidates().some(c=>c.id===g.chosen))g.chosen=null;state.status='upgrade';state.choices=g.chosen?g.offers:g.original;
      if(g.chosen)choose(g.chosen);else event('level');
      reliefUntil=Math.max(reliefUntil,state.runTime+5);spawnClock=5;nextElite=Math.max(nextElite,reliefUntil);nextWave=Math.max(nextWave,reliefUntil);nextArenaEvent=Math.max(nextArenaEvent,reliefUntil+10);attackBufferedUntil=dashBufferedUntil=0;inputAttackHeld=inputDashHeld=true;build.resetInput();return true;
    }
    // A dealer clears threats without kills, loot, health or progression rewards.
    function clearMerchantArena(){if(state.status!=='merchant'||state.merchant.cleared)return false;enemies.length=shots.length=hazards.length=zones.length=effects.length=echoes.length=0;state.build.fields.length=0;relic.clearCombat();pendingWave=null;state.arenaEvent=null;state.merchant.cleared=true;return true;}
    return {state,update,choose,reroll,skipUpgrade,openGrove,clearGroveArena,chooseGrove,leaveGrove,clearMerchantArena,buyRelic:relic.buy,leaveMerchant(){clearMerchantArena();const ok=relic.leave();if(ok){reliefUntil=Math.max(reliefUntil,state.runTime+5);spawnClock=5;nextElite=Math.max(nextElite,reliefUntil);nextWave=Math.max(nextWave,reliefUntil);nextArenaEvent=Math.max(nextArenaEvent,reliefUntil+10);attackBufferedUntil=dashBufferedUntil=0;inputAttackHeld=inputDashHeld=true;build.resetInput();}return ok;},special:build.cast,dash,pause,resume,orbitals,continueEvolution,retire};
  }
  function supportDescription(id){return {espresso:'Add automatic piercing coffee bolts to cover your attacks.',garlic:'Add orbiting cloves that damage guests on your flanks.',tray:'Add automatic trays that ricochet between guests.',baguette:'Add automatic sweeping cuts against nearby guests.'}[id];}
  function passiveDescription(id,n){return {power:'All weapons gain '+(22*n)+'% damage.',haste:'Attack recovery rate +'+(12*n)+'%, added to other recovery bonuses. Does not affect special or dash recharge.',health:'Gain '+(25*n)+' maximum health and recover '+20*n+' health.',magnet:'Collect experience from '+(35*n)+' steps farther away.',speed:'Run '+(10*n)+'% faster; each dash charge recovers '+(.15*n).toFixed(2)+'s sooner.',regen:'Recover '+(.22*n).toFixed(2)+' health each second.'}[id];}
  function weaponUpgrade(id,lv){
    if(id==='baguette')return lv>=5?'Master the blade: stronger cuts and finishers. Unlock its evolution with Walking shoes II.':'Increase cut and finisher damage, with 3 more steps of blade reach.';
    if(id==='espresso')return lv>=5?'Shot base damage rises from 45 to 51; shot count and piercing are unchanged. Evolve with Extra shot II.':lv===4?'Main finishers fire 5 shots instead of 3. Shot base damage rises from 39 to 45; each shot pierces one extra target.':lv===3?'Normal attacks fire 2 shots instead of 1. Shot base damage rises from 33 to 39; piercing is unchanged.':'Coffee shot base damage increases from 27 to 33, and each shot can pierce one extra target.';
    if(id==='garlic')return (lv+2)+' orbiting cloves. Stronger lashes and a wider harvest.';
    return lv>=5?'Three automatic trays, or five in a main-weapon finishing volley. More ricochets.':'Stronger trays with more ricochets. Two shots from rank III.';
  }
  return {create,RELICS:Relics,BUILDS:Builds,MAJOR_BOSSES:Majors.BOSSES,FINAL_BOSS:Finale.SPEC,WORLD_STAGES:World.STAGES,ENDLESS_TALENTS:Endless.TALENTS,ENDLESS_ENCOUNTERS:Endless.ENCOUNTERS,ARENA,ENEMY_TYPES,BOSSES,EVENTS,WEAPONS,PASSIVES,EVOLUTIONS,TECHNIQUES,ARTS,STYLES,PROGRESSION,LOADOUT_RULES,DURATION,DASH_LINK_WINDOW,DASH_INPUT_BUFFER,MOVE_SPEED,DASH_SPEED,LIMITS,formatTime,weaponUpgrade,passiveDescription};
});
