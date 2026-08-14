(() => {
  'use strict';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const rarityRank = r => window.RepoDiverData?.RARITY?.[r]?.rank || 1;

  function weighted(list, weight) {
    let total = list.reduce((s, x) => s + weight(x), 0);
    let roll = Math.random() * total;
    for (const x of list) {
      roll -= weight(x);
      if (roll <= 0) return x;
    }
    return list[0];
  }

  function cargoCap(equipment = {}) {
    return 9 + (equipment.cargo || 1) * 5;
  }

  function cargoWeight(run) {
    return (run?.catches || []).reduce((sum, item) => sum + Number(item.weight || 0), 0);
  }

  function canCarry(run, item, equipment) {
    return cargoWeight(run) + Number(item?.weight || 0) <= cargoCap(equipment) + 0.0001;
  }

  function notice(run, text, type = 'info', seconds = 1.7) {
    if (!run) return;
    run.notice = { text, type, time: seconds };
  }

  function burst(run, x, y, amount = 12, color = '#c8ffff', force = 1) {
    for (let i = 0; i < amount; i++) {
      run.particles.push({
        x, y,
        vx: rand(-70, 70) * force,
        vy: rand(-85, 30) * force,
        life: rand(.28, .8),
        color,
        size: rand(1, 3)
      });
    }
  }

  function spawnFish(biome, level = 1, sonar = 1) {
    const D = window.RepoDiverData;
    const pool = D.fishForBiome(biome);
    const rarityW = { common: 38, uncommon: 24, rare: 11, epic: 4.4, legendary: 1.35, mythic: .28 };
    const src = weighted(pool, x => rarityW[x.rarity] * (1 + (sonar - 1) * (.06 * rarityRank(x.rarity))));
    const rank = rarityRank(src.rarity);
    const hp = Math.max(1, Math.ceil((rank - 1) / 2) + ((src.size || 1) > 1.25 ? 1 : 0));
    const dir = Math.random() < .5 ? -1 : 1;
    return {
      ...src,
      x: rand(80, 900),
      y: rand(82, 485),
      vx: dir * rand(.30, .62) * (src.speed || 1),
      vy: rand(-.18, .18),
      hp,
      maxHp: hp,
      phase: Math.random() * Math.PI * 2,
      dodge: 0,
      hooked: false,
      hitFlash: 0
    };
  }

  function createRun(opts) {
    const D = window.RepoDiverData;
    const biome = D.biome(opts.biome);
    const fishCount = 15 + Math.min(12, Math.floor((opts.level || 1) / 3)) + Math.min(8, ((opts.equipment?.lure || 1) - 1));
    const fish = Array.from({ length: fishCount }, () => spawnFish(biome.id, opts.level, opts.equipment?.sonar || 1));
    const treasureCount = Math.max(1, Math.min(4, 1 + Math.floor(((opts.equipment?.salvage || 1) - 1) / 2)));
    const sourceTreasures = D.treasuresForBiome(biome.id);
    const treasures = Array.from({ length: treasureCount }, (_, i) => {
      const t = sourceTreasures[i % Math.max(1, sourceTreasures.length)] || { id: biome.id + '_cache', name: 'Salvage Cache', rarity: 'rare', weight: 1.1 };
      return { ...t, x: rand(125, 835), y: rand(300, 475), opened: false, phase: rand(0, 6.28) };
    });

    return {
      biome,
      level: opts.level || 1,
      fish,
      treasures,
      player: { x: 105, y: 125, vx: 0, vy: 0, hp: 100, o2: 100, swimPhase: 0, aimAngle: 0 },
      particles: [],
      catches: [],
      elapsed: 0,
      maxDepth: 0,
      shake: 0,
      flash: 0,
      done: false,
      spawnTimer: rand(2.4, 4.5),
      totalSpawned: fishCount,
      notice: { text: 'CLICK TO FIRE HARPOON', type: 'info', time: 2.4 },
      harpoon: {
        cooldown: 0,
        projectile: null,
        hooked: null,
        lastResult: 'ready'
      }
    };
  }

  function updateFish(run, dt, equipment) {
    const p = run.player;
    const projectile = run.harpoon.projectile;
    for (const f of run.fish) {
      if (f.hooked) continue;
      f.phase += dt * (1.5 + (f.speed || 1));
      f.hitFlash = Math.max(0, (f.hitFlash || 0) - dt * 5);
      f.dodge = Math.max(0, (f.dodge || 0) - dt);

      let targetSpeed = .34 + (f.speed || 1) * .38 + rarityRank(f.rarity) * .025;
      const distanceToPlayer = Math.hypot(f.x - p.x, f.y - p.y);
      const skittish = ['flee', 'aggressive', 'boss'].includes(f.temperament) || rarityRank(f.rarity) >= 4;
      if (distanceToPlayer < (skittish ? 145 : 92)) {
        const dx = (f.x - p.x) / (distanceToPlayer || 1);
        const dy = (f.y - p.y) / (distanceToPlayer || 1);
        f.vx += dx * dt * (skittish ? 1.35 : .42);
        f.vy += dy * dt * (skittish ? .72 : .25);
      }

      if (projectile && rarityRank(f.rarity) >= 2) {
        const pd = Math.hypot(f.x - projectile.x, f.y - projectile.y);
        if (pd < 92 && f.dodge <= 0) {
          const dx = (f.x - projectile.x) / (pd || 1);
          const dy = (f.y - projectile.y) / (pd || 1);
          const dodgeStrength = .55 + rarityRank(f.rarity) * .18;
          f.vx += dx * dodgeStrength;
          f.vy += dy * dodgeStrength * .65;
          f.dodge = rand(.25, .6);
        }
      }

      const speed = Math.hypot(f.vx, f.vy);
      if (speed > targetSpeed) {
        const scale = targetSpeed / speed;
        f.vx *= scale;
        f.vy *= scale;
      }

      f.x += f.vx * 72 * dt;
      f.y += f.vy * 58 * dt + Math.sin(f.phase) * (2.2 + (f.size || 1)) * dt;
      if (f.x < 42) { f.x = 42; f.vx = Math.abs(f.vx); }
      if (f.x > 918) { f.x = 918; f.vx = -Math.abs(f.vx); }
      if (f.y < 70) { f.y = 70; f.vy = Math.abs(f.vy); }
      if (f.y > 492) { f.y = 492; f.vy = -Math.abs(f.vy); }

      if (distanceToPlayer < 47 && ['aggressive', 'boss'].includes(f.temperament) && Math.random() < dt * .34) {
        const suit = equipment?.suit || 1;
        p.hp = clamp(p.hp - (4.5 + (f.size || 1) * 2.2) * (1 - (suit - 1) * .055), 0, 100);
        run.shake = 7;
        notice(run, `${f.name.toUpperCase()} STRUCK YOU`, 'danger', 1.2);
      }
    }
  }

  function resolveHarpoonHit(run, fish, equipment, projectile) {
    fish.hitFlash = 1;
    fish.hp -= 1;
    run.shake = 3;
    burst(run, fish.x, fish.y, 10, '#d8fbff', .75);

    if (fish.hp > 0) {
      const awayX = fish.x - run.player.x;
      const awayY = fish.y - run.player.y;
      const len = Math.hypot(awayX, awayY) || 1;
      fish.vx += (awayX / len) * (.7 + rarityRank(fish.rarity) * .11);
      fish.vy += (awayY / len) * .55;
      run.harpoon.projectile = null;
      run.harpoon.cooldown = .42;
      run.harpoon.lastResult = 'resist';
      notice(run, `${fish.name.toUpperCase()} RESISTS · ${fish.hp} HIT${fish.hp === 1 ? '' : 'S'} LEFT`, 'warning', 1.45);
      return;
    }

    if (!canCarry(run, fish, equipment)) {
      fish.hp = Math.max(1, fish.maxHp);
      fish.vx *= -1.45;
      fish.vy += rand(-.5, .5);
      run.harpoon.projectile = null;
      run.harpoon.cooldown = .55;
      run.harpoon.lastResult = 'cargo-full';
      notice(run, `CARGO FULL · ${fish.weight.toFixed(1)}KG NEEDED`, 'danger', 2);
      return;
    }

    fish.hooked = true;
    run.harpoon.projectile = null;
    run.harpoon.hooked = {
      fish,
      startX: fish.x,
      startY: fish.y,
      progress: 0,
      duration: clamp(.62 + (fish.size || 1) * .32 + rarityRank(fish.rarity) * .08 - (equipment?.harpoon || 1) * .035, .55, 1.65)
    };
    run.harpoon.lastResult = 'hooked';
    notice(run, `HOOKED ${fish.name.toUpperCase()} · REELING`, 'success', 1.2);
  }

  function updateHarpoon(run, dt, equipment) {
    const h = run.harpoon;
    h.cooldown = Math.max(0, h.cooldown - dt);

    if (h.projectile) {
      const pr = h.projectile;
      pr.x += pr.dx * pr.speed * dt;
      pr.y += pr.dy * pr.speed * dt;
      pr.travel += pr.speed * dt;

      let hit = null;
      let hitDistance = Infinity;
      for (const f of run.fish) {
        if (f.hooked) continue;
        const d = Math.hypot(f.x - pr.x, f.y - pr.y);
        const radius = 5.5 + (f.size || 1) * 6.8;
        if (d < radius && d < hitDistance) { hit = f; hitDistance = d; }
      }
      if (hit) {
        resolveHarpoonHit(run, hit, equipment, pr);
      } else if (pr.travel >= pr.range || pr.x < 0 || pr.x > 960 || pr.y < 0 || pr.y > 540) {
        burst(run, pr.x, pr.y, 5, '#9feaff', .5);
        h.projectile = null;
        h.cooldown = Math.max(h.cooldown, .36);
        h.lastResult = 'miss';
        notice(run, 'HARPOON MISSED', 'muted', .8);
      }
    }

    if (h.hooked) {
      const hook = h.hooked;
      const fish = hook.fish;
      hook.progress = clamp(hook.progress + dt / hook.duration, 0, 1);
      const eased = 1 - Math.pow(1 - hook.progress, 2.5);
      const wobble = Math.sin(run.elapsed * 22) * (1 - hook.progress) * 8;
      fish.x = hook.startX + (run.player.x - hook.startX) * eased;
      fish.y = hook.startY + (run.player.y - hook.startY) * eased + wobble;

      if (hook.progress >= 1) {
        if (!canCarry(run, fish, equipment)) {
          fish.hooked = false;
          fish.hp = Math.max(1, fish.maxHp);
          fish.x += 45;
          h.hooked = null;
          h.cooldown = .6;
          notice(run, 'CARGO FULL · CATCH RELEASED', 'danger', 1.8);
        } else {
          const stabilizer = equipment?.stabilizer || 1;
          const qualityBonus = stabilizer >= 4 ? 1 : 0;
          const q = clamp(1 + Math.floor(Math.random() * 2) + qualityBonus + (rarityRank(fish.rarity) >= 5 && Math.random() < .28 ? 1 : 0), 1, 4);
          run.catches.push({ id: fish.id, q, kind: 'fish', name: fish.name, rarity: fish.rarity, weight: Number(fish.weight || 1) });
          const index = run.fish.indexOf(fish);
          if (index >= 0) run.fish.splice(index, 1);
          burst(run, run.player.x + 10, run.player.y, 18, fish.color || '#d8fbff', 1);
          run.flash = 1;
          h.hooked = null;
          h.cooldown = .55;
          h.lastResult = 'caught';
          notice(run, `LANDED ${fish.name.toUpperCase()} · ${Number(fish.weight || 0).toFixed(1)}KG · ★${q}`, 'success', 2.15);
        }
      }
    }
  }

  function update(run, dt, input, equipment) {
    if (run.done) return;
    const p = run.player;
    const fins = equipment?.fins || 1;
    const boost = equipment?.boost || 1;
    const tank = equipment?.tank || 1;
    const suit = equipment?.suit || 1;
    const pressure = equipment?.pressure || 1;
    const med = equipment?.medkit || 1;

    let ax = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let ay = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const l = Math.hypot(ax, ay) || 1;
    ax /= l; ay /= l;
    const boosting = input.boost && p.o2 > 7;
    const speed = (102 + fins * 8) * (boosting ? 1.42 + boost * .035 : 1);
    p.vx += (ax * speed - p.vx) * Math.min(1, dt * 5.3);
    p.vy += (ay * speed - p.vy) * Math.min(1, dt * 5.3);
    p.x = clamp(p.x + p.vx * dt, 34, 926);
    p.y = clamp(p.y + p.vy * dt, 45, 505);
    p.swimPhase += dt * (3.7 + Math.hypot(p.vx, p.vy) / 55);

    const depth = Math.round((p.y / 540) * run.biome.max_depth);
    run.maxDepth = Math.max(run.maxDepth, depth);
    let drain = (1.08 + (depth / run.biome.max_depth) * 1.0) * (1 - (tank - 1) * .055) * (1 - (pressure - 1) * .035);
    if (boosting) drain *= 1.86;
    p.o2 = clamp(p.o2 - dt * drain, 0, 100);
    if (p.o2 <= 0) p.hp = clamp(p.hp - dt * (8 - (suit - 1) * .5), 0, 100);
    if (med > 1 && p.hp < 100 && p.o2 > 20) p.hp = clamp(p.hp + dt * (med - 1) * .17, 0, 100);
    if (p.hp <= 0) {
      run.done = true;
      notice(run, 'DIVER INCAPACITATED · EMERGENCY SURFACE', 'danger', 3);
    }

    updateFish(run, dt, equipment);
    updateHarpoon(run, dt, equipment);

    run.spawnTimer -= dt;
    const capReached = cargoWeight(run) >= cargoCap(equipment) - .05;
    if (run.spawnTimer <= 0 && run.fish.length < 20 && run.totalSpawned < 65 && !capReached) {
      run.fish.push(spawnFish(run.biome.id, run.level, equipment?.sonar || 1));
      run.totalSpawned++;
      run.spawnTimer = rand(2.2, 4.4);
    }

    for (const t of run.treasures) t.phase += dt;
    run.elapsed += dt;
    run.shake = Math.max(0, run.shake - dt * 19);
    run.flash = Math.max(0, run.flash - dt * 2.5);
    if (run.notice) run.notice.time = Math.max(0, run.notice.time - dt);
  }

  function harpoon(run, target, equipment) {
    if (!run || !target) return { ok: false, reason: 'no-run' };
    const h = run.harpoon;
    if (h.hooked) {
      notice(run, 'REEL IN THE CURRENT CATCH FIRST', 'warning', .9);
      return { ok: false, reason: 'reeling' };
    }
    if (h.projectile || h.cooldown > 0) return { ok: false, reason: 'cooldown' };

    const p = run.player;
    let dx = target.x - p.x;
    let dy = target.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    p.aimAngle = Math.atan2(dy, dx);

    const level = equipment?.harpoon || 1;
    const range = 165 + level * 22;
    const speed = 560 + level * 26;
    const muzzleX = p.x + Math.cos(p.aimAngle) * 25;
    const muzzleY = p.y + Math.sin(p.aimAngle) * 25;
    h.projectile = { x: muzzleX, y: muzzleY, dx, dy, speed, range, travel: 0, angle: p.aimAngle };
    h.cooldown = .24;
    h.lastResult = 'fired';
    burst(run, muzzleX, muzzleY, 4, '#e5ffff', .35);
    return { ok: true };
  }

  function interact(run, equipment) {
    if (!run) return null;
    const p = run.player;
    let nearest = null;
    let nearestDistance = Infinity;
    for (const t of run.treasures) {
      if (t.opened) continue;
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < nearestDistance) { nearest = t; nearestDistance = d; }
    }
    if (!nearest || nearestDistance >= 68) {
      notice(run, 'NO SALVAGE IN REACH', 'muted', .8);
      return null;
    }
    if (!canCarry(run, nearest, equipment)) {
      notice(run, `CARGO FULL · ${Number(nearest.weight || 0).toFixed(1)}KG NEEDED`, 'danger', 1.8);
      return null;
    }
    nearest.opened = true;
    const q = clamp(1 + Math.floor(Math.random() * 3) + ((equipment?.salvage || 1) > 3 ? 1 : 0), 1, 4);
    run.catches.push({ id: nearest.id, q, kind: 'treasure', name: nearest.name, rarity: nearest.rarity, weight: Number(nearest.weight || 1) });
    run.flash = 1;
    burst(run, nearest.x, nearest.y, 20, '#ffd977', 1);
    notice(run, `SALVAGE RECOVERED · ${nearest.name.toUpperCase()}`, 'success', 1.8);
    return nearest;
  }

  window.RepoDiverEngine = {
    createRun,
    update,
    harpoon,
    interact,
    clamp,
    rand,
    pick,
    cargoCap,
    cargoWeight,
    canCarry
  };
})();
