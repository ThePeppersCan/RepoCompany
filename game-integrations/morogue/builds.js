/* Run-scoped combat builds. No storage, timers or browser dependencies. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ROUGE_MORA_BUILDS=factory();})(globalThis,function(){
 'use strict';
 const SLOTS=6,TAU=Math.PI*2;
 const ABILITIES={
  steam:{name:'Pressure Lance',colour:'#e4ba79',cooldown:8,description:"Pierce a crowd with a powerful steam blast after a brief wind-up. Clears moving shots along its path.",upgrade:'Special damage gains 20% per rank. All specials scale with weapon level, power, evolution and Edge training.',branches:{fork:'Split Boiler',focus:'Needle Valve'},branchText:{fork:'Three spreading lances, each at 40% damage. Overlapping them rewards close aim.',focus:'A half-width lance deals 35% more damage. Aim carefully.'}},
  bell:{name:'Last Bell',colour:'#ecd8a0',cooldown:11,description:"Ring two close-range shocks. Block one hit during the 0.8-second brace to add a stronger countershock and clear nearby moving shots.",upgrade:'Both tolls and the counter gain 20% damage per rank.',branches:{mercy:'Quiet Toll',fury:'Reverberation'},branchText:{mercy:'A successful block also heals 6 health.',fury:'A successful block sends a delayed echo for another 35% special damage.'}},
  garden:{name:'Briar Lantern',colour:'#b4d197',cooldown:12,description:"Plant thorns ahead: an opening strike, four seconds of pulses, then a burst. Slows ordinary enemies by 35%.",upgrade:'The planting strike, pulses and final bloom gain 20% damage per rank.',branches:{wide:'Walled Garden',bloom:'Final Bloom'},branchText:{wide:'A 35% wider garden with 15% less damage.',bloom:'The final bloom deals double damage in the inner garden.'}},
  comet:{name:'Falling Star',colour:'#d6bbec',cooldown:10,description:"Mark your aim. A heavy star strikes after 0.6 seconds. Lead moving enemies or punish an opening.",upgrade:'Impact damage gains 20% per rank.',branches:{shower:'Star Shower',core:'Dense Core'},branchText:{shower:'Three staggered impacts along your aim, each at 48% special damage.',core:'A 25% smaller impact deals 30% more damage.'}},
  tide:{name:'Canal Undertow',colour:'#a5dbdc',cooldown:11,description:"Pull ordinary enemies inward, then strike with a returning wave. Marks foes for 15% more main damage for 4 seconds. Bosses resist pulling.",upgrade:'Both waves gain 20% damage per rank.',branches:{ebb:'Ebb & Flow',deep:'Deep Current'},branchText:{ebb:'Push ordinary enemies away instead. The returning wave reaches them at a wider radius.',deep:'Marks last 6 seconds, rewarding a longer follow-up.'}},
  clock:{name:'Borrowed Seconds',colour:'#b9d8ce',cooldown:14,description:"Place a 3.2-second field: slows ordinary enemies and moving shots by 45%. Main hits on enemies inside charge its final burst. Bosses resist slowing.",upgrade:'Damage gains 20% and field duration gains 0.4 seconds per rank. Stores 22% of main damage, up to 90% special damage.',branches:{wide:'Long Minute',refund:'Clockwork Return'},branchText:{wide:'A 30% wider field, lasting 0.4 seconds less.',refund:'Your first landed finisher inside restores 1.5 seconds of special recharge.'}}
 };
 // Existing mechanics remain recognisable, but now occupy deliberate build slots.
 const PERKS={
  slipstream:{name:'Slipstream',route:'style',max:1,tag:'DASH → ECHO',description:()=> 'Leave two delayed cuts where your dash began. Lead pursuers into your wake.'},
  crescent:{name:'Crust Comet',route:'style',max:1,weapon:'baguette',tag:'FINISHER → CRESCENT',description:()=> 'Your sword finisher launches a crescent for 65% strike damage. It travels beyond your blade and can hit up to 5 foes.'},
  roast:{name:'Slow Roast',route:'style',max:1,weapon:'espresso',tag:'SHOT → SCORCH',description:()=> 'Espresso hits scorch for another 40% damage. Repeated hits refresh the burn; they never stack it.'},
  measure:{name:'Perfect Measure',route:'style',max:1,tag:'CLEAN TIMING',description:()=> 'Cleanly timed attacks deal 55% more damage instead of 18%. Tap your next attack as the previous one recovers.'},
  lastlight:{name:'Last Light',route:'style',max:1,tag:'ONE RESCUE',description:()=> 'Once per run, surviving a hit below 25% health heals 30 and clears nearby shots. Cannot revive you.'},
  riposte:{name:'Crust Riposte',route:'talent',weapon:'baguette',tag:'PARRY → POWER',description:r=>'Blocking a shot primes one strike for '+r*20+'% more damage. Stored ripostes do not stack.'},
  crossfire:{name:'Backdraft',route:'talent',weapon:'espresso',tag:'FINISHER → CROSSFIRE',description:r=>'Your finisher also fires '+r+' half-strength backward shots.'},
  surge:{name:'Dash Detonation',route:'talent',tag:'DASH STRIKE → ECHO',description:r=>'A landed dash strike leaves a delayed blast for '+Math.round((.18+r*.07)*100)+'% damage.'},
  recovery:{name:'Second Breath',route:'talent',tag:'PERFECT DODGE → HEAL',description:r=>'Perfect dodges recover '+r*2+' health. Six seconds between heals.'},
  afterimage:{name:'Thousand Crumbs',route:'talent',weapon:'baguette',tag:'FINISHER → AFTERCUT',description:r=>'Finishers leave '+Math.ceil(r/2)+' delayed cuts, each at '+Math.round((.18+r*.06)*100)+'% damage.'},
  pressure:{name:'Point-blank Roast',route:'talent',weapon:'espresso',tag:'CLOSE-RANGE SHOTS',description:r=>'Main espresso hits within 160 steps deal '+r*12+'% extra damage.'},
  reserve:{name:'Third Step',route:'talent',max:1,tag:'EXTRA DASH',description:()=> 'Store a third dash. Charges still recover one at a time.'},
  momentum:{name:'Unbroken Rhythm',route:'talent',tag:'LANDED HITS',description:r=>'Carry '+(3+r)+' Momentum stacks. Taking damage still breaks the rhythm.'},
  soulstep:{name:'Starwake',route:'talent',tag:'DASH → COLLECT',description:r=>'A dash attracts experience stars within '+(120+r*35)+' steps of its starting point.'},
  execution:{name:'Last Word',route:'talent',tag:'FINISH WOUNDED FOES',description:r=>'Deal '+r*10+'% extra damage to foes below 30% health.'},
  conductor:{name:'Boiler Rhythm',tag:'CLEAN HIT → SPECIAL',description:r=>'A clean landed attack restores '+(.2+r*.15).toFixed(2)+' seconds of special recharge. Once per second.'},
  fleet:{name:'Light on Your Feet',tag:'SPECIAL → MOVEMENT',description:r=>'Casting a special grants '+r*8+'% movement speed for 2.5 seconds.'},
  ward:{name:'Copper Lining',tag:'SPECIAL → GUARD',description:r=>'Casting a special absorbs up to '+r*6+' damage for 3 seconds. Shields replace each other.'},
  aftermath:{name:'After Hours',tag:'SPECIAL → FINISHER',description:r=>'A finisher within 3 seconds of casting creates a pulse for '+r*8+'% of special damage. Once per cast.'},
  bankshot:{name:'Second Customer',weapon:'espresso',tag:'SHOT → RICOCHET',description:r=>'One main espresso bolt per attack may redirect after its last pierce, at '+(30+r*10)+'% damage. It cannot hit the same foe twice.'},
  needle:{name:'Fencer’s Reach',weapon:'baguette',tag:'OPENING THRUST',description:r=>'Your first cut becomes a narrow thrust: +'+(12+r*4)+' reach and +'+r*10+'% damage. Later cuts stay unchanged.'},
  siphon:{name:'Marked for Supper',tag:'MARK → RECOVER',description:r=>'Land a main hit on a special-marked enemy to recover '+r+' health. Four seconds between heals.'},
  reprisal:{name:'Dodge & Deliver',tag:'PERFECT DODGE → SPECIAL',description:r=>'A perfect dodge restores '+(.5+r*.3).toFixed(1)+' seconds of special recharge. Three seconds between triggers.'},
  pursuit:{name:'Fresh Footprints',tag:'DASH → PURSUIT',description:r=>'Your first landed attack within 1.5 seconds of a dash deals '+r*12+'% more damage.'},
  reservoir:{name:'Full Kettle',tag:'SPECIAL → FOLLOW-UP',description:r=>'After casting, main attacks deal '+r*6+'% more damage for 4 seconds. Recasting refreshes the effect.'},
  cadence:{name:'Measured Breathing',tag:'THREE CLEAN HITS',description:r=>'Three clean landed attacks within 5 seconds recover '+(r*2)+' health. Eight seconds between heals.'},
  tether:{name:'Lantern Thread',tag:'SPECIAL → MARK',description:r=>'Enemies hit by damaging specials are marked for '+(2+r)+' seconds. Main attacks deal 15% more damage to marked foes.'},
  singleorigin:{name:'Single Origin',weapon:'espresso',max:1,tag:'SHOT TRANSFORMATION',description:()=> 'Compress each volley into one fast, deep-piercing shot. Multi-shot volleys retain 72% of their combined damage; single shots stay full strength. Attacks recover 15% slower.'},
  spill:{name:'Spilled Secrets',weapon:'espresso',max:1,tag:'SHOT → GROUND TRAP',description:()=> 'The first main-shot hit per attack leaves hot coffee for 1.8 seconds. Three small puddles maximum; each pulses for 12% shot damage.'},
  returning:{name:'Return to Sender',weapon:'baguette',max:1,group:'blade-flight',tag:'FINISHER TRANSFORMATION',description:()=> 'Your finisher sends out a blade that returns to you. It deals 35% strike damage each way; the melee finisher loses 30% damage.'},
  doughpin:{name:'Baker’s Dozen',weapon:'baguette',max:1,tag:'FINISHER → STORED TRAPS',description:()=> 'A landed finisher pins a blade in the ground for 12 seconds. Your next special detonates up to three pins for 35% strike damage each.'},
  feint:{name:'False Goodbye',max:1,tag:'DASH → DECOY',description:()=> 'A dash leaves a two-second decoy that attracts nearby ordinary enemies. Six seconds between decoys. Bosses ignore it.'},
  kindling:{name:'Kindling Step',max:1,tag:'DASH → DETONATE',description:()=> 'Dash through your garden, comet mark or coffee puddle to detonate it early and clear shots within 80 steps. The field is consumed.'}
 };
 Object.assign(PERKS,{
  cleaveguard:{name:'Crustguard',weapon:'baguette',max:1,tag:'FINISHER → CLEAR SHOTS',description:()=> 'A landed sword finisher destroys moving enemy shots within 180 steps of you, beyond your blade. Once every 3 seconds. Floor attacks are unaffected.'},
  hookcut:{name:'Hooked Cut',weapon:'baguette',max:1,tag:'FIRST CUT → PULL',description:()=> 'The first cut of your sword combo pulls its first ordinary target 38 steps closer. Once every 3 seconds. Bosses cannot be pulled.'},
  coldbrew:{name:'Cold Brew',weapon:'espresso',max:1,tag:'SHOT → SLOW',description:()=> 'The first target hit by each coffee attack moves 30% slower for 2 seconds. Refreshes instead of stacking. Bosses are unaffected.'},
  fanbrew:{name:'Wide Pour',weapon:'espresso',max:1,group:'coffee-shape',tag:'VOLLEY TRANSFORMATION',description:()=> 'Each coffee volley gains two shots and spreads wider. Its total damage becomes 90% of normal, shared across the shots. Covers crowds; weaker against one target.'},
  reckoning:{name:'Pepper Reprieve',max:1,tag:'PERFECT DODGE → FINISHER',description:()=> 'A perfect dodge primes your next landed finisher for a small blast dealing 30% of that strike. Use it within 6 seconds. Stores one blast; 4 seconds between charges.'},
  pilgrim:{name:'Walking Supper',max:1,tag:'MOVE → STRONGER ATTACK',description:()=> 'Land your next main attack at least 150 steps from your previous hit for 16% more damage. Distance is measured between hit locations; circling in place does not count.'},
  secondwind:{name:'Restorative Broth',max:1,tag:'TAKE DAMAGE → SPECIAL',description:()=> 'Cast a special within 6 seconds of taking damage to recover 6 health. Once every 12 seconds. Prevented hits do not trigger it.'},
  crossing:{name:'Threaded Figs',max:1,tag:'PERFECT DODGE → MARK',description:()=> 'A perfect dodge marks the 3 nearest foes within 180 steps for 3 seconds. Main attacks deal 15% more damage to marked foes. Once every 4 seconds; marks do not stack.'}
 });
 // Behaviour-changing cards share normal slots and keep their existing damage budgets.
 const NEW_WEAPON_FORMS={
  "carom": {
    "name": "Carom Coffee",
    "weapon": "espresso",
    "tag": "SHOT → CHAIN",
    "max": 1,
    "rarity": "rare",
    "description": "One bolt per attack ricochets to two fresh targets after its last pierce, retaining 65% damage at each bounce. Forward coffee shots deal 10% less damage. Skillet Capers adds 5% retention per rank."
  },
  "echobrew": {
    "name": "Echo Espresso",
    "weapon": "espresso",
    "tag": "VOLLEY → ECHO",
    "max": 1,
    "rarity": "rare",
    "description": "Each forward volley repeats from its firing point after 0.35 seconds at 40% shot damage. The first volley deals 15% less damage. Echoes cannot trigger other weapon effects."
  },
  "orbitbrew": {
    "name": "Saturn Macchiato",
    "weapon": "espresso",
    "tag": "FINISHER → ORBIT",
    "max": 1,
    "rarity": "rare",
    "description": "Forward finisher shots circle you for 0.55 seconds before flying along their original aim. They deal 15% less damage and cannot hit the same target twice."
  },
  "cyclone": {
    "name": "Cyclone Brioche",
    "weapon": "baguette",
    "tag": "CUT → FULL SWEEP",
    "max": 1,
    "rarity": "rare",
    "description": "Ordinary sword cuts sweep all around you with 20 extra reach, but deal 25% less melee damage. Finishers keep their usual shape and damage."
  },
  "faultline": {
    "name": "Faultline Focaccia",
    "weapon": "baguette",
    "tag": "OPENING CUT → ERUPTIONS",
    "max": 1,
    "rarity": "rare",
    "description": "Your first combo cut lays three eruptions ahead. Each bursts after a short delay for 22% strike damage. All sword melee hits deal 10% less damage."
  },
  "crumbstorm": {
    "name": "Crumbstorm Skewers",
    "weapon": "baguette",
    "tag": "FINISHER → BLADE FAN",
    "max": 1,
    "rarity": "rare",
    "group": "blade-flight",
    "description": "Your finisher throws three piercing bread blades, each at 25% strike damage. Its melee hit deals 20% less damage. Replaces other flying-blade transformations."
  }
};
 for(const [id,spec]of Object.entries(NEW_WEAPON_FORMS))PERKS[id]={...spec,description:()=>spec.description};
 const TRANSFORMATIONS=['slipstream','crescent','singleorigin','spill','returning','doughpin','feint','kindling','fanbrew',...Object.keys(NEW_WEAPON_FORMS)];
 for(const id of TRANSFORMATIONS)PERKS[id].rarity='rare';
 // A small affinity preference breaks ties between equally fresh offers, never overrides eligibility.
 const TRANSFORM_PARTNERS={slipstream:['feint','pursuit'],crescent:['aftermath','reckoning'],singleorigin:['pressure','tether'],spill:['kindling'],returning:['pursuit','pilgrim'],doughpin:['conductor','reprisal'],feint:['slipstream','recovery','reckoning'],kindling:['spill'],fanbrew:['coldbrew','bankshot']};
 function transformationAffinity(s,c){return (TRANSFORM_PARTNERS[c.key]||[]).some(id=>s.build.perks[id])||c.key==='kindling'&&['garden','comet'].includes(s.build.ability)?1:0;}
 PERKS.singleorigin.group='coffee-shape';
 PERKS.crescent.group='blade-flight';
 for(const p of Object.values(PERKS)){p.max??=3;p.at??=0;p.route??='perk';}

 // Each alteration keeps its slot. At most two permanent refinements can be woven into it.
 const REFINEMENTS={
  "slipstream": {
    "trail": [
      "Travelling Wake",
      "DASH → PLACE ECHOES",
      "The second dash echo lands 80 steps ahead along your dash direction. The first stays where you started.",
      "Same two hits and damage. Dash past pursuers to catch them between the cuts."
    ],
    "snare": [
      "Thorned Wake",
      "ECHO → SLOW",
      "Dash echoes slow ordinary enemies by 30% for 1.5 seconds.",
      "Bosses resist slowing. Slows refresh; they never stack."
    ],
    "poise": [
      "Perfect Reprise",
      "DODGE → STRONGER ECHOES",
      "A perfect dodge strengthens your next dash echoes by 20%. Use them within 4 seconds.",
      "Stores one charge. Four seconds between charges."
    ]
  },
  "crescent": {
    "fork": [
      "Twin Moons",
      "FINISHER → TWO CRESCENTS",
      "Your finisher sends two spreading crescents, each dealing 40% strike damage instead of one at 65%.",
      "Each hits up to 5 enemies. Aim between groups; the two blades may overlap up close."
    ],
    "reach": [
      "Long Crescent",
      "CRESCENT → DEEPER REACH",
      "Crescents travel 30% farther and can hit 8 enemies instead of 5.",
      "No extra damage per hit. Line up a crowd beyond your sword."
    ],
    "mark": [
      "Written in Gold",
      "CRESCENT → MARK",
      "A crescent marks the first enemy it hits for 3 seconds. Main attacks against it deal 15% more damage.",
      "Works on bosses. Shares the existing mark; multiple marks never stack."
    ]
  },
  "singleorigin": {
    "thread": [
      "Through the Needle",
      "PIERCE → BUILD POWER",
      "Your compressed shot gains 8% damage after each enemy it pierces, up to 24%.",
      "The first enemy takes normal damage. Line up enemies before a tougher target."
    ],
    "stride": [
      "Pilgrim’s Pour",
      "MOVE → EMPOWER SHOT",
      "Move 100 steps from your last coffee attack to strengthen the next compressed volley by 20%.",
      "Distance is between attack positions. All other attacks keep their usual damage."
    ],
    "fracture": [
      "Cracked Seal",
      "SECOND HIT → BURST",
      "The second different enemy pierced by a compressed volley releases a small burst for 20% shot damage.",
      "One burst per main attack. The burst cannot trigger more bursts or hit its own source target."
    ]
  },
  "spill": {
    "wide": [
      "Black Saucer",
      "PUDDLE → WIDER COVERAGE",
      "Coffee puddles are 35% wider. Each pulse deals 15% less damage.",
      "Three puddles maximum. Bigger coverage rewards drawing crowds through them."
    ],
    "follow": [
      "Trailing Grounds",
      "PUDDLE → FOLLOW TARGET",
      "A puddle follows its first ordinary target at up to 85 steps per second.",
      "Boss puddles stay on the floor. Duration, damage and the three-puddle limit stay the same."
    ],
    "bloom": [
      "Last Sip",
      "PUDDLE EXPIRES → BURST",
      "A puddle that lasts its full 1.8 seconds bursts for another 18% of its original shot’s damage.",
      "Consuming it with a dash gives up this final burst. Three puddles maximum."
    ]
  },
  "returning": {
    "wide": [
      "Broad Homecoming",
      "RETURN → WIDER BLADE",
      "The returning blade is 60% wider on its way back, but return damage is 15% lower.",
      "Outbound damage is unchanged. Move sideways to sweep the wider return through a crowd."
    ],
    "cross": [
      "Crossed Path",
      "REPOSITION → STRONGER RETURN",
      "Move 90 steps from the throw point before the blade turns back to increase its return damage by 35%.",
      "Only the returning blade gains damage. Standing at the throw point gives no bonus."
    ],
    "wait": [
      "Patient Blade",
      "TURNAROUND → DELAYED CUT",
      "The blade waits 0.3 seconds at its turning point and makes one small cut for 17.5% strike damage.",
      "It then returns normally. The delayed cut cannot trigger other weapon effects."
    ]
  },
  "doughpin": {
    "stitch": [
      "Thorn Stitch",
      "SPECIAL → JOIN TRAPS",
      "When your special detonates two or more pins, thin cuts connect neighbouring pins for 17.5% strike damage.",
      "Each enemy takes at most one connecting cut per detonation. Pins still explode normally."
    ],
    "wide": [
      "Scattered Thorns",
      "PIN → WIDER BLAST",
      "Pin explosions grow from 90 to 120 steps, but deal 15% less damage.",
      "Three pins maximum. Space them apart for wider coverage."
    ],
    "snare": [
      "Waiting Table",
      "PIN → SLOW NEARBY FOES",
      "Ordinary enemies within 55 steps of a planted pin move 25% slower.",
      "Bosses resist slowing. Pins still last 12 seconds and explode when you cast a special."
    ]
  },
  "feint": {
    "burst": [
      "Curtain Call",
      "DECOY EXPIRES → BURST",
      "Your decoy bursts after its full lifetime for 45% of a basic main strike within 95 steps.",
      "Six seconds between decoys. The burst cannot create more decoys or weapon effects."
    ],
    "guard": [
      "Borrowed Face",
      "DECOY → CATCH SHOTS",
      "Each decoy catches up to 3 moving enemy projectiles that touch it.",
      "Floor attacks pass through. Your own dash protection is unchanged."
    ],
    "linger": [
      "Long Goodbye",
      "DECOY → LONGER DISTRACTION",
      "Decoys last 3 seconds instead of 2 and attract ordinary enemies from farther away.",
      "Eight seconds between decoys instead of 6. Bosses ignore the lure."
    ]
  },
  "kindling": {
    "echo": [
      "Falling Petals",
      "DETONATE → DELAYED ECHO",
      "The first field you detonate during a dash leaves one smaller blast after 0.5 seconds, at 20% detonation damage.",
      "One echo per dash. The echo cannot detonate fields or trigger weapon effects."
    ],
    "hollow": [
      "Hollow Ring",
      "DETONATE → OPEN SPACE",
      "Detonations clear moving shots within 110 steps and push ordinary enemies away by up to 45 steps.",
      "Bosses resist pushing. Floor attacks remain dangerous."
    ],
    "ember": [
      "Banked Ember",
      "DETONATE → NEXT ATTACK",
      "Detonating a field primes your next main attack for 15% more damage. Use it within 4 seconds.",
      "Stores one charge. Additional detonations refresh it instead of stacking power."
    ]
  },
  "fanbrew": {
    "flank": [
      "Flank Pour",
      "VOLLEY → SIDE SHOTS",
      "The two outer shots of each wide coffee volley fire farther toward your flanks.",
      "The volley keeps its existing total damage. Catch enemies beside you; fewer shots stay on your aim line."
    ],
    "gather": [
      "Gathering Steam",
      "DISTANT SHOTS → CONVERGE",
      "After travelling 180 steps, wide coffee shots curve gradually back toward your original aim line.",
      "Aim stays fixed when you fire. Total damage and the limit on repeated boss hits are unchanged."
    ],
    "frost": [
      "Frosted Rim",
      "OUTER SHOTS → SLOW",
      "The two outer shots of a wide volley slow ordinary targets by 40% for 1.5 seconds.",
      "Bosses resist slowing. Slow effects refresh and never multiply."
    ]
  }
};
 Object.assign(REFINEMENTS,{
  "carom": {
    "third": [
      "Third Cup",
      "CHAIN → EXTRA BOUNCE",
      "Carom Coffee gains a third ricochet.",
      "Each target can be hit only once by that bolt."
    ],
    "reach": [
      "Long Table",
      "CHAIN → FARTHER REACH",
      "Carom Coffee finds ricochet targets within 360 steps instead of 240.",
      "Damage retention stays unchanged."
    ]
  },
  "echobrew": {
    "strong": [
      "Double Extraction",
      "ECHO → MORE DAMAGE",
      "Echo volleys deal 55% of the first volley’s shot damage instead of 40%.",
      "Echoes still cannot trigger other weapon effects."
    ],
    "chill": [
      "Iced Echo",
      "ECHO → SLOW",
      "Echo hits slow ordinary enemies by 30% for 2 seconds.",
      "Bosses resist slowing. Repeated slows refresh instead of stacking."
    ]
  },
  "orbitbrew": {
    "wide": [
      "Outer Ring",
      "ORBIT → WIDER RING",
      "Orbiting shots circle at 78 steps instead of 48.",
      "Orbit duration and shot damage stay unchanged."
    ],
    "release": [
      "Slingshot Cream",
      "RELEASE → MORE DAMAGE",
      "Shots gain 25% damage when they leave their orbit.",
      "Hits made while circling keep their usual damage."
    ]
  },
  "cyclone": {
    "reach": [
      "Wider Spiral",
      "SWEEP → REACH",
      "Cyclone’s ordinary cuts gain another 20 reach.",
      "The 25% melee damage penalty remains."
    ],
    "slow": [
      "Dragging Crust",
      "SWEEP → SLOW",
      "Cyclone’s ordinary cuts slow ordinary enemies by 25% for 1.5 seconds.",
      "Bosses resist slowing. Finishers do not apply this slow."
    ]
  },
  "faultline": {
    "wide": [
      "Broken Platter",
      "ERUPTION → COVERAGE",
      "Faultline eruptions grow from 42 to 60 steps in radius.",
      "Damage and eruption count stay unchanged."
    ],
    "fourth": [
      "Fourth Course",
      "ERUPTION → EXTRA BURST",
      "The opening cut creates a fourth eruption farther along your aim.",
      "Each eruption still deals 22% strike damage and cannot trigger other weapon effects."
    ]
  },
  "crumbstorm": {
    "five": [
      "Five-pronged Fork",
      "FAN → FIVE BLADES",
      "Finishers throw five bread blades, each at 18% strike damage, instead of three at 25%.",
      "The wider fan covers more targets. Melee damage keeps its 20% penalty."
    ],
    "reach": [
      "Long Skewers",
      "FAN → REACH & PIERCE",
      "Bread blades travel 30% farther and pierce five targets instead of three.",
      "Damage per blade stays unchanged."
    ]
  }
});
 function hasRefinement(s,parent,key){return !!s.build?.perks?.[parent]&&!!s.build.refinements?.[parent]?.includes(key);}
 function refinementCards(s){const result=[];for(const [parent,options]of Object.entries(REFINEMENTS)){if(!s.build.perks[parent]||PERKS[parent].weapon!==s.mainWeapon)continue;const owned=s.build.refinements?.[parent]||[];if(owned.length>=2)continue;for(const [key,[name,tag,description,tradeoff]]of Object.entries(options)){if(owned.includes(key))continue;result.push({id:'refinement:'+parent+':'+key,kind:'refinement',parent,key,name,tag,description:description+' '+tradeoff,tradeoff,detail:'Refines '+PERKS[parent].name+' · '+(owned.length+1)+' / 2 refinements · Uses its existing combat slot. Permanent for this run.',level:owned.length+2,icon:PERKS[parent].weapon||'perk'});}}return result;}
 function refinementSummary(s,parent){return (s.build.refinements?.[parent]||[]).map(key=>{const r=REFINEMENTS[parent]?.[key];return r?r[0]+': '+r[2]+' '+r[3]:'';}).filter(Boolean).join(' ');}

 const KEYSTONES={
  glass:{name:'Glass Boiler',tag:'POWER / RISK',description:'Special damage +40%. All incoming damage +15%.'},
  duellist:{name:'The Blade’s Oath',tag:'ATTACK / SPECIAL',description:'Main attacks deal 25% more damage. Specials recharge 25% slower.'},
  precision:{name:'No Wasted Motion',tag:'TIMING / RISK',description:'Clean attacks deal 35% more damage. Other main attacks deal 12% less.'},
  eclipse:{name:'Borrowed Starlight',tag:'DODGE / SPECIAL',description:'A perfect dodge primes your next special for 60% more damage. The charge expires after 6 seconds.'}
 };
 const runTime=s=>s.runTime??s.time;
 const rank=s=>runTime(s)>=600?3:runTime(s)>=300?2:1;
 function cards(s){const result=[],slots=Object.keys(s.build.perks).length;
  for(const [id,p]of Object.entries(PERKS)){const from=s.build.perks[id]||0;if(p.weapon&&p.weapon!==s.mainWeapon||from>=Math.min(p.max,rank(s))||!from&&slots>=SLOTS||p.group&&Object.keys(s.build.perks).some(k=>k!==id&&PERKS[k].group===p.group)||id==='siphon'&&s.build.ability!=='tide'&&!s.build.perks.tether&&!s.build.perks.crossing||id==='kindling'&&!['garden','comet'].includes(s.build.ability)&&!s.build.perks.spill)continue;result.push({id:'perk:'+id,key:id,kind:'perk',rarity:p.rarity,from,level:from+1,name:p.name,tag:p.tag,description:p.description(from+1),detail:(p.rarity==='rare'?'Rare transformation · ':'')+(from?'Rank '+from+' → '+(from+1):'Combat slot '+(slots+1)+' / '+SLOTS)+' · '+(p.max>1?'Ranks II / III open at 05:00 / 10:00.':'One rank. Changes how you fight.')+(p.group==='blade-flight'?' Choose one flying-blade perk per run.':p.group==='coffee-shape'?' Choose Wide Pour or Single Origin per run.':''),icon:p.weapon||'perk'});}
  const a=s.build.ability;if(a){const spec=ABILITIES[a];if(s.build.abilityRank<rank(s))result.push({id:'ability-rank',kind:'abilityRank',name:spec.name+' · mastery',tag:'SPECIAL MASTERY',level:s.build.abilityRank+1,description:spec.upgrade,detail:'Rank '+s.build.abilityRank+' → '+(s.build.abilityRank+1),icon:a});if(runTime(s)>=300&&!s.build.branch)for(const [id,name]of Object.entries(spec.branches))result.push({id:'branch:'+id,key:id,kind:'branch',name,tag:'SPECIAL FORK · CHOOSE ONE',description:spec.branchText[id],detail:'Permanently shapes '+spec.name+' for this run.',icon:a});}
  if(runTime(s)>=600&&!s.build.keystone)for(const [id,k]of Object.entries(KEYSTONES))result.push({id:'keystone:'+id,key:id,kind:'keystone',...k,detail:'One keystone per run. Read the trade-off.',icon:'keystone'});
  return result;
 }
 function abilityCards(s,shuffle){return shuffle(Object.entries(ABILITIES)).slice(0,3).map(([id,a])=>({id:'ability:'+id,key:id,kind:'ability',level:1,name:a.name,tag:'NEW SPECIAL · E / RIGHT-CLICK',description:a.description,detail:a.cooldown+'s recharge',icon:id}));}
 function apply(s,c){const b=s.build;if(c.kind==='refinement'){const canonical=refinementCards(s).find(q=>q.id===c.id&&q.parent===c.parent&&q.key===c.key);if(!canonical)return false;b.refinements??={};(b.refinements[canonical.parent]??=[]).push(canonical.key);return true;}if(c.kind==='ability'){b.ability=c.key;b.abilityRank=1;b.cooldown=0;}else if(c.kind==='abilityRank')b.abilityRank=c.level;else if(c.kind==='branch')b.branch=c.key;else if(c.kind==='keystone')b.keystone=c.key;else if(c.kind==='perk'){if(!cards(s).some(q=>q.id===c.id&&q.level===c.level))return false;if(!b.perks[c.key]&&Object.keys(b.perks).length>=SLOTS)return false;b.perks[c.key]=c.level;const spec=PERKS[c.key];if(spec.route==='style')s.styles[c.key]=true;if(spec.route==='talent')s.endlessTalents[c.key]=c.level;}else return false;return true;}
 function create(api){const {state:s,hit,fx,event,power,World,Hitboxes}=api,p=s.player,heal=api.heal||(amount=>{p.hp=Math.min(p.maxHp,p.hp+amount);});const b=s.build={ability:null,abilityRank:1,branch:null,keystone:null,cooldown:0,cooldownMax:0,perks:{},refinements:{},fields:[],casts:0,rerolls:2,ward:0,wardUntil:0,guard:0,speedUntil:0,castUntil:0,starlight:0,pursuitUntil:0,cleanCount:0,cleanUntil:0};let specialHeld=false,readySignalled=false;b.readyAt=null;b.charges=1;const gates={};const starter=()=>!!s.relics?.starter;
  const r=id=>b.perks[id]||0,ref=(parent,key)=>hasRefinement(s,parent,key),gate=(id,sec)=>{if((gates[id]??-99)>s.time)return false;gates[id]=s.time+sec;return true;},dist=(a,z)=>Math.hypot(a.x-z.x,a.y-z.y),cue=id=>event('buildCue',{id});
  function applyMark(e,seconds){const fresh=!(e.buildMarkUntil>s.time);e.buildMarkUntil=Math.max(e.buildMarkUntil||0,s.time+seconds);if(fresh&&gate('markSound',.15))cue('enemy_mark');}
  const mark=e=>{if(r('tether'))applyMark(e,2+r('tether'));};
  // A cast is roughly one to two seconds of committed main attacks at an evolved build.
  // Share permanent weapon progression; never inherit temporary main-only procs.
  const damage=()=> (300+s.weapons[s.mainWeapon]*180)*2*power()*(1+(b.abilityRank-1)*.2)*(s.evolutions[s.mainWeapon]?1.2:1)*(1+.6*Math.log1p((s.training?.edge||0)/10))*(b.keystone==='glass'?1.4:1)*(b.starlight>s.time?1.6:1);
  function area(x,y,radius,amount,colour,achievement={}){let hits=0;const affected=[];for(const e of s.enemies){if(e.hp<=0||dist(e,{x,y})>radius+e.r)continue;mark(e);const before=e.hp,staggered=e.majorState==='stagger';hit(e,amount,0,0,{weapon:'special',angle:Math.atan2(e.y-y,e.x-x),heavy:true});if(e.hp<before)affected.push({id:e.id,bossType:e.bossType,major:e.major,killed:e.hp<=0,staggered});hits++;}if(affected.length)event('achievementArea',{...achievement,affected,cast:achievement.field?.achievementCast??b.casts,eclipse:achievement.field?.achievementEclipse??b.achievementEclipse,attacker:s.achievementAttacker?.id});if(hits)fx('burst',x,y-18,colour,.55);return hits;}
  const ordinary=e=>!e.major&&!['boss','sigil'].includes(e.type);
  function chill(e,scale,seconds){if(!ordinary(e))return;e.refineSlowScale=e.refineSlowUntil>s.time?Math.min(e.refineSlowScale,scale):scale;e.refineSlowUntil=Math.max(e.refineSlowUntil||0,s.time+seconds);}
  // Secondary effects deliberately cannot trigger main-hit, special or field procs.
  function secondary(x,y,radius,amount,exclude=null){for(const e of s.enemies){if(e===exclude||e.hp<=0)continue;const aligned=Hitboxes?.custom(e)?Hitboxes.swept(e,{x,y:y-18},{x,y:y-18},radius):dist(e,{x,y})<=radius+(e.r||0);if(aligned)hit(e,amount,0,0,{weapon:'refinement',active:false,angle:Math.atan2(e.y-y,e.x-x)});}fx('ring',x,y-18,'#bbd5bd',.6,{radius});}
  function field(kind,x,y,radius,life,amount=0,delay=0){if(b.fields.length>=16)return;const f={kind,x,y,radius,life,delay,age:0,tick:delay,damage:amount,colour:ABILITIES[b.ability]?.colour||'#d8ba83',branch:b.branch,achievementCast:b.casts,achievementEclipse:b.achievementEclipse,achievementTravel:0};b.fields.push(f);return f;}
  function clearShots(x,y,radius){for(const h of s.hazards)if(h.life>0&&Math.hypot(h.vx||0,h.vy||0)>0&&Math.hypot(h.x-x,h.y-y+18)<radius)h.life=0;}
  function bloom(x,y,radius,amount,colour,kind='bloom',achievement={}){area(x,y,radius,amount,colour,achievement);const f=field(kind,x,y,radius,.48);if(f)f.colour=colour;}
  function cast(){if(!b.ability||(starter()?b.charges<1:b.cooldown>0)||s.status!=='playing'||s.transition||p.attack?.whirl||p.finaleLeap)return false;const achievementBank=s.relicState?.bank||0,achievementCharges=b.charges,spec=ABILITIES[b.ability],angle=s.aimAngle,amount=damage(),target=World.nearest(s.world,p.x+Math.cos(angle)*Math.min(380,s.aimDistance||210),p.y+Math.sin(angle)*Math.min(380,s.aimDistance||210),20);b.cooldownMax=spec.cooldown*(b.keystone==='duellist'?1.25:1)*(starter()?1.3:1);if(!starter()||b.cooldown<=0)b.cooldown=b.cooldownMax;if(starter())b.charges--;if(s.relics?.saffron&&s.relicState){b.cooldown=Math.max(0,b.cooldown-s.relicState.bank);s.relicState.bank=0;}b.casts++;if(r('secondwind')&&b.woundedUntil>s.time&&gate('secondwind',12)){b.woundedUntil=0;heal(6);fx('ring',p.x,p.y-18,'#b4d197',.6);}b.castUntil=s.time+3;b.speedUntil=s.time+2.5;b.ward=r('ward')*6;b.wardUntil=s.time+3;b.achievementEclipse=b.starlight>s.time;b.starlight=0;b.clockRefund=false;b.castPower=amount;b.reservoirUntil=s.time+4;
   if(p.attack){p.attack=null;s.attackWindow=.85;}
   p.cast={id:b.ability,angle,age:0,duration:b.ability==='bell'?.8:b.ability==='steam'?.42:.6,style:{steam:'focus',bell:'guard',garden:'grow',comet:'heave',tide:'tide',clock:'tick'}[b.ability]};
   if(b.ability==='steam')for(const offset of b.branch==='fork'?[-.24,0,.24]:[0]){const f=field('lance',p.x,p.y,0,.48,amount*(b.branch==='fork'?.4:b.branch==='focus'?1.35:1),.12);if(f)Object.assign(f,{angle:angle+offset,length:430,width:b.branch==='focus'?16:32});}
   if(b.ability==='bell'){b.guard=.8;b.guardDamage=amount;bloom(p.x,p.y,175,amount*.38,spec.colour,'bellwave');const f=field('guard',p.x,p.y,54,.8,amount*.42);}
   if(b.ability==='garden'){const scale=b.branch==='wide'?.85:1,radius=b.branch==='wide'?155:115;area(target.x,target.y,radius,amount*.2*scale,spec.colour,{kind:'garden',phase:'opening'});const f=field('garden',target.x,target.y,radius,4.45,amount*.18*scale,.55);if(f)Object.assign(f,{activeLife:4,burst:amount*.3*scale,detonation:amount*.65*scale});}
   if(b.ability==='comet'){if(b.branch==='shower')for(let i=0;i<3;i++){const reach=Math.max(50,Math.min(330,s.aimDistance||210)-85)+i*85,t=World.nearest(s.world,p.x+Math.cos(angle)*reach,p.y+Math.sin(angle)*reach,20);field('comet',t.x,t.y,78,1.22+i*.18,amount*.48,.6+i*.18);}else field('comet',target.x,target.y,b.branch==='core'?84:112,1.22,amount*1.15*(b.branch==='core'?1.3:1),.6);}
   if(b.ability==='tide'){const f=field('tide',p.x,p.y,b.branch==='ebb'?285:245,.95,amount*.55,.55);if(f){f.angle=angle;for(const e of s.enemies)if(e.hp>0&&dist(e,p)<245+e.r){applyMark(e,b.branch==='deep'?6:4);if(!e.major&&!['boss','sigil'].includes(e.type)){const d=dist(e,p)||1,dir=b.branch==='ebb'?-1:1,m=Math.min(75,Math.max(0,d-65));Object.assign(e,World.move(s.world,e,e.x+(p.x-e.x)/d*m*dir,e.y+(p.y-e.y)/d*m*dir));}}area(p.x,p.y,245,amount*.3,spec.colour);}}
   if(b.ability==='clock'){const life=3.2+(b.abilityRank-1)*.4-(b.branch==='wide'?.4:0),f=field('clock',p.x,p.y,b.branch==='wide'?273:210,life+.45,amount*.5);if(f){Object.assign(f,{activeLife:life,stored:0,capacity:amount*.9});area(p.x,p.y,f.radius,amount*.2,spec.colour);}}
   const pins=b.fields.filter(f=>f.kind==='pin'&&f.age<f.life);for(const f of pins){f.life=0;area(f.x,f.y,ref('doughpin','wide')?120:90,f.damage*(ref('doughpin','wide')?.85:1),'#e4c486');}
   if(ref('doughpin','stitch')&&pins.length>1){const seen=new Set();for(let i=1;i<pins.length;i++){const a=pins[i-1],z=pins[i],angle=Math.atan2(z.y-a.y,z.x-a.x),length=dist(a,z),trace=field('stitch',a.x,a.y,0,.4);if(trace)Object.assign(trace,{angle,length,width:12});for(const e of s.enemies){if(e.hp<=0||seen.has(e.id)||!Hitboxes.swept(e,{x:a.x,y:a.y-18},{x:z.x,y:z.y-18},12))continue;seen.add(e.id);hit(e,Math.min(a.damage,z.damage)*.5,0,0,{weapon:'refinement',active:false,angle});}}}if(pins.length)cue('trap_detonate');
   for(const f of b.fields)if(s.relics?.honeycomb&&['garden','clock'].includes(f.kind)&&f.age===0&&!f.followOrigin)f.followOrigin={x:p.x,y:p.y};b.readyAt=null;readySignalled=starter()&&b.charges>0;event('specialCast',{id:b.ability,x:p.x,y:p.y,angle,achievementBank,achievementCharges});return true;
  }
  function update(dt,input){b.cooldown=Math.max(0,b.cooldown-dt*(s.relics?.bittercoffee?1.25:1));if(starter()&&b.charges<2&&b.cooldown<=0){b.charges++;b.cooldown=b.charges<2?b.cooldownMax:0;event('specialReady',{id:b.ability});readySignalled=true;}b.guard=Math.max(0,b.guard-dt);if(p.cast){p.cast.age+=dt;if(p.cast.age>=p.cast.duration)p.cast=null;}if(s.time>b.wardUntil)b.ward=0;if(input.special&&!specialHeld||input.specialPressed)cast();specialHeld=!!input.special;
   for(const f of [...b.fields]){
    if(f.life<=0)continue;if(f.followOrigin&&f.age<2){const pos=World.nearest(s.world,f.x+p.x-f.followOrigin.x,f.y+p.y-f.followOrigin.y,20);f.achievementTravel+=Math.hypot(pos.x-f.x,pos.y-f.y);f.x=pos.x;f.y=pos.y;f.followOrigin={x:p.x,y:p.y};}f.age+=dt;if(f.kind==='guard'){f.x=p.x;f.y=p.y;if(f.age>=f.life){bloom(f.x,f.y,175,f.damage,'#ecd8a0','bellwave');event('specialImpact',{id:'bell',secondary:true});}}
    if(f.kind==='spill'&&f.follow&&f.follow.hp>0&&f.age<f.life){const d=dist(f,f.follow),step=Math.min(d,85*dt);if(d>0){f.x+=(f.follow.x-f.x)/d*step;f.y+=(f.follow.y-f.y)/d*step;}}
    if(f.kind==='decoy'&&ref('feint','guard')&&(f.caught||0)<3){for(const h of s.hazards){if((f.caught||0)>=3)break;if(h.life>0&&Math.hypot(h.vx||0,h.vy||0)>0&&Math.hypot(h.x-f.x,h.y-f.y+18)<28+(h.r||0)){h.life=0;f.caught=(f.caught||0)+1;fx('spark',h.x,h.y,'#b4ded0',.5);}}}
    if(r('kindling')&&p.dash>0&&['garden','comet','spill'].includes(f.kind)&&!f.fired&&dist(f,p)<f.radius){const amount=f.detonation??f.damage*(f.kind==='comet'?1:2);f.life=0;f.fired=true;area(f.x,f.y,f.radius,amount,f.colour);cue('trap_detonate');clearShots(f.x,f.y,ref('kindling','hollow')?110:80);
     if(ref('kindling','hollow'))for(const e of s.enemies)if(e.hp>0&&ordinary(e)&&dist(e,f)<110){const d=dist(e,f)||1;Object.assign(e,World.move(s.world,e,e.x+(e.x-f.x)/d*45,e.y+(e.y-f.y)/d*45));}
     if(ref('kindling','echo')&&!b.petalsThisDash){b.petalsThisDash=true;field('petals',f.x,f.y,f.radius*.7,.8,amount*.2,.5);}
     if(ref('kindling','ember'))b.emberUntil=s.time+4;continue;}
    if(f.kind==='faultline'&&f.age>=f.delay&&!f.fired){f.fired=true;secondary(f.x,f.y,f.radius,f.damage);cue('trap_detonate');}
    if(f.kind==='petals'&&f.age>=f.delay&&!f.fired){f.fired=true;secondary(f.x,f.y,f.radius,f.damage);}
    if(f.age>=f.life&&!f.fired){if(f.kind==='spill'&&ref('spill','bloom')){f.fired=true;secondary(f.x,f.y,f.radius,f.originalDamage*.18);}if(f.kind==='decoy'&&ref('feint','burst')){f.fired=true;secondary(f.x,f.y,95,f.damage);}}
    if(f.kind==='lance'&&f.age>=f.delay&&!f.fired){f.fired=true;let hits=0;const aligned=e=>{if(Hitboxes?.custom(e))return Hitboxes.swept(e,{x:f.x,y:f.y-18},{x:f.x+Math.cos(f.angle)*f.length,y:f.y-18+Math.sin(f.angle)*f.length},f.width);const dx=e.x-f.x,dy=e.y-f.y,along=dx*Math.cos(f.angle)+dy*Math.sin(f.angle),across=Math.abs(dx*Math.sin(f.angle)-dy*Math.cos(f.angle));return along>=0&&along<=f.length&&across<f.width+(e.r||0);};for(const e of s.enemies)if(e.hp>0&&aligned(e)){mark(e);hit(e,f.damage,0,0,{weapon:'special',angle:f.angle,heavy:true,achievementEclipse:f.achievementEclipse});hits++;}const cleared=[];for(const h of s.hazards)if(h.life>0&&Math.hypot(h.vx||0,h.vy||0)>0&&aligned({...h,y:h.y+18})){h.life=0;cleared.push(h);}if(cleared.length)event('achievementChai',{cast:f.achievementCast,cleared});if(hits&&gate('lanceSound',.15))cue('lance_hit');}
    if(f.kind==='comet'&&f.age>=f.delay&&!f.fired){f.fired=true;area(f.x,f.y,f.radius,f.damage,f.colour,{kind:'comet',field:f});event('specialImpact',{id:f.impactId||'comet',secondary:f.branch==='shower'||f.impactId==='bell'});}
    if(['garden','spill'].includes(f.kind)&&f.age>=f.tick&&f.age<(f.activeLife||f.life)){f.tick+=f.kind==='spill'?.6:.8;if(f.kind==='spill')secondary(f.x,f.y,f.radius,f.damage);else area(f.x,f.y,f.radius,f.damage,f.colour,{kind:f.kind,phase:'pulse',field:f});if(f.kind==='garden')cue('briar_pulse');}
    if(f.kind==='garden'&&f.age>=f.activeLife&&!f.fired){f.fired=true;area(f.x,f.y,f.radius*(f.branch==='bloom'?.72:1),f.burst*(f.branch==='bloom'?2:1),f.colour,{kind:'garden',phase:'bloom',field:f});cue('briar_bloom');}
    if(f.kind==='tide'&&f.age>=f.delay&&!f.fired){f.fired=true;for(const e of s.enemies)if(e.hp>0&&dist(e,f)<f.radius+e.r)applyMark(e,f.branch==='deep'?6:4);area(f.x,f.y,f.radius,f.damage,f.colour);cue('undertow_return');}
    if(f.kind==='clock'&&f.age>=f.activeLife&&!f.fired){f.fired=true;area(f.x,f.y,f.radius,f.damage+f.stored,f.colour,{kind:'clock',phase:'closing',field:f});cue('time_field_close');}
   }
   b.fields=b.fields.filter(f=>f.age<f.life);
   // Announce the ready edge once, including readiness restored by a perk refund.
   if(!b.ability||(starter()?b.charges<1:b.cooldown>0))readySignalled=false;
   else if(!readySignalled&&s.status==='playing'&&!s.transition){readySignalled=true;b.readyAt=s.time;event('specialReady',{id:b.ability});}
  }
  function slow(e,projectile=false){if(!projectile&&!ordinary(e))return 1;let scale=!projectile&&e.buildChillUntil>s.time?.7:1;if(!projectile&&e.refineSlowUntil>s.time)scale=Math.min(scale,e.refineSlowScale);for(const f of b.fields){if(f.age>=f.life)continue;if((f.kind==='clock'||!projectile&&f.kind==='garden')&&f.age<(f.activeLife||f.life)&&dist(e,f)<f.radius)scale=Math.min(scale,f.kind==='clock'?.55:.65);if(!projectile&&f.kind==='pin'&&ref('doughpin','snare')&&dist(e,f)<55)scale=Math.min(scale,.75);}return scale;}
  function defend(amount){if(b.guard>0){b.guard=0;bloom(p.x,p.y,210,b.guardDamage*.85,'#ecd8a0','bellwave',{kind:'bell',phase:'counter'});clearShots(p.x,p.y,110);if(b.branch==='mercy')heal(6);if(b.branch==='fury'){const f=field('comet',p.x,p.y,210,.7,b.guardDamage*.35,.3);if(f)f.impactId='bell';}event('specialBlock');return 0;}amount*=b.keystone==='glass'?1.15:1;if(s.mastery?.wardUntil>s.time&&s.mastery.ward>0){const block=Math.min(amount,s.mastery.ward);s.mastery.ward=0;amount-=block;}const absorb=Math.min(amount,b.ward);b.ward-=absorb;return amount-absorb;}
  // Record only damage actually dealt by the main weapon, never the field's own burst.
  function record(e,dealt,impact){if(!impact.active||impact.weapon!==s.mainWeapon)return;for(const f of b.fields)if(f.kind==='clock'&&!f.fired&&f.age<f.activeLife&&dist(e,f)<f.radius+e.r)f.stored=Math.min(f.capacity,f.stored+dealt*.22);}
  function mainScale(strike,e){if(!strike.masteryPrepared){strike.masteryPrepared=true;strike.masteryScale=1;if(ref('kindling','ember')&&b.emberUntil>s.time){b.emberUntil=0;strike.masteryScale*=1.15;}if(ref('singleorigin','stride')&&strike.weapon==='espresso'){if(b.lastPour&&dist(p,b.lastPour)>=100)strike.masteryScale*=1.2;b.lastPour={x:p.x,y:p.y};}if(s.mastery?.focus>0&&s.mastery.focusUntil>s.time){s.mastery.focus--;strike.masteryScale*=1.08;}}return (strike.masteryScale||1)*(r('pilgrim')&&b.lastHitPosition&&dist(p,b.lastHitPosition)>=150?1.16:1)*(e?.buildMarkUntil>s.time?1.15:1)*(b.keystone==='duellist'?1.25:b.keystone==='precision'?(strike.clean?1.35:.88):1)*(b.reservoirUntil>s.time?1+r('reservoir')*.06:1)*(b.pursuitUntil>s.time?1+r('pursuit')*.12:1);}
  function landed(strike,e){if(e.buildMarkUntil>s.time&&r('siphon')&&gate('siphon',4))heal(r('siphon'));if(strike.buildProc)return;strike.buildProc=true;b.lastHitPosition={x:p.x,y:p.y};b.pursuitUntil=0;if(r('hookcut')&&strike.step===1&&!e.major&&!['boss','sigil'].includes(e.type)&&gate('hookcut',3)){const d=dist(e,p)||1,move=Math.min(38,Math.max(0,d-35));Object.assign(e,World.move(s.world,e,e.x+(p.x-e.x)/d*move,e.y+(p.y-e.y)/d*move));fx('spark',e.x,e.y-18,'#d6b574',.7);}if(strike.clean){if(r('conductor')&&gate('conductor',1))b.cooldown=Math.max(0,b.cooldown-.2-r('conductor')*.15);if(b.cleanUntil<s.time)b.cleanCount=0;b.cleanUntil=s.time+5;b.cleanCount++;if(b.cleanCount>=3&&r('cadence')&&gate('cadence',8)){const before=p.hp;heal(r('cadence')*2);event('achievementHealing',{kind:'congee',amount:p.hp-before});b.cleanCount=0;}}}
  function finisher(strike){if(r('cleaveguard')&&gate('cleaveguard',3)){clearShots(p.x,p.y,180);const wave=field('bellwave',p.x,p.y,180,.48);if(wave)wave.colour='#e4c486';}if(r('reckoning')&&b.reckoningUntil>s.time){b.reckoningUntil=0;bloom(strike.x,strike.y,95,strike.damage*.3,'#c78f7f');}if(r('doughpin')){const pins=b.fields.filter(f=>f.kind==='pin'&&f.age<f.life);if(pins.length>=3)pins[0].life=0;if(field('pin',strike.x+Math.cos(strike.angle)*65,strike.y+Math.sin(strike.angle)*65,22,12,strike.damage*.35))cue('blade_pin');}if(r('aftermath')&&b.castUntil>s.time){b.castUntil=0;area(strike.x,strike.y,100,r('aftermath')*.08*(b.castPower||0),'#e9d39a',{kind:'fondue'});}if(b.ability==='clock'&&b.branch==='refund'&&!b.clockRefund&&b.fields.some(f=>f.kind==='clock'&&!f.fired&&dist(p,f)<f.radius)){b.clockRefund=true;b.cooldown=Math.max(0,b.cooldown-1.5);}}
  function dodge(){if(ref('slipstream','poise')&&gate('reprise',4))b.repriseUntil=s.time+4;if(r('reckoning')&&gate('reckoning',4)){b.reckoningUntil=s.time+6;fx('ring',p.x,p.y-18,'#c78f7f',.5);}if(r('crossing')&&gate('crossing',4)){for(const e of s.enemies.filter(e=>e.hp>0&&dist(e,p)<180).sort((a,z)=>dist(a,p)-dist(z,p)).slice(0,3))applyMark(e,3);}if(r('reprisal')&&gate('reprisal',3)){const before=b.cooldown;b.cooldown=Math.max(0,b.cooldown-.5-r('reprisal')*.3);event('achievementRefund',{amount:before-b.cooldown});}if(b.keystone==='eclipse')b.starlight=s.time+6;}
  function redirect(shot){if(r('carom')&&shot.attack&&shot.type==='espresso'){const a=shot.attack,limit=ref('carom','third')?3:2;if((!a.caromShot||a.caromShot===shot.id)&&(shot.caroms||0)<limit){const range=ref('carom','reach')?360:240;let next=null,d=range;for(const e of s.enemies){const pt=Hitboxes?Hitboxes.aim(e,shot):{x:e.x,y:e.y-18},dd=Math.hypot(pt.x-shot.x,pt.y-shot.y);if(e.hp>0&&!shot.hit.has(e.id)&&dd<d){d=dd;next=pt;}}if(next){a.caromShot=shot.id;a.bankshot=true;shot.caroms=(shot.caroms||0)+1;shot.buildBounced=true;const angle=Math.atan2(next.y-shot.y,next.x-shot.x);shot.vx=Math.cos(angle)*490;shot.vy=Math.sin(angle)*490;shot.damage*=.65+r('bankshot')*.05;shot.pierce=1;shot.life=Math.max(range/490+.1,shot.life);cue('ricochet');return true;}}return false;}if(!r('bankshot')||!shot.attack||shot.type!=='espresso'||shot.attack.bankshot||shot.buildBounced)return false;let next=null,d=240;for(const e of s.enemies){const pt=Hitboxes?Hitboxes.aim(e,shot):{x:e.x,y:e.y-18},dd=Math.hypot(pt.x-shot.x,pt.y-shot.y);if(e.hp>0&&!shot.hit.has(e.id)&&dd<d){d=dd;next=e;}}if(!next)return false;shot.attack.bankshot=true;shot.buildBounced=true;const pt=Hitboxes?Hitboxes.aim(next,shot):{x:next.x,y:next.y-18},a=Math.atan2(pt.y-shot.y,pt.x-shot.x);shot.vx=Math.cos(a)*490;shot.vy=Math.sin(a)*490;shot.damage*=.3+r('bankshot')*.1;shot.pierce=1;shot.life=Math.max(.6,shot.life);cue('ricochet');return true;}
  function shotHit(shot,e){
   if(shot.secondary){if(shot.echoSlow)chill(e,.7,2);return;}
   if(shot.gilded&&!shot.marked){shot.marked=true;applyMark(e,3);}
   if(shot.outer&&ref('fanbrew','frost'))chill(e,.6,1.5);
   if(r('coldbrew')&&shot.type==='espresso'&&shot.attack&&!shot.attack.chilled){shot.attack.chilled=true;if(ordinary(e)){e.buildChillUntil=s.time+2;fx('spark',e.x,e.y-18,'#a5dbdc',.7);}}
   if(r('spill')&&shot.type==='espresso'&&shot.attack&&!shot.attack.spilled){shot.attack.spilled=true;const spills=b.fields.filter(f=>f.kind==='spill'&&f.age<f.life);if(spills.length>=3)spills[0].life=0;const f=field('spill',e.x,e.y,46*(ref('spill','wide')?1.35:1),1.8,shot.damage*.12*(ref('spill','wide')?.85:1),.3);if(f){f.originalDamage=shot.damage;if(ref('spill','follow')&&ordinary(e))f.follow=e;cue('coffee_spill');}}
   if(shot.compressed&&shot.attack){const a=shot.attack;a.piercedTargets??=new Set();a.piercedTargets.add(e.id);if(ref('singleorigin','fracture')&&!a.fractured&&a.piercedTargets.size>=2){a.fractured=true;secondary(e.x,e.y,75,shot.damage*.2,e);}
    if(ref('singleorigin','thread')&&!shot.buildBounced){shot.threadBase??=shot.damage;shot.threadHits=(shot.threadHits||0)+1;shot.damage=shot.threadBase*(1+.08*Math.min(3,shot.threadHits));}}
  }
  function opening(strike){if(strike.weapon!=='baguette'||strike.step!==1||!r('faultline'))return;const count=ref('faultline','fourth')?4:3;for(let i=0;i<count;i++){const pos=World.nearest(s.world,strike.x+Math.cos(strike.angle)*(70+i*70),strike.y+Math.sin(strike.angle)*(70+i*70),20);field('faultline',pos.x,pos.y,ref('faultline','wide')?60:42,.55+i*.12,strike.damage*.22,.18+i*.12);}}
  function sweep(strike,seen){if(strike.weapon==='baguette'&&strike.step!==3&&ref('cyclone','slow'))for(const e of s.enemies)if(seen.has(e.id))chill(e,.75,1.5);}
  function recall(shot){if(ref('returning','wide')){shot.r*=1.6;shot.damage*=.85;}if(ref('returning','cross')&&shot.origin&&dist(p,shot.origin)>=90)shot.damage*=1.35;}
  function turnCut(shot){secondary(shot.x,shot.y+18,65,shot.damage*.5);}
  function wake(echo,seen){if(echo.style==='slipstream'&&ref('slipstream','snare'))for(const e of s.enemies)if(seen.has(e.id))chill(e,.7,1.5);}
  function wakeScale(){const value=ref('slipstream','poise')&&b.repriseUntil>s.time?1.2:1;b.repriseUntil=0;return value;}
  return {wounded(){b.woundedUntil=s.time+6;},cast,update,slow,defend,record,opening,sweep,mainScale,landed,finisher,dodge,redirect,shotHit,refinement:ref,recall,turnCut,wake,wakeScale,rank:r,resetInput(){specialHeld=true;},target(e){return !e.major&&!['boss','sigil'].includes(e.type)&&b.fields.find(f=>f.kind==='decoy'&&f.age<f.life&&dist(e,f)<(ref('feint','linger')?280:230))||p;},dash(){b.petalsThisDash=false;b.pursuitUntil=s.time+1.5;if(r('feint')&&gate('feint',ref('feint','linger')?8:6)){const life=ref('feint','linger')?3:2;if(field('decoy',p.x,p.y,20,life,(api.mainDamage?.()||0)*.45))cue('decoy');fx('trail',p.x,p.y-18,'#b4ded0',1,{pose:'idle',life,decoy:true});}},speed:()=>s.time<b.speedUntil?1+r('fleet')*.08:1};
 }
 const TRAINING={
  edge:{name:'Honed Edge',max:12,description:s=>{const n=Math.min(12,s.training.edge||0),gain=((1+.6*Math.log1p((n+1)/10))/(1+.6*Math.log1p(n/10))-1)*100;return 'Main attacks, specials and merchant damage effects gain '+gain.toFixed(1)+'% damage from this rank. Smaller gains at later ranks. Maximum 12 ranks.';}},
  vigor:{name:'Long-night Supper',max:10,description:()=> 'Gain 5 maximum health and recover 12 health. Maximum 10 ranks (+50 maximum health).'},
  tempo:{name:'Practised Rhythm',max:12,description:s=>{const n=Math.min(12,s.training.tempo||0),old=1+s.passives.haste*.12+.3*n/(n+20),next=1+s.passives.haste*.12+.3*(n+1)/(n+21);return 'Main attacks and supports recover '+((1-old/next)*100).toFixed(1)+'% sooner from this rank. Does not speed up specials or dashes. Maximum 12 ranks.';}},
  soup:{name:'Midnight Soup',description:()=> 'Recover 24 health now. No permanent stat increase.'},
  charge:{name:'Running Drumsticks',description:()=> 'Restore one dash charge now. If all stored charges are full, recover 12 health instead.'},
  infusion:{name:'Four-drop Tea',description:()=> 'Remove 4 seconds from your current special recharge. If it is ready, recover 12 health instead.'},
  shell:{name:'Glass-shell Tart',description:()=> 'Your next hit deals up to 12 less damage. Expires after 60 seconds. Taking this again replaces the shield; it never stacks.'},
  harvest:{name:'Star-anise Sack',description:()=> 'Pull all loose experience stars toward you and recover 8 health. Does not create extra experience.'},
  focus:{name:'Four-cut Almonds',description:()=> 'Your next 4 main attacks deal 8% more damage. Unused attacks expire after 60 seconds. Replaces any remaining charges; never stacks.'},
  fleetmeal:{name:'Feather Meringue',description:()=> 'Move 6% faster for 60 seconds. Does not change dash distance. Taking this again refreshes the timer; never stacks.'},
  dashmeal:{name:'Clockwork Swirl',description:()=> 'Dash charges refill 10% faster for 60 seconds. No extra stored charges. Taking this again refreshes the timer; never stacks.'}
 };
 function trainingCards(s){return Object.entries(TRAINING).filter(([id,t])=>!t.max||(s.training[id]||0)<t.max).map(([id,t])=>({id,kind:'training',name:t.name,tag:t.max?'CAPPED MASTERY':'PROVISION · THIS RUN',level:(s.training[id]||0)+1,description:t.description(s),detail:t.max?'Mastery '+((s.training[id]||0)+1)+' / '+t.max:'Immediate or temporary benefit · does not use a combat slot.'}));}
 function trainingSummary(s,id){const n=s.training[id]||0,m=s.mastery||{};if(id==='edge')return 'Current total: +'+(60*Math.log1p(n/10)).toFixed(1)+'% main, special and merchant-proc damage. '+n+' / 12 ranks.';if(id==='vigor')return 'Current total: +'+(n*5)+' maximum health. '+n+' / 10 ranks.';if(id==='tempo')return 'Current total: +'+(30*n/(n+20)).toFixed(1)+'% attack recovery rate, added to foundation recovery bonuses. '+n+' / 12 ranks.';const until={shell:m.wardUntil,focus:m.focusUntil,fleetmeal:m.fleetUntil,dashmeal:m.dashUntil}[id];if(until!==undefined)return TRAINING[id].description(s)+' '+(until>s.time?'Remaining: '+Math.ceil(until-s.time)+' seconds'+(id==='focus'?', '+m.focus+' attacks':id==='shell'?', '+m.ward+' shield':'')+'.':'Effect expired.');return TRAINING[id]?.description(s)+' Received '+n+' time'+(n===1?'':'s')+'.';}
 return {ABILITIES,PERKS,REFINEMENTS,refinementCards,refinementSummary,hasRefinement,TRANSFORMATIONS,transformationAffinity,KEYSTONES,TRAINING,trainingCards,trainingSummary,SLOTS,cards,abilityCards,apply,create,rank};
});
