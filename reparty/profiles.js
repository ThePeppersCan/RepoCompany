// Shared Repo Company portraits, keyed by account identity. No Reparty avatar state.
export function createProfiles(getToken) {
  let profiles = new Map(), signature = '', fetched = 0, epoch = 0, pending = false;
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
    window.repoAvatar?.hydrate(element); window.repoFrames?.hydrate(element);
  }
  return {
    avatar(id, name = 'Guest') {
      const element = document.createElement('span'); element.className = 'avatar';
      element.dataset.userId = id; element.dataset.initial = name.trim().slice(0, 1).toUpperCase() || 'R';
      element.setAttribute('role', 'img'); element.setAttribute('aria-label', name + "'s avatar");
      paint(element); return element;
    },
    clear() { epoch++; pending = false; profiles.clear(); signature = ''; fetched = 0; document.querySelectorAll('.avatar[data-user-id]').forEach(paint); },
    async refresh(ids) {
      const key = [...new Set(ids.filter(Boolean))].slice(0, 100).sort().join(','), token = getToken();
      if (!key || !token || pending || key === signature && Date.now() - fetched < 15000) return;
      const ticket = epoch; pending = true;
      try {
        const response = await fetch('/api/reparty-profiles?ids=' + encodeURIComponent(key), { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw Error('Profile lookup failed');
        const data = await response.json(); if (ticket !== epoch) return;
        profiles = new Map((data.profiles || []).map(p => [p.user_id, p])); signature = key; fetched = Date.now();
        document.querySelectorAll('.avatar[data-user-id]').forEach(paint);
      } catch { /* A failed lookup must not interrupt playback or use someone else's portrait. */ }
      finally { if (ticket === epoch) pending = false; }
    }
  };
}
