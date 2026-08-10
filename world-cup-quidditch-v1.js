/* ============================================================
   REPO SPORTS WORLD CUP — AUTOMATED QUIDDITCH BROADCAST V1
   Belros vs Zafran prototype. 50/50 team balance by construction.
   No Golden Snitch. Standard RepoSports Quidditch remains untouched.
   ============================================================ */
(() => {
  if (window.__repoWorldCupQuidditchV1Installed) return;
  window.__repoWorldCupQuidditchV1Installed = true;

  const BASE = 'assets/world-cup-game-v1/';
  const W = 1672, H = 941;
  const INTRO_SECONDS = 30;
  const PREMATCH_ANTHEM = BASE+'prematch-anthem.mp3';
  const PLAYER_RIDE_HEIGHT = 113.4, PLAYER_STAND_HEIGHT = 90.3;
  const REF_FLY_HEIGHT = 57.5, REF_STAND_HEIGHT = 55.2;
  const PLAYER_SCALE = {jud:1.34,nimbler:.82,bramble:1,zizi:1,rafi:1,saffi:1};
  const HALF_SECONDS = 9 * 60;
  const MATCH_SECONDS = 18 * 60;
  const MATCH_CHANNEL = 'repo-world-cup-belros-zafran-v1';
  const $ = id => document.getElementById(id);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const lerp = (a,b,t) => a + (b-a)*t;
  const ease = t => 1 - Math.pow(1-clamp(t,0,1),3);
  const other = team => team === 'belros' ? 'zafran' : 'belros';

  // Flight envelope. HARD bounds are emergency containment only; AI targets live
  // inside SOFT bounds so riders turn before they ever grind along a screen edge.
  const FLIGHT = {hardX0:.065,hardX1:.935,softX0:.105,softX1:.895,hardY0:.205,hardY1:.775,softY0:.235,softY1:.735,wallLook:.095};
  // Continuous-flow tuning: riders should almost never look parked in open play.
  const FLOW = {minCruise:.040,arrivalRadius:.058,hoverTrigger:.48,escapeImpulse:.070,driftX:.010,driftY:.016,clusterRadius:.068};
  const safeX = x => clamp(x,FLIGHT.softX0,FLIGHT.softX1);
  const safeY = y => clamp(y,FLIGHT.softY0,FLIGHT.softY1);
  const dist2 = (a,b) => Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0));
  const currentName = () => { try { return String(window.character?.username || character?.username || 'Guest'); } catch (_) { return 'Guest'; } };
  const isHost = () => currentName().toLowerCase() === 'catasthma';

  function hashSeed(text){
    let h=2166136261>>>0;
    for(let i=0;i<String(text).length;i++){h^=String(text).charCodeAt(i);h=Math.imul(h,16777619)}
    return h>>>0;
  }
  function mulberry32(seed){return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

  const roster = {
    belros:[
      {id:'jud',name:'JUD',role:'defender',risk:.84,standing:BASE+'jud-standing.webp',riding:BASE+'jud-riding.webp',short:'Veteran wall',lore:[
        'JUD built a career on making attackers hesitate before they even commit.',
        'The veteran from Judland is in the final stage of his career — every World Cup interception carries extra weight.',
        'JUD is Nimbler 2000’s uncle. You can see the family resemblance mostly in the arguments about what counts as necessary risk.',
        'Belros supporters have spent years measuring JUD in blocked routes and interceptions rather than headlines.',
        'JUD once crossed the Origins rivalry to play in Iskandar. That technical education still shows in the way he reads attacking intent.'
      ]},
      {id:'nimbler',name:'NIMBLER 2000',role:'attacker',risk:1.18,standing:BASE+'nimbler-2000-standing.webp',riding:BASE+'nimbler-2000-riding.webp',short:'Brilliant menace',lore:[
        'Nimbler treats warning signs as challenges. Coaches have learned that this is not a metaphor.',
        'JUD’s nephew built his own reputation by choosing risk instead of copying his uncle’s defensive game.',
        'The RepoSports star has always looked one decision away from disaster — and somehow that is where many of his best moments begin.',
        'Nimbler’s spell in Talune taught patience without removing the dangerous instinct. Soup would probably say the patience remains a work in progress.',
        'His greatest private fear is being ordinary. There is very little danger of that tonight.'
      ]},
      {id:'bramble',name:'BRAMBLE',role:'support',risk:1.0,standing:BASE+'bramble-standing.webp',riding:BASE+'bramble-riding.webp',short:'Downs favourite',lore:[
        'Bramble is Belros’s favourite white ram — steady, physical and almost impossible for supporters not to like.',
        'The Bramble Downs favourite built a career on reliability rather than spectacular statistics.',
        'Children wait for Bramble at stadium gates because he almost always stops to greet them.',
        'One clarification for new viewers: Bramble the player is not Barry Bramble the commentator. Barry insists this has never confused him once.',
        'Bramble is the emotional ballast of this Belros trio: JUD brings history, Nimbler brings chaos, Bramble keeps the whole thing human.'
      ]}
    ],
    zafran:[
      {id:'zizi',name:'ZIZI',role:'attacker',risk:1.18,standing:BASE+'zizi-standing.webp',riding:BASE+'zizi-riding.webp',short:'Counterattack mind',lore:[
        'Zizi grew up in a family tea house and learned to watch people before they realised they were being read.',
        'That cheerful expression hides one of Zafran’s sharpest tactical minds.',
        'Zizi’s game changed in Qasmir, where instinct became deliberate counterattacking structure.',
        'Every away city gets a postcard sent back to the family tea house. Vardesh will be joining the collection.',
        'Zafran wants patience to look dangerous this World Cup. Zizi is usually the person setting the trap.'
      ]},
      {id:'rafi',name:'RAFI',role:'defender',risk:.84,standing:BASE+'rafi-standing.webp',riding:BASE+'rafi-riding.webp',short:'Patient reader',lore:[
        'Rafi grew up on an apricot orchard. Waiting for harvests became a surprisingly useful defensive education.',
        'Zafran’s dependable older-sibling figure is happiest when opponents hurry themselves into the wrong choice.',
        'After defeats, Rafi cooks for teammates instead of immediately discussing the result.',
        'Rafi’s defensive game is built around patience: absorb the excitement, then act when the mistake arrives.',
        'There is very little panic in Rafi’s game. That calm is one reason Zahara Gold built the shape around this player.'
      ]},
      {id:'saffi',name:'SAFFI',role:'support',risk:1.0,standing:BASE+'saffi-standing.webp',riding:BASE+'saffi-riding.webp',short:'Patterned passer',lore:[
        'Saffi grew up around textile patterns and still sketches passing rotations like fabric motifs.',
        'Years in Lumerre taught Saffi to see repeated movement as geometry rather than decoration.',
        'Zafran’s technical aesthete wants the country remembered for controlled passing as much as patience.',
        'Saffi’s notebooks contain tactical diagrams that look suspiciously like textile designs. Saffi says the distinction is unnecessary.',
        'The Lumerrean influence is obvious when Saffi starts rotating the ball through repeating lanes.'
      ]}
    ]
  };
  const allPlayers = [...roster.belros,...roster.zafran];
  const byId = Object.fromEntries(allPlayers.map(p=>[p.id,p]));

  const teamMeta = {
    belros:{name:'BELROS',abbr:'BEL',colour:'#b63a2c',attack:1},
    zafran:{name:'ZAFRAN',abbr:'ZAF',colour:'#d2aa36',attack:-1}
  };

  const commentary = {
    intro:[
      'Good evening from the Crown of Vardesh Glacier. Six players, one frozen stage, and absolutely nowhere to hide.',
      'The aurora is out, the stands are full, and I have been told the tea is technically still drinkable. World Cup Quidditch is nearly here.',
      'Belros against Zafran: history and force against patience and design. This should be a fascinating collision of ideas.',
      'No Golden Snitch tonight. This match will be decided by goals, defending, discipline and whatever the referee decides VAR was invented for.',
      'The temperature is brutal. The atmosphere is not. Welcome to the Repo Sports World Cup.'
    ],
    kickoff:[
      'The whistle goes — Belros and Zafran are airborne!',
      'We are under way at the Crown of Vardesh Glacier!',
      'Brooms lift together and the first World Cup test is live!',
      'The Quaffle is live. Belros face Zafran, and my tea is already in danger.'
    ],
    pass:[
      ({from,to})=>`${from} moves it cleanly to ${to}.`,
      ({from,to})=>`A measured pass from ${from}; ${to} keeps the move alive.`,
      ({from,to})=>`${from} draws pressure and releases ${to}.`,
      ({from,to})=>`Quick circulation — ${from} finds ${to}.`,
      ({from,to})=>`${to} gives ${from} an angle and the ball arrives exactly on cue.`,
      ({from,to})=>`No wasted motion from ${from}; the Quaffle is already with ${to}.`,
      ({from,to})=>`${from} sends it through the lane to ${to}.`,
      ({from,to})=>`Good spacing. ${from} waits, then feeds ${to}.`,
      ({from,to})=>`The defence shifts and ${from} immediately finds ${to}.`,
      ({from,to})=>`${from} keeps possession moving — ${to} is the next link.`
    ],
    drive:[
      ({pet})=>`${pet} carries directly into the space ahead.`,
      ({pet})=>`${pet} accelerates and forces the defence backwards.`,
      ({pet})=>`A change of pace from ${pet}; the hoops are getting closer.`,
      ({pet})=>`${pet} keeps the Quaffle and attacks the gap.`,
      ({pet})=>`No pass this time — ${pet} drives straight through the middle.`
    ],
    intercept:[
      ({pet,from})=>`Brilliant anticipation from ${pet}! The pass from ${from} is gone.`,
      ({pet})=>`${pet} steps into the lane and steals the Quaffle cleanly!`,
      ({pet})=>`That is a proper interception from ${pet} — read before it was thrown.`,
      ({pet})=>`${pet} has seen the picture early and shut the passing lane.`,
      ({pet})=>`Possession changes hands! ${pet} gets there first.`,
      ({pet})=>`Outstanding defensive timing by ${pet}.`,
      ({pet})=>`${pet} turns defence into attack in one movement.`,
      ({pet})=>`The Quaffle was never arriving — ${pet} had already solved the pass.`
    ],
    shot:[
      ({pet})=>`${pet} sees the hoops and lets it fly!`,
      ({pet})=>`A shooting lane opens for ${pet}!`,
      ({pet})=>`${pet} goes for goal — watch the accuracy here.`,
      ({pet})=>`The release is quick from ${pet}; the Quaffle is travelling!`,
      ({pet})=>`${pet} commits to the shot!`,
      ({pet})=>`No second thought from ${pet}. This is heading for the hoops.`,
      ({pet})=>`${pet} takes the angle before the defence can close it.`
    ],
    goal:[
      ({pet,team,score})=>`GOAL! ${pet} for ${team}! ${score}.`,
      ({pet})=>`${pet} threads it through the hoop! That is beautifully placed.`,
      ({pet})=>`That is clinical from ${pet}! The netless target does not matter when the accuracy is that good.`,
      ({pet})=>`${pet} scores! The Glacier erupts!`,
      ({pet})=>`Right through the centre — ${pet} makes absolutely certain.`,
      ({pet})=>`A World Cup finish from ${pet}! No chance of keeping that out.`,
      ({pet})=>`The pressure becomes a goal and ${pet} is the name on it.`,
      ({pet})=>`Superb finish! ${pet} has picked the hoop and hit it.`,
      ({pet})=>`${pet} converts the opening — that attack deserved an ending.`,
      ({pet})=>`The Quaffle flies home! ${pet} wheels away to celebrate.`
    ],
    miss:[
      ({pet})=>`${pet} pulls it wide! The opening was there, the finish was not.`,
      ({pet})=>`Too high from ${pet}. The crowd could feel that chance building.`,
      ({pet})=>`${pet} misses the target — the angle narrowed faster than expected.`,
      ({pet})=>`That one drifts beyond the hoop. ${pet} knows it was available.`,
      ({pet})=>`A rare waste from ${pet}; Zafran and Belros both know those chances matter.`,
      ({pet})=>`${pet} had the right idea and the wrong final few inches.`
    ],
    save:[
      ({pet,defender})=>`${defender} gets across and denies ${pet}!`,
      ({defender})=>`Strong goal-line defending from ${defender}.`,
      ({defender})=>`${defender} reads the shot and gets something in the way.`,
      ({defender})=>`Saved! ${defender} has covered the hoop beautifully.`,
      ({defender})=>`That is excellent recovery from ${defender}.`
    ],
    post:[
      ({pet})=>`OFF THE RING! ${pet} was inches away.`,
      ({pet})=>`The metal says no to ${pet}! Rebound is live.`,
      ({pet})=>`${pet} clips the hoop and the Quaffle spins back into danger.`,
      ({pet})=>`A brutal sound for ${pet} — straight off the ring!`,
      ({pet})=>`So close! ${pet} finds metal rather than daylight.`
    ],
    rebound:[
      ({pet})=>`${pet} reacts first to the rebound.`,
      ({pet})=>`Loose Quaffle claimed by ${pet}.`,
      ({pet})=>`${pet} gathers the ricochet and this phase is not over yet.`,
      ({pet})=>`The ring sends it back and ${pet} is quickest to the second ball.`,
      ({pet})=>`${pet} wins the scramble beneath the hoops.`
    ],
    foul:[
      ({offender,victim})=>`WHISTLE! ${offender} catches ${victim} late.`,
      ({offender})=>`The referee has seen enough — foul against ${offender}.`,
      ({offender,victim})=>`${victim} is knocked off the line and ${offender} is immediately called for it.`,
      ({offender})=>`Too much broom, not enough Quaffle from ${offender}.`,
      ({offender})=>`${offender} mistimes the challenge. The referee is straight onto it.`,
      ({offender})=>`That is a dangerous angle from ${offender}; play stops.`
    ],
    penalty:[
      ({team})=>`Penalty to ${team}. Everyone clears away — this is one player, three hoops, one decision.`,
      ({pet})=>`${pet} has the penalty. The Glacier has suddenly become very quiet.`,
      ({pet})=>`A long look at the referee, a longer look at the hoops. ${pet} is ready.`,
      ({pet})=>`${pet} against the goal area. Nothing complicated now — just execution.`
    ],
    var:[
      'Hold on. They are checking this upstairs.',
      'VAR wants another look. Nobody move; apparently we have discovered paperwork on broomsticks.',
      'The referee has been called into the review. The stadium does not enjoy waiting.',
      'We are going frame by frame. Somewhere, somebody is drawing a very serious line.',
      'VAR check in progress. Every replay makes half the stadium more certain and the other half more furious.'
    ],
    halftime:[
      'Half-time at the Crown of Vardesh Glacier. Nine minutes gone and nobody gets to hide from the numbers now.',
      'That is the first half. Brooms down, breath visible, and plenty for both sides to discuss.',
      'The whistle ends the first nine minutes. We wait for CatAsthma to send them back out.'
    ],
    fulltime:[
      'FULL TIME! Eighteen minutes of World Cup Quidditch are complete.',
      'That is it at the Glacier. The referee checks the clock and brings the broadcast to full time.',
      'The final whistle goes. No Snitch, no shortcut — this result was built one possession at a time.'
    ]
  };


  // Barry's live commentary is built combinatorially so matches have thousands of
  // short, event-specific calls without shipping a giant wall of duplicated text.
  function addCommentaryVariants(kind,prefixes,verbs,tails,builder){
    const bank=commentary[kind]||(commentary[kind]=[]);
    prefixes.forEach(prefix=>verbs.forEach(verb=>tails.forEach(tail=>{
      bank.push(data=>builder(prefix,verb,tail,data||{}));
    })));
  }
  function buildBarryCommentaryLibrary(){
    const passPrefixes=['','Quickly, ','Smartly, ','First time, ','Under pressure, ','With one look, ','On the move, ','Nice and simple: ','As the lane opens, ','Before the press arrives, ','With the defence shifting, ','Without breaking stride, ','Patiently, ','Good awareness: '];
    const passVerbs=['finds','feeds','releases','picks out','spots','serves','connects with','slides it to','moves it to','fizzes it to','loops it toward','nudges it to'];
    const passTails=['{to}.','{to} in stride.','{to} early.','{to} through the lane.','{to} with room.','{to} on the move.','{to} across the pitch.','{to} before pressure arrives.'];
    addCommentaryVariants('pass',passPrefixes,passVerbs,passTails,(a,b,c,d)=>`${a}${d.from} ${b} ${c.replace('{to}',d.to)}`);

    const drivePrefixes=['','Now ','Suddenly, ','With room, ','Directly, ','Through the middle, ','On the outside, ','With a burst, ','Head up, ','No pass here: '];
    const driveVerbs=['drives','surges','accelerates','pushes','carries','bursts','glides','cuts','powers','presses'];
    const driveTails=['forward.','into space.','at the defence.','toward the hoops.','through the gap.','past the first line.','into the final third.','with purpose.'];
    addCommentaryVariants('drive',drivePrefixes,driveVerbs,driveTails,(a,b,c,d)=>`${a}${d.pet} ${b} ${c}`);

    const interceptPrefixes=['','Excellent read: ','Sharp defending: ','Right on cue, ','Across the lane, ','With perfect timing, ','Out of nowhere, ','Tracking it all the way, ','Danger spotted, ','No hesitation, ','Goal-side and alert, ','That lane closes: '];
    const interceptVerbs=['reads it','cuts it out','steps in','wins it','takes it','gets there','claims it','snuffs it out','breaks it up','beats the pass','closes the lane','steals possession'];
    const interceptTails=['cleanly.','and turns play.','before it arrives.','at full stretch.','with room to break.','and the attack is over.','before the receiver can react.','then looks forward.'];
    addCommentaryVariants('intercept',interceptPrefixes,interceptVerbs,interceptTails,(a,b,c,d)=>`${a}${d.pet} ${b} ${c}`);

    const shotPrefixes=['','Here comes ','Space for ','A sight of goal for ','No hesitation from ','Opening there for ','The angle appears for ','One look from ','Pressure coming, but ','From range, '];
    const shotVerbs=['shoots','lets it go','takes it on','fires','releases','goes for goal','strikes','attacks the hoop','tries the angle','commits'];
    const shotTails=['now!','early!','through traffic!','with power!','across goal!','under pressure!','from distance!','before the gap closes!'];
    addCommentaryVariants('shot',shotPrefixes,shotVerbs,shotTails,(a,b,c,d)=>`${a}${d.pet} ${b} ${c}`);

    const goalPrefixes=['GOAL! ','It is in! ','Brilliant! ','Clinical! ','What a finish! ','That is superb! ','The Glacier erupts! ','Right through! ','No stopping that! ','They have their reward! ','Big moment! ','Beautifully done! '];
    const goalVerbs=['scores','converts','finds the hoop','finishes it','buries it','makes it count','puts it away','beats the defence','threads it home','ends the move'];
    const goalTails=['for {team}!','and it is {score}!','with real authority!','after a lovely move!','when it matters!','and wheels away!','from a tight angle!','to finish the attack!'];
    addCommentaryVariants('goal',goalPrefixes,goalVerbs,goalTails,(a,b,c,d)=>`${a}${d.pet} ${b} ${c.replace('{team}',d.team||'').replace('{score}',d.score||'')}`.replace(/\s+!/g,'!'));

    const missPrefixes=['','Just wide! ','Not quite! ','So close! ','That was there! ','A fraction off! ','The chance goes! ','The crowd gasps! ','Nearly! ','Agonisingly, '];
    const missVerbs=['pulls it wide','sends it high','misses the hoop','drags it across','cannot find the ring','flashes it past','gets the angle wrong','overhits it','sends it beyond','cannot convert'];
    const missTails=['this time.','under pressure.','by inches.','from there.','after good work.','at the last moment.','with the keeper beaten.'];
    addCommentaryVariants('miss',missPrefixes,missVerbs,missTails,(a,b,c,d)=>`${a}${d.pet} ${b} ${c}`);

    const savePrefixes=['SAVE! ','Excellent stop! ','Denied! ','Huge hands! ','Strong defending! ','Across in time! ','What a stop! ','Read perfectly! ','Goal protected! ','That is brave! '];
    const saveVerbs=['gets there','blocks it','turns it away','covers the hoop','shuts it down','makes the stop','meets the shot','gets across','denies the chance','holds firm'];
    const saveTails=['cleanly.','under pressure.','at full stretch.','just in time.','and keeps it out.','with a strong read.','before the rebound.','from close range.'];
    addCommentaryVariants('save',savePrefixes,saveVerbs,saveTails,(a,b,c,d)=>`${a}${d.defender} ${b} ${c}`);

    const postPrefixes=['OFF THE RING! ','Metal! ','So close! ','The ring saves them! ','What a sound! ','Inches away! ','Almost perfect! ','That rattles the hoop! '];
    const postVerbs=['clips it','strikes it','catches it','rattles it','finds metal','hits the frame','glances the ring','smashes the ring'];
    const postTails=['and it stays live.','with the rebound loose.','by inches.','after a fierce shot.','and everyone reacts.','before spinning clear.','with no luck at all.'];
    addCommentaryVariants('post',postPrefixes,postVerbs,postTails,(a,b,c,d)=>`${a}${d.pet} ${b} ${c}`);

    const reboundPrefixes=['','Loose ball: ','Rebound live: ','Second chance: ','Quick reaction: ','In the scramble, ','Off the ricochet, ','First to it: '];
    const reboundVerbs=['gathers it','claims it','gets there','wins it','collects it','takes control','reacts first','comes away with it'];
    const reboundTails=['cleanly.','under pressure.','and turns away.','before the defence.','to keep it alive.','with bodies around.','and resets the move.'];
    addCommentaryVariants('rebound',reboundPrefixes,reboundVerbs,reboundTails,(a,b,c,d)=>`${a}${d.pet} ${b} ${c}`);

    const foulPrefixes=['WHISTLE! ','Late one! ','The referee steps in! ','Too much contact! ','That is careless! ','Play stops! ','No advantage there! ','Immediate whistle! '];
    const foulVerbs=['catches {victim}','clips {victim}','arrives late on {victim}','blocks {victim}','leans into {victim}','takes out {victim}','overcommits on {victim}','mistimes it on {victim}'];
    const foulTails=['and is penalised.','too late.','with the ball gone.','and knows it.','right in front of the referee.','at a bad angle.','during the challenge.'];
    addCommentaryVariants('foul',foulPrefixes,foulVerbs,foulTails,(a,b,c,d)=>`${a}${d.offender} ${b.replace('{victim}',d.victim)} ${c}`);

    const penaltyPrefixes=['Penalty. ','Big chance now. ','The arena quietens. ','One player, three hoops. ','Everything stops here. ','Pressure moment. ','The referee clears the lane. ','This is isolated now. '];
    const penaltyVerbs=['steps up','takes responsibility','has the ball','faces the hoops','waits for the whistle','sets the angle','looks composed','has the chance'];
    const penaltyTails=['for {team}.','under real pressure.','with everyone watching.','and the crowd holds its breath.','for a huge opportunity.','before the attempt.'];
    addCommentaryVariants('penalty',penaltyPrefixes,penaltyVerbs,penaltyTails,(a,b,c,d)=>`${a}${d.pet} ${b} ${c.replace('{team}',d.team||'')}`);

    // Short phase calls add variety between events without Barry narrating every touch.
    commentary.counterattack=[]; commentary.chance=[]; commentary.pressure=[];
    const counterOpen=['Break on','Space ahead for','Turnover — now','They can run here:','This is opening for','Quick transition from','Numbers forward for','Suddenly there is room for'];
    const counterTail=['on the break.','with space.','into open ice.','before the shape resets.','and the defence is retreating.','with support arriving.','at real speed.','through the middle.'];
    counterOpen.forEach(a=>counterTail.forEach(c=>commentary.counterattack.push(d=>`${a} ${d.pet} ${c}`)));
    const chanceOpen=['Danger now:','This is promising:','Hoops in sight for','A real opening for','The defence is stretched:','They are close now:','Pressure building around','This could develop for'];
    const chanceTail=['has options.','is in range.','can attack this.','has the defence moving.','is asking the question.','has a shooting lane.','is getting closer.','has support nearby.'];
    chanceOpen.forEach(a=>chanceTail.forEach(c=>commentary.chance.push(d=>`${a} ${d.pet} ${c}`)));

    return Object.values(commentary).reduce((n,bank)=>n+(Array.isArray(bank)?bank.length:0),0);
  }
  const BARRY_COMMENTARY_VARIANTS=buildBarryCommentaryLibrary();

  const state = {
    open:false, startedAt:0, seed:0, simRand:null, visualRand:null, assets:{}, entities:[], ref:null,
    phase:'closed', introElapsed:0, matchTime:0, speed:1, half:1, firstKickoff:'belros',
    possession:'belros', carrier:null, lastPasser:null, zone:.18, passesSinceShot:0,
    actionTimer:2.4, delay:null, special:null, ball:{x:.5,y:.5,flight:null,visible:true},
    score:{belros:0,zafran:0}, shootout:null,
    teamStats:{}, playerStats:{}, camera:{x:.5,y:.5,zoom:1,tx:.5,ty:.5,tz:1,shake:0},
    eventBannerTimer:0, celebration:null, varContext:null, channel:null, subscribed:false,
    lastTs:0, raf:0, loreUsed:new Set(), introCue:-1, audioUnlocked:false, crowdBase:.18, crowdBoost:0,
    shootoutPending:false, opening:false, movementPulse:0, adminPreviewTimer:0, pendingPass:null, possessionChangedAt:0,
    broadcastState:'CLOSED', presentationKey:'', halftimeElapsed:0, halftimeReady:false, secondCountdown:0,
    fulltimeElapsed:0, fulltimeData:null, events:[], kickoffToss:null, kickoffReceiver:null, prematchAudioFailed:false,
    broadcast:{lastSpokenAt:0,lastText:'',recent:[],recentSkeletons:[],queue:null,barryState:'NEUTRAL',barryPriority:0,barryUntil:0,barryTimer:0,talkTimer:0,phaseSeen:'',crowdLevel:.12,crowdTarget:.12,speaking:false,debugEvent:'IDLE',voiceName:'',variantCount:BARRY_COMMENTARY_VARIANTS}
  };

  function blankTeamStats(){return {shots:0,onTarget:0,passes:0,completed:0,interceptions:0,rebounds:0,fouls:0,penalties:0,var:0,possession:0}}
  function resetStats(){
    state.teamStats={belros:blankTeamStats(),zafran:blankTeamStats()};
    state.playerStats=Object.fromEntries(allPlayers.map(p=>[p.id,{goals:0,assists:0,shots:0,interceptions:0,fouls:0,passes:0,completed:0,saves:0,rebounds:0}]));
  }

  function createUi(){
    if ($('wcWorldCupBroadcast')) return;
    const root=document.createElement('div');root.id='wcWorldCupBroadcast';root.setAttribute('aria-hidden','true');
    root.innerHTML=`<div class="wcg-shell" role="dialog" aria-modal="true" aria-label="Repo Sports World Cup live match">
      <canvas id="wcgCanvas" class="wcg-canvas" width="${W}" height="${H}"></canvas>
      <div id="wcgSnow" class="wcg-snow" aria-hidden="true"></div>
      <div class="wcg-scorebar">
        <div class="wcg-team-score"><span class="wcg-team-badge"><span>BEL</span></span><div class="wcg-team-copy"><b>BELROS</b><small>JUD · NIMBLER 2000 · BRAMBLE</small></div><strong id="wcgScoreBelros" class="wcg-team-goals">0</strong></div>
        <div class="wcg-clock"><b id="wcgClock">PRE</b><span id="wcgPhase">WORLD CUP</span><em id="wcgArena">CROWN OF VARDESH GLACIER</em></div>
        <div class="wcg-team-score"><strong id="wcgScoreZafran" class="wcg-team-goals">0</strong><div class="wcg-team-copy"><b>ZAFRAN</b><small>ZIZI · RAFI · SAFFI</small></div><span class="wcg-team-badge"><span>ZAF</span></span></div>
      </div>
      <div class="wcg-live-chip">REPO SPORTS · LIVE</div>
      <div id="wcgPresentation" class="wcg-presentation" aria-hidden="true"><div id="wcgPresentationPanel" class="wcg-presentation-panel"><small id="wcgPresentationKicker"></small><h1 id="wcgPresentationTitle"></h1><div id="wcgPresentationBody" class="wcg-presentation-body"></div><footer id="wcgPresentationFooter"></footer></div></div>
      <div id="wcgEventBanner" class="wcg-event-banner"></div>
      <div id="wcgCommentator" class="wcg-commentator" data-barry-state="NEUTRAL"><img id="wcgBarrySprite" class="wcg-barry" src="assets/commentator-22.png" alt="Barry Bramble"><div class="wcg-comment-box"><b>BARRY BRAMBLE · REPO SPORTS</b><p id="wcgCommentary">Welcome to the Repo Sports World Cup.</p></div></div>
      <div class="wcg-mini-stats"><header><span>BELROS</span><span>LIVE MATCH STATS</span><span>ZAFRAN</span></header><div id="wcgMiniStats"></div></div>
      <div id="wcgVar" class="wcg-var-box"><div class="wcg-var-card"><b id="wcgVarTitle">VAR CHECK</b><span id="wcgVarText">Reviewing the incident…</span></div></div>
      <div id="wcgHalftime" class="wcg-overlay-card"><div class="wcg-panel"><h2 id="wcgHalfTitle">SECOND HALF READY</h2><h3>CROWN OF VARDESH GLACIER · WORLD CUP 2026</h3><div class="wcg-halftime-stats"><div class="wcg-half-team"><b>BELROS</b><strong id="wcgHalfBelros">0</strong></div><div class="wcg-half-centre">9 MINUTES<br>COMPLETE<br><span id="wcgHalfShots"></span></div><div class="wcg-half-team"><b>ZAFRAN</b><strong id="wcgHalfZafran">0</strong></div></div><p id="wcgHalfCopy">Waiting for CatAsthma to continue the broadcast.</p><button id="wcgContinueHalf" type="button">CONTINUE SECOND HALF</button></div></div>
      <div id="wcgFulltime" class="wcg-overlay-card"><div class="wcg-panel"><h2 id="wcgFullTitle">FULL TIME</h2><h3 id="wcgFullSubtitle">BELROS · ZAFRAN</h3><p id="wcgFullScore"></p><div id="wcgFullStats" class="wcg-fulltime-grid"></div><p id="wcgMvp"></p><button id="wcgReturnLobby" type="button">RETURN TO WAITING ROOM</button></div></div>
      <div class="wcg-controls"><button id="wcgSkipHalf" class="wcg-control wcg-admin-only" type="button" hidden>SKIP TO HALF TIME</button><button id="wcgSpeed" class="wcg-control wcg-admin-only" type="button" hidden>TEST SPEED ×4</button><button id="wcgAdminEvents" class="wcg-control wcg-admin-only" type="button" hidden>ADMIN EVENT TESTS</button><button id="wcgExit" class="wcg-control" type="button">EXIT BROADCAST</button></div><div id="wcgAdminPanel" class="wcg-admin-panel" hidden><div class="wcg-admin-title">WORLD CUP · ADMIN TEST DECK</div><div class="wcg-admin-grid"><button data-test-event="goal">GOAL</button><button data-test-event="save">SAVE</button><button data-test-event="miss">MISS</button><button data-test-event="post">POST / REBOUND</button><button data-test-event="foul">FOUL</button><button data-test-event="penalty">PENALTY</button><button data-test-event="var">VAR CHECK</button><button data-test-event="intercept">INTERCEPTION</button></div></div>
      <div class="wcg-screen-effects"></div><img class="wcg-tv-frame" src="${BASE}broadcast-tv-frame.webp" alt="" aria-hidden="true">
    </div>`;
    document.body.appendChild(root);
    const snow=$('wcgSnow');
    for(let i=0;i<54;i++){
      const f=document.createElement('i');const r=(i*37)%101;f.style.left=`${r}%`;f.style.animationDuration=`${7+(i%9)*.7}s`;f.style.animationDelay=`-${(i%13)*.7}s`;f.style.setProperty('--drift',`${-22+(i%11)*4}px`);if(i%5===0){f.style.width='3px';f.style.height='3px';f.style.opacity='.75'}snow.appendChild(f);
    }
    $('wcgContinueHalf').addEventListener('click',continueSecondHalf);
    $('wcgReturnLobby').addEventListener('click',()=>closeBroadcast(true));
    $('wcgExit').addEventListener('click',()=>closeBroadcast(true));
    $('wcgSpeed').addEventListener('click',toggleSpeed);
    $('wcgSkipHalf').addEventListener('click',skipToHalftime);
    $('wcgAdminEvents').addEventListener('click',()=>{const panel=$('wcgAdminPanel');panel.hidden=!panel.hidden});
    document.querySelectorAll('[data-test-event]').forEach(btn=>btn.addEventListener('click',()=>previewAdminEvent(btn.dataset.testEvent)));
    document.addEventListener('keydown',e=>{if(state.open&&e.key==='Escape'&&state.phase!=='halftime'){e.preventDefault();e.stopPropagation();closeBroadcast(true)}},true);
  }

  const img = src => new Promise((resolve,reject)=>{const i=new Image();i.decoding='async';i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
  async function preload(){
    if (state.assets.arena) return;
    const entries=[['arena',BASE+'crown-of-vardesh-glacier.webp'],['ball',BASE+'world-cup-ball.webp'],['refStanding',BASE+'ref-standing.webp'],['refFlying',BASE+'ref-flying.webp']];
    for(const p of allPlayers){entries.push([p.id+'Standing',p.standing],[p.id+'Riding',p.riding])}
    const loaded=await Promise.all(entries.map(async ([k,s])=>[k,await img(s)]));
    state.assets=Object.fromEntries(loaded);
  }

  const audio = {
    crowd:null,whistle:null,goal:null,prematch:null,intercepts:[],shots:[],rebounds:[],windCtx:null,windSource:null,mix:{ambience:.018,crowd:.18,commentary:.58,sfx:.55,music:.20},
    ensure(){
      if(this.crowd)return;
      this.crowd=new Audio('assets/quidditch-crowd.mp3');this.crowd.loop=true;this.crowd.preload='auto';
      this.whistle=new Audio('assets/quidditch-kickoff-whistle.mp3');
      this.goal=new Audio('assets/quidditch-sfx/goal.mp3');
      this.prematch=new Audio(PREMATCH_ANTHEM);this.prematch.preload='auto';this.prematch.loop=false;
      this.intercepts=[1,2].map(n=>new Audio(`assets/quidditch-intercept-${n}.mp3`));
      this.shots=[1,2,3,4,5].map(n=>new Audio(`assets/quidditch-sfx/shot-${n}.mp3`));
      this.rebounds=[1,2,3,4].map(n=>new Audio(`assets/quidditch-sfx/rebound-${n}.mp3`));
    },
    play(a,vol=.55){try{if(!a)return;a.pause();a.currentTime=0;a.volume=clamp(vol,0,1);const p=a.play();p?.catch?.(()=>{})}catch(_){}},
    start(){this.ensure();try{this.crowd.volume=state.phase==='intro'?.09:state.crowdBase;this.crowd.currentTime=0;this.crowd.play()?.catch?.(()=>{})}catch(_){};this.startWind()},
    startPrematch(offset=0){this.ensure();const a=this.prematch;if(!a)return;try{a.pause();a.volume=this.mix.music;a.playbackRate=1;const begin=()=>{try{a.currentTime=clamp(offset,0,Math.max(0,(a.duration||INTRO_SECONDS)-.08));const pr=a.play();pr?.catch?.(()=>{state.prematchAudioFailed=true})}catch(_){state.prematchAudioFailed=true}};a.onended=()=>{if(state.open&&state.phase==='intro')completePrematch()};if(Number.isFinite(a.duration)&&a.duration>0)begin();else a.addEventListener('loadedmetadata',begin,{once:true})}catch(_){state.prematchAudioFailed=true}},
    startWind(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC||this.windCtx)return;const ctx=new AC(),buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.42;const src=ctx.createBufferSource(),low=ctx.createBiquadFilter(),high=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=buffer;src.loop=true;low.type='lowpass';low.frequency.value=780;high.type='highpass';high.frequency.value=90;gain.gain.value=this.mix.ambience;src.connect(low);low.connect(high);high.connect(gain);gain.connect(ctx.destination);src.start();this.windCtx=ctx;this.windSource=src}catch(_){}} ,
    stop(){this.ensure();[this.crowd,this.whistle,this.goal,this.prematch,...this.intercepts,...this.shots,...this.rebounds].forEach(a=>{try{a.pause();a.currentTime=0}catch(_){}});try{this.windSource?.stop()}catch(_){};try{this.windCtx?.close()}catch(_){};this.windSource=null;this.windCtx=null},
    crowdHit(amount=.22){state.crowdBoost=Math.max(state.crowdBoost,amount)},
    shot(){this.ensure();this.play(this.shots[Math.floor((state.visualRand?.()||Math.random())*this.shots.length)],.48)},
    rebound(){this.ensure();this.play(this.rebounds[Math.floor((state.visualRand?.()||Math.random())*this.rebounds.length)],.55)},
    intercept(){this.ensure();this.play(this.intercepts[Math.floor((state.visualRand?.()||Math.random())*this.intercepts.length)],.46)},
    varTone(){
      try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC();const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.setValueAtTime(620,ctx.currentTime);o.frequency.setValueAtTime(440,ctx.currentTime+.16);g.gain.setValueAtTime(.045,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.42);o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.45)}catch(_){}
    }
  };

  const BARRY = {
    neutral:'assets/commentator-22.png',
    talk:['assets/commentator-22.png','assets/commentator-23.png','assets/commentator-24.png','assets/commentator-23.png','assets/commentator-28.png','assets/commentator-24.png'],
    excited:'assets/commentator-28.png', shocked:'assets/barry-events/barry-04.png', goal:'assets/commentator-29.png',
    var:'assets/barry-events/barry-06.png', halftime:'assets/commentator-25.png', fulltime:'assets/commentator-27.png'
  };
  function barryEl(){return $('wcgBarrySprite')}
  function clearBarryTimers(){const b=state.broadcast;if(!b)return;clearInterval(b.talkTimer);clearTimeout(b.barryTimer);b.talkTimer=0;b.barryTimer=0}
  function barryAsset(src){const el=barryEl();if(el&&src&&el.getAttribute('src')!==src)el.src=src}
  function barryReaction(name='NEUTRAL',priority=1,duration=900){
    const b=state.broadcast,now=performance.now();if(!b)return false;
    if(now<b.barryUntil && priority<b.barryPriority)return false;
    clearBarryTimers();b.barryState=name;b.barryPriority=priority;b.barryUntil=now+duration;b.speaking=false;
    const wrap=$('wcgCommentator');if(wrap){wrap.dataset.barryState=name;wrap.classList.remove('is-speaking','is-excited','is-shocked','is-goal','is-var');}
    if(name==='GOAL_REACTION'){barryAsset(BARRY.goal);wrap?.classList.add('is-goal')}
    else if(name==='SHOCKED'){barryAsset(BARRY.shocked);wrap?.classList.add('is-shocked')}
    else if(name==='EXCITED'){barryAsset(BARRY.excited);wrap?.classList.add('is-excited')}
    else if(name==='VAR_REACTION'){barryAsset(BARRY.var);wrap?.classList.add('is-var')}
    else if(name==='HALFTIME'){barryAsset(BARRY.halftime)}
    else if(name==='FULLTIME'){barryAsset(BARRY.fulltime)}
    else barryAsset(BARRY.neutral);
    b.barryTimer=setTimeout(()=>{if(!state.open||state.broadcast.speaking)return;state.broadcast.barryPriority=0;state.broadcast.barryUntil=0;state.broadcast.barryState='NEUTRAL';const w=$('wcgCommentator');if(w){w.dataset.barryState='NEUTRAL';w.classList.remove('is-excited','is-shocked','is-goal','is-var')}barryAsset(BARRY.neutral)},duration);
    return true;
  }
  function commentaryDuration(text){return clamp(String(text||'').length*27,850,2850)}
  let cachedBarryVoice=null;
  function barryVoiceScore(v){
    const name=String(v?.name||'').toLowerCase(),lang=String(v?.lang||'');let score=0;
    if(/^en-GB/i.test(lang))score+=55;else if(/^en/i.test(lang))score+=14;else return -999;
    if(/google uk english male/.test(name))score+=95;
    if(/microsoft.*ryan/.test(name))score+=92;
    if(/ryan.*natural|natural.*ryan/.test(name))score+=24;
    if(/microsoft.*george|\bgeorge\b/.test(name))score+=78;
    if(/\bdaniel\b/.test(name))score+=74;
    if(/\boliver\b/.test(name))score+=66;
    if(/\bthomas\b/.test(name))score+=60;
    if(/male/.test(name))score+=34;
    if(/natural|neural|online|premium|enhanced/.test(name))score+=26;
    if(v?.localService===false)score+=8;
    if(/espeak|festival|compact|robot|classic/.test(name))score-=90;
    if(/zira|hazel|susan|sonia|libby|female/.test(name))score-=28;
    return score;
  }
  function chooseBarryVoice(){
    try{
      const voices=window.speechSynthesis?.getVoices?.()||[];
      if(cachedBarryVoice&&voices.includes(cachedBarryVoice))return cachedBarryVoice;
      const ranked=voices.slice().sort((a,b)=>barryVoiceScore(b)-barryVoiceScore(a));
      cachedBarryVoice=ranked[0]||null;
      if(state.broadcast)state.broadcast.voiceName=cachedBarryVoice?.name||'';
      return cachedBarryVoice;
    }catch(_){return null}
  }
  function primeBarryVoice(){
    try{
      chooseBarryVoice();
      if('speechSynthesis' in window)window.speechSynthesis.addEventListener?.('voiceschanged',()=>{cachedBarryVoice=null;chooseBarryVoice()},{once:false});
    }catch(_){}
  }
  function speechReadyText(text){
    let out=String(text||'');
    const names={
      'JUD':'Judd',
      'Nimbler 2000':'Nimbler two thousand',
      'VAR':'V A R',
      'Belros':'Bell-ross',
      'Zafran':'Zaff-ran'
    };
    Object.entries(names).forEach(([written,spoken])=>{out=out.replace(new RegExp(`\\b${written.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}\\b`,'g'),spoken)});
    return out;
  }
  const neuralBarry={audio:null,controller:null,url:'',serial:0};
  function cancelBarryAudio(){
    neuralBarry.serial++;
    try{neuralBarry.controller?.abort?.()}catch(_){}
    neuralBarry.controller=null;
    try{if(neuralBarry.audio){neuralBarry.audio.pause();neuralBarry.audio.src=''}}catch(_){}
    neuralBarry.audio=null;
    if(neuralBarry.url){try{URL.revokeObjectURL(neuralBarry.url)}catch(_){}neuralBarry.url=''}
    try{window.speechSynthesis?.cancel?.()}catch(_){}
  }
  function speakBrowserBarryAudio(text,priority=2,onStart=null,onDone=null){
    try{
      if(!('speechSynthesis' in window)||!window.SpeechSynthesisUtterance)return false;
      const synth=window.speechSynthesis;
      if(priority>=10)synth.cancel();
      const spoken=speechReadyText(text),u=new SpeechSynthesisUtterance(spoken),v=chooseBarryVoice();
      if(v)u.voice=v;u.lang=v?.lang||'en-GB';u.rate=1.06;u.pitch=.89;u.volume=audio.mix.commentary;
      let started=false,finished=false;
      const begin=()=>{if(started)return;started=true;onStart?.()};
      const done=()=>{if(finished)return;finished=true;onDone?.()};
      u.onstart=begin;u.onend=done;u.onerror=done;synth.speak(u);setTimeout(begin,120);return true;
    }catch(_){return false}
  }
  function speakBarryAudio(text,priority=2,intensity='calm',onStart=null,onDone=null){
    const serial=++neuralBarry.serial,spoken=speechReadyText(text);
    let completed=false;
    const done=()=>{if(completed||serial!==neuralBarry.serial)return;completed=true;onDone?.()};
    const fallback=()=>{
      if(serial!==neuralBarry.serial)return;
      if(state.broadcast)state.broadcast.voiceName=chooseBarryVoice()?.name||'Browser fallback';
      if(!speakBrowserBarryAudio(text,priority,onStart,done)){onStart?.();done()}
    };
    try{
      const controller=new AbortController();neuralBarry.controller=controller;
      fetch('/api/barry-tts',{
        method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,
        body:JSON.stringify({text:spoken,intensity})
      }).then(async r=>{
        if(serial!==neuralBarry.serial)return;
        if(!r.ok)throw new Error(`TTS ${r.status}`);
        const blob=await r.blob();if(serial!==neuralBarry.serial)return;
        const url=URL.createObjectURL(blob),a=new Audio(url);neuralBarry.url=url;neuralBarry.audio=a;a.preload='auto';a.volume=audio.mix.commentary;
        if(state.broadcast)state.broadcast.voiceName='ElevenLabs neural · Barry';
        let started=false;
        const begin=()=>{if(started||serial!==neuralBarry.serial)return;started=true;onStart?.()};
        const cleanup=()=>{if(serial!==neuralBarry.serial)return;try{URL.revokeObjectURL(url)}catch(_){}if(neuralBarry.url===url)neuralBarry.url='';if(neuralBarry.audio===a)neuralBarry.audio=null;done()};
        a.onplaying=begin;a.onended=cleanup;a.onerror=()=>{try{URL.revokeObjectURL(url)}catch(_){}fallback()};
        const playPromise=a.play();if(playPromise?.catch)playPromise.catch(()=>fallback());
      }).catch(err=>{if(err?.name!=='AbortError')fallback()});
      return true;
    }catch(_){fallback();return false}
  }
  function startBarrySpeaking(text,priority=2,intensity='calm'){
    const b=state.broadcast,wrap=$('wcgCommentator');if(!b)return;
    const duration=commentaryDuration(text);clearBarryTimers();b.speaking=true;b.barryState='PREPARING_SPEECH';b.barryPriority=priority;b.barryUntil=performance.now()+Math.max(duration,6500);
    let i=0,finished=false,mouthStarted=false;
    const beginMouth=()=>{if(finished||mouthStarted)return;mouthStarted=true;b.barryState='SPEAKING';if(wrap){wrap.dataset.barryState='SPEAKING';wrap.classList.remove('is-excited','is-shocked','is-goal','is-var');wrap.classList.add('is-speaking')}barryAsset(BARRY.talk[0]);b.talkTimer=setInterval(()=>{if(!state.open||!state.broadcast.speaking)return;i=(i+1)%BARRY.talk.length;barryAsset(BARRY.talk[i])},150+(intensity==='explosive'?-25:intensity==='excited'?-10:10));};
    const finish=()=>{if(finished)return;finished=true;clearInterval(b.talkTimer);b.talkTimer=0;clearTimeout(b.barryTimer);b.barryTimer=0;b.speaking=false;if(wrap)wrap.classList.remove('is-speaking');b.barryPriority=0;b.barryUntil=0;b.barryState='NEUTRAL';if(wrap)wrap.dataset.barryState='NEUTRAL';barryAsset(BARRY.neutral)};
    speakBarryAudio(text,priority,intensity,beginMouth,finish);
    b.barryTimer=setTimeout(()=>{cancelBarryAudio();finish()},8500);
  }

  function commentaryOpts(kind){
    const map={goal:[10,'explosive',true],var:[8,'excited',true],save:[7,'excited',true],post:[7,'excited',true],foul:[6,'interested',true],penalty:[7,'excited',true],intercept:[6,'excited',true],shot:[4,'interested',false],rebound:[5,'excited',false],kickoff:[8,'excited',true],halftime:[7,'calm',true],fulltime:[9,'excited',true],pass:[2,'calm',false],drive:[3,'interested',false],miss:[4,'interested',false]};
    const [priority,intensity,force]=map[kind]||[2,'calm',false];return {priority,intensity,force,kind};
  }
  function updateBroadcastDirector(dt){
    const b=state.broadcast;if(!b)return;
    const phase=state.director?.phase||'BUILD-UP';const targetByPhase={"BUILD-UP":.12,ATTACK:.17,COUNTERATTACK:.23,"DEFENSIVE PRESSURE":.22,"GOAL CHANCE":.29,RESET:.15,"SET PIECE":.22};
    b.crowdTarget=clamp((targetByPhase[phase]||.14)+state.crowdBoost,0,.62);b.crowdLevel=lerp(b.crowdLevel,b.crowdTarget,1-Math.exp(-dt*1.9));
    if(audio.crowd){const duck=b.speaking?.76:1;audio.crowd.volume=clamp(b.crowdLevel*duck,0,.68)}
    if(audio.prematch&&state.phase==='intro'&&!audio.prematch.paused)audio.prematch.volume=b.speaking?audio.mix.music*.65:audio.mix.music;
    if(b.queue&&!b.speaking&&performance.now()-b.lastSpokenAt>900){const q=b.queue;b.queue=null;say(q.text,{...q.opts,force:true})}
    if((state.phase==='first'||state.phase==='second')&&phase!==b.phaseSeen){
      b.phaseSeen=phase;
      if(phase==='COUNTERATTACK'&&state.carrier) say(formatLine('counterattack',{pet:state.carrier.player.name}),{priority:4,intensity:'interested',kind:'sequence'});
      else if(phase==='GOAL CHANCE'&&state.carrier){barryReaction('EXCITED',4,650);say(formatLine('chance',{pet:state.carrier.player.name}),{priority:4,intensity:'excited',kind:'sequence'});}
    }
    if(adminEnabled()){const root=$('wcWorldCupBroadcast');if(root){root.dataset.barryDebug=b.barryState;root.dataset.audioDebug=Math.round(b.crowdLevel*100)}}
  }

  function stopWorldCupMenuAudio(){
    ['worldCupEventMusic','worldCupMeetTeamsMusic','worldCupTvAudio'].forEach(id=>{const a=$(id);if(a){try{a.pause()}catch(_){}}});
  }
  function restoreWorldCupMenuAudio(){
    const a=$('worldCupEventMusic');if(a){try{a.volume=.30;a.play()?.catch?.(()=>{})}catch(_){}}
  }

  function pick(arr){return arr[Math.floor(state.simRand()*arr.length)]}
  function commentarySkeleton(text){
    let s=String(text||'').toLowerCase();
    allPlayers.forEach(p=>{s=s.replaceAll(p.name.toLowerCase(),'<player>')});
    s=s.replace(/\b\d+[–-]\d+\b/g,'<score>').replace(/\b\d+\b/g,'<n>').replace(/[^a-z<> ]+/g,' ').replace(/\s+/g,' ').trim();
    return s;
  }
  function formatLine(kind,data={}){
    const bank=commentary[kind]||commentary.pass,b=state.broadcast||{};let fallback='';
    for(let tries=0;tries<36;tries++){
      const entry=pick(bank),line=String(typeof entry==='function'?entry(data):entry||'').replace(/\s+/g,' ').trim();if(!line)continue;fallback=line;
      const skeleton=commentarySkeleton(line);
      if(!(b.recent||[]).includes(line)&&!(b.recentSkeletons||[]).includes(skeleton))return line;
    }
    return fallback||'Play continues.';
  }
  function queueBarry(text,opts){
    const b=state.broadcast;if(!b)return;
    const incoming=Number(opts?.priority||2),existing=Number(b.queue?.opts?.priority||0);
    if(!b.queue||incoming>=existing)b.queue={text,opts:{...opts,force:false}};
  }
  function say(text,opts={}){
    text=String(text||'').replace(/\s+/g,' ').trim();if(!text)return false;const b=state.broadcast||{},now=performance.now();
    const priority=Number(opts.priority||2),intensity=opts.intensity||'calm',force=!!opts.force;
    const minGap=priority>=8?320:priority>=6?800:priority>=4?1250:2200;
    if(priority>=8)b.queue=null; // do not let stale routine commentary survive a major moment
    if(b.speaking){
      // A goal may break in immediately. Everything else waits rather than chopping a sentence in half.
      if(priority>=10&&priority>b.barryPriority){b.queue=null;cancelBarryAudio();clearBarryTimers();b.speaking=false;}
      else{if(priority>=4)queueBarry(text,{priority,intensity,kind:opts.kind||''});return false;}
    }
    if(!force&&now-(b.lastSpokenAt||0)<minGap){if(priority>=4)queueBarry(text,{priority,intensity,kind:opts.kind||''});return false;}
    const skeleton=commentarySkeleton(text);
    if(!force&&((b.recent||[]).includes(text)||(b.recentSkeletons||[]).includes(skeleton)))return false;
    const box=$('wcgCommentary');if(!box)return false;box.textContent=text;b.lastSpokenAt=now;b.lastText=text;b.recent=[text,...(b.recent||[]).filter(x=>x!==text)].slice(0,60);b.recentSkeletons=[skeleton,...(b.recentSkeletons||[]).filter(x=>x!==skeleton)].slice(0,32);b.debugEvent=opts.kind||'COMMENTARY';
    let reactionDelay=0;if(priority>=10){cancelBarryAudio();barryReaction('GOAL_REACTION',10,610);reactionDelay=520}
    else if(opts.kind==='fulltime'){cancelBarryAudio();barryReaction('FULLTIME',9,500);reactionDelay=360}
    else if(opts.kind==='halftime'){barryReaction('HALFTIME',7,360);reactionDelay=220}
    else if(opts.kind==='var'){cancelBarryAudio();barryReaction('VAR_REACTION',8,460);reactionDelay=360}
    else if(priority>=7){cancelBarryAudio();barryReaction('SHOCKED',priority,350);reactionDelay=260}
    else if(priority>=4){barryReaction('EXCITED',priority,230);reactionDelay=130}
    if(reactionDelay){const expected=text;setTimeout(()=>{if(state.open&&state.broadcast.lastText===expected)startBarrySpeaking(text,priority,intensity)},reactionDelay)}else startBarrySpeaking(text,priority,intensity);return true;
  }
  function maybeLore(player, chance=.12){
    chance=Math.min(chance,.025);if(!player||state.simRand()>chance)return false;
    const available=player.lore.map((line,i)=>({line,key:player.id+':'+i})).filter(x=>!state.loreUsed.has(x.key));
    if(!available.length)return false;const item=available[Math.floor(state.simRand()*available.length)];const spoken=say(item.line,{priority:2,intensity:'calm',kind:'lore'});if(spoken)state.loreUsed.add(item.key);return spoken;
  }
  function eventLine(kind,data={},player=null,loreChance=.08){
    if(maybeLore(player,loreChance))return;
    const ps=player?state.playerStats[player.id]:null,opts=commentaryOpts(kind);
    if(kind==='intercept'&&ps?.interceptions>=2&&ps.interceptions%2===0){say(`${player.name} again. Interception number ${ps.interceptions}.`,{...opts,priority:7});return}
    if(kind==='goal'&&ps?.goals>=2){say(`${player.name} again! Goal number ${ps.goals}.`,{...opts});return}
    if(kind==='save'&&ps?.saves>=2){say(`${player.name} again. Save number ${ps.saves}.`,{...opts,priority:7});return}
    say(formatLine(kind,data),opts);
  }

  function showBanner(text,type='',seconds=1.8){const el=$('wcgEventBanner');if(!el)return;el.textContent=text;el.className='wcg-event-banner is-visible'+(type?` is-${type}`:'');state.eventBannerTimer=seconds}
  function setBroadcastState(name){state.broadcastState=name;const root=$('wcWorldCupBroadcast');if(root)root.dataset.broadcastState=name}
  function showPresentation(key,kicker,title,body='',footer='',mode=''){
    const wrap=$('wcgPresentation');if(!wrap)return;if(state.presentationKey===key)return;state.presentationKey=key;
    $('wcgPresentationKicker').textContent=kicker||'';$('wcgPresentationTitle').textContent=title||'';$('wcgPresentationBody').innerHTML=body||'';$('wcgPresentationFooter').textContent=footer||'';
    $('wcgPresentationPanel').className='wcg-presentation-panel'+(mode?` is-${mode}`:'');wrap.classList.add('is-open');wrap.setAttribute('aria-hidden','false');
  }
  function hidePresentation(){const wrap=$('wcgPresentation');if(wrap){wrap.classList.remove('is-open');wrap.setAttribute('aria-hidden','true')}state.presentationKey=''}
  function playerSpriteHeight(e,standing=false){const base=standing?PLAYER_STAND_HEIGHT:PLAYER_RIDE_HEIGHT;return base*(PLAYER_SCALE[e?.player?.id]||1)}
  function recordEvent(type,data={},weight=1){state.events.push({type,data,weight,time:state.matchTime,half:state.half,score:{...state.score}});if(state.events.length>80)state.events.shift()}
  function impactFor(p){const s=state.playerStats[p.id]||{};return (s.goals||0)*5+(s.assists||0)*2.6+(s.interceptions||0)*2.25+(s.saves||0)*2.1+(s.completed||0)*.08+(s.rebounds||0)*.65-(s.fouls||0)*.75}
  function playerOfPeriod(half=null){return allPlayers.map(p=>({p,score:impactFor(p)})).sort((a,b)=>b.score-a.score || a.p.name.localeCompare(b.p.name))[0]?.p||allPlayers[0]}
  function eventDescription(ev){if(!ev)return 'A tense tactical half with neither side producing one single defining moment.';const d=ev.data||{};if(ev.type==='goal')return `${d.player} finishes for ${teamMeta[d.team]?.name||d.team}.`;if(ev.type==='save')return `${d.player} produces a major save under pressure.`;if(ev.type==='post')return `${d.player} rattles the ring and starts a scramble.`;if(ev.type==='intercept')return `${d.player} reads the lane and wins possession.`;if(ev.type==='var')return `VAR interrupts the match after a major incident.`;if(ev.type==='foul')return `${d.player} is penalised for a late challenge.`;return d.text||'A major passage of play swings the momentum.'}
  function bestEvent(half=null){const pool=state.events.filter(e=>half==null||e.half===half);return pool.sort((a,b)=>b.weight-a.weight || b.time-a.time)[0]||null}
  function scoreLine(){return `BELROS ${state.score.belros}–${state.score.zafran} ZAFRAN`}
  function introSpriteStyle(p,team){const face=team==='belros'?-1:1,scale=PLAYER_SCALE[p.id]||1;return `--wcg-intro-face:${face};--wcg-intro-scale:${scale}`}
  function lineupMarkup(team){return `<div class="wcg-lineup-side is-${team}"><h3>${teamMeta[team].name}</h3><div class="wcg-lineup-players">${roster[team].map(p=>`<article class="is-${p.id}"><img src="${p.standing}" alt="${p.name}" style="${introSpriteStyle(p,team)}"><b>${p.name}</b><span>${p.role.toUpperCase()}</span></article>`).join('')}</div></div>`}
  function profileStrength(p){const a=entityById(p.id)?.attributes||{};const labels=p.role==='defender'?[['POSITIONING',a.positioning],['INTERCEPTION',a.interception],['ANTICIPATION',a.anticipation]]:p.role==='attacker'?[['SHOOTING',a.shooting],['ACCELERATION',a.accel],['ANTICIPATION',a.anticipation]]:[['PASSING',a.passing],['POSITIONING',a.positioning],['COMPOSURE',a.composure]];return labels.sort((x,y)=>(y[1]||0)-(x[1]||0))[0]?.[0]||p.role.toUpperCase()}
  function keyPlayerMarkup(p,team){const e=entityById(p.id),personality=(e?.personality||'balanced').toUpperCase();return `<article class="wcg-key-player is-${team} is-${p.id}"><img src="${p.standing}" alt="${p.name}" style="${introSpriteStyle(p,team)}"><div><small>${teamMeta[team].name} · ${p.role.toUpperCase()}</small><b>${p.name}</b><p>${p.short}</p><div class="wcg-profile-meta"><span>STYLE <strong>${personality}</strong></span><span>STRENGTH <strong>${profileStrength(p)}</strong></span></div></div></article>`}
  function updatePrematchPresentation(){
    const remaining=Math.max(0,INTRO_SECONDS-state.introElapsed);
    if(remaining<=1.35){setBroadcastState('KICKOFF_COUNTDOWN');hidePresentation();return}
    if(remaining>25){setBroadcastState('INTRO');showPresentation('pre-intro','VELMORA QUIDDITCH WORLD CUP','BELROS  VS  ZAFRAN','<div class="wcg-versus"><b>BELROS</b><span>WORLD CUP 2026</span><b>ZAFRAN</b></div>','CROWN OF VARDESH GLACIER · LIVE','intro')}
    else if(remaining>20){setBroadcastState('PRE_MATCH');showPresentation('pre-lineups','STARTING SIX','LINEUPS',`<div class="wcg-lineups">${lineupMarkup('belros')}${lineupMarkup('zafran')}</div>`,'THREE PLAYERS PER SIDE · ROLES SHOWN','lineups')}
    else if(remaining>15){setBroadcastState('PRE_MATCH');showPresentation('pre-key','ONES TO WATCH','KEY PLAYERS',`<div class="wcg-key-grid">${keyPlayerMarkup(byId.jud,'belros')}${keyPlayerMarkup(byId.zizi,'zafran')}</div>`,'MATCH-ENGINE ROLE · STYLE · PRIMARY STRENGTH','keys')}
    else if(remaining>10){setBroadcastState('PRE_MATCH');showPresentation('pre-facts','MATCH FORMAT','BELROS vs ZAFRAN','<div class="wcg-facts"><span><b>18</b> MATCH MINUTES</span><span><b>9</b> MINUTES PER HALF</span><span><b>3v3</b> STARTING FORMAT</span></div>','WORLD CUP 2026 · AUTOMATED TEST MATCH','facts')}
    else if(remaining>5){setBroadcastState('PRE_MATCH');showPresentation('pre-arena','LIVE FROM VARDESH','CROWN OF VARDESH GLACIER','<div class="wcg-arena-details"><p class="wcg-arena-copy">Frozen stands, a full crowd and both starting threes already set on the pitch.</p><div class="wcg-arena-facts"><span>VENUE <b>CROWN OF VARDESH GLACIER</b></span><span>TOURNAMENT <b>WORLD CUP 2026</b></span><span>KICKOFF <b>REFEREE QUAFFLE TOSS</b></span></div></div>','TEAMS SET · REFEREE READY','arena')}
    else {const n=Math.max(1,Math.ceil(remaining));setBroadcastState('KICKOFF_COUNTDOWN');showPresentation(`pre-count-${n}`,'KICKOFF',String(n),'<div class="wcg-count-copy">REFEREE READY · QUAFFLE IN HAND</div>','KICKOFF IMMINENT','countdown')}
  }
  function refStandingBallPoint(){const image=state.assets.refStanding,h=REF_STAND_HEIGHT,w=image?h*(image.width/image.height):h*.56;return {x:state.ref.x+(w*.34)/W,y:state.ref.y+(h*.08)/H}}
  function updateKickoffToss(dt){
    const remain=INTRO_SECONDS-state.introElapsed;if(remain>1.45){const h=refStandingBallPoint();state.ball.x=h.x;state.ball.y=h.y;state.ball.visible=true;return}
    if(!state.kickoffToss){const h=refStandingBallPoint();state.kickoffToss={elapsed:0,duration:1.42,sx:h.x,sy:h.y,tx:.5,ty:.525};showBanner('REFEREE RELEASES THE QUAFFLE','',1.1)}
    const k=state.kickoffToss;k.elapsed=Math.min(k.duration,k.elapsed+dt);const t=clamp(k.elapsed/k.duration,0,1),q=ease(t);state.ball.x=lerp(k.sx,k.tx,q);state.ball.y=lerp(k.sy,k.ty,q)-Math.sin(Math.PI*t)*.022;state.ball.visible=true;
  }
  function completePrematch(){if(state.phase!=='intro')return;state.introElapsed=INTRO_SECONDS;updateKickoffToss(.2);hidePresentation();state.firstKickoff=state.simRand()<.5?'belros':'zafran';beginKickoff(state.firstKickoff,false)}
  function halftimeSummary(){const a=state.teamStats.belros,b=state.teamStats.zafran;if(state.score.belros!==state.score.zafran){const lead=state.score.belros>state.score.zafran?'BELROS':'ZAFRAN';return `${lead} take the advantage into the interval. The first half produced ${a.shots+b.shots} shots and ${a.interceptions+b.interceptions} interceptions.`}return `Level at the interval. ${a.shots+b.shots} shots and ${a.interceptions+b.interceptions} interceptions tell the story of a closely fought first half.`}
  function halftimeStatsMarkup(){const a=state.teamStats.belros,b=state.teamStats.zafran,tot=Math.max(.001,a.possession+b.possession),pa=Math.round(a.possession/tot*100),pb=100-pa;return `<div class="wcg-broadcast-stats"><div><b>${a.shots}</b><span>SHOTS</span><b>${b.shots}</b></div><div><b>${pa}%</b><span>POSSESSION</span><b>${pb}%</b></div><div><b>${a.interceptions}</b><span>INTERCEPTIONS</span><b>${b.interceptions}</b></div><div><b>${a.completed}</b><span>SUCCESSFUL PASSES</span><b>${b.completed}</b></div><div><b>${a.fouls}</b><span>FOULS</span><b>${b.fouls}</b></div></div>`}
  function updateHalftimePresentation(dt){
    state.halftimeElapsed+=dt;const t=state.halftimeElapsed;
    if(t<3){setBroadcastState('HALFTIME');showPresentation('half-score','HALF TIME',scoreLine(),'<div class="wcg-half-big">9 MINUTES COMPLETE</div>','CROWN OF VARDESH GLACIER','halftime')}
    else if(t<6){setBroadcastState('HALFTIME_STATS');showPresentation('half-stats','FIRST HALF','MATCH STATISTICS',halftimeStatsMarkup(),'LIVE SIMULATION DATA','stats')}
    else if(t<9){const p=playerOfPeriod(1),s=state.playerStats[p.id];showPresentation('half-player','PLAYER OF THE HALF',p.name,`<div class="wcg-player-half"><img src="${p.standing}" alt=""><p>${s.goals} GOALS · ${s.interceptions} INTERCEPTIONS · ${s.completed} COMPLETED PASSES</p></div>`,'SELECTED FROM FIRST-HALF IMPACT','player')}
    else if(t<12){const ev=bestEvent(1);showPresentation('half-moment','MOMENT OF THE HALF',ev?ev.type.toUpperCase():'TACTICAL BATTLE',`<p class="wcg-moment-copy">${eventDescription(ev)}</p>`,'BASED ON STORED MATCH EVENTS','moment')}
    else if(t<15){showPresentation('half-commentary','BARRY BRAMBLE · HALF-TIME',state.score.belros===state.score.zafran?'ALL SQUARE':'ADVANTAGE AT THE BREAK',`<p class="wcg-moment-copy">${halftimeSummary()}</p>`,'THE SECOND HALF AWAITS','summary')}
    else if(!state.halftimeReady){state.halftimeReady=true;hidePresentation();setBroadcastState('HALFTIME_READY');$('wcgHalfTitle').textContent='SECOND HALF READY';$('wcgHalfBelros').textContent=state.score.belros;$('wcgHalfZafran').textContent=state.score.zafran;$('wcgHalfShots').textContent=`SHOTS ${state.teamStats.belros.shots}-${state.teamStats.zafran.shots}`;$('wcgContinueHalf').hidden=!isHost();$('wcgHalfCopy').textContent=isHost()?'CatAsthma must continue the match.':'Waiting for host · CatAsthma must continue the match.';$('wcgHalftime').classList.add('is-open')}
  }
  function updateSecondHalfCountdown(dt){state.secondCountdown=Math.max(0,state.secondCountdown-dt);const n=Math.max(1,Math.ceil(state.secondCountdown));showPresentation(`second-${n}`,'SECOND HALF',String(n),'<div class="wcg-count-copy">PLAYERS SET · REFEREE READY</div>','PLAY!','countdown');if(state.secondCountdown<=0){hidePresentation();beginKickoff(other(state.firstKickoff),true)}}
  function fulltimeMomentMarkup(){const ev=bestEvent(null);return `<p class="wcg-moment-copy">${eventDescription(ev)}</p>`}
  function updateFulltimePresentation(dt){state.fulltimeElapsed+=dt;const data=state.fulltimeData;if(!data)return;const t=state.fulltimeElapsed;if(t<3){showPresentation('full-score','FULL TIME',scoreLine(),`<div class="wcg-half-big">${teamMeta[data.winner].name} ${data.fromShootout?'WIN ON PENALTIES':'WIN'}</div>`,'FINAL WHISTLE · CROWN OF VARDESH GLACIER','fulltime')}else if(t<6){const p=data.mvp,s=state.playerStats[p.id];showPresentation('full-mvp','PLAYER OF THE MATCH',p.name,`<div class="wcg-player-half"><img src="${p.standing}" alt=""><p>${s.goals} GOALS · ${s.assists} ASSISTS · ${s.interceptions} INTERCEPTIONS</p></div>`,'MATCH IMPACT · LIVE STATS','player')}else if(t<9){showPresentation('full-moment','MATCH MOMENT',bestEvent()?.type.toUpperCase()||'FINAL WHISTLE',fulltimeMomentMarkup(),'THE MOMENT THAT DEFINED THE MATCH','moment')}else if(!$('wcgFulltime').classList.contains('is-open')){hidePresentation();populateFulltimePanel(data);$('wcgFulltime').classList.add('is-open');setBroadcastState('POST_MATCH')}}
  function updateScoreUi(){
    $('wcgScoreBelros').textContent=state.score.belros;$('wcgScoreZafran').textContent=state.score.zafran;
    let t=state.matchTime,phase='1ST HALF';
    if(state.phase==='intro'){ $('wcgClock').textContent=`-${Math.max(0,Math.ceil(INTRO_SECONDS-state.introElapsed))}`;phase='PRE-MATCH'; }
    else { if(state.phase==='second')phase='2ND HALF';else if(state.phase==='halftime')phase='HALF TIME';else if(state.phase==='secondcountdown')phase='2ND HALF SOON';else if(state.phase==='shootout')phase='PENALTIES';else if(state.phase==='fulltime')phase='FULL TIME'; const m=Math.floor(t/60),s=Math.floor(t%60);$('wcgClock').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
    $('wcgPhase').textContent=phase;
    const a=state.teamStats.belros,b=state.teamStats.zafran;
    const possTotal=Math.max(.001,a.possession+b.possession),pa=Math.round(a.possession/possTotal*100),pb=100-pa;
    $('wcgMiniStats').innerHTML=`<div class="wcg-stat-row"><span>${a.shots}</span><b>SHOTS</b><span>${b.shots}</span></div><div class="wcg-stat-row"><span>${a.onTarget}</span><b>ON TARGET</b><span>${b.onTarget}</span></div><div class="wcg-stat-row"><span>${pa}%</span><b>POSSESSION</b><span>${pb}%</span></div><div class="wcg-stat-row"><span>${a.interceptions}</span><b>INTERCEPTS</b><span>${b.interceptions}</span></div><div class="wcg-stat-row"><span>${a.fouls}</span><b>FOULS</b><span>${b.fouls}</span></div><div class="wcg-stat-row"><span>${a.var}</span><b>VAR</b><span>${b.var}</span></div>`;
  }

  function createEntities(){
    state.entities=[];
    const groundY=.685;
    const belrosX=[.27,.34,.41], zafranX=[.73,.66,.59];
    const profiles={
      jud:{personality:'tactical',speed:.91,accel:.90,turn:.90,passing:.82,catching:.86,shooting:.68,interception:.96,awareness:.97,positioning:.97,reaction:.91,anticipation:.97,decision:.94,composure:.94,aggression:.82,stamina:.94,recovery:.91},
      nimbler:{personality:'aggressive',speed:.99,accel:.99,turn:.96,passing:.87,catching:.91,shooting:.96,interception:.76,awareness:.74,positioning:.80,reaction:.94,anticipation:.89,decision:.79,composure:.84,aggression:.98,stamina:.90,recovery:.94},
      bramble:{personality:'cautious',speed:.90,accel:.91,turn:.88,passing:.91,catching:.94,shooting:.82,interception:.84,awareness:.91,positioning:.94,reaction:.86,anticipation:.88,decision:.93,composure:.95,aggression:.70,stamina:.97,recovery:.90},
      zizi:{personality:'creative',speed:.98,accel:.98,turn:.98,passing:.94,catching:.89,shooting:.92,interception:.77,awareness:.83,positioning:.88,reaction:.95,anticipation:.95,decision:.92,composure:.91,aggression:.84,stamina:.91,recovery:.95},
      rafi:{personality:'tactical',speed:.89,accel:.88,turn:.91,passing:.84,catching:.90,shooting:.70,interception:.97,awareness:.98,positioning:.98,reaction:.90,anticipation:.98,decision:.96,composure:.97,aggression:.72,stamina:.96,recovery:.92},
      saffi:{personality:'creative',speed:.92,accel:.93,turn:.95,passing:.97,catching:.93,shooting:.83,interception:.82,awareness:.91,positioning:.93,reaction:.90,anticipation:.95,decision:.96,composure:.94,aggression:.72,stamina:.95,recovery:.91}
    };
    const makeEntity=(p,team,x,i)=>{
      const a=profiles[p.id];
      return {player:p,team,x,y:groundY,vx:0,vy:0,ax:0,ay:0,tx:x,ty:groundY,
        facing:teamMeta[team].attack,dir:-teamMeta[team].attack,bank:0,celebrate:0,intent:'shape',mark:null,currentThreat:null,
        personality:a.personality,attributes:a,form:0,fatigue:0,mistakes:0,recentSuccess:0,
        maxSpeed:(p.role==='attacker'?.205:p.role==='defender'?.19:.198)*(0.88+a.speed*.16),
        accel:(p.role==='attacker'?.74:.68)*(0.86+a.accel*.20),turnRate:(p.role==='attacker'?5.6:5.0)*(0.85+a.turn*.22),
        wander:(i-1)*.37,decisionNoise:(state.simRand?.()||.5)-.5,decisionClock:.05+(state.simRand?.()||.5)*.12,
        recoveryTarget:null,lastIntent:'shape',lastDecisionAt:0,edgeStall:0,hoverTime:0,flowSign:i%2?1:-1,flowPhase:(state.simRand?.()||.5)*Math.PI*2};
    };
    roster.belros.forEach((p,i)=>state.entities.push(makeEntity(p,'belros',belrosX[i],i)));
    roster.zafran.forEach((p,i)=>state.entities.push(makeEntity(p,'zafran',zafranX[i],i)));
    state.ref={x:.5,y:.685,vx:0,vy:0,tx:.5,ty:.685,dir:1,maxSpeed:.175,accel:.58,edgeStall:0};
  }
  function entityById(id){return state.entities.find(e=>e.player.id===id)}
  function teamEntities(team){return state.entities.filter(e=>e.team===team)}
  function rolePlayer(team,role){return teamEntities(team).find(e=>e.player.role===role)||teamEntities(team)[0]}

  function setNormalFormation(){
    if(!state.carrier)return;
    refreshMovementTargets(true);
  }
  function setPossession(team,carrier,zone=.15){const changed=state.possession!==team;state.possession=team;state.carrier=carrier;state.zone=zone;state.passesSinceShot=0;state.lastPasser=null;state.ball.visible=true;state.pendingPass=null;if(changed)state.possessionChangedAt=performance.now();setNormalFormation()}

  // All riding sprites face left in their source art.  Keep a separate attack/facing
  // direction so the visual orientation never gets accidentally tied to movement.
  // The Quaffle is anchored to the forward hand rather than the sprite centre.
  const ballHandOffsets = {
    jud:[.235,.105], nimbler:[.255,.095], bramble:[.275,.105],
    zizi:[.245,.115], rafi:[.255,.115], saffi:[.255,.115]
  };
  function spriteMetrics(e,height=null){
    height=height||playerSpriteHeight(e,false);
    const image=state.assets[e.player.id+'Riding'];
    if(!image)return {w:height,h:height};
    return {w:height*(image.width/image.height),h:height};
  }
  function ballHoldPoint(e,height=null){
    height=height||playerSpriteHeight(e,false);
    const m=spriteMetrics(e,height), off=ballHandOffsets[e.player.id]||[.25,.11];
    return {x:clamp(e.x+teamMeta[e.team].attack*(off[0]*m.w/W),.04,.96), y:clamp(e.y+off[1]*m.h/H,.08,.92)};
  }

  function startFlight(from,to,duration=.72,arc=.06,onDone=null,meta=null){
    state.ball.flight={sx:from.x,sy:from.y,tx:to.x,ty:to.y,elapsed:0,duration,arc,onDone,meta};state.ball.x=from.x;state.ball.y=from.y;state.carrier=null;
  }
  function updateFlight(dt){
    const f=state.ball.flight;if(!f)return;
    f.elapsed+=dt;const t=clamp(f.elapsed/f.duration,0,1),e=ease(t);
    // Pass targets keep moving, so the ball leads the receiver rather than flying to a stale coordinate.
    if(f.meta?.kind==='kickoff'&&f.meta.receiver){f.tx=f.meta.receiver.x;f.ty=f.meta.receiver.y-.015}
    if(f.meta?.kind==='pass'&&f.meta.receiver){
      const lead=.10;f.tx=safeX(f.meta.receiver.x+f.meta.receiver.vx*lead);f.ty=safeY(f.meta.receiver.y+f.meta.receiver.vy*lead);
    }
    state.ball.x=lerp(f.sx,f.tx,e);state.ball.y=lerp(f.sy,f.ty,e)-Math.sin(Math.PI*t)*f.arc;
    if(f.meta?.kind==='pass'){
      const m=f.meta, ball=state.ball;
      m.receiver.intent='receive';m.receiver.tx=safeX(ball.x+m.receiver.vx*.12);m.receiver.ty=safeY(ball.y+m.receiver.vy*.12);
      for(const d of m.defenders){
        const remaining=Math.max(.08,f.duration-f.elapsed),predictX=safeX(ball.x+(f.tx-ball.x)*Math.min(.55,remaining/f.duration)),predictY=safeY(ball.y+(f.ty-ball.y)*Math.min(.55,remaining/f.duration));
        d.intent=d===m.challenger?'intercept':'cover';
        if(d===m.challenger){d.tx=predictX;d.ty=predictY;}
      }
      const d=m.challenger;
      if(d&&!m.resolved){
        const dx=d.x-ball.x,dy=d.y-ball.y,dist=Math.hypot(dx,dy),speed=Math.hypot(d.vx,d.vy);
        const closing=(d.vx*(-dx)+d.vy*(-dy))/(Math.max(.001,speed)*Math.max(.001,dist));
        const ia=d.attributes||{},challengeRadius=.020+.009*(ia.interception||.85),reactionGate=.11+.08*(1-(ia.reaction||.85));
        if(dist<challengeRadius && speed>.035 && closing>.15 && f.elapsed>reactionGate){
          m.resolved=true;state.ball.flight=null;state.pendingPass=null;d.x=clamp(d.x,FLIGHT.hardX0,FLIGHT.hardX1);d.y=clamp(d.y,FLIGHT.hardY0,FLIGHT.hardY1);d.form=clamp((d.form||0)+.025,-.12,.12);m.from.form=clamp((m.from.form||0)-.012,-.12,.12);
          state.teamStats[d.team].interceptions++;state.playerStats[d.player.id].interceptions++;recordEvent('intercept',{player:d.player.name,team:d.team,from:m.from.player.name},3.2);audio.intercept();audio.crowdHit(.10);
          showBanner(`INTERCEPTION · ${d.player.name}`,'',1.4);eventLine('intercept',{pet:d.player.name,from:m.from.player.name},d.player,.18);
          setPossession(d.team,d,.16);scheduleNext(.7,1.35);return;
        }
      }
    }
    if(t>=1){state.ball.flight=null;const cb=f.onDone;if(cb)cb()}
  }

  function weightedPlayer(team,exclude=null){
    const pool=teamEntities(team).filter(e=>e!==exclude);return pool[Math.floor(state.simRand()*pool.length)]||teamEntities(team)[0];
  }
  function scheduleNext(min=1.0,max=1.9){state.actionTimer=min+state.simRand()*(max-min)}

  function performPass(){
    const from=state.carrier;if(!from){scheduleNext();return}
    const team=from.team,opp=other(team),dir=teamMeta[team].attack,choices=teamEntities(team).filter(e=>e!==from);
    const ranked=choices.map(to=>{const defenders=teamEntities(opp),space=Math.min(...defenders.map(d=>dist2(to,d))),forward=(to.x-from.x)*dir,lane=passingLaneRisk(from,to,opp),a=from.attributes||{};return {to,score:forward*.36+space*.54-lane*.62+(a.passing||.85)*.08+(state.simRand()-.5)*.055}}).sort((a,b)=>b.score-a.score);
    const to=ranked[0]?.to||weightedPlayer(team,from);state.teamStats[team].passes++;state.playerStats[from.player.id].passes++;state.passesSinceShot++;
    const defenders=teamEntities(opp),passerA=from.attributes||{},receiverA=to.attributes||{};
    // Pass into space: weight the target by receiver movement, anticipation and passer quality.
    const lead=.055+.055*(receiverA.anticipation||.85)+.018*(passerA.passing||.85);
    to.tx=safeX(to.x+dir*lead+to.vx*.20);to.ty=safeY(to.y+to.vy*.24+(state.simRand()-.5)*(.09-.035*(passerA.decision||.85)));
    const start=ballHoldPoint(from),target={x:to.tx,y:to.ty};
    const laneScore=d=>{
      const vx=target.x-start.x,vy=target.y-start.y,len2=vx*vx+vy*vy||.001;
      const q=clamp(((d.x-start.x)*vx+(d.y-start.y)*vy)/len2,0,1),px=start.x+vx*q,py=start.y+vy*q;
      const laneDist=Math.hypot(d.x-px,d.y-py),goalSide=(opp==='belros'?d.x<from.x:d.x>from.x)?-.015:0;
      return laneDist+Math.abs(q-.58)*.045+goalSide+(state.simRand()-.5)*.018;
    };
    const challenger=[...defenders].sort((a,b)=>laneScore(a)-laneScore(b))[0];
    const risk=(from.player.risk-1)*.07,distToLane=Math.min(...defenders.map(laneScore)),ca=challenger?.attributes||{};
    const readWindow=.155+.05*(ca.anticipation||.85),attemptChance=.22+.21*(ca.interception||.85)+.15*(ca.anticipation||.85)-distToLane*1.35+risk;
    const attempt=distToLane<readWindow && state.simRand()<clamp(attemptChance,.06,.62);
    const passDist=Math.hypot(target.x-start.x,target.y-start.y),duration=clamp(.48+passDist*1.05,.54,.92);
    state.pendingPass={from,to,challenger:attempt?challenger:null};audio.shot();
    startFlight(start,target,duration,.032,()=>{
      if(attempt&&challenger){challenger.intent='recover';challenger.tx=safeX(lerp(challenger.x,opp==='belros'?.11:.89,.20));challenger.ty=safeY(challenger.y+(state.simRand()-.5)*.055);challenger.form=clamp((challenger.form||0)-.008,-.12,.12)}
      state.pendingPass=null;state.teamStats[team].completed++;state.playerStats[from.player.id].completed++;from.form=clamp((from.form||0)+.006,-.12,.12);state.lastPasser=from;state.carrier=to;state.possession=team;
      state.zone=clamp(state.zone+.065+.045*state.simRand(),.1,.94);eventLine('pass',{from:from.player.name,to:to.player.name},to.player,.05);
      setNormalFormation();scheduleNext();
    },{kind:'pass',from,receiver:to,defenders,challenger:attempt?challenger:null,resolved:false});
  }

  function performDrive(){
    const e=state.carrier;if(!e){scheduleNext();return}state.zone=clamp(state.zone+.15+.11*state.simRand(),.08,.97);e.tx=clamp(e.tx+teamMeta[e.team].attack*(.075+.025*state.simRand()),.18,.82);e.ty=clamp(e.ty+(state.simRand()-.5)*.12,.34,.70);eventLine('drive',{pet:e.player.name},e.player,.08);setNormalFormation();scheduleNext(.9,1.55);
  }

  const hoops={
    belros:[{x:.882,y:.529},{x:.902,y:.467},{x:.923,y:.529}],
    zafran:[{x:.077,y:.529},{x:.098,y:.467},{x:.118,y:.529}]
  };

  function chooseShotOutcome(shooter,penalty=false){
    const a=shooter.attributes||{},speed=Math.hypot(shooter.vx,shooter.vy),defenders=teamEntities(other(shooter.team)),pressure=Math.min(...defenders.map(d=>dist2(shooter,d))),goalX=shooter.team==='belros'?.91:.09,distGoal=Math.abs(goalX-shooter.x);
    const pressurePenalty=clamp((.16-pressure)*.72,0,.10),distancePenalty=clamp((distGoal-.18)*.18,0,.055),motionPenalty=clamp(speed-.13,0,.08)*.22;
    if(penalty){const quality=.58+.16*(a.shooting||.85)+.08*(a.composure||.85)+(shooter.form||0);const r=state.simRand();return r<clamp(quality,.61,.82)?'goal':r<.88?'save':r<.95?'post':'miss'}
    const roleBoost=shooter.player.role==='attacker'?.025:shooter.player.role==='defender'?-.015:0,quality=.07*(a.shooting||.85)+.045*(a.composure||.85)+(shooter.form||0)*.18;
    const goalP=clamp(.145+state.zone*.15+roleBoost+quality-pressurePenalty-distancePenalty-motionPenalty,.14,.43),saveP=clamp(.19+pressurePenalty*.5,.15,.25),postP=.15;const r=state.simRand();return r<goalP?'goal':r<goalP+saveP?'save':r<goalP+saveP+postP?'post':'miss';
  }

  function performShot(opts={}){
    const shooter=opts.shooter||state.carrier;if(!shooter)return;
    // Normal shots are only allowed from the attacker's half of the pitch, close enough
    // to the hoops to feel like a real scoring chance. Admin penalty previews bypass this.
    if(!opts.penalty && ((shooter.team==='belros' && (state.zone<.58 || shooter.x<.52)) || (shooter.team==='zafran' && (state.zone<.58 || shooter.x>.48)))) {
      performDrive(); return;
    }
    const team=opts.team||shooter.team,opp=other(team),penalty=!!opts.penalty,shootout=!!opts.shootout;
    state.teamStats[team].shots++;state.playerStats[shooter.player.id].shots++;
    const hoop=hoops[team][Math.floor(state.simRand()*3)],outcome=chooseShotOutcome(shooter,penalty);
    let target={x:hoop.x,y:hoop.y};
    if(outcome==='goal'||outcome==='save'){target={x:hoop.x+(state.simRand()-.5)*.010,y:hoop.y+(state.simRand()-.5)*.015};state.teamStats[team].onTarget++}
    else if(outcome==='post'){const side=state.simRand()<.5?-1:1;target={x:hoop.x+side*.013,y:hoop.y+(state.simRand()-.5)*.023}}
    else {target={x:hoop.x+(state.simRand()-.5)*.065,y:hoop.y+(state.simRand()-.5)*.11}}
    state.camera.tx=team==='belros'?.54:.46;state.camera.ty=.52;state.camera.tz=1.065;
    audio.shot();audio.crowdHit(.09);eventLine('shot',{pet:shooter.player.name},shooter.player,.12);showBanner(penalty?`PENALTY · ${shooter.player.name}`:`SHOT · ${shooter.player.name}`,'',1.15);
    const from=ballHoldPoint(shooter);
    startFlight(from,target,penalty?.86:.68,penalty?.055:.075,()=>handleShotResult({team,opp,shooter,outcome,hoop,target,penalty,shootout}));
  }

  function handleShotResult(info){
    const {team,opp,shooter,outcome,hoop,penalty,shootout}=info;
    if(outcome==='goal'){
      if(shootout){resolveShootoutPenalty(team,true,shooter);return}
      state.score[team]++;state.playerStats[shooter.player.id].goals++;recordEvent('goal',{player:shooter.player.name,team},6.0);const assister=(state.lastPasser&&state.lastPasser.team===team)?state.lastPasser:null;if(assister)state.playerStats[assister.player.id].assists++;
      audio.ensure();audio.play(audio.goal,.70);audio.crowdHit(.46);state.camera.shake=.012;state.celebration={team,scorer:shooter,elapsed:0,duration:2.8};
      teamEntities(team).forEach((e,i)=>{e.tx=clamp(shooter.x-teamMeta[team].attack*(.025+i*.035),.18,.82);e.ty=clamp(shooter.y+(i-1)*.055,.34,.70);e.celebrate=2.8});
      const score=`${state.score.belros}-${state.score.zafran}`,late=state.matchTime>15*60,equal=state.score.belros===state.score.zafran,goAhead=Math.abs(state.score.belros-state.score.zafran)===1;const flavour=late?(equal?'LATE EQUALISER!':'DRAMA!'):equal?'ALL SQUARE!':goAhead?'GO-AHEAD GOAL!':'GOAL!';showBanner(`${flavour} · ${shooter.player.name} · ${score}`,'',2.4);eventLine('goal',{pet:shooter.player.name,team:teamMeta[team].name,score},shooter.player,.24);
      const varCheck=!penalty&&state.simRand()<.12;
      if(varCheck){state.delay={t:1.15,cb:()=>startVar({kind:'goal',team,shooter,assister})};}
      else state.delay={t:2.6,cb:()=>restartAfterScore(opp)};
    }else if(outcome==='save'){
      const defender=rolePlayer(opp,'defender');state.playerStats[defender.player.id].saves++;recordEvent('save',{player:defender.player.name,team:opp},3.7);defender.tx=info.hoop.x+(team==='belros'?-.025:.025);defender.ty=info.hoop.y;audio.crowdHit(.13);showBanner(`SAVE · ${defender.player.name}`,'',1.6);eventLine('save',{pet:shooter.player.name,defender:defender.player.name},defender.player,.10);
      if(shootout){resolveShootoutPenalty(team,false,shooter);return}
      setPossession(opp,defender,.12);scheduleNext(.75,1.4);
    }else if(outcome==='post'){
      audio.rebound();audio.crowdHit(.18);state.camera.shake=.007;recordEvent('post',{player:shooter.player.name,team},4.2);showBanner('OFF THE RING!','danger',1.5);eventLine('post',{pet:shooter.player.name},shooter.player,.08);
      if(shootout){resolveShootoutPenalty(team,false,shooter);return}
      const reboundTeam=state.simRand()<.5?team:opp,rebounder=weightedPlayer(reboundTeam);state.teamStats[reboundTeam].rebounds++;state.playerStats[rebounder.player.id].rebounds++;recordEvent('rebound',{player:rebounder.player.name,team:reboundTeam},2.1);const rx=clamp(info.hoop.x+(team==='belros'?-.10:.10)+(state.simRand()-.5)*.055,.15,.85),ry=clamp(info.hoop.y+(state.simRand()-.5)*.16,.32,.72);
      startFlight(info.target,{x:rx,y:ry},.52,-.035,()=>{rebounder.tx=rx;rebounder.ty=ry;eventLine('rebound',{pet:rebounder.player.name},rebounder.player,.08);setPossession(reboundTeam,rebounder,reboundTeam===team?clamp(state.zone-.12,.15,.8):.14);scheduleNext(.7,1.35)});
    }else{
      audio.crowdHit(.06);showBanner(`MISS · ${shooter.player.name}`,'',1.25);eventLine('miss',{pet:shooter.player.name},shooter.player,.07);
      if(shootout){resolveShootoutPenalty(team,false,shooter);return}
      const defender=rolePlayer(opp,'defender');setPossession(opp,defender,.12);scheduleNext(.75,1.4);
    }
  }

  function restartAfterScore(team){
    const carrier=teamEntities(team)[Math.floor(state.simRand()*3)];teamEntities(team).forEach((e,i)=>{e.tx=team==='belros'?.43:.57;e.ty=.40+i*.12});teamEntities(other(team)).forEach((e,i)=>{e.tx=team==='belros'?.61:.39;e.ty=.40+i*.12});setPossession(team,carrier,.13);state.camera.tx=.5;state.camera.ty=.5;state.camera.tz=1.015;scheduleNext(.9,1.6);
  }

  function performFoul(offender=null){
    const victim=state.carrier;if(!victim){scheduleNext();return}offender=offender||teamEntities(other(victim.team)).slice().sort((a,b)=>dist2(a,victim)-dist2(b,victim))[0];if(!offender||dist2(offender,victim)>.13){scheduleNext(.45,.8);return}state.teamStats[offender.team].fouls++;state.playerStats[offender.player.id].fouls++;recordEvent('foul',{player:offender.player.name,team:offender.team,victim:victim.player.name},2.4);offender.form=clamp((offender.form||0)-.018,-.12,.12);offender.tx=victim.x;offender.ty=victim.y;state.ref.tx=clamp(victim.x+.025,.2,.8);state.ref.ty=clamp(victim.y-.08,.3,.7);audio.ensure();audio.play(audio.whistle,.62);audio.crowdHit(.15);state.camera.shake=.008;showBanner(`FOUL · ${offender.player.name}`,'danger',1.8);eventLine('foul',{offender:offender.player.name,victim:victim.player.name},offender.player,.08);
    const inDanger=state.zone>.62,possiblePenalty=inDanger&&state.simRand()<.58;
    if(possiblePenalty && state.simRand()<.30){state.delay={t:1.2,cb:()=>startVar({kind:'foul',team:victim.team,offender,victim,possiblePenalty:true})};}
    else if(possiblePenalty){state.delay={t:1.1,cb:()=>startPenalty(victim.team,false)};}
    else {state.delay={t:1.2,cb:()=>{setPossession(victim.team,victim,clamp(state.zone-.04,.12,.9));scheduleNext(.75,1.4)}};}
  }

  function startVar(ctx){
    if(state.special)return;recordEvent('var',{team:ctx.team,kind:ctx.kind},4.0);state.special={type:'var',elapsed:0,duration:4.8,ctx,decisionShown:false};state.varContext=ctx;state.teamStats[ctx.team].var++;state.camera.tx=ctx.kind==='goal'?(ctx.team==='belros'?.54:.46):clamp((ctx.victim?.x||.5)-.5,-.04,.04)+.5;state.camera.ty=ctx.victim?.y||.52;state.camera.tz=1.075;state.ref.tx=ctx.victim?.x||((ctx.team==='belros')?.84:.16);state.ref.ty=ctx.victim?.y||.54;
    if(ctx.kind==='goal')ctx.decision=state.simRand()<.16?'NO GOAL':'GOAL CONFIRMED';else ctx.decision=state.simRand()<.66?'PENALTY':'NO FOUL';
    $('wcgVar').classList.add('is-open');$('wcgVar').classList.remove('is-decision');$('wcgVarTitle').textContent='VAR CHECK';$('wcgVarText').textContent=ctx.kind==='goal'?'Checking the scoring phase…':'Reviewing the contact in the goal area…';audio.varTone();showBanner('VAR CHECK','var',2.2);barryReaction('VAR_REACTION',8,700);say(formatLine('var'),commentaryOpts('var'));
  }
  function updateVar(dt){
    const s=state.special;if(!s||s.type!=='var')return;s.elapsed+=dt;
    if(s.elapsed>2.45&&!s.decisionShown){s.decisionShown=true;$('wcgVar').classList.add('is-decision');$('wcgVarTitle').textContent=s.ctx.decision;$('wcgVarText').textContent=s.ctx.decision==='NO GOAL'?'The goal is overturned.':s.ctx.decision==='GOAL CONFIRMED'?'The goal stands.':s.ctx.decision==='PENALTY'?'Contact upgraded to a penalty.':'No punishable foul found.';audio.varTone();showBanner(s.ctx.decision,s.ctx.decision==='NO GOAL'?'danger':'var',2.0)}
    if(s.elapsed>=s.duration){const ctx=s.ctx;$('wcgVar').classList.remove('is-open','is-decision');state.special=null;state.camera.tx=.5;state.camera.ty=.5;state.camera.tz=1.02;
      if(ctx.kind==='goal'){
        if(ctx.decision==='NO GOAL'){state.score[ctx.team]=Math.max(0,state.score[ctx.team]-1);state.playerStats[ctx.shooter.player.id].goals=Math.max(0,state.playerStats[ctx.shooter.player.id].goals-1);if(ctx.assister)state.playerStats[ctx.assister.player.id].assists=Math.max(0,state.playerStats[ctx.assister.player.id].assists-1);showBanner('GOAL OVERTURNED','danger',2.0);say(`VAR overturns it. ${ctx.shooter.player.name}'s finish is wiped away and ${teamMeta[other(ctx.team)].name} restart.`,{priority:9,intensity:'excited',force:true,kind:'var'});restartAfterScore(other(ctx.team));}
        else {say(`Decision confirmed. ${ctx.shooter.player.name}'s goal stands.`,{priority:8,intensity:'excited',force:true,kind:'var'});restartAfterScore(other(ctx.team));}
      } else {
        if(ctx.decision==='PENALTY'){say(`The review is complete: penalty to ${teamMeta[ctx.team].name}.`,{priority:8,intensity:'excited',force:true,kind:'var'});startPenalty(ctx.team,false)}
        else {say('No penalty after review. The referee restarts play.',{priority:7,intensity:'interested',force:true,kind:'var'});setPossession(ctx.team,ctx.victim,.38);scheduleNext(.75,1.4)}
      }
    }
  }

  function startPenalty(team,shootout=false){
    if(!shootout)state.teamStats[team].penalties++;
    const shooter=teamEntities(team).find(e=>e.player.role==='attacker')||teamEntities(team)[0];state.special={type:'penalty',elapsed:0,team,shooter,shootout,shot:false};
    const dir=teamMeta[team].attack;shooter.tx=team==='belros'?.72:.28;shooter.ty=.52;teamEntities(team).filter(e=>e!==shooter).forEach((e,i)=>{e.tx=.5-dir*.08;e.ty=.39+i*.24});teamEntities(other(team)).forEach((e,i)=>{e.tx=.5+dir*.08;e.ty=.39+i*.12});state.ref.tx=.5;state.ref.ty=.42;state.camera.tx=team==='belros'?.535:.465;state.camera.ty=.52;state.camera.tz=1.06;showBanner(shootout?'SHOOTOUT PENALTY':`PENALTY · ${teamMeta[team].name}`,'danger',2.0);eventLine('penalty',{team:teamMeta[team].name,pet:shooter.player.name},shooter.player,.06);audio.ensure();audio.play(audio.whistle,.55);
  }
  function updatePenalty(dt){
    const s=state.special;if(!s||s.type!=='penalty')return;s.elapsed+=dt;
    if(s.elapsed>=1.45&&!s.shot){s.shot=true;const shooter=s.shooter,team=s.team,shootout=s.shootout;state.special=null;state.carrier=shooter;state.possession=team;performShot({shooter,team,penalty:true,shootout});}
  }

  function nextAction(){
    if(state.phase!=='first'&&state.phase!=='second')return;if(state.special||state.delay||state.ball.flight)return;
    if(!state.carrier){setPossession(state.possession,weightedPlayer(state.possession),.15)}
    const nearestDef=teamEntities(other(state.carrier.team)).slice().sort((a,b)=>dist2(a,state.carrier)-dist2(b,state.carrier))[0],contact=nearestDef?dist2(nearestDef,state.carrier):1,aggr=nearestDef?.attributes?.aggression||.7;
    const foulChance=contact<.09?clamp(.012+(aggr-.65)*.09+Math.max(0,.05-contact)*.8,.005,.075):0;
    if(foulChance&&state.simRand()<foulChance){performFoul(nearestDef);return}
    const shotChance=state.zone>.58 ? .10 + state.passesSinceShot*.095 + state.zone*.12 + (state.carrier.attributes?.decision||.85)*.025 : .008;
    if(state.simRand()<clamp(shotChance,.02,.63)){performShot();return}
    if(state.simRand()<.24){performDrive();return}
    performPass();
  }

  function beginKickoff(team,second=false){
    state.phase=second?'second':'first';state.half=second?2:1;setBroadcastState('LIVE');const receiver=teamEntities(team)[second?1:0];state.possession=team;state.carrier=null;state.kickoffReceiver=receiver;state.zone=.12;state.passesSinceShot=0;state.lastPasser=null;state.camera.tx=.5;state.camera.ty=.5;state.camera.tz=1.015;audio.ensure();try{if(audio.prematch){audio.prematch.pause();audio.prematch.currentTime=0}if(audio.crowd)audio.crowd.volume=state.crowdBase}catch(_){}audio.play(audio.whistle,.62);audio.crowdHit(.16);showBanner(second?'SECOND HALF · PLAY!':'QUILL ON!','',1.8);say(formatLine('kickoff'),commentaryOpts('kickoff'));
    const from=second?{x:.5,y:.56}:{x:state.ball.x||.5,y:state.ball.y||.535};receiver.intent='receive';receiver.tx=safeX(.5+(team==='belros'?-.025:.025));receiver.ty=.575;state.ball.visible=true;
    startFlight(from,{x:receiver.tx,y:receiver.ty},second?.62:.78,-.025,()=>{state.kickoffReceiver=null;setPossession(team,receiver,.12);scheduleNext(.75,1.3)},{kind:'kickoff',receiver});
  }

  function beginHalftime(){
    if(state.phase==='halftime')return;state.phase='halftime';state.special=null;state.delay=null;state.ball.flight=null;state.carrier=null;state.ball.visible=false;state.halftimeElapsed=0;state.halftimeReady=false;setBroadcastState('HALFTIME');audio.ensure();audio.play(audio.whistle,.55);barryReaction('HALFTIME',7,1500);say(formatLine('halftime'),commentaryOpts('halftime'));showBanner('HALF TIME','',2.2);$('wcgHalftime').classList.remove('is-open');const bx=[.29,.36,.43],zx=[.71,.64,.57];teamEntities('belros').forEach((e,i)=>{e.tx=bx[i];e.ty=.685});teamEntities('zafran').forEach((e,i)=>{e.tx=zx[i];e.ty=.685});state.ref.tx=.5;state.ref.ty=.685;state.camera.tx=.5;state.camera.ty=.54;state.camera.tz=.985;updateHalftimePresentation(0);
  }
  async function continueSecondHalf(){
    if(!isHost()||state.phase!=='halftime'||!state.halftimeReady)return;await sendMatch('second-half',{host:'CatAsthma',at:Date.now()});handleSecondHalf();
  }
  function handleSecondHalf(){
    if(state.phase!=='halftime')return;for(const e of state.entities){e.fatigue*=.28;e.form*=.82;e.vx*=.25;e.vy*=.25}$('wcgHalftime').classList.remove('is-open');state.phase='secondcountdown';state.secondCountdown=3.05;setBroadcastState('SECOND_HALF_COUNTDOWN');state.ball.visible=true;const h=refStandingBallPoint();state.ball.x=h.x;state.ball.y=h.y;updateSecondHalfCountdown(0);
  }

  function beginShootout(){
    state.phase='shootout';state.shootout={score:{belros:0,zafran:0},attempts:{belros:0,zafran:0},turn:0,order:['belros','zafran'],round:0};state.special=null;state.delay={t:2.0,cb:shootoutNext};showBanner('PENALTY SHOOTOUT','var',2.4);say('Eighteen minutes cannot separate them. No Golden Snitch here — Belros and Zafran will settle it from the penalty line.');audio.ensure();audio.play(audio.whistle,.6);
  }
  function shootoutNext(){
    const so=state.shootout;if(!so)return;const team=so.order[so.turn%2];const attemptsA=so.attempts.belros,attemptsB=so.attempts.zafran;
    if(attemptsA>=3&&attemptsB>=3&&attemptsA===attemptsB&&so.score.belros!==so.score.zafran){finishMatch(true);return}
    if(attemptsA>=3&&attemptsB>=3&&Math.abs(attemptsA-attemptsB)===0&&so.score.belros===so.score.zafran){/* sudden death continues */}
    startPenalty(team,true);
  }
  function resolveShootoutPenalty(team,scored,shooter){
    const so=state.shootout;if(!so)return;so.attempts[team]++;if(scored){so.score[team]++;audio.ensure();audio.play(audio.goal,.68);audio.crowdHit(.32);showBanner(`PENALTY SCORED · ${shooter.player.name}`,'',1.8);say(`${shooter.player.name} scores in the shootout. ${so.score.belros}-${so.score.zafran} on penalties.`)}else{showBanner(`PENALTY MISSED · ${shooter.player.name}`,'danger',1.8);say(`${shooter.player.name} cannot convert. The shootout remains ${so.score.belros}-${so.score.zafran}.`)}
    so.turn++;
    const a=so.attempts.belros,b=so.attempts.zafran,sa=so.score.belros,sb=so.score.zafran;
    // Early mathematical finish during first three each.
    if(a<=3&&b<=3){const remA=3-a,remB=3-b;if(sa>sb+remB||sb>sa+remA){state.delay={t:2.2,cb:()=>finishMatch(true)};return}}
    if(a>=3&&b>=3&&a===b&&sa!==sb){state.delay={t:2.2,cb:()=>finishMatch(true)};return}
    state.delay={t:2.2,cb:shootoutNext};
  }

  function populateFulltimePanel(data){
    const {fromShootout,winner,so,mvp}=data;$('wcgFullTitle').textContent=`${teamMeta[winner].name} WIN`;$('wcgFullSubtitle').textContent=fromShootout?'DECIDED BY PENALTY SHOOTOUT':'FULL TIME · CROWN OF VARDESH GLACIER';$('wcgFullScore').textContent=fromShootout?`${state.score.belros}–${state.score.zafran} after 18 minutes · Penalties ${so.score.belros}–${so.score.zafran}`:`BELROS ${state.score.belros}–${state.score.zafran} ZAFRAN`;
    const a=state.teamStats.belros,b=state.teamStats.zafran,possTotal=Math.max(.001,a.possession+b.possession),pa=Math.round(a.possession/possTotal*100),pb=100-pa;
    const rows=[['SHOTS',a.shots,b.shots],['ON TARGET',a.onTarget,b.onTarget],['SHOT ACCURACY',`${a.shots?Math.round(a.onTarget/a.shots*100):0}%`,`${b.shots?Math.round(b.onTarget/b.shots*100):0}%`],['POSSESSION',`${pa}%`,`${pb}%`],['PASS COMPLETION',`${a.passes?Math.round(a.completed/a.passes*100):0}%`,`${b.passes?Math.round(b.completed/b.passes*100):0}%`],['INTERCEPTIONS',a.interceptions,b.interceptions],['REBOUNDS',a.rebounds,b.rebounds],['FOULS',a.fouls,b.fouls],['PENALTIES',a.penalties,b.penalties],['VAR REVIEWS',a.var,b.var]];
    $('wcgFullStats').innerHTML=`<div class="h">BELROS</div><div></div><div class="h">ZAFRAN</div>`+rows.map(r=>`<div class="val">${r[1]}</div><div class="label">${r[0]}</div><div class="val">${r[2]}</div>`).join('');const ms=state.playerStats[mvp.id];$('wcgMvp').textContent=`PLAYER OF THE MATCH · ${mvp.name} — ${ms.goals} goals, ${ms.assists} assists, ${ms.interceptions} interceptions, ${ms.completed} completed passes.`;
  }

  function finishMatch(fromShootout=false){
    if(state.phase==='fulltime')return;state.phase='fulltime';state.special=null;state.delay=null;state.ball.flight=null;state.carrier=null;state.ball.visible=false;state.fulltimeElapsed=0;setBroadcastState('FULL_TIME');audio.ensure();audio.play(audio.whistle,.65);barryReaction('FULLTIME',9,1800);say(formatLine('fulltime'),commentaryOpts('fulltime'));showBanner('FULL TIME','',2.4);
    const so=state.shootout;let winner;if(fromShootout&&so)winner=so.score.belros>so.score.zafran?'belros':'zafran';else winner=state.score.belros>state.score.zafran?'belros':'zafran';const mvp=playerOfPeriod(null);state.fulltimeData={fromShootout,winner,so,mvp};
    const losers=other(winner),hero=teamEntities(winner).slice().sort((a,b)=>impactFor(b.player)-impactFor(a.player))[0]||teamEntities(winner)[0];teamEntities(winner).forEach((e,i)=>{e.tx=safeX(hero.x-teamMeta[winner].attack*(.025+i*.035));e.ty=safeY(hero.y+(i-1)*.055);e.celebrate=6});teamEntities(losers).forEach((e,i)=>{e.tx=safeX(lerp(e.x,losers==='belros'?.32:.68,.24));e.ty=safeY(.40+i*.12)});state.camera.tx=.5;state.camera.ty=.53;state.camera.tz=.98;updateFulltimePresentation(0);
  }

  function adminEnabled(){try{return isHost() && typeof toaState!=='undefined' && !!toaState.adminMode}catch(_){return false}}
  function skipToHalftime(){if(!adminEnabled()||state.phase!=='first')return;state.matchTime=HALF_SECONDS;beginHalftime()}
  function previewAdminEvent(kind){
    if(!adminEnabled())return;
    const scorer=state.carrier||rolePlayer('belros','attacker'), defender=rolePlayer(other(scorer.team),'defender');
    const team=kind==='goal'?'belros':scorer.team, teamName=teamMeta[team].name;
    const messages={goal:[`GOAL · ${scorer.player.name} · TEST`,''],save:[`SAVE · ${defender.player.name} · TEST`,''],miss:[`MISS · ${scorer.player.name} · TEST`,''],post:['OFF THE RING! · TEST','danger'],foul:[`FOUL · ${defender.player.name} · TEST`,'danger'],penalty:[`PENALTY · ${teamName} · TEST`,'danger'],var:['VAR CHECK · TEST','var'],intercept:[`INTERCEPTION · ${defender.player.name} · TEST`,'']};
    const [text,type]=messages[kind]||['EVENT TEST',''];
    if(kind==='goal'){state.camera.shake=.014;state.celebration={team,scorer,elapsed:0,duration:2.3};teamEntities(team).forEach((e,i)=>{e.tx=clamp(scorer.x-teamMeta[team].attack*(.025+i*.035),.18,.82);e.ty=clamp(scorer.y+(i-1)*.055,.30,.72)});audio.ensure();audio.play(audio.goal,.7);audio.crowdHit(.38)}
    if(kind==='foul'||kind==='penalty'){audio.ensure();audio.play(audio.whistle,.62);state.camera.shake=.009}
    if(kind==='save'||kind==='miss'||kind==='post'||kind==='intercept'){audio.crowdHit(.18);state.camera.shake=.006}
    showBanner(text,type,2.0);say(kind==='goal'?`TEST EVENT: ${scorer.player.name} scores for ${teamName}.`:kind==='foul'?'TEST EVENT: referee whistles for a foul.':kind==='penalty'?`TEST EVENT: penalty awarded to ${teamName}.`:kind==='var'?'TEST EVENT: VAR review is now on screen.':`TEST EVENT: ${text.toLowerCase()}.`);
    if(kind==='var'){const box=$('wcgVar');box.classList.add('is-open');box.classList.remove('is-decision');$('wcgVarTitle').textContent='VAR CHECK';$('wcgVarText').textContent='ADMIN PREVIEW · Reviewing the incident…';setTimeout(()=>{if(!state.open||!adminEnabled())return;box.classList.add('is-decision');$('wcgVarTitle').textContent='GOAL CONFIRMED';$('wcgVarText').textContent='ADMIN PREVIEW · The decision stands.'},1450);setTimeout(()=>box.classList.remove('is-open','is-decision'),3000)}
  }

  function updateIntro(dt){
    const a=audio.prematch;if(a&&!state.prematchAudioFailed&&!a.paused&&Number.isFinite(a.currentTime))state.introElapsed=clamp(a.currentTime,0,INTRO_SECONDS);else state.introElapsed=clamp(state.introElapsed+dt,0,INTRO_SECONDS);
    const cue=Math.floor(state.introElapsed/6);if(cue!==state.introCue&&cue<5){state.introCue=cue;say(commentary.intro[Math.min(cue,commentary.intro.length-1)]);if(cue===1){state.camera.tx=.46;state.camera.tz=1.035}else if(cue===2){state.camera.tx=.54;state.camera.tz=1.035}else if(cue===3){state.camera.tx=.5;state.camera.ty=.56;state.camera.tz=1.045}else{state.camera.tx=.5;state.camera.ty=.5;state.camera.tz=1.005}}
    updatePrematchPresentation();updateKickoffToss(dt);if(state.prematchAudioFailed&&state.introElapsed>=INTRO_SECONDS-.02)completePrematch();
  }

  function updateDelay(dt){if(!state.delay)return;state.delay.t-=dt;if(state.delay.t<=0){const cb=state.delay.cb;state.delay=null;cb?.()}}

  function updateMatchDirector(dt){
    const d=state.director||(state.director={phase:'BUILD-UP',momentum:{belros:0,zafran:0},pressure:{belros:0,zafran:0},recent:[],pulse:0});
    d.pulse-=dt;if(d.pulse>0)return;d.pulse=.32;
    const carrier=state.carrier,flight=state.ball.flight,zone=state.zone||.15;
    if(flight?.meta?.kind==='pass')d.phase='ATTACK';
    else if(state.special?.type==='penalty')d.phase='SET PIECE';
    else if(state.celebration)d.phase='RESET';
    else if(performance.now()-(state.possessionChangedAt||0)<1800)d.phase='COUNTERATTACK';
    else if(zone>.66)d.phase='GOAL CHANCE';
    else if(zone>.42)d.phase='ATTACK';
    else d.phase='BUILD-UP';
    for(const team of ['belros','zafran']){
      const st=state.teamStats[team],opp=state.teamStats[other(team)];
      const raw=(st.completed-opp.completed)*.012+(st.interceptions-opp.interceptions)*.06+(st.shots-opp.shots)*.045+(state.score[team]-state.score[other(team)])*.08;
      d.momentum[team]=lerp(d.momentum[team],clamp(raw,-.32,.32),.18);
      d.pressure[team]=lerp(d.pressure[team],carrier&&carrier.team!==team?clamp(zone,.1,.95):.12,.22);
    }
    for(const e of state.entities){
      const a=e.attributes||{};const halfProgress=clamp((state.matchTime%(HALF_SECONDS||540))/HALF_SECONDS,0,1);
      e.fatigue=clamp(halfProgress*(1-(a.stamina||.9))*.34 + (state.half===2?.025:0),0,.10);
      e.form=clamp(e.form*.985,-.12,.12);
    }
  }

  function nearestOpponent(e){return teamEntities(other(e.team)).slice().sort((a,b)=>dist2(e,a)-dist2(e,b))[0]||null}
  function assignMarks(defTeam,attackers,carrier){
    const defenders=teamEntities(defTeam),available=attackers.filter(a=>a!==carrier);
    defenders.forEach((d,i)=>{
      if(i===0&&carrier){d.mark=carrier;return}
      const candidates=available.filter(a=>!defenders.some(x=>x!==d&&x.mark===a));
      d.mark=(candidates.length?candidates:available).slice().sort((a,b)=>dist2(d,a)-dist2(d,b))[0]||carrier||null;
    });
  }

  function passingLaneRisk(from,to,defTeam){
    const vx=to.x-from.x,vy=to.y-from.y,len2=vx*vx+vy*vy||.0001;
    let risk=0;
    for(const d of teamEntities(defTeam)){
      const q=clamp(((d.x-from.x)*vx+(d.y-from.y)*vy)/len2,0,1),px=from.x+vx*q,py=from.y+vy*q;
      const lane=Math.hypot(d.x-px,d.y-py),aw=d.attributes?.awareness||.85;
      risk=Math.max(risk,clamp((.18-lane)*4.2*aw,0,.72));
    }
    return risk;
  }

  function chooseSupportTarget(e,carrier,ballFuture,slot){
    const dir=teamMeta[e.team].attack,a=e.attributes||{},creative=e.personality==='creative';
    const ahead=slot===0 ? (.105+.035*a.anticipation) : (.025+.025*a.positioning);
    const width=(slot===0?-1:1)*(.125+.045*a.positioning);
    let x=ballFuture.x+dir*ahead,y=ballFuture.y+width;
    // Creative/support players occasionally cross or make a decoy run, but only when there is room.
    if(creative&&state.simRand()<.11){y=ballFuture.y-width*.72;x+=dir*.035}
    const nearest=nearestOpponent(e);if(nearest&&dist2({x,y},nearest)<.10)y+=Math.sign(y-nearest.y||1)*.055;
    return {x:safeX(x),y:safeY(y)};
  }

  function refreshMovementTargets(force=false){
    if(state.phase!=='first'&&state.phase!=='second')return;
    const ball=state.ball.flight?state.ball:(state.carrier||{x:.5,y:.5,vx:0,vy:0});
    const poss=state.possession,attackDir=teamMeta[poss].attack,defTeam=other(poss),carrier=state.carrier;
    const phase=state.director?.phase||'BUILD-UP',counter=phase==='COUNTERATTACK',phaseLead=state.ball.flight?.meta?.kind==='pass'?.055:0;
    const ballFuture={x:safeX(ball.x+(state.ball.flight?(state.ball.flight.tx-ball.x)*.42:(carrier?.vx||0)*(.35+.16*(carrier?.attributes?.anticipation||.8)))),y:safeY(ball.y+(state.ball.flight?(state.ball.flight.ty-ball.y)*.42:(carrier?.vy||0)*.42))};
    const attackers=teamEntities(poss),defenders=teamEntities(defTeam);assignMarks(defTeam,attackers,carrier);
    attackers.forEach((e,i)=>{
      if(state.kickoffReceiver===e){const b=state.ball; e.intent='receive';e.tx=safeX(b.x+teamMeta[e.team].attack*.008);e.ty=safeY(b.y+.025);return}
      if(e===carrier){
        const a=e.attributes||{},goalX=attackDir>0?FLIGHT.softX1:FLIGHT.softX0,nearest=nearestOpponent(e),pressure=nearest?dist2(e,nearest):1;
        let laneY=e.y+(state.simRand()-.5)*(.025+.035*(1-a.decision));
        if(nearest&&pressure<.13)laneY+=Math.sign(e.y-nearest.y||((state.simRand()-.5)||1))*(.045+.035*a.turn);
        e.intent=pressure<.12?'evade':'carry';e.tx=safeX(lerp(e.x,goalX,counter?.14:.075)+attackDir*phaseLead);e.ty=safeY(laneY);return;
      }
      if(state.ball.flight?.meta?.receiver===e)return;
      const mates=attackers.filter(x=>x!==carrier),slot=mates.indexOf(e),t=chooseSupportTarget(e,carrier,ballFuture,slot);
      e.intent=counter?'break':'support';e.tx=t.x;e.ty=t.y;
    });
    defenders.forEach((e,i)=>{
      if(state.ball.flight?.meta?.challenger===e)return;
      const a=e.attributes||{},ownGoalX=defTeam==='belros'?.085:.915,marked=e.mark||carrier;
      const goalSideAmount=.17+i*.065+.05*(a.positioning||.8),goalSideX=lerp(ballFuture.x,ownGoalX,goalSideAmount);
      const canPress=carrier&&i===0&&dist2(e,carrier)<(.20+.07*(a.aggression||.7));
      e.intent=canPress?'press':'mark';e.currentThreat=marked;
      e.tx=safeX(canPress?lerp(carrier.x,ownGoalX,.095):goalSideX);
      const markY=marked?.y??ballFuture.y;e.ty=safeY(lerp(ballFuture.y,markY,.62)+(i-1)*.055);
      // On an active pass, good anticipators shade toward the future lane before deciding to challenge.
      if(state.ball.flight&&a.anticipation>.9){e.tx=safeX(lerp(e.tx,ballFuture.x,.18));e.ty=safeY(lerp(e.ty,ballFuture.y,.18))}
    });
    // Low-amplitude tactical drift keeps players adjusting instead of parking on an exact coordinate.
    const flowClock=(state.matchTime||0)*.72;
    for(const e of state.entities){
      if(e.intent==='intercept'||e.intent==='receive'||e.intent==='recover')continue;
      const dir=teamMeta[e.team].attack,phase=e.flowPhase||0;
      e.tx=safeX(e.tx+Math.cos(flowClock+phase)*FLOW.driftX*dir);
      e.ty=safeY(e.ty+Math.sin(flowClock*1.13+phase)*FLOW.driftY);
    }
    // Soft spatial separation: target-space repulsion, stronger for teammates so support lanes remain readable.
    for(const e of state.entities){
      let sx=0,sy=0;
      for(const o of state.entities){if(o===e)continue;const dx=e.tx-o.tx,dy=e.ty-o.ty,d=Math.hypot(dx,dy);if(d<.082){const k=(.082-d)/.082,teamK=e.team===o.team?1:.72;sx+=(dx/(d||.01))*k*.029*teamK;sy+=(dy/(d||.01))*k*.037*teamK}}
      e.tx=safeX(e.tx+sx);e.ty=safeY(e.ty+sy);
    }
  }

  function lowerSoftLimit(e){const scale=e?.player?(PLAYER_SCALE[e.player.id]||1):.72;return FLIGHT.softY1-Math.max(0,scale-1)*.045}
  function lowerHardLimit(e){const scale=e?.player?(PLAYER_SCALE[e.player.id]||1):.72;return FLIGHT.hardY1-Math.max(0,scale-1)*.035}
  function enforceInteriorIntent(e,dt){
    const mx=.034,my=.034,softBottom=lowerSoftLimit(e);let threatened=false,bottomThreat=false;
    if(e.x<FLIGHT.softX0+mx){e.tx=Math.max(e.tx,FLIGHT.softX0+.075);if(e.vx<0)e.vx=lerp(e.vx,.055,.24);threatened=true}
    else if(e.x>FLIGHT.softX1-mx){e.tx=Math.min(e.tx,FLIGHT.softX1-.075);if(e.vx>0)e.vx=lerp(e.vx,-.055,.24);threatened=true}
    if(e.y<FLIGHT.softY0+my){e.ty=Math.max(e.ty,FLIGHT.softY0+.075);if(e.vy<0)e.vy=lerp(e.vy,.060,.26);threatened=true}
    else if(e.y>softBottom-my*1.65){e.ty=Math.min(e.ty,softBottom-.105);if(e.vy>-.02)e.vy=lerp(e.vy,-.105,.48);threatened=true;bottomThreat=true}
    const slow=Math.hypot(e.vx,e.vy)<.032;e.edgeStall=threatened&&slow?(e.edgeStall||0)+dt:Math.max(0,(e.edgeStall||0)-dt*2.5);
    if(bottomThreat&&e.y>softBottom-.012){const side=(e.x<.5?1:-1);e.ty=Math.min(e.ty,.60);e.tx=safeX(e.tx+side*.055);e.vy=Math.min(e.vy,-.075);e.vx+=side*.018;e.intent='recover'}
    if(e.edgeStall>(bottomThreat?.12:.24)){e.tx=safeX(lerp(e.x,.5,.38));e.ty=safeY(lerp(e.y,.49,.46));const ix=.5-e.x,iy=.49-e.y,d=Math.hypot(ix,iy)||1;e.vx+=ix/d*.065;e.vy+=iy/d*(bottomThreat?.095:.065);e.edgeStall=0;e.intent='recover'}
  }

  function applyBoundarySteering(e,dvx,dvy){
    // Anticipate walls before contact. This is intentionally a steering field rather than a hard bounce.
    const px=e.x+e.vx*.42,py=e.y+e.vy*.42;const left=(px-FLIGHT.hardX0)/FLIGHT.wallLook,right=(FLIGHT.hardX1-px)/FLIGHT.wallLook;
    const top=(py-FLIGHT.hardY0)/FLIGHT.wallLook,bottom=(lowerHardLimit(e)-py)/FLIGHT.wallLook;
    if(left<1)dvx+=Math.pow(1-clamp(left,0,1),2)*.26;
    if(right<1)dvx-=Math.pow(1-clamp(right,0,1),2)*.26;
    if(top<1)dvy+=Math.pow(1-clamp(top,0,1),2)*.22;
    if(bottom<1)dvy-=Math.pow(1-clamp(bottom,0,1),2)*.48;
    return [dvx,dvy];
  }

  function steerEntity(e,dt){
    enforceInteriorIntent(e,dt);
    const dx=e.tx-e.x,dy=e.ty-e.y,dist=Math.hypot(dx,dy),a=e.attributes||{},fatigue=1-(e.fatigue||0);
    const live=(state.phase==='first'||state.phase==='second'||state.phase==='shootout')&&!state.special&&!state.celebration;
    let desiredSpeed=Math.min((e.maxSpeed||.19)*fatigue,dist*1.9+.022);
    let dvx=dist>.001?dx/dist*desiredSpeed:0,dvy=dist>.001?dy/dist*desiredSpeed:0;

    // Near a tactical target, keep a gentle aerial orbit rather than visibly hovering in one pixel patch.
    if(live&&dist<FLOW.arrivalRadius&&e.intent!=='intercept'&&e.intent!=='receive'){
      const focus=state.ball.flight?state.ball:(state.carrier||{x:.5,y:.5});let ax=e.x-focus.x,ay=e.y-focus.y,ad=Math.hypot(ax,ay)||1;
      let tx=-ay/ad*(e.flowSign||1),ty=ax/ad*(e.flowSign||1);const cruise=FLOW.minCruise*(e.intent==='press'?1.22:e===state.carrier?1.18:.92);
      dvx+=tx*cruise;dvy+=ty*cruise;desiredSpeed=Math.max(desiredSpeed,cruise);
    }

    const wobble=Math.sin(performance.now()/620+e.wander)*(.004+.004*(1-(a.composure||.85)));dvx+=-dy/(dist||1)*wobble;dvy+=dx/(dist||1)*wobble;
    [dvx,dvy]=applyBoundarySteering(e,dvx,dvy);
    const responsiveness=1-Math.exp(-dt*(e.turnRate||5)*fatigue);e.vx=lerp(e.vx,dvx,responsiveness);e.vy=lerp(e.vy,dvy,responsiveness);

    // Physical-space separation also acts on velocity, so clustered riders peel apart instead of idling in a pile.
    if(live){
      for(const o of state.entities){if(o===e)continue;const sx=e.x-o.x,sy=e.y-o.y,sd=Math.hypot(sx,sy);if(sd>0&&sd<FLOW.clusterRadius){const push=(FLOW.clusterRadius-sd)/FLOW.clusterRadius*.050;e.vx+=sx/sd*push*dt*7.5;e.vy+=sy/sd*push*dt*7.5}}
    }

    let sp=Math.hypot(e.vx,e.vy),max=(e.maxSpeed||.19)*fatigue;if(sp>max){e.vx=e.vx/sp*max;e.vy=e.vy/sp*max;sp=max}
    e.hoverTime=live&&sp<.026?(e.hoverTime||0)+dt:Math.max(0,(e.hoverTime||0)-dt*2.8);
    if(live&&e.hoverTime>FLOW.hoverTrigger){
      const attack=teamMeta[e.team].attack,side=e.flowSign||1;e.tx=safeX(e.x+attack*(e===state.carrier?.075:.038));e.ty=safeY(e.y+side*.060);
      e.vx+=attack*FLOW.escapeImpulse*.72;e.vy+=side*FLOW.escapeImpulse;e.hoverTime=0;e.flowSign*=-1;e.intent=e.intent==='shape'?'rotate':e.intent;
    }

    let nx=e.x+e.vx*dt,ny=e.y+e.vy*dt;
    // Emergency containment only. Kill/redirect outward velocity immediately so a rider can never 'fly into' the clamp.
    if(nx<FLIGHT.hardX0){nx=FLIGHT.hardX0+.003;e.vx=Math.abs(e.vx)*.28;e.tx=Math.max(e.tx,FLIGHT.softX0+.035)}
    else if(nx>FLIGHT.hardX1){nx=FLIGHT.hardX1-.003;e.vx=-Math.abs(e.vx)*.28;e.tx=Math.min(e.tx,FLIGHT.softX1-.035)}
    const hardBottom=lowerHardLimit(e),softBottom=lowerSoftLimit(e);
    if(ny<FLIGHT.hardY0){ny=FLIGHT.hardY0+.003;e.vy=Math.abs(e.vy)*.28;e.ty=Math.max(e.ty,FLIGHT.softY0+.07)}
    else if(ny>hardBottom){ny=hardBottom-.004;e.vy=-Math.max(.085,Math.abs(e.vy)*.58);e.ty=Math.min(e.ty,softBottom-.12);e.tx=safeX(lerp(e.tx,.5,.12));e.intent='recover'}
    e.x=nx;e.y=ny;
    if(Math.abs(e.vx)>.005){e.facing=e.vx>=0?1:-1;e.dir=-e.facing}
    e.bank=lerp(e.bank,clamp(e.vy*5.5,-.30,.30),1-Math.exp(-dt*7));if(e.celebrate>0)e.celebrate=Math.max(0,e.celebrate-dt);
  }

  function updateEntities(dt){
    if(state.phase==='intro'){for(const e of state.entities)e.vx=e.vy=0;state.ref.vx=state.ref.vy=0;return}
    if(state.phase==='secondcountdown'){for(const e of state.entities){e.vx=lerp(e.vx,0,1-Math.exp(-dt*8));e.vy=lerp(e.vy,0,1-Math.exp(-dt*8))}state.ref.vx=state.ref.vy=0;return}
    if(state.phase==='halftime'){
      for(const e of state.entities){if(state.halftimeElapsed<2.4)steerEntity(e,dt*.68);else{e.vx=lerp(e.vx,0,1-Math.exp(-dt*7));e.vy=lerp(e.vy,0,1-Math.exp(-dt*7))}}
      state.ref.vx=lerp(state.ref.vx,0,1-Math.exp(-dt*7));state.ref.vy=lerp(state.ref.vy,0,1-Math.exp(-dt*7));return;
    }
    updateMatchDirector(dt);
    state.movementPulse-=dt;if(state.movementPulse<=0){refreshMovementTargets();state.movementPulse=.09+state.simRand()*.08}
    for(const e of state.entities)steerEntity(e,dt);
    const target=state.ball.flight?state.ball:(state.carrier||{x:.5,y:.5});
    state.ref.tx=safeX(target.x-(state.possession==='belros'?.055:-.055));state.ref.ty=safeY(target.y+.075);
    const r=state.ref;enforceInteriorIntent(r,dt);const dx=r.tx-r.x,dy=r.ty-r.y,dist=Math.hypot(dx,dy),ds=Math.min(r.maxSpeed,dist*1.55+.02);let rvx=dist?dx/dist*ds:0,rvy=dist?dy/dist*ds:0;[rvx,rvy]=applyBoundarySteering(r,rvx,rvy);const k=1-Math.exp(-dt*4.2);
    r.vx=lerp(r.vx,rvx,k);r.vy=lerp(r.vy,rvy,k);let rx=r.x+r.vx*dt,ry=r.y+r.vy*dt;
    if(rx<FLIGHT.hardX0){rx=FLIGHT.hardX0+.004;r.vx=Math.abs(r.vx)*.3;r.tx=FLIGHT.softX0+.07}else if(rx>FLIGHT.hardX1){rx=FLIGHT.hardX1-.004;r.vx=-Math.abs(r.vx)*.3;r.tx=FLIGHT.softX1-.07}
    if(ry<FLIGHT.hardY0){ry=FLIGHT.hardY0+.004;r.vy=Math.abs(r.vy)*.3;r.ty=FLIGHT.softY0+.07}else if(ry>lowerHardLimit(r)){ry=lowerHardLimit(r)-.004;r.vy=-Math.max(.07,Math.abs(r.vy)*.52);r.ty=lowerSoftLimit(r)-.11}
    r.x=rx;r.y=ry;if(Math.abs(r.vx)>.003)r.dir=r.vx>=0?1:-1;
  }

  function updateCamera(dt){
    if(!state.special&&state.phase!=='intro'&&state.phase!=='halftime'&&state.phase!=='secondcountdown'&&state.phase!=='fulltime'){
      const focus=state.ball.flight?state.ball:(state.carrier||{x:.5,y:.5});state.camera.tx=clamp(.5+(focus.x-.5)*.15,.46,.54);state.camera.ty=clamp(.5+(focus.y-.5)*.12,.47,.54);state.camera.tz=state.celebration?1.055:1.018;
    }
    const k=1-Math.exp(-dt*2.4);state.camera.x=lerp(state.camera.x,state.camera.tx,k);state.camera.y=lerp(state.camera.y,state.camera.ty,k);state.camera.zoom=lerp(state.camera.zoom,state.camera.tz,k);state.camera.shake=Math.max(0,state.camera.shake-dt*.018);
  }

  function drawSprite(ctx,image,e,height,standing=false){
    if(!image)return;const aspect=image.width/image.height,w=height*aspect;ctx.save();ctx.translate(e.x*W,e.y*H);const bob=standing?0:Math.sin((performance.now()/280)+(e.x*17))*2.2;ctx.translate(0,bob);if(!standing){ctx.rotate((e.bank||0)+(e.celebrate>0?Math.sin(performance.now()/90)*.08:0))}ctx.scale(e.dir||1,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,-w/2,-height/2,w,height);ctx.restore();
    ctx.save();ctx.font='900 9px monospace';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillStyle='#fff1b6';ctx.strokeStyle='rgba(0,0,0,.9)';ctx.lineWidth=3;ctx.strokeText(e.player?.name||'REF',e.x*W,e.y*H-height/2-8);ctx.fillText(e.player?.name||'REF',e.x*W,e.y*H-height/2-8);ctx.restore();
  }

  function drawBall(ctx,x,y,flight=false){if(!state.assets.ball)return;ctx.save();ctx.translate(x*W,y*H);const size=flight?29:23;if(flight){ctx.globalAlpha=.13;ctx.drawImage(state.assets.ball,-size*1.45,-size*.5,size,size);ctx.globalAlpha=1}else{ctx.globalAlpha=.18;ctx.drawImage(state.assets.ball,-size*.62,-size*.52,size,size);ctx.globalAlpha=1}ctx.drawImage(state.assets.ball,-size/2,-size/2,size,size);ctx.restore()}

  function render(){
    const canvas=$('wcgCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx||!state.assets.arena)return;ctx.clearRect(0,0,W,H);ctx.save();const shake=state.camera.shake?((state.visualRand()-.5)*state.camera.shake*W):0;ctx.translate(W/2+shake,H/2+shake*.5);ctx.scale(state.camera.zoom,state.camera.zoom);ctx.translate(-state.camera.x*W,-state.camera.y*H);ctx.imageSmoothingEnabled=false;ctx.drawImage(state.assets.arena,0,0,W,H);
    const standing=state.phase==='intro'||state.phase==='secondcountdown'||(state.phase==='halftime'&&state.halftimeElapsed>2.15);
    if(standing){
      for(const e of state.entities)drawSprite(ctx,state.assets[e.player.id+'Standing'],e,playerSpriteHeight(e,true),true);
      const rr={...state.ref,player:{name:'REFEREE'},dir:1};drawSprite(ctx,state.assets.refStanding,rr,REF_STAND_HEIGHT,true);
      if(state.ball.visible)drawBall(ctx,state.ball.x,state.ball.y,false);
    }else{
      for(const e of state.entities)drawSprite(ctx,state.assets[e.player.id+'Riding'],e,playerSpriteHeight(e,false),false);
      const rr={...state.ref,player:{name:'REFEREE'}};drawSprite(ctx,state.assets.refFlying,rr,REF_FLY_HEIGHT,false);
      if(state.ball.visible&&state.assets.ball){const hold=state.carrier?ballHoldPoint(state.carrier):null;drawBall(ctx,hold?hold.x:state.ball.x,hold?hold.y:state.ball.y,!!state.ball.flight)}
    }
    ctx.restore();
  }

  function update(ts){
    if(!state.open)return;const rawDt=state.lastTs?Math.min(.05,(ts-state.lastTs)/1000):0;state.lastTs=ts;const dt=rawDt*state.speed;
    if(state.eventBannerTimer>0){state.eventBannerTimer-=dt;if(state.eventBannerTimer<=0)$('wcgEventBanner')?.classList.remove('is-visible')}
    if(state.celebration){state.celebration.elapsed+=dt;if(state.celebration.elapsed>=state.celebration.duration)state.celebration=null}
    if(state.crowdBoost>0)state.crowdBoost=Math.max(0,state.crowdBoost-rawDt*.16);
    if(state.phase==='intro')updateIntro(rawDt);
    else if(state.phase==='first'||state.phase==='second'){
      if(!state.special){state.matchTime+=dt;state.teamStats[state.possession].possession+=dt}
      if(state.phase==='first'&&state.matchTime>=HALF_SECONDS){state.matchTime=HALF_SECONDS;beginHalftime()}
      else if(state.phase==='second'&&state.matchTime>=MATCH_SECONDS){state.matchTime=MATCH_SECONDS;if(state.score.belros===state.score.zafran)beginShootout();else finishMatch(false)}
      if(state.phase==='first'||state.phase==='second'){updateFlight(dt);updateDelay(dt);if(state.special?.type==='var')updateVar(dt);else if(state.special?.type==='penalty')updatePenalty(dt);if(!state.special&&!state.delay&&!state.ball.flight){state.actionTimer-=dt;if(state.actionTimer<=0)nextAction()}}
    }else if(state.phase==='halftime')updateHalftimePresentation(rawDt);
    else if(state.phase==='secondcountdown')updateSecondHalfCountdown(rawDt);
    else if(state.phase==='shootout'){updateFlight(dt);updateDelay(dt);if(state.special?.type==='penalty')updatePenalty(dt)}
    else if(state.phase==='fulltime')updateFulltimePresentation(rawDt);
    updateEntities(dt);updateBroadcastDirector(rawDt);updateCamera(rawDt);updateScoreUi();render();state.raf=requestAnimationFrame(update);
  }

  async function joinMatchChannel(){
    if(state.channel)return;let database=null;try{database=typeof db!=='undefined'?db:null}catch(_){}if(!database?.channel)return;
    const ch=database.channel(MATCH_CHANNEL,{config:{broadcast:{self:false,ack:false}}});state.channel=ch;
    ch.on('broadcast',{event:'second-half'},()=>handleSecondHalf());ch.on('broadcast',{event:'speed'},({payload})=>setSpeed(Number(payload?.speed)||1,false));ch.on('broadcast',{event:'close'},()=>closeBroadcast(false));
    ch.subscribe(status=>{state.subscribed=status==='SUBSCRIBED'});
  }
  async function sendMatch(event,payload){if(!state.channel)return false;try{const r=await state.channel.send({type:'broadcast',event,payload});return r==='ok'||r===true||r?.status==='ok'}catch(_){return false}}
  async function leaveMatchChannel(){const ch=state.channel;state.channel=null;state.subscribed=false;if(!ch)return;try{const database=typeof db!=='undefined'?db:null;if(database?.removeChannel)await database.removeChannel(ch);else await ch.unsubscribe()}catch(_){}}

  function setSpeed(speed,broadcast=false){state.speed=speed===4?4:1;const b=$('wcgSpeed');if(b)b.textContent=state.speed===1?'TEST SPEED ×4':'RETURN TO ×1';if(broadcast&&isHost())sendMatch('speed',{speed:state.speed})}
  function toggleSpeed(){if(!isHost())return;setSpeed(state.speed===1?4:1,true)}

  async function openBroadcast(opts={}){
    if(state.open||state.opening)return;state.opening=true;createUi();
    try{await preload()}catch(error){state.opening=false;console.error('[WORLD CUP] Gameplay assets failed to load',error);return}
    state.open=true;state.opening=false;state.startedAt=Number(opts.startedAt)||Date.now();state.seed=hashSeed(`${state.startedAt}|Belros vs Zafran|WC2026`);state.simRand=mulberry32(state.seed);state.visualRand=mulberry32(state.seed^0x9e3779b9);state.phase='intro';state.introElapsed=clamp((Date.now()-state.startedAt)/1000,0,INTRO_SECONDS-.08);state.matchTime=0;state.speed=1;state.half=1;state.firstKickoff='belros';state.score={belros:0,zafran:0};state.shootout=null;state.special=null;state.delay=null;state.celebration=null;state.varContext=null;state.actionTimer=2.5;state.ball={x:.5,y:.5,flight:null,visible:true};state.pendingPass=null;state.possessionChangedAt=performance.now();state.loreUsed=new Set();state.introCue=-1;state.presentationKey='';state.broadcastState='PRE_MATCH';state.halftimeElapsed=0;state.halftimeReady=false;state.secondCountdown=0;state.fulltimeElapsed=0;state.fulltimeData=null;state.events=[];state.kickoffToss=null;state.kickoffReceiver=null;state.prematchAudioFailed=false;state.camera={x:.5,y:.5,zoom:1,tx:.5,ty:.5,tz:1,shake:0};state.lastTs=0;state.crowdBoost=0;state.movementPulse=.1;state.broadcast={lastSpokenAt:0,lastText:'',recent:[],recentSkeletons:[],queue:null,barryState:'NEUTRAL',barryPriority:0,barryUntil:0,barryTimer:0,talkTimer:0,phaseSeen:'',crowdLevel:.12,crowdTarget:.12,speaking:false,debugEvent:'IDLE',voiceName:'',variantCount:BARRY_COMMENTARY_VARIANTS};state.director={phase:'BUILD-UP',momentum:{belros:0,zafran:0},pressure:{belros:0,zafran:0},recent:[],pulse:0};resetStats();createEntities();primeBarryVoice();stopWorldCupMenuAudio();audio.start();audio.startPrematch(state.introElapsed);await joinMatchChannel();const root=$('wcWorldCupBroadcast');root.classList.add('is-open');root.setAttribute('aria-hidden','false');$('wcgHalftime').classList.remove('is-open');$('wcgFulltime').classList.remove('is-open');hidePresentation();$('wcgVar').classList.remove('is-open','is-decision');const admin=adminEnabled();$('wcgSpeed').hidden=!admin;$('wcgSkipHalf').hidden=!admin;$('wcgAdminEvents').hidden=!admin;$('wcgAdminPanel').hidden=true;setSpeed(1,false);setBroadcastState('PRE_MATCH');say(commentary.intro[0]);showBanner('VELMORA QUIDDITCH WORLD CUP','',2.0);updatePrematchPresentation();updateKickoffToss(0);updateScoreUi();render();state.raf=requestAnimationFrame(update);
  }

  async function closeBroadcast(broadcastClose=false){
    if(!state.open)return;if(broadcastClose&&isHost())await sendMatch('close',{host:'CatAsthma'});state.open=false;cancelAnimationFrame(state.raf);state.phase='closed';setBroadcastState('CLOSED');hidePresentation();clearBarryTimers();cancelBarryAudio();audio.stop();await leaveMatchChannel();const root=$('wcWorldCupBroadcast');root?.classList.remove('is-open');root?.setAttribute('aria-hidden','true');restoreWorldCupMenuAudio();
  }

  window.RepoSportsWorldCupGameplay={open:openBroadcast,close:closeBroadcast};
  window.addEventListener('repo-world-cup-live-start',e=>{const d=e.detail||{};openBroadcast({fixture:d.fixture,host:d.host,startedAt:d.startedAt})});
})();
