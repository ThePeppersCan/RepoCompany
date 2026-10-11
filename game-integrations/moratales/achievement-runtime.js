(() => {
 'use strict';if(window.repoGameAchievements)return;
 const tag=document.currentScript,game=tag.dataset.game,base=new URL(tag.src).origin;
 if(!['moratales','manager','morogue'].includes(game))return;
 let user=null,boundUser=null,switched=false,session=null,started=false,testing=false,busy=false,dirty=false,facts={},saved={},adapter,muted=()=>false,lastSent=0,requestId=0,backoff=5000;
 const pending=new Map(),frame=document.createElement('iframe');frame.title='Repo Company achievement connection';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.style.cssText='position:fixed;width:1px;height:1px;left:-20px;top:-20px;border:0;opacity:0;pointer-events:none';frame.src=base+'/game-achievements-bridge.html?game='+game+'&parent='+encodeURIComponent(location.origin);document.body.append(frame);
 const storageKey=()=>`repo-achievement-observations-v1:${game}:${user}`;
 function persist(){if(user&&!switched)try{localStorage.setItem(storageKey(),JSON.stringify(facts));}catch{}}
 function account(id){
  if(id===user)return;session=null;user=id;
  if(!id)return;if(boundUser&&boundUser!==id){switched=true;return;}boundUser=id;
  try{const stored=JSON.parse(localStorage.getItem(storageKey())||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))facts=stored;}catch{}
  dirty=true;
 }
 function rpc(kind,body={}){return new Promise((resolve,reject)=>{const request=String(++requestId),timer=setTimeout(()=>{pending.delete(request);reject(Error('Sync timed out'));},18000);pending.set(request,{resolve,reject,timer});frame.contentWindow.postMessage({type:'repo-achievements',game,kind,request,user,...body},base);});}
 addEventListener('message',event=>{
  if(event.origin!==base||event.source!==frame.contentWindow||event.data?.type!=='repo-achievements'||event.data.game!==game)return;
  const msg=event.data;if(msg.kind==='account'){account(msg.user);return;}
  if(msg.kind==='result'){const call=pending.get(msg.request);if(!call)return;clearTimeout(call.timer);pending.delete(msg.request);if(msg.error){if(msg.reconnect)session=null;call.reject(Error(msg.error));}else call.resolve(msg.result);}
 });
 async function flush(){
  if(!started||testing||switched||!user||busy||(!dirty&&session)||Date.now()-lastSent<backoff)return;
  busy=true;lastSent=Date.now();const owner=user;
  try{
   if(!session){const result=await rpc('start');if(user!==owner)return;session=result.session;saved=Object.fromEntries(result.achievements.map(a=>[a.id,a.unlocked_at]));}
   const sending={...facts};dirty=false;const result=await rpc('progress',{session,facts:sending});if(user!==owner)return;
   const news=result.achievements.filter(a=>a.unlocked_at&&!saved[a.id]).map(a=>({id:a.id,score:a.score,unlocked_at:a.unlocked_at}));saved=Object.fromEntries(result.achievements.map(a=>[a.id,a.unlocked_at]));
   if(news.length)window.repoAchievementNotice?.show(news,{muted:!!muted()});
   backoff=5000;dispatchEvent(new CustomEvent('repo-achievements-synced',{detail:{repoScore:result.repoScore}}));
  }catch{dirty=true;backoff=Math.min(60000,backoff*2);}finally{busy=false;}
 }
 function observe(values,{active=true,practice=false,debug=false}={}){
  if(debug){testing=true;return;}if(practice||!active||testing||switched)return;started=true;
  if(!user)return;let changed=false;for(const[k,v]of Object.entries(values||{})){if(!/^[a-z][a-z0-9_]{0,48}$/.test(k)||!Number.isSafeInteger(v)||v<0)continue;if(v>(facts[k]||0)){facts[k]=v;changed=true;}}
  if(changed){dirty=true;persist();}void flush();
 }
 function load(file){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=base+'/'+file+'?v=20261011-achievements-1';script.dataset.game=game;script.onload=resolve;script.onerror=reject;document.body.append(script);});}
 window.repoGameAchievements=Object.freeze({observe,register(value){adapter=value;muted=value.muted||muted;},get identity(){return user;},get active(){return started&&!testing&&!switched;},base});
 if(tag.dataset.bundled!=='true')load('achievement-notifications.js').then(()=>load('achievement-adapter-'+game+'.js')).catch(()=>{});
 setInterval(()=>{if(!user)frame.contentWindow.postMessage({type:'repo-achievements',game,kind:'hello'},base);try{adapter?.sample?.();}catch{/* A tracker failure must never stop gameplay. */}void flush();},2000);
 addEventListener('online',()=>{lastSent=0;void flush();});document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();else{lastSent=0;void flush();}});
})();

