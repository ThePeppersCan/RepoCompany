(() => {
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n||0).toLocaleString('en-GB');
 const model=window.achievementModel,revealed=new Set();
 let catalogue,pending,failed=false,host,context,selected='',query='',category='all',sort='default',revealAll=false;
 const lock='<svg viewBox="0 0 32 36" aria-hidden="true"><rect x="5" y="15" width="22" height="17" rx="1"/><path d="M10 15V9a6 6 0 0 1 12 0v6M16 21v5"/></svg>';
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){loadBadge(entry.target);observer.unobserve(entry.target);}}),{root:document.getElementById('account-content'),rootMargin:'400px'});
 function loadBadge(el){el.style.backgroundImage=`url("${el.dataset.sheet}")`;}
 function badge(a,shown,large=false){
  if(!shown)return `<span class="ach-badge ach-secret-badge${large?' ach-badge-large':''}" aria-hidden="true">${lock}</span>`;
  const t=a.art;
  return `<span class="ach-badge${large?' ach-badge-large':''}" aria-hidden="true" data-sheet="${esc(t.sheet)}" style="background-size:${t.sheetWidth/t.width*100}% ${t.sheetHeight/t.height*100}%;background-position:${t.x/(t.sheetWidth-t.width)*100}% ${t.y/(t.sheetHeight-t.height)*100}%"></span>`;
 }
 function artwork(g){
  const logo=g.id==='manager'?'<svg class="profile-banner-logo" viewBox="57 178 2073 432"><image width="2167" height="725" href="original-case-assets/manager-logo-clean.png"/></svg>':`<img class="profile-banner-logo" src="original-case-assets/${g.id}-logo.png" alt="">`;
  return `<span class="profile-game-banner banner-${g.id}" aria-hidden="true"><img class="profile-banner-art" src="account-assets/${g.id}-activity-banner-v1.png" alt="">${logo}</span>`;
 }
 function currentGame(){return catalogue.games.find(g=>g.id===selected);}
 function visible(a){return model.visible(a,revealAll,revealed);}
 function notice(){return '<p class="ach-tracking-note"><span aria-hidden="true">◇</span> Catalogue available. Unlock tracking, RepoScore awards and global completion percentages are coming soon.</p>';}
 function load(){
  if(pending||catalogue)return;
  pending=fetch('/assets/achievements/catalogue.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{catalogue=data;failed=false;}).catch(()=>{failed=true;}).finally(()=>{pending=null;if(host?.isConnected&&host.querySelector('#account-achievements'))paint();});
 }
 function overview(){
  const points=catalogue.games.reduce((n,g)=>n+g.totalRepoScore,0),count=catalogue.games.reduce((n,g)=>n+g.achievements.length,0);
  return `<div class="ach-overview"><div class="account-section-heading"><p class="account-eyebrow">EVERY ADVENTURE COUNTS</p><h2>Achievements</h2><p class="account-subtitle">Every game. One RepoScore.</p></div><div class="ach-summary"><div><span>Your RepoScore</span><strong data-ach-earned>${context.state.social?fmt(context.state.social.profile.repo_score):'—'}</strong><small>Your permanent achievement total</small></div><div><span>Achievement catalogue</span><strong>${count}</strong><small>Across three games</small></div><div><span>Collection total</span><strong>${fmt(points)}</strong><small>RepoScore available</small></div></div><div class="ach-game-cards">${catalogue.games.map(g=>`<button class="ach-game-card" data-ach-game="${g.id}">${artwork(g)}<span class="ach-game-card-title"><b>${esc(g.name)}</b><span aria-hidden="true">→</span></span><span class="ach-game-card-meta">${g.achievements.length} achievements <i>·</i> ${fmt(g.totalRepoScore)} RepoScore</span></button>`).join('')}</div>${notice()}</div>`;
 }
 function gameView(g){
  return `<div class="ach-game-view" data-ach-game-view="${g.id}"><nav class="ach-breadcrumb" aria-label="Achievement navigation"><button data-ach-game="">← All games</button><span>/</span><span>${esc(g.name)}</span></nav><header class="ach-game-heading"><div><p class="account-eyebrow">${esc(g.genre)} · ACHIEVEMENTS</p><h2>${esc(g.name)}</h2><p>${esc(g.description)}</p><div class="ach-game-numbers"><span><b>${g.achievements.length}</b> achievements</span><span><b>${fmt(g.totalRepoScore)}</b> RepoScore available</span></div></div>${artwork(g)}</header>${notice()}<form class="ach-filters" role="search" aria-label="Filter achievements"><label class="ach-search"><span class="visually-hidden">Search achievements</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input type="search" id="ach-search" aria-label="Search achievements" placeholder="Find an achievement…" value="${esc(query)}" maxlength="150" autocomplete="off"></label><label><span class="visually-hidden">Category</span><select id="ach-category" aria-label="Category"></select></label><label><span class="visually-hidden">Sort achievements</span><select id="ach-sort" aria-label="Sort achievements"><option value="default">Collection order</option><option value="score-desc">RepoScore: high to low</option><option value="score-asc">RepoScore: low to high</option><option value="name">Name: A–Z</option></select></label></form><div class="ach-list-heading"><p id="ach-result-count" role="status"></p>${g.achievements.some(a=>a.secret)?`<label><input id="ach-reveal-all" type="checkbox" ${revealAll?'checked':''}> Reveal secret achievements</label>`:''}</div><div class="ach-list" id="ach-list"></div><div class="ach-empty" hidden><h3>No achievements found</h3><p>Try another name or category. Secret details stay hidden until you reveal them.</p><button class="account-soft-button" data-ach-clear>Clear filters</button></div></div>`;
 }
 function categories(){
  const el=host.querySelector('#ach-category');if(!el)return;
  const g=currentGame(),items=[...new Set(g.achievements.filter(visible).map(a=>a.category))];
  el.innerHTML='<option value="all">All categories</option>'+items.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')+(g.achievements.some(a=>!visible(a))?'<option value="secret">Secret achievements</option>':'');
  if(![...el.options].some(o=>o.value===category))category='all';el.value=category;
 }
 function list(){
  const g=currentGame();if(!g)return;observer.disconnect();
  const rows=model.select(g.achievements,{query,category,sort,revealAll,revealed});
  host.querySelector('#ach-result-count').textContent=`${rows.length} of ${g.achievements.length} achievements`;
  host.querySelector('.ach-empty').hidden=rows.length>0;
  host.querySelector('#ach-list').innerHTML=rows.map(a=>{const shown=visible(a),name=shown?a.name:'Secret achievement';return `<article class="ach-row${shown?'':' is-secret'}"><button class="ach-badge-button" data-ach-detail="${a.id}" aria-label="View ${esc(name)}">${badge(a,shown)}</button><div class="ach-copy"><button class="ach-name" data-ach-detail="${a.id}">${esc(name)}</button><p>${shown?esc(a.description):'A discovery waiting for you. Reveal it when you’re ready.'}</p>${shown?`<small>${esc(a.category)}${a.secret?' · Secret achievement':''}</small>`:`<button class="ach-reveal" data-ach-reveal="${a.id}">Reveal achievement</button>`}</div><div class="ach-score"><strong>${a.repoScore}</strong><small>RepoScore</small></div><div class="ach-global" aria-label="Global completion unavailable until unlock tracking is live" title="Percentage of players who started this game and unlocked this achievement. Available when unlock tracking is live."><strong>—</strong><small>% of players</small></div></article>`;}).join('');
  host.querySelectorAll('[data-sheet]').forEach(el=>observer.observe(el));
 }
 function detail(id){
  const g=currentGame(),a=g?.achievements.find(a=>a.id===id);if(!a)return;
  const shown=visible(a);
  context.showDetail(`<div class="ach-detail">${badge(a,shown,true)}<p class="account-eyebrow">${esc(g.name)} · ${shown?esc(a.category):'SECRET ACHIEVEMENT'}</p><h2 id="account-detail-title">${shown?esc(a.name):'Secret achievement'}</h2><p>${shown?esc(a.description):'The name, badge and requirement are hidden to protect the discovery.'}</p>${shown?'':`<button class="account-soft-button" data-ach-detail-reveal="${id}">Reveal achievement</button>`}<div class="ach-detail-score"><strong>${a.repoScore}</strong><span>RepoScore</span></div><p class="ach-global-detail"><strong>—</strong> of players completed this achievement</p><p class="ach-detail-note">Global completion counts players who have started this game. Percentages will appear when unlock tracking is live.</p></div>`);
  const panel=document.getElementById('account-detail');panel.querySelectorAll('[data-sheet]').forEach(loadBadge);
  panel.querySelector('[data-ach-detail-reveal]')?.addEventListener('click',()=>{revealed.add(id);categories();list();detail(id);panel.querySelector('.account-detail-close').focus();});
 }
 function events(container){
  container.addEventListener('submit',e=>e.preventDefault());
  container.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
   if(b.hasAttribute('data-ach-game'))return context.navigate(b.dataset.achGame);
   if(b.dataset.achDetail)return detail(b.dataset.achDetail);
   if(b.dataset.achReveal){revealed.add(b.dataset.achReveal);categories();list();(container.querySelector(`[data-ach-detail="${b.dataset.achReveal}"]`)||container.querySelector('#ach-category')).focus({preventScroll:true});}
   if(b.hasAttribute('data-ach-clear')){query='';category='all';container.querySelector('#ach-search').value='';categories();list();container.querySelector('#ach-search').focus();}
   if(b.hasAttribute('data-ach-retry')){failed=false;paint();load();}
  });
  container.addEventListener('input',e=>{if(e.target.id==='ach-search'){query=e.target.value;list();}});
  container.addEventListener('change',e=>{if(e.target.id==='ach-category')category=e.target.value;else if(e.target.id==='ach-sort')sort=e.target.value;else if(e.target.id==='ach-reveal-all'){revealAll=e.target.checked;revealed.clear();categories();}else return;list();});
 }
 function paint(){
  const container=host.querySelector('#account-achievements');if(!container)return;
  observer.disconnect();
  if(!catalogue){container.innerHTML=failed?'<div class="ach-empty"><h2>Unable to load achievements</h2><p>Please try again.</p><button class="account-soft-button" data-ach-retry>Try again</button></div>':'<p class="account-live-status" role="status">Loading achievements…</p>';return;}
  const g=currentGame();container.innerHTML=g?gameView(g):overview();
  if(g){categories();container.querySelector('#ach-sort').value=sort;list();}
 }
 function mount(element,options){
  const gameId=['moratales','manager','morogue'].includes(options.game)?options.game:'';
  const changed=selected!==gameId;host=element;context=options;
  if(changed){selected=gameId;query='';category='all';sort='default';revealAll=false;}
  let container=host.querySelector('#account-achievements');
  if(!container){host.innerHTML='<div id="account-achievements"></div>';container=host.firstElementChild;events(container);paint();}
  else if(changed)paint();
  else {const earned=container.querySelector('[data-ach-earned]');if(earned)earned.textContent=options.state.social?fmt(options.state.social.profile.repo_score):'—';}
  load();
 }
 window.repoAchievements=Object.freeze({mount});
})();
