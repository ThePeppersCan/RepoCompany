/* Launcher-only lifecycle adapter. The installed COMP-RUN files are unchanged.
 * Completed records and settings are already written synchronously by the game;
 * there is no resumable unfinished-run save. The game bundles its account
 * achievement and leaderboard adapters; no account token enters game code. */
(function () {
  'use strict';
  const context = window.REPO_LAUNCHER_CONTEXT, native = window.REPO_LAUNCHER;
  if (context?.gameId !== 'comp-run') return;
  const identity = context.accountId;
  let paused = true, terminal = false, closing = false, closed = false, revision = 0, pending;
  let gate, detail, retry, signIn, unsubscribe;
  const storageReady = window.REPO_LAUNCHER_STORAGE?.accountId === identity;

  function pauseGame() {
    try { document.exitPointerLock?.()?.catch?.(() => {}); } catch (_) {}
    // Use the unchanged game's existing blur/pointer-lock pause behavior.
    window.dispatchEvent(new Event('blur'));
  }
  function render(message) {
    window.dispatchEvent(new Event('repo-game-playtime-visibility'));
    if (!gate) return;
    gate.hidden = !paused;
    detail.textContent = message || (closing ? 'Returning to your library…' : terminal ?
      'Return to your library and launch COMP-RUN with your signed-in account.' :
      'Reconnect to continue. Your completed runs and settings are kept on this device.');
    retry.hidden = terminal || closing; retry.disabled = !!pending;
    signIn.hidden = !terminal || closing;
  }
  function connectionChanged(state) {
    if (closed || closing) return;
    const status = state?.status;
    if (status === 'online' && state.accountId === identity) return;
    revision++;
    if (status === 'account-changed' || status === 'signed-out' || state?.accountId && state.accountId !== identity) terminal = true;
    paused = true; pauseGame(); render();
  }
  function reconnect() {
    if (pending) return pending;
    if (closed || closing || terminal || !storageReady || !native?.checkConnection) return Promise.resolve(false);
    const ticket = revision;
    pending = (async () => {
      try {
        const state = await native.checkConnection();
        if (closed || closing || terminal || ticket !== revision) return false;
        if (state?.status !== 'online' || state.accountId !== identity) { connectionChanged(state); return false; }
        // The player resumes through the game's own Resume control.
        paused = false; render(); return true;
      } catch { connectionChanged({ status: 'offline' }); return false; }
      finally { pending = null; if (retry) retry.disabled = false; }
    })();
    render('Connecting to Repo Company…');
    return pending;
  }
  function beforeClose() {
    closing = paused = true; revision++; pauseGame(); render();
    // No synthetic records, completions or gameplay state are written here.
    return Promise.resolve(true);
  }
  function mount() {
    if (gate || !document.body) return;
    const style = document.createElement('style');
    style.textContent = '#repo-comp-run-gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#08090bf2;color:#f4ecee;font:16px/1.6 system-ui,sans-serif;padding:24px;box-sizing:border-box}#repo-comp-run-gate[hidden]{display:none}#repo-comp-run-gate section{max-width:420px;border:1px solid #ffffff26;background:#111214;padding:32px;border-radius:0}#repo-comp-run-gate h1{font-size:26px;margin:0 0 12px}#repo-comp-run-gate p{color:#a4a6a7;margin:0 0 22px}#repo-comp-run-gate footer{display:flex;flex-wrap:wrap;gap:10px}#repo-comp-run-gate button{border:1px solid #ecebe7;background:#ecebe7;color:#171719;border-radius:0;padding:10px 14px;font:600 14px system-ui;cursor:pointer}#repo-comp-run-gate button:focus-visible{outline:3px solid white;outline-offset:3px}#repo-comp-run-gate button:disabled{opacity:.6}';
    document.head.append(style);
    gate = document.createElement('div'); gate.id = 'repo-comp-run-gate';
    gate.setAttribute('role', 'dialog'); gate.setAttribute('aria-modal', 'true'); gate.setAttribute('aria-labelledby', 'repo-comp-run-gate-title');
    gate.innerHTML = '<section><h1 id="repo-comp-run-gate-title"><img src="/assets/comp-run-logo.png" width="112" alt="COMP-RUN"></h1><p role="status"></p><footer><button data-reconnect>Reconnect</button><button data-signin>Sign in</button><button data-exit>Back to library</button></footer></section>';
    document.body.append(gate); detail = gate.querySelector('p'); retry = gate.querySelector('[data-reconnect]'); signIn = gate.querySelector('[data-signin]');
    retry.addEventListener('click', () => { void reconnect(); });
    signIn.addEventListener('click', () => { void native?.requestSignIn?.().catch(error => render(error.message)); });
    gate.querySelector('[data-exit]').addEventListener('click', () => { void native?.requestExit?.().catch(error => render(error.message)); });
    render();
  }
  window.REPO_LAUNCHER_GAME = Object.freeze({ beforeClose, connectionChanged, get active() { return !paused && !closing && !closed; } });
  for (const type of ['click', 'pointerdown', 'keydown', 'keyup', 'submit']) document.addEventListener(type, event => {
    if(paused&&type==='keydown'&&event.key==='Tab'&&gate){const buttons=[...gate.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled),first=buttons[0],last=buttons.at(-1);if(!gate.contains(document.activeElement)||event.shiftKey&&document.activeElement===first||!event.shiftKey&&document.activeElement===last){event.preventDefault();(event.shiftKey?last:first)?.focus();return;}}
    if (paused && !gate?.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  if (!storageReady || !native?.checkConnection) terminal = true;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
  window.addEventListener('offline', () => connectionChanged({ status: 'offline' }));
  unsubscribe = native?.onConnectionChanged?.(connectionChanged);
  window.addEventListener('pagehide', () => { closed = true; revision++; unsubscribe?.(); }, { once: true });
  void reconnect();
})();
