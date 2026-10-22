(() => {
 'use strict';
 const dialog=document.createElement('dialog');dialog.id='legacy-feature';dialog.className='legacy-feature';dialog.setAttribute('aria-label','Repo Company game and binder');
 dialog.innerHTML='<header><button data-legacy-close>← Back to dashboard</button><span id="legacy-feature-title"></span></header><div class="legacy-loading" role="status">Opening your collection…</div>';
 document.body.append(dialog);let frame=null,opener=null,readyTimer=null,activeId='',bridge='';
 const dragonOrigin='https://dragonbound.repocompany.uk';
 const names={deadbeat:'REPOMETRY',runners:'Repo Runners',broomflight:'Broomflight',binder:'Your binders',slabs:'Slab binder',pack:'Open a pack',dragonbound:'Dragonbound',diver:'Repo Diver',goblin:'Goblin Bomb Party',rooftops:'Repo Rooftops',seas:'High Seas',sports:'Repo Sports'};
 async function open(id){
  if(['binder','slabs'].includes(id))return window.repoBinder.open(id);
  return openOriginal(id);
 }
 async function openOriginal(id){
  if(id==='pack')return window.repoPack.open();
  if(!names[id])return;
  if(dialog.open)return;
  if(!window.repoAccount.state.user){window.accountMenu.open({tab:'profile'});window.accountMenu.login(()=>open(id));return;}
  if(document.documentElement.dataset.repoLauncher!=='true'&&window.demoLibrary?.games.some(game=>game.id===id)&&window.repoRoutes?.read()!=='demo/'+id)history.pushState({scene:'demo/'+id},'',window.repoRoutes.href('demo/'+id));
  opener=document.activeElement;activeId=id;dialog.querySelector('#legacy-feature-title').textContent=names[id];dialog.querySelector('.legacy-loading').textContent='Opening '+names[id]+'…';dialog.querySelector('.legacy-loading').hidden=false;
  dialog.querySelector('[data-legacy-close]').textContent=['binder','slabs'].includes(id)?'← Back to Account':'← Back to dashboard';
  if(!dialog.open)dialog.showModal();window.dashboardAudio?.suspend(true);window.repoAccount.setGame(['binder','slabs','pack'].includes(id)?'':id);
  frame=document.createElement('iframe');frame.title=names[id];frame.allow='autoplay; fullscreen';
  if(id==='dragonbound'){
   bridge=crypto.randomUUID();const url=new URL(dragonOrigin+'/');url.searchParams.set('source','repocompany');url.searchParams.set('repoBridge',bridge);
   if(['localhost','127.0.0.1'].includes(location.hostname))url.searchParams.set('repoOrigin',location.origin);
   frame.src=url.href;
  }else if(id==='deadbeat'){
   frame.src='https://deadbeat-nightmare-dash.fluffy-star-4855.chatgpt.site/';
   const target=frame;
   frame.onload=()=>{if(frame!==target||activeId!==id)return;clearTimeout(readyTimer);dialog.querySelector('.legacy-loading').hidden=true;};
  }else if(id==='runners')frame.src='/repo-runners/?embedded=1';
  else if(id==='broomflight')frame.src='/broomflight/?embedded=1';
  else frame.src='legacy-runtime.html?dashboard='+encodeURIComponent(id);
  dialog.append(frame);
  clearTimeout(readyTimer);readyTimer=setTimeout(()=>{dialog.querySelector('.legacy-loading').textContent='Still loading. You can return to the dashboard and try again.';},30000);
 }
 async function close({route=true}={}){
  if(!dialog.open)return;
  const closingId=activeId,returnFocus=opener;activeId='';
  clearTimeout(readyTimer);frame?.remove();frame=null;bridge='';dialog.close();window.dashboardAudio?.suspend(false);window.repoAccount.setGame('');
  if(route&&document.documentElement.dataset.repoLauncher!=='true'&&window.repoRoutes?.read()==='demo/'+closingId){history.replaceState({scene:'demos'},'',window.repoRoutes.href('demos'));document.title='Repo Company — Demos';}
  if(['binder','slabs'].includes(closingId)&&!document.getElementById('account-menu')?.open)window.accountMenu.open({tab:'inventory'});
  await window.repoPlaytime?.stop();window.repoBinder?.invalidate();await window.repoAccount.refresh();
  if(!dialog.open)(returnFocus?.isConnected?returnFocus:document.querySelector('#account-menu[open] #account-tab-binder'))?.focus({preventScroll:true});
 }
 dialog.querySelector('[data-legacy-close]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 addEventListener('message',async e=>{
  if(activeId==='dragonbound'){
   if(e.origin!==dragonOrigin||e.source!==frame?.contentWindow||!bridge||e.data?.bridge!==bridge)return;
   if(e.data.type==='dragonbound-app-close'){close();return;}
   if(e.data.type!=='dragonbound-app-ready')return;
   const target=frame,nonce=bridge;
   try{
    const {data:{session},error}=await window.repoAccount.db.auth.getSession();
    if(error||!session)throw Error('Sign in to Repo Company to connect your saved game.');
    if(target!==frame||nonce!==bridge)return;
    target.contentWindow.postMessage({type:'dragonbound-app-auth',bridge:nonce,accessToken:session.access_token,refreshToken:session.refresh_token},dragonOrigin);
    clearTimeout(readyTimer);dialog.querySelector('.legacy-loading').hidden=true;window.repoPlaytime?.start('dragonbound');
   }catch(error){if(target===frame)dialog.querySelector('.legacy-loading').textContent=error.message;}
   return;
  }
  if(e.origin!==location.origin||e.source!==frame?.contentWindow||e.data?.type!=='repo-dashboard-runtime')return;
  if(activeId==='runners'&&e.data.state==='loading'){clearTimeout(readyTimer);dialog.querySelector('.legacy-loading').hidden=true;}
  if(e.data.state==='ready'){clearTimeout(readyTimer);dialog.querySelector('.legacy-loading').hidden=true;if(!['binder','slabs','pack'].includes(activeId))window.repoPlaytime?.start(activeId);}
  if(e.data.state==='error'){clearTimeout(readyTimer);dialog.querySelector('.legacy-loading').textContent='This feature could not open. Return to the dashboard and try again.';}
  if(e.data.state==='close')close();
 });
 window.repoLegacy=Object.freeze({open,openOriginal,close,get game(){return activeId;}});
})();
