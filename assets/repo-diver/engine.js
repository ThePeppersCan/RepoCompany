(() => {
  'use strict';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const rarityRank = r => window.RepoDiverData?.RARITY?.[r]?.rank || 1;
  const dist = (a,b) => Math.hypot((a.x||0)-(b.x||0),(a.y||0)-(b.y||0));

  function weighted(list, weight) {
    if (!list?.length) return null;
    let total = list.reduce((s, x) => s + Math.max(0, weight(x)), 0);
    if (total <= 0) return list[0];
    let roll = Math.random() * total;
    for (const x of list) {
      roll -= Math.max(0, weight(x));
      if (roll <= 0) return x;
    }
    return list[0];
  }

  function cargoCap(equipment = {}) { return 9 + (equipment.cargo || 1) * 5; }
  function itemWeight(item) { return Number(item?.catchWeight ?? item?.weight ?? 0); }
  function cargoWeight(run) { return (run?.catches || []).reduce((sum, item) => sum + itemWeight(item), 0); }
  function canCarry(run, item, equipment) { return cargoWeight(run) + itemWeight(item) <= cargoCap(equipment) + 0.0001; }

  function depthBand(run) {
    const ratio = clamp((run?.player?.y || 0) / 540, 0, 1);
    if (ratio < .26) return { id:'surface', label:'SUNLIT WATER', ratio, risk:1 };
    if (ratio < .52) return { id:'mid', label:'MID-WATER', ratio, risk:2 };
    if (ratio < .76) return { id:'deep', label:'DEEP WATER', ratio, risk:3 };
    return { id:'extreme', label:'EXTREME DEPTH', ratio, risk:4 };
  }

  function notice(run, text, type = 'info', seconds = 1.7) {
    if (!run) return;
    run.notice = { text, type, time: seconds };
  }

  function banner(run, title, text = '', type = 'info', seconds = 3.2) {
    if (!run) return;
    run.eventBanner = { title, text, type, time: seconds, serial:(run.eventBanner?.serial||0)+1 };
  }

  function burst(run, x, y, amount = 12, color = '#c8ffff', force = 1) {
    if (!run) return;
    const room = Math.max(0, 220 - run.particles.length);
    amount = Math.min(amount, room);
    for (let i = 0; i < amount; i++) {
      run.particles.push({ x, y, vx: rand(-70, 70) * force, vy: rand(-85, 30) * force, life: rand(.28, .8), color, size: rand(1, 3) });
    }
  }

  function depthYForFish(src) {
    const min = clamp(src.depth_min ?? 0, .06, .92);
    const max = clamp(src.depth_max ?? 1, min+.03, .98);
    return 55 + rand(min, max) * 445;
  }


  function ecologyZoneAt(run,x,y){
    const zones=window.RepoDiverData.ecologyZones?.(run?.biome?.id)||[];
    const nx=clamp((x||0)/960,0,1),z=zones.find(q=>nx>=q.x1&&nx<=q.x2)||zones[0]||{id:'open',name:'OPEN WATER',habitats:['open']};
    const ratio=clamp((y||0)/540,0,1);return {...z,depth:ratio};
  }
  function habitatFor(src){return window.RepoDiverData.habitatForFish?.(src)||'open'}
  function choosePersonality(opts={}){
    const D=window.RepoDiverData,all=D.ECOLOGY_PERSONALITIES||[];
    if(opts.modifier==='migration'||opts.seasonal==='tuna_run'||opts.seasonal==='pale_migration')return all.find(x=>x.id==='migration')||all[0];
    if(opts.modifier==='predator_territory'||opts.weather==='storm')return all.find(x=>x.id==='predator')||all[0];
    if(opts.modifier==='treasure_rich'||opts.seasonal==='ruin_tide')return all.find(x=>x.id==='salvage')||all[0];
    const roll=Math.random();return roll<.12?(all.find(x=>x.id==='silence')||all[0]):roll<.38?(all.find(x=>x.id==='research')||all[0]):roll<.62?(all.find(x=>x.id==='migration')||all[0]):roll<.82?(all.find(x=>x.id==='salvage')||all[0]):(all.find(x=>x.id==='predator')||all[0]);
  }
  function schoolStats(run,f){
    if(!f.groupId)return null;let sx=0,sy=0,svx=0,svy=0,n=0,nearest=null,nd=9999;
    for(const o of run.fish){if(o===f||o.hooked||o.groupId!==f.groupId)continue;const d=dist(f,o);sx+=o.x;sy+=o.y;svx+=o.vx||0;svy+=o.vy||0;n++;if(d<nd){nd=d;nearest=o}}
    return n?{x:sx/n,y:sy/n,vx:svx/n,vy:svy/n,n,nearest,nearestDistance:nd}:null;
  }
  function nearestPrey(run,pred){
    let hit=null,best=9999;for(const f of run.fish){if(f===pred||f.hooked||f.boss||f.legendary||rarityRank(f.rarity)>3)continue;const d=dist(pred,f);if(d<best&&d<230){best=d;hit=f}}return hit;
  }
  function pushDirectorHistory(run,key){const h=run.ecology?.history;if(!h)return;h.unshift(key);if(h.length>5)h.length=5;}

  function chooseFishSource(biome, level = 1, sonar = 1, opts = {}) {
    const D = window.RepoDiverData;
    const poolAll = D.fishForBiome(biome);
    let pool = poolAll.filter(x => (opts.allowAncient || x.rarity !== 'ancient') && (opts.allowMythic || x.rarity !== 'mythic'));
    pool=pool.filter(x=>!x.conditions||((!x.conditions.weather||x.conditions.weather===opts.weather)&&(!x.conditions.time||x.conditions.time===opts.timeOfDay)));
    if (opts.behavior) pool = pool.filter(x => x.behavior === opts.behavior);
    if (opts.avoidIds?.length) { const kept=pool.filter(x=>!opts.avoidIds.includes(x.id)); if(kept.length)pool=kept; }
    if (opts.minRank) pool = pool.filter(x => rarityRank(x.rarity) >= opts.minRank);
    if (opts.maxRank) pool = pool.filter(x => rarityRank(x.rarity) <= opts.maxRank);
    if (opts.depthRatio != null) {
      const r = opts.depthRatio;
      const atDepth = pool.filter(x => r >= (x.depth_min ?? 0) - .08 && r <= (x.depth_max ?? 1) + .08);
      if (atDepth.length) pool = atDepth;
    }
    if (!pool.length) pool = poolAll.filter(x => (opts.allowAncient || x.rarity !== 'ancient') && (opts.allowMythic || x.rarity !== 'mythic') && (!x.conditions||((!x.conditions.weather||x.conditions.weather===opts.weather)&&(!x.conditions.time||x.conditions.time===opts.timeOfDay))));
    const rarityW = { common: 43, uncommon: 27, rare: 11, epic: 3.8, legendary: .9, mythic: .01, ancient:.0002 };
    return weighted(pool, x => {
      const depthMatch = opts.depthRatio == null ? 1 : (opts.depthRatio >= (x.depth_min ?? 0) && opts.depthRatio <= (x.depth_max ?? 1) ? 1.7 : .45);
      const sonarBoost = 1 + Math.max(0, sonar - 1) * (.045 * rarityRank(x.rarity));
      const rank=rarityRank(x.rarity);
      const nightBoost=opts.timeOfDay==='night' ? (rank>=4?1.32:rank===3?1.12:.90) : 1;
      let weatherBoost=1;
      if(opts.weather==='storm'&&rank>=4) weatherBoost*=1.22;
      if(opts.weather==='aurora'&&biome==='fremennik'&&rank>=3) weatherBoost*=1.28;
      if(opts.weather==='heat'&&['karamja','coral'].includes(biome)&&rank<=3) weatherBoost*=1.18;
      if(opts.weather==='fog'&&rank>=3) weatherBoost*=1.08;
      const habitat=habitatFor(x),habitatBoost=opts.habitat?(habitat===opts.habitat?2.15:(opts.zoneHabitats||[]).includes(habitat)?1.35:.55):1;
      const population=opts.populationScale??1;
      return rarityW[x.rarity] * sonarBoost * depthMatch * nightBoost * weatherBoost * habitatBoost * population;
    });
  }

  function spawnFish(biome, level = 1, sonar = 1, opts = {}) {
    const src = opts.source || chooseFishSource(biome, level, sonar, opts);
    if (!src) return null;
    const rank = rarityRank(src.rarity);
    const hpBase = Math.max(1, Math.ceil((rank - 1) / 2) + ((src.size || 1) > 1.25 ? 1 : 0));
    const hp = opts.legendary ? Math.max(5, hpBase + 2) : hpBase;
    const dir = Math.random() < .5 ? -1 : 1;
    const actualWeight = Number(rand(src.weight_min || src.weight*.78, src.weight_max || src.weight*1.34).toFixed(2));
    let variant='normal';const vr=Math.random();if(vr<.0018)variant='golden';else if(vr<.0048)variant='luminous';else if(vr<.0095)variant='albino';else if(vr<.015)variant='melanistic';
    const visualScale = clamp((src.size || 1) * (.92 + (actualWeight / Math.max(.1, src.weight || 1)) * .09), .52, 2.8);
    const y = opts.y ?? depthYForFish(src);
    const x = opts.x ?? rand(75, 900);
    return {
      ...src,
      x, y,
      homeX:x, homeY:y,
      vx: dir * rand(.26, .58) * (src.speed || 1),
      vy: rand(-.16, .16),
      hp, maxHp:hp,
      phase: Math.random() * Math.PI * 2,
      facing:dir, bank:0, activity:'swim', activityTime:rand(1.4,4.8), turnEase:dir,
      think:rand(.4,1.6), dodge:0, hooked:false, hitFlash:0,
      hidden:src.behavior==='ambush', burrow:src.behavior==='bottom' && Math.random()<.25,
      catchWeight:actualWeight, visualScale,
      groupId: opts.groupId ?? (src.behavior==='school' ? Math.floor(rand(1,99999)) : null),
      legendary:!!opts.legendary,boss:!!opts.boss,variant,
      sonarReveal:0,
      habitat:habitatFor(src),protected:!!window.RepoDiverData.isProtected?.(src.id),juvenile:!opts.legendary&&rank<=3&&Math.random()<.045,
      awareness:'unaware',awarenessTime:0,predatorTarget:null,preyCooldown:0,tagged:false,tagCode:null,
      attackCooldown:rand(.5,2.3)
    };
  }

  function spawnSchool(run, count = 6, minRank = 1, maxRank = 3) {
    const src = chooseFishSource(run.biome.id, run.level, run.equipment?.sonar||1,{minRank,maxRank,depthRatio:depthBand(run).ratio,timeOfDay:run.timeOfDay,weather:run.weather});
    if (!src) return;
    const gid = Math.floor(rand(100000,999999));
    const cx = rand(180,780), cy = clamp(run.player.y + rand(-100,100),75,480);
    for (let i=0;i<count;i++) {
      const f=spawnFish(run.biome.id,run.level,run.equipment?.sonar||1,{source:src,groupId:gid,x:cx+rand(-70,70),y:clamp(cy+rand(-35,35),65,490),timeOfDay:run.timeOfDay,weather:run.weather});
      if(f) run.fish.push(f);
    }
  }

  function makeHazards(biomeId) {
    const type = window.RepoDiverData.sceneForBiome(biomeId).hazard;
    const count = ['pressure','freeze'].includes(type) ? 2 : 5;
    return Array.from({length:count},(_,i)=>({
      type,
      x:rand(120,850), y:rand(210,492), r: type==='current'?rand(75,120):rand(30,60),
      phase:rand(0,6.28), power:rand(.72,1.2), active:true, hitCooldown:0,
      required: type==='rubble'?Math.min(5,2+i%3):0
    }));
  }

  function makeTreasures(biome, equipment, boat={}) {
    const D=window.RepoDiverData;
    const source=D.treasuresForBiome(biome.id);
    const count=Math.max(1,Math.min(5,1+Math.floor(((equipment?.salvage||1)-1)/2)+Math.floor(Math.max(0,(boat?.crane||1)-1)/2)));
    return Array.from({length:count},(_,i)=>{
      const t=source[i%Math.max(1,source.length)]||{id:biome.id+'_cache',name:'Salvage Cache',rarity:'rare',weight:1.1};
      const required=Math.max(1,Math.min(6,(rarityRank(t.rarity)-2)+Math.floor(biome.unlock/14)));
      return {...t,x:rand(125,835),y:rand(280,478),opened:false,phase:rand(0,6.28),required,revealed:false};
    });
  }

  function createRun(opts) {
    const D = window.RepoDiverData;
    const biome = D.biome(opts.biome),equipment=opts.equipment||{},boat=opts.boat||{};
    const timeOfDay=opts.timeOfDay==='night'?'night':'day',weather=opts.weather||'clear';
    const mode=opts.mode||'standard',modifier=opts.modifier||'balanced',loadout=opts.loadout||{harpoonType:'precision',lure:'balanced'},crafted=opts.crafted||{},seasonal=opts.seasonal||null,namedSpecimen=opts.namedSpecimen||null,taggedSpecimen=opts.taggedSpecimen||null,masterDifficulty=opts.masterDifficulty||null;
    const personality=choosePersonality({modifier,seasonal,weather}),baseFish=13+Math.min(9,Math.floor((opts.level||1)/5))+Math.min(5,((equipment.lure||1)-1))+Math.min(3,Math.floor(Math.max(0,(boat.sonar||1)-1)/2));
    const density=personality?.density||1,fishCount=Math.max(6,Math.min(settingsCap(opts.graphics),Math.round(baseFish*density)));
    function settingsCap(g){return g==='balanced'?18:28}
    const zones=D.ecologyZones?.(biome.id)||[];
    const run={
      biome,level:opts.level||1,equipment,boat,timeOfDay,weather,mode,modifier,loadout,crafted,seasonal,namedSpecimen,taggedSpecimen,masterDifficulty,
      fish:[],treasures:makeTreasures(biome,equipment,boat),hazards:makeHazards(biome.id),
      sites:(D.locationsForBiome?.(biome.id)||[]).map((loc,i)=>({...loc,x:i%2===0?690:845,y:i%2===0?330:430,discovered:false,completed:false,stage:0,pulse:Math.random()*6.28})),
      interior:null,missionLocationId:opts.missionLocationId||null,specialistTools:Array.isArray(opts.specialistTools)?opts.specialistTools.slice(0,3):[],openWorldState:null,
      player:{x:105,y:95,vx:0,vy:0,hp:100,o2:100,swimPhase:0,aimAngle:0,damageFlash:0,facing:1,turnEase:1,moveAmount:0,boosting:false,recoil:0},
      particles:[],catches:[],elapsed:0,maxDepth:0,shake:0,flash:0,done:false,spawnTimer:rand(3.5,6.5),totalSpawned:0,
      notice:{text:'EXPEDITION STARTED · READ THE WATER BEFORE YOU HUNT',type:'info',time:2.8},eventBanner:null,
      event:{timer:rand(26,42),active:null,time:0,used:0,currentForce:0,visibility:1},legendary:{triggered:false,activeFish:null,caught:false},boss:{triggered:false,activeFish:null,caught:false,phase:'dormant',charge:0},
      sonar:{cooldown:0,pulse:0,radius:0,lastRadius:0},harpoon:{cooldown:0,projectile:null,hooked:null,fight:null,lastResult:'ready'},camera:{x:0,y:0,zoom:1,targetZoom:1},
      stats:{shots:0,hits:0,misses:0,predatorHits:0,hazardsHit:0,sonars:0,bossHits:0,ancientCaught:0,variants:0,ecologyEvents:0,behavioursSeen:0},recentCatch:null,durability:100,descent:{layer:1,next:30},mystery:{time:0,kind:null},
      ecology:{personality:personality||{id:'research',name:'CALM RESEARCH DIVE',density:1,eventRate:1,predator:1,school:1},zones,noise:0,quiet:rand(6,13),directorTimer:rand(13,22),history:[],current:{x:rand(-.28,.28),y:rand(-.10,.14),strength:weather==='storm'?.75:.32},sediment:0,megaFauna:[],signals:[],observations:[],harvest:{},landmark:null,lastZone:null,migrationPulse:0,debug:false,tagReturn:null,exceptional:Math.random()<.025}
    };
    // Populate by ecological zone/depth instead of dumping unrelated fish uniformly.
    for(let i=0;i<fishCount;i++){
      const zone=zones[i%Math.max(1,zones.length)]||{x1:.05,x2:.95,habitats:['open']},nx=rand(zone.x1+.03,Math.max(zone.x1+.04,zone.x2-.03)),depthRatio=rand(.08,.94),hab=pick(zone.habitats||['open']);
      const f=spawnFish(biome.id,run.level,equipment.sonar||1,{depthRatio,habitat:hab,zoneHabitats:zone.habitats,x:nx*960,y:55+depthRatio*445,timeOfDay,weather,populationScale:density});if(f){run.fish.push(f);run.totalSpawned++;}
    }
    const minSchool=personality?.id==='migration'?10:personality?.id==='silence'?0:4;if(run.fish.filter(f=>f.behavior==='school').length<minSchool)spawnSchool(run,minSchool||3,1,personality?.id==='migration'?4:2);
    if(personality?.id==='migration')spawnSchool(run,settingsCap(opts.graphics)==18?7:11,1,4);
    if(personality?.id==='predator'){for(let i=0;i<2;i++){const pf=spawnFish(biome.id,run.level,equipment.sonar||1,{behavior:'predator',minRank:3,maxRank:6,depthRatio:rand(.35,.9),timeOfDay,weather});if(pf)run.fish.push(pf)}}
    if(personality?.id==='salvage')run.treasures.push(...makeTreasures(biome,equipment,boat).slice(0,2));
    if(modifier==='treasure_rich')run.treasures.push(...makeTreasures(biome,equipment,boat).slice(0,2));
    if(modifier==='migration')spawnSchool(run,7,2,4);
    if(modifier==='predator_territory'){for(let i=0;i<2;i++){const pf=spawnFish(biome.id,run.level,equipment.sonar||1,{behavior:'predator',minRank:3,maxRank:6,depthRatio:rand(.35,.95),timeOfDay,weather});if(pf)run.fish.push(pf)}}
    if(seasonal==='tuna_run'&&['crossing','endless'].includes(biome.id))spawnSchool(run,10,3,6);
    if(seasonal==='crystal_bloom'&&['crystal','cathedral'].includes(biome.id)){for(let i=0;i<5;i++){const rf=spawnFish(biome.id,run.level,equipment.sonar||1,{minRank:4,maxRank:6,depthRatio:rand(.45,.95),timeOfDay,weather});if(rf){rf.luminousAura=true;run.fish.push(rf)}}}
    if(seasonal==='storm_season'&&['shattered','blackrift','crossing'].includes(biome.id))run.event.currentForce=35;
    if(seasonal==='pale_migration'&&['fremennik','pale'].includes(biome.id))spawnSchool(run,8,2,5);
    if(seasonal==='ruin_tide'&&['ruins','citadel'].includes(biome.id))run.treasures.push(...makeTreasures(biome,equipment,boat).slice(0,2));
    if(namedSpecimen&&namedSpecimen.biome===biome.id&&!namedSpecimen.caught_by){const src=D.FISH.find(x=>x.id===namedSpecimen.fish_id);if(src){const nf=spawnFish(biome.id,run.level,equipment.sonar||1,{source:src,legendary:true,x:rand(660,880),y:depthYForFish(src),timeOfDay,weather});if(nf){nf.namedSpecimen=true;nf.namedId=Number(namedSpecimen.id);nf.namedName=namedSpecimen.name;nf.visualScale=Math.max(nf.visualScale,1.35);nf.awareness='territorial';run.fish.push(nf);banner(run,'GLOBAL NAMED SIGHTING',`${namedSpecimen.name} is somewhere in these waters.`,'legendary',4.4)}}}
    if(taggedSpecimen&&taggedSpecimen.biome===biome.id&&Math.random()<.24){const src=D.FISH.find(x=>x.id===taggedSpecimen.fish_id);if(src){const tf=spawnFish(biome.id,run.level,equipment.sonar||1,{source:src,x:rand(590,875),y:depthYForFish(src),timeOfDay,weather});if(tf){tf.tagged=true;tf.tagCode=taggedSpecimen.tag_code;tf.tagId=Number(taggedSpecimen.tag_id);tf.visualScale*=1.04;run.ecology.tagReturn=tf;run.fish.push(tf);banner(run,'TAG DETECTED',`${taggedSpecimen.tag_code} · ${src.name.toUpperCase()} HAS RETURNED TO THESE WATERS`,'success',3.6)}}}
    const visualCap=opts.graphics==='balanced'?28:40;if(run.fish.length>visualCap){const special=run.fish.filter(f=>f.namedSpecimen||f.tagged||f.boss||f.legendary),regular=run.fish.filter(f=>!special.includes(f));run.fish=[...special,...regular.slice(0,Math.max(0,visualCap-special.length))];}
    banner(run,personality?.name||'LIVING OCEAN',personality?.desc||'The ecosystem is active around you.','event',2.4);
    return run;
  }

  function nearestSchoolMate(run,f) {
    if(!f.groupId) return null;
    let sx=0,sy=0,n=0;
    for(const o of run.fish){if(o!==f&&o.groupId===f.groupId&&!o.hooked){sx+=o.x;sy+=o.y;n++;}}
    return n?{x:sx/n,y:sy/n}:null;
  }

  function scatterNearby(run, point, radius=140, strength=.8) {
    for(const f of run.fish){
      if(f.hooked)continue;
      const d=dist(f,point);if(d>radius)continue;
      f.vx += ((f.x-point.x)/(d||1))*strength;
      f.vy += ((f.y-point.y)/(d||1))*strength*.65;
      f.dodge=Math.max(f.dodge,.35);
    }
  }

  function updateFish(run, dt, equipment) {
    const p=run.player, projectile=run.harpoon.projectile;
    for(const f of run.fish){
      if(f.hooked)continue;
      const rank=rarityRank(f.rarity);
      f.phase += dt*(1.35+(f.speed||1));
      f.hitFlash=Math.max(0,(f.hitFlash||0)-dt*5);
      f.dodge=Math.max(0,(f.dodge||0)-dt);
      f.sonarReveal=Math.max(0,(f.sonarReveal||0)-dt);
      f.attackCooldown=Math.max(0,(f.attackCooldown||0)-dt);
      f.think-=dt;f.activityTime=(f.activityTime||0)-dt;
      const d=dist(f,p), dx=(p.x-f.x)/(d||1), dy=(p.y-f.y)/(d||1);
      let targetSpeed=.28+(f.speed||1)*.34+rank*.03;
      const behavior=f.behavior||'wander';
      f.preyCooldown=Math.max(0,(f.preyCooldown||0)-dt);f.awarenessTime=Math.max(0,(f.awarenessTime||0)-dt);
      const noise=run.ecology?.noise||0;
      if(f.awarenessTime<=0){if(d<48)f.awareness=behavior==='predator'||behavior==='legendary'?'hunting':'alert';else if(d<145+noise*90)f.awareness=behavior==='curious'?'curious':noise>.48?'alert':'aware';else f.awareness='unaware';}
      if(f.protected&&d<165&&f.awareness==='unaware')f.awareness='curious';

      if(f.activityTime<=0&&!['predator','legendary','ambush'].includes(behavior)&&d>115){
        const roll=Math.random();
        f.activity=roll<.17?'pause':roll<.31?'feed':'swim';
        f.activityTime=f.activity==='swim'?rand(2.1,5.5):rand(.55,1.35);
      }
      if(f.think<=0){
        f.think=rand(.45,1.65);
        if(behavior==='darting'||behavior==='nervous'){f.vx+=rand(-.65,.65);f.vy+=rand(-.5,.5);}
        if(behavior==='wander'){f.vy+=rand(-.18,.18);}
        if(behavior==='bottom'){f.vx+=rand(-.25,.25);f.vy+=(475-f.y)*.0015;}
        if(f.activity==='feed'){f.vy+=behavior==='bottom'?.15:.24;f.vx*=.65;}
      }
      if(f.activity==='pause'){targetSpeed*=.16;f.vx*=Math.pow(.985,dt*60);f.vy*=Math.pow(.982,dt*60);}
      else if(f.activity==='feed'){targetSpeed*=.45;}

      if(behavior==='school'){
        const st=schoolStats(run,f);
        if(st){f.vx+=(st.x-f.x)*dt*.0025+(st.vx-f.vx)*dt*.12;f.vy+=(st.y-f.y)*dt*.0025+(st.vy-f.vy)*dt*.12;if(st.nearestDistance<20){const sd=dist(f,st.nearest)||1;f.vx+=(f.x-st.nearest.x)/sd*dt*.55;f.vy+=(f.y-st.nearest.y)/sd*dt*.42;}}
        const fear=run.ecology?.noise||0;if(d<105+fear*90){f.vx-=dx*dt*(.65+fear*.65);f.vy-=dy*dt*(.42+fear*.38);f.awareness='fleeing';f.awarenessTime=.8;}
      }else if(behavior==='nervous'||behavior==='darting'){
        if(d<(behavior==='nervous'?175:135)){f.vx-=dx*dt*(1.55+rank*.08);f.vy-=dy*dt*.95;targetSpeed*=1.22;}
      }else if(behavior==='curious'){
        if(d<230&&d>80){f.vx+=dx*dt*.35;f.vy+=dy*dt*.25;}
        if(d<65){f.vx-=dx*dt*.8;f.vy-=dy*dt*.45;}
      }else if(behavior==='territorial'){
        const homeDist=Math.hypot(f.x-f.homeX,f.y-f.homeY);
        if(d<120){f.vx-=dx*dt*.45;f.vy-=dy*dt*.25;if(!f._territoryWarned){f._territoryWarned=true;notice(run,`${f.name.toUpperCase()} IS DEFENDING TERRITORY`,'warning',1.2);}}
        else if(homeDist>90){f.vx+=(f.homeX-f.x)*dt*.003;f.vy+=(f.homeY-f.y)*dt*.003;}
      }else if(behavior==='ambush'){
        f.hidden=f.sonarReveal<=0&&d>95&&f.hitFlash<=0;
        if(!f.hidden&&d<150){f.vx+=dx*dt*1.0;f.vy+=dy*dt*.65;targetSpeed*=1.28;}
      }else if(behavior==='predator'||behavior==='legendary'){
        f.hidden=false;
        const prey=behavior==='predator'&&d>95?nearestPrey(run,f):null;
        if(prey){const pd=dist(f,prey),px=(prey.x-f.x)/(pd||1),py=(prey.y-f.y)/(pd||1);f.predatorTarget=prey;f.vx+=px*dt*.72;f.vy+=py*dt*.48;targetSpeed*=1.16;if(pd<24*(f.visualScale||1)&&f.preyCooldown<=0){prey._ecologyEaten=true;f.preyCooldown=4;run.ecology.lastHunt={predator:f.name,prey:prey.name,time:run.elapsed};scatterNearby(run,f,145,1.15);}}
        if(d<260){f.vx+=dx*dt*(behavior==='legendary'?1.25:.62);f.vy+=dy*dt*(behavior==='legendary'?.92:.42);targetSpeed*=behavior==='legendary'?1.35:1.12;}
        if(d<43*(f.visualScale||1)&&f.attackCooldown<=0){
          const suit=equipment?.suit||1;
          const dmg=(behavior==='legendary'?12:6.2)+(f.visualScale||1)*2.2;
          const dangerMult=run.masterDifficulty==='abyssal'?1.22:run.masterDifficulty==='master'?1.10:1;p.hp=clamp(p.hp-dmg*dangerMult*(1-(suit-1)*.055),0,100);p.damageFlash=1;f.attackCooldown=1.6;run.shake=8;run.stats.predatorHits++;
          notice(run,`${f.name.toUpperCase()} STRUCK YOU`,'danger',1.2);
        }
      }

      if(projectile&&rank>=2){
        const pd=dist(f,projectile);
        if(pd<110&&f.dodge<=0){
          const ddx=(f.x-projectile.x)/(pd||1),ddy=(f.y-projectile.y)/(pd||1);
          const dodge=.48+rank*.17;
          f.vx+=ddx*dodge;f.vy+=ddy*dodge*.72;f.dodge=rand(.3,.72);
        }
      }

      const speed=Math.hypot(f.vx,f.vy);
      if(speed>targetSpeed){const sc=targetSpeed/speed;f.vx*=sc;f.vy*=sc;}
      const desiredFacing=Math.abs(f.vx)>.015?(f.vx<0?-1:1):(f.facing||1);
      f.turnEase+=(desiredFacing-f.turnEase)*Math.min(1,dt*4.8);
      if(Math.abs(f.turnEase)>.72)f.facing=f.turnEase<0?-1:1;
      const verticalBank=clamp(f.vy*1.55,-.5,.5);f.bank+=(verticalBank-f.bank)*Math.min(1,dt*4.2);
      f.x+=f.vx*72*dt;
      f.y+=f.vy*58*dt+Math.sin(f.phase)*(.9+(f.visualScale||1))*dt;
      if(behavior==='bottom') f.y=clamp(f.y,350,500); else f.y=clamp(f.y,55,500);
      if(f.x<35){f.x=35;f.vx=Math.abs(f.vx);} if(f.x>925){f.x=925;f.vx=-Math.abs(f.vx);}
      if(f.y<55){f.y=55;f.vy=Math.abs(f.vy);} if(f.y>500){f.y=500;f.vy=-Math.abs(f.vy);}
      const cur=run.ecology?.current;if(cur&&!f.hooked){f.x+=cur.x*cur.strength*dt*9;f.y+=cur.y*cur.strength*dt*6;}
    }
    if(run.fish.some(f=>f._ecologyEaten)){run.fish=run.fish.filter(f=>!f._ecologyEaten);run.ecology.migrationPulse=Math.max(run.ecology.migrationPulse||0,1);}
  }

  function applyHazards(run,dt,equipment){
    const p=run.player,b=depthBand(run),scene=window.RepoDiverData.sceneForBiome(run.biome.id);
    const suit=equipment?.suit||1, thermal=equipment?.thermal||1, pressure=equipment?.pressure||1;
    for(const h of run.hazards){
      h.phase+=dt;h.hitCooldown=Math.max(0,h.hitCooldown-dt);
      const d=dist(h,p);
      if(h.type==='current'&&d<h.r){p.vx+=Math.sin(h.phase)*dt*60*h.power;p.vy+=dt*15*h.power;}
      if(h.type==='freeze'&&b.ratio>.55){p.o2=clamp(p.o2-dt*.14*h.power*(1-(suit-1)*.04),0,100);}
      if(h.type==='pressure'&&b.id==='extreme'){p.hp=clamp(p.hp-dt*.18*h.power*(1-(pressure-1)*.12),0,100);}
      if(d<h.r&&h.hitCooldown<=0&&!['current','freeze','pressure'].includes(h.type)){
        let dmg=0;
        if(h.type==='vent') dmg=5.5*(1-(thermal-1)*.13)*(run.crafted?.thermal_matrix?.65:1);
        else if(h.type==='jelly') dmg=4.1;
        else if(h.type==='toxic') dmg=3.8;
        else if(h.type==='shard'||h.type==='coral'||h.type==='debris'||h.type==='rubble') dmg=4.8;
        if(dmg>0){p.hp=clamp(p.hp-dmg*(1-(suit-1)*.045),0,100);p.damageFlash=1;h.hitCooldown=1.5;run.shake=5;run.stats.hazardsHit++;if(run.biome.max_depth>575)run.durability=clamp(run.durability-1.3,0,100);notice(run,`${scene.label} HAZARD`,'warning',.8);}
      }
    }
    if(run.event.currentForce){p.vx+=Math.sin(run.elapsed*.8)*run.event.currentForce*dt;p.vy+=Math.cos(run.elapsed*.55)*run.event.currentForce*.22*dt;}
  }

  function landFish(run,fish,equipment){
    if(!canCarry(run,fish,equipment)){
      fish.hooked=false;fish.hp=Math.max(1,fish.maxHp);fish.x=clamp(fish.x+45,45,915);run.harpoon.hooked=null;run.harpoon.fight=null;run.harpoon.cooldown=.6;notice(run,'CARGO FULL · CATCH RELEASED','danger',1.8);return false;
    }
    const stabilizer=equipment?.stabilizer||1;
    const qualityBonus=stabilizer>=4?1:0;
    const q=clamp(1+Math.floor(Math.random()*2)+qualityBonus+(rarityRank(fish.rarity)>=5&&Math.random()<.28?1:0),1,4);
    const item={id:fish.id,q,kind:'fish',name:fish.name,rarity:fish.rarity,weight:Number(fish.catchWeight||fish.weight||1),baseWeight:Number(fish.weight||1),legendary:!!fish.legendary,boss:!!fish.boss,variant:fish.variant||'normal',namedId:fish.namedId||null,namedName:fish.namedName||null};
    run.catches.push(item);if(run.ecology){run.ecology.harvest[item.id]=Number(run.ecology.harvest[item.id]||0)+1;}run.recentCatch={...item,serial:(run.recentCatch?.serial||0)+1,releaseUntil:run.elapsed+6};
    const index=run.fish.indexOf(fish);if(index>=0)run.fish.splice(index,1);
    burst(run,run.player.x+10,run.player.y,18,fish.color||'#d8fbff',1);run.flash=1;
    run.harpoon.hooked=null;run.harpoon.fight=null;run.harpoon.cooldown=.55;run.harpoon.lastResult='caught';
    if(fish.legendary){run.legendary.caught=true;run.legendary.activeFish=null;banner(run,fish.boss?'ANCIENT BOSS LANDED':'LEGENDARY CATCH',`${fish.name.toUpperCase()} · ${item.weight.toFixed(2)}KG`,fish.boss?'ancient':'legendary',fish.boss?6:4.5);}
    if(fish.boss){run.boss.caught=true;run.boss.activeFish=null;run.stats.ancientCaught++;}
    if(item.variant&&item.variant!=='normal')run.stats.variants++;
    notice(run,`LANDED ${fish.name.toUpperCase()} · ${item.weight.toFixed(2)}KG · ★${q}`,'success',2.15);return true;
  }

  function startFight(run,fish,equipment){
    fish.hooked=true;run.harpoon.projectile=null;run.harpoon.hooked=null;
    const rank=rarityRank(fish.rarity);
    run.harpoon.fight={fish,tension:.48,progress:0,slack:0,pulse:rand(0,6.28),rank,snap:0};
    run.harpoon.lastResult='fight';run.camera.targetZoom=fish.legendary?.88:.94;
    banner(run,fish.legendary?'LEGENDARY HOOKED':'FISH ON THE LINE',`${fish.name.toUpperCase()} · HOLD / RELEASE SPACE TO CONTROL TENSION`,fish.legendary?'legendary':'warning',3.2);
  }

  function resolveHarpoonHit(run,fish,equipment){
    if(fish.protected||fish.juvenile){run.harpoon.projectile=null;run.harpoon.cooldown=.48;run.harpoon.lastResult='protected';fish.awareness='fleeing';fish.awarenessTime=1.2;scatterNearby(run,fish,120,.85);notice(run,fish.juvenile?'JUVENILE SPECIMEN · RESEARCH ONLY':'PROTECTED SPECIES · PHOTOGRAPH OR TAG IT','warning',2);return;}
    fish.hitFlash=1;const impact=run.loadout?.harpoonType==='heavy'?2:1;fish.hp-=impact;run.shake=fish.boss?7:3;run.stats.hits++;if(fish.boss)run.stats.bossHits++;burst(run,fish.x,fish.y,10,'#d8fbff',.75);scatterNearby(run,fish,110,.5);
    if(fish.hp>0){
      const awayX=fish.x-run.player.x,awayY=fish.y-run.player.y,len=Math.hypot(awayX,awayY)||1;
      fish.vx+=(awayX/len)*(.7+rarityRank(fish.rarity)*.11);fish.vy+=(awayY/len)*.55;
      run.harpoon.projectile=null;run.harpoon.cooldown=.48;run.harpoon.lastResult='resist';notice(run,`${fish.name.toUpperCase()} RESISTS · ${fish.hp} HIT${fish.hp===1?'':'S'} LEFT`,'warning',1.45);return;
    }
    if(!canCarry(run,fish,equipment)){
      fish.hp=Math.max(1,fish.maxHp);fish.vx*=-1.45;fish.vy+=rand(-.5,.5);run.harpoon.projectile=null;run.harpoon.cooldown=.55;run.harpoon.lastResult='cargo-full';notice(run,`CARGO FULL · ${itemWeight(fish).toFixed(2)}KG NEEDED`,'danger',2);return;
    }
    if(rarityRank(fish.rarity)>=3||fish.visualScale>1.25){startFight(run,fish,equipment);return;}
    fish.hooked=true;run.harpoon.projectile=null;run.harpoon.hooked={fish,startX:fish.x,startY:fish.y,progress:0,duration:clamp(.68+(fish.visualScale||1)*.25-(equipment?.harpoon||1)*.035,.52,1.3)};run.harpoon.lastResult='hooked';notice(run,`HOOKED ${fish.name.toUpperCase()} · REELING`,'success',1.2);
  }

  function updateFight(run,dt,input,equipment){
    const fight=run.harpoon.fight;if(!fight)return;
    const fish=fight.fish,p=run.player,rank=fight.rank;
    fight.pulse+=dt*(2.2+rank*.3);
    const pull=(.42+rank*.055+(fish.legendary?.15:0))*(.72+Math.sin(fight.pulse)*.22);
    if(input.reel){
      fight.tension+=dt*(.31+rank*.018+pull*.35);
      const sweet=fight.tension>.28&&fight.tension<.78?1:.38;
      fight.progress+=dt*((.72+(equipment?.harpoon||1)*.05)/(1+rank*.10))*sweet*(fish.legendary?.58:1)*(run.loadout?.harpoonType==='barbed'?1.22:1)*(run.crafted?.reinforced_line?1.12:1);
      fight.slack=Math.max(0,fight.slack-dt*2);
    }else{
      fight.tension-=dt*(.22-pull*.10);
      fight.progress=Math.max(0,fight.progress-dt*.003*(rank-1));
      if(fight.tension<.12)fight.slack+=dt;else fight.slack=Math.max(0,fight.slack-dt);
    }
    fight.tension+=Math.sin(fight.pulse*1.7)*dt*.018*rank;
    fight.tension=clamp(fight.tension,0,1.08);
    const ang=Math.atan2(fish.y-p.y,fish.x-p.x);
    const lineLen=135+rank*17+Math.sin(fight.pulse)*22;
    fish.x=clamp(p.x+Math.cos(ang)*lineLen+Math.sin(fight.pulse*.7)*22,45,915);
    fish.y=clamp(p.y+Math.sin(ang)*lineLen+Math.cos(fight.pulse)*14,60,495);
    if(fight.tension>=1.0){
      fish.hooked=false;fish.hp=Math.max(1,Math.ceil(fish.maxHp*.55));fish.vx+=Math.cos(ang)*1.5;fish.vy+=Math.sin(ang)*1.0;run.harpoon.fight=null;run.harpoon.cooldown=.9;run.harpoon.lastResult='snap';run.camera.targetZoom=1;notice(run,'LINE SNAPPED · THE FISH ESCAPED','danger',2.1);return;
    }
    if(fight.slack>1.5){
      fish.hooked=false;fish.hp=Math.max(1,Math.ceil(fish.maxHp*.55));run.harpoon.fight=null;run.harpoon.cooldown=.8;run.harpoon.lastResult='slack';run.camera.targetZoom=1;notice(run,'TOO MUCH SLACK · CATCH ESCAPED','warning',1.8);return;
    }
    if(fight.progress>=1){run.camera.targetZoom=1;landFish(run,fish,equipment);}
  }

  function updateHarpoon(run,dt,input,equipment){
    const h=run.harpoon;h.cooldown=Math.max(0,h.cooldown-dt);
    if(h.projectile){
      const pr=h.projectile;pr.x+=pr.dx*pr.speed*dt;pr.y+=pr.dy*pr.speed*dt;pr.travel+=pr.speed*dt;
      let hit=null,hitDistance=Infinity;
      for(const f of run.fish){if(f.hooked||f.hidden)continue;const d=dist(f,pr),radius=4.8+(f.visualScale||f.size||1)*6.5;if(d<radius&&d<hitDistance){hit=f;hitDistance=d;}}
      if(hit)resolveHarpoonHit(run,hit,equipment);
      else if(pr.travel>=pr.range||pr.x<0||pr.x>960||pr.y<0||pr.y>540){burst(run,pr.x,pr.y,5,'#9feaff',.5);h.projectile=null;h.cooldown=Math.max(h.cooldown,.42);h.lastResult='miss';run.stats.misses++;notice(run,'HARPOON MISSED','muted',.8);scatterNearby(run,pr,90,.35);}
    }
    if(h.hooked){
      const hook=h.hooked,fish=hook.fish;hook.progress=clamp(hook.progress+dt/hook.duration,0,1);const eased=1-Math.pow(1-hook.progress,2.5);const wobble=Math.sin(run.elapsed*22)*(1-hook.progress)*8;
      fish.x=hook.startX+(run.player.x-hook.startX)*eased;fish.y=hook.startY+(run.player.y-hook.startY)*eased+wobble;
      if(hook.progress>=1)landFish(run,fish,equipment);
    }
    updateFight(run,dt,input,equipment);
  }

  function useSonar(run,equipment){
    if(!run||run.done)return{ok:false,reason:'no-run'};
    if(run.sonar.cooldown>0){notice(run,`SONAR RECHARGING · ${Math.ceil(run.sonar.cooldown)}S`,'muted',.8);return{ok:false,reason:'cooldown'};}
    const lv=equipment?.sonar||1;
    run.sonar.cooldown=Math.max(7,22-lv*2.2);run.sonar.pulse=1.25;run.sonar.radius=0;run.sonar.lastRadius=0;run.stats.sonars++;
    const maxR=210+lv*45;
    for(const f of run.fish){if(dist(f,run.player)<=maxR){f.sonarReveal=2.8;if(f.hidden)f.hidden=false;}}
    for(const t of run.treasures){if(!t.opened&&dist(t,run.player)<=maxR)t.revealed=true;}
    const rare=run.fish.filter(f=>f.sonarReveal>0&&rarityRank(f.rarity)>=4).length;
    if(run.ecology){run.ecology.noise=Math.max(run.ecology.noise,.78);for(const f of run.fish){const d=dist(f,run.player);if(d>maxR)continue;if(['curious','jelly'].includes(f.behavior)||f.protected){f.vx+=(run.player.x-f.x)/(d||1)*.22;f.vy+=(run.player.y-f.y)/(d||1)*.14;}else if(f.behavior==='school'||f.behavior==='nervous'){f.vx+=(f.x-run.player.x)/(d||1)*.62;f.vy+=(f.y-run.player.y)/(d||1)*.35;f.awareness='alert';f.awarenessTime=1.2;}}}
    notice(run,rare?`SONAR PING · ${rare} RARE SIGNATURE${rare===1?'':'S'}`:'SONAR PING · WATER SCANNED',rare?'success':'info',1.3);
    return{ok:true,rare};
  }

  function triggerEvent(run,key){
    const D=window.RepoDiverData,scene=D.sceneForBiome(run.biome.id);key=key||scene.event;
    const def=D.EVENTS[key]||D.EVENTS.migration;run.event.active=key;run.event.time=def.duration;run.event.used++;run.event.currentForce=0;run.event.visibility=1;
    if(key==='migration')spawnSchool(run,7,1,3);
    if(key==='predator'){
      const pred=chooseFishSource(run.biome.id,run.level,run.equipment?.sonar||1,{behavior:'predator',minRank:3,depthRatio:depthBand(run).ratio})||chooseFishSource(run.biome.id,run.level,run.equipment?.sonar||1,{minRank:4,maxRank:5});
      for(let i=0;i<2;i++){const f=spawnFish(run.biome.id,run.level,run.equipment?.sonar||1,{source:pred,x:850+i*40,y:clamp(run.player.y+rand(-80,80),70,480),timeOfDay:run.timeOfDay,weather:run.weather});if(f)run.fish.push(f);}
    }
    if(key==='treasure_current'||key==='wreck_collapse'){
      const src=D.treasuresForBiome(run.biome.id)[1]||D.treasuresForBiome(run.biome.id)[0];if(src)run.treasures.push({...src,x:rand(260,780),y:clamp(run.player.y+rand(40,130),260,480),opened:false,phase:0,required:Math.max(1,Math.min(6,rarityRank(src.rarity)-1)),revealed:true});
    }
    if(key==='bloom')for(let i=0;i<4;i++){const f=spawnFish(run.biome.id,run.level,run.equipment?.sonar||1,{minRank:3,maxRank:5,depthRatio:depthBand(run).ratio,timeOfDay:run.timeOfDay,weather:run.weather});if(f){f.sonarReveal=def.duration;run.fish.push(f);}}
    if(key==='storm')run.event.currentForce=58;
    if(key==='golden_hour'){run.event.visibility=1.28;for(let i=0;i<3;i++){const f=spawnFish(run.biome.id,run.level,run.equipment?.sonar||1,{minRank:3,maxRank:5,depthRatio:depthBand(run).ratio,timeOfDay:run.timeOfDay,weather:run.weather});if(f)run.fish.push(f);}}
    banner(run,def.name,def.desc,key==='predator'?'danger':'event',3.6);return key;
  }

  function maybeLegendary(run){
    if(run.legendary.triggered||run.elapsed<24||depthBand(run).ratio<.72)return false;
    // Guaranteed eventually if the player deliberately explores the extreme depth; still rare on short dives.
    const chance=run.elapsed>48?.022:.005;
    if(Math.random()>chance)return false;
    return forceLegendary(run);
  }

  function forceLegendary(run){
    if(run.legendary.triggered)return false;
    const D=window.RepoDiverData,id=D.LEGENDARIES[run.biome.id],src=D.fishById(id);if(!src)return false;
    run.legendary.triggered=true;
    const f=spawnFish(run.biome.id,run.level,run.equipment?.sonar||1,{source:src,allowMythic:true,legendary:true,x:rand(700,880),y:rand(390,485),timeOfDay:run.timeOfDay,weather:run.weather});
    if(!f)return false;f.sonarReveal=999;run.fish.push(f);run.legendary.activeFish=f;scatterNearby(run,f,420,1.4);run.camera.targetZoom=.9;
    banner(run,'LEGENDARY SIGNATURE',`${f.name.toUpperCase()} HAS ENTERED THE WATER`,'legendary',4.4);return true;
  }

  function forceBoss(run){
    if(!run||run.boss?.triggered)return false;const D=window.RepoDiverData,id=D.BOSSES?.[run.biome.id],src=D.fishById(id);if(!src)return false;
    run.boss.triggered=true;run.boss.phase='arrival';const f=spawnFish(run.biome.id,run.level,run.equipment?.sonar||1,{source:src,allowAncient:true,legendary:true,boss:true,x:870,y:clamp(run.player.y+rand(80,180),250,480),timeOfDay:run.timeOfDay,weather:run.weather});if(!f)return false;
    f.maxHp=Math.max(9,Math.ceil((window.RepoDiverData.RARITY[src.rarity]?.rank||7)*1.7));f.hp=f.maxHp;f.visualScale=Math.max(3.15,f.visualScale*1.35);f.sonarReveal=999;f.behavior='legendary';f.boss=true;run.fish.push(f);run.boss.activeFish=f;run.boss.charge=2.5;run.boss.special=5.5;run.boss.style=({abyssal:'ambush',midnight:'ambush',pale:'freeze',fremennik:'freeze',blackrift:'vent',volcanic:'vent',shattered:'seismic',cathedral:'rubble',citadel:'rubble',ruins:'rubble',crossing:'charge',endless:'charge'}[run.biome.id]||'charge');run.camera.targetZoom=.79;scatterNearby(run,f,560,2.1);banner(run,'ANCIENT CONTACT',`${f.name.toUpperCase()} · BOSS-SCALE SIGNATURE`,'ancient',5.5);return true;
  }

  function updateBoss(run,dt){
    const f=run.boss?.activeFish;if(!f||f.hooked||run.boss.caught)return;run.boss.charge-=dt;run.boss.special=(run.boss.special??5)-dt;
    const style=run.boss.style||'charge',p=run.player;
    if(run.boss.special<=0){
      run.boss.special=style==='charge'?4.2:rand(5.4,8.2);
      if(style==='ambush'){f.x=clamp(p.x+(Math.random()<.5?-1:1)*rand(150,240),80,880);f.y=clamp(p.y+rand(-100,100),110,480);run.event.visibility=Math.min(run.event.visibility,.48);scatterNearby(run,f,300,1.5);banner(run,'LIGHTS LOST','THE ANCIENT CREATURE VANISHED INTO THE DARK','danger',1.8);}
      else if(style==='freeze'){p.vx*=.38;p.vy*=.38;p.o2=clamp(p.o2-4,0,100);banner(run,'FREEZE PULSE','ICE WATER LOCKS THE SUIT — BREAK AWAY','danger',1.8);}
      else if(style==='vent'){run.shake=8;p.hp=clamp(p.hp-5*(run.crafted?.thermal_matrix?.65:1),0,100);run.durability=clamp(run.durability-3,0,100);banner(run,'THERMAL ERUPTION','THE RIFT FLASHES WHITE-HOT','danger',1.8);}
      else if(style==='seismic'){p.vx+=rand(-120,120);p.vy+=rand(-65,65);run.shake=11;banner(run,'SEISMIC SHOCK','THE CANYON MOVES AROUND YOU','danger',1.7);}
      else if(style==='rubble'){run.shake=9;const dmg=Math.random()<.55?6:0;if(dmg){p.hp=clamp(p.hp-dmg,0,100);run.durability=clamp(run.durability-2.5,0,100);}banner(run,'COLLAPSING RUINS',dmg?'DEBRIS STRUCK THE DIVE RIG':'DEBRIS MISSED — KEEP MOVING','danger',1.7);}
    }
    if(run.boss.charge<=0){run.boss.charge=style==='charge'?rand(2.5,4.4):rand(3.8,6.2);run.boss.phase='charge';const dx=p.x-f.x,dy=p.y-f.y,l=Math.hypot(dx,dy)||1,mult=style==='charge'?3.5:2.8;f.vx+=(dx/l)*mult;f.vy+=(dy/l)*(style==='charge'?2.5:2.0);run.shake=Math.max(run.shake,4);banner(run,'BOSS CHARGE','MOVE — THE CREATURE IS COMMITTING TO A LINE','danger',1.5);}
    const d=dist(f,p);if(d<46*(f.visualScale/3.1)&&f.attackCooldown<=0){p.hp=clamp(p.hp-(11+f.visualScale*1.7),0,100);p.damageFlash=1;run.durability=clamp(run.durability-4.5,0,100);f.attackCooldown=1.5;run.shake=10;notice(run,'ANCIENT IMPACT · EVADE THE NEXT CHARGE','danger',1.4);}
  }

  function updateEvents(run,dt){
    run.event.timer-=dt;
    if(run.event.active){run.event.time-=dt;if(run.event.time<=0){run.event.active=null;run.event.currentForce=0;run.event.visibility=1;run.event.timer=rand(28,46);}}
    else if(run.event.timer<=0)triggerEvent(run);
    if(run.eventBanner)run.eventBanner.time=Math.max(0,run.eventBanner.time-dt);
    if(run.mystery.time>0)run.mystery.time=Math.max(0,run.mystery.time-dt);else if(window.RepoDiverData.ENDGAME_BIOMES?.includes(run.biome.id)&&run.elapsed>22&&Math.random()<dt*.0012){run.mystery={time:6,kind:pick(['shadow','eye','signal'])};banner(run,'UNIDENTIFIED CONTACT',run.mystery.kind==='shadow'?'Something enormous passed beyond visual range.':run.mystery.kind==='eye'?'A reflective eye vanished beyond the lamp.':'Sonar returned a signal too large to classify.','mystery',3.2);}
    if(run.mode==='boss'&&!run.boss.triggered&&run.elapsed>7)forceBoss(run);else if(window.RepoDiverData.ENDGAME_BIOMES?.includes(run.biome.id)&&!run.boss.triggered&&run.elapsed>55&&Math.random()<dt*.0025)forceBoss(run);else maybeLegendary(run);
  }

  function triggerLivingEvent(run,key){
    const eco=run.ecology;if(!eco)return;const recent=new Set(eco.history||[]),choices=['school_pass','predator_hunt','current_shift','whale_song','bloom','wreck_exposed','mega_fauna','migration_surge','sediment'];
    if(!key){let pool=choices.filter(x=>!recent.has(x));if(eco.exceptional&&!eco.history.length)pool=['mega_fauna','migration_surge','bloom'];if(eco.personality?.id==='migration')pool.push('migration_surge','school_pass');if(eco.personality?.id==='predator')pool.push('predator_hunt');if(eco.personality?.id==='salvage')pool.push('wreck_exposed');if(eco.personality?.id==='silence'&&run.elapsed<55)pool=pool.filter(x=>!['school_pass','migration_surge','predator_hunt'].includes(x));key=pick(pool.length?pool:choices)}
    pushDirectorHistory(run,key);run.stats.ecologyEvents=(run.stats.ecologyEvents||0)+1;eco.quiet=rand(7,16);
    if(key==='school_pass'){spawnSchool(run,run.modifier==='migration'?10:7,1,3);banner(run,'SCHOOL PASSING','A COORDINATED SCHOOL MOVES THROUGH THE CURRENT','event',2.1);eco.observations.push({kind:'schooling',time:run.elapsed});}
    else if(key==='predator_hunt'){const pred=spawnFish(run.biome.id,run.level,run.equipment?.sonar||1,{behavior:'predator',minRank:3,maxRank:5,x:rand(690,900),y:clamp(run.player.y+rand(-110,110),80,475),timeOfDay:run.timeOfDay,weather:run.weather});if(pred){run.fish.push(pred);spawnSchool(run,5,1,2);banner(run,'THE SCHOOL COMPRESSES','A PREDATOR HAS ENTERED THE FEEDING GROUND','warning',2.2);eco.observations.push({kind:'predator_hunt',fishId:pred.id,time:run.elapsed});}}
    else if(key==='current_shift'){eco.current={x:rand(-1,1),y:rand(-.35,.35),strength:rand(.48,.92)};banner(run,'CURRENT SHIFT','PARTICLES TURN — A NEW WATER MASS IS MOVING THROUGH','event',2);}
    else if(key==='whale_song'){eco.signals.push({kind:'whale_song',x:rand(680,910),y:rand(80,420),time:8});banner(run,'DISTANT BIOLOGICAL CALL','A LOW CALL CARRIES THROUGH THE WATER','mystery',2.4);}
    else if(key==='bloom'){for(let i=0;i<5;i++){const f=spawnFish(run.biome.id,run.level,run.equipment?.sonar||1,{minRank:2,maxRank:5,depthRatio:rand(.35,.9),timeOfDay:run.timeOfDay,weather:run.weather});if(f){f.luminousAura=true;run.fish.push(f)}}banner(run,'BIOLUMINESCENT BLOOM','MOVING LIGHT GATHERS AROUND THE WATER COLUMN','success',2.3);}
    else if(key==='wreck_exposed'){const extra=makeTreasures(run.biome,run.equipment,run.boat)[0];if(extra){extra.revealed=true;extra.x=rand(330,820);extra.y=rand(330,475);run.treasures.push(extra)}banner(run,'SEABED EXPOSED','THE CURRENT HAS UNCOVERED A NEW SALVAGE SIGNATURE','success',2.1);}
    else if(key==='mega_fauna'){eco.megaFauna.push({x:-180,y:rand(95,330),vx:rand(18,32),scale:rand(2.2,3.7),life:24,kind:pick(['whale','manta','serpent'])});banner(run,'DISTANT MOVEMENT','SOMETHING ENORMOUS CROSSES THE BACK WATER','mystery',2.3);}
    else if(key==='migration_surge'){spawnSchool(run,10,2,4);spawnSchool(run,8,1,3);eco.migrationPulse=5;banner(run,'MIGRATION SURGE','MULTIPLE SCHOOLS ENTER THE REGION TOGETHER','success',2.3);eco.observations.push({kind:'migration',time:run.elapsed});}
    else if(key==='sediment'){eco.sediment=1;run.event.visibility=Math.min(run.event.visibility,.72);banner(run,'SEDIMENT CLOUD','DISTURBED SILT REDUCES VISIBILITY NEAR THE BOTTOM','warning',1.8);}
  }

  function updateLivingOcean(run,dt,input,equipment){
    const eco=run.ecology;if(!eco)return;eco.noise=Math.max(0,eco.noise-dt*.22);if(run.player.boosting)eco.noise=Math.max(eco.noise,.54);eco.quiet=Math.max(0,(eco.quiet||0)-dt);eco.directorTimer-=dt;eco.sediment=Math.max(0,(eco.sediment||0)-dt*.13);eco.migrationPulse=Math.max(0,(eco.migrationPulse||0)-dt);if(eco.sediment>0)run.event.visibility=Math.min(run.event.visibility,.7+.3*(1-eco.sediment));else if(!run.event.active)run.event.visibility+=(1-run.event.visibility)*Math.min(1,dt*.5);
    if(run.player.boosting&&run.player.y>455)eco.sediment=Math.min(1,eco.sediment+dt*.75);
    const cur=eco.current||{x:0,y:0,strength:0};run.player.vx+=cur.x*cur.strength*dt*4.5;run.player.vy+=cur.y*cur.strength*dt*3;
    if(eco.directorTimer<=0&&eco.quiet<=0&&!run.harpoon.fight&&!run.boss?.activeFish){const stress=(100-run.player.hp)/100+(100-run.player.o2)/125;const rate=eco.personality?.eventRate||1;if(stress<.85||Math.random()<.38)triggerLivingEvent(run);eco.directorTimer=rand(17,31)/Math.max(.65,rate);}
    for(const m of eco.megaFauna||[]){m.x+=m.vx*dt;m.life-=dt;}eco.megaFauna=(eco.megaFauna||[]).filter(m=>m.life>0&&m.x<1160);
    for(const sig of eco.signals||[])sig.time-=dt;eco.signals=(eco.signals||[]).filter(x=>x.time>0);
    const zone=ecologyZoneAt(run,run.player.x,run.player.y);if(zone.id!==eco.lastZone){eco.lastZone=zone.id;eco.landmark={id:zone.id,name:zone.name,time:2.8};notice(run,`HABITAT · ${zone.name}`,'muted',1.5);}
  }

  function update(run,dt,input,equipment){
    if(run.done)return;
    const p=run.player,fins=equipment?.fins||1,boost=equipment?.boost||1,tank=equipment?.tank||1,suit=equipment?.suit||1,pressure=equipment?.pressure||1,med=equipment?.medkit||1;
    const kx=(input.right?1:0)-(input.left?1:0),ky=(input.down?1:0)-(input.up?1:0);let ax=clamp(kx+Number(input.moveX||0),-1,1),ay=clamp(ky+Number(input.moveY||0),-1,1),l=Math.hypot(ax,ay)||1;if(l>1){ax/=l;ay/=l}
    const boosting=input.boost&&p.o2>7&&!run.harpoon.fight;const speed=(100+fins*8)*(boosting?1.4+boost*.035:1);
    const moving=Math.hypot(ax,ay)>.035;
    const response=moving?(boosting?6.5:5.5):3.25;
    p.vx+=(ax*speed-p.vx)*Math.min(1,dt*response);p.vy+=(ay*speed-p.vy)*Math.min(1,dt*response);
    if(!moving){p.vx*=Math.pow(.972,dt*60);p.vy*=Math.pow(.972,dt*60);}
    p.boosting=boosting;p.moveAmount=clamp(Math.hypot(p.vx,p.vy)/Math.max(1,speed),0,1);
    const desiredFacing=Math.abs(p.vx)>.9?(p.vx<0?-1:1):(p.facing||1);p.facing=p.facing||desiredFacing;p.turnEase=(p.turnEase??p.facing)+(desiredFacing-(p.turnEase??p.facing))*Math.min(1,dt*7);if(Math.abs(p.turnEase)>.75)p.facing=p.turnEase<0?-1:1;
    p.x=clamp(p.x+p.vx*dt,run.interior?68:34,run.interior?892:926);p.y=clamp(p.y+p.vy*dt,run.interior?145:45,run.interior?478:505);p.swimPhase+=dt*(2.8+Math.hypot(p.vx,p.vy)/42);
    const depth=Math.round((p.y/540)*run.biome.max_depth);run.maxDepth=Math.max(run.maxDepth,depth);const band=depthBand(run);
    let drain=(.92+band.risk*.24)*(1-(tank-1)*.055)*(1-(pressure-1)*.035);const masterRisk=run.masterDifficulty==='abyssal'?1.24:run.masterDifficulty==='master'?1.12:1;if(run.masterDifficulty)drain*=masterRisk;if(boosting)drain*=1.78;p.o2=clamp(p.o2-dt*drain,0,100);if(p.o2<=0)p.hp=clamp(p.hp-dt*(8-(suit-1)*.5),0,100);if(med>1&&p.hp<100&&p.o2>20)p.hp=clamp(p.hp+dt*(med-1)*.17,0,100);
    if(p.hp<=0){run.done=true;notice(run,'DIVER INCAPACITATED · EMERGENCY SURFACE','danger',3);banner(run,'EMERGENCY ASCENT','HP DEPLETED · EXPEDITION ABORTED','danger',3);}
    if(!run.interior)updateLivingOcean(run,dt,input,equipment);updateFish(run,dt,equipment);if(!run.interior){updateBoss(run,dt);applyHazards(run,dt,equipment);}updateHarpoon(run,dt,input,equipment);if(!run.interior)updateEvents(run,dt);
    if(run.modifier==='rough_current'){const masterCurrent=run.masterDifficulty==='abyssal'?1.32:run.masterDifficulty==='master'?1.16:1;p.vx+=Math.sin(run.elapsed*1.17)*dt*55*masterCurrent;p.vy+=Math.cos(run.elapsed*.81)*dt*18*masterCurrent;}
    if(run.modifier==='low_visibility')run.event.visibility=Math.min(run.event.visibility,run.masterDifficulty==='abyssal'?.48:run.masterDifficulty==='master'?.57:.66);
    if(run.biome.max_depth>575&&band.id==='extreme'){const extra=Math.max(0,(run.biome.max_depth-575)/425);const seal=run.crafted?.pressure_seal?.72:1;p.o2=clamp(p.o2-dt*(.20+extra*.28)*(1-(pressure-1)*.06)*seal,0,100);if(pressure<4)p.hp=clamp(p.hp-dt*.07*extra*(4-pressure)*seal,0,100);}
    if(run.mode==='descent'){
      if(run.elapsed>=run.descent.next){run.descent.layer++;run.descent.next+=30;banner(run,`DESCENT LAYER ${run.descent.layer}`,`PRESSURE RISING · ${Math.round(run.maxDepth)}M BANKED`,'event',2.2);}
      run.maxDepth=Math.max(run.maxDepth,Math.round((p.y/540)*run.biome.max_depth + run.elapsed*(1.25+run.descent.layer*.16)));
      p.o2=clamp(p.o2-dt*Math.max(0,run.descent.layer-1)*.045,0,100);
    }
    if(run.durability<=0){p.hp=clamp(p.hp-dt*1.4,0,100);if(!run._durabilityWarn){run._durabilityWarn=true;banner(run,'EQUIPMENT FAILURE','EXPEDITION GEAR HAS REACHED 0% CONDITION','danger',3);}}
    run.sonar.cooldown=Math.max(0,run.sonar.cooldown-dt);if(run.sonar.pulse>0){run.sonar.pulse=Math.max(0,run.sonar.pulse-dt);run.sonar.lastRadius=run.sonar.radius;run.sonar.radius+=(300+(equipment?.sonar||1)*45)*dt;}
    run.spawnTimer-=dt;const capReached=cargoWeight(run)>=cargoCap(equipment)-.05,ecoCap=run.ecology?.personality?.id==='migration'?30:run.ecology?.personality?.id==='silence'?13:24;if(!run.interior&&run.spawnTimer<=0&&run.fish.length<ecoCap&&run.totalSpawned<82&&!capReached){const zone=ecologyZoneAt(run,run.player.x+rand(-260,260),run.player.y),hab=pick(zone.habitats||['open']);const avoidIds=Object.entries(run.ecology?.harvest||{}).filter(([,n])=>Number(n)>=3).map(([id])=>id);const f=spawnFish(run.biome.id,run.level,equipment?.sonar||1,{depthRatio:band.ratio,habitat:hab,zoneHabitats:zone.habitats,x:clamp(run.player.x+rand(-360,360),55,905),timeOfDay:run.timeOfDay,weather:run.weather,populationScale:run.ecology?.personality?.density||1,avoidIds});if(f){run.fish.push(f);run.totalSpawned++;}run.spawnTimer=rand(3.4,6.4)/(run.ecology?.personality?.density||1);}
    for(const t of run.treasures)t.phase+=dt;p.recoil=Math.max(0,(p.recoil||0)-dt);run.elapsed+=dt;run.shake=Math.max(0,run.shake-dt*19);run.flash=Math.max(0,run.flash-dt*2.5);p.damageFlash=Math.max(0,p.damageFlash-dt*3);if(run.notice)run.notice.time=Math.max(0,run.notice.time-dt);
    const swimSpeed=Math.hypot(p.vx,p.vy),speedZoom=clamp((swimSpeed-70)/320,0,.045),bossZoom=run.boss?.activeFish?.82:null,fightZoom=run.harpoon.fight?(run.harpoon.fight.fish.legendary?.87:.94):null;
    run.camera.targetZoom=bossZoom??fightZoom??(1-speedZoom);
    run.camera.zoom+=(run.camera.targetZoom-run.camera.zoom)*Math.min(1,dt*3.2);
    const aimAheadX=clamp((input.aimX??p.x)-p.x,-220,220)*.18,aimAheadY=clamp((input.aimY??p.y)-p.y,-160,160)*.10;
    const velocityAheadX=p.vx*.16,velocityAheadY=p.vy*.10;
    const camTargetX=p.x-480+aimAheadX+velocityAheadX,camTargetY=p.y-270+aimAheadY+velocityAheadY;
    run.camera.x+=(camTargetX-run.camera.x)*Math.min(1,dt*1.65);run.camera.y+=(camTargetY-run.camera.y)*Math.min(1,dt*1.25);
  }

  function harpoon(run,target,equipment){
    if(!run||!target)return{ok:false,reason:'no-run'};const h=run.harpoon;if(h.fight){notice(run,'CONTROL THE LINE · SPACE TO REEL','warning',.9);return{ok:false,reason:'fight'};}if(h.hooked){notice(run,'REEL IN THE CURRENT CATCH FIRST','warning',.9);return{ok:false,reason:'reeling'};}if(h.projectile||h.cooldown>0)return{ok:false,reason:'cooldown'};
    const p=run.player;let dx=target.x-p.x,dy=target.y-p.y,len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;p.aimAngle=Math.atan2(dy,dx);p.recoil=.16;const level=equipment?.harpoon||1,precision=run.loadout?.harpoonType==='precision',heavy=run.loadout?.harpoonType==='heavy',range=(155+level*21)*(precision?1.18:heavy?.9:1),speed=(525+level*25)*(precision?1.15:heavy?.88:1),muzzleX=p.x+Math.cos(p.aimAngle)*25,muzzleY=p.y+Math.sin(p.aimAngle)*25;
    h.projectile={x:muzzleX,y:muzzleY,dx,dy,speed,range,travel:0,angle:p.aimAngle};h.cooldown=heavy?.42:precision?.23:.28;h.lastResult='fired';run.stats.shots++;if(run.ecology)run.ecology.noise=Math.max(run.ecology.noise,.92);burst(run,muzzleX,muzzleY,4,'#e5ffff',.35);scatterNearby(run,{x:muzzleX,y:muzzleY},110,.38);return{ok:true};
  }

  function releaseLastCatch(run){
    if(!run?.recentCatch||Number(run.recentCatch.releaseUntil||0)<run.elapsed){notice(run,'NO RECENT CATCH AVAILABLE TO RELEASE','muted',.9);return false}
    const idx=[...run.catches].map((x,i)=>({x,i})).reverse().find(q=>q.x.kind==='fish'&&q.x.id===run.recentCatch.id)?.i;if(idx==null){notice(run,'CATCH ALREADY STORED','muted',.9);return false}
    const item=run.catches.splice(idx,1)[0],src=window.RepoDiverData.fishById(item.id);if(src){const f=spawnFish(run.biome.id,run.level,run.equipment?.sonar||1,{source:src,x:clamp(run.player.x+rand(45,85),55,905),y:clamp(run.player.y+rand(-35,35),60,490),timeOfDay:run.timeOfDay,weather:run.weather});if(f){f.catchWeight=item.weight;f.variant=item.variant||'normal';f.awareness='fleeing';f.awarenessTime=1.4;f.vx=Math.abs(f.vx)+.8;run.fish.push(f)}}
    if(run.ecology?.harvest?.[item.id])run.ecology.harvest[item.id]=Math.max(0,Number(run.ecology.harvest[item.id])-1);run.recentCatch={...item,serial:(run.recentCatch.serial||0)+1,released:true,releaseUntil:0};burst(run,run.player.x+24,run.player.y,9,'#93e8e0',.65);notice(run,`RELEASED ${item.name.toUpperCase()} · RESEARCH / CONSERVATION LOGGED`,'success',1.9);return true;
  }

  function interact(run,equipment){
    if(!run)return null;const p=run.player;let nearest=null,nearestDistance=Infinity;for(const t of run.treasures){if(t.opened)continue;const d=dist(t,p);if(d<nearestDistance){nearest=t;nearestDistance=d;}}
    if(!nearest||nearestDistance>=72){notice(run,'NO SALVAGE IN REACH','muted',.8);return null;}
    const salvage=equipment?.salvage||1;if(salvage<(nearest.required||1)){notice(run,`SALVAGE RIG LV.${nearest.required} REQUIRED`,'warning',1.6);return null;}
    if(!canCarry(run,nearest,equipment)){notice(run,`CARGO FULL · ${itemWeight(nearest).toFixed(1)}KG NEEDED`,'danger',1.8);return null;}
    nearest.opened=true;const q=clamp(1+Math.floor(Math.random()*3)+(salvage>3?1:0),1,4);run.catches.push({id:nearest.id,q,kind:'treasure',name:nearest.name,rarity:nearest.rarity,weight:Number(nearest.weight||1)});run.flash=1;burst(run,nearest.x,nearest.y,20,'#ffd977',1);notice(run,`SALVAGE RECOVERED · ${nearest.name.toUpperCase()}`,'success',1.8);return nearest;
  }

  window.RepoDiverEngine={createRun,update,harpoon,interact,useSonar,triggerEvent,triggerLivingEvent,forceLegendary,forceBoss,depthBand,ecologyZoneAt,clamp,rand,pick,cargoCap,cargoWeight,canCarry,spawnFish,releaseLastCatch,notice,banner};
})();
