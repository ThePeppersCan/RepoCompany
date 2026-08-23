/* Velmora Dragonbound — immersive travel map V33.33 */
(function(){
  if(window.__velmoraTravelMapV3333)return;
  window.__velmoraTravelMapV3333=true;
  const MAP_IMAGE='assets/dragonbound/travel/velmora-travel-map.webp';
  const HOTSPOTS={
    adoption:{title:"Adoption Centre",copy:"The great tree sanctuary where Bonnie cares for eggs and young dragons.",x:1.5,y:2.2,w:37,h:48},
    keepers:{title:"Other Keepers' Homes",copy:"Visit other players' homes and meet their dragons.",x:50.5,y:1.8,w:46,h:35},
    home:{title:'Your Home',copy:'Return to your farmhouse and your dragon.',x:3.0,y:61.5,w:34,h:28},
    estate:{title:'Estate Agents',copy:'Mira and the property board in the town below.',x:56.0,y:56.0,w:40,h:34}
  };
  let initDone=false, originals={};
  function businessKeyFor(key){return key==='adoption'?'adoption':key==='estate'?'estate':null;}
  function closeMenu(){const menu=document.querySelector('#dragonboundOverlay .dragonbound-travel-menu');if(menu){menu.classList.remove('is-visible');menu.setAttribute('aria-hidden','true');}}
  function clickOriginal(key){const btn=originals[key];if(btn&&typeof btn.click==='function'){btn.click();return true;}return false;}
  function renderHotspot(key){const item=HOTSPOTS[key];const bKey=businessKeyFor(key);const info=bKey&&window.VelmoraDayCycle?.getBusinessState?window.VelmoraDayCycle.getBusinessState(bKey):null;const open=!info||info.isOpen;const pill=info?`<span class="velmora-travel-map-pill ${open?'':'is-closed'}">${open?'Open now':`Closed · opens ${info.openingTime}`}</span>`:'';return `<div class="velmora-travel-map-hotspot" role="button" tabindex="0" aria-label="${item.title}" data-destination-key="${key}" style="left:${item.x}%;top:${item.y}%;width:${item.w}%;height:${item.h}%;"><span class="velmora-travel-map-label"><strong>${item.title}</strong><small>${item.copy}</small>${pill}</span></div>`;}
  function refreshState(){document.querySelectorAll('.velmora-travel-map-hotspot').forEach(btn=>{const key=btn.dataset.destinationKey;const bKey=businessKeyFor(key);const pill=btn.querySelector('.velmora-travel-map-pill');if(!pill||!bKey||!window.VelmoraDayCycle?.getBusinessState)return;const info=window.VelmoraDayCycle.getBusinessState(bKey);const closed=info.isOpen?'0':'1';if(btn.dataset.closed!==closed)btn.dataset.closed=closed;pill.classList.toggle('is-closed',!info.isOpen);const nextText=info.isOpen?'Open now':`Closed · opens ${info.openingTime}`;if(pill.textContent!==nextText)pill.textContent=nextText;});}
  function enhance(){
    const overlay=document.getElementById('dragonboundOverlay');if(!overlay)return false;
    const panel=overlay.querySelector('.dragonbound-travel-menu-panel');const grid=panel?.querySelector('.dragonbound-travel-menu-grid');if(!panel||!grid)return false;
    if(!initDone){
      panel.querySelectorAll('[data-dragonbound-travel]').forEach(btn=>{originals[btn.dataset.dragonboundTravel]=btn;});
      const kicker=panel.querySelector('.dragonbound-travel-menu-kicker');if(kicker)kicker.textContent='VELMORA TRAVEL';
      const title=panel.querySelector('.dragonbound-travel-menu-title');if(title)title.textContent='Choose where in Velmora to travel';
      const copy=panel.querySelector('.dragonbound-travel-menu-copy');if(copy)copy.textContent='Travel across a single living map. Closed places stay visible and reopen with the day.';
      grid.classList.add('velmora-travel-map-grid');
      grid.innerHTML=`<div class="velmora-travel-map-wrap"><img class="velmora-travel-map-image" src="${MAP_IMAGE}" alt="Velmora travel map" decoding="async"><div class="velmora-travel-map-sheen" aria-hidden="true"></div>${Object.keys(HOTSPOTS).map(renderHotspot).join('')}</div><div class="velmora-travel-map-legend"><span><b>Tree Sanctuary</b> = Adoption Centre · <b>Town Hall</b> = Estate Agents</span><span>Top homes = Other Keepers · Bottom farmhouse = Your Home</span></div>`;
      const activateHotspot=btn=>{if(!btn)return;const key=btn.dataset.destinationKey;const businessKey=businessKeyFor(key);if(businessKey&&window.VelmoraDayCycle?.getBusinessState){const info=window.VelmoraDayCycle.getBusinessState(businessKey);if(!info.isOpen){window.VelmoraDayCycle.showToast(`${info.displayName} is closed for the evening. Opens at ${info.openingTime}.`,2800);return;}}
        if(!clickOriginal(key)){if(key==='keepers')window.VelmoraDayCycle?.showToast?.('Other keeper homes are not available right now.');else window.VelmoraDayCycle?.showToast?.('That destination is not available right now.');}}
      grid.addEventListener('click',event=>{const btn=event.target.closest('.velmora-travel-map-hotspot');if(!btn)return;event.preventDefault();activateHotspot(btn);});
      grid.addEventListener('keydown',event=>{const btn=event.target.closest('.velmora-travel-map-hotspot');if(!btn)return;if(event.key!=='Enter'&&event.key!==' ')return;event.preventDefault();activateHotspot(btn);});
      initDone=true;
    }
    refreshState();
    return true;
  }
  // V33.29: do NOT observe the whole page. The V33.28 observer watched childList while
  // enhance()/refreshState also changed childList, creating a self-triggering loop that could
  // make the entire website appear not to load. Initialise only at known safe moments.
  function tryEnhanceSoon(delay=0){setTimeout(()=>{try{enhance();}catch(err){console.error('[Velmora travel map]',err);}},delay);}
  // V33.30: true lazy loading. The 1672×941 map is not injected or downloaded until
  // the player actually presses Travel. This keeps normal site/Dragonbound startup fast.
  document.addEventListener('velmora:time-changed',()=>{if(initDone)refreshState();});
  document.addEventListener('click',event=>{
    const target=event.target?.closest?.('#dragonboundOverlay .dragonbound-home-sidebar-hotspot--travel');
    if(!target)return;
    tryEnhanceSoon(30);
    setTimeout(()=>document.dispatchEvent(new CustomEvent('velmora:travel-map-opened')),60);
  },true);
})();
