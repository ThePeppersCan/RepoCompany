(() => {
 'use strict';
 const preview=!['repocompany.uk','www.repocompany.uk','repocompany.pages.dev'].includes(location.hostname);
 const service=window.repoAccount,audio=window.dashboardAudio,root=document.getElementById('dashboard'),state=service.state;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n||0).toLocaleString('en-GB');
 const tabs=['profile','friends','inventory','achievements','shop','settings'];
 const labels={profile:'Profile',friends:'Friends',inventory:'Inventory',achievements:'Achievements',shop:'Shop',settings:'Settings'};
 const games=[{id:'moratales',name:'Moratales',image:'moratales-town.png',genre:'Story & life sim'},{id:'manager',name:'Velmora Manager',image:'manager-central.png',genre:'Fantasy sports management'},{id:'morogue',name:'Morogue',image:'morogue-uncrowned.png',genre:'Action roguelite'}];
 const gameName=id=>games.find(g=>g.id===id)?.name||window.demoLibrary?.games.find(g=>g.id===id)?.name||'';
 const dialog=document.createElement('dialog');dialog.id='account-menu';dialog.className='account-dashboard';dialog.setAttribute('aria-labelledby','account-heading');
 dialog.innerHTML=`<div class="account-atmosphere" aria-hidden="true">${Array.from({length:26},(_,i)=>`<i style="--x:${(i*37+8)%100}%;--y:${(i*19+3)%100}%;--delay:-${i*2.3}s"></i>`).join('')}</div><header class="account-header"><button class="account-back" aria-label="Back to collection"><span class="brand" aria-hidden="true"></span></button><h1 id="account-heading" class="visually-hidden">Account</h1><nav class="account-tabs" role="tablist" aria-label="Account sections">${tabs.map(t=>`<button role="tab" id="account-tab-${t}" data-tab="${t}" aria-controls="account-content">${labels[t]}</button>`).join('')}<button class="account-binder-tab" data-binder="binder">Binder</button></nav><div class="account-header-end"><span class="account-wallet"></span><button class="account-audio" aria-label="Mute audio"><svg viewBox="0 0 30 26" aria-hidden="true"><path d="M3 9h5l7-6v20l-7-6H3Z"/><path class="account-waves" d="M20 7q7 6 0 12M24 3q11 10 0 20"/></svg></button></div></header><section class="account-content" id="account-content" role="tabpanel" tabindex="0"></section><footer class="account-footer"><span>Repo Company · Your account and collection</span><button class="account-return"><kbd>Esc</kbd> Back to collection</button></footer>`;document.body.append(dialog);
 const detail=document.createElement('dialog');detail.id='account-detail';detail.className='account-detail';detail.setAttribute('aria-labelledby','account-detail-title');document.body.append(detail);
 const content=dialog.querySelector('#account-content');let current='profile',opener,detailOpener,origin='#collection',priorTitle='',filter='all',catalog={},catalogLoaded=false,detailBusy=false,authContinuation=null;
 let achievementGame='';
 let viewedName='',viewedPlayer=null,profileRequest=0,profileUser=null;
 const username=()=>state.character?.username||'';
 const name=()=>state.social?.profile?.display_name||username();
 const score=()=>state.social?.profile?.repo_score;
 const heading=(eyebrow,title,copy='')=>`<div class="account-section-heading"><p class="account-eyebrow">${eyebrow}</p><h2>${esc(title)}</h2><p class="account-subtitle">${esc(copy)}</p></div>`;
 const status=(text,bad=false)=>`<p role="status" class="account-live-status${bad?' is-error':''}">${esc(text)}</p>`;
 const button=(attr,label)=>`<button class="account-soft-button" ${attr}>${label}</button>`;
 const binderButtons=()=>`<div class="account-binder-actions">${button('data-binder="binder"','Open Binder →')}${button('data-binder="slabs"','Slab binder →')}</div>`;
 function signedOut(){return `${heading('YOUR REPO COMPANY ACCOUNT','Every adventure, together.','Sign in with your existing username to see your cards, slabs, Repoints and friends.')}<div class="account-signin-actions">${button('data-login','Sign in →')}${button('data-register','Create account')}</div><div class="account-profile-top"><div><h3>Your collection stays yours.</h3><p class="account-subtitle">The same card binder. The same slab archive. Your existing balance, now called Repoints.</p></div><div class="account-avatar-space"><div class="account-avatar-ring" aria-hidden="true"><span>R</span></div></div></div>`;}
 function profileView(){return viewedName?window.repoProfile.player({player:viewedPlayer,games}):window.repoProfile.render({state,games});}
 function inventoryView(){
  const qty=Number(state.bank?.items?.quidditch_tcg_pack||0),counts=new Map();for(const id of state.cards)counts.set(id,(counts.get(id)||0)+1);
  return `${heading('YOUR COLLECTION','Inventory','Your owned packs and trading cards.')}<div class="account-row-heading"><span>${fmt(state.cards.length)} cards · ${fmt(state.slabs.length)} graded slabs</span>${binderButtons()}</div>${state.collectionError?status(state.collectionError,true):''}<div class="account-owned-pack"><img src="account-assets/standard-pack.png" alt="Original TCG Pack"><div><h3>Original TCG Pack</h3><p>${fmt(qty)} unopened</p>${qty?button('data-binder="pack"','Open a pack →'):button('data-tab="shop"','Visit Shop →')}</div></div><div class="account-row-heading"><h3>Your cards</h3><span>${counts.size} unique cards</span></div>${counts.size?`<div class="account-owned-cards">${[...counts].map(([id,n])=>{const c=catalog[id];return `<button data-card="${esc(id)}">${c?`<img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy">`:'<span class="account-card-placeholder">TCG</span>'}<b>${esc(c?.name||id)}</b><small>${n>1?n+' copies':'1 card'}</small></button>`;}).join('')}</div>`:status('Your cards will appear here when you open a pack.')}<p class="account-section-note">Open Binder to browse your collections and saved card arrangements, or go straight to your graded slabs.</p>`;
 }
 function achievementsView(){return window.repoProfile.achievements({state,games});}
 function shopView(){return `${heading('REPO COMPANY STORE','The original collection.','One pack. One new card for your collection.')}<div class="account-shop-grid"><article class="account-shop-pack"><p class="account-pack-series">THE ORIGINAL COLLECTION</p><button class="account-pack-art" data-pack><span class="account-pack-glow"></span><img src="account-assets/standard-pack.png" alt="Original TCG Pack"></button><div class="account-pack-copy"><h3>Original TCG Pack</h3><p>Original series · 1 card</p><div><span>${fmt(window.repoDashboardConfig.packPrice)} Repoints<small>Your balance: ${state.bank?fmt(state.bank.gp):'—'}</small></span>${button('data-pack','View pack →')}</div></div></article></div><p class="account-section-note">Only the original pack is for sale. Your existing balance and the original pack price are unchanged: 1 GP = 1 Repoint.</p>`;}
 function friendsView(){return window.repoProfile.hub({state,games,filter});}
 function settingsView(){const p=audio.preferences();return `${heading('MAKE YOURSELF AT HOME','Settings','Keep the dashboard comfortable for you.')}<div class="account-settings-layout"><div><h3 class="account-settings-label">Audio</h3><div class="account-settings-row"><div><b>Sound</b><p>Mute or unmute the dashboard.</p></div><button class="account-switch" data-mute role="switch" aria-checked="${!p.muted}" aria-label="Dashboard sound"><span></span></button></div>${[['music','Background music'],['effects','Interface sounds'],['disc','Disc sound']].map(([key,label])=>`<label class="account-settings-row account-range"><span><b>${label}</b></span><span class="account-range-control"><input type="range" min="0" max="100" step="5" value="${Math.round(p[key]*100)}" data-mix="${key}" aria-label="${label}"><output>${Math.round(p[key]*100)}%</output></span></label>`).join('')}<div class="account-settings-row"><div><b>Reduced motion</b><p>Follows your device’s accessibility preference.</p></div><span>System</span></div><div class="account-settings-row"><div><b>Private profile</b><p>Only accepted friends can see your avatar, RepoScore and game activity. Pending requests do not grant access.</p></div><button class="account-switch" data-private-profile role="switch" aria-checked="${!!state.social?.profile?.private_profile}" aria-label="Private profile"><span></span></button></div><div class="account-settings-row"><div><b>Appear offline</b><p>Hide your online status and current game from friends.</p></div><button class="account-switch" data-invisible role="switch" aria-checked="${!!state.social?.profile?.invisible}" aria-label="Appear offline"><span></span></button></div></div><aside class="account-settings-aside"><p class="account-eyebrow">PROFILE</p><h3>${esc(name())}</h3>${button('data-edit-profile','Edit profile →')}${button('data-edit-avatar',state.social?.profile?.avatar?'Edit avatar →':'Create avatar →')}${binderButtons()}<p class="account-section-note">Browse the achievement catalogue from the Achievements tab.</p>${button('data-signout','Sign out')}</aside></div>`;}
 const views={profile:profileView,friends:friendsView,inventory:inventoryView,achievements:achievementsView,shop:shopView,settings:settingsView};
 async function loadCatalog(){if(catalogLoaded)return;catalogLoaded=true;try{const r=await fetch('dashboard-card-catalog.json');if(!r.ok)throw Error();const rows=await r.json();catalog=Object.fromEntries(rows.map(c=>[c.id,c]));if(current==='inventory'&&dialog.open)render(current,{route:false});}catch{catalogLoaded=false;}}
 function render(tab=current,{route=true,focus=false}={}){
  if(route){achievementGame='';viewedName='';viewedPlayer=null;profileRequest++;}
  if(tab==='progress')tab='achievements';
  current=tabs.includes(tab)?tab:'profile';dialog.dataset.accountTab=current;
  dialog.querySelectorAll('[data-tab][role="tab"]').forEach(b=>{const on=b.dataset.tab===current;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
  content.setAttribute('aria-labelledby','account-tab-'+current);
  if(current==='achievements')window.repoAchievements.mount(content,{state,games,game:achievementGame,navigate:openAchievements,showDetail});
  else content.innerHTML=!state.ready?status('Loading your account…'):state.user?(state.error?status(state.error,true)+button('data-refresh','Try again'):views[current]()):signedOut();
  window.repoAvatar?.hydrate(content);
  dialog.querySelector('.account-wallet').textContent=state.user?`${state.bank?fmt(state.bank.gp):'—'} Repoints`:'Guest';
  if(state.user&&current==='inventory')loadCatalog();
  if(route){content.scrollTop=0;if(dialog.open)history.replaceState({scene:'account',returnHash:origin},'','#account/'+current+(current==='achievements'&&achievementGame?'/'+achievementGame:''));}
  if(focus){const b=dialog.querySelector('#account-tab-'+current);b.focus({preventScroll:true});b.scrollIntoView({block:'nearest',inline:'nearest'});}
  document.title='Repo Company — Account / '+labels[current];
 }
 function alignAccountHeader(){
  const brand=root.querySelector('.brand').getBoundingClientRect();
  const scale=brand.width/143;
  dialog.style.setProperty('--account-scale',scale);
  dialog.style.setProperty('--account-logo-left',brand.left+'px');
  // The collection can be vertically letterboxed; keep Account navigation in its header.
  dialog.style.setProperty('--account-logo-top',Math.min(brand.top,36*scale)+'px');
  dialog.style.setProperty('--account-logo-right',brand.right+'px');
  dialog.style.setProperty('--account-glow',root.style.getPropertyValue('--game-glow')||'125,155,113');
 }
 addEventListener('resize',()=>requestAnimationFrame(alignAccountHeader));
 function open({tab='profile',player='',game='',route=true,origin:from}={}){
  if(root.dataset.launching)return;
  achievementGame=['moratales','manager','morogue'].includes(game)?game:'';
  if(!dialog.open){opener=document.activeElement;priorTitle=document.title;origin=from||(location.hash.startsWith('#account')?'#collection':location.hash||'#collection');root.dispatchEvent(new Event('account-opening'));audio.spin(false);dialog.showModal();root.inert=true;document.body.classList.add('account-is-open');if(route)history.pushState({scene:'account',returnHash:origin},'','#account/'+tab);}
  const target=tab==='profile'&&/^[a-zA-Z0-9_-]{3,16}$/.test(player)&&player.toLowerCase()!==username().toLowerCase()?player.toLowerCase():'';
  if(viewedName!==target){viewedName=target;viewedPlayer=null;profileRequest++;}
  alignAccountHeader();render(tab,{route:false});if(viewedName)loadPlayer();dialog.querySelector('.account-back').focus({preventScroll:true});
 }
 function close({route=true}={}){if(!dialog.open||detailBusy||window.repoPack?.busy||window.repoAvatarStudio?.busy)return;if(document.getElementById('avatar-creator')?.open)document.getElementById('avatar-creator').close();if(detail.open)detail.close();dialog.close();root.inert=!!document.getElementById('demo-library')?.open;document.body.classList.remove('account-is-open');if(route){history.pushState({scene:'collection'},'','#collection');dispatchEvent(new PopStateEvent('popstate'));}}
 function showDetail(html){detailOpener=document.activeElement;detail.innerHTML=`<button class="account-detail-close" aria-label="Close details">×</button>${html}`;window.repoAvatar?.hydrate(detail);if(!detail.open)detail.showModal();detail.querySelector('.account-detail-close').onclick=()=>{if(!detailBusy)detail.close();};}
 detail.addEventListener('cancel',e=>{if(detailBusy)e.preventDefault();});detail.addEventListener('close',()=>detailOpener?.focus({preventScroll:true}));
 function login(after=null,create=false){authContinuation=after;showDetail(`<form class="account-profile-form" id="account-login-form"><p class="account-eyebrow">YOUR REPO COMPANY ACCOUNT</p><h2 id="account-detail-title">${create?'Create your account.':'Welcome back.'}</h2><label>Username<input name="username" required minlength="3" maxlength="16" pattern="(?:[A-Za-z0-9_]|-){3,16}" autocomplete="username"></label><label>Password<input name="password" type="password" required minlength="8" autocomplete="${create?'new-password':'current-password'}"></label><p class="account-detail-note">${create?'Use 3–16 letters, numbers, _ or -.':'Use your existing Repo Company username and password.'}</p><p role="status" id="auth-feedback"></p><button type="submit" class="account-primary">${create?'Create account':'Sign in'}</button></form>`);detail.querySelector('form').onsubmit=async e=>{e.preventDefault();if(detailBusy)return;detailBusy=true;const b=e.currentTarget.querySelector('[type="submit"]');b.disabled=true;detail.querySelector('#auth-feedback').textContent='Connecting…';const data=new FormData(e.currentTarget);try{await service.signIn(String(data.get('username')).trim(),String(data.get('password')),create);detailBusy=false;detail.close();const next=authContinuation;authContinuation=null;next?.();}catch(error){detail.querySelector('#auth-feedback').textContent=error.message;}finally{detailBusy=false;b.disabled=false;}};}
 function editProfile(){if(!state.social){showMessage('Profile unavailable','Reload your account to try again.');return;}showDetail(`<form class="account-profile-form" id="account-profile-form"><p class="account-eyebrow">YOUR PROFILE</p><h2 id="account-detail-title">A name that’s yours.</h2><label>Display name<input name="name" maxlength="24" value="${esc(name())}" required></label><label>Profile line<textarea name="bio" maxlength="100">${esc(state.social.profile.bio)}</textarea></label><p class="account-detail-note">Your login username stays ${esc(username())}.</p><p role="status" id="profile-feedback"></p><button class="account-primary">Save profile</button></form>`);detail.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);detailBusy=true;try{await service.setProfile({displayName:String(f.get('name')),bio:String(f.get('bio')),invisible:!!state.social.profile.invisible});detailBusy=false;detail.close();}catch(error){detail.querySelector('#profile-feedback').textContent=error.message;}finally{detailBusy=false;}};}
 function showMessage(title,text){showDetail(`<div class="account-achievement-detail"><h2 id="account-detail-title">${esc(title)}</h2><p>${esc(text)}</p></div>`);}
 function packDetail(){showDetail(`<div class="account-pack-detail"><img src="account-assets/standard-pack.png" alt="Original TCG Pack"><div><p class="account-eyebrow">THE ORIGINAL COLLECTION</p><h2 id="account-detail-title">Original TCG Pack</h2><p>One card in every pack. Standard cards have duplicate protection; special rarities can appear more than once.</p><dl><div><dt>Price</dt><dd>${fmt(window.repoDashboardConfig.packPrice)} Repoints</dd></div><div><dt>Your balance</dt><dd>${state.bank?fmt(state.bank.gp):'—'} Repoints</dd></div></dl><p class="account-detail-note">This purchase uses your Repoints and adds a pack to your Inventory.</p><p id="purchase-feedback" role="status"></p><button class="account-primary" id="buy-original-pack" ${!state.bank||Number(state.bank.gp)<window.repoDashboardConfig.packPrice?'disabled':''}>Buy for ${fmt(window.repoDashboardConfig.packPrice)} Repoints</button></div></div>`);detail.querySelector('#buy-original-pack').onclick=async e=>{if(detailBusy)return;detailBusy=true;e.currentTarget.disabled=true;const feedback=detail.querySelector('#purchase-feedback');feedback.textContent='Purchasing…';try{await service.buyPack();feedback.textContent='Pack added to your Inventory.';e.target.textContent='Purchased';}catch(error){feedback.textContent=error.message+' Refresh Inventory before retrying.';}finally{detailBusy=false;}};}
 async function friendAction(action,player){await service.api('friends',{action,username:player});await service.refreshSocial();}
 function addFriend(){showDetail(`<form class="account-profile-form" id="friend-search"><p class="account-eyebrow">ADD A FRIEND</p><h2 id="account-detail-title">Find your people.</h2><label>Exact username<input name="username" required minlength="3" maxlength="16" pattern="(?:[A-Za-z0-9_]|-){3,16}" autocomplete="off" placeholder="Player username"></label><button class="account-primary">Find player</button><div id="friend-results" role="status"></div></form>`);detail.querySelector('form').onsubmit=async e=>{e.preventDefault();const result=detail.querySelector('#friend-results');result.textContent='Searching…';try{const value=String(new FormData(e.currentTarget).get('username')).trim();const data=await service.api('search?username='+encodeURIComponent(value));result.innerHTML=data.players.length?data.players.map(p=>`<p><button type="button" data-search-profile="${esc(p.username)}">${esc(p.username)} →</button></p>${button(`type="button" data-send-request="${esc(p.username)}"`,'Send friend request')}`).join(''):'No player found with that username.';result.querySelector('[data-search-profile]')?.addEventListener('click',e=>friendProfile(e.currentTarget.dataset.searchProfile));result.querySelector('[data-send-request]')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;try{await friendAction('request',e.currentTarget.dataset.sendRequest);result.textContent='Friend request sent.';}catch(error){result.textContent=error.message;}});}catch(error){result.textContent=error.message;}};}
 async function loadPlayer(){
  if(!viewedName||!state.user)return;
  const target=viewedName,userId=state.user.id,ticket=++profileRequest;profileUser=userId;
  let result;try{result=await service.api('profile?username='+encodeURIComponent(target));}catch(error){result={error:error.message};}
  if(ticket!==profileRequest||viewedName!==target||state.user?.id!==userId||!dialog.open)return;
  viewedPlayer=result;render('profile',{route:false});
 }
 function friendProfile(player){
  if(!/^[a-zA-Z0-9_-]{3,16}$/.test(player))return;
  if(detail.open)detail.close();
  history.pushState({scene:'account',returnHash:origin},'','#account/profile/'+encodeURIComponent(player.toLowerCase()));
  open({tab:'profile',player,route:false});content.scrollTop=0;content.focus({preventScroll:true});
 }
 function confirmFriend(action,player){showDetail(`<div class="account-achievement-detail"><h2 id="account-detail-title">${action==='block'?'Block':'Remove'} ${esc(player)}?</h2><p>${action==='block'?'This removes the friendship and prevents further friend requests between you.':'They will be removed from your Friends list.'}</p><p id="friend-action-feedback" role="status"></p><button class="account-primary" id="confirm-friend-action">${action==='block'?'Block player':'Remove friend'}</button></div>`);detail.querySelector('#confirm-friend-action').onclick=async e=>{e.currentTarget.disabled=true;try{await friendAction(action,player);detail.close();}catch(error){detail.querySelector('#friend-action-feedback').textContent=error.message;e.target.disabled=false;}};}
 dialog.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;try{
  if(b.matches('.account-back,.account-return'))return close();if(b.dataset.tab)return render(b.dataset.tab,{focus:b.hasAttribute('role')});
  if(b.hasAttribute('data-login'))return login();if(b.hasAttribute('data-register'))return login(null,true);
  if(b.dataset.binder)return window.repoLegacy.open(b.dataset.binder);
  if(b.hasAttribute('data-refresh'))return service.refresh();if(b.hasAttribute('data-edit-avatar'))return await window.repoAvatarStudio.open();if(b.hasAttribute('data-edit-profile'))return editProfile();
  if(b.hasAttribute('data-signout')){b.disabled=true;return await service.signOut();}
  if(b.hasAttribute('data-pack'))return packDetail();if(b.hasAttribute('data-add-friend'))return addFriend();
  if(b.dataset.filter){filter=b.dataset.filter;return render();}
  if(b.dataset.friendAction){b.disabled=true;return await friendAction(b.dataset.friendAction,b.dataset.player);}
  if(b.dataset.friendProfile)return friendProfile(b.dataset.friendProfile);
  if(b.hasAttribute('data-retry-profile'))return loadPlayer();
  if(b.dataset.removeFriend)return confirmFriend('remove',b.dataset.removeFriend);
  if(b.dataset.blockPlayer)return confirmFriend('block',b.dataset.blockPlayer);
  if(b.hasAttribute('data-private-profile')){if(!state.social)throw Error('Your profile is not available. Try again.');b.disabled=true;await service.api('privacy',{privateProfile:!state.social.profile.private_profile});return await service.refreshSocial();}
  if(b.dataset.card){const c=catalog[b.dataset.card];if(c)return showDetail(`<div class="account-card-detail"><img src="${esc(c.image)}" alt="${esc(c.name)}"><h2 id="account-detail-title">${esc(c.name)}</h2><p>${esc(c.rarity)}</p>${button('id="detail-binder"','Open Binder →')}</div>`),detail.querySelector('#detail-binder').onclick=()=>{detail.close();window.repoLegacy.open('binder');};return;}
  if(b.dataset.game){close({route:false});history.pushState({},'',games.some(g=>g.id===b.dataset.game)?'#'+b.dataset.game:'#demos');dispatchEvent(new PopStateEvent('popstate'));if(!games.some(g=>g.id===b.dataset.game))window.demoLibrary.open({route:false,gameId:b.dataset.game});return;}
  if(b.matches('.account-audio')||b.hasAttribute('data-mute'))return document.querySelector('[data-audio]').click();
  if(b.hasAttribute('data-invisible')){if(!state.social)throw Error('Your profile is not available. Try again.');b.disabled=true;await service.setProfile({displayName:name(),bio:state.social.profile.bio,invisible:!state.social.profile.invisible});}
 }catch(error){showMessage('Could not complete that action',error.message);b.disabled=false;}});
 dialog.addEventListener('input',e=>{if(e.target.dataset.mix){audio.setMix(e.target.dataset.mix,Number(e.target.value)/100);e.target.nextElementSibling.textContent=e.target.value+'%';}});
 dialog.querySelector('.account-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();render(tabs[e.key==='Home'?0:e.key==='End'?tabs.length-1:(tabs.indexOf(current)+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length],{focus:true});});
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 const mute=document.querySelector('[data-audio]');function syncMute(){const on=mute.getAttribute('aria-pressed')==='true';dialog.querySelector('.account-audio').setAttribute('aria-label',on?'Unmute audio':'Mute audio');dialog.querySelector('.account-waves').style.opacity=on?0:1;dialog.querySelector('[data-mute]')?.setAttribute('aria-checked',String(!on));}
 new MutationObserver(syncMute).observe(mute,{attributes:true,attributeFilter:['aria-pressed']});syncMute();
 addEventListener('repo-achievement-state',()=>{if(dialog.open&&current==='profile'&&!viewedName)render(current,{route:false});});
 addEventListener('repo-account-state',()=>{if(profileUser!==state.user?.id){viewedPlayer=null;profileRequest++;profileUser=state.user?.id;}if(dialog.open){render(current,{route:false});if(viewedName)loadPlayer();}});
 function openAchievements(game=''){
  const returnHash=dialog.open?origin:location.hash||'#collection';
  const target=['moratales','manager','morogue'].includes(game)?game:'';
  if(detail.open)detail.close();
  history.pushState({scene:'account',returnHash},'','#account/achievements'+(target?'/'+target:''));
  open({tab:'achievements',game:target,route:false,origin:returnHash});content.scrollTop=0;content.focus({preventScroll:true});
 }
 document.addEventListener('click',event=>{const button=event.target.closest('[data-open-achievements]');if(button)openAchievements(button.dataset.openAchievements);});
 window.accountMenu=Object.freeze({open,close,login,openAchievements});
})();
