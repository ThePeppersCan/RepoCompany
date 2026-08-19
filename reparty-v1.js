/* REPARTY V23.6 — Minecart Mayhem Part 3: clarity / fun / feel tuning. Goblin Bomb Party remains V23.3; all other Reparty games remain unchanged. */
(()=>{
  if(window.__REPARTY_V2__) return;
  window.__REPARTY_V2__=true;

  const GAME_LIST=[
    {id:'goblin_bomb_party',name:'GOBLIN BOMB PARTY',skill:'Firemaking',type:'SURVIVAL',goal:'Aim, throw, dodge and intercept the live bomb. Be the last contestant standing.',tip:'WASD / ARROWS move · MOUSE aim · CLICK / SPACE throw · SHIFT dodge · throws can miss and be intercepted'},
    {id:'potion_panic',name:'POTION PANIC',skill:'Herblore',type:'ALCHEMY',goal:'Memorise the recipe, mix it cleanly, control the heat, then bottle at the perfect moment.',tip:'Click ingredients in order · HOLD SPACE to heat / release to cool · ENTER or click cauldron to bottle'},
    {id:'fishing_frenzy',name:'FISHING FRENZY',skill:'Fishing',type:'ARCADE',goal:'Cast at fish entering from the right, hook them, then fight the line without snapping it.',tip:'Aim + CLICK to cast · HOLD SPACE to reel / release to ease tension · rare fish fight harder'},
    {id:'chopping_frenzy',name:'CHOPPING FRENZY',skill:'Woodcutting',type:'REACTION',goal:'Chop ripe trees at the perfect moment. Rotten trees break your combo.',tip:'Aim at a ripe tree · CLICK / SPACE to swing · hit the centre timing band for perfect chops'},
    {id:'builder_blitz',name:'BUILDER BLITZ',skill:'Construction',type:'PUZZLE',goal:'Study the structure, then assemble the correct pieces with the right positions and rotations.',tip:'Select a piece · R rotates · CLICK grid to place · RIGHT-CLICK removes · SUBMIT BUILD when ready'},
    {id:'minecart_mayhem',name:'MINECART MAYHEM',skill:'Mining',type:'RACING',goal:'Race the mine, read clear hazards, build Flow and spend Boost to overtake the pack.',tip:'← → rails · SPACE / ↑ jump · ↓ duck · SHIFT boost · choose SAFE / BALANCED / RICH at two track splits'},
    {id:'rooftop_rush',name:'ROOFTOP RUSH',skill:'Agility',type:'RACING',goal:'Keep your flow across the skyline, choosing safer lines or faster rooftop shortcuts.',tip:'← → position · SPACE / ↑ jump · ↓ slide · ramps open faster riskier routes · bad falls recover'},
    {id:'chicken_chase',name:'CHICKEN CHASE',skill:'Farming',type:'CHASE',goal:'Herd skittish chickens, read their escape routes and commit to a properly timed net swing.',tip:'WASD / ARROWS chase · SPACE winds up/sweeps net · SHIFT dash · mud slows · roosters fight back'},
    {id:'treasure_tiles',name:'TREASURE TILES',skill:'Agility',type:'SURVIVAL',goal:'Read cracks before they collapse, use special tiles and survive the shrinking six-player arena.',tip:'WASD / ARROWS move · SPACE dash · cracks progress SAFE → CRACK → DANGER → FALL · specials can save you'},
    {id:'goblin_says',name:'GOBLIN SAYS',skill:'Magic',type:'REACTION',goal:'Read the host, ignore fake orders and react faster as the show becomes more deceptive.',tip:'SPACE jump · ↓ crouch · ←/→ move · E spin · FREEZE means do nothing · only obey GOBLIN SAYS'},
    {id:'gold_rush',name:'GOLD RUSH',skill:'Mining',type:'RISK',goal:'Open cave routes, mine richer seams, manage carrying weight and bank before trouble steals it.',tip:'WASD / ARROWS move · SPACE mine/break wall · bank at entrance · GOLD FEVER seams are rich but contested'},
    {id:'dont_wake_troll',name:"DON'T WAKE THE TROLL",skill:'Slayer',type:'STEALTH',goal:'Choose how greedy to be, move with the troll’s breathing, freeze when it stirs, then bank safely.',tip:'A/D choose loot · HOLD SPACE sneak · SHIFT+SPACE run (loud) · freeze while troll stirs · B retreat/bank'}
  ];
  const GAME_MAP=Object.fromEntries(GAME_LIST.map(g=>[g.id,g]));
  const GAME_PRESENTATION=Object.freeze({
    goblin_bomb_party:{sigil:'BOMB',accent:'#ff6f77',accent2:'#ffd45f',tag:'AIM · THROW · DODGE · SURVIVE'},
    potion_panic:{sigil:'BREW',accent:'#8b7dff',accent2:'#67efc4',tag:'MEMORISE · MIX · MASTER'},
    fishing_frenzy:{sigil:'FISH',accent:'#52dfff',accent2:'#ffd75f',tag:'HOOK · COMBO · CASH IN'},
    chopping_frenzy:{sigil:'CHOP',accent:'#6fe184',accent2:'#ffe06a',tag:'READ · SWING · STREAK'},
    builder_blitz:{sigil:'BUILD',accent:'#ffb15e',accent2:'#7be6ff',tag:'STUDY · REBUILD · PERFECT'},
    minecart_mayhem:{sigil:'CART',accent:'#f8bd55',accent2:'#61dfff',tag:'RACE · REACT · BOOST · OVERTAKE'},
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
    sessionGames:0,sessionGp:0,audio:null,screenShake:0,gameLaunchAt:0,gameInitialSeconds:0,climaxCalled:false,localFinale:false
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
  const INTRO_READ_MS=3800;
  const COUNTDOWN_STEP_MS=720;
  const GO_HOLD_MS=520;
  const INTRO_TOTAL_MS=INTRO_READ_MS+COUNTDOWN_STEP_MS*3+GO_HOLD_MS;
  const BOT_PROFILES=Object.freeze({
    rocky:{risk:.82,reaction:.82,patience:.36,chaos:.18},
    soup:{risk:.34,reaction:.58,patience:.88,chaos:.08},
    barry:{risk:.52,reaction:.68,patience:.64,chaos:.12},
    gregg:{risk:.58,reaction:.61,patience:.56,chaos:.22},
    besquelcher:{risk:.72,reaction:.64,patience:.42,chaos:.82},
    pipsqueak:{risk:.48,reaction:.76,patience:.62,chaos:.18},
    jud:{risk:.62,reaction:.70,patience:.52,chaos:.28},
    jenny:{risk:.46,reaction:.72,patience:.70,chaos:.14},
    'nimbler 2000':{risk:.55,reaction:.75,patience:.56,chaos:.16},
    'dopey dom':{risk:.44,reaction:.48,patience:.50,chaos:.46},
    'mad rager':{risk:.88,reaction:.66,patience:.25,chaos:.74},
    debbie:{risk:.40,reaction:.63,patience:.72,chaos:.15}
  });
  const botProfile=name=>BOT_PROFILES[String(name||'').toLowerCase()]||{risk:.5,reaction:.62,patience:.58,chaos:.2};
  const activeProgress=()=>{
    if(!RP.gameLaunchAt||!RP.gameInitialSeconds)return 0;
    const elapsed=(performance.now()-RP.gameLaunchAt)/1000;
    return clamp(elapsed/Math.max(1,RP.gameInitialSeconds),0,1);
  };
  const difficultyRamp=(min=1,max=1.8)=>lerp(min,max,Math.pow(activeProgress(),1.25));
  function roundClimax(){
    if(RP.climaxCalled||gameSeconds()>7.2)return;
    RP.climaxCalled=true;
    gameCallout('FINAL SECONDS','EVERY MOVE COUNTS NOW','great');
    const shell=el('repartyDialog')?.querySelector('.reparty-shell');shell?.classList.add('is-climax');
    later(()=>shell?.classList.remove('is-climax'),6800);
  }
  function impactPause(ms=34){
    const body=el('rpGameBody');if(!body)return;body.classList.add('is-hitstop');setTimeout(()=>body.classList.remove('is-hitstop'),ms);
  }
  function cameraPunch(power=.35){screenShake(power);impactPause(Math.round(20+power*28));}
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
  const GAME_STINGS={
    goblin_bomb_party:[150,220,330],potion_panic:[420,620,830],fishing_frenzy:[310,470,710],chopping_frenzy:[190,280,410],
    builder_blitz:[260,390,520],minecart_mayhem:[130,195,292],rooftop_rush:[350,525,790],chicken_chase:[390,520,680],
    treasure_tiles:[270,405,610],goblin_says:[460,690,920],gold_rush:[220,330,495],dont_wake_troll:[110,165,247]
  };
  function gameSting(id=game().id){const notes=GAME_STINGS[id]||[330,495,660];notes.forEach((f,i)=>setTimeout(()=>playTone(f,.07+i*.018,.014+i*.003,i===0?'triangle':'square'),i*72))}

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
    const selectorHidden=s.phase==='pregame'&&msLeft()>2400;el('rpPrizeLabel').textContent=sp.pot;el('rpPrizeTop').textContent=fmtGp(s.prize_pot);el('rpPrizeFirst').textContent=`1ST ${fmtGp(firstPrize(s.prize_pot))}`;el('rpPrizePill').className=`reparty-pill rp-prize-pill ${sp.className}`;el('rpSkillTop').textContent=selectorHidden?'???':g.skill;el('rpRoundNo').textContent=`#${s.round_no}`;el('rpRoundSpecial').textContent=sp.label;
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
    const s=RP.state,g=game(),hidden=msLeft()>2400;el('rpSelectorKicker').textContent=hidden?'RANDOMISING NEXT GAME':s.special==='mystery'?'MYSTERY ROUND':'THE MACHINE HAS CHOSEN';el('rpSelectorType').textContent=hidden?'SELECTING':g.type;el('rpSelectorName').textContent=hidden?'???':g.name;el('rpSelectorGoal').textContent=hidden?'Game, skill XP and objective reveal together when the selector locks in.':g.goal;el('rpSelectorPrize').textContent=`TOTAL ${fmtGp(s.prize_pot)} · 1ST ${fmtGp(firstPrize(s.prize_pot))}`;el('rpSelectorSkill').textContent=hidden?'XP ???':g.skill;el('rpSelectorSpecial').textContent=specialMeta().label;renderSelectorRail(g.id,true);el('rpSelectorCount').textContent=`STARTS IN ${Math.max(1,Math.ceil(msLeft()/1000))}`;
  }
  function renderSelectorRail(centerId,shuffle=false){
    const g=GAME_MAP[centerId]||game(),idx=GAME_LIST.findIndex(x=>x.id===g.id),offset=shuffle?irand(-4,4):0,len=GAME_LIST.length;
    el('rpSelectorRail').innerHTML=Array.from({length:5},(_,k)=>{const x=GAME_LIST[((idx-2+k+offset)%len+len)%len];return `<span class="rp-selector-chip ${k===2?'is-current':''}"><i>${safe(x.type)}</i>${safe(x.name)}</span>`}).join('');
  }
  function startSelectorFX(){
    stopSelectorFX();let tick=0;RP.selectorTimer=setInterval(()=>{if(!RP.open||RP.state?.phase!=='pregame')return;const left=msLeft();el('rpSelectorCount').textContent=`STARTS IN ${Math.max(1,Math.ceil(left/1000))}`;if(left>2400){tick++;const fake=GAME_LIST[(GAME_LIST.findIndex(g=>g.id===game().id)+tick)%GAME_LIST.length];el('rpSelectorName').textContent=fake.name;el('rpSelectorType').textContent=fake.type;el('rpSelectorGoal').textContent='Game, skill XP and objective reveal together when the selector locks in.';el('rpSelectorSkill').textContent='XP ???';el('rpSkillTop').textContent='???';renderSelectorRail(fake.id,true);playTone(240+(tick%5)*45,.025,.007)}else{el('rpSelectorName').textContent=game().name;el('rpSelectorType').textContent=game().type;el('rpSelectorGoal').textContent=game().goal;el('rpSelectorSkill').textContent=game().skill;el('rpSkillTop').textContent=game().skill;renderSelectorRail(game().id)}},140)
  }
  function stopSelectorFX(){clearInterval(RP.selectorTimer);RP.selectorTimer=0}

  function newScope(){cleanupScope();const timeouts=new Set(),intervals=new Set(),listeners=[],rafs=new Set(),cleanups=[];RP.scope={timeouts,intervals,listeners,rafs,cleanups};return RP.scope}
  function cleanupScope(){const s=RP.scope;if(!s)return;for(const x of s.timeouts)clearTimeout(x);for(const x of s.intervals)clearInterval(x);for(const [target,type,fn,opt] of s.listeners)target.removeEventListener(type,fn,opt);for(const id of s.rafs)cancelAnimationFrame(id);for(const fn of s.cleanups||[]){try{fn()}catch(_){}}RP.scope=null}
  function onCleanup(fn){if(typeof fn==='function'&&RP.scope?.cleanups)RP.scope.cleanups.push(fn);return fn}
  function later(fn,ms){const s=RP.scope;if(!s)return setTimeout(fn,ms);const id=setTimeout(()=>{s.timeouts.delete(id);fn()},ms);s.timeouts.add(id);return id}
  function every(fn,ms){const s=RP.scope;if(!s)return setInterval(fn,ms);const id=setInterval(fn,ms);s.intervals.add(id);return id}
  function listen(target,type,fn,opt){target.addEventListener(type,fn,opt);RP.scope?.listeners.push([target,type,fn,opt]);return fn}
  function loop(update,draw){const s=RP.scope;let last=performance.now(),id=0;const frame=t=>{if(RP.scope!==s||RP.finished||RP.state?.phase!=='live')return;const dt=Math.min(.04,(t-last)/1000);last=t;update?.(dt,t);draw?.(t);const c=el('rpCanvas');if(c&&c.style.visibility!=='hidden'){const r=c.getBoundingClientRect(),ctx=c.getContext('2d');if(ctx&&r.width>0&&r.height>0)drawCinematicOverlay(ctx,r.width,r.height,t)}if(RP.scope!==s)return;id=requestAnimationFrame(frame);s?.rafs.add(id)};id=requestAnimationFrame(frame);s?.rafs.add(id);return id}
  function activity(n=.04){RP.inputCount++;RP.participation=Math.min(1,RP.participation+n)}
  function setScore(raw,norm,participation=RP.participation){RP.rawScore=raw;RP.score=clamp(Number(norm)||0,0,100);RP.participation=Math.max(RP.participation,clamp(Number(participation)||0,0,1));if(el('rpGameScore'))el('rpGameScore').textContent=`SCORE ${Math.max(0,Math.round(Number(raw)||0))}`}

  function startGame(){
    const g=game();newScope();RP.finished=false;RP.localFinale=false;RP.climaxCalled=false;RP.startedAt=performance.now();RP.gameLaunchAt=0;RP.gameInitialSeconds=0;if(el('rpDom'))el('rpDom').className='rp-dom-layer';el('rpGameName').textContent=g.name;el('rpGameKicker').textContent=`${g.type} · ${g.skill.toUpperCase()} XP`;el('rpGameScore').textContent='SCORE 0';el('rpGameTimer').textContent=gameSeconds().toFixed(1);
    const canvas=el('rpCanvas');canvas.style.visibility='hidden';const m=present();renderRivalRibbon();
    const qaFast=Boolean(window.__REPARTY_QA_FAST__);const countdownStep=qaFast?90:COUNTDOWN_STEP_MS;const goHold=qaFast?90:GO_HOLD_MS;const available=Math.max(qaFast?700:2400,gameSeconds()*1000-(qaFast?500:9000));const targetIntro=qaFast?620:INTRO_TOTAL_MS+(g.id==='goblin_bomb_party'?500:0);const introTotal=Math.min(targetIntro,available);const readMs=Math.max(qaFast?220:2200,introTotal-(countdownStep*3+goHold));
    el('rpDom').innerHTML=`<div class="rp-instruction rp-instruction-v23" style="--accent:${m.accent};--accent2:${m.accent2}"><div class="rp-instruction-sigil">${safe(m.sigil)}</div><span class="rp-instruction-type">${safe(g.type)} · ${safe(g.skill.toUpperCase())} XP</span><h3>${safe(g.name)}</h3><b class="rp-instruction-tag">${safe(m.tag)}</b><div class="rp-howto"><span><small>OBJECTIVE</small><strong>${safe(g.goal)}</strong></span><span><small>CONTROLS</small><strong>${safe(g.tip)}</strong></span></div>${g.id==='goblin_bomb_party'?`<div class="rp-bomb-instruction-demo" aria-hidden="true"><span class="rp-bomb-demo-throw"><i class="dude a"></i><i class="bomb"></i><i class="trail"></i><i class="dude b"></i><b>THROW / CATCH</b></span><span class="rp-bomb-demo-dodge"><i class="dude c"></i><i class="bomb"></i><i class="dash"></i><b>DODGE</b></span><span class="rp-bomb-demo-loose"><i class="bomb"></i><i class="dude d"></i><i class="dude e"></i><b>LOOSE BOMB = RACE</b></span></div>`:''}<div class="rp-instruction-progress"><i id="rpInstructionFill"></i></div><div class="rp-ready-count is-reading" id="rpReadyCount">READ THE RULES · GET READY</div><div class="rp-instruction-crowd" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`;
    const fill=el('rpInstructionFill');if(fill)requestAnimationFrame(()=>{fill.style.transitionDuration=`${readMs}ms`;fill.style.width='100%'});
    later(()=>{
      let n=3;const r=el('rpReadyCount');if(r){r.classList.remove('is-reading');r.textContent='3';playTone(640,.06,.018)}
      const tick=every(()=>{n--;const rr=el('rpReadyCount');if(!rr)return;if(n>0){rr.textContent=n;playTone(420+n*80,.055,.018)}else{clearInterval(tick);rr.textContent='GO!';rr.classList.add('is-go');gameSting(g.id);gameCallout('GO!','MAKE IT COUNT','great');later(()=>{if(RP.finished)return;el('rpDom').innerHTML='';canvas.style.visibility='visible';canvas.focus({preventScroll:true});RP.startedAt=performance.now();RP.gameLaunchAt=performance.now();RP.gameInitialSeconds=Math.max(1,gameSeconds());launchGame(g.id)},goHold)}},countdownStep);
    },readMs);
    clearInterval(RP.uiTimer);RP.uiTimer=setInterval(()=>{if(!RP.open||RP.state?.phase!=='live')return;const left=gameSeconds();el('rpGameTimer').textContent=left.toFixed(1);if(RP.gameLaunchAt)roundClimax();if(left<=.12&&!RP.finished)void finishGame()},80);
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
  function cleanupGame(clearTimer=true,clearVisuals=true){if(clearTimer){clearInterval(RP.uiTimer);RP.uiTimer=0}cleanupScope();RP.keys.clear();if(clearVisuals){const canvas=el('rpCanvas');if(canvas){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);canvas.style.visibility='visible'}if(el('rpDom')){el('rpDom').innerHTML='';el('rpDom').className='rp-dom-layer'}if(el('rpGameFx'))el('rpGameFx').innerHTML=''}}

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
     V22.23 — REPARTY BUILDER + REVEAL HOTFIX
     The minigames below are intentionally stateful, input-driven arcade games.
     They share the Reparty shell/reward contract, but no game is just a reskinned
     clicker. Every mode has its own risk, timing, movement or mastery loop.
     -------------------------------------------------------------------------- */

  function gameBomb(){
    const {c,ctx,w,h}=canvasEnv(),roster=contestantList();
    const arena={cx:w*.5,cy:h*.56,rx:w*.405,ry:h*.315};
    const BOMB_ASSET_ROOT='assets/reparty/goblin-bomb-v23-2/';
    // V23.3: one authoritative feel table so future balance tweaks do not become scattered magic numbers.
    const TUNE=Object.freeze({
      moveAccel:1325,maxRun:228,holderSlow:.90,drag:.045,
      dashImpulse:565,dashDuration:.17,dashCooldown:1.66,
      throwMin:92,throwMax:302,throwSpeed:625,throwMinDuration:.18,throwMaxDuration:.47,
      aimAssistAngle:.39,catchRadius:22,catchFacingBonus:6,dodgeCatchRadius:5,
      antiReturnMs:2350,finalAntiReturnMs:680,loosePickupRadius:27,
      cameraBase:1.018,cameraLoose:1.035,cameraDanger:1.045,cameraFinal:1.095
    });
    const loadBombImage=src=>{const im=new Image();im.decoding='async';im.src=src;return im};
    const bombArt={
      arena:loadBombImage(BOMB_ASSET_ROOT+'powderworks-arena.png'),foreground:loadBombImage(BOMB_ASSET_ROOT+'powderworks-foreground.png'),
      bomb:loadBombImage(BOMB_ASSET_ROOT+'bomb-atlas.png'),explosion:loadBombImage(BOMB_ASSET_ROOT+'explosion-atlas.png'),fallback:loadBombImage(BOMB_ASSET_ROOT+'contestant-fallback-atlas.png')
    };
    const canonicalArt=Object.freeze({
      besquelcher:'assets/repo-sports-v2/players/besquelcher-standing.png',jenny:'assets/repo-sports-v2/players/jenny-standing.png',
      'nimbler 2000':'assets/repo-sports-v2/players/nimbler2000-standing.png',nimbler2000:'assets/repo-sports-v2/players/nimbler2000-standing.png',
      pipsqueak:'assets/repo-sports-v2/players/pipsqueak-standing.png',rocky:'assets/repo-sports-v2/players/rocky-standing.png',soup:'assets/repo-sports-v2/players/soup-standing.png',
      barry:'assets/commentator-22.png','barry bramble':'assets/commentator-22.png'
    });
    const actorArt=new Map();
    const artFor=name=>{const key=String(name||'').trim().toLowerCase(),src=canonicalArt[key];if(!src)return null;if(!actorArt.has(src))actorArt.set(src,loadBombImage(src));return actorArt.get(src)};
    const masterVol=()=>{let v=.72;try{const n=document.querySelector('#masterVolume,#siteVolume,#repoVolume,[data-master-volume]');if(n&&'value'in n){const max=Number(n.max)||100;v=clamp((Number(n.value)||0)/max,0,1)}}catch(_){}return v};
    const bombClips={};
    const clipNames=['throw','catch','intercept','dash','bounce','pickup','tick','steam','explode','crowd-gasp','crowd-cheer','duel','winner'];
    clipNames.forEach(name=>{const a=new Audio(BOMB_ASSET_ROOT+name+'.ogg');a.preload='auto';bombClips[name]=a});
    const bombMusic=['normal','danger','final'].map(name=>{const a=new Audio(BOMB_ASSET_ROOT+'music-'+name+'.ogg');a.preload='auto';a.loop=true;a.volume=0;return a});
    let musicStarted=false;
    const playClip=(name,vol=1,rate=1)=>{const base=bombClips[name];if(!base)return false;try{const a=base.cloneNode();a.volume=clamp(masterVol()*vol,0,1);a.playbackRate=clamp(rate,.72,1.45);a.play().catch(()=>{});return true}catch(_){return false}};
    const startBombMusic=()=>{if(musicStarted)return;musicStarted=true;bombMusic.forEach(a=>{try{a.currentTime=0;a.play().catch(()=>{})}catch(_){}})};
    const updateBombMusic=danger=>{startBombMusic();const m=masterVol()*(1-musicDuck*.55),normal=finalDuel?0:clamp(1-danger*1.48,0,1),hot=finalDuel?0:clamp((danger-.30)*1.68,0,1),fin=finalDuel?1:0;bombMusic[0].volume=lerp(bombMusic[0].volume,m*.18*normal,.08);bombMusic[1].volume=lerp(bombMusic[1].volume,m*.22*hot,.09);bombMusic[2].volume=lerp(bombMusic[2].volume,m*.25*fin,.11)};
    onCleanup(()=>bombMusic.forEach(a=>{try{a.pause();a.currentTime=0;a.volume=0}catch(_){}}));
    const personality=name=>{
      const n=String(name||'').toLowerCase();
      if(n.includes('rocky'))return'aggressive';
      if(n.includes('soup'))return'cautious';
      if(n.includes('barry'))return'balanced';
      if(n.includes('besquelcher'))return'chaotic';
      if(n.includes('pipsqueak'))return'mobile';
      if(n==='jud'||n.includes(' jud'))return'patient';
      return'balanced';
    };
    const actors=roster.map((p,i)=>{
      const a=i/Math.max(1,roster.length)*Math.PI*2-Math.PI/2,profile=botProfile(p.username);
      return {name:p.username,username:p.username,human:currentUser(p),bot:p.is_bot,color:COLORS[i%COLORS.length],profile,style:personality(p.username),
        x:arena.cx+Math.cos(a)*arena.rx*.72,y:arena.cy+Math.sin(a)*arena.ry*.68,vx:0,vy:0,facing:a+Math.PI,movePhase:rand(0,Math.PI*2),
        alive:true,eliminatedAt:0,spectatorX:0,spectatorY:0,dashCd:0,dashT:0,throwCd:0,recvAt:0,noReturnTo:-1,noReturnUntil:0,
        botState:'SEEK_SPACE',think:rand(.12,.34),wander:a,holdMin:rand(.48,.92),holdUntil:0,target:-1,targetPoint:null,incomingFlight:0,passes:0,catches:0,dodges:0,intercepts:0,forced:0,fakeT:0,throwT:0,catchT:0,pickupT:0,stunT:0,winT:0};
    });
    const human=actors.find(a=>a.human)||actors[0];
    const humanId=actors.indexOf(human);
    let cursor={x:arena.cx,y:arena.cy},camera={zoom:1,targetZoom:TUNE.cameraBase},heat=0,finalDuel=false,winner=-1,roundState='active',aftermath=0,lastHeatHolder=-1,musicDuck=0;
    let bomb={state:'reset',holder:-1,from:-1,intended:-1,dodgedBy:-1,x:arena.cx,y:arena.cy,z:0,x0:arena.cx,y0:arena.cy,tx:arena.cx,ty:arena.cy,t0:0,dur:0,fuseEnds:0,fuseTotal:6,lastPass:null,spin:0,vx:0,vy:0,bounces:0};
    let modifier={type:'none'},particles=[],smoke=[],scorches=[],explosions=[],crowdPulse=0,shake=0,tickCd=0;
    let stats={throws:0,catches:0,dodges:0,intercepts:0,forced:0,survival:0,elims:0,loosePickups:0,illegalReturns:0};

    const aliveIds=()=>actors.map((a,i)=>a.alive?i:-1).filter(i=>i>=0);
    const aliveCount=()=>aliveIds().length;
    const currentBombPos=()=>({x:bomb.x,y:bomb.y});
    const fuseLeft=()=>Math.max(0,(bomb.fuseEnds-performance.now())/1000);
    const protectedReturn=(holderId,targetId)=>{
      const a=actors[holderId];
      if(!a||targetId<0)return false;
      if(finalDuel)return targetId===a.noReturnTo&&performance.now()<a.noReturnUntil;
      return targetId===a.noReturnTo&&performance.now()<a.noReturnUntil;
    };
    const insideArena=(x,y,pad=0)=>{const nx=(x-arena.cx)/(arena.rx-pad),ny=(y-arena.cy)/(arena.ry-pad);return nx*nx+ny*ny<=1};
    const clampArena=a=>{
      const rx=arena.rx-30,ry=arena.ry-34,nx=(a.x-arena.cx)/rx,ny=(a.y-arena.cy)/ry,d=Math.hypot(nx,ny);
      if(d>1){a.x=arena.cx+nx/d*rx;a.y=arena.cy+ny/d*ry;const nxx=(a.x-arena.cx)/(rx*rx),nyy=(a.y-arena.cy)/(ry*ry),nm=Math.max(.0001,Math.hypot(nxx,nyy));const ux=nxx/nm,uy=nyy/nm,dot=a.vx*ux+a.vy*uy;if(dot>0){a.vx-=ux*dot*1.35;a.vy-=uy*dot*1.35}}
    };
    const screenToWorld=p=>({x:arena.cx+(p.x-arena.cx)/camera.zoom,y:arena.cy+(p.y-arena.cy)/camera.zoom});
    const chooseModifier=()=>{
      if(heat<=1||aliveCount()<=2||Math.random()>.34){modifier={type:'none'};return}
      const type=choose(['crate','speed','steam','bounce']);
      if(type==='crate')modifier={type,x:arena.cx-arena.rx*.34,y:arena.cy-arena.ry*.08,w:96,h:30,vx:choose([-1,1])*44};
      if(type==='speed')modifier={type,x:arena.cx+choose([-1,1])*arena.rx*.48,y:arena.cy+rand(-arena.ry*.28,arena.ry*.38),r:38};
      if(type==='steam')modifier={type,x:arena.cx+rand(-arena.rx*.38,arena.rx*.38),y:arena.cy+rand(-arena.ry*.34,arena.ry*.34),r:58,clock:0,period:3.3,burst:false};
      if(type==='bounce')modifier={type,x:arena.cx+rand(-arena.rx*.34,arena.rx*.34),y:arena.cy+rand(-arena.ry*.25,arena.ry*.32),w:88,h:28};
    };
    const fuseForHeat=()=>{
      const n=Math.max(2,aliveCount()),remaining=Math.max(1.5,gameSeconds()),future=Math.max(1,n-1),budget=Math.max(3.7,(remaining-1.05*future-1.0)/future);
      const progression=clamp((6-n)/4,0,1),base=lerp(6.35,4.75,progression),jitter=rand(-.55,.55),planned=clamp(base+jitter,4.15,7.35);
      return Math.min(planned,Math.max(3.95,budget+.25));
    };
    const assignHolder=(i,from=-1)=>{
      if(i<0||!actors[i]?.alive)return false;
      bomb.state='held';bomb.holder=i;bomb.from=from;bomb.x=actors[i].x;bomb.y=actors[i].y-20;bomb.z=0;bomb.vx=bomb.vy=0;bomb.bounces=0;
      const a=actors[i],t=performance.now();a.recvAt=t;a.throwCd=a.human?.045:.14;a.catches++;a.catchT=from>=0?.24:0;a.pickupT=from<0?.20:0;
      const holdSeconds=({aggressive:.54,cautious:.78,balanced:.66,chaotic:.61,mobile:.58,patient:.86}[a.style]||.66)+rand(-.055,.055);
      a.holdUntil=t+Math.max(.34,holdSeconds)*1000;
      if(from>=0){a.noReturnTo=from;a.noReturnUntil=t+(finalDuel?TUNE.finalAntiReturnMs:TUNE.antiReturnMs);bomb.lastPass={from,to:i,at:t};if(a.human)stats.catches++;}
      else{a.noReturnTo=-1;a.noReturnUntil=0}
      return true;
    };
    const nearestAimTarget=(from,point,maxAngle=TUNE.aimAssistAngle)=>{
      const a=actors[from];if(!a)return-1;const avx=point.x-a.x,avy=point.y-a.y,alen=Math.max(1,Math.hypot(avx,avy));let best=-1,bestScore=1e9;
      aliveIds().forEach(i=>{if(i===from)return;const b=actors[i],vx=b.x-a.x,vy=b.y-a.y,d=Math.max(1,Math.hypot(vx,vy)),dot=clamp((vx*avx+vy*avy)/(d*alen),-1,1),ang=Math.acos(dot);if(ang>maxAngle)return;const protectedBias=protectedReturn(from,i)?10000:0,score=ang*220+Math.abs(d-175)*.14+protectedBias;if(score<bestScore){bestScore=score;best=i}});return best;
    };
    const throwBomb=(from,point,intended=-1,reason='throw')=>{
      if(roundState!=='active'||bomb.state!=='held'||bomb.holder!==from)return false;const a=actors[from],held=(performance.now()-a.recvAt)/1000;
      const minHold=a.human?.035:(finalDuel?.20:.09);if(!a.alive||a.throwCd>0||held<minHold)return false;
      if(intended>=0&&protectedReturn(from,intended))return false;
      let dx=point.x-a.x,dy=point.y-a.y,d=Math.max(1,Math.hypot(dx,dy));const range=clamp(d,TUNE.throwMin,TUNE.throwMax),ux=dx/d,uy=dy/d;const tx=clamp(a.x+ux*range,38,w-38),ty=clamp(a.y+uy*range,64,h-42);
      const dur=clamp(range/TUNE.throwSpeed,TUNE.throwMinDuration,TUNE.throwMaxDuration),t=performance.now();bomb.state='flight';bomb.holder=-1;bomb.from=from;bomb.intended=intended;bomb.x0=a.x;bomb.y0=a.y-18;bomb.x=a.x;bomb.y=a.y-18;bomb.z=0;bomb.tx=tx;bomb.ty=ty;bomb.t0=t;bomb.dur=dur;bomb.spin=0;bomb.dodgedBy=-1;a.throwCd=.29;a.throwT=.24;a.passes++;
      if(a.human){stats.throws++;activity(.11)}
      if(window.__REPARTY_QA__){const tr=window.__REPARTY_BOMB_TRACE||(window.__REPARTY_BOMB_TRACE=[]);tr.push({type:'throw',from,to:intended,at:t,previous:bomb.lastPass,fuse:fuseLeft(),protectedTarget:a.noReturnTo,protectedUntil:a.noReturnUntil,reason})}
      bombSound('throw');return true;
    };
    const landLoose=(x,y,vx=0,vy=0,source=-1)=>{
      bomb.state='loose';bomb.holder=-1;bomb.from=source;bomb.intended=-1;bomb.x=clamp(x,36,w-36);bomb.y=clamp(y,66,h-42);bomb.z=0;bomb.vx=vx;bomb.vy=vy;bomb.bounces=0;
      gameCallout('BOMB LOOSE!','DON’T WAIT FOR SOMEONE ELSE','gold');
    };
    const catchBomb=(i,source,intercept=false)=>{
      if(!actors[i]?.alive)return false;const receiver=actors[i];
      if(source>=0&&protectedReturn(source,i))return false;
      if(source>=0&&bomb.lastPass&&bomb.lastPass.to===source&&bomb.lastPass.from===i&&!finalDuel&&performance.now()-bomb.lastPass.at<TUNE.antiReturnMs){stats.illegalReturns++;return false}
      const clutch=fuseLeft()<.82;assignHolder(i,source);bombSound(intercept?'intercept':'catch');cameraPunch(intercept?.18:.075);
      if(clutch){crowdPulse=Math.max(crowdPulse,.46);if(receiver.human){scoreBurst('CLUTCH CATCH!',receiver.x/w*100,receiver.y/h*100,'gold');gameCallout('CLUTCH CATCH!',`${fuseLeft().toFixed(1)}s ON THE FUSE`,'gold')}}
      if(window.__REPARTY_QA__){const tr=window.__REPARTY_BOMB_TRACE||(window.__REPARTY_BOMB_TRACE=[]);tr.push({type:'catch',from:source,to:i,at:performance.now(),intercept,protectedUntil:receiver.noReturnUntil})}
      if(receiver.human){if(intercept)stats.intercepts++;if(intercept)receiver.intercepts++;activity(.045)}
      if(intercept){gameCallout('INTERCEPTED!',`${receiver.name.toUpperCase()} STOLE THE THROW`,'gold');cameraPunch(.18)}
      return true;
    };
    const startHeat=()=>{
      if(RP.finished||RP.state?.phase!=='live')return;const live=aliveIds();
      if(live.length<=1){beginWinner(live[0]??-1);return}
      heat++;roundState='active';aftermath=0;finalDuel=live.length===2;camera.targetZoom=finalDuel?TUNE.cameraFinal:TUNE.cameraBase;chooseModifier();
      const holder=choose(live.length>2?live.filter(i=>i!==lastHeatHolder):live);lastHeatHolder=holder;const seconds=fuseForHeat();bomb.fuseTotal=seconds;bomb.fuseEnds=performance.now()+seconds*1000;bomb.lastPass=null;assignHolder(holder,-1);actors.forEach(a=>{a.noReturnTo=-1;a.noReturnUntil=0;a.throwCd=Math.max(a.throwCd,.08)});actors[holder].recvAt=performance.now();
      if(finalDuel){gameCallout('FINAL DUEL',`${actors[live[0]].name.toUpperCase()} VS ${actors[live[1]].name.toUpperCase()} · NO HIDING`,'gold');bombSound('duel');playClip('crowd-cheer',.30,.95)}
      else gameCallout(`HEAT ${heat}`,modifier.type==='none'?'THE FUSE IS LIVE':`${modifier.type.toUpperCase()} MODIFIER · STAY SHARP`,'good');
    };
    const beginWinner=i=>{
      if(roundState==='winner')return;winner=i;roundState='winner';bomb.state='reset';bomb.holder=-1;camera.targetZoom=1.14;crowdPulse=1;musicDuck=.18;bombMusic.forEach(a=>{a.volume*=.42});fanfare();cameraPunch(.38);
      if(i>=0){actors[i].winT=9;playClip('winner',.72);playClip('crowd-cheer',.5);gameCallout(`${actors[i].name.toUpperCase()} WINS!`,'LAST CONTESTANT STANDING','great');if(actors[i].human)scoreBurst('SURVIVOR!',50,37,'gold')}
    };
    const explode=()=>{
      if(roundState!=='active')return;roundState='aftermath';aftermath=1.18;let victim=-1,ex=bomb.x,ey=bomb.y;
      if(bomb.state==='held'&&bomb.holder>=0){victim=bomb.holder;ex=actors[victim].x;ey=actors[victim].y-10}
      else{let best=92;aliveIds().forEach(i=>{const a=actors[i],d=Math.hypot(a.x-ex,a.y-ey);if(d<best){best=d;victim=i}})}
      bomb.state='exploding';bomb.holder=-1;explosions.push({x:ex,y:ey,t:0});scorches.push({x:ex,y:ey,r:rand(26,42),rot:rand(0,Math.PI*2)});shake=.82;crowdPulse=1;musicDuck=1;bombMusic.forEach(a=>{a.volume*=.52});impactPause(90);bombSound('explode');playClip('crowd-gasp',.42);screenShake(.95);
      actors.forEach(a=>{if(!a.alive)return;const d=Math.max(18,Math.hypot(a.x-ex,a.y-ey));if(d<150){const p=clamp(1-d/150,0,1),ux=(a.x-ex)/d,uy=(a.y-ey)/d;a.vx+=ux*460*p;a.vy+=uy*420*p}});
      if(victim>=0){const v=actors[victim];v.alive=false;v.stunT=.95;v.eliminatedAt=performance.now();{const dd=Math.max(18,Math.hypot(v.x-ex,v.y-ey)),ux=(v.x-ex)/dd,uy=(v.y-ey)/dd;v.blastX=v.x;v.blastY=v.y;v.blastVx=ux*310+rand(-70,70);v.blastVy=uy*220-235;}v.spectatorX=arena.cx+(-.38+(actors.indexOf(v)%6)*.15)*arena.rx;v.spectatorY=arena.cy+arena.ry+54;stats.elims++;if(v.human)gameCallout('YOU GOT BOMBED!','WATCH THE CHAOS — YOUR SCORE IS STILL LOCKING IN','boom');else gameCallout(`${v.name.toUpperCase()} — BOOM!`,'ONE LESS CONTESTANT','boom');
        const lp=bomb.lastPass;if((lp&&lp.from===humanId&&performance.now()-lp.at<4200)||bomb.from===humanId){stats.forced++;human.forced++;scoreBurst('+FORCED BOOM',ex/w*100,ey/h*100,'gold')}
      }else gameCallout('MISFIRE!','NOBODY WAS CLOSE ENOUGH — NEW BOMB INCOMING','gold');
      if(window.__REPARTY_QA__){const tr=window.__REPARTY_BOMB_TRACE||(window.__REPARTY_BOMB_TRACE=[]);tr.push({type:'explode',victim,at:performance.now(),state:bomb.state,alive:aliveCount()})}
    };
    const dashActor=(a,dx,dy)=>{
      if(!a?.alive||a.dashCd>0||roundState!=='active')return false;let mag=Math.hypot(dx,dy);if(mag<.1){dx=Math.cos(a.facing);dy=Math.sin(a.facing);mag=1}dx/=mag;dy/=mag;a.vx+=dx*TUNE.dashImpulse;a.vy+=dy*TUNE.dashImpulse;a.dashT=TUNE.dashDuration;a.dashCd=TUNE.dashCooldown;a.facing=Math.atan2(dy,dx);if(a.human)activity(.035);bombSound('dash');return true;
    };
    const humanThrow=()=>{
      if(!human.alive||bomb.state!=='held'||bomb.holder!==humanId)return;const p=screenToWorld(cursor),target=nearestAimTarget(humanId,p);if(target>=0&&protectedReturn(humanId,target)){gameCallout('NO INSTANT RETURN',`THROW TO SOMEONE ELSE FOR ${(Math.max(0,human.noReturnUntil-performance.now())/1000).toFixed(1)}s`,'bad');return}
      const point=target>=0?{x:actors[target].x+actors[target].vx*.115,y:actors[target].y+actors[target].vy*.115}:p;if(throwBomb(humanId,point,target,'human'))scoreBurst(target>=0?'THROW!':'SPACE THROW',point.x/w*100,point.y/h*100,target>=0?'good':'gold')
    };
    listen(c,'pointermove',e=>{cursor=pointerPos(c,e);if(human.alive){const p=screenToWorld(cursor);human.facing=Math.atan2(p.y-human.y,p.x-human.x)}});
    listen(c,'pointerdown',e=>{if(e.button!==0)return;cursor=pointerPos(c,e);humanThrow();e.preventDefault()},{passive:false});
    listen(c,'contextmenu',e=>e.preventDefault());
    listen(window,'keydown',e=>{if(e.code==='Space'&&!e.repeat){humanThrow();e.preventDefault()}if(e.key==='Shift'&&!e.repeat){const d=directional();dashActor(human,d.dx,d.dy);e.preventDefault()}},{passive:false});

    const botTargetScore=(from,to)=>{
      const a=actors[from],b=actors[to],d=dist(a,b),style=a.style;let score=Math.abs(d-175)*.55;
      if(protectedReturn(from,to))score+=10000;
      score+=(b.dashCd<=.15?42:-Math.min(28,b.dashCd*12));
      const crowd=aliveIds().filter(j=>j!==to&&Math.hypot(actors[j].x-b.x,actors[j].y-b.y)<95).length;score-=crowd*6;
      const ax=a.x,ay=a.y,bx=b.x,by=b.y,abx=bx-ax,aby=by-ay,ab2=Math.max(1,abx*abx+aby*aby);let interceptors=0;
      aliveIds().forEach(j=>{if(j===from||j===to)return;const q=actors[j],u=clamp(((q.x-ax)*abx+(q.y-ay)*aby)/ab2,0,1),px=ax+abx*u,py=ay+aby*u;if(u>.12&&u<.88&&Math.hypot(q.x-px,q.y-py)<34)interceptors++});score+=interceptors*17;
      if(style==='aggressive')score+=d*.08;if(style==='cautious')score+=Math.abs(d-210)*.16;if(style==='chaotic')score+=rand(-32,32);if(style==='mobile')score+=Math.abs(d-195)*.10;if(style==='patient')score-=b.dashCd*.8;
      return score;
    };
    const selectBotTarget=from=>aliveIds().filter(i=>i!==from&&!protectedReturn(from,i)).sort((a,b)=>botTargetScore(from,a)-botTargetScore(from,b))[0]??-1;
    const steer=(a,tx,ty,accel,dt)=>{const dx=tx-a.x,dy=ty-a.y,d=Math.max(1,Math.hypot(dx,dy));a.vx+=dx/d*accel*dt;a.vy+=dy/d*accel*dt;if(d>12)a.facing=Math.atan2(dy,dx)};
    const openPoint=a=>{
      const angle=a.wander+rand(-.42,.42),rX=arena.rx*rand(.38,.72),rY=arena.ry*rand(.35,.70);return{x:arena.cx+Math.cos(angle)*rX,y:arena.cy+Math.sin(angle)*rY};
    };
    const updateBot=(a,i,dt)=>{
      if(!a.targetPoint)a.targetPoint={x:a.x,y:a.y};a.think-=dt;const danger=bomb.state==='held'&&bomb.holder>=0?actors[bomb.holder]:bomb,fl=fuseLeft();
      if(a.think<=0){a.think=rand(.15,.29);a.wander+=rand(-.72,.72);if(!a.targetPoint||Math.random()<.55)a.targetPoint=openPoint(a)}
      if(bomb.state==='loose'){
        const chaseRank=aliveIds().sort((u,v)=>Math.hypot(actors[u].x-bomb.x,actors[u].y-bomb.y)-Math.hypot(actors[v].x-bomb.x,actors[v].y-bomb.y)).indexOf(i);
        if(chaseRank<2||a.style==='aggressive'){a.botState='CHASE_LOOSE_BOMB';steer(a,bomb.x,bomb.y,920,dt);if(a.dashCd<=0&&Math.hypot(a.x-bomb.x,a.y-bomb.y)<120&&a.style!=='cautious')dashActor(a,bomb.x-a.x,bomb.y-a.y)}
        else{a.botState='SEEK_SPACE';steer(a,a.targetPoint.x,a.targetPoint.y,370,dt)}return;
      }
      if(bomb.state==='flight'){
        const d=Math.hypot(a.x-bomb.x,a.y-bomb.y),incoming=bomb.intended===i;
        if(incoming&&d<105&&a.dashCd<=0&&a.style!=='patient'&&a.think<.09){const fx=bomb.tx-bomb.x,fy=bomb.ty-bomb.y,fm=Math.max(1,Math.hypot(fx,fy)),side=(i%2?1:-1);a.botState='DODGE';dashActor(a,-fy/fm*side,fx/fm*side);a.think=rand(.16,.28)}
        else if(i!==bomb.from&&!incoming&&d<92&&a.style!=='cautious'){a.botState='INTERCEPT';steer(a,bomb.x,bomb.y,735,dt)}
        else if(incoming){a.botState='RECEIVE';steer(a,a.x-(bomb.x-a.x)*.08,a.y-(bomb.y-a.y)*.08,235,dt);a.facing=Math.atan2(bomb.y-a.y,bomb.x-a.x)}
        else{a.botState='SEEK_SPACE';steer(a,a.targetPoint.x,a.targetPoint.y,360,dt)}return;
      }
      if(bomb.state==='held'&&bomb.holder===i){
        const held=(performance.now()-a.recvAt)/1000,holdNeed=Math.max(.32,(a.holdUntil-a.recvAt)/1000);a.botState=fl<1.00?'PANIC_THROW':'HOLD_AND_REPOSITION';
        if(a.target<0||!actors[a.target]?.alive||protectedReturn(i,a.target)||a.think<.03)a.target=selectBotTarget(i);const tg=actors[a.target];
        if(tg){const dx=tg.x-a.x,dy=tg.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),side=a.style==='cautious'?1:-1;const tx=a.x-dy/d*side*70,ty=a.y+dx/d*side*70;steer(a,tx,ty,430,dt);a.facing=Math.atan2(tg.y-a.y,tg.x-a.x);
          if((held>=holdNeed||fl<.92)&&a.throwCd<=0){const lead=.105,pt={x:tg.x+tg.vx*lead,y:tg.y+tg.vy*lead};throwBomb(i,pt,a.target,fl<.92?'panic':'bot')}}
        else if(fl<1.15)throwBomb(i,{x:arena.cx+rand(-120,120),y:arena.cy+rand(-80,80)},-1,'panic-space');return;
      }
      a.botState='AVOID_HOLDER';
      if(danger&&danger!==a){const d=Math.max(1,Math.hypot(a.x-danger.x,a.y-danger.y));if(d<165){steer(a,a.x+(a.x-danger.x)/d*110,a.y+(a.y-danger.y)/d*90,620,dt);if(bomb.state==='flight'&&a.dashCd<=0&&d<75)dashActor(a,a.x-danger.x,a.y-danger.y)}else steer(a,a.targetPoint.x,a.targetPoint.y,330,dt)}
      else steer(a,a.targetPoint.x,a.targetPoint.y,320,dt);
    };
    const updateModifier=dt=>{
      if(modifier.type==='crate'){
        modifier.x+=modifier.vx*dt;if(modifier.x<arena.cx-arena.rx*.58||modifier.x+modifier.w>arena.cx+arena.rx*.58)modifier.vx*=-1;
        actors.forEach(a=>{if(!a.alive)return;const nx=clamp(a.x,modifier.x,modifier.x+modifier.w),ny=clamp(a.y,modifier.y,modifier.y+modifier.h),d=Math.max(1,Math.hypot(a.x-nx,a.y-ny));if(d<24){const ux=(a.x-nx)/d||1,uy=(a.y-ny)/d;a.vx+=ux*240;a.vy+=uy*190}})
      }
      if(modifier.type==='steam'){
        const old=modifier.clock;modifier.clock=(modifier.clock+dt)%modifier.period;const warning=modifier.clock>modifier.period-.78,burst=modifier.clock>.08&&old<=.08;
        if(burst){bombSound('steam');actors.forEach(a=>{if(!a.alive)return;const d=Math.max(1,Math.hypot(a.x-modifier.x,a.y-modifier.y));if(d<modifier.r){const p=1-d/modifier.r;a.vx+=(a.x-modifier.x)/d*400*p;a.vy+=(a.y-modifier.y)/d*400*p}});if(bomb.state==='loose'&&Math.hypot(bomb.x-modifier.x,bomb.y-modifier.y)<modifier.r){bomb.vx+=(bomb.x-modifier.x)*3;bomb.vy+=(bomb.y-modifier.y)*3}}
        modifier.warning=warning
      }
      if(modifier.type==='bounce'&&bomb.state==='loose'&&bomb.x>modifier.x-modifier.w/2&&bomb.x<modifier.x+modifier.w/2&&Math.abs(bomb.y-modifier.y)<modifier.h){bomb.vy=-Math.sign(bomb.vy||1)*Math.max(170,Math.abs(bomb.vy)*1.4);bomb.vx*=1.1;bomb.bounces++;bombSound('bounce')}
    };
    const resolveBodyCollisions=()=>{
      for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){const a=actors[i],b=actors[j];if(!a.alive||!b.alive)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.01,Math.hypot(dx,dy)),min=30;if(d<min){const ux=dx/d,uy=dy/d,p=(min-d)*.52;a.x-=ux*p;b.x+=ux*p;a.y-=uy*p;b.y+=uy*p;const dashA=a.dashT>0,dashB=b.dashT>0,imp=(dashA||dashB)?165:42;a.vx-=ux*imp*.35;b.vx+=ux*imp*.35;a.vy-=uy*imp*.35;b.vy+=uy*imp*.35}}
    };
    const updateBomb=dt=>{
      const t=performance.now();
      if(bomb.state==='held'&&bomb.holder>=0){const a=actors[bomb.holder];bomb.x=a.x+Math.cos(a.facing)*18;bomb.y=a.y-18+Math.sin(a.facing)*6;bomb.z=0}
      else if(bomb.state==='flight'){
        const p=clamp((t-bomb.t0)/(bomb.dur*1000),0,1),ease=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;bomb.x=lerp(bomb.x0,bomb.tx,ease);bomb.y=lerp(bomb.y0,bomb.ty,ease);bomb.z=Math.sin(p*Math.PI)*44;bomb.spin+=dt*19;
        let candidate=-1,best=1e9;aliveIds().forEach(i=>{if(i===bomb.from)return;const a=actors[i];if(protectedReturn(bomb.from,i))return;const toBombX=bomb.x-a.x,toBombY=bomb.y-a.y,d=Math.hypot(toBombX,toBombY);const faceDot=(Math.cos(a.facing)*toBombX+Math.sin(a.facing)*toBombY)/Math.max(1,d),radius=a.dashT>0?TUNE.dodgeCatchRadius:TUNE.catchRadius+Math.max(0,faceDot)*TUNE.catchFacingBonus;
          if(bomb.intended===i&&a.dashT>0&&d<27)bomb.dodgedBy=i;
          if(bomb.z<39&&d<radius&&d<best){best=d;candidate=i}});
        if(candidate>=0){const intercept=bomb.intended>=0&&candidate!==bomb.intended;catchBomb(candidate,bomb.from,intercept);return}
        if(p>=1){const dx=bomb.tx-(actors[bomb.from]?.x??bomb.tx),dy=bomb.ty-(actors[bomb.from]?.y??bomb.ty),d=Math.max(1,Math.hypot(dx,dy));
          if(bomb.dodgedBy>=0){const dodger=actors[bomb.dodgedBy];dodger.dodges++;crowdPulse=Math.max(crowdPulse,.55);if(dodger.human){stats.dodges++;scoreBurst('CLUTCH DODGE!',dodger.x/w*100,dodger.y/h*100,'gold');gameCallout('CLUTCH DODGE!',`${fuseLeft().toFixed(1)}s LEFT · THE BOMB IS LOOSE`,'gold');activity(.08)}}
          landLoose(bomb.tx,bomb.ty,dx/d*142,dy/d*142,bomb.from)}
      }else if(bomb.state==='loose'){
        bomb.x+=bomb.vx*dt;bomb.y+=bomb.vy*dt;bomb.vx*=Math.pow(.13,dt);bomb.vy*=Math.pow(.13,dt);
        if(!insideArena(bomb.x,bomb.y,18)){const dx=bomb.x-arena.cx,dy=bomb.y-arena.cy,d=Math.max(1,Math.hypot(dx/(arena.rx-20),dy/(arena.ry-20))),px=arena.cx+dx/d,py=arena.cy+dy/d;bomb.x=lerp(bomb.x,px,.55);bomb.y=lerp(bomb.y,py,.55);bomb.vx*=-.62;bomb.vy*=-.62;bomb.bounces++;bombSound('bounce')}
        let pick=-1,best=TUNE.loosePickupRadius;aliveIds().forEach(i=>{const a=actors[i],d=Math.hypot(a.x-bomb.x,a.y-bomb.y);if(d<best){best=d;pick=i}});if(pick>=0){stats.loosePickups+=(pick===humanId?1:0);assignHolder(pick,pick===bomb.from?-1:bomb.from);gameCallout(actors[pick].human?'YOU SNATCHED IT!':`${actors[pick].name.toUpperCase()} SNATCHED IT`,'MOVE · AIM · DON’T PANIC','good');bombSound('pickup')}
      }
      if(roundState==='active'&&bomb.state!=='reset'&&t>=bomb.fuseEnds)explode();
    };
    function bombSound(kind){
      const mapped=kind==='duel'?'duel':kind,fd=kind==='tick'?clamp(1-fuseLeft()/Math.max(.1,bomb.fuseTotal),0,1):0;const volume={throw:.58,catch:.50,intercept:.64,dash:.46,bounce:.42,pickup:.50,steam:.44,duel:.62,explode:.74,tick:.20+fd*.26}[kind]||.45;
      if(playClip(mapped,volume,kind==='tick'?(.94+fd*.16+rand(-.02,.02)):1))return
      try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ac=RP.audio||(RP.audio=new AC());if(ac.state==='suspended')void ac.resume();const tone=(freq,dur,vol,type='triangle',slide=0)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,ac.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(35,freq+slide),ac.currentTime+dur);g.gain.setValueAtTime(vol,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+dur+.02)};if(kind==='tick')tone(560,.025,.006,'square',70);else if(kind==='explode'){tone(72,.32,.050,'sawtooth',-28);tone(42,.38,.032,'sine',-8)}}catch(_){ }
    }
    const drawArena=(t,danger)=>{
      if(bombArt.arena.complete&&bombArt.arena.naturalWidth){ctx.drawImage(bombArt.arena,0,0,w,h)}else{const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,finalDuel?'#3a111f':'#0d1830');sky.addColorStop(.46,finalDuel?'#291123':'#21162f');sky.addColorStop(1,'#080b12');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h)}
      // Animated furnace light, drifting smoke and crowd flashes sit over the authored pixel-art plate.
      ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<5;i++){const x=(i+.5)*w/5,pulse=.65+.35*Math.sin(t*.004+i*1.7),gl=ctx.createRadialGradient(x,h*.30,2,x,h*.30,125);gl.addColorStop(0,`rgba(255,164,74,${(.035+danger*.075)*pulse})`);gl.addColorStop(1,'rgba(255,80,25,0)');ctx.fillStyle=gl;ctx.fillRect(x-130,h*.05,260,h*.48)}ctx.restore();
      for(let i=0;i<10;i++){const drift=(t*.012+i*53)%(w+120)-60,y=30+(i*17)%76;ctx.fillStyle=`rgba(119,126,148,${.025+(i%3)*.008})`;ctx.beginPath();ctx.ellipse(drift,y,24+(i%4)*8,7+(i%3)*3,0,0,Math.PI*2);ctx.fill()}
      if(crowdPulse>.02){ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<18;i++){const x=(i*73+t*.04)%w,y=105+(i%3)*24;ctx.fillStyle=COLORS[i%COLORS.length]+Math.round(clamp(crowdPulse,0,1)*100).toString(16).padStart(2,'0');ctx.fillRect(x,y,3,4)}ctx.restore()}
      drawShadow(ctx,arena.cx,arena.cy+arena.ry*.74,arena.rx*.92,arena.ry*.20,.48);const floor=ctx.createRadialGradient(arena.cx,arena.cy,30,arena.cx,arena.cy,arena.rx);floor.addColorStop(0,finalDuel?'#4b3030':'#3d354a');floor.addColorStop(.68,'#242839');floor.addColorStop(1,'#101620');ctx.fillStyle=floor;ctx.beginPath();ctx.ellipse(arena.cx,arena.cy,arena.rx,arena.ry,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=finalDuel?'#ffb24a':'#d49a42';ctx.lineWidth=4;ctx.stroke();
      // Hazard markings, scratches and scorch history.
      ctx.strokeStyle='rgba(236,190,82,.18)';ctx.lineWidth=2;for(let r=.27;r<.9;r+=.2){ctx.beginPath();ctx.ellipse(arena.cx,arena.cy,arena.rx*r,arena.ry*r,0,0,Math.PI*2);ctx.stroke()}for(let i=0;i<18;i++){const a=i/18*Math.PI*2,rr=i%2?.82:.58;ctx.strokeStyle=i%2?'rgba(255,101,85,.16)':'rgba(255,221,99,.12)';ctx.beginPath();ctx.moveTo(arena.cx+Math.cos(a)*arena.rx*rr,arena.cy+Math.sin(a)*arena.ry*rr);ctx.lineTo(arena.cx+Math.cos(a)*arena.rx*(rr+.09),arena.cy+Math.sin(a)*arena.ry*(rr+.09));ctx.stroke()}
      scorches.slice(-8).forEach(s=>{ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.rot);ctx.globalAlpha=.28;ctx.fillStyle='#07090c';ctx.beginPath();ctx.ellipse(0,0,s.r,s.r*.55,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=.15;ctx.strokeStyle='#ff8e47';for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(i*1.3)*s.r*1.2,Math.sin(i*1.3)*s.r*.8);ctx.stroke()}ctx.restore()});
      pxText(ctx,'GOBLIN POWDERWORKS',arena.cx,arena.cy+4,20,'rgba(255,224,130,.15)');
      // Safety rails and foreground depth.
      ctx.fillStyle='#111723';ctx.fillRect(0,h-32,w,32);ctx.strokeStyle='#8a6630';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,h-35);ctx.lineTo(w,h-35);ctx.stroke();for(let x=25;x<w;x+=58){ctx.fillStyle='#2e3543';ctx.fillRect(x,h-46,5,20)}
      if(danger>.01){ctx.fillStyle=`rgba(255,54,46,${danger*.075})`;ctx.fillRect(0,0,w,h)}
    };
    const drawModifier=()=>{
      if(modifier.type==='crate'){ctx.fillStyle='#493622';rounded(ctx,modifier.x,modifier.y,modifier.w,modifier.h,5);ctx.fill();ctx.strokeStyle='#d59a45';ctx.stroke();ctx.strokeStyle='#21170f';ctx.beginPath();ctx.moveTo(modifier.x+8,modifier.y+5);ctx.lineTo(modifier.x+modifier.w-8,modifier.y+modifier.h-5);ctx.moveTo(modifier.x+modifier.w-8,modifier.y+5);ctx.lineTo(modifier.x+8,modifier.y+modifier.h-5);ctx.stroke();pxText(ctx,'POWDER',modifier.x+modifier.w/2,modifier.y+modifier.h/2,6,'#ffe0a0')}
      if(modifier.type==='speed'){const pulse=(Math.sin(performance.now()/110)+1)/2;ctx.fillStyle=`rgba(76,227,255,${.10+.08*pulse})`;ctx.beginPath();ctx.arc(modifier.x,modifier.y,modifier.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#63eaff';ctx.lineWidth=2;ctx.stroke();pxText(ctx,'BOOST',modifier.x,modifier.y,6,'#c4fbff')}
      if(modifier.type==='steam'){const warning=modifier.warning;ctx.strokeStyle=warning?(Math.floor(performance.now()/90)%2?'#ff9d4d':'#ffe57d'):'#6c7080';ctx.lineWidth=3;ctx.beginPath();ctx.arc(modifier.x,modifier.y,modifier.r*.42,0,Math.PI*2);ctx.stroke();ctx.fillStyle=warning?'rgba(255,156,75,.12)':'rgba(100,110,130,.06)';ctx.beginPath();ctx.arc(modifier.x,modifier.y,modifier.r,0,Math.PI*2);ctx.fill();if(modifier.clock<.20){ctx.fillStyle='rgba(220,235,245,.28)';for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(modifier.x+Math.cos(i)*modifier.r*.55,modifier.y+Math.sin(i*1.8)*modifier.r*.35,9+i%3*3,0,Math.PI*2);ctx.fill()}}}
      if(modifier.type==='bounce'){ctx.fillStyle='#592f5c';rounded(ctx,modifier.x-modifier.w/2,modifier.y-modifier.h/2,modifier.w,modifier.h,8);ctx.fill();ctx.strokeStyle='#e68cff';ctx.lineWidth=2;ctx.stroke();pxText(ctx,'BOUNCE',modifier.x,modifier.y,6,'#ffd6ff')}
    };
    const drawActor=(a,i,t)=>{
      const renderFallback=(x,y,state='idle',alpha=1,scale=1)=>{if(!(bombArt.fallback.complete&&bombArt.fallback.naturalWidth))return false;const states={idle:0,run1:1,run2:2,hold:3,throw:4,dodge:5,stun:6,win:7},frame=states[state]??0,fw=96,fh=128;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.scale(scale,scale);ctx.drawImage(bombArt.fallback,frame*fw,0,fw,fh,-24,-54,48,64);ctx.restore();return true};
      if(!a.alive){const since=(performance.now()-a.eliminatedAt)/1000;if(since<.9&&Number.isFinite(a.blastX)){const sx=a.blastX,sy=a.blastY;drawShadow(ctx,sx,Math.min(h-40,sy+17),18,6,.20);ctx.save();ctx.translate(sx,sy);ctx.rotate(since*8*(i%2?1:-1));ctx.globalAlpha=clamp(1-since*.38,.46,1);if(!renderFallback(0,0,'stun',1,1.02)){ctx.fillStyle=a.color;rounded(ctx,-10,-16,20,24,5);ctx.fill()}ctx.restore();return}const sx=a.spectatorX||arena.cx+(i-2.5)*58,sy=a.spectatorY||h-48;drawShadow(ctx,sx,sy+15,15,5,.19);const art=artFor(a.name);ctx.save();ctx.globalAlpha=.58;ctx.translate(sx,sy);const react=1+Math.sin(t*.006+i)*.025;if(art?.complete&&art.naturalWidth){const ratio=art.naturalWidth/art.naturalHeight,hh=58,ww=Math.min(62,hh*ratio);ctx.scale(react,react);ctx.drawImage(art,-ww/2,-hh+11,ww,hh)}else renderFallback(0,0,'stun',1,.78);ctx.restore();pxText(ctx,'OUT',sx,sy+23,6,'#ff8592');return}
      const speed=Math.hypot(a.vx,a.vy),run=clamp(speed/180,0,1),holder=bomb.state==='held'&&bomb.holder===i,panic=holder&&fuseLeft()<1.35,art=artFor(a.name);
      const state=a.winT>0?'win':a.stunT>0?'stun':a.dashT>0?'dodge':a.throwT>0?'throw':holder?'hold':run>.26?(Math.floor(t/115+i)%2?'run1':'run2'):'idle';
      const bob=state==='win'?Math.sin(t*.018)*5:Math.sin(t*.013+a.movePhase)*(1.1+run*2.4),lean=clamp(a.vx/240,-1,1)*.095+(state==='throw'?.10:0),flip=Math.cos(a.facing)<0?-1:1;
      if(a.dashT>0){ctx.save();ctx.globalAlpha=.18;ctx.strokeStyle=a.color;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(a.x-flip*18,a.y);ctx.lineTo(a.x-flip*58,a.y+4);ctx.stroke();ctx.restore()}
      drawShadow(ctx,a.x,a.y+23,20+run*4,6,.38);ctx.save();ctx.translate(a.x,a.y+bob);ctx.rotate(lean);if(state==='dodge')ctx.scale(1.14,.88);if(state==='throw')ctx.scale(1.06,.96);if(a.catchT>0)ctx.scale(1+a.catchT*.20,1-a.catchT*.08);if(panic)ctx.translate(rand(-1.4,1.4),rand(-.8,.8));
      let drawn=false;if(art?.complete&&art.naturalWidth){ctx.save();ctx.scale(flip,1);const ratio=art.naturalWidth/art.naturalHeight;let hh=80+run*2,ww=Math.min(92,hh*ratio);if(String(a.name).toLowerCase().includes('pipsqueak')){hh=72;ww=Math.min(96,hh*ratio)}if(String(a.name).toLowerCase().includes('rocky')){hh=74;ww=Math.min(80,hh*ratio)}if(String(a.name).toLowerCase().includes('soup')){hh=74;ww=Math.min(66,hh*ratio)}ctx.drawImage(art,-ww/2,-hh+23,ww,hh);ctx.restore();drawn=true}
      if(!drawn)renderFallback(0,0,state,1,1.04);ctx.restore();
      // Action language is layered over authored art so every character reads the same mechanically.
      if(holder){const pulse=.75+.25*Math.sin(t*.03);ctx.strokeStyle=panic?'#ff6b65':'#ffd967';ctx.globalAlpha=.65+.25*pulse;ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x,a.y-10,31+panic*3,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
      if(a.catchT>0){ctx.strokeStyle='#fff2a2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x,a.y-12,24+(1-a.catchT/.24)*16,0,Math.PI*2);ctx.stroke()}
      ctx.strokeStyle=a.human?'#ffe26d':a.color;ctx.globalAlpha=a.human?1:.52;ctx.lineWidth=a.human?2:1;ctx.beginPath();ctx.arc(a.x,a.y,27,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;pxText(ctx,a.name,a.x,a.y+39,7,a.human?'#fff1a3':'#eaf3ff');if(a.human)pxText(ctx,'YOU',a.x,a.y+49,6,'#ffe16f');
      if(a.dashCd>0&&a.human){const pct=1-clamp(a.dashCd/TUNE.dashCooldown,0,1);ctx.strokeStyle='#68eaff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x,a.y,32,-Math.PI/2,-Math.PI/2+Math.PI*2*pct);ctx.stroke()}
      if(holder&&a.noReturnTo>=0&&performance.now()<a.noReturnUntil&&!finalDuel)pxText(ctx,'NO RETURN',a.x,a.y-56,6,'#ffcf76');
    };
    const drawBomb=()=>{
      if(['reset','exploding'].includes(bomb.state))return;const left=fuseLeft(),ratio=clamp(left/Math.max(.1,bomb.fuseTotal),0,1),danger=1-ratio,drawY=bomb.y-bomb.z,rad=14+danger*2.1;drawShadow(ctx,bomb.x,bomb.y+6,15+danger*5,5,.42);ctx.save();ctx.translate(bomb.x,drawY);ctx.rotate(bomb.spin);if(danger>.74)ctx.translate(rand(-2,2)*danger,rand(-2,2)*danger);const glow=ctx.createRadialGradient(0,0,2,0,0,34+danger*28);glow.addColorStop(0,`rgba(255,${Math.round(190-90*danger)},70,${.18+danger*.24})`);glow.addColorStop(1,'rgba(255,70,20,0)');ctx.fillStyle=glow;ctx.fillRect(-62,-62,124,124);
      if(bombArt.bomb.complete&&bombArt.bomb.naturalWidth){const frame=clamp(Math.floor(danger*7),0,7),fw=64,fh=64;ctx.drawImage(bombArt.bomb,frame*fw,0,fw,fh,-26,-26,52,52)}else{ctx.fillStyle='#17131b';ctx.beginPath();ctx.arc(0,0,rad,0,Math.PI*2);ctx.fill();ctx.strokeStyle=danger>.72?'#ff5b59':'#665a62';ctx.lineWidth=2;ctx.stroke()}
      ctx.restore();if(bomb.state==='flight'){ctx.strokeStyle=`rgba(255,202,92,${.18+danger*.18})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bomb.x- Math.cos(bomb.spin)*8,drawY-Math.sin(bomb.spin)*8);ctx.lineTo(bomb.x-Math.cos(bomb.spin)*28,drawY-Math.sin(bomb.spin)*20);ctx.stroke()}
      ctx.strokeStyle=danger>.75?'#ff615d':'#ffd25f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(bomb.x,bomb.y,25,-Math.PI/2,-Math.PI/2+Math.PI*2*ratio);ctx.stroke();if(left<2)pxText(ctx,left.toFixed(1),bomb.x,bomb.y+33,7,left<.8?'#ff7280':'#ffe078')
    };

    loop((dt,t)=>{
      const liveDanger=roundState==='active'?clamp(1-fuseLeft()/Math.max(.1,bomb.fuseTotal),0,1):0;
      camera.targetZoom=roundState==='winner'?1.14:(finalDuel?TUNE.cameraFinal:(bomb.state==='loose'?TUNE.cameraLoose:lerp(TUNE.cameraBase,TUNE.cameraDanger,Math.max(0,(liveDanger-.58)/.42))));
      camera.zoom=lerp(camera.zoom,camera.targetZoom,clamp(dt*5.4,0,1));crowdPulse=Math.max(0,crowdPulse-dt*.9);shake=Math.max(0,shake-dt*2);musicDuck=Math.max(0,musicDuck-dt*1.65);particles.forEach(p=>p.t+=dt);particles=particles.filter(p=>p.t<p.life);smoke.forEach(p=>p.t+=dt);smoke=smoke.filter(p=>p.t<p.life);explosions.forEach(p=>p.t+=dt);explosions=explosions.filter(p=>p.t<.82);
      actors.forEach(a=>{a.dashCd=Math.max(0,a.dashCd-dt);a.dashT=Math.max(0,a.dashT-dt);a.throwCd=Math.max(0,a.throwCd-dt);a.throwT=Math.max(0,a.throwT-dt);a.catchT=Math.max(0,a.catchT-dt);a.pickupT=Math.max(0,a.pickupT-dt);a.stunT=Math.max(0,a.stunT-dt);a.winT=Math.max(0,a.winT-dt);if(a.alive&&a.human)stats.survival+=dt});
      if(roundState==='winner'){actors.forEach((a,i)=>{if(!a.alive)return;const ang=t*.002+i;a.vx+=Math.cos(ang)*30*dt;a.vy+=Math.sin(ang)*20*dt;a.facing=ang});return}
      if(roundState==='aftermath'){aftermath-=dt;actors.forEach(a=>{if(a.alive){a.vx*=Math.pow(.12,dt);a.vy*=Math.pow(.12,dt);a.x+=a.vx*dt;a.y+=a.vy*dt;clampArena(a)}else if(performance.now()-a.eliminatedAt<900){a.blastX+=a.blastVx*dt;a.blastY+=a.blastVy*dt;a.blastVy+=420*dt;a.blastVx*=Math.pow(.32,dt)}});if(aftermath<=0){if(aliveCount()<=1)beginWinner(aliveIds()[0]??-1);else startHeat()}return}
      updateModifier(dt);
      actors.forEach((a,i)=>{
        if(!a.alive)return;
        if(a.human){const d=directional();if(d.dx||d.dy){activity(.003);const speedBoost=modifier.type==='speed'&&Math.hypot(a.x-modifier.x,a.y-modifier.y)<modifier.r?1.24:1;a.vx+=d.dx*TUNE.moveAccel*speedBoost*dt;a.vy+=d.dy*TUNE.moveAccel*speedBoost*dt;if(bomb.state!=='held')a.facing=Math.atan2(d.dy,d.dx)}}else updateBot(a,i,dt);
        const holderSlow=bomb.state==='held'&&bomb.holder===i?TUNE.holderSlow:1,max=(a.dashT>0?475:TUNE.maxRun)*holderSlow,sp=Math.hypot(a.vx,a.vy);if(sp>max){a.vx=a.vx/sp*max;a.vy=a.vy/sp*max}a.vx*=Math.pow(TUNE.drag,dt);a.vy*=Math.pow(TUNE.drag,dt);a.x+=a.vx*dt;a.y+=a.vy*dt;clampArena(a)
      });
      resolveBodyCollisions();
      updateBomb(dt);
      const left=fuseLeft(),mixDanger=roundState==='active'?clamp(1-left/Math.max(.1,bomb.fuseTotal),0,1):0;updateBombMusic(mixDanger);if(roundState==='active'&&left<1.5&&left>0){tickCd-=dt;if(tickCd<=0){tickCd=clamp(left*.20,.08,.28);bombSound('tick')}}
      const norm=clamp(stats.survival*1.25+stats.throws*3.2+stats.catches*1.7+stats.dodges*1.8+stats.intercepts*5+stats.forced*8+(human.alive?8:0),0,100);setScore(Math.round(stats.survival+stats.throws*2+stats.intercepts*3+stats.forced*6),norm,RP.participation);
    },t=>{
      const left=fuseLeft(),danger=roundState==='active'?clamp(1-left/Math.max(.1,bomb.fuseTotal),0,1):0;ctx.save();ctx.translate(arena.cx,arena.cy);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-arena.cx,-arena.cy);drawArena(t,danger);drawModifier();if(roundState==='active'&&human.alive&&bomb.state==='held'&&bomb.holder===humanId){const aim=screenToWorld(cursor),tg=nearestAimTarget(humanId,aim),pt=tg>=0?actors[tg]:aim,blocked=tg>=0&&protectedReturn(humanId,tg);ctx.save();ctx.setLineDash([7,7]);ctx.strokeStyle=blocked?'rgba(255,99,105,.62)':'rgba(255,225,111,.48)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(human.x,human.y-14);ctx.lineTo(pt.x,pt.y);ctx.stroke();ctx.setLineDash([]);
        if(!blocked){for(let q=.18;q<.92;q+=.18){const qx=lerp(human.x,pt.x,q),qy=lerp(human.y-14,pt.y,q)-Math.sin(q*Math.PI)*28;ctx.globalAlpha=.22+q*.30;ctx.fillStyle='#ffe27b';ctx.beginPath();ctx.arc(qx,qy,1.7,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}
        ctx.strokeStyle=blocked?'#ff6b73':'#ffe16f';ctx.beginPath();ctx.arc(pt.x,pt.y,blocked?23:18,0,Math.PI*2);ctx.stroke();pxText(ctx,blocked?'NO RETURN':'AIM',pt.x,pt.y-27,6,blocked?'#ff8a90':'#ffe58a');ctx.restore()}actors.forEach((a,i)=>drawActor(a,i,t));drawBomb();
      explosions.forEach(e=>{const p=clamp(e.t/.82,0,1),rr=18+p*96;if(bombArt.explosion.complete&&bombArt.explosion.naturalWidth){const frame=clamp(Math.floor(p*7),0,7),fw=128,fh=128,sz=90+p*96;ctx.drawImage(bombArt.explosion,frame*fw,0,fw,fh,e.x-sz/2,e.y-sz/2,sz,sz)}else{ctx.fillStyle=`rgba(255,220,103,${Math.max(0,.82-p)})`;ctx.beginPath();ctx.arc(e.x,e.y,rr,0,Math.PI*2);ctx.fill()}ctx.strokeStyle=`rgba(255,240,190,${1-p})`;ctx.lineWidth=2;for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(i*.79)*rr*1.2,e.y+Math.sin(i*.79)*rr*.75);ctx.stroke()}});
      ctx.restore();if(bombArt.foreground.complete&&bombArt.foreground.naturalWidth)ctx.drawImage(bombArt.foreground,0,0,w,h);
      // Integrated HUD.
      const live=aliveCount();if(roundState==='active'&&!['reset','exploding'].includes(bomb.state)){const fl=fuseLeft(),fr=clamp(fl/Math.max(.1,bomb.fuseTotal),0,1),dw=Math.min(330,w*.38),dx=w/2-dw/2,dy=15;ctx.fillStyle='rgba(4,8,15,.86)';rounded(ctx,dx,dy,dw,40,7);ctx.fill();ctx.strokeStyle=fr<.26?'#ff625e':fr<.48?'#f1b44f':'#64758f';ctx.stroke();ctx.fillStyle='#121b2b';ctx.fillRect(dx+62,dy+20,dw-76,7);const grad=ctx.createLinearGradient(dx+62,0,dx+dw-14,0);grad.addColorStop(0,'#ff625e');grad.addColorStop(.48,'#efb34f');grad.addColorStop(1,'#70dfa3');ctx.fillStyle=grad;ctx.fillRect(dx+62,dy+20,(dw-76)*fr,7);pxText(ctx,'FUSE',dx+12,dy+23,7,'#a9bad0','left');const holder=bomb.state==='held'&&bomb.holder>=0?actors[bomb.holder].name.toUpperCase():bomb.state==='loose'?'LOOSE BOMB':'IN THE AIR';pxText(ctx,holder,w/2,dy+10,7,fr<.28?'#ff7b74':'#fff0aa');}
      ctx.fillStyle='rgba(5,10,18,.78)';rounded(ctx,14,14,134,48,8);ctx.fill();ctx.strokeStyle=finalDuel?'#ffb256':'#6f809e';ctx.stroke();pxText(ctx,finalDuel?'FINAL DUEL':`HEAT ${heat}`,26,28,8,finalDuel?'#ffd276':'#93acd0','left');pxText(ctx,`${live} ALIVE`,26,47,15,'#fff0aa','left');
      ctx.fillStyle='rgba(5,10,18,.78)';rounded(ctx,w-150,14,136,48,8);ctx.fill();ctx.strokeStyle='#6f809e';ctx.stroke();pxText(ctx,'DODGE',w-136,28,7,'#8ea6c7','left');pxText(ctx,human.dashCd<=0?'READY':`${human.dashCd.toFixed(1)}s`,w-136,47,13,human.dashCd<=0?'#70e7a5':'#ffd06b','left');
      if(roundState==='winner'&&winner>=0){const a=actors[winner],pulse=(Math.sin(t/170)+1)/2;ctx.fillStyle='rgba(4,7,14,.62)';ctx.fillRect(0,0,w,h);ctx.save();const ox=a.x,oy=a.y;a.x=w/2;a.y=h*.51;a.winT=Math.max(a.winT,.2);const ws=1.28+sinSafe(t/220)*.025;ctx.translate(w/2,h*.51);ctx.scale(ws,ws);ctx.translate(-w/2,-h*.51);drawActor(a,winner,t);a.x=ox;a.y=oy;ctx.restore();pxText(ctx,'WINNER',w/2,h*.25,12,'#8feaff');pxText(ctx,a.name.toUpperCase(),w/2,h*.33,30,'#fff0a5');pxText(ctx,'LAST CONTESTANT STANDING',w/2,h*.66,8,'#ffd777');for(let i=0;i<18;i++){const ang=i/18*Math.PI*2+t*.001,r=80+((i*17)%70);ctx.fillStyle=COLORS[i%COLORS.length];ctx.fillRect(w/2+Math.cos(ang)*r,h*.49+Math.sin(ang)*r*.55,3,3)}}
      pxText(ctx,'WASD MOVE · MOUSE AIM · CLICK / SPACE THROW · SHIFT DODGE',w/2,h-18,7,'#d7e7ff');
    });

    function sinSafe(v){return Math.sin(v)}
    // Initial heat and QA diagnostics.
    startHeat();
    if(window.__REPARTY_QA__){window.__REPARTY_BOMB_DIAGNOSTICS__={snapshot:()=>({heat,roundState,alive:aliveIds(),winner,bomb:{state:bomb.state,holder:bomb.holder,from:bomb.from,x:bomb.x,y:bomb.y,fuse:fuseLeft()},stats:{...stats},actors:actors.map((a,i)=>({i,name:a.name,alive:a.alive,state:a.botState,noReturnTo:a.noReturnTo,noReturnMs:Math.max(0,a.noReturnUntil-performance.now()),x:a.x,y:a.y,dashCd:a.dashCd}))}),forceFuse:s=>{bomb.fuseEnds=performance.now()+Math.max(.03,Number(s)||.03)*1000},forceHolder:i=>{i=clamp(Math.floor(Number(i)||0),0,actors.length-1);if(!actors[i].alive)actors[i].alive=true;bomb.fuseTotal=6;bomb.fuseEnds=performance.now()+6000;assignHolder(i,-1);return i},dropBomb:()=>{if(bomb.state==='held'&&bomb.holder>=0)landLoose(actors[bomb.holder].x+35,actors[bomb.holder].y,150,0,bomb.holder)},setAlive:n=>{const keep=clamp(Math.floor(Number(n)||1),1,actors.length);actors.forEach((a,i)=>{a.alive=i<keep;if(!a.alive){a.eliminatedAt=performance.now()-1000;a.spectatorX=arena.cx+(-.38+(i%6)*.15)*arena.rx;a.spectatorY=arena.cy+arena.ry+54}});roundState='active';startHeat();return aliveIds()},stressAntiReturn:n=>{const count=Math.max(1,Math.floor(Number(n)||500)),ids=actors.map((_,i)=>i);let holder=0,prev=-1,violations=0,passes=0;for(let k=0;k<count;k++){const choices=ids.filter(i=>i!==holder&&(ids.length<=2||i!==prev));if(!choices.length)break;const to=choices[k%choices.length];if(ids.length>2&&to===prev)violations++;prev=holder;holder=to;passes++}return{passes,violations}},stressBotTargeting:n=>{const count=Math.max(1,Math.floor(Number(n)||1000)),ids=actors.map((_,i)=>i),saved=actors.map(a=>({x:a.x,y:a.y,dashCd:a.dashCd,noReturnTo:a.noReturnTo,noReturnUntil:a.noReturnUntil,alive:a.alive})),targets=Object.fromEntries(ids.map(i=>[actors[i].name,0]));let violations=0,passes=0;for(let k=0;k<count;k++){actors.forEach(a=>{a.alive=true;a.x=arena.cx+rand(-arena.rx*.68,arena.rx*.68);a.y=arena.cy+rand(-arena.ry*.62,arena.ry*.62);a.dashCd=rand(0,2)});const holder=ids[k%ids.length],prev=ids[(k+ids.length-1)%ids.length],a=actors[holder];a.noReturnTo=prev;a.noReturnUntil=performance.now()+999999;const to=selectBotTarget(holder);if(to>=0){passes++;targets[actors[to].name]=(targets[actors[to].name]||0)+1;if(to===prev)violations++}}actors.forEach((a,i)=>Object.assign(a,saved[i]));return{passes,violations,targets}},tuning:()=>({...TUNE}),assets:()=>({arena:bombArt.arena.complete&&bombArt.arena.naturalWidth>0,foreground:bombArt.foreground.complete&&bombArt.foreground.naturalWidth>0,bomb:bombArt.bomb.complete&&bombArt.bomb.naturalWidth>0,explosion:bombArt.explosion.complete&&bombArt.explosion.naturalWidth>0,fallback:bombArt.fallback.complete&&bombArt.fallback.naturalWidth>0,canonical:[...actorArt.entries()].map(([src,img])=>({src,loaded:img.complete&&img.naturalWidth>0}))}),audio:()=>({musicStarted,clips:Object.keys(bombClips),music:bombMusic.map(a=>({src:a.src,paused:a.paused,volume:a.volume}))}),trace:()=>window.__REPARTY_BOMB_TRACE||[]}}
  }

  function gamePotion(){
    const dom=el('rpDom');dom.classList.add('rp-dom-full');
    const ingredients=[['EMBERLEAF','ember','✦'],['MOONCAP','moon','◆'],['SLIME DEW','slime','●'],['STAR ROOT','star','▲'],['FROSTBERRY','frost','■'],['SUNSALT','sun','✚']];
    let round=0,total=0,correctTotal=0,attempts=0,phase='preview',recipe=[],index=0,roundStart=0,heat=.28,heatTarget=[.45,.65],brewElapsed=0,stableTime=0,finishNeedle=.05,finishDir=1,finishZone=[.45,.60],cleanRounds=0,contamination=0;
    const renderShell=title=>{dom.innerHTML=`<div class="rp-potion-scene rp-potion-pro"><div class="rp-alchemy-shelf"><i></i><i></i><i></i><i></i><i></i></div><div class="rp-potion-board"><span class="rp-kicker">RECIPE ${round}</span><h3>${title}</h3><div class="rp-recipe-line" id="rpRecipeLine"></div><div class="rp-potion-status" id="rpPotionStatus"></div><div class="rp-brew-meter" id="rpBrewMeter" hidden><span></span><i id="rpHeatZone"></i><b id="rpHeatNeedle"></b><em id="rpHeatLabel">HEAT</em></div><div class="rp-distill-meter" id="rpDistillMeter" hidden><span></span><i id="rpDistillZone"></i><b id="rpDistillNeedle"></b></div></div><button class="rp-cauldron rp-cauldron-button" id="rpCauldron" type="button" aria-label="Bottle potion"><i></i><b></b><span></span><em id="rpCauldronAction">WAIT</em></button><div class="rp-lab-lights"><i></i><i></i><i></i></div></div>`};
    const nextRecipe=()=>{
      if(RP.finished)return;round++;phase='preview';index=0;contamination=0;brewElapsed=0;stableTime=0;heat=.25+Math.random()*.15;const len=clamp(3+Math.floor(round/2),3,6);recipe=Array.from({length:len},()=>choose(ingredients));roundStart=performance.now();renderShell('MEMORISE THE RECIPE');
      el('rpRecipeLine').innerHTML=recipe.map((x,i)=>`<div class="rp-ingredient-card is-preview ing-${x[1]}" style="--delay:${i*.07}s"><b>${x[2]}</b><small>${x[0]}</small></div>`).join('');el('rpPotionStatus').innerHTML='<strong>WATCH THE ORDER</strong><span>You will mix, control heat, then bottle at the perfect colour.</span>';
      later(openTray,1850);
    };
    const openTray=()=>{
      if(RP.finished)return;phase='mix';renderShell('MIX THE INGREDIENTS');const line=el('rpRecipeLine');line.innerHTML=ingredients.map(x=>`<button class="rp-ingredient-card ing-${x[1]}" data-ing="${x[0]}"><b>${x[2]}</b><small>${x[0]}</small></button>`).join('');el('rpPotionStatus').innerHTML=`<strong>0 / ${recipe.length}</strong><span>FOLLOW THE MEMORISED ORDER</span>`;el('rpCauldronAction').textContent='MIXING';line.querySelectorAll('button').forEach(btn=>listen(btn,'click',()=>pick(btn)));listen(el('rpCauldron'),'click',bottle);
    };
    const pick=btn=>{
      if(phase!=='mix'||RP.finished)return;activity(.09);attempts++;const target=recipe[index];
      if(btn.dataset.ing===target[0]){correctTotal++;index++;btn.classList.add('is-correct');playTone(680+index*45,.04,.016);later(()=>btn.classList.remove('is-correct'),150);el('rpPotionStatus').innerHTML=`<strong>${index} / ${recipe.length}</strong><span>${contamination?'RECOVER THE BREW':'CLEAN SO FAR'}</span>`;if(index>=recipe.length)beginHeat()}
      else{contamination++;total=Math.max(0,total-1);btn.classList.add('is-wrong');gameCallout('WRONG INGREDIENT',`CONTAMINATION ${contamination}`,'bad');later(()=>btn.classList.remove('is-wrong'),220)};
    };
    const beginHeat=()=>{
      phase='heat';const center=rand(.42,.66),half=Math.max(.07,.13-round*.004);heatTarget=[clamp(center-half,.14,.78),clamp(center+half,.25,.91)];brewElapsed=0;stableTime=0;
      el('rpRecipeLine').innerHTML=recipe.map(x=>`<div class="rp-ingredient-card is-preview ing-${x[1]}"><b>${x[2]}</b><small>${x[0]}</small></div>`).join('');el('rpPotionStatus').innerHTML='<strong>CONTROL THE HEAT</strong><span>HOLD SPACE to heat · RELEASE to cool · stay inside the gold band.</span>';const m=el('rpBrewMeter');m.hidden=false;el('rpHeatZone').style.left=`${heatTarget[0]*100}%`;el('rpHeatZone').style.width=`${(heatTarget[1]-heatTarget[0])*100}%`;el('rpCauldronAction').textContent='BREWING';gameCallout('BREW IT!','HOLD SPACE TO HEAT · RELEASE TO COOL','good');
    };
    const beginFinish=()=>{
      phase='finish';finishNeedle=0;finishDir=1;const center=rand(.40,.70),half=Math.max(.055,.105-round*.003);finishZone=[clamp(center-half,.08,.82),clamp(center+half,.18,.94)];const m=el('rpBrewMeter');if(m)m.hidden=true;const d=el('rpDistillMeter');d.hidden=false;el('rpDistillZone').style.left=`${finishZone[0]*100}%`;el('rpDistillZone').style.width=`${(finishZone[1]-finishZone[0])*100}%`;el('rpPotionStatus').innerHTML='<strong>BOTTLE AT THE PERFECT COLOUR</strong><span>Click the cauldron or press ENTER when the needle crosses the gold band.</span>';el('rpCauldron').classList.add('is-ready');el('rpCauldronAction').textContent='BOTTLE';gameCallout('FINISH IT!','CLICK CAULDRON / ENTER IN THE GOLD BAND','gold');
    };
    const bottle=()=>{
      if(phase!=='finish'||RP.finished)return;activity(.12);phase='locked';const finishQ=finishNeedle>=finishZone[0]&&finishNeedle<=finishZone[1]?1:Math.max(0,1-Math.min(Math.abs(finishNeedle-finishZone[0]),Math.abs(finishNeedle-finishZone[1]))*5);const accuracy=Math.max(0,1-contamination/Math.max(1,recipe.length+2));const brewQ=clamp(stableTime/Math.max(.01,brewElapsed),0,1);const speed=Math.max(0,1-(performance.now()-roundStart)/11500);const gain=Math.round(recipe.length*5+accuracy*14+brewQ*20+finishQ*20+speed*8);total+=gain;if(accuracy>.98&&brewQ>.76&&finishQ>.9)cleanRounds++;
      const quality=accuracy*.32+brewQ*.38+finishQ*.30;setScore(total,clamp(quality*72+Math.min(20,total*.12)+cleanRounds*4,0,100),1);el('rpCauldron').classList.add(quality>.78?'is-success':'is-error');el('rpPotionStatus').innerHTML=`<strong>${quality>.9?'MASTER BREW':quality>.72?'GOOD BREW':'UNSTABLE BREW'}</strong><span>Recipe ${Math.round(accuracy*100)}% · heat ${Math.round(brewQ*100)}% · finish ${Math.round(finishQ*100)}% · +${gain}</span>`;gameCallout(quality>.9?'MASTER BREW!':quality>.72?'BREW SEALED':'BREW WOBBLED',`HEAT ${Math.round(brewQ*100)}% · FINISH ${Math.round(finishQ*100)}% · +${gain}`,quality>.9?'great':quality>.72?'good':'bad');cameraPunch(quality>.9?.42:.18);later(nextRecipe,920);
    };
    loop(dt=>{
      if(phase==='heat'){
        const heating=RP.keys.has(' ')||RP.keys.has('space');brewElapsed+=dt;const ramp=difficultyRamp(1,1.28);heat+=dt*(heating?.40:-.24)*ramp;heat+=Math.sin(performance.now()/310+round)*dt*.035;heat=clamp(heat,0,1);const stable=heat>=heatTarget[0]&&heat<=heatTarget[1];if(stable)stableTime+=dt;if(heat>.93||heat<.06){contamination+=dt*.18}const n=el('rpHeatNeedle');if(n)n.style.left=`${heat*100}%`;const l=el('rpHeatLabel');if(l)l.textContent=`${stable?'PERFECT HEAT':heating?'HEATING':'COOLING'} · ${Math.max(0,Math.ceil(3.1-brewElapsed))}s`;if(brewElapsed>=3.1)beginFinish();
      }else if(phase==='finish'){finishNeedle+=finishDir*dt*(1.25+difficultyRamp(0,.75));if(finishNeedle>=1){finishNeedle=1;finishDir=-1}else if(finishNeedle<=0){finishNeedle=0;finishDir=1}const n=el('rpDistillNeedle');if(n)n.style.left=`${finishNeedle*100}%`}
    },()=>{});
    listen(window,'keydown',e=>{if(e.code==='Space'&&phase==='heat'){activity(.015);e.preventDefault()}if((e.key==='Enter'||e.code==='NumpadEnter')&&phase==='finish'){bottle();e.preventDefault()}},{passive:false});nextRecipe();
  }

  function gameFishing(){
    const {c,ctx,w,h}=canvasEnv(),waterY=h*.66,rod={x:w*.13,y:waterY-34};
    const rivals=contestantList().filter(p=>!currentUser(p)).slice(0,5).map((p,i)=>({name:p.username,x:w*.35+i*w*.115,y:waterY-18-(i%2)*12,score:0,next:rand(.8,2.2),color:COLORS[(i+1)%COLORS.length]}));
    let fish=[],ripples=[],score=0,combo=0,best=0,spawn=0,cursor={x:w*.58,y:waterY-70},hooked=null,tension=.38,progress=0,breaks=0,cast=null,escapeLow=0,weather=0,legendary=0;
    const spawnFish=()=>{
      const p=activeProgress(),bad=Math.random()<.10,gold=!bad&&Math.random()<(.055+p*.035),rare=!bad&&!gold&&Math.random()<(.14+p*.05),big=!bad&&!gold&&!rare&&Math.random()<.24;
      const life=rand(2.1,3.4),speed=rand(76,130)*(1+p*.35),arc=rand(22,72);
      // IMPORTANT: every fish enters from the RIGHT and travels RIGHT -> LEFT.
      const spawned={x:w+45+rand(0,85),baseY:waterY+rand(18,h-waterY-40),y:waterY,age:0,life,arc,speed,bad,gold,rare,big,hit:false,wobble:rand(0,Math.PI*2),value:gold?12:rare?7:big?4:2,fight:gold?1.45:rare?1.18:big?.92:.72};fish.push(spawned);
      if(window.__REPARTY_QA__){window.__REPARTY_FISH_TRACE=window.__REPARTY_FISH_TRACE||[];window.__REPARTY_FISH_TRACE.push({spawnX:spawned.x,canvasW:w,direction:'left',speed:spawned.speed,at:performance.now()})}
    };
    listen(c,'pointermove',e=>{cursor=pointerPos(c,e)});
    const startCast=()=>{
      if(hooked||cast||RP.finished)return;activity(.05);const tx=clamp(cursor.x,w*.28,w-28),ty=clamp(cursor.y,70,waterY+45);cast={t:0,tx,ty,hit:null};let bd=52;for(const f of fish){if(f.hit||f.bad&&f.age>f.life*.9)continue;const d=Math.hypot(tx-f.x,ty-f.y);if(d<bd){bd=d;cast.hit=f}}playTone(310,.035,.012,'triangle');
    };
    listen(c,'pointerdown',e=>{cursor=pointerPos(c,e);startCast()});
    const hookFish=f=>{
      if(!f)return;ripples.push({x:f.x,y:f.y,t:0});f.hit=true;
      if(f.bad){score=Math.max(0,score-2);combo=0;breaks++;gameCallout('JUNK!',choose(['OLD BOOT','BROKEN CRATE','RUSTY HELMET']),'bad');return}
      hooked=f;tension=.34;progress=0;escapeLow=0;gameCallout(f.gold?'LEGENDARY FISH!':f.rare?'RARE FISH!':f.big?'BIG FISH!':'FISH ON!',f.gold?'THIS ONE FIGHTS HARD':'HOLD SPACE TO REEL · RELEASE TO EASE TENSION',f.gold?'gold':'good');
    };
    const landFish=()=>{
      const f=hooked;if(!f)return;const gain=f.value+Math.min(5,Math.floor(combo/4));score+=gain;combo++;best=Math.max(best,combo);if(f.gold)legendary++;gameCallout(f.gold?'LEGENDARY CATCH!':f.rare?'RARE CATCH!':f.big?'BIG CATCH!':'LANDED!',`+${gain} · COMBO x${combo}`,f.gold?'gold':combo%6===0?'great':'good');cameraPunch(f.gold?.48:.18);ripples.push({x:f.x,y:f.y,t:0});hooked=null;tension=.34;progress=0;setScore(score,clamp(score*2.8+best*2.2+legendary*8-breaks*3,0,100),RP.participation)
    };
    const snapLine=reason=>{breaks++;combo=0;gameCallout(reason,'FISH ESCAPED','bad');cameraPunch(.28);hooked=null;tension=.34;progress=0;escapeLow=0};
    listen(window,'keydown',e=>{if(e.code==='Space'){activity(.025);e.preventDefault()}},{passive:false});
    loop((dt,t)=>{
      const ramp=difficultyRamp(1,1.45);spawn-=dt;if(spawn<=0){spawn=rand(.20,.42)/ramp;spawnFish();if(Math.random()<.18)spawnFish()}
      weather+=dt*.15;for(const r of rivals){r.next-=dt;if(r.next<=0){r.next=rand(.75,1.8)/ramp;r.score+=Math.random()<.1?3:1}}
      if(cast){cast.t+=dt/0.34;if(cast.t>=1){const f=cast.hit;cast=null;if(f&&Math.hypot(f.x-cursor.x,f.y-cursor.y)<95)hookFish(f);else{ripples.push({x:cursor.x,y:clamp(cursor.y,waterY-25,h-35),t:0});combo=0;playTone(155,.03,.007)}}}
      for(const f of fish){if(f.hit&&!hooked)continue;f.age+=dt;f.x-=f.speed*dt;f.y=f.baseY+Math.sin(f.age*3.6+f.wobble)*7-Math.max(0,Math.sin((f.age/f.life)*Math.PI))*f.arc*.45}
      fish=fish.filter(f=>f.age<f.life&&f.x>-55&&!(!hooked&&f.hit));ripples.forEach(r=>r.t+=dt);ripples=ripples.filter(r=>r.t<.9);
      if(hooked){
        const holding=RP.keys.has(' ')||RP.keys.has('space'),fight=hooked.fight*ramp,pull=(Math.sin(t*.009+hooked.wobble)+1)*.5;
        hooked.x+=Math.sin(t*.006+hooked.wobble)*fight*22*dt;hooked.y+=Math.cos(t*.008+hooked.wobble)*fight*16*dt;
        tension+=dt*((holding?.54:-.32)+pull*.22*fight);tension=clamp(tension,0,1.2);
        if(holding&&tension>.14&&tension<.93)progress+=dt*(.34/fight)*(1.15-Math.abs(tension-.55));
        else if(!holding)progress=Math.max(0,progress-dt*.035*fight);
        if(tension<.07){escapeLow+=dt;if(escapeLow>.85/fight){snapLine('LINE WENT SLACK!')}}else escapeLow=Math.max(0,escapeLow-dt*.9);
        if(hooked&&tension>1.02)snapLine('LINE SNAPPED!');
        if(hooked&&progress>=1)landFish();
      }
      setScore(score,clamp(score*2.8+best*2.2+legendary*8+(hooked?progress*8:0)-breaks*3,0,100),RP.participation)
    },t=>{
      drawLakeBackdrop(ctx,w,h,t,waterY);
      // weather/water bands make the lake feel alive without hiding targets
      ctx.fillStyle=`rgba(185,224,255,${.025+.02*(Math.sin(weather)+1)})`;for(let i=0;i<7;i++)ctx.fillRect(((i*173+t*.03)%(w+140))-70,waterY+24+i*23,85,2);
      ctx.fillStyle='#68482e';ctx.fillRect(0,waterY+5,w*.21,h-waterY);ctx.fillStyle='#a77b4a';ctx.fillRect(w*.015,waterY-8,w*.19,14);ctx.strokeStyle='#c8a06b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(rod.x,rod.y+15);ctx.lineTo(rod.x+25,rod.y-40);ctx.stroke();
      rivals.forEach((r,i)=>{drawCharacter(ctx,{name:r.name},r.x,r.y,{color:r.color,scale:.48,label:false});ctx.strokeStyle='rgba(220,240,255,.28)';ctx.beginPath();ctx.moveTo(r.x+8,r.y-10);ctx.lineTo(r.x+40,r.y+32);ctx.stroke();pxText(ctx,String(r.score),r.x,r.y-33,6,'#c8d9ef')});
      fish.forEach(f=>{if(f===hooked)return;ctx.globalAlpha=.30;ctx.fillStyle=f.gold?'#ffe36c':f.rare?'#b895ff':f.bad?'#777684':'#76d9e8';ctx.beginPath();ctx.ellipse(f.x,f.y+7,f.big?22:16,6,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=f.bad?'#6b6872':f.gold?'#ffd34f':f.rare?'#b18cff':f.big?'#73bcd9':'#73d7e9';ctx.beginPath();ctx.ellipse(f.x,f.y,f.big?24:18,f.big?10:8,0,0,Math.PI*2);ctx.fill();if(!f.bad){ctx.beginPath();ctx.moveTo(f.x+17,f.y);ctx.lineTo(f.x+30,f.y-9);ctx.lineTo(f.x+30,f.y+9);ctx.fill()}if(f.gold)drawSpark(ctx,f.x,f.y-17,t/1000,'#fff0a0')});
      ripples.forEach(r=>{ctx.strokeStyle=`rgba(155,231,255,${1-r.t/.9})`;ctx.beginPath();ctx.ellipse(r.x,r.y,8+r.t*42,3+r.t*13,0,0,Math.PI*2);ctx.stroke()});
      let lineX=cursor.x,lineY=cursor.y;if(cast){const p=clamp(cast.t,0,1);lineX=lerp(rod.x+25,cast.tx,p);lineY=lerp(rod.y-40,cast.ty,p)-Math.sin(p*Math.PI)*80}
      if(hooked){lineX=hooked.x;lineY=hooked.y;ctx.fillStyle=hooked.gold?'#ffd34f':hooked.rare?'#b18cff':hooked.big?'#73bcd9':'#73d7e9';ctx.beginPath();ctx.ellipse(hooked.x,hooked.y,hooked.big?27:21,10,0,0,Math.PI*2);ctx.fill();if(hooked.gold)drawSpark(ctx,hooked.x,hooked.y-20,t/1000,'#fff0a0')}
      if(cast||hooked){ctx.strokeStyle=hooked?(tension>.88?'#ff6878':tension<.14?'#7aa0bd':'#d9f7ff'):'#dcecff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(rod.x+25,rod.y-40);ctx.quadraticCurveTo((rod.x+lineX)/2,Math.min(rod.y,lineY)-55,lineX,lineY);ctx.stroke()}
      if(hooked){panel(ctx,w*.36,14,w*.28,45,'REEL PROGRESS',`${Math.round(progress*100)}%`,'#8feaff');ctx.fillStyle='#18233b';ctx.fillRect(w*.36+10,48,w*.28-20,6);ctx.fillStyle=tension>.88?'#ff6d7d':tension<.14?'#7795b4':'#ffd45f';ctx.fillRect(w*.36+10,48,(w*.28-20)*clamp(tension,0,1),6);pxText(ctx,'LINE TENSION',w*.5,61,6,'#b7cae4')}
      ctx.strokeStyle='rgba(255,255,255,.65)';ctx.beginPath();ctx.arc(cursor.x,cursor.y,15,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(cursor.x-21,cursor.y);ctx.lineTo(cursor.x+21,cursor.y);ctx.moveTo(cursor.x,cursor.y-21);ctx.lineTo(cursor.x,cursor.y+21);ctx.stroke();panel(ctx,14,14,105,45,'CATCH VALUE',score,'#ffe078');panel(ctx,129,14,105,45,'COMBO',`x${combo}`,'#8feaff');panel(ctx,w-119,14,105,45,'BREAKS',breaks,breaks?'#ff8290':'#82e8a9');pxText(ctx,hooked?'HOLD SPACE = REEL · RELEASE = EASE TENSION':'AIM + CLICK TO CAST — ALL FISH ENTER FROM THE RIGHT',w/2,h-18,7,'#d3e7ff')
    });
  }

  function gameChop(){
    const {c,ctx,w,h}=canvasEnv();let cursor={x:w*.5,y:h*.5},score=0,combo=0,best=0,meter=.12,meterDir=1,swings=[],falls=[],mistakes=0,perfects=0;
    const TYPES={soft:{name:'SOFTWOOD',hp:2,value:2,sweet:.22,color:'#4f9252',trunk:'#755038'},oak:{name:'OAK',hp:3,value:4,sweet:.17,color:'#407d48',trunk:'#6a432b'},ancient:{name:'ANCIENT',hp:4,value:7,sweet:.12,color:'#497681',trunk:'#574238'},rotten:{name:'ROTTEN',hp:1,value:-3,sweet:.2,color:'#6a4162',trunk:'#4f3348'}};
    const makeTree=(i)=>{const r=Math.random(),type=r<.12?'rotten':r<.24?'ancient':r<.56?'oak':'soft',spec=TYPES[type];return{x:85+i*(w-170)/5,y:h*.68+Math.sin(i*1.55)*24,type,spec,hp:spec.hp,maxHp:spec.hp,fall:0,respawn:0,marked:false,warning:0,dir:Math.random()<.5?-1:1}};
    let trees=Array.from({length:6},(_,i)=>makeTree(i));
    listen(c,'pointermove',e=>cursor=pointerPos(c,e));
    const targetTree=()=>trees.filter(t=>t.respawn<=0&&t.fall<=0).sort((a,b)=>Math.hypot(a.x-cursor.x,a.y-cursor.y)-Math.hypot(b.x-cursor.x,b.y-cursor.y))[0];
    const swing=()=>{
      if(RP.finished)return;const tr=targetTree();if(!tr||Math.hypot(tr.x-cursor.x,tr.y-cursor.y)>82)return;activity(.08);const sweet=1-Math.min(1,Math.abs(meter-.5)/Math.max(.05,tr.spec.sweet));const perfect=sweet>.74;swings.push({x:tr.x,y:tr.y,t:0,perfect});
      if(tr.type==='rotten'){mistakes++;combo=0;score=Math.max(0,score-3);tr.fall=.34;tr.warning=.18;gameCallout('ROTTEN TREE!','BAD READ · MOVE ON','bad');cameraPunch(.28);return}
      const dmg=perfect?2:1;tr.hp-=dmg;playTone(perfect?760:510,.04,.016);if(perfect){perfects++;scoreBurst('PERFECT!',tr.x/w*100,(tr.y-55)/h*100,'gold');impactPause(28)}
      if(tr.hp<=0){const gain=tr.spec.value+(perfect?2:0)+Math.min(4,Math.floor(combo/4));score+=gain;combo++;best=Math.max(best,combo);tr.fall=.82;tr.warning=.28;falls.push({x:tr.x,y:tr.y,t:0,dir:tr.dir,color:tr.spec.color,trunk:tr.spec.trunk,type:tr.type});gameCallout(tr.type==='ancient'?'ANCIENT DOWN!':perfect?'PERFECT FELL!':'TREE DOWN!',`+${gain} · STREAK x${combo}`,tr.type==='ancient'?'gold':perfect?'great':'good');cameraPunch(perfect?.34:.18)}
      setScore(score,clamp(score*3.2+best*2.1+perfects*1.6-mistakes*4,0,100),RP.participation);
    };
    listen(c,'pointerdown',e=>{cursor=pointerPos(c,e);swing()});listen(window,'keydown',e=>{if(e.code==='Space'){swing();e.preventDefault()}},{passive:false});
    loop((dt,t)=>{
      const ramp=difficultyRamp(1,1.55);meter+=meterDir*dt*1.18*ramp;if(meter>=1){meter=1;meterDir=-1}else if(meter<=0){meter=0;meterDir=1}
      trees.forEach((tr,i)=>{tr.warning=Math.max(0,tr.warning-dt);if(tr.fall>0){tr.fall-=dt;if(tr.fall<=0){tr.respawn=rand(.65,1.15);tr.fall=0}}else if(tr.respawn>0){tr.respawn-=dt;if(tr.respawn<=0)trees[i]=makeTree(i)}});swings.forEach(s=>s.t+=dt);swings=swings.filter(s=>s.t<.28);falls.forEach(f=>f.t+=dt);falls=falls.filter(f=>f.t<.86);
      setScore(score,clamp(score*3.2+best*2.1+perfects*1.6-mistakes*4,0,100),RP.participation)
    },t=>{
      drawForestBackdrop(ctx,w,h,t);ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(0,h*.76,w,h*.24);
      trees.forEach(tr=>{if(tr.fall>0||tr.respawn>0)return;drawShadow(ctx,tr.x,tr.y+35,29,7,.28);ctx.fillStyle=tr.spec.trunk;ctx.fillRect(tr.x-8,tr.y-46,16,80);ctx.fillStyle=tr.spec.color;ctx.beginPath();ctx.arc(tr.x,tr.y-62,31,0,Math.PI*2);ctx.arc(tr.x-23,tr.y-48,22,0,Math.PI*2);ctx.arc(tr.x+23,tr.y-48,22,0,Math.PI*2);ctx.fill();if(tr.type==='ancient'){ctx.strokeStyle='#7cd8d0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(tr.x,tr.y-58,38,0,Math.PI*2);ctx.stroke()}if(tr.type==='rotten'){ctx.strokeStyle='#e16c82';ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(tr.x,tr.y-55,37,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}pxText(ctx,tr.spec.name,tr.x,tr.y+48,6,tr.type==='rotten'?'#ff8fa1':tr.type==='ancient'?'#8feaff':'#d8e8ff');pxText(ctx,`${Math.max(0,tr.hp)} / ${tr.maxHp} HITS`,tr.x,tr.y+61,6,'#8aa2bf')});
      falls.forEach(f=>{const p=f.t/.86;ctx.save();ctx.translate(f.x,f.y+20);ctx.rotate(f.dir*p*1.32);ctx.fillStyle=f.trunk;ctx.fillRect(-7,-75,14,77);ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(0,-82,31,0,Math.PI*2);ctx.fill();ctx.restore();if(p<.38){ctx.fillStyle='rgba(255,116,116,.12)';ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x+f.dir*110,f.y+28);ctx.lineTo(f.x+f.dir*115,f.y-8);ctx.closePath();ctx.fill()}});
      const tr=targetTree();if(tr&&Math.hypot(tr.x-cursor.x,tr.y-cursor.y)<84){ctx.strokeStyle=tr.type==='rotten'?'#ff7185':'#ffe078';ctx.lineWidth=2;ctx.beginPath();ctx.arc(tr.x,tr.y-12,46,0,Math.PI*2);ctx.stroke()}swings.forEach(s=>{ctx.strokeStyle=s.perfect?'#fff09b':'#c9e9ff';ctx.lineWidth=s.perfect?5:3;ctx.beginPath();ctx.arc(s.x,s.y-8,50,-2.6,-.35);ctx.stroke()});
      panel(ctx,14,14,105,45,'LOG VALUE',score,'#ffe078');panel(ctx,129,14,105,45,'STREAK',`x${combo}`,'#8feaff');panel(ctx,w-119,14,105,45,'PERFECT',perfects,'#9af0ad');const target=targetTree(),band=target?.spec.sweet||.17;ctx.fillStyle='#14243a';ctx.fillRect(w*.35,30,w*.30,10);ctx.fillStyle=target?.type==='rotten'?'#ff7185':'#ffe078';ctx.fillRect(w*.35+w*.30*(.5-band),27,w*.30*(band*2),16);ctx.fillStyle='#7ee7ff';ctx.fillRect(w*.35+w*.30*meter-2,25,4,20);pxText(ctx,target?`${target.spec.name} TIMING`:'SWING TIMING',w*.5,17,7,'#dce8ff');pxText(ctx,'AIM AT A TREE · CLICK / SPACE ON THE GOLD BAND · ANCIENT = HARDER / MORE VALUE',w/2,h-18,7,'#d3e7ff')
    });
  }

  function gameBuilder(){
    const {c,ctx,w,h}=canvasEnv(),cols=5,rows=5;
    const grid={x:w*.075,y:h*.17,w:w*.56,h:h*.70},cw=grid.w/cols,ch=grid.h/rows;
    const tray={x:w*.68,y:h*.18,w:w*.25,h:h*.48},submitBtn={x:w*.70,y:h*.72,w:w*.20,h:52},undoBtn={x:w*.70,y:h*.81,w:w*.20,h:34};
    const PIECES=[
      {name:'STONE L',mat:'stone',color:'#8b93a3',shape:[[0,0],[1,0],[0,1]]},
      {name:'TIMBER BEAM',mat:'wood',color:'#b77442',shape:[[0,0],[1,0],[2,0]]},
      {name:'GLASS CORNER',mat:'glass',color:'#55d8ef',shape:[[0,0],[0,1],[1,1]]},
      {name:'BRICK BLOCK',mat:'brick',color:'#c36556',shape:[[0,0],[1,0],[0,1],[1,1]]},
      {name:'GOLD CAP',mat:'gold',color:'#f1c95b',shape:[[0,0],[1,0],[2,0],[1,1]]}
    ];
    const TEMPLATES=[
      [{p:0,x:0,y:3,r:0},{p:1,x:1,y:4,r:0},{p:2,x:3,y:2,r:1},{p:3,x:2,y:3,r:0}],
      [{p:0,x:3,y:3,r:3},{p:1,x:1,y:1,r:1},{p:2,x:0,y:2,r:0},{p:4,x:1,y:3,r:0}],
      [{p:3,x:0,y:3,r:0},{p:1,x:2,y:4,r:0},{p:2,x:3,y:2,r:2},{p:4,x:1,y:2,r:0}],
      [{p:0,x:0,y:2,r:1},{p:3,x:2,y:3,r:0},{p:1,x:1,y:1,r:0},{p:2,x:3,y:1,r:3}],
      [{p:4,x:1,y:3,r:0},{p:0,x:0,y:3,r:0},{p:2,x:3,y:2,r:2},{p:1,x:1,y:1,r:0}]
    ];
    let round=0,phase='preview',target=[],available=[],placed=[],selected=0,rotation=0,previewUntil=0,resultUntil=0,total=0,submits=0,perfects=0,lastAccuracy=0,feedback='STUDY THE STRUCTURE',hoverCell=-1,hoverTray=-1,wobble=0;
    const rotShape=(shape,r)=>{let pts=shape.map(([x,y])=>[x,y]);for(let k=0;k<(r%4+4)%4;k++){pts=pts.map(([x,y])=>[-y,x]);const minX=Math.min(...pts.map(q=>q[0])),minY=Math.min(...pts.map(q=>q[1]));pts=pts.map(([x,y])=>[x-minX,y-minY])}return pts};
    const cellsFor=(pl)=>rotShape(PIECES[pl.p].shape,pl.r).map(([dx,dy])=>[pl.x+dx,pl.y+dy]);
    const validPlacement=pl=>cellsFor(pl).every(([x,y])=>x>=0&&x<cols&&y>=0&&y<rows&&!placed.some(q=>q!==pl&&cellsFor(q).some(([qx,qy])=>qx===x&&qy===y)));
    const targetGrid=()=>{const g=Array(cols*rows).fill(-1);for(const pl of target)for(const [x,y] of cellsFor(pl))if(x>=0&&x<cols&&y>=0&&y<rows)g[y*cols+x]=pl.p;return g};
    const placedGrid=()=>{const g=Array(cols*rows).fill(-1);for(const pl of placed)for(const [x,y] of cellsFor(pl))if(x>=0&&x<cols&&y>=0&&y<rows)g[y*cols+x]=pl.p;return g};
    const nextBlueprint=()=>{
      round++;phase='preview';placed=[];selected=0;rotation=0;wobble=0;target=TEMPLATES[(round-1)%TEMPLATES.length].map(x=>({...x}));available=[...new Set(target.map(x=>x.p))];previewUntil=performance.now()+2800;feedback='STUDY POSITION + PIECE ORIENTATION';gameCallout(`BLUEPRINT ${round}`,'MEMORISE WHERE EACH PIECE SITS','good')
    };
    nextBlueprint();
    const cellAt=p=>{const x=Math.floor((p.x-grid.x)/cw),y=Math.floor((p.y-grid.y)/ch);return x>=0&&x<cols&&y>=0&&y<rows?y*cols+x:-1};
    const trayAt=p=>{if(p.x<tray.x||p.x>tray.x+tray.w||p.y<tray.y||p.y>tray.y+tray.h)return -1;const hh=tray.h/Math.max(1,available.length);const idx=Math.floor((p.y-tray.y)/hh);return idx>=0&&idx<available.length?idx:-1};
    const inRect=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
    const placeSelected=(cell)=>{
      if(phase!=='build'||cell<0)return;const x=cell%cols,y=Math.floor(cell/cols),p=available[selected];if(p==null)return;const existing=placed.find(q=>q.p===p);if(existing){placed.splice(placed.indexOf(existing),1)}const pl={p,x,y,r:rotation};if(validPlacement(pl)){placed.push(pl);activity(.07);playTone(540+p*70,.035,.012);feedback=`${PIECES[p].name} PLACED`;scoreBurst('SNAP!',(grid.x+(x+.5)*cw)/w*100,(grid.y+(y+.5)*ch)/h*100,'good')}else{if(existing)placed.push(existing);gameCallout('DOESN’T FIT','ROTATE OR CHOOSE ANOTHER ANCHOR','bad')}
    };
    const removeAt=cell=>{if(cell<0)return;const x=cell%cols,y=Math.floor(cell/cols),pl=placed.find(q=>cellsFor(q).some(([cx,cy])=>cx===x&&cy===y));if(pl){placed.splice(placed.indexOf(pl),1);feedback=`REMOVED ${PIECES[pl.p].name}`;activity(.03)}};
    const structuralIntegrity=(g)=>{let occupied=0,supported=0;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){if(g[y*cols+x]<0)continue;occupied++;if(y===rows-1||g[(y+1)*cols+x]>=0)supported++}return occupied?supported/occupied:0};
    const submit=()=>{
      if(phase!=='build')return;activity(.12);submits++;const tg=targetGrid(),pg=placedGrid();let cellCorrect=0,targetCells=0;for(let i=0;i<tg.length;i++){if(tg[i]>=0)targetCells++;if(tg[i]===pg[i]&&tg[i]>=0)cellCorrect++}const cellAcc=cellCorrect/Math.max(1,targetCells);let exact=0;for(const t of target){const p=placed.find(q=>q.p===t.p);if(p&&p.x===t.x&&p.y===t.y&&((p.r-t.r)%4+4)%4===0)exact++}const orientation=exact/Math.max(1,target.length),integrity=structuralIntegrity(pg),acc=cellAcc*.58+orientation*.27+integrity*.15;lastAccuracy=acc;const gain=Math.round(acc*45+Math.max(0,8-(placed.length-target.length)*2));total+=gain;if(acc>.985){perfects++;gameCallout('ARCHITECT PERFECT!','100% STRUCTURE · CROWD GOES WILD','great');cameraPunch(.40)}else gameCallout(acc>.78?'SOLID BUILD!':acc>.52?'BUILD STANDS':'STRUCTURE WOBBLES',`${Math.round(acc*100)}% ACCURACY · +${gain}`,acc>.78?'good':acc>.52?'gold':'bad');wobble=(1-acc)*1.2;setScore(total,clamp(acc*70+perfects*8+Math.min(22,total*.16),0,100),1);phase='result';resultUntil=performance.now()+1350;feedback=`${Math.round(cellAcc*100)}% CELLS · ${Math.round(orientation*100)}% ORIENTATION · ${Math.round(integrity*100)}% SUPPORT`
    };
    listen(c,'pointermove',e=>{const p=pointerPos(c,e);hoverCell=cellAt(p);hoverTray=trayAt(p)});
    listen(c,'pointerdown',e=>{const p=pointerPos(c,e);if(phase!=='build')return;const tr=trayAt(p);if(tr>=0){selected=tr;rotation=0;activity(.02);playTone(300+tr*80,.025,.008);return}if(inRect(p,submitBtn)){submit();return}if(inRect(p,undoBtn)){if(placed.length){const q=placed.pop();feedback=`UNDO ${PIECES[q.p].name}`;activity(.02)}return}const cell=cellAt(p);if(cell>=0){if(e.button===2)removeAt(cell);else placeSelected(cell);e.preventDefault()}});
    listen(c,'contextmenu',e=>{e.preventDefault();if(phase==='build')removeAt(cellAt(pointerPos(c,e)))});
    listen(window,'keydown',e=>{if(phase!=='build')return;if(e.key.toLowerCase()==='r'){rotation=(rotation+1)%4;activity(.025);gameCallout('ROTATED',`${PIECES[available[selected]]?.name||'PIECE'} · ${rotation*90}°`,'good');e.preventDefault()}if(e.code==='Space'||e.key==='Enter'){submit();e.preventDefault()}if(e.key==='Backspace'){if(placed.length)placed.pop();e.preventDefault()}},{passive:false});
    loop((dt,t)=>{if(phase==='preview'&&t>=previewUntil){phase='build';feedback='SELECT PIECE → R TO ROTATE → CLICK GRID → SUBMIT';gameCallout('BUILD!','SELECT · ROTATE · SNAP · SUBMIT','great')}if(phase==='result'&&t>=resultUntil)nextBlueprint();setScore(total,clamp((lastAccuracy||0)*68+perfects*8+Math.min(24,total*.16),0,100),RP.participation)},t=>{
      const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#28354b');bg.addColorStop(.5,'#171d2c');bg.addColorStop(1,'#0b101a');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle='#4b3427';ctx.fillRect(0,h*.82,w,h*.18);for(let i=0;i<8;i++){ctx.fillStyle=i%2?'#353e4b':'#313844';ctx.fillRect(i*w/8,h*.82,w/8-2,h*.18)}
      pxText(ctx,phase==='preview'?`BLUEPRINT ${round} · STUDY IT`:`BLUEPRINT ${round} · ${phase==='result'?'INSPECTION':'ASSEMBLY'}`,grid.x,48,12,'#fff0a4','left');pxText(ctx,phase==='preview'?'MEMORISE PIECES + ROTATION':'CLICK PIECE · R ROTATES · CLICK GRID TO SNAP · RIGHT CLICK REMOVES',grid.x,68,7,'#9eb5d7','left');
      ctx.fillStyle='rgba(7,12,23,.84)';rounded(ctx,grid.x-8,grid.y-8,grid.w+16,grid.h+16,8);ctx.fill();ctx.strokeStyle='#65789a';ctx.stroke();const tg=targetGrid(),pg=placedGrid(),source=phase==='preview'?tg:pg;
      ctx.save();if(phase==='result'&&wobble)ctx.translate(Math.sin(t/42)*wobble*5,0);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x,xx=grid.x+x*cw,yy=grid.y+y*ch,pid=source[i];ctx.fillStyle=pid>=0?PIECES[pid].color:'#121c2d';rounded(ctx,xx+5,yy+5,cw-10,ch-10,6);ctx.fill();ctx.strokeStyle=phase==='result'?(tg[i]===pg[i]?'#75f0a1':'#ff7185'):(i===hoverCell&&phase==='build'?'#ffe078':'#415778');ctx.lineWidth=i===hoverCell&&phase==='build'?2:1;ctx.stroke();if(pid>=0){ctx.fillStyle='rgba(255,255,255,.14)';ctx.fillRect(xx+11,yy+11,cw-22,4)}if(phase==='result'&&tg[i]>=0&&pg[i]!==tg[i]){ctx.fillStyle='rgba(255,86,102,.18)';ctx.fillRect(xx+7,yy+7,cw-14,ch-14)}}ctx.restore();
      // tray
      ctx.fillStyle='rgba(9,14,27,.91)';rounded(ctx,tray.x-8,tray.y-12,tray.w+16,tray.h+24,8);ctx.fill();ctx.strokeStyle='#55698a';ctx.stroke();pxText(ctx,'PIECE TRAY',tray.x+tray.w/2,tray.y-25,8,'#8feaff');const rowH=tray.h/Math.max(1,available.length);available.forEach((pid,j)=>{const yy=tray.y+j*rowH,sel=j===selected;ctx.fillStyle=sel?'#2d3650':'#141d31';rounded(ctx,tray.x,yy+4,tray.w,rowH-8,6);ctx.fill();ctx.strokeStyle=sel?'#ffe078':j===hoverTray?'#8feaff':'#3d506f';ctx.stroke();ctx.fillStyle=PIECES[pid].color;ctx.fillRect(tray.x+12,yy+15,24,24);pxText(ctx,PIECES[pid].name,tray.x+45,yy+19,7,sel?'#fff0a4':'#d9e4f5','left');const pl=placed.find(q=>q.p===pid);pxText(ctx,pl?`PLACED · ${pl.r*90}°`:`ROTATE ${rotation*90}°`,tray.x+45,yy+35,6,pl?'#83edaa':'#8ea4c3','left')});
      ctx.fillStyle=phase==='build'?'#49391f':'#182034';rounded(ctx,submitBtn.x,submitBtn.y,submitBtn.w,submitBtn.h,7);ctx.fill();ctx.strokeStyle=phase==='build'?'#ffe078':'#4b5a75';ctx.lineWidth=2;ctx.stroke();pxText(ctx,phase==='build'?'SUBMIT STRUCTURE':'INSPECTING…',submitBtn.x+submitBtn.w/2,submitBtn.y+20,9,phase==='build'?'#fff0a4':'#71809a');pxText(ctx,'SPACE / ENTER',submitBtn.x+submitBtn.w/2,submitBtn.y+38,6,'#91a6c7');ctx.fillStyle='#152037';rounded(ctx,undoBtn.x,undoBtn.y,undoBtn.w,undoBtn.h,6);ctx.fill();ctx.strokeStyle='#495d7e';ctx.stroke();pxText(ctx,'UNDO LAST PIECE',undoBtn.x+undoBtn.w/2,undoBtn.y+17,7,'#b8c9df');
      panel(ctx,14,14,112,45,'TOTAL',total,'#ffe078');panel(ctx,136,14,112,45,'PERFECT',perfects,'#9af0ad');panel(ctx,w-142,14,128,45,'LAST BUILD',`${Math.round(lastAccuracy*100)}%`,'#8feaff');pxText(ctx,feedback,w/2,h-20,7,phase==='result'?(lastAccuracy>.78?'#9af0ad':'#ff9ca8'):'#d3e7ff')
    });
  }

  function gameMinecart(){
    const {ctx,w,h}=canvasEnv();
    const roster=contestantList();
    const TUNE=Object.freeze({
      laneSpring:34,laneDamping:10.8,laneSnap:.018,
      jumpImpulse:5.85,gravity:12.7,duckTime:.58,
      collisionZ:.885,hitInvuln:.76,hitSlow:.48,
      baseSpawn:.84,minSpawn:.46,
      boostMin:.34,boostSpeed:1.28,boostDurationMin:.72,boostDurationMax:1.55,
      branchRead:2.65,branchCooldown:.72,
      perfectWindow:.105,nearWindow:.11
    });
    const MINE_ASSET_ROOT='assets/reparty/minecart-v23-5/';
    const loadMineImage=src=>{const im=new Image();im.decoding='async';im.src=src;return im};
    const mineArt={
      backdrop:loadMineImage(MINE_ASSET_ROOT+'mine-backdrop.png'),foreground:loadMineImage(MINE_ASSET_ROOT+'mine-foreground.png'),
      cart:loadMineImage(MINE_ASSET_ROOT+'cart-atlas.png'),hazards:loadMineImage(MINE_ASSET_ROOT+'hazard-atlas.png'),routes:loadMineImage(MINE_ASSET_ROOT+'route-board-atlas.png'),speed:loadMineImage(MINE_ASSET_ROOT+'speed-overlay.png')
    };
    const atlasFrame=(img,frame,frames,x,y,dw,dh,alpha=1)=>{if(!img?.complete||!img.naturalWidth)return false;const sw=img.naturalWidth/frames,sh=img.naturalHeight;ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(img,sw*clamp(frame,0,frames-1),0,sw,sh,x-dw/2,y-dh/2,dw,dh);ctx.restore();return true};
    const masterVol=()=>{let v=.72;try{const n=document.querySelector('#masterVolume,#siteVolume,#repoVolume,[data-master-volume]');if(n&&'value'in n){const max=Number(n.max)||100;v=clamp((Number(n.value)||0)/max,0,1)}}catch(_){}return v};
    const mineClips={};
    ['lane','jump','duck','ore','gem','crystal','crash','boost','branch','cavein','near','finish'].forEach(name=>{const a=new Audio(MINE_ASSET_ROOT+name+'.ogg');a.preload='auto';mineClips[name]=a});
    const mineMusic=['normal','deep','final'].map(name=>{const a=new Audio(MINE_ASSET_ROOT+'music-'+name+'.ogg');a.preload='auto';a.loop=true;a.volume=0;return a});
    const wheelLoop=new Audio(MINE_ASSET_ROOT+'wheel.ogg');wheelLoop.preload='auto';wheelLoop.loop=true;wheelLoop.volume=0;
    let mineAudioStarted=false,musicDuck=0;
    const mineClip=(name,vol=1,rate=1)=>{const base=mineClips[name];if(!base)return false;try{const a=base.cloneNode();a.volume=clamp(masterVol()*vol,0,1);a.playbackRate=clamp(rate,.72,1.55);a.play().catch(()=>{});return true}catch(_){return false}};
    const startMineAudio=()=>{if(mineAudioStarted)return;mineAudioStarted=true;mineMusic.forEach(a=>{try{a.currentTime=0;a.play().catch(()=>{})}catch(_){}});try{wheelLoop.currentTime=0;wheelLoop.play().catch(()=>{})}catch(_){}};
    const updateMineAudio=(progress,finalRush)=>{startMineAudio();const m=masterVol()*(1-musicDuck*.58),deep=route==='DEEP CUT'?1:0,fin=finalRush?1:0,normal=fin?0:(1-deep*.72),deepVol=fin?0:deep;mineMusic[0].volume=lerp(mineMusic[0].volume,m*.17*normal,.08);mineMusic[1].volume=lerp(mineMusic[1].volume,m*.21*deepVol,.09);mineMusic[2].volume=lerp(mineMusic[2].volume,m*.25*fin,.11);const wheelTarget=m*(boostT>0?.14:.072)*(0.78+progress*.38);wheelLoop.volume=lerp(wheelLoop.volume,wheelTarget,.13);wheelLoop.playbackRate=clamp(.93+progress*.26+(boostT>0?.15:0),.9,1.36);musicDuck=Math.max(0,musicDuck-.04)};
    onCleanup(()=>{mineMusic.forEach(a=>{try{a.pause();a.currentTime=0;a.volume=0}catch(_){}});try{wheelLoop.pause();wheelLoop.currentTime=0;wheelLoop.volume=0}catch(_){}});

    let lane=0,targetLane=0,laneVel=0,jump=0,jumpV=0,duck=0;
    let objects=[],spawn=.55,patternCount=0,distance=0,scorePoints=0,hits=0,combo=0,bestCombo=0,perfects=0,nearMisses=0;
    let ore=0,gems=0,crystals=0,boostCharge=.22,boostT=0,boostPower=0,invuln=0,slowT=0,shake=0;
    let route='MAIN SHAFT',branchWindow=0,branchLock=.0,branchIndex=0,routeChoices=0,finalRush=false,routeFlash=0;
    let lastRank=3,lastShownRank=3,rankFlash=0,cue='',cueTone='good',cueUntil=0,boostReadyShown=false,finishCalled=false;
    const pathY=z=>lerp(h*.18,h*.84,z*z*.72+z*.28);
    const laneX=(l,z)=>w/2+l*(w*.235*z+18);
    const routeMeta=()=>route==='DEEP CUT'?{speed:1.08,spawn:1.12,mult:1.30,accent:'#d896ff',label:'DEEP CUT',risk:'HIGH RISK · HIGH REWARD'}:route==='SERVICE LINE'?{speed:.95,spawn:.90,mult:.88,accent:'#7ff0ad',label:'SERVICE LINE',risk:'SAFER · STEADIER'}:{speed:1,spawn:1,mult:1,accent:'#68ddff',label:'MAIN SHAFT',risk:'BALANCED'};
    const rivalNames=roster.filter(p=>!currentUser(p)).slice(0,5).map((p,i)=>({name:p.username,color:COLORS[(i+1)%COLORS.length],profile:botProfile(p.username),progress:rand(-2,4),lane:irand(-1,1),laneT:rand(.45,1.1),score:0}));
    const isPickup=t=>t==='ore'||t==='gem'||t==='crystal';
    const value=t=>t==='crystal'?12:t==='gem'?5:t==='ore'?1:0;
    const addObj=(type,l,z=.02,extra={})=>objects.push({type,lane:l,z,done:false,passed:false,spawnRoute:route,...extra});
    const laneOther=l=>choose([-1,0,1].filter(x=>x!==l));
    const laneThird=(a,b)=>[-1,0,1].find(x=>x!==a&&x!==b)??0;
    const setCue=(text,tone='good',seconds=1.25)=>{cue=text;cueTone=tone;cueUntil=performance.now()+seconds*1000};

    const spawnPickupTrail=(l,kind='ore',count=3,step=.115)=>{for(let i=0;i<count;i++)addObj(i===count-1&&kind==='ore'&&Math.random()<.28?'gem':kind,l,.02+i*step)};
    const spawnPattern=()=>{
      const p=activeProgress(),rm=routeMeta();patternCount++;
      if(p<.14){
        const l=irand(-1,1);if(patternCount%2){spawnPickupTrail(l,'ore',4,.105);setCue('FOLLOW THE GLOW','good',.9)}else{addObj('rock',l,.02,{cue:'JUMP OR SWITCH'});addObj('gem',l,.16);setCue('JUMP OR SWITCH','gold',1.05)}return;
      }
      let roll=Math.random();
      if(route==='SERVICE LINE')roll*=.88;
      if(route==='DEEP CUT')roll=Math.min(.999,roll+.08);
      if(finalRush&&Math.random()<.24){const l=irand(-1,1);addObj('crystal',l,.02);addObj('gem',l,.13);addObj('crystal',l,.24);setCue('PRISM RUN!','gold',1.05);return}
      if(roll<.16){const l=irand(-1,1);spawnPickupTrail(l,route==='DEEP CUT'?'gem':'ore',4,.10);setCue('CLEAN LINE','good',.8);return}
      if(roll<.31){const l=irand(-1,1);addObj('rock',l,.02,{cue:'JUMP'});addObj(route==='DEEP CUT'?'gem':'ore',l,.16);setCue('JUMP','gold',1.0);return}
      if(roll<.45){const l=irand(-1,1);addObj('beam',l,.02,{cue:'DUCK'});addObj(route==='DEEP CUT'?'gem':'ore',l,.16);setCue('DUCK','gold',1.0);return}
      if(roll<.58){const blocked=irand(-1,1),safe=laneOther(blocked);addObj('gap',blocked,.02,{cue:'SWITCH'});addObj('ore',safe,.08);addObj('gem',safe,.19);setCue('SWITCH RAILS','good',1.0);return}
      if(roll<.71){const a=irand(-1,1),b=laneOther(a),c=laneThird(a,b);addObj('rock',a,.02,{cue:'SLALOM'});addObj('gem',b,.13);addObj('beam',b,.25);addObj(route==='DEEP CUT'?'crystal':'gem',c,.37);setCue('SLALOM','great',1.1);return}
      if(roll<.83){const danger=irand(-1,1),rich=laneOther(danger),safe=laneThird(danger,rich);addObj('cart',danger,.02,{wobble:rand(0,Math.PI*2),cue:'DODGE'});addObj('gem',safe,.08);addObj(route==='DEEP CUT'?'crystal':'gem',rich,.19);setCue('PICK YOUR LINE','great',1.05);return}
      if(roll<.93){const l=irand(-1,1),safe=laneOther(l);addObj('rock',l,.02,{cue:boostT>0?'SMASH':'JUMP'});addObj('rock',laneThird(l,safe),.04);addObj(route==='DEEP CUT'?'crystal':'gem',safe,.18);setCue(boostCharge>=TUNE.boostMin?'BOOST OR SWITCH':'FIND THE GAP','gold',1.15);return}
      const safe=irand(-1,1);[-1,0,1].filter(l=>l!==safe).forEach((l,i)=>addObj(i?'beam':'gap',l,.02+i*.012,{cue:'SAFE LANE'}));addObj(route==='DEEP CUT'?'crystal':'gem',safe,.16);setCue('ONE SAFE LINE','great',1.1);
    };

    const beginBranch=()=>{
      if(branchWindow>0||finalRush)return;branchWindow=TUNE.branchRead;branchLock=TUNE.branchCooldown;objects=[];spawn=.95;routeFlash=.9;gameCallout('TRACK SPLIT','← SAFE · CENTRE BALANCED · RICH →','gold');mineClip('branch',.82);musicDuck=.25;cameraPunch(.15);
    };
    const lockRoute=()=>{
      const chosen=targetLane<0?'SERVICE LINE':targetLane>0?'DEEP CUT':'MAIN SHAFT';route=chosen;routeChoices++;branchWindow=0;branchLock=TUNE.branchCooldown;spawn=.9;routeFlash=.8;const m=routeMeta();gameCallout(m.label,m.risk,chosen==='DEEP CUT'?'gold':chosen==='SERVICE LINE'?'good':'great');mineClip('lane',.62,chosen==='DEEP CUT'?1.08:chosen==='SERVICE LINE'?.94:1);cameraPunch(.20);setCue(chosen==='DEEP CUT'?'RICH VEINS AHEAD':chosen==='SERVICE LINE'?'CLEANER TRACK':'BALANCED RUN',chosen==='DEEP CUT'?'gold':'good',1.2);
    };
    const doBoost=()=>{
      if(boostT>0||boostCharge<TUNE.boostMin)return;boostPower=boostCharge;boostCharge=0;boostT=lerp(TUNE.boostDurationMin,TUNE.boostDurationMax,boostPower);combo=Math.max(combo,1);boostReadyShown=false;mineClip('boost',.92,1+boostPower*.10);musicDuck=.14;cameraPunch(.22);activity(.08);setCue(boostPower>.78?'MAX BOOST!':'BOOST!','great',.8);
    };
    listen(window,'keydown',e=>{
      const k=e.key.toLowerCase();
      if((k==='arrowleft'||k==='a')&&!e.repeat){targetLane=clamp(targetLane-1,-1,1);activity(.03);startMineAudio();mineClip('lane',.30,.95);e.preventDefault()}
      if((k==='arrowright'||k==='d')&&!e.repeat){targetLane=clamp(targetLane+1,-1,1);activity(.03);startMineAudio();mineClip('lane',.30,1.04);e.preventDefault()}
      if((e.code==='Space'||k==='arrowup'||k==='w')&&!e.repeat&&jump<=.02){jumpV=TUNE.jumpImpulse;activity(.045);startMineAudio();mineClip('jump',.58);e.preventDefault()}
      if((k==='arrowdown'||k==='s')&&!e.repeat){duck=TUNE.duckTime;activity(.035);startMineAudio();mineClip('duck',.46);e.preventDefault()}
      if(k==='shift'&&!e.repeat){startMineAudio();doBoost();e.preventDefault()}
    },{passive:false});

    const hazardSafe=o=>{
      if(o.type==='beam')return duck>.10;
      if(o.type==='gap')return jump>.52;
      if(o.type==='rock')return jump>.34||boostT>0;
      if(o.type==='cart')return jump>.62||boostT>0;
      return false;
    };
    const collect=o=>{
      const rm=routeMeta(),base=value(o.type),boostMult=boostT>0?1.35:1,gain=Math.max(1,Math.round(base*rm.mult*boostMult));
      if(o.type==='ore')ore+=gain;else if(o.type==='gem')gems+=gain;else crystals+=gain;
      scorePoints+=gain;combo++;bestCombo=Math.max(bestCombo,combo);boostCharge=clamp(boostCharge+(o.type==='crystal'?.34:o.type==='gem'?.17:.055),0,1);
      if(o.type==='crystal'){mineClip('crystal',.88);musicDuck=.12;cameraPunch(.18);setCue('PRISM +12','gold',.7)}
      else if(o.type==='gem'){mineClip('gem',.56,1+Math.min(.16,combo*.006));scoreBurst(`+${gain}`,laneX(o.lane,o.z)/w*100,pathY(o.z)/h*100,'gold')}
      else mineClip('ore',.30,1+Math.min(.10,combo*.004));
      if(combo===5||combo===10||combo===15||combo===20){gameCallout(`FLOW x${combo}`,combo>=15?'BOOST BUILDS FAST':'KEEP THE CLEAN LINE',combo>=15?'great':'good')}
      activity(.022);
    };
    const clearHazard=o=>{
      const timing=Math.abs(o.z-TUNE.collisionZ),perfect=timing<TUNE.perfectWindow;
      combo++;bestCombo=Math.max(bestCombo,combo);boostCharge=clamp(boostCharge+(perfect?.10:.065),0,1);scorePoints+=perfect?3:2;
      if(boostT>0&&(o.type==='rock'||o.type==='cart')){scorePoints+=3;mineClip('near',.68,1.14);scoreBurst('SMASH!',laneX(o.lane,o.z)/w*100,67,'great');cameraPunch(.14)}
      else if(perfect){perfects++;mineClip('near',.56,1.06);scoreBurst('PERFECT',laneX(o.lane,o.z)/w*100,67,'great')}
      else if(combo%6===0)mineClip('near',.42,1.0);
    };
    const hitHazard=o=>{
      if(invuln>0)return;hits++;combo=0;invuln=TUNE.hitInvuln;slowT=TUNE.hitSlow;shake=.22;boostCharge=clamp(boostCharge-.18,0,1);scorePoints=Math.max(0,scorePoints-2);mineClip('crash',.82);musicDuck=.20;cameraPunch(.34);setCue(o.type==='beam'?'TOO HIGH!':o.type==='gap'?'MISSED THE JUMP!':'CLIPPED!','bad',.95);
    };

    loop((dt,t)=>{
      const p=activeProgress();roundClimax();if(!finalRush&&p>.79){finalRush=true;route='MAIN SHAFT';branchWindow=0;objects=[];spawn=.65;mineClip('finish',.78);musicDuck=.18;gameCallout('FINAL DESCENT','FASTER TRACK · MORE PRISMS · HOLD YOUR NERVE','gold');cameraPunch(.24)}if(!finishCalled&&gameSeconds()<1.8){finishCalled=true;mineClip('finish',.92,1.08);musicDuck=.24;gameCallout('FINISH LINE!','ONE LAST PUSH','great');cameraPunch(.20);setCue('FINISH!','gold',1.6)}
      if(branchIndex===0&&p>.27){branchIndex=1;beginBranch()}else if(branchIndex===1&&p>.57){branchIndex=2;beginBranch()}
      if(branchWindow>0){branchWindow-=dt;if(branchWindow<=0)lockRoute()}
      branchLock=Math.max(0,branchLock-dt);routeFlash=Math.max(0,routeFlash-dt);rankFlash=Math.max(0,rankFlash-dt);slowT=Math.max(0,slowT-dt);invuln=Math.max(0,invuln-dt);duck=Math.max(0,duck-dt);boostT=Math.max(0,boostT-dt);shake=Math.max(0,shake-dt);
      if(jump>0||jumpV>0){jumpV-=TUNE.gravity*dt;jump=Math.max(0,jump+jumpV*dt);if(jump<=0&&jumpV<0){jump=0;jumpV=0}}
      const err=targetLane-lane;laneVel+=err*TUNE.laneSpring*dt;laneVel*=Math.exp(-TUNE.laneDamping*dt);lane+=laneVel*dt;if(Math.abs(err)<TUNE.laneSnap&&Math.abs(laneVel)<.03){lane=targetLane;laneVel=0}lane=clamp(lane,-1.08,1.08);
      const rm=routeMeta(),speedRamp=lerp(.93,1.32,Math.pow(p,1.15)),slowMul=slowT>0?.72:1,boostMul=boostT>0?TUNE.boostSpeed:1,finalMul=finalRush?1.14:1,speed=rm.speed*speedRamp*slowMul*boostMul*finalMul;
      updateMineAudio(p,finalRush);distance+=dt*29*speed;
      if(!branchWindow&&branchLock<=0){spawn-=dt;const base=lerp(TUNE.baseSpawn,TUNE.minSpawn,Math.pow(p,1.08))/(rm.spawn*(finalRush?1.10:1));if(spawn<=0){spawn=base*rand(.90,1.12);spawnPattern()}}
      if(boostCharge>=.84&&!boostReadyShown&&boostT<=0){boostReadyShown=true;setCue('BOOST READY · SHIFT','great',1.2)}if(boostCharge<.70)boostReadyShown=false;
      for(const r of rivalNames){r.laneT-=dt;if(r.laneT<=0){r.laneT=rand(.48,1.05)*(1.08-r.profile.reaction*.15);r.lane=clamp(r.lane+choose([-1,0,1]),-1,1)}const form=.95+r.profile.reaction*.045+r.profile.risk*.018+rand(-.012,.012);r.progress+=dt*29*speedRamp*form;r.score=r.progress+Math.sin(t*.001+r.name.length)*1.2}
      const playerRace=distance+scorePoints*.65-hits*5.0;lastRank=1+rivalNames.filter(r=>r.score>playerRace).length;if(lastRank!==lastShownRank){if(lastRank<lastShownRank){setCue(`UP TO ${lastRank}${lastRank===1?'ST':lastRank===2?'ND':lastRank===3?'RD':'TH'}!`,'great',.8);rankFlash=.8}else if(lastRank>lastShownRank&&lastRank-lastShownRank>1){setCue(`DROPPED TO ${lastRank}TH`,'bad',.7);rankFlash=.6}lastShownRank=lastRank}
      for(const o of objects){
        o.z+=dt*(.34+distance/1500)*speed;if(o.z<=0||o.done)continue;
        const laneDelta=Math.abs(o.lane-lane),inWindow=o.z>TUNE.collisionZ-.09&&o.z<TUNE.collisionZ+.12;
        if(isPickup(o.type)&&boostT>0&&o.z>TUNE.collisionZ-.17&&o.z<TUNE.collisionZ+.14&&laneDelta<.72){o.done=true;collect(o);continue}
        if(inWindow&&laneDelta<.38){o.done=true;if(isPickup(o.type))collect(o);else if(hazardSafe(o))clearHazard(o);else hitHazard(o)}
        else if(!o.passed&&o.z>TUNE.collisionZ+.13){o.passed=true;if(!isPickup(o.type)&&laneDelta>=.38&&laneDelta<.58){nearMisses++;combo++;bestCombo=Math.max(bestCombo,combo);boostCharge=clamp(boostCharge+.03,0,1);scorePoints+=1;mineClip('near',.30,.96)}}
      }
      objects=objects.filter(o=>o.z<1.15&&!o.done);
      const normalized=clamp(distance*.19+scorePoints*2.25+perfects*1.6+nearMisses*.45+bestCombo*.58+routeChoices*.8-hits*6.8,0,100);setScore(Math.floor(distance+scorePoints*4),normalized,RP.participation);
    },t=>{
      const rm=routeMeta(),p=activeProgress();ctx.save();ctx.imageSmoothingEnabled=false;if(shake)ctx.translate(rand(-3,3)*shake*5,rand(-2,2)*shake*4);
      if(mineArt.backdrop.complete&&mineArt.backdrop.naturalWidth){const drift=(distance*.10)%16;ctx.drawImage(mineArt.backdrop,-6+lane*2,-6+drift*.08,w+12,h+12)}else drawMineTunnel(ctx,w,h,t,distance,laneX,pathY);
      // cleaner route tint: bottom-only, never across hazards
      const rg=ctx.createLinearGradient(0,h*.45,0,h);rg.addColorStop(0,'rgba(0,0,0,0)');rg.addColorStop(1,route==='DEEP CUT'?'rgba(145,73,188,.10)':route==='SERVICE LINE'?'rgba(62,181,112,.08)':'rgba(55,156,196,.06)');ctx.fillStyle=rg;ctx.fillRect(0,h*.45,w,h*.55);
      for(let i=0;i<6;i++){const z=((i/6)+(distance*.0058)%(.1666))%1;if(z<.08)continue;const y=pathY(z),spread=w*.37*z+45,sz=3+z*7;for(const side of[-1,1]){const x=w/2+side*spread;ctx.fillStyle='#ffbd55';ctx.fillRect(x-sz*.35,y-sz,sz*.7,sz*1.5)}}
      for(const l of[-1,0,1]){const active=Math.abs(l-targetLane)<.1;ctx.strokeStyle=active?'rgba(232,240,250,.80)':'rgba(112,127,148,.40)';ctx.lineWidth=active?3:2;ctx.beginPath();for(let i=0;i<=26;i++){const z=i/26,x=laneX(l,z),y=pathY(z);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()}
      if(boostT>0&&mineArt.speed.complete&&mineArt.speed.naturalWidth){ctx.save();ctx.globalAlpha=.26;ctx.drawImage(mineArt.speed,0,0,w,h);ctx.restore()}
      if(branchWindow>0){
        ctx.fillStyle='rgba(5,8,15,.94)';rounded(ctx,w*.17,h*.10,w*.66,112,10);ctx.fill();ctx.strokeStyle='#f1c95b';ctx.lineWidth=2;ctx.stroke();pxText(ctx,'CHOOSE YOUR TRACK',w*.5,h*.132,12,'#fff0a4');
        const cards=[{l:-1,title:'SAFE',sub:'SERVICE LINE',col:'#8ff0b0'},{l:0,title:'BALANCED',sub:'MAIN SHAFT',col:'#7de6ff'},{l:1,title:'RICH',sub:'DEEP CUT',col:'#dfa1ff'}];cards.forEach((c,i)=>{const x=w*(.29+i*.21),sel=Math.round(targetLane)===c.l;ctx.fillStyle=sel?'rgba(255,255,255,.08)':'rgba(255,255,255,.025)';rounded(ctx,x-74,h*.155,148,58,7);ctx.fill();ctx.strokeStyle=sel?c.col:'rgba(120,138,165,.45)';ctx.lineWidth=sel?2:1;ctx.stroke();pxText(ctx,c.title,x,h*.175,9,sel?'#fff8c8':c.col);pxText(ctx,c.sub,x,h*.197,6,'#b9c9df')});
        ctx.fillStyle='#252f44';ctx.fillRect(w*.37,h*.226,w*.26,5);ctx.fillStyle='#f1c95b';ctx.fillRect(w*.37,h*.226,w*.26*clamp(branchWindow/TUNE.branchRead,0,1),5);
      }
      // Rivals are intentionally quieter than hazards.
      rivalNames.forEach((r,i)=>{const rel=clamp(.53+(r.score-(distance+scorePoints*.65))*.009,.43,.70),x=laneX(r.lane,rel),y=pathY(rel),s=.48+rel*.30;drawShadow(ctx,x,y+9*s,15*s,4*s,.15);atlasFrame(mineArt.cart,(i+t/220|0)%3,6,x,y-3,48*s,36*s,.48)});
      let closest=null,closestD=99;
      for(const o of objects.slice().sort((a,b)=>a.z-b.z)){
        if(o.z<=0)continue;const z=o.z,x=laneX(o.lane,z),y=pathY(z),s=clamp(8+z*38,8,47);drawShadow(ctx,x,y+s*.50,s*.54,s*.14,.22);let used=false;if(isPickup(o.type)&&mineArt.hazards.complete&&mineArt.hazards.naturalWidth){const frame=o.type==='ore'?0:o.type==='gem'?1:2;ctx.save();ctx.translate(x,y);ctx.rotate(t*.0007+z*.45);used=atlasFrame(mineArt.hazards,frame,8,0,0,s*1.22,s*1.22);ctx.restore()}
        if(!used){
          if(o.type==='rock'){ctx.fillStyle='#6e4e43';ctx.beginPath();ctx.moveTo(x-s*.62,y+s*.35);ctx.lineTo(x-s*.44,y-s*.18);ctx.lineTo(x-s*.12,y-s*.58);ctx.lineTo(x+s*.18,y-s*.38);ctx.lineTo(x+s*.58,y+s*.28);ctx.closePath();ctx.fill();ctx.strokeStyle='#e19a68';ctx.lineWidth=2;ctx.stroke()}
          else if(o.type==='beam'){ctx.fillStyle='#8a5735';rounded(ctx,x-s*.78,y-s*.26,s*1.56,s*.44,3);ctx.fill();ctx.strokeStyle='#f0b36d';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#f4ca69';for(let k=-2;k<=2;k++)ctx.fillRect(x+k*s*.26-2,y-s*.26,4,s*.44)}
          else if(o.type==='gap'){ctx.fillStyle='#020309';ctx.beginPath();ctx.moveTo(x-s*.70,y-s*.15);ctx.lineTo(x+s*.70,y-s*.15);ctx.lineTo(x+s*.50,y+s*.54);ctx.lineTo(x-s*.50,y+s*.54);ctx.closePath();ctx.fill();ctx.strokeStyle='#ff8b72';ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='#d6d2d0';ctx.beginPath();ctx.moveTo(x-s*.62,y-s*.22);ctx.lineTo(x-s*.18,y+s*.04);ctx.moveTo(x+s*.62,y-s*.22);ctx.lineTo(x+s*.18,y+s*.04);ctx.stroke()}
          else if(o.type==='cart'){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*.008+(o.wobble||0))*.055);ctx.fillStyle='#823b46';rounded(ctx,-s*.58,-s*.34,s*1.16,s*.60,5);ctx.fill();ctx.strokeStyle='#ff8d96';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#181b25';ctx.beginPath();ctx.arc(-s*.34,s*.34,s*.14,0,Math.PI*2);ctx.arc(s*.34,s*.34,s*.14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e3a84a';ctx.fillRect(-s*.38,-s*.08,s*.76,s*.12);ctx.restore()}
          else{ctx.fillStyle='#70555f';rounded(ctx,x-s*.55,y-s*.65,s*1.1,s*1.1,5);ctx.fill()}
        }
        if(isPickup(o.type)){if(o.type!=='ore')drawSpark(ctx,x,y-s*.50,t/1000,o.type==='crystal'?'#d8ffff':'#ead8ff')}else if(z>.45&&z<.82){const col=o.type==='beam'?'#ffbe75':o.type==='gap'?'#ff8c72':o.type==='cart'?'#ff7c86':'#ffad72';ctx.strokeStyle=col;ctx.globalAlpha=.48;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,s*.70,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1}
                const d=Math.abs(z-.68)+Math.abs(o.lane-targetLane)*.28;if(!isPickup(o.type)&&z>.40&&z<.82&&d<closestD){closest=o;closestD=d}
      }
      if(closest&&branchWindow<=0){const action=closest.type==='beam'?'DUCK':closest.type==='gap'?'JUMP':closest.type==='rock'?(boostT>0?'SMASH':'JUMP / SWITCH'):closest.type==='cart'?(boostT>0?'SMASH':'JUMP / SWITCH'):'MOVE';const x=laneX(closest.lane,.70),y=pathY(.70)-54;ctx.fillStyle='rgba(8,12,22,.82)';rounded(ctx,x-48,y-12,96,25,6);ctx.fill();pxText(ctx,action,x,y-1,7,'#fff1b0')}
      const px=laneX(lane,1),py=h*.82-jump*54,lean=clamp(-laneVel*.10,-.18,.18);drawShadow(ctx,px,h*.867,39,10,.42);ctx.save();ctx.translate(px,py);ctx.rotate(lean+(boostT>0?Math.sin(t*.03)*.012:0));const cartFrame=boostT>0?5:duck>0?4:jump>.12?3:lean<-.045?1:lean>.045?2:0;const drawn=atlasFrame(mineArt.cart,cartFrame,6,0,-7,92,69,invuln>0&&Math.floor(t/70)%2?.50:1);if(!drawn){ctx.fillStyle=rm.accent;rounded(ctx,-34,-16,68,31,7);ctx.fill()}if(boostT>0){ctx.fillStyle='#8ef5ff';ctx.fillRect(-42,3,13,3);ctx.fillRect(-50,-2,20,2)}ctx.restore();pxText(ctx,'YOU',px,py-57,8,'#fff4b0');
      if(mineArt.foreground.complete&&mineArt.foreground.naturalWidth){ctx.save();ctx.globalAlpha=.86;ctx.drawImage(mineArt.foreground,0,0,w,h);ctx.restore()}
      // HUD: fewer boxes, stronger hierarchy.
      ctx.fillStyle='rgba(5,10,20,.78)';rounded(ctx,12,12,174,46,8);ctx.fill();ctx.strokeStyle=rankFlash>0?'#ffe078':'#43577a';ctx.stroke();pxText(ctx,'POSITION',24,22,6,'#8ea7c8','left');pxText(ctx,`${lastRank}/6`,24,38,15,lastRank===1?'#ffe078':'#eaf3ff','left');pxText(ctx,'SCORE',94,22,6,'#8ea7c8','left');pxText(ctx,Math.floor(distance+scorePoints*4),94,39,12,'#9af0ad','left');
      ctx.fillStyle='rgba(5,10,20,.74)';rounded(ctx,w-174,12,162,46,8);ctx.fill();ctx.strokeStyle=rm.accent;ctx.stroke();pxText(ctx,rm.label,w-93,25,8,rm.accent);pxText(ctx,`FLOW x${combo}`,w-93,43,7,combo>=10?'#ffe078':'#d8e6f5');
      const barX=w*.34,barW=w*.32;ctx.fillStyle='rgba(8,14,27,.85)';rounded(ctx,barX,18,barW,19,9);ctx.fill();ctx.fillStyle=boostCharge>=TUNE.boostMin?'#67e9ff':'#53647e';rounded(ctx,barX+3,21,(barW-6)*boostCharge,13,6);ctx.fill();pxText(ctx,boostT>0?'BOOSTING':boostCharge>=TUNE.boostMin?'SHIFT = BOOST':`BOOST ${Math.round(boostCharge*100)}%`,barX+barW/2,27,6,'#eaf7ff');
      ctx.fillStyle='rgba(18,27,43,.78)';ctx.fillRect(w*.26,h-35,w*.48,5);ctx.fillStyle=finalRush?'#ffbf62':rm.accent;ctx.fillRect(w*.26,h-35,w*.48*p,5);if(finalRush)pxText(ctx,'FINAL DESCENT',w*.5,70,9,'#ffcf7a');if(performance.now()<cueUntil)pxText(ctx,cue,w*.5,h*.115,10,cueTone==='bad'?'#ff9ca8':cueTone==='gold'?'#ffe078':cueTone==='great'?'#8ff5ff':'#9af0ad');pxText(ctx,'← → RAILS    SPACE JUMP    ↓ DUCK    SHIFT BOOST',w/2,h-17,7,'#d2e2f4');ctx.restore();
    });
    if(window.__REPARTY_QA__)window.__REPARTY_MINECART_DIAGNOSTICS__={assets:()=>Object.fromEntries(Object.entries(mineArt).map(([k,img])=>[k,Boolean(img.complete&&img.naturalWidth)])),audio:()=>({started:mineAudioStarted,clips:Object.keys(mineClips),music:mineMusic.map(a=>({src:a.src,paused:a.paused,volume:a.volume})),wheel:{paused:wheelLoop.paused,volume:wheelLoop.volume,rate:wheelLoop.playbackRate}}),tuning:()=>({...TUNE}),state:()=>({lane,targetLane,jump,duck,route,branchWindow,finalRush,boostCharge,boostT,combo,bestCombo,hits,lastRank,objects:objects.map(o=>({type:o.type,lane:o.lane,z:o.z}))})};
  }
  function gameRooftop(){
    const {ctx,w,h}=canvasEnv();
    const MAIN_Y=h*.765, UPPER_Y=h*.585;
    const player={x:145,y:MAIN_Y,vy:0,vx:0,groundY:MAIN_Y,duck:0,slide:0,dash:0,dashCd:0,coyote:.12,jumpBuffer:0,stumble:0,invuln:0,route:'MAIN',routeBlend:0};
    let obstacles=[],patternTimer=.95,distanceRun=0,hits=0,coins=0,scorePoints=0,combo=0,bestCombo=0,flow=0,perfects=0,nearMisses=0,shortcuts=0,recoveries=0,shake=0,finalSprint=false,finalAnnounced=false,routeT=0,routeCooldown=0,focusT=0,rank=3,lastRank=3,cue='',cueTone='good',cueUntil=0;
    const rivals=contestantList().filter(q=>!currentUser(q)).slice(0,5).map((q,i)=>({name:q.username,score:rand(2,7)+i*.35,pace:rand(.93,1.07),lane:i%2,phase:rand(0,Math.PI*2),color:COLORS[(i+1)%COLORS.length]}));
    const patterns=[
      {name:'HOP',items:[['crate',0],['coin',105],['coin',142],['coin',178]]},
      {name:'SLIDE',items:[['line',0],['coin',110],['coin',148]]},
      {name:'GAP',items:[['gap',0],['coin',125],['coin',160],['coin',195]]},
      {name:'VAULT',items:[['crate',0],['crate',118],['coin',62],['coin',180]]},
      {name:'VENT',items:[['vent',0],['coin',82],['line',162]]},
      {name:'CRUMBLE',items:[['crumble',0],['coin',138],['crate',214]]},
      {name:'SHORTCUT',items:[['ramp',0],['coin',95],['coin',135],['coin',175]]},
      {name:'RHYTHM',items:[['crate',0],['line',118],['gap',250]]}
    ];
    const upperPatterns=[
      {name:'SKYLINE',items:[['chimney',0],['coin',80],['gap',164],['coin',285]]},
      {name:'AWNINGS',items:[['banner',0],['coin',112],['chimney',210],['coin',286]]},
      {name:'HIGH RISK',items:[['gap',0],['coin',118],['coin',156],['banner',245]]}
    ];
    const setCue=(a,tone='good',sec=.8)=>{cue=a;cueTone=tone;cueUntil=performance.now()+sec*1000};
    const activeGround=()=>player.route==='UPPER'?UPPER_Y:MAIN_Y;
    const onGround=()=>Math.abs(player.y-player.groundY)<1.5&&Math.abs(player.vy)<18&&player.stumble<=0;
    const jump=()=>{if(player.stumble>0)return;if(onGround()||player.coyote>0){player.vy=-535*(1+Math.min(.08,flow*.0025));player.coyote=0;player.jumpBuffer=0;activity(.06);playTone(520,.028,.014,'triangle')}};
    const doDash=()=>{if(player.dashCd>0||player.stumble>0)return;player.dash=.18;player.dashCd=1.28;player.vx+=145;activity(.05);playTone(720,.025,.012,'sawtooth');setCue('BURST','great',.45)};
    listen(window,'keydown',e=>{
      if(e.repeat&&['Space','ArrowUp','KeyW','ShiftLeft','ShiftRight'].includes(e.code))return;
      if(e.code==='Space'||e.key==='ArrowUp'||e.key==='w'){player.jumpBuffer=.14;jump();e.preventDefault()}
      if(e.key==='ArrowDown'||e.key==='s'){player.duck=.50;player.slide=.34;activity(.035);e.preventDefault()}
      if(e.key==='Shift'||e.code==='ShiftLeft'||e.code==='ShiftRight'){doDash();e.preventDefault()}
    },{passive:false});
    const spawn=(type,offset=0)=>{const widths={gap:108,crumble:92,ramp:70,line:84,banner:92,crate:38,chimney:42,vent:42,coin:20};obstacles.push({x:w+80+offset,type,w:widths[type]||36,hit:false,passed:false,route:player.route,warning:0,active:true})};
    const choosePattern=()=>{
      const pool=player.route==='UPPER'?upperPatterns:patterns.filter(p=>routeCooldown<=0||p.name!=='SHORTCUT');
      const p=choose(pool);p.items.forEach(([type,off])=>spawn(type,off));if(p.name==='SHORTCUT')routeCooldown=4.5;
    };
    const enterShortcut=()=>{if(player.route==='UPPER')return;player.route='UPPER';routeT=4.7;shortcuts++;flow+=3;combo+=2;scorePoints+=5;player.vy=-255;player.y=MAIN_Y-26;gameCallout('SKYLINE SHORTCUT!','FASTER · RISKIER · BETTER SCORE','great');setCue('UPPER ROUTE','great',1.1);cameraPunch(.24);playTone(840,.05,.018,'triangle')};
    const leaveShortcut=()=>{if(player.route!=='UPPER')return;player.route='MAIN';player.y=Math.min(player.y,MAIN_Y-35);player.vy=80;setCue('BACK TO MAIN ROOF','good',.7)};
    const cleanAction=(label='CLEAN')=>{combo++;bestCombo=Math.max(bestCombo,combo);flow=clamp(flow+1.35,0,100);scorePoints+=1.8;if(combo%5===0){setCue(`FLOW x${combo}`,'great',.8);playTone(680,.035,.012,'triangle')}if(label==='PERFECT'){perfects++;scorePoints+=2.3;flow=clamp(flow+2.2,0,100);setCue('PERFECT LANDING','gold',.7);sfx('good')}};
    const stumble=(reason='CLIPPED!')=>{if(player.invuln>0)return;hits++;combo=0;flow=Math.max(0,flow-14);player.stumble=.58;player.invuln=.85;player.vx=-55;shake=.28;distanceRun=Math.max(0,distanceRun-5);setCue(reason,'bad',.85);cameraPunch(.32);playTone(120,.08,.025,'square')};
    const fallRecovery=()=>{if(player.invuln>0)return;hits++;recoveries++;combo=0;flow=Math.max(0,flow-22);player.invuln=1.0;player.stumble=.74;player.y=player.groundY-92;player.vy=-135;player.vx=-80;setCue('LEDGE SAVE!','bad',1.0);gameCallout('LEDGE SAVE!','YOU CLIMB BACK UP — KEEP MOVING','bad');cameraPunch(.42);playTone(92,.13,.025,'sawtooth')};
    const collide=(o)=>{
      if(o.hit||!o.active)return;
      const dx=o.x-player.x,overlap=dx<30&&dx+o.w>-28;if(!overlap)return;
      const grounded=onGround(),feet=player.y,airHigh=player.y<player.groundY-48;
      if(o.type==='coin'){
        if(Math.abs(player.y-(player.groundY-52))<95){o.hit=true;coins++;scorePoints+=2;flow=clamp(flow+1.1,0,100);sfx('gold');setCue(coins%5===0?'COIN STREAK!':'+COIN',coins%5===0?'gold':'good',.42)}
        return;
      }
      if(o.type==='ramp'){
        if(!o.hit&&player.route==='MAIN'&&dx<24&&dx>-44){o.hit=true;if(player.vy<80||!grounded)enterShortcut();else{setCue('JUMP THE RAMP','bad',.65)}}return;
      }
      if(player.invuln>0)return;
      let safe=false;
      if(o.type==='crate'||o.type==='chimney'||o.type==='vent')safe=airHigh||player.vy<-65;
      else if(o.type==='line'||o.type==='banner')safe=player.duck>0||player.slide>0||airHigh;
      else if(o.type==='gap'||o.type==='crumble')safe=!grounded||player.vy<-40;
      if(safe){if(!o.passed){o.passed=true;const tight=Math.abs(dx)<18;if(tight){nearMisses++;scorePoints+=1.2;setCue(o.type==='line'||o.type==='banner'?'SLIDE!':'NICE!','great',.42)}cleanAction()}return}
      o.hit=true;if(o.type==='gap'||o.type==='crumble')fallRecovery();else stumble(o.type==='line'||o.type==='banner'?'TOO TALL!':'CLIPPED!');
    };
    loop((dt,t)=>{
      const progress=activeProgress();
      const {dx}=directional();
      if(player.jumpBuffer>0){player.jumpBuffer=Math.max(0,player.jumpBuffer-dt);if((onGround()||player.coyote>0)&&player.jumpBuffer>0)jump()}
      player.duck=Math.max(0,player.duck-dt);player.slide=Math.max(0,player.slide-dt);player.dash=Math.max(0,player.dash-dt);player.dashCd=Math.max(0,player.dashCd-dt);player.stumble=Math.max(0,player.stumble-dt);player.invuln=Math.max(0,player.invuln-dt);routeCooldown=Math.max(0,routeCooldown-dt);routeT=Math.max(0,routeT-dt);focusT=Math.max(0,focusT-dt);shake=Math.max(0,shake-dt);
      if(player.route==='UPPER'&&routeT<=0)leaveShortcut();
      const targetGround=activeGround();player.groundY=lerp(player.groundY,targetGround,clamp(dt*7,0,1));
      if(player.stumble<=0){const accel=dx>0?780:dx<0?-620:-player.vx*5.2;player.vx+=accel*dt;const maxV=player.dash>0?245:150;player.vx=clamp(player.vx,-100,maxV);player.x=clamp(player.x+player.vx*dt,88,285)}else player.x=clamp(player.x+player.vx*dt,88,285);
      player.vy+=1120*dt;player.y+=player.vy*dt;if(player.y>=player.groundY){const landingVy=player.vy;player.y=player.groundY;player.vy=0;player.coyote=.12;if(landingVy>70&&landingVy<250&&player.stumble<=0){cleanAction(landingVy<155?'PERFECT':'CLEAN')}else if(landingVy>390){flow=Math.max(0,flow-3)}}else player.coyote=Math.max(0,player.coyote-dt);
      const flowSpeed=clamp(flow/100,0,1),sprint=dx>0?.06:dx<0?-.05:0,routeBonus=player.route==='UPPER'?.10:0,dashBonus=player.dash>0?.12:0;
      const speed=(270+progress*70)*(1+flowSpeed*.11+sprint+routeBonus+dashBonus)*(finalSprint?1.14:1);
      distanceRun+=speed*dt/8.8;
      if(flow>=72&&focusT<=0){focusT=1.25;setCue('FLOW STATE','gold',.8)}
      patternTimer-=dt;if(patternTimer<=0){choosePattern();patternTimer=(player.route==='UPPER'?1.65:1.88)/difficultyRamp(1,1.24)*(finalSprint?.83:1)}
      for(const o of obstacles){o.x-=speed*dt;collide(o);if(!o.passed&&o.x+o.w<player.x-38){o.passed=true;if(!o.hit&&!['coin','ramp'].includes(o.type))cleanAction()} }
      obstacles=obstacles.filter(o=>o.x>-190&&!((o.type==='coin'||o.type==='ramp')&&o.hit&&o.x<player.x-80));
      rivals.forEach((r,i)=>{r.score+=dt*(speed/9.3)*r.pace*(.96+Math.sin(t*.00045+r.phase)*.035)});
      const playerRace=distanceRun+scorePoints*.9+flow*.08-hits*4.5;rank=1+rivals.filter(r=>r.score>playerRace).length;if(rank!==lastRank){if(rank<lastRank)setCue(`UP TO ${rank}${rank===1?'ST':rank===2?'ND':rank===3?'RD':'TH'}!`,'great',.7);lastRank=rank}
      if(!finalAnnounced&&gameSeconds()<7.2){finalAnnounced=true;finalSprint=true;gameCallout('FINAL SPRINT!','KEEP THE FLOW · EVERYTHING SPEEDS UP','gold');cameraPunch(.28);playTone(900,.06,.018,'triangle')}
      const norm=clamp(distanceRun*.23+scorePoints*1.65+bestCombo*1.3+perfects*1.1+nearMisses*.8+shortcuts*3+coins*1.3+Math.max(0,7-rank)*1.4-hits*6.5,0,100);setScore(Math.floor(distanceRun+scorePoints*3+coins*4),norm,RP.participation);
    },t=>{
      ctx.save();if(shake)ctx.translate(rand(-4,4)*shake*4,rand(-2,2)*shake*2);drawCityRooftops(ctx,w,h,t,distanceRun,MAIN_Y);
      if(player.route==='UPPER'){ctx.fillStyle='rgba(89,202,255,.055)';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(130,230,255,.22)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,UPPER_Y+18);ctx.lineTo(w,UPPER_Y+18);ctx.stroke();pxText(ctx,'UPPER SKYLINE',w*.5,72,8,'#8feaff')}
      if(finalSprint){const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,126,85,.08)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);pxText(ctx,'FINAL SPRINT',w*.5,74,10,'#ffd07a')}
      // Quiet rival silhouettes on a background roof, enough to sell the race without obscuring hazards.
      rivals.forEach((r,i)=>{const rel=clamp(.5+(r.score-(distanceRun+scorePoints*.9))*0.012,.16,.88),rx=w*.18+rel*w*.66,ry=MAIN_Y-108-(i%2)*22;drawShadow(ctx,rx,ry+19,13,4,.14);ctx.globalAlpha=.34;drawCharacter(ctx,{name:r.name},rx,ry,{color:r.color,scale:.42,label:false});ctx.globalAlpha=1});
      obstacles.forEach(o=>{const gy=o.route==='UPPER'?UPPER_Y:MAIN_Y;if(o.route!==player.route&&Math.abs(o.x-player.x)<210)ctx.globalAlpha=.35;else ctx.globalAlpha=1;
        if(o.type==='crate'||o.type==='chimney'){ctx.fillStyle=o.type==='chimney'?'#565866':'#875332';rounded(ctx,o.x-19,gy-(o.type==='chimney'?48:34),38,o.type==='chimney'?48:34,4);ctx.fill();ctx.strokeStyle=o.type==='chimney'?'#9da1b0':'#c68a53';ctx.stroke();if(o.type==='chimney'){ctx.fillStyle='rgba(210,220,235,.22)';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(o.x+Math.sin(t*.002+k)*8,gy-58-k*10,7+k*2,0,Math.PI*2);ctx.fill()}}}
        else if(o.type==='line'||o.type==='banner'){ctx.strokeStyle=o.type==='banner'?'#f4d36b':'#d8d0c7';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(o.x-44,gy-50);ctx.lineTo(o.x+44,gy-50);ctx.stroke();ctx.fillStyle=o.type==='banner'?'#b94d6b':'#e27582';ctx.fillRect(o.x-18,gy-58,36,14)}
        else if(o.type==='gap'||o.type==='crumble'){ctx.fillStyle='#04060b';ctx.fillRect(o.x,gy+5,o.w,h-gy);ctx.strokeStyle=o.type==='crumble'?'#f19a5b':'#ffbd60';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(o.x,gy+4);ctx.lineTo(o.x+o.w,gy+4);ctx.stroke();if(o.type==='crumble'){ctx.strokeStyle='#8b5d52';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(o.x+i*o.w/4,gy-8);ctx.lineTo(o.x+10+i*o.w/4,gy+5);ctx.stroke()}}}
        else if(o.type==='vent'){ctx.fillStyle='#525867';ctx.fillRect(o.x-20,gy-30,40,30);ctx.fillStyle='#8b94a4';ctx.fillRect(o.x-24,gy-35,48,7);ctx.fillStyle='rgba(210,235,255,.22)';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(o.x+Math.sin(t*.003+k)*7,gy-48-k*10,6+k*2,0,Math.PI*2);ctx.fill()}}
        else if(o.type==='ramp'){ctx.fillStyle='#8d6b4c';ctx.beginPath();ctx.moveTo(o.x-34,gy);ctx.lineTo(o.x+36,gy);ctx.lineTo(o.x+36,gy-38);ctx.closePath();ctx.fill();ctx.strokeStyle='#f0c36b';ctx.lineWidth=2;ctx.stroke();pxText(ctx,'UPPER',o.x,gy-50,6,'#ffe078')}
        else if(o.type==='coin'){ctx.fillStyle='#ffd75f';ctx.beginPath();ctx.arc(o.x,gy-54,9,0,Math.PI*2);ctx.fill();drawSpark(ctx,o.x,gy-54,t/1000,'#fff0a0')}
        ctx.globalAlpha=1;
      });
      // Context action prompt: one instruction only, near the threat.
      const threat=obstacles.filter(o=>!o.hit&&o.route===player.route&&o.x>player.x+30&&o.x<player.x+260&&!['coin','ramp'].includes(o.type)).sort((a,b)=>a.x-b.x)[0];
      if(threat){const action=threat.type==='line'||threat.type==='banner'?'SLIDE':threat.type==='gap'||threat.type==='crumble'?'JUMP':'JUMP';const gy=threat.route==='UPPER'?UPPER_Y:MAIN_Y;ctx.fillStyle='rgba(7,11,21,.82)';rounded(ctx,threat.x-42,gy-94,84,25,6);ctx.fill();pxText(ctx,action,threat.x,gy-82,7,'#fff0a6')}
      const py=player.y-(player.duck>0?4:20);drawShadow(ctx,player.x,player.groundY+18,20,5,.34);const lean=clamp(player.vx/260,-.14,.18);ctx.save();ctx.translate(player.x,py);ctx.rotate(lean);if(player.dash>0){ctx.fillStyle='rgba(102,229,255,.25)';ctx.fillRect(-48,-2,33,5);ctx.fillRect(-58,8,43,3)}ctx.fillStyle=player.invuln>0&&Math.floor(t/70)%2?'#fff':player.stumble>0?'#ff8795':'#64e2f0';rounded(ctx,-13,-18,26,player.duck>0?22:35,5);ctx.fill();ctx.fillStyle='#f0d4bd';rounded(ctx,-10,-31,20,14,4);ctx.fill();if(player.duck<=0){ctx.strokeStyle='#64e2f0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,15);ctx.lineTo(-17,26);ctx.moveTo(7,15);ctx.lineTo(17,26);ctx.stroke()}ctx.restore();pxText(ctx,player.stumble>0?'RECOVER':'YOU',player.x,py-44,8,player.stumble>0?'#ffb0b8':'#fff0a6');
      // Clean HUD hierarchy.
      ctx.fillStyle='rgba(5,10,20,.78)';rounded(ctx,12,12,168,46,8);ctx.fill();ctx.strokeStyle=rank===1?'#ffe078':'#42577b';ctx.stroke();pxText(ctx,'POSITION',24,22,6,'#8ea7c8','left');pxText(ctx,`${rank}/6`,24,39,15,rank===1?'#ffe078':'#eaf3ff','left');pxText(ctx,'SCORE',94,22,6,'#8ea7c8','left');pxText(ctx,Math.floor(distanceRun+scorePoints*3+coins*4),94,39,11,'#9af0ad','left');
      ctx.fillStyle='rgba(5,10,20,.74)';rounded(ctx,w-175,12,163,46,8);ctx.fill();ctx.strokeStyle=player.route==='UPPER'?'#8feaff':'#ff8cad';ctx.stroke();pxText(ctx,player.route==='UPPER'?'UPPER ROUTE':'MAIN ROOF',w-93,25,8,player.route==='UPPER'?'#8feaff':'#ff9db9');pxText(ctx,`FLOW x${combo}`,w-93,43,7,combo>=10?'#ffe078':'#d8e6f5');
      const barX=w*.34,barW=w*.32;ctx.fillStyle='rgba(8,14,27,.85)';rounded(ctx,barX,18,barW,19,9);ctx.fill();ctx.fillStyle=flow>70?'#ffe078':'#64e7ff';rounded(ctx,barX+3,21,(barW-6)*clamp(flow/100,0,1),13,6);ctx.fill();pxText(ctx,`FLOW ${Math.round(flow)}%`,barX+barW/2,27,6,'#eaf7ff');
      ctx.fillStyle='rgba(18,27,43,.78)';ctx.fillRect(w*.25,h-35,w*.50,5);ctx.fillStyle=finalSprint?'#ffbf62':'#64e7ff';ctx.fillRect(w*.25,h-35,w*.50*activeProgress(),5);
      if(performance.now()<cueUntil)pxText(ctx,cue,w*.5,h*.12,10,cueTone==='bad'?'#ff9ca8':cueTone==='gold'?'#ffe078':'#8ff5ff');
      pxText(ctx,'← → PACE / POSITION   SPACE JUMP   ↓ SLIDE   SHIFT BURST',w/2,h-17,7,'#d2e2f4');ctx.restore();
    });
    if(window.__REPARTY_QA__)window.__REPARTY_ROOFTOP_DIAGNOSTICS__={state:()=>({route:player.route,routeT,flow,combo,bestCombo,hits,coins,rank,finalSprint,distanceRun,obstacles:obstacles.map(o=>({type:o.type,x:o.x,route:o.route,hit:o.hit}))})};
  }

  function gameChicken(){
    const {ctx,w,h}=canvasEnv();
    let player={x:w*.5,y:h*.62,dir:0,netPhase:0,netT:0,dash:0,dashCd:0,stun:0},score=0,combo=0,best=0,dust=[],goldSpawn=7;
    const mud=[{x:w*.64,y:h*.72,rx:72,ry:28},{x:w*.31,y:h*.46,rx:54,ry:22}],hay=[{x:w*.20,y:h*.70,w:48,h:34},{x:w*.78,y:h*.43,w:52,h:36}];
    const makeBird=(forceGold=false)=>{const r=Math.random(),type=forceGold?'gold':r<.08?'rooster':r<.20?'fast':r<.36?'heavy':'normal';const cfg={normal:{sp:82,val:1,size:1,fear:1},fast:{sp:125,val:3,size:.9,fear:1.35},heavy:{sp:58,val:4,size:1.3,fear:.72},gold:{sp:112,val:8,size:1.0,fear:1.55},rooster:{sp:96,val:0,size:1.12,fear:.25}}[type];return{x:rand(65,w-65),y:rand(80,h-55),vx:rand(-35,35),vy:rand(-35,35),type,cfg,caught:0,brain:rand(.1,.7),turn:rand(.2,.7),charge:rand(1.5,3.2)}};
    let birds=Array.from({length:13},()=>makeBird(false));
    const bots=contestantList().filter(p=>!currentUser(p)).slice(0,5).map((p,i)=>({name:p.username,x:75+i*(w-150)/4,y:95+Math.sin(i)*18,target:irand(0,12),color:COLORS[(i+1)%COLORS.length],score:0,profile:botProfile(p.username),swing:0,think:rand(.2,.6)}));
    const startNet=()=>{if(player.netPhase||player.stun>0)return;player.netPhase=1;player.netT=.13;activity(.07);playTone(360,.025,.012,'triangle')};
    listen(window,'keydown',e=>{if(e.code==='Space'){startNet();e.preventDefault()}if(e.key==='Shift'&&player.dashCd<=0&&player.stun<=0){player.dash=.18;player.dashCd=1.35;activity(.06);e.preventDefault()}},{passive:false});
    const respawnBird=b=>Object.assign(b,makeBird(Math.random()<.055+activeProgress()*.025));
    loop((dt,t)=>{
      const ramp=difficultyRamp(1,1.3);player.stun=Math.max(0,player.stun-dt);player.dash=Math.max(0,player.dash-dt);player.dashCd=Math.max(0,player.dashCd-dt);goldSpawn-=dt;if(goldSpawn<=0){goldSpawn=rand(8,12);const candidate=birds.find(b=>b.type!=='rooster');if(candidate){Object.assign(candidate,makeBird(true));gameCallout('GOLDEN CHICKEN!','BIG VALUE · FAST FEET','gold')}}
      if(player.netPhase){player.netT-=dt;if(player.netT<=0){if(player.netPhase===1){player.netPhase=2;player.netT=.11}else if(player.netPhase===2){player.netPhase=3;player.netT=.27}else{player.netPhase=0;player.netT=0}}}
      const {dx,dy}=directional();let slow=1;for(const m of mud)if(Math.hypot((player.x-m.x)/m.rx,(player.y-m.y)/m.ry)<1)slow=.53;const sp=(player.dash>0?345:185)*slow;if(player.stun<=0&&(dx||dy)){activity(.004);player.x=clamp(player.x+dx*sp*dt,45,w-45);player.y=clamp(player.y+dy*sp*dt,58,h-40);player.dir=Math.atan2(dy,dx)}
      // hay bales act as simple blockers and create herding corners
      hay.forEach(ob=>{const nx=clamp(player.x,ob.x,ob.x+ob.w),ny=clamp(player.y,ob.y,ob.y+ob.h);if(Math.hypot(player.x-nx,player.y-ny)<18){player.x+=player.x<(ob.x+ob.w/2)?-38*dt:38*dt;player.y+=player.y<(ob.y+ob.h/2)?-38*dt:38*dt}});
      for(const b of birds){b.caught=Math.max(0,b.caught-dt);b.turn-=dt;b.charge-=dt;if(b.turn<=0){b.turn=rand(.24,.72);b.vx+=rand(-42,42);b.vy+=rand(-42,42)}
        // flee the nearest contestant; this makes herding into fences/corners possible
        const threats=[{x:player.x,y:player.y},...bots];let near=threats[0],nd=1e9;for(const q of threats){const d=Math.hypot(b.x-q.x,b.y-q.y);if(d<nd){nd=d;near=q}}if(nd<165&&b.type!=='rooster'){b.vx+=(b.x-near.x)/Math.max(1,nd)*b.cfg.sp*b.cfg.fear*2.4*dt;b.vy+=(b.y-near.y)/Math.max(1,nd)*b.cfg.sp*b.cfg.fear*2.4*dt}
        if(b.type==='rooster'&&b.charge<=0){b.charge=rand(2.2,3.8);const d=Math.max(1,Math.hypot(player.x-b.x,player.y-b.y));b.vx+=(player.x-b.x)/d*190;b.vy+=(player.y-b.y)/d*190}
        const max=b.cfg.sp*ramp;b.vx=clamp(b.vx,-max,max);b.vy=clamp(b.vy,-max,max);b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.x<48||b.x>w-48){b.vx*=-1;b.x=clamp(b.x,48,w-48)}if(b.y<62||b.y>h-42){b.vy*=-1;b.y=clamp(b.y,62,h-42)}
        const d=Math.hypot(b.x-player.x,b.y-player.y),angle=Math.atan2(b.y-player.y,b.x-player.x),da=Math.atan2(Math.sin(angle-player.dir),Math.cos(angle-player.dir));if(player.netPhase===2&&b.caught<=0&&d<76&&Math.abs(da)<1.05){if(b.type==='rooster'){b.vx*=-1;b.vy*=-1;gameCallout('ROOSTER DEFLECTED!','NICE NET WORK','great');combo++}else{b.caught=.7;const gain=b.cfg.val+Math.min(4,Math.floor(combo/4));score+=gain;combo++;best=Math.max(best,combo);dust.push({x:b.x,y:b.y,t:0,gold:b.type==='gold'});gameCallout(b.type==='gold'?'GOLDEN CHICKEN!':b.type==='fast'?'FAST CHICKEN!':b.type==='heavy'?'HEAVY CATCH!':'CAUGHT!',`+${gain} · COMBO x${combo}`,b.type==='gold'?'gold':combo%5===0?'great':'good');respawnBird(b)}}
        if(b.type==='rooster'&&player.stun<=0&&d<30&&player.netPhase!==2){player.stun=.55;combo=0;player.x=clamp(player.x+(player.x-b.x)*1.6,45,w-45);player.y=clamp(player.y+(player.y-b.y)*1.6,58,h-40);gameCallout('ROOSTER CHARGE!','STAGGERED','bad');cameraPunch(.36)}}
      for(const bot of bots){bot.think-=dt;bot.swing=Math.max(0,bot.swing-dt);if(bot.think<=0){bot.think=rand(.18,.48)*(1.1-bot.profile.reaction*.2);let bestI=0,bestD=1e9;birds.forEach((b,i)=>{if(b.type==='rooster'&&bot.profile.risk<.65)return;const d=Math.hypot(b.x-bot.x,b.y-bot.y)/(b.type==='gold'?.45:b.type==='fast'?.75:1);if(d<bestD){bestD=d;bestI=i}});bot.target=bestI}const target=birds[bot.target];if(target){const d=Math.max(1,dist(bot,target));const speed=68+bot.profile.reaction*28;bot.x+=((target.x-bot.x)/d)*speed*dt;bot.y+=((target.y-bot.y)/d)*speed*dt;if(d<34&&bot.swing<=0){bot.swing=.35;if(Math.random()<.55+bot.profile.reaction*.18&&target.type!=='rooster'){bot.score+=target.cfg.val;respawnBird(target)}}}}
      dust.forEach(p=>p.t+=dt);dust=dust.filter(p=>p.t<.7);setScore(score,clamp(score*3.6+best*1.9-player.stun*2,0,100),RP.participation)
    },t=>{
      drawFarmBackdrop(ctx,w,h,t);mud.forEach(m=>{ctx.fillStyle='rgba(75,57,41,.72)';ctx.beginPath();ctx.ellipse(m.x,m.y,m.rx,m.ry,0,0,Math.PI*2);ctx.fill()});hay.forEach(ob=>{ctx.fillStyle='#c79b4b';rounded(ctx,ob.x,ob.y,ob.w,ob.h,5);ctx.fill();ctx.strokeStyle='#e0ba66';ctx.stroke()});
      birds.forEach(b=>{drawShadow(ctx,b.x,b.y+13,13*b.cfg.size,4,.22);ctx.fillStyle=b.type==='gold'?'#ffd85b':b.type==='rooster'?'#c95b52':b.type==='heavy'?'#dfd0a9':'#f4edcc';ctx.beginPath();ctx.ellipse(b.x,b.y,13*b.cfg.size,10*b.cfg.size,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(b.x+10*b.cfg.size,b.y-7*b.cfg.size,7*b.cfg.size,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f28a3f';ctx.beginPath();ctx.moveTo(b.x+16,b.y-8);ctx.lineTo(b.x+25,b.y-4);ctx.lineTo(b.x+16,b.y-2);ctx.fill();ctx.fillStyle='#1a2834';ctx.fillRect(b.x+11,b.y-10,2,2);if(b.type==='gold')drawSpark(ctx,b.x,b.y-21,t/1000,'#fff1a0');if(b.type==='rooster'){ctx.fillStyle='#f2bc4d';ctx.fillRect(b.x-2,b.y-17,5,7)}});
      bots.forEach(bot=>{drawCharacter(ctx,{name:bot.name},bot.x,bot.y,{color:bot.color,scale:.70});if(bot.swing>0){ctx.strokeStyle='#dfeeff';ctx.beginPath();ctx.arc(bot.x,bot.y,34,-1.2,1.2);ctx.stroke()}});drawCharacter(ctx,{name:'YOU',human:true},player.x,player.y,{color:player.stun>0?'#ff8390':'#63e4ff',label:false,scale:player.dash>0?1.08:1});if(player.netPhase){const active=player.netPhase===2;ctx.strokeStyle=active?'#fff0a6':'#a9c4de';ctx.lineWidth=active?4:2;ctx.beginPath();ctx.arc(player.x,player.y,active?58:45,player.dir-1.0,player.dir+1.0);ctx.stroke();ctx.fillStyle=active?'rgba(255,240,166,.11)':'rgba(160,190,220,.04)';ctx.beginPath();ctx.moveTo(player.x,player.y);ctx.arc(player.x,player.y,active?62:48,player.dir-1.0,player.dir+1.0);ctx.closePath();ctx.fill()}pxText(ctx,player.stun>0?'STUNNED':'YOU',player.x,player.y+39,8,player.stun>0?'#ff9ca8':'#fff0a6');dust.forEach(p=>{ctx.fillStyle=p.gold?'#fff09a':'#d9c79c';for(let i=0;i<6;i++)ctx.fillRect(p.x+Math.cos(i*1.7)*p.t*44,p.y+Math.sin(i*1.7)*p.t*34,3,3)});panel(ctx,14,14,105,45,'CAUGHT',score,'#ffe078');panel(ctx,129,14,105,45,'COMBO',`x${combo}`,'#8feaff');panel(ctx,w-119,14,105,45,'DASH',player.dashCd<=0?'READY':`${player.dashCd.toFixed(1)}s`,'#9af0ad');pxText(ctx,'WASD CHASE · SPACE NET (WINDUP → SWING → RECOVER) · SHIFT DASH · HERD THEM INTO CORNERS',w/2,h-18,7,'#d3e7ff')
    });
  }

  function gameTiles(){
    const {ctx,w,h}=canvasEnv(),cols=8,rows=5,boardW=Math.min(w*.84,760),boardH=Math.min(h*.70,390),ox=(w-boardW)/2,oy=(h-boardH)/2+24,cw=boardW/cols,ch=boardH/rows;
    let wave=0,nextWave=.95,survival=0,treasure=0,lives=3,falls=0,moveCd=0,lastDir=[0,0],finalDuel=false,boardResets=0;
    const makeTiles=()=>Array.from({length:rows},()=>Array.from({length:cols},()=>({state:'safe',timer:0,special:null,used:false})));
    let tiles=makeTiles();
    const actors=contestantList().map((p,i)=>({name:p.username,human:currentUser(p),bot:p.is_bot,color:COLORS[i],x:i===0?3:(i*2)%cols,y:i%2?0:rows-1,alive:true,respawn:0,move:rand(.18,.45),score:0,shield:0,speed:0,profile:botProfile(p.username)}));const human=actors.find(a=>a.human)||actors[0];
    const can=(x,y)=>x>=0&&x<cols&&y>=0&&y<rows&&tiles[y][x].state!=='gone';
    const safeCells=()=>{const a=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if(tiles[y][x].state==='safe')a.push([x,y]);return a};
    const moveActor=(a,dx,dy)=>{const nx=a.x+dx,ny=a.y+dy;if(can(nx,ny)){a.x=nx;a.y=ny;return true}return false};
    const triggerSpecial=(a)=>{const tile=tiles[a.y]?.[a.x];if(!tile||tile.used||!tile.special)return;tile.used=true;if(tile.special==='treasure'){if(a.human){treasure+=2;gameCallout('TREASURE TILE!','+2 BONUS','gold')}}else if(tile.special==='shield'){a.shield=3.2;if(a.human)gameCallout('SHIELD!','ONE COLLAPSE SAVE','great')}else if(tile.special==='speed'){a.speed=2.5;if(a.human)gameCallout('SPEED TILE!','FASTER MOVEMENT','good')}else if(tile.special==='bounce'){const dirs=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>can(a.x+dx,a.y+dy));if(dirs.length){const [dx,dy]=choose(dirs);moveActor(a,dx,dy);moveActor(a,dx,dy);if(a.human)gameCallout('BOUNCE!','TWO-TILE LEAP','great')}}};
    listen(window,'keydown',e=>{if(!human.alive||human.respawn>0||moveCd>0)return;let dx=0,dy=0;if(e.key==='ArrowLeft'||e.key==='a')dx=-1;if(e.key==='ArrowRight'||e.key==='d')dx=1;if(e.key==='ArrowUp'||e.key==='w')dy=-1;if(e.key==='ArrowDown'||e.key==='s')dy=1;if(dx||dy){if(moveActor(human,dx,dy)){lastDir=[dx,dy];moveCd=human.speed>0?.06:.11;activity(.05);triggerSpecial(human)}e.preventDefault()}if(e.code==='Space'&&(lastDir[0]||lastDir[1])){const [sx,sy]=lastDir;if(moveActor(human,sx,sy)){moveActor(human,sx,sy);triggerSpecial(human)}moveCd=.32;activity(.07);playTone(560,.03,.012);e.preventDefault()}},{passive:false});
    const warnWave=()=>{wave++;const viable=safeCells();const ramp=difficultyRamp(1,1.55),count=Math.min(2+Math.floor(wave/4)+Math.floor((ramp-1)*2),6,viable.length);for(let i=0;i<count;i++){const idx=irand(0,viable.length-1),[x,y]=viable.splice(idx,1)[0];tiles[y][x].state='crack';tiles[y][x].timer=rand(.45,.72)/ramp}if(viable.length&&Math.random()<.72){const [sx,sy]=choose(viable),r=Math.random();tiles[sy][sx].special=r<.45?'treasure':r<.65?'speed':r<.82?'bounce':'shield';tiles[sy][sx].used=false}};
    const respawnActor=a=>{const safe=safeCells();if(!safe.length)return;if(a.human&&lives<=0){lives=1;gameCallout('LAST CHANCE!','YOU STAY IN — FALLS STILL HURT YOUR SCORE','gold')}[a.x,a.y]=choose(safe);a.alive=true;a.respawn=0;a.shield=Math.max(a.shield,.8);triggerSpecial(a)};
    const fall=a=>{if(!a.alive||a.respawn>0)return;if(a.shield>0){a.shield=0;const safe=safeCells();if(safe.length)[a.x,a.y]=choose(safe);if(a.human)gameCallout('SHIELD SAVED YOU!','BACK ON SAFE GROUND','great');return}a.alive=false;a.respawn=.82;if(a.human){falls++;lives--;gameCallout(lives>0?'FELL!':'OUT OF LIVES!',lives>0?'RESPAWNING…':'LAST-CHANCE RESPAWN — NO DEAD WAITING','boom');cameraPunch(.42)}later(()=>{if(RP.finished||RP.state?.phase!=='live')return;respawnActor(a)},820)};
    const resetBoard=()=>{boardResets++;tiles=makeTiles();wave=Math.max(0,wave-2);actors.forEach((a,i)=>{a.alive=true;a.respawn=0;a.x=1+(i*2)%cols;a.y=i%2?1:rows-2;a.shield=Math.max(a.shield,.5)});gameCallout('ARENA SHIFT!','NEW PLATFORM · KEEP MOVING','great');cameraPunch(.35)};
    loop(dt=>{
      moveCd=Math.max(0,moveCd-dt);human.speed=Math.max(0,human.speed-dt);human.shield=Math.max(0,human.shield-dt);actors.forEach(a=>{a.shield=Math.max(0,a.shield-dt);a.speed=Math.max(0,a.speed-dt);if(a.respawn>0)a.respawn=Math.max(0,a.respawn-dt)});if(human.alive&&human.respawn<=0)survival+=dt;nextWave-=dt;if(nextWave<=0){nextWave=Math.max(.38,.95-wave*.025)/difficultyRamp(1,1.4);warnWave()}
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const tile=tiles[y][x];if(tile.state==='crack'||tile.state==='danger'){tile.timer-=dt;if(tile.timer<=0){if(tile.state==='crack'){tile.state='danger';tile.timer=rand(.30,.48)/difficultyRamp(1,1.35)}else{tile.state='gone';tile.special=null;actors.forEach(a=>{if(a.alive&&a.respawn<=0&&a.x===x&&a.y===y)fall(a)})}}}}
      for(const bot of actors.filter(a=>a.bot&&a.alive&&a.respawn<=0)){bot.move-=dt;if(bot.move<=0){bot.move=rand(.15,.42)*(1.12-bot.profile.reaction*.2);const dirs=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({dx,dy,nx:bot.x+dx,ny:bot.y+dy})).filter(q=>can(q.nx,q.ny)).sort((a,b)=>{const ta=tiles[a.ny][a.nx],tb=tiles[b.ny][b.nx];const sa=(ta.state==='safe'?0:10)+(ta.special==='treasure'?-bot.profile.risk*4:0),sb=(tb.state==='safe'?0:10)+(tb.special==='treasure'?-bot.profile.risk*4:0);return sa-sb});if(dirs.length){moveActor(bot,dirs[0].dx,dirs[0].dy);triggerSpecial(bot)}}}
      // small body bumps matter but never stunlock
      actors.filter(a=>a.alive&&a.respawn<=0).forEach((a,i)=>actors.filter((b,j)=>j>i&&b.alive&&b.respawn<=0&&a.x===b.x&&a.y===b.y).forEach(b=>{if(Math.random()<dt*.8){const dirs=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dy])=>can(b.x+dx,b.y+dy));if(dirs.length){const [dx,dy]=choose(dirs);moveActor(b,dx,dy)}}}));
      const remaining=safeCells().length;if(remaining<9&&gameSeconds()>5)resetBoard();if(!finalDuel&&gameSeconds()<7.2){finalDuel=true;gameCallout('FINAL DUEL','THE BOARD IS COLLAPSING FAST','great')}
      setScore(Math.floor(survival+treasure*5),clamp(survival*2.4+treasure*6+Math.max(0,lives)*4-falls*5+boardResets*2,0,100),RP.participation)
    },t=>{
      drawSkyArenaBackdrop(ctx,w,h,t);if(finalDuel){ctx.fillStyle='rgba(132,93,255,.055)';ctx.fillRect(0,0,w,h)}for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const tile=tiles[y][x],xx=ox+x*cw,yy=oy+y*ch;drawShadow(ctx,xx+cw/2,yy+ch*.88,cw*.36,10,.32);if(tile.state==='gone')continue;ctx.fillStyle=tile.state==='danger'?'#3d1f2d':tile.state==='crack'?'#22304b':'#172c4b';rounded(ctx,xx+5,yy+10,cw-10,ch-8,7);ctx.fill();ctx.fillStyle=tile.state==='danger'?(Math.floor(t/90)%2?'#d35b68':'#6f3346'):tile.state==='crack'?'#48627d':'#315e8f';rounded(ctx,xx+4,yy+4,cw-8,ch-12,7);ctx.fill();ctx.strokeStyle=tile.state==='danger'?'#ff8a87':tile.state==='crack'?'#e7b66b':'#557ca2';ctx.stroke();if(tile.state!=='safe'){ctx.strokeStyle='#efc27c';ctx.beginPath();ctx.moveTo(xx+cw*.24,yy+ch*.28);ctx.lineTo(xx+cw*.52,yy+ch*.55);ctx.lineTo(xx+cw*.38,yy+ch*.74);ctx.stroke()}if(tile.special&&!tile.used){const glyph={treasure:'✦',speed:'»',bounce:'↟',shield:'◈'}[tile.special];pxText(ctx,glyph,xx+cw/2,yy+ch/2,18,tile.special==='treasure'?'#ffe36f':'#8feaff');drawSpark(ctx,xx+cw/2,yy+ch/2,t/1000,tile.special==='treasure'?'#fff3a5':'#a9efff')}}actors.forEach(a=>{if(!a.alive||a.respawn>0)return;const x=ox+a.x*cw+cw/2,y=oy+a.y*ch+ch*.48;drawCharacter(ctx,{name:a.name,human:a.human},x,y,{color:a.color,scale:a.human?.78:.62,label:false});if(a.shield>0){ctx.strokeStyle='#8feaff';ctx.beginPath();ctx.arc(x,y,26,0,Math.PI*2);ctx.stroke()}if(a.human)pxText(ctx,'YOU',x,y+31,7,'#fff0a6')});panel(ctx,14,14,110,45,'SURVIVAL',`${survival.toFixed(1)}s`,'#8feaff');panel(ctx,134,14,95,45,'LIVES',Math.max(0,lives),'#ff8fa1');panel(ctx,w-124,14,110,45,'TREASURE',treasure,'#ffe078');pxText(ctx,finalDuel?'FINAL DUEL · COLLAPSE SPEED MAXIMUM':'WASD MOVE · SPACE DASH · CRACK → DANGER → COLLAPSE',w/2,h-18,7,finalDuel?'#fff0a4':'#bcd4f2')
    });
  }

  function gameSays(){
    const dom=el('rpDom');dom.classList.add('rp-dom-full');
    const commands=[['JUMP','SPACE',' '],['CROUCH','↓','arrowdown'],['LEFT','←','arrowleft'],['RIGHT','→','arrowright'],['SPIN','E','e'],['FREEZE','DON’T MOVE','freeze']];
    let lives=3,score=0,streak=0,best=0,current=null,deadline=0,locked=false,round=0,feint=0,comebacks=0,perfectHolds=0;
    dom.innerHTML=`<div class="rp-says-stage rp-says-pro"><div class="rp-goblin-host"><i class="ear left"></i><i class="ear right"></i><b><span></span></b><em></em><div class="rp-host-arms"><i></i><i></i></div></div><div class="rp-says-board"><span class="rp-kicker">LISTEN TO THE WORDS — THE HOST WILL TRY TO TRICK YOU</span><div class="rp-says-prefix" id="rpSaysPrefix">GOBLIN SAYS</div><div class="rp-says-command" id="rpSaysCommand">GET READY</div><div class="rp-says-key" id="rpSaysKey">—</div><div class="rp-says-meter"><i id="rpSaysMeter"></i></div><div class="rp-says-stats"><span id="rpSaysHearts">♥ ♥ ♥</span><b id="rpSaysStreak">STREAK 0</b></div><div class="rp-says-feints"><i></i><i></i><i></i><i></i></div><small class="rp-says-hint" id="rpSaysHint">ONLY OBEY WHEN THE PREFIX SAYS “GOBLIN SAYS”</small></div></div>`;
    const updateStats=()=>{el('rpSaysHearts').textContent=Array(Math.max(0,lives)).fill('♥').join(' ')||'—';el('rpSaysStreak').textContent=`STREAK ${streak}`;setScore(score,clamp(score*5.4+best*2+perfectHolds*1.5-comebacks*7,0,100),RP.participation)};
    const comeback=()=>{comebacks++;lives=2;locked=true;gameCallout('AUDIENCE COMEBACK!','TWO HEARTS RESTORED — KEEP PLAYING','gold');dom.querySelector('.rp-says-stage')?.classList.add('is-comeback');later(()=>{dom.querySelector('.rp-says-stage')?.classList.remove('is-comeback');next()},820)};
    const fail=(why='WRONG INPUT')=>{lives--;streak=0;gameCallout('WRONG!',why,'bad');dom.querySelector('.rp-says-stage')?.classList.add('is-wrong');later(()=>dom.querySelector('.rp-says-stage')?.classList.remove('is-wrong'),220);updateStats();if(lives<=0){later(comeback,420);return true}return false};
    const next=()=>{if(RP.finished)return;round++;locked=false;const [name,label,key]=choose(commands),says=Math.random()>(.30+activeProgress()*.10),base=Math.max(520,1260-round*10),dur=Math.max(500,base/difficultyRamp(1,1.35))+rand(0,170),gesture=choose(commands)[0];feint=Math.random()<(.28+activeProgress()*.25)?irand(0,commands.length-1):-1;current={name,label,key,says,acted:false,start:performance.now(),dur,gesture};deadline=current.start+dur;el('rpSaysPrefix').textContent=says?'GOBLIN SAYS':'JUST A COMMAND';el('rpSaysPrefix').className=`rp-says-prefix ${says?'is-real':'is-fake'}`;el('rpSaysCommand').textContent=name;el('rpSaysKey').textContent=label;el('rpSaysMeter').style.width='100%';el('rpSaysHint').textContent=gesture!==name&&activeProgress()>.35?`HOST GESTURE: ${gesture} — TRUST THE WORDS`:'WATCH THE PREFIX';dom.querySelector('.rp-goblin-host')?.classList.toggle('is-fake',!says);dom.querySelector('.rp-goblin-host')?.setAttribute('data-gesture',gesture);const dots=dom.querySelectorAll('.rp-says-feints i');dots.forEach((d,i)=>{d.className=i===feint?'is-feint':''})};
    const acceptHold=()=>{score+=3;streak++;best=Math.max(best,streak);perfectHolds++;gameCallout('PERFECT HOLD!','YOU IGNORED THE TRAP','good');updateStats()};
    listen(window,'keydown',e=>{if(!current||locked||RP.finished)return;const k=e.code==='Space'?' ':e.key.toLowerCase();if(![' ','arrowleft','arrowright','arrowdown','e','arrowup'].includes(k))return;activity(.09);locked=true;current.acted=true;
      if(current.key==='freeze'){if(current.says){fail('FREEZE MEANS DO NOTHING');later(next,330)}else{fail('HE NEVER SAID GOBLIN SAYS');later(next,330)}}
      else if(current.says&&k===current.key){const rt=performance.now()-current.start,bonus=Math.max(1,Math.round((1-rt/current.dur)*5));score+=2+bonus;streak++;best=Math.max(best,streak);if(streak%4===0)gameCallout(`REACTION STREAK x${streak}`,`${Math.round(rt)}ms`,'great');sfx('good');dom.querySelector('.rp-says-stage')?.classList.add('is-right');later(()=>dom.querySelector('.rp-says-stage')?.classList.remove('is-right'),180);updateStats();later(next,220)}
      else if(!current.says){fail('HE NEVER SAID GOBLIN SAYS');later(next,330)}else{fail('THAT WAS THE WRONG MOVE');later(next,330)}e.preventDefault()},{passive:false});
    every(()=>{if(!current||locked||RP.finished)return;const left=clamp((deadline-performance.now())/current.dur,0,1);if(el('rpSaysMeter'))el('rpSaysMeter').style.width=`${left*100}%`;if(performance.now()>=deadline){locked=true;if(current.key==='freeze'&&current.says)acceptHold();else if(current.says)fail('TOO SLOW');else acceptHold();later(()=>{if(lives>0)next()},240)}},30);next();
  }

  function gameGold(){
    const {ctx,w,h}=canvasEnv();
    let p={x:90,y:h*.55,carry:0,banked:0,swing:0,stun:0},score=0,spawnCave=3.0,goldFever=rand(8,12),goldFeverT=0,dust=[],caveIns=[];
    const walls=[{x:w*.34,y:h*.16,w:26,h:h*.34,hp:5,max:5},{x:w*.56,y:h*.48,w:28,h:h*.30,hp:6,max:6},{x:w*.74,y:h*.18,w:25,h:h*.25,hp:4,max:4}];
    const nodes=Array.from({length:12},(_,i)=>({x:180+(i%4)*((w-255)/4)+rand(-22,22),y:82+Math.floor(i/4)*145+rand(-16,16),hp:irand(1,3),max:3,value:Math.random()<.12?5:irand(1,3),respawn:0,hitFrame:false,fever:false}));
    const goblins=Array.from({length:3},(_,i)=>({x:w*.53+i*105,y:h*.22+i*92,vx:rand(-65,65),vy:rand(-65,65),aggro:0}));
    const bots=contestantList().filter(q=>!currentUser(q)).slice(0,5).map((q,i)=>({name:q.username,x:140+i*(w-210)/4,y:h*.82-(i%2)*35,target:i%nodes.length,score:0,color:COLORS[(i+1)%COLORS.length],profile:botProfile(q.username)}));
    const collidesWall=(x,y)=>walls.some(o=>o.hp>0&&x>o.x-18&&x<o.x+o.w+18&&y>o.y-18&&y<o.y+o.h+18);
    listen(window,'keydown',e=>{if(e.code==='Space'&&p.swing<=0&&p.stun<=0){p.swing=.34;activity(.06);e.preventDefault()}},{passive:false});
    const startFever=()=>{goldFeverT=5.2;goldFever=rand(11,15);const rich=choose(nodes.filter(n=>n.respawn<=0));if(rich){rich.value=9;rich.hp=3;rich.max=3;rich.fever=true}gameCallout('GOLD FEVER!','A RICH SEAM HAS OPENED — FIND THE GLOW','gold');cameraPunch(.32)};
    loop((dt,t)=>{
      const ramp=difficultyRamp(1,1.35);p.stun=Math.max(0,p.stun-dt);p.swing=Math.max(0,p.swing-dt);goldFever-=dt;goldFeverT=Math.max(0,goldFeverT-dt);if(goldFever<=0&&goldFeverT<=0)startFever();spawnCave-=dt;if(spawnCave<=0){spawnCave=rand(2.5,4.0)/ramp;caveIns.push({x:rand(160,w-65),y:rand(70,h-65),t:0,drop:.82/ramp})}
      const {dx,dy}=directional(),carrySlow=1-clamp(p.carry*.026,0,.36);if(p.stun<=0&&(dx||dy)){activity(.004);const nx=clamp(p.x+dx*172*carrySlow*dt,42,w-42),ny=clamp(p.y+dy*172*carrySlow*dt,42,h-35);if(!collidesWall(nx,p.y))p.x=nx;if(!collidesWall(p.x,ny))p.y=ny}
      if(p.swing>.10&&p.swing<.21){
        let hitSomething=false;for(const wall of walls){if(wall.hp>0&&Math.hypot(p.x-clamp(p.x,wall.x,wall.x+wall.w),p.y-clamp(p.y,wall.y,wall.y+wall.h))<50){if(!wall.hitFrame){wall.hitFrame=true;wall.hp--;dust.push({x:clamp(p.x,wall.x,wall.x+wall.w),y:clamp(p.y,wall.y,wall.y+wall.h),t:0});hitSomething=true;if(wall.hp<=0)gameCallout('WALL BROKEN!','NEW CAVE ROUTE OPEN','great')}}else wall.hitFrame=false}
        for(const n of nodes){if(n.respawn<=0&&Math.hypot(p.x-n.x,p.y-n.y)<58&&!n.hitFrame){n.hitFrame=true;n.hp--;dust.push({x:n.x,y:n.y,t:0});hitSomething=true;playTone(420,.035,.012);if(n.hp<=0){p.carry+=n.value;score+=n.value;const feverWas=n.fever;n.respawn=rand(2.2,3.6);n.hp=irand(1,3);n.value=Math.random()<.12?5:irand(1,3);n.fever=false;gameCallout(feverWas?'GOLD FEVER HAUL!':n.value===5?'RICH VEIN!':'ORE MINED',feverWas?'+9 HEAVY ORE — BANK IT!':`CARRY ${p.carry}`,feverWas?'gold':'good')}}else if(n.respawn<=0)n.hitFrame=false}
        if(hitSomething)impactPause(20)
      }else{nodes.forEach(n=>n.hitFrame=false);walls.forEach(o=>o.hitFrame=false)}
      for(const n of nodes)if(n.respawn>0)n.respawn-=dt;if(p.x<112&&Math.abs(p.y-h*.55)<85&&p.carry>0){const deposit=p.carry;p.banked+=deposit;score+=deposit;p.carry=0;gameCallout('BANKED!',`+${deposit} SAFE GOLD`,'gold');sfx('bank');activity(.05)}
      for(const g of goblins){g.x+=g.vx*dt;g.y+=g.vy*dt;if(g.x<128||g.x>w-35)g.vx*=-1;if(g.y<45||g.y>h-35)g.vy*=-1;const d=Math.hypot(p.x-g.x,p.y-g.y);g.aggro=lerp(g.aggro,d<175?1:0,dt*3);if(d<175){g.vx+=(p.x-g.x)/Math.max(1,d)*22*ramp*dt;g.vy+=(p.y-g.y)/Math.max(1,d)*22*ramp*dt}if(p.stun<=0&&d<34){const lost=Math.min(p.carry,Math.max(1,Math.floor(p.carry*.42)));p.carry-=lost;p.stun=.62;g.vx*=-1;g.vy*=-1;playTone(95,.12,.03,'sawtooth');gameCallout('GOBLIN HIT!',lost?`-${lost} UNBANKED`:'NO ORE LOST','bad');cameraPunch(.32)}}
      caveIns.forEach(ci=>{ci.t+=dt;if(ci.t>=ci.drop&&ci.t-dt<ci.drop&&Math.hypot(p.x-ci.x,p.y-ci.y)<55){p.stun=.72;const lost=Math.min(p.carry,2);p.carry-=lost;gameCallout('CAVE-IN!',lost?`-${lost} ORE · WATCH WARNING RINGS`:'WATCH THE WARNING RINGS','boom')}});caveIns=caveIns.filter(ci=>ci.t<1.35);
      for(const bot of bots){const target=nodes[bot.target];if(!target||target.respawn>0){bot.target=irand(0,nodes.length-1);continue}const d=Math.max(1,dist(bot,target));bot.x+=((target.x-bot.x)/d)*(55+bot.profile.reaction*25)*dt;bot.y+=((target.y-bot.y)/d)*(55+bot.profile.reaction*25)*dt;if(d<35&&Math.random()<dt*(.8+bot.profile.risk)){bot.score+=target.value;target.respawn=.7;bot.target=irand(0,nodes.length-1)}}
      dust.forEach(d=>d.t+=dt);dust=dust.filter(d=>d.t<.58);setScore(p.banked,clamp(p.banked*3.8+score*1.15+walls.filter(o=>o.hp<=0).length*3,0,100),RP.participation)
    },t=>{
      drawCaveBackdrop(ctx,w,h,t);const glow=ctx.createRadialGradient(78,h*.55,10,78,h*.55,100);glow.addColorStop(0,'rgba(255,196,89,.28)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,h*.35,180,h*.4);ctx.fillStyle='#5a3e28';rounded(ctx,25,h*.55-54,88,108,8);ctx.fill();ctx.fillStyle='#d7a448';ctx.fillRect(34,h*.55-44,70,9);pxText(ctx,'BANK',69,h*.55-8,10,'#fff0a0');pxText(ctx,`${p.banked}`,69,h*.55+16,17,'#ffd45d');
      walls.forEach(o=>{if(o.hp<=0)return;ctx.fillStyle='#463844';rounded(ctx,o.x,o.y,o.w,o.h,4);ctx.fill();ctx.strokeStyle='#695969';ctx.stroke();for(let yy=o.y+10;yy<o.y+o.h;yy+=18){ctx.fillStyle='#6f5b63';ctx.fillRect(o.x+4,yy,o.w-8,3)}pxText(ctx,`${o.hp}`,o.x+o.w/2,o.y+o.h/2,7,'#e7d7c2')});
      nodes.forEach(n=>{if(n.respawn>0)return;drawShadow(ctx,n.x,n.y+13,17,5,.25);ctx.fillStyle=n.fever?'#7a6135':n.value===5?'#6d537f':'#6d5b65';ctx.beginPath();ctx.moveTo(n.x-15,n.y+10);ctx.lineTo(n.x-10,n.y-9);ctx.lineTo(n.x+7,n.y-14);ctx.lineTo(n.x+17,n.y+6);ctx.lineTo(n.x+8,n.y+15);ctx.closePath();ctx.fill();ctx.fillStyle=n.fever?'#fff06b':n.value===5?'#cf9cff':'#f2c756';ctx.fillRect(n.x-7,n.y-5,5,5);ctx.fillRect(n.x+4,n.y+2,6,4);if(n.fever){drawSpark(ctx,n.x,n.y-20,t/1000,'#fff3a0');ctx.strokeStyle='#ffe078';ctx.beginPath();ctx.arc(n.x,n.y,28,0,Math.PI*2);ctx.stroke()}});
      goblins.forEach(g=>{drawShadow(ctx,g.x,g.y+16,14,5,.24);ctx.fillStyle=g.aggro>.5?'#86c465':'#6fb05a';rounded(ctx,g.x-11,g.y-16,22,24,5);ctx.fill();ctx.fillStyle='#d5bb9d';ctx.fillRect(g.x-6,g.y-20,12,8);ctx.fillStyle='#351d2b';ctx.fillRect(g.x-4,g.y-17,2,2);ctx.fillRect(g.x+2,g.y-17,2,2)});bots.forEach(bot=>drawCharacter(ctx,{name:bot.name},bot.x,bot.y,{color:bot.color,scale:.55,label:false}));
      caveIns.forEach(ci=>{const pz=ci.t/ci.drop;ctx.strokeStyle=ci.t<ci.drop?(Math.floor(t/90)%2?'#ffcc68':'#8b5d42'):'#ff6d70';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ci.x,ci.y,22+18*clamp(pz,0,1),0,Math.PI*2);ctx.stroke();if(ci.t>=ci.drop){ctx.fillStyle='rgba(107,83,91,.65)';for(let i=0;i<6;i++)ctx.fillRect(ci.x+Math.cos(i)*ci.t*25,ci.y+Math.sin(i*1.6)*ci.t*18,6,6)}});drawCharacter(ctx,{name:'YOU',human:true},p.x,p.y,{color:p.stun>0?'#ff8490':'#63e4ff',label:false});if(p.swing>0){ctx.strokeStyle='#ffe17d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,38,-1.1,.7);ctx.stroke()}pxText(ctx,`CARRY ${p.carry}`,p.x,p.y-42,8,p.carry?'#ffe078':'#8ea1bd');dust.forEach(d=>{ctx.fillStyle='#e4c179';for(let i=0;i<5;i++)ctx.fillRect(d.x+Math.cos(i*1.5)*d.t*35,d.y+Math.sin(i*1.7)*d.t*28,3,3)});panel(ctx,14,14,108,45,'BANKED',p.banked,'#ffe078');panel(ctx,132,14,108,45,'CARRY',p.carry,'#8feaff');panel(ctx,w-132,14,118,45,'GOLD FEVER',goldFeverT>0?`${goldFeverT.toFixed(1)}s`:`${Math.ceil(goldFever)}s`,goldFeverT>0?'#fff0a0':'#9eb2cb');pxText(ctx,'WASD EXPLORE · SPACE MINE · BREAK WALLS FOR ROUTES · BANK BEFORE GOBLINS TAKE IT',w/2,h-18,7,'#d3e7ff')
    });
  }

  function gameTroll(){
    const {ctx,w,h}=canvasEnv();
    const targets=[{name:'COIN POUCH',dist:.62,value:[1,3],risk:.65,color:'#d9b65a'},{name:'GOLD CHEST',dist:.82,value:[3,6],risk:1.0,color:'#d9934b'},{name:'TROLL CROWN',dist:1.0,value:[6,10],risk:1.38,color:'#ffe06a'}];
    let selected=0,progress=0,unbanked=0,banked=0,alert=.08,risk=.10,breath=0,breathSpeed=.9,grabs=0,wake=0,retreat=0,particles=[],freezeBonus=0,chases=0;
    const rivals=contestantList().filter(p=>!currentUser(p)).slice(0,5).map((p,i)=>({name:p.username,progress:rand(.05,.35),banked:0,target:irand(0,2),think:rand(.7,1.8),profile:botProfile(p.username),color:COLORS[(i+1)%COLORS.length]}));
    const sneaking=()=>RP.keys.has(' ')||RP.keys.has('space'),running=()=>sneaking()&&(RP.keys.has('shift')||RP.keys.has('shiftleft')||RP.keys.has('shiftright'));
    listen(window,'keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a'){selected=clamp(selected-1,0,2);activity(.03);gameCallout(targets[selected].name,'TARGET CHANGED','good');e.preventDefault()}if(e.key==='ArrowRight'||e.key==='d'){selected=clamp(selected+1,0,2);activity(.03);gameCallout(targets[selected].name,'TARGET CHANGED','good');e.preventDefault()}if(e.code==='Space'){activity(.02);e.preventDefault()}if(e.key.toLowerCase()==='b'&&unbanked>0&&!wake){retreat=1;gameCallout('RETREAT!','GET THE LOOT TO SAFETY','gold');activity(.08);e.preventDefault()}},{passive:false});
    loop((dt,t)=>{
      if(wake>0){wake-=dt;if(wake<=0){progress=0;alert=.08;risk=.10;unbanked=0;retreat=0}return}
      const ramp=difficultyRamp(1,1.28);breath+=dt*breathSpeed*ramp;const cycle=(Math.sin(breath*Math.PI*2)+1)/2,stir=cycle>.68,eye=cycle>.84,moving=sneaking()&&!retreat,sprinting=running();
      if(retreat){progress=Math.max(0,progress-dt*(sprinting?1.55:1.05));alert=Math.max(0,alert-dt*(sprinting?.04:.23));if(progress<=0){const dep=unbanked;banked+=dep;unbanked=0;retreat=0;risk=Math.max(.08,risk-.10);gameCallout('SAFE!',`+${dep} TREASURE BANKED`,'gold');sfx('bank')}}
      else if(moving){const speed=(sprinting?.34:.20)*(1-risk*.18);progress=clamp(progress+dt*speed,0,targets[selected].dist);const noise=(sprinting?1.65:.46)*targets[selected].risk*(stir?2.1:.42);alert+=dt*noise*(1+risk);if(stir&&Math.random()<dt*2.4)playTone(105,.03,.007,'sawtooth')}
      else{if(stir){freezeBonus+=dt;alert=Math.max(0,alert-dt*.34)}else alert=Math.max(0,alert-dt*.24)}
      if(progress>=targets[selected].dist&&!retreat){grabs++;const tg=targets[selected],gain=irand(tg.value[0],tg.value[1])+Math.min(3,Math.floor(grabs/3));unbanked+=gain;progress=Math.max(.28,tg.dist*.48);risk=clamp(risk+.06*tg.risk,.08,.74);breathSpeed=clamp(.9+risk*.58,.9,1.34);particles.push({x:w*(.56+selected*.11),y:h*.66,t:0});gameCallout(`${tg.name} STOLEN!`,`+${gain} UNBANKED · ${selected===2?'GET OUT!':'PRESS B TO BANK'}`,selected===2?'gold':'good');cameraPunch(selected===2?.32:.15)}
      if(alert>=1){wake=1.45;chases++;gameCallout('TROLL WOKE!','RUN! UNBANKED TREASURE LOST','boom');cameraPunch(.82);playTone(72,.28,.055,'sawtooth')}
      for(const r of rivals){r.think-=dt;if(r.think<=0){r.think=rand(.6,1.6)*(1.2-r.profile.reaction*.25);const cycleRisk=stir?1:0;if(cycleRisk&&r.profile.risk<.7)r.progress=Math.max(0,r.progress-.06);else r.progress+=dt*(.09+r.profile.risk*.08);if(r.progress>=targets[r.target].dist){r.banked+=irand(targets[r.target].value[0],targets[r.target].value[1]);r.progress=0;r.target=Math.random()<r.profile.risk?irand(1,2):irand(0,1)}}}
      particles.forEach(p=>p.t+=dt);particles=particles.filter(p=>p.t<.72);setScore(banked,clamp(banked*6.5+grabs*1.8+freezeBonus*.8-chases*8,0,100),RP.participation)
    },t=>{
      const g=ctx.createRadialGradient(w*.66,h*.5,30,w*.66,h*.5,w*.7);g.addColorStop(0,'#5a392d');g.addColorStop(.45,'#2b2026');g.addColorStop(1,'#090d16');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.fillStyle='#302536';for(let i=0;i<16;i++){const x=(i*83)%w,hh=20+(i*31)%75;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+12,hh);ctx.lineTo(x+24,0);ctx.fill()}
      ctx.fillStyle='#1a2631';rounded(ctx,22,h*.38,90,h*.36,10);ctx.fill();ctx.strokeStyle='#65809b';ctx.stroke();pxText(ctx,'SAFE',67,h*.55,10,'#8feaff');
      targets.forEach((tg,i)=>{const tx=w*(.56+i*.11),ty=h*.66-i*7;ctx.fillStyle=tg.color;for(let k=0;k<12+i*5;k++){ctx.beginPath();ctx.arc(tx+rand(-24,24),ty+rand(-12,12),rand(2,5),0,Math.PI*2);ctx.fill()}if(i===selected){ctx.strokeStyle='#8feaff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(tx,ty,32,0,Math.PI*2);ctx.stroke();pxText(ctx,tg.name,tx,ty-38,6,'#fff0a4')}});
      const trX=w*.86,trY=h*.43,cycle=(Math.sin(breath*Math.PI*2)+1)/2,eyeOpen=wake>0||cycle>.84,stir=cycle>.68;ctx.fillStyle=wake>0?'#8b5a4a':stir?'#71805a':'#5f7450';ctx.beginPath();ctx.ellipse(trX,trY,78,60,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#4f6444';ctx.beginPath();ctx.ellipse(trX+26,trY-48,43,36,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e7d1a9';ctx.fillRect(trX+15,trY-54,31,13);ctx.fillStyle=eyeOpen?'#ff6a62':'#2d302b';ctx.fillRect(trX+29,trY-51,7,eyeOpen?5:2);if(!eyeOpen)pxText(ctx,stir?'…snort…':'Z z z',trX+50,trY-94,10,stir?'#ffcf81':'#c9d4e5');
      const tg=targets[selected],frac=clamp(progress/Math.max(.01,tg.dist),0,1),px=lerp(72,w*(.52+selected*.09),frac);drawCharacter(ctx,{name:'YOU',human:true},px,h*.72,{color:wake>0?'#ff8390':running()?'#ffe078':'#63e4ff',label:false,scale:running()?1.04:.82});pxText(ctx,wake>0?'RUN!':retreat?'RETREATING':running()?'RUNNING / LOUD':'YOU',px,h*.79,7,wake>0?'#ff9ca8':running()?'#ffe078':'#fff0a6');
      rivals.forEach((r,i)=>{const tx=lerp(88,w*(.52+r.target*.09),clamp(r.progress/targets[r.target].dist,0,1));drawCharacter(ctx,{name:r.name},tx,h*.83+(i%2)*9,{color:r.color,scale:.45,label:false})});
      panel(ctx,14,14,115,45,'BANKED',banked,'#ffe078');panel(ctx,139,14,115,45,'UNBANKED',unbanked,unbanked?'#ffcf70':'#8ea1bd');ctx.fillStyle='#111c30';ctx.fillRect(w*.35,28,w*.30,10);ctx.fillStyle=alert>.72?'#ff6d7d':alert>.4?'#ffd45f':'#73e5ad';ctx.fillRect(w*.35,28,w*.30*clamp(alert,0,1),10);pxText(ctx,`TROLL ALERT ${Math.round(alert*100)}%`,w*.50,18,7,'#dce8ff');ctx.strokeStyle=cycle>.84?'#ff6d7d':cycle>.68?'#ffd45f':'#79e5b0';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<80;i++){const x=w*.35+i/79*w*.30,y=55+Math.sin((i/79*3+breath)*Math.PI*2)*6;ctx.lineTo(x,y)}ctx.stroke();pxText(ctx,wake>0?'THE TROLL IS AWAKE':stir?'STIRRING — FREEZE!':retreat?'RETREATING TO BANK':unbanked?'A/D TARGET · HOLD SPACE SNEAK · SHIFT+SPACE RUNS · B BANK':'A/D CHOOSE LOOT · HOLD SPACE SNEAK',w*.5,h-20,7,stir?'#ffcf81':'#cfe1f7');particles.forEach(p=>{ctx.fillStyle='#ffe078';for(let i=0;i<6;i++)ctx.fillRect(p.x+Math.cos(i)*p.t*55,p.y+Math.sin(i*1.4)*p.t*34,3,3)})
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
