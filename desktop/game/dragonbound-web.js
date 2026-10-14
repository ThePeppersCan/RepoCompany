(() => {
  'use strict';

  if (!['https://repocompany.uk', 'https://www.repocompany.uk'].includes(location.origin)) return;
  if (window.DragonboundStandaloneLauncher?.launcherBridgeVersion === 1) return;
  try { window.DragonboundStandaloneLauncher?.close?.(); } catch { /* Replacing an older website launcher revokes its existing frame. */ }
  const DRAGONBOUND_ORIGIN = 'https://dragonbound.repocompany.uk';
  const OVERLAY_ID = 'dragonboundStandaloneOverlay';
  let frame = null;
  let bridge = '';
  let expectedAccountId = '';
  let launchRevision = 0;
  let accountRevision = 0;
  let lastAccountId = websiteAccountId();
  let pausedAudio = [];
  let launchTimer = 0;

  function accountClient() {
    if (window.repoSupabaseClient?.auth?.getSession) return window.repoSupabaseClient;
    return window.repoAccount?.db?.auth?.getSession ? window.repoAccount.db : null;
  }
  function websiteAccountId() { return window.repoAccount?.state?.user?.id || ''; }

  function nonce() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const values = new Uint32Array(4);
    window.crypto.getRandomValues(values);
    return Array.from(values, value => value.toString(16)).join('-');
  }

  function installStyles() {
    if (document.getElementById('dragonboundStandaloneLauncherStyles')) return;
    const style = document.createElement('style');
    style.id = 'dragonboundStandaloneLauncherStyles';
    style.textContent = `
      #${OVERLAY_ID}{position:fixed;inset:0;z-index:2147483646;display:block!important;background:#02070a}
      #${OVERLAY_ID}[hidden]{display:none!important}
      #${OVERLAY_ID} iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#02070a}
      #${OVERLAY_ID} .dragonbound-launch-loading{position:absolute;inset:0;z-index:2;display:grid;place-content:center;gap:13px;background:radial-gradient(circle at 50% 38%,#17382f,#02070a 68%);color:#dff8ef;text-align:center;font:800 11px/1.4 Arial,sans-serif;letter-spacing:.18em;transition:opacity .3s ease}
      #${OVERLAY_ID} .dragonbound-launch-loading::before{content:"";width:38px;height:38px;margin:auto;border:2px solid rgba(119,212,184,.17);border-top-color:#77d4b8;border-radius:50%;animation:dragonboundLaunchSpin .8s linear infinite}
      #${OVERLAY_ID} .dragonbound-launch-message{max-width:420px;padding:0 24px}
      #${OVERLAY_ID} .dragonbound-launch-actions{display:none;justify-content:center;gap:18px;margin-top:8px}
      #${OVERLAY_ID} .dragonbound-launch-actions button{border:0;border-bottom:1px solid rgba(223,248,239,.55);padding:7px 2px;background:transparent;color:#dff8ef;font:800 11px/1 Arial,sans-serif;letter-spacing:.12em;cursor:pointer}
      #${OVERLAY_ID} .dragonbound-launch-actions button:hover,#${OVERLAY_ID} .dragonbound-launch-actions button:focus-visible{color:#77d4b8;border-color:#77d4b8;outline:0}
      #${OVERLAY_ID}.has-error .dragonbound-launch-loading::before{animation:none;border-color:#77d4b8;opacity:.55}
      #${OVERLAY_ID}.has-error .dragonbound-launch-actions{display:flex}
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
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<div class="dragonbound-launch-loading" role="status"><div class="dragonbound-launch-message">ENTERING DRAGONBOUND</div><div class="dragonbound-launch-actions"><button type="button" data-dragonbound-retry>RETRY</button><button type="button" data-dragonbound-close>RETURN TO REPO COMPANY</button></div></div><iframe title="Dragonbound" allow="autoplay; fullscreen" referrerpolicy="strict-origin"></iframe>';
    document.body.appendChild(overlay);
    overlay.querySelector('[data-dragonbound-retry]').addEventListener('click', loadDragonbound);
    overlay.querySelector('[data-dragonbound-close]').addEventListener('click', close);
    return overlay;
  }

  function clearLaunchTimer() {
    if (!launchTimer) return;
    window.clearTimeout(launchTimer);
    launchTimer = 0;
  }

  function showLaunchError() {
    launchTimer = 0;
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay || overlay.hidden) return;
    const message = 'DRAGONBOUND DID NOT ANSWER. CHECK YOUR CONNECTION.';
    const messageNode = overlay.querySelector('.dragonbound-launch-message');
    if (messageNode) messageNode.textContent = message;
    overlay.classList.add('has-error');
  }

  function loadDragonbound() {
    if (!expectedAccountId || websiteAccountId() !== expectedAccountId) { close(); return; }
    const overlay = ensureOverlay();
    launchRevision++;
    frame = overlay.querySelector('iframe');
    bridge = nonce();
    clearLaunchTimer();
    overlay.classList.remove('is-loaded', 'has-error');
    const messageNode = overlay.querySelector('.dragonbound-launch-message');
    if (messageNode) messageNode.textContent = 'ENTERING DRAGONBOUND';
    const url = new URL(DRAGONBOUND_ORIGIN + '/');
    url.searchParams.set('source', 'repocompany');
    url.searchParams.set('repoBridge', bridge);
    url.searchParams.set('launchAttempt', String(Date.now()));
    frame.src = url.href;
    const currentRevision = launchRevision;
    launchTimer = window.setTimeout(() => { if (launchRevision === currentRevision) showLaunchError(); }, 12000);
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
    const targetFrame = frame;
    const targetWindow = targetFrame?.contentWindow;
    const targetBridge = bridge;
    const targetAccountId = expectedAccountId;
    const targetSource = targetFrame?.src;
    const targetOverlay = document.getElementById(OVERLAY_ID);
    const targetRevision = launchRevision;
    const targetAccountRevision = accountRevision;
    const auth = accountClient();
    const stillCurrent = () => Boolean(targetFrame && targetWindow && targetBridge && targetAccountId &&
      frame === targetFrame && frame.contentWindow === targetWindow && frame.src === targetSource &&
      bridge === targetBridge && expectedAccountId === targetAccountId &&
      launchRevision === targetRevision && accountRevision === targetAccountRevision &&
      websiteAccountId() === targetAccountId && accountClient() === auth &&
      targetOverlay && document.getElementById(OVERLAY_ID) === targetOverlay &&
      !targetOverlay.hidden && targetOverlay.classList.contains('is-visible'));
    if (!stillCurrent()) return;
    let message = { type: 'dragonbound-app-auth', bridge: targetBridge, error: 'Sign in to Repo Company before opening Dragonbound.' };
    try {
      if (auth) {
        const result = await auth.auth.getSession();
        if (!stillCurrent()) return;
        if (result.error) throw result.error;
        const session = result.data?.session;
        if (session && session.user?.id !== targetAccountId) return;
        if (session?.access_token && session?.refresh_token) {
          message = {
            type: 'dragonbound-app-auth',
            bridge: targetBridge,
            accessToken: session.access_token,
            refreshToken: session.refresh_token
          };
        }
      }
    } catch {
      if (!stillCurrent()) return;
      message.error = 'Your Repo Company account could not be connected.';
    }
    if (!stillCurrent()) return;
    try { targetWindow.postMessage(message, DRAGONBOUND_ORIGIN); } catch { /* Closing frames receive no late credentials. */ }
  }

  function open(options = {}) {
    const accountId = options?.accountId;
    if (typeof accountId !== 'string' || !accountId || accountId.length > 256 || websiteAccountId() !== accountId) throw new Error('Sign in to the verified Repo Company account before opening Dragonbound.');
    if (frame) close();
    expectedAccountId = accountId;
    lastAccountId = accountId;
    launchRevision++;
    installStyles();
    const overlay = ensureOverlay();
    overlay.hidden = false;
    // Repo Company's signed-out shell deliberately hides nearly every direct
    // body child with a high-specificity !important rule. An inline priority
    // keeps the launcher usable during auth-state transitions as well.
    overlay.style.setProperty('display', 'block', 'important');
    overlay.classList.remove('is-loaded', 'has-error');
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('dragonbound-standalone-active');
    pausePageAudio();
    loadDragonbound();
  }

  function close() {
    launchRevision++;
    const overlay = document.getElementById(OVERLAY_ID);
    clearLaunchTimer();
    const closingFrame = frame || overlay?.querySelector('iframe');
    overlay?.classList.remove('is-visible', 'is-loaded');
    overlay?.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.hidden = true;
    document.body.classList.remove('dragonbound-standalone-active');
    frame = null;
    bridge = '';
    expectedAccountId = '';
    // Remove the cross-origin frame rather than navigating it to about:blank.
    // This makes it impossible for a stale full-screen black iframe to remain
    // above the Repo Company dashboard after Dragonbound closes.
    closingFrame?.removeAttribute('src');
    overlay?.remove();
    resumePageAudio();
    requestAnimationFrame(() => document.getElementById('openDragonbound')?.focus({ preventScroll: true }));
  }

  window.addEventListener('message', event => {
    if (!expectedAccountId || websiteAccountId() !== expectedAccountId) return;
    if (event.origin !== DRAGONBOUND_ORIGIN || event.source !== frame?.contentWindow) return;
    const data = event.data || {};
    if (data.bridge !== bridge) return;
    if (data.type === 'dragonbound-app-ready') {
      clearLaunchTimer();
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

  window.addEventListener('repo-account-state', () => {
    const current = websiteAccountId();
    if (current === lastAccountId) return;
    lastAccountId = current; accountRevision++;
    if (expectedAccountId && current !== expectedAccountId) close();
  });

  installStyles();
  ensureOverlay();
  window.DragonboundStandaloneLauncher = Object.freeze({ open, close, launcherBridgeVersion: 1 });
})();
