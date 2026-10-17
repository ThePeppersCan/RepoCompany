// Wibs motion from the approved local preview; isolated from startup and game loaders.
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', duration = 4800;
  const clamp = x => Math.max(0, Math.min(1, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = x => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
  const pulse = (t, start, end) => Math.sin(Math.PI * clamp((t - start) / (end - start)));
  const shape = points => 'M' + points.map(p => p.map(n => n.toFixed(2)).join(' ')).join('L') + 'Z';
  const pivot = (x, y, rotation, sx = 1, sy = sx) => `translate(${x} ${y}) rotate(${rotation}) scale(${sx} ${sy}) translate(${-x} ${-y})`;
  // Wibworth's reference silhouette, expressed as smooth paths. The five
  // regions are articulated, but retain the same floppy ears and little feet.
  const art = {
    body: 'M627 386C706 386 760 419 812 473C837 498 852 518 864 546L812 564C829 574 836 612 847 639C860 668 878 686 896 679C922 705 940 738 943 766C951 834 887 856 790 843C796 809 767 783 732 783C695 783 661 806 663 842L581 842C583 808 553 783 517 783C481 783 450 811 454 843C360 856 295 835 302 766C306 732 329 695 356 679C379 686 399 673 411 647C422 623 424 587 442 564L391 546C408 516 423 494 444 472C496 418 552 386 627 386Z',
    leftEar: 'M471 445C432 481 413 508 369 537C328 565 281 589 264 623C248 658 269 685 303 685C352 685 394 650 415 609C425 587 431 571 442 564C453 543 462 487 471 445Z',
    rightEar: 'M782 445C821 481 840 508 884 537C925 565 972 589 989 623C1005 658 984 685 950 685C901 685 859 650 838 609C828 587 822 571 811 564C800 543 791 487 782 445Z',
    leftPaw: 'M466 837C467 811 488 795 517 794C545 795 567 813 569 838C572 858 551 868 520 868C488 869 461 860 466 837Z',
    rightPaw: 'M675 837C676 811 700 795 730 794C757 795 779 813 779 838C781 858 758 868 728 868C697 869 670 860 675 837Z'
  };

  window.repoWibsArt = Object.freeze(art);
  window.createWibsBrandMotion = function (svg, outline) {
    function el(name, attrs, parent) {
      const node = document.createElementNS(NS, name);
      for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
      parent.append(node); return node;
    }
    const defs = svg.querySelector('defs'), construction = el('g', {}, defs);
    function sample(d, fromReference = false, count = 180) {
      const node = el('path', { d }, construction), length = node.getTotalLength();
      const points = Array.from({ length: count }, (_, i) => {
        const p = node.getPointAtLength(length * i / count);
        return fromReference ? [256 + (p.x - 627) * .62, 272 + (p.y - 627) * .62] : [p.x, p.y];
      });
      node.remove(); return points;
    }
    function align(source, target) {
      let best = Infinity, result;
      for (const points of [target, [...target].reverse()]) for (let offset = 0; offset < points.length; offset++) {
        let cost = 0;
        for (let i = 0; i < source.length; i += 3) {
          const a = source[i], b = points[(i + offset) % points.length];
          cost += (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
        }
        if (cost < best) { best = cost; result = source.map((_, i) => points[(i + offset) % points.length]); }
      }
      return result;
    }
    const group = el('g', { class: 'motion-wibs', opacity: 0, fill: '#f4ecd6' }, svg);
    const shadow = el('ellipse', { cx: 256, cy: 430, rx: 117, ry: 9, fill: '#d8c699', opacity: 0 }, group);
    const actor = el('g', { class: 'wibs-actor' }, group);
    const rest = svg.querySelector('.motion-rest');
    const boundaries = [0, 20, 40, 59, 78];
    const sources = boundaries.slice(0, -1).map((start, i) => sample(shape([
      ...outline.outer.slice(start, boundaries[i + 1] + 1),
      ...outline.inner.slice(start, boundaries[i + 1] + 1).reverse()
    ])));
    sources.push(sample(svg.querySelector('#repo-core path').getAttribute('d')));
    const names = ['rightEar', 'leftEar', 'leftPaw', 'rightPaw', 'body'];
    const pieces = sources.map((source, i) => ({
      source, target: align(source, sample(art[names[i]], true)), name: names[i],
      node: el('path', { class: 'wibs-' + names[i], 'stroke-width': .7, 'stroke-linejoin': 'round' }, actor)
    }));
    // Draw the body below the ears and paws. No tinted seams between pieces.
    actor.prepend(pieces[4].node);
    construction.remove();

    // Facial details are transparent cutouts, so the mascot works on the
    // charcoal sign-in screen and the black game curtain without a dark box.
    const id = 'wibs-face-' + Math.random().toString(36).slice(2);
    const mask = el('mask', { id, maskUnits: 'userSpaceOnUse', x: -100, y: -100, width: 712, height: 712 }, defs);
    el('rect', { x: -100, y: -100, width: 712, height: 712, fill: 'white' }, mask);
    const face = el('g', { fill: 'black' }, mask);
    const eyes = [187.8, 322.3].map(cx => el('ellipse', { cx, cy: 294.3, rx: 18.6, ry: 29.2 }, face));
    const mouth = el('path', { d: 'M244 310Q255 323 266 310', fill: 'none', stroke: 'black', 'stroke-width': 8, 'stroke-linecap': 'round' }, face);
    const pawCut = el('path', { fill: 'black', stroke: 'black', 'stroke-width': 7.4, 'stroke-linejoin': 'round', opacity: 0 }, mask);
    const bodyPaint = el('g', { mask: `url(#${id})` }, actor);
    bodyPaint.append(pieces[4].node);
    const pawSocket = el('path', { d: 'M277 366H359V405H277Z', opacity: 0 }, bodyPaint);
    actor.prepend(bodyPaint);
    const accents = el('g', { fill: '#e9d8ad' }, group);
    const glints = [-1, 1].map(side => el('path', { d: 'M0 -7Q1 -1 6 0Q1 1 0 7Q-1 1 -6 0Q-1 -1 0 -7Z', opacity: 0, 'data-side': side }, accents));

    function hide() { group.setAttribute('opacity', '0'); }
    function draw(ms) {
      const t = ((ms % duration) + duration) % duration / 1000;
      const arrive = ease((t - .22) / .94), depart = ease((t - 3.72) / .79);
      const amount = arrive * (1 - depart);
      const visible = t > .20 && t < 4.53;
      group.setAttribute('opacity', visible ? '1' : '0');
      rest.setAttribute('opacity', visible ? '0' : '1');
      // A brief intake of breath, then a soft landing with conserved volume.
      const inhale = pulse(t, .025, .37), land = pulse(t, 1.15, 1.43);
      const hop = pulse(t, 1.58, 2.13), bow = pulse(t, 3.48, 3.86);
      const breath = Math.sin((t - 2.2) * Math.PI * 2 / 2.5) * .009 * amount;
      const squash = -.075 * inhale + .055 * land - .035 * hop + .035 * bow;
      const sx = 1 - squash * .60 - breath, sy = 1 + squash + breath;
      const lift = -19 * pulse(t, .38, 1.25) - 36 * hop * amount + 6 * bow * amount;
      const tilt = -4.2 * pulse(t, .08, .91) + 4 * pulse(t, 2.35, 3.48) * amount;
      const transform = `translate(0 ${lift.toFixed(3)}) ` + pivot(256, 421, tilt, sx, sy);
      actor.setAttribute('transform', transform);
      rest.setAttribute('transform', transform);
      const reveal = ease((amount - .64) / .36);
      const wave = ease((t - 2.45) / .24) * (1 - ease((t - 3.28) / .24));
      const waveAngle = (-16 + Math.sin((t - 2.58) * 18) * 12) * wave;
      const flutterTime = Math.max(0, t - 1.03);
      const flutter = Math.sin(flutterTime * 18) * Math.exp(-flutterTime * 4.8) * 12;
      const earSway = flutter + 9 * hop - 5 * bow;
      const cream = [249, 248, 230].map((c, i) => Math.round(mix(c, [244, 236, 214][i], amount)));
      const color = `rgb(${cream.join(',')})`;
      actor.setAttribute('fill', color);
      for (const piece of pieces) {
        // Each solid region travels from an actual region of the logo; the
        // curved outward bias leaves space for Wibs to unfold in the middle.
        const side = piece.name === 'leftEar' ? -1 : piece.name === 'rightEar' ? 1 : 0;
        const lag = side ? ease((t - .32) / .96) * (1 - ease((t - 3.68) / .83)) : amount;
        const a = side ? lag : amount;
        const arc = Math.sin(Math.PI * a) * 26 * side;
        piece.node.setAttribute('d', shape(piece.source.map((p, i) => {
          const q = piece.target[i]; return [mix(p[0], q[0], a) + arc, mix(p[1], q[1], a) - Math.sin(Math.PI * a) * 13];
        })));
        piece.node.setAttribute('stroke', color);
        let local = '';
        if (side) local = pivot(side < 0 ? 153 : 359, 208, side * earSway * reveal);
        if (piece.name === 'rightPaw') local = `translate(${6 * wave} ${-40 * wave}) ` + pivot(323, 400, waveAngle);
        if (piece.name === 'leftPaw') local = pivot(188, 405, -5 * hop * reveal);
        piece.node.setAttribute('transform', local);
      }
      pawSocket.setAttribute('opacity', (wave * reveal).toFixed(3));
      pawCut.setAttribute('d', pieces[3].node.getAttribute('d'));
      pawCut.setAttribute('transform', pieces[3].node.getAttribute('transform'));
      pawCut.setAttribute('opacity', (wave * reveal).toFixed(3));
      const blink = 1 - .96 * pulse(t, 1.35, 1.51) ** 2;
      const farewell = 1 - .94 * pulse(t, 3.41, 3.59) ** 2;
      const gaze = 3 * pulse(t, 2.12, 2.54);
      face.setAttribute('transform', `translate(${gaze} ${-2 * hop})`);
      eyes.forEach((eye, i) => {
        const wake = ease((t - .90 - i * .065) / .27) * reveal;
        eye.setAttribute('transform', pivot(i ? 322.3 : 187.8, 294.3, 0, Math.max(.001, wake), Math.max(.001, wake * blink * farewell)));
      });
      mouth.setAttribute('transform', pivot(255, 312, 0, Math.max(.001, reveal)));
      shadow.setAttribute('opacity', (.07 * reveal * (1 - .50 * hop)).toFixed(3));
      shadow.setAttribute('rx', (117 - hop * 25).toFixed(2));
      glints.forEach((node, i) => {
        const p = clamp((t - 1.89 - i * .09) / .55), strength = Math.sin(Math.PI * p) * reveal;
        node.setAttribute('opacity', (.65 * strength).toFixed(3));
        node.setAttribute('transform', `translate(${i ? 440 + 10 * p : 68 - 8 * p} ${230 - 25 * p}) rotate(${p * 35}) scale(${strength})`);
      });
    }
    return Object.freeze({ draw, hide, duration });
  };
})();

(() => {
  'use strict';
  const {outline,markup} = window.repoBrandArt;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const openingDuration = 4000;
  let active = null;
  window.repoWibsIntro = Object.freeze({
    attachHover(host,trigger,drawer){
      let motion=null,frame=0,start=0;
      function stop(){cancelAnimationFrame(frame);frame=0;host.classList.remove('is-animating');}
      const visible=()=>drawer.open&&!document.hidden&&document.documentElement.dataset.repoPortalVisible!=='false'&&host.getClientRects().length;
      function tick(now){frame=0;if(reduce.matches||!visible()){stop();return;}motion.draw(1200+(now-start)%2400);frame=requestAnimationFrame(tick);}
      function play(){
        if(frame||reduce.matches||!visible())return;
        if(!motion){const shadow=host.attachShadow({mode:'open'});shadow.innerHTML=`<style>:host{position:relative}svg{display:block;width:100%;height:100%;overflow:visible;opacity:0;fill:#f4ecd6;stroke:none}:host(.is-animating) svg{opacity:1}.motion-core,.motion-arcs,.motion-trails,.motion-sparks{opacity:0}</style>${markup}`;const svg=shadow.querySelector('svg');svg.setAttribute('viewBox','10 100 492 338');svg.setAttribute('aria-hidden','true');motion=window.createWibsBrandMotion(svg,outline);}
        // Reuse the approved hop, blink and paw wave while staying as Wibs.
        motion.draw(1200);host.classList.add('is-animating');start=performance.now();frame=requestAnimationFrame(tick);
      }
      trigger.addEventListener('pointerenter',play);trigger.addEventListener('pointerleave',stop);trigger.addEventListener('focus',play);trigger.addEventListener('blur',stop);
      drawer.addEventListener('close',stop);reduce.addEventListener('change',stop);document.addEventListener('visibilitychange',stop);window.addEventListener('repo-launcher-portal-visibility',stop);
      return {stop};
    },
    play(drawer) {
      active?.finish(false);
      if (!drawer.open || reduce.matches) return;
      const host = document.createElement('div');
      host.className = 'repo-wibs-opening';
      host.tabIndex = -1;
      host.setAttribute('role', 'status');
      host.setAttribute('aria-label', 'Loading RE-COMP');
      const shadow = host.attachShadow({mode: 'open'});
      // Fixed local art only; community messages and uploads never enter this markup.
      shadow.innerHTML = `<style>
        :host{position:absolute;inset:0;z-index:100;display:grid;place-items:center;background:#0d1913;outline:none}
        .stage{width:min(360px,80vw)}
        svg{display:block;width:100%;height:auto;overflow:visible}
        .motion-core,.motion-arcs,.motion-trails,.motion-sparks{opacity:0}
      </style><div class="stage" aria-hidden="true">${markup}</div>`;
      const previousFocus = document.activeElement;
      const siblings = [...drawer.children].map(node => [node, node.inert]);
      siblings.forEach(([node]) => { node.inert = true; });
      drawer.dataset.wibsOpening = 'true';
      drawer.append(host);
      let motion;
      try { motion = window.createWibsBrandMotion(shadow.querySelector('svg'), outline); }
      catch { siblings.forEach(([node, inert]) => { node.inert = inert; }); host.remove(); delete drawer.dataset.wibsOpening; return; }
      let frame = 0, elapsed = 0, last = null, finished = false;
      const visible = () => !document.hidden && document.documentElement.dataset.repoPortalVisible !== 'false';
      function finish(restoreFocus = true) {
        if (finished) return;
        finished = true;
        cancelAnimationFrame(frame);
        const ownsFocus = document.activeElement === host;
        siblings.forEach(([node, inert]) => { node.inert = inert; });
        host.remove();
        delete drawer.dataset.wibsOpening;
        drawer.removeEventListener('close', closed);
        document.removeEventListener('visibilitychange', sync);
        window.removeEventListener('repo-launcher-portal-visibility', sync);
        reduce.removeEventListener('change', motionPreference);
        if (active?.host === host) active = null;
        if (restoreFocus && ownsFocus && drawer.open) {
          const focus = previousFocus?.isConnected && drawer.contains(previousFocus) && previousFocus.getClientRects().length ? previousFocus : drawer.querySelector('.rc-channel, button');
          focus?.focus({preventScroll: true});
        }
      }
      function closed() { if (!drawer.open) finish(false); }
      function motionPreference() { if (reduce.matches) finish(); }
      function tick(now) {
        frame = 0;
        if (finished) return;
        if (!drawer.open) { finish(false); return; }
        if (!visible()) { last = null; return; }
        if (last !== null) elapsed += Math.max(0, now - last);
        last = now;
        if (elapsed >= openingDuration) { finish(); return; }
        // Play the entire approved 4.8-second choreography in four seconds.
        motion.draw(elapsed * motion.duration / openingDuration);
        frame = requestAnimationFrame(tick);
      }
      function sync() {
        cancelAnimationFrame(frame); frame = 0; last = null;
        if (!finished && visible()) frame = requestAnimationFrame(tick);
      }
      active = {host, finish};
      drawer.addEventListener('close', closed);
      document.addEventListener('visibilitychange', sync);
      window.addEventListener('repo-launcher-portal-visibility', sync);
      reduce.addEventListener('change', motionPreference);
      motion.draw(0);
      host.focus({preventScroll: true});
      sync();
    },
    stop() { active?.finish(false); }
  });
})();
