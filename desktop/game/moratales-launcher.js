/* Installed MoraTales only. Loaded before the original game scripts, after
 * account-scoped storage. The prepared game exposes its existing save paths. */
(function installMoratalesLauncher(root) {
  'use strict';
  if (root.REPO_LAUNCHER_GAME || root.REPO_LAUNCHER_CONTEXT?.gameId !== 'moratales') return;
  const native = root.REPO_LAUNCHER, accountId = root.REPO_LAUNCHER_CONTEXT.accountId;
  const nativeFrame = root.requestAnimationFrame.bind(root), nativeCancel = root.cancelAnimationFrame.bind(root);
  const frames = new Map();
  let nextFrame = 0, blocked = true, reason = 'checking', terminal = false, disposed = false, epoch = 0;
  let saving = null, closing = false, modal, title, message, status, retry, signIn, unsubscribe;

  // The town and journey advance in animation frames. Hold callbacks while the
  // verified connection is unavailable; keep IPC/save/character-sync timers live.
  function schedule(id, item) {
    if (blocked || disposed || item.native !== null) return;
    item.native = nativeFrame(time => {
      item.native = null;
      if (!frames.has(id) || disposed) return;
      if (blocked) return;
      frames.delete(id); item.callback(time);
    });
  }
  root.requestAnimationFrame = callback => {
    const id = ++nextFrame, item = { callback, native: null }; frames.set(id, item); schedule(id, item); return id;
  };
  root.cancelAnimationFrame = id => {
    const item = frames.get(id); if (item?.native !== null && item?.native !== undefined) nativeCancel(item.native); frames.delete(id);
  };
  function pauseSimulation() {
    for (const item of frames.values()) if (item.native !== null) { nativeCancel(item.native); item.native = null; }
    root.__velmoraTown?.nativePause?.();
    root.MORATALES_COOP?.nativePause?.();
    for (const media of document.querySelectorAll('audio,video')) if (!media.paused) media.pause();
  }
  function element(tag, text) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; }
  function showGate() {
    if (!document.body || disposed) return;
    if (!modal) {
      const style = element('style');
      style.textContent = '#repo-moratales-gate{box-sizing:border-box;width:min(470px,calc(100vw - 40px));padding:30px;color:#eee9dc;background:#17251d;border:1px solid #b6a77d;border-radius:16px;font:15px/1.55 system-ui,sans-serif;box-shadow:0 24px 100px #0009}#repo-moratales-gate::backdrop{background:#07100ddd;backdrop-filter:blur(6px)}#repo-moratales-gate h2{font-size:25px;line-height:1.25;margin:0 0 14px}#repo-moratales-gate p{color:#c4cdbf}#repo-moratales-gate button{font:600 13px system-ui;border:1px solid #cab78688;border-radius:7px;padding:11px 14px;background:#d2bd8e;color:#19251c;cursor:pointer;margin:8px 8px 0 0}#repo-moratales-gate button:focus-visible{outline:3px solid #f4dea6;outline-offset:3px}#repo-moratales-gate button:disabled{opacity:.55;cursor:wait}#repo-moratales-gate [role=status]{min-height:22px;font-size:12px}';
      document.head.append(style); modal = element('dialog'); modal.id = 'repo-moratales-gate';
      title = element('h2'); title.id = 'repo-moratales-gate-title'; modal.setAttribute('aria-labelledby', title.id);
      message = element('p'); status = element('p'); status.setAttribute('role', 'status');
      retry = element('button', 'Reconnect'); retry.type = 'button'; retry.onclick = () => { void check(); };
      signIn = element('button', 'Return to sign in'); signIn.type = 'button'; signIn.onclick = () => { void leave('account'); };
      const exit = element('button', 'Back to Repo Company'); exit.type = 'button'; exit.onclick = () => { void leave('exit'); };
      modal.append(title, message, retry, signIn, exit, status); document.body.append(modal);
      modal.addEventListener('cancel', event => event.preventDefault());
      for (const name of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click']) modal.addEventListener(name, event => event.stopPropagation());
    }
    const copy = {
      checking: ['Checking your connection', 'MoraTales needs an internet connection and your signed-in Repo Company account.'],
      offline: ['Your adventure is paused', 'Reconnect to continue with this account. Your local adventure stays on this computer.'],
      'signed-out': ['Sign in to continue', 'Return to Repo Company and sign in again. Your adventure stays with the account that started it.'],
      'account-changed': ['Your account has changed', 'Return to Repo Company before starting another adventure. This window keeps the original account’s saved progress.'],
      saving: ['Saving your adventure', 'Keep this window open while MoraTales finishes saving.'],
      'save-error': ['Your adventure needs a moment', 'The game could not finish saving. Continue the current action, then try leaving again.']
    }[reason] || ['Your adventure is paused', 'Reconnect to continue.'];
    title.textContent = copy[0]; message.textContent = copy[1];
    retry.hidden = terminal || reason === 'saving'; retry.disabled = reason === 'checking';
    signIn.hidden = !terminal;
    if (blocked && !modal.open) modal.showModal(); else if (!blocked && modal.open) modal.close();
  }
  function setConnection(value) {
    if (disposed) return;
    epoch++;
    const valid = value?.status === 'online' && value.accountId === accountId && !!accountId;
    const changed = value?.status === 'account-changed' || (value?.accountId && value.accountId !== accountId);
    if (changed || value?.status === 'signed-out') terminal = true;
    blocked = !valid || terminal || closing;
    reason = terminal ? changed || reason === 'account-changed' ? 'account-changed' : 'signed-out' : closing ? 'saving' : valid ? 'online' : 'offline';
    if (blocked) { pauseSimulation(); void flushSave().catch(error => { if (status) status.textContent = error.message; }); }
    else for (const [id, item] of frames) schedule(id, item);
    showGate();
  }
  async function check() {
    if (disposed || terminal || closing) return false;
    const request = ++epoch;
    try {
      const value = await native.checkConnection();
      if (disposed) return false;
      // Main broadcasts the fresh verified account before resolving this IPC.
      // A newer event wins; return its state without applying the stale result.
      if (request !== epoch) return !blocked && !terminal && !closing;
      setConnection(value); return !blocked;
    } catch {
      if (!disposed && request === epoch) setConnection({ status: 'offline' });
      return false;
    }
  }
  async function flushSave() {
    if (saving) return saving;
    saving = Promise.resolve().then(async () => {
      if (root.MORATALES_COOP_ACTIVE) {
        if (!root.MORATALES_COOP?.nativeSave) throw Error('The multiplayer save connection is unavailable. Keep this window open.');
        await root.MORATALES_COOP.nativeSave();
      } else if (root.__velmoraTown?.nativeSave) await root.__velmoraTown.nativeSave();
      else if (root.__velmoraTown?.active) throw Error('The game save connection is unavailable. Keep this window open.');
    }).finally(() => { saving = null; });
    return saving;
  }
  async function beforeClose() {
    epoch++; closing = true; blocked = true; if (!terminal) reason = 'saving'; pauseSimulation(); showGate();
    try {
      await flushSave();
      if (!terminal && root.MORATALES_ACCOUNT_CHARACTERS?.sync) {
        let timer;
        try { await Promise.race([root.MORATALES_ACCOUNT_CHARACTERS.sync(), new Promise(resolve => { timer = root.setTimeout(resolve, 5000); })]); }
        catch { /* Local saves remain authoritative when the account service is unavailable. */ }
        finally { if (timer !== undefined) root.clearTimeout(timer); }
      }
      return true;
    }
    catch (error) { closing = false; if (!terminal) reason = 'save-error'; showGate(); if (status) status.textContent = error.message; throw error; }
  }
  async function leave(destination) {
    try {
      if (destination === 'account') await native.requestSignIn();
      else if (destination === 'morogue') await native.requestGame('morogue');
      else await native.requestExit();
    } catch (error) { if (status) status.textContent = error.message || 'Keep the game open and try again.'; }
  }

  root.MORATALES_DESKTOP = Object.freeze({
    info: async () => ({ launcher: true, version: 'Repo Company' }),
    online: check,
    activity: () => {} // Activity is local; no Discord integration is advertised.
  });
  // Keep the original title-screen placement and backup UI. Replace only the
  // old standalone ZIP/Discord controls with the shared launcher's options.
  const menu = ({ dialog, modal: openModal, button, dismiss }) => {
    const control = document.getElementById('mm-download'); if (!control) return;
    const label = control.querySelector('span'); if (label) label.textContent = 'Launcher options';
    control.onclick = () => {
      openModal('MoraTales in Repo Company', 'Updates are managed by your Library. Adventures are saved on this computer for the account playing them. Character appearances and achievements sync to your account.');
      button('Import / export my saves', () => { dismiss(); document.querySelector('.save-launch')?.click(); });
      button('Back to Repo Company', () => { void leave('exit'); }); button('Back to game', dismiss);
    };
  };
  Object.defineProperty(root, 'createDesktopMenu', { configurable: true, get: () => menu, set() {} });
  document.addEventListener('click', event => {
    if (!event.target?.closest?.('#mm-vampire,.mm-dashboard')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    void leave(event.target.closest('#mm-vampire') ? 'morogue' : 'exit');
  }, true);
  root.REPO_LAUNCHER_GAME = Object.freeze({ beforeClose, get paused() { return blocked; }, get reason() { return reason; } });
  document.addEventListener('DOMContentLoaded', showGate, { once: true });
  root.addEventListener('offline', () => setConnection({ status: 'offline' }));
  root.addEventListener('online', () => { void check(); });
  root.addEventListener('pagehide', () => {
    disposed = true; epoch++; unsubscribe?.(); root.clearInterval(poll);
    for (const item of frames.values()) if (item.native !== null) nativeCancel(item.native);
    frames.clear();
  }, { once: true });
  unsubscribe = native?.onConnectionChanged?.(setConnection);
  const poll = root.setInterval(() => { void check(); }, 10000);
  showGate(); void check();
})(globalThis);
