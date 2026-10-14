(() => {
 'use strict';
 if(window.repoCharacterSync||parent!==window)return;
 const service=window.repoAccount,origin='https://moratales.repocompany.uk',channel='morogue-characters-v1';
 if(!service?.db?.auth)return;
 let frame=null,nonce='',connecting=null,inflight=null,again=false,epoch=0,userId=null,stopped=false,cloud=null,status='checking',queued=null;
 const requests=new Map(),controllers=new Set();
 const state=()=>({status,userId,characters:cloud?.userId===userId?cloud.characters:[]});
 function notice(){
  const dialog=document.getElementById('account-menu');if(!dialog)return;
  const text=userId?({conflict:'MoraTales characters differ between this browser and your account. Both appearances have been kept; other characters continue to sync.',account:'These browser characters belong to another account. Your current account’s characters remain available in Morogue.',offline:'Character sync is waiting for a connection. Your saved account characters are unchanged.'}[status]||''):'';
  let node=document.getElementById('repo-character-sync-status');
  if(!text){if(node&&!node.hidden)node.hidden=true;return;}
  if(!node){node=document.createElement('p');node.id='repo-character-sync-status';node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.style.cssText='flex:none;margin:12px clamp(24px,7.2vw,130px) 0;font:12px/1.7 Segoe UI,sans-serif;color:#c7c7af;max-width:none;';dialog.querySelector('.account-tabs')?.after(node);}
  if(node.textContent!==text)node.textContent=text;if(node.hidden)node.hidden=false;
 }
 function publish(value){status=value;notice();dispatchEvent(new CustomEvent('repo-character-sync',{detail:state()}));}
 function account(value){const id=value?.user?.id||null;if(id!==userId){userId=id;epoch++;cloud=null;for(const controller of controllers)controller.abort();publish(id?'checking':'signed-out');}return id;}
 const valid=generation=>!stopped&&epoch===generation;
 function snapshot(value,id){
  if(!value||value.userId!==id||!Number.isSafeInteger(value.revision)||value.revision<0||!Array.isArray(value.characters)||value.characters.length>4)throw Error('Account response changed.');
  const seen=new Set(),keys=['skin','hair','hair_colour','face','eyes','nose','mouth','eye_colour','shirt','trousers','shoes','hat','shirt_colour','trousers_colour','shoes_colour','hat_colour'];
  const characters=value.characters.map(item=>{
   if(!item||!/^(?:slot-[0-2]|current)$/.test(item.id)||seen.has(item.id)||typeof item.name!=='string'||!item.name.trim()||item.name.length>32||/[\u0000-\u001f\u007f]/.test(item.name)||!item.look||typeof item.look.skin!=='string'||typeof item.look.hair!=='string')throw Error('Invalid account character.');
   seen.add(item.id);const name=item.name.trim(),look={name};
   for(const key of keys)if(item.look[key]!==undefined){if(typeof item.look[key]!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(item.look[key]))throw Error('Invalid appearance.');look[key]=item.look[key];}
   return {id:item.id,name,look};
  });return {userId:id,revision:value.revision,characters};
 }
 async function api(session,generation,body){
  if(!valid(generation)||session.user.id!==userId)throw Error('Account changed.');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);controllers.add(controller);
  try{
   const response=await fetch('/api/characters/moratales',{method:body?'POST':'GET',cache:'no-store',credentials:'omit',headers:{Authorization:'Bearer '+session.access_token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal});
   if(!response.ok)throw Object.assign(Error('Character sync unavailable.'),{code:response.status===409?'conflict':'offline'});
   const result=snapshot(await response.json(),session.user.id);if(!valid(generation)||session.user.id!==userId)throw Error('Account changed.');return result;
  }finally{clearTimeout(timeout);controllers.delete(controller);}
 }
 function request(action,payload){
  if(!frame?.contentWindow)return Promise.reject(Error('Character bridge unavailable.'));
  const target=frame,id=crypto.randomUUID(),requestNonce=nonce;
  return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{requests.delete(id);reject(Error('Character connection timed out.'));},10000);requests.set(id,{resolve,reject,timer,target,nonce:requestNonce});target.contentWindow.postMessage({channel,nonce:requestNonce,id,action,payload},origin);});
 }
 function connect(){
  if(connecting)return connecting;
  connecting=new Promise((resolve,reject)=>{
   frame=document.createElement('iframe');frame.hidden=true;frame.title='Automatic MoraTales character sync';frame.referrerPolicy='strict-origin-when-cross-origin';nonce=crypto.randomUUID();
   const target=frame,timer=setTimeout(()=>reject(Error('Character bridge timed out.')),10000);
   frame.onload=()=>{clearTimeout(timer);if(stopped||target!==frame){reject(Error('Page closed.'));return;}request('hello').then(value=>value===true?resolve():reject(Error('Character bridge unavailable.')),reject);};
   frame.onerror=()=>{clearTimeout(timer);reject(Error('Character bridge unavailable.'));};
   frame.src=origin+'/interface/vampire-survivor/character-bridge.html';document.body.append(frame);
  }).catch(error=>{frame?.remove();frame=null;connecting=null;throw error;});return connecting;
 }
 async function perform(){
  let generation=epoch;
  try{
   const result=await service.db.auth.getSession();if(!valid(generation))return;
   if(result.error)throw result.error;const session=result.data?.session;account(session);generation=epoch;
   if(!session){publish('signed-out');return;}
   publish('syncing');
   const saved=await api(session,generation);if(!valid(generation))return;cloud=saved;
   await connect();if(!valid(generation))return;
   const plan=await request('sync-plan',saved);if(!valid(generation))return;
   if(plan?.status==='empty'){publish('connected');return;}
   if(plan?.status==='account'||plan?.status==='conflict'){publish(plan.status);return;}
   if(plan?.status!=='ready'||plan.userId!==session.user.id||plan.revision!==saved.revision||typeof plan.planId!=='string')throw Error('Character connection changed.');
   const proposed=snapshot(plan,session.user.id);
   const updated=plan.changed?await api(session,generation,{revision:saved.revision,characters:proposed.characters}):saved;
   if(!valid(generation))return;cloud=updated;
   if(await request('sync-commit',{planId:plan.planId,snapshot:updated})!==true)throw Error('Character sync could not be confirmed.');
   if(valid(generation))publish(plan.conflict?'conflict':'connected');
  }catch(error){if(valid(generation))publish(error.code==='conflict'?'conflict':'offline');}
 }
 function sync(){
  if(stopped)return Promise.resolve(state());
  if(inflight){again=true;return inflight;}
  inflight=(async()=>{do{again=false;await perform();}while(again&&!stopped);return state();})().finally(()=>{inflight=null;});return inflight;
 }
 function schedule(){clearTimeout(queued);queued=setTimeout(()=>void sync(),120);}
 addEventListener('message',event=>{
  const message=event.data;if(event.origin!==origin||event.source!==frame?.contentWindow||message?.channel!==channel||message.nonce!==nonce)return;
  if(message.event==='changed'){schedule();return;}
  const pending=requests.get(message.id);if(!pending||pending.target!==frame||pending.nonce!==nonce)return;
  requests.delete(message.id);clearTimeout(pending.timer);if(message.error)pending.reject(Error('MoraTales character sync unavailable.'));else pending.resolve(message.result);
 });
 service.db.auth.onAuthStateChange((_event,session)=>{account(session);schedule();});
 addEventListener('repo-account-state',()=>{if((service.state.user?.id||null)!==userId)schedule();});
 new MutationObserver(notice).observe(document.body,{childList:true,subtree:true});
 addEventListener('focus',schedule);addEventListener('online',schedule);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
 let timer=setInterval(()=>{if(!document.hidden&&userId)void sync();},30000);
 addEventListener('pagehide',()=>{stopped=true;epoch++;clearInterval(timer);clearTimeout(queued);for(const controller of controllers)controller.abort();for(const pending of requests.values()){clearTimeout(pending.timer);pending.reject(Error('Page closed.'));}requests.clear();});
 addEventListener('pageshow',event=>{if(event.persisted&&stopped){stopped=false;timer=setInterval(()=>{if(!document.hidden&&userId)void sync();},30000);schedule();}});
 window.repoCharacterSync=Object.freeze({sync,ready:sync,get state(){return state();}});
 void sync();
})();
