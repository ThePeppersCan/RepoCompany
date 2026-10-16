(() => {
  'use strict';
  const games = {
    morogue: ['Morogue', 'https://morogue.repocompany.uk/'],
    moratales: ['Moratales', 'https://moratales.repocompany.uk/'],
    manager: ['Velmora Manager', 'https://manager.repocompany.uk/']
  };
  const panel = document.createElement('dialog');
  panel.id = 'repo-web-game'; panel.setAttribute('aria-label','Game');
  const bar = document.createElement('header'), brand = document.createElement('span'), title = document.createElement('span');
  brand.className='repo-web-brand';brand.textContent='RC';title.className='repo-web-game-title';
  const controls = document.createElement('div');controls.className='repo-web-game-controls';
  const exit = document.createElement('button');exit.type='button';exit.textContent='Exit game';exit.onclick=close;
  const fullscreen = document.createElement('button');fullscreen.type='button';fullscreen.textContent='Full screen';
  fullscreen.onclick=()=>{const task=document.fullscreenElement?document.exitFullscreen():panel.requestFullscreen();task?.catch(()=>{});};
  controls.append(fullscreen,exit);bar.append(brand,title,controls);panel.append(bar);document.body.append(panel);
  let frame,previousFocus;
  function open(id) {
    if (!games[id] || document.documentElement.dataset.repoLauncher==='true') return false;
    if (panel.open) return true;
    previousFocus=document.activeElement;
    title.textContent=games[id][0];panel.setAttribute('aria-label',games[id][0]);
    frame=document.createElement('iframe');frame.title=games[id][0];frame.allow='autoplay; fullscreen';frame.src=games[id][1];
    frame.onload=()=>{try{if(frame?.contentWindow.location.origin===location.origin&&frame.contentWindow.location.pathname==='/')close();}catch{/* Cross-origin games retain their own storage and account session. */}};
    panel.append(frame);panel.showModal();
    window.dashboardAudio?.suspend(true);window.repoAccount?.setGame(id);
    frame.focus();return true;
  }
  function close() {
    if (!panel.open) return;
    window.repoMessaging?.close();
    if(document.fullscreenElement===panel)document.exitFullscreen().catch(()=>{});
    frame?.remove();frame=null;panel.close();
    window.dashboardAudio?.suspend(false);window.repoAccount?.setGame('');previousFocus?.focus?.({preventScroll:true});
  }
  panel.addEventListener('cancel',event=>{event.preventDefault();window.repoMedia?.openSettings();});
  addEventListener('popstate',()=>{if(panel.open)close();});
  window.repoWebGame=Object.freeze({open,close,focus:()=>frame?.focus(),get active(){return panel.open;}});
})();
