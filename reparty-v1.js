/* REPARTY V22.22 — gameplay-first premium six-contestant party game rebuild. */
(()=>{
  if(window.__REPARTY_V2__) return;
  window.__REPARTY_V2__=true;

  const GAME_LIST=[
    {id:'goblin_bomb_party',name:'GOBLIN BOMB PARTY',skill:'Firemaking',type:'SURVIVAL',goal:'Pass the live bomb and be the last contestant standing.',tip:'WASD / ARROWS move · SPACE dash · CLICK near a rival to throw · no instant pass-backs'},
    {id:'potion_panic',name:'POTION PANIC',skill:'Herblore',type:'MEMORY',goal:'Memorise recipes and brew them accurately before the clock runs out.',tip:'Click ingredients in order · then SPACE / click cauldron to seal inside the gold heat band'},
    {id:'fishing_frenzy',name:'FISHING FRENZY',skill:'Fishing',type:'REACTION',goal:'Hook valuable jumping fish, build combos and avoid junk.',tip:'Aim + click to hook · SPACE taps reel · keep tension out of the red'},
    {id:'chopping_frenzy',name:'CHOPPING FRENZY',skill:'Woodcutting',type:'REACTION',goal:'Chop ripe trees at the perfect moment. Rotten trees break your combo.',tip:'Aim at a ripe tree · CLICK / SPACE to swing · hit the centre timing band for perfect chops'},
    {id:'builder_blitz',name:'BUILDER BLITZ',skill:'Construction',type:'MEMORY',goal:'Study the blueprint, then rebuild it with the correct materials.',tip:'1 stone · 2 wood · 3 glass · 0 erase · click cells · SPACE submits the build'},
    {id:'minecart_mayhem',name:'MINECART MAYHEM',skill:'Mining',type:'ACTION',goal:'Switch rails, jump hazards and scoop up valuable ore.',tip:'← → rails · SPACE / ↑ jump · ↓ duck · SHIFT boost when charged'},
    {id:'rooftop_rush',name:'ROOFTOP RUSH',skill:'Agility',type:'ACTION',goal:'Sprint the rooftops, jumping crates and ducking clotheslines.',tip:'SPACE / ↑ jump · ↓ slide · clear gaps, vents, crates and clotheslines'},
    {id:'chicken_chase',name:'CHICKEN CHASE',skill:'Farming',type:'ACTION',goal:'Chase down chickens and swing your net at the right moment.',tip:'WASD / ARROWS chase · SPACE net · SHIFT dash · mud slows you down'},
    {id:'treasure_tiles',name:'TREASURE TILES',skill:'Agility',type:'SURVIVAL',goal:'Stay on the floating board while warning tiles collapse beneath you.',tip:'WASD / ARROWS move · SPACE dashes an extra tile · avoid warning tiles and rivals'},
    {id:'goblin_says',name:'GOBLIN SAYS',skill:'Magic',type:'TIMING',goal:'Obey the goblin only when he actually says “Goblin Says”.',tip:'Use the shown key only after GOBLIN SAYS · fake commands and feint lights are traps'},
    {id:'gold_rush',name:'GOLD RUSH',skill:'Mining',type:'RISK',goal:'Mine gold, carry it back to the bank and avoid cave goblins.',tip:'WASD / ARROWS move · SPACE mine · bank often · dodge goblins and cave-in warnings'},
    {id:'dont_wake_troll',name:"DON'T WAKE THE TROLL",skill:'Slayer',type:'RISK',goal:'Time your grabs, bank the loot, and stop before the troll wakes.',tip:'HOLD SPACE to sneak during quiet breaths · release when alert rises · B retreats and banks loot'}
  ];
  const GAME_MAP=Object.fromEntries(GAME_LIST.map(g=>[g.id,g]));
  const GAME_PRESENTATION=Object.freeze({
    goblin_bomb_party:{sigil:'BOMB',accent:'#ff6f77',accent2:'#ffd45f',tag:'PASS · PANIC · SURVIVE'},
    potion_panic:{sigil:'BREW',accent:'#8b7dff',accent2:'#67efc4',tag:'MEMORISE · MIX · MASTER'},
    fishing_frenzy:{sigil:'FISH',accent:'#52dfff',accent2:'#ffd75f',tag:'HOOK · COMBO · CASH IN'},
    chopping_frenzy:{sigil:'CHOP',accent:'#6fe184',accent2:'#ffe06a',tag:'READ · SWING · STREAK'},
    builder_blitz:{sigil:'BUILD',accent:'#ffb15e',accent2:'#7be6ff',tag:'STUDY · REBUILD · PERFECT'},
    minecart_mayhem:{sigil:'CART',accent:'#f8bd55',accent2:'#61dfff',tag:'DODGE · JUMP · COLLECT'},
    rooftop_rush:{sigil:'RUN',accent:'#ff7a9e',accent2:'#7ceaff',tag:'SPRINT · LEAP · FLOW'},
    chicken_chase:{sigil:'NET',accent:'#ffe071',accent2:'#79ed9b',tag:'CHASE · SWING · CATCH'},
    treasure_tiles:{sigil:'TILES',accent:'#a681ff',accent2:'#ffe06a',tag:'MOVE · READ · SURVIVE'},
    goblin_says:{sigil:'SAYS',accent:'#75e39f',accent2:'#ff7590',tag:'LISTEN · REACT · DOUBT'},
    gold_rush:{sigil:'GOLD',accent:'#ffd45b',accent2:'#78eaff',tag:'MINE · RISK · BANK'},
    dont_wake_troll:{sigil:'TROLL',accent:'#ff9a63',accent2:'#ffe16b',tag:'STEAL · HOLD · ESCAPE'}
  });
  const SPECIAL_PRESENTATION=Object.freeze({
    standard:{label:'STANDARD ROUND',pot:'ROUND POT',className:'is-standard'},
    double_gold:{label:'DOUBLE GOLD',pot:'DOUBLE GOLD POT',className:'is-double-gold'},
    double_xp:{label:'DOUBLE XP',pot:'ROUND POT',className:'is-double-xp'},
    jackpot:{label:'JACKPOT ROUND',pot:'JACKPOT POT',className:'is-jackpot'},
    mystery:{label:'MYSTERY ROUND',pot:'ROUND POT',className:'is-mystery'}
  });
  const COLORS=['#ff6f88','#63e4ff','#ffd05e','#73eba4','#a77cff','#ff9a58'];
  const RP={
    open:false,state:null,joined:false,joining:false,queued:false,poll:0,heartbeat:0,uiTimer:0,
    roundToken:'',selectorTimer:0,gameCleanup:null,scope:null,rawScore:0,score:0,participation:0,inputCount:0,
    history:[],results:[],reward:null,keys:new Set(),startedAt:0,finished:false,submitting:false,lastStateFetch:0,
    sessionGames:0,sessionGp:0,audio:null,screenShake:0
  };

  const el=id=>document.getElementById(id);
  const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const me=()=>String((typeof character!=='undefined'&&character?.username)||'').trim();
  const signedIn=()=>Boolean(typeof character!=='undefined'&&character&&me());
  const game=()=>GAME_MAP[RP.state?.game_key]||GAME_LIST[0];
  const now=()=>Date.now();
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const rand=(a=0,b=1)=>a+Math.random()*(b-a);
  const irand=(a,b)=>Math.floor(rand(a,b+1));
  const choose=a=>a[Math.floor(Math.random()*a.length)];
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const msLeft=()=>Math.max(0,new Date(RP.state?.phase_ends_at||0).getTime()-(now()+(Number(RP.state?.clock_offset_ms)||0)));
  const gameSeconds=()=>Math.max(0,msLeft()/1000);
  const fmtGp=n=>`${Math.max(0,Number(n)||0).toLocaleString('en-GB')} GP`;
  const initials=name=>String(name||'?').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const currentUser=p=>String(p?.username||'').toLowerCase()===me().toLowerCase();

  const present=()=>GAME_PRESENTATION[game().id]||GAME_PRESENTATION.fishing_frenzy;
  const specialMeta=()=>SPECIAL_PRESENTATION[String(RP.state?.special||'standard')]||SPECIAL_PRESENTATION.standard;
  const firstPrize=pot=>Math.round((Number(pot)||0)*.30);
  function sfx(kind='tick'){
    const seq={
      tick:[[360,.018,.008,'square']],good:[[620,.035,.014,'square'],[820,.05,.014,'triangle']],great:[[660,.04,.018,'square'],[880,.06,.02,'triangle'],[1180,.08,.018,'sine']],bad:[[170,.07,.02,'sawtooth'],[105,.10,.016,'square']],gold:[[760,.035,.018,'triangle'],[1040,.06,.022,'sine']],boom:[[82,.18,.052,'sawtooth'],[48,.24,.032,'square']],start:[[440,.04,.014,'square'],[660,.05,.016,'square'],[990,.08,.02,'triangle']],bank:[[720,.04,.018,'triangle'],[930,.05,.02,'triangle'],[1220,.08,.018,'sine']]};
    (seq[kind]||seq.tick).forEach((x,i)=>setTimeout(()=>playTone(...x),i*55));
  }
  function gameCallout(text,sub='',tone='good'){
    const fx=el('rpGameFx');if(!fx)return;const n=document.createElement('div');n.className=`rp-game-callout is-${tone}`;n.innerHTML=`<strong>${safe(text)}</strong>${sub?`<small>${safe(sub)}</small>`:''}`;fx.appendChild(n);requestAnimationFrame(()=>n.classList.add('is-in'));setTimeout(()=>{n.classList.remove('is-in');setTimeout(()=>n.remove(),240)},720);if(tone==='bad'||tone==='boom')screenShake(tone==='boom'?.8:.42);sfx(tone==='boom'?'boom':tone==='bad'?'bad':tone==='gold'?'gold':tone==='great'?'great':'good');
  }
  function scoreBurst(text,x=50,y=50,tone='good'){
    const fx=el('rpGameFx');if(!fx)return;const n=document.createElement('i');n.className=`rp-score-burst is-${tone}`;n.textContent=text;n.style.left=`${x}%`;n.style.top=`${y}%`;fx.appendChild(n);requestAnimationFrame(()=>n.classList.add('is-in'));setTimeout(()=>n.remove(),850);
  }
  function screenShake(power=.45){const body=el('rpGameBody');if(!body)return;body.style.setProperty('--rp-shake',String(power));body.classList.remove('is-shaking');void body.offsetWidth;body.classList.add('is-shaking');setTimeout(()=>body.classList.remove('is-shaking'),340)}
  function renderRivalRibbon(){const box=el('rpRivalRibbon');if(!box)return;const who=me().toLowerCase();box.innerHTML=contestantList().map((p,i)=>`<span class="${String(p.username).toLowerCase()===who?'is-you':''} ${p.is_bot?'is-ai':''}" style="--c:${COLORS[i%COLORS.length]}"><i>${safe(initials(p.username))}</i><b>${safe(p.username)}</b><small>${p.is_bot?'AI':'HUMAN'}</small></span>`).join('')}
  function drawCinematicOverlay(ctx,w,h,t){
    const m=present();ctx.save();
    const sweep=(Math.sin(t/900)+1)/2;const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'rgba(255,255,255,.025)');g.addColorStop(.5,`rgba(255,255,255,${.008+.016*sweep})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const v=ctx.createRadialGradient(w/2,h*.46,Math.min(w,h)*.18,w/2,h*.5,Math.max(w,h)*.67);v.addColorStop(.55,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.46)');ctx.fillStyle=v;ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.26;ctx.strokeStyle=m.accent;ctx.lineWidth=2;ctx.strokeRect(7,7,w-14,h-14);ctx.globalAlpha=.16;ctx.fillStyle=m.accent2;for(let i=0;i<8;i++){const x=((i*137+t*.025)%Math.max(1,w));const y=18+((i*61)%Math.max(24,h-36));ctx.fillRect(Math.round(x),Math.round(y),2,2)}ctx.restore();
  }

  function toast(msg){
    const t=el('repartyToast'); if(!t)return;
    t.textContent=msg;t.classList.add('is-show');clearTimeout(t._hide);t._hide=setTimeout(()=>t.classList.remove('is-show'),2400);
  }
  function playTone(freq=440,dur=.06,vol=.025,type='square'){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      const ctx=RP.audio||(RP.audio=new AC());if(ctx.state==='suspended')void ctx.resume();
      const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g).connect(ctx.destination);o.start();
      g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);o.stop(ctx.currentTime+dur+.02);
    }catch(_){ }
  }
  function fanfare(){playTone(660,.08,.022);setTimeout(()=>playTone(880,.1,.026),80);setTimeout(()=>playTone(1100,.12,.023),160)}

  function ensureUi(){
    if(el('repartyDialog'))return;
    const d=document.createElement('dialog');d.id='repartyDialog';d.setAttribute('aria-label','Reparty');
    d.innerHTML=`<div class="reparty-shell">
      <div class="reparty-marquee" aria-hidden="true"></div>
      <div class="reparty-top">
        <div class="reparty-brand"><i class="reparty-logo"><b>RP</b></i><span><small>REPO COMPANY PRESENTS</small><strong>REPARTY</strong></span></div>
        <div class="reparty-statusbar"><span class="reparty-pill" id="rpPhasePill">READY</span><span class="reparty-pill rp-prize-pill" id="rpPrizePill"><small id="rpPrizeLabel">ROUND POT</small><b id="rpPrizeTop">5,000 GP</b><em id="rpPrizeFirst">1ST 1,500 GP</em></span><span class="reparty-pill"><small>SKILL</small><b id="rpSkillTop">—</b></span><span class="reparty-pill" id="rpQueuePill" hidden>JOINING NEXT ROUND</span></div>
        <button class="reparty-close" id="repartyClose" aria-label="Close Reparty">×</button>
      </div>
      <div class="reparty-main">
        <aside class="reparty-side reparty-left"><div class="reparty-side-title"><b>CONTESTANTS</b><span>6 ACTIVE</span></div><div class="reparty-contestants" id="rpContestants"></div></aside>
        <section class="reparty-stage" id="rpStage">
          <div class="reparty-stage-lights" aria-hidden="true"></div>
          <div class="reparty-screen reparty-lobby is-active" id="rpLobby"><div class="rp-lobby-copy"><span class="rp-kicker">SIX CONTESTANTS · DROP IN / DROP OUT</span><h2>FAST GAMES.<br><em>REAL GOLD.</em></h2><p>Reparty is always running. Up to four humans enter each round and Velmora AI fills every empty seat. Every game trains a real skill and pays from the live prize pot.</p><button id="rpJoin" type="button"><span>JOIN THE PARTY</span><small>YOU REPLACE AN AI NEXT ROUND</small></button><span class="rp-live-note" id="rpLobbyNote">Connecting to the live party room…</span></div></div>
          <div class="reparty-screen reparty-selector" id="rpSelector"><div class="rp-selector-box"><span class="rp-kicker" id="rpSelectorKicker">NEXT GAME</span><div class="rp-selector-type" id="rpSelectorType">ACTION</div><div class="rp-selector-name" id="rpSelectorName">REPARTY</div><p class="rp-selector-goal" id="rpSelectorGoal"></p><div class="rp-selector-meta"><span>PRIZE <b id="rpSelectorPrize">—</b></span><span>XP <b id="rpSelectorSkill">—</b></span><span id="rpSelectorSpecial">STANDARD ROUND</span></div><div class="rp-selector-rail" id="rpSelectorRail"></div><div class="rp-selector-count" id="rpSelectorCount">NEXT ROUND</div></div></div>
          <div class="reparty-screen reparty-game" id="rpGame"><div class="rp-game-head"><span><small id="rpGameKicker">LIVE MINIGAME</small><b id="rpGameName">REPARTY</b></span><div class="rp-live-chip"><i></i>LIVE</div><strong id="rpGameTimer">0.0</strong><em id="rpGameScore">SCORE 0</em></div><div class="rp-rival-ribbon" id="rpRivalRibbon"></div><div class="rp-game-body" id="rpGameBody"><canvas class="rp-game-canvas" id="rpCanvas" width="960" height="540" tabindex="0"></canvas><div class="rp-dom-layer" id="rpDom"></div><div class="rp-game-fx" id="rpGameFx"></div></div></div>
          <div class="reparty-screen reparty-results" id="rpResults"><div class="rp-results-card"><span class="rp-kicker">ROUND COMPLETE</span><h2 id="rpResultsTitle">RESULTS</h2><p id="rpResultsSub">Calculating the six-player table…</p><div class="rp-results-list" id="rpResultsList"></div><div class="rp-reward-line" id="rpRewardLine"></div><div class="rp-results-next" id="rpResultsNext"></div></div></div>
        </section>
        <aside class="reparty-side reparty-right"><div class="reparty-side-title"><b>ROLLING BOARD</b><span>LAST 10</span></div><div class="reparty-scoreboard" id="rpRolling"></div></aside>
      </div>
      <div class="reparty-bottom"><div class="rp-history" id="rpHistory"></div><div class="rp-roll"><div><small>YOUR SESSION</small><b id="rpSessionGames">0 games</b><strong id="rpSessionGp">0 GP</strong></div><div><small>CURRENT ROUND</small><b id="rpRoundNo">#—</b><strong id="rpRoundSpecial">STANDARD</strong></div></div></div>
      <div class="reparty-toast" id="repartyToast"></div>
    </div>`;
    document.body.appendChild(d);
    el('repartyClose').addEventListener('click',close);
    el('rpJoin').addEventListener('click',join);
    d.addEventListener('cancel',e=>{e.preventDefault();void close()});
    window.addEventListener('keydown',e=>{
      if(!RP.open)return;
      const k=e.key.toLowerCase();RP.keys.add(k);
      if([' ','arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','b'].includes(k))e.preventDefault();
    },{passive:false});
    window.addEventListener('keyup',e=>RP.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur',()=>RP.keys.clear());
  }

  function show(which){['rpLobby','rpSelector','rpGame','rpResults'].forEach(id=>el(id)?.classList.toggle('is-active',id===which))}
  async function rpc(name,args={}){if(typeof db==='undefined'||!db?.rpc)throw new Error('Supabase is unavailable');const {data,error}=await db.rpc(name,args);if(error)throw error;return data}
  async function join(options={}){
    const silent=Boolean(options?.silent);if(!signedIn()){if(!silent)toast('Sign in before joining Reparty.');return null}
    if(RP.joined||RP.joining)return RP.state;
    RP.joining=true;const b=el('rpJoin');if(b)b.disabled=true;
    try{const data=await rpc('reparty_join');RP.joined=true;applyState(data);if(!silent)toast(RP.queued?'You are queued for the next round.':'You joined Reparty!');startHeartbeat();await refreshState(true);return data}
    catch(err){console.error('REPARTY join',err);if(el('rpLobbyNote'))el('rpLobbyNote').textContent='Could not join the live Reparty room. Please try again.';if(!silent)toast(err.message||'Reparty could not connect.');return null}
    finally{RP.joining=false;if(b)b.disabled=false}
  }
  async function leave(){if(!RP.joined)return;try{await rpc('reparty_leave')}catch(_){ }RP.joined=false;clearInterval(RP.heartbeat);RP.heartbeat=0}
  function startHeartbeat(){clearInterval(RP.heartbeat);RP.heartbeat=setInterval(async()=>{if(!RP.open||!RP.joined)return;try{await rpc('reparty_heartbeat')}catch(_){ }},15000)}
  async function refreshState(force=false){if(!RP.open)return;if(!force&&now()-RP.lastStateFetch<550)return;RP.lastStateFetch=now();try{applyState(await rpc('reparty_get_state'))}catch(err){console.warn('REPARTY state',err);if(!RP.state&&el('rpLobbyNote'))el('rpLobbyNote').textContent='Could not connect to the Reparty room.'}}
  function applyState(data){
    let s=Array.isArray(data)?data[0]:data;if(typeof s==='string'){try{s=JSON.parse(s)}catch(_){ }}if(!s||typeof s!=='object')return;
    const serverNow=new Date(s.server_now||Date.now()).getTime();s.clock_offset_ms=serverNow-Date.now();
    const previous=RP.state;if(previous?.phase==='live'&&s.phase==='results'&&!RP.finished&&previous.playing)void finishGame(previous);
    RP.state=s;RP.queued=Boolean(s.queued);renderChrome();
    const token=`${s.round_no}:${s.phase}`;if(token!==RP.roundToken){RP.roundToken=token;onPhaseChanged(s)}
  }
  function contestantList(){const humans=Array.isArray(RP.state?.humans)?RP.state.humans:[];const bots=Array.isArray(RP.state?.bots)?RP.state.bots:[];return [...humans.map(x=>({...x,is_bot:false})),...bots.map((name,i)=>({username:typeof name==='string'?name:name.username,is_bot:true,slot:humans.length+i+1}))].slice(0,6)}
  function renderChrome(){
    const s=RP.state;if(!s)return;const g=game(),sp=specialMeta(),m=present();
    const shell=el('repartyDialog')?.querySelector('.reparty-shell');if(shell){shell.dataset.game=g.id;shell.dataset.special=String(s.special||'standard');shell.classList.toggle('is-playing',s.phase==='live'&&Boolean(s.playing)&&!RP.queued);shell.style.setProperty('--game-accent',m.accent);shell.style.setProperty('--game-accent2',m.accent2)}
    el('rpPrizeLabel').textContent=sp.pot;el('rpPrizeTop').textContent=fmtGp(s.prize_pot);el('rpPrizeFirst').textContent=`1ST ${fmtGp(firstPrize(s.prize_pot))}`;el('rpPrizePill').className=`reparty-pill rp-prize-pill ${sp.className}`;el('rpSkillTop').textContent=g.skill;el('rpRoundNo').textContent=`#${s.round_no}`;el('rpRoundSpecial').textContent=sp.label;
    el('rpQueuePill').hidden=!RP.queued;const phase=String(s.phase||'').toUpperCase();el('rpPhasePill').textContent=phase==='PREGAME'?'NEXT GAME':phase==='LIVE'?'LIVE NOW':phase==='RESULTS'?'RESULTS':'READY';el('rpPhasePill').classList.toggle('is-live',phase==='LIVE');
    const contestants=contestantList();const who=me().toLowerCase();
    el('rpContestants').innerHTML=contestants.map((p,i)=>`<div class="reparty-player-card ${p.is_bot?'is-bot':''} ${String(p.username).toLowerCase()===who?'is-me':''}" style="--rp-accent:${COLORS[i%COLORS.length]}"><i class="reparty-avatar"><span>${safe(initials(p.username))}</span></i><span><strong>${safe(p.username)}</strong><small>${p.is_bot?'AI CONTESTANT':String(p.username).toLowerCase()===who?'YOU · HUMAN':'HUMAN PLAYER'}</small></span><em>#${i+1}</em></div>`).join('');
    renderRivalRibbon();renderRolling();renderHistory();
  }
  function onPhaseChanged(s){
    cleanupGame(true,true);stopSelectorFX();RP.finished=false;RP.reward=null;RP.rawScore=0;RP.score=0;RP.participation=0;RP.inputCount=0;
    if(!RP.joined){show('rpLobby');if(el('rpLobbyNote'))el('rpLobbyNote').textContent='Opening Reparty automatically joins you to the next available round.';return}
    if(s.phase==='pregame'){show('rpSelector');renderSelector();startSelectorFX();if(!RP.queued)playTone(620,.08,.03)}
    else if(s.phase==='live'){if(RP.queued||!Boolean(s.playing)){show('rpSelector');renderSpectator()}else{show('rpGame');startGame()}}
    else if(s.phase==='results'){show('rpResults');void loadResults()}
  }
  function renderSpectator(){
    if(!RP.state)return;const g=game();el('rpSelectorKicker').textContent='ROUND IN PROGRESS';el('rpSelectorType').textContent=g.type;el('rpSelectorName').textContent=g.name;el('rpSelectorGoal').textContent='You are safely queued. Watch this one, then an AI seat becomes yours.';el('rpSelectorPrize').textContent=`TOTAL ${fmtGp(RP.state.prize_pot)} · 1ST ${fmtGp(firstPrize(RP.state.prize_pot))}`;el('rpSelectorSkill').textContent=g.skill;el('rpSelectorSpecial').textContent='JOINING NEXT ROUND';el('rpSelectorCount').textContent=`LIVE · ${Math.ceil(msLeft()/1000)}s`;
  }
  function renderSelector(){
    const s=RP.state,g=game();el('rpSelectorKicker').textContent=s.special==='mystery'?'MYSTERY ROUND':'THE MACHINE HAS CHOSEN';el('rpSelectorType').textContent=g.type;el('rpSelectorName').textContent=s.special==='mystery'&&msLeft()>3000?'???':g.name;el('rpSelectorGoal').textContent=s.special==='mystery'&&msLeft()>3000?'The game is being kept secret until the final seconds.':g.goal;el('rpSelectorPrize').textContent=`TOTAL ${fmtGp(s.prize_pot)} · 1ST ${fmtGp(firstPrize(s.prize_pot))}`;el('rpSelectorSkill').textContent=g.skill;el('rpSelectorSpecial').textContent=specialMeta().label;renderSelectorRail(g.id);el('rpSelectorCount').textContent=`STARTS IN ${Math.max(1,Math.ceil(msLeft()/1000))}`;
  }
  function renderSelectorRail(centerId,shuffle=false){
    const g=GAME_MAP[centerId]||game(),idx=GAME_LIST.findIndex(x=>x.id===g.id),offset=shuffle?irand(-4,4):0,len=GAME_LIST.length;
    el('rpSelectorRail').innerHTML=Array.from({length:5},(_,k)=>{const x=GAME_LIST[((idx-2+k+offset)%len+len)%len];return `<span class="rp-selector-chip ${k===2?'is-current':''}"><i>${safe(x.type)}</i>${safe(x.name)}</span>`}).join('');
  }
  function startSelectorFX(){
    stopSelectorFX();let tick=0;RP.selectorTimer=setInterval(()=>{if(!RP.open||RP.state?.phase!=='pregame')return;const left=msLeft();el('rpSelectorCount').textContent=`STARTS IN ${Math.max(1,Math.ceil(left/1000))}`;if(left>2400){tick++;const fake=GAME_LIST[(GAME_LIST.findIndex(g=>g.id===game().id)+tick)%GAME_LIST.length];el('rpSelectorName').textContent=fake.name;el('rpSelectorType').textContent=fake.type;renderSelectorRail(fake.id,true);playTone(240+(tick%5)*45,.025,.007)}else{el('rpSelectorName').textContent=game().name;el('rpSelectorType').textContent=game().type;el('rpSelectorGoal').textContent=game().goal;renderSelectorRail(game().id)}},140)
  }
  function stopSelectorFX(){clearInterval(RP.selectorTimer);RP.selectorTimer=0}

  function newScope(){cleanupScope();const timeouts=new Set(),intervals=new Set(),listeners=[],rafs=new Set();RP.scope={timeouts,intervals,listeners,rafs};return RP.scope}
  function cleanupScope(){const s=RP.scope;if(!s)return;for(const x of s.timeouts)clearTimeout(x);for(const x of s.intervals)clearInterval(x);for(const [target,type,fn,opt] of s.listeners)target.removeEventListener(type,fn,opt);for(const id of s.rafs)cancelAnimationFrame(id);RP.scope=null}
  function later(fn,ms){const s=RP.scope;if(!s)return setTimeout(fn,ms);const id=setTimeout(()=>{s.timeouts.delete(id);fn()},ms);s.timeouts.add(id);return id}
  function every(fn,ms){const s=RP.scope;if(!s)return setInterval(fn,ms);const id=setInterval(fn,ms);s.intervals.add(id);return id}
  function listen(target,type,fn,opt){target.addEventListener(type,fn,opt);RP.scope?.listeners.push([target,type,fn,opt]);return fn}
  function loop(update,draw){const s=RP.scope;let last=performance.now(),id=0;const frame=t=>{if(RP.finished||RP.state?.phase!=='live')return;const dt=Math.min(.04,(t-last)/1000);last=t;update?.(dt,t);draw?.(t);const c=el('rpCanvas');if(c&&c.style.visibility!=='hidden'){const r=c.getBoundingClientRect(),ctx=c.getContext('2d');if(ctx&&r.width>0&&r.height>0)drawCinematicOverlay(ctx,r.width,r.height,t)}id=requestAnimationFrame(frame);s?.rafs.add(id)};id=requestAnimationFrame(frame);s?.rafs.add(id);return id}
  function activity(n=.04){RP.inputCount++;RP.participation=Math.min(1,RP.participation+n)}
  function setScore(raw,norm,participation=RP.participation){RP.rawScore=raw;RP.score=clamp(Number(norm)||0,0,100);RP.participation=Math.max(RP.participation,clamp(Number(participation)||0,0,1));if(el('rpGameScore'))el('rpGameScore').textContent=`SCORE ${Math.max(0,Math.round(Number(raw)||0))}`}

  function startGame(){
    const g=game();newScope();RP.finished=false;RP.startedAt=performance.now();if(el('rpDom'))el('rpDom').className='rp-dom-layer';el('rpGameName').textContent=g.name;el('rpGameKicker').textContent=`${g.type} · ${g.skill.toUpperCase()} XP`;el('rpGameScore').textContent='SCORE 0';el('rpGameTimer').textContent=gameSeconds().toFixed(1);
    const canvas=el('rpCanvas');canvas.style.visibility='hidden';const m=present();renderRivalRibbon();el('rpDom').innerHTML=`<div class="rp-instruction" style="--accent:${m.accent};--accent2:${m.accent2}"><div class="rp-instruction-sigil">${safe(m.sigil)}</div><span class="rp-instruction-type">${safe(g.type)} · ${safe(g.skill.toUpperCase())} XP</span><h3>${safe(g.name)}</h3><b class="rp-instruction-tag">${safe(m.tag)}</b><p>${safe(g.goal)}</p><div class="rp-control-strip">${safe(g.tip)}</div><div class="rp-ready-count" id="rpReadyCount">3</div><div class="rp-instruction-crowd" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`;
    let n=3;const tick=every(()=>{n--;const r=el('rpReadyCount');if(!r)return;if(n>0){r.textContent=n;playTone(420+n*80,.055,.018)}else{r.textContent='GO!';r.classList.add('is-go');sfx('start');gameCallout('GO!','MAKE IT COUNT','great')}},620);
    later(()=>{clearInterval(tick);if(RP.finished)return;el('rpDom').innerHTML='';canvas.style.visibility='visible';canvas.focus({preventScroll:true});RP.startedAt=performance.now();launchGame(g.id)},2200);
    clearInterval(RP.uiTimer);RP.uiTimer=setInterval(()=>{if(!RP.open||RP.state?.phase!=='live')return;el('rpGameTimer').textContent=gameSeconds().toFixed(1);if(gameSeconds()<=.12&&!RP.finished)void finishGame()},80);
  }
  function launchGame(id){if(RP.finished)return;const fn={goblin_bomb_party:gameBomb,potion_panic:gamePotion,fishing_frenzy:gameFishing,chopping_frenzy:gameChop,builder_blitz:gameBuilder,minecart_mayhem:gameMinecart,rooftop_rush:gameRooftop,chicken_chase:gameChicken,treasure_tiles:gameTiles,goblin_says:gameSays,gold_rush:gameGold,dont_wake_troll:gameTroll}[id]||gameFishing;fn()}
  async function finishGame(stateOverride=null){
    if(RP.finished)return;const activeState=stateOverride||RP.state;RP.finished=true;cleanupScope();
    if(!RP.joined||RP.queued||!activeState?.playing)return;
    const elapsed=Math.max(1,(performance.now()-RP.startedAt)/1000);RP.participation=Math.max(RP.participation,Math.min(1,RP.inputCount/8),Math.min(.45,elapsed/55));
    showLockedIn();
    try{RP.submitting=true;await rpc('reparty_submit_score',{p_round_no:Number(activeState.round_no),p_score:Number(RP.score.toFixed(2)),p_participation:Number(RP.participation.toFixed(3))})}catch(err){console.warn('REPARTY score submit',err)}finally{RP.submitting=false}
  }
  function showLockedIn(){
    const dom=el('rpDom');if(!dom)return;dom.querySelector('.rp-lockedin')?.remove();const box=document.createElement('div');box.className='rp-lockedin';box.innerHTML=`<span>RUN LOCKED IN</span><strong>${Math.round(RP.rawScore)} SCORE</strong><small>Finalising the six-player table…</small>`;dom.appendChild(box);fanfare();
  }
  function cleanupGame(clearTimer=true,clearVisuals=true){if(clearTimer){clearInterval(RP.uiTimer);RP.uiTimer=0}cleanupScope();RP.keys.clear();if(clearVisuals){const canvas=el('rpCanvas');if(canvas){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);canvas.style.visibility='visible'}if(el('rpDom')){el('rpDom').innerHTML='';el('rpDom').className='rp-dom-layer'}}}

  function canvasEnv(){
    const c=el('rpCanvas'),r=c.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);c.width=Math.max(640,Math.round(r.width*dpr));c.height=Math.max(400,Math.round(r.height*dpr));const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;return {c,ctx,w:r.width,h:r.height,dpr};
  }
  function rounded(ctx,x,y,w,h,r=8){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath()}
  function pxText(ctx,text,x,y,size=11,color='#fff',align='center',weight=900){ctx.fillStyle=color;ctx.font=`${weight} ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(text),x,y)}
  function drawShadow(ctx,x,y,rx=20,ry=7,a=.3){ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
  function drawCharacter(ctx,a,x,y,opt={}){
    const scale=opt.scale||1,color=opt.color||a.color||'#63e4ff',dead=opt.dead||false,human=Boolean(a.human||currentUser(a));
    drawShadow(ctx,x,y+21*scale,19*scale,6*scale,dead?.12:.34);ctx.save();ctx.translate(Math.round(x),Math.round(y));if(dead)ctx.globalAlpha=.28;
    const bob=dead?0:Math.sin(performance.now()/210+(String(a.name||a.username||'').length))*1.1*scale;ctx.translate(0,bob);
    // legs + boots
    ctx.fillStyle='#151b29';ctx.fillRect(-9*scale,10*scale,7*scale,10*scale);ctx.fillRect(2*scale,10*scale,7*scale,10*scale);ctx.fillStyle='#080c14';ctx.fillRect(-11*scale,17*scale,9*scale,4*scale);ctx.fillRect(2*scale,17*scale,9*scale,4*scale);
    // body outline and tunic
    ctx.fillStyle='#0c1220';rounded(ctx,-15*scale,-8*scale,30*scale,25*scale,6*scale);ctx.fill();ctx.fillStyle=color;rounded(ctx,-12.5*scale,-6*scale,25*scale,21*scale,5*scale);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(-9*scale,-3*scale,3*scale,13*scale);ctx.fillStyle='#111a2a';ctx.fillRect(-12*scale,7*scale,25*scale,4*scale);
    // arms
    ctx.strokeStyle='#0b111d';ctx.lineWidth=6*scale;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-10*scale,-1*scale);ctx.lineTo(-17*scale,7*scale);ctx.moveTo(10*scale,-1*scale);ctx.lineTo(17*scale,7*scale);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=3.5*scale;ctx.beginPath();ctx.moveTo(-10*scale,-1*scale);ctx.lineTo(-17*scale,7*scale);ctx.moveTo(10*scale,-1*scale);ctx.lineTo(17*scale,7*scale);ctx.stroke();
    // head + hair/hat
    ctx.fillStyle='#0b111d';rounded(ctx,-12*scale,-28*scale,24*scale,20*scale,6*scale);ctx.fill();ctx.fillStyle='#efd0b4';rounded(ctx,-10*scale,-26*scale,20*scale,17*scale,5*scale);ctx.fill();ctx.fillStyle='#34283a';ctx.fillRect(-10*scale,-26*scale,20*scale,5*scale);ctx.fillRect(-9*scale,-23*scale,4*scale,3*scale);
    ctx.fillStyle='#172033';ctx.fillRect(-6*scale,-19*scale,2.5*scale,2.5*scale);ctx.fillRect(4*scale,-19*scale,2.5*scale,2.5*scale);ctx.fillStyle='#a85f5b';ctx.fillRect(-1.5*scale,-14*scale,4*scale,1.5*scale);
    if(human&&!dead){ctx.strokeStyle='#ffe26d';ctx.lineWidth=2*scale;ctx.beginPath();ctx.arc(0,-17*scale,17*scale,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffe26d';ctx.fillRect(-6*scale,-34*scale,12*scale,2*scale);ctx.fillRect(-5*scale,-37*scale,2*scale,4*scale);ctx.fillRect(0,-39*scale,2*scale,6*scale);ctx.fillRect(5*scale,-37*scale,2*scale,4*scale)}
    ctx.restore();
    if(opt.label!==false){pxText(ctx,a.name||a.username,x,y+34*scale,8,dead?'#75839e':'#eaf3ff','center',800);if(human&&!dead)pxText(ctx,'YOU',x,y+45*scale,7,'#ffe27d')}
  }


  function drawPartyArena(ctx,w,h,t,remaining=6){
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#11172f');sky.addColorStop(.55,'#241b3e');sky.addColorStop(1,'#0b101d');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    // crowd terraces
    for(let row=0;row<3;row++){const yy=28+row*22;ctx.fillStyle=['#17243c','#1d2945','#101b31'][row];ctx.fillRect(0,yy,w,17);for(let i=0;i<Math.ceil(w/18);i++){const x=i*18+(row%2)*9,phase=(i*7+row*11)%6;ctx.fillStyle=['#ff6f88','#63e4ff','#ffd05e','#73eba4','#a77cff','#ff9a58'][phase]+'88';ctx.beginPath();ctx.arc(x+7,yy+7,3,0,Math.PI*2);ctx.fill()}}
    // spotlights
    ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<4;i++){const x=(i+.5)*w/4,sw=Math.sin(t/900+i)*.22;ctx.fillStyle=`rgba(${i%2?99:255},${i%2?228:111},${i%2?255:136},.045)`;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(w*.35+x*sw,h*.74);ctx.lineTo(w*.65+x*sw,h*.74);ctx.closePath();ctx.fill()}ctx.restore();
    const cx=w/2,cy=h*.56,rx=w*.43*(.86+remaining*.023),ry=h*.34*(.86+remaining*.023);drawShadow(ctx,cx,cy+ry*.72,rx*.88,ry*.24,.36);const floor=ctx.createRadialGradient(cx,cy,20,cx,cy,rx);floor.addColorStop(0,'#46335d');floor.addColorStop(.72,'#242949');floor.addColorStop(1,'#11192c');ctx.fillStyle=floor;ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#9d7fe0';ctx.lineWidth=3;ctx.stroke();ctx.strokeStyle='#ffd45e88';ctx.lineWidth=1;for(let r=.25;r<1;r+=.2){ctx.beginPath();ctx.ellipse(cx,cy,rx*r,ry*r,0,0,Math.PI*2);ctx.stroke()}for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.fillStyle=i%2?'#63e4ff':'#ff6f88';ctx.fillRect(cx+Math.cos(a)*rx*.93-3,cy+Math.sin(a)*ry*.93-3,6,6)}
    // centre crest
    ctx.globalAlpha=.18;ctx.fillStyle='#ffe06a';ctx.beginPath();ctx.arc(cx,cy,52,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;pxText(ctx,'RP',cx,cy,28,'#ffe06a');
  }
  function drawLakeBackdrop(ctx,w,h,t,waterY){
    const sky=ctx.createLinearGradient(0,0,0,waterY);sky.addColorStop(0,'#142449');sky.addColorStop(.55,'#406e86');sky.addColorStop(1,'#e29576');ctx.fillStyle=sky;ctx.fillRect(0,0,w,waterY);
    const sunX=w*.78,sunY=waterY*.24;ctx.fillStyle='#ffd887';ctx.beginPath();ctx.arc(sunX,sunY,26,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.16;ctx.beginPath();ctx.arc(sunX,sunY,52,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    // mountains + pine line
    ctx.fillStyle='#263e58';ctx.beginPath();ctx.moveTo(0,waterY*.72);for(let x=0;x<=w;x+=70){ctx.lineTo(x,waterY*.72-40-Math.sin(x*.021)*34)}ctx.lineTo(w,waterY);ctx.lineTo(0,waterY);ctx.fill();ctx.fillStyle='#173748';for(let x=0;x<w;x+=24){const bh=22+(x*7%35);ctx.beginPath();ctx.moveTo(x,waterY);ctx.lineTo(x+8,waterY-bh);ctx.lineTo(x+16,waterY);ctx.fill()}
    const water=ctx.createLinearGradient(0,waterY,0,h);water.addColorStop(0,'#235d7c');water.addColorStop(1,'#0d3158');ctx.fillStyle=water;ctx.fillRect(0,waterY,w,h-waterY);for(let y=waterY+10;y<h;y+=15){ctx.strokeStyle=`rgba(122,230,244,${.08+(y-waterY)/h*.08})`;ctx.lineWidth=1.5;ctx.beginPath();for(let x=0;x<=w;x+=18){const yy=y+Math.sin(x*.035+t*.002+y)*2;ctx.lineTo(x,yy)}ctx.stroke()}
    // dock with planks and posts
    ctx.fillStyle='#4f3328';ctx.fillRect(0,waterY-20,w*.23,34);ctx.fillStyle='#8a5d3c';for(let x=0;x<w*.23;x+=27){ctx.fillRect(x,waterY-22,24,28);ctx.fillStyle='#583728';ctx.fillRect(x+22,waterY-22,2,28);ctx.fillStyle='#8a5d3c'}ctx.fillStyle='#3d2a24';ctx.fillRect(w*.04,waterY+4,8,48);ctx.fillRect(w*.19,waterY+4,8,52);
    // reeds
    ctx.strokeStyle='#6d8a54';ctx.lineWidth=2;for(let i=0;i<16;i++){const x=w*.24+i*9;ctx.beginPath();ctx.moveTo(x,waterY+8);ctx.lineTo(x+Math.sin(t*.001+i)*3,waterY-14-(i%4)*5);ctx.stroke()}
  }
  function drawForestBackdrop(ctx,w,h,t){
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#152b43');sky.addColorStop(.55,'#31584a');sky.addColorStop(1,'#183b2b');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<4;i++){ctx.fillStyle='rgba(226,255,196,.035)';ctx.beginPath();ctx.moveTo(w*(.18+i*.22),0);ctx.lineTo(w*(.02+i*.19),h);ctx.lineTo(w*(.28+i*.19),h);ctx.fill()}ctx.restore();
    // distant trunks
    for(let layer=0;layer<2;layer++){ctx.fillStyle=layer?'#193d2d':'#1d4938';for(let x=-20;x<w+40;x+=55-layer*9){const sway=Math.sin(t*.0008+x)*2;ctx.fillRect(x+sway,40+layer*18,10+layer*4,h);ctx.beginPath();ctx.arc(x+5+sway,65+layer*20,35+layer*8,0,Math.PI*2);ctx.fill()}}
    const ground=ctx.createLinearGradient(0,h*.6,0,h);ground.addColorStop(0,'#285a38');ground.addColorStop(1,'#173023');ctx.fillStyle=ground;ctx.fillRect(0,h*.62,w,h*.38);ctx.fillStyle='#3b6a3f';for(let i=0;i<90;i++){const x=(i*83)%w,y=h*.64+((i*47)%(h*.33));ctx.fillRect(x,y,2,5+(i%4))}for(let i=0;i<8;i++){const x=(i*131+40)%w,y=h*.7+(i%3)*44;ctx.fillStyle=i%2?'#f0cf65':'#85d88c';ctx.fillRect(x,y,3,3)}
  }
  function drawMineTunnel(ctx,w,h,t,distance,laneX,pathY){
    const top=h*.14;ctx.fillStyle='#0b0b13';ctx.fillRect(0,0,w,h);const wall=ctx.createLinearGradient(0,0,w,0);wall.addColorStop(0,'#231d2e');wall.addColorStop(.25,'#151421');wall.addColorStop(.5,'#0e101b');wall.addColorStop(.75,'#151421');wall.addColorStop(1,'#231d2e');ctx.fillStyle=wall;ctx.fillRect(0,0,w,h);
    // tunnel opening / perspective floor
    ctx.fillStyle='#17131e';ctx.beginPath();ctx.moveTo(0,h);ctx.lineTo(w*.34,top);ctx.lineTo(w*.66,top);ctx.lineTo(w,h);ctx.fill();ctx.strokeStyle='#3d3346';ctx.lineWidth=2;for(let i=0;i<8;i++){const z=(i/8+(distance*.01)%(.125))%1,y=pathY(z),spread=w*.47*z+12;ctx.beginPath();ctx.moveTo(w/2-spread,y);ctx.lineTo(w/2+spread,y);ctx.stroke()}
    // cave ribs + stalactites
    ctx.strokeStyle='#332a38';ctx.lineWidth=6;for(let i=0;i<7;i++){const x=i*w/6;ctx.beginPath();ctx.moveTo(x,0);ctx.quadraticCurveTo(w/2,top*.35,w-x,0);ctx.stroke()}ctx.fillStyle='#2c2431';for(let i=0;i<13;i++){const x=(i*97)%w,hh=18+(i*17)%55;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+10,hh);ctx.lineTo(x+20,0);ctx.fill()}
    // torches
    for(let side of [-1,1])for(let i=0;i<3;i++){const z=.22+i*.25,x=laneX(side*1.65,z),y=pathY(z)-20;const gl=ctx.createRadialGradient(x,y,2,x,y,38);gl.addColorStop(0,'rgba(255,187,77,.42)');gl.addColorStop(1,'rgba(255,120,30,0)');ctx.fillStyle=gl;ctx.fillRect(x-40,y-40,80,80);ctx.fillStyle='#ffbf55';ctx.fillRect(x-2,y-5,4,9)}
    // rails
    for(let i=-1;i<=1;i++){ctx.strokeStyle='#9a8b91';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(laneX(i,.06),pathY(.06));ctx.lineTo(laneX(i,1.05),pathY(1.05));ctx.stroke();ctx.strokeStyle='#493f49';for(let z=.12;z<1;z+=.09){const y=pathY(z),x=laneX(i,z),spread=22*z+4;ctx.beginPath();ctx.moveTo(x-spread,y);ctx.lineTo(x+spread,y);ctx.stroke()}}
    // speed dust
    ctx.strokeStyle='rgba(210,205,224,.12)';for(let i=0;i<24;i++){const x=(i*83+t*.12)%w,y=(i*47+t*.06)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-10-(i%4)*3,y-4);ctx.stroke()}
  }
  function drawCityRooftops(ctx,w,h,t,distance,ground){
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#111c44');sky.addColorStop(.52,'#65436d');sky.addColorStop(1,'#d07573');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);ctx.fillStyle='#e8d5c0';ctx.beginPath();ctx.arc(w*.78,h*.16,24,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.1;ctx.beginPath();ctx.arc(w*.78,h*.16,50,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    // clouds
    ctx.fillStyle='rgba(219,194,209,.10)';for(let i=0;i<5;i++){const x=((i*220-distance*1.4)% (w+220))-80,y=70+i%2*45;ctx.beginPath();ctx.ellipse(x,y,75,16,0,0,Math.PI*2);ctx.fill()}
    for(let layer=0;layer<4;layer++){const base=h*(.39+layer*.075),spd=(distance*(layer+1)*.5)%(110-layer*10),col=['#293351','#232b45','#1b253b','#131d31'][layer];ctx.fillStyle=col;for(let x=-130-spd;x<w+130;x+=100-layer*8){const bh=58+((Math.abs(Math.floor(x))+layer*37)%100);ctx.fillRect(x,base-bh,65+layer*2,bh);if(layer<2){ctx.fillStyle='rgba(255,215,142,.20)';for(let wy=base-bh+15;wy<base-12;wy+=20)for(let wx=x+12;wx<x+54;wx+=18)if(((wx+wy+layer*7)|0)%3===0)ctx.fillRect(wx,wy,5,7);ctx.fillStyle=col}}}
    ctx.fillStyle='#2a2834';ctx.fillRect(0,ground+20,w,h-ground);ctx.fillStyle='#6c4c5c';ctx.fillRect(0,ground+18,w,7);ctx.strokeStyle='#3b3440';for(let x=0;x<w;x+=38){ctx.beginPath();ctx.moveTo(x,ground+28);ctx.lineTo(x+20,ground+45);ctx.stroke()}
    // rooftop vents / chimneys
    ctx.fillStyle='#343746';for(let i=0;i<5;i++){const x=((i*190-distance*2.2)% (w+180))-60;ctx.fillRect(x,ground-22,28,42);ctx.fillStyle='#55515b';ctx.fillRect(x-3,ground-26,34,7);ctx.fillStyle='#343746'}
  }
  function drawFarmBackdrop(ctx,w,h,t){
    const sky=ctx.createLinearGradient(0,0,0,h*.38);sky.addColorStop(0,'#4f88a5');sky.addColorStop(1,'#c6d999');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h*.38);ctx.fillStyle='#e8d276';ctx.beginPath();ctx.arc(w*.78,h*.12,22,0,Math.PI*2);ctx.fill();
    // hills
    ctx.fillStyle='#517f51';ctx.beginPath();ctx.moveTo(0,h*.34);ctx.quadraticCurveTo(w*.2,h*.22,w*.42,h*.35);ctx.quadraticCurveTo(w*.7,h*.19,w,h*.34);ctx.lineTo(w,h*.5);ctx.lineTo(0,h*.5);ctx.fill();
    const grass=ctx.createLinearGradient(0,h*.32,0,h);grass.addColorStop(0,'#397047');grass.addColorStop(1,'#1f5137');ctx.fillStyle=grass;ctx.fillRect(0,h*.34,w,h*.66);
    // barn
    ctx.fillStyle='#833e37';ctx.fillRect(38,h*.18,125,95);ctx.beginPath();ctx.moveTo(25,h*.18);ctx.lineTo(100,h*.08);ctx.lineTo(176,h*.18);ctx.fill();ctx.fillStyle='#e4d4b3';ctx.fillRect(82,h*.22,38,57);ctx.strokeStyle='#8b624c';ctx.strokeRect(82,h*.22,38,57);ctx.beginPath();ctx.moveTo(82,h*.22);ctx.lineTo(120,h*.79);ctx.moveTo(120,h*.22);ctx.lineTo(82,h*.79);ctx.stroke();
    // hay + mud + flowers
    ctx.fillStyle='#c99b49';for(let i=0;i<3;i++){ctx.fillRect(w*.78+i*34,h*.63+(i%2)*18,30,22)}ctx.fillStyle='#5d4b37';ctx.beginPath();ctx.ellipse(w*.65,h*.72,70,25,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#78a34c';for(let i=0;i<70;i++){const x=(i*73)%w,y=h*.39+((i*47)%(h*.56));ctx.fillRect(x,y,2,4)}ctx.fillStyle='#ffd36a';for(let i=0;i<14;i++){const x=(i*113)%w,y=h*.46+((i*71)%(h*.44));ctx.fillRect(x,y,3,3)}
    // fence
    ctx.strokeStyle='#d4aa72';ctx.lineWidth=5;ctx.strokeRect(24,24,w-48,h-48);ctx.lineWidth=2;for(let x=35;x<w-35;x+=35){ctx.beginPath();ctx.moveTo(x,25);ctx.lineTo(x,46);ctx.moveTo(x,h-25);ctx.lineTo(x,h-46);ctx.stroke()}
  }
  function drawSkyArenaBackdrop(ctx,w,h,t){
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#101735');sky.addColorStop(.52,'#273d6b');sky.addColorStop(1,'#5a6f8f');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);for(let i=0;i<26;i++){const x=(i*151)%w,y=(i*83)%Math.max(80,h*.58);ctx.fillStyle='rgba(255,255,255,.28)';ctx.fillRect(x,y,1+(i%2),1+(i%2))}
    ctx.fillStyle='rgba(213,230,245,.13)';for(let i=0;i<7;i++){const x=((i*180+t*.014)%(w+220))-100,y=h*.68+(i%3)*26;ctx.beginPath();ctx.ellipse(x,y,90,23,0,0,Math.PI*2);ctx.fill()}
    // distant floating islands
    ctx.fillStyle='#263856';for(let i=0;i<4;i++){const x=w*(.12+i*.25),y=h*(.24+(i%2)*.12);ctx.beginPath();ctx.moveTo(x-45,y);ctx.lineTo(x+45,y);ctx.lineTo(x+15,y+34);ctx.lineTo(x-10,y+48);ctx.closePath();ctx.fill();ctx.fillStyle='#4f6e68';ctx.fillRect(x-43,y-5,86,7);ctx.fillStyle='#263856'}
  }
  function drawCaveBackdrop(ctx,w,h,t){
    const g=ctx.createRadialGradient(w*.44,h*.48,20,w*.44,h*.48,w*.7);g.addColorStop(0,'#453241');g.addColorStop(.48,'#241d2a');g.addColorStop(1,'#0a0d15');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle='#302635';for(let i=0;i<14;i++){const x=(i*91)%w,hh=20+(i*29)%70;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+12,hh);ctx.lineTo(x+24,0);ctx.fill()}ctx.fillStyle='#2f2633';for(let i=0;i<60;i++){const x=(i*79)%w,y=(i*53)%h;ctx.fillRect(x,y,3+(i%3),2)}
    for(const [x,y] of [[w*.16,h*.23],[w*.84,h*.28]]){const gl=ctx.createRadialGradient(x,y,2,x,y,75);gl.addColorStop(0,'rgba(255,183,74,.32)');gl.addColorStop(1,'rgba(255,120,30,0)');ctx.fillStyle=gl;ctx.fillRect(x-80,y-80,160,160);ctx.fillStyle='#ffbd55';ctx.fillRect(x-3,y-9,6,13)}
  }
  function drawSpark(ctx,x,y,t,color='#ffd76a'){for(let i=0;i<6;i++){const a=i/6*Math.PI*2+t*4,r=5+(i%2)*4;ctx.fillStyle=color;ctx.fillRect(Math.round(x+Math.cos(a)*r),Math.round(y+Math.sin(a)*r),2,2)}}
  function pointerPos(c,e){const r=c.getBoundingClientRect();return {x:(e.clientX-r.left),y:(e.clientY-r.top)}}
  function directional(){let dx=(RP.keys.has('d')||RP.keys.has('arrowright')?1:0)-(RP.keys.has('a')||RP.keys.has('arrowleft')?1:0),dy=(RP.keys.has('s')||RP.keys.has('arrowdown')?1:0)-(RP.keys.has('w')||RP.keys.has('arrowup')?1:0);if(dx&&dy){dx*=.707;dy*=.707}return {dx,dy}}
  function panel(ctx,x,y,w,h,title,value,color='#ffe078'){ctx.fillStyle='rgba(7,13,27,.76)';rounded(ctx,x,y,w,h,7);ctx.fill();ctx.strokeStyle='#526587';ctx.stroke();pxText(ctx,title,x+10,y+10,7,'#8ca2c7','left');pxText(ctx,value,x+10,y+27,13,color,'left')}
  function confettiBurst(container,count=18){for(let i=0;i<count;i++){const s=document.createElement('i');s.className='rp-confetti-bit';s.style.setProperty('--x',`${rand(-170,170)}px`);s.style.setProperty('--y',`${rand(70,190)}px`);s.style.setProperty('--r',`${irand(-180,180)}deg`);s.style.setProperty('--d',`${rand(.55,1.1)}s`);container.appendChild(s);later(()=>s.remove(),1200)}}

  /* --------------------------------------------------------------------------
     V22.22 — REPARTY GAMEPLAY REBUILD
     The minigames below are intentionally stateful, input-driven arcade games.
     They share the Reparty shell/reward contract, but no game is just a reskinned
     clicker. Every mode has its own risk, timing, movement or mastery loop.
     -------------------------------------------------------------------------- */

  function gameBomb(){
    const {c,ctx,w,h}=canvasEnv(), roster=contestantList();
    const actors=roster.map((p,i)=>({
      name:p.username,username:p.username,human:currentUser(p),bot:p.is_bot,color:COLORS[i],
      x:w/2+Math.cos(i/6*Math.PI*2)*w*.29,y:h/2+Math.sin(i/6*Math.PI*2)*h*.27,
      vx:0,vy:0,alive:true,passCd:0,dashCd:0,dashT:0,recvAt:0,noReturnTo:-1,noReturnUntil:0,
      think:rand(.08,.35),wander:rand(0,Math.PI*2),panic:0
    }));
    let holder=irand(0,actors.length-1), fuseEnds=performance.now()+rand(5200,6900), remaining=actors.length;
    let passes=0,dodges=0,humanPlacement=actors.length,flight=null,explosions=[],sparks=[],shake=0,lastPass=null;
    actors[holder].recvAt=performance.now();
    const liveIds=()=>actors.map((a,i)=>a.alive?i:-1).filter(i=>i>=0);
    const eligible=(from,to)=>{
      const a=actors[from],b=actors[to],t=performance.now();
      if(!a||!b||!a.alive||!b.alive||from===to||flight)return false;
      if(a.noReturnTo===to&&t<a.noReturnUntil)return false; // recipient cannot instantly send it back
      if(lastPass&&lastPass.to===from&&lastPass.from===to&&t-lastPass.at<1900)return false;
      return true;
    };
    const nearestEligible=(from,max=150,preferPoint=null)=>{
      let best=-1,bestScore=1e9;
      actors.forEach((b,i)=>{
        if(!eligible(from,i))return;
        const d=dist(actors[from],b);if(d>max)return;
        const cursorBias=preferPoint?Math.hypot(b.x-preferPoint.x,b.y-preferPoint.y)*.75:0;
        const recentBias=lastPass?.from===i?90:0;
        const score=d+cursorBias+recentBias;
        if(score<bestScore){bestScore=score;best=i}
      });
      return best;
    };
    const beginPass=(from,to,kind='pass')=>{
      if(!eligible(from,to)||from!==holder)return false;
      const a=actors[from],b=actors[to],t=performance.now();
      a.passCd=.42;
      if(window.__REPARTY_QA__){(window.__REPARTY_BOMB_TRACE||(window.__REPARTY_BOMB_TRACE=[])).push({from,to,at:t});}
      flight={from,to,x0:a.x,y0:a.y-26,t0:t,dur:kind==='throw'?.30:.22,kind};
      if(a.human){passes++;activity(.12);if(passes%4===0)gameCallout(`PASS STREAK x${passes}`,'NO INSTANT RETURN · KEEP ROTATING','great')}
      sfx('good');return true;
    };
    const finishPass=()=>{
      if(!flight)return;const {from,to}=flight,t=performance.now();
      holder=to;lastPass={from,to,at:t};actors[to].recvAt=t;actors[to].noReturnTo=from;actors[to].noReturnUntil=t+1900;
      actors[from].noReturnTo=-1;flight=null;
    };
    const humanIndex=()=>actors.findIndex(a=>a.human&&a.alive);
    const dashHuman=()=>{
      const i=humanIndex();if(i<0)return;const a=actors[i];if(a.dashCd>0)return;
      const {dx,dy}=directional();let vx=dx,vy=dy;if(!vx&&!vy){vx=Math.cos(a.wander);vy=Math.sin(a.wander)}
      a.vx+=vx*430;a.vy+=vy*430;a.dashCd=1.9;a.dashT=.16;activity(.08);playTone(350,.035,.014,'sawtooth');
    };
    listen(window,'keydown',e=>{if(e.code==='Space'){dashHuman();e.preventDefault()}},{passive:false});
    listen(c,'pointerdown',e=>{
      if(RP.finished||flight)return;const hi=humanIndex();if(hi<0||holder!==hi||actors[hi].passCd>0)return;
      const p=pointerPos(c,e),to=nearestEligible(hi,220,p);
      if(to>=0){beginPass(hi,to,'throw');scoreBurst('THROW!',actors[to].x/w*100,actors[to].y/h*100,'good')}
      else toast('Aim near another contestant to throw the bomb.');
    });
    const blast=()=>{
      if(flight)finishPass();const victim=actors[holder];if(!victim?.alive)return;
      victim.alive=false;remaining--;humanPlacement= victim.human?remaining+1:humanPlacement;
      explosions.push({x:victim.x,y:victim.y,t:0});shake=.55;gameCallout(`${victim.name} OUT!`,`${remaining} STILL ALIVE`,'boom');
      if(victim.human)setScore(passes+dodges*2,{6:28,5:40,4:55,3:71,2:87,1:100}[humanPlacement]||28,1);
      const live=liveIds();if(live.length<=1){if(live.length&&actors[live[0]].human){humanPlacement=1;setScore(passes+dodges*2+8,100,1)}later(()=>void finishGame(),850);return}
      holder=choose(live);actors[holder].recvAt=performance.now();actors[holder].noReturnTo=-1;lastPass=null;
      fuseEnds=performance.now()+rand(Math.max(3000,5000-(6-remaining)*260),Math.max(4100,6200-(6-remaining)*240));
    };
    loop((dt,t)=>{
      const nowP=performance.now();
      if(flight&&nowP-flight.t0>=flight.dur*1000)finishPass();
      actors.forEach((a,i)=>{
        if(!a.alive)return;a.passCd=Math.max(0,a.passCd-dt);a.dashCd=Math.max(0,a.dashCd-dt);a.dashT=Math.max(0,a.dashT-dt);a.think-=dt;
        if(a.human){
          const {dx,dy}=directional();if(dx||dy){activity(.004);a.vx+=dx*850*dt;a.vy+=dy*850*dt;a.wander=Math.atan2(dy,dx)}
        }else{
          if(a.think<=0){a.think=rand(.10,.24);a.wander+=rand(-.8,.8)}
          const bomb=actors[holder];
          if(i===holder&&!flight){
            const heldFor=(nowP-a.recvAt)/1000;
            const candidates=liveIds().filter(j=>eligible(i,j));
            let target=candidates.sort((u,v)=>dist(a,actors[u])-dist(a,actors[v]))[0];
            // AI must carry it briefly and deliberately rotate away from the passer.
            if(heldFor>rand(.72,1.05)&&target!=null){
              const b=actors[target],d=Math.max(1,dist(a,b));a.vx+=(b.x-a.x)/d*500*dt;a.vy+=(b.y-a.y)/d*500*dt;
              if(d<128&&a.passCd<=0&&Math.random()<dt*4.2)beginPass(i,target,'throw');
            }
          }else if(bomb?.alive){
            const d=Math.max(1,dist(a,bomb));const panic=d<175?1:0;
            a.panic=lerp(a.panic,panic,clamp(dt*5,0,1));
            const flee=d<190?1:-.08;a.vx+=(a.x-bomb.x)/d*flee*360*dt;a.vy+=(a.y-bomb.y)/d*flee*360*dt;
            a.vx+=Math.cos(a.wander)*90*dt;a.vy+=Math.sin(a.wander)*90*dt;
          }
        }
        a.vx*=Math.pow(.055,dt);a.vy*=Math.pow(.055,dt);const sp=Math.hypot(a.vx,a.vy),max=a.dashT>0?420:190;if(sp>max){a.vx=a.vx/sp*max;a.vy=a.vy/sp*max}
        a.x=clamp(a.x+a.vx*dt,42,w-42);a.y=clamp(a.y+a.vy*dt,72,h-50);
      });
      // Contact transfer exists, but the no-return lock is still respected.
      if(!flight&&actors[holder]?.alive&&actors[holder].passCd<=0){
        const to=nearestEligible(holder,37);if(to>=0)beginPass(holder,to,'pass');
      }
      // Dash bump gives the human a defensive skill play.
      const hi=humanIndex();if(hi>=0&&actors[hi].dashT>0){
        actors.forEach((b,j)=>{if(j===hi||!b.alive)return;const d=dist(actors[hi],b);if(d<42){const nx=(b.x-actors[hi].x)/Math.max(1,d),ny=(b.y-actors[hi].y)/Math.max(1,d);b.vx+=nx*190;b.vy+=ny*190;if(holder===hi&&eligible(hi,j)){dodges++;beginPass(hi,j,'pass')}}})
      }
      explosions.forEach(x=>x.t+=dt);explosions=explosions.filter(x=>x.t<.72);sparks.forEach(x=>x.t+=dt);sparks=sparks.filter(x=>x.t<.4);shake=Math.max(0,shake-dt);
      if(nowP>=fuseEnds)blast();
      if(humanPlacement===6){const hA=actors.find(a=>a.human);if(hA?.alive)setScore(passes+dodges*2,clamp(30+(6-remaining)*11+passes*3.2+dodges*2,0,97),RP.participation)}
    },t=>{
      ctx.save();if(shake>0)ctx.translate(rand(-6,6)*shake*3,rand(-5,5)*shake*3);drawPartyArena(ctx,w,h,t,remaining);
      // arena obstacles create routes rather than one empty circle
      ctx.fillStyle='#26324b';for(const [x,y,ww,hh] of [[w*.24,h*.28,72,26],[w*.68,h*.30,80,24],[w*.46,h*.67,94,28]]){rounded(ctx,x,y,ww,hh,8);ctx.fill();ctx.strokeStyle='#55698f';ctx.stroke()}
      actors.forEach((a,i)=>{drawCharacter(ctx,a,a.x,a.y,{color:a.color,dead:!a.alive,scale:a.dashT>0?1.08:1});if(!a.alive)return;if(i===holder&&!flight){ctx.fillStyle='#17131a';ctx.beginPath();ctx.arc(a.x+23,a.y-31,11,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffbd45';ctx.fillRect(a.x+18,a.y-43,3,8);drawSpark(ctx,a.x+20,a.y-46,t/1000);const left=Math.max(0,(fuseEnds-performance.now())/1000);ctx.strokeStyle=left<1.5?'#ff5e69':'#ffd25f';ctx.lineWidth=4;ctx.beginPath();ctx.arc(a.x,a.y,33,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(left/6.7,0,1));ctx.stroke();if(a.noReturnTo>=0&&performance.now()<a.noReturnUntil){pxText(ctx,'NO RETURN',a.x,a.y-55,7,'#ffcc72')}}});
      if(flight){const p=clamp((performance.now()-flight.t0)/(flight.dur*1000),0,1),from=actors[flight.from],to=actors[flight.to],x=lerp(flight.x0,to.x,p),y=lerp(flight.y0,to.y-24,p)-Math.sin(p*Math.PI)*40;ctx.fillStyle='#151118';ctx.beginPath();ctx.arc(x,y,11,0,Math.PI*2);ctx.fill();drawSpark(ctx,x+3,y-11,t/1000);ctx.strokeStyle='rgba(255,220,110,.45)';ctx.beginPath();ctx.moveTo(from.x,from.y-22);ctx.quadraticCurveTo((from.x+to.x)/2,(from.y+to.y)/2-65,to.x,to.y-22);ctx.stroke()}
      explosions.forEach(e=>{const p=e.t/.72;ctx.fillStyle=`rgba(255,195,70,${1-p})`;ctx.beginPath();ctx.arc(e.x,e.y,18+p*80,0,Math.PI*2);ctx.fill();ctx.fillStyle=`rgba(255,70,70,${.75*(1-p)})`;ctx.beginPath();ctx.arc(e.x,e.y,9+p*46,0,Math.PI*2);ctx.fill()});
      panel(ctx,14,14,118,45,'SURVIVORS',`${remaining} / 6`);panel(ctx,142,14,118,45,'YOUR PASSES',passes,'#72e8ff');panel(ctx,w-132,14,118,45,'DASH','SPACE','#ffe078');ctx.restore();
    });
  }

  function gamePotion(){
    const dom=el('rpDom');dom.classList.add('rp-dom-full');
    const ingredients=[['EMBERLEAF','ember','✦'],['MOONCAP','moon','◆'],['SLIME DEW','slime','●'],['STAR ROOT','star','▲'],['FROSTBERRY','frost','■'],['SUNSALT','sun','✚']];
    let round=0,total=0,correctTotal=0,attempts=0,phase='preview',recipe=[],index=0,started=0,needle=.05,needleDir=1,sealZone=[.43,.61],cleanRounds=0;
    const renderShell=(title)=>{dom.innerHTML=`<div class="rp-potion-scene rp-potion-pro"><div class="rp-alchemy-shelf"><i></i><i></i><i></i><i></i><i></i></div><div class="rp-potion-board"><span class="rp-kicker">RECIPE ${round}</span><h3>${title}</h3><div class="rp-recipe-line" id="rpRecipeLine"></div><div class="rp-potion-status" id="rpPotionStatus"></div><div class="rp-distill-meter" id="rpDistillMeter" hidden><span></span><i id="rpDistillZone"></i><b id="rpDistillNeedle"></b></div></div><button class="rp-cauldron rp-cauldron-button" id="rpCauldron" type="button" aria-label="Seal brew"><i></i><b></b><span></span><em>SEAL</em></button><div class="rp-lab-lights"><i></i><i></i><i></i></div></div>`};
    const nextRecipe=()=>{
      if(RP.finished)return;round++;phase='preview';const len=clamp(3+Math.floor(round/2),3,6);recipe=Array.from({length:len},()=>choose(ingredients));index=0;renderShell('MEMORISE THE ORDER');
      el('rpRecipeLine').innerHTML=recipe.map((x,i)=>`<div class="rp-ingredient-card is-preview ing-${x[1]}" style="--delay:${i*.07}s"><b>${x[2]}</b><small>${x[0]}</small></div>`).join('');el('rpPotionStatus').innerHTML='<strong>WATCH CLOSELY</strong><span>Then finish the brew at the right heat.</span>';
      later(()=>openTray(),1650);
    };
    const openTray=()=>{
      if(RP.finished)return;phase='mix';started=performance.now();renderShell('BUILD THE RECIPE');const line=el('rpRecipeLine');line.innerHTML=ingredients.map(x=>`<button class="rp-ingredient-card ing-${x[1]}" data-ing="${x[0]}"><b>${x[2]}</b><small>${x[0]}</small></button>`).join('');el('rpPotionStatus').innerHTML=`<strong>0 / ${recipe.length}</strong><span>CLEAN BREW</span>`;line.querySelectorAll('button').forEach(btn=>listen(btn,'click',()=>pick(btn)));listen(el('rpCauldron'),'click',seal);};
    const pick=btn=>{
      if(phase!=='mix'||RP.finished)return;activity(.09);attempts++;const target=recipe[index];
      if(btn.dataset.ing===target[0]){correctTotal++;index++;btn.classList.add('is-correct');playTone(700+index*45,.04,.018);later(()=>btn.classList.remove('is-correct'),150);el('rpPotionStatus').innerHTML=`<strong>${index} / ${recipe.length}</strong><span>${attempts===correctTotal?'CLEAN BREW':'RECOVERED'}</span>`;if(index>=recipe.length)beginDistill()}
      else{btn.classList.add('is-wrong');total=Math.max(0,total-2);gameCallout('WRONG INGREDIENT','ORDER MATTERS','bad');el('rpPotionStatus').innerHTML=`<strong>${index} / ${recipe.length}</strong><span>CONTAMINATION +1</span>`;later(()=>btn.classList.remove('is-wrong'),220)};
    };
    const beginDistill=()=>{
      phase='distill';needle=0;needleDir=1;const center=rand(.37,.68),half=Math.max(.07,.13-round*.005);sealZone=[clamp(center-half,.08,.8),clamp(center+half,.2,.92)];
      el('rpRecipeLine').innerHTML=recipe.map(x=>`<div class="rp-ingredient-card is-preview ing-${x[1]}"><b>${x[2]}</b><small>${x[0]}</small></div>`).join('');el('rpPotionStatus').innerHTML='<strong>DISTILLATION</strong><span>Seal when the needle crosses the gold band.</span>';const m=el('rpDistillMeter');m.hidden=false;el('rpDistillZone').style.left=`${sealZone[0]*100}%`;el('rpDistillZone').style.width=`${(sealZone[1]-sealZone[0])*100}%`;el('rpCauldron').classList.add('is-ready');
    };
    const seal=()=>{
      if(phase!=='distill'||RP.finished)return;activity(.12);phase='locked';const quality=needle>=sealZone[0]&&needle<=sealZone[1]?1:Math.max(0,1-Math.min(Math.abs(needle-sealZone[0]),Math.abs(needle-sealZone[1]))*4.2);const accuracy=correctTotal/Math.max(1,attempts),time=(performance.now()-started)/1000,gain=Math.round(recipe.length*7+quality*18+accuracy*10+Math.max(0,8-time));total+=gain;if(quality>.9&&attempts===correctTotal)cleanRounds++;
      setScore(total,clamp(accuracy*46+quality*34+Math.min(20,total*.18),0,100),1);el('rpCauldron').classList.add(quality>.75?'is-success':'is-error');el('rpPotionStatus').innerHTML=`<strong>${quality>.9?'MASTER BREW':quality>.65?'GOOD BREW':'UNSTABLE BREW'}</strong><span>${Math.round(quality*100)}% heat control · +${gain}</span>`;gameCallout(quality>.9?'MASTER BREW!':quality>.65?'BREW SEALED':'BREW WOBBLED',`${Math.round(quality*100)}% HEAT · +${gain}`,quality>.9?'great':quality>.65?'good':'bad');later(nextRecipe,850);
    };
    loop(dt=>{if(phase==='distill'){needle+=needleDir*dt*(1.35+round*.035);if(needle>=1){needle=1;needleDir=-1}else if(needle<=0){needle=0;needleDir=1}const n=el('rpDistillNeedle');if(n)n.style.left=`${needle*100}%`}},()=>{});
    listen(window,'keydown',e=>{if(e.code==='Space'&&phase==='distill'){seal();e.preventDefault()}},{passive:false});nextRecipe();
  }

  function gameFishing(){
    const {c,ctx,w,h}=canvasEnv();const waterY=h*.69,rod={x:w*.14,y:waterY-42};let fish=[],ripples=[],score=0,combo=0,best=0,spawn=0,cursor={x:w*.55,y:h*.45},hooked=null,tension=0,progress=0,breaks=0,castFlash=0;
    const spawnFish=()=>{const bad=Math.random()<.14,gold=!bad&&Math.random()<.08,rare=!bad&&!gold&&Math.random()<.16,dir=Math.random()<.5?1:-1,life=rand(1.25,2.05);fish.push({x:dir>0?-40:w+40,baseY:waterY+rand(-3,10),y:waterY,dir,age:0,life,arc:rand(60,135),speed:rand(120,205),bad,gold,rare,hit:false,wobble:rand(0,Math.PI*2)})};
    listen(c,'pointermove',e=>{cursor=pointerPos(c,e)});
    const cast=()=>{
      if(hooked||RP.finished)return;activity(.05);castFlash=.18;let target=null,bd=42;for(const f of fish){if(f.hit)return;const d=Math.hypot(cursor.x-f.x,cursor.y-f.y);if(d<bd){bd=d;target=f}}
      if(!target){combo=0;playTone(160,.03,.008);ripples.push({x:cursor.x,y:waterY,t:0});return}
      target.hit=true;if(target.bad){score=Math.max(0,score-3);combo=0;breaks++;gameCallout('JUNK HOOKED','LINE RESET','bad');ripples.push({x:target.x,y:waterY,t:0});return}
      hooked=target;tension=.26;progress=0;gameCallout(target.gold?'GOLDEN FISH HOOKED!':target.rare?'RARE FISH HOOKED!':'FISH ON!',target.gold?'REEL CAREFULLY':'TAP SPACE TO REEL',target.gold?'gold':'good');
    };
    listen(c,'pointerdown',e=>{cursor=pointerPos(c,e);cast()});
    const reel=()=>{
      if(!hooked||RP.finished)return;activity(.07);tension+=hooked.gold?.22:hooked.rare?.18:.15;progress+=hooked.gold?.18:hooked.rare?.25:.34;playTone(420+progress*240,.025,.01);
      if(tension>1.03){breaks++;combo=0;gameCallout('LINE SNAPPED!','TOO MUCH TENSION','bad');hooked=null;tension=0;progress=0;return}
      if(progress>=1){const gain=(hooked.gold?9:hooked.rare?4:2)+Math.min(4,Math.floor(combo/4));score+=gain;combo++;best=Math.max(best,combo);gameCallout(hooked.gold?'GOLDEN CATCH!':hooked.rare?'RARE CATCH!':'LANDED!',`+${gain} · COMBO x${combo}`,hooked.gold?'gold':combo%6===0?'great':'good');ripples.push({x:hooked.x,y:waterY,t:0});hooked=null;tension=0;progress=0;setScore(score,clamp(score*3+best*2-breaks*4,0,100),RP.participation)}
    };
    listen(window,'keydown',e=>{if(e.code==='Space'){reel();e.preventDefault()}},{passive:false});
    loop((dt,t)=>{
      spawn-=dt;if(spawn<=0){spawn=rand(.24,.48);spawnFish()}castFlash=Math.max(0,castFlash-dt);
      for(const f of fish){if(f.hit&&!hooked)continue;f.age+=dt;const p=f.age/f.life;f.x+=f.dir*f.speed*dt;f.y=f.baseY-Math.sin(clamp(p,0,1)*Math.PI)*f.arc+Math.sin(f.age*9+f.wobble)*3}
      fish=fish.filter(f=>f.age<f.life&&!(!hooked&&f.hit));ripples.forEach(r=>r.t+=dt);ripples=ripples.filter(r=>r.t<.75);
      if(hooked){hooked.x+=Math.sin(t*.008+hooked.wobble)*24*dt;hooked.y+=Math.cos(t*.011+hooked.wobble)*17*dt;tension=Math.max(.05,tension-dt*(hooked.gold?.12:.19));if(tension<.08&&progress>.2){progress=Math.max(0,progress-dt*.12)}setScore(score,clamp(score*3+best*2+progress*10-breaks*4,0,100),RP.participation)}else setScore(score,clamp(score*3+best*2-breaks*4,0,100),RP.participation)
    },t=>{
      drawLakeBackdrop(ctx,w,h,t,waterY);ctx.fillStyle='#69492e';ctx.fillRect(0,waterY+5,w*.22,h-waterY);ctx.fillStyle='#9c7044';ctx.fillRect(w*.02,waterY-8,w*.19,14);ctx.strokeStyle='#c8a06b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(rod.x,rod.y+15);ctx.lineTo(rod.x+25,rod.y-38);ctx.stroke();
      fish.forEach(f=>{if(f===hooked)return;ctx.fillStyle=f.bad?'#6b6872':f.gold?'#ffd34f':f.rare?'#b18cff':'#73d7e9';ctx.beginPath();ctx.ellipse(f.x,f.y,f.bad?14:18,f.bad?9:8,0,0,Math.PI*2);ctx.fill();if(!f.bad){ctx.beginPath();ctx.moveTo(f.x-f.dir*17,f.y);ctx.lineTo(f.x-f.dir*29,f.y-9);ctx.lineTo(f.x-f.dir*29,f.y+9);ctx.fill()}if(f.gold)drawSpark(ctx,f.x,f.y-16,t/1000,'#fff0a0')});
      ripples.forEach(r=>{ctx.strokeStyle=`rgba(155,231,255,${1-r.t/.75})`;ctx.beginPath();ctx.ellipse(r.x,r.y,8+r.t*35,3+r.t*12,0,0,Math.PI*2);ctx.stroke()});
      if(hooked){ctx.strokeStyle=tension>.82?'#ff6878':tension>.6?'#ffd45f':'#d9f7ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(rod.x+25,rod.y-38);ctx.quadraticCurveTo((rod.x+hooked.x)/2,Math.min(rod.y,hooked.y)-40,hooked.x,hooked.y);ctx.stroke();ctx.fillStyle=hooked.gold?'#ffd34f':hooked.rare?'#b18cff':'#73d7e9';ctx.beginPath();ctx.ellipse(hooked.x,hooked.y,20,9,0,0,Math.PI*2);ctx.fill();panel(ctx,w*.37,14,w*.26,45,'REEL PROGRESS',`${Math.round(progress*100)}%`,'#8feaff');ctx.fillStyle='#18233b';ctx.fillRect(w*.37+10,48,w*.26-20,5);ctx.fillStyle=tension>.82?'#ff6d7d':'#ffd45f';ctx.fillRect(w*.37+10,48,(w*.26-20)*clamp(tension,0,1),5)}
      ctx.strokeStyle=castFlash?'#fff2a1':'rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(cursor.x,cursor.y,16,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(cursor.x-22,cursor.y);ctx.lineTo(cursor.x+22,cursor.y);ctx.moveTo(cursor.x,cursor.y-22);ctx.lineTo(cursor.x,cursor.y+22);ctx.stroke();panel(ctx,14,14,105,45,'SCORE',score,'#ffe078');panel(ctx,129,14,105,45,'COMBO',`x${combo}`,'#8feaff');panel(ctx,w-119,14,105,45,'SNAPS',breaks,breaks?'#ff8390':'#9af0ad')
    });
  }

  function gameChop(){
    const {c,ctx,w,h}=canvasEnv();let cursor={x:w*.5,y:h*.5},trees=[],score=0,combo=0,best=0,meter=.5,meterDir=1,swings=[],falls=[],mistakes=0;
    const makeTree=(i)=>({x:95+i*(w-190)/4,y:h*.66+Math.sin(i*1.7)*24,age:rand(0,.7),state:'grow',hp:2+irand(0,1),maxHp:3,rot:0,fall:0,gold:Math.random()<.05});trees=Array.from({length:5},(_,i)=>makeTree(i));
    listen(c,'pointermove',e=>cursor=pointerPos(c,e));
    const targetTree=()=>trees.filter(t=>t.fall<=0).sort((a,b)=>Math.hypot(a.x-cursor.x,a.y-cursor.y)-Math.hypot(b.x-cursor.x,b.y-cursor.y))[0];
    const swing=()=>{
      if(RP.finished)return;const tr=targetTree();if(!tr||Math.hypot(tr.x-cursor.x,tr.y-cursor.y)>75)return;activity(.08);const sweet=1-Math.min(1,Math.abs(meter-.5)/.23);swings.push({x:tr.x,y:tr.y,t:0,perfect:sweet>.78});
      if(tr.state==='ripe'){const dmg=sweet>.78?2:1;tr.hp-=dmg;playTone(sweet>.78?760:520,.04,.016);if(sweet>.78){scoreBurst('PERFECT!',tr.x/w*100,(tr.y-45)/h*100,'gold')}if(tr.hp<=0){const gain=(tr.gold?8:2)+(sweet>.78?2:0)+Math.min(4,Math.floor(combo/4));score+=gain;combo++;best=Math.max(best,combo);tr.fall=.75;falls.push({x:tr.x,y:tr.y,t:0,dir:Math.random()<.5?-1:1,gold:tr.gold});gameCallout(tr.gold?'GOLDEN TREE!':sweet>.78?'PERFECT CHOP!':'TREE DOWN!',`+${gain} · STREAK x${combo}`,tr.gold?'gold':sweet>.78?'great':'good')}}
      else if(tr.state==='rotten'){mistakes++;combo=0;score=Math.max(0,score-3);gameCallout('ROTTEN WOOD','STREAK LOST','bad')}else{mistakes++;combo=Math.max(0,combo-1);score=Math.max(0,score-1);playTone(150,.04,.012,'sawtooth')}
      setScore(score,clamp(score*3.7+best*2-mistakes*4,0,100),RP.participation);
    };
    listen(c,'pointerdown',e=>{cursor=pointerPos(c,e);swing()});listen(window,'keydown',e=>{if(e.code==='Space'){swing();e.preventDefault()}},{passive:false});
    loop((dt,t)=>{
      meter+=meterDir*dt*1.25;if(meter>=1){meter=1;meterDir=-1}else if(meter<=0){meter=0;meterDir=1}
      trees.forEach((tr,i)=>{if(tr.fall>0){tr.fall-=dt;if(tr.fall<=0)Object.assign(tr,makeTree(i));return}tr.age+=dt*(tr.gold?.18:.14);if(tr.age<.62)tr.state='grow';else if(tr.age<1.05)tr.state='ripe';else if(tr.age<1.32)tr.state='rotten';else Object.assign(tr,makeTree(i))});swings.forEach(s=>s.t+=dt);swings=swings.filter(s=>s.t<.25);falls.forEach(f=>f.t+=dt);falls=falls.filter(f=>f.t<.75);setScore(score,clamp(score*3.7+best*2-mistakes*4,0,100),RP.participation)
    },t=>{
      drawForestBackdrop(ctx,w,h,t);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(0,h*.74,w,h*.26);
      trees.forEach(tr=>{if(tr.fall>0)return;drawShadow(ctx,tr.x,tr.y+34,28,7,.28);const scale=.72+clamp(tr.age,0,1)*.28;ctx.fillStyle=tr.state==='rotten'?'#5b3657':'#6b452f';ctx.fillRect(tr.x-8,tr.y-38*scale,16,72*scale);ctx.fillStyle=tr.state==='grow'?'#315e3d':tr.state==='ripe'?(tr.gold?'#d5b64b':'#4f9252'):'#6a4162';ctx.beginPath();ctx.arc(tr.x,tr.y-52*scale,29*scale,0,Math.PI*2);ctx.arc(tr.x-22*scale,tr.y-39*scale,22*scale,0,Math.PI*2);ctx.arc(tr.x+22*scale,tr.y-39*scale,22*scale,0,Math.PI*2);ctx.fill();if(tr.state==='ripe'){ctx.strokeStyle=tr.gold?'#fff0a0':'#9bea84';ctx.lineWidth=2;ctx.beginPath();ctx.arc(tr.x,tr.y-48*scale,35*scale,0,Math.PI*2);ctx.stroke()}pxText(ctx,`${Math.max(0,tr.hp)} HIT${tr.hp===1?'':'S'}`,tr.x,tr.y+48,7,'#d8e8ff')});
      falls.forEach(f=>{const p=f.t/.75;ctx.save();ctx.translate(f.x,f.y+20);ctx.rotate(f.dir*p*1.25);ctx.fillStyle='#6b452f';ctx.fillRect(-7,-70,14,72);ctx.fillStyle=f.gold?'#d5b64b':'#4f9252';ctx.beginPath();ctx.arc(0,-76,30,0,Math.PI*2);ctx.fill();ctx.restore()});
      const tr=targetTree();if(tr&&Math.hypot(tr.x-cursor.x,tr.y-cursor.y)<80){ctx.strokeStyle='#ffe078';ctx.lineWidth=2;ctx.beginPath();ctx.arc(tr.x,tr.y-10,43,0,Math.PI*2);ctx.stroke()}swings.forEach(s=>{ctx.strokeStyle=s.perfect?'#fff09b':'#c9e9ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(s.x,s.y-8,50,-2.6,-.4);ctx.stroke()});
      panel(ctx,14,14,105,45,'LOGS',score,'#ffe078');panel(ctx,129,14,105,45,'STREAK',`x${combo}`,'#8feaff');panel(ctx,w-119,14,105,45,'MISTAKES',mistakes,mistakes?'#ff8390':'#9af0ad');ctx.fillStyle='#14243a';ctx.fillRect(w*.36,30,w*.28,10);ctx.fillStyle='#ffe078';ctx.fillRect(w*.36+w*.28*.43,28,w*.28*.14,14);ctx.fillStyle='#7ee7ff';ctx.fillRect(w*.36,30,w*.28*meter,10);pxText(ctx,'SWING TIMING',w*.5,18,7,'#dce8ff')
    });
  }

  function gameBuilder(){
    const {c,ctx,w,h}=canvasEnv();const cols=5,rows=4,mats=['empty','stone','wood','glass'];let blueprint=[],placed=[],selected=1,phase='preview',round=0,total=0,totalAcc=0,submits=0,previewUntil=0,cursor={x:0,y:0},feedback='',feedbackT=0;
    const grid={x:w*.12,y:h*.20,w:w*.52,h:h*.62};const cw=grid.w/cols,ch=grid.h/rows;const colors={empty:'#111a28',stone:'#7c7f8c',wood:'#a56b3d',glass:'#5bcfe7'};
    const nextBlueprint=()=>{round++;phase='preview';blueprint=Array.from({length:cols*rows},(_,i)=>Math.random()<.27?0:irand(1,3));placed=Array(cols*rows).fill(0);previewUntil=performance.now()+1650;feedback='STUDY THE PLAN';feedbackT=1.65};nextBlueprint();
    listen(c,'pointermove',e=>cursor=pointerPos(c,e));
    const cellAt=(p)=>{const x=Math.floor((p.x-grid.x)/cw),y=Math.floor((p.y-grid.y)/ch);return x>=0&&x<cols&&y>=0&&y<rows?y*cols+x:-1};
    const paint=(e,erase=false)=>{if(phase!=='build')return;const p=pointerPos(c,e),i=cellAt(p);if(i<0)return;placed[i]=erase?0:selected;activity(.035);playTone(280+placed[i]*100,.02,.008)};
    listen(c,'pointerdown',e=>paint(e,e.button===2));listen(c,'contextmenu',e=>{e.preventDefault();paint(e,true)});
    const submit=()=>{if(phase!=='build')return;activity(.15);submits++;let correct=0;blueprint.forEach((m,i)=>correct+=m===placed[i]?1:0);const acc=correct/blueprint.length;totalAcc+=acc;const gain=Math.round(acc*34+(acc===1?12:0));total+=gain;feedback=`${correct}/${blueprint.length} CORRECT · +${gain}`;feedbackT=1.0;phase='result';setScore(total,clamp((totalAcc/submits)*82+Math.min(18,total*.18),0,100),1);gameCallout(acc===1?'FLAWLESS BUILD!':acc>=.85?'SOLID BUILD!':'BUILD FAILED INSPECTION',`${Math.round(acc*100)}% ACCURACY`,acc===1?'great':acc>=.85?'good':'bad');later(nextBlueprint,950)};
    listen(window,'keydown',e=>{if(e.key==='1'){selected=1;activity(.02)}if(e.key==='2'){selected=2;activity(.02)}if(e.key==='3'){selected=3;activity(.02)}if(e.key==='0'){selected=0;activity(.02)}if(e.code==='Space'||e.key==='Enter'){submit();e.preventDefault()}},{passive:false});
    loop((dt)=>{if(phase==='preview'&&performance.now()>=previewUntil){phase='build';feedback='1 STONE · 2 WOOD · 3 GLASS · 0 ERASE · SPACE SUBMIT';feedbackT=999}feedbackT=Math.max(0,feedbackT-dt);setScore(total,clamp((submits?totalAcc/submits:0)*82+Math.min(18,total*.18),0,100),RP.participation)},t=>{
      ctx.fillStyle='#0b1220';ctx.fillRect(0,0,w,h);const glow=ctx.createRadialGradient(w*.48,h*.4,20,w*.48,h*.4,w*.55);glow.addColorStop(0,'#4b35404a');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);ctx.fillStyle='#33291f';ctx.fillRect(0,h*.84,w,h*.16);ctx.strokeStyle='#6d5236';for(let x=0;x<w;x+=48){ctx.beginPath();ctx.moveTo(x,h*.84);ctx.lineTo(x+18,h);ctx.stroke()}
      pxText(ctx,phase==='preview'?`BLUEPRINT ${round} · MEMORISE`:`BLUEPRINT ${round} · BUILD`,grid.x,46,12,'#fff0a4','left');
      const source=phase==='preview'?blueprint:placed;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x,xx=grid.x+x*cw,yy=grid.y+y*ch,m=source[i];ctx.fillStyle='#0b1424';rounded(ctx,xx+4,yy+4,cw-8,ch-8,8);ctx.fill();ctx.fillStyle=colors[m];rounded(ctx,xx+10,yy+10,cw-20,ch-20,5);ctx.fill();ctx.strokeStyle=phase==='result'?(placed[i]===blueprint[i]?'#7af0a4':'#ff7185'):'#52688d';ctx.stroke();if(m===3){ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(xx+17,yy+16,cw-34,4)}}
      // right-side 3D-ish live structure preview
      const bx=w*.77,by=h*.66;ctx.fillStyle='#1a2233';ctx.beginPath();ctx.moveTo(bx-90,by);ctx.lineTo(bx,by-48);ctx.lineTo(bx+90,by);ctx.lineTo(bx,by+48);ctx.closePath();ctx.fill();placed.forEach((m,i)=>{if(!m)return;const gx=i%cols,gy=Math.floor(i/cols),xx=bx+(gx-2)*25+(gy-1.5)*13,yy=by+(gy-1.5)*13-(gx-2)*7;ctx.fillStyle=colors[m];ctx.fillRect(xx-9,yy-9,18,18);ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(xx+9,yy-5,5,18)});pxText(ctx,'LIVE MODEL',bx,by+85,8,'#8feaff');
      const tools=[['0','ERASE',0],['1','STONE',1],['2','WOOD',2],['3','GLASS',3]];tools.forEach((x,i)=>{const xx=w*.68+i*70,yy=68;ctx.fillStyle=selected===x[2]?'#4d3f24':'#101a2d';rounded(ctx,xx,yy,62,39,5);ctx.fill();ctx.strokeStyle=selected===x[2]?'#ffe078':'#495d82';ctx.stroke();pxText(ctx,x[0],xx+12,yy+13,8,'#8feaff');pxText(ctx,x[1],xx+31,yy+27,6,colors[x[2]])});pxText(ctx,feedback,w*.5,h-30,8,phase==='result'?'#ffe078':'#cde4ff')
    });
  }

  function gameMinecart(){
    const {ctx,w,h}=canvasEnv();let lane=0,targetLane=0,jump=0,jumpV=0,duck=0,objects=[],spawn=0,ore=0,distance=0,hits=0,combo=0,invuln=0,boost=0,boostT=0,shake=0;
    const laneX=(l,z)=>w/2+l*(w*.25*z+20), pathY=z=>lerp(h*.19,h*.82,z*z*.72+z*.28);
    listen(window,'keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a'){targetLane=clamp(targetLane-1,-1,1);activity(.04);e.preventDefault()}if(e.key==='ArrowRight'||e.key==='d'){targetLane=clamp(targetLane+1,-1,1);activity(.04);e.preventDefault()}if((e.code==='Space'||e.key==='ArrowUp'||e.key==='w')&&jump<=.06){jumpV=4.5;activity(.05);e.preventDefault()}if(e.key==='ArrowDown'||e.key==='s'){duck=.52;activity(.04);e.preventDefault()}if(e.key==='Shift'&&boost>=1&&!boostT){boost=0;boostT=1.35;gameCallout('BOOST!','FULL SPEED','great');activity(.08);e.preventDefault()}},{passive:false});
    const spawnObj=()=>{const r=Math.random(),type=r<.34?'ore':r<.40?'gem':r<.62?'rock':r<.80?'beam':'gap';objects.push({lane:irand(-1,1),z:.02,type,done:false})};
    loop((dt)=>{lane=lerp(lane,targetLane,clamp(dt*9,0,1));jumpV-=9.5*dt;jump=Math.max(0,jump+jumpV*dt);if(jump===0&&jumpV<0)jumpV=0;duck=Math.max(0,duck-dt);boostT=Math.max(0,boostT-dt);spawn-=dt;if(spawn<=0){spawn=rand(.34,.58);spawnObj()}const speedMult=boostT>0?1.42:1;distance+=dt*24*speedMult;invuln=Math.max(0,invuln-dt);shake=Math.max(0,shake-dt);
      for(const o of objects){o.z+=dt*(.39+distance/950)*speedMult;if(!o.done&&o.z>.82&&o.z<1.03&&Math.abs(o.lane-lane)<.42){o.done=true;let safe=true;if(o.type==='ore'||o.type==='gem'){const gain=o.type==='gem'?7:2;ore+=gain;combo++;boost=clamp(boost+(o.type==='gem'?.30:.10),0,1);if(o.type==='gem')gameCallout('GEM VEIN!',`+${gain} · BOOST ${Math.round(boost*100)}%`,'gold');else if(combo%6===0)gameCallout(`CLEAN RUN x${combo}`,'BOOST CHARGING','great');sfx(o.type==='gem'?'gold':'good')}else{safe=o.type==='beam'?duck>0:o.type==='rock'||o.type==='gap'?jump>.58:false;if(!safe&&invuln<=0){hits++;combo=0;boost=Math.max(0,boost-.35);invuln=.75;shake=.3;gameCallout(o.type==='beam'?'SMACKED THE BEAM!':o.type==='gap'?'MISSED THE GAP!':'CRASH!','STREAK LOST','bad');screenShake(.55)}else if(safe){combo++;boost=clamp(boost+.06,0,1);if(combo%5===0)gameCallout('NEAR-MISS FLOW!',`STREAK x${combo}`,'great')}}}}
      objects=objects.filter(o=>o.z<1.14&&!o.done);setScore(Math.floor(distance+ore*4),clamp(distance*.18+ore*3.3-hits*8+combo*.8+boost*5,0,100),RP.participation)
    },t=>{
      ctx.save();if(shake)ctx.translate(rand(-5,5)*shake*4,rand(-3,3)*shake*4);drawMineTunnel(ctx,w,h,t,distance,laneX,pathY);
      for(const o of objects.slice().sort((a,b)=>a.z-b.z)){const z=o.z,x=laneX(o.lane,z),y=pathY(z),s=clamp(8+z*35,8,44);if(o.type==='ore'||o.type==='gem'){ctx.fillStyle=o.type==='gem'?'#b98cff':'#f2bf50';ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*.7,y);ctx.lineTo(x,y+s*.6);ctx.lineTo(x-s*.7,y);ctx.closePath();ctx.fill();if(o.type==='gem')drawSpark(ctx,x,y-s*.7,t/1000,'#e8d5ff')}else if(o.type==='beam'){ctx.fillStyle='#9c6742';ctx.fillRect(x-s*.85,y-s*.85,s*1.7,s*.25)}else if(o.type==='gap'){ctx.fillStyle='#05070c';ctx.beginPath();ctx.ellipse(x,y+s*.15,s*1.0,s*.42,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#4b3647';ctx.stroke()}else{ctx.fillStyle='#7a6570';rounded(ctx,x-s*.55,y-s*.7,s*1.1,s*1.2,5);ctx.fill()}}
      const px=laneX(lane,1),py=h*.82-jump*52;drawShadow(ctx,px,h*.86,34,8,.38);ctx.save();ctx.translate(px,py);ctx.rotate((targetLane-lane)*.08);ctx.fillStyle=invuln>0&&Math.floor(t/80)%2?'#fff':'#3fc7df';rounded(ctx,-30,-15,60,29,6);ctx.fill();ctx.fillStyle='#172335';ctx.fillRect(-24,-10,48,7);ctx.fillStyle='#0b0f17';ctx.beginPath();ctx.arc(-18,14,7,0,Math.PI*2);ctx.arc(18,14,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e9d2bd';rounded(ctx,-8,duck>0?-23:-35,16,14,4);ctx.fill();ctx.fillStyle='#d8a93d';ctx.fillRect(-10,duck>0?-26:-38,20,5);ctx.restore();pxText(ctx,'YOU',px,py-52,8,'#fff4b0');panel(ctx,14,14,108,45,'ORE',ore,'#ffd35d');panel(ctx,132,14,108,45,'DISTANCE',Math.floor(distance),'#8feaff');panel(ctx,w-122,14,108,45,'HITS',hits,hits?'#ff8390':'#9af0ad');ctx.fillStyle='#152138';ctx.fillRect(w*.38,28,w*.24,8);ctx.fillStyle=boost>=1?'#fff09b':'#64e7ff';ctx.fillRect(w*.38,28,w*.24*boost,8);pxText(ctx,boost>=1?'SHIFT BOOST READY':`BOOST ${Math.round(boost*100)}%`,w*.5,18,7,'#dce8ff');ctx.restore()
    });
  }

  function gameRooftop(){
    const {ctx,w,h}=canvasEnv();const ground=h*.76;let y=ground,vy=0,duck=0,obstacles=[],spawn=.7,distanceRun=0,hits=0,streak=0,shake=0,invuln=0,coyote=.12,coins=0;
    listen(window,'keydown',e=>{if((e.code==='Space'||e.key==='ArrowUp'||e.key==='w')&&(y>=ground-.5||coyote>0)){vy=-500;coyote=0;activity(.06);e.preventDefault()}if(e.key==='ArrowDown'||e.key==='s'){duck=.5;activity(.04);e.preventDefault()}},{passive:false});
    const spawnObj=()=>{const r=Math.random(),type=r<.28?'crate':r<.48?'line':r<.66?'gap':r<.82?'vent':'coin';obstacles.push({x:w+60,type,w:type==='gap'?rand(85,135):34,hit:false,passed:false})};
    loop((dt)=>{vy+=1080*dt;y+=vy*dt;if(y>=ground){y=ground;vy=0;coyote=.11}else coyote=Math.max(0,coyote-dt);duck=Math.max(0,duck-dt);invuln=Math.max(0,invuln-dt);spawn-=dt;if(spawn<=0){spawn=rand(.62,1.02);spawnObj()}const speed=275+Math.min(120,distanceRun*.16);distanceRun+=dt*speed/9;shake=Math.max(0,shake-dt);
      for(const o of obstacles){o.x-=speed*dt;if(o.type==='coin'&&!o.hit&&Math.abs(o.x-96)<27&&Math.abs(y-(ground-36))<90){o.hit=true;coins++;streak++;sfx('gold')}if(!o.hit&&invuln<=0&&o.x<130&&o.x>45){let collision=false;if(o.type==='crate'||o.type==='vent')collision=y>ground-55;else if(o.type==='line')collision=duck<=0&&y>ground-90;else if(o.type==='gap')collision=y>=ground-3&&o.x<110&&o.x+o.w>75;if(collision){o.hit=true;hits++;streak=0;invuln=.65;shake=.28;distanceRun=Math.max(0,distanceRun-10);gameCallout(o.type==='gap'?'MISSED THE GAP!':'CLIPPED!','FLOW RESET','bad');if(o.type==='gap'){y=ground-90;vy=-210}}}if(!o.passed&&o.x+o.w<45){o.passed=true;if(!o.hit&&o.type!=='coin'){streak++;if(streak%5===0)gameCallout(`FLOW x${streak}`,'CLEAN ROOFTOP RUN','great');sfx('good')}}}
      obstacles=obstacles.filter(o=>o.x>-180);setScore(Math.floor(distanceRun+coins*5),clamp(distanceRun*.31+streak*2+coins*3-hits*8,0,100),RP.participation)
    },t=>{
      ctx.save();if(shake)ctx.translate(rand(-4,4)*shake*4,0);drawCityRooftops(ctx,w,h,t,distanceRun,ground);
      obstacles.forEach(o=>{if(o.type==='crate'){ctx.fillStyle='#875332';ctx.fillRect(o.x-17,ground-34,34,34);ctx.strokeStyle='#c68a53';ctx.strokeRect(o.x-13,ground-30,26,26)}else if(o.type==='line'){ctx.strokeStyle='#d8d0c7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x-45,ground-48);ctx.lineTo(o.x+45,ground-48);ctx.stroke();ctx.fillStyle='#e27582';ctx.fillRect(o.x-15,ground-54,28,12)}else if(o.type==='gap'){ctx.fillStyle='#05070c';ctx.fillRect(o.x,ground+8,o.w,h-ground);ctx.strokeStyle='#ffbd60';ctx.strokeRect(o.x,ground+6,o.w,5)}else if(o.type==='vent'){ctx.fillStyle='#525867';ctx.fillRect(o.x-18,ground-28,36,28);ctx.fillStyle='#77808e';ctx.fillRect(o.x-22,ground-33,44,7)}else{ctx.fillStyle='#ffd75f';ctx.beginPath();ctx.arc(o.x,ground-58,9,0,Math.PI*2);ctx.fill();drawSpark(ctx,o.x,ground-58,t/1000,'#fff0a0')}});
      const py=y-(duck>0?4:18);drawShadow(ctx,96,ground+18,18,5,.3);ctx.fillStyle=invuln>0&&Math.floor(t/70)%2?'#fff':'#64e2f0';rounded(ctx,84,py-18,24,duck>0?22:34,5);ctx.fill();ctx.fillStyle='#f0d4bd';rounded(ctx,87,py-30,18,14,4);ctx.fill();if(duck<=0){ctx.strokeStyle='#64e2f0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(88,py+14);ctx.lineTo(80,py+25);ctx.moveTo(102,py+14);ctx.lineTo(112,py+25);ctx.stroke()}pxText(ctx,'YOU',96,py-40,8,'#fff0a6');panel(ctx,14,14,115,45,'DISTANCE',`${Math.floor(distanceRun)}m`,'#8feaff');panel(ctx,139,14,105,45,'FLOW',`x${streak}`,'#fff08b');panel(ctx,w-119,14,105,45,'COINS',coins,'#ffe078');ctx.restore()
    });
  }

  function gameChicken(){
    const {ctx,w,h}=canvasEnv();let player={x:w*.5,y:h*.62,dir:0,swing:0,dash:0,dashCd:0},mud=[{x:w*.64,y:h*.72,rx:70,ry:26},{x:w*.32,y:h*.45,rx:50,ry:20}],birds=Array.from({length:14},(_,i)=>({x:rand(70,w-70),y:rand(75,h-60),vx:rand(-55,55),vy:rand(-55,55),gold:i===0||Math.random()<.05,caught:0,brain:rand(0,1),turn:rand(.2,.7)})),bots=contestantList().filter(p=>!currentUser(p)).slice(0,5).map((p,i)=>({name:p.username,x:80+i*(w-160)/4,y:90+Math.sin(i)*20,target:irand(0,13),color:COLORS[(i+1)%COLORS.length],score:0})),score=0,combo=0,best=0,dust=[];
    listen(window,'keydown',e=>{if(e.code==='Space'&&player.swing<=0){player.swing=.3;activity(.07);e.preventDefault()}if(e.key==='Shift'&&player.dashCd<=0){player.dash=.18;player.dashCd=1.4;activity(.06);e.preventDefault()}},{passive:false});
    loop((dt,t)=>{const {dx,dy}=directional();player.dash=Math.max(0,player.dash-dt);player.dashCd=Math.max(0,player.dashCd-dt);let slow=1;for(const m of mud)if(Math.hypot((player.x-m.x)/m.rx,(player.y-m.y)/m.ry)<1)slow=.55;const sp=(player.dash>0?330:185)*slow;if(dx||dy){activity(.004);player.x=clamp(player.x+dx*sp*dt,45,w-45);player.y=clamp(player.y+dy*sp*dt,55,h-40);player.dir=Math.atan2(dy,dx)}player.swing=Math.max(0,player.swing-dt);
      for(const b of birds){b.caught=Math.max(0,b.caught-dt);b.turn-=dt;if(b.turn<=0){b.turn=rand(.25,.75);b.vx+=rand(-45,45);b.vy+=rand(-45,45)}const d=Math.hypot(b.x-player.x,b.y-player.y);if(d<150){b.vx+=(b.x-player.x)/Math.max(1,d)*(b.gold?155:105)*dt;b.vy+=(b.y-player.y)/Math.max(1,d)*(b.gold?155:105)*dt}b.vx=clamp(b.vx,-(b.gold?125:95),b.gold?125:95);b.vy=clamp(b.vy,-(b.gold?125:95),b.gold?125:95);b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<45||b.x>w-45)b.vx*=-1;if(b.y<55||b.y>h-40)b.vy*=-1;
        if(player.swing>.12&&player.swing<.23&&b.caught<=0){const angle=Math.atan2(b.y-player.y,b.x-player.x),da=Math.atan2(Math.sin(angle-player.dir),Math.cos(angle-player.dir));if(d<72&&Math.abs(da)<1.08){b.caught=.65;const gain=b.gold?7:1+Math.min(3,Math.floor(combo/4));score+=gain;combo++;best=Math.max(best,combo);dust.push({x:b.x,y:b.y,t:0,gold:b.gold});if(b.gold)gameCallout('GOLDEN CHICKEN!',`+${gain} · COMBO x${combo}`,'gold');else if(combo%5===0)gameCallout(`NET STREAK x${combo}`,'CATCHING FIRE','great');b.x=rand(60,w-60);b.y=rand(65,h-55);b.gold=Math.random()<.075;playTone(b.gold?950:620,.045,.018)}}}
      for(const bot of bots){const target=birds[bot.target%birds.length];if(!target){bot.target=irand(0,birds.length-1);continue}const d=Math.max(1,dist(bot,target));bot.x+=((target.x-bot.x)/d)*72*dt;bot.y+=((target.y-bot.y)/d)*72*dt;if(d<30){target.x=rand(60,w-60);target.y=rand(65,h-55);bot.score++;bot.target=irand(0,birds.length-1)}}dust.forEach(p=>p.t+=dt);dust=dust.filter(p=>p.t<.65);setScore(score,clamp(score*4+best*1.8,0,100),RP.participation)
    },t=>{
      drawFarmBackdrop(ctx,w,h,t);mud.forEach(m=>{ctx.fillStyle='rgba(75,57,41,.72)';ctx.beginPath();ctx.ellipse(m.x,m.y,m.rx,m.ry,0,0,Math.PI*2);ctx.fill()});birds.forEach(b=>{drawShadow(ctx,b.x,b.y+12,13,4,.22);ctx.fillStyle=b.gold?'#ffd85b':'#f4edcc';ctx.beginPath();ctx.ellipse(b.x,b.y,13,10,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(b.x+10,b.y-7,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f28a3f';ctx.beginPath();ctx.moveTo(b.x+16,b.y-8);ctx.lineTo(b.x+25,b.y-4);ctx.lineTo(b.x+16,b.y-2);ctx.fill();ctx.fillStyle='#1a2834';ctx.fillRect(b.x+11,b.y-10,2,2);if(b.gold)drawSpark(ctx,b.x,b.y-20,t/1000,'#fff1a0')});
      bots.forEach(bot=>drawCharacter(ctx,{name:bot.name},bot.x,bot.y,{color:bot.color,scale:.72}));drawCharacter(ctx,{name:'YOU',human:true},player.x,player.y,{color:'#63e4ff',label:false,scale:player.dash>0?1.08:1});if(player.swing>0){ctx.strokeStyle='#fff0a6';ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y,52,player.dir-1.0,player.dir+1.0);ctx.stroke();ctx.fillStyle='rgba(255,240,166,.1)';ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.arc(player.x,player.y,56,player.dir-1.0,player.dir+1.0);ctx.closePath();ctx.fill()}pxText(ctx,'YOU',player.x,player.y+38,8,'#fff0a6');dust.forEach(p=>{ctx.fillStyle=p.gold?'#fff09a':'#d9c79c';for(let i=0;i<5;i++)ctx.fillRect(p.x+Math.cos(i*1.7)*p.t*40,p.y+Math.sin(i*1.7)*p.t*30,3,3)});panel(ctx,14,14,105,45,'CAUGHT',score,'#ffe078');panel(ctx,129,14,105,45,'COMBO',`x${combo}`,'#8feaff');panel(ctx,w-119,14,105,45,'DASH',player.dashCd<=0?'READY':`${player.dashCd.toFixed(1)}s`,'#9af0ad')
    });
  }

  function gameTiles(){
    const {ctx,w,h}=canvasEnv(),cols=8,rows=5;const boardW=Math.min(w*.84,760),boardH=Math.min(h*.70,390),ox=(w-boardW)/2,oy=(h-boardH)/2+24,cw=boardW/cols,ch=boardH/rows;let wave=0,nextWave=.9,survival=0,stars=0,lives=2,moveCd=0,deadT=0,lastDir=[0,0];
    const tiles=Array.from({length:rows},()=>Array.from({length:cols},()=>({state:'safe',timer:0,star:false,shock:0})));
    const actors=contestantList().map((p,i)=>({name:p.username,human:currentUser(p),bot:p.is_bot,color:COLORS[i],x:i===0?3:(i*2)%cols,y:i%2?0:rows-1,alive:true,move:rand(.18,.45),score:0}));const human=actors.find(a=>a.human)||actors[0];
    const can=(x,y)=>x>=0&&x<cols&&y>=0&&y<rows&&tiles[y][x].state!=='gone';
    const moveActor=(a,dx,dy)=>{const nx=a.x+dx,ny=a.y+dy;if(can(nx,ny)){a.x=nx;a.y=ny;return true}return false};
    listen(window,'keydown',e=>{if(!human.alive||moveCd>0)return;let dx=0,dy=0;if(e.key==='ArrowLeft'||e.key==='a')dx=-1;if(e.key==='ArrowRight'||e.key==='d')dx=1;if(e.key==='ArrowUp'||e.key==='w')dy=-1;if(e.key==='ArrowDown'||e.key==='s')dy=1;if(dx||dy){if(moveActor(human,dx,dy)){lastDir=[dx,dy];moveCd=.11;activity(.05);const tile=tiles[human.y][human.x];if(tile.star){tile.star=false;stars++;gameCallout('STAR TILE!',`BONUS ${stars}`,'gold')}}e.preventDefault()}if(e.code==='Space'&&(lastDir[0]||lastDir[1])){const [sx,sy]=lastDir;if(moveActor(human,sx,sy))moveActor(human,sx,sy);moveCd=.34;activity(.07);playTone(560,.03,.012);e.preventDefault()}},{passive:false});
    const warnWave=()=>{wave++;const viable=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(tiles[y][x].state==='safe')viable.push([x,y]);for(let i=0;i<Math.min(2+Math.floor(wave/4),5,viable.length);i++){const idx=irand(0,viable.length-1),[x,y]=viable.splice(idx,1)[0];tiles[y][x].state='warn';tiles[y][x].timer=rand(.62,.96)}if(Math.random()<.75&&viable.length){const [sx,sy]=choose(viable);tiles[sy][sx].star=true}};
    const fall=(a)=>{if(!a.alive)return;a.alive=false;if(a.human){lives--;gameCallout(lives>0?'FELL!':'ELIMINATED!',lives>0?'RESPAWNING · ONE LIFE LOST':'SURVIVAL RUN ENDED','boom');if(lives>0){deadT=.8;later(()=>{const safe=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(tiles[y][x].state==='safe')safe.push([x,y]);if(safe.length){[a.x,a.y]=choose(safe);a.alive=true}},800)}else setScore(Math.floor(survival+stars*4),clamp(survival*2.8+stars*5,0,100),1)}};
    loop((dt)=>{moveCd=Math.max(0,moveCd-dt);deadT=Math.max(0,deadT-dt);if(human.alive)survival+=dt;nextWave-=dt;if(nextWave<=0){nextWave=Math.max(.48,1.05-wave*.03);warnWave()}for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const tile=tiles[y][x];if(tile.state==='warn'){tile.timer-=dt;if(tile.timer<=0){tile.state='gone';tile.star=false;actors.forEach(a=>{if(a.alive&&a.x===x&&a.y===y)fall(a)})}}}
      for(const bot of actors.filter(a=>a.bot&&a.alive)){bot.move-=dt;if(bot.move<=0){bot.move=rand(.18,.48);const dirs=[[1,0],[-1,0],[0,1],[0,-1]].sort(()=>Math.random()-.5);for(const [dx,dy] of dirs){const nx=bot.x+dx,ny=bot.y+dy;if(can(nx,ny)&&tiles[ny][nx].state==='safe'){bot.x=nx;bot.y=ny;break}}}}
      // crowding has a small shove effect so positions matter
      actors.filter(a=>a.alive).forEach((a,i)=>actors.filter((b,j)=>j>i&&b.alive&&a.x===b.x&&a.y===b.y).forEach(b=>{if(Math.random()<dt*.9){const dirs=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>can(a.x+dx,a.y+dy));if(dirs.length){const [dx,dy]=choose(dirs);moveActor(b,dx,dy)}}}));
      setScore(Math.floor(survival+stars*4),clamp(survival*2.8+stars*5+(lives-1)*5,0,100),RP.participation)
    },t=>{
      drawSkyArenaBackdrop(ctx,w,h,t);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const tile=tiles[y][x],xx=ox+x*cw,yy=oy+y*ch;drawShadow(ctx,xx+cw/2,yy+ch*.88,cw*.36,10,.32);if(tile.state==='gone')continue;ctx.fillStyle=tile.state==='warn'?'#3a202b':'#172c4b';rounded(ctx,xx+5,yy+10,cw-10,ch-8,7);ctx.fill();ctx.fillStyle=tile.state==='warn'?(Math.floor(t/100)%2?'#c65b68':'#6f3346'):'#315e8f';rounded(ctx,xx+4,yy+4,cw-8,ch-12,7);ctx.fill();ctx.strokeStyle=tile.state==='warn'?'#ff8a87':'#557ca2';ctx.stroke();if(tile.star){pxText(ctx,'✦',xx+cw/2,yy+ch/2,20,'#ffe36f');drawSpark(ctx,xx+cw/2,yy+ch/2,t/1000,'#fff3a5')}}actors.forEach(a=>{if(!a.alive)return;const x=ox+a.x*cw+cw/2,y=oy+a.y*ch+ch*.48;drawCharacter(ctx,{name:a.name,human:a.human},x,y,{color:a.color,scale:a.human?.78:.62,label:false});if(a.human)pxText(ctx,'YOU',x,y+31,7,'#fff0a6')});panel(ctx,14,14,110,45,'SURVIVAL',`${survival.toFixed(1)}s`,'#8feaff');panel(ctx,134,14,95,45,'LIVES',lives,'#ff8fa1');panel(ctx,w-124,14,110,45,'STARS',stars,'#ffe078');pxText(ctx,'SPACE = DASH ONE EXTRA TILE',w/2,h-18,7,'#bcd4f2')
    });
  }

  function gameSays(){
    const dom=el('rpDom');dom.classList.add('rp-dom-full');const commands=[['JUMP','SPACE',' '],['LEFT','←','arrowleft'],['RIGHT','→','arrowright'],['DUCK','↓','arrowdown'],['UP','↑','arrowup']];let lives=3,score=0,streak=0,best=0,current=null,deadline=0,locked=false,round=0,feint=0;
    dom.innerHTML=`<div class="rp-says-stage rp-says-pro"><div class="rp-goblin-host"><i class="ear left"></i><i class="ear right"></i><b><span></span></b><em></em></div><div class="rp-says-board"><span class="rp-kicker">LISTEN TO THE WORDS — NOT THE LIGHTS</span><div class="rp-says-prefix" id="rpSaysPrefix">GOBLIN SAYS</div><div class="rp-says-command" id="rpSaysCommand">GET READY</div><div class="rp-says-key" id="rpSaysKey">—</div><div class="rp-says-meter"><i id="rpSaysMeter"></i></div><div class="rp-says-stats"><span id="rpSaysHearts">♥ ♥ ♥</span><b id="rpSaysStreak">STREAK 0</b></div><div class="rp-says-feints"><i></i><i></i><i></i><i></i></div></div></div>`;
    const updateStats=()=>{el('rpSaysHearts').textContent=Array(Math.max(0,lives)).fill('♥').join(' ');el('rpSaysStreak').textContent=`STREAK ${streak}`;setScore(score,clamp(score*6.5+best*2-(3-lives)*5,0,100),RP.participation)};
    const fail=(why='WRONG INPUT')=>{lives--;streak=0;gameCallout('WRONG!',why,'bad');dom.querySelector('.rp-says-stage')?.classList.add('is-wrong');later(()=>dom.querySelector('.rp-says-stage')?.classList.remove('is-wrong'),220);updateStats();if(lives<=0)later(()=>void finishGame(),450)};
    const next=()=>{if(RP.finished||lives<=0)return;round++;locked=false;const [name,label,key]=choose(commands),says=Math.random()>.34,dur=Math.max(610,1220-round*16)+rand(0,210);feint=Math.random()<.38?irand(0,commands.length-1):-1;current={name,label,key,says,acted:false,start:performance.now(),dur};deadline=current.start+dur;el('rpSaysPrefix').textContent=says?'GOBLIN SAYS':'JUST A COMMAND';el('rpSaysPrefix').className=`rp-says-prefix ${says?'is-real':'is-fake'}`;el('rpSaysCommand').textContent=name;el('rpSaysKey').textContent=label;el('rpSaysMeter').style.width='100%';dom.querySelector('.rp-goblin-host')?.classList.toggle('is-fake',!says);const dots=dom.querySelectorAll('.rp-says-feints i');dots.forEach((d,i)=>{d.className=i===feint?'is-feint':''})};
    listen(window,'keydown',e=>{if(!current||locked||RP.finished)return;const k=e.code==='Space'?' ':e.key.toLowerCase();if(![' ','arrowleft','arrowright','arrowdown','arrowup'].includes(k))return;activity(.09);locked=true;current.acted=true;if(current.says&&k===current.key){const rt=performance.now()-current.start,bonus=Math.max(1,Math.round((1-rt/current.dur)*5));score+=2+bonus;streak++;best=Math.max(best,streak);if(streak%4===0)gameCallout(`REACTION STREAK x${streak}`,`${Math.round(rt)}ms`,'great');sfx('good');dom.querySelector('.rp-says-stage')?.classList.add('is-right');later(()=>dom.querySelector('.rp-says-stage')?.classList.remove('is-right'),180);updateStats();later(next,220)}else if(!current.says) {fail('HE NEVER SAID GOBLIN SAYS');later(next,330)} else {fail('THAT WAS THE WRONG MOVE');later(next,330)}e.preventDefault()},{passive:false});
    every(()=>{if(!current||locked||RP.finished)return;const left=clamp((deadline-performance.now())/current.dur,0,1);if(el('rpSaysMeter'))el('rpSaysMeter').style.width=`${left*100}%`;if(performance.now()>=deadline){locked=true;if(current.says)fail('TOO SLOW');else{score+=3;streak++;best=Math.max(best,streak);gameCallout('GOOD HOLD!','YOU IGNORED THE FAKE','good');updateStats()}later(next,220)}},30);next();
  }

  function gameGold(){
    const {ctx,w,h}=canvasEnv();let p={x:100,y:h*.55,carry:0,banked:0,swing:0,stun:0,stamina:1},nodes=Array.from({length:11},(_,i)=>({x:190+(i%4)*((w-250)/4)+rand(-25,25),y:85+Math.floor(i/4)*145+rand(-18,18),hp:irand(1,3),max:3,value:Math.random()<.12?5:irand(1,3),respawn:0,hitFrame:false})),goblins=Array.from({length:3},(_,i)=>({x:w*.55+i*110,y:h*.25+i*80,vx:rand(-65,65),vy:rand(-65,65)})),caveIns=[],dust=[],score=0,spawnCave=2.8;
    listen(window,'keydown',e=>{if(e.code==='Space'&&p.swing<=0){p.swing=.34;activity(.06);e.preventDefault()}},{passive:false});
    loop((dt)=>{p.stun=Math.max(0,p.stun-dt);p.swing=Math.max(0,p.swing-dt);spawnCave-=dt;if(spawnCave<=0){spawnCave=rand(2.6,4.2);caveIns.push({x:rand(170,w-70),y:rand(70,h-70),t:0,drop:.85})}const {dx,dy}=directional();const carrySlow=1-clamp(p.carry*.025,0,.32);if(p.stun<=0&&(dx||dy)){activity(.004);p.x=clamp(p.x+dx*170*carrySlow*dt,45,w-45);p.y=clamp(p.y+dy*170*carrySlow*dt,45,h-35)}if(p.swing>.10&&p.swing<.21){for(const n of nodes){if(n.respawn<=0&&Math.hypot(p.x-n.x,p.y-n.y)<58&&!n.hitFrame){n.hitFrame=true;n.hp--;dust.push({x:n.x,y:n.y,t:0});playTone(420,.035,.012);if(n.hp<=0){p.carry+=n.value;score+=n.value;n.respawn=rand(2.4,3.8);n.hp=irand(1,3);n.value=Math.random()<.12?5:irand(1,3);if(n.value===5)gameCallout('RICH VEIN!','HEAVY ORE FOUND','gold');playTone(780,.05,.018)}}}}else nodes.forEach(n=>n.hitFrame=false);
      for(const n of nodes)if(n.respawn>0)n.respawn-=dt;if(p.x<110&&Math.abs(p.y-h*.55)<80&&p.carry>0){const deposit=p.carry;p.banked+=deposit;score+=deposit;p.carry=0;gameCallout('BANKED!',`+${deposit} SAFE GOLD`,'gold');sfx('bank');activity(.05)}
      for(const g of goblins){g.x+=g.vx*dt;g.y+=g.vy*dt;if(g.x<130||g.x>w-35)g.vx*=-1;if(g.y<45||g.y>h-35)g.vy*=-1;const d=Math.hypot(p.x-g.x,p.y-g.y);if(d<150){g.vx+=(p.x-g.x)/Math.max(1,d)*18*dt;g.vy+=(p.y-g.y)/Math.max(1,d)*18*dt}if(p.stun<=0&&d<34){const lost=Math.min(p.carry,Math.max(1,Math.floor(p.carry*.45)));p.carry-=lost;p.stun=.6;g.vx*=-1;g.vy*=-1;playTone(95,.12,.03,'sawtooth');if(lost)gameCallout('GOBLIN HIT!',`-${lost} UNBANKED`,'bad')}}
      caveIns.forEach(ci=>{ci.t+=dt;if(ci.t>=ci.drop&&ci.t-dt<ci.drop&&Math.hypot(p.x-ci.x,p.y-ci.y)<55){p.stun=.7;const lost=Math.min(p.carry,2);p.carry-=lost;gameCallout('CAVE-IN!','WATCH THE WARNING RINGS','boom')}});caveIns=caveIns.filter(ci=>ci.t<1.35);dust.forEach(d=>d.t+=dt);dust=dust.filter(d=>d.t<.55);setScore(p.banked,clamp(p.banked*4+score*1.2,0,100),RP.participation)
    },t=>{
      drawCaveBackdrop(ctx,w,h,t);const glow=ctx.createRadialGradient(78,h*.55,10,78,h*.55,100);glow.addColorStop(0,'rgba(255,196,89,.28)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,h*.35,180,h*.4);ctx.fillStyle='#5a3e28';rounded(ctx,25,h*.55-54,88,108,8);ctx.fill();ctx.fillStyle='#d7a448';ctx.fillRect(34,h*.55-44,70,9);pxText(ctx,'BANK',69,h*.55-8,10,'#fff0a0');pxText(ctx,`${p.banked}`,69,h*.55+16,17,'#ffd45d');
      nodes.forEach(n=>{if(n.respawn>0)return;drawShadow(ctx,n.x,n.y+13,17,5,.25);ctx.fillStyle=n.value===5?'#6d537f':'#6d5b65';ctx.beginPath();ctx.moveTo(n.x-15,n.y+10);ctx.lineTo(n.x-10,n.y-9);ctx.lineTo(n.x+7,n.y-14);ctx.lineTo(n.x+17,n.y+6);ctx.lineTo(n.x+8,n.y+15);ctx.closePath();ctx.fill();ctx.fillStyle=n.value===5?'#cf9cff':'#f2c756';ctx.fillRect(n.x-7,n.y-5,5,5);ctx.fillRect(n.x+4,n.y+2,6,4)});goblins.forEach(g=>{drawShadow(ctx,g.x,g.y+16,14,5,.24);ctx.fillStyle='#6fb05a';rounded(ctx,g.x-11,g.y-16,22,24,5);ctx.fill();ctx.fillStyle='#d5bb9d';ctx.fillRect(g.x-6,g.y-20,12,8);ctx.fillStyle='#351d2b';ctx.fillRect(g.x-4,g.y-17,2,2);ctx.fillRect(g.x+2,g.y-17,2,2)});caveIns.forEach(ci=>{const pz=ci.t/ci.drop;ctx.strokeStyle=ci.t<ci.drop?(Math.floor(t/90)%2?'#ffcc68':'#8b5d42'):'#ff6d70';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ci.x,ci.y,22+18*clamp(pz,0,1),0,Math.PI*2);ctx.stroke();if(ci.t>=ci.drop){ctx.fillStyle='rgba(107,83,91,.65)';for(let i=0;i<6;i++)ctx.fillRect(ci.x+Math.cos(i)*ci.t*25,ci.y+Math.sin(i*1.6)*ci.t*18,6,6)}});drawCharacter(ctx,{name:'YOU',human:true},p.x,p.y,{color:p.stun>0?'#ff8490':'#63e4ff',label:false});if(p.swing>0){ctx.strokeStyle='#ffe17d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,38,-1.1,.7);ctx.stroke()}pxText(ctx,`CARRY ${p.carry}`,p.x,p.y-42,8,p.carry?'#ffe078':'#8ea1bd');dust.forEach(d=>{ctx.fillStyle='#e4c179';for(let i=0;i<5;i++)ctx.fillRect(d.x+Math.cos(i*1.5)*d.t*35,d.y+Math.sin(i*1.7)*d.t*28,3,3)});panel(ctx,14,14,108,45,'BANKED',p.banked,'#ffe078');panel(ctx,132,14,108,45,'CARRY',p.carry,'#8feaff');panel(ctx,w-122,14,108,45,'DANGER','CAVE-INS','#ff8390')
    });
  }

  function gameTroll(){
    const {ctx,w,h}=canvasEnv();let sneak=0,unbanked=0,banked=0,alert=0,risk=.12,breath=0,breathSpeed=1.0,grabs=0,wake=0,retreat=0,particles=[];
    const holding=()=>RP.keys.has(' ')||RP.keys.has('space');
    listen(window,'keydown',e=>{if(e.code==='Space'){activity(.02);e.preventDefault()}if(e.key.toLowerCase()==='b'&&unbanked>0&&!wake){retreat=1;gameCallout('RETREAT!','GET THE LOOT TO SAFETY','gold');activity(.08);e.preventDefault()}},{passive:false});
    loop((dt,t)=>{
      if(wake>0){wake-=dt;if(wake<=0){sneak=0;alert=0;risk=.12;unbanked=0;retreat=0}return}
      breath+=dt*breathSpeed;const cycle=(Math.sin(breath*Math.PI*2)+1)/2;const danger=cycle>.76;const moving=holding()&&!retreat;
      if(retreat){sneak=Math.max(0,sneak-dt*1.15);alert=Math.max(0,alert-dt*.28);if(sneak<=0){const dep=unbanked;banked+=dep;unbanked=0;retreat=0;risk=Math.max(.12,risk-.08);gameCallout('SAFE!',`+${dep} TREASURE BANKED`,'gold');sfx('bank')}}
      else if(moving){const speed=.23*(1-risk*.25);sneak=clamp(sneak+dt*speed,0,1);alert+=dt*(danger?1.25:.18)*(1+risk);if(danger&&Math.random()<dt*3)playTone(110,.03,.008,'sawtooth')}
      else alert=Math.max(0,alert-dt*(danger?.10:.32));
      if(sneak>=1&&!retreat){grabs++;const gain=1+Math.min(5,Math.floor(grabs/2))+irand(0,2);unbanked+=gain;sneak=.50;risk=clamp(risk+.075,.12,.72);breathSpeed=1+risk*.45;particles.push({x:w*.72,y:h*.62,t:0});gameCallout('TREASURE GRABBED!',`+${gain} UNBANKED · PRESS B TO ESCAPE`,grabs%3===0?'great':'good');sfx('gold')}
      if(alert>=1){wake=1.2;gameCallout('TROLL WOKE!','UNBANKED TREASURE LOST','boom');screenShake(.8);playTone(72,.28,.055,'sawtooth')}
      particles.forEach(p=>p.t+=dt);particles=particles.filter(p=>p.t<.7);setScore(banked,clamp(banked*7+grabs*1.4,0,100),RP.participation)
    },t=>{
      const g=ctx.createRadialGradient(w*.66,h*.5,30,w*.66,h*.5,w*.7);g.addColorStop(0,'#5a392d');g.addColorStop(.45,'#2b2026');g.addColorStop(1,'#090d16');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle='#302536';for(let i=0;i<16;i++){const x=(i*83)%w,hh=20+(i*31)%75;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+12,hh);ctx.lineTo(x+24,0);ctx.fill()}
      // safe entrance
      ctx.fillStyle='#1a2631';rounded(ctx,22,h*.38,90,h*.36,10);ctx.fill();ctx.strokeStyle='#65809b';ctx.stroke();pxText(ctx,'SAFE',67,h*.55,10,'#8feaff');
      // treasure
      const tx=w*.72,ty=h*.66;ctx.fillStyle='#d49e3f';for(let i=0;i<30;i++){ctx.beginPath();ctx.arc(tx+rand(-55,55),ty+rand(-18,18),rand(3,7),0,Math.PI*2);ctx.fill()}ctx.fillStyle='#fff0a0';ctx.fillRect(tx-18,ty-35,36,5);
      // troll
      const trX=w*.82,trY=h*.45;ctx.fillStyle=wake>0?'#8b5a4a':'#5f7450';ctx.beginPath();ctx.ellipse(trX,trY,75,58,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#4f6444';ctx.beginPath();ctx.ellipse(trX+30,trY-48,43,36,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e7d1a9';ctx.fillRect(trX+18,trY-54,30,13);const eyeOpen=wake>0||((Math.sin(breath*Math.PI*2)+1)/2)>.76;ctx.fillStyle=eyeOpen?'#ff6a62':'#2d302b';ctx.fillRect(trX+30,trY-51,7,eyeOpen?5:2);if(!eyeOpen)pxText(ctx,'Z z z',trX+55,trY-94,10,'#c9d4e5');
      const px=lerp(72,tx-70,sneak);drawCharacter(ctx,{name:'YOU',human:true},px,h*.70,{color:'#63e4ff',label:false,scale:.82});pxText(ctx,retreat?'RETREATING':'YOU',px,h*.77,7,retreat?'#ffe078':'#fff0a6');
      // alert / breath UI
      panel(ctx,14,14,115,45,'BANKED',banked,'#ffe078');panel(ctx,139,14,115,45,'UNBANKED',unbanked,unbanked?'#ffcf70':'#8ea1bd');ctx.fillStyle='#111c30';ctx.fillRect(w*.36,28,w*.30,10);ctx.fillStyle=alert>.72?'#ff6d7d':alert>.4?'#ffd45f':'#73e5ad';ctx.fillRect(w*.36,28,w*.30*clamp(alert,0,1),10);pxText(ctx,`TROLL ALERT ${Math.round(alert*100)}%`,w*.51,18,7,'#dce8ff');const cycle=(Math.sin(breath*Math.PI*2)+1)/2;ctx.strokeStyle=cycle>.76?'#ff6d7d':'#79e5b0';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<80;i++){const x=w*.36+i/79*w*.30,y=55+Math.sin((i/79*3+breath)*Math.PI*2)*6;ctx.lineTo(x,y)}ctx.stroke();pxText(ctx,retreat?'AUTO-RETREATING · DO NOT PANIC':unbanked?'HOLD SPACE TO SNEAK · B TO BANK':'HOLD SPACE TO SNEAK',w*.5,h-22,8,'#cfe1f7');particles.forEach(p=>{ctx.fillStyle='#ffe078';for(let i=0;i<6;i++)ctx.fillRect(p.x+Math.cos(i)*p.t*55,p.y+Math.sin(i*1.4)*p.t*34,3,3)})
    });
  }


  async function loadResults(){
    el('rpResultsTitle').textContent=`${game().name} RESULTS`;el('rpResultsSub').textContent='Locking the six-contestant table…';el('rpRewardLine').textContent='';el('rpResultsList').innerHTML='<div class="rp-result-row is-loading"><strong>Waiting for final scores…</strong></div>';
    await new Promise(r=>setTimeout(r,850));
    try{const data=await rpc('reparty_get_round_results',{p_round_no:Number(RP.state.round_no)});let rows=Array.isArray(data)?data:[];if(rows.length===1&&Array.isArray(rows[0]))rows=rows[0];RP.results=rows;renderResults(rows);if(RP.joined&&RP.state?.played_round)await claimReward()}catch(err){console.warn('REPARTY results',err);el('rpResultsSub').textContent='Results are still being finalised.'}
  }
  function renderResults(rows){
    const who=me().toLowerCase(),list=rows||[],top=list.slice(0,3);el('rpResultsList').innerHTML=(top.length?`<div class="rp-podium">${[top[1],top[0],top[2]].filter(Boolean).map(r=>`<div class="rp-podium-place is-${r.placement} ${String(r.username).toLowerCase()===who?'is-me':''}"><i>${r.placement}</i><b>${safe(initials(r.username))}</b><strong>${safe(r.username)}</strong><small>${Math.round(Number(r.score)||0)} SCORE</small></div>`).join('')}</div>`:'')+list.map(r=>`<div class="rp-result-row ${String(r.username).toLowerCase()===who?'is-me':''} ${Number(r.placement)===1?'is-winner':''}"><b>${Number(r.placement)||'—'}</b><strong>${safe(r.username)}${r.is_bot?' <small>AI</small>':''}</strong><span>${Math.round(Number(r.score)||0)} SCORE</span><em>${r.is_bot?'':fmtGp(r.gp_preview||0)}</em></div>`).join('');el('rpResultsSub').textContent=`TOTAL POT ${fmtGp(RP.state.prize_pot)} · 1ST ${fmtGp(firstPrize(RP.state.prize_pot))} · ${game().skill} XP`;el('rpResultsNext').textContent=`NEXT GAME IN ${(msLeft()/1000).toFixed(1)}s`;fanfare()
  }
  async function claimReward(){
    try{const data=await rpc('reparty_claim_reward',{p_round_no:Number(RP.state.round_no)});let r=Array.isArray(data)?data[0]:data;if(!r)return;RP.reward=r;el('rpRewardLine').textContent=Number(r.gp_awarded)>0?`YOU PLACED #${r.placement} · +${Number(r.gp_awarded).toLocaleString('en-GB')} GP · +${Number(r.xp_awarded).toLocaleString('en-GB')} ${r.skill_label||game().skill} XP`:'No reward — meaningful participation is required.';if(typeof character!=='undefined'&&character){if(Number.isFinite(Number(r.new_gp)))character.gp=Number(r.new_gp);if(r.skill_key&&Number.isFinite(Number(r.new_skill_xp)))character[r.skill_key+'_xp']=Number(r.new_skill_xp);try{typeof renderCharacter==='function'&&renderCharacter()}catch(_){ }}RP.history.unshift({name:game().name,place:Number(r.placement)||0,gp:Number(r.gp_awarded)||0});RP.history=RP.history.slice(0,5);RP.sessionGames++;RP.sessionGp+=Number(r.gp_awarded)||0;el('rpSessionGames').textContent=`${RP.sessionGames} game${RP.sessionGames===1?'':'s'}`;el('rpSessionGp').textContent=fmtGp(RP.sessionGp);renderHistory()}
    catch(err){console.warn('REPARTY reward',err);el('rpRewardLine').textContent='Reward is still being processed.'}
  }
  function renderHistory(){const box=el('rpHistory');if(!box)return;box.innerHTML=RP.history.length?RP.history.map(x=>`<div class="rp-history-card"><small>RECENT</small><b>${safe(x.name)}</b><strong>#${x.place} · ${Number(x.gp).toLocaleString('en-GB')} GP</strong></div>`).join(''):'<div class="rp-history-card"><small>REPARTY</small><b>Your recent rounds appear here</b><strong>JOIN ANY TIME</strong></div>'}
  function renderRolling(){const box=el('rpRolling');if(!box)return;const list=Array.isArray(RP.state?.rolling)?RP.state.rolling:[];box.innerHTML=list.length?list.slice(0,10).map((r,i)=>`<div class="reparty-player-card" style="--rp-accent:${COLORS[i%COLORS.length]}"><i class="reparty-avatar"><span>${i+1}</span></i><span><strong>${safe(r.username)}</strong><small>LAST 10 GAMES</small></span><em>${Number(r.points)||0}</em></div>`).join(''):'<div class="reparty-player-card"><i class="reparty-avatar"><span>—</span></i><span><strong>No rolling scores yet</strong><small>PLAY A ROUND TO START IT</small></span></div>'}

  async function open(){
    ensureUi();if(!signedIn()){try{typeof setAuthMode==='function'&&setAuthMode('login');el('characterDialog')?.showModal();return}catch(_){ }}RP.open=true;RP.roundToken='';const d=el('repartyDialog');try{if(!d.open)d.showModal()}catch(_){d.setAttribute('open','')};show('rpLobby');el('rpLobbyNote').textContent='Joining the live Reparty room…';await join({silent:true});if(RP.state&&RP.joined)toast(RP.queued?'Round already live — you are in the next one.':'You joined Reparty!');clearInterval(RP.poll);RP.poll=setInterval(()=>void refreshState(),650)
  }
  async function close(){RP.open=false;RP.roundToken='';cleanupGame();stopSelectorFX();clearInterval(RP.poll);RP.poll=0;await leave();try{el('repartyDialog')?.close()}catch(_){el('repartyDialog')?.removeAttribute('open')}}
  function hookButton(){const b=el('openReparty');if(!b)return false;b.onclick=e=>{e.preventDefault();e.stopPropagation();void open()};return true}
  function boot(){ensureUi();if(!hookButton()){setTimeout(boot,100);return}renderHistory();everyUi()}
  function everyUi(){setInterval(()=>{if(!RP.open||!RP.state)return;if(RP.state.phase==='pregame'&&!RP.selectorTimer)renderSelector();if(RP.state.phase==='live'&&RP.joined&&(RP.queued||!RP.state.playing))renderSpectator();if(RP.state.phase==='results'&&el('rpResultsNext'))el('rpResultsNext').textContent=`NEXT GAME IN ${(msLeft()/1000).toFixed(1)}s`},180)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.Reparty={open,close,join,get state(){return RP.state},games:GAME_LIST};
})();
