(() => {
 'use strict';
 const previewURL=new URL('comp-run-preview/knife-preview.html',document.currentScript.src).href;
 const catalog=window.repoCompRunCosmetics,service=window.repoAccount,state=service.state;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n).toLocaleString('en-GB');
 let family='All',active=null;
 const owned=id=>state.compRunFinishes?.includes(id)===true;
 function card(f){return `<button class="knife-shop-card ${f.family==='Transformation'?'knife-shop-flagship':''}" data-knife-finish="${f.id}" style="--knife-tone:${f.colors[1]};--knife-swatch:${f.swatch}"><span class="knife-shop-family">${f.family}</span><span class="knife-shop-swatch" aria-hidden="true"><svg viewBox="0 0 120 40"><path d="${catalog.knives[0].iconPath}"/></svg></span><span class="knife-shop-card-title">${f.name}</span><span class="knife-shop-card-bottom"><span>${owned(f.id)?'Owned':fmt(f.price)+' Repoints'}</span><span>Preview ↗</span></span></button>`;}
 function markup({inventory=false}={}){
  const items=catalog.finishes.filter(f=>inventory?owned(f.id):family==='All'||f.family===family);
  if(inventory)return `<section class="knife-inventory"><div class="account-row-heading"><h3>COMP-RUN knife finishes</h3><button class="account-soft-button" data-knife-shop>Shop finishes →</button></div>${items.length?`<div class="knife-shop-grid">${items.map(card).join('')}</div>`:`<p>${state.compRunFinishes===null?'Refresh your account to load your knife collection.':'No premium finishes owned.'}</p>`}</section>`;
  return `<section class="knife-shop"><div class="knife-shop-intro"><div><p class="account-eyebrow">COMP-RUN</p><h3>Knife finishes</h3><p>One purchase. All eight knife shapes.</p></div><span>Permanent unlocks</span></div><div class="frame-filters" role="group" aria-label="Knife finish collection">${['All','Luxury','Supernatural','Elemental','Transformation'].map(id=>`<button class="account-soft-button" data-knife-family="${id}" aria-pressed="${family===id}">${id}</button>`).join('')}</div>${state.compRunFinishesError?`<p role="status">${esc(state.compRunFinishesError)} <button class="account-soft-button" data-knife-refresh>Refresh collection</button></p>`:''}<div class="knife-shop-grid">${items.map(card).join('')}</div><p class="account-section-note">Preview every shape and its inspect animation before buying. Finishes are cosmetic and do not change gameplay. Equip them in COMP-RUN’s Runners & Knives menu.</p></section>`;
 }
 function dispose(){if(!active)return;active.remove();active=null;}
 function open(id,{detail,showDetail,setBusy}){
  const f=catalog.finishes.find(x=>x.id===id);if(!f)return;
  dispose();const owner=state.user?.id;let busy=false,uncertain=false;
  showDetail(`<div class="knife-shop-detail"><div class="knife-shop-preview"><iframe title="${esc(f.name)} live knife preview" src="${previewURL}?finish=${f.id}&knife=wake&locked=1&embedded=1" allow="autoplay"></iframe></div><div class="knife-shop-detail-copy"><p class="account-eyebrow">COMP-RUN · ${f.family.toUpperCase()}</p><h2 id="account-detail-title">${f.name}</h2><p>${f.description}</p><p>${f.effect}</p><dl><div><dt>Includes</dt><dd>All 8 knife shapes</dd></div><div><dt>Price</dt><dd>${fmt(f.price)} Repoints</dd></div><div><dt>Your balance</dt><dd id="knife-shop-balance"></dd></div></dl><button class="account-primary" id="knife-shop-buy"></button><button class="account-soft-button" id="knife-shop-refresh" hidden>Refresh collection</button><p id="knife-shop-feedback" role="status"></p><p class="account-detail-note">Permanent account unlock. Available in the browser game and desktop launcher.</p></div></div>`);
  const buy=detail.querySelector('#knife-shop-buy'),refresh=detail.querySelector('#knife-shop-refresh'),feedback=detail.querySelector('#knife-shop-feedback');
  function update(){
   if(state.user?.id!==owner){buy.disabled=true;buy.textContent='Account changed';feedback.textContent='Close this preview and reopen it for your current account.';refresh.hidden=true;return;}
   const has=owned(id),unknown=state.compRunFinishes===null,balance=Number(state.bank?.gp);
   detail.querySelector('#knife-shop-balance').textContent=state.bank?fmt(balance)+' Repoints':'—';
   buy.disabled=busy||has||unknown||uncertain||!state.bank||balance<f.price;
   buy.textContent=busy?'Purchasing…':has?'Owned · equip in COMP-RUN':'Buy for '+fmt(f.price)+' Repoints';
   refresh.hidden=busy||!(unknown||uncertain);refresh.disabled=busy;
   if(!busy&&!uncertain)feedback.textContent=has?'Available on every knife in your collection.':unknown?state.compRunFinishesError||'Loading your collection…':state.bank&&balance<f.price?'You need '+fmt(f.price-balance)+' more Repoints.':'';
  }
  buy.onclick=async()=>{
   if(buy.disabled||busy||state.user?.id!==owner)return;
   busy=true;setBusy(true);update();feedback.textContent='Purchasing…';
   try{await service.buyCompRunFinish(id);}
   catch(error){uncertain=true;feedback.textContent=error.message;}
   finally{busy=false;setBusy(false);update();}
  };
  refresh.onclick=async()=>{if(busy||state.user?.id!==owner)return;refresh.disabled=true;await service.refresh();if(state.compRunFinishes!==null)uncertain=false;update();};
  const listener=()=>update();addEventListener('repo-account-state',listener);
  active={remove(){removeEventListener('repo-account-state',listener);detail.querySelector('iframe')?.remove();}};
  update();service.refreshCompRunFinishes();
 }
 window.repoKnifeShop=Object.freeze({markup,open,dispose,setFamily(value){if(['All','Luxury','Supernatural','Elemental','Transformation'].includes(value))family=value;}});
})();
