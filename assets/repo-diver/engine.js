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

  function chooseFishSource(biome, level = 1, sonar = 1, opts = {}) {
    const D = window.RepoDiverData;
    const poolAll = D.fishForBiome(biome);
    let pool = poolAll.filter(x => opts.allowMythic || x.rarity !== 'mythic');
    if (opts.behavior) pool = pool.filter(x => x.behavior === opts.behavior);
    if (opts.minRank) pool = pool.filter(x => rarityRank(x.rarity) >= opts.minRank);
    if (opts.maxRank) pool = pool.filter(x => rarityRank(x.rarity) <= opts.maxRank);
    if (opts.depthRatio != null) {
      const r = opts.depthRatio;
      const atDepth = pool.filter(x => r >= (x.depth_min ?? 0) - .08 && r <= (x.depth_max ?? 1) + .08);
      if (atDepth.length) pool = atDepth;
    }
    if (!pool.length) pool = poolAll.filter(x => opts.allowMythic || x.rarity !== 'mythic');
    const rarityW = { common: 43, uncommon: 27, rare: 11, epic: 3.8, legendary: .9, mythic: .01 };
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
      return rarityW[x.rarity] * sonarBoost * depthMatch * nightBoost * weatherBoost;
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
      think:rand(.4,1.6), dodge:0, hooked:false, hitFlash:0,
      hidden:src.behavior==='ambush', burrow:src.behavior==='bottom' && Math.random()<.25,
      catchWeight:actualWeight, visualScale,
      groupId: opts.groupId ?? (src.behavior==='school' ? Math.floor(rand(1,99999)) : null),
      legendary:!!opts.legendary,
      sonarReveal:0,
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
    const biome = D.biome(opts.biome);
    const equipment=opts.equipment||{};
    const boat=opts.boat||{};
    const timeOfDay=opts.timeOfDay==='night'?'night':'day';
    const weather=opts.weather||'clear';
    const fishCount = 13 + Math.min(9, Math.floor((opts.level || 1) / 5)) + Math.min(5, ((equipment.lure || 1) - 1)) + Math.min(3,Math.floor(Math.max(0,(boat.sonar||1)-1)/2));
    const run = {
      biome, level:opts.level||1, equipment, boat, timeOfDay, weather,
      fish:[], treasures:makeTreasures(biome,equipment,boat), hazards:makeHazards(biome.id),
      player:{x:105,y:95,vx:0,vy:0,hp:100,o2:100,swimPhase:0,aimAngle:0,damageFlash:0},
      particles:[], catches:[], elapsed:0,maxDepth:0,shake:0,flash:0,done:false,
      spawnTimer:rand(2.8,5), totalSpawned:0,
      notice:{text:'EXPEDITION STARTED · DESCEND AND SCOUT THE WATER',type:'info',time:2.8},
      eventBanner:null,
      event:{timer:rand(24,38),active:null,time:0,used:0,currentForce:0,visibility:1},
      legendary:{triggered:false,activeFish:null,caught:false},
      sonar:{cooldown:0,pulse:0,radius:0,lastRadius:0},
      harpoon:{cooldown:0,projectile:null,hooked:null,fight:null,lastResult:'ready'},
      camera:{x:0,y:0,zoom:1,targetZoom:1},
      stats:{shots:0,hits:0,misses:0,predatorHits:0,hazardsHit:0,sonars:0},
      recentCatch:null
    };
    for(let i=0;i<fishCount;i++){
      const f=spawnFish(biome.id,run.level,equipment.sonar||1,{depthRatio:rand(.05,.92),timeOfDay,weather});
      if(f){run.fish.push(f);run.totalSpawned++;}
    }
    // Ensure the opening water feels alive without dumping high-value fish at the player.
    if(run.fish.filter(f=>f.behavior==='school').length<3) spawnSchool(run,4,1,2);
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
      f.think-=dt;
      const d=dist(f,p), dx=(p.x-f.x)/(d||1), dy=(p.y-f.y)/(d||1);
      let targetSpeed=.28+(f.speed||1)*.34+rank*.03;
      const behavior=f.behavior||'wander';

      if(f.think<=0){
        f.think=rand(.45,1.65);
        if(behavior==='darting'||behavior==='nervous'){f.vx+=rand(-.65,.65);f.vy+=rand(-.5,.5);}
        if(behavior==='wander'){f.vy+=rand(-.18,.18);}
        if(behavior==='bottom'){f.vx+=rand(-.25,.25);f.vy+=(475-f.y)*.0015;}
      }

      if(behavior==='school'){
        const center=nearestSchoolMate(run,f);
        if(center){f.vx+=(center.x-f.x)*dt*.0027;f.vy+=(center.y-f.y)*dt*.0027;}
        if(d<105){f.vx-=dx*dt*.65;f.vy-=dy*dt*.42;}
      }else if(behavior==='nervous'||behavior==='darting'){
        if(d<(behavior==='nervous'?175:135)){f.vx-=dx*dt*(1.55+rank*.08);f.vy-=dy*dt*.95;targetSpeed*=1.22;}
      }else if(behavior==='curious'){
        if(d<230&&d>80){f.vx+=dx*dt*.35;f.vy+=dy*dt*.25;}
        if(d<65){f.vx-=dx*dt*.8;f.vy-=dy*dt*.45;}
      }else if(behavior==='territorial'){
        const homeDist=Math.hypot(f.x-f.homeX,f.y-f.homeY);
        if(d<120){f.vx-=dx*dt*.45;f.vy-=dy*dt*.25;}
        else if(homeDist>90){f.vx+=(f.homeX-f.x)*dt*.003;f.vy+=(f.homeY-f.y)*dt*.003;}
      }else if(behavior==='ambush'){
        f.hidden=f.sonarReveal<=0&&d>95&&f.hitFlash<=0;
        if(!f.hidden&&d<150){f.vx+=dx*dt*1.0;f.vy+=dy*dt*.65;targetSpeed*=1.28;}
      }else if(behavior==='predator'||behavior==='legendary'){
        f.hidden=false;
        if(d<260){f.vx+=dx*dt*(behavior==='legendary'?1.25:.82);f.vy+=dy*dt*(behavior==='legendary'?.92:.58);targetSpeed*=behavior==='legendary'?1.35:1.18;}
        if(d<43*(f.visualScale||1)&&f.attackCooldown<=0){
          const suit=equipment?.suit||1;
          const dmg=(behavior==='legendary'?12:6.2)+(f.visualScale||1)*2.2;
          p.hp=clamp(p.hp-dmg*(1-(suit-1)*.055),0,100);p.damageFlash=1;f.attackCooldown=1.6;run.shake=8;run.stats.predatorHits++;
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
      f.x+=f.vx*72*dt;
      f.y+=f.vy*58*dt+Math.sin(f.phase)*(.9+(f.visualScale||1))*dt;
      if(behavior==='bottom') f.y=clamp(f.y,350,500); else f.y=clamp(f.y,55,500);
      if(f.x<35){f.x=35;f.vx=Math.abs(f.vx);} if(f.x>925){f.x=925;f.vx=-Math.abs(f.vx);}
      if(f.y<55){f.y=55;f.vy=Math.abs(f.vy);} if(f.y>500){f.y=500;f.vy=-Math.abs(f.vy);}
    }
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
        if(h.type==='vent') dmg=5.5*(1-(thermal-1)*.13);
        else if(h.type==='jelly') dmg=4.1;
        else if(h.type==='toxic') dmg=3.8;
        else if(h.type==='shard'||h.type==='coral'||h.type==='debris'||h.type==='rubble') dmg=4.8;
        if(dmg>0){p.hp=clamp(p.hp-dmg*(1-(suit-1)*.045),0,100);p.damageFlash=1;h.hitCooldown=1.5;run.shake=5;run.stats.hazardsHit++;notice(run,`${scene.label} HAZARD`,'warning',.8);}
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
    const item={id:fish.id,q,kind:'fish',name:fish.name,rarity:fish.rarity,weight:Number(fish.catchWeight||fish.weight||1),baseWeight:Number(fish.weight||1),legendary:!!fish.legendary};
    run.catches.push(item);run.recentCatch={...item,serial:(run.recentCatch?.serial||0)+1};
    const index=run.fish.indexOf(fish);if(index>=0)run.fish.splice(index,1);
    burst(run,run.player.x+10,run.player.y,18,fish.color||'#d8fbff',1);run.flash=1;
    run.harpoon.hooked=null;run.harpoon.fight=null;run.harpoon.cooldown=.55;run.harpoon.lastResult='caught';
    if(fish.legendary){run.legendary.caught=true;run.legendary.activeFish=null;banner(run,'LEGENDARY CATCH',`${fish.name.toUpperCase()} · ${item.weight.toFixed(2)}KG`,'legendary',4.5);}
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
    fish.hitFlash=1;fish.hp-=1;run.shake=3;run.stats.hits++;burst(run,fish.x,fish.y,10,'#d8fbff',.75);scatterNearby(run,fish,110,.5);
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
      fight.progress+=dt*((.72+(equipment?.harpoon||1)*.05)/(1+rank*.10))*sweet*(fish.legendary?.58:1);
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

  function updateEvents(run,dt){
    run.event.timer-=dt;
    if(run.event.active){run.event.time-=dt;if(run.event.time<=0){run.event.active=null;run.event.currentForce=0;run.event.visibility=1;run.event.timer=rand(28,46);}}
    else if(run.event.timer<=0)triggerEvent(run);
    if(run.eventBanner)run.eventBanner.time=Math.max(0,run.eventBanner.time-dt);
    maybeLegendary(run);
  }

  function update(run,dt,input,equipment){
    if(run.done)return;
    const p=run.player,fins=equipment?.fins||1,boost=equipment?.boost||1,tank=equipment?.tank||1,suit=equipment?.suit||1,pressure=equipment?.pressure||1,med=equipment?.medkit||1;
    let ax=(input.right?1:0)-(input.left?1:0),ay=(input.down?1:0)-(input.up?1:0),l=Math.hypot(ax,ay)||1;ax/=l;ay/=l;
    const boosting=input.boost&&p.o2>7&&!run.harpoon.fight;const speed=(100+fins*8)*(boosting?1.4+boost*.035:1);
    p.vx+=(ax*speed-p.vx)*Math.min(1,dt*5.1);p.vy+=(ay*speed-p.vy)*Math.min(1,dt*5.1);p.x=clamp(p.x+p.vx*dt,34,926);p.y=clamp(p.y+p.vy*dt,45,505);p.swimPhase+=dt*(3.7+Math.hypot(p.vx,p.vy)/55);
    const depth=Math.round((p.y/540)*run.biome.max_depth);run.maxDepth=Math.max(run.maxDepth,depth);const band=depthBand(run);
    let drain=(.92+band.risk*.24)*(1-(tank-1)*.055)*(1-(pressure-1)*.035);if(boosting)drain*=1.78;p.o2=clamp(p.o2-dt*drain,0,100);if(p.o2<=0)p.hp=clamp(p.hp-dt*(8-(suit-1)*.5),0,100);if(med>1&&p.hp<100&&p.o2>20)p.hp=clamp(p.hp+dt*(med-1)*.17,0,100);
    if(p.hp<=0){run.done=true;notice(run,'DIVER INCAPACITATED · EMERGENCY SURFACE','danger',3);banner(run,'EMERGENCY ASCENT','HP DEPLETED · EXPEDITION ABORTED','danger',3);}
    updateFish(run,dt,equipment);applyHazards(run,dt,equipment);updateHarpoon(run,dt,input,equipment);updateEvents(run,dt);
    run.sonar.cooldown=Math.max(0,run.sonar.cooldown-dt);if(run.sonar.pulse>0){run.sonar.pulse=Math.max(0,run.sonar.pulse-dt);run.sonar.lastRadius=run.sonar.radius;run.sonar.radius+=(300+(equipment?.sonar||1)*45)*dt;}
    run.spawnTimer-=dt;const capReached=cargoWeight(run)>=cargoCap(equipment)-.05;if(run.spawnTimer<=0&&run.fish.length<24&&run.totalSpawned<82&&!capReached){const f=spawnFish(run.biome.id,run.level,equipment?.sonar||1,{depthRatio:band.ratio,timeOfDay:run.timeOfDay,weather:run.weather});if(f){run.fish.push(f);run.totalSpawned++;}run.spawnTimer=rand(2.8,5.1);}
    for(const t of run.treasures)t.phase+=dt;run.elapsed+=dt;run.shake=Math.max(0,run.shake-dt*19);run.flash=Math.max(0,run.flash-dt*2.5);p.damageFlash=Math.max(0,p.damageFlash-dt*3);if(run.notice)run.notice.time=Math.max(0,run.notice.time-dt);
    run.camera.targetZoom=run.harpoon.fight?(run.harpoon.fight.fish.legendary?.88:.94):(run.legendary.activeFish?.hooked?.9:1);run.camera.zoom+=(run.camera.targetZoom-run.camera.zoom)*Math.min(1,dt*2.8);run.camera.x+=(p.x-480-run.camera.x)*Math.min(1,dt*.8);run.camera.y+=(p.y-270-run.camera.y)*Math.min(1,dt*.55);
  }

  function harpoon(run,target,equipment){
    if(!run||!target)return{ok:false,reason:'no-run'};const h=run.harpoon;if(h.fight){notice(run,'CONTROL THE LINE · SPACE TO REEL','warning',.9);return{ok:false,reason:'fight'};}if(h.hooked){notice(run,'REEL IN THE CURRENT CATCH FIRST','warning',.9);return{ok:false,reason:'reeling'};}if(h.projectile||h.cooldown>0)return{ok:false,reason:'cooldown'};
    const p=run.player;let dx=target.x-p.x,dy=target.y-p.y,len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;p.aimAngle=Math.atan2(dy,dx);const level=equipment?.harpoon||1,range=155+level*21,speed=525+level*25,muzzleX=p.x+Math.cos(p.aimAngle)*25,muzzleY=p.y+Math.sin(p.aimAngle)*25;
    h.projectile={x:muzzleX,y:muzzleY,dx,dy,speed,range,travel:0,angle:p.aimAngle};h.cooldown=.28;h.lastResult='fired';run.stats.shots++;burst(run,muzzleX,muzzleY,4,'#e5ffff',.35);scatterNearby(run,{x:muzzleX,y:muzzleY},72,.15);return{ok:true};
  }

  function interact(run,equipment){
    if(!run)return null;const p=run.player;let nearest=null,nearestDistance=Infinity;for(const t of run.treasures){if(t.opened)continue;const d=dist(t,p);if(d<nearestDistance){nearest=t;nearestDistance=d;}}
    if(!nearest||nearestDistance>=72){notice(run,'NO SALVAGE IN REACH','muted',.8);return null;}
    const salvage=equipment?.salvage||1;if(salvage<(nearest.required||1)){notice(run,`SALVAGE RIG LV.${nearest.required} REQUIRED`,'warning',1.6);return null;}
    if(!canCarry(run,nearest,equipment)){notice(run,`CARGO FULL · ${itemWeight(nearest).toFixed(1)}KG NEEDED`,'danger',1.8);return null;}
    nearest.opened=true;const q=clamp(1+Math.floor(Math.random()*3)+(salvage>3?1:0),1,4);run.catches.push({id:nearest.id,q,kind:'treasure',name:nearest.name,rarity:nearest.rarity,weight:Number(nearest.weight||1)});run.flash=1;burst(run,nearest.x,nearest.y,20,'#ffd977',1);notice(run,`SALVAGE RECOVERED · ${nearest.name.toUpperCase()}`,'success',1.8);return nearest;
  }

  window.RepoDiverEngine={createRun,update,harpoon,interact,useSonar,triggerEvent,forceLegendary,depthBand,clamp,rand,pick,cargoCap,cargoWeight,canCarry,spawnFish,notice,banner};
})();
