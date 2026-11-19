// Ten minutes to level 2. Squaring completed levels keeps early nights rewarding
// and makes level 100 a long-term milestone without introducing a final level.
export function watchLevel(milliseconds) {
  const time = Math.max(0, Number(milliseconds) || 0);
  const steps = Math.floor(Math.sqrt(time / 600000));
  const floor = steps * steps * 600000;
  const span = (2 * steps + 1) * 600000;
  return { level: steps + 1, fraction: (time - floor) / span };
}

const hues = [[1, 159], [10, 180], [25, 210], [45, 252], [65, 291], [85, 341], [100, 403]];
export function levelHue(level) {
  if (level >= 100) return (403 + 1.6 * (level - 100)) % 360;
  const index = hues.findIndex(([at]) => at > level);
  const [start, from] = hues[index - 1], [end, to] = hues[index];
  return from + (to - from) * (level - start) / (end - start);
}

export function createWatchClock(read, send, receive) {
  let viewer = crypto.randomUUID(), sequence = 0, previous, pendingMs = 0;
  let lastSent = -Infinity, epoch = 0, chain = Promise.resolve();
  function dispatch(state, elapsed) {
    const ticket = epoch, session = viewer, order = ++sequence;
    const job = async () => {
      try {
        const rows = await send(state, session, Math.floor(elapsed), order);
        if (ticket === epoch && read()?.room === state.room) receive(rows);
      } catch { /* A lost acknowledgement must never replay earned time. */ }
    };
    chain = chain.then(job);
  }
  function finish() {
    if (previous?.active) dispatch({...previous,active:false},pendingMs);
    epoch++; previous = null; pendingMs = 0; lastSent = -Infinity;
    viewer = crypto.randomUUID(); sequence = 0;
  }
  function sample() {
    const now = performance.now(), current = read();
    if (!current) { if (previous) finish(); return; }
    const same = previous && previous.room === current.room && previous.item === current.item;
    const elapsed = previous ? now - previous.at : 0;
    if (previous && !same) {
      if (previous.active) dispatch({...previous,active:false},pendingMs);
      pendingMs = 0;
    }
    if (same && previous.active && elapsed <= 4000) pendingMs += elapsed;
    const changed = !same || previous.active !== current.active;
    previous = {...current,at:now};
    if (!changed && now-lastSent < 15000) return;
    dispatch(current,pendingMs);
    pendingMs = 0; lastSent = now;
  }
  return {sample,finish};
}

export function levelMeter() {
  const meter = document.createElement('div');
  meter.className = 'watch-level';
  meter.innerHTML = '<div class="level-caption"><span>Level <b></b></span><small></small></div>' +
    '<div class="level-rail" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></div>';
  return meter;
}

export function paintLevel(meter, milliseconds, name) {
  const {level, fraction} = watchLevel(milliseconds);
  const percent = Math.floor(fraction * 100);
  meter.style.setProperty('--level-hue', levelHue(level).toFixed(1));
  meter.style.setProperty('--level-fill', (fraction * 100).toFixed(3) + '%');
  meter.querySelector('b').textContent = level.toLocaleString();
  meter.querySelector('small').textContent = percent + '%';
  const rail = meter.querySelector('[role=progressbar]');
  rail.setAttribute('aria-label', name + ' watch level ' + level);
  rail.setAttribute('aria-valuenow', String(percent));
  rail.setAttribute('aria-valuetext', percent + '% towards level ' + (level + 1));
  meter.title = 'Level ' + level + ' · ' + percent + '% towards level ' + (level + 1);
  return level;
}

export function celebrate(person, level) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const origin = person.querySelector('.portrait-level-effect');
  if (!origin || !origin.getClientRects().length || document.hidden) return;
  const burst = document.createElement('span');
  burst.className = 'level-burst';
  burst.setAttribute('aria-hidden', 'true');
  burst.style.setProperty('--level-hue', levelHue(level));
  for (let i = 0; i < 9; i++) {
    const piece = document.createElement('i');
    const angle = (i + .5) * Math.PI / 9;
    piece.style.setProperty('--dx', Math.round(Math.cos(angle) * (24 + i % 3 * 5)) + 'px');
    piece.style.setProperty('--dy', -Math.round(Math.sin(angle) * (27 + i % 4 * 4)) + 'px');
    piece.style.setProperty('--spin', (i % 2 ? -1 : 1) * (55 + i * 13) + 'deg');
    piece.style.animationDelay = (i % 3 * 28) + 'ms';
    burst.append(piece);
  }
  origin.append(burst);
  setTimeout(() => burst.remove(), 1250);
}
