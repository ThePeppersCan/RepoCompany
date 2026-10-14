'use strict';
const { app, BrowserWindow, WebContentsView, ipcMain, protocol, session, Menu, dialog, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { Library } = require('./lib/library.cjs');
const { Account } = require('./lib/account.cjs');
const { createHandler, serveFile } = require('./lib/protocol.cjs');
const { LauncherUpdater } = require('./lib/updater.cjs');
const { Preferences } = require('./lib/preferences.cjs');
const { DiscordPresence } = require('./lib/discord-presence.cjs');
const { configureMediaPermissions } = require('./lib/media-permissions.cjs');

app.setName('Repo Company');
app.setAppUserModelId('uk.repocompany.launcher');
app.setPath('userData', path.join(app.getPath('appData'), 'Repo Company'));
if (!app.isPackaged && process.env.REPO_LAUNCHER_TEST_PROFILE) app.setPath('userData', path.resolve(process.env.REPO_LAUNCHER_TEST_PROFILE));
protocol.registerSchemesAsPrivileged([{ scheme: 'repo-launcher', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } }]);

const desktopRoot = __dirname;
const config = require('./config.cjs')(app.isPackaged ? process.resourcesPath : desktopRoot);
const fixtures = !app.isPackaged && process.env.REPO_LAUNCHER_FIXTURES === '1' ? require('./tests/fixtures/network.cjs') : null;
const hiddenTest = !app.isPackaged && process.env.REPO_LAUNCHER_HIDDEN_TEST === '1';
if (fixtures) { fixtures.configure(config); globalThis.__repoLauncherTestServices = fixtures; }
let mainWindow, portal, portalContents, sharedSession, library, account, updater, preferences, discordPresence, timer, checkTimer;
let view = 'home', selectedGame = null, selectedGameRevision = 0, portalReady = false, portalLoading = false, portalLoadRevision = 0, portalError = '', quitting = false, quitApproved = false, portalContentsId = null;
let updateSweep = null, updateSweepRequested = false, broadcastTimer = null, embeddedDemo = null, demoLaunchRevision = 0;
const emptySocialState = () => ({ unread: 0, callActive: false, incomingCall: false, open: false });
let messageOverlay = false, socialState = emptySocialState(), portalViewVisible = false, lastPortalVisibility = null;
let mediaPermissions = null, mediaAccountId = null;
let launcherCheckTimer = null, launcherReconnectTimer = null, launcherCheckPending = null, lastLauncherCheck = 0, previousConnectionStatus = null;
let launcherQuitPending = null, launcherQuitFinished = false, launcherRestartRequested = false;
let signingIn = false;
const shutdown = new AbortController();
const games = new Map();
const publicCatalog = () => ({ games: config.games.map(({ developmentManifest, approvedOrigins, manifestUrl, ...game }) => game), demos: (config.demos || []).map(demo => ({ ...demo })) });
const state = () => ({
  version: app.getVersion(), view, selectedGame, selectedGameRevision, account: account?.snapshot() || { status: 'checking' }, signingIn,
  connectivity: { online: account?.state.status !== 'offline' },
  library: library?.snapshot() || {}, catalog: publicCatalog(), running: [...games.keys(), ...(embeddedDemo ? [embeddedDemo.id] : [])],
  activeGame: currentGame() ? { id: currentGame().__gameId, name: gameById(currentGame().__gameId).name, loading: !!currentGame().loading, closing: !!currentGame().__closing } : null,
  gameVisible: !!currentGame() && !messageOverlay, messageOverlay, portalVisible: isPortalVisible(), social: { ...socialState }, fullscreen: !!mainWindow?.isFullScreen?.(),
  entryVisible: !portalViewVisible && (!currentGame() || !!currentGame().loading),
  launcherUpdate: launcherUpdateState(), preferences: preferences?.snapshot() || { automaticGameUpdates: true, discordPresence: true }, discordPresence: discordPresence?.snapshot(), portalError, portalReady
});
function gameOperationsBusy() {
  return config.games.some(game => game.installable && library?.isBusy?.(game.id)) || Object.values(library?.snapshot() || {}).some(item => ['queued', 'downloading', 'updating', 'verifying', 'installing', 'extracting'].includes(item.status));
}
function restartBlockedReason() {
  if (games.size || embeddedDemo) return 'Close your game before restarting the launcher.';
  if (socialState.callActive) return 'Finish your call before restarting the launcher.';
  if (gameOperationsBusy()) return 'Wait for your game downloads to finish before restarting.';
  if (quitting || quitApproved) return 'The launcher is closing.';
  return '';
}
function launcherUpdateState() {
  const update = updater?.snapshot();
  return update ? { ...update, canRestart: update.status === 'ready' && !restartBlockedReason(), restartBlockedReason: update.status === 'ready' ? restartBlockedReason() : '' } : undefined;
}
function checkLauncherUpdates() {
  if (quitting || quitApproved || !updater) return Promise.resolve(updater?.snapshot());
  if (launcherCheckPending) return launcherCheckPending;
  lastLauncherCheck = Date.now();
  launcherCheckPending = Promise.resolve().then(() => updater.check()).catch(() => updater.snapshot()).finally(() => { launcherCheckPending = null; broadcast(); });
  return launcherCheckPending;
}
function scheduleLauncherReconnect() {
  if (quitting || quitApproved || !updater || launcherReconnectTimer) return;
  // Repeated browser/account events may describe the same reconnection.
  // Keep one retry, and leave at least thirty seconds between network checks.
  launcherReconnectTimer = setTimeout(() => { launcherReconnectTimer = null; void checkLauncherUpdates(); }, Math.max(1000, 30000 - (Date.now() - lastLauncherCheck)));
  launcherReconnectTimer.unref?.();
}
function startLauncherUpdateChecks() {
  if (launcherCheckTimer || quitting || quitApproved) return;
  void checkLauncherUpdates();
  launcherCheckTimer = setInterval(() => { void checkLauncherUpdates(); }, 30 * 60 * 1000);
  launcherCheckTimer.unref?.();
}
function stopLauncherUpdateChecks() { clearInterval(launcherCheckTimer); clearTimeout(launcherReconnectTimer); launcherCheckTimer = null; launcherReconnectTimer = null; }
async function settleGameOperations() {
  await Promise.allSettled(config.games.filter(game => game.installable && library?.isBusy?.(game.id)).map(game => library.cancel(game.id)));
}
function finishLauncherQuit(event) {
  if (launcherQuitFinished) return;
  // will-quit happens after save approval and native window/view disposal.
  // An installer may request app.quit again; keep that request behind this lock.
  event.preventDefault();
  if (launcherQuitPending) return;
  launcherQuitPending = (async () => {
    await settleGameOperations();
    if (!games.size && !embeddedDemo && !gameOperationsBusy()) await updater?.applyOnQuit?.({ restart: launcherRestartRequested });
  })().catch(() => {}).finally(() => {
    launcherQuitFinished = true;
    updater?.dispose?.();
    // A Promise continuation can run before Electron unwinds its cancelled
    // will-quit event. A nested quit at that point is silently ignored.
    setImmediate(() => app.quit());
  });
}
function requestLauncherRestart() {
  if (updater?.snapshot().status !== 'ready') throw new Error('The launcher update is not ready yet.');
  const blocked = restartBlockedReason(); if (blocked) throw new Error(blocked);
  launcherRestartRequested = true; quitApproved = true; app.quit();
}
function handleMainWindowClose(event) {
  if (quitApproved || quitting) return;
  const busy = gameOperationsBusy();
  if (!games.size && !embeddedDemo && !busy) { quitApproved = true; return; }
  event.preventDefault();
  const window = mainWindow;
  if (!window || window.__askingToClose) return; window.__askingToClose = true;
  return dialog.showMessageBox(window, { type: 'question', title: 'Close Repo Company?', message: 'Close the launcher?', detail: games.has('morogue') || embeddedDemo ? 'Your game will close and its unfinished run will end.' : games.size ? 'Your game progress will be saved before closing.' : 'The current download will stop. You can restart it from your library.', buttons: ['Keep open', 'Close launcher'], defaultId: 0, cancelId: 0, noLink: true }).then(async result => {
    if (!quitting && !window.isDestroyed() && result.response === 1) { for (const game of games.values()) await saveBeforeClose(game); quitApproved = true; app.quit(); }
  }).catch(error => { if (!quitting) dialog.showErrorBox('Unable to save and close', error.message); }).finally(() => { window.__askingToClose = false; });
}
function windowContents(window) {
  if (!window || window.isDestroyed()) return null;
  const contents = window.webContents;
  return contents && !contents.isDestroyed() ? contents : null;
}
function activePortal() { return !quitting && portalContents && !portalContents.isDestroyed() ? portalContents : null; }
function currentGame() { return games.values().next().value || null; }
function gameContents(record) { const contents = record?.webContents; return record && !record.closed && contents && !contents.isDestroyed() ? contents : null; }
function focusGame(record) { const contents = gameContents(record); if (!contents || quitting) return; messageOverlay = false; setPortalVisible(false); record.view.setVisible(!record.loading); bounds(); showWindow(mainWindow); if (!hiddenTest && !record.loading) contents.focus(); broadcast(); }
function showWindow(window) {
  if (quitting || hiddenTest || !windowContents(window)) return;
  if (window.isMinimized()) window.restore();
  window.show(); window.focus();
}
function isPortalVisible() {
  return !!(portalViewVisible && portalReady && activePortal() && windowContents(mainWindow) && mainWindow.isVisible?.() && mainWindow.isFocused?.() && !mainWindow.isMinimized?.());
}
function notifyPortalVisibility(force = false) {
  const visible = isPortalVisible();
  if (force || visible !== lastPortalVisibility) {
    lastPortalVisibility = visible;
    // The portal intentionally keeps running for calls and account services.
    // Its document.visibilityState therefore cannot identify a visible inbox.
    activePortal()?.send('launcher:portal-visibility', visible);
    broadcast();
  }
}
function setPortalVisible(visible) {
  portalViewVisible = !!(visible && account?.state.status === 'online' && !signingIn && portalReady && portal && activePortal() && windowContents(mainWindow) && (!currentGame() || messageOverlay));
  if (portal && activePortal() && windowContents(mainWindow)) portal.setVisible(portalViewVisible);
  notifyPortalVisibility();
}
function configureSessionPermissions(targetSession) {
  mediaPermissions = configureMediaPermissions(targetSession, { getPortal: activePortal, getAccount: () => account, getWindow: () => mainWindow, isPortalUrl, dialog });
}
function refreshAccount() { if (!quitting) void account?.refresh().catch(() => {}); }
function checkAndApplyUpdates({ reschedule = false } = {}) {
  if (quitting || !library) return Promise.resolve();
  if (updateSweep) { if (reschedule) updateSweepRequested = true; return updateSweep; }
  updateSweep = (async () => {
    do {
      updateSweepRequested = false;
      await library.checkUpdates().catch(() => {});
      for (const game of config.games) {
        if (quitting || quitApproved || preferences?.snapshot().automaticGameUpdates === false) break;
        const installed = library.snapshot()[game.id];
        if (game.installable && installed?.availableVersion && installed.version && installed.availableVersion !== installed.version && !games.has(game.id) && !library.isBusy(game.id)) await library.update(game.id).catch(() => {});
      }
      // A game may close after it was skipped by this same sweep. Revisit it
      // before resolving, rather than leaving it until the next ten-minute poll.
    } while (updateSweepRequested && !quitting && !quitApproved);
  })().finally(() => { updateSweep = null; });
  return updateSweep;
}
function broadcast() {
  if (quitting || broadcastTimer || !windowContents(mainWindow)) return;
  // Coalesce file, account and game changes into the newest snapshot instead
  // of repeatedly rebuilding the website controls during a burst of events.
  broadcastTimer = setTimeout(() => {
    broadcastTimer = null;
    const contents = !quitting && windowContents(mainWindow);
    if (!contents) return;
    const snapshot = state();
    contents.send('launcher:state', snapshot);
    activePortal()?.send('launcher:state', snapshot);
  }, 80);
  broadcastTimer.unref?.();
}
function bounds() {
  if (!windowContents(mainWindow)) return;
  const [width, height] = mainWindow.getContentSize();
  const area = { x: 0, y: 44, width: Math.max(1, width), height: Math.max(1, height - 44) };
  if (portal && activePortal()) portal.setBounds(area);
  for (const record of games.values()) if (gameContents(record)) record.view.setBounds(area);
}
function trustedShell(event) {
  const contents = !quitting && windowContents(mainWindow);
  return contents && event.sender === contents && event.senderFrame && event.senderFrame === contents.mainFrame && event.senderFrame.url === 'repo-launcher://app/index.html';
}
function secureContents(contents, allowedNavigation) {
  contents.setWindowOpenHandler(({ url }) => {
    if (quitting) return { action: 'deny' };
    try {
      const target = new URL(url), targetGame = config.games.find(game => game.origin === target.origin);
      if (targetGame) { selectLibrary(targetGame.id); }
      else if (target.protocol === 'https:' && config.approvedOrigins.includes(target.origin)) void shell.openExternal(target.href).catch(() => {});
    } catch { /* Invalid links have no native action. */ }
    return { action: 'deny' };
  });
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.on('will-navigate', (event, destination) => {
    if (quitting) { event.preventDefault(); return; }
    if (!allowedNavigation(destination)) {
      event.preventDefault();
      const game = config.games.find(item => { try { return item.origin === new URL(destination).origin; } catch { return false; } });
      if (game) selectLibrary(game.id);
    }
  });
  contents.on('will-redirect', (event, destination) => { if (quitting || !allowedNavigation(destination)) event.preventDefault(); });
}
function isPortalUrl(value) { try { const url = new URL(value); return url.origin === config.portalOrigin || url.origin === 'https://www.repocompany.uk'; } catch { return false; } }
function selectLibrary(id) {
  if (quitting) return;
  if (config.games.find(game => game.id === id)?.delivery === 'web') { void openDemos(id).catch(() => {}); return; }
  if (config.games.some(game => game.id === id)) { selectedGame = id; selectedGameRevision++; }
  // The website's existing launch animation must recover when navigation is
  // intercepted. Normal desktop Play clicks are caught before that animation.
  const contents = activePortal();
  if (contents) void contents.executeJavaScript('dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}))').catch(() => {});
  view = 'library'; broadcast(); showWindow(mainWindow);
  if (contents) void navigate('library').catch(() => {});
}
function handlePortalRequest(details, callback) {
  let url; try { url = new URL(details.url); } catch { callback({ cancel: true }); return; }
  let pathname; try { pathname = decodeURIComponent(url.pathname); } catch { callback({ cancel: true }); return; }
  if (isPortalUrl(url.href) && pathname === '/legacy-runtime.html' && portalContentsId !== null && details.webContentsId === portalContentsId && ['mainFrame', 'subFrame'].includes(details.resourceType)) {
    const id = url.searchParams.get('dashboard');
    const embedded = (config.demos || []).find(demo => demo.embedded && demo.runtime !== 'dragonbound' && demo.id === id);
    const collection = ['binder', 'slabs', 'pack'].includes(id);
    const granted = embedded && embeddedDemo?.id === id && account?.state.status === 'online' && account.identity === embeddedDemo.identity;
    const allowed = !quitting && details.resourceType === 'subFrame' && (collection || granted);
    if (!allowed && !quitting && details.resourceType === 'mainFrame' && embedded) void openDemos(id).catch(() => {});
    callback({ cancel: !allowed }); return;
  }
  const target = config.games.find(game => { try { return game.origin === new URL(details.url).origin; } catch { return false; } });
  if (!quitting && portalContentsId !== null && details.webContentsId === portalContentsId && ['mainFrame', 'subFrame'].includes(details.resourceType) && target) {
    if (details.resourceType === 'subFrame' && target.id === 'moratales' && pathname === '/interface/vampire-survivor/character-bridge.html') { callback({ cancel: false }); return; }
    if (details.resourceType === 'subFrame' && target.delivery === 'web' && embeddedDemo?.id === target.id && embeddedDemo.runtime === 'dragonbound' && account?.state.status === 'online' && account.identity === embeddedDemo.identity) { callback({ cancel: false }); return; }
    // A background embedded game must not change Home/Account navigation. Only
    // top-level Play navigation selects the native game. Both are blocked here,
    // so embedded web games cannot bypass the launcher's account requirement.
    if (details.resourceType === 'mainFrame') selectLibrary(target.id);
    callback({ cancel: true }); return;
  }
  callback({ cancel: quitting });
}
async function navigate(destination) {
  if (!['library', 'home', 'account', 'achievements'].includes(destination)) throw new Error('Choose a valid launcher page.');
  const contents = activePortal();
  if (!contents || !windowContents(mainWindow)) throw new Error('The launcher is closing.');
  view = destination; portalError = ''; setPortalVisible(true); bounds(); broadcast();
  const hash = { library: '#account/profile', home: '#collection', account: '#account/profile', achievements: '#account/achievements' }[destination];
  if (!portalReady) await loadPortal(hash);
  else await contents.executeJavaScript(`location.hash=${JSON.stringify(hash)};`).catch(() => loadPortal(hash));
  if (destination === 'library' && contents === activePortal()) contents.send('launcher:portal-library');
}
async function loadPortal(hash = '#collection') {
  const contents = activePortal();
  if (!contents) return;
  const revision = ++portalLoadRevision;
  portalReady = false; portalLoading = true;
  setPortalVisible(false); broadcast();
  try { await contents.loadURL(config.portalOrigin + '/' + hash); }
  catch {
    if (quitting || contents !== activePortal() || revision !== portalLoadRevision) return;
    portalError = 'Repo Company could not connect. Check your connection and try again.';
    view = 'library'; setPortalVisible(false); broadcast();
  }
  finally { if (revision === portalLoadRevision) portalLoading = false; }
}
async function portalSession() {
  const contents = activePortal();
  if (!portalReady || !contents || !isPortalUrl(contents.getURL())) throw new Error('Portal unavailable');
  return contents.executeJavaScript(`(async()=>{
    const service=window.repoAccount;
    if(!service?.db?.auth)throw Error('Account service is still loading');
    const {data,error}=await service.db.auth.getSession();
    if(error)throw Error('Account session unavailable');
    const session=data?.session;
    return session?{access_token:session.access_token,user:{id:session.user.id}}:null;
  })()`);
}
function gameById(id) {
  const game = typeof id === 'string' && config.games.find(item => item.id === id);
  if (!game) throw new Error('Choose a game from your library.');
  return game;
}
function demoById(id) {
  const demo = typeof id === 'string' && (config.demos || []).find(item => item.id === id);
  if (!demo) throw new Error('Choose a demo from the demo collection.');
  const entry = new URL(demo.webEntry);
  if (entry.protocol !== 'https:' || entry.origin !== demo.origin || entry.username || entry.password || !config.approvedOrigins.includes(entry.origin)) throw new Error('This demo is unavailable.');
  if (!demo.embedded) throw new Error('This demo is unavailable.');
  if (demo.runtime === 'dragonbound') {
    if (demo.id !== 'dragonbound' || demo.origin !== 'https://dragonbound.repocompany.uk' || entry.pathname !== '/') throw new Error('This demo is unavailable.');
  } else if (!isPortalUrl(entry.href) || entry.pathname !== '/legacy-runtime.html' || entry.searchParams.get('dashboard') !== demo.id) throw new Error('This demo is unavailable.');
  return demo;
}
async function openDemos(id) {
  demoById(id);
  const contents = activePortal();
  if (!contents || !windowContents(mainWindow)) return;
  if (!portalReady) await loadPortal('#demos');
  if (contents !== activePortal() || !portalReady) return;
  await contents.executeJavaScript(`dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));window.demoLibrary?.open({gameId:${JSON.stringify(id)}});`);
  view = 'home'; setPortalVisible(true); broadcast(); showWindow(mainWindow);
}
function closeEmbeddedDemo(record = embeddedDemo) {
  if (!record || record !== embeddedDemo) return;
  embeddedDemo = null; discordPresence?.gameStopped(record.id); broadcast();
  const close = record.runtime === 'dragonbound' ? 'if(window.DragonboundStandaloneLauncher?.launcherBridgeVersion===1)window.DragonboundStandaloneLauncher.close();' : `const frame=document.querySelector('#legacy-feature iframe');if(frame&&new URL(frame.src,location.href).searchParams.get('dashboard')===${JSON.stringify(record.id)})return window.repoLegacy?.close();`;
  if (record.contents === activePortal()) void record.contents.executeJavaScript(`(()=>{if(window.__repoLauncherDemoTicket!==${record.revision})return;delete window.__repoLauncherDemoTicket;${close}})()`).catch(() => {});
}
function demoVisibility(record) {
  return record.runtime === 'dragonbound'
    ? `const dialog=document.getElementById('dragonboundStandaloneOverlay'),frame=dialog?.querySelector('iframe');return Boolean(dialog&&!dialog.hidden&&dialog.classList.contains('is-visible')&&frame&&new URL(frame.src,location.href).origin==='https://dragonbound.repocompany.uk');`
    : `const dialog=document.getElementById('legacy-feature'),frame=dialog?.querySelector('iframe');return Boolean(dialog?.open&&frame&&new URL(frame.src,location.href).searchParams.get('dashboard')===${JSON.stringify(record.id)});`;
}
async function reconcileEmbeddedDemo() {
  const record = embeddedDemo;
  if (!record) return;
  if (record.contents !== activePortal()) { closeEmbeddedDemo(record); return; }
  if (record.opening) return;
  const visible = await record.contents.executeJavaScript(`(()=>{if(window.repoAccount?.state?.user?.id!==${JSON.stringify(record.identity)})return false;${demoVisibility(record)}})()`).catch(() => false);
  if (!visible && record === embeddedDemo) closeEmbeddedDemo(record);
}
function accountChanged() {
  if (previousConnectionStatus === 'offline' && ['online', 'signed-out'].includes(account.state.status)) scheduleLauncherReconnect();
  previousConnectionStatus = account.state.status;
  const identity = account.state.status === 'online' ? account.identity : null;
  if (identity !== mediaAccountId) { mediaPermissions?.reset(); mediaAccountId = identity; socialState = emptySocialState(); }
  if (embeddedDemo && (account.state.status !== 'online' || account.identity !== embeddedDemo.identity)) closeEmbeddedDemo();
  else void reconcileEmbeddedDemo();
  for (const record of games.values()) gameContents(record)?.send('launcher:game-connection', gameConnection(record));
  if (account.state.status === 'signed-out') socialState = emptySocialState();
  setPortalVisible(portalReady);
  broadcast();
}
async function signIn(value) {
  if (signingIn) throw new Error('Sign-in is already in progress.');
  if (currentGame() || embeddedDemo) throw new Error('Close your game before changing accounts.');
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !['username', 'password', 'create'].includes(key)) || typeof value.username !== 'string' || !/^[a-zA-Z0-9_-]{3,16}$/.test(value.username) || typeof value.password !== 'string' || value.password.length < 8 || value.password.length > 1024 || typeof value.create !== 'boolean') throw new Error('Enter your Repo Company username and password.');
  const contents = activePortal();
  if (!portalReady || !contents) throw new Error('Connect to Repo Company before signing in.');
  signingIn = true; setPortalVisible(false); broadcast();
  try {
    // Use the website's existing account service and session store. Credentials
    // are not written to launcher preferences, logs, URLs or renderer snapshots.
    const result = await contents.executeJavaScript(`(async()=>{try{if(!window.repoAccount?.signIn)return {ok:false,message:'Your account service is still loading. Please try again.'};await window.repoAccount.signIn(${JSON.stringify(value.username)},${JSON.stringify(value.password)},${value.create});return {ok:true};}catch(error){return {ok:false,message:String(error.message||'Unable to sign in.').slice(0,240)};}})()`);
    if (!result?.ok) throw new Error(result?.message || 'Unable to sign in.');
    // A refresh started before authentication must finish before the final check.
    await account.refresh(); await account.refresh();
    if (contents !== activePortal() || account.state.status !== 'online') throw new Error('Your account could not be verified. Reconnect and try again.');
  } finally { signingIn = false; setPortalVisible(portalReady); broadcast(); }
  return state();
}
function gameConnection(window) {
  const status = account?.state.status || 'offline';
  return { status: status === 'online' && account.identity !== window.__accountId ? 'account-changed' : status, accountId: status === 'online' && account.identity === window.__accountId ? window.__accountId : null };
}
async function saveBeforeClose(window) {
  if (window.__gameId === 'morogue' || !gameContents(window)) return;
  if (window.__saving) return window.__saving;
  window.__saving = window.webContents.executeJavaScript(`(async()=>{
    if(!window.REPO_LAUNCHER_GAME?.beforeClose)throw Error('Your game is still starting. Please wait before closing.');
    await window.REPO_LAUNCHER_GAME.beforeClose();
    return true;
  })()`).finally(() => { window.__saving = null; });
  return window.__saving;
}
async function closeGame(window) {
  if (window.__closing) return window.__closing;
  window.__closing = (async () => { await saveBeforeClose(window); disposeGame(window); })().finally(() => { window.__closing = null; broadcast(); });
  broadcast(); return window.__closing;
}
function disposeGame(record) {
  if (!record || record.closed) return;
  record.stopPresence?.(); record.closed = true;
  const current = games.get(record.__gameId) === record;
  if (current) games.delete(record.__gameId);
  if (windowContents(mainWindow)) mainWindow.contentView.removeChildView(record.view);
  record.view.setVisible(false);
  if (!record.webContents.isDestroyed()) record.webContents.close();
  sharedSession?.flushStorageData();
  if (!current) return;
  messageOverlay = false;
  if (!quitting && windowContents(mainWindow)) {
    if (mainWindow.isFullScreen()) mainWindow.setFullScreen(false);
    setPortalVisible(portalReady); bounds();
    void navigate('library').catch(() => {});
    refreshAccount();
    if (!quitApproved) void checkAndApplyUpdates({ reschedule: true });
  }
  broadcast();
}
async function exitCurrentGame() {
  const record = currentGame();
  if (!record || record.closed) return;
  if (record.__exitPrompt) return record.__exitPrompt;
  record.__exitPrompt = (async () => {
    const name = gameById(record.__gameId).name;
    const result = await dialog.showMessageBox(mainWindow, { type: 'question', title: 'Leave ' + name + '?', message: 'Return to your library?', detail: record.__gameId === 'morogue' ? 'Your unfinished Mora Mode or Endless Night run will end. Completed online results remain on your account.' : 'Your progress will be saved before leaving ' + name + '.', buttons: ['Keep playing', 'Exit game'], defaultId: 0, cancelId: 0, noLink: true });
    if (!quitting && result.response === 1 && games.get(record.__gameId) === record) await closeGame(record);
  })().catch(error => { if (!quitting) dialog.showErrorBox('Unable to save and close', error.message); throw error; }).finally(() => { record.__exitPrompt = null; });
  return record.__exitPrompt;
}
async function openMessages() {
  const contents = activePortal();
  if (!contents || !windowContents(mainWindow)) throw Error('The launcher is closing.');
  messageOverlay = true;
  const game = currentGame(); if (gameContents(game)) game.view.setVisible(false);
  setPortalVisible(portalReady); bounds(); broadcast();
  if (!portalReady) await loadPortal();
  if (contents !== activePortal()) return;
  if (!hiddenTest) contents.focus();
  await contents.executeJavaScript(`(async()=>{const deadline=Date.now()+5000;while(!window.repoMessaging?.open&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));if(!window.repoMessaging?.open)throw Error('Messages are still connecting. Please try again.');await window.repoMessaging.open();})()`);
}
async function gameCommand(event, action, value) {
  if (quitting || !windowContents(mainWindow)) throw new Error('The launcher is closing.');
  const found = [...games.entries()].find(([_id, window]) => { const contents = gameContents(window); return contents && contents === event.sender && event.senderFrame && event.senderFrame === contents.mainFrame; });
  if (!found || new URL(event.senderFrame.url).origin !== gameById(found[0]).origin) throw new Error('This action belongs to the game.');
  const window = found[1];
  if (action === 'connection') { await account.refresh(); return gameConnection(window); }
  if (action === 'session') {
    const identity = await account.requireOnline();
    const session = await portalSession();
    if (!gameContents(window) || identity !== window.__accountId || session?.user?.id !== identity || session.access_token !== account.token) throw new Error('Your account changed. Return to the launcher and sign in again.');
    return { access_token: account.token, user: { id: identity } };
  }
  if (action === 'game') gameById(value);
  if (!['exit', 'account', 'game'].includes(action)) throw new Error('Unknown game action.');
  await closeGame(window); showWindow(mainWindow);
  if (action === 'account') await navigate('account');
  if (action === 'game') selectLibrary(value);
}
async function playWeb(id) {
  const demo = demoById(id);
  const identity = await account.requireOnline();
  await reconcileEmbeddedDemo();
  if (quitting || !windowContents(mainWindow) || !activePortal()) throw new Error('The launcher is closing.');
  if (account.state.status !== 'online' || account.identity !== identity) throw new Error('Your account changed. Sign in again before playing.');
  if (games.has(id)) { focusGame(games.get(id)); return; }
  if (embeddedDemo?.id === id) { showWindow(mainWindow); return; }
  if (games.size || embeddedDemo) throw new Error('Close your current game before starting another.');
  {
    const contents = activePortal(), record = { id, identity, contents, runtime: demo.runtime, revision: ++demoLaunchRevision, opening: true };
    embeddedDemo = record; broadcast();
    try {
      const start = demo.runtime === 'dragonbound' ? `
        if(!window.repoAccount?.db?.auth)throw Error('Your account is still loading. Please try again.');
        window.repoSupabaseClient=window.repoAccount.db;
        if(window.DragonboundStandaloneLauncher?.launcherBridgeVersion!==1)await new Promise((resolve,reject)=>{
          const script=document.createElement('script');script.src='/__repo-launcher/dragonbound-web.js';
          const timer=setTimeout(()=>{script.remove();reject(Error('Dragonbound could not connect. Please try again.'));},15000);
          script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('Dragonbound could not connect. Please try again.'));};document.head.append(script);
        });
        verify();
        if(window.DragonboundStandaloneLauncher?.launcherBridgeVersion!==1||!window.DragonboundStandaloneLauncher?.open)throw Error('Dragonbound is unavailable. Please try again.');
        window.DragonboundStandaloneLauncher.open({accountId:${JSON.stringify(identity)}});`
        : `if(!window.repoLegacy?.open)throw Error('Your demo collection is still loading. Please try again.');await window.repoLegacy.close();verify();await window.repoLegacy.open(${JSON.stringify(id)});`;
      const opened = await contents.executeJavaScript(`(async()=>{
        window.__repoLauncherDemoTicket=${record.revision};
        const verify=()=>{if(window.__repoLauncherDemoTicket!==${record.revision}||window.repoAccount?.state?.user?.id!==${JSON.stringify(identity)})throw Error('Your account changed. Sign in again before playing.');};verify();
        dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
        window.demoLibrary?.close(false);
        ${start}
        ${demoVisibility(record)}
      })()`);
      record.opening = false;
      if (!opened || embeddedDemo !== record || account.state.status !== 'online' || account.identity !== identity) throw new Error('The demo could not open. Check your account and try again.');
      discordPresence?.gameStarted(id); showWindow(mainWindow); broadcast();
    } catch (error) { closeEmbeddedDemo(record); throw error; }
    return;
  }
}
async function play(id) {
  const game = gameById(id);
  if (!game.installable) throw new Error('This game is coming to the desktop library.');
  await reconcileEmbeddedDemo();
  if (games.has(id)) { focusGame(games.get(id)); return; }
  if (games.size || embeddedDemo) throw new Error('Close your current game before starting another.');
  const current = library.getInstalled(id);
  if (!current) throw new Error('Install this game before playing.');
  const download = library.snapshot()[id];
  if (library.isBusy(id) || ['downloading', 'updating', 'verifying'].includes(download?.status)) throw new Error('Wait for the update to finish before playing.');
  const identity = await account.requireOnline(id === 'morogue' ? game.origin : undefined);
  if (id === 'morogue') {
    await activePortal()?.executeJavaScript('(async()=>{if(window.repoCharacterSync)await window.repoCharacterSync.ready();})()');
    if ((await portalSession())?.user?.id !== identity) throw new Error('Your account changed. Sign in again before playing.');
  }
  // Reserve synchronously after the account check so a second click cannot create two runs.
  if (games.has(id)) { focusGame(games.get(id)); return; }
  if (quitting || !mainWindow || mainWindow.isDestroyed()) throw new Error('The launcher is closing.');
  if (games.size || embeddedDemo) throw new Error('Close your current game before starting another.');
  if (!library.getInstalled(id)) throw new Error('This game is no longer installed.');
  if (library.isBusy(id) || ['downloading', 'updating', 'verifying'].includes(library.snapshot()[id]?.status)) throw new Error('Wait for the installation to finish before playing.');
  const gameView = new WebContentsView({
    webPreferences: { session: sharedSession, preload: path.join(desktopRoot, 'game-preload.cjs'), additionalArguments: ['--repo-account-id=' + identity, '--repo-game-id=' + id], contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, backgroundThrottling: false }
  });
  gameView.setBackgroundColor('#121713');
  const record = { view: gameView, webContents: gameView.webContents, __accountId: identity, __gameId: id, closed: false, loading: true };
  games.set(id, record); mainWindow.contentView.addChildView(gameView); focusGame(record);
  let presenceStarted = false, presenceEnded = false;
  function startGamePresence() {
    const contents = gameContents(record);
    if (presenceStarted || presenceEnded || quitting || !contents || games.get(id) !== record) return;
    try { if (new URL(contents.getURL()).origin !== game.origin) return; } catch { return; }
    record.loading = false; record.view.setVisible(!messageOverlay); if (!hiddenTest && !messageOverlay) contents.focus(); broadcast();
    presenceStarted = true; discordPresence?.gameStarted(id);
  }
  function stopGamePresence() {
    if (presenceEnded) return;
    presenceEnded = true;
    if (games.get(id) === record) discordPresence?.gameStopped(id);
  }
  record.stopPresence = stopGamePresence;
  secureContents(record.webContents, value => { try { return new URL(value).origin === game.origin; } catch { return false; } });
  record.webContents.on('will-navigate', (event, destination) => { if (isPortalUrl(destination)) { event.preventDefault(); void exitCurrentGame().catch(() => {}); } });
  // Large optional assets may keep loadURL pending after the game is usable.
  // Register this live game document as soon as its DOM is ready instead.
  record.webContents.on('dom-ready', startGamePresence);
  record.webContents.on('did-fail-load', (_event, code, _description, _url, isMainFrame) => { if (isMainFrame && code !== -3) stopGamePresence(); });
  record.webContents.on('focus', () => { if (!record.closed && games.get(id) === record) discordPresence?.gameFocused(id); });
  record.webContents.on('render-process-gone', () => { disposeGame(record); if (!quitting) dialog.showErrorBox(game.name + ' closed unexpectedly', 'Your previously saved progress and completed online results remain. Reopen the game from your library.'); });
  record.webContents.on('destroyed', () => disposeGame(record));
  try { await record.webContents.loadURL(game.origin + '/'); startGamePresence(); }
  catch { const wasClosed = record.closed; disposeGame(record); if (!quitting && !wasClosed) throw new Error(game.name + ' could not open. Repair its installation and try again.'); }
}
async function command(event, action, value) {
  if (!trustedShell(event)) throw new Error('This action belongs to the launcher.');
  return executeCommand(action, value);
}
async function portalCommand(event, action, value) {
  const contents = activePortal();
  if (!contents || event.sender !== contents || !event.senderFrame || event.senderFrame !== contents.mainFrame || !isPortalUrl(event.senderFrame.url)) throw new Error('This action belongs to the Repo Company website.');
  // The isolated portal preload has no public bridge. It accepts real clicks
  // on the website's own controls and exposes no paths, tokens or execution API.
  if (!['state', 'install', 'update', 'uninstall', 'cancel', 'play', 'play-web', 'web-demo-closed', 'refresh', 'navigate', 'launcher-update', 'launcher-reconnect', 'launcher-restart', 'automatic-game-updates', 'discord-presence', 'social-state'].includes(action)) throw new Error('This desktop action is unavailable.');
  return executeCommand(action, value);
}
async function executeCommand(action, value) {
  if (['navigate', 'messages', 'install', 'update', 'uninstall', 'automatic-game-updates', 'discord-presence'].includes(action)) await account.requireOnline();
  switch (action) {
    case 'state': return state();
    case 'sign-in': return signIn(value);
    case 'navigate': await navigate(value); return state();
    case 'exit-game': await exitCurrentGame(); return state();
    case 'messages': await openMessages(); return state();
    case 'resume-game': if (currentGame()) focusGame(currentGame()); else { messageOverlay = false; broadcast(); } return state();
    case 'social-state':
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !['unread', 'callActive', 'incomingCall', 'open'].includes(key)) || !Object.hasOwn(value, 'unread') || !Object.hasOwn(value, 'callActive') || !Number.isInteger(value.unread) || value.unread < 0 || value.unread > 999 || typeof value.callActive !== 'boolean' || ['incomingCall', 'open'].some(key => Object.hasOwn(value, key) && typeof value[key] !== 'boolean')) throw TypeError('Invalid message status.');
      socialState = { unread: value.unread, callActive: value.callActive, incomingCall: value.incomingCall === true, open: value.open === true }; broadcast(); return;
    case 'website': await shell.openExternal(config.portalOrigin); return;
    case 'refresh': if (!portalReady) await loadPortal(); if (quitting) return; await Promise.allSettled([account.refresh(), checkAndApplyUpdates()]); return state();
    case 'launcher-update': return checkLauncherUpdates();
    case 'launcher-reconnect': scheduleLauncherReconnect(); return;
    case 'launcher-restart': requestLauncherRestart(); return;
    case 'automatic-game-updates':
      if (typeof value !== 'boolean') throw new TypeError('Automatic game updates must be on or off.');
      await preferences.setAutomaticGameUpdates(value);
      broadcast();
      if (value && !quitting && !quitApproved) void checkAndApplyUpdates({ reschedule: true });
      return state();
    case 'discord-presence':
      if (typeof value !== 'boolean') throw new TypeError('Discord activity must be on or off.');
      await preferences.setDiscordPresence(value);
      discordPresence?.setEnabled(value); broadcast();
      return state();
    case 'window':
      if (value === 'minimize') mainWindow.minimize();
      else if (value === 'maximize') mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
      else if (value === 'close') mainWindow.close();
      else if (value === 'fullscreen' && currentGame()) mainWindow.setFullScreen(!mainWindow.isFullScreen());
      else throw new Error('Unknown window action.');
      return;
    case 'play': return play(value);
    case 'play-web': return playWeb(value);
    case 'web-demo-closed': demoById(value); if (embeddedDemo?.id === value) await reconcileEmbeddedDemo(); return;
    case 'cancel': gameById(value); return library.cancel(value);
    case 'install': case 'update': {
      const game = gameById(value);
      if (!game.installable) throw new Error('This game is not available to install yet.');
      if (games.has(value)) throw new Error('Close the game before changing its installation.');
      // Interactive library actions require the same verified account as the portal.
      return action === 'install' ? library.install(value) : library.update(value);
    }
    case 'uninstall': {
      const game = gameById(value);
      if (games.has(value)) throw new Error('Close the game before uninstalling it.');
      const answer = await dialog.showMessageBox(mainWindow, { type: 'question', title: 'Uninstall ' + game.name, message: 'Uninstall ' + game.name + '?', detail: 'Game files will be removed. Your account achievements, leaderboard results and local preferences will be kept.', buttons: ['Keep game', 'Uninstall'], defaultId: 0, cancelId: 0, noLink: true });
      if (answer.response === 1 && !quitting && windowContents(mainWindow)) {
        if (games.has(value)) throw new Error('Close the game before uninstalling it.');
        await library.uninstall(value);
      }
      return;
    }
    default: throw new Error('Unknown launcher action.');
  }
}
async function launch() {
  preferences = await new Preferences(path.join(app.getPath('userData'), 'preferences.json')).init();
  if (quitting) return;
  // Development smoke tests must never publish fixture activity to a player's
  // real Discord client. Packaged games use only the confirmed application IDs.
  discordPresence = new DiscordPresence({ applications: fixtures || hiddenTest ? {} : config.discordApplications || {}, enabled: preferences.snapshot().discordPresence });
  discordPresence.on('change', broadcast);
  sharedSession = session.fromPartition('persist:repo-company');
  configureSessionPermissions(sharedSession);
  sharedSession.on('will-download', (event, item, contents) => {
    const record = [...games.entries()].find(([id, window]) => id !== 'morogue' && gameContents(window) === contents);
    // Only explicit game save exports may use the native Save As dialog.
    const game = record && gameById(record[0]);
    if (!game || !item.getURL().startsWith('blob:' + game.origin + '/') || !/\.(json|velmora|moratales)$/i.test(item.getFilename())) { event.preventDefault(); return; }
    item.setSaveDialogOptions({ title: 'Export ' + game.name + ' save', defaultPath: path.join(app.getPath('downloads'), path.basename(item.getFilename())) });
  });
  sharedSession.webRequest.onBeforeRequest(handlePortalRequest);
  const network = (request, options = {}) => {
    const signal = AbortSignal.any([shutdown.signal, ...(options.signal ? [options.signal] : request?.signal ? [request.signal] : [])]);
    if (signal.aborted) return Promise.reject(new Error('The launcher connection has closed.'));
    return fixtures ? fixtures.fetch(request, { ...options, signal }) : sharedSession.fetch(request, { ...options, signal, bypassCustomProtocolHandlers: true });
  };
  library = new Library({ root: path.join(app.getPath('userData'), 'library'), catalog: { games: config.games.filter(game => game.installable) }, fetchImpl: network });
  await library.init(); if (quitting) return; library.on('change', broadcast);
  await sharedSession.protocol.handle('https', createHandler({ config, library, desktopRoot, fetchNetwork: network }));
  await session.defaultSession.protocol.handle('repo-launcher', request => {
    const url = new URL(request.url);
    if (url.hostname !== 'app') return new Response('Not found', { status: 404 });
    return serveFile(request, path.join(desktopRoot, 'renderer'), url.pathname === '/' ? '/index.html' : url.pathname);
  });
  mainWindow = new BrowserWindow({
    width: 1480, height: 940, minWidth: 1100, minHeight: 720, frame: false, show: false,
    title: 'Repo Company', backgroundColor: '#101411', autoHideMenuBar: true,
    icon: path.join(desktopRoot, 'renderer/assets/app.ico'),
    webPreferences: { preload: path.join(desktopRoot, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true }
  });
  secureContents(mainWindow.webContents, value => value === 'repo-launcher://app/index.html');
  portal = new WebContentsView({ webPreferences: { session: sharedSession, preload: path.join(desktopRoot, 'portal-preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, backgroundThrottling: false } });
  portalContents = portal.webContents; portalContentsId = portalContents.id;
  mainWindow.contentView.addChildView(portal); portal.setVisible(false); bounds();
  secureContents(portalContents, isPortalUrl);
  portalContents.on('destroyed', () => { mediaPermissions?.reset(); if (embeddedDemo) discordPresence?.gameStopped(embeddedDemo.id); embeddedDemo = null; portalReady = false; portalViewVisible = false; lastPortalVisibility = null; portalLoading = false; portalLoadRevision++; portalContentsId = null; portalContents = null; });
  portalContents.on('did-start-navigation', (_event, _url, inPlace, isMainFrame) => { if (isMainFrame && !inPlace) { mediaPermissions?.reset(); closeEmbeddedDemo(); portalReady = false; account?.set({status:'checking',username:'',displayName:'',error:''}); setPortalVisible(false); broadcast(); } });
  portalContents.on('dom-ready', () => { if (!activePortal()) return; portalReady = true; portalError = ''; setPortalVisible(true); notifyPortalVisibility(true); refreshAccount(); broadcast(); });
  portalContents.on('did-finish-load', refreshAccount);
  portalContents.on('did-fail-load', (_event, code, _description, _url, isMainFrame) => {
    if (!activePortal() || !isMainFrame || code === -3) return;
    portalReady = false; portalError = 'Repo Company could not connect. Check your connection and try again.';
    setPortalVisible(false); view = 'library'; broadcast();
  });
  account = new Account({ config, getSession: portalSession, fetchImpl: network }); account.on('change', accountChanged);
  updater = new LauncherUpdater({ config: config.launcherUpdates, packaged: app.isPackaged, currentVersion: app.getVersion(), cacheDir: path.join(app.getPath('userData'), 'launcher-updates'), canRestart: () => !games.size && !embeddedDemo && !gameOperationsBusy() }); updater.on('change', broadcast);
  ipcMain.handle('launcher:command', command);
  ipcMain.handle('launcher:portal', portalCommand);
  ipcMain.handle('launcher:game', gameCommand);
  Menu.setApplicationMenu(null);
  mainWindow.on('resize', bounds);
  mainWindow.on('focus', () => { if (currentGame() && !messageOverlay) { gameContents(currentGame())?.focus(); discordPresence?.gameFocused(currentGame().__gameId); } else if (embeddedDemo) discordPresence?.gameFocused(embeddedDemo.id); notifyPortalVisibility(); });
  for (const event of ['blur', 'minimize', 'restore', 'show', 'hide']) mainWindow.on(event, () => notifyPortalVisibility());
  mainWindow.on('enter-full-screen', () => { bounds(); broadcast(); });
  mainWindow.on('leave-full-screen', () => { bounds(); broadcast(); });
  mainWindow.once('ready-to-show', () => showWindow(mainWindow));
  mainWindow.on('close', handleMainWindowClose);
  mainWindow.on('closed', () => {
    discordPresence?.dispose();
    mediaPermissions?.dispose();
    mainWindow = null; quitting = true; embeddedDemo = null; portalReady = false; portalContentsId = null;
    shutdown.abort(); clearInterval(timer); clearInterval(checkTimer); stopLauncherUpdateChecks(); clearTimeout(broadcastTimer);
    for (const game of [...games.values()]) disposeGame(game);
    const contents = portalContents; portalContents = null; portal = null;
    if (contents && !contents.isDestroyed()) contents.close();
    app.quit();
  });
  await mainWindow.loadURL('repo-launcher://app/index.html');
  if (quitting || !windowContents(mainWindow)) return;
  // Renderer navigation may already have started during the shell's first load.
  // Do not replace its Account/Home request with the background collection load.
  if (!portalReady && !portalLoading) void loadPortal();
  void checkAndApplyUpdates();
  timer = setInterval(refreshAccount, 15000);
  checkTimer = setInterval(() => { void checkAndApplyUpdates(); }, 10 * 60 * 1000);
  startLauncherUpdateChecks();
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => showWindow(mainWindow));
  app.whenReady().then(launch).catch(error => { if (!quitting) { dialog.showErrorBox('Repo Company could not open', error.message); app.exit(1); } });
  app.on('before-quit', event => {
    if (!quitApproved && mainWindow && (games.size || embeddedDemo || gameOperationsBusy())) { event.preventDefault(); mainWindow.close(); return; }
    quitting = true; portalReady = false; portalContentsId = null; discordPresence?.dispose(); mediaPermissions?.dispose(); shutdown.abort(); clearInterval(timer); clearInterval(checkTimer); stopLauncherUpdateChecks(); clearTimeout(broadcastTimer); sharedSession?.flushStorageData();
  });
  app.on('will-quit', finishLauncherQuit);
  app.on('window-all-closed', () => app.quit());
}
