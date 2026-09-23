export function parseVideo(input) {
  const value = String(input || '').trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let id;
    if (host === 'youtu.be') id = url.pathname.split('/')[1];
    else if (['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      const parts = url.pathname.split('/');
      id = url.pathname === '/watch' ? url.searchParams.get('v') : ['embed', 'shorts', 'live'].includes(parts[1]) ? parts[2] : null;
    }
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
export function playbackPosition(playback, now = Date.now()) {
  const elapsed = playback.playing ? Math.max(0, (now - Date.parse(playback.updated_at)) / 1000) : 0;
  return Math.max(0, Math.min(86400, Number(playback.position || 0) + (Number.isFinite(elapsed) ? elapsed : 0)));
}
export function formatTime(seconds) {
  const s = Math.floor(Math.max(0, Number(seconds) || 0));
  return s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
export function validRoom(code) { return /^[a-f0-9]{12}$/.test(String(code || '')); }
export function avatarPosition(id) {
  const safe = Number.isInteger(Number(id)) && Number(id) >= 0 && Number(id) < 100 ? Number(id) : 0;
  return { sheet: Math.floor(safe / 25), x: (safe % 5) * 25, y: Math.floor((safe % 25) / 5) * 25 };
}
