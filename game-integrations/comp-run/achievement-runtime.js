(() => {
 'use strict';if(window.repoGameAchievements)return;
 const tag=document.currentScript,game=tag.dataset.game,base=tag.dataset.game==='comp-run'&&tag.dataset.portal==='https://repocompany.uk'?tag.dataset.portal:new URL(tag.src).origin;
 if(!['moratales','manager','morogue','comp-run'].includes(game))return;
 let user=null,boundUser=null,switched=false,session=null,started=false,testing=false,busy=false,dirty=false,facts={},saved={},adapter,muted=()=>false,lastSent=0,requestId=0,backoff=5000;
 const native=game==='comp-run'&&window.REPO_LAUNCHER_CONTEXT?.gameId===game&&typeof window.REPO_LAUNCHER?.requestAccount==='function'?window.REPO_LAUNCHER:null;
 const pending=new Map(),frame=document.createElement('iframe');frame.title='Repo Company account';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.style.cssText='position:fixed;width:1px;height:1px;left:-20px;top:-20px;border:0;opacity:0;pointer-events:none';frame.src=base+'/game-achievements-bridge.html?game='+game+'&parent='+encodeURIComponent(location.origin);
 let connection,returnFocus,connectionStatus,bridgeReady=false;
 if(!native)document.body.append(frame);
 function closeConnection(){if(!connection?.open)return;connection.close();returnFocus?.focus?.();}
 function connect(){
  if(native)return;
  if(game!=='comp-run')return;
  returnFocus=document.activeElement;
  if(!connection){connection=document.createElement('dialog');connection.className='account-connection';connection.setAttribute('aria-label','Connect your Repo Company account');const close=document.createElement('button');close.textContent='×';close.className='account-close';close.setAttribute('aria-label','Close account connection');close.onclick=closeConnection;connection.append(close,frame);document.body.append(connection);frame.tabIndex=0;frame.removeAttribute('aria-hidden');frame.style.cssText='display:block;width:100%;height:390px;border:0;background:#111214';connection.addEventListener('cancel',e=>{e.preventDefault();closeConnection();});connection.addEventListener('keydown',e=>e.stopPropagation());}
  if(!connectionStatus){connectionStatus=document.createElement('p');connectionStatus.setAttribute('role','status');connectionStatus.style.cssText='font:13px/1.6 "Segoe UI",sans-serif;color:#a4a6a7';connection.insertBefore(connectionStatus,frame);}
  connectionStatus.textContent='Connecting to Repo Company…';connectionStatus.hidden=bridgeReady;frame.style.display=bridgeReady?'block':'none';
  setTimeout(()=>{if(!bridgeReady&&connection.open)connectionStatus.textContent='Account services are unavailable right now. Close this panel and try again later. You can still play and save local records.';},6000);
  connection.showModal();connection.querySelector('button').focus();
 }
 const storageKey=()=>`repo-achievement-observations-v1:${game}:${user}`;
 function persist(){if(user&&!switched)try{localStorage.setItem(storageKey(),JSON.stringify(facts));}catch{}}
 function account(id){
  if(id===user)return;session=null;user=id;dispatchEvent(new CustomEvent('repo-account-connection',{detail:{connected:!!id}}));
  if(!id)return;if(boundUser&&boundUser!==id){switched=true;return;}boundUser=id;
  try{const stored=JSON.parse(localStorage.getItem(storageKey())||'{}');if(stored&&typeof stored==='object'&&!Array.isArray(stored))facts=stored;}catch{}
  dirty=true;
 }
 function rpc(kind,body={}){if(native)return native.requestAccount(kind,body);return new Promise((resolve,reject)=>{const request=String(++requestId),timer=setTimeout(()=>{pending.delete(request);reject(Error('Sync timed out'));},18000);pending.set(request,{resolve,reject,timer});frame.contentWindow.postMessage({type:'repo-achievements',game,kind,request,user,...body},base);});}
 addEventListener('message',event=>{
  if(event.origin!==base||event.source!==frame.contentWindow||event.data?.type!=='repo-achievements'||event.data.game!==game)return;
  const msg=event.data;if(game==='comp-run'&&msg.kind==='ready'){bridgeReady=true;if(connectionStatus)connectionStatus.hidden=true;if(connection)frame.style.display='block';return;}if(msg.kind==='account'){account(msg.user);return;}if(game==='comp-run'&&msg.kind==='close'){closeConnection();return;}
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
 window.repoGameAchievements=Object.freeze({observe,connect,register(value){adapter=value;muted=value.muted||muted;},get identity(){return user;},request(kind,body){if(!['run-start','run-finish'].includes(kind)||!user||switched)return Promise.reject(Error('Sign in to Repo Company before starting a ranked run.'));return rpc(kind,body);},get active(){return started&&!testing&&!switched;},base});
 if(native){const update=state=>account(state.status==='online'?window.REPO_LAUNCHER_CONTEXT.accountId:null);native.onConnectionChanged(update);native.checkConnection().then(update).catch(()=>account(null));}
 if(game==='comp-run'){const control=document.getElementById('connect-account');if(control){const label=()=>{control.textContent=user?(switched?'REOPEN GAME TO CONNECT':'ACCOUNT CONNECTED'):'CONNECT ACCOUNT';control.disabled=!!native||switched;};control.addEventListener('click',connect);addEventListener('repo-account-connection',label);label();}}
 if(tag.dataset.bundled!=='true')load('achievement-notifications.js').then(()=>load('achievement-adapter-'+game+'.js')).catch(()=>{});
 setInterval(()=>{if(!native&&!user)frame.contentWindow.postMessage({type:'repo-achievements',game,kind:'hello'},base);try{adapter?.sample?.();}catch{/* A tracker failure must never stop gameplay. */}void flush();},2000);
 addEventListener('online',()=>{lastSent=0;void flush();});document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();else{lastSent=0;void flush();}});
})();

