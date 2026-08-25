/* Velmora Dragonbound — furniture placement + build inventory V32.97 */
(()=>{
  'use strict';

  const VERSION='v34-05-1-starter-houses-20260824';
  const CATEGORIES=['All','Living','Beds','Feeding','Kitchen','Bath','Training','Toys','Care','Nature','Decor','Storage'];
  const CATEGORY_ICONS={All:'✦',Living:'⌂',Beds:'▰',Feeding:'◉',Kitchen:'♨',Bath:'≋',Training:'⚔',Toys:'◆',Care:'+',Nature:'♧',Decor:'✧',Storage:'▣'};
  const RARITY_ORDER={Common:0,Crafted:1,Rare:2,Epic:3};
  const currencyName='Keeper Marks';
  const MIN_SCALE=.55,MAX_SCALE=1.60,SCALE_STEP=.10,WHEEL_SCALE_STEP=.05,DEFAULT_SCALE=.70;
  // Furniture has its own broad room-floor placement zones. These deliberately do NOT reuse
  // the baby dragon walk lanes: walk lanes are narrow navigation corridors, not buildable floor area.


const FURNITURE_PLACEMENT_ZONES={
  'norveth-varka-fell-starter':{downstairs:[[[.225,.550],[.775,.550],[.805,.742],[.195,.742]]]},
  'nambara-naskor-edge-starter':{downstairs:[[[.225,.550],[.775,.550],[.805,.742],[.195,.742]]]},
  'lumerre-greenhollow-starter':{downstairs:[[[.248,.550],[.740,.550],[.785,.742],[.218,.742]]]},
  'elvane-canto-plains-starter':{downstairs:[[[.248,.550],[.742,.550],[.785,.742],[.218,.742]]]},
  'vardesh-hestholm-fjord-starter':{downstairs:[[[.225,.550],[.775,.550],[.805,.742],[.195,.742]]]},
  'sorevia-lakeside-starter':{downstairs:[[[0.215,0.555],[0.785,0.555],[0.815,0.750],[0.185,0.750]]]},
  'iskandar-moonlit-starter':{downstairs:[[[0.215,0.520],[0.785,0.520],[0.812,0.742],[0.188,0.742]]]},
  'drazhen-ashlands-starter':{downstairs:[[[0.225,0.550],[0.775,0.550],[0.805,0.742],[0.195,0.742]]]},
  'rovarn-redstone-starter':{downstairs:[[[0.220,0.550],[0.780,0.550],[0.810,0.742],[0.190,0.742]]]},
  'marovar-crescent-starter':{downstairs:[[[0.220,0.550],[0.780,0.550],[0.810,0.742],[0.190,0.742]]]}
};
const FURNITURE_WALL_BOUNDS={
  'norveth-varka-fell-starter':{downstairs:{minX:.255,maxX:.745,minY:.395,maxY:.535}},
  'nambara-naskor-edge-starter':{downstairs:{minX:.255,maxX:.745,minY:.395,maxY:.535}},
  'lumerre-greenhollow-starter':{downstairs:{minX:.275,maxX:.720,minY:.395,maxY:.535}},
  'elvane-canto-plains-starter':{downstairs:{minX:.275,maxX:.720,minY:.395,maxY:.535}},
  'vardesh-hestholm-fjord-starter':{downstairs:{minX:.255,maxX:.745,minY:.395,maxY:.535}},
  'sorevia-lakeside-starter':{downstairs:{minX:0.245,maxX:0.755,minY:0.395,maxY:0.555}},
  'iskandar-moonlit-starter':{downstairs:{minX:0.245,maxX:0.755,minY:0.350,maxY:0.515}},
  'drazhen-ashlands-starter':{downstairs:{minX:0.255,maxX:0.745,minY:0.385,maxY:0.550}},
  'rovarn-redstone-starter':{downstairs:{minX:0.250,maxX:0.750,minY:0.385,maxY:0.550}},
  'marovar-crescent-starter':{downstairs:{minX:0.250,maxX:0.750,minY:0.385,maxY:0.550}}
};



  // Pointer hit areas are intentionally larger than the actual furniture foot zones.
  // This keeps the cursor stable near Hestholm's stair landing and removes the upstairs/downstairs flicker there.
  const FURNITURE_ROOM_HIT_ZONES={};

  // Architecture that should never accept furniture. Rather than invalidating the whole right side,
  // the preview is gently pushed off these small stair cut-outs onto the nearest usable floor.
  const FURNITURE_EXCLUSION_ZONES={};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const pointInPoly=(p,poly)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=Number(poly[i][0]),yi=Number(poly[i][1]),xj=Number(poly[j][0]),yj=Number(poly[j][1]);const hit=((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/((yj-yi)||1e-9)+xi);if(hit)inside=!inside;}return inside;};
  const horizontalRangeAtY=(poly,y)=>{const xs=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],y1=Number(a[1]),y2=Number(b[1]),x1=Number(a[0]),x2=Number(b[0]);if(Math.abs(y2-y1)<1e-9){if(Math.abs(Number(y)-y1)<1e-6)xs.push(x1,x2);continue;}if(Number(y)<Math.min(y1,y2)-1e-9||Number(y)>Math.max(y1,y2)+1e-9)continue;const t=(Number(y)-y1)/(y2-y1);if(t>=-1e-9&&t<=1+1e-9)xs.push(x1+(x2-x1)*t);}if(xs.length<2)return null;xs.sort((a,b)=>a-b);return[xs[0],xs[xs.length-1]];};
  const escapeHtml=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money=n=>Number(n||0).toLocaleString('en-GB');
  const normaliseRotation=n=>{n=((Number(n)||0)%360+360)%360;return [0,90,180,270].includes(n)?n:0;};

