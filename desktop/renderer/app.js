(() => {
  'use strict';
  const bridge = window.repoLauncher;
  const $ = selector => document.querySelector(selector);
  const activeDownloads = new Set(['queued', 'downloading', 'updating', 'verifying']);
  let state = {}, reconnecting = false, connectionError = '', unsubscribe, leaving = false, openingMessages = false, toolbarError = '';
  let authenticating = false, createAccount = false, authError = '', previousPhase = '';
  let countdownTimer = null, updateRetrying = false;

  function renderUpdate() {
    const gate = state.requiredUpdate;
    $('#update-panel').hidden = !gate?.locked;
    if (!gate?.locked) { clearInterval(countdownTimer); countdownTimer = null; return false; }
    const phase = gate.phase, update = state.launcherUpdate || {};
    const failed = phase === 'error' || phase === 'save-error';
    const ready = phase === 'countdown';
    $('.website-fallback').hidden = false;
    $('.website-fallback').dataset.phase = 'updating'; document.body.dataset.locked = 'true';
    $('.connection-card').setAttribute('aria-busy', String(!failed));
    for (const id of ['sign-in-form','connection-actions','connection-note']) $('#' + id).hidden = true;
    $('#shell-notice').hidden = true;
    $('#update-title').textContent = failed ? phase === 'save-error' ? 'Let’s finish saving' : 'Update paused' : phase === 'checking' ? 'Checking for updates' : phase === 'restarting' ? 'Restarting Repo Company' : 'Updating Repo Company';
    $('#update-message').textContent = failed ? gate.error || 'We couldn’t verify the latest version. Check your connection and try again.' : ready ? 'Your client will close and reopen automatically.' : phase === 'saving' ? 'Saving your game before restarting.' : phase === 'restarting' ? 'Installing the update. We’ll bring you straight back.' : phase === 'checking' ? 'Making sure you have the latest version.' : 'The client will restart when your update is ready.';
    const progress = $('#update-progress');
    if (ready || ['saving','restarting','verifying'].includes(phase)) progress.value = 1;
    else if (phase === 'downloading' && Number.isFinite(update.progress)) progress.value = Math.max(0, Math.min(1, update.progress));
    else progress.removeAttribute('value');
    $('.update-meter').hidden = failed;
    $('#update-percent').textContent = phase === 'downloading' && Number.isFinite(update.progress) ? Math.floor(progress.value * 100) + '%' : ready || phase === 'verifying' ? '100%' : '';
    $('#update-stage').textContent = failed ? 'Update required to continue' : phase === 'checking' ? 'Connecting securely' : phase === 'downloading' ? 'Downloading' : phase === 'verifying' ? 'Verifying update' : phase === 'saving' ? 'Saving progress' : phase === 'restarting' ? 'Closing client' : '';
    $('#update-note').textContent = state.activeGame?.id === 'morogue' ? 'This update ends your current run. Completed achievements and scores are kept.' : state.activeGame ? 'Your game will save before the client closes.' : '';
    $('#update-retry').hidden = !failed; $('#update-retry').disabled = updateRetrying;
    if (ready) {
      const tick = () => { $('#update-stage').textContent = 'Restarting in ' + Math.max(0, Math.ceil((gate.restartAt - Date.now()) / 1000)) + ' seconds'; };
      tick(); if (!countdownTimer) countdownTimer = setInterval(() => { if (state.requiredUpdate?.phase === 'countdown') $('#update-stage').textContent = 'Restarting in ' + Math.max(0, Math.ceil((state.requiredUpdate.restartAt - Date.now()) / 1000)) + ' seconds'; }, 250);
    } else { clearInterval(countdownTimer); countdownTimer = null; }
    window.repoBrandMotion?.setIntro(null);
    window.repoBrandMotion?.setVariant('default');
    window.repoBrandMotion?.setActive(!failed);
    return true;
  }

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
    if (renderUpdate()) return;
    $('.website-fallback').hidden = state.entryVisible === false;
    const busy = authenticating || state.signingIn;
    const account = state.account || { status: 'checking' };
    const gameLoading = state.activeGame?.loading;
    const introId = gameLoading ? state.activeGame.introId : null;
    const error = connectionError || state.portalError || (account.status === 'offline' ? account.error || 'Connect to the internet to continue.' : '');
    const showForm = state.portalReady && account.status === 'signed-out' && !error && !gameLoading;
    const phase = busy ? 'signing-in' : reconnecting || gameLoading ? 'loading' : error ? 'error' : showForm ? 'sign-in' : 'loading';
    $('.website-fallback').dataset.phase = phase;
    $('.website-fallback').dataset.gameLoading = String(!!gameLoading);
    window.repoBrandMotion?.setVariant(gameLoading ? state.activeGame.id : 'default');
    window.repoBrandMotion?.setIntro(introId, state.activeGame?.introLoops || 2, () => {
      bridge.completeGameIntro(introId).then(receive).catch(() => { connectionError = 'Your game could not open. Return to your library and try again.'; renderConnection(); });
    });
    window.repoBrandMotion?.setActive(state.entryVisible !== false && ['loading', 'signing-in'].includes(phase));
    document.body.dataset.locked = String(account.status !== 'online' || busy);
    $('.connection-card').setAttribute('aria-busy', String(['loading', 'signing-in'].includes(phase)));
    $('#connection-title').textContent = busy ? 'Making yourself at home' : gameLoading ? 'Opening ' + state.activeGame.name : reconnecting ? 'Reconnecting' : error ? 'Let’s reconnect' : showForm ? createAccount ? 'Your next chapter starts here.' : 'Welcome home.' : 'Opening Repo Company';
    $('#connection-message').textContent = busy ? 'Signing in to your Repo Company account.' : gameLoading ? 'Getting your game ready.' : reconnecting ? 'Connecting to your collection.' : error || (showForm ? createAccount ? 'One account for every adventure.' : 'Sign in to your Repo Company account.' : 'Connecting to your collection.');
    $('#sign-in-form').hidden = !showForm || busy;
    $('#sign-in-error').hidden = !authError;
    $('#sign-in-error').textContent = authError;
    $('#sign-in-submit').disabled = busy;
    $('#sign-in-submit').textContent = createAccount ? 'Create account' : 'Log in';
    $('#sign-in-password').autocomplete = createAccount ? 'new-password' : 'current-password';
    $('#sign-in-mode').textContent = createAccount ? 'Back to log in' : 'Create account';
    $('#connection-actions').hidden = !error || busy;
    $('#connection-note').hidden = !error || busy;
    $('#reconnect').disabled = reconnecting;
    $('#reconnect').textContent = reconnecting ? 'Connecting…' : 'Reconnect';
    if (phase === 'sign-in' && previousPhase !== phase) requestAnimationFrame(() => $('#sign-in-username').focus());
    previousPhase = phase;
  }

  function receive(next) {
    if (state.activeGame?.id !== next?.activeGame?.id) toolbarError = '';
    state = next || {};
    if (state.account?.status === 'online') { $('#sign-in-password').value = ''; authError = ''; }
    if (!state.portalError) connectionError = '';
    downloads(); renderConnection(); renderGame();
  }
  function renderGame() {
    const game = state.activeGame;
    $('#game-toolbar').hidden = !game || !!state.requiredUpdate?.locked;
    if (!game) return;
    $('#game-title').textContent = toolbarError || game.name + (game.loading ? ' · Opening…' : '');
    $('#game-title').title = toolbarError || game.name;
    $('#back-to-game').hidden = !state.messageOverlay;
    $('#exit-game').disabled = leaving || game.closing;
    $('#exit-game').textContent = game.closing ? 'Saving…' : leaving ? 'Leaving…' : 'Exit game';
    $('#game-messages').disabled = openingMessages || game.loading;
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
  $('#update-retry').addEventListener('click', async () => {
    if (!bridge || updateRetrying) return;
    updateRetrying = true; renderUpdate();
    try { await bridge.checkLauncherUpdates(); receive(await bridge.getState()); }
    catch { /* The native update state owns the error and keeps the client locked. */ }
    finally { updateRetrying = false; renderConnection(); }
  });
  $('#sign-in-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (!bridge || authenticating) return;
    authenticating = true; authError = ''; renderConnection();
    try { receive(await bridge.signIn($('#sign-in-username').value.trim(), $('#sign-in-password').value, createAccount)); }
    catch (error) { authError = String(error?.message || 'Unable to sign in. Please try again.').replace(/^Error invoking remote method '[^']+': Error: /, ''); }
    finally { authenticating = false; $('#sign-in-password').value = ''; renderConnection(); }
  });
  $('#sign-in-mode').addEventListener('click', () => { createAccount = !createAccount; authError = ''; $('#sign-in-password').value = ''; renderConnection(); $('#sign-in-username').focus(); });
  $('#password-visibility').addEventListener('click', () => {
    const input = $('#sign-in-password'), visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    $('#password-visibility').setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    $('#password-visibility').setAttribute('aria-pressed', String(visible));
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
  window.addEventListener('pagehide', () => { unsubscribe?.(); clearInterval(countdownTimer); window.repoBrandMotion?.setActive(false); }, { once: true });
})();

{const mail=document.querySelector('#game-messages');let last=0;const anchor=()=>{const right=Math.round(mail.getBoundingClientRect().right);if(right&&right!==last){last=right;window.repoLauncher.messageAnchor(right).catch(()=>{});}};new ResizeObserver(anchor).observe(document.querySelector('.titlebar'));new MutationObserver(anchor).observe(document.querySelector('#game-toolbar'),{attributes:true,subtree:true});}
