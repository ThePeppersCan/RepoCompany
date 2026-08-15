(() => {
  'use strict';
  window.__REPO_DIVER_BUILD__='v8-fish-house-phase3-20260815';

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
  let lastRecentCatchSerial = 0;
  let discoveryTimer = 0;
  let restaurantTheme = 'harbour';
  let servicePreviewEvent = null;

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
    return ['DOCKSIDE SHACK','LOCAL FAVOURITE','HARBOUR KITCHEN','COASTAL DINING','SEAFOOD HOUSE','REGIONAL FAVOURITE','FINE DINING','VELMORAN DESTINATION','MASTER FISH HOUSE','LEGENDARY RESTAURANT'][Math.max(0, Math.min(9, (n || 1) - 1))];
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
      return `<article class="rd-fish-card ${x ? 'found' : 'unknown'}" style="--fish:${f.color}"><div class="rd-fish-silhouette">${x ? '◈' : '?'}</div><small>${f.rarity}</small><b>${x ? f.name : 'UNDISCOVERED SPECIES'}</b><span>${D.biome(f.biome).short}</span>${x ? `<footer>CAUGHT ${x.count || 0} · BEST ★${x.best_q || 1}${x.best_weight ? ` · PB ${Number(x.best_weight).toFixed(2)}KG` : ''}</footer>` : '<footer>FIND IT IN THE DEEP</footer>'}</article>`;
    }).join('') + '</div>';
    const rs = profile.stats || {}, rest = profile.restaurant || {};
    j.innerHTML += `<section class="rd-food-journal"><div class="rd-journal-top"><div><small>FISH HOUSE LEDGER</small><h4>RESTAURANT CAREER</h4></div><div class="rd-journal-progress"><i style="width:${Math.min(100, Number(rest.rank || 1) * 10)}%"></i></div></div><div class="rd-food-stats"><article><small>RANK</small><b>${rankName(rest.rank || 1)}</b></article><article><small>REPUTATION</small><b>${Number(rest.reputation_points || rs.restaurant_reputation || 0).toLocaleString()}</b></article><article><small>CUSTOMERS</small><b>${Number(rs.total_customers || 0).toLocaleString()}</b></article><article><small>PERFECT DISHES</small><b>${Number(rs.perfect_dishes || 0).toLocaleString()}</b></article><article><small>LIFETIME REVENUE</small><b>${Number(rs.total_revenue || 0).toLocaleString()} GP</b></article><article><small>RECIPES</small><b>${D.RECIPES.filter(r => r.unlock <= (profile.day_number || 1)).length} / ${D.RECIPES.length}</b></article></div></section>`;
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
    lastRecentCatchSerial = 0;
    show('rdDiveView');
    ensureDiveNotice();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    const diveCanvas=$('rdDiveCanvas');
    if(diveCanvas){ try{ diveCanvas.focus({preventScroll:true}); }catch(_){ diveCanvas.focus(); } }
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

  function rr(x){return Math.round(x)}
  function depthRatio(){ return run ? E.depthBand(run).ratio : 0; }
  function parallax(mult=1){ return {x:(run?.player?.x-480)*mult,y:(run?.player?.y-270)*mult}; }

  function drawLightRays(ctx,w,h,intensity=.10,tint='#e8ffff'){
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=intensity;
    for(let i=0;i<9;i++){
      const drift=Math.sin(run.elapsed*.13+i)*28;
      const x=(i*137+35+drift)% (w+180)-90;
      ctx.fillStyle=tint;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+70,0);ctx.lineTo(x+200,h);ctx.lineTo(x+125,h);ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }

  function drawKelpStalk(ctx,x,baseY,height,width,color,phase){
    ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,baseY);
    const sway=Math.sin(run.elapsed*.8+phase)*13;
    ctx.bezierCurveTo(x-10+sway*.3,baseY-height*.35,x+10+sway*.7,baseY-height*.7,x+sway,baseY-height);ctx.stroke();
    ctx.lineWidth=Math.max(1,width*.45);for(let i=1;i<5;i++){const t=i/5,yy=baseY-height*t,xx=x+sway*t;ctx.beginPath();ctx.moveTo(xx,yy);ctx.quadraticCurveTo(xx+(i%2?18:-18),yy-9,xx+(i%2?24:-24),yy-2);ctx.stroke();}ctx.restore();
  }

  function drawCoralCluster(ctx,x,y,scale,colors){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineCap='round';
    colors.forEach((c,i)=>{ctx.strokeStyle=c;ctx.lineWidth=4+i%2;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo((i-1.5)*10,-18-(i%2)*8,(i-1.5)*14,-34-(i%3)*6);ctx.stroke();ctx.beginPath();ctx.moveTo((i-1.5)*7,-14);ctx.lineTo((i-2)*17,-24);ctx.stroke();});
    ctx.restore();
  }

  function drawShipwreck(ctx,x,y,scale,ghost=false){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=ghost?.42:.9;ctx.fillStyle=ghost?'#101820':'#171d21';ctx.strokeStyle=ghost?'#283642':'#7c6649';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-90,18);ctx.lineTo(74,18);ctx.lineTo(55,45);ctx.lineTo(-70,48);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle=ghost?'#24343d':'#776143';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-18,17);ctx.lineTo(-10,-74);ctx.stroke();ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-10,-68);ctx.lineTo(58,-18);ctx.moveTo(-10,-55);ctx.lineTo(-66,-12);ctx.stroke();
    ctx.restore();
  }

  function drawRuins(ctx,w,h,front=false){
    const p=parallax(front?.16:.05);ctx.save();ctx.translate(-p.x,-p.y*.2);ctx.fillStyle=front?'#101918':'#173037';ctx.globalAlpha=front?.95:.55;
    for(let i=0;i<7;i++){const x=70+i*155;const base=h-42;ctx.fillRect(x,base-rr(110+(i%3)*28),18,rr(110+(i%3)*28));ctx.fillRect(x-12,base-rr(115+(i%3)*28),42,10);if(i%2===0){ctx.beginPath();ctx.arc(x+70,base-80,48,Math.PI,0);ctx.lineWidth=14;ctx.strokeStyle=ctx.fillStyle;ctx.stroke();}}
    ctx.restore();
  }

  function drawEnvironment(ctx,w,h,b){
    const scene=D.sceneForBiome(b.id),dr=depthRatio();
    let top=scene.sky,mid=scene.mid,bottom=scene.floor;
    const gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,top);gradient.addColorStop(.45,mid);gradient.addColorStop(1,bottom);ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    // Depth colour grade turns every zone progressively colder/darker as the player descends.
    ctx.fillStyle=`rgba(0,5,15,${Math.max(0,dr-.2)*.48})`;ctx.fillRect(0,0,w,h);
    if(!['abyssal','shipgrave','morytania'].includes(b.id))drawLightRays(ctx,w,h,.055+Math.max(0,.12-dr*.08));

    const far=parallax(.035),midP=parallax(.08),near=parallax(.16);
    ctx.save();ctx.translate(-far.x,-far.y*.25);ctx.globalAlpha=.45;ctx.fillStyle='#06131a';
    for(let i=0;i<9;i++){const x=(i*151+35)%w;ctx.beginPath();ctx.ellipse(x,h-54,90+(i%3)*24,26+(i%2)*12,0,0,Math.PI*2);ctx.fill();}ctx.restore();

    if(b.id==='karamja'){
      ctx.save();ctx.translate(-midP.x,-midP.y*.15);ctx.fillStyle='#c2a76f';ctx.fillRect(-40,h-74,w+80,100);for(let i=0;i<10;i++)drawCoralCluster(ctx,80+i*105,h-55,.65+(i%3)*.16,['#df715d','#e9b95b','#4db9a6','#8059ac']);ctx.restore();
      ctx.strokeStyle='rgba(228,206,145,.35)';ctx.lineWidth=7;ctx.beginPath();ctx.arc(770-midP.x*.3,h-75,75,Math.PI,Math.PI*2);ctx.stroke();
    }else if(b.id==='fremennik'){
      ctx.fillStyle='rgba(215,242,255,.78)';ctx.beginPath();ctx.moveTo(0,0);for(let x=0;x<=w;x+=70)ctx.lineTo(x,18+(x%140?12:35));ctx.lineTo(w,0);ctx.closePath();ctx.fill();
      ctx.save();ctx.translate(-midP.x,0);ctx.fillStyle='#203443';for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(i*190-40,h-40);ctx.lineTo(i*190+55,h-190-(i%2)*35);ctx.lineTo(i*190+145,h-40);ctx.fill();}drawShipwreck(ctx,720,h-92,.72,true);ctx.restore();
    }else if(b.id==='kelp'){
      ctx.fillStyle='#132d25';ctx.fillRect(0,h-58,w,80);ctx.save();ctx.translate(-midP.x*.5,0);for(let i=0;i<34;i++){const x=(i*41)% (w+80)-40;drawKelpStalk(ctx,x,h-43,100+(i%7)*24,3+(i%3),'rgba(39,112,76,.72)',i*.8);}ctx.restore();
      ctx.save();ctx.translate(-near.x*.7,0);for(let i=0;i<14;i++){drawKelpStalk(ctx,(i*83+30)%w,h-35,145+(i%5)*33,5,'rgba(20,79,52,.94)',i);}ctx.restore();
    }else if(b.id==='morytania'){
      ctx.save();ctx.translate(-far.x,0);ctx.fillStyle='rgba(39,48,42,.68)';for(let i=0;i<6;i++){const x=i*180+20;ctx.fillRect(x,h-210,13,165);ctx.strokeStyle='#27312b';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x+7,h-170);ctx.lineTo(x-35,h-225);ctx.moveTo(x+7,h-145);ctx.lineTo(x+48,h-205);ctx.stroke();}ctx.restore();
      ctx.fillStyle='#17181b';ctx.fillRect(690-midP.x*.2,h-176,150,132);ctx.fillStyle='#090b0d';ctx.beginPath();ctx.arc(765-midP.x*.2,h-44,58,Math.PI,Math.PI*2);ctx.fill();
      for(let i=0;i<6;i++){ctx.fillStyle=`rgba(160,225,179,${.08+(i%3)*.04})`;ctx.beginPath();ctx.arc((i*173+80)%w,120+(i%4)*72,18+(i%2)*10,0,Math.PI*2);ctx.fill();}
    }else if(b.id==='coral'){
      ctx.fillStyle='#262443';ctx.fillRect(0,h-60,w,80);ctx.save();ctx.translate(-midP.x*.6,0);for(let i=0;i<20;i++)drawCoralCluster(ctx,(i*61+30)%w,h-44,.75+(i%4)*.24,['#ff6f9d','#6ce0d1','#f4ce66','#8c78ff']);ctx.restore();
      ctx.globalAlpha=.22;for(let i=0;i<14;i++){ctx.strokeStyle=['#ff8bc2','#77e4ff','#ffe170'][i%3];ctx.lineWidth=3;ctx.beginPath();ctx.arc((i*83+35)%w,160+(i%5)*47,20+(i%4)*5,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
    }else if(b.id==='shipgrave'){
      ctx.save();ctx.translate(-far.x*.8,0);drawShipwreck(ctx,180,h-118,1.05,true);drawShipwreck(ctx,700,h-95,.9,true);ctx.restore();ctx.save();ctx.translate(-midP.x*.5,0);drawShipwreck(ctx,450,h-92,1.05,false);ctx.strokeStyle='#403a31';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(890,-10);ctx.lineTo(790,h);ctx.stroke();for(let i=0;i<10;i++){ctx.beginPath();ctx.arc(860-i*8,40+i*50,8,0,Math.PI*2);ctx.stroke();}ctx.restore();
    }else if(b.id==='abyssal'){
      ctx.fillStyle='#03050d';ctx.fillRect(0,h-60,w,80);ctx.save();ctx.globalAlpha=.22;ctx.fillStyle='#5577a8';ctx.beginPath();ctx.ellipse(790-far.x*.2,260,150,44,-.08,0,Math.PI*2);ctx.fill();ctx.restore();for(let i=0;i<34;i++){ctx.fillStyle=`rgba(${80+i%2*50},${180+i%3*20},220,${.14+i%4*.04})`;ctx.beginPath();ctx.arc((i*107+55)%w,80+(i*59)%390,1.2+(i%3),0,Math.PI*2);ctx.fill();}
    }else if(b.id==='crystal'){
      ctx.fillStyle='#142833';ctx.fillRect(0,h-62,w,90);ctx.save();ctx.translate(-midP.x*.5,0);for(let i=0;i<18;i++){const x=(i*61+20)%w,ht=45+(i%6)*22;ctx.fillStyle=['#5bd8e8','#8f8cff','#a5f1ff'][i%3];ctx.globalAlpha=.45+(i%3)*.12;ctx.beginPath();ctx.moveTo(x,h-45);ctx.lineTo(x+12,h-45-ht);ctx.lineTo(x+28,h-45);ctx.closePath();ctx.fill();}ctx.restore();ctx.globalAlpha=1;drawLightRays(ctx,w,h,.07,'#9ef7ff');
    }else if(b.id==='volcanic'){
      ctx.fillStyle='#17100d';ctx.fillRect(0,h-68,w,100);ctx.strokeStyle='#ff6e32';ctx.shadowColor='#ff5b24';ctx.shadowBlur=12;ctx.lineWidth=3;for(let i=0;i<11;i++){ctx.beginPath();ctx.moveTo(i*95,h);ctx.lineTo(i*95+35,h-34);ctx.lineTo(i*95+70,h-12);ctx.stroke();}ctx.shadowBlur=0;ctx.save();ctx.translate(-midP.x*.4,0);for(let i=0;i<8;i++){const x=i*130+40;ctx.fillStyle='#24201e';ctx.beginPath();ctx.moveTo(x-35,h-50);ctx.lineTo(x,h-130-(i%3)*22);ctx.lineTo(x+38,h-50);ctx.fill();ctx.fillStyle='rgba(255,120,52,.12)';ctx.beginPath();ctx.ellipse(x,h-135-(i%3)*22,28,60,0,0,Math.PI*2);ctx.fill();}ctx.restore();
    }else if(b.id==='ruins'){
      drawRuins(ctx,w,h,false);ctx.fillStyle='#172520';ctx.fillRect(0,h-52,w,80);ctx.save();ctx.translate(-midP.x*.35,0);ctx.fillStyle='#1c302e';ctx.beginPath();ctx.moveTo(365,h-55);ctx.lineTo(480,h-240);ctx.lineTo(595,h-55);ctx.fill();ctx.fillStyle='#0e1717';ctx.fillRect(446,h-142,68,88);ctx.restore();drawRuins(ctx,w,h,true);
    }

    // Fine suspended particles and bubbles.
    for(let i=0;i<46;i++){const yy=(i*83+run.elapsed*(10+i%4))%h,xx=(i*173+Math.sin(i*7)*44)%w;ctx.fillStyle=`rgba(210,250,255,${.07+(i%3)*.035})`;ctx.beginPath();ctx.arc(xx,yy,.7+(i%4)*.34,0,Math.PI*2);ctx.fill();}
  }

  function drawHazards(ctx){
    for(const h of run.hazards||[]){
      const pulse=.7+Math.sin(h.phase*2)*.2;ctx.save();ctx.globalAlpha=.42;
      if(h.type==='current'){ctx.strokeStyle='#a9efff';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(h.x,h.y,h.r*(.35+i*.15),-.8,.9);ctx.stroke();}}
      else if(h.type==='vent'){ctx.fillStyle='#ff7638';ctx.beginPath();ctx.ellipse(h.x,h.y,26,10,0,0,Math.PI*2);ctx.fill();for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(h.x+(i-2)*6,h.y-18-i*7,3+i%2,0,Math.PI*2);ctx.fill();}}
      else if(h.type==='jelly'){ctx.strokeStyle='#ff9fe1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(h.x,h.y,18*pulse,Math.PI,Math.PI*2);ctx.stroke();for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(h.x+i*6,h.y);ctx.quadraticCurveTo(h.x+i*9,h.y+25,h.x+i*5,h.y+43);ctx.stroke();}}
      else if(['coral','shard','debris','rubble'].includes(h.type)){ctx.fillStyle=h.type==='shard'?'#75dbe7':'#4b3e34';ctx.beginPath();ctx.moveTo(h.x-h.r*.5,h.y+h.r*.25);ctx.lineTo(h.x,h.y-h.r*.55);ctx.lineTo(h.x+h.r*.5,h.y+h.r*.25);ctx.closePath();ctx.fill();}
      else if(h.type==='toxic'){ctx.fillStyle='rgba(124,206,112,.18)';ctx.beginPath();ctx.arc(h.x,h.y,h.r*pulse,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    }
  }

  function fishBody(ctx,f){
    const s=f.visualScale||f.size||1,a=f.archetype||'fish';
    if(a==='eel'){
      ctx.strokeStyle=f.color;ctx.lineWidth=7*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-22*s,0);ctx.bezierCurveTo(-8*s,-9*s,6*s,9*s,22*s,0);ctx.stroke();ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(20*s,0,6*s,0,Math.PI*2);ctx.fill();
    }else if(a==='ray'){
      ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(19*s,0);ctx.quadraticCurveTo(2*s,-18*s,-25*s,-5*s);ctx.quadraticCurveTo(-7*s,0,-25*s,7*s);ctx.quadraticCurveTo(4*s,18*s,19*s,0);ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(-20*s,3*s);ctx.lineTo(-42*s,9*s);ctx.stroke();
    }else if(a==='crustacean'){
      ctx.fillStyle=f.color;ctx.beginPath();ctx.ellipse(0,0,13*s,8*s,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=2*s;for(let i=-1;i<=1;i+=2){for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(i*7*s,(j-1)*3*s);ctx.lineTo(i*(18+j*2)*s,(j-1)*7*s);ctx.stroke();}}ctx.beginPath();ctx.moveTo(8*s,-4*s);ctx.lineTo(18*s,-13*s);ctx.moveTo(8*s,4*s);ctx.lineTo(18*s,13*s);ctx.stroke();
    }else if(a==='jelly'){
      ctx.fillStyle=f.color+'cc';ctx.beginPath();ctx.arc(0,0,12*s,Math.PI,Math.PI*2);ctx.lineTo(12*s,2*s);ctx.lineTo(-12*s,2*s);ctx.closePath();ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=1.5*s;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*4*s,2*s);ctx.quadraticCurveTo(i*6*s,12*s,i*3*s,20*s);ctx.stroke();}
    }else if(a==='squid'){
      ctx.fillStyle=f.color;ctx.beginPath();ctx.ellipse(3*s,0,15*s,8*s,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-8*s,0);ctx.lineTo(-24*s,-10*s);ctx.lineTo(-22*s,10*s);ctx.closePath();ctx.fill();ctx.strokeStyle=f.color;ctx.lineWidth=1.7*s;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(17*s,i*2*s);ctx.lineTo(31*s,(i-1)*4*s);ctx.stroke();}
    }else if(a==='seahorse'){
      ctx.strokeStyle=f.color;ctx.lineWidth=6*s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(2*s,-14*s);ctx.quadraticCurveTo(14*s,-4*s,2*s,7*s);ctx.quadraticCurveTo(-6*s,14*s,2*s,18*s);ctx.stroke();ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(2*s,-15*s);ctx.lineTo(13*s,-11*s);ctx.lineTo(4*s,-6*s);ctx.closePath();ctx.fill();
    }else{
      const heavy=a==='heavy'||a==='puffer',pred=a==='predator';ctx.fillStyle=f.color;ctx.beginPath();ctx.ellipse(0,0,(heavy?18:pred?20:15)*s,(heavy?10:pred?7:7)*s,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(-12*s,0);ctx.lineTo(-(pred?30:24)*s,-9*s);ctx.lineTo(-(pred?27:22)*s,9*s);ctx.closePath();ctx.fill();if(pred){ctx.fillStyle='#f4f4e8';ctx.beginPath();ctx.moveTo(12*s,3*s);ctx.lineTo(21*s,0);ctx.lineTo(12*s,-3*s);ctx.closePath();ctx.fill();}
    }
    ctx.fillStyle='#07131a';ctx.beginPath();ctx.arc(8*s,-2*s,1.6*s,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(8.5*s,-2.4*s,.55*s,0,Math.PI*2);ctx.fill();
  }

  function drawFish(ctx,f){
    ctx.save();ctx.translate(f.x,f.y);const facing=f.vx<0?-1:1;ctx.scale(facing,1);if(f.hidden){ctx.globalAlpha=.16;}else if(f.rarity==='legendary'||f.rarity==='mythic'||f.sonarReveal>0){ctx.shadowColor=f.color;ctx.shadowBlur=f.legendary?24:f.rarity==='mythic'?18:9;}if(f.hitFlash>0)ctx.globalAlpha=Math.max(.25,.55+Math.sin(f.hitFlash*30)*.4);fishBody(ctx,f);
    if(f.legendary){ctx.strokeStyle='#ffe48a';ctx.lineWidth=1.5;ctx.globalAlpha=.65+.25*Math.sin(run.elapsed*5);ctx.beginPath();ctx.arc(0,0,32*(f.visualScale||1),0,Math.PI*2);ctx.stroke();}
    if(f.maxHp>1&&!f.hooked){const s=f.visualScale||1,barW=30*s;ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.fillStyle='rgba(0,0,0,.66)';ctx.fillRect(-barW/2,-17*s,barW,3);ctx.fillStyle='#7ff2d0';ctx.fillRect(-barW/2,-17*s,barW*(f.hp/f.maxHp),3);}
    ctx.restore();
  }

  function drawDiver(ctx,p){
    const angle=Math.atan2(mouse.y-p.y,mouse.x-p.x);p.aimAngle=angle;const flip=Math.cos(angle)<0?-1:1,kick=Math.sin(p.swimPhase)*4;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle*.10);ctx.scale(flip,1);
    ctx.fillStyle='#284e5b';ctx.strokeStyle='#8ec8d5';ctx.lineWidth=1.4;ctx.beginPath();ctx.roundRect(-18,-12,11,25,4);ctx.fill();ctx.stroke();ctx.fillStyle='#e6b94e';ctx.fillRect(-15,-15,4,5);
    ctx.strokeStyle='#153847';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-7,8);ctx.lineTo(-19,17+kick);ctx.stroke();ctx.beginPath();ctx.moveTo(-4,9);ctx.lineTo(-13,21-kick);ctx.stroke();ctx.fillStyle='#49b9cf';ctx.beginPath();ctx.moveTo(-20,14+kick);ctx.lineTo(-34,16+kick);ctx.lineTo(-23,22+kick);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(-13,18-kick);ctx.lineTo(-28,23-kick);ctx.lineTo(-16,27-kick);ctx.closePath();ctx.fill();
    const suit=ctx.createLinearGradient(-9,-14,13,13);suit.addColorStop(0,'#122f3e');suit.addColorStop(.55,'#286473');suit.addColorStop(1,'#0d2632');ctx.fillStyle=suit;ctx.strokeStyle='#72d3df';ctx.beginPath();ctx.roundRect(-10,-13,24,26,7);ctx.fill();ctx.stroke();ctx.fillStyle='#e5b94b';ctx.fillRect(-3,-11,3,21);
    ctx.fillStyle='#091c26';ctx.beginPath();ctx.arc(10,-13,11,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#9beef2';ctx.stroke();ctx.fillStyle='#d9a674';ctx.beginPath();ctx.ellipse(13,-13,5.5,6.5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8fe9f6bb';ctx.beginPath();ctx.roundRect(9,-18,10,7,3);ctx.fill();
    ctx.strokeStyle='#235361';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(5,-2);ctx.lineTo(17,2);ctx.moveTo(4,1);ctx.lineTo(16,6);ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.fillStyle='#1a3038';ctx.fillRect(10,-3,29,6);ctx.fillStyle='#d4a647';ctx.fillRect(19,-2,15,3);ctx.fillStyle='#9ff2fa';ctx.fillRect(35,-1.3,10,2.6);ctx.restore();
    if(p.damageFlash>0){ctx.save();ctx.globalAlpha=p.damageFlash*.45;ctx.strokeStyle='#ff6767';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,29+p.damageFlash*8,0,Math.PI*2);ctx.stroke();ctx.restore();}
  }

  function drawHarpoon(ctx){
    if(!run?.harpoon)return;const p=run.player,h=run.harpoon;
    if(h.projectile){ctx.save();ctx.strokeStyle='rgba(215,248,255,.58)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(h.projectile.x,h.projectile.y);ctx.stroke();ctx.translate(h.projectile.x,h.projectile.y);ctx.rotate(h.projectile.angle);ctx.strokeStyle='#ecfbff';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(9,0);ctx.stroke();ctx.fillStyle='#e3b85c';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(3,-4);ctx.lineTo(4,4);ctx.closePath();ctx.fill();ctx.restore();}
    const fish=h.fight?.fish||h.hooked?.fish;if(fish){ctx.save();ctx.strokeStyle=h.fight?(h.fight.tension>.84?'#ff6c63':h.fight.tension<.2?'#77c7ff':'#f2fcff'):'#f2fcff';ctx.lineWidth=h.fight?1.8:1.4;ctx.setLineDash(h.fight?[]:[4,3]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo((p.x+fish.x)/2,(p.y+fish.y)/2+Math.sin(run.elapsed*18)*9,fish.x,fish.y);ctx.stroke();ctx.restore();}
  }

  function drawSonar(ctx){
    if(!run?.sonar?.pulse)return;ctx.save();ctx.strokeStyle='rgba(105,244,255,.8)';ctx.lineWidth=2;ctx.globalAlpha=Math.min(1,run.sonar.pulse);ctx.beginPath();ctx.arc(run.player.x,run.player.y,run.sonar.radius,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(105,244,255,.25)';ctx.beginPath();ctx.arc(run.player.x,run.player.y,Math.max(0,run.sonar.radius-34),0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  function drawAim(ctx){
    const ready=run?.harpoon&&!run.harpoon.projectile&&!run.harpoon.hooked&&!run.harpoon.fight&&run.harpoon.cooldown<=0;ctx.save();ctx.translate(mouse.x,mouse.y);ctx.strokeStyle=ready?'rgba(214,255,248,.82)':'rgba(255,211,115,.55)';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-17,0);ctx.lineTo(-7,0);ctx.moveTo(17,0);ctx.lineTo(7,0);ctx.moveTo(0,-17);ctx.lineTo(0,-7);ctx.moveTo(0,17);ctx.lineTo(0,7);ctx.stroke();ctx.restore();
  }

  function drawVisibilityMask(ctx,w,h){
    const id=run.biome.id,dr=depthRatio();if(!['abyssal','shipgrave','morytania'].includes(id)&&dr<.7)return;const lamp=profile.equipment?.lamp||1;const darkness=(id==='abyssal'?.84:id==='shipgrave'?.45:.38)+Math.max(0,dr-.55)*.22;const radius=105+lamp*35+(run.event.visibility-1)*90;const g=ctx.createRadialGradient(run.player.x,run.player.y,25,run.player.x,run.player.y,radius);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.55,`rgba(0,2,9,${darkness*.35})`);g.addColorStop(1,`rgba(0,2,9,${Math.min(.94,darkness)})`);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  }

  function draw(){
    const canvas=$('rdDiveCanvas'),ctx=canvas?.getContext('2d');if(!ctx||!run)return;const w=canvas.width,h=canvas.height;ctx.save();ctx.translate((Math.random()-.5)*run.shake,(Math.random()-.5)*run.shake);const z=run.camera?.zoom||1;ctx.translate(w/2,h/2);ctx.scale(z,z);ctx.translate(-w/2-(run.camera?.x||0)*.055,-h/2-(run.camera?.y||0)*.035);
    drawEnvironment(ctx,w,h,run.biome);drawHazards(ctx);
    for(const t of run.treasures){if(t.opened)continue;const pulse=1+Math.sin(t.phase*3)*.08;ctx.save();ctx.translate(t.x,t.y);ctx.scale(pulse,pulse);ctx.shadowColor='#ffd96c';ctx.shadowBlur=t.revealed?22:10;ctx.fillStyle='#815521';ctx.fillRect(-14,-9,28,18);ctx.strokeStyle=t.revealed?'#fff09b':'#f5c765';ctx.lineWidth=2;ctx.strokeRect(-14,-9,28,18);ctx.fillStyle='#e8ba4e';ctx.fillRect(-2,-10,4,20);if((profile.equipment?.salvage||1)<(t.required||1)){ctx.fillStyle='#c8d6d8';ctx.font='7px sans-serif';ctx.textAlign='center';ctx.fillText(`RIG ${t.required}`,0,-15);}ctx.restore();}
    for(const f of run.fish)drawFish(ctx,f);for(const p of run.particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color||'#c8ffff';ctx.beginPath();ctx.arc(p.x,p.y,p.size||2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;drawHarpoon(ctx);drawSonar(ctx);drawDiver(ctx,run.player);drawAim(ctx);ctx.restore();drawVisibilityMask(ctx,w,h);
    if(run.flash>0){ctx.fillStyle=`rgba(255,255,255,${run.flash*.10})`;ctx.fillRect(0,0,w,h);}
  }

  function showCatchDiscovery(item){
    const card=$('rdDiscoveryCard');if(!card||!item)return;const fish=D.fishById(item.id);if(!fish)return;run._sessionSeen=run._sessionSeen||{};const prior=profile.fish_journal?.[item.id];const sessionPrior=run._sessionSeen[item.id];const isNew=!prior&&!sessionPrior;const oldBest=Math.max(Number(prior?.best_weight||0),Number(sessionPrior?.best||0));const isRecord=item.weight>oldBest+.005;run._sessionSeen[item.id]={best:Math.max(oldBest,item.weight)};
    const title=isNew?'NEW SPECIES DISCOVERED':isRecord?'NEW PERSONAL RECORD':'CATCH LANDED';card.dataset.rarity=fish.rarity;card.innerHTML=`<small>${title}</small><b>${fish.name}</b><span>${fish.rarity.toUpperCase()} · ${D.biome(fish.biome).short}</span><strong>${Number(item.weight).toFixed(2)} KG · ★${item.q}</strong>`;card.classList.add('show');clearTimeout(discoveryTimer);discoveryTimer=setTimeout(()=>card.classList.remove('show'),isNew?3600:2200);
  }

  function hud(){
    if(!run)return;$('rdO2Fill').style.width=run.player.o2+'%';$('rdHpFill').style.width=run.player.hp+'%';const band=E.depthBand(run),depth=Math.round((run.player.y/540)*run.biome.max_depth);$('rdDepth').textContent=depth+'m';$('rdDepthBand')&&($('rdDepthBand').textContent=band.label);$('rdBiomeName')&&($('rdBiomeName').textContent=run.biome.short);
    const kg=E.cargoWeight(run),cap=E.cargoCap(profile.equipment);$('rdCargo').textContent=kg.toFixed(1)+'/'+cap+'kg';$('rdCargo')?.closest('.rd-hudbox')?.classList.toggle('rd-cargo-full',kg>=cap-.05);$('rdCatchCount').textContent=run.catches.filter(x=>x.kind==='fish').length;
    const sonarMax=Math.max(7,22-(profile.equipment?.sonar||1)*2.2),ready=Math.max(0,1-run.sonar.cooldown/sonarMax);if($('rdSonarFill'))$('rdSonarFill').style.width=(ready*100)+'%';if($('rdSonarLabel'))$('rdSonarLabel').textContent=run.sonar.cooldown>0?Math.ceil(run.sonar.cooldown)+'S':'Q · PING';
    const n=ensureDiveNotice();if(n){const active=run.notice?.time>0;n.textContent=active?run.notice.text:(run.harpoon?.fight?'SPACE · CONTROL LINE TENSION':run.harpoon?.hooked?'REELING CATCH…':run.harpoon?.projectile?'HARPOON IN FLIGHT':'CLICK TO FIRE HARPOON');n.dataset.type=active?run.notice.type:'muted';n.classList.toggle('show',!!n.textContent);}
    const f=$('rdFightPanel');if(f){const fight=run.harpoon?.fight;f.classList.toggle('hidden',!fight);if(fight){$('rdFightName').textContent=fight.fish.name;$('rdTensionFill').style.width=(fight.tension*100)+'%';$('rdTensionFill').dataset.zone=fight.tension>.84?'high':fight.tension<.2?'low':'good';$('rdReelFill').style.width=(fight.progress*100)+'%';}}
    const ev=$('rdEventBanner');if(ev){const data=run.eventBanner,active=data&&data.time>0;ev.classList.toggle('show',!!active);if(active){ev.dataset.type=data.type;ev.querySelector('b').textContent=data.title;ev.querySelector('span').textContent=data.text||'';}}
    if(run.recentCatch?.serial&&run.recentCatch.serial!==lastRecentCatchSerial){lastRecentCatchSerial=run.recentCatch.serial;showCatchDiscovery(run.recentCatch);}
  }

  function menuCapacity() {
    return Math.min(8, 2 + Math.max(1, Number(profile.restaurant?.menu || 1)));
  }

  function crewForTonight() {
    return D.staffForLevel(profile.restaurant?.staff || 1);
  }

  function crewWages() {
    return crewForTonight().reduce((sum, x) => sum + Number(x.wage || 0), 0);
  }

  function serviceEventForTonight() {
    if (servicePreviewEvent) return servicePreviewEvent;
    const fishCount = run?.catches?.filter(x => x.kind === 'fish').length || 0;
    const idx = Math.abs(((profile.day_number || 1) * 7 + fishCount * 3 + (profile.restaurant?.rank || 1))) % D.SERVICE_EVENTS.length;
    servicePreviewEvent = D.SERVICE_EVENTS[idx];
    return servicePreviewEvent;
  }

  function plannedSpecialForTonight(event = serviceEventForTonight()) {
    const day = Number(profile.day_number || 1);
    const repLv = Number(profile.restaurant?.reputation || 1);
    const rank = Number(profile.restaurant?.rank || 1);
    if (event?.id === 'critic' || (repLv >= 2 && day % 5 === 0)) {
      return { type: 'critic', label: 'FISH HOUSE CRITIC', name: 'Velmora Table Review', note: 'Judges food, speed, ambience and plating.' };
    }
    if (rank >= 3 && day % 3 === 0) {
      return { type: 'vip', label: 'VIP RESERVATION', name: 'Coastal Guild Patron', note: 'Wants one of tonight’s premium dishes.' };
    }
    return null;
  }

  function renderSurfaceSetup() {
    const maxMenu = menuCapacity();
    if ($('rdMenuCapacity')) $('rdMenuCapacity').textContent = `${selectedRecipes.length} / ${maxMenu} SLOTS`;
    const crew = crewForTonight();
    const crewBox = $('rdCrewPreview');
    if (crewBox) {
      crewBox.innerHTML = crew.length
        ? crew.map(x => `<article><span class="rd-staff-avatar">${x.name[0]}</span><div><b>${x.name}</b><small>${x.role} · ${x.wage} GP wage</small><em>${x.trait}</em></div></article>`).join('')
        : `<article class="player-run"><span class="rd-staff-avatar">YOU</span><div><b>YOU RUN THE LINE</b><small>No hired crew yet</small><em>Upgrade Kitchen Crew to hire staff.</em></div></article>`;
    }
    const themes = $('rdThemeChoices');
    if (themes) {
      themes.innerHTML = D.RESTAURANT_THEMES.map(x => `<button type="button" data-rd-theme="${x.id}" class="${restaurantTheme === x.id ? 'selected' : ''}"><b>${x.name}</b><small>${x.desc}</small></button>`).join('');
      themes.querySelectorAll?.('[data-rd-theme]')?.forEach?.(b => b.addEventListener('click', async () => {
        restaurantTheme = b.dataset.rdTheme;
        themes.querySelectorAll('[data-rd-theme]').forEach(x => x.classList.toggle('selected', x === b));
        try { await rpc('repo_diver_save_restaurant_theme', { p_theme: restaurantTheme }); profile.restaurant = { ...profile.restaurant, theme: restaurantTheme }; } catch (_) {}
      }));
    }
    const event = serviceEventForTonight();
    const special = plannedSpecialForTonight(event);
    if ($('rdNightBrief')) $('rdNightBrief').innerHTML = `<b>${event.name}</b><span>${event.desc}${special ? ` · ${special.label} EXPECTED` : ''}</span>`;
    const list = $('rdOpeningChecklist');
    if (list) {
      const fish = run?.catches?.filter(x => x.kind === 'fish').length || 0;
      list.innerHTML = `<span class="${fish ? 'ok' : ''}"><b>${fish}</b> menu-grade catches</span><span class="${selectedRecipes.length ? 'ok' : ''}"><b>${selectedRecipes.length}</b> dishes selected</span><span class="ok"><b>${Math.min(8, Math.max(3, Number(profile.restaurant?.tables || 3)))}</b> dining tables</span><span class="ok"><b>${crew.length}</b> hired staff · ${crewWages()} GP wages</span>`;
    }
  }

  function surface() {
    cancelAnimationFrame(raf);
    if (!run) return;
    show('rdSurfaceView');
    servicePreviewEvent = null;
    restaurantTheme = profile.restaurant?.theme || restaurantTheme || 'harbour';
    $('rdSurfaceDepth').textContent = run.maxDepth + 'm';
    $('rdSurfaceNotice').innerHTML = `Expedition recovered <b>${run.catches.filter(x => x.kind === 'fish').length} fish</b> and <b>${run.catches.filter(x => x.kind === 'treasure').length} treasures</b>. Cargo used: <b>${E.cargoWeight(run).toFixed(1)}/${E.cargoCap(profile.equipment)}kg</b>.`;

    $('rdCatchList').innerHTML = run.catches.length ? run.catches.map(x => `<div class="rd-catch-row ${x.legendary ? 'legendary' : ''}"><span>${x.kind === 'treasure' ? '◆' : x.legendary ? '★' : '◈'} ${x.name}</span><small>${x.rarity} · ${Number(x.weight || 0).toFixed(2)}kg · ★${x.q}</small></div>`).join('') : '<p>No catches made. The sea wins this one.</p>';

    selectedRecipes = [];
    const rec = D.recipesForCatches(run.catches, profile.day_number);
    const fishCounts = {};
    for (const x of run.catches.filter(x => x.kind === 'fish')) fishCounts[x.id] = (fishCounts[x.id] || 0) + 1;
    const maxMenu = menuCapacity();
    $('rdRecipeChoices').innerHTML = rec.map(r => `<button data-recipe="${r.id}" data-category="${r.category || 'seared'}"><span class="rd-recipe-meta">${String(r.category || 'house').toUpperCase()} · COMPLEXITY ${r.complexity || r.tier || 1}</span><b>${r.name}</b><small>${r.base_price.toLocaleString()} GP base · ${fishCounts[r.fish_id] || 0} portions · ${String(r.appeal || 'local').toUpperCase()} APPEAL</small></button>`).join('') || '<p>Catch a menu-grade fish to open tonight.</p>';
    document.querySelectorAll('[data-recipe]').forEach(b => b.onclick = () => {
      const id = b.dataset.recipe;
      if (b.classList.contains('selected')) {
        b.classList.remove('selected');
        selectedRecipes = selectedRecipes.filter(x => x !== id);
      } else {
        if (selectedRecipes.length >= maxMenu) {
          $('rdSurfaceNotice').innerHTML = `Menu capacity is <b>${maxMenu}</b> dishes. Upgrade the Menu Board for a larger evening menu.`;
          return;
        }
        b.classList.add('selected');
        selectedRecipes.push(id);
      }
      $('rdOpenRestaurant').disabled = !selectedRecipes.length;
      renderSurfaceSetup();
    });
    $('rdOpenRestaurant').disabled = true;
    renderSurfaceSetup();
  }

  function restaurantReadyCapacity() {
    const crewBonus = crewForTonight().some(x => x.role === 'Dishwasher') ? 1 : 0;
    return Math.min(8, 2 + Math.floor((profile.restaurant?.kitchen || 1) / 2) + Math.floor((profile.restaurant?.staff || 1) / 2) + crewBonus);
  }

  function buildRestaurantStock() {
    const fishById = {};
    for (const item of run.catches.filter(x => x.kind === 'fish')) {
      (fishById[item.id] ||= []).push({ q: Number(item.q || 1), weight: Number(item.weight || 0) });
    }
    const stock = {}, quality = {};
    for (const id of selectedRecipes) {
      const recipe = D.RECIPES.find(r => r.id === id);
      if (!recipe) continue;
      const items = [...(fishById[recipe.fish_id] || [])].sort((a, b) => b.q - a.q);
      stock[id] = items.length;
      quality[id] = items;
    }
    return { stock, quality };
  }

  function ensureRestaurantLayout() {
    const view = $('rdRestaurantView');
    const grid = view?.querySelector('.rd-rest-grid');
    const scene = view?.querySelector('.rd-rest-scene');
    if (!view || !grid || !scene) return false;
    void view.offsetHeight;
    scene.style.minHeight = Math.max(590, grid.clientHeight || 590) + 'px';
    return true;
  }

  function applyRestaurantVisualLevels() {
    const scene = $('rdRestaurantScene');
    if (!scene) return;
    restaurantTheme = profile.restaurant?.theme || restaurantTheme || 'harbour';
    scene.dataset.theme = restaurantTheme;
    const kitchen = Number(profile.restaurant?.kitchen || 1);
    const tables = Math.min(8, Math.max(3, Number(profile.restaurant?.tables || 3)));
    const ambience = Number(profile.restaurant?.ambience || 1);
    scene.dataset.kitchenTier = kitchen >= 6 ? 'grand' : kitchen >= 3 ? 'pro' : 'basic';
    scene.dataset.ambienceTier = ambience >= 5 ? 'luxury' : ambience >= 3 ? 'refined' : 'simple';
    scene.querySelectorAll?.('.rd-table')?.forEach?.((t, i) => t.classList.toggle('hidden-table', i >= tables));
  }

  function chooseArchetype(special = null) {
    if (special === 'critic') return { id:'foodie', name:'Food Critic', budget:1.4, patience:.82, pref:['luxury','raw','grilled'], tone:'#d6b56d', tip:1.1 };
    if (special === 'vip') return { id:'wealthy', name:'VIP Guest', budget:1.5, patience:.9, pref:['luxury','raw','grilled'], tone:'#f0c873', tip:1.2 };
    let pool = [...D.CUSTOMER_ARCHETYPES];
    if (service?.event?.id === 'storm') pool = pool.filter(x => ['local','fisher','foodie','adventurer'].includes(x.id));
    if (service?.event?.id === 'market') pool = pool.filter(x => ['foodie','collector','wealthy','adventurer'].includes(x.id));
    return E.pick(pool.length ? pool : D.CUSTOMER_ARCHETYPES);
  }

  function chooseRecipeForCustomer(archetype, special = null) {
    const available = selectedRecipes.filter(id => recipeSpare(id) > 0);
    if (!available.length) return null;
    const ranked = available.map(id => {
      const r = D.RECIPES.find(x => x.id === id);
      let score = Math.random() * 1.3;
      if (archetype?.pref?.includes(r?.category)) score += 2;
      if (special && (r?.tier || 1) >= 2) score += 2.5;
      if (archetype?.budget >= 1.2 && (r?.tier || 1) >= 3) score += 1.4;
      if (archetype?.budget < .9 && (r?.tier || 1) === 1) score += 1.2;
      return { id, score };
    }).sort((a,b)=>b.score-a.score);
    return ranked[0]?.id || E.pick(available);
  }

  function renderReservations() {
    const box = $('rdReservations');
    if (!box || !service) return;
    const special = service.specialPlan;
    box.innerHTML = `<div class="rd-service-event-card"><small>TONIGHT</small><b>${service.event.name}</b><span>${service.event.desc}</span></div>` +
      (special ? `<div class="rd-reservation-card ${special.type}"><small>${special.label}</small><b>${special.name}</b><span>${special.note}</span></div>` : `<div class="rd-reservation-card"><small>RESERVATIONS</small><b>WALK-INS TONIGHT</b><span>No special booking on the ledger.</span></div>`);
  }

  function renderCrewLive() {
    if (!service) return;
    const crew = service.crew || [];
    const live = $('rdCrewLive');
    if (live) live.innerHTML = `<article><b>YOU</b><span>Chef / Owner</span><small>Manual station</small></article>` + crew.map(x => `<article><b>${x.name}</b><span>${x.role}</span><small>${x.trait}</small></article>`).join('');
  }

  function renderStaffScene(force=false) {
    const scene = $('rdStaffScene');
    if (!scene || !service) return;
    const busy = service.cook ? service.cook.stage : 0;
    const entering = service.customers.some(c => c.stage === 'entering');
    const ready = service.ready.length > 0;
    const sig = `${busy}:${entering?1:0}:${ready?1:0}:${service.crew.map(x=>x.id).join(',')}`;
    if (!force && service._staffSig === sig) return;
    service._staffSig = sig;
    const positions = {
      'Head Chef':[42,22], 'Prep Chef':[55,24], 'Server':[64,58], 'Host':[9,60],
      'Grill Chef':[69,23], 'Dishwasher':[82,27]
    };
    const statusFor = role => {
      if (role === 'Host') return entering ? 'SEATING GUESTS' : 'WATCHING THE DOOR';
      if (role === 'Server') return ready ? 'RUNNING PLATES' : 'CHECKING TABLES';
      if (role === 'Head Chef' || role === 'Prep Chef' || role === 'Grill Chef') return busy ? 'ON THE LINE' : 'MISE EN PLACE';
      return 'CLEARING DOWN';
    };
    scene.innerHTML = `<div class="rd-staff-actor player-chef" style="left:34%;top:24%"><i></i><b>YOU</b><span>${busy ? 'COOKING' : 'CHEF / OWNER'}</span></div>` +
      service.crew.map(x => {
        const pos=positions[x.role]||[50,30];
        return `<div class="rd-staff-actor role-${x.role.toLowerCase().replace(/\s+/g,'-')}" style="left:${pos[0]}%;top:${pos[1]}%"><i></i><b>${x.name}</b><span>${statusFor(x.role)}</span></div>`;
      }).join('');
  }

  function startRestaurant() {
    if (!selectedRecipes.length) return;
    cancelAnimationFrame(serviceRaf);
    show('rdRestaurantView');
    ensureRestaurantLayout();
    requestAnimationFrame(ensureRestaurantLayout);
    const event = serviceEventForTonight();
    const duration = 104 + (profile.restaurant?.service || 1) * 4;
    const built = buildRestaurantStock();
    service = {
      totalDuration: duration,
      time: duration,
      phase: 'OPENING',
      served: 0,
      revenue: 0,
      lost: 0,
      customers: [],
      ready: [],
      servedDishes: [],
      stock: built.stock,
      ingredientQuality: built.quality,
      active: true,
      closing: false,
      finishStarted: false,
      last: performance.now(),
      spawn: .8,
      nextCustomer: 1,
      cook: null,
      crew: crewForTonight(),
      wages: crewWages(),
      event,
      specialPlan: plannedSpecialForTonight(event),
      specialSpawned: false,
      specialServed: null,
      flow: 1,
      streak: 0,
      lastServeAt: 0,
      soldOutReleased: 0
    };
    restaurantRenderSig = { orders: '', scene: '' };
    $('rdCookPanel')?.classList.add('hidden');
    applyRestaurantVisualLevels();
    renderReservations();
    renderCrewLive();
    renderRestaurantMenu();
    renderReadyCounter();
    renderRestaurantScene(true);
    renderStaffScene(true);
    renderOrders(true);
    if ($('rdEventChip')) $('rdEventChip').textContent = event.name;
    if ($('rdPhaseBanner')) $('rdPhaseBanner').textContent = 'OPENING';
    $('rdServiceToast').textContent = 'THE FISH HOUSE IS OPEN · FIRST GUESTS ARE ARRIVING';
    serviceRaf = requestAnimationFrame(serviceLoop);
  }

  function renderRestaurantMenu() {
    if (!service) return;
    $('rdRestaurantMenu').innerHTML = selectedRecipes.map(id => {
      const r = D.RECIPES.find(x => x.id === id);
      const stock = service.stock[id] || 0;
      const disabled = stock <= 0 || !!service.cook || service.ready.length >= restaurantReadyCapacity();
      return `<button data-cook="${id}" ${disabled ? 'disabled' : ''}><span class="rd-recipe-meta">${String(r?.category || 'HOUSE').toUpperCase()}</span><b>${r?.name || id}</b><small>${r?.base_price?.toLocaleString?.() || 0} GP base · STOCK ${stock}</small><em>${disabled && stock <= 0 ? 'SOLD OUT' : 'PREP DISH'}</em></button>`;
    }).join('');
    document.querySelectorAll('[data-cook]').forEach(b => b.onclick = () => startCook(b.dataset.cook, null));
  }

  function renderReadyCounter() {
    const box = $('rdReadyCounter');
    if (!box || !service) return;
    if (!service.ready.length) {
      box.innerHTML = `<span class="rd-ready-empty">Pass clear · counter ${service.ready.length}/${restaurantReadyCapacity()}</span>`;
      return;
    }
    box.innerHTML = `<div class="rd-ready-list">${service.ready.map((dish, i) => {
      const r = D.RECIPES.find(x => x.id === dish.id);
      return `<span class="rd-ready-chip" data-ready-index="${i}" data-style="${r?.category || 'house'}"><b>${r?.name || dish.id}</b><small>★${dish.quality} · INGREDIENT ★${dish.ingredientQ || 1}${dish.targetCustomerId ? ' · RESERVED' : ''}</small></span>`;
    }).join('')}</div><small class="rd-ready-cap">PASS ${service.ready.length}/${restaurantReadyCapacity()}</small>`;
  }

  function readyDishIndexForCustomer(customer) {
    if (!service || !customer || !['entering','waiting'].includes(customer.stage)) return -1;
    let idx = service.ready.findIndex(d => d.id === customer.id && d.targetCustomerId === customer.uid);
    if (idx >= 0) return idx;
    return service.ready.findIndex(d => d.id === customer.id && !d.targetCustomerId);
  }

  function recipeSupply(id) {
    if (!service) return 0;
    return Math.max(0, service.stock[id] || 0)
      + service.ready.filter(d => d.id === id).length
      + (service.cook?.id === id ? 1 : 0);
  }

  function recipeDemand(id) {
    if (!service) return 0;
    return service.customers.filter(c => c.id === id && ['entering','waiting'].includes(c.stage)).length;
  }

  function recipeSpare(id) { return recipeSupply(id) - recipeDemand(id); }
  function hasMealPotential() { return !!service && selectedRecipes.some(id => recipeSupply(id) > 0); }

  function releaseCustomerReservation(uid) {
    if (!service) return;
    if (service.cook?.targetCustomerId === uid) service.cook.targetCustomerId = null;
    for (const dish of service.ready) if (dish.targetCustomerId === uid) dish.targetCustomerId = null;
  }

  function findUncommittedCustomerForRecipe(id) {
    if (!service) return null;
    const candidates = service.customers.filter(c => c.id === id && ['entering','waiting'].includes(c.stage)).sort((a, b) => b.uid - a.uid);
    return candidates.find(c => {
      const reservedReady = service.ready.some(d => d.id === id && d.targetCustomerId === c.uid);
      const targetedCook = service.cook?.id === id && service.cook?.targetCustomerId === c.uid;
      return !reservedReady && !targetedCook;
    }) || candidates[0] || null;
  }

  function reconcileImpossibleOrders() {
    if (!service?.active) return false;
    let changed = false;
    const activeIds = new Set(service.customers.filter(c => ['entering','waiting'].includes(c.stage)).map(c => c.uid));
    if (service.cook?.targetCustomerId && !activeIds.has(service.cook.targetCustomerId)) {
      service.cook.targetCustomerId = null; changed = true;
    }
    for (const dish of service.ready) {
      if (dish.targetCustomerId && !activeIds.has(dish.targetCustomerId)) { dish.targetCustomerId = null; changed = true; }
    }
    let guard=0;
    while (guard++ < 40) {
      const oversoldId = selectedRecipes.find(id => recipeDemand(id) > recipeSupply(id));
      if (!oversoldId) break;
      const customer = findUncommittedCustomerForRecipe(oversoldId);
      if (!customer) break;
      const substitutes = selectedRecipes.filter(id => id !== oversoldId && recipeSpare(id) > 0);
      if (substitutes.length) {
        const nextId = substitutes.sort((a,b)=>recipeSpare(b)-recipeSpare(a))[0];
        customer.id = nextId;
        customer.patience = Math.max(customer.patience,72);
        $('rdServiceToast').textContent = `TABLE ${customer.table + 1} SWITCHED TO THE CHEF'S AVAILABLE SPECIAL`;
        changed = true;
      } else {
        releaseCustomerReservation(customer.uid);
        customer.stage = 'leaving';
        customer.stageTime = .8;
        service.soldOutReleased++;
        $('rdServiceToast').textContent = `TABLE ${customer.table + 1} RELEASED · KITCHEN SOLD OUT`;
        changed = true;
      }
    }
    if (changed) {
      renderReadyCounter(); renderRestaurantMenu(); renderOrders(true); renderRestaurantScene(true); renderStaffScene(true);
    }
    return changed;
  }

  function unresolvedCustomers() {
    return service?.customers?.some(c => ['entering','waiting','eating'].includes(c.stage)) || false;
  }

  function endServiceEarly(reason='KITCHEN SOLD OUT · SERVICE COMPLETE') {
    if (!service?.active || service.closing) return false;
    service.closing=true; service.active=false; service.time=0; service.cook=null;
    cancelAnimationFrame(serviceRaf);
    $('rdCookPanel')?.classList.add('hidden');
    $('rdServiceToast').textContent=reason;
    finishDay();
    return true;
  }

  function maybeCloseSoldOutService() {
    if (!service?.active || service.closing) return false;
    if (!hasMealPotential() && !unresolvedCustomers()) {
      return endServiceEarly(service.served > 0 ? 'LAST TABLE HAS LEFT · KITCHEN SOLD OUT · CLOSING' : 'NO SALEABLE FOOD REMAINS · CLOSING EARLY');
    }
    return false;
  }

  function dinerPosition(c) {
    const positions=[[20,49],[42,47],[66,48],[84,50],[22,73],[44,75],[66,74],[84,72]];
    if (c.stage==='entering') return [5,82];
    if (c.stage==='leaving') return [96,84];
    return positions[c.table % positions.length];
  }

  function renderRestaurantScene(force=false) {
    const scene=$('rdCustomerScene');
    if (!scene || !service) return;
    const signature=service.customers.map(c=>`${c.uid}:${c.id}:${c.table}:${c.stage}:${c.reaction||''}:${readyDishIndexForCustomer(c)>=0?1:0}`).join('|');
    if (!force && restaurantRenderSig.scene===signature) return;
    restaurantRenderSig.scene=signature;
    scene.innerHTML=service.customers.map(c=>{
      const pos=dinerPosition(c),recipe=D.RECIPES.find(r=>r.id===c.id),ready=readyDishIndexForCustomer(c)>=0;
      const archetype=c.archetype||D.customerById('tourist');
      const bubble=c.stage==='entering'?'CHECKING IN':c.stage==='eating'?(c.reaction||'ENJOYING MEAL'):c.stage==='leaving'?'GOOD NIGHT':ready?'✓ SERVE TABLE':recipe?.name.split(' ').slice(0,2).join(' ')||'ORDER';
      return `<button type="button" class="rd-diner stage-${c.stage} ${ready?'has-ready':''} ${c.special||''}" data-scene-customer-id="${c.uid}" style="left:${pos[0]}%;top:${pos[1]}%;--diner-tone:${archetype.tone||'#75c7d8'}" ${['eating','leaving'].includes(c.stage)?'disabled':''}><i class="rd-diner-head"></i><i class="rd-diner-body"></i><i class="rd-diner-arm a"></i><i class="rd-diner-arm b"></i><span class="rd-party-size">${c.party>1?'×'+c.party:''}</span><span class="rd-diner-bubble">${c.special?String(c.special).toUpperCase()+' · ':''}${bubble}</span></button>`;
    }).join('');
    scene.onclick=e=>{
      const target=e.target.closest?.('[data-scene-customer-id]');
      if(!target)return;e.preventDefault();handleOrderClick(Number(target.dataset.sceneCustomerId));
    };
  }

  function updateOrderPatienceBars() {
    const orders=$('rdOrders');if(!orders||!service)return;
    for(const c of service.customers.filter(x=>x.stage==='waiting')){
      const bar=orders.querySelector?.(`[data-patience-for="${c.uid}"]`);
      if(bar)bar.style.width=`${Math.max(0,Math.min(100,c.patience))}%`;
    }
  }

  function renderOrders(force=false) {
    if(!service)return;const orders=$('rdOrders');if(!orders)return;
    const visible=service.customers.filter(c=>['entering','waiting'].includes(c.stage));
    const signature=visible.map(c=>{const ready=readyDishIndexForCustomer(c)>=0,cooking=service.cook?.targetCustomerId===c.uid;return`${c.uid}:${c.id}:${c.table}:${c.stage}:${ready?1:0}:${cooking?1:0}`}).join('|');
    if(!force&&restaurantRenderSig.orders===signature){updateOrderPatienceBars();return}
    restaurantRenderSig.orders=signature;
    if(!visible.length)orders.innerHTML='<p class="rd-orders-empty">The pass is clear. Waiting for the next table.</p>';
    else orders.innerHTML=visible.map(c=>{
      const r=D.RECIPES.find(x=>x.id===c.id),ready=readyDishIndexForCustomer(c)>=0,cooking=service.cook?.targetCustomerId===c.uid;
      const action=c.stage==='entering'?'SEATING…':ready?'SERVE TABLE':cooking?'COOKING…':'COOK ORDER';
      const sub=c.stage==='entering'?`${c.archetype?.name||'Guest'} party of ${c.party}`:ready?'Dish plated — click this ticket or the table':cooking?'Finish the prep, cook and plating stages':`${c.archetype?.name||'Guest'} · party of ${c.party}`;
      return `<button type="button" class="rd-order ${ready?'ready':''} ${cooking?'cooking':''} ${c.special||''}" data-order-id="${c.uid}" ${c.stage==='entering'?'disabled':''}><span class="rd-order-top"><b>TABLE ${c.table+1}${c.special?' · '+String(c.special).toUpperCase():''}</b><strong>${action}</strong></span><span class="rd-order-name">${r?.name||c.id}</span><small>${sub}</small><i data-patience-for="${c.uid}" style="width:${Math.max(0,c.patience)}%"></i></button>`;
    }).join('');
    orders.onclick=e=>{const btn=e.target.closest?.('[data-order-id]');if(!btn||btn.disabled)return;e.preventDefault();handleOrderClick(Number(btn.dataset.orderId));};
    updateOrderPatienceBars();
  }

  function handleOrderClick(uid) {
    if(!service?.active)return;const customer=service.customers.find(c=>c.uid===uid);
    if(!customer||customer.stage!=='waiting')return;
    const readyIndex=readyDishIndexForCustomer(customer);
    if(readyIndex>=0){serveCustomer(uid,readyIndex);return}
    if(service.cook){$('rdServiceToast').textContent=service.cook.targetCustomerId===uid?'FINISH THIS DISH · COMPLETE THE TIMING STAGES':'ONE STATION AT A TIME · FINISH THE CURRENT DISH';return}
    startCook(customer.id,uid);
  }

  function startCook(id,targetCustomerId=null) {
    if(!service?.active||service.cook)return;
    if((service.stock[id]||0)<=0){$('rdServiceToast').textContent='DISH SOLD OUT · CHECKING THE MENU';reconcileImpossibleOrders();maybeCloseSoldOutService();return}
    if(service.ready.length>=restaurantReadyCapacity()){$('rdServiceToast').textContent='PASS FULL · RUN A PLATE BEFORE COOKING MORE';return}
    const r=D.RECIPES.find(x=>x.id===id);if(!r)return;
    service.stock[id]--;
    const ingredient=(service.ingredientQuality[id]||[]).shift()||{q:1,weight:0};
    const kitchen=Number(profile.restaurant?.kitchen||1);
    const prepChef=service.crew.some(x=>x.role==='Prep Chef');
    const headChef=service.crew.some(x=>x.role==='Head Chef');
    const sweetWidth=Math.min(.34,.14+kitchen*.018+(headChef ? .015 : 0));
    service.cook={id,targetCustomerId,stage:1,stages:(r.complexity||r.tier||1)>=2?3:2,scores:[],needle:Math.random()*.18,dir:1,speed:(prepChef?1.04:1.16)+Math.random()*.20,sweetCenter:.34+Math.random()*.32,sweetWidth,ingredientQ:Number(ingredient.q||1)};
    $('rdCookPanel')?.classList.remove('hidden');updateCookPanel();renderRestaurantMenu();renderOrders(true);renderRestaurantScene(true);renderStaffScene(true);
    $('rdServiceToast').textContent=`${r.name.toUpperCase()} · PREP STARTED`;
  }

  function updateCookPanel() {
    if(!service?.cook)return;const c=service.cook,r=D.RECIPES.find(x=>x.id===c.id);
    const labels=c.stages===3?['PREP · KNIFE WORK','COOK · HEAT CONTROL','PLATING · FINISH THE DISH']:['PREP · KNIFE WORK','COOK · HEAT CONTROL'];
    $('rdCookStage').textContent=`${labels[c.stage-1]} · STAGE ${c.stage}/${c.stages}`;
    $('rdCookDish').textContent=r?.name||'Dish';
    $('rdCookInstruction').textContent=c.stage===1?'Stop the marker inside the prep window.':c.stage===c.stages&&c.stages===3?'Finish the plate cleanly — presentation affects the final rating.':r?.category==='raw'?'Slice and cure at the right moment.':'Control the pan and stop inside the green window.';
    const sweet=$('rdCookSweet');if(sweet){sweet.style.left=((c.sweetCenter-c.sweetWidth/2)*100)+'%';sweet.style.width=(c.sweetWidth*100)+'%'}
    if($('rdCookNeedle'))$('rdCookNeedle').style.left=(c.needle*100)+'%';
    $('rdCookPanel')?.classList.toggle('plating-stage',c.stage===c.stages&&c.stages===3);
  }

  function hitCook() {
    if(!service?.cook)return;const c=service.cook,r=D.RECIPES.find(x=>x.id===c.id);
    const half=c.sweetWidth/2,dist=Math.abs(c.needle-c.sweetCenter),normalized=Math.max(0,1-dist/Math.max(.001,half*2.2));c.scores.push(normalized);
    if(c.stage<c.stages){
      c.stage++;c.needle=Math.random()<.5?.05:.95;c.dir=c.needle<.5?1:-1;c.speed+=c.stage===c.stages&&c.stages===3?.10:.16;c.sweetCenter=.28+Math.random()*.44;
      if(c.stage===c.stages&&c.stages===3)c.sweetWidth=Math.min(.36,c.sweetWidth+(profile.restaurant?.plating||1)*.012);
      updateCookPanel();$('rdServiceToast').textContent=normalized>.72?(c.stage===c.stages&&c.stages===3?'CLEAN COOK · PLATE IT':'CLEAN STAGE · KEEP THE FLOW'):'ROUGH STAGE · RECOVER THE DISH';return;
    }
    const plating=Number(profile.restaurant?.plating||1);
    const grillBonus=(r?.category==='grilled'&&service.crew.some(x=>x.role==='Grill Chef')) ? .055 : 0;
    const chefBonus=service.crew.some(x=>x.role==='Head Chef')?.025:0;
    const average=c.scores.reduce((a,b)=>a+b,0)/c.scores.length+Math.min(.10,(plating-1)*.018)+grillBonus+chefBonus+(c.ingredientQ-1)*.015;
    let quality=average>=.82?4:average>=.61?3:average>=.36?2:1;
    const ingredientCap=c.ingredientQ<=1?2:c.ingredientQ===2?3:4;quality=Math.min(quality,ingredientCap);
    service.ready.push({id:c.id,quality,targetCustomerId:c.targetCustomerId,ingredientQ:c.ingredientQ});
    $('rdServiceToast').textContent=`${r?.name?.toUpperCase()||'DISH'} · ${quality===4?'EXCEPTIONAL PLATE':quality===3?'GREAT PLATE':'QUALITY ★'+quality} · RUN IT TO THE TABLE`;
    service.cook=null;$('rdCookPanel')?.classList.add('hidden');$('rdCookPanel')?.classList.remove('plating-stage');
    renderReadyCounter();renderRestaurantMenu();renderOrders(true);renderRestaurantScene(true);renderStaffScene(true);
  }

  function reactionForQuality(q,special) {
    if(special==='critic')return q>=4?'CRITIC: EXCELLENT':q>=3?'CRITIC: IMPRESSED':q>=2?'CRITIC: FAIR':'CRITIC: DISAPPOINTED';
    if(q>=4)return 'AMAZING! ✦';if(q>=3)return 'LOVELY!';if(q>=2)return 'GOOD';return 'NOT BAD';
  }

  function serveCustomer(uid,readyIndex) {
    if(!service?.active)return false;const customer=service.customers.find(c=>c.uid===uid);
    if(!customer||customer.stage!=='waiting'||readyIndex<0||readyIndex>=service.ready.length)return false;
    const candidate=service.ready[readyIndex];if(!candidate||candidate.id!==customer.id||(candidate.targetCustomerId&&candidate.targetCustomerId!==uid)){$('rdServiceToast').textContent='WRONG DISH FOR THIS TABLE';return false}
    const dish=service.ready.splice(readyIndex,1)[0],r=D.RECIPES.find(x=>x.id===dish.id);if(!r){service.ready.splice(readyIndex,0,dish);return false}
    const patienceFactor=.82+Math.max(0,customer.patience)/100*.24;
    const ambience=1+Number(profile.restaurant?.ambience||1)*.018;
    const earned=Math.round(r.base_price*(.72+dish.quality*.13)*patienceFactor*ambience*Number(customer.archetype?.tip||1));
    const now=performance.now();if(now-service.lastServeAt<8000)service.streak=Math.min(5,service.streak+1);else service.streak=1;service.lastServeAt=now;service.flow=1+Math.min(1,service.streak*.18);
    service.served++;service.revenue+=earned;service.servedDishes.push({id:dish.id,quality:dish.quality,ingredient_q:dish.ingredientQ||1,special:customer.special||null});
    customer.stage='eating';customer.stageTime=1.9+customer.party*.28;customer.reaction=reactionForQuality(dish.quality,customer.special);customer.servedQuality=dish.quality;
    if(customer.special){service.specialServed={type:customer.special,quality:dish.quality,patience:customer.patience};showSpecialNotice(customer.special==='critic'?`CRITIC SERVED · ${customer.reaction}`:`VIP TABLE SERVED · ${customer.reaction}`)}
    $('rdServiceToast').textContent=`TABLE ${customer.table+1} SERVED · ★${dish.quality} · ${customer.reaction}`;
    renderReadyCounter();renderRestaurantMenu();renderOrders(true);renderRestaurantScene(true);renderStaffScene(true);
    if($('rdServiceFlow'))$('rdServiceFlow').textContent='×'+service.flow.toFixed(1);
    return true;
  }

  function showSpecialNotice(text) {
    const el=$('rdSpecialNotice');if(!el)return;el.textContent=text;el.classList.remove('hidden');clearTimeout(service?._specialTimer);if(service)service._specialTimer=setTimeout(()=>el.classList.add('hidden'),2600);
  }

  function spawnCustomer(forceSpecial=false) {
    if(!service?.active||service.phase==='LAST ORDERS')return false;
    const seats=Math.min(8,Math.max(3,Number(profile.restaurant?.tables||3)));
    const usedTables=new Set(service.customers.filter(c=>c.stage!=='leaving').map(c=>c.table));
    const free=Array.from({length:seats},(_,i)=>i).filter(i=>!usedTables.has(i));if(!free.length)return false;
    let special=null;
    if(forceSpecial&&service.specialPlan&&!service.specialSpawned){special=service.specialPlan.type;service.specialSpawned=true}
    const archetype=chooseArchetype(special),id=chooseRecipeForCustomer(archetype,special);if(!id){maybeCloseSoldOutService();return false}
    const party=special?1:(archetype.id==='family'?Math.min(4,2+Math.floor(Math.random()*3)):1+Math.floor(Math.random()*Math.min(3,1+Number(profile.restaurant?.rank||1)/3)));
    const hostBonus=service.crew.some(x=>x.role==='Host')?10:0;
    const patience=Math.min(125,100*Number(archetype.patience||1)*Number(service.event.patience||1)+hostBonus);
    const customer={uid:service.nextCustomer++,id,table:E.pick(free),patience,stage:'entering',stageTime:.9+Math.random()*.45,archetype,party,special,reaction:''};
    service.customers.push(customer);service.spawn=(4.4+Math.random()*3.1)*Number(service.event.spawn||1);
    if(special)showSpecialNotice(special==='critic'?'FOOD CRITIC HAS ARRIVED':'VIP RESERVATION HAS ARRIVED');
    renderOrders(true);renderRestaurantScene(true);renderStaffScene(true);return true;
  }

  function updateServicePhase() {
    if(!service)return;const p=1-service.time/service.totalDuration;let phase='OPENING';
    if(p>=.82)phase='LAST ORDERS';else if(p>=.58)phase='LATE SERVICE';else if(p>=.18)phase='DINNER RUSH';
    if(phase!==service.phase){service.phase=phase;if($('rdPhaseBanner'))$('rdPhaseBanner').textContent=phase;$('rdServiceToast').textContent=phase==='DINNER RUSH'?'DINNER RUSH · KEEP THE PASS MOVING':phase==='LATE SERVICE'?'LATE SERVICE · WATCH FOR SPECIAL TABLES':phase==='LAST ORDERS'?'LAST ORDERS · NO NEW WALK-INS':'THE DOORS ARE OPEN'}
  }

  function serviceLoop(t) {
    if(!service?.active)return;const dt=Math.min(.05,(t-service.last)/1000||.016);service.last=t;service.time-=dt;service.spawn-=dt;updateServicePhase();
    const progress=1-service.time/service.totalDuration;
    if(service.specialPlan&&!service.specialSpawned&&progress>.44&&service.phase!=='LAST ORDERS')spawnCustomer(true);
    if(service.spawn<=0&&service.time>8&&service.phase!=='LAST ORDERS')spawnCustomer(false);

    const patienceDrain=2.35/(1+Number(profile.restaurant?.service||1)*.10)*(service.crew.some(x=>x.role==='Server')?.88:1);
    let changed=false;
    for(let i=service.customers.length-1;i>=0;i--){
      const c=service.customers[i];c.stageTime=(c.stageTime||0)-dt;
      if(c.stage==='entering'&&c.stageTime<=0){c.stage='waiting';c.stageTime=0;changed=true}
      else if(c.stage==='eating'&&c.stageTime<=0){c.stage='leaving';c.stageTime=1.05;c.reaction='THANK YOU';changed=true}
      else if(c.stage==='leaving'&&c.stageTime<=0){service.customers.splice(i,1);changed=true}
      else if(c.stage==='waiting'){
        c.patience-=dt*patienceDrain;
        if(c.patience<=0){releaseCustomerReservation(c.uid);c.stage='leaving';c.stageTime=.9;c.reaction='WALKOUT';service.lost++;changed=true;$('rdServiceToast').textContent=`TABLE ${c.table+1} WALKED OUT · SERVICE TOO SLOW`}
      }
    }
    if(changed){renderReadyCounter();renderRestaurantMenu();renderOrders(true);renderRestaurantScene(true);renderStaffScene(true)}else updateOrderPatienceBars();
    reconcileImpossibleOrders();
    if(maybeCloseSoldOutService())return;
    if(service.cook){const c=service.cook;c.needle+=c.dir*c.speed*dt;if(c.needle>=1){c.needle=1;c.dir=-1}if(c.needle<=0){c.needle=0;c.dir=1}if($('rdCookNeedle'))$('rdCookNeedle').style.left=(c.needle*100)+'%'}
    $('rdServiceTime').textContent=Math.ceil(Math.max(0,service.time));$('rdServed').textContent=service.served;if($('rdRoomCount'))$('rdRoomCount').textContent=service.customers.filter(c=>c.stage!=='leaving').length;$('rdServiceRevenue').textContent=service.revenue.toLocaleString()+' GP';
    if(service.time<=0){service.closing=true;service.active=false;service.cook=null;$('rdCookPanel')?.classList.add('hidden');for(const c of service.customers){if(['entering','waiting'].includes(c.stage))service.lost++}finishDay();return}
    serviceRaf=requestAnimationFrame(serviceLoop);
  }

  function serviceReputationEstimate() {
    if(!service)return 0;const avg=service.servedDishes.length?service.servedDishes.reduce((a,b)=>a+b.quality,0)/service.servedDishes.length:0;
    const special=service.specialServed?3:0;return Math.max(0,Math.round(service.served+service.servedDishes.filter(x=>x.quality===4).length*2+avg+special-service.lost*2));
  }

  function nightReview() {
    const avg=service?.servedDishes?.length?service.servedDishes.reduce((a,b)=>a+b.quality,0)/service.servedDishes.length:0;
    const stars=Math.max(1,Math.min(5,Math.round(avg+1-(service?.lost||0)*.25)));
    const starText='★'.repeat(stars)+'☆'.repeat(5-stars);
    let line=avg>=3.5?'Beautiful seafood and a confident kitchen.':avg>=2.7?'A strong night with flashes of excellent cooking.':avg>=1.8?'A decent service, though the kitchen still has room to sharpen up.':'A rough service, but the Fish House made it through the night.';
    if(service?.lost>0)line+=` ${service.lost} table${service.lost===1?'':'s'} left before being served.`;
    if(service?.specialServed?.type==='critic')line=`The critic filed ${stars} stars. `+line;
    return {stars,starText,line};
  }

  async function finishDay() {
    if(!service||service.finishStarted)return;service.finishStarted=true;cancelAnimationFrame(serviceRaf);show('rdResultsView');
    const avg=service.servedDishes.length?service.servedDishes.reduce((a,b)=>a+b.quality,0)/service.servedDishes.length:0;
    $('rdResultFish').textContent=run.catches.filter(x=>x.kind==='fish').length;$('rdResultDishes').textContent=service.servedDishes.length;$('rdResultPerfect').textContent=service.servedDishes.filter(x=>x.quality===4).length;$('rdResultRevenue').textContent=service.revenue.toLocaleString()+' GP';
    if($('rdResultWalkouts'))$('rdResultWalkouts').textContent=service.lost;if($('rdResultQuality'))$('rdResultQuality').textContent='★'+avg.toFixed(1);if($('rdResultWages'))$('rdResultWages').textContent='−'+service.wages.toLocaleString()+' GP';if($('rdResultRep'))$('rdResultRep').textContent='+'+serviceReputationEstimate();
    const review=nightReview();if($('rdReviewCard'))$('rdReviewCard').innerHTML=`<small>${service.specialServed?.type==='critic'?'CRITIC REVIEW':'FISH HOUSE REVIEW'}</small><b>${review.starText}</b><p>${review.line}</p>`;
    $('rdResultReward').textContent='Balancing the Fish House books…';
    const catches=run.catches.map(x=>({id:x.id,q:x.q,w:Number(x.weight||0)}));const dishes=service.servedDishes.map(x=>({id:x.id,quality:x.quality,ingredient_q:x.ingredient_q||1}));
    try{
      const r=await rpc('repo_diver_complete_day',{p_run_id:runId,p_catches:catches,p_dishes:dishes,p_max_depth:Math.round(run.maxDepth),p_customers:service.servedDishes.length});
      const wages=Number(r.staff_wages??service.wages??0),rep=Number(r.reputation_gained??serviceReputationEstimate()),gross=Number(r.service_gross_gp??service.revenue??0);
      if($('rdResultWages'))$('rdResultWages').textContent='−'+wages.toLocaleString()+' GP';if($('rdResultRep'))$('rdResultRep').textContent='+'+rep;if($('rdResultRevenue'))$('rdResultRevenue').textContent=gross.toLocaleString()+' GP';
      $('rdResultReward').innerHTML=`<b>+${(r.fishing_xp_awarded||0).toLocaleString()} Fishing XP</b> · <b>+${(r.cooking_xp_awarded||0).toLocaleString()} Cooking XP</b> · <b>+${(r.gp_awarded||0).toLocaleString()} GP NET</b>${r.restaurant_rank?` · <b>FISH HOUSE RANK ${r.restaurant_rank}</b>`:''}`;
      await loadProfile();
    }catch(e){$('rdResultReward').textContent=e.message;service.finishStarted=false}
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
    const diving = run && !$('rdDiveView')?.classList.contains('hidden');
    const restaurantActive = !!service?.active;
    const gameKeys = new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','q','e',' ','spacebar','tab']);
    // Never let gameplay controls move the underlying RepoCompany page.
    if ((diving || restaurantActive) && gameKeys.has(key)) e.preventDefault();
    if (key === 'w' || key === 'arrowup') input.up = true;
    if (key === 's' || key === 'arrowdown') input.down = true;
    if (key === 'a' || key === 'arrowleft') input.left = true;
    if (key === 'd' || key === 'arrowright') input.right = true;
    if (key === 'shift') input.boost = true;
    if (key === 'e' && diving) E.interact(run, profile.equipment);
    if (key === 'q' && diving) E.useSonar(run, profile.equipment);
    if ((key === ' ' || key === 'spacebar') && diving && run?.harpoon?.fight) input.reel = true;
    else if ((key === ' ' || key === 'spacebar') && service?.active && service.cook) hitCook();
  }, {passive:false});

  addEventListener('keyup', e => {
    const key = e.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') input.up = false;
    if (key === 's' || key === 'arrowdown') input.down = false;
    if (key === 'a' || key === 'arrowleft') input.left = false;
    if (key === 'd' || key === 'arrowright') input.right = false;
    if (key === 'shift') input.boost = false;
    if (key === ' ' || key === 'spacebar') input.reel = false;
  });

  addEventListener('DOMContentLoaded', () => {
    const canvas = $('rdDiveCanvas');
    canvas?.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * canvas.width / r.width;
      mouse.y = (e.clientY - r.top) * canvas.height / r.height;
    });
    canvas?.addEventListener('click', e => {
      e.preventDefault();
      try{ canvas.focus({preventScroll:true}); }catch(_){ canvas.focus(); }
      E.harpoon(run, mouse, profile.equipment);
    });
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
      renderStaff: () => renderStaffScene(true),
      serviceLoop,
      updateServicePhase,
      forceServiceTime: seconds => { if (service) service.time = seconds; },
      sonar: () => E.useSonar(run, profile.equipment),
      forceEvent: key => E.triggerEvent(run, key),
      forceLegendary: () => E.forceLegendary(run),
      draw,
      hud
    };
  }

  window.openRepoDiver = open;
})();
