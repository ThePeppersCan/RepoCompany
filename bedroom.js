/* Velmora — My Bedroom V33.07
   Human keeper bedroom. Separate from Dragonbound dragon housing/furniture.
   Four free room shells, a free bedroom furniture shop, direct drag editing,
   account-backed persistence with local fallback, and reserved future pet pieces.
*/
(() => {
  'use strict';
  if (window.__velmoraBedroomV3307) return;
  window.__velmoraBedroomV3307 = true;

  const VERSION = 'v33-07-bedroom-sleep-depth-hover-fix-20260822';
  const ROOT = 'assets/bedroom/';
  const DOOR_AUDIO = ROOT + 'audio/bedroom-door-open.mp3';
  const ROOMS = [
    { id:'nordic_timber', name:'Nordic Timber', src:ROOT+'rooms/room_01_nordic_timber.png', copy:'Warm timber, blue glass and a cosy Velmoran lodge feel.' },
    { id:'lakeside_stone', name:'Lakeside Stone', src:ROOT+'rooms/room_02_lakeside_stone.png', copy:'Cool stonework and a calmer lakeside character.' },
    { id:'terracotta_artisan', name:'Terracotta Artisan', src:ROOT+'rooms/room_03_terracotta_artisan.png', copy:'Warm plaster, terracotta tones and handcrafted detail.' },
    { id:'midnight_dragon', name:'Midnight Dragon', src:ROOT+'rooms/room_04_midnight_dragon.png', copy:'Dark timber, teal accents and a richer night-time mood.' }
  ];
  const ROOM_IDS = new Set(ROOMS.map(room => room.id));

  const RAW_ITEMS = [
    'bed_01_nordic_timber.png','bed_02_pale_oak.png','bed_03_terracotta.png','bed_04_midnight.png',
    'bedside_01_timber.png','bedside_02_pale_oak.png','bedside_03_terracotta.png',
    'bookshelf_01_timber.png','bookshelf_02_pale_oak.png','bookshelf_03_terracotta.png',
    'chair_01_timber.png','desk_01_timber.png','desk_03_terracotta.png',
    'dragon_care_01_feeding_station.png','dragon_care_02_scratching_perch.png',
    'dragon_nest_01_stone_cream.png','dragon_nest_02_wood_moss.png','dragon_nest_03_cave_teal.png','dragon_nest_04_crate_midnight.png',
    'lamp_01_hanging.png','lamp_02_standing.png','planter_01_fern.png','planter_02_tree.png',
    'rug_01_green.png','rug_02_terracotta.png','stool_02_pale_oak.png','stool_03_terracotta.png',
    'table_01_square.png','table_02_round.png','trunk_01_timber.png','trunk_02_pale_oak.png','trunk_03_terracotta.png',
    'vanity_02_pale_oak.png','wardrobe_01_timber.png','wardrobe_02_pale_oak.png','wardrobe_03_terracotta.png'
  ];

  // The four room shells share the same cut-away footprint, with tiny art differences.
  // These polygons describe the *walkable/decoratable floor*, not the outer image bounds.
  const ROOM_FLOORS = {
    nordic_timber:[[.19,.57],[.31,.50],[.69,.50],[.81,.57],[.91,.68],[.85,.77],[.66,.90],[.57,.96],[.43,.96],[.34,.90],[.15,.77],[.09,.68]],
    lakeside_stone:[[.20,.57],[.32,.50],[.69,.50],[.81,.57],[.91,.68],[.85,.77],[.66,.90],[.57,.96],[.43,.96],[.34,.90],[.15,.77],[.09,.68]],
    terracotta_artisan:[[.18,.57],[.31,.51],[.69,.51],[.82,.57],[.91,.68],[.85,.77],[.66,.90],[.57,.96],[.43,.96],[.34,.90],[.15,.77],[.09,.68]],
    midnight_dragon:[[.19,.57],[.31,.51],[.69,.51],[.81,.57],[.91,.68],[.85,.77],[.66,.90],[.57,.96],[.43,.96],[.34,.90],[.15,.77],[.09,.68]]
  };
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const uid=()=>{try{return crypto.randomUUID()}catch(_){return `bed-${Date.now()}-${Math.random().toString(36).slice(2,9)}`}};
  const titleCase=value=>String(value||'').replace(/\.png$/,'').replace(/^\d+_/,'').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  // 0.5% snapping is effectively free placement while keeping saved coordinates stable.
  const snap=n=>Math.round(clamp(n,0,1)/.005)*.005;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function metaFor(file){
    const id=file.replace(/\.png$/,'');
    const lower=id.toLowerCase();
    let category='Decor', footprint='1x1', width=12, blocking=true, wall=false, rug=false, futurePet=false, name=titleCase(id.replace(/^\w+_\d+_?/,''));
    if(lower.startsWith('bed_')){category='Beds';footprint='2x2';width=24;name=titleCase(id.split('_').slice(2).join('_'))+' Bed';}
    else if(lower.startsWith('bedside_')){category='Storage';footprint='1x1';width=12;name=titleCase(id.split('_').slice(2).join('_'))+' Bedside Cabinet';}
    else if(lower.startsWith('bookshelf_')){category='Storage';footprint='2x1';width=16;wall=true;name=titleCase(id.split('_').slice(2).join('_'))+' Bookshelf';}
    else if(lower.startsWith('chair_')){category='Seating';footprint='1x1';width=12;name=titleCase(id.split('_').slice(2).join('_'))+' Chair';}
    else if(lower.startsWith('stool_')){category='Seating';footprint='1x1';width=10;name=titleCase(id.split('_').slice(2).join('_'))+' Stool';}
    else if(lower.startsWith('desk_')){category='Tables & Desks';footprint='2x1';width=19;name=titleCase(id.split('_').slice(2).join('_'))+' Desk';}
    else if(lower.startsWith('table_')){category='Tables & Desks';footprint='2x1';width=17;name=titleCase(id.split('_').slice(2).join('_'))+' Table';}
    else if(lower.startsWith('vanity_')){category='Tables & Desks';footprint='2x1';width=18;wall=true;name=titleCase(id.split('_').slice(2).join('_'))+' Vanity';}
    else if(lower.startsWith('wardrobe_')){category='Storage';footprint='2x1';width=17;wall=true;name=titleCase(id.split('_').slice(2).join('_'))+' Wardrobe';}
    else if(lower.startsWith('trunk_')){category='Storage';footprint='2x1';width=15;name=titleCase(id.split('_').slice(2).join('_'))+' Trunk';}
    else if(lower.startsWith('planter_')){category='Decor';footprint='1x1';width=12;name=titleCase(id.split('_').slice(2).join('_'))+' Planter';}
    else if(lower.startsWith('lamp_01')){category='Lighting';footprint='1x1';width=8;wall=true;blocking=false;name='Hanging Lamp';}
    else if(lower.startsWith('lamp_02')){category='Lighting';footprint='1x1';width=8;name='Standing Lamp';}
    else if(lower.startsWith('rug_')){category='Rugs';footprint='3x2';width=35;blocking=false;rug=true;name=titleCase(id.split('_').slice(2).join('_'))+' Rug';}
    else if(lower.startsWith('dragon_nest_')){category='Future Pet Care';footprint='2x2';width=20;futurePet=true;name=titleCase(id.split('_').slice(3).join('_'))+' Pet Nest';}
    else if(lower.includes('feeding_station')){category='Future Pet Care';footprint='2x1';width=16;futurePet=true;name='Pet Feeding Station';}
    else if(lower.includes('scratching_perch')){category='Future Pet Care';footprint='2x1';width=15;futurePet=true;name='Pet Scratching Perch';}
    const size = footprint==='1x1'?[.045,.025]:footprint==='2x1'?[.075,.03]:footprint==='2x2'?[.09,.055]:[.14,.055];
    return {id,file,name,category,footprint,width,blocking,wall,rug,futurePet,halfW:size[0],halfH:size[1],src:ROOT+'furniture/'+file};
  }
  const ITEMS=RAW_ITEMS.map(metaFor);
  const ITEM_BY_ID=new Map(ITEMS.map(item=>[item.id,item]));
  const CATEGORIES=['All','Beds','Seating','Tables & Desks','Storage','Lighting','Rugs','Decor','Future Pet Care'];
  const KEEPER_SHEETS=[
    {id:'covidpanda',label:'covidpanda'},
    {id:'emlux',label:'emlux'},
    {id:'kat',label:'kat'},
    {id:'proco',label:'Proco'},
    {id:'smokedrope1028',label:'SmokedRope1028'},
    {id:'catasthma',label:'CatAsthma'}
  ];
  const ACCOUNT_KEEPER_MAP={
    covidpanda:'covidpanda',
    emlux:'emlux',
    kat:'kat',
    proco:'proco',
    smokedrope1028:'smokedrope1028',
    catasthma:'catasthma'
  };
  function normaliseUsername(name){return String(name||'guest').trim().toLowerCase().replace(/[^a-z0-9]/g,'');}
  function usernameHash(name){const input=normaliseUsername(name);let h=2166136261>>>0;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function keeperIdForUser(name){const key=normaliseUsername(name);return ACCOUNT_KEEPER_MAP[key]||KEEPER_SHEETS[usernameHash(key)%KEEPER_SHEETS.length].id;}
  function defaultPlayerForUser(name){return {x:.50,y:.83,dir:'down',sheetId:keeperIdForUser(name),pose:'idle'};}
  function keeperSheetById(id){return KEEPER_SHEETS.find(s=>s.id===id)||KEEPER_SHEETS.find(s=>s.id===keeperIdForUser(currentUsername()))||KEEPER_SHEETS[0];}
  function keeperFrameSrc(sheetId,row,col){return `${ROOT}keepers/${sheetId}/r${row}_c${col}.png?v=${VERSION}`;}
  function preloadKeeperFrames(sheetId){for(let row=0;row<5;row++)for(let col=0;col<4;col++){const img=new Image();img.src=keeperFrameSrc(sheetId,row,col);}}

  function roomFloor(){return ROOM_FLOORS[state.roomId]||ROOM_FLOORS.nordic_timber;}
  function pointInPolygon(x,y,poly=roomFloor()){
    let inside=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const xi=poly[i][0], yi=poly[i][1], xj=poly[j][0], yj=poly[j][1];
      const intersect=((yi>y)!==(yj>y)) && x < (xj-xi)*(y-yi)/(yj-yi+1e-9)+xi;
      if(intersect)inside=!inside;
    }
    return inside;
  }
  function floorBoundsAtY(y,poly=roomFloor()){
    const xs=[];
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[j],b=poly[i];
      if((a[1]<=y&&b[1]>=y)||(b[1]<=y&&a[1]>=y)){
        if(Math.abs(b[1]-a[1])<1e-9){xs.push(a[0],b[0]);continue;}
        const t=(y-a[1])/(b[1]-a[1]);
        if(t>=0&&t<=1)xs.push(a[0]+(b[0]-a[0])*t);
      }
    }
    xs.sort((a,b)=>a-b);
    return xs.length>=2?[xs[0],xs[xs.length-1]]:[.12,.88];
  }
  function constrainPlacement(x,y,item,scale=1){
    if(!item)return {x:.5,y:.7,valid:false};
    const visualScale=clamp(scale||1,.5,1.85);
    // Wall-backed pieces sit against the rear wall, but can slide freely left/right.
    if(item.wall){
      const wallY=item.id==='lamp_01_hanging'?.49:.565;
      const margin=Math.max(.025,item.halfW*.64*visualScale);
      return {x:snap(clamp(x,.18+margin,.82-margin)),y:snap(wallY),valid:true};
    }
    // Furniture anchors by its bottom centre. Clamp that ground point into the room polygon
    // instead of rejecting slightly-off pointer positions; this makes placement feel fluid.
    let cy=clamp(y,.515,.925-Math.min(.035,item.halfH*.25*visualScale));
    const [left,right]=floorBoundsAtY(cy);
    const margin=Math.max(.012,item.halfW*.58*visualScale);
    let minX=left+margin,maxX=right-margin;
    if(minX>maxX){const mid=(left+right)/2;minX=mid;maxX=mid;}
    const cx=clamp(x,minX,maxX);
    return {x:snap(cx),y:snap(cy),valid:pointInPolygon(cx,cy)};
  }
  function floorValid(x,y,item,scale=1){return constrainPlacement(x,y,item,scale).valid;}
  // Bedroom decorating deliberately allows tasteful overlap (rug under bed, bedside touching bed,
  // plants tucked behind furniture, etc.). The room boundary—not collision boxes—is authoritative.
  function overlaps(){return false;}

  let state={roomId:'nordic_timber',placements:[],player:defaultPlayerForUser('guest'),version:1,updatedAt:null};
  let overlay=null, stage=null, roomImg=null, placementLayer=null, playerEl=null, interactionHintEl=null, shopPanel=null, roomPanel=null, launcher=null, transitionVeil=null, doorAudio=null;
  let editMode=false, placingItemId='', selectedId='', drag=null, saveTimer=0, open=false, transitioning=false, loadedForUser='', shopCategory='All', shopQuery='';
  let keys={up:false,down:false,left:false,right:false}, raf=0, lastTick=0, playerFrameTimer=0, playerFrame=0, interactionTargetId='', actionTimer=0, sleepingPlacementId='';

  function currentUsername(){try{return String(character?.username||character?.displayName||'guest').trim()||'guest'}catch(_){return 'guest'}}
  function storageKey(){return `velmoraBedroom:v1:${currentUsername().toLowerCase()}`}
  function dbClient(){try{return db||null}catch(_){return null}}
  function roomById(id){return ROOMS.find(room=>room.id===id)||ROOMS[0]}
  function normalizeState(raw){
    const out={roomId:ROOM_IDS.has(raw?.roomId)?raw.roomId:'nordic_timber',placements:[],player:defaultPlayerForUser(currentUsername()),version:1,updatedAt:raw?.updatedAt||null};
    const placements=Array.isArray(raw?.placements)?raw.placements:[];
    for(const p of placements.slice(0,120)){
      const item=ITEM_BY_ID.get(String(p?.assetId||'')); if(!item)continue;
      out.placements.push({id:String(p?.id||uid()),assetId:item.id,x:snap(clamp(p?.x,.05,.95)),y:snap(clamp(p?.y,.45,.94)),flipped:!!p?.flipped,scale:clamp(p?.scale||1,.5,1.85)});
    }
    const rawPlayer=raw?.player||{};
    const fallback=defaultPlayerForUser(currentUsername());
    const mapped=keeperIdForUser(currentUsername());
    const chosen=ACCOUNT_KEEPER_MAP[normaliseUsername(currentUsername())]?mapped:(KEEPER_SHEETS.some(s=>s.id===rawPlayer.sheetId)?rawPlayer.sheetId:mapped);
    out.player={x:snap(clamp(rawPlayer.x??fallback.x,.12,.88)),y:snap(clamp(rawPlayer.y??fallback.y,.54,.93)),dir:['up','down','left','right'].includes(rawPlayer.dir)?rawPlayer.dir:fallback.dir,sheetId:chosen,pose:'idle'};
    return out;
  }
  function readLocal(){try{return normalizeState(JSON.parse(localStorage.getItem(storageKey())||'null'))}catch(_){return normalizeState(null)}}
  function writeLocal(){try{localStorage.setItem(storageKey(),JSON.stringify({...state,updatedAt:new Date().toISOString()}))}catch(_){}}
  async function loadState(){
    const user=currentUsername();
    if(loadedForUser===user)return;
    loadedForUser=user;
    state=readLocal();
    const client=dbClient();
    if(client&&user!=='guest'){
      try{
        const {data,error}=await client.rpc('get_my_bedroom');
        if(!error&&Array.isArray(data)&&data[0]){
          const row=data[0];
          const remote=normalizeState({roomId:row.room_id,placements:row.placements,updatedAt:row.updated_at});
          const localTime=Date.parse(state.updatedAt||0)||0, remoteTime=Date.parse(remote.updatedAt||0)||0;
          if(remoteTime>=localTime){remote.player=state.player||remote.player;state=remote;}
          else queueSave();
          writeLocal();
        }
      }catch(error){console.warn('Bedroom account load fell back to local save.',error)}
    }
  }
  function queueSave(){
    writeLocal();
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveState,500);
  }
  async function saveState(){
    writeLocal();
    const client=dbClient(); if(!client||currentUsername()==='guest')return;
    try{
      const payload=state.placements.map(p=>({id:p.id,assetId:p.assetId,x:Number(p.x.toFixed(3)),y:Number(p.y.toFixed(3)),flipped:!!p.flipped,scale:Number(p.scale.toFixed(2))}));
      const {error}=await client.rpc('save_my_bedroom',{p_room_id:state.roomId,p_placements:payload});
      if(error)throw error;
      state.updatedAt=new Date().toISOString();writeLocal();
      setSaveStatus('Saved to your account');
    }catch(error){console.warn('Bedroom server save failed; local copy kept.',error);setSaveStatus('Saved on this device');}
  }
  function setSaveStatus(text){
    const el=overlay?.querySelector('[data-bedroom-save]'); if(!el)return;
    el.textContent=text; clearTimeout(el._timer); el._timer=setTimeout(()=>{if(el.isConnected)el.textContent='Room changes save automatically';},2400);
  }

  function ensureLauncher(){
    const sidebar=document.querySelector('#dragonboundOverlay .dragonbound-home-sidebar');
    if(!sidebar)return false;
    let button=sidebar.querySelector('.velmora-bedroom-launcher');
    // V33.03 intentionally uses an image element instead of a <button>; older global button hover
    // rules could paint a brown rectangle behind the transparent artwork.
    if(button&&button.tagName!=='IMG'){button.remove();button=null;}
    if(!button){
      button=document.createElement('img');
      button.className='velmora-bedroom-launcher';button.src=`${ROOT}ui/my_bedroom_button.png?v=${VERSION}`;button.alt='My Bedroom';
      button.setAttribute('role','button');button.setAttribute('tabindex','0');button.setAttribute('aria-label','Open My Bedroom');button.draggable=false;
      sidebar.appendChild(button);
    }
    if(button.dataset.boundBedroom!=='1'){
      button.dataset.boundBedroom='1';
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openBedroom();});
      button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openBedroom();}});
    }
    launcher=button;return true;
  }

  function ensureTransitionVeil(){
    if(transitionVeil?.isConnected)return transitionVeil;
    transitionVeil=document.createElement('div');transitionVeil.className='velmora-bedroom-transition';transitionVeil.setAttribute('aria-hidden','true');document.body.appendChild(transitionVeil);return transitionVeil;
  }
  function playBedroomDoor(){
    try{
      if(!doorAudio){doorAudio=new Audio(`${DOOR_AUDIO}?v=${VERSION}`);doorAudio.preload='auto';}
      doorAudio.pause();doorAudio.currentTime=0;doorAudio.volume=.75;doorAudio.play()?.catch?.(()=>{});
    }catch(_){ }
  }


  function ensureOverlay(){
    if(overlay?.isConnected)return;
    const root=document.body;
    overlay=document.createElement('div');overlay.className='velmora-bedroom-overlay';overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=`
      <div class="velmora-bedroom-backdrop" aria-hidden="true"></div>
      <section class="velmora-bedroom-app" role="dialog" aria-modal="true" aria-labelledby="velmoraBedroomTitle">
        <header class="velmora-bedroom-topbar">
          <div class="velmora-bedroom-brand"><small>MY BEDROOM</small><h2 id="velmoraBedroomTitle" data-bedroom-room-name-top>Nordic Timber</h2><span data-bedroom-owner>Your private space</span></div>
          <div class="velmora-bedroom-actions">
            <button type="button" class="velmora-bedroom-action" data-bedroom-rooms><span>▧</span><b>Change Room</b><small>4 free designs</small></button>
            <button type="button" class="velmora-bedroom-action velmora-bedroom-action--shop" data-bedroom-shop><span>✦</span><b>Furniture</b><small>Everything is free</small></button>
            <button type="button" class="velmora-bedroom-action velmora-bedroom-action--edit" data-bedroom-edit><span>◇</span><b>Edit Room</b><small>Drag to rearrange</small></button>
            <button type="button" class="velmora-bedroom-action velmora-bedroom-action--home" data-bedroom-home><span>⌂</span><b>Main House</b><small>Return home</small></button>
            <button type="button" class="velmora-bedroom-close" data-bedroom-close aria-label="Close bedroom and return home">×</button>
          </div>
        </header>
        <div class="velmora-bedroom-main">
          <div class="velmora-bedroom-stage-wrap">
            <div class="velmora-bedroom-stage" data-bedroom-stage>
              <img class="velmora-bedroom-room" data-bedroom-room alt="">
              <div class="velmora-bedroom-placements" data-bedroom-placements></div>
              <div class="velmora-bedroom-player" data-bedroom-player aria-hidden="true"><img alt=""></div>
              <div class="velmora-bedroom-interaction-hint" data-bedroom-interaction-hint hidden></div>
              <div class="velmora-bedroom-placement-ghost" data-bedroom-ghost hidden><img alt=""></div>
              <div class="velmora-bedroom-room-plaque"><small>YOUR ROOM</small><strong data-bedroom-room-name>Nordic Timber</strong><span data-bedroom-mode>Relaxed mode</span></div>
            </div>
          </div>
          <footer class="velmora-bedroom-footer">
            <div><b data-bedroom-footer-title>Your own little corner of Velmora.</b><span data-bedroom-footer-copy>Furniture here belongs to your character, not your Dragonbound dragon.</span></div>
            <span data-bedroom-save>Room changes save automatically</span>
          </footer>
        </div>
        <aside class="velmora-bedroom-drawer" data-bedroom-shop-panel aria-hidden="true">
          <header><div><small>BEDROOM FURNITURE</small><h3>Free Furniture Shop</h3><p>Take whatever suits your room. No Keeper Marks or GP required.</p></div><button type="button" data-bedroom-shop-close aria-label="Close furniture shop">×</button></header>
          <div class="velmora-bedroom-shop-controls"><label><span>⌕</span><input type="search" data-bedroom-search placeholder="Search bedroom furniture…"></label><nav data-bedroom-categories></nav></div>
          <div class="velmora-bedroom-shop-grid" data-bedroom-shop-grid></div>
          <footer><span>Pet nests, feeding and scratching pieces are reserved for the future bedroom cat/dog system.</span><b>FREE</b></footer>
        </aside>
        <aside class="velmora-bedroom-drawer velmora-bedroom-room-drawer" data-bedroom-room-panel aria-hidden="true">
          <header><div><small>ROOM DESIGN</small><h3>Choose your bedroom</h3><p>All four room designs are free and can be changed whenever you like.</p></div><button type="button" data-bedroom-room-close aria-label="Close room designs">×</button></header>
          <div class="velmora-bedroom-room-grid" data-bedroom-room-grid></div>
        </aside>
        <div class="velmora-bedroom-editbar" data-bedroom-editbar aria-hidden="true">
          <div><small>EDIT ROOM</small><strong data-bedroom-edit-name>Select furniture to edit it</strong><span data-bedroom-edit-help>Drag to move · mouse wheel resizes · R flips · changes save automatically</span></div>
          <div class="velmora-bedroom-editbar-actions"><button type="button" data-bedroom-flip disabled>R · Flip</button><button type="button" data-bedroom-store disabled>Put Away</button><button type="button" data-bedroom-done>Done Editing</button></div>
        </div>
        <div class="velmora-bedroom-toast" data-bedroom-toast aria-live="polite"></div>
      </section>`;
    root.appendChild(overlay);
    stage=overlay.querySelector('[data-bedroom-stage]');roomImg=overlay.querySelector('[data-bedroom-room]');placementLayer=overlay.querySelector('[data-bedroom-placements]');playerEl=overlay.querySelector('[data-bedroom-player]');interactionHintEl=overlay.querySelector('[data-bedroom-interaction-hint]');shopPanel=overlay.querySelector('[data-bedroom-shop-panel]');roomPanel=overlay.querySelector('[data-bedroom-room-panel]');

    overlay.querySelector('[data-bedroom-close]').addEventListener('click',returnToMainHouse);
    overlay.querySelector('[data-bedroom-home]').addEventListener('click',returnToMainHouse);
    overlay.querySelector('.velmora-bedroom-backdrop').addEventListener('click',returnToMainHouse);
    overlay.querySelector('[data-bedroom-shop]').addEventListener('click',()=>toggleShop(true));
    overlay.querySelector('[data-bedroom-shop-close]').addEventListener('click',()=>toggleShop(false));
    overlay.querySelector('[data-bedroom-rooms]').addEventListener('click',()=>toggleRooms(true));
    overlay.querySelector('[data-bedroom-room-close]').addEventListener('click',()=>toggleRooms(false));
    overlay.querySelector('[data-bedroom-edit]').addEventListener('click',()=>setEditMode(!editMode));
    overlay.querySelector('[data-bedroom-done]').addEventListener('click',()=>setEditMode(false));
    overlay.querySelector('[data-bedroom-flip]').addEventListener('click',flipSelected);
    overlay.querySelector('[data-bedroom-store]').addEventListener('click',storeSelected);
    overlay.querySelector('[data-bedroom-search]').addEventListener('input',event=>{shopQuery=String(event.target.value||'').trim().toLowerCase();renderShop();});
    stage.addEventListener('pointerdown',onStagePointerDown);
    stage.addEventListener('contextmenu',onStageContextMenu);
    stage.addEventListener('wheel',onStageWheel,{passive:false});
    window.addEventListener('pointermove',onWindowPointerMove,{passive:false});
    window.addEventListener('pointerup',onWindowPointerUp,{passive:false});
    window.addEventListener('pointercancel',onWindowPointerUp,{passive:false});
    window.addEventListener('keydown',onKeyDown);
    window.addEventListener('keyup',onKeyUp);
    renderCategories();renderRoomChoices();renderShop();
  }

  async function openBedroom(){
    if(open||transitioning)return;
    transitioning=true;
    ensureTransitionVeil();playBedroomDoor();
    transitionVeil.classList.add('is-active');
    // Begin loading immediately while the black fade covers the scene change.
    const loading=(async()=>{ensureOverlay();await loadState();renderAll();})();
    await wait(360);await loading;
    open=true;
    startLoop();
    overlay.classList.add('is-visible');overlay.setAttribute('aria-hidden','false');document.body.classList.add('velmora-bedroom-open');
    const owner=currentUsername();overlay.querySelector('[data-bedroom-owner]').textContent=owner==='guest'?'Your private space':`${owner}'s private space`;
    preloadKeeperFrames(keeperIdForUser(owner));
    document.querySelectorAll('.dragonbound-command-menu.is-visible,.dragonbound-command-overlay.is-visible').forEach(el=>el.classList.remove('is-visible'));
    await wait(110);
    transitionVeil.classList.remove('is-active');
    await wait(460);
    transitioning=false;
  }

  function closeBedroom(){
    if(!overlay)return;
    open=false;toggleShop(false);toggleRooms(false);setEditMode(false);placingItemId='';drag=null;selectedId='';sleepingPlacementId='';if(state.player)state.player.pose='idle';
    overlay.classList.remove('is-visible');overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('velmora-bedroom-open');stopLoop();queueSave();
  }
  async function returnToMainHouse(){
    if(!open||transitioning)return;
    transitioning=true;
    ensureTransitionVeil();
    transitionVeil.classList.add('is-active');
    await wait(340);
    closeBedroom();
    await wait(90);
    transitionVeil.classList.remove('is-active');
    await wait(430);
    transitioning=false;
  }

  function toggleShop(show){if(!shopPanel)return;if(show){toggleRooms(false);shopPanel.classList.add('is-visible');shopPanel.setAttribute('aria-hidden','false');renderShop();}else{shopPanel.classList.remove('is-visible');shopPanel.setAttribute('aria-hidden','true');}}
  function toggleRooms(show){if(!roomPanel)return;if(show){toggleShop(false);roomPanel.classList.add('is-visible');roomPanel.setAttribute('aria-hidden','false');renderRoomChoices();}else{roomPanel.classList.remove('is-visible');roomPanel.setAttribute('aria-hidden','true');}}

  function clampPlacementsToRoom(){
    let changed=false;
    for(const p of state.placements){
      const item=ITEM_BY_ID.get(p.assetId);if(!item)continue;
      const fixed=constrainPlacement(p.x,p.y,item,p.scale||1);
      if(Math.abs(fixed.x-p.x)>.0001||Math.abs(fixed.y-p.y)>.0001){p.x=fixed.x;p.y=fixed.y;changed=true;}
    }
    if(changed)queueSave();
  }
  function renderAll(){
    clampPlacementsToRoom();
    const room=roomById(state.roomId);roomImg.src=`${room.src}?v=${VERSION}`;roomImg.alt=`${room.name} bedroom`;overlay.querySelector('[data-bedroom-room-name]').textContent=room.name;const topName=overlay.querySelector('[data-bedroom-room-name-top]');if(topName)topName.textContent=room.name;renderPlacements();renderRoomChoices();renderEditState();renderPlayer();
  }
  function renderPlacements(){
    if(!placementLayer)return;placementLayer.innerHTML='';
    const ordered=[...state.placements].sort((a,b)=>{
      const ia=ITEM_BY_ID.get(a.assetId),ib=ITEM_BY_ID.get(b.assetId);if(ia?.rug&&!ib?.rug)return -1;if(!ia?.rug&&ib?.rug)return 1;return a.y-b.y;
    });
    for(const p of ordered){
      const item=ITEM_BY_ID.get(p.assetId);if(!item)continue;
      // Use a neutral div instead of <button>. Site-wide button:hover rules were still
      // painting a brown rectangle behind transparent furniture in Edit Room.
      const furniture=document.createElement('div');furniture.className='velmora-bedroom-placement';furniture.dataset.placementId=p.id;furniture.style.left=`${p.x*100}%`;furniture.style.top=`${p.y*100}%`;furniture.style.zIndex=String(item.rug?20:100+Math.round(p.y*1000));furniture.style.setProperty('--item-width',`${item.width}%`);furniture.style.setProperty('--item-scale',String(p.scale||1));furniture.classList.toggle('is-flipped',!!p.flipped);furniture.classList.toggle('is-selected',editMode&&selectedId===p.id);furniture.setAttribute('role','button');furniture.setAttribute('aria-label',`${item.name}${editMode?' — drag to move':''}`);furniture.tabIndex=editMode?0:-1;
      furniture.innerHTML=`<img src="${item.src}?v=${VERSION}" alt="${esc(item.name)}"><span class="velmora-bedroom-placement-ring"></span>`;
      placementLayer.appendChild(furniture);
    }
  }
  function renderCategories(){
    const nav=overlay?.querySelector('[data-bedroom-categories]');if(!nav)return;
    nav.innerHTML=CATEGORIES.map(cat=>`<button type="button" data-bedroom-category="${esc(cat)}" class="${shopCategory===cat?'is-active':''}">${esc(cat)}</button>`).join('');
    nav.querySelectorAll('[data-bedroom-category]').forEach(btn=>btn.addEventListener('click',()=>{shopCategory=btn.dataset.bedroomCategory||'All';renderCategories();renderShop();}));
  }
  function renderShop(){
    const grid=overlay?.querySelector('[data-bedroom-shop-grid]');if(!grid)return;
    const filtered=ITEMS.filter(item=>(shopCategory==='All'||item.category===shopCategory)&&(!shopQuery||`${item.name} ${item.category}`.toLowerCase().includes(shopQuery)));
    grid.innerHTML=filtered.map(item=>`<article class="velmora-bedroom-shop-card ${item.futurePet?'is-future-pet':''}" data-bedroom-place="${esc(item.id)}" role="button" tabindex="0" aria-label="Place ${esc(item.name)}"><div class="velmora-bedroom-shop-image"><img src="${item.src}?v=${VERSION}" alt="${esc(item.name)}"></div><div class="velmora-bedroom-shop-card-copy"><small>${esc(item.category)}</small><strong>${esc(item.name)}</strong><span>${item.futurePet?'For your future bedroom cat/dog':'Character bedroom furnishing'}</span></div><div class="velmora-bedroom-shop-place"><b>Place in room</b><small>FREE</small></div></article>`).join('')||'<div class="velmora-bedroom-empty">No furniture matches that search.</div>';
    grid.querySelectorAll('[data-bedroom-place]').forEach(card=>{
      const place=()=>beginPlacement(card.dataset.bedroomPlace);
      card.addEventListener('click',place);
      card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();place();}});
    });
  }

  function renderRoomChoices(){
    const grid=overlay?.querySelector('[data-bedroom-room-grid]');if(!grid)return;
    grid.innerHTML=ROOMS.map(room=>`<button type="button" data-bedroom-room-id="${room.id}" class="velmora-bedroom-room-card ${state.roomId===room.id?'is-active':''}"><img src="${room.src}?v=${VERSION}" alt="${esc(room.name)}"><span><small>${state.roomId===room.id?'CURRENT ROOM':'FREE ROOM'}</small><strong>${esc(room.name)}</strong><em>${esc(room.copy)}</em></span></button>`).join('');
    grid.querySelectorAll('[data-bedroom-room-id]').forEach(btn=>btn.addEventListener('click',()=>selectRoom(btn.dataset.bedroomRoomId)));
  }
  function selectRoom(id){if(!ROOM_IDS.has(id))return;state.roomId=id;queueSave();renderAll();toggleRooms(false);notify(`${roomById(id).name} is now your bedroom.`);}

  function setEditMode(value){
    editMode=!!value;if(!editMode){drag=null;selectedId='';placingItemId='';hideGhost();}else{interactionTargetId='';if(state.player?.pose==='sleep'){state.player.pose='idle';sleepingPlacementId='';}}
    overlay?.classList.toggle('is-editing',editMode);overlay?.querySelector('[data-bedroom-editbar]')?.setAttribute('aria-hidden',editMode?'false':'true');
    const btn=overlay?.querySelector('[data-bedroom-edit]');if(btn){btn.classList.toggle('is-active',editMode);btn.querySelector('b').textContent=editMode?'Editing Room':'Edit Room';btn.querySelector('small').textContent=editMode?'Click Done when finished':'Drag to rearrange';}
    renderPlacements();renderEditState();
  }
  function renderEditState(){
    const selected=state.placements.find(p=>p.id===selectedId);const item=selected&&ITEM_BY_ID.get(selected.assetId);
    const name=overlay?.querySelector('[data-bedroom-edit-name]');const flip=overlay?.querySelector('[data-bedroom-flip]');const store=overlay?.querySelector('[data-bedroom-store]');const mode=overlay?.querySelector('[data-bedroom-mode]');
    if(name)name.textContent=item?`${item.name} · ${Math.round((selected?.scale||1)*100)}%`:'Select furniture to edit it';if(flip)flip.disabled=!item;if(store)store.disabled=!item;if(mode)mode.textContent=placingItemId?'Placing new furniture':editMode?'Edit Room active':'Relaxed mode';
  }
  function beginPlacement(itemId){
    const item=ITEM_BY_ID.get(itemId);if(!item)return;placingItemId=item.id;selectedId='';setEditMode(true);toggleShop(false);showGhost(item,.50,item.wall?.565:.70,true,1,false);notify(`Move your pointer around the room and click to place ${item.name}.`);
  }
  function stagePoint(event){
    const r=stage.getBoundingClientRect();return {x:clamp((event.clientX-r.left)/r.width,0,1),y:clamp((event.clientY-r.top)/r.height,0,1)};
  }
  function placementValid(candidate,item,scale=1){return !!item&&floorValid(candidate.x,candidate.y,item,scale);
  }
  function showGhost(item,x,y,force=false,scaleOverride=1,flippedOverride=false){
    const ghost=overlay?.querySelector('[data-bedroom-ghost]');if(!ghost||!item)return;
    const visualScale=clamp(scaleOverride||1,.5,1.85);
    const p=constrainPlacement(x,y,item,visualScale),valid=p.valid;
    ghost.hidden=false;ghost.style.left=`${p.x*100}%`;ghost.style.top=`${p.y*100}%`;ghost.style.zIndex=String(item.rug?21:110+Math.round(p.y*1000));ghost.style.setProperty('--item-width',`${item.width}%`);ghost.style.setProperty('--item-scale',String(visualScale));ghost.classList.toggle('is-valid',valid);ghost.classList.toggle('is-invalid',!valid);ghost.dataset.valid=valid?'1':'0';ghost.dataset.x=String(p.x);ghost.dataset.y=String(p.y);ghost.dataset.scale=String(visualScale);const img=ghost.querySelector('img');const src=`${item.src}?v=${VERSION}`;if(img.getAttribute('src')!==src)img.src=src;img.alt=item.name;ghost.classList.toggle('is-flipped',!!flippedOverride);if(force)renderEditState();
  }
  function hideGhost(){const ghost=overlay?.querySelector('[data-bedroom-ghost]');if(ghost){ghost.hidden=true;ghost.classList.remove('is-valid','is-invalid','is-flipped');ghost.dataset.valid='0';}}

  function onStagePointerDown(event){
    if(!open||event.button!==0)return;
    const placementEl=event.target.closest?.('.velmora-bedroom-placement')||event.composedPath?.().find?.(node=>node?.classList?.contains?.('velmora-bedroom-placement'));
    if(placingItemId){event.preventDefault();const item=ITEM_BY_ID.get(placingItemId);const point=stagePoint(event);showGhost(item,point.x,point.y,false,1,false);commitGhostPlacement(item);return;}
    if(!editMode)return;
    if(placementEl){
      event.preventDefault();event.stopPropagation();const id=placementEl.dataset.placementId;const p=state.placements.find(x=>x.id===id);if(!p)return;selectedId=id;drag={placementId:id,startX:event.clientX,startY:event.clientY,originX:p.x,originY:p.y,flipped:!!p.flipped,scale:p.scale||1,moved:false,pointerId:event.pointerId};try{stage.setPointerCapture(event.pointerId)}catch(_){ }renderPlacements();renderEditState();return;
    }
    selectedId='';renderPlacements();renderEditState();
  }
  function onWindowPointerMove(event){
    if(!open)return;
    if(placingItemId){const item=ITEM_BY_ID.get(placingItemId);if(item){const point=stagePoint(event);showGhost(item,point.x,point.y,false,1,false);}return;}
    if(!drag)return;
    if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<5&&!drag.moved)return;
    drag.moved=true;event.preventDefault();const p=state.placements.find(x=>x.id===drag.placementId);const item=p&&ITEM_BY_ID.get(p.assetId);if(!p||!item)return;const point=stagePoint(event);showGhost(item,point.x,point.y,false,p.scale||1,p.flipped);
  }
  function onStageWheel(event){
    if(!open||!editMode||placingItemId)return;
    const hovered=event.target.closest?.('.velmora-bedroom-placement')||event.composedPath?.().find?.(node=>node?.classList?.contains?.('velmora-bedroom-placement'));
    if(hovered?.dataset?.placementId)selectedId=hovered.dataset.placementId;
    const p=state.placements.find(x=>x.id===selectedId);if(!p)return;
    const item=ITEM_BY_ID.get(p.assetId);if(!item)return;
    event.preventDefault();event.stopPropagation();
    const direction=event.deltaY<0?1:-1;
    const next=clamp(Math.round(((p.scale||1)+direction*.05)*20)/20,.5,1.85);
    if(Math.abs(next-(p.scale||1))<.001)return;
    p.scale=next;
    const fixed=constrainPlacement(p.x,p.y,item,p.scale);
    p.x=fixed.x;p.y=fixed.y;
    queueSave();renderPlacements();renderEditState();setSaveStatus(`Furniture resized · ${Math.round(p.scale*100)}%`);
  }

  function onWindowPointerUp(event){
    if(!drag)return;const p=state.placements.find(x=>x.id===drag.placementId);const item=p&&ITEM_BY_ID.get(p.assetId);const ghost=overlay?.querySelector('[data-bedroom-ghost]');
    if(drag.moved&&p&&item&&ghost?.dataset.valid==='1'){
      p.x=Number(ghost.dataset.x);p.y=Number(ghost.dataset.y);queueSave();setSaveStatus('Furniture moved');
    }
    drag=null;hideGhost();renderPlacements();renderEditState();try{stage.releasePointerCapture(event.pointerId)}catch(_){ }
  }
  function commitGhostPlacement(item){
    const ghost=overlay?.querySelector('[data-bedroom-ghost]');if(!ghost||ghost.dataset.valid!=='1'){notify('That spot is blocked. Try another part of the room.','warn');return false;}
    const p={id:uid(),assetId:item.id,x:Number(ghost.dataset.x),y:Number(ghost.dataset.y),flipped:false,scale:1};state.placements.push(p);placingItemId='';selectedId=p.id;hideGhost();queueSave();renderPlacements();renderEditState();notify(`${item.name} placed.`);return true;
  }
  function flipSelected(){const p=state.placements.find(x=>x.id===selectedId);if(!p)return;p.flipped=!p.flipped;queueSave();renderPlacements();renderEditState();setSaveStatus('Furniture flipped');}
  function storeSelected(){const idx=state.placements.findIndex(x=>x.id===selectedId);if(idx<0)return;const item=ITEM_BY_ID.get(state.placements[idx].assetId);state.placements.splice(idx,1);selectedId='';queueSave();renderPlacements();renderEditState();notify(`${item?.name||'Furniture'} returned to the free shop.`);}
  function onStageContextMenu(event){
    if(!open||!editMode)return;
    const placementEl=event.target.closest?.('.velmora-bedroom-placement')||event.composedPath?.().find?.(node=>node?.classList?.contains?.('velmora-bedroom-placement'));
    if(!placementEl)return;
    event.preventDefault();event.stopPropagation();
    selectedId=placementEl.dataset.placementId||'';
    renderPlacements();renderEditState();
    storeSelected();
  }
  function notify(message,tone=''){const el=overlay?.querySelector('[data-bedroom-toast]');if(!el)return;el.textContent=message;el.dataset.tone=tone;el.classList.add('is-visible');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('is-visible'),2600);}

  function onKeyDown(event){
    if(!open)return;const tag=document.activeElement?.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
    const key=String(event.key||'').toLowerCase();
    if(key==='w'||key==='arrowup'){keys.up=true; if(!editMode)event.preventDefault();}
    if(key==='s'||key==='arrowdown'){keys.down=true; if(!editMode)event.preventDefault();}
    if(key==='a'||key==='arrowleft'){keys.left=true; if(!editMode)event.preventDefault();}
    if(key==='d'||key==='arrowright'){keys.right=true; if(!editMode)event.preventDefault();}
    if(!editMode&&(key==='e')){event.preventDefault();interactNearby();return;}
    if(editMode&&selectedId&&key==='r'){event.preventDefault();flipSelected();return;}
    if(event.key==='Escape'){
      if(placingItemId){placingItemId='';hideGhost();renderEditState();event.preventDefault();return;}
      if(shopPanel?.classList.contains('is-visible')){toggleShop(false);event.preventDefault();return;}
      if(roomPanel?.classList.contains('is-visible')){toggleRooms(false);event.preventDefault();return;}
      if(editMode){setEditMode(false);event.preventDefault();return;}
      returnToMainHouse();event.preventDefault();
    }
  }

  function onKeyUp(event){
    const key=String(event.key||'').toLowerCase();
    if(key==='w'||key==='arrowup')keys.up=false;
    if(key==='s'||key==='arrowdown')keys.down=false;
    if(key==='a'||key==='arrowleft')keys.left=false;
    if(key==='d'||key==='arrowright')keys.right=false;
    writeLocal();
  }

  function constrainPlayer(x,y){
    // Movement must stay continuous. V33.05 reused the furniture 0.5% snapper here,
    // which rounded away almost every animation-frame movement and trapped the player
    // near the entrance. Clamp only; never grid-snap a moving character.
    let cy=clamp(Number(y)||.83,.525,.925);
    const [left,right]=floorBoundsAtY(cy);
    const margin=.012;
    const cx=clamp(Number(x)||.50,left+margin,right-margin);
    return {x:cx,y:cy};
  }
  function nearestPlacement(){
    if(!state.placements.length)return null;
    const player=state.player||defaultPlayerForUser(currentUsername());
    let best=null, bestDist=999;
    for(const p of state.placements){
      const d=Math.hypot((p.x-player.x)*1.05,(p.y-player.y)*1.45);
      if(d<bestDist){bestDist=d;best=p;}
    }
    if(!best||bestDist>.12)return null;
    return {placement:best,item:ITEM_BY_ID.get(best.assetId),distance:bestDist};
  }
  function updateInteractionHint(){
    if(!interactionHintEl)return;
    if(editMode||placingItemId||state.player?.pose!=='idle'||actionTimer>Date.now()){interactionHintEl.hidden=true;interactionTargetId='';return;}
    const near=nearestPlacement();
    if(!near||!near.item){interactionHintEl.hidden=true;interactionTargetId='';return;}
    interactionTargetId=near.placement.id;
    interactionHintEl.hidden=false;
    interactionHintEl.textContent=`E · Interact with ${near.item.name}`;
    interactionHintEl.style.left=`${near.placement.x*100}%`;
    interactionHintEl.style.top=`${(near.placement.y-0.12)*100}%`;
  }
  function interactNearby(){
    if(editMode||placingItemId||actionTimer>Date.now())return;
    const near=nearestPlacement();
    if(!near||!near.item){notify('Move closer to a piece of furniture to interact with it.');return;}
    const item=near.item; const p=near.placement;
    const name=item.name.toLowerCase();
    actionTimer=Date.now()+600;
    if(name.includes('bed')){
      // Beds are isometric and run from the foot at bottom-left toward the pillow at
      // top-right (mirrored when the furniture is flipped). Put the sleeping sprite
      // on the mattress centre rather than at the floor anchor in front of the bed.
      sleepingPlacementId=p.id;
      state.player.pose='sleep';
      keys={up:false,down:false,left:false,right:false};
      if(interactionHintEl){interactionHintEl.hidden=true;interactionTargetId='';}
      renderPlayer();
      notify('You settle into bed.');
      setTimeout(()=>{
        if(state.player?.pose==='sleep'&&sleepingPlacementId===p.id){state.player.pose='idle';sleepingPlacementId='';state.player.x=p.x;state.player.y=clamp(p.y+.035,.56,.91);state.player.dir=p.flipped?'right':'left';renderPlayer();}
      },3200);
      return;
    }
    if(name.includes('chair')||name.includes('stool')){notify(`You take a seat by the ${item.name}.`);return;}
    if(name.includes('desk')||name.includes('table')||name.includes('vanity')){notify(`You spend a moment at the ${item.name}.`);return;}
    if(name.includes('wardrobe')||name.includes('trunk')||name.includes('bookshelf')){notify(`You check the ${item.name}.`);return;}
    if(name.includes('lamp')){notify(`You admire the warm light from the ${item.name}.`);return;}
    notify(`You interact with the ${item.name}.`);
  }
  function playerCell(){
    const player=state.player||defaultPlayerForUser(currentUsername());
    if(player.pose==='sleep')return {row:4,col:playerFrame%4,flip:false};
    const moving = (keys.up||keys.down||keys.left||keys.right) && !editMode && !placingItemId;
    const dir = player.dir||'down';
    if(moving){
      if(dir==='down')return {row:1,col:playerFrame%4,flip:false};
      if(dir==='up')return {row:2,col:playerFrame%4,flip:false};
      if(dir==='left')return {row:3,col:playerFrame%4,flip:true};
      return {row:3,col:playerFrame%4,flip:false};
    }
    if(dir==='down')return {row:0,col:0,flip:false};
    if(dir==='left')return {row:0,col:3,flip:false};
    if(dir==='up')return {row:0,col:2,flip:false};
    return {row:0,col:1,flip:false};
  }
  function renderPlayer(){
    if(!playerEl)return;
    const player=state.player||defaultPlayerForUser(currentUsername());
    const sheet=keeperSheetById(player.sheetId);
    const cell=playerCell();
    const img=playerEl.querySelector('img');
    let renderX=player.x, renderY=player.y, sleepAngle=0;
    if(player.pose==='sleep'&&sleepingPlacementId){
      const bed=state.placements.find(p=>p.id===sleepingPlacementId);
      if(bed){
        const scale=clamp(bed.scale||1,.5,1.85);
        renderX=clamp(bed.x+(bed.flipped?-0.010:0.010)*scale,.08,.92);
        renderY=clamp(bed.y-0.125*scale,.46,.90);
        sleepAngle=bed.flipped?45:135;
      }
    }
    playerEl.style.left=`${renderX*100}%`;
    playerEl.style.top=`${renderY*100}%`;
    // Keep the keeper above bedroom furniture. The previous y-only depth test let tall
    // furniture cover the character even when they were visibly standing in front.
    playerEl.style.zIndex=player.pose==='sleep'?'8200':'8000';
    playerEl.style.setProperty('--bedroom-sleep-angle',`${sleepAngle}deg`);
    playerEl.classList.toggle('is-flipped',!!cell.flip&&player.pose!=='sleep');
    playerEl.classList.toggle('is-sleeping',player.pose==='sleep');
    if(img){
      const src=keeperFrameSrc(sheet.id,cell.row,cell.col);
      if(img.getAttribute('src')!==src)img.src=src;
      img.alt='';
    }
  }
  function tick(ts){
    if(!open){raf=0;return;}
    if(!lastTick)lastTick=ts;
    const dt=Math.min(.05,(ts-lastTick)/1000); lastTick=ts;
    const player=state.player||defaultPlayerForUser(currentUsername());
    let dx=0,dy=0;
    if(!editMode&&!placingItemId&&player.pose!=='sleep'){
      if(keys.up)dy-=1; if(keys.down)dy+=1; if(keys.left)dx-=1; if(keys.right)dx+=1;
      const moving = dx||dy;
      if(moving){
        const len=Math.hypot(dx,dy)||1; dx/=len; dy/=len;
        if(Math.abs(dx)>Math.abs(dy))player.dir=dx<0?'left':'right'; else player.dir=dy<0?'up':'down';
        const speed=.22;
        const next=constrainPlayer(player.x+dx*speed*dt, player.y+dy*speed*dt);
        player.x=next.x; player.y=next.y;
        playerFrameTimer += dt;
        if(playerFrameTimer>.12){playerFrame=(playerFrame+1)%4;playerFrameTimer=0;}
      }else{playerFrame=0; playerFrameTimer=0;}
    }
    renderPlayer(); updateInteractionHint();
    raf=requestAnimationFrame(tick);
  }
  function startLoop(){ if(!raf){ lastTick=0; raf=requestAnimationFrame(tick);} }
  function stopLoop(){ if(raf)cancelAnimationFrame(raf); raf=0; lastTick=0; keys={up:false,down:false,left:false,right:false}; interactionTargetId=''; if(interactionHintEl)interactionHintEl.hidden=true; }

  // Attach when Dragonbound's dynamically-built home sidebar exists.
  const attach=()=>{ensureLauncher();ensureTransitionVeil();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
  const observer=new MutationObserver(()=>{if(!launcher?.isConnected)ensureLauncher();});observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('dragonbound:home-ready',attach);

  window.VelmoraBedroom={open:openBedroom,close:returnToMainHouse,state:()=>JSON.parse(JSON.stringify(state)),rooms:ROOMS.map(r=>({...r})),items:ITEMS.map(i=>({...i})),keepers:KEEPER_SHEETS.map(k=>({...k})),resetLocal:()=>{try{localStorage.removeItem(storageKey())}catch(_){}}};
})();
