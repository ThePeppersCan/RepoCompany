/* Major encounters: authored patterns, locked tells, interruptible rituals and openings. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./boss-patterns.js'),require('./boss-signatures.js'),require('./kiln-encounter.js'),require('./admiral-encounter.js'),require('./briar-encounter.js'),require('./prism-encounter.js'),require('./clock-encounter.js'),require('./star-encounter.js'),require('./cantor-encounter.js'),require('./duelist-encounter.js'),require('./beekeeper-encounter.js'),require('./magistrate-encounter.js'),require('./railmaster-encounter.js'),require('./oracle-encounter.js'));else root.ROUGE_MORA_MAJORS=factory(root.ROUGE_MORA_PATTERNS,root.ROUGE_MORA_SIGNATURES,root.MOROGUE_KILN,root.MOROGUE_ADMIRAL,root.MOROGUE_BRIAR,root.MOROGUE_PRISM,root.MOROGUE_CLOCK,root.MOROGUE_STAR,root.MOROGUE_CANTOR,root.MOROGUE_DUELIST,root.MOROGUE_BEEKEEPER,root.MOROGUE_MAGISTRATE,root.MOROGUE_RAILMASTER,root.MOROGUE_ORACLE);})(globalThis,function(Patterns,Signatures,Kiln,Admiral,Briar,Prism,Clock,Star,Cantor,Duelist,Beekeeper,Magistrate,Railmaster,Oracle){
 'use strict';
 const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const move=(name,pattern,hint,phase=1)=>({name,pattern,hint,phase});
 const rows=[
  ['kiln','The Kiln Sovereign','The Furnace Court','fire','A close-range furnace duel. Bait the charge, break the braziers and punish the cooling crown.','braziers',[
   move('Crown of Heat','eye','Use the calm eye or outer edge, then leave the exploding core.'),move('Furnace Lunge','charge','Step sideways after the lane locks; stay clear of the landing blast.'),move('Three Embers','embers','Fresh embers keep marking your path. Turn without doubling back.'),move('Stoke the Crown','ritual','Break the three braziers to interrupt the furnace.'),move('Oven Doors','doors','Use the two clear aisles between the furnace lanes.',2),move('Backdraft','backdraft','Leave the inner blast, then return before the outer blast.',2),move('Raking Coals','rake','Cross behind the first rake before the second.',3),move('Last Firing','firing','Dodge the lunge, then get inside the cooling ring.',3)]],
  ['admiral','The Drowned Admiral','The Undertow Dock','flood','A fight over crossings and tides. Read the water gates, cut the anchors and turn behind a committed broadside.','anchors',[
   move('Port and Starboard','broadside','Cross the first channel; the opposite bank fires next.'),move('Anchor Cast','anchor','The anchor lands where you stood, then sends out a ring.'),move('Riptide','charge','Cross the locked current instead of running along it.'),move('Weigh Anchor','ritual','Break the anchors before the tide returns.'),move('Water Gates','gates','Two narrow crossings remain between the gates.',2),move('All Hands','crew','Clear the summoned deckhands; the Admiral is exposed.',2),move('Ebb and Flow','ebb','Follow the tide across the court, one lane at a time.',3),move('Maelstrom','maelstrom','Stay in the calm centre, then leave before it collapses.',3)]],
  ['briar','The Briar Matriarch','The Root Cathedral','root','A living garden of traps and roots. Cut seed hearts, clear the heralds and make room before the hedges close.','seed hearts',[
   move('Thorn Fan','fan','Close behind the fan or cross a gap between the thorns.'),move('Seedbed','seeds','Seeds bloom around you, then fresh roots mark your path. Keep a route out.'),move('Root Scissors','scissors','Two branches close in sequence. Cross after the first.'),move('The Heartwood','ritual','Cut the seed hearts to expose the heartwood.'),move('Garden Keepers','gardeners','Clear the two heralds before their garden fills.',2),move('Closing Hedge','hedge','The central cross stays clear while the corners bloom.',2),move('Thorn Spiral','spiral','Follow the gaps around the stem; each spoke is delayed.',3),move('Season of Thorns','season','Move out of the seed ring, then back through its empty centre.',3)]],
  ['prism','The Prism Curator','The Hall of Reflections','frost','A precise duel with reflections. Read the real sight lines, shatter the prisms and use the spaces behind the beams.','prisms',[
   move('Split Light','cross','Stand between the four locked beams.'),move('Looking Glass','mirrors','Reflections arrive on marked pedestals. Clear them.'),move('Silver Needle','needle','A thin sight line locks before the three-beat beam.'),move('The Exhibition','ritual','Shatter the three prisms to break the exhibition.'),move('Refraction','refraction','The second cross turns forty-five degrees. Change quadrants.',2),move('Glass Steps','steps','Three successive mirrors remember your path.',2),move('Broken Gallery','gallery','Move through the central aisle before the side galleries flash.',3),move('Perfect Reflection','reflection','Dodge the needle, then cross into the gaps of the prism star.',3)]],
  ['clock','The First Clock','The Unwound Belfry','ash','A duel in three beats. Watch the hands, break the hourglasses and strike during the long silence.','hourglasses',[
   move('The Long Hand','hand','Cross the first locked hand, then avoid the second hand to its side.'),move('Second Thoughts','memory','Two echoes strike the same remembered place. Do not return early.'),move('Pendulum','pendulum','Left, then right. Move behind the passing pendulum.'),move('Borrowed Time','ritual','Break the hourglasses to stop the clock.'),move('Three Chimes','chimes','Inner, outer, inner. Move to the safe half on each beat.',2),move('Lost Seconds','seconds','Quick spokes alternate with a delayed cross.',2),move('Midnight Appointment','appointment','Three marked lanes strike on different beats.',3),move('The Thirteenth Hour','thirteenth','Count the three widening rings, then punish the silence.',3)]],
  ['star','The Hollow Star','The Starless Observatory','eclipse','An orbital fight around a fallen star. Collapse satellites, dodge the comet and hold the safe eye through the eclipse.','satellites',[
   move('Falling Constellation','constellation','Four stars strike the court while fresh marks follow your path. Keep moving.'),move('Cometfall','charge','Step off the locked comet lane and stay clear of its landing burst.'),move('Event Horizon','horizon','Use the safe eye or outer edge, then escape the collapsing core.'),move('Orbital Collapse','ritual','Break the satellites to collapse the orbit.'),move('Twin Moons','moons','Use the gaps between the halos, then leave your marked position.',2),move('Star Shepherds','shepherds','Clear the two wisps of glass before the next orbit.',2),move('Night Meridian','meridian','Cross one meridian, then move between the turning spokes.',3),move('Total Eclipse','eclipse','Hold the eye through the outer burst, then dash out of the core.',3)]]
 ];
 const BOSSES=Object.fromEntries(rows.map(([id,name,arena,theme,description,objects,moves],i)=>[id,{id,name,arena,theme,description,objects,moves,variant:30+i,counterplay:moves[3].hint+' Four finishers or dash strikes prepare a stagger after the attack ends.'}]));
 const TEMPO=1.5;
 for(const spec of Patterns.bosses)BOSSES[spec.id]={...spec,variant:36+Patterns.bosses.indexOf(spec)};
 for(const [id,moves]of Object.entries(Patterns.additions))BOSSES[id].moves.push(...moves);
 const identities={
  kiln:{signature:'Vent control',goal:'QUENCH VENTS',objects:'furnace vents',counterplay:'Three vents ignite separate furnace lanes. Break a vent to cancel its lane; quench all three to crack the crown.',description:'An aggressive furnace duel. Control which lanes burn, sidestep the lunge and punish the cooling crown.'},
  admiral:{signature:'The chain rider',goal:'CUT ANCHORS',objects:'tide anchors',counterplay:'Two anchors sustain separate broadsides. Cut them to stop the current. Run against the arrows or dash across the tide.',description:'Bait his thrown anchor onto a mooring post, then press Interact to ride the chain. Attack two of three exposed-joint windows to tear off a leg; up to two can be lost. Riding is optional. Walk with the dry passage during the huge surge.'},
  briar:{signature:'Growing heartwood',goal:'CUT THE HEART',objects:'seed heart',counterplay:'Cut the seed heart to wither its thicket. Dodge the hunting faces, then strike them while pinned. At 25% health she becomes the Living Cathedral. Approach and sever all three gripping roots, then destroy her exposed heartwood. She stays giant until defeated.',description:'Her living garden, seed hearts and old attacks remain. Hunting branch faces interrupt her crawl; the final quarter unfolds into a lasting cathedral battle. Severing each tougher root tears away part of her remaining health and releases that side.'},
  prism:{signature:'Truth and reflections',goal:'SHATTER LIT PRISM',objects:'ordered prisms',counterplay:'Only the lit prism is vulnerable. Break them in numbered order. Solid beams hurt; faint dashed reflections are harmless.',description:'A duel of real and false light. Read solid beams, disregard dashed decoys and shatter the lit prism in a changing sequence.'},
  clock:{signature:'Footstep echoes',goal:'ERASE ECHOES',objects:'hourglasses',counterplay:'The Clock replays your earlier footsteps. Leave numbered echoes behind; break hourglasses to erase their remembered blasts.',description:'A battle against your own route. Remember where you have been, count delayed chimes and cross behind the clock hands.'},
  star:{signature:'Gravity and orbit',goal:'COLLAPSE SATELLITES',objects:'orbiting satellites',counterplay:'Four satellites orbit while gravity pulls inward. Dashing breaks the pull. Collapse the orbit or escape the eclipse through its safe eye.',description:'An orbital duel. Fight the inward pull, intercept moving satellites and parry or dodge crossing comets.'}
 };
 for(const [id,identity]of Object.entries(identities)){Object.assign(BOSSES[id],identity);BOSSES[id].moves[3].hint=identity.counterplay;}
 BOSSES.admiral.moves[2]={...BOSSES.admiral.moves[2],pattern:'undertow',hint:'The current pushes sideways. Cross successive tide lanes or dash against the pull.'};
 BOSSES.prism.moves[1].hint='Only solid light hurts. Ignore the faint dashed reflections.';
 BOSSES.clock.moves[1].hint='Your recent footsteps are numbered. Leave their echoes; do not double back.';
 BOSSES.clock.moves[7].hint='The twelve hands strike clockwise. Follow behind them, then punish the silence.';
 BOSSES.star.moves[1]={...BOSSES.star.moves[1],pattern:'comet',hint:'Three crossing comets follow locked sight lines. Dodge across them or cut them out of the air.'};
 for(const [id,name,pattern,hint]of [
  ['kiln','Bellows Run','bellows','Flame sweeps across alternating lanes. Cross behind each extinguished jet.'],
  ['admiral','Keelhaul','keelhaul','The current reverses halfway through. Keep off the central chain lane.'],
  ['briar','Thorn Cage','cage','The roots form a broken cage. Escape through its open corner before the heart blooms.'],
  ['prism','Banked Light','banked','The beam bounces off the far wall. Read both halves of the reflected path.'],
  ['clock','Rewind','rewind','Your trail plays backwards. Do not retreat along the route you just used.'],
  ['star','Slingshot','slingshot','Gravity pushes outward this time. Move toward the centre to avoid the outer blast.']
 ])BOSSES[id].moves.push(move(name,pattern,hint,2));
 Signatures.configure(BOSSES);
 Kiln.configure(BOSSES.kiln);Oracle?.configure(BOSSES.oracle);
 Object.assign(BOSSES.prism,{signature:'Mirror pursuit and the escaped reflection',description:'He hunts through dark mirrors. Walk through the pale paired entrances to emerge behind him and strike exposed glass joints. In the last phase, his colossal reflection breaks through the rear wall; bait its hand towards the Curator, then leave the marked fracture.',counterplay:'Solid beams hurt; faint dashed decoys do not. Break the lit ritual prisms in order. The pale mirrors activate by walking through them. Bait the giant reflection into cracking the original body, then attack its exposed joints.'});
 Object.assign(BOSSES.clock,{signature:'The breaking minute',description:'An unblinking wading bird carries a working clock in its throat. In its final phase the floor opens into a vast mechanism. Ride the broad minute hand while the bird stalks the rim, then strike its exposed throat-clock.',counterplay:'Keep numbered echoes behind you and break hourglasses. On the hand, move inward or outward to evade the marked beak strikes. Return to the centre before the tip folds, cross away from the marked sweeps and dodge falling cogs while the hand rebuilds.'});
 Object.assign(BOSSES.star,{signature:'The dying shadow',description:'A contorted parasite orbits its prey while feeding on a dying star. Follow its moving shadow through eruptions. In the final phase the observatory falls into a galaxy of ten worlds.',counterplay:'Hold a direction and dash to leap to the marked neighbouring world. Pale worlds endure; ember worlds heat up; fractured worlds crumble after you land. In the finale, aim at the drifting core from any island and attack when it settles. The creature hunts independently; its body is protected. Falls cost one ordinary hit and return you to safety.'});
 Object.assign(BOSSES.beekeeper,{signature:'The Unravelling',goal:'OUTRUN THE SWARM',description:'A swarm wearing a ruined keeper. In its final act it tears him apart, briefly forms a colossal wasp, then hunts you through a collapsing hive causeway.',counterplay:'At one third health, run the lit course. Dodge swinging combs and falling masonry; attack wax barriers and brood sacs to briefly slow the pursuing swarm—it never stops. Your first catch leaves you badly wounded and releases you; a second catch is fatal. Reach the far arch and finish the pinned hive heart.'});
 Object.assign(BOSSES.railmaster,{signature:'The last carriage',goal:'BREAK THE PRESSURE VALVES',description:'A possessed locomotive swallows you into its living carriage. Creatures batter the panoramic windows while the walls, ceiling and floor attack.',counterplay:'At one third health the train swallows you. Survive each window breach, then break its glowing pressure valve during a release. The windows stay smashed open and flyers keep coming, with at most fifteen intruders active. Breaking both valves starts three engine pressure releases: strike the heart when it glows. Every machinery attack gives a locked warning.'});
 function objectLayout(b,spec){
  let points=Patterns.layout(spec.id)|| (spec.id==='admiral'?[[430,455],[1100,705]]:spec.id==='briar'?[[768,582]]:spec.id==='star'?Array.from({length:4},(_,i)=>[768+Math.cos(i*TAU/4)*265,582+Math.sin(i*TAU/4)*135]):[[400,470],[768,715],[1136,470]]);
  if(spec.id==='clock'&&b.memory?.length>8){const path=[b.memory[0],b.memory[Math.floor(b.memory.length/2)],b.memory.at(-1)];if(path.every((p,i)=>path.every((q,j)=>i===j||Math.hypot(p.x-q.x,p.y-q.y)>140)))points=path.map(p=>[p.x,p.y]);}
  return points.map(([x,y],i)=>({x:clamp(x,240,1295),y:clamp(y,385,785),share:spec.id==='briar'?6:3/points.length,label:String(i+1),orbit:spec.id==='star'?i*TAU/4:null}));
 }
 function contains(z,p,margin=0){
  if(z.cantorSweep){const q=Cantor.Fight.sample(z);return Math.hypot(p.x-q.x,p.y-q.y)<=q.r+margin;}
  if(z.starEruption||z.starMeteor)return Star.Fight.contains(z,p,margin);
  if(z.clockHandAttack||z.clockRefuge)return Clock.Fight.attackContains(z,p,margin);
  if(z.prismFlood)return Prism.Fight.floodContains(z,p,margin);
  if(z.clockGear)return Clock.Fight.fieldContains(z,p,margin);
  if(z.safe&&Math.hypot(p.x-z.safe.x,p.y-z.safe.y)<=Math.max(0,z.safe.r-margin))return false;
  if(z.admiralGap){const gap=Admiral.Fight.gap(z);return p.x>=z.x-margin&&p.x<=z.x+z.length+margin&&p.y>=gap.top-margin&&p.y<=gap.bottom+margin&&(p.x<gap.left+margin||p.x>gap.right-margin);}
  z=Patterns.sample(z);const dx=p.x-z.x,dy=p.y-z.y,d=Math.hypot(dx,dy);
  if(z.shape==='arc'){const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-z.angle),Math.cos(Math.atan2(dy,dx)-z.angle));return d<=z.r+margin&&d>=Math.max(0,z.inner-margin)&&Math.abs(delta)<=z.arc/2+margin/Math.max(30,d);}
  if(z.shape==='line'){const a=z.angle||0,along=dx*Math.cos(a)+dy*Math.sin(a),across=-dx*Math.sin(a)+dy*Math.cos(a);return along>=-margin&&along<=z.length+margin&&Math.abs(across)<=z.width/2+margin;}
  if(z.shape==='ring')return d<=z.r+margin&&d>=Math.max(0,z.inner-margin);
  return d<=z.r+margin;
 }
 function plan(id,pattern,b,p,phase=1,serial=0){
  const out=[],angle=Math.atan2(p.y-b.y,p.x-b.x),cx=768,cy=582;
  const circle=(x,y,r,delay=1.15,duration=.35)=>out.push({shape:'circle',x:clamp(x,205,1330),y:clamp(y,360,805),r,delay,duration});
  const ring=(x,y,inner,r,delay=1.35,duration=.35)=>out.push({shape:'ring',x,y,inner,r,delay,duration});
  const line=(x,y,a,length,width,delay=1.25,duration=.3)=>out.push({shape:'line',x,y,angle:a,length,width,delay,duration});
  const cross=(a,delay,width=42)=>{for(let i=0;i<4;i++)line(b.x,b.y,a+i*TAU/4,1300,width,delay);};
  const spokes=(n,delay,offset=0,step=0)=>{for(let i=0;i<n;i++)line(b.x,b.y,offset+i*TAU/n,470,30,delay+i*step);};
  let charge=null,summons=null,ritual=false,field=null,projectiles=[],motions=[];
  const authored=(id==='kiln'&&Kiln.plan(pattern,b,p))||(id==='oracle'&&Oracle?.plan(pattern,b,p))||Patterns.plan(id,pattern,b,p,phase,serial,objectLayout(b,BOSSES[id]));
  if(authored){out.push(...authored.zones);({charge,summons,ritual,field,projectiles,motions}=authored);}
  else switch(pattern){
   case 'eye':ring(b.x,b.y,100,285,1.25,.55);circle(b.x,b.y,118,2.65,.45);break;
   case 'charge':case 'firing': {const length=Math.min(640,Math.hypot(p.x-b.x,p.y-b.y)+115);line(b.x,b.y,angle,length,76,1.1,.5);charge={x:b.x,y:b.y,angle,length,start:1.1,duration:.5};const ex=clamp(b.x+Math.cos(angle)*length,215,1320),ey=clamp(b.y+Math.sin(angle)*length,370,790);if(pattern==='firing')ring(ex,ey,105,255,2.4,.5);else circle(ex,ey,id==='star'?115:95,2.35,.4);break;}
   case 'embers':for(let i=-1;i<=1;i++)circle(p.x+i*125,p.y+(i===0?0:55),68,1.1+Math.abs(i)*.4,.55);break;
   case 'ritual':{
    ritual=true;const points=objectLayout(b,BOSSES[id]);
    const linked=(index,fn)=>{const start=out.length;fn();for(let n=start;n<out.length;n++)out[n].objectIndex=index;};
    if(id==='kiln')points.forEach((pt,i)=>linked(i,()=>line(pt.x,335,Math.PI/2,495,150,4.2+i,4)));
    else if(id==='admiral'){field={kind:'current',x:serial%2?62:-62,y:0,start:1.4,end:9.4};points.forEach((pt,i)=>linked(i,()=>{for(let n=0;n<3;n++)line(i?1335:200,425+i*160+n*32,i?Math.PI:0,1140,28,3.6+n*1.6,.65);}));}
    else if(id==='briar')linked(0,()=>{for(const x of [380,1156])for(const y of [400,770])circle(x,y,155,2.5,6.5);for(let i=0;i<4;i++)line(cx,cy,i*TAU/4+.45,580,62,4.3+i*.45,4.5);});
    else if(id==='prism')points.forEach((pt,i)=>linked(i,()=>line(pt.x,pt.y,Math.atan2(p.y-pt.y,p.x-pt.x),1200,58,6.2+i*1.6,.7)));
    else if(id==='clock')points.forEach((pt,i)=>linked(i,()=>{circle(pt.x,pt.y,112,3+i*1.5,.4);out.at(-1).echo=i+1;circle(pt.x,pt.y,145,4.2+i*1.5,.4);out.at(-1).echo=i+1;}));
    else {field={kind:'gravity',x:cx,y:cy,strength:55,start:1.2,end:10.5};ring(cx,cy,180,350,5.2,1.3);circle(cx,cy,150,8.5,.6);}
    break;
   }
   case 'doors':for(const x of [310,635,960])line(x,335,Math.PI/2,495,120,1.6);break;
   case 'backdraft':circle(b.x,b.y,130,1.05);ring(b.x,b.y,155,285,2.3);break;
   case 'rake':line(205,430,.12,1100,66,1.15);line(1330,730,Math.PI+.12,1100,66,2.15);break;
   case 'broadside':for(let i=0;i<3;i++){line(190,375+i*170,0,1150,46,1.25);line(1340,460+i*130,Math.PI,1150,38,2.2);}break;
   case 'anchor':circle(p.x,p.y,78);ring(p.x,p.y,108,218,2.4);break;
   case 'gates':for(const x of [260,695,1130])line(x,335,Math.PI/2,495,132,1.6);break;
   case 'undertow':field={kind:'current',x:serial%2?62:-62,y:0,start:1.2,end:4.8};for(let i=0;i<3;i++)line(350+i*350,335,Math.PI/2,495,130,1.5+i*.8,.8);break;
   case 'crew':summons=['watchman','courier','watchman'];break;
   case 'ebb':for(let i=0;i<5;i++)line(270+i*225,335,Math.PI/2,495,105,1.2+i*.55);break;
   case 'maelstrom':ring(cx,cy,165,690,1.7,.65);circle(cx,cy,135,3.1);break;
   case 'fan':for(let i=-2;i<=2;i++)line(b.x,b.y,angle+i*.39,500,26,1.3);break;
   case 'seeds':for(let i=0;i<3;i++)circle(p.x+Math.cos(i*TAU/3)*105,p.y+Math.sin(i*TAU/3)*85,62,1.15+i*.3,.65);circle(p.x,p.y,85,2.8,.5);break;
   case 'scissors':line(300,340,.36,1030,55,1.25);line(1230,340,Math.PI-.36,1030,55,2.1);break;
   case 'gardeners':summons=['herald','herald'];break;
   case 'hedge':for(const x of [390,1145])for(const y of [400,760])circle(x,y,140,1.65,.85);break;
   case 'spiral':spokes(8,1.3,serial*.23,.25);break;
   case 'season':for(let i=0;i<6;i++)circle(p.x+Math.cos(i*TAU/6)*170,p.y+Math.sin(i*TAU/6)*135,54,1.5);circle(p.x,p.y,80,2.8);break;
   case 'cross':cross(angle+.3,1.35);break;
   case 'mirrors':{const real=serial%3;for(let i=0;i<3;i++){const x=380+i*388,y=i===1?750:405;line(x,y,Math.atan2(p.y-y,p.x-x),1200,46,1.65,.7);Object.assign(out.at(-1),{decoy:i!==real,warningOnly:i!==real,mirror:true});}break;}
   case 'needle':for(let i=0;i<3;i++)line(b.x,b.y,angle,1300,34,1.1+i*.48);break;
   case 'refraction':cross(.1,1.25);cross(Math.PI/4+.1,2.45);break;
   case 'steps':for(let i=0;i<3;i++)circle(p.x+(serial%2?1:-1)*i*125,p.y+(i%2?70:-40),63,1.15+i*.65);break;
   case 'gallery':for(const x of [300,480,1050,1230])line(x,335,Math.PI/2,495,80,1.5);line(190,580,0,1160,45,2.6);break;
   case 'reflection':line(b.x,b.y,angle,1300,45,1.2);spokes(6,2.5,angle+.3);break;
   case 'hand':line(b.x,b.y,angle,1300,90,1.35);line(b.x,b.y,angle+.55,1300,78,2.65);break;
   case 'memory':{const history=b.memory?.length?b.memory:[p],n=Math.min(6,history.length);for(let i=0;i<n;i++){const pt=history[Math.floor(i*(history.length-1)/Math.max(1,n-1))];circle(pt.x,pt.y,78,1.25+i*.6,.35);out.at(-1).echo=i+1;}break;}
   case 'pendulum':line(240,380,.27,1120,90,1.3);line(1300,380,Math.PI-.27,1120,90,2.65);break;
   case 'chimes':circle(b.x,b.y,135,1.35);ring(b.x,b.y,170,300,2.5);circle(b.x,b.y,135,3.75);break;
   case 'seconds':spokes(6,1.05,angle+.2);cross(angle+.45,2.75,52);break;
   case 'appointment':for(let i=-1;i<=1;i++)line(b.x,b.y,angle+i*.3,1300,48,1.2+(i+1)*.62);break;
   case 'thirteenth':for(let i=0;i<12;i++)line(cx,cy,-Math.PI/2+i*TAU/12,650,35,1.2+i*.32,.22);break;
   case 'constellation':for(let i=0;i<4;i++)circle(cx+Math.cos(i*TAU/4+.4)*360,cy+Math.sin(i*TAU/4+.4)*165,95,1.25+i*.35,.55);circle(p.x,p.y,95,2.8,.5);break;
   case 'horizon':ring(b.x,b.y,120,320,1.35,.65);circle(b.x,b.y,140,2.9,.5);break;
   case 'comet':for(const [i,pt]of [[0,{x:220,y:370}],[1,{x:1320,y:420}],[2,{x:1000,y:790}]]){const a=Math.atan2(p.y-pt.y,p.x-pt.x),start=1.25+i*.5;line(pt.x,pt.y,a,1250,26,start,.1);Object.assign(out.at(-1),{warningOnly:true,comet:true});projectiles.push({...pt,angle:a,start,speed:330});}break;
   case 'bellows':for(let i=0;i<5;i++)line(i%2?1330:205,395+i*83,i%2?Math.PI:0,1125,52,1.3+i*.65,.6);break;
   case 'keelhaul':field={kind:'current',x:serial%2?75:-75,y:0,start:1.2,end:4.9,reverse:2.9};line(cx,335,Math.PI/2,495,85,1.6,2.8);line(205,430,0,1130,50,3.2,.6);break;
   case 'cage':line(p.x-165,p.y-105,0,330,36,1.4,1.6);line(p.x-165,p.y+105,0,330,36,1.4,1.6);line(p.x-165,p.y-105,Math.PI/2,135,36,1.4,1.6);line(p.x+165,p.y-30,Math.PI/2,135,36,1.4,1.6);circle(p.x,p.y,112,3.3,.45);break;
   case 'banked':{const x=serial%2?1325:210,y=clamp(p.y-95,380,770),a=Math.atan2(y-b.y,x-b.x);line(b.x,b.y,a,Math.hypot(x-b.x,y-b.y),50,1.4,.45);line(x,y,Math.atan2(p.y-y,p.x-x),1250,50,2.2,.45);break;}
   case 'rewind':{const trail=b.memory?.length?[...b.memory].reverse():[p];for(let i=0;i<5;i++){const pt=trail[Math.floor(i*(trail.length-1)/4)];circle(pt.x,pt.y,84,1.2+i*.65,.4);out.at(-1).echo=5-i;}break;}
   case 'slingshot':field={kind:'gravity',x:cx,y:cy,strength:-60,start:1.2,end:4};ring(cx,cy,190,720,2.1,1.2);break;
   case 'moons':for(const x of [525,1010])ring(x,cy,105,235,1.5,.65);circle(p.x,p.y,90,2.9,.55);break;
   case 'shepherds':summons=['mirror','wisp','mirror','wisp'];break;
   case 'meridian':line(cx,335,Math.PI/2,495,90,1.15);spokes(6,2.45,serial*.4);break;
   case 'eclipse':ring(cx,cy,165,700,1.75,.8);circle(cx,cy,135,3.2,.5);break;
   default:throw new Error('Unknown major pattern '+pattern);
  }
  if(id==='admiral'&&['gates','ebb','maelstrom'].includes(pattern))field={kind:'current',x:serial%2?62:-62,y:0,start:1.2,end:4.3};
  if(id==='star'&&['horizon','moons','eclipse'].includes(pattern))field={kind:'gravity',x:cx,y:cy,strength:55,start:1.1,end:4.1};
  // Fresh marks have their own full tell; later beats never track after locking.
  const tracking=['embers','seeds','steps','constellation'].includes(pattern)?[{at:1.15,delay:1.1,r:72},{at:2.35,delay:1.1,r:82}]:[];
  const baseDuration=Math.max(ritual?(id==='prism'?11.2:10.5):1.8,summons?6.5:0,field?.end||0,projectiles.length?5.2:0,...motions.map(m=>m.start+m.duration+.4),...out.map(z=>z.delay+z.duration),...tracking.map(z=>z.at+z.delay+.45));
  // Another 20% faster than the previous release; fresh tells remain readable.
  for(const z of out){z.delay=Math.max(.78,z.delay/TEMPO);z.duration/=TEMPO;}
  for(const z of tracking){z.at/=TEMPO;z.delay=Math.max(.78,z.delay/TEMPO);}
  for(const bolt of projectiles){bolt.start=Math.max(.78,bolt.start/TEMPO);bolt.speed*=TEMPO;}
  for(const motion of motions){motion.start=Math.max(.78,motion.start/TEMPO);motion.duration/=TEMPO;}
  if(charge){charge.start/=TEMPO;charge.duration/=TEMPO;}if(field){field.start/=TEMPO;field.end/=TEMPO;if(field.reverse)field.reverse/=TEMPO;}
  return Signatures.amend({zones:out,motions,charge,summons,ritual,tracking,field,projectiles,duration:Math.max(baseDuration/TEMPO,...motions.map(m=>m.start+m.duration+.4),...out.map(z=>z.delay+z.duration),...tracking.map(z=>z.at+z.delay+.45))},id,pattern,b,p,serial);
 }
 // Hollow Star budgets: .34*.9, .33*.9, .33 of its original health.
 // Keep the finale intact and use the same boundaries for overkill and counters.
 function phaseFloor(b){if(b.bossType==='star')return (b.starBaseHp||b.maxHp)*(b.phase===1?.627:b.phase===2?.33:0);return b.phase===1?b.maxHp*.66:b.phase===2?b.maxHp*.33:0;}
 function begin(b){if(b.bossType==='oracle'){b.oracleBaseHp=b.maxHp;b.hp=b.maxHp=b.oracleBaseHp*1.06;}if(b.bossType==='star'){b.starBaseHp=b.maxHp;b.hp=b.maxHp=b.starBaseHp*.933;}b.major=true;b.phase=1;b.majorState='intro';b.majorClock=2;b.majorMove=null;b.majorSerial=0;b.majorDeck=[];b.seenMoves=new Set();b.stagger=0;b.staggerLock=0;b.staggerReady=false;b.opening=0;b.ritualIds=[];b.majorDamageScale=1;b.phasePending=false;b.completedMoves=0;b.ritualCounters=0;b.memory=[];b.memoryClock=0;b.ritualProgress=0;b.ritualCount=0;b.hint='Watch the whole sequence. Punish the recovery.';}
 function damageScale(b){if(b.bossType==='briar'){const scale=Briar.Fight.damageScale(b);if(scale!=null)return scale;}if(b.bossType==='magistrate'){const scale=Magistrate.Fight.damageScale(b);if(scale!=null)return scale;}if(b.bossType==='beekeeper'){const scale=Beekeeper.Fight.damageScale(b);if(scale!=null)return scale;}if(b.bossType==='railmaster'){const scale=Railmaster.Fight.damageScale(b);if(scale!=null)return scale;}if(b.bossType==='cantor'){const scale=Cantor.Fight?.damageScale(b);if(scale!=null)return scale;}if(b.bossType==='star'&&b.starFight?.active?.kind==='galaxy')return b.opening||0;return ['intro','phase','starreveal'].includes(b.majorState)||b.phasePending||b.bossType==='prism'&&b.sealed?0:b.majorState==='ritual'?.18:b.opening||.58;}
 function damage(b,amount){
  const scale=damageScale(b);if(!scale)return 0;
  // A phase boundary absorbs overkill, visibly locks the health bar, and lets the
  // already-marked sequence finish. Burst cannot delete the next health phase.
  const floor=Math.max(b.bossType==='magistrate'?Magistrate.Fight.floor(b):0,b.bossType==='briar'?Briar.Fight.floor(b):0,b.bossType==='beekeeper'&&(b.beeFight||b.phase>=3)?Beekeeper.Fight.floor(b):b.bossType==='railmaster'?Railmaster.Fight.floor(b):b.bossType==='duelist'?Duelist.Fight.floor(b):b.bossType==='cantor'?Cantor.Fight?.damageFloor(b)||0:0,b.bossType==='oracle'&&Oracle?Oracle.floor(b):phaseFloor(b)),applied=Math.min(amount*scale,Math.max(0,b.hp-floor));
  if(b.phase<(b.bossType==='oracle'&&Oracle?4:3)&&b.hp-applied<=floor+1e-6)b.phasePending=true;
  return applied;
 }
 function clear(b,api){api.clear(b.id);b.ritualIds=[];b.majorPlan=null;b.charge=0;b.motionLift=0;b.motionKind=null;}
 function opening(b,seconds,api,stagger=false){clear(b,api);b.majorState=stagger?'stagger':'recovery';b.majorClock=seconds/TEMPO;b.opening=stagger?1.8:1.5;b.hint=stagger?'STAGGERED · commit your strongest combo.':'OPENING · strike while the boss recovers.';b.telegraph=0;}
 function stagger(b,strike,api){
  if(b.inkFight||b.briarFight?.active?.kind==='cathedral')return;if(!b.major||['intro','phase','ritual','stagger'].includes(b.majorState)||b.phasePending||b.staggerLock>0||b.staggerReady||!(strike.finisher||strike.dash)||b.hp<=0)return;
  strike.majorHits??=new Set();if(strike.majorHits.has(b.id))return;strike.majorHits.add(b.id);b.stagger=Math.min(4,b.stagger+1);
  if(b.stagger>=4){b.staggerReady=true;if(b.majorState==='recovery')releaseStagger(b,api);}
 }
 function releaseStagger(b,api){b.stagger=0;b.staggerReady=false;b.staggerLock=13;opening(b,2.35,api,true);api.recovery?.(b,'phase:'+Math.min(b.phase,3));api.event('majorStagger',{name:b.bossName});}
 function update(b,dt,p,api){
  if(b.bossType==='magistrate'&&Magistrate.Fight.update(b,dt,p,api))return;
  if(b.bossType==='beekeeper'&&Beekeeper.Fight.update(b,dt,p,api))return;
  if(b.bossType==='railmaster'&&Railmaster.Fight.update(b,dt,p,api))return;
  if(b.bossType==='duelist'&&Duelist.Fight.update(b,dt,p,api))return;
  if(b.bossType==='cantor'&&Cantor.Fight?.update(b,dt,p,api))return;
  if(b.bossType==='star'&&Star.Fight?.update(b,dt,p,api))return;
  if(b.bossType==='clock'&&Clock.Fight?.update(b,dt,p,api))return;
  if(b.bossType==='prism'&&Prism.Fight?.update(b,dt,p,api))return;
  if(b.bossType==='briar'&&Briar.Fight.update(b,dt,p,api))return;
  b.memoryClock-=dt;if(b.memoryClock<=0){b.memoryClock=.2;b.memory.push({x:p.x,y:p.y});if(b.memory.length>24)b.memory.shift();}
  b.staggerLock=Math.max(0,b.staggerLock-dt);b.majorClock-=dt;b.telegraph=0;
  const phase=b.bossType==='oracle'&&Oracle?Oracle.healthPhase(b):b.bossType==='star'?b.hp>(b.starBaseHp||b.maxHp)*.627+1e-6?1:b.hp>(b.starBaseHp||b.maxHp)*.33+1e-6?2:3:b.hp>b.maxHp*.66+1e-6?1:b.hp>b.maxHp*.33+1e-6?2:3;
  if(phase>b.phase)b.phasePending=true;
  if(b.phasePending&&(!['action','ritual'].includes(b.majorState)||b.majorClock<=0)){
   b.phase=Math.min(b.bossType==='oracle'&&Oracle?4:3,b.phase+1);b.phasePending=false;clear(b,api);b.majorState='phase';b.majorClock=b.bossType==='oracle'&&Oracle?Oracle.durations[b.phase-1]:1.25;b.opening=0;b.stagger=0;b.staggerReady=false;b.staggerLock=Math.max(b.staggerLock,3);b.hint='A new phase. Watch the next sequence.';b.majorDeck=[];b.forceMove=b.bossType==='oracle'&&Oracle?Oracle.firstMove(BOSSES.oracle,b.phase):BOSSES[b.bossType].moves[b.phase===2?4:7];api.event('bossPhase',{id:b.bossType,name:b.bossName,phase:b.phase});
  }
  if(b.majorState==='ritual'){
   b.ritualProgress=b.ritualIds.filter(id=>!api.alive(id)).length;
   if(b.bossType==='prism'){const order=b.ritualOrder||b.ritualIds,active=order.find(id=>api.alive(id));order.forEach((id,i)=>api.objectState?.(id,{sealed:id!==active,label:String(i+1),lit:id===active}));}
   if(b.ritualIds.length&&b.ritualIds.every(id=>!api.alive(id))){b.ritualCounters++;const floor=Math.max(b.bossType==='briar'?Briar.Fight.floor(b):1,b.bossType==='oracle'&&Oracle?Math.max(1,Oracle.floor(b)):Math.max(1,phaseFloor(b)));b.hp=Math.max(floor,b.hp-(b.starBaseHp||b.maxHp)*.08);if(b.phase<(b.bossType==='oracle'&&Oracle?4:3)&&b.hp<=floor+1e-6)b.phasePending=true;b.stagger=0;b.staggerReady=false;opening(b,3.4,api,true);b.staggerLock=10;api.recovery?.(b,'phase:'+Math.min(b.phase,3));api.event('majorCounter',{name:b.bossName});return;}
  }
  if(['action','ritual'].includes(b.majorState)){
   Signatures.update(b,dt,p,api);
   const q=b.majorPlan,age=q.duration-b.majorClock,c=q.charge;b.telegraph=age<1.15/TEMPO?1.15/TEMPO-age:0;
   if(c&&age>=c.start&&age<=c.start+c.duration){const f=clamp((age-c.start)/c.duration,0,1);b.x=clamp(c.x+Math.cos(c.angle)*c.length*f,215,1320);b.y=clamp(c.y+Math.sin(c.angle)*c.length*f,370,790);b.charge=.05;b.aimX=Math.cos(c.angle);b.aimY=Math.sin(c.angle);}else b.charge=0;
   b.motionLift=0;b.motionKind=null;
   for(const m of q.motions||[])if(age>=m.start&&!m.done){if(!m.started){m.started=true;api.event('bossMotion',{id:b.bossType,pattern:b.majorMove.pattern,kind:m.kind});}const f=clamp((age-m.start)/m.duration,0,1);b.x=m.from.x+(m.to.x-m.from.x)*f;b.y=m.from.y+(m.to.y-m.from.y)*f;b.motionLift=Math.sin(f*Math.PI)*m.height;b.motionKind=m.kind;b.motionProgress=f;b.charge=.05;b.aimX=m.to.x-m.from.x;b.aimY=m.to.y-m.from.y;if(f>=1){m.done=true;api.event('bossLanding',{id:b.bossType,pattern:b.majorMove.pattern,x:b.x,y:b.y,heavy:m.height>40});}}
   if(q.summons&&age>=1.45/TEMPO&&!q.summoned){q.summoned=true;api.event('bossImpact',{id:b.bossType,summon:true});api.summon(q.summons,b);}
   const field=q.field;if(field&&age>=field.start&&age<field.end){let x=field.x,y=field.y;if(field.kind==='gravity'){const dx=field.x-p.x,dy=field.y-p.y,d=Math.hypot(dx,dy)||1;x=dx/d*field.strength;y=dy/d*field.strength;}else if(field.reverse&&age>=field.reverse){x=-x;y=-y;}api.push?.(x*dt,y*dt);}
   for(const bolt of q.projectiles||[])if(!bolt.fired&&age>=bolt.start){bolt.fired=true;if(q.cancelled?.[bolt.counterKey])continue;api.projectile?.(bolt,b,34+Math.min(b.phase,3)*4);api.event('bossImpact',{id:b.bossType,comet:true});}
   for(const mark of q.tracking||[])if(!mark.placed&&age>=mark.at){mark.placed=true;api.zone({shape:'circle',x:clamp(p.x,205,1330),y:clamp(p.y,360,805),r:mark.r,age:0,delay:mark.delay,life:mark.delay+.45,damage:34+Math.min(b.phase,3)*4,source:b.bossType,owner:b.id,major:true,pattern:b.majorMove.pattern,kind:BOSSES[b.bossType].theme});}
  }
  if(b.majorClock>0)return;
  if(['action','ritual'].includes(b.majorState)){b.completedMoves++;if(b.staggerReady)releaseStagger(b,api);else opening(b,(b.majorState==='ritual'?.8:1.25)+(b.bossType==='clock'?.4:b.bossType==='kiln'?.5:0),api);return;}
  if(['intro','phase','recovery','stagger','approach'].includes(b.majorState)){
   if(b.majorState==='recovery'||b.majorState==='stagger'){b.majorState='approach';b.majorClock=b.bossType==='duelist'?1.05:b.bossType==='kiln'?.9:b.bossType==='clock'?1.25:b.bossType==='oracle'?1.15:b.bossType==='railmaster'?.28:b.bossType==='admiral'||b.bossType==='briar'?1.1:.65/TEMPO;b.opening=0;b.hint='Reposition. The next tell is coming.';return;}
   const spec=BOSSES[b.bossType];
   if(!b.majorDeck.length){const available=spec.moves.filter(m=>m.phase<=b.phase&&m.pattern!=='ritual'&&(b.bossType!=='oracle'||!Oracle||Oracle.available(m,b)));const unseen=available.filter(m=>!b.seenMoves.has(m.name));b.majorDeck=api.shuffle(unseen.length?unseen:available);if(b.majorDeck[0]?.name===b.majorMove?.name)b.majorDeck.push(b.majorDeck.shift());}
   if(b.bossType==='admiral'&&!b.forceMove&&!b.forceRitual&&b.majorSerial%4!==2&&b.completedMoves-Admiral.Fight.state(b).lastCast>=2)b.forceMove=spec.moves.find(m=>m.pattern==='anchor');
   const m=b.forceMove||(b.forceRitual||b.majorSerial%4===2?spec.moves[3]:b.majorDeck.shift());b.forceMove=null;b.forceRitual=false;b.majorMove=m;if(b.bossType==='admiral'&&['anchor','reaping'].includes(m.pattern))Admiral.Fight.state(b).lastCast=b.completedMoves;b.seenMoves.add(m.name);b.majorSerial++;
   const q=plan(b.bossType,m.pattern,b,p,b.phase,b.majorSerial);if(b.bossType==='kiln')Kiln.prepare(q,b,p);if(b.bossType==='admiral')Admiral.prepare(q,b,p);if(b.bossType==='briar')Briar.prepare(q,b,p);if(b.bossType==='prism')Prism.prepare(q,b,p);if(b.bossType==='clock')Clock.prepare(q,b,p);if(b.bossType==='star')Star.prepare(q,b,p);if(b.bossType==='cantor')Cantor.prepare(q,b,p);if(b.bossType==='duelist')Duelist.prepare(q,b,p);if(b.bossType==='beekeeper')Beekeeper.prepare(q,b,p);if(b.bossType==='magistrate')Magistrate.prepare(q,b,p);if(b.bossType==='railmaster')Railmaster.prepare(q,b,p);if(b.bossType==='oracle')Oracle?.prepare(q,b,p);b.majorPlan=q;b.majorState=q.ritual?'ritual':'action';b.majorClock=q.duration;b.hint=q.admiralWave?'SURGE · walk with the dry passage; you can keep attacking.':b.bossType==='admiral'&&['anchor','reaping'].includes(m.pattern)?'BAIT THE ANCHOR · dodge beside a mooring post, then F / LB to mount.':m.hint;b.opening=0;
   if(q.ritual){b.ritualIds=api.objects(b,spec);b.ritualCount=b.ritualIds.length;b.ritualProgress=0;b.ritualOrder=api.shuffle([...b.ritualIds]);if(spec.id==='prism')b.ritualOrder.forEach((id,i)=>api.objectState?.(id,{sealed:i!==0,label:String(i+1),lit:i===0}));}
   Signatures.start(b,p,api);
   if(q.signature&&['moving','reserve'].includes(q.signature.kind))b.hint=q.signature.label+' · follow the decree until the last stroke, or dodge all three.';
   for(const z of q.zones)api.zone({...z,age:0,life:z.delay+z.duration,damage:34+Math.min(b.phase,3)*4,source:spec.id,owner:b.id,ownerObject:Number.isInteger(z.objectIndex)?b.ritualIds[z.objectIndex]:null,major:true,pattern:m.pattern,kind:spec.theme});
   if(q.summons)api.markSummons(q.summons,b);
   api.event('bossTell',{id:spec.id,name:spec.name,move:m.name,phase:b.phase});
  }
 }
 return {BOSSES,TEMPO,Oracle,Kiln,Admiral,Briar,Prism,Clock,Star,Cantor,Duelist,Beekeeper,Magistrate,Railmaster,sample:Patterns.sample,objectLayout,contains,plan,begin,update,stagger,damage,damageScale,counterHit:Signatures.hit};
});
