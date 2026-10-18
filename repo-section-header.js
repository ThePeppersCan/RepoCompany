// One navigation layout for Wibs, Reparty and Account. Each owns its controls,
// so opening another section never moves a focused button out of its header.
(() => {
  'use strict';
  const icons = {
    collection: '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><path d="m17 5 3-1 3 15-3 1Z"/>',
    account: '<circle cx="12" cy="7" r="4"/><path d="M3 22v-3a9 9 0 0 1 18 0v3H3Z"/>',
    mute: '<path d="M3 9h5l6-6v18l-6-6H3Z"/><path class="repo-nav-waves" d="M18 8q5 4 0 8M21 4q9 8 0 16"/>',
    more: '<path d="m6 9 6 6 6-6"/>'
  };
  const muted = document.querySelector('[data-audio]'), muteButtons = [], wibsButtons = [], menus = [];
  const el = (tag, cls) => { const n = document.createElement(tag); n.className = cls; return n; };
  function button(name, kind, action) {
    const b = el('button', 'repo-section-button'); b.type = 'button'; b.dataset.nav = kind;
    b.setAttribute('aria-label', name); b.onclick = action;
    if (icons[kind]) b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons[kind] + '</svg>';
    return b;
  }
  function syncMute() {
    const on = muted?.getAttribute('aria-pressed') === 'true';
    for (const b of muteButtons) {
      b.setAttribute('aria-label', on ? 'Unmute audio' : 'Mute audio');
      b.setAttribute('aria-pressed', String(on)); b.querySelector('.repo-nav-waves').style.opacity = on ? '0' : '1';
    }
  }
  function syncUnread(state = window.repoMessaging?.getState()) {
    const total = state?.unread || 0;
    for (const {button, badge} of wibsButtons) {
      const section = button.closest('.repo-section-nav').dataset.section;
      badge.hidden = !total || section === 'wibs'; badge.textContent = total > 99 ? '99+' : String(total);
      button.setAttribute('aria-label', section === 'wibs' ? 'Wibs' : total ? `Wibs, ${total} unread message${total === 1 ? '' : 's'}` : 'Open Wibs');
    }
  }
  function hideMenu(item) { if (item.menu.matches(':popover-open')) item.menu.hidePopover(); }
  window.addEventListener('keydown', event => {
    const item = menus.find(item => item.menu.matches(':popover-open'));
    if (event.key !== 'Escape' || !item) return;
    hideMenu(item); item.trigger.focus({preventScroll:true}); event.preventDefault(); event.stopImmediatePropagation();
  }, true);
  document.addEventListener('close', () => menus.forEach(hideMenu), true);
  addEventListener('resize', () => menus.forEach(hideMenu));
  function create(section) {
    const nav = el('nav', 'repo-section-nav'); nav.setAttribute('aria-label', 'Repo Company'); nav.dataset.section = section;
    nav.append(button('Collection', 'collection', () => window.repoCollection.open()));
    const software = button('Wibsworth', 'wibsworth');
    const softwareIcon = el('span', 'repo-wibsworth-icon'); softwareIcon.setAttribute('aria-hidden', 'true'); software.append(softwareIcon);
    window.repoHeaderMascots.mountWibsworth(software); nav.append(software);
    const wibs = button(section === 'wibs' ? 'Wibs' : 'Open Wibs', 'wibs', () => {
      window.repoMessaging?.open(); window.accountMenu?.close({route:false});
    });
    const mascot = el('span', 'repo-wibs-icon'), badge = el('span', 'repo-section-unread');
    mascot.setAttribute('aria-hidden', 'true'); badge.setAttribute('aria-hidden', 'true'); badge.hidden = true;
    wibs.append(mascot, badge); window.repoHeaderMascots.attachWibs(mascot, wibs);
    wibsButtons.push({button:wibs, badge, section}); nav.append(wibs);
    const divider = el('span', 'repo-section-divider'); divider.setAttribute('aria-hidden', 'true'); nav.append(divider);
    const reparty = button('Reparty', 'reparty', () => { window.repoReparty?.open(); window.accountMenu?.close({route:false}); });
    const tv = el('img', ''); tv.src = '/assets/reparty/reparty-tv.svg'; tv.alt = ''; reparty.append(tv); nav.append(reparty);
    nav.append(button('Account', 'account', () => {
      window.repoMessaging?.close(); window.repoReparty?.close(); window.accountMenu?.open({tab:'profile'});
    }));
    const audio = button('Mute audio', 'mute', () => muted?.click()); muteButtons.push(audio); nav.append(audio);
    nav.querySelector(`[data-nav="${section}"]`)?.setAttribute('aria-current', 'page');
    if (section === 'reparty') {
      const menu = el('div', 'repo-section-menu'); menu.id = 'repo-reparty-header-menu'; menu.setAttribute('popover', 'auto'); menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Reparty options');
      const item = button('Audio & calls', 'audio-settings', () => { menu.hidePopover(); window.repoMedia?.openSettings(); });
      item.textContent = 'Audio & calls'; item.setAttribute('role', 'menuitem'); menu.append(item);
      const trigger = button('More options', 'more', () => {
        if (menu.matches(':popover-open')) { menu.hidePopover(); return; }
        const rect = trigger.getBoundingClientRect(); menu.style.top = rect.bottom + 8 + 'px'; menu.style.right = Math.max(12, innerWidth - rect.right) + 'px';
        menu.showPopover(); item.focus({preventScroll:true});
      });
      trigger.setAttribute('aria-haspopup', 'menu'); trigger.setAttribute('aria-controls', menu.id); trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('keydown', event => { if (event.key === 'ArrowDown') { event.preventDefault(); trigger.click(); } });
      menu.addEventListener('toggle', () => trigger.setAttribute('aria-expanded', String(menu.matches(':popover-open'))));
      menus.push({menu, trigger}); nav.append(trigger, menu);
    }
    syncMute(); syncUnread(); return nav;
  }
  if (muted) new MutationObserver(syncMute).observe(muted, {attributes:true, attributeFilter:['aria-pressed']});
  addEventListener('repo-messaging-state', event => syncUnread(event.detail));
  document.addEventListener('repo-workspace-view', () => syncUnread());
  window.repoSectionHeader = Object.freeze({create});
  const account = document.querySelector('#account-menu .account-header');
  if (account) {
    account.classList.add('repo-section-bar');
    const end = account.querySelector('.account-header-end');
    // Keep the original audio element for Account's existing state observer.
    const legacyAudio = end.querySelector('.account-audio'); legacyAudio.hidden = true;
    end.append(create('account'));
    const brand = account.querySelector('.account-back'); brand.classList.add('repo-section-brand');
    brand.replaceChildren(el('span', 'publisher-mark'), el('span', 'publisher-wordmark'));
  }
})();
