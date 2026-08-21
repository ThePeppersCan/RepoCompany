/*
 * V32.64 — Dragonbound hatch gender reveal + Iskandar baby facing hotfix
 *
 * This file is intentionally a small compatibility patch loaded after the
 * existing Dragonbound engine. It does not alter World Cup/QF behaviour.
 */
(() => {
  'use strict';

  const PATCH = '[DRAGONBOUND V32.64]';
  const profileCache = new Map();
  let revealWorkPending = false;
  let spriteScanPending = false;

  const css = document.createElement('style');
  css.id = 'dragonbound-v32-64-hotfix-style';
  css.textContent = `
    .dragonbound-v32-64-gender-reveal {
      display: block;
      width: max-content;
      max-width: calc(100% - 32px);
      margin: 6px auto 7px;
      padding: 5px 13px 4px;
      border-top: 1px solid rgba(213, 177, 96, .55);
      border-bottom: 1px solid rgba(213, 177, 96, .55);
      color: #ead39a;
      font: inherit;
      font-weight: 800;
      font-size: clamp(12px, 1.15vw, 16px);
      line-height: 1.2;
      letter-spacing: .15em;
      text-align: center;
      text-transform: uppercase;
      text-shadow: 0 1px 8px rgba(0, 0, 0, .72);
      pointer-events: none;
    }

    /*
     * Iskandar's supplied baby frames face the opposite native direction to
     * the other baby sets. The engine's direction transform is correct for
     * the rest of the dragons, so we invert only the Iskandar baby visual.
     * The individual CSS scale property composes with the engine's existing
     * transform, so movement positioning/animation is left untouched.
     */
    .dragonbound-v32-64-iskandar-facing-fix {
      scale: -1 1 !important;
      transform-origin: 50% 50% !important;
    }
  `;
  document.head.appendChild(css);

  function currentUsername() {
    try {
      if (typeof character !== 'undefined' && character && character.username) {
        return String(character.username).trim();
      }
    } catch (_) {}

    try {
      const fallbacks = [
        window.currentCharacter,
        window.selectedCharacter,
        window.repoCharacter
      ];
      for (const item of fallbacks) {
        const value = typeof item === 'function' ? item() : item;
        if (value && value.username) return String(value.username).trim();
      }
    } catch (_) {}

    return '';
  }

  function database() {
    try {
      return typeof db !== 'undefined' ? db : null;
    } catch (_) {
      return null;
    }
  }

  async function getDragonProfile(username) {
    const key = String(username || '').trim().toLowerCase();
    if (!key) return null;
    if (profileCache.has(key)) return profileCache.get(key);

    const client = database();
    if (!client?.from) return null;

    try {
      const { data, error } = await client
        .from('dragonbound_profiles')
        .select('username, gender, locked_egg, breed_id, dragon_name, dragon_hatched_at')
        .ilike('username', username)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) profileCache.set(key, data);
      return data || null;
    } catch (error) {
      console.warn(`${PATCH} Could not read Dragonbound profile for gender reveal.`, error);
      return null;
    }
  }

  function leafMatching(root, pattern) {
    if (!root) return null;
    const all = root.querySelectorAll('*');
    for (const el of all) {
      if (el.children.length) continue;
      const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      if (pattern.test(text)) return el;
    }
    return null;
  }

  function findRevealRoot() {
    const markers = Array.from(document.querySelectorAll('body *')).filter(el => {
      if (el.children.length) return false;
      const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
      return /^YOUR DRAGON HAS HATCHED!?$/i.test(text);
    });

    for (const marker of markers) {
      let node = marker;
      for (let depth = 0; node && node !== document.body && depth < 10; depth++, node = node.parentElement) {
        const text = String(node.textContent || '').replace(/\s+/g, ' ').trim();
        if (/What will you call them\?/i.test(text)) return { root: node, marker };
      }
    }
    return null;
  }

  function genderPresentation(rawGender) {
    const gender = String(rawGender || '').trim().toLowerCase();
    if (!gender) return null;
    if (gender === 'female' || gender === 'girl' || gender === 'f') {
      return { label: "IT'S A GIRL!", aria: "Your dragon is female." };
    }
    if (gender === 'male' || gender === 'boy' || gender === 'm') {
      return { label: "IT'S A BOY!", aria: "Your dragon is male." };
    }
    const pretty = gender.charAt(0).toUpperCase() + gender.slice(1);
    return { label: `GENDER: ${pretty}`, aria: `Your dragon's gender is ${pretty}.` };
  }

  function makeLiveAnnouncement(text) {
    let live = document.getElementById('dragonbound-v32-64-live-announcer');
    if (!live) {
      live = document.createElement('div');
      live.id = 'dragonbound-v32-64-live-announcer';
      live.setAttribute('aria-live', 'polite');
      live.setAttribute('aria-atomic', 'true');
      Object.assign(live.style, {
        position: 'fixed',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap'
      });
      document.body.appendChild(live);
    }
    live.textContent = '';
    setTimeout(() => { live.textContent = text; }, 25);
  }

  async function applyGenderReveal() {
    const found = findRevealRoot();
    if (!found) return;

    const { root } = found;
    if (root.querySelector('.dragonbound-v32-64-gender-reveal')) return;

    const username = currentUsername();
    if (!username) return;
    const profile = await getDragonProfile(username);
    const display = genderPresentation(profile?.gender);
    if (!display) return;

    // The reveal may have been rerendered while Supabase was responding.
    const refreshed = findRevealRoot();
    if (!refreshed?.root) return;
    const revealRoot = refreshed.root;
    if (revealRoot.querySelector('.dragonbound-v32-64-gender-reveal')) return;

    const badge = document.createElement('div');
    badge.className = 'dragonbound-v32-64-gender-reveal';
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-label', display.aria);
    badge.textContent = display.label;

    let title = null;
    const headings = revealRoot.querySelectorAll('h1,h2,h3,h4,[class*="title" i]');
    for (const candidate of headings) {
      const text = String(candidate.textContent || '').replace(/\s+/g, ' ').trim();
      if (/\bDragon\b/i.test(text) && !/hatched/i.test(text)) {
        title = candidate;
        break;
      }
    }

    const subtitle = leafMatching(revealRoot, /Hatched from your .+ egg/i);
    const prompt = leafMatching(revealRoot, /What will you call them\?/i);

    if (title?.parentNode) {
      title.insertAdjacentElement('afterend', badge);
    } else if (subtitle?.parentNode) {
      subtitle.insertAdjacentElement('beforebegin', badge);
    } else if (prompt?.parentNode) {
      prompt.parentNode.insertBefore(badge, prompt);
    } else {
      revealRoot.appendChild(badge);
    }

    makeLiveAnnouncement(`Your dragon has hatched. ${display.aria}`);
    console.info(`${PATCH} Hatch reveal gender displayed for ${username}: ${profile.gender}`);
  }

  function scheduleRevealWork() {
    if (revealWorkPending) return;
    revealWorkPending = true;
    setTimeout(() => {
      revealWorkPending = false;
      void applyGenderReveal();
    }, 50);
  }

  function lineageDescriptor(el, maxDepth = 7) {
    const bits = [];
    let node = el;
    for (let i = 0; node && node !== document.body && i < maxDepth; i++, node = node.parentElement) {
      bits.push(node.id || '');
      bits.push(typeof node.className === 'string' ? node.className : '');
      for (const key of ['breed', 'dragon', 'region', 'egg', 'type', 'pet', 'sprite']) {
        if (node.dataset?.[key]) bits.push(node.dataset[key]);
      }
      for (const attr of ['data-breed-id', 'data-breed', 'data-dragon', 'data-region', 'aria-label', 'title']) {
        const value = node.getAttribute?.(attr);
        if (value) bits.push(value);
      }
    }
    return bits.join(' ');
  }

  function isInsideHatchReveal(el) {
    let node = el;
    for (let depth = 0; node && node !== document.body && depth < 8; depth++, node = node.parentElement) {
      const text = String(node.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length < 3000 && /YOUR DRAGON HAS HATCHED/i.test(text) && /What will you call them\?/i.test(text)) {
        return true;
      }
    }
    return false;
  }

  function markIskandarBabyVisual(el) {
    if (!(el instanceof Element)) return false;
    if (el.classList.contains('dragonbound-v32-64-iskandar-facing-fix')) return true;
    if (isInsideHatchReveal(el)) return false;

    let visual = '';
    if (el.tagName === 'IMG') {
      visual += ` ${el.currentSrc || el.getAttribute('src') || ''}`;
      visual += ` ${el.getAttribute('alt') || ''}`;
    }
    try {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') visual += ` ${bg}`;
    } catch (_) {}

    const lineage = lineageDescriptor(el);
    const descriptor = `${visual} ${lineage}`;

    if (!/iskandar/i.test(descriptor)) return false;
    if (!/(dragonbound|baby|baby-dragon|dragon-baby|dragon|pet|creature)/i.test(descriptor)) return false;

    // Prefer actual animated/sprite visuals, not decorative Iskandar artwork.
    const motionHint = /(walk|walking|idle|sleep|sleeping|fly|flying|sprite|frame|baby|pet)/i.test(descriptor);
    if (!motionHint) return false;

    const rect = el.getBoundingClientRect();
    if (rect.width > 280 || rect.height > 280) return false;
    if (rect.width === 0 && rect.height === 0) return false;

    el.classList.add('dragonbound-v32-64-iskandar-facing-fix');
    el.dataset.v3264IskandarFacingFix = '1';
    console.info(`${PATCH} Corrected Iskandar baby facing on`, el);
    return true;
  }

  function scanForIskandarBaby() {
    const candidates = document.querySelectorAll('img, canvas, [style*="background" i], [class*="sprite" i], [class*="baby" i], [class*="dragon" i]');
    for (const el of candidates) markIskandarBabyVisual(el);
  }

  function scheduleSpriteScan() {
    if (spriteScanPending) return;
    spriteScanPending = true;
    requestAnimationFrame(() => {
      spriteScanPending = false;
      scanForIskandarBaby();
    });
  }

  const observer = new MutationObserver(() => {
    scheduleRevealWork();
    scheduleSpriteScan();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'class', 'style', 'data-breed', 'data-breed-id', 'data-dragon', 'data-region']
  });

  window.addEventListener('repo-character-changed', () => {
    profileCache.clear();
    scheduleRevealWork();
    scheduleSpriteScan();
  });

  document.addEventListener('click', event => {
    if (event.target.closest('#openDragonbound,[class*="dragonbound" i]')) {
      setTimeout(scheduleRevealWork, 120);
      setTimeout(scheduleSpriteScan, 120);
    }
  }, true);

  // A short low-frequency scan catches frame swaps that change only computed
  // background state inside the existing baby engine.
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      scheduleRevealWork();
      scheduleSpriteScan();
    }
  }, 700);

  scheduleRevealWork();
  scheduleSpriteScan();
})();
