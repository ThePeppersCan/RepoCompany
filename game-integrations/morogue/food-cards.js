/* Presentation catalogue only. Stable combat/save IDs and all numeric effects stay in the engine. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MOROGUE_FOOD_CARDS=factory();})(globalThis,function(){
 'use strict';
 const families={drinks:{name:'The Cellar',label:'Drink',colour:'#a8c5bd',motif:'drop'},bakery:{name:'The Oven',label:'Bakery',colour:'#d6b574',motif:'wheat'},meals:{name:'The Table',label:'Meal',colour:'#c78f7f',motif:'plate'},provisions:{name:'The Larder',label:'Relic',colour:'#b3b985',motif:'leaf'}};
 const cards={},all=[];
 function add(family,kind,rows){for(const line of rows){const [id,name,subject]=line.split('|'),key=kind+':'+id,card={key,id,kind,family,name,subject,index:all.length};cards[key]=card;all.push(card);}}
 add('drinks','ability',[
  'steam|Scalding Chai|an elegant copper chai pot with a long spout, sharp ivory steam cutting diagonally through the dark',
  'bell|Copper Cocoa|a heavy ribbed copper cocoa cup on a broad saucer, a circular ripple of chocolate and two cinnamon sticks',
  'garden|Briar Tea|a squat porcelain teapot entwined in thorny blackberry vines, purple berries and leafy green tea',
  'comet|Falling-star Cordial|a cut crystal cordial glass holding a golden star-shaped citrus peel, a falling trail of violet syrup',
  'tide|Undertow Tonic|a tall sea-green tonic glass, dark blue liquid spiralling around a curled lemon rind',
  'clock|Midnight Cold Brew|a glass cold-brew carafe with coffee suspended in amber droplets, a small hourglass reflection'
 ]);
 add('drinks','branch',[
  'steam:fork|Three-spice Chai|three small copper chai cups with distinct curls of cinnamon, clove and star-anise steam',
  'steam:focus|Needle-spice Chai|a narrow silver-spouted chai pot and a single very straight column of cream steam',
  'bell:mercy|Honeyed Cocoa|a round cocoa cup with a thick spiral of honey and a glowing honeycomb balanced on its rim',
  'bell:fury|Double-dark Cocoa|two nested black ceramic cocoa cups and a double ring of dark chocolate shavings',
  'garden:wide|Wild-garden Tea|a wide shallow tea bowl overgrown with loose mint and bramble leaves',
  'garden:bloom|Last-bloom Tea|a flowering tea bulb opening inside a faceted glass teacup, large pale blossom and dark leaves',
  'comet:shower|Meteor Fizz|three slender glasses of violet fizz with falling candied stars of different heights',
  'comet:core|Black-cherry Reduction|a tiny stemmed glass of very dark cherry syrup, one huge gleaming black cherry',
  'tide:ebb|Saltwater Spritz|a scalloped sea-green glass of citrus spritz, curved outward splash and salted rim',
  'tide:deep|Deepwater Shrub|a deep blue vinegar shrub in an old apothecary bottle with a submerged sprig of rosemary',
  'clock:wide|Long-steep Coffee|a broad hourglass-shaped coffee dripper slowly shedding suspended amber droplets',
  'clock:refund|Second-steep Coffee|two porcelain coffee cups sharing one returning loop of amber coffee'
 ]);
 add('bakery','weapon',[
  'espresso|Espresso Brioche|a tall twisted brioche with dark espresso glaze, one cut slice showing a coffee spiral',
  'baguette|Sourdough Sabre|a long sharply scored sourdough loaf on a dark linen cloth, flour catching the light'
 ]);
 add('bakery','evolution',[
  'espresso|Sunrise Kouign-amann|a caramelised laminated pastry opening like the dawn, amber sugar shards around the folded centre',
  'baguette|Thousand-layer Crown|a crown-shaped ring of sharply layered golden puff pastry with a dark hollow centre'
 ]);
 add('bakery','technique',[
  'surge|Ember Croissant|a curved croissant split open to reveal a small orange ember, charred flaky tips',
  'echo|Mirror Palmier|two delicate mirrored palmier curls with one reflected in a dark silver plate',
  'volley|Coffee Mille-feuille|three thin pastry layers with espresso cream, three coffee beans poised above',
  'quickdraw|Quick-rise Twist|a long twisted cinnamon pastry curling upward with a trailing ribbon of flour'
 ]);
 add('bakery','art',[
  'relentless|Never-ending Pretzel|a heavy salted pretzel forming a continuous knot, warm copper glaze',
  'crosscut|Split-crust Galette|a rustic open galette with a deep crossed cut revealing crimson fruit underneath',
  'undertow|Spiral Danish|a large Danish swirl drawing loose poppy seeds toward its deep berry centre',
  'secondserve|Encore Éclair|two slender chocolate éclairs on a narrow vintage serving dish, second partly in shadow'
 ]);
 add('bakery','training',[
  'edge|Stoneground Rye|a dense rye loaf with angular cuts, a dusting of flour and dark rye grains',
  'vigor|Hearth Loaf|a thick round rustic bread glowing warmly from its cut centre, deep red linen beneath',
  'tempo|Baker’s Knot|a finely braided bread knot with rhythmically repeating ridges, scattered sesame seeds'
 ]);
 add('meals','passive',[
  'power|Peppercorn Steak|a pepper-crusted sliced steak on a dark oval plate, amber juices and three large peppercorns',
  'haste|Flash-fried Noodles|a lifted spiral of thin noodles over a small bowl, red chilli and a sharp curl of steam',
  'health|Hearth Stew|a hearty rustic stew in a red clay bowl, roots and mushrooms, soft golden steam',
  'magnet|Star-anise Soup|a dark soup bowl with a large star-anise at its centre and tiny star-shaped pasta gathering around',
  'speed|Runner’s Risotto|a shallow risotto plate with curled green herbs and a sweeping trail of rice',
  'regen|Restorative Broth|a pale clear broth in a small handled bowl, floating herbs and a soft silver spoon'
 ]);
 add('meals','perk',[
  'slipstream|Twice-cut Ravioli|two open ravioli with dark herb filling trailing behind a silver fork',
  'crescent|Crescent Dumplings|three crescent-shaped golden dumplings arranged like a sweeping arc',
  'roast|Ember-roasted Chestnuts|split roasted chestnuts in a charred little bowl, crimson embers in their cracked shells',
  'measure|Clockwork Tartare|a neatly measured cylindrical tartare with a golden yolk and precisely arranged capers',
  'lastlight|Last-supper Soup|a small bowl of rich pumpkin soup with a single glowing candle-like curl of cream',
  'riposte|Pepper-crusted Cutlet|an angular breaded cutlet held upright against a plate, cracked pepper and dark berry sauce',
  'crossfire|Backfire Chilli|a red chilli pot with two peppers pointing opposite ways and a tiny tongue of orange flame',
  'surge|Crackling Gnocchi|crisply fried gnocchi tumbling from a black pan, tiny amber sparks of browned butter',
  'recovery|Minted Pea Soup|a green pea soup in an ivory bowl with a fresh mint sprig and bright dew drops',
  'afterimage|Thousand-cut Slaw|very finely cut purple cabbage and carrot slaw fanning over a dark plate',
  'pressure|Close-heat Hotpot|a small iron hotpot full of dark broth and red chilli oil, lid tilted with forceful steam',
  'reserve|Three-step Skewers|three golden roasted vegetable skewers ascending in steps over a charcoal serving slab',
  'momentum|Braided Noodles|a continuous braid of long noodles winding upward from a deep dark bowl',
  'soulstep|Starflower Salad|a plate of silver-green leaves and tiny star-shaped edible flowers drifting inward',
  'execution|Last-bite Ribs|a single dark glazed rib on an otherwise empty ceramic plate, rich red sauce',
  'conductor|Copper-pot Curry|a copper curry pot with a rhythmic spiral of golden cream and curry leaves',
  'fleet|Featherlight Soufflé|a very airy savoury cheese soufflé rising from a small ivory ramekin with feathery herb leaves',
  'ward|Sugar-shell Squash|a small roasted squash enclosed by a thin cracked amber sugar shell, soft filling visible',
  'aftermath|After-hours Fondue|a dark cheese fondue pot with a long trail of melted cheese connecting a forkful',
  'bankshot|Skillet Capers|large green capers bouncing in a tilted iron skillet with glints of oil',
  'needle|Fencer’s Asparagus|three long asparagus spears set across a small plate like narrow lances, lemon butter',
  'siphon|Blood-orange Salad|dark red blood-orange slices over green leaves, a thread of crimson juice falling into the bowl',
  'reprisal|Pickled Thunderroots|sharp yellow pickled root strips in a blue bowl with angular lightning-like ginger curls',
  'pursuit|Trail-pepper Hash|a skillet of roasted potato hash with a trail of vivid red pepper pieces',
  'reservoir|Full-pot Cassoulet|a deep earthenware cassoulet pot filled to the brim, golden crust and white beans',
  'cadence|Three-herb Congee|a pale congee bowl with three distinct herb sprigs placed carefully around a golden centre',
  'tether|Ribbon Pasta|a long red ribbon of pasta tying two forkfuls above a small dark plate',
  'singleorigin|Single-grain Pilaf|a compact cone of dark aromatic pilaf crowned by a single unusually large golden rice grain',
  'spill|Black-garlic Jus|a tipped small sauceboat pouring thick black-garlic sauce onto a dark saucer',
  'returning|Returning Noodles|a broad loop of flat noodles returning into its bowl, black sesame and pale broth',
  'doughpin|Pinwheel Supper|three savoury pinwheel rolls held in place by short skewers on a slate board',
  'feint|False Morel|one large hollow morel mushroom with a shadow shaped like a second mushroom behind it',
  'kindling|Kindling Peppers|a bundle of grilled pointed peppers over a tiny bed of glowing charcoal'
 ]);
 add('meals','keystone',[
  'glass|Black-sugar Soufflé|a tall dark sugar soufflé in a cracked porcelain ramekin, brittle amber spire',
  'duellist|Duelist’s Carvery|a substantial roast with one sharp carving knife balanced across the platter',
  'precision|Perfect-cut Sashimi|precisely cut pale sashimi on dark slate with one thin blade of wasabi green',
  'eclipse|Eclipse Truffle|a large black truffle cut in half revealing a luminous pale crescent, black plate'
 ]);
 add('provisions','relic',[
  'kiln|Cinder Salt|a little scorched salt cellar holding orange crystals with blackened edges',
  'admiral|Tide-pickled Lemon|a preserved whole lemon in a narrow sea-green glass jar, saltwater and a tied rope seal',
  'briar|Briar Preserve|a squat blackberry preserve jar bound by thorny twigs, dark purple jam',
  'prism|Prism Sugar|three translucent angular sugar crystals refracting muted rose and sea-green colours',
  'clock|Hourglass Saffron|a tiny hourglass bottle holding dark red saffron threads instead of sand',
  'star|Hollow Vanilla|a split black vanilla pod with a small silver star-shaped hollow in its centre',
  'cantor|Bellflower Honey|a narrow jar of dark amber honey with small pale bell-shaped flowers',
  'duelist|Rose-pepper Preserve|a red pepper preserve in a faceted jar capped with dried rose petals',
  'beekeeper|Royal Honeycomb|a large irregular piece of golden honeycomb on a dark wooden spoon',
  'magistrate|Black Ink Molasses|a square old ink-like bottle filled with glossy dark molasses, wax seal and trailing syrup',
  'railmaster|Signal Mustard|a small ceramic mustard pot with three mustard seeds and an old brass spoon',
  'oracle|Moon-brined Olives|pale green olives in a crescent-shaped porcelain dish, silver brine and one dark olive'
 ]);
 const relicEffects={kiln:'+4% weapon damage per rank.',admiral:'Dash recharge time reduced by 3.5% per rank.',briar:'Recover 8 more health during rests per rank.',prism:'+2% critical chance per rank.',clock:'Landed finishers recover 0.04 seconds of dash charge per rank.',star:'Perfect-dodge Flow lasts 0.5 seconds longer per rank.',cantor:'Landed finishers recover 0.04 seconds of dash charge per rank.',duelist:'+2% critical chance per rank.',beekeeper:'Recover 8 more health during rests per rank.',magistrate:'+4% weapon damage per rank.',railmaster:'Dash recharge time reduced by 3.5% per rank.',oracle:'Perfect-dodge Flow lasts 0.5 seconds longer per rank.'};
 const originalCardCount=all.length;
 add('meals','perk',[
  'cleaveguard|Crustguard Tart|a bread-crust shield deflecting arrows',
  'hookcut|Hooked Mushroom Pasta|hook-shaped pasta gathering mushrooms',
  'coldbrew|Frostmint Coffee|iced coffee with frosted mint',
  'fanbrew|Three-spout Coffee|three spouts pouring a wide coffee fan',
  'reckoning|Reprieve Pepper|a cracked pepper mill scattering spices',
  'pilgrim|Pilgrim’s Parcel|bread wrapped in travelling paths',
  'secondwind|Mended Beet Broth|a bandaged beet beside healing soup',
  'crossing|Threaded Figs|three figs joined by silver threads'
 ]);
 add('bakery','training',[
  'soup|Midnight Soup|a steaming restorative cauldron',
  'charge|Running Drumsticks|drumsticks with skeletal legs',
  'infusion|Four-drop Tea|four tea drops above a copper cup',
  'shell|Glass-shell Tart|a protective sugar dome over fruit tart',
  'harvest|Star-anise Sack|stars falling into a flour sack',
  'focus|Four-cut Almonds|four precise almond shards',
  'fleetmeal|Feather Meringue|light meringue with walking legs',
  'dashmeal|Clockwork Swirl|a cinnamon roll with clockwork legs'
 ]);
 const weaponExpansionStart=all.length;
 add('drinks','perk',["carom|Carom Coffee|weapon transformation","echobrew|Echo Espresso|weapon transformation","orbitbrew|Saturn Macchiato|weapon transformation"]);
 add('bakery','perk',["cyclone|Cyclone Brioche|weapon transformation","faultline|Faultline Focaccia|weapon transformation","crumbstorm|Crumbstorm Skewers|weapon transformation"]);
 const artFrames=[{"crop":[3,2,94,157],"field":"#1e1f1e","paper":"#dccda7","ink":"#fffbed"},{"crop":[101,2,89,157],"field":"#af6054","paper":"#dccda7","ink":"#000000"},{"crop":[194,2,89,157],"field":"#96812c","paper":"#dccda7","ink":"#000000"},{"crop":[287,2,94,157],"field":"#798a68","paper":"#dccca5","ink":"#000000"},{"crop":[3,162,94,155],"field":"#1f2328","paper":"#dccda7","ink":"#fffbed"},{"crop":[101,162,89,155],"field":"#a55048","paper":"#dccca5","ink":"#fffbed"},{"crop":[194,162,89,155],"field":"#1e1f1e","paper":"#dccca5","ink":"#fffbed"},{"crop":[287,162,94,155],"field":"#798a68","paper":"#dccca5","ink":"#000000"},{"crop":[3,320,94,149],"field":"#96812c","paper":"#dccca5","ink":"#000000"},{"crop":[101,320,89,149],"field":"#e2d3ac","paper":"#dccca5","ink":"#000000"},{"crop":[194,320,89,149],"field":"#1e1f1e","paper":"#dbcba4","ink":"#fffbed"},{"crop":[287,320,94,149],"field":"#1e1f1e","paper":"#dbcba4","ink":"#fffbed"},{"crop":[3,473,94,163],"field":"#586a70","paper":"#dccda7","ink":"#fffbed"},{"crop":[101,473,89,163],"field":"#aa9035","paper":"#dccda7","ink":"#000000"},{"crop":[194,473,89,163],"field":"#e1d2ab","paper":"#dccca5","ink":"#000000"},{"crop":[287,473,94,163],"field":"#a24f4a","paper":"#dccca5","ink":"#fffbed"},{"crop":[3,2,91,157],"field":"#7c7e4e","paper":"#dfcda5","ink":"#000000"},{"crop":[96,2,95,157],"field":"#212121","paper":"#decca4","ink":"#fffbed"},{"crop":[193,2,95,157],"field":"#c48c39","paper":"#decca4","ink":"#000000"},{"crop":[290,2,93,157],"field":"#a7675e","paper":"#ddcba2","ink":"#000000"},{"crop":[3,161,91,155],"field":"#526770","paper":"#ddcba2","ink":"#fffbed"},{"crop":[96,161,95,155],"field":"#212121","paper":"#decca3","ink":"#fffbed"},{"crop":[193,161,95,155],"field":"#222222","paper":"#ddcba2","ink":"#fffbed"},{"crop":[290,161,93,155],"field":"#797b4c","paper":"#ddcaa1","ink":"#000000"},{"crop":[3,319,91,152],"field":"#734650","paper":"#decca4","ink":"#fffbed"},{"crop":[96,319,95,152],"field":"#decba3","paper":"#decba3","ink":"#000000"},{"crop":[193,319,95,152],"field":"#222222","paper":"#decba3","ink":"#fffbed"},{"crop":[290,319,93,152],"field":"#797b4c","paper":"#ddcaa1","ink":"#000000"},{"crop":[3,475,91,161],"field":"#a9675e","paper":"#dfcda5","ink":"#000000"},{"crop":[96,475,95,161],"field":"#222222","paper":"#decca4","ink":"#fffbed"},{"crop":[193,475,95,161],"field":"#8b742a","paper":"#decca4","ink":"#000000"},{"crop":[290,475,93,161],"field":"#526770","paper":"#decca4","ink":"#fffbed"},{"crop":[3,2,90,155],"field":"#9f6157","paper":"#dbc89f","ink":"#fffbed"},{"crop":[96,2,94,155],"field":"#dbc9a1","paper":"#dac89e","ink":"#000000"},{"crop":[194,2,94,155],"field":"#8c772b","paper":"#dbc9a1","ink":"#000000"},{"crop":[291,2,91,155],"field":"#9a4e48","paper":"#dbc9a1","ink":"#fffbed"},{"crop":[3,162,90,155],"field":"#717453","paper":"#dbc9a1","ink":"#fffbed"},{"crop":[96,162,94,155],"field":"#525f66","paper":"#dbc89f","ink":"#fffbed"},{"crop":[194,162,94,155],"field":"#a16358","paper":"#dbc89f","ink":"#fffbed"},{"crop":[291,162,91,155],"field":"#201f1f","paper":"#dac89e","ink":"#fffbed"},{"crop":[3,322,90,143],"field":"#977c2b","paper":"#dbc9a1","ink":"#000000"},{"crop":[96,322,94,143],"field":"#717453","paper":"#dbc9a1","ink":"#fffbed"},{"crop":[194,322,94,143],"field":"#99524a","paper":"#dbc9a1","ink":"#fffbed"},{"crop":[291,322,91,143],"field":"#201f1f","paper":"#d9c79f","ink":"#fffbed"},{"crop":[3,469,90,167],"field":"#536167","paper":"#d9c69d","ink":"#fffbed"},{"crop":[96,469,94,167],"field":"#a8842f","paper":"#d9c69d","ink":"#000000"},{"crop":[194,469,94,167],"field":"#5f6448","paper":"#dbc89f","ink":"#fffbed"},{"crop":[291,469,91,167],"field":"#dbc9a1","paper":"#dac89e","ink":"#000000"},{"crop":[3,2,90,161],"field":"#967c2e","paper":"#e0cea9","ink":"#000000"},{"crop":[96,2,94,161],"field":"#a55f54","paper":"#decca5","ink":"#fffbed"},{"crop":[194,2,95,161],"field":"#4f5f67","paper":"#decca5","ink":"#fffbed"},{"crop":[291,2,90,161],"field":"#957b2c","paper":"#decca5","ink":"#000000"},{"crop":[3,165,90,150],"field":"#1f1e1d","paper":"#decca5","ink":"#fffbed"},{"crop":[96,165,94,150],"field":"#747c52","paper":"#dfcca6","ink":"#000000"},{"crop":[194,165,95,150],"field":"#79484c","paper":"#decca5","ink":"#fffbed"},{"crop":[291,165,90,150],"field":"#282c30","paper":"#dfcca6","ink":"#fffbed"},{"crop":[3,318,90,149],"field":"#a55d53","paper":"#decca5","ink":"#fffbed"},{"crop":[96,318,94,149],"field":"#9d822f","paper":"#ddcba4","ink":"#000000"},{"crop":[194,318,95,149],"field":"#1d1e1e","paper":"#ddcba4","ink":"#fffbed"},{"crop":[291,318,90,149],"field":"#e1cca3","paper":"#decca5","ink":"#000000"},{"crop":[3,470,90,163],"field":"#777f54","paper":"#dfcca6","ink":"#000000"},{"crop":[96,470,94,163],"field":"#94473c","paper":"#decca5","ink":"#fffbed"},{"crop":[194,470,95,163],"field":"#977d2d","paper":"#decca5","ink":"#000000"},{"crop":[291,470,90,163],"field":"#4d5e66","paper":"#dfcca6","ink":"#fffbed"},{"crop":[2,1,94,158],"field":"#a45f5a","paper":"#d9c69e","ink":"#fffbed"},{"crop":[97,1,94,158],"field":"#d9c69e","paper":"#d9c7a0","ink":"#000000"},{"crop":[193,1,94,158],"field":"#707b57","paper":"#d9c69e","ink":"#000000"},{"crop":[289,1,94,158],"field":"#9d802e","paper":"#d9c69e","ink":"#000000"},{"crop":[2,162,94,157],"field":"#613943","paper":"#d9c7a0","ink":"#fffbed"},{"crop":[97,162,94,157],"field":"#7f864d","paper":"#d9c7a0","ink":"#000000"},{"crop":[193,162,94,157],"field":"#222221","paper":"#d9c69e","ink":"#fffbed"},{"crop":[289,162,94,157],"field":"#d9c69e","paper":"#d9c79f","ink":"#000000"},{"crop":[2,322,94,145],"field":"#717c57","paper":"#dac8a1","ink":"#000000"},{"crop":[97,322,94,145],"field":"#202121","paper":"#dac8a1","ink":"#fffbed"},{"crop":[193,322,94,145],"field":"#a6605b","paper":"#dac8a1","ink":"#fffbed"},{"crop":[289,322,94,145],"field":"#9d802e","paper":"#d9c7a0","ink":"#000000"},{"crop":[2,470,94,165],"field":"#46565e","paper":"#d9c69e","ink":"#fffbed"},{"crop":[97,470,94,165],"field":"#a6605b","paper":"#d9c69e","ink":"#fffbed"},{"crop":[193,470,94,165],"field":"#d7c59d","paper":"#d9c69e","ink":"#000000"},{"crop":[289,470,94,165],"field":"#9d802e","paper":"#d9c69e","ink":"#000000"},{"crop":[3,2,91,170],"field":"#20201e","paper":"#dbc9a0","ink":"#fffbed"},{"crop":[97,2,94,170],"field":"#a4635b","paper":"#dcc9a0","ink":"#000000"},{"crop":[194,2,94,170],"field":"#4c5a61","paper":"#dcc9a0","ink":"#fffbed"},{"crop":[290,2,92,170],"field":"#dac79d","paper":"#dbc89f","ink":"#000000"},{"crop":[3,175,91,159],"field":"#1f1f1d","paper":"#ddcba1","ink":"#fffbed"},{"crop":[97,175,94,159],"field":"#937d2e","paper":"#dcc9a0","ink":"#000000"},{"crop":[194,175,94,159],"field":"#5d4048","paper":"#dccaa1","ink":"#fffbed"},{"crop":[290,175,92,159],"field":"#748360","paper":"#dcc9a0","ink":"#000000"}];
 all.forEach(c=>{c.sheet=Math.floor(c.index/16);c.cell=c.index%16;c.art='assets/morogue/food-cards/folio-'+c.sheet+'.png';Object.assign(c,artFrames[c.index]);if(c.index>=originalCardCount){Object.assign(c,{fullFrame:true,atlas:c.index-originalCardCount,atlasColumns:4,atlasRows:4,art:'assets/morogue/food-cards/folio-expansion-1.png',crop:[0,0,256,384],field:'#252927',paper:'#dccda7',ink:'#fffbed'});}if(c.index>=weaponExpansionStart)Object.assign(c,{atlas:c.index-weaponExpansionStart,atlasColumns:3,atlasRows:2,art:'https://repocompany.uk/game-integrations/morogue/weapon-cards-v1.png',crop:[0,0,96,160]});if(c.kind==='relic')c.description=relicEffects[c.id];Object.freeze(c);});
 function get(key){return cards[key]||null;}
 function keyFor(choice,state){if(choice.kind==='refinement')return 'perk:'+choice.parent;if(choice.kind==='abilityRank')return 'ability:'+state.build.ability;if(choice.kind==='branch')return 'branch:'+state.build.ability+':'+choice.key;if(['style','talent'].includes(choice.kind))return 'perk:'+(choice.key||choice.id);return choice.kind+':'+(choice.key||choice.id).replace(/^(perk|ability|keystone):/,'');}
 function clearCopy(text){return String(text||'').replace(/Extra shot/g,'Peppercorn Steak').replace(/Walking shoes/g,'Runner’s Risotto').replace(/Dawn Roast/g,'Sunrise Kouign-amann').replace(/Single Origin/g,'Single-grain Pilaf').replace(/Wide Pour/g,'Three-spout Coffee').replace(/Edge training/g,'Stoneground Rye mastery').replace(/clock slows/g,'time field slows');}
 function present(choice,state){let card=get(keyFor(choice,state));if(card&&choice.kind==='refinement')card={...card,name:choice.name,kind:'refinement'};return card?{...choice,name:card.name,food:card,description:clearCopy(choice.description),detail:clearCopy(choice.detail)}:choice;}

 const category={refinement:'Weapon refinement',ability:'Special',branch:'Special recipe',weapon:'Weapon',evolution:'Evolution',technique:'Finisher',art:'Combat art',training:'Mastery',passive:'Foundation',perk:'Combat perk',keystone:'Keystone',relic:'Boss relic'};
 function install(engine){
  const rename=(kind,catalog)=>{for(const [id,spec]of Object.entries(catalog)){const c=get(kind+':'+id);if(c){spec.combatName??=spec.name;spec.name=c.name;}}};
  rename('ability',engine.BUILDS.ABILITIES);rename('perk',engine.BUILDS.PERKS);rename('keystone',engine.BUILDS.KEYSTONES);rename('passive',engine.PASSIVES);rename('technique',engine.TECHNIQUES);rename('art',engine.ARTS);rename('evolution',engine.EVOLUTIONS);rename('perk',engine.STYLES);rename('perk',engine.ENDLESS_TALENTS);
  for(const [id,spec]of Object.entries(engine.BUILDS.ABILITIES))for(const branch of Object.keys(spec.branches))spec.branches[branch]=get('branch:'+id+':'+branch).name;
  // Weapon identity stays on the action HUD; the weapon-rank offering has its own bakery card.
 }
 function illustration(card){const art=document.createElement('span'),[x,y,w,h]=card.crop;if(Number.isInteger(card.atlas)){art.className=card.fullFrame?'mr-food-art':'mr-food-art mr-relic-single';art.setAttribute('aria-hidden','true');art.style.backgroundImage='url("'+card.art+'")';const cols=card.atlasColumns||6,rows=card.atlasRows||4;art.style.backgroundSize=(cols*100)+'% '+(rows*100)+'%';art.style.backgroundPosition=(card.atlas%cols/(cols-1)*100)+'% '+(Math.floor(card.atlas/cols)/(rows-1)*100)+'%';return art;}if(card.single){art.className='mr-food-art mr-relic-single';art.setAttribute('aria-hidden','true');art.style.backgroundImage='url("'+card.art+'")';art.style.backgroundSize='100% 100%';return art;}art.className='mr-food-art';art.setAttribute('aria-hidden','true');art.style.backgroundImage='url("'+card.art+'")';art.style.backgroundSize=(384/w*100)+'% '+(640/h*100)+'%';art.style.backgroundPosition=(x/(384-w)*100)+'% '+(y/(640-h)*100)+'%';return art;}
 function roman(value){let n=Math.max(1,Math.floor(value)),out='';if(n>3999)return String(n);for(const [unit,glyph]of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(n>=unit){out+=glyph;n-=unit;}return out;}
 function theme(el,card){el.style.setProperty('--food-field',card.field);el.style.setProperty('--food-paper',card.paper);el.style.setProperty('--food-text',card.ink);el.style.setProperty('--food-ink',families[card.family].colour);return el;}
 function face(card,rank){const el=theme(document.createElement('span'),card);el.className='mr-food-face';el.dataset.foodCard=card.key;el.dataset.foodFamily=card.family;const top=document.createElement('span');top.className='mr-food-number';top.textContent=roman(rank||card.index+1);const title=document.createElement('span');title.className='mr-food-title';title.textContent=card.name;el.append(top,illustration(card),title);return el;}
 function label(card){return families[card.family].label+' · '+category[card.kind];}
 return {all,cards,families,category,get,keyFor,clearCopy,present,install,illustration,face,label,theme,roman};
});
