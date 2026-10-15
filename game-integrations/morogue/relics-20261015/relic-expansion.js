/* Café relics: bounded, run-scoped mechanics. Secondary damage never re-enters procs. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MOROGUE_RELIC_EXPANSION=factory();})(globalThis,function(){
 'use strict';
 const special=s=>!!s.build?.ability;
 const ITEMS={
  peppermill:{name:'Witch’s Pepper Mill',price:75,description:'Main attacks deal 25% more damage to foes with two different effects: burn, slow or mark.',detail:'Two slows count as one effect. Relic damage gains no bonus.'},
  cakestand:{name:'Empty Cake Stand',price:65,description:'Each empty relic slot grants 12% main and special damage, up to 24%.',detail:'Filling a slot immediately removes its share of the bonus.'},
  ironapron:{name:'Baker’s Iron Apron',price:65,risky:true,description:'Take 25% less damage from in front of your aim, but 15% more from behind.',detail:'Floor hazards and damage without a direction are unchanged.'},
  chutney:{name:'Haunted Chutney',price:65,description:'Main-attack kills spread burn, slow and mark to two nearby ordinary foes, for up to 2 seconds.',detail:'3 seconds between spreads. Transferred effects cannot spread again; bosses cannot receive them.'},
  scamp:{name:'Gingerbread Scamp',price:60,description:'A gingerbread companion bites a surviving main-hit target every 2 seconds for 75% normal main damage.',detail:'Target must have been hit within 4 seconds and stay within 320 steps. Cannot block attacks, draw enemies or trigger other effects.'},
  popping:{name:'Funeral Popping Candy',price:65,risky:true,description:'Every sixth ordinary main-attack kill leaves a candy blast: 150% normal main damage after 1 second.',detail:'DANGER: the circle also deals 8 damage to you. Summons and secondary kills do not count.'},
  specialsboard:{name:'Smudged Specials Board',price:40,description:'Refresh the dealer’s unsold relic cards once per visit, for free.',detail:'Bought cards stay sold. Prefers less-seen relics. Use Refresh stock at the dealer.'},
  eggtimer:{name:'Possessed Egg Timer',price:90,risky:true,description:'Special recharge progresses 40% faster, but casts automatically after a half-second warning.',detail:'You can aim, but cannot hold or manually spend a charge. Waits during boss transitions.',eligible:special},
  lastespresso:{name:'Last Chance Espresso',price:130,description:'Once per run, fatal enemy damage gives you 6 seconds to land three finishers and return at 20% health.',detail:'Spectral during the trial. Failure ends the run. Self-damage and scripted falls cannot trigger it.'},
  spoons:{name:'Confectioner’s Measuring Spoons',price:55,description:'Main hits fill a visible critical meter by your normal critical chance. At 100%, that hit is critical.',detail:'Replaces random main criticals. Retains overflow; adds no critical chance or damage.'},
  revengeroast:{name:'Revenge Roast',price:45,description:'Deal 20% more main and special damage to the enemy type that ended your previous run.',detail:'A boss death targets that exact boss. Self-damage deaths do not change the remembered foe.',eligible:s=>!!s.previousDeath},
  tangled:{name:'Tangled Liquorice',price:75,description:'Main-hit two different foes within 2 seconds to link them for 3 seconds. They share 20% of main-hit damage.',detail:'One pair; 8-second cooldown. Uses actual health lost, never overkill. Shared damage cannot chain.'},
  biscotti:{name:'Patient Biscotti',price:40,description:'Completely miss a main finisher and your next attack within 3 seconds retries that finisher.',detail:'10-second cooldown. No free attack. Earlier combo steps keep advancing; dash strikes and retries cannot repeat again.'},
  recipebook:{name:'Grandmother’s Recipe Book',price:95,description:'Three elite kills earn one owned-perk rank to choose at the dealer. A great adversary counts as three.',detail:'Two rewards per run. Normal rank limits and unlock times apply; no rare transformations.'},
  dessertfork:{name:'Duelist’s Dessert Fork',price:75,description:'Main attacks deal 20% more damage to a foe with no other enemy within 130 steps.',detail:'Living boss objects also break isolation. Specials and relic damage are unchanged.'},
  macaron:{name:'Twilight Macaron',price:75,risky:true,description:'Alternate 6 seconds of 30% more main and special damage with 6 seconds of taking 20% more damage.',detail:'The HUD shows the phase and countdown. The cycle stops outside active combat.'},
  milkbottle:{name:'Returnable Milk Bottle',price:25,description:'Once per dealer visit, exchanging another relic refunds 25% of what you paid for it.',detail:'Carry it for 60 combat seconds first. Free relics refund nothing. Each purchase refunds only once.'},
  servingtray:{name:'Tollkeeper’s Serving Tray',price:65,risky:true,description:'Taking a hit absorbs up to 12 damage, at 1 brass per 2 damage prevented. Eight seconds between payments.',detail:'Rounds the price up, at most 6 brass. A smaller purse buys partial protection. No brass means no protection.'},
  recipecard:{name:'Rewritten Recipe Card',price:65,description:'Once per dealer visit, pay 20 brass to exchange one ordinary combat perk for an eligible one at the same rank.',detail:'No extra ranks or slots. Cannot exchange transformations, specials, keystones or required ingredients.'},
  strainer:{name:'Silver Tea Strainer',price:35,description:'At the dealer, choose one unowned ordinary combat perk to keep out of future level-up offers.',detail:'One choice per run, active while carried. Does not reroll current cards or improve rarity.'},
  goosepot:{name:'Gooseberry Teapot',price:70,description:'Every 15 seconds, a main hit makes a nearby ordinary foe’s next attack strike another enemy instead.',detail:'If the struck foe dies, choose another within 180 steps of the hit. One confused foe; damage capped at one normal main hit. Bosses, elites and committed attacks are unaffected.'},
  toffee:{name:'Jawbreaker Toffee',price:60,description:'Every 8 seconds, a main hit stops a nearby ordinary ranged foe starting ranged attacks for 2 seconds.',detail:'Targets a ranged foe within 220 steps of the hit. It can still move and finish committed attacks. Bosses and elites are immune.'},
  crumpets:{name:'Twin Crumpets',price:75,description:'Two specials within 25 seconds place paired crumpet rings. Dash into one to travel to the other once.',detail:'240-step reach, 8-second pair lifetime, 20-second cooldown. No walls, gaps, extra invulnerability or dash refund.',eligible:special},
  waffleiron:{name:'Contraband Waffle Iron',price:65,risky:true,description:'Every 20 seconds, a main hit turns a nearby ordinary pursuer into two little waffles.',detail:'Chooses a survivor within 180 steps of the hit. Shared remaining health, split attack damage, one original kill and reward. At most two pairs; cannot split again.'},
  sodasiphon:{name:'Overfizzed Soda Siphon',price:55,risky:true,description:'Finishing a special propels you 90 steps backward, opposite your casting aim.',detail:'8-second cooldown. No extra invulnerability. Stops at edges; disabled during scripted traversal.',eligible:special}
 };
 const IDS=Object.keys(ITEMS),RANGED=new Set(['caster','lobber','spreader','spinner','zoner','sniper','orbiter']),MELEE=new Set(['chaser','flanker','wisp']);
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),ordinary=e=>e&&e.hp>0&&!e.major&&!e.summoned&&!e.railCarriageMinion&&!e.bossType&&!['boss','elite','sigil'].includes(e.type);
 const main=(s,i)=>!!i?.active&&!i.relic&&i.weapon===s.mainWeapon;
 const enemyKey=e=>e?.bossType?'boss:'+e.bossType:e?.type&&e.type!=='sigil'?'enemy:'+e.type:null;
 function create(api){
  const {state:s,hit,fx,event,World,Builds,baseDamage,blast,proc}=api,p=s.player,r=s.relicState,m=s.merchant;
  const x=r.cafe={clock:0,gates:{},purchases:{},uses:{},crit:0,recipeKills:0,recipeEarned:0,recipeCredits:0,trial:null,trialUsed:false,revenge:s.previousDeath||null,tracked:[],portals:[],waffles:[],visuals:[],phase:0};
  let serial=0;
  const has=id=>!!s.relics[id],valid=e=>e?.hp>0&&!(e.type==='sigil'&&e.sealed)&&!(e.major&&['intro','phase'].includes(e.majorState));
  const ready=id=>(x.gates[id]??-Infinity)<=x.clock;
  const gate=(id,t)=>{if(!ready(id))return false;x.gates[id]=x.clock+t;return true;};
  const visual=(kind,a,b=null)=>{if(x.visuals.length<12)x.visuals.push({kind,x:a.x,y:a.y,to:b?{x:b.x,y:b.y}:null,until:x.clock+.6});};
  const normalDamage=()=>Math.max(1,api.mainDamage?.()||baseDamage());
  const freeMove=()=>!(api.movementLocked?.())&&!p.finaleLeap&&!p.starLeap&&!p.admiralRide&&!p.colossusThrow&&!s.boss?.starFight?.galaxy&&!s.boss?.finale?.broken&&!s.boss?.finale?.colossus&&!['inside','enter','exit'].includes(s.boss?.inkFight?.mode)&&!s.boss?.prismFight?.pair&&!['swallow','inside'].includes(s.boss?.railFight?.mode)&&!['morph','breach','escape'].includes(s.boss?.beeFight?.mode)&&!api.controlLocked?.();
  const combat=()=>s.status==='playing'&&!s.transition&&!s.finaleEnding&&!(s.boss?.hp>0&&s.boss.major&&['intro','phase'].includes(s.boss.majorState))&&!api.controlLocked?.()&&s.enemies.some(valid);
  function slowStatus(e){return e.buildChillUntil>s.time||e.refineSlowUntil>s.time||e.relicSlowUntil>s.time||api.slow?.(e)<1;}
  function damage(e,i){
   if(i.relic||(!main(s,i)&&i.weapon!=='special'))return 1;
   let v=has('cakestand')?1+.12*Math.max(0,3-Object.keys(s.relics).filter(k=>s.relics[k]).length):1;
   if(has('macaron')&&x.phase===0)v*=1.3;
   if(has('revengeroast')&&enemyKey(e)===x.revenge)v*=1.2;
   if(main(s,i)){
    if(has('peppermill')&&Number(e.scorch>0)+Number(slowStatus(e))+Number(e.buildMarkUntil>s.time)>=2)v*=1.25;
    if(has('dessertfork')&&!s.enemies.some(n=>n!==e&&valid(n)&&dist(n,e)<130))v*=1.2;
   }
   return v;
  }
  function critical(chance,i,roll){if(!has('spoons')||!main(s,i))return roll()<chance;x.crit+=chance;if(x.crit+1e-9>=1){x.crit=Math.max(0,x.crit-1);proc('spoons');return true;}return false;}
  function incoming(amount,source,attacker){
   if(has('macaron')&&x.phase===1)amount*=1.2;
   if(has('ironapron')&&attacker&&Number.isFinite(attacker.x)&&Number.isFinite(attacker.y)&&dist(attacker,p)>1){const dot=(attacker.x-p.x)*Math.cos(s.aimAngle||0)+(attacker.y-p.y)*Math.sin(s.aimAngle||0);amount*=dot>=0?.75:1.15;}
   return amount;
  }
  function defend(amount){if(amount>0&&has('servingtray')&&m.brass>=1&&gate('servingtray',8)){const blocked=Math.min(amount,12,Math.floor(m.brass)*2),cost=Math.ceil(blocked/2);m.brass-=cost;m.spent+=cost;proc('servingtray');return Math.max(0,amount-blocked);}return amount;}
  function fatal(source,attacker){
   if(x.trial)return true;
   if(!has('lastespresso')||x.trialUsed||!attacker||!enemyKey(attacker)||['nutmeg','merchantMeteor','emberPlum','popping','starFall','beeCatch','uncrownedFall'].includes(source))return false;
   x.trialUsed=true;x.trial={remaining:6,finishers:0,enemy:enemyKey(attacker)};p.hp=1;proc('lastespresso');event('relicTrial');return true;
  }
  function finisher(){if(x.trial&&(!api.confirmDamage||x.lastMainHitAt===s.time)&&++x.trial.finishers>=3){x.trial=null;p.hp=p.maxHp*.2;p.invulnerable=Math.max(p.invulnerable||0,.6);proc('lastespresso');event('relicRevived');}}
  function dealt(e,actual,i){
   // Shared health is one pool, even when both waffles are caught by an area attack.
   if(e.wafflePair){const pair=e.wafflePair;pair.hp=Math.max(0,e.hp);for(const id of pair.members){const n=s.enemies.find(foe=>foe.id===id);if(n)n.hp=pair.hp;}}
   if(!main(s,i)||actual<=0)return;x.lastMainHitAt=s.time;
   if(x.link&&x.link.until>x.clock&&[x.link.a,x.link.b].includes(e)){const other=x.link.a===e?x.link.b:x.link.a;if(valid(other))hit(other,actual*.2,0,0,{weapon:'relic',relic:true,shared:true});}
   if(has('scamp')&&valid(e)){x.scampTarget=e;x.scampTargetUntil=x.clock+4;}
   if(has('tangled')&&valid(e)&&e.type!=='sigil'&&!e.wafflePair&&ready('tangled')){
    if(x.linkFirst&&x.linkFirst.enemy!==e&&valid(x.linkFirst.enemy)&&x.clock-x.linkFirst.at<=2){x.link={a:x.linkFirst.enemy,b:e,until:x.clock+3};x.linkFirst=null;gate('tangled',8);proc('tangled');}
    else if(!x.linkFirst||x.linkFirst.enemy!==e||x.clock-x.linkFirst.at>2)x.linkFirst={enemy:e,at:x.clock};
   }
   if(has('toffee')&&ready('toffee')){const n=nearby(e,n=>ordinary(n)&&RANGED.has(n.role),220);if(n){gate('toffee',8);n.toffeeUntil=x.clock+2;visual('toffee',n);proc('toffee');}}
   if(has('goosepot')&&!x.confused&&ready('goosepot')){const n=nearby(e,n=>ordinary(n)&&n.role!=='summoner',180),target=n&&s.enemies.find(q=>q!==n&&valid(q)&&q.type!=='sigil'&&dist(q,n)<320);if(target){x.confused={enemy:n,target,afterCommitted:!!(n.aimLocked||n.charge>0),until:x.clock+6};gate('goosepot',15);visual('goose',n);proc('goosepot');}}
   if(has('waffleiron')&&x.waffles.filter(pair=>pair.hp>0).length<2&&s.enemies.length<(api.enemyLimit||140)-4&&ready('waffleiron')){const n=nearby(e,n=>ordinary(n)&&MELEE.has(n.role)&&!n.wafflePair,180);if(n)split(n);}
  }
  function nearby(e,predicate,radius){if(predicate(e))return e;let found=null,best=radius;for(const n of s.enemies){if(!predicate(n))continue;const d=dist(n,e);if(d<=best){found=n;best=d;}}return found;}
  function split(e){
   if(!World)return;const left=World.move(s.world,e,e.x-14,e.y),right=World.move(s.world,e,e.x+14,e.y);if(dist(left,right)<12)return;
   gate('waffleiron',20);const twin={...e,...right,id:api.nextId?api.nextId():--serial,damage:e.damage*.5,r:Math.max(7,e.r*.65),waffle:true};Object.assign(e,left,{damage:e.damage*.5,r:twin.r,waffle:true});
   const pair={hp:e.hp,members:[e.id,twin.id]};e.wafflePair=twin.wafflePair=pair;s.enemies.push(twin);x.waffles.push(pair);visual('waffle',e);proc('waffleiron');
  }
  function killed(e,i){
   if(e.summoned||e.type==='sigil')return;
   if(has('recipebook')&&(e.major||e.type==='elite')&&x.recipeEarned<2){x.recipeKills+=e.major?3:1;while(x.recipeKills>=3&&x.recipeEarned<2){x.recipeKills-=3;x.recipeEarned++;x.recipeCredits++;proc('recipebook');event('relicRecipeReady');}}
   if(!main(s,i)||e.major||['boss','elite'].includes(e.type))return;
   if(has('popping')){x.candyKills=(x.candyKills||0)+1;if(x.candyKills%6===0){blast('popping',e.x,e.y,64,1,normalDamage()*1.5,8);proc('popping');}}
   if(has('chutney')&&!(e.chutneyUntil>s.time)&&ready('chutney')&&(e.scorch>0||slowStatus(e)||e.buildMarkUntil>s.time)){
    const targets=s.enemies.filter(n=>n!==e&&ordinary(n)&&dist(n,e)<=140).sort((a,b)=>dist(a,e)-dist(b,e)).slice(0,2);if(!targets.length)return;gate('chutney',3);
    for(const n of targets){
     n.chutneyUntil=s.time+2;
     if(e.scorch>0&&e.scorchDamage>0){n.scorch=Math.max(n.scorch||0,Math.min(2,e.scorch));n.scorchDamage=Math.max(n.scorchDamage||0,e.scorchDamage);n.scorchTick=Math.max(.01,e.scorchTick||.3);}
     if(slowStatus(e))n.relicSlowUntil=Math.max(n.relicSlowUntil||0,s.time+Math.min(2,Math.max(0,e.buildChillUntil-s.time||0,e.refineSlowUntil-s.time||0,e.relicSlowUntil-s.time||0)||2));
     if(e.buildMarkUntil>s.time)n.buildMarkUntil=Math.max(n.buildMarkUntil||0,Math.min(s.time+2,e.buildMarkUntil));
     visual('chutney',e,n);
    }proc('chutney');
   }
  }
  function track(strike){if(has('biscotti')&&strike.step===3&&!strike.dash&&!strike.repeat&&x.tracked.length<16)x.tracked.push({strike,at:x.clock});}
  function attackStep(step){if(has('biscotti')&&x.repeat&&x.repeat.until>x.clock){const n=x.repeat.step;x.repeat=null;return {step:n,repeat:true};}return {step,repeat:false};}
  function enemyAction(e){
   if(x.confused?.enemy!==e)return false;const c=x.confused;
   if(c.afterCommitted){c.afterCommitted=false;return false;}
   x.confused=null;if(!valid(c.target)||c.until<=x.clock||dist(c.target,e)>360)return false;
   hit(c.target,Math.min(normalDamage(),Math.max(1,e.damage)),0,0,{weapon:'relic',relic:true});e.attack=3.6;e.charge=0;visual('goose',e,c.target);return true;
  }
  function canEnemyStart(e){return !(e.toffeeUntil>x.clock&&!e.aimLocked&&RANGED.has(e.role));}
  function contact(e){if(x.confused?.enemy!==e)return false;if(e.charge>0&&x.confused.afterCommitted)return false;return enemyAction(e);}
  function cast(data={}){
   if(has('crumpets')&&freeMove()&&ready('crumpets')){
    const point={x:p.x,y:p.y,at:x.clock};
    if(x.portals.length===1&&x.clock-x.portals[0].at<=25&&dist(x.portals[0],point)>=45&&dist(x.portals[0],point)<=240&&path(x.portals[0],point)){x.portals.push(point);x.portalUntil=x.clock+8;proc('crumpets');}
    else if(x.portals.length!==2)x.portals=[point];
   }
   if(has('sodasiphon')&&freeMove()&&ready('sodasiphon'))x.recoil={angle:data.angle??s.aimAngle,cast:p.cast};
  }
  function path(a,b){if(!World||!freeMove())return false;const steps=Math.max(1,Math.ceil(dist(a,b)/8));for(let i=0;i<=steps;i++)if(!World.valid(s.world,a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps,p.r))return false;return true;}
  function moveTick(from){
   if(!has('crumpets')||x.portals.length!==2||p.dash<=0||!freeMove())return;
   for(let i=0;i<2;i++){const a=x.portals[i],b=x.portals[1-i],dx=p.x-from.x,dy=p.y-from.y,den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((a.x-from.x)*dx+(a.y-from.y)*dy)/den)):0;
    if(dist(a,{x:from.x+dx*t,y:from.y+dy*t})<21&&path(p,b)){Object.assign(p,{x:b.x,y:b.y});x.portals=[];gate('crumpets',20);visual('crumpets',a,b);proc('crumpets');break;}}
  }
  function update(dt){
   if(!combat())return;x.clock+=dt;x.phase=Math.floor(x.clock/6)%2;
   if(x.trial){x.trial.remaining-=dt;if(x.trial.remaining<=0){s.deathEnemy=x.trial.enemy;x.trial=null;p.hp=0;api.finish?.(false);return;}}
   if(x.link&&(!valid(x.link.a)||!valid(x.link.b)||x.link.until<=x.clock))x.link=null;
   if(x.linkFirst&&(!valid(x.linkFirst.enemy)||x.clock-x.linkFirst.at>2))x.linkFirst=null;
   if(x.confused&&(!valid(x.confused.enemy)||x.confused.until<=x.clock))x.confused=null;else if(x.confused?.afterCommitted&&!x.confused.enemy.aimLocked&&!(x.confused.enemy.charge>0))x.confused.afterCommitted=false;
   x.waffles=x.waffles.filter(pair=>pair.hp>0);x.visuals=x.visuals.filter(v=>v.until>x.clock);
   if(has('scamp')&&x.scampTargetUntil>x.clock&&valid(x.scampTarget)&&dist(x.scampTarget,p)<320&&gate('scamp',2)){hit(x.scampTarget,normalDamage()*.75,0,0,{weapon:'relic',relic:true});visual('scamp',p,x.scampTarget);proc('scamp');}
   for(const t of x.tracked){if(t.strike.landed)t.done=true;else if(!s.shots?.some(q=>q.attack===t.strike&&q.life>0)&&x.clock>t.at){t.done=true;if(has('biscotti')&&gate('biscotti',10)){x.repeat={step:t.strike.step,until:x.clock+3};proc('biscotti');}}}
   x.tracked=x.tracked.filter(t=>!t.done&&x.clock-t.at<8);
   if(x.portals.length&&(x.portals.length===1?x.clock-x.portals[0].at>25:x.clock>=x.portalUntil)){x.portals=[];gate('crumpets',20);}
   if(x.recoil&&p.cast!==x.recoil.cast){const recoil=x.recoil;x.recoil=null;if(has('sodasiphon')&&freeMove()&&gate('sodasiphon',8)){const from={x:p.x,y:p.y};for(let i=0;i<12;i++){const dest={x:p.x-Math.cos(recoil.angle)*7.5,y:p.y-Math.sin(recoil.angle)*7.5};if(!World?.valid(s.world,dest.x,dest.y,p.r))break;Object.assign(p,dest);}visual('soda',from,p);proc('sodasiphon');}}
  }
  function clear(){x.portals=[];x.recoil=null;x.link=null;x.linkFirst=null;x.confused=null;x.tracked=[];x.scampTarget=null;x.visuals=[];x.waffles=[];x.autoAt=null;}
  function purchased(id,price){x.purchases[id]={price,at:x.clock,refunded:false};if(id==='scamp')x.gates.scamp=x.clock+2;}
  function removed(id){if(id==='crumpets'){x.portals=[];gate('crumpets',20);}if(id==='tangled'){x.link=x.linkFirst=null;}if(id==='scamp')x.scampTarget=null;if(id==='goosepot')x.confused=null;if(id==='sodasiphon')x.recoil=null;if(id==='eggtimer')x.autoAt=null;if(id==='biscotti'){x.repeat=null;x.tracked=[];}}
  function refund(id){const q=x.purchases[id];return has('milkbottle')&&id!=='milkbottle'&&x.uses.milk!==m.visits&&q&&!q.refunded&&x.clock-q.at>=60?Math.floor(q.price*.25):0;}
  function claimRefund(id){const n=refund(id);if(n){x.purchases[id].refunded=true;x.uses.milk=m.visits;m.brass+=n;proc('milkbottle');}return n;}
  const ordinaryPerk=id=>Builds?.PERKS[id]&&Builds.PERKS[id].rarity!=='rare'&&!Builds.TRANSFORMATIONS.includes(id);
  function recipes(){return !Builds?[]:Builds.cards(s).filter(c=>c.kind==='perk'&&c.from>0&&ordinaryPerk(c.key));}
  function recipe(id){const c=recipes().find(c=>c.key===id);if(s.status!=='merchant'||!has('recipebook')||x.recipeCredits<=0||!c)return false;if(!Builds.apply(s,c))return false;x.recipeCredits--;api.syncPerks?.();proc('recipebook');return true;}
  function swaps(from){
   if(!Builds||!ordinaryPerk(from)||!s.build.perks[from]||s.build.refinements?.[from]?.length)return [];
   // Do not remove the last ingredient required by another perk or a carried relic.
   if(from==='tether'&&s.build.perks.siphon&&s.build.ability!=='tide'&&!s.build.perks.crossing||from==='crossing'&&s.build.perks.siphon&&s.build.ability!=='tide'&&!s.build.perks.tether||from==='roast'&&has('salt'))return [];
   const rank=s.build.perks[from],perks={...s.build.perks};delete perks[from];const view={...s,relics:{...s.relics,strainer:0},build:{...s.build,perks}};
   return Builds.cards(view).filter(c=>c.kind==='perk'&&c.key!==from&&!c.from&&ordinaryPerk(c.key)&&Builds.PERKS[c.key].max>=rank).map(c=>({...c,level:rank,description:Builds.PERKS[c.key].description(rank)}));
  }
  function swap(from,to){const c=swaps(from).find(c=>c.key===to);if(s.status!=='merchant'||!has('recipecard')||x.uses.swap===m.visits||m.brass<20||!c)return false;
   const spec=Builds.PERKS[from];delete s.build.perks[from];if(spec.route==='style')delete s.styles[from];if(spec.route==='talent')delete s.endlessTalents[from];s.build.perks[to]=c.level;if(Builds.PERKS[to].route==='style')s.styles[to]=true;if(Builds.PERKS[to].route==='talent')s.endlessTalents[to]=c.level;m.brass-=20;m.spent+=20;x.uses.swap=m.visits;api.syncPerks?.();proc('recipecard');return true;}
  function banishes(){return !Builds?[]:Builds.cards({...s,relics:{...s.relics,strainer:0}}).filter(c=>c.kind==='perk'&&!c.from&&ordinaryPerk(c.key));}
  function banish(id){if(s.status!=='merchant'||!has('strainer')||x.banished||!banishes().some(c=>c.key===id))return false;x.banished=id;proc('strainer');return true;}
  return {damage,critical,incoming,defend,fatal,finisher,dealt,killed,track,attackStep,enemyAction,canEnemyStart,contact,cast,moveTick,update,clear,purchased,removed,refund,claimRefund,recipes,recipe,swaps,swap,banishes,banish,combat,enemyKey};
 }
 return {ITEMS,IDS,create,enemyKey};
});
