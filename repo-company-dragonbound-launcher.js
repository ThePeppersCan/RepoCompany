(() => {
  'use strict';

  const localPreview = location.hostname === '127.0.0.1' || location.hostname === 'localhost';
  const DRAGONBOUND_ORIGIN = localPreview ? 'http://127.0.0.1:4180' : 'https://dragonbound.repocompany.uk';
  const SUPABASE_URL = 'https://hvdrwmjieguurxvrgzfu.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_bln84LaJ8iYmnkYK9mh0Pg_XxP7O1OZ';
  const OVERLAY_ID = 'dragonboundStandaloneOverlay';
  let client = null;
  let frame = null;
  let bridge = '';
  let pausedAudio = [];

  function accountClient() {
    if (window.repoSupabaseClient?.auth?.getSession) return window.repoSupabaseClient;
    if (client) return client;
    if (!window.supabase?.createClient) return null;
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    return client;
  }

  function nonce() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const values = new Uint32Array(4);
    window.crypto?.getRandomValues?.(values);
    return Array.from(values, value => value.toString(16)).join('-') || String(Date.now());
  }

  function installStyles() {
    if (document.getElementById('dragonboundStandaloneLauncherStyles')) return;
    const style = document.createElement('style');
    style.id = 'dragonboundStandaloneLauncherStyles';
    style.textContent = `
      #${OVERLAY_ID}{position:fixed;inset:0;z-index:2147483646;display:none!important;background:#02070a}
      #${OVERLAY_ID}.is-visible{display:block!important}
      #${OVERLAY_ID} iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#02070a}
      #${OVERLAY_ID} .dragonbound-launch-loading{position:absolute;inset:0;z-index:2;display:grid;place-content:center;gap:13px;background:radial-gradient(circle at 50% 38%,#17382f,#02070a 68%);color:#dff8ef;text-align:center;font:800 11px/1.4 Arial,sans-serif;letter-spacing:.18em;transition:opacity .3s ease}
      #${OVERLAY_ID} .dragonbound-launch-loading::before{content:"";width:38px;height:38px;margin:auto;border:2px solid rgba(119,212,184,.17);border-top-color:#77d4b8;border-radius:50%;animation:dragonboundLaunchSpin .8s linear infinite}
      #${OVERLAY_ID}.is-loaded .dragonbound-launch-loading{opacity:0;pointer-events:none}
      body.dragonbound-standalone-active{overflow:hidden!important}
      @keyframes dragonboundLaunchSpin{to{transform:rotate(360deg)}}
    `;
    document.head.appendChild(style);
  }

  function ensureOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;
    overlay = document.createElement('section');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<div class="dragonbound-launch-loading" role="status">ENTERING DRAGONBOUND</div><iframe title="Dragonbound" allow="autoplay; fullscreen" referrerpolicy="strict-origin"></iframe>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function pausePageAudio() {
    pausedAudio = [...document.querySelectorAll('audio')].filter(audio => !audio.paused);
    pausedAudio.forEach(audio => audio.pause());
  }

  function resumePageAudio() {
    pausedAudio.forEach(audio => audio.play().catch(() => {}));
    pausedAudio = [];
  }

  async function sendSession() {
    if (!frame?.contentWindow || !bridge) return;
    let message = { type: 'dragonbound-app-auth', bridge, error: 'Sign in to Repo Company before opening Dragonbound.' };
    try {
      const auth = accountClient();
      if (auth) {
        const result = await auth.auth.getSession();
        if (result.error) throw result.error;
        const session = result.data?.session;
        if (session?.access_token && session?.refresh_token) {
          message = {
            type: 'dragonbound-app-auth',
            bridge,
            accessToken: session.access_token,
            refreshToken: session.refresh_token
          };
        }
      }
    } catch (error) {
      message.error = error?.message || 'Your Repo Company account could not be connected.';
    }
    frame.contentWindow.postMessage(message, DRAGONBOUND_ORIGIN);
  }

  function open(event) {
    if (event && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button === 1)) return;
    event?.preventDefault();
    event?.stopPropagation();
    event?.stopImmediatePropagation();
    installStyles();
    const overlay = ensureOverlay();
    bridge = nonce();
    frame = overlay.querySelector('iframe');
    overlay.classList.remove('is-loaded');
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('dragonbound-standalone-active');
    pausePageAudio();
    const url = new URL(DRAGONBOUND_ORIGIN + '/');
    url.searchParams.set('source', 'repocompany');
    url.searchParams.set('repoBridge', bridge);
    if (localPreview) url.searchParams.set('repoOrigin', location.origin);
    frame.src = url.href;
  }

  function close() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;
    overlay.classList.remove('is-visible', 'is-loaded');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('dragonbound-standalone-active');
    if (frame) frame.src = 'about:blank';
    frame = null;
    bridge = '';
    resumePageAudio();
    document.getElementById('openDragonbound')?.focus();
  }

  window.addEventListener('message', event => {
    if (event.origin !== DRAGONBOUND_ORIGIN || event.source !== frame?.contentWindow) return;
    const data = event.data || {};
    if (data.bridge !== bridge) return;
    if (data.type === 'dragonbound-app-ready') {
      document.getElementById(OVERLAY_ID)?.classList.add('is-loaded');
      void sendSession();
    }
    if (data.type === 'dragonbound-app-close') close();
  });

  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !document.getElementById(OVERLAY_ID)?.classList.contains('is-visible')) return;
    event.preventDefault();
    close();
  }, true);

  document.addEventListener('click', event => {
    if (event.target.closest?.('#openDragonbound')) open(event);
  }, true);

  installStyles();
  ensureOverlay();
  window.DragonboundStandaloneLauncher = { open, close };
})();
