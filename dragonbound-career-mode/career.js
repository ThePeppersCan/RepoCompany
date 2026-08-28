(() => {
  'use strict';

  const SUPABASE_URL = 'https://hvdrwmjieguurxvrgzfu.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_bln84LaJ8iYmnkYK9mh0Pg_XxP7O1OZ';
  const SAVE_TABLE = 'dragonbound_career_saves';
  const SAVE_VERSION = 3;
  const CAREER_EVOLUTION_VERSION = 1;
  const BRIDGE_TOKEN = new URLSearchParams(window.location.search).get('bridge') || '';
  // V34.29.9 — Blackglass stealth navmesh/pathfinding repair.
  const STORY_INPUT_GUARD_MS = 420;
  let storyInputGuardUntil = 0;
  function claimStoryInput(ms = STORY_INPUT_GUARD_MS) {
    const stamp = performance.now();
    if (stamp < storyInputGuardUntil) return false;
    storyInputGuardUntil = stamp + Math.max(120, Number(ms) || STORY_INPUT_GUARD_MS);
    return true;
  }
  function releaseStoryInputAfter(ms = STORY_INPUT_GUARD_MS) {
    storyInputGuardUntil = Math.max(storyInputGuardUntil, performance.now() + Math.max(120, Number(ms) || STORY_INPUT_GUARD_MS));
  }
  const OPENING_FRAMES = [
    'opening/01_race_over.png',
    'opening/02_crosswind.png',
    'opening/03_scouted.png',
    'opening/04_rufus_reveal.png',
    'opening/05_instinct.png',
    'opening/06_dragonbound_invitation.png'
  ];
  const TEAMS = [
    { id: 'sunscale', sponsor: 'Sunscale', racer: 'Jalen Cross', left: '3.9%', accent: '#ef4b32', room: 'team-rooms/sunscale.png' },
    { id: 'valecroft', sponsor: 'Valecroft', racer: 'Sofia Mendes', left: '19.7%', accent: '#58c28b', room: 'team-rooms/valecroft.png' },
    { id: 'ember-oak', sponsor: 'Ember & Oak', racer: 'Luka Kovač', left: '35.1%', accent: '#f19a35', room: 'team-rooms/ember-oak.png' },
    { id: 'quickquill', sponsor: 'Quickquill', racer: 'Tyrese Bell', left: '50.1%', accent: '#e4e8ef', room: 'team-rooms/quickquill.png' },
    { id: 'wyrmwell', sponsor: 'Wyrmwell', racer: 'Ren Sato', left: '65.7%', accent: '#50d6d0', room: 'team-rooms/wyrmwell.png' },
    { id: 'fizzy-drake', sponsor: 'Fizzy Drake', racer: 'Maya Banks', left: '80.7%', accent: '#4a9cff', room: 'team-rooms/fizzy-drake.png' }
  ];
  const CAREER_DRAGONS = {
    covidpanda: { name: 'NighLight', owner: 'CovidPanda', asset: 'covidpanda.webp' },
    catasthma: { name: 'September', owner: 'CatAsthma', asset: 'catasthma.webp' },
    kat: { name: 'Opal', owner: 'Kat', asset: 'kat.webp' },
    emlux: { name: 'Turi', owner: 'Emlux', asset: 'emlux.webp' },
    proco: { name: 'Wally', owner: 'Proco', asset: 'proco.webp' },
    smokedrope1028: { name: 'Pipsqueak JR', owner: 'Smokedrope1028', asset: 'smokedrope1028.webp' }
  };
  const HUB_ITEMS = [
    { id: 'story', label: 'Follow the story', left: '4.5%', top: '33.5%', width: '25.8%', height: '11.7%' },
    { id: 'races', label: 'Extra races', left: '69.2%', top: '33.4%', width: '25.9%', height: '11.8%' },
    { id: 'teams', label: 'Meet the Teams', left: '4.5%', top: '54.5%', width: '25.8%', height: '11.8%' },
    { id: 'settings', label: 'Settings', left: '69.2%', top: '54.4%', width: '25.9%', height: '11.9%' },
    { id: 'home', label: 'Home', left: '2.4%', top: '92.1%', width: '3.9%', height: '5.3%', footer: true },
    { id: 'profile', label: 'Profile', left: '9.4%', top: '92.1%', width: '3.9%', height: '5.3%', footer: true },
    { id: 'trophies', label: 'Trophies', left: '86.5%', top: '92.1%', width: '4%', height: '5.3%', footer: true },
    { id: 'favourites', label: 'Favourites', left: '92.2%', top: '92.1%', width: '4%', height: '5.3%', footer: true }
  ];
  const CAREER_RACER_AI = {
    jalen: { id:'jalen', name:'Jalen Cross', team:'Sunscale', pace:86, consistency:82, aggression:88, defending:91, overtaking:87, stamina:82, mistakes:18, pressure:89, style:'Aggressive defender', sectorBias:{technical:-1,fast:3,climb:1,wet:0} },
    sofia: { id:'sofia', name:'Sofia Mendes', team:'Valecroft', pace:84, consistency:91, aggression:67, defending:84, overtaking:82, stamina:88, mistakes:10, pressure:90, style:'Patient technical hunter', sectorBias:{technical:4,fast:0,climb:1,wet:2} },
    luka: { id:'luka', name:'Luka Kovač', team:'Ember & Oak', pace:85, consistency:73, aggression:94, defending:79, overtaking:91, stamina:80, mistakes:25, pressure:78, style:'Relentless attacker', sectorBias:{technical:-1,fast:4,climb:2,wet:-1} },
    tyrese: { id:'tyrese', name:'Tyrese Bell', team:'Quickquill', pace:88, consistency:93, aggression:74, defending:90, overtaking:86, stamina:92, mistakes:8, pressure:94, style:'Clean senior race manager', sectorBias:{technical:3,fast:2,climb:2,wet:3} },
    ren: { id:'ren', name:'Ren Sato', team:'Wyrmwell', pace:83, consistency:95, aggression:61, defending:86, overtaking:78, stamina:89, mistakes:7, pressure:92, style:'Precise technical racer', sectorBias:{technical:5,fast:-1,climb:2,wet:2} },
    maya: { id:'maya', name:'Maya Banks', team:'Fizzy Drake', pace:82, consistency:78, aggression:82, defending:76, overtaking:85, stamina:83, mistakes:19, pressure:80, style:'Opportunistic chaos reader', sectorBias:{technical:1,fast:2,climb:0,wet:1} }
  };

  const CAREER_RACE_WINDOWS = {
    1:{ event:'Canto Plains', expected:[4,6], upside:3, downside:6, paceTarget:42, winChance:'remote', note:'Rookie pace. Finishing the race cleanly matters more than hunting the leaders.' },
    2:{ event:'Blackglass', expected:[3,5], upside:2, downside:6, paceTarget:49, winChance:'very-low', note:'The rookie has enough pace to become a podium problem.' },
    3:{ event:'Lumerre Crown', expected:[2,4], upside:1, downside:5, paceTarget:58, winChance:'outside', note:'A genuine podium weekend. Victory is possible only if the race develops perfectly.' },
    4:{ event:'Velmora City Circuit', expected:[2,5], upside:1, downside:7, paceTarget:64, winChance:'outside', note:'The first full-season start. Quickquill expects points; a win still needs a near-perfect street race.' },
    5:{ event:'Greenwater Canopy', expected:[2,5], upside:1, downside:7, paceTarget:68, winChance:'outside-real', note:'The player is beginning to carry genuine front-running pace into technical weekends.' },
    6:{ event:'Qasira Moon Orbit', expected:[1,4], upside:1, downside:6, paceTarget:72, winChance:'real', note:'A clean qualifying session can now turn into a genuine win attempt.' },
    7:{ event:'Skarholt Aurora Circuit', expected:[1,4], upside:1, downside:6, paceTarget:76, winChance:'real', note:'The grid now treats Quickquill as a race-winning threat rather than a surprise.' },
    8:{ event:'Hollowfire Citadel', expected:[1,3], upside:1, downside:6, paceTarget:79, winChance:'strong', note:'Racecraft and preparation can put the player on equal terms with the established winners.' },
    9:{ event:'Iskara Crown Arena', expected:[1,3], upside:1, downside:5, paceTarget:82, winChance:'strong', note:'Championship-level pace is believable. Bad decisions still punish it.' },
    10:{ event:'Sunfire Oasis Arena', expected:[1,3], upside:1, downside:5, paceTarget:85, winChance:'favourite', note:'Late-season wins should happen often enough to feel earned, never guaranteed.' },
    11:{ event:'Vardesh Grand Ice', expected:[1,3], upside:1, downside:5, paceTarget:88, winChance:'title-favourite', note:'Finale pace can match the very best racers on the grid. Form, pressure and decisions decide the rest.' }
  };

  const CAREER_CHAPTER_TYPES = [
    'race-weekend','open-hub','festival','technical-crisis','politics','travel','sprint','investigation','teammate-story','weather-disruption','championship'
  ];

  const CAREER_RIVAL_IDS = ['jalen','sofia','luka','tyrese','ren','maya'];

  const EMBERS = [
    [8,82,8,.2],[13,69,6,1.8],[18,91,9,3.1],[24,77,7,4.4],
    [31,88,10,2.6],[37,73,7,.9],[43,94,8,5.2],[48,80,6,3.8],
    [53,89,8,1.1],[59,76,6,4.8],[64,93,9,2.2],[71,84,7,.5],
    [77,71,6,3.5],[83,91,10,1.5],[89,78,7,5.6],[94,87,8,2.9]
  ];
  const PORTRAITS = {
    tyrese: { folder: 'story/portraits/downtime/tyrese', frames: 12 },
    mara: { folder: 'story/portraits/downtime/mara', frames: 12 },
    nell: { folder: 'story/portraits/downtime/nell', frames: 12 },
    rook: { folder: 'story/portraits/blackglass/rook', frames: 6 },
    steward: { folder: 'story/portraits/blackglass/steward', frames: 1 },
    jalen: { source: 'story/portraits/jalen.png', columns: 3, rows: 2 },
    sofia: { source: 'story/portraits/sofia.png', columns: 2, rows: 2 },
    // V34.27.1: Crown Week sheets are pre-split into clean individual frames.
    // Several generated sheets deliberately overlap cell boundaries; using the
    // full sheet as a CSS background caused neighboring torsos/heads to bleed
    // into dialogue portraits. Folder frames avoid that completely.
    crownTyrese: { folder:'story/chapter6/portrait-frames/tyrese', frames:16, fallback:'story/portraits/downtime/tyrese/frame-06.png' },
    crownJalen: { folder:'story/chapter6/portrait-frames/jalen', frames:12 },
    crownSofia: { folder:'story/chapter6/portrait-frames/sofia', frames:11 },
    crownMaya: { folder:'story/chapter6/portrait-frames/maya', frames:12 },
    crownMara: { folder:'story/chapter6/portrait-frames/mara', frames:12, fallback:'story/portraits/downtime/mara/frame-04.png' },
    crownLuka: { folder:'story/chapter6/portrait-frames/luka', frames:12 },
    crownNell: { folder:'story/chapter6/portrait-frames/nell', frames:5, fallback:'story/portraits/downtime/nell/frame-02.png' },
    crownRen: { folder:'story/chapter6/portrait-frames/ren', frames:10 }
  };
  const QUICKQUILL_SCENES = [
    {
      id: 'q0', number: 'Q0', title: 'A race nobody important was watching', location: 'Young Velmora League · Late afternoon',
      background: 'story/environments/01_Young_Velmora_League_Circuit.png', tone: 'dust',
      beats: [
        { type: 'cinematic', eyebrow: 'THREE DAYS BEFORE THE CONTRACT', title: 'A RACE NOBODY IMPORTANT WAS WATCHING', text: 'Young Velmora League · after the crowd had gone' },
        { speaker: 'Narrator', text: 'By the time the last flags stopped moving, the winner had already left with a medal and the crowd had begun thinking about supper.' },
        { speaker: 'Narrator', text: 'The officials were packing away the timing crystals. The mechanics were closing their cases. The race was over.' },
        { speaker: 'Narrator', text: 'But [PLAYER_DRAGON] went back to the starting mark and stared at the final corner—the one that had thrown them wide all afternoon.' },
        { speaker: 'Narrator', text: 'Most scouts leave when the winner crosses the line. Tyrese Bell stayed for the dragon who went back and tried the corner again.', portrait: { character: 'tyrese', frame: 0, side: 'right', shadow: true } },
        { speaker: 'Tyrese', text: 'Again.', aside: 'quietly, impressed', portrait: { character: 'tyrese', frame: 0, side: 'right' } },
        { speaker: 'Narrator', text: '[PLAYER_DRAGON] ran it once more. Slower into the turn. Tighter through the dust. This time, every claw held.' },
        { speaker: 'Tyrese', text: 'Not the fastest line I’ve seen. Just the first one today that learned something.', portrait: { character: 'tyrese', frame: 1, side: 'right' } },
        { speaker: 'Narrator', text: 'Three mornings later, an envelope arrived with a red feather pressed into the seal.' }
      ]
    },
    {
      id: 'q1', number: 'Q1', title: 'The invitation', location: 'Career headquarters · Morning',
      background: 'dragonbound-career.png', tone: 'invitation', visual: 'invitation',
      beats: [
        { type: 'cinematic', eyebrow: 'THREE MORNINGS LATER', title: 'THE INVITATION', text: 'No announcement · no cameras · one red feather' },
        { speaker: 'Narrator', text: 'The envelope carried no championship crest and no promise of glory. Only [PLAYER_DRAGON]’s name, written by hand.' },
        { speaker: 'Tyrese Bell', text: '[PLAYER_DRAGON]. Quickquill has one empty locker, one racing licence, and just enough money to make one terrible decision. Mara says inviting the youngest prospect in Velmora would be irresponsible. I said that sounded exactly like us.', portrait: { character: 'tyrese', frame: 1, side: 'right' } },
        { speaker: 'Tyrese Bell', text: 'This is not a promise that you are ready. It is an invitation to prove that readiness is sometimes the least interesting thing about a racer.', portrait: { character: 'tyrese', frame: 0, side: 'right' } },
        { speaker: 'Tyrese Bell', text: 'Come to the workshop. Bring courage. We already have goggles.', portrait: { character: 'tyrese', frame: 2, side: 'right' } },
        { speaker: 'Narrator', text: 'At the bottom of the letter, beneath Tyrese’s impossible signature, three words had been underlined twice: THREE RACE ASSESSMENT.' },
        {
          type: 'choice', id: 'invitationResponse', prompt: 'How does [PLAYER_DRAGON] answer the invitation?',
          options: [
            { label: 'I won’t waste the chance.', note: 'Measured and determined', effects: { identity: { focus: 1 } } },
            { label: 'Tell the champions I’m coming.', note: 'Fearless from the first word', effects: { identity: { fire: 1 } } },
            { label: 'Press a small feather from home into the reply.', note: 'A quiet promise', effects: { identity: { heart: 1 }, relationships: { tyreseBond: 5 } } }
          ]
        }
      ]
    },
    {
      id: 'q2', number: 'Q2', title: 'Fast enough to worry the rich', location: 'Quickquill hangar · Day',
      background: 'story/environments/02_Quickquill_Hangar_Exterior.png', tone: 'hangar',
      beats: [
        { type: 'cinematic', eyebrow: 'QUICKQUILL RACING', title: 'HANGAR 07', text: 'Fast enough to worry the rich' },
        { speaker: 'Narrator', text: 'Quickquill’s banners were immaculate. The roof was not. Beyond the hangar, richer teams occupied towers of glass and polished steel.' },
        { speaker: 'Tyrese', variants: { invitationResponse: ['You said you wouldn’t waste the chance. Mara copied that sentence into a spreadsheet.', 'You told the champions you were coming. One of them heard. We’ll discuss consequences later.', 'I got the feather. It is now officially Quickquill’s most expensive piece of stationery.'] }, portrait: { character: 'tyrese', frame: 1, side: 'right' } },
        { speaker: 'Tyrese', text: 'There they are. Velmora’s most expensive rumour.', portrait: { character: 'tyrese', frame: 1, side: 'right' } },
        { speaker: 'Mara', text: 'They cost us the same as every rookie, Tyrese.', portrait: { character: 'mara', frame: 0, side: 'left' } },
        { speaker: 'Tyrese', text: 'Exactly. Terrifying.', portrait: { character: 'tyrese', frame: 2, side: 'right' } },
        { speaker: 'Tyrese', text: 'We cleaned up for you. By which I mean Nell moved the dangerous sparks somewhere less visible.', portrait: { character: 'tyrese', frame: 7, side: 'right' } },
        { speaker: 'Tyrese', text: 'I’m Tyrese. Captain, test pilot, occasional reason we need a new roof. You do not have to impress me today. You already did that when nobody was watching.', portrait: { character: 'tyrese', frame: 1, side: 'right' } },
        { speaker: 'Mara', text: 'Mara Venn. Team principal. Quickquill will never ask you to pretend you are older than you are. We will ask whether you are prepared.', portrait: { character: 'mara', frame: 0, side: 'left' } },
        { speaker: 'Nell', text: 'And whether you chew wiring.', portrait: { character: 'nell', frame: 4, side: 'left' } },
        { speaker: 'Tyrese', text: 'Nell asks everybody that.', portrait: { character: 'tyrese', frame: 7, side: 'right' } },
        { speaker: 'Nell', text: 'No. Only the racers Tyrese recruits.', portrait: { character: 'nell', frame: 0, side: 'left' } },
        { speaker: 'Mara', text: 'Come inside. Before our captain turns your first professional meeting into a safety investigation.', portrait: { character: 'mara', frame: 1, side: 'left' } }
      ]
    },
    {
      id: 'q3', number: 'Q3', title: 'The empty locker', location: 'Quickquill changing room · Moments later',
      background: 'team-rooms/quickquill.png', tone: 'locker', visual: 'locker', showDragon: true,
      beats: [
        { type: 'cinematic', eyebrow: 'ONE EMPTY LOCKER', title: 'THREE RACES TO KEEP IT', text: 'Quickquill changing room · the beginning of something' },
        { speaker: 'Narrator', text: 'Inside, the noise of the workshop softened to the hum of air vents and the distant click of tools. One locker stood open beneath a new strip of light.' },
        { speaker: 'Tyrese', text: 'That one’s yours. Nobody’s had the nerve to claim it since the door started sticking.', portrait: { character: 'tyrese', frame: 1, side: 'right' } },
        { speaker: 'Nell', text: 'Lift, then pull.', portrait: { character: 'nell', frame: 4, side: 'left' } },
        { speaker: 'Tyrese', text: 'You’ve ruined the initiation.', portrait: { character: 'tyrese', frame: 7, side: 'right' } },
        { speaker: 'Locker note', text: 'Inside: a Quickquill uniform, a basic race band and a handwritten note — FAST ENOUGH TO WORRY THE RICH.', visual: 'note' },
        { speaker: 'Tyrese', text: 'I wrote that after my first race. Mara called it inflammatory. Our supporters had it on flags by the following morning.', portrait: { character: 'tyrese', frame: 1, side: 'right' } },
        { speaker: 'Mara', text: 'Three-race assessment. After Lumerre, we decide whether the seat remains yours for the season.', portrait: { character: 'mara', frame: 0, side: 'left' } },
        { speaker: 'Mara', text: 'We are not asking you to win immediately. We are asking you to listen, learn, protect your dragon and show us who you become when the start lights come on.', portrait: { character: 'mara', frame: 0, side: 'left' } },
        { speaker: 'Tyrese', text: 'Although winning immediately would be extremely convenient.', portrait: { character: 'tyrese', frame: 2, side: 'right' } },
        { speaker: 'Mara', text: 'Tyrese.', portrait: { character: 'mara', frame: 4, side: 'left' } },
        {
          type: 'choice', id: 'assessmentResponse', prompt: 'How does [PLAYER_DRAGON] react to the three-race assessment?',
          options: [
            { label: 'Study the schedule and ask what the team needs.', note: 'Prepared and team-minded', effects: { identity: { focus: 1 }, relationships: { quickquillTrust: 5 } } },
            { label: 'Put the uniform on immediately.', note: 'Ready before the question is finished', effects: { identity: { fire: 1 }, relationships: { tyreseBond: 5 } } },
            { label: 'Touch the note, then give Tyrese a determined nod.', note: 'Let the promise speak for itself', effects: { identity: { heart: 1 }, relationships: { tyreseBond: 5 } } }
          ]
        },
        { speaker: 'Nell', text: 'Uniform sizing is correct. Race band calibration begins tomorrow. Please do not let Tyrese improve either of them overnight.', portrait: { character: 'nell', frame: 0, side: 'left' } },
        { speaker: 'Mara', text: 'Good. Canto Plains leaves in two days.', portrait: { character: 'mara', frame: 1, side: 'left' } },
        { speaker: 'Tyrese', text: 'Two days. One locker. Three races. Try not to become famous before breakfast—it makes Mara’s paperwork unbearable.', portrait: { character: 'tyrese', frame: 2, side: 'right' } }
      ]
    }
  ];
  const QUICKQUILL_CANTO_SCENES = [
    {
      id: 'q4', number: 'Q4', title: 'Two Days to Canto', location: 'Quickquill workshop · Evening',
      background: 'story/environments/03_Quickquill_Workshop.png', tone: 'hangar', showDragon: true,
      beats: [
        { type: 'cinematic', eyebrow: 'TWO DAYS TO CANTO', title: 'THE FIRST REAL START', text: 'Quickquill workshop · telemetry lights still burning after dark' },
        { speaker: 'Narrator', text: 'The workshop had emptied hours ago. Nell kept one telemetry board lit. Mara kept the schedule pinned open. Tyrese kept pretending he was not nervous for you.' },
        { speaker: 'Nell', text: 'Canto rewards clean transitions. If you fight the first climb, the circuit spends the next lap charging interest.', portrait: { character: 'nell', frame: 0, side: 'left' } },
        { speaker: 'Mara', text: 'You are not racing the reputation of the grid. You are racing the next corner, then the next one after that.', portrait: { character: 'mara', frame: 0, side: 'left' } },
        { speaker: 'Tyrese', text: 'And if Jalen Cross arrives with that grin, do not let him rent space in your head for free.', portrait: { character: 'tyrese', frame: 2, side: 'right' } },
        {
          type: 'choice', id: 'cantoStrategy', prompt: 'What does [PLAYER_DRAGON] want to carry into Canto?',
          options: [
            { label: 'Focus — make every line deliberate.', note: 'Cleaner, steadier racing', strategy: 'focus', effects: { identity: { focus: 2 }, relationships: { quickquillTrust: 2 } } },
            { label: 'Fire — attack the start and every opening.', note: 'Sharper starts and bolder moves', strategy: 'fire', effects: { identity: { fire: 2 }, relationships: { tyreseBond: 2 } } },
            { label: 'Heart — keep coming even if the race goes wrong.', note: 'Better late-race recovery', strategy: 'heart', effects: { identity: { heart: 2 }, relationships: { tyreseBond: 1, quickquillTrust: 1 } } }
          ]
        },
        { speaker: 'Tyrese', variants: { cantoStrategy: ['Good. Make them beat you by being better, not because you got impatient.', 'There it is. Just remember a gap is only useful if the dragon still fits through it.', 'That one wins more careers than people admit. Bad laps happen. Keep racing after them.'] }, portrait: { character: 'tyrese', frame: 1, side: 'right' } },
        { speaker: 'Mara', text: 'Pack the race band. We leave at first light.', portrait: { character: 'mara', frame: 1, side: 'left' } }
      ]
    },
    {
      id: 'q5', number: 'Q5', title: 'Welcome to Canto', location: 'Canto Meadows paddock · Race morning',
      background: 'story/environments/05_Canto_Plains_Racing_Venue.png', tone: 'dust', showDragon: true,
      beats: [
        { type: 'cinematic', eyebrow: 'CANTO MEADOW CIRCUIT', title: 'WELCOME TO CANTO', text: 'Race morning · six names on the board · one of them yours' },
        { speaker: 'Narrator', text: 'Canto did not feel like the youth circuit. The crowd arrived before the mechanics. Team flags snapped above the paddock and every conversation seemed to know who belonged there.' },
        { speaker: 'Tyrese', text: 'Stay close until scrutineering. After that, look around. First professional paddock should feel a little impossible.', portrait: { character: 'tyrese', frame: 1, side: 'right' } },
        { speaker: 'Jalen', text: 'Quickquill really brought the kid.', portrait: { character: 'jalen', frame: 0, side: 'left' } },
        { speaker: 'Tyrese', text: 'Jalen Cross. Fast dragon. Faster mouth. Both occasionally useful.', portrait: { character: 'tyrese', frame: 7, side: 'right' } },
        { speaker: 'Jalen', text: 'I heard you made Tyrese stay after a junior race just by taking the same corner twice. That is either impressive or deeply weird.', portrait: { character: 'jalen', frame: 1, side: 'left' } },
        { speaker: 'Sofia', text: 'Grid call in six minutes. You can posture after inspection.', portrait: { character: 'sofia', frame: 0, side: 'left' } },
        { speaker: 'Narrator', text: 'The official board settled on six names: [PLAYER_DRAGON], Tyrese Bell, Jalen Cross, Kestrel, Sofia Mendes and Luka Kovač.' },
        { speaker: 'Tyrese', text: 'There. Now it is just a race.', portrait: { character: 'tyrese', frame: 0, side: 'right' } }
      ]
    },
    {
      id: 'q6', number: 'Q6', title: 'Prove You Belong', location: 'Canto Meadow Circuit · Starting grid',
      background: 'story/environments/05_Canto_Plains_Racing_Venue.png', tone: 'dust', showDragon: true,
      beats: [
        { type: 'cinematic', eyebrow: 'RACE ONE', title: 'PROVE YOU BELONG', text: 'Canto Meadow Circuit · three laps · autonomous live race' },
        { speaker: 'Mara', text: 'No target position. Bring the dragon home, learn something useful and make your decisions on purpose.', portrait: { character: 'mara', frame: 0, side: 'left' } },
        { speaker: 'Tyrese', text: 'When the lights go, the paddock disappears. Trust the work.', portrait: { character: 'tyrese', frame: 1, side: 'right' } },
        { speaker: 'Jalen', text: 'Try to keep up, rookie.', portrait: { character: 'jalen', frame: 2, side: 'left' } },
        { type: 'race-launch', speaker: 'Race Control', text: 'Canto Meadow Circuit is ready. Your selected strategy will influence the race slightly, but luck remains the biggest factor.' }
      ]
    },
    {
      id: 'q7', number: 'Q7', title: 'After the Flag', location: 'Canto parc fermé · Minutes later',
      background: 'story/environments/05_Canto_Plains_Racing_Venue.png', tone: 'dust', showDragon: true,
      beats: [
        { type: 'cinematic', eyebrow: 'AFTER THE FLAG', title: '[RACE_POSITION] AT CANTO', text: 'The result is official. The story keeps moving.' },
        { speaker: 'Narrator', resultVariants: { win: '[PLAYER_DRAGON] crossed the line first. For several seconds, the Quickquill pit forgot how to behave like professionals.', podium: '[PLAYER_DRAGON] came home on the podium in a first professional start. Quickquill tried very hard to act as though this happened all the time.', midfield: '[PLAYER_DRAGON] finished in the middle of the fight, close enough to see exactly where professional racing becomes unforgiving.', last: '[PLAYER_DRAGON] finished last. Nobody at Quickquill looked away. The important part was that the dragon crossed the line and immediately looked back toward the circuit.' } },
        { speaker: 'Jalen', resultVariants: { win: 'Okay. I officially withdraw the word rookie for the next ten minutes.', podium: 'That was annoyingly legitimate. Do not get used to me saying that.', midfield: 'You stayed in it. Most first-timers spend half the race racing the occasion instead of the circuit.', last: 'You finished. Good. Now you know exactly how fast this level is.' }, portrait: { character: 'jalen', frame: 1, side: 'left' } },
        { speaker: 'Tyrese', resultVariants: { win: 'Do not look at me like that. I am absolutely going to pretend I expected this.', podium: 'First professional start. Podium. Mara is already recalculating the budget around your ego.', midfield: 'Useful race. Messy in places, alive everywhere. I can work with that.', last: 'You crossed the line. You learned the speed. Tomorrow we make the gaps smaller.' }, portrait: { character: 'tyrese', frame: 2, side: 'right' } },
        { speaker: 'Narrator', text: 'Official time: [RACE_TIME]. The result went into the Career record. Ordinary Dragon Racing statistics remained untouched.' }
      ]
    },
    {
      id: 'q8', number: 'Q8', title: 'The Debrief', location: 'Quickquill workshop · That evening',
      background: 'story/environments/03_Quickquill_Workshop.png', tone: 'hangar', showDragon: true,
      beats: [
        { type: 'cinematic', eyebrow: 'QUICKQUILL DEBRIEF', title: 'WHAT THE RESULT DOES NOT SAY', text: 'Race One complete · Blackglass now waits ahead' },
        { speaker: 'Nell', text: 'Telemetry is clean enough to be useful. That is a compliment. I do not give many.', portrait: { character: 'nell', frame: 0, side: 'left' } },
        { speaker: 'Mara', resultVariants: { win: 'The win matters. What matters more is that you did not need us to manufacture it for you.', podium: 'A podium is an excellent opening statement. Do not mistake an opening statement for a finished argument.', midfield: 'The classification is ordinary. The learning curve was not. That interests me more.', last: 'Last place is data, not a verdict. You completed the race, and now we know where the work is.' }, portrait: { character: 'mara', frame: 1, side: 'left' } },
        { speaker: 'Tyrese', text: 'For the record, you are allowed to sleep before becoming a professional racer again. I checked. Mara cannot legally schedule another Canto tonight.', portrait: { character: 'tyrese', frame: 7, side: 'right' } },
        { speaker: 'Mara', text: 'Race One is complete. The seat is still yours. Tomorrow you can worry about being useful around here. Tonight, go home with the team.', portrait: { character: 'mara', frame: 0, side: 'left' } },
        { speaker: 'Narrator', text: 'Quickquill saved the Canto result, the strategy choice and the team response. For the first time since being scouted, there was nowhere else the story needed you to race.' }
      ]
    }
  ];

  const QUICKQUILL_DOWNTIME_SCENES = [
    {
      id: 'q9', number: 'Q9', title: 'Home Again', location: 'Quickquill hangar · After Canto',
      background: 'story/environments/03_Quickquill_Workshop.png', tone: 'hangar', showDragon: true,
      beats: [
        { type: 'cinematic', eyebrow: 'BACK FROM CANTO', title: 'HOME AGAIN', text: 'The timing crystals are packed away. The adrenaline is not.' },
        { speaker: 'Narrator', resultVariants: {
          win: 'Quickquill returned with a winner and absolutely no idea how to behave normally about it. Every case seemed lighter on the walk back in.',
          podium: 'A first professional podium followed [PLAYER_DRAGON] through the hangar like a rumour nobody wanted to scare away.',
          midfield: 'Canto had not handed out a fairy-tale result. It had handed out something more useful: a list of things [PLAYER_DRAGON] now understood.',
          last: '[PLAYER_DRAGON] came home last on the sheet and considerably less lost than at the start. Quickquill treated the difference as important.'
        } },
        { speaker: 'Nell', text: 'I have the telemetry. Five things were better than they looked. Two things were worse. That is an unusually productive first race.', portrait: { character: 'nell', frame: 6, side: 'left' } },
        { speaker: 'Tyrese', text: 'You made [OVERTAKES] recorded overtakes and survived the bit where Canto tries to convince everyone they have forgotten how wings work. I am calling that a useful day.', portrait: { character: 'tyrese', frame: 2, side: 'right' } },
        { speaker: 'Mara', text: 'Before everybody starts turning one result into mythology—how are you actually feeling?', portrait: { character: 'mara', frame: 0, side: 'left' } },
        {
          type: 'choice', id: 'cantoAttitude', prompt: 'What is still going through your head after Canto?',
          options: [
            { label: 'Still buzzing. I want to remember all of it.', note: 'Confident and open', value: 'confident', effects: { identity: { fire: 1 }, relationships: { tyreseBond: 1 } } },
            { label: 'I keep replaying the mistakes.', note: 'Analytical and self-critical', value: 'analytical', effects: { identity: { focus: 1 }, relationships: { nellBond: 1 } } },
            { label: 'I am just glad we brought the dragon home safely.', note: 'Grounded and team-minded', value: 'grounded', effects: { identity: { heart: 1 }, relationships: { quickquillTrust: 1 } } },
            { label: 'When can we do it again?', note: 'Hungry for the next challenge', value: 'hungry', effects: { identity: { fire: 1 }, relationships: { tyreseBond: 1 } } }
          ]
        },
        { speaker: 'Mara', variants: { cantoAttitude: [
          'Good. Keep the feeling. Do not build your whole career around needing it.',
          'Useful instinct. Keep the lesson and stop punishing yourself for acquiring it.',
          'That answer will keep you in this sport longer than a lot of trophies.',
          'Tomorrow. Not the racing part. The part where you discover teams also own laundry.'
        ] }, portrait: { character: 'mara', frame: 4, side: 'left' } }
      ]
    },
    {
      id: 'q10', number: 'Q10', title: 'The Key', location: 'Quickquill accommodation wing · Evening',
      background: 'story/environments/11_Quickquill_Accommodation_Corridor.png', tone: 'home',
      beats: [
        { type: 'cinematic', eyebrow: 'NOT A GUEST ANYMORE', title: 'THE KEY', text: 'One brass key · one empty room · a very permanent-looking nameplate' },
        { speaker: 'Mara', text: 'You are travelling with us now. Training with us. Racing under our name. You need somewhere that is not a bench in the changing room.', portrait: { character: 'mara', frame: 1, side: 'left' }, visual: 'room-key' },
        { speaker: 'Mara', text: 'Third door past the noticeboard. Try not to let [PLAYER_DRAGON] eat the skirting.', portrait: { character: 'mara', frame: 3, side: 'left' } },
        { type: 'corridor-explore' }
      ]
    },
    {
      id: 'q11', number: 'Q11', title: 'A Room of Your Own', location: 'Quickquill accommodation · Your room',
      background: 'story/environments/09_Quickquill_Player_Room.png', tone: 'home', showDragon: true,
      beats: [
        { type: 'cinematic', eyebrow: 'YOUR ROOM', title: 'A ROOM OF YOUR OWN', text: 'Bare enough to feel temporary. Empty enough to become yours.' },
        { speaker: 'Narrator', text: 'Nobody waited inside with a speech. A bed, a desk, a dragon nest and three half-unpacked crates did all the talking.' },
        { speaker: 'Narrator', text: '[PLAYER_DRAGON] began inspecting the room with the solemnity of a track walk and immediately found something more interesting than the track.', visual: 'canto-photo' },
        { type: 'room-customise' },
        { speaker: 'Narrator', text: '[PLAYER_DRAGON] made the first decision about the room without consulting anybody. Naturally, it was treated as final.' }
      ]
    },
    {
      id: 'q12', number: 'Q12', title: 'The First Evening', location: 'Quickquill headquarters · Evening',
      background: 'story/environments/14_Quickquill_Lounge_Evening.png', tone: 'evening',
      beats: [
        { type: 'cinematic', eyebrow: 'NO SCHEDULE FOR THIS PART', title: 'THE FIRST EVENING', text: 'Two free hours · four places you could spend them' },
        { speaker: 'Narrator', text: 'Quickquill quietened by degrees. Tools stopped. Doors closed. Somebody reheated something questionable in the lounge. For once, nobody told you where to be.' },
        { type: 'evening-planner' }
      ]
    },
    {
      id: 'q13', number: 'Q13', title: 'Pull Your Weight', location: 'Quickquill headquarters · Next morning',
      background: 'story/environments/10_Quickquill_Lounge_Common_Room.png', tone: 'morning',
      beats: [
        { type: 'cinematic', eyebrow: 'THE GLAMOUR OF PROFESSIONAL RACING', title: 'PULL YOUR WEIGHT', text: 'No cameras · no podium · somebody still has to sort the equipment' },
        { speaker: 'Mara', text: 'Quickquill has racers, engineers and exactly zero people whose job description says “clean up after racers and engineers.” Pick a duty.', portrait: { character: 'mara', frame: 0, side: 'left' } },
        { type: 'duty-select' },
        { type: 'duty-game' }
      ]
    },
    {
      id: 'q14', number: 'Q14', title: 'An Afternoon Without Racing', location: 'Quickquill common room · Afternoon',
      background: 'story/environments/10_Quickquill_Lounge_Common_Room.png', tone: 'home',
      beats: [
        { type: 'cinematic', eyebrow: 'NOTHING URGENT', title: 'AN AFTERNOON WITHOUT RACING', text: 'The strange luxury of having nowhere you are required to be' },
        { type: 'downtime-free-roam' }
      ]
    },
    {
      id: 'q15', number: 'Q15', title: 'Quiet Hours', location: 'Your room · Night',
      background: 'story/environments/13_Quickquill_Player_Room_Night.png', tone: 'night',
      beats: [
        { type: 'cinematic', eyebrow: 'QUIET HOURS', title: 'THE FIRST NIGHT', text: 'The headquarters settles. The room does not feel quite so empty anymore.' },
        { type: 'night-routine' }
      ]
    },
    {
      id: 'q16', number: 'Q16', title: 'Morning People', location: 'Quickquill accommodation · Morning',
      background: 'story/environments/09_Quickquill_Player_Room.png', tone: 'morning', showDragon: true,
      beats: [
        { type: 'cinematic', eyebrow: 'THE NEXT MORNING', title: 'MORNING PEOPLE', text: 'Some of Quickquill are morning people. Your dragon may have opinions.' },
        { speaker: 'Narrator', text: '[PLAYER_DRAGON] woke according to its own deeply personal definition of “morning routine.” The corridor outside was already busy.' },
        { type: 'morning-corridor' }
      ]
    },
    {
      id: 'q17', number: 'Q17', title: 'The Envelope', location: 'Quickquill accommodation · Later',
      background: 'story/environments/11_Quickquill_Accommodation_Corridor.png', tone: 'home',
      beats: [
        { type: 'cinematic', eyebrow: 'SOMETHING ON THE MAT', title: 'THE ENVELOPE', text: 'Black edging · official seal · nobody in the corridor pretending not to notice' },
        { speaker: 'Narrator', text: 'A dark envelope waited beside your door. It was heavier than paper had any right to be.', visual: 'blackglass-envelope' },
        { speaker: 'Tyrese', text: 'Blackglass. You really have not been around long, have you?', portrait: { character: 'tyrese', frame: 6, side: 'right' } },
        { speaker: 'Narrator', text: 'Inside: travel accreditation, a northern route allocation and a meeting time for tomorrow. No race today. Just the first sign of the next one.', visual: 'blackglass-envelope-open' },
        {
          type: 'choice', id: 'blackglassInitialAttitude', prompt: 'What do you think when the Blackglass name finally becomes real?',
          options: [
            { label: 'I cannot wait.', note: 'Excited', value: 'eager', effects: { identity: { fire: 1 } } },
            { label: 'Canto was hard enough.', note: 'Honest about the pressure', value: 'wary', effects: { identity: { heart: 1 } } },
            { label: 'What did Tyrese mean?', note: 'Curious about the history', value: 'curious', effects: { identity: { focus: 1 }, relationships: { tyreseBond: 1 } } },
            { label: 'One race at a time.', note: 'Measured', value: 'measured', effects: { identity: { focus: 1 } } }
          ]
        },
        { speaker: 'Narrator', text: 'The envelope stayed on the desk. [PLAYER_DRAGON] sniffed it once, decided it was not edible, and returned to the much more important business of being at home.' }
      ]
    }
  ];

  const BLACKGLASS_SECTION_DEFS = [
    { id:'blackglass-straight', name:'Blackglass Straight', note:'Start/finish under the grandstand lights. Fast, exposed and deceptively easy to overdrive.', benefit:'Cleaner launch and stronger exits.' },
    { id:'crown-descent', name:'Crown Descent', note:'The long right-hand drop away from the grandstand. Grip changes halfway down.', benefit:'Reduced mistakes while the circuit falls away.' },
    { id:'saltwake-run', name:'Saltwake Run', note:'The low sea-wall section. Spray crosses the road and the wind arrives late.', benefit:'More stable pace through sea spray.' },
    { id:'needle-gate', name:'Needle Gate', note:'A tightening left-side sequence through old gatework. Passing room disappears quickly.', benefit:'Sharper lines and safer side-by-side racing.' },
    { id:'ember-steps', name:'Ember Steps', note:'The climbing S-bends beneath the lava vents. Easy to lose rhythm chasing the next apex.', benefit:'Better recovery after a compromised corner.' },
    { id:'storm-span', name:'Storm Span', note:'The high bridge back toward the line. Crosswind, no shelter and nowhere to hide a bad exit.', benefit:'Lower error chance and a small final-sector advantage.' }
  ];

  const BLACKGLASS_EVENING_ACTIVITIES = {
    tyrese: {
      title:'Balcony with Tyrese', kicker:'VIEWING BALCONY', portrait:{character:'tyrese',frame:6,side:'right'},
      intro:'Tyrese is leaning on the rail watching empty floodlights sweep across the wet circuit.',
      line:'The night before my first win here I slept for forty minutes. The night before my worst race I slept eight hours. Very useful science.',
      responses:[
        {label:'What changed between those races?',note:'Ask for the uncomfortable answer',tag:'truth',effects:{relationships:{tyreseBond:2},identity:{focus:1}}},
        {label:'So the lesson is never sleep?',note:'Refuse to let him become profound',tag:'joke',effects:{relationships:{tyreseBond:2},identity:{heart:1}}},
        {label:'Tomorrow, tell me if I start forcing it.',note:'Give him permission to call you out',tag:'trust',effects:{relationships:{tyreseBond:3,quickquillTrust:1}}}
      ]
    },
    nell: {
      title:'Telemetry with Nell', kicker:'SETUP TABLE', portrait:{character:'nell',frame:6,side:'left'},
      intro:'Nell has qualifying traces layered over the route board and three mugs of tea she has forgotten to drink.',
      line:'Your fastest bit was not the bit where you were brave. It was the bit where you stopped arguing with the circuit.',
      responses:[
        {label:'Show me where I gave time away.',note:'Technical detail',tag:'detail',effects:{relationships:{nellBond:3},identity:{focus:1}}},
        {label:'Can we make the dragon calmer on the bridge?',note:'Prioritise confidence',tag:'dragon',effects:{relationships:{nellBond:2,dragonBond:2},identity:{heart:1}}},
        {label:'Give me one change. Not ten.',note:'Keep the setup simple',tag:'simple',effects:{relationships:{nellBond:2,quickquillTrust:1}}}
      ]
    },
    mara: {
      title:'Late debrief with Mara', kicker:'COMMON ROOM', portrait:{character:'mara',frame:6,side:'left'},
      intro:'Most of the team has gone quiet. Mara is still at the round table with the qualifying sheet turned face down.',
      line:'I do not need you to impress Blackglass tomorrow. I need you to make decisions I can trust when it gets ugly.',
      responses:[
        {label:'Then tell me where you still do not trust me.',note:'Invite the hard feedback',tag:'feedback',effects:{relationships:{maraBond:3,quickquillTrust:2},identity:{focus:1}}},
        {label:'You signed me because I make decisions.',note:'Push back without flinching',tag:'push',effects:{relationships:{maraBond:1,quickquillTrust:1},identity:{fire:2}}},
        {label:'If it gets ugly, I look after [PLAYER_DRAGON] first.',note:'Draw your line',tag:'dragon',effects:{relationships:{maraBond:2,dragonBond:2},identity:{heart:2}}}
      ]
    },
    rook: {
      title:'Local gossip with Rook', kicker:'WINDOW SEAT', portrait:{character:'rook',frame:3,side:'right'},
      intro:'Rook Calder has somehow acquired a bowl of salted nuts and the confidence of someone who does not have to race tomorrow.',
      line:'Blackglass has six official sectors and about thirty unofficial places people swear are cursed. Most of those people simply missed the apex.',
      responses:[
        {label:'Which “curse” is actually real?',note:'Ask for a local secret',tag:'secret',effects:{relationships:{rookRespect:3},identity:{focus:1}}},
        {label:'You sound disappointed you are not racing.',note:'Prod the local test racer',tag:'prod',effects:{relationships:{rookRespect:2},identity:{fire:1}}},
        {label:'Tell me the stupidest thing you have seen here.',note:'Trade nerves for a story',tag:'story',effects:{relationships:{rookRespect:2,tyreseBond:1},identity:{heart:1}}}
      ]
    }
  };

  const QUICKQUILL_BLACKGLASS_SCENES = [
    {
      id:'q18', number:'Q18', title:'The Table Is Set', location:'Quickquill common room · Morning',
      background:'story/environments/10_Quickquill_Lounge_Common_Room.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'RACE TWO · THREE DAYS OUT',title:'THE TABLE IS SET',text:'For the first time, nobody at Quickquill calls the next race “the next race.” They call it Blackglass.'},
        {speaker:'Mara',text:'Canto asked whether you could race in public. Blackglass asks what you do when the public would quite like to watch you fail.',portrait:{character:'mara',frame:6,side:'left'}},
        {speaker:'Nell',text:'Six sectors. Three exposed bridges. One surface temperature that changes faster than my patience. The good news is the route is technically legal.',portrait:{character:'nell',frame:6,side:'left'}},
        {speaker:'Tyrese',variants:{blackglassInitialAttitude:[
          'You said you could not wait. I remember. Please keep that sentence so I can return it to you halfway through Storm Span.',
          'You said Canto was hard enough. Good instinct. Blackglass rewards people who notice when something is difficult.',
          'You asked what I meant by history. This is the place. Quickquill has won here, bled here and lied about being fine here.',
          'One race at a time. Still the best thing you have said about it.'
        ]},portrait:{character:'tyrese',frame:6,side:'right'}},
        {type:'choice',id:'blackglassBriefingTone',prompt:'Mara looks at you. “Before we start — what is Blackglass to you?”',options:[
          {label:'A chance to prove Canto was not luck.',note:'Turn pressure outward',value:'prove',effects:{identity:{fire:2},relationships:{maraBond:1}}},
          {label:'A circuit I do not understand yet.',note:'Treat uncertainty as information',value:'learn',effects:{identity:{focus:2},relationships:{nellBond:2,quickquillTrust:1}}},
          {label:'Something [PLAYER_DRAGON] and I will figure out together.',note:'Keep the partnership central',value:'together',effects:{identity:{heart:2},relationships:{dragonBond:2,maraBond:1}}},
          {label:'A very dramatic place to discover whether I hate rain.',note:'Break the tension',value:'joke',effects:{identity:{heart:1},relationships:{tyreseBond:2}}}
        ]},
        {speaker:'Mara',variants:{blackglassBriefingTone:[
          'Then prove it by making good decisions, not loud ones.',
          'Excellent. Not knowing yet is a much safer starting point than pretending.',
          'That answer will annoy every commentator in the building. Keep it.',
          'You will. Blackglass has industrial quantities of it.'
        ]},portrait:{character:'mara',frame:1,side:'left'}},
        {type:'choice',id:'blackglassTeamQuestion',prompt:'The route dossier opens. What do you ask before the briefing ends?',options:[
          {label:'Why does this place matter so much to Quickquill?',note:'Ask about the team, not yourself',value:'history',effects:{relationships:{quickquillTrust:2,maraBond:2}}},
          {label:'Where do rookies usually lose the race?',note:'Look for the trap',value:'rookies',effects:{identity:{focus:1},relationships:{nellBond:1}}},
          {label:'Who are we actually worried about?',note:'Make it competitive',value:'rivals',effects:{identity:{fire:1},relationships:{tyreseBond:1}}},
          {label:'What does [PLAYER_DRAGON] need from me?',note:'Bring it back to the dragon',value:'dragon',effects:{identity:{heart:1},relationships:{dragonBond:2}}}
        ]},
        {speaker:'Narrator',text:'By the time the meeting ends, Blackglass is no longer a name on an envelope. It is weather, history, bad exits and a departure time written in Mara’s handwriting.'}
      ]
    },
    {
      id:'q19', number:'Q19', title:'The Part They Leave Out', location:'Quickquill rooftop · Before departure',
      background:'story/environments/04_Quickquill_Rooftop_Walkway.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'BAGS PACKED · TEN MINUTES TO DEPARTURE',title:'THE PART THEY LEAVE OUT',text:'Tyrese asks you to wait on the roof after everybody else goes downstairs.'},
        {speaker:'Tyrese',text:'I won at Blackglass once. Properly won. Good launch, clean bridge, stupid grin on the podium.',portrait:{character:'tyrese',frame:0,side:'right'}},
        {speaker:'Tyrese',text:'The year after, I went back trying to repeat the same race in different weather. Put a wing into the west rail because I was more interested in being the old version of me than the racer actually sitting on the grid.',portrait:{character:'tyrese',frame:6,side:'right'}},
        {speaker:'Tyrese',text:'That is the bit people leave out when they call a circuit “legendary.” Sometimes legendary just means enough good racers have made the same bad decision there.',portrait:{character:'tyrese',frame:1,side:'right'}},
        {type:'choice',id:'blackglassPressureResponse',prompt:'What do you want from Tyrese before you leave?',options:[
          {label:'Tell me what you were scared of.',note:'Ask for the truth, not the racing line',value:'truth',effects:{relationships:{tyreseBond:3},identity:{heart:1}}},
          {label:'Show me exactly where you forced it.',note:'Turn his mistake into track knowledge',value:'line',effects:{relationships:{tyreseBond:2},identity:{focus:2}}},
          {label:'If I start doing that tomorrow, stop me.',note:'Give him a job in your race',value:'callout',effects:{relationships:{tyreseBond:3,quickquillTrust:1}}},
          {label:'Nothing. I just needed to know you had a bad one too.',note:'Let the confession be enough',value:'quiet',effects:{relationships:{tyreseBond:3},identity:{heart:1}}}
        ]},
        {speaker:'Tyrese',variants:{blackglassPressureResponse:[
          'Losing control and everybody noticing. Then I learned everybody notices eventually anyway.',
          'Needle Gate. I entered half a metre too deep because I was angry at the split. Nell still has the scrape pattern somewhere.',
          'Deal. You will hate me for approximately twelve seconds. That is within team policy.',
          'Oh, I have several. Mara keeps them alphabetised.'
        ]},portrait:{character:'tyrese',frame:2,side:'right'}},
        {speaker:'Tyrese',text:'Do not go north trying to become fearless. Go north knowing what you do when fear turns up.' ,portrait:{character:'tyrese',frame:1,side:'right'}}
      ]
    },
    {
      id:'q20', number:'Q20', title:'Northbound', location:'Northern coast road · Dusk',
      background:'story/environments/20_Blackglass_Night_Circuit_Reveal.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'NORTHBOUND',title:'THE LIGHTS IN THE RAIN',text:'The road narrows, the sea gets louder, and a fortress of floodlights appears where the cliffs should end.'},
        {speaker:'Narrator',text:'For an hour the windows show nothing but black rock, spray and the reflection of [PLAYER_DRAGON] sleeping against a travel blanket.'},
        {speaker:'Nell',text:'There. Top span first. Grandstand to the right. You can see the return bridge when the lightning behaves.',portrait:{character:'nell',frame:4,side:'left'}},
        {type:'choice',id:'northRoadChoice',prompt:'As Blackglass comes into view, where does your attention go?',options:[
          {label:'Wake [PLAYER_DRAGON] so we see it together.',note:'Share the arrival',value:'dragon',effects:{relationships:{dragonBond:2},identity:{heart:1}}},
          {label:'Ask Nell to point out the dangerous sections.',note:'Start studying now',value:'study',effects:{relationships:{nellBond:1},identity:{focus:2}}},
          {label:'Watch Tyrese instead of the circuit.',note:'See what the place does to him',value:'tyrese',effects:{relationships:{tyreseBond:2},identity:{heart:1}}},
          {label:'Just look. No questions yet.',note:'Let the scale land',value:'quiet',effects:{identity:{focus:1}}}
        ]},
        {speaker:'Mara',text:'Welcome to Blackglass. Nobody has to be impressed by it. You just have to race it.',portrait:{character:'mara',frame:0,side:'left'}}
      ]
    },
    {
      id:'q21', number:'Q21', title:'Credentials', location:'Blackglass paddock · Stormlight',
      background:'story/environments/21_Blackglass_Paddock.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'BLACKGLASS · PADDOCK LEVEL',title:'CREDENTIALS',text:'The paddock smells of wet stone, lamp oil and equipment cases that cost more than Quickquill’s transport.'},
        {speaker:'Steward Garran Slate',text:'Quickquill. Four personnel, one junior licence, one dragon, three crates declared as “mostly safe.” You are two minutes early. Suspicious.',portrait:{character:'steward',frame:0,side:'left'}},
        {speaker:'Tyrese',text:'Garran. Still charming.',portrait:{character:'tyrese',frame:7,side:'right'}},
        {speaker:'Steward Garran Slate',text:'Bell. Still documented.',portrait:{character:'steward',frame:0,side:'left'}},
        {type:'blackglass-paddock-explore'},
        {type:'choice',id:'stewardResponse',prompt:'Garran checks the pass, then looks at [PLAYER_DRAGON]. “Registration says rookie. Anything I should know?”',options:[
          {label:'Their name is [PLAYER_DRAGON]. Start there.',note:'Polite, but firm',value:'name',effects:{relationships:{stewardRespect:2,dragonBond:1},identity:{heart:1}}},
          {label:'Only that we plan to leave with all four wings attached.',note:'Dry humour',value:'dry',effects:{relationships:{stewardRespect:2,tyreseBond:1}}},
          {label:'You will know after qualifying.',note:'Let the track answer',value:'prove',effects:{relationships:{stewardRespect:1},identity:{fire:2}}},
          {label:'No. What should I know about you?',note:'Turn the inspection around',value:'ask',effects:{relationships:{stewardRespect:3},identity:{focus:1}}}
        ]},
        {speaker:'Steward Garran Slate',variants:{stewardResponse:[
          'Fair correction. Names outlast licence numbers more often than people expect.',
          'Good. The paperwork for missing wings is dreadful.',
          'That answer ages very quickly here. I look forward to seeing which direction.',
          'That I dislike preventable accidents, damp forms and racers who confuse confidence with right of way. In that order.'
        ]},portrait:{character:'steward',frame:0,side:'left'}},
        {speaker:'Narrator',text:'Garran stamps the pass. The sound is tiny. Somehow it makes the weekend feel official.'}
      ]
    },
    {
      id:'q22', number:'Q22', title:'A Local Line', location:'Blackglass paddock rail · Night',
      background:'story/environments/21_Blackglass_Paddock.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'PADDOCK RAIL',title:'A LOCAL LINE',text:'A blue dragon in a weathered circuit vest has been watching Quickquill unload with open professional curiosity.'},
        {speaker:'Rook Calder',text:'You are the Canto rookie. I am Rook Calder. I test the circuit after weather shifts, which is a prestigious way of saying I get sent outside when everyone sensible is indoors.',portrait:{character:'rook',frame:0,side:'right'}},
        {speaker:'Rook Calder',text:'I am not on tomorrow’s grid. Before you ask: yes, that makes me unbearably qualified to give advice.',portrait:{character:'rook',frame:4,side:'right'}},
        {type:'choice',id:'rookFirstImpression',prompt:'How do you take Rook?',options:[
          {label:'Fine. Give me the advice nobody prints.',note:'Treat the local knowledge seriously',value:'listen',effects:{relationships:{rookRespect:3},identity:{focus:1}}},
          {label:'If it is free, I am already suspicious.',note:'Meet the sarcasm',value:'banter',effects:{relationships:{rookRespect:2,tyreseBond:1},identity:{heart:1}}},
          {label:'How fast are you when you are not explaining things?',note:'Make it competitive immediately',value:'challenge',effects:{relationships:{rookRespect:2},identity:{fire:2}}},
          {label:'Start with the bit that scares locals.',note:'Go directly to the danger',value:'danger',effects:{relationships:{rookRespect:3},identity:{focus:1}}}
        ]},
        {speaker:'Rook Calder',variants:{rookFirstImpression:[
          'Good. Printed advice has lawyers in it. Local advice has regret.',
          'Excellent. You may survive the paddock even if the circuit gets you.',
          'Fast enough that I do not have to answer that while standing still.',
          'Storm Span. Not because it is the hardest. Because it convinces you it is easier on lap two.'
        ]},portrait:{character:'rook',frame:3,side:'right'}},
        {speaker:'Jalen Cross',text:'You collect locals quickly.',portrait:{character:'jalen',frame:1,side:'left'}},
        {type:'choice',id:'jalenBlackglassResponse',prompt:'Jalen gives [PLAYER_DRAGON] a long look. How do you answer?',options:[
          {label:'I collect useful information.',note:'No performance for him',value:'watch',effects:{identity:{focus:1},relationships:{jalenRespect:2}}},
          {label:'I was hoping you would be worried.',note:'Apply pressure back',value:'pressure',effects:{identity:{fire:1},relationships:{jalenHeat:2,jalenRespect:1}}},
          {label:'Do all your entrances need an audience?',note:'Make him work for the intimidation',value:'joke',effects:{identity:{heart:1},relationships:{tyreseBond:1,jalenHeat:1}}},
          {label:'Good luck tomorrow, Jalen.',note:'Refuse the game completely',value:'respect',effects:{relationships:{jalenRespect:3},identity:{heart:1}}}
        ]},
        {speaker:'Jalen Cross',variants:{jalenBlackglassResponse:[
          'Then make sure you know which information is useful.',
          'Worried? No. Interested enough to stop pretending you are invisible.',
          'Only the good ones.',
          '...You too.'
        ]},portrait:{character:'jalen',frame:2,side:'left'}}
      ]
    },
    {
      id:'q23', number:'Q23', title:'Learn the Circuit', location:'Blackglass team common room · Route briefing',
      background:'story/environments/24_Blackglass_Common_Room.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'ROUTE BRIEFING',title:'LEARN THE CIRCUIT',text:'You cannot learn all of Blackglass tonight. Nell does not let you pretend otherwise.'},
        {speaker:'Nell',text:'You get two sections for deep study. Two. If you try to memorise six, you will remember none of them when the visor gets wet.',portrait:{character:'nell',frame:6,side:'left'}},
        {speaker:'Rook Calder',text:'Pick the places you want to recognise when everything else becomes noise.',portrait:{character:'rook',frame:1,side:'right'}},
        {type:'blackglass-circuit-study'},
        {speaker:'Nell',text:'Good. [STUDIED_SECTIONS]. Those are your anchors. Everywhere else, race what you can actually see.',portrait:{character:'nell',frame:1,side:'left'}},
        {type:'choice',id:'blackglassSetupPlan',prompt:'Nell can bias the setup one way. Which compromise do you want?',options:[
          {label:'Stable in the wet sections.',note:'Fewer mistakes · slightly less attack',value:'stable',effects:{identity:{focus:1},relationships:{nellBond:2}}},
          {label:'Sharper when we pull alongside.',note:'Better attacking response · more demanding',value:'attack',effects:{identity:{fire:2},relationships:{tyreseBond:1}}},
          {label:'Give [PLAYER_DRAGON] something forgiving.',note:'Recovery and confidence first',value:'forgiving',effects:{identity:{heart:2},relationships:{dragonBond:2,nellBond:1}}}
        ]},
        {speaker:'Nell',variants:{blackglassSetupPlan:[
          'Stable it is. Boring telemetry is beautiful telemetry.',
          'Sharper front response. If you use all of it at Needle Gate, I will personally become weather.',
          'Forgiving. You can always ask for more from a dragon that still trusts the next corner.'
        ]},portrait:{character:'nell',frame:2,side:'left'}}
      ]
    },
    {
      id:'q24', number:'Q24', title:'Night Qualifying', location:'Blackglass launch tunnel · Qualifying',
      background:'story/environments/23_Blackglass_Launch_Tunnel.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'QUALIFYING · 22:40',title:'ONE LAP TO PLACE YOURSELF',text:'The tunnel is quieter than the grandstand and somehow more intimidating.'},
        {speaker:'Steward Garran Slate',text:'One out-lap. One timed lap. Track limits are the stone, the rail and common sense, in descending order of reliability.',portrait:{character:'steward',frame:0,side:'left'}},
        {speaker:'Tyrese',text:'Qualify for the race Blackglass actually gives you. Not the lap you imagined in the common room.',portrait:{character:'tyrese',frame:1,side:'right'}},
        {type:'blackglass-qualifying'},
        {speaker:'Nell',blackglassQualifyingVariants:{
          pole:'P1. Do not stare at it. The number does not become more useful if you keep looking.',
          front:'Front two rows. Good. We have options now.',
          mid:'Middle of the grid. Busy, but workable. We know exactly where the time went.',
          back:'Back row. Fine. Tomorrow we race forward instead of pretending tonight did not happen.'
        },portrait:{character:'nell',frame:1,side:'left'}},
        {speaker:'Rook Calder',blackglassQualifyingVariants:{
          pole:'Well. That is deeply inconvenient for everyone who had a rookie speech prepared.',
          front:'That will do. You looked less surprised by Storm Span than Storm Span looked by you.',
          mid:'You left time on the circuit, which is better than leaving confidence there.',
          back:'Blackglass likes to make rookies think grid position is a personality test. It is not.'
        },portrait:{character:'rook',frame:4,side:'right'}},
        {speaker:'Narrator',text:'The qualifying sheet is stamped and slid under the common-room lamp. Tomorrow starts from [QUALIFYING_POSITION]. Tonight is still yours.'}
      ]
    },
    {
      id:'q25', number:'Q25', title:'The Long Night', location:'Blackglass team common room · After qualifying',
      background:'story/environments/24_Blackglass_Common_Room.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'23:18 · QUALIFYING COMPLETE',title:'THE LONG NIGHT',text:'The circuit is still awake. Quickquill does not have to be.'},
        {speaker:'Mara',text:'You have time for two conversations before I start confiscating people’s opinions. Use them well.',portrait:{character:'mara',frame:0,side:'left'}},
        {type:'blackglass-evening-planner'},
        {speaker:'Narrator',text:'Two conversations, a cooling circuit and the strange relief of having already made tomorrow slightly more real.'},
        {speaker:'Mara',text:'Enough. Everybody out of my common room before somebody discovers a fourth setup philosophy.',portrait:{character:'mara',frame:7,side:'left'}}
      ]
    },
    {
      id:'q26', number:'Q26', title:'After Hours', location:'Blackglass guest wing · 00:06–02:13',
      background:'story/environments/28_Blackglass_Midnight_Suite.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'BLACKGLASS · ROOM 11',title:'WHEN THE DOOR CLOSES',text:'For the first time all evening, the crowd is only something happening beyond glass.'},
        {type:'blackglass-room-night'},
        {speaker:'Narrator',text:'The pass, the room key and the qualifying sheet end up together on the desk. Eventually the lights go out. The rain does not.'},
        {type:'blackglass-after-hours'},
        {speaker:'Narrator',blackglassAfterHoursVariants:{clean:'By morning, nobody at Quickquill knows [PLAYER_DRAGON] went anywhere. [AFTER_HOURS_MEMORY]',caught:'By morning, Quickquill knows there was an incident. Garran has already filed it under “predictable.” [AFTER_HOURS_MEMORY]',secret:'By morning, the only proof of the night is a full stomach, wet paws and a view of Blackglass that belonged to nobody else. [AFTER_HOURS_MEMORY]'}}
      ]
    },
    {
      id:'q27', number:'Q27', title:'Race Morning', location:'Blackglass common room · Late morning',
      background:'story/environments/24_Blackglass_Common_Room.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'RACE DAY',title:'THE HOURS BEFORE',text:'Blackglass looks less supernatural in daylight. It does not look easier.'},
        {speaker:'Steward Garran Slate',text:'Weather update. Rain intermittent. Crosswind unpleasant. Visibility legal. A triumph. [GARRAN_AFTER_HOURS]',portrait:{character:'steward',frame:0,side:'left'}},
        {type:'blackglass-morning-prep'},
        {speaker:'Mara',text:'Whatever you chose, that is the last new idea. From here we simplify.',portrait:{character:'mara',frame:1,side:'left'}},
        {speaker:'Nell',text:'Setup locked. Studied sections: [STUDIED_SECTIONS]. [AFTER_HOURS_NOTE] Starting [QUALIFYING_POSITION]. Nothing else needs to fit inside your head.',portrait:{character:'nell',frame:6,side:'left'}}
      ]
    },
    {
      id:'q28', number:'Q28', title:'Into the Tunnel', location:'Blackglass launch tunnel · Race call',
      background:'story/environments/23_Blackglass_Launch_Tunnel.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'CALL TO GRID',title:'INTO THE TUNNEL',text:'Six racers. Six dragons. The sound of the crowd arriving through stone before the light does.'},
        {speaker:'Steward Garran Slate',blackglassStandingVariants:{
          cold:'Quickquill. Grid call. Keep your pass visible and your ambition inside the white lines.',
          neutral:'Quickquill. Grid call. [PLAYER_DRAGON] is cleared. Try to return with the same number of appendages.',
          respected:'Quickquill. Grid call. [PLAYER_DRAGON] is cleared. Good weekend so far. Do not ruin my assessment.'
        },portrait:{character:'steward',frame:0,side:'left'}},
        {speaker:'Jalen Cross',text:'Still enjoying the weather?',portrait:{character:'jalen',frame:1,side:'right'}},
        {speaker:'Tyrese',text:'Do not answer him. He gets stronger when acknowledged.',portrait:{character:'tyrese',frame:7,side:'left'}},
        {type:'choice',id:'blackglassFinalWord',prompt:'The gate mechanism starts to rise. What is the last thing you give [PLAYER_DRAGON]?',options:[
          {label:'“We know our two places. Find them.”',note:'Trust the circuit study',value:'anchors',effects:{identity:{focus:1},relationships:{dragonBond:1}}},
          {label:'“If there is a gap, we go.”',note:'Commit to attacking',value:'gap',effects:{identity:{fire:2},relationships:{tyreseBond:1}}},
          {label:'“Nothing here matters more than us coming back together.”',note:'Keep the dragon settled',value:'together',effects:{identity:{heart:2},relationships:{dragonBond:2}}},
          {label:'Scratch behind the jaw. No speech.',note:'Let familiarity do the work',value:'quiet',effects:{relationships:{dragonBond:3},identity:{heart:1}}}
        ]},
        {speaker:'Tyrese',variants:{blackglassFinalWord:[
          'Good. When it gets loud, find something you recognise.',
          'Of course that is what you picked. At least make the gap real first.',
          'That is a racing instruction, whether the timing tower understands it or not.',
          'Best speech of the weekend.'
        ]},portrait:{character:'tyrese',frame:1,side:'left'}}
      ]
    },
    {
      id:'q29', number:'Q29', title:'Under Floodlights', location:'Blackglass grid · Race night',
      background:'story/environments/25_Blackglass_Race_Track.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'RACE TWO',title:'BLACKGLASS UNDER FLOODLIGHTS',text:'Three laps. Six racers. A circuit you now know just well enough to respect.'},
        {speaker:'Mara',text:'You start [QUALIFYING_POSITION]. Forget the number when the lights go out. Race the dragon, the road and the moment in front of you.',portrait:{character:'mara',frame:1,side:'left'}},
        {speaker:'Nell',text:'Setup is locked. No heroic corrections. If one corner goes wrong, the next one is still yours.',portrait:{character:'nell',frame:6,side:'left'}},
        {speaker:'Rook Calder',text:'Storm Span lies on lap two. It always does. That is the local wisdom you paid absolutely nothing for.',portrait:{character:'rook',frame:3,side:'right'}},
        {type:'race-launch',raceKey:'blackglass',speaker:'Race Control',text:'Blackglass Night Circuit is ready. Your qualifying position, studied sections, setup choice and race-day preparation all carry into the autonomous race.'}
      ]
    },
    {
      id:'q30', number:'Q30', title:'After the Floodlights', location:'Blackglass paddock · After the flag',
      background:'story/environments/21_Blackglass_Paddock.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'AFTER THE FLAG',title:'WHEN THE NOISE MOVES ON',text:'The grandstand empties faster than the adrenaline does.'},
        {speaker:'Narrator',blackglassResultVariants:{
          win:'[PLAYER_DRAGON] crossed the line first. Blackglass did not become smaller. You simply stopped feeling like a visitor to it.',
          podium:'[PLAYER_DRAGON] came home on the podium after three laps that never gave the same problem twice.',
          midfield:'[PLAYER_DRAGON] finished in the fight. Not a headline, not a collapse — a real race with real decisions all the way to the flag.',
          last:'[PLAYER_DRAGON] finished last and finished moving forward. Blackglass tried very hard to make the position feel like a verdict. Quickquill did not let it.'
        }},
        {speaker:'Tyrese',blackglassResultVariants:{
          win:'There it is. You just made one of my favourite old stories less impressive.',
          podium:'That was grown-up racing. Horrible phrase. Unfortunately accurate.',
          midfield:'You kept making decisions after the result stopped flattering you. That is the bit I wanted to see.',
          last:'Look at me. You finished a bad Blackglass night without turning it into a bad version of yourself.'
        },portrait:{character:'tyrese',frame:1,side:'right'}},
        {speaker:'Jalen Cross',blackglassResultVariants:{
          win:'Fine. Canto was not an accident. I am officially irritated.',
          podium:'Better. Now you are interesting for reasons other than being new.',
          midfield:'You stayed in it. Most rookies disappear mentally before the final bridge.',
          last:'You finished. Annoyingly, that means I cannot use the easy speech.'
        },portrait:{character:'jalen',frame:1,side:'left'}},
        {speaker:'Steward Garran Slate',blackglassStandingVariants:{
          cold:'Your clearance is complete. Result recorded. Try not to make me remember you for the paperwork.',
          neutral:'Result recorded. [PLAYER_DRAGON] leaves Blackglass in one piece. I count that as administratively satisfying.',
          respected:'Result recorded. [PLAYER_DRAGON]. Good racecraft this weekend. I do not write that on many forms.'
        },portrait:{character:'steward',frame:0,side:'left'}},
        {speaker:'Rook Calder',blackglassResultVariants:{
          win:'So. You came north, learned two sections and stole the whole circuit. Obnoxious efficiency.',
          podium:'You looked like you knew where you were by the end. That is rarer here than speed.',
          midfield:'There were three corners I hated for you and two I would steal. That is a useful ratio.',
          last:'You did not let the circuit make your decisions for you. Keep that part. Replace the lap time.'
        },portrait:{character:'rook',frame:4,side:'right'}},
        {speaker:'Nell',text:'Race time [BLACKGLASS_TIME]. Overtakes [BLACKGLASS_OVERTAKES]. The timing file says the notable moment was [BLACKGLASS_MOMENT]. I have approximately forty-seven less poetic observations.',portrait:{character:'nell',frame:2,side:'left'}},
        {type:'choice',id:'blackglassAftermath',prompt:'When Mara finally asks what Blackglass taught you, what do you say?',options:[
          {label:'I can belong at places like this.',note:'Own the progress',value:'pride',effects:{identity:{fire:1},relationships:{quickquillTrust:2,maraBond:1}}},
          {label:'I know exactly what I want to improve.',note:'Turn the weekend into information',value:'learn',effects:{identity:{focus:2},relationships:{nellBond:2}}},
          {label:'The result mattered. It just was not the whole weekend.',note:'Keep perspective',value:'perspective',effects:{identity:{heart:2},relationships:{dragonBond:2,tyreseBond:1}}},
          {label:'Ask me after I have slept for twelve hours.',note:'Refuse the instant life lesson',value:'sleep',effects:{identity:{heart:1},relationships:{tyreseBond:2,maraBond:1}}}
        ]},
        {speaker:'Mara',text:'Good. Whatever answer you gave, keep the version that still makes sense tomorrow morning.',portrait:{character:'mara',frame:0,side:'left'}}
      ]
    },
    {
      id:'q31', number:'Q31', title:'Something to Keep', location:'North road · Morning after',
      background:'story/environments/20_Blackglass_Night_Circuit_Reveal.png', tone:'blackglass', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'MORNING AFTER',title:'SOMETHING TO KEEP',text:'Blackglass recedes behind rain and cliff mist. It looks impossible again from a distance.'},
        {speaker:'Mara',text:'Garran returned three things you are apparently allowed to keep. Pick one before Nell turns all of them into filing.',portrait:{character:'mara',frame:7,side:'left'}},
        {type:'choice',id:'blackglassKeepsake',prompt:'What goes back to your Quickquill room?',options:[
          {label:'The stamped Blackglass venue pass.',note:'Proof you were there',value:'pass',effects:{relationships:{stewardRespect:1}}},
          {label:'Your qualifying sheet.',note:'Keep the imperfect lap',value:'sheet',effects:{identity:{focus:1},relationships:{nellBond:1}}},
          {label:'The pocket circuit card.',note:'Keep the map you learned',value:'card',effects:{identity:{heart:1},relationships:{rookRespect:1}}}
        ]},
        {speaker:'Tyrese',text:'First Canto, now Blackglass. Your shelf is going to become unbearable.',portrait:{character:'tyrese',frame:2,side:'right'}},
        {speaker:'Narrator',text:'The keepsake goes into the travel bag. [PLAYER_DRAGON] falls asleep before the circuit disappears completely.'},
        {speaker:'Narrator',text:'Race two is over. The next part of the career will not be about proving you can enter the room. It will be about what happens when people start saving you a seat.'}
      ]
    }
  ];


  const SEAT_SIMULATOR_SCENARIOS = [
    {
      id:'dirty-air', title:'Dirty Air', sector:'Terrace Climb', situation:'You are tucked into another racer’s wake approaching a fast uphill section. The draft is useful; the turbulence is not.',
      options:[
        {label:'DRAFT',note:'Stay directly behind and bank the energy.',feedback:'You accept the dirty air and save enough energy to attack later.',effects:{reading:2,energy:4,aggression:-1,team:0},story:{identity:{focus:1}}},
        {label:'BREAK HIGH',note:'Climb above the wake and commit to the pass.',feedback:'The move is expensive but decisive. You clear the wake before the crest.',effects:{reading:1,energy:-3,aggression:5,team:0},story:{identity:{fire:1}}},
        {label:'DROP LOW',note:'Use the terrain to escape the turbulence.',feedback:'You trade altitude for clean air and keep the racing line alive.',effects:{reading:4,energy:1,aggression:1,team:0},story:{identity:{focus:1}}},
        {label:'WAIT',note:'Protect the line and refuse the invitation.',feedback:'Nothing dramatic happens. That is exactly the point.',effects:{reading:1,energy:3,aggression:-2,team:1},story:{identity:{heart:1}}}
      ]
    },
    {
      id:'crosswind', title:'Crosswind', sector:'Gallery Sweep', situation:'A lateral gust is shoving the dragon toward the outside rail. The fastest line is suddenly the least stable one.',
      options:[
        {label:'FIGHT IT',note:'Hold the original line through the gust.',feedback:'You keep the fast line, but the wing load spikes hard.',effects:{reading:0,energy:-4,aggression:3,team:0},story:{identity:{fire:1}}},
        {label:'SHELTER',note:'Use another racer as a temporary windbreak.',feedback:'The pace drops slightly, but the dragon settles almost immediately.',effects:{reading:3,energy:3,aggression:-1,team:1},story:{identity:{focus:1}}},
        {label:'CHANGE LINE',note:'Give up the apex and protect stability.',feedback:'The line is slower on paper and faster in reality.',effects:{reading:5,energy:1,aggression:-1,team:0},story:{identity:{focus:1}}},
        {label:'CONSERVE',note:'Back out and wait for the next sector.',feedback:'You lose ground now and buy options for later.',effects:{reading:2,energy:5,aggression:-3,team:0},story:{identity:{heart:1}}}
      ]
    },
    {
      id:'rival-attack', title:'Rival Attack', sector:'Orchard Gate', situation:'A rival closes quickly from behind. They have the overlap before the braking marker and they know it.',
      options:[
        {label:'DEFEND INSIDE',note:'Make the shortest route unavailable.',feedback:'The rival is forced to hesitate. You keep the position at a cost to exit speed.',effects:{reading:2,energy:-1,aggression:4,team:0},story:{identity:{fire:1}}},
        {label:'GIVE THE CORNER',note:'Lose the corner, win the next straight.',feedback:'You surrender one metre and recover three on exit.',effects:{reading:5,energy:1,aggression:-1,team:0},story:{identity:{focus:1}}},
        {label:'FORCE OUTSIDE',note:'Make them take the long route.',feedback:'The move is legal, assertive and very visible.',effects:{reading:2,energy:-2,aggression:5,team:0},story:{identity:{fire:1}}},
        {label:'IGNORE THEM',note:'Protect your own lap instead.',feedback:'You refuse to let somebody else dictate your race.',effects:{reading:1,energy:2,aggression:0,team:1},story:{identity:{heart:1}}}
      ]
    },
    {
      id:'stamina', title:'Stamina Warning', sector:'Sunstep Rise', situation:'The dragon is quicker than expected and burning energy just as quickly. The final sector is still a long way away.',
      options:[
        {label:'SLOW NOW',note:'Reset the pace before the warning becomes a problem.',feedback:'The field edges away. Your energy curve immediately stabilises.',effects:{reading:3,energy:6,aggression:-3,team:0},story:{identity:{focus:1}}},
        {label:'USE IT',note:'Spend the pace while it exists.',feedback:'You convert the temporary advantage into track position.',effects:{reading:0,energy:-5,aggression:5,team:0},story:{identity:{fire:1}}},
        {label:'CHANGE ALTITUDE',note:'Search for cleaner, cheaper air.',feedback:'You find a calmer layer and keep most of the speed.',effects:{reading:5,energy:3,aggression:1,team:0},story:{identity:{focus:1}}},
        {label:'FIND A DRAFT',note:'Make somebody else pay for the air.',feedback:'The solution is not heroic. Nell looks delighted.',effects:{reading:4,energy:5,aggression:0,team:1},story:{identity:{focus:1},relationships:{nellBond:1}}}
      ]
    },
    {
      id:'team-situation', title:'Team Situation', sector:'Crown Approach', situation:'Tyrese is directly ahead. A rival is attacking both Quickquill dragons and the route narrows in six seconds.',
      options:[
        {label:'HOLD POSITION',note:'Protect the two-car equivalent and deny the rival.',feedback:'Quickquill keeps both places. Nobody gets to be the hero.',effects:{reading:3,energy:1,aggression:-1,team:6},story:{identity:{heart:1},relationships:{quickquillTrust:2,tyreseBond:1}}},
        {label:'ATTACK TYRESE',note:'Take the opening before the rival does.',feedback:'You gain position, but turn a team problem into a team conversation.',effects:{reading:1,energy:-2,aggression:6,team:-4},story:{identity:{fire:2},relationships:{tyreseBond:-1}}},
        {label:'WORK TOGETHER',note:'Use Tyrese to trap the rival in dirty air.',feedback:'The two Quickquill lines become one problem the rival cannot solve.',effects:{reading:5,energy:2,aggression:1,team:7},story:{identity:{focus:1},relationships:{quickquillTrust:2,tyreseBond:2}}},
        {label:'BREAK AWAY',note:'Create space and make the rival choose.',feedback:'The pack stretches. The rival cannot cover both of you.',effects:{reading:4,energy:-2,aggression:4,team:2},story:{identity:{fire:1},relationships:{tyreseBond:1}}}
      ]
    },
    {
      id:'final-sector', title:'Final Sector', sector:'Lumerre Straight', situation:'The simulation has one sector left. Your earlier calls have created the problem in front of you now.',
      options:[
        {label:'COMMIT EARLY',note:'Spend what is left before the final bend.',feedback:'You make the finish about position rather than preservation.',effects:{reading:1,energy:-4,aggression:6,team:0},story:{identity:{fire:1}}},
        {label:'WAIT FOR EXIT',note:'Trust the final acceleration zone.',feedback:'The pass is delayed until the moment it is hardest to defend.',effects:{reading:5,energy:1,aggression:2,team:0},story:{identity:{focus:1}}},
        {label:'PROTECT RESULT',note:'Bring home the position you already earned.',feedback:'The simulated result survives intact. Mara makes a note.',effects:{reading:3,energy:4,aggression:-3,team:3},story:{identity:{heart:1},relationships:{maraBond:1}}},
        {label:'USE TYRESE',note:'Coordinate the finish instead of racing alone.',feedback:'The Quickquill pair crosses as a unit with the rival boxed behind.',effects:{reading:4,energy:0,aggression:1,team:6},story:{identity:{heart:1},relationships:{tyreseBond:1,quickquillTrust:1}}}
      ]
    }
  ];

  const SEAT_REPORTERS = [
    {id:'sporting-post',name:'THE VELMORAN SPORTING POST',angle:'FORM',question:'Was Blackglass proof that you can genuinely compete with senior racers?'},
    {id:'gridline',name:'GRIDLINE',angle:'TEAM ORDERS',question:'Did Quickquill order you not to attack Tyrese during the weekend?'},
    {id:'lumerre-daily',name:'THE LUMERRE DAILY',angle:'EXPECTATION',question:'Are you arriving in Lumerre expecting to challenge for a podium?'},
    {id:'paddock',name:'PADDOCK',angle:'MARKET',question:'Several teams are reportedly monitoring you. Any comment?'},
    {id:'flightline',name:'FLIGHTLINE WEEKLY',angle:'DRAGON',question:'How much of the recent progress belongs to your dragon rather than the people around you?'}
  ];

  const SEAT_MEDIA_TONES = [
    {id:'confident',label:'CONFIDENT',note:'Own the result.',effects:{identity:{fire:1}},scores:{confidence:3,team:0,candid:0,edge:1}},
    {id:'team',label:'TEAM-FIRST',note:'Put Quickquill first.',effects:{identity:{heart:1},relationships:{quickquillTrust:2,maraBond:1}},scores:{confidence:1,team:4,candid:0,edge:0}},
    {id:'honest',label:'HONEST',note:'Answer the actual question.',effects:{identity:{focus:1}},scores:{confidence:0,team:1,candid:4,edge:0}},
    {id:'deflect',label:'DEFLECT',note:'Give them nothing useful.',effects:{relationships:{maraBond:1}},scores:{confidence:0,team:1,candid:-1,edge:0}},
    {id:'joke',label:'JOKE',note:'Break the room without breaking the answer.',effects:{identity:{heart:1},relationships:{tyreseBond:1}},scores:{confidence:1,team:0,candid:1,edge:3}},
    {id:'challenge',label:'CHALLENGE PREMISE',note:'Push back on the framing.',effects:{identity:{fire:1}},scores:{confidence:2,team:0,candid:2,edge:4}}
  ];

  const SEAT_FREE_TIME = {
    workshop:{title:'Workshop · Nell',kicker:'TECHNICAL CALIBRATION',note:'Spend an hour turning simulator theory into a real setup preference.',result:'Nell makes you repeat one calibration until the numbers and your explanation agree.',effects:{identity:{focus:1},relationships:{nellBond:3,quickquillTrust:1}}},
    rooftop:{title:'Rooftop · Tyrese',kicker:'CAPTAIN TIME',note:'Talk without a strategy board between you.',result:'Tyrese admits the strange part is not that other teams are noticing you. It is that he expected them to eventually.',effects:{identity:{heart:1},relationships:{tyreseBond:4}}},
    mara:{title:'Mara’s office',kicker:'EXPECTATIONS',note:'Ask what Quickquill actually thinks your role is becoming.',result:'Mara gives you the uncomfortable version: potential is useful; reliability is employable.',effects:{identity:{focus:1},relationships:{maraBond:3,quickquillTrust:2}}},
    dragon:{title:'Your dragon',kicker:'NO TELEMETRY',note:'Feed, brush and sit somewhere nobody is timing anything.',result:'For one hour the career stops being a career. Your dragon seems extremely satisfied with this arrangement.',effects:{identity:{heart:2},relationships:{dragonBond:5}}}
  };

  const SEAT_HQ_EVENTS = [
    {id:'tray',title:'THE ENTIRE TRAY',text:'A junior mechanic turns too quickly and a full tray of calibrated fasteners becomes weather.',options:[
      {label:'Help sort them by size.',note:'Slow, useful, unglamorous.',effects:{relationships:{quickquillTrust:2,nellBond:1},identity:{focus:1}}},
      {label:'Make a joke and start picking them up.',note:'Keep the embarrassment small.',effects:{relationships:{quickquillTrust:1,tyreseBond:1},identity:{heart:1}}},
      {label:'Catch the rolling case before it reaches the stairs.',note:'Prioritise the expensive bit.',effects:{relationships:{quickquillTrust:1},identity:{fire:1}}}
    ]},
    {id:'courier',title:'WRONG QUICKQUILL',text:'A courier arrives with a sealed parcel addressed to “Quick Quill Racing & Stationery”. It is definitely for you. Probably.',options:[
      {label:'Send it back unopened.',note:'Professional, tragically boring.',effects:{relationships:{maraBond:2,quickquillTrust:2},identity:{focus:1}}},
      {label:'Ask Mara whether stationery is a new revenue stream.',note:'Risk a very small smile.',effects:{relationships:{maraBond:2,tyreseBond:1},identity:{heart:1}}},
      {label:'Make Tyrese sign for it.',note:'Delegation.',effects:{relationships:{tyreseBond:2},identity:{fire:1}}}
    ]},
    {id:'theft',title:'A VERY SMALL CRIME',text:'Tyrese’s dragon has acquired one of Nell’s cloth tool wraps and is pretending this is not happening.',options:[
      {label:'Trade it for a treat.',note:'Resolve the hostage situation.',effects:{relationships:{dragonBond:2,tyreseBond:2,nellBond:1},identity:{heart:1}}},
      {label:'Distract the dragon while Tyrese retrieves it.',note:'Team operation.',effects:{relationships:{tyreseBond:3,quickquillTrust:1},identity:{focus:1}}},
      {label:'Tell Nell immediately.',note:'No conspiracies on your watch.',effects:{relationships:{nellBond:2},identity:{focus:1}}}
    ]},
    {id:'document',title:'THE MISSING PAGE',text:'Mara cannot find one page of the Lumerre logistics packet. Everyone is now pretending not to panic.',options:[
      {label:'Check the strategy room printer.',note:'Follow the boring explanation first.',effects:{relationships:{maraBond:2,nellBond:1},identity:{focus:1}}},
      {label:'Search the common room with your dragon.',note:'Turn it into a hunt.',effects:{relationships:{dragonBond:2,maraBond:1},identity:{heart:1}}},
      {label:'Rebuild the page from the duplicate notes.',note:'Solve the problem, not the mystery.',effects:{relationships:{quickquillTrust:2,maraBond:1},identity:{fire:1}}}
    ]}
  ];

  const QUICKQUILL_SEAT_SCENES = [
    {
      id:'q32', number:'Q32', title:'Monday Morning', location:'Quickquill strategy room · 09:00', background:'story/chapter5/quickquill-strategy-room.webp', tone:'seat', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'POST-BLACKGLASS · TEAM REVIEW',title:'MONDAY MORNING',text:'Blackglass is already in the archive. The uncomfortable part is deciding what it means.'},
        {speaker:'Mara',blackglassResultVariants:{win:'Winning does not make the review shorter. It makes the mistakes more expensive to ignore.',podium:'A podium gets people excited. Our job is to work out which parts were repeatable.',midfield:'The result is useful because it did not hide the difficult bits.',last:'We are not going to protect you from the result. We are going to make it useful.'},portrait:{character:'mara',frame:6,side:'left'}},
        {speaker:'Nell',text:'You qualified [QUALIFYING_POSITION], finished [BLACKGLASS_POSITION], recorded [BLACKGLASS_OVERTAKES] overtakes, and gave me enough telemetry to ruin several peaceful evenings.',portrait:{character:'nell',frame:6,side:'left'}},
        {speaker:'Tyrese',blackglassAfterHoursVariants:{secret:'Also, apparently somebody discovered that Blackglass is beautiful at two in the morning. I have questions.',caught:'Also, Garran sent a message containing the phrase “unscheduled athlete”. I am framing it.',clean:'Also, nobody was arrested overnight. Strong operational result.'},portrait:{character:'tyrese',frame:7,side:'right'}},
        {type:'choice',id:'seatReviewReason',prompt:'Mara freezes one moment from the Blackglass replay. “Why did you make this call?”',options:[
          {label:'I was protecting the finish.',note:'Value the result already in your hands.',value:'protect',effects:{identity:{heart:1},relationships:{maraBond:1}}},
          {label:'I did not trust the conditions.',note:'Treat uncertainty as a reason, not an excuse.',value:'conditions',effects:{identity:{focus:2},relationships:{nellBond:1}}},
          {label:'I was waiting for the better opening.',note:'Race the sequence, not the corner.',value:'wait',effects:{identity:{focus:1,fire:1},relationships:{tyreseBond:1}}},
          {label:'I should have attacked.',note:'Own the missed opportunity.',value:'attack',effects:{identity:{fire:2},relationships:{maraBond:1}}}
        ]},
        {speaker:'Mara',variants:{seatReviewReason:['Good. Results are not cowardice. They are the thing we are employed to produce.','Then keep learning the difference between caution and information.','That answer I can use. You were thinking beyond the corner.','Good. Regret is only useful when it becomes a rule for next time.']},portrait:{character:'mara',frame:1,side:'left'}},
        {speaker:'Narrator',text:'The review runs longer than the race highlights. Nobody asks whether you belong at the table.'}
      ]
    },
    {
      id:'q33', number:'Q33', title:'You’re Staying', location:'Quickquill strategy room · 10:17', background:'story/chapter5/quickquill-strategy-room.webp', tone:'seat', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'THE REVIEW ENDS',title:'YOU’RE STAYING',text:'Tyrese stands when the meeting ends. Mara looks at you instead.'},
        {speaker:'Mara',text:'Tyrese, thank you. Nell — stay. [ACCOUNT_NAME], you are staying too.',portrait:{character:'mara',frame:6,side:'left'}},
        {speaker:'Narrator',text:'Tyrese looks back once. Not surprised. Just interested.'},
        {speaker:'Mara',text:'Quickquill is done asking you to execute somebody else’s plan. Not if we expect you to become useful to us.',portrait:{character:'mara',frame:4,side:'left'}},
        {speaker:'Nell',text:'Lumerre is faster, brighter, less forgiving of indecision and considerably more expensive to damage.',portrait:{character:'nell',frame:2,side:'left'}},
        {type:'choice',id:'seatDevelopmentPriority',prompt:'Quickquill has limited preparation time. What should the team prioritise for Lumerre?',options:[
          {label:'CONTROL',note:'Stability, predictable lines and technical confidence.',value:'control',effects:{identity:{focus:2},relationships:{nellBond:2,quickquillTrust:1}}},
          {label:'ATTACK',note:'Acceleration, passing windows and aggressive transitions.',value:'attack',effects:{identity:{fire:2},relationships:{tyreseBond:1}}},
          {label:'EFFICIENCY',note:'Stamina management and pace that survives the whole event.',value:'efficiency',effects:{identity:{heart:1,focus:1},relationships:{maraBond:1,quickquillTrust:1}}}
        ]},
        {speaker:'Nell',variants:{seatDevelopmentPriority:['Control package. I can make predictable. Predictable is underrated.','Attack package. Fine. I will hide the fragile components from you.','Efficiency. Excellent. A strategy that acknowledges races continue after the first thirty seconds.']},portrait:{character:'nell',frame:6,side:'left'}},
        {speaker:'Nell',text:'Come on. Six calls. No perfect answers. That is why this is useful.',portrait:{character:'nell',frame:6,side:'left'}}
      ]
    },
    {
      id:'q34', number:'Q34', title:'Six Calls', location:'Quickquill simulator · Late morning', background:'story/chapter5/quickquill-strategy-room.webp', tone:'seat', showDragon:false,
      beats:[{type:'seat-strategy-sim'}]
    },
    {
      id:'q35', number:'Q35', title:'The Press Are Waiting', location:'Lumerre media preview suite · Afternoon', background:'story/chapter5/lumerre-media-zone.webp', tone:'lumerre-media', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'MEDIA SESSION · FIRST CALL-UP',title:'THE PRESS ARE WAITING',text:'Blackglass made you interesting enough that Quickquill can no longer pretend the cameras are for somebody else.'},
        {speaker:'Tyrese',text:'Do not say anything stupid. Actually, do not say anything interesting either. They hate that.',portrait:{character:'tyrese',frame:7,side:'right'}},
        {speaker:'Mara',text:'Three questions. You choose who gets them. Answer the question you were asked, not the headline you are afraid of.',portrait:{character:'mara',frame:4,side:'left'}},
        {type:'seat-media-scrum'}
      ]
    },
    {
      id:'q36', number:'Q36', title:'Five Minutes', location:'Quickquill common room · Late afternoon', background:'story/environments/10_Quickquill_Lounge_Common_Room.png', tone:'seat', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'INBOX · ONE NEW MESSAGE',title:'FIVE MINUTES',text:'The press room empties. Your Career inbox does not.'},
        {speaker:'Sofia Mendes',text:'Good job at Blackglass. If you have five minutes before Lumerre, come find me. — Sofia',portrait:{character:'sofia',frame:1,side:'right'}},
        {speaker:'Narrator',text:'It is not a contract offer. That somehow makes it more complicated.'},
        {type:'choice',id:'seatSofiaTell',prompt:'Who do you tell about Sofia’s message?',options:[
          {label:'Tell Mara immediately.',note:'Make the politics somebody else’s problem too.',value:'mara',effects:{relationships:{maraBond:3,quickquillTrust:2}}},
          {label:'Tell Tyrese.',note:'Trust the person who brought you here.',value:'tyrese',effects:{relationships:{tyreseBond:4}}},
          {label:'Ask Nell.',note:'This is absolutely not Nell’s department.',value:'nell',effects:{relationships:{nellBond:3}}},
          {label:'Keep it private.',note:'No lie. No disclosure either.',value:'private',effects:{identity:{fire:1},relationships:{valecroftInterest:1}}}
        ]},
        {speaker:'Narrator',variants:{seatSofiaTell:['Mara reads it twice, hands the device back and says only: “Thank you for telling me.”','Tyrese reads the message and sighs like this confirms a theory he hoped was stupid.','Nell stares at it for a long time. “I can calculate wing load. This is worse.”','The message remains between you, Sofia and a very unimpressed notification icon.']}},
        {type:'choice',id:'seatSofiaReply',prompt:'What do you send back?',options:[
          {label:'I’m not interested.',note:'Close the door cleanly.',value:'not-interested',effects:{relationships:{quickquillTrust:2,valecroftInterest:-1}}},
          {label:'I’ll hear you out.',note:'A conversation is not a contract.',value:'hear-out',effects:{identity:{fire:1},relationships:{valecroftInterest:4}}},
          {label:'After Lumerre.',note:'Delay the decision, not the possibility.',value:'after-lumerre',effects:{identity:{focus:1},relationships:{valecroftInterest:3}}},
          {label:'Do not reply.',note:'Silence is also an answer. Sort of.',value:'none',effects:{relationships:{valecroftInterest:1}}}
        ]},
        {speaker:'Narrator',text:'The message disappears into the same Career file as everything else. Nothing happens immediately. That does not mean nothing happened.'}
      ]
    },
    {
      id:'q37', number:'Q37', title:'Three Hours', location:'Quickquill headquarters · Free time', background:'story/environments/10_Quickquill_Lounge_Common_Room.png', tone:'seat', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'FREE TIME · 3 HOURS',title:'THREE HOURS',text:'For once, Quickquill gives you time instead of instructions. You cannot fit everybody into it.'},
        {speaker:'Mara',text:'Be back in the strategy room in three hours. What you do until then is your business. Mostly.',portrait:{character:'mara',frame:1,side:'left'}},
        {type:'seat-free-time'}
      ]
    },
    {
      id:'q38', number:'Q38', title:'A Seat at the Table', location:'Quickquill strategy room · Evening', background:'story/chapter5/quickquill-strategy-room.webp', tone:'seat', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'FINAL BRIEFING',title:'A SEAT AT THE TABLE',text:'The same table. A different place around it.'},
        {speaker:'Nell',text:'Simulator assessment: [SEAT_PROFILE]. Development priority: [DEVELOPMENT_PRIORITY]. I have written both down so nobody can pretend this was my idea later.',portrait:{character:'nell',frame:6,side:'left'}},
        {speaker:'Mara',text:'At Lumerre, your role is [LUMERRE_ROLE]. That is not a rank. It is the job we believe you are ready to do.',portrait:{character:'mara',frame:6,side:'left'}},
        {speaker:'Tyrese',text:'The irritating part is she is probably right. The more irritating part is that I am looking forward to finding out.',portrait:{character:'tyrese',frame:7,side:'right'}},
        {type:'choice',id:'seatLumerrePromise',prompt:'What do you promise the room before Lumerre?',options:[
          {label:'I’ll make the smart race visible.',note:'Trust the work.',value:'smart',effects:{identity:{focus:2},relationships:{nellBond:1}}},
          {label:'I’ll give them something to chase.',note:'Arrive with intent.',value:'attack',effects:{identity:{fire:2},relationships:{tyreseBond:1}}},
          {label:'I’ll bring the result home.',note:'Make reliability the statement.',value:'result',effects:{identity:{heart:1},relationships:{maraBond:2,quickquillTrust:1}}},
          {label:'I’ll race what is actually there.',note:'No promises to a circuit you have not met.',value:'present',effects:{identity:{focus:1,heart:1},relationships:{quickquillTrust:1}}}
        ]},
        {speaker:'Mara',text:'Good. Pack for sunlight.' ,portrait:{character:'mara',frame:1,side:'left'}}
      ]
    },
    {
      id:'q39', number:'Q39', title:'The Terraces', location:'Lumerre · Arrival road', background:'story/chapter5/lumerre-arrival.webp', tone:'lumerre', showDragon:false,
      beats:[
        {type:'cinematic',eyebrow:'NEXT DESTINATION',title:'LUMERRE — THE TERRACES',text:'After Blackglass, the light feels almost impossible.'},
        {speaker:'Narrator',text:'Pale stone terraces fall away into green valleys. Grandstands climb the hillsides. Every bridge seems to have a banner and every banner seems to have an audience.'},
        {speaker:'Narrator',text:'Blackglass tested what you did when nobody expected anything. Lumerre is different.'},
        {speaker:'Mara',text:'Now they expect something.',portrait:{character:'mara',frame:6,side:'left'}},
        {speaker:'Tyrese',text:'Good. I was getting tired of proving we could survive places. I would like to start arriving somewhere we can actually race.' ,portrait:{character:'tyrese',frame:7,side:'right'}},
        {speaker:'Nell',text:'Do not let the gardens fool you. Elegant circuits still contain corners. I expect you to remember that before the first camera points at us.' ,portrait:{character:'nell',frame:6,side:'left'}},
        {speaker:'Narrator',text:'The Quickquill transport turns toward the terraces. Your Career file updates before the gates even come into view.'},
        {type:'cinematic',eyebrow:'CHAPTER COMPLETE',title:'A SEAT AT THE TABLE',text:'Blackglass proved you belonged in the room. Lumerre is where the room expects results.'}
      ]
    }
  ];

  const EVENING_ACTIVITIES = {
    tyrese: {
      title: 'Rooftop with Tyrese',
      kicker: 'ROOFTOP WALKWAY',
      background: 'story/environments/16_Quickquill_Rooftop_Evening.png',
      portrait: { character: 'tyrese', frame: 1, side: 'right' },
      intro: 'Tyrese has abandoned his captain voice for the evening. The city lights are coming on below the roofline.',
      line: 'My first proper race? I clipped a gate, landed in somebody else’s pit box and spent a week insisting the wind had been political.',
      responses: [
        { label: 'Tease him about it.', note: 'Keep it light', effects: { relationships: { tyreseBond: 2 } }, tag: 'tease' },
        { label: 'Ask if the fear ever goes away.', note: 'A more serious conversation', effects: { relationships: { tyreseBond: 2 }, identity: { heart: 1 } }, tag: 'pressure' },
        { label: 'Admit Canto scared you.', note: 'Be honest', effects: { relationships: { tyreseBond: 2 }, identity: { heart: 1 } }, tag: 'vulnerable' }
      ]
    },
    nell: {
      title: 'Late workshop with Nell',
      kicker: 'WORKSHOP · LIGHTS STILL ON',
      background: 'story/environments/03_Quickquill_Workshop.png',
      portrait: { character: 'nell', frame: 6, side: 'left' },
      intro: 'Nell is still working because apparently evening is only a lighting condition.',
      line: 'Your dragon has a repeatable pattern under load. That is good news. Repeatable problems are just engineering wearing a disguise.',
      responses: [
        { label: 'Ask her to show you the telemetry.', note: 'Technical curiosity', effects: { relationships: { nellBond: 2 }, identity: { focus: 1 } }, tag: 'telemetry' },
        { label: 'Offer to hold whatever she is balancing.', note: 'Useful without pretending expertise', effects: { relationships: { nellBond: 2, quickquillTrust: 1 } }, tag: 'help' },
        { label: 'Ask if she ever stops working.', note: 'Risk a joke', effects: { relationships: { nellBond: 1 } }, tag: 'joke' }
      ]
    },
    mara: {
      title: 'A quiet drink with Mara',
      kicker: 'COMMON ROOM',
      background: 'story/environments/14_Quickquill_Lounge_Evening.png',
      portrait: { character: 'mara', frame: 5, side: 'left' },
      intro: 'Mara has a mug, no clipboard and the slightly suspicious expression of somebody caught being off duty.',
      line: 'Quickquill survives because everybody here is allowed to be unfinished. Rich teams buy certainty. We have become very good at finding potential before it becomes expensive.',
      responses: [
        { label: 'Ask why she signed you.', note: 'Personal', effects: { relationships: { maraBond: 2 } }, tag: 'why_me' },
        { label: 'Ask what happens if you are not good enough.', note: 'Direct', effects: { relationships: { maraBond: 2 }, identity: { heart: 1 } }, tag: 'not_good_enough' },
        { label: 'Ask what Quickquill was like at the beginning.', note: 'Team history', effects: { relationships: { maraBond: 1, quickquillTrust: 1 } }, tag: 'history' }
      ]
    },
    dragon: {
      title: 'Stay in with your dragon',
      kicker: 'YOUR ROOM',
      background: 'story/environments/12_Quickquill_Player_Room_Evening.png',
      portrait: null,
      intro: 'No team politics. No telemetry. Just a new room and a dragon deciding whether it approves of your decorating.',
      line: '[PLAYER_DRAGON] eventually settles close enough that moving would feel rude.',
      responses: [
        { label: 'Sit quietly together by the window.', note: 'A calm evening', effects: { relationships: { dragonBond: 3 }, identity: { heart: 1 } }, tag: 'window' },
        { label: 'Play until somebody gets overexcited.', note: 'A noisy evening', effects: { relationships: { dragonBond: 3 }, identity: { fire: 1 } }, tag: 'play' },
        { label: 'Brush and settle the dragon for the night.', note: 'Care first', effects: { relationships: { dragonBond: 4 } }, tag: 'care' }
      ]
    }
  };

  const DUTY_GAMES = {
    equipment: {
      title: 'Nell · Equipment Inspection',
      trait: 'equipmentEye',
      relation: 'nellBond',
      options: ['READY', 'REPAIR', 'WRONG RACER'],
      questions: [
        { text: 'Left wing strap: clean buckle, but a frayed edge under tension.', answer: 'REPAIR' },
        { text: 'Harness tag says TYRESE BELL. Sizing is clearly for the new rookie dragon.', answer: 'WRONG RACER' },
        { text: 'Race band calibrated. Stabiliser clean. Buckles locked. Tag matches.', answer: 'READY' },
        { text: 'Launch-fin hinge gives a faint click when pressure is applied.', answer: 'REPAIR' },
        { text: 'Pristine harness. Unfortunately the label says JALEN CROSS.', answer: 'WRONG RACER' }
      ]
    },
    dispatch: {
      title: 'Mara · Team Dispatch',
      trait: 'teamReliable',
      relation: 'maraBond',
      options: ['RACE STAFF', 'RIDERS', 'ENGINEERS', 'EXTERNAL'],
      questions: [
        { text: 'Telemetry packet addressed to Nell Wren.', answer: 'ENGINEERS' },
        { text: 'Paddock credentials for Tyrese Bell.', answer: 'RIDERS' },
        { text: 'Circuit access permit for the scrutineering steward.', answer: 'RACE STAFF' },
        { text: 'Sealed courier envelope for a Blackglass liaison office.', answer: 'EXTERNAL' },
        { text: 'Updated start procedure for Quickquill’s race roster.', answer: 'RIDERS' }
      ]
    },
    recovery: {
      title: 'Tyrese · Dragon Recovery',
      trait: 'dragonCareInstinct',
      relation: 'tyreseBond',
      options: ['WATER', 'STRETCH', 'REST', 'TREAT', 'GROOM'],
      questions: [
        { text: 'A dragon is panting after drills and keeps glancing at an untouched bowl.', answer: 'WATER' },
        { text: 'One wing is stiff after travel, but the dragon is alert and comfortable.', answer: 'STRETCH' },
        { text: 'Eyes drooping. Curled up twice already. Absolutely no interest in showing off.', answer: 'REST' },
        { text: 'A dragon keeps nosing the empty reward pouch and staring directly at you.', answer: 'TREAT' },
        { text: 'Dried Canto mud is packed around the wing joints and harness line.', answer: 'GROOM' }
      ]
    }
  };

  const FREE_ROAM_SPOTS = {
    trophies: { title: 'Quickquill history', text: 'Most of the trophies are older than the furniture. A few have tiny repair marks where somebody clearly celebrated too hard.' },
    notice: { title: 'Route board', text: 'Canto is still pinned up. The next empty space has no circuit name yet—just a northern route line in dark ink.' },
    dragon: { title: 'Dragon rest corner', text: 'The cushions have already acquired the permanent flattened shape of professional athletes who absolutely refuse to admit they nap.' },
    breakfast: { title: 'Long table', text: 'Somebody left half a pastry under a folded newspaper. Quickquill has strict telemetry standards and apparently no pastry standards at all.' },
    mug: { title: 'Nell’s mug', text: 'Cold.' }
  };

  const CROWN_WEEK_ROOT = 'story/chapter6/';
  const CROWN_WEEK_ENV = CROWN_WEEK_ROOT + 'crown-week/';
  const CROWN_WEEK_AUDIO = CROWN_WEEK_ROOT + 'audio/';
  const CROWN_WEEK_SFX_ROOT = CROWN_WEEK_AUDIO + 'sfx/';

  const QUICKQUILL_CROWN_WEEK_SCENES = [
    {
      id:'q40', number:'Q40', title:'The City Knows Your Name', location:'Lumerre · Crown Village arrival', background:CROWN_WEEK_ENV+'crown-village.webp', tone:'crown-day', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'CHAPTER SIX · CROWN WEEK',title:'THE CITY KNOWS YOUR NAME',text:'Lumerre does not wait for race day to start watching.'},
        {speaker:'Narrator',crownFameVariants:{unknown:'The transport rolls beneath the first Crown Week arch almost unnoticed. Most cameras are pointed toward names that have been winning here for years.',curiosity:'A handful of paddock regulars recognise the Quickquill rookie before the transport has even stopped.',recognisable:'Someone near the barrier says [PLAYER_DRAGON]’s name. Then somebody else does. By the third shout, the cameras turn.',rising:'The first thing [PLAYER_DRAGON] sees through the glass is a handmade sign with their name on it. Blackglass has travelled ahead of you.'}},
        {speaker:'Tyrese',text:'Do not look alarmed. Being recognised is mostly the same as not being recognised, except people own cameras.',portrait:{character:'crownTyrese',frame:1,side:'right'}},
        {speaker:'Mara',text:'Crown Week is public from the moment we arrive. You are representing Quickquill even when nobody has put a microphone in front of you.',portrait:{character:'crownMara',frame:0,side:'left'}},
        {type:'choice',id:'crownArrivalResponse',prompt:'The transport doors open. How does [PLAYER_DRAGON] meet Lumerre?',options:[
          {label:'Stop for the fans at the barrier.',note:'Acknowledge the people who already know the name.',value:'fans',effects:{identity:{heart:1},relationships:{quickquillTrust:1}},careerEffects:{reputation:{fame:3,paddockRespect:1,media:1}}},
          {label:'Stay beside Tyrese and enter as a team.',note:'Keep the first arrival deliberately professional.',value:'team',effects:{identity:{focus:1},relationships:{tyreseBond:2,quickquillTrust:2}},careerEffects:{reputation:{paddockRespect:2,quickquillTrust:2}}},
          {label:'Give the rival-team section a wave too.',note:'Confident enough to enjoy hostile colours.',value:'rivals',effects:{identity:{fire:1},relationships:{jalenRespect:1}},careerEffects:{reputation:{fame:2,paddockRespect:2,pressure:1}}},
          {label:'Let the cameras have one clean shot, then move.',note:'Understand the job without turning arrival into a performance.',value:'media',effects:{identity:{focus:1},relationships:{maraBond:1}},careerEffects:{reputation:{media:3,fame:1}}}
        ]},
        {speaker:'Nell',text:'Lovely. You have successfully crossed a pavement. Garage logistics are through the east gate when everybody is finished documenting it.',portrait:{character:'crownNell',frame:2,side:'left'}},
        {speaker:'Narrator',text:'Beyond the gates, six team compounds ring a garden-bright paddock. Crown Week has already started.'}
      ]
    },
    {
      id:'q41', number:'Q41', title:'The Crown Village', location:'Lumerre Crown Village · Open schedule', background:CROWN_WEEK_ENV+'crown-village.webp', tone:'crown-day', showDragon:true,
      beats:[{type:'crown-village'}]
    },
    {
      id:'q42', number:'Q42', title:'The Crown Parade', location:'Lumerre · Festival Boulevard', background:CROWN_WEEK_ENV+'festival-boulevard.webp', tone:'crown-festival', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'CROWN WEEK · PUBLIC PARADE',title:'THE BOULEVARD',text:'For twenty minutes the racing grid belongs to the city.'},
        {speaker:'Narrator',crownFameVariants:{unknown:'The boulevard saves its loudest cheers for the established stars. That makes the smaller Quickquill cheer easier to hear.',curiosity:'A pocket of Quickquill supporters reacts when [PLAYER_DRAGON] appears. It is not huge. It is unmistakably yours.',recognisable:'The Quickquill section already knows the Blackglass result. A child near the front is holding a hand-painted [PLAYER_DRAGON] sign.',rising:'The announcer barely finishes [PLAYER_DRAGON]’s name before the boulevard answers it. Tyrese glances sideways, amused by how quickly this has happened.'}},
        {speaker:'Jalen',text:'If you wave any harder you are going to pull something.',portrait:{character:'crownJalen',frame:3,side:'left'}},
        {speaker:'Tyrese',text:'Ignore him. Sunscale charge extra for joy.',portrait:{character:'crownTyrese',frame:2,side:'right'}},
        {type:'choice',id:'crownParadeStyle',prompt:'How does [PLAYER_DRAGON] handle the biggest crowd of the career so far?',options:[
          {label:'Work both sides of the boulevard.',note:'Autographs, waves, photographs — embrace the moment.',value:'crowd',effects:{identity:{heart:1}},careerEffects:{reputation:{fame:5,media:2,pressure:2}}},
          {label:'Keep pointing attention back to Quickquill.',note:'Make the team part of every photograph.',value:'team',effects:{identity:{focus:1},relationships:{quickquillTrust:3,maraBond:1}},careerEffects:{reputation:{paddockRespect:2,quickquillTrust:3,fame:2}}},
          {label:'Trade gestures with rival supporters.',note:'Playfully accept that not everybody wants you to win.',value:'rival-fans',effects:{identity:{fire:1},relationships:{jalenRespect:2}},careerEffects:{reputation:{fame:3,paddockRespect:2,pressure:2}}},
          {label:'Stay measured and save the performance for the course.',note:'Let the crowd watch without becoming the whole day.',value:'measured',effects:{identity:{focus:2},relationships:{nellBond:1}},careerEffects:{reputation:{paddockRespect:2,pressure:-1}}}
        ]},
        {speaker:'Mara',variants:{crownParadeStyle:['You can enjoy it. Just remember attention becomes expectation very quickly.','Good. Sponsors notice team language. So do mechanics.','I saw that. If this becomes an incident I am billing Jalen personally.','That is fine too. You do not owe the crowd a personality they invented for you.']},portrait:{character:'crownMara',frame:1,side:'left'}},
        {speaker:'Narrator',text:'At the far end of the boulevard, officials begin moving barriers around a smaller ceremonial course. The Crown Challenge is next.'}
      ]
    },
    {
      id:'q43', number:'Q43', title:'The Crown Challenge', location:'Lumerre · Crown Challenge course', background:CROWN_WEEK_ENV+'crown-challenge-arena.webp', tone:'crown-challenge', showDragon:false,
      beats:[{type:'crown-challenge'}]
    },
    {
      id:'q44', number:'Q44', title:'The Garden Reception', location:'Lumerre Crown Gardens · Evening', background:CROWN_WEEK_ENV+'garden-reception.webp', tone:'crown-evening', showDragon:true,
      beats:[{type:'crown-reception'}]
    },
    {
      id:'q45', number:'Q45', title:'06:15 Tomorrow', location:'Quickquill Lumerre accommodation · 23:14', background:CROWN_WEEK_ENV+'quickquill-villa-interior.webp', tone:'crown-night', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'QUICKQUILL VILLA · 23:14',title:'THE NOISE FINALLY STOPS',text:'The paddock is still glowing somewhere beyond the gardens. The villa is not.'},
        {speaker:'Narrator',text:'Your accreditation lands beside a half-finished drink. Crown Week has produced more conversations in one day than Blackglass managed in an entire storm.'},
        {speaker:'Tyrese',crownOverlookVariants:{seen:'For somebody who disappeared from a sponsor reception, you found a suspiciously good view.',missed:'You survived the parade, the Challenge and sponsor small talk. That is basically an endurance event.'},portrait:{character:'crownTyrese',frame:5,side:'right'}},
        {speaker:'Narrator',text:'The inbox chimes once.'},
        {speaker:'Nell',text:'Garage. 06:15 tomorrow. Do not eat anything ridiculous at breakfast.',portrait:{character:'crownNell',frame:4,side:'left'}},
        {speaker:'Mara',text:'Practice changes the weekend. Today was attention. Tomorrow we find out what the circuit does with it.',portrait:{character:'crownMara',frame:8,side:'left'}},
        {type:'cinematic',eyebrow:'CROWN WEEK · DAY ONE COMPLETE',title:'PRACTICE DAY IS NEXT',text:'The Lumerre Crown has not started yet. Somehow, the weekend already has a history.'}
      ]
    }
  ];

  const LUMERRE_PRACTICE_ROOT = CROWN_WEEK_ROOT + 'practice/';
  const LUMERRE_PRACTICE_AUDIO = LUMERRE_PRACTICE_ROOT + 'audio/';
  const LUMERRE_PRACTICE_GARAGE = LUMERRE_PRACTICE_ROOT + 'quickquill-lumerre-garage.webp';
  const LUMERRE_TECH_MAP = LUMERRE_PRACTICE_ROOT + 'lumerre-crown-technical-map.png';
  const LUMERRE_LAUNCH_TUNNEL = LUMERRE_PRACTICE_ROOT + 'lumerre-launch-tunnel.webp';

  const LUMERRE_RACE_ROOT = CROWN_WEEK_ROOT + 'race/';
  const LUMERRE_RACE_AUDIO = LUMERRE_RACE_ROOT + 'audio/';
  const LUMERRE_RACE_UI = LUMERRE_RACE_ROOT + 'ui/';
  const LUMERRE_RACE_HUD = LUMERRE_RACE_UI + 'lumerre-crown-live-hud.png';
  const LUMERRE_RACE_TEAM_ORDERS = LUMERRE_RACE_UI + 'lumerre-crown-race-team-orders.png';
  const LUMERRE_RACE_BATTLE = LUMERRE_RACE_UI + 'lumerre-crown-race-battle-reference.png';
  const LUMERRE_RACE_TROPHY = LUMERRE_RACE_UI + 'lumerre-crown-trophy-transparent.png';
  const LUMERRE_RACE_PODIUM = LUMERRE_RACE_ROOT + 'lumerre-crown-podium-stage.png';
  const LUMERRE_RACE_MAP = LUMERRE_RACE_ROOT + 'lumerre-crown-full-map.png';

  // V34.29.8 — AFTER THE FLAG.  The Lumerre Crown no longer ends on the
  // classification card.  This finale deliberately rotates presentation:
  // radio/cooldown, open parc ferme, team board, ceremony, press, quiet room,
  // a short Tyrese beat, a tactile envelope prop and finally the chapter card.
  const LUMERRE_AFTER_FLAG_ROOT = CROWN_WEEK_ROOT + 'after-flag/';
  const LUMERRE_AFTER_FLAG_AUDIO = LUMERRE_AFTER_FLAG_ROOT + 'audio/';
  const LUMERRE_AFTER_FLAG_UI = LUMERRE_AFTER_FLAG_ROOT + 'ui/';
  const LUMERRE_PARC_FERME = LUMERRE_AFTER_FLAG_ROOT + 'lumerre-parc-ferme.webp';
  const LUMERRE_POST_RACE_MUSIC = LUMERRE_AFTER_FLAG_AUDIO + 'post-race-music.mp3';
  const LUMERRE_ENVELOPE_CLOSED = LUMERRE_AFTER_FLAG_UI + 'quickquill-envelope-closed.png';
  const LUMERRE_ENVELOPE_OPEN = LUMERRE_AFTER_FLAG_UI + 'quickquill-envelope-open.png';
  const LUMERRE_MEDIA_ZONE = 'story/chapter5/lumerre-media-zone.webp';
  const LUMERRE_VILLA_INTERIOR = CROWN_WEEK_ENV + 'quickquill-villa-interior.webp';

  const QUICKQUILL_LUMERRE_PRACTICE_SCENES = [
    {
      id:'q46', number:'Q46', title:'06:15', location:'Quickquill Lumerre garage · Practice morning', background:LUMERRE_PRACTICE_GARAGE, tone:'lumerre-technical', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'PRACTICE DAY · 06:15',title:'THE MEASURE OF A LAP',text:'Yesterday Lumerre learned your name. Today the circuit decides whether it deserves to remember it.'},
        {speaker:'Nell',text:'We have five things we could learn and enough clean track for two of them. So naturally everybody will ask for six.',portrait:{character:'nell',frame:0,side:'left'}},
        {speaker:'Tyrese',text:'First rule of Lumerre practice: the timing screen is allowed to lie to you. Your dragon is not.',portrait:{character:'tyrese',frame:6,side:'right'}},
        {type:'choice',id:'lumerrePracticePriority',prompt:'What does [PLAYER_DRAGON] want the first run to teach Quickquill?',options:[
          {label:'Technical response through the terrace changes.',note:'Prioritise precision and direction change.',value:'technical',careerEffects:{racecraft:{technicalUnderstanding:1}}},
          {label:'High-speed stability on the upper terrace.',note:'Find the limit before qualifying does.',value:'high-speed',careerEffects:{racecraft:{pressureHandling:1}}},
          {label:'Long-run rhythm and stamina.',note:'Think beyond one headline lap.',value:'long-run',careerEffects:{racecraft:{staminaManagement:1}}},
          {label:'Launch and overtaking preparation.',note:'Prepare for traffic rather than an empty circuit.',value:'overtaking',careerEffects:{racecraft:{starts:1,overtaking:1}}}
        ]},
        {speaker:'Nell',text:'Good. Baseline first. Then we change one thing at a time and pretend that was always the plan.',portrait:{character:'nell',frame:1,side:'left'}}
      ]
    },
    {
      id:'q47', number:'Q47', title:'Build a Baseline', location:'Lumerre Crown Circuit · Practice Run 1', background:LUMERRE_PRACTICE_GARAGE, tone:'lumerre-technical', showDragon:false,
      beats:[{type:'lumerre-practice-run',run:1}]
    },
    {
      id:'q48', number:'Q48', title:'Between Runs', location:'Quickquill garage · Engineering board', background:LUMERRE_PRACTICE_GARAGE, tone:'lumerre-technical', showDragon:false,
      beats:[{type:'lumerre-setup-board'}]
    },
    {
      id:'q49', number:'Q49', title:'The Upper Terrace', location:'Quickquill garage · Telemetry review', background:LUMERRE_PRACTICE_GARAGE, tone:'lumerre-technical', showDragon:false,
      beats:[{type:'lumerre-diagnosis'}]
    },
    {
      id:'q50', number:'Q50', title:'Final Practice', location:'Lumerre Crown Circuit · Practice Run 2', background:LUMERRE_PRACTICE_GARAGE, tone:'lumerre-technical', showDragon:false,
      beats:[{type:'lumerre-practice-run',run:2}]
    },
    {
      id:'q51', number:'Q51', title:'Bank One', location:'Lumerre Crown Circuit · Qualifying Run 1', background:LUMERRE_PRACTICE_GARAGE, tone:'lumerre-qualifying', showDragon:false,
      beats:[{type:'lumerre-qualifying-run',run:1}]
    },
    {
      id:'q52', number:'Q52', title:'The Window', location:'Quickquill pit wall · Qualifying strategy', background:LUMERRE_PRACTICE_GARAGE, tone:'lumerre-qualifying', showDragon:false,
      beats:[{type:'lumerre-qualifying-window'}]
    },
    {
      id:'q53', number:'Q53', title:'Push', location:'Lumerre Crown Circuit · Qualifying Run 2', background:LUMERRE_PRACTICE_GARAGE, tone:'lumerre-qualifying', showDragon:false,
      beats:[{type:'lumerre-qualifying-run',run:2}]
    },
    {
      id:'q54', number:'Q54', title:'Final Run', location:'Lumerre Crown Circuit · One lap remaining', background:LUMERRE_PRACTICE_GARAGE, tone:'lumerre-qualifying', showDragon:false,
      beats:[{type:'lumerre-qualifying-run',run:3}]
    },
    {
      id:'q55', number:'Q55', title:'After Qualifying', location:'Quickquill garage · 18:42', background:LUMERRE_PRACTICE_GARAGE, tone:'lumerre-qualifying', showDragon:true,
      beats:[
        {type:'cinematic',eyebrow:'QUALIFYING COMPLETE',title:'[LUMERRE_QUALIFYING_POSITION] ON THE GRID',text:'[LUMERRE_QUALIFYING_HEADLINE]'},
        {speaker:'Nell',text:'[LUMERRE_NELL_LINE]',portrait:{character:'nell',frame:3,side:'left'}},
        {speaker:'Tyrese',text:'[LUMERRE_TYRESE_LINE]',portrait:{character:'tyrese',frame:9,side:'right'}},
        {speaker:'Mara',text:'[LUMERRE_MARA_LINE]',portrait:{character:'mara',frame:8,side:'left'}},
        {speaker:'Narrator',text:'The final timing screen stays lit for another minute: [LUMERRE_QUALIFYING_TIME]. Tomorrow that number becomes a starting position, and the starting position becomes somebody else’s problem.'}
      ]
    },
    {
      id:'q56', number:'Q56', title:'The Night Before the Crown', location:'Lumerre Crown launch tunnel · Race-day preview', background:LUMERRE_LAUNCH_TUNNEL, tone:'lumerre-grid', showDragon:false,
      beats:[
        {type:'cinematic',eyebrow:'TOMORROW',title:'THE LUMERRE CROWN',text:'Six established racers. One rising Quickquill. And now, for the first time, a grid position that makes victory look less like a fantasy.'},
        {speaker:'Narrator',text:'The launch tunnel is empty tonight. Tomorrow every numbered bay will hold a racing dragon and the noise outside will be loud enough to shake the stone.'},
        {speaker:'Nell',text:'Race strategy is uploaded. Sleep first. Become difficult tomorrow.',portrait:{character:'nell',frame:4,side:'left'}},
        {speaker:'Mara',text:'Crown Week is over. Race weekend starts when those doors open.',portrait:{character:'mara',frame:9,side:'left'}},
        {type:'cinematic',eyebrow:'CHAPTER SIX · PRACTICE & QUALIFYING COMPLETE',title:'RACE DAY IS NEXT',text:'[PLAYER_DRAGON] starts [LUMERRE_QUALIFYING_POSITION] in the Lumerre Crown.'}
      ]
    }
  ];

  const QUICKQUILL_LUMERRE_AFTER_FLAG_SCENES = [
    {id:'q57',number:'Q57',title:'Still Moving',location:'Lumerre Crown Circuit · Cooldown lap',background:LUMERRE_RACE_MAP,tone:'after-flag-radio',showDragon:false,beats:[{type:'lumerre-after-cooldown'}]},
    {id:'q58',number:'Q58',title:'Parc Fermé',location:'Lumerre Crown · Parc fermé',background:LUMERRE_PARC_FERME,tone:'after-flag-parc',showDragon:true,beats:[{type:'lumerre-after-parc'}]},
    {id:'q59',number:'Q59',title:'What the Data Says',location:'Lumerre Crown · Quickquill bay',background:LUMERRE_PARC_FERME,tone:'after-flag-team',showDragon:true,beats:[{type:'lumerre-after-team'}]},
    {id:'q60',number:'Q60',title:'The Ceremony',location:'Lumerre Crown · Podium court',background:LUMERRE_RACE_PODIUM,tone:'after-flag-podium',showDragon:true,beats:[{type:'lumerre-after-podium'}]},
    {id:'q61',number:'Q61',title:'Two Questions',location:'Lumerre media zone · Post-race',background:LUMERRE_MEDIA_ZONE,tone:'after-flag-media',showDragon:false,beats:[{type:'lumerre-after-press'}]},
    {id:'q62',number:'Q62',title:'Five Quiet Minutes',location:'Quickquill Lumerre accommodation · Evening',background:LUMERRE_VILLA_INTERIOR,tone:'after-flag-night',showDragon:true,beats:[{type:'lumerre-after-room'}]},
    {id:'q63',number:'Q63',title:'Tyrese',location:'Quickquill Lumerre accommodation · A little later',background:LUMERRE_VILLA_INTERIOR,tone:'after-flag-night',showDragon:true,beats:[{type:'lumerre-after-tyrese'}]},
    {id:'q64',number:'Q64',title:'Monday',location:'Quickquill Lumerre accommodation · 22:18',background:LUMERRE_VILLA_INTERIOR,tone:'after-flag-envelope',showDragon:false,beats:[{type:'lumerre-after-envelope'}]},
    {id:'q65',number:'Q65',title:'The Lumerre Crown',location:'Lumerre · Night',background:CROWN_WEEK_ENV+'circuit-overlook.webp',tone:'after-flag-finale',showDragon:false,beats:[{type:'lumerre-after-finale'}]}
  ];


  // V34.30 — THE VERDICT.  This is the final heavily-authored introduction
  // chapter before the career opens into a repeatable season loop.  It avoids
  // long portrait-click chains by rotating between an arrival ticker, an open
  // HQ hub, board cards, a tactile contract builder, an inbox interruption,
  // a short walk-and-talk with Tyrese and a final career decision.
  const VERDICT_HQ_EXTERIOR = 'story/environments/02_Quickquill_Hangar_Exterior.png';
  const VERDICT_HQ_WORKSHOP = 'story/environments/03_Quickquill_Workshop.png';
  const VERDICT_HQ_ROOFTOP = 'story/environments/04_Quickquill_Rooftop_Walkway.png';
  const VERDICT_HQ_LOUNGE = 'story/environments/10_Quickquill_Lounge_Common_Room.png';
  const VERDICT_HQ_LOCKER = 'team-rooms/quickquill.png';

  const QUICKQUILL_VERDICT_SCENES = [
    {id:'q66',number:'Q66',title:'The Summons',location:'Quickquill HQ · Monday · 08:43',background:VERDICT_HQ_EXTERIOR,tone:'verdict-arrival',showDragon:true,beats:[{type:'verdict-arrival'}]},
    {id:'q67',number:'Q67',title:'The Wait',location:'Quickquill HQ · Outside the boardroom',background:VERDICT_HQ_LOUNGE,tone:'verdict-hub',showDragon:true,beats:[{type:'verdict-hq-hub'}]},
    {id:'q68',number:'Q68',title:'Why You Are Here',location:'Quickquill boardroom · Assessment review',background:VERDICT_HQ_WORKSHOP,tone:'verdict-review',showDragon:false,beats:[{type:'verdict-board-review'}]},
    {id:'q69',number:'Q69',title:'The Offer',location:'Quickquill board room · Contract table',background:VERDICT_HQ_WORKSHOP,tone:'verdict-offer',showDragon:false,beats:[{type:'verdict-offer'}]},
    {id:'q70',number:'Q70',title:'Your Turn',location:'Quickquill board room · Negotiation',background:VERDICT_HQ_WORKSHOP,tone:'verdict-contract',showDragon:false,beats:[{type:'verdict-negotiate'}]},
    {id:'q71',number:'Q71',title:'One More Message',location:'Quickquill corridor · 09:41',background:'story/environments/11_Quickquill_Accommodation_Corridor.png',tone:'verdict-inbox',showDragon:false,beats:[{type:'verdict-interest'}]},
    {id:'q72',number:'Q72',title:'Same Garage',location:'Quickquill rooftop walkway · Late morning',background:VERDICT_HQ_ROOFTOP,tone:'verdict-tyrese',showDragon:true,beats:[{type:'verdict-tyrese'}]},
    {id:'q73',number:'Q73',title:'The Verdict',location:'Quickquill changing room · One empty locker',background:VERDICT_HQ_LOCKER,tone:'verdict-decision',showDragon:true,beats:[{type:'verdict-decision'}]},
    {id:'q74',number:'Q74',title:'A Career, Not an Assessment',location:'Quickquill HQ · Monday',background:VERDICT_HQ_EXTERIOR,tone:'verdict-finale',showDragon:false,beats:[{type:'verdict-finale'}]}
  ];

  // V34.31 — THE FIRST FULL SEASON.  The opening week deliberately changes
  // interaction grammar in every scene: route exploration, constrained
  // planning, technical deduction, live command decisions, objective drafting
  // and a persistent season-control dashboard.
  const SEASON_HQ = 'story/environments/03_Quickquill_Workshop.png';
  const SEASON_CALENDAR_BG = 'story/environments/01_Young_Velmora_League_Circuit.png';
  const SEASON_ROOFTOP = 'story/environments/04_Quickquill_Rooftop_Walkway.png';
  const QUICKQUILL_SEASON_SCENES = [
    {id:'q75',number:'Q75',title:'The Calendar Opens',location:'Quickquill strategy floor · Tuesday',background:SEASON_CALENDAR_BG,tone:'season-calendar',beats:[{type:'season-calendar'}]},
    {id:'q76',number:'Q76',title:'Six Hours',location:'Quickquill preparation room · Wednesday',background:VERDICT_HQ_LOUNGE,tone:'season-plan',beats:[{type:'season-plan'}]},
    {id:'q77',number:'Q77',title:'The Missing Tenth',location:'Quickquill telemetry lab · Wednesday afternoon',background:SEASON_HQ,tone:'season-telemetry',beats:[{type:'season-telemetry'}]},
    {id:'q78',number:'Q78',title:'Pit Wall, Live',location:'Quickquill race-control simulator · Thursday',background:'story/chapter5/quickquill-strategy-room.webp',tone:'season-pitwall',beats:[{type:'season-pitwall'}]},
    {id:'q79',number:'Q79',title:'The Promises You Pick',location:'Quickquill rooftop walkway · Friday',background:SEASON_ROOFTOP,tone:'season-objectives',beats:[{type:'season-objectives'}]},
    {id:'q80',number:'Q80',title:'Season Control',location:'Quickquill HQ · Championship desk',background:SEASON_HQ,tone:'season-control',beats:[{type:'season-control'}]}
  ];

  const SEASON_SCHEDULE = [
    {id:'velmora',round:1,venue:'Velmora City Circuit',country:'VELMORA',rival:'Maya Banks',risk:'Street air · late braking',note:'The opener is narrow, public and impossible to hide in. Quickquill needs clean points before the calendar stretches.'},
    {id:'greenwater',round:2,venue:'Greenwater Canopy',country:'TALUNE',rival:'Sofia Mendes',risk:'Humidity · technical rhythm',note:'A patient circuit beneath the canopy. Sofia normally finds time while everybody else is still forcing it.'},
    {id:'qasira',round:3,venue:'Qasira Moon Orbit',country:'QASMIR',rival:'Ren Sato',risk:'Night air · precision gates',note:'Thin margins and cold light. Ren has built half his reputation on never wasting an input here.'},
    {id:'skarholt',round:4,venue:'Skarholt Aurora Circuit',country:'NORVETH',rival:'Tyrese Bell',risk:'Crosswind · long exposure',note:'Quickquill machinery should work here. That makes the teammate comparison impossible to explain away.'},
    {id:'hollowfire',round:5,venue:'Hollowfire Citadel',country:'DRAZHEN',rival:'Luka Kovač',risk:'Heat · aggression',note:'The calendar turns physical. Luka attacks the circuit as if it personally insulted him.'},
    {id:'iskara',round:6,venue:'Iskara Crown Arena',country:'ISKANDAR',rival:'Jalen Cross',risk:'Altitude · pressure',note:'The title contenders usually reveal themselves here. Sunscale will remember every word from contract day.'},
    {id:'sunfire',round:7,venue:'Sunfire Oasis Arena',country:'ZAFRAN',rival:'Maya Banks',risk:'Thermals · stamina',note:'A late-season endurance race where poor weekly preparation becomes visible all at once.'},
    {id:'grandice',round:8,venue:'Vardesh Grand Ice',country:'VARDESH',rival:'The championship',risk:'Cold · finale pressure',note:'No assessment language remains. Whatever the table says after seven rounds becomes the only story that matters.'}
  ];

  const SEASON_POINTS = [15,12,10,8,6,4,2];
  const SEASON_RACER_IDS = ['player','tyrese','jalen','sofia','luka','ren','maya'];
  const SEASON_RACER_META = {
    tyrese:{name:'Tyrese Bell',team:'Quickquill'},
    jalen:{name:'Jalen Cross',team:'Sunscale'},
    sofia:{name:'Sofia Mendes',team:'Valecroft'},
    luka:{name:'Luka Kovač',team:'Ember & Oak'},
    ren:{name:'Ren Sato',team:'Wyrmwell'},
    maya:{name:'Maya Banks',team:'Fizzy Drake'}
  };
  // These profiles are data, not replacement race engines.  Every playable
  // championship round is handed to the site's existing Dragon Racing engine.
  // Only Velmora is enabled in V34.32 because it already has a real race map;
  // later rounds can opt in as their physical circuit descriptors arrive.
  const SEASON_RACE_PROFILES = {
    velmora:{round:1,raceNumber:4,trackId:'velmora_city_circuit',playable:true,theme:'STREET COMPRESSION',weather:'Dry city air',staminaPressure:1.02,mistakePressure:1.08,attackPressure:1.12,qualifyingBias:'late-braking',liveCalls:['street-exit','decisive-window'],hook:'Narrow walls reward exits, patience and committed late moves.'},
    greenwater:{round:2,raceNumber:5,trackId:'greenwater_canopy',playable:false,theme:'HUMID RHYTHM',weather:'Heavy canopy humidity',staminaPressure:1.08,mistakePressure:.94,attackPressure:.92,qualifyingBias:'technical',liveCalls:['rhythm','canopy-gap'],hook:'Long technical sequences punish forcing the dragon before the line opens.'},
    qasira:{round:3,raceNumber:6,trackId:'qasira_moon_orbit',playable:false,theme:'PRECISION GATES',weather:'Cold night air',staminaPressure:.98,mistakePressure:1.12,attackPressure:.96,qualifyingBias:'precision',liveCalls:['gate-call','night-push'],hook:'Tiny errors compound under lights; Ren is strongest when everybody else gets impatient.'},
    skarholt:{round:4,raceNumber:7,trackId:'skarholt_aurora_circuit',playable:false,theme:'CROSSWIND EXPOSURE',weather:'Strong crosswind',staminaPressure:1.04,mistakePressure:1.06,attackPressure:1.00,qualifyingBias:'wind',liveCalls:['wind-side','team-window'],hook:'Long exposed sections turn setup confidence and teammate management into race pace.'},
    hollowfire:{round:5,raceNumber:8,trackId:'hollowfire_citadel',playable:false,theme:'HEAT BATTLE',weather:'Dry furnace heat',staminaPressure:1.14,mistakePressure:1.05,attackPressure:1.18,qualifyingBias:'launch',liveCalls:['heat-save','luka-battle'],hook:'The race becomes physical. Luka attacks early and overheats himself if the player can stay attached.'},
    iskara:{round:6,raceNumber:9,trackId:'iskara_crown_arena',playable:false,theme:'ALTITUDE PRESSURE',weather:'Thin high-altitude air',staminaPressure:1.12,mistakePressure:1.09,attackPressure:1.04,qualifyingBias:'pressure',liveCalls:['breathing-room','jalen-call'],hook:'Championship pressure is now part of the circuit; Jalen defends every point like a title decider.'},
    sunfire:{round:7,raceNumber:10,trackId:'sunfire_oasis_arena',playable:false,theme:'THERMAL ENDURANCE',weather:'Unstable desert thermals',staminaPressure:1.20,mistakePressure:1.02,attackPressure:.98,qualifyingBias:'stamina',liveCalls:['thermal-read','late-charge'],hook:'Preparation finally catches up with the field. Saving energy early creates the final-lap race.'},
    grandice:{round:8,raceNumber:11,trackId:'vardesh_grand_ice',playable:false,theme:'FINALE ICE',weather:'Freezing crosswind',staminaPressure:1.10,mistakePressure:1.16,attackPressure:1.10,qualifyingBias:'finale',liveCalls:['ice-line','championship-call'],hook:'Cold grip, title pressure and seven rounds of history decide who is brave enough to finish the move.'}
  };

  const SEASON_PLAN_ACTIVITIES = {
    bond:{title:'DRAGON BOND',cost:1,note:'Trust, calm and response under pressure.',effects:{bond:10,control:2}},
    flight:{title:'FLIGHT LAB',cost:2,note:'Lines, pace and overtaking preparation.',effects:{pace:8,control:5}},
    strength:{title:'STRENGTH',cost:2,note:'Launch power and defensive stability.',effects:{pace:4,stamina:8}},
    engineering:{title:'ENGINEERING',cost:2,note:'Telemetry language and setup confidence.',effects:{control:9,team:5}},
    recovery:{title:'RECOVERY',cost:1,note:'Protect stamina before the travel block.',effects:{stamina:10,bond:2}},
    sponsor:{title:'SPONSOR DUTY',cost:2,note:'Meet the contract without losing the whole week. Negotiated sponsor relief cuts this to one hour.',effects:{team:9}}
  };

  const SEASON_TELEMETRY_CLUES = {
    trace:{title:'PLAYER TRACE',tag:'SECTOR 3',text:'The lost tenth begins 0.18 seconds after the crosswind spike—not when the dragon changes line.'},
    tyrese:{title:'TYRESE COMPARISON',tag:'SAME EQUIPMENT',text:'Tyrese receives the same wind reading but his control trace updates immediately. The mechanical response is clean.'},
    wind:{title:'WIND LOG',tag:'12.4 KNOTS',text:'Three separate gusts produce an identical delayed correction. Random rider hesitation would not repeat this neatly.'},
    calibration:{title:'CALIBRATION LOG',tag:'SENSOR 04',text:'The lateral sensor passed static calibration, but its live timestamp drifts by 0.18 seconds under vibration.'}
  };

  const SEASON_TELEMETRY_ANSWERS = [
    {id:'line',title:'RIDER LINE ERROR',note:'The player reacts late to the gust.',correct:false},
    {id:'stabiliser',title:'FRONT STABILISER',note:'The hardware is overcorrecting.',correct:false},
    {id:'sensor',title:'SENSOR TIMESTAMP DRIFT',note:'The data arrives late; the dragon does not.',correct:true}
  ];

  const SEASON_PITWALL_SCENARIOS = [
    {id:'traffic',title:'OPENING-LAP TRAFFIC',radio:'Three racers compress into Gate Four. September has pace but no clean outside exit.',gauges:{pace:72,stamina:94,dragon:88,team:82},options:[{id:'attack',label:'FORCE THE OUTSIDE',score:0,note:'Fast idea, closed piece of track.'},{id:'hold',label:'HOLD · BUILD THE EXIT',score:2,note:'Keeps the wing clean and creates the next move.'},{id:'save',label:'CONSERVE IMMEDIATELY',score:1,note:'Safe, but gives away useful track position.'}]},
    {id:'crosswind',title:'CROSSWIND ARRIVES',radio:'The wind turns across the next two gates. The telemetry fix is holding.',gauges:{pace:69,stamina:86,dragon:79,team:84},options:[{id:'switch',label:'SWITCH TO SHELTERED LINE',score:2,note:'Uses the circuit instead of fighting the air.'},{id:'stay',label:'STAY ON THE REFERENCE',score:0,note:'The reference was built before the wind changed.'},{id:'push',label:'PUSH THROUGH IT',score:1,note:'Commits, but spends the dragon unnecessarily.'}]},
    {id:'heat',title:'HEAT SPIKE',radio:'Core temperature rises two bands. Jalen is closing, but the warning is real.',gauges:{pace:76,stamina:64,dragon:61,team:80},options:[{id:'cool',label:'COOL FOR ONE SECTOR',score:2,note:'Loses a fraction now and protects the full race.'},{id:'attack',label:'ATTACK BEFORE IT WORSENS',score:0,note:'Turns a warning into a likely failure.'},{id:'draft',label:'SIT IN JALEN’S DRAFT',score:1,note:'Helps the air, but hands him control of the fight.'}]},
    {id:'opening',title:'RIVAL EXPOSED',radio:'Sofia misses the first precision gate. There is one clean attacking window.',gauges:{pace:81,stamina:57,dragon:68,team:78},options:[{id:'commit',label:'COMMIT NOW',score:2,note:'The window is real and the remaining stamina is enough.'},{id:'wait',label:'WAIT FOR A SAFER MOVE',score:0,note:'There may not be another mistake.'},{id:'pressure',label:'SHOW THE NOSE',score:1,note:'Applies pressure without completing the pass.'}]},
    {id:'team',title:'QUICKQUILL CALL',radio:'Tyrese is ahead on older stamina. You are faster; Jalen is approaching both of you.',gauges:{pace:84,stamina:49,dragon:65,team:60},options:[{id:'swap',label:'REQUEST THE SWAP',score:2,note:'Fastest Quickquill goes forward, with a promise to review later.'},{id:'race',label:'RACE TYRESE NOW',score:0,note:'Creates the exact opening Jalen needs.'},{id:'hold',label:'HOLD FORMATION',score:1,note:'Protects the team, but leaves performance unused.'}]}
  ];

  const SEASON_OBJECTIVES = [
    {id:'team-points',scope:'team',type:'TEAM',title:'DOUBLE POINTS HABIT',note:'Both Quickquill racers score in four rounds.',reward:'Trust + development priority',pressure:'Tyrese results matter too.'},
    {id:'beat-sunscale',scope:'team',type:'TEAM',title:'BEAT SUNSCALE TWICE',note:'Finish ahead of both Sunscale racers in two rounds.',reward:'Paddock authority',pressure:'Jalen intensity rises.'},
    {id:'podiums',scope:'personal',type:'RESULTS',title:'THREE PODIUMS',note:'Turn the Lumerre promise into a repeatable level.',reward:'Bonus GP + role leverage',pressure:'Every missed podium becomes news.'},
    {id:'technical',scope:'personal',type:'TECHNICAL',title:'NO BLIND SETUP CALLS',note:'Complete three technical events without guessing.',reward:'Control growth',pressure:'Requires evidence work.'},
    {id:'reliable',scope:'personal',type:'RELIABILITY',title:'FINISH EVERY ROUND',note:'Eight starts, eight classified finishes.',reward:'Stamina growth',pressure:'Aggressive calls carry more risk.'},
    {id:'media',scope:'personal',type:'PROFILE',title:'OWN THE HEADLINE',note:'Create two positive high-pressure media moments.',reward:'Fame + sponsor value',pressure:'Silence will not complete it.'}
  ];

  const CROWN_VILLAGE_ENCOUNTERS = {
    tyrese:{id:'tyrese',location:'Quickquill compound',title:'SPONSOR ESCAPE',character:'crownTyrese',frame:3,text:'Tyrese is standing behind an equipment case while a sponsor coordinator searches the opposite direction.',options:[
      {label:'Cover for him for thirty seconds.',note:'A tiny act of teammate conspiracy.',effects:{relationships:{tyreseBond:3}},careerEffects:{reputation:{quickquillTrust:1}}},
      {label:'Tell him Mara is going to find him anyway.',note:'Refuse to become an accessory.',effects:{relationships:{maraBond:1,tyreseBond:1}},careerEffects:{reputation:{paddockRespect:1}}}
    ]},
    jalen:{id:'jalen',location:'Hospitality row',title:'NO HELMETS, STILL COMPETITIVE',character:'crownJalen',frame:1,text:'Jalen has somehow turned an argument about local coffee into a discussion about who was faster through Blackglass sector two.',options:[
      {label:'Correct his memory of the sector.',note:'Bring receipts to a social conversation.',effects:{relationships:{jalenRespect:2,jalenHeat:1}},careerEffects:{rivalries:{jalen:{intensity:2,respect:2}}}},
      {label:'Buy him the coffee and refuse the argument.',note:'Competitive does not have to mean hostile.',effects:{relationships:{jalenRespect:2}},careerEffects:{rivalries:{jalen:{respect:3,intensity:-1}}}}
    ]},
    sofia:{id:'sofia',location:'Garden path',title:'FIVE MINUTES, FINALLY',character:'crownSofia',frame:2,text:'Sofia smiles as though the message from Quickquill HQ was sent yesterday rather than an entire chapter ago.',options:[
      {label:'Ask what she actually wanted to talk about.',note:'Skip the paddock dance.',effects:{identity:{focus:1}},careerEffects:{reputation:{paddockRespect:1},rivalries:{sofia:{respect:2}}}},
      {label:'Tell her Quickquill knows you are here.',note:'Friendly, but transparent.',effects:{relationships:{quickquillTrust:2}},careerEffects:{rivalries:{sofia:{respect:2}},reputation:{quickquillTrust:2}}}
    ]},
    nell:{id:'nell',location:'Technical display',title:'NOT TECHNICALLY SOCIALISING',character:'crownNell',frame:0,text:'Nell has left the hospitality route entirely because somebody is demonstrating an adjustable Lumerrean timing gate.',options:[
      {label:'Stay and ask how it works.',note:'This may become a twenty-minute answer.',effects:{identity:{focus:2},relationships:{nellBond:3}},careerEffects:{racecraft:{technicalUnderstanding:1}}},
      {label:'Remind her there is food somewhere.',note:'Engineering cannot legally replace lunch.',effects:{identity:{heart:1},relationships:{nellBond:2}},careerEffects:{racecraft:{staminaManagement:1}}}
    ]},
    luka:{id:'luka',location:'Café terrace',title:'ABSOLUTELY DELIBERATE',character:'crownLuka',frame:0,text:'Luka is explaining to three strangers that his near-miss at Blackglass was a tactical exploration of the outside barrier.',options:[
      {label:'Ask whether the barrier learned anything.',note:'Meet nonsense with nonsense.',effects:{identity:{heart:1}},careerEffects:{rivalries:{luka:{respect:1,intensity:1}}}},
      {label:'Ask what he actually felt in the corner.',note:'There is a serious racer underneath the performance.',effects:{identity:{focus:1}},careerEffects:{rivalries:{luka:{respect:3}}}}
    ]},
    ren:{id:'ren',location:'Promenade timing board',title:'THE LINE THROUGH THE NOISE',character:'crownRen',frame:1,text:'Ren is watching a public timing demonstration with the concentration most people reserve for qualifying.',options:[
      {label:'Ask what he is seeing.',note:'Learn from the grid’s precision specialist.',effects:{identity:{focus:1}},careerEffects:{racecraft:{technicalUnderstanding:1},rivalries:{ren:{respect:2}}}},
      {label:'Ask whether he ever switches off.',note:'A rare non-technical question.',effects:{identity:{heart:1}},careerEffects:{rivalries:{ren:{respect:2}}}}
    ]},
    maya:{id:'maya',location:'Media plaza edge',title:'THE GAP IN THE CROWD',character:'crownMaya',frame:1,text:'Maya has identified the exact moment a press line becomes confused enough to escape through it.',options:[
      {label:'Follow her route.',note:'Trust the grid’s best chaos reader.',effects:{identity:{fire:1}},careerEffects:{rivalries:{maya:{respect:2}},reputation:{media:-1}}},
      {label:'Stay and answer one more question.',note:'Use the attention while it is useful.',effects:{identity:{focus:1}},careerEffects:{reputation:{media:2,fame:1}}}
    ]},
    media:{id:'media',location:'Media plaza',title:'ONE QUESTION BECOMES SIX',character:'crownMara',frame:5,text:'A reporter recognises you before Mara can steer the team around the media line.',options:[
      {label:'Give them one clean answer.',note:'Control the moment.',effects:{relationships:{maraBond:1}},careerEffects:{reputation:{media:3,fame:2,pressure:1}}},
      {label:'Politely point them toward the scheduled session.',note:'Professional boundaries are still professional.',effects:{relationships:{quickquillTrust:2}},careerEffects:{reputation:{paddockRespect:2,media:1}}}
    ]},
    fan:{id:'fan',location:'Central promenade',title:'THE FIRST AUTOGRAPH',character:'crownTyrese',frame:7,text:'A young Quickquill supporter holds out a programme and then seems to forget every word they intended to say.',options:[
      {label:'Sign it and ask their name.',note:'Make the moment belong to them too.',effects:{identity:{heart:2}},careerEffects:{reputation:{fame:4,paddockRespect:1}}},
      {label:'Sign it, then let Tyrese add his name too.',note:'The team captain is standing right there.',effects:{relationships:{tyreseBond:2}},careerEffects:{reputation:{fame:3,quickquillTrust:2}}}
    ]}
  };

  const CROWN_RECEPTION_CONVERSATIONS = {
    mara:{id:'mara',title:'WHO MARA WAS TALKING TO',character:'crownMara',frame:4,text:'Mara finishes a conversation with a senior figure from another team before you arrive. She does not volunteer who it was.',options:[
      {label:'Ask directly.',note:'Career politics are now your business too.',effects:{relationships:{maraBond:2}},careerEffects:{reputation:{quickquillTrust:1,pressure:1}}},
      {label:'Leave it alone unless she needs you.',note:'Trust her to manage the team.',effects:{relationships:{maraBond:2,quickquillTrust:2}},careerEffects:{reputation:{quickquillTrust:2}}}
    ]},
    tyrese:{id:'tyrese',title:'NUMBER ONE QUESTIONS',character:'crownTyrese',frame:8,text:'Tyrese has already been asked twice whether Quickquill now has “two number-one racers.” He is amused. Mostly.',options:[
      {label:'Tell him it is still his team.',note:'Respect the captain without shrinking yourself.',effects:{relationships:{tyreseBond:3}},careerEffects:{tyrese:{friendship:2,professionalRespect:2,competitiveTension:-1}}},
      {label:'Tell him the stopwatch can decide.',note:'Friendly words. Competitive meaning.',effects:{identity:{fire:1},relationships:{tyreseBond:1}},careerEffects:{tyrese:{professionalRespect:3,competitiveTension:4}}}
    ]},
    jalen:{id:'jalen',title:'NO CAMERAS FOR ONCE',character:'crownJalen',frame:10,text:'Away from the public route, Jalen is considerably less interested in performing the rivalry everybody keeps trying to write for him.',options:[
      {label:'Talk racing honestly.',note:'Respect can be more interesting than hostility.',effects:{relationships:{jalenRespect:3}},careerEffects:{rivalries:{jalen:{respect:4,intensity:1}}}},
      {label:'Remind him he started this.',note:'Keep the competitive edge alive.',effects:{relationships:{jalenHeat:2,jalenRespect:1}},careerEffects:{rivalries:{jalen:{respect:2,intensity:3}}}}
    ]},
    sofia:{id:'sofia',title:'THE PADDOCK IS TALKING',character:'crownSofia',frame:7,text:'Sofia says the paddock has begun treating your three-race assessment like public property. She does not say which rumours she believes.',options:[
      {label:'Ask what Valecroft are hearing.',note:'Information without pretending it is friendship.',effects:{identity:{focus:1}},careerEffects:{rivalries:{sofia:{respect:3}},reputation:{pressure:1}}},
      {label:'Tell her you are focused on Quickquill.',note:'Make the boundary clear.',effects:{relationships:{quickquillTrust:2}},careerEffects:{rivalries:{sofia:{respect:2}},reputation:{quickquillTrust:2}}}
    ]},
    nell:{id:'nell',title:'THE RECEPTION HAS TELEMETRY NOW',character:'crownNell',frame:1,text:'Nell has found a Lumerrean engineer near the food tables and turned the reception into an unscheduled technical seminar.',options:[
      {label:'Join the discussion.',note:'Apparently this is what relaxation looks like now.',effects:{relationships:{nellBond:3},identity:{focus:1}},careerEffects:{racecraft:{technicalUnderstanding:1}}},
      {label:'Rescue Nell before midnight.',note:'Somebody has to end the seminar.',effects:{relationships:{nellBond:2},identity:{heart:1}},careerEffects:{racecraft:{pressureHandling:1}}}
    ]},
    luka:{id:'luka',title:'THE CHALLENGE WAS DEFINITELY RIGGED',character:'crownLuka',frame:3,text:'Luka has a new explanation for every Crown Challenge event he did not win.',options:[
      {label:'Let him tell the story.',note:'It gets better every thirty seconds.',effects:{identity:{heart:1}},careerEffects:{rivalries:{luka:{respect:2}}}},
      {label:'Show him the scoreboard.',note:'Cruel. Accurate.',effects:{identity:{fire:1}},careerEffects:{rivalries:{luka:{intensity:2,respect:1}}}}
    ]},
    ren:{id:'ren',title:'PRECISION, OFF DUTY',character:'crownRen',frame:6,text:'Ren congratulates you on the Challenge with exactly enough specificity to prove he remembers every split.',options:[
      {label:'Ask where you lost time.',note:'Turn a compliment into useful data.',effects:{identity:{focus:1}},careerEffects:{rivalries:{ren:{respect:3}},racecraft:{technicalUnderstanding:1}}},
      {label:'Just accept the compliment.',note:'Not every conversation needs telemetry.',effects:{identity:{heart:1}},careerEffects:{rivalries:{ren:{respect:3}}}}
    ]},
    maya:{id:'maya',title:'EVERYBODY IS WATCHING SOMEBODY ELSE',character:'crownMaya',frame:5,text:'Maya claims receptions are easy because the useful conversations happen while cameras are pointed at the famous people.',options:[
      {label:'Ask what she has heard.',note:'Chaos can contain information.',effects:{identity:{focus:1}},careerEffects:{rivalries:{maya:{respect:2}},reputation:{pressure:1}}},
      {label:'Ask who she thinks is being underestimated.',note:'Make it about the racing grid.',effects:{identity:{heart:1}},careerEffects:{rivalries:{maya:{respect:3}}}}
    ]}
  };

  const CROWN_CHALLENGE_AI_POINTS = {
    reaction:{jalen:9,sofia:8,luka:7,tyrese:9,ren:9,maya:7},
    slalom:{jalen:7,sofia:9,luka:6,tyrese:8,ren:10,maya:7},
    climb:{jalen:9,sofia:7,luka:10,tyrese:8,ren:7,maya:8},
    sprint:{jalen:10,sofia:7,luka:9,tyrese:9,ren:7,maya:8}
  };

  const ALL_QUICKQUILL_SCENES = [...QUICKQUILL_SCENES, ...QUICKQUILL_CANTO_SCENES, ...QUICKQUILL_DOWNTIME_SCENES, ...QUICKQUILL_BLACKGLASS_SCENES, ...QUICKQUILL_SEAT_SCENES, ...QUICKQUILL_CROWN_WEEK_SCENES, ...QUICKQUILL_LUMERRE_PRACTICE_SCENES, ...QUICKQUILL_LUMERRE_AFTER_FLAG_SCENES, ...QUICKQUILL_VERDICT_SCENES, ...QUICKQUILL_SEASON_SCENES];

  const STORY_JOURNEY = [
    { number: '01', title: 'The Impossible Contract', subtitle: 'A race nobody important was watching', image: 'story/environments/01_Young_Velmora_League_Circuit.png' },
    { number: '02', title: 'Prove You Belong', subtitle: 'Race One · Canto Plains', image: 'story/environments/05_Canto_Plains_Racing_Venue.png' },
    { number: '03', title: 'A Place at Quickquill', subtitle: 'Settling in · no race today', image: 'story/environments/11_Quickquill_Accommodation_Corridor.png' },
    { number: '04', title: 'Blackglass Under Floodlights', subtitle: 'Race Two · a full northern weekend', image: 'story/environments/20_Blackglass_Night_Circuit_Reveal.png' },
    { number: '05', title: 'A Seat at the Table', subtitle: 'Strategy, media and career politics', image: 'story/chapter5/quickquill-strategy-room.webp' },
    { number: '06', title: 'The Lumerre Crown', subtitle: 'Crown Week · festival, challenge, race weekend', image: 'story/chapter6/crown-week/crown-village.webp' },
    { number: '07', title: 'The Verdict', subtitle: 'Contract · leverage · outside interest', image: 'story/environments/02_Quickquill_Hangar_Exterior.png' },
    { number: '08', title: 'The First Full Season', subtitle: 'Calendar · objectives · rivalries · contracts', image: 'story/environments/01_Young_Velmora_League_Circuit.png' }
  ];

  const TESTER_REPLAY_CHAPTERS = [
    { id:'prologue', number:'01', label:'The Impossible Contract', scene:'q0', phase:'PROLOGUE' },
    { id:'canto', number:'02', label:'Prove You Belong', scene:'q4', phase:'RACE ONE · CANTO' },
    { id:'downtime', number:'03', label:'A Place at Quickquill', scene:'q9', phase:'DOWNTIME' },
    { id:'blackglass', number:'04', label:'Blackglass Under Floodlights', scene:'q18', phase:'RACE TWO · BLACKGLASS' },
    { id:'seat', number:'05', label:'A Seat at the Table', scene:'q32', phase:'CAREER REVIEW' },
    { id:'crown-week', number:'06A', label:'The Lumerre Crown — Crown Week', scene:'q40', phase:'CROWN WEEK' },
    { id:'practice', number:'06B', label:'The Measure of a Lap', scene:'q46', phase:'PRACTICE & QUALIFYING' },
    { id:'race-day', number:'06C', label:'The Lumerre Crown — Race Day', scene:'q56', phase:'RACE DAY' },
    { id:'after-flag', number:'06D', label:'The Lumerre Crown — After the Flag', scene:'q57', phase:'AFTER THE FLAG' },
    { id:'verdict', number:'07', label:'The Verdict', scene:'q66', phase:'CONTRACT DECISION' },
    { id:'season', number:'08', label:'The First Full Season', scene:'q75', phase:'OPENING WEEK' }
  ];

  const CAREER_DESK_PANELS = [
    { id:'journal', label:'Career Journal', short:'Journal', mark:'J' },
    { id:'records', label:'Race Records', short:'Records', mark:'R' },
    { id:'evolution', label:'Career Evolution', short:'Evolution', mark:'E' },
    { id:'relationships', label:'Relationships', short:'People', mark:'P' },
    { id:'memories', label:'Memory Shelf', short:'Memories', mark:'M' },
    { id:'inbox', label:'Inbox', short:'Inbox', mark:'I' },
    { id:'calendar', label:'Calendar', short:'Calendar', mark:'C' },
    { id:'dragon', label:'Dragon Profile', short:'Dragon', mark:'D' }
  ];

  const root = document.getElementById('careerRoot');
  const music = {
    menu: document.getElementById('careerMenuMusic'),
    opening: document.getElementById('careerOpeningMusic'),
    hub: document.getElementById('careerHubMusic'),
    story: document.getElementById('careerStoryMusic'),
    downtime: document.getElementById('careerDowntimeMusic'),
    strategy: document.getElementById('careerStrategyMusic'),
    press: document.getElementById('careerPressMusic'),
    mara: document.getElementById('careerMaraMusic'),
    lumerre: document.getElementById('careerLumerreMusic'),
    crownArrival: document.getElementById('careerCrownArrivalMusic'),
    crownFestival: document.getElementById('careerCrownFestivalMusic'),
    crownChallenge: document.getElementById('careerCrownChallengeMusic'),
    crownGarden: document.getElementById('careerCrownGardenMusic'),
    crownOverlook: document.getElementById('careerCrownOverlookMusic'),
    crownAccommodation: document.getElementById('careerCrownAccommodationMusic'),
    lumerrePractice: document.getElementById('careerLumerrePracticeMusic'),
    lumerreQualifying: document.getElementById('careerLumerreQualifyingMusic'),
    lumerreRace: document.getElementById('careerLumerreRaceMusic'),
    lumerreRaceFinal: document.getElementById('careerLumerreRaceFinalMusic'),
    lumerrePostRace: document.getElementById('careerLumerrePostRaceMusic')
  };
  const AFTER_HOURS_AUDIO_ROOT = 'story/after-hours/audio/';
  const makeAfterHoursAudio = (file, loop = false) => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.loop = loop;
    audio.src = AFTER_HOURS_AUDIO_ROOT + file;
    return audio;
  };
  const afterHoursAudio = {
    storm: makeAfterHoursAudio('distant-storm.mp3', true),
    walk: makeAfterHoursAudio('dragon-walk.mp3', true),
    run: makeAfterHoursAudio('dragon-run.mp3', true),
    door: makeAfterHoursAudio('metal-door.mp3'),
    clatter: makeAfterHoursAudio('plate-clatter.mp3'),
    eat: makeAfterHoursAudio('eat.mp3'),
    steward: makeAfterHoursAudio('steward-steps.mp3', true),
    paper: makeAfterHoursAudio('paper-rustle.mp3'),
    discovery: makeAfterHoursAudio('discovery-chime.mp3')
  };

  const makeCrownAudio = (src, loop = false) => {
    const audio = new Audio();
    audio.preload = loop ? 'metadata' : 'auto';
    audio.loop = loop;
    audio.src = src;
    return audio;
  };
  // Reuse the site's established crowd ambience instead of adding another
  // heavy crowd file. Crown Week supplied ambience is only used where it adds
  // a distinct soundscape: the reception and the quiet circuit overlook.
  const crownAmbience = {
    crowd: makeCrownAudio('../assets/quidditch-crowd.mp3', true),
    garden: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_garden_muffled_chatter_loop.mp3', true),
    wind: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_overlook_wind_loop.mp3', true)
  };
  const crownSfx = {
    beep: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_countdown_beep_QUIET.mp3'),
    go: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_go_beep_QUIET.mp3'),
    checkpoint: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_checkpoint_pass.mp3'),
    split: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_split_time_ping.mp3'),
    miss: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_missed_gate.mp3'),
    falseStart: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_false_start_buzzer_QUIET.mp3'),
    newLeader: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_new_leader_sting.mp3'),
    personalBest: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_personal_best_sting.mp3'),
    complete: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_event_complete_sting.mp3'),
    inbox: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_inbox_message_ping_SOFT.mp3'),
    camera: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_camera_shutter_burst_SOFT.mp3'),
    autograph: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_autograph_signature.mp3'),
    rumour: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_rumour_news_sting_SOFT.mp3')
  };
  const CROWN_SFX_VOLUMES = {beep:.11,go:.13,checkpoint:.22,split:.20,miss:.19,falseStart:.17,newLeader:.23,personalBest:.23,complete:.25,inbox:.20,camera:.14,autograph:.24,rumour:.19};
  function playCrownSfx(id, overrideVolume = null) {
    const audio = crownSfx[id];
    if (!audio || !state.soundOn) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, overrideVolume ?? CROWN_SFX_VOLUMES[id] ?? .2));
      void audio.play().catch(() => {});
    } catch (_) {}
  }

  const raceSfx = {
    order: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_inbox_message_ping_SOFT.mp3'),
    attack: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_new_leader_sting.mp3'),
    finalLap: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_personal_best_sting.mp3'),
    finish: makeCrownAudio(CROWN_WEEK_SFX_ROOT + 'crown_event_complete_sting.mp3')
  };
  const RACE_SFX_VOLUMES = { order:.18, attack:.22, finalLap:.24, finish:.26 };
  function playRaceSfx(id, overrideVolume = null) {
    const audio = raceSfx[id];
    if (!audio || !state.soundOn) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, overrideVolume ?? RACE_SFX_VOLUMES[id] ?? .2));
      void audio.play().catch(() => {});
    } catch (_) {}
  }
  const state = {
    mode: 'menu',
    selectedMenu: 0,
    selectedTeam: null,
    selectedHub: null,
    hubPanel: '',
    hubInboxId: '',
    frameIndex: 0,
    soundOn: true,
    saves: [],
    savesLoading: true,
    savesError: '',
    savePickerOpen: false,
    exitOpen: false,
    teamConfirmOpen: false,
    busy: false,
    blackout: false,
    transitionLocked: false,
    user: null,
    client: null,
    activeSave: null,
    story: null,
    storyError: '',
    storySaving: false,
    verdictSubmitting: false,
    storyRevealComplete: true,
    resetStoryConfirmOpen: false,
    testerReplay: null,
    downtimeActivity: '',
    downtimeMessage: '',
    blackglassActivity: '',
    blackglassMessage: '',
    afterHoursGame: null,
    seatMediaReporter: '',
    seatTransient: '',
    crownEncounterId: '',
    crownReceptionId: '',
    crownWeekView: '',
    crownTransient: '',
    crownChallengeLive: null,
    lumerrePracticeView: '',
    lumerrePracticeTransient: '',
    lumerreQualifyingLive: null,
    seasonView: '',
    seasonControlTab: 'weekend',
    seasonTransient: '',
    lumerreRaceTransient: '',
    lumerreRaceRuntime: null,
    afterFlagTransient: '',
    afterFlagModal: '',
    verdictTransient: '',
    verdictModal: '',
    dutySession: null,
    freeRoamMugClicks: 0,
    status: 'Loading your career records…'
  };
  let audioContext = null;
  let storyRevealTimer = 0;
  let storyRevealText = '';
  let accountBridgeResolve = null;
  let accountBridgeReject = null;
  let accountBridgeTimer = 0;
  const failedMusicTracks = new WeakSet();
  let crownChallengeTimers = [];
  let lumerreQualifyingTimers = [];
  function clearCrownChallengeTimers() {
    crownChallengeTimers.forEach(id => window.clearTimeout(id));
    crownChallengeTimers = [];
    state.crownChallengeLive = null;
  }
  function clearLumerreQualifyingTimers(resetLive = true) {
    lumerreQualifyingTimers.forEach(id => window.clearTimeout(id));
    lumerreQualifyingTimers = [];
    if (resetLive) state.lumerreQualifyingLive = null;
  }

  // V34.24: Chapter Five introduced new media files. If a deployment ever
  // misses one of those files, fail gracefully to the established story music
  // instead of leaving the scene completely silent. Re-installing this patch
  // also restores the intended Chapter Five tracks themselves.
  Object.entries(music).forEach(([key, track]) => {
    if (!track) return;
    track.addEventListener('error', () => {
      failedMusicTracks.add(track);
      console.warn(`[Dragonbound Career Mode] Audio asset failed to load: ${key}`, track.currentSrc || track.src);
      if (state.mode === 'story' && state.soundOn) window.setTimeout(() => syncMusic(), 0);
    });
  });

  const delay = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));

  function sendParent(type, detail = {}) {
    // The hosted preview intentionally gives embedded pages an opaque `null`
    // origin. postMessage remains safe because both sides validate event.source.
    try { window.parent.postMessage({ type, bridge: BRIDGE_TOKEN, ...detail }, '*'); } catch (_) {}
  }

  function clearAccountBridge() {
    window.clearTimeout(accountBridgeTimer);
    accountBridgeTimer = 0;
    accountBridgeResolve = null;
    accountBridgeReject = null;
  }

  function requestAccountSession() {
    if (window.parent === window) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      clearAccountBridge();
      accountBridgeResolve = resolve;
      accountBridgeReject = reject;
      accountBridgeTimer = window.setTimeout(() => {
        const fail = accountBridgeReject;
        clearAccountBridge();
        fail?.(new Error('The website account connection timed out. Close Career Mode and try again.'));
      }, 10000);
      sendParent('dragonbound-career-auth-request');
    });
  }

  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.data?.type !== 'dragonbound-career-auth' || event.data.bridge !== BRIDGE_TOKEN) return;
    const resolve = accountBridgeResolve;
    const reject = accountBridgeReject;
    const detail = event.data;
    clearAccountBridge();
    if (detail.error) {
      reject?.(new Error(detail.error));
      return;
    }
    if (!detail.accessToken || !detail.refreshToken) {
      reject?.(new Error('Your login session was not available. Close Career Mode and sign in again.'));
      return;
    }
    resolve?.({ accessToken: detail.accessToken, refreshToken: detail.refreshToken });
  });

  function playTone(frequency = 280) {
    if (!state.soundOn) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {
      audioContext ||= new Context();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .66, audioContext.currentTime + .11);
      gain.gain.setValueAtTime(.025, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .12);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + .13);
    } catch (_) {}
  }

  const BLACKGLASS_QUIET_NIGHT_SCENES = new Set(['q24','q25','q26']);

  function usableChapterTrack(track) {
    if (track && !failedMusicTracks.has(track)) return track;
    if (music.story && !failedMusicTracks.has(music.story)) return music.story;
    return null;
  }

  function activeTrack() {
    if (state.mode === 'menu') return music.menu;
    if (state.mode === 'opening' || state.mode === 'team-select') return music.opening;
    if (state.mode === 'story') {
      // Blackglass qualifying/evening/After Hours should feel like the same
      // private late-night downtime space as the Quickquill dorm scenes. Keep
      // the restrained private-quarters music underneath the storm ambience;
      // do not fall back to the louder adventure/story track here.
      if (state.afterHoursGame?.active) return music.downtime || null;
      if (BLACKGLASS_QUIET_NIGHT_SCENES.has(state.story?.scene)) return music.downtime || music.story;
      // Chapter 3 is one continuous Quickquill downtime atmosphere. Keep the
      // private-quarters track running through the hangar return, accommodation
      // corridor, player room, common room, workshop duties and rooftop scenes
      // instead of dropping back to the generic story track between locations.
      const inQuickquillDowntime = QUICKQUILL_DOWNTIME_SCENES.some(scene => scene.id === state.story?.scene);
      if (inQuickquillDowntime) return music.downtime || music.story;
      if (state.story?.chapter === 'lumerre-race-day') {
        const phase = state.story?.chapter6?.raceWeekend?.phase || 'grid';
        return ['engine-launching','engine-live'].includes(phase) ? null : usableChapterTrack(music.lumerreRace);
      }
      if (state.story?.chapter === 'lumerre-after-flag' || QUICKQUILL_LUMERRE_AFTER_FLAG_SCENES.some(scene=>scene.id===state.story?.scene)) {
        if (['q62','q63','q64','q65'].includes(state.story?.scene)) return usableChapterTrack(music.lumerrePostRace);
        if (state.story?.scene === 'q61') return usableChapterTrack(music.press);
        return usableChapterTrack(music.crownAccommodation);
      }
      if (state.story?.chapter === 'verdict' || QUICKQUILL_VERDICT_SCENES.some(scene=>scene.id===state.story?.scene)) {
        if (state.story?.scene === 'q67' || state.story?.scene === 'q72') return music.downtime || music.story;
        if (['q68','q69','q70','q73','q74'].includes(state.story?.scene)) return usableChapterTrack(music.mara);
        if (state.story?.scene === 'q71') return usableChapterTrack(music.strategy);
        return music.story;
      }
      if (state.story?.chapter === 'season-one' || QUICKQUILL_SEASON_SCENES.some(scene=>scene.id===state.story?.scene)) {
        if (['q76','q79'].includes(state.story?.scene)) return music.downtime || music.story;
        if (['q77','q78','q80'].includes(state.story?.scene)) return usableChapterTrack(music.strategy);
        return music.story;
      }
      if (QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(scene => scene.id === state.story?.scene)) {
        return ['q51','q52','q53','q54','q55','q56'].includes(state.story?.scene) ? usableChapterTrack(music.lumerreQualifying) : usableChapterTrack(music.lumerrePractice);
      }
      if (QUICKQUILL_CROWN_WEEK_SCENES.some(scene => scene.id === state.story?.scene)) {
        if (state.story?.scene === 'q42') return usableChapterTrack(music.crownFestival);
        if (state.story?.scene === 'q43') return usableChapterTrack(music.crownChallenge);
        if (state.story?.scene === 'q44') return state.crownWeekView === 'overlook' ? usableChapterTrack(music.crownOverlook) : usableChapterTrack(music.crownGarden);
        if (state.story?.scene === 'q45') return usableChapterTrack(music.crownAccommodation);
        return usableChapterTrack(music.crownArrival);
      }
      if (QUICKQUILL_SEAT_SCENES.some(scene => scene.id === state.story?.scene)) {
        if (state.story?.scene === 'q34' || (state.story?.scene === 'q33' && activeStoryScene()?.beats?.[state.story?.beat]?.type === 'seat-strategy-sim')) return usableChapterTrack(music.strategy);
        if (state.story?.scene === 'q35') return usableChapterTrack(music.press);
        if (state.story?.scene === 'q37') return music.downtime || music.story;
        if (state.story?.scene === 'q39') return usableChapterTrack(music.lumerre);
        return usableChapterTrack(music.mara);
      }
      return music.story;
    }
    if (state.mode === 'story-journey') return music.story;
    if (state.mode === 'meet-teams') return null;
    return music.hub;
  }

  function syncCrownAmbience() {
    const inCrown = state.mode === 'story' && QUICKQUILL_CROWN_WEEK_SCENES.some(scene => scene.id === state.story?.scene);
    const inPractice = state.mode === 'story' && QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(scene => scene.id === state.story?.scene);
    const inRaceDay = state.mode === 'story' && state.story?.chapter === 'lumerre-race-day';
    const inAfterFlag = state.mode === 'story' && (state.story?.chapter === 'lumerre-after-flag' || QUICKQUILL_LUMERRE_AFTER_FLAG_SCENES.some(scene=>scene.id===state.story?.scene));
    let active = null;
    let volume = 0;
    if (inCrown && state.soundOn) {
      if (state.story?.scene === 'q44' && state.crownWeekView === 'overlook') { active = crownAmbience.wind; volume = .12; }
      else if (state.story?.scene === 'q44') { active = crownAmbience.garden; volume = .18; }
      else if (['q40','q41','q42','q43'].includes(state.story?.scene)) { active = crownAmbience.crowd; volume = state.story?.scene === 'q42' ? .15 : state.story?.scene === 'q43' ? .13 : .11; }
    } else if (inPractice && state.soundOn) {
      active = crownAmbience.crowd;
      volume = ['q51','q52','q53','q54'].includes(state.story?.scene) ? .10 : .055;
    } else if (inRaceDay && state.soundOn) {
      const phase = state.story?.chapter6?.raceWeekend?.phase || 'grid';
      if (!['engine-launching','engine-live'].includes(phase)) { active = crownAmbience.crowd; volume = phase === 'result' ? .09 : .11; }
    } else if (inAfterFlag && state.soundOn && ['q57','q58','q59','q60','q61'].includes(state.story?.scene)) {
      active = crownAmbience.crowd;
      volume = state.story?.scene === 'q60' ? .16 : state.story?.scene === 'q61' ? .07 : .10;
    }
    Object.values(crownAmbience).forEach(track => {
      if (!track) return;
      if (track !== active || !state.soundOn) {
        try { track.pause(); } catch (_) {}
      }
    });
    if (!active || !state.soundOn) return;
    try {
      active.volume = volume;
      void active.play().catch(() => {});
    } catch (_) {}
  }

  function syncMusic({ restart = false } = {}) {
    const active = activeTrack();
    Object.values(music).forEach(track => {
      if (!track) return;
      if (track !== active || !state.soundOn) {
        track.pause();
        track.muted = !state.soundOn;
      }
    });
    syncCrownAmbience();
    if (!active || !state.soundOn) return;
    if (restart) active.currentTime = 0;
    active.muted = false;
    active.volume = active === music.downtime ? .23
      : active === music.strategy ? .27
      : active === music.press ? .25
      : active === music.mara ? .23
      : active === music.lumerre ? .18
      : active === music.crownArrival ? .22
      : active === music.crownFestival ? .28
      : active === music.crownChallenge ? .16
      : active === music.crownGarden ? .32
      : active === music.crownOverlook ? .24
      : active === music.crownAccommodation ? .30
      : active === music.lumerrePractice ? .32
      : active === music.lumerreQualifying ? (state.story?.scene === 'q54' ? .32 : .29)
      : active === music.lumerreRace ? .31
      : active === music.lumerreRaceFinal ? .33
      : active === music.lumerrePostRace ? .32
      : state.mode === 'menu' ? .5
      : state.mode === 'career-hub' ? .2
      : (state.mode === 'story' || state.mode === 'story-journey') ? .4 : .4;
    void active.play().catch(error => {
      console.warn('[Dragonbound Career Mode] Music playback failed', active.currentSrc || active.src, error);
      failedMusicTracks.add(active);
      if (active !== music.story && music.story && !failedMusicTracks.has(music.story) && state.soundOn) {
        music.story.muted = false;
        music.story.volume = .4;
        void music.story.play().catch(() => failedMusicTracks.add(music.story));
      }
    });
  }

  function username() {
    const metaName = state.user?.user_metadata?.username;
    if (metaName) return String(metaName);
    return String(state.user?.email || 'Dragonbound Racer').split('@')[0];
  }

  function accountKey(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function careerDragon(save) {
    const candidates = [
      state.user?.user_metadata?.username,
      state.user?.email?.split('@')[0],
      save?.owner_username
    ];
    for (const candidate of candidates) {
      const dragon = CAREER_DRAGONS[accountKey(candidate)];
      if (dragon) return dragon;
    }
    return null;
  }

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clampCareerValue(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function defaultCareerRivalry() {
    return {
      intensity:0,
      respect:0,
      battles:0,
      playerPassedThem:0,
      theyPassedPlayer:0,
      closeFinishes:0,
      contacts:0,
      qualifyingBattles:0,
      winsAgainst:0,
      lossesAgainst:0,
      mediaIncidents:0,
      lastEvent:''
    };
  }

  function defaultCareerEvolution() {
    const rivalries = {};
    CAREER_RIVAL_IDS.forEach(id => { rivalries[id] = defaultCareerRivalry(); });
    return {
      version:CAREER_EVOLUTION_VERSION,
      raceNumber:0,
      careerPhase:'rookie',
      playerStyle:'Developing racer',
      fameTier:'Unknown',
      racecraft:{
        pace:42,
        overtaking:38,
        defending:40,
        starts:41,
        consistency:43,
        staminaManagement:44,
        pressureHandling:42,
        technicalUnderstanding:44
      },
      reputation:{
        fame:5,
        paddockRespect:8,
        media:0,
        quickquillTrust:50,
        pressure:10
      },
      records:{
        starts:0,
        wins:0,
        podiums:0,
        poles:0,
        bestFinish:null,
        bestQualifying:null,
        consecutivePodiums:0,
        bestPodiumStreak:0,
        overtakes:0,
        positionsGained:0,
        leadChanges:0,
        fastestLaps:0
      },
      firsts:{
        firstPodium:null,
        firstPole:null,
        firstWin:null
      },
      recentForm:[],
      raceHistory:[],
      processedRaces:[],
      rivalries,
      tyrese:{
        friendship:40,
        professionalRespect:35,
        competitiveTension:5,
        playerFinishesAhead:0,
        tyreseFinishesAhead:0,
        playerOutqualifies:0,
        tyreseOutqualifies:0,
        teamOrdersObeyed:0,
        teamOrdersIgnored:0
      },
      teamOrders:[],
      chapterTypesUsed:[],
      lastMilestones:[],
      nextRaceWindow:{...CAREER_RACE_WINDOWS[1]}
    };
  }

  function normaliseCareerRivalry(raw) {
    const fallback = defaultCareerRivalry();
    const next = { ...fallback, ...(raw && typeof raw === 'object' ? raw : {}) };
    ['intensity','respect','battles','playerPassedThem','theyPassedPlayer','closeFinishes','contacts','qualifyingBattles','winsAgainst','lossesAgainst','mediaIncidents'].forEach(key => {
      next[key] = Math.max(0, Number(next[key]) || 0);
    });
    next.intensity = clampCareerValue(next.intensity);
    next.respect = clampCareerValue(next.respect);
    next.lastEvent = String(next.lastEvent || '');
    return next;
  }

  function normaliseCareerEvolution(raw) {
    const fallback = defaultCareerEvolution();
    const source = raw && typeof raw === 'object' ? raw : {};
    const evolution = {
      ...fallback,
      ...cloneValue(source),
      version:CAREER_EVOLUTION_VERSION,
      racecraft:{ ...fallback.racecraft, ...(source.racecraft || {}) },
      reputation:{ ...fallback.reputation, ...(source.reputation || {}) },
      records:{ ...fallback.records, ...(source.records || {}) },
      firsts:{ ...fallback.firsts, ...(source.firsts || {}) },
      tyrese:{ ...fallback.tyrese, ...(source.tyrese || {}) },
      rivalries:{},
      recentForm:Array.isArray(source.recentForm) ? source.recentForm.slice(-5).map(item => ({...item})) : [],
      raceHistory:Array.isArray(source.raceHistory) ? source.raceHistory.slice(-20).map(item => ({...item})) : [],
      processedRaces:Array.isArray(source.processedRaces) ? [...new Set(source.processedRaces.map(String))].slice(-30) : [],
      teamOrders:Array.isArray(source.teamOrders) ? source.teamOrders.slice(-30).map(item => ({...item})) : [],
      chapterTypesUsed:Array.isArray(source.chapterTypesUsed) ? source.chapterTypesUsed.map(String).filter(value => CAREER_CHAPTER_TYPES.includes(value)).slice(-12) : [],
      lastMilestones:Array.isArray(source.lastMilestones) ? source.lastMilestones.slice(-8).map(String) : []
    };
    CAREER_RIVAL_IDS.forEach(id => { evolution.rivalries[id] = normaliseCareerRivalry(source.rivalries?.[id]); });
    Object.keys(evolution.racecraft).forEach(key => { evolution.racecraft[key] = clampCareerValue(evolution.racecraft[key]); });
    Object.keys(evolution.reputation).forEach(key => { evolution.reputation[key] = clampCareerValue(evolution.reputation[key]); });
    ['friendship','professionalRespect','competitiveTension'].forEach(key => { evolution.tyrese[key] = clampCareerValue(evolution.tyrese[key]); });
    ['playerFinishesAhead','tyreseFinishesAhead','playerOutqualifies','tyreseOutqualifies','teamOrdersObeyed','teamOrdersIgnored'].forEach(key => { evolution.tyrese[key] = Math.max(0, Number(evolution.tyrese[key]) || 0); });
    evolution.raceNumber = Math.max(0, Number(evolution.raceNumber) || 0);
    return evolution;
  }

  function careerRacerIdFromName(value) {
    const name = String(value || '').toLowerCase();
    if (!name) return '';
    for (const [id, racer] of Object.entries(CAREER_RACER_AI)) {
      if (name.includes(racer.name.toLowerCase()) || name === id) return id;
    }
    return '';
  }

  function careerPerformanceWindow(raceNumber = 1) {
    const number = Math.max(1, Number(raceNumber) || 1);
    const source = CAREER_RACE_WINDOWS[Math.min(11, number)] || CAREER_RACE_WINDOWS[11];
    return { ...source, raceNumber:number };
  }

  function deriveCareerPhase(evolution) {
    const records = evolution?.records || {};
    const starts = Math.max(0, Number(records.starts) || 0);
    const wins = Math.max(0, Number(records.wins) || 0);
    const podiums = Math.max(0, Number(records.podiums) || 0);
    const best = Number(records.bestFinish) || 99;
    const respect = Number(evolution?.reputation?.paddockRespect) || 0;
    if (wins >= 4 && starts >= 8 && respect >= 68) return 'title-contender';
    if (wins >= 2 || (starts >= 7 && podiums >= 4)) return 'contender';
    if (wins >= 1) return starts >= 5 ? 'winner' : 'rising-star';
    if (podiums >= 2 || best <= 2 || (starts >= 4 && podiums >= 1)) return 'podium-threat';
    if (starts >= 2 || best <= 3 || respect >= 25) return 'prospect';
    return 'rookie';
  }

  function careerPhaseLabel(value) {
    return ({
      'rookie':'Rookie',
      'prospect':'Prospect',
      'podium-threat':'Podium Threat',
      'rising-star':'Rising Star',
      'winner':'Winner',
      'contender':'Contender',
      'title-contender':'Title Contender'
    })[String(value || '')] || 'Rookie';
  }

  function deriveFameTier(evolution) {
    const fame = Number(evolution?.reputation?.fame) || 0;
    const wins = Number(evolution?.records?.wins) || 0;
    if (fame >= 78 || wins >= 4) return 'Velmora name';
    if (fame >= 60 || wins >= 2) return 'Star racer';
    if (fame >= 42 || wins >= 1) return 'Rising name';
    if (fame >= 25) return 'Recognisable rookie';
    if (fame >= 12) return 'Paddock curiosity';
    return 'Unknown';
  }

  function deriveCareerRacingStyle(story, evolution) {
    const starts = Math.max(0, Number(evolution?.records?.starts) || 0);
    if (!starts) return 'Developing Racer';
    const identity = careerIdentity(story);
    const c5 = story?.chapter5 || {};
    const metrics = c5.simulator?.metrics || {};
    const overtaking = Number(evolution?.racecraft?.overtaking) || 0;
    const defending = Number(evolution?.racecraft?.defending) || 0;
    const technical = Number(evolution?.racecraft?.technicalUnderstanding) || 0;
    if (identity.key === 'fire' && overtaking >= 48) return 'Attacking Racer';
    if (identity.key === 'focus' && technical >= 48) return 'Precision Racer';
    if (identity.key === 'heart' && Number(evolution?.racecraft?.staminaManagement) >= 48) return 'Patient Hunter';
    if ((Number(metrics.reading)||0) >= 58 && technical >= 50) return 'Technical Specialist';
    if (defending > overtaking + 6) return 'Defensive Racer';
    if (overtaking > defending + 6) return 'Opportunist';
    return 'All-Round Racer';
  }

  function careerEvolutionMilestone(evolution, label) {
    const text = String(label || '').trim();
    if (!text) return;
    evolution.lastMilestones = [...new Set([...(evolution.lastMilestones || []), text])].slice(-8);
  }

  function applyCareerRivalryEvents(evolution, race, story) {
    const events = Array.isArray(race.events) ? race.events : [];
    const playerName = String(careerDragon(state.activeSave)?.name || storyDragonName() || '').toLowerCase();
    events.forEach(event => {
      const racers = Array.isArray(event?.racers) ? event.racers.map(String) : [];
      const text = String(event?.text || '');
      const candidates = new Set();
      racers.forEach(name => { const id = careerRacerIdFromName(name); if (id) candidates.add(id); });
      CAREER_RIVAL_IDS.forEach(id => { if (text.toLowerCase().includes(CAREER_RACER_AI[id].name.toLowerCase())) candidates.add(id); });
      candidates.forEach(id => {
        const entry = evolution.rivalries[id];
        const hasPlayer = racers.some(name => name.toLowerCase().includes(playerName)) || racers.some(name => !careerRacerIdFromName(name));
        if (!hasPlayer && event?.type !== 'contact') return;
        entry.battles += event?.type === 'battle' ? 1 : 0;
        entry.contacts += String(event?.type || '').includes('contact') ? 1 : 0;
        entry.intensity = clampCareerValue(entry.intensity + (event?.type === 'battle' ? 3 : 1));
        entry.respect = clampCareerValue(entry.respect + (event?.type === 'battle' ? 1 : 0));
        entry.lastEvent = race.event || race.key || '';
        if (id === 'tyrese' && event?.type === 'battle') evolution.tyrese.competitiveTension = clampCareerValue(evolution.tyrese.competitiveTension + 2);
      });
    });
    if (race.rivalRanks && typeof race.rivalRanks === 'object') {
      CAREER_RIVAL_IDS.forEach(id => {
        const rivalRank = Number(race.rivalRanks[id]);
        if (!rivalRank) return;
        const entry = evolution.rivalries[id];
        if (Number(race.rank) < rivalRank) { entry.winsAgainst += 1; entry.respect = clampCareerValue(entry.respect + 2); }
        else if (Number(race.rank) > rivalRank) entry.lossesAgainst += 1;
        if (Math.abs(Number(race.rank) - rivalRank) === 1) { entry.closeFinishes += 1; entry.intensity = clampCareerValue(entry.intensity + 2); }
        if (id === 'tyrese') {
          if (Number(race.rank) < rivalRank) evolution.tyrese.playerFinishesAhead += 1;
          else if (Number(race.rank) > rivalRank) evolution.tyrese.tyreseFinishesAhead += 1;
        }
      });
    }
  }

  function applyRaceToCareerEvolution(evolution, race, story) {
    const key = String(race?.key || '').trim();
    if (!key || evolution.processedRaces.includes(key)) return evolution;
    const rank = Math.max(1, Math.min(99, Number(race.rank) || 99));
    const start = Math.max(1, Math.min(99, Number(race.startPosition) || rank));
    const qualifying = Number(race.qualifying) > 0 ? Number(race.qualifying) : null;
    const overtakes = Math.max(0, Number(race.overtakes) || 0);
    const gained = Math.max(0, Number(race.positionsGained) || Math.max(0, start - rank));
    const records = evolution.records;
    records.starts += 1;
    if (rank === 1) records.wins += 1;
    if (rank <= 3) records.podiums += 1;
    if (qualifying === 1) records.poles += 1;
    records.bestFinish = records.bestFinish ? Math.min(Number(records.bestFinish), rank) : rank;
    if (qualifying) records.bestQualifying = records.bestQualifying ? Math.min(Number(records.bestQualifying), qualifying) : qualifying;
    records.overtakes += overtakes;
    records.positionsGained += gained;
    records.leadChanges += Math.max(0, Number(race.leadChanges) || 0);
    if (race.fastestLap) records.fastestLaps += 1;
    records.consecutivePodiums = rank <= 3 ? records.consecutivePodiums + 1 : 0;
    records.bestPodiumStreak = Math.max(records.bestPodiumStreak, records.consecutivePodiums);

    const resultStrength = rank === 1 ? 5 : rank <= 3 ? 4 : rank <= 5 ? 2 : 1;
    evolution.racecraft.pace = clampCareerValue(evolution.racecraft.pace + Math.min(4, 1 + resultStrength * .55));
    evolution.racecraft.overtaking = clampCareerValue(evolution.racecraft.overtaking + Math.min(5, .8 + overtakes * .7 + gained * .35));
    evolution.racecraft.defending = clampCareerValue(evolution.racecraft.defending + (rank <= start ? 1.7 : .8));
    evolution.racecraft.starts = clampCareerValue(evolution.racecraft.starts + (start <= 3 ? 1.4 : .9));
    evolution.racecraft.consistency = clampCareerValue(evolution.racecraft.consistency + (rank <= 5 ? 1.8 : .6));
    evolution.racecraft.staminaManagement = clampCareerValue(evolution.racecraft.staminaManagement + (String(race.strategy||'').toLowerCase()==='focus' ? 2.2 : 1.2));
    evolution.racecraft.pressureHandling = clampCareerValue(evolution.racecraft.pressureHandling + (rank <= 3 ? 2.7 : 1.1));
    evolution.racecraft.technicalUnderstanding = clampCareerValue(evolution.racecraft.technicalUnderstanding + (String(race.strategy||'').toLowerCase()==='focus' ? 2.4 : 1.3));

    const fameGain = rank === 1 ? 16 : rank <= 3 ? 9 : rank <= 5 ? 4 : 1;
    const respectGain = rank === 1 ? 11 : rank <= 3 ? 7 : rank <= 5 ? 4 : 2;
    evolution.reputation.fame = clampCareerValue(evolution.reputation.fame + fameGain + Math.min(3, overtakes));
    evolution.reputation.paddockRespect = clampCareerValue(evolution.reputation.paddockRespect + respectGain + Math.min(2, gained));
    evolution.reputation.quickquillTrust = clampCareerValue(Math.max(evolution.reputation.quickquillTrust, Number(story?.relationships?.quickquillTrust)||0) + (rank <= 3 ? 2 : 0));
    evolution.reputation.pressure = clampCareerValue(evolution.reputation.pressure + (rank === 1 ? 12 : rank <= 3 ? 7 : rank <= 5 ? 3 : -2));
    evolution.reputation.media = clampCareerValue(evolution.reputation.media + (rank === 1 ? 8 : rank <= 3 ? 5 : 2));

    const completedAt = String(race.completedAt || new Date().toISOString());
    if (rank <= 3 && !evolution.firsts.firstPodium) {
      evolution.firsts.firstPodium = { event:race.event, raceNumber:records.starts, finish:rank, completedAt };
      careerEvolutionMilestone(evolution, 'FIRST CAREER PODIUM');
    }
    if (qualifying === 1 && !evolution.firsts.firstPole) {
      evolution.firsts.firstPole = { event:race.event, raceNumber:records.starts, completedAt };
      careerEvolutionMilestone(evolution, 'FIRST CAREER POLE');
    }
    if (rank === 1 && !evolution.firsts.firstWin) {
      evolution.firsts.firstWin = { event:race.event, raceNumber:records.starts, startPosition:start, completedAt, notableMoment:String(race.notableMoment||'') };
      careerEvolutionMilestone(evolution, 'FIRST CAREER VICTORY');
    }
    if (records.consecutivePodiums >= 2) careerEvolutionMilestone(evolution, `${records.consecutivePodiums} PODIUMS IN A ROW`);

    const form = {
      key,
      event:String(race.event || key),
      raceNumber:records.starts,
      finish:rank,
      startPosition:start,
      qualifying,
      overtakes,
      positionsGained:gained,
      strategy:String(race.strategy || ''),
      completedAt
    };
    evolution.recentForm = [...(evolution.recentForm || []), form].slice(-5);
    evolution.raceHistory = [...(evolution.raceHistory || []), { ...form, events:Array.isArray(race.events)?race.events.slice(-8):[] }].slice(-20);
    evolution.processedRaces = [...new Set([...(evolution.processedRaces || []), key])].slice(-30);
    evolution.raceNumber = records.starts;
    applyCareerRivalryEvents(evolution, race, story);
    evolution.careerPhase = deriveCareerPhase(evolution);
    evolution.fameTier = deriveFameTier(evolution);
    evolution.playerStyle = deriveCareerRacingStyle(story, evolution);
    evolution.nextRaceWindow = careerPerformanceWindow(records.starts + 1);
    evolution.tyrese.friendship = clampCareerValue(Math.max(evolution.tyrese.friendship, Number(story?.relationships?.tyreseBond)||0));
    evolution.tyrese.professionalRespect = clampCareerValue(evolution.tyrese.professionalRespect + (rank <= 3 ? 3 : 1));
    return evolution;
  }

  function syncCareerEvolution(story) {
    if (!story || typeof story !== 'object') return defaultCareerEvolution();
    const evolution = normaliseCareerEvolution(story.careerEvolution);
    const canto = story.race?.result;
    if (canto) {
      applyRaceToCareerEvolution(evolution, {
        key:'race-01-canto', event:'Canto Plains', rank:Number(canto.rank)||6,
        startPosition:Number(canto.startPosition)||3, qualifying:null,
        overtakes:Number(canto.overtakes)||0, positionsGained:Number(canto.positionsGained)||0,
        leadChanges:Number(canto.leadChanges)||0, strategy:story.race?.strategy||'focus',
        completedAt:story.race?.completedAt||'', photoFinish:!!canto.photoFinish,
        events:Array.isArray(canto.events)?canto.events:[], rivalRanks:canto.rivalRanks&&typeof canto.rivalRanks==='object'?canto.rivalRanks:{}, fastestLap:!!canto.fastestLap
      }, story);
    }
    const blackglass = story.blackglassRace?.result;
    if (blackglass) {
      applyRaceToCareerEvolution(evolution, {
        key:'race-02-blackglass', event:'Blackglass Night Circuit', rank:Number(blackglass.rank)||6,
        startPosition:Number(blackglass.startPosition)||Number(story.chapter4?.qualifying?.position)||3,
        qualifying:Number(story.chapter4?.qualifying?.position)||Number(blackglass.startPosition)||null,
        overtakes:Number(blackglass.overtakes)||0, positionsGained:Number(blackglass.positionsGained)||0,
        leadChanges:Number(blackglass.leadChanges)||0, strategy:story.blackglassRace?.strategy||story.chapter4?.strategy||'focus',
        completedAt:story.blackglassRace?.completedAt||'', photoFinish:!!blackglass.photoFinish,
        notableMoment:String(blackglass.notableMoment||''), events:Array.isArray(blackglass.events)?blackglass.events:[], rivalRanks:blackglass.rivalRanks&&typeof blackglass.rivalRanks==='object'?blackglass.rivalRanks:{}, fastestLap:!!blackglass.fastestLap
      }, story);
    }
    evolution.reputation.quickquillTrust = clampCareerValue(Math.max(evolution.reputation.quickquillTrust, Number(story.relationships?.quickquillTrust)||0));
    const mediaProfile = String(story.chapter5?.media?.reputation || '');
    const mediaBoost = mediaProfile ? ({'Composed':5,'Team-first':6,'Candid':4,'Edge':5}[mediaProfile] || 3) : 0;
    evolution.reputation.media = clampCareerValue(Math.max(evolution.reputation.media, mediaBoost));
    evolution.tyrese.friendship = clampCareerValue(Math.max(evolution.tyrese.friendship, Number(story.relationships?.tyreseBond)||0));
    if (!(evolution.chapterTypesUsed || []).length) {
      const inferredTypes=[];
      if (story.completed?.prologue) inferredTypes.push('teammate-story');
      if (story.completed?.canto) inferredTypes.push('race-weekend');
      if (story.completed?.downtime) inferredTypes.push('open-hub');
      if (story.completed?.blackglass) inferredTypes.push('race-weekend');
      if (story.completed?.seat) inferredTypes.push('politics');
      evolution.chapterTypesUsed=inferredTypes.slice(-12);
    }
    evolution.careerPhase = deriveCareerPhase(evolution);
    evolution.fameTier = deriveFameTier(evolution);
    evolution.playerStyle = deriveCareerRacingStyle(story, evolution);
    evolution.nextRaceWindow = careerPerformanceWindow((Number(evolution.records.starts)||0) + 1);
    story.careerEvolution = evolution;
    return evolution;
  }

  function careerEvolutionRaceConfig(story, raceNumber = null) {
    const evolution = syncCareerEvolution(story);
    const nextRace = Math.max(1, Number(raceNumber) || (Number(evolution.records.starts)||0) + 1);
    const window = careerPerformanceWindow(nextRace);
    return {
      version:CAREER_EVOLUTION_VERSION,
      raceNumber:nextRace,
      phase:evolution.careerPhase,
      phaseLabel:careerPhaseLabel(evolution.careerPhase),
      playerStyle:evolution.playerStyle,
      performanceWindow:window,
      playerModel:{
        racecraft:{...evolution.racecraft},
        reputation:{...evolution.reputation},
        staminaStart:100,
        attackWindowGapSeconds:.48,
        defendWindowGapSeconds:.42,
        mistakeRiskScale:1,
        growthPaceTarget:Number(window.paceTarget)||50
      },
      opponents:Object.fromEntries(Object.entries(CAREER_RACER_AI).map(([id,racer]) => [id,{...racer,sectorBias:{...racer.sectorBias}}])),
      battleRules:{
        enabled:true,
        minimumGapSeconds:.08,
        attackWindowSeconds:.48,
        defendWindowSeconds:.42,
        cooldownMs:9000,
        choices:['attack-inside','pressure-exit','use-slipstream','stay-patient'],
        defendChoices:['cover-inside','control-exit','break-tow','dont-over-defend'],
        realPositionChanges:true,
        noForcedRubberBanding:true
      },
      stamina:{enabled:true,hiddenByDefault:true,attackCost:8,pressureCost:4,slipstreamRecovery:3,patientRecovery:5},
      teamOrders:{enabled:true,history:(evolution.teamOrders||[]).slice(-8)},
      rivalries:Object.fromEntries(CAREER_RIVAL_IDS.map(id => [id,{...evolution.rivalries[id]}])),
      qualifying:careerQualifyingProfile(story),
      worldReaction:careerWorldReactionConfig(story)
    };
  }

  function careerQualifyingProfile(story) {
    const evolution = syncCareerEvolution(story);
    const identity = careerIdentity(story);
    const base = (Number(evolution.racecraft.pace)||0) * .42 + (Number(evolution.racecraft.technicalUnderstanding)||0) * .34 + (Number(evolution.racecraft.pressureHandling)||0) * .24;
    const identityBias = identity.key === 'focus' ? 3 : identity.key === 'fire' ? 1 : 2;
    return {
      competitiveness:clampCareerValue(base + identityBias),
      consistency:clampCareerValue(evolution.racecraft.consistency),
      pressureHandling:clampCareerValue(evolution.racecraft.pressureHandling),
      poleUnlocked:(Number(evolution.records.starts)||0) >= 2 && base >= 51,
      note:(Number(evolution.records.starts)||0) < 2 ? 'Qualifying remains inconsistent while the rookie learns professional preparation.' : base >= 65 ? 'Front-row pace is now a genuine expectation.' : 'Front-row pace is possible when setup, track knowledge and execution align.'
    };
  }

  function careerWorldReactionConfig(story) {
    const evolution = syncCareerEvolution(story);
    const fame = Number(evolution.reputation.fame)||0;
    return {
      tier:evolution.fameTier,
      fanRecognition:fame >= 25,
      autographMoments:fame >= 36,
      photographerPresence:fame >= 42,
      sponsorInterest:fame >= 48,
      merchPresence:fame >= 55,
      rivalFanReaction:fame >= 60,
      majorHeadlinePressure:fame >= 68,
      recognitionChance:Math.min(.9, Math.max(.03, fame / 100))
    };
  }

  function careerChapterTypeCanFollow(story, proposedType) {
    const type = String(proposedType || '');
    if (!CAREER_CHAPTER_TYPES.includes(type)) return false;
    const used = syncCareerEvolution(story).chapterTypesUsed || [];
    return !used.length || used[used.length - 1] !== type;
  }

  function careerRegisterChapterType(story, type) {
    const value = String(type || '');
    if (!CAREER_CHAPTER_TYPES.includes(value)) return false;
    const evolution = syncCareerEvolution(story);
    if (evolution.chapterTypesUsed[evolution.chapterTypesUsed.length - 1] === value) return false;
    evolution.chapterTypesUsed = [...evolution.chapterTypesUsed, value].slice(-12);
    story.careerEvolution = evolution;
    return true;
  }

  function careerBattleChoiceProfile(choice) {
    return ({
      'attack-inside':{label:'Attack inside',attack:11,risk:.16,stamina:-8,timeLossOnFail:.24},
      'pressure-exit':{label:'Pressure the exit',attack:5,risk:.07,stamina:-4,timeLossOnFail:.10,followUp:6},
      'use-slipstream':{label:'Use the slipstream',attack:2,risk:.025,stamina:3,timeLossOnFail:.03,followUp:9},
      'stay-patient':{label:'Stay patient',attack:-5,risk:.01,stamina:5,timeLossOnFail:0,followUp:4}
    })[String(choice || '')] || {label:'Stay patient',attack:-5,risk:.01,stamina:5,timeLossOnFail:0,followUp:4};
  }

  function careerDefenceChoiceProfile(choice) {
    return ({
      'cover-inside':{label:'Cover inside',defence:10,risk:.10,stamina:-6},
      'control-exit':{label:'Control the exit',defence:6,risk:.05,stamina:-4},
      'break-tow':{label:'Break the tow',defence:4,risk:.08,stamina:-5,attackerPenalty:5},
      'dont-over-defend':{label:"Don't over-defend",defence:-3,risk:.015,stamina:4}
    })[String(choice || '')] || {label:"Don't over-defend",defence:-3,risk:.015,stamina:4};
  }

  function resolveCareerAttackBattle(story, opponentId, choice, context = {}, roll = Math.random()) {
    const evolution = syncCareerEvolution(story);
    const opponent = CAREER_RACER_AI[opponentId] || CAREER_RACER_AI.tyrese;
    const profile = careerBattleChoiceProfile(choice);
    const gap = Math.max(.05, Number(context.gapSeconds) || .42);
    const stamina = clampCareerValue(context.stamina ?? 100);
    const sectorBias = Number(opponent.sectorBias?.[context.sectorType]) || 0;
    const playerAttack = Number(evolution.racecraft.overtaking)||0;
    const playerPace = Number(evolution.racecraft.pace)||0;
    const opponentDefence = Number(opponent.defending)||75;
    const gapBonus = Math.max(-8, Math.min(9, (.5-gap)*28));
    const staminaPenalty = stamina < 35 ? (35-stamina)*.28 : 0;
    const chance = Math.max(.08, Math.min(.84, .36 + (playerAttack-opponentDefence)/120 + (playerPace-50)/250 + profile.attack/100 + gapBonus/100 - sectorBias/100 - staminaPenalty/100));
    const mistakeChance = Math.max(.01, Math.min(.34, profile.risk + (100-Number(evolution.racecraft.consistency||50))/420 + (stamina<25?.08:0)));
    const rawRoll = Math.max(0, Math.min(.9999, Number(roll)||0));
    let outcome = 'failed';
    let positionDelta = 0;
    let timeDelta = profile.timeLossOnFail || 0;
    if (rawRoll < chance) { outcome='overtake'; positionDelta=-1; timeDelta=-.08; }
    else if (rawRoll > 1-mistakeChance) { outcome='mistake'; timeDelta=.38; }
    else if (profile.followUp) { outcome='set-up'; timeDelta=.02; }
    const narrative = outcome==='overtake'
      ? `${storyDragonName()} gets past ${opponent.name}.`
      : outcome==='mistake'
        ? `${storyDragonName()} asks too much of the move and loses momentum.`
        : outcome==='set-up'
          ? `${opponent.name} keeps the place, but the next sector is now an attack opportunity.`
          : `${opponent.name} defends the position.`;
    return {
      mode:'attack', opponentId, opponentName:opponent.name, choice:String(choice||'stay-patient'), choiceLabel:profile.label,
      outcome, chance, positionDelta, timeDelta, staminaDelta:Number(profile.stamina)||0,
      followUpBonus:Number(profile.followUp)||0, narrative,
      event:{type:outcome==='overtake'?'player-overtake':outcome==='mistake'?'player-battle-mistake':'battle', racers:[storyDragonName(),opponent.name], text:narrative}
    };
  }

  function resolveCareerDefenceBattle(story, opponentId, choice, context = {}, roll = Math.random()) {
    const evolution = syncCareerEvolution(story);
    const opponent = CAREER_RACER_AI[opponentId] || CAREER_RACER_AI.sofia;
    const profile = careerDefenceChoiceProfile(choice);
    const gap = Math.max(.05, Number(context.gapSeconds) || .36);
    const stamina = clampCareerValue(context.stamina ?? 100);
    const playerDefence = Number(evolution.racecraft.defending)||0;
    const opponentAttack = Number(opponent.overtaking)||78;
    const gapPenalty = Math.max(-8,Math.min(10,(.42-gap)*30));
    const staminaPenalty = stamina < 35 ? (35-stamina)*.24 : 0;
    const holdChance = Math.max(.10,Math.min(.88,.48+(playerDefence-opponentAttack)/125+profile.defence/100-gapPenalty/100-staminaPenalty/100));
    const mistakeChance = Math.max(.01,Math.min(.28,profile.risk+(100-Number(evolution.racecraft.consistency||50))/480));
    const rawRoll = Math.max(0,Math.min(.9999,Number(roll)||0));
    let outcome='hold';
    let positionDelta=0;
    let timeDelta=.03;
    if(rawRoll > holdChance && rawRoll < 1-mistakeChance){outcome='passed';positionDelta=1;timeDelta=.18;}
    else if(rawRoll >= 1-mistakeChance){outcome='mistake';positionDelta=1;timeDelta=.34;}
    const narrative=outcome==='hold'?`${storyDragonName()} keeps ${opponent.name} behind.`:outcome==='mistake'?`${storyDragonName()} over-defends and ${opponent.name} takes the place.`:`${opponent.name} completes the pass.`;
    return {
      mode:'defend',opponentId,opponentName:opponent.name,choice:String(choice||'dont-over-defend'),choiceLabel:profile.label,
      outcome,holdChance,positionDelta,timeDelta,staminaDelta:Number(profile.stamina)||0,narrative,
      event:{type:outcome==='hold'?'defence-held':'player-lost-position',racers:[storyDragonName(),opponent.name],text:narrative}
    };
  }

  function recordCareerTeamOrder(story, order = {}) {
    const evolution = syncCareerEvolution(story);
    const row = {
      type:String(order.type || 'hold-position'),
      event:String(order.event || ''),
      raceNumber:Number(order.raceNumber)||Math.max(1,Number(evolution.records.starts)||1),
      response:String(order.response || 'received'),
      consequence:String(order.consequence || ''),
      at:String(order.at || new Date().toISOString())
    };
    evolution.teamOrders = [...(evolution.teamOrders || []), row].slice(-30);
    if (row.response === 'obeyed') evolution.tyrese.teamOrdersObeyed += 1;
    if (row.response === 'ignored') { evolution.tyrese.teamOrdersIgnored += 1; evolution.tyrese.competitiveTension = clampCareerValue(evolution.tyrese.competitiveTension + 8); }
    story.careerEvolution = evolution;
    return row;
  }

  window.DragonboundCareerEvolution = Object.freeze({
    version:CAREER_EVOLUTION_VERSION,
    racerAI:CAREER_RACER_AI,
    raceWindows:CAREER_RACE_WINDOWS,
    getState:() => state.story ? cloneValue(syncCareerEvolution(state.story)) : null,
    getRaceConfig:(raceNumber) => state.story ? cloneValue(careerEvolutionRaceConfig(state.story, raceNumber)) : null,
    resolveAttack:(opponentId, choice, context, roll) => state.story ? resolveCareerAttackBattle(state.story, opponentId, choice, context || {}, roll === undefined ? Math.random() : roll) : null,
    resolveDefence:(opponentId, choice, context, roll) => state.story ? resolveCareerDefenceBattle(state.story, opponentId, choice, context || {}, roll === undefined ? Math.random() : roll) : null,
    chapterTypeCanFollow:(type) => state.story ? careerChapterTypeCanFollow(state.story, type) : false,
    worldReaction:() => state.story ? cloneValue(careerWorldReactionConfig(state.story)) : null
  });

  function defaultQuickquillStory() {
    return {
      id: 'quickquill-against-the-odds',
      version: 19,
      chapter: 'prologue',
      scene: 'q0',
      beat: 0,
      completed: { prologue: false, canto: false, downtime: false, blackglass: false, seat: false, crownWeek: false, practiceQualifying: false, raceWeekend: false, afterFlag: false, verdict: false, seasonOpening: false },
      identity: { heart: 0, fire: 0, focus: 0 },
      relationships: {
        quickquillTrust: 50,
        tyreseBond: 40,
        maraBond: 20,
        nellBond: 20,
        dragonBond: 50,
        jalenHeat: 10,
        jalenRespect: 0,
        rookRespect: 0,
        stewardRespect: 0,
        valecroftInterest: 0,
        sunscaleInterest: 0
      },
      choices: {},
      race: { status: 'not-started', strategy: '', runId: '', result: null },
      blackglassRace: { status: 'not-started', strategy: '', runId: '', result: null },
      chapter4: {
        rebuildVersion: 2,
        strategy: '',
        briefingTone: '',
        teamQuestion: '',
        pressureResponse: '',
        northRoadChoice: '',
        paddockSeen: [],
        stewardResponse: '',
        rookResponse: '',
        jalenResponse: '',
        reputation: 0,
        studiedSections: [],
        setupPlan: '',
        qualifying: { completed: false, plan: '', position: 3, lapMs: 0, referenceDeltaMs: 0, grid: [] },
        eveningMoments: [],
        eveningResponses: {},
        localTip: '',
        telemetryReady: false,
        tyreseCallout: false,
        roomActions: [],
        dragonState: 'steady',
        morningPrep: '',
        finalWord: '',
        aftermath: '',
        keepsake: '',
        raceMemory: [],
        afterHours: {
          completed:false,
          snackFound:false,
          timingFound:false,
          bonusSection:'',
          passFound:false,
          passReturned:false,
          passPocketed:false,
          secretFound:false,
          caught:false,
          caughtResponse:'',
          clatterTriggered:false,
          outcome:'',
          memory:''
        }
      },
      chapter5: {
        reviewReason:'',
        developmentPriority:'',
        simulator:{completed:false,index:0,answers:[],feedback:'',metrics:{reading:50,energy:50,aggression:50,team:50},profile:''},
        media:{completed:false,answers:[],headlines:[],scores:{confidence:0,team:0,candid:0,edge:0},reputation:''},
        sofia:{discovered:false,told:'',reply:''},
        freeTime:{activities:[],eventId:'',eventChoice:'',completed:false},
        lumerreRole:'',
        finalPromise:''
      },
      chapter6: {
        crownWeek:{
          started:false,
          completed:false,
          arrivalStyle:'',
          village:{visited:[],encounters:[],encounterChoices:{},inboxRead:[],rumourId:'',rumourSeen:false,completed:false},
          paradeStyle:'',
          challenge:{started:false,completed:false,stage:0,reaction:null,slalom:null,climb:null,sprint:null,playerPoints:{reaction:0,slalom:0,climb:0,sprint:0},totalPoints:0,rank:null,standings:[]},
          reception:{conversations:[],choices:{},overlookUnlocked:false,overlookSeen:false,overlookChoice:'',completed:false},
          fameAtArrival:'',
          completedAt:''
        },
        practiceQualifying:{
          started:false,
          completed:false,
          priority:'',
          practice:{
            completed:false,
            run1:null,
            run2:null,
            classification:[],
            setup:{frontResponse:54,stability:56,endurance:52,qualifyingTrim:48,confidence:58},
            diagnosis:{issue:'',choice:'',correct:false,completed:false},
            setupApplied:false
          },
          qualifying:{
            completed:false,
            run1:null,
            run2:null,
            run3:null,
            window:'',
            bestLapMs:0,
            position:null,
            grid:[],
            tyresePosition:null,
            tyreseLapMs:0,
            headline:'',
            completedAt:''
          },
          completedAt:''
        }
,
        raceWeekend:{
          started:false,
          completed:false,
          phase:'grid',
          startPosition:null,
          tyreseStart:null,
          currentPosition:null,
          teamOrder:'',
          battleChoice:'',
          finalCall:'',
          finalPosition:null,
          tyreseFinish:null,
          headline:'',
          narrative:'',
          badge:'',
          log:[],
          completedAt:''
        },
        afterFlag:{
          started:false,
          completed:false,
          weekendRecord:null,
          parcFerme:{visited:[],choices:{}},
          teamReaction:'',
          media:{currentQuestion:'',answers:[],profile:''},
          room:{inspected:[]},
          tyreseChoice:'',
          envelopeOpened:false,
          impactBefore:null,
          impactAfter:null,
          completedAt:''
        }
      },
      chapter7: {
        started:false,
        completed:false,
        startedAt:'',
        introStep:0,
        arrivalChoice:'',
        hq:{visited:[],overheard:[],required:3,boardCalled:false},
        review:{seen:[],completed:false},
        offer:{initialRole:'',role:'',length:2,podiumBonus:12000,sponsorDays:6,status:'draft',selectedDemands:[],acceptedDemands:[],rejectedDemands:[],negotiationRounds:0,countered:false},
        outsideInterest:{team:'Sunscale',discovered:false,response:''},
        tyreseChoice:'',
        decision:'',
        signed:false,
        signedAt:'',
        completedAt:''
      },
      chapter8: {
        started:false,
        completed:false,
        startedAt:'',
        calendar:{seen:[],ambition:''},
        weeklyPlan:{budget:6,allocations:{bond:0,flight:0,strength:0,engineering:0,recovery:0,sponsor:0},locked:false,profile:'',readiness:{pace:50,control:50,stamina:50,bond:50,team:50}},
        telemetry:{seen:[],attempts:0,choice:'',correct:false,completed:false,feedback:''},
        pitwall:{stage:0,score:0,choices:[],reviewing:false,completed:false,grade:'',lastResult:''},
        objectives:{selected:[],locked:false},
        raceMode:'',
        seasonHubUnlocked:false,
        championship:{
          currentRound:1,
          points:{player:0,tyrese:0,jalen:0,sofia:0,luka:0,ren:0,maya:0},
          rounds:{
            velmora:{status:'not-started',runId:'',presentationMode:'',strategy:'adaptive',qualifyingGrid:[],result:null,completedAt:''}
          }
        },
        completedAt:''
      },
      chapter3: {
        cantoAttitude: '',
        roomKeyReceived: false,
        corridorSeen: [],
        room: { wall: '', shelf: '', dragonCorner: '', firstDragonChoice: '' },
        eveningMoments: [],
        eveningResponses: {},
        duty: { type: '', score: 0, total: 5, perfect: false, completed: false },
        traits: { equipmentEye: false, teamReliable: false, dragonCareInstinct: false },
        freeRoamSeen: [],
        nightActions: [],
        dragonStoryBond: 0,
        journalUnlocked: false,
        memoryShelfUnlocked: false,
        morningNoticeSeen: false,
        blackglassInitialAttitude: ''
      },
      careerHub: { inboxRead: [] },
      careerEvolution: defaultCareerEvolution(),
      history: []
    };
  }

  function normaliseQuickquillStory(raw) {
    const fallback = defaultQuickquillStory();
    if (!raw || typeof raw !== 'object' || raw.id !== fallback.id) return fallback;
    if ((Number(raw.version) || 1) < fallback.version && !raw.completed?.prologue) return fallback;
    const rawChapter3 = raw.chapter3 && typeof raw.chapter3 === 'object' ? raw.chapter3 : {};
    const rawChapter4 = raw.chapter4 && typeof raw.chapter4 === 'object' ? raw.chapter4 : {};
    const rawChapter5 = raw.chapter5 && typeof raw.chapter5 === 'object' ? raw.chapter5 : {};
    const rawChapter6 = raw.chapter6 && typeof raw.chapter6 === 'object' ? raw.chapter6 : {};
    const rawChapter7 = raw.chapter7 && typeof raw.chapter7 === 'object' ? raw.chapter7 : {};
    const rawChapter8 = raw.chapter8 && typeof raw.chapter8 === 'object' ? raw.chapter8 : {};
    const story = {
      ...fallback,
      ...cloneValue(raw),
      version: fallback.version,
      completed: { ...fallback.completed, ...(raw.completed || {}), raceWeekend: !!(raw.completed?.raceWeekend), afterFlag: !!(raw.completed?.afterFlag), verdict: !!(raw.completed?.verdict), seasonOpening: !!(raw.completed?.seasonOpening) },
      identity: { ...fallback.identity, ...(raw.identity || {}) },
      relationships: { ...fallback.relationships, ...(raw.relationships || {}) },
      choices: { ...(raw.choices || {}) },
      race: { ...fallback.race, ...(raw.race || {}), result: raw.race?.result && typeof raw.race.result === 'object' ? { ...raw.race.result } : null },
      blackglassRace: { ...fallback.blackglassRace, ...(raw.blackglassRace || {}), result: raw.blackglassRace?.result && typeof raw.blackglassRace.result === 'object' ? { ...raw.blackglassRace.result } : null },
      chapter4: {
        ...fallback.chapter4,
        ...cloneValue(rawChapter4),
        qualifying: { ...fallback.chapter4.qualifying, ...(rawChapter4.qualifying || {}), grid: Array.isArray(rawChapter4.qualifying?.grid) ? rawChapter4.qualifying.grid.slice(0,6) : [] },
        paddockSeen: Array.isArray(rawChapter4.paddockSeen) ? rawChapter4.paddockSeen.slice(0,12) : [],
        studiedSections: Array.isArray(rawChapter4.studiedSections) ? rawChapter4.studiedSections.slice(0,2) : [],
        eveningMoments: Array.isArray(rawChapter4.eveningMoments) ? rawChapter4.eveningMoments.slice(0,2) : [],
        eveningResponses: { ...(rawChapter4.eveningResponses || {}) },
        roomActions: Array.isArray(rawChapter4.roomActions) ? rawChapter4.roomActions.slice(0,3) : [],
        raceMemory: Array.isArray(rawChapter4.raceMemory) ? rawChapter4.raceMemory.slice(-24) : [],
        afterHours: { ...fallback.chapter4.afterHours, ...(rawChapter4.afterHours || {}) }
      },
      chapter5: {
        ...fallback.chapter5,
        ...cloneValue(rawChapter5),
        simulator:{
          ...fallback.chapter5.simulator,
          ...(rawChapter5.simulator || {}),
          answers:Array.isArray(rawChapter5.simulator?.answers)?rawChapter5.simulator.answers.slice(0,6):[],
          metrics:{...fallback.chapter5.simulator.metrics,...(rawChapter5.simulator?.metrics || {})}
        },
        media:{
          ...fallback.chapter5.media,
          ...(rawChapter5.media || {}),
          answers:Array.isArray(rawChapter5.media?.answers)?rawChapter5.media.answers.slice(0,3):[],
          headlines:Array.isArray(rawChapter5.media?.headlines)?rawChapter5.media.headlines.slice(0,3):[],
          scores:{...fallback.chapter5.media.scores,...(rawChapter5.media?.scores || {})}
        },
        sofia:{...fallback.chapter5.sofia,...(rawChapter5.sofia || {})},
        freeTime:{
          ...fallback.chapter5.freeTime,
          ...(rawChapter5.freeTime || {}),
          activities:Array.isArray(rawChapter5.freeTime?.activities)?[...new Set(rawChapter5.freeTime.activities.map(String))].slice(0,3):[]
        }
      },
      chapter6:{
        ...fallback.chapter6,
        ...cloneValue(rawChapter6),
        crownWeek:{
          ...fallback.chapter6.crownWeek,
          ...(rawChapter6.crownWeek || {}),
          village:{
            ...fallback.chapter6.crownWeek.village,
            ...(rawChapter6.crownWeek?.village || {}),
            visited:Array.isArray(rawChapter6.crownWeek?.village?.visited)?[...new Set(rawChapter6.crownWeek.village.visited.map(String))].slice(0,12):[],
            encounters:Array.isArray(rawChapter6.crownWeek?.village?.encounters)?[...new Set(rawChapter6.crownWeek.village.encounters.map(String))].slice(0,8):[],
            encounterChoices:{...(rawChapter6.crownWeek?.village?.encounterChoices || {})},
            inboxRead:Array.isArray(rawChapter6.crownWeek?.village?.inboxRead)?[...new Set(rawChapter6.crownWeek.village.inboxRead.map(String))].slice(0,12):[]
          },
          challenge:{
            ...fallback.chapter6.crownWeek.challenge,
            ...(rawChapter6.crownWeek?.challenge || {}),
            playerPoints:{...fallback.chapter6.crownWeek.challenge.playerPoints,...(rawChapter6.crownWeek?.challenge?.playerPoints || {})},
            standings:Array.isArray(rawChapter6.crownWeek?.challenge?.standings)?rawChapter6.crownWeek.challenge.standings.slice(0,7).map(row=>({...row})):[]
          },
          reception:{
            ...fallback.chapter6.crownWeek.reception,
            ...(rawChapter6.crownWeek?.reception || {}),
            conversations:Array.isArray(rawChapter6.crownWeek?.reception?.conversations)?[...new Set(rawChapter6.crownWeek.reception.conversations.map(String))].slice(0,8):[],
            choices:{...(rawChapter6.crownWeek?.reception?.choices || {})}
          }
        },
        practiceQualifying:{
          ...fallback.chapter6.practiceQualifying,
          ...(rawChapter6.practiceQualifying || {}),
          practice:{
            ...fallback.chapter6.practiceQualifying.practice,
            ...(rawChapter6.practiceQualifying?.practice || {}),
            setup:{...fallback.chapter6.practiceQualifying.practice.setup,...(rawChapter6.practiceQualifying?.practice?.setup || {})},
            diagnosis:{...fallback.chapter6.practiceQualifying.practice.diagnosis,...(rawChapter6.practiceQualifying?.practice?.diagnosis || {})},
            classification:Array.isArray(rawChapter6.practiceQualifying?.practice?.classification)?rawChapter6.practiceQualifying.practice.classification.slice(0,7).map(row=>({...row})):[]
          },
          qualifying:{
            ...fallback.chapter6.practiceQualifying.qualifying,
            ...(rawChapter6.practiceQualifying?.qualifying || {}),
            grid:Array.isArray(rawChapter6.practiceQualifying?.qualifying?.grid)?rawChapter6.practiceQualifying.qualifying.grid.slice(0,7).map(row=>({...row})):[]
          }
        }
,
        raceWeekend:{
          ...fallback.chapter6.raceWeekend,
          ...(rawChapter6.raceWeekend || {}),
          log:Array.isArray(rawChapter6.raceWeekend?.log)?rawChapter6.raceWeekend.log.slice(0,16).map(row=>({...row})):[]
        },
        afterFlag:{
          ...fallback.chapter6.afterFlag,
          ...(rawChapter6.afterFlag || {}),
          weekendRecord:rawChapter6.afterFlag?.weekendRecord && typeof rawChapter6.afterFlag.weekendRecord==='object' ? cloneValue(rawChapter6.afterFlag.weekendRecord) : null,
          parcFerme:{...fallback.chapter6.afterFlag.parcFerme,...(rawChapter6.afterFlag?.parcFerme || {}),visited:Array.isArray(rawChapter6.afterFlag?.parcFerme?.visited)?[...new Set(rawChapter6.afterFlag.parcFerme.visited.map(String))].slice(0,5):[],choices:{...(rawChapter6.afterFlag?.parcFerme?.choices || {})}},
          media:{...fallback.chapter6.afterFlag.media,...(rawChapter6.afterFlag?.media || {}),answers:Array.isArray(rawChapter6.afterFlag?.media?.answers)?rawChapter6.afterFlag.media.answers.slice(0,2).map(row=>({...row})):[]},
          room:{...fallback.chapter6.afterFlag.room,...(rawChapter6.afterFlag?.room || {}),inspected:Array.isArray(rawChapter6.afterFlag?.room?.inspected)?[...new Set(rawChapter6.afterFlag.room.inspected.map(String))].slice(0,4):[]}
        }
      },
      chapter7:{
        ...fallback.chapter7,
        ...rawChapter7,
        hq:{...fallback.chapter7.hq,...(rawChapter7.hq||{}),visited:Array.isArray(rawChapter7.hq?.visited)?[...new Set(rawChapter7.hq.visited.map(String))].slice(0,8):[],overheard:Array.isArray(rawChapter7.hq?.overheard)?[...new Set(rawChapter7.hq.overheard.map(String))].slice(0,8):[]},
        review:{...fallback.chapter7.review,...(rawChapter7.review||{}),seen:Array.isArray(rawChapter7.review?.seen)?[...new Set(rawChapter7.review.seen.map(String))].slice(0,8):[]},
        offer:{...fallback.chapter7.offer,...(rawChapter7.offer||{}),selectedDemands:Array.isArray(rawChapter7.offer?.selectedDemands)?[...new Set(rawChapter7.offer.selectedDemands.map(String))].slice(0,2):[],acceptedDemands:Array.isArray(rawChapter7.offer?.acceptedDemands)?[...new Set(rawChapter7.offer.acceptedDemands.map(String))].slice(0,4):[],rejectedDemands:Array.isArray(rawChapter7.offer?.rejectedDemands)?[...new Set(rawChapter7.offer.rejectedDemands.map(String))].slice(0,4):[]},
        outsideInterest:{...fallback.chapter7.outsideInterest,...(rawChapter7.outsideInterest||{})}
      },
      chapter8:{
        ...fallback.chapter8,
        ...cloneValue(rawChapter8),
        calendar:{...fallback.chapter8.calendar,...(rawChapter8.calendar||{}),seen:Array.isArray(rawChapter8.calendar?.seen)?[...new Set(rawChapter8.calendar.seen.map(String))].slice(0,8):[]},
        weeklyPlan:{...fallback.chapter8.weeklyPlan,...(rawChapter8.weeklyPlan||{}),allocations:{...fallback.chapter8.weeklyPlan.allocations,...(rawChapter8.weeklyPlan?.allocations||{})},readiness:{...fallback.chapter8.weeklyPlan.readiness,...(rawChapter8.weeklyPlan?.readiness||{})}},
        telemetry:{...fallback.chapter8.telemetry,...(rawChapter8.telemetry||{}),seen:Array.isArray(rawChapter8.telemetry?.seen)?[...new Set(rawChapter8.telemetry.seen.map(String))].slice(0,4):[]},
        pitwall:{...fallback.chapter8.pitwall,...(rawChapter8.pitwall||{}),choices:Array.isArray(rawChapter8.pitwall?.choices)?rawChapter8.pitwall.choices.slice(0,5).map(row=>({...row})):[]},
        objectives:{...fallback.chapter8.objectives,...(rawChapter8.objectives||{}),selected:Array.isArray(rawChapter8.objectives?.selected)?[...new Set(rawChapter8.objectives.selected.map(String))].slice(0,3):[]},
        championship:{
          ...fallback.chapter8.championship,
          ...(rawChapter8.championship||{}),
          points:{...fallback.chapter8.championship.points,...(rawChapter8.championship?.points||{})},
          rounds:{
            ...fallback.chapter8.championship.rounds,
            ...(rawChapter8.championship?.rounds||{}),
            velmora:{
              ...fallback.chapter8.championship.rounds.velmora,
              ...(rawChapter8.championship?.rounds?.velmora||{}),
              qualifyingGrid:Array.isArray(rawChapter8.championship?.rounds?.velmora?.qualifyingGrid)?rawChapter8.championship.rounds.velmora.qualifyingGrid.slice(0,7).map(row=>({...row})):[],
              result:rawChapter8.championship?.rounds?.velmora?.result&&typeof rawChapter8.championship.rounds.velmora.result==='object'?cloneValue(rawChapter8.championship.rounds.velmora.result):null
            }
          }
        }
      },
      chapter3: {
        ...fallback.chapter3,
        ...cloneValue(rawChapter3),
        corridorSeen: Array.isArray(rawChapter3.corridorSeen) ? rawChapter3.corridorSeen.slice(0, 12) : [],
        room: { ...fallback.chapter3.room, ...(rawChapter3.room || {}) },
        eveningMoments: Array.isArray(rawChapter3.eveningMoments) ? rawChapter3.eveningMoments.slice(0, 2) : [],
        eveningResponses: { ...(rawChapter3.eveningResponses || {}) },
        duty: { ...fallback.chapter3.duty, ...(rawChapter3.duty || {}) },
        traits: { ...fallback.chapter3.traits, ...(rawChapter3.traits || {}) },
        freeRoamSeen: Array.isArray(rawChapter3.freeRoamSeen) ? rawChapter3.freeRoamSeen.slice(0, 12) : [],
        nightActions: Array.isArray(rawChapter3.nightActions) ? rawChapter3.nightActions.slice(0, 12) : []
      },
      careerHub: {
        ...fallback.careerHub,
        ...(raw.careerHub && typeof raw.careerHub === 'object' ? raw.careerHub : {}),
        inboxRead: Array.isArray(raw.careerHub?.inboxRead) ? [...new Set(raw.careerHub.inboxRead.map(String))].slice(-64) : []
      },
      careerEvolution: normaliseCareerEvolution(raw.careerEvolution),
      history: Array.isArray(raw.history) ? raw.history.slice(-100) : []
    };
    const sceneExists = ALL_QUICKQUILL_SCENES.some(scene => scene.id === story.scene);
    if (!sceneExists && !story.completed.prologue) {
      story.scene = 'q0';
      story.beat = 0;
    }
    story.beat = Math.max(0, Number(story.beat) || 0);
    const sourceVersion = Number(raw.version) || 1;
    if (sourceVersion < 6 && story.completed?.downtime) {
      story.completed = { ...(story.completed || {}), blackglass: false };
      story.chapter = 'blackglass';
      story.scene = 'q18';
      story.beat = 0;
      story.chapter4 = cloneValue(fallback.chapter4);
      story.blackglassRace = cloneValue(fallback.blackglassRace);
      story.history = [...(story.history || []), { scene:'q18', event:'blackglass-v34-18-rebuild-migration' }].slice(-100);
    }
    if (sourceVersion < 7 && story.completed?.downtime && !story.completed?.blackglass && !story.chapter4?.afterHours?.completed && ['q27','q28'].includes(story.scene)) {
      story.chapter = 'blackglass';
      story.scene = 'q26';
      story.beat = 3;
      story.history = [...(story.history || []), { scene:'q26', event:'blackglass-v34-18-3-after-hours-migration' }].slice(-100);
    }
    // V34.23 repair: a handful of completed Blackglass saves could present the
    // Chapter Five card through the older locked-card styling. Preserve the
    // explicit completion flag when present, and recover it only from strong
    // end-of-chapter evidence for older saves.
    if (!story.completed?.blackglass && blackglassChapterComplete(story)) {
      story.completed = { ...(story.completed || {}), blackglass: true };
      story.chapter = story.completed?.seat ? 'lumerre' : 'pressure';
      story.history = [...(story.history || []), { scene:'q31', event:'blackglass-completion-repair-v34-23' }].slice(-100);
    }
    // V34.26 Career Evolution migration is deliberately data-driven and
    // idempotent. Existing saves are rebuilt from their real Canto/Blackglass
    // results instead of inventing placements or asking the player to restart.
    syncCareerEvolution(story);
    return story;
  }

  function isCatAsthmaTester() {
    return accountKey(username()) === 'catasthma' && state.activeSave?.team_id === 'quickquill';
  }

  function testerReplayActive() {
    return !!(isCatAsthmaTester() && state.testerReplay?.active);
  }

  function testerReplayChapterDefinition(chapterId) {
    return TESTER_REPLAY_CHAPTERS.find(chapter => chapter.id === String(chapterId || '')) || null;
  }

  function setReplayCompletionGate(story, through) {
    const order = ['prologue','canto','downtime','blackglass','seat','crownWeek','practiceQualifying','raceWeekend','afterFlag','verdict','seasonOpening'];
    const completionIndex = Math.max(-1, order.indexOf(through));
    story.completed = { ...(story.completed || {}) };
    order.forEach((key, index) => { story.completed[key] = completionIndex >= 0 && index <= completionIndex; });
  }

  function prepareTesterReplayStory(chapterId, sourceStory) {
    const definition = testerReplayChapterDefinition(chapterId);
    if (!definition) return null;
    const defaults = defaultQuickquillStory();
    let replay = normaliseQuickquillStory(cloneValue(sourceStory || defaults));

    // Replay is intentionally isolated from the live career. Prerequisite
    // completion flags are staged only inside this temporary copy so every
    // implemented chapter can be launched regardless of the live save state.
    if (chapterId === 'prologue') {
      replay = normaliseQuickquillStory(cloneValue(defaults));
      replay.scene = 'q0';
      replay.chapter = 'prologue';
      replay.beat = 0;
      setReplayCompletionGate(replay, '');
    } else if (chapterId === 'canto') {
      setReplayCompletionGate(replay, 'prologue');
      replay.chapter = 'race-one'; replay.scene = 'q4'; replay.beat = 0;
      replay.race = cloneValue(defaults.race);
      replay.chapter3 = cloneValue(defaults.chapter3);
      replay.chapter4 = cloneValue(defaults.chapter4);
      replay.blackglassRace = cloneValue(defaults.blackglassRace);
      replay.chapter5 = cloneValue(defaults.chapter5);
      replay.chapter6 = cloneValue(defaults.chapter6);
    } else if (chapterId === 'downtime') {
      setReplayCompletionGate(replay, 'canto');
      replay.chapter = 'downtime'; replay.scene = 'q9'; replay.beat = 0;
      replay.chapter3 = cloneValue(defaults.chapter3);
      replay.chapter4 = cloneValue(defaults.chapter4);
      replay.blackglassRace = cloneValue(defaults.blackglassRace);
      replay.chapter5 = cloneValue(defaults.chapter5);
      replay.chapter6 = cloneValue(defaults.chapter6);
    } else if (chapterId === 'blackglass') {
      setReplayCompletionGate(replay, 'downtime');
      replay.chapter = 'blackglass'; replay.scene = 'q18'; replay.beat = 0;
      replay.chapter4 = cloneValue(defaults.chapter4);
      replay.blackglassRace = cloneValue(defaults.blackglassRace);
      replay.chapter5 = cloneValue(defaults.chapter5);
      replay.chapter6 = cloneValue(defaults.chapter6);
    } else if (chapterId === 'seat') {
      setReplayCompletionGate(replay, 'blackglass');
      replay.chapter = 'seat'; replay.scene = 'q32'; replay.beat = 0;
      replay.chapter5 = cloneValue(defaults.chapter5);
      replay.chapter6 = cloneValue(defaults.chapter6);
    } else if (chapterId === 'crown-week') {
      setReplayCompletionGate(replay, 'seat');
      replay.chapter = 'lumerre-crown-week'; replay.scene = 'q40'; replay.beat = 0;
      replay.chapter6 = cloneValue(defaults.chapter6);
      replay.chapter6.crownWeek.started = true;
      replay.chapter6.crownWeek.fameAtArrival = syncCareerEvolution(replay).reputation?.fame || 0;
    } else if (chapterId === 'practice') {
      setReplayCompletionGate(replay, 'crownWeek');
      replay.chapter = 'lumerre-practice'; replay.scene = 'q46'; replay.beat = 0;
      replay.chapter6 = { ...replay.chapter6, practiceQualifying:cloneValue(defaults.chapter6.practiceQualifying) };
      replay.chapter6.practiceQualifying.started = true;
    }
    else if (chapterId === 'race-day') {
      setReplayCompletionGate(replay, 'practiceQualifying');
      replay.chapter = 'lumerre-race-day'; replay.scene = 'q56'; replay.beat = 0;
      replay.chapter6 = { ...replay.chapter6, practiceQualifying:cloneValue(defaults.chapter6.practiceQualifying), raceWeekend:cloneValue(defaults.chapter6.raceWeekend) };
      replay.completed.practiceQualifying = true;
      replay.chapter6.practiceQualifying.completed = true;
      replay.chapter6.practiceQualifying.qualifying.position = 2;
      replay.chapter6.practiceQualifying.qualifying.tyresePosition = 3;
      replay.chapter6.practiceQualifying.qualifying.bestLapMs = 81754;
      replay.chapter6.raceWeekend.started = true;
    }
    else if (chapterId === 'after-flag') {
      setReplayCompletionGate(replay, 'raceWeekend');
      replay.chapter = 'lumerre-after-flag'; replay.scene = 'q57'; replay.beat = 0;
      replay.chapter6 = { ...replay.chapter6, afterFlag:cloneValue(defaults.chapter6.afterFlag), raceWeekend:{...cloneValue(defaults.chapter6.raceWeekend),started:true,completed:true,phase:'result',startPosition:2,finalPosition:2,tyreseFinish:3,teamOrder:'obey',liveOrder:['jalen','player','tyrese','ren','sofia','luka','maya']} };
      replay.completed.raceWeekend = true;
      replay.chapter6.afterFlag.started = true;
      replay.chapter6.afterFlag.weekendRecord = lumerreWeekendRecord(replay);
    }
    else if (chapterId === 'verdict') {
      setReplayCompletionGate(replay, 'afterFlag');
      replay.chapter = 'verdict'; replay.scene = 'q66'; replay.beat = 0;
      replay.chapter6 = { ...replay.chapter6, afterFlag:{...cloneValue(defaults.chapter6.afterFlag),started:true,completed:true,weekendRecord:{qualifyingPosition:2,raceStartPosition:2,raceFinishPosition:2,positionsGained:0,playerOvertakes:3,tyreseFinish:3,jalenFinish:1,teamOrderChoice:'obey',firstCareerWin:false,notableMoment:'Held position under pressure at Lumerre.'}} };
      replay.chapter7 = cloneValue(defaults.chapter7);
      replay.completed.afterFlag = true;
    }
    else if (chapterId === 'season') {
      setReplayCompletionGate(replay, 'verdict');
      replay.chapter = 'season-one'; replay.scene = 'q75'; replay.beat = 0;
      replay.chapter7 = {...cloneValue(defaults.chapter7),started:true,completed:true,decision:'sign',signed:true,offer:{...cloneValue(defaults.chapter7.offer),status:'signed'}};
      replay.chapter8 = cloneValue(defaults.chapter8);
      replay.completed.verdict = true;
    }

    // Remove completion-repair evidence from the temporary replay copy. In
    // particular, older Blackglass recovery logic intentionally recognises
    // historic finish records; QA replay must not let those records jump the
    // tester straight back to a completed screen.
    replay.history = [{ scene:definition.scene, event:'catasthma-tester-replay-start', chapterId:definition.id, at:new Date().toISOString() }];
    const prepared = normaliseQuickquillStory(replay);
    // Re-apply the temporary gate after normalisation as a final safeguard.
    if (chapterId === 'prologue') setReplayCompletionGate(prepared, '');
    else if (chapterId === 'canto') setReplayCompletionGate(prepared, 'prologue');
    else if (chapterId === 'downtime') setReplayCompletionGate(prepared, 'canto');
    else if (chapterId === 'blackglass') setReplayCompletionGate(prepared, 'downtime');
    else if (chapterId === 'seat') setReplayCompletionGate(prepared, 'blackglass');
    else if (chapterId === 'crown-week') setReplayCompletionGate(prepared, 'seat');
    else if (chapterId === 'practice') setReplayCompletionGate(prepared, 'crownWeek');
    else if (chapterId === 'race-day') setReplayCompletionGate(prepared, 'practiceQualifying');
    else if (chapterId === 'after-flag') setReplayCompletionGate(prepared, 'raceWeekend');
    else if (chapterId === 'verdict') setReplayCompletionGate(prepared, 'afterFlag');
    else if (chapterId === 'season') setReplayCompletionGate(prepared, 'verdict');
    prepared.scene = definition.scene;
    prepared.beat = 0;
    return prepared;
  }

  function clearStoryTransientState() {
    stopAfterHoursGameplay(true);
    clearCrownChallengeTimers();
    clearLumerreQualifyingTimers();
    state.downtimeActivity = '';
    state.downtimeMessage = '';
    state.blackglassActivity = '';
    state.blackglassMessage = '';
    state.afterHoursGame = null;
    state.seatMediaReporter = '';
    state.seatTransient = '';
    state.crownEncounterId = '';
    state.crownReceptionId = '';
    state.crownWeekView = '';
    state.crownTransient = '';
    state.crownChallengeLive = null;
    state.lumerrePracticeView = '';
    state.lumerrePracticeTransient = '';
    state.lumerreQualifyingLive = null;
    state.lumerreRaceTransient = '';
    state.lumerreRaceRuntime = null;
    state.afterFlagTransient = '';
    state.afterFlagModal = '';
    state.verdictTransient = '';
    state.verdictModal = '';
    state.seasonView = '';
    state.seasonControlTab = 'weekend';
    state.seasonTransient = '';
    state.dutySession = null;
    state.freeRoamMugClicks = 0;
  }

  function restoreTesterReplaySnapshot({ destination = 'story-journey', renderNow = true } = {}) {
    if (!state.testerReplay?.active) return false;
    const snapshot = cloneValue(state.testerReplay.snapshot || activeSaveState().story || defaultQuickquillStory());
    const chapter = testerReplayChapterDefinition(state.testerReplay.chapterId);
    state.testerReplay = null;
    clearStoryTransientState();
    state.story = normaliseQuickquillStory(snapshot);
    state.storySaving = false;
    state.storyError = '';
    state.transitionLocked = false;
    state.blackout = false;
    state.mode = destination;
    state.status = `QA replay ended${chapter ? ` · ${chapter.label}` : ''} · live save restored`;
    if (renderNow) {
      render();
      syncMusic({ restart:true });
    }
    return true;
  }

  function beginTesterReplay(chapterId) {
    if (!isCatAsthmaTester() || state.storySaving || state.transitionLocked) return;
    const definition = testerReplayChapterDefinition(chapterId);
    if (!definition) return;

    // If another QA replay is already active, always base the next launch on
    // the original live snapshot rather than stacking temporary test state.
    const liveStory = state.testerReplay?.active
      ? cloneValue(state.testerReplay.snapshot)
      : cloneValue(state.story || activeSaveState().story || defaultQuickquillStory());
    const replay = prepareTesterReplayStory(definition.id, liveStory);
    if (!replay) return;

    state.testerReplay = {
      active:true,
      chapterId:definition.id,
      snapshot:liveStory,
      startedAt:new Date().toISOString()
    };
    clearStoryTransientState();
    state.story = replay;
    state.mode = 'story';
    state.storyError = '';
    state.status = `CatAsthma QA replay · ${definition.label} · changes will NOT save`;
    playTone(470);
    render();
    syncMusic({ restart:true });
  }

  function testerReplayHudMarkup() {
    if (!testerReplayActive()) return '';
    const chapter = testerReplayChapterDefinition(state.testerReplay?.chapterId);
    return `<aside class="tester-replay-hud" role="status"><div><small>CATASTHMA QA · NON-DESTRUCTIVE REPLAY</small><strong>${escapeHtml(chapter?.label || 'Chapter replay')}</strong><span>Cloud save locked · all test choices are temporary</span></div><button type="button" data-tester-replay-exit>RESTORE LIVE SAVE</button></aside>`;
  }

  function ensureTesterReplayHud() {
    root.querySelector('.tester-replay-hud')?.remove();
    if (!testerReplayActive() || state.mode !== 'story') return;
    root.insertAdjacentHTML('beforeend', testerReplayHudMarkup());
    root.querySelector('[data-tester-replay-exit]')?.addEventListener('click', event => {
      event.stopPropagation();
      restoreTesterReplaySnapshot({ destination:'story-journey' });
    });
  }

  function activeSaveState() {
    const value = state.activeSave?.state;
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function activeStoryScene(story = state.story) {
    return ALL_QUICKQUILL_SCENES.find(scene => scene.id === story?.scene) || QUICKQUILL_SCENES[0];
  }

  function storyDragonName() {
    return careerDragon(state.activeSave)?.name || 'your dragon';
  }

  function storyResultBand(story = state.story) {
    const rank = Math.max(1, Math.min(6, Number(story?.race?.result?.rank) || 6));
    return rank === 1 ? 'win' : rank <= 3 ? 'podium' : rank <= 5 ? 'midfield' : 'last';
  }

  function storyRaceTime(story = state.story) {
    const ms = Math.max(0, Number(story?.race?.result?.finishMs) || 0);
    const minutes = Math.floor(ms / 60000), seconds = Math.floor((ms % 60000) / 1000), hundredths = Math.floor((ms % 1000) / 10);
    return ms ? `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(hundredths).padStart(2,'0')}` : '—';
  }

  function isDowntimeScene(story = state.story) {
    return QUICKQUILL_DOWNTIME_SCENES.some(scene => scene.id === story?.scene);
  }

  function chapter3State(story = state.story) {
    return story?.chapter3 || defaultQuickquillStory().chapter3;
  }

  function isBlackglassScene(story = state.story) {
    return QUICKQUILL_BLACKGLASS_SCENES.some(scene => scene.id === story?.scene);
  }

  function chapter4State(story = state.story) {
    return story?.chapter4 || defaultQuickquillStory().chapter4;
  }

  function blackglassChapterComplete(story = state.story) {
    if (story?.completed?.blackglass === true) return true;
    const history = Array.isArray(story?.history) ? story.history : [];
    if (history.some(entry => entry?.event === 'blackglass-chapter-complete')) return true;
    const finalScene = QUICKQUILL_BLACKGLASS_SCENES[QUICKQUILL_BLACKGLASS_SCENES.length - 1];
    const finalBeat = Math.max(0, Number(finalScene?.beats?.length || 1) - 1);
    return story?.scene === finalScene?.id
      && Number(story?.beat || 0) >= finalBeat
      && story?.blackglassRace?.status === 'complete'
      && !!story?.blackglassRace?.result;
  }

  function isSeatScene(story = state.story) {
    return QUICKQUILL_SEAT_SCENES.some(scene => scene.id === story?.scene);
  }

  function chapter5State(story = state.story) {
    return story?.chapter5 || defaultQuickquillStory().chapter5;
  }

  function isCrownWeekScene(story = state.story) {
    return QUICKQUILL_CROWN_WEEK_SCENES.some(scene => scene.id === story?.scene);
  }

  function chapter6State(story = state.story) {
    return story?.chapter6 || defaultQuickquillStory().chapter6;
  }

  function crownWeekState(story = state.story) {
    return chapter6State(story).crownWeek || defaultQuickquillStory().chapter6.crownWeek;
  }

  function isLumerrePracticeScene(story = state.story) {
    return QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(scene => scene.id === story?.scene);
  }

  function practiceQualifyingState(story = state.story) {
    return chapter6State(story).practiceQualifying || defaultQuickquillStory().chapter6.practiceQualifying;
  }

  function lumerreRaceDayState(story = state.story) {
    return chapter6State(story).raceWeekend || defaultQuickquillStory().chapter6.raceWeekend;
  }


  function crownFameBand(story = state.story) {
    const fame = Number(syncCareerEvolution(story).reputation?.fame) || 0;
    if (fame >= 42) return 'rising';
    if (fame >= 25) return 'recognisable';
    if (fame >= 12) return 'curiosity';
    return 'unknown';
  }

  function applyCareerEvolutionEffects(story, effects = {}) {
    if (!story || !effects || typeof effects !== 'object') return;
    const evolution = syncCareerEvolution(story);
    Object.entries(effects.reputation || {}).forEach(([key, delta]) => {
      if (!(key in evolution.reputation)) return;
      evolution.reputation[key] = clampCareerValue((Number(evolution.reputation[key]) || 0) + Number(delta || 0));
    });
    Object.entries(effects.racecraft || {}).forEach(([key, delta]) => {
      if (!(key in evolution.racecraft)) return;
      evolution.racecraft[key] = clampCareerValue((Number(evolution.racecraft[key]) || 0) + Number(delta || 0));
    });
    Object.entries(effects.tyrese || {}).forEach(([key, delta]) => {
      if (!(key in evolution.tyrese)) return;
      if (['friendship','professionalRespect','competitiveTension'].includes(key)) evolution.tyrese[key] = clampCareerValue((Number(evolution.tyrese[key]) || 0) + Number(delta || 0));
      else evolution.tyrese[key] = Math.max(0, (Number(evolution.tyrese[key]) || 0) + Number(delta || 0));
    });
    Object.entries(effects.rivalries || {}).forEach(([id, changes]) => {
      if (!evolution.rivalries[id] || !changes || typeof changes !== 'object') return;
      Object.entries(changes).forEach(([key, delta]) => {
        if (!(key in evolution.rivalries[id])) return;
        if (['intensity','respect'].includes(key)) evolution.rivalries[id][key] = clampCareerValue((Number(evolution.rivalries[id][key]) || 0) + Number(delta || 0));
        else if (typeof evolution.rivalries[id][key] === 'number') evolution.rivalries[id][key] = Math.max(0, (Number(evolution.rivalries[id][key]) || 0) + Number(delta || 0));
      });
    });
    evolution.careerPhase = deriveCareerPhase(evolution);
    evolution.fameTier = deriveFameTier(evolution);
    evolution.playerStyle = deriveCareerRacingStyle(story, evolution);
    story.careerEvolution = evolution;
  }

  function crownVillageEncounterDirector(story = state.story) {
    const evolution = syncCareerEvolution(story);
    const c5 = chapter5State(story);
    const picked = ['tyrese'];
    const jalen = evolution.rivalries?.jalen || defaultCareerRivalry();
    const sofia = evolution.rivalries?.sofia || defaultCareerRivalry();
    if ((Number(jalen.intensity)||0) + (Number(story?.relationships?.jalenHeat)||0) >= (Number(sofia.intensity)||0) + 5) picked.push('jalen');
    else if (c5.sofia?.discovered || c5.sofia?.reply || (Number(sofia.respect)||0) > 0) picked.push('sofia');
    else picked.push('jalen');
    const world = careerWorldReactionConfig(story);
    if (world.autographMoments) picked.push('fan');
    else if (world.fanRecognition || (Number(evolution.reputation?.media)||0) >= 8) picked.push('media');
    else picked.push('nell');
    const identity = careerIdentity(story).key;
    const final = identity === 'fire' ? 'luka' : identity === 'focus' ? 'ren' : 'maya';
    if (!picked.includes(final)) picked.push(final);
    if (!picked.includes('nell') && picked.length < 5) picked.push('nell');
    return [...new Set(picked)].slice(0,5);
  }

  function crownVillageMessages(story = state.story) {
    const world = careerWorldReactionConfig(story);
    return [
      {id:'mara',from:'MARA VENN',time:'11:42',text:'Media route is optional until 13:00. If you choose to use it, use it deliberately.'},
      {id:'tyrese',from:'TYRESE BELL',time:'11:51',text:'If Mara asks, I am definitely at the sponsor pavilion and not behind the Quickquill equipment cases.'},
      {id:'nell',from:'NELL WREN',time:'12:03',text:'There is an adjustable timing gate on the east promenade. This is more interesting than lunch.'},
      ...(world.autographMoments ? [{id:'media',from:'CROWN WEEK MEDIA',time:'12:14',text:`Public-interest note: requests mentioning ${storyDragonName()} are above the rookie-session forecast.`}] : [])
    ];
  }

  function crownRumourForStory(story = state.story) {
    const evolution = syncCareerEvolution(story);
    const media = Number(evolution.reputation?.media)||0;
    const tension = Number(evolution.tyrese?.competitiveTension)||0;
    if (tension >= 12) return {id:'number-one',label:'PADDOCK RUMOUR',text:'Quickquill are already being asked whether Tyrese Bell remains the undisputed number one. The team has declined to discuss hierarchy.'};
    if (media >= 10 || chapter5State(story).sofia?.discovered) return {id:'other-teams',label:'PADDOCK RUMOUR',text:'At least one rival team is reportedly monitoring Quickquill’s three-race assessment. Nobody agrees on which team.'};
    return {id:'extension',label:'PADDOCK RUMOUR',text:'Quickquill may be preparing a contract extension framework before the Lumerre weekend is complete. The team has not confirmed this.'};
  }

  function crownChallengeOpponentId(story = state.story) {
    const evolution = syncCareerEvolution(story);
    if ((Number(evolution.tyrese?.competitiveTension)||0) >= 14) return 'tyrese';
    const candidates = ['jalen','sofia','luka','ren','maya'];
    candidates.sort((a,b) => (Number(evolution.rivalries?.[b]?.intensity)||0) - (Number(evolution.rivalries?.[a]?.intensity)||0));
    const best = candidates[0];
    return (Number(evolution.rivalries?.[best]?.intensity)||0) >= 4 ? best : 'ren';
  }

  function crownChallengeStandings(story = state.story, playerPointsOverride = null) {
    const challenge = crownWeekState(story).challenge || {};
    const points = playerPointsOverride || challenge.playerPoints || {};
    const ids = ['jalen','sofia','luka','tyrese','ren','maya'];
    const rows = ids.map(id => ({id,name:CAREER_RACER_AI[id].name,team:CAREER_RACER_AI[id].team,points:Object.keys(CROWN_CHALLENGE_AI_POINTS).reduce((sum,event)=>sum+(Number(CROWN_CHALLENGE_AI_POINTS[event][id])||0),0)}));
    const playerTotal = ['reaction','slalom','climb','sprint'].reduce((sum,key)=>sum+(Number(points[key])||0),0);
    rows.push({id:'player',name:storyDragonName(),team:'Quickquill',points:playerTotal});
    rows.sort((a,b) => b.points-a.points || a.name.localeCompare(b.name));
    return rows.map((row,index)=>({...row,rank:index+1}));
  }

  function crownReceptionDirector(story = state.story) {
    const challenge = crownWeekState(story).challenge || {};
    const opponent = challenge.sprint?.opponentId || crownChallengeOpponentId(story);
    const pool = ['mara','tyrese','nell'];
    const evolution = syncCareerEvolution(story);
    const jalenIntensity = Number(evolution.rivalries?.jalen?.intensity)||0;
    const sofiaRespect = Number(evolution.rivalries?.sofia?.respect)||0;
    pool.push(jalenIntensity >= 4 ? 'jalen' : sofiaRespect >= 2 ? 'sofia' : 'jalen');
    if (opponent && CROWN_RECEPTION_CONVERSATIONS[opponent] && !pool.includes(opponent)) pool.push(opponent);
    if (!pool.includes('maya')) pool.push('maya');
    return [...new Set(pool)].slice(0,6);
  }

  function crownChallengeRankLabel(story = state.story) {
    const rank = Number(crownWeekState(story).challenge?.rank);
    return rank ? ordinal(rank) : '—';
  }

  function clampSeatMetric(value) {
    return Math.max(12, Math.min(88, Number(value) || 50));
  }

  function deriveSeatSimulatorProfile(story = state.story) {
    const metrics = chapter5State(story).simulator?.metrics || {};
    const r=Number(metrics.reading)||50, e=Number(metrics.energy)||50, a=Number(metrics.aggression)||50, t=Number(metrics.team)||50;
    if (t >= 64 && r >= 58) return 'TEAM TACTICIAN';
    if (a >= 66 && r >= 58) return 'CALCULATED ATTACKER';
    if (e >= 66 && r >= 58) return 'PATIENT OPPORTUNIST';
    if (a >= 68) return 'INSTINCTIVE RACER';
    if (e >= 68) return 'ENERGY MANAGER';
    if (r >= 67) return 'PRESSURE READER';
    if (t >= 64) return 'TEAM OPERATOR';
    return 'BALANCED RACER';
  }

  function deriveMediaReputation(story = state.story) {
    const scores = chapter5State(story).media?.scores || {};
    const entries=[['confidence',Number(scores.confidence)||0],['team',Number(scores.team)||0],['candid',Number(scores.candid)||0],['edge',Number(scores.edge)||0]].sort((a,b)=>b[1]-a[1]);
    if (!entries.some(([, value]) => value > 0)) return 'UNESTABLISHED';
    return ({confidence:'COMPOSED CONTENDER',team:'TEAM VOICE',candid:'CANDID PROFESSIONAL',edge:'HEADLINE MAKER'})[entries[0]?.[0]] || 'MEASURED';
  }

  function deriveLumerreRole(story = state.story) {
    const c5=chapter5State(story), m=c5.simulator?.metrics || {};
    const attack=(Number(m.aggression)||50) + (c5.developmentPriority==='attack'?10:0);
    const team=(Number(m.team)||50) + (Number(story?.relationships?.quickquillTrust)||50)/4;
    const control=(Number(m.reading)||50) + (c5.developmentPriority==='control'?10:0);
    const efficiency=(Number(m.energy)||50) + (c5.developmentPriority==='efficiency'?10:0);
    if (attack >= Math.max(team,control,efficiency)+5) return 'THE HUNTER';
    if (team >= Math.max(attack,control,efficiency)+4) return 'THE TACTICIAN';
    if (efficiency >= Math.max(attack,team,control)+3 || control >= 67) return 'THE ANCHOR';
    return 'THE WILD CARD';
  }

  function seatIncidentId(story = state.story) {
    const saved=chapter5State(story).freeTime?.eventId;
    if (saved) return saved;
    const seed=(String(username()).split('').reduce((sum,ch)=>sum+ch.charCodeAt(0),0)+(Number(story?.blackglassRace?.result?.rank)||3)*7)%SEAT_HQ_EVENTS.length;
    return SEAT_HQ_EVENTS[seed]?.id || SEAT_HQ_EVENTS[0].id;
  }

  function seatMediaHeadline(reporterId, toneId) {
    const dragon=storyDragonName();
    const table={
      'sporting-post':{
        confident:`${dragon.toUpperCase()}: “BLACKGLASS WAS NOT A ONE-OFF”`,team:'QUICKQUILL ROOKIE CREDITS TEAM AFTER BLACKGLASS',honest:'ROOKIE: “I AM STILL LEARNING WHAT THIS LEVEL COSTS”',deflect:'QUICKQUILL RACER REFUSES TO DECLARE BLACKGLASS A BREAKTHROUGH',joke:'BLACKGLASS? “I MOSTLY REMEMBER THE RAIN.”',challenge:'ROOKIE PUSHES BACK: “ONE RACE DOES NOT PROVE ANYTHING”'
      },
      gridline:{
        confident:'NO TEAM ORDERS? QUICKQUILL ROOKIE SAYS THE RACE WAS THEIRS TO READ',team:'“TYRESE HELPED ME GET HERE.” — ROOKIE PRAISES CAPTAIN',honest:'QUICKQUILL RACER ADMITS TEAM CONTEXT SHAPED BLACKGLASS',deflect:'TEAM-ORDER QUESTION GETS NO ANSWER FROM QUICKQUILL',joke:'“TYRESE ORDERS TEA. MARA ORDERS EVERYTHING ELSE.”',challenge:'ROOKIE REJECTS TEAM-ORDERS FRAMING'
      },
      'lumerre-daily':{
        confident:'QUICKQUILL ROOKIE TARGETS LUMERRE PODIUM',team:'“THE TEAM NEEDS A RESULT, NOT A PREDICTION.”',honest:'ROOKIE: “LUMERRE IS A DIFFERENT QUESTION.”',deflect:'NO PODIUM PREDICTION FROM QUICKQUILL',joke:'“I HAVE NOT EVEN FOUND THE HOTEL YET.”',challenge:'ROOKIE: “EXPECTATION IS NOT A LAP TIME.”'
      },
      paddock:{
        confident:'RISING QUICKQUILL RACER UNFAZED BY RIVAL INTEREST',team:'“I RACE FOR QUICKQUILL.” — MESSAGE TO PADDOCK',honest:'ROOKIE ACKNOWLEDGES OTHER TEAMS ARE WATCHING',deflect:'TRANSFER TALK SHUT DOWN BEFORE LUMERRE',joke:'“THEY CAN MONITOR MY TEA ORDER TOO.”',challenge:'QUICKQUILL RACER QUESTIONS TRANSFER-SPECULATION TIMING'
      },
      flightline:{
        confident:`“${dragon.toUpperCase()} CAN HANDLE THIS LEVEL.”`,team:`ROOKIE PUTS ${dragon.toUpperCase()} AT CENTRE OF QUICKQUILL RISE`,honest:`“MOST OF THE BRAVE PART BELONGS TO ${dragon.toUpperCase()}.”`,deflect:'QUICKQUILL RACER DODGES CREDIT QUESTION',joke:`“${dragon.toUpperCase()} ACCEPTS PAYMENT IN SNACKS.”`,challenge:'ROOKIE REJECTS IDEA THAT DRAGON AND RACER CAN BE SEPARATED'
      }
    };
    return table[reporterId]?.[toneId] || 'QUICKQUILL ROOKIE FACES THE PRESS';
  }

  function blackglassResultBand(story = state.story) {
    const rank = Math.max(1, Math.min(6, Number(story?.blackglassRace?.result?.rank) || 6));
    return rank === 1 ? 'win' : rank <= 3 ? 'podium' : rank <= 5 ? 'midfield' : 'last';
  }

  function blackglassRaceTime(story = state.story) {
    const ms = Math.max(0, Number(story?.blackglassRace?.result?.finishMs) || 0);
    const minutes = Math.floor(ms / 60000), seconds = Math.floor((ms % 60000) / 1000), hundredths = Math.floor((ms % 1000) / 10);
    return ms ? `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(hundredths).padStart(2,'0')}` : '—';
  }

  function blackglassStandingBand(story = state.story) {
    const c4 = chapter4State(story);
    const score = (Number(c4.reputation)||0) + Math.round((Number(story?.relationships?.stewardRespect)||0)/2) + Math.round((Number(story?.relationships?.rookRespect)||0)/3);
    return score >= 5 ? 'respected' : score <= -1 ? 'cold' : 'neutral';
  }

  function blackglassQualifyingBand(story = state.story) {
    const position = Math.max(1, Math.min(6, Number(chapter4State(story).qualifying?.position)||6));
    return position === 1 ? 'pole' : position <= 2 ? 'front' : position <= 4 ? 'mid' : 'back';
  }

  function blackglassStudiedText(story = state.story) {
    const selected = chapter4State(story).studiedSections || [];
    const names = selected.map(id => BLACKGLASS_SECTION_DEFS.find(section => section.id === id)?.name).filter(Boolean);
    return names.length === 2 ? `${names[0]} and ${names[1]}` : names[0] || 'No deep-study sections yet';
  }

  function blackglassDragonStateLabel(story = state.story) {
    const value = String(chapter4State(story).dragonState || 'steady');
    return ({settled:'Settled',sharp:'Sharp',rested:'Rested',steady:'Steady'})[value] || 'Steady';
  }

  function ordinal(value) {
    const n = Math.max(1, Math.min(99, Number(value) || 1));
    const mod100 = n % 100;
    const suffix = mod100 >= 11 && mod100 <= 13 ? 'TH' : n % 10 === 1 ? 'ST' : n % 10 === 2 ? 'ND' : n % 10 === 3 ? 'RD' : 'TH';
    return `${n}${suffix}`;
  }

  function storyCopy(value) {
    return String(value || '')
      .replaceAll('[PLAYER_DRAGON]', storyDragonName())
      .replaceAll('[ACCOUNT_NAME]', username())
      .replaceAll('[RACE_POSITION]', state.story?.race?.result?.rank ? `${state.story.race.result.rank}${state.story.race.result.rank===1?'ST':state.story.race.result.rank===2?'ND':state.story.race.result.rank===3?'RD':'TH'}` : 'RESULT')
      .replaceAll('[RACE_TIME]', storyRaceTime())
      .replaceAll('[OVERTAKES]', String(Math.max(0, Number(state.story?.race?.result?.overtakes) || 0)))
      .replaceAll('[BLACKGLASS_POSITION]', state.story?.blackglassRace?.result?.rank ? ordinal(state.story.blackglassRace.result.rank) : 'RESULT')
      .replaceAll('[BLACKGLASS_TIME]', blackglassRaceTime())
      .replaceAll('[BLACKGLASS_OVERTAKES]', String(Math.max(0, Number(state.story?.blackglassRace?.result?.overtakes) || 0)))
      .replaceAll('[BLACKGLASS_MOMENT]', String(state.story?.blackglassRace?.result?.notableMoment || 'the finish'))
      .replaceAll('[QUALIFYING_POSITION]', ordinal(chapter4State().qualifying?.position || 3))
      .replaceAll('[STUDIED_SECTIONS]', blackglassStudiedText())
      .replaceAll('[BLACKGLASS_STANDING]', blackglassStandingBand().toUpperCase())
      .replaceAll('[DRAGON_STATE]', blackglassDragonStateLabel())
      .replaceAll('[AFTER_HOURS_MEMORY]', chapter4State().afterHours?.memory ? `Memory: ${chapter4State().afterHours.memory}.` : '')
      .replaceAll('[AFTER_HOURS_NOTE]', chapter4State().afterHours?.timingFound ? `And somehow you have an unofficial midnight note on ${BLACKGLASS_SECTION_DEFS.find(section=>section.id===chapter4State().afterHours?.bonusSection)?.name || 'one extra sector'}.` : '')
      .replaceAll('[GARRAN_AFTER_HOURS]', chapter4State().afterHours?.caught ? 'Also: your athlete has already completed one unscheduled event today.' : chapter4State().afterHours?.passReturned ? 'Also: thank you to whoever returned the venue pass. I am choosing not to investigate why it was found after midnight.' : '')
      .replaceAll('[SEAT_PROFILE]', chapter5State().simulator?.profile || deriveSeatSimulatorProfile())
      .replaceAll('[DEVELOPMENT_PRIORITY]', String(chapter5State().developmentPriority || 'control').toUpperCase())
      .replaceAll('[MEDIA_REPUTATION]', chapter5State().media?.reputation || deriveMediaReputation())
      .replaceAll('[LUMERRE_ROLE]', chapter5State().lumerreRole || deriveLumerreRole())
      .replaceAll('[CROWN_CHALLENGE_RANK]', crownChallengeRankLabel())
      .replaceAll('[FAME_TIER]', syncCareerEvolution(state.story || defaultQuickquillStory()).fameTier || 'Unknown')
      .replaceAll('[LUMERRE_QUALIFYING_POSITION]', lumerreQualifyingPositionLabel())
      .replaceAll('[LUMERRE_QUALIFYING_TIME]', formatStoryLap(practiceQualifyingState().qualifying?.bestLapMs || 0))
      .replaceAll('[LUMERRE_QUALIFYING_HEADLINE]', qualifyingHeadlineFor(practiceQualifyingState().qualifying?.position || 7))
      .replaceAll('[LUMERRE_NELL_LINE]', lumerreQualifyingNellLine())
      .replaceAll('[LUMERRE_TYRESE_LINE]', lumerreQualifyingTyreseLine())
      .replaceAll('[LUMERRE_MARA_LINE]', lumerreQualifyingMaraLine());
  }

  function storyBeatText(beat) {
    if (beat?.crownFameVariants && typeof beat.crownFameVariants === 'object') return storyCopy(beat.crownFameVariants[crownFameBand()] || beat.text || '');
    if (beat?.crownOverlookVariants && typeof beat.crownOverlookVariants === 'object') return storyCopy(beat.crownOverlookVariants[crownWeekState().reception?.overlookSeen ? 'seen' : 'missed'] || beat.text || '');
    if (beat?.blackglassAfterHoursVariants && typeof beat.blackglassAfterHoursVariants === 'object') { const ah=chapter4State().afterHours||{},band=ah.secretFound?'secret':ah.caught?'caught':'clean'; return storyCopy(beat.blackglassAfterHoursVariants[band] || beat.text || ''); }
    if (beat?.blackglassResultVariants && typeof beat.blackglassResultVariants === 'object') return storyCopy(beat.blackglassResultVariants[blackglassResultBand()] || beat.text || '');
    if (beat?.blackglassQualifyingVariants && typeof beat.blackglassQualifyingVariants === 'object') return storyCopy(beat.blackglassQualifyingVariants[blackglassQualifyingBand()] || beat.text || '');
    if (beat?.blackglassStandingVariants && typeof beat.blackglassStandingVariants === 'object') return storyCopy(beat.blackglassStandingVariants[blackglassStandingBand()] || beat.text || '');
    if (beat?.resultVariants && typeof beat.resultVariants === 'object') return storyCopy(beat.resultVariants[storyResultBand()] || beat.text || '');
    if (!beat?.variants || typeof beat.variants !== 'object') return storyCopy(beat?.text || '');
    for (const [choiceId, variants] of Object.entries(beat.variants)) {
      const option = Number(state.story?.choices?.[choiceId]?.option);
      if (Array.isArray(variants) && Number.isInteger(option) && variants[option]) return storyCopy(variants[option]);
    }
    return storyCopy(beat.text || '');
  }

  function applyStoryEffects(story, effects = {}) {
    Object.entries(effects.identity || {}).forEach(([key, change]) => {
      story.identity[key] = (Number(story.identity[key]) || 0) + Number(change || 0);
    });
    Object.entries(effects.relationships || {}).forEach(([key, change]) => {
      story.relationships[key] = (Number(story.relationships[key]) || 0) + Number(change || 0);
    });
  }

  async function persistStory(nextStory, { stageOverride = '' } = {}) {
    if (!state.client || !state.user || !state.activeSave) throw new Error('Your Career save is not connected. Return to the Career menu and load it again.');
    if (testerReplayActive()) {
      // CatAsthma QA replay is a sandbox. Story systems behave normally in
      // memory, including races and chapter choices, but Supabase is never
      // touched. Leaving replay restores the exact live snapshot.
      state.storySaving = false;
      state.storyError = '';
      state.story = normaliseQuickquillStory(cloneValue(nextStory));
      return { ...state.activeSave, state:{ ...activeSaveState(), story:cloneValue(state.story) }, testerReplay:true, stageOverride };
    }
    const timestamp = new Date().toISOString();
    const previousState = activeSaveState();
    const saveState = {
      ...previousState,
      version: SAVE_VERSION,
      stage: stageOverride || (
        QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(scene => scene.id === nextStory.scene) && !nextStory.completed?.practiceQualifying
          ? 'quickquill-lumerre-practice-qualifying'
          : QUICKQUILL_CROWN_WEEK_SCENES.some(scene => scene.id === nextStory.scene) && !nextStory.completed?.crownWeek
          ? 'quickquill-crown-week'
          : QUICKQUILL_SEAT_SCENES.some(scene => scene.id === nextStory.scene) && !nextStory.completed?.seat
          ? 'quickquill-seat-story'
          : QUICKQUILL_BLACKGLASS_SCENES.some(scene => scene.id === nextStory.scene) && !nextStory.completed?.blackglass
          ? 'quickquill-blackglass-story'
          : QUICKQUILL_DOWNTIME_SCENES.some(scene => scene.id === nextStory.scene) && !nextStory.completed?.downtime
            ? 'quickquill-downtime-story'
            : nextStory.completed?.canto
              ? 'career-hub'
              : QUICKQUILL_CANTO_SCENES.some(scene => scene.id === nextStory.scene)
              ? 'quickquill-canto-story'
              : nextStory.completed?.prologue
                ? 'career-hub'
                : 'quickquill-story'
      ),
      story: nextStory
    };
    state.storySaving = true;
    state.storyError = '';
    try {
      const { data, error } = await state.client
        .from(SAVE_TABLE)
        .update({ state: saveState, updated_at: timestamp, last_played_at: timestamp })
        .eq('id', state.activeSave.id)
        .eq('user_id', state.user.id)
        .select('id,user_id,owner_username,save_name,team_id,sponsor,racer,state,created_at,updated_at,last_played_at')
        .single();
      if (error) throw error;
      if (!data?.id) throw new Error('Career progress could not be confirmed by the account save.');
      state.story = normaliseQuickquillStory(data.state?.story);
      state.activeSave = data;
      state.saves = state.saves.map(save => save.id === data.id ? data : save);
      return data;
    } finally {
      // A rejected request or network exception must never leave every story
      // interaction silently locked behind storySaving=true.
      state.storySaving = false;
    }
  }

  async function connectAccount() {
    try {
      const namespace = window.supabase;
      if (!namespace?.createClient) throw new Error('The Career Mode account service did not load. Close Career Mode and try again.');
      state.client = namespace.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false, autoRefreshToken: true, detectSessionInUrl: false }
      });

      const bridgedSession = await requestAccountSession();
      if (bridgedSession) {
        const { data: sessionData, error: sessionError } = await state.client.auth.setSession({
          access_token: bridgedSession.accessToken,
          refresh_token: bridgedSession.refreshToken
        });
        if (sessionError) throw sessionError;
        state.user = sessionData?.user || sessionData?.session?.user || null;
      } else {
        const { data: localSession, error: localSessionError } = await state.client.auth.getSession();
        if (localSessionError) throw localSessionError;
        state.user = localSession?.session?.user || null;
      }
      if (!state.user) throw new Error('Your login session has expired. Close Career Mode and sign in again.');
      await loadSaves();
    } catch (error) {
      console.error('[Dragonbound Career Mode] Account connection failed', error);
      state.savesLoading = false;
      state.savesError = error?.message || 'Career saves could not be loaded.';
      state.status = state.savesError;
      render();
    }
  }

  async function loadSaves({ preserveStatus = false } = {}) {
    if (!state.client || !state.user) return;
    state.savesLoading = true;
    if (!preserveStatus) state.status = 'Loading your career records…';
    render();
    const { data, error } = await state.client
      .from(SAVE_TABLE)
      .select('id,user_id,owner_username,save_name,team_id,sponsor,racer,state,created_at,updated_at,last_played_at')
      .eq('user_id', state.user.id)
      .order('updated_at', { ascending: false });
    state.savesLoading = false;
    if (error) {
      state.savesError = error.message || 'Career saves could not be loaded.';
      state.status = 'Career records unavailable';
      render();
      throw error;
    }
    state.saves = Array.isArray(data) ? data : [];
    state.savesError = '';
    state.status = state.saves.length
      ? `${state.saves.length} Career ${state.saves.length === 1 ? 'save is' : 'saves are'} ready — choose one to continue or start another`
      : 'Start a career to create your first save';
    render();
  }

  function menuItems() {
    return [
      { id: 'career', label: 'Start career mode', y: '58.6%', disabled: state.savesLoading, disabledLabel: 'loading your account' },
      { id: 'dragon', label: 'Select a dragon', y: '65.2%', disabled: state.savesLoading || !state.saves.length, disabledLabel: state.savesLoading ? 'loading your account' : 'create a career first' },
      { id: 'back', label: 'Back', y: '72.3%', disabled: false }
    ];
  }

  function nextEnabled(current, direction) {
    const items = menuItems();
    let next = current;
    do next = (next + direction + items.length) % items.length;
    while (items[next].disabled);
    return next;
  }

  function emberMarkup() {
    return EMBERS.map(([left, top, size, wait], index) =>
      `<i style="left:${left}%;top:${top}%;width:${size / 10}rem;height:${size / 10}rem;animation-delay:${wait}s" data-ember="${index}"></i>`
    ).join('');
  }

  function topControls() {
    return `
      <div class="top-controls">
        ${state.user ? `<span class="career-account-chip"><i></i>${escapeHtml(username())}</span>` : ''}
        <button class="round-button" type="button" data-sound aria-label="${state.soundOn ? 'Mute all sounds' : 'Enable all sounds'}" title="${state.soundOn ? 'Sound on' : 'Sound off'}">
          <span aria-hidden="true">${state.soundOn ? '◖))' : '◖×'}</span>
        </button>
      </div>`;
  }

  function careerSaveProgress(save) {
    const savedState = save?.state && typeof save.state === 'object' ? save.state : {};
    const story = save?.team_id === 'quickquill' ? normaliseQuickquillStory(savedState.story) : null;
    if (!story) return 'Career started';
    if (story.completed?.seat) return 'Chapter 5 complete · Lumerre next';
    if (blackglassChapterComplete(story)) return 'Chapter 5 ready · A Seat at the Table';
    if (story.completed?.downtime) return 'Chapter 4 · Blackglass';
    if (story.completed?.canto) return 'Chapter 3 · Quickquill downtime';
    if (story.completed?.prologue) return 'Chapter 2 · Canto Plains';
    return 'Chapter 1 · The Impossible Contract';
  }

  function savePickerMarkup() {
    if (!state.savePickerOpen) return '';
    const list = state.saves.map(save => {
      const date = new Date(save.updated_at || save.created_at);
      const dateText = Number.isNaN(date.getTime()) ? 'Career save' : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
      const team = TEAMS.find(item => item.id === save.team_id);
      return `
        <article class="career-save-card" style="--save-accent:${escapeHtml(team?.accent || '#70d0ba')}">
          <div class="career-save-emblem">${escapeHtml(String(save.sponsor || '?').slice(0, 1))}</div>
          <div class="career-save-copy">
            <small>${escapeHtml(save.save_name || 'Dragonbound Career')}</small>
            <strong>${escapeHtml(save.sponsor)}</strong>
            <span>${escapeHtml(careerDragon(save)?.name || username())} · Racing with ${escapeHtml(save.racer)}</span>
            <span class="career-save-progress">${escapeHtml(careerSaveProgress(save))}</span>
            <time>${escapeHtml(dateText)}</time>
          </div>
          <button type="button" data-load-save="${escapeHtml(save.id)}" ${state.busy ? 'disabled' : ''}>${state.busy ? 'LOADING…' : 'LOAD CAREER'}</button>
        </article>`;
    }).join('');
    return `
      <div class="career-save-backdrop" role="presentation">
        <section class="career-save-panel" role="dialog" aria-modal="true" aria-labelledby="careerSaveTitle">
          <header>
            <div><small>YOUR DRAGONBOUND HISTORY</small><h2 id="careerSaveTitle">Choose a career</h2><p>${escapeHtml(username())} can keep multiple independent Career Mode saves.</p></div>
            <button type="button" data-close-saves aria-label="Close saved careers">×</button>
          </header>
          <div class="career-save-list">${list || '<p class="career-save-empty">No careers have been created yet.</p>'}</div>
          ${state.savesError ? `<p class="career-save-error">${escapeHtml(state.savesError)}</p>` : ''}
        </section>
      </div>`;
  }

  function exitMarkup() {
    if (!state.exitOpen) return '';
    return `
      <div class="panel-backdrop" role="presentation">
        <section class="game-panel" role="dialog" aria-modal="true" aria-labelledby="careerExitTitle">
          <span class="panel-corner corner-a" aria-hidden="true"></span><span class="panel-corner corner-b" aria-hidden="true"></span>
          <button class="panel-close" type="button" data-stay aria-label="Close panel">×</button>
          <div class="panel-content exit-content">
            <p class="panel-kicker">Leave the paddock?</p>
            <h2 id="careerExitTitle">Return to Dragonbound</h2>
            <p class="panel-copy">Your Career Mode saves are securely stored on your website account.</p>
            <div class="exit-actions"><button class="secondary-action" type="button" data-stay>Stay here</button><button class="primary-action" type="button" data-leave>Leave career mode</button></div>
          </div>
        </section>
      </div>`;
  }

  function renderMenu() {
    const items = menuItems();
    if (items[state.selectedMenu]?.disabled) state.selectedMenu = nextEnabled(state.selectedMenu, 1);
    root.innerHTML = `
      <div class="scene" aria-hidden="true"><img class="scene-art" src="dragonbound-career.png" alt=""><div class="sky-flash"></div><div class="title-glint"></div></div>
      <div class="vignette" aria-hidden="true"></div><div class="texture" aria-hidden="true"></div><div class="embers" aria-hidden="true">${emberMarkup()}</div>
      <nav class="menu" aria-label="Career mode menu">
        ${items.map((item, index) => `
          <button class="menu-hotspot ${state.selectedMenu === index ? 'is-selected' : ''} ${item.id === 'dragon' && item.disabled && !state.savesLoading ? 'is-no-save' : ''} ${item.id === 'career' && item.disabled && !state.savesLoading ? 'is-save-limit' : ''}"
            style="top:${item.y}" type="button" data-menu="${item.id}" data-menu-index="${index}" ${item.disabled ? 'disabled' : ''}
            aria-label="${escapeHtml(item.disabled ? `${item.label} — ${item.disabledLabel || 'unavailable'}` : item.label)}">
            <span class="sr-only">${escapeHtml(item.label)}</span><span class="menu-marker left" aria-hidden="true"></span><span class="menu-marker right" aria-hidden="true"></span><span class="menu-underline" aria-hidden="true"></span>
          </button>`).join('')}
      </nav>
      ${savePickerMarkup()}${exitMarkup()}
      <div class="status-ribbon" role="status"><span class="status-gem" aria-hidden="true"></span><span>${escapeHtml(state.status)}</span><span class="key-hint" aria-hidden="true">↑ ↓ &nbsp; ENTER</span></div>
      ${topControls()}<div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;

    root.querySelectorAll('[data-menu]').forEach(button => {
      button.addEventListener('pointerenter', () => {
        if (button.disabled) return;
        const index = Number(button.dataset.menuIndex);
        if (state.selectedMenu !== index) playTone(230 + index * 35);
        state.selectedMenu = index;
        button.closest('nav').querySelectorAll('.menu-hotspot').forEach(item => item.classList.toggle('is-selected', item === button));
        state.status = button.dataset.menu === 'dragon' ? `${state.saves.length} saved ${state.saves.length === 1 ? 'career' : 'careers'}` : button.dataset.menu === 'career' ? 'Begin a new Dragonbound career' : 'Return to Dragonbound';
        root.querySelector('.status-ribbon span:nth-child(2)').textContent = state.status;
      });
      button.addEventListener('click', () => activateMenu(button.dataset.menu));
    });
    bindCommon();
    root.querySelectorAll('[data-close-saves]').forEach(button => button.addEventListener('click', closeSavePicker));
    root.querySelectorAll('[data-load-save]').forEach(button => button.addEventListener('click', () => loadCareer(button.dataset.loadSave)));
    root.querySelectorAll('[data-stay]').forEach(button => button.addEventListener('click', () => { state.exitOpen = false; playTone(190); render(); }));
    root.querySelector('[data-leave]')?.addEventListener('click', () => sendParent('dragonbound-career-close'));
  }

  function renderOpening() {
    root.innerHTML = `
      <section class="opening-cinematic" role="button" tabindex="0" aria-label="Opening scene ${state.frameIndex + 1} of ${OPENING_FRAMES.length}. Click anywhere to continue.">
        <img class="opening-backdrop" src="${OPENING_FRAMES[state.frameIndex]}" alt="" aria-hidden="true">
        <img class="opening-frame opening-motion-${state.frameIndex % 3}" src="${OPENING_FRAMES[state.frameIndex]}" alt="Dragonbound opening scene ${state.frameIndex + 1}">
        <div class="opening-rain" aria-hidden="true"></div><div class="opening-light" aria-hidden="true"></div><div class="opening-grain" aria-hidden="true"></div>
        <div class="opening-progress"><span>${state.frameIndex + 1} / ${OPENING_FRAMES.length}</span><b>CLICK TO CONTINUE</b></div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelector('.opening-cinematic').addEventListener('click', advanceOpening);
  }

  function renderTeamSelect() {
    const selected = state.selectedTeam === null ? null : TEAMS[state.selectedTeam];
    root.innerHTML = `
      <section class="team-select-shell" aria-label="Select a racing team and sponsor">
        <img class="team-select-backdrop" src="team-selection.png" alt="" aria-hidden="true">
        <div class="team-select-stage">
          <img class="team-select-art" src="team-selection.png" alt="Six Dragonbound racing teams and their sponsors">
          <div class="team-tech-light" aria-hidden="true"></div><div class="team-scan" aria-hidden="true"></div><div class="team-grain" aria-hidden="true"></div>
          <nav class="team-options" aria-label="Racing team choices">
            ${TEAMS.map((team, index) => `<button type="button" class="team-hotspot ${state.selectedTeam === index ? 'is-selected' : ''}" style="left:${team.left};--team-accent:${team.accent}" data-team="${index}" aria-label="Choose ${escapeHtml(team.sponsor)}, racing with ${escapeHtml(team.racer)}"><span class="sr-only">${escapeHtml(team.sponsor)}, ${escapeHtml(team.racer)}</span><i aria-hidden="true"></i></button>`).join('')}
          </nav>
          <div class="team-select-hint"><span class="team-hint-pip"></span>${selected ? `${escapeHtml(selected.sponsor)} · click to review contract` : 'Select a sponsor to review their contract'}</div>
        </div><div class="team-screen-vignette" aria-hidden="true"></div>
        ${state.teamConfirmOpen && selected ? `
          <div class="team-confirm-overlay" role="presentation"><section class="team-confirm-panel" role="dialog" aria-modal="true" aria-labelledby="teamConfirmTitle" style="--team-accent:${selected.accent}">
            <div class="contract-eyebrow">Official racing contract</div><h2 id="teamConfirmTitle">Join ${escapeHtml(selected.sponsor)}?</h2><div class="contract-rule" aria-hidden="true"></div>
            <p>You’ll begin your Dragonbound career under <strong>${escapeHtml(selected.sponsor)}</strong>, racing alongside <strong>${escapeHtml(selected.racer)}</strong>.</p>
            <div class="contract-choice"><span>Selected sponsor</span><strong>${escapeHtml(selected.sponsor)}</strong></div>
            ${state.savesError ? `<p class="contract-save-error" role="alert">${escapeHtml(state.savesError)}</p>` : ''}
            <div class="team-confirm-actions"><button type="button" class="team-review-button" data-review ${state.busy ? 'disabled' : ''}>Review teams</button><button type="button" class="team-sign-button" data-sign ${state.busy ? 'disabled' : ''}>${state.busy ? 'SAVING CAREER…' : 'Sign contract'}</button></div>
            <div class="contract-corners" aria-hidden="true"></div>
          </section></div>` : ''}
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelectorAll('[data-team]').forEach(button => {
      const preview = () => {
        const index = Number(button.dataset.team);
        if (state.selectedTeam !== index) playTone(220 + index * 22);
        state.selectedTeam = index;
        root.querySelectorAll('[data-team]').forEach(item => item.classList.toggle('is-selected', item === button));
        const hint = root.querySelector('.team-select-hint');
        if (hint) hint.innerHTML = `<span class="team-hint-pip"></span>${escapeHtml(TEAMS[index].sponsor)} · click to review contract`;
      };
      button.addEventListener('pointerenter', preview);
      // Never render during focus: a pointer click focuses first, and replacing
      // the DOM here used to destroy the button before its click could fire.
      button.addEventListener('focus', preview);
      button.addEventListener('click', () => { state.selectedTeam = Number(button.dataset.team); state.teamConfirmOpen = true; state.savesError = ''; playTone(320); render(); });
    });
    root.querySelector('[data-review]')?.addEventListener('click', () => { state.teamConfirmOpen = false; state.savesError = ''; playTone(180); render(); });
    root.querySelector('[data-sign]')?.addEventListener('click', saveNewCareer);
  }

  function renderHub() {
    const save = state.activeSave;
    const activeTeam = save ? TEAMS.find(team => team.id === save.team_id) : null;
    const storyJourneyUnlocked = activeTeam?.id === 'quickquill' && (activeSaveState().story?.completed?.prologue === true || isCatAsthmaTester());
    const activeDragon = save ? careerDragon(save) : null;
    const activeAvatar = activeTeam && activeDragon
      ? `team-avatars/${activeTeam.id}/${activeDragon.asset}`
      : '';
    root.innerHTML = `
      <section class="career-hub-shell" aria-label="Dragonbound career hub">
        <img class="career-hub-backdrop" src="career-hub.png" alt="" aria-hidden="true">
        <div class="career-hub-stage"><img class="career-hub-art" src="career-hub.png" alt="Dragonbound Career Mode world map menu">
          <div class="hub-ambient-light" aria-hidden="true"></div><div class="hub-map-sweep" aria-hidden="true"></div>
          <div class="hub-center-display ${activeTeam?.room ? 'has-team-room' : ''} ${activeAvatar ? 'has-team-avatar' : ''}" aria-hidden="true">
            ${activeTeam?.room ? `<img class="hub-team-room" src="${activeTeam.room}" alt="">` : ''}
            ${activeAvatar ? `<span class="hub-team-avatar-shadow"></span><img class="hub-team-avatar" src="${activeAvatar}" alt="">` : ''}
          </div><div class="hub-interface-grain" aria-hidden="true"></div>
          <nav class="career-hub-nav" aria-label="Career hub options">
            ${HUB_ITEMS.map((item, index) => `<button type="button" class="hub-hotspot ${item.footer ? 'is-footer' : ''} ${item.id === 'story' && storyJourneyUnlocked ? 'is-story-journey' : ''} ${state.selectedHub === index ? 'is-selected' : ''}" style="left:${item.left};top:${item.top};width:${item.width};height:${item.height}" data-hub="${index}" aria-label="${escapeHtml(item.id === 'story' && storyJourneyUnlocked ? 'Open Story Journey' : item.label)}"><span class="sr-only">${escapeHtml(item.id === 'story' && storyJourneyUnlocked ? 'Open Story Journey' : item.label)}</span><i aria-hidden="true"></i></button>`).join('')}
          </nav>
          ${storyJourneyUnlocked ? `<div class="hub-story-journey-badge" aria-hidden="true"><i></i><span><small>PROLOGUE COMPLETE</small><strong>STORY JOURNEY UNLOCKED</strong></span></div>` : ''}
          ${save ? `<div class="active-career-chip"><small>ACTIVE CAREER</small><strong>${escapeHtml(save.sponsor)}</strong><span>${escapeHtml(save.racer)}</span></div>` : ''}
          ${careerDeskBarMarkup()}
          ${isCatAsthmaTester() ? `<div class="catasthma-test-controls"><button type="button" class="story-replay-test" data-tester-replay-menu><small>CatAsthma QA</small><strong>REPLAY ANY CHAPTER</strong></button><button type="button" class="story-reset-test" data-reset-story><small>CatAsthma test control</small><strong>RESET QUICKQUILL STORY</strong></button></div>` : ''}
        </div><div class="hub-screen-vignette" aria-hidden="true"></div>
        <div class="hub-status-toast" role="status">${escapeHtml(state.status || `${save?.sponsor || 'Career'} loaded`)}</div>
        ${careerDeskOverlayMarkup()}
        ${state.resetStoryConfirmOpen ? `<div class="story-reset-backdrop" role="presentation"><section class="story-reset-panel" role="dialog" aria-modal="true" aria-labelledby="storyResetTitle"><small>CATASTHMA TEST CONTROL</small><h2 id="storyResetTitle">Reset Quickquill story?</h2><p>This clears only the Quickquill chapter progress and choices. Your account, dragon, selected team and Career save remain untouched.</p>${state.storyError ? `<div class="story-error" role="alert">${escapeHtml(state.storyError)}</div>` : ''}<div><button type="button" data-cancel-reset ${state.storySaving ? 'disabled' : ''}>KEEP PROGRESS</button><button type="button" data-confirm-reset ${state.storySaving ? 'disabled' : ''}>${state.storySaving ? 'RESETTING…' : 'RESET STORY'}</button></div></section></div>` : ''}
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelectorAll('[data-hub]').forEach(button => {
      button.addEventListener('pointerenter', () => {
        const index = Number(button.dataset.hub);
        if (state.selectedHub !== index) playTone(210 + index * 14);
        state.selectedHub = index;
        root.querySelectorAll('[data-hub]').forEach(item => item.classList.toggle('is-selected', item === button));
      });
      button.addEventListener('click', () => {
        const item = HUB_ITEMS[Number(button.dataset.hub)];
        playTone(235 + Number(button.dataset.hub) * 17);
        if (item.id === 'home') {
          state.mode = 'menu';
          state.status = `${state.saves.length} career ${state.saves.length === 1 ? 'save' : 'saves'} ready`;
          render();
          return;
        }
        if (item.id === 'story') {
          void openStory();
          return;
        }
        if (item.id === 'teams') {
          void fadeTo('meet-teams', { restartMusic: false, duration: 360 });
          return;
        }
        if (item.id === 'profile') { openCareerPanel('evolution'); return; }
        if (item.id === 'trophies') { openCareerPanel('records'); return; }
        if (item.id === 'favourites') { openCareerPanel('memories'); return; }
        state.status = `${item.label} will continue in the next Career Mode update`;
        const toast = root.querySelector('.hub-status-toast');
        if (toast) { toast.textContent = state.status; toast.classList.add('is-visible'); window.setTimeout(() => toast.classList.remove('is-visible'), 2600); }
      });
    });
    root.querySelectorAll('[data-career-panel]').forEach(button => button.addEventListener('click', () => openCareerPanel(String(button.dataset.careerPanel || 'journal'))));
    root.querySelector('[data-career-panel-close]')?.addEventListener('click', () => { state.hubPanel = ''; state.hubInboxId = ''; playTone(175); render(); });
    root.querySelectorAll('[data-career-inbox]').forEach(button => button.addEventListener('click', () => {
      const id = String(button.dataset.careerInbox || '');
      if (!id) return;
      state.hubInboxId = id;
      const story = careerHubStory();
      if (story && !(story.careerHub?.inboxRead || []).includes(id)) {
        const changed = cloneValue(story);
        changed.careerHub = { ...(changed.careerHub || {}), inboxRead: [...new Set([...(changed.careerHub?.inboxRead || []), id])].slice(-64) };
        state.story = changed;
        render();
        void persistCareerHubRead(id);
      } else { render(); }
    }));
    root.querySelector('[data-tester-replay-menu]')?.addEventListener('click', () => {
      state.story = normaliseQuickquillStory(state.story || activeSaveState().story || defaultQuickquillStory());
      state.mode = 'story-journey'; state.storyError = ''; state.status = 'CatAsthma QA · choose any implemented chapter to replay'; playTone(265); render(); syncMusic({restart:true});
    });
    root.querySelector('[data-reset-story]')?.addEventListener('click', () => { state.resetStoryConfirmOpen = true; state.storyError = ''; playTone(185); render(); });
    root.querySelector('[data-cancel-reset]')?.addEventListener('click', () => { state.resetStoryConfirmOpen = false; state.storyError = ''; playTone(170); render(); });
    root.querySelector('[data-confirm-reset]')?.addEventListener('click', () => { void resetQuickquillStory(); });
  }

  function renderMeetTeams() {
    root.innerHTML = `
      <section class="meet-teams-shell" aria-label="Meet the Dragonbound racing teams">
        <iframe id="meetTeamsFrame" title="Meet the Teams" src="meet-the-teams/index.html?v=v34-12-1-meet-teams-back-20260825&sound=${state.soundOn ? '1' : '0'}" allow="autoplay; fullscreen" referrerpolicy="same-origin"></iframe>
        <button class="meet-teams-parent-back" type="button" data-meet-teams-parent-back aria-label="Back to the Career menu"></button>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelector('[data-meet-teams-parent-back]')?.addEventListener('click', closeMeetTeams);
  }

  function closeMeetTeams() {
    if (state.mode !== 'meet-teams') return;
    state.mode = 'career-hub';
    state.status = 'Meet the Teams closed';
    state.blackout = false;
    playTone(190);
    render();
    syncMusic({ restart: true });
  }

  window.DragonboundCareerMeetTeamsClose = closeMeetTeams;

  function portraitMarkup(portrait) {
    if (!portrait?.character || !PORTRAITS[portrait.character]) return '';
    const sheet = PORTRAITS[portrait.character];
    if (sheet.folder) {
      const frame = Math.max(0, Math.min((sheet.frames || 1) - 1, Number(portrait.frame) || 0));
      const src = `${sheet.folder}/frame-${String(frame).padStart(2, '0')}.png`;
      const fallback = sheet.fallback ? ` data-portrait-fallback="${escapeHtml(sheet.fallback)}"` : '';
      return `<div class="story-portrait is-${escapeHtml(portrait.side || 'right')} ${portrait.shadow ? 'is-shadowed' : ''}" aria-hidden="true"><img class="story-portrait-frame" src="${src}"${fallback} alt=""></div>`;
    }
    const frame = Math.max(0, Math.min((sheet.columns * sheet.rows) - 1, Number(portrait.frame) || 0));
    const column = frame % sheet.columns;
    const row = Math.floor(frame / sheet.columns);
    const x = sheet.columns === 1 ? 0 : (column / (sheet.columns - 1)) * 100;
    const y = sheet.rows === 1 ? 0 : (row / (sheet.rows - 1)) * 100;
    return `<div class="story-portrait is-${escapeHtml(portrait.side || 'right')} ${portrait.shadow ? 'is-shadowed' : ''}" aria-hidden="true"><div class="story-portrait-sprite" style="--portrait-image:url('${sheet.source}');--portrait-size:${sheet.columns * 100}% ${sheet.rows * 100}%;--portrait-x:${x}%;--portrait-y:${y}%"></div></div>`;
  }

  function bindStoryPortraitFallbacks() {
    root.querySelectorAll('img.story-portrait-frame').forEach(img => {
      if (img.dataset.portraitFallbackBound === '1') return;
      img.dataset.portraitFallbackBound = '1';
      const recover = () => {
        const fallback = img.dataset.portraitFallback || '';
        if (fallback && img.dataset.portraitFallbackUsed !== '1') {
          img.dataset.portraitFallbackUsed = '1';
          img.src = fallback;
          return;
        }
        img.closest('.story-portrait')?.classList.add('is-missing');
        img.style.display = 'none';
      };
      img.addEventListener('error', recover);
      if (img.complete && !img.naturalWidth) recover();
    });
  }

  function storyPropMarkup(scene, beat) {
    if (scene.visual === 'invitation' && beat?.type !== 'cinematic') {
      return `<div class="story-invitation" aria-hidden="true"><div class="invitation-feather"></div><small>PRIVATE RACING INVITATION</small><strong>${escapeHtml(storyDragonName())}</strong><span>QUICKQUILL RACING</span><i>Q</i></div>`;
    }
    if (beat?.visual === 'note') {
      return `<div class="story-locker-note" aria-hidden="true"><small>QUICKQUILL // LOCKER 07</small><strong>FAST ENOUGH<br>TO WORRY THE RICH</strong><span>— TYRESE</span></div>`;
    }
    const propMap = {
      'room-key': 'story/props/room-key.png',
      'canto-photo': 'story/props/canto-photo.png',
      'blackglass-envelope': 'story/props/blackglass-envelope.png',
      'blackglass-envelope-open': 'story/props/blackglass-envelope-open.png',
      'blackglass-pass': 'story/props/blackglass/venue-pass.png',
      'blackglass-room-key': 'story/props/blackglass/room-key.png',
      'blackglass-circuit-card': 'story/props/blackglass/circuit-card.png',
      'blackglass-qualifying-sheet': 'story/props/blackglass/qualifying-sheet.png'
    };
    if (beat?.visual && propMap[beat.visual]) {
      return `<img class="story-prop-image is-${escapeHtml(beat.visual)}" src="${propMap[beat.visual]}" alt="" aria-hidden="true">`;
    }
    return '';
  }

  function downtimeDragonPath(frame = 0) {
    const key = accountKey(username());
    const safeKey = CAREER_DRAGONS[key] ? key : 'catasthma';
    const number = Math.max(0, Math.min(15, Number(frame) || 0));
    return `story/downtime-dragons/${safeKey}/frame-${String(number).padStart(2, '0')}.png`;
  }

  function downtimeDragonMarkup(frame = 0, extraClass = '') {
    return `<div class="downtime-dragon-wrap ${escapeHtml(extraClass)}" aria-hidden="true"><span></span><img src="${downtimeDragonPath(frame)}" alt=""></div>`;
  }

  function storyDragonMarkup(scene, beat) {
    if (!scene.showDragon || beat?.portrait || beat?.type === 'cinematic') return '';
    if (QUICKQUILL_DOWNTIME_SCENES.some(item => item.id === scene.id) || QUICKQUILL_BLACKGLASS_SCENES.some(item => item.id === scene.id) || QUICKQUILL_SEAT_SCENES.some(item => item.id === scene.id) || QUICKQUILL_CROWN_WEEK_SCENES.some(item => item.id === scene.id) || QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(item => item.id === scene.id)) {
      const frameByScene = { q9:10,q11:4,q15:11,q16:9,q17:1,q18:0,q19:3,q20:11,q21:2,q22:1,q23:10,q24:9,q25:3,q26:11,q27:0,q28:2,q29:1,q30:4,q31:11,q32:0,q33:2,q34:1,q35:3,q36:4,q37:11,q38:2,q39:9,q40:0,q41:1,q42:10,q43:9,q44:3,q45:4,q46:0,q55:2,q56:9 };
      return downtimeDragonMarkup(frameByScene[scene.id] ?? 0, 'is-story-dragon');
    }
    const dragon = careerDragon(state.activeSave);
    if (!dragon) return '';
    return `<div class="story-dragon-wrap" aria-hidden="true"><span></span><img src="team-avatars/quickquill/${escapeHtml(dragon.asset)}" alt=""></div>`;
  }

  function roomDecorMarkup(story = state.story) {
    const room = chapter3State(story).room || {};
    const wall = {
      canto_photo: 'story/props/wall-canto-photo.png',
      pennant: 'story/props/wall-pennant.png',
      route_print: 'story/props/wall-route-print.png'
    }[room.wall];
    const shelf = {
      keepsake: 'story/props/shelf-keepsake.png',
      books: 'story/props/shelf-books.png',
      goggles: 'story/props/shelf-goggles.png',
      plant: 'story/props/shelf-plant.png'
    }[room.shelf];
    const dragon = {
      padded_nest: 'story/props/dragon-padded-nest.png',
      blankets: 'story/props/dragon-blankets.png',
      toy: 'story/props/dragon-toy.png'
    }[room.dragonCorner];
    return `${wall ? `<img class="downtime-room-decor is-wall" src="${wall}" alt="" aria-hidden="true">` : ''}${shelf ? `<img class="downtime-room-decor is-shelf" src="${shelf}" alt="" aria-hidden="true">` : ''}${dragon ? `<img class="downtime-room-decor is-dragon-corner" src="${dragon}" alt="" aria-hidden="true">` : ''}`;
  }

  function downtimeNameplateMarkup() {
    return `<div class="downtime-nameplate" aria-label="${escapeHtml(username())} and ${escapeHtml(storyDragonName())}"><small>QUICKQUILL</small><strong>${escapeHtml(username())}</strong><span>&amp; ${escapeHtml(storyDragonName())}</span></div>`;
  }

  function chapter3FirstDragonChoice() {
    const key = accountKey(username());
    return {
      covidpanda: 'window',
      catasthma: 'desk',
      kat: 'window',
      emlux: 'toy',
      proco: 'nest',
      smokedrope1028: 'bed'
    }[key] || 'nest';
  }

  function journalSummaryMarkup(story = state.story) {
    const c3 = chapter3State(story);
    const rank = Math.max(1, Math.min(6, Number(story?.race?.result?.rank) || 6));
    const evening = (c3.eveningMoments || []).map(id => EVENING_ACTIVITIES[id]?.title || id).join(' · ') || 'A quiet evening';
    const duty = c3.duty?.type ? DUTY_GAMES[c3.duty.type]?.title || 'Quickquill duty' : 'Duty not completed yet';
    return `<div class="downtime-journal-card">
      <small>CAREER JOURNAL · ENTRY 01</small>
      <h3>CANTO MEADOW CIRCUIT</h3>
      <p><b>Result</b> ${rank}${rank===1?'st':rank===2?'nd':rank===3?'rd':'th'} · ${escapeHtml(storyRaceTime(story))}</p>
      <p><b>Strategy</b> ${escapeHtml(String(story?.race?.strategy || 'focus').toUpperCase())} · <b>Overtakes</b> ${Math.max(0, Number(story?.race?.result?.overtakes) || 0)}</p>
      <p><b>First evening</b> ${escapeHtml(evening)}</p>
      <p><b>Team duty</b> ${escapeHtml(duty)}</p>
    </div>`;
  }


  function careerHubStory() {
    if (state.activeSave?.team_id !== 'quickquill') return null;
    return state.story || normaliseQuickquillStory(activeSaveState().story);
  }

  function careerDeskPanelDefinition(id = state.hubPanel) {
    return CAREER_DESK_PANELS.find(panel => panel.id === id) || CAREER_DESK_PANELS[0];
  }

  function formatCareerTime(ms) {
    const value = Math.max(0, Number(ms) || 0);
    if (!value) return '—';
    const minutes = Math.floor(value / 60000);
    const seconds = Math.floor((value % 60000) / 1000);
    const hundredths = Math.floor((value % 1000) / 10);
    return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(hundredths).padStart(2,'0')}`;
  }

  function careerCurrentChapter(story) {
    if (!story) return { eyebrow:'CAREER', title:'Career file', note:'This campaign has not started its story systems yet.' };
    if (story.completed?.seasonOpening) return { eyebrow:'SEASON CONTROL', title:'Round One · Velmora City', note:`Opening week complete · ${seasonState(story).weeklyPlan.profile} · ${seasonState(story).pitwall.grade}.` };
    if (story.completed?.verdict) return { eyebrow:'OPENING WEEK', title:'The First Full Season', note:story.chapter8?.started?'Calendar, preparation, telemetry and pit-wall training are in progress.':`The verdict is recorded: ${verdictDecisionSummary(story.chapter7||{})}. The calendar is ready to open.` };
    if (story.completed?.afterFlag || story.chapter === 'verdict' || story.chapter7?.started) return { eyebrow:'CONTRACT DAY', title:'The Verdict', note:'Quickquill HQ · Monday 09:00. Contract terms, team hierarchy and outside interest are now live.' };
    if (story.completed?.raceWeekend || story.chapter6?.afterFlag?.started) return { eyebrow:'AFTER THE FLAG', title:'The Lumerre Crown', note:'The race is over. The weekend still has something to say.' };
    if (story.completed?.seat) return { eyebrow:'NEXT EVENT', title:'Lumerre — The Terraces', note:`${chapter5State(story).lumerreRole || deriveLumerreRole(story)} · the next race weekend is waiting.` };
    if (isSeatScene(story)) return { eyebrow:'CAREER REVIEW', title:'A Seat at the Table', note:'Strategy, media attention and team politics are now part of the job.' };
    if (story.completed?.blackglass) return { eyebrow:'BETWEEN WEEKENDS', title:'A Seat at the Table', note:'Blackglass is complete. The team review is ready.' };
    if (isBlackglassScene(story)) return { eyebrow:'RACE WEEKEND', title:'Blackglass Under Floodlights', note:'Qualifying, team choices and the northern night are shaping the weekend.' };
    if (story.completed?.downtime) return { eyebrow:'NEXT EVENT', title:'Blackglass', note:'The invitation is real. The northern weekend is ready.' };
    if (isDowntimeScene(story)) return { eyebrow:'QUICKQUILL HQ', title:'A Place at Quickquill', note:'Your career is becoming a life between races.' };
    if (story.completed?.canto) return { eyebrow:'QUICKQUILL HQ', title:'A Place at Quickquill', note:'Canto is recorded. The team is waiting at home.' };
    if (QUICKQUILL_CANTO_SCENES.some(scene => scene.id === story.scene)) return { eyebrow:'RACE ONE', title:'Canto Plains', note:'Your first professional race weekend is underway.' };
    if (story.completed?.prologue) return { eyebrow:'NEXT EVENT', title:'Canto Plains', note:'The contract is signed. Your first professional race weekend is ready.' };
    return { eyebrow:'QUICKQUILL', title:'The Impossible Contract', note:'The first chapter of the career is still being written.' };
  }

  function careerJournalEntries(story) {
    if (!story) return [];
    const c3 = chapter3State(story), c4 = chapter4State(story), entries = [];
    const prologueStarted = story.completed?.prologue || !['q0','q1','q2','q3'].includes(story.scene) || Number(story.beat) > 0;
    if (prologueStarted) entries.push({
      id:'prologue', number:'01', status:story.completed?.prologue?'complete':'current', title:'The Impossible Contract', location:'Young Velmora League → Quickquill', image:'story/environments/01_Young_Velmora_League_Circuit.png',
      text:story.completed?.prologue
        ? `${storyDragonName()} was noticed after the race was already over, accepted Quickquill’s invitation and signed into the least sensible professional opportunity in Velmora.`
        : `${storyDragonName()} has been noticed. Quickquill’s invitation is turning an ordinary junior race into the beginning of something much larger.`,
      tags:[story.choices?.invitationResponse?.label, story.choices?.assessmentResponse?.label].filter(Boolean).slice(0,2)
    });
    const cantoStarted = QUICKQUILL_CANTO_SCENES.some(scene => scene.id === story.scene) || story.completed?.canto || story.race?.result;
    if (cantoStarted) {
      const result = story.race?.result || {};
      entries.push({
        id:'canto', number:'02', status:story.completed?.canto?'complete':'current', title:'Prove You Belong', location:'Canto Plains', image:'story/environments/05_Canto_Plains_Racing_Venue.png',
        text:story.completed?.canto
          ? `${storyDragonName()} completed a first professional start at Canto, finishing ${ordinal(result.rank || 6)} with ${Math.max(0,Number(result.overtakes)||0)} recorded overtakes. The weekend established ${String(c3.cantoAttitude || 'a measured').replaceAll('-',' ')} response to pressure.`
          : `Quickquill’s first assessment has become a real race weekend. The choices made here will become the first official line in the Career record.`,
        tags:[`Strategy · ${String(story.race?.strategy || currentCantoStrategy(story)).toUpperCase()}`, result.finishMs ? `Time · ${formatCareerTime(result.finishMs)}` : 'Race in progress']
      });
    }
    const downtimeStarted = isDowntimeScene(story) || story.completed?.downtime || story.completed?.blackglass;
    if (downtimeStarted) {
      const evening = (c3.eveningMoments || []).map(id => EVENING_ACTIVITIES[id]?.title).filter(Boolean).join(' · ');
      const duty = c3.duty?.type ? DUTY_GAMES[c3.duty.type]?.title : '';
      entries.push({
        id:'home', number:'03', status:story.completed?.downtime?'complete':'current', title:'A Place at Quickquill', location:'Quickquill Headquarters', image:'story/environments/11_Quickquill_Accommodation_Corridor.png',
        text:story.completed?.downtime
          ? `${storyDragonName()} gained a room, a routine and a place inside Quickquill that no longer feels temporary. ${evening ? `The first free evening included ${evening}.` : ''}`
          : `The racing has stopped for a moment. The important work now is learning the people, rooms and routines that make Quickquill a team.`,
        tags:[duty ? `Duty · ${duty}` : '', c3.roomKeyReceived ? 'Room key received' : ''].filter(Boolean)
      });
    }
    const blackglassStarted = isBlackglassScene(story) || story.completed?.blackglass || story.blackglassRace?.result;
    if (blackglassStarted) {
      const ah = c4.afterHours || {}, result = story.blackglassRace?.result || {};
      let afterHours = 'The long night stayed quiet.';
      if (ah.secretFound) afterHours = `${storyDragonName()} found the hidden viewing rail and the 02:13 view of an empty Blackglass.`;
      else if (ah.caught) afterHours = `${storyDragonName()} was caught exploring after hours; Garran has not forgotten it.`;
      else if (ah.timingFound) afterHours = `${storyDragonName()} found an old sector sheet during an unscheduled midnight expedition.`;
      else if (ah.snackFound) afterHours = `${storyDragonName()} solved the night’s most urgent problem: food.`;
      entries.push({
        id:'blackglass', number:'04', status:story.completed?.blackglass?'complete':'current', title:'Blackglass Under Floodlights', location:'Blackglass Night Circuit', image:'story/environments/20_Blackglass_Night_Circuit_Reveal.png',
        text:story.completed?.blackglass
          ? `${storyDragonName()} qualified ${ordinal(c4.qualifying?.position || result.startPosition || 3)} and finished ${ordinal(result.rank || 6)} beneath the floodlights. ${afterHours}`
          : `The northern weekend is still alive: reputation, qualifying, circuit study and the team’s confidence are all moving at once. ${afterHours}`,
        tags:[c4.qualifying?.completed ? `Qualifying · ${ordinal(c4.qualifying.position || 3)}` : 'Qualifying pending', ah.memory ? `Memory · ${ah.memory}` : ''].filter(Boolean)
      });
    }
    const seatStarted = isSeatScene(story) || story.completed?.seat || chapter5State(story).simulator?.answers?.length;
    if (seatStarted) {
      const c5=chapter5State(story);
      entries.push({id:'seat',number:'05',status:story.completed?.seat?'complete':'current',title:'A Seat at the Table',location:'Quickquill Headquarters → Lumerre media suite',image:'story/chapter5/quickquill-strategy-room.webp',text:story.completed?.seat?`${storyDragonName()} left the Blackglass debrief with a permanent simulator profile of ${c5.simulator?.profile||deriveSeatSimulatorProfile(story)}, a media reputation of ${c5.media?.reputation||deriveMediaReputation(story)}, and a Lumerre role: ${c5.lumerreRole||deriveLumerreRole(story)}.`:'The post-Blackglass review has moved beyond lap times. Quickquill is now asking for judgement, public composure and decisions that affect the whole team.',tags:[c5.developmentPriority?`Development · ${String(c5.developmentPriority).toUpperCase()}`:'',c5.simulator?.profile?`Simulator · ${c5.simulator.profile}`:'',c5.media?.reputation?`Media · ${c5.media.reputation}`:''].filter(Boolean)});
    }
    const lumerreStarted=!!story.completed?.crownWeek||!!story.completed?.practiceQualifying||!!story.completed?.raceWeekend||!!story.chapter6?.afterFlag?.started;
    if(lumerreStarted){
      const record=verdictWeekendRecord(story),done=!!story.completed?.afterFlag;
      entries.push({id:'lumerre',number:'06',status:done?'complete':'current',title:'The Lumerre Crown',location:'Lumerre · Crown Week',image:'story/chapter6/race/lumerre-crown-podium-stage.png',text:done?`${storyDragonName()} qualified P${record.qualifyingPosition||record.raceStartPosition||7} and finished P${record.raceFinishPosition||7} in the Lumerre Crown. ${record.playerOvertakes||0} overtakes were recorded; Tyrese finished P${record.tyreseFinish||7}.`:'Crown Week has moved from spectacle to race weekend. Practice, qualifying and the Lumerre Crown are now part of the permanent career file.',tags:[record.teamOrderChoice?`Team order · ${String(record.teamOrderChoice).toUpperCase()}`:'',record.firstCareerWin?'FIRST CAREER WIN':record.raceFinishPosition<=3?'PODIUM':''].filter(Boolean)});
    }
    if(story.completed?.afterFlag||story.chapter7?.started){
      const c7=verdictState(story),offer=c7.offer||{};
      entries.push({id:'verdict',number:'07',status:story.completed?.verdict?'complete':'current',title:'The Verdict',location:'Quickquill Headquarters',image:'story/environments/02_Quickquill_Hangar_Exterior.png',text:story.completed?.verdict?`Contract day ended with ${verdictDecisionSummary(c7)}. Quickquill's latest terms list ${offer.role||'Developing Racer'} over ${offer.length||2} season${Number(offer.length||2)===1?'':'s'}.`:'The assessment period is over. Quickquill has put real terms on the table, and the paddock has started asking whether those terms will be enough.',tags:[offer.status?`Status · ${String(offer.status).replaceAll('-',' ').toUpperCase()}`:'',c7.outsideInterest?.discovered?'Sunscale interest':''].filter(Boolean)});
    }
    if(story.chapter8?.started||story.completed?.seasonOpening){const c8=seasonState(story);entries.push({id:'season-opening',number:'08',status:story.completed?.seasonOpening?'complete':'current',title:'The First Full Season',location:'Quickquill · Opening Week',image:SEASON_CALENDAR_BG,text:story.completed?.seasonOpening?`Eight rounds are open. Preparation profile: ${c8.weeklyPlan.profile}. Pit-wall grade: ${c8.pitwall.grade}. Three self-selected promises now define the season.`:'Quickquill is turning a contract into a campaign: calendar intelligence, six preparation hours, a telemetry fault and a race-control simulation.',tags:[c8.calendar.ambition?`Ambition · ${String(c8.calendar.ambition).toUpperCase()}`:'',c8.raceMode?`Race mode · ${String(c8.raceMode).toUpperCase()}`:''].filter(Boolean)});}
    return entries;
  }

  function careerRaceRecords(story) {
    if (!story) return [];
    const records = [];
    if (story.race?.result) {
      const r = story.race.result;
      records.push({ id:'canto', number:'R01', title:'Canto Plains', subtitle:'Career Race One', image:'story/environments/05_Canto_Plains_Racing_Venue.png', rank:r.rank||6, start:r.startPosition||3, qualifying:null, finishMs:r.finishMs, bestLapMs:r.bestLapMs, overtakes:r.overtakes, positionDelta:r.positionDelta, leadChanges:r.leadChanges, photoFinish:r.photoFinish, strategy:story.race.strategy||currentCantoStrategy(story), moment:r.photoFinish?'A finish decided at the line':'First professional start completed.' });
    }
    if (story.blackglassRace?.result) {
      const r = story.blackglassRace.result, c4 = chapter4State(story);
      records.push({ id:'blackglass', number:'R02', title:'Blackglass Night Circuit', subtitle:'Career Race Two', image:'story/environments/25_Blackglass_Race_Track.png', rank:r.rank||6, start:r.startPosition||c4.qualifying?.position||3, qualifying:c4.qualifying?.position||r.startPosition||3, finishMs:r.finishMs, bestLapMs:r.bestLapMs, overtakes:r.overtakes, positionDelta:r.positionDelta, leadChanges:r.leadChanges, photoFinish:r.photoFinish, strategy:story.blackglassRace.strategy||currentBlackglassStrategy(story), moment:r.notableMoment || (r.photoFinish?'A finish decided at the line':'Blackglass completed under floodlights.'), sectors:blackglassStudiedText(story) });
    }
    if (story.completed?.raceWeekend || story.chapter6?.raceWeekend?.result) {
      const r=verdictWeekendRecord(story);
      records.push({id:'lumerre',number:'R03',title:'The Lumerre Crown',subtitle:'Career Race Three',image:'story/chapter6/race/lumerre-crown-full-map.png',rank:r.raceFinishPosition||7,start:r.raceStartPosition||r.qualifyingPosition||4,qualifying:r.qualifyingPosition||null,finishMs:r.finishMs,bestLapMs:r.bestLapMs,overtakes:r.playerOvertakes,positionDelta:(r.raceStartPosition||4)-(r.raceFinishPosition||7),leadChanges:r.leadChanges,photoFinish:r.photoFinish,strategy:'career-evolution',moment:r.notableMoment||'The Lumerre Crown completed under full race pressure.',sectors:r.teamOrderChoice&&r.teamOrderChoice!=='none'?`Team order · ${String(r.teamOrderChoice).toUpperCase()}`:''});
    }
    return records;
  }

  function relationshipState(id, story) {
    const rel = story?.relationships || {};
    const bands = {
      tyrese: [Number(rel.tyreseBond)||0, [[35,'Formal'],[45,'Warming'],[55,'Friendly'],[65,'Trusting'],[999,'Close']]],
      mara: [Number(rel.maraBond)||0, [[20,'Formal'],[30,'Professional'],[40,'Warming'],[55,'Trusting'],[999,'Trusted']]],
      nell: [Number(rel.nellBond)||0, [[20,'Formal'],[30,'Professional'],[40,'Warming'],[55,'Trusting'],[999,'Trusted']]],
      steward: [Number(rel.stewardRespect)||0, [[1,'Formal'],[3,'Noted'],[6,'Respected'],[999,'Trusted at Blackglass']]],
      rook: [Number(rel.rookRespect)||0, [[1,'Unknown'],[3,'Competitive'],[6,'Mutual respect'],[999,'Friendly rival']]],
      sofia: [Number(rel.valecroftInterest)||0, [[1,'Distant'],[3,'Interested'],[6,'Watching closely'],[999,'Open line']]],
      sunscale: [Number(rel.sunscaleInterest)||0, [[1,'No contact'],[3,'Enquiry'],[6,'Line open'],[999,'Active interest']]]
    };
    const [value, thresholds] = bands[id] || [0, [[999,'Unknown']]];
    for (const [limit,label] of thresholds) if (value < limit) return label;
    return thresholds[thresholds.length-1][1];
  }

  function careerRelationships(story) {
    if (!story) return [];
    const c3 = chapter3State(story), c4 = chapter4State(story), ah = c4.afterHours || {};
    const items = [
      { id:'tyrese', name:'Tyrese Bell', role:'Quickquill Team Captain', portrait:'story/portraits/downtime/tyrese/frame-06.png', available:true,
        description:'Tyrese increasingly treats you like a racer whose judgement matters, not simply the rookie he found after a junior race.',
        memories:[c3.eveningMoments?.includes('tyrese')?'Rooftop conversation at Quickquill':'', c4.pressureResponse?'Spoke honestly before the Blackglass trip':'', c4.eveningMoments?.includes('tyrese')?'Blackglass balcony conversation':'', story.blackglassRace?.result?'Shared a complete Blackglass weekend':''].filter(Boolean)},
      { id:'mara', name:'Mara Venn', role:'Quickquill Team Principal', portrait:'story/portraits/downtime/mara/frame-04.png', available:story.completed?.prologue || c3.roomKeyReceived,
        description:'Mara’s respect is practical. She notices preparation, judgement and whether you make Quickquill stronger when nobody is watching.',
        memories:[c3.roomKeyReceived?'Handed over the Quickquill room key':'', c3.duty?.completed?'Saw you pull your weight around HQ':'', c4.briefingTone?'Included you in the Blackglass briefing':'', c4.aftermath?'Asked what Blackglass taught you':''].filter(Boolean)},
      { id:'nell', name:'Nell Wren', role:'Quickquill Chief Engineer', portrait:'story/portraits/downtime/nell/frame-02.png', available:story.completed?.prologue,
        description:'Nell trusts evidence before speeches. Every useful question, clean setup choice and piece of telemetry moves the relationship forward.',
        memories:[c3.duty?.type==='equipment'?'Worked through equipment duty together':'', c4.studiedSections?.length?'Built the Blackglass sector study plan':'', c4.qualifying?.completed?'Reviewed Blackglass qualifying traces':'', c4.eveningMoments?.includes('nell')?'Spent the evening over telemetry':''].filter(Boolean)},
      { id:'steward', name:'Garran', role:'Blackglass Venue Steward', portrait:'story/portraits/blackglass/steward/frame-00.png', available:isBlackglassScene(story)||story.completed?.blackglass,
        description:'Blackglass staff do not care about hype. Garran remembers whether you respected the venue, the rules and the people who keep it running.',
        memories:[c4.stewardResponse?'First Blackglass registration':'', ah.passReturned?'Returned the dropped venue pass':'', ah.caught?'Caught during the after-hours expedition':'', story.blackglassRace?.result?'Saw you complete the Blackglass race':''].filter(Boolean)},
      { id:'rook', name:'Rook Calder', role:'Blackglass Local Racer', portrait:'story/portraits/blackglass/rook/frame-02.png', available:isBlackglassScene(story)||story.completed?.blackglass,
        description:'Rook measures people by what they do on difficult circuits. The relationship sits somewhere between local rivalry and earned respect.',
        memories:[c4.rookResponse?'First paddock exchange':'', c4.eveningMoments?.includes('rook')?'Traded Blackglass stories after qualifying':'', c4.localTip?'Shared a local circuit tip':'', story.blackglassRace?.result?'Compared notes after the race':''].filter(Boolean)}
    ];
    const c5=chapter5State(story);
    if (c5.sofia?.discovered) items.push({id:'sofia',name:'Sofia Mendes',role:'Valecroft Captain',portrait:'story/portraits/sofia.png',available:true,description:'Sofia’s interest is deliberately informal. That makes it harder to classify and easier to remember.',memories:['Messaged after Blackglass',c5.sofia.told?`Message disclosed to ${c5.sofia.told}`:'Message kept private',c5.sofia.reply?`Reply · ${String(c5.sofia.reply).replaceAll('-',' ')}`:'No reply sent'].filter(Boolean)});
    const c7=verdictState(story);
    if(c7.outsideInterest?.discovered) items.push({id:'sunscale',name:'Sunscale Racing',role:'Outside Contract Interest',portrait:'story/portraits/jalen.png',available:true,description:'Sunscale have not made an offer. They have done something more useful for negotiations: asked whether you are available.',memories:['Availability enquiry after Lumerre',c7.outsideInterest.response==='hear'?'Conversation left open':c7.outsideInterest.response==='tell'?'Enquiry disclosed to Mara':'Enquiry archived'].filter(Boolean)});
    return items.filter(item => item.available).map(item => ({...item, state:relationshipState(item.id,story), memories:item.memories.slice(0,4)}));
  }

  function careerMemories(story) {
    if (!story) return [];
    const c3=chapter3State(story), c4=chapter4State(story), ah=c4.afterHours||{}, items=[];
    if (c3.roomKeyReceived) items.push({id:'quickquill-key',title:'Quickquill Room Key',kicker:'A PLACE AT QUICKQUILL',image:'story/props/room-key.png',text:'The moment the accommodation wing stopped feeling like somewhere you were borrowing and started feeling like home.'});
    if (c3.memoryShelfUnlocked) items.push({id:'canto-keepsake',title:'Canto Keepsake',kicker:'CANTO PLAINS',image:'story/props/canto-keepsake.png',text:'A small reminder of the first professional weekend — before the results had time to become history.'});
    if (ah.timingFound) items.push({id:'midnight-timing',title:'Old Blackglass Timing Sheet',kicker:'AFTER HOURS',image:'story/after-hours/props/timing-sheet.png',text:`Found after midnight. The note on ${BLACKGLASS_SECTION_DEFS.find(s=>s.id===ah.bonusSection)?.name || 'an extra sector'} became genuine race knowledge.`});
    if (ah.secretFound) items.push({id:'0213',title:'Blackglass at 02:13',kicker:'SECRET MEMORY',image:'story/environments/29_Blackglass_Circuit_At_Rest.png',wide:true,text:'No crowd. No broadcast. Just rain, floodlights and a circuit that finally felt quiet.'});
    if (ah.passPocketed && c4.keepsake !== 'pass') items.push({id:'after-hours-pass',title:'Dropped Blackglass Pass',kicker:'AFTER HOURS',image:'story/after-hours/props/venue-pass.png',text:'A venue pass found after midnight and never quite returned to where it belonged.'});
    if (c4.keepsake==='pass') items.push({id:'blackglass-pass',title:'Stamped Blackglass Venue Pass',kicker:'BLACKGLASS',image:'story/props/blackglass/venue-pass.png',text:'Proof that the impossible-looking northern circuit eventually let you through the gate.'});
    if (c4.keepsake==='sheet') items.push({id:'blackglass-sheet',title:'Blackglass Qualifying Sheet',kicker:'BLACKGLASS',image:'story/props/blackglass/qualifying-sheet.png',text:`The imperfect lap that still put ${storyDragonName()} ${ordinal(c4.qualifying?.position||3)} on the grid.`});
    if (c4.keepsake==='card') items.push({id:'blackglass-card',title:'Blackglass Circuit Card',kicker:'BLACKGLASS',image:'story/props/blackglass/circuit-card.png',text:'A pocket map of a circuit that became less frightening one corner at a time.'});
    return items;
  }

  function careerInboxMessages(story) {
    if (!story) return [];
    const c3=chapter3State(story), c4=chapter4State(story), messages=[];
    messages.push({id:'welcome',from:'Tyrese Bell',subject:'Bring courage. We have goggles.',stamp:'QUICKQUILL · RECRUITMENT',important:true,available:true,body:`${storyDragonName()}, if you are reading this from the Career Hub, the impossible part already happened. You came through the door. The rest is just racing, work and an unreasonable amount of tea.`});
    messages.push({id:'canto',from:'Nell Wren',subject:'Canto file archived',stamp:'ENGINEERING · RACE ONE',available:!!story.race?.result,body:`Canto is in the archive: ${ordinal(story.race?.result?.rank||6)}, ${formatCareerTime(story.race?.result?.finishMs)}, ${Math.max(0,Number(story.race?.result?.overtakes)||0)} overtakes. Keep the useful parts. I already kept the telemetry.`});
    messages.push({id:'room',from:'Mara Venn',subject:'Accommodation allocation',stamp:'QUICKQUILL · HQ',available:!!c3.roomKeyReceived,body:`Third door past the noticeboard. The room is yours while you race for Quickquill. That means the key is your responsibility and the skirting board remains ${storyDragonName()}’s problem.`});
    messages.push({id:'blackglass-invite',from:'Race Operations',subject:'BLACKGLASS · travel accreditation',stamp:'OFFICIAL · RACE TWO',important:true,available:story.completed?.downtime||isBlackglassScene(story)||story.completed?.blackglass,body:'Travel accreditation confirmed. Northern route allocation attached to the team file. Blackglass paddock access is conditional on venue registration with Garran on arrival.'});
    messages.push({id:'qualifying',from:'Nell Wren',subject:`Grid confirmed · ${ordinal(c4.qualifying?.position||3)}`,stamp:'ENGINEERING · BLACKGLASS',available:!!c4.qualifying?.completed,body:`Qualifying is locked. Start position: ${ordinal(c4.qualifying?.position||3)}. Deep-study anchors: ${blackglassStudiedText(story)}. Do not spend tonight trying to find another three tenths in your head.`});
    messages.push({id:'blackglass-result',from:'Mara Venn',subject:'Blackglass debrief',stamp:'QUICKQUILL · RACE TWO',important:true,available:!!story.blackglassRace?.result,body:`Blackglass is complete: ${ordinal(story.blackglassRace?.result?.rank||6)} at the flag. The result matters. So do the choices that got you there. We will discuss both when everybody has slept.`});
    const c5=chapter5State(story);
    messages.push({id:'seat',from:'Quickquill Team Office',subject:'TEAM REVIEW · 09:00',stamp:'CAREER · CHAPTER FIVE',important:true,available:!!story.completed?.blackglass,body:story.completed?.seat?'Review archived. Simulator, media and Lumerre preparation have been added to the Career file.':'Strategy room. Attendance required. Blackglass is archived; the review is not.'});
    messages.push({id:'media-clipping',from:'Quickquill Media Desk',subject:`Press profile · ${c5.media?.reputation||deriveMediaReputation(story)}`,stamp:'MEDIA · LUMERRE PREVIEW',available:!!c5.media?.completed,body:`Three questions answered. Current media profile: ${c5.media?.reputation||deriveMediaReputation(story)}. Lead clipping: ${c5.media?.headlines?.[0]||'No clipping selected.'}`});
    messages.push({id:'sofia-message',from:'Sofia Mendes',subject:'Five minutes before Lumerre',stamp:'PRIVATE · PADDOCK',important:true,available:!!c5.sofia?.discovered,body:'Good job at Blackglass. If you have five minutes before Lumerre, come find me. — Sofia'});
    messages.push({id:'lumerre-file',from:'Mara Venn',subject:'Lumerre · role confirmed',stamp:'QUICKQUILL · RACE THREE',important:true,available:!!story.completed?.seat,body:`Role: ${c5.lumerreRole||deriveLumerreRole(story)}. Development direction: ${String(c5.developmentPriority||'control').toUpperCase()}. Pack for sunlight. We leave on schedule.`});
    const c7=verdictState(story);
    messages.push({id:'verdict-call',from:'Mara Venn',subject:'QUICKQUILL HQ · MONDAY 09:00',stamp:'PRIVATE · CONTRACT',important:true,available:!!story.completed?.afterFlag,body:story.completed?.verdict?`Meeting archived. ${verdictDecisionSummary(c7)}.`:'Head office. Monday. 09:00. Private meeting. Bring the Lumerre result sheet; leave the press clippings at home.'});
    messages.push({id:'sunscale-interest',from:'Unknown · Sunscale management',subject:'Availability enquiry',stamp:'PADDOCK · PRIVATE',important:true,available:!!c7.outsideInterest?.discovered,body:c7.outsideInterest?.response==='hear'?'We understand your Quickquill terms are not final. If you want to hear what Sunscale are thinking, the line is open.':c7.outsideInterest?.response==='tell'?'The enquiry was forwarded to Quickquill. No further contact has been made.':'Enquiry archived without response.'});
    const c8=seasonState(story);
    messages.push({id:'season-calendar',from:'Mara Venn',subject:'Eight rounds. Tuesday. Strategy floor.',stamp:'SEASON · OPENING WEEK',important:true,available:!!story.completed?.verdict,body:story.completed?.seasonOpening?`Opening week archived. ${c8.weeklyPlan.profile} preparation profile; ${c8.pitwall.grade} pit-wall grade. Round One is Velmora City.`:'You signed for a full season. Tomorrow we stop talking about the contract and start deciding what to do with it. Strategy floor, 09:00.'});
    const read = new Set((story.careerHub?.inboxRead||[]).map(String));
    return messages.filter(m=>m.available).map(m=>({...m,read:read.has(m.id)}));
  }

  function careerCalendarEvents(story) {
    if (!story) return [];
    const cantoStarted=QUICKQUILL_CANTO_SCENES.some(scene=>scene.id===story.scene)||story.completed?.canto;
    const downtimeStarted=isDowntimeScene(story)||story.completed?.downtime;
    const blackglassStarted=isBlackglassScene(story)||story.completed?.blackglass;
    const seatStarted=isSeatScene(story)||story.completed?.seat;
    const lumerreStarted=!!story.completed?.crownWeek||!!story.completed?.practiceQualifying||!!story.completed?.raceWeekend||!!story.chapter6?.afterFlag?.started;
    const lumerreComplete=!!story.completed?.afterFlag;
    const verdictStarted=!!story.chapter7?.started||story.chapter==='verdict'||!!story.completed?.verdict;
    const rows=[
      {id:'scout',day:'01',title:'Scouted',place:'Young Velmora League',detail:'Tyrese stays after the race.',complete:!!story.completed?.prologue,current:!story.completed?.prologue},
      {id:'canto',day:'02',title:'Canto race weekend',place:'Canto Plains',detail:'Preparation · grid · first professional start.',complete:!!story.completed?.canto,current:!!story.completed?.prologue&&!story.completed?.canto&&cantoStarted},
      {id:'hq',day:'03',title:'Quickquill downtime',place:'Quickquill HQ',detail:'Room · team duties · first evening · Blackglass invitation.',complete:!!story.completed?.downtime,current:!!story.completed?.canto&&!story.completed?.downtime&&downtimeStarted},
      {id:'blackglass',day:'04',title:'Blackglass weekend',place:'Northern Circuit',detail:'Arrival · circuit study · qualifying · After Hours · race.',complete:!!story.completed?.blackglass,current:!!story.completed?.downtime&&!story.completed?.blackglass&&blackglassStarted},
      {id:'table',day:'05',title:'A Seat at the Table',place:'Quickquill',detail:'Strategy simulator · press · career politics · free time.',complete:!!story.completed?.seat,current:!!story.completed?.blackglass&&!story.completed?.seat&&seatStarted,upcoming:!!story.completed?.blackglass&&!seatStarted},
      {id:'lumerre',day:'06',title:'The Lumerre Crown',place:'Crown Week · Lumerre',detail:'Festival · practice · qualifying · Race Three · After the Flag.',complete:lumerreComplete,current:lumerreStarted&&!lumerreComplete,upcoming:!!story.completed?.seat&&!lumerreStarted},
      {id:'verdict',day:'07',title:'The Verdict',place:'Quickquill HQ · 09:00',detail:'Board review · contract terms · outside interest · career decision.',complete:!!story.completed?.verdict,current:lumerreComplete&&!story.completed?.verdict&&verdictStarted,upcoming:lumerreComplete&&!verdictStarted},
      {id:'season',day:'08',title:'First Full Season',place:'Championship calendar',detail:'Calendar · preparation · telemetry · pit wall · self-chosen objectives.',complete:!!story.completed?.seasonOpening,current:!!story.completed?.verdict&&!story.completed?.seasonOpening&&!!story.chapter8?.started,upcoming:!!story.completed?.verdict&&!story.chapter8?.started}
    ];
    let currentSeen=false;
    return rows.map((row,index)=>{
      let status=row.complete?'complete':row.current?'current':row.upcoming?'next':'locked';
      if(status==='current') currentSeen=true;
      if(!currentSeen && status==='locked' && index>0 && rows[index-1].complete) status='next';
      return {...row,status};
    });
  }

  function careerIdentity(story) {
    const values=[['heart',Number(story?.identity?.heart)||0],['fire',Number(story?.identity?.fire)||0],['focus',Number(story?.identity?.focus)||0]].sort((a,b)=>b[1]-a[1]);
    const label={heart:'Grounded',fire:'Competitive',focus:'Analytical'};
    return { primary:label[values[0]?.[0]]||'Developing', key:values[0]?.[0]||'heart', values };
  }

  function careerDragonTraits(story) {
    if (!story) return [];
    const c3=chapter3State(story), c4=chapter4State(story), ah=c4.afterHours||{}, identity=careerIdentity(story), traits=[];
    traits.push(identity.primary);
    const attitude={confident:'Confident',analytical:'Self-critical learner',grounded:'Team-minded',hungry:'Hungry competitor'}[c3.cantoAttitude];
    if(attitude) traits.push(attitude);
    if(Number(story.relationships?.dragonBond)>=60) traits.push('Dragon-first');
    if(Number(story.relationships?.quickquillTrust)>=58) traits.push('Quickquill loyal');
    if(ah.secretFound) traits.push('Explorer');
    else if(ah.timingFound) traits.push('Technical eye');
    if(c4.blackglassInitialAttitude==='curious'||story.choices?.blackglassInitialAttitude?.value==='curious') traits.push('Curious');
    if((story.race?.result?.rank||99)<=3||(story.blackglassRace?.result?.rank||99)<=3) traits.push('Podium proven');
    const c5=chapter5State(story);
    if(c5.simulator?.completed && c5.simulator?.profile) traits.push(c5.simulator.profile.replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase()));
    return [...new Set(traits)].slice(0,6);
  }

  function careerDragonProfile(story) {
    const dragon=careerDragon(state.activeSave), evolution=story?syncCareerEvolution(story):defaultCareerEvolution(), records=evolution.records||{};
    const starts=Math.max(0,Number(records.starts)||0), wins=Math.max(0,Number(records.wins)||0), podiums=Math.max(0,Number(records.podiums)||0), best=Number(records.bestFinish)||0;
    const c4=story?chapter4State(story):null, strategies=story?[story.race?.result?currentCantoStrategy(story):'',story.blackglassRace?.result?currentBlackglassStrategy(story):''].filter(Boolean):[];
    const identity=story?careerIdentity(story):{primary:'Developing'};
    const bond=Number(story?.relationships?.dragonBond)||0;
    const bondLabel=bond>=65?'In sync':bond>=55?'Strong':bond>=45?'Connected':'Developing';
    return {dragon,starts,wins,podiums,best,identity:identity.primary,bond:bondLabel,traits:careerDragonTraits(story),strategies:[...new Set(strategies)],chapter:careerCurrentChapter(story),studied:c4?blackglassStudiedText(story):'',phase:careerPhaseLabel(evolution.careerPhase),style:evolution.playerStyle,fame:evolution.fameTier,recentForm:evolution.recentForm||[]};
  }

  function careerDeskBarMarkup() {
    const story=careerHubStory(), inbox=careerInboxMessages(story), unread=inbox.filter(message=>!message.read).length, chapter=careerCurrentChapter(story);
    return `<section class="career-desk-bar" aria-label="Career progression">
      <div class="career-desk-summary"><small>${escapeHtml(chapter.eyebrow)}</small><strong>${escapeHtml(chapter.title)}</strong><span>${escapeHtml(chapter.note)}</span></div>
      <nav class="career-desk-tabs" aria-label="Career progression sections">
        ${CAREER_DESK_PANELS.map(panel=>`<button type="button" data-career-panel="${panel.id}" class="${state.hubPanel===panel.id?'is-active':''}"><b>${panel.mark}</b><span>${escapeHtml(panel.short)}</span>${panel.id==='inbox'&&unread?`<i>${unread}</i>`:''}</button>`).join('')}
      </nav>
    </section>`;
  }

  function careerDeskEmpty(title, text) {
    return `<div class="career-desk-empty"><b>—</b><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></div>`;
  }

  function careerJournalMarkup(story) {
    const entries=careerJournalEntries(story);
    if(!entries.length) return careerDeskEmpty('Your journal is waiting','Start the Quickquill story and the Career archive will write itself from your actual choices.');
    return `<div class="career-journal-timeline">${entries.map(entry=>`<article class="career-journal-entry is-${entry.status}">
      <div class="career-journal-number"><span>${entry.number}</span><i></i></div>
      <div class="career-journal-image"><img loading="lazy" decoding="async" src="${entry.image}" alt=""></div>
      <div class="career-journal-copy"><small>${escapeHtml(entry.status==='complete'?'ARCHIVED':'CURRENT CHAPTER')} · ${escapeHtml(entry.location)}</small><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.text)}</p>${entry.tags?.length?`<div class="career-desk-tags">${entry.tags.map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}</div>`:''}</div>
    </article>`).join('')}</div>`;
  }

  function careerRaceRecordsMarkup(story) {
    const records=careerRaceRecords(story);
    if(!records.length) return careerDeskEmpty('No Career races recorded yet','Career story races will appear here after the flag. Normal Dragon Racing records remain separate.');
    return `<div class="career-records-grid">${records.map(record=>`<article class="career-record-card">
      <div class="career-record-hero"><img loading="lazy" decoding="async" src="${record.image}" alt=""><span>${record.number}</span><strong>${ordinal(record.rank)}</strong></div>
      <header><small>${escapeHtml(record.subtitle)}</small><h3>${escapeHtml(record.title)}</h3><p>${escapeHtml(record.moment)}</p></header>
      <div class="career-record-stats"><span><small>FINISH</small><b>${ordinal(record.rank)}</b></span><span><small>START</small><b>${ordinal(record.start)}</b></span>${record.qualifying?`<span><small>QUALIFY</small><b>${ordinal(record.qualifying)}</b></span>`:''}<span><small>TIME</small><b>${formatCareerTime(record.finishMs)}</b></span><span><small>BEST LAP</small><b>${formatCareerTime(record.bestLapMs)}</b></span><span><small>OVERTAKES</small><b>${Math.max(0,Number(record.overtakes)||0)}</b></span></div>
      <footer><span>${escapeHtml(String(record.strategy||'focus').toUpperCase())} APPROACH</span>${record.sectors?`<span>${escapeHtml(record.sectors)}</span>`:''}${record.photoFinish?'<span>PHOTO FINISH</span>':''}</footer>
    </article>`).join('')}</div>`;
  }

  function careerRivalryLabel(id, evolution) {
    const entry = evolution?.rivalries?.[id] || defaultCareerRivalry();
    const intensity = Number(entry.intensity) || 0;
    const respect = Number(entry.respect) || 0;
    if (id === 'tyrese') {
      const tension = Number(evolution?.tyrese?.competitiveTension) || 0;
      if (tension >= 55) return 'Teammate · intense competition';
      if (tension >= 30) return 'Teammate · competitive edge';
      if ((Number(evolution?.tyrese?.professionalRespect)||0) >= 50) return 'Trusted senior teammate';
      return 'Senior teammate';
    }
    if (intensity >= 65 && respect >= 45) return 'Heated mutual rivalry';
    if (intensity >= 65) return 'Heated rivalry';
    if (intensity >= 38 && respect >= 30) return 'Respectful rivalry';
    if (intensity >= 25) return 'Competitive interest';
    if (respect >= 30) return 'Professional respect';
    if (intensity >= 10) return 'On the radar';
    return 'Paddock neutral';
  }

  function careerRacecraftBand(value) {
    const score = Number(value) || 0;
    if (score >= 78) return 'Elite';
    if (score >= 68) return 'Front-running';
    if (score >= 58) return 'Strong';
    if (score >= 48) return 'Competitive';
    if (score >= 40) return 'Developing';
    return 'Rookie';
  }

  function careerEvolutionMarkup(story) {
    if (!story) return careerDeskEmpty('Career evolution is waiting','Complete Career races and the sporting profile will build itself from the results you actually earn.');
    const evolution = syncCareerEvolution(story);
    const records = evolution.records || {};
    const window = evolution.nextRaceWindow || careerPerformanceWindow((Number(records.starts)||0)+1);
    const recent = [...(evolution.recentForm || [])].reverse();
    const visibleRivals = CAREER_RIVAL_IDS
      .map(id => ({id, racer:CAREER_RACER_AI[id], data:evolution.rivalries[id]}))
      .filter(item => item.id === 'tyrese' || Number(item.data?.intensity) >= 5 || Number(item.data?.respect) >= 8)
      .sort((a,b) => (b.id==='tyrese'?100:0)+(Number(b.data?.intensity)||0)+(Number(b.data?.respect)||0) - ((a.id==='tyrese'?100:0)+(Number(a.data?.intensity)||0)+(Number(a.data?.respect)||0)))
      .slice(0,4);
    const milestones = evolution.lastMilestones || [];
    const best = Number(records.bestFinish) ? ordinal(Number(records.bestFinish)) : '—';
    const expectedText = `${ordinal(window.expected?.[0] || 1)}–${ordinal(window.expected?.[1] || 3)}`;
    const racecraftRows = [
      ['PACE',evolution.racecraft.pace],
      ['OVERTAKING',evolution.racecraft.overtaking],
      ['DEFENDING',evolution.racecraft.defending],
      ['CONSISTENCY',evolution.racecraft.consistency],
      ['STAMINA MANAGEMENT',evolution.racecraft.staminaManagement],
      ['PRESSURE HANDLING',evolution.racecraft.pressureHandling]
    ];
    const debugMarkup=isCatAsthmaTester()?`<details class="career-evolution-debug"><summary>ADMIN · CAREER EVOLUTION DEBUG</summary><pre>${escapeHtml(JSON.stringify({phase:evolution.careerPhase,racecraft:evolution.racecraft,reputation:evolution.reputation,records:evolution.records,tyrese:evolution.tyrese,rivalries:evolution.rivalries,nextRaceWindow:evolution.nextRaceWindow,chapterTypesUsed:evolution.chapterTypesUsed},null,2))}</pre></details>`:'';
    return `<div class="career-evolution-profile">
      <section class="career-evolution-hero">
        <div><small>DRAGONBOUND CAREER EVOLUTION · SAVE-SPECIFIC</small><h2>${escapeHtml(careerPhaseLabel(evolution.careerPhase))}</h2><p>${escapeHtml(evolution.playerStyle)} · ${escapeHtml(evolution.fameTier)}</p></div>
        <span><small>NEXT RACE EXPECTATION</small><strong>${escapeHtml(expectedText)}</strong><em>${escapeHtml(window.note || '')}</em></span>
      </section>
      <section class="career-evolution-statline">
        <article><small>STARTS</small><strong>${Math.max(0,Number(records.starts)||0)}</strong></article>
        <article><small>PODIUMS</small><strong>${Math.max(0,Number(records.podiums)||0)}</strong></article>
        <article><small>WINS</small><strong>${Math.max(0,Number(records.wins)||0)}</strong></article>
        <article><small>BEST FINISH</small><strong>${escapeHtml(best)}</strong></article>
        <article><small>CAREER OVERTAKES</small><strong>${Math.max(0,Number(records.overtakes)||0)}</strong></article>
      </section>
      <div class="career-evolution-main">
        <section class="career-evolution-card career-evolution-racecraft"><header><small>RACING DEVELOPMENT</small><h3>${escapeHtml(evolution.playerStyle)}</h3><p>The numbers stay under the hood; this is the sporting shape your actual races are producing.</p></header><div>${racecraftRows.map(([label,value])=>`<span style="--evo:${clampCareerValue(value)}%"><small>${label}</small><b>${escapeHtml(careerRacecraftBand(value))}</b><i><em></em></i></span>`).join('')}</div></section>
        <section class="career-evolution-card"><header><small>RECENT FORM</small><h3>${recent.length ? 'Last career races' : 'No race form yet'}</h3></header><div class="career-form-strip">${recent.length?recent.map(item=>`<span class="${Number(item.finish)<=3?'is-podium':''} ${Number(item.finish)===1?'is-win':''}"><small>${escapeHtml(item.event)}</small><strong>${ordinal(item.finish)}</strong><em>${Math.max(0,Number(item.overtakes)||0)} OVT</em></span>`).join(''):'<p>Complete Canto and Blackglass to build a sporting form line.</p>'}</div>${milestones.length?`<div class="career-milestones"><small>CAREER MILESTONES</small>${milestones.map(item=>`<b>${escapeHtml(item)}</b>`).join('')}</div>`:''}</section>
        <section class="career-evolution-card"><header><small>PADDOCK STATUS</small><h3>${escapeHtml(evolution.fameTier)}</h3><p>${escapeHtml(careerPhaseLabel(evolution.careerPhase))} · Quickquill trust and public expectation now move with results.</p></header><div class="career-reputation-grid"><span><small>FAME</small><b>${escapeHtml(evolution.fameTier)}</b></span><span><small>PADDOCK RESPECT</small><b>${escapeHtml(careerRacecraftBand(evolution.reputation.paddockRespect+25))}</b></span><span><small>MEDIA</small><b>${escapeHtml(story.chapter5?.media?.reputation || 'Developing')}</b></span><span><small>PRESSURE</small><b>${escapeHtml((Number(evolution.reputation.pressure)||0)>=55?'High':(Number(evolution.reputation.pressure)||0)>=30?'Building':'Manageable')}</b></span></div></section>
        <section class="career-evolution-card"><header><small>COMPETITIVE RELATIONSHIPS</small><h3>The grid remembers</h3><p>Close races, overtakes, contact and repeated comparisons build these naturally.</p></header><div class="career-rivalry-list">${visibleRivals.length?visibleRivals.map(item=>`<span><i>${escapeHtml(item.racer.name.slice(0,1))}</i><p><strong>${escapeHtml(item.racer.name)}</strong><small>${escapeHtml(careerRivalryLabel(item.id,evolution))}</small></p><em>${Math.max(0,Number(item.data?.battles)||0)} BATTLES</em></span>`).join(''):'<p class="career-muted">No rivalry has earned a label yet.</p>'}</div></section>
      </div>
      <footer class="career-evolution-footer"><span><small>FIRST PODIUM</small><b>${evolution.firsts?.firstPodium?escapeHtml(evolution.firsts.firstPodium.event):'—'}</b></span><span><small>FIRST WIN</small><b>${evolution.firsts?.firstWin?escapeHtml(evolution.firsts.firstWin.event):'STILL AHEAD'}</b></span><span><small>TEAM ORDERS</small><b>${Math.max(0,(evolution.teamOrders||[]).length)} RECORDED</b></span></footer>
      ${debugMarkup}
    </div>`;
  }

  function careerRelationshipsMarkup(story) {
    const people=careerRelationships(story);
    if(!people.length) return careerDeskEmpty('The paddock is still quiet','Relationships will appear as the Quickquill campaign introduces people who can remember your choices.');
    return `<div class="career-relationships-grid">${people.map(person=>`<article class="career-relationship-card">
      <div class="career-relationship-portrait"><img loading="lazy" decoding="async" src="${person.portrait}" alt=""></div>
      <div class="career-relationship-copy"><small>${escapeHtml(person.role)}</small><h3>${escapeHtml(person.name)}</h3><strong>${escapeHtml(person.state)}</strong><p>${escapeHtml(person.description)}</p>${person.memories.length?`<ul>${person.memories.map(memory=>`<li>${escapeHtml(memory)}</li>`).join('')}</ul>`:'<p class="career-muted">First impressions are still forming.</p>'}</div>
    </article>`).join('')}</div>`;
  }

  function careerMemoriesMarkup(story) {
    const memories=careerMemories(story);
    if(!memories.length) return careerDeskEmpty('The shelf is still empty','Only objects and memories you actually earn or discover will appear here.');
    return `<div class="career-memory-grid">${memories.map(memory=>`<article class="career-memory-card ${memory.wide?'is-wide':''}"><div class="career-memory-art"><img loading="lazy" decoding="async" src="${memory.image}" alt=""></div><small>${escapeHtml(memory.kicker)}</small><h3>${escapeHtml(memory.title)}</h3><p>${escapeHtml(memory.text)}</p></article>`).join('')}</div>`;
  }

  function careerInboxMarkup(story) {
    const messages=careerInboxMessages(story);
    if(!messages.length) return careerDeskEmpty('No team messages yet','Important team communications will collect here as the Career story progresses.');
    const selectedId=state.hubInboxId&&messages.some(message=>message.id===state.hubInboxId)?state.hubInboxId:messages[0].id;
    const selected=messages.find(message=>message.id===selectedId)||messages[0];
    return `<div class="career-inbox-layout"><div class="career-inbox-list">${messages.map(message=>`<button type="button" data-career-inbox="${message.id}" class="${selected.id===message.id?'is-selected':''} ${message.read?'is-read':'is-unread'}"><i></i><span><small>${escapeHtml(message.from)} · ${escapeHtml(message.stamp)}</small><strong>${escapeHtml(message.subject)}</strong></span>${message.important?'<b>IMPORTANT</b>':''}</button>`).join('')}</div><article class="career-inbox-message"><small>${escapeHtml(selected.stamp)}</small><h3>${escapeHtml(selected.subject)}</h3><span>FROM · ${escapeHtml(selected.from)}</span><p>${escapeHtml(selected.body)}</p><footer>${selected.read?'READ':'UNREAD'} · SAVED TO CAREER FILE</footer></article></div>`;
  }

  function careerCalendarMarkup(story) {
    const events=careerCalendarEvents(story), current=events.find(event=>event.status==='current')||events.find(event=>event.status==='next')||events[events.length-1];
    return `<div class="career-calendar-layout"><section class="career-next-event"><small>NEXT / CURRENT</small><h3>${escapeHtml(current?.title||'Career schedule')}</h3><strong>${escapeHtml(current?.place||'Quickquill')}</strong><p>${escapeHtml(current?.detail||'The next event will appear here when the story advances.')}</p></section><div class="career-calendar-list">${events.map(event=>`<article class="is-${event.status}"><div><small>SEQUENCE</small><b>${event.day}</b></div><span><small>${escapeHtml(event.status.toUpperCase())}</small><strong>${escapeHtml(event.title)}</strong><p>${escapeHtml(event.place)} · ${escapeHtml(event.detail)}</p></span><i>${event.status==='complete'?'✓':event.status==='current'?'NOW':event.status==='next'?'NEXT':'—'}</i></article>`).join('')}</div></div>`;
  }

  function careerDragonMarkup(story) {
    const profile=careerDragonProfile(story), dragon=profile.dragon, activeTeam=TEAMS.find(team=>team.id===state.activeSave?.team_id);
    if(!dragon) return careerDeskEmpty('Dragon profile unavailable','This account does not yet have a mapped Dragonbound Career dragon.');
    const avatar=activeTeam?`team-avatars/${activeTeam.id}/${dragon.asset}`:dragon.asset;
    const tendencies=profile.strategies.length?profile.strategies.map(value=>value.toUpperCase()).join(' / '):'Still developing';
    return `<div class="career-dragon-profile"><section class="career-dragon-hero"><div class="career-dragon-backdrop"></div><img loading="lazy" decoding="async" src="${avatar}" alt="${escapeHtml(dragon.name)}"><div><small>${escapeHtml(activeTeam?.sponsor||state.activeSave?.sponsor||'CAREER')} · RACER PROFILE</small><h2>${escapeHtml(dragon.name)}</h2><span>${escapeHtml(profile.phase)} · ${escapeHtml(profile.chapter.title)}</span></div></section><section class="career-dragon-overview"><div class="career-dragon-statline"><span><small>STARTS</small><b>${profile.starts}</b></span><span><small>PODIUMS</small><b>${profile.podiums}</b></span><span><small>WINS</small><b>${profile.wins}</b></span><span><small>BEST</small><b>${profile.best?ordinal(profile.best):'—'}</b></span></div><div class="career-dragon-details"><article><small>CAREER PHASE</small><h3>${escapeHtml(profile.phase)}</h3><p>Your sporting status now moves with results, consistency and the quality of opposition you beat.</p></article><article><small>RACING IDENTITY</small><h3>${escapeHtml(profile.style)}</h3><p>Derived from racecraft, Focus / Fire / Heart decisions and the Chapter Five simulator profile.</p></article><article><small>PADDOCK STATUS</small><h3>${escapeHtml(profile.fame)}</h3><p>Recognition grows naturally through podiums, wins, battles and media moments.</p></article><article><small>DRAGON BOND</small><h3>${escapeHtml(profile.bond)}</h3><p>The partnership state remains part of the Career file without becoming an arcade stat.</p></article></div><div class="career-trait-list"><small>CAREER TRAITS</small>${profile.traits.length?profile.traits.map(trait=>`<span>${escapeHtml(trait)}</span>`).join(''):'<span>Developing</span>'}</div><div class="career-trait-list"><small>RACE APPROACHES</small><span>${escapeHtml(tendencies)}</span></div></section></div>`;
  }

  function careerDeskBodyMarkup(panelId, story) {
    if(!story && state.activeSave?.team_id!=='quickquill') return careerDeskEmpty('Campaign archive not active',`${state.activeSave?.sponsor||'This team'} does not have a story campaign in this build yet. The Career Desk is ready to populate when that campaign is added.`);
    if(panelId==='records') return careerRaceRecordsMarkup(story);
    if(panelId==='evolution') return careerEvolutionMarkup(story);
    if(panelId==='relationships') return careerRelationshipsMarkup(story);
    if(panelId==='memories') return careerMemoriesMarkup(story);
    if(panelId==='inbox') return careerInboxMarkup(story);
    if(panelId==='calendar') return careerCalendarMarkup(story);
    if(panelId==='dragon') return careerDragonMarkup(story);
    return careerJournalMarkup(story);
  }

  function careerDeskOverlayMarkup() {
    if(!state.hubPanel) return '';
    const panel=careerDeskPanelDefinition(), story=careerHubStory(), inbox=careerInboxMessages(story), unread=inbox.filter(message=>!message.read).length;
    return `<section class="career-desk-overlay" role="dialog" aria-modal="true" aria-label="${escapeHtml(panel.label)}">
      <div class="career-desk-frame">
        <header class="career-desk-header"><div><small>DRAGONBOUND CAREER · PROGRESSION</small><h2>${escapeHtml(panel.label)}</h2></div><button type="button" data-career-panel-close aria-label="Close Career Desk"><span>ESC</span><b>×</b></button></header>
        <aside class="career-desk-nav">${CAREER_DESK_PANELS.map(item=>`<button type="button" data-career-panel="${item.id}" class="${state.hubPanel===item.id?'is-active':''}"><b>${item.mark}</b><span><strong>${escapeHtml(item.label)}</strong><small>${item.id==='inbox'&&unread?`${unread} UNREAD`:'CAREER FILE'}</small></span><i>›</i></button>`).join('')}<div class="career-hq-shortcuts"><small>QUICKQUILL HQ</small><button type="button" data-career-panel="memories">Your room / shelf</button><button type="button" data-career-panel="relationships">Team relationships</button><button type="button" data-career-panel="calendar">Race board</button></div></aside>
        <main class="career-desk-content">${careerDeskBodyMarkup(panel.id,story)}</main>
      </div>
    </section>`;
  }

  async function persistCareerHubRead(messageId) {
    const current=careerHubStory();
    if(!current||!state.client||!state.user||!state.activeSave) return;
    const read=new Set((current.careerHub?.inboxRead||[]).map(String));
    if(!read.has(messageId)) read.add(String(messageId));
    const changed=cloneValue(current);
    changed.careerHub={...(changed.careerHub||{}),inboxRead:[...read].slice(-64)};
    state.story=changed;
    try {
      const timestamp=new Date().toISOString(), previousState=activeSaveState(), saveState={...previousState,version:SAVE_VERSION,story:changed};
      const {data,error}=await state.client.from(SAVE_TABLE).update({state:saveState,updated_at:timestamp,last_played_at:timestamp}).eq('id',state.activeSave.id).eq('user_id',state.user.id).select('id,user_id,owner_username,save_name,team_id,sponsor,racer,state,created_at,updated_at,last_played_at').single();
      if(error) throw error;
      if(data?.id){state.activeSave=data;state.story=normaliseQuickquillStory(data.state?.story);state.saves=state.saves.map(save=>save.id===data.id?data:save);}
    } catch(error) {
      console.warn('[Dragonbound Career Mode] Inbox read state could not be synced',error);
      state.status='Message opened · read status will retry next time';
    }
  }

  function openCareerPanel(panelId) {
    if(!CAREER_DESK_PANELS.some(panel=>panel.id===panelId)) return;
    if(state.activeSave?.team_id==='quickquill'&&!state.story) state.story=normaliseQuickquillStory(activeSaveState().story);
    state.hubPanel=panelId;
    if(panelId!=='inbox') state.hubInboxId='';
    playTone(235+CAREER_DESK_PANELS.findIndex(panel=>panel.id===panelId)*13);
    render();
  }

  async function saveDowntimeSameBeat(changed) {
    try {
      await persistStory(changed, { stageOverride: 'quickquill-downtime-story' });
      state.storyError = '';
      render();
      return true;
    } catch (error) {
      console.error('[Dragonbound Career Mode] Downtime autosave failed', error);
      state.storySaving = false;
      state.storyError = error?.message || 'This moment could not be saved. Try again.';
      render();
      return false;
    }
  }

  async function completeDowntimeBeat(mutator = null) {
    if (state.storySaving || state.transitionLocked) return;
    const changed = cloneValue(state.story);
    if (typeof mutator === 'function') mutator(changed);
    changed.history = [...(changed.history || []), { scene: changed.scene, beat: changed.beat, event: 'downtime-interaction-complete' }].slice(-100);
    const next = nextStoryPointer(changed);
    state.downtimeMessage = '';
    await saveStoryProgress(next.story, { transition: next.changedScene });
  }

  async function saveBlackglassSameBeat(changed) {
    try {
      await persistStory(changed, { stageOverride: 'quickquill-blackglass-story' });
      state.storyError = '';
      render();
      return true;
    } catch (error) {
      console.error('[Dragonbound Career Mode] Blackglass autosave failed', error);
      state.storySaving = false;
      state.storyError = error?.message || 'This Blackglass moment could not be saved. Try again.';
      render();
      return false;
    }
  }

  async function completeBlackglassBeat(mutator = null) {
    if (state.storySaving || state.transitionLocked) return;
    const changed = cloneValue(state.story);
    if (typeof mutator === 'function') mutator(changed);
    changed.history = [...(changed.history || []), { scene: changed.scene, beat: changed.beat, event: 'blackglass-interaction-complete' }].slice(-120);
    const next = nextStoryPointer(changed);
    state.blackglassMessage = '';
    state.blackglassActivity = '';
    await saveStoryProgress(next.story, { transition: next.changedScene });
  }

  function blackglassWeekendStatusMarkup(story = state.story) {
    const c4 = chapter4State(story);
    const standing = blackglassStandingBand(story);
    const standingLabel = standing === 'respected' ? 'RESPECTED' : standing === 'cold' ? 'FROSTY' : 'UNKNOWN';
    return `<div class="blackglass-weekend-status">
      <span><small>PADDOCK</small><b>${standingLabel}</b></span>
      <span><small>GRID</small><b>${c4.qualifying?.completed ? ordinal(c4.qualifying.position || 3) : '—'}</b></span>
      <span><small>DRAGON</small><b>${escapeHtml(blackglassDragonStateLabel(story).toUpperCase())}</b></span>
    </div>`;
  }

  const BLACKGLASS_PADDOCK_SPOTS = {
    pass:{title:'VENUE PASS',text:'Blackglass does not print “rookie” anywhere on the pass. It does not need to. Garran has already memorised the face.'},
    track:{title:'VIEWING RAIL',text:'From here the circuit is all wet geometry and floodlight. The grandstand looks close enough to touch and the sea looks much too far down.'},
    crates:{title:'QUICKQUILL CASES',text:'Nell has labelled one case “DO NOT DROP” and another “DO NOT LET TYRESE OPEN.” The second is considerably more secure.'},
    dragon:{title:'PADDOCK EDGE',text:'[PLAYER_DRAGON] watches the track, then the rain, then you. The order feels deliberate.'}
  };

  function blackglassPaddockMarkup() {
    const c4 = chapter4State();
    const seen = c4.paddockSeen || [];
    return `<section class="blackglass-interaction-card is-paddock">
      <header><div><small>BLACKGLASS ARRIVAL</small><h2>Take the place in.</h2><p>Look around before Garran finishes registration. Three stops are enough; all four are there if you want them.</p></div><b>${seen.length}/4</b></header>
      ${blackglassWeekendStatusMarkup()}
      <div class="blackglass-paddock-actions">
        ${Object.entries(BLACKGLASS_PADDOCK_SPOTS).map(([id,spot])=>`<button type="button" data-bg-paddock="${id}" class="${seen.includes(id)?'is-seen':''}"><span>${escapeHtml(spot.title)}</span><i>${seen.includes(id)?'SEEN':'LOOK'}</i></button>`).join('')}
      </div>
      ${state.blackglassMessage ? `<div class="blackglass-message">${escapeHtml(storyCopy(state.blackglassMessage))}</div>` : ''}
      <button type="button" class="blackglass-primary" data-bg-paddock-finish ${seen.length>=3?'':'disabled'}>RETURN TO GARRAN</button>
    </section>`;
  }

  function blackglassCircuitStudyMarkup() {
    const c4 = chapter4State(), selected=c4.studiedSections||[];
    return `<section class="blackglass-study-layout">
      <div class="blackglass-board-wrap"><img src="story/props/blackglass/blackglass-route-board.png" alt="Blackglass circuit strategy board"></div>
      <aside class="blackglass-interaction-card is-study">
        <header><div><small>NELL'S RULE: TWO ONLY</small><h2>Choose your anchors.</h2><p>Deep-study two sections. Those sections give [PLAYER_DRAGON] a small real race advantage and lower the chance of a mistake there.</p></div><b>${selected.length}/2</b></header>
        ${blackglassWeekendStatusMarkup()}
        <div class="blackglass-section-list">
          ${BLACKGLASS_SECTION_DEFS.map(section=>`<button type="button" data-bg-section="${section.id}" class="${selected.includes(section.id)?'is-selected':''}">
            <span><strong>${escapeHtml(section.name)}</strong><small>${escapeHtml(section.note)}</small><em>${escapeHtml(section.benefit)}</em></span><i>${selected.includes(section.id)?'LOCKED':'STUDY'}</i>
          </button>`).join('')}
        </div>
        ${state.blackglassMessage ? `<div class="blackglass-message">${escapeHtml(state.blackglassMessage)}</div>` : ''}
        <button type="button" class="blackglass-primary" data-bg-study-finish ${selected.length===2?'':'disabled'}>LOCK DEEP STUDY</button>
      </aside>
    </section>`;
  }

  function blackglassEveningPlannerMarkup() {
    const c4=chapter4State(),used=c4.eveningMoments||[],remaining=Math.max(0,2-used.length);
    if(state.blackglassActivity&&BLACKGLASS_EVENING_ACTIVITIES[state.blackglassActivity]){
      const activity=BLACKGLASS_EVENING_ACTIVITIES[state.blackglassActivity];
      return `<section class="blackglass-interaction-card is-conversation">
        <button type="button" class="blackglass-text-back" data-bg-evening-cancel>‹ BACK</button>
        <small>${escapeHtml(activity.kicker)}</small><h2>${escapeHtml(activity.title)}</h2>
        <p>${escapeHtml(storyCopy(activity.intro))}</p>
        <blockquote>${escapeHtml(storyCopy(activity.line))}</blockquote>
        <div class="blackglass-response-list">${activity.responses.map((response,index)=>`<button type="button" data-bg-evening-response="${index}"><b>${String.fromCharCode(65+index)}</b><span><strong>${escapeHtml(storyCopy(response.label))}</strong><small>${escapeHtml(response.note)}</small></span><i>›</i></button>`).join('')}</div>
      </section>`;
    }
    return `<section class="blackglass-interaction-card is-evening">
      <header><div><small>AFTER QUALIFYING</small><h2>Spend the evening.</h2><p>Choose two. The conversations change relationships and some of them alter what you carry into race day.</p></div><b>${remaining} LEFT</b></header>
      ${blackglassWeekendStatusMarkup()}
      <div class="blackglass-evening-grid">
        ${Object.entries(BLACKGLASS_EVENING_ACTIVITIES).map(([id,activity])=>`<button type="button" data-bg-evening="${id}" class="${used.includes(id)?'is-used':''}" ${used.includes(id)||remaining<=0?'disabled':''}><small>${escapeHtml(activity.kicker)}</small><strong>${escapeHtml(activity.title)}</strong><span>${used.includes(id)?'DONE':'GO'}</span></button>`).join('')}
      </div>
      ${used.length>=2?'<p class="blackglass-complete-note">Two moments chosen. The rest of the team is winding down.</p>':''}
      <button type="button" class="blackglass-primary" data-bg-evening-finish ${used.length>=2?'':'disabled'}>CALL IT A NIGHT</button>
    </section>`;
  }

  // V34.18.3 — Blackglass After Hours playable dragon interlude.
  // V34.29.9 — pathing repair: the Guest Wing now uses a corridor nav graph instead
  // of broad walkable rectangles. Both September/the player dragon and Garran are
  // constrained to the same safe floor network, and Garran routes around walls.
  const AFTER_HOURS_FRAMES = {quiet:0,creepA:1,creepB:2,sniff:3,investigate:4,eat:5,hide:6,peek:7,startled:8,guilty:9};
  const AFTER_HOURS_WING_NAV_NODES = {
    desk:[13,39], hallWest:[22,39], roomHall:[29,39], roomDoor:[29,29],
    passHall:[47,41], hallCentre:[62,41], hallEast:[82,41], view:[89,28],
    serviceMid:[84,50], serviceLower:[84,66], lowerEast:[73,67],
    lowerMid:[48,58], crates:[37,66], pantry:[21,63], bench:[67,50], notice:[69,50]
  };
  const AFTER_HOURS_WING_NAV_EDGES = [
    ['desk','hallWest'],['hallWest','roomHall'],['roomHall','roomDoor'],['roomHall','passHall'],
    ['passHall','hallCentre'],['hallCentre','hallEast'],['hallEast','view'],['hallEast','serviceMid'],
    ['serviceMid','serviceLower'],['serviceLower','lowerEast'],['lowerEast','lowerMid'],
    ['lowerMid','crates'],['crates','pantry'],['lowerMid','bench'],['bench','notice'],
    ['bench','lowerEast'],['hallCentre','bench']
  ];
  const AFTER_HOURS_PATROL = ['hallWest','passHall','hallCentre','hallEast','view','hallEast','serviceMid','serviceLower','lowerEast','lowerMid','crates','pantry','hallWest'];
  const AFTER_HOURS_MAPS = {
    wing:{background:'story/environments/26_Blackglass_Guest_Wing.png',start:[29,31]},
    pantry:{background:'story/environments/27_Blackglass_Pantry.png',start:[50,82]}
  };
  const afterHoursKeys = new Set();
  let afterHoursRaf = 0;
  let afterHoursLastFrameAt = 0;
  let afterHoursListenersBound = false;

  function afterHoursDragonKey(){const key=accountKey(username());return CAREER_DRAGONS[key]?key:'catasthma';}
  function afterHoursDragonSrc(frame=0){return `story/after-hours/dragons/${afterHoursDragonKey()}/frame-${String(Math.max(0,Math.min(9,Number(frame)||0))).padStart(2,'0')}.png`;}
  function afterHoursStewardSrc(frame=0){return `story/after-hours/steward/frame-${String(Math.max(0,Math.min(9,Number(frame)||0))).padStart(2,'0')}.png`;}
  function afterHoursPropSrc(name){return `story/after-hours/props/${name}.png`;}
  function ahDistance(a,b){return Math.hypot(Number(a[0])-Number(b[0]),Number(a[1])-Number(b[1]));}
  function ahClamp(n,a,b){return Math.max(a,Math.min(b,n));}

  function afterHoursAudioPlay(name,volume=.3,{restart=true,loop=null}={}){
    const audio=afterHoursAudio[name];if(!audio||!state.soundOn)return;
    try{if(restart)audio.currentTime=0;if(loop!==null)audio.loop=!!loop;audio.volume=ahClamp(volume,0,1);void audio.play().catch(()=>undefined);}catch(_e){}
  }
  function afterHoursAudioPause(name,reset=false){const audio=afterHoursAudio[name];if(!audio)return;try{audio.pause();if(reset)audio.currentTime=0;}catch(_e){}}
  function startAfterHoursStorm(){if(!state.soundOn)return;afterHoursAudio.storm.volume=.27;afterHoursAudio.storm.loop=true;if(afterHoursAudio.storm.paused)void afterHoursAudio.storm.play().catch(()=>undefined);}
  function stopAfterHoursLoop(){
    cancelAnimationFrame(afterHoursRaf);afterHoursRaf=0;afterHoursLastFrameAt=0;afterHoursKeys.clear();
    afterHoursAudioPause('walk');afterHoursAudioPause('run');afterHoursAudioPause('steward');
    if(afterHoursListenersBound){window.removeEventListener('keydown',afterHoursKeyDown,true);window.removeEventListener('keyup',afterHoursKeyUp,true);afterHoursListenersBound=false;}
  }
  function stopAfterHoursGameplay(resetRuntime=false){
    stopAfterHoursLoop();Object.keys(afterHoursAudio).forEach(key=>afterHoursAudioPause(key,true));
    if(state.afterHoursGame)state.afterHoursGame.active=false;
    if(resetRuntime)state.afterHoursGame=null;
  }

  function newAfterHoursGame(){
    return {
      active:true,phase:'intro',room:'wing',x:29,y:31,facing:'left',moving:false,movementMode:'quiet',action:'quiet',actionUntil:0,noise:0,message:'',messageUntil:0,
      snackFound:false,timingFound:false,bonusSection:'',serviceKey:false,passFound:false,passReturned:false,passPocketed:false,secretFound:false,caught:false,caughtResponse:'',clatterTriggered:false,
      hidden:false,hideId:'',modal:'',objective:'Find something to eat.',
      steward:{x:18,y:39,patrolIndex:1,mode:'patrol',target:null,investigateUntil:0,path:[],pathKey:'',pathRecalcAt:0},
      stewardComingAt:0,stewardSearchUntil:0,stewardSearchSafe:false,
      startedAt:Date.now(),outcome:'',memory:'',pendingStewardDelta:0,pendingReputationDelta:0,sceneIndex:0
    };
  }
  function ensureAfterHoursGame(sceneIndex=0){
    if(!state.afterHoursGame||state.afterHoursGame.phase==='done')state.afterHoursGame=newAfterHoursGame();
    state.afterHoursGame.active=true;state.afterHoursGame.sceneIndex=sceneIndex;return state.afterHoursGame;
  }
  function afterHoursSetMessage(text,duration=3200){const g=state.afterHoursGame;if(!g)return;g.message=String(text||'');g.messageUntil=Date.now()+duration;}

  function ahPointSegmentDistance(px,py,ax,ay,bx,by){
    const vx=bx-ax,vy=by-ay,wx=px-ax,wy=py-ay,den=vx*vx+vy*vy;
    const t=den?ahClamp((wx*vx+wy*vy)/den,0,1):0,dx=px-(ax+vx*t),dy=py-(ay+vy*t);
    return Math.hypot(dx,dy);
  }
  function afterHoursWingPointWalkable(x,y,clearance=0){
    const corridorRadius=Math.max(3.8,6.4-Math.max(0,Number(clearance)||0));
    for(const [aKey,bKey] of AFTER_HOURS_WING_NAV_EDGES){
      const a=AFTER_HOURS_WING_NAV_NODES[aKey],b=AFTER_HOURS_WING_NAV_NODES[bKey];
      if(ahPointSegmentDistance(x,y,a[0],a[1],b[0],b[1])<=corridorRadius)return true;
    }
    // Small interaction bays deliberately widen only where the artwork has usable floor.
    const bays=[['roomDoor',6.0],['desk',5.5],['view',5.3],['serviceLower',6.0],['crates',6.2],['pantry',6.2],['bench',5.2]];
    return bays.some(([key,r])=>ahDistance([x,y],AFTER_HOURS_WING_NAV_NODES[key])<=Math.max(3.4,r-clearance));
  }
  function afterHoursWalkable(room,x,y,clearance=0){
    if(room==='pantry'){
      const c=Math.max(0,Number(clearance)||0);
      if(x<7+c||x>93-c||y<13+c||y>88-c)return false;
      // Prep table and upper shelving use clearance too, so sprites no longer clip
      // their centre point right up against the painted furniture/walls.
      if(x>29-c&&x<71+c&&y>33-c&&y<66+c)return false;
      if(y<28+c&&x>9-c&&x<91+c)return false;
      return true;
    }
    return afterHoursWingPointWalkable(x,y,clearance);
  }
  function afterHoursTryMove(g,nx,ny){
    const clearance=1.35;
    if(afterHoursWalkable(g.room,nx,ny,clearance)){g.x=nx;g.y=ny;return;}
    // Wall sliding feels much better than a hard stop, but each axis is re-tested
    // against the navmesh so diagonal input cannot tunnel across a corner.
    if(afterHoursWalkable(g.room,nx,g.y,clearance))g.x=nx;
    if(afterHoursWalkable(g.room,g.x,ny,clearance))g.y=ny;
  }
  function afterHoursLineWalkable(room,a,b,clearance=0){
    const d=Math.max(1,ahDistance(a,b)),steps=Math.max(3,Math.ceil(d/1.1));
    for(let i=0;i<=steps;i++){const t=i/steps,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;if(!afterHoursWalkable(room,x,y,clearance))return false;}
    return true;
  }
  function afterHoursNearestWingNode(pos){
    let best='',bestD=Infinity;
    for(const [key,p] of Object.entries(AFTER_HOURS_WING_NAV_NODES)){const d=ahDistance(pos,p);if(d<bestD){bestD=d;best=key;}}
    return best;
  }
  function afterHoursWingRoute(from,toKey){
    const startKey=afterHoursNearestWingNode(from),targetKey=String(toKey||startKey);
    if(!AFTER_HOURS_WING_NAV_NODES[targetKey])return [];
    const adjacency={};
    for(const key of Object.keys(AFTER_HOURS_WING_NAV_NODES))adjacency[key]=[];
    for(const [a,b] of AFTER_HOURS_WING_NAV_EDGES){const w=ahDistance(AFTER_HOURS_WING_NAV_NODES[a],AFTER_HOURS_WING_NAV_NODES[b]);adjacency[a].push([b,w]);adjacency[b].push([a,w]);}
    const dist={},prev={},open=new Set(Object.keys(adjacency));
    Object.keys(adjacency).forEach(k=>dist[k]=Infinity);dist[startKey]=0;
    while(open.size){let current='',best=Infinity;for(const k of open){if(dist[k]<best){best=dist[k];current=k;}}if(!current||current===targetKey)break;open.delete(current);for(const [next,w] of adjacency[current]){if(!open.has(next))continue;const alt=dist[current]+w;if(alt<dist[next]){dist[next]=alt;prev[next]=current;}}}
    const keys=[];let k=targetKey;while(k){keys.unshift(k);if(k===startKey)break;k=prev[k];}
    if(keys[0]!==startKey)return [AFTER_HOURS_WING_NAV_NODES[targetKey].slice()];
    return keys.slice(1).map(key=>AFTER_HOURS_WING_NAV_NODES[key].slice());
  }


  function afterHoursNearby(){
    const g=state.afterHoursGame;if(!g||g.phase!=='play')return null;
    const rows=[];const add=(id,label,pos,radius=7,kind='interaction')=>{const d=ahDistance([g.x,g.y],pos);if(d<=radius)rows.push({id,label,pos,d,kind});};
    if(g.room==='wing'){
      add('room','Room 11',[29,29],7,'door');
      add('pantry','Staff pantry',[21,63],7,'door');
      add('view','Maintenance viewing rail',[89,28],7,'door');
      if(!g.serviceKey)add('key','Dropped service key',[84,66],7,'pickup');
      if(!g.passFound)add('pass','Dropped venue pass',[47,42],6,'pickup');
      if(g.passFound&&!g.passReturned&&!g.passPocketed)add('return-pass','Night desk drop box',[13,37],7,'pickup');
      add('notice','Noticeboard',[69,50],6,'inspect');
      add('hide-crates','Hide behind equipment crates',[37,66],7,'hide');
      add('hide-bench','Hide in the recessed bench nook',[67,50],7,'hide');
      add('hide-gear','Hide behind service racks',[86,69],7,'hide');
    } else {
      add('exit-pantry','Guest wing',[50,84],8,'door');
      if(!g.snackFound)add('snack','Leftover Blackglass sweet roll',[50,68],8,'food');
      if(!g.timingFound)add('timing','Old sector sheets',[77,69],8,'inspect');
      add('hide-table','Hide beneath the prep table',[50,68],9,'hide');
      add('mug','Very precarious mug',[69,48],6,'noise');
    }
    rows.sort((a,b)=>a.d-b.d);return rows[0]||null;
  }

  function afterHoursPlayerFrame(g){
    const nowMs=Date.now();if(g.actionUntil>nowMs){if(g.action==='eat')return AFTER_HOURS_FRAMES.eat;if(g.action==='sniff')return AFTER_HOURS_FRAMES.sniff;if(g.action==='investigate')return AFTER_HOURS_FRAMES.investigate;if(g.action==='startled')return AFTER_HOURS_FRAMES.startled;if(g.action==='guilty')return AFTER_HOURS_FRAMES.guilty;}
    if(g.hidden)return AFTER_HOURS_FRAMES.hide;
    if(g.moving&&g.movementMode==='creep')return Math.floor(nowMs/260)%2?AFTER_HOURS_FRAMES.creepA:AFTER_HOURS_FRAMES.creepB;
    if(g.moving)return Math.floor(nowMs/220)%2?AFTER_HOURS_FRAMES.creepA:AFTER_HOURS_FRAMES.creepB;
    return AFTER_HOURS_FRAMES.quiet;
  }
  function afterHoursStewardFrame(g){
    const mode=g.steward?.mode||'patrol';if(mode==='investigate')return 5;if(mode==='alert')return 7;if(mode==='caught')return 8;return 1+(Math.floor(Date.now()/330)%3);
  }

  function afterHoursPropMarkup(g){
    const props=[];
    const add=(name,x,y,cls='')=>props.push(`<img class="after-hours-world-prop ${cls}" src="${afterHoursPropSrc(name)}" alt="" style="--x:${x}%;--y:${y}%">`);
    if(g.room==='wing'){
      if(!g.serviceKey)add('service-key',84,66,'is-key');
      if(!g.passFound)add('venue-pass',47,42,'is-pass');
    } else {
      if(!g.snackFound){add('sweet-roll',49,44,'is-snack');add('snack-plate',53,47,'is-snack-plate');}
      if(!g.timingFound)add('timing-stack',77,67,'is-paper');
      add('mug',69,47,'is-mug');
    }
    return props.join('');
  }

  function afterHoursObjective(g){
    if(!g.snackFound)return 'FIND SOMETHING TO EAT';
    if(g.room==='pantry'&&!g.timingFound)return 'SNACK ACQUIRED · EXPLORE OR RETURN TO ROOM';
    return 'RETURN TO ROOM · OPTIONAL SECRETS REMAIN';
  }
  function afterHoursStatusChips(g){
    const rows=[];
    if(g.snackFound)rows.push('<span>✓ SNACK</span>');
    if(g.timingFound)rows.push('<span>✓ EXTRA SECTOR NOTE</span>');
    if(g.serviceKey)rows.push('<span>✓ SERVICE KEY</span>');
    if(g.secretFound)rows.push('<span>★ SECRET VIEW</span>');
    if(g.passReturned)rows.push('<span>✓ PASS RETURNED</span>');
    if(g.caught)rows.push('<span class="is-danger">! CAUGHT</span>');
    return rows.join('');
  }

  function afterHoursPlayMarkup(g){
    const map=AFTER_HOURS_MAPS[g.room]||AFTER_HOURS_MAPS.wing,near=afterHoursNearby();
    const alertText=g.stewardSearchUntil>Date.now()?'DO NOT MOVE · GARRAN IS IN THE ROOM':g.stewardComingAt>Date.now()?`FOOTSTEPS APPROACHING · ${Math.max(1,Math.ceil((g.stewardComingAt-Date.now())/1000))}s`:g.steward?.mode==='investigate'?'GARRAN HEARD SOMETHING':'QUIET';
    const timingOptions=BLACKGLASS_SECTION_DEFS.filter(section=>!(chapter4State().studiedSections||[]).includes(section.id)).slice(0,4);
    return `<section class="after-hours-game" data-after-room="${escapeHtml(g.room)}">
      <img class="after-hours-map" src="${map.background}" alt="Blackglass ${g.room==='pantry'?'staff pantry':'guest wing'} at night">
      <div class="after-hours-night-filter"></div>
      ${afterHoursPropMarkup(g)}
      <div class="after-hours-player ${g.facing==='right'?'is-flipped':''} ${g.hidden?'is-hidden':''}" style="--x:${g.x}%;--y:${g.y}%"><img data-after-player-img src="${afterHoursDragonSrc(afterHoursPlayerFrame(g))}" alt="${escapeHtml(storyDragonName())}"></div>
      ${g.room==='wing'?`<div class="after-hours-steward ${g.steward.x>g.x?'':'is-flipped'}" style="--x:${g.steward.x}%;--y:${g.steward.y}%"><img data-after-steward-img src="${afterHoursStewardSrc(afterHoursStewardFrame(g))}" alt="Steward Garran Slate"></div>`:''}
      <header class="after-hours-hud">
        <div class="after-hours-objective"><small>BLACKGLASS · AFTER HOURS</small><strong data-after-objective>${afterHoursObjective(g)}</strong><div>${afterHoursStatusChips(g)}</div></div>
        <div class="after-hours-noise"><small>NOISE</small><i><b data-after-noise style="width:${Math.round(g.noise*100)}%"></b></i><span data-after-alert class="${alertText==='QUIET'?'':'is-alert'}">${escapeHtml(alertText)}</span></div>
        <button type="button" data-story-home>BACK TO HUB</button>
      </header>
      <div class="after-hours-controls"><span><b>WASD</b> MOVE</span><span><b>SHIFT</b> CREEP</span><span><b>SPACE</b> RUN</span><span><b>E</b> INTERACT</span></div>
      <div class="after-hours-message ${g.message&&g.messageUntil>Date.now()?'is-visible':''}" data-after-message>${escapeHtml(g.message||'')}</div>
      <button type="button" class="after-hours-interact ${near?'is-visible':''}" data-after-interact><kbd>E</kbd><span data-after-prompt>${escapeHtml(g.hidden?'Leave hiding place':near?.label||'')}</span></button>
      ${g.modal==='timing'?`<div class="after-hours-modal"><section><small>OLD BLACKGLASS SECTOR SHEETS</small><h2>One useful note survived the rain.</h2><p>You only have time to understand one extra section. This becomes a real race-knowledge bonus tomorrow.</p><div class="after-hours-timing-options">${timingOptions.map(section=>`<button type="button" data-after-timing-section="${section.id}"><b>${escapeHtml(section.name)}</b><small>${escapeHtml(section.note)}</small><span>STUDY THIS</span></button>`).join('')}</div><button type="button" data-after-modal-close>LEAVE THE PAPERS</button></section></div>`:''}
    </section>`;
  }

  function renderBlackglassAfterHours(scene,beat,sceneIndex){
    stopAfterHoursLoop();const g=ensureAfterHoursGame(sceneIndex);startAfterHoursStorm();syncMusic();
    if(g.phase==='intro'){
      root.innerHTML=`<section class="after-hours-cinematic-shell"><img src="story/environments/28_Blackglass_Midnight_Suite.png" alt="Blackglass guest suite in the middle of the night"><div class="after-hours-cinematic-shade"></div><img class="after-hours-intro-dragon" src="${afterHoursDragonSrc(0)}" alt="${escapeHtml(storyDragonName())}"><section class="after-hours-cinematic-card"><small>01:47 · ROOM 11</small><h1>SOMETHING WAKES UP</h1><p>The room is dark. The storm is not. ${escapeHtml(storyDragonName())} is very definitely awake — and very definitely hungry.</p><div><span>No dialogue choices.</span><span>No keeper.</span><span>Just the dragon.</span></div><button type="button" data-after-begin>GET OUT OF THE NEST</button></section><button class="after-hours-corner-back" type="button" data-story-home>BACK TO HUB</button></section>`;
      root.querySelector('[data-after-begin]')?.addEventListener('click',()=>{afterHoursAudioPlay('door',.34);g.phase='play';g.room='wing';g.x=29;g.y=31;g.message='The guest wing is supposed to be asleep.';g.messageUntil=Date.now()+3000;renderBlackglassAfterHours(scene,beat,sceneIndex);});
      root.querySelector('[data-story-home]')?.addEventListener('click',returnToHubFromStory);return;
    }
    if(g.phase==='secret'){
      root.innerHTML=`<section class="after-hours-secret-shell"><img src="story/environments/29_Blackglass_Circuit_At_Rest.png" alt="The empty Blackglass circuit in the rain"><div class="after-hours-secret-shade"></div><img class="after-hours-secret-dragon ${g.facing==='right'?'is-flipped':''}" src="${afterHoursDragonSrc(AFTER_HOURS_FRAMES.peek)}" alt="${escapeHtml(storyDragonName())}"><section><small>02:13 · MAINTENANCE VIEWING RAIL</small><h1>BLACKGLASS BEFORE THE CROWD</h1><p>No racers. No commentary. No grid. For a minute Blackglass is just rain, sea and a road glowing through the dark.</p><em>Career memory discovered</em><strong>BLACKGLASS AT 02:13</strong><button type="button" data-after-secret-return>GO BACK INSIDE</button></section></section>`;
      root.querySelector('[data-after-secret-return]')?.addEventListener('click',()=>{g.phase='play';g.room='wing';g.x=85;g.y=31;g.secretFound=true;g.message='The service door clicks shut behind you.';g.messageUntil=Date.now()+2600;afterHoursAudioPlay('door',.34);renderBlackglassAfterHours(scene,beat,sceneIndex);});return;
    }
    if(g.phase==='caught'){
      root.innerHTML=`<section class="after-hours-caught-shell"><img src="${AFTER_HOURS_MAPS.wing.background}" alt="Blackglass guest wing"><div class="after-hours-caught-shade"></div><img class="after-hours-caught-steward" src="story/portraits/blackglass/steward/frame-00.png" alt="Steward Garran Slate"><img class="after-hours-caught-dragon" src="${afterHoursDragonSrc(AFTER_HOURS_FRAMES.guilty)}" alt="${escapeHtml(storyDragonName())}"><section class="after-hours-caught-card"><small>UNSCHEDULED EVENT · 02:${String(14+Math.floor((Date.now()-g.startedAt)/60000)).padStart(2,'0')}</small><h1>GARRAN FOUND YOU.</h1><blockquote>“You are aware breakfast is in several hours.”</blockquote><p>${escapeHtml(storyDragonName())} looks at Garran. Garran looks at ${escapeHtml(storyDragonName())}. Nobody is winning.</p><div><button type="button" data-after-caught="hungry"><b>“I was hungry.”</b><small>Be extremely honest.</small></button><button type="button" data-after-caught="study" ${g.timingFound?'':'disabled'}><b>Point at the timing sheets.</b><small>${g.timingFound?'At least there was a reason.':'You did not actually find any.'}</small></button><button type="button" data-after-caught="guilty"><b>Say absolutely nothing.</b><small>Deploy the guilty stare.</small></button></div></section></section>`;
      root.querySelectorAll('[data-after-caught]').forEach(button=>button.addEventListener('click',()=>{const response=button.dataset.afterCaught;if(button.disabled)return;g.caughtResponse=response;g.snackFound=true;g.outcome='caught';if(response==='study'&&g.timingFound){g.pendingStewardDelta+=1;g.message='Garran studies the sheet, then the dragon. “At least your trespassing has sector discipline.”';}else if(response==='guilty'){g.pendingReputationDelta-=1;g.message='Garran sighs so heavily it probably appears on the weather instruments.';}else{g.message='Garran produces one dry biscuit from somewhere inside his coat. “Resolve the emergency.”';}g.phase='summary';afterHoursAudioPlay('eat',.30);renderBlackglassAfterHours(scene,beat,sceneIndex);}));return;
    }
    if(g.phase==='summary'){
      const memory=g.secretFound?'Blackglass at 02:13':g.caught?'The Blackglass Biscuit Incident':g.timingFound?'The Midnight Timing Sheet':'The Midnight Snack Run';g.memory=memory;
      root.innerHTML=`<section class="after-hours-summary-shell"><img src="story/environments/28_Blackglass_Midnight_Suite.png" alt="Blackglass guest suite at night"><div class="after-hours-summary-shade"></div><section class="after-hours-summary-card"><small>AFTER HOURS COMPLETE</small><h1>${escapeHtml(memory)}</h1><p>${escapeHtml(g.message||`${storyDragonName()} makes it back to the nest before anybody notices.`)}</p><div class="after-hours-summary-grid"><span class="${g.snackFound?'is-done':''}"><b>${g.snackFound?'✓':'—'}</b><small>SNACK</small><strong>${g.snackFound?'ACQUIRED':'MISSED'}</strong></span><span class="${g.timingFound?'is-done':''}"><b>${g.timingFound?'✓':'—'}</b><small>EXTRA STUDY</small><strong>${g.timingFound?escapeHtml(BLACKGLASS_SECTION_DEFS.find(s=>s.id===g.bonusSection)?.name||'SECTOR NOTE'):'NONE'}</strong></span><span class="${g.secretFound?'is-done':''}"><b>${g.secretFound?'★':'—'}</b><small>SECRET</small><strong>${g.secretFound?'02:13 VIEW':'UNDISCOVERED'}</strong></span><span class="${g.passReturned?'is-done':''}"><b>${g.passReturned?'✓':'—'}</b><small>VENUE PASS</small><strong>${g.passReturned?'RETURNED':g.passFound?'FOUND':'MISSED'}</strong></span></div><button type="button" data-after-finish>BACK TO THE NEST</button></section></section>`;
      root.querySelector('[data-after-finish]')?.addEventListener('click',()=>{stopAfterHoursGameplay(false);void completeBlackglassBeat(changed=>{const c4=changed.chapter4,ah=c4.afterHours||{};Object.assign(ah,{completed:true,snackFound:!!g.snackFound,timingFound:!!g.timingFound,bonusSection:g.bonusSection||'',passFound:!!g.passFound,passReturned:!!g.passReturned,passPocketed:!!(g.passFound&&!g.passReturned),secretFound:!!g.secretFound,caught:!!g.caught,caughtResponse:g.caughtResponse||'',clatterTriggered:!!g.clatterTriggered,outcome:g.outcome||'clean',memory});c4.afterHours=ah;if(g.snackFound){c4.dragonState='rested';changed.relationships.dragonBond+=1;}if(g.timingFound)changed.identity.focus+=1;if(g.secretFound){changed.identity.heart+=1;changed.relationships.dragonBond+=2;}if(g.passReturned){changed.relationships.stewardRespect+=2;c4.reputation+=1;}changed.relationships.stewardRespect+=g.pendingStewardDelta||0;c4.reputation+=g.pendingReputationDelta||0;changed.history.push({scene:'q26',event:'blackglass-after-hours',memory,snack:!!g.snackFound,timing:g.bonusSection||'',secret:!!g.secretFound,caught:!!g.caught,passReturned:!!g.passReturned});});});return;
    }

    root.innerHTML=`<section class="story-shell tone-blackglass after-hours-story-shell" aria-label="Blackglass After Hours"><div class="story-stage is-after-hours-stage">${afterHoursPlayMarkup(g)}</div></section><div class="blackout ${state.blackout?'is-visible':''}" aria-hidden="true"></div>`;
    root.querySelector('[data-story-home]')?.addEventListener('click',returnToHubFromStory);
    root.querySelector('[data-after-interact]')?.addEventListener('click',afterHoursInteract);
    root.querySelector('[data-after-modal-close]')?.addEventListener('click',()=>{g.modal='';g.message='The papers stay where they are.';g.messageUntil=Date.now()+2200;renderBlackglassAfterHours(scene,beat,sceneIndex);});
    root.querySelectorAll('[data-after-timing-section]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.afterTimingSection,def=BLACKGLASS_SECTION_DEFS.find(section=>section.id===id);if(!def)return;g.timingFound=true;g.bonusSection=id;g.modal='';g.action='investigate';g.actionUntil=Date.now()+1200;g.message=`You remember one useful note about ${def.name}. Nell would be annoyed by how useful this is.`;g.messageUntil=Date.now()+4200;afterHoursAudioPlay('paper',.28);renderBlackglassAfterHours(scene,beat,sceneIndex);}));
    startAfterHoursLoop();
  }

  function afterHoursCatch(reason='caught'){
    const g=state.afterHoursGame;if(!g||g.phase!=='play')return;g.caught=true;g.outcome='caught';g.action='startled';g.actionUntil=Date.now()+1000;g.phase='caught';g.hidden=false;stopAfterHoursLoop();afterHoursAudioPlay('steward',.12,{restart:true,loop:false});window.setTimeout(()=>{const scene=activeStoryScene(),beat=scene.beats[state.story.beat],idx=QUICKQUILL_BLACKGLASS_SCENES.findIndex(item=>item.id===scene.id);renderBlackglassAfterHours(scene,beat,idx);},300);
  }

  function afterHoursTriggerClatter(){
    const g=state.afterHoursGame;if(!g||g.clatterTriggered)return;g.clatterTriggered=true;g.noise=1;g.stewardComingAt=Date.now()+3900;afterHoursAudioPlay('clatter',.40);afterHoursSetMessage('CLATTER. Somewhere in the guest wing, heavy footsteps stop.',3900);
  }

  function afterHoursInteract(){
    const g=state.afterHoursGame;if(!g||g.phase!=='play'||g.modal)return;
    if(g.hidden){g.hidden=false;g.hideId='';afterHoursSetMessage('You creep back out.',1600);return;}
    const near=afterHoursNearby();if(!near){g.action='sniff';g.actionUntil=Date.now()+800;afterHoursSetMessage('Nothing useful here. The food smell is stronger toward the service rooms.',2200);return;}
    if(near.kind==='hide'){
      g.hidden=true;g.hideId=near.id;g.noise=0;afterHoursAudioPause('walk');afterHoursAudioPause('run');afterHoursSetMessage(near.id==='hide-table'?'You flatten yourself beneath the preparation table.':'You disappear into the darkest bit of cover available.',2600);return;
    }
    if(near.id==='pantry'){
      afterHoursAudioPlay('door',.35);g.room='pantry';g.x=50;g.y=82;g.noise=.08;afterHoursSetMessage('Warm pastry. Definitely pastry.',2800);const scene=activeStoryScene(),beat=scene.beats[state.story.beat],idx=QUICKQUILL_BLACKGLASS_SCENES.findIndex(item=>item.id===scene.id);renderBlackglassAfterHours(scene,beat,idx);return;
    }
    if(near.id==='exit-pantry'){
      afterHoursAudioPlay('door',.35);g.room='wing';g.x=23;g.y=61;g.noise=.12;afterHoursSetMessage('Back into the guest wing.',1800);const scene=activeStoryScene(),beat=scene.beats[state.story.beat],idx=QUICKQUILL_BLACKGLASS_SCENES.findIndex(item=>item.id===scene.id);renderBlackglassAfterHours(scene,beat,idx);return;
    }
    if(near.id==='room'){
      if(!g.snackFound){afterHoursSetMessage('Going back to bed hungry would make this entire operation pointless.',2600);g.action='sniff';g.actionUntil=Date.now()+900;return;}
      g.outcome=g.secretFound?'secret':g.caught?'caught':'clean';g.message=g.secretFound?'The nest feels different after seeing the circuit empty.':g.timingFound?'Full stomach. One extra sector note. Nobody needs to know.':'Snack secured. Mission accomplished with an almost professional lack of dignity.';g.phase='summary';stopAfterHoursLoop();const scene=activeStoryScene(),beat=scene.beats[state.story.beat],idx=QUICKQUILL_BLACKGLASS_SCENES.findIndex(item=>item.id===scene.id);renderBlackglassAfterHours(scene,beat,idx);return;
    }
    if(near.id==='snack'){
      g.snackFound=true;g.action='eat';g.actionUntil=Date.now()+1900;g.objective='Return to Room 11 — or keep exploring.';afterHoursAudioPlay('eat',.32);afterHoursSetMessage('A slightly stale Blackglass sweet roll. At 01:57 it may be the finest food ever produced.',4300);const scene=activeStoryScene(),beat=scene.beats[state.story.beat],idx=QUICKQUILL_BLACKGLASS_SCENES.findIndex(item=>item.id===scene.id);renderBlackglassAfterHours(scene,beat,idx);return;
    }
    if(near.id==='timing'){
      g.modal='timing';g.action='investigate';g.actionUntil=Date.now()+1200;afterHoursAudioPlay('paper',.28);stopAfterHoursLoop();const scene=activeStoryScene(),beat=scene.beats[state.story.beat],idx=QUICKQUILL_BLACKGLASS_SCENES.findIndex(item=>item.id===scene.id);renderBlackglassAfterHours(scene,beat,idx);return;
    }
    if(near.id==='key'){
      g.serviceKey=true;g.action='investigate';g.actionUntil=Date.now()+800;afterHoursSetMessage('A small service key tag. One of the upper maintenance doors uses the same blue enamel mark.',3600);const scene=activeStoryScene(),beat=scene.beats[state.story.beat],idx=QUICKQUILL_BLACKGLASS_SCENES.findIndex(item=>item.id===scene.id);renderBlackglassAfterHours(scene,beat,idx);return;
    }
    if(near.id==='pass'){
      g.passFound=true;g.action='investigate';g.actionUntil=Date.now()+800;afterHoursAudioPlay('paper',.22);afterHoursSetMessage('Dropped Blackglass venue pass. Somebody is going to need this in the morning.',3000);const scene=activeStoryScene(),beat=scene.beats[state.story.beat],idx=QUICKQUILL_BLACKGLASS_SCENES.findIndex(item=>item.id===scene.id);renderBlackglassAfterHours(scene,beat,idx);return;
    }
    if(near.id==='return-pass'){
      g.passReturned=true;afterHoursSetMessage('The pass slips into the night desk return slot. Garran will know somebody bothered.',3200);afterHoursAudioPlay('door',.25);const scene=activeStoryScene(),beat=scene.beats[state.story.beat],idx=QUICKQUILL_BLACKGLASS_SCENES.findIndex(item=>item.id===scene.id);renderBlackglassAfterHours(scene,beat,idx);return;
    }
    if(near.id==='view'){
      if(!g.serviceKey){afterHoursAudioPlay('door',.28);afterHoursSetMessage('Locked. A tiny blue-enamel key symbol is stamped beside the latch.',3000);return;}
      g.secretFound=true;g.phase='secret';stopAfterHoursLoop();afterHoursAudioPlay('door',.34);afterHoursAudioPlay('discovery',.25);const scene=activeStoryScene(),beat=scene.beats[state.story.beat],idx=QUICKQUILL_BLACKGLASS_SCENES.findIndex(item=>item.id===scene.id);renderBlackglassAfterHours(scene,beat,idx);return;
    }
    if(near.id==='notice'){
      g.action='investigate';g.actionUntil=Date.now()+1000;afterHoursSetMessage('Tomorrow’s notices: grid access, weather restrictions, breakfast. Breakfast is offensively far away.',3600);return;
    }
    if(near.id==='mug'){afterHoursTriggerClatter();return;}
  }

  function afterHoursKeyDown(event){
    const g=state.afterHoursGame;if(!g?.active||g.phase!=='play'||g.modal)return;const key=String(event.key||'').toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift',' ','e'].includes(key)){event.preventDefault();event.stopPropagation();}
    if(key==='e'&&!event.repeat){afterHoursInteract();return;}
    afterHoursKeys.add(key);
  }
  function afterHoursKeyUp(event){const key=String(event.key||'').toLowerCase();afterHoursKeys.delete(key);}

  function afterHoursStartMovementAudio(mode,moving){
    if(!state.soundOn||!moving){afterHoursAudioPause('walk');afterHoursAudioPause('run');return;}
    if(mode==='run'){
      afterHoursAudioPause('walk');afterHoursAudio.run.volume=.40;afterHoursAudio.run.loop=true;if(afterHoursAudio.run.paused)void afterHoursAudio.run.play().catch(()=>undefined);
    }else{
      afterHoursAudioPause('run');afterHoursAudio.walk.volume=mode==='creep'?.10:.29;afterHoursAudio.walk.loop=true;if(afterHoursAudio.walk.paused)void afterHoursAudio.walk.play().catch(()=>undefined);
    }
  }

  function afterHoursUpdateSteward(g,dt){
    if(g.room!=='wing')return;
    const s=g.steward,player=[g.x,g.y],dist=ahDistance([s.x,s.y],player),nowMs=Date.now();
    if(!g.hidden&&g.noise>.62&&dist<29){
      s.mode='investigate';
      s.target=[g.x,g.y];
      s.investigateUntil=nowMs+4300;
      const anchor=afterHoursNearestWingNode(s.target);
      if(s.pathKey!==`investigate:${anchor}`||nowMs>s.pathRecalcAt){s.path=afterHoursWingRoute([s.x,s.y],anchor);s.pathKey=`investigate:${anchor}`;s.pathRecalcAt=nowMs+650;}
    }else if(s.mode==='investigate'&&nowMs>s.investigateUntil){s.mode='patrol';s.target=null;s.path=[];s.pathKey='';}

    const patrolKey=AFTER_HOURS_PATROL[s.patrolIndex%AFTER_HOURS_PATROL.length];
    const desiredKey=s.mode==='investigate'&&s.target?afterHoursNearestWingNode(s.target):patrolKey;
    const routeKey=`${s.mode}:${desiredKey}`;
    if(!s.path.length||s.pathKey!==routeKey||nowMs>s.pathRecalcAt){s.path=afterHoursWingRoute([s.x,s.y],desiredKey);s.pathKey=routeKey;s.pathRecalcAt=nowMs+(s.mode==='investigate'?650:1800);}
    let target=s.path[0]||AFTER_HOURS_WING_NAV_NODES[desiredKey]||[s.x,s.y];
    let dx=target[0]-s.x,dy=target[1]-s.y,d=Math.hypot(dx,dy);
    if(d<.85){if(s.path.length)s.path.shift();target=s.path[0]||AFTER_HOURS_WING_NAV_NODES[desiredKey]||target;dx=target[0]-s.x;dy=target[1]-s.y;d=Math.hypot(dx,dy);}
    const speed=s.mode==='investigate'?8.0:4.8;
    if(d>.01){
      const step=Math.min(d,speed*dt),nx=s.x+dx/d*step,ny=s.y+dy/d*step;
      if(afterHoursWalkable('wing',nx,ny,1.75)){s.x=nx;s.y=ny;}
      else{s.path=[];s.pathKey='';const snap=AFTER_HOURS_WING_NAV_NODES[afterHoursNearestWingNode([s.x,s.y])];if(snap&&ahDistance([s.x,s.y],snap)<2.8){s.x=snap[0];s.y=snap[1];}}
    }

    const reached=ahDistance([s.x,s.y],AFTER_HOURS_WING_NAV_NODES[desiredKey]||[s.x,s.y])<1.6;
    if(reached){
      if(s.mode==='patrol'){s.patrolIndex=(s.patrolIndex+1)%AFTER_HOURS_PATROL.length;s.path=[];s.pathKey='';}
      else if(s.mode==='investigate'&&nowMs>s.investigateUntil-400){s.mode='patrol';s.target=null;s.path=[];s.pathKey='';}
    }
    const newDist=ahDistance([s.x,s.y],player);
    // Proximity alone is no longer enough: Garran cannot catch the dragon through
    // a wall just because their screen-space coordinates happen to be close.
    if(!g.hidden&&newDist<7.2&&afterHoursLineWalkable('wing',[s.x,s.y],player,1.1)){afterHoursCatch('steward');return;}
    if(state.soundOn&&newDist<42){const vol=.035+(1-ahClamp(newDist/42,0,1))*.105;afterHoursAudio.steward.volume=vol;afterHoursAudio.steward.loop=true;if(afterHoursAudio.steward.paused)void afterHoursAudio.steward.play().catch(()=>undefined);}else afterHoursAudioPause('steward');
  }


  function afterHoursUpdatePantryThreat(g){
    const nowMs=Date.now();
    if(g.stewardComingAt&&nowMs>=g.stewardComingAt){g.stewardComingAt=0;if(g.hidden){g.stewardSearchUntil=nowMs+4300;g.stewardSearchSafe=true;afterHoursAudioPlay('door',.36);afterHoursAudioPlay('steward',.12,{restart:true,loop:false});afterHoursSetMessage('The door opens. Garran checks the room. Do not move.',4300);}else{afterHoursCatch('clatter');return;}}
    if(g.stewardSearchUntil){if(!g.hidden){afterHoursCatch('moved-while-hidden');return;}if(nowMs>=g.stewardSearchUntil){g.stewardSearchUntil=0;g.stewardSearchSafe=false;afterHoursSetMessage('The door closes again. Somehow, that worked.',3000);afterHoursAudioPlay('door',.28);}}
  }

  function afterHoursRefreshDom(g){
    const player=root.querySelector('.after-hours-player'),playerImg=root.querySelector('[data-after-player-img]'),steward=root.querySelector('.after-hours-steward'),stewardImg=root.querySelector('[data-after-steward-img]');
    if(player){player.style.setProperty('--x',g.x+'%');player.style.setProperty('--y',g.y+'%');player.classList.toggle('is-flipped',g.facing==='right');player.classList.toggle('is-hidden',g.hidden);}if(playerImg){const src=afterHoursDragonSrc(afterHoursPlayerFrame(g));if(!playerImg.src.endsWith(src))playerImg.src=src;}
    if(steward){steward.style.setProperty('--x',g.steward.x+'%');steward.style.setProperty('--y',g.steward.y+'%');steward.classList.toggle('is-flipped',g.steward.x<g.x);}if(stewardImg){const src=afterHoursStewardSrc(afterHoursStewardFrame(g));if(!stewardImg.src.endsWith(src))stewardImg.src=src;}
    const noise=root.querySelector('[data-after-noise]');if(noise)noise.style.width=Math.round(g.noise*100)+'%';const obj=root.querySelector('[data-after-objective]');if(obj)obj.textContent=afterHoursObjective(g);
    const msg=root.querySelector('[data-after-message]');if(msg){const visible=!!g.message&&g.messageUntil>Date.now();msg.textContent=visible?g.message:'';msg.classList.toggle('is-visible',visible);}
    const near=afterHoursNearby(),interact=root.querySelector('[data-after-interact]'),prompt=root.querySelector('[data-after-prompt]');if(interact)interact.classList.toggle('is-visible',!!near||g.hidden);if(prompt)prompt.textContent=g.hidden?'Leave hiding place':near?.label||'';
    const alert=root.querySelector('[data-after-alert]');if(alert){const nowMs=Date.now(),txt=g.stewardSearchUntil>nowMs?'DO NOT MOVE · GARRAN IS IN THE ROOM':g.stewardComingAt>nowMs?`FOOTSTEPS APPROACHING · ${Math.max(1,Math.ceil((g.stewardComingAt-nowMs)/1000))}s`:g.steward?.mode==='investigate'?'GARRAN HEARD SOMETHING':'QUIET';alert.textContent=txt;alert.classList.toggle('is-alert',txt!=='QUIET');}
  }

  function startAfterHoursLoop(){
    const g=state.afterHoursGame;if(!g||g.phase!=='play'||g.modal)return;stopAfterHoursLoop();g.active=true;if(!afterHoursListenersBound){window.addEventListener('keydown',afterHoursKeyDown,true);window.addEventListener('keyup',afterHoursKeyUp,true);afterHoursListenersBound=true;}
    const tick=t=>{if(!state.afterHoursGame?.active||state.afterHoursGame.phase!=='play'){stopAfterHoursLoop();return;}afterHoursRaf=requestAnimationFrame(tick);const game=state.afterHoursGame,dt=Math.min(.05,Math.max(.001,(t-(afterHoursLastFrameAt||t))/1000));afterHoursLastFrameAt=t;if(game.modal)return;
      let dx=0,dy=0;if(afterHoursKeys.has('w')||afterHoursKeys.has('arrowup'))dy-=1;if(afterHoursKeys.has('s')||afterHoursKeys.has('arrowdown'))dy+=1;if(afterHoursKeys.has('a')||afterHoursKeys.has('arrowleft'))dx-=1;if(afterHoursKeys.has('d')||afterHoursKeys.has('arrowright'))dx+=1;const moving=!!(dx||dy),run=afterHoursKeys.has(' '),creep=afterHoursKeys.has('shift');
      if(moving&&game.hidden){game.hidden=false;game.hideId='';if(game.stewardSearchUntil){afterHoursCatch('left-cover');return;}}
      const mag=Math.hypot(dx,dy)||1,mode=creep?'creep':run?'run':'walk',speed=mode==='creep'?7.6:mode==='run'?22:13.2;game.moving=moving;game.movementMode=mode;if(moving){dx/=mag;dy/=mag;afterHoursTryMove(game,game.x+dx*speed*dt,game.y+dy*speed*dt);if(Math.abs(dx)>.1)game.facing=dx>0?'right':'left';game.noise=Math.max(game.noise,mode==='creep'?.10:mode==='run'?.88:.35);}else game.noise=Math.max(0,game.noise-dt*.72);afterHoursStartMovementAudio(mode,moving);
      if(game.room==='pantry'&&moving&&mode==='run'&&!game.clatterTriggered&&ahDistance([game.x,game.y],[68,48])<8)afterHoursTriggerClatter();
      if(game.room==='wing')afterHoursUpdateSteward(game,dt);else afterHoursUpdatePantryThreat(game);afterHoursRefreshDom(game);
    };afterHoursRaf=requestAnimationFrame(tick);
  }


  const BLACKGLASS_ROOM_ACTIONS = {
    settle:{title:'SETTLE [PLAYER_DRAGON]',text:'Sit by the nest until the rain becomes background noise.',effect:'Dragon settles · bond up'},
    grid:{title:'READ THE QUALIFYING SHEET',text:'Look at the gaps instead of the position.',effect:'Focus up · grid context'},
    card:{title:'POCKET CIRCUIT CARD',text:'Trace the two sections you chose one last time.',effect:'Studied sections reinforced'},
    pack:{title:'PACK FOR MORNING',text:'Pass, goggles, towel, spare strap. No midnight panic.',effect:'Quickquill trust up'},
    rain:{title:'WATCH THE STORM',text:'Do absolutely nothing useful for a minute.',effect:'Heart up · pressure down'}
  };

  function blackglassRoomNightMarkup() {
    const c4=chapter4State(),actions=c4.roomActions||[],remaining=Math.max(0,3-actions.length);
    return `<section class="blackglass-interaction-card is-room-night">
      <header><div><small>ROOM 11 · 00:06</small><h2>No team meeting. No cameras.</h2><p>Do up to three things, then sleep. You only need two before the night can end.</p></div><b>${remaining} OPTIONAL</b></header>
      ${blackglassWeekendStatusMarkup()}
      <div class="blackglass-room-actions">
        ${Object.entries(BLACKGLASS_ROOM_ACTIONS).map(([id,action])=>`<button type="button" data-bg-room-action="${id}" class="${actions.includes(id)?'is-done':''}" ${actions.includes(id)||actions.length>=3?'disabled':''}><span><strong>${escapeHtml(storyCopy(action.title))}</strong><small>${escapeHtml(action.text)}</small><em>${escapeHtml(action.effect)}</em></span><i>${actions.includes(id)?'DONE':'DO'}</i></button>`).join('')}
      </div>
      ${state.blackglassMessage?`<div class="blackglass-message">${escapeHtml(storyCopy(state.blackglassMessage))}</div>`:''}
      <button type="button" class="blackglass-primary" data-bg-room-sleep ${actions.length>=2?'':'disabled'}>SETTLE IN FOR THE NIGHT</button>
    </section>
    <div class="blackglass-room-props" aria-hidden="true">
      <img class="is-pass" src="story/props/blackglass/venue-pass.png" alt="">
      <img class="is-key" src="story/props/blackglass/room-key.png" alt="">
      <img class="is-sheet" src="story/props/blackglass/qualifying-sheet.png" alt="">
      <img class="is-bag" src="story/props/blackglass/travel-bag.png" alt="">
    </div>`;
  }

  const BLACKGLASS_MORNING_PREP = {
    warmup:{title:'Short dragon warm-up',note:'Sharper launch · slightly more eager early race',value:'warmup'},
    technical:{title:'One final setup check with Nell',note:'Smoother corner pace · fewer forced corrections',value:'technical'},
    breakfast:{title:'Eat properly and keep it normal',note:'Rested race state · steadier overall pace',value:'breakfast'},
    balcony:{title:'Five quiet minutes on the balcony',note:'Lower pressure · fewer mistakes',value:'balcony'}
  };

  function blackglassMorningPrepMarkup() {
    const c4=chapter4State(),selected=c4.morningPrep||'';
    return `<section class="blackglass-interaction-card is-morning-prep">
      <header><div><small>RACE MORNING</small><h2>One last preparation.</h2><p>You do not get to optimise everything. Pick the thing that will make the afternoon simpler.</p></div></header>
      ${blackglassWeekendStatusMarkup()}
      <div class="blackglass-morning-grid">${Object.entries(BLACKGLASS_MORNING_PREP).map(([id,item])=>`<button type="button" data-bg-morning="${id}" class="${selected===id?'is-selected':''}"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.note)}</small><i>›</i></button>`).join('')}</div>
      ${state.blackglassMessage?`<div class="blackglass-message">${escapeHtml(state.blackglassMessage)}</div>`:''}
    </section>`;
  }

  function renderBlackglassInteractive(scene, beat, sceneIndex) {
    window.clearTimeout(storyRevealTimer);storyRevealTimer=0;state.storyRevealComplete=true;
    if (beat.type === 'blackglass-after-hours') { renderBlackglassAfterHours(scene, beat, sceneIndex); return; }
    let content='',portrait='',extra='';
    if(beat.type==='blackglass-paddock-explore') content=blackglassPaddockMarkup();
    else if(beat.type==='blackglass-circuit-study') content=blackglassCircuitStudyMarkup();
    else if(beat.type==='blackglass-evening-planner'){
      content=blackglassEveningPlannerMarkup();
      if(state.blackglassActivity&&BLACKGLASS_EVENING_ACTIVITIES[state.blackglassActivity]) portrait=portraitMarkup(BLACKGLASS_EVENING_ACTIVITIES[state.blackglassActivity].portrait);
      else extra=downtimeDragonMarkup(3,'is-blackglass-lounge-dragon');
    }
    else if(beat.type==='blackglass-room-night'){content=blackglassRoomNightMarkup();extra=downtimeDragonMarkup(11,'is-blackglass-room-dragon');}
    else if(beat.type==='blackglass-morning-prep'){content=blackglassMorningPrepMarkup();extra=downtimeDragonMarkup(0,'is-blackglass-morning-dragon');}
    root.innerHTML=`
      <section class="story-shell tone-blackglass blackglass-interactive-shell" aria-label="${escapeHtml(scene.number)} ${escapeHtml(scene.title)}">
        <img class="story-backdrop" src="${scene.background}" alt="" aria-hidden="true">
        <div class="story-stage is-blackglass-interactive">
          <img class="story-environment" src="${scene.background}" alt="${escapeHtml(scene.title)}">
          <div class="story-light" aria-hidden="true"></div><div class="story-weather" aria-hidden="true"></div><div class="story-grain" aria-hidden="true"></div>
          <header class="story-header"><div><small>QUICKQUILL: AGAINST THE ODDS</small><strong>${escapeHtml(scene.number)} · ${escapeHtml(scene.title)}</strong><span>${escapeHtml(scene.location)}</span></div><button type="button" data-story-home>BACK TO HUB</button></header>
          ${portrait}${extra}${content}
          <div class="story-scene-counter"><i style="--story-progress:${((sceneIndex+1)/QUICKQUILL_BLACKGLASS_SCENES.length)*100}%"></i><span>BLACKGLASS WEEKEND ${sceneIndex+1} / ${QUICKQUILL_BLACKGLASS_SCENES.length}</span></div>
        </div><div class="story-screen-vignette" aria-hidden="true"></div>
      </section><div class="blackout ${state.blackout?'is-visible':''}" aria-hidden="true"></div>`;
    cleanDuplicateSceneLayers();
    root.querySelector('[data-story-home]')?.addEventListener('click',returnToHubFromStory);

    if(beat.type==='blackglass-paddock-explore'){
      root.querySelectorAll('[data-bg-paddock]').forEach(button=>button.addEventListener('click',()=>{
        const id=button.dataset.bgPaddock,spot=BLACKGLASS_PADDOCK_SPOTS[id];if(!spot)return;
        const changed=cloneValue(state.story),c4=changed.chapter4;const first=!c4.paddockSeen.includes(id);
        if(first){c4.paddockSeen.push(id);if(id==='pass'){c4.reputation+=1;changed.relationships.stewardRespect+=1;}if(id==='track')changed.identity.focus+=1;if(id==='crates')changed.relationships.quickquillTrust+=1;if(id==='dragon')changed.relationships.dragonBond+=1;}
        state.blackglassMessage=spot.text;playTone(first?330:230);void saveBlackglassSameBeat(changed);
      }));
      root.querySelector('[data-bg-paddock-finish]')?.addEventListener('click',()=>void completeBlackglassBeat(changed=>{changed.history.push({scene:'q21',event:'paddock-explored',seen:[...changed.chapter4.paddockSeen]});}));
    }

    if(beat.type==='blackglass-circuit-study'){
      root.querySelectorAll('[data-bg-section]').forEach(button=>button.addEventListener('click',()=>{
        const id=button.dataset.bgSection,changed=cloneValue(state.story),selected=changed.chapter4.studiedSections||[];
        if(selected.includes(id)){changed.chapter4.studiedSections=selected.filter(value=>value!==id);state.blackglassMessage='Section released. You can choose another anchor.';}
        else if(selected.length>=2){state.blackglassMessage='Nell taps the board. “Two. I meant two.”';playTone(170);render();return;}
        else{changed.chapter4.studiedSections=[...selected,id];const def=BLACKGLASS_SECTION_DEFS.find(section=>section.id===id);state.blackglassMessage=`${def?.name||'Section'} locked for deep study. ${def?.benefit||''}`;}
        playTone(340);void saveBlackglassSameBeat(changed);
      }));
      root.querySelector('[data-bg-study-finish]')?.addEventListener('click',()=>void completeBlackglassBeat(changed=>{changed.chapter4.reputation+=1;changed.identity.focus+=1;changed.history.push({scene:'q23',event:'circuit-study',sections:[...changed.chapter4.studiedSections]});}));
    }

    if(beat.type==='blackglass-evening-planner'){
      root.querySelectorAll('[data-bg-evening]').forEach(button=>button.addEventListener('click',()=>{state.blackglassActivity=button.dataset.bgEvening;state.blackglassMessage='';playTone(320);render();}));
      root.querySelector('[data-bg-evening-cancel]')?.addEventListener('click',()=>{state.blackglassActivity='';render();});
      root.querySelectorAll('[data-bg-evening-response]').forEach(button=>button.addEventListener('click',()=>{
        const id=state.blackglassActivity,activity=BLACKGLASS_EVENING_ACTIVITIES[id],index=Number(button.dataset.bgEveningResponse),response=activity?.responses?.[index];if(!response)return;
        const changed=cloneValue(state.story),c4=changed.chapter4;if(!c4.eveningMoments.includes(id)&&c4.eveningMoments.length<2){applyStoryEffects(changed,response.effects);c4.eveningMoments.push(id);c4.eveningResponses[id]=response.tag||index;if(id==='rook'){c4.reputation+=1;if(response.tag==='secret')c4.localTip='storm-span';}if(id==='nell'&&(response.tag==='detail'||response.tag==='simple'))c4.telemetryReady=true;if(id==='nell'&&response.tag==='dragon')c4.dragonState='settled';if(id==='tyrese'&&response.tag==='trust')c4.tyreseCallout=true;changed.history.push({scene:'q25',event:'blackglass-evening',activity:id,response:response.tag||index});}
        state.blackglassActivity='';playTone(430);void saveBlackglassSameBeat(changed);
      }));
      root.querySelector('[data-bg-evening-finish]')?.addEventListener('click',()=>void completeBlackglassBeat());
    }

    if(beat.type==='blackglass-room-night'){
      root.querySelectorAll('[data-bg-room-action]').forEach(button=>button.addEventListener('click',()=>{
        const action=button.dataset.bgRoomAction,changed=cloneValue(state.story),c4=changed.chapter4;if(c4.roomActions.includes(action)||c4.roomActions.length>=3)return;c4.roomActions.push(action);
        if(action==='settle'){c4.dragonState='settled';changed.relationships.dragonBond+=2;state.blackglassMessage='[PLAYER_DRAGON] shifts twice, sighs, and finally stops listening to every gust against the window.';}
        if(action==='grid'){changed.identity.focus+=1;state.blackglassMessage='The gaps are smaller than the positions make them look. That helps.';}
        if(action==='card'){changed.relationships.nellBond+=1;state.blackglassMessage=`You trace ${blackglassStudiedText(changed)} once, then put the card down before it turns into superstition.`;}
        if(action==='pack'){changed.relationships.quickquillTrust+=1;state.blackglassMessage='Morning-you now has goggles, pass, towel and spare strap in one place. A rare act of kindness.';}
        if(action==='rain'){changed.identity.heart+=1;state.blackglassMessage='For sixty seconds you let Blackglass be scenery instead of a problem to solve.';}
        playTone(300);void saveBlackglassSameBeat(changed);
      }));
      root.querySelector('[data-bg-room-sleep]')?.addEventListener('click',()=>void completeBlackglassBeat(changed=>{changed.history.push({scene:'q26',event:'blackglass-room-lights-out',actions:[...changed.chapter4.roomActions],dragonState:changed.chapter4.dragonState});}));
    }

    if(beat.type==='blackglass-morning-prep'){
      root.querySelectorAll('[data-bg-morning]').forEach(button=>button.addEventListener('click',()=>{
        const id=button.dataset.bgMorning,item=BLACKGLASS_MORNING_PREP[id];if(!item)return;
        void completeBlackglassBeat(changed=>{changed.chapter4.morningPrep=id;if(id==='warmup'){changed.chapter4.dragonState='sharp';changed.relationships.dragonBond+=1;}if(id==='technical'){changed.relationships.nellBond+=2;changed.identity.focus+=1;}if(id==='breakfast'){changed.chapter4.dragonState='rested';changed.identity.heart+=1;}if(id==='balcony'){changed.identity.heart+=1;changed.relationships.tyreseBond+=1;}changed.history.push({scene:'q27',event:'race-morning-prep',prep:id});});
      }));
    }
  }

  function roomChoiceCard(slot, value, label, image, selected) {
    return `<button type="button" class="downtime-choice-card ${selected ? 'is-selected' : ''}" data-room-choice="${escapeHtml(slot)}" data-room-value="${escapeHtml(value)}">
      <span class="downtime-choice-art">${image ? `<img src="${image}" alt="">` : '<i>—</i>'}</span>
      <strong>${escapeHtml(label)}</strong>
      <small>${selected ? 'SELECTED' : 'PLACE'}</small>
    </button>`;
  }

  function eveningPlannerMarkup() {
    const c3 = chapter3State();
    const used = c3.eveningMoments || [];
    const remaining = Math.max(0, 2 - used.length);
    if (state.downtimeActivity && EVENING_ACTIVITIES[state.downtimeActivity]) {
      const activity = EVENING_ACTIVITIES[state.downtimeActivity];
      return `<section class="downtime-activity-card">
        <small>${escapeHtml(activity.kicker)}</small>
        <h2>${escapeHtml(activity.title)}</h2>
        <p>${escapeHtml(storyCopy(activity.intro))}</p>
        <blockquote>${escapeHtml(storyCopy(activity.line))}</blockquote>
        <div class="downtime-response-list">
          ${activity.responses.map((option, index) => `<button type="button" data-evening-response="${index}"><b>${String.fromCharCode(65+index)}</b><span><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.note)}</small></span><i>›</i></button>`).join('')}
        </div>
        <button type="button" class="downtime-small-back" data-evening-cancel>BACK TO EVENING</button>
      </section>`;
    }
    return `<section class="downtime-planner-card">
      <header><div><small>FIRST EVENING AT QUICKQUILL</small><h2>Where do you spend your time?</h2></div><span><b>${remaining}</b> MOMENT${remaining===1?'':'S'} LEFT</span></header>
      <div class="downtime-activity-grid">
        ${Object.entries(EVENING_ACTIVITIES).map(([id,activity]) => {
          const done=used.includes(id);
          return `<button type="button" data-evening-activity="${id}" ${done || remaining===0 ? 'disabled' : ''} class="${done?'is-done':''}">
            <span>${done?'✓':'+'}</span><div><small>${escapeHtml(activity.kicker)}</small><strong>${escapeHtml(activity.title)}</strong></div>
          </button>`;
        }).join('')}
      </div>
      <p class="downtime-planner-note">${remaining ? 'You cannot do everything tonight. The choices you make here are remembered.' : 'The headquarters has gone quiet. Your two evening moments are now part of this save.'}</p>
      ${remaining===0 ? '<button type="button" class="downtime-primary" data-evening-finish>LET THE NIGHT END</button>' : ''}
    </section>`;
  }

  function dutySelectMarkup() {
    const c3 = chapter3State();
    const chosen = c3.duty?.type || '';
    const options = [
      ['equipment','NELL','Equipment inspection','Check fittings, tags and race hardware.'],
      ['dispatch','MARA','Team dispatch','Sort passes, permits and sealed deliveries.'],
      ['recovery','TYRESE','Dragon recovery','Read body language and choose the right care.']
    ];
    return `<section class="downtime-duty-select">
      <small>ONE JOB · NO WRONG STORY PATH</small>
      <h2>Pick your Quickquill duty</h2>
      <div class="downtime-duty-grid">
        ${options.map(([id,who,title,desc])=>`<button type="button" data-duty-pick="${id}" class="${chosen===id?'is-selected':''}">
          <span>${who}</span><strong>${title}</strong><p>${desc}</p><i>›</i>
        </button>`).join('')}
      </div>
      <p>Doing badly changes the reaction, not the chapter. Quickquill does not fire rookies for putting a clipboard in the wrong pile.</p>
    </section>`;
  }

  function ensureDutySession() {
    const type = chapter3State().duty?.type;
    if (!type || !DUTY_GAMES[type]) return null;
    if (!state.dutySession || state.dutySession.type !== type) {
      state.dutySession = { type, index: 0, score: 0, answers: [], lastCorrect: null };
    }
    return state.dutySession;
  }

  function dutyGameMarkup() {
    const session = ensureDutySession();
    if (!session) return '<section class="downtime-duty-game"><h2>No duty selected.</h2></section>';
    const game = DUTY_GAMES[session.type];
    const total = game.questions.length;
    if (session.index >= total) {
      const perfect = session.score === total;
      return `<section class="downtime-duty-result ${perfect?'is-perfect':''}">
        <small>${escapeHtml(game.title)}</small>
        <h2>${session.score} / ${total}</h2>
        <strong>${perfect ? 'PERFECT SHIFT' : session.score >= 4 ? 'SOLID WORK' : 'YOU SURVIVED THE ROSTER'}</strong>
        <p>${perfect ? 'Not a single correction needed. Somebody at Quickquill is quietly impressed.' : session.score >= 4 ? 'One wobble, otherwise reliable. That counts for more than looking confident.' : 'A few things ended up in interesting places. Nobody died. The lesson sticks.'}</p>
        <button type="button" class="downtime-primary" data-duty-finish>CLOCK OUT</button>
      </section>`;
    }
    const question = game.questions[session.index];
    return `<section class="downtime-duty-game">
      <header><div><small>${escapeHtml(game.title)}</small><h2>Item ${session.index+1} of ${total}</h2></div><span>SCORE <b>${session.score}</b></span></header>
      ${session.lastCorrect === null ? '' : `<div class="downtime-duty-feedback ${session.lastCorrect?'is-correct':'is-wrong'}">${session.lastCorrect ? 'CORRECT' : 'NOT QUITE'} · next item</div>`}
      <div class="downtime-duty-object"><img src="story/props/${session.type==='equipment'?'quickquill-badge.png':session.type==='dispatch'?'duty-card.png':'canto-keepsake.png'}" alt=""><p>${escapeHtml(question.text)}</p></div>
      <div class="downtime-duty-actions">
        ${game.options.map(option=>`<button type="button" data-duty-answer="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join('')}
      </div>
    </section>`;
  }

  function freeRoamMarkup() {
    const c3 = chapter3State();
    const seen = c3.freeRoamSeen || [];
    return `<section class="downtime-free-roam-card">
      <header><div><small>FREE AFTERNOON</small><h2>Nothing urgent for once.</h2></div><span><b>${seen.length}</b> THINGS NOTICED</span></header>
      <p>Click around the common room. You can leave after exploring three things, but nothing stops you staying longer.</p>
      ${seen.length >= 3 ? '<button type="button" class="downtime-primary" data-free-roam-finish>HEAD BACK UPSTAIRS</button>' : ''}
    </section>
    <button type="button" class="downtime-hotspot is-trophies" data-free-roam="trophies"><span>TROPHY WALL</span></button>
    <button type="button" class="downtime-hotspot is-notice" data-free-roam="notice"><span>ROUTE BOARD</span></button>
    <button type="button" class="downtime-hotspot is-dragon-rest" data-free-roam="dragon"><span>DRAGON CORNER</span></button>
    <button type="button" class="downtime-hotspot is-breakfast" data-free-roam="breakfast"><span>LONG TABLE</span></button>
    <button type="button" class="downtime-hotspot is-mug" data-free-roam="mug"><span>ABANDONED MUG</span></button>
    ${state.downtimeMessage ? `<div class="downtime-toast">${escapeHtml(state.downtimeMessage)}</div>` : ''}`;
  }

  function nightRoutineMarkup() {
    const c3 = chapter3State();
    const actions = c3.nightActions || [];
    const has = id => actions.includes(id);
    return `<section class="downtime-night-card">
      <header><div><small>YOUR ROOM · QUIET HOURS</small><h2>One last thing before sleep.</h2></div><span>${actions.length ? 'ROOM SETTLED' : 'THE NIGHT IS YOURS'}</span></header>
      <div class="downtime-night-actions">
        <button type="button" data-night-action="pet" class="${has('pet')?'is-done':''}"><b>♡</b><span>Pet ${escapeHtml(storyDragonName())}</span></button>
        <button type="button" data-night-action="treat" class="${has('treat')?'is-done':''}"><b>◇</b><span>Offer a treat</span></button>
        <button type="button" data-night-action="journal" class="${has('journal')?'is-done':''}"><b>≡</b><span>Open Career Journal</span></button>
        <button type="button" data-night-action="keepsake" class="${has('keepsake')?'is-done':''}"><b>✦</b><span>Look at the Canto keepsake</span></button>
      </div>
      ${has('journal') ? journalSummaryMarkup() : ''}
      ${state.downtimeMessage ? `<p class="downtime-night-message">${escapeHtml(state.downtimeMessage)}</p>` : ''}
      <button type="button" class="downtime-primary" data-night-sleep ${actions.length ? '' : 'disabled'}>TURN OUT THE LIGHT</button>
    </section>`;
  }


  function cleanDuplicateSceneLayers() {
    ['.downtime-dragon-wrap','.story-portrait','.downtime-room-decor.is-wall','.downtime-room-decor.is-shelf','.downtime-room-decor.is-dragon-corner'].forEach(selector => {
      const nodes = [...root.querySelectorAll(selector)];
      nodes.slice(0, -1).forEach(node => node.remove());
    });
  }

  function renderDowntimeInteractive(scene, beat, sceneIndex) {
    window.clearTimeout(storyRevealTimer);
    storyRevealTimer = 0;
    state.storyRevealComplete = true;
    const c3 = chapter3State();
    const activity = state.downtimeActivity ? EVENING_ACTIVITIES[state.downtimeActivity] : null;
    const background = activity?.background || (beat.type === 'morning-corridor' ? 'story/environments/11_Quickquill_Accommodation_Corridor.png' : scene.background);
    let content = '';
    let extra = '';
    let portrait = '';

    if (beat.type === 'corridor-explore') {
      content = `<section class="downtime-corridor-card"><small>ACCOMMODATION WING</small><h2>Your room is here now.</h2><p>Look around, then use the marked door when you are ready.</p></section>
        <button type="button" class="downtime-hotspot is-corridor-board" data-corridor-look="notice"><span>NOTICEBOARD</span></button>
        <button type="button" class="downtime-hotspot is-tyrese-door" data-corridor-look="tyrese"><span>TYRESE'S DOOR</span></button>
        <button type="button" class="downtime-hotspot is-player-door" data-player-room-door><span>ENTER YOUR ROOM</span></button>
        ${downtimeNameplateMarkup()}
        ${state.downtimeMessage ? `<div class="downtime-toast">${escapeHtml(state.downtimeMessage)}</div>` : ''}`;
    } else if (beat.type === 'room-customise') {
      const room = c3.room || {};
      const complete = room.wall && room.shelf && room.dragonCorner;
      content = `<section class="downtime-room-panel">
        <header><div><small>UNPACK THREE THINGS</small><h2>Make it feel like yours.</h2></div><span>${[room.wall,room.shelf,room.dragonCorner].filter(Boolean).length}/3</span></header>
        <div class="downtime-room-category"><b>WALL</b><div>
          ${roomChoiceCard('wall','canto_photo','Canto photo','story/props/wall-canto-photo.png',room.wall==='canto_photo')}
          ${roomChoiceCard('wall','pennant','Quickquill pennant','story/props/wall-pennant.png',room.wall==='pennant')}
          ${roomChoiceCard('wall','route_print','Route print','story/props/wall-route-print.png',room.wall==='route_print')}
          ${roomChoiceCard('wall','none','Leave it bare','',room.wall==='none')}
        </div></div>
        <div class="downtime-room-category"><b>SHELF</b><div>
          ${roomChoiceCard('shelf','keepsake','Canto keepsake','story/props/shelf-keepsake.png',room.shelf==='keepsake')}
          ${roomChoiceCard('shelf','books','Books','story/props/shelf-books.png',room.shelf==='books')}
          ${roomChoiceCard('shelf','goggles','Racing goggles','story/props/shelf-goggles.png',room.shelf==='goggles')}
          ${roomChoiceCard('shelf','plant','Small plant','story/props/shelf-plant.png',room.shelf==='plant')}
        </div></div>
        <div class="downtime-room-category"><b>DRAGON CORNER</b><div>
          ${roomChoiceCard('dragonCorner','padded_nest','Padded nest','story/props/dragon-padded-nest.png',room.dragonCorner==='padded_nest')}
          ${roomChoiceCard('dragonCorner','blankets','Blanket pile','story/props/dragon-blankets.png',room.dragonCorner==='blankets')}
          ${roomChoiceCard('dragonCorner','toy','Toy','story/props/dragon-toy.png',room.dragonCorner==='toy')}
        </div></div>
        <button type="button" class="downtime-primary" data-room-finish ${complete?'':'disabled'}>FINISH UNPACKING</button>
      </section>`;
      extra = `${roomDecorMarkup()}${downtimeDragonMarkup(4,'is-room-dragon')}`;
    } else if (beat.type === 'evening-planner') {
      content = eveningPlannerMarkup();
      if (activity?.portrait) portrait = portraitMarkup(activity.portrait);
      else if (state.downtimeActivity === 'dragon') extra = downtimeDragonMarkup(10,'is-evening-dragon');
    } else if (beat.type === 'duty-select') {
      content = dutySelectMarkup();
    } else if (beat.type === 'duty-game') {
      content = dutyGameMarkup();
    } else if (beat.type === 'downtime-free-roam') {
      content = freeRoamMarkup();
      extra = downtimeDragonMarkup(10,'is-lounge-dragon');
    } else if (beat.type === 'night-routine') {
      content = nightRoutineMarkup();
      extra = `${roomDecorMarkup()}${downtimeDragonMarkup((c3.nightActions || []).length ? 11 : 10,'is-night-dragon')}`;
    } else if (beat.type === 'morning-corridor') {
      content = `<section class="downtime-corridor-card is-morning"><small>THE CORRIDOR CHANGED OVERNIGHT</small><h2>Something new is on the board.</h2><p>${c3.morningNoticeSeen ? 'The northern route has a name now. Blackglass.' : 'Have a look before heading downstairs.'}</p>${c3.morningNoticeSeen ? '<button type="button" class="downtime-primary" data-morning-finish>KEEP GOING</button>' : ''}</section>
        <button type="button" class="downtime-hotspot is-corridor-board" data-morning-notice><span>NEW NOTICE</span></button>
        ${downtimeNameplateMarkup()}
        ${state.downtimeMessage ? `<div class="downtime-toast">${escapeHtml(state.downtimeMessage)}</div>` : ''}`;
    }

    root.innerHTML = `
      <section class="story-shell tone-${escapeHtml(scene.tone || 'home')} downtime-story-shell" aria-label="${escapeHtml(scene.number)} ${escapeHtml(scene.title)}">
        <img class="story-backdrop" src="${background}" alt="" aria-hidden="true">
        <div class="story-stage downtime-story-stage ${['q10','q11','q15','q16','q17'].includes(scene.id) ? 'is-private-quarters' : ''}">
          <img class="story-environment" src="${background}" alt="${escapeHtml(scene.title)}">
          <div class="story-light" aria-hidden="true"></div><div class="story-grain" aria-hidden="true"></div><div class="story-letterbox" aria-hidden="true"></div>
          <header class="story-header"><div><small>QUICKQUILL: AGAINST THE ODDS</small><strong>${escapeHtml(scene.number)} · ${escapeHtml(scene.title)}</strong><span>${escapeHtml(scene.location)}</span></div><button type="button" data-story-home aria-label="Return to Career hub">BACK TO HUB</button></header>
          ${portrait}${extra}
          <div class="story-scene-counter" aria-hidden="true"><i style="--story-progress:${((sceneIndex + 1) / QUICKQUILL_DOWNTIME_SCENES.length) * 100}%"></i><span>DOWNTIME ${sceneIndex + 1} / ${QUICKQUILL_DOWNTIME_SCENES.length}</span></div>
          <div class="downtime-interactive-layer">${content}</div>
          ${state.storyError ? `<div class="story-error downtime-story-error" role="alert">${escapeHtml(state.storyError)}</div>` : ''}
        </div><div class="story-screen-vignette" aria-hidden="true"></div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;

    bindChapterFiveBackgroundFallback(scene);
    cleanDuplicateSceneLayers();
    root.querySelector('[data-story-home]')?.addEventListener('click', event => { event.stopPropagation(); returnToHubFromStory(); });

    if (beat.type === 'corridor-explore') {
      root.querySelectorAll('[data-corridor-look]').forEach(button => button.addEventListener('click', () => {
        const id = button.dataset.corridorLook;
        const changed = cloneValue(state.story);
        if (!changed.chapter3.corridorSeen.includes(id)) changed.chapter3.corridorSeen.push(id);
        state.downtimeMessage = id === 'notice'
          ? 'POST-CANTO RETURN · meal time · equipment return · tomorrow’s duty roster. Nothing about another race.'
          : 'Quiet music behind the door. Tyrese must actually be tired.';
        playTone(250);
        void saveDowntimeSameBeat(changed);
      }));
      root.querySelector('[data-player-room-door]')?.addEventListener('click', () => {
        void completeDowntimeBeat(changed => {
          changed.chapter3.roomKeyReceived = true;
          changed.history.push({ scene: 'q10', event: 'first-room-entry', seen: [...changed.chapter3.corridorSeen] });
        });
      });
    }

    if (beat.type === 'room-customise') {
      root.querySelectorAll('[data-room-choice]').forEach(button => button.addEventListener('click', () => {
        const changed = cloneValue(state.story);
        changed.chapter3.room[button.dataset.roomChoice] = button.dataset.roomValue;
        playTone(330);
        void saveDowntimeSameBeat(changed);
      }));
      root.querySelector('[data-room-finish]')?.addEventListener('click', () => {
        void completeDowntimeBeat(changed => {
          changed.chapter3.room.firstDragonChoice = chapter3FirstDragonChoice();
          changed.chapter3.memoryShelfUnlocked = true;
          changed.relationships.dragonBond += 1;
        });
      });
    }

    if (beat.type === 'evening-planner') {
      root.querySelectorAll('[data-evening-activity]').forEach(button => button.addEventListener('click', () => {
        state.downtimeActivity = button.dataset.eveningActivity;
        state.downtimeMessage = '';
        playTone(340);
        render();
      }));
      root.querySelector('[data-evening-cancel]')?.addEventListener('click', () => { state.downtimeActivity = ''; render(); });
      root.querySelectorAll('[data-evening-response]').forEach(button => button.addEventListener('click', () => {
        const id = state.downtimeActivity;
        const activityData = EVENING_ACTIVITIES[id];
        const optionIndex = Number(button.dataset.eveningResponse);
        const option = activityData?.responses?.[optionIndex];
        if (!activityData || !option) return;
        const changed = cloneValue(state.story);
        if (!changed.chapter3.eveningMoments.includes(id) && changed.chapter3.eveningMoments.length < 2) {
          applyStoryEffects(changed, option.effects);
          changed.chapter3.eveningMoments.push(id);
          changed.chapter3.eveningResponses[id] = option.tag || optionIndex;
          if (id === 'dragon') changed.chapter3.dragonStoryBond += 2;
          changed.history.push({ scene: 'q12', event: 'evening-moment', activity: id, response: option.tag || optionIndex });
        }
        state.downtimeActivity = '';
        playTone(430);
        void saveDowntimeSameBeat(changed);
      }));
      root.querySelector('[data-evening-finish]')?.addEventListener('click', () => { void completeDowntimeBeat(); });
    }

    if (beat.type === 'duty-select') {
      root.querySelectorAll('[data-duty-pick]').forEach(button => button.addEventListener('click', () => {
        const type = button.dataset.dutyPick;
        void completeDowntimeBeat(changed => {
          changed.chapter3.duty = { ...changed.chapter3.duty, type, score: 0, total: 5, perfect: false, completed: false };
          changed.history.push({ scene: 'q13', event: 'duty-selected', duty: type });
          state.dutySession = null;
        });
      }));
    }

    if (beat.type === 'duty-game') {
      root.querySelectorAll('[data-duty-answer]').forEach(button => button.addEventListener('click', () => {
        const session = ensureDutySession();
        if (!session) return;
        const game = DUTY_GAMES[session.type];
        const question = game.questions[session.index];
        const answer = button.dataset.dutyAnswer;
        const correct = answer === question.answer;
        if (correct) session.score += 1;
        session.answers.push({ answer, correct });
        session.lastCorrect = correct;
        session.index += 1;
        playTone(correct ? 520 : 170);
        render();
      }));
      root.querySelector('[data-duty-finish]')?.addEventListener('click', () => {
        const session = ensureDutySession();
        if (!session || session.index < DUTY_GAMES[session.type].questions.length) return;
        const game = DUTY_GAMES[session.type];
        void completeDowntimeBeat(changed => {
          const perfect = session.score === game.questions.length;
          changed.chapter3.duty = { type: session.type, score: session.score, total: game.questions.length, perfect, completed: true };
          if (session.score >= 4) changed.chapter3.traits[game.trait] = true;
          changed.relationships[game.relation] = (Number(changed.relationships[game.relation]) || 0) + (session.score >= 4 ? 2 : 1);
          if (perfect) changed.relationships.quickquillTrust += 1;
          changed.history.push({ scene: 'q13', event: 'duty-complete', duty: session.type, score: session.score });
          state.dutySession = null;
        });
      });
    }

    if (beat.type === 'downtime-free-roam') {
      root.querySelectorAll('[data-free-roam]').forEach(button => button.addEventListener('click', () => {
        const id = button.dataset.freeRoam;
        const changed = cloneValue(state.story);
        if (!changed.chapter3.freeRoamSeen.includes(id)) changed.chapter3.freeRoamSeen.push(id);
        if (id === 'mug') {
          state.freeRoamMugClicks += 1;
          state.downtimeMessage = state.freeRoamMugClicks === 1 ? 'Cold.' : state.freeRoamMugClicks === 2 ? 'Still cold.' : 'At this point it may technically qualify as workshop equipment.';
        } else {
          state.downtimeMessage = FREE_ROAM_SPOTS[id]?.text || '';
        }
        playTone(245);
        void saveDowntimeSameBeat(changed);
      }));
      root.querySelector('[data-free-roam-finish]')?.addEventListener('click', () => { void completeDowntimeBeat(); });
    }

    if (beat.type === 'night-routine') {
      root.querySelectorAll('[data-night-action]').forEach(button => button.addEventListener('click', () => {
        const action = button.dataset.nightAction;
        const changed = cloneValue(state.story);
        const c = changed.chapter3;
        const first = !c.nightActions.includes(action);
        if (first) c.nightActions.push(action);
        if (action === 'pet') {
          state.downtimeMessage = `${storyDragonName()} leans into the attention and then pretends that was not what happened.`;
          if (first) { c.dragonStoryBond += 2; changed.relationships.dragonBond += 2; }
        } else if (action === 'treat') {
          state.downtimeMessage = 'The treat disappears with the efficiency of a professional athlete recovering from an exhausting day of doing very little.';
          if (first) { c.dragonStoryBond += 1; changed.relationships.dragonBond += 1; }
        } else if (action === 'journal') {
          c.journalUnlocked = true;
          state.downtimeMessage = 'Entry saved automatically. No perfect version of the day—just the one that actually happened.';
        } else {
          state.downtimeMessage = 'The Canto keepsake already feels older than it is. It is the first thing on a shelf that will not stay empty forever.';
        }
        playTone(300);
        void saveDowntimeSameBeat(changed);
      }));
      root.querySelector('[data-night-sleep]')?.addEventListener('click', () => {
        void completeDowntimeBeat(changed => {
          changed.chapter3.journalUnlocked = true;
          changed.history.push({ scene: 'q15', event: 'first-night-complete', actions: [...changed.chapter3.nightActions] });
        });
      });
    }

    if (beat.type === 'morning-corridor') {
      root.querySelector('[data-morning-notice]')?.addEventListener('click', () => {
        const changed = cloneValue(state.story);
        changed.chapter3.morningNoticeSeen = true;
        state.downtimeMessage = 'NORTHERN TRAVEL ALLOCATION · BLACKGLASS. Tyrese looks at the notice, then at you: “You really haven’t been around long, have you?”';
        playTone(270);
        void saveDowntimeSameBeat(changed);
      });
      root.querySelector('[data-morning-finish]')?.addEventListener('click', () => { void completeDowntimeBeat(); });
    }
  }


  function formatStoryLap(ms) {
    const value = Math.max(0, Number(ms) || 0);
    if (!value) return '—';
    const minutes = Math.floor(value / 60000), seconds = Math.floor((value % 60000) / 1000), thousandths = Math.floor(value % 1000);
    return `${minutes}:${String(seconds).padStart(2,'0')}.${String(thousandths).padStart(3,'0')}`;
  }

  function qualifyingPlanDefinition(plan) {
    return {
      clean: { title: 'BANK A CLEAN LAP', note: 'Low risk · stable exits', pace: 230, variance: 430 },
      chase: { title: "CHASE TYRESE'S SPLIT", note: 'High commitment · higher variance', pace: -380, variance: 980 },
      adapt: { title: 'LEARN, THEN COMMIT', note: 'Adaptive · strongest final sector', pace: -90, variance: 650 }
    }[plan] || null;
  }

  async function resolveBlackglassQualifying(plan) {
    if (state.storySaving || !state.story || state.story?.completed?.blackglass) return;
    const def = qualifyingPlanDefinition(plan);
    if (!def) return;
    const changed = cloneValue(state.story);
    const c4 = changed.chapter4 ||= cloneValue(defaultQuickquillStory().chapter4);
    if (c4.qualifying?.completed) return;
    const strategy = currentBlackglassStrategy(changed);
    const matchBonus = (strategy === 'focus' && plan === 'clean') || (strategy === 'fire' && plan === 'chase') || (strategy === 'heart' && plan === 'adapt') ? -180 : 0;
    const pressure = String(c4.pressureResponse || '');
    const pressureBonus = pressure === 'line' ? -95 : pressure === 'callout' ? -55 : pressure === 'truth' ? -20 : pressure === 'quiet' ? -35 : 0;
    const setup = String(c4.setupPlan || '');
    const setupBonus = (setup === 'stable' && plan === 'clean') || (setup === 'attack' && plan === 'chase') || (setup === 'forgiving' && plan === 'adapt') ? -125 : 0;
    const studyBonus = -Math.min(170, (c4.studiedSections || []).length * 80);
    const localBonus = -Math.min(110, Math.max(0, Number(changed.relationships?.rookRespect)||0) * 12);
    const dragonState = String(c4.dragonState || 'steady');
    const stateVariance = dragonState === 'settled' || dragonState === 'rested' ? .82 : 1;
    const riskRoll = (Math.random() * 2 - 1) * def.variance * stateVariance;
    const stumbleChance = plan === 'chase' ? (setup === 'stable' ? .17 : setup === 'attack' ? .26 : .22) : 0;
    const stumble = stumbleChance && Math.random() < stumbleChance ? 620 + Math.random() * 690 : 0;
    const playerLap = Math.round(82180 + def.pace + matchBonus + pressureBonus + setupBonus + studyBonus + localBonus + riskRoll + stumble);
    const rivals = [
      { name: 'Jalen Cross', lapMs: Math.round(81420 + (Math.random() * 2 - 1) * 520) },
      { name: 'Tyrese Bell', lapMs: Math.round(81720 + (Math.random() * 2 - 1) * 500) },
      { name: 'Sofia Mendes', lapMs: Math.round(82580 + (Math.random() * 2 - 1) * 620) },
      { name: 'Luka Kovač', lapMs: Math.round(82980 + (Math.random() * 2 - 1) * 650) },
      { name: 'Kestrel', lapMs: Math.round(83380 + (Math.random() * 2 - 1) * 720) }
    ];
    const rows = [...rivals, { name: storyDragonName(), lapMs: playerLap, player: true }].sort((a,b)=>a.lapMs-b.lapMs).map((row,index)=>({ ...row, position:index+1 }));
    const player = rows.find(row=>row.player);
    const tyrese = rows.find(row=>row.name === 'Tyrese Bell');
    c4.qualifying = {
      completed: true,
      plan,
      planTitle: def.title,
      position: player?.position || 3,
      lapMs: playerLap,
      referenceDeltaMs: tyrese ? playerLap - tyrese.lapMs : 0,
      grid: rows
    };
    changed.history = [...(changed.history || []), { scene:'q24', event:'blackglass-qualifying', plan, position:c4.qualifying.position, lapMs:playerLap }].slice(-100);
    try {
      await persistStory(changed, { stageOverride:'quickquill-blackglass-story' });
      state.storyError = '';
      playTone(440);
      render();
    } catch (error) {
      console.error('[Dragonbound Career Mode] Blackglass qualifying save failed', error);
      state.storySaving = false;
      state.storyError = error?.message || 'Qualifying could not be saved. Try the lap again.';
      render();
    }
  }

  function renderBlackglassQualifying(scene, beat, sceneIndex) {
    const q = chapter4State().qualifying || {};
    const plans = ['clean','chase','adapt'];
    const rows = Array.isArray(q.grid) ? q.grid : [];
    root.innerHTML = `
      <section class="story-shell tone-blackglass blackglass-qualifying-shell" aria-label="Blackglass qualifying">
        <img class="story-backdrop" src="${scene.background}" alt="" aria-hidden="true">
        <div class="story-stage is-blackglass-qualifying">
          <img class="story-environment" src="${scene.background}" alt="Blackglass Night Circuit">
          <div class="story-light" aria-hidden="true"></div><div class="story-weather" aria-hidden="true"></div><div class="story-grain" aria-hidden="true"></div><div class="story-letterbox" aria-hidden="true"></div>
          <header class="story-header"><div><small>QUICKQUILL: AGAINST THE ODDS</small><strong>Q24 · NIGHT QUALIFYING</strong><span>Blackglass Night Circuit · one flying lap</span></div><button type="button" data-story-home>BACK TO HUB</button></header>
          ${storyDragonMarkup(scene, beat)}
          <div class="story-scene-counter"><i style="--story-progress:${((sceneIndex + 1) / QUICKQUILL_BLACKGLASS_SCENES.length) * 100}%"></i><span>RACE TWO ${sceneIndex + 1} / ${QUICKQUILL_BLACKGLASS_SCENES.length}</span></div>
          <section class="blackglass-qualifying-panel ${q.completed ? 'has-result' : ''}">
            <div class="blackglass-quali-heading"><small>BLACKGLASS · QUALIFYING</small><h1>${q.completed ? `GRID ${ordinal(q.position)}` : 'CHOOSE THE LAP'}</h1><p>${q.completed ? 'The lap is banked. No rerolls. This is where you start the race.' : 'This is a story decision, not a reaction test. Pick how you want to attack one lap under the floodlights. Your circuit study, setup and earlier choices quietly influence the result.'}</p></div>
            ${q.completed ? `
              <div class="blackglass-quali-result">
                <div class="blackglass-quali-hero"><span>YOUR LAP</span><strong>${escapeHtml(formatStoryLap(q.lapMs))}</strong><small>${q.referenceDeltaMs <= 0 ? '−' : '+'}${escapeHtml(formatStoryLap(Math.abs(q.referenceDeltaMs)).replace(/^0:/,''))} vs Tyrese</small></div>
                <div class="blackglass-grid-board">${rows.map(row=>`<div class="blackglass-grid-row ${row.player?'is-player':''}"><b>P${row.position}</b><span>${escapeHtml(row.name)}</span><strong>${escapeHtml(formatStoryLap(row.lapMs))}</strong></div>`).join('')}</div>
                <div class="blackglass-quali-plan-memory"><small>PLAN</small><strong>${escapeHtml(q.planTitle || qualifyingPlanDefinition(q.plan)?.title || 'QUALIFYING LAP')}</strong></div>
                <button type="button" data-qualifying-lock ${state.storySaving?'disabled':''}>${state.storySaving?'SAVING…':'LOCK IN GRID'}</button>
              </div>` : `
              <div class="blackglass-quali-plans">${plans.map((plan,index)=>{const def=qualifyingPlanDefinition(plan);return `<button type="button" class="blackglass-quali-plan" data-qualifying-plan="${plan}" ${state.storySaving?'disabled':''}><b>0${index+1}</b><span><strong>${escapeHtml(def.title)}</strong><small>${escapeHtml(def.note)}</small></span><i>›</i></button>`;}).join('')}</div>
              <div class="blackglass-quali-tip"><span>TYRESE</span><p>“Do not qualify for the race you wish Blackglass was. Qualify for the one it actually is.”</p></div>`}
            ${state.storyError ? `<div class="story-error" role="alert">${escapeHtml(state.storyError)}</div>` : ''}
          </section>
        </div><div class="story-screen-vignette" aria-hidden="true"></div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelector('[data-story-home]')?.addEventListener('click', returnToHubFromStory);
    root.querySelectorAll('[data-qualifying-plan]').forEach(button=>button.addEventListener('click',()=>{ void resolveBlackglassQualifying(button.dataset.qualifyingPlan); }));
    root.querySelector('[data-qualifying-lock]')?.addEventListener('click',()=>{
      const next = nextStoryPointer(state.story);
      void saveStoryProgress(next.story, { transition:false });
    });
  }


  const CHAPTER_FIVE_BACKGROUND_FALLBACKS = {
    q32:'story/environments/03_Quickquill_Workshop.png',
    q33:'story/environments/03_Quickquill_Workshop.png',
    q34:'story/environments/03_Quickquill_Workshop.png',
    q35:'story/environments/07_Lumerre_Terraces_and_Paddock.png',
    q36:'story/environments/10_Quickquill_Lounge_Common_Room.png',
    q37:'story/environments/10_Quickquill_Lounge_Common_Room.png',
    q38:'story/environments/03_Quickquill_Workshop.png',
    q39:'story/environments/07_Lumerre_Terraces_and_Paddock.png'
  };

  function bindChapterFiveBackgroundFallback(scene) {
    if (!QUICKQUILL_SEAT_SCENES.some(item => item.id === scene?.id)) return;
    const fallback = CHAPTER_FIVE_BACKGROUND_FALLBACKS[scene.id] || 'story/environments/03_Quickquill_Workshop.png';
    root.querySelectorAll('img.story-backdrop,img.story-environment').forEach(image => {
      image.addEventListener('error', () => {
        if (image.dataset.chapterFiveFallback === '1') return;
        image.dataset.chapterFiveFallback = '1';
        console.warn('[Dragonbound Career Mode] Chapter Five background missing, using safe fallback', image.src);
        image.src = fallback;
      }, { once:true });
    });
  }

  const CROWN_WEEK_BACKGROUND_FALLBACKS = {
    q40:'story/environments/07_Lumerre_Terraces_and_Paddock.png',
    q41:'story/environments/07_Lumerre_Terraces_and_Paddock.png',
    q42:'story/environments/07_Lumerre_Terraces_and_Paddock.png',
    q43:'story/environments/08_Lumerre_Crown_Circuit.png',
    q44:'story/environments/07_Lumerre_Terraces_and_Paddock.png',
    q45:'story/environments/10_Quickquill_Lounge_Common_Room.png'
  };

  function bindCrownWeekBackgroundFallback(scene) {
    if (!QUICKQUILL_CROWN_WEEK_SCENES.some(item => item.id === scene?.id)) return;
    const fallback = CROWN_WEEK_BACKGROUND_FALLBACKS[scene.id] || 'story/environments/07_Lumerre_Terraces_and_Paddock.png';
    root.querySelectorAll('img.story-backdrop,img.story-environment').forEach(image => {
      image.addEventListener('error', () => {
        if (image.dataset.crownWeekFallback === '1') return;
        image.dataset.crownWeekFallback = '1';
        console.warn('[Dragonbound Career Mode] Crown Week background missing, using safe Lumerre fallback', image.src);
        image.src = fallback;
      }, { once:true });
    });
  }

  const LUMERRE_PRACTICE_BACKGROUND_FALLBACKS = {
    q46:'story/environments/03_Quickquill_Workshop.png',q47:'story/environments/08_Lumerre_Crown_Circuit.png',q48:'story/environments/03_Quickquill_Workshop.png',q49:'story/environments/03_Quickquill_Workshop.png',q50:'story/environments/08_Lumerre_Crown_Circuit.png',q51:'story/environments/08_Lumerre_Crown_Circuit.png',q52:'story/environments/08_Lumerre_Crown_Circuit.png',q53:'story/environments/08_Lumerre_Crown_Circuit.png',q54:'story/environments/08_Lumerre_Crown_Circuit.png',q55:'story/environments/03_Quickquill_Workshop.png',q56:'story/environments/08_Lumerre_Crown_Circuit.png'
  };
  function bindLumerrePracticeBackgroundFallback(scene) {
    if (!QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(item=>item.id===scene?.id)) return;
    const fallback=LUMERRE_PRACTICE_BACKGROUND_FALLBACKS[scene.id]||'story/environments/08_Lumerre_Crown_Circuit.png';
    root.querySelectorAll('img.story-backdrop,img.story-environment').forEach(image=>image.addEventListener('error',()=>{if(image.dataset.lumerrePracticeFallback==='1')return;image.dataset.lumerrePracticeFallback='1';console.warn('[Dragonbound Career Mode] V34.28 background missing, using safe fallback',image.src);image.src=fallback;},{once:true}));
  }

  function seatStageShell(scene, sceneIndex, body, extraClass='') {
    return `<section class="story-shell tone-${escapeHtml(scene.tone||'seat')} seat-story-shell" aria-label="${escapeHtml(scene.number)} ${escapeHtml(scene.title)}">
      <img class="story-backdrop" src="${scene.background}" alt="" aria-hidden="true">
      <div class="story-stage seat-stage ${extraClass}">
        <img class="story-environment" src="${scene.background}" alt="${escapeHtml(scene.title)}">
        <div class="story-light" aria-hidden="true"></div><div class="story-grain" aria-hidden="true"></div><div class="story-letterbox" aria-hidden="true"></div>
        <header class="story-header"><div><small>QUICKQUILL: AGAINST THE ODDS</small><strong>${escapeHtml(scene.number)} · ${escapeHtml(scene.title)}</strong><span>${escapeHtml(scene.location)}</span></div><button type="button" data-story-home>BACK TO HUB</button></header>
        <div class="story-scene-counter" aria-hidden="true"><i style="--story-progress:${((sceneIndex+1)/QUICKQUILL_SEAT_SCENES.length)*100}%"></i><span>CAREER REVIEW ${sceneIndex+1} / ${QUICKQUILL_SEAT_SCENES.length}</span></div>
        ${body}
      </div><div class="story-screen-vignette" aria-hidden="true"></div>
    </section><div class="blackout ${state.blackout?'is-visible':''}" aria-hidden="true"></div>`;
  }

  function bindSeatBack() {
    root.querySelector('[data-story-home]')?.addEventListener('click', event=>{event.stopPropagation();returnToHubFromStory();});
  }

  function renderSeatSimulator(scene, beat, sceneIndex) {
    const changed=state.story, c5=chapter5State(changed), sim=c5.simulator||defaultQuickquillStory().chapter5.simulator;
    const index=Math.max(0,Math.min(SEAT_SIMULATOR_SCENARIOS.length-1,Number(sim.index)||0));
    const scenario=SEAT_SIMULATOR_SCENARIOS[index];
    const metrics={...defaultQuickquillStory().chapter5.simulator.metrics,...(sim.metrics||{})};
    const completed=!!sim.completed;
    const gauges=[['RACE READING',metrics.reading],['ENERGY',metrics.energy],['AGGRESSION',metrics.aggression],['TEAM DISCIPLINE',metrics.team]];
    const feedback=sim.feedback || '';
    const body=`<section class="seat-simulator" aria-live="polite">
      <header><div><small>NELL WREN · TACTICAL SIMULATION</small><h1>${completed?'ASSESSMENT LOCKED':`SCENARIO ${String(index+1).padStart(2,'0')} · ${escapeHtml(scenario.title)}`}</h1></div><span>${completed?'6 / 6':`${index+1} / ${SEAT_SIMULATOR_SCENARIOS.length}`}</span></header>
      <div class="seat-sim-layout">
        <section class="seat-sim-track"><div class="seat-sim-sector"><small>ACTIVE SECTOR</small><strong>${escapeHtml(scenario.sector)}</strong></div><svg viewBox="0 0 760 360" role="img" aria-label="Simplified Lumerre simulation route"><path class="seat-route-shadow" d="M80 245 C130 70 300 85 332 178 S470 310 535 180 S650 82 700 145"/><path class="seat-route" d="M80 245 C130 70 300 85 332 178 S470 310 535 180 S650 82 700 145"/><circle class="seat-route-node" cx="${110+index*105}" cy="${index%2?155:215}" r="9"/></svg><div class="seat-sim-situation"><small>LIVE CALL</small><p>${escapeHtml(scenario.situation)}</p></div></section>
        <aside class="seat-sim-telemetry"><small>QUICKQUILL LIVE TELEMETRY</small>${gauges.map(([label,val])=>`<div class="seat-gauge"><span><b>${escapeHtml(label)}</b><i>${Math.round(clampSeatMetric(val))}</i></span><em><u style="width:${clampSeatMetric(val)}%"></u></em></div>`).join('')}<div class="seat-sim-priority"><span>DEVELOPMENT</span><strong>${escapeHtml(String(c5.developmentPriority||'control').toUpperCase())}</strong></div></aside>
      </div>
      ${completed?`<section class="seat-assessment"><small>NELL'S ASSESSMENT</small><h2>${escapeHtml(sim.profile||deriveSeatSimulatorProfile(changed))}</h2><div>${gauges.map(([label,val])=>`<span><b>${escapeHtml(label)}</b><strong>${val>=62?'STRONG':val<=42?'RISK AREA':'BALANCED'}</strong></span>`).join('')}</div><p>There is no score to chase. This profile is how Quickquill now expects you to make decisions under pressure.</p><button type="button" data-seat-sim-finish>LOCK ASSESSMENT & CONTINUE</button></section>`:
      feedback?`<section class="seat-sim-feedback"><small>SIMULATION RESPONSE</small><p>${escapeHtml(feedback)}</p><button type="button" data-seat-sim-next>${index===SEAT_SIMULATOR_SCENARIOS.length-1?'GENERATE ASSESSMENT':'NEXT SCENARIO'}</button></section>`:
      `<div class="seat-sim-options">${scenario.options.map((option,i)=>`<button type="button" data-seat-sim-choice="${i}" ${state.storySaving?'disabled':''}><b>${String.fromCharCode(65+i)}</b><span><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.note)}</small></span><i>›</i></button>`).join('')}</div>`}
      ${state.storyError?`<div class="story-error" role="alert">${escapeHtml(state.storyError)}</div>`:''}
    </section>`;
    root.innerHTML=seatStageShell(scene,sceneIndex,body,'is-seat-simulator'); bindChapterFiveBackgroundFallback(scene); bindSeatBack();
    root.querySelectorAll('[data-seat-sim-choice]').forEach(button=>button.addEventListener('click',()=>void chooseSeatSimulatorOption(Number(button.dataset.seatSimChoice))));
    root.querySelector('[data-seat-sim-next]')?.addEventListener('click',()=>void continueSeatSimulator());
    root.querySelector('[data-seat-sim-finish]')?.addEventListener('click',()=>void finishSeatSimulator());
  }

  async function chooseSeatSimulatorOption(optionIndex) {
    if (state.storySaving || state.transitionLocked) return;
    const changed=cloneValue(state.story), c5=changed.chapter5, sim=c5.simulator;
    const index=Math.max(0,Math.min(SEAT_SIMULATOR_SCENARIOS.length-1,Number(sim.index)||0)), scenario=SEAT_SIMULATOR_SCENARIOS[index], option=scenario?.options?.[optionIndex];
    if(!option || sim.feedback) return;
    sim.metrics={...sim.metrics}; Object.entries(option.effects||{}).forEach(([key,val])=>sim.metrics[key]=clampSeatMetric((Number(sim.metrics[key])||50)+Number(val||0)));
    sim.answers=[...(sim.answers||[]),{scenario:scenario.id,option:optionIndex,label:option.label}].slice(0,6); sim.feedback=option.feedback;
    applyStoryEffects(changed,option.story||{}); changed.history=[...(changed.history||[]),{scene:'q34',event:'simulator-call',scenario:scenario.id,option:option.label}].slice(-100);
    state.story=changed; render(); try{await persistStory(changed,{stageOverride:'quickquill-seat-story'});}catch(error){state.storyError=error?.message||'Simulator choice could not be saved.';render();}
  }

  async function continueSeatSimulator() {
    if(state.storySaving||state.transitionLocked)return;
    const changed=cloneValue(state.story), sim=changed.chapter5.simulator;
    if(!sim.feedback)return;
    if((Number(sim.index)||0)>=SEAT_SIMULATOR_SCENARIOS.length-1){sim.completed=true;sim.profile=deriveSeatSimulatorProfile(changed);sim.feedback='';}
    else {sim.index=(Number(sim.index)||0)+1;sim.feedback='';}
    state.story=changed;render();try{await persistStory(changed,{stageOverride:'quickquill-seat-story'});}catch(error){state.storyError=error?.message||'Simulator progress could not be saved.';render();}
  }

  async function finishSeatSimulator() {
    if(state.storySaving||state.transitionLocked)return;
    const changed=cloneValue(state.story); changed.chapter5.simulator.completed=true; changed.chapter5.simulator.profile=changed.chapter5.simulator.profile||deriveSeatSimulatorProfile(changed);
    const next=nextStoryPointer(changed); await saveStoryProgress(next.story,{transition:next.changedScene}); syncMusic({restart:true});
  }

  function renderSeatMediaScrum(scene, beat, sceneIndex) {
    const c5=chapter5State(), media=c5.media||{}, answers=Array.isArray(media.answers)?media.answers:[], answered=new Set(answers.map(item=>item.reporter));
    const active=SEAT_REPORTERS.find(r=>r.id===state.seatMediaReporter&&!answered.has(r.id));
    const latest=(media.headlines||[]).slice(-1)[0]||'';
    const body=`<section class="seat-media" aria-live="polite"><header><div><small>LUMERRE MEDIA PREVIEW</small><h1>PRESS SCRUM</h1></div><span>${answers.length} / 3 ANSWERED</span></header>
      <div class="seat-media-main"><section class="seat-media-wall">${storyDragonMarkup(scene,{})}<div class="seat-media-status"><small>MEDIA REPUTATION</small><strong>${escapeHtml(media.reputation||deriveMediaReputation())}</strong><span>Choose three outlets. The others will write something anyway.</span></div>${latest?`<article class="seat-headline"><small>LATEST CLIPPING</small><h2>${escapeHtml(latest)}</h2></article>`:''}</section>
      <aside class="seat-reporters">${active?`<button type="button" class="seat-reporter-back" data-seat-reporter-back>← OTHER REPORTERS</button><div class="seat-question"><small>${escapeHtml(active.name)} · ${escapeHtml(active.angle)}</small><h2>${escapeHtml(active.question)}</h2></div><div class="seat-tone-grid">${SEAT_MEDIA_TONES.map(t=>`<button type="button" data-seat-media-tone="${t.id}"><strong>${escapeHtml(t.label)}</strong><small>${escapeHtml(t.note)}</small></button>`).join('')}</div>`:`<small>SELECT A REPORTER</small>${SEAT_REPORTERS.map(r=>`<button type="button" class="seat-reporter ${answered.has(r.id)?'is-done':''}" data-seat-reporter="${r.id}" ${answered.has(r.id)||answers.length>=3?'disabled':''}><span><b>${escapeHtml(r.name)}</b><small>${escapeHtml(r.angle)}</small></span><i>${answered.has(r.id)?'✓':'›'}</i></button>`).join('')}${answers.length>=3?`<button type="button" class="seat-media-finish" data-seat-media-finish>END MEDIA SESSION</button>`:''}`}</aside></div>
      <footer><span>CONFIDENT</span><span>TEAM-FIRST</span><span>HONEST</span><span>DEFLECT</span><span>JOKE</span><span>CHALLENGE</span></footer></section>`;
    root.innerHTML=seatStageShell(scene,sceneIndex,body,'is-seat-media'); bindChapterFiveBackgroundFallback(scene); bindSeatBack();
    root.querySelectorAll('[data-seat-reporter]').forEach(button=>button.addEventListener('click',()=>{state.seatMediaReporter=String(button.dataset.seatReporter||'');playTone(260);render();syncMusic();}));
    root.querySelector('[data-seat-reporter-back]')?.addEventListener('click',()=>{state.seatMediaReporter='';render();syncMusic();});
    root.querySelectorAll('[data-seat-media-tone]').forEach(button=>button.addEventListener('click',()=>void answerSeatMedia(String(button.dataset.seatMediaTone||''))));
    root.querySelector('[data-seat-media-finish]')?.addEventListener('click',()=>void finishSeatMedia());
  }

  async function answerSeatMedia(toneId) {
    if(state.storySaving||state.transitionLocked)return;
    const reporter=SEAT_REPORTERS.find(r=>r.id===state.seatMediaReporter), tone=SEAT_MEDIA_TONES.find(t=>t.id===toneId); if(!reporter||!tone)return;
    const changed=cloneValue(state.story), media=changed.chapter5.media; if((media.answers||[]).some(a=>a.reporter===reporter.id)||(media.answers||[]).length>=3)return;
    const headline=seatMediaHeadline(reporter.id,tone.id); media.answers=[...(media.answers||[]),{reporter:reporter.id,tone:tone.id}].slice(0,3); media.headlines=[...(media.headlines||[]),headline].slice(0,3);
    media.scores={...media.scores};Object.entries(tone.scores||{}).forEach(([key,val])=>media.scores[key]=(Number(media.scores[key])||0)+Number(val||0)); applyStoryEffects(changed,tone.effects||{}); media.reputation=deriveMediaReputation(changed);
    changed.history=[...(changed.history||[]),{scene:'q35',event:'media-answer',reporter:reporter.id,tone:tone.id,headline}].slice(-100); state.seatMediaReporter=''; state.story=changed; render();
    try{await persistStory(changed,{stageOverride:'quickquill-seat-story'});}catch(error){state.storyError=error?.message||'Media answer could not be saved.';render();}
  }

  async function finishSeatMedia() {
    if(state.storySaving||state.transitionLocked)return; const changed=cloneValue(state.story); if((changed.chapter5.media.answers||[]).length<3)return;
    changed.chapter5.media.completed=true; changed.chapter5.media.reputation=deriveMediaReputation(changed); const next=nextStoryPointer(changed); await saveStoryProgress(next.story,{transition:next.changedScene}); syncMusic({restart:true});
  }

  function renderSeatFreeTime(scene, beat, sceneIndex) {
    const c5=chapter5State(), ft=c5.freeTime||{}, picked=Array.isArray(ft.activities)?ft.activities:[], incident=SEAT_HQ_EVENTS.find(e=>e.id===(ft.eventId||seatIncidentId()))||SEAT_HQ_EVENTS[0];
    const ready=picked.length>=3, eventDone=!!ft.eventChoice;
    const body=`<section class="seat-free-time" aria-live="polite"><header><div><small>QUICKQUILL HQ · OPEN SCHEDULE</small><h1>${ready?'ONE LAST INTERRUPTION':'THREE HOURS'}</h1></div><span>${Math.max(0,3-picked.length)} HOURS LEFT</span></header>
      ${!ready?`<div class="seat-activity-grid">${Object.entries(SEAT_FREE_TIME).map(([id,item])=>`<button type="button" data-seat-activity="${id}" class="${picked.includes(id)?'is-done':''}" ${picked.includes(id)?'disabled':''}><small>${escapeHtml(item.kicker)}</small><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.note)}</p><span>${picked.includes(id)?'COMPLETED':'SPEND 1 HOUR'} <i>›</i></span></button>`).join('')}</div><aside class="seat-time-ledger"><small>TODAY</small>${picked.map((id,index)=>`<span><b>0${index+1}</b>${escapeHtml(SEAT_FREE_TIME[id]?.title||id)}</span>`).join('')}${Array.from({length:3-picked.length},(_,i)=>`<span class="is-empty"><b>0${picked.length+i+1}</b>UNALLOCATED</span>`).join('')}</aside>`:
      `<section class="seat-hq-event"><small>UNPLANNED HQ EVENT · ${escapeHtml(incident.title)}</small><h2>${escapeHtml(incident.text)}</h2>${eventDone?`<div class="seat-event-result"><strong>RECORDED</strong><p>${escapeHtml(ft.eventChoice)}</p><button type="button" data-seat-free-finish>RETURN TO STRATEGY ROOM</button></div>`:`<div>${incident.options.map((option,i)=>`<button type="button" data-seat-event-choice="${i}"><b>${String.fromCharCode(65+i)}</b><span><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.note)}</small></span></button>`).join('')}</div>`}</section>`}
      ${state.seatTransient?`<div class="seat-activity-toast">${escapeHtml(state.seatTransient)}</div>`:''}</section>`;
    root.innerHTML=seatStageShell(scene,sceneIndex,body,'is-seat-free-time');bindChapterFiveBackgroundFallback(scene);bindSeatBack();
    root.querySelectorAll('[data-seat-activity]').forEach(button=>button.addEventListener('click',()=>void chooseSeatActivity(String(button.dataset.seatActivity||''))));
    root.querySelectorAll('[data-seat-event-choice]').forEach(button=>button.addEventListener('click',()=>void chooseSeatEvent(Number(button.dataset.seatEventChoice))));
    root.querySelector('[data-seat-free-finish]')?.addEventListener('click',()=>void finishSeatFreeTime());
  }

  async function chooseSeatActivity(id) {
    const item=SEAT_FREE_TIME[id];if(!item||state.storySaving||state.transitionLocked)return;const changed=cloneValue(state.story),ft=changed.chapter5.freeTime;ft.activities=Array.isArray(ft.activities)?ft.activities:[];if(ft.activities.includes(id)||ft.activities.length>=3)return;
    ft.activities=[...ft.activities,id];applyStoryEffects(changed,item.effects||{});changed.history=[...(changed.history||[]),{scene:'q37',event:'free-time',activity:id}].slice(-100);state.seatTransient=item.result;state.story=changed;render();setTimeout(()=>{state.seatTransient='';if(state.mode==='story')render();},2200);
    try{await persistStory(changed,{stageOverride:'quickquill-seat-story'});}catch(error){state.storyError=error?.message||'Free-time choice could not be saved.';render();}
  }

  async function chooseSeatEvent(optionIndex) {
    if(state.storySaving||state.transitionLocked)return;const changed=cloneValue(state.story),ft=changed.chapter5.freeTime;if((ft.activities||[]).length<3||ft.eventChoice)return;const incident=SEAT_HQ_EVENTS.find(e=>e.id===seatIncidentId(changed))||SEAT_HQ_EVENTS[0],option=incident.options?.[optionIndex];if(!option)return;
    ft.eventId=incident.id;ft.eventChoice=option.label;applyStoryEffects(changed,option.effects||{});changed.history=[...(changed.history||[]),{scene:'q37',event:'hq-incident',incident:incident.id,choice:optionIndex}].slice(-100);state.story=changed;render();try{await persistStory(changed,{stageOverride:'quickquill-seat-story'});}catch(error){state.storyError=error?.message||'HQ event could not be saved.';render();}
  }

  async function finishSeatFreeTime() {
    if(state.storySaving||state.transitionLocked)return;const changed=cloneValue(state.story);if((changed.chapter5.freeTime.activities||[]).length<3||!changed.chapter5.freeTime.eventChoice)return;changed.chapter5.freeTime.completed=true;const next=nextStoryPointer(changed);await saveStoryProgress(next.story,{transition:next.changedScene});syncMusic({restart:true});
  }

  function renderSeatComplete() {
    const story=state.story||normaliseQuickquillStory(activeSaveState().story),c5=chapter5State(story),headlines=c5.media?.headlines||[];
    root.innerHTML=`<section class="seat-complete-shell"><img src="story/chapter5/lumerre-arrival.webp" alt="" aria-hidden="true"><div class="seat-complete-shade"></div><header><small>QUICKQUILL CAREER · CHAPTER FIVE</small><h1>A SEAT AT THE TABLE</h1><p>The rookie review became a professional brief. Lumerre is now on the calendar.</p></header><div class="seat-complete-grid"><article><small>SIMULATOR PROFILE</small><strong>${escapeHtml(c5.simulator?.profile||deriveSeatSimulatorProfile(story))}</strong><span>${escapeHtml(String(c5.developmentPriority||'control').toUpperCase())} DEVELOPMENT</span></article><article><small>MEDIA REPUTATION</small><strong>${escapeHtml(c5.media?.reputation||deriveMediaReputation(story))}</strong><span>${escapeHtml(headlines[0]||'Three answers archived')}</span></article><article><small>LUMERRE ROLE</small><strong>${escapeHtml(c5.lumerreRole||deriveLumerreRole(story))}</strong><span>${escapeHtml(c5.finalPromise?String(c5.finalPromise).replaceAll('-',' ').toUpperCase():'ROLE CONFIRMED')}</span></article></div><button type="button" data-seat-complete-back>RETURN TO STORY JOURNEY</button></section>`;
    root.querySelector('[data-seat-complete-back]')?.addEventListener('click',()=>{state.mode='story-journey';render();syncMusic({restart:true});});
  }



  function clamp01(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function lumerreSetupScore(setup = {}) {
    const targets = { frontResponse:58, stability:60, endurance:55, qualifyingTrim:58 };
    const errors = Object.keys(targets).map(key => Math.abs((Number(setup[key]) || 50) - targets[key]));
    return Math.max(0, 100 - errors.reduce((sum,value)=>sum+value,0) * .9);
  }

  function lumerrePracticeIssue(story = state.story) {
    const pq = practiceQualifyingState(story);
    const setup = pq.practice?.setup || {};
    const risks = [
      {id:'front',score:(Number(setup.frontResponse)||50)-61,title:'FRONT RESPONSE',clue:'Turn-in is sharp, then the dragon has to correct halfway through the upper-terrace entry.'},
      {id:'stability',score:50-(Number(setup.stability)||50),title:'STABILITY',clue:'The first input is clean, but the body settles late when the terrace cambers away.'},
      {id:'trim',score:(Number(setup.qualifyingTrim)||50)-64,title:'QUALIFYING TRIM',clue:'The lap is quick early, but the platform becomes nervous as speed builds through the long section.'},
      {id:'endurance',score:45-(Number(setup.endurance)||50),title:'ENDURANCE BIAS',clue:'Response fades rather than snaps; the problem grows after repeated direction changes.'}
    ].sort((a,b)=>b.score-a.score);
    return risks[0].score > 0 ? risks[0] : {id:'stability',score:2,title:'STABILITY',clue:'The line is fast enough. The problem appears only when the upper terrace loads the outside side of the dragon.'};
  }

  function lumerrePracticeFocusLabel(value) {
    return ({technical:'TECHNICAL RESPONSE','high-speed':'HIGH-SPEED STABILITY','long-run':'LONG-RUN RHYTHM',overtaking:'LAUNCH / TRAFFIC',launch:'LAUNCH','endurance':'ENDURANCE'})[String(value||'')] || 'TECHNICAL RESPONSE';
  }

  function lumerrePracticeRunResult(story, runNumber) {
    const pq = practiceQualifyingState(story);
    return Number(runNumber) === 2 ? pq.practice?.run2 : pq.practice?.run1;
  }

  function lumerrePlayerPracticeLap(story, runNumber, focus) {
    const evo = syncCareerEvolution(story);
    const setup = practiceQualifyingState(story).practice?.setup || {};
    const skill = (Number(evo.racecraft?.pace)||45)*.36 + (Number(evo.racecraft?.technicalUnderstanding)||45)*.32 + (Number(evo.racecraft?.consistency)||45)*.19 + (Number(evo.racecraft?.pressureHandling)||45)*.13;
    const setupScore = lumerreSetupScore(setup);
    const focusBonus = focus === 'technical' ? (Number(evo.racecraft?.technicalUnderstanding)||45)-45
      : focus === 'high-speed' ? (Number(evo.racecraft?.pressureHandling)||45)-45
      : focus === 'long-run' ? (Number(evo.racecraft?.staminaManagement)||45)-45
      : (Number(evo.racecraft?.overtaking)||40)-40;
    const diagnosisBonus = Number(runNumber) === 2 && practiceQualifyingState(story).practice?.diagnosis?.correct ? 115 : 0;
    const runGain = Number(runNumber) === 2 ? 360 : 0;
    const noise = (Math.random() - .5) * (Number(runNumber) === 2 ? 210 : 330);
    return Math.round(102760 - (skill-45)*13 - (setupScore-55)*4.2 - focusBonus*4 - diagnosisBonus - runGain + noise);
  }

  function lumerrePracticeSectors(lapMs, runNumber = 1) {
    const wobble = () => Math.round((Math.random()-.5)*90);
    const s1 = Math.round(lapMs*.307) + wobble();
    const s2 = Math.round(lapMs*.411) + wobble() + (Number(runNumber)===1?55:-35);
    const s3 = Math.max(1, lapMs-s1-s2);
    return [s1,s2,s3];
  }

  function lumerrePracticeAIRows(runNumber = 1) {
    const improve = Number(runNumber) === 2 ? 130 : 0;
    return [
      {id:'ren',name:'Ren Sato',lapMs:102314-improve},
      {id:'tyrese',name:'Tyrese Bell',lapMs:102398-improve},
      {id:'sofia',name:'Sofia Mendes',lapMs:102507-improve},
      {id:'jalen',name:'Jalen Cross',lapMs:102555-improve},
      {id:'luka',name:'Luka Kovač',lapMs:102630-improve},
      {id:'maya',name:'Maya Banks',lapMs:102718-improve}
    ];
  }

  function lumerrePracticeClassification(story, runNumber = 1, playerLap = null) {
    const pq = practiceQualifyingState(story);
    const best = Math.min(
      Number(playerLap)||999999,
      Number(pq.practice?.run1?.lapMs)||999999,
      Number(pq.practice?.run2?.lapMs)||999999
    );
    const rows = lumerrePracticeAIRows(runNumber).map(row=>({...row}));
    if (best < 999999) rows.push({id:'player',name:storyDragonName(),lapMs:best,player:true});
    rows.sort((a,b)=>a.lapMs-b.lapMs);
    return rows.map((row,index)=>({...row,position:index+1,gapMs:row.lapMs-rows[0].lapMs}));
  }

  async function resolveLumerrePracticeRun(runNumber) {
    if (state.storySaving || state.transitionLocked) return;
    const changed = cloneValue(state.story);
    const pq = changed.chapter6.practiceQualifying;
    const practice = pq.practice;
    const key = Number(runNumber) === 2 ? 'run2' : 'run1';
    if (practice[key]) return;
    const focus = Number(runNumber) === 1 ? (pq.priority || changed.choices?.lumerrePracticePriority?.value || 'technical') : (practice.diagnosis?.correct ? 'high-speed' : 'technical');
    playCrownSfx('beep', .075);
    const lapMs = lumerrePlayerPracticeLap(changed, runNumber, focus);
    const sectors = lumerrePracticeSectors(lapMs, runNumber);
    const classification = lumerrePracticeClassification(changed, runNumber, lapMs);
    const player = classification.find(row=>row.id==='player');
    practice[key] = {focus,lapMs,sectors,position:player?.position||7,completedAt:new Date().toISOString()};
    practice.classification = classification;
    if (Number(runNumber) === 2) {
      practice.completed = true;
      applyCareerEvolutionEffects(changed,{racecraft:{technicalUnderstanding:1,consistency:1,pressureHandling:1},reputation:{paddockRespect:1}});
    }
    changed.history=[...(changed.history||[]),{scene:state.story?.scene,event:'lumerre-practice-run',run:Number(runNumber),focus,lapMs,position:player?.position||7}].slice(-100);
    state.story=changed;
    playCrownSfx(player?.position<=3?'personalBest':'split', .18);
    render();
    try { await persistStory(changed,{stageOverride:'quickquill-lumerre-practice-qualifying'}); }
    catch(error){ state.storyError=error?.message||'Practice telemetry could not be saved.'; render(); }
  }

  function lumerrePracticeStageShell(scene, sceneIndex, body, extraClass='') {
    const count=QUICKQUILL_LUMERRE_PRACTICE_SCENES.length;
    return `<section class="story-shell tone-${escapeHtml(scene.tone||'lumerre-technical')} lumerre-practice-story-shell" aria-label="${escapeHtml(scene.number)} ${escapeHtml(scene.title)}">
      <img class="story-backdrop" src="${scene.background}" alt="" aria-hidden="true">
      <div class="story-stage lumerre-practice-stage ${extraClass}">
        <img class="story-environment" src="${scene.background}" alt="${escapeHtml(scene.title)}">
        <div class="lumerre-practice-wash" aria-hidden="true"></div><div class="story-grain" aria-hidden="true"></div><div class="story-letterbox" aria-hidden="true"></div>
        <header class="story-header"><div><small>QUICKQUILL: AGAINST THE ODDS</small><strong>${escapeHtml(scene.number)} · ${escapeHtml(scene.title)}</strong><span>${escapeHtml(scene.location)}</span></div><button type="button" data-story-home>BACK TO HUB</button></header>
        <div class="story-scene-counter lumerre-practice-progress"><i style="--story-progress:${((sceneIndex+1)/count)*100}%"></i><span>PRACTICE & QUALIFYING ${sceneIndex+1} / ${count}</span></div>
        ${body}
      </div><div class="story-screen-vignette" aria-hidden="true"></div>
    </section><div class="blackout ${state.blackout?'is-visible':''}" aria-hidden="true"></div>`;
  }

  function bindLumerrePracticeBack(scene) {
    bindLumerrePracticeBackgroundFallback(scene);
    root.querySelector('[data-story-home]')?.addEventListener('click',event=>{event.stopPropagation();returnToHubFromStory();});
  }

  function telemetryClassificationMarkup(rows = []) {
    if (!rows.length) return '<div class="lumerre-empty-telemetry">NO TIMED LAPS YET</div>';
    const leader=rows[0]?.lapMs||0;
    return `<div class="lumerre-classification">${rows.map(row=>`<div class="${row.player?'is-player':''}"><b>P${row.position}</b><span>${escapeHtml(row.name)}</span><strong>${row.position===1?formatStoryLap(row.lapMs):`+${((row.lapMs-leader)/1000).toFixed(3)}`}</strong></div>`).join('')}</div>`;
  }

  function renderLumerrePracticeRun(scene, beat, sceneIndex) {
    const runNumber=Number(beat.run)||1;
    const pq=practiceQualifyingState();
    const result=lumerrePracticeRunResult(state.story,runNumber);
    const rows=result ? (pq.practice?.classification||[]) : lumerrePracticeClassification(state.story,runNumber);
    const focus=runNumber===1?(pq.priority||state.story?.choices?.lumerrePracticePriority?.value||'technical'):(pq.practice?.diagnosis?.correct?'high-speed':'technical');
    const sectors=result?.sectors||[];
    const body=`<section class="lumerre-practice-console">
      <header class="lumerre-tech-hero"><div><small>QUICKQUILL TECHNICAL · RUN ${String(runNumber).padStart(2,'0')}</small><h1>${runNumber===1?'BUILD A BASELINE':'FINAL PRACTICE'}</h1><p>${runNumber===1?'One clean reference. No heroics. Give Nell a lap she can compare against Tyrese.':'Apply what you learned. This is the last practice data Quickquill gets before qualifying.'}</p></div><div><small>RUN OBJECTIVE</small><strong>${escapeHtml(lumerrePracticeFocusLabel(focus))}</strong></div></header>
      <div class="lumerre-tech-grid">
        <section class="lumerre-track-map-card"><img src="${LUMERRE_TECH_MAP}" alt="Lumerre Crown technical circuit map"><span>${result?'RUN COMPLETE':'READY FOR RELEASE'}</span></section>
        <section class="lumerre-practice-data"><header><small>PRACTICE CLASSIFICATION</small><strong>${result?`P${result.position}`:'LIVE'}</strong></header>${telemetryClassificationMarkup(rows)}</section>
        <section class="lumerre-sector-card"><header><small>SECTOR COMPARISON</small><strong>${result?formatStoryLap(result.lapMs):'—'}</strong></header>${result?sectors.map((value,index)=>`<div><span>S${index+1}</span><b>${formatStoryLap(value).replace(/^0:/,'')}</b><i class="${index===1&&runNumber===1?'is-warning':'is-good'}"></i></div>`).join(''):`<p>Sector timing appears after the run.</p>`}</section>
      </div>
      <footer class="lumerre-tech-actions">${result?`<div><small>NELL'S NOTE</small><strong>${runNumber===1?'UPPER TERRACE · ENTRY INSTABILITY DETECTED':'BALANCE IMPROVED · QUALIFYING BASE READY'}</strong></div><button type="button" data-lumerre-practice-continue>${runNumber===1?'OPEN ENGINEERING BOARD':'BEGIN QUALIFYING'} <i>›</i></button>`:`<div><small>FOCUS</small><strong>${escapeHtml(lumerrePracticeFocusLabel(focus))}</strong></div><button type="button" data-lumerre-practice-run="${runNumber}">SEND ${escapeHtml(storyDragonName().toUpperCase())} OUT <i>›</i></button>`}</footer>
      ${state.storyError?`<div class="story-error" role="alert">${escapeHtml(state.storyError)}</div>`:''}
    </section>`;
    root.innerHTML=lumerrePracticeStageShell(scene,sceneIndex,body,'is-telemetry');bindLumerrePracticeBack(scene);
    root.querySelector('[data-lumerre-practice-run]')?.addEventListener('click',()=>void resolveLumerrePracticeRun(runNumber));
    root.querySelector('[data-lumerre-practice-continue]')?.addEventListener('click',()=>void completeLumerreInteractiveBeat());
  }

  function lumerreSetupAssessment(setup = {}) {
    const score=lumerreSetupScore(setup);
    const issue=lumerrePracticeIssue({...(state.story||{}),chapter6:{...(state.story?.chapter6||{}),practiceQualifying:{...practiceQualifyingState(),practice:{...practiceQualifyingState().practice,setup}}}});
    return {score,confidence:Math.round(Math.max(25,Math.min(96,score))),label:score>=82?'HIGH':score>=67?'MEDIUM':'LOW',issue};
  }

  function renderLumerreSetupBoard(scene, beat, sceneIndex) {
    const pq=practiceQualifyingState(), setup={...pq.practice.setup}, assessment=lumerreSetupAssessment(setup);
    const sliders=[['frontResponse','FRONT RESPONSE','STABLE','SHARP'],['stability','STABILITY','AGILE','PLANTED'],['endurance','ENDURANCE BIAS','SPRINT','LONG RUN'],['qualifyingTrim','QUALIFYING TRIM','RACE','QUALIFYING']];
    const body=`<section class="lumerre-setup-console"><header><div><small>QUICKQUILL SETUP ENGINEERING</small><h1>BETWEEN RUNS</h1><p>Every improvement costs something somewhere else. Build a setup you can explain, not just one that looks fast on a slider.</p></div><button type="button" data-lumerre-compare>COMPARE WITH TYRESE</button></header>
      <div class="lumerre-setup-layout"><section class="lumerre-setup-sliders">${sliders.map(([key,label,left,right])=>`<article><header><strong>${label}</strong><span><b>${left}</b><b>${right}</b></span></header><input type="range" min="20" max="85" step="1" value="${Number(setup[key])||50}" data-lumerre-setup="${key}" aria-label="${label}"><div><i style="--setup-p:${Number(setup[key])||50}%"></i></div></article>`).join('')}</section>
      <aside class="lumerre-setup-summary"><section><small>CURRENT SETUP</small><strong>${assessment.score>=78?'TECHNICAL / BALANCED':assessment.score>=62?'AGGRESSIVE / DEVELOPING':'UNSETTLED'}</strong><span>SETUP CONFIDENCE · ${assessment.confidence}%</span></section><section class="is-warning"><small>NELL'S ASSESSMENT</small><strong>${assessment.score>=78?'GOOD BASELINE':'WORK TO DO'}</strong><span>${escapeHtml(assessment.issue.title)} · ${escapeHtml(assessment.issue.clue)}</span></section><section data-lumerre-tyrese-compare hidden><small>TYRESE REFERENCE</small><strong>STABILITY +4 · RESPONSE -2</strong><span>Tyrese is carrying a calmer high-speed platform and giving away a little initial rotation.</span></section></aside></div>
      <footer><button type="button" data-lumerre-setup-revert>REVERT TO BASELINE</button><button type="button" data-lumerre-setup-apply>APPLY SETUP <i>✓</i></button></footer></section>`;
    root.innerHTML=lumerrePracticeStageShell(scene,sceneIndex,body,'is-setup');bindLumerrePracticeBack(scene);
    root.querySelector('[data-lumerre-compare]')?.addEventListener('click',()=>{const el=root.querySelector('[data-lumerre-tyrese-compare]');if(el){el.hidden=!el.hidden;playTone(285);}});
    root.querySelectorAll('[data-lumerre-setup]').forEach(input=>input.addEventListener('input',()=>{const fill=input.parentElement?.querySelector('div>i');if(fill)fill.style.setProperty('--setup-p',`${Number(input.value)||50}%`);}));
    root.querySelector('[data-lumerre-setup-revert]')?.addEventListener('click',()=>{root.querySelectorAll('[data-lumerre-setup]').forEach(input=>{const defaults={frontResponse:54,stability:56,endurance:52,qualifyingTrim:48};input.value=defaults[input.dataset.lumerreSetup]||50;const fill=input.parentElement?.querySelector('div>i');if(fill)fill.style.setProperty('--setup-p',`${Number(input.value)||50}%`);});playTone(190);});
    root.querySelector('[data-lumerre-setup-apply]')?.addEventListener('click',()=>void applyLumerreSetup());
  }

  async function applyLumerreSetup() {
    if(state.storySaving||state.transitionLocked)return;
    const changed=cloneValue(state.story), setup=changed.chapter6.practiceQualifying.practice.setup;
    root.querySelectorAll('[data-lumerre-setup]').forEach(input=>{const key=String(input.dataset.lumerreSetup||'');if(key in setup)setup[key]=clamp01(input.value,20,85);});
    const assessment=lumerreSetupAssessment(setup);setup.confidence=assessment.confidence;
    changed.chapter6.practiceQualifying.practice.setupApplied=true;
    changed.history=[...(changed.history||[]),{scene:'q48',event:'lumerre-setup-applied',setup:{...setup},confidence:assessment.confidence}].slice(-100);
    state.story=changed;playTone(420);
    try{await persistStory(changed,{stageOverride:'quickquill-lumerre-practice-qualifying'});const next=nextStoryPointer(state.story);await saveStoryProgress(next.story,{transition:true});}
    catch(error){state.storyError=error?.message||'Setup could not be saved.';render();}
  }

  function renderLumerreDiagnosis(scene, beat, sceneIndex) {
    const pq=practiceQualifyingState(), diagnosis=pq.practice.diagnosis||{}, issue=lumerrePracticeIssue();
    const options=[
      {id:'front',label:'Front response is too sharp.',note:'The first steering input is creating a second correction.'},
      {id:'stability',label:'The high-speed platform is too light.',note:'The dragon settles too late when the upper terrace cambers away.'},
      {id:'trim',label:'Qualifying trim is destabilising the long section.',note:'Single-lap attack is arriving before the chassis/body balance can support it.'},
      {id:'endurance',label:'The endurance bias is delaying response.',note:'The setup is conserving too much and making the transitions lazy.'}
    ];
    const body=`<section class="lumerre-diagnosis-console"><header><small>Q49 · TELEMETRY DIAGNOSIS</small><h1>THE UPPER TERRACE</h1><p>Nell has one ugly trace and four plausible explanations. Read the symptoms before changing the dragon underneath them.</p></header><div class="lumerre-diagnosis-grid"><section class="lumerre-track-map-card"><img src="${LUMERRE_TECH_MAP}" alt="Lumerre Crown circuit technical map"><span>05 · UPPER TERRACE</span></section><section class="lumerre-trace"><small>TELEMETRY NOTE</small><strong>ENTRY INSTABILITY</strong><p>${escapeHtml(issue.clue)}</p><div><span>TURN-IN</span><i style="--trace:72%"></i></div><div><span>SETTLE</span><i class="is-warning" style="--trace:41%"></i></div><div><span>EXIT</span><i style="--trace:66%"></i></div></section></div>
      ${diagnosis.completed?`<section class="lumerre-diagnosis-result ${diagnosis.correct?'is-correct':'is-partial'}"><small>NELL'S VERDICT</small><h2>${diagnosis.correct?'THAT IS THE ROOT CAUSE':'NOT QUITE — BUT THE CORRECTION HELPS'}</h2><p>${diagnosis.correct?'You identified the problem from the trace. Nell makes the precise correction instead of softening the entire setup.':'Nell corrects the actual issue without pretending the wrong diagnosis never happened. You lose a little setup confidence, not the weekend.'}</p><button type="button" data-lumerre-practice-continue>FINAL PRACTICE <i>›</i></button></section>`:`<div class="lumerre-diagnosis-options">${options.map((option,index)=>`<button type="button" data-lumerre-diagnosis="${option.id}"><b>${String.fromCharCode(65+index)}</b><span><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.note)}</small></span></button>`).join('')}</div>`}</section>`;
    root.innerHTML=lumerrePracticeStageShell(scene,sceneIndex,body,'is-diagnosis');bindLumerrePracticeBack(scene);
    root.querySelectorAll('[data-lumerre-diagnosis]').forEach(button=>button.addEventListener('click',()=>void resolveLumerreDiagnosis(String(button.dataset.lumerreDiagnosis||''))));
    root.querySelector('[data-lumerre-practice-continue]')?.addEventListener('click',()=>void completeLumerreInteractiveBeat());
  }

  async function resolveLumerreDiagnosis(choice) {
    if(state.storySaving||state.transitionLocked)return;
    const changed=cloneValue(state.story), practice=changed.chapter6.practiceQualifying.practice, issue=lumerrePracticeIssue(changed), correct=choice===issue.id;
    practice.diagnosis={issue:issue.id,choice,correct,completed:true};
    const setup=practice.setup;
    if(issue.id==='front')setup.frontResponse=Math.max(48,(Number(setup.frontResponse)||54)-(correct?8:4));
    if(issue.id==='stability')setup.stability=Math.min(72,(Number(setup.stability)||56)+(correct?9:4));
    if(issue.id==='trim')setup.qualifyingTrim=Math.max(45,(Number(setup.qualifyingTrim)||50)-(correct?7:3));
    if(issue.id==='endurance')setup.endurance=Math.min(66,(Number(setup.endurance)||52)+(correct?7:3));
    setup.confidence=clamp01((Number(setup.confidence)||58)+(correct?15:6));
    applyCareerEvolutionEffects(changed,{racecraft:{technicalUnderstanding:correct?2:1,consistency:1},reputation:{quickquillTrust:correct?2:1}});
    changed.history=[...(changed.history||[]),{scene:'q49',event:'lumerre-diagnosis',issue:issue.id,choice,correct}].slice(-100);
    state.story=changed;playCrownSfx(correct?'personalBest':'split',.18);render();
    try{await persistStory(changed,{stageOverride:'quickquill-lumerre-practice-qualifying'});}catch(error){state.storyError=error?.message||'Diagnosis could not be saved.';render();}
  }

  async function completeLumerreInteractiveBeat() {
    if(state.storySaving||state.transitionLocked)return;
    const next=nextStoryPointer(state.story);
    await saveStoryProgress(next.story,{transition:true});
  }

  function lumerreQualifyingWindowDef(value) {
    return ({
      early:{label:'GO EARLY',note:'Clearer track, less evolution.',paceMs:70,variance:110,pressure:0},
      evolution:{label:'WAIT FOR EVOLUTION',note:'Faster surface, greater traffic risk.',paceMs:-125,variance:220,pressure:1},
      tow:{label:'HUNT A TOW',note:'Best straight-line upside, least control.',paceMs:-105,variance:260,pressure:2},
      clear:{label:'PRIORITISE CLEAR TRACK',note:'Small pace gain, cleanest execution.',paceMs:-55,variance:90,pressure:-1}
    })[String(value||'')] || {label:'CLEAR TRACK',note:'Balanced release.',paceMs:0,variance:140,pressure:0};
  }

  function lumerreQualifyingAIBest(runNumber=3) {
    const step=Number(runNumber)===1?330:Number(runNumber)===2?145:0;
    return [
      {id:'ren',name:'Ren Sato',lapMs:101913+step},
      {id:'tyrese',name:'Tyrese Bell',lapMs:101984+step},
      {id:'jalen',name:'Jalen Cross',lapMs:102070+step},
      {id:'sofia',name:'Sofia Mendes',lapMs:102111+step},
      {id:'luka',name:'Luka Kovač',lapMs:102166+step},
      {id:'maya',name:'Maya Banks',lapMs:102310+step}
    ];
  }

  function lumerreQualifyingRunResult(story, runNumber) {
    const q=practiceQualifyingState(story).qualifying||{};
    return q[`run${Number(runNumber)||1}`]||null;
  }

  function lumerrePlayerQualifyingLap(story, runNumber) {
    const pq=practiceQualifyingState(story), q=pq.qualifying, setup=pq.practice?.setup||{}, evo=syncCareerEvolution(story), profile=careerQualifyingProfile(story);
    const run=Number(runNumber)||1;
    const baseByRun={1:102470,2:102135,3:101995};
    const skillGain=(Number(profile.competitiveness)||50)-50;
    const trim=Number(setup.qualifyingTrim)||50, stability=Number(setup.stability)||55, response=Number(setup.frontResponse)||55;
    const setupBonus=(trim-48)*4.6 + Math.max(-15,18-Math.abs(stability-60))*4 + Math.max(-12,14-Math.abs(response-58))*3;
    const diagnosis=pq.practice?.diagnosis?.correct?70:0;
    const window=run>=2?lumerreQualifyingWindowDef(q.window):{paceMs:105,variance:125,pressure:0};
    const pressureSkill=((Number(evo.racecraft?.pressureHandling)||45)-45)*4;
    const finalPressure=run===3 ? Math.max(-80,90-pressureSkill) : 0;
    const noise=(Math.random()-.5)*(window.variance||140);
    return Math.round(baseByRun[run] - skillGain*13 - setupBonus - diagnosis + window.paceMs + finalPressure + noise);
  }

  function lumerreQualifyingSectors(lapMs, runNumber=1) {
    const variation=()=>Math.round((Math.random()-.5)*55);
    const s1=Math.round(lapMs*.306)+variation();
    const s2=Math.round(lapMs*.413)+variation()-(Number(runNumber)===3?45:0);
    const s3=Math.max(1,lapMs-s1-s2);
    return [s1,s2,s3];
  }

  function lumerreQualifyingSectorDeltas(sectors = [], runNumber = 1) {
    const leaderLap = lumerreQualifyingAIBest(runNumber)[0]?.lapMs || 102000;
    const reference = [Math.round(leaderLap*.306), Math.round(leaderLap*.413)];
    reference.push(Math.max(1, leaderLap-reference[0]-reference[1]));
    return [0,1,2].map(index => ((Number(sectors[index])||reference[index]) - reference[index]) / 1000);
  }

  function lumerreQualifyingBestPlayerLap(story=state.story) {
    const q=practiceQualifyingState(story).qualifying||{};
    const values=[q.run1?.lapMs,q.run2?.lapMs,q.run3?.lapMs].map(Number).filter(value=>value>0);
    return values.length?Math.min(...values):0;
  }

  function lumerreQualifyingGrid(story=state.story,runNumber=3,playerLapOverride=null) {
    const q=practiceQualifyingState(story).qualifying||{};
    const playerBest=Math.min(...[Number(playerLapOverride)||999999,Number(q.run1?.lapMs)||999999,Number(q.run2?.lapMs)||999999,Number(q.run3?.lapMs)||999999]);
    const rows=lumerreQualifyingAIBest(runNumber).map(row=>({...row}));
    if(playerBest<999999)rows.push({id:'player',name:storyDragonName(),lapMs:playerBest,player:true});
    rows.sort((a,b)=>a.lapMs-b.lapMs);
    return rows.map((row,index)=>({...row,position:index+1,gapMs:row.lapMs-rows[0].lapMs,status:Number(runNumber)===3?'FINAL RUN':'ON LAP'}));
  }

  function qualifyingHeadlineFor(position) {
    const p=Number(position)||7;
    if(p===1)return 'For the first time, the Quickquill rookie is the reference everybody else has to chase.';
    if(p===2)return 'Front row. The rookie experiment has become a race-winning possibility.';
    if(p===3)return 'Second row pace has become podium expectation.';
    if(p===4)return 'Close enough to the front that strategy can change the entire race.';
    return 'Not the headline lap you wanted. Still close enough to race forward tomorrow.';
  }

  function recordLumerreQualifyingOutcome(story) {
    const pq=practiceQualifyingState(story), q=pq.qualifying;
    if(q.completed)return;
    const grid=lumerreQualifyingGrid(story,3,q.run3?.lapMs||null),player=grid.find(row=>row.id==='player'),tyrese=grid.find(row=>row.id==='tyrese');
    q.grid=grid;q.position=player?.position||7;q.bestLapMs=player?.lapMs||0;q.tyresePosition=tyrese?.position||0;q.tyreseLapMs=tyrese?.lapMs||0;q.headline=qualifyingHeadlineFor(q.position);q.completed=true;q.completedAt=new Date().toISOString();
    const evo=syncCareerEvolution(story),records=evo.records||{};
    records.bestQualifying=records.bestQualifying?Math.min(Number(records.bestQualifying)||99,q.position):q.position;
    if(q.position===1&&!evo.firsts.firstPole){evo.firsts.firstPole={event:'Lumerre Crown',raceNumber:(Number(records.starts)||0)+1,completedAt:q.completedAt};careerEvolutionMilestone(evo,'FIRST CAREER POLE');}
    if(tyrese){if(q.position<tyrese.position){evo.tyrese.playerOutqualifies+=1;evo.tyrese.competitiveTension=clampCareerValue(evo.tyrese.competitiveTension+3);evo.tyrese.professionalRespect=clampCareerValue(evo.tyrese.professionalRespect+2);}else if(q.position>tyrese.position){evo.tyrese.tyreseOutqualifies+=1;evo.tyrese.competitiveTension=clampCareerValue(evo.tyrese.competitiveTension+1);}}
    Object.values(evo.rivalries||{}).forEach(entry=>{if(entry&&typeof entry==='object')entry.qualifyingBattles=Math.max(0,Number(entry.qualifyingBattles)||0);});
    grid.filter(row=>row.id!=='player'&&Math.abs(row.position-q.position)===1).forEach(row=>{const rival=evo.rivalries?.[row.id];if(rival){rival.qualifyingBattles+=1;rival.intensity=clampCareerValue(rival.intensity+2);rival.respect=clampCareerValue(rival.respect+1);}});
    evo.reputation.fame=clampCareerValue(evo.reputation.fame+(q.position===1?5:q.position<=2?3:q.position<=4?2:1));
    evo.reputation.media=clampCareerValue(evo.reputation.media+(q.position===1?4:q.position<=3?2:1));
    evo.reputation.pressure=clampCareerValue(evo.reputation.pressure+(q.position===1?6:q.position<=3?3:1));
    evo.racecraft.pressureHandling=clampCareerValue(evo.racecraft.pressureHandling+(q.position<=3?2:1));
    evo.racecraft.technicalUnderstanding=clampCareerValue(evo.racecraft.technicalUnderstanding+1);
    evo.careerPhase=deriveCareerPhase(evo);evo.fameTier=deriveFameTier(evo);evo.playerStyle=deriveCareerRacingStyle(story,evo);story.careerEvolution=evo;
  }

  async function resolveLumerreQualifyingRun(runNumber) {
    if(state.storySaving||state.transitionLocked||state.lumerreQualifyingLive)return;
    const run=Number(runNumber)||1,key=`run${run}`;
    const current=practiceQualifyingState().qualifying||{};
    if(current[key])return;
    clearLumerreQualifyingTimers();
    const preview=cloneValue(state.story),q=preview.chapter6.practiceQualifying.qualifying;
    const lapMs=lumerrePlayerQualifyingLap(preview,run),sectors=lumerreQualifyingSectors(lapMs,run),deltas=lumerreQualifyingSectorDeltas(sectors,run),grid=lumerreQualifyingGrid(preview,run,lapMs),player=grid.find(row=>row.id==='player');
    state.lumerreQualifyingLive={run,phase:0,lapMs,sectors,deltas,grid,position:player?.position||7,startedAt:Date.now()};
    playCrownSfx('beep',.055);
    render();
    const reveal=(phase,delayMs)=>lumerreQualifyingTimers.push(window.setTimeout(()=>{
      const live=state.lumerreQualifyingLive;
      if(!live||live.run!==run||state.mode!=='story')return;
      live.phase=phase;
      if(phase<=2)playCrownSfx('split',.13);
      render();
    },delayMs));
    reveal(1,650);reveal(2,1450);reveal(3,2250);
    lumerreQualifyingTimers.push(window.setTimeout(async()=>{
      const live=state.lumerreQualifyingLive;
      if(!live||live.run!==run||state.mode!=='story')return;
      const changed=cloneValue(state.story),changedQ=changed.chapter6.practiceQualifying.qualifying;
      if(changedQ[key]){clearLumerreQualifyingTimers();render();return;}
      changedQ[key]={lapMs:live.lapMs,sectors:[...live.sectors],deltas:[...live.deltas],position:live.position,completedAt:new Date().toISOString()};
      if(run===3)recordLumerreQualifyingOutcome(changed);
      changed.history=[...(changed.history||[]),{scene:state.story?.scene,event:'lumerre-qualifying-run',run,lapMs:live.lapMs,position:live.position,window:changedQ.window||''}].slice(-100);
      state.story=changed;
      clearLumerreQualifyingTimers();
      playCrownSfx(live.position===1?'newLeader':live.position<=3?'personalBest':'split',.16);
      render();
      try{await persistStory(changed,{stageOverride:'quickquill-lumerre-practice-qualifying'});}catch(error){state.storyError=error?.message||'Qualifying lap could not be saved.';render();}
    },2850));
  }

  function renderLumerreQualifyingRun(scene, beat, sceneIndex) {
    const run=Number(beat.run)||1,q=practiceQualifyingState().qualifying||{},result=lumerreQualifyingRunResult(state.story,run),live=state.lumerreQualifyingLive?.run===run?state.lumerreQualifyingLive:null,display=result||live;
    const grid=result?(run===3&&q.grid?.length?q.grid:lumerreQualifyingGrid(state.story,run)):live?.grid||lumerreQualifyingGrid(state.story,run);
    const leader=grid[0],player=grid.find(row=>row.id==='player'),sectors=display?.sectors||[],deltas=result?.deltas||live?.deltas||(result?lumerreQualifyingSectorDeltas(sectors,run):[]);
    const phase=result?3:Number(live?.phase)||0;
    const bestBefore=Math.min(...[q.run1?.lapMs,q.run2?.lapMs].map(Number).filter(v=>v>0).concat([999999]));
    const sectorMarkup=display?sectors.map((value,index)=>{const revealed=phase>=index+1;const delta=Number(deltas[index])||0;return `<div class="${revealed?'is-revealed':'is-pending'}"><span>S${index+1}</span><b class="${revealed?(delta<=0?'is-good':'is-loss'):''}">${revealed?`${delta>=0?'+':''}${delta.toFixed(3)}`:'—'}</b><i style="--sector-p:${revealed?Math.min(100,68+index*10):12}%"></i></div>`;}).join(''):'';
    const body=`<section class="lumerre-quali-console ${run===3?'is-final-run':''} ${live?'is-live-lap':''}"><header class="lumerre-quali-head"><div><small>LUMERRE CROWN · QUALIFYING</small><h1>${run===1?'BANK ONE':run===2?'PUSH':'FINAL RUN'}</h1><p>${run===1?'Put a clean time on the board. The weekend cannot improve a lap that does not exist.':run===2?'The surface is coming toward you. Use the release strategy you chose.':'One lap remains. There is nowhere useful to save anything now.'}</p></div><span>${live?`LIVE · S${Math.min(3,Math.max(1,phase||1))}`:`RUN ${run} / 3`}</span></header>
      <div class="lumerre-quali-grid"><section class="lumerre-live-timing"><header><small>LIVE TIMING</small><strong>${result&&player?`P${player.position}`:live&&phase>=3?`P${live.position}`:'LIVE'}</strong></header>${telemetryClassificationMarkup(result||phase>=3?grid:grid.filter(row=>!row.player))}</section><section class="lumerre-current-lap"><header><small>CURRENT LAP</small><strong>${result?formatStoryLap(result.lapMs):live?phase>=3?formatStoryLap(live.lapMs):'ON LAP':'READY'}</strong></header>${display?sectorMarkup:`<div class="lumerre-quali-ready"><b>${run===3?'ONE LAP REMAINING':'TRACK CLEARANCE READY'}</b><span>${run>=2?escapeHtml(lumerreQualifyingWindowDef(q.window).label):'BANKER LAP'}</span></div>`}</section><section class="lumerre-quali-map"><img src="${LUMERRE_TECH_MAP}" alt="Lumerre Crown circuit map"><span>${live?phase===0?'RELEASED':phase<3?`SECTOR ${phase} COMPLETE`:'LAP COMPLETE':run===3?'FINAL ATTEMPT':'SECTOR TARGETS LIVE'}</span></section></div>
      <footer class="lumerre-quali-actions">${result?`<div><small>${player?.position===1?'PROVISIONAL POLE':player?.position<=2?'FRONT ROW':'CURRENT POSITION'}</small><strong>P${player?.position||7} · ${escapeHtml(formatStoryLap(result.lapMs))}</strong><span>${bestBefore<999999&&result.lapMs<bestBefore?`PERSONAL BEST · -${((bestBefore-result.lapMs)/1000).toFixed(3)}`:`GAP TO P1 · +${Math.max(0,(result.lapMs-(leader?.lapMs||result.lapMs))/1000).toFixed(3)}`}</span></div><button type="button" data-lumerre-practice-continue>${run===1?'REVIEW THE WINDOW':run===2?'PREPARE FINAL RUN':'LOCK QUALIFYING RESULT'} <i>›</i></button>`:live?`<div><small>LIVE DELTA</small><strong>${phase===0?'BUILDING SPEED':phase<3?`SECTOR ${phase} RECORDED`:'CROSSING THE LINE'}</strong><span>${phase>=1?`${Number(deltas[Math.min(phase,3)-1])<=0?'GAINING':'LOSING'} · ${Math.abs(Number(deltas[Math.min(phase,3)-1])||0).toFixed(3)}s`:'WAIT FOR FIRST SPLIT'}</span></div><button type="button" disabled>ON LAP…</button>`:`<div><small>${run===3?'FINAL ATTEMPT':'RELEASE PLAN'}</small><strong>${run>=2?escapeHtml(lumerreQualifyingWindowDef(q.window).label):'BANK A CLEAN LAP'}</strong></div><button type="button" data-lumerre-quali-run="${run}">${run===3?'START FINAL LAP':'SEND OUT'} <i>›</i></button>`}</footer>
      ${state.storyError?`<div class="story-error" role="alert">${escapeHtml(state.storyError)}</div>`:''}
    </section>`;
    root.innerHTML=lumerrePracticeStageShell(scene,sceneIndex,body,'is-qualifying');bindLumerrePracticeBack(scene);
    root.querySelector('[data-lumerre-quali-run]')?.addEventListener('click',()=>void resolveLumerreQualifyingRun(run));
    root.querySelector('[data-lumerre-practice-continue]')?.addEventListener('click',()=>void completeLumerreInteractiveBeat());
  }

  function renderLumerreQualifyingWindow(scene, beat, sceneIndex) {
    const q=practiceQualifyingState().qualifying||{},selected=q.window||'';
    const options=['early','evolution','tow','clear'];
    const body=`<section class="lumerre-window-console"><header><small>QUALIFYING STRATEGY · BETWEEN RUNS</small><h1>THE WINDOW</h1><p>Your first lap exists. Now choose what Quickquill values more: track evolution, clean air, or somebody else's wake.</p></header><div class="lumerre-window-layout"><section class="lumerre-window-map"><img src="${LUMERRE_TECH_MAP}" alt="Lumerre Crown technical circuit map"><div><span>TRACK EVOLUTION</span><strong>+0.18s EXPECTED</strong><i></i></div></section><section class="lumerre-window-options">${options.map((id,index)=>{const def=lumerreQualifyingWindowDef(id);return `<button type="button" class="${selected===id?'is-selected':''}" data-lumerre-window="${id}"><b>${String.fromCharCode(65+index)}</b><span><strong>${escapeHtml(def.label)}</strong><small>${escapeHtml(def.note)}</small></span></button>`;}).join('')}</section></div></section>`;
    root.innerHTML=lumerrePracticeStageShell(scene,sceneIndex,body,'is-window');bindLumerrePracticeBack(scene);
    root.querySelectorAll('[data-lumerre-window]').forEach(button=>button.addEventListener('click',()=>void chooseLumerreQualifyingWindow(String(button.dataset.lumerreWindow||''))));
  }

  async function chooseLumerreQualifyingWindow(value) {
    if(state.storySaving||state.transitionLocked)return;
    const def=lumerreQualifyingWindowDef(value),changed=cloneValue(state.story);changed.chapter6.practiceQualifying.qualifying.window=value;
    applyCareerEvolutionEffects(changed,{racecraft:{pressureHandling:def.pressure>0?1:0},reputation:{pressure:def.pressure}});
    changed.history=[...(changed.history||[]),{scene:'q52',event:'lumerre-qualifying-window',window:value}].slice(-100);
    state.story=changed;playTone(380);
    try{await persistStory(changed,{stageOverride:'quickquill-lumerre-practice-qualifying'});const next=nextStoryPointer(state.story);await saveStoryProgress(next.story,{transition:true});}
    catch(error){state.storyError=error?.message||'Qualifying strategy could not be saved.';render();}
  }

  function lumerreQualifyingPositionLabel(story=state.story) {
    const p=Number(practiceQualifyingState(story).qualifying?.position)||7;return ordinal(p);
  }
  function lumerreQualifyingMaraLine(story=state.story) {
    const p=Number(practiceQualifyingState(story).qualifying?.position)||7;
    if(p===1)return 'Enjoy pole for exactly tonight. Tomorrow everybody behind you gets to spend the opening lap trying to take it away.';
    if(p===2)return 'Front row changes the conversation. It does not change the job. Make the first sector boring and the rest can become interesting.';
    if(p<=4)return 'That is close enough to matter. Tomorrow we race forward, not emotionally.';
    return 'Not our cleanest Saturday. Good. Now we get to find out whether you can improve a weekend instead of merely enjoy one.';
  }
  function lumerreQualifyingNellLine(story=state.story) {
    const q=practiceQualifyingState(story).qualifying||{},p=Number(q.position)||7;
    if(p===1)return 'The final sector was the first time all day the setup did exactly what the model said it would. I am choosing to be pleased for fourteen seconds.';
    if(p<=3)return 'The final lap is clean enough that I can use it tomorrow. That is more valuable than a spectacular lap I cannot explain.';
    return 'There is still race pace in the data. Qualifying simply refused to package it nicely.';
  }
  function lumerreQualifyingTyreseLine(story=state.story) {
    const q=practiceQualifyingState(story).qualifying||{},p=Number(q.position)||7,t=Number(q.tyresePosition)||0;
    if(t&&p<t)return 'Right. So we are doing this now. Good lap. I will be extremely mature about starting behind you for at least the first thirty seconds.';
    if(t&&p===t)return 'Apparently the timing system has decided diplomacy is important. I can live with that.';
    return 'You were close. Tomorrow is longer than one lap, which is inconveniently where I tend to become annoying.';
  }


  // V34.29.5 — Lumerre is no longer rendered by Career Mode; the root engine now accepts this bridge.  These points are
  // supplied only as a track descriptor to the site's established Dragon Racing
  // engine, which remains responsible for dragon sprites, camera, movement and
  // the actual race presentation.
  const LUMERRE_ENGINE_WAYPOINTS = [
    [50.06,88.31],
    [84.93,88.31],
    [89.95,85.44],
    [90.85,83.42],
    [91.45,78.96],
    [90.79,75.66],
    [89.17,73.01],
    [84.51,70.35],
    [83.67,69.08],
    [83.25,66.52],
    [83.67,63.23],
    [84.69,61.21],
    [90.07,56.00],
    [93.72,50.05],
    [94.02,43.46],
    [92.46,38.79],
    [91.51,38.68],
    [87.02,32.52],
    [86.36,27.95],
    [87.02,19.55],
    [86.54,16.47],
    [85.35,14.45],
    [82.30,11.90],
    [77.27,12.33],
    [75.12,13.92],
    [72.43,14.35],
    [39.65,13.92],
    [36.36,9.67],
    [33.31,8.18],
    [30.20,7.97],
    [24.10,9.99],
    [14.41,17.32],
    [11.00,21.25],
    [9.87,25.50],
    [10.47,29.12],
    [13.22,31.77],
    [23.80,38.36],
    [25.00,42.19],
    [24.16,48.67],
    [22.31,51.65],
    [14.17,59.09],
    [12.02,63.55],
    [11.72,66.31],
    [12.32,69.61],
    [15.73,74.60],
    [14.71,83.32],
    [15.49,86.18],
    [18.48,88.42],
    [26.14,87.67],
    [28.89,88.42],
    [50.06,88.31]
  ];

  function lumerreRaceNameForId(id, story = state.story) {
    if (id === 'player') return storyDragonName();
    return CAREER_RACER_AI[id]?.name || String(id || '').replace(/-/g,' ');
  }

  function lumerreRaceTeamForId(id) {
    if (id === 'player') return 'Quickquill';
    return CAREER_RACER_AI[id]?.team || 'Independent';
  }

  function lumerreRaceFixedGrid(story = state.story) {
    const qual = practiceQualifyingState(story).qualifying || {};
    const playerPos = Math.max(1, Math.min(7, Number(qual.position) || 4));
    let tyresePos = Math.max(1, Math.min(7, Number(qual.tyresePosition) || Math.min(7, playerPos + 1)));
    if (tyresePos === playerPos) tyresePos = playerPos === 1 ? 2 : playerPos - 1;
    const order = new Array(7).fill('');
    order[playerPos - 1] = 'player';
    order[tyresePos - 1] = 'tyrese';
    const filler = ['ren','jalen','sofia','luka','maya'];
    let cursor = 0;
    for (let i = 0; i < order.length; i += 1) {
      if (!order[i]) {
        order[i] = filler[cursor] || 'maya';
        cursor += 1;
      }
    }
    return order;
  }

  function lumerreRacePhaseLabel(phase = '') {
    if (phase === 'engine-launching') return 'Opening Dragon Racing';
    if (phase === 'engine-live') return 'Live race';
    if (phase === 'result') return 'Result';
    return 'Grid';
  }

  function lumerreRaceEnsureState(rw, story = state.story) {
    if (!rw || typeof rw !== 'object') return rw;
    if (!Array.isArray(rw.gridOrder) || rw.gridOrder.length !== 7) rw.gridOrder = lumerreRaceFixedGrid(story);
    if (!Array.isArray(rw.liveOrder) || rw.liveOrder.length !== 7) rw.liveOrder = rw.gridOrder.slice();
    rw.totalLaps = 10;
    rw.startPosition = Math.max(1, rw.gridOrder.indexOf('player') + 1 || 4);
    rw.tyreseStart = Math.max(1, rw.gridOrder.indexOf('tyrese') + 1 || Math.min(7, rw.startPosition + 1));
    rw.currentPosition = Math.max(1, rw.liveOrder.indexOf('player') + 1 || rw.startPosition);
    rw.tyreseCurrent = Math.max(1, rw.liveOrder.indexOf('tyrese') + 1 || rw.tyreseStart);
    rw.currentLap = Math.max(0, Math.min(10, Number(rw.currentLap) || 0));
    if (!rw.engineVersion) rw.engineVersion = 4;
    if (!rw.energyBand) rw.energyBand = 'STRONG';
    if (!Array.isArray(rw.log)) rw.log = [];
    rw.log = rw.log.slice(-18);
    return rw;
  }

  function lumerreEngineAsset(path = '') {
    const clean = String(path || '').replace(/^\/+/, '');
    return `dragonbound-career-mode/${clean}`;
  }

  function lumerreEngineEntrants(story = state.story) {
    const grid = lumerreRaceFixedGrid(story);
    return grid.map((id, index) => ({
      id,
      racerId:id,
      gridPosition:index + 1,
      name:lumerreRaceNameForId(id, story),
      team:lumerreRaceTeamForId(id),
      isPlayer:id === 'player',
      isTeammate:id === 'tyrese',
      ai:id === 'player' ? null : cloneValue(CAREER_RACER_AI[id] || {})
    }));
  }

  function lumerreEngineTrackDescriptor(story = state.story) {
    return {
      id:'lumerre_crown_circuit',
      trackId:'lumerre_crown_circuit',
      key:'lumerre_crown_circuit',
      name:'Lumerre Crown Circuit',
      title:'THE LUMERRE CROWN',
      region:'Lumerre',
      worldWidth:1672,
      worldHeight:941,
      laps:10,
      totalLaps:10,
      closedCircuit:true,
      routeType:'continuous-loop',
      source:'career-mode-v34.29.5-real-engine-route',
      // The existing racing engine may use whichever of these descriptor fields it supports.
      image:lumerreEngineAsset(LUMERRE_RACE_MAP),
      background:lumerreEngineAsset(LUMERRE_RACE_MAP),
      circuitImage:lumerreEngineAsset(LUMERRE_RACE_MAP),
      waypoints:LUMERRE_ENGINE_WAYPOINTS.map(point => ({ x:Number(point[0]) / 100, y:Number(point[1]) / 100 })),
      waypointPercent:LUMERRE_ENGINE_WAYPOINTS.map(point => point.slice()),
      startFinish:{ x:.5006, y:.8831 },
      environment:{ bright:true, crowd:true, prestige:true, terraces:true, gardens:true },
      presentation:{
        liveHud:lumerreEngineAsset(LUMERRE_RACE_HUD),
        teamOrders:lumerreEngineAsset(LUMERRE_RACE_TEAM_ORDERS),
        battleReference:lumerreEngineAsset(LUMERRE_RACE_BATTLE),
        podium:lumerreEngineAsset(LUMERRE_RACE_PODIUM),
        trophy:lumerreEngineAsset(LUMERRE_RACE_TROPHY)
      }
    };
  }

  function lumerreEngineRacePayload(story, runId) {
    const rw = lumerreRaceEnsureState(lumerreRaceDayState(story), story);
    const qual = practiceQualifyingState(story).qualifying || {};
    const practice = practiceQualifyingState(story).practice || {};
    const grid = rw.gridOrder.slice();
    return {
      careerSaveId:state.activeSave.id,
      runId,
      raceKey:'lumerre',
      trackId:'lumerre_crown_circuit',
      trackCandidates:['lumerre_crown_circuit','lumerre_crown','lumerre'],
      engineMode:'existing-dragon-racing-engine',
      renderer:'dragon-racing',
      fallbackAllowed:false,
      raceNumber:3,
      totalLaps:10,
      laps:10,
      accountKey:accountKey(username()),
      playerKey:accountKey(username()),
      playerName:storyDragonName(),
      startPosition:rw.startPosition,
      qualifyingPosition:rw.startPosition,
      qualifyingGrid:grid.slice(),
      entrants:lumerreEngineEntrants(story),
      track:lumerreEngineTrackDescriptor(story),
      trackDescriptor:lumerreEngineTrackDescriptor(story),
      registerTrack:true,
      trackRegistration:{ mode:'additive', descriptor:lumerreEngineTrackDescriptor(story) },
      strategy:String(story.chapter6?.practiceQualifying?.priority || 'balanced'),
      setupPlan:cloneValue(practice.setup || {}),
      setupDiagnosis:cloneValue(practice.diagnosis || {}),
      qualifying:cloneValue(qual),
      teammate:{ id:'tyrese', name:'Tyrese Bell', gridPosition:rw.tyreseStart },
      teamOrder:{ enabled:true, teammateId:'tyrese', preferredLap:4, choices:['obey','wait','ignore'] },
      careerEvolution:careerEvolutionRaceConfig(story, 3),
      presentation:{
        title:'THE LUMERRE CROWN',
        venue:'Lumerre Crown Circuit',
        liveHud:lumerreEngineAsset(LUMERRE_RACE_HUD),
        teamOrders:lumerreEngineAsset(LUMERRE_RACE_TEAM_ORDERS),
        battleReference:lumerreEngineAsset(LUMERRE_RACE_BATTLE),
        podium:lumerreEngineAsset(LUMERRE_RACE_PODIUM),
        trophy:lumerreEngineAsset(LUMERRE_RACE_TROPHY),
        useExistingDragonSprites:true,
        useExistingRaceCamera:true,
        useExistingRaceMovement:true,
        useExistingRacePresentation:true
      },
      audio:{
        main:lumerreEngineAsset(`${LUMERRE_RACE_AUDIO}lumerre_crown_main_race_BALANCED.mp3`),
        finalLap:lumerreEngineAsset(`${LUMERRE_RACE_AUDIO}lumerre_crown_final_lap_BALANCED.mp3`),
        reuseExistingCrowd:true,
        mainVolume:.24,
        finalLapVolume:.28,
        crowdVolume:.12,
        countdownVolume:.05
      }
    };
  }

  function lumerreClassificationFromResult(result = {}, story = state.story) {
    const rows = [];
    const candidates = [result.classification, result.standings, result.results, result.finishOrder];
    for (const candidate of candidates) {
      if (!Array.isArray(candidate)) continue;
      candidate.forEach((row, index) => {
        if (typeof row === 'string') rows.push({ id:String(row), rank:index + 1, name:String(row) });
        else if (row && typeof row === 'object') rows.push({ ...row, rank:Number(row.rank ?? row.position ?? row.pos) || index + 1 });
      });
      if (rows.length) break;
    }
    const aliases = {
      player:['player','player dragon',String(storyDragonName()).toLowerCase(),String(accountKey(username())).toLowerCase()],
      tyrese:['tyrese','tyrese bell'], jalen:['jalen','jalen cross'], sofia:['sofia','sofia mendes'], luka:['luka','luka kovač','luka kovac'], ren:['ren','ren sato'], maya:['maya','maya banks']
    };
    const identify = row => {
      const hay = [row.id,row.racerId,row.key,row.name,row.racer,row.driver,row.playerName,row.username].map(value => String(value || '').toLowerCase().trim()).filter(Boolean).join(' | ');
      for (const [id,names] of Object.entries(aliases)) if (names.some(name => hay === name || hay.includes(name))) return id;
      if (row.isPlayer || row.player === true) return 'player';
      return '';
    };
    const byId = {};
    rows.forEach((row,index) => { const id=identify(row); if(id && !byId[id]) byId[id]={...row,id,rank:Number(row.rank)||index+1}; });
    const rivalRanks = result.rivalRanks && typeof result.rivalRanks === 'object' ? result.rivalRanks : {};
    const playerRank = Math.max(1, Math.min(7, Number(result.rank ?? result.position ?? byId.player?.rank) || 7));
    const tyreseRank = Math.max(1, Math.min(7, Number(byId.tyrese?.rank ?? rivalRanks.tyrese ?? rivalRanks['Tyrese Bell']) || 7));
    const order = rows.length ? rows.slice().sort((a,b)=>(Number(a.rank)||99)-(Number(b.rank)||99)).map(identify).filter(Boolean) : [];
    if (!order.includes('player')) order.splice(Math.max(0, playerRank - 1), 0, 'player');
    if (!order.includes('tyrese')) order.splice(Math.max(0, tyreseRank - 1), 0, 'tyrese');
    const fallbackOrder = lumerreRaceFixedGrid(story);
    fallbackOrder.forEach(id => { if (!order.includes(id)) order.push(id); });
    return { rows, byId, playerRank, tyreseRank, order:order.slice(0,7) };
  }

  function applyLumerreEngineResultToCareer(changed, rw, result = {}) {
    if (rw.engineResultApplied) return;
    rw.engineResultApplied = true;
    const evo = syncCareerEvolution(changed);
    const finish = Math.max(1, Math.min(7, Number(rw.finalPosition) || 7));
    const tyreseFinish = Math.max(1, Math.min(7, Number(rw.tyreseFinish) || 7));
    evo.records.starts = Math.max(0, Number(evo.records.starts) || 0) + 1;
    evo.records.bestFinish = evo.records.bestFinish ? Math.min(Number(evo.records.bestFinish) || 99, finish) : finish;
    evo.records.positionsGained = Math.max(0, Number(evo.records.positionsGained) || 0) + Math.max(0, Number(rw.startPosition || 7) - finish);
    if (finish <= 3) {
      evo.records.podiums = Math.max(0, Number(evo.records.podiums) || 0) + 1;
      evo.records.consecutivePodiums = Math.max(0, Number(evo.records.consecutivePodiums) || 0) + 1;
      evo.records.bestPodiumStreak = Math.max(Number(evo.records.bestPodiumStreak) || 0, Number(evo.records.consecutivePodiums) || 0);
      if (!evo.firsts.firstPodium) evo.firsts.firstPodium = 'Lumerre Crown';
    } else evo.records.consecutivePodiums = 0;
    if (finish === 1) {
      evo.records.wins = Math.max(0, Number(evo.records.wins) || 0) + 1;
      if (!evo.firsts.firstWin) evo.firsts.firstWin = 'Lumerre Crown';
    }
    const orderResponse = String(rw.teamOrder || result.teamOrderResponse || '').toLowerCase();
    if (orderResponse === 'ignore' || orderResponse === 'ignored') evo.tyrese.teamOrdersIgnored += 1;
    if (orderResponse === 'obey' || orderResponse === 'obeyed') evo.tyrese.teamOrdersObeyed += 1;
    evo.tyrese.playerFinishesAhead += finish < tyreseFinish ? 1 : 0;
    evo.tyrese.tyreseFinishesAhead += finish > tyreseFinish ? 1 : 0;
    applyCareerEvolutionEffects(changed, {
      reputation:{ fame:finish === 1 ? 8 : finish <= 3 ? 5 : 2, paddockRespect:finish <= 3 ? 4 : 2, media:finish <= 3 ? 3 : 1, quickquillTrust:(orderResponse === 'ignore' || orderResponse === 'ignored') ? -2 : (orderResponse === 'obey' || orderResponse === 'obeyed') ? 3 : 1 },
      racecraft:{
        overtaking:Math.max(1, Math.min(3, Number(result.playerOvertakes ?? result.overtakes ?? result.totalOvertakes) || 1)),
        defending:1,
        starts:2,
        staminaManagement:1,
        pressureHandling:2
      },
      tyrese:{ friendship:(orderResponse === 'obey' || orderResponse === 'obeyed') ? 2 : 0, professionalRespect:finish < tyreseFinish ? 3 : 1, competitiveTension:(orderResponse === 'ignore' || orderResponse === 'ignored') ? 4 : 1 }
    });
  }

  async function launchLumerreStoryRace() {
    if (state.storySaving || state.transitionLocked || !state.activeSave) return;
    const story = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (!story.completed?.practiceQualifying || story.completed?.raceWeekend) return;
    if (story.chapter !== 'lumerre-race-day') return;
    const changed = cloneValue(story);
    changed.chapter6 = { ...defaultQuickquillStory().chapter6, ...(changed.chapter6 || {}), raceWeekend:{...defaultQuickquillStory().chapter6.raceWeekend,...(changed.chapter6?.raceWeekend || {})} };
    const rw = lumerreRaceEnsureState(changed.chapter6.raceWeekend, changed);
    const runId = String(rw.runId || `lumerre-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
    rw.runId = runId;
    rw.started = true;
    rw.completed = false;
    rw.phase = 'engine-launching';
    rw.engineVersion = 4;
    rw.engine = 'site-dragon-racing';
    rw.engineStartedAt = new Date().toISOString();
    rw.gridOrder = lumerreRaceFixedGrid(changed);
    rw.liveOrder = rw.gridOrder.slice();
    rw.startPosition = Math.max(1, rw.gridOrder.indexOf('player') + 1);
    rw.tyreseStart = Math.max(1, rw.gridOrder.indexOf('tyrese') + 1);
    rw.log = [...(rw.log || []).slice(-17), { event:'real-engine-launch', runId, trackId:'lumerre_crown_circuit', lap:0 }];
    changed.history = [...(changed.history || []), { scene:'q56', event:'lumerre-real-engine-start', runId, startPosition:rw.startPosition, engineVersion:4 }].slice(-120);
    try {
      await persistStory(changed, { stageOverride:'quickquill-lumerre-race-day' });
      state.story = changed;
      state.storyError = '';
      try { music.lumerreRace?.pause?.(); music.lumerreRaceFinal?.pause?.(); } catch (_) {}
      const payload = lumerreEngineRacePayload(changed, runId);
      // Expose the descriptor to the same-origin parent as an additive registry.  This
      // does not mutate Canto/Blackglass and lets compatible engine builds register
      // the track without Career Mode owning the renderer.
      try {
        if (window.parent && window.parent !== window) {
          const descriptor=cloneValue(payload.trackDescriptor);
          window.parent.DragonboundCareerTrackDescriptors ||= {};
          window.parent.DragonboundCareerTrackDescriptors.lumerre_crown_circuit = descriptor;
          window.parent.DragonRacingCareerTracks ||= {};
          window.parent.DragonRacingCareerTracks.lumerre_crown_circuit = descriptor;
          try { window.parent.dispatchEvent(new CustomEvent('dragonbound:career-track-register',{detail:descriptor})); } catch (_) {}
          try { window.parent.document?.dispatchEvent?.(new CustomEvent('dragonbound:career-track-register',{detail:descriptor})); } catch (_) {}
        }
      } catch (_) {}
      sendParent('dragonbound-career-story-track-register', { careerSaveId:state.activeSave.id, raceKey:'lumerre', trackId:'lumerre_crown_circuit', descriptor:payload.trackDescriptor });
      sendParent('dragonbound-career-story-race-start', payload);
      render();
    } catch (error) {
      console.error('[Dragonbound Career Mode] Lumerre real-engine launch failed', error);
      state.storySaving = false;
      state.storyError = error?.message || 'Lumerre could not be handed to Dragon Racing. Your qualifying result is safe.';
      render();
    }
  }

  async function acceptLumerreRaceResult(result = {}) {
    if (!state.activeSave || state.storySaving) return;
    const story = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (story.completed?.raceWeekend || story.chapter6?.raceWeekend?.completed) return;
    if (result.careerSaveId && String(result.careerSaveId) !== String(state.activeSave.id)) return;
    const rwCurrent = lumerreRaceDayState(story);
    if (rwCurrent.runId && result.runId && String(rwCurrent.runId) !== String(result.runId)) return;
    const changed = cloneValue(story);
    changed.chapter6 = { ...defaultQuickquillStory().chapter6, ...(changed.chapter6 || {}), raceWeekend:{...defaultQuickquillStory().chapter6.raceWeekend,...(changed.chapter6?.raceWeekend || {})} };
    const rw = lumerreRaceEnsureState(changed.chapter6.raceWeekend, changed);
    const classification = lumerreClassificationFromResult(result, changed);
    rw.liveOrder = classification.order.slice();
    rw.finalPosition = classification.playerRank;
    rw.tyreseFinish = classification.tyreseRank;
    rw.currentPosition = rw.finalPosition;
    rw.tyreseCurrent = rw.tyreseFinish;
    rw.currentLap = 10;
    rw.completed = true;
    rw.phase = 'result';
    rw.engineVersion = 4;
    rw.engine = 'site-dragon-racing';
    rw.completedAt = new Date().toISOString();
    rw.finishMs = Math.max(0, Number(result.finishMs) || 0);
    rw.bestLapMs = Math.max(0, Number(result.bestLapMs) || 0);
    rw.playerOvertakes = Math.max(0, Number(result.playerOvertakes ?? result.overtakes ?? result.totalOvertakes) || 0);
    rw.positionsGained = Math.max(0, Number(result.positionsGained) || Math.max(0, rw.startPosition - rw.finalPosition));
    rw.teamOrder = String(result.teamOrderResponse || result.teamOrder || rw.teamOrder || '').replace(/^order-/, '');
    rw.badge = rw.finalPosition === 1 ? 'WIN' : rw.finalPosition <= 3 ? 'PODIUM' : rw.finalPosition <= 5 ? 'POINTS' : 'FINISH';
    rw.headline = rw.finalPosition === 1 ? 'CROWNED AT LUMERRE' : rw.finalPosition <= 3 ? 'LUMERRE CROWN PODIUM' : rw.finalPosition <= 5 ? 'POINTS UNDER PRESSURE' : 'THE CHEQUERED FLAG';
    rw.narrative = rw.finalPosition === 1
      ? `${storyDragonName()} wins the Lumerre Crown in the same Dragon Racing engine that carried the season here.`
      : rw.finalPosition <= 3
      ? `${storyDragonName()} takes ${ordinal(rw.finalPosition)} after a full Lumerre Crown race.`
      : `${storyDragonName()} finishes ${ordinal(rw.finalPosition)} at the end of the Lumerre Crown.`;
    rw.highlight = String(result.notableMoment || result.highlight || rw.narrative);
    rw.log = [...(rw.log || []).slice(-17), { event:'real-engine-chequered-flag', finalPosition:rw.finalPosition, tyreseFinish:rw.tyreseFinish, engineVersion:4 }];
    rw.result = {
      rank:rw.finalPosition,
      finishMs:rw.finishMs,
      bestLapMs:rw.bestLapMs,
      startPosition:rw.startPosition,
      positionsGained:rw.positionsGained,
      overtakes:rw.playerOvertakes,
      leadChanges:Math.max(0, Number(result.leadChanges) || 0),
      photoFinish:!!result.photoFinish,
      fastestLap:!!result.fastestLap,
      notableMoment:String(result.notableMoment || ''),
      rivalRanks:result.rivalRanks && typeof result.rivalRanks === 'object' ? {...result.rivalRanks} : {},
      standings:classification.rows.slice(0,7).map(row => ({...row})),
      events:Array.isArray(result.events) ? result.events.slice(-20).map(row => typeof row === 'object' ? {...row} : row) : []
    };
    changed.completed = { ...(changed.completed || {}), raceWeekend:true };
    changed.history = [...(changed.history || []), { scene:'q56', event:'lumerre-real-engine-finish', finish:rw.finalPosition, tyrese:rw.tyreseFinish, engineVersion:4 }].slice(-120);
    applyLumerreEngineResultToCareer(changed, rw, result);
    state.story = changed;
    state.lumerreRaceTransient = rw.narrative;
    state.storyError = '';
    render();
    syncMusic({restart:true});
    try { await persistStory(changed, { stageOverride:'quickquill-lumerre-race-day' }); }
    catch (error) { state.storyError = error?.message || 'The Lumerre Crown result could not be saved.'; render(); }
  }

  async function handleLumerreRaceAbort(message = '') {
    if (!state.activeSave) return;
    const changed = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (changed.completed?.raceWeekend || changed.chapter6?.raceWeekend?.completed) return;
    changed.chapter6 = { ...defaultQuickquillStory().chapter6, ...(changed.chapter6 || {}), raceWeekend:{...defaultQuickquillStory().chapter6.raceWeekend,...(changed.chapter6?.raceWeekend || {})} };
    const rw = lumerreRaceEnsureState(changed.chapter6.raceWeekend, changed);
    rw.phase = 'grid';
    rw.engineVersion = 4;
    rw.engine = 'site-dragon-racing';
    rw.runId = '';
    rw.completed = false;
    state.story = changed;
    state.mode = 'story';
    state.storyError = message || 'Race exited. Your Lumerre qualifying result is safe — start the Crown again when ready.';
    try { await persistStory(changed, { stageOverride:'quickquill-lumerre-race-day' }); } catch (_) {}
    render();
    syncMusic({restart:true});
  }

  function rollbackLegacyLumerreSimulationResult(story, rw) {
    if (!story || !rw || Number(rw.engineVersion || 0) >= 4 || !rw.engineResultApplied) return;
    const evo = syncCareerEvolution(story);
    const finish = Math.max(1, Math.min(7, Number(rw.finalPosition) || 7));
    const tyreseFinish = Math.max(1, Math.min(7, Number(rw.tyreseFinish) || 7));
    const start = Math.max(1, Math.min(7, Number(rw.startPosition) || 7));
    evo.records.starts = Math.max(0, Number(evo.records.starts || 0) - 1);
    evo.records.positionsGained = Math.max(0, Number(evo.records.positionsGained || 0) - Math.max(0, start - finish));
    if (finish <= 3) evo.records.podiums = Math.max(0, Number(evo.records.podiums || 0) - 1);
    if (finish === 1) evo.records.wins = Math.max(0, Number(evo.records.wins || 0) - 1);
    const priorRanks = [Number(story.race?.result?.rank)||0, Number(story.blackglassRace?.result?.rank)||0].filter(Boolean);
    evo.records.bestFinish = priorRanks.length ? Math.min(...priorRanks) : null;
    let streak=0;
    for (const rank of priorRanks) streak = rank <= 3 ? streak + 1 : 0;
    evo.records.consecutivePodiums = streak;
    evo.records.bestPodiumStreak = Math.max(streak, Math.min(Number(evo.records.bestPodiumStreak)||0, Math.max(0, Number(evo.records.podiums)||0)));
    if (evo.firsts?.firstWin === 'Lumerre Crown') evo.firsts.firstWin = '';
    if (evo.firsts?.firstPodium === 'Lumerre Crown') evo.firsts.firstPodium = priorRanks.some(rank=>rank<=3) ? (Number(story.race?.result?.rank)<=3 ? 'Canto Plains' : 'Blackglass Night Circuit') : '';
    const orderResponse=String(rw.teamOrder||'').toLowerCase();
    if (orderResponse === 'ignore') evo.tyrese.teamOrdersIgnored=Math.max(0,Number(evo.tyrese.teamOrdersIgnored||0)-1);
    if (orderResponse === 'obey') evo.tyrese.teamOrdersObeyed=Math.max(0,Number(evo.tyrese.teamOrdersObeyed||0)-1);
    if (finish < tyreseFinish) evo.tyrese.playerFinishesAhead=Math.max(0,Number(evo.tyrese.playerFinishesAhead||0)-1);
    if (finish > tyreseFinish) evo.tyrese.tyreseFinishesAhead=Math.max(0,Number(evo.tyrese.tyreseFinishesAhead||0)-1);
    const subtract=(bucket,key,value)=>{ if(bucket&&key in bucket) bucket[key]=clampCareerValue((Number(bucket[key])||0)-Number(value||0)); };
    subtract(evo.reputation,'fame',finish===1?8:finish<=3?5:2);
    subtract(evo.reputation,'paddockRespect',finish<=3?4:2);
    subtract(evo.reputation,'media',finish<=3?3:1);
    subtract(evo.reputation,'quickquillTrust',orderResponse==='ignore'?-2:orderResponse==='obey'?3:1);
    subtract(evo.racecraft,'overtaking',2); subtract(evo.racecraft,'defending',1); subtract(evo.racecraft,'starts',2); subtract(evo.racecraft,'staminaManagement',1); subtract(evo.racecraft,'pressureHandling',2);
    subtract(evo.tyrese,'friendship',orderResponse==='obey'?2:0); subtract(evo.tyrese,'professionalRespect',finish<tyreseFinish?3:1); subtract(evo.tyrese,'competitiveTension',orderResponse==='ignore'?4:1);
    evo.careerPhase=deriveCareerPhase(evo); evo.fameTier=deriveFameTier(evo); evo.playerStyle=deriveCareerRacingStyle(story,evo);
    story.careerEvolution=evo;
  }

  async function startLumerreRaceDay() {
    if (state.storySaving || state.transitionLocked || !state.activeSave) return;
    const current = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (!current.completed?.practiceQualifying) return;
    current.chapter6 = {
      ...defaultQuickquillStory().chapter6,
      ...(current.chapter6 || {}),
      practiceQualifying:{...defaultQuickquillStory().chapter6.practiceQualifying,...(current.chapter6?.practiceQualifying || {}),practice:{...defaultQuickquillStory().chapter6.practiceQualifying.practice,...(current.chapter6?.practiceQualifying?.practice || {}),setup:{...defaultQuickquillStory().chapter6.practiceQualifying.practice.setup,...(current.chapter6?.practiceQualifying?.practice?.setup || {})},diagnosis:{...defaultQuickquillStory().chapter6.practiceQualifying.practice.diagnosis,...(current.chapter6?.practiceQualifying?.practice?.diagnosis || {})}},qualifying:{...defaultQuickquillStory().chapter6.practiceQualifying.qualifying,...(current.chapter6?.practiceQualifying?.qualifying || {})}},
      raceWeekend:{...defaultQuickquillStory().chapter6.raceWeekend,...(current.chapter6?.raceWeekend || {}),log:Array.isArray(current.chapter6?.raceWeekend?.log)?current.chapter6.raceWeekend.log.slice(0,18).map(row=>({...row})):[]}
    };
    let rw = current.chapter6.raceWeekend;
    // V34.29 through V34.29.3 used non-canonical button/map simulations. Reset those
    // results once so testing the real engine is never skipped by a stale completion.
    if (Number(rw.engineVersion || 0) < 4) {
      rollbackLegacyLumerreSimulationResult(current, rw);
      const fresh = cloneValue(defaultQuickquillStory().chapter6.raceWeekend);
      current.chapter6.raceWeekend = { ...fresh, engineVersion:4, engine:'site-dragon-racing', started:true, phase:'grid', gridOrder:lumerreRaceFixedGrid(current), liveOrder:lumerreRaceFixedGrid(current), currentLap:0, totalLaps:10, log:[] };
      current.completed = { ...(current.completed || {}), raceWeekend:false };
      rw = current.chapter6.raceWeekend;
    }
    lumerreRaceEnsureState(rw, current);
    if (!rw.started) {
      rw.started = true;
      rw.phase = 'grid';
      rw.gridOrder = lumerreRaceFixedGrid(current);
      rw.liveOrder = rw.gridOrder.slice();
      rw.currentLap = 0;
      rw.totalLaps = 10;
      rw.engineVersion = 4;
      rw.engine = 'site-dragon-racing';
      rw.log = [{ event:'grid formed', position:rw.startPosition, lap:0 }];
    }
    current.chapter = 'lumerre-race-day';
    current.scene = 'q56';
    current.beat = 0;
    state.story = current;
    state.mode = 'story';
    state.storyError = '';
    state.lumerreRaceTransient = '';
    render();
    syncMusic({restart:true});
    try { await persistStory(current, { stageOverride:'quickquill-lumerre-race-day' }); }
    catch (error) { state.storyError = error?.message || 'Race day could not be prepared.'; render(); }
  }

  async function handleLumerreRaceAction(action) {
    if (action === 'after-flag') {
      await startLumerreAfterFlag();
      return;
    }
    if (action === 'result-journey') {
      state.mode = 'story-journey';
      render();
      syncMusic({restart:true});
      return;
    }
    if (action === 'launch-real-engine' || action === 'retry-real-engine') {
      await launchLumerreStoryRace();
    }
  }

  function renderLumerreRaceDay() {
    const story = state.story || normaliseQuickquillStory(activeSaveState().story);
    const rw = lumerreRaceEnsureState(lumerreRaceDayState(story), story);
    const qual = practiceQualifyingState(story).qualifying || {};
    const result = rw.phase === 'result' && rw.completed;
    const launching = ['engine-launching','engine-live'].includes(String(rw.phase || ''));
    const background = result && Number(rw.finalPosition || 9) <= 3 ? LUMERRE_RACE_PODIUM : LUMERRE_LAUNCH_TUNNEL;
    const title = result ? (rw.headline || 'THE CHEQUERED FLAG') : launching ? 'OPENING DRAGON RACING' : 'THE LUMERRE CROWN';
    const copy = result
      ? (rw.narrative || `${storyDragonName()} finished ${ordinal(rw.finalPosition || 7)} at Lumerre.`)
      : launching
        ? 'Career Mode has handed the event to the established Dragon Racing engine. The race itself belongs there — normal dragon sprites, normal race camera, normal movement and real on-track position changes.'
        : `You qualified ${ordinal(Number(qual.position) || rw.startPosition || 4)}. The Crown will now open in the same Dragon Racing system used by the other races — not the old map-marker simulation.`;
    const grid = result ? (rw.liveOrder || []) : (rw.gridOrder || lumerreRaceFixedGrid(story));
    const classification = grid.map((id, index) => `<div class="lumerre-grid-row ${id === 'player' ? 'is-player' : ''}"><span>P${index + 1}</span><strong>${escapeHtml(lumerreRaceNameForId(id))}</strong><small>${escapeHtml(lumerreRaceTeamForId(id))}</small></div>`).join('');
    const action = result
      ? `<button type="button" data-lumerre-race-action="after-flag"><b>CONTINUE · AFTER THE FLAG</b><span>The chequered flag is not the end of Crown Week.</span></button><button type="button" class="is-secondary" data-lumerre-race-action="result-journey"><b>STORY JOURNEY</b><span>Leave the finale for later.</span></button>`
      : launching
        ? `<div class="lumerre-engine-handoff"><small>ENGINE HANDOFF</small><strong>DRAGON RACING SHOULD BE OPEN</strong><p>If you exited the race, use retry. Career Mode will never fall back to the old tiny-marker race.</p></div><button type="button" data-lumerre-race-action="retry-real-engine"><b>RETRY DRAGON RACING</b><span>Re-open the same Lumerre run safely.</span></button>`
        : `<button type="button" data-lumerre-race-action="launch-real-engine"><b>START LUMERRE IN DRAGON RACING</b><span>Launch the real race engine used by Canto and Blackglass.</span></button>`;
    root.innerHTML = `<section class="lumerre-race-shell"><img class="lumerre-race-backdrop" src="${background}" alt="" aria-hidden="true"><div class="lumerre-race-shade"></div><header class="lumerre-race-header"><div><small>CHAPTER SIX · ${result ? 'OFFICIAL RESULT' : 'RACE DAY'}</small><h1>${escapeHtml(title)}</h1><p>${escapeHtml(copy)}</p></div><button type="button" class="lumerre-race-back" data-lumerre-race-action="result-journey">STORY JOURNEY</button></header><div class="lumerre-race-stage"><section class="lumerre-race-card"><div class="lumerre-race-badge">${escapeHtml(result ? (rw.badge || 'RESULT') : launching ? 'REAL ENGINE' : 'DRAGON RACING')}</div><div class="lumerre-race-grid-card"><header><small>${result ? 'FINAL CLASSIFICATION' : 'STARTING GRID'}</small><strong>${result ? `YOU · ${ordinal(rw.finalPosition || 7)}` : `YOU · ${ordinal(rw.startPosition || Number(qual.position) || 4)}`}</strong></header>${classification}</div>${result && Number(rw.finalPosition || 9) <= 3 ? `<img class="lumerre-race-trophy" src="${LUMERRE_RACE_TROPHY}" alt="Lumerre Crown trophy">` : ''}</section><section class="lumerre-race-actions">${action}${state.storyError ? `<div class="story-error" role="alert">${escapeHtml(state.storyError)}</div>` : ''}</section></div></section>`;
    root.querySelectorAll('[data-lumerre-race-action]').forEach(button => button.addEventListener('click', () => { void handleLumerreRaceAction(button.dataset.lumerreRaceAction || ''); }));
  }

  function renderPracticeQualifyingComplete() {

    const story=state.story||normaliseQuickquillStory(activeSaveState().story),pq=practiceQualifyingState(story),practice=pq.practice||{},q=pq.qualifying||{},evo=syncCareerEvolution(story),race=lumerreRaceDayState(story),raceAction=(story.completed?.raceWeekend||race.completed)?'VIEW RACE DAY RESULT':'BEGIN RACE DAY';
    root.innerHTML=`<section class="practice-complete-shell"><img src="${LUMERRE_LAUNCH_TUNNEL}" alt="" aria-hidden="true"><div class="practice-complete-shade"></div><header><small>CHAPTER SIX · PRACTICE & QUALIFYING</small><h1>THE MEASURE OF A LAP</h1><p>Practice found the problem. Qualifying found the grid. Tomorrow the Lumerre Crown asks whether either one matters in traffic.</p></header><div class="practice-complete-grid"><article><small>GRID</small><strong>${escapeHtml(lumerreQualifyingPositionLabel(story))}</strong><span>${escapeHtml(formatStoryLap(q.bestLapMs))}</span></article><article><small>PRACTICE</small><strong>${practice.run2?`P${practice.run2.position}`:'—'}</strong><span>${practice.diagnosis?.correct?'ROOT CAUSE IDENTIFIED':'CORRECTION APPLIED'}</span></article><article><small>TYRESE</small><strong>${q.tyresePosition?`P${q.tyresePosition}`:'—'}</strong><span>${q.position&&q.tyresePosition&&q.position<q.tyresePosition?'OUTQUALIFIED CAPTAIN':'TEAMMATE BENCHMARK'}</span></article><article><small>CAREER STATUS</small><strong>${escapeHtml(evo.fameTier)}</strong><span>${escapeHtml(evo.playerStyle)}</span></article></div><div class="practice-next-card"><small>NEXT</small><strong>RACE DAY · THE LUMERRE CROWN</strong><span>Full live gaps, overtaking, defending, stamina and team orders arrive with the race.</span></div><div class="practice-complete-actions"><button type="button" data-start-lumerre-race>${raceAction}</button><button type="button" class="is-secondary" data-practice-complete-back>RETURN TO STORY JOURNEY</button></div></section>`;
    root.querySelector('[data-start-lumerre-race]')?.addEventListener('click',()=>{void startLumerreRaceDay();});
    root.querySelector('[data-practice-complete-back]')?.addEventListener('click',()=>{state.mode='story-journey';render();syncMusic({restart:true});});
  }


  function crownStageShell(scene, sceneIndex, body, extraClass = '') {
    const count = QUICKQUILL_CROWN_WEEK_SCENES.length;
    return `<section class="story-shell tone-${escapeHtml(scene.tone||'crown-day')} crown-story-shell" aria-label="${escapeHtml(scene.number)} ${escapeHtml(scene.title)}">
      <img class="story-backdrop" src="${scene.background}" alt="" aria-hidden="true">
      <div class="story-stage crown-stage ${extraClass}">
        <img class="story-environment" src="${scene.background}" alt="${escapeHtml(scene.title)}">
        <div class="crown-stage-wash" aria-hidden="true"></div><div class="story-grain" aria-hidden="true"></div><div class="story-letterbox" aria-hidden="true"></div>
        <header class="story-header crown-story-header"><div><small>QUICKQUILL: AGAINST THE ODDS</small><strong>${escapeHtml(scene.number)} · ${escapeHtml(scene.title)}</strong><span>${escapeHtml(scene.location)}</span></div><button type="button" data-story-home>BACK TO HUB</button></header>
        <div class="story-scene-counter crown-progress" aria-hidden="true"><i style="--story-progress:${((sceneIndex+1)/count)*100}%"></i><span>CROWN WEEK ${sceneIndex+1} / ${count}</span></div>
        ${body}
      </div><div class="story-screen-vignette" aria-hidden="true"></div>
    </section><div class="blackout ${state.blackout?'is-visible':''}" aria-hidden="true"></div>`;
  }

  function bindCrownBack() {
    bindCrownWeekBackgroundFallback(activeStoryScene());
    root.querySelector('[data-story-home]')?.addEventListener('click', event => { event.stopPropagation(); clearCrownChallengeTimers(); returnToHubFromStory(); });
  }

  function crownEncounterPosition(id, index = 0) {
    const map = {
      tyrese:[18,31],jalen:[71,24],sofia:[57,17],nell:[35,61],luka:[29,74],ren:[53,36],maya:[81,56],media:[56,72],fan:[45,48]
    };
    return map[id] || [25 + (index%4)*18, 28 + Math.floor(index/4)*34];
  }

  function crownEncounterModal(encounter, selectedIndex = -1) {
    if (!encounter) return '';
    return `<div class="crown-modal-layer" role="dialog" aria-modal="true" aria-label="${escapeHtml(encounter.title)}">
      <section class="crown-encounter-modal">
        ${portraitMarkup({character:encounter.character,frame:encounter.frame,side:'left'})}
        <button type="button" class="crown-modal-close" data-crown-modal-close aria-label="Close">×</button>
        <div class="crown-modal-copy"><small>${escapeHtml(encounter.location || 'CROWN VILLAGE')}</small><h2>${escapeHtml(encounter.title)}</h2><p>${escapeHtml(encounter.text)}</p>
          <div class="crown-modal-options">${encounter.options.map((option,index)=>`<button type="button" data-crown-encounter-choice="${index}"><b>${String.fromCharCode(65+index)}</b><span><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.note)}</small></span></button>`).join('')}</div>
        </div>
      </section>
    </div>`;
  }

  function renderCrownVillage(scene, beat, sceneIndex) {
    const cw = crownWeekState();
    const village = cw.village || defaultQuickquillStory().chapter6.crownWeek.village;
    const director = crownVillageEncounterDirector(state.story);
    const completed = village.encounters || [];
    const messages = crownVillageMessages(state.story);
    const rumour = crownRumourForStory(state.story);
    const selected = state.crownEncounterId ? CROWN_VILLAGE_ENCOUNTERS[state.crownEncounterId] : null;
    const visitsNeeded = Math.max(0, 3 - completed.length);
    const encounterButtons = director.map((id,index) => {
      const item=CROWN_VILLAGE_ENCOUNTERS[id]; if(!item) return '';
      const [x,y]=crownEncounterPosition(id,index), done=completed.includes(id);
      return `<button type="button" class="crown-map-pin ${done?'is-complete':''}" data-crown-encounter="${id}" style="--pin-x:${x}%;--pin-y:${y}%"><i>${done?'✓':'◆'}</i><span><small>${escapeHtml(item.location)}</small><strong>${escapeHtml(item.title)}</strong></span></button>`;
    }).join('');
    const unread=messages.filter(m=>!village.inboxRead?.includes(m.id)).length;
    const body=`<section class="crown-village-ui" aria-live="polite">
      <header class="crown-week-dashboard"><div><small>CROWN WEEK · OPEN SCHEDULE</small><h1>THE CROWN VILLAGE</h1><p>Spend the afternoon where you want. Three meaningful encounters move the schedule forward; everything else is optional.</p></div><div class="crown-clock"><small>NEXT FIXED EVENT</small><strong>15:00</strong><span>CROWN PARADE</span></div></header>
      <div class="crown-village-map"><div class="crown-map-shade"></div>${encounterButtons}<div class="crown-map-avatar">${downtimeDragonMarkup(0,'is-crown-map-dragon')}<span>${escapeHtml(storyDragonName())}</span></div></div>
      <aside class="crown-village-side">
        <section class="crown-schedule-card"><small>TODAY</small><span class="is-done"><b>10:00</b>ARRIVAL</span><span class="is-live"><b>11:30</b>CROWN VILLAGE</span><span><b>15:00</b>PUBLIC PARADE</span><span><b>17:30</b>CROWN CHALLENGE</span><span><b>20:00</b>GARDEN RECEPTION</span></section>
        <section class="crown-inbox-card"><header><small>RACING INBOX</small><b>${unread} NEW</b></header>${messages.map(msg=>`<button type="button" class="${village.inboxRead?.includes(msg.id)?'is-read':''}" data-crown-message="${msg.id}"><span>${escapeHtml(msg.from)} <i>${escapeHtml(msg.time)}</i></span><p>${escapeHtml(msg.text)}</p></button>`).join('')}</section>
        ${completed.length>=2?`<section class="crown-rumour-card ${village.rumourSeen?'is-open':''}"><small>${escapeHtml(rumour.label)} · UNVERIFIED</small>${village.rumourSeen?`<p>${escapeHtml(rumour.text)}</p>`:`<button type="button" data-crown-rumour>OPEN PADDOCK RUMOUR</button>`}</section>`:''}
      </aside>
      <footer class="crown-village-footer"><div><small>AFTERNOON MEMORY</small><strong>${completed.length} / 3 REQUIRED ENCOUNTERS</strong><span>${visitsNeeded?`${visitsNeeded} more before the parade`:'Schedule clear — leave when ready'}</span></div><button type="button" data-crown-village-finish ${completed.length<3?'disabled':''}>HEAD TO THE CROWN PARADE <i>›</i></button></footer>
      ${state.crownTransient?`<div class="crown-toast">${escapeHtml(state.crownTransient)}</div>`:''}
      ${selected?crownEncounterModal(selected):''}
      ${state.storyError?`<div class="story-error crown-error" role="alert">${escapeHtml(state.storyError)}</div>`:''}
    </section>`;
    root.innerHTML=crownStageShell(scene,sceneIndex,body,'is-crown-village'); bindCrownBack();
    root.querySelectorAll('[data-crown-encounter]').forEach(button=>button.addEventListener('click',()=>{const id=String(button.dataset.crownEncounter||'');if(completed.includes(id)){state.crownTransient='You already had this conversation.';render();return;}state.crownEncounterId=id;playTone(285);render();}));
    root.querySelector('[data-crown-modal-close]')?.addEventListener('click',()=>{state.crownEncounterId='';render();});
    root.querySelectorAll('[data-crown-encounter-choice]').forEach(button=>button.addEventListener('click',()=>void chooseCrownVillageEncounter(Number(button.dataset.crownEncounterChoice))));
    root.querySelectorAll('[data-crown-message]').forEach(button=>button.addEventListener('click',()=>void readCrownMessage(String(button.dataset.crownMessage||''))));
    root.querySelector('[data-crown-rumour]')?.addEventListener('click',()=>void revealCrownRumour());
    root.querySelector('[data-crown-village-finish]')?.addEventListener('click',()=>void finishCrownVillage());
  }

  async function chooseCrownVillageEncounter(optionIndex) {
    if (state.storySaving || state.transitionLocked) return;
    const id=state.crownEncounterId, encounter=CROWN_VILLAGE_ENCOUNTERS[id], option=encounter?.options?.[optionIndex];
    if(!encounter||!option)return;
    const changed=cloneValue(state.story), village=changed.chapter6.crownWeek.village;
    if(village.encounters.includes(id))return;
    applyStoryEffects(changed,option.effects||{}); applyCareerEvolutionEffects(changed,option.careerEffects||{});
    village.encounters=[...village.encounters,id].slice(0,8); village.encounterChoices={...village.encounterChoices,[id]:option.label};
    if(id==='fan')playCrownSfx('autograph'); else if(id==='media')playCrownSfx('camera');
    changed.history=[...(changed.history||[]),{scene:'q41',event:'crown-village-encounter',encounter:id,choice:optionIndex}].slice(-100);
    state.story=changed; state.crownEncounterId=''; state.crownTransient=`${encounter.title} · recorded`;
    render();
    try{await persistStory(changed,{stageOverride:'quickquill-crown-week'});}catch(error){state.storyError=error?.message||'Crown Village choice could not be saved.';render();}
    window.setTimeout(()=>{if(state.mode==='story'&&state.story?.scene==='q41'){state.crownTransient='';render();}},1800);
  }

  async function readCrownMessage(id) {
    if(state.storySaving)return; const changed=cloneValue(state.story),village=changed.chapter6.crownWeek.village;
    if(!village.inboxRead.includes(id)){village.inboxRead=[...village.inboxRead,id].slice(0,12);playCrownSfx('inbox');state.story=changed;render();try{await persistStory(changed,{stageOverride:'quickquill-crown-week'});}catch(_){}}
  }

  async function revealCrownRumour() {
    if (state.storySaving) return;
    const changed = cloneValue(state.story);
    const village = changed.chapter6.crownWeek.village;
    const rumour = crownRumourForStory(changed);
    village.rumourId = rumour.id;
    village.rumourSeen = true;
    changed.history = [...(changed.history || []), { scene:'q41', event:'paddock-rumour', rumour:rumour.id }].slice(-100);
    playCrownSfx('rumour');
    state.story = changed;
    render();
    try { await persistStory(changed, { stageOverride:'quickquill-crown-week' }); } catch (_) {}
  }

  async function finishCrownVillage() {
    if(state.storySaving||state.transitionLocked)return;const changed=cloneValue(state.story),village=changed.chapter6.crownWeek.village;if((village.encounters||[]).length<3)return;
    village.completed=true;const next=nextStoryPointer(changed);state.crownEncounterId='';await saveStoryProgress(next.story,{transition:true});syncMusic({restart:true});
  }

  function crownChallengeScoreboard(story=state.story) {
    const challenge=crownWeekState(story).challenge||{},standings=crownChallengeStandings(story),points=challenge.playerPoints||{};
    return `<aside class="crown-challenge-score"><header><small>LIVE CROWN CHALLENGE</small><strong>${['reaction','slalom','climb','sprint'].reduce((sum,k)=>sum+(Number(points[k])||0),0)} PTS</strong></header>${standings.map(row=>`<span class="${row.id==='player'?'is-player':''}"><b>${String(row.rank).padStart(2,'0')}</b><i>${escapeHtml(row.name)}</i><strong>${row.points}</strong></span>`).join('')}</aside>`;
  }

  function crownChallengeEventHeader(stage, title, subtitle) {
    const label = stage >= 4 ? 'FINAL STANDINGS' : `EVENT ${stage+1} / 4`;
    return `<header class="crown-challenge-event-head"><div><small>${label}</small><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div><span>CROWN CHALLENGE</span></header>`;
  }

  function renderCrownChallenge(scene, beat, sceneIndex) {
    const cw=crownWeekState(),challenge=cw.challenge||defaultQuickquillStory().chapter6.crownWeek.challenge,stage=Math.max(0,Math.min(4,Number(challenge.stage)||0));
    let eventBody='';
    if(stage===0){
      const result=challenge.reaction;
      eventBody=result?`${crownChallengeEventHeader(0,'REACTION GATE','One launch. No restart.')}<section class="crown-reaction-result"><small>OFFICIAL REACTION</small><strong>${result.falseStart?'FALSE START':`${Math.round(result.ms)} ms`}</strong><span>${result.points} POINTS</span><p>${escapeHtml(result.note)}</p><button type="button" data-crown-challenge-next>NEXT EVENT <i>›</i></button></section>`:
      `${crownChallengeEventHeader(0,'REACTION GATE','Arm the start, wait for green, then launch. Jump it and the result stands.')}<section class="crown-reaction-game"><div class="crown-reaction-lights" data-crown-reaction-lights><i></i><i></i><i></i><i></i></div><button type="button" class="crown-launch-button" data-crown-reaction-arm>ARM START</button><p data-crown-reaction-status>The clock is yours when you arm it.</p></section>`;
    } else if(stage===1){
      const slalom=challenge.slalom,sequence=['L','R','R','L','R','L'];
      if(slalom?.completed){eventBody=`${crownChallengeEventHeader(1,'PRECISION SLALOM','Six gates. Wrong side means a penalty.')}<section class="crown-slalom-result"><small>OFFICIAL TIME</small><strong>${(Number(slalom.totalMs)/1000).toFixed(3)}s</strong><span>${slalom.points} POINTS · ${slalom.misses} PENALT${slalom.misses===1?'Y':'IES'}</span><button type="button" data-crown-challenge-next>NEXT EVENT <i>›</i></button></section>`;}
      else {const idx=Math.max(0,Number(slalom?.index)||0),hits=Number(slalom?.hits)||0,misses=Number(slalom?.misses)||0;eventBody=`${crownChallengeEventHeader(1,'PRECISION SLALOM','Read the gate call and commit left or right.')}<section class="crown-slalom-game"><div class="crown-gate-run">${sequence.map((dir,i)=>`<i class="${i<idx?(slalom?.inputs?.[i]===dir?'is-hit':'is-miss'):i===idx?'is-live':''}">${i<idx?(slalom?.inputs?.[i]===dir?'✓':'×'):i===idx?'◆':'·'}</i>`).join('')}</div><div class="crown-gate-call"><small>GATE ${idx+1} / ${sequence.length}</small><strong>${sequence[idx]==='L'?'LEFT':'RIGHT'}</strong><span>${hits} CLEAN · ${misses} PENALTIES</span></div><div class="crown-slalom-controls"><button type="button" data-crown-slalom="L">← LEFT GATE</button><button type="button" data-crown-slalom="R">RIGHT GATE →</button></div></section>`;}
    } else if(stage===2){
      const climb=challenge.climb||{},segment=Math.max(0,Number(climb.segment)||0),stamina=Math.max(0,Math.min(100,Number(climb.stamina??100))),choices=Array.isArray(climb.choices)?climb.choices:[];
      if(climb.completed){eventBody=`${crownChallengeEventHeader(2,'TERRACE CLIMB','Three sectors. Pace has a cost.')}<section class="crown-climb-result"><small>OFFICIAL TIME</small><strong>${(Number(climb.totalMs)/1000).toFixed(3)}s</strong><span>${climb.points} POINTS · ${Math.round(climb.stamina)} ENERGY LEFT</span><button type="button" data-crown-challenge-next>NEXT EVENT <i>›</i></button></section>`;}
      else eventBody=`${crownChallengeEventHeader(2,'TERRACE CLIMB','Three uphill sectors. Decide how much of the dragon you spend now.')}<section class="crown-climb-game"><div class="crown-climb-telemetry"><span><small>SECTOR</small><strong>${segment+1} / 3</strong></span><span><small>ENERGY</small><strong>${Math.round(stamina)}%</strong></span><span><small>ELAPSED</small><strong>${((Number(climb.totalMs)||0)/1000).toFixed(1)}s</strong></span></div><div class="crown-energy-bar"><i style="width:${stamina}%"></i></div><div class="crown-climb-controls"><button type="button" data-crown-climb="push"><b>PUSH</b><span>Fastest · high energy cost</span></button><button type="button" data-crown-climb="hold"><b>HOLD PACE</b><span>Controlled · moderate cost</span></button><button type="button" data-crown-climb="recover"><b>RECOVER</b><span>Slowest · restore energy</span></button></div><div class="crown-climb-history">${choices.map((c,i)=>`<span>S${i+1} · ${escapeHtml(String(c).toUpperCase())}</span>`).join('')}</div></section>`;
    } else if(stage===3){
      const sprint=challenge.sprint||{},opponentId=sprint.opponentId||crownChallengeOpponentId(state.story),opponent=CAREER_RACER_AI[opponentId]||CAREER_RACER_AI.ren,gap=Math.max(.05,Number(sprint.gap??.38)),round=Math.max(0,Number(sprint.round)||0),stamina=Math.max(0,Math.min(100,Number(sprint.stamina??100)));
      if(sprint.completed){eventBody=`${crownChallengeEventHeader(3,'HEAD-TO-HEAD SPRINT','The first live battle test of Career Evolution.')}<section class="crown-sprint-result"><small>${escapeHtml(opponent.name)} · HEAD TO HEAD</small><strong>${sprint.won?'PASS COMPLETE':sprint.close?'PHOTO-LINE LOSS':'OPPONENT HOLDS'}</strong><span>${sprint.points} POINTS</span><p>${escapeHtml(sprint.summary||'The result is recorded.')}</p><button type="button" data-crown-challenge-next>FINAL STANDINGS <i>›</i></button></section>`;}
      else eventBody=`${crownChallengeEventHeader(3,'HEAD-TO-HEAD SPRINT','Close the gap and choose the move. This battle uses the V34.26 racecraft resolver.')}<section class="crown-sprint-game"><div class="crown-head-to-head"><span><small>PLAYER</small><strong>${escapeHtml(storyDragonName())}</strong></span><b>VS</b><span><small>${escapeHtml(opponent.team)}</small><strong>${escapeHtml(opponent.name)}</strong></span></div><div class="crown-gap-display"><small>${round?`ATTACK WINDOW · ROUND ${round+1}`:'STARTING GAP'}</small><strong>${gap.toFixed(2)}s</strong><span>ENERGY ${Math.round(stamina)}%</span></div>${sprint.lastNarrative?`<p class="crown-battle-commentary">${escapeHtml(sprint.lastNarrative)}</p>`:''}<div class="crown-battle-controls"><button type="button" data-crown-sprint="attack-inside"><b>ATTACK INSIDE</b><span>High commitment</span></button><button type="button" data-crown-sprint="pressure-exit"><b>PRESSURE EXIT</b><span>Set up the next sector</span></button><button type="button" data-crown-sprint="use-slipstream"><b>USE SLIPSTREAM</b><span>Build the straight-line move</span></button><button type="button" data-crown-sprint="stay-patient"><b>STAY PATIENT</b><span>Save energy, wait for a better opening</span></button></div></section>`;
    } else {
      const standings=challenge.standings?.length?challenge.standings:crownChallengeStandings(state.story),player=standings.find(row=>row.id==='player')||{rank:7,points:challenge.totalPoints||0};
      eventBody=`${crownChallengeEventHeader(4,'CROWN CHALLENGE — FINAL','Four disciplines. One public first impression.')}<section class="crown-challenge-final"><div class="crown-final-rank"><small>FINAL POSITION</small><strong>${ordinal(player.rank)}</strong><span>${player.points} TOTAL POINTS</span></div><div class="crown-final-board">${standings.map(row=>`<span class="${row.id==='player'?'is-player':''}"><b>${row.rank}</b><i>${escapeHtml(row.name)}</i><strong>${row.points}</strong></span>`).join('')}</div><p>${player.rank===1?'Crown Week has a new headline. The rookie just won the ceremonial Challenge.':player.rank<=3?'The paddock expected promise. A Crown Challenge podium looks much more like evidence.':'The Challenge does not decide the race weekend. It does decide who the cameras follow into it.'}</p><button type="button" data-crown-challenge-finish>CONTINUE TO GARDEN RECEPTION <i>›</i></button></section>`;
    }
    const body=`<section class="crown-challenge-ui" aria-live="polite"><div class="crown-challenge-main">${eventBody}</div>${crownChallengeScoreboard(state.story)}${state.storyError?`<div class="story-error crown-error" role="alert">${escapeHtml(state.storyError)}</div>`:''}</section>`;
    root.innerHTML=crownStageShell(scene,sceneIndex,body,'is-crown-challenge');bindCrownBack();
    root.querySelector('[data-crown-reaction-arm]')?.addEventListener('click',()=>beginCrownReaction());
    root.querySelectorAll('[data-crown-slalom]').forEach(button=>button.addEventListener('click',()=>void crownSlalomInput(String(button.dataset.crownSlalom||''))));
    root.querySelectorAll('[data-crown-climb]').forEach(button=>button.addEventListener('click',()=>void crownClimbChoice(String(button.dataset.crownClimb||''))));
    root.querySelectorAll('[data-crown-sprint]').forEach(button=>button.addEventListener('click',()=>void crownSprintChoice(String(button.dataset.crownSprint||''))));
    root.querySelector('[data-crown-challenge-next]')?.addEventListener('click',()=>void advanceCrownChallengeEvent());
    root.querySelector('[data-crown-challenge-finish]')?.addEventListener('click',()=>void finishCrownChallenge());
  }

  function beginCrownReaction() {
    if(state.crownChallengeLive||state.storySaving)return;clearCrownChallengeTimers();
    const button=root.querySelector('[data-crown-reaction-arm]'),lights=root.querySelector('[data-crown-reaction-lights]'),status=root.querySelector('[data-crown-reaction-status]');if(!button||!lights)return;
    state.crownChallengeLive={phase:'reaction',goAt:0};button.textContent='LAUNCH';button.classList.add('is-live');if(status)status.textContent='Wait for green. Jump it and the false start stands.';playCrownSfx('beep');
    [650,1350,2050].forEach((delayMs,index)=>crownChallengeTimers.push(window.setTimeout(()=>lights.classList.add(`step-${index+1}`),delayMs)));
    const goDelay=3000+Math.round(Math.random()*500);
    crownChallengeTimers.push(window.setTimeout(()=>{if(!state.crownChallengeLive)return;lights.classList.add('is-green');state.crownChallengeLive.goAt=performance.now();if(status)status.textContent='GO';playCrownSfx('go');},goDelay));
    button.onclick=()=>void completeCrownReaction();
  }

  async function completeCrownReaction() {
    const live=state.crownChallengeLive;if(!live||state.storySaving)return;const falseStart=!live.goAt,ms=falseStart?0:Math.max(1,performance.now()-live.goAt);clearCrownChallengeTimers();
    let points=2,note='The start was jumped. Lumerre records it anyway.';
    if(!falseStart){const starts=Number(syncCareerEvolution(state.story).racecraft.starts)||40;points=ms<210?10:ms<270?9:ms<340?8:ms<430?7:ms<560?6:5;if(starts>=55&&points<10)points+=1;note=ms<270?'Elite reaction. The crowd notices immediately.':ms<430?'Clean professional launch.':'Safe, legal, a little time left on the table.';}
    const changed=cloneValue(state.story);changed.chapter6.crownWeek.challenge.started=true;changed.chapter6.crownWeek.challenge.reaction={falseStart,ms,points,note};changed.chapter6.crownWeek.challenge.playerPoints.reaction=points;changed.history=[...(changed.history||[]),{scene:'q43',event:'crown-reaction',ms:falseStart?null:Math.round(ms),falseStart,points}].slice(-100);state.story=changed;falseStart?playCrownSfx('falseStart'):playCrownSfx(points>=9?'personalBest':'checkpoint');render();try{await persistStory(changed,{stageOverride:'quickquill-crown-week'});}catch(error){state.storyError=error?.message||'Reaction result could not be saved.';render();}
  }

  async function crownSlalomInput(direction) {
    if(state.storySaving)return;const sequence=['L','R','R','L','R','L'],changed=cloneValue(state.story),challenge=changed.chapter6.crownWeek.challenge,current=challenge.slalom&&typeof challenge.slalom==='object'?{...challenge.slalom}:{index:0,hits:0,misses:0,inputs:[],startedAt:Date.now()};if(current.completed)return;
    const idx=Math.max(0,Number(current.index)||0);if(idx>=sequence.length)return;current.inputs=[...(current.inputs||[]),direction];if(direction===sequence[idx]){current.hits=(Number(current.hits)||0)+1;playCrownSfx('checkpoint');}else{current.misses=(Number(current.misses)||0)+1;playCrownSfx('miss');}current.index=idx+1;
    if(current.index>=sequence.length){const rawMs=Math.max(4200,Date.now()-(Number(current.startedAt)||Date.now()));const tech=Number(syncCareerEvolution(changed).racecraft.technicalUnderstanding)||45;const penalties=(Number(current.misses)||0)*2000;const skillCredit=Math.max(0,tech-45)*22;current.totalMs=Math.max(4000,rawMs+penalties-skillCredit);current.points=Math.max(3,Math.min(10,10-(Number(current.misses)||0)*2-(current.totalMs>11500?2:current.totalMs>9000?1:0)));current.completed=true;challenge.playerPoints.slalom=current.points;challenge.slalom=current;changed.history=[...(changed.history||[]),{scene:'q43',event:'crown-slalom',misses:current.misses,totalMs:Math.round(current.totalMs),points:current.points}].slice(-100);playCrownSfx(current.points>=9?'personalBest':'split');}
    challenge.slalom=current;state.story=changed;render();if(current.completed){try{await persistStory(changed,{stageOverride:'quickquill-crown-week'});}catch(error){state.storyError=error?.message||'Slalom result could not be saved.';render();}}
  }

  async function crownClimbChoice(choice) {
    if(state.storySaving)return;const changed=cloneValue(state.story),challenge=changed.chapter6.crownWeek.challenge,climb=challenge.climb&&typeof challenge.climb==='object'?{...challenge.climb}:{segment:0,stamina:100,totalMs:0,choices:[]};if(climb.completed)return;
    const evo=syncCareerEvolution(changed),skill=Number(evo.racecraft.staminaManagement)||45,segment=Math.max(0,Number(climb.segment)||0);let stamina=Math.max(0,Math.min(100,Number(climb.stamina??100))),ms=25000;
    if(choice==='push'){ms=22000-Math.max(0,skill-45)*55;stamina-=26;if(stamina<25&&Math.random()<.34){ms+=3800;state.crownTransient='The final metres bite back.';}}
    else if(choice==='recover'){ms=28200-Math.max(0,skill-45)*25;stamina+=18;}
    else {ms=24800-Math.max(0,skill-45)*38;stamina-=12;choice='hold';}
    climb.totalMs=(Number(climb.totalMs)||0)+Math.max(18000,ms);climb.stamina=Math.max(0,Math.min(100,stamina));climb.choices=[...(climb.choices||[]),choice];climb.segment=segment+1;playCrownSfx('split');
    if(climb.segment>=3){const total=climb.totalMs;climb.points=total<69000?10:total<73000?9:total<78000?8:total<84000?7:6;if(climb.stamina<15)climb.points=Math.max(5,climb.points-1);climb.completed=true;challenge.playerPoints.climb=climb.points;changed.history=[...(changed.history||[]),{scene:'q43',event:'crown-climb',totalMs:Math.round(total),stamina:Math.round(climb.stamina),points:climb.points,choices:climb.choices.slice()}].slice(-100);playCrownSfx(climb.points>=9?'personalBest':'checkpoint');}
    challenge.climb=climb;state.story=changed;render();try{await persistStory(changed,{stageOverride:'quickquill-crown-week'});}catch(error){state.storyError=error?.message||'Terrace Climb progress could not be saved.';render();}
  }

  function recordCrownSprintBattle(story,battle) {
    const evolution=syncCareerEvolution(story),id=battle.opponentId,entry=evolution.rivalries?.[id];if(entry){entry.battles+=1;entry.intensity=clampCareerValue(entry.intensity+2);entry.respect=clampCareerValue(entry.respect+1);entry.lastEvent='Lumerre Crown Challenge';if(battle.outcome==='overtake')entry.playerPassedThem+=1;}
    if(id==='tyrese'){evolution.tyrese.competitiveTension=clampCareerValue(evolution.tyrese.competitiveTension+(battle.outcome==='overtake'?4:2));evolution.tyrese.professionalRespect=clampCareerValue(evolution.tyrese.professionalRespect+2);}story.careerEvolution=evolution;
  }

  async function crownSprintChoice(choice) {
    if(state.storySaving)return;const changed=cloneValue(state.story),challenge=changed.chapter6.crownWeek.challenge;let sprint=challenge.sprint&&typeof challenge.sprint==='object'?{...challenge.sprint}:{opponentId:crownChallengeOpponentId(changed),gap:.38,stamina:100,round:0,events:[]};if(sprint.completed)return;
    const battle=resolveCareerAttackBattle(changed,sprint.opponentId,choice,{gapSeconds:sprint.gap,stamina:sprint.stamina,sectorType:(Number(sprint.round)||0)%2?'technical':'fast'});recordCrownSprintBattle(changed,battle);sprint.events=[...(sprint.events||[]),battle.event].slice(-6);sprint.stamina=Math.max(0,Math.min(100,(Number(sprint.stamina)||100)+(Number(battle.staminaDelta)||0)));sprint.lastNarrative=battle.narrative;sprint.round=(Number(sprint.round)||0)+1;
    if(battle.outcome==='overtake'){sprint.completed=true;sprint.won=true;sprint.close=false;sprint.points=10;sprint.gap=-.05;sprint.summary=`${storyDragonName()} completes the pass on ${battle.opponentName}. The first live Crown Week battle belongs to Quickquill.`;playCrownSfx('newLeader');}
    else {const follow=(Number(battle.followUpBonus)||0)*.012;sprint.gap=Math.max(.08,Math.min(.9,(Number(sprint.gap)||.38)+(Number(battle.timeDelta)||0)-follow+(battle.outcome==='failed'?.02:0)));if(sprint.round>=3){sprint.completed=true;sprint.won=false;sprint.close=sprint.gap<=.30;sprint.points=sprint.close?8:battle.outcome==='mistake'?5:6;sprint.summary=sprint.close?`${battle.opponentName} holds the line by ${sprint.gap.toFixed(2)}s. It is close enough to become a future problem.`:`${battle.opponentName} keeps the place. The battle still becomes part of the paddock memory.`;playCrownSfx(sprint.close?'personalBest':'complete');}else playCrownSfx('checkpoint');}
    if(sprint.completed){challenge.playerPoints.sprint=sprint.points;changed.history=[...(changed.history||[]),{scene:'q43',event:'crown-head-to-head',opponent:sprint.opponentId,won:!!sprint.won,points:sprint.points,events:sprint.events.slice(-4)}].slice(-100);}challenge.sprint=sprint;state.story=changed;render();try{await persistStory(changed,{stageOverride:'quickquill-crown-week'});}catch(error){state.storyError=error?.message||'Head-to-head result could not be saved.';render();}
  }

  async function advanceCrownChallengeEvent() {
    if(state.storySaving||state.transitionLocked)return;const changed=cloneValue(state.story),challenge=changed.chapter6.crownWeek.challenge,stage=Math.max(0,Number(challenge.stage)||0);const ready=stage===0?!!challenge.reaction:stage===1?!!challenge.slalom?.completed:stage===2?!!challenge.climb?.completed:stage===3?!!challenge.sprint?.completed:false;if(!ready)return;
    challenge.stage=Math.min(4,stage+1);
    if(challenge.stage===4&&!challenge.completed){const standings=crownChallengeStandings(changed,challenge.playerPoints);const player=standings.find(row=>row.id==='player')||{rank:7,points:0};challenge.standings=standings;challenge.totalPoints=player.points;challenge.rank=player.rank;challenge.completed=true;const fameGain=player.rank===1?6:player.rank<=3?4:2,respectGain=player.rank===1?4:player.rank<=3?3:1;applyCareerEvolutionEffects(changed,{reputation:{fame:fameGain,paddockRespect:respectGain,pressure:player.rank<=3?2:0}});changed.history=[...(changed.history||[]),{scene:'q43',event:'crown-challenge-complete',rank:player.rank,points:player.points}].slice(-100);playCrownSfx(player.rank===1?'newLeader':'complete');}
    state.story=changed;render();try{await persistStory(changed,{stageOverride:'quickquill-crown-week'});}catch(error){state.storyError=error?.message||'Crown Challenge progress could not be saved.';render();}
  }

  async function finishCrownChallenge() {
    if(state.storySaving||state.transitionLocked)return;const changed=cloneValue(state.story);if(!changed.chapter6.crownWeek.challenge.completed)return;const next=nextStoryPointer(changed);clearCrownChallengeTimers();await saveStoryProgress(next.story,{transition:true});syncMusic({restart:true});
  }

  function crownReceptionModal(item) {
    if(!item)return'';return `<div class="crown-modal-layer" role="dialog" aria-modal="true"><section class="crown-encounter-modal is-reception">${portraitMarkup({character:item.character,frame:item.frame,side:'left'})}<button type="button" class="crown-modal-close" data-crown-reception-close>×</button><div class="crown-modal-copy"><small>LUMERRE CROWN RECEPTION</small><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.text)}</p><div class="crown-modal-options">${item.options.map((option,index)=>`<button type="button" data-crown-reception-choice="${index}"><b>${String.fromCharCode(65+index)}</b><span><strong>${escapeHtml(option.label)}</strong><small>${escapeHtml(option.note)}</small></span></button>`).join('')}</div></div></section></div>`;
  }

  function renderCrownOverlook(scene,sceneIndex) {
    const cw=crownWeekState(),reception=cw.reception||{},evo=syncCareerEvolution(state.story),tension=Number(evo.tyrese?.competitiveTension)||0;
    const body=`<section class="crown-overlook-ui"><div class="crown-overlook-copy"><small>OPTIONAL MOMENT · CIRCUIT OVERLOOK</small><h1>THE CROWD IS SOMEWHERE ELSE</h1><p>${tension>=14?'Tyrese is already at the rail. For the first time all day, neither of you has a camera pointed at you.':'Tyrese arrives a minute after you and leans against the rail without saying anything about the reception.'}</p><p>The illuminated Crown Circuit folds through the terraces below. Tomorrow it stops being scenery.</p>${reception.overlookSeen?`<div class="crown-overlook-recorded"><strong>MOMENT RECORDED</strong><span>${escapeHtml(reception.overlookChoice||'Private conversation')}</span><button type="button" data-crown-overlook-return>RETURN TO RECEPTION</button></div>`:`<div class="crown-overlook-options"><button type="button" data-crown-overlook-choice="0"><strong>“This is getting serious, isn’t it?”</strong><span>Acknowledge what the paddock is starting to see.</span></button><button type="button" data-crown-overlook-choice="1"><strong>“Tomorrow we race the circuit, not the headlines.”</strong><span>Keep the relationship grounded in the work.</span></button></div>`}</div>${portraitMarkup({character:'crownTyrese',frame:tension>=14?9:5,side:'right'})}</section>`;
    root.innerHTML=crownStageShell({...scene,background:CROWN_WEEK_ENV+'circuit-overlook.webp',location:'Lumerre Crown Circuit overlook · 21:37'},sceneIndex,body,'is-crown-overlook');bindCrownBack();
    root.querySelectorAll('[data-crown-overlook-choice]').forEach(button=>button.addEventListener('click',()=>void chooseCrownOverlook(Number(button.dataset.crownOverlookChoice))));
    root.querySelector('[data-crown-overlook-return]')?.addEventListener('click',()=>{state.crownWeekView='';render();syncMusic({restart:true});});
  }

  function renderCrownReception(scene, beat, sceneIndex) {
    if(state.crownWeekView==='overlook'){renderCrownOverlook(scene,sceneIndex);return;}
    const reception=crownWeekState().reception||defaultQuickquillStory().chapter6.crownWeek.reception,director=crownReceptionDirector(state.story),completed=reception.conversations||[],selected=state.crownReceptionId?CROWN_RECEPTION_CONVERSATIONS[state.crownReceptionId]:null;
    const body=`<section class="crown-reception-ui" aria-live="polite"><header><div><small>CROWN GARDEN RECEPTION · 20:00</small><h1>OFF THE CLOCK. NOT OFF THE RECORD.</h1><p>Choose who to spend the evening with. Three conversations are enough to leave; the rest are optional and may change later relationships.</p></div><span>${completed.length} / 3 REQUIRED</span></header><div class="crown-reception-floor">${director.map((id,index)=>{const item=CROWN_RECEPTION_CONVERSATIONS[id],done=completed.includes(id);return `<button type="button" class="crown-social-node ${done?'is-complete':''} node-${index+1}" data-crown-reception="${id}"><i>${done?'✓':'◆'}</i><span><small>${escapeHtml(id.toUpperCase())}</small><strong>${escapeHtml(item?.title||id)}</strong></span></button>`;}).join('')}<div class="crown-reception-status"><small>CROWN CHALLENGE</small><strong>${crownChallengeRankLabel()}</strong><span>${escapeHtml(syncCareerEvolution(state.story).fameTier)}</span></div></div><aside class="crown-reception-ledger"><small>EVENING</small>${completed.map((id,index)=>`<span><b>0${index+1}</b>${escapeHtml(CROWN_RECEPTION_CONVERSATIONS[id]?.title||id)}</span>`).join('')}${Array.from({length:Math.max(0,3-completed.length)},(_,i)=>`<span class="is-empty"><b>0${completed.length+i+1}</b>OPEN</span>`).join('')}${reception.overlookUnlocked&&!reception.overlookSeen?`<button type="button" class="crown-side-gate" data-crown-overlook><small>A SIDE GATE IS OPEN</small><strong>CIRCUIT OVERLOOK</strong><span>No objective marker. No cameras.</span></button>`:reception.overlookSeen?`<div class="crown-side-gate is-found"><small>OPTIONAL MOMENT</small><strong>CIRCUIT OVERLOOK</strong><span>Discovered</span></div>`:''}</aside><footer><p>${completed.length>=3?'You can leave whenever you want.':'The night still has room for another conversation.'}</p><button type="button" data-crown-reception-finish ${completed.length<3?'disabled':''}>RETURN TO QUICKQUILL VILLA <i>›</i></button></footer>${selected?crownReceptionModal(selected):''}${state.storyError?`<div class="story-error crown-error" role="alert">${escapeHtml(state.storyError)}</div>`:''}</section>`;
    root.innerHTML=crownStageShell(scene,sceneIndex,body,'is-crown-reception');bindCrownBack();
    root.querySelectorAll('[data-crown-reception]').forEach(button=>button.addEventListener('click',()=>{const id=String(button.dataset.crownReception||'');if(completed.includes(id)){state.crownTransient='Conversation already recorded.';return;}state.crownReceptionId=id;render();}));
    root.querySelector('[data-crown-reception-close]')?.addEventListener('click',()=>{state.crownReceptionId='';render();});
    root.querySelectorAll('[data-crown-reception-choice]').forEach(button=>button.addEventListener('click',()=>void chooseCrownReception(Number(button.dataset.crownReceptionChoice))));
    root.querySelector('[data-crown-overlook]')?.addEventListener('click',()=>{state.crownWeekView='overlook';state.crownReceptionId='';render();syncMusic({restart:true});});
    root.querySelector('[data-crown-reception-finish]')?.addEventListener('click',()=>void finishCrownReception());
  }

  async function chooseCrownReception(optionIndex) {
    if(state.storySaving)return;const id=state.crownReceptionId,item=CROWN_RECEPTION_CONVERSATIONS[id],option=item?.options?.[optionIndex];if(!item||!option)return;const changed=cloneValue(state.story),rec=changed.chapter6.crownWeek.reception;if(rec.conversations.includes(id))return;
    applyStoryEffects(changed,option.effects||{});applyCareerEvolutionEffects(changed,option.careerEffects||{});rec.conversations=[...rec.conversations,id].slice(0,8);rec.choices={...rec.choices,[id]:option.label};if(rec.conversations.length>=2)rec.overlookUnlocked=true;changed.history=[...(changed.history||[]),{scene:'q44',event:'crown-reception-conversation',person:id,choice:optionIndex}].slice(-100);state.story=changed;state.crownReceptionId='';render();try{await persistStory(changed,{stageOverride:'quickquill-crown-week'});}catch(error){state.storyError=error?.message||'Reception choice could not be saved.';render();}
  }

  async function chooseCrownOverlook(optionIndex) {
    if(state.storySaving)return;const changed=cloneValue(state.story),rec=changed.chapter6.crownWeek.reception;if(rec.overlookSeen)return;const options=[{label:'This is getting serious.',effects:{relationships:{tyreseBond:2}},careerEffects:{tyrese:{friendship:2,professionalRespect:2,competitiveTension:2},racecraft:{pressureHandling:1}}},{label:'Race the circuit, not the headlines.',effects:{relationships:{tyreseBond:3},identity:{focus:1}},careerEffects:{tyrese:{friendship:3,professionalRespect:2,competitiveTension:-1},racecraft:{pressureHandling:1}}}],option=options[optionIndex]||options[1];applyStoryEffects(changed,option.effects||{});applyCareerEvolutionEffects(changed,option.careerEffects||{});rec.overlookSeen=true;rec.overlookChoice=option.label;changed.history=[...(changed.history||[]),{scene:'q44',event:'circuit-overlook',choice:optionIndex}].slice(-100);state.story=changed;render();try{await persistStory(changed,{stageOverride:'quickquill-crown-week'});}catch(error){state.storyError=error?.message||'Overlook moment could not be saved.';render();}
  }

  async function finishCrownReception() {
    if(state.storySaving||state.transitionLocked)return;const changed=cloneValue(state.story),rec=changed.chapter6.crownWeek.reception;if((rec.conversations||[]).length<3)return;rec.completed=true;state.crownWeekView='';state.crownReceptionId='';const next=nextStoryPointer(changed);await saveStoryProgress(next.story,{transition:true});syncMusic({restart:true});
  }

  function renderCrownWeekComplete() {
    const story=state.story||normaliseQuickquillStory(activeSaveState().story),cw=crownWeekState(story),challenge=cw.challenge||{},village=cw.village||{},reception=cw.reception||{},evo=syncCareerEvolution(story),standings=challenge.standings||[],player=standings.find(row=>row.id==='player');
    root.innerHTML=`<section class="crown-complete-shell"><img src="${CROWN_WEEK_ENV}circuit-overlook.webp" alt="" aria-hidden="true"><div class="crown-complete-shade"></div><header><small>CHAPTER SIX · CROWN WEEK</small><h1>DAY ONE: COMPLETE</h1><p>Lumerre already knows the name. Practice day decides what the circuit thinks of it.</p></header><div class="crown-complete-grid"><article><small>CROWN CHALLENGE</small><strong>${player?ordinal(player.rank):crownChallengeRankLabel(story)}</strong><span>${Number(challenge.totalPoints)||0} POINTS</span></article><article><small>PADDOCK STATUS</small><strong>${escapeHtml(evo.fameTier)}</strong><span>${escapeHtml(evo.playerStyle)}</span></article><article><small>OPEN SCHEDULE</small><strong>${(village.encounters||[]).length} ENCOUNTERS</strong><span>${village.rumourSeen?'1 PADDOCK RUMOUR HEARD':'RUMOURS LEFT ALONE'}</span></article><article><small>EVENING</small><strong>${(reception.conversations||[]).length} CONVERSATIONS</strong><span>${reception.overlookSeen?'CIRCUIT OVERLOOK DISCOVERED':'RECEPTION ONLY'}</span></article></div><div class="crown-next-card"><small>NEXT</small><strong>PRACTICE DAY · 06:15 GARAGE CALL</strong><span>Telemetry, setup development, diagnosis and three-run qualifying are ready.</span></div><div class="crown-complete-actions"><button type="button" data-start-lumerre-practice>BEGIN PRACTICE DAY</button><button type="button" class="is-secondary" data-crown-complete-back>STORY JOURNEY</button></div></section>`;
    root.querySelector('[data-start-lumerre-practice]')?.addEventListener('click',()=>{void startLumerrePracticeQualifying();});
    root.querySelector('[data-crown-complete-back]')?.addEventListener('click',()=>{state.mode='story-journey';render();syncMusic({restart:true});});
  }

  function afterFlagState(story = state.story) {
    const raw = story?.chapter6?.afterFlag || {};
    return { ...defaultQuickquillStory().chapter6.afterFlag, ...raw,
      parcFerme:{...defaultQuickquillStory().chapter6.afterFlag.parcFerme,...(raw.parcFerme||{}),visited:Array.isArray(raw.parcFerme?.visited)?raw.parcFerme.visited:[],choices:{...(raw.parcFerme?.choices||{})}},
      media:{...defaultQuickquillStory().chapter6.afterFlag.media,...(raw.media||{}),answers:Array.isArray(raw.media?.answers)?raw.media.answers:[]},
      room:{...defaultQuickquillStory().chapter6.afterFlag.room,...(raw.room||{}),inspected:Array.isArray(raw.room?.inspected)?raw.room.inspected:[]}
    };
  }

  function lumerreWeekendRecord(story = state.story) {
    const af=afterFlagState(story);
    if(af.weekendRecord)return af.weekendRecord;
    const rw=lumerreRaceDayState(story),q=practiceQualifyingState(story).qualifying||{},challenge=crownWeekState(story).challenge||{},result=rw.result||{};
    const standings=Array.isArray(result.standings)?result.standings.slice(0,7).map(row=>({...row})):[];
    const rankOf=id=>{const byId=standings.findIndex(row=>String(row.id||row.racerId||'').toLowerCase()===id);return byId>=0?byId+1:null;};
    return Object.freeze({
      qualifyingPosition:Math.max(1,Math.min(7,Number(q.position)||Number(rw.startPosition)||4)),
      raceStartPosition:Math.max(1,Math.min(7,Number(rw.startPosition)||Number(q.position)||4)),
      raceFinishPosition:Math.max(1,Math.min(7,Number(rw.finalPosition)||Number(result.rank)||7)),
      positionsGained:Math.max(0,Number(rw.positionsGained)||Number(result.positionsGained)||Math.max(0,(Number(rw.startPosition)||4)-(Number(rw.finalPosition)||7))),
      playerOvertakes:Math.max(0,Number(rw.playerOvertakes)||Number(result.overtakes)||0),
      tyreseFinish:Math.max(1,Math.min(7,Number(rw.tyreseFinish)||rankOf('tyrese')||7)),
      jalenFinish:Math.max(1,Math.min(7,Number(result.rivalRanks?.jalen)||rankOf('jalen')||7)),
      bestLapMs:Math.max(0,Number(rw.bestLapMs)||Number(result.bestLapMs)||0),
      finishMs:Math.max(0,Number(rw.finishMs)||Number(result.finishMs)||0),
      teamOrderChoice:String(rw.teamOrder||result.teamOrder||'none').replace(/^order-/,''),
      fastestLap:!!result.fastestLap,
      photoFinish:!!result.photoFinish,
      leadChanges:Math.max(0,Number(result.leadChanges)||0),
      notableMoment:String(result.notableMoment||rw.highlight||rw.narrative||''),
      crownChallengeRank:Number(challenge.rank)||null,
      firstCareerWin:String(syncCareerEvolution(story).firsts?.firstWin?.event||syncCareerEvolution(story).firsts?.firstWin||'')==='Lumerre Crown',
      firstCareerPodium:String(syncCareerEvolution(story).firsts?.firstPodium?.event||syncCareerEvolution(story).firsts?.firstPodium||'')==='Lumerre Crown',
      standings
    });
  }

  function afterFlagImpactSnapshot(story=state.story){
    const evo=syncCareerEvolution(story);
    return {fame:Number(evo.reputation?.fame)||0,paddockRespect:Number(evo.reputation?.paddockRespect)||0,quickquillTrust:Number(evo.reputation?.quickquillTrust)||0,pressure:Number(evo.reputation?.pressure)||0,tyreseRespect:Number(evo.tyrese?.professionalRespect)||0,tyreseTension:Number(evo.tyrese?.competitiveTension)||0,tyreseFriendship:Number(evo.tyrese?.friendship)||0};
  }
  const afterFlagDelta=(before,after,key)=>Number(after?.[key]||0)-Number(before?.[key]||0);
  const deltaLabel=value=>value>0?`+${value}`:String(value||0);

  async function startLumerreAfterFlag(){
    if(!state.activeSave||state.storySaving)return;
    const changed=cloneValue(normaliseQuickquillStory(state.story||activeSaveState().story));
    if(!changed.completed?.raceWeekend)return;
    changed.chapter6={...defaultQuickquillStory().chapter6,...(changed.chapter6||{}),afterFlag:{...defaultQuickquillStory().chapter6.afterFlag,...(changed.chapter6?.afterFlag||{})}};
    const af=changed.chapter6.afterFlag;
    if(!af.weekendRecord)af.weekendRecord=cloneValue(lumerreWeekendRecord(changed));
    if(!af.impactBefore)af.impactBefore=afterFlagImpactSnapshot(changed);
    af.started=true;af.completed=false;
    changed.completed={...(changed.completed||{}),afterFlag:false};
    changed.chapter='lumerre-after-flag';changed.scene='q57';changed.beat=0;
    changed.history=[...(changed.history||[]),{scene:'q57',event:'lumerre-after-flag-start',finish:af.weekendRecord.raceFinishPosition}].slice(-120);
    state.story=changed;state.mode='story';state.afterFlagTransient='';state.afterFlagModal='';state.storyError='';
    await persistStory(changed,{stageOverride:'quickquill-lumerre-after-flag'});
    render();syncMusic({restart:true});
  }

  async function afterFlagGo(sceneId,{event='after-flag-advance'}={}){
    if(state.storySaving||state.transitionLocked)return;
    const changed=cloneValue(state.story),af=changed.chapter6.afterFlag;
    changed.chapter='lumerre-after-flag';changed.scene=sceneId;changed.beat=0;
    changed.history=[...(changed.history||[]),{scene:sceneId,event}].slice(-120);
    state.story=changed;state.afterFlagTransient='';state.afterFlagModal='';
    await persistStory(changed,{stageOverride:'quickquill-lumerre-after-flag'});
    render();syncMusic({restart:['q61','q62'].includes(sceneId)});
  }

  function afterFlagRadioLines(story,record){
    const player=storyDragonName();
    const finish=record.raceFinishPosition;
    const nell=finish===1?`${player}… P1. That's P1. You won the Lumerre Crown.`:finish<=3?`Podium. ${ordinal(finish)}. Clean it up on the cooldown lap and bring the dragon home.`:`P${finish}. Good race. There was more pace in that than the number will admit.`;
    const mara=finish===1?'Bring the dragon home. Celebrate after we have counted all the wings.':record.positionsGained>=2?`That was a professional recovery. Remember the decisions, not just the position.`:'No speeches on the radio. Get home safely.';
    let tyrese='Nice work. I will pretend I enjoyed watching that.';
    if(record.raceFinishPosition<record.tyreseFinish)tyrese=record.teamOrderChoice==='ignore'?'You knew exactly what Mara asked. You also made the move stick. We will discuss both.':`You had me today. Don't make a personality out of it.`;
    else if(record.raceFinishPosition>record.tyreseFinish)tyrese=`You were quick. Next time, stop showing me the move half a sector early.`;
    else tyrese='Apparently we have invented finishing in the same position. Very efficient.';
    return [{who:'NELL',line:nell},{who:'MARA',line:mara},{who:'TYRESE',line:tyrese}];
  }

  function afterFlagParcText(id,story,record){
    const player=storyDragonName();
    if(id==='tyrese')return record.raceFinishPosition<record.tyreseFinish?(record.teamOrderChoice==='ignore'?`Tyrese catches you looking at the timing board. “You had me. You also ignored the call. Annoyingly, both things are true.”`:`Tyrese taps the P${record.raceFinishPosition} line with one glove. “You had me today. Properly.”`):`Tyrese is already half out of his race gear. “You were in my mirrors enough to be irritating. That's progress.”`;
    if(id==='nell')return `Nell has three screens open and none of them show the podium. “Best lap ${formatStoryLap(record.bestLapMs)}. ${record.playerOvertakes} passes. I have forty-seven less glamorous observations.”`;
    if(id==='mara')return record.teamOrderChoice==='ignore'?`Mara says congratulations first. Then, after exactly one beat: “We are going to discuss how you got it.”`:`Mara gives ${player} a quick once-over, then you. “Result recorded. Decisions remembered. That's the useful order.”`;
    if(id==='classification')return `The board settles: ${player} P${record.raceFinishPosition}. Tyrese P${record.tyreseFinish}. ${record.positionsGained?`Net gain: +${record.positionsGained}.`:'No net positions gained.'} ${record.photoFinish?'PHOTO FINISH logged.':''}`;
    return `${player} is breathing hard but settled. For once, nobody is asking the dragon to perform for a camera.`;
  }

  async function afterFlagParcInteract(id){
    if(state.storySaving)return;const changed=cloneValue(state.story),af=changed.chapter6.afterFlag,record=af.weekendRecord||lumerreWeekendRecord(changed);
    af.parcFerme={...defaultQuickquillStory().chapter6.afterFlag.parcFerme,...(af.parcFerme||{}),visited:Array.isArray(af.parcFerme?.visited)?af.parcFerme.visited:[],choices:{...(af.parcFerme?.choices||{})}};
    if(!af.parcFerme.visited.includes(id))af.parcFerme.visited.push(id);
    if(id==='tyrese')applyCareerEvolutionEffects(changed,{tyrese:{professionalRespect:1}});
    if(id==='nell')applyStoryEffects(changed,{relationships:{nellBond:1}});
    if(id==='mara')applyCareerEvolutionEffects(changed,{reputation:{quickquillTrust:record.teamOrderChoice==='ignore'?-1:1}});
    if(id==='september')applyStoryEffects(changed,{relationships:{dragonBond:1}});
    af.parcFerme.choices[id]=afterFlagParcText(id,changed,record);
    changed.history=[...(changed.history||[]),{scene:'q58',event:'parc-ferme-interaction',target:id}].slice(-120);
    state.story=changed;state.afterFlagModal=id;state.afterFlagTransient=af.parcFerme.choices[id];
    await persistStory(changed,{stageOverride:'quickquill-lumerre-after-flag'});render();
  }

  async function afterFlagTeamChoice(id){
    if(state.storySaving)return;const changed=cloneValue(state.story),af=changed.chapter6.afterFlag,record=af.weekendRecord||lumerreWeekendRecord(changed);af.teamReaction=id;
    if(id==='pace')applyCareerEvolutionEffects(changed,{racecraft:{technicalUnderstanding:1,consistency:1}});
    else if(id==='orders')applyCareerEvolutionEffects(changed,{reputation:{quickquillTrust:record.teamOrderChoice==='ignore'?-1:1},racecraft:{pressureHandling:1}});
    else applyCareerEvolutionEffects(changed,{tyrese:{professionalRespect:1,competitiveTension:record.raceFinishPosition<record.tyreseFinish?1:0}});
    changed.history=[...(changed.history||[]),{scene:'q59',event:'post-race-team-focus',choice:id}].slice(-120);state.story=changed;state.afterFlagTransient=id;
    await persistStory(changed,{stageOverride:'quickquill-lumerre-after-flag'});render();
  }

  function afterFlagMediaQuestions(story,record){
    const pool=[];
    if(record.raceFinishPosition===1)pool.push({id:'win',outlet:'LUMERRE SPORT',question:'When did you realise the Crown was actually yours to win?'});
    if(record.positionsGained>=2)pool.push({id:'charge',outlet:'PADDOCK WIRE',question:`You came from P${record.raceStartPosition} to P${record.raceFinishPosition}. Where did the race pace come from?`});
    if(record.raceFinishPosition<record.tyreseFinish)pool.push({id:'tyrese',outlet:'THE GRID',question:`You finished ahead of Tyrese. Has the hierarchy at Quickquill changed?`});
    if(record.teamOrderChoice==='ignore')pool.push({id:'order',outlet:'CROWN LIVE',question:'We heard Quickquill ask you to hold position. Why did you ignore the call?'});
    if(record.teamOrderChoice==='obey')pool.push({id:'order',outlet:'CROWN LIVE',question:'Do you feel you sacrificed your own result for the team today?'});
    if(record.jalenFinish && Math.abs(record.jalenFinish-record.raceFinishPosition)<=2)pool.push({id:'jalen',outlet:'SUNSTEP RADIO',question:'Jalen was in your race for a long time. How hard was it keeping that battle under control?'});
    pool.push({id:'progress',outlet:'VELMORA DAILY',question:'Three races into this career, what feels different about you and the dragon now?'},{id:'pressure',outlet:'THE TERRACE',question:'Did the size of Crown Week change the way you raced today?'});
    const seen=new Set();return pool.filter(q=>!seen.has(q.id)&&seen.add(q.id)).slice(0,5);
  }

  async function afterFlagSelectQuestion(id){
    if(state.storySaving)return;const changed=cloneValue(state.story),af=changed.chapter6.afterFlag;af.media.currentQuestion=id;state.story=changed;state.afterFlagTransient='';render();
  }

  async function afterFlagAnswerMedia(tone){
    if(state.storySaving)return;const changed=cloneValue(state.story),af=changed.chapter6.afterFlag,record=af.weekendRecord||lumerreWeekendRecord(changed),questions=afterFlagMediaQuestions(changed,record),q=questions.find(row=>row.id===af.media.currentQuestion);if(!q)return;
    const toneText=tone==='team'?'Keep it about the dragon and the team.':tone==='confident'?'Own the result without apologising for it.':'Answer the question exactly as asked.';
    af.media.answers=[...(af.media.answers||[]),{questionId:q.id,outlet:q.outlet,tone,question:q.question,answer:toneText}].slice(0,2);af.media.currentQuestion='';
    if(tone==='team')applyCareerEvolutionEffects(changed,{reputation:{quickquillTrust:2,paddockRespect:1,media:1},tyrese:{friendship:1}});
    else if(tone==='confident')applyCareerEvolutionEffects(changed,{reputation:{fame:3,media:2,pressure:1},tyrese:{competitiveTension:1}});
    else applyCareerEvolutionEffects(changed,{reputation:{paddockRespect:2,media:2},tyrese:{professionalRespect:1}});
    if(q.id==='order'&&record.teamOrderChoice==='ignore'&&tone==='confident')applyCareerEvolutionEffects(changed,{reputation:{quickquillTrust:-2,pressure:2}});
    af.media.profile=tone==='team'?'Team First':tone==='confident'?'Headline Maker':'Straight Shooter';
    changed.history=[...(changed.history||[]),{scene:'q61',event:'lumerre-media-answer',question:q.id,tone}].slice(-120);state.story=changed;playCrownSfx('camera',.12);
    await persistStory(changed,{stageOverride:'quickquill-lumerre-after-flag'});render();
  }

  async function afterFlagInspectRoom(id){
    if(state.storySaving)return;const changed=cloneValue(state.story),af=changed.chapter6.afterFlag;af.room={...defaultQuickquillStory().chapter6.afterFlag.room,...(af.room||{}),inspected:Array.isArray(af.room?.inspected)?af.room.inspected:[]};if(!af.room.inspected.includes(id))af.room.inspected.push(id);
    if(id==='september')applyStoryEffects(changed,{relationships:{dragonBond:1}});if(id==='sheet')applyCareerEvolutionEffects(changed,{racecraft:{technicalUnderstanding:1}});
    changed.history=[...(changed.history||[]),{scene:'q62',event:'quiet-room-inspect',target:id}].slice(-120);state.story=changed;state.afterFlagTransient=id;await persistStory(changed,{stageOverride:'quickquill-lumerre-after-flag'});render();
  }

  async function afterFlagTyreseChoice(id){
    if(state.storySaving)return;const changed=cloneValue(state.story),af=changed.chapter6.afterFlag;af.tyreseChoice=id;
    if(id==='team')applyCareerEvolutionEffects(changed,{tyrese:{friendship:3,professionalRespect:1,competitiveTension:-1},reputation:{quickquillTrust:1}});
    else if(id==='beat')applyCareerEvolutionEffects(changed,{tyrese:{professionalRespect:2,competitiveTension:3},reputation:{fame:1}});
    else applyCareerEvolutionEffects(changed,{tyrese:{friendship:1,professionalRespect:3,competitiveTension:1}});
    changed.history=[...(changed.history||[]),{scene:'q63',event:'tyrese-post-crown',choice:id}].slice(-120);state.story=changed;state.afterFlagTransient=id;await persistStory(changed,{stageOverride:'quickquill-lumerre-after-flag'});render();
  }

  async function afterFlagOpenEnvelope(){
    if(state.storySaving)return;const changed=cloneValue(state.story),af=changed.chapter6.afterFlag;if(!af.envelopeOpened){af.envelopeOpened=true;changed.history=[...(changed.history||[]),{scene:'q64',event:'quickquill-hq-envelope-opened'}].slice(-120);}state.story=changed;playTone(420);await persistStory(changed,{stageOverride:'quickquill-lumerre-after-flag'});render();
  }

  async function finishLumerreAfterFlag(){
    if(state.storySaving)return;const changed=cloneValue(state.story),af=changed.chapter6.afterFlag;af.completed=true;af.completedAt=new Date().toISOString();af.impactAfter=afterFlagImpactSnapshot(changed);changed.completed={...(changed.completed||{}),afterFlag:true,verdict:false};changed.chapter7={...defaultQuickquillStory().chapter7,...(changed.chapter7||{})};changed.chapter='verdict';changed.history=[...(changed.history||[]),{scene:'q65',event:'lumerre-chapter-complete',finish:af.weekendRecord?.raceFinishPosition||null,media:af.media?.profile||''}].slice(-120);state.story=changed;
    await persistStory(changed,{stageOverride:'quickquill-lumerre-chapter-complete'});state.mode='story-journey';state.afterFlagTransient='';state.afterFlagModal='';render();syncMusic({restart:true});
  }

  function afterFlagShell(scene,sceneIndex,body,extra=''){
    return `<section class="after-flag-shell ${extra}" aria-label="${escapeHtml(scene.number)} ${escapeHtml(scene.title)}"><img class="after-flag-bg" src="${scene.background}" alt="" aria-hidden="true"><div class="after-flag-shade"></div><header class="after-flag-header"><div><small>CHAPTER SIX · AFTER THE FLAG</small><strong>${escapeHtml(scene.number)} · ${escapeHtml(scene.title)}</strong><span>${escapeHtml(scene.location)}</span></div><button type="button" data-after-flag-hub>CAREER HUB</button></header><div class="after-flag-progress"><i style="--p:${((sceneIndex+1)/QUICKQUILL_LUMERRE_AFTER_FLAG_SCENES.length)*100}%"></i><span>${sceneIndex+1} / ${QUICKQUILL_LUMERRE_AFTER_FLAG_SCENES.length}</span></div>${body}</section><div class="blackout ${state.blackout?'is-visible':''}" aria-hidden="true"></div>`;
  }

  function renderAfterFlagCooldown(scene,idx,story,af,record){
    const lines=afterFlagRadioLines(story,record);const headline=record.raceFinishPosition===1?'WINNER · LUMERRE CROWN':`FINISH · P${record.raceFinishPosition}`;
    const body=`<main class="after-cooldown"><section class="after-cooldown-card"><small>CHEQUERED FLAG · STILL MOVING</small><h1>${escapeHtml(headline)}</h1><div class="after-radio-stack">${lines.map((r,i)=>`<article style="--d:${i*120}ms"><b>${escapeHtml(r.who)}</b><p>${escapeHtml(r.line)}</p></article>`).join('')}</div><div class="after-race-strip"><span><small>START</small><b>P${record.raceStartPosition}</b></span><span><small>FINISH</small><b>P${record.raceFinishPosition}</b></span><span><small>OVERTAKES</small><b>${record.playerOvertakes}</b></span><span><small>TYRESE</small><b>P${record.tyreseFinish}</b></span></div><button type="button" data-after-next="q58">ROLL INTO PARC FERMÉ</button></section><div class="after-cooldown-flight" aria-hidden="true"><i></i><i></i><i></i></div></main>`;
    root.innerHTML=afterFlagShell(scene,idx,body,'is-cooldown');
  }

  function renderAfterFlagParc(scene,idx,story,af,record){
    const visited=new Set(af.parcFerme?.visited||[]),targets=[['tyrese','TYRESE','Captain'],['nell','NELL','Telemetry'],['mara','MARA','Team Principal'],['classification','TIMING BOARD','Official'],['september',storyDragonName().toUpperCase(),'Your dragon']];
    const body=`<main class="after-parc"><div class="after-parc-title"><small>OPEN PARC FERMÉ · CHOOSE THREE MOMENTS</small><h1>The noise comes back all at once.</h1><p>You do not have to speak to everybody. Pick where the next few minutes go.</p></div><div class="after-parc-targets">${targets.map(([id,name,note],i)=>`<button type="button" class="after-parc-target ${visited.has(id)?'is-done':''}" data-after-parc="${id}" style="--x:${[24,39,55,71,84][i]}%;--y:${[64,51,69,34,56][i]}%"><b>${escapeHtml(name)}</b><small>${escapeHtml(note)}</small><i>${visited.has(id)?'✓':'+'}</i></button>`).join('')}</div>${state.afterFlagModal?`<aside class="after-popover"><button type="button" data-after-close>×</button><small>${escapeHtml(state.afterFlagModal.toUpperCase())}</small><p>${escapeHtml(state.afterFlagTransient||'')}</p></aside>`:''}<div class="after-parc-footer"><span>${visited.size} / 3 moments</span><button type="button" data-after-next="q59" ${visited.size<3?'disabled':''}>BACK TO QUICKQUILL</button></div></main>`;
    root.innerHTML=afterFlagShell(scene,idx,body,'is-parc');
  }

  function renderAfterFlagTeam(scene,idx,story,af,record){
    const choice=af.teamReaction;const cards={pace:{title:'PACE TRACE',copy:`Best lap ${formatStoryLap(record.bestLapMs)} · ${record.playerOvertakes} completed passes. Nell wants to know where the speed became repeatable.`},orders:{title:'TEAM ORDER',copy:`Race call: ${String(record.teamOrderChoice||'none').toUpperCase()}. Mara cares less about the radio message than what you did with it.`},captain:{title:'TYRESE',copy:`You P${record.raceFinishPosition} · Tyrese P${record.tyreseFinish}. The garage has noticed the comparison even if nobody says “hierarchy”.`}};
    const response=choice==='pace'?'Nell: “Good. We keep the part that repeated. Everything else was theatre.”':choice==='orders'?(record.teamOrderChoice==='ignore'?'Mara: “Congratulations. We are still going to discuss the word ‘ignore’.”':'Mara: “Good. Team calls only matter if they survive contact with a race.”'):'Tyrese, walking past: “Please stop turning my finishing position into a department.”';
    const body=`<main class="after-team"><section class="after-team-board"><header><small>QUICKQUILL BAY · LIVE DEBRIEF</small><h1>Pick the thing you actually want to talk about.</h1></header><div class="after-team-cards">${Object.entries(cards).map(([id,c])=>`<button type="button" data-after-team="${id}" class="${choice===id?'is-selected':''}"><small>${escapeHtml(c.title)}</small><p>${escapeHtml(c.copy)}</p></button>`).join('')}</div>${choice?`<div class="after-team-response"><span>${escapeHtml(response)}</span></div><button class="after-primary" type="button" data-after-next="q60">CEREMONY</button>`:''}</section></main>`;
    root.innerHTML=afterFlagShell(scene,idx,body,'is-team');
  }

  function renderAfterFlagPodium(scene,idx,story,af,record){
    const podium=record.raceFinishPosition<=3,win=record.raceFinishPosition===1;
    const body=podium?`<main class="after-podium"><section class="after-podium-banner"><small>${win&&record.firstCareerWin?'FIRST CAREER VICTORY':'LUMERRE CROWN · PODIUM'}</small><h1>${win?'CROWNED AT LUMERRE':`P${record.raceFinishPosition} · ON THE PODIUM`}</h1><p>${win?'For a few seconds nobody asks a question. The crowd gets the scene instead.':'No debrief. No radio. Just the walk out, the flashes and the result made physical.'}</p></section>${win?`<img class="after-podium-trophy" src="${LUMERRE_RACE_TROPHY}" alt="Lumerre Crown trophy">`:''}<div class="after-flashes" aria-hidden="true"><i></i><i></i><i></i></div><button class="after-podium-next" type="button" data-after-next="q61">FACE THE PRESS</button></main>`:`<main class="after-podium is-no-podium"><section><small>P${record.raceFinishPosition} · PARC FERMÉ</small><h1>The ceremony belongs to somebody else today.</h1><p>You watch long enough to hear the crowd, then the media coordinator points at you anyway. Apparently P${record.raceFinishPosition} is still interesting.</p><button type="button" data-after-next="q61">FACE THE PRESS</button></section></main>`;
    root.innerHTML=afterFlagShell(scene,idx,body,'is-podium');if(podium)playCrownSfx('camera',.10);
  }

  function renderAfterFlagPress(scene,idx,story,af,record){
    const questions=afterFlagMediaQuestions(story,record),answered=new Set((af.media?.answers||[]).map(a=>a.questionId)),current=questions.find(q=>q.id===af.media?.currentQuestion),done=(af.media?.answers||[]).length>=2;
    const body=`<main class="after-press"><section class="after-press-stage"><header><small>POST-RACE SCRUM</small><h1>Two questions. Pick who gets them.</h1><span>${(af.media?.answers||[]).length} / 2 ANSWERED</span></header>${current?`<div class="after-question"><small>${escapeHtml(current.outlet)}</small><h2>${escapeHtml(current.question)}</h2><div class="after-answer-tones"><button data-after-tone="team"><b>TEAM FIRST</b><span>Professional · Quickquill trust</span></button><button data-after-tone="confident"><b>CONFIDENT</b><span>Fame · headlines · pressure</span></button><button data-after-tone="straight"><b>STRAIGHT ANSWER</b><span>Respect · no paddock dance</span></button></div><button class="after-text-back" data-after-question-back>OTHER REPORTERS</button></div>`:`<div class="after-reporters">${questions.map((q,i)=>`<button type="button" data-after-question="${q.id}" ${answered.has(q.id)||done?'disabled':''} style="--d:${i*70}ms"><b>${escapeHtml(q.outlet)}</b><span>${escapeHtml(q.question)}</span><i>${answered.has(q.id)?'✓':'›'}</i></button>`).join('')}</div>`}${done?`<div class="after-media-profile"><small>MEDIA READ</small><strong>${escapeHtml(af.media.profile||'Post-race')}</strong><button type="button" data-after-next="q62">GET OUT OF HERE</button></div>`:''}</section><div class="after-camera-flash" aria-hidden="true"></div></main>`;
    root.innerHTML=afterFlagShell(scene,idx,body,'is-media');
  }

  function renderAfterFlagRoom(scene,idx,story,af,record){
    const inspected=new Set(af.room?.inspected||[]);const notes={sheet:`LUMERRE CROWN · Qualifying P${record.qualifyingPosition} · Race P${record.raceFinishPosition} · ${record.playerOvertakes} overtakes · Tyrese P${record.tyreseFinish}.`,september:`${storyDragonName()} is already asleep. Apparently winning, losing and being famous all require exactly the same amount of blanket.`,gloves:'Your race gloves are where you dropped them. One still has pale Lumerre dust caught in the seam.'};
    const body=`<main class="after-room"><section class="after-room-title"><small>22:03 · NO CAMERAS</small><h1>Five quiet minutes.</h1><p>Nothing advances until you decide to look at something.</p></section><div class="after-room-items"><button data-after-room="sheet" class="${inspected.has('sheet')?'is-seen':''}"><b>RESULT SHEET</b><small>On the table</small></button><button data-after-room="september" class="${inspected.has('september')?'is-seen':''}"><b>${escapeHtml(storyDragonName().toUpperCase())}</b><small>Already asleep</small></button><button data-after-room="gloves" class="${inspected.has('gloves')?'is-seen':''}"><b>RACE GLOVES</b><small>Where you dropped them</small></button></div>${state.afterFlagTransient?`<aside class="after-room-note">${escapeHtml(notes[state.afterFlagTransient]||'')}</aside>`:''}<button class="after-room-next" type="button" data-after-next="q63" ${inspected.size<1?'disabled':''}>SOMEONE KNOCKS</button></main>`;
    root.innerHTML=afterFlagShell(scene,idx,body,'is-room');
  }

  function renderAfterFlagTyrese(scene,idx,story,af,record){
    const beat=af.tyreseChoice;let lead='Three races ago I thought you were going to be another academy project.';let second='I was wrong.';
    if(record.raceFinishPosition>record.tyreseFinish){lead='You were quick today. You also showed me the move too early.';second='Next time I take the invitation.';}
    if(record.teamOrderChoice==='ignore'&&record.raceFinishPosition<record.tyreseFinish){lead='If you are going to race me, race me.';second='Just do not pretend afterward that you were not.';}
    const response=beat==='team'?'Tyrese: “Fine. Team. Until the lights go out.”':beat==='beat'?'Tyrese smiles once. “Good. That answer I can work with.”':beat==='both'?'Tyrese: “Annoyingly sensible. Do not make a habit of it.”':'';
    const body=`<main class="after-tyrese"><section class="after-tyrese-scene"><div class="after-tyrese-portrait">${portraitMarkup({character:'tyrese',frame:record.raceFinishPosition<record.tyreseFinish?7:record.raceFinishPosition>record.tyreseFinish?6:1,side:'right'})}</div><div class="after-tyrese-copy"><small>TYRESE</small><p>${escapeHtml(lead)}</p><p class="is-short">${escapeHtml(second)}</p>${!beat?`<div class="after-tyrese-choices"><button data-after-tyrese="team">WE'RE A TEAM</button><button data-after-tyrese="beat">I WANT TO BEAT YOU</button><button data-after-tyrese="both">WE BOTH NEED TO WIN</button></div>`:`<div class="after-tyrese-response">${escapeHtml(response)}</div><button class="after-primary" data-after-next="q64">MARA KNOCKS</button>`}</div></section></main>`;
    root.innerHTML=afterFlagShell(scene,idx,body,'is-tyrese');
  }

  function renderAfterFlagEnvelope(scene,idx,story,af,record){
    const open=!!af.envelopeOpened;const maraLine=record.raceFinishPosition<=3?'Three races ago, you were here on an assessment. Nobody is assessing whether you belong anymore.':'You answered the question I brought you here to answer. Head office wants the next one.';
    const body=`<main class="after-envelope"><section class="after-envelope-copy"><small>MARA · 22:18</small><p>${escapeHtml(maraLine)}</p><p class="is-muted">“Head office wants you Monday.”</p></section><button type="button" class="after-envelope-prop ${open?'is-open':''}" data-after-envelope ${open?'disabled':''}><img src="${open?LUMERRE_ENVELOPE_OPEN:LUMERRE_ENVELOPE_CLOSED}" alt="${open?'Opened Quickquill envelope':'Sealed Quickquill envelope'}"><span>${open?'OPENED':'CLICK TO OPEN'}</span></button>${open?`<section class="after-letter"><small>QUICKQUILL RACING · HEAD OFFICE</small><strong>MONDAY · 09:00</strong><b>PRIVATE MEETING</b><p>Nell: “Good news?”<br>Mara: “Monday.”</p><button type="button" data-after-next="q65">FADE OUT</button></section>`:''}</main>`;
    root.innerHTML=afterFlagShell(scene,idx,body,'is-envelope');
  }

  function renderAfterFlagFinale(scene,idx,story,af,record){
    const before=af.impactBefore||afterFlagImpactSnapshot(story),after=afterFlagImpactSnapshot(story);const impact=[['FAME',afterFlagDelta(before,after,'fame')],['PADDOCK RESPECT',afterFlagDelta(before,after,'paddockRespect')],['QUICKQUILL TRUST',afterFlagDelta(before,after,'quickquillTrust')],['TYRESE RESPECT',afterFlagDelta(before,after,'tyreseRespect')],['TYRESE TENSION',afterFlagDelta(before,after,'tyreseTension')]].filter(([,v])=>v!==0);
    const milestone=record.firstCareerWin?'FIRST CAREER VICTORY':record.raceFinishPosition<=3?'LUMERRE CROWN PODIUM':'LUMERRE CROWN FINISH';
    const body=`<main class="after-finale"><section class="after-finale-card"><small>CHAPTER SIX COMPLETE</small><h1>THE LUMERRE CROWN</h1><p>${escapeHtml(milestone)}</p><div class="after-final-stats"><span><small>QUALIFYING</small><b>P${record.qualifyingPosition}</b></span><span><small>RACE</small><b>P${record.raceFinishPosition}</b></span><span><small>GAIN</small><b>${record.positionsGained?`+${record.positionsGained}`:'0'}</b></span><span><small>OVERTAKES</small><b>${record.playerOvertakes}</b></span><span><small>TYRESE</small><b>P${record.tyreseFinish}</b></span><span><small>TEAM ORDER</small><b>${escapeHtml(String(record.teamOrderChoice||'NONE').toUpperCase())}</b></span></div>${impact.length?`<div class="after-impact"><small>AFTER THE FLAG · IMPACT</small>${impact.map(([k,v])=>`<span><b>${escapeHtml(k)}</b><i class="${v>0?'up':'down'}">${escapeHtml(deltaLabel(v))}</i></span>`).join('')}</div>`:''}<div class="after-next-chapter"><small>NEXT</small><strong>THE VERDICT</strong><span>Quickquill HQ · Monday · 09:00</span></div><button type="button" data-after-finish>COMPLETE CHAPTER SIX</button></section></main>`;
    root.innerHTML=afterFlagShell(scene,idx,body,'is-finale');
  }

  function renderLumerreAfterFlag(scene,beat,idx){
    const story=state.story,af=afterFlagState(story),record=af.weekendRecord||lumerreWeekendRecord(story);
    if(beat.type==='lumerre-after-cooldown')renderAfterFlagCooldown(scene,idx,story,af,record);
    else if(beat.type==='lumerre-after-parc')renderAfterFlagParc(scene,idx,story,af,record);
    else if(beat.type==='lumerre-after-team')renderAfterFlagTeam(scene,idx,story,af,record);
    else if(beat.type==='lumerre-after-podium')renderAfterFlagPodium(scene,idx,story,af,record);
    else if(beat.type==='lumerre-after-press')renderAfterFlagPress(scene,idx,story,af,record);
    else if(beat.type==='lumerre-after-room')renderAfterFlagRoom(scene,idx,story,af,record);
    else if(beat.type==='lumerre-after-tyrese')renderAfterFlagTyrese(scene,idx,story,af,record);
    else if(beat.type==='lumerre-after-envelope')renderAfterFlagEnvelope(scene,idx,story,af,record);
    else renderAfterFlagFinale(scene,idx,story,af,record);
    root.querySelector('[data-after-flag-hub]')?.addEventListener('click',returnToHubFromStory);
    root.querySelectorAll('[data-after-next]').forEach(btn=>btn.addEventListener('click',()=>{void afterFlagGo(btn.dataset.afterNext||'q65');}));
    root.querySelectorAll('[data-after-parc]').forEach(btn=>btn.addEventListener('click',()=>{void afterFlagParcInteract(btn.dataset.afterParc||'');}));
    root.querySelector('[data-after-close]')?.addEventListener('click',()=>{state.afterFlagModal='';state.afterFlagTransient='';render();});
    root.querySelectorAll('[data-after-team]').forEach(btn=>btn.addEventListener('click',()=>{void afterFlagTeamChoice(btn.dataset.afterTeam||'');}));
    root.querySelectorAll('[data-after-question]').forEach(btn=>btn.addEventListener('click',()=>{void afterFlagSelectQuestion(btn.dataset.afterQuestion||'');}));
    root.querySelector('[data-after-question-back]')?.addEventListener('click',()=>{const changed=cloneValue(state.story);changed.chapter6.afterFlag.media.currentQuestion='';state.story=changed;render();});
    root.querySelectorAll('[data-after-tone]').forEach(btn=>btn.addEventListener('click',()=>{void afterFlagAnswerMedia(btn.dataset.afterTone||'straight');}));
    root.querySelectorAll('[data-after-room]').forEach(btn=>btn.addEventListener('click',()=>{void afterFlagInspectRoom(btn.dataset.afterRoom||'');}));
    root.querySelectorAll('[data-after-tyrese]').forEach(btn=>btn.addEventListener('click',()=>{void afterFlagTyreseChoice(btn.dataset.afterTyrese||'both');}));
    root.querySelector('[data-after-envelope]')?.addEventListener('click',()=>{void afterFlagOpenEnvelope();});
    root.querySelector('[data-after-finish]')?.addEventListener('click',()=>{void finishLumerreAfterFlag();});
  }


  function verdictState(story = state.story) {
    const raw=story?.chapter7||{};
    return {...defaultQuickquillStory().chapter7,...raw,
      hq:{...defaultQuickquillStory().chapter7.hq,...(raw.hq||{}),visited:Array.isArray(raw.hq?.visited)?raw.hq.visited:[],overheard:Array.isArray(raw.hq?.overheard)?raw.hq.overheard:[]},
      review:{...defaultQuickquillStory().chapter7.review,...(raw.review||{}),seen:Array.isArray(raw.review?.seen)?raw.review.seen:[]},
      offer:{...defaultQuickquillStory().chapter7.offer,...(raw.offer||{}),selectedDemands:Array.isArray(raw.offer?.selectedDemands)?raw.offer.selectedDemands:[],acceptedDemands:Array.isArray(raw.offer?.acceptedDemands)?raw.offer.acceptedDemands:[],rejectedDemands:Array.isArray(raw.offer?.rejectedDemands)?raw.offer.rejectedDemands:[]},
      outsideInterest:{...defaultQuickquillStory().chapter7.outsideInterest,...(raw.outsideInterest||{})}
    };
  }

  function verdictWeekendRecord(story=state.story){
    return story?.chapter6?.afterFlag?.weekendRecord || lumerreWeekendRecord(story);
  }

  function verdictInitialOffer(story=state.story){
    const record=verdictWeekendRecord(story),trust=Number(story?.relationships?.quickquillTrust||50),finish=Number(record?.raceFinishPosition||7);
    const role=finish===1&&trust>=58?'Equal Racer':finish<=3?'Developing Racer+':'Developing Racer';
    return {initialRole:role,role,length:2,podiumBonus:finish<=3?16000:12000,sponsorDays:6,status:'draft',selectedDemands:[],acceptedDemands:[],rejectedDemands:[],negotiationRounds:0,countered:false};
  }

  function verdictOfferEnsure(story=state.story){
    const c7=story.chapter7||(story.chapter7=cloneValue(defaultQuickquillStory().chapter7));
    // Keep one stable offer object. Demand definitions are consulted several
    // times during submission; replacing c7.offer on each lookup meant the
    // accepted terms were applied to an older object while the save retained
    // status:'draft', returning Q70 to its starting screen.
    const current=c7.offer&&typeof c7.offer==='object'?c7.offer:{};
    Object.assign(current,{...defaultQuickquillStory().chapter7.offer,...current});
    if(!current.initialRole)Object.assign(current,verdictInitialOffer(story));
    c7.offer=current;return current;
  }

  function verdictDemandDefinition(id,story=state.story){
    const offer=verdictOfferEnsure(story);
    const defs={
      role:{id:'role',title:'TEAM ROLE',from:offer.role,to:offer.role==='Developing Racer'?'Developing Racer+':offer.role==='Developing Racer+'?'Equal Racer':'Lead Prospect',cost:offer.role==='Equal Racer'?4:3,note:'Ask Quickquill to put your status in writing.'},
      length:{id:'length',title:'CONTRACT TERM',from:`${offer.length} seasons`,to:'1 season',cost:2,note:'Keep the next move in your hands.'},
      bonus:{id:'bonus',title:'PODIUM BONUS',from:`${Number(offer.podiumBonus||0).toLocaleString('en-GB')} GP`,to:`${Number(offer.podiumBonus||0)+6000} GP`,cost:1,note:'More reward when the results arrive.'},
      sponsor:{id:'sponsor',title:'SPONSOR DAYS',from:`${offer.sponsorDays} / season`,to:`${Math.max(3,offer.sponsorDays-2)} / season`,cost:1,note:'Protect more race-preparation time.'}
    };
    return defs[id]||null;
  }

  function verdictApplyDemand(offer,id,story){
    const d=verdictDemandDefinition(id,story);if(!d)return;
    if(id==='role')offer.role=d.to;
    else if(id==='length')offer.length=1;
    else if(id==='bonus')offer.podiumBonus=Number(offer.podiumBonus||0)+6000;
    else if(id==='sponsor')offer.sponsorDays=Math.max(3,Number(offer.sponsorDays||6)-2);
  }

  function verdictImpactLine(story=state.story){
    const record=verdictWeekendRecord(story),finish=Number(record?.raceFinishPosition||7),tyrese=Number(record?.tyreseFinish||7),trust=Number(story?.relationships?.quickquillTrust||50);
    if(finish===1)return `${storyDragonName()} arrives as the Lumerre Crown winner. Quickquill cannot frame this as an academy trial anymore.`;
    if(finish<=3&&finish<tyrese)return `${storyDragonName()} arrives with a Lumerre podium and a finish ahead of Tyrese. The hierarchy question is now unavoidable.`;
    if(finish<=3)return `${storyDragonName()} arrives with a Lumerre podium. Quickquill wants the progress secured before another team asks first.`;
    return `${storyDragonName()} has completed the assessment run with enough pace, trust (${trust}) and race evidence to force a real contract discussion.`;
  }

  async function startVerdictChapter(){
    if(!state.activeSave||state.storySaving)return;
    const changed=normaliseQuickquillStory(cloneValue(state.story||activeSaveState().story));
    if(!changed.completed?.afterFlag){state.storyError='Finish The Lumerre Crown finale first.';render();return;}
    changed.chapter7={...defaultQuickquillStory().chapter7,...(changed.chapter7||{}),hq:{...defaultQuickquillStory().chapter7.hq,...(changed.chapter7?.hq||{})},review:{...defaultQuickquillStory().chapter7.review,...(changed.chapter7?.review||{})},offer:{...defaultQuickquillStory().chapter7.offer,...(changed.chapter7?.offer||{})},outsideInterest:{...defaultQuickquillStory().chapter7.outsideInterest,...(changed.chapter7?.outsideInterest||{})}};
    if(!changed.chapter7.started){changed.chapter7.started=true;changed.chapter7.startedAt=new Date().toISOString();changed.history=[...(changed.history||[]),{scene:'q66',event:'verdict-start'}].slice(-140);}
    verdictOfferEnsure(changed);changed.completed={...(changed.completed||{}),verdict:false};changed.chapter='verdict';changed.scene=changed.chapter7.completed?'q74':(QUICKQUILL_VERDICT_SCENES.some(s=>s.id===changed.scene)?changed.scene:'q66');changed.beat=0;
    state.story=changed;state.mode='story';state.storyError='';state.verdictTransient='';state.verdictModal='';render();syncMusic({restart:true});
    try{await persistStory(changed,{stageOverride:'quickquill-verdict'});}catch(error){state.storyError=error?.message||'The Verdict could not be prepared.';render();}
  }

  async function verdictGo(sceneId,event='verdict-advance'){
    if(state.storySaving)return;const changed=cloneValue(state.story);changed.chapter='verdict';changed.scene=sceneId;changed.beat=0;changed.history=[...(changed.history||[]),{scene:sceneId,event}].slice(-140);state.story=changed;state.verdictTransient='';state.verdictModal='';
    try{await persistStory(changed,{stageOverride:'quickquill-verdict'});}catch(error){state.storyError=error?.message||'Career progress could not be saved.';}render();syncMusic({restart:true});
  }

  async function verdictAdvanceIntro(step){
    if(state.storySaving)return;
    const changed=cloneValue(state.story),c7=changed.chapter7;
    c7.introStep=Math.max(0,Math.min(2,Number(step)||0));
    changed.history=[...(changed.history||[]),{scene:'q66',event:'verdict-intro',step:c7.introStep}].slice(-140);
    state.story=changed;state.storyError='';render();
    try{await persistStory(changed,{stageOverride:'quickquill-verdict'});}catch(error){state.storyError=error?.message||'The arrival could not be saved. You can continue and try again.';}
    render();
  }

  async function verdictArrivalChoice(id){
    if(state.storySaving)return;const changed=cloneValue(state.story),c7=changed.chapter7;c7.arrivalChoice=id;
    if(id==='quiet'){changed.relationships.maraBond+=1;changed.identity.focus+=1;}
    else if(id==='joke'){changed.relationships.tyreseBond+=2;changed.identity.heart+=1;}
    else {changed.relationships.quickquillTrust+=1;changed.identity.fire+=1;}
    changed.history=[...(changed.history||[]),{scene:'q66',event:'verdict-arrival-tone',choice:id}].slice(-140);state.story=changed;state.verdictTransient=id;await persistStory(changed,{stageOverride:'quickquill-verdict'});render();
  }

  const VERDICT_HQ_SPOTS={
    trophies:{title:'TROPHY WALL',note:'Old Quickquill winners, scratched plaques and one empty space.',text:'The oldest trophies are polished. The newest shelf is conspicuously empty. Tyrese walks past and says, “Do not stare at it. It gets ideas.”'},
    engineering:{title:'ENGINEERING FLOOR',note:'Nell is already arguing with a telemetry graph.',text:'Nell has Lumerre sector traces open beside next-race simulation work. She points at one line without greeting you: “That is the bit I want to keep.”'},
    cafe:{title:'STAFF CAFÉ',note:'The least glamorous room in professional racing.',text:'Two mechanics stop talking when you walk in, then deliberately continue. You catch: “If the kid signs equal status, Tyrese will pretend not to care for exactly four minutes.”'},
    sponsors:{title:'SPONSOR GALLERY',note:'Uniforms, old campaigns and expensive smiles.',text:'Your Lumerre photo is already in a sponsor mock-up. Nobody asked permission. The caption simply says: QUICKQUILL — NEXT.'},
    archive:{title:'RACER ARCHIVE',note:'Contracts, programmes and retired number boards.',text:'Quickquill keeps every signed racer card. The empty slot beside Tyrese is labelled only with today’s date.'}
  };

  async function verdictVisitHq(id){
    if(state.storySaving||!VERDICT_HQ_SPOTS[id])return;const changed=cloneValue(state.story),hq=changed.chapter7.hq;hq.visited=Array.isArray(hq.visited)?hq.visited:[];hq.overheard=Array.isArray(hq.overheard)?hq.overheard:[];
    if(!hq.visited.includes(id))hq.visited.push(id);if(id==='cafe'&&!hq.overheard.includes('equal-status-rumour'))hq.overheard.push('equal-status-rumour');
    if(id==='engineering')changed.relationships.nellBond+=1;if(id==='trophies')changed.identity.fire+=1;if(id==='cafe')changed.identity.focus+=1;if(id==='sponsors')changed.relationships.quickquillTrust+=1;
    changed.history=[...(changed.history||[]),{scene:'q67',event:'verdict-hq-visit',target:id}].slice(-140);state.story=changed;state.verdictModal=id;state.verdictTransient=VERDICT_HQ_SPOTS[id].text;await persistStory(changed,{stageOverride:'quickquill-verdict'});render();
  }

  async function verdictCallBoardroom(){
    if(state.storySaving)return;
    const changed=cloneValue(state.story),hq=changed.chapter7.hq;
    if((hq.visited||[]).length<Number(hq.required||3))return;
    hq.boardCalled=true;
    changed.history=[...(changed.history||[]),{scene:'q67',event:'boardroom-called'}].slice(-140);
    state.story=changed;state.storyError='';render();
    try{await persistStory(changed,{stageOverride:'quickquill-verdict'});}catch(error){state.storyError=error?.message||'The boardroom transition could not be saved. You can continue and try again.';}
    render();
  }

  function verdictReviewCards(story=state.story){
    const record=verdictWeekendRecord(story),evo=syncCareerEvolution(story),c4=chapter4State(story),c5=chapter5State(story);
    return [
      {id:'results',kicker:'RESULTS',title:'THREE RACES',value:`LUMERRE · P${record.raceFinishPosition||7}`,text:`Canto ${ordinal(story.race?.result?.rank||6)} · Blackglass ${ordinal(story.blackglassRace?.result?.rank||6)} · Lumerre ${ordinal(record.raceFinishPosition||7)}. Quickquill sees a trend, not one headline.`},
      {id:'racecraft',kicker:'RACECRAFT',title:evo.playerStyle||'Developing',value:`${Math.round(Number(evo.racecraft?.overtaking||0)+Number(evo.racecraft?.technicalUnderstanding||0))} SIGNAL`,text:`Starts, overtaking, technical understanding and stamina management are now being judged as a professional profile rather than academy notes.`},
      {id:'team',kicker:'TEAM',title:'QUICKQUILL TRUST',value:String(Math.round(Number(story.relationships?.quickquillTrust||50))),text:`Mara weighs how you handled Blackglass, Lumerre team orders and the moments nobody put on television.`},
      {id:'media',kicker:'PROFILE',title:'PUBLIC PRESSURE',value:String(c5.media?.reputation||'Developing').toUpperCase(),text:`The press file now travels with you. Lumerre made the question less “can they race?” and more “who gets them next?”`}
    ];
  }

  async function verdictReviewCard(id){
    if(state.storySaving)return;const changed=cloneValue(state.story),review=changed.chapter7.review,cards=verdictReviewCards(changed);if(!cards.some(c=>c.id===id))return;review.seen=Array.isArray(review.seen)?review.seen:[];if(!review.seen.includes(id))review.seen.push(id);review.completed=review.seen.length>=3;changed.history=[...(changed.history||[]),{scene:'q68',event:'verdict-review-card',target:id}].slice(-140);state.story=changed;state.verdictModal=id;state.verdictTransient=cards.find(c=>c.id===id)?.text||'';await persistStory(changed,{stageOverride:'quickquill-verdict'});render();
  }

  async function verdictToggleDemand(id){
    if(state.storySaving)return;const changed=cloneValue(state.story),offer=verdictOfferEnsure(changed),selected=offer.selectedDemands=Array.isArray(offer.selectedDemands)?offer.selectedDemands:[];if(!verdictDemandDefinition(id,changed))return;
    const at=selected.indexOf(id);if(at>=0)selected.splice(at,1);else if(selected.length<2)selected.push(id);else{state.verdictTransient='You only get two asks. Decide what actually matters.';render();return;}
    state.story=changed;state.verdictTransient='';render();
  }

  async function verdictSubmitNegotiation(){
    if(state.storySaving||state.verdictSubmitting)return;const changed=cloneValue(state.story),offer=verdictOfferEnsure(changed),selected=[...(offer.selectedDemands||[])];
    const record=verdictWeekendRecord(changed),trust=Number(changed.relationships?.quickquillTrust||50),finish=Number(record.raceFinishPosition||7);let leverage=3+(trust>=56?1:0)+(finish<=3?1:0)+(finish===1?1:0);
    const demands=selected.map(id=>verdictDemandDefinition(id,changed)).filter(Boolean);const total=demands.reduce((sum,d)=>sum+d.cost,0);let accepted=[...selected],rejected=[];
    if(total>leverage&&demands.length){const ranked=[...demands].sort((a,b)=>b.cost-a.cost);const cut=ranked[0];accepted=selected.filter(id=>id!==cut.id);rejected=[cut.id];offer.countered=true;}
    accepted.forEach(id=>verdictApplyDemand(offer,id,changed));offer.acceptedDemands=accepted;offer.rejectedDemands=rejected;offer.negotiationRounds=Number(offer.negotiationRounds||0)+1;offer.status=rejected.length?'counter':'agreed';
    if(accepted.includes('role'))changed.relationships.quickquillTrust-=1;if(accepted.includes('sponsor'))changed.identity.focus+=1;if(accepted.includes('bonus'))changed.identity.fire+=1;if(!selected.length)changed.relationships.quickquillTrust+=1;
    const resultText=rejected.length?`Mara accepts ${accepted.length||'none'} of the asks and holds the line on ${verdictDemandDefinition(rejected[0],changed)?.title||'one clause'}. That is the counter-offer.`:'Mara reads it once. “Fine. Put it in.” The revised terms are accepted.';
    changed.history=[...(changed.history||[]),{scene:'q70',event:'contract-negotiation',requested:selected,accepted,rejected,leverage}].slice(-140);
    state.verdictSubmitting=true;state.storyError='';state.verdictTransient='Mara and Nell are checking the revised terms…';render();
    try{
      await persistStory(changed,{stageOverride:'quickquill-verdict'});
      state.verdictTransient=resultText;
    }catch(error){
      state.storyError=error?.message||'The revised terms could not be saved. Your selections are still here—submit them again.';
      state.verdictTransient='';
    }finally{
      state.verdictSubmitting=false;
      render();
    }
  }

  async function verdictOutsideInterest(id){
    if(state.storySaving)return;const changed=cloneValue(state.story),outside=changed.chapter7.outsideInterest;outside.discovered=true;outside.response=id;
    if(id==='hear'){changed.relationships.sunscaleInterest+=4;changed.relationships.quickquillTrust-=1;}
    else if(id==='tell'){changed.relationships.quickquillTrust+=3;changed.relationships.maraBond+=1;}
    else {changed.relationships.quickquillTrust+=1;}
    changed.history=[...(changed.history||[]),{scene:'q71',event:'sunscale-contract-interest',response:id}].slice(-140);state.story=changed;state.verdictTransient=id;await persistStory(changed,{stageOverride:'quickquill-verdict'});render();
  }

  async function verdictTyreseChoice(id){
    if(state.storySaving)return;const changed=cloneValue(state.story);changed.chapter7.tyreseChoice=id;
    if(id==='team'){changed.relationships.tyreseBond+=3;changed.relationships.quickquillTrust+=1;}
    else if(id==='equal'){changed.relationships.tyreseBond+=1;const evo=syncCareerEvolution(changed);evo.tyrese.competitiveTension=clampCareerValue(evo.tyrese.competitiveTension+3);changed.careerEvolution=evo;}
    else {changed.relationships.tyreseBond+=1;changed.identity.fire+=2;const evo=syncCareerEvolution(changed);evo.tyrese.competitiveTension=clampCareerValue(evo.tyrese.competitiveTension+6);changed.careerEvolution=evo;}
    changed.history=[...(changed.history||[]),{scene:'q72',event:'tyrese-contract-talk',choice:id}].slice(-140);state.story=changed;state.verdictTransient=id;await persistStory(changed,{stageOverride:'quickquill-verdict'});render();
  }

  async function verdictDecision(id){
    if(state.storySaving)return;const changed=cloneValue(state.story),c7=changed.chapter7,offer=verdictOfferEnsure(changed);c7.decision=id;
    if(id==='sign'){c7.signed=true;c7.signedAt=new Date().toISOString();offer.status='signed';changed.relationships.quickquillTrust+=4;}
    else if(id==='time'){offer.status='held-24h';changed.relationships.maraBond+=1;}
    else if(id==='sunscale'&&c7.outsideInterest?.response==='hear'){offer.status='external-talks';changed.relationships.sunscaleInterest+=3;}
    else return;
    changed.history=[...(changed.history||[]),{scene:'q73',event:'verdict-decision',decision:id,role:offer.role,length:offer.length}].slice(-140);state.story=changed;state.verdictTransient=id;await persistStory(changed,{stageOverride:'quickquill-verdict'});render();
  }

  async function finishVerdictChapter(){
    if(state.storySaving)return;const changed=cloneValue(state.story),c7=changed.chapter7;if(!c7.decision)return;c7.completed=true;c7.completedAt=new Date().toISOString();changed.completed={...(changed.completed||{}),verdict:true};changed.chapter='season-one';careerRegisterChapterType(changed,'politics');changed.history=[...(changed.history||[]),{scene:'q74',event:'verdict-chapter-complete',decision:c7.decision,contractStatus:c7.offer?.status||''}].slice(-140);state.story=changed;
    await persistStory(changed,{stageOverride:'quickquill-verdict-complete'});state.mode='story-journey';state.verdictTransient='';state.verdictModal='';render();syncMusic({restart:true});
  }

  function verdictShell(scene,idx,body,extra=''){
    const progress=((idx+1)/QUICKQUILL_VERDICT_SCENES.length)*100;
    return `<section class="verdict-shell tone-${escapeHtml(scene.tone||'verdict')} ${extra}"><img class="verdict-backdrop" src="${scene.background}" alt="" aria-hidden="true"><div class="verdict-stage"><img class="verdict-environment" src="${scene.background}" alt="${escapeHtml(scene.title)}"><div class="verdict-wash" aria-hidden="true"></div><div class="verdict-grain" aria-hidden="true"></div><header class="verdict-header"><div><small>QUICKQUILL: AGAINST THE ODDS</small><strong>${escapeHtml(scene.number)} · ${escapeHtml(scene.title)}</strong><span>${escapeHtml(scene.location)}</span></div><button type="button" data-verdict-hub>BACK TO HUB</button></header><div class="verdict-progress"><i style="--story-progress:${progress}%"></i><span>THE VERDICT ${idx+1} / ${QUICKQUILL_VERDICT_SCENES.length}</span></div>${state.storyError?`<div class="verdict-error" role="alert"><strong>CAREER SAVE</strong><span>${escapeHtml(state.storyError)}</span></div>`:''}${body}</div><div class="verdict-vignette" aria-hidden="true"></div></section><div class="blackout ${state.blackout?'is-visible':''}" aria-hidden="true"></div>`;
  }

  function renderVerdictArrival(scene,idx,story,c7){
    const record=verdictWeekendRecord(story),choice=c7.arrivalChoice,introStep=choice?2:Math.max(0,Math.min(2,Number(c7.introStep)||0));const reactions={quiet:'Mara notices you read the room before saying anything. “Good. Keep doing that.”',joke:'Tyrese: “If this is about my parking, I already deny it.” Nell almost smiles.',ready:'Nell: “Good. The board will appreciate that.”'};
    let body='';
    if(introStep===0){
      body=`<main class="verdict-summons"><section class="verdict-summons-copy"><small>MONDAY · 08:43 · OUTSIDE QUICKQUILL HQ</small><h1>THREE LINES. ONE MEETING.</h1><p>The Quickquill envelope has been in your kit bag since Lumerre. No celebration and no threat.</p><blockquote><b>END-OF-ASSESSMENT REVIEW</b><span>Quickquill boardroom · Monday · 09:00</span><em>Mara Venn, Team Principal</em></blockquote><p>This is not a signing appointment. Quickquill called you back to decide what your first three races mean—and whether there is a future to discuss.</p><button type="button" data-verdict-intro="1">WALK INTO HQ</button></section></main>`;
    }else if(introStep===1){
      body=`<main class="verdict-foyer"><section class="verdict-foyer-copy"><small>08:51 · QUICKQUILL RECEPTION</small><h1>FIRST, THE ASSESSMENT.</h1><div class="verdict-foyer-dialogue"><p><b>TYRESE</b> “You got the same three-line summons, then.”</p><p><b>NELL</b> “Canto, Blackglass and Lumerre go on the record first. What comes after depends on the room.”</p></div><p class="verdict-foyer-note">Mara is upstairs with the board. Nell asks you to wait outside until the performance file is ready.</p><button type="button" data-verdict-intro="2">WAIT OUTSIDE THE BOARDROOM</button></section></main>`;
    }else{
      body=`<main class="verdict-arrival"><section class="verdict-kicker"><small>MONDAY · 08:58 · OUTSIDE THE BOARDROOM</small><h1>THEY ARE DECIDING WHAT COMES NEXT.</h1><p>${escapeHtml(verdictImpactLine(story))}</p></section><div class="verdict-arrival-ticker"><span>LUMERRE · P${record.raceFinishPosition||7}</span><span>TYRESE · P${record.tyreseFinish||7}</span><span>QUICKQUILL TRUST · ${Math.round(Number(story.relationships?.quickquillTrust||50))}</span></div>${!choice?`<section class="verdict-arrival-choices"><button type="button" data-verdict-arrival="quiet"><b>READ THE ROOM</b><small>Let the board speak first.</small></button><button type="button" data-verdict-arrival="joke"><b>BREAK THE TENSION</b><small>Tyrese is waiting beside you.</small></button><button type="button" data-verdict-arrival="ready"><b>GET TO IT</b><small>You are ready for the review.</small></button></section>`:`<section class="verdict-inline-reaction"><p>${escapeHtml(reactions[choice]||'')}</p><button type="button" data-verdict-next="q67">MARA IS RUNNING TEN MINUTES LATE</button></section>`}</main>`;
    }
    root.innerHTML=verdictShell(scene,idx,body,'is-arrival');
  }

  function renderVerdictHq(scene,idx,story,c7){
    const visited=new Set(c7.hq?.visited||[]),required=Number(c7.hq?.required||3),boardCalled=!!c7.hq?.boardCalled;const spots=Object.entries(VERDICT_HQ_SPOTS);
    const body=`<main class="verdict-hq ${boardCalled?'is-board-called':''}"><section class="verdict-hq-copy"><small>ASSESSMENT REVIEW DELAYED · TEN MINUTES</small><h1>Quickquill keeps moving while the board decides.</h1><p>You were summoned for a three-race review. While Mara finishes upstairs, notice ${required} things that show what joining this team would actually mean.</p></section><div class="verdict-hq-spots">${spots.map(([id,row],i)=>`<button type="button" data-verdict-hq-spot="${id}" class="${visited.has(id)?'is-seen':''}" style="--vx:${[17,37,56,75,86][i]}%;--vy:${[64,39,72,43,60][i]}%"><b>${escapeHtml(row.title)}</b><small>${escapeHtml(row.note)}</small><i>${visited.has(id)?'✓':'+'}</i></button>`).join('')}</div>${state.verdictModal?`<aside class="verdict-popover"><button type="button" data-verdict-close>×</button><small>${escapeHtml(VERDICT_HQ_SPOTS[state.verdictModal]?.title||'QUICKQUILL')}</small><p>${escapeHtml(state.verdictTransient||'')}</p></aside>`:''}${boardCalled?`<aside class="verdict-board-call"><small>09:08 · NELL WREN</small><h2>“They are ready for you.”</h2><p>“This starts with the assessment. If Mara puts a contract on the table afterward, it is because the review gave her a reason.”</p><button type="button" data-verdict-next="q68">ENTER THE BOARDROOM</button></aside>`:`<footer><span>${visited.size} / ${required} MOMENTS</span><button type="button" data-verdict-board-call ${visited.size<required?'disabled':''}>${visited.size<required?'KEEP WAITING':'NELL IS HERE'}</button></footer>`}</main>`;
    root.innerHTML=verdictShell(scene,idx,body,'is-hq');
  }

  function renderVerdictReview(scene,idx,story,c7){
    const cards=verdictReviewCards(story),seen=new Set(c7.review?.seen||[]);const body=`<main class="verdict-review"><section class="verdict-review-head"><small>09:10 · MARA VENN · ASSESSMENT REVIEW</small><h1>This is why you were called back.</h1><p>“Your three-race assessment is complete. First we put the evidence on record. If it matches what we think we saw, then we discuss keeping you.” Open any three files.</p></section><div class="verdict-review-grid">${cards.map(card=>`<button type="button" data-verdict-review="${card.id}" class="${seen.has(card.id)?'is-seen':''}"><small>${escapeHtml(card.kicker)}</small><strong>${escapeHtml(card.title)}</strong><b>${escapeHtml(card.value)}</b><span>${seen.has(card.id)?'READ':'OPEN FILE'}</span></button>`).join('')}</div>${state.verdictModal?`<aside class="verdict-review-detail"><button type="button" data-verdict-close>×</button><p>${escapeHtml(state.verdictTransient||'')}</p></aside>`:''}<button type="button" class="verdict-primary" data-verdict-next="q69" ${seen.size<3?'disabled':''}>FINISH THE REVIEW</button></main>`;root.innerHTML=verdictShell(scene,idx,body,'is-review');
  }

  function verdictOfferRows(story){const o=verdictOfferEnsure(story);return [['TEAM ROLE',o.role],['TERM',`${o.length} ${o.length===1?'SEASON':'SEASONS'}`],['PODIUM BONUS',`${Number(o.podiumBonus||0).toLocaleString('en-GB')} GP`],['SPONSOR DAYS',`${o.sponsorDays} / SEASON`]];}

  function renderVerdictOffer(scene,idx,story,c7){
    const offer=verdictOfferEnsure(story),rows=verdictOfferRows(story);const record=verdictWeekendRecord(story);const body=`<main class="verdict-offer"><section class="verdict-contract-paper"><header><small>ASSESSMENT COMPLETE · QUICKQUILL RACING CONTRACT OFFER</small><h1>${escapeHtml(storyDragonName().toUpperCase())}</h1><p>${escapeHtml(verdictImpactLine(story))}</p></header><div class="verdict-contract-rows">${rows.map(([k,v])=>`<span><small>${escapeHtml(k)}</small><strong>${escapeHtml(String(v))}</strong></span>`).join('')}</div><footer><span>MARA VENN · TEAM PRINCIPAL</span><span>LUMERRE RESULT · P${record.raceFinishPosition||7}</span></footer></section><aside class="verdict-offer-note"><small>MARA</small><p>“That concludes the review. Quickquill wants to keep you as a professional racer. This is our first offer—not a loyalty test. If something needs changing, say it while everybody is in the room.”</p><button type="button" data-verdict-next="q70">REVIEW THE TERMS</button></aside></main>`;root.innerHTML=verdictShell(scene,idx,body,'is-offer');
  }

  function renderVerdictNegotiate(scene,idx,story,c7){
    const offer=verdictOfferEnsure(story),done=['agreed','counter','signed','held-24h','external-talks'].includes(offer.status),submitting=!!state.verdictSubmitting,selected=new Set(offer.selectedDemands||[]),defs=['role','length','bonus','sponsor'].map(id=>verdictDemandDefinition(id,story));const rows=verdictOfferRows(story);
    const body=`<main class="verdict-negotiate"><section class="verdict-negotiation-board"><header><small>YOUR TURN · MAXIMUM TWO ASKS</small><h1>${done?'REVISED TERMS':submitting?'QUICKQUILL IS REVIEWING IT':'WHAT ACTUALLY MATTERS?'}</h1><p>${done?escapeHtml(state.verdictTransient||'The contract is ready to leave the room.'):submitting?escapeHtml(state.verdictTransient||'Mara and Nell are checking the revised terms…'):'Pick zero, one or two clauses, then submit them. Quickquill will answer before you leave the room.'}</p></header>${!done?`<div class="verdict-demand-grid ${submitting?'is-submitting':''}">${defs.map(d=>`<button type="button" data-verdict-demand="${d.id}" class="${selected.has(d.id)?'is-selected':''}" ${submitting?'disabled':''}><small>${escapeHtml(d.title)}</small><span>${escapeHtml(d.from)} <i>→</i> ${escapeHtml(d.to)}</span><p>${escapeHtml(d.note)}</p><b>${selected.has(d.id)?'SELECTED':'ASK'}</b></button>`).join('')}</div><div class="verdict-negotiation-actions"><span>${selected.size} / 2 asks</span><button type="button" data-verdict-submit ${submitting?'disabled':''}>${submitting?'SUBMITTING…':'SUBMIT TERMS'}</button></div>`:`<div class="verdict-revised-terms">${rows.map(([k,v])=>`<span><small>${escapeHtml(k)}</small><b>${escapeHtml(String(v))}</b></span>`).join('')}</div><div class="verdict-counter-note"><strong>${offer.rejectedDemands?.length?'COUNTER-OFFER':'ACCEPTED'}</strong><p>${escapeHtml(state.verdictTransient||'Terms recorded.')}</p></div><button type="button" class="verdict-primary" data-verdict-next="q71">CONTINUE · LEAVE BOARDROOM</button>`}</section></main>`;root.innerHTML=verdictShell(scene,idx,body,'is-contract');
  }

  function renderVerdictInterest(scene,idx,story,c7){
    const out=c7.outsideInterest||{},response=out.response;const body=`<main class="verdict-interest"><section class="verdict-phone"><small>09:41 · UNKNOWN PADDOCK NUMBER</small><div class="verdict-message"><b>SUNSCALE RACING</b><p>Jalen’s management asked whether your Quickquill contract is already signed. No offer. No meeting request. Just the question.</p></div>${!response?`<div class="verdict-message-actions"><button data-verdict-interest="hear"><b>HEAR THEM OUT</b><small>Keep the door open.</small></button><button data-verdict-interest="tell"><b>SHOW MARA</b><small>No games with your own team.</small></button><button data-verdict-interest="ignore"><b>ARCHIVE IT</b><small>Not every rumour deserves oxygen.</small></button></div>`:`<div class="verdict-message-result"><strong>${response==='hear'?'DOOR LEFT OPEN':response==='tell'?'MARA NOW KNOWS':'MESSAGE ARCHIVED'}</strong><p>${response==='hear'?'You reply with one line: “Not signed yet.” Nothing more.':response==='tell'?'Mara reads it and hands the phone back. “Good. Now you know why the meeting was today.”':'You lock the screen. The question still exists, just not in the room.'}</p><button data-verdict-next="q72">FIND TYRESE</button></div>`}</section></main>`;root.innerHTML=verdictShell(scene,idx,body,'is-interest');
  }

  function renderVerdictTyrese(scene,idx,story,c7){
    const record=verdictWeekendRecord(story),offer=verdictOfferEnsure(story),choice=c7.tyreseChoice;let opener=`Tyrese reads the words “${offer.role}” and gives the contract back.`;if(record.raceFinishPosition<record.tyreseFinish)opener='Tyrese looks over the roof instead of at you. “You beat me at Lumerre. So this bit was always coming.”';
    const responses={team:'“Good,” Tyrese says. “Then be useful when the lights are out and unbearable when they are on.”',equal:'Tyrese nods once. “Equal machinery. Equal excuses. I can live with that.”',lead:'Tyrese laughs, properly this time. “There you are. Took seven chapters.”'};
    const body=`<main class="verdict-tyrese"><section class="verdict-walktalk"><div class="verdict-tyrese-copy"><small>ROOFTOP · NO BOARD MEMBERS</small><p>${escapeHtml(opener)}</p><p>“I only care about one thing. What do you actually think this is now?”</p>${!choice?`<div><button data-verdict-tyrese="team">WE'RE A TEAM</button><button data-verdict-tyrese="equal">I WANT EQUAL MACHINERY</button><button data-verdict-tyrese="lead">I WANT YOUR SEAT EVENTUALLY</button></div>`:`<aside>${escapeHtml(responses[choice]||'')}</aside><button class="verdict-primary" data-verdict-next="q73">BACK TO THE LOCKER</button>`}</div><div class="verdict-tyrese-reaction">${portraitMarkup({character:'tyrese',frame:choice==='lead'?8:choice==='team'?7:6,side:'right'})}</div></section></main>`;root.innerHTML=verdictShell(scene,idx,body,'is-tyrese');
  }

  function verdictDecisionSummary(c7){const o=c7.offer||{};if(c7.decision==='sign')return `Quickquill · ${o.role} · ${o.length} ${o.length===1?'season':'seasons'} · signed.`;if(c7.decision==='time')return 'Quickquill holds the revised terms for 24 hours. The career continues with the decision still yours.';if(c7.decision==='sunscale')return 'You leave Quickquill unsigned and agree to hear what Sunscale actually wants. Interest is not a transfer.';return '';}

  function renderVerdictDecision(scene,idx,story,c7){
    const offer=verdictOfferEnsure(story),decision=c7.decision,canSun=c7.outsideInterest?.response==='hear';const body=`<main class="verdict-decision"><section class="verdict-locker-line"><small>THE SAME EMPTY LOCKER · DIFFERENT QUESTION</small><h1>${escapeHtml(storyDragonName())} is no longer asking to stay.</h1><p>The first contract was three races to prove you belonged. This one is about what you want belonging to mean.</p></section>${!decision?`<div class="verdict-decision-grid"><button data-verdict-decision="sign"><b>SIGN QUICKQUILL</b><small>${escapeHtml(offer.role)} · ${offer.length} ${offer.length===1?'season':'seasons'}</small></button><button data-verdict-decision="time"><b>ASK FOR 24 HOURS</b><small>Do not sign because the room expects it.</small></button><button data-verdict-decision="sunscale" ${canSun?'':'disabled'}><b>HEAR OUT SUNSCALE</b><small>${canSun?'Leave unsigned and take the call.':'No open conversation with Sunscale.'}</small></button></div>`:`<section class="verdict-signature-result"><small>DECISION RECORDED</small><h2>${decision==='sign'?'QUICKQUILL SIGNED':decision==='time'?'NO SIGNATURE — YET':'SUNSCALE CONVERSATION OPEN'}</h2><p>${escapeHtml(verdictDecisionSummary(c7))}</p><button data-verdict-next="q74">LEAVE THE ROOM</button></section>`}</main>`;root.innerHTML=verdictShell(scene,idx,body,'is-decision');
  }

  function renderVerdictFinale(scene,idx,story,c7){
    const o=verdictOfferEnsure(story),record=verdictWeekendRecord(story),next=c7.decision==='sign'?'FIRST FULL PROFESSIONAL SEASON':c7.decision==='sunscale'?'THE PADDOCK OPENS':'TWENTY-FOUR HOURS';const body=`<main class="verdict-finale"><section class="verdict-finale-card"><small>CHAPTER SEVEN COMPLETE</small><h1>THE VERDICT</h1><p>A career is now something you can negotiate, delay or redirect.</p><div class="verdict-final-grid"><span><small>LUMERRE</small><b>P${record.raceFinishPosition||7}</b></span><span><small>CONTRACT</small><b>${escapeHtml(String(o.status||'').replaceAll('-',' ').toUpperCase())}</b></span><span><small>ROLE</small><b>${escapeHtml(o.role||'—')}</b></span><span><small>TERM</small><b>${o.length||2} ${o.length===1?'SEASON':'SEASONS'}</b></span><span><small>OUTSIDE INTEREST</small><b>${c7.outsideInterest?.response==='hear'?'SUNSCALE OPEN':c7.outsideInterest?.response==='tell'?'DECLARED':'CLOSED'}</b></span><span><small>TYRESE</small><b>${escapeHtml(String(c7.tyreseChoice||'UNSAID').toUpperCase())}</b></span></div><div class="verdict-next"><small>NEXT</small><strong>${escapeHtml(next)}</strong><span>Calendar · objectives · standings · rivalries · contracts</span></div><button data-verdict-finish>COMPLETE CHAPTER SEVEN</button></section></main>`;root.innerHTML=verdictShell(scene,idx,body,'is-finale');
  }

  function renderVerdict(scene,beat,idx){
    const story=state.story,c7=verdictState(story);verdictOfferEnsure(story);
    if(beat.type==='verdict-arrival')renderVerdictArrival(scene,idx,story,c7);
    else if(beat.type==='verdict-hq-hub')renderVerdictHq(scene,idx,story,c7);
    else if(beat.type==='verdict-board-review')renderVerdictReview(scene,idx,story,c7);
    else if(beat.type==='verdict-offer')renderVerdictOffer(scene,idx,story,c7);
    else if(beat.type==='verdict-negotiate')renderVerdictNegotiate(scene,idx,story,c7);
    else if(beat.type==='verdict-interest')renderVerdictInterest(scene,idx,story,c7);
    else if(beat.type==='verdict-tyrese')renderVerdictTyrese(scene,idx,story,c7);
    else if(beat.type==='verdict-decision')renderVerdictDecision(scene,idx,story,c7);
    else renderVerdictFinale(scene,idx,story,c7);
    root.querySelector('[data-verdict-hub]')?.addEventListener('click',returnToHubFromStory);
    root.querySelectorAll('[data-verdict-next]').forEach(btn=>btn.addEventListener('click',()=>{void verdictGo(btn.dataset.verdictNext||'q74');}));
    root.querySelectorAll('[data-verdict-intro]').forEach(btn=>btn.addEventListener('click',()=>{void verdictAdvanceIntro(btn.dataset.verdictIntro||'0');}));
    root.querySelectorAll('[data-verdict-arrival]').forEach(btn=>btn.addEventListener('click',()=>{void verdictArrivalChoice(btn.dataset.verdictArrival||'quiet');}));
    root.querySelectorAll('[data-verdict-hq-spot]').forEach(btn=>btn.addEventListener('click',()=>{void verdictVisitHq(btn.dataset.verdictHqSpot||'');}));
    root.querySelector('[data-verdict-board-call]')?.addEventListener('click',()=>{void verdictCallBoardroom();});
    root.querySelectorAll('[data-verdict-review]').forEach(btn=>btn.addEventListener('click',()=>{void verdictReviewCard(btn.dataset.verdictReview||'');}));
    root.querySelector('[data-verdict-close]')?.addEventListener('click',()=>{state.verdictModal='';state.verdictTransient='';render();});
    root.querySelectorAll('[data-verdict-demand]').forEach(btn=>btn.addEventListener('click',()=>{void verdictToggleDemand(btn.dataset.verdictDemand||'');}));
    root.querySelector('[data-verdict-submit]')?.addEventListener('click',()=>{void verdictSubmitNegotiation();});
    root.querySelectorAll('[data-verdict-interest]').forEach(btn=>btn.addEventListener('click',()=>{void verdictOutsideInterest(btn.dataset.verdictInterest||'ignore');}));
    root.querySelectorAll('[data-verdict-tyrese]').forEach(btn=>btn.addEventListener('click',()=>{void verdictTyreseChoice(btn.dataset.verdictTyrese||'team');}));
    root.querySelectorAll('[data-verdict-decision]').forEach(btn=>btn.addEventListener('click',()=>{void verdictDecision(btn.dataset.verdictDecision||'');}));
    root.querySelector('[data-verdict-finish]')?.addEventListener('click',()=>{void finishVerdictChapter();});
  }

  function seasonState(story=state.story){
    const base=defaultQuickquillStory().chapter8,c8=story?.chapter8||{};
    const baseChamp=base.championship||{},champ=c8.championship||{},baseRounds=baseChamp.rounds||{},rounds=champ.rounds||{};
    return {
      ...base,...c8,
      calendar:{...base.calendar,...(c8.calendar||{})},
      weeklyPlan:{...base.weeklyPlan,...(c8.weeklyPlan||{}),allocations:{...base.weeklyPlan.allocations,...(c8.weeklyPlan?.allocations||{})},readiness:{...base.weeklyPlan.readiness,...(c8.weeklyPlan?.readiness||{})}},
      telemetry:{...base.telemetry,...(c8.telemetry||{})},
      pitwall:{...base.pitwall,...(c8.pitwall||{})},
      objectives:{...base.objectives,...(c8.objectives||{})},
      championship:{
        ...baseChamp,...champ,
        points:{...(baseChamp.points||{}),...(champ.points||{})},
        rounds:{
          ...baseRounds,...rounds,
          velmora:{
            ...(baseRounds.velmora||{}),...(rounds.velmora||{}),
            qualifyingGrid:Array.isArray(rounds.velmora?.qualifyingGrid)?rounds.velmora.qualifyingGrid.slice(0,7).map(row=>({...row})):[],
            result:rounds.velmora?.result&&typeof rounds.velmora.result==='object'?cloneValue(rounds.velmora.result):null
          }
        }
      }
    };
  }

  function seasonActivityCost(id,story=state.story){if(id==='sponsor'&&Number(story?.chapter7?.offer?.sponsorDays||6)<=4)return 1;return SEASON_PLAN_ACTIVITIES[id]?.cost||0;}
  function seasonPlanSpent(plan,story=state.story){return Object.entries(plan?.allocations||{}).reduce((sum,[id,count])=>sum+seasonActivityCost(id,story)*Math.max(0,Number(count)||0),0);}
  function seasonReadiness(plan){
    const result={pace:50,control:50,stamina:50,bond:50,team:50};
    Object.entries(plan?.allocations||{}).forEach(([id,count])=>{const effects=SEASON_PLAN_ACTIVITIES[id]?.effects||{};Object.entries(effects).forEach(([key,value])=>{result[key]=Math.min(100,result[key]+(Number(count)||0)*Number(value||0));});});
    return result;
  }
  function seasonPlanProfile(plan){const top=Object.entries(plan.allocations||{}).sort((a,b)=>Number(b[1])-Number(a[1]))[0];return !top||!top[1]?'UNSET':({bond:'CONNECTED',flight:'ATTACK READY',strength:'POWER WEEK',engineering:'TECHNICAL EDGE',recovery:'FRESH LEGS',sponsor:'TEAM FIRST'})[top[0]]||'BALANCED';}
  function seasonPitwallGrade(score){return score>=9?'COMMAND VOICE':score>=6?'RACE READER':'CALM HAND';}

  function seasonRoundState(c8,id='velmora'){
    const base=defaultQuickquillStory().chapter8.championship.rounds.velmora;
    return {...base,...(c8?.championship?.rounds?.[id]||{}),qualifyingGrid:Array.isArray(c8?.championship?.rounds?.[id]?.qualifyingGrid)?c8.championship.rounds[id].qualifyingGrid.slice(0,7).map(row=>({...row})):[]};
  }

  function seasonRacerLabel(id){
    if(id==='player')return `${storyDragonName()} · Quickquill`;
    const row=SEASON_RACER_META[id]||{name:id,team:''};
    return `${row.name}${row.team?` · ${row.team}`:''}`;
  }

  function seasonStandings(c8){
    const points=c8?.championship?.points||{};
    return SEASON_RACER_IDS.map((id,index)=>({id,points:Math.max(0,Number(points[id])||0),seed:index,label:seasonRacerLabel(id)}))
      .sort((a,b)=>b.points-a.points||a.seed-b.seed);
  }

  function seasonPointsForPosition(position){return Number(SEASON_POINTS[Math.max(1,Number(position)||99)-1])||0;}

  function seasonQualifyingGrid(story,c8,id='velmora'){
    const current=seasonRoundState(c8,id);
    if(current.qualifyingGrid.length===7)return current.qualifyingGrid.map(row=>({...row}));
    const profile=SEASON_RACE_PROFILES[id]||SEASON_RACE_PROFILES.velmora;
    const evolution=syncCareerEvolution(story);
    const raceWindow=careerPerformanceWindow(profile.raceNumber);
    const readiness=c8.weeklyPlan?.readiness||seasonReadiness(c8.weeklyPlan||{});
    const playerRating=78.5+(Math.max(42,Number(raceWindow.paceTarget)||42)-42)*.20+
      (Math.max(0,Number(readiness.pace)||50)-50)*.022+
      (Math.max(0,Number(readiness.control)||50)-50)*.014+
      (c8.telemetry?.correct?.55:0)+(Math.max(0,Number(c8.pitwall?.score)||0)*.035);
    const rows=[{
      id:'player',racerId:'player',name:storyDragonName(),team:'Quickquill',isPlayer:true,
      qualifyingScore:playerRating+(Math.random()-.5)*4.4,
      ai:{pace:Math.round(playerRating),consistency:80,aggression:74,defending:80,overtaking:80,stamina:Math.round(Number(readiness.stamina)||70),pressure:82,style:evolution.playerStyle||'Adaptive'}
    }];
    Object.entries(CAREER_RACER_AI).forEach(([racerId,ai])=>{
      const cityEdge=id==='velmora'?((Number(ai.aggression)||75)-75)*.010+((Number(ai.overtaking)||80)-80)*.010:0;
      const technicalEdge=id==='greenwater'?Number(ai.sectorBias?.technical||0)*.16:0;
      const pressureEdge=((Number(ai.pressure)||80)-80)*.012;
      const variance=Math.max(.8,Math.min(3.0,(106-(Number(ai.consistency)||82))/10));
      rows.push({id:racerId,racerId,name:ai.name,team:ai.team,isPlayer:false,qualifyingScore:Number(ai.pace)+cityEdge+technicalEdge+pressureEdge+(Math.random()-.5)*variance*2,ai:{...ai,sectorBias:{...(ai.sectorBias||{})}}});
    });
    rows.sort((a,b)=>b.qualifyingScore-a.qualifyingScore);
    return rows.map((row,index)=>({...row,gridPosition:index+1,position:index+1,qualifyingScore:Number(row.qualifyingScore.toFixed(2))}));
  }

  function seasonRacePlanText(id){
    return ({
      clean:{title:'BUILD THE EXIT',note:'Protect the dragon, stay off the walls and make rivals overcommit.'},
      adaptive:{title:'READ THE STREET',note:'Balanced pace. Change the race only when the gap is actually there.'},
      attack:{title:'TAKE THE LATE BRAKE',note:'Higher passing pressure and launch aggression, with more mistake exposure.'}
    })[id]||{title:'READ THE STREET',note:'Balanced pace and flexible race calls.'};
  }

  async function seasonChooseRacePlan(id){
    if(state.storySaving||!['clean','adaptive','attack'].includes(id))return;
    const changed=cloneValue(state.story),c8=seasonState(changed),round=seasonRoundState(c8,'velmora');
    if(round.status==='complete')return;
    round.strategy=id;c8.championship.rounds.velmora=round;changed.chapter8=c8;state.story=changed;state.seasonTransient='';
    try{await persistStory(changed,{stageOverride:'quickquill-season-control'});}catch(_){}
    render();
  }

  function seasonSetControlTab(id){
    if(!['weekend','championship','development'].includes(id))return;
    state.seasonControlTab=id;state.seasonTransient='';render();
  }

  async function seasonPrepareQualifying(){
    if(state.storySaving||!state.activeSave)return;
    const changed=normaliseQuickquillStory(cloneValue(state.story||activeSaveState().story)),c8=seasonState(changed),round=seasonRoundState(c8,'velmora');
    if(!c8.seasonHubUnlocked){state.storyError='Finish Opening Week and unlock Season Control first.';render();return;}
    if(round.status==='complete'){state.seasonTransient='Round One is already official.';render();return;}
    if(round.qualifyingGrid.length===7){
      if(round.status==='not-started')round.status='ready';
      c8.championship.rounds.velmora=round;changed.chapter8=c8;state.story=changed;state.seasonControlTab='weekend';
      const existingPosition=Math.max(1,round.qualifyingGrid.findIndex(row=>row.isPlayer||row.id==='player')+1);
      state.seasonTransient=`QUALIFYING ALREADY RECORDED · P${existingPosition}`;
      render();return;
    }
    const qualifyingGrid=seasonQualifyingGrid(changed,c8,'velmora');
    const startPosition=Math.max(1,qualifyingGrid.findIndex(row=>row.isPlayer||row.id==='player')+1);
    round.status='ready';round.runId='';round.qualifyingGrid=qualifyingGrid;
    c8.championship.rounds.velmora=round;changed.chapter8=c8;changed.chapter='season-one';changed.scene='q80';changed.beat=0;
    changed.history=[...(changed.history||[]),{scene:'q80',event:'season-round-one-qualifying',startPosition}].slice(-160);
    state.story=changed;state.seasonControlTab='weekend';state.seasonTransient=`QUALIFYING COMPLETE · P${startPosition}`;
    try{await persistStory(changed,{stageOverride:'quickquill-season-control'});render();}
    catch(error){state.storySaving=false;state.storyError=error?.message||'Qualifying could not be saved. Your Opening Week is safe.';render();}
  }

  async function launchSeasonRoundOne(){
    if(state.storySaving||!state.activeSave)return;
    const changed=normaliseQuickquillStory(cloneValue(state.story||activeSaveState().story)),c8=seasonState(changed),profile=SEASON_RACE_PROFILES.velmora;
    const round=seasonRoundState(c8,'velmora');
    if(!c8.seasonHubUnlocked){state.storyError='Finish Opening Week and unlock Season Control first.';render();return;}
    if(round.status==='complete'){state.seasonTransient='Round One is already in the championship record.';render();return;}
    if(round.qualifyingGrid.length!==7){
      state.seasonTransient='Qualifying comes first. Run the Saturday session before going to the grid.';
      state.seasonControlTab='weekend';render();return;
    }
    const qualifyingGrid=round.qualifyingGrid.map(row=>({...row}));
    const startPosition=Math.max(1,qualifyingGrid.findIndex(row=>row.isPlayer||row.id==='player')+1);
    const runId=String(round.runId||`season-01-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
    round.status='in-progress';round.runId=runId;round.presentationMode=c8.raceMode||'watch';round.strategy=['clean','adaptive','attack'].includes(round.strategy)?round.strategy:'adaptive';round.qualifyingGrid=qualifyingGrid;
    c8.championship.rounds.velmora=round;c8.championship.currentRound=1;changed.chapter8=c8;changed.chapter='season-one';changed.scene='q80';changed.beat=0;
    changed.history=[...(changed.history||[]),{scene:'q80',event:'season-round-one-grid',runId,startPosition,mode:round.presentationMode,strategy:round.strategy}].slice(-160);
    try{
      await persistStory(changed,{stageOverride:'quickquill-season-round-1'});
      state.story=changed;state.storyError='';state.seasonTransient='';
      sendParent('dragonbound-career-story-race-start',{
        careerSaveId:state.activeSave.id,
        runId,
        raceKey:'season-01-velmora',
        seasonRound:1,
        seasonRoundId:'velmora',
        raceNumber:profile.raceNumber,
        trackId:profile.trackId,
        accountKey:accountKey(username()),
        playerKey:accountKey(username()),
        playerName:storyDragonName(),
        strategy:'focus',
        seasonStrategy:round.strategy,
        presentationMode:round.presentationMode,
        startPosition,
        qualifyingGrid:qualifyingGrid.map(row=>({name:row.name,position:row.gridPosition,id:row.id})),
        entrants:qualifyingGrid.map(row=>({...row})),
        openingReadiness:{...(c8.weeklyPlan?.readiness||{})},
        telemetryCorrect:!!c8.telemetry?.correct,
        pitwallScore:Math.max(0,Number(c8.pitwall?.score)||0),
        pitwallGrade:String(c8.pitwall?.grade||''),
        seasonAmbition:String(c8.calendar?.ambition||''),
        seasonProfile:{...profile},
        careerEvolution:careerEvolutionRaceConfig(changed,profile.raceNumber)
      });
      render();
    }catch(error){
      console.error('[Dragonbound Career Mode] Season Round One launch failed',error);
      state.storySaving=false;state.storyError=error?.message||'Velmora City Circuit could not be prepared. Your qualifying result and Opening Week are safe.';render();
    }
  }

  function seasonClassificationRows(result={}){
    const rows=Array.isArray(result.classification)?result.classification:Array.isArray(result.standings)?result.standings:[];
    return rows.slice(0,7).map((row,index)=>{
      const raw=String(row?.id||row?.racerId||'').replace(/^story-/,'');
      const id=raw==='player'||row?.isPlayer?'player':raw;
      return {id,racerId:id,name:String(row?.name||seasonRacerLabel(id).split(' · ')[0]),rank:Math.max(1,Number(row?.rank||row?.position)||index+1),position:Math.max(1,Number(row?.rank||row?.position)||index+1),isPlayer:id==='player',finishMs:Math.max(0,Number(row?.finishMs)||0),bestLapMs:Math.max(0,Number(row?.bestLapMs)||0),gridPosition:Math.max(1,Number(row?.gridPosition)||index+1)};
    }).sort((a,b)=>a.rank-b.rank);
  }

  async function acceptSeasonRaceResult(result={}){
    if(!state.activeSave||state.storySaving)return;
    if(!(String(result.raceKey||'').startsWith('season-')||Number(result.seasonRound)===1||result.trackId==='velmora_city_circuit'&&state.story?.chapter==='season-one'))return;
    const story=normaliseQuickquillStory(state.story||activeSaveState().story),c8Current=seasonState(story),current=seasonRoundState(c8Current,'velmora');
    if(current.status==='complete')return;
    if(result.careerSaveId&&String(result.careerSaveId)!==String(state.activeSave.id))return;
    if(current.runId&&result.runId&&String(current.runId)!==String(result.runId))return;
    const changed=cloneValue(story),c8=seasonState(changed),round=seasonRoundState(c8,'velmora');
    const classification=seasonClassificationRows(result);
    const playerRow=classification.find(row=>row.id==='player')||{rank:Math.max(1,Math.min(7,Number(result.rank)||7)),gridPosition:Math.max(1,Math.min(7,Number(result.startPosition)||7))};
    const rank=Math.max(1,Math.min(7,Number(playerRow.rank)||7));
    round.status='complete';round.runId='';round.completedAt=new Date().toISOString();round.presentationMode=String(result.presentationMode||round.presentationMode||c8.raceMode||'watch');
    round.result={
      rank,
      finishMs:Math.max(0,Number(result.finishMs||playerRow.finishMs)||0),
      bestLapMs:Math.max(0,Number(result.bestLapMs||playerRow.bestLapMs)||0),
      startPosition:Math.max(1,Math.min(7,Number(result.startPosition||playerRow.gridPosition)||7)),
      positionsGained:Math.max(0,Number(result.positionsGained)||Math.max(0,(Number(result.startPosition||playerRow.gridPosition)||7)-rank)),
      overtakes:Math.max(0,Number(result.playerOvertakes??result.totalOvertakes)||0),
      leadChanges:Math.max(0,Number(result.leadChanges)||0),
      photoFinish:!!result.photoFinish,
      notableMoment:String(result.notableMoment||''),
      rivalRanks:result.rivalRanks&&typeof result.rivalRanks==='object'?{...result.rivalRanks}:{},
      classification,
      events:Array.isArray(result.events)?result.events.slice(-20).map(row=>typeof row==='object'?{...row}:row):[],
      liveCalls:Array.isArray(result.seasonCallResponses)?result.seasonCallResponses.slice(0,4).map(row=>({...row})):[]
    };
    for(const row of classification){
      if(!SEASON_RACER_IDS.includes(row.id))continue;
      c8.championship.points[row.id]=Math.max(0,Number(c8.championship.points[row.id])||0)+seasonPointsForPosition(row.rank);
    }
    c8.championship.currentRound=2;c8.championship.rounds.velmora=round;changed.chapter8=c8;changed.chapter='season-one';changed.scene='q80';changed.beat=0;
    if(rank===1){changed.relationships.quickquillTrust+=5;changed.relationships.maraBond+=2;changed.relationships.tyreseBond+=2;}
    else if(rank<=3){changed.relationships.quickquillTrust+=3;changed.relationships.tyreseBond+=1;}
    else if(rank<=5)changed.relationships.quickquillTrust+=2;
    else changed.relationships.dragonBond+=1;
    const evolution=syncCareerEvolution(changed);
    applyRaceToCareerEvolution(evolution,{
      key:'race-04-season-velmora',event:'Velmora City Circuit',rank,startPosition:round.result.startPosition,
      qualifying:round.result.startPosition,overtakes:round.result.overtakes,positionsGained:round.result.positionsGained,
      leadChanges:round.result.leadChanges,strategy:'focus',completedAt:round.completedAt,photoFinish:round.result.photoFinish,
      notableMoment:round.result.notableMoment,events:round.result.events,rivalRanks:round.result.rivalRanks
    },changed);
    changed.careerEvolution=evolution;
    changed.history=[...(changed.history||[]),{scene:'q80',event:'season-round-one-result',rank,points:seasonPointsForPosition(rank),startPosition:round.result.startPosition}].slice(-160);
    state.story=changed;state.mode='story';state.storyError='';state.seasonTransient=rank===1?'ROUND ONE WIN · VELMORA BELONGS TO QUICKQUILL':rank<=3?`ROUND ONE PODIUM · ${ordinal(rank)}`:`ROUND ONE COMPLETE · ${ordinal(rank)}`;
    try{await persistStory(changed,{stageOverride:'quickquill-season-control'});render();syncMusic({restart:true});}
    catch(error){state.storySaving=false;state.storyError=error?.message||'The race finished, but the Round One championship result could not be saved.';render();}
  }

  async function handleSeasonRaceAbort(message=''){
    if(!state.activeSave)return;
    const changed=normaliseQuickquillStory(state.story||activeSaveState().story),c8=seasonState(changed),round=seasonRoundState(c8,'velmora');
    if(round.status==='complete')return;
    round.status='ready';round.runId='';c8.championship.rounds.velmora=round;changed.chapter8=c8;changed.chapter='season-one';changed.scene='q80';changed.beat=0;
    state.story=changed;state.mode='story';state.storyError=message||'Race exited. Your qualifying grid and Opening Week are safe — return to Velmora when ready.';
    try{await persistStory(changed,{stageOverride:'quickquill-season-control'});}catch(_){}
    render();syncMusic({restart:true});
  }

  async function startSeasonOpening(){
    if(state.storySaving||!state.story?.completed?.verdict)return;
    const changed=cloneValue(state.story),c8=seasonState(changed);c8.started=true;c8.startedAt=c8.startedAt||new Date().toISOString();changed.chapter8=c8;changed.chapter='season-one';changed.scene=c8.completed?'q80':QUICKQUILL_SEASON_SCENES.some(row=>row.id===changed.scene)?changed.scene:'q75';changed.beat=0;changed.history=[...(changed.history||[]),{scene:changed.scene,event:'season-opening-start'}].slice(-140);state.story=changed;state.mode='story';
    await persistStory(changed,{stageOverride:'quickquill-season-opening'});render();syncMusic({restart:true});
  }

  async function seasonGo(sceneId){
    if(state.storySaving||!QUICKQUILL_SEASON_SCENES.some(row=>row.id===sceneId))return;
    const changed=cloneValue(state.story);changed.chapter='season-one';changed.scene=sceneId;changed.beat=0;changed.history=[...(changed.history||[]),{scene:sceneId,event:'season-opening-progress'}].slice(-140);
    state.story=changed;state.seasonView='';state.seasonTransient='';
    await persistStory(changed,{stageOverride:'quickquill-season-opening'});render();syncMusic({restart:true});
  }

  async function seasonInspectRound(id){const row=SEASON_SCHEDULE.find(item=>item.id===id);if(!row||state.storySaving)return;const changed=cloneValue(state.story),c8=seasonState(changed);if(!c8.calendar.seen.includes(id))c8.calendar.seen.push(id);changed.chapter8=c8;state.story=changed;state.seasonView=id;await persistStory(changed,{stageOverride:'quickquill-season-opening'});render();}
  async function seasonChooseAmbition(id){if(state.storySaving||!['build','podiums','title'].includes(id))return;const changed=cloneValue(state.story),c8=seasonState(changed);if(!['velmora','grandice'].every(key=>c8.calendar.seen.includes(key))){state.seasonTransient='Inspect the opener and finale before setting the season ambition.';render();return;}c8.calendar.ambition=id;changed.chapter8=c8;if(id==='build')changed.identity.focus+=2;else if(id==='podiums'){changed.identity.heart+=1;changed.identity.focus+=1;}else changed.identity.fire+=2;state.story=changed;await persistStory(changed,{stageOverride:'quickquill-season-opening'});render();}

  function seasonAdjustPlan(id,delta){if(state.storySaving)return;const activity=SEASON_PLAN_ACTIVITIES[id],changed=cloneValue(state.story),c8=seasonState(changed);if(!activity||c8.weeklyPlan.locked)return;const current=Math.max(0,Number(c8.weeklyPlan.allocations[id])||0),next=Math.max(0,Math.min(3,current+delta));const projected=seasonPlanSpent(c8.weeklyPlan,changed)+(next-current)*seasonActivityCost(id,changed);if(projected>c8.weeklyPlan.budget){state.seasonTransient='Only six preparation hours are available. Remove something before adding that block.';render();return;}c8.weeklyPlan.allocations[id]=next;c8.weeklyPlan.readiness=seasonReadiness(c8.weeklyPlan);changed.chapter8=c8;state.story=changed;state.seasonTransient='';render();}
  async function seasonLockPlan(){if(state.storySaving)return;const changed=cloneValue(state.story),c8=seasonState(changed);if(seasonPlanSpent(c8.weeklyPlan)!==c8.weeklyPlan.budget){state.seasonTransient='Allocate all six hours before Nell locks the week.';render();return;}c8.weeklyPlan.locked=true;c8.weeklyPlan.readiness=seasonReadiness(c8.weeklyPlan);c8.weeklyPlan.profile=seasonPlanProfile(c8.weeklyPlan);changed.chapter8=c8;changed.relationships.nellBond+=1;changed.history=[...(changed.history||[]),{scene:'q76',event:'season-week-plan',allocations:{...c8.weeklyPlan.allocations},profile:c8.weeklyPlan.profile}].slice(-140);state.story=changed;await persistStory(changed,{stageOverride:'quickquill-season-opening'});render();}

  async function seasonInspectTelemetry(id){if(!SEASON_TELEMETRY_CLUES[id]||state.storySaving)return;const changed=cloneValue(state.story),c8=seasonState(changed);if(!c8.telemetry.seen.includes(id))c8.telemetry.seen.push(id);changed.chapter8=c8;state.story=changed;state.seasonView=id;await persistStory(changed,{stageOverride:'quickquill-season-opening'});render();}
  async function seasonAnswerTelemetry(id){if(state.storySaving)return;const answer=SEASON_TELEMETRY_ANSWERS.find(row=>row.id===id),changed=cloneValue(state.story),c8=seasonState(changed);if(!answer||c8.telemetry.seen.length<3||c8.telemetry.completed)return;c8.telemetry.attempts+=1;c8.telemetry.choice=id;c8.telemetry.correct=answer.correct;c8.telemetry.feedback=answer.correct?'Nell freezes the traces together. The dragon was correcting on time. The sensor was telling the story late.':c8.telemetry.attempts<2?'Nell: “That explains a bad input. It does not explain the same 0.18-second delay three times. Compare the timestamps.”':'Not the clean diagnosis, but Nell isolates the delayed timestamp before the car leaves the lab. The lesson still goes on the record.';c8.telemetry.completed=answer.correct||c8.telemetry.attempts>=2;if(answer.correct){changed.relationships.nellBond+=3;changed.identity.focus+=2;const evolution=syncCareerEvolution(changed);evolution.racecraft.technicalUnderstanding=clampCareerValue(Number(evolution.racecraft.technicalUnderstanding||50)+2);changed.careerEvolution=evolution;}changed.chapter8=c8;changed.history=[...(changed.history||[]),{scene:'q77',event:'telemetry-diagnosis',choice:id,correct:answer.correct,attempt:c8.telemetry.attempts}].slice(-140);state.story=changed;await persistStory(changed,{stageOverride:'quickquill-season-opening'});render();}

  async function seasonPitwallChoice(id){if(state.storySaving)return;const changed=cloneValue(state.story),c8=seasonState(changed),scenario=SEASON_PITWALL_SCENARIOS[c8.pitwall.stage],option=scenario?.options.find(row=>row.id===id);if(!option||c8.pitwall.reviewing||c8.pitwall.completed)return;let earned=option.score,result=option.note;if(scenario.id==='team'){const bond=Number(changed.relationships?.tyreseBond||40);if(id==='swap'&&bond<50){earned=1;result='The pace call is sound, but the weak Tyrese understanding makes the swap untidy. Jalen gains time while Quickquill explains it.';}else if(id==='swap'){result='Tyrese acknowledges immediately. The relationship turns a difficult swap into a clean team move.';}else if(id==='hold'&&bond<50){earned=2;result='With the teammate channel already tense, formation is the cleanest way to deny Jalen the opening.';}}c8.pitwall.score+=earned;c8.pitwall.choices.push({scenario:scenario.id,choice:id,score:earned});c8.pitwall.lastResult=result;c8.pitwall.reviewing=true;changed.chapter8=c8;state.story=changed;await persistStory(changed,{stageOverride:'quickquill-season-opening'});render();}
  async function seasonPitwallNext(){if(state.storySaving)return;const changed=cloneValue(state.story),c8=seasonState(changed);if(!c8.pitwall.reviewing)return;c8.pitwall.stage+=1;c8.pitwall.reviewing=false;c8.pitwall.lastResult='';if(c8.pitwall.stage>=SEASON_PITWALL_SCENARIOS.length){c8.pitwall.completed=true;c8.pitwall.grade=seasonPitwallGrade(c8.pitwall.score);changed.relationships.quickquillTrust+=c8.pitwall.score>=6?2:1;}changed.chapter8=c8;changed.history=[...(changed.history||[]),{scene:'q78',event:c8.pitwall.completed?'pitwall-sim-complete':'pitwall-next-call',score:c8.pitwall.score}].slice(-140);state.story=changed;await persistStory(changed,{stageOverride:'quickquill-season-opening'});render();}

  function seasonToggleObjective(id){if(state.storySaving)return;const definition=SEASON_OBJECTIVES.find(row=>row.id===id),changed=cloneValue(state.story),c8=seasonState(changed);if(!definition||c8.objectives.locked)return;const selected=c8.objectives.selected,at=selected.indexOf(id);if(at>=0)selected.splice(at,1);else if(selected.length<3)selected.push(id);else{state.seasonTransient='Three promises maximum. Remove one before choosing another.';render();return;}changed.chapter8=c8;state.story=changed;state.seasonTransient='';render();}
  async function seasonLockObjectives(){if(state.storySaving)return;const changed=cloneValue(state.story),c8=seasonState(changed),defs=c8.objectives.selected.map(id=>SEASON_OBJECTIVES.find(row=>row.id===id)).filter(Boolean);if(defs.length!==3||!defs.some(row=>row.scope==='team')||!defs.some(row=>row.scope==='personal')){state.seasonTransient='Choose exactly three promises, including at least one team goal and one personal goal.';render();return;}c8.objectives.locked=true;changed.chapter8=c8;changed.relationships.maraBond+=2;changed.history=[...(changed.history||[]),{scene:'q79',event:'season-objectives-locked',objectives:[...c8.objectives.selected]}].slice(-140);state.story=changed;await persistStory(changed,{stageOverride:'quickquill-season-opening'});render();}

  async function seasonChooseRaceMode(id){
    if(!['watch','quick','full'].includes(id)||state.storySaving)return;
    const changed=cloneValue(state.story),c8=seasonState(changed);c8.raceMode=id;changed.chapter8=c8;state.story=changed;
    try{await persistStory(changed,{stageOverride:'quickquill-season-control'});}catch(_){}
    render();
  }
  async function finishSeasonOpening(){
    if(state.storySaving)return;
    const changed=cloneValue(state.story),c8=seasonState(changed);
    if(!c8.objectives.locked||!c8.pitwall.completed)return;
    // V34.33: race presentation is a weekend choice, not an awkward story gate.
    // Existing saves keep their preference; new saves enter the season in Watch Live.
    c8.raceMode=['watch','quick','full'].includes(c8.raceMode)?c8.raceMode:'watch';
    c8.completed=true;c8.completedAt=c8.completedAt||new Date().toISOString();c8.seasonHubUnlocked=true;
    changed.chapter8=c8;changed.completed={...(changed.completed||{}),seasonOpening:true};changed.chapter='season-one';changed.scene='q80';
    careerRegisterChapterType(changed,'open-hub');
    changed.history=[...(changed.history||[]),{scene:'q80',event:'season-control-unlocked',raceMode:c8.raceMode}].slice(-140);
    state.story=changed;state.seasonControlTab='weekend';state.seasonTransient='';
    await persistStory(changed,{stageOverride:'quickquill-season-control'});render();
  }

  function seasonShell(scene,idx,body,extra=''){
    const labels=[
      ['TUE','CALENDAR'],
      ['WED','PLAN'],
      ['WED','TELEMETRY'],
      ['THU','PIT WALL'],
      ['FRI','PROMISES'],
      ['WEEKEND','CONTROL']
    ];
    const inControl=scene.id==='q80'&&!!seasonState().seasonHubUnlocked;
    const strip=inControl?'':`<nav class="season-week-strip" aria-label="Opening Week progress">${labels.map((row,i)=>`<span class="${i<idx?'is-done':''} ${i===idx?'is-current':''}"><small>${row[0]}</small><b>${row[1]}</b></span>`).join('')}</nav>`;
    const progressLabel=inControl?`SEASON ONE · ROUND ${Math.max(1,Number(seasonState().championship.currentRound)||1)} / ${SEASON_SCHEDULE.length}`:`OPENING WEEK · ${labels[idx]?.[0]||'WEEKEND'} · ${idx+1} / ${QUICKQUILL_SEASON_SCENES.length}`;
    const progressValue=inControl?Math.max(8,Math.min(100,(Math.max(1,Number(seasonState().championship.currentRound)||1)/SEASON_SCHEDULE.length)*100)):((idx+1)/QUICKQUILL_SEASON_SCENES.length)*100;
    return `<section class="season-shell ${extra}" aria-label="${escapeHtml(scene.number)} ${escapeHtml(scene.title)}"><img class="season-backdrop" src="${scene.background}" alt="" aria-hidden="true"><div class="season-stage"><header class="season-header"><div><small>QUICKQUILL · FIRST FULL SEASON</small><strong>${escapeHtml(scene.number)} · ${escapeHtml(scene.title)}</strong><span>${escapeHtml(scene.location)}</span></div><button type="button" data-season-hub>BACK TO HUB</button></header>${strip}<div class="season-progress"><i style="--season-progress:${progressValue}%"></i><span>${escapeHtml(progressLabel)}</span></div>${state.storyError?`<div class="season-error" role="alert">${escapeHtml(state.storyError)}</div>`:''}${body}</div></section><div class="blackout ${state.blackout?'is-visible':''}" aria-hidden="true"></div>`;
  }

  function seasonReadinessMarkup(readiness){return `<div class="season-readiness">${Object.entries(readiness).map(([key,value])=>`<span><small>${escapeHtml(key)}</small><i style="--meter:${value}%"></i><b>${Math.round(value)}</b></span>`).join('')}</div>`;}
  function renderSeasonCalendar(scene,idx,c8){const seen=new Set(c8.calendar.seen||[]),required=['velmora','grandice'].every(id=>seen.has(id)),selected=c8.calendar.ambition;const ambitions=[['build','BUILD THE BASE','Learn the calendar and become difficult everywhere.'],['podiums','CHASE PODIUMS','Make Lumerre a standard, not a surprise.'],['title','SAY CHAMPIONSHIP','Accept the pressure before Round One.']];const detail=SEASON_SCHEDULE.find(row=>row.id===state.seasonView);const body=`<main class="season-calendar"><section class="season-intro"><small>TUESDAY · 09:12 · CONTRACT SIGNED YESTERDAY</small><h1>NOW THE CALENDAR GETS BIG.</h1><p>Mara rolls eight circuit cards across the strategy floor. This is the first quiet morning of the job you just signed for. Quickquill is not asking you to memorise eight races at once—only to understand where the season begins, where it ends, and what kind of year you want between them.</p></section><div class="season-route">${SEASON_SCHEDULE.map(row=>`<button data-season-round="${row.id}" class="${seen.has(row.id)?'is-seen':''} ${['velmora','grandice'].includes(row.id)?'is-required':''}"><small>ROUND ${row.round} · ${escapeHtml(row.country)}</small><b>${escapeHtml(row.venue)}</b><span>${escapeHtml(row.risk)}</span><i>${seen.has(row.id)?'✓':'INSPECT'}</i></button>`).join('')}</div>${detail?`<aside class="season-detail"><button data-season-close>×</button><small>ROUND ${detail.round} · RIVAL WATCH: ${escapeHtml(detail.rival)}</small><h2>${escapeHtml(detail.venue)}</h2><p>${escapeHtml(detail.note)}</p></aside>`:''}<section class="season-ambition"><header><small>SEASON INTENT</small><strong>${required?'Pick the sentence Mara writes above the calendar.':'Inspect Round 1 and Round 8 first.'}</strong></header><div>${ambitions.map(([id,title,note])=>`<button data-season-ambition="${id}" class="${selected===id?'is-selected':''}" ${!required?'disabled':''}><b>${title}</b><span>${note}</span></button>`).join('')}</div>${selected?`<button class="season-primary" data-season-next="q76">END TUESDAY · BUILD THE WEEK</button>`:''}</section></main>`;root.innerHTML=seasonShell(scene,idx,body,'is-calendar');}

  function renderSeasonPlan(scene,idx,c8){const plan=c8.weeklyPlan,spent=seasonPlanSpent(plan),readiness=seasonReadiness(plan);const body=`<main class="season-plan"><section class="season-title"><small>WEDNESDAY · NELL’S WHITEBOARD</small><h1>SIX HOURS. NO PERFECT WEEK.</h1><p>This is your first professional preparation plan, not a permanent weekly menu. Spend the six hours, see what changes, then carry that lesson into Velmora.</p></section><div class="season-plan-layout"><div class="season-activities">${Object.entries(SEASON_PLAN_ACTIVITIES).map(([id,row])=>{const count=Number(plan.allocations[id])||0,cost=seasonActivityCost(id);return `<article class="${count?'is-active':''}"><small>${cost}H BLOCK${id==='sponsor'&&cost===1?' · NEGOTIATED':''}</small><h2>${row.title}</h2><p>${row.note}</p><footer><button data-season-plan="${id}" data-delta="-1" ${!count||plan.locked?'disabled':''}>−</button><b>${count}</b><button data-season-plan="${id}" data-delta="1" ${plan.locked||count>=3?'disabled':''}>+</button></footer></article>`;}).join('')}</div><aside class="season-plan-board"><small>READINESS FORECAST</small>${seasonReadinessMarkup(readiness)}<div class="season-budget"><b>${spent} / ${plan.budget}</b><span>HOURS COMMITTED</span></div>${state.seasonTransient?`<p class="season-warning">${escapeHtml(state.seasonTransient)}</p>`:''}${plan.locked?`<strong class="season-locked">PLAN LOCKED · ${escapeHtml(plan.profile)}</strong><button class="season-primary" data-season-next="q77">LOCK WEDNESDAY · GO TO TELEMETRY</button>`:`<button class="season-primary" data-season-lock-plan ${spent!==plan.budget?'disabled':''}>LOCK SIX-HOUR PLAN</button>`}</aside></div></main>`;root.innerHTML=seasonShell(scene,idx,body,'is-plan');}

  function renderSeasonTelemetry(scene,idx,c8){const telemetry=c8.telemetry,seen=new Set(telemetry.seen||[]),detail=SEASON_TELEMETRY_CLUES[state.seasonView];const body=`<main class="season-telemetry"><section class="season-title"><small>THE OPENING-WEEK PROBLEM</small><h1>FIND THE MISSING TENTH.</h1><p>One trace says ${escapeHtml(storyDragonName())} reacts late in crosswind. Nell thinks the conclusion is too convenient. Inspect at least three evidence channels, then diagnose it.</p></section><div class="telemetry-workbench">${Object.entries(SEASON_TELEMETRY_CLUES).map(([id,row])=>`<button data-season-clue="${id}" class="${seen.has(id)?'is-seen':''}"><small>${row.tag}</small><b>${row.title}</b><span>${seen.has(id)?'EVIDENCE LOGGED':'OPEN CHANNEL'}</span></button>`).join('')}</div>${detail?`<aside class="season-detail"><button data-season-close>×</button><small>${escapeHtml(detail.tag)}</small><h2>${escapeHtml(detail.title)}</h2><p>${escapeHtml(detail.text)}</p></aside>`:''}<section class="telemetry-diagnosis"><header><span>${seen.size} / 3 CHANNELS REQUIRED</span><strong>${telemetry.completed?'DIAGNOSIS RECORDED':'WHAT ACTUALLY LOST THE TIME?'}</strong></header>${telemetry.feedback?`<p class="telemetry-feedback ${telemetry.correct?'is-correct':''}">${escapeHtml(telemetry.feedback)}</p>`:''}${!telemetry.completed?`<div>${SEASON_TELEMETRY_ANSWERS.map(row=>`<button data-season-answer="${row.id}" ${seen.size<3?'disabled':''}><b>${row.title}</b><span>${row.note}</span></button>`).join('')}</div>`:`<button class="season-primary" data-season-next="q78">CLOSE THE LAB · THURSDAY NEXT</button>`}</section></main>`;root.innerHTML=seasonShell(scene,idx,body,'is-telemetry');}

  function renderSeasonPitwall(scene,idx,c8){const sim=c8.pitwall,scenario=SEASON_PITWALL_SCENARIOS[sim.stage];let content='';if(sim.completed){content=`<section class="pitwall-result"><small>FIVE CALLS · ${sim.score} / 10</small><h1>${escapeHtml(sim.grade)}</h1><p>Nell has stopped feeding you obvious answers. Mara has started writing down the calls you make without them.</p><div class="pitwall-log">${sim.choices.map((row,i)=>`<span><b>CALL ${i+1}</b><em>+${row.score}</em></span>`).join('')}</div><button class="season-primary" data-season-next="q79">END THURSDAY · SET SEASON PROMISES</button></section>`;}else if(scenario){content=`<section class="pitwall-console"><header><small>CALL ${sim.stage+1} / ${SEASON_PITWALL_SCENARIOS.length}</small><h1>${escapeHtml(scenario.title)}</h1><p>“${escapeHtml(scenario.radio)}”</p></header>${seasonReadinessMarkup(scenario.gauges)}${sim.reviewing?`<div class="pitwall-review"><small>CALL LOGGED</small><strong>${escapeHtml(sim.lastResult)}</strong><button data-season-pit-next>${sim.stage===SEASON_PITWALL_SCENARIOS.length-1?'END SIMULATION':'NEXT RADIO CALL'}</button></div>`:`<div class="pitwall-options">${scenario.options.map(row=>`<button data-season-pit="${row.id}"><b>${row.label}</b><span>${row.note}</span></button>`).join('')}</div>`}<footer><span>DECISION SCORE</span><b>${sim.score} / ${sim.stage*2}</b></footer></section>`;}root.innerHTML=seasonShell(scene,idx,`<main class="season-pitwall"><div class="pitwall-lights" aria-hidden="true"></div>${content}</main>`,'is-pitwall');}

  function renderSeasonObjectives(scene,idx,c8){const selected=new Set(c8.objectives.selected||[]),defs=[...selected].map(id=>SEASON_OBJECTIVES.find(row=>row.id===id)).filter(Boolean),valid=selected.size===3&&defs.some(row=>row.scope==='team')&&defs.some(row=>row.scope==='personal');const body=`<main class="season-objectives"><section class="season-title"><small>FRIDAY · NO BOARD-MANDATED CHECKLIST</small><h1>THE PROMISES YOU PICK.</h1><p>These are not three throwaway objectives for the next screen. They stay attached to the season. Pick three promises you would still care about after a bad race.</p></section><div class="objective-grid">${SEASON_OBJECTIVES.map(row=>`<button data-season-objective="${row.id}" class="${selected.has(row.id)?'is-selected':''}" ${c8.objectives.locked?'disabled':''}><small>${row.type}</small><h2>${row.title}</h2><p>${row.note}</p><span>${row.reward}</span><em>${row.pressure}</em><i>${selected.has(row.id)?'SIGNED':'SELECT'}</i></button>`).join('')}</div><footer class="objective-footer"><div><b>${selected.size} / 3</b><span>${valid?'TEAM + PERSONAL MIX READY':'NEED TEAM + PERSONAL'}</span></div>${state.seasonTransient?`<p>${escapeHtml(state.seasonTransient)}</p>`:''}${c8.objectives.locked?`<strong>PROMISES LOCKED</strong><button class="season-primary" data-season-next="q80">END OPENING WEEK · SEASON CONTROL</button>`:`<button class="season-primary" data-season-lock-objectives ${!valid?'disabled':''}>SIGN THREE PROMISES</button>`}</footer></main>`;root.innerHTML=seasonShell(scene,idx,body,'is-objectives');}

  function renderSeasonControl(scene,idx,c8){
    const modeLabels={watch:'WATCH LIVE',quick:'QUICK SIM',full:'FULL SIM'},ambitionLabels={build:'BUILD THE BASE',podiums:'CHASE PODIUMS',title:'CHAMPIONSHIP'};
    const readiness=c8.weeklyPlan.readiness||seasonReadiness(c8.weeklyPlan),objectives=c8.objectives.selected.map(id=>SEASON_OBJECTIVES.find(row=>row.id===id)).filter(Boolean);
    let body;
    if(!c8.seasonHubUnlocked){
      body=`<main class="season-control-welcome">
        <section class="season-control-welcome-card">
          <small>FRIDAY · 17:48 · OPENING WEEK COMPLETE</small>
          <h1>THE TRAINING WHEELS COME OFF HERE.</h1>
          <p>Opening Week was not the whole season squeezed into five screens. It was Quickquill teaching you the systems you will keep using: preparation, engineering, race calls and promises that survive beyond one result.</p>
          <div class="season-control-recap">
            <span><small>PREPARATION</small><b>${escapeHtml(c8.weeklyPlan.profile||'BALANCED')}</b><em>Your weekly choices will keep changing race readiness.</em></span>
            <span><small>TECHNICAL TRUST</small><b>${c8.telemetry.correct?'ROOT CAUSE FOUND':'LESSON RECORDED'}</b><em>Nell now has a baseline for how much information to put in your hands.</em></span>
            <span><small>PIT WALL</small><b>${escapeHtml(c8.pitwall.grade||'CALM HAND')}</b><em>Live calls will appear when the race actually needs you.</em></span>
          </div>
          <blockquote><b>MARA</b><span>“From now on, race weekends have a rhythm. Briefing. Qualifying. Strategy. Race. Then we live with the result.”</span></blockquote>
          <button class="season-primary season-control-enter" data-season-unlock>ENTER SEASON CONTROL</button>
        </section>
      </main>`;
    }else{
      const round=seasonRoundState(c8,'velmora'),result=round.result,standings=seasonStandings(c8),qualified=round.qualifyingGrid.length===7;
      const startPosition=qualified?Math.max(1,round.qualifyingGrid.findIndex(row=>row.isPlayer||row.id==='player')+1):0;
      const plan=seasonRacePlanText(round.strategy||'adaptive');
      const roundOneComplete=round.status==='complete'&&result;
      const playerStanding=Math.max(1,standings.findIndex(row=>row.id==='player')+1);
      const tab=['weekend','championship','development'].includes(state.seasonControlTab)?state.seasonControlTab:'weekend';
      const target=({build:'Score clean points and learn the full-distance race.',podiums:'Put Quickquill in the podium fight without throwing the opener away.',title:'Start the championship like you expect to be in it at Grand Ice.'})[c8.calendar.ambition]||'Bank a professional opening result.';
      const weekendStages=[
        ['BRIEFING',true],
        ['QUALIFYING',qualified||roundOneComplete],
        ['STRATEGY',qualified||roundOneComplete],
        ['RACE',roundOneComplete]
      ];
      let panel='';
      if(tab==='weekend'&&!roundOneComplete){
        panel=`<section class="season-control-panel season-weekend-panel">
          <div class="season-weekend-head">
            <div><small>ROUND 1 / 8 · VELMORA</small><h2>VELMORA CITY CIRCUIT</h2><p>One weekend at a time. Nothing else on the season screen needs your attention until this race is settled.</p></div>
            <aside><small>TEAM TARGET</small><b>${escapeHtml(target)}</b></aside>
          </div>
          <div class="season-weekend-stages">${weekendStages.map(([label,done],i)=>`<span class="${done?'is-done':''} ${(!done&&weekendStages.slice(0,i).every(row=>row[1]))?'is-current':''}"><i>${done?'✓':i+1}</i><b>${label}</b></span>`).join('')}</div>
          ${!qualified?`<div class="season-weekend-briefing">
            <div class="season-weekend-hero">
              <small>SATURDAY · QUALIFYING NEXT</small>
              <h3>FIRST, LEARN WHERE YOU ACTUALLY START.</h3>
              <p>The old screen jumped straight from preparation into the race. Now qualifying is its own saved session. Once the grid is set, you can make a strategy decision with real context instead of guessing.</p>
              <div class="season-briefing-facts">
                <span><small>RIVAL WATCH</small><b>MAYA BANKS</b></span>
                <span><small>CONDITION</small><b>DRY CITY AIR</b></span>
                <span><small>CIRCUIT</small><b>STREET COMPRESSION</b></span>
              </div>
              <button class="season-race-launch season-qualifying-launch" data-season-qualify>RUN SATURDAY QUALIFYING</button>
            </div>
            <aside class="season-weekend-notes"><small>WHAT OPENING WEEK ACTUALLY CHANGED</small><span><b>${escapeHtml(c8.weeklyPlan.profile||'BALANCED')}</b> preparation profile</span><span><b>${c8.telemetry.correct?'CLEAN':'SUPPORTED'}</b> telemetry diagnosis</span><span><b>${escapeHtml(c8.pitwall.grade||'CALM HAND')}</b> pit-wall baseline</span><em>These feed the race. They are not another checklist you need to redo right now.</em></aside>
          </div>`:`<div class="season-qualified-layout">
            <section class="season-qualifying-card">
              <header><div><small>SATURDAY · QUALIFYING COMPLETE</small><h3>P${startPosition} ON THE GRID</h3></div><span>${startPosition<=2?'FRONT ROW':startPosition<=4?'ATTACKING RANGE':'WORK TO DO'}</span></header>
              <div class="season-qualifying-grid">${round.qualifyingGrid.map((row,i)=>`<span class="${row.isPlayer||row.id==='player'?'is-player':''}"><b>P${i+1}</b><strong>${escapeHtml(row.name||seasonRacerLabel(row.id).split(' · ')[0])}</strong><em>${escapeHtml(row.team||SEASON_RACER_META[row.id]?.team||'Quickquill')}</em></span>`).join('')}</div>
              <p>${startPosition<=2?'Nell: “Good. Now do not turn a strong Saturday into a stupid Sunday.”':startPosition<=4?'Nell: “That is close enough to race forward. Pick the moments properly.”':'Nell: “Nothing is lost. But the first two laps need to be intelligent, not emotional.”'}</p>
            </section>
            <section class="season-strategy-card">
              <small>SUNDAY · RACE PLAN</small>
              <h3>NOW PICK THE WAY YOU WANT TO RACE.</h3>
              <p>You have the grid now. Strategy should answer the race you actually have, not the race you imagined on Tuesday.</p>
              <div class="season-race-plan season-race-plan-clean">${[['clean','BUILD THE EXIT'],['adaptive','READ THE STREET'],['attack','TAKE THE LATE BRAKE']].map(([id,label])=>`<button data-season-race-plan="${id}" class="${(round.strategy||'adaptive')===id?'is-selected':''}"><b>${label}</b><span>${escapeHtml(seasonRacePlanText(id).note)}</span></button>`).join('')}</div>
              <div class="season-mode-clean"><small>HOW MUCH OF SUNDAY DO YOU WANT TO PLAY?</small>${[['watch','WATCH LIVE','Normal race speed · all major calls'],['quick','QUICK SIM','Fast routine laps · decisive call stays yours'],['full','FULL SIM','Fastest · preparation resolves the calls']].map(([id,label,note])=>`<button data-season-mode="${id}" class="${c8.raceMode===id?'is-selected':''}"><b>${label}</b><span>${note}</span></button>`).join('')}</div>
              <div class="season-race-ready"><span><small>GRID</small><b>P${startPosition}</b></span><span><small>PLAN</small><b>${escapeHtml(plan.title)}</b></span><span><small>MODE</small><b>${escapeHtml(modeLabels[c8.raceMode]||'WATCH LIVE')}</b></span></div>
              <button class="season-race-launch" data-season-race-start>${round.status==='in-progress'?'RETURN TO THE GRID':'GO TO SUNDAY RACE'}</button>
              <em class="season-race-engine-note">EXISTING DRAGON RACING ENGINE · QUALIFYING GRID SAVED · RESULT RETURNS HERE</em>
            </section>
          </div>`}
        </section>`;
      }else if(tab==='weekend'&&roundOneComplete){
        panel=`<section class="season-control-panel season-postrace-panel">
          <div class="season-postrace-hero">
            <small>ROUND 1 / 8 · OFFICIAL</small>
            <h2>${ordinal(result.rank)} AT VELMORA</h2>
            <p>${result.rank===1?'The first full-season race ends with a win. That changes the tone, not the job.':result.rank<=3?'A podium makes the opener matter without pretending the championship is already decided.':'Round One is banked. There is time to understand it before the calendar moves on.'}</p>
            <div class="season-postrace-numbers"><span><b>${seasonPointsForPosition(result.rank)}</b>POINTS</span><span><b>P${result.startPosition}</b>START</span><span><b>${result.positionsGained||0}</b>PLACES GAINED</span><span><b>${result.overtakes||0}</b>OVERTAKES</span></div>
          </div>
          <div class="season-postrace-columns">
            <section><small>WHAT SUNDAY SAID</small>${result.liveCalls?.length?`<div class="season-call-log">${result.liveCalls.map(row=>`<span>${escapeHtml(String(row.title||row.call||'RACE CALL'))}<b>${escapeHtml(String(row.label||row.choice||''))}</b></span>`).join('')}</div>`:`<p>No manual pit-wall call log for this presentation mode. The result still used your preparation and race plan.</p>`}</section>
            <section><small>CHAMPIONSHIP POSITION</small><h3>${ordinal(playerStanding)}</h3><p>${standings.find(row=>row.id==='player')?.points||0} points after one round.</p><button data-season-control-tab="championship">OPEN CHAMPIONSHIP TABLE</button></section>
            <section><small>NEXT WEEK</small><h3>GREENWATER CANOPY</h3><p>Humidity · technical rhythm · Sofia Mendes. It will get its own weekend identity rather than pretending Velmora happened again.</p><span class="season-next-status">ROUND 2 BUILD COMES NEXT</span></section>
          </div>
        </section>`;
      }else if(tab==='championship'){
        panel=`<section class="season-control-panel season-championship-panel">
          <header><small>CHAMPIONSHIP TABLE</small><h2>${roundOneComplete?'AFTER ROUND ONE':'BEFORE ROUND ONE'}</h2><p>The table gets its own space now. No race-plan buttons, readiness meters or settings mixed into it.</p></header>
          <div class="season-table-clean">${standings.map((row,i)=>`<span class="${row.id==='player'?'is-player':''}"><b>${i+1}</b><strong>${escapeHtml(row.label)}</strong><em>${row.points} PTS</em></span>`).join('')}</div>
          <div class="season-calendar-clean">${SEASON_SCHEDULE.map(row=>`<article class="${row.id==='velmora'?'is-current':''} ${row.round===2&&roundOneComplete?'is-next':''}"><small>ROUND ${row.round} · ${escapeHtml(row.country)}</small><b>${escapeHtml(row.venue)}</b><span>${escapeHtml(row.risk)}</span><em>${row.id==='velmora'?(roundOneComplete?`P${result.rank} · ${seasonPointsForPosition(result.rank)} PTS`:'THIS WEEKEND'):row.round===2&&roundOneComplete?'NEXT':'UPCOMING'}</em></article>`).join('')}</div>
        </section>`;
      }else{
        const allocations=Object.entries(c8.weeklyPlan.allocations||{}).filter(([,count])=>Number(count)>0);
        panel=`<section class="season-control-panel season-development-panel">
          <header><small>DRIVER + DRAGON DEVELOPMENT</small><h2>WHAT OPENING WEEK LEFT BEHIND</h2><p>This is the long-term record. It is deliberately separate from the next-race screen so progression does not feel like a wall of numbers every time you want to race.</p></header>
          <div class="season-development-grid">
            <section><small>READINESS BASELINE</small>${seasonReadinessMarkup(readiness)}</section>
            <section><small>PREPARATION PROFILE</small><h3>${escapeHtml(c8.weeklyPlan.profile||'BALANCED')}</h3>${allocations.map(([id,count])=>`<span><b>${escapeHtml(SEASON_PLAN_ACTIVITIES[id]?.title||id)}</b><em>${count} BLOCK${Number(count)===1?'':'S'}</em></span>`).join('')}</section>
            <section><small>TECHNICAL RECORD</small><span><b>Telemetry diagnosis</b><em>${c8.telemetry.correct?'ROOT CAUSE FOUND':'COMPLETED WITH SUPPORT'}</em></span><span><b>Pit-wall grade</b><em>${escapeHtml(c8.pitwall.grade||'CALM HAND')}</em></span><span><b>Season ambition</b><em>${escapeHtml(ambitionLabels[c8.calendar.ambition]||'BUILD THE BASE')}</em></span></section>
            <section><small>SEASON PROMISES</small>${objectives.map(row=>`<span><b>${escapeHtml(row.title)}</b><em>${escapeHtml(row.type)}</em></span>`).join('')}</section>
          </div>
        </section>`;
      }
      body=`<main class="season-control-v2">
        <header class="season-control-v2-head">
          <div><small>QUICKQUILL · SEASON ONE</small><h1>SEASON CONTROL</h1><p>${roundOneComplete?'Velmora is done. Review it, then move on when the next race is actually ready.':'Round One has one job at a time: understand the weekend, qualify, choose a plan, race.'}</p></div>
          <aside><small>${roundOneComplete?'CHAMPIONSHIP':'CURRENT WEEKEND'}</small><b>${roundOneComplete?`${ordinal(playerStanding)} · ${standings.find(row=>row.id==='player')?.points||0} PTS`:'VELMORA · ROUND 1'}</b><span>${escapeHtml(ambitionLabels[c8.calendar.ambition]||'BUILD THE BASE')}</span></aside>
        </header>
        <div class="season-spine-clean">${SEASON_SCHEDULE.map(row=>`<span class="${row.id==='velmora'?(roundOneComplete?'is-done':'is-current'):row.round===2&&roundOneComplete?'is-next':''}"><i>${row.id==='velmora'&&roundOneComplete?'✓':row.round}</i><b>${escapeHtml(row.venue.replace(' Circuit','').replace(' Arena',''))}</b></span>`).join('')}</div>
        <nav class="season-control-tabs" aria-label="Season Control sections">
          ${[['weekend','RACE WEEKEND'],['championship','CHAMPIONSHIP'],['development','DEVELOPMENT']].map(([id,label])=>`<button data-season-control-tab="${id}" class="${tab===id?'is-selected':''}">${label}</button>`).join('')}
        </nav>
        ${state.seasonTransient?`<div class="season-dashboard-flash">${escapeHtml(state.seasonTransient)}</div>`:''}
        ${panel}
        <button class="season-primary season-return" data-season-return>RETURN TO CAREER JOURNEY</button>
      </main>`;
    }
    root.innerHTML=seasonShell(scene,idx,body,'is-control');
  }

  function renderSeasonOpening(scene,beat,idx){
    const c8=seasonState();if(beat.type==='season-calendar')renderSeasonCalendar(scene,idx,c8);else if(beat.type==='season-plan')renderSeasonPlan(scene,idx,c8);else if(beat.type==='season-telemetry')renderSeasonTelemetry(scene,idx,c8);else if(beat.type==='season-pitwall')renderSeasonPitwall(scene,idx,c8);else if(beat.type==='season-objectives')renderSeasonObjectives(scene,idx,c8);else renderSeasonControl(scene,idx,c8);
    root.querySelector('[data-season-hub]')?.addEventListener('click',returnToHubFromStory);root.querySelectorAll('[data-season-next]').forEach(btn=>btn.addEventListener('click',()=>{void seasonGo(btn.dataset.seasonNext||'');}));root.querySelectorAll('[data-season-round]').forEach(btn=>btn.addEventListener('click',()=>{void seasonInspectRound(btn.dataset.seasonRound||'');}));root.querySelectorAll('[data-season-ambition]').forEach(btn=>btn.addEventListener('click',()=>{void seasonChooseAmbition(btn.dataset.seasonAmbition||'');}));root.querySelectorAll('[data-season-plan]').forEach(btn=>btn.addEventListener('click',()=>seasonAdjustPlan(btn.dataset.seasonPlan||'',Number(btn.dataset.delta)||0)));root.querySelector('[data-season-lock-plan]')?.addEventListener('click',()=>{void seasonLockPlan();});root.querySelectorAll('[data-season-clue]').forEach(btn=>btn.addEventListener('click',()=>{void seasonInspectTelemetry(btn.dataset.seasonClue||'');}));root.querySelectorAll('[data-season-answer]').forEach(btn=>btn.addEventListener('click',()=>{void seasonAnswerTelemetry(btn.dataset.seasonAnswer||'');}));root.querySelectorAll('[data-season-pit]').forEach(btn=>btn.addEventListener('click',()=>{void seasonPitwallChoice(btn.dataset.seasonPit||'');}));root.querySelector('[data-season-pit-next]')?.addEventListener('click',()=>{void seasonPitwallNext();});root.querySelectorAll('[data-season-objective]').forEach(btn=>btn.addEventListener('click',()=>seasonToggleObjective(btn.dataset.seasonObjective||'')));root.querySelector('[data-season-lock-objectives]')?.addEventListener('click',()=>{void seasonLockObjectives();});root.querySelectorAll('[data-season-mode]').forEach(btn=>btn.addEventListener('click',()=>{void seasonChooseRaceMode(btn.dataset.seasonMode||'');}));root.querySelectorAll('[data-season-race-plan]').forEach(btn=>btn.addEventListener('click',()=>{void seasonChooseRacePlan(btn.dataset.seasonRacePlan||'');}));root.querySelectorAll('[data-season-control-tab]').forEach(btn=>btn.addEventListener('click',()=>seasonSetControlTab(btn.dataset.seasonControlTab||'weekend')));root.querySelector('[data-season-qualify]')?.addEventListener('click',()=>{void seasonPrepareQualifying();});root.querySelector('[data-season-race-start]')?.addEventListener('click',()=>{void launchSeasonRoundOne();});root.querySelector('[data-season-unlock]')?.addEventListener('click',()=>{void finishSeasonOpening();});root.querySelector('[data-season-return]')?.addEventListener('click',()=>{state.mode='story-journey';render();syncMusic({restart:true});});root.querySelectorAll('[data-season-close]').forEach(btn=>btn.addEventListener('click',()=>{state.seasonView='';render();}));
  }

  function renderStory() {
    window.clearTimeout(storyRevealTimer);
    storyRevealTimer = 0;
    storyRevealText = '';
    const chapterTwoScene = QUICKQUILL_CANTO_SCENES.some(item => item.id === state.story?.scene);
    const chapterThreeScene = QUICKQUILL_DOWNTIME_SCENES.some(item => item.id === state.story?.scene);
    const chapterFourScene = QUICKQUILL_BLACKGLASS_SCENES.some(item => item.id === state.story?.scene);
    const chapterFiveScene = QUICKQUILL_SEAT_SCENES.some(item => item.id === state.story?.scene);
    const chapterSixScene = QUICKQUILL_CROWN_WEEK_SCENES.some(item => item.id === state.story?.scene);
    const lumerrePracticeScene = QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(item => item.id === state.story?.scene);
    const lumerreAfterFlagScene = QUICKQUILL_LUMERRE_AFTER_FLAG_SCENES.some(item => item.id === state.story?.scene);
    const chapterSevenScene = QUICKQUILL_VERDICT_SCENES.some(item => item.id === state.story?.scene);
    const chapterEightScene = QUICKQUILL_SEASON_SCENES.some(item => item.id === state.story?.scene);
    if (state.story?.chapter === 'lumerre-race-day' || (state.story?.completed?.raceWeekend && !state.story?.chapter6?.afterFlag?.started && !lumerreAfterFlagScene && !chapterEightScene)) {
      renderLumerreRaceDay();
      return;
    }
    if (state.story?.completed?.practiceQualifying && !lumerreAfterFlagScene && !chapterSevenScene && !chapterEightScene) {
      renderPracticeQualifyingComplete();
      return;
    }
    if (state.story?.completed?.crownWeek && !lumerrePracticeScene && !lumerreAfterFlagScene && !chapterSevenScene && !chapterEightScene) {
      renderCrownWeekComplete();
      return;
    }
    if (state.story?.completed?.seat && !chapterSixScene && !lumerrePracticeScene && !lumerreAfterFlagScene && !chapterSevenScene && !chapterEightScene) {
      renderSeatComplete();
      return;
    }
    if (state.story?.completed?.blackglass && !chapterFiveScene && !chapterSixScene && !lumerrePracticeScene && !lumerreAfterFlagScene && !chapterSevenScene && !chapterEightScene) {
      renderBlackglassComplete();
      return;
    }
    if (state.story?.completed?.downtime && !chapterFourScene && !chapterFiveScene && !chapterSixScene && !lumerrePracticeScene && !lumerreAfterFlagScene && !chapterSevenScene && !chapterEightScene) {
      renderDowntimeComplete();
      return;
    }
    if (state.story?.completed?.canto && !chapterThreeScene && !chapterFourScene && !chapterFiveScene && !chapterSixScene && !lumerrePracticeScene && !lumerreAfterFlagScene && !chapterSevenScene && !chapterEightScene && !state.story?.completed?.downtime) {
      renderCantoComplete();
      return;
    }
    if (state.story?.completed?.prologue && !chapterTwoScene && !chapterThreeScene && !chapterFourScene && !chapterFiveScene && !chapterSixScene && !lumerrePracticeScene && !lumerreAfterFlagScene && !chapterSevenScene && !chapterEightScene && !state.story?.completed?.canto) {
      renderStoryComplete();
      return;
    }
    const scene = activeStoryScene();
    const beat = scene.beats[Math.min(state.story?.beat || 0, scene.beats.length - 1)] || scene.beats[0];
    const sceneList = chapterEightScene ? QUICKQUILL_SEASON_SCENES : chapterSevenScene ? QUICKQUILL_VERDICT_SCENES : lumerreAfterFlagScene ? QUICKQUILL_LUMERRE_AFTER_FLAG_SCENES : lumerrePracticeScene ? QUICKQUILL_LUMERRE_PRACTICE_SCENES : chapterSixScene ? QUICKQUILL_CROWN_WEEK_SCENES : chapterFiveScene ? QUICKQUILL_SEAT_SCENES : chapterFourScene ? QUICKQUILL_BLACKGLASS_SCENES : chapterThreeScene ? QUICKQUILL_DOWNTIME_SCENES : chapterTwoScene ? QUICKQUILL_CANTO_SCENES : QUICKQUILL_SCENES;
    const sceneIndex = sceneList.findIndex(item => item.id === scene.id);
    const interactiveTypes = new Set(['corridor-explore','room-customise','evening-planner','duty-select','duty-game','downtime-free-roam','night-routine','morning-corridor']);
    const blackglassInteractiveTypes = new Set(['blackglass-paddock-explore','blackglass-circuit-study','blackglass-evening-planner','blackglass-room-night','blackglass-after-hours','blackglass-morning-prep']);
    const seatInteractiveTypes = new Set(['seat-strategy-sim','seat-media-scrum','seat-free-time']);
    const crownInteractiveTypes = new Set(['crown-village','crown-challenge','crown-reception']);
    const lumerrePracticeInteractiveTypes = new Set(['lumerre-practice-run','lumerre-setup-board','lumerre-diagnosis','lumerre-qualifying-run','lumerre-qualifying-window']);
    const lumerreAfterFlagInteractiveTypes = new Set(['lumerre-after-cooldown','lumerre-after-parc','lumerre-after-team','lumerre-after-podium','lumerre-after-press','lumerre-after-room','lumerre-after-tyrese','lumerre-after-envelope','lumerre-after-finale']);
    const verdictInteractiveTypes = new Set(['verdict-arrival','verdict-hq-hub','verdict-board-review','verdict-offer','verdict-negotiate','verdict-interest','verdict-tyrese','verdict-decision','verdict-finale']);
    const seasonInteractiveTypes = new Set(['season-calendar','season-plan','season-telemetry','season-pitwall','season-objectives','season-control']);
    if (chapterThreeScene && interactiveTypes.has(beat.type)) {
      renderDowntimeInteractive(scene, beat, sceneIndex);
      return;
    }
    if (chapterFourScene && blackglassInteractiveTypes.has(beat.type)) {
      renderBlackglassInteractive(scene, beat, sceneIndex);
      return;
    }
    if (chapterFourScene && beat.type === 'blackglass-qualifying') {
      renderBlackglassQualifying(scene, beat, sceneIndex);
      return;
    }
    if (chapterFiveScene && seatInteractiveTypes.has(beat.type)) {
      if (beat.type === 'seat-strategy-sim') renderSeatSimulator(scene, beat, sceneIndex);
      else if (beat.type === 'seat-media-scrum') renderSeatMediaScrum(scene, beat, sceneIndex);
      else renderSeatFreeTime(scene, beat, sceneIndex);
      return;
    }
    if (chapterSixScene && crownInteractiveTypes.has(beat.type)) {
      if (beat.type === 'crown-village') renderCrownVillage(scene, beat, sceneIndex);
      else if (beat.type === 'crown-challenge') renderCrownChallenge(scene, beat, sceneIndex);
      else renderCrownReception(scene, beat, sceneIndex);
      return;
    }
    if (lumerrePracticeScene && lumerrePracticeInteractiveTypes.has(beat.type)) {
      if (beat.type === 'lumerre-practice-run') renderLumerrePracticeRun(scene, beat, sceneIndex);
      else if (beat.type === 'lumerre-setup-board') renderLumerreSetupBoard(scene, beat, sceneIndex);
      else if (beat.type === 'lumerre-diagnosis') renderLumerreDiagnosis(scene, beat, sceneIndex);
      else if (beat.type === 'lumerre-qualifying-run') renderLumerreQualifyingRun(scene, beat, sceneIndex);
      else renderLumerreQualifyingWindow(scene, beat, sceneIndex);
      return;
    }
    if (lumerreAfterFlagScene && lumerreAfterFlagInteractiveTypes.has(beat.type)) {
      renderLumerreAfterFlag(scene, beat, sceneIndex);
      return;
    }
    if (chapterSevenScene && verdictInteractiveTypes.has(beat.type)) {
      renderVerdict(scene, beat, sceneIndex);
      return;
    }
    if (chapterEightScene && seasonInteractiveTypes.has(beat.type)) {
      renderSeasonOpening(scene, beat, sceneIndex);
      return;
    }
    const isChoice = beat.type === 'choice';
    const isCinematic = beat.type === 'cinematic';
    const isRaceLaunch = beat.type === 'race-launch';
    const fullText = !isChoice && !isCinematic && !isRaceLaunch ? storyBeatText(beat) : '';
    state.storyRevealComplete = isChoice || isCinematic || isRaceLaunch;
    const chapterLabel = chapterEightScene ? 'OPENING WEEK' : chapterSevenScene ? 'THE VERDICT' : lumerreAfterFlagScene ? 'AFTER THE FLAG' : lumerrePracticeScene ? 'PRACTICE & QUALIFYING' : chapterSixScene ? 'CROWN WEEK' : chapterFiveScene ? 'CAREER REVIEW' : chapterFourScene ? 'RACE TWO' : chapterThreeScene ? 'DOWNTIME' : chapterTwoScene ? 'RACE ONE' : 'PROLOGUE';
    const persistentRoomDecor = chapterThreeScene && ['q11','q16'].includes(scene.id) ? roomDecorMarkup() : '';
    root.innerHTML = `
      <section class="story-shell tone-${escapeHtml(scene.tone || 'default')}" aria-label="${escapeHtml(scene.number)} ${escapeHtml(scene.title)}">
        <img class="story-backdrop" src="${scene.background}" alt="" aria-hidden="true">
        <div class="story-stage ${(chapterThreeScene && ['q10','q11','q15','q16','q17'].includes(scene.id)) || (chapterFourScene && scene.id==='q26') ? 'is-private-quarters' : ''} ${isCinematic ? 'is-cinematic-beat' : ''} ${isRaceLaunch ? 'is-race-launch-beat' : ''}" ${isChoice || isRaceLaunch ? '' : 'data-story-advance role="button" tabindex="0"'}>
          <img class="story-environment" src="${scene.background}" alt="${escapeHtml(scene.title)}">
          <div class="story-light" aria-hidden="true"></div><div class="story-weather" aria-hidden="true"></div><div class="story-speed-lines" aria-hidden="true"></div><div class="story-lens-flare" aria-hidden="true"></div><div class="story-grain" aria-hidden="true"></div><div class="story-letterbox" aria-hidden="true"></div>
          <header class="story-header"><div><small>QUICKQUILL: AGAINST THE ODDS</small><strong>${escapeHtml(scene.number)} · ${escapeHtml(scene.title)}</strong><span>${escapeHtml(scene.location)}</span></div><button type="button" data-story-home aria-label="Return to Career hub">BACK TO HUB</button></header>
          ${portraitMarkup(beat.portrait)}${storyDragonMarkup(scene, beat)}${storyPropMarkup(scene, beat)}${persistentRoomDecor}
          <div class="story-scene-counter" aria-hidden="true"><i style="--story-progress:${((sceneIndex + 1) / sceneList.length) * 100}%"></i><span>${chapterLabel} ${sceneIndex + 1} / ${sceneList.length}</span></div>
          ${isCinematic ? `<section class="story-cinematic-card" aria-live="polite"><small>${escapeHtml(storyCopy(beat.eyebrow))}</small><h1>${escapeHtml(storyCopy(beat.title))}</h1><i></i><p>${escapeHtml(storyCopy(beat.text))}</p><span>CLICK TO BEGIN</span></section>` : isRaceLaunch ? `
            <section class="story-race-launch-card" aria-live="polite">
              <small>${chapterFourScene ? 'BLACKGLASS NIGHT CIRCUIT · STORY RACE' : 'CANTO MEADOW CIRCUIT · STORY RACE'}</small>
              <h1>${chapterFourScene ? 'BLACKGLASS UNDER FLOODLIGHTS' : 'START THE RACE'}</h1>
              <p>${escapeHtml(storyCopy(beat.text))}</p>
              <div class="story-race-strategy"><span>STRATEGY</span><strong>${escapeHtml(String(chapterFourScene ? currentBlackglassStrategy() : currentCantoStrategy()).toUpperCase())}</strong>${chapterFourScene ? `<small>START · ${ordinal(chapter4State().qualifying?.position || 3)}</small>` : ''}</div>
              <button type="button" data-story-race-start ${state.storySaving ? 'disabled' : ''}>${state.storySaving ? 'SAVING…' : chapterFourScene && state.story?.blackglassRace?.status === 'in-progress' ? 'RESUME BLACKGLASS RACE' : !chapterFourScene && state.story?.race?.status === 'in-progress' ? 'RESUME CANTO RACE' : 'GO TO THE GRID'}</button>
              ${state.storyError ? `<div class="story-error" role="alert">${escapeHtml(state.storyError)}</div>` : ''}
            </section>` : `<section class="story-dialogue ${isChoice ? 'has-choices' : ''}" aria-live="polite">
            <div class="story-speaker"><span>${escapeHtml(storyCopy(beat.speaker || 'Decision'))}</span>${beat.aside ? `<small>${escapeHtml(storyCopy(beat.aside))}</small>` : ''}</div>
            ${isChoice ? `
              <h2>${escapeHtml(storyCopy(beat.prompt))}</h2>
              <div class="story-choices">${beat.options.map((option, index) => `<button type="button" data-story-choice="${index}" ${state.storySaving ? 'disabled' : ''}><b>${String.fromCharCode(65 + index)}</b><span><strong>${escapeHtml(storyCopy(option.label))}</strong><small>${escapeHtml(option.note || '')}</small></span><i aria-hidden="true">›</i></button>`).join('')}</div>
            ` : `<p data-story-line aria-label="${escapeHtml(fullText)}"></p><div class="story-continue"><span>${state.storySaving ? 'SAVING PROGRESS…' : 'CLICK TO CONTINUE'}</span><i aria-hidden="true">›</i></div>`}
            ${state.storyError ? `<div class="story-error" role="alert">${escapeHtml(state.storyError)}</div>` : ''}
          </section>`}
        </div><div class="story-screen-vignette" aria-hidden="true"></div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;

    bindChapterFiveBackgroundFallback(scene);
    bindCrownWeekBackgroundFallback(scene);
    bindLumerrePracticeBackgroundFallback(scene);
    cleanDuplicateSceneLayers();
    root.querySelector('[data-story-home]')?.addEventListener('click', event => { event.stopPropagation(); returnToHubFromStory(); });
    if (isChoice) {
      root.querySelectorAll('[data-story-choice]').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); void chooseStoryOption(Number(button.dataset.storyChoice)); }));
    } else if (isRaceLaunch) {
      root.querySelector('[data-story-race-start]')?.addEventListener('click', event => { event.stopPropagation(); void launchActiveStoryRace(); });
    } else {
      root.querySelector('[data-story-advance]')?.addEventListener('click', event => {
        if (event.target.closest('[data-story-home]')) return;
        event.preventDefault();
        event.stopPropagation();
        // event.detail > 1 is the browser's explicit double-click sequence.
        // The persistent time guard inside advanceStory also protects across rerenders.
        if (Number(event.detail || 1) > 1) return;
        void advanceStory();
      });
      if (!isCinematic) startStoryReveal(fullText);
    }
  }

  function startStoryReveal(text) {
    const target = root.querySelector('[data-story-line]');
    if (!target) {
      state.storyRevealComplete = true;
      return;
    }
    storyRevealText = String(text || '');
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      target.textContent = storyRevealText;
      state.storyRevealComplete = true;
      target.closest('.story-dialogue')?.classList.add('is-line-complete');
      return;
    }
    state.storyRevealComplete = false;
    target.textContent = '';
    let index = 0;
    const reveal = () => {
      if (!target.isConnected || state.mode !== 'story') return;
      const amount = storyRevealText.length > 210 ? 3 : storyRevealText.length > 130 ? 2 : 1;
      index = Math.min(storyRevealText.length, index + amount);
      target.textContent = storyRevealText.slice(0, index);
      if (index >= storyRevealText.length) {
        state.storyRevealComplete = true;
        target.closest('.story-dialogue')?.classList.add('is-line-complete');
        return;
      }
      const character = storyRevealText[index - 1];
      const wait = /[.!?]/.test(character) ? 92 : /[,;:]/.test(character) ? 42 : 16;
      storyRevealTimer = window.setTimeout(reveal, wait);
    };
    storyRevealTimer = window.setTimeout(reveal, 180);
  }

  function finishStoryReveal() {
    if (state.storyRevealComplete) return false;
    window.clearTimeout(storyRevealTimer);
    storyRevealTimer = 0;
    const target = root.querySelector('[data-story-line]');
    if (target) {
      target.textContent = storyRevealText;
      target.closest('.story-dialogue')?.classList.add('is-line-complete');
    }
    state.storyRevealComplete = true;
    return true;
  }

  function dominantIdentity(story = state.story) {
    const entries = Object.entries(story?.identity || { heart: 0, fire: 0, focus: 0 });
    const top = Math.max(...entries.map(([, value]) => Number(value) || 0));
    if (top <= 0) return 'UNWRITTEN';
    return entries.find(([, value]) => Number(value) === top)?.[0]?.toUpperCase() || 'UNWRITTEN';
  }

  function renderStoryComplete() {
    const story = state.story || defaultQuickquillStory();
    root.innerHTML = `
      <section class="story-complete-shell">
        <img class="story-backdrop" src="story/environments/05_Canto_Plains_Racing_Venue.png" alt="" aria-hidden="true">
        <div class="story-complete-stage">
          <div class="story-complete-glow" aria-hidden="true"></div>
          <small>QUICKQUILL: AGAINST THE ODDS</small><h1>THE IMPOSSIBLE<br>CONTRACT</h1><div class="story-complete-rule"></div>
          <p>${escapeHtml(storyDragonName())} has claimed Quickquill’s empty locker. The three-race assessment begins at Canto Plains.</p>
          <div class="story-complete-stats"><div><small>RACER IDENTITY</small><strong>${escapeHtml(dominantIdentity(story))}</strong></div><div><small>QUICKQUILL TRUST</small><strong>${escapeHtml(story.relationships.quickquillTrust)}</strong></div><div><small>TYRESE BOND</small><strong>${escapeHtml(story.relationships.tyreseBond)}</strong></div></div>
          <div class="story-next-race"><span>NEXT</span><strong>RACE ONE · CANTO PLAINS</strong><small>Prove You Belong</small></div>
          <button type="button" data-story-home>RETURN TO CAREER HUB</button>
        </div><div class="story-screen-vignette" aria-hidden="true"></div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelector('[data-story-home]')?.addEventListener('click', returnToHubFromStory);
  }

  function renderCantoComplete() {
    const story = state.story || normaliseQuickquillStory(activeSaveState().story);
    const result = story.race?.result || {};
    const rank = Math.max(1, Math.min(6, Number(result.rank) || 6));
    const band = storyResultBand(story);
    const label = band === 'win' ? 'RACE WIN' : band === 'podium' ? 'PODIUM' : band === 'midfield' ? 'RACE COMPLETE' : 'FINISHED';
    root.innerHTML = `
      <section class="story-complete-shell">
        <img class="story-backdrop" src="story/environments/05_Canto_Plains_Racing_Venue.png" alt="" aria-hidden="true">
        <div class="story-complete-stage">
          <div class="story-complete-glow" aria-hidden="true"></div>
          <small>QUICKQUILL: AGAINST THE ODDS · RACE ONE</small><h1>PROVE YOU<br>BELONG</h1><div class="story-complete-rule"></div>
          <p>${escapeHtml(storyDragonName())} completed the first professional start at Canto Plains. The result is part of the Career story, not ordinary Dragon Racing records.</p>
          <div class="story-complete-stats"><div><small>RESULT</small><strong>${rank}${rank===1?'ST':rank===2?'ND':rank===3?'RD':'TH'}</strong></div><div><small>OFFICIAL TIME</small><strong>${escapeHtml(storyRaceTime(story))}</strong></div><div><small>STRATEGY</small><strong>${escapeHtml(String(story.race?.strategy || 'focus').toUpperCase())}</strong></div></div>
          <div class="story-next-race"><span>${label}</span><strong>NEXT · A PLACE AT QUICKQUILL</strong><small>No race today. Go home first.</small></div>
          <button type="button" data-start-downtime>RETURN TO QUICKQUILL</button>
          <button type="button" class="story-complete-secondary" data-canto-complete-journey>STORY JOURNEY</button>
        </div><div class="story-screen-vignette" aria-hidden="true"></div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelector('[data-start-downtime]')?.addEventListener('click', () => { void startDowntimeChapter(); });
    root.querySelector('[data-canto-complete-journey]')?.addEventListener('click', () => { state.mode = 'story-journey'; playTone(310); render(); });
  }

  function renderDowntimeComplete() {
    const story = state.story || normaliseQuickquillStory(activeSaveState().story);
    const c3 = chapter3State(story);
    const evening = (c3.eveningMoments || []).map(id => EVENING_ACTIVITIES[id]?.title || id).join(' · ') || 'A quiet evening';
    const duty = c3.duty?.type ? DUTY_GAMES[c3.duty.type]?.title || 'Quickquill duty' : 'Quickquill duty';
    root.innerHTML = `
      <section class="story-complete-shell downtime-complete-shell">
        <img class="story-backdrop" src="story/environments/09_Quickquill_Player_Room.png" alt="" aria-hidden="true">
        <div class="story-complete-stage">
          <div class="story-complete-glow" aria-hidden="true"></div>
          <small>QUICKQUILL: AGAINST THE ODDS · CHAPTER THREE</small><h1>A PLACE AT<br>QUICKQUILL</h1><div class="story-complete-rule"></div>
          <p>${escapeHtml(storyDragonName())} has a room, a routine and the beginnings of a life here. Blackglass can wait until tomorrow.</p>
          <div class="story-complete-stats">
            <div><small>FIRST EVENING</small><strong>${escapeHtml(String((c3.eveningMoments || []).length))}/2</strong></div>
            <div><small>TEAM DUTY</small><strong>${escapeHtml(String(c3.duty?.score || 0))}/${escapeHtml(String(c3.duty?.total || 5))}</strong></div>
            <div><small>DRAGON BOND</small><strong>${escapeHtml(String(story.relationships?.dragonBond || 0))}</strong></div>
          </div>
          <div class="downtime-complete-memory"><small>YOUR STORY REMEMBERS</small><span>${escapeHtml(evening)}</span><span>${escapeHtml(duty)}</span></div>
          <div class="story-next-race"><span>NEXT</span><strong>CHAPTER FOUR · BLACKGLASS</strong><small>The briefing begins tomorrow.</small></div>
          <button type="button" data-downtime-complete-journey>RETURN TO STORY JOURNEY</button>
        </div><div class="story-screen-vignette" aria-hidden="true"></div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelector('[data-downtime-complete-journey]')?.addEventListener('click', () => { state.mode = 'story-journey'; playTone(310); render(); });
  }


  function renderBlackglassComplete() {
    const story = state.story || normaliseQuickquillStory(activeSaveState().story);
    const result = story.blackglassRace?.result || {};
    const q = chapter4State(story).qualifying || {};
    const rank = Math.max(1, Math.min(6, Number(result.rank) || 6));
    const overtakes = Math.max(0, Number(result.overtakes) || 0);
    const moment = String(result.notableMoment || (result.photoFinish ? 'A finish decided at the line' : 'A complete Blackglass race'));
    root.innerHTML = `
      <section class="story-complete-shell blackglass-complete-shell">
        <img class="story-backdrop" src="story/environments/20_Blackglass_Night_Circuit_Reveal.png" alt="" aria-hidden="true">
        <div class="story-complete-stage">
          <div class="story-complete-glow" aria-hidden="true"></div>
          <small>QUICKQUILL: AGAINST THE ODDS · RACE TWO</small><h1>BLACKGLASS<br>UNDER FLOODLIGHTS</h1><div class="story-complete-rule"></div>
          <p>${escapeHtml(storyDragonName())} leaves Blackglass with a result, a grid story and a race the Career will remember later.</p>
          <div class="story-complete-stats">
            <div><small>RESULT</small><strong>${ordinal(rank)}</strong></div>
            <div><small>OFFICIAL TIME</small><strong>${escapeHtml(blackglassRaceTime(story))}</strong></div>
            <div><small>QUALIFIED</small><strong>${ordinal(q.position || result.startPosition || 3)}</strong></div>
            <div><small>OVERTAKES</small><strong>${overtakes}</strong></div>
          </div>
          <div class="blackglass-memory-card"><small>RACE MEMORY</small><strong>${escapeHtml(moment)}</strong><span>${result.photoFinish ? 'PHOTO FINISH · ' : ''}${escapeHtml(String(story.blackglassRace?.strategy || chapter4State(story).strategy || 'focus').toUpperCase())} APPROACH · ${escapeHtml(blackglassStandingBand(story).toUpperCase())} PADDOCK STANDING</span></div>
          <div class="blackglass-weekend-recap"><span><small>DEEP STUDY</small><b>${escapeHtml(blackglassStudiedText(story))}</b></span><span><small>AFTER HOURS</small><b>${escapeHtml(String(chapter4State(story).afterHours?.memory || 'SLEPT THROUGH').toUpperCase())}</b></span><span><small>RACE MORNING</small><b>${escapeHtml(String(chapter4State(story).morningPrep || 'steady').replaceAll('-',' ').toUpperCase())}</b></span><span><small>KEEPSAKE</small><b>${escapeHtml(String(chapter4State(story).keepsake || 'circuit card').replaceAll('-',' ').toUpperCase())}</b></span></div>
          <div class="story-next-race"><span>NEXT</span><strong>CHAPTER FIVE · A SEAT AT THE TABLE</strong><small>Pressure, people and consequences.</small></div>
          <button type="button" data-blackglass-complete-journey>STORY JOURNEY</button>
          <button type="button" class="story-complete-secondary" data-story-home>CAREER HUB</button>
        </div><div class="story-screen-vignette" aria-hidden="true"></div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelector('[data-blackglass-complete-journey]')?.addEventListener('click',()=>{ state.mode='story-journey'; playTone(310); render(); });
    root.querySelector('[data-story-home]')?.addEventListener('click', returnToHubFromStory);
  }

  function renderStoryJourney() {
    if (testerReplayActive()) restoreTesterReplaySnapshot({ destination:'story-journey', renderNow:false });
    const story = state.story || normaliseQuickquillStory(activeSaveState().story);
    if (!story.completed?.prologue) {
      state.mode = 'story';
      state.story = story;
      renderStory();
      return;
    }
    const invitationChoice = story.choices?.invitationResponse?.label || 'Answer recorded';
    const assessmentChoice = story.choices?.assessmentResponse?.label || 'Answer recorded';
    const strategyChoice = story.choices?.cantoStrategy?.label || 'Canto strategy not chosen';
    const cantoStarted = QUICKQUILL_CANTO_SCENES.some(scene => scene.id === story.scene) && !story.completed?.canto;
    const cantoComplete = !!story.completed?.canto;
    const downtimeStarted = QUICKQUILL_DOWNTIME_SCENES.some(scene => scene.id === story.scene) && !story.completed?.downtime;
    const downtimeComplete = !!story.completed?.downtime;
    const blackglassStarted = QUICKQUILL_BLACKGLASS_SCENES.some(scene => scene.id === story.scene) && !story.completed?.blackglass;
    const blackglassComplete = blackglassChapterComplete(story);
    const seatStarted = QUICKQUILL_SEAT_SCENES.some(scene => scene.id === story.scene) && !story.completed?.seat;
    const seatComplete = !!story.completed?.seat;
    const crownWeekStarted = QUICKQUILL_CROWN_WEEK_SCENES.some(scene => scene.id === story.scene) && !story.completed?.crownWeek;
    const crownWeekComplete = !!story.completed?.crownWeek;
    const practiceStarted = QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(scene => scene.id === story.scene) && !story.completed?.practiceQualifying;
    const practiceComplete = !!story.completed?.practiceQualifying;
    const raceDay = lumerreRaceDayState(story);
    const raceDayStarted = story.chapter === 'lumerre-race-day' || !!raceDay.started;
    const raceDayComplete = !!story.completed?.raceWeekend || !!raceDay.completed;
    const afterFlagStarted = !!story.chapter6?.afterFlag?.started && !story.completed?.afterFlag;
    const afterFlagComplete = !!story.completed?.afterFlag || !!story.chapter6?.afterFlag?.completed;
    const verdictStarted = !!story.chapter7?.started && !story.completed?.verdict;
    const verdictComplete = !!story.completed?.verdict || !!story.chapter7?.completed;
    const seasonStarted = !!story.chapter8?.started && !story.completed?.seasonOpening;
    const seasonOpeningComplete = !!story.completed?.seasonOpening || !!story.chapter8?.completed;
    const c3 = chapter3State(story);
    const c4 = chapter4State(story);
    const c5 = chapter5State(story);
    const c6 = crownWeekState(story);
    const pq6 = practiceQualifyingState(story);
    const journeyStates = STORY_JOURNEY.map((chapter, index) => {
      let status = 'locked';
      if (index === 0) status = 'complete';
      else if (index === 1) status = cantoComplete ? 'complete' : 'next';
      else if (index === 2) status = !cantoComplete ? 'locked' : downtimeComplete ? 'complete' : 'next';
      else if (index === 3) status = !downtimeComplete ? 'locked' : blackglassComplete ? 'complete' : 'next';
      else if (index === 4) status = !blackglassComplete ? 'locked' : seatComplete ? 'complete' : seatStarted ? 'current' : 'next';
      else if (index === 5) status = !seatComplete ? 'locked' : afterFlagComplete ? 'complete' : crownWeekStarted || crownWeekComplete || practiceStarted || practiceComplete || raceDayStarted || afterFlagStarted ? 'current' : 'next';
      else if (index === 6) status = !afterFlagComplete ? 'locked' : verdictComplete ? 'complete' : verdictStarted ? 'current' : 'next';
      else if (index === 7) status = !verdictComplete ? 'locked' : seasonOpeningComplete ? 'complete' : seasonStarted ? 'current' : 'next';
      return { ...chapter, status };
    });
    const cantoAction = cantoComplete ? 'VIEW CANTO RESULT' : cantoStarted ? 'RESUME STORY CHAPTER' : 'BEGIN STORY CHAPTER';
    const downtimeAction = downtimeComplete ? 'VIEW CHAPTER RESULT' : downtimeStarted ? 'RESUME SETTLING IN' : 'BEGIN SETTLING IN';
    const blackglassAction = blackglassComplete ? 'VIEW BLACKGLASS RESULT' : blackglassStarted ? 'RESUME BLACKGLASS' : 'BEGIN BLACKGLASS';
    const seatAction = seatComplete ? 'VIEW CHAPTER RESULT' : seatStarted ? 'RESUME A SEAT AT THE TABLE' : 'BEGIN A SEAT AT THE TABLE';
    const crownAction = afterFlagComplete ? 'VIEW CHAPTER SIX RESULT' : afterFlagStarted ? 'RESUME AFTER THE FLAG' : raceDayComplete ? 'CONTINUE AFTER THE FLAG' : raceDayStarted ? 'RESUME RACE DAY' : practiceComplete ? 'BEGIN RACE DAY' : practiceStarted ? 'RESUME PRACTICE & QUALIFYING' : crownWeekComplete ? 'BEGIN PRACTICE DAY' : crownWeekStarted ? 'RESUME CROWN WEEK' : 'BEGIN CROWN WEEK';
    const crownCardLabel = !seatComplete ? 'LOCKED' : afterFlagComplete ? 'CHAPTER SIX · COMPLETE' : afterFlagStarted ? 'AFTER THE FLAG · IN PROGRESS' : raceDayComplete ? 'RACE COMPLETE · FINALE READY' : raceDayStarted ? 'RACE DAY · IN PROGRESS' : practiceComplete ? 'PRACTICE & QUALIFYING · COMPLETE' : practiceStarted ? 'PRACTICE & QUALIFYING · IN PROGRESS' : crownWeekComplete ? 'CROWN WEEK · DAY ONE COMPLETE' : crownWeekStarted ? 'CROWN WEEK · IN PROGRESS' : 'CROWN WEEK · READY';
    const crownCardSummary = afterFlagComplete ? `${escapeHtml(storyDragonName())} finished ${ordinal(raceDay.finalPosition || 7)} at Lumerre. The race, media reaction and Quickquill HQ summons are now part of the permanent Career record.` : afterFlagStarted ? `The Crown is finished. Parc fermé, media and the Quickquill evening are still unfolding.` : raceDayComplete ? `${escapeHtml(storyDragonName())} finished ${ordinal(raceDay.finalPosition || 7)} in the Lumerre Crown${raceDay.tyreseFinish ? ` · Tyrese ${ordinal(raceDay.tyreseFinish)}` : ''}.` : raceDayStarted ? `Race Day is live. Current phase: ${escapeHtml(lumerreRacePhaseLabel(raceDay.phase || 'grid'))}.` : practiceComplete ? `${escapeHtml(storyDragonName())} qualified ${escapeHtml(lumerreQualifyingPositionLabel(story))} with ${escapeHtml(formatStoryLap(pq6.qualifying?.bestLapMs || 0))}. Practice found the setup; Race Day is next.` : crownWeekComplete ? `Crown Week opened with ${escapeHtml(String(c6.village?.encounters?.length || 0))} paddock encounters, a ${escapeHtml(crownChallengeRankLabel(story))} Crown Challenge finish and ${c6.reception?.overlookSeen ? 'a discovered circuit-overlook moment' : 'an evening at the garden reception'}. Practice Day is ready.` : 'Crown Week begins before the circuit does: open paddock exploration, public parade, the traditional Crown Challenge and a night among the full professional grid.';
    const crownCardActionAttr = seatComplete ? (afterFlagComplete ? 'data-view-after-flag' : afterFlagStarted ? 'data-resume-after-flag' : raceDayComplete ? 'data-start-after-flag' : raceDayStarted || practiceComplete ? 'data-start-lumerre-race' : crownWeekComplete || practiceStarted ? 'data-start-lumerre-practice' : 'data-start-crown-week') : 'disabled';
    const verdictAction = verdictComplete ? 'VIEW THE VERDICT' : verdictStarted ? 'RESUME THE VERDICT' : 'BEGIN THE VERDICT';
    const verdictActionAttr = !afterFlagComplete ? 'disabled' : verdictComplete ? 'data-view-verdict' : 'data-start-verdict';
    const seasonAction = seasonOpeningComplete ? 'OPEN SEASON CONTROL' : seasonStarted ? 'RESUME OPENING WEEK' : 'BEGIN OPENING WEEK';
    const seasonActionAttr = !verdictComplete ? 'disabled' : seasonOpeningComplete ? 'data-view-season' : 'data-start-season';
    const decisionCount = Object.keys(story.choices || {}).length + (c3.eveningMoments || []).length + (c3.duty?.completed ? 1 : 0) + (c4.qualifying?.completed ? 1 : 0) + (c4.eveningMoments || []).length + (c4.studiedSections || []).length + (c4.roomActions || []).length + (c4.morningPrep ? 1 : 0) + (c4.afterHours?.completed ? 1 : 0) + (c5.simulator?.answers || []).length + (c5.media?.answers || []).length + (c5.freeTime?.activities || []).length + (c6.village?.encounters || []).length + (c6.reception?.conversations || []).length + (c6.challenge?.completed ? 4 : 0) + (c6.reception?.overlookSeen ? 1 : 0) + (pq6.practice?.run1 ? 1 : 0) + (pq6.practice?.setupApplied ? 1 : 0) + (pq6.practice?.diagnosis?.completed ? 1 : 0) + (pq6.practice?.run2 ? 1 : 0) + (pq6.qualifying?.run1 ? 1 : 0) + (pq6.qualifying?.window ? 1 : 0) + (pq6.qualifying?.run2 ? 1 : 0) + (pq6.qualifying?.run3 ? 1 : 0);
    const completedCount = 1 + (cantoComplete ? 1 : 0) + (downtimeComplete ? 1 : 0) + (blackglassComplete ? 1 : 0) + (seatComplete ? 1 : 0) + (afterFlagComplete ? 1 : 0) + (verdictComplete ? 1 : 0) + (seasonOpeningComplete ? 1 : 0);
    root.innerHTML = `
      <section class="story-journey-shell" aria-label="Dragonbound Story Journey">
        <img class="journey-backdrop" src="story/environments/07_Lumerre_Terraces_and_Paddock.png" alt="" aria-hidden="true">
        <div class="journey-stage">
          <div class="journey-atmosphere" aria-hidden="true"></div><div class="journey-grid" aria-hidden="true"></div><div class="journey-vignette" aria-hidden="true"></div>
          <header class="journey-header"><div><strong>DRAGONBOUND</strong><span>FOLLOW THE STORY</span></div><button type="button" data-journey-back aria-label="Return to Career Hub"><i aria-hidden="true">←</i><span>BACK</span></button></header>
          ${isCatAsthmaTester() ? `<section class="tester-replay-panel" aria-label="CatAsthma chapter replay controls"><div><small>CATASTHMA QA TOOL</small><strong>NON-DESTRUCTIVE CHAPTER REPLAY</strong><span>Launch any implemented chapter from its opening scene. Test choices, races and results stay temporary; your live cloud save is restored when you leave replay.</span></div><nav>${TESTER_REPLAY_CHAPTERS.map(chapter => `<button type="button" data-tester-replay="${chapter.id}"><b>${chapter.number}</b><span><small>${escapeHtml(chapter.phase)}</small><strong>${escapeHtml(chapter.label)}</strong></span><i>REPLAY ›</i></button>`).join('')}</nav></section>` : ''}
          <nav class="journey-route" aria-label="Quickquill chapter progress">
            <div class="journey-route-line"><i></i></div>
            ${journeyStates.map((chapter, index) => `<div class="journey-route-node is-${chapter.status}" style="--journey-delay:${.34 + index * .12}s"><b>${chapter.status === 'complete' ? '✓' : index + 1}</b><span>${escapeHtml(chapter.number)}</span></div>`).join('')}
          </nav>
          <main class="journey-board">
            <aside class="journey-rail" aria-hidden="true">${journeyStates.map((chapter, index) => `<span class="is-${chapter.status}" style="--journey-delay:${.55 + index * .11}s"><i></i><b>${chapter.number}</b></span>`).join('')}</aside>
            <section class="journey-content">
              <header><div><small>QUICKQUILL CAREER · CHAPTER JOURNEY</small><h1>AGAINST THE ODDS</h1></div><div class="journey-record"><span>RACER IDENTITY</span><strong>${escapeHtml(dominantIdentity(story))}</strong></div></header>
              <div class="journey-chapters has-downtime">
                <article class="journey-card is-complete">
                  <img src="${STORY_JOURNEY[0].image}" alt="">
                  <div class="journey-card-shade" aria-hidden="true"></div><div class="journey-card-scan" aria-hidden="true"></div>
                  <div class="journey-card-copy"><span><b>01</b><small>PROLOGUE · COMPLETE</small></span><h2>THE IMPOSSIBLE CONTRACT</h2><p>${escapeHtml(storyDragonName())} claimed Quickquill’s empty locker and earned a three-race assessment.</p><button type="button" data-view-prologue>VIEW CHAPTER RESULT <i>›</i></button></div>
                  <div class="journey-complete-stamp"><i>✓</i><span>COMPLETE</span></div>
                </article>
                <article class="journey-card ${cantoComplete ? 'is-complete' : 'is-next'}">
                  <img src="${STORY_JOURNEY[1].image}" alt="">
                  <div class="journey-card-shade" aria-hidden="true"></div>${cantoComplete ? '<div class="journey-card-scan" aria-hidden="true"></div>' : '<div class="journey-unlock-flare" aria-hidden="true"></div>'}
                  <div class="journey-card-copy"><span><b>02</b><small>${cantoComplete ? 'RACE ONE · COMPLETE' : cantoStarted ? 'RACE ONE · IN PROGRESS' : 'RACE ONE · READY'}</small></span><h2>PROVE YOU BELONG</h2><p>${cantoComplete ? `${escapeHtml(storyDragonName())} finished ${Number(story.race?.result?.rank) || 6} at Canto in ${escapeHtml(storyRaceTime(story))}.` : 'Canto Plains. First professional start. The champions have already heard the rumour.'}</p><button type="button" ${cantoComplete ? 'data-view-canto' : 'data-start-canto'}>${cantoAction} <i>›</i></button></div>
                  ${cantoComplete ? '<div class="journey-complete-stamp"><i>✓</i><span>COMPLETE</span></div>' : '<div class="journey-unlock-seal" aria-hidden="true"><i>◆</i><span>PATH UNLOCKED</span></div>'}
                </article>
                <article class="journey-card ${!cantoComplete ? 'is-locked' : downtimeComplete ? 'is-complete' : 'is-next'}">
                  <img src="${STORY_JOURNEY[2].image}" alt="">
                  <div class="journey-card-shade" aria-hidden="true"></div>${downtimeComplete ? '<div class="journey-card-scan" aria-hidden="true"></div>' : cantoComplete ? '<div class="journey-unlock-flare" aria-hidden="true"></div>' : ''}
                  <div class="journey-card-copy"><span><b>03</b><small>${!cantoComplete ? 'LOCKED' : downtimeComplete ? 'DOWNTIME · COMPLETE' : downtimeStarted ? 'DOWNTIME · IN PROGRESS' : 'DOWNTIME · READY'}</small></span><h2>A PLACE AT QUICKQUILL</h2><p>${downtimeComplete ? 'A room, a routine, two remembered evening choices and one very real place in the team.' : 'Go home after Canto. Unpack. Meet the people behind the race weekends. No starting lights required.'}</p><button type="button" ${cantoComplete ? (downtimeComplete ? 'data-view-downtime' : 'data-start-downtime') : 'disabled'}>${cantoComplete ? downtimeAction : 'COMPLETE CANTO FIRST'} <i>›</i></button></div>
                  ${downtimeComplete ? '<div class="journey-complete-stamp"><i>✓</i><span>COMPLETE</span></div>' : cantoComplete ? '<div class="journey-unlock-seal" aria-hidden="true"><i>◆</i><span>PATH UNLOCKED</span></div>' : ''}
                </article>
                <article class="journey-card journey-card-blackglass ${!downtimeComplete ? 'is-locked' : blackglassComplete ? 'is-complete' : 'is-next'}">
                  <img src="${STORY_JOURNEY[3].image}" alt="">
                  <div class="journey-card-shade" aria-hidden="true"></div>${blackglassComplete ? '<div class="journey-card-scan" aria-hidden="true"></div>' : downtimeComplete ? '<div class="journey-unlock-flare" aria-hidden="true"></div>' : ''}
                  <div class="journey-card-copy"><span><b>04</b><small>${!downtimeComplete ? 'LOCKED' : blackglassComplete ? 'RACE TWO · COMPLETE' : blackglassStarted ? 'RACE TWO · IN PROGRESS' : 'RACE TWO · READY'}</small></span><h2>BLACKGLASS UNDER FLOODLIGHTS</h2><p>${blackglassComplete ? `${escapeHtml(storyDragonName())} finished ${ordinal(story.blackglassRace?.result?.rank || 6)} at Blackglass after qualifying ${ordinal(c4.qualifying?.position || 3)}.` : 'A full northern race weekend: arrive, learn the circuit, qualify, live through the long night, then race under the floodlights.'}</p><button type="button" ${downtimeComplete ? (blackglassComplete ? 'data-view-blackglass' : 'data-start-blackglass') : 'disabled'}>${downtimeComplete ? blackglassAction : 'COMPLETE QUICKQUILL DOWNTIME FIRST'} <i>›</i></button></div>
                  ${blackglassComplete ? '<div class="journey-complete-stamp"><i>✓</i><span>COMPLETE</span></div>' : downtimeComplete ? '<div class="journey-unlock-seal" aria-hidden="true"><i>◆</i><span>PATH UNLOCKED</span></div>' : ''}
                </article>
                <article class="journey-card journey-card-seat ${!blackglassComplete ? 'is-locked' : seatComplete ? 'is-complete' : 'is-next'}">
                  <img src="${STORY_JOURNEY[4].image}" alt="">
                  <div class="journey-card-shade" aria-hidden="true"></div>${seatComplete ? '<div class="journey-card-scan" aria-hidden="true"></div>' : blackglassComplete ? '<div class="journey-unlock-flare" aria-hidden="true"></div>' : ''}
                  <div class="journey-card-copy"><span><b>05</b><small>${!blackglassComplete ? 'LOCKED' : seatComplete ? 'CHAPTER FIVE · COMPLETE' : seatStarted ? 'CHAPTER FIVE · IN PROGRESS' : 'CHAPTER FIVE · READY'}</small></span><h2>A SEAT AT THE TABLE</h2><p>${seatComplete ? `${escapeHtml(storyDragonName())} left the Blackglass review with a simulator profile of ${escapeHtml(c5.simulator?.profile||deriveSeatSimulatorProfile(story))}, a media reputation of ${escapeHtml(c5.media?.reputation||deriveMediaReputation(story))}, and a confirmed Lumerre role: ${escapeHtml(c5.lumerreRole||deriveLumerreRole(story))}.` : 'Quickquill moves the assessment away from the circuit. Strategy, press attention and team politics now decide how you arrive at Lumerre.'}</p><button type="button" ${blackglassComplete ? (seatComplete ? 'data-view-seat' : 'data-start-seat') : 'disabled'}>${blackglassComplete ? seatAction : 'COMPLETE BLACKGLASS FIRST'} <i>›</i></button></div>
                  ${seatComplete ? '<div class="journey-complete-stamp"><i>✓</i><span>COMPLETE</span></div>' : blackglassComplete ? '<div class="journey-unlock-seal" aria-hidden="true"><i>◆</i><span>PATH UNLOCKED</span></div>' : ''}
                </article>
                <article class="journey-card journey-card-crown ${!seatComplete ? 'is-locked' : afterFlagComplete ? 'is-complete' : (crownWeekStarted || crownWeekComplete || practiceStarted || practiceComplete || raceDayStarted || afterFlagStarted) ? 'is-current' : 'is-next'}">
                  <img src="${STORY_JOURNEY[5].image}" alt="">
                  <div class="journey-card-shade" aria-hidden="true"></div>${seatComplete ? '<div class="journey-unlock-flare" aria-hidden="true"></div>' : ''}
                  <div class="journey-card-copy"><span><b>06</b><small>${crownCardLabel}</small></span><h2>THE LUMERRE CROWN</h2><p>${crownCardSummary}</p><button type="button" ${crownCardActionAttr}>${seatComplete ? crownAction : 'COMPLETE A SEAT AT THE TABLE FIRST'} <i>›</i></button></div>
                  ${afterFlagComplete ? '<div class="journey-complete-stamp"><i>✓</i><span>COMPLETE</span></div>' : afterFlagStarted ? '<div class="journey-unlock-seal"><i>◆</i><span>AFTER THE FLAG</span></div>' : raceDayComplete ? '<div class="journey-progress-stamp"><i>✓</i><span>FINALE READY</span></div>' : practiceComplete ? '<div class="journey-progress-stamp"><i>✓</i><span>QUALIFYING COMPLETE</span></div>' : practiceStarted ? '<div class="journey-unlock-seal" aria-hidden="true"><i>◆</i><span>PRACTICE LIVE</span></div>' : seatComplete && !crownWeekComplete ? '<div class="journey-unlock-seal" aria-hidden="true"><i>◆</i><span>CROWN WEEK LIVE</span></div>' : crownWeekComplete ? '<div class="journey-progress-stamp"><i>✓</i><span>DAY ONE COMPLETE</span></div>' : ''}
                </article>
                <article class="journey-card journey-card-verdict ${!afterFlagComplete ? 'is-locked' : verdictComplete ? 'is-complete' : 'is-next'}">
                  <img src="${STORY_JOURNEY[6].image}" alt="">
                  <div class="journey-card-shade" aria-hidden="true"></div>${afterFlagComplete ? '<div class="journey-unlock-flare" aria-hidden="true"></div>' : ''}
                  <div class="journey-card-copy"><span><b>07</b><small>${!afterFlagComplete?'LOCKED':verdictComplete?'CHAPTER SEVEN · COMPLETE':verdictStarted?'CONTRACT TALKS · IN PROGRESS':'CONTRACT TALKS · READY'}</small></span><h2>THE VERDICT</h2><p>${verdictComplete?escapeHtml(verdictDecisionSummary(story.chapter7||{})):'Quickquill HQ. A real contract, two negotiable asks, an outside question from Sunscale and the first career decision that can be delayed.'}</p><button type="button" ${verdictActionAttr}>${afterFlagComplete?verdictAction:'COMPLETE THE LUMERRE CROWN FIRST'} <i>›</i></button></div>
                  ${verdictComplete?'<div class="journey-complete-stamp"><i>✓</i><span>COMPLETE</span></div>':afterFlagComplete?'<div class="journey-unlock-seal"><i>◆</i><span>CAREER DECISION</span></div>':''}
                </article>
                <article class="journey-card journey-card-season ${!verdictComplete?'is-locked':seasonOpeningComplete?'is-complete':'is-next'}">
                  <img src="${STORY_JOURNEY[7].image}" alt="">
                  <div class="journey-card-shade" aria-hidden="true"></div>${verdictComplete?'<div class="journey-unlock-flare" aria-hidden="true"></div>':''}
                  <div class="journey-card-copy"><span><b>08</b><small>${!verdictComplete?'LOCKED':seasonOpeningComplete?'OPENING WEEK · COMPLETE':seasonStarted?'OPENING WEEK · IN PROGRESS':'FULL SEASON · READY'}</small></span><h2>THE FIRST FULL SEASON</h2><p>${seasonOpeningComplete?'Your calendar, preparation profile, technical record, pit-wall grade and three chosen promises now live in Season Control.':'Eight rounds begin with choices off the circuit: inspect the calendar, spend six preparation hours, solve a telemetry fault, command the pit wall and write your own objectives.'}</p><button type="button" ${seasonActionAttr}>${verdictComplete?seasonAction:'COMPLETE THE VERDICT FIRST'} <i>›</i></button></div>
                  ${seasonOpeningComplete?'<div class="journey-complete-stamp"><i>✓</i><span>CONTROL LIVE</span></div>':verdictComplete?'<div class="journey-unlock-seal"><i>◆</i><span>SEASON OPENS</span></div>':''}
                </article>
              </div>
              <footer class="journey-decisions"><div><small>YOUR STORY REMEMBERS</small><span>${escapeHtml(invitationChoice)}</span><span>${escapeHtml(cantoComplete ? (story.choices?.cantoAttitude?.label || strategyChoice) : cantoStarted ? strategyChoice : assessmentChoice)}</span></div><p><strong>${decisionCount}</strong><span>DECISIONS & MOMENTS<br>RECORDED</span></p></footer>
            </section>
          </main>
          <footer class="journey-footer"><span><i>⌂</i> CAREER HUB</span><strong>STORY JOURNEY</strong><span>QUICKQUILL · ${completedCount} / 8</span></footer>
        </div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelector('[data-journey-back]')?.addEventListener('click', returnToHubFromStory);
    root.querySelectorAll('[data-tester-replay]').forEach(button => button.addEventListener('click', () => beginTesterReplay(String(button.dataset.testerReplay || ''))));
    root.querySelector('[data-view-prologue]')?.addEventListener('click', () => { playTone(310); renderStoryComplete(); });
    root.querySelector('[data-start-canto]')?.addEventListener('click', () => { void startCantoChapter(); });
    root.querySelector('[data-view-canto]')?.addEventListener('click', () => { playTone(310); renderCantoComplete(); });
    root.querySelector('[data-start-downtime]')?.addEventListener('click', () => { void startDowntimeChapter(); });
    root.querySelector('[data-view-downtime]')?.addEventListener('click', () => { playTone(310); renderDowntimeComplete(); });
    root.querySelector('[data-start-blackglass]')?.addEventListener('click', () => { void startBlackglassChapter(); });
    root.querySelector('[data-view-blackglass]')?.addEventListener('click', () => { playTone(310); renderBlackglassComplete(); });
    root.querySelector('[data-start-seat]')?.addEventListener('click', () => { void startSeatChapter(); });
    root.querySelector('[data-view-seat]')?.addEventListener('click', () => { playTone(310); renderSeatComplete(); });
    root.querySelector('[data-start-crown-week]')?.addEventListener('click', () => { void startCrownWeek(); });
    root.querySelector('[data-view-crown-week]')?.addEventListener('click', () => { playTone(310); renderCrownWeekComplete(); });
    root.querySelector('[data-start-lumerre-practice]')?.addEventListener('click', () => { void startLumerrePracticeQualifying(); });
    root.querySelector('[data-view-lumerre-practice]')?.addEventListener('click', () => { playTone(310); renderPracticeQualifyingComplete(); });
    root.querySelector('[data-start-lumerre-race]')?.addEventListener('click', () => { void startLumerreRaceDay(); });
    root.querySelector('[data-view-lumerre-race]')?.addEventListener('click', () => { void startLumerreRaceDay(); });
    root.querySelector('[data-start-after-flag]')?.addEventListener('click', () => { void startLumerreAfterFlag(); });
    root.querySelector('[data-resume-after-flag]')?.addEventListener('click', () => { state.mode='story';state.story.chapter='lumerre-after-flag';render();syncMusic({restart:true}); });
    root.querySelector('[data-view-after-flag]')?.addEventListener('click', () => { state.mode='story';state.story.chapter='lumerre-after-flag';state.story.scene='q65';state.story.beat=0;render();syncMusic({restart:true}); });
    root.querySelector('[data-start-verdict]')?.addEventListener('click', () => { void startVerdictChapter(); });
    root.querySelector('[data-view-verdict]')?.addEventListener('click', () => { state.mode='story';state.story.chapter='verdict';state.story.scene='q74';state.story.beat=0;render();syncMusic({restart:true}); });
    root.querySelector('[data-start-season]')?.addEventListener('click', () => { void startSeasonOpening(); });
    root.querySelector('[data-view-season]')?.addEventListener('click', () => { state.mode='story';state.story.chapter='season-one';state.story.scene='q80';state.story.beat=0;render();syncMusic({restart:true}); });
  }

  function nextStoryPointer(story) {
    const next = cloneValue(story);
    const inCanto = QUICKQUILL_CANTO_SCENES.some(scene => scene.id === next.scene);
    const inDowntime = QUICKQUILL_DOWNTIME_SCENES.some(scene => scene.id === next.scene);
    const inBlackglass = QUICKQUILL_BLACKGLASS_SCENES.some(scene => scene.id === next.scene);
    const inSeat = QUICKQUILL_SEAT_SCENES.some(scene => scene.id === next.scene);
    const inCrownWeek = QUICKQUILL_CROWN_WEEK_SCENES.some(scene => scene.id === next.scene);
    const inLumerrePractice = QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(scene => scene.id === next.scene);
    const scenes = inLumerrePractice ? QUICKQUILL_LUMERRE_PRACTICE_SCENES : inCrownWeek ? QUICKQUILL_CROWN_WEEK_SCENES : inSeat ? QUICKQUILL_SEAT_SCENES : inBlackglass ? QUICKQUILL_BLACKGLASS_SCENES : inDowntime ? QUICKQUILL_DOWNTIME_SCENES : inCanto ? QUICKQUILL_CANTO_SCENES : QUICKQUILL_SCENES;
    const sceneIndex = scenes.findIndex(scene => scene.id === next.scene);
    const scene = scenes[Math.max(0, sceneIndex)];
    if (next.beat < scene.beats.length - 1) {
      next.beat += 1;
      return { story: next, changedScene: false, completed: false };
    }
    if (sceneIndex < scenes.length - 1) {
      next.scene = scenes[sceneIndex + 1].id;
      next.beat = 0;
      if (next.scene === 'q36') next.chapter5 = { ...defaultQuickquillStory().chapter5, ...(next.chapter5||{}), sofia:{...defaultQuickquillStory().chapter5.sofia,...(next.chapter5?.sofia||{}),discovered:true} };
      if (next.scene === 'q38') next.chapter5 = { ...defaultQuickquillStory().chapter5, ...(next.chapter5||{}), lumerreRole:next.chapter5?.lumerreRole || deriveLumerreRole(next) };
      if (inCrownWeek) {
        next.chapter6 = { ...defaultQuickquillStory().chapter6, ...(next.chapter6 || {}), crownWeek:{...defaultQuickquillStory().chapter6.crownWeek,...(next.chapter6?.crownWeek || {}),started:true} };
      }
      if (inLumerrePractice) {
        next.chapter6 = { ...defaultQuickquillStory().chapter6, ...(next.chapter6 || {}), practiceQualifying:{...defaultQuickquillStory().chapter6.practiceQualifying,...(next.chapter6?.practiceQualifying || {}),started:true,practice:{...defaultQuickquillStory().chapter6.practiceQualifying.practice,...(next.chapter6?.practiceQualifying?.practice||{}),setup:{...defaultQuickquillStory().chapter6.practiceQualifying.practice.setup,...(next.chapter6?.practiceQualifying?.practice?.setup||{})},diagnosis:{...defaultQuickquillStory().chapter6.practiceQualifying.practice.diagnosis,...(next.chapter6?.practiceQualifying?.practice?.diagnosis||{})}},qualifying:{...defaultQuickquillStory().chapter6.practiceQualifying.qualifying,...(next.chapter6?.practiceQualifying?.qualifying||{})}} };
      }
      return { story: next, changedScene: true, completed: false };
    }
    if (inLumerrePractice) {
      const completedAt = new Date().toISOString();
      next.completed = { ...(next.completed || {}), practiceQualifying: true };
      next.chapter = 'lumerre-race-day';
      next.chapter6 = { ...defaultQuickquillStory().chapter6, ...(next.chapter6 || {}), practiceQualifying:{...defaultQuickquillStory().chapter6.practiceQualifying,...(next.chapter6?.practiceQualifying||{}),started:true,completed:true,completedAt,practice:{...defaultQuickquillStory().chapter6.practiceQualifying.practice,...(next.chapter6?.practiceQualifying?.practice||{}),setup:{...defaultQuickquillStory().chapter6.practiceQualifying.practice.setup,...(next.chapter6?.practiceQualifying?.practice?.setup||{})},diagnosis:{...defaultQuickquillStory().chapter6.practiceQualifying.practice.diagnosis,...(next.chapter6?.practiceQualifying?.practice?.diagnosis||{})}},qualifying:{...defaultQuickquillStory().chapter6.practiceQualifying.qualifying,...(next.chapter6?.practiceQualifying?.qualifying||{})}} };
      const evolution = syncCareerEvolution(next);
      evolution.chapterTypesUsed = Array.isArray(evolution.chapterTypesUsed) ? evolution.chapterTypesUsed : [];
      if (!evolution.chapterTypesUsed.includes('technical-crisis')) evolution.chapterTypesUsed.push('technical-crisis');
      next.careerEvolution = evolution;
      next.beat = scene.beats.length - 1;
      next.history = [...(next.history || []), { scene:'q56', event:'lumerre-practice-qualifying-complete', qualifyingPosition:next.chapter6.practiceQualifying.qualifying?.position || null, bestLapMs:next.chapter6.practiceQualifying.qualifying?.bestLapMs || 0 }].slice(-100);
      return { story: next, changedScene: true, completed: true };
    }
    if (inCrownWeek) {
      const completedAt = new Date().toISOString();
      next.completed = { ...(next.completed || {}), crownWeek: true };
      next.chapter = 'lumerre-practice';
      next.chapter6 = { ...defaultQuickquillStory().chapter6, ...(next.chapter6 || {}), crownWeek:{...defaultQuickquillStory().chapter6.crownWeek,...(next.chapter6?.crownWeek || {}),started:true,completed:true,completedAt} };
      const evolution = syncCareerEvolution(next);
      evolution.chapterTypesUsed = Array.isArray(evolution.chapterTypesUsed) ? evolution.chapterTypesUsed : [];
      if (!evolution.chapterTypesUsed.includes('festival')) evolution.chapterTypesUsed.push('festival');
      if (!evolution.chapterTypesUsed.includes('open-hub')) evolution.chapterTypesUsed.push('open-hub');
      next.careerEvolution = evolution;
      next.beat = scene.beats.length - 1;
      next.history = [...(next.history || []), { scene:'q45', event:'crown-week-day-one-complete', challengeRank:next.chapter6.crownWeek.challenge?.rank || null, overlook:!!next.chapter6.crownWeek.reception?.overlookSeen }].slice(-100);
      return { story: next, changedScene: true, completed: true };
    }
    if (inSeat) {
      next.completed = { ...(next.completed || {}), seat: true };
      next.chapter = 'lumerre';
      next.chapter5 = { ...defaultQuickquillStory().chapter5, ...(next.chapter5 || {}), lumerreRole:next.chapter5?.lumerreRole || deriveLumerreRole(next) };
      next.beat = scene.beats.length - 1;
      next.history = [...(next.history || []), { scene:'q39', event:'seat-at-table-complete', role:next.chapter5.lumerreRole }].slice(-100);
      return { story: next, changedScene: true, completed: true };
    }
    if (inBlackglass) {
      next.completed = { ...(next.completed || {}), blackglass: true };
      next.chapter = 'pressure';
      next.blackglassRace = { ...(next.blackglassRace || {}), status: 'complete' };
      next.beat = scene.beats.length - 1;
      next.history = [...(next.history || []), { scene: 'q31', event: 'blackglass-chapter-complete' }].slice(-100);
      return { story: next, changedScene: true, completed: true };
    }
    if (inDowntime) {
      next.completed = { ...(next.completed || {}), downtime: true };
      next.chapter = 'blackglass';
      next.beat = scene.beats.length - 1;
      next.history = [...(next.history || []), { scene: 'q17', event: 'downtime-chapter-complete' }].slice(-100);
      return { story: next, changedScene: true, completed: true };
    }
    if (inCanto) {
      next.completed = { ...(next.completed || {}), canto: true };
      next.chapter = 'downtime';
      next.race = { ...(next.race || {}), status: 'complete' };
      next.beat = scene.beats.length - 1;
      return { story: next, changedScene: true, completed: true };
    }
    next.completed = { ...(next.completed || {}), prologue: true };
    next.chapter = 'race-one';
    next.beat = scene.beats.length - 1;
    return { story: next, changedScene: true, completed: true };
  }

  async function saveStoryProgress(nextStory, { transition = false } = {}) {
    try {
      if (transition) {
        state.transitionLocked = true;
        state.blackout = true;
        root.querySelector('.blackout')?.classList.add('is-visible');
        await delay(840);
      }
      await persistStory(nextStory);
      state.storyError = '';
      if (transition) {
        state.blackout = true;
        render();
        await delay(180);
        state.blackout = false;
        root.querySelector('.blackout')?.classList.remove('is-visible');
        state.transitionLocked = false;
      } else {
        render();
      }
      // Scene-aware Career music follows story transitions without restarting
      // the same track. This is especially important for Q33→Q34, Q36→Q37
      // and Q38→Q39 in A Seat at the Table.
      syncMusic();
      return true;
    } catch (error) {
      console.error('[Dragonbound Career Mode] Story autosave failed', error);
      state.storySaving = false;
      state.transitionLocked = false;
      state.blackout = false;
      state.storyError = error?.message || 'Progress could not be saved. Check your connection and try again.';
      render();
      return false;
    }
  }

  async function startCantoChapter() {
    if (state.storySaving || state.transitionLocked || !state.activeSave) return;
    const current = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (!current.completed?.prologue || current.completed?.canto) return;
    const alreadyInCanto = QUICKQUILL_CANTO_SCENES.some(scene => scene.id === current.scene);
    if (!alreadyInCanto) {
      current.chapter = 'race-one';
      current.scene = 'q4';
      current.beat = 0;
      current.race = { ...(current.race || {}), status: current.race?.result ? 'complete' : 'not-started' };
      await persistStory(current, { stageOverride: 'quickquill-canto-story' });
    } else {
      state.story = current;
    }
    state.mode = 'story';
    state.storyError = '';
    playTone(420);
    render();
    syncMusic({ restart: true });
  }

  async function startDowntimeChapter() {
    if (state.storySaving || state.transitionLocked || !state.activeSave) return;
    const current = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (!current.completed?.canto || current.completed?.downtime) return;
    const alreadyInDowntime = QUICKQUILL_DOWNTIME_SCENES.some(scene => scene.id === current.scene);
    if (!alreadyInDowntime) {
      current.chapter = 'downtime';
      current.scene = 'q9';
      current.beat = 0;
      current.chapter3 = { ...defaultQuickquillStory().chapter3, ...(current.chapter3 || {}), room: { ...defaultQuickquillStory().chapter3.room, ...(current.chapter3?.room || {}) }, duty: { ...defaultQuickquillStory().chapter3.duty, ...(current.chapter3?.duty || {}) }, traits: { ...defaultQuickquillStory().chapter3.traits, ...(current.chapter3?.traits || {}) } };
      current.history = [...(current.history || []), { scene: 'q9', event: 'downtime-chapter-start' }].slice(-100);
      await persistStory(current, { stageOverride: 'quickquill-downtime-story' });
    } else {
      state.story = current;
    }
    state.downtimeActivity = '';
    state.downtimeMessage = '';
    state.dutySession = null;
    state.freeRoamMugClicks = 0;
    state.mode = 'story';
    state.storyError = '';
    playTone(390);
    render();
    syncMusic({ restart: true });
  }


  async function startBlackglassChapter() {
    if (state.storySaving || state.transitionLocked || !state.activeSave) return;
    const current = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (!current.completed?.downtime || current.completed?.blackglass) return;
    const alreadyInBlackglass = QUICKQUILL_BLACKGLASS_SCENES.some(scene => scene.id === current.scene);
    if (!alreadyInBlackglass) {
      current.chapter = 'blackglass';
      current.scene = 'q18';
      current.beat = 0;
      current.chapter4 = { ...defaultQuickquillStory().chapter4, ...(current.chapter4 || {}), qualifying:{...defaultQuickquillStory().chapter4.qualifying, ...(current.chapter4?.qualifying || {})}, raceMemory:Array.isArray(current.chapter4?.raceMemory)?current.chapter4.raceMemory.slice(-24):[] };
      current.blackglassRace = { ...defaultQuickquillStory().blackglassRace, ...(current.blackglassRace || {}), status: current.blackglassRace?.result ? 'complete' : 'not-started' };
      current.history = [...(current.history || []), { scene:'q18', event:'blackglass-chapter-start' }].slice(-100);
      await persistStory(current, { stageOverride:'quickquill-blackglass-story' });
    } else {
      state.story = current;
    }
    state.mode = 'story';
    state.storyError = '';
    playTone(370);
    render();
    syncMusic({ restart:true });
  }

  function currentBlackglassStrategy(story = state.story) {
    const explicit = String(story?.blackglassRace?.strategy || story?.chapter4?.strategy || (story?.chapter4?.setupPlan==='attack'?'fire':story?.chapter4?.setupPlan==='forgiving'?'heart':'focus') || '').toLowerCase();
    if (['focus','fire','heart'].includes(explicit)) return explicit;
    const option = Number(story?.choices?.blackglassStrategy?.option);
    return option === 1 ? 'fire' : option === 2 ? 'heart' : 'focus';
  }

  function currentCantoStrategy(story = state.story) {
    const explicit = String(story?.race?.strategy || '').toLowerCase();
    if (['focus','fire','heart'].includes(explicit)) return explicit;
    const option = Number(story?.choices?.cantoStrategy?.option);
    return option === 1 ? 'fire' : option === 2 ? 'heart' : 'focus';
  }


  async function startSeatChapter() {
    if (state.storySaving || state.transitionLocked || !state.activeSave) return;
    const current=normaliseQuickquillStory(state.story || activeSaveState().story);
    if (!blackglassChapterComplete(current) || current.completed?.seat) return;
    if (!current.completed?.blackglass) current.completed = { ...(current.completed || {}), blackglass: true };
    const already=QUICKQUILL_SEAT_SCENES.some(scene=>scene.id===current.scene);
    if (!already) {
      current.chapter='seat'; current.scene='q32'; current.beat=0;
      current.chapter5={...defaultQuickquillStory().chapter5,...(current.chapter5||{}),simulator:{...defaultQuickquillStory().chapter5.simulator,...(current.chapter5?.simulator||{}),metrics:{...defaultQuickquillStory().chapter5.simulator.metrics,...(current.chapter5?.simulator?.metrics||{})}},media:{...defaultQuickquillStory().chapter5.media,...(current.chapter5?.media||{}),scores:{...defaultQuickquillStory().chapter5.media.scores,...(current.chapter5?.media?.scores||{})}},sofia:{...defaultQuickquillStory().chapter5.sofia,...(current.chapter5?.sofia||{})},freeTime:{...defaultQuickquillStory().chapter5.freeTime,...(current.chapter5?.freeTime||{})}};
      current.history=[...(current.history||[]),{scene:'q32',event:'seat-at-table-start'}].slice(-100);
      await persistStory(current,{stageOverride:'quickquill-seat-story'});
    } else state.story=current;
    state.mode='story'; state.storyError=''; state.status='A Seat at the Table';
    playTone(420); render(); syncMusic({restart:true});
  }

  async function startCrownWeek() {
    if (state.storySaving || state.transitionLocked || !state.activeSave) return;
    const current = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (!current.completed?.seat) return;
    if (current.completed?.crownWeek) {
      state.story = current;
      state.mode = 'story';
      renderCrownWeekComplete();
      syncMusic({ restart:true });
      return;
    }
    const already = QUICKQUILL_CROWN_WEEK_SCENES.some(scene => scene.id === current.scene);
    current.chapter6 = {
      ...defaultQuickquillStory().chapter6,
      ...(current.chapter6 || {}),
      crownWeek:{
        ...defaultQuickquillStory().chapter6.crownWeek,
        ...(current.chapter6?.crownWeek || {}),
        village:{...defaultQuickquillStory().chapter6.crownWeek.village,...(current.chapter6?.crownWeek?.village || {})},
        challenge:{...defaultQuickquillStory().chapter6.crownWeek.challenge,...(current.chapter6?.crownWeek?.challenge || {}),playerPoints:{...defaultQuickquillStory().chapter6.crownWeek.challenge.playerPoints,...(current.chapter6?.crownWeek?.challenge?.playerPoints || {})}},
        reception:{...defaultQuickquillStory().chapter6.crownWeek.reception,...(current.chapter6?.crownWeek?.reception || {})}
      }
    };
    if (!already) {
      current.chapter = 'lumerre-crown-week';
      current.scene = 'q40';
      current.beat = 0;
      current.chapter6.crownWeek.started = true;
      current.chapter6.crownWeek.fameAtArrival = syncCareerEvolution(current).reputation?.fame || 0;
      current.history = [...(current.history || []), { scene:'q40', event:'crown-week-start', fame:current.chapter6.crownWeek.fameAtArrival }].slice(-100);
      await persistStory(current, { stageOverride:'quickquill-crown-week' });
    } else {
      state.story = current;
    }
    state.story = current;
    state.crownEncounterId = '';
    state.crownReceptionId = '';
    state.crownWeekView = '';
    state.crownTransient = '';
    state.crownChallengeLive = null;
    clearCrownChallengeTimers();
    state.mode = 'story';
    state.storyError = '';
    state.status = 'The Lumerre Crown — Crown Week';
    playTone(440);
    render();
    syncMusic({ restart:true });
  }

  async function startLumerrePracticeQualifying() {
    if (state.storySaving || state.transitionLocked || !state.activeSave) return;
    const current = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (!current.completed?.crownWeek) return;
    if (current.completed?.practiceQualifying) {
      state.story=current;state.mode='story';renderPracticeQualifyingComplete();syncMusic({restart:true});return;
    }
    const already=QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(scene=>scene.id===current.scene);
    current.chapter6={...defaultQuickquillStory().chapter6,...(current.chapter6||{}),practiceQualifying:{...defaultQuickquillStory().chapter6.practiceQualifying,...(current.chapter6?.practiceQualifying||{}),practice:{...defaultQuickquillStory().chapter6.practiceQualifying.practice,...(current.chapter6?.practiceQualifying?.practice||{}),setup:{...defaultQuickquillStory().chapter6.practiceQualifying.practice.setup,...(current.chapter6?.practiceQualifying?.practice?.setup||{})},diagnosis:{...defaultQuickquillStory().chapter6.practiceQualifying.practice.diagnosis,...(current.chapter6?.practiceQualifying?.practice?.diagnosis||{})}},qualifying:{...defaultQuickquillStory().chapter6.practiceQualifying.qualifying,...(current.chapter6?.practiceQualifying?.qualifying||{})}}};
    if(!already){
      current.chapter='lumerre-practice';current.scene='q46';current.beat=0;current.chapter6.practiceQualifying.started=true;
      current.history=[...(current.history||[]),{scene:'q46',event:'lumerre-practice-start'}].slice(-100);
      await persistStory(current,{stageOverride:'quickquill-lumerre-practice-qualifying'});
    } else state.story=current;
    clearLumerreQualifyingTimers();state.story=current;state.lumerrePracticeView='';state.lumerrePracticeTransient='';state.lumerreQualifyingLive=null;state.mode='story';state.storyError='';state.status='The Lumerre Crown — Practice & Qualifying';playTone(440);render();syncMusic({restart:true});
  }

  async function launchCantoStoryRace() {
    if (state.storySaving || state.transitionLocked || !state.activeSave || state.story?.completed?.canto) return;
    const scene = activeStoryScene();
    const beat = scene.beats[state.story?.beat || 0];
    if (scene.id !== 'q6' || beat?.type !== 'race-launch') return;
    const changed = cloneValue(state.story);
    const strategy = currentCantoStrategy(changed);
    const runId = changed.race?.runId || `canto-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    changed.race = { ...(changed.race || {}), status: 'in-progress', strategy, runId, result: null, startedAt: new Date().toISOString() };
    changed.history = [...(changed.history || []), { scene: 'q6', event: 'canto-race-start', strategy, runId }].slice(-60);
    try {
      await persistStory(changed, { stageOverride: 'quickquill-canto-race' });
      state.story = changed;
      state.storyError = '';
      try { music.story?.pause?.(); } catch (_) {}
      sendParent('dragonbound-career-story-race-start', {
        careerSaveId: state.activeSave.id,
        runId,
        raceKey:'canto',
        trackId:'canto_meadow_circuit',
        accountKey: accountKey(username()),
        playerKey: accountKey(username()),
        playerName: storyDragonName(),
        strategy,
        careerEvolution: careerEvolutionRaceConfig(changed, 1)
      });
    } catch (error) {
      console.error('[Dragonbound Career Mode] Canto race launch save failed', error);
      state.storySaving = false;
      state.storyError = error?.message || 'The race could not be prepared. Your story progress is safe.';
      render();
    }
  }


  async function launchBlackglassStoryRace() {
    if (state.storySaving || state.transitionLocked || !state.activeSave || state.story?.completed?.blackglass) return;
    const scene = activeStoryScene();
    const beat = scene.beats[state.story?.beat || 0];
    if (scene.id !== 'q29' || beat?.type !== 'race-launch') return;
    const changed = cloneValue(state.story);
    const strategy = currentBlackglassStrategy(changed);
    const startPosition = Math.max(1, Math.min(6, Number(changed.chapter4?.qualifying?.position) || 3));
    const runId = changed.blackglassRace?.runId || `blackglass-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    changed.blackglassRace = { ...(changed.blackglassRace || {}), status:'in-progress', strategy, runId, result:null, startedAt:new Date().toISOString() };
    changed.chapter4 = { ...defaultQuickquillStory().chapter4, ...(changed.chapter4 || {}), strategy };
    changed.history = [...(changed.history || []), { scene:'q29', event:'blackglass-race-start', strategy, runId, startPosition }].slice(-100);
    try {
      await persistStory(changed, { stageOverride:'quickquill-blackglass-race' });
      state.story = changed;
      state.storyError = '';
      try { music.story?.pause?.(); } catch (_) {}
      sendParent('dragonbound-career-story-race-start', {
        careerSaveId: state.activeSave.id,
        runId,
        raceKey:'blackglass',
        trackId:'blackglass_night_circuit',
        accountKey:accountKey(username()),
        playerKey:accountKey(username()),
        playerName:storyDragonName(),
        strategy,
        startPosition,
        qualifyingGrid: Array.isArray(changed.chapter4?.qualifying?.grid) ? changed.chapter4.qualifying.grid : [],
        studiedSections: [...new Set([...(Array.isArray(changed.chapter4?.studiedSections) ? changed.chapter4.studiedSections : []), changed.chapter4?.afterHours?.bonusSection].filter(Boolean))],
        setupPlan: String(changed.chapter4?.setupPlan || ''),
        dragonState: String(changed.chapter4?.dragonState || 'steady'),
        morningPrep: String(changed.chapter4?.morningPrep || ''),
        finalWord: String(changed.chapter4?.finalWord || ''),
        localTip: String(changed.chapter4?.localTip || ''),
        telemetryReady: !!changed.chapter4?.telemetryReady,
        tyreseCallout: !!changed.chapter4?.tyreseCallout,
        blackglassStanding: blackglassStandingBand(changed),
        careerEvolution: careerEvolutionRaceConfig(changed, 2)
      });
    } catch (error) {
      console.error('[Dragonbound Career Mode] Blackglass race launch save failed', error);
      state.storySaving = false;
      state.storyError = error?.message || 'Blackglass could not be prepared. Your story progress is safe.';
      render();
    }
  }

  function launchActiveStoryRace() {
    if (state.story?.chapter === 'lumerre-race-day' || activeStoryScene()?.id === 'q56') return launchLumerreStoryRace();
    return activeStoryScene()?.id === 'q29' ? launchBlackglassStoryRace() : launchCantoStoryRace();
  }

  async function acceptBlackglassRaceResult(result = {}) {
    if (!state.activeSave || state.storySaving) return;
    const story = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (story.completed?.blackglass || story.blackglassRace?.status === 'complete') return;
    if (result.careerSaveId && String(result.careerSaveId) !== String(state.activeSave.id)) return;
    if (story.blackglassRace?.runId && result.runId && String(story.blackglassRace.runId) !== String(result.runId)) return;
    const rank = Math.max(1, Math.min(6, Number(result.rank) || 6));
    const changed = cloneValue(story);
    const resultEvents = Array.isArray(result.events) ? result.events.slice(-12) : [];
    changed.blackglassRace = {
      ...(changed.blackglassRace || {}), status:'complete', strategy:currentBlackglassStrategy(changed), completedAt:new Date().toISOString(),
      result:{
        rank,
        finishMs:Math.max(0,Number(result.finishMs)||0),
        bestLapMs:Math.max(0,Number(result.bestLapMs)||0),
        startPosition:Math.max(1,Math.min(6,Number(result.startPosition)||Number(changed.chapter4?.qualifying?.position)||3)),
        positionsGained:Math.max(0,Number(result.positionsGained)||0),
        positionDelta:Number(result.positionDelta)||0,
        overtakes:Math.max(0,Number(result.playerOvertakes ?? result.totalOvertakes)||0),
        leadChanges:Math.max(0,Number(result.leadChanges)||0),
        photoFinish:!!result.photoFinish,
        notableMoment:String(result.notableMoment||''),
        fastestLap:!!result.fastestLap,
        rivalRanks:result.rivalRanks && typeof result.rivalRanks==='object' ? {...result.rivalRanks} : {},
        standings:Array.isArray(result.standings) ? result.standings.slice(0,6).map(item=>({...item})) : [],
        events:resultEvents
      }
    };
    changed.chapter4 = { ...defaultQuickquillStory().chapter4, ...(changed.chapter4 || {}), raceMemory:resultEvents };
    if (rank === 1) { changed.relationships.quickquillTrust += 6; changed.relationships.tyreseBond += 3; changed.relationships.jalenRespect += 6; }
    else if (rank <= 3) { changed.relationships.quickquillTrust += 4; changed.relationships.tyreseBond += 2; changed.relationships.jalenRespect += 4; }
    else if (rank <= 5) { changed.relationships.quickquillTrust += 2; changed.relationships.jalenRespect += 2; }
    else { changed.relationships.tyreseBond += 2; changed.relationships.dragonBond += 1; }
    changed.scene='q30'; changed.beat=0; changed.chapter='blackglass';
    changed.history=[...(changed.history||[]),{scene:'q29',event:'blackglass-race-result',rank,finishMs:changed.blackglassRace.result.finishMs,notableMoment:changed.blackglassRace.result.notableMoment}].slice(-100);
    syncCareerEvolution(changed);
    try {
      await persistStory(changed,{stageOverride:'quickquill-blackglass-story'});
      state.story=changed; state.mode='story'; state.storyError=''; state.status=`Blackglass result saved — ${ordinal(rank)}`;
      render(); syncMusic({restart:true});
    } catch(error) {
      console.error('[Dragonbound Career Mode] Blackglass result save failed',error);
      state.storySaving=false; state.storyError=error?.message||'The race finished, but the Blackglass result could not be saved. Try Continue Story again.';
      state.mode='story'; render(); syncMusic({restart:true});
    }
  }

  async function handleBlackglassRaceAbort(message='') {
    if (!state.activeSave) return;
    const changed=normaliseQuickquillStory(state.story||activeSaveState().story);
    if (changed.completed?.blackglass || changed.blackglassRace?.status==='complete') return;
    changed.blackglassRace={...(changed.blackglassRace||{}),status:'ready'};
    state.story=changed; state.mode='story'; state.storyError=message||'Race exited. Your Blackglass chapter is safe — return to the grid when ready.';
    try { await persistStory(changed,{stageOverride:'quickquill-blackglass-story'}); } catch (_) {}
    render(); syncMusic({restart:true});
  }

  async function acceptCantoRaceResult(result = {}) {
    if (!state.activeSave || state.storySaving) return;
    const story = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (story.completed?.canto || story.race?.status === 'complete') return;
    if (result.careerSaveId && String(result.careerSaveId) !== String(state.activeSave.id)) return;
    if (story.race?.runId && result.runId && String(story.race.runId) !== String(result.runId)) return;
    const rank = Math.max(1, Math.min(6, Number(result.rank) || 6));
    const changed = cloneValue(story);
    changed.race = {
      ...(changed.race || {}),
      status: 'complete',
      strategy: currentCantoStrategy(changed),
      completedAt: new Date().toISOString(),
      result: {
        rank,
        finishMs: Math.max(0, Number(result.finishMs) || 0),
        bestLapMs: Math.max(0, Number(result.bestLapMs) || 0),
        startPosition: Math.max(1, Math.min(6, Number(result.startPosition) || 3)),
        positionsGained: Math.max(0, Number(result.positionsGained) || 0),
        positionDelta: Number(result.positionDelta) || 0,
        overtakes: Math.max(0, Number(result.playerOvertakes ?? result.totalOvertakes) || 0),
        leadChanges: Math.max(0, Number(result.leadChanges) || 0),
        photoFinish: !!result.photoFinish,
        notableMoment:String(result.notableMoment||''),
        fastestLap:!!result.fastestLap,
        rivalRanks:result.rivalRanks && typeof result.rivalRanks==='object' ? {...result.rivalRanks} : {},
        standings:Array.isArray(result.standings) ? result.standings.slice(0,6).map(item=>({...item})) : [],
        events:Array.isArray(result.events) ? result.events.slice(-12).map(item=>({...item})) : []
      }
    };
    if (rank === 1) { changed.relationships.quickquillTrust += 5; changed.relationships.tyreseBond += 3; changed.relationships.jalenRespect += 5; }
    else if (rank <= 3) { changed.relationships.quickquillTrust += 3; changed.relationships.tyreseBond += 2; changed.relationships.jalenRespect += 3; }
    else if (rank <= 5) { changed.relationships.quickquillTrust += 1; changed.relationships.jalenRespect += 1; }
    else { changed.relationships.tyreseBond += 1; }
    changed.scene = 'q7';
    changed.beat = 0;
    changed.chapter = 'race-one';
    changed.history = [...(changed.history || []), { scene: 'q6', event: 'canto-race-result', rank, finishMs: changed.race.result.finishMs }].slice(-60);
    syncCareerEvolution(changed);
    try {
      await persistStory(changed, { stageOverride: 'quickquill-canto-story' });
      state.story = changed;
      state.mode = 'story';
      state.storyError = '';
      state.status = `Canto result saved — ${rank}${rank===1?'st':rank===2?'nd':rank===3?'rd':'th'} place`;
      render();
      syncMusic({ restart: true });
    } catch (error) {
      console.error('[Dragonbound Career Mode] Canto result save failed', error);
      state.storySaving = false;
      state.storyError = error?.message || 'The race finished, but the Career result could not be saved. Try Continue Story again.';
      state.mode = 'story';
      render();
      syncMusic({ restart: true });
    }
  }

  async function handleCantoRaceAbort(message = '') {
    if (!state.activeSave) return;
    const changed = normaliseQuickquillStory(state.story || activeSaveState().story);
    if (changed.completed?.canto || changed.race?.status === 'complete') return;
    changed.race = { ...(changed.race || {}), status: 'ready' };
    state.story = changed;
    state.mode = 'story';
    state.storyError = message || 'Race exited. Your chapter progress is safe — start Canto again when ready.';
    try { await persistStory(changed, { stageOverride: 'quickquill-canto-story' }); } catch (_) {}
    render();
    syncMusic({ restart: true });
  }

  async function openStory() {
    if (state.busy || state.storySaving || !state.activeSave) return;
    if (state.activeSave.team_id !== 'quickquill') {
      state.status = `${state.activeSave.sponsor}'s unique story chapter is being prepared. Quickquill is the first playable team story.`;
      const toast = root.querySelector('.hub-status-toast');
      if (toast) {
        toast.textContent = state.status;
        toast.classList.add('is-visible');
        window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
      }
      return;
    }
    const stored = activeSaveState().story;
    state.story = normaliseQuickquillStory(stored);
    state.storyError = '';
    state.status = 'Quickquill: Against the Odds';
    if (!stored || stored.id !== state.story.id || Number(stored.version) !== state.story.version) {
      try {
        await persistStory(state.story);
      } catch (error) {
        console.error('[Dragonbound Career Mode] Story setup failed', error);
        state.storySaving = false;
        state.storyError = error?.message || 'The story could not be prepared. Check your connection and try again.';
        state.status = state.storyError;
        render();
        return;
      }
    }
    const cantoInProgress = state.story.completed?.prologue && !state.story.completed?.canto && QUICKQUILL_CANTO_SCENES.some(scene => scene.id === state.story.scene);
    const downtimeInProgress = state.story.completed?.canto && !state.story.completed?.downtime && QUICKQUILL_DOWNTIME_SCENES.some(scene => scene.id === state.story.scene);
    const blackglassInProgress = state.story.completed?.downtime && !state.story.completed?.blackglass && QUICKQUILL_BLACKGLASS_SCENES.some(scene => scene.id === state.story.scene);
    const seatInProgress = state.story.completed?.blackglass && !state.story.completed?.seat && QUICKQUILL_SEAT_SCENES.some(scene => scene.id === state.story.scene);
    const crownWeekInProgress = state.story.completed?.seat && !state.story.completed?.crownWeek && QUICKQUILL_CROWN_WEEK_SCENES.some(scene => scene.id === state.story.scene);
    const practiceInProgress = state.story.completed?.crownWeek && !state.story.completed?.practiceQualifying && QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(scene => scene.id === state.story.scene);
    const raceDayInProgress = state.story.completed?.practiceQualifying && state.story.chapter === 'lumerre-race-day' && !state.story.completed?.raceWeekend;
    const afterFlagInProgress = state.story.completed?.raceWeekend && !state.story.completed?.afterFlag && (state.story.chapter === 'lumerre-after-flag' || !!state.story.chapter6?.afterFlag?.started);
    const verdictInProgress = state.story.completed?.afterFlag && !state.story.completed?.verdict && (state.story.chapter === 'verdict' || !!state.story.chapter7?.started);
    const seasonInProgress = state.story.completed?.verdict && !state.story.completed?.seasonOpening && (state.story.chapter === 'season-one' || !!state.story.chapter8?.started);
    await fadeTo(cantoInProgress || downtimeInProgress || blackglassInProgress || seatInProgress || crownWeekInProgress || practiceInProgress || raceDayInProgress || afterFlagInProgress || verdictInProgress || seasonInProgress ? 'story' : state.story.completed?.prologue ? 'story-journey' : 'story', { duration: 980 });
  }

  async function advanceStory() {
    if (state.mode !== 'story' || state.storySaving || state.transitionLocked || (state.story?.completed?.practiceQualifying && !['lumerre-after-flag','verdict','season-one'].includes(state.story?.chapter))) return;
    const scene = activeStoryScene();
    const beat = scene.beats[state.story.beat];
    if (beat?.type === 'choice' || beat?.type === 'race-launch' || beat?.type === 'blackglass-qualifying' || ['blackglass-paddock-explore','blackglass-circuit-study','blackglass-evening-planner','blackglass-room-night','blackglass-after-hours','blackglass-morning-prep','seat-strategy-sim','seat-media-scrum','seat-free-time','crown-village','crown-challenge','crown-reception','lumerre-practice-run','lumerre-setup-board','lumerre-diagnosis','lumerre-qualifying-run','lumerre-qualifying-window'].includes(beat?.type)) return;
    // One physical double-click can produce two click events. The first used to
    // finish/advance the current beat and the second could immediately hit the
    // freshly-rendered next beat. Keep the lock outside the DOM so it survives
    // renders and prevents accidental cutscene skipping.
    if (!claimStoryInput()) return;
    if (finishStoryReveal()) {
      playTone(190);
      return;
    }
    playTone(252 + (state.story.beat % 4) * 16);
    const next = nextStoryPointer(state.story);
    const nextScene = activeStoryScene(next.story);
    const nextBeat = nextScene.beats[next.story.beat];
    const interactiveNext = ['corridor-explore','room-customise','evening-planner','duty-select','duty-game','downtime-free-roam','night-routine','morning-corridor','blackglass-qualifying','blackglass-paddock-explore','blackglass-circuit-study','blackglass-evening-planner','blackglass-room-night','blackglass-after-hours','blackglass-morning-prep','seat-strategy-sim','seat-media-scrum','seat-free-time','crown-village','crown-challenge','crown-reception','lumerre-practice-run','lumerre-setup-board','lumerre-diagnosis','lumerre-qualifying-run','lumerre-qualifying-window'].includes(nextBeat?.type);
    const mustSave = next.changedScene || next.completed || nextBeat?.type === 'choice' || nextBeat?.type === 'race-launch' || interactiveNext;
    if (next.completed && QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(item=>item.id===scene.id)) {
      state.transitionLocked = true;
      state.blackout = true;
      root.querySelector('.blackout')?.classList.add('is-visible');
      await delay(780);
      await persistStory(next.story, { stageOverride:'quickquill-lumerre-practice-qualifying-complete' });
      state.story = normaliseQuickquillStory(next.story);
      state.mode = 'story';
      state.lumerrePracticeView = '';
      state.lumerrePracticeTransient = '';
      state.lumerreQualifyingLive = null;
      state.blackout = false;
      state.transitionLocked = false;
      state.status = 'Practice & Qualifying complete — Race Day is next';
      render();
      syncMusic({restart:true});
      return;
    }
    if (next.completed && QUICKQUILL_CROWN_WEEK_SCENES.some(item=>item.id===scene.id)) {
      state.transitionLocked = true;
      state.blackout = true;
      root.querySelector('.blackout')?.classList.add('is-visible');
      await delay(780);
      await persistStory(next.story, { stageOverride:'quickquill-crown-week-complete' });
      state.story = normaliseQuickquillStory(next.story);
      state.mode = 'story';
      state.crownEncounterId = '';
      state.crownReceptionId = '';
      state.crownWeekView = '';
      state.crownTransient = '';
      clearCrownChallengeTimers();
      state.blackout = false;
      state.transitionLocked = false;
      state.status = 'Crown Week complete — Practice Day is next';
      render();
      syncMusic({restart:true});
      return;
    }
    if (next.completed && QUICKQUILL_SEAT_SCENES.some(item=>item.id===scene.id)) {
      state.transitionLocked = true;
      state.blackout = true;
      root.querySelector('.blackout')?.classList.add('is-visible');
      await delay(780);
      await persistStory(next.story, { stageOverride:'quickquill-story' });
      state.story = normaliseQuickquillStory(next.story);
      state.mode = 'story';
      state.blackout = false;
      state.transitionLocked = false;
      state.status = 'A Seat at the Table complete — Lumerre is next';
      render();
      syncMusic({restart:true});
      return;
    }
    if (mustSave) {
      await saveStoryProgress(next.story, { transition: next.changedScene });
      return;
    }
    state.story = next.story;
    state.storyError = '';
    render();
  }

  async function chooseStoryOption(optionIndex) {
    if (state.mode !== 'story' || state.storySaving || state.transitionLocked || (state.story?.completed?.practiceQualifying && !['lumerre-after-flag','verdict'].includes(state.story?.chapter))) return;
    if (!claimStoryInput()) return;
    const scene = activeStoryScene();
    const beat = scene.beats[state.story.beat];
    const option = beat?.type === 'choice' ? beat.options[optionIndex] : null;
    if (!option) return;
    const changed = cloneValue(state.story);

    // V34.18 rebuilt several Blackglass beats while preserving account saves.
    // If an older save already contains this choice id, the old guard used to
    // make every visible option look clickable but silently refuse the click.
    // Re-selection is now safe: remove the previously-applied effects first,
    // then apply the newly selected option and continue normally.
    const existingChoice = changed.choices?.[beat.id];
    if (existingChoice) {
      const previousIndex = Number(existingChoice.option);
      const previousOption = Number.isInteger(previousIndex) ? beat.options?.[previousIndex] : null;
      if (previousOption?.effects) {
        const inverseEffects = { identity: {}, relationships: {} };
        Object.entries(previousOption.effects.identity || {}).forEach(([key, value]) => inverseEffects.identity[key] = -Number(value || 0));
        Object.entries(previousOption.effects.relationships || {}).forEach(([key, value]) => inverseEffects.relationships[key] = -Number(value || 0));
        applyStoryEffects(changed, inverseEffects);
      }
    }
    applyStoryEffects(changed, option.effects);
    applyCareerEvolutionEffects(changed, option.careerEffects || {});
    changed.choices[beat.id] = { option: optionIndex, label: option.label, value: option.value || '' };
    if (beat.id === 'cantoStrategy') changed.race = { ...(changed.race || {}), strategy: option.strategy || (optionIndex === 1 ? 'fire' : optionIndex === 2 ? 'heart' : 'focus'), status: 'ready' };
    if (beat.id === 'cantoAttitude') changed.chapter3.cantoAttitude = option.value || ['confident','analytical','grounded','hungry'][optionIndex] || 'grounded';
    if (beat.id === 'blackglassInitialAttitude') changed.chapter3.blackglassInitialAttitude = option.value || ['eager','wary','curious','measured'][optionIndex] || 'measured';
    if (beat.id === 'blackglassStrategy') {
      const strategy = option.strategy || (optionIndex === 1 ? 'fire' : optionIndex === 2 ? 'heart' : 'focus');
      changed.chapter4.strategy = strategy;
      changed.blackglassRace = { ...(changed.blackglassRace || {}), strategy, status:'ready' };
    }
    if (beat.id === 'blackglassBriefingTone') changed.chapter4.briefingTone = option.value || 'learn';
    if (beat.id === 'blackglassTeamQuestion') changed.chapter4.teamQuestion = option.value || 'history';
    if (beat.id === 'blackglassPressureResponse') changed.chapter4.pressureResponse = option.value || 'truth';
    if (beat.id === 'northRoadChoice') changed.chapter4.northRoadChoice = option.value || 'quiet';
    if (beat.id === 'lumerrePracticePriority') {
      changed.chapter6 = { ...defaultQuickquillStory().chapter6, ...(changed.chapter6 || {}), practiceQualifying:{...defaultQuickquillStory().chapter6.practiceQualifying,...(changed.chapter6?.practiceQualifying||{}),started:true,priority:option.value||'technical',practice:{...defaultQuickquillStory().chapter6.practiceQualifying.practice,...(changed.chapter6?.practiceQualifying?.practice||{}),setup:{...defaultQuickquillStory().chapter6.practiceQualifying.practice.setup,...(changed.chapter6?.practiceQualifying?.practice?.setup||{})},diagnosis:{...defaultQuickquillStory().chapter6.practiceQualifying.practice.diagnosis,...(changed.chapter6?.practiceQualifying?.practice?.diagnosis||{})}},qualifying:{...defaultQuickquillStory().chapter6.practiceQualifying.qualifying,...(changed.chapter6?.practiceQualifying?.qualifying||{})}} };
    }
    if (beat.id === 'stewardResponse') {
      changed.chapter4.stewardResponse = option.value || 'name';
      changed.chapter4.reputation += [1,1,0,2][optionIndex] || 0;
    }
    if (beat.id === 'rookFirstImpression') {
      changed.chapter4.rookResponse = option.value || 'listen';
      changed.chapter4.reputation += optionIndex === 0 || optionIndex === 3 ? 1 : 0;
    }
    if (beat.id === 'jalenBlackglassResponse') changed.chapter4.jalenResponse = option.value || 'watch';
    if (beat.id === 'blackglassSetupPlan') {
      const setup = option.value || ['stable','attack','forgiving'][optionIndex] || 'stable';
      const strategy = setup === 'attack' ? 'fire' : setup === 'forgiving' ? 'heart' : 'focus';
      changed.chapter4.setupPlan = setup;
      changed.chapter4.strategy = strategy;
      changed.blackglassRace = { ...(changed.blackglassRace || {}), strategy, status:'ready' };
    }
    if (beat.id === 'blackglassFinalWord') changed.chapter4.finalWord = option.value || 'anchors';
    if (beat.id === 'blackglassAftermath') changed.chapter4.aftermath = option.value || 'learn';
    if (beat.id === 'blackglassKeepsake') changed.chapter4.keepsake = option.value || 'card';
    if (beat.id === 'seatReviewReason') changed.chapter5.reviewReason = option.value || 'protect';
    if (beat.id === 'seatDevelopmentPriority') changed.chapter5.developmentPriority = option.value || 'control';
    if (beat.id === 'seatSofiaTell') changed.chapter5.sofia = { ...changed.chapter5.sofia, discovered:true, told:option.value || 'private' };
    if (beat.id === 'seatSofiaReply') changed.chapter5.sofia = { ...changed.chapter5.sofia, discovered:true, reply:option.value || 'none' };
    if (beat.id === 'seatLumerrePromise') changed.chapter5.finalPromise = option.value || 'present';
    if (beat.id === 'crownArrivalResponse') {
      changed.chapter6 = { ...defaultQuickquillStory().chapter6, ...(changed.chapter6 || {}), crownWeek:{...defaultQuickquillStory().chapter6.crownWeek,...(changed.chapter6?.crownWeek || {}),started:true,arrivalStyle:option.value || 'team'} };
      if (['fans','media','rivals'].includes(option.value)) playCrownSfx('camera');
    }
    if (beat.id === 'crownParadeStyle') {
      changed.chapter6 = { ...defaultQuickquillStory().chapter6, ...(changed.chapter6 || {}), crownWeek:{...defaultQuickquillStory().chapter6.crownWeek,...(changed.chapter6?.crownWeek || {}),started:true,paradeStyle:option.value || 'measured'} };
      if (['crowd','rival-fans'].includes(option.value)) playCrownSfx('camera');
    }
    changed.history.push({ scene: scene.id, choice: beat.id, option: optionIndex });
    const next = nextStoryPointer(changed);
    playTone(430 + optionIndex * 55);

    // Advance the visible beat immediately so a choice never feels dead while
    // waiting on the account save. saveStoryProgress still confirms the cloud
    // save and reports/recovers normally if the request fails.
    if (!next.changedScene) {
      state.story = next.story;
      state.storyError = '';
      render();
    }
    await saveStoryProgress(next.story, { transition: next.changedScene });
  }

  function returnToHubFromStory() {
    if (state.storySaving || state.transitionLocked) return;
    if (testerReplayActive()) {
      restoreTesterReplaySnapshot({ destination:'career-hub' });
      return;
    }
    stopAfterHoursGameplay(true);
    clearCrownChallengeTimers();
    clearLumerreQualifyingTimers();
    state.crownEncounterId = '';
    state.crownReceptionId = '';
    state.crownWeekView = '';
    state.crownTransient = '';
    state.crownChallengeLive = null;
    state.lumerrePracticeView = '';
    state.lumerrePracticeTransient = '';
    state.lumerreQualifyingLive = null;
    state.mode = 'career-hub';
    window.clearTimeout(storyRevealTimer);
    storyRevealTimer = 0;
    state.storyError = '';
    state.status = state.story?.completed?.practiceQualifying
      ? 'Practice & Qualifying complete — Race Day is next'
      : QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(scene => scene.id === state.story?.scene)
        ? 'Practice & Qualifying progress saved'
      : state.story?.completed?.crownWeek
        ? 'Crown Week complete — Practice Day is ready'
      : QUICKQUILL_CROWN_WEEK_SCENES.some(scene => scene.id === state.story?.scene)
        ? 'Crown Week progress saved'
      : state.story?.completed?.seat
      ? 'A Seat at the Table complete — Crown Week is ready'
      : QUICKQUILL_SEAT_SCENES.some(scene => scene.id === state.story?.scene)
        ? 'A Seat at the Table progress saved'
      : state.story?.completed?.blackglass
      ? 'Blackglass complete — A Seat at the Table is ready'
      : QUICKQUILL_BLACKGLASS_SCENES.some(scene => scene.id === state.story?.scene)
        ? 'Blackglass chapter progress saved'
        : state.story?.completed?.downtime
          ? 'A Place at Quickquill complete — Blackglass briefing is next'
          : QUICKQUILL_DOWNTIME_SCENES.some(scene => scene.id === state.story?.scene)
        ? 'Settling-in progress saved'
        : state.story?.completed?.canto
          ? 'Race One complete — go home to Quickquill before Blackglass'
          : state.story?.completed?.prologue
            ? QUICKQUILL_CANTO_SCENES.some(scene => scene.id === state.story?.scene) ? 'Canto chapter progress saved' : 'The Impossible Contract complete — Race One at Canto Plains is next'
            : 'Quickquill story progress saved';
    playTone(190);
    render();
    const toast = root.querySelector('.hub-status-toast');
    if (toast) {
      toast.textContent = state.status;
      toast.classList.add('is-visible');
      window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
    }
  }

  async function resetQuickquillStory() {
    if (!isCatAsthmaTester() || state.storySaving || !state.activeSave) return;
    state.storyError = '';
    state.storySaving = true;
    render();
    try {
      await persistStory(defaultQuickquillStory(), { stageOverride: 'career-hub' });
      state.resetStoryConfirmOpen = false;
      state.storyError = '';
      state.status = 'Quickquill story reset — Follow the Story will begin from the opening fade';
      playTone(470);
      render();
      const toast = root.querySelector('.hub-status-toast');
      if (toast) {
        toast.textContent = state.status;
        toast.classList.add('is-visible');
        window.setTimeout(() => toast.classList.remove('is-visible'), 3400);
      }
    } catch (error) {
      console.error('[Dragonbound Career Mode] Story reset failed', error);
      state.storySaving = false;
      state.storyError = error?.message || 'The story could not be reset. Check your connection and try again.';
      render();
    }
  }

  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.data?.bridge !== BRIDGE_TOKEN) return;
    if (event.data?.type === 'dragonbound-career-evolution-config-request') {
      if (!state.story || !state.activeSave) return;
      sendParent('dragonbound-career-evolution-config', {
        requestId:String(event.data.requestId || ''),
        careerSaveId:state.activeSave.id,
        config:careerEvolutionRaceConfig(state.story, event.data.raceNumber)
      });
      return;
    }
    if (event.data?.type === 'dragonbound-career-evolution-battle-request') {
      if (!state.story || !state.activeSave) return;
      const mode=String(event.data.mode || 'attack');
      const battle=mode==='defend'
        ? resolveCareerDefenceBattle(state.story,String(event.data.opponentId||''),String(event.data.choice||''),event.data.context||{})
        : resolveCareerAttackBattle(state.story,String(event.data.opponentId||''),String(event.data.choice||''),event.data.context||{});
      sendParent('dragonbound-career-evolution-battle-result', {
        requestId:String(event.data.requestId || ''),
        careerSaveId:state.activeSave.id,
        battle
      });
      return;
    }
    if (event.data?.type === 'dragonbound-career-evolution-team-order') {
      if (!state.story || !state.activeSave) return;
      const changed=cloneValue(state.story);
      const order=recordCareerTeamOrder(changed,event.data.order||{});
      state.story=changed;
      void persistStory(changed,{stageOverride:String(activeSaveState().stage||'career-hub')}).catch(error=>console.error('[Dragonbound Career Mode] Team order save failed',error));
      sendParent('dragonbound-career-evolution-team-order-saved',{careerSaveId:state.activeSave.id,order});
      return;
    }
    if (event.data?.type === 'dragonbound-career-story-race-result') {
      const result = event.data.result || {};
      if (String(result.raceKey||'').startsWith('season-') || Number(result.seasonRound)>0) void acceptSeasonRaceResult(result);
      else if (result.raceKey === 'lumerre' || result.trackId === 'lumerre_crown_circuit') void acceptLumerreRaceResult(result);
      else if (result.raceKey === 'blackglass' || result.trackId === 'blackglass_night_circuit') void acceptBlackglassRaceResult(result);
      else void acceptCantoRaceResult(result);
      return;
    }
    if (event.data?.type === 'dragonbound-career-story-race-started') {
      const result = event.data.result || event.data || {};
      if ((result.raceKey === 'lumerre' || result.trackId === 'lumerre_crown_circuit') && state.story?.chapter === 'lumerre-race-day') {
        const changed=cloneValue(state.story), rw=lumerreRaceEnsureState(changed.chapter6.raceWeekend,changed); rw.phase='engine-live'; rw.engineVersion=4; state.story=changed; render();
      }
      return;
    }
    if (event.data?.type === 'dragonbound-career-story-race-aborted') {
      const result = event.data.result || {};
      if (String(result.raceKey||'').startsWith('season-') || Number(result.seasonRound)>0 || state.story?.chapter === 'season-one') void handleSeasonRaceAbort('Race exited. Your Velmora qualifying grid and Opening Week are safe — return to the grid when ready.');
      else if (result.raceKey === 'lumerre' || result.trackId === 'lumerre_crown_circuit' || state.story?.chapter === 'lumerre-race-day') void handleLumerreRaceAbort('Race exited. Your Lumerre grid is safe — start the Crown again when ready.');
      else if (result.raceKey === 'blackglass' || result.trackId === 'blackglass_night_circuit' || activeStoryScene()?.id === 'q29') void handleBlackglassRaceAbort('Race exited. Your Blackglass chapter is safe — return to the grid when ready.');
      else void handleCantoRaceAbort('Race exited. Your chapter progress is safe — start Canto again when ready.');
      return;
    }
    if (event.data?.type === 'dragonbound-career-story-race-error') {
      const result=event.data.result||{};
      if (String(result.raceKey||'').startsWith('season-') || Number(result.seasonRound)>0 || state.story?.chapter === 'season-one') void handleSeasonRaceAbort(event.data.error || 'Velmora City Circuit could not start in the site Dragon Racing engine. Your Opening Week is safe.');
      else if (result.raceKey === 'lumerre' || result.trackId === 'lumerre_crown_circuit' || state.story?.chapter === 'lumerre-race-day') void handleLumerreRaceAbort(event.data.error || 'The site Dragon Racing engine did not accept the Lumerre track. The old map simulation will not be used.');
      else if (activeStoryScene()?.id === 'q29') void handleBlackglassRaceAbort(event.data.error || 'The Blackglass race could not start. Your chapter progress is safe.');
      else void handleCantoRaceAbort(event.data.error || 'The Canto race could not start. Your chapter progress is safe.');
    }
  });

  function bindCommon() {
    root.querySelector('[data-sound]')?.addEventListener('click', () => {
      state.soundOn = !state.soundOn;
      playTone(310);
      syncMusic();
      render();
    });
  }

  function render() {
    if (state.mode === 'menu') renderMenu();
    else if (state.mode === 'opening') renderOpening();
    else if (state.mode === 'team-select') renderTeamSelect();
    else if (state.mode === 'story') renderStory();
    else if (state.mode === 'story-journey') renderStoryJourney();
    else if (state.mode === 'meet-teams') renderMeetTeams();
    else renderHub();
    ensureTesterReplayHud();
    syncMusic();
  }

  async function fadeTo(mode, { restartMusic = true, duration = 520 } = {}) {
    if (state.transitionLocked) return;
    state.transitionLocked = true;
    state.blackout = true;
    root.querySelector('.blackout')?.classList.add('is-visible');
    await delay(duration);
    state.mode = mode;
    state.blackout = true;
    render();
    const isStoryDestination = mode === 'story' || mode === 'story-journey';
    if (isStoryDestination && restartMusic) syncMusic({ restart: true });
    await delay(isStoryDestination ? 260 : 70);
    state.blackout = false;
    root.querySelector('.blackout')?.classList.remove('is-visible');
    if (!isStoryDestination) syncMusic({ restart: restartMusic });
    await delay(isStoryDestination ? 520 : 160);
    state.transitionLocked = false;
  }

  function activateMenu(id) {
    if (id === 'career') {
      if (state.savesLoading) {
        state.status = 'Your website account is still loading';
        render();
        return;
      }
      state.frameIndex = 0;
      state.selectedTeam = null;
      state.teamConfirmOpen = false;
      state.savesError = '';
      playTone(520);
      void fadeTo('opening');
      return;
    }
    if (id === 'dragon') {
      if (!state.saves.length || state.savesLoading) return;
      state.savePickerOpen = true;
      state.status = 'Choose a saved career';
      playTone(340);
      render();
      return;
    }
    state.exitOpen = true;
    playTone(170);
    render();
  }

  function closeSavePicker() {
    state.savePickerOpen = false;
    state.savesError = '';
    state.status = state.saves.length ? `${state.saves.length} career ${state.saves.length === 1 ? 'save' : 'saves'} ready` : 'Start a career to create your first save';
    playTone(190);
    render();
  }

  async function advanceOpening() {
    if (state.transitionLocked || state.mode !== 'opening') return;
    state.transitionLocked = true;
    playTone(260 + state.frameIndex * 22);
    state.blackout = true;
    root.querySelector('.blackout')?.classList.add('is-visible');
    await delay(430);
    if (state.frameIndex < OPENING_FRAMES.length - 1) {
      state.frameIndex += 1;
      state.blackout = true;
      render();
      await delay(70);
      state.blackout = false;
      root.querySelector('.blackout')?.classList.remove('is-visible');
      await delay(140);
      state.transitionLocked = false;
      return;
    }
    state.mode = 'team-select';
    state.selectedTeam = null;
    state.teamConfirmOpen = false;
    state.blackout = true;
    render();
    await delay(90);
    state.blackout = false;
    root.querySelector('.blackout')?.classList.remove('is-visible');
    state.transitionLocked = false;
  }

  async function saveNewCareer() {
    if (state.busy || state.selectedTeam === null) return;
    if (!state.user || !state.client) {
      state.savesError = 'Your website account is still connecting. Close Career Mode, reopen it and try again.';
      render();
      return;
    }
    const team = TEAMS[state.selectedTeam];
    state.busy = true;
    state.savesError = '';
    render();
    try {
      const saveNumber = state.saves.length + 1;
      const saveName = state.saves.length ? `${team.sponsor} Career ${saveNumber}` : `${team.sponsor} Career`;
      const payload = {
        user_id: state.user.id,
        owner_username: username(),
        save_name: saveName,
        team_id: team.id,
        sponsor: team.sponsor,
        racer: team.racer,
        state: {
          version: SAVE_VERSION,
          stage: 'career-hub',
          team: { id: team.id, sponsor: team.sponsor, racer: team.racer },
          story: team.id === 'quickquill' ? defaultQuickquillStory() : null
        }
      };
      const { data, error } = await state.client.from(SAVE_TABLE).insert(payload).select().single();
      if (error) throw error;
      if (!data?.id) throw new Error('The career save did not return a save ID.');
      state.activeSave = data;
      state.status = `${team.sponsor} contract saved to ${username()}'s account`;
      await loadSaves({ preserveStatus: true });
      state.busy = false;
      state.teamConfirmOpen = false;
      playTone(610);
      await fadeTo('career-hub');
    } catch (error) {
      console.error('[Dragonbound Career Mode] Career save failed', error);
      state.busy = false;
      if (error?.code === '23505') {
        state.savesError = 'That save record conflicted with an existing record. Try signing the contract again.';
      } else {
        state.savesError = error?.message || 'The contract could not be saved. Please try again.';
      }
      render();
    }
  }

  async function loadCareer(id) {
    if (state.busy || !state.user || !state.client) return;
    const save = state.saves.find(item => item.id === id);
    if (!save) return;
    state.busy = true;
    state.savesError = '';
    render();
    try {
      const timestamp = new Date().toISOString();
      const { data, error } = await state.client
        .from(SAVE_TABLE)
        .update({ last_played_at: timestamp, updated_at: timestamp })
        .eq('id', save.id)
        .eq('user_id', state.user.id)
        .select()
        .single();
      if (error) throw error;
      state.activeSave = data || save;
      state.busy = false;
      state.savePickerOpen = false;
      state.status = `${save.sponsor} career loaded`;
      await loadSaves({ preserveStatus: true });
      playTone(540);
      await fadeTo('career-hub');
    } catch (error) {
      console.error('[Dragonbound Career Mode] Career load failed', error);
      state.busy = false;
      state.savesError = error?.message || 'That career could not be loaded.';
      render();
    }
  }

  function handleKey(event) {
    if (state.afterHoursGame?.active) return;
    if (state.transitionLocked || state.busy) return;
    if (state.mode === 'opening') {
      if (['Enter', ' ', 'ArrowRight'].includes(event.key)) { event.preventDefault(); void advanceOpening(); }
      if (event.key === 'Escape') { event.preventDefault(); state.mode = 'menu'; state.status = 'Choose your path'; render(); }
      return;
    }
    if (state.mode === 'team-select') {
      if (state.teamConfirmOpen) {
        if (event.key === 'Escape') { event.preventDefault(); state.teamConfirmOpen = false; state.savesError = ''; render(); }
        if (event.key === 'Enter') { event.preventDefault(); void saveNewCareer(); }
        return;
      }
      if (['ArrowRight', 'd', 'D'].includes(event.key)) { event.preventDefault(); state.selectedTeam = state.selectedTeam === null ? 0 : (state.selectedTeam + 1) % TEAMS.length; playTone(260); render(); }
      if (['ArrowLeft', 'a', 'A'].includes(event.key)) { event.preventDefault(); state.selectedTeam = state.selectedTeam === null ? TEAMS.length - 1 : (state.selectedTeam - 1 + TEAMS.length) % TEAMS.length; playTone(230); render(); }
      if (event.key === 'Enter' && state.selectedTeam !== null) { event.preventDefault(); state.teamConfirmOpen = true; render(); }
      if (event.key === 'Escape') { event.preventDefault(); state.mode = 'menu'; state.status = 'Choose your path'; render(); }
      return;
    }
    if (state.mode === 'story-journey') {
      if (event.key === 'Escape') { event.preventDefault(); returnToHubFromStory(); }
      return;
    }
    if (state.mode === 'meet-teams') {
      if (event.key === 'Escape') { event.preventDefault(); closeMeetTeams(); }
      return;
    }
    if (state.mode === 'story') {
      if (event.key === 'Escape') {
        event.preventDefault();
        returnToHubFromStory();
        return;
      }
      // Ignore OS key-repeat while a key is held. Otherwise holding Space/Enter
      // can advance several dialogue beats even though the player pressed once.
      if (event.repeat) return;
      const scene = activeStoryScene();
      const chapterTwoScene = QUICKQUILL_CANTO_SCENES.some(item => item.id === state.story?.scene);
      const chapterThreeScene = QUICKQUILL_DOWNTIME_SCENES.some(item => item.id === state.story?.scene);
      const chapterFourScene = QUICKQUILL_BLACKGLASS_SCENES.some(item => item.id === state.story?.scene);
      const chapterFiveScene = QUICKQUILL_SEAT_SCENES.some(item => item.id === state.story?.scene);
      const chapterSixScene = QUICKQUILL_CROWN_WEEK_SCENES.some(item => item.id === state.story?.scene);
      const lumerrePracticeScene = QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(item => item.id === state.story?.scene);
      const lumerreAfterFlagScene = QUICKQUILL_LUMERRE_AFTER_FLAG_SCENES.some(item => item.id === state.story?.scene);
      const chapterSevenScene = QUICKQUILL_VERDICT_SCENES.some(item => item.id === state.story?.scene);
      const chapterEightScene = QUICKQUILL_SEASON_SCENES.some(item => item.id === state.story?.scene);
      const resultScreen = !lumerreAfterFlagScene && !chapterSevenScene && !chapterEightScene && (state.story?.completed?.practiceQualifying || (state.story?.completed?.crownWeek && !lumerrePracticeScene) || (state.story?.completed?.seat && !chapterSixScene && !lumerrePracticeScene) || (state.story?.completed?.blackglass && !chapterFiveScene && !chapterSixScene && !lumerrePracticeScene) || (state.story?.completed?.downtime && !chapterFourScene && !chapterFiveScene && !chapterSixScene && !lumerrePracticeScene) || (state.story?.completed?.canto && !chapterThreeScene && !chapterFourScene && !chapterFiveScene && !chapterSixScene && !lumerrePracticeScene && !state.story?.completed?.downtime) || (state.story?.completed?.prologue && !chapterTwoScene && !chapterThreeScene && !chapterFourScene && !chapterFiveScene && !chapterSixScene && !lumerrePracticeScene && !state.story?.completed?.canto));
      const beat = resultScreen ? null : scene.beats[state.story?.beat || 0];
      if (beat?.type === 'choice' && /^[1-4]$/.test(event.key)) {
        const choice = Number(event.key) - 1;
        if (choice < beat.options.length) {
          event.preventDefault();
          void chooseStoryOption(choice);
        }
        return;
      }
      if (beat?.type === 'race-launch' && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        void launchActiveStoryRace();
        return;
      }
      if (!beat && resultScreen && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        returnToHubFromStory();
        return;
      }
      if (beat?.type !== 'choice' && beat?.type !== 'race-launch' && beat?.type !== 'blackglass-qualifying' && !['blackglass-paddock-explore','blackglass-circuit-study','blackglass-evening-planner','blackglass-room-night','blackglass-after-hours','blackglass-morning-prep','seat-strategy-sim','seat-media-scrum','seat-free-time','crown-village','crown-challenge','crown-reception','lumerre-practice-run','lumerre-setup-board','lumerre-diagnosis','lumerre-qualifying-run','lumerre-qualifying-window'].includes(beat?.type) && ['Enter', ' ', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        void advanceStory();
      }
      return;
    }
    if (state.mode === 'career-hub') {
      if (state.hubPanel) {
        if (event.key === 'Escape') { event.preventDefault(); state.hubPanel = ''; state.hubInboxId = ''; playTone(170); render(); }
        return;
      }
      if (state.resetStoryConfirmOpen) {
        if (event.key === 'Escape') { event.preventDefault(); state.resetStoryConfirmOpen = false; state.storyError = ''; render(); }
        if (event.key === 'Enter') { event.preventDefault(); void resetQuickquillStory(); }
        return;
      }
      if (event.key === 'Escape') { event.preventDefault(); state.mode = 'menu'; state.status = `${state.saves.length} career ${state.saves.length === 1 ? 'save' : 'saves'} ready`; render(); }
      return;
    }
    if (state.savePickerOpen) {
      if (event.key === 'Escape') { event.preventDefault(); closeSavePicker(); }
      return;
    }
    if (state.exitOpen) {
      if (event.key === 'Escape') { event.preventDefault(); state.exitOpen = false; render(); }
      return;
    }
    if (['ArrowDown', 's', 'S'].includes(event.key)) { event.preventDefault(); state.selectedMenu = nextEnabled(state.selectedMenu, 1); playTone(240 + state.selectedMenu * 35); render(); }
    if (['ArrowUp', 'w', 'W'].includes(event.key)) { event.preventDefault(); state.selectedMenu = nextEnabled(state.selectedMenu, -1); playTone(240 + state.selectedMenu * 35); render(); }
    if (event.key === 'Enter') { event.preventDefault(); activateMenu(menuItems()[state.selectedMenu].id); }
    if (event.key === 'Escape') { event.preventDefault(); state.exitOpen = true; render(); }
  }

  let parallaxFrame = 0;
  let parallaxPointer = null;
  root.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    parallaxPointer = { x: event.clientX, y: event.clientY };
    if (parallaxFrame) return;
    parallaxFrame = requestAnimationFrame(() => {
      parallaxFrame = 0;
      const point = parallaxPointer;
      if (!point) return;
      const x = point.x / window.innerWidth - .5;
      const y = point.y / window.innerHeight - .5;
      root.querySelector('.scene')?.style.setProperty('--look-x', `${x * -7}px`);
      root.querySelector('.scene')?.style.setProperty('--look-y', `${y * -5}px`);
      root.querySelector('.team-select-stage')?.style.setProperty('--team-x', `${x * -5}px`);
      root.querySelector('.team-select-stage')?.style.setProperty('--team-y', `${y * -4}px`);
      root.querySelector('.career-hub-stage')?.style.setProperty('--hub-x', `${x * -5}px`);
      root.querySelector('.career-hub-stage')?.style.setProperty('--hub-y', `${y * -4}px`);
      root.querySelector('.story-stage')?.style.setProperty('--story-x', `${x * -9}px`);
      root.querySelector('.story-stage')?.style.setProperty('--story-y', `${y * -6}px`);
    });
  }, { passive: true });
  window.addEventListener('keydown', handleKey);
  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    const frame = document.getElementById('meetTeamsFrame');
    if (!frame || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'dragonbound-career-meet-teams-close') closeMeetTeams();
  });
  window.addEventListener('pointerdown', () => syncMusic(), { once: true });
  window.addEventListener('keydown', () => syncMusic(), { once: true });

  const careerPreloadedImages = new Set();
  let careerPreloadHandle = 0;
  function queueCareerImagePreload(sources = []) {
    const pending = [...new Set(sources.filter(Boolean))]
      .filter(source => !careerPreloadedImages.has(source))
      .slice(0, 3);
    if (!pending.length || document.hidden) return;
    const run = () => {
      careerPreloadHandle = 0;
      pending.forEach(source => {
        if (careerPreloadedImages.has(source)) return;
        careerPreloadedImages.add(source);
        const image = new Image();
        image.decoding = 'async';
        image.src = source;
      });
    };
    // Do not wait for requestIdleCallback here. iPad Safari can postpone idle work
    // until after the user advances, which makes the next cutscene hitch while its
    // art decodes. Warm only a tiny capped set just after the current paint.
    if (careerPreloadHandle) clearTimeout(careerPreloadHandle);
    careerPreloadHandle = setTimeout(run, 90);
  }
  function queueCurrentModePreloads() {
    if (document.hidden) return;
    if (state.mode === 'opening') {
      queueCareerImagePreload([OPENING_FRAMES[state.frameIndex + 1]]);
      return;
    }
    if (state.mode === 'career-hub' && state.story) {
      queueCareerImagePreload([activeStoryScene()?.background]);
      return;
    }
    if (state.mode !== 'story' || !state.story) return;
    const scene = activeStoryScene();
    const chapterTwoScene = QUICKQUILL_CANTO_SCENES.some(item => item.id === scene.id);
    const chapterThreeScene = QUICKQUILL_DOWNTIME_SCENES.some(item => item.id === scene.id);
    const chapterFourScene = QUICKQUILL_BLACKGLASS_SCENES.some(item => item.id === scene.id);
    const chapterFiveScene = QUICKQUILL_SEAT_SCENES.some(item => item.id === scene.id);
    const chapterSixScene = QUICKQUILL_CROWN_WEEK_SCENES.some(item => item.id === scene.id);
    const lumerrePracticeScene = QUICKQUILL_LUMERRE_PRACTICE_SCENES.some(item => item.id === scene.id);
    const lumerreAfterFlagScene = QUICKQUILL_LUMERRE_AFTER_FLAG_SCENES.some(item => item.id === scene.id);
    const chapterSevenScene = QUICKQUILL_VERDICT_SCENES.some(item => item.id === scene.id);
    const sceneList = chapterSevenScene ? QUICKQUILL_VERDICT_SCENES : lumerreAfterFlagScene ? QUICKQUILL_LUMERRE_AFTER_FLAG_SCENES : lumerrePracticeScene ? QUICKQUILL_LUMERRE_PRACTICE_SCENES : chapterSixScene ? QUICKQUILL_CROWN_WEEK_SCENES : chapterFiveScene ? QUICKQUILL_SEAT_SCENES : chapterFourScene ? QUICKQUILL_BLACKGLASS_SCENES : chapterThreeScene ? QUICKQUILL_DOWNTIME_SCENES : chapterTwoScene ? QUICKQUILL_CANTO_SCENES : QUICKQUILL_SCENES;
    const sceneIndex = sceneList.findIndex(item => item.id === scene.id);
    const beatIndex = Math.min(state.story?.beat || 0, scene.beats.length - 1);
    const beat = scene.beats[beatIndex] || scene.beats[0];
    const nextBeat = scene.beats[beatIndex + 1];
    const nextScene = sceneList[sceneIndex + 1];
    const portraitPreloadSource = (portrait) => {
      const sheet = PORTRAITS[portrait?.character];
      if (!sheet) return '';
      if (sheet.folder) {
        const frame = Math.max(0, Math.min((sheet.frames || 1) - 1, Number(portrait?.frame) || 0));
        return `${sheet.folder}/frame-${String(frame).padStart(2, '0')}.png`;
      }
      return sheet.source || '';
    };
    queueCareerImagePreload([
      portraitPreloadSource(beat?.portrait),
      portraitPreloadSource(nextBeat?.portrait),
      nextScene?.background
    ]);
  }

  const originalRender = render;
  render = function performanceAwareRender() {
    originalRender();
    bindStoryPortraitFallbacks();
    queueCurrentModePreloads();
  };

  render();
  void connectAccount();
})();
