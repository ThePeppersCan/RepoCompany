(function(root){
 'use strict';
 const bosses=['kiln','admiral','briar','prism','clock','star','cantor','duelist','beekeeper','magistrate','railmaster','oracle'];
 const key=n=>'m'+String(n).padStart(3,'0'),vals=o=>Object.values(o||{}),size=o=>Object.keys(o||{}).length;
 function createTracker(s,history={},powerups={}){
  const facts={},run={boss:null,majors:{},stages:{},parries:0,clean:0,dodges:0,momentum:0,kills:0,healed:0,cleanBosses:0,cast:0,seenHits:new WeakSet(),blades:new WeakMap(),attacks:new WeakMap(),fields:new WeakMap(),powerups,events:0};
  const award=(n,yes=true)=>{if(yes)facts[key(n)]=1;},max=(metric,n)=>{facts[metric]=Math.max(facts[metric]||0,Math.floor(n||0));};
  function boss(){const b=s.boss;if(b?.hp>0&&b.major&&run.boss?.id!==b.id)run.boss={id:b.id,type:b.bossType,final:!!b.finalBoss,hurt:false,falls:b.finale?.falls||0,counters:{},recoveries:{},clean:0,congee:0,refund:0,actions:{},openings:{},escapes:{}};return run.boss;}
  function action(kind,enemy){const b=boss();if(!b||!enemy||enemy.id!==b.id)return;b.actions[kind]=s.time;const times=['dodge','dash','finisher','special'].map(k=>b.actions[k]);award(50,times.every(Number.isFinite)&&Math.max(...times)-Math.min(...times)<=20);}
  function victory(type,final=false){const b=run.boss;
   if(final){if(b?.final){award(97,!b.hurt&&(s.boss?.finale?.falls||0)===b.falls);}return;}
   const index=bosses.indexOf(type);if(index<0)return;award(index+1);run.majors[type]=true;max('major_bosses_in_run',size(run.majors));
   if(b?.type===type){const required=[['heat'],['chain'],['bud'],['lens'],['silence'],['tether'],['answer'],['return'],['brood','sting'],['decree'],['switch'],['refuge']][index];award(index+13,required.every(k=>k==='bud'?(b.counters.bud0||b.counters.bud1):b.counters[k]));award(91,!b.hurt);run.cleanBosses=b.hurt?0:run.cleanBosses+1;max('no_hit_boss_streak',run.cleanBosses);award(93,size(b.recoveries)>=3);award(59,s.build.keystone==='precision'&&b.clean>=10);award(60,s.build.keystone==='eclipse'&&b.eclipse);}
   award(57,s.build.keystone==='glass');award(58,s.build.keystone==='duellist');
   if(s.build.ability){(history.specials||={})[s.build.ability]=true;max('specials_boss_won',size(history.specials));if(s.build.branch){const branches=(history.branches||={})[s.build.ability]||=(({}));branches[s.build.branch]=true;award(62,size(branches)>=2);}}
   if(run.replacement){award(65,!!s.relics[run.replacement]);run.replacement=null;}
   award(99,s.mode==='endless'&&s.finaleKills>0);run.boss=null;
  }
  function event(e){if(s.practice)return;boss();const b=run.boss;
   if(e.type==='achievementDamage'){
    run.damageEnemy=e.enemy;run.damageAt=s.time;
    if(e.impact?.weapon==='special'){action('special',e.enemy);if(e.impact.achievementEclipse&&b&&e.enemy.id===b.id)b.eclipse=true;}
    if(e.impact?.active&&e.enemy.hp<=0&&run.tide?.marked.has(e.enemy.id)&&e.enemy.buildMarkUntil>s.time){run.tide.killed.add(e.enemy.id);award(42,run.tide.killed.size>=3);}
   }
   if(e.type==='achievementProjectile'){const shot=e.shot,enemy=e.enemy;if(shot.type==='espresso'&&shot.attack){let ids=run.projectileHits||=(new WeakMap()),set=ids.get(shot);if(!set)ids.set(shot,set=new Set());set.add(enemy.id);award(37,set.size>=5);}if(shot.returnBlade&&enemy.major){let passes=run.blades.get(shot);if(!passes)run.blades.set(shot,passes={});const pair=passes[enemy.id]||=( {} );pair[shot.recalling?'back':'out']=true;award(49,pair.back&&pair.out);}}
   if(e.type==='achievementArea'){
    const affected=e.affected||[];if(e.eclipse&&b&&affected.some(a=>a.id===b.id))b.eclipse=true;
    if(e.kind==='bell'&&e.phase==='counter')award(39,affected.some(a=>a.id===e.attacker));
    if(e.kind==='garden'){const casts=run.gardenCasts||={},g=casts[e.cast]||=( {opening:new Set(),pulse:new Set()} );if(e.phase==='opening'||e.phase==='pulse')for(const a of affected)g[e.phase].add(a.id);else if(e.phase==='bloom'){award(40,affected.some(a=>g.opening.has(a.id)&&g.pulse.has(a.id)));delete casts[e.cast];}}
    if(e.kind==='comet')award(41,affected.some(a=>a.major&&a.staggered));
    if(e.kind==='clock'&&e.phase==='closing')award(43,e.field?.capacity>0&&e.field.stored>=e.field.capacity&&affected.length>0);
    if(e.kind==='fondue')award(48,affected.some(a=>a.killed));
    award(68,['garden','clock'].includes(e.kind)&&e.field?.achievementTravel>=80&&affected.length>0);
   }
   if(e.type==='achievementChai'){const casts=run.chaiCasts||={},set=casts[e.cast]||=(new Set());for(const h of e.cleared)set.add(h);award(38,set.size>=5);for(const id of Object.keys(casts))if(Number(id)<e.cast-1)delete casts[id];}
   if(e.type==='achievementHealing'&&e.amount>0){if(e.kind==='soup'){run.healed+=e.amount;max('dodge_healing',run.healed);}if(e.kind==='congee'&&b&&!b.final){b.congee++;award(45,b.congee>=3);}}
   if(e.type==='achievementRefund'&&s.boss?.hp>0){const target=run.refundBoss===s.boss.id?run.refund||0:0;run.refundBoss=s.boss.id;run.refund=target+e.amount;award(47,run.refund>=5);}
   if(e.type==='hurt'&&e.amount>0){run.clean=run.dodges=0;if(b)b.hurt=true;if(run.night)run.night.hurt=true;}
   if(e.type==='bossCounterplay'&&b&&b.type===e.id)b.counters[e.key]=true;
   if(e.type==='bossDown'&&e.major)victory(e.id||b?.type,!!e.finale);
   if(e.type==='finaleDown')victory(b?.type,true);
   if(e.type==='banished'){const f=e.foe;if(f?.type==='boss'&&!f.major&&!f.finalBoss){award(76);(history.demibosses||={})[f.bossType]=true;max('demiboss_types',size(history.demibosses));}else if(f&&!f.summoned&&!['boss','sigil','bossObject'].includes(f.type)&&!f.major&&!f.finalBoss)run.kills++;}
   if(e.type==='attackStart'){if(run.attack&&!run.attack.landed)run.clean=0;run.attack={clean:!!e.clean,landed:false};}
   if(e.type==='attackImpact'&&e.clean){/* Landed attacks are counted through the strike hook, never pellets. */}
   if(e.type==='specialReady')run.doubleCast=null;
   if(e.type==='specialCast'){award(66,e.achievementBank>=3);if(e.achievementCharges===2)run.doubleCast={serial:s.build.casts};else if(e.achievementCharges===1&&run.doubleCast?.serial===s.build.casts-1)award(73);else run.doubleCast=null;if(s.build.ability==='tide')run.tide={marked:new Set(s.enemies.filter(e=>e.buildMarkUntil>s.time).map(e=>e.id)),killed:new Set()};}
   if(e.type==='parry'){run.parries+=e.count||0;max('parries_in_run',run.parries);award(30,e.count>=5);}
   if(e.type==='perfectDodge'){award(31);run.dodges++;max('perfect_dodge_streak',run.dodges);(run.dodgeTypes||={})[e.source]=true;award(32,['projectile','charge','ground'].every(k=>run.dodgeTypes[k]));if(b&&e.owner===b.type)action('dodge',s.boss);run.lastDodgeCount=s.perfectDodges;}
   if(e.type==='recoveryEarned'&&b&&!b.final)b.recoveries[s.boss?.phase]=true;
   if(e.type==='majorCounter'&&b){b.openings[e.kind]=true;award(94,['hand','heart','crown'].every(k=>b.openings[k]));}
   if(e.type==='relicBought'){award(63);if(e.replace){if(run.replacement===e.replace)run.replacement=null;else run.replacement=e.id;}}
   if(e.type==='arenaEvent')run.night={id:e.id,hurt:false};
   if(e.type==='arenaEventComplete'){if(run.night?.id===e.id){award(78,e.id==='lanternfall'&&!run.night.hurt);(history.nights||={})[e.id]=true;max('strange_nights',size(history.nights));}run.night=null;}
  }
  function main(strike,e){if(s.practice)return;boss();
   if(!run.seenHits.has(strike)){run.seenHits.add(strike);run.clean=strike.clean?run.clean+1:0;if(strike.clean)run.cleanHits=(run.cleanHits||0)+1;max('clean_attack_streak',run.clean);if(run.attack)run.attack.landed=true;if(strike.dash)run.dashHits=(run.dashHits||0)+1;}
   if(strike.clean&&run.boss?.id===e.id){let set=run.boss.cleanStrikes||=(new WeakSet());if(!set.has(strike)){set.add(strike);run.boss.clean++;}}
   if(strike.step===3){award(26);let hit=run.attacks.get(strike);if(!hit)run.attacks.set(strike,hit=new Set());hit.add(e.id);award(36,hit.size>=5);action('finisher',e);}
   if(strike.dash)action('dash',e);
   if(e.hp<=0&&run.tide?.marked.has(e.id)&&e.buildMarkUntil>s.time){run.tide.killed.add(e.id);award(42,run.tide.killed.size>=3);}
  }
  function sample(dt=0){if(s.practice)return facts;boss();
   max('clean_hits_in_run',run.cleanHits||0);max('dash_strikes_in_run',run.dashHits||0);max('main_rank',s.weapons[s.mainWeapon]);max('perk_slots',size(s.build.perks));max('special_rank',s.build.abilityRank);max('relics_carried',size(s.relics));max('run_level',s.level);max('run_kills',run.kills);max('run_seconds',s.runTime);
   award(51,s.evolutions.espresso);award(52,s.evolutions.baguette);award(56,!!s.build.branch);
   if(s.status==='playing'&&!s.transition&&s.enemies.some(e=>e.hp>0)){run.momentum=s.momentum>=3?run.momentum+dt:0;max('momentum_seconds',run.momentum);}else if(s.momentum<3)run.momentum=0;
   if(s.world?.id!=null&&!s.world.arena){run.stages[s.world.id]=true;max('run_stages',size(run.stages));if(s.world.theme){(history.themes||={})[s.world.theme]=true;max('world_themes',size(history.themes));}}
   max('pantry_rank',Math.max(0,...vals(powerups)));award(74,['health','power','magnet'].every(k=>powerups[k]>=1));
   const plan=s.boss?.majorPlan,signature=plan?.signature,b0=run.boss;if(signature?.kind==='shelter'&&b0){const age=plan.duration-s.boss.majorClock,shelter=plan.shelter;if(run.shelterPlan!==plan){run.shelterPlan=plan;run.sheltered=false;run.shelterValid=true;run.shelterHp=s.player.hp;}if(age>=signature.start&&age<signature.end){run.sheltered=true;if(Math.hypot(s.player.x-shelter.x,s.player.y-shelter.y)>shelter.r||s.player.hp<run.shelterHp)run.shelterValid=false;run.shelterHp=s.player.hp;}if(age>=signature.end&&run.sheltered&&run.shelterValid)b0.counters.refuge=true;}
   const f=s.boss?.finale,b=run.boss;if(f&&b){if(f.falls>b.falls)b.hurt=true;if(f.escape&&f.leg>=f.routeLength&&!f.route&&f.clean)b.escapes[s.boss.phase]=true;award(95,!!b.escapes[2]);award(96,b.escapes[2]&&b.escapes[3]);}
   if(s.status==='won'&&s.mode==='mora'&&s.finaleKills>0){award(86);award(87,s.mainWeapon==='espresso');award(88,s.mainWeapon==='baguette');award(89,!s.merchant.spent);award(90,['health','power','magnet'].every(k=>!powerups[k]));}
   award(98,s.mode==='endless'&&s.finaleKills>0&&!s.boss&&!!s.transition);if(s.mode==='endless')max('endless_finale_wins',s.finaleKills);
   return facts;
  }
  return {state:s,facts,run,history,award,max,event,main,sample,boss,action};
 }
 function instrument(modules,publish,historyProvider=()=>({})){const trackers=new WeakMap(),{Engine,Builds,Relics,Recovery}=modules;let options={};
  function wrap(o,k,hook){if(!o?.[k]||o[k].repoAchievementWrapped)return;const old=o[k];function fn(...args){return hook.call(this,old,args);}fn.repoAchievementWrapped=true;o[k]=fn;}
  wrap(Builds,'create',(original,[api])=>{const s=api.state,t=createTracker(s,historyProvider(),options.powerups||{});trackers.set(s,t);const originalEvent=api.event;api.event=(type,data={})=>{if(type.startsWith('achievement'))t.event({type,...data});return originalEvent(type,data);};const build=original(api);
   wrap(build,'landed',(fn,args)=>{const result=fn.apply(build,args);if(t.run.damageAt===s.time&&t.run.damageEnemy===args[1]){t.main(...args);t.run.damageEnemy=null;}return result;});
   wrap(build,'defend',(fn,args)=>{const guard=s.build.guard,ward=s.build.ward,result=fn.apply(build,args);t.award(46,guard<=0&&ward>0&&args[0]>0&&result===0);return result;});return build;
  });
  wrap(Relics,'create',(original,[api])=>{const t=trackers.get(api.state),s=api.state;const hit=api.hit;let sourceEnemy;
   api.hit=(e,...a)=>{const hp=e.hp,r=hit(e,...a);if(sourceEnemy&&sourceEnemy!==e&&hp>0&&e.hp<=0)t.award(69);return r;};const relic=original(api);
   wrap(relic,'landed',(fn,args)=>{sourceEnemy=args[1];const r=fn.apply(relic,args);sourceEnemy=null;return r;});
   wrap(relic,'finisher',(fn,args)=>{const debt=s.relicState.debt,shards=s.relicState.shards,r=fn.apply(relic,args);t.award(67,shards===3&&s.relicState.shards===0);t.award(70,debt>0&&s.relicState.debt===0&&s.time<s.relicState.debtUntil);return r;});
   wrap(relic,'preserve',(fn,args)=>{const r=fn.apply(relic,args);if(r)t.run.preservedBoss=t.boss()?.id;return r;});
   wrap(relic,'update',(fn,args)=>{const amount=s.relicState.preserved,hp=s.player.hp,r=fn.apply(relic,args);t.award(71,amount>0&&s.relicState.preserved===0&&s.player.hp>hp&&t.boss()?.id===t.run.preservedBoss);return r;});return relic;
  });
  wrap(Engine,'create',(fn,args)=>{options=args[0]||{};const game=fn.apply(Engine,args),s=game.state,t=trackers.get(s);if(!t)return game;
   const push=s.events.push;s.events.push=function(...events){for(const e of events)try{if(!e.type.startsWith('achievement')||!['achievementArea','achievementChai','achievementRefund'].includes(e.type)&&(e.type!=='achievementHealing'||e.kind==='soup'))t.event(e);}catch{}return push.apply(this,events);};
   wrap(game,'update',(update,args)=>{const before=s.time,r=update.apply(game,args);try{publish(t.sample(s.time-before),s,t);}catch{}return r;});
   wrap(game,'reroll',(reroll,args)=>{const r=reroll.apply(game,args);if(r&&s.relics.marmalade&&args[0])t.run.kept=args[0];return r;});
   wrap(game,'choose',(choose,args)=>{const r=choose.apply(game,args);if(r&&args[0]===t.run.kept)t.award(72);t.run.kept=null;return r;});
   return game;
  });return {trackers};
 }
 if(typeof module==='object'&&module.exports){module.exports={createTracker,instrument};return;}
 const client=root.repoGameAchievements;let identity,history={},installed=false,lastSaved=0;const pendingRuns=new Set();
 const storageKey=()=>`repo-morogue-tracking-v1:${client.identity}`;
 function sample(){if(client.identity&&identity!==client.identity){identity=client.identity;let stored={};try{stored=JSON.parse(localStorage.getItem(storageKey())||'{}');}catch{}for(const [key,value]of Object.entries(stored))history[key]={...value,...history[key]};for(const t of pendingRuns)client.observe(t.sample(),{practice:t.state.practice,active:!t.state.practice});}
  if(!installed&&root.MORATALES_SURVIVOR&&root.ROUGE_MORA_BUILDS&&root.MOROGUE_RELICS&&root.MOROGUE_RECOVERY){installed=true;instrument({Engine:root.MORATALES_SURVIVOR,Builds:root.ROUGE_MORA_BUILDS,Relics:root.MOROGUE_RELICS,Recovery:root.MOROGUE_RECOVERY},(facts,s,t)=>{if(!client.identity)pendingRuns.add(t);else pendingRuns.clear();client.observe(facts,{practice:s.practice,active:!s.practice});if(client.identity&&!s.practice&&Date.now()-lastSaved>5000){lastSaved=Date.now();try{localStorage.setItem(storageKey(),JSON.stringify(history));}catch{}}},()=>history);}
 }
 client.register({sample,muted:()=>root.__moratalesSurvivor?.data?.muted===true});sample();
})(typeof window==='undefined'?globalThis:window);