;
(() => {
 'use strict';if(window.repoAchievementNotice)return;
 const base=new URL(document.currentScript.src).origin;let catalog,loading,audio,playing=false,queue=[];
 function load(){return loading||=(fetch(base+'/assets/achievements/catalogue.json').then(r=>r.json()).then(data=>catalog=new Map(data.games.flatMap(g=>g.achievements.map(a=>[a.id,{...a,game:g.name}])))).catch(()=>{loading=null;}));}
 function unlockAudio(){try{audio||=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch{}}
 addEventListener('pointerdown',unlockAudio,{once:true});addEventListener('keydown',unlockAudio,{once:true});
 function sound(){if(!audio||audio.state!=='running')return;try{
  const t=audio.currentTime,master=audio.createGain();master.gain.value=.075;master.connect(audio.destination);
  [392,523.251,659.255,783.991].forEach((frequency,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=frequency;g.gain.setValueAtTime(0,t+i*.105);g.gain.linearRampToValueAtTime(.55,t+i*.105+.016);g.gain.exponentialRampToValueAtTime(.001,t+i*.105+.52);o.connect(g);g.connect(master);o.start(t+i*.105);o.stop(t+i*.105+.55);});
 }catch{}}
 async function next(){
  if(playing||!queue.length)return;playing=true;await load();const item=queue.shift(),records=item.records,a=catalog?.get(records[0].id);
  if(!a){playing=false;next();return;}
  let toast=document.getElementById('repo-achievement-toast');if(!toast){toast=document.createElement('div');toast.id='repo-achievement-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.setAttribute('aria-atomic','true');document.body.append(toast);const style=document.createElement('style');style.textContent=`#repo-achievement-toast{position:fixed;left:auto;top:auto;margin:0;right:max(20px,env(safe-area-inset-right));bottom:max(22px,env(safe-area-inset-bottom));z-index:2147483647;display:flex;align-items:center;gap:16px;width:min(360px,calc(100vw - 32px));box-sizing:border-box;padding:15px 19px;background:linear-gradient(125deg,#172219,#101711);border:1px solid #c6a75f;box-shadow:0 12px 45px #0009,inset 0 0 0 3px #c6a75f13;color:#f5edd7;font:14px system-ui,sans-serif;pointer-events:none;opacity:0;transform:translateY(18px);transition:opacity .25s,transform .25s}#repo-achievement-toast.is-visible{opacity:1;transform:none}#repo-achievement-toast .repo-unlock-art{width:58px;height:58px;flex:none;background-repeat:no-repeat;image-rendering:pixelated}#repo-achievement-toast .repo-unlock-copy{min-width:0}#repo-achievement-toast small{display:block;color:#dfc88e;font-size:10px;letter-spacing:.13em;text-transform:uppercase;margin-bottom:6px}#repo-achievement-toast strong{display:block;font-size:16px;font-weight:600;line-height:1.3}#repo-achievement-toast p{margin:6px 0 0;color:#b7c2a9;font-size:12px}@media(prefers-reduced-motion:reduce){#repo-achievement-toast{transition:none;transform:none}}`;document.head.append(style);}
  toast.replaceChildren();const art=document.createElement('span'),copy=document.createElement('div'),label=document.createElement('small'),title=document.createElement('strong'),line=document.createElement('p');art.className='repo-unlock-art';art.setAttribute('aria-hidden','true');const t=a.art;art.style.backgroundImage=`url("${new URL(t.sheet,base)}")`;art.style.backgroundSize=`${t.sheetWidth/t.width*100}% ${t.sheetHeight/t.height*100}%`;art.style.backgroundPosition=`${t.x/(t.sheetWidth-t.width)*100}% ${t.y/(t.sheetHeight-t.height)*100}%`;copy.className='repo-unlock-copy';label.textContent=records.length>1?'Achievements unlocked':'Achievement unlocked';title.textContent=records.length>1?`${records.length} achievements earned`:a.name;line.textContent=`+${records.reduce((n,r)=>n+r.score,0)} RepoScore · ${a.game}`;copy.append(label,title,line);toast.append(art,copy);
  // A non-modal popover stays above game dialogs without interrupting controls.
  if(typeof toast.showPopover==='function'){toast.setAttribute('popover','manual');try{toast.showPopover();}catch{}}
  requestAnimationFrame(()=>toast.classList.add('is-visible'));if(!item.muted)sound();
  setTimeout(()=>{toast.classList.remove('is-visible');setTimeout(()=>{try{toast.hidePopover?.();}catch{}playing=false;next();},300);},records.length>1?6500:5000);
 }
 window.repoAchievementNotice=Object.freeze({show(records,{muted=false}={}){if(!records?.length)return;queue.push({records,muted});next();}});
})();

;
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
 client.register({sample,muted:()=>root.__velmoraTown?.audio?.muted===true||document.getElementById('mm-sound')?.checked===false});

})(typeof window==='undefined'?globalThis:window);
