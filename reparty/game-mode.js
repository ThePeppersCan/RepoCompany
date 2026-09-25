import { cards, packs } from './game-cards.mjs';

const $ = id => document.getElementById(id);
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };

export function createGameMode({ send, getUser, avatar, notify, onModeChange }) {
  let game = null, members = [], connected = false, busy = false, signature = '', roster = [], draftRoom = null;
  let serverOffset = 0;
  const root = el('section', undefined, 'game-room'); root.id = 'gameRoom'; root.hidden = true;
  root.setAttribute('aria-label', 'Reparty Game mode');
  root.innerHTML = `
    <header class="game-heading"><p class="game-kicker">REPOCOMPANY · AFTER HOURS</p><h1>Reparty<span>game night</span></h1><p id="gameHostLabel">Same friends. A different kind of party.</p></header>
    <div class="game-people" id="gamePeople" aria-label="Players"></div>
    <div id="gameSetup" class="game-setup">
      <section class="game-box"><p class="game-kicker">01 / THE COMPANY</p><h2>Who’s playing?</h2><p>Room members are added for you. Add friends sharing your screen.</p>
        <div id="gameRoster" class="game-roster"></div><form id="gameAddPlayer" class="game-add"><label class="sr-only" for="gamePlayerName">Player name</label><input id="gamePlayerName" maxlength="32" placeholder="A friend’s name" required autocomplete="off"><button>Add player</button></form>
      </section>
      <section class="game-box"><p class="game-kicker">02 / THE CARDS</p><h2>Pick your packs.</h2><div id="gamePacks" class="game-packs"></div>
        <div class="game-options"><label>Rules last<select id="gameTurns"><option value="2">2 turns</option><option value="3" selected>3 turns</option><option value="5">5 turns</option><option value="10">10 turns</option></select></label><label>Challenge timer<select id="gameSeconds"><option value="10">10 seconds</option><option value="20">20 seconds</option><option value="30" selected>30 seconds</option><option value="60">60 seconds</option></select></label></div>
        <p class="game-small">Cards are played aloud. Use Save card for one-off powers and ongoing effects; clear them when used. Digital cards may refer to your call’s chat.</p>
      </section>
      <div class="game-start"><p id="gameDeckCount"></p><button id="gameStart" class="game-primary">Let’s play <span aria-hidden="true">↗</span></button></div>
    </div>
    <div id="gamePlay" hidden>
      <div class="game-round"><span id="gameProgress"></span><span id="gameTurn"></span></div>
      <article class="game-card" id="gameCard" aria-live="polite" aria-atomic="true"><p id="gameCardPack" class="game-kicker"></p><div class="game-card-ornament" aria-hidden="true">✧</div><h2 id="gameCardTitle"></h2><p id="gameCardText"></p><div class="game-card-bottom"><span id="gameCardNumber"></span><span aria-hidden="true">◆ REPARTY ◆</span></div></article>
      <div class="game-controls"><button id="gameSkip">Skip card</button><button id="gameNext" class="game-primary">Next card →</button><button id="gamePin">Save card</button></div>
      <div class="game-timer" id="gameTimer" hidden><button id="gameTimerStart">Start timer</button><output id="gameTimerValue" aria-label="Time remaining"></output></div>
      <div class="game-tools"><button id="gameWheel">Draw a player</button><output id="gameWheelResult"></output><button id="gameReset">New game</button></div>
      <section class="game-effects"><div class="game-section-title"><h2>On the table</h2><button id="gameClear">Clear all</button></div><div id="gameRules"></div></section>
      <details class="game-history"><summary>Previously played</summary><div id="gameHistory"></div></details>
    </div>
    <div id="gameWaiting" class="game-waiting" hidden>The host is setting up the game.</div><button id="gameTakeover" hidden>Take over hosting</button>
    <footer class="game-footer"><span>◆</span><p>Good company. Questionable decisions.</p><small>Every card is optional. Skip freely; any drink works.</small></footer>`;
  document.querySelector('.app').append(root);
  const descriptions = { 'Base Pack':'The main event', 'Occult Pack':'Fate has other plans', 'IRL Pack':'For the same sofa', 'Digital Pack':'For the group call' };
  packs.forEach((pack, index) => {
    const label = el('label', undefined, 'game-pack'); const box = el('input'); box.type = 'checkbox'; box.value = pack; box.checked = index === 0;
    const copy = el('span'); copy.append(el('strong', pack), el('small', descriptions[pack])); label.append(box, copy, el('span', String(cards.filter(c=>c.pack===pack).length), 'game-pack-count'));
    $('gamePacks').append(label); box.onchange = count;
  });
  function selectedPacks() { return [...$('gamePacks').querySelectorAll('input:checked')].map(n=>n.value); }
  function isHost() { return game?.host === getUser()?.id; }
  function count() {
    const chosen = selectedPacks(); const n = cards.filter(c=>chosen.includes(c.pack) && c.minPlayers<=roster.length).length;
    $('gameDeckCount').textContent = `${roster.length} players · ${n} cards ready`;
    $('gameStart').disabled = busy || !connected || roster.length<2 || n===0;
  }
  function renderRoster() {
    $('gameRoster').replaceChildren(...roster.map((p,i)=>{
      const row=el('div',undefined,'game-roster-person'); const face=el('button'); face.type='button'; face.title=`Change ${p.name}’s avatar`; face.append(avatar(p.avatar_id,p.name));
      face.onclick=()=>{p.avatar_id=(p.avatar_id+1)%100;renderRoster();};
      const remove=el('button','×');remove.type='button';remove.setAttribute('aria-label',`Remove ${p.name}`);remove.onclick=()=>{roster.splice(i,1);renderRoster();};
      row.append(face,el('span',p.name),remove);return row;
    })); count();
  }
  async function action(name, data={}) {
    if (busy) return;
    busy=true; controls();
    try { await send(name,{...data,revision:game?.revision||0}); }
    catch(e) { notify(/reparty_game_action|PGRST202|schema cache/i.test(e.message||'') ? 'Game mode needs its database update before this room can play.' : e.message||'Could not update the game.'); }
    finally { busy=false;controls();count(); }
  }
  function controls() {
    const host=isHost(), enabled=host&&connected&&!busy;
    ['gameNext','gameSkip','gamePin','gameTimerStart','gameReset','gameClear','gameWheel'].forEach(id=>{$(id).disabled=!enabled;});
    ['gameNext','gameSkip','gamePin','gameWheel'].forEach(id=>{$(id).disabled ||= !game?.current;});
    $('gameTimerStart').disabled ||= !!game?.timer_end;
    $('gameToggle').disabled=busy || (game?.mode==='game' && !host);
    $('gameTakeover').disabled=!connected||busy;
    $('gameRules').querySelectorAll('button').forEach(b=>b.disabled=!enabled);
  }
  $('gameAddPlayer').onsubmit=e=>{
    e.preventDefault();const name=$('gamePlayerName').value.trim();
    if (!name || roster.length>=24) return;
    if (roster.some(p=>p.name.toLowerCase()===name.toLowerCase())) return notify('Give each player a different name.');
    roster.push({name,avatar_id:roster.length%100});$('gamePlayerName').value='';renderRoster();
  };
  $('gameToggle').onclick=()=>action(game?.mode==='game'?'exit':'enter');
  $('gameStart').onclick=()=>action('start',{players:roster,packs:selectedPacks(),turns:Number($('gameTurns').value),seconds:Number($('gameSeconds').value)});
  for(const [id,name] of Object.entries({gameNext:'next',gameSkip:'skip',gamePin:'pin',gameTimerStart:'timer',gameReset:'reset',gameClear:'clear',gameTakeover:'takeover',gameWheel:'wheel'})) $(id).onclick=()=>action(name);
  function timer() {
    const end=game?.timer_end; const left=end ? Math.max(0,Math.ceil((Date.parse(end)-Date.now()-serverOffset)/1000)) : game?.seconds||30;
    $('gameTimerValue').textContent=end&&left===0?'Time’s up':`${left}s`;
  }
  setInterval(timer,250);
  function update(next, roomMembers=[], roomId=null, offset=0) {
    game=next||null;members=roomMembers;serverOffset=offset;
    const active=game?.mode==='game';
    root.hidden=!active;document.documentElement.classList.toggle('game-mode',active);
    $('gameToggle').textContent=active?'Watch mode':'Game mode';$('gameToggle').setAttribute('aria-pressed',String(active));
    onModeChange(active);
    if (!active) { signature=''; if(!roomId) draftRoom=null; controls();return; }
    const host=isHost(); const hostMember=members.find(m=>m.user_id===game.host);
    $('gameHostLabel').textContent=host?'You’re hosting · take it one card at a time':`${hostMember?.name||'Your host'} controls the cards`;
    $('gameTakeover').hidden=host||!!hostMember;
    $('gameSetup').hidden=!!game.deck||!host; $('gameWaiting').hidden=!!game.deck||host;
    $('gamePlay').hidden=!game.deck;
    if (!game.deck && draftRoom!==roomId) { roster=members.map(m=>({name:m.name,avatar_id:m.avatar_id})); draftRoom=roomId;renderRoster(); }
    $('gamePeople').replaceChildren(...(game.players||members).map(p=>{
      const n=el('div',undefined,'game-person');n.classList.toggle('is-turn',p.name===game.current?.player);n.append(avatar(p.avatar_id,p.name),el('span',p.name));return n;
    }));
    const newSignature=JSON.stringify(game);
    if(newSignature!==signature) {
      signature=newSignature;
      const c=game.current;
      $('gameProgress').textContent=`${game.round||0} / ${game.deck?.length||0} cards`;
      $('gameTurn').textContent=c?`${c.player}’s turn`:'That’s the deck.';
      $('gameCardPack').textContent=c?.pack||'THE LAST WORD';
      $('gameCardTitle').textContent=c?.title||(c?'Your card':'One for the memories.');
      $('gameCardText').textContent=c?.text||'All cards played. Start a new game when you’re ready.';
      $('gameCardNumber').textContent=c?`NO. ${String(game.round).padStart(3,'0')}`:'FIN';
      $('gameTimer').hidden=!c?.timed;
      $('gameWheelResult').textContent=game.wheel||'';
      $('gameRules').replaceChildren(...(game.rules||[]).map(rule=>{
        const n=el('article',undefined,'game-rule');const copy=el('div');copy.append(el('strong',rule.title||'House rule'),el('p',rule.text),el('small',rule.expires?`${Math.max(0,rule.expires-game.round)} turns left`:'Saved · until used'));
        const dismiss=el('button','×');dismiss.setAttribute('aria-label',`Clear ${rule.title||'rule'}`);dismiss.onclick=()=>action('dismiss',{instance:rule.instance});n.append(copy,dismiss);return n;
      }));
      if (!game.rules?.length) $('gameRules').append(el('p','No active rules. For cards with a lasting effect, use Save card.','game-small'));
      $('gameHistory').replaceChildren(...(game.history||[]).slice().reverse().map(c=>{const n=el('p');n.append(el('strong',`${c.title||'Untitled'} — `),document.createTextNode(c.text));return n;}));
    }
    controls();timer();
  }
  return {update, setConnected(value){connected=value;controls();count();}, active:()=>game?.mode==='game'};
}
