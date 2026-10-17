// Shared Repo Company portraits, keyed by account identity. No Reparty avatar state.
export function createProfiles(getToken) {
  let profiles = new Map(), signature = '', fetched = 0, epoch = 0, pending = false;
  const pictures=new Map();
  function forget(key){const row=pictures.get(key);if(row?.url)URL.revokeObjectURL(row.url);pictures.delete(key);}
  async function picture(element,profile){
    if(!profile?.photo_version||!profile.username)return;
    const key=profile.user_id+':'+profile.photo_version,ticket=epoch,token=getToken();if(!token)return;
    let row=pictures.get(key);
    if(row&&row.until<Date.now()){forget(key);row=null;}
    if(!row){if(pictures.size>=100)forget(pictures.keys().next().value);row={until:Date.now()+60000};pictures.set(key,row);
      row.promise=(async()=>{const r=await fetch('/api/profile-picture?'+new URLSearchParams({username:profile.username,v:profile.photo_version}),{headers:{Authorization:'Bearer '+token},cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Picture unavailable');const blob=await r.blob();if(ticket!==epoch||pictures.get(key)!==row)throw Error('Account changed');return row.url=URL.createObjectURL(blob);})();
    }
    try{const url=await row.promise;if(ticket!==epoch||profiles.get(profile.user_id)?.photo_version!==profile.photo_version||!element.isConnected)return;const img=document.createElement('img');img.className='repo-profile-photo';img.alt='';img.src=url;element.querySelector(':scope > .repo-profile-photo')?.remove();element.append(img);}catch{}
  }
  function paint(element) {
    const profile = profiles.get(element.dataset.userId), label = element.getAttribute('aria-label');
    const markup = profile?.avatar && window.repoAvatar?.markup(profile.avatar, label);
    element.innerHTML = markup || '';
    if (!markup) element.textContent = element.dataset.initial;
    element.classList.toggle('has-avatar-frame', !!profile?.frame_id);
    if (profile?.frame_id) {
      element.insertAdjacentHTML('beforeend', window.repoFrames?.markup(profile.frame_id) || '');
      element.querySelectorAll('.repo-avatar-frame img').forEach(img => img.src = new URL('../' + img.getAttribute('src'), import.meta.url).href);
    }
    window.repoAvatar?.hydrate(element); window.repoFrames?.hydrate(element);picture(element,profile);
  }
  return {
    avatar(id, name = 'Guest') {
      const element = document.createElement('span'); element.className = 'avatar';
      element.dataset.userId = id; element.dataset.initial = name.trim().slice(0, 1).toUpperCase() || 'R';
      element.setAttribute('role', 'img'); element.setAttribute('aria-label', name + "'s avatar");
      paint(element); return element;
    },
    clear() { epoch++; pending = false; profiles.clear();for(const key of pictures.keys())forget(key); signature = ''; fetched = 0; document.querySelectorAll('.avatar[data-user-id]').forEach(paint); },
    async refresh(ids) {
      const key = [...new Set(ids.filter(Boolean))].slice(0, 100).sort().join(','), token = getToken();
      if (!key || !token || pending || key === signature && Date.now() - fetched < 15000) return;
      const ticket = epoch; pending = true;
      try {
        const response = await fetch('/api/reparty-profiles?ids=' + encodeURIComponent(key), { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw Error('Profile lookup failed');
        const data = await response.json(); if (ticket !== epoch) return;
        profiles = new Map((data.profiles || []).map(p => [p.user_id, p])); signature = key; fetched = Date.now();
        const visible=new Set(data.profiles.map(p=>p.user_id+':'+p.photo_version));for(const key of pictures.keys())if(!visible.has(key))forget(key);
        document.querySelectorAll('.avatar[data-user-id]').forEach(paint);
      } catch { /* A failed lookup must not interrupt playback or use someone else's portrait. */ }
      finally { if (ticket === epoch) pending = false; }
    }
  };
}
