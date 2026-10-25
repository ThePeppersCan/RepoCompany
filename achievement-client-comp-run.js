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
 let cosmeticsAccess=null,cosmeticsBusy=false;
 async function cosmetics(action,finishId){
  if(!['state','buy','buy-runner'].includes(action)||!user||switched)throw Error('Connect your Repo Company account to use the shop.');
  if(cosmeticsBusy)throw Error('The shop is still processing your request.');
  const owner=user;cosmeticsBusy=true;
  try{
   if(!cosmeticsAccess||cosmeticsAccess.expires<Date.now()+10000){const result=await rpc('start');if(user!==owner||switched)throw Error('Your account changed. Reopen the game.');cosmeticsAccess=result.cosmeticsAccess;}
   if(!cosmeticsAccess?.ticket)throw Error('The shop is temporarily unavailable.');
   const response=await fetch(base+'/api/comp-run/cosmetics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,ticket:cosmeticsAccess.ticket,...(action==='buy'?{finishId}:action==='buy-runner'?{runnerId:finishId}:{})}),signal:AbortSignal.timeout(18000)});
   const result=await response.json();if(user!==owner||switched)throw Error('Your account changed. Reopen the game.');
   if(!response.ok){if(result.reconnect)cosmeticsAccess=null;throw Error(result.error||'The shop could not confirm your request. Refresh before retrying.');}
   return result;
  }finally{cosmeticsBusy=false;}
 }
 function account(id){
  if(id===user)return;session=null;cosmeticsAccess=null;user=id;
  if(id&&boundUser&&boundUser!==id)switched=true;
  dispatchEvent(new CustomEvent('repo-account-connection',{detail:{connected:!!id}}));
  if(!id||switched)return;boundUser=id;
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
   if(!session){const result=await rpc('start');if(user!==owner)return;session=result.session;cosmeticsAccess=result.cosmeticsAccess||cosmeticsAccess;saved=Object.fromEntries(result.achievements.map(a=>[a.id,a.unlocked_at]));}
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
 window.repoGameAchievements=Object.freeze({observe,connect,cosmetics,register(value){adapter=value;muted=value.muted||muted;},get identity(){return user;},get activitySession(){return user&&!switched?session:null;},request(kind,body){if(!['run-start','run-finish'].includes(kind)||!user||switched)return Promise.reject(Error('Sign in to Repo Company before starting a ranked run.'));return rpc(kind,body);},get active(){return started&&!testing&&!switched;},base});
 if(native){const update=state=>account(state.status==='online'?window.REPO_LAUNCHER_CONTEXT.accountId:null);native.onConnectionChanged(update);native.checkConnection().then(update).catch(()=>account(null));}
 if(game==='comp-run'){const control=document.getElementById('connect-account');if(control){const label=()=>{control.textContent=user?(switched?'REOPEN GAME TO CONNECT':'ACCOUNT CONNECTED'):'CONNECT ACCOUNT';control.disabled=!!native||switched;};control.addEventListener('click',connect);addEventListener('repo-account-connection',label);label();}}
 if(tag.dataset.bundled!=='true')load('achievement-notifications.js').then(()=>load('achievement-adapter-'+game+'.js')).catch(()=>{});
 setInterval(()=>{if(!native&&!user)frame.contentWindow.postMessage({type:'repo-achievements',game,kind:'hello'},base);try{adapter?.sample?.();}catch{/* A tracker failure must never stop gameplay. */}void flush();},2000);
 addEventListener('online',()=>{lastSent=0;void flush();});document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();else{lastSent=0;void flush();}});
})();
