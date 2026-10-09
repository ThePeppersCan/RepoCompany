(() => {
 'use strict';
 if(window.parent===window)return;
 const action=new URLSearchParams(location.search).get('dashboard');
 // Collection Escape is handled by the active dialog, not unrelated old games.
 if(['binder','slabs','pack'].includes(action))for(const type of ['keydown','keyup']){
  addEventListener(type,event=>{if(event.key==='Escape')event.stopImmediatePropagation();},true);
 }
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
   if(!['binder','slabs','pack'].includes(action)){
    const gameObserver=new MutationObserver(()=>{
     if(isOpen()){hadDialog=true;clearTimeout(closeTimer);}
     else if(hadDialog){clearTimeout(closeTimer);closeTimer=setTimeout(()=>{if(!isOpen())send('close');},650);}
    });
    gameObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class','aria-hidden']});
    return;
   }
   const check=()=>{
    if(isOpen()){
     hadDialog=true;clearTimeout(closeTimer);closeTimer=null;
     if(document.body.classList.contains('dashboard-feature-closing'))document.body.classList.remove('dashboard-feature-closing');
    }else if(hadDialog){
     // Hide the old shell immediately, including between nested binder dialogs.
     if(!document.body.classList.contains('dashboard-feature-closing'))document.body.classList.add('dashboard-feature-closing');
     // Animation/class mutations must not keep resetting this timer indefinitely.
     if(!closeTimer)closeTimer=setTimeout(()=>{if(!isOpen()){observe.disconnect();send('close');}else check();},100);
    }
   };
   const observe=new MutationObserver(check);
   observe.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class','aria-hidden']});
   document.addEventListener('close',check,true);
  }catch(error){console.warn('Dashboard runtime could not open',action,error.message);send('error');}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',launch,{once:true});else launch();
})();
