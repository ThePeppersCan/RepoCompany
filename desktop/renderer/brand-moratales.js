(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', duration = 2800;
  const clamp = x => Math.max(0, Math.min(1, x)), mix = (a, b, t) => a + (b - a) * t;
  const ease = x => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
  const shape = points => 'M' + points.map(p => p.map(n => n.toFixed(2)).join(' ')).join('L') + 'Z';

  window.createMoratalesBrandMotion = function (svg, outline) {
    function el(name, attributes, parent) {
      const node = document.createElementNS(NS, name);
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
      parent.append(node); return node;
    }
    function sample(d, count = 160) {
      const path = el('path', { d }, construction), length = path.getTotalLength();
      const points = Array.from({ length: count }, (_, i) => {
        const p = path.getPointAtLength(length * i / count); return [p.x, p.y];
      });
      path.remove(); return points;
    }
    function align(source, target) {
      let best = Infinity, result;
      for (const points of [target, [...target].reverse()]) for (let offset = 0; offset < points.length; offset++) {
        let cost = 0;
        for (let i = 0; i < source.length; i += 4) {
          const a = source[i], b = points[(i + offset) % points.length]; cost += (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
        }
        if (cost < best) { best = cost; result = source.map((_, i) => points[(i + offset) % points.length]); }
      }
      return result;
    }

    const defs = svg.querySelector('defs'), construction = el('g', {}, defs);
    const group = el('g', { class: 'motion-moratales', opacity: 0 }, svg);
    const id = 'mora-coffee-' + Math.random().toString(36).slice(2);
    const mask = el('mask', { id, maskUnits: 'userSpaceOnUse', x: -100, y: -100, width: 712, height: 712 }, defs);
    el('rect', { x: -100, y: -100, width: 712, height: 712, fill: 'white' }, mask);
    const body = el('g', { mask: `url(#${id})` }, group);
    const rest = svg.querySelector('.motion-rest');

    // Four portions of the original C become the brewer, two cups and its
    // faceted boiler. The r stretches into the tray. There is no image crossfade.
    const cup = 'M94 239Q153 224 225 239L220 285Q213 332 167 338Q130 342 111 313C68 315 43 301 44 274C45 249 65 240 88 252Z';
    const targets = [
      'M180 99Q180 74 205 72Q254 64 304 76Q330 82 330 105L330 173Q330 188 314 188L314 203Q314 213 304 213L298 213Q288 213 288 203L288 188L268 188L268 342L244 342L244 188L224 188L224 203Q224 213 214 213L208 213Q198 213 198 203L198 188Q180 188 180 171Z',
      cup,
      'M190 364L322 364L341 456Q344 473 321 478Q256 491 191 478Q169 474 172 457Z',
      shape(sample(cup).map(([x, y]) => [512 - x, y])),
      'M79 339Q256 355 433 339L435 354Q435 365 418 368Q256 385 94 368Q77 365 77 355Z'
    ];
    const boundaries = [0, 20, 40, 59, 78];
    const source = boundaries.slice(0, -1).map((start, i) => sample(shape([
      ...outline.outer.slice(start, boundaries[i + 1] + 1),
      ...outline.inner.slice(start, boundaries[i + 1] + 1).reverse()
    ])));
    source.push(sample(svg.querySelector('#repo-core path').getAttribute('d')));
    const pieces = source.map((points, i) => ({ source: points, target: align(points, sample(targets[i])), node: el('path', { stroke: '#f9f8e6', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, body) }));
    construction.remove();

    const details = el('g', { fill: 'black' }, mask);
    const cuts = [
      ['M200 103Q254 93 310 105L310 159Q254 169 200 159Z', 255, 132],
      ['M67 267Q77 262 94 275L101 296Q70 298 64 284Q61 273 67 267Z', 80, 280],
      ['M445 267Q435 262 418 275L411 296Q442 298 448 284Q451 273 445 267Z', 432, 280],
      ['M107 243Q156 227 212 243Q161 263 107 243Z', 160, 244],
      ['M300 243Q356 227 405 243Q351 263 300 243Z', 352, 244],
      ['M206 382L211 382L204 465L198 464Z', 204, 424],
      ['M301 382L306 382L314 464L308 465Z', 307, 424],
      ['M252 385L258 385L258 475L252 475Z', 255, 430]
    ].map(([d, x, y]) => ({ node: el('path', { d }, details), x, y }));
    const badge = el('image', { href: 'assets/repo-company-mark.png', x: 241, y: 111, width: 29, height: 29 }, group);
    const coffee = el('g', { fill: '#c99b62' }, group);
    const surfaces = [160, 352].map(x => el('ellipse', { cx: x, cy: 245, rx: 40, ry: 5 }, coffee));
    const streams = [211, 301].map(x => el('path', { fill: 'none', stroke: '#c99b62', 'stroke-width': 6, 'stroke-linecap': 'round' }, coffee));
    const drops = [211, 301].map(x => el('ellipse', { cx: x, rx: 3.3, ry: 4.8 }, coffee));
    const steam = el('g', { fill: 'none', stroke: '#f9f8e6', 'stroke-width': 5, 'stroke-linecap': 'round' }, group);
    const curls = [137, 171, 341, 375].map(x => ({ x, node: el('path', {}, steam) }));

    function hide() { group.setAttribute('opacity', '0'); }
    function draw(ms) {
      const t = (ms % duration) / duration;
      const unfold = ease((t - .11) / .23), fold = ease((t - .78) / .17), amount = unfold * (1 - fold);
      const active = t > .105 && t < .955;
      group.setAttribute('opacity', active ? '1' : '0'); rest.setAttribute('opacity', active ? '0' : '1');
      const anticipate = -.045 * Math.sin(Math.PI * clamp((t - .04) / .10));
      const settle = t > .91 ? Math.sin((t - .91) * 70) * Math.exp(-(t - .91) * 38) * .018 : 0;
      const scale = 1 + anticipate + settle - .08 * Math.sin(Math.PI * amount);
      const tilt = -9 * Math.sin(Math.PI * amount);
      const transform = `translate(256 256) rotate(${tilt}) scale(${scale}) translate(-256 -256)`;
      group.setAttribute('transform', transform); rest.setAttribute('transform', transform);
      pieces.forEach((piece, i) => {
        const bow = Math.sin(Math.PI * amount) * (i === 1 ? -16 : i === 3 ? 16 : 0);
        piece.node.setAttribute('d', shape(piece.source.map((p, j) => {
          const q = piece.target[j]; return [mix(p[0], q[0], amount) + bow, mix(p[1], q[1], amount)];
        })));
      });
      const reveal = ease((amount - .63) / .37);
      for (const cut of cuts) cut.node.setAttribute('transform', `translate(${cut.x} ${cut.y}) scale(${reveal}) translate(${-cut.x} ${-cut.y})`);
      badge.setAttribute('opacity', reveal.toFixed(3));
      // The short brew has a continuous stream, a final drop and a visible
      // rising coffee surface. Steam drifts away before the mark reforms.
      const pour = ease((t - .365) / .045), stop = ease((t - .625) / .035);
      streams.forEach((node, i) => {
        const x = i ? 301 : 211, end = mix(213, 244, pour), start = mix(213, 246, stop);
        node.setAttribute('d', `M${x} ${Math.min(start, end)}Q${x + Math.sin(t * 86 + i) * .85} ${(start + end) / 2} ${x} ${end}`);
        node.setAttribute('opacity', t > .365 && t < .66 ? '1' : '0');
      });
      const filled = ease((t - .41) / .25) * (1 - ease((t - .76) / .04));
      surfaces.forEach(node => { node.setAttribute('rx', (40 * filled).toFixed(2)); node.setAttribute('ry', (5 * filled).toFixed(2)); });
      drops.forEach((node, i) => {
        const fall = clamp((t - .657 - i * .008) / .05);
        node.setAttribute('cy', (216 + 28 * fall * fall).toFixed(2));
        node.setAttribute('opacity', fall > 0 && fall < 1 ? '1' : '0');
      });
      curls.forEach(({ node, x }, i) => {
        const rise = clamp((t - .49 - i * .012) / .29), drift = Math.sin(rise * Math.PI + i * .6) * 8;
        const y = 228 - 22 * rise, length = 44 * ease(rise * 2);
        node.setAttribute('d', `M${x} ${y}C${x - 13} ${y - length * .35} ${x + 15 + drift} ${y - length * .62} ${x + drift} ${y - length}`);
        node.setAttribute('opacity', (Math.sin(Math.PI * rise) * .7 * (1 - fold)).toFixed(3));
      });
    }
    return Object.freeze({ draw, hide, duration });
  };
})();
