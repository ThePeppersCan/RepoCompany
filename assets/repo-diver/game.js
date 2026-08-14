(() => {
  'use strict';
  window.__REPO_DIVER_BUILD__='v5-soldout-flow-20260814';

  const $ = id => document.getElementById(id);
  const D = window.RepoDiverData;
  const E = window.RepoDiverEngine;

  let profile = {
    day_number: 1,
    level: 1,
    unlocked_biomes: ['karamja'],
    equipment: { tank: 1, cargo: 1, harpoon: 1, suit: 1, boost: 1 },
    restaurant: { rank: 1, tables: 3, kitchen: 1 },
    fish_journal: {}, recipes: [], stats: {}
  };
  let run = null;
  let runId = null;
  let raf = 0;
  let serviceRaf = 0;
  let last = 0;
  let input = {};
  let mouse = { x: 480, y: 270 };
  let selectedRecipes = [];
  let service = null;
  let restaurantRenderSig = { orders: '', scene: '' };
  let noticeEl = null;

  const db = () => window.db || window.__QD_HOST__?.getDb?.();
  async function rpc(name, args = {}) {
    const client = db();
    if (!client) throw new Error('Database unavailable');
    const { data, error } = await client.rpc(name, args);
    if (error) throw error;
    return data;
  }

  function show(id) {
    ['rdHomeView', 'rdDiveView', 'rdSurfaceView', 'rdRestaurantView', 'rdResultsView'].forEach(x => $(x)?.classList.add('hidden'));
    $(id)?.classList.remove('hidden');
  }

  function rankName(n) {
    return ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'PEARL', 'SAPPHIRE', 'RUBY', 'DIAMOND', 'ABYSSAL', 'VELMORAN'][Math.max(0, Math.min(9, (n || 1) - 1))];
  }

  function ensureDiveNotice() {
    if (noticeEl) return noticeEl;
    const wrap = $('rdDiveCanvas')?.parentElement;
    if (!wrap) return null;
    noticeEl = document.createElement('div');
    noticeEl.className = 'rd-dive-notice';
    noticeEl.setAttribute('aria-live', 'polite');
    wrap.appendChild(noticeEl);
    return noticeEl;
  }

  async function loadProfile() {
    try { profile = await rpc('repo_diver_get_profile') || profile; }
    catch (e) { console.warn(e); }
    renderHome();
  }

  function renderHome() {
    if (!$('rdHomeView')) return;
    $('rdDay').textContent = profile.day_number || 1;
    $('rdRank').textContent = rankName(profile.restaurant?.rank || 1);
    $('rdDeepest').textContent = Math.round(profile.stats?.deepest || 0) + 'm';
    $('rdStatus').innerHTML = `<b>DIVER LEVEL ${Math.min(40, profile.day_number || 1)}/40</b> · ${Object.keys(profile.fish_journal || {}).length}/${D.FISH.length} species discovered · ${(profile.stats?.total_revenue || 0).toLocaleString()} GP lifetime revenue`;

    $('rdBiomes').innerHTML = D.BIOMES.map((b, i) => {
      const open = (profile.day_number || 1) >= b.unlock;
      const discovered = D.fishForBiome(b.id).filter(f => profile.fish_journal?.[f.id]).length;
      return `<button class="rd-biome ${open ? '' : 'locked'}" data-biome="${b.id}" style="--rd-accent:${b.accent};--rd-deep:${b.deep}">
        <span class="rd-biome-art"><i></i><em>${open ? 'DIVE' : 'LOCKED'}</em></span>
        <small>ZONE ${String(i + 1).padStart(2, '0')} · ${b.max_depth}M</small><h4>${b.name}</h4><p>${b.mood}</p>
        <footer><span>${discovered}/12 SPECIES</span><b>${open ? 'ENTER WATER' : 'LEVEL ' + b.unlock}</b></footer>
      </button>`;
    }).join('');
    document.querySelectorAll('[data-biome]').forEach(btn => btn.onclick = () => {
      if (!btn.classList.contains('locked')) startDive(btn.dataset.biome);
    });
    renderJournal();
    renderUpgrades();
  }

  function renderJournal() {
    const j = $('rdJournal');
    if (!j) return;
    const found = Object.keys(profile.fish_journal || {}).length;
    j.innerHTML = `<div class="rd-journal-top"><div><small>MARINE ARCHIVE</small><h4>${found} / ${D.FISH.length} DISCOVERED</h4></div><div class="rd-journal-progress"><i style="width:${found / D.FISH.length * 100}%"></i></div></div><div class="rd-journal-grid">` + D.FISH.map(f => {
      const x = profile.fish_journal?.[f.id];
      return `<article class="rd-fish-card ${x ? 'found' : 'unknown'}" style="--fish:${f.color}"><div class="rd-fish-silhouette">${x ? '◈' : '?'}</div><small>${f.rarity}</small><b>${x ? f.name : 'UNDISCOVERED SPECIES'}</b><span>${D.biome(f.biome).short}</span>${x ? `<footer>CAUGHT ${x.count || 0} · BEST ★${x.best_q || 1}</footer>` : '<footer>FIND IT IN THE DEEP</footer>'}</article>`;
    }).join('') + '</div>';
  }

  function renderUpgrades() {
    const u = $('rdUpgrades');
    if (!u) return;
    u.innerHTML = ['Diving', 'Restaurant'].map(group => `<section class="rd-upgrade-group"><div class="rd-upgrade-title"><small>OPERATIONS</small><h4>${group.toUpperCase()}</h4></div><div class="rd-upgrade-grid">${D.UPGRADES.filter(x => x.group === group).map(x => {
      const lv = profile[x.group === 'Restaurant' ? 'restaurant' : 'equipment']?.[x.key] || 1;
      const max = lv >= x.max;
      const cost = Math.round(x.baseCost * Math.pow(x.mult, lv - 1));
      return `<button data-upgrade="${x.key}" class="rd-upgrade-card ${max ? 'maxed' : ''}"><span>${x.name}</span><small>${x.desc}</small><i>LV ${lv}/${x.max}</i><b>${max ? 'MAXED' : cost.toLocaleString() + ' GP'}</b></button>`;
    }).join('')}</div></section>`).join('');
    document.querySelectorAll('[data-upgrade]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      try {
        const r = await rpc('repo_diver_buy_upgrade', { p_upgrade: b.dataset.upgrade });
        profile.equipment = r.equipment || profile.equipment;
        profile.restaurant = r.restaurant || profile.restaurant;
        renderUpgrades();
      } catch (e) { $('rdStatus').textContent = e.message; }
      finally { b.disabled = false; }
    });
  }

  async function startDive(biome) {
    try {
      const data = await rpc('repo_diver_start_day', { p_biome: biome });
      runId = Array.isArray(data) ? data[0]?.run_id : data?.run_id;
    } catch (e) {
      $('rdStatus').textContent = e.message;
      return;
    }
    run = E.createRun({ biome, level: profile.day_number, equipment: profile.equipment });
    show('rdDiveView');
    ensureDiveNotice();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    $('rdDiveCanvas')?.focus();
  }

  function loop(t) {
    if (!run) return;
    const dt = Math.min(.034, (t - last) / 1000 || .016);
    last = t;
    E.update(run, dt, input, profile.equipment);
    updateParticles(dt);
    draw();
    hud();
    if (run.done) { surface(); return; }
    raf = requestAnimationFrame(loop);
  }

  function updateParticles(dt) {
    for (const p of run.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 18 * dt;
      p.life -= dt;
    }
    run.particles = run.particles.filter(p => p.life > 0);
  }

  function drawEnvironment(ctx, w, h, b) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, b.accent + 'dc');
    gradient.addColorStop(.34, b.deep);
    gradient.addColorStop(1, '#01050b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = .08;
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = '#d8ffff';
      ctx.beginPath();
      const x = (i * 137 + 30) % w;
      ctx.moveTo(x, 0); ctx.lineTo(x + 85, 0); ctx.lineTo(x + 215, h); ctx.lineTo(x + 145, h); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    for (let i = 0; i < 42; i++) {
      const y = (i * 83 + run.elapsed * (12 + i % 4)) % h;
      const x = (i * 173 + Math.sin(i * 7) * 44) % w;
      ctx.fillStyle = `rgba(210,250,255,${.12 + (i % 3) * .07})`;
      ctx.beginPath();
      ctx.arc(x, y, .8 + (i % 4) * .45, 0, Math.PI * 2);
      ctx.fill();
    }

    const floorY = h - 46;
    const floor = ctx.createLinearGradient(0, floorY, 0, h);
    floor.addColorStop(0, 'rgba(7,18,24,.72)');
    floor.addColorStop(1, '#020509');
    ctx.fillStyle = floor;
    ctx.fillRect(0, floorY, w, h - floorY);

    // Rocks, kelp and coral silhouettes: biome-coloured but intentionally subdued.
    for (let i = 0; i < 18; i++) {
      const x = (i * 71 + 17) % w;
      const height = 13 + ((i * 19) % 37);
      ctx.fillStyle = i % 3 === 0 ? 'rgba(20,46,47,.78)' : 'rgba(10,24,29,.9)';
      ctx.beginPath();
      ctx.ellipse(x, h - 35, 19 + (i % 4) * 5, 9 + (i % 3) * 4, 0, 0, Math.PI * 2);
      ctx.fill();
      if (['kelp', 'coral', 'karamja'].includes(b.id) && i % 2 === 0) {
        ctx.strokeStyle = b.accent + '55';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, h - 39);
        ctx.bezierCurveTo(x - 8, h - 50 - height * .4, x + 8, h - 55 - height * .65, x + Math.sin(run.elapsed + i) * 5, h - 42 - height);
        ctx.stroke();
      }
    }
  }

  function drawFish(ctx, f) {
    ctx.save();
    ctx.translate(f.x, f.y);
    const facing = f.vx < 0 ? -1 : 1;
    ctx.scale(facing, 1);
    const size = f.size || 1;
    if (f.rarity === 'legendary' || f.rarity === 'mythic') {
      ctx.shadowColor = f.color;
      ctx.shadowBlur = f.rarity === 'mythic' ? 17 : 9;
    }
    if (f.hitFlash > 0) ctx.globalAlpha = .55 + Math.sin(f.hitFlash * 30) * .4;
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15 * size, 7 * size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-12 * size, 0);
    ctx.lineTo(-24 * size, -9 * size);
    ctx.lineTo(-22 * size, 9 * size);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.beginPath();
    ctx.ellipse(2 * size, -2 * size, 8 * size, 2.2 * size, -.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#07131a';
    ctx.beginPath(); ctx.arc(8 * size, -2 * size, 1.6 * size, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(8.5 * size, -2.4 * size, .55 * size, 0, Math.PI * 2); ctx.fill();

    if (f.maxHp > 1 && !f.hooked) {
      const barW = 28 * size;
      ctx.fillStyle = 'rgba(0,0,0,.62)';
      ctx.fillRect(-barW / 2, -14 * size, barW, 3);
      ctx.fillStyle = '#7ff2d0';
      ctx.fillRect(-barW / 2, -14 * size, barW * (f.hp / f.maxHp), 3);
    }
    ctx.restore();
  }

  function drawDiver(ctx, p) {
    const angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);
    p.aimAngle = angle;
    const flip = Math.cos(angle) < 0 ? -1 : 1;
    const kick = Math.sin(p.swimPhase) * 4;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle * .12);
    ctx.scale(flip, 1);

    // Tank behind the body.
    ctx.fillStyle = '#2c4d5a';
    ctx.strokeStyle = '#8ec8d5';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.roundRect(-17, -11, 10, 23, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d9c078';
    ctx.fillRect(-13.8, -14, 3.5, 4);

    // Legs + fins.
    ctx.strokeStyle = '#183b4b';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-18, 16 + kick); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-5, 9); ctx.lineTo(-13, 20 - kick); ctx.stroke();
    ctx.fillStyle = '#59c8d8';
    ctx.beginPath(); ctx.moveTo(-18, 13 + kick); ctx.lineTo(-32, 14 + kick); ctx.lineTo(-22, 20 + kick); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-13, 17 - kick); ctx.lineTo(-27, 21 - kick); ctx.lineTo(-16, 25 - kick); ctx.closePath(); ctx.fill();

    // Torso.
    const suit = ctx.createLinearGradient(-8, -12, 12, 13);
    suit.addColorStop(0, '#173a49'); suit.addColorStop(.55, '#2d6472'); suit.addColorStop(1, '#102a36');
    ctx.fillStyle = suit;
    ctx.strokeStyle = '#75d4df';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.roundRect(-10, -12, 23, 24, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d9b84d';
    ctx.fillRect(-4, -10, 3, 20);

    // Head / hood / face.
    ctx.fillStyle = '#0c202a';
    ctx.beginPath(); ctx.arc(10, -12, 10.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#94eef1'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#d8a875';
    ctx.beginPath(); ctx.ellipse(12.5, -12, 5.4, 6.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9eeef7aa';
    ctx.beginPath(); ctx.roundRect(9, -17, 9, 7, 3); ctx.fill();
    ctx.fillStyle = '#041116';
    ctx.fillRect(15, -14.5, 1.3, 1.3);

    // Arms holding the gun.
    ctx.strokeStyle = '#24515e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(16, 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 1); ctx.lineTo(15, 5); ctx.stroke();
    ctx.fillStyle = '#d8a875';
    ctx.beginPath(); ctx.arc(16, 2, 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(15, 5, 2.3, 0, Math.PI * 2); ctx.fill();

    // Harpoon gun always points toward aim direction after the lightly-rotated body.
    ctx.restore();
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#1e3139';
    ctx.fillRect(10, -3, 27, 6);
    ctx.fillStyle = '#d3aa4e';
    ctx.fillRect(19, -2, 14, 3);
    ctx.fillStyle = '#8be5ee';
    ctx.fillRect(34, -1.2, 10, 2.4);
    ctx.strokeStyle = '#09202a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(18, 3); ctx.lineTo(15, 9); ctx.stroke();
    ctx.restore();
  }

  function drawHarpoon(ctx) {
    if (!run?.harpoon) return;
    const p = run.player;
    const h = run.harpoon;
    if (h.projectile) {
      ctx.save();
      ctx.strokeStyle = 'rgba(215,248,255,.58)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(h.projectile.x, h.projectile.y); ctx.stroke();
      ctx.translate(h.projectile.x, h.projectile.y); ctx.rotate(h.projectile.angle);
      ctx.strokeStyle = '#ecfbff'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(9, 0); ctx.stroke();
      ctx.fillStyle = '#e3b85c';
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(3, -4); ctx.lineTo(4, 4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    if (h.hooked) {
      const f = h.hooked.fish;
      ctx.save();
      ctx.strokeStyle = '#f2fcff';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo((p.x + f.x) / 2, (p.y + f.y) / 2 + Math.sin(run.elapsed * 18) * 9, f.x, f.y); ctx.stroke();
      ctx.restore();
    }
  }

  function drawAim(ctx) {
    const ready = run?.harpoon && !run.harpoon.projectile && !run.harpoon.hooked && run.harpoon.cooldown <= 0;
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    ctx.strokeStyle = ready ? 'rgba(214,255,248,.82)' : 'rgba(255,211,115,.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-7, 0); ctx.moveTo(17, 0); ctx.lineTo(7, 0); ctx.moveTo(0, -17); ctx.lineTo(0, -7); ctx.moveTo(0, 17); ctx.lineTo(0, 7); ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const canvas = $('rdDiveCanvas');
    const ctx = canvas?.getContext('2d');
    if (!ctx || !run) return;
    const w = canvas.width, h = canvas.height;
    ctx.save();
    ctx.translate((Math.random() - .5) * run.shake, (Math.random() - .5) * run.shake);
    drawEnvironment(ctx, w, h, run.biome);

    for (const t of run.treasures) {
      if (t.opened) continue;
      const pulse = 1 + Math.sin(t.phase * 3) * .08;
      ctx.save(); ctx.translate(t.x, t.y); ctx.scale(pulse, pulse);
      ctx.shadowColor = '#ffd96c'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#8a5b23'; ctx.fillRect(-14, -9, 28, 18);
      ctx.strokeStyle = '#f5c765'; ctx.lineWidth = 2; ctx.strokeRect(-14, -9, 28, 18);
      ctx.fillStyle = '#e8ba4e'; ctx.fillRect(-2, -10, 4, 20); ctx.restore();
    }

    for (const f of run.fish) drawFish(ctx, f);
    for (const p of run.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color || '#c8ffff';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawHarpoon(ctx);
    drawDiver(ctx, run.player);
    drawAim(ctx);
    ctx.restore();

    if (run.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${run.flash * .10})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function hud() {
    if (!run) return;
    $('rdO2Fill').style.width = run.player.o2 + '%';
    $('rdHpFill').style.width = run.player.hp + '%';
    $('rdDepth').textContent = Math.round((run.player.y / 540) * run.biome.max_depth) + 'm';
    const kg = E.cargoWeight(run);
    const cap = E.cargoCap(profile.equipment);
    $('rdCargo').textContent = kg.toFixed(1) + '/' + cap + 'kg';
    const cargoBox = $('rdCargo')?.closest('.rd-hudbox');
    cargoBox?.classList.toggle('rd-cargo-full', kg >= cap - .05);
    $('rdCatchCount').textContent = run.catches.filter(x => x.kind === 'fish').length;

    const n = ensureDiveNotice();
    if (n) {
      const active = run.notice?.time > 0;
      n.textContent = active ? run.notice.text : (run.harpoon?.hooked ? 'REELING CATCH…' : run.harpoon?.projectile ? 'HARPOON IN FLIGHT' : 'CLICK TO FIRE HARPOON');
      n.dataset.type = active ? run.notice.type : 'muted';
      n.classList.toggle('show', !!n.textContent);
    }
  }

  function surface() {
    cancelAnimationFrame(raf);
    if (!run) return;
    show('rdSurfaceView');
    $('rdSurfaceDepth').textContent = run.maxDepth + 'm';
    $('rdSurfaceNotice').innerHTML = `Expedition recovered <b>${run.catches.filter(x => x.kind === 'fish').length} fish</b> and <b>${run.catches.filter(x => x.kind === 'treasure').length} treasures</b>. Cargo used: <b>${E.cargoWeight(run).toFixed(1)}/${E.cargoCap(profile.equipment)}kg</b>.`;
    $('rdCatchList').innerHTML = run.catches.length ? run.catches.map(x => `<div class="rd-catch-row"><span>${x.kind === 'treasure' ? '◆' : '◈'} ${x.name}</span><small>${x.rarity} · ${Number(x.weight || 0).toFixed(1)}kg · ★${x.q}</small></div>`).join('') : '<p>No catches made. The sea wins this one.</p>';

    selectedRecipes = [];
    const rec = D.recipesForCatches(run.catches, profile.day_number);
    const fishCounts = {};
    for (const x of run.catches.filter(x => x.kind === 'fish')) fishCounts[x.id] = (fishCounts[x.id] || 0) + 1;
    const maxMenu = Math.min(4, 2 + Math.floor((profile.restaurant?.menu || 1) / 2));
    $('rdRecipeChoices').innerHTML = rec.map(r => `<button data-recipe="${r.id}"><b>${r.name}</b><small>${r.base_price.toLocaleString()} GP base · ${fishCounts[r.fish_id] || 0} portions available</small></button>`).join('') || '<p>Catch a menu-grade fish to open tonight.</p>';
    document.querySelectorAll('[data-recipe]').forEach(b => b.onclick = () => {
      const id = b.dataset.recipe;
      if (b.classList.contains('selected')) {
        b.classList.remove('selected');
        selectedRecipes = selectedRecipes.filter(x => x !== id);
      } else {
        if (selectedRecipes.length >= maxMenu) {
          $('rdSurfaceNotice').innerHTML += `<br><span class="rd-warning-copy">Menu capacity is ${maxMenu} dishes. Upgrade Menu Board for more flexibility.</span>`;
          return;
        }
        b.classList.add('selected');
        selectedRecipes.push(id);
      }
      $('rdOpenRestaurant').disabled = !selectedRecipes.length;
    });
  }

  function restaurantReadyCapacity() {
    return Math.min(6, 2 + Math.floor(((profile.restaurant?.staff || 1) + (profile.restaurant?.kitchen || 1)) / 3));
  }

  function buildRestaurantStock() {
    const fishCounts = {};
    for (const item of run.catches.filter(x => x.kind === 'fish')) fishCounts[item.id] = (fishCounts[item.id] || 0) + 1;
    const stock = {};
    for (const id of selectedRecipes) {
      const recipe = D.RECIPES.find(r => r.id === id);
      if (recipe) stock[id] = fishCounts[recipe.fish_id] || 0;
    }
    return stock;
  }

  function ensureRestaurantLayout() {
    const view = $('rdRestaurantView');
    const grid = view?.querySelector('.rd-rest-grid');
    const scene = view?.querySelector('.rd-rest-scene');
    if (!view || !grid || !scene) return false;
    // Force one layout pass after switching from display:none. This prevents a
    // zero-sized/unstyled centre scene when a browser restores an old cached state.
    void view.offsetHeight;
    scene.style.minHeight = Math.max(480, grid.clientHeight || 480) + 'px';
    return true;
  }

  function startRestaurant() {
    if (!selectedRecipes.length) return;
    cancelAnimationFrame(serviceRaf);
    show('rdRestaurantView');
    ensureRestaurantLayout();
    requestAnimationFrame(ensureRestaurantLayout);
    const duration = 88 + (profile.restaurant?.service || 1) * 3;
    service = {
      time: duration,
      served: 0,
      revenue: 0,
      lost: 0,
      customers: [],
      ready: [],
      servedDishes: [],
      stock: buildRestaurantStock(),
      active: true,
      last: performance.now(),
      spawn: .8,
      nextCustomer: 1,
      cook: null
    };
    restaurantRenderSig = { orders: '', scene: '' };
    $('rdCookPanel')?.classList.add('hidden');
    renderRestaurantMenu();
    renderReadyCounter();
    renderRestaurantScene();
    renderOrders();
    $('rdServiceToast').textContent = 'THE FISH HOUSE IS OPEN · CUSTOMERS ARE ARRIVING';
    serviceRaf = requestAnimationFrame(serviceLoop);
  }

  function renderRestaurantMenu() {
    if (!service) return;
    $('rdRestaurantMenu').innerHTML = selectedRecipes.map(id => {
      const r = D.RECIPES.find(x => x.id === id);
      const stock = service.stock[id] || 0;
      const disabled = stock <= 0 || !!service.cook || service.ready.length >= restaurantReadyCapacity();
      return `<button data-cook="${id}" ${disabled ? 'disabled' : ''}><b>${r.name}</b><small>${r.base_price.toLocaleString()} GP · STOCK ${stock}</small><em>${disabled && stock <= 0 ? 'SOLD OUT' : 'PREP DISH'}</em></button>`;
    }).join('');
    document.querySelectorAll('[data-cook]').forEach(b => b.onclick = () => startCook(b.dataset.cook, null));
  }

  function renderReadyCounter() {
    const box = $('rdReadyCounter');
    if (!box || !service) return;
    if (!service.ready.length) {
      box.innerHTML = `<span class="rd-ready-empty">No dishes ready · counter ${service.ready.length}/${restaurantReadyCapacity()}</span>`;
      return;
    }
    box.innerHTML = `<div class="rd-ready-list">${service.ready.map((dish, i) => {
      const r = D.RECIPES.find(x => x.id === dish.id);
      return `<span class="rd-ready-chip" data-ready-index="${i}"><b>${r?.name || dish.id}</b><small>★${dish.quality}${dish.targetCustomerId ? ' · TABLE RESERVED' : ''}</small></span>`;
    }).join('')}</div><small class="rd-ready-cap">READY COUNTER ${service.ready.length}/${restaurantReadyCapacity()}</small>`;
  }

  function readyDishIndexForCustomer(customer) {
    if (!service || !customer) return -1;
    // Reserved dishes always belong to their original table. Unreserved prep dishes
    // can serve any customer who ordered the same recipe.
    let idx = service.ready.findIndex(d => d.id === customer.id && d.targetCustomerId === customer.uid);
    if (idx >= 0) return idx;
    return service.ready.findIndex(d => d.id === customer.id && !d.targetCustomerId);
  }

  // Conserved restaurant portion accounting. One raw fish portion, one dish in
  // progress, or one ready plate can satisfy exactly one live customer order.
  function recipeSupply(id) {
    if (!service) return 0;
    return Math.max(0, service.stock[id] || 0)
      + service.ready.filter(d => d.id === id).length
      + (service.cook?.id === id ? 1 : 0);
  }

  function recipeDemand(id) {
    if (!service) return 0;
    return service.customers.filter(c => c.id === id).length;
  }

  function recipeSpare(id) {
    return recipeSupply(id) - recipeDemand(id);
  }

  function hasMealPotential() {
    if (!service) return false;
    return selectedRecipes.some(id => recipeSupply(id) > 0);
  }

  function releaseCustomerReservation(uid) {
    if (!service) return;
    if (service.cook?.targetCustomerId === uid) service.cook.targetCustomerId = null;
    for (const dish of service.ready) {
      if (dish.targetCustomerId === uid) dish.targetCustomerId = null;
    }
  }

  function findUncommittedCustomerForRecipe(id) {
    if (!service) return null;
    const candidates = service.customers.filter(c => c.id === id).sort((a, b) => b.uid - a.uid);
    return candidates.find(c => {
      const reservedReady = service.ready.some(d => d.id === id && d.targetCustomerId === c.uid);
      const targetedCook = service.cook?.id === id && service.cook?.targetCustomerId === c.uid;
      return !reservedReady && !targetedCook;
    }) || candidates[0] || null;
  }

  // Repairs impossible orders, including states left behind by older builds. If a
  // dish sells out, switch the newest uncommitted table to another dish with a spare
  // portion. If the whole kitchen is sold out, release that table without a walkout
  // penalty rather than leaving an impossible customer sitting forever.
  function reconcileImpossibleOrders() {
    if (!service?.active) return false;
    let changed = false;

    const validCustomerIds = new Set(service.customers.map(c => c.uid));
    if (service.cook?.targetCustomerId && !validCustomerIds.has(service.cook.targetCustomerId)) {
      service.cook.targetCustomerId = null;
      changed = true;
    }
    for (const dish of service.ready) {
      if (dish.targetCustomerId && !validCustomerIds.has(dish.targetCustomerId)) {
        dish.targetCustomerId = null;
        changed = true;
      }
    }

    let guard = 0;
    while (guard++ < 40) {
      const oversoldId = selectedRecipes.find(id => recipeDemand(id) > recipeSupply(id));
      if (!oversoldId) break;
      const customer = findUncommittedCustomerForRecipe(oversoldId);
      if (!customer) break;
      const substitutes = selectedRecipes.filter(id => id !== oversoldId && recipeSpare(id) > 0);
      if (substitutes.length) {
        const nextId = substitutes.sort((a, b) => recipeSpare(b) - recipeSpare(a))[0];
        customer.id = nextId;
        customer.patience = Math.max(customer.patience, 72);
        const nextRecipe = D.RECIPES.find(r => r.id === nextId);
        $('rdServiceToast').textContent = `TABLE ${customer.table + 1} SWITCHED ORDER · ${nextRecipe?.name?.toUpperCase() || 'CHEF SPECIAL'}`;
        changed = true;
      } else {
        releaseCustomerReservation(customer.uid);
        const idx = service.customers.findIndex(c => c.uid === customer.uid);
        if (idx >= 0) service.customers.splice(idx, 1);
        service.soldOutReleased = (service.soldOutReleased || 0) + 1;
        $('rdServiceToast').textContent = `TABLE ${customer.table + 1} RELEASED · DISH SOLD OUT`;
        changed = true;
      }
    }

    if (changed) {
      renderReadyCounter();
      renderRestaurantMenu();
      renderOrders(true);
      renderRestaurantScene(true);
    }
    return changed;
  }

  function endServiceEarly(reason = 'KITCHEN SOLD OUT · SERVICE COMPLETE') {
    if (!service?.active || service.closing) return false;
    service.closing = true;
    service.active = false;
    service.time = 0;
    service.cook = null;
    cancelAnimationFrame(serviceRaf);
    $('rdCookPanel')?.classList.add('hidden');
    $('rdServiceTime').textContent = '0';
    $('rdServiceToast').textContent = reason;
    const delay = window.__REPO_DIVER_TEST_MODE__ ? 0 : 650;
    setTimeout(() => finishDay(), delay);
    return true;
  }

  function maybeCloseSoldOutService() {
    if (!service?.active || service.closing) return false;
    reconcileImpossibleOrders();
    if (!hasMealPotential()) {
      return endServiceEarly(service.served > 0
        ? 'KITCHEN SOLD OUT · LAST TABLE SERVED · CLOSING EARLY'
        : 'KITCHEN SOLD OUT · CLOSING SERVICE EARLY');
    }
    return false;
  }

  function renderRestaurantScene(force = false) {
    const scene = $('rdCustomerScene');
    if (!scene || !service) return;
    const positions = [
      [16, 24], [50, 19], [82, 25], [17, 70], [50, 73], [82, 69], [34, 47], [67, 48]
    ];
    const signature = service.customers.map(c => `${c.uid}:${c.id}:${c.table}:${readyDishIndexForCustomer(c) >= 0 ? 1 : 0}`).join('|');
    if (!force && restaurantRenderSig.scene === signature) return;
    restaurantRenderSig.scene = signature;
    scene.innerHTML = service.customers.map(c => {
      const pos = positions[c.table % positions.length];
      const recipe = D.RECIPES.find(r => r.id === c.id);
      const ready = readyDishIndexForCustomer(c) >= 0;
      return `<button type="button" class="rd-diner ${ready ? 'has-ready' : ''}" data-scene-customer-id="${c.uid}" style="left:${pos[0]}%;top:${pos[1]}%" aria-label="Table ${c.table + 1}: ${ready ? 'serve' : 'cook'} ${recipe?.name || 'order'}"><i class="rd-diner-head"></i><i class="rd-diner-body"></i><i class="rd-diner-arm a"></i><i class="rd-diner-arm b"></i><span class="rd-diner-bubble">${ready ? '✓ CLICK TO SERVE' : recipe?.name.split(' ').slice(0, 2).join(' ') || 'ORDER'}</span></button>`;
    }).join('');
    scene.onclick = e => {
      const target = e.target.closest('[data-scene-customer-id]');
      if (!target) return;
      e.preventDefault();
      handleOrderClick(Number(target.dataset.sceneCustomerId));
    };
  }

  function updateOrderPatienceBars() {
    const orders = $('rdOrders');
    if (!orders || !service) return;
    for (const c of service.customers) {
      const bar = orders.querySelector(`[data-patience-for="${c.uid}"]`);
      if (bar) bar.style.width = `${Math.max(0, Math.min(100, c.patience))}%`;
    }
  }

  function renderOrders(force = false) {
    if (!service) return;
    const orders = $('rdOrders');
    if (!orders) return;
    const signature = service.customers.map(c => {
      const ready = readyDishIndexForCustomer(c) >= 0;
      const cooking = service.cook?.targetCustomerId === c.uid;
      return `${c.uid}:${c.id}:${c.table}:${ready ? 1 : 0}:${cooking ? 1 : 0}`;
    }).join('|');
    if (!force && restaurantRenderSig.orders === signature) {
      updateOrderPatienceBars();
      return;
    }
    restaurantRenderSig.orders = signature;
    if (!service.customers.length) {
      orders.innerHTML = '<p class="rd-orders-empty">The dining room is ready for the next seating.</p>';
    } else {
      orders.innerHTML = service.customers.map(c => {
        const r = D.RECIPES.find(x => x.id === c.id);
        const ready = readyDishIndexForCustomer(c) >= 0;
        const cooking = service.cook?.targetCustomerId === c.uid;
        const action = ready ? 'SERVE TABLE' : cooking ? 'COOKING…' : 'COOK ORDER';
        const sub = ready ? 'Dish ready — click anywhere on this ticket to serve' : cooking ? 'Finish the timing stages' : 'Click to prepare this customer’s meal';
        return `<button type="button" class="rd-order ${ready ? 'ready' : ''} ${cooking ? 'cooking' : ''}" data-order-id="${c.uid}"><span class="rd-order-top"><b>TABLE ${c.table + 1}</b><strong>${action}</strong></span><span class="rd-order-name">${r?.name || c.id}</span><small>${sub}</small><i data-patience-for="${c.uid}" style="width:${Math.max(0, c.patience)}%"></i></button>`;
      }).join('');
    }
    // Event delegation lives on the stable container. We deliberately do not attach
    // handlers to individual tickets because the old 60fps re-rendering replaced the
    // button between pointer-down and pointer-up, swallowing the click.
    orders.onclick = e => {
      const btn = e.target.closest('[data-order-id]');
      if (!btn) return;
      e.preventDefault();
      handleOrderClick(Number(btn.dataset.orderId));
    };
    updateOrderPatienceBars();
  }

  function handleOrderClick(uid) {
    if (!service?.active) return;
    const customer = service.customers.find(c => c.uid === uid);
    if (!customer) return;
    const readyIndex = readyDishIndexForCustomer(customer);
    if (readyIndex >= 0) {
      serveCustomer(uid, readyIndex);
      return;
    }
    if (service.cook) {
      $('rdServiceToast').textContent = service.cook.targetCustomerId === uid
        ? 'FINISH THIS DISH · HIT BOTH TIMING WINDOWS'
        : 'ONE DISH AT A TIME · FINISH THE CURRENT ORDER FIRST';
      return;
    }
    startCook(customer.id, uid);
  }

  function startCook(id, targetCustomerId = null) {
    if (!service?.active || service.cook) return;
    if ((service.stock[id] || 0) <= 0) {
      $('rdServiceToast').textContent = 'DISH SOLD OUT · CHECKING ANOTHER ORDER';
      reconcileImpossibleOrders();
      maybeCloseSoldOutService();
      return;
    }
    if (service.ready.length >= restaurantReadyCapacity()) {
      $('rdServiceToast').textContent = 'READY COUNTER FULL · SERVE A DISH FIRST';
      return;
    }
    service.stock[id]--;
    const kitchen = profile.restaurant?.kitchen || 1;
    const sweetWidth = Math.min(.31, .14 + kitchen * .018);
    service.cook = {
      id,
      targetCustomerId,
      stage: 1,
      scores: [],
      needle: Math.random() * .18,
      dir: 1,
      speed: 1.18 + Math.random() * .23,
      sweetCenter: .34 + Math.random() * .32,
      sweetWidth
    };
    $('rdCookPanel')?.classList.remove('hidden');
    updateCookPanel();
    renderRestaurantMenu();
    renderOrders(true);
    renderRestaurantScene(true);
    $('rdServiceToast').textContent = 'COOKING STARTED · HIT THE GREEN ZONE';
  }

  function updateCookPanel() {
    if (!service?.cook) return;
    const c = service.cook;
    const r = D.RECIPES.find(x => x.id === c.id);
    $('rdCookStage').textContent = c.stage === 1 ? 'PREP STAGE 1/2 · KNIFE WORK' : 'SEAR STAGE 2/2 · PAN CONTROL';
    $('rdCookDish').textContent = r?.name || 'Dish';
    $('rdCookInstruction').textContent = c.stage === 1 ? 'Stop the marker inside the green prep window.' : 'Nail the second timing window for the final plate.';
    const sweet = $('rdCookSweet');
    if (sweet) {
      sweet.style.left = ((c.sweetCenter - c.sweetWidth / 2) * 100) + '%';
      sweet.style.width = (c.sweetWidth * 100) + '%';
    }
    if ($('rdCookNeedle')) $('rdCookNeedle').style.left = (c.needle * 100) + '%';
  }

  function hitCook() {
    if (!service?.cook) return;
    const c = service.cook;
    const half = c.sweetWidth / 2;
    const dist = Math.abs(c.needle - c.sweetCenter);
    const normalized = Math.max(0, 1 - dist / Math.max(.001, half * 2.2));
    c.scores.push(normalized);
    if (c.stage === 1) {
      c.stage = 2;
      c.needle = Math.random() < .5 ? .05 : .95;
      c.dir = c.needle < .5 ? 1 : -1;
      c.speed += .18;
      c.sweetCenter = .30 + Math.random() * .40;
      updateCookPanel();
      $('rdServiceToast').textContent = normalized > .72 ? 'CLEAN PREP · NOW SEAR IT' : 'ROUGH PREP · SAVE IT ON THE PAN';
      return;
    }

    const plating = profile.restaurant?.plating || 1;
    const average = (c.scores[0] + c.scores[1]) / 2 + Math.min(.10, (plating - 1) * .018);
    const quality = average >= .82 ? 4 : average >= .61 ? 3 : average >= .36 ? 2 : 1;
    service.ready.push({ id: c.id, quality, targetCustomerId: c.targetCustomerId });
    const r = D.RECIPES.find(x => x.id === c.id);
    $('rdServiceToast').textContent = `${r.name.toUpperCase()} · ${quality === 4 ? 'PERFECT PLATE' : 'QUALITY ★' + quality} · CLICK THE TABLE TO SERVE`;
    service.cook = null;
    $('rdCookPanel')?.classList.add('hidden');
    renderReadyCounter();
    renderRestaurantMenu();
    renderOrders(true);
    renderRestaurantScene(true);
  }

  function serveCustomer(uid, readyIndex) {
    if (!service?.active) return false;
    const customerIndex = service.customers.findIndex(c => c.uid === uid);
    if (customerIndex < 0 || readyIndex < 0 || readyIndex >= service.ready.length) return false;
    const customer = service.customers[customerIndex];
    const candidate = service.ready[readyIndex];
    if (!candidate || candidate.id !== customer.id || (candidate.targetCustomerId && candidate.targetCustomerId !== uid)) {
      $('rdServiceToast').textContent = 'WRONG DISH FOR THIS TABLE';
      return false;
    }
    const dish = service.ready.splice(readyIndex, 1)[0];
    const r = D.RECIPES.find(x => x.id === dish.id);
    if (!r) {
      service.ready.splice(readyIndex, 0, dish);
      $('rdServiceToast').textContent = 'DISH DATA ERROR · TRY ANOTHER ORDER';
      return false;
    }
    const patienceFactor = .82 + Math.max(0, customer.patience) / 100 * .24;
    const ambience = 1 + (profile.restaurant?.ambience || 1) * .025;
    const earned = Math.round(r.base_price * (.72 + dish.quality * .13) * patienceFactor * ambience);
    service.served++;
    service.revenue += earned;
    service.servedDishes.push({ id: dish.id, quality: dish.quality });
    service.customers.splice(customerIndex, 1);
    $('rdServiceToast').textContent = `TABLE ${customer.table + 1} SERVED · ★${dish.quality} · +${earned.toLocaleString()} GP EST.`;
    renderReadyCounter();
    renderRestaurantMenu();
    renderOrders(true);
    renderRestaurantScene(true);
    maybeCloseSoldOutService();
    return true;
  }

  function spawnCustomer() {
    if (!service?.active) return;
    const seats = Math.min(8, Math.max(3, profile.restaurant?.tables || 3));
    const usedTables = new Set(service.customers.map(c => c.table));
    const free = Array.from({ length: seats }, (_, i) => i).filter(i => !usedTables.has(i));
    if (!free.length) return;
    // Only seat a diner if there is an uncommitted physical portion for them.
    // This prevents e.g. three Haddock orders being created from one Haddock.
    const availableRecipes = selectedRecipes.filter(id => recipeSpare(id) > 0);
    if (!availableRecipes.length) {
      maybeCloseSoldOutService();
      return;
    }
    const id = E.pick(availableRecipes);
    service.customers.push({ uid: service.nextCustomer++, id, table: E.pick(free), patience: 100 });
    service.spawn = 4.6 + Math.random() * 3.5;
    renderOrders(true);
    renderRestaurantScene(true);
  }

  function serviceLoop(t) {
    if (!service?.active) return;
    const dt = Math.min(.05, (t - service.last) / 1000 || .016);
    service.last = t;
    service.time -= dt;
    service.spawn -= dt;

    if (service.spawn <= 0 && service.time > 5) spawnCustomer();

    const patienceDrain = 2.4 / (1 + (profile.restaurant?.service || 1) * .10);
    for (const c of service.customers) c.patience -= dt * patienceDrain;
    let customerListChanged = false;
    for (let i = service.customers.length - 1; i >= 0; i--) {
      if (service.customers[i].patience <= 0) {
        const left = service.customers[i];
        service.customers.splice(i, 1);
        releaseCustomerReservation(left.uid);
        service.lost++;
        customerListChanged = true;
        $('rdServiceToast').textContent = `TABLE ${left.table + 1} WALKED OUT · TOO SLOW`;
      }
    }
    if (customerListChanged) {
      renderReadyCounter();
      renderRestaurantMenu();
      renderOrders(true);
      renderRestaurantScene(true);
    } else {
      updateOrderPatienceBars();
    }

    reconcileImpossibleOrders();
    if (maybeCloseSoldOutService()) return;

    if (service.cook) {
      const c = service.cook;
      c.needle += c.dir * c.speed * dt;
      if (c.needle >= 1) { c.needle = 1; c.dir = -1; }
      if (c.needle <= 0) { c.needle = 0; c.dir = 1; }
      if ($('rdCookNeedle')) $('rdCookNeedle').style.left = (c.needle * 100) + '%';
    }

    $('rdServiceTime').textContent = Math.ceil(Math.max(0, service.time));
    $('rdServed').textContent = service.served;
    $('rdServiceRevenue').textContent = service.revenue.toLocaleString() + ' GP';

    if (service.time <= 0) {
      service.closing = true;
      service.active = false;
      service.cook = null;
      $('rdCookPanel')?.classList.add('hidden');
      finishDay();
      return;
    }
    serviceRaf = requestAnimationFrame(serviceLoop);
  }

  async function finishDay() {
    show('rdResultsView');
    $('rdResultFish').textContent = run.catches.filter(x => x.kind === 'fish').length;
    $('rdResultDishes').textContent = service.servedDishes.length;
    $('rdResultPerfect').textContent = service.servedDishes.filter(x => x.quality === 4).length;
    $('rdResultRevenue').textContent = service.revenue.toLocaleString() + ' GP';
    $('rdResultReward').textContent = 'Saving expedition…';
    const catches = run.catches.map(x => ({ id: x.id, q: x.q }));
    const dishes = service.servedDishes.map(x => ({ id: x.id, quality: x.quality }));
    try {
      const r = await rpc('repo_diver_complete_day', {
        p_run_id: runId,
        p_catches: catches,
        p_dishes: dishes,
        p_max_depth: Math.round(run.maxDepth),
        p_customers: service.servedDishes.length
      });
      $('rdResultReward').innerHTML = `<b>+${(r.fishing_xp_awarded || 0).toLocaleString()} Fishing XP</b> · <b>+${(r.cooking_xp_awarded || 0).toLocaleString()} Cooking XP</b> · <b>+${(r.gp_awarded || 0).toLocaleString()} GP</b>`;
      await loadProfile();
    } catch (e) {
      $('rdResultReward').textContent = e.message;
    }
  }

  function open() {
    const d = $('repoDiverDialog');
    if (!d) return;
    try { d.showModal(); } catch (_) { d.setAttribute('open', ''); }
    show('rdHomeView');
    loadProfile();
  }

  function close() {
    cancelAnimationFrame(raf);
    cancelAnimationFrame(serviceRaf);
    if (service) service.active = false;
    try { $('repoDiverDialog')?.close(); } catch (_) { $('repoDiverDialog')?.removeAttribute('open'); }
  }

  addEventListener('keydown', e => {
    if (!$('repoDiverDialog')?.open) return;
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') input.up = true;
    if (key === 's' || key === 'arrowdown') input.down = true;
    if (key === 'a' || key === 'arrowleft') input.left = true;
    if (key === 'd' || key === 'arrowright') input.right = true;
    if (key === 'shift') input.boost = true;
    if (key === 'e' && run && !$('rdDiveView')?.classList.contains('hidden')) E.interact(run, profile.equipment);
    if (key === ' ' && service?.active && service.cook) {
      e.preventDefault();
      hitCook();
    }
  });

  addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') input.up = false;
    if (key === 's' || key === 'arrowdown') input.down = false;
    if (key === 'a' || key === 'arrowleft') input.left = false;
    if (key === 'd' || key === 'arrowright') input.right = false;
    if (key === 'shift') input.boost = false;
  });

  addEventListener('DOMContentLoaded', () => {
    const canvas = $('rdDiveCanvas');
    canvas?.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * canvas.width / r.width;
      mouse.y = (e.clientY - r.top) * canvas.height / r.height;
    });
    canvas?.addEventListener('click', () => E.harpoon(run, mouse, profile.equipment));
    $('rdExitDive')?.addEventListener('click', () => { if (run) { run.done = true; surface(); } });
    $('rdOpenRestaurant')?.addEventListener('click', startRestaurant);
    $('rdCookHit')?.addEventListener('click', hitCook);
    $('rdResultsContinue')?.addEventListener('click', () => { show('rdHomeView'); loadProfile(); });
    $('rdClose')?.addEventListener('click', close);
    $('rdTabJournal')?.addEventListener('click', () => { $('rdHomeMain').classList.add('hidden'); $('rdJournalPanel').classList.remove('hidden'); });
    $('rdTabUpgrades')?.addEventListener('click', () => { $('rdHomeMain').classList.add('hidden'); $('rdUpgradePanel').classList.remove('hidden'); });
    document.querySelectorAll('[data-rd-back]').forEach(b => b.onclick = () => {
      $('rdJournalPanel').classList.add('hidden');
      $('rdUpgradePanel').classList.add('hidden');
      $('rdHomeMain').classList.remove('hidden');
    });
  });


  if (window.__REPO_DIVER_TEST_MODE__) {
    window.__RepoDiverTest = {
      getState: () => ({ profile, run, runId, selectedRecipes: [...selectedRecipes], service }),
      setRun: value => { run = value; },
      setSelectedRecipes: value => { selectedRecipes = [...value]; },
      startDive,
      surface,
      startRestaurant,
      spawnCustomer,
      startCook,
      hitCook,
      handleOrderClick,
      serveCustomer,
      finishDay,
      recipeSupply,
      recipeDemand,
      recipeSpare,
      reconcileImpossibleOrders,
      maybeCloseSoldOutService,
      renderOrders: () => renderOrders(true),
      renderScene: () => renderRestaurantScene(true),
      forceServiceTime: seconds => { if (service) service.time = seconds; }
    };
  }

  window.openRepoDiver = open;
})();
