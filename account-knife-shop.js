(() => {
 'use strict';
 const previewURL=new URL('comp-run-preview/knife-preview.html',document.currentScript.src).href;
 const catalog=window.repoCompRunCosmetics,service=window.repoAccount,state=service.state;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n).toLocaleString('en-GB');
 let family='All',active=null;
 const owned=id=>state.compRunFinishes?.includes(id)===true;
 function card(f){return `<button class="knife-shop-card ${f.family==='Transformation'?'knife-shop-flagship':''}" data-knife-finish="${f.id}" style="--knife-tone:${f.colors[1]};--knife-swatch:${f.swatch}"><span class="knife-shop-family">${f.family}</span><span class="knife-shop-swatch" aria-hidden="true"><svg viewBox="0 0 120 40"><path d="${catalog.knives[0].iconPath}"/></svg></span><span class="knife-shop-card-title">${f.name}</span><span class="knife-shop-card-bottom"><span>${owned(f.id)?'Owned':fmt(f.price)+' Repoints'}</span><span>Preview ↗</span></span></button>`;}
 function markup(){
  const items=catalog.finishes.filter(f=>owned(f.id));
  return `<section class="knife-inventory"><div class="account-row-heading"><h3>COMP-RUN knife finishes</h3><button class="account-soft-button" data-game="comp-run">Open COMP-RUN →</button></div>${items.length?`<div class="knife-shop-grid">${items.map(card).join('')}</div>`:`<p>${state.compRunFinishes===null?'Refresh your account to load your knife collection.':'No premium finishes owned.'}</p>`}</section>`;
 }
 function dispose(){if(!active)return;active.remove();active=null;}
 function open(id,{detail,showDetail}){
  const f=catalog.finishes.find(x=>x.id===id);if(!f||!owned(id))return;dispose();
  showDetail(`<div class="knife-shop-detail"><div class="knife-shop-preview"><iframe title="${esc(f.name)} live preview" src="${previewURL}?finish=${f.id}&knife=wake&locked=1&embedded=1" allow="autoplay"></iframe></div><div class="knife-shop-detail-copy"><p class="account-eyebrow">COMP-RUN · OWNED</p><h2 id="account-detail-title">${f.name}</h2><p>${f.description}</p><p>${f.effect}</p><button class="account-primary" data-game="comp-run">Open COMP-RUN →</button><p class="account-detail-note">Equip and purchase cosmetics inside COMP-RUN.</p></div></div>`);
  active={remove(){detail.querySelector('iframe')?.remove();}};
 }
 window.repoKnifeShop=Object.freeze({markup,open,dispose,setFamily(value){if(['All','Luxury','Supernatural','Elemental','Transformation'].includes(value))family=value;}});
})();
