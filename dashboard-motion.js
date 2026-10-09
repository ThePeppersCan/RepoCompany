(() => {
  'use strict';
  const dashboard = document.getElementById('dashboard');
  const gallery = document.getElementById('gallery');
  const galleryImage = document.getElementById('gallery-image');
  const shots = [...document.querySelectorAll('[data-shot]')];
  const thumbnails = [...document.querySelectorAll('[data-gallery-shot]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const casePreview = document.getElementById('case-preview');
  const rotor = document.getElementById('disc-spin');
  const sound = window.dashboardAudio;
  const playButton = document.querySelector('[data-note="Play"]');
  const launchCurtain = document.createElement('div');
  launchCurtain.className = 'launch-curtain';
  launchCurtain.id = 'launch-curtain';
  launchCurtain.setAttribute('role', 'status');
  launchCurtain.setAttribute('aria-live', 'polite');
  launchCurtain.tabIndex = -1;
  document.body.append(launchCurtain);
  let launching = false, launchAt = 0, launchSpeed = 0;
  const launchTimers = [];
  const canvas = document.getElementById('atmosphere');
  const ctx = canvas.getContext('2d');
  const galleryCanvas = document.createElement('canvas');
  galleryCanvas.className = 'gallery-particles';
  galleryCanvas.width = 1672; galleryCanvas.height = 941;
  galleryCanvas.setAttribute('aria-hidden', 'true');
  gallery.querySelector('.gallery-atmosphere').after(galleryCanvas);
  const galleryCtx = galleryCanvas.getContext('2d');
  let current = 0, opener = null, imageAnimation;

  function showShot(index, direction = 1) {
    if (launching) return;
    const alreadyOpen = gallery.open;
    current = (index + shots.length) % shots.length;
    const source = shots[current].querySelector('img');
    galleryImage.src = source.src;
    galleryImage.alt = source.alt;
    document.getElementById('gallery-caption').textContent = shots[current].querySelector('.caption').textContent;
    document.getElementById('gallery-count').innerHTML = `${String(current + 1).padStart(2, '0')} <span>/ ${String(shots.length).padStart(2, '0')}</span>`;
    thumbnails.forEach((button, i) => button.setAttribute('aria-current', String(i === current)));
    shots.forEach((button, i) => button.classList.toggle('selected', i === current));
    imageAnimation?.cancel();
    if (!reducedMotion.matches && alreadyOpen) {
      imageAnimation = galleryImage.animate([
        {opacity: .25, transform: `translateX(${direction * 9}px)`},
        {opacity: 1, transform: 'translateX(0)'}
      ], {duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)'});
    }
    if (!alreadyOpen) {
      sound?.effect('screenshot');
      sound?.gallery(true);
      opener = document.activeElement;
      setCaseActive(false);
      hovering = keyboardFocus = pinned = false;
      casePreview.setAttribute('aria-pressed', 'false');
      gallery.showModal();
      gallery.querySelector('.gallery-close').focus({preventScroll: true});
      updateLoop();
    }
  }
  shots.forEach((button, i) => button.addEventListener('click', () => showShot(i)));
  shots[0].classList.add('selected');
  thumbnails.forEach((button, i) => button.addEventListener('click', () => showShot(i, i < current ? -1 : 1)));
  document.getElementById('previous').onclick = () => showShot(current - 1, -1);
  document.getElementById('next').onclick = () => showShot(current + 1);
  gallery.addEventListener('close', () => {
    sound?.gallery(false);
    imageAnimation?.cancel();
    opener?.focus({preventScroll: true});
    updateLoop();
  });
  document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => button.closest('dialog').close());

  addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    if (gallery.open) {
      showShot(current + direction, direction);
      event.preventDefault();
    } else if (!dashboard.classList.contains('home-mode') && !document.querySelector('dialog[open]')) {
      const i = shots.indexOf(document.activeElement);
      shots[(i + direction + shots.length) % shots.length].focus();
      event.preventDefault();
    }
  });
  let touchStart = null;
  galleryImage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') touchStart = {x: event.clientX, y: event.clientY};
  });
  galleryImage.addEventListener('pointerup', event => {
    if (!touchStart) return;
    const dx = event.clientX - touchStart.x, dy = event.clientY - touchStart.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) showShot(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    touchStart = null;
  });
  galleryImage.addEventListener('pointercancel', () => touchStart = null);

  // The printed layer rotates inside a perspective-mapped disc. Its silver ring and hub stay fixed.
  let hovering = false, keyboardFocus = false, pinned = false, active = false;
  let speed = 0, angle = 0, startedAt = 0, startingSpeed = 0, coast = null;
  function setCaseActive(next) {
    if (launching) return;
    dashboard.classList.toggle('case-active', next);
    if (next === active) return;
    active = next;
    sound?.spin(next);
    if (reducedMotion.matches) return;
    const now = performance.now();
    if (next) {
      startedAt = now;
      startingSpeed = Math.max(0, speed);
      coast = null;
    } else if (Math.abs(speed) > .1) {
      let to, duration;
      if (speed < 80) {
        to = Math.round(angle / 360) * 360;
        duration = 1.4;
      } else {
        to = Math.ceil((angle + speed * .72) / 360) * 360;
        duration = Math.min(4.8, Math.max(1.6, 3 * (to - angle) / speed));
      }
      coast = {from: angle, to, duration, start: now};
    }
    updateLoop();
  }
  function syncCase() { setCaseActive(hovering || keyboardFocus || pinned); }
  casePreview.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'touch') { hovering = true; syncCase(); }
  });
  casePreview.addEventListener('pointerleave', () => { hovering = false; syncCase(); });
  casePreview.addEventListener('focus', () => { keyboardFocus = casePreview.matches(':focus-visible'); syncCase(); });
  casePreview.addEventListener('blur', () => { keyboardFocus = false; pinned = false; casePreview.setAttribute('aria-pressed', 'false'); syncCase(); });
  casePreview.addEventListener('click', event => {
    if (event.pointerType === 'touch' || event.detail === 0) {
      pinned = !pinned;
      casePreview.setAttribute('aria-pressed', String(pinned));
      syncCase();
    }
  });

  // Low-density, slow drifting motes. Fixed seed keeps the visual composition stable on reload.
  let seed = 90129;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const particles = Array.from({length: 52}, () => ({
    x: random() * 1672, y: random() * 941, radius: .65 + random() * 1.5,
    phase: random() * Math.PI * 2, drift: .8 + random() * 3,
    opacity: .12 + random() * .26, warm: random() > .37
  }));
  let elapsed = 0, lastTime = 0, frame = null;
  function paintAtmosphere(dt) {
    elapsed += dt;
    const drawing = gallery.open ? galleryCtx : ctx;
    const surface = gallery.open ? galleryCanvas : canvas;
    const mobileHome = dashboard.classList.contains('home-mode') && innerWidth <= 700;
    const width = gallery.open ? innerWidth : mobileHome ? 700 : 1672;
    const height = gallery.open ? innerHeight : mobileHome ? 1420 : 941;
    if(surface.width!==width||surface.height!==height){surface.width=width;surface.height=height;}
    drawing.clearRect(0, 0, width, height);
    for (const p of particles) {
      const y = (p.y - elapsed * p.drift % 1001 + 1001) % 1001 - 30;
      const x = p.x + Math.sin(elapsed * .06 + p.phase) * 17;
      // Keep the physical case, copy and screenshot rail visually clean.
      const inCase = dashboard.classList.contains('home-mode') ? x > 560 && x < 1600 && y > 235 && y < 850 : x > 636 && x < 1500 && y > 58 && y < 578;
      const overMedia = gallery.open && x > 280 && x < 1390 && y > 100 && y < 840;
      const fade = (.5 + .5 * Math.pow(Math.sin(elapsed * .16 + p.phase), 2)) * (overMedia ? 0 : gallery.open ? .8 : inCase ? .15 : y > 615 ? .5 : 1);
      const alpha = p.opacity * fade;
      const color = p.warm ? '237,224,179' : '184,219,204';
      const px=x*width/1672,py=y*height/941;
      const radius=p.radius*(gallery.open?Math.max(.65,Math.min(width/1672,height/941)):1);
      const glow = drawing.createRadialGradient(px, py, 0, px, py, radius * 4.5);
      glow.addColorStop(0, `rgba(${color},${alpha * .45})`); glow.addColorStop(1, `rgba(${color},0)`);
      drawing.fillStyle = glow; drawing.beginPath(); drawing.arc(px, py, radius * 4.5, 0, Math.PI * 2); drawing.fill();
      drawing.fillStyle = `rgba(${color},${alpha})`; drawing.beginPath(); drawing.arc(px, py, radius, 0, Math.PI * 2); drawing.fill();
    }
  }
  function tick(now) {
    frame = null;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, .05) : 0;
    lastTime = now;
    if (launching) {
      const t = Math.min((now - launchAt) / 900, 1);
      speed = launchSpeed + (2520 - launchSpeed) * t * t * (3 - 2 * t);
      angle += speed * dt;
    } else if (active && !gallery.open && !dashboard.classList.contains('home-mode')) {
      const t = Math.min((now - startedAt) / 5200, 1);
      const eased = t * t * (3 - 2 * t);
      speed = startingSpeed + (660 - startingSpeed) * eased + (1 - t) * 10;
      angle += speed * dt;
    } else if (coast) {
      const t = Math.min((now - coast.start) / (coast.duration * 1000), 1);
      angle = coast.from + (coast.to - coast.from) * (1 - Math.pow(1 - t, 3));
      speed = 3 * (coast.to - coast.from) / coast.duration * Math.pow(1 - t, 2);
      if (t === 1) { coast = null; speed = 0; angle %= 360; }
    }
    rotor.style.transform = `rotate(${angle % 360}deg)`;
    rotor.style.filter = Math.abs(speed) > 200 ? `blur(${Math.min((Math.abs(speed) - 200) / 1500, launching ? 1.15 : .38)}px)` : '';
    rotor.dataset.speed = speed.toFixed(1);
    paintAtmosphere(dt);
    frame = requestAnimationFrame(tick);
  }
  function updateLoop() {
    const shouldRun = !document.hidden && !reducedMotion.matches;
    if (shouldRun && frame === null) { lastTime = 0; frame = requestAnimationFrame(tick); }
    else if (!shouldRun && frame !== null) { cancelAnimationFrame(frame); frame = null; lastTime = 0; }
  }
  document.addEventListener('visibilitychange', updateLoop);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      speed = angle = 0; coast = null; rotor.style.transform = 'rotate(0deg)'; rotor.style.filter = '';
      rotor.dataset.speed = '0'; ctx.clearRect(0, 0, canvas.width, canvas.height); galleryCtx.clearRect(0, 0, galleryCanvas.width, galleryCanvas.height);
    } else { startedAt = performance.now(); startingSpeed = 0; }
    updateLoop();
  });
  rotor.dataset.speed = '0';
  updateLoop();

  dashboard.addEventListener('scene-change', () => {
    if (dashboard.classList.contains('home-mode')) {
      hovering = keyboardFocus = pinned = false;
      setCaseActive(false);
      casePreview.setAttribute('aria-pressed', 'false');
    }
  });

  dashboard.addEventListener('account-opening', () => {
    hovering = keyboardFocus = pinned = false;
    setCaseActive(false);
    casePreview.setAttribute('aria-pressed', 'false');
  });
  dashboard.addEventListener('game-change', () => {
    hovering = keyboardFocus = pinned = false;
    setCaseActive(false);
    speed = angle = 0; coast = null;
    rotor.style.transform = 'rotate(0deg)'; rotor.style.filter = ''; rotor.dataset.speed = '0';
    casePreview.setAttribute('aria-pressed', 'false');
    current = 0;
    shots.forEach((button,i) => button.classList.toggle('selected',i===0));
    thumbnails.forEach((button,i) => button.setAttribute('aria-current',String(i===0)));
    document.getElementById('gallery-count').innerHTML = '01 <span>/ 03</span>';
  });

  function launchGame() {
    if (launching || dashboard.classList.contains('home-mode')) return;
    launching = true;
    launchAt = performance.now();
    launchSpeed = Math.max(80, speed);
    coast = null;
    dashboard.classList.add('case-active');
    dashboard.dataset.launching = 'true';
    dashboard.inert = true;
    dashboard.setAttribute('aria-busy', 'true');
    playButton.disabled = true;
    document.body.classList.add('is-launching');
    launchCurtain.innerHTML = '<span class="launch-announcement"></span>';
    launchCurtain.firstChild.textContent = `Launching ${playButton.dataset.gameName || 'Moratales'}`;
    launchCurtain.focus({preventScroll: true});
    const duration = reducedMotion.matches ? 320 : 1900;
    sound?.launch(duration - 200);
    launchTimers.push(setTimeout(() => launchCurtain.classList.add('visible'), reducedMotion.matches ? 0 : 900));
    launchTimers.push(setTimeout(() => sound?.finish(), duration - 300));
    launchTimers.push(setTimeout(() => location.assign(playButton.dataset.gameUrl), duration));
    updateLoop();
  }
  // Back from the game must restore the scene, including when the browser keeps it in memory.
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    launchTimers.forEach(clearTimeout);
    launching = active = hovering = keyboardFocus = pinned = false;
    speed = angle = 0; coast = null;
    delete dashboard.dataset.launching;
    dashboard.inert = false;
    dashboard.removeAttribute('aria-busy');
    dashboard.classList.remove('case-active');
    playButton.disabled = false;
    document.body.classList.remove('is-launching');
    launchCurtain.classList.remove('visible');
    launchCurtain.replaceChildren();
    rotor.style.transform = 'rotate(0deg)'; rotor.style.filter = ''; rotor.dataset.speed = '0';
    playButton.focus({preventScroll: true});
    updateLoop();
  });

  document.querySelectorAll('[data-note]').forEach(button => button.onclick = () => {
    if (launching) return;
    if (button.dataset.note === 'Play') { launchGame(); return; }
    if (button.dataset.note === 'Account' && window.accountMenu) { window.accountMenu.open(); return; }
    if (button.dataset.note === 'Collection') {
      if (document.getElementById('collection-scene')) dashboard.dispatchEvent(new Event('return-to-collection'));
      else location.href = 'repo-homepage-preview.html';
      return;
    }
    document.getElementById('note-title').textContent = button.dataset.note === 'Collection' ? 'Collection transition' : button.dataset.note;
    document.getElementById('note-copy').textContent = {
      Account: 'Account controls will connect to the existing site account.',
      Collection: 'This preview focuses on the approved open-case scene. The finished dashboard returns to your four-case collection here.'
    }[button.dataset.note];
    document.getElementById('note').showModal();
  });
})();
