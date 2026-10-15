(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', duration = 2800;
  const clamp = x => Math.max(0, Math.min(1, x)), mix = (a, b, t) => a + (b - a) * t;
  const ease = x => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
  const shape = points => 'M' + points.map(p => p.map(n => n.toFixed(2)).join(' ')).join('L') + 'Z';

  window.createManagerBrandMotion = function (svg, outline) {
    function el(name, attributes, parent) {
      const node = document.createElementNS(NS, name);
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
      parent.append(node); return node;
    }
    const defs = svg.querySelector('defs'), construction = el('g', {}, defs);
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
    const group = el('g', { class: 'motion-manager', opacity: 0 }, svg);
    const wake = el('g', { fill: '#d6b777' }, group);
    const ribbon = el('path', { opacity: .25 }, wake);
    const thread = el('path', { fill: 'none', stroke: '#f9f8e6', 'stroke-width': 2, opacity: .4 }, wake);
    const stars = Array.from({ length: 4 }, () => el('path', { d: 'M0 -6Q1 -1 6 0Q1 1 0 6Q-1 1 -6 0Q-1 -1 0 -6Z' }, wake));
    const broom = el('g', {}, group);
    const maskId = 'manager-broom-' + Math.random().toString(36).slice(2);
    const mask = el('mask', { id: maskId, maskUnits: 'userSpaceOnUse', x: -100, y: -100, width: 712, height: 712 }, defs);
    el('rect', { x: -100, y: -100, width: 712, height: 712, fill: 'white' }, mask);
    const body = el('g', { mask: `url(#${maskId})` }, broom);
    const rest = svg.querySelector('.motion-rest');

    // The C separates into swept bristles and their collar; its r becomes the
    // curved handle. Every piece starts and ends on the actual site silhouette.
    const targets = [
      'M226 247Q161 208 57 229L78 244L43 250L64 263L34 270Q126 278 220 269Z',
      'M220 263Q136 260 34 270L69 284L44 292L84 299L64 313Q171 328 230 280Z',
      'M218 242Q235 240 246 248L244 283Q232 291 219 285L210 280L215 249Z',
      'M239 251C313 252 376 216 432 224Q462 224 478 242Q484 254 471 258Q463 259 458 250Q445 238 428 241C373 231 316 274 239 275Z'
    ];
    const boundaries = [0, 26, 52, 78];
    const sources = boundaries.slice(0, -1).map((start, i) => sample(shape([
      ...outline.outer.slice(start, boundaries[i + 1] + 1),
      ...outline.inner.slice(start, boundaries[i + 1] + 1).reverse()
    ])));
    sources.push(sample(svg.querySelector('#repo-core path').getAttribute('d')));
    const pieces = sources.map((points, i) => ({ source: points, target: align(points, sample(targets[i])), node: el('path', { stroke: '#f9f8e6', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, body) }));
    construction.remove();
    const cuts = el('g', { fill: 'none', stroke: 'black', 'stroke-width': 4, 'stroke-linecap': 'round' }, mask);
    [
      'M78 243Q150 238 200 255', 'M68 258Q144 251 200 263',
      'M76 286Q150 288 202 274', 'M95 302Q165 300 207 280',
      'M355 236L363 251', 'M371 232L379 245', 'M387 228L394 242'
    ].forEach(d => el('path', { d }, cuts));
    const accent = el('g', { fill: '#d6b777' }, broom);
    el('path', { d: 'M223 246L232 247L230 284L221 282Z' }, accent);
    const pennant = el('path', { d: 'M239 285Q251 300 242 320L233 314L225 318Q241 300 235 285Z' }, accent);

    function pose(u) {
      const angle = u * Math.PI * 2;
      return { x: 114 * Math.sin(angle), y: 88 * (Math.cos(angle) - 1), rotation: -360 * u - 14, scale: .91 - .19 * Math.sin(Math.PI * u) ** 2 };
    }
    function tail(u) {
      const p = pose(u), a = p.rotation * Math.PI / 180;
      return [256 + p.x - 166 * p.scale * Math.cos(a), 256 + p.y - 166 * p.scale * Math.sin(a)];
    }
    function hide() { group.setAttribute('opacity', '0'); }
    function draw(ms) {
      const t = (ms % duration) / duration;
      const unfold = ease((t - .09) / .22), fold = ease((t - .78) / .17), amount = unfold * (1 - fold);
      const active = t > .085 && t < .955;
      group.setAttribute('opacity', active ? '1' : '0'); rest.setAttribute('opacity', active ? '0' : '1');
      const anticipation = -.055 * Math.sin(Math.PI * clamp((t - .025) / .09));
      const settle = t > .93 ? Math.sin((t - .93) * 85) * Math.exp(-(t - .93) * 55) * .018 : 0;
      rest.setAttribute('transform', `translate(256 256) scale(${1 + anticipation + settle}) translate(-256 -256)`);
      const flight = ease((t - .33) / .43), p = pose(flight);
      const transform = `translate(${256 + p.x} ${256 + p.y}) rotate(${mix(0, p.rotation, amount)}) scale(${mix(1, p.scale, amount) + anticipation + settle}) translate(-256 -256)`;
      // On reunion preserve the completed turn: folding must not unwind it.
      const rotation = t > .76 ? -360 - 14 * amount : mix(0, p.rotation, amount);
      broom.setAttribute('transform', transform.replace(/rotate\([^)]*\)/, `rotate(${rotation})`));
      pieces.forEach(piece => piece.node.setAttribute('d', shape(piece.source.map((a, i) => {
        const b = piece.target[i]; return [mix(a[0], b[0], amount), mix(a[1], b[1], amount)];
      }))));
      const reveal = ease((amount - .7) / .3);
      cuts.setAttribute('opacity', reveal.toFixed(3)); accent.setAttribute('opacity', reveal.toFixed(3));
      pennant.setAttribute('transform', `rotate(${Math.sin(t * 51) * 13 * (1 - fold)} 237 285)`);

      // A tapered wake traces the actual broom flight, then evaporates from its
      // oldest end. It remains behind the mark throughout the return morph.
      const visible = ease((t - .345) / .055) * (1 - ease((t - .76) / .075));
      const head = flight, length = .23 * visible, points = [], center = [];
      for (let side = 1; side >= -1; side -= 2) for (let i = 0; i <= 30; i++) {
        const v = side === 1 ? i / 30 : 1 - i / 30, u = Math.max(0, head - length * (1 - v));
        const a = tail(u), b = tail(Math.min(1, u + .001)), dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1;
        const width = Math.sin(v * Math.PI) * 5 * visible;
        points.push([a[0] - dy / n * width * side, a[1] + dx / n * width * side]);
        if (side === 1) center.push(a);
      }
      ribbon.setAttribute('d', shape(points));
      thread.setAttribute('d', 'M' + center.map(p => p.join(' ')).join('L'));
      wake.setAttribute('opacity', visible.toFixed(3));
      stars.forEach((star, i) => {
        const age = (t * 5 + i / 4) % 1, a = tail(Math.max(0, flight - age * .22));
        const scale = Math.sin(age * Math.PI) * .65;
        star.setAttribute('transform', `translate(${a[0] + Math.sin(i * 5) * 14 * age} ${a[1] + 20 * age}) rotate(${age * 80}) scale(${scale})`);
        star.setAttribute('opacity', ((1 - age) * .65).toFixed(3));
      });
    }
    return Object.freeze({ draw, hide, duration });
  };
})();
