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
  const outline = {"outer":[[476.0,105.0],[465.56,96.0],[455.13,87.0],[444.0,78.69],[432.26,71.0],[420.0,63.82],[407.38,57.0],[394.0,50.95],[380.0,45.51],[365.08,41.0],[349.64,37.0],[333.21,34.0],[315.77,32.0],[298.0,30.33],[279.9,29.0],[262.46,31.0],[244.03,32.0],[227.0,34.41],[211.15,38.0],[196.72,43.0],[182.28,48.0],[168.85,54.0],[156.41,61.0],[144.0,68.03],[132.54,76.0],[121.1,84.0],[110.67,93.0],[100.23,102.0],[90.79,112.0],[82.0,122.64],[73.0,133.08],[65.0,144.51],[58.0,156.95],[51.0,169.38],[45.0,182.82],[40.0,197.26],[36.0,212.69],[33.0,229.13],[31.0,246.56],[30.0,265.0],[31.0,283.44],[34.0,299.87],[37.0,316.31],[41.74,331.0],[47.0,345.18],[54.0,357.62],[61.0,370.05],[69.0,381.49],[77.92,392.0],[86.36,403.0],[95.0,413.79],[105.23,423.0],[115.67,432.0],[127.0,440.1],[138.54,448.0],[150.97,455.0],[163.41,462.0],[177.0,467.85],[191.28,473.0],[206.0,477.72],[222.15,481.0],[238.59,484.0],[257.03,485.0],[275.46,486.0],[292.9,486.0],[311.33,485.0],[328.0,482.23],[344.21,479.0],[359.64,475.0],[375.08,471.0],[389.0,465.49],[402.0,459.05],[415.38,453.0],[427.0,445.18],[439.0,437.74],[450.0,429.31],[461.0,420.87],[471.0,411.44],[479.0,400.0]],"inner":[[416.0,167.0],[408.4,162.0],[402.0,155.79],[395.0,150.19],[387.0,145.59],[378.99,141.0],[370.38,137.0],[362.0,132.78],[353.18,129.0],[343.58,126.0],[333.97,123.0],[324.0,120.37],[312.77,119.0],[301.17,118.0],[289.56,117.0],[277.96,118.0],[266.36,119.0],[254.76,120.0],[244.15,122.0],[234.0,124.45],[224.95,128.0],[215.35,131.0],[206.74,135.0],[198.14,139.0],[190.54,144.0],[182.94,149.0],[176.0,154.67],[169.0,160.27],[163.0,166.87],[157.0,173.47],[151.0,180.08],[146.0,187.68],[141.0,195.28],[137.0,203.88],[133.0,212.49],[129.0,221.09],[126.31,231.0],[124.0,241.29],[123.0,252.9],[123.0,265.5],[123.0,278.1],[125.0,288.71],[127.0,299.31],[130.0,308.91],[134.0,317.51],[138.12,326.0],[143.0,333.72],[148.0,341.32],[153.92,348.0],[159.53,355.0],[166.0,361.13],[172.73,367.0],[179.33,373.0],[186.94,378.0],[195.0,382.54],[204.0,386.14],[212.74,390.0],[223.35,392.0],[232.95,395.0],[243.55,397.0],[255.15,398.0],[266.76,399.0],[278.36,398.0],[290.96,398.0],[302.0,396.44],[312.17,394.0],[322.0,391.23],[332.37,389.0],[341.0,385.03],[350.58,382.0],[359.0,377.82],[366.78,373.0],[374.38,368.0],[381.99,363.0],[389.0,357.41],[396.19,352.0],[402.79,346.0],[409.0,339.6],[416.0,334.0]]};
  const markup = "<svg class=\"brand-motion\" viewBox=\"-100 -100 712 712\" fill=\"#f9f8e6\">\r\n          <defs><clipPath id=\"repo-core\"><path d=\"M187.0 191.0L189.77 185.0L193.54 180.0L199.3 177.0L207.07 176.0L214.84 177.0L223.61 177.0L232.37 177.0L241.14 177.0L249.91 177.0L258.68 177.0L266.0 176.44L273.21 178.0L278.0 181.98L282.0 186.75L283.52 194.0L284.0 202.28L284.0 211.05L283.0 218.82L285.0 224.41L288.0 218.65L291.0 212.88L294.89 208.0L299.0 203.34L303.42 199.0L308.19 195.0L313.0 191.04L318.0 187.27L324.0 184.51L330.0 181.74L336.03 179.0L343.8 178.0L351.57 177.0L359.33 176.0L367.0 177.1L371.0 181.87L373.0 188.64L373.0 197.4L373.0 206.17L373.0 214.94L373.0 223.71L373.0 232.47L373.0 241.24L373.0 250.01L372.0 257.78L370.0 264.55L362.69 266.0L353.92 266.0L346.15 267.0L338.38 268.0L330.62 269.0L324.0 271.15L318.08 274.0L313.0 277.69L308.0 281.45L303.0 285.22L299.0 289.99L294.24 294.0L290.47 299.0L287.0 304.29L284.94 311.0L283.0 317.83L281.0 324.6L280.64 333.0L280.0 341.13L280.0 349.9L280.0 358.67L280.0 367.43L276.8 373.0L268.03 373.0L259.26 373.0L250.49 373.0L241.73 373.0L232.96 373.0L224.19 373.0L215.42 373.0L206.66 373.0L200.0 370.89L195.0 367.12L191.0 362.35L188.0 356.59L187.0 348.82L187.0 340.05L187.0 331.28L187.0 322.52L187.0 313.75L187.0 304.98L187.0 296.21L187.0 287.44L187.0 278.68L187.0 269.91L187.0 261.14L187.0 252.37L187.0 243.61L187.0 234.84L187.0 226.07L187.0 217.3L187.0 208.54L187.0 199.77L187.0 191.0Z\"/></clipPath></defs>\r\n          <g class=\"motion-trails\"><path/><path/><path/></g>\r\n          <g class=\"motion-arcs\"><path/><path/><path/></g>\r\n          <g class=\"motion-core\"><image href=\"/assets/wibs-intro-mark.png\" width=\"512\" height=\"512\" clip-path=\"url(#repo-core)\"/></g>\r\n          <g class=\"motion-sparks\"><ellipse/><ellipse/><ellipse/></g>\r\n          <image class=\"motion-rest\" href=\"/assets/wibs-intro-mark.png\" width=\"512\" height=\"512\"/>\r\n        </svg>";
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const openingDuration = 4000;
  let active = null;
  window.repoWibsIntro = Object.freeze({
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
