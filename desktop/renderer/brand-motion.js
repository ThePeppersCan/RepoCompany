(() => {
  'use strict';
  // One choreographed loop: anticipation, ribbon orbit, reunion, elastic settle.
  // The original site mark is untouched at rest. Only the transitional ribbons
  // are procedural, so the logo can actually change shape instead of sliding slices.
  const svg = document.querySelector('.brand-motion');
  const rest = svg.querySelector('.motion-rest'), core = svg.querySelector('.motion-core');
  const arcs = [...svg.querySelectorAll('.motion-arcs path')];
  const trails = [...svg.querySelectorAll('.motion-trails path')];
  const sparks = [...svg.querySelectorAll('.motion-sparks ellipse')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { const x = clamp(n); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const point = (r, angle) => [256 + r * Math.cos(angle), 256 + r * Math.sin(angle)];
  const fmt = p => p.map(n => n.toFixed(2)).join(' ');
  // A tapered annular ribbon with round ends, all in the mark's coordinate space.
  function ribbon(radius, width, start, span, taper = 0) {
    const p = [], count = 26;
    for (let side = 1; side >= -1; side -= 2) {
      for (let i = 0; i <= count; i++) {
        const u = side === 1 ? i / count : 1 - i / count;
        const thickness = width * (1 - taper * Math.pow(1 - u, 1.3));
        p.push(point(radius + side * thickness / 2, start + span * u));
      }
    }
    return 'M' + p.map(fmt).join('L') + 'Z';
  }
  // Samples from the actual site mark preserve its asymmetric silhouette.
  const outline = {"outer":[[476.0,105.0],[465.56,96.0],[455.13,87.0],[444.0,78.69],[432.26,71.0],[420.0,63.82],[407.38,57.0],[394.0,50.95],[380.0,45.51],[365.08,41.0],[349.64,37.0],[333.21,34.0],[315.77,32.0],[298.0,30.33],[279.9,29.0],[262.46,31.0],[244.03,32.0],[227.0,34.41],[211.15,38.0],[196.72,43.0],[182.28,48.0],[168.85,54.0],[156.41,61.0],[144.0,68.03],[132.54,76.0],[121.1,84.0],[110.67,93.0],[100.23,102.0],[90.79,112.0],[82.0,122.64],[73.0,133.08],[65.0,144.51],[58.0,156.95],[51.0,169.38],[45.0,182.82],[40.0,197.26],[36.0,212.69],[33.0,229.13],[31.0,246.56],[30.0,265.0],[31.0,283.44],[34.0,299.87],[37.0,316.31],[41.74,331.0],[47.0,345.18],[54.0,357.62],[61.0,370.05],[69.0,381.49],[77.92,392.0],[86.36,403.0],[95.0,413.79],[105.23,423.0],[115.67,432.0],[127.0,440.1],[138.54,448.0],[150.97,455.0],[163.41,462.0],[177.0,467.85],[191.28,473.0],[206.0,477.72],[222.15,481.0],[238.59,484.0],[257.03,485.0],[275.46,486.0],[292.9,486.0],[311.33,485.0],[328.0,482.23],[344.21,479.0],[359.64,475.0],[375.08,471.0],[389.0,465.49],[402.0,459.05],[415.38,453.0],[427.0,445.18],[439.0,437.74],[450.0,429.31],[461.0,420.87],[471.0,411.44],[479.0,400.0]],"inner":[[416.0,167.0],[408.4,162.0],[402.0,155.79],[395.0,150.19],[387.0,145.59],[378.99,141.0],[370.38,137.0],[362.0,132.78],[353.18,129.0],[343.58,126.0],[333.97,123.0],[324.0,120.37],[312.77,119.0],[301.17,118.0],[289.56,117.0],[277.96,118.0],[266.36,119.0],[254.76,120.0],[244.15,122.0],[234.0,124.45],[224.95,128.0],[215.35,131.0],[206.74,135.0],[198.14,139.0],[190.54,144.0],[182.94,149.0],[176.0,154.67],[169.0,160.27],[163.0,166.87],[157.0,173.47],[151.0,180.08],[146.0,187.68],[141.0,195.28],[137.0,203.88],[133.0,212.49],[129.0,221.09],[126.31,231.0],[124.0,241.29],[123.0,252.9],[123.0,265.5],[123.0,278.1],[125.0,288.71],[127.0,299.31],[130.0,308.91],[134.0,317.51],[138.12,326.0],[143.0,333.72],[148.0,341.32],[153.92,348.0],[159.53,355.0],[166.0,361.13],[172.73,367.0],[179.33,373.0],[186.94,378.0],[195.0,382.54],[204.0,386.14],[212.74,390.0],[223.35,392.0],[232.95,395.0],[243.55,397.0],[255.15,398.0],[266.76,399.0],[278.36,398.0],[290.96,398.0],[302.0,396.44],[312.17,394.0],[322.0,391.23],[332.37,389.0],[341.0,385.03],[350.58,382.0],[359.0,377.82],[366.78,373.0],[374.38,368.0],[381.99,363.0],[389.0,357.41],[396.19,352.0],[402.79,346.0],[409.0,339.6],[416.0,334.0]]};
  function morphRibbon(index, radius, width, start, span, amount, rotation) {
    const points = [], count = 26;
    for (let side = 1; side >= -1; side -= 2) for (let j = 0; j <= count; j++) {
      const step = side === 1 ? j : count - j, u = step / count;
      const original = outline[side === 1 ? "outer" : "inner"][index * count + step];
      const thickness = width * (1 - amount * .84 * Math.pow(1 - u, 1.3));
      const target = point(radius + side * thickness / 2, start + span * u);
      const x = lerp(original[0], target[0], amount) - 256, y = lerp(original[1], target[1], amount) - 256;
      points.push([256 + x * Math.cos(rotation) - y * Math.sin(rotation), 256 + x * Math.sin(rotation) + y * Math.cos(rotation)]);
    }
    return "M" + points.map(fmt).join("L") + "Z";
  }
  let wanted = false, frame = 0, epoch = 0;
  function reset() {
    rest.setAttribute('opacity', '1'); rest.removeAttribute('transform');
    core.setAttribute('opacity', '0');
    [...arcs, ...trails, ...sparks].forEach(el => el.setAttribute('opacity', '0'));
  }
  function draw(ms) {
    const t = (ms % 4200) / 4200;
    const open = smooth((t - .18) / .14) * (1 - smooth((t - .67) / .15));
    const morph = smooth((t - .18) / .035) * (1 - smooth((t - .81) / .025));
    const orbit = smooth((t - .30) / .38);
    const pulse = t < .24 ? -.075 * Math.sin(Math.PI * clamp((t - .12) / .12)) : 0;
    const settle = t > .77 ? Math.sin((t - .77) * 57) * Math.exp(-(t - .77) * 22) * .055 : 0;
    const scale = 1 + pulse + settle;
    rest.setAttribute('opacity', (1 - morph).toFixed(3));
    rest.setAttribute('transform', `translate(256 256) scale(${scale}) rotate(${-7 * Math.sin(Math.PI * clamp((t - .12) / .16))}) translate(-256 -256)`);
    core.setAttribute('opacity', morph.toFixed(3));
    const coreScale = lerp(1, .36, open);
    core.setAttribute('transform', `translate(${256 + Math.sin(orbit * Math.PI * 2) * 12 * open} ${256 - 9 * open}) rotate(${-360 * orbit}) scale(${coreScale}) translate(-256 -256)`);
    for (let i = 0; i < 3; i++) {
      const initial = (-42 - 92 * i) * Math.PI / 180;
      const angle = initial + orbit * Math.PI * 2 + Math.sin(orbit * Math.PI) * .16 * (i - 1);
      const radius = lerp(184, 230 + 14 * Math.sin(orbit * Math.PI * 2 + i * 2), open);
      const width = lerp(94, 47, open);
      const span = -lerp(92, 76, open) * Math.PI / 180;
      arcs[i].setAttribute('d', morphRibbon(i, radius, width, initial, span, open, orbit * Math.PI * 2));
      arcs[i].setAttribute('opacity', morph.toFixed(3));
      const speed = Math.sin(orbit * Math.PI);
      trails[i].setAttribute('d', ribbon(radius + 23, 9 * speed, angle - .13, span * 1.13, .96));
      trails[i].setAttribute('opacity', (morph * speed * .13).toFixed(3));
      const burst = clamp((t - .745) / .115), p = point(lerp(210, 315, burst), initial - .65);
      sparks[i].setAttribute('cx', p[0]); sparks[i].setAttribute('cy', p[1]);
      sparks[i].setAttribute('rx', 3 + 10 * Math.sin(burst * Math.PI)); sparks[i].setAttribute('ry', 3.4);
      sparks[i].setAttribute('transform', `rotate(${initial * 180 / Math.PI - 37} ${p[0]} ${p[1]})`);
      sparks[i].setAttribute('opacity', (Math.sin(burst * Math.PI) * .65).toFixed(3));
    }
  }
  function tick(time) { if (!wanted || reduce.matches || document.hidden) { frame = 0; reset(); return; } draw(time - epoch); frame = requestAnimationFrame(tick); }
  function sync() {
    if (!wanted || reduce.matches || document.hidden) { cancelAnimationFrame(frame); frame = 0; reset(); return; }
    if (!frame) { epoch = performance.now(); frame = requestAnimationFrame(tick); }
  }
  window.repoBrandMotion = Object.freeze({ setActive(value) { wanted = !!value; sync(); } });
  reduce.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
  reset();
})();
