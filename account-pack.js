(() => {
 'use strict';
 const service=window.repoAccount;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const dialog=document.createElement('dialog');
 dialog.id='account-pack';dialog.className='account-pack-opening';
 dialog.setAttribute('aria-labelledby','pack-title');document.body.append(dialog);
 let busy=false,preparing=false,catalog=null,opener=null;
 const sound=new Audio('assets/quidditch-tcg/pack-open.mp3');sound.preload='auto';
 const quantity=()=>Number(service.state.bank?.items?.quidditch_tcg_pack||0);
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function playSound(){
  const p=window.dashboardAudio.preferences();sound.pause();sound.currentTime=0;
  sound.volume=p.muted?0:.22*p.effects;if(!p.muted)sound.play().catch(()=>{});
 }
 function shell(){
  dialog.innerHTML=`<div class="pack-atmosphere" aria-hidden="true">${Array.from({length:16},(_,i)=>`<i style="--x:${(i*37+8)%100}%;--y:${(i*19+3)%100}%;--delay:-${i*1.8}s"></i>`).join('')}</div><header class="pack-header"><span>REPO COMPANY <b>/</b> YOUR COLLECTION</span><button data-pack-close aria-label="Close pack opening">×</button></header><div class="pack-layout"><div class="pack-stage"></div><section class="pack-copy"><p class="pack-eyebrow">THE ORIGINAL COLLECTION</p><h1 id="pack-title">Original TCG Pack</h1><p class="pack-description"></p><p class="pack-status" role="status" aria-live="polite"></p><div class="pack-actions"></div></section></div><footer class="pack-footer"><span>Your cards. Your collection.</span><span><kbd>Esc</kbd> Back to Inventory</span></footer>`;
 }
 function ready(){
  dialog.dataset.phase='ready';dialog.style.removeProperty('--pack-accent');
  dialog.querySelector('.pack-stage').innerHTML='<button class="pack-sealed" data-pack-open aria-label="Open one Original TCG Pack"><img src="account-assets/standard-pack.png" alt="Original TCG Pack"></button>';
  dialog.querySelector('#pack-title').textContent='Original TCG Pack';
  dialog.querySelector('.pack-eyebrow').textContent='THE ORIGINAL COLLECTION';
  dialog.querySelector('.pack-description').textContent='One card. A new part of your collection. Standard cards have duplicate protection; special cards may appear more than once.';
  dialog.querySelector('.pack-status').textContent=quantity()+' unopened · Opening uses one pack';
  dialog.querySelector('.pack-actions').innerHTML='<button class="pack-primary" data-pack-open>Open pack</button><button data-pack-close>Back to Inventory</button>';
 }
 function setBusy(value){
  busy=value;dialog.setAttribute('aria-busy',String(value));
  dialog.querySelectorAll('[data-pack-close]').forEach(b=>b.disabled=value);
  dialog.querySelector('.pack-footer span:last-child').textContent=value?'Opening your pack…':'Esc · Back to Inventory';
 }
 async function open(){
  if(dialog.open||preparing)return;
  if(!service.state.user){window.accountMenu.login(open);return;}
  if(!quantity())return;
  preparing=true;
  opener=document.activeElement;shell();dialog.dataset.phase='loading';dialog.showModal();
  dialog.querySelector('.pack-status').textContent='Preparing your pack…';
  try{
   if(!catalog){const r=await fetch('dashboard-card-catalog.json');if(!r.ok)throw Error('Card artwork could not load. Please try again.');catalog=Object.fromEntries((await r.json()).map(c=>[c.id,c]));}
   if(!dialog.open)return;
   ready();
   window.dashboardAudio.spin(false);dialog.querySelector('.pack-primary').focus();
  }catch(error){
   if(dialog.open){dialog.dataset.phase='error';dialog.querySelector('.pack-status').textContent=error.message;dialog.querySelector('.pack-actions').innerHTML='<button class="pack-primary" data-pack-close>Back to Inventory</button>';}
  }finally{preparing=false;}
 }
 async function reveal(){
  if(busy||dialog.dataset.phase!=='ready')return;
  setBusy(true);dialog.dataset.phase='opening';playSound();
  dialog.querySelector('.pack-sealed').disabled=true;
  dialog.querySelector('.pack-actions').innerHTML='';
  dialog.querySelector('.pack-status').textContent='Opening your pack…';
  const started=performance.now();let row;
  try{row=await service.openPack();}
  catch(error){
   dialog.dataset.phase='error';setBusy(false);sound.pause();
   dialog.querySelector('#pack-title').textContent='Check your Inventory';
   dialog.querySelector('.pack-description').textContent='We couldn’t confirm the result. Your pack may have opened. Return to Inventory to check your packs and cards before trying again.';
   dialog.querySelector('.pack-status').textContent=error.message;
   dialog.querySelector('.pack-actions').innerHTML='<button class="pack-primary" data-pack-close>Return to Inventory</button>';
   return;
  }
  const card=catalog[row.card_id];
  const img=new Image();if(card){img.src=card.image;img.alt=card.name;}
  // Artwork is optional after the server confirms a pull; never offer to repeat it.
  if(card)await Promise.race([img.decode().catch(()=>{}),wait(2200)]);
  await wait(Math.max(0,(reduced.matches?0:2300)-(performance.now()-started)));
  const colors={legendary:'#eac67b',platinum:'#afdaed',signature:'#a6e8e4',patch:'#e4b39a',promo:'#cfb2f3',black_label:'#d8c3b1',millennium:'#d9b1ed',rival:'#e4a195'};
  dialog.style.setProperty('--pack-accent',colors[card?.rarity]||'#c4d5cf');
  dialog.dataset.phase='revealed';
  const stage=dialog.querySelector('.pack-stage');stage.replaceChildren();
  const art=document.createElement('div');art.className='pack-card-reveal';
  if(card){art.append(img);img.addEventListener('error',()=>{art.textContent='Your card is saved. Artwork is unavailable.';},{once:true});if(img.complete&&!img.naturalWidth)art.textContent='Your card is saved. Artwork is unavailable.';}
  else art.textContent='Your new card is saved to your collection.';
  stage.append(art);
  const copies=row.owned_cards.filter(id=>id===row.card_id).length;
  dialog.querySelector('.pack-eyebrow').textContent=(card?.rarity||'Card').replaceAll('_',' ').toUpperCase()+' · '+(copies>1?'ANOTHER COPY':'NEW TO YOUR COLLECTION');
  dialog.querySelector('#pack-title').textContent=card?.name||'Card added';
  dialog.querySelector('.pack-description').textContent=copies>1?`Copy ${copies} is now in your collection.`:'Saved to your collection and ready for your Binder.';
  dialog.querySelector('.pack-status').textContent=quantity()+' unopened pack'+(quantity()===1?'':'s')+' remaining';
  dialog.querySelector('.pack-actions').innerHTML='<button class="pack-primary" data-pack-close>Back to Inventory</button><button data-pack-binder>View Binder →</button>'+(quantity()?'<button data-pack-again>Open another pack</button>':'');
  setBusy(false);dialog.querySelector('.pack-primary').focus({preventScroll:true});
 }
 async function close(binder=false){
  if(busy||!dialog.open)return;
  sound.pause();dialog.close();
  window.accountMenu.open({tab:'inventory'});
  // Refresh from the original account after every exit, including uncertain results.
  await service.refresh();
  if(binder)window.repoLegacy.open('binder');
  else (opener?.isConnected?opener:document.getElementById('account-tab-inventory'))?.focus({preventScroll:true});
 }
 dialog.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-pack-open'))reveal();
  else if(b.hasAttribute('data-pack-close'))close();
  else if(b.hasAttribute('data-pack-binder'))close(true);
  else if(b.hasAttribute('data-pack-again')&&!busy){ready();dialog.querySelector('.pack-primary').focus();}
 });
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue='';}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)sound.pause();});
 window.repoPack=Object.freeze({open,close,get busy(){return busy;}});
})();