;
(() => {
 'use strict';if(window.repoAchievementNotice)return;
 const base=window.repoGameAchievements?.base||new URL(document.currentScript.src).origin;let catalog,loading,audio,playing=false,queue=[];
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
 const maps=['sanctuary','hollow','undertow','playdate','small-hours','final-curtain','last-bloom','rupture'];
 const metric=(id,mode)=>'completed_'+id.replaceAll('-','_')+'_'+mode;
 function completionFacts(records){
  const facts={};let runners=0;
  for(const id of maps){let earned=false;for(const mode of ['normal','nightmare']){const r=records?.[id+':'+mode];if(Number.isFinite(r?.time)&&r.time>0){facts[metric(id,mode)]=1;earned=true;}}if(earned)runners++;}
  facts.runners_unlocked=runners;return facts;
 }
 if(typeof module!=='undefined'&&module.exports){module.exports={completionFacts};return;}
 const client=root.repoGameAchievements;if(!client)return;
 let owner=null,records={},queue={},run=null,sending=false,nextSend=0;
 const key=()=>`comp-run.account-results.v1:${owner}`;
 function save(){if(owner)try{localStorage.setItem(key(),JSON.stringify({records,queue}));}catch{}}
 function read(k){try{const value=JSON.parse(localStorage.getItem(k)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
 function bind(){
  const id=client.identity;if(!id||!client.active&&owner&&id!==owner)return false;
  if(owner&&owner!==id)return false;
  if(!owner){owner=id;const saved=read(key());records=saved.records||{};queue=saved.queue||{};
   // Installed storage is scoped by the launcher before game scripts execute.
   // Ordinary browser saves may belong to a guest or another account.
   if(root.REPO_LAUNCHER_STORAGE?.accountId===id){
    const keys=[...Array.from({length:6},(_,i)=>`comp-run.records.v${i+1}`),...Array.from({length:4},(_,i)=>`comp-run.records.small-hours.v${i+1}`),...Array.from({length:3},(_,i)=>`comp-run.records.final-curtain.v${i+1}`),'comp-run.records.last-bloom.v1','comp-run.records.last-bloom.v2','comp-run.records.last-bloom.v3','comp-run.records.rupture.v2','comp-run.records.rupture.v3','comp-run.records.rupture.v4'];
    for(const k of keys)for(const [name,r]of Object.entries(read(k))){if(Number.isFinite(r?.time)&&r.time>0&&(!records[name]||r.time<records[name].time))records[name]=r;}
    save();
   }
  }return true;
 }
 async function flush(){
  if(sending||Date.now()<nextSend||!bind())return;sending=true;
  try{for(const [id,payload]of Object.entries(queue)){
   if(Date.now()-payload.queuedAt>86400000){delete queue[id];save();continue;}
   try{await client.request('run-finish',payload);if(client.identity!==owner)return;delete queue[id];save();root.dispatchEvent(new CustomEvent('comp-run-record-synced'));}
   catch{nextSend=Date.now()+30000;break;}
  }}finally{sending=false;}
 }
 root.addEventListener('comp-run-started',event=>{
  run=null;const d=event.detail;if(!maps.includes(d?.courseId)||!['normal','nightmare'].includes(d.mode)||!bind())return;
  const active={owner,courseId:d.courseId,mode:d.mode};run=active;
  active.pending=(async()=>{for(const delay of [0,400,1000,2000]){if(delay)await new Promise(resolve=>setTimeout(resolve,delay));if(run!==active||client.identity!==active.owner)return null;try{const result=await client.request('run-start',d);active.id=result.run;return result;}catch{}}return null;})();
 });
 root.addEventListener('comp-run-completed',async event=>{
  const d=event.detail;if(!maps.includes(d?.courseId)||!['normal','nightmare'].includes(d.mode)||!Number.isFinite(d.time)||d.time<=0||!bind())return;
  const name=d.courseId+':'+d.mode;if(!records[name]||d.time<records[name].time)records[name]={time:d.time};save();client.observe(completionFacts(records));
  const active=run;run=null;if(!active||active.owner!==owner||active.courseId!==d.courseId||active.mode!==d.mode)return;
  await active.pending;if(!active.id||client.identity!==owner)return;
  // One queued best per board, always tied to the account that started the run.
  const payload={run:active.id,courseId:d.courseId,mode:d.mode,version:d.version,timeMs:Math.round(d.time*1000),splits:d.splits.map(v=>Math.round(v*1000)),queuedAt:Date.now()};
  if(!queue[name]||payload.timeMs<queue[name].timeMs)queue[name]=payload;save();void flush();
 });
 client.register({sample(){if(bind()){client.observe(completionFacts(records));void flush();}},muted(){return root.document?.hidden;}});
})(globalThis);
