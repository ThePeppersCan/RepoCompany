(() => {
 'use strict';
 const dialog=document.createElement('dialog');dialog.id='legacy-feature';dialog.className='legacy-feature';dialog.setAttribute('aria-label','Repo Company game and binder');
 dialog.innerHTML='<header><button data-legacy-close>← Back to dashboard</button><span id="legacy-feature-title"></span></header><div class="legacy-loading" role="status">Opening your collection…</div>';
 document.body.append(dialog);let frame=null,opener=null,readyTimer=null,activeId='';
 const names={binder:'Your binders',slabs:'Slab binder',pack:'Open a pack',diver:'Repo Diver',goblin:'Goblin Bomb Party',rooftops:'Repo Rooftops',seas:'High Seas',sports:'Repo Sports'};
 async function open(id){
  if(id==='pack')return window.repoPack.open();
  if(!names[id])return;
  if(dialog.open)return;
  if(!window.repoAccount.state.user){window.accountMenu.open({tab:'profile'});window.accountMenu.login(()=>open(id));return;}
  opener=document.activeElement;activeId=id;dialog.querySelector('#legacy-feature-title').textContent=names[id];dialog.querySelector('.legacy-loading').textContent='Opening your collection…';dialog.querySelector('.legacy-loading').hidden=false;
  dialog.querySelector('[data-legacy-close]').textContent=['binder','slabs'].includes(id)?'← Back to Account':'← Back to dashboard';
  if(!dialog.open)dialog.showModal();window.dashboardAudio?.suspend(true);window.repoAccount.setGame(['binder','slabs','pack'].includes(id)?'':id);
  frame=document.createElement('iframe');frame.title=names[id];frame.allow='autoplay; fullscreen';frame.src='legacy-runtime.html?dashboard='+encodeURIComponent(id);dialog.append(frame);
  clearTimeout(readyTimer);readyTimer=setTimeout(()=>{dialog.querySelector('.legacy-loading').textContent='Still loading. You can return to the dashboard and try again.';},30000);
 }
 async function close(){
  if(!dialog.open)return;
  clearTimeout(readyTimer);frame?.remove();frame=null;dialog.close();window.dashboardAudio?.suspend(false);window.repoAccount.setGame('');
  if(['binder','slabs'].includes(activeId)&&!document.getElementById('account-menu')?.open)window.accountMenu.open({tab:'inventory'});
  await window.repoAccount.refresh();
  (opener?.isConnected?opener:document.querySelector('#account-menu[open] .account-binder-tab'))?.focus({preventScroll:true});activeId='';
 }
 dialog.querySelector('[data-legacy-close]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==frame?.contentWindow||e.data?.type!=='repo-dashboard-runtime')return;
  if(e.data.state==='ready'){clearTimeout(readyTimer);dialog.querySelector('.legacy-loading').hidden=true;}
  if(e.data.state==='error'){clearTimeout(readyTimer);dialog.querySelector('.legacy-loading').textContent='This feature could not open. Return to the dashboard and try again.';}
  if(e.data.state==='close')close();
 });
 window.repoLegacy=Object.freeze({open,close});
})();
