(() => {
  'use strict';

  const SUPABASE_URL = 'https://hvdrwmjieguurxvrgzfu.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_bln84LaJ8iYmnkYK9mh0Pg_XxP7O1OZ';
  const SAVE_TABLE = 'dragonbound_career_saves';
  const SAVE_VERSION = 2;
  const BRIDGE_TOKEN = new URLSearchParams(window.location.search).get('bridge') || '';
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
    sofia: { source: 'story/portraits/sofia.png', columns: 2, rows: 2 }
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

  const ALL_QUICKQUILL_SCENES = [...QUICKQUILL_SCENES, ...QUICKQUILL_CANTO_SCENES, ...QUICKQUILL_DOWNTIME_SCENES, ...QUICKQUILL_BLACKGLASS_SCENES];

  const STORY_JOURNEY = [
    { number: '01', title: 'The Impossible Contract', subtitle: 'A race nobody important was watching', image: 'story/environments/01_Young_Velmora_League_Circuit.png' },
    { number: '02', title: 'Prove You Belong', subtitle: 'Race One · Canto Plains', image: 'story/environments/05_Canto_Plains_Racing_Venue.png' },
    { number: '03', title: 'A Place at Quickquill', subtitle: 'Settling in · no race today', image: 'story/environments/11_Quickquill_Accommodation_Corridor.png' },
    { number: '04', title: 'Blackglass Under Floodlights', subtitle: 'Race Two · a full northern weekend', image: 'story/environments/20_Blackglass_Night_Circuit_Reveal.png' },
    { number: '05', title: 'A Seat at the Table', subtitle: 'Pressure, people and consequences', image: 'story/environments/04_Quickquill_Rooftop_Walkway.png' },
    { number: '06', title: 'The Lumerre Crown', subtitle: 'Race Three · Lumerre', image: 'story/environments/08_Lumerre_Crown_Racing_Circuit.png' },
    { number: '07', title: 'The Contract Decision', subtitle: 'Your choices return', image: 'story/environments/07_Lumerre_Terraces_and_Paddock.png' }
  ];

  const CAREER_DESK_PANELS = [
    { id:'journal', label:'Career Journal', short:'Journal', mark:'J' },
    { id:'records', label:'Race Records', short:'Records', mark:'R' },
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
    downtime: document.getElementById('careerDowntimeMusic')
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
    storyRevealComplete: true,
    resetStoryConfirmOpen: false,
    downtimeActivity: '',
    downtimeMessage: '',
    blackglassActivity: '',
    blackglassMessage: '',
    afterHoursGame: null,
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
      return music.story;
    }
    if (state.mode === 'story-journey') return music.story;
    if (state.mode === 'meet-teams') return null;
    return music.hub;
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
    if (!active || !state.soundOn) return;
    if (restart) active.currentTime = 0;
    active.muted = false;
    active.volume = active === music.downtime ? .23 : state.mode === 'menu' ? .5 : state.mode === 'career-hub' ? .2 : (state.mode === 'story' || state.mode === 'story-journey') ? .4 : .4;
    void active.play().catch(() => undefined);
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

  function defaultQuickquillStory() {
    return {
      id: 'quickquill-against-the-odds',
      version: 7,
      chapter: 'prologue',
      scene: 'q0',
      beat: 0,
      completed: { prologue: false, canto: false, downtime: false, blackglass: false },
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
        valecroftInterest: 0
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
      history: []
    };
  }

  function normaliseQuickquillStory(raw) {
    const fallback = defaultQuickquillStory();
    if (!raw || typeof raw !== 'object' || raw.id !== fallback.id) return fallback;
    if ((Number(raw.version) || 1) < fallback.version && !raw.completed?.prologue) return fallback;
    const rawChapter3 = raw.chapter3 && typeof raw.chapter3 === 'object' ? raw.chapter3 : {};
    const rawChapter4 = raw.chapter4 && typeof raw.chapter4 === 'object' ? raw.chapter4 : {};
    const story = {
      ...fallback,
      ...cloneValue(raw),
      version: fallback.version,
      completed: { ...fallback.completed, ...(raw.completed || {}) },
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
    return story;
  }

  function isCatAsthmaTester() {
    return accountKey(username()) === 'catasthma' && state.activeSave?.team_id === 'quickquill';
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
      .replaceAll('[GARRAN_AFTER_HOURS]', chapter4State().afterHours?.caught ? 'Also: your athlete has already completed one unscheduled event today.' : chapter4State().afterHours?.passReturned ? 'Also: thank you to whoever returned the venue pass. I am choosing not to investigate why it was found after midnight.' : '');
  }

  function storyBeatText(beat) {
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
    const timestamp = new Date().toISOString();
    const previousState = activeSaveState();
    const saveState = {
      ...previousState,
      version: SAVE_VERSION,
      stage: stageOverride || (
        QUICKQUILL_BLACKGLASS_SCENES.some(scene => scene.id === nextStory.scene) && !nextStory.completed?.blackglass
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
    const { data, error } = await state.client
      .from(SAVE_TABLE)
      .update({ state: saveState, updated_at: timestamp, last_played_at: timestamp })
      .eq('id', state.activeSave.id)
      .eq('user_id', state.user.id)
      .select('id,user_id,owner_username,save_name,team_id,sponsor,racer,state,created_at,updated_at,last_played_at')
      .single();
    state.storySaving = false;
    if (error) throw error;
    if (!data?.id) throw new Error('Career progress could not be confirmed by the account save.');
    state.story = normaliseQuickquillStory(data.state?.story);
    state.activeSave = data;
    state.saves = state.saves.map(save => save.id === data.id ? data : save);
    return data;
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
      ? 'Your Career save is ready — select your dragon to continue'
      : 'Start a career to create your first save';
    render();
  }

  function menuItems() {
    return [
      { id: 'career', label: 'Start career mode', y: '58.6%', disabled: state.savesLoading || state.saves.length > 0, disabledLabel: state.savesLoading ? 'loading your account' : 'one Career save is allowed per account' },
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
            <span>Racing with ${escapeHtml(save.racer)}</span>
            <time>${escapeHtml(dateText)}</time>
          </div>
          <button type="button" data-load-save="${escapeHtml(save.id)}" ${state.busy ? 'disabled' : ''}>${state.busy ? 'LOADING…' : 'LOAD CAREER'}</button>
        </article>`;
    }).join('');
    return `
      <div class="career-save-backdrop" role="presentation">
        <section class="career-save-panel" role="dialog" aria-modal="true" aria-labelledby="careerSaveTitle">
          <header>
            <div><small>YOUR DRAGONBOUND HISTORY</small><h2 id="careerSaveTitle">Load career</h2><p>Continue ${escapeHtml(username())}'s saved racing career.</p></div>
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
    const storyJourneyUnlocked = activeTeam?.id === 'quickquill' && activeSaveState().story?.completed?.prologue === true;
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
          ${isCatAsthmaTester() ? `<button type="button" class="story-reset-test" data-reset-story><small>CatAsthma test control</small><strong>RESET QUICKQUILL STORY</strong></button>` : ''}
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
        if (item.id === 'profile') { openCareerPanel('dragon'); return; }
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
      return `<div class="story-portrait is-${escapeHtml(portrait.side || 'right')} ${portrait.shadow ? 'is-shadowed' : ''}" aria-hidden="true"><img class="story-portrait-frame" src="${src}" alt=""></div>`;
    }
    const frame = Math.max(0, Math.min((sheet.columns * sheet.rows) - 1, Number(portrait.frame) || 0));
    const column = frame % sheet.columns;
    const row = Math.floor(frame / sheet.columns);
    const x = sheet.columns === 1 ? 0 : (column / (sheet.columns - 1)) * 100;
    const y = sheet.rows === 1 ? 0 : (row / (sheet.rows - 1)) * 100;
    return `<div class="story-portrait is-${escapeHtml(portrait.side || 'right')} ${portrait.shadow ? 'is-shadowed' : ''}" aria-hidden="true"><div class="story-portrait-sprite" style="--portrait-image:url('${sheet.source}');--portrait-size:${sheet.columns * 100}% ${sheet.rows * 100}%;--portrait-x:${x}%;--portrait-y:${y}%"></div></div>`;
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
    if (QUICKQUILL_DOWNTIME_SCENES.some(item => item.id === scene.id) || QUICKQUILL_BLACKGLASS_SCENES.some(item => item.id === scene.id)) {
      const frameByScene = { q9:10,q11:4,q15:11,q16:9,q17:1,q18:0,q19:3,q20:11,q21:2,q22:1,q23:10,q24:9,q25:3,q26:11,q27:0,q28:2,q29:1,q30:4,q31:11 };
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
    if (story.completed?.blackglass) return { eyebrow:'BETWEEN WEEKENDS', title:'A Seat at the Table', note:'Blackglass is complete. Your next chapter will begin from the Career Hub.' };
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
    return records;
  }

  function relationshipState(id, story) {
    const rel = story?.relationships || {};
    const bands = {
      tyrese: [Number(rel.tyreseBond)||0, [[35,'Formal'],[45,'Warming'],[55,'Friendly'],[65,'Trusting'],[999,'Close']]],
      mara: [Number(rel.maraBond)||0, [[20,'Formal'],[30,'Professional'],[40,'Warming'],[55,'Trusting'],[999,'Trusted']]],
      nell: [Number(rel.nellBond)||0, [[20,'Formal'],[30,'Professional'],[40,'Warming'],[55,'Trusting'],[999,'Trusted']]],
      steward: [Number(rel.stewardRespect)||0, [[1,'Formal'],[3,'Noted'],[6,'Respected'],[999,'Trusted at Blackglass']]],
      rook: [Number(rel.rookRespect)||0, [[1,'Unknown'],[3,'Competitive'],[6,'Mutual respect'],[999,'Friendly rival']]]
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
    messages.push({id:'seat',from:'Quickquill Team Office',subject:'Next: A Seat at the Table',stamp:'CAREER · NEXT CHAPTER',available:!!story.completed?.blackglass,body:'Your next Career chapter is not open yet. When it begins, the question will be different: not whether you belong in the room, but what happens once people start saving you a seat.'});
    const read = new Set((story.careerHub?.inboxRead||[]).map(String));
    return messages.filter(m=>m.available).map(m=>({...m,read:read.has(m.id)}));
  }

  function careerCalendarEvents(story) {
    if (!story) return [];
    const cantoStarted=QUICKQUILL_CANTO_SCENES.some(scene=>scene.id===story.scene)||story.completed?.canto;
    const downtimeStarted=isDowntimeScene(story)||story.completed?.downtime;
    const blackglassStarted=isBlackglassScene(story)||story.completed?.blackglass;
    const rows=[
      {id:'scout',day:'01',title:'Scouted',place:'Young Velmora League',detail:'Tyrese stays after the race.',complete:!!story.completed?.prologue,current:!story.completed?.prologue},
      {id:'canto',day:'02',title:'Canto race weekend',place:'Canto Plains',detail:'Preparation · grid · first professional start.',complete:!!story.completed?.canto,current:!!story.completed?.prologue&&!story.completed?.canto&&cantoStarted},
      {id:'hq',day:'03',title:'Quickquill downtime',place:'Quickquill HQ',detail:'Room · team duties · first evening · Blackglass invitation.',complete:!!story.completed?.downtime,current:!!story.completed?.canto&&!story.completed?.downtime&&downtimeStarted},
      {id:'blackglass',day:'04',title:'Blackglass weekend',place:'Northern Circuit',detail:'Arrival · circuit study · qualifying · After Hours · race.',complete:!!story.completed?.blackglass,current:!!story.completed?.downtime&&!story.completed?.blackglass&&blackglassStarted},
      {id:'table',day:'05',title:'A Seat at the Table',place:'Quickquill',detail:'Pressure, people and consequences.',complete:false,current:false,upcoming:!!story.completed?.blackglass}
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
    return [...new Set(traits)].slice(0,6);
  }

  function careerDragonProfile(story) {
    const dragon=careerDragon(state.activeSave), races=careerRaceRecords(story), starts=races.length, wins=races.filter(r=>Number(r.rank)===1).length, podiums=races.filter(r=>Number(r.rank)<=3).length;
    const finishes=races.map(r=>Number(r.rank)).filter(Boolean), best=finishes.length?Math.min(...finishes):0;
    const c4=story?chapter4State(story):null, strategies=story?[story.race?.result?currentCantoStrategy(story):'',story.blackglassRace?.result?currentBlackglassStrategy(story):''].filter(Boolean):[];
    const identity=story?careerIdentity(story):{primary:'Developing'};
    const bond=Number(story?.relationships?.dragonBond)||0;
    const bondLabel=bond>=65?'In sync':bond>=55?'Strong':bond>=45?'Connected':'Developing';
    return {dragon,starts,wins,podiums,best,identity:identity.primary,bond:bondLabel,traits:careerDragonTraits(story),strategies:[...new Set(strategies)],chapter:careerCurrentChapter(story),studied:c4?blackglassStudiedText(story):''};
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
    return `<div class="career-dragon-profile"><section class="career-dragon-hero"><div class="career-dragon-backdrop"></div><img loading="lazy" decoding="async" src="${avatar}" alt="${escapeHtml(dragon.name)}"><div><small>${escapeHtml(activeTeam?.sponsor||state.activeSave?.sponsor||'CAREER')} · RACER PROFILE</small><h2>${escapeHtml(dragon.name)}</h2><span>${escapeHtml(profile.chapter.title)}</span></div></section><section class="career-dragon-overview"><div class="career-dragon-statline"><span><small>STARTS</small><b>${profile.starts}</b></span><span><small>PODIUMS</small><b>${profile.podiums}</b></span><span><small>WINS</small><b>${profile.wins}</b></span><span><small>BEST</small><b>${profile.best?ordinal(profile.best):'—'}</b></span></div><div class="career-dragon-details"><article><small>CAREER IDENTITY</small><h3>${escapeHtml(profile.identity)}</h3><p>Developed from the decisions you have actually made during the Quickquill campaign.</p></article><article><small>DRAGON BOND</small><h3>${escapeHtml(profile.bond)}</h3><p>The partnership state is shown as a story relationship, not a raw hidden number.</p></article><article><small>RACE TENDENCY</small><h3>${escapeHtml(tendencies)}</h3><p>Built from the approaches carried into completed Career races.</p></article></div><div class="career-trait-list"><small>CAREER TRAITS</small>${profile.traits.length?profile.traits.map(trait=>`<span>${escapeHtml(trait)}</span>`).join(''):'<span>Developing</span>'}</div></section></div>`;
  }

  function careerDeskBodyMarkup(panelId, story) {
    if(!story && state.activeSave?.team_id!=='quickquill') return careerDeskEmpty('Campaign archive not active',`${state.activeSave?.sponsor||'This team'} does not have a story campaign in this build yet. The Career Desk is ready to populate when that campaign is added.`);
    if(panelId==='records') return careerRaceRecordsMarkup(story);
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
  const AFTER_HOURS_FRAMES = {quiet:0,creepA:1,creepB:2,sniff:3,investigate:4,eat:5,hide:6,peek:7,startled:8,guilty:9};
  const AFTER_HOURS_PATROL = [[18,39],[43,39],[70,39],[88,28],[84,48],[62,48],[48,58],[73,69],[88,66],[72,43],[34,43]];
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
      steward:{x:18,y:39,patrolIndex:1,mode:'patrol',target:null,investigateUntil:0},
      stewardComingAt:0,stewardSearchUntil:0,stewardSearchSafe:false,
      startedAt:Date.now(),outcome:'',memory:'',pendingStewardDelta:0,pendingReputationDelta:0,sceneIndex:0
    };
  }
  function ensureAfterHoursGame(sceneIndex=0){
    if(!state.afterHoursGame||state.afterHoursGame.phase==='done')state.afterHoursGame=newAfterHoursGame();
    state.afterHoursGame.active=true;state.afterHoursGame.sceneIndex=sceneIndex;return state.afterHoursGame;
  }
  function afterHoursSetMessage(text,duration=3200){const g=state.afterHoursGame;if(!g)return;g.message=String(text||'');g.messageUntil=Date.now()+duration;}

  function afterHoursWalkable(room,x,y){
    if(room==='pantry'){
      if(x<7||x>93||y<13||y>88)return false;
      if(x>29&&x<71&&y>33&&y<66)return false; // preparation table
      if(y<28&&x>9&&x<91)return false; // shelves
      return true;
    }
    // Guest wing is a connected set of broad floor zones. This prevents the
    // dragon from walking through the major wall masses without turning the
    // hand-painted environment into a brittle pixel-perfect collision map.
    const zones=[
      [6,14,94,48],[27,38,82,66],[36,47,78,88],[5,54,38,84],[67,53,95,86]
    ];
    return zones.some(([x0,y0,x1,y1])=>x>=x0&&x<=x1&&y>=y0&&y<=y1);
  }
  function afterHoursTryMove(g,nx,ny){
    if(afterHoursWalkable(g.room,nx,ny)){g.x=nx;g.y=ny;return;}
    if(afterHoursWalkable(g.room,nx,g.y))g.x=nx;
    if(afterHoursWalkable(g.room,g.x,ny))g.y=ny;
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
    if(g.room!=='wing')return;const s=g.steward,player=[g.x,g.y],dist=ahDistance([s.x,s.y],player),nowMs=Date.now();
    if(!g.hidden&&g.noise>.62&&dist<29){s.mode='investigate';s.target=[g.x,g.y];s.investigateUntil=nowMs+4300;}
    else if(s.mode==='investigate'&&nowMs>s.investigateUntil){s.mode='patrol';s.target=null;}
    let target=s.mode==='investigate'&&s.target?s.target:AFTER_HOURS_PATROL[s.patrolIndex%AFTER_HOURS_PATROL.length],speed=s.mode==='investigate'?8.2:5.1,dx=target[0]-s.x,dy=target[1]-s.y,d=Math.hypot(dx,dy);
    if(d<1.2){if(s.mode==='patrol')s.patrolIndex=(s.patrolIndex+1)%AFTER_HOURS_PATROL.length;else{s.mode='patrol';s.target=null;}}else{s.x+=dx/d*speed*dt;s.y+=dy/d*speed*dt;}
    const newDist=ahDistance([s.x,s.y],player);if(!g.hidden&&newDist<7.2){afterHoursCatch('steward');return;}
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


  function renderStory() {
    window.clearTimeout(storyRevealTimer);
    storyRevealTimer = 0;
    storyRevealText = '';
    const chapterTwoScene = QUICKQUILL_CANTO_SCENES.some(item => item.id === state.story?.scene);
    const chapterThreeScene = QUICKQUILL_DOWNTIME_SCENES.some(item => item.id === state.story?.scene);
    const chapterFourScene = QUICKQUILL_BLACKGLASS_SCENES.some(item => item.id === state.story?.scene);
    if (state.story?.completed?.blackglass) {
      renderBlackglassComplete();
      return;
    }
    if (state.story?.completed?.downtime && !chapterFourScene) {
      renderDowntimeComplete();
      return;
    }
    if (state.story?.completed?.canto && !chapterThreeScene && !chapterFourScene && !state.story?.completed?.downtime) {
      renderCantoComplete();
      return;
    }
    if (state.story?.completed?.prologue && !chapterTwoScene && !chapterThreeScene && !chapterFourScene && !state.story?.completed?.canto) {
      renderStoryComplete();
      return;
    }
    const scene = activeStoryScene();
    const beat = scene.beats[Math.min(state.story?.beat || 0, scene.beats.length - 1)] || scene.beats[0];
    const sceneList = chapterFourScene ? QUICKQUILL_BLACKGLASS_SCENES : chapterThreeScene ? QUICKQUILL_DOWNTIME_SCENES : chapterTwoScene ? QUICKQUILL_CANTO_SCENES : QUICKQUILL_SCENES;
    const sceneIndex = sceneList.findIndex(item => item.id === scene.id);
    const interactiveTypes = new Set(['corridor-explore','room-customise','evening-planner','duty-select','duty-game','downtime-free-roam','night-routine','morning-corridor']);
    const blackglassInteractiveTypes = new Set(['blackglass-paddock-explore','blackglass-circuit-study','blackglass-evening-planner','blackglass-room-night','blackglass-after-hours','blackglass-morning-prep']);
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
    const isChoice = beat.type === 'choice';
    const isCinematic = beat.type === 'cinematic';
    const isRaceLaunch = beat.type === 'race-launch';
    const fullText = !isChoice && !isCinematic && !isRaceLaunch ? storyBeatText(beat) : '';
    state.storyRevealComplete = isChoice || isCinematic || isRaceLaunch;
    const chapterLabel = chapterFourScene ? 'RACE TWO' : chapterThreeScene ? 'DOWNTIME' : chapterTwoScene ? 'RACE ONE' : 'PROLOGUE';
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
    const blackglassComplete = !!story.completed?.blackglass;
    const journeyStates = STORY_JOURNEY.map((chapter, index) => {
      let status = 'locked';
      if (index === 0) status = 'complete';
      else if (index === 1) status = cantoComplete ? 'complete' : 'next';
      else if (index === 2) status = !cantoComplete ? 'locked' : downtimeComplete ? 'complete' : 'next';
      else if (index === 3) status = !downtimeComplete ? 'locked' : blackglassComplete ? 'complete' : 'next';
      return { ...chapter, status };
    });
    const cantoAction = cantoComplete ? 'VIEW CANTO RESULT' : cantoStarted ? 'RESUME STORY CHAPTER' : 'BEGIN STORY CHAPTER';
    const downtimeAction = downtimeComplete ? 'VIEW CHAPTER RESULT' : downtimeStarted ? 'RESUME SETTLING IN' : 'BEGIN SETTLING IN';
    const blackglassAction = blackglassComplete ? 'VIEW BLACKGLASS RESULT' : blackglassStarted ? 'RESUME BLACKGLASS' : 'BEGIN BLACKGLASS';
    const c3 = chapter3State(story);
    const c4 = chapter4State(story);
    const decisionCount = Object.keys(story.choices || {}).length + (c3.eveningMoments || []).length + (c3.duty?.completed ? 1 : 0) + (c4.qualifying?.completed ? 1 : 0) + (c4.eveningMoments || []).length + (c4.studiedSections || []).length + (c4.roomActions || []).length + (c4.morningPrep ? 1 : 0) + (c4.afterHours?.completed ? 1 : 0);
    const completedCount = 1 + (cantoComplete ? 1 : 0) + (downtimeComplete ? 1 : 0) + (blackglassComplete ? 1 : 0);
    root.innerHTML = `
      <section class="story-journey-shell" aria-label="Dragonbound Story Journey">
        <img class="journey-backdrop" src="story/environments/07_Lumerre_Terraces_and_Paddock.png" alt="" aria-hidden="true">
        <div class="journey-stage">
          <div class="journey-atmosphere" aria-hidden="true"></div><div class="journey-grid" aria-hidden="true"></div><div class="journey-vignette" aria-hidden="true"></div>
          <header class="journey-header"><div><strong>DRAGONBOUND</strong><span>FOLLOW THE STORY</span></div><button type="button" data-journey-back aria-label="Return to Career Hub"><i aria-hidden="true">←</i><span>BACK</span></button></header>
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
                <div class="journey-locked-list">
                  ${journeyStates.slice(4).map((chapter, index) => `<article class="journey-locked-card ${chapter.status === 'next' ? 'is-next' : ''}" style="--journey-delay:${2.15 + index * .14}s"><img src="${chapter.image}" alt=""><div><span>${chapter.number}</span><p><small>${escapeHtml(chapter.subtitle)}</small><strong>${escapeHtml(chapter.title)}</strong></p><i aria-hidden="true">${chapter.status === 'next' ? 'NEXT' : 'LOCKED'}</i></div></article>`).join('')}
                </div>
              </div>
              <footer class="journey-decisions"><div><small>YOUR STORY REMEMBERS</small><span>${escapeHtml(invitationChoice)}</span><span>${escapeHtml(cantoComplete ? (story.choices?.cantoAttitude?.label || strategyChoice) : cantoStarted ? strategyChoice : assessmentChoice)}</span></div><p><strong>${decisionCount}</strong><span>DECISIONS & MOMENTS<br>RECORDED</span></p></footer>
            </section>
          </main>
          <footer class="journey-footer"><span><i>⌂</i> CAREER HUB</span><strong>STORY JOURNEY</strong><span>QUICKQUILL · ${completedCount} / 7</span></footer>
        </div>
      </section><div class="blackout ${state.blackout ? 'is-visible' : ''}" aria-hidden="true"></div>`;
    root.querySelector('[data-journey-back]')?.addEventListener('click', returnToHubFromStory);
    root.querySelector('[data-view-prologue]')?.addEventListener('click', () => { playTone(310); renderStoryComplete(); });
    root.querySelector('[data-start-canto]')?.addEventListener('click', () => { void startCantoChapter(); });
    root.querySelector('[data-view-canto]')?.addEventListener('click', () => { playTone(310); renderCantoComplete(); });
    root.querySelector('[data-start-downtime]')?.addEventListener('click', () => { void startDowntimeChapter(); });
    root.querySelector('[data-view-downtime]')?.addEventListener('click', () => { playTone(310); renderDowntimeComplete(); });
    root.querySelector('[data-start-blackglass]')?.addEventListener('click', () => { void startBlackglassChapter(); });
    root.querySelector('[data-view-blackglass]')?.addEventListener('click', () => { playTone(310); renderBlackglassComplete(); });
  }

  function nextStoryPointer(story) {
    const next = cloneValue(story);
    const inCanto = QUICKQUILL_CANTO_SCENES.some(scene => scene.id === next.scene);
    const inDowntime = QUICKQUILL_DOWNTIME_SCENES.some(scene => scene.id === next.scene);
    const inBlackglass = QUICKQUILL_BLACKGLASS_SCENES.some(scene => scene.id === next.scene);
    const scenes = inBlackglass ? QUICKQUILL_BLACKGLASS_SCENES : inDowntime ? QUICKQUILL_DOWNTIME_SCENES : inCanto ? QUICKQUILL_CANTO_SCENES : QUICKQUILL_SCENES;
    const sceneIndex = scenes.findIndex(scene => scene.id === next.scene);
    const scene = scenes[Math.max(0, sceneIndex)];
    if (next.beat < scene.beats.length - 1) {
      next.beat += 1;
      return { story: next, changedScene: false, completed: false };
    }
    if (sceneIndex < scenes.length - 1) {
      next.scene = scenes[sceneIndex + 1].id;
      next.beat = 0;
      return { story: next, changedScene: true, completed: false };
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
        accountKey: accountKey(username()),
        playerKey: accountKey(username()),
        playerName: storyDragonName(),
        strategy
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
        blackglassStanding: blackglassStandingBand(changed)
      });
    } catch (error) {
      console.error('[Dragonbound Career Mode] Blackglass race launch save failed', error);
      state.storySaving = false;
      state.storyError = error?.message || 'Blackglass could not be prepared. Your story progress is safe.';
      render();
    }
  }

  function launchActiveStoryRace() {
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
        photoFinish: !!result.photoFinish
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
    await fadeTo(cantoInProgress || downtimeInProgress || blackglassInProgress ? 'story' : state.story.completed?.prologue ? 'story-journey' : 'story', { duration: 980 });
  }

  async function advanceStory() {
    if (state.mode !== 'story' || state.storySaving || state.transitionLocked || state.story?.completed?.blackglass) return;
    const scene = activeStoryScene();
    const beat = scene.beats[state.story.beat];
    if (beat?.type === 'choice' || beat?.type === 'race-launch' || beat?.type === 'blackglass-qualifying' || ['blackglass-paddock-explore','blackglass-circuit-study','blackglass-evening-planner','blackglass-room-night','blackglass-after-hours','blackglass-morning-prep'].includes(beat?.type)) return;
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
    const interactiveNext = ['corridor-explore','room-customise','evening-planner','duty-select','duty-game','downtime-free-roam','night-routine','morning-corridor','blackglass-qualifying','blackglass-paddock-explore','blackglass-circuit-study','blackglass-evening-planner','blackglass-room-night','blackglass-after-hours','blackglass-morning-prep'].includes(nextBeat?.type);
    const mustSave = next.changedScene || next.completed || nextBeat?.type === 'choice' || nextBeat?.type === 'race-launch' || interactiveNext;
    if (mustSave) {
      await saveStoryProgress(next.story, { transition: next.changedScene });
      return;
    }
    state.story = next.story;
    state.storyError = '';
    render();
  }

  async function chooseStoryOption(optionIndex) {
    if (state.mode !== 'story' || state.storySaving || state.transitionLocked || state.story?.completed?.blackglass) return;
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
    stopAfterHoursGameplay(true);
    state.mode = 'career-hub';
    window.clearTimeout(storyRevealTimer);
    storyRevealTimer = 0;
    state.storyError = '';
    state.status = state.story?.completed?.blackglass
      ? 'Second Wind complete — Chapter Five is next'
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
    if (event.data?.type === 'dragonbound-career-story-race-result') {
      const result = event.data.result || {};
      if (result.raceKey === 'blackglass' || result.trackId === 'blackglass_night_circuit') void acceptBlackglassRaceResult(result);
      else void acceptCantoRaceResult(result);
      return;
    }
    if (event.data?.type === 'dragonbound-career-story-race-aborted') {
      const result = event.data.result || {};
      if (result.raceKey === 'blackglass' || result.trackId === 'blackglass_night_circuit' || activeStoryScene()?.id === 'q29') void handleBlackglassRaceAbort('Race exited. Your Blackglass chapter is safe — return to the grid when ready.');
      else void handleCantoRaceAbort('Race exited. Your chapter progress is safe — start Canto again when ready.');
      return;
    }
    if (event.data?.type === 'dragonbound-career-story-race-error') {
      if (activeStoryScene()?.id === 'q29') void handleBlackglassRaceAbort(event.data.error || 'The Blackglass race could not start. Your chapter progress is safe.');
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
      if (state.saves.length) {
        state.selectedMenu = 1;
        state.status = 'Only one Career save is allowed per account — load your existing career';
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
    if (state.saves.length) {
      state.savesError = 'This account already has a Career save. Return to the main menu and load it instead.';
      render();
      return;
    }
    const team = TEAMS[state.selectedTeam];
    state.busy = true;
    state.savesError = '';
    render();
    try {
      const saveName = `${team.sponsor} Career`;
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
        try { await loadSaves({ preserveStatus: true }); } catch (_) {}
        state.status = 'This account already has a Career save';
        state.savesError = 'Only one Career save is allowed per account. Return to the main menu and load it instead.';
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
      const resultScreen = state.story?.completed?.blackglass || (state.story?.completed?.downtime && !chapterFourScene) || (state.story?.completed?.canto && !chapterThreeScene && !chapterFourScene && !state.story?.completed?.downtime) || (state.story?.completed?.prologue && !chapterTwoScene && !chapterThreeScene && !chapterFourScene && !state.story?.completed?.canto);
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
      if (beat?.type !== 'choice' && beat?.type !== 'race-launch' && beat?.type !== 'blackglass-qualifying' && !['blackglass-paddock-explore','blackglass-circuit-study','blackglass-evening-planner','blackglass-room-night','blackglass-after-hours','blackglass-morning-prep'].includes(beat?.type) && ['Enter', ' ', 'ArrowRight'].includes(event.key)) {
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
    const sceneList = chapterFourScene ? QUICKQUILL_BLACKGLASS_SCENES : chapterThreeScene ? QUICKQUILL_DOWNTIME_SCENES : chapterTwoScene ? QUICKQUILL_CANTO_SCENES : QUICKQUILL_SCENES;
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
    queueCurrentModePreloads();
  };

  render();
  void connectAccount();
})();
