import { isSuno, playbackPosition, sunoQueueDuration } from './core.mjs';

// Suno exposes autoplay, but no parent-page play/pause/seek API. The iframe
// owns playback on the web. The launcher can also follow the shared clock using
// its scoped native media controller, without reloading the official iframe.
export function createSunoPlayer(container, notice) {
  let signature = null;
  function stage(item, playing) {
    container.replaceChildren();
    const art = document.createElement('div'); art.className = 'music-art'; art.dataset.playing = String(playing);
    const light = document.createElement('div'); light.className = 'music-light'; light.setAttribute('aria-hidden', 'true');
    const mark = document.createElement('img'); mark.src = '../assets/wibs-intro-mark.png'; mark.alt = 'Repo Company'; mark.className = 'music-mark'; mark.width = mark.height = 240;
    const title = document.createElement('h1'); title.textContent = item?.title || 'Reparty';
    const caption = document.createElement('span'); caption.className = 'music-caption'; caption.textContent = playing ? 'Suno · Reparty' : 'Playback paused';
    art.append(light, mark, title, caption); container.append(art);
  }
  return {
    pause(item) { this.clear(); container.hidden = false; stage(item, false); },
    apply(playback, item, now, managed = false, locallyPaused = false) {
      if (!isSuno(playback?.video_id)) { this.clear(); return; }
      container.hidden = false; notice.hidden = false;
      const next = managed ? playback.item_id : `${playback.item_id}:${playback.updated_at}:${playback.playing}`;
      const art=container.querySelector(".music-art");if(art){art.dataset.playing=String(playback.playing&&!locallyPaused);art.querySelector(".music-caption").textContent=playback.playing&&!locallyPaused?"Suno · Reparty":"Playback paused";}
      if (next === signature) return;
      signature = next;
      stage(item, playback.playing && !locallyPaused); // Removing the frame stops its local audio.
      if (!playback.playing && !managed) {
        const text = document.createElement('p'); text.className = 'suno-paused';
        text.textContent = 'Press play below to restart this song for everyone.';
        container.append(text);
        return;
      }
      if (!managed && playbackPosition(playback, now) >= sunoQueueDuration(item)) {
        const text = document.createElement('p'); text.className = 'suno-paused';
        text.textContent = 'Waiting for the next queued track…'; container.append(text); return;
      }
      const dock = document.createElement('div'); dock.className = 'suno-dock';
      const loading = document.createElement('p'); loading.className = 'suno-loading'; loading.textContent = 'Connecting to Suno…';
      dock.append(loading); container.append(dock);
      const frame = document.createElement('iframe');
      frame.loading = 'eager';
      frame.title = `Suno: ${item?.title || 'song'}`;
      frame.src = `https://suno.com/embed/${playback.video_id.slice(5)}?autoplay=1`;
      frame.allow = 'autoplay; encrypted-media; fullscreen';
      frame.allowFullscreen = true;
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.onload = () => loading.remove();
      dock.append(frame);
    },
    clear() { signature = null; container.replaceChildren(); container.hidden = true; notice.hidden = true; }
  };
}
