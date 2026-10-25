(() => {
 'use strict';
 const root=new URL('comp-run-preview/',document.currentScript.src),previewURL=new URL('runner-preview.html',root).href;
 const catalog=window.repoCompRunCosmetics,service=window.repoAccount,state=service.state;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n).toLocaleString('en-GB');let family='All',active=null,portraitJob=null;const portraits=new Map();
 const owned=id=>state.compRunRunners?.includes(id)===true;
 async function hydrate(){
  for(const img of document.querySelectorAll('[data-runner-portrait]'))if(portraits.has(img.dataset.runnerPortrait)){img.src=portraits.get(img.dataset.runnerPortrait);img.hidden=false;img.nextElementSibling.hidden=true;}
  if(portraitJob||portraits.size===catalog.runners.length)return;
  portraitJob=(async()=>{
   let renderer,portrait;
   try{
    const [THREE,{RunnerPortraits}]=await Promise.all([import(new URL('vendor/three.module.js?v=2.15.0',root)),import(new URL('runner-portraits.js?v=2.15.0',root))]);
    renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(180,200);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    portrait=new RunnerPortraits();portrait.queue=catalog.runners.filter(r=>!portraits.has(r.id));
    while(portrait.queue.length&&!portrait.failed){
     await new Promise(requestAnimationFrame);
     portrait.step(renderer,(id,url)=>{portraits.set(id,url);for(const img of document.querySelectorAll('[data-runner-portrait="'+id+'"]')){img.src=url;img.hidden=false;img.nextElementSibling.hidden=true;}});
    }
   }catch{for(const note of document.querySelectorAll('.runner-card-loading'))note.textContent='Open 3D preview';}
   finally{portrait?.dispose();renderer?.dispose();renderer?.forceContextLoss();}
  })();
 }
 function card(r){const src=portraits.get(r.id);return `<button class="knife-shop-card runner-shop-card ${r.premiumAnimated?'knife-shop-flagship':''}" data-runner-skin="${r.id}"><span class="knife-shop-family">${r.premiumAnimated?'Premium animated':'Animated'}</span><span class="runner-shop-portrait"><img data-runner-portrait="${r.id}" alt="" ${src?'src="'+src+'"':'hidden'}><span class="runner-card-loading" ${src?'hidden':''}>Loading preview…</span></span><span class="knife-shop-card-title">${r.name}</span><span class="knife-shop-card-bottom"><span>${owned(r.id)?'Owned':fmt(r.price)+' Repoints'}</span><span>Preview ↗</span></span></button>`;}
 function markup(){
  const items=catalog.runners.filter(f=>owned(f.id));queueMicrotask(hydrate);
  return `<section class="knife-inventory"><div class="account-row-heading"><h3>COMP-RUN runners</h3><button class="account-soft-button" data-game="comp-run">Open COMP-RUN →</button></div>${items.length?`<div class="knife-shop-grid">${items.map(card).join('')}</div>`:`<p>${state.compRunRunners===null?'Refresh your account to load your runner collection.':'No shop runners owned.'}</p>`}</section>`;
 }
 function dispose(){if(!active)return;active.remove();active=null;}
 function open(id,{detail,showDetail}){
  const r=catalog.runners.find(x=>x.id===id);if(!r||!owned(id))return;dispose();
  showDetail(`<div class="knife-shop-detail"><div class="knife-shop-preview"><iframe title="${esc(r.name)} live preview" src="${previewURL}?runner=${r.id}&locked=1&embedded=1" allow="autoplay"></iframe></div><div class="knife-shop-detail-copy"><p class="account-eyebrow">COMP-RUN · OWNED</p><h2 id="account-detail-title">${r.name}</h2><p>${r.description}</p><p>${r.effect}</p><button class="account-primary" data-game="comp-run">Open COMP-RUN →</button><p class="account-detail-note">Equip and purchase cosmetics inside COMP-RUN.</p></div></div>`);
  active={remove(){detail.querySelector('iframe')?.remove();}};
 }
 window.repoRunnerShop=Object.freeze({markup,open,dispose,setFamily(value){if(['All','Regular','Premium'].includes(value))family=value;}});
})();
