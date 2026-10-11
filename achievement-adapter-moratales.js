(function(root){
 'use strict';
 const values=o=>Object.values(o||{}),count=o=>values(o).filter(Boolean).length,done=o=>['done','complete','completed'].includes(o?.phase),metric=n=>'m'+String(n).padStart(3,'0');
 function derive(s,t={}){
  const c=s.cafe||{},h=c.homestead||{},b=h.morabook||{},garden=s.catch?.garden||{},home=garden.home||{},living=home.living||{},q=b.merrowby?.investigation||{},af=q.aftermath||{},k=h.kitchen||{},hound=h.hound||{},bean=h.beanTrade||s.beans||{},f={};
  const award=(n,yes)=>{if(yes)f[metric(n)]=1;};
  const phases={1:!!c.welcomeCup?.openingComplete,2:s.agreement?.phase==='home',3:s.basement?.phase==='done',4:done(s.salmon),5:done(s.lake),6:done(s.catch),7:['explore','done'].includes(home.phase),8:living.petReady,9:done(living),10:done(living.welcome),11:h.reward,12:done(h.roomForTwo),13:done(c.festival),14:done(h),15:hound.care?.trust,16:hound.reopened,17:hound.tasted&&hound.seedGift,18:bean.met&&count(bean.contacts)>=8,19:done(h.orsin),20:done(h.orsin?.forest),21:k.learned?.bakingcoffee&&k.learned?.coffeewalnut,22:b.homeFlavours?.june,23:b.homeFlavours?.seven==='complete',24:b.story?.phase==='partner',25:c.oneMoreRound?.finale?.kitReturned,26:c.oneMoreRound?.firstPitch?.phase==='done',27:(b.bookings?.completed||0)>0,28:b.bookings?.ellisHelp?.done,29:b.bookings?.collected||b.bookings?.keptCraft,30:done(b.patchChase),31:(b.coachBooking?.completed||0)>0,32:done(b.orchardStory),33:b.orchardStory?.otherCopied,34:(b.readingBooking?.completed||0)>0,35:b.branch?.phase==='open',36:done(b.localStories?.photo),37:done(b.localStories?.regular),38:done(b.glassMile?.chapter),39:b.weatherWeft?.offDuty&&b.weatherWeft?.supperGone,40:(b.weatherWeft?.visit||0)>0,41:done(b.smallHours),42:done(b.fernward),43:done(b.portableCoffee),44:done(b.canopy),45:done(b.growingGallery),46:done(b.nurserySeven),47:done(b.namesBesideSums),48:values(b.namesBesideSums?.invitations).some(v=>v.status==='served'),49:done(b.pleasureGarden),50:b.pleasureGarden?.achievementAirRead,51:done(b.betweenways),52:b.betweenways?.returned,53:b.betweenways?.dellaHeard,54:b.betweenways?.inezHeard,55:values(b.picturePuzzle?.boards).some(v=>v.completed),56:s.eleriExchange||t.eleriExchange,57:b.nurserySeven?.phase==='complete'&&count(b.nurserySeven?.gifts)>0&&b.nurserySeven.ionaReturn&&b.nurserySeven.cafeReturn&&b.namesBesideSums?.notes,58:['settled'].includes(b.merrowby?.phase),59:b.merrowby?.lanternNight?.departureDone,60:q.initialBriefComplete,61:done(q.reading),62:done(q.cupTrail),63:done(q.timing),64:done(q.scent),65:done(q.route),66:done(q.names),67:done(q.postOffice),68:done(q.confession),69:done(q.barry),70:done(q.voyage),71:done(q.laurence),72:done(q.gathering),73:af.lanternLit,74:af.notebookDelivered,75:af.phase==='complete',80:c.achievementStats?.perfectService,89:c.achievementStats?.grownDishSold,97:c.achievementStats?.homegrownCup,98:done(h.staff?.quest)};
  for(const[n,yes]of Object.entries(phases))award(Number(n),yes);
  const items=living.items||[],placed=items.filter(i=>i.area==='cafe');
  const velmora=placed.some(i=>i.id==='festival-winning-duck'),brindle=placed.some(i=>/^(patch-|orchard-|payroom-|kiln-|reading-)/.test(i.id));
  const glass=placed.some(i=>/^(small-hours-first|fernward-first|pavilion-first|seven-rack-|margin-)/.test(i.id));
  award(99,velmora&&brindle&&glass);
  const dogItems=items.filter(i=>i.pet==='dog'&&i.area),now=s.calendar||0;
  award(100,hound.adopted&&dogItems.some(i=>i.type==='dog-bed')&&['food','water'].every(type=>dogItems.some(i=>i.type===type&&Number.isFinite(i.filledAt)&&now>=i.filledAt&&now-i.filledAt<4320)));
  f.paid_orders=values(c.memories).reduce((n,v)=>n+Math.max(0,v.visits||0),0);
  f.known_recipes=s.knownRecipes??count(k.learned);f.sold_dishes=count({...c.foodsServed,...c.achievementStats?.soldDishes});f.harvested_crops=count(h.harvested);f.business_bronze=Math.floor(c.serviceRevenue||0);
  f.player_cooked_dishes=count({...t.cooked,...k.achievementCooked});f.named_roasts=count({...t.roasts,...h.roastery?.achievementRoasts});f.branded_bags_sold=c.achievementStats?.bagsSold||0;
  f.growers_tasted=new Set(Object.keys(bean.discoveries||{}).map(id=>bean.lots?.[id]?.grower).filter(Boolean)).size;
  f.growers_received=new Set((bean.deliveries||[]).filter(p=>p.status==='collected').map(p=>bean.lots?.[p.origin]?.grower).filter(Boolean)).size;
  return f;
 }
 if(typeof module==='object'&&module.exports){module.exports={derive};return;}
 const client=root.repoGameAchievements;let user,tracking={},lastCafe,debug=false,hooked=new WeakSet(),lastService;
 const key=()=>`repo-moratales-tracking-v1:${client.identity}`;
 function save(){if(client.identity)try{localStorage.setItem(key(),JSON.stringify(tracking));}catch{}}
 function wrap(obj,name,fn){if(!obj||typeof obj[name]!=='function'||hooked.has(obj[name]))return;const original=obj[name];function wrapped(...args){let before;try{before=fn('before',args);}catch{}const result=original.apply(this,args);try{fn('after',args,result,before);}catch{}return result;}hooked.add(wrapped);try{obj[name]=wrapped;}catch{}}
 const read=k=>{try{return JSON.parse(localStorage.getItem('velmora-'+k)||'{}');}catch{return {};}};
 function sample(){
  const town=root.__velmoraTown,life=town?.life;if(!client.identity||!town?.active||!life?.cafe)return;
  if(user!==client.identity){user=client.identity;try{tracking=JSON.parse(localStorage.getItem(key())||'{}');}catch{tracking={};}lastService=null;}
  wrap(town,'loadCheckpoint',phase=>{if(phase==='before')debug=true;});
  const c=life.cafe.progress,h=c.homestead||{},farm=life.homestead,kitchen=farm?.kitchen,roast=farm?.roastery;tracking.cooked={...tracking.cooked,...h.kitchen?.achievementCooked};tracking.roasts={...tracking.roasts,...h.roastery?.achievementRoasts};
  const snap={cafe:c,agreement:read('hut-agreement'),basement:read('hut-basement'),salmon:read('hut-salmon'),lake:read('lake-quest'),catch:read('catch-quest'),calendar:town.calendar?.total||life.calendar?.total||0,beans:life.beanTrade?.data,eleriExchange:life.portableCoffee?.picnicData?.demonstrated};
  const recipes=root.VELMORA_BAKERY?.RECIPES;if(recipes)snap.knownRecipes=Object.values(recipes).filter(r=>!r.process&&kitchen?.known?.(r.id)).length;
  client.observe(derive(snap,tracking),{active:true,debug:debug||!!root.MORATALES_DEVELOPMENT||new URLSearchParams(location.search).has('checkpoint')});lastCafe=c;
 }
 client.register({sample,muted:()=>root.__velmoraTown?.audio?.muted===true});

})(typeof window==='undefined'?globalThis:window);