const FURNITURE_SPRITE_CLEAN_CACHE=new Map();
const isFurnitureSpriteSrc=src=>/assets\/dragonbound\/furniture\//.test(String(src||''));
function cleanupFurnitureSpriteData(sourceImg){
  try{
    const canvas=document.createElement('canvas');
    canvas.width=sourceImg.naturalWidth||sourceImg.width||1;
    canvas.height=sourceImg.naturalHeight||sourceImg.height||1;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    if(!ctx)return null;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(sourceImg,0,0);
    const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
    const d=imageData.data,w=canvas.width,h=canvas.height;
    const idx=(x,y)=>((y*w)+x)*4;
    const bright=(i)=>d[i+3]>0&&Math.min(d[i],d[i+1],d[i+2])>=215&&((d[i]+d[i+1]+d[i+2])/3)>=228;
    const seen=new Uint8Array(w*h);
    const qx=[],qy=[];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const p=y*w+x,di=p*4;if(seen[p]||!bright(di))continue;
      let head=0,tail=0;qx[tail]=x;qy[tail]=y;tail++;seen[p]=1;
      const pts=[];let area=0,trans=0,dark=0,neigh=0,edge=false;
      while(head<tail){
        const cx=qx[head],cy=qy[head];head++;pts.push(cy*w+cx);area++;
        if(cx===0||cy===0||cx===w-1||cy===h-1)edge=true;
        for(let ny=Math.max(0,cy-1);ny<=Math.min(h-1,cy+1);ny++)for(let nx=Math.max(0,cx-1);nx<=Math.min(w-1,cx+1);nx++){
          if(nx===cx&&ny===cy)continue;
          const np=ny*w+nx,ni=np*4;
          neigh++;
          if(d[ni+3]===0)trans++; else if(((d[ni]+d[ni+1]+d[ni+2])/3)<205)dark++;
          if(!seen[np]&&bright(ni)){seen[np]=1;qx[tail]=nx;qy[tail]=ny;tail++;}
        }
      }
      const transRatio=neigh?trans/neigh:0,darkRatio=neigh?dark/neigh:0;
      if(area<=36&&(transRatio>=0.18||edge)&&darkRatio<=0.55){
        for(const p2 of pts){const i2=p2*4;d[i2]=0;d[i2+1]=0;d[i2+2]=0;d[i2+3]=0;}
      }
    }
    ctx.putImageData(imageData,0,0);
    return canvas.toDataURL('image/png');
  }catch(_){return null;}
}

  class DragonboundFurnitureSystem{
    constructor(){
      this.stage=null;this.homeScene=null;this.world=null;this.babyLayer=null;this.layer=null;this.placementSurface=null;
      this.overlay=null;this.placementHud=null;this.editHud=null;this.toast=null;this.buildHotspot=null;
      this.houseId='';this.state={balance:0,catalog:[],inventory:[],placements:[]};
      this.inventory=new Map();this.catalog=new Map();this.placements=[];
      this.context='build';this.tab='owned';this.category='All';this.query='';this.rarity='All';this.sort='featured';this.selectedId='';this.page=1;this.lastWheelScaleAt=0;
      this.loading=false;this.localCatalogCache=null;this.placementMode=null;this.editMode=false;this.selectedPlacementId=null;this.purchaseInFlight=new Set();
      this.ghost=null;this.ghostRoom='';this.ghostPoint=null;this.ghostValid=false;this.ghostDirection='right';this.ghostScale=DEFAULT_SCALE;
      this.pointerDown=false;this.pointerId=null;this.pointerStart=null;this.savingPlacement=false;
      this.directDrag=null;this.suppressPlacementClickUntil=0;this.lastBuildMischiefDispatchAt=0;
      this.boundMove=e=>this.onPointerMove(e);this.boundDown=e=>this.onPointerDown(e);this.boundUp=e=>this.onPointerUp(e);this.boundKey=e=>this.onKey(e);this.boundWheel=e=>this.onWheel(e);
      this.boundEditDragMove=e=>this.onEditDragMove(e);this.boundEditDragEnd=e=>this.onEditDragEnd(e);
      this.furnitureSpriteCleanupObserver=null;
      this.boundResize=()=>{this.renderPlacements();if(this.overlay?.classList.contains('is-visible'))this.renderGridAndInspector();};
      document.addEventListener('keydown',this.boundKey);
      document.addEventListener('wheel',this.boundWheel,{passive:false,capture:true});
      window.addEventListener('resize',this.boundResize,{passive:true});
      window.addEventListener('dragonbound:engine-attach',e=>this.attach(e.detail||{}));
      window.addEventListener('dragonbound:house-selected',e=>this.setHouse(e.detail?.houseId||''));
      window.addEventListener('dragonbound:dragon-cleared',()=>this.exitBuildModes());
      window.dragonboundFurnitureCollisionProvider=()=>this.collisionPolys();
      window.dragonboundFurnitureInteractionProvider=()=>this.interactionSnapshot();
      window.DragonboundFurniture={
        open:()=>this.openBuild(),
        edit:()=>this.enterEditMode(),
        refresh:()=>this.refresh(true,true),
        state:()=>this.debugState(),
        ownedItems:()=>this.ownedCatalog(),
        command:placementId=>this.commandDragonToFurniture(placementId),
        setInteractionMask:(placementId,active,kind='')=>this.setInteractionMask(placementId,active,kind),
        renderProfile:itemOrId=>this.renderProfile(typeof itemOrId==='string'?this.catalog.get(itemOrId):itemOrId),
        depthForPlacement:(placementId)=>this.depthDebugForPlacement(placementId)
      };
      queueMicrotask(()=>{this.attachExisting();this.watchFurnitureSprites();this.enhanceFurnitureImages(document);});
    }


enhanceFurnitureImages(scope){
  const root=scope&&typeof scope.querySelectorAll==='function'?scope:document;
  root.querySelectorAll?.('img').forEach(img=>this.cleanFurnitureImage(img));
}

cleanFurnitureImage(img){
  if(!img||img.dataset.furnitureSpriteClean==='done'||img.dataset.furnitureSpriteClean==='busy')return;
  const raw=img.getAttribute('src')||img.src||'';
  if(!isFurnitureSpriteSrc(raw))return;
  const abs=img.src||raw;
  if(FURNITURE_SPRITE_CLEAN_CACHE.has(abs)){
    const cached=FURNITURE_SPRITE_CLEAN_CACHE.get(abs);
    img.dataset.furnitureSpriteClean='done';
    if(cached&&cached!==abs&&img.src!==cached)img.src=cached;
    return;
  }
  img.dataset.furnitureSpriteClean='busy';
  const source=new Image();
  source.decoding='async';
  source.onload=()=>{
    const cleaned=cleanupFurnitureSpriteData(source)||abs;
    FURNITURE_SPRITE_CLEAN_CACHE.set(abs,cleaned);
    if(img.isConnected){img.dataset.furnitureSpriteClean='done';if(cleaned&&cleaned!==abs&&img.src!==cleaned)img.src=cleaned;}
  };
  source.onerror=()=>{FURNITURE_SPRITE_CLEAN_CACHE.set(abs,abs);if(img.isConnected)img.dataset.furnitureSpriteClean='done';};
  source.src=abs;
}

watchFurnitureSprites(){
  if(this.furnitureSpriteCleanupObserver||!window.MutationObserver)return;
  this.furnitureSpriteCleanupObserver=new MutationObserver(mutations=>{
    for(const mut of mutations){
      if(mut.type==='attributes'&&mut.target?.tagName==='IMG')this.cleanFurnitureImage(mut.target);
      mut.addedNodes?.forEach(node=>{
        if(node?.nodeType!==1)return;
        if(node.tagName==='IMG')this.cleanFurnitureImage(node);
        this.enhanceFurnitureImages(node);
      });
    }
  });
  this.furnitureSpriteCleanupObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
}

    db(){try{return typeof db!=='undefined'?db:null;}catch(_e){return null;}}
    attachExisting(){
      const overlay=document.getElementById('dragonboundOverlay');
      const stage=overlay?.querySelector('.dragonbound-new-game-stage');
      const homeScene=overlay?.querySelector('.dragonbound-home-scene');
      const world=overlay?.querySelector('.dragonbound-home-world');
      const babyLayer=overlay?.querySelector('.dragonbound-baby-dragon-layer');
      if(stage&&homeScene&&world)this.attach({stage,homeScene,world,layer:babyLayer});
    }

    attach(detail){
      this.stage=detail.stage||this.stage;this.homeScene=detail.homeScene||this.homeScene;this.world=detail.world||this.world;this.babyLayer=detail.layer||this.babyLayer;
      if(!this.homeScene||!this.world)return;
      this.ensureLayer();this.ensurePlacementSurface();this.ensureBuildHotspot();this.ensureBonnieShop();this.ensureUi();
      const engineHouse=window.DragonboundBabyEngine?.houseId;
      if(detail.houseId||engineHouse)this.setHouse(detail.houseId||engineHouse);
    }

    ensureLayer(){
      if(this.layer?.isConnected)return this.layer;
      let layer=this.world.querySelector('.dragonbound-furniture-layer');
      if(!layer){layer=document.createElement('div');layer.className='dragonbound-furniture-layer';layer.setAttribute('aria-hidden','false');if(this.babyLayer?.parentNode===this.world)this.world.insertBefore(layer,this.babyLayer);else this.world.appendChild(layer);}
      this.layer=layer;return layer;
    }

    ensurePlacementSurface(){
      if(!this.homeScene||!this.world)return null;
      if(this.placementSurface?.isConnected)return this.placementSurface;
      let surface=this.homeScene.querySelector(':scope > .dragonbound-furniture-placement-surface');
      if(!surface){
        surface=document.createElement('div');surface.className='dragonbound-furniture-placement-surface';surface.setAttribute('aria-hidden','true');surface.setAttribute('data-dragonbound-build-surface','true');
        // V32.58: keep the input catcher OUTSIDE the breathing/scaled world. It now covers the
        // whole visible house viewport and cannot be clipped or offset by the house transform.
        this.homeScene.appendChild(surface);
      }
      this.placementSurface=surface;return surface;
    }

    ensureBuildHotspot(){
      const sidebar=this.homeScene?.querySelector('.dragonbound-home-sidebar');if(!sidebar)return;
      let btn=sidebar.querySelector('.dragonbound-home-sidebar-hotspot--build');
      if(!btn){btn=document.createElement('button');btn.type='button';btn.className='dragonbound-home-sidebar-hotspot dragonbound-home-sidebar-hotspot--build';btn.setAttribute('aria-label','Open Build Inventory');sidebar.appendChild(btn);}
      if(btn.dataset.boundBuild!=='1'){btn.dataset.boundBuild='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();this.openBuild();});}
      this.buildHotspot=btn;
    }

    ensureBonnieShop(){
      const btn=document.querySelector('.dragonbound-bonnie-menu-action--shop');if(!btn||btn.dataset.furnitureShopBound==='1')return;
      btn.dataset.furnitureShopBound='1';
      btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();const menu=document.querySelector('.dragonbound-bonnie-menu-overlay');menu?.classList.remove('is-visible');menu?.setAttribute('aria-hidden','true');this.openShopFromBonnie();},true);
    }

    ensureUi(){
      if(this.overlay?.isConnected)return;
      const root=document.getElementById('dragonboundOverlay')||document.body;
      const overlay=document.createElement('div');
      overlay.className='dragonbound-build-overlay';overlay.setAttribute('aria-hidden','true');
      overlay.innerHTML=`
        <div class="dragonbound-build-backdrop"></div>
        <section class="dragonbound-build-panel" role="dialog" aria-modal="true" aria-label="Dragonbound Build Inventory">
          <header class="dragonbound-build-topbar">
            <div class="dragonbound-build-brand"><span class="dragonbound-build-crest">D</span><div><small>DRAGONBOUND</small><strong>Build Inventory</strong></div></div>
            <div class="dragonbound-build-tabs" role="tablist">
              <button type="button" data-build-tab="owned">Owned Furniture</button>
              <button type="button" data-build-tab="shop">Furniture Shop</button>
            </div>
            <div class="dragonbound-build-wallet"><small>${currencyName}</small><strong><span class="dragonbound-build-coin">◆</span> <span data-build-balance>0</span></strong></div>
            <button class="dragonbound-build-close" type="button" aria-label="Close Build Inventory">×</button>
          </header>
          <div class="dragonbound-build-body">
            <nav class="dragonbound-build-categories" aria-label="Furniture categories"></nav>
            <main class="dragonbound-build-main">
              <div class="dragonbound-build-heading"><div><small data-build-eyebrow>FURNITURE VAULT</small><h2 data-build-title>Owned Furniture</h2></div><button type="button" class="dragonbound-build-edit-room"><span class="dragonbound-build-edit-room-icon" aria-hidden="true">✦</span><span><strong>Edit Room</strong><small>Drag furniture to move it</small></span></button></div>
              <div class="dragonbound-build-controls">
                <label class="dragonbound-build-search"><span>⌕</span><input data-build-search type="search" placeholder="Search furniture or collection…" autocomplete="off"></label>
                <select data-build-rarity aria-label="Filter rarity"><option value="All">All rarities</option><option>Common</option><option>Crafted</option><option>Rare</option><option>Epic</option></select>
                <select data-build-sort aria-label="Sort furniture"><option value="featured">Featured</option><option value="name">Name</option><option value="rarity">Rarity</option><option value="price">Price</option></select>
              </div>
              <div class="dragonbound-build-results-line"><span data-build-count>0 furnishings</span><span>House-safe • persistent inventory</span></div>
              <div class="dragonbound-build-grid" role="listbox"></div>
              <div class="dragonbound-build-pager" aria-label="Furniture pages">
                <button type="button" data-build-page-prev aria-label="Previous furniture page">‹</button>
                <span data-build-page-label>Page 1 of 1</span>
                <button type="button" data-build-page-next aria-label="Next furniture page">›</button>
              </div>
            </main>
            <aside class="dragonbound-build-inspector"></aside>
          </div>
          <footer class="dragonbound-build-footer"><span><kbd>B</kbd> inventory</span><span><kbd>Esc</kbd> close</span><span><kbd>R</kbd> turn while holding</span><span><kbd>Wheel</kbd> resize</span><span class="dragonbound-build-save-state">◆ Room changes save to your account</span></footer>
        </section>`;
      root.appendChild(overlay);this.overlay=overlay;
      overlay.querySelector('.dragonbound-build-backdrop').addEventListener('click',()=>this.close());
      overlay.querySelector('.dragonbound-build-close').addEventListener('click',()=>this.close());
      overlay.querySelectorAll('[data-build-tab]').forEach(b=>b.addEventListener('click',()=>{}));
      overlay.querySelector('[data-build-search]').addEventListener('input',e=>{this.query=e.target.value;this.page=1;this.renderGridAndInspector();});
      overlay.querySelector('[data-build-rarity]').addEventListener('change',e=>{this.rarity=e.target.value;this.page=1;this.renderGridAndInspector();});
      overlay.querySelector('[data-build-sort]').addEventListener('change',e=>{this.sort=e.target.value;this.page=1;this.renderGridAndInspector();});
      overlay.querySelector('.dragonbound-build-edit-room').addEventListener('click',()=>this.enterEditMode());
      overlay.querySelector('[data-build-page-prev]').addEventListener('click',()=>{if(this.page>1){this.page--;this.renderGridAndInspector();}});
      overlay.querySelector('[data-build-page-next]').addEventListener('click',()=>{this.page++;this.renderGridAndInspector();});
      this.renderCategories();
      this.ensurePlacementHud();this.ensureEditHud();this.ensureToast();
    }

    ensurePlacementHud(){
      if(this.placementHud?.isConnected)return;
      const hud=document.createElement('div');hud.className='dragonbound-build-placement-hud';hud.setAttribute('aria-hidden','true');
      hud.innerHTML=`<div><small>BUILD MODE · PLACE FURNITURE</small><strong data-place-name>Furniture</strong><span data-place-room>R · turn &nbsp;•&nbsp; Mouse wheel · resize</span></div><div class="dragonbound-build-placement-actions"><button type="button" data-place-turn>↔ Turn</button><button type="button" data-place-smaller>− Smaller</button><span class="dragonbound-build-size-readout" data-place-size>100%</span><button type="button" data-place-larger>+ Larger</button><button type="button" data-place-cancel>Cancel</button></div>`;
      this.homeScene.appendChild(hud);
      hud.querySelector('[data-place-cancel]').addEventListener('click',()=>this.cancelCurrentPlacement());
      hud.querySelector('[data-place-turn]').addEventListener('click',()=>this.turnGhost());
      hud.querySelector('[data-place-smaller]').addEventListener('click',()=>this.resizeGhost(-SCALE_STEP));
      hud.querySelector('[data-place-larger]').addEventListener('click',()=>this.resizeGhost(SCALE_STEP));
      this.placementHud=hud;
    }

    ensureEditHud(){
      if(this.editHud?.isConnected)return;
      const hud=document.createElement('div');hud.className='dragonbound-build-edit-hud';hud.setAttribute('aria-hidden','true');
      hud.innerHTML=`<div class="dragonbound-build-edit-summary"><small>BUILD MODE · EDIT ROOM</small><strong data-edit-title>Drag any placed furnishing</strong><span data-edit-copy>Click to select · drag to move · release to place. Turn, resize or put items away from here.</span></div><div class="dragonbound-build-edit-actions"><button type="button" data-edit-inventory>Inventory</button><button type="button" data-edit-move disabled>Move</button><button type="button" data-edit-turn disabled>↔ Turn</button><button type="button" data-edit-smaller disabled>− Smaller</button><span class="dragonbound-build-size-readout" data-edit-size>—</span><button type="button" data-edit-larger disabled>+ Larger</button><button type="button" data-edit-store disabled>Put Away</button><button type="button" data-edit-done>Done</button></div>`;
      this.homeScene.appendChild(hud);
      hud.querySelector('[data-edit-inventory]').addEventListener('click',()=>{this.exitEditMode();this.openBuild();});
      hud.querySelector('[data-edit-move]').addEventListener('click',()=>this.moveSelectedPlacement());
      hud.querySelector('[data-edit-turn]').addEventListener('click',()=>this.turnSelectedPlacement());
      hud.querySelector('[data-edit-smaller]').addEventListener('click',()=>this.resizeSelectedPlacement(-SCALE_STEP));
      hud.querySelector('[data-edit-larger]').addEventListener('click',()=>this.resizeSelectedPlacement(SCALE_STEP));
      hud.querySelector('[data-edit-store]').addEventListener('click',()=>this.storeSelectedPlacement());
      hud.querySelector('[data-edit-done]').addEventListener('click',()=>this.exitEditMode());this.editHud=hud;
    }

    ensureToast(){
      if(this.toast?.isConnected)return;const t=document.createElement('div');t.className='dragonbound-build-toast';t.setAttribute('aria-live','polite');(document.getElementById('dragonboundOverlay')||document.body).appendChild(t);this.toast=t;
    }
    notify(text,type='ok'){if(!this.toast)return;this.toast.textContent=text;this.toast.dataset.type=type;this.toast.classList.add('is-visible');clearTimeout(this.toast._timer);this.toast._timer=setTimeout(()=>this.toast?.classList.remove('is-visible'),2600);}

    async loadLocalCatalog(){
      if(this.localCatalogCache)return this.localCatalogCache;
      try{
        const res=await fetch(`FURNITURE_CATALOG_V32.66.json?v=${VERSION}`,{cache:'no-store'});if(!res.ok)throw new Error('catalog');
        const raw=await res.json();
        this.localCatalogCache=(Array.isArray(raw)?raw:[]).map(i=>({itemId:i.item_id,name:i.name,category:i.category,collection:i.collection_name,rarity:i.rarity,price:Number(i.price||0),sprite:i.sprite_path,footprintW:Number(i.footprint_w||2),footprintH:Number(i.footprint_h||1),clearance:i.clearance,description:i.description,tags:Array.isArray(i.tags)?i.tags:[],sortOrder:Number(i.sort_order||0)}));
      }catch(_e){this.localCatalogCache=[];}
      return this.localCatalogCache;
    }

    setHouse(houseId){
      if(!houseId)return;const changed=houseId!==this.houseId;this.houseId=houseId;if(changed){this.exitBuildModes();this.placements=[];this.renderPlacements();this.refresh(false);}
    }

    async refresh(showErrors=true,allowNoHouse=false){
      const dbc=this.db();if(!dbc||(!this.houseId&&!allowNoHouse))return false;this.loading=true;this.render();
      try{
        const [rpc,localCatalog]=await Promise.all([dbc.rpc('dragonbound_get_furniture_state',{p_house_id:this.houseId||null}),this.loadLocalCatalog()]);const {data,error}=rpc;if(error)throw error;
        this.state=data||{};this.state.balance=Number(this.state.balance||0);const serverCatalog=Array.isArray(this.state.catalog)?this.state.catalog:[],serverById=new Map(serverCatalog.map(i=>[i.itemId,i]));this.state.catalog=(serverCatalog.length?serverCatalog:localCatalog).map(i=>({...i,price:Number(i.price||0),sortOrder:Number(i.sortOrder||0)}));this.state.inventory=Array.isArray(this.state.inventory)?this.state.inventory:[];this.state.placements=Array.isArray(this.state.placements)?this.state.placements:[];
        this.catalog=new Map(this.state.catalog.map(i=>[i.itemId,i]));this.inventory=new Map(this.state.inventory.map(i=>[i.itemId,{owned:Number(i.owned||0),available:Number(i.available||0)}]));this.placements=this.state.placements.map(p=>{const oldRoom=String(p.roomId||'downstairs');let x=clamp(Number(p.x),.225,.775),y=Number(p.y);if(oldRoom==='upstairs')y=.585+clamp((y-.35)/.22,0,1)*.11;else y=clamp(y,.575,.715);return{...p,roomId:'downstairs',x,y,rotation:0,direction:p.direction==='left'?'left':'right',scale:clamp(Number(p.scale||DEFAULT_SCALE),MIN_SCALE,MAX_SCALE)};});
        if(!this.selectedId||!this.catalog.has(this.selectedId))this.selectedId=this.state.catalog[0]?.itemId||'';
        this.renderPlacements();this.render();window.dispatchEvent(new CustomEvent('dragonbound:furniture-changed',{detail:{houseId:this.houseId}}));return true;
      }catch(err){if(showErrors)this.notify(err?.message||'Could not load Build Inventory.','error');return false;}finally{this.loading=false;this.render();}
    }

    async openBuild(){
      this.context='build';this.tab='owned';this.page=1;this.ensureUi();this.ensureBuildHotspot();this.ensureBonnieShop();if(!this.houseId)this.houseId=window.DragonboundBabyEngine?.houseId||'';
      const atHome=!!(this.houseId&&this.homeScene?.classList.contains('is-visible')&&this.stage?.classList.contains('is-home'));
      if(!atHome){this.notify('Build Inventory can only be opened while you are at home.','error');return;}
      this.exitEditMode(false);this.cancelPlacement(false);this.overlay.classList.add('is-visible');this.overlay.setAttribute('aria-hidden','false');this.render();await this.refresh(true,false);
    }
    async openShopFromBonnie(){
      this.context='shop';this.tab='shop';this.page=1;this.ensureUi();this.ensureBuildHotspot();this.ensureBonnieShop();if(!this.houseId)this.houseId=window.DragonboundBabyEngine?.houseId||'';
      this.exitEditMode(false);this.cancelPlacement(false);this.overlay.classList.add('is-visible');this.overlay.setAttribute('aria-hidden','false');this.render();await this.refresh(true,true);
    }
    close(){this.overlay?.classList.remove('is-visible');this.overlay?.setAttribute('aria-hidden','true');}

    renderCategories(){
      const nav=this.overlay?.querySelector('.dragonbound-build-categories');if(!nav)return;nav.innerHTML=CATEGORIES.map(c=>`<button type="button" data-build-category="${c}" aria-pressed="${c===this.category}"><span>${CATEGORY_ICONS[c]}</span><small>${c}</small></button>`).join('');
      nav.querySelectorAll('[data-build-category]').forEach(b=>b.addEventListener('click',()=>{this.category=b.dataset.buildCategory;this.page=1;this.renderCategories();this.renderGridAndInspector();}));
    }

    visibleItems(){
      let arr=[...this.state.catalog];
      if(this.tab==='owned')arr=arr.filter(i=>(this.inventory.get(i.itemId)?.owned||0)>0);
      if(this.category!=='All')arr=arr.filter(i=>i.category===this.category);
      if(this.rarity!=='All')arr=arr.filter(i=>i.rarity===this.rarity);
      const q=this.query.trim().toLowerCase();if(q)arr=arr.filter(i=>`${i.name} ${i.collection} ${i.category}`.toLowerCase().includes(q));
      arr.sort((a,b)=>this.sort==='name'?a.name.localeCompare(b.name):this.sort==='rarity'?(RARITY_ORDER[b.rarity]||0)-(RARITY_ORDER[a.rarity]||0):this.sort==='price'?Number(a.price)-Number(b.price):this.tab==='owned'?((this.inventory.get(b.itemId)?.available||0)-(this.inventory.get(a.itemId)?.available||0)):(Number(a.price===0?0:1)-Number(b.price===0?0:1)||Number(a.sortOrder||0)-Number(b.sortOrder||0)));
      return arr;
    }

    render(){
      if(!this.overlay)return;const visible=this.overlay.classList.contains('is-visible');if(!visible&&this.loading===false)return;
      this.tab=this.context==='shop'?'shop':'owned';
      const brand=this.overlay.querySelector('.dragonbound-build-brand strong');if(brand)brand.textContent=this.context==='shop'?"Bonnie's Furniture Shop":'Build Inventory';
      this.overlay.querySelectorAll('[data-build-tab]').forEach(b=>{const allowed=(this.context==='shop'&&b.dataset.buildTab==='shop')||(this.context==='build'&&b.dataset.buildTab==='owned');b.hidden=!allowed;b.classList.toggle('is-active',allowed);b.setAttribute('aria-selected',String(allowed));});
      this.overlay.dataset.context=this.context;
      this.overlay.querySelector('[data-build-balance]').textContent=money(this.state.balance);
      this.overlay.querySelector('[data-build-title]').textContent=this.context==='shop'?"Bonnie's Furniture Shop":'Owned Furniture';
      this.overlay.querySelector('[data-build-eyebrow]').textContent=this.context==='shop'?"ADOPTION CENTRE · BONNIE'S FURNISHINGS":'YOUR FURNITURE VAULT';
      const editBtn=this.overlay.querySelector('.dragonbound-build-edit-room');editBtn.hidden=this.context!=='build'||this.placements.length===0;
      const save=this.overlay.querySelector('.dragonbound-build-save-state');if(save)save.textContent=this.context==='shop'?'◆ Purchases are delivered to your Build Inventory':'◆ Room changes save to your account';
      this.renderCategories();this.renderGridAndInspector();
    }

    pageSize(){const w=window.innerWidth||1280;return w>=1250?15:w>=960?12:8;}

    renderGridAndInspector(){
      if(!this.overlay)return;
      const items=this.visibleItems(),grid=this.overlay.querySelector('.dragonbound-build-grid'),pager=this.overlay.querySelector('.dragonbound-build-pager');
      const pageSize=this.pageSize(),totalPages=Math.max(1,Math.ceil(items.length/pageSize));this.page=clamp(Math.trunc(this.page||1),1,totalPages);
      const start=(this.page-1)*pageSize,pageItems=items.slice(start,start+pageSize);
      this.overlay.querySelector('[data-build-count]').textContent=items.length?`${items.length} furnishings · showing ${start+1}–${Math.min(start+pageSize,items.length)}`:'0 furnishings';
      const label=this.overlay.querySelector('[data-build-page-label]');if(label)label.textContent=`Page ${this.page} of ${totalPages}`;
      const prev=this.overlay.querySelector('[data-build-page-prev]'),next=this.overlay.querySelector('[data-build-page-next]');if(prev)prev.disabled=this.page<=1;if(next)next.disabled=this.page>=totalPages;
      if(pager)pager.hidden=items.length<=pageSize;
      if(!items.length){grid.innerHTML=`<div class="dragonbound-build-empty"><span>⌂</span><h3>${this.tab==='owned'?'Your Build Inventory is empty':'No furnishings found'}</h3><p>${this.tab==='owned'?"Visit Bonnie's Adoption Centre shop to buy or claim furniture.":'Try another category or search.'}</p></div>`;this.renderInspector(null);return;}
      if(!pageItems.some(i=>i.itemId===this.selectedId))this.selectedId=pageItems[0]?.itemId||items[0].itemId;
      grid.innerHTML=pageItems.map(i=>{const inv=this.inventory.get(i.itemId)||{owned:0,available:0};const selected=i.itemId===this.selectedId;const free=Number(i.price)===0;return `<button type="button" class="dragonbound-build-card ${selected?'is-selected':''} ${inv.owned===0?'is-locked':''}" data-item-id="${escapeHtml(i.itemId)}" role="option" aria-selected="${selected}"><span class="dragonbound-build-rarity-pin" data-rarity="${escapeHtml(i.rarity)}"></span>${this.tab==='owned'?`<span class="dragonbound-build-owned-count">×${inv.available}<small> / ${inv.owned}</small></span>`:(free?'<span class="dragonbound-build-free-tag">STARTER GIFT</span>':`<span class="dragonbound-build-price-tag">◆ ${money(i.price)}</span>`)}<span class="dragonbound-build-card-art"><img src="${escapeHtml(i.sprite)}?v=${VERSION}" alt=""></span><strong>${escapeHtml(i.name)}</strong><small>${escapeHtml(i.collection)}</small></button>`;}).join('');
      grid.scrollTop=0;
      grid.querySelectorAll('[data-item-id]').forEach(b=>b.addEventListener('click',()=>{this.selectedId=b.dataset.itemId;this.renderGridAndInspector();}));
      this.renderInspector(this.catalog.get(this.selectedId)||pageItems[0]||items[0]);
      this.enhanceFurnitureImages(grid);
      this.enhanceFurnitureImages(this.overlay.querySelector('.dragonbound-build-inspector'));
    }

    renderInspector(item){
      const aside=this.overlay?.querySelector('.dragonbound-build-inspector');if(!aside)return;
      if(!item){aside.innerHTML='<div class="dragonbound-build-inspector-empty">Select a furnishing to inspect it.</div>';return;}
      const inv=this.inventory.get(item.itemId)||{owned:0,available:0};const free=Number(item.price)===0;const canAfford=this.state.balance>=Number(item.price||0);const alreadyFree=free&&inv.owned>0;const tags=Array.isArray(item.tags)?item.tags:[];
      aside.innerHTML=`
        <div class="dragonbound-build-inspector-top"><span>ITEM DETAILS</span><span>${escapeHtml(item.rarity)}</span></div>
        <div class="dragonbound-build-preview"><div class="dragonbound-build-floor-grid"></div><img src="${escapeHtml(item.sprite)}?v=${VERSION}" alt="${escapeHtml(item.name)}"></div>
        <div class="dragonbound-build-item-copy"><span class="dragonbound-build-rarity-label" data-rarity="${escapeHtml(item.rarity)}">${escapeHtml(item.rarity)}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p></div>
        <dl class="dragonbound-build-specs"><div><dt>Collection</dt><dd>${escapeHtml(item.collection)}</dd></div><div><dt>Footprint</dt><dd>${item.footprintW} × ${item.footprintH} tiles</dd></div><div><dt>Dragon clearance</dt><dd>${escapeHtml(item.clearance)}</dd></div><div><dt>Owned</dt><dd>${inv.owned} · ${inv.available} available</dd></div></dl>
        ${tags.length?`<div class="dragonbound-build-tags">${tags.map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div>`:''}
        <div class="dragonbound-build-inspector-action"></div>`;
      const action=aside.querySelector('.dragonbound-build-inspector-action');
      if(this.tab==='owned'){
        const atHome=!!(this.houseId&&this.homeScene?.classList.contains('is-visible')&&this.stage?.classList.contains('is-home')),disabled=inv.available<1||!atHome;const placeLabel=!atHome?'Return home to place furniture':inv.available<1?'All copies are placed':`Place in House · Available ×${inv.available}`;action.innerHTML=`<button type="button" class="dragonbound-build-primary" ${disabled?'disabled':''}>${placeLabel}</button>${atHome&&this.placements.some(p=>p.itemId===item.itemId)?'<button type="button" class="dragonbound-build-secondary">Edit placed copies</button>':''}<p>${atHome?'Placed furniture is removed from the available count. Put it away to return it here.':"Furniture is bought only from Bonnie's Adoption Centre shop, then placed from Build at home."}</p>`;
        action.querySelector('.dragonbound-build-primary')?.addEventListener('click',()=>this.beginPlaceItem(item.itemId));action.querySelector('.dragonbound-build-secondary')?.addEventListener('click',()=>this.enterEditMode(item.itemId));
      }else{
        const disabled=!free&&!canAfford;let label=alreadyFree?'Free furnishing claimed ✓':free?'Claim FREE':`Buy · ◆ ${money(item.price)}`;
        action.innerHTML=`<button type="button" class="dragonbound-build-primary ${free?'is-free':''}" ${disabled||alreadyFree?'disabled':''}>${label}</button><p>${free?'Starter gift — one free claim per account.':canAfford?'Purchase adds one copy to your Build Inventory.':`You need ${money(Number(item.price)-this.state.balance)} more ${currencyName}.`}</p>`;
        action.querySelector('.dragonbound-build-primary')?.addEventListener('click',()=>this.purchase(item.itemId));
      }
    }

    async purchase(itemId){
      const dbc=this.db();if(!dbc)return;const item=this.catalog.get(itemId);if(!item||this.purchaseInFlight.has(itemId))return;
      this.purchaseInFlight.add(itemId);
      try{
        this.setBusy(true);
        const {data,error}=await dbc.rpc('dragonbound_purchase_furniture',{p_item_id:itemId});if(error)throw error;
        const row=Array.isArray(data)?data[0]:data;if(!row||typeof row!=='object')throw new Error('The shop did not return a valid purchase receipt.');
        this.state.balance=Number(row.balance||0);
        this.inventory.set(itemId,{owned:Number(row.owned||0),available:Number(row.available||0)});
        this.state.inventory=[...this.inventory].map(([id,v])=>({itemId:id,...v}));
        const balance=this.overlay?.querySelector('[data-build-balance]');if(balance)balance.textContent=money(this.state.balance);
        // Keep the successful purchase update deliberately small. Rebuilding the
        // entire shop shell here used to combine badly with other global UI
        // observers and could make the page appear to crash after clicking Buy.
        this.renderGridAndInspector();
        this.notify(row.alreadyClaimed?'You already claimed that free furnishing.':`${item.name} added to your Build Inventory.`);
      }catch(err){
        console.error('Dragonbound furniture purchase failed:',err);
        this.notify(err?.message||'Purchase failed.','error');
      }finally{
        this.purchaseInFlight.delete(itemId);this.setBusy(false);
      }
    }

    setBusy(busy){this.loading=busy;this.overlay?.classList.toggle('is-busy',busy);}

    beginPlaceItem(itemId){
      const inv=this.inventory.get(itemId);if(!inv||inv.available<1)return;const item=this.catalog.get(itemId);if(!item)return;
      this.close();this.exitEditMode(false);this.placementMode={type:'new',itemId};this.ghostDirection='right';this.ghostScale=DEFAULT_SCALE;this.showPlacementHud(item.name);this.createGhost(item);this.homeScene?.classList.add('is-build-placing');this.bindPlacementPointers();
      const start=this.findOpenPoint('downstairs',item,'');if(start)this.setGhostPoint(start.p,start.room,true);this.renderGhost();
      this.notify(this.isWallItem(item)?'Move inside a room wall area; this decoration mounts to the wall. Click or release to place it.':'Move anywhere inside the room; the furnishing snaps down onto that room’s wooden floor. Click or release to place it.');
    }

    startMovePlacement(p,{bindSurface=true,direct=false}={}){
      if(!p)return false;const item=this.catalog.get(p.itemId);if(!item)return false;
      this.editMode=false;this.homeScene?.classList.remove('is-build-editing');this.editHud?.classList.remove('is-visible');this.editHud?.setAttribute('aria-hidden','true');
      this.placementMode={type:'move',itemId:p.itemId,placementId:p.placementId,returnToEdit:true,direct:!!direct};
      this.ghostDirection=p.direction==='left'?'left':'right';this.ghostScale=clamp(Number(p.scale||DEFAULT_SCALE),MIN_SCALE,MAX_SCALE);this.showPlacementHud(item.name);this.createGhost(item);this.homeScene?.classList.add('is-build-placing');if(direct)this.homeScene?.classList.add('is-build-direct-dragging');
      if(bindSurface)this.bindPlacementPointers();this.setGhostPoint([p.x,p.y],p.roomId,true);this.renderGhost();
      const source=this.layer?.querySelector?.(`[data-placement-id="${CSS.escape(String(p.placementId||''))}"]`);source?.classList.add('is-direct-drag-source');
      return true;
    }
    moveSelectedPlacement(){const p=this.placements.find(x=>x.placementId===this.selectedPlacementId);if(!p)return;this.startMovePlacement(p,{bindSurface:true,direct:false});}
    beginEditDrag(e,placementId){
      if(!this.editMode||this.placementMode||this.savingPlacement||e.button!==0)return;
      const p=this.placements.find(x=>x.placementId===placementId);if(!p)return;
      this.selectPlacement(placementId);this.directDrag={placementId,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,started:false};
      document.addEventListener('pointermove',this.boundEditDragMove,true);document.addEventListener('pointerup',this.boundEditDragEnd,true);document.addEventListener('pointercancel',this.boundEditDragEnd,true);
    }
    clearEditDrag(){document.removeEventListener('pointermove',this.boundEditDragMove,true);document.removeEventListener('pointerup',this.boundEditDragEnd,true);document.removeEventListener('pointercancel',this.boundEditDragEnd,true);this.directDrag=null;}
    onEditDragMove(e){
      const d=this.directDrag;if(!d||e.pointerId!==d.pointerId)return;const dx=e.clientX-d.startX,dy=e.clientY-d.startY;
      if(!d.started&&Math.hypot(dx,dy)>=6){const p=this.placements.find(x=>x.placementId===d.placementId);if(!p)return this.clearEditDrag();d.started=this.startMovePlacement(p,{bindSurface:false,direct:true});if(d.started)this.suppressPlacementClickUntil=Date.now()+500;}
      if(d.started){e.preventDefault();e.stopPropagation();this.onPointerMove(e);}
    }
    onEditDragEnd(e){
      const d=this.directDrag;if(!d||e.pointerId!==d.pointerId)return;const wasStarted=!!d.started,id=d.placementId,cancelled=e.type==='pointercancel';this.clearEditDrag();
      if(!wasStarted)return;
      e.preventDefault();e.stopPropagation();
      if(!cancelled){this.onPointerMove(e);if(this.ghostValid){this.commitPlacement();return;}}
      const hadRoom=!!this.ghostRoom;this.cancelPlacement(false);this.enterEditMode();this.selectPlacement(id);this.notify(cancelled?'Move cancelled — the furnishing was put back.':hadRoom?'That spot is occupied — the furnishing was put back.':'That is outside the buildable floor — the furnishing was put back.','error');
    }
    cancelCurrentPlacement(){const mode=this.placementMode?{...this.placementMode}:null;this.cancelPlacement(false);if(mode?.returnToEdit){this.enterEditMode();if(mode.placementId)this.selectPlacement(mode.placementId);}else this.openBuild();}

    bindPlacementPointers(){const surface=this.ensurePlacementSurface();if(!surface)return;surface.addEventListener('pointermove',this.boundMove,true);surface.addEventListener('pointerdown',this.boundDown,true);surface.addEventListener('pointerup',this.boundUp,true);surface.addEventListener('pointercancel',this.boundUp,true);}
    unbindPlacementPointers(){const surface=this.placementSurface;surface?.removeEventListener('pointermove',this.boundMove,true);surface?.removeEventListener('pointerdown',this.boundDown,true);surface?.removeEventListener('pointerup',this.boundUp,true);surface?.removeEventListener('pointercancel',this.boundUp,true);this.pointerDown=false;this.pointerId=null;this.pointerStart=null;}
    isBuildControlTarget(target){return !!target?.closest?.('.dragonbound-build-placement-hud,.dragonbound-build-edit-hud,.dragonbound-home-sidebar,.dragonbound-location-return-home,.dragonbound-build-toast');}

    showPlacementHud(name){this.ensurePlacementHud();this.placementHud.querySelector('[data-place-name]').textContent=name;this.placementHud.querySelector('[data-place-room]').textContent='R · turn • Mouse wheel · resize';this.updatePlacementSizeReadout();this.placementHud.classList.add('is-visible');this.placementHud.setAttribute('aria-hidden','false');}
    updatePlacementSizeReadout(){const el=this.placementHud?.querySelector('[data-place-size]');if(el)el.textContent=`${Math.round(this.ghostScale*100)}%`;}
    createGhost(item){this.ghost?.remove();const g=document.createElement('div');g.className='dragonbound-furniture-ghost';g.innerHTML=`<img src="${escapeHtml(item.sprite)}?v=${VERSION}" alt="">`;this.ensureLayer().appendChild(g);this.ghost=g;const ghostImg=g.querySelector('img');ghostImg.addEventListener('load',()=>this.renderGhost());this.cleanFurnitureImage(ghostImg);}
    turnGhost(){if(!this.placementMode)return;this.ghostDirection=this.ghostDirection==='left'?'right':'left';this.renderGhost();}
    resizeGhost(delta){if(!this.placementMode)return;this.ghostScale=clamp(Math.round((this.ghostScale+delta)*100)/100,MIN_SCALE,MAX_SCALE);this.updatePlacementSizeReadout();const item=this.catalog.get(this.placementMode.itemId);if(this.ghostPoint&&this.ghostRoom)this.ghostValid=this.validPlacement(this.ghostPoint,this.ghostRoom,item,this.placementMode.placementId,this.ghostScale);this.setGhostPoint(this.ghostPoint,this.ghostRoom,this.ghostValid);this.renderGhost();}

    eventPoint(e){
      if(!this.world)return null;
      // The hit surface lives in screen space, while furniture coordinates live in the unscaled
      // house image. Convert through the CURRENT transformed world rectangle so the breathing zoom
      // can never shift the cursor away from the floor.
      const r=this.world.getBoundingClientRect();
      if(!r.width||!r.height||e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return null;
      const localX=(e.clientX-r.left)/r.width*this.world.clientWidth;
      const localY=(e.clientY-r.top)/r.height*this.world.clientHeight;
      const engine=window.DragonboundBabyEngine;let p;
      if(engine?.fromPixels)p=engine.fromPixels(localX,localY);
      else p=[localX/Math.max(1,this.world.clientWidth),localY/Math.max(1,this.world.clientHeight)];
      return [clamp(p[0],0,1),clamp(p[1],0,1)];
    }
    onPointerMove(e){if(!this.placementMode||this.savingPlacement)return;const raw=this.eventPoint(e);if(!raw){this.setGhostPoint(this.ghostPoint,'',false);return;}const item=this.catalog.get(this.placementMode.itemId),room=this.roomForPoint(raw),p=room?this.projectPointToRoom(raw,room,item,this.ghostScale):raw,valid=!!room&&this.validPlacement(p,room,item,this.placementMode.placementId,this.ghostScale);this.setGhostPoint(p,room||'',valid);this.renderGhost();}
    onPointerDown(e){if(!this.placementMode||this.savingPlacement||this.isBuildControlTarget(e.target))return;const p=this.eventPoint(e);if(!p)return;e.preventDefault();e.stopPropagation();this.pointerDown=true;this.pointerId=e.pointerId;this.pointerStart=[e.clientX,e.clientY];this.onPointerMove(e);try{this.placementSurface?.setPointerCapture?.(e.pointerId);}catch(_e){}}
    onPointerUp(e){if(!this.placementMode||this.savingPlacement||!this.pointerDown||this.pointerId!==e.pointerId)return;this.pointerDown=false;try{this.placementSurface?.releasePointerCapture?.(e.pointerId);}catch(_e){}if(this.isBuildControlTarget(e.target))return;e.preventDefault();e.stopPropagation();this.onPointerMove(e);if(this.ghostValid)this.commitPlacement();else this.notify(this.ghostRoom?'That spot is occupied — move it a little further away.':'Click anywhere on the visible wooden floor to place it.','error');}
    setGhostPoint(p,room,valid){if(p)this.ghostPoint=p;this.ghostRoom=room||'';this.ghostValid=!!valid;if(p&&room&&valid){const now=Date.now();if(now-this.lastBuildMischiefDispatchAt>1200){this.lastBuildMischiefDispatchAt=now;window.dispatchEvent(new CustomEvent('dragonbound:build-hover',{detail:{point:[Number(p[0]),Number(p[1])],roomId:String(room),itemId:String(this.placementMode?.itemId||''),valid:true}}));}}if(this.placementHud){const item=this.catalog.get(this.placementMode?.itemId),surface=this.isWallItem(item)?'wall':'floor';this.placementHud.querySelector('[data-place-room]').textContent=room?(valid?`Ground floor ${surface} · click or release to place`:`Ground floor ${surface} · too close to another furnishing`):`Move onto the visible ground-floor ${surface}`;this.placementHud.classList.toggle('is-invalid',!valid);}}

    roomZones(room){const custom=FURNITURE_PLACEMENT_ZONES[this.houseId]?.[room];if(custom?.length)return custom;const map=window.DragonboundHouseNavigationRegistry?.[this.houseId],floor=map?.floors?.find(f=>f.id===room);return floor?.walkableZones||[];}
    roomHitZones(room){
      const authored=FURNITURE_ROOM_HIT_ZONES[this.houseId]?.[room];
      if(authored?.length)return authored;
      // The player should be able to point at the ROOM, not hunt for a razor-thin strip of floor pixels.
      // We accept a generous interior hit area, then project the furniture's feet down onto the authored floor band.
      return this.roomZones(room).map(poly=>{
        const xs=poly.map(q=>Number(q[0])),ys=poly.map(q=>Number(q[1]));
        const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
        return [[clamp(minX-.045,0,1),clamp(minY-.155,0,1)],[clamp(maxX+.045,0,1),clamp(minY-.155,0,1)],[clamp(maxX+.045,0,1),clamp(maxY+.025,0,1)],[clamp(minX-.045,0,1),clamp(maxY+.025,0,1)]];
      });
    }
    exclusionZones(room){return FURNITURE_EXCLUSION_ZONES[this.houseId]?.[room]||[];}
    isWallItem(item){return Array.isArray(item?.tags)&&item.tags.includes('wall-mounted');}
    isFloorCovering(item){
      const tags=new Set(Array.isArray(item?.tags)?item.tags.map(v=>String(v).toLowerCase()):[]);
      if(tags.has('floor-covering')||tags.has('floor covering')||tags.has('rug')||tags.has('carpet')||tags.has('mat'))return true;
      if(this.isWallItem(item))return false;
      const text=`${item?.itemId||''} ${item?.name||''} ${item?.category||''}`.toLowerCase();
      return /\b(rug|carpet|floor\s*mat|training\s*mat|stretching\s*mat|welcome\s*mat|runner|floor\s*cloth|floor\s*covering)\b/.test(text);
    }
    stableDepthTie(value=''){
      const s=String(value||'');let h=2166136261;
      for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
      return Math.abs(h>>>0)%2;
    }
    renderProfile(item){
      if(!item)return{type:'normal_floor_object',frontMaskTop:null,interactionKind:'inspect'};
      const wallMounted=this.isWallItem(item),floorCovering=this.isFloorCovering(item),kind=this.interactionKindForItem(item),tags=new Set(Array.isArray(item?.tags)?item.tags.map(v=>String(v).toLowerCase()):[]),text=`${item?.itemId||''} ${item?.name||''} ${item?.category||''}`.toLowerCase();
      if(wallMounted)return{type:'wall_object',frontMaskTop:null,interactionKind:kind};
      if(floorCovering)return{type:'floor_covering',frontMaskTop:null,interactionKind:kind};
      let frontMaskTop=null;
      if(kind==='wash'||kind==='sandbath'||tags.has('washable')||tags.has('sandbath'))frontMaskTop=.57;
      else if(kind==='sleep'&&/\b(bed|nest|cot|crib|hammock|sleeping\s*pod|sleeping\s*basket|sleeping\s*den)\b/.test(text))frontMaskTop=.68;
      else if(kind==='hide'&&/\b(hide|hideout|den|cave|tent|covered\s*basket)\b/.test(text))frontMaskTop=.58;
      else if(kind==='rest'&&/\b(sofa|couch|armchair|chair|beanbag|cushion|lounger|resting\s*nest)\b/.test(text))frontMaskTop=.77;
      return{type:frontMaskTop==null?'normal_floor_object':'interaction_container',frontMaskTop,interactionKind:kind};
    }
    furnitureBaseAnchorY(p,item){
      // Placement Y is authored as the object's floor-contact point. Keeping the anchor at
      // that exact point means resizing/flipping changes the sprite footprint without moving
      // the floor contact underneath it.
      const y=Number(p?.y);
      return Number.isFinite(y)?clamp(y,0,1):0;
    }
    worldDepthForY(y,bias=5,tie=0){
      const base=Math.round(clamp(Number(y)||0,0,1)*100000);
      return 100000+base*10+Number(bias||0)+Math.max(0,Math.min(7,Number(tie||0)));
    }
    placementDepthOrder(p,item){
      const profile=this.renderProfile(item),y=this.furnitureBaseAnchorY(p,item),tie=this.stableDepthTie(p?.placementId||p?.itemId||`${p?.x||0}:${p?.y||0}`);
      // Floor planes and wall art are intentionally outside the dynamic actor/furniture Y band.
      // This guarantees rugs never rise above a dragon and wall art never jumps in front of one.
      if(profile.type==='floor_covering')return String(70000+Math.round(y*1000)+tie);
      if(profile.type==='wall_object')return String(85000+Math.round(y*1000)+tie);
      return String(this.worldDepthForY(y,4,tie));
    }
    frontMaskDepthOrder(p,item){
      const y=this.furnitureBaseAnchorY(p,item),tie=this.stableDepthTie(p?.placementId||p?.itemId||'');
      // Mounted dragons use bias 8. A container lip at 9 sits just above the mounted body,
      // while even a tiny lower floor-anchor still outranks the whole interaction naturally.
      return String(this.worldDepthForY(y,9,0));
    }
    depthDebugForPlacement(placementId){
      const p=this.placements.find(v=>String(v.placementId)===String(placementId));if(!p)return null;
      const item=this.catalog.get(p.itemId),profile=this.renderProfile(item);
      return{placementId:p.placementId,itemId:p.itemId,renderType:profile.type,anchorY:this.furnitureBaseAnchorY(p,item),depth:Number(this.placementDepthOrder(p,item)),frontMaskDepth:profile.frontMaskTop==null?null:Number(this.frontMaskDepthOrder(p,item)),frontMaskTop:profile.frontMaskTop};
    }
    wallBounds(room){
      const authored=FURNITURE_WALL_BOUNDS[this.houseId]?.[room];if(authored)return{...authored};
      const zones=this.roomZones(room),hits=this.roomHitZones(room);if(!zones.length)return null;
      const xs=zones.flatMap(poly=>poly.map(q=>Number(q[0]))),ys=zones.flatMap(poly=>poly.map(q=>Number(q[1])));
      const hitYs=(hits||[]).flatMap(poly=>poly.map(q=>Number(q[1])));
      const minX=Math.min(...xs),maxX=Math.max(...xs),floorTop=Math.min(...ys),hitTop=hitYs.length?Math.min(...hitYs):floorTop-.15;
      const maxY=floorTop-.012,minY=Math.min(maxY-.055,Math.max(0,hitTop+.018));
      return{minX,maxX,minY,maxY};
    }
    nudgeOutOfExclusions(p,room,item,scale=DEFAULT_SCALE){
      let out=p.slice();const hw=this.itemHalfWidth(item,scale),pad=Math.max(.008,Math.min(.022,hw*.45));
      for(const poly of this.exclusionZones(room)){
        if(!pointInPoly(out,poly))continue;
        const xs=poly.map(q=>Number(q[0])),ys=poly.map(q=>Number(q[1])),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
        const options=[[minX-pad,out[1]],[maxX+pad,out[1]],[out[0],minY-pad],[out[0],maxY+pad]];
        options.sort((a,b)=>Math.hypot(a[0]-out[0],a[1]-out[1])-Math.hypot(b[0]-out[0],b[1]-out[1]));
        const zone=this.roomZones(room).find(z=>pointInPoly(options[0],z))||this.roomZones(room).find(z=>options.some(q=>pointInPoly(q,z)));
        const candidate=options.find(q=>zone&&pointInPoly(q,zone));if(candidate)out=candidate;
      }
      return out;
    }
    roomForPoint(p){return this.roomHitZones('downstairs').some(poly=>pointInPoly(p,poly))?'downstairs':'';}
    projectPointToRoom(p,room,item,scale=DEFAULT_SCALE){
      const zones=this.roomZones(room);if(!zones.length)return p.slice();
      if(this.isWallItem(item)){
        const b=this.wallBounds(room);if(!b)return p.slice();
        const hw=this.itemHalfWidth(item,scale),pad=Math.max(.004,Math.min(.018,hw*.42));
        return[clamp(Number(p[0]),b.minX+pad,b.maxX-pad),clamp(Number(p[1]),b.minY,b.maxY)];
      }
      if(false){
        const x=Number(p[0]),y=Number(p[1]),hw=this.itemHalfWidth(item,scale),d=this.itemDepth(item,scale);
        const marginX=Math.max(.0035,Math.min(.012,hw*.22));
        if(room==='upstairs'){
          // Map the whole visible upstairs room vertically onto the actual wooden floor. This means
          // moving the cursor downward visibly moves the furniture toward the front edge instead of
          // leaving it glued to the back-wall line.
          const t=clamp((y-.305)/(.575-.305),0,1);
          const fy=.480+t*(.520-.480);
          // The landing above the stairs is a genuine buildable extension of the upper floor.
          const maxX=x>.665?.728:.682;
          return [clamp(x,.296+marginX,maxX-marginX),clamp(fy,.478+Math.min(.006,d*.22),.520)];
        }
        const t=clamp((y-.565)/(.795-.565),0,1);
        const fy=.684+t*(.744-.684);
        return [clamp(x,.290+marginX,.684-marginX),clamp(fy,.681+Math.min(.006,d*.22),.744)];
      }
      // Project the cursor onto the actual perspective floor polygon instead of onto its bounding box.
      // This is what lets furniture reach the back boards near the wall while still respecting the angled side walls.
      let best=zones[0],bestScore=Infinity;
      for(const poly of zones){
        const xs=poly.map(q=>Number(q[0])),ys=poly.map(q=>Number(q[1])),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
        const dx=Number(p[0])<minX?minX-Number(p[0]):Number(p[0])>maxX?Number(p[0])-maxX:0;
        const dy=Number(p[1])<minY?minY-Number(p[1]):Number(p[1])>maxY?Number(p[1])-maxY:0;
        const score=dx*1.35+dy;if(score<bestScore){bestScore=score;best=poly;}
      }
      const ys=best.map(q=>Number(q[1])),minY=Math.min(...ys),maxY=Math.max(...ys);
      const hw=this.itemHalfWidth(item,scale),d=this.itemDepth(item,scale),marginX=Math.min(.018,hw*.38)+.002,marginY=Math.min(.010,d*.38)+.0015,bottomInset=.004;
      const y=clamp(Number(p[1]),minY+marginY,maxY-bottomInset);
      const range=horizontalRangeAtY(best,y)||[Math.min(...best.map(q=>Number(q[0]))),Math.max(...best.map(q=>Number(q[0])))];
      const left=range[0]+marginX,right=range[1]-marginX;
      const x=left<=right?clamp(Number(p[0]),left,right):(range[0]+range[1])/2;
      return this.nudgeOutOfExclusions([x,y],room,item,scale);
    }
    itemHalfWidth(item,scale=DEFAULT_SCALE){return (.010+Number(item?.footprintW||2)*.0065)*clamp(Number(scale||1),MIN_SCALE,MAX_SCALE);}
    itemDepth(item,scale=DEFAULT_SCALE){return (.007+Number(item?.footprintH||1)*.0055)*clamp(Number(scale||1),MIN_SCALE,MAX_SCALE);}
    placementPoly(p,item,scale=DEFAULT_SCALE){const hw=this.itemHalfWidth(item,scale),d=this.itemDepth(item,scale);return [[Number(p.x)-hw,Number(p.y)-d],[Number(p.x)+hw,Number(p.y)-d],[Number(p.x)+hw,Number(p.y)+.004],[Number(p.x)-hw,Number(p.y)+.004]];}
    validPlacement(p,room,item,ignoreId='',scale=DEFAULT_SCALE){
      if(!room||!item)return false;
      if(this.isWallItem(item)){
        const b=this.wallBounds(room);if(!b||p[0]<b.minX||p[0]>b.maxX||p[1]<b.minY||p[1]>b.maxY)return false;
        const hw=this.itemHalfWidth(item,scale),vh=(.020+Number(item?.footprintH||1)*.010)*clamp(Number(scale||1),MIN_SCALE,MAX_SCALE);
        for(const existing of this.placements){
          if(existing.placementId===ignoreId||existing.roomId!==room)continue;
          const other=this.catalog.get(existing.itemId);if(!this.isWallItem(other))continue;
          const ohw=this.itemHalfWidth(other,Number(existing.scale||DEFAULT_SCALE)),ovh=(.020+Number(other?.footprintH||1)*.010)*clamp(Number(existing.scale||1),MIN_SCALE,MAX_SCALE);
          if(Math.abs(Number(existing.x)-p[0])<(hw+ohw)*.86+.004&&Math.abs(Number(existing.y)-p[1])<(vh+ovh)*.72+.004)return false;
        }
        return true;
      }
      if(!this.roomZones(room).some(poly=>pointInPoly(p,poly)))return false;
      if(this.exclusionZones(room).some(poly=>pointInPoly(p,poly)))return false;
      const hw=this.itemHalfWidth(item,scale),d=this.itemDepth(item,scale);
      // Keep only a light edge margin. Furniture placement is intentionally much freer than dragon navigation.
      const zone=this.roomZones(room).find(poly=>pointInPoly(p,poly));if(zone){
        const ys=zone.map(q=>Number(q[1])),minY=Math.min(...ys),maxY=Math.max(...ys),marginX=Math.min(.018,hw*.38),marginY=Math.min(.010,d*.38);
        if(p[1]<minY+marginY||p[1]>maxY-.004)return false;
        const range=horizontalRangeAtY(zone,Number(p[1]));if(!range||p[0]<range[0]+marginX||p[0]>range[1]-marginX)return false;
      }
      for(const existing of this.placements){if(existing.placementId===ignoreId||existing.roomId!==room)continue;const other=this.catalog.get(existing.itemId);if(this.isFloorCovering(item)||this.isFloorCovering(other))continue;const otherScale=Number(existing.scale||DEFAULT_SCALE);const minDx=(hw+this.itemHalfWidth(other,otherScale))*.76+.004,minDy=(Math.max(d,this.itemDepth(other,otherScale))*.72)+.004;if(Math.abs(Number(existing.x)-p[0])<minDx&&Math.abs(Number(existing.y)-p[1])<minDy)return false;}
      return true;
    }
    findOpenPoint(room,item,ignoreId=''){
      if(this.isWallItem(item)){
        const b=this.wallBounds(room);if(b){
          const candidates=[[.5*(b.minX+b.maxX),.5*(b.minY+b.maxY)],[b.minX+(b.maxX-b.minX)*.30,.5*(b.minY+b.maxY)],[b.minX+(b.maxX-b.minX)*.70,.5*(b.minY+b.maxY)]];
          for(const q of candidates)if(this.validPlacement(q,room,item,ignoreId,this.ghostScale))return{room,p:q};
        }
        return null;
      }
      const zones=this.roomZones(room);for(const poly of zones){const xs=poly.map(q=>q[0]),ys=poly.map(q=>q[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const candidates=[];for(let y=maxY-.018;y>=minY+.018;y-=.026)for(let x=minX+.025;x<=maxX-.025;x+=.035)candidates.push([x,y]);candidates.sort((a,b)=>Math.abs(a[0]-(minX+maxX)/2)-Math.abs(b[0]-(minX+maxX)/2));for(const p of candidates)if(pointInPoly(p,poly)&&this.validPlacement(p,room,item,ignoreId,this.ghostScale))return{room,p};}return null;}

    renderGhost(){
      if(!this.ghost||!this.ghostPoint)return;const engine=window.DragonboundBabyEngine;const xy=engine?.toPixels?engine.toPixels(this.ghostPoint):{x:this.ghostPoint[0]*this.world.clientWidth,y:this.ghostPoint[1]*this.world.clientHeight};this.ghost.style.left=xy.x+'px';this.ghost.style.top=xy.y+'px';this.ghost.classList.toggle('is-valid',!!this.ghostValid);this.ghost.classList.toggle('is-invalid',!this.ghostValid);
      const img=this.ghost.querySelector('img'),item=this.catalog.get(this.placementMode?.itemId),profile=this.renderProfile(item),ghostPlacement={placementId:`ghost:${this.placementMode?.placementId||this.placementMode?.itemId||''}`,itemId:this.placementMode?.itemId||'',x:this.ghostPoint[0],y:this.ghostPoint[1]};
      this.ghost.classList.toggle('is-wall-mounted',this.isWallItem(item));this.ghost.dataset.renderType=profile.type;this.ghost.style.zIndex=this.placementDepthOrder(ghostPlacement,item);this.sizeWorldImage(img,item,this.ghostScale);const flip=this.ghostDirection==='left'?-1:1;img.style.transform=`translate(-50%,-96%) scaleX(${flip})`;
    }

    async commitPlacement(){
      if(!this.placementMode||this.savingPlacement||!this.ghostValid||!this.ghostPoint||!this.ghostRoom){if(!this.ghostValid)this.notify('That position is not safe for furniture.','error');return;}
      const dbc=this.db(),mode={...this.placementMode},p=this.ghostPoint.slice(),room=this.ghostRoom,direction=this.ghostDirection,scale=this.ghostScale,item=this.catalog.get(mode.itemId);if(!dbc||!item)return;
      try{this.savingPlacement=true;this.placementHud?.classList.add('is-saving');let data,error;
        if(mode.type==='new')({data,error}=await dbc.rpc('dragonbound_place_furniture_v2',{p_item_id:mode.itemId,p_house_id:this.houseId,p_room_id:room,p_x:p[0],p_y:p[1],p_direction:direction,p_scale:scale}));
        else ({data,error}=await dbc.rpc('dragonbound_move_furniture_v2',{p_placement_id:mode.placementId,p_room_id:room,p_x:p[0],p_y:p[1],p_direction:direction,p_scale:scale}));
        if(error)throw error;const saved={...data,x:Number(data.x),y:Number(data.y),rotation:0,direction:data.direction==='left'?'left':'right',scale:clamp(Number(data.scale||scale),MIN_SCALE,MAX_SCALE)};
        if(mode.type==='new'){const inv=this.inventory.get(mode.itemId);if(inv)inv.available=Math.max(0,inv.available-1);this.placements.push(saved);}else{const idx=this.placements.findIndex(x=>x.placementId===mode.placementId);if(idx>=0)this.placements[idx]={...this.placements[idx],...saved};}
        this.syncState();this.renderPlacements();this.cancelPlacement(false);window.dispatchEvent(new CustomEvent('dragonbound:furniture-changed',{detail:{houseId:this.houseId}}));this.notify(mode.type==='new'?`${item.name} placed.`:`${item.name} moved.`);this.enterEditMode(mode.itemId,saved.placementId||mode.placementId||'');
      }catch(err){this.notify(err?.message||'Could not save furniture placement.','error');}finally{this.savingPlacement=false;this.placementHud?.classList.remove('is-saving');}
    }

    cancelPlacement(reopen=false){this.unbindPlacementPointers();this.layer?.querySelectorAll?.('.is-direct-drag-source').forEach(el=>el.classList.remove('is-direct-drag-source'));this.homeScene?.classList.remove('is-build-placing','is-build-direct-dragging');this.placementHud?.classList.remove('is-visible','is-invalid','is-saving');this.placementHud?.setAttribute('aria-hidden','true');this.ghost?.remove();this.ghost=null;this.ghostPoint=null;this.ghostRoom='';this.ghostValid=false;this.placementMode=null;this.savingPlacement=false;if(reopen)this.openBuild();}

    enterEditMode(filterItemId='',selectPlacementId=''){this.context='build';this.close();this.cancelPlacement(false);this.editMode=true;this.selectedPlacementId='';this.homeScene?.classList.add('is-build-editing');this.editHud?.classList.add('is-visible');this.editHud?.setAttribute('aria-hidden','false');this.renderPlacements();if(selectPlacementId){const exact=this.placements.find(x=>x.placementId===selectPlacementId);if(exact)this.selectPlacement(exact.placementId);else this.updateEditHud();}else if(filterItemId){const p=this.placements.find(x=>x.itemId===filterItemId);if(p)this.selectPlacement(p.placementId);else this.updateEditHud();}else this.updateEditHud();this.notify(this.placements.length?'Drag a furnishing to move it, or click once to edit it.':'There is no furniture placed in this room yet.');}
    exitEditMode(render=true){if(this.directDrag)this.clearEditDrag();const wasEditing=this.editMode;this.editMode=false;this.selectedPlacementId='';this.homeScene?.classList.remove('is-build-editing');this.editHud?.classList.remove('is-visible');this.editHud?.setAttribute('aria-hidden','true');if(render)this.renderPlacements();if(wasEditing&&!this.placementMode)window.dispatchEvent(new CustomEvent('dragonbound:build-mode-end'));}
    selectPlacement(id){if(!this.editMode)return;this.selectedPlacementId=id;this.renderPlacements();this.updateEditHud();}
    updateEditHud(){if(!this.editHud)return;const p=this.placements.find(x=>x.placementId===this.selectedPlacementId),item=p&&this.catalog.get(p.itemId);this.editHud.querySelector('[data-edit-title]').textContent=item?.name||'Click a placed furnishing';this.editHud.querySelector('[data-edit-copy]').textContent=item?`Ground floor · ${item.collection} · drag it directly to move`:'Drag furniture directly, or click once to select it for turn, resize or storage.';['move','turn','smaller','larger','store'].forEach(k=>{const b=this.editHud.querySelector(`[data-edit-${k}]`);if(b)b.disabled=!p;});const size=this.editHud.querySelector('[data-edit-size]');if(size)size.textContent=p?`${Math.round(Number(p.scale||1)*100)}%`:'—';}
    async updateSelectedAppearance(patch,message){const p=this.placements.find(x=>x.placementId===this.selectedPlacementId);if(!p)return;const dbc=this.db();const next={direction:patch.direction??p.direction??'right',scale:clamp(Number(patch.scale??p.scale??DEFAULT_SCALE),MIN_SCALE,MAX_SCALE)};try{const {data,error}=await dbc.rpc('dragonbound_move_furniture_v2',{p_placement_id:p.placementId,p_room_id:p.roomId,p_x:p.x,p_y:p.y,p_direction:next.direction,p_scale:next.scale});if(error)throw error;Object.assign(p,data,{x:Number(data.x),y:Number(data.y),rotation:0,direction:data.direction==='left'?'left':'right',scale:clamp(Number(data.scale||next.scale),MIN_SCALE,MAX_SCALE)});this.syncState();this.renderPlacements();this.updateEditHud();window.dispatchEvent(new CustomEvent('dragonbound:furniture-changed',{detail:{houseId:this.houseId}}));if(message)this.notify(message);}catch(err){this.notify(err?.message||'Could not update furniture.','error');}}
    turnSelectedPlacement(){const p=this.placements.find(x=>x.placementId===this.selectedPlacementId);if(!p)return;this.updateSelectedAppearance({direction:p.direction==='left'?'right':'left'},'Furniture turned.');}
    resizeSelectedPlacement(delta){const p=this.placements.find(x=>x.placementId===this.selectedPlacementId);if(!p)return;const next=clamp(Math.round((Number(p.scale||1)+delta)*100)/100,MIN_SCALE,MAX_SCALE),item=this.catalog.get(p.itemId);if(item&&!this.validPlacement([Number(p.x),Number(p.y)],p.roomId,item,p.placementId,next)){this.notify('That size would overlap another furnishing or the room edge.','error');return;}this.updateSelectedAppearance({scale:next},`Furniture size · ${Math.round(next*100)}%`);}
    async storeSelectedPlacement(){const p=this.placements.find(x=>x.placementId===this.selectedPlacementId);if(!p)return;const item=this.catalog.get(p.itemId);if(!confirm(`Put ${item?.name||'this furnishing'} back into your Build Inventory?`))return;const dbc=this.db();try{const {data,error}=await dbc.rpc('dragonbound_store_furniture',{p_placement_id:p.placementId});if(error)throw error;this.placements=this.placements.filter(x=>x.placementId!==p.placementId);const inv=this.inventory.get(p.itemId);if(inv)inv.available=Number(data.available??Math.min(inv.owned,inv.available+1));this.selectedPlacementId='';this.syncState();this.renderPlacements();this.updateEditHud();window.dispatchEvent(new CustomEvent('dragonbound:furniture-changed',{detail:{houseId:this.houseId}}));this.notify(`${item?.name||'Furniture'} returned to inventory.`);}catch(err){this.notify(err?.message||'Could not put furniture away.','error');}}

    sizeWorldImage(img,item,displayScale=DEFAULT_SCALE){if(!img||!item)return;const natural=img.naturalWidth||160;const worldScale=window.DragonboundBabyEngine?.sourceScale?.()||Math.max(.5,this.world.clientWidth/1536);const userScale=clamp(Number(displayScale||DEFAULT_SCALE),MIN_SCALE,MAX_SCALE);img.style.width=Math.max(28,Math.min(245,natural*worldScale*.42*userScale))+'px';}

positionPlacementById(placementId){
  const layer=this.ensureLayer();if(!layer)return;
  const el=layer.querySelector(`[data-placement-id="${CSS.escape(String(placementId||''))}"]`);if(!el)return;
  const p=this.placements.find(x=>x.placementId===placementId);if(!p)return;
  const item=this.catalog.get(p.itemId);if(!item)return;
  this.positionPlacement(el,p,item);
}
syncPlacementImage(img,item){
  if(!img||!item)return;
  const desired=`${item.sprite}?v=${VERSION}`;
  if(img.dataset.rawSrc!==desired){
    img.dataset.rawSrc=desired;
    delete img.dataset.furnitureSpriteClean;
    img.src=desired;
  }
}

    commandDragonToFurniture(placementId){
      if(this.editMode||this.placementMode)return false;
      const p=this.placements.find(x=>x.placementId===placementId),item=p&&this.catalog.get(p.itemId);if(!p||!item)return false;
      const result=window.DragonboundBabyEngine?.commandFurnitureInteraction?.(placementId);
      if(result?.ok){const dragonName=window.DragonboundBabyEngine?.actor?.dragon?.name||'Your dragon';this.notify(`${dragonName} is heading to ${item.name}.`);return true;}
      this.notify(result?.reason||'Your dragon cannot reach that furnishing right now.','error');return false;
    }
    renderPlacements(){
      const layer=this.ensureLayer();if(!layer)return;const keep=new Set(),keepMasks=new Set();
      for(const p of this.placements){
        const item=this.catalog.get(p.itemId);if(!item)continue;
        let el=layer.querySelector(`.dragonbound-furniture-placement[data-placement-id="${CSS.escape(p.placementId)}"]`);
        if(!el){
          el=document.createElement('button');el.type='button';el.className='dragonbound-furniture-placement';el.dataset.placementId=p.placementId;el.innerHTML='<img alt=""><span class="dragonbound-furniture-edit-ring"></span>';
          el.addEventListener('pointerdown',e=>{if(this.editMode){e.preventDefault();e.stopPropagation();this.beginEditDrag(e,el.dataset.placementId);}});
          el.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(Date.now()<this.suppressPlacementClickUntil)return;if(this.editMode){this.selectPlacement(el.dataset.placementId);return;}if(!this.placementMode)this.commandDragonToFurniture(el.dataset.placementId);});
          layer.appendChild(el);const img=el.querySelector('img');img.addEventListener('load',()=>this.positionPlacementById(el.dataset.placementId));
        }
        keep.add(p.placementId);el.dataset.itemId=p.itemId;el.classList.toggle('is-selected',p.placementId===this.selectedPlacementId);el.setAttribute('aria-label',this.editMode?`Edit ${item.name}`:`Ask your dragon to interact with ${item.name}`);el.title=this.editMode?`Edit ${item.name}`:`Click to send your dragon to ${item.name}`;
        const img=el.querySelector('img');this.syncPlacementImage(img,item);img.alt=item.name;img.title=el.title;this.cleanFurnitureImage(img);this.positionPlacement(el,p,item);
        const profile=this.renderProfile(item);
        if(profile.frontMaskTop!=null){
          keepMasks.add(p.placementId);
          let mask=layer.querySelector(`.dragonbound-furniture-front-mask[data-placement-id="${CSS.escape(p.placementId)}"]`);
          if(!mask){mask=document.createElement('div');mask.className='dragonbound-furniture-front-mask';mask.dataset.placementId=p.placementId;mask.setAttribute('aria-hidden','true');mask.innerHTML='<img alt="">';layer.appendChild(mask);}
          const maskImg=mask.querySelector('img');this.syncPlacementImage(maskImg,item);this.cleanFurnitureImage(maskImg);this.positionFrontMask(mask,p,item,profile);
          mask.classList.toggle('is-active',el.classList.contains('is-dragon-occupied'));
          mask.dataset.interactionKind=el.classList.contains('is-dragon-occupied')?(el.dataset.activeInteractionKind||profile.interactionKind||''):'';
        }
      }
      layer.querySelectorAll('.dragonbound-furniture-placement').forEach(el=>{if(!keep.has(el.dataset.placementId))el.remove();});
      layer.querySelectorAll('.dragonbound-furniture-front-mask').forEach(el=>{if(!keepMasks.has(el.dataset.placementId))el.remove();});
    }
    positionPlacement(el,p,item){
      if(!el||!this.world)return;const engine=window.DragonboundBabyEngine,profile=this.renderProfile(item),anchorY=this.furnitureBaseAnchorY(p,item),xy=engine?.toPixels?engine.toPixels([p.x,p.y]):{x:p.x*this.world.clientWidth,y:p.y*this.world.clientHeight};
      el.style.left=xy.x+'px';el.style.top=xy.y+'px';el.style.zIndex=this.placementDepthOrder(p,item);
      const img=el.querySelector('img');this.sizeWorldImage(img,item,p.scale);const flip=p.direction==='left'?-1:1;img.style.transform=`translate(-50%,-96%) scaleX(${flip})`;
      el.dataset.roomId=p.roomId;el.dataset.scale=String(p.scale||1);el.dataset.wallMounted=this.isWallItem(item)?'1':'0';el.dataset.floorCovering=this.isFloorCovering(item)?'1':'0';el.dataset.renderType=profile.type;el.dataset.depthAnchorY=anchorY.toFixed(6);el.dataset.hasFrontMask=profile.frontMaskTop==null?'0':'1';
      const mask=this.layer?.querySelector?.(`.dragonbound-furniture-front-mask[data-placement-id="${CSS.escape(String(p.placementId||''))}"]`);if(mask)this.positionFrontMask(mask,p,item,profile);
    }
    positionFrontMask(mask,p,item,profile=this.renderProfile(item)){
      if(!mask||profile.frontMaskTop==null||!this.world)return;
      const engine=window.DragonboundBabyEngine,xy=engine?.toPixels?engine.toPixels([p.x,p.y]):{x:p.x*this.world.clientWidth,y:p.y*this.world.clientHeight};
      mask.style.left=xy.x+'px';mask.style.top=xy.y+'px';mask.style.zIndex=this.frontMaskDepthOrder(p,item);mask.style.setProperty('--dragon-front-mask-top',`${Math.round(profile.frontMaskTop*1000)/10}%`);
      mask.dataset.renderType='foreground_mask_object';mask.dataset.roomId=p.roomId;mask.dataset.scale=String(p.scale||1);
      const img=mask.querySelector('img');this.sizeWorldImage(img,item,p.scale);const flip=p.direction==='left'?-1:1;img.style.transform=`translate(-50%,-96%) scaleX(${flip})`;
    }
    setInteractionMask(placementId,active,kind=''){
      const id=String(placementId||'');if(!id||!this.layer)return false;
      const selector=CSS.escape(id),source=this.layer.querySelector(`.dragonbound-furniture-placement[data-placement-id="${selector}"]`),mask=this.layer.querySelector(`.dragonbound-furniture-front-mask[data-placement-id="${selector}"]`);
      if(source){source.dataset.activeInteractionKind=active?String(kind||''):'';}
      if(!mask)return false;
      mask.classList.toggle('is-active',!!active);mask.dataset.interactionKind=active?String(kind||''):'';
      return true;
    }

    collisionPolys(){return this.placements.flatMap(p=>{const item=this.catalog.get(p.itemId);if(this.isWallItem(item)||this.isFloorCovering(item))return[];return[{floorId:p.roomId,poly:this.placementPoly(p,item,p.scale),placementId:p.placementId,itemId:p.itemId}];});}

    interactionKindForItem(item){
      const tags=new Set(Array.isArray(item?.tags)?item.tags:[]),text=`${item?.name||''} ${item?.itemId||''} ${item?.category||''}`.toLowerCase(),training=tags.has('training')||String(item?.category||'').toLowerCase()==='training';
      if(tags.has('fire-practice'))return'fire';
      if(tags.has('roarable'))return'roar';
      if(training&&!/recovery|restorative|stretch nest/.test(text)&&/weight|dumbbell|resistance|sled|push|pull|strength|heavy|cable|lifting|punch|treadmill|sprint|agility|weave|balance|hurdle|landing target|climb|pegboard|roller|obstacle|jump|exercise wheel|stretch ring/.test(text))return'exercise';
      if(tags.has('sleepable'))return'sleep';
      if(tags.has('food'))return tags.has('puzzle')?'puzzle':'eat';
      if(tags.has('drink')||tags.has('hydration'))return'drink';
      if(tags.has('sandbath'))return'sandbath';
      if(tags.has('washable'))return'wash';
      if(tags.has('groomable'))return'groom';
      if(tags.has('scratchable'))return'scratch';
      if(tags.has('diggable'))return'dig';
      if(tags.has('climbable'))return'climb';
      if(tags.has('exercise')||tags.has('training')||tags.has('agility'))return'exercise';
      if(tags.has('playable')||tags.has('tug')||tags.has('chewable')||tags.has('hoardable'))return'play';
      if(tags.has('hideable'))return'hide';
      if(tags.has('perchable'))return'perch';
      if(tags.has('reading'))return'read';
      if(tags.has('mirror'))return'mirror';
      if(tags.has('sniffable'))return'sniff';
      if(tags.has('toilet'))return'toilet';
      if(tags.has('restable')||tags.has('comfortable'))return'rest';
      if(tags.has('warm'))return'warm';
      if(tags.has('window'))return'watch';
      return'inspect';
    }

    interactionProfile(p,item){
      if(!p||!item)return null;
      const wallMounted=this.isWallItem(item),floorCovering=this.isFloorCovering(item),kind=this.interactionKindForItem(item),x=Number(p.x),y=Number(p.y),scale=clamp(Number(p.scale||DEFAULT_SCALE),MIN_SCALE,MAX_SCALE),hw=this.itemHalfWidth(item,scale),depth=wallMounted?0:this.itemDepth(item,scale),dir=p.direction==='left'?'left':'right';
      if(!Number.isFinite(x)||!Number.isFinite(y))return null;
      const gapX=Math.max(.014,Math.min(.028,.011+hw*.52)),gapY=Math.max(.012,Math.min(.024,.010+depth*.70));
      const faceToward=(px)=>px<x?'right':px>x?'left':dir;
      const point=(px,py,slot,priority=0,facing=faceToward(px))=>({x:Number(px.toFixed(6)),y:Number(py.toFixed(6)),slot,priority,facing});
      const front=point(x,y+depth+gapY,'front',100,dir),rear=point(x,y-depth-gapY,'rear',25,dir),left=point(x-hw-gapX,y-Math.min(depth*.25,.008),'left',65,'right'),right=point(x+hw+gapX,y-Math.min(depth*.25,.008),'right',65,'left');
      const nearSide=dir==='left'?right:left,farSide=dir==='left'?left:right;
      let approaches=[front,nearSide,farSide,rear],mount=false,use=null;
      const sideKinds=new Set(['eat','drink','puzzle','groom','scratch','read','mirror','sniff','toilet']);
      const mountKinds=new Set(['sleep','rest','wash','sandbath','perch','hide']);
      if(wallMounted){approaches=[front,left,right];}
      else if(sideKinds.has(kind)){approaches=[{...nearSide,priority:100},{...farSide,priority:72},{...front,priority:52},rear];}
      else if(kind==='play'){approaches=[{...nearSide,priority:92},{...front,priority:82},{...farSide,priority:62},rear];}
      else if(kind==='exercise'||kind==='roar'||kind==='fire'||kind==='climb'||kind==='dig'){approaches=[{...front,priority:100},{...nearSide,priority:80},{...farSide,priority:72},rear];}
      if(mountKinds.has(kind)&&!wallMounted){
        mount=true;
        const fpH=Math.max(1,Number(item?.footprintH||1));
        let lift=Math.max(depth*.72,.010);
        if(kind==='sleep')lift=Math.min(.038,Math.max(lift,(.014+.0045*fpH)*scale));
        else if(kind==='wash')lift=Math.min(.034,Math.max(lift,(.013+.0040*fpH)*scale));
        else if(kind==='sandbath')lift=Math.min(.030,Math.max(lift,(.012+.0040*fpH)*scale));
        else if(kind==='perch')lift=Math.min(.038,Math.max(lift,(.018+.0050*fpH)*scale));
        else if(kind==='hide')lift=Math.min(.034,Math.max(lift,(.015+.0045*fpH)*scale));
        else if(kind==='rest')lift=Math.min(.034,Math.max(lift,(.015+.0045*fpH)*scale));
        // Beds, baths, cushions and rugs all get an explicit occupancy anchor.
        // A tiny direction-aware X offset keeps flipped asymmetric sprites visually centred.
        const xBias=floorCovering?0:(dir==='left'?-1:1)*Math.min(hw*.08,.0045);
        use={x:Number((x+xBias).toFixed(6)),y:Number((y-lift).toFixed(6)),facing:dir,mounted:true};
      }
      return{version:2,kind,mount,wallMounted,floorCovering,use,approaches:approaches.filter(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)).sort((a,b)=>Number(b.priority||0)-Number(a.priority||0))};
    }

    interactionSnapshot(){return this.placements.map(p=>{const item=this.catalog.get(p.itemId),wallMounted=this.isWallItem(item),interaction=this.interactionProfile(p,item),render=this.renderProfile(item);return{placementId:p.placementId,itemId:p.itemId,roomId:p.roomId,x:Number(p.x),y:Number(p.y),direction:p.direction||'right',scale:Number(p.scale||1),footprintW:Number(item?.footprintW||2),footprintH:Number(item?.footprintH||1),halfWidth:this.itemHalfWidth(item,p.scale),depth:wallMounted?0:this.itemDepth(item,p.scale),wallMounted,floorCovering:this.isFloorCovering(item),renderType:render.type,depthAnchorY:this.furnitureBaseAnchorY(p,item),frontMaskTop:render.frontMaskTop,tags:item?.tags||[],name:item?.name||p.itemId,category:item?.category||'',collection:item?.collection||'',sprite:item?.sprite||'',price:Number(item?.price||0),rarity:item?.rarity||'',interaction,personalityScore:typeof window.DragonboundFurniturePersonalityScore==='function'?window.DragonboundFurniturePersonalityScore(item?.tags||[],{roomId:p.roomId,x:p.x,y:p.y,itemId:p.itemId,wallMounted}):0};});}
    syncState(){this.state.inventory=[...this.inventory].map(([itemId,v])=>({itemId,...v}));this.state.placements=this.placements.map(p=>({...p}));this.render();}

    exitBuildModes(){const wasPlacing=!!this.placementMode;if(this.directDrag)this.clearEditDrag();this.close();this.cancelPlacement(false);this.exitEditMode(false);if(wasPlacing)window.dispatchEvent(new CustomEvent('dragonbound:build-mode-end'));}
    onWheel(e){
      if(this.placementMode&&!this.isBuildControlTarget(e.target)){
        if(Math.abs(Number(e.deltaY||0))<1)return;
        e.preventDefault();e.stopPropagation();
        const t=performance.now();if(t-this.lastWheelScaleAt<45)return;this.lastWheelScaleAt=t;
        this.resizeGhost(e.deltaY<0?WHEEL_SCALE_STEP:-WHEEL_SCALE_STEP);return;
      }
      if(!this.overlay?.classList.contains('is-visible'))return;
      const panel=e.target?.closest?.('.dragonbound-build-panel');if(!panel)return;
      const natural=e.target?.closest?.('.dragonbound-build-grid,.dragonbound-build-inspector,.dragonbound-build-categories');
      const scroller=natural||this.overlay.querySelector('.dragonbound-build-grid');if(!scroller)return;
      if(scroller.scrollHeight>scroller.clientHeight+2){e.preventDefault();scroller.scrollTop+=Number(e.deltaY||0);}
    }
    onKey(e){
      const tag=document.activeElement?.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
      if(e.key==='Escape'){if(this.directDrag){e.preventDefault();const id=this.directDrag.placementId;this.clearEditDrag();this.cancelPlacement(false);this.enterEditMode();if(id)this.selectPlacement(id);return;}if(this.placementMode){e.preventDefault();this.cancelCurrentPlacement();return;}if(this.editMode){e.preventDefault();this.exitEditMode();return;}if(this.overlay?.classList.contains('is-visible')){e.preventDefault();this.close();return;}}
      if(e.key.toLowerCase()==='b'&&this.homeScene?.classList.contains('is-visible')){e.preventDefault();if(this.overlay?.classList.contains('is-visible'))this.close();else this.openBuild();}
      if((e.key.toLowerCase()==='r'||e.key.toLowerCase()==='q'||e.key.toLowerCase()==='e')&&this.placementMode){e.preventDefault();this.turnGhost();}if((e.key==='-'||e.key==='_')&&this.placementMode){e.preventDefault();this.resizeGhost(-SCALE_STEP);}if((e.key==='+'||e.key==='=')&&this.placementMode){e.preventDefault();this.resizeGhost(SCALE_STEP);}
    }
    ownedCatalog(){return this.state.catalog.filter(item=>Number(this.inventory.get(item.itemId)?.owned||0)>0).map(item=>{const inv=this.inventory.get(item.itemId)||{};return{...item,owned:Number(inv.owned||0),available:Number(inv.available||0),placed:this.placements.some(p=>p.itemId===item.itemId)};});}
    debugState(){return{houseId:this.houseId,context:this.context,balance:this.state.balance,catalogCount:this.state.catalog.length,inventory:Object.fromEntries(this.inventory),placements:this.placements.map(p=>({...p})),mode:this.placementMode,ghost:{room:this.ghostRoom,point:this.ghostPoint,valid:this.ghostValid,direction:this.ghostDirection,scale:this.ghostScale},editMode:this.editMode};}
  }

  const system=new DragonboundFurnitureSystem();
})();
