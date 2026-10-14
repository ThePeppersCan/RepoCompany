(function () {
  'use strict';
  const context = window.REPO_LAUNCHER_CONTEXT, native = window.REPO_LAUNCHER;
  if (!context || context.gameId !== 'manager') return;
  const identity = String(context.accountId || '');
  const validIdentity = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identity);
  let paused = true, terminal = false, connection = 'checking', revision = 0, attempt = null;
  let store, cloud, started = false, startCalled = false, finishBootstrap, gate, title, detail, retry, signIn;
  let unsubscribe, timer, cloudUnsubscribe, closed = false, closing = false, closeReady = false, storageError;
  const bootstrapReady = new Promise(resolve => { finishBootstrap = resolve; });

  // Runs in the head, before career-storage or any game script can open the
  // database or migrate legacy localStorage slots. Browser data stays intact.
  try {
    if (!validIdentity || !native?.requestSession || !native?.checkConnection) throw new Error('Launch Manager again from your signed-in library.');
    const factory = window.indexedDB;
    if (!factory) throw new Error('Career storage is unavailable.');
    const prefix = `repo-launcher-account-v1:${identity}:`;
    for (const method of ['open', 'deleteDatabase']) {
      const original = factory[method].bind(factory);
      Object.defineProperty(factory, method, { configurable: false, value(name, ...args) { return original(prefix + String(name), ...args); } });
    }
    if (factory.databases) {
      const list = factory.databases.bind(factory);
      Object.defineProperty(factory, 'databases', { configurable: false, value: async () => (await list()).filter(item => item.name?.startsWith(prefix)).map(item => ({ ...item, name: item.name.slice(prefix.length) })) });
    }
  } catch (error) { storageError = error; terminal = true; }

  function mount() {
    if (gate || !document.body) return;
    const style = document.createElement('style');
    style.textContent = '#repo-manager-gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:rgba(5,10,18,.94);font:16px/1.6 system-ui,sans-serif;color:#f5f6fa;padding:24px;box-sizing:border-box}#repo-manager-gate[hidden]{display:none}#repo-manager-gate section{max-width:530px;padding:38px;border:1px solid #354252;border-radius:16px;background:#111c29;box-shadow:0 24px 100px #0008}#repo-manager-gate small{font-size:11px;letter-spacing:.17em;color:#a9bcce}#repo-manager-gate h1{font-size:28px;line-height:1.2;margin:12px 0}#repo-manager-gate p{color:#becbda;margin:0 0 24px}#repo-manager-gate footer{display:flex;flex-wrap:wrap;gap:10px}#repo-manager-gate button{background:#d8eaa9;color:#152313;padding:11px 18px;border:0;border-radius:8px;cursor:pointer;font:600 14px system-ui}#repo-manager-gate button.secondary{background:#243447;color:#edf3fa}#repo-manager-gate button:disabled{opacity:.6;cursor:wait}#repo-manager-gate button:focus-visible{outline:3px solid #fff;outline-offset:3px}';
    document.head.appendChild(style);
    gate = document.createElement('div'); gate.id = 'repo-manager-gate';
    gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true'); gate.setAttribute('aria-labelledby', 'repo-manager-gate-title');
    gate.innerHTML = '<section><small>REPO COMPANY · VELMORA MANAGER</small><h1 id="repo-manager-gate-title"></h1><p data-detail></p><footer><button data-retry>Reconnect</button><button data-signin class="secondary">Sign in</button><button data-exit class="secondary">Back to library</button></footer></section>';
    document.body.appendChild(gate); title = gate.querySelector('h1'); detail = gate.querySelector('[data-detail]'); retry = gate.querySelector('[data-retry]'); signIn = gate.querySelector('[data-signin]');
    retry.addEventListener('click', () => { void resume(); });
    signIn.addEventListener('click', () => { void leave('requestSignIn'); });
    gate.querySelector('[data-exit]').addEventListener('click', () => { void leave('requestExit'); });
    render();
  }
  function render(message) {
    if (!gate) return;
    gate.hidden = !paused;
    title.textContent = terminal ? 'Return to your library' : connection === 'checking' ? 'Connecting your career' : started ? 'Career paused' : 'Your career is waiting';
    detail.textContent = message || (storageError ? storageError.message : terminal ? 'Your signed-in account changed. Your career is kept with the account that opened it. Sign in and launch Manager again.' : connection === 'checking' ? 'Checking your account and cloud careers…' : 'Reconnect to continue with your account. Your existing careers have not been removed.');
    retry.hidden = terminal; retry.disabled = !!attempt || closing; retry.textContent = started ? 'Reconnect and resume' : 'Try again';
    signIn.hidden = !terminal && connection !== 'signed-out';
  }
  function setPaused(value) {
    if (paused === value) return;
    paused = value;
    window.VelmoraQuidditchEngine?.rebaseLauncherClock?.();
    if (value) document.querySelectorAll('audio,video').forEach(media => { try { media.pause(); } catch (_) {} });
    render();
  }
  function connectionChanged(state) {
    if (closed) return;
    const status = state?.status;
    if (status === 'account-changed' || status === 'signed-out' || state?.accountId && state.accountId !== identity) {
      revision++; terminal = true; connection = status || 'account-changed'; setPaused(true); cloud?.destroy?.(); render(); return;
    }
    if (status !== 'online') { revision++; connection = 'offline'; setPaused(true); render(); }
    // An online event never resumes a paused game. The player explicitly
    // reconnects after the native account and cloud check have both succeeded.
  }
  function assertCurrent(ticket, allowClosing = false) {
    if (closed || terminal || closing && !allowClosing || ticket !== revision) throw new Error('Your account or connection changed. Reconnect from your library.');
  }
  async function session(ticket = revision, allowClosing = false) {
    assertCurrent(ticket, allowClosing);
    const result = await native.requestSession();
    assertCurrent(ticket, allowClosing);
    if (!result?.access_token || result.user?.id !== identity) {
      connectionChanged({ status: 'account-changed' });
      throw new Error('Please sign in again from your library.');
    }
    return result;
  }
  async function check(ticket) {
    const state = await native.checkConnection(); assertCurrent(ticket);
    if (state?.status !== 'online' || state.accountId !== identity) {
      connectionChanged(state); throw new Error('Connect to the internet and sign in to continue.');
    }
    return session(ticket);
  }
  async function initialise(ticket, verifiedSession) {
    if (!store) {
      if (!window.VelmoraCareerStorage || !window.VelmoraCloudSaves || !window.supabase) throw new Error('Manager could not finish loading. Repair it from your library.');
      store = window.VelmoraCareerStorage.create({ indexedDB: window.indexedDB, localStorage: window.localStorage, codec: window.VelmoraSaveCodec });
      window.VelmoraCareerStore = store;
    }
    await store.ready; assertCurrent(ticket);
    if (!cloud) {
      const service = window.VelmoraCloudSaves;
      const client = window.supabase.createClient(service.SUPABASE_URL, service.SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        // Closing still needs authenticated cloud writes. Only this private
        // save transport may obtain a token while closing; resume/bootstrap
        // cannot pass the same closing guard.
        accessToken: async () => (await session(revision, true)).access_token
      });
      cloud = service.create({ window, document, store, codec: window.VelmoraSaveCodec, client, session: { user: verifiedSession.user } });
      window.VelmoraCloudSaveManager = cloud;
      cloudUnsubscribe = cloud.subscribe(state => {
        if (state.error || state.setupRequired || state.mode === 'offline') {
          connection = 'cloud-error'; setPaused(true);
          render('Your career is safe on this device, but its cloud copy needs attention. Try again to continue.');
        }
      });
      await cloud.ready;
    } else if (!await cloud.syncNow()) throw new Error('Cloud careers could not be checked. Try again to continue.');
    assertCurrent(ticket);
    const status = cloud.status();
    if (!status.connected || status.error || status.setupRequired || status.mode === 'local-only' || cloud.user()?.id !== identity) throw new Error('Your cloud careers could not be checked. Try again to continue.');
  }
  function resume() {
    if (attempt) return attempt;
    if (terminal || storageError || closed || closing) { render(); return Promise.resolve(false); }
    const ticket = revision;
    connection = 'checking'; render();
    attempt = (async () => {
      try {
        const verified = await check(ticket);
        await initialise(ticket, verified);
        assertCurrent(ticket);
        connection = 'online'; setPaused(false); started = true;
        finishBootstrap();
        return true;
      } catch (error) {
        setPaused(true);
        if (!terminal) connection = 'offline';
        render(error?.message || 'Connection failed. Try again.');
        return false;
      } finally { attempt = null; if (retry) retry.disabled = closing; }
    })();
    if (retry) retry.disabled = true;
    return attempt;
  }
  let saving;
  function beforeClose() {
    if (saving) return saving;
    if (closeReady) return Promise.resolve(true);
    // Invalidate a reconnect before any await in the durable-save path. A
    // previous native account response must never unlock input during closing.
    closing = true; revision++;
    setPaused(true); render();
    saving = (async () => {
      try {
        await window.REPO_MANAGER_CAREER?.save?.();
        if (store) await store.flush();
        // Losing the connection must not trap a player in the window. Durable
        // account-scoped local careers are reconciled on the next signed-in boot.
        if (cloud && !terminal && connection === 'online') await cloud.flush();
        closeReady = true;
        return true;
      } catch (error) {
        closing = false;
        render('Your latest career changes could not be saved. Keep Manager open and try again.');
        throw error;
      } finally { saving = null; }
    })();
    return saving;
  }
  async function leave(method) {
    // Native window navigation invokes beforeClose exactly once and only closes
    // after it resolves; avoid creating a second career/cloud revision here.
    try { await native[method](); }
    catch (error) { setPaused(true); render(error?.message || 'Save failed. Keep Manager open and try again.'); }
  }
  Object.defineProperty(window, 'REPO_MANAGER_LAUNCHER', { value: Object.freeze({ get paused() { return paused; }, bootstrap() { if (!startCalled) { startCalled = true; void resume(); } return bootstrapReady; } }) });
  window.REPO_LAUNCHER_GAME = Object.freeze({ beforeClose, connectionChanged });
  // Capture game input while paused, including shortcuts beneath the overlay.
  for (const type of ['click', 'pointerdown', 'keydown', 'keyup', 'submit']) document.addEventListener(type, event => {
    if (paused && !gate?.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('click', event => {
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor) return;
    try {
      const url = new URL(anchor.href);
      if (url.origin !== 'https://repocompany.uk' || url.pathname !== '/') return;
      event.preventDefault(); event.stopImmediatePropagation();
      void leave(anchor.hasAttribute('data-cloud-login') ? 'requestSignIn' : 'requestExit');
    } catch (_) {}
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
  window.addEventListener('offline', () => connectionChanged({ status: 'offline' }));
  if (!storageError) {
    unsubscribe = native.onConnectionChanged?.(connectionChanged);
    timer = window.setInterval(() => {
      const ticket = revision;
      void native.checkConnection().then(state => { if (!closed && ticket === revision) connectionChanged(state); }).catch(() => { if (!closed && ticket === revision) connectionChanged({ status: 'offline' }); });
    }, 15000);
  }
  window.addEventListener('pagehide', () => { closed = true; revision++; clearInterval(timer); unsubscribe?.(); cloudUnsubscribe?.(); cloud?.destroy?.(); }, { once: true });
})();
