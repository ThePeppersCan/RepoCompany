(function(root){
 'use strict';
 if(location.origin!=='https://moratales.repocompany.uk'||parent!==root||root.MORATALES_ACCOUNT_CHARACTERS)return;
 const Link=root.MORATALES_CHARACTER_LINK,origin='https://repocompany.uk',channel='morogue-account-v1',nonce=crypto.randomUUID();
 let frame=null,connected=false,loading=false,inflight=null,epoch=0,status='checking',stopped=false,again=false,lastCloud=null;
 const pending=new Map();
 const publishStatus=value=>{if(stopped)return;status=value;root.dispatchEvent(new CustomEvent('moratales-character-sync',{detail:{status}}));};
 function request(action,payload){return new Promise((resolve,reject)=>{
  if(stopped||!frame){reject(Error('Page closed'));return;}
  const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('Connection timed out'));},12000);
  pending.set(id,{resolve,reject,timer});frame.contentWindow.postMessage({channel,nonce,id,action,payload},origin);
 });}
 function ensureFrame(){
  if(frame||loading)return;loading=true;
  frame=document.createElement('iframe');frame.hidden=true;frame.title='Repo Company character connection';
  frame.onload=async()=>{if(stopped)return;try{await request('hello');if(stopped)return;connected=true;loading=false;void sync();}catch{loading=false;frame?.remove?.();frame=null;publishStatus('offline');}};
  frame.onerror=()=>{loading=false;frame?.remove?.();frame=null;publishStatus('offline');};
  frame.src=origin+'/morogue-account-bridge.html';document.body.append(frame);
 }
 async function perform(){
  const generation=epoch;
  try{
   const session=await request('session');if(stopped||generation!==epoch)return;
   const userId=session?.user?.id,expected=root.REPO_LAUNCHER_CONTEXT?.accountId;
   if(!userId){lastCloud=null;publishStatus('signed-out');return;}
   if(expected&&expected!==userId){lastCloud=null;publishStatus('account');return;}
   const raw=localStorage.getItem(Link.KEY),cloud=Link.snapshot(await request('characters',{userId}));
   if(stopped||generation!==epoch||raw!==localStorage.getItem(Link.KEY)||cloud.userId!==userId)return;
   lastCloud=cloud;const plan=Link.prepare(localStorage,cloud);
   if(plan.status!=='ready'){publishStatus(plan.status==='empty'?'connected':plan.status);return;}
   const saved=plan.changed?Link.snapshot(await request('characters-save',{userId,revision:plan.revision,characters:plan.characters})):cloud;
   if(stopped||generation!==epoch)return;
   Link.acknowledge(localStorage,plan,saved);lastCloud=saved;publishStatus(plan.conflicts.length?'conflict':'connected');
  }catch(error){if(!stopped&&generation===epoch)publishStatus(error.code==='revision_conflict'?'conflict':'offline');}
 }
 function sync(){
  if(stopped)return Promise.resolve({status});ensureFrame();if(!connected)return Promise.resolve({status});
  if(inflight){again=true;return inflight;}
  inflight=(async()=>{do{again=false;await perform();}while(again&&!stopped);return {status,userId:lastCloud?.userId||null,characters:lastCloud?.characters||[]};})().finally(()=>{inflight=null;});return inflight;
 }
 root.addEventListener('message',event=>{
  const m=event.data;if(!frame||event.source!==frame.contentWindow||event.origin!==origin||m?.channel!==channel||m.nonce!==nonce)return;
  if(m.event==='changed'){epoch++;lastCloud=null;publishStatus('checking');void sync();return;}
  const entry=pending.get(m.id);if(!entry)return;pending.delete(m.id);clearTimeout(entry.timer);
  if(m.error)entry.reject(Object.assign(Error(m.error),{code:m.code}));else entry.resolve(m.result);
 });
 root.addEventListener('storage',event=>{if(!event.key||event.key===Link.KEY||event.key==='moratales-save-slots-v1'||event.key.startsWith('hearthfolk-appearance-')){epoch++;void sync();}});
 root.addEventListener('focus',()=>void sync());root.addEventListener('online',()=>void sync());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void sync();});
 let timer=setInterval(()=>{if(!document.hidden)void sync();},10000);
 root.addEventListener('pagehide',()=>{stopped=true;epoch++;clearInterval(timer);for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(Error('Page closed'));}pending.clear();});
 root.addEventListener('pageshow',event=>{if(event.persisted&&stopped){stopped=false;loading=false;if(!connected){frame?.remove?.();frame=null;}timer=setInterval(()=>{if(!document.hidden)void sync();},10000);void sync();}});
 root.MORATALES_ACCOUNT_CHARACTERS=Object.freeze({sync,ready:sync,get status(){return status;}});
 void sync();
})(globalThis);
