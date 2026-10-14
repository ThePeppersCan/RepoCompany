/* Installed Morogue only. Load after site-bridge/leaderboards/game, before app.js.
 * The HTTPS game origin and account bridge remain the authority for game data.
 * This adapter never saves a run, creates results, or changes scoring payloads. */
(function installLauncherGate(root) {
  'use strict';
  if (root.MOROGUE_LAUNCHER) return;

  const context = root.REPO_LAUNCHER_CONTEXT;
  const boards = root.MOROGUE_LEADERBOARDS;
  const engine = root.MORATALES_SURVIVOR;
  const bridge = root.MOROGUE_SITE_BRIDGE;
  const expectedAccount = context?.accountId;
  const fetchOriginal = root.fetch;
  const originalCreateBoard = boards?.create;
  const originalCreateGame = engine?.create;
  const originalAccount = bridge?.account;
  const listeners = [];
  const subscriptions = [];
  const controllers = new Set();
  const timers = new Set();
  const clocks = new Set();
  const frames = new Map();
  const requestFrame = root.requestAnimationFrame?.bind(root);
  const cancelFrame = root.cancelAnimationFrame?.bind(root);
  const never = new Promise(() => {});
  let disposed = false, blocked = true, reason = 'checking', auth = null;
  let board = null, game = null, ownedPause = false, pendingBegin = null;
  let permit = false, verifying = null, reconnecting = null, networkEpoch = 0;
  let modal = null, heading, description, retryButton, signInButton, connectButton, statusLine;
  let deferredTransition = null;

  function later(fn, delay) {
    if (disposed) return null;
    const id = root.setTimeout(() => { timers.delete(id); if (!disposed) fn(); }, delay);
    timers.add(id);
    return id;
  }
  function listen(target, name, callback, options) {
    target.addEventListener(name, callback, options);
    listeners.push(() => target.removeEventListener(name, callback, options));
  }
  function report() {
    const detail = { paused: blocked, reason };
    root.dispatchEvent(new CustomEvent('repo-launcher-state', { detail }));
    try { root.REPO_LAUNCHER?.reportState?.(detail)?.catch?.(() => {}); } catch { /* Closing the window needs no recovery. */ }
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className || '';
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function ensureModal() {
    if (modal || !document.body) return;
    const style = node('style');
    style.textContent = `
      #repo-launcher-gate{color:#f2f0e9;background:#151c18;border:1px solid #bba57266;border-radius:18px;padding:0;width:min(470px,calc(100vw - 48px));max-height:calc(100vh - 48px);box-shadow:0 30px 120px #000a;font:15px/1.6 system-ui,sans-serif}
      #repo-launcher-gate::backdrop{background:#070c0be0;backdrop-filter:blur(9px)}
      #repo-launcher-gate .repo-gate-inner{padding:34px}
      #repo-launcher-gate .repo-gate-brand{color:#ceba88;font-size:10px;letter-spacing:.22em;text-transform:uppercase;margin:0 0 26px}
      #repo-launcher-gate .repo-gate-mark{display:grid;place-items:center;width:46px;height:46px;border:1px solid #c7af7466;border-radius:50%;color:#dcc99d;font-size:24px;margin-bottom:18px}
      #repo-launcher-gate h2{font-size:27px;font-weight:650;line-height:1.2;letter-spacing:-.025em;margin:0 0 12px}
      #repo-launcher-gate p{margin:0 0 18px;color:#b9c2b9}
      #repo-launcher-gate .repo-gate-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}
      #repo-launcher-gate button{font:600 13px system-ui,sans-serif;border:1px solid #d9c59166;border-radius:8px;padding:12px 16px;color:#f0eee5;background:#253029;cursor:pointer}
      #repo-launcher-gate button:first-child{background:#d6bf89;border-color:#d6bf89;color:#192219}
      #repo-launcher-gate button:focus-visible{outline:3px solid #f5e1a7;outline-offset:4px}
      #repo-launcher-gate button:disabled{opacity:.55;cursor:wait}
      #repo-launcher-gate button[hidden]{display:none}
      #repo-launcher-gate .repo-gate-status{font-size:12px;color:#b6b6a4;min-height:20px;margin-top:18px;margin-bottom:0}
      #repo-launcher-gate .repo-gate-footnote{font-size:11px;color:#929e95;border-top:1px solid #ffffff12;padding-top:20px;margin:22px 0 0}
      @media(max-width:480px){#repo-launcher-gate .repo-gate-inner{padding:24px}}
    `;
    document.head.append(style);
    modal = node('dialog');
    modal.id = 'repo-launcher-gate';
    modal.setAttribute('aria-labelledby', 'repo-launcher-gate-title');
    modal.setAttribute('aria-describedby', 'repo-launcher-gate-description');
    const inner = node('div', 'repo-gate-inner');
    heading = node('h2'); heading.id = 'repo-launcher-gate-title';
    description = node('p'); description.id = 'repo-launcher-gate-description';
    const mark = node('div', 'repo-gate-mark', '↗'); mark.setAttribute('aria-hidden', 'true');
    const actions = node('div', 'repo-gate-actions');
    retryButton = node('button', '', 'Reconnect'); retryButton.type = 'button';
    signInButton = node('button', '', 'Return to sign in'); signInButton.type = 'button';
    connectButton = node('button', '', 'Open Moratales'); connectButton.type = 'button';
    const exitButton = node('button', '', 'Back to library'); exitButton.type = 'button';
    retryButton.onclick = () => { void reconnect(); };
    signInButton.onclick = () => leave('sign-in');
    connectButton.onclick = () => { void root.REPO_LAUNCHER?.requestGame('moratales'); };
    exitButton.onclick = () => leave('library');
    statusLine = node('p', 'repo-gate-status'); statusLine.setAttribute('role', 'status');
    actions.append(connectButton, retryButton, signInButton, exitButton);
    inner.append(node('p', 'repo-gate-brand', 'REPO COMPANY / MOROGUE'), mark, heading, description, actions, statusLine,
      node('p', 'repo-gate-footnote', 'Quitting ends this run. Your earned online records stay with your account.'));
    modal.append(inner); document.body.append(modal);
    listen(modal, 'cancel', event => event.preventDefault());
    for (const name of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click']) {
      listen(modal, name, event => event.stopPropagation());
    }
  }
  function paint(busy = false) {
    ensureModal();
    if (!modal) return;
    const copy = {
      checking: ['Connecting your account', 'Checking your Repo Company account before you enter the night.'],
      offline: ['The night can wait', 'Your connection was interrupted. Gameplay is paused. Reconnect to continue this run.'],
      account: ['Sign-in required', 'Reconnect with the Repo Company account that opened this game. You can return to the launcher to sign in.'],
      start: ['Your run is waiting', 'We could not register this run online. Reconnect to try again; the run has not started.'],
      service: ['Connection interrupted', 'Your online account could not be reached. Gameplay is paused while you reconnect.'],
      characters: ['Your character is waiting', 'We could not load your shared Moratales character. Reconnect to try again before entering the night.'],
      'characters-empty': ['Create your Moratales character', 'Your characters sync automatically with your Repo Company account. Play Moratales to create your character, then return to Morogue. If you already play in a browser, sign in to Repo Company there once to sync that character.'],
      incompatible: ['This game needs an update', 'The installed game could not connect to the launcher. Return to your library and check for updates.'],
      closed: ['Returning to your library', 'This run has ended. No unfinished run will be restored.']
    };
    [heading.textContent, description.textContent] = copy[reason] || copy.service;
    retryButton.textContent = busy ? 'Connecting…' : game && !terminal(game.state) ? 'Reconnect & resume' : 'Reconnect';
    retryButton.disabled = busy || reason === 'incompatible' || reason === 'closed';
    signInButton.hidden = reason !== 'account';
    connectButton.hidden = reason !== 'characters-empty';
    statusLine.textContent = busy ? 'Checking account and game services…' : '';
    if (blocked && !modal.open) modal.showModal();
    if (!blocked && modal.open) modal.close();
  }
  function terminal(state) { return !state || ['won', 'lost', 'retired'].includes(state.status); }
  function block(nextReason) {
    if (disposed) return;
    const wasBlocked = blocked;
    blocked = true; reason = nextReason;
    for (const sample of clocks) sample(root.performance.now(), false);
    if (game?.state.status === 'playing' && game.pause()) ownedPause = true;
    // The existing app's blur handler releases held keys/pointers and its active clock.
    if (!wasBlocked && game && !terminal(game.state)) root.dispatchEvent(new Event('blur'));
    root.__moratalesSurvivor?.music?.pause?.();
    root.__moratalesSurvivor?.sound?.stop?.();
    paint(); report();
  }
  function unblock() {
    if (disposed) return;
    blocked = false; reason = 'connected';
    for (const sample of clocks) sample(root.performance.now(), false);
    if (deferredTransition) { const complete = deferredTransition; deferredTransition = null; complete(); }
    if (ownedPause && game?.state.status === 'paused') game.resume();
    ownedPause = false;
    paint(); report();
    root.dispatchEvent(new Event('focus'));
    for (const record of frames.values()) if (record.waiting) {
      record.waiting = false; record.nativeId = requestFrame(record.deliver);
    }
    document.getElementById('vs-world')?.focus({ preventScroll: true });
  }
  function bounded(promise, milliseconds = 14000) {
    return new Promise((resolve, reject) => {
      const timer = later(() => reject(Object.assign(new Error('Connection timed out'), { gateReason: 'service' })), milliseconds);
      Promise.resolve(promise).then(resolve, reject).finally(() => {
        root.clearTimeout(timer); timers.delete(timer);
      });
    });
  }
  function verify() {
    if (verifying) return verifying;
    const epoch = networkEpoch;
    verifying = (async () => {
      if (root.navigator.onLine === false) throw Object.assign(new Error('Offline'), { gateReason: 'offline' });
      if (!expectedAccount || !auth) throw Object.assign(new Error('Account unavailable'), { gateReason: 'account' });
      const sessionResult = await bounded(auth.auth.getSession());
      const session = sessionResult?.data?.session;
      if (!session?.access_token || session.user?.id !== expectedAccount) throw Object.assign(new Error('Sign in required'), { gateReason: 'account' });
      const controller = new AbortController(); controllers.add(controller);
      const timer = later(() => controller.abort(), 10000);
      let response;
      try {
        response = await fetchOriginal.call(root, '/api/leaderboards/account', {
          headers: { Authorization: 'Bearer ' + session.access_token }, cache: 'no-store', signal: controller.signal
        });
        if (!response.ok) throw Object.assign(new Error('Account check failed'), { gateReason: [401, 403].includes(response.status) ? 'account' : 'service' });
        const identity = await response.json();
        if (identity?.id !== expectedAccount || board?.player?.id !== expectedAccount) throw Object.assign(new Error('Account changed'), { gateReason: 'account' });
        if (epoch !== networkEpoch || root.navigator.onLine === false) throw Object.assign(new Error('Connection changed'), { gateReason: 'offline' });
        return identity;
      } finally {
        root.clearTimeout(timer); timers.delete(timer); controllers.delete(controller);
      }
    })().finally(() => { verifying = null; });
    return verifying;
  }
  async function tryBegin() {
    const waiting = pendingBegin;
    if (!waiting || waiting.busy || disposed) return;
    waiting.busy = true; paint(true);
    try {
      await board.ready; await verify(); await bridge.retryCharacters?.();
      if (disposed || waiting !== pendingBegin) return;
      // A successfully registered run is reused if connectivity dropped while /start returned.
      // Retrying that request would discard its run ID and create a second server-side run.
      if (!waiting.accepted) {
        const result = await waiting.original.apply(board, waiting.args);
        if (waiting.options.practice) waiting.accepted = { practice: true, result };
        else if (result && result.playerId === expectedAccount) waiting.accepted = { result };
        else { block('start'); return; }
      }
      if (disposed) return;
      if (root.navigator.onLine === false) { block('offline'); return; }
      if (blocked && reason !== 'checking') { block(reason); return; }
      permit = true; pendingBegin = null; unblock(); waiting.resolve(waiting.accepted.result);
    } catch (error) {
      if (!disposed) block(error.gateReason || 'service');
    } finally {
      waiting.busy = false;
      if (!disposed && blocked) paint();
    }
  }
  function reconnect() {
    if (disposed || reconnecting) return reconnecting || Promise.resolve();
    reconnecting = (async () => {
      paint(true);
      try {
        await board?.ready; await verify(); await bridge.retryCharacters?.();
        if (disposed) return;
        if (pendingBegin) { reason = 'checking'; await tryBegin(); }
        else unblock();
      } catch (error) { if (!disposed) block(error.gateReason || 'service'); }
      finally { if (!disposed && blocked) paint(); }
    })().finally(() => { reconnecting = null; });
    return reconnecting;
  }
  function leave(destination) {
    if (disposed) return;
    block('closed'); dispose();
    root.dispatchEvent(new CustomEvent('repo-launcher-exit', { detail: { destination } }));
    try {
      const method = destination === 'sign-in' ? 'requestSignIn' : 'requestExit';
      root.REPO_LAUNCHER?.[method]?.()?.catch?.(() => {});
    } catch { /* The parent owns closing this webContents. */ }
  }
  function dispose() {
    if (disposed) return;
    if (game?.state.status === 'playing') game.pause();
    disposed = true; blocked = true; permit = false;
    for (const remove of listeners) remove(); listeners.length = 0;
    for (const subscription of subscriptions) subscription.unsubscribe?.();
    for (const timer of timers) root.clearTimeout(timer); timers.clear();
    for (const controller of controllers) controller.abort(); controllers.clear();
    for (const record of frames.values()) cancelFrame?.(record.nativeId); frames.clear();
    deferredTransition = null;
    // Do not retire/finish the game: closing a window is not a completed leaderboard result.
  }
  root.MOROGUE_LAUNCHER = Object.freeze({
    reconnect, requestExit: () => leave('library'),
    get state() { return Object.freeze({ blocked, reason, disposed, waitingToStart: !!pendingBegin }); }
  });
  if (!originalCreateBoard || !originalCreateGame || !originalAccount || !expectedAccount) {
    block('incompatible'); return;
  }

  // Freeze UI scenes as well as combat: merchant/grove animations and controller
  // selection run in app.js's animation frame, outside the simulation's update().
  if (requestFrame && cancelFrame) {
    root.requestAnimationFrame = function launcherFrame(callback) {
      if (disposed) return 0;
      const record = { callback, waiting: false, id: null, nativeId: null };
      record.deliver = timestamp => {
        if (disposed) { frames.delete(record.id); return; }
        if (blocked) { record.waiting = true; return; }
        frames.delete(record.id); record.callback(timestamp);
      };
      record.id = record.nativeId = requestFrame(record.deliver); frames.set(record.id, record);
      return record.id;
    };
    root.cancelAnimationFrame = function cancelLauncherFrame(id) {
      const record = frames.get(id);
      cancelFrame(record?.nativeId ?? id); frames.delete(id);
    };
  }
  if (root.MOROGUE_RUN_CLOCK?.create && root.performance?.now) {
    const createClock = root.MOROGUE_RUN_CLOCK.create;
    root.MOROGUE_RUN_CLOCK.create = function launcherClock(...args) {
      const clock = createClock.apply(this, args), sample = clock.sample.bind(clock);
      clocks.add(sample);
      clock.sample = (now, active) => sample(now, active && !blocked && !disposed);
      return clock;
    };
  }

  bridge.account = async function launcherAccount(...args) {
    const result = await originalAccount.apply(this, args); auth = result;
    const subscription = auth.auth.onAuthStateChange(() => {
      if (disposed || !board) return;
      networkEpoch++; block('account');
    });
    if (subscription?.data?.subscription) subscriptions.push(subscription.data.subscription);
    return result;
  };
  boards.create = function createOnlineBoard(options = {}) {
    if (board) return board;
    board = originalCreateBoard.call(this, { ...options, notice(message) {
      if (!/^Playing offline:|^Your previous record is waiting to sync\./.test(message)) options.notice?.(message);
    } });
    const begin = board.begin, finish = board.finish, heartbeat = board.heartbeat;
    board.begin = function onlineBegin(...args) {
      if (disposed) return never;
      if (pendingBegin) return pendingBegin.promise;
      if (game && !terminal(game.state)) return never;
      const waiting = { args, options: args[0] || {}, original: begin, accepted: null, busy: false };
      waiting.promise = new Promise(resolve => { waiting.resolve = resolve; });
      pendingBegin = waiting; block('checking'); void tryBegin();
      return waiting.promise;
    };
    board.finish = function finishRealRun(...args) {
      if (disposed) return never;
      return finish.apply(this, args);
    };
    board.heartbeat = function checkpointRealRun(...args) {
      if (!disposed && !blocked) return heartbeat.apply(this, args);
    };
    board.ready.then(async () => {
      try { await verify(); await bridge.retryCharacters?.(); if (!disposed && !pendingBegin && reason === 'checking') unblock(); }
      catch (error) { if (!disposed) block(error.gateReason || 'service'); }
    }).catch(() => { if (!disposed) block('service'); });
    return board;
  };
  engine.create = function createOnlineGame(...args) {
    if (!permit || disposed || blocked) throw new Error('A verified online run is required.');
    permit = false; game = originalCreateGame.apply(this, args); ownedPause = false;
    for (const method of ['update', 'resume', 'choose', 'reroll', 'skipUpgrade', 'openGrove', 'clearGroveArena', 'chooseGrove', 'leaveGrove', 'clearMerchantArena', 'buyRelic', 'leaveMerchant', 'special', 'dash', 'continueEvolution', 'retire']) {
      if (typeof game[method] !== 'function') continue;
      const original = game[method];
      game[method] = function guardedMutation(...values) {
        if (disposed) return false;
        if (blocked) {
          // An upgrade selected before the interruption commits on a short timer.
          // Complete that already-chosen transition only after explicit reconnect.
          if (['choose', 'leaveMerchant', 'leaveGrove'].includes(method) && !deferredTransition) {
            const instance = this;
            deferredTransition = () => original.apply(instance, values);
          }
          return false;
        }
        return original.apply(this, values);
      };
    }
    return game;
  };
  root.fetch = async function observedGameFetch(input, init) {
    let observed = false;
    try {
      const url = new URL(typeof input === 'string' ? input : input.url, root.location.href);
      observed = url.origin === root.location.origin && /^\/api\/leaderboards\/(?:checkpoint|finish)$/.test(url.pathname);
    } catch { /* Unrelated requests retain the browser's own validation. */ }
    try {
      const response = await fetchOriginal.call(this, input, init);
      if (observed && !response.ok && ([401, 403].includes(response.status) || response.status >= 500)) block([401, 403].includes(response.status) ? 'account' : 'service');
      return response;
    } catch (error) { if (observed) block(root.navigator.onLine === false ? 'offline' : 'service'); throw error; }
  };
  listen(root, 'offline', () => { networkEpoch++; block('offline'); });
  // Reconnection never resumes combat automatically. A player explicitly chooses Resume.
  listen(root, 'online', () => { if (blocked && statusLine) statusLine.textContent = 'Connection available. Choose Reconnect when you are ready.'; });
  listen(root, 'pagehide', dispose);
  function monitor() {
    if (disposed) return;
    if (!blocked && board) verify().catch(error => { if (!disposed) block(error.gateReason || 'service'); }).finally(() => later(monitor, 20000));
    else later(monitor, 20000);
  }
  later(monitor, 20000);
  paint(true); report();
})(globalThis);
