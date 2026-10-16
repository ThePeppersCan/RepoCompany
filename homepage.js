(() => {
  'use strict';
  const assets = 'original-case-assets/';
  const dashboard = document.getElementById('dashboard');
  const home = document.getElementById('collection-scene');
  const openScene = document.getElementById('open-scene');
  const stack = document.getElementById('case-stack');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const games = [
    {id:'moratales',name:'Moratales',genre:'Story & life sim',tagline:'Your next chapter in Velmora.',glow:'125,155,113'},
    {id:'manager',name:'Velmora Manager',genre:'Fantasy sports management',tagline:'Build your club. Shape its future.',glow:'91,137,190'},
    {id:'morogue',name:'Morogue',genre:'Action roguelite',tagline:'Survive the night. Face the Uncrowned.',glow:'181,91,77'},
    {id:'demos',name:'Demos',genre:'Playable demos & minigames',tagline:'Including Dragonbound. Discover something new.',glow:'112,139,204'}
  ];
  // Crop the original source wordmarks. The Dragonbound lettering uses a single foil ink;
  // its letterforms are sampled directly from the original menu, never recreated as text.
  function logo(id, extra='') {
    if(id==='moratales') return `<img class="${extra}" src="${assets}moratales-logo.png" alt="">`;
    if(id==='morogue') return `<img class="morogue-wordmark ${extra}" src="${assets}morogue-logo.png" alt="">`;
    if(id==='manager') return `<svg class="source-logo manager-wordmark ${extra}" viewBox="57 178 2073 432" aria-hidden="true"><image href="${assets}manager-logo-clean.png" width="2167" height="725"/></svg>`;
    if(id==='dragonbound') return `<svg class="source-logo dragon-wordmark ${extra}" viewBox="783 148 670 143" aria-hidden="true"><g clip-path="url(#dragon-wordmark-crop)"><image href="${assets}dragonbound-menu.png" width="1672" height="941" filter="url(#dragon-foil)"/></g></svg>`;
    return '<div class="demo-name">DEMOS<small>DEMO DISC 01</small></div>';
  }
  const publisher = '<div class="cover-publisher"><i class="publisher-mark"></i><span class="publisher-wordmark" aria-label="Repo Company"></span></div>';
  function cover(id) {
    let content='';
    if(id==='moratales') content=`<img class="cover-map" src="${assets}moratales-cover-source.png" alt=""><div class="cover-tint"></div>${logo(id,'cover-logo')}`;
    if(id==='morogue') content=`<img class="cover-art" src="${assets}morogue-cover-art.png" alt=""><div class="cover-tint"></div>${logo(id,'cover-logo')}`;
    if(id==='manager') content=`<img class="cover-art" src="${assets}manager-menu.png" alt="">${logo(id,'cover-logo')}<span class="cover-edition">VELMORA MANAGER</span>`;
    if(id==='dragonbound') content=`<img class="cover-art" src="${assets}dragonbound-menu.png" alt=""><div class="cover-tint"></div>${logo(id,'cover-logo')}`;
    if(id==='demos') content='<span class="demo-cover-kicker">THE PLAYABLE COLLECTION</span><strong class="demo-cover-title">DEMOS</strong><span class="demo-cover-edition">DEMO DISC 01</span><div class="printed-disc"></div><span class="demo-cover-footer">EXPLORE · PLAY · DISCOVER</span>';
    return `<div class="case-cover cover-${id}">${publisher}${content}</div>`;
  }
  function spine(id) {
    const content=id==='demos'?'<strong class="spine-demo-name">DEMOS</strong><span class="spine-demo-edition">DEMO DISC 01</span><div class="printed-disc"></div>':`${logo(id,'spine-logo')}<div class="spine-picture"></div>`;
    return `<div class="case-spine spine-${id}"><div class="spine-publisher"><i class="publisher-mark"></i></div>${content}</div>`;
  }
  stack.innerHTML=games.map((g,i)=>`<div class="closed-case" data-case="${i}" style="--index:${i};z-index:${4-i}"><img class="case-shell" src="${assets}closed-case-shell.png" alt="">${cover(g.id)}${spine(g.id)}<button class="case-select" aria-label="Select ${g.name}" aria-pressed="false" tabindex="${i===0?0:-1}" data-game="${i}"></button><svg class="case-edge-light" viewBox="0 0 1672 941" aria-hidden="true"><path d="M734 255 1583 309Q1595 311 1596 329L1597 422 1491 667Q1486 678 1474 675L433 582Q418 580 418 565L418 481Q419 474 432 465Z"/></svg></div>`).join('');
  const layers=[...stack.querySelectorAll('.closed-case')];
  const buttons=[...stack.querySelectorAll('.case-select')];
  layers.forEach(layer=>{
    // Clockwise corners preserve the printed sleeve's handedness; the old order mirrored every cover.
    pinPlane(layer.querySelector('.case-cover'),400,565,[[461,468],[738,266],[1561,317],[1450,546]]);
    pinPlane(layer.querySelector('.case-spine'),1000,94,[[456,486],[1448,566],[1448,660],[456,574]]);
  });

  let selected=0, transitioning=false, toastTimer, sceneRevision=0;
  const copy=document.querySelector('.collection-copy');
  function choose(index, focus=false, audible=true) {
    if(transitioning||dashboard.dataset.launching) return;
    const previous=selected;
    selected=(index+games.length)%games.length;
    if(audible&&previous!==selected)window.dashboardAudio?.effect('hover');
    const game=games[selected];
    layers.forEach((layer,i)=>layer.classList.toggle('is-selected',i===selected));
    buttons.forEach((button,i)=>{button.setAttribute('aria-pressed',String(i===selected));button.tabIndex=i===selected?0:-1;});
    document.getElementById('selected-brand').innerHTML=logo(game.id);
    document.getElementById('selected-game-name').textContent=game.name;
    document.getElementById('selected-genre').textContent=game.genre;
    document.getElementById('selected-tagline').textContent=game.tagline;
    document.getElementById('collection-count').textContent=String(selected+1).padStart(2,'0');
    document.getElementById('open-selected').setAttribute('aria-label',`Open ${game.name} case`);
    dashboard.style.setProperty('--game-glow',game.glow);
    dashboard.dataset.selectedGame=game.id;
    copy.classList.remove('changing');
    void copy.offsetWidth;
    copy.classList.add('changing');
    if(focus)buttons[selected].focus({preventScroll:true});
  }
  function toast(text) {
    clearTimeout(toastTimer);
    const message=document.getElementById('collection-toast');
    message.textContent=text;message.classList.add('visible');
    toastTimer=setTimeout(()=>message.classList.remove('visible'),3800);
  }
  function fitCollection() {
    if(window.fitDashboard){window.fitDashboard();return;}
    const isHome=dashboard.classList.contains('home-mode');
    const mobile=isHome&&innerWidth<=700;
    const width=mobile?700:1672,height=mobile?1420:941;
    const scale=mobile?innerWidth/width:Math.min(innerWidth/width,innerHeight/height);
    dashboard.style.width=width+'px';dashboard.style.height=height+'px';
    dashboard.style.transform=`scale(${scale})`;
    const viewport=document.getElementById('viewport');viewport.style.width=width*scale+'px';viewport.style.height=height*scale+'px';
  }
  const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function showOpen({animate=true,route=true}={}) {
    if((transitioning&&animate)||dashboard.dataset.launching)return;
    if(animate)window.dashboardAudio?.effect('open');
    if(selected===3){window.demoLibrary.open({route});return;}
    const game=games[selected],revision=++sceneRevision;
    transitioning=true;
    window.dashboardScenes.activate(game.id);
    if(animate&&!reducedMotion.matches){dashboard.classList.add('opening');await delay(480);}
    if(revision!==sceneRevision)return;
    home.inert=true;openScene.inert=false;
    dashboard.classList.remove('home-mode');
    fitCollection();dashboard.dispatchEvent(new Event('scene-change'));
    if(route)history.pushState({scene:game.id},'','#'+game.id);
    if(animate&&!reducedMotion.matches)await delay(650);
    if(revision!==sceneRevision)return;
    dashboard.classList.remove('opening');transitioning=false;
    openScene.querySelector('.close-case').focus({preventScroll:true});
  }
  async function showCollection({animate=true,route=true}={}) {
    if((transitioning&&animate)||dashboard.dataset.launching)return;
    const revision=++sceneRevision;
    transitioning=true;
    openScene.inert=true;home.inert=false;
    dashboard.classList.remove('opening');dashboard.classList.add('home-mode');
    dashboard.setAttribute('aria-label','Repo Company game collection');
    document.title='Repo Company — Your collection';
    fitCollection();dashboard.dispatchEvent(new Event('scene-change'));
    if(route)history.pushState({scene:'collection'},'','#collection');
    if(animate&&!reducedMotion.matches)await delay(650);
    if(revision!==sceneRevision)return;
    transitioning=false;buttons[selected].focus({preventScroll:true});
  }
  buttons.forEach((button,i)=>{
    button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'&&!transitioning){if(selected!==i)choose(i);else window.dashboardAudio?.effect('hover');}});
    button.addEventListener('focus',()=>{if(selected!==i)choose(i);});
    button.addEventListener('click',()=>{if(selected!==i){choose(i);return;}showOpen();});
  });
  document.getElementById('open-selected').onclick=()=>showOpen();
  document.getElementById('previous-case').onclick=()=>choose(selected-1);
  document.getElementById('next-case').onclick=()=>choose(selected+1);
  dashboard.addEventListener('return-to-collection',()=>showCollection());
  window.repoCollection=Object.freeze({open(){
    window.repoReparty?.close();window.repoMessaging?.close();window.accountMenu?.close({route:false});
    window.demoLibrary?.close(false);
    void showCollection({animate:false});
    dispatchEvent(new Event('repo-collection-open'));
  }});
  addEventListener('resize',fitCollection);
  addEventListener('keydown',event=>{
    if(document.querySelector('dialog[open]')||transitioning||dashboard.dataset.launching)return;
    if(!dashboard.classList.contains('home-mode')){if(event.key==='Escape'){event.preventDefault();showCollection();}return;}
    if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(event.key)){
      event.preventDefault();
      choose(event.key==='Home'?0:event.key==='End'?3:selected+(event.key==='ArrowDown'||event.key==='ArrowRight'?1:-1),true);
    }else if(event.key==='Enter'&&document.activeElement===document.body){event.preventDefault();showOpen();}
  });
  function restoreRoute(id) {
    if(dashboard.dataset.launching)return;
    if(id==='account'||id.startsWith('account/')){
      window.accountMenu.open({tab:id.split('/')[1]||'profile',player:id.split('/')[2]||'',game:id.split('/')[2]||'',route:false,origin:history.state?.returnHash||'#collection'});
      return;
    }
    window.accountMenu.close({route:false});
    dashboard.classList.add('route-restore');
    sceneRevision++;transitioning=false;dashboard.classList.remove('opening');
    if(document.getElementById('gallery').open)document.getElementById('gallery').close();
    window.demoLibrary.close(false);
    const index=games.findIndex(g=>g.id===id&&g.id!=='demos');
    if(id.startsWith('demo/')){choose(3,false,false);showCollection({animate:false,route:false});window.demoLibrary.open({route:false});window.repoLegacy.open(id.split('/')[1]);}
    else if(id==='demos'){choose(3,false,false);showCollection({animate:false,route:false});window.demoLibrary.open({route:false});}
    else if(index>=0){choose(index,false,false);showOpen({animate:false,route:false});}
    else showCollection({animate:false,route:false});
    // Commit direct/back navigation without briefly overlapping the collection and open case.
    void dashboard.offsetWidth;
    dashboard.classList.remove('route-restore');
  }
  addEventListener('popstate',()=>restoreRoute(location.hash.slice(1)));
  choose(0,false,false);fitCollection();
  const initial=location.hash.slice(1)||document.body.dataset.startGame;
  if(initial==='demos'||initial?.startsWith('demo/')||initial==='account'||initial?.startsWith('account/')||window.dashboardScenes.ids.includes(initial)){
    restoreRoute(initial);
    if(!location.hash)history.replaceState({scene:initial},'','#'+initial);
  }
})();
