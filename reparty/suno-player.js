import { isSuno, playbackPosition, sunoQueueDuration } from './core.mjs';

// Suno exposes autoplay, but no parent-page play/pause/seek API. The iframe
// owns actual playback; this controller only mounts it and displays room time.
export function createSunoPlayer(container, notice) {
  let signature = null;
  return {
    apply(playback, item, now) {
      if (!isSuno(playback?.video_id)) { this.clear(); return; }
      container.hidden = false; notice.hidden = false;
      const next = `${playback.item_id}:${playback.updated_at}:${playback.playing}`;
      if (next === signature) return;
      signature = next;
      container.replaceChildren(); // Removing the frame stops its local audio.
      if (!playback.playing) {
        const text = document.createElement('p'); text.className = 'suno-paused';
        text.textContent = 'Suno is paused. Press play to restart this song for everyone.';
        container.append(text);
        return;
      }
      if (playbackPosition(playback, now) >= sunoQueueDuration(item)) {
        const text = document.createElement('p'); text.className = 'suno-paused';
        text.textContent = 'Waiting for the next queued track…'; container.append(text); return;
      }
      const loading = document.createElement('p'); loading.className = 'suno-paused'; loading.textContent = 'Loading Suno…';
      container.append(loading);
      const frame = document.createElement('iframe');
      frame.title = `Suno: ${item?.title || 'song'}`;
      frame.src = `https://suno.com/embed/${playback.video_id.slice(5)}?autoplay=1`;
      frame.allow = 'autoplay; encrypted-media; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.onload = () => loading.remove();
      container.append(frame);
    },
    clear() { signature = null; container.replaceChildren(); container.hidden = true; notice.hidden = true; }
  };
}
