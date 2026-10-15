/* Run-only merchant economy. Proc damage never triggers other relics. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./relic-expansion.js'));else root.MOROGUE_RELICS=factory(root.MOROGUE_RELIC_EXPANSION);})(globalThis,function(Expansion){
 'use strict';
 const LIMIT=3,FIRST_VISIT=120,METEOR={interval:12,warning:1.4,radius:64,selfDamage:18},EMBER={interval:5,warning:1.1,radius:48,selfDamage:8};
 const special=s=>!!s.build.ability;
 const ITEMS={
  saffron:{name:'Hourglass Saffron',price:65,description:'Land main attacks while a special charge is ready to bank 0.4 seconds of recharge per attack, up to 3 seconds. Casting spends the bank.',detail:'One deposit per attack. Empty swings earn nothing.',eligible:special},
  sugar:{name:'Prism Sugar',price:60,description:'Any perfect dodge catches a sugar shard. Store three. Your next landed finisher fires them along your aim, each for 35% strike damage.',detail:'One shard per dodge. Shards cannot trigger relics.'},
  honeycomb:{name:'Royal Honeycomb',price:60,description:'Your thorn garden or time field travels with you for its first 2 seconds, then takes root.',detail:'Damage and total lifetime stay unchanged.',eligible:s=>['garden','clock'].includes(s.build.ability)},
  salt:{name:'Cinder Salt',price:60,description:'A finisher consumes one enemy’s remaining burn, dealing it immediately. Nearby foes take half that damage.',detail:'Once per finisher. Requires Espresso and Slow Roast; splash cannot spread burn.',eligible:s=>s.mainWeapon==='espresso'&&!!s.styles.roast},
  nutmeg:{name:'Cracked Nutmeg',price:70,description:'Once per boss, half of the first damaging hit is delayed for 4 seconds. Land a finisher to cancel the debt.',detail:'Works against major bosses and demibosses. Either half can kill you.'},
  olives:{name:'Moon-brined Olives',price:55,description:'At full health, preserve one earned boss-healing pickup. Use it once you are missing enough health for the whole portion.',detail:'One portion, kept until used. Creates no extra healing.'},
  marmalade:{name:'Widow’s Marmalade',price:55,description:'Keep one offered upgrade card when rerolling the other two. Gain one reroll the first time you buy this relic.',detail:'Still spends a reroll. Buying it again never grants another.'},
  starter:{name:'Sour Starter',price:85,risky:true,description:'Your special holds two charges. Each takes 30% longer to recharge, one at a time.',detail:'The extra charge starts empty. Exchanges preserve recharge progress.',eligible:special},
  meteor:{name:'Merchant Meteor',price:130,risky:true,description:'Every 12 seconds of combat, the dealer drops a horror meteor on a nearby enemy. A small blast deals heavy damage to every foe inside.',detail:'DANGER: the circle locks for 1.4 seconds. You take 18 damage if caught. Dash clear.'},
  glasspepper:{name:'Glass Pepper',price:75,risky:true,description:'Main attacks deal 25% more damage.',detail:'BARGAIN: all incoming damage increases by 20%.'},
  bloodclove:{name:'Blood Clove',price:75,risky:true,description:'A landed finisher heals 4 health. Six seconds between heals.',detail:'BARGAIN: incoming damage +15%. Boss healing reduction still applies.'},
  leadapricot:{name:'Lead Apricot',price:65,risky:true,description:'Main finishers deal 30% more damage.',detail:'BARGAIN: walking speed −10%. Dash distance stays unchanged.'},
  bittercoffee:{name:'Bitter Coffee',price:80,risky:true,description:'Special recharge progresses 25% faster, including Sour Starter’s spare charge.',detail:'BARGAIN: main attacks deal 15% less damage.',eligible:special},
  hollowtruffle:{name:'Hollow Truffle',price:60,risky:true,description:'Earn 50% more brass from qualifying kills. Fractional brass carries forward.',detail:'BARGAIN: incoming damage +15%. Summoned foes still pay nothing.'},
  quicksilver:{name:'Quicksilver Cinnamon',price:75,risky:true,description:'Normal main attack sequences are 15% faster.',detail:'BARGAIN: dash charges recover 20% more slowly. Dash spins keep their usual timing.'},
  emberplum:{name:'Ember Plum',price:70,risky:true,description:'Dashing leaves a small ember at your starting point. It bursts after 1.1 seconds. Five seconds between embers.',detail:'DANGER: the marked blast also deals 8 damage to you. Keep moving.'},
  faminefig:{name:'Famine Fig',price:65,risky:true,description:'Below 40% health, main attacks deal 35% more damage.',detail:'BARGAIN: at 40% health or higher, main attacks deal 10% less. No protection from death.'},
  mint:{name:'Ghost Mint',price:55,description:'A perfect dodge restores 0.65 seconds of dash recharge.',detail:'Three seconds between triggers. Cannot exceed your dash-charge limit.'},
  thimble:{name:'Copper Thimble',price:65,description:'After 10 seconds without taking a hit, block up to 6 damage from the next hit.',detail:'Twelve seconds to re-arm after blocking. A copper ring means it is ready.'},
  liquorice:{name:'Measured Liquorice',price:55,description:'Every third cleanly timed, landed main attack restores 0.8 seconds of special recharge.',detail:'One count per attack. Empty swings and relic damage never count.',eligible:special},
  toast:{name:'Doorman’s Toast',price:55,description:'A landed finisher sends a shock around you for 20% strike damage and pushes ordinary foes away.',detail:'Four seconds between shocks. Bosses and their objects cannot be pushed.'},
  lanternseed:{name:'Lantern Seed',price:60,description:'A landed finisher slows ordinary foes within 130 steps by 30% for 2 seconds.',detail:'Five seconds between blooms. Bosses ignore the slow; it does not stack with itself.'},
  echopearl:{name:'Echo Pearl',price:65,description:'Every third landed finisher leaves an echo at your feet. After 0.5 seconds it strikes a small circle for 40% finisher damage.',detail:'The echo stays where it was planted and cannot trigger more relics.'},
  peppercorn:{name:'Ricochet Peppercorn',price:55,description:'Every fourth landed main attack launches a peppercorn toward the nearest other foe for 50% strike damage.',detail:'One count per attack. Needs a second target within 300 steps.'},
  sardine:{name:'Tinned Sardine',price:55,description:'Every eighth qualifying kill strengthens main attacks by 20% for 3 seconds.',detail:'Summoned enemies and boss objects do not count. Duration refreshes; power does not stack.'},
  silveronion:{name:'Silver Onion',price:65,description:'A perfect dodge clears moving enemy shots within 90 steps.',detail:'Six seconds between peels. Ground hazards remain dangerous.'},
  rosemary:{name:'Runner’s Rosemary',price:50,description:'Casting a special grants 15% walking speed for 2.5 seconds.',detail:'Recasting refreshes the duration. Dash distance stays unchanged.',eligible:special},
  brassbean:{name:'Brass Bean',price:40,description:'Every 20 ordinary, non-summoned kills earn 4 extra brass.',detail:'A long-run investment. No bonus from elites, bosses or boss objects.'},
  teacup:{name:'Porcelain Teacup',price:60,description:'A landed finisher reduces incoming damage by 15% for 2 seconds.',detail:'Six seconds between brews. A pale ring shows when protection is active.'},
  anchorprune:{name:'Anchor Prune',price:55,description:'Main attacks deal 15% more damage to foes above 75% health.',detail:'Rewards opening pressure. Specials and relic damage stay unchanged.'}
 };
 Object.assign(ITEMS,Expansion.ITEMS);
 for(const spec of Object.values(ITEMS))spec.risky=!!spec.risky;
 const owned=s=>Object.keys(s.relics).filter(id=>ITEMS[id]&&s.relics[id]);
 function create(api){
  const {state:s,hit,fx,event,debtDamage,hurt=()=>false,heal=()=>0,power=()=>1,Hitboxes,healingScale=()=>1,specialCooldown=()=>s.build.cooldownMax||8}=api;
  const p=s.player,m=s.merchant={brass:0,earned:0,spent:0,visits:0,earlyDone:false,lastMajor:0,pending:false,stock:[],bought:[],history:[],openAt:0,seen:{},fraction:0};
  const r=s.relicState={bank:0,shards:0,preserved:0,preservedOwner:null,debt:0,debtUntil:0,nutmegBoss:null,bolts:[],blasts:[],gates:{},counts:{},meteorClock:METEOR.interval,lastHurt:s.time,thimbleAt:s.time,thimbleReady:false,teaUntil:0,speedUntil:0,sardineUntil:0,marmaladeGift:false};
  let seed=(s.seed^0x57a1ca7d)>>>0,serial=0;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const has=id=>!!s.relics[id],dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),valid=e=>e.hp>0&&!(e.type==='sigil'&&e.sealed)&&!(e.major&&['intro','phase'].includes(e.majorState));
  const gate=(id,seconds)=>{if((r.gates[id]??-Infinity)>s.time)return false;r.gates[id]=s.time+seconds;return true;};
  const count=(id,n)=>{r.counts[id]=(r.counts[id]||0)+1;return r.counts[id]%n===0;};
  const proc=id=>event('relicProc',{id});
  const baseDamage=()=> (120+40*(s.weapons?.[s.mainWeapon]||1))*(1+.12*((s.weapons?.[s.mainWeapon]||1)-1))*(s.evolutions?.[s.mainWeapon]?1.5:1)*power()*(1+.6*Math.log1p((s.training?.edge||0)/10));
  const cafe=Expansion.create({...api,baseDamage,blast,proc});
  function stock(count,exclude=[]){
   const pool=Object.keys(ITEMS).filter(id=>!has(id)&&!exclude.includes(id)&&(!ITEMS[id].eligible||ITEMS[id].eligible(s))).map(id=>({id,order:random()})).sort((a,b)=>(m.seen[a.id]||0)-(m.seen[b.id]||0)||a.order-b.order);
   const pick=predicate=>{const at=pool.findIndex(x=>predicate(x.id));return at<0?null:pool.splice(at,1)[0].id;};
   const result=[];if(count>0)result.push(pick(id=>!ITEMS[id].risky&&ITEMS[id].price<=m.brass));if(count>1)result.push(pick(id=>ITEMS[id].risky));const selected=result.filter(Boolean);while(selected.length<count&&pool.length)selected.push(pool.shift().id);for(const id of selected)m.seen[id]=(m.seen[id]||0)+1;return selected;
  }
  function refreshStock(){if(s.status!=='merchant'||!has('specialsboard')||r.cafe.uses.board===m.visits)return false;const sold=m.stock.filter(id=>m.bought.includes(id)),fresh=stock(3-sold.length,[...m.stock,...m.bought]);if(!fresh.length)return false;m.stock=[...sold,...fresh];r.cafe.uses.board=m.visits;m.history.push({visit:m.visits,at:s.runTime,stock:[...m.stock],refresh:true});proc('specialsboard');return true;}
  function credit(amount){m.brass+=amount;m.earned+=amount;}
  function earn(e,impact={}){
   if(s.practice||e.summoned||e.type==='sigil')return;cafe.killed(e,impact);
   let amount=e.major?35:e.type==='boss'?15:e.type==='elite'?8:0;
   if(!amount){m.scraps=(m.scraps||0)+1;if(m.scraps===4){amount=1;m.scraps=0;}if(has('brassbean')&&count('brassbean',20)){credit(4);proc('brassbean');}}
   if(has('hollowtruffle')){const scaled=amount*1.5+m.fraction;amount=Math.floor(scaled);m.fraction=scaled-amount;}
   credit(amount);if(has('sardine')&&count('sardine',8)){r.sardineUntil=s.time+3;proc('sardine');}
  }
  function majorDown(){if(s.majorKills>0&&s.majorKills%3===0&&m.lastMajor<s.majorKills){m.lastMajor=s.majorKills;m.pending=true;}}
  function clearCombat(){r.bolts.length=r.blasts.length=0;r.meteorClock=METEOR.interval;cafe.clear();}
  function visit(){
   if(s.practice||s.status!=='playing'||s.transition||s.finaleEnding||s.boss?.hp>0)return false;
   if(!m.earlyDone&&s.runTime>=FIRST_VISIT){m.pending=true;m.earlyDone=true;}
   if(!m.pending)return false;
   m.pending=false;m.visits++;m.openAt=s.time;m.bought=[];m.phase='warning';m.sceneAge=0;m.cleared=false;
   m.stock=stock(3);
   m.history.push({visit:m.visits,at:s.runTime,stock:[...m.stock]});s.status='merchant';p.attack=null;p.cast=null;p.dash=0;p.moving=false;event('merchant');return true;
  }
  function remove(id){
   cafe.removed(id);delete s.relics[id];delete r.counts[id];delete r.gates[id];
   if(id==='starter'){const b=s.build,remaining=b.cooldown/Math.max(.1,b.cooldownMax);b.cooldownMax=specialCooldown();b.cooldown=b.charges>0?0:remaining*b.cooldownMax;b.charges=1;}
   if(id==='saffron')r.bank=0;if(id==='sugar')r.shards=0;if(id==='olives'){r.preserved=0;r.preservedOwner=null;}
   if(id==='thimble')r.thimbleReady=false;if(id==='teacup')r.teaUntil=0;if(id==='rosemary')r.speedUntil=0;if(id==='sardine')r.sardineUntil=0;
   r.blasts=r.blasts.filter(b=>b.kind!==id);if(id==='sugar'||id==='peppercorn')r.bolts=r.bolts.filter(b=>b.kind!==id);
   // Already-incurred Nutmeg debt survives an exchange.
  }
  function buy(id,replace=null){
   if(s.status!=='merchant'||!m.stock.includes(id)||m.bought.includes(id)||!ITEMS[id]||has(id))return false;
   const item=ITEMS[id],full=owned(s).length>=LIMIT;
   if(item.eligible&&!item.eligible(s)||m.brass+(full?cafe.refund(replace):0)<item.price||full&&(!replace||!has(replace))||!full&&replace)return false;
   if(full){cafe.claimRefund(replace);remove(replace);}m.brass-=item.price;m.spent+=item.price;s.relics[id]=1;m.bought.push(id);cafe.purchased(id,item.price);
   if(id==='starter'){const b=s.build,base=specialCooldown(),remaining=b.cooldown/Math.max(.1,b.cooldownMax||base);b.charges=b.cooldown>0?0:1;b.cooldownMax=base*1.3;b.cooldown=b.charges?b.cooldownMax:remaining*b.cooldownMax;}
   if(id==='marmalade'&&!r.marmaladeGift){s.build.rerolls=(s.build.rerolls||0)+1;r.marmaladeGift=true;}
   if(id==='meteor')r.meteorClock=METEOR.interval;if(id==='thimble'){r.lastHurt=s.time;r.thimbleAt=s.time+10;r.thimbleReady=false;}
   event('relicBought',{id,replace,price:item.price});return true;
  }
  function leave(){if(s.status!=='merchant')return false;s.status='playing';p.invulnerable=Math.max(p.invulnerable||0,1);event('merchantLeave');return true;}
  function bolt(kind,angle,damage){if(r.bolts.length>=12)return;r.bolts.push({id:++serial,kind,x:p.x,y:p.y-18,vx:Math.cos(angle)*550,vy:Math.sin(angle)*550,angle,life:1.1,damage});}
  function blast(kind,x,y,radius,delay,damage,selfDamage=0){if(r.blasts.length>=8)return;r.blasts.push({kind,x,y,radius,delay,age:0,life:delay+.45,damage,selfDamage,fired:false,createdAt:s.time});}
  function area(x,y,radius,amount,push=0){
   for(const e of s.enemies){if(!valid(e))continue;const point={x,y:y-18};if(Hitboxes?!Hitboxes.swept(e,point,point,radius):dist(e,{x,y})>radius+(e.r||0))continue;
    const d=Math.max(1,dist(e,{x,y})),k=e.major||['boss','sigil'].includes(e.type)?0:push;hit(e,amount,(e.x-x)/d*k,(e.y-y)/d*k,{weapon:'relic',relic:true});}
  }
  function landed(strike,e){
   if(s.status!=='playing'||s.transition||strike.relic||strike.weapon==='relic')return;
   if(has('saffron')&&!strike.relicBanked&&s.build.ability&&(has('starter')?s.build.charges>0:s.build.cooldown<=0)){strike.relicBanked=true;r.bank=Math.min(3,r.bank+.4);}
   if(has('salt')&&strike.step===3&&!strike.salted&&e.scorch>0){strike.salted=true;const ticks=Math.max(0,1+Math.floor((e.scorch-Math.max(0,e.scorchTick||0))/.3+1e-6)),amount=ticks*(e.scorchDamage||0);e.scorch=0;e.scorchDamage=0;if(amount){if(e.hp>0)hit(e,amount,0,0,{weapon:'relic',relic:true});for(const n of s.enemies)if(n!==e&&n.hp>0&&dist(n,e)<90+n.r)hit(n,amount*.5,0,0,{weapon:'relic',relic:true});fx('ring',e.x,e.y-18,'#c58350',1);proc('salt');}}
   if(strike.relicCounted)return;strike.relicCounted=true;
   if(has('liquorice')&&strike.clean&&count('liquorice',3)){s.build.cooldown=Math.max(0,s.build.cooldown-.8);proc('liquorice');}
   if(has('peppercorn')&&count('peppercorn',4)){const target=s.enemies.filter(n=>n!==e&&valid(n)&&dist(n,p)<300).sort((a,b)=>dist(a,p)-dist(b,p))[0];if(target){const aim=Hitboxes?Hitboxes.aim(target,{x:p.x,y:p.y-18}):{x:target.x,y:target.y-18};bolt('peppercorn',Math.atan2(aim.y-(p.y-18),aim.x-p.x),strike.damage*.5);proc('peppercorn');}}
  }
  function dodge(){
   if(has('sugar')&&r.shards<3){r.shards++;proc('sugar');}
   if(has('mint')&&gate('mint',3)){p.dashCooldown=Math.max(0,(p.dashCooldown||0)-.65);proc('mint');}
   if(has('silveronion')&&gate('silveronion',6)){for(const h of s.hazards||[])if(h.life>0&&Math.hypot(h.vx||0,h.vy||0)>0&&Math.hypot(h.x-p.x,h.y-(p.y-18))<=90)h.life=0;fx('ring',p.x,p.y-18,'#e0dcc9',.9);proc('silveronion');}
  }
  function finisher(strike){
   if(s.status!=='playing'||s.transition||strike.relic||strike.weapon==='relic'||strike.relicFinished)return;strike.relicFinished=true;cafe.finisher();
   if(r.debt>0){r.debt=0;fx('ring',p.x,p.y-18,'#dfc6a0',.8);proc('nutmeg');}
   if(has('sugar')&&r.shards){const n=r.shards;r.shards=0;for(let i=0;i<n;i++)bolt('sugar',strike.angle+(i-(n-1)/2)*.15,strike.damage*.35);proc('sugar');}
   if(has('bloodclove')&&gate('bloodclove',6)){const amount=heal(4);if(amount)event('heal',{amount});proc('bloodclove');}
   if(has('toast')&&gate('toast',4)){area(p.x,p.y,110,strike.damage*.2,32);fx('ring',p.x,p.y-18,'#d5aa78',1.1);proc('toast');}
   if(has('lanternseed')&&gate('lanternseed',5)){for(const e of s.enemies)if(e.hp>0&&!e.major&&!['boss','sigil'].includes(e.type)&&dist(e,p)<=130+(e.r||0))e.relicSlowUntil=s.time+2;fx('ring',p.x,p.y-18,'#aab77a',1.3);proc('lanternseed');}
   if(has('echopearl')&&count('echopearl',3)){blast('echopearl',p.x,p.y,85,.5,strike.damage*.4);proc('echopearl');}
   if(has('teacup')&&gate('teacup',6)){r.teaUntil=s.time+2;proc('teacup');}
  }
  function incoming(amount,source,attacker){return cafe.incoming(amount,source,attacker)*(has('glasspepper')?1.2:1)*(has('bloodclove')?1.15:1)*(has('hollowtruffle')?1.15:1)*(has('teacup')&&r.teaUntil>s.time?.85:1);}
  function defend(amount){
   if(amount<=0)return amount;r.lastHurt=s.time;
   if(has('thimble')&&r.thimbleReady){amount=Math.max(0,amount-6);r.thimbleReady=false;r.thimbleAt=s.time+12;proc('thimble');}
   amount=cafe.defend(amount);const boss=s.boss;if(!has('nutmeg')||!boss||!(boss.major||boss.type==='boss')||boss.hp<=0||r.nutmegBoss===boss.id||amount<=0)return amount;
   r.nutmegBoss=boss.id;r.debt=amount*.5;r.debtUntil=s.time+4;proc('nutmeg');return amount*.5;
  }
  function damage(e,impact){const extra=cafe.damage(e,impact);if(!impact.active||impact.relic||impact.weapon!==s.mainWeapon)return extra;return extra*(has('glasspepper')?1.25:1)*(has('leadapricot')&&impact.step===3?1.3:1)*(has('bittercoffee')?.85:1)*(has('faminefig')?(p.hp<p.maxHp*.4?1.35:.9):1)*(has('sardine')&&r.sardineUntil>s.time?1.2:1)*(has('anchorprune')&&e.hp>e.maxHp*.75?1.15:1);}
  function speed(){return(has('leadapricot')?.9:1)*(has('rosemary')&&r.speedUntil>s.time?1.15:1);}
  function slow(e){return !e.major&&!['boss','sigil'].includes(e.type)&&e.relicSlowUntil>s.time?.7:1;}
  function cast(data){cafe.cast(data);if(has('rosemary')){r.speedUntil=s.time+2.5;proc('rosemary');}}
  function dash(){if(has('emberplum')&&gate('emberplum',EMBER.interval)){blast('emberplum',p.x,p.y,EMBER.radius,EMBER.warning,baseDamage()*1.25,EMBER.selfDamage);proc('emberplum');}}
  function preserve(drop,owner){if(!has('olives')||r.preserved||p.hp<p.maxHp||drop.amount<=0)return false;r.preserved=drop.amount;r.preservedOwner=owner.recovery;r.preservedScale=owner.recovery.scale||1;drop.amount=0;drop.dead=true;proc('olives');return true;}
  function update(dt){
   if(s.status!=='playing'||s.transition||s.finaleEnding)return;
   if(r.debt>0&&s.time>=r.debtUntil){const amount=r.debt;r.debt=0;debtDamage(amount);if(s.status!=='playing'||p.hp<=0)return;}
   const preservedAmount=r.preserved*Math.min(1,healingScale()/(r.preservedScale||1));
   if(preservedAmount>0&&p.hp>0&&p.maxHp-p.hp+1e-6>=preservedAmount){p.hp+=preservedAmount;if(r.preservedOwner)r.preservedOwner.recovered+=preservedAmount;r.preserved=0;r.preservedOwner=null;fx('ring',p.x,p.y-18,'#b3c88c',.7);event('heal',{amount:preservedAmount});}
   r.thimbleReady=has('thimble')&&s.time-r.lastHurt>=10&&s.time>=r.thimbleAt;
   if(s.boss?.hp>0&&s.boss.major&&['intro','phase'].includes(s.boss.majorState)){clearCombat();return;}
   cafe.update(dt);if(s.status!=='playing')return;const targets=s.enemies.filter(e=>valid(e)&&e.type!=='sigil'&&dist(e,p)<520);
   if(has('meteor')&&targets.length){r.meteorClock-=dt;if(r.meteorClock<=0){const target=targets.sort((a,b)=>dist(a,p)-dist(b,p))[0],aim=Hitboxes?Hitboxes.aim(target,{x:p.x,y:p.y-18}):{x:target.x,y:target.y-18};blast('meteor',aim.x,aim.y+18,METEOR.radius,METEOR.warning,baseDamage()*6,METEOR.selfDamage);r.meteorClock=METEOR.interval;event('relicWarning',{id:'meteor',x:aim.x,y:aim.y+18});}}
   for(const b of r.blasts){b.age+=b.createdAt===s.time?0:dt;if(!b.fired&&b.age>=b.delay){b.fired=true;const caught=b.selfDamage>0&&dist(p,b)<=b.radius+(p.r||0);if(caught)hurt(b.selfDamage,b.kind==='meteor'?'merchantMeteor':b.kind==='popping'?'popping':'emberPlum');if(s.status!=='playing')break;area(b.x,b.y,b.radius,b.damage);fx('ring',b.x,b.y-18,b.kind==='echopearl'?'#d8c9bc':'#da8666',b.radius/100);event('relicImpact',{id:b.kind,x:b.x,y:b.y});if(s.status!=='playing'||s.transition)break;}}
   r.blasts=r.blasts.filter(b=>b.age<b.life);
   for(const b of r.bolts){if(s.status!=='playing'||s.transition)break;const x=b.x,y=b.y;b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;const vx=b.x-x,vy=b.y-y,den=vx*vx+vy*vy;for(const e of s.enemies){if(!valid(e))continue;const t=den?Math.max(0,Math.min(1,((e.x-x)*vx+(e.y-18-y)*vy)/den)):0;if(Hitboxes?Hitboxes.swept(e,{x,y},b,5):Math.hypot(e.x-x-vx*t,e.y-18-y-vy*t)<(e.r||0)+5){b.life=0;hit(e,b.damage,0,0,{weapon:'relic',relic:true});fx('spark',b.x,b.y,'#becaca',.7);break;}}}
   r.bolts=r.bolts.filter(b=>b.life>0);
  }
  return{...cafe,refreshStock,has,earn,majorDown,visit,buy,leave,landed,dodge,finisher,incoming,defend,damage,speed,slow,cast,dash,preserve,update,clearCombat};
 }
 return{LIMIT,FIRST_VISIT,METEOR,EMBER,ITEMS,owned,create};
});
