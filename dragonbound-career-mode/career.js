(() => {
  'use strict';

  const SUPABASE_URL = 'https://hvdrwmjieguurxvrgzfu.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_bln84LaJ8iYmnkYK9mh0Pg_XxP7O1OZ';
  const SAVE_TABLE = 'dragonbound_career_saves';
  const SAVE_VERSION = 2;
  const BRIDGE_TOKEN = new URLSearchParams(window.location.search).get('bridge') || '';
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
    covidpanda: { name: 'NightLight', owner: 'CovidPanda', asset: 'covidpanda.webp' },
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

  const ALL_QUICKQUILL_SCENES = [...QUICKQUILL_SCENES, ...QUICKQUILL_CANTO_SCENES, ...QUICKQUILL_DOWNTIME_SCENES];

  const STORY_JOURNEY = [
    { number: '01', title: 'The Impossible Contract', subtitle: 'A race nobody important was watching', image: 'story/environments/01_Young_Velmora_League_Circuit.png' },
    { number: '02', title: 'Prove You Belong', subtitle: 'Race One · Canto Plains', image: 'story/environments/05_Canto_Plains_Racing_Venue.png' },
    { number: '03', title: 'A Place at Quickquill', subtitle: 'Settling in · no race today', image: 'story/environments/11_Quickquill_Accommodation_Corridor.png' },
    { number: '04', title: 'Second Wind', subtitle: 'Race Two · Blackglass', image: 'story/environments/06_Blackglass_Night_Circuit.png' },
    { number: '05', title: 'A Seat at the Table', subtitle: 'Pressure, people and consequences', image: 'story/environments/04_Quickquill_Rooftop_Walkway.png' },
    { number: '06', title: 'The Lumerre Crown', subtitle: 'Race Three · Lumerre', image: 'story/environments/08_Lumerre_Crown_Racing_Circuit.png' },
    { number: '07', title: 'The Contract Decision', subtitle: 'Your choices return', image: 'story/environments/07_Lumerre_Terraces_and_Paddock.png' }
  ];

  const root = document.getElementById('careerRoot');
  const music = {
    menu: document.getElementById('careerMenuMusic'),
    opening: document.getElementById('careerOpeningMusic'),
    hub: document.getElementById('careerHubMusic'),
    story: document.getElementById('careerStoryMusic'),
    downtime: document.getElementById('careerDowntimeMusic')
  };
  const state = {
    mode: 'menu',
    selectedMenu: 0,
    selectedTeam: null,
    selectedHub: null,
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

  function activeTrack() {
    if (state.mode === 'menu') return music.menu;
    if (state.mode === 'opening' || state.mode === 'team-select') return music.opening;
    if (state.mode === 'story') {
      const quietScenes = new Set(['q10','q11','q15','q16','q17']);
      if (quietScenes.has(state.story?.scene)) return music.downtime || music.story;
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
      version: 4,
      chapter: 'prologue',
      scene: 'q0',
      beat: 0,
      completed: { prologue: false, canto: false, downtime: false },
      identity: { heart: 0, fire: 0, focus: 0 },
      relationships: {
        quickquillTrust: 50,
        tyreseBond: 40,
        maraBond: 20,
        nellBond: 20,
        dragonBond: 50,
        jalenHeat: 10,
        jalenRespect: 0,
        valecroftInterest: 0
      },
      choices: {},
      race: { status: 'not-started', strategy: '', runId: '', result: null },
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
      history: []
    };
  }

  function normaliseQuickquillStory(raw) {
    const fallback = defaultQuickquillStory();
    if (!raw || typeof raw !== 'object' || raw.id !== fallback.id) return fallback;
    if ((Number(raw.version) || 1) < fallback.version && !raw.completed?.prologue) return fallback;
    const rawChapter3 = raw.chapter3 && typeof raw.chapter3 === 'object' ? raw.chapter3 : {};
    const story = {
      ...fallback,
      ...cloneValue(raw),
      version: fallback.version,
      completed: { ...fallback.completed, ...(raw.completed || {}) },
      identity: { ...fallback.identity, ...(raw.identity || {}) },
      relationships: { ...fallback.relationships, ...(raw.relationships || {}) },
      choices: { ...(raw.choices || {}) },
      race: { ...fallback.race, ...(raw.race || {}), result: raw.race?.result && typeof raw.race.result === 'object' ? { ...raw.race.result } : null },
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
      history: Array.isArray(raw.history) ? raw.history.slice(-100) : []
    };
    const sceneExists = ALL_QUICKQUILL_SCENES.some(scene => scene.id === story.scene);
    if (!sceneExists && !story.completed.prologue) {
      story.scene = 'q0';
      story.beat = 0;
    }
    story.beat = Math.max(0, Number(story.beat) || 0);
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

  function storyCopy(value) {
    return String(value || '')
      .replaceAll('[PLAYER_DRAGON]', storyDragonName())
      .replaceAll('[ACCOUNT_NAME]', username())
      .replaceAll('[RACE_POSITION]', state.story?.race?.result?.rank ? `${state.story.race.result.rank}${state.story.race.result.rank===1?'ST':state.story.race.result.rank===2?'ND':state.story.race.result.rank===3?'RD':'TH'}` : 'RESULT')
      .replaceAll('[RACE_TIME]', storyRaceTime())
      .replaceAll('[OVERTAKES]', String(Math.max(0, Number(state.story?.race?.result?.overtakes) || 0)));
  }

  function storyBeatText(beat) {
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
        QUICKQUILL_DOWNTIME_SCENES.some(scene => scene.id === nextStory.scene) && !nextStory.completed?.downtime
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
          ${isCatAsthmaTester() ? `<button type="button" class="story-reset-test" data-reset-story><small>CatAsthma test control</small><strong>RESET QUICKQUILL STORY</strong></button>` : ''}
        </div><div class="hub-screen-vignette" aria-hidden="true"></div>
        <div class="hub-status-toast" role="status">${escapeHtml(state.status || `${save?.sponsor || 'Career'} loaded`)}</div>
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
        state.status = `${item.label} will continue in the next Career Mode update`;
        const toast = root.querySelector('.hub-status-toast');
        if (toast) { toast.textContent = state.status; toast.classList.add('is-visible'); window.setTimeout(() => toast.classList.remove('is-visible'), 2600); }
      });
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
      'blackglass-envelope-open': 'story/props/blackglass-envelope-open.png'
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
    if (QUICKQUILL_DOWNTIME_SCENES.some(item => item.id === scene.id)) {
      const frameByScene = { q9: 10, q11: 4, q15: 11, q16: 9, q17: 1 };
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


  function renderStory() {
    window.clearTimeout(storyRevealTimer);
    storyRevealTimer = 0;
    storyRevealText = '';
    const chapterTwoScene = QUICKQUILL_CANTO_SCENES.some(item => item.id === state.story?.scene);
    const chapterThreeScene = QUICKQUILL_DOWNTIME_SCENES.some(item => item.id === state.story?.scene);
    if (state.story?.completed?.downtime) {
      renderDowntimeComplete();
      return;
    }
    if (state.story?.completed?.canto && !chapterThreeScene) {
      renderCantoComplete();
      return;
    }
    if (state.story?.completed?.prologue && !chapterTwoScene && !chapterThreeScene && !state.story?.completed?.canto) {
      renderStoryComplete();
      return;
    }
    const scene = activeStoryScene();
    const beat = scene.beats[Math.min(state.story?.beat || 0, scene.beats.length - 1)] || scene.beats[0];
    const sceneList = chapterThreeScene ? QUICKQUILL_DOWNTIME_SCENES : chapterTwoScene ? QUICKQUILL_CANTO_SCENES : QUICKQUILL_SCENES;
    const sceneIndex = sceneList.findIndex(item => item.id === scene.id);
    const interactiveTypes = new Set(['corridor-explore','room-customise','evening-planner','duty-select','duty-game','downtime-free-roam','night-routine','morning-corridor']);
    if (chapterThreeScene && interactiveTypes.has(beat.type)) {
      renderDowntimeInteractive(scene, beat, sceneIndex);
      return;
    }
    const isChoice = beat.type === 'choice';
    const isCinematic = beat.type === 'cinematic';
    const isRaceLaunch = beat.type === 'race-launch';
    const fullText = !isChoice && !isCinematic && !isRaceLaunch ? storyBeatText(beat) : '';
    state.storyRevealComplete = isChoice || isCinematic || isRaceLaunch;
    const chapterLabel = chapterThreeScene ? 'DOWNTIME' : chapterTwoScene ? 'RACE ONE' : 'PROLOGUE';
    const persistentRoomDecor = chapterThreeScene && ['q11','q16'].includes(scene.id) ? roomDecorMarkup() : '';
    root.innerHTML = `
      <section class="story-shell tone-${escapeHtml(scene.tone || 'default')}" aria-label="${escapeHtml(scene.number)} ${escapeHtml(scene.title)}">
        <img class="story-backdrop" src="${scene.background}" alt="" aria-hidden="true">
        <div class="story-stage ${chapterThreeScene && ['q10','q11','q15','q16','q17'].includes(scene.id) ? 'is-private-quarters' : ''} ${isCinematic ? 'is-cinematic-beat' : ''} ${isRaceLaunch ? 'is-race-launch-beat' : ''}" ${isChoice || isRaceLaunch ? '' : 'data-story-advance role="button" tabindex="0"'}>
          <img class="story-environment" src="${scene.background}" alt="${escapeHtml(scene.title)}">
          <div class="story-light" aria-hidden="true"></div><div class="story-weather" aria-hidden="true"></div><div class="story-speed-lines" aria-hidden="true"></div><div class="story-lens-flare" aria-hidden="true"></div><div class="story-grain" aria-hidden="true"></div><div class="story-letterbox" aria-hidden="true"></div>
          <header class="story-header"><div><small>QUICKQUILL: AGAINST THE ODDS</small><strong>${escapeHtml(scene.number)} · ${escapeHtml(scene.title)}</strong><span>${escapeHtml(scene.location)}</span></div><button type="button" data-story-home aria-label="Return to Career hub">BACK TO HUB</button></header>
          ${portraitMarkup(beat.portrait)}${storyDragonMarkup(scene, beat)}${storyPropMarkup(scene, beat)}${persistentRoomDecor}
          <div class="story-scene-counter" aria-hidden="true"><i style="--story-progress:${((sceneIndex + 1) / sceneList.length) * 100}%"></i><span>${chapterLabel} ${sceneIndex + 1} / ${sceneList.length}</span></div>
          ${isCinematic ? `<section class="story-cinematic-card" aria-live="polite"><small>${escapeHtml(storyCopy(beat.eyebrow))}</small><h1>${escapeHtml(storyCopy(beat.title))}</h1><i></i><p>${escapeHtml(storyCopy(beat.text))}</p><span>CLICK TO BEGIN</span></section>` : isRaceLaunch ? `
            <section class="story-race-launch-card" aria-live="polite">
              <small>CANTO MEADOW CIRCUIT · STORY RACE</small>
              <h1>START THE RACE</h1>
              <p>${escapeHtml(storyCopy(beat.text))}</p>
              <div class="story-race-strategy"><span>STRATEGY</span><strong>${escapeHtml(String(state.story?.race?.strategy || 'focus').toUpperCase())}</strong></div>
              <button type="button" data-story-race-start ${state.storySaving ? 'disabled' : ''}>${state.storySaving ? 'SAVING…' : state.story?.race?.status === 'in-progress' ? 'RESUME CANTO RACE' : 'GO TO THE GRID'}</button>
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
      root.querySelector('[data-story-race-start]')?.addEventListener('click', event => { event.stopPropagation(); void launchCantoStoryRace(); });
    } else {
      root.querySelector('[data-story-advance]')?.addEventListener('click', event => {
        if (event.target.closest('[data-story-home]')) return;
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
    const journeyStates = STORY_JOURNEY.map((chapter, index) => {
      let status = 'locked';
      if (index === 0) status = 'complete';
      else if (index === 1) status = cantoComplete ? 'complete' : 'next';
      else if (index === 2) status = !cantoComplete ? 'locked' : downtimeComplete ? 'complete' : 'next';
      else if (index === 3 && downtimeComplete) status = 'next';
      return { ...chapter, status };
    });
    const cantoAction = cantoComplete ? 'VIEW CANTO RESULT' : cantoStarted ? 'RESUME STORY CHAPTER' : 'BEGIN STORY CHAPTER';
    const downtimeAction = downtimeComplete ? 'VIEW CHAPTER RESULT' : downtimeStarted ? 'RESUME SETTLING IN' : 'BEGIN SETTLING IN';
    const c3 = chapter3State(story);
    const decisionCount = Object.keys(story.choices || {}).length + (c3.eveningMoments || []).length + (c3.duty?.completed ? 1 : 0);
    const completedCount = 1 + (cantoComplete ? 1 : 0) + (downtimeComplete ? 1 : 0);
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
                <div class="journey-locked-list">
                  ${journeyStates.slice(3).map((chapter, index) => `<article class="journey-locked-card ${chapter.status === 'next' ? 'is-next' : ''}" style="--journey-delay:${2.15 + index * .14}s"><img src="${chapter.image}" alt=""><div><span>${chapter.number}</span><p><small>${escapeHtml(chapter.subtitle)}</small><strong>${escapeHtml(chapter.title)}</strong></p><i aria-hidden="true">${chapter.status === 'next' ? 'NEXT' : 'LOCKED'}</i></div></article>`).join('')}
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
  }

  function nextStoryPointer(story) {
    const next = cloneValue(story);
    const inCanto = QUICKQUILL_CANTO_SCENES.some(scene => scene.id === next.scene);
    const inDowntime = QUICKQUILL_DOWNTIME_SCENES.some(scene => scene.id === next.scene);
    const scenes = inDowntime ? QUICKQUILL_DOWNTIME_SCENES : inCanto ? QUICKQUILL_CANTO_SCENES : QUICKQUILL_SCENES;
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
    await fadeTo(cantoInProgress || downtimeInProgress ? 'story' : state.story.completed?.prologue ? 'story-journey' : 'story', { duration: 980 });
  }

  async function advanceStory() {
    if (state.mode !== 'story' || state.storySaving || state.transitionLocked || state.story?.completed?.downtime) return;
    const scene = activeStoryScene();
    const beat = scene.beats[state.story.beat];
    if (beat?.type === 'choice' || beat?.type === 'race-launch') return;
    if (finishStoryReveal()) {
      playTone(190);
      return;
    }
    playTone(252 + (state.story.beat % 4) * 16);
    const next = nextStoryPointer(state.story);
    const nextScene = activeStoryScene(next.story);
    const nextBeat = nextScene.beats[next.story.beat];
    const interactiveNext = ['corridor-explore','room-customise','evening-planner','duty-select','duty-game','downtime-free-roam','night-routine','morning-corridor'].includes(nextBeat?.type);
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
    if (state.mode !== 'story' || state.storySaving || state.transitionLocked || state.story?.completed?.downtime) return;
    const scene = activeStoryScene();
    const beat = scene.beats[state.story.beat];
    const option = beat?.type === 'choice' ? beat.options[optionIndex] : null;
    if (!option || state.story.choices?.[beat.id]) return;
    const changed = cloneValue(state.story);
    applyStoryEffects(changed, option.effects);
    changed.choices[beat.id] = { option: optionIndex, label: option.label, value: option.value || '' };
    if (beat.id === 'cantoStrategy') changed.race = { ...(changed.race || {}), strategy: option.strategy || (optionIndex === 1 ? 'fire' : optionIndex === 2 ? 'heart' : 'focus'), status: 'ready' };
    if (beat.id === 'cantoAttitude') changed.chapter3.cantoAttitude = option.value || ['confident','analytical','grounded','hungry'][optionIndex] || 'grounded';
    if (beat.id === 'blackglassInitialAttitude') changed.chapter3.blackglassInitialAttitude = option.value || ['eager','wary','curious','measured'][optionIndex] || 'measured';
    changed.history.push({ scene: scene.id, choice: beat.id, option: optionIndex });
    const next = nextStoryPointer(changed);
    playTone(430 + optionIndex * 55);
    await saveStoryProgress(next.story, { transition: next.changedScene });
  }

  function returnToHubFromStory() {
    if (state.storySaving || state.transitionLocked) return;
    state.mode = 'career-hub';
    window.clearTimeout(storyRevealTimer);
    storyRevealTimer = 0;
    state.storyError = '';
    state.status = state.story?.completed?.downtime
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
      void acceptCantoRaceResult(event.data.result || {});
      return;
    }
    if (event.data?.type === 'dragonbound-career-story-race-aborted') {
      void handleCantoRaceAbort('Race exited. Your chapter progress is safe — start Canto again when ready.');
      return;
    }
    if (event.data?.type === 'dragonbound-career-story-race-error') {
      void handleCantoRaceAbort(event.data.error || 'The Canto race could not start. Your chapter progress is safe.');
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
      const scene = activeStoryScene();
      const chapterTwoScene = QUICKQUILL_CANTO_SCENES.some(item => item.id === state.story?.scene);
      const chapterThreeScene = QUICKQUILL_DOWNTIME_SCENES.some(item => item.id === state.story?.scene);
      const resultScreen = state.story?.completed?.downtime || (state.story?.completed?.canto && !chapterThreeScene) || (state.story?.completed?.prologue && !chapterTwoScene && !chapterThreeScene && !state.story?.completed?.canto);
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
        void launchCantoStoryRace();
        return;
      }
      if (!beat && resultScreen && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        returnToHubFromStory();
        return;
      }
      if (beat?.type !== 'choice' && beat?.type !== 'race-launch' && ['Enter', ' ', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        void advanceStory();
      }
      return;
    }
    if (state.mode === 'career-hub') {
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

  root.addEventListener('pointermove', event => {
    const x = event.clientX / window.innerWidth - .5;
    const y = event.clientY / window.innerHeight - .5;
    root.querySelector('.scene')?.style.setProperty('--look-x', `${x * -7}px`);
    root.querySelector('.scene')?.style.setProperty('--look-y', `${y * -5}px`);
    root.querySelector('.team-select-stage')?.style.setProperty('--team-x', `${x * -5}px`);
    root.querySelector('.team-select-stage')?.style.setProperty('--team-y', `${y * -4}px`);
    root.querySelector('.career-hub-stage')?.style.setProperty('--hub-x', `${x * -5}px`);
    root.querySelector('.career-hub-stage')?.style.setProperty('--hub-y', `${y * -4}px`);
    root.querySelector('.story-stage')?.style.setProperty('--story-x', `${x * -9}px`);
    root.querySelector('.story-stage')?.style.setProperty('--story-y', `${y * -6}px`);
  });
  window.addEventListener('keydown', handleKey);
  window.addEventListener('message', event => {
    if (event.origin !== window.location.origin) return;
    const frame = document.getElementById('meetTeamsFrame');
    if (!frame || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'dragonbound-career-meet-teams-close') closeMeetTeams();
  });
  window.addEventListener('pointerdown', () => syncMusic(), { once: true });
  window.addEventListener('keydown', () => syncMusic(), { once: true });

  OPENING_FRAMES.concat([
    'dragonbound-career.png', 'team-selection.png', 'career-hub.png',
    ...ALL_QUICKQUILL_SCENES.map(scene => scene.background),
    ...Object.values(PORTRAITS).map(portrait => portrait.source),
    ...STORY_JOURNEY.map(chapter => chapter.image)
  ]).forEach(source => {
    const image = new Image();
    image.src = source;
  });

  render();
  void connectAccount();
})();
