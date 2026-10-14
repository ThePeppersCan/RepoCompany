(() => {
  'use strict';
  const bridge = window.repoLauncher;
  const $ = selector => document.querySelector(selector);
  const activeDownloads = new Set(['queued', 'downloading', 'updating', 'verifying']);
  let state = {}, reconnecting = false, connectionError = '', unsubscribe, leaving = false, openingMessages = false, toolbarError = '';

  function downloads() {
    const entries = Object.values(state.library || {}).filter(item => activeDownloads.has(item.status));
    let text = '';
    if (entries.length) {
      const names = new Map((state.catalog?.games || []).map(game => [game.id, game.name]));
      const item = entries[0];
      if (entries.length > 1) text = `${entries.length} games downloading`;
      else if (item.status === 'verifying') text = `Verifying ${names.get(item.id) || 'game files'}`;
      else {
        const percent = item.totalBytes > 0 ? Math.min(100, Math.max(0, Math.floor(item.bytes / item.totalBytes * 100))) : null;
        text = `${item.status === 'updating' ? 'Updating' : 'Downloading'} ${names.get(item.id) || 'game'}${percent === null ? '' : ` · ${percent}%`}`;
      }
    } else if (state.launcherUpdate?.status === 'downloading') {
      const progress = state.launcherUpdate.progress;
      text = 'Updating Repo Company' + (Number.isFinite(progress) ? ' · ' + Math.round(Math.max(0, Math.min(1, progress)) * 100) + '%' : '');
    } else if (state.launcherUpdate?.status === 'verifying') text = 'Verifying launcher update';
    else if (state.launcherUpdate?.status === 'ready') text = 'Launcher update ready';
    $('#download-status').hidden = !text;
    if ($('#download-label').textContent !== text) $('#download-label').textContent = text;
  }

  function renderConnection() {
    const error = connectionError || state.portalError;
    $('#connection-spinner').hidden = !!error && !reconnecting;
    $('#connection-title').textContent = reconnecting ? 'Reconnecting' : error ? 'Let’s reconnect' : 'Opening Repo Company';
    $('#connection-message').textContent = reconnecting ? 'Connecting to your collection.' : error || 'Connecting to your collection.';
    $('#connection-actions').hidden = !error;
    $('#connection-note').hidden = !error;
    $('#reconnect').disabled = reconnecting;
    $('#reconnect').textContent = reconnecting ? 'Connecting…' : 'Reconnect';
  }

  function receive(next) {
    if (state.activeGame?.id !== next?.activeGame?.id) toolbarError = '';
    state = next || {};
    if (!state.portalError) connectionError = '';
    downloads(); renderConnection(); renderGame();
  }
  function renderGame() {
    const game = state.activeGame;
    $('#game-toolbar').hidden = !game;
    if (!game) return;
    $('#game-title').textContent = toolbarError || game.name + (game.loading ? ' · Opening…' : '');
    $('#game-title').title = toolbarError || game.name;
    $('#back-to-game').hidden = !state.messageOverlay;
    $('#exit-game').disabled = leaving || game.closing;
    $('#exit-game').textContent = game.closing ? 'Saving…' : leaving ? 'Leaving…' : 'Exit game';
    $('#game-messages').disabled = openingMessages;
    $('#game-messages-label').textContent = state.social?.incomingCall ? 'Incoming call' : state.social?.callActive ? 'Call active' : 'Messages';
    $('#game-messages').classList.toggle('incoming-call', !!state.social?.incomingCall);
    $('#message-count').hidden = !state.social?.unread;
    $('#message-count').textContent = state.social?.unread > 99 ? '99+' : String(state.social?.unread || '');
    $('#game-fullscreen').setAttribute('aria-label', state.fullscreen ? 'Leave fullscreen' : 'Enter fullscreen');
    $('#game-fullscreen').setAttribute('aria-pressed', String(!!state.fullscreen));
  }
  function notice(error) { const message = error?.message || 'Please try again.'; if (state.activeGame) { toolbarError = message; renderGame(); } else { $('#shell-notice').textContent = message; $('#shell-notice').hidden = false; } }
  $('#exit-game').addEventListener('click', async () => {
    if (!bridge || leaving) return;
    leaving = true; toolbarError = ''; $('#shell-notice').hidden = true; renderGame();
    try { receive(await bridge.exitGame()); } catch (error) { notice(error); }
    finally { leaving = false; renderGame(); }
  });
  $('#game-messages').addEventListener('click', async () => {
    if (!bridge || openingMessages) return;
    openingMessages = true; toolbarError = ''; $('#shell-notice').hidden = true; renderGame();
    try { receive(await bridge.openMessages()); } catch (error) { notice(error); }
    finally { openingMessages = false; renderGame(); }
  });
  $('#back-to-game').addEventListener('click', async () => {
    if (!bridge) return;
    toolbarError = '';
    $('#shell-notice').hidden = true;
    try { receive(await bridge.resumeGame()); } catch (error) { notice(error); }
  });

  document.querySelectorAll('[data-window]').forEach(button => {
    button.addEventListener('click', () => {
      if (!bridge) return;
      void bridge.windowControl(button.dataset.window).catch(notice);
    });
  });
  $('#reconnect').addEventListener('click', async () => {
    if (!bridge || reconnecting) return;
    reconnecting = true; renderConnection();
    try { await bridge.refresh(); receive(await bridge.getState()); }
    catch { connectionError = 'Repo Company could not connect. Check your connection and try again.'; }
    finally { reconnecting = false; renderConnection(); }
  });
  $('#open-website').addEventListener('click', () => {
    if (bridge) void bridge.openWebsite().catch(() => {});
  });

  if (bridge) {
    unsubscribe = bridge.onState(receive);
    bridge.getState().then(receive).catch(() => {
      connectionError = 'Repo Company could not open. Please try reconnecting.'; renderConnection();
    });
  } else {
    connectionError = 'Open the Windows launcher to connect to Repo Company.';
    $('#reconnect').hidden = true; $('#open-website').hidden = true;
    renderConnection();
  }
  window.addEventListener('pagehide', () => unsubscribe?.(), { once: true });
})();
