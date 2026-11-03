;(()=>{
 const dashboard=document.getElementById('dashboard');let host=null,frame=null,opener=null,ticket=null,authSubscription=null;
 // This playtest is delivered by the portal. A stale native catalogue label
 // from the preceding game must not suggest that another install is needed.
 const labelGameAction=()=>{
  if(dashboard?.dataset.openGame!=='comp-9')return;
  const button=dashboard.querySelector('[data-note="Play"]');if(!button)return;
  let label=button.querySelector('[data-launcher-label]');
  if(!label){label=document.createElement('span');label.dataset.launcherLabel='true';for(const child of [...button.childNodes])if(child.nodeType===Node.TEXT_NODE)child.remove();button.append(label);}
  if(label.textContent!=='Play')label.textContent='Play';
  if(button.getAttribute('aria-label')!=='COMP-9: Play')button.setAttribute('aria-label','COMP-9: Play');
  if(button.getAttribute('aria-disabled')!=='false')button.setAttribute('aria-disabled','false');
  if(button.disabled)button.disabled=false;
 };
 if(dashboard){new MutationObserver(labelGameAction).observe(dashboard,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['data-open-game','aria-disabled']});labelGameAction();}
 const close=()=>{if(!host)return;authSubscription?.unsubscribe();authSubscription=null;frame.src='about:blank';host.remove();host=frame=null;window.dashboardAudio?.suspend(false);window.repoAccount?.setGame('');opener?.focus();};
 const open=()=>{
  if(host)return;opener=document.activeElement;
  if(!window.repoAccount?.state?.user){window.accountMenu?.open({tab:'profile'});window.accountMenu?.login(open);return;}
  host=document.createElement('div');host.id='comp9-playtest-host';host.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#11131b';
  frame=document.createElement('iframe');frame.title='COMP-9';frame.allow='autoplay; fullscreen';frame.style.cssText='display:block;width:100%;height:100%;border:0';frame.src='/comp9-playtest/?build=22';host.append(frame);document.body.append(host);window.dashboardAudio?.suspend(true);window.repoAccount?.setGame('comp-9');frame.focus();
  const accountId=window.repoAccount.state.user.id;
  authSubscription=window.repoAccount.db?.auth.onAuthStateChange((_event,session)=>{if(host&&session?.user?.id!==accountId)queueMicrotask(close);})?.data?.subscription||null;
 };
 // Capture before the existing native catalogue handler. This temporary build
 // runs within the signed-in portal in both the website and desktop launcher.
 window.addEventListener('click',e=>{
  if(!e.target.closest?.('[data-note="Play"]')||dashboard?.dataset.openGame!=='comp-9')return;
  e.preventDefault();e.stopImmediatePropagation();
  if(!window.repoAccount?.state?.user){open();return;}
  ticket=crypto.randomUUID();const play=e.target.closest('[data-note="Play"]');
  // Supply the presentation's required URL only for this synchronous call.
  // Native catalogue interception must not mistake this same-origin preview
  // for another installed game that shares the portal's origin.
  play.dataset.gameUrl='/comp9-playtest/';
  try{dispatchEvent(new CustomEvent('repo-launch-presentation',{detail:{id:'comp-9',ticket}}));}finally{delete play.dataset.gameUrl;}
 },true);
 window.addEventListener('repo-launch-presentation-ready',e=>{if(!ticket||e.detail?.ticket!==ticket)return;ticket=null;open();dispatchEvent(new Event('repo-launch-presentation-reset'));});
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame?.contentWindow&&e.data?.type==='comp9-close')close();});
})();
