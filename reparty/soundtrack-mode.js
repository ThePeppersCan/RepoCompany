const $ = id => document.getElementById(id);
const make = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
const modes = { versus: 'Versus', teams: 'Teams', group: 'Together', chill: 'Chill' };
const categories = { game: 'Game soundtracks', movie: 'Movie soundtracks', disney: 'Disney + DreamWorks', mixed: 'Everything mixed' };

export function createSoundtrackMode({send, getUser, avatar, notify, loadYoutube, onActive, onBackToModes}) {
 let state=null, members=[], roomId=null, active=false, connected=false, busy=false, offset=0, rosterRoom=null;
 let player=null, playerReady=false, playerLoading=false, video=null, token=null, readyToken=null, lastSync=0, lastTick=0, ticking=false;
 let roster=[], ownFeedback='', feedbackToken=null, needsGesture=false, playerError='', summary=null;
 let loadAttempt=0, playerTimer=null;
 let artworkKey=null, artworkRequest=0, artworkController=null;
 const artworkCache=new Map();
 const root=make('section',undefined,'soundtrack-room');root.id='soundtrackRoom';root.hidden=true;
 root.innerHTML=`
  <header class="st-heading"><span class="st-eyebrow">REPARTY ORIGINALS · MUSIC NIGHT</span><h1>Guess the<br><em>Soundtrack.</em></h1><p>A few notes. A thousand memories.</p><div class="st-heading-tags"><span>Games, movies & Disney</span><span>10–30 second rounds</span><span>Your people, your party</span></div></header>
  <div id="stSetup" class="st-setup">
   <section class="panel st-settings"><p class="st-eyebrow">01 / MAKE IT YOUR NIGHT</p><h2>Pick your mix.</h2>
    <fieldset class="st-choice st-categories"><legend>What are we guessing?</legend><label><input type="radio" name="stCategory" value="game" checked><span>▣<strong>Games</strong><small>From first levels to final bosses</small></span></label><label><input type="radio" name="stCategory" value="movie"><span>▰<strong>Movies</strong><small>The music behind the big screen</small></span></label><label><input type="radio" name="stCategory" value="disney"><span>✦<strong>Disney + DreamWorks</strong><small>Pixar, classics, musicals & Disney Channel</small></span></label><label><input type="radio" name="stCategory" value="mixed"><span>♫<strong>Mixed</strong><small>A little bit of everything</small></span></label></fieldset>
    <fieldset class="st-choice st-play-styles"><legend>How do you want to play?</legend><label><input type="radio" name="stMode" value="versus" checked><span>⚡<strong>Versus</strong><small>Every player for themselves</small></span></label><label><input type="radio" name="stMode" value="teams"><span>⚑<strong>Teams</strong><small>Share the glory, share the points</small></span></label><label><input type="radio" name="stMode" value="group"><span>♥<strong>Together</strong><small>One room. One shared score.</small></span></label><label><input type="radio" name="stMode" value="chill"><span>∞<strong>Chill</strong><small>Short rounds. No finish line.</small></span></label></fieldset>
    <div class="st-options"><label>Guess time<select id="stSeconds"><option value="10">10 seconds</option><option value="15" selected>15 seconds</option><option value="20">20 seconds</option><option value="30">30 seconds</option></select></label><label id="stRoundsLabel">Rounds<select id="stRounds"><option value="10">10 rounds</option><option value="20" selected>20 rounds</option><option value="50">50 rounds</option></select></label><label>Clip start<select id="stClipStart"><option value="" selected>Track default</option><option value="0">From the start</option><option value="5">5 seconds in</option><option value="10">10 seconds in</option><option value="15">15 seconds in</option><option value="30">30 seconds in</option></select></label><label>Difficulty<select id="stDifficulty"><option value="1">Easy only</option><option value="2" selected>Easy + medium</option><option value="3">Up to hard</option><option value="4">Up to expert</option><option value="5">Everything</option></select></label></div>
    <p id="stCatalogueCount" class="st-small"></p>
   </section>
   <section class="panel st-company"><p class="st-eyebrow">02 / BRING YOUR PEOPLE</p><h2>The listening club.</h2><p class="st-small">Everyone joins this room on their own device to type answers.</p><div id="stRoster"></div><button id="stRefreshRoster" class="link">Refresh players</button><p id="stChillRules" class="st-small" hidden>Keep listening for as long as you like. Everyone can earn a point each round; there’s no bonus for being first. Friends can join along the way.</p><div class="st-rules"><strong>One correct answer. One point.</strong><p>Guess the game, film, show or a distinctive track name. Small typos are okay. Answers stay private until the reveal.</p><p>Anyone playing can pause the music and timer for the whole room.</p></div><button id="stStart" class="primary st-start">Start the soundtrack →</button><p id="stSetupError" class="form-error" role="alert"></p></section>
  </div>
  <div id="stWaiting" class="panel st-waiting" hidden><span>♫</span><h2>Good company is on its way.</h2><p>The host is choosing the mix. You’ll be ready in a moment.</p></div>
  <div id="stPlay" hidden>
   <div class="st-topline"><div><span id="stRound" class="st-eyebrow"></span><h2 id="stRoundHeading">Listen closely.</h2></div><div class="st-session-tags"><span id="stCategoryTag"></span><span id="stModeTag"></span></div></div>
   <div class="st-arena"><div class="st-main">
    <div class="panel st-television"><div class="st-tv-top"><span>REPARTY FM</span><span id="stLiveLabel">● LIVE ROUND</span></div>
     <div class="st-screen" id="stScreen"><div id="stYoutube"></div><div class="st-curtain" id="stCurtain"><div class="st-stars" aria-hidden="true">✦<span>✧</span>✦</div><span id="stPhaseLabel" class="st-eyebrow">LISTEN CLOSELY</span><div id="stBigNumber" class="st-big-number">15</div><div class="st-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><p id="stScreenHint">What does this remind you of?</p></div><div id="stSoundGate" class="st-sound-gate" hidden><button id="stEnableSound" class="primary">Enable sound</button><p>Your browser needs a click before it can play music.</p></div></div>
     <div class="st-timer-track"><div id="stTimeBar"></div></div><div class="st-tv-controls"><button id="stPause" class="primary">Ⅱ Pause everyone</button><label>My volume<input id="stVolume" type="range" min="0" max="100" value="70" aria-label="My soundtrack volume"></label><button id="stMute" aria-label="Mute my soundtrack">♪</button></div>
    </div>
    <section id="stReveal" class="panel st-reveal" aria-live="polite" hidden><span class="st-eyebrow">THAT WAS…</span><h3 id="stAnswerTitle"></h3><p id="stAnswerTrack"></p><small id="stAnswerCredit"></small><a id="stSourceLink" target="_blank" rel="noopener noreferrer">Watch on YouTube ↗</a></section>
    <button id="stJoin" class="primary" hidden>Join the listening club</button><form id="stGuessForm" class="st-answer-form"><label for="stGuess">Know that sound?</label><div><input id="stGuess" autocomplete="off" maxlength="160" placeholder="Type the game, film, show or track…" required><button id="stGuessSubmit" class="primary">Lock it in →</button></div><p id="stFeedback" role="status" aria-live="polite">Your answer stays between us until time’s up.</p></form>
    <div class="st-host-controls"><span id="stHostNote"></span><button id="stNext">Reveal answer</button><button id="stSkip">Skip track</button><button id="stEnd">End game</button></div>
   </div><aside class="panel st-scoreboard"><span class="st-eyebrow">THE LISTENING CLUB</span><h2 id="stScoreHeading">Scoreboard</h2><div id="stScores"></div><p id="stScoreNote" class="st-small">One point per correct round.<br>Make every memory count.</p></aside></div>
  </div>
  <section id="stFinished" class="panel st-finished" hidden><span class="st-eyebrow">THAT’S A WRAP</span><div class="st-trophy" aria-hidden="true">★</div><h2 id="stWinner"></h2><p id="stResultSubtitle"></p><div id="stFinalScores"></div><button id="stAgain" class="primary">Start a new game →</button></section>
  <details id="stHistory" class="panel st-history" hidden><summary>Tonight’s soundtracks</summary><ol id="stHistoryList"></ol></details>
  <footer class="st-footer"><span id="stStatus"></span><button id="stTakeover" hidden>Take over hosting</button><button id="stHome">Back to modes</button><button id="stLeave">Back to watch party</button></footer>`;
 document.querySelector('.app').append(root);
 const artworkPanel=make('div',undefined,'st-artwork');artworkPanel.hidden=true;
 artworkPanel.innerHTML='<img id="stArtworkImage" hidden alt=""><p id="stArtworkMessage">Finding the cover…</p><a id="stArtworkCredit" target="_blank" rel="noopener noreferrer" hidden>Artwork via Wikipedia ↗</a>';
 $('stScreen').append(artworkPanel);
 function revealArtwork(answer){
  const key=answer?JSON.stringify([answer.title,answer.category,answer.year]):null;
  artworkPanel.hidden=!answer;$('stCurtain').hidden=!!answer;
  if(key===artworkKey)return;artworkKey=key;const request=++artworkRequest;
  artworkController?.abort();$('stArtworkImage').hidden=true;$('stArtworkImage').removeAttribute('src');$('stArtworkCredit').hidden=true;
  $('stArtworkMessage').hidden=false;$('stArtworkMessage').textContent='Finding the cover…';
  if(!answer)return;
  const show=art=>{
   if(request!==artworkRequest)return;
   if(!art){$('stArtworkMessage').textContent='♫ '+answer.title;return;}
   const img=$('stArtworkImage');img.alt=`${answer.title} — cover artwork`;
   img.onload=()=>{if(request===artworkRequest){img.hidden=false;$('stArtworkMessage').hidden=true;$('stArtworkCredit').hidden=false;}};
   img.onerror=()=>{if(request===artworkRequest){img.hidden=true;$('stArtworkMessage').hidden=false;$('stArtworkMessage').textContent='♫ '+answer.title;}};
   $('stArtworkCredit').href=art.source;img.src=art.image;
  };
  if(artworkCache.has(key)){show(artworkCache.get(key));return;}
  artworkController=new AbortController();
  const params=new URLSearchParams({title:answer.title,category:answer.category,year:String(answer.year||'')});
  fetch(`/api/reparty-artwork?${params}`,{signal:artworkController.signal}).then(r=>r.ok?r.json():{artwork:null}).then(data=>{
   if(data.artwork){try{const imageUrl=new URL(data.artwork.image),sourceUrl=new URL(data.artwork.source);if(imageUrl.protocol!=='https:'||!['upload.wikimedia.org','thumb.wikimedia.org'].includes(imageUrl.hostname)||sourceUrl.origin!=='https://en.wikipedia.org')data.artwork=null;}catch{data.artwork=null;}}
   artworkCache.set(key,data.artwork||null);show(data.artwork);
  }).catch(e=>{if(e.name!=='AbortError')show(null);});
 }
 const choice=name=>root.querySelector(`input[name="${name}"]:checked`).value;
 const host=()=>state?.host===getUser()?.id;
 const me=()=>state?.players?.find(p=>p.id===getUser()?.id);
 const myUnit=()=>state?.mode==='group'?'group':state?.mode==='teams'?`team-${me()?.team}`:getUser()?.id;
 const solved=()=>!!state?.solved?.includes(myUnit());
 function left(){return state?.paused?Number(state.remaining_ms||0):Math.max(0,Date.parse(state?.deadline||0)-Date.now()-offset);}
 async function act(action,data={},quiet=false){
  if(!connected||busy)return;
  busy=true;controls();const sentToken=state?.token;
  try { const r=await send(action,{revision:state?.revision||0,token:state?.token,...data});
   if(r?.quiz_feedback&&state?.token===sentToken){ownFeedback=r.quiz_feedback;feedbackToken=state?.token;if(ownFeedback==='correct')$('stGuess').value='';feedback();}
   return r;
  } catch(e){if(!quiet){const msg=/reparty_soundtrack|schema cache|PGRST202/i.test(e.message||'')?'Guess the Soundtrack needs its database update.':e.message||'Could not update the game.';notify(msg);$('stSetupError').textContent=msg;}}
  finally{busy=false;controls();}
 }
 function buildRoster(){
  roster=members.map((m,i)=>({id:m.user_id,name:m.name,avatar_id:m.avatar_id,team:String(i%2+1),included:true}));
  renderRoster();
 }
 function renderRoster(){
  const chill=choice('stMode')==='chill';$('stRoundsLabel').hidden=chill;$('stChillRules').hidden=!chill;count();
  $('stRoster').replaceChildren(...roster.map(p=>{
   const row=make('div',undefined,'st-roster-row');const label=make('label');const c=make('input');c.type='checkbox';c.checked=p.included;c.onchange=()=>{p.included=c.checked;controls();};
   label.append(c,avatar(p.avatar_id,p.name),make('span',p.name));row.append(label);
   if(choice('stMode')==='teams'){const select=make('select');select.setAttribute('aria-label',`Team for ${p.name}`);for(let i=1;i<=4;i++){const o=make('option',`Team ${i}`);o.value=String(i);select.append(o);}select.value=p.team;select.onchange=()=>p.team=select.value;row.append(select);}
   return row;
  }));controls();
 }
 function count(){
  if(!summary){$('stCatalogueCount').textContent='Games, movies, Disney, Pixar and DreamWorks. Choose your mix.';return;}
  const cat=choice('stCategory'),diff=Number($('stDifficulty').value);
  const n=summary.mixes?.[cat]?.[diff]??summary.counts.filter(x=>(cat==='mixed'||x.category===cat)&&x.difficulty<=diff).reduce((sum,x)=>sum+x.playable,0);
  $('stCatalogueCount').textContent=`${n.toLocaleString()} linked tracks in this mix · ${choice('stMode')==='chill'?'short rounds, no finish line':'no repeats within a game'}.`;
 }
 fetch('./soundtracks/summary.json?v=disney1').then(r=>r.ok?r.json():null).then(s=>{summary=s;count();}).catch(()=>{});
 root.querySelectorAll('input[name="stMode"]').forEach(n=>n.onchange=renderRoster);
 root.querySelectorAll('input[name="stCategory"]').forEach(n=>n.onchange=count);$('stDifficulty').onchange=count;
 $('stRefreshRoster').onclick=buildRoster;
 $('stStart').onclick=()=>{ $('stSetupError').textContent='';return act('start',{mode:choice('stMode'),category:choice('stCategory'),seconds:Number($('stSeconds').value),clip_start:$('stClipStart').value===''?null:Number($('stClipStart').value),rounds:Number($('stRounds').value),difficulty:Number($('stDifficulty').value),players:roster.filter(p=>p.included).map(p=>({id:p.id,team:p.team}))});};
 $('stJoin').onclick=()=>act('join');
 $('stGuess').oninput=()=>{ownFeedback='';feedbackToken=null;feedback();};
 $('stGuessForm').onsubmit=e=>{e.preventDefault();act('guess',{answer:$('stGuess').value.trim()});};
 $('stPause').onclick=()=>act(state.paused?'resume':'pause');
 $('stNext').onclick=()=>act('next');$('stSkip').onclick=()=>act('skip');$('stAgain').onclick=()=>act('reset');
 $('stEnd').onclick=()=>act('reset');$('stHome').onclick=()=>onBackToModes?.();
 $('stLeave').onclick=()=>act('exit');$('stTakeover').onclick=()=>act('takeover');
 let volume=70;try{volume=Number(localStorage.getItem('reparty-quiz-volume')??70);}catch{}$('stVolume').value=volume;
 $('stVolume').oninput=()=>{volume=Number($('stVolume').value);try{player?.setVolume(volume);player?.unMute();localStorage.setItem('reparty-quiz-volume',volume);}catch{}$('stMute').textContent='♪';};
 $('stMute').onclick=()=>{if(!playerReady)return;const muted=player.isMuted();muted?player.unMute():player.mute();$('stMute').textContent=muted?'♪':'Muted';$('stMute').setAttribute('aria-label',muted?'Mute my soundtrack':'Unmute my soundtrack');};
 $('stEnableSound').onclick=()=>{needsGesture=false;$('stSoundGate').hidden=true;try{player?.unMute();player?.playVideo();}catch{}};
 function controls(){
  const participant=!!me()||host(), play=active&&connected&&!busy;
  $('stJoin').hidden=state?.mode!=='chill'||!!me();$('stJoin').disabled=!play;
  $('stStart').disabled=!play||!host()||!roster.some(p=>p.included);
  $('stRefreshRoster').disabled=!play||!host();
  $('stPause').disabled=!play||!participant||['setup','finished','unavailable'].includes(state?.phase);
  $('stPause').textContent=state?.paused?'▶ Resume everyone':'Ⅱ Pause everyone';
  $('stGuess').disabled=$('stGuessSubmit').disabled=!play||!me()||state?.phase!=='guess'||state?.paused||solved()||left()<=0;
  $('stNext').hidden=$('stSkip').hidden=!host();$('stNext').disabled=$('stSkip').disabled=!play;
  $('stNext').textContent=['reveal','unavailable'].includes(state?.phase)?'Next track →':'Reveal answer';
  $('stEnd').hidden=!host();$('stEnd').disabled=!play;
  $('stAgain').hidden=!host();$('stAgain').disabled=!play;
  $('stLeave').disabled=!play||!host();$('stTakeover').disabled=!play;
  $('stTakeover').hidden=!active||host()||members.some(m=>m.user_id===state?.host);
 }
 function feedback(){
  let message='Your answer stays between us until time’s up.', style='';
  if(!me())message=state?.mode==='chill'?'Join the listening club whenever you’re ready.':'You’re spectating. Join the next game to score.';
  else if(state?.paused)message='Paused for everyone. Your answer will be here when we resume.';
  else if(solved()){message=state.mode==='teams'?'Your team got it! One point secured.':state.mode==='group'?'You got it together! One point secured.':'You got it! One point secured.';style='correct';}
  else if(state?.phase==='reveal')message='The answer is in. A new memory is coming up…';
  else if(feedbackToken===state?.token&&ownFeedback==='incorrect'){message='Not quite. You can try another answer.';style='incorrect';}
  else if($('stGuess').value.trim())message='Press Enter or Lock it in to submit your guess.';
  $('stFeedback').textContent=message;$('stFeedback').className=style;
 }
 function scores(){
  const rows=[];
  for(const p of state?.players||[]){const id=state.mode==='group'?'group':state.mode==='teams'?`team-${p.team}`:p.id;
   let row=rows.find(x=>x.id===id);if(!row){row={id,name:state.mode==='group'?'The whole room':state.mode==='teams'?`Team ${p.team}`:p.name,score:Number(state.scores?.[id]||0),people:[]};rows.push(row);}row.people.push(p);
  }
  if(state?.mode!=='chill')rows.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));return rows;
 }
 function scoreRows(rows){return rows.map((row,i)=>{const n=make('div',undefined,'st-score-row');if(row.id===myUnit())n.classList.add('is-me');const faces=make('div',undefined,'st-score-faces');row.people.slice(0,4).forEach(p=>faces.append(avatar(p.avatar_id,p.name)));const copy=make('div',undefined,'st-score-copy');copy.append(make('strong',row.name));if(row.people.length>1)copy.append(make('small',row.people.map(p=>p.name).join(', ')));n.append(make('span',state?.mode==='chill'?'♫':String(i+1),'st-rank'),faces,copy,make('b',String(row.score),'st-points'));return n;});}
 async function ensurePlayer(){
  if(player||playerLoading)return;
  playerLoading=true;const attempt=++loadAttempt;
  try{await loadYoutube();if(!active||attempt!==loadAttempt)return;
   player=new window.YT.Player('stYoutube',{width:'100%',height:'100%',host:'https://www.youtube-nocookie.com',playerVars:{playsinline:1,controls:0,disablekb:1,fs:0,rel:0,origin:location.origin},events:{
    onReady(){clearTimeout(playerTimer);playerReady=true;const frame=player.getIframe?.();if(frame){frame.setAttribute('aria-hidden','true');frame.setAttribute('tabindex','-1');frame.inert=true;}player.setVolume(volume);syncMedia(true);},
    onStateChange(e){if(!active)return;if(e.data===5&&state?.phase==='loading'&&player?.getVideoData?.().video_id===state.video_id)reportReady();if(e.data===1){needsGesture=false;$('stSoundGate').hidden=true;if(!['guess','reveal'].includes(state?.phase)||state?.paused){player.pauseVideo();reportReady();}}},
    onAutoplayBlocked(){needsGesture=true;$('stSoundGate').hidden=false;},
    onError(e){playerError=({100:'This track is no longer available.',101:'This track cannot play here.',150:'This track cannot play here.',153:'YouTube could not verify this browser.'})[e.data]||'This track could not load.';renderClock();if(host())act('error',{},true);}
   }});
   playerTimer=setTimeout(()=>{if(playerReady||!active)return;playerError='YouTube could not connect. Check your connection, then reload this page.';renderClock();if(host())act('error',{},true);},15000);
  }catch(e){playerError=e.message;renderClock();if(host())act('error',{},true);}finally{playerLoading=false;}
 }
 function reportReady(){if(readyToken===state?.token||!connected||!active||state?.phase!=='loading')return;readyToken=state.token;send('ready',{token:state.token}).catch(()=>{readyToken=null;});}
 function syncMedia(force=false){
  if(!active||!connected){try{player?.pauseVideo();}catch{}return;}
  if(!state?.video_id||['setup','finished','unavailable'].includes(state.phase)){try{player?.pauseVideo();}catch{}return;}
  ensurePlayer();if(!playerReady)return;
  try{
   if(video!==state.video_id||token!==state.token){video=state.video_id;token=state.token;readyToken=null;playerError='';needsGesture=false;$('stSoundGate').hidden=true;player.cueVideoById({videoId:video,startSeconds:Number(state.start_seconds||0)});return;}
   if(state.phase==='loading'){if([2,5].includes(player.getPlayerState()))reportReady();return;}
   if(['guess','reveal'].includes(state.phase)){
    const elapsed=state.phase==='reveal'?Number(state.reveal_position??state.seconds)+Math.max(0,10-left()/1000):Math.max(0,Number(state.seconds)-left()/1000);
    const position=Number(state.start_seconds||0)+elapsed;
    if(force||Math.abs(player.getCurrentTime()-position)>1.5){player.seekTo(position,true);lastSync=Date.now();}
    if(state.paused||left()<=0)player.pauseVideo();else if(!needsGesture&&player.getPlayerState()!==1)player.playVideo();
   }else player.pauseVideo();
  }catch{}
 }
 function renderClock(){
  if(!active||!state)return;const phase=state.phase,remaining=left();
  const hint=playerError||(state.paused?'Take your time. We’re all paused.':phase==='loading'?`${state.ready?.length||0} listener${state.ready?.length===1?'':'s'} ready`:phase==='countdown'?'Get ready. Your next memory starts now.':phase==='guess'?'Name the game, film, show or track.':phase==='reveal'?'A new memory is coming up…':phase==='unavailable'?'The host can skip this track.':'');
  $('stScreenHint').textContent=hint;$('stPhaseLabel').textContent=state.paused?'PAUSED FOR EVERYONE':({loading:'TUNING IN',countdown:'READY?',guess:'LISTEN CLOSELY',reveal:'DID YOU GET IT?',unavailable:'TRACK UNAVAILABLE'})[phase]||'';
  $('stBigNumber').textContent=state.paused?'Ⅱ':phase==='loading'?'♫':phase==='unavailable'?'!':String(Math.max(0,Math.ceil(remaining/1000)));
  $('stLiveLabel').textContent=state.paused?'Ⅱ PAUSED':phase==='reveal'?`NEXT TRACK IN ${Math.ceil(remaining/1000)}s`:phase==='guess'?'● LIVE ROUND':'REPARTY FM';
  $('stScreen').classList.toggle('is-playing',phase==='guess'&&!state.paused&&!needsGesture);
  $('stScreen').classList.toggle('is-urgent',phase==='guess'&&remaining<4000&&!state.paused);
  const duration=phase==='guess'?Number(state.seconds)*1000:phase==='countdown'?3000:phase==='reveal'?10000:12000;
  $('stTimeBar').style.width=`${Math.max(0,Math.min(100,remaining/duration*100))}%`;
 }
 setInterval(()=>{
  if(!active||!state)return;renderClock();controls();
  if(Date.now()-lastSync>2000){lastSync=Date.now();syncMedia();}
  if(connected&&!ticking&&!state.paused&&left()<=0&&!['setup','finished','unavailable'].includes(state.phase)&&Date.now()-lastTick>750){
   lastTick=Date.now();ticking=true;send('tick',{token:state.token}).catch(()=>{}).finally(()=>ticking=false);
  }
 },200);
 function update(next,nextMembers=[],nextRoom=null,serverOffset=0,isActive=false){
  const priorActive=active,priorToken=state?.token,priorPhase=state?.phase,priorPaused=state?.paused;
  state=next||null;members=nextMembers;roomId=nextRoom;offset=serverOffset;active=isActive;
  root.hidden=!active;document.documentElement.classList.toggle('soundtrack-mode',active);
  if(active!==priorActive)onActive(active);
  if(!active){revealArtwork(null);syncMedia();if(!roomId)rosterRoom=null;return;}
  if(state?.token!==priorToken){ownFeedback='';feedbackToken=null;$('stGuess').value='';}
  const phase=state?.phase||'setup';
  $('stSetup').hidden=phase!=='setup'||!host();$('stWaiting').hidden=phase!=='setup'||host();
  $('stPlay').hidden=['setup','finished'].includes(phase);$('stFinished').hidden=phase!=='finished';
  root.querySelector('.st-heading').hidden=phase!=='setup';
  if(phase==='setup'&&(rosterRoom!==roomId||priorPhase!=='setup')){rosterRoom=roomId;buildRoster();count();}
  else if(phase==='setup'&&host()){
   const nextRoster=members.map((m,i)=>({...roster.find(p=>p.id===m.user_id),id:m.user_id,name:m.name,avatar_id:m.avatar_id,team:roster.find(p=>p.id===m.user_id)?.team||String(i%2+1),included:roster.find(p=>p.id===m.user_id)?.included??true}));
   if(JSON.stringify(nextRoster)!==JSON.stringify(roster)){roster=nextRoster;renderRoster();}
  }
  const hostName=members.find(m=>m.user_id===state?.host)?.name||'Your host';
  $('stStatus').textContent=connected?`${hostName} is hosting · Space to pause everyone`:'Reconnecting… the room will catch up automatically.';
  $('stRound').textContent=state?.mode==='chill'?`TRACK ${String(state.round||1).padStart(2,'0')} · CHILL MODE`:`ROUND ${String(state?.round||1).padStart(2,'0')} / ${state?.total||0}`;
  $('stRoundHeading').textContent=phase==='reveal'?'A memory unlocked.':state?.paused?'A little intermission.':'Listen closely.';
  $('stCategoryTag').textContent=categories[state?.category]||'';$('stModeTag').textContent=modes[state?.mode]||'';
  $('stHostNote').textContent=host()?'You’re hosting. Everyone can pause.':`${hostName} controls the rounds. Everyone can pause.`;
  const answer=state?.answer;$('stReveal').hidden=!answer;
  revealArtwork(answer);
  if(answer){$('stAnswerTitle').textContent=answer.title;$('stAnswerTrack').textContent=answer.track;$('stAnswerCredit').textContent=[answer.year,answer.composer].filter(Boolean).join(' · ');$('stSourceLink').href=`https://www.youtube.com/watch?v=${state.video_id}`;}
  const rows=scores();$('stScores').replaceChildren(...scoreRows(rows));$('stScoreHeading').textContent=state?.mode==='group'?'Our shared score':state?.mode==='chill'?'Memories unlocked':'Scoreboard';
  $('stScoreNote').textContent=state?.mode==='chill'?'One point each when you know it. No race, no winner—just keep listening.':'One point per correct round. Make every memory count.';
  $('stHistory').querySelector('summary').textContent=state?.mode==='chill'?'Recent soundtracks':'Tonight’s soundtracks';
  if(phase==='finished'){
   const winners=rows.filter(x=>x.score===rows[0]?.score);$('stWinner').textContent=state.mode==='group'?`${rows[0]?.score||0} memories unlocked.`:winners.length>1?'A shared spotlight.':`${rows[0]?.name||'The room'} takes the spotlight!`;
   const points=rows[0]?.score||0;
   $('stResultSubtitle').textContent=state.mode==='group'?`Together, you recognised ${points} of ${state.total} soundtracks.`:winners.map(x=>x.name).join(' & ')+` · ${points} point${points===1?'':'s'} · ${state.total} round${state.total===1?'':'s'}`;
   $('stFinalScores').replaceChildren(...scoreRows(rows));
  }
  $('stHistory').hidden=!state?.history?.length;$('stHistoryList').replaceChildren(...(state?.history||[]).map(h=>{const n=make('li');n.append(make('strong',h.title),make('span',h.track));return n;}));
  if(state?.paused!==priorPaused||phase!==priorPhase||priorToken!==state?.token)syncMedia(true);else syncMedia();
  feedback();controls();renderClock();
 }
 return {update,enter:()=>send('enter',{}),leave:()=>act('exit'),active:()=>active,setConnected(value){const changed=connected!==value;connected=value;controls();if(changed)syncMedia(true);},pause(){if(active)$('stPause').click();}};
}
