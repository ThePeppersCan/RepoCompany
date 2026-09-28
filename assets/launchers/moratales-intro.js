(() => {
  'use strict';
  const link = document.getElementById('openMoratales');
  if (!link) return;
  const film = new URL('repo-company-intro.mp4', document.currentScript.src).href;
  let dialog, video, active = false, leaving = false, timer, pausedAudio = [];

  function watch() {
    clearTimeout(timer);
    // A failed download or stalled decoder must never block entry to the game.
    if (active && !document.hidden) timer = setTimeout(finish, 12000);
  }
  function finish() {
    if (!active || leaving) return;
    leaving = true;
    clearTimeout(timer);
    video.pause();
    // Keep the black card visible until navigation paints the game/loading page.
    location.assign(link.href);
  }
  function play() {
    if (!active || leaving || document.hidden) return;
    watch();
    const failed = () => {
      if (!active || leaving) return;
      // Some mobile browsers reject sound after returning from another app.
      video.muted = true;
      try { video.play()?.catch(finish); } catch (_) { finish(); }
    };
    try { video.play()?.catch(failed); } catch (_) { failed(); }
  }
  function build() {
    dialog = document.createElement('dialog');
    dialog.id = 'moratales-company-intro';
    dialog.setAttribute('aria-label', 'Repo Company intro');
    video = document.createElement('video');
    video.playsInline = true;
    video.preload = 'none';
    video.volume = .65;
    video.setAttribute('aria-label', 'Repo Company logo film');
    video.setAttribute('disablepictureinpicture', '');
    video.controls = false;
    dialog.append(video);
    document.body.append(dialog);
    video.addEventListener('ended', finish);
    video.addEventListener('error', finish);
    video.addEventListener('timeupdate', watch);
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); });
    video.src = film;
  }
  link.addEventListener('click', event => {
    // Preserve the browser's modified-click/new-tab behavior and the plain link fallback.
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!window.HTMLDialogElement || !HTMLDialogElement.prototype.showModal) return;
    event.preventDefault();
    if (active || leaving) return;
    active = true;
    if (!dialog) build();
    pausedAudio = [...document.querySelectorAll('audio,video')].filter(a => a !== video && !a.paused);
    pausedAudio.forEach(a => a.pause());
    dialog.showModal();
    dialog.focus();
    play();
  });
  document.addEventListener('play', event => {
    if (active && event.target !== video && event.target instanceof HTMLMediaElement) event.target.pause();
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (!active || leaving) return;
    if (document.hidden) { video.pause(); clearTimeout(timer); } else play();
  });
  window.addEventListener('pagehide', () => { clearTimeout(timer); video?.pause(); });
  // Returning from the game via Back must restore a usable website, including bfcache.
  window.addEventListener('pageshow', event => {
    if (!event.persisted || !dialog) return;
    active = leaving = false;
    video.pause();
    video.currentTime = 0;
    dialog.close();
    pausedAudio.forEach(a => a.play()?.catch(() => {}));
    pausedAudio = [];
    link.focus();
  });
})();
