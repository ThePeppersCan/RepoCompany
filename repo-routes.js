(() => {
  'use strict';
  const paths = {wibs: '/Wibs', reparty: '/Reparty'};
  const sectionAt = () => Object.keys(paths).find(name => location.pathname.replace(/\/$/, '') === paths[name]) || '';
  const native = () => document.documentElement.dataset.repoLauncher === 'true';
  let active = '', background = null, applying = false, started = false;
  let requested = sectionAt();

  function entry() {
    const url = new URL(location.href);
    if (sectionAt()) { url.pathname = '/'; url.hash = ''; url.searchParams.delete('room'); }
    return {url: url.pathname + url.search + url.hash, state: history.state, title: document.title};
  }
  function enter(name) {
    if (native() || applying || !paths[name]) return;
    if (!active) background = entry();
    active = name; requested = '';
    // These are the existing overlay views, not a document navigation. Keep
    // history state intact so account/game navigation still owns its entries.
    const url = new URL(location.href); url.pathname = paths[name]; url.hash = '';
    if (name !== 'reparty') url.searchParams.delete('room');
    history.replaceState(history.state, '', url);
    document.title = (name === 'wibs' ? 'Wibs' : 'Reparty') + ' — Repo Company';
  }
  function leave(name) {
    if (native() || applying || active !== name) return;
    active = ''; requested = '';
    const previous = background; background = null;
    if (previous) {
      history.replaceState(previous.state, '', previous.url);
      document.title = previous.title;
    }
  }
  function openRequested() {
    if (!started || !requested || native() || !window.repoAccount?.state.user || document.documentElement.dataset.repoAuth !== 'ready') return;
    const name = requested;
    if (name === 'wibs') window.repoMessaging?.open();
    else window.repoReparty?.open(new URL(location.href).searchParams.get('room') || '');
  }
  function start() {
    if (started) return; started = true;
    addEventListener('repo-account-state', () => queueMicrotask(openRequested));
    new MutationObserver(openRequested).observe(document.documentElement, {attributes: true, attributeFilter: ['data-repo-auth']});
    openRequested();
  }
  // Returning through existing browser history must not leave an unrelated
  // overlay covering the destination, or let game history close a routed view.
  addEventListener('popstate', event => {
    if (native()) return;
    requested = sectionAt();
    applying = true;
    try { window.repoMessaging?.close(); window.repoReparty?.close(); }
    finally { applying = false; active = ''; background = null; }
    if (requested) { event.stopImmediatePropagation(); openRequested(); }
  }, true);
  window.repoRoutes = Object.freeze({enter, leave, start});
})();
