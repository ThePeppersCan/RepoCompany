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
