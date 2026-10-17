// Silent, local brand motion. No AI requests or chat interface.
(() => {
  'use strict';
  const art = window.repoWibsArt;
  if (!art) return;
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = (a, b, t) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
  const envelope = (t, a, b, c, d) => smooth(a, b, t) * (1 - smooth(c, d, t));
  const set = (node, key, value) => node.setAttribute(key, typeof value === 'number' ? value.toFixed(3) : value);
  const pivot = (x, y, angle, sx = 1, sy = sx) => `translate(${x} ${y}) rotate(${angle}) scale(${sx} ${sy}) translate(${-x} ${-y})`;

  function rig(host, software) {
    host.style.background = 'none';
    const root = host.attachShadow({mode: 'open'});
    // Shadow roots keep the two masks and styles independent of page SVG rules.
    root.innerHTML = `<style>:host{display:block}svg{display:block;width:100%;height:100%;overflow:visible;fill:none;stroke:none;pointer-events:none}</style>
      <svg viewBox="250 380 750 500" aria-hidden="true">
        <defs><mask id="face" maskUnits="userSpaceOnUse" x="180" y="300" width="890" height="650">
          <rect x="180" y="300" width="890" height="650" fill="white"/>
          <g class="eyes" fill="black"><ellipse class="eye-l" cx="${software ? 530 : 517}" cy="${software ? 600 : 663}" rx="28" ry="45"/><ellipse class="eye-r" cx="${software ? 720 : 734}" cy="${software ? 600 : 663}" rx="28" ry="45"/></g>
          ${software ? '<path class="wave" fill="black"/>' : '<path d="M608 688Q626 709 643 688" fill="none" stroke="black" stroke-width="13" stroke-linecap="round"/>'}
        </mask></defs>
        <g class="actor" fill="#f4ecd6">
          <path d="${art.body}" mask="url(#face)"/>
          <path class="ear-l" d="${art.leftEar}"/><path class="ear-r" d="${art.rightEar}"/>
          <g class="equipment"></g>
          <path class="paw-l" d="${art.leftPaw}"/><path class="paw-r" d="${art.rightPaw}"/>
        </g><g class="thought" opacity="0" stroke="#f4ecd6" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"></g>
      </svg>`;
    const q = s => root.querySelector(s);
    return {root, q, actor:q('.actor'), ears:[q('.ear-l'),q('.ear-r')], eyes:[q('.eye-l'),q('.eye-r')]};
  }

  function hoverMotion(host, trigger, draw) {
    let frame = 0, previous = 0, clock = 0, activity = 0, hovered = false, focused = false, inView = false;
    const visible = () => inView && !document.hidden && document.documentElement.dataset.repoPortalVisible !== 'false' && host.getClientRects().length;
    function reset() {
      cancelAnimationFrame(frame); frame = 0; previous = 0; clock = 0; activity = 0;
      draw(0, 0, false); delete host.dataset.animating;
    }
    function tick(now) {
      frame = 0;
      if (reduced.matches || !visible()) { reset(); return; }
      const dt = previous ? Math.min((now - previous) / 1000, .05) : 0;
      previous = now; clock += dt;
      const active = hovered || focused;
      activity += ((active ? 1 : 0) - activity) * (1 - Math.exp(-dt * 9));
      draw(clock, activity, active);
      if (!active && activity < .002) { reset(); return; }
      host.dataset.animating = 'true';
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      if (reduced.matches || !visible()) { reset(); return; }
      if (!frame && (hovered || focused || activity)) { previous = 0; frame = requestAnimationFrame(tick); }
    }
    trigger.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') { hovered = true; sync(); } });
    trigger.addEventListener('pointerleave', () => { hovered = false; sync(); });
    trigger.addEventListener('focus', () => { focused = trigger.matches(':focus-visible'); sync(); });
    trigger.addEventListener('blur', () => { focused = false; sync(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { hovered = false; reset(); } else sync(); });
    window.addEventListener('repo-launcher-portal-visibility', sync);
    reduced.addEventListener('change', sync);
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }).observe(host);
    draw(0, 0, false);
  }

  function attachWibs(host, trigger) {
    if (!host || host.shadowRoot) return;
    const r = rig(host, false);
    r.q('.equipment').innerHTML = `
      <g class="headset" opacity="0" stroke="#f4ecd6" stroke-width="23" stroke-linecap="round" fill="none">
        <path d="M410 570V520C410 325 840 325 840 520V570"/>
        <g fill="#243129"><rect x="384" y="532" width="65" height="128" rx="29"/><rect x="802" y="532" width="65" height="128" rx="29"/></g>
        <path d="M834 647Q832 728 720 726" stroke-width="15"/><rect x="689" y="712" width="46" height="26" rx="13" fill="#f4ecd6" stroke="none"/>
      </g>
      <g class="keyboard" opacity="0" stroke="#f4ecd6" stroke-linejoin="round" stroke-width="14">
        <path d="M456 818H794L827 938H423Z" fill="#1c2921"/>
        <path d="M469 848H782M458 878H794M448 908H805M515 832L502 890M570 832L565 890M625 832V890M680 832L685 890M735 832L748 890" opacity=".65" stroke-width="9"/>
        <path d="M548 912H702" stroke-width="12" stroke-linecap="round"/>
      </g>`;
    const headset = r.q('.headset'), keyboard = r.q('.keyboard'), paws = [r.q('.paw-l'), r.q('.paw-r')];
    hoverMotion(host, trigger, (clock, activity) => {
      // Put it on, type for a moment, pack away, then a quiet rest before repeating.
      const t = clock % 6.4;
      const equipped = envelope(t, .2, 1.05, 4.2, 4.95) * activity;
      const typing = envelope(t, 1.35, 1.75, 3.65, 4.05) * activity;
      const desk = envelope(t, .65, 1.3, 4, 4.65) * activity;
      set(headset, 'opacity', equipped);
      set(headset, 'transform', `translate(0 ${-125 * (1 - equipped)}) ${pivot(625, 520, -5 * (1 - equipped))}`);
      set(keyboard, 'opacity', desk);
      set(keyboard, 'transform', `translate(0 ${70 * (1 - desk)}) ${pivot(625, 870, 0, .8 + .2 * desk)}`);
      const bob = Math.sin(clock * 9) * typing * 3;
      set(r.actor, 'transform', `translate(0 ${-activity * 5 + bob}) ${pivot(625, 842, Math.sin(clock * 2) * typing * .7)}`);
      r.ears.forEach((ear, i) => set(ear, 'transform', pivot(i ? 782 : 471, 466, (i ? -1 : 1) * (equipped * 3 + typing * Math.sin(clock * 7) * 1.2))));
      paws.forEach((paw, i) => {
        const tap = (Math.sin(clock * 15 + i * Math.PI) + 1) * 5 * typing;
        set(paw, 'transform', `translate(${(i ? -8 : 8) * desk} ${-22 * desk + tap})`);
      });
      const blink = envelope(t, 1.05, 1.13, 1.2, 1.32) + envelope(t, 5.1, 5.18, 5.24, 5.37);
      r.eyes.forEach(eye => set(eye, 'ry', 45 * (1 - .94 * blink * activity)));
      set(r.q('.eyes'), 'transform', `translate(${Math.sin(clock * 1.8) * typing * 4} ${typing * 9})`);
    });
  }

  function attachWibsworth(host, trigger) {
    if (!host || host.shadowRoot) return;
    const r = rig(host, true), thought = r.q('.thought');
    const create = (tag, attributes, parent = thought) => {
      const node = document.createElementNS(NS, tag);
      for (const [key, value] of Object.entries(attributes)) set(node, key, value);
      parent.append(node); return node;
    };
    const starPath = 'M0 -90 24 -28 90 -28 38 12 55 76 0 39-55 76-38 12-90-28-24-28Z';
    const kinds = ['star', 'book', 'sum', 'constellation', 'bulb', 'plane'];
    let deck = [], last = '', current = '', start = 0, next = .5, parts = [], phase = 0, previousClock = 0;
    function choose() {
      if (!deck.length) {
        deck = kinds.slice();
        for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
        if (deck.at(-1) === last) [deck[0], deck[deck.length - 1]] = [deck.at(-1), deck[0]];
      }
      last = deck.pop(); return last;
    }
    function mountThought(name) {
      thought.replaceChildren(); parts = [];
      create('circle', {cx:650, cy:346, r:8, fill:'#f4ecd6', stroke:'none', opacity:.3});
      create('circle', {cx:675, cy:318, r:12, fill:'#f4ecd6', stroke:'none', opacity:.45});
      const group = create('g', {transform:'translate(625 150) scale(1.5)'});
      if (name === 'star') {
        parts.push(create('path', {d:'M-130 45 -10 6M-100 80 -30 50', opacity:.4}, group));
        parts.push(create('path', {d:starPath, transform:'scale(.68)'}, group));
      } else if (name === 'book') {
        parts.push(create('g', {}, group));
        create('path', {d:'M0-64Q-66-101-137-64V76Q-66 40 0 76Q66 40 137 76V-64Q66-101 0-64V76'}, parts[0]);
        for (const [x,y] of [[-105,-30],[-105,4],[34,-30],[34,4]]) parts.push(create('path', {d:`M${x} ${y}h66`, 'stroke-width':11, pathLength:1, 'stroke-dasharray':1, 'stroke-dashoffset':1}, parts[0]));
      } else if (name === 'sum') {
        const sums = [['7 × 3', '21'], ['8 + 5', '13'], ['12 ÷ 3', '4'], ['9 − 2', '7']];
        const sum = sums[Math.floor(Math.random() * sums.length)];
        const text = create('text', {x:0,y:26,'text-anchor':'middle',fill:'#f4ecd6',stroke:'none','font-family':'Segoe UI, sans-serif','font-size':125}, group);
        [sum[0], ' = ', sum[1]].forEach(word => { const span = create('tspan', {}, text); span.textContent = word; parts.push(span); });
      } else if (name === 'constellation') {
        const points = [[-135,45],[-55,-60],[50,10],[145,-75]];
        for (let i = 0; i < 3; i++) parts.push(create('path', {d:`M${points[i]}L${points[i+1]}`,opacity:.45,pathLength:1,'stroke-dasharray':1}, group));
        for (const [cx,cy] of points) create('circle', {cx,cy,r:13,fill:'#f4ecd6',stroke:'none'}, group);
      } else if (name === 'bulb') {
        parts.push(create('circle', {cx:0,cy:-10,r:110,fill:'#efdc9c',stroke:'none',opacity:0}, group));
        create('path', {d:'M-34 63V40C-98-12-61-90 0-90S98-12 34 40V63ZM-31 92H31M-19 118H19M-8 54V0L14-20'}, group);
      } else {
        parts.push(create('g', {}, group));
        create('path', {d:'M-95-45 105-90 55 90-8 24ZM-8 24 105-90'}, parts[0]);
        create('path', {d:'M-145 85Q-80 110-53 65',opacity:.4,'stroke-dasharray':'15 25'}, parts[0]);
      }
    }
    hoverMotion(host, trigger, (clock, activity, active) => {
      const dt = Math.max(0, clock - previousClock); previousClock = clock;
      phase += dt * 1.65 * activity;
      const top = [], bottom = [];
      for (let i = 0; i <= 48; i++) {
        const u = i / 48, angle = u * Math.PI * 2 - .3;
        const resting = 724 - 36 * Math.sin(angle) - 30 * u;
        const flowing = 724 - 32 * Math.sin(angle - phase) - 30 * u;
        const y = resting + (flowing - resting) * activity, width = 25 + 15 * Math.sin(Math.PI * u) ** 2;
        top.push(`${(275+700*u).toFixed(2)},${(y-width/2).toFixed(2)}`);
        bottom.push(`${(275+700*u).toFixed(2)},${(y+width/2).toFixed(2)}`);
      }
      set(r.q('.wave'), 'd', 'M' + top.join('L') + 'L' + bottom.reverse().join('L') + 'Z');
      const blink = envelope(clock % 4.9, 3.1, 3.18, 3.25, 3.37) * activity;
      r.eyes.forEach(eye => set(eye, 'ry', 45 * (1 - .94 * blink)));
      set(r.q('.eyes'), 'transform', `translate(${Math.sin(clock*.9)*9*activity} ${-5*activity})`);
      set(r.actor, 'transform', `translate(0 ${Math.sin(clock*1.4)*2*activity-3*activity})`);
      const twitch = envelope(clock % 6.7, 4.9, 5.02, 5.4, 5.7) * Math.sin(clock * 20) * 2.5;
      r.ears.forEach((ear, i) => set(ear, 'transform', pivot(i ? 782 : 471, 466, (i ? -.8 : 1) * (1+twitch) * activity)));
      if (!activity) { thought.replaceChildren(); current=''; host.dataset.thought=''; next=.5; phase=0; return; }
      if (active && !current && clock >= next) { current=choose(); start=clock; mountThought(current); }
      const age = clock - start;
      const amount = current ? envelope(age, 0, .35, 3.1, 3.6) * activity : 0;
      set(thought, 'opacity', amount * .84);
      host.dataset.thought = current;
      if (current === 'star') set(parts[1], 'transform', `translate(${-60+120*smooth(.2,3,age)} ${15-40*smooth(.2,3,age)}) scale(.68)`);
      if (current === 'book') {
        const opened = envelope(age, .15, .8, 2.65, 3.35);
        set(parts[0], 'transform', `scale(${.12+.88*opened} 1)`);
        parts.slice(1).forEach((line,i) => set(line,'stroke-dashoffset',1-smooth(.85+i*.27,1.2+i*.27,age)));
      }
      if (current === 'sum') parts.forEach((part,i) => set(part,'opacity',smooth(.1+i*.65,.5+i*.65,age)));
      if (current === 'constellation') parts.forEach((part,i) => set(part,'stroke-dashoffset',1-smooth(.25+i*.6,.9+i*.6,age)));
      if (current === 'bulb') set(parts[0],'opacity',envelope(age,.7,1.4,2.5,3.1)*.12);
      if (current === 'plane') set(parts[0],'transform',`translate(${Math.sin(age*1.5)*45} ${Math.cos(age*1.5)*18}) rotate(${Math.sin(age)*9})`);
      if (age > 3.6 && current) { thought.replaceChildren(); current=''; next=clock+.8+Math.random()*.5; }
    });
  }

  let tipId = 0;
  function mountWibsworth(trigger) {
    if (!trigger || trigger.dataset.mascotReady) return;
    trigger.dataset.mascotReady = 'true';
    attachWibsworth(trigger.querySelector('.repo-wibsworth-icon'), trigger);
    let tip = trigger.querySelector('[role="tooltip"]');
    if (!tip) {
      tip = document.createElement('span'); tip.className = 'repo-coming-tip';
      tip.id = 'repo-section-wibsworth-tip-' + ++tipId; tip.setAttribute('role', 'tooltip');
      tip.textContent = 'Wibsworth is coming soon'; tip.hidden = true; trigger.append(tip);
    }
    function hideTip() { tip.hidden = true; trigger.removeAttribute('aria-describedby'); }
    trigger.addEventListener('click', () => {
      tip.hidden = !tip.hidden;
      if (tip.hidden) hideTip(); else trigger.setAttribute('aria-describedby', tip.id);
    });
    trigger.addEventListener('blur', hideTip);
    document.addEventListener('pointerdown', e => { if (!trigger.contains(e.target)) hideTip(); }, true);
    // Register before Reparty's Escape shortcut, so dismissing this tip stays local.
    window.addEventListener('keydown', e => { if (e.key === 'Escape' && !tip.hidden) { hideTip(); e.preventDefault(); e.stopImmediatePropagation(); } }, true);
  }
  window.repoHeaderMascots = Object.freeze({attachWibs, mountWibsworth});
  mountWibsworth(document.getElementById('repo-wibsworth-launch'));
})();
