(() => {
 'use strict';
 const placeholder='/assets/game-activity.svg',entries=new Map(),pending=new Map(),watching=new Map();
 const hosts=new Set(['shared.akamai.steamstatic.com','shared.fastly.steamstatic.com','shared.cloudflare.steamstatic.com','shared.steamstatic.com','cdn.akamai.steamstatic.com','cdn.cloudflare.steamstatic.com']);
 const fallback=id=>['https://shared.steamstatic.com/store_item_assets/steam/apps/'+id+'/capsule_184x69.jpg','https://cdn.cloudflare.steamstatic.com/steam/apps/'+id+'/capsule_184x69.jpg'];
 function valid(value,id){try{const u=new URL(value);return u.protocol==='https:'&&hosts.has(u.hostname)&&!u.port&&!u.username&&!u.password&&!u.hash&&new RegExp('^/(?:store_item_assets/steam|steam)/apps/'+id+'/(?:[a-f0-9]{40}/)?capsule_184x69\\.(?:jpg|png|webp)$').test(u.pathname)&&(!u.search||/^\?t=[0-9]{1,16}$/.test(u.search));}catch{return false;}}
 function remember(id,entry){entries.delete(id);entries.set(id,entry);while(entries.size>200)entries.delete(entries.keys().next().value);return entry;}
 async function metadata(id){
  const cached=entries.get(id);if(cached&&cached.expires>Date.now())return cached;
  if(pending.has(id))return pending.get(id);
  const work=(async()=>{
   try{const r=await fetch('/api/steam-artwork?app='+id,{credentials:'omit',signal:AbortSignal.timeout(7000)});if(!r.ok)throw Error('Artwork unavailable');const data=await r.json();const images=Array.isArray(data.images)?data.images.filter(url=>valid(url,id)).slice(0,4):[];return remember(id,{images:images.length?images:fallback(id),expires:Date.now()+(data.resolved?86400000:300000),failed:new Set(),chosen:null});}
   catch{return remember(id,{images:fallback(id),expires:Date.now()+60000,failed:new Set(),chosen:null});}
  })().finally(()=>pending.delete(id));pending.set(id,work);return work;
 }
 async function load(image,id){
  const entry=await metadata(id);if(!image.isConnected)return;
  // The panel may have closed while metadata was being fetched.
  if(observer&&!image.getClientRects().length){watching.set(image,id);observer.observe(image);return;}
  const candidates=[...new Set([entry.chosen,...entry.images].filter(Boolean))];let index=0;
  function next(){
   image.onload=image.onerror=null;
   if(!image.isConnected)return;
   let url;while(index<candidates.length){const candidate=candidates[index++];if(!entry.failed.has(candidate)){url=candidate;break;}}
   if(!url){entry.expires=Math.min(entry.expires,Date.now()+60000);image.src=placeholder;return;}
   image.onload=()=>{entry.chosen=url;image.onload=image.onerror=null;};
   image.onerror=()=>{entry.failed.add(url);if(entry.chosen===url)entry.chosen=null;next();};image.src=url;
  }
  next();
 }
 const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(items=>{for(const item of items)if(item.isIntersecting){const id=watching.get(item.target);watching.delete(item.target);observer.unobserve(item.target);if(id)void load(item.target,id);}}):null;
 function prune(){for(const image of watching.keys())if(!image.isConnected){observer?.unobserve(image);watching.delete(image);}}
 let pruneQueued=false;
 function schedulePrune(){if(!pruneQueued){pruneQueued=true;queueMicrotask(()=>{pruneQueued=false;prune();});}}
 function attach(image,game){
  const id=/^steam:([1-9][0-9]{0,9})$/.exec(game)?.[1];if(!id)return false;
  schedulePrune();image.src=placeholder;image.loading='lazy';image.decoding='async';image.referrerPolicy='no-referrer';image.dataset.steam='true';
  if(observer){watching.set(image,id);observer.observe(image);}else queueMicrotask(()=>{if(image.isConnected)void load(image,id);});return true;
 }
 // Closing Wibs/signing out discards detached nodes. Shared cache entries contain
 // public artwork addresses only, with no player or activity history.
 addEventListener('repo-account-state',schedulePrune);
 document.addEventListener('close',schedulePrune,true);
 window.repoGameArtwork=Object.freeze({attach});
})();
