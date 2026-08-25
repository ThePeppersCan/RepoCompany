(() => {
  'use strict';

  const CAREER_URL = 'dragonbound-career-mode/index.html?v=v34-10-6-team-avatars-20260825';
  const SUPABASE_URL = 'https://hvdrwmjieguurxvrgzfu.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_bln84LaJ8iYmnkYK9mh0Pg_XxP7O1OZ';
  const ACTIVE_CLASS = 'dragonbound-career-active';
  const OVERLAY_ID = 'dragonboundCareerOverlay';
  const BUTTON_CLASS = 'dragonbound-career-launcher';
  const STYLE_ID = 'dragonboundCareerLauncherRuntimeStyles';

  const state = {
    previousFocus: null,
    parentLoops: [],
    engineWasRunning: false,
    bridgeToken: '',
    open: false
  };
  let careerBridgeClient = null;

  function getCareerBridgeClient() {
    if (window.repoSupabaseClient?.auth?.getSession) return window.repoSupabaseClient;
    if (careerBridgeClient) return careerBridgeClient;
    const namespace = window.supabase;
    if (!namespace?.createClient) {
      throw new Error('The website account service is unavailable. Refresh the page and sign in again.');
    }
    careerBridgeClient = namespace.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    return careerBridgeClient;
  }

  async function sendCareerSession(frame, bridgeToken) {
    if (!state.open || !frame?.contentWindow || !bridgeToken || bridgeToken !== state.bridgeToken) return;
    try {
      const client = getCareerBridgeClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      const session = data?.session;
      if (!session?.access_token || !session?.refresh_token) {
        throw new Error('Your login session is unavailable. Close Career Mode, sign in again, then retry.');
      }
      frame.contentWindow.postMessage({
        type: 'dragonbound-career-auth',
        bridge: bridgeToken,
        accessToken: session.access_token,
        refreshToken: session.refresh_token
      }, '*');
    } catch (error) {
      frame.contentWindow.postMessage({
        type: 'dragonbound-career-auth',
        bridge: bridgeToken,
        error: error?.message || 'The website account could not be connected.'
      }, '*');
    }
  }

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${OVERLAY_ID} {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        display: none !important;
        overflow: hidden !important;
        background: #000 !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: 2147483646 !important;
      }
      #${OVERLAY_ID}.is-visible {
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }
      #${OVERLAY_ID} iframe {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        display: block !important;
        border: 0 !important;
        background: #000 !important;
        z-index: 2 !important;
      }
      body.${ACTIVE_CLASS} {
        overflow: hidden !important;
      }
      body.${ACTIVE_CLASS} #dragonboundOverlay {
        z-index: 2147483645 !important;
      }
      .${BUTTON_CLASS} {
        position: absolute !important;
        right: clamp(188px, 14vw, 224px) !important;
        bottom: 18px !important;
        width: clamp(142px, 12vw, 184px) !important;
        height: auto !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 10px !important;
        background: transparent !important;
        box-shadow: none !important;
        cursor: pointer !important;
        z-index: 260010 !important;
        transition: transform 150ms ease, filter 150ms ease !important;
      }
      .${BUTTON_CLASS}:hover,
      .${BUTTON_CLASS}:focus-visible {
        background: transparent !important;
        border-color: transparent !important;
        box-shadow: none !important;
        transform: translateY(-2px) scale(1.025) !important;
        filter: brightness(1.09) drop-shadow(0 5px 9px rgba(33, 220, 193, .34)) !important;
        outline: none !important;
      }
      .${BUTTON_CLASS}:active {
        transform: translateY(0) scale(.985) !important;
      }
      .${BUTTON_CLASS} img {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        pointer-events: none !important;
      }
      @media (max-width: 760px) {
        .${BUTTON_CLASS} {
          right: 148px !important;
          bottom: 14px !important;
          width: 132px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'dragonbound-career-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<iframe title="Dragonbound Career Mode" allow="autoplay; fullscreen" referrerpolicy="same-origin"></iframe>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function ensureLauncher() {
    const scene = document.querySelector('#dragonboundOverlay .dragonbound-home-scene');
    if (!scene) return null;
    let button = scene.querySelector(`.${BUTTON_CLASS}`);
    if (button) return button;
    button = document.createElement('button');
    button.type = 'button';
    button.className = BUTTON_CLASS;
    button.setAttribute('aria-label', 'Open Dragonbound Career Mode');
    button.innerHTML = '<img src="assets/dragonbound/career-mode/launcher.png" alt="Dragonbound Career Mode">';
    button.addEventListener('click', openCareer);
    scene.appendChild(button);
    return button;
  }

  function pauseHouse() {
    state.parentLoops = Array.from(document.querySelectorAll('audio, video'))
      .filter(media => !media.paused && media.loop)
      .map(media => ({ media, time: Number(media.currentTime) || 0 }));
    document.querySelectorAll('audio, video').forEach(media => {
      try { media.pause(); } catch (_) {}
    });

    const engine = window.DragonboundBabyEngine;
    state.engineWasRunning = !!engine?.raf;
    try { engine?.stop?.(); } catch (error) {
      console.warn('[Dragonbound Career Mode] House engine could not pause cleanly.', error);
      try { engine?.homeMusic?.pause?.(); } catch (_) {}
    }
  }

  function restoreHouse() {
    const engine = window.DragonboundBabyEngine;
    if (state.engineWasRunning) {
      try {
        engine?.start?.();
        engine?.syncHomeMusic?.(true);
      } catch (error) {
        console.warn('[Dragonbound Career Mode] House engine could not resume cleanly.', error);
      }
    }
    state.parentLoops.forEach(({ media, time }) => {
      if (!media?.isConnected || media === engine?.homeMusic) return;
      try {
        media.currentTime = time;
        const result = media.play();
        result?.catch?.(() => undefined);
      } catch (_) {}
    });
    state.parentLoops = [];
    state.engineWasRunning = false;
  }

  function openCareer() {
    if (state.open) return;
    const overlay = ensureOverlay();
    const frame = overlay.querySelector('iframe');
    state.open = true;
    const bridgeValues = new Uint32Array(4);
    window.crypto.getRandomValues(bridgeValues);
    state.bridgeToken = Array.from(bridgeValues, value => value.toString(16).padStart(8, '0')).join('');
    state.previousFocus = document.activeElement;
    pauseHouse();
    document.body.classList.add(ACTIVE_CLASS);
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
    if (!frame.dataset.loaded || frame.src === 'about:blank') {
      frame.src = `${CAREER_URL}&bridge=${encodeURIComponent(state.bridgeToken)}`;
      frame.dataset.loaded = 'true';
    }
    try { frame.focus({ preventScroll: true }); } catch (_) {}
    window.dispatchEvent(new CustomEvent('dragonbound:career-opened'));
  }

  function closeCareer() {
    if (!state.open) return;
    const overlay = ensureOverlay();
    const frame = overlay.querySelector('iframe');
    state.open = false;
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove(ACTIVE_CLASS);
    try { frame.contentWindow?.postMessage({ type: 'dragonbound-career-suspend' }, '*'); } catch (_) {}
    frame.src = 'about:blank';
    delete frame.dataset.loaded;
    state.bridgeToken = '';
    restoreHouse();
    try { state.previousFocus?.focus?.({ preventScroll: true }); } catch (_) {}
    window.dispatchEvent(new CustomEvent('dragonbound:career-closed'));
  }

  window.addEventListener('message', event => {
    const frame = document.getElementById(OVERLAY_ID)?.querySelector('iframe');
    if (!frame?.contentWindow || event.source !== frame.contentWindow) return;
    if (!event.data?.bridge || event.data.bridge !== state.bridgeToken) return;
    if (event.data?.type === 'dragonbound-career-auth-request') {
      void sendCareerSession(frame, event.data.bridge);
      return;
    }
    if (event.data?.type === 'dragonbound-career-close') closeCareer();
  });

  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state.open) {
      event.preventDefault();
      closeCareer();
    }
  }, true);

  window.addEventListener('beforeunload', () => {
    if (state.open) {
      try { window.DragonboundBabyEngine?.saveBehaviour?.(true); } catch (_) {}
    }
  });

  installStyles();
  ensureOverlay();
  if (!ensureLauncher()) {
    const observer = new MutationObserver(() => {
      if (ensureLauncher()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.DragonboundCareerMode = { open: openCareer, close: closeCareer, isOpen: () => state.open };
})();
