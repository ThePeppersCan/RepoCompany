(() => {
  'use strict';
  const paths = {collection: '/', wibs: '/Wibs', wibsworth: '/Wibsworth', reparty: '/Reparty', account: '/Account', moratales: '/Moratales', manager: '/VelmoraManager', morogue: '/Morogue', 'velmora-tales': '/VelmoraTales', 'comp-run': '/CompRun', demos: '/Demos'};
  const tabs = ['profile', 'friends', 'inventory', 'achievements', 'shop', 'settings', 'binder', 'slabs'];
  const overlay = name => name === 'wibs' || name === 'wibsworth' || name === 'reparty';
  const companion = () => document.documentElement.dataset.repoCompanion === 'true';
  const companionRoute = route => /^(wibs|wibsworth|reparty)$/.test(route)||/^account(?:\/|$)/.test(route)?route:'wibs';
  const native = () => document.documentElement.dataset.repoLauncher === 'true';
  const titleCase = value => value.charAt(0).toUpperCase() + value.slice(1);
  function href(route) {
    if (companion()) return '/app/#'+companionRoute(route);
    if (native()) return '#' + route;
    const [name, tab, item] = route.split('/');
    if (name === 'account') {
      const section = tab === 'progress' ? 'achievements' : tabs.includes(tab) ? tab : 'profile';
      return paths.account + (section === 'profile' && !item ? '' : '/' + titleCase(section)) +
        (item ? '/' + (section === 'achievements' && paths[item] ? paths[item].slice(1) : encodeURIComponent(item)) : '');
    }
    if (name === 'demo' && tab) return paths.demos + '/' + encodeURIComponent(tab);
    return paths[name] || paths.collection;
  }
  function read() {
    const hash = location.hash.slice(1);
    if(companion())return companionRoute(hash);
    if (/^(collection|moratales|manager|morogue|velmora-tales|comp-run|demos|wibs|wibsworth|reparty)$/.test(hash) || /^account(?:\/(?:profile|friends|inventory|achievements|progress|shop|settings|binder|slabs)(?:\/[a-zA-Z0-9_-]+)?)?$/.test(hash) || /^demo\/[a-z0-9_-]+$/.test(hash)) return hash;
    const parts = location.pathname.replace(/\/$/, '').split('/').slice(1);
    const name = Object.keys(paths).find(key => paths[key] === '/' + parts[0]);
    if (name === 'account') {
      const tab = (parts[1] || 'profile').toLowerCase();
      const item = parts[2] || '';
      if (!tabs.includes(tab)) return 'account/profile';
      return 'account/' + tab + (item ? '/' + (tab === 'achievements' ? Object.keys(paths).find(key => paths[key] === '/' + item) || item.toLowerCase() : item) : '');
    }
    if (name === 'demos' && parts[1]) return 'demo/' + parts[1];
    return name || 'collection';
  }
  function normalize() {
    if (native()||companion()) return;
    const route = read(), url = new URL(location.href);
    // Only migrate known app links. Leave unrelated fragments and public pages alone.
    if (!url.hash && route === 'collection') return;
    if (url.hash && route === 'collection' && url.hash !== '#collection') return;
    url.pathname = href(route); url.hash = '';
    if (url.href !== location.href) history.replaceState(history.state, '', url);
  }
  let active = '', background = null, applying = false, started = false, restore;
  let requested = read();

  function entry() {
    const url = new URL(location.href);
    if (overlay(read())) { url.pathname = companion()?'/app/':'/'; url.hash = companion()?'wibs':''; url.searchParams.delete('room'); }
    return {url: url.pathname + url.search + url.hash, state: history.state, title: document.title};
  }
  function enter(name) {
    if (native() || applying || !overlay(name)) return;
    normalize();
    if (!active) background = entry();
    active = name; requested = '';
    // These are the existing overlay views, not a document navigation. Keep
    // history state intact so account/game navigation still owns its entries.
    const url = new URL(location.href); url.pathname = companion()?'/app/':paths[name]; url.hash = companion()?name:'';
    if (name !== 'reparty') url.searchParams.delete('room');
    history.replaceState(history.state, '', url);
    document.title = (name === 'wibs' ? 'Wibs' : name === 'wibsworth' ? 'Wibsworth' : 'Reparty') + ' — Repo Company';
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
    const name = requested; requested = '';
    if (name === 'wibsworth') window.repoWibsworth?.open();
    else if (name === 'wibs') window.repoMessaging?.open();
    else if (name === 'reparty') window.repoReparty?.open(new URL(location.href).searchParams.get('room') || '');
    else restore?.(name);
  }
  function start() {
    if (started) return; started = true;
    normalize();
    addEventListener('repo-account-state', () => queueMicrotask(() => {
      if (!window.repoAccount?.state.user) requested = read();
      openRequested();
    }));
    new MutationObserver(openRequested).observe(document.documentElement, {attributes: true, attributeFilter: ['data-repo-auth']});
    openRequested();
  }
  // Returning through existing browser history must not leave an unrelated
  // overlay covering the destination, or let game history close a routed view.
  addEventListener('popstate', event => {
    if (native()) return;
    normalize(); requested = read();
    applying = true;
    try { window.repoMessaging?.close(); window.repoReparty?.close(); }
    finally { applying = false; active = ''; background = null; }
    if (overlay(requested) || document.documentElement.dataset.repoAuth !== 'ready') { event.stopImmediatePropagation(); openRequested(); }
    else requested = '';
  }, true);
  // Capture this before changing routes or opening a panel. Section-to-section
  // switches should not replay the homepage's brand introduction.
  const shouldPlayIntro = () => read() === 'collection' && !document.querySelector('dialog[open]') && !window.repoWebGame?.active;
  window.repoRoutes = Object.freeze({href, read, enter, leave, start, shouldPlayIntro, register(callback) { restore = callback; }});
})();
