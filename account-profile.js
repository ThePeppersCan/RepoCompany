(() => {
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=value=>Number(value||0).toLocaleString('en-GB');
 const initials=name=>String(name||'?').split(/[\s_-]+/).filter(Boolean).map(s=>s[0]).slice(0,2).join('').toUpperCase();
 const hours=ms=>new Intl.NumberFormat('en-GB',{minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(ms||0)/3600000);
 function lastPlayed(value){
  const date=new Date(Number(value));if(!Number.isFinite(date.getTime()))return '';
  const days=Math.floor((Date.now()-date.getTime())/86400000);
  return days<1?'Played today':days<2?'Played yesterday':'Last played '+date.toLocaleDateString('en-GB',{day:'numeric',month:'short'});
 }
 function catalog(games){return [...games,...(window.demoLibrary?.games||[])];}
 function artwork(game){
  if(['moratales','manager','morogue'].includes(game.id)){
   const logo=game.id==='manager'?'<svg class="profile-banner-logo" viewBox="57 178 2073 432"><image width="2167" height="725" href="original-case-assets/manager-logo-clean.png"/></svg>':`<img class="profile-banner-logo" src="original-case-assets/${game.id}-logo.png" alt="">`;
   return `<span class="profile-game-banner banner-${game.id}" aria-hidden="true"><img class="profile-banner-art" src="account-assets/${game.id}-activity-banner-v1.png" alt="" loading="lazy">${logo}</span>`;
  }
  return `<span class="profile-demo-art" aria-hidden="true"><i></i><b>${esc(game.name)}</b></span>`;
 }
 function achievementLine(game){return `<div class="profile-achievement-line"><span>Achievement progress</span><small>Coming soon</small><div aria-hidden="true"></div></div>`;}
 function friendItem(friend){
  return `<button class="profile-friend" data-friend-profile="${esc(friend.username)}"><span class="profile-initials">${esc(initials(friend.display_name||friend.username))}${window.repoAvatar?.markup(friend.avatar,friend.display_name||friend.username)||''}<i class="${friend.online?'online':''}"></i></span><span><b>${esc(friend.display_name||friend.username)}</b><small>${friend.online?'Online':'Offline'}</small></span><span class="profile-friend-score">${fmt(friend.repo_score)}<small>RepoScore</small></span></button>`;
 }
 function render({state,games}){
  const name=state.social?.profile?.display_name||state.character?.username||'',profile=state.social?.profile;
  const all=catalog(games),activity=(state.social?.activity||[]).filter(a=>all.some(g=>g.id===a.game)).sort((a,b)=>b.last_played-a.last_played),recent=activity.slice(0,3);
  const friends=(state.social?.friends||[]).filter(f=>f.status==='accepted').sort((a,b)=>Number(b.online)-Number(a.online)||a.username.localeCompare(b.username));
  const total=activity.reduce((sum,a)=>sum+Number(a.played_ms||0),0);
  return `<div class="profile-page"><section class="profile-identity"><button class="profile-avatar-button" data-edit-avatar aria-label="Edit avatar"><span class="profile-initials profile-avatar">${esc(initials(name))}${window.repoAvatar?.markup(profile?.avatar,name)||''}</span><span class="avatar-edit-hint">Edit</span></button><div class="account-profile-copy"><p class="account-eyebrow">YOUR REPO COMPANY PROFILE</p><h2>${esc(name)}</h2><p class="account-bio">${esc(profile?.bio||'One account. Every adventure.')}</p><span class="profile-presence ${profile?.invisible?'offline':''}"><i></i>${profile?.invisible?'Appearing offline':'Online'}</span><button class="profile-edit" data-edit-profile>Edit profile</button><button class="profile-edit" data-edit-avatar>${profile?.avatar?'Edit avatar':'Create avatar'}</button></div><div class="profile-score"><button data-tab="achievements"><strong>${profile?fmt(profile.repo_score):'—'}</strong><span>RepoScore</span></button><p>Achievement score</p></div></section><div class="profile-columns"><section class="profile-activity"><div class="profile-section-title"><h3>Recent activity</h3><span>${activity.length?hours(total)+' hours on record':'Your next adventure starts here'}</span></div>${state.socialError?`<p class="account-live-status is-error">${esc(state.socialError)}</p>`:''}${recent.length?`<div class="profile-recent-games">${recent.map(a=>{const game=all.find(g=>g.id===a.game);return `<article class="profile-recent-game"><button class="profile-game-link" data-game="${esc(game.id)}">${artwork(game)}<span><b>${esc(game.name)}</b><small>${esc(game.genre)}</small></span></button><div class="profile-playtime"><b>${hours(a.played_ms)} hrs on record</b><small>${lastPlayed(a.last_played)}</small></div>${achievementLine(game)}</article>`;}).join('')}</div>`:`<div class="profile-empty-activity"><h4>Start your first session.</h4><p>Your last three games and recorded hours will appear here when you play while signed in.</p><div class="profile-start-games">${games.map(g=>`<button data-game="${g.id}">${artwork(g)}<span>${esc(g.name)} <i>→</i></span></button>`).join('')}</div></div>`}<p class="profile-tracking-note">Play time records from this update onwards. Game achievements are coming later.</p></section><aside class="profile-sidebar"><section><div class="profile-section-title"><h3>Friends <span>${friends.length}</span></h3><button data-tab="friends">View all →</button></div>${friends.length?`<div class="profile-friends">${friends.slice(0,5).map(friendItem).join('')}</div>`:`<p class="profile-sidebar-note">Bring your people along.</p><button class="account-soft-button" data-add-friend>+ Add friend</button>`}</section><section class="profile-collection"><div class="profile-section-title"><h3>Your collection</h3></div><p>${fmt(state.cards.length)} cards <span>·</span> ${fmt(state.slabs.length)} graded slabs</p><button data-binder="binder">Card Binder <span>→</span></button><button data-binder="slabs">Slab Binder <span>→</span></button><button data-tab="inventory">Inventory <span>→</span></button></section></aside></div></div>`;
 }
 function achievements({state,games}){
  const total=(state.social?.activity||[]).reduce((sum,a)=>sum+Number(a.played_ms||0),0);
  return `<div class="profile-achievements"><div class="account-section-heading"><p class="account-eyebrow">EVERY ADVENTURE COUNTS</p><h2>Achievements</h2><p class="account-subtitle">One RepoScore across your games.</p></div><div class="account-progress-summary"><div><span>RepoScore</span><strong>${state.social?fmt(state.social.profile.repo_score):'—'}</strong><small>Your permanent achievement total</small></div><div><span>Hours on record</span><strong>${hours(total)}</strong><small>Recorded while your games are open and visible</small></div></div><div class="profile-achievement-games">${games.map(g=>`<article><button data-game="${g.id}">${artwork(g)}<span><b>${esc(g.name)}</b><small>Achievement list coming soon</small></span><i>→</i></button>${achievementLine(g)}</article>`).join('')}</div><p class="profile-tracking-note">Achievement challenges and their RepoScore rewards are being defined. Repoints remain your separate Shop balance.</p></div>`;
 }
 window.repoProfile=Object.freeze({render,achievements});
})();
