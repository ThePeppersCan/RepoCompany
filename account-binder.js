(() => {
 'use strict';
 const service=window.repoAccount;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clean=v=>String(v||'').trim().toLowerCase().replaceAll('-','_');
 const slabId=s=>String(s.slab_id||s.id||'');
 const owner=()=>String(service.state.character?.username||'').toLowerCase();
 const read=key=>{try{return JSON.parse(localStorage.getItem(key));}catch{return null;}};
 let catalog=null,catalogRequest=null,host=null,active=null,accountId='',sessions={};
 const button=(action,label,extra='')=>`<button class="account-soft-button" data-book-action="${action}" ${extra}>${label}</button>`;
 const inspector=document.createElement('dialog');inspector.id='binder-inspector';inspector.className='account-detail binder-inspector';inspector.setAttribute('aria-labelledby','binder-inspector-title');document.body.append(inspector);
 let inspectOpener=null;
 inspector.addEventListener('close',()=>inspectOpener?.isConnected&&inspectOpener.focus());
 async function getCatalog(){
  if(catalog)return catalog;
  if(!catalogRequest)catalogRequest=fetch('dashboard-card-catalog.json').then(r=>{if(!r.ok)throw Error('Card artwork could not load. Please try again.');return r.json();}).then(rows=>catalog=Object.fromEntries(rows.map(c=>[c.id,c]))).finally(()=>catalogRequest=null);
  return catalogRequest;
 }
 function resetAccount(){
  if(accountId===service.state.user?.id)return;
  accountId=service.state.user?.id||'';sessions={};active=null;if(inspector.open)inspector.close();
 }
 function newSession(mode){return {mode,user:accountId,owner:owner(),loading:true,ready:false,error:'',warning:'',page:0,query:'',rarity:'all',storage:false,selected:null,layout:[],stored:[],items:[],count:0,busy:false,unsaved:false,message:''};}
 function normalize(raw,length,valid){const used=new Set();return Array.from({length},(_,i)=>{const id=raw?.[i];if(typeof id!=='string'||!valid.has(id)||used.has(id))return null;used.add(id);return id;});}
 async function load(s,{refresh=false}={}){
  s.loading=true;s.error='';draw();
  try{
   if(refresh)await service.refresh();
   await getCatalog();
   if(s.mode==='slabs'){
    const row=await service.rpc('get_my_rcg_slab_binder_view');
    if(!row||!Array.isArray(row.slabs)||!Array.isArray(row.layout))throw Error('Your slab binder could not be loaded. Your saved arrangement has not been changed.');
    s.items=row.slabs.filter(x=>slabId(x)).map(x=>({id:slabId(x),cardId:clean(x.card_id),slab:x,count:1}));s.count=s.items.length;s.capacity=270;s.perSpread=18;
    s.layout=normalize(row.layout,s.capacity,new Set(s.items.map(x=>x.id)));
   }else{
    // The original TCG binder's browser layout is authoritative. Do not replace it with its public snapshot.
    if(service.state.collectionError)throw Error('Your collection is incomplete. Refresh Inventory before editing your binder.');
    const counts=new Map();for(const raw of service.state.cards){const id=clean(raw);if(id)counts.set(id,(counts.get(id)||0)+1);}
    s.items=[...counts].map(([id,count])=>({id,cardId:id,count}));s.count=service.state.cards.length;s.perSpread=24;
    s.capacity=Math.max(8,Math.ceil(Object.keys(catalog).length/24),Math.ceil(s.items.length/24))*24;
    let layout=read(`repo_tcg_binder_54_layout_${s.owner}`),storage=read(`repo_tcg_binder_storage_${s.owner}`);
    if(!Array.isArray(layout)&&!Array.isArray(storage)){
     try{const row=await service.rpc('get_public_quidditch_tcg_binder_layout',{p_username:service.state.character.username});layout=row?.layout;storage=row?.storage;}
     catch{ s.warning='An existing layout could not be checked. Retry loading before rearranging cards.';s.readOnly=true; }
    }
    const valid=new Set(s.items.map(x=>x.id));s.stored=[...new Set((Array.isArray(storage)?storage:[]).map(clean).filter(x=>valid.has(x)))];
    s.layout=normalize((Array.isArray(layout)?layout:[]).map(clean),s.capacity,new Set([...valid].filter(x=>!s.stored.includes(x))));
    for(const id of valid)if(!s.stored.includes(id)&&!s.layout.includes(id)){const i=s.layout.indexOf(null);if(i>=0)s.layout[i]=id;}
   }
   s.ready=true;s.unsaved=false;s.message='';
  }catch(e){s.error=e.message;s.ready=false;}
  finally{s.loading=false;if(s===active&&s.user===accountId)draw();}
 }
 function item(id){return active?.items.find(x=>x.id===id);}
 function meta(entry){return catalog?.[entry?.cardId]||{name:entry?.cardId?.replaceAll('_',' ')||'Card',rarity:'Unknown',image:''};}
 function artwork(entry){
  const c=meta(entry),art=c.image?`<img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" decoding="async" draggable="false">`:'<span class="binder-missing">Artwork unavailable</span>';
  if(!entry.slab)return `<span class="binder-card-art">${art}</span>`;
  const s=entry.slab;
  return `<span class="binder-slab"><span class="binder-slab-label"><span><b>${esc(c.name)}</b><small>${esc(s.card_variant||s.card_set||'REPO COMPANY GRADING')}</small></span><strong>RCG <em>${esc(s.grade??'—')}</em></strong></span><span class="binder-card-art">${art}</span><span class="binder-cert">${esc(s.certification_number||'Certification unavailable')}</span></span>`;
 }
 function hiddenItems(s){const displayed=new Set(s.layout.filter(Boolean));return s.items.filter(x=>!displayed.has(x.id));}
 function matches(entry){const c=meta(entry),q=active.query.toLowerCase();return (!q||`${c.name} ${entry.cardId} ${entry.slab?.certification_number||''} ${entry.slab?.grade||''}`.toLowerCase().includes(q))&&(active.rarity==='all'||c.rarity===active.rarity);}
 function cardTile(entry,index,storage=false){
  const c=meta(entry),s=active,selected=s.selected===entry.id;
  return `<div class="binder-pocket ${entry.slab?'is-slab':''}${selected?' is-selected':''}" ${index!==null?`data-book-slot="${index}"`:''}>
   <button class="binder-art-button" data-book-inspect="${esc(entry.id)}" draggable="${!s.busy&&!s.readOnly}" data-book-drag="${esc(entry.id)}" aria-label="Inspect ${esc(c.name)}${entry.slab?' · RCG '+esc(entry.slab.grade):''}">${artwork(entry)}</button>
   <div class="binder-card-caption"><b>${esc(c.name)}</b><small>${entry.slab?'RCG '+esc(entry.slab.grade):entry.count>1?entry.count+' copies':esc(c.rarity.replaceAll('_',' '))}</small></div>
   <div class="binder-pocket-actions">${storage?button('restore','Restore',`data-id="${esc(entry.id)}" ${s.busy||s.readOnly?'disabled':''}`):button('select',selected?'Cancel move':'Move',`data-id="${esc(entry.id)}" aria-pressed="${selected}" ${s.busy||s.readOnly?'disabled':''}`)+button('hide','Hide',`data-id="${esc(entry.id)}" ${s.busy||s.readOnly?'disabled':''}`)}</div>
  </div>`;
 }
 function drawResults(){
  const s=active;if(!host?.isConnected||!s?.ready)return;
  const filtered=!!s.query||s.rarity!=='all',hidden=hiddenItems(s),results=host.querySelector('.binder-results');
  if(s.storage||filtered){
   const entries=(s.storage?hidden:s.items.filter(x=>s.layout.includes(x.id))).filter(matches);
   results.innerHTML=`<p class="binder-results-summary">${entries.length} ${s.storage?'stored':'matching'} ${s.mode==='slabs'?'slabs':'cards'}</p><div class="binder-search-grid">${entries.map(x=>cardTile(x,s.storage?null:s.layout.indexOf(x.id),s.storage)).join('')}</div>${!entries.length?'<p class="account-live-status">Nothing here. Try another search or switch views.</p>':''}`;
  }else{
   const start=s.page*s.perSpread,half=s.perSpread/2;
   results.innerHTML=`<div class="binder-book ${s.mode==='slabs'?'binder-book-slabs':''}">${[0,1].map(side=>`<section class="binder-paper" aria-label="Page ${s.page*2+side+1}"><div class="binder-page-grid">${Array.from({length:half},(_,i)=>{const index=start+side*half+i,id=s.layout[index],entry=item(id);return entry?cardTile(entry,index):`<button class="binder-empty" data-book-action="place" data-book-slot="${index}" aria-label="${s.selected?'Move selected card to':'Empty'} slot ${index+1}" ${!s.selected||s.busy||s.readOnly?'disabled':''}><span>${String(index+1).padStart(2,'0')}</span>${s.selected?'<small>Place here</small>':''}</button>`;}).join('')}</div><span class="binder-page-number">${s.page*2+side+1}</span></section>`).join('')}</div>`;
  }
  host.querySelector('.binder-pagination').hidden=s.storage||filtered;
 }
 function draw(){
  const s=active;if(!host?.isConnected||!s||s.user!==accountId)return;
  if(s.loading){host.innerHTML='<p class="account-live-status" role="status">Loading your saved binder…</p>';return;}
  if(s.error){host.innerHTML=`<p class="account-live-status is-error" role="alert">${esc(s.error)}</p>${button('reload','Try again')}`;return;}
  const hidden=hiddenItems(s),pages=s.capacity/s.perSpread;
  const rarities=[...new Set(s.items.map(x=>meta(x).rarity))].sort();
  host.innerHTML=`<div class="binder-toolbar"><div class="binder-view-switch" role="group" aria-label="Binder view">${button('displayed','Displayed · '+s.layout.filter(Boolean).length,`aria-pressed="${!s.storage}"`)}${button('storage','Storage · '+hidden.length,`aria-pressed="${s.storage}"`)}</div><div class="binder-search"><label>Search<input type="search" data-book-search placeholder="Name${s.mode==='slabs'?' or certificate':''}" value="${esc(s.query)}"></label><label>Rarity<select data-book-rarity><option value="all">All rarities</option>${rarities.map(r=>`<option value="${esc(r)}" ${s.rarity===r?'selected':''}>${esc(r.replaceAll('_',' '))}</option>`).join('')}</select></label></div></div>
   <div class="binder-summary"><span>${s.count} ${s.mode==='slabs'?'graded slabs':`cards · ${s.items.length} unique`} · ${hidden.length} in storage</span><div>${hidden.length?button('restore-all','Restore all',s.busy||s.readOnly?'disabled':''):''}${button('reload','Refresh',s.busy||s.unsaved?'disabled':'')}</div></div>
   ${s.warning?`<p role="alert" class="account-live-status">${esc(s.warning)}</p>`:''}
   <div class="binder-save-status" role="status">${esc(s.busy?'Saving your arrangement…':s.message||'')}${s.unsaved&&!s.busy?button('save','Retry save'):''}</div>
   ${s.selected?`<div class="binder-move-bar" role="status"><span>Moving <b>${esc(meta(item(s.selected)).name)}</b>. Choose an empty pocket or another card to swap. You can change pages.</span>${button('cancel','Cancel move')}</div>`:''}
   <div class="binder-results"></div>
   <nav class="binder-pagination" aria-label="Binder pages">${button('prev','← Previous',s.page===0?'disabled':'')}<label>Spread <select data-book-page aria-label="Choose binder spread">${Array.from({length:pages},(_,i)=>`<option value="${i}" ${s.page===i?'selected':''}>${i+1} / ${pages}</option>`).join('')}</select></label>${button('next','Next →',s.page>=pages-1?'disabled':'')}</nav>
   <p class="binder-help">Select a card to inspect it. Use Move, or drag cards between pockets. Stored cards remain in your collection.</p>`;
  drawResults();
 }
 async function persist(s){
  if(s.busy||s.readOnly||s.user!==service.state.user?.id)return;
  s.busy=true;s.unsaved=true;s.message='';draw();
  try{
   if(s.mode==='slabs')await service.rpc('set_my_rcg_slab_binder_layout',{p_layout:[...s.layout]});
   else{
    // Keep the exact legacy keys so returning to the original tools preserves this arrangement.
    localStorage.setItem(`repo_tcg_binder_54_layout_${s.owner}`,JSON.stringify(s.layout));
    localStorage.setItem(`repo_tcg_binder_storage_${s.owner}`,JSON.stringify(s.stored));
    await service.rpc('set_my_quidditch_tcg_binder_layout',{p_username:s.owner,p_layout:[...s.layout],p_storage:[...s.stored]});
   }
   s.unsaved=false;s.message='Arrangement saved.';
  }catch(e){s.message=`Could not confirm the save: ${e.message} Your changes are still shown. Retry save before leaving.`;}
  finally{s.busy=false;if(s===active&&s.user===accountId)draw();}
 }
 function change(fn){const s=active;if(!s?.ready||s.busy||s.readOnly)return;fn(s);s.selected=null;persist(s);}
 function move(id,index){
  const s=active;if(!item(id)||index<0||index>=s.capacity)return;
  change(s=>{const from=s.layout.indexOf(id),other=s.layout[index];if(from>=0)s.layout[from]=other;else if(other&&s.mode!=='slabs')s.stored.push(other);s.layout[index]=id;s.stored=s.stored.filter(x=>x!==id);});
 }
 function inspect(id){
  const entry=item(id);if(!entry)return;
  if(active.selected){move(active.selected,active.layout.indexOf(id));return;}
  const c=meta(entry);inspectOpener=document.activeElement;
  inspector.innerHTML=`<button class="account-detail-close" data-inspector-close aria-label="Close card details">×</button><div class="binder-inspector-art">${artwork(entry)}</div><h2 id="binder-inspector-title">${esc(c.name)}</h2><p>${esc(c.rarity.replaceAll('_',' '))}${entry.slab?' · RCG '+esc(entry.slab.grade):' · '+entry.count+(entry.count===1?' card':' copies')}</p>${entry.slab?`<p>Certificate: ${esc(entry.slab.certification_number||'Unavailable')}</p>`:''}`;
  inspector.querySelector('[data-inspector-close]').onclick=()=>inspector.close();inspector.showModal();
 }
 function bind(){
  host.onclick=e=>{
   const b=e.target.closest('button');if(!b||b.disabled)return;
   if(b.dataset.bookInspect)return inspect(b.dataset.bookInspect);
   const action=b.dataset.bookAction,s=active;if(!s)return;
   if(action==='reload'){if(!s.unsaved&&!s.busy){s.readOnly=false;s.warning='';load(s,{refresh:true});}return;}
   if(action==='save')return persist(s);
   if(action==='prev'||action==='next'){s.page=Math.max(0,Math.min(s.capacity/s.perSpread-1,s.page+(action==='next'?1:-1)));draw();return;}
   if(action==='displayed'||action==='storage'){s.storage=action==='storage';s.selected=null;draw();return;}
   if(action==='select'){s.selected=s.selected===b.dataset.id?null:b.dataset.id;draw();return;}
   if(action==='cancel'){s.selected=null;draw();return;}
   if(action==='place')return move(s.selected,Number(b.dataset.bookSlot));
   if(action==='hide')return change(s=>{s.layout=s.layout.map(id=>id===b.dataset.id?null:id);if(s.mode!=='slabs'&&!s.stored.includes(b.dataset.id))s.stored.push(b.dataset.id);});
   if(action==='restore'||action==='restore-all'){
    const entries=action==='restore'?hiddenItems(s).filter(x=>x.id===b.dataset.id):hiddenItems(s);
    if(!s.layout.includes(null)){s.message='Your binder is full. Store a card to make room.';draw();return;}
    change(s=>{for(const x of entries){const index=s.layout.indexOf(null);if(index<0)break;s.layout[index]=x.id;s.stored=s.stored.filter(id=>id!==x.id);}});
   }
  };
  host.oninput=e=>{if(e.target.matches('[data-book-search]')){active.query=e.target.value;drawResults();}};
  host.onchange=e=>{if(e.target.matches('[data-book-rarity]')){active.rarity=e.target.value;drawResults();}if(e.target.matches('[data-book-page]')){active.page=Number(e.target.value);draw();}};
  host.ondragstart=e=>{const b=e.target.closest('[data-book-drag]');if(!b||active.busy||active.readOnly){e.preventDefault();return;}e.dataTransfer.setData('text/plain',b.dataset.bookDrag);e.dataTransfer.effectAllowed='move';};
  host.ondragover=e=>{if(e.target.closest('[data-book-slot]')&&!active.busy&&!active.readOnly)e.preventDefault();};
  host.ondrop=e=>{const slot=e.target.closest('[data-book-slot]');if(!slot)return;e.preventDefault();move(e.dataTransfer.getData('text/plain'),Number(slot.dataset.bookSlot));};
 }
 function mount(node,mode){
  resetAccount();host=node;active=sessions[mode]||(sessions[mode]=newSession(mode));bind();
  if(!active.ready&&!active.error&&!active.started){active.started=true;load(active);}else draw();
 }
 function open(mode='binder'){
  const tab=mode==='slabs'?'slabs':'binder';
  if(!service.state.user){window.accountMenu.open({tab});window.accountMenu.login(()=>open(mode));return;}
  window.accountMenu.open({tab});
 }
 function invalidate(){for(const [key,s] of Object.entries(sessions))if(!s.busy&&!s.unsaved)delete sessions[key];}
 addEventListener('repo-account-state',()=>{resetAccount();});
 addEventListener('beforeunload',e=>{if(Object.values(sessions).some(s=>s.busy||s.unsaved)){e.preventDefault();e.returnValue='';}});
 window.repoBinder=Object.freeze({open,mount,invalidate});
})();
