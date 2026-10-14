(() => {
  'use strict';
  const bridge = window.repoLauncher;
  const $ = selector => document.querySelector(selector);
  const activeDownloads = new Set(['queued', 'downloading', 'updating', 'verifying']);
  let state = {}, reconnecting = false, connectionError = '', unsubscribe;

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
    } else if (state.launcherUpdate?.status === 'downloading') text = 'Updating Repo Company';
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
    state = next || {};
    if (!state.portalError) connectionError = '';
    downloads(); renderConnection();
  }

  document.querySelectorAll('[data-window]').forEach(button => {
    button.addEventListener('click', () => {
      if (!bridge) return;
      void bridge.windowControl(button.dataset.window).catch(() => {});
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
