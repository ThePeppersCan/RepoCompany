(() => {
 'use strict';
 if(window.parent===window)return;
 const action=new URLSearchParams(location.search).get('dashboard');
 const send=state=>parent.postMessage({type:'repo-dashboard-runtime',state},location.origin);
 const pauseHome=()=>{try{signedOutNatureAudio?.pause();}catch(_){}try{clearTimeout(spawnTimer);clearInterval(resourceWatchdogTimer);if(currentResource)removeResource(false);}catch(_){}document.querySelectorAll('.resource-node,.roaming-pet').forEach(e=>e.remove());};
 async function launch(){
  try{
   await loadCharacter();if(!character)throw Error('Sign in required');pauseHome();
   await loadBankAndPets();
   if(action==='binder')openQuidditchTcgBinder();
   else if(action==='slabs')window.openRepoRcgBinder();
   else if(action==='pack'){renderBank();const button=document.querySelector('[data-open-tcg-pack]');if(!button)throw Error('No pack');button.click();}
   else if(action==='diver')window.openRepoDiver();
   else if(action==='goblin')window.GoblinBombParty.open();
   else if(action==='rooftops')window.RepoRooftops.open();
   else if(action==='seas')openSailingGame();
   else if(action==='sports')document.getElementById('openRepoSports').click();
   else throw Error('Unknown feature');
   send('ready');
   // Preserve the current binder and game implementations. Only the old home is hidden.
   const isOpen=()=>!!document.querySelector('dialog[open],#hunterMenuOverlay.open,#quidditchModeOverlay.is-open,#repoSportsV2TestOverlay[aria-hidden="false"]');
   let hadDialog=isOpen(),closeTimer;
   const observe=new MutationObserver(()=>{
    if(isOpen()){hadDialog=true;clearTimeout(closeTimer);}
    else if(hadDialog){clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!isOpen())send('close');},650);}
   });observe.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class','aria-hidden']});
  }catch(error){console.warn('Dashboard runtime could not open',action,error.message);send('error');}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',launch,{once:true});else launch();
})();
