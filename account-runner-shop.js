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
 function markup({inventory=false}={}){
  const items=catalog.runners.filter(r=>inventory?owned(r.id):family==='All'||family==='Premium'&&r.premiumAnimated||family==='Regular'&&!r.premiumAnimated);queueMicrotask(hydrate);
  if(inventory)return `<section class="knife-inventory"><div class="account-row-heading"><h3>COMP-RUN runners</h3><button class="account-soft-button" data-runner-shop>Shop runners →</button></div>${items.length?`<div class="knife-shop-grid">${items.map(card).join('')}</div>`:`<p>${state.compRunRunners===null?'Refresh your account to load your runner collection.':'No shop runners owned.'}</p>`}</section>`;
  return `<section class="knife-shop"><div class="knife-shop-intro"><div><p class="account-eyebrow">COMP-RUN</p><h3>Runners</h3><p>12 animated characters. 8 premium transformations.</p></div><span>Permanent unlocks</span></div><div class="frame-filters" role="group" aria-label="Runner collection">${['All','Regular','Premium'].map(id=>`<button class="account-soft-button" data-runner-family="${id}" aria-pressed="${family===id}">${id==='Regular'?'Animated · 1,200 RP':id==='Premium'?'Premium · 2,400 RP':id}</button>`).join('')}</div>${state.compRunRunnersError?`<p role="status">${esc(state.compRunRunnersError)} <button class="account-soft-button" data-runner-refresh>Refresh collection</button></p>`:''}<div class="knife-shop-grid">${items.map(card).join('')}</div><p class="account-section-note">Preview each runner standing, running with a knife and performing their signature animation. All runners have the same movement. Map rewards are earned separately.</p></section>`;
 }
 function dispose(){if(!active)return;active.remove();active=null;}
 function open(id,{detail,showDetail,setBusy}){
  const r=catalog.runners.find(x=>x.id===id);if(!r)return;dispose();const owner=state.user?.id;let busy=false,uncertain=false;
  showDetail(`<div class="knife-shop-detail runner-shop-detail"><div class="knife-shop-preview"><iframe title="${esc(r.name)} live runner preview" src="${previewURL}?runner=${r.id}&locked=1&embedded=1" allow="autoplay"></iframe></div><div class="knife-shop-detail-copy"><p class="account-eyebrow">COMP-RUN · ${r.premiumAnimated?'PREMIUM ANIMATED':'ANIMATED'}</p><h2 id="account-detail-title">${r.name}</h2><p>${r.description}</p><p>${r.effect}</p><dl><div><dt>Includes</dt><dd>Character, hands & animation</dd></div><div><dt>Price</dt><dd>${fmt(r.price)} Repoints</dd></div><div><dt>Your balance</dt><dd id="runner-shop-balance"></dd></div></dl><button class="account-primary" id="runner-shop-buy"></button><button class="account-soft-button" id="runner-shop-refresh" hidden>Refresh collection</button><p id="runner-shop-feedback" role="status"></p><p class="account-detail-note">Permanent account unlock. Equip in COMP-RUN in the browser or desktop launcher.</p></div></div>`);
  const buy=detail.querySelector('#runner-shop-buy'),refresh=detail.querySelector('#runner-shop-refresh'),feedback=detail.querySelector('#runner-shop-feedback');
  function update(){
   if(state.user?.id!==owner){buy.disabled=true;buy.textContent='Account changed';feedback.textContent='Close this preview and reopen it for your current account.';refresh.hidden=true;return;}
   const has=owned(id),unknown=state.compRunRunners===null,balance=Number(state.bank?.gp);detail.querySelector('#runner-shop-balance').textContent=state.bank?fmt(balance)+' Repoints':'—';
   buy.disabled=busy||has||unknown||uncertain||!state.bank||balance<r.price;buy.textContent=busy?'Purchasing…':has?'Owned · equip in COMP-RUN':'Buy for '+fmt(r.price)+' Repoints';
   refresh.hidden=busy||!(unknown||uncertain);refresh.disabled=busy;
   if(!busy&&!uncertain)feedback.textContent=has?'Available in your COMP-RUN collection.':unknown?state.compRunRunnersError||'Loading your collection…':state.bank&&balance<r.price?'You need '+fmt(r.price-balance)+' more Repoints.':'';
  }
  buy.onclick=async()=>{if(buy.disabled||busy||state.user?.id!==owner)return;busy=true;setBusy(true);update();feedback.textContent='Purchasing…';try{await service.buyCompRunRunner(id);}catch(error){uncertain=true;feedback.textContent=error.message;}finally{busy=false;setBusy(false);update();}};
  refresh.onclick=async()=>{if(busy||state.user?.id!==owner)return;refresh.disabled=true;await service.refresh();if(state.compRunRunners!==null)uncertain=false;update();};
  const listener=()=>update();addEventListener('repo-account-state',listener);active={remove(){removeEventListener('repo-account-state',listener);detail.querySelector('iframe')?.remove();}};
  update();service.refreshCompRunRunners();
 }
 window.repoRunnerShop=Object.freeze({markup,open,dispose,setFamily(value){if(['All','Regular','Premium'].includes(value))family=value;}});
})();
