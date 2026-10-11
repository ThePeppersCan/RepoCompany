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
 const metric=n=>'m'+String(n).padStart(3,'0'),values=o=>Object.values(o||{}),list=o=>Array.isArray(o)?o:values(o),count=o=>Object.keys(o||{}).length;
 const seasonId=y=>y+'-'+String((y+1)%100).padStart(2,'0');
 const days=(a,b)=>(Date.parse(b)-Date.parse(a))/86400000,year=s=>Number(String(s||'').slice(0,4));
 function createTracker(memory={}){
  memory.facts||={};memory.matches||={};memory.players||={};memory.promoted||={};memory.signed||={};memory.spells||={};memory.departments||={};memory.seasons||={};memory.seen||={};memory.cups||={};
  const facts=memory.facts,award=(n,condition=true)=>{if(condition)facts[metric(n)]=1;},max=(key,value)=>facts[key]=Math.max(facts[key]||0,Math.floor(value||0));let latest;
  function personal(e,d){const spells=[...(d.managerMarket?.spellHistory||[]),d.managerMarket?.playerSpell].filter(Boolean);return spells.some(s=>s.clubId===e.clubId&&e.date>=s.startDate&&(!s.endDate||e.date<=s.endDate));}
  const playerKey=(club,id)=>club+':'+id;
  function apps(id,club,after='',type=''){return values(memory.matches).filter(m=>m.clubId===club&&m.date>=after&&(!type||m.type===type)&&m.appeared.includes(String(id))).length;}
  function story(e,d,player){
   if(memory.seen[e.id])return;memory.seen[e.id]=true;const meta=e.metadata||{},club=e.clubId,id=e.playerIds?.[0],pk=playerKey(club,id),isOurs=personal(e,d);
   if(e.type==='TRANSFER_COMPLETED'){
    const to=meta.toClubId||club,from=meta.fromClubId,pid=e.playerIds?.[0],ours=personal({...e,clubId:to},d),out=personal({...e,clubId:from},d),old=memory.signed[playerKey(from,pid)];
    if(out&&old){award(33,meta.fee-old.fee>=1000000&&apps(pid,from,old.date)>=10);old.sold=true;}
    if(ours&&String(meta.transferType).toUpperCase()!=='LOAN'){
     award(26);const previous=memory.signed[playerKey(to,pid)],scouted=(d.transferScouted||[]).some(v=>String(v)===String(pid));
     memory.signed[playerKey(to,pid)]={date:e.date,fee:meta.fee||0,scouted,free:!from,returning:!!previous?.sold,from,world:latest?.clubs?.find(c=>c.id===from)?.world};
     award(34,(d.transferWindows||[]).some(w=>[w.end,w.endDate].includes(e.date)));
    }
   }
   if(!isOurs)return;
   if(e.type==='ACADEMY_PROMOTION'){award(39);const p=player||values(d.squads).flat().find(p=>String(p.id)===String(id));memory.promoted[pk]||={date:e.date,ovr:p?.ovr,season:e.seasonId};}
   if(e.type==='COMPETITIVE_DEBUT')award(40,!!memory.promoted[pk]);
   if(e.type==='FIRST_GOAL')award(41,!!memory.promoted[pk]);
   if(e.type==='PLAYER_JOINS_STAFF')award(49);
   if(e.type==='PLAYER_AWARD')award(47,!!memory.promoted[pk]&&/YOUNG PLAYER OF (THE )?SEASON/i.test(meta.award||'')&&!/WORLD/i.test(meta.scope||meta.award||''));
   if(e.type==='FACILITY_UPGRADE'){const i=['training','academy','medical','stadium'].indexOf(meta.facility);if(i>=0)award(54+i);}
   if(e.type==='MANAGER_APPOINTMENT'){award(70,meta.source==='offer'&&d.jobSearchState?.startingMode==='unemployed');const old=Object.keys(memory.spells).filter(k=>k!==club);award(71,old.length>0&&['job','job-market','offer','appointment'].some(s=>String(meta.source).includes(s)));memory.spells[club]||={start:e.date};}
   if(e.type==='CUP_WIN'||e.type==='CHAMPIONS_CROWN_WIN'){const c=memory.cups[club+':'+e.seasonId]||={};if(e.type==='CHAMPIONS_CROWN_WIN'){award(89);c.crown=true;}else if(/league_cup/.test(e.competitionId)||/league cup/i.test(meta.competition)){award(86);c.leagueCup=true;}else{award(85);c.national=true;}}
  }
  function match(x){
   const f=x.fixture,club=x.clubId;if(!f?.played||f.type==='FRIENDLY'||!club||![f.homeClubId,f.awayClubId].includes(club)||memory.matches[f.fixtureId])return;
   const home=f.homeClubId===club,side=home?'home':'away',gf=Number(home?f.homeScore:f.awayScore),ga=Number(home?f.awayScore:f.homeScore),win=gf>ga||f.decidedOnPenalties&&(f.shootoutWinnerId||f.ccShootoutWinnerId)===club;
   const report=f.matchday?.report||f.matchReport||{},participation=f.matchday?.participation||{},kick=memory.kickoffs?.[f.fixtureId],starters=(kick?.starters?.map(p=>String(p.id))||Object.entries(participation).filter(([,p])=>p.team===side&&p.started).map(([id])=>id)),goals=(report.goalEvents||[]).filter(g=>g.teamId===club),appeared=Object.entries(participation).filter(([,p])=>p.team===side&&p.minutes>0).map(([id])=>id);
   const result={clubId:club,date:f.date,season:x.seasonId||f.seasonId,type:f.type,win,loss:gf<ga||!!f.decidedOnPenalties&&!win,clean:ga===0,scored:gf>0,starters,appeared:appeared.length?appeared:starters,opponent:home?f.awayClubId:f.homeClubId,home,style:kick?.attacking};memory.matches[f.fixtureId]=result;
   if(win&&f.type==='CHAMPIONS_CROWN'&&f.ccStage==='FINAL'){award(89);(memory.cups[club+':'+result.season]||={}).crown=true;}if(x.cupFinal&&x.eliminatedOpponent){const cups=memory.cups[club+':'+result.season]||={};if(x.cupKind==='league'){award(86);cups.leagueCup=true;}else{award(85);cups.national=true;}}
   award(1,win);award(2,win&&!home);award(3,win&&ga===0);award(4,win&&gf-ga>=4);
   award(5,goals.some(g=>goals.filter(q=>q.playerId===g.playerId).length>=3));award(6,Object.entries(x.assists||{}).some(([id,n])=>n>=3&&(starters.includes(id)||appeared.includes(id))));
   award(7,win&&starters.length===3&&starters.every(id=>goals.some(g=>String(g.playerId)===id)));
   award(8,goals.some(g=>{const p=participation[g.playerId];return p?.team===side&&!p.started&&p.entered!=null&&g.minute>=p.entered;}));
   const firstHalf=(report.goalEvents||[]).filter(g=>g.minute<=45);award(9,win&&firstHalf.filter(g=>g.teamId!==club).length-firstHalf.filter(g=>g.teamId===club).length>=2);
   const winning=goals.slice().sort((a,b)=>a.minute-b.minute)[ga];award(10,win&&gf>ga&&winning?.minute>=85);
   award(11,win&&f.decidedOnPenalties);const penalties=x.engine?.achievementShootout;award(12,win&&f.decidedOnPenalties&&penalties?.attempts?.[side]>0&&penalties.attempts[side]===penalties.score?.[side]);
   award(13,win&&(report.disciplineEvents||[]).some(e=>e.team===side&&e.minute<75&&['RED','SECOND_YELLOW','red','secondYellow'].includes(e.card||e.type)));
   const own=x.club||latest?.club,rivals=own?.rivals||(own?.rival?[own.rival]:[]);const rival=list(rivals).some(r=>(typeof r==='object'?r.id:r)===result.opponent||r===(x.opponent?.name||latest?.clubs?.find(c=>c.id===result.opponent)?.name));award(14,win&&rival);
   if(win&&rival&&f.type==='LEAGUE')award(15,values(memory.matches).some(m=>m.clubId===club&&m.season===result.season&&m.opponent===result.opponent&&m.win&&m.home!==home&&m.type==='LEAGUE'));
   award(16,f.type==='CUP'&&x.eliminatedOpponent===true&&Number(x.club?.tier)-Number(x.opponent?.tier)>=2);
   award(17,win&&report.xg&&Number(report.xg[home?'away':'home'])-Number(report.xg[side])>=1);
   const stats=x.engine?.teamStats||report.teamStats;const team=stats?.[side]||Object.values(stats||{})[home?0:1];const totalPossession=values(stats).reduce((n,t)=>n+Number(t.possession||0),0);award(18,win&&totalPossession>0&&Number(team?.possession||0)/totalPossession<=.4);
   const same=values(memory.matches).filter(m=>m.clubId===club&&m.season===result.season),wins=same.filter(m=>m.win);
   award(19,new Set(wins.map(m=>m.style).filter(Boolean)).size>=3);award(20,new Set(wins.filter(m=>m.starters.length===3).map(m=>[...m.starters].sort().join(','))).size>=3);
   let unbeaten=0,streak=0,clean=0,scoring=0;let lastSpell;for(const m of values(memory.matches).filter(m=>m.clubId===club).sort((a,b)=>a.date.localeCompare(b.date))){const spell=[...(latest?.save?.managerMarket?.spellHistory||[]),latest?.save?.managerMarket?.playerSpell].filter(Boolean).find(s=>s.clubId===club&&m.date>=s.startDate&&(!s.endDate||m.date<=s.endDate))?.startDate;if(lastSpell&&spell!==lastSpell)unbeaten=streak=clean=scoring=0;lastSpell=spell;unbeaten=m.loss?0:unbeaten+1;streak=m.win?streak+1:0;clean=m.clean?clean+1:0;scoring=m.scored?scoring+1:0;max('unbeaten_streak',unbeaten);max('winning_streak',streak);max('clean_sheet_streak',clean);max('scoring_streak',scoring);}
   max('career_wins',values(memory.matches).filter(m=>m.win).length);
   award(37,win&&starters.length===3&&starters.every(id=>memory.signed[playerKey(club,id)]));award(42,win&&starters.length===3&&starters.every(id=>memory.promoted[playerKey(club,id)]));
   award(63,win&&kick?.starters?.length===3&&kick.starters.every(p=>p.fitness>=90&&p.sharpness>=80));
   award(62,win&&kick?.starters?.some(p=>memory.players[playerKey(club,p.id)]?.lowFitness&&p.fitness>=90&&p.sharpness>=75));
   award(72,win&&!!memory.spells[result.opponent]);const initial=values(memory.matches).filter(m=>m.clubId===club&&m.type==='LEAGUE'&&m.date>=(latest?.save?.managerMarket?.playerSpell?.startDate||memory.spells[club]?.start||'')).slice(0,5);award(73,initial.filter(m=>m.win).length>=3);
   award(100,win&&f.type==='CHAMPIONS_CROWN'&&f.ccStage==='FINAL'&&starters.length===3&&starters.every(id=>memory.promoted[playerKey(club,id)]));
  }
  function career(x){
   latest=x;const d=x.save,club=x.clubId;if(!d||d.careerMode!=='MANAGER')return;
   for(const spell of [...(d.managerMarket?.spellHistory||[]),d.managerMarket?.playerSpell].filter(Boolean))memory.spells[spell.clubId]||={start:spell.startDate};
   const history=(d.livingSquad?.careerMemory?.events||[]).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));for(const e of history)story(e,d);
   // Backfill only fixtures that belong to one of this manager's recorded spells.
   for(const f of d.fixtures||[])if(f.played&&f.type!=='FRIENDLY'&&f.resultMode!=='WORLD_SIM')for(const id of [f.homeClubId,f.awayClubId])if(personal({clubId:id,date:f.date},d)){match({fixture:f,clubId:id,seasonId:f.seasonId||d.careerTime?.seasonId,club:x.clubs?.find(c=>c.id===id),opponent:x.clubs?.find(c=>c.id===(f.homeClubId===id?f.awayClubId:f.homeClubId))});break;}
   if(!club)return;
   const stats=x.stats||[],squad=(d.squads?.[club]||[]),exp=d.careerRuntime?.expansion||{},department=exp.clubs?.[club]||{},old=memory.departments[club]||{},playerFacts=x.players||[];
   const fulfilled=(d.playerPromises||[]).filter(p=>p.clubId===club&&p.type==='PLAYING_TIME'&&p.status==='fulfilled');award(64,fulfilled.length>0);award(65,new Set(fulfilled.map(p=>p.playerId)).size>=3);
   for(const p of playerFacts){const pk=playerKey(club,p.id),previous=memory.players[pk],signed=memory.signed[pk],promoted=memory.promoted[pk],rows=stats.filter(r=>String(r.playerId)===String(p.id)&&r.clubId===club&&r.dataQuality!=='LEGACY_UNSPLIT'),totalApps=rows.reduce((n,r)=>n+Number(r.apps||0),0),ap=apps(p.id,club,signed?.date||'');
    if(signed){award(27,signed.scouted&&ap>=5);award(28,signed.free&&ap>=10);award(35,signed.returning&&ap>0);}
    if(promoted){award(40,totalApps>0);award(41,rows.some(r=>r.goals>0));award(44,rows.some(r=>r.competitionType==='LEAGUE'&&r.starts>=10));award(45,promoted.ovr!=null&&p.ovr-promoted.ovr>=5&&totalApps>=20);award(50,rows.some(r=>r.competitionType==='LEAGUE'&&r.goals>=20));}
    if(previous){award(38,!p.onLoan&&previous.contract&&days(x.date,previous.contract)>=0&&days(x.date,previous.contract)<=183&&days(previous.contract,p.contractEndDate)>=365);if(previous.trustBase!=null&&p.managerTrust>=80&&totalApps-previous.trustApps>=10)(memory.rebuilt||={})[pk]=true;}
    memory.players[pk]={...(previous||{}),contract:p.contractEndDate,lowFitness:previous?.lowFitness||p.fitness<65,...(previous?.trustBase==null&&p.managerTrust<=60?{trustBase:p.managerTrust,trustApps:totalApps}:{})};
   }
   award(66,Object.keys(memory.rebuilt||{}).filter(k=>k.startsWith(club+':')).length>=3);
   award(36,new Set(Object.values(memory.signed).map(p=>p.world).filter(Boolean)).size>=3);
   const loans=list(d.livingSquad?.loanHistory);for(const loan of loans){award(30,loan.loanClubId===club&&loan.appearances>=10);award(31,loan.buyOption?.buyerId===club&&loan.buyOption.status==='EXERCISED'&&squad.some(p=>p.id===loan.playerId&&!p.onLoan));const previous=(memory.loans||={})[loan.id]||(loan.startOvr!=null?{ovr:loan.startOvr}:null);if(loan.parentClubId===club&&loan.status==='RETURNED'&&previous){const p=squad.find(p=>p.id===loan.playerId);award(48,loan.appearances>=10&&p&&p.ovr-previous.ovr>=2);}if(loan.status==='ACTIVE'&&!previous){const p=values(d.squads).flat().find(p=>p.id===loan.playerId);memory.loans[loan.id]={ovr:p?.ovr};}}
   for(const pre of exp.precontracts||[]){const pid=pre.playerId;if((pre.toClubId||pre.buyerId)===club&&squad.some(p=>p.id===pid)&&apps(pid,club,pre.joinDate||pre.date||'')>=10)award(29);}
   const ledger=department.ledger||[];award(32,ledger.some(t=>t.amount>0&&/^Sell-on received:/.test(t.label)));award(60,ledger.some(t=>t.amount>0&&/performance bonus/.test(t.label)));
   const staff=department.staff||[];for(const p of staff){const before=old.staff?.[p.key];award(51,!!before===false&&!!old.staff&&p.joined>=memory.spells[club]?.start);award(52,before?.course&&!p.course&&p.quality>before.quality);award(53,p.role==='coach'&&p.quality>=80&&before?.initialQuality!=null&&p.quality-before.initialQuality>=5);}
   award(67,['coach','academy','medical'].every(role=>staff.some(p=>p.role===role&&p.quality>=75&&!p.course)));
   for(const project of department.projects||[]){const n=['training','academy','medical','stadium'].indexOf(project.type);if(n>=0)award(54+n,project.status==='COMPLETE');}
   award(58,['training','academy','medical','stadium'].every(k=>department.facilities?.[k]>=3));award(59,department.sponsor?.paid?.length>=2);
   const paid=(department.paidMonths||[]).slice().sort();
   for(const r of department.reports||[])if(r.status==='SIGNED'&&(department.missions||[]).some(m=>m.region===r.region&&m.status==='COMPLETE'&&r.date>=m.started&&r.date<=m.end))(memory.academyWorlds||={})[r.region]=true;award(46,Object.keys(memory.academyWorlds||{}).length>=3);
   award(43,(department.youthHistory||[]).some(y=>y.table?.[0]?.id===club&&y.fixtures?.every(f=>f.played)));
   const completed=values(memory.matches).filter(m=>m.clubId===club&&m.date>=(d.managerMarket?.playerSpell?.startDate||''));award(68,(d.careerRuntime?.boardConfidence||0)>=90&&completed.length>=10);
   award(69,(d.managerMarket?.offers||[]).some(o=>o.type==='CONTRACT'&&o.status==='ACCEPTED'&&o.clubId===club));
   const awards=d.roadToGlory?.managerAwards||[];award(74,awards.some(a=>a.type==='MANAGER_OF_MONTH'));award(75,awards.some(a=>a.type==='MANAGER_OF_SEASON'));
   const seasons=d.roadToGlory?.careerHistory||[];for(const season of seasons)seasonEnd({entry:season,tier:(d.roadToGlory?.clubHistory?.[season.clubId]||[]).find(h=>h.seasonId===season.seasonId)?.tier,clubId:season.clubId,date:x.date},d);
   for(const c of d.careerChallenge?.history||[]) {award(95,c.success&&/escape/i.test(c.key||c.title));award(96,c.success&&/academy/i.test(c.key||c.title));}
   for(const [key,cups]of Object.entries(memory.cups)){const season=memory.seasons[key];award(87,season?.champion&&season.tier===1&&cups.national);award(90,season?.champion&&season.tier===1&&cups.national&&cups.crown);const [cid,sid]=key.split(':');const prev=memory.cups[cid+':'+seasonId(year(sid)-1)];award(93,cups.crown&&prev?.crown);}
   const top=values(memory.seasons).filter(s=>s.champion&&s.tier===1);award(94,new Set(top.map(s=>s.world)).size>=4);
   memory.departments[club]={staff:Object.fromEntries(staff.map(p=>[p.key,{course:p.course,quality:p.quality,initialQuality:old.staff?.[p.key]?.initialQuality??p.quality}])),paidMonths:paid};
  }
  function seasonEnd(x,d=latest?.save){const e=x.entry;if(!e||!d)return;const club=e.clubId||x.clubId,key=club+':'+e.seasonId,tier=Number(x.tier),history=d.managerMarket||{},spells=[...(history.spellHistory||[]),history.playerSpell].filter(Boolean),full=spells.some(s=>s.clubId===club&&s.startDate<=year(e.seasonId)+'-08-01'&&(!s.endDate||s.endDate>=(year(e.seasonId)+1)+'-05-31'));
   if(!spells.some(s=>s.clubId===club&&s.startDate<=(year(e.seasonId)+1)+'-05-31'&&(!s.endDate||s.endDate>=year(e.seasonId)+'-08-01')))return;const promoted=/PROMOTION/.test(e.status)||e.status==='CHAMPIONS'&&tier>1,champion=e.status==='CHAMPIONS';memory.seasons[key]={...e,tier,full,promoted,champion};award(76,champion);award(77,promoted);award(78,promoted&&/PLAYOFF/i.test(e.status));award(91,full&&e.losses===0&&e.wins+e.draws>0);
   const index=['Velmora','Kharova','Caldria','Ezuraya'].indexOf(e.world);if(index>=0)award(81+index,champion&&tier===1);
   award(88,(d.roadToGlory?.championsCrownQualifications||x.qualifiers||[]).some(q=>q.clubId===club&&q.seasonId===e.seasonId));
   const previous=values(memory.seasons).find(s=>s.clubId===club&&year(s.seasonId)===year(e.seasonId)-1),sameSpell=spells.some(s=>s.clubId===club&&s.startDate<=year(e.seasonId)-1+'-08-01'&&(!s.endDate||s.endDate>=(year(e.seasonId)+1)+'-05-31'));
   award(80,full&&sameSpell&&previous?.promoted&&e.status!=='RELEGATED');award(99,promoted&&sameSpell&&previous?.status==='RELEGATED');
   const spell=spells.find(s=>s.clubId===club&&s.startDate<=year(e.seasonId)+'-08-01'&&(!s.endDate||s.endDate>=(year(e.seasonId)+1)+'-05-31')),continuous=spell?values(memory.seasons).filter(h=>h.clubId===club&&h.full&&year(h.seasonId)>=year(spell.startDate)):[];
   award(79,(tier===2&&promoted||tier===1)&&spell?.tier===4);award(98,continuous.length>=5);
   award(92,champion&&tier===1&&[1,2].every(offset=>continuous.some(h=>h.champion&&h.tier===1&&year(h.seasonId)===year(e.seasonId)-offset)));
   award(97,promoted&&!!d.careerRuntime?.expansion?.customClubs?.[club]&&tier>=2&&tier<=4);
  }
  function event(kind,x){if(kind==='career')career(x);else if(kind==='kickoff'){(memory.kickoffs||={})[x.fixture.fixtureId]={starters:x.starters,attacking:x.attacking};}else if(kind==='match')match(x);else if(kind==='memory'&&latest)story(x.memory,latest.save,x.player);else if(kind==='season')seasonEnd(x);else if(kind==='managerRenewed')award(69);else if(kind==='appointment'){award(71,!!x.hadPrevious);award(70,x.startedUnemployed&&!x.hadPrevious);}else if(kind==='operatingMonth'){const old=(memory.settlements||={})[x.clubId],month=Number(x.month.slice(0,4))*12+Number(x.month.slice(5,7));if(!old||old.month!==month){const streak=x.arrears===0?(old?.month===month-1?old.streak+1:1):0;memory.settlements[x.clubId]={month,streak};award(61,streak>=12);}}else if(kind==='challenge'){award(95,x.success&&/escape/i.test(x.key));award(96,x.success&&/academy/i.test(x.key));}return facts;}
  return {event,match,career,memory,facts};
 }
 if(typeof module==='object'&&module.exports){module.exports={createTracker};return;}
 const client=root.repoGameAchievements;let user,tracker,seed,debug=false,queued=[];const wrapped=new WeakSet();
 const storeKey=()=>`repo-manager-tracking-v1:${client.identity}:${seed}`;
 function event(kind,data){if(!client.identity){if(kind==='career')queued=[{kind,data}];return;}if(debug)return;if(user!==client.identity||seed!==data.worldSeed){user=client.identity;seed=data.worldSeed;let saved;try{saved=JSON.parse(localStorage.getItem(storeKey())||'{}');}catch{saved={};}tracker=createTracker(saved);}try{client.observe(tracker.event(kind,data),{active:true,debug});localStorage.setItem(storeKey(),JSON.stringify(tracker.memory));}catch{}}
 function sample(){const api=root.VELMORA_MANAGER_DEBUG;if(api)for(const name of Object.keys(api)){const fn=api[name];if(typeof fn!=='function'||wrapped.has(fn)||!/ForTest|seed|simulate|set|force|advance/i.test(name))continue;const replacement=function(...a){debug=true;client.observe({},{debug:true});return fn.apply(this,a);};wrapped.add(replacement);try{api[name]=replacement;}catch{}}
  if(client.identity&&queued.length){const pending=queued;queued=[];for(const q of pending)event(q.kind,q.data);}
 }
 root.repoManagerAchievements={event};client.register({sample,muted:()=>root.dashboardAudio?.muted===true});sample();
})(typeof window==='undefined'?globalThis:window);
