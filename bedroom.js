/* Velmora — My Bedroom V33.26
   Human keeper bedroom. Separate from Dragonbound dragon housing/furniture.
   Four free room shells, a free bedroom furniture shop, direct drag editing,
   account-backed persistence with local fallback, and one autonomous flavour pet selected from the bedroom Pets menu.
*/
(() => {
  'use strict';
  if (window.__velmoraBedroomV3325) return;
  window.__velmoraBedroomV3325 = true;

  const VERSION = 'v33-26-daycycle-load-hotfix-20260822';
  const ROOT = 'assets/bedroom/';
  const DOOR_AUDIO = ROOT + 'audio/bedroom-door-open.mp3';
  const ROOMS = [
    { id:'nordic_timber', name:'Nordic Timber', src:ROOT+'rooms/room_01_nordic_timber.png', copy:'Warm timber, blue glass and a cosy Velmoran lodge feel.' },
    { id:'lakeside_stone', name:'Lakeside Stone', src:ROOT+'rooms/room_02_lakeside_stone.png', copy:'Cool stonework and a calmer lakeside character.' },
    { id:'terracotta_artisan', name:'Terracotta Artisan', src:ROOT+'rooms/room_03_terracotta_artisan.png', copy:'Warm plaster, terracotta tones and handcrafted detail.' },
    { id:'midnight_dragon', name:'Midnight Dragon', src:ROOT+'rooms/room_04_midnight_dragon.png', copy:'Dark timber, teal accents and a richer night-time mood.' }
  ];
  const ROOM_IDS = new Set(ROOMS.map(room => room.id));

  const PET_BREEDS=[{"id":"cat_bengal","name":"Bengal","type":"cat","width":3.75,"speed":0.074},{"id":"cat_british_shorthair","name":"British Shorthair","type":"cat","width":3.75,"speed":0.074},{"id":"cat_maine_coon","name":"Maine Coon","type":"cat","width":4.15,"speed":0.074},{"id":"cat_norwegian_forest_cat","name":"Norwegian Forest Cat","type":"cat","width":4.15,"speed":0.074},{"id":"cat_persian","name":"Persian","type":"cat","width":3.75,"speed":0.074},{"id":"cat_ragdoll","name":"Ragdoll","type":"cat","width":4.15,"speed":0.074},{"id":"cat_russian_blue","name":"Russian Blue","type":"cat","width":3.75,"speed":0.074},{"id":"cat_scottish_fold","name":"Scottish Fold","type":"cat","width":3.75,"speed":0.074},{"id":"cat_siamese","name":"Siamese","type":"cat","width":3.75,"speed":0.074},{"id":"cat_sphynx","name":"Sphynx","type":"cat","width":3.75,"speed":0.074},{"id":"dog_border_collie","name":"Border Collie","type":"dog","width":5.0,"speed":0.076},{"id":"dog_dachshund","name":"Dachshund","type":"dog","width":4.1,"speed":0.076},{"id":"dog_dalmatian","name":"Dalmatian","type":"dog","width":5.3,"speed":0.076},{"id":"dog_french_bulldog","name":"French Bulldog","type":"dog","width":4.3,"speed":0.076},{"id":"dog_german_shepherd","name":"German Shepherd","type":"dog","width":6.2,"speed":0.071},{"id":"dog_golden_retriever","name":"Golden Retriever","type":"dog","width":6.3,"speed":0.071},{"id":"dog_pembroke_welsh_corgi","name":"Pembroke Welsh Corgi","type":"dog","width":4.45,"speed":0.076},{"id":"dog_shiba_inu","name":"Shiba Inu","type":"dog","width":4.7,"speed":0.076},{"id":"dog_siberian_husky","name":"Siberian Husky","type":"dog","width":5.65,"speed":0.071},{"id":"dog_standard_poodle","name":"Standard Poodle","type":"dog","width":5.0,"speed":0.076}];
  const PET_BY_ID=new Map(PET_BREEDS.map(pet=>[pet.id,pet]));

  const RAW_ITEMS = [
    'bed_01_nordic_timber.png','bed_02_pale_oak.png','bed_03_terracotta.png','bed_04_midnight.png',
    'bedside_01_timber.png','bedside_02_pale_oak.png','bedside_03_terracotta.png',
    'bookshelf_01_timber.png','bookshelf_02_pale_oak.png','bookshelf_03_terracotta.png',
    'chair_01_timber.png','desk_01_timber.png','desk_03_terracotta.png',
    'dragon_care_01_feeding_station.png','dragon_care_02_scratching_perch.png',
    'dragon_nest_01_stone_cream.png','dragon_nest_02_wood_moss.png','dragon_nest_03_cave_teal.png','dragon_nest_04_crate_midnight.png',
    'lamp_01_hanging.png','lamp_02_standing.png','planter_01_fern.png','planter_02_tree.png',
    'rug_01_green.png','rug_02_terracotta.png','stool_02_pale_oak.png','stool_03_terracotta.png',
    'table_01_square.png','table_02_round.png','trunk_01_timber.png','trunk_02_pale_oak.png','trunk_03_terracotta.png',
    'vanity_02_pale_oak.png','wardrobe_01_timber.png','wardrobe_02_pale_oak.png','wardrobe_03_terracotta.png'
  ];

  // The four room shells share the same cut-away footprint, with tiny art differences.
  // These polygons describe the *walkable/decoratable floor*, not the outer image bounds.
  const ROOM_FLOORS = {
    nordic_timber:[[.19,.57],[.31,.50],[.69,.50],[.81,.57],[.91,.68],[.85,.77],[.66,.90],[.57,.96],[.43,.96],[.34,.90],[.15,.77],[.09,.68]],
    lakeside_stone:[[.20,.57],[.32,.50],[.69,.50],[.81,.57],[.91,.68],[.85,.77],[.66,.90],[.57,.96],[.43,.96],[.34,.90],[.15,.77],[.09,.68]],
    terracotta_artisan:[[.18,.57],[.31,.51],[.69,.51],[.82,.57],[.91,.68],[.85,.77],[.66,.90],[.57,.96],[.43,.96],[.34,.90],[.15,.77],[.09,.68]],
    midnight_dragon:[[.19,.57],[.31,.51],[.69,.51],[.81,.57],[.91,.68],[.85,.77],[.66,.90],[.57,.96],[.43,.96],[.34,.90],[.15,.77],[.09,.68]]
  };
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const uid=()=>{try{return crypto.randomUUID()}catch(_){return `bed-${Date.now()}-${Math.random().toString(36).slice(2,9)}`}};
  const titleCase=value=>String(value||'').replace(/\.png$/,'').replace(/^\d+_/,'').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  // 0.5% snapping is effectively free placement while keeping saved coordinates stable.
  const snap=n=>Math.round(clamp(n,0,1)/.005)*.005;
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function metaFor(file){
    const id=file.replace(/\.png$/,'');
    const lower=id.toLowerCase();
    let category='Decor', footprint='1x1', width=12, blocking=true, wall=false, rug=false, futurePet=false, name=titleCase(id.replace(/^\w+_\d+_?/,''));
    if(lower.startsWith('bed_')){category='Beds';footprint='2x2';width=24;name=titleCase(id.split('_').slice(2).join('_'))+' Bed';}
    else if(lower.startsWith('bedside_')){category='Storage';footprint='1x1';width=12;name=titleCase(id.split('_').slice(2).join('_'))+' Bedside Cabinet';}
    else if(lower.startsWith('bookshelf_')){category='Storage';footprint='2x1';width=16;wall=true;name=titleCase(id.split('_').slice(2).join('_'))+' Bookshelf';}
    else if(lower.startsWith('chair_')){category='Seating';footprint='1x1';width=12;name=titleCase(id.split('_').slice(2).join('_'))+' Chair';}
    else if(lower.startsWith('stool_')){category='Seating';footprint='1x1';width=10;name=titleCase(id.split('_').slice(2).join('_'))+' Stool';}
    else if(lower.startsWith('desk_')){category='Tables & Desks';footprint='2x1';width=19;name=titleCase(id.split('_').slice(2).join('_'))+' Desk';}
    else if(lower.startsWith('table_')){category='Tables & Desks';footprint='2x1';width=17;name=titleCase(id.split('_').slice(2).join('_'))+' Table';}
    else if(lower.startsWith('vanity_')){category='Tables & Desks';footprint='2x1';width=18;wall=true;name=titleCase(id.split('_').slice(2).join('_'))+' Vanity';}
    else if(lower.startsWith('wardrobe_')){category='Storage';footprint='2x1';width=17;wall=true;name=titleCase(id.split('_').slice(2).join('_'))+' Wardrobe';}
    else if(lower.startsWith('trunk_')){category='Storage';footprint='2x1';width=15;name=titleCase(id.split('_').slice(2).join('_'))+' Trunk';}
    else if(lower.startsWith('planter_')){category='Decor';footprint='1x1';width=12;name=titleCase(id.split('_').slice(2).join('_'))+' Planter';}
    else if(lower.startsWith('lamp_01')){category='Lighting';footprint='1x1';width=8;wall=true;blocking=false;name='Hanging Lamp';}
    else if(lower.startsWith('lamp_02')){category='Lighting';footprint='1x1';width=8;name='Standing Lamp';}
    else if(lower.startsWith('rug_')){category='Rugs';footprint='3x2';width=35;blocking=false;rug=true;name=titleCase(id.split('_').slice(2).join('_'))+' Rug';}
    else if(lower.startsWith('dragon_nest_')){category='Pet Care';footprint='2x2';width=20;futurePet=true;name=titleCase(id.split('_').slice(3).join('_'))+' Pet Nest';}
    else if(lower.includes('feeding_station')){category='Pet Care';footprint='2x1';width=16;futurePet=true;name='Pet Feeding Station';}
    else if(lower.includes('scratching_perch')){category='Pet Care';footprint='2x1';width=15;futurePet=true;name='Pet Scratching Perch';}
    const size = footprint==='1x1'?[.045,.025]:footprint==='2x1'?[.075,.03]:footprint==='2x2'?[.09,.055]:[.14,.055];
    return {id,file,name,category,footprint,width,blocking,wall,rug,futurePet,halfW:size[0],halfH:size[1],src:ROOT+'furniture/'+file};
  }

  const FLAT96_ITEMS = [
    {id:"flat96_arcane_cleansing_basin",file:"arcane_cleansing_basin.png",name:"Arcane Cleansing Basin",category:"Bathing",footprint:"2x2",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"arcane_cleansing_basin.png"},
    {id:"flat96_aurelia_marble_wash_station",file:"aurelia_marble_wash_station.png",name:"Aurelia Marble Wash Station",category:"Bathing",footprint:"2x1",width:20,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"aurelia_marble_wash_station.png"},
    {id:"flat96_blackglass_steam_wash_station",file:"blackglass_steam_wash_station.png",name:"Blackglass Steam Wash Station",category:"Bathing",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"blackglass_steam_wash_station.png"},
    {id:"flat96_coastal_tiled_bath",file:"coastal_tiled_bath.png",name:"Coastal Tiled Bath",category:"Bathing",footprint:"2x2",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"coastal_tiled_bath.png"},
    {id:"flat96_cottage_ceramic_washstand",file:"cottage_ceramic_washstand.png",name:"Cottage Ceramic Washstand",category:"Bathing",footprint:"2x1",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"cottage_ceramic_washstand.png"},
    {id:"flat96_elven_rainfall_wash_arch",file:"elven_rainfall_wash_arch.png",name:"Elven Rainfall Wash Arch",category:"Bathing",footprint:"2x1",width:18,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"elven_rainfall_wash_arch.png"},
    {id:"flat96_nordic_copper_bath",file:"nordic_copper_bath.png",name:"Nordic Copper Bath",category:"Bathing",footprint:"2x2",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"nordic_copper_bath.png"},
    {id:"flat96_zafir_cooling_basin",file:"zafir_cooling_basin.png",name:"Zafir Cooling Basin",category:"Bathing",footprint:"2x2",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"zafir_cooling_basin.png"},
    {id:"flat96_arcane_crystal_canopy_bed",file:"arcane_crystal_canopy_bed.png",name:"Arcane Crystal Canopy Bed",category:"Beds",footprint:"2x2",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"arcane_crystal_canopy_bed.png"},
    {id:"flat96_aurelia_royal_bed",file:"aurelia_royal_bed.png",name:"Aurelia Royal Bed",category:"Beds",footprint:"2x2",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"aurelia_royal_bed.png"},
    {id:"flat96_blackglass_ember_bed",file:"blackglass_ember_bed.png",name:"Blackglass Ember Bed",category:"Beds",footprint:"2x2",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"blackglass_ember_bed.png"},
    {id:"flat96_coastal_captains_bed",file:"coastal_captains_bed.png",name:"Coastal Captains Bed",category:"Beds",footprint:"2x2",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"coastal_captains_bed.png"},
    {id:"flat96_coastal_rope_daybed",file:"coastal_rope_daybed.png",name:"Coastal Rope Daybed",category:"Beds",footprint:"2x2",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"coastal_rope_daybed.png"},
    {id:"flat96_cottage_oak_storage_bed",file:"cottage_oak_storage_bed.png",name:"Cottage Oak Storage Bed",category:"Beds",footprint:"2x2",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"cottage_oak_storage_bed.png"},
    {id:"flat96_elven_leafwood_bed",file:"elven_leafwood_bed.png",name:"Elven Leafwood Bed",category:"Beds",footprint:"2x2",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"elven_leafwood_bed.png"},
    {id:"flat96_nordic_heavy_timber_bed",file:"nordic_heavy_timber_bed.png",name:"Nordic Heavy Timber Bed",category:"Beds",footprint:"2x2",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"nordic_heavy_timber_bed.png"},
    {id:"flat96_recovery_bed",file:"recovery_bed.png",name:"Recovery Bed",category:"Beds",footprint:"2x2",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"recovery_bed.png"},
    {id:"flat96_zafir_mosaic_canopy_bed",file:"zafir_mosaic_canopy_bed.png",name:"Zafir Mosaic Canopy Bed",category:"Beds",footprint:"2x2",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.09,halfH:0.055,src:ROOT+'furniture/flat96/'+"zafir_mosaic_canopy_bed.png"},
    {id:"flat96_sun_vine_wall_tapestry",file:"sun_vine_wall_tapestry.png",name:"Sun Vine Wall Tapestry",category:"Decor",footprint:"2x1",width:23,blocking:false,wall:true,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"sun_vine_wall_tapestry.png"},
    {id:"flat96_adjustable_warming_lamp",file:"adjustable_warming_lamp.png",name:"Adjustable Warming Lamp",category:"Health & Utility",footprint:"2x1",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"adjustable_warming_lamp.png"},
    {id:"flat96_apothecary_medicine_cabinet",file:"apothecary_medicine_cabinet.png",name:"Apothecary Medicine Cabinet",category:"Health & Utility",footprint:"2x1",width:18,blocking:true,wall:true,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"apothecary_medicine_cabinet.png"},
    {id:"flat96_bandage_trolley",file:"bandage_trolley.png",name:"Bandage Trolley",category:"Health & Utility",footprint:"2x1",width:19,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"bandage_trolley.png"},
    {id:"flat96_claw_care_bench",file:"claw_care_bench.png",name:"Claw Care Bench",category:"Health & Utility",footprint:"2x1",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"claw_care_bench.png"},
    {id:"flat96_fireplace_safety_guard",file:"fireplace_safety_guard.png",name:"Fireplace Safety Guard",category:"Health & Utility",footprint:"2x1",width:21,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"fireplace_safety_guard.png"},
    {id:"flat96_folding_room_divider",file:"folding_room_divider.png",name:"Folding Room Divider",category:"Health & Utility",footprint:"2x1",width:21,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"folding_room_divider.png"},
    {id:"flat96_harness_rack",file:"harness_rack.png",name:"Harness Rack",category:"Health & Utility",footprint:"2x1",width:19,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"harness_rack.png"},
    {id:"flat96_herb_plant_stand",file:"herb_plant_stand.png",name:"Herb Plant Stand",category:"Health & Utility",footprint:"2x1",width:18,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"herb_plant_stand.png"},
    {id:"flat96_mechanical_weighing_scale",file:"mechanical_weighing_scale.png",name:"Mechanical Weighing Scale",category:"Health & Utility",footprint:"2x1",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"mechanical_weighing_scale.png"},
    {id:"flat96_padded_examination_table",file:"padded_examination_table.png",name:"Padded Examination Table",category:"Health & Utility",footprint:"2x1",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"padded_examination_table.png"},
    {id:"flat96_planted_aquarium_cabinet",file:"planted_aquarium_cabinet.png",name:"Planted Aquarium Cabinet",category:"Health & Utility",footprint:"2x1",width:21,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"planted_aquarium_cabinet.png"},
    {id:"flat96_rehab_stretch_platform",file:"rehab_stretch_platform.png",name:"Rehab Stretch Platform",category:"Health & Utility",footprint:"2x1",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"rehab_stretch_platform.png"},
    {id:"flat96_sewing_repair_workbench",file:"sewing_repair_workbench.png",name:"Sewing Repair Workbench",category:"Health & Utility",footprint:"2x1",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"sewing_repair_workbench.png"},
    {id:"flat96_treasure_display_cabinet",file:"treasure_display_cabinet.png",name:"Treasure Display Cabinet",category:"Health & Utility",footprint:"2x1",width:19,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"treasure_display_cabinet.png"},
    {id:"flat96_arcane_alchemy_workbench",file:"arcane_alchemy_workbench.png",name:"Arcane Alchemy Workbench",category:"Kitchen",footprint:"2x1",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"arcane_alchemy_workbench.png"},
    {id:"flat96_aurelia_dining_buffet",file:"aurelia_dining_buffet.png",name:"Aurelia Dining Buffet",category:"Kitchen",footprint:"2x1",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"aurelia_dining_buffet.png"},
    {id:"flat96_blackglass_cooking_range",file:"blackglass_cooking_range.png",name:"Blackglass Cooking Range",category:"Kitchen",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"blackglass_cooking_range.png"},
    {id:"flat96_coastal_tiled_sink",file:"coastal_tiled_sink.png",name:"Coastal Tiled Sink",category:"Kitchen",footprint:"2x1",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"coastal_tiled_sink.png"},
    {id:"flat96_cottage_pantry_hutch",file:"cottage_pantry_hutch.png",name:"Cottage Pantry Hutch",category:"Kitchen",footprint:"2x1",width:20,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"cottage_pantry_hutch.png"},
    {id:"flat96_elven_herb_counter",file:"elven_herb_counter.png",name:"Elven Herb Counter",category:"Kitchen",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"elven_herb_counter.png"},
    {id:"flat96_nordic_stone_stove",file:"nordic_stone_stove.png",name:"Nordic Stone Stove",category:"Kitchen",footprint:"2x1",width:18,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"nordic_stone_stove.png"},
    {id:"flat96_zafir_spice_dresser",file:"zafir_spice_dresser.png",name:"Zafir Spice Dresser",category:"Kitchen",footprint:"2x1",width:20,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"zafir_spice_dresser.png"},
    {id:"flat96_arcane_crystal_lamp",file:"arcane_crystal_lamp.png",name:"Arcane Crystal Lamp",category:"Lighting",footprint:"1x1",width:11,blocking:false,wall:false,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"arcane_crystal_lamp.png"},
    {id:"flat96_aurelia_candelabrum",file:"aurelia_candelabrum.png",name:"Aurelia Candelabrum",category:"Lighting",footprint:"1x1",width:13,blocking:false,wall:false,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"aurelia_candelabrum.png"},
    {id:"flat96_blackglass_pipe_heater",file:"blackglass_pipe_heater.png",name:"Blackglass Pipe Heater",category:"Lighting",footprint:"1x1",width:17,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"blackglass_pipe_heater.png"},
    {id:"flat96_coastal_blue_lantern_stand",file:"coastal_blue_lantern_stand.png",name:"Coastal Blue Lantern Stand",category:"Lighting",footprint:"1x1",width:12,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"coastal_blue_lantern_stand.png"},
    {id:"flat96_cottage_amber_floor_lamp",file:"cottage_amber_floor_lamp.png",name:"Cottage Amber Floor Lamp",category:"Lighting",footprint:"1x1",width:9,blocking:false,wall:false,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"cottage_amber_floor_lamp.png"},
    {id:"flat96_elven_leaf_crystal_lamp",file:"elven_leaf_crystal_lamp.png",name:"Elven Leaf Crystal Lamp",category:"Lighting",footprint:"1x1",width:10,blocking:false,wall:false,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"elven_leaf_crystal_lamp.png"},
    {id:"flat96_nordic_iron_brazier",file:"nordic_iron_brazier.png",name:"Nordic Iron Brazier",category:"Lighting",footprint:"1x1",width:15,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"nordic_iron_brazier.png"},
    {id:"flat96_zafir_brass_standing_lamp",file:"zafir_brass_standing_lamp.png",name:"Zafir Brass Standing Lamp",category:"Lighting",footprint:"1x1",width:10,blocking:false,wall:false,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"zafir_brass_standing_lamp.png"},
    {id:"flat96_arcane_scrying_mirror",file:"arcane_scrying_mirror.png",name:"Arcane Scrying Mirror",category:"Mirrors",footprint:"1x1",width:14,blocking:false,wall:true,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"arcane_scrying_mirror.png"},
    {id:"flat96_blackglass_riveted_mirror",file:"blackglass_riveted_mirror.png",name:"Blackglass Riveted Mirror",category:"Mirrors",footprint:"1x1",width:15,blocking:false,wall:true,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"blackglass_riveted_mirror.png"},
    {id:"flat96_coastal_rope_wall_mirror",file:"coastal_rope_wall_mirror.png",name:"Coastal Rope Wall Mirror",category:"Mirrors",footprint:"1x1",width:17,blocking:false,wall:true,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"coastal_rope_wall_mirror.png"},
    {id:"flat96_cottage_oval_dressing_mirror",file:"cottage_oval_dressing_mirror.png",name:"Cottage Oval Dressing Mirror",category:"Mirrors",footprint:"1x1",width:15,blocking:false,wall:true,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"cottage_oval_dressing_mirror.png"},
    {id:"flat96_elven_leaf_wall_mirror",file:"elven_leaf_wall_mirror.png",name:"Elven Leaf Wall Mirror",category:"Mirrors",footprint:"1x1",width:14,blocking:false,wall:true,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"elven_leaf_wall_mirror.png"},
    {id:"flat96_nordic_full_length_mirror",file:"nordic_full_length_mirror.png",name:"Nordic Full Length Mirror",category:"Mirrors",footprint:"1x1",width:15,blocking:false,wall:true,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"nordic_full_length_mirror.png"},
    {id:"flat96_zafir_mosaic_arch_mirror",file:"zafir_mosaic_arch_mirror.png",name:"Zafir Mosaic Arch Mirror",category:"Mirrors",footprint:"1x1",width:15,blocking:false,wall:true,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"zafir_mosaic_arch_mirror.png"},
    {id:"flat96_arcane_constellation_rug",file:"arcane_constellation_rug.png",name:"Arcane Constellation Rug",category:"Rugs",footprint:"3x2",width:35,blocking:false,wall:false,rug:true,futurePet:false,halfW:0.14,halfH:0.055,src:ROOT+'furniture/flat96/'+"arcane_constellation_rug.png"},
    {id:"flat96_aurelia_sunburst_carpet",file:"aurelia_sunburst_carpet.png",name:"Aurelia Sunburst Carpet",category:"Rugs",footprint:"3x2",width:35,blocking:false,wall:false,rug:true,futurePet:false,halfW:0.14,halfH:0.055,src:ROOT+'furniture/flat96/'+"aurelia_sunburst_carpet.png"},
    {id:"flat96_blackglass_geometric_rug",file:"blackglass_geometric_rug.png",name:"Blackglass Geometric Rug",category:"Rugs",footprint:"3x2",width:35,blocking:false,wall:false,rug:true,futurePet:false,halfW:0.14,halfH:0.055,src:ROOT+'furniture/flat96/'+"blackglass_geometric_rug.png"},
    {id:"flat96_coastal_wave_rug",file:"coastal_wave_rug.png",name:"Coastal Wave Rug",category:"Rugs",footprint:"3x2",width:35,blocking:false,wall:false,rug:true,futurePet:false,halfW:0.14,halfH:0.055,src:ROOT+'furniture/flat96/'+"coastal_wave_rug.png"},
    {id:"flat96_cottage_braided_oval_rug",file:"cottage_braided_oval_rug.png",name:"Cottage Braided Oval Rug",category:"Rugs",footprint:"3x2",width:35,blocking:false,wall:false,rug:true,futurePet:false,halfW:0.14,halfH:0.055,src:ROOT+'furniture/flat96/'+"cottage_braided_oval_rug.png"},
    {id:"flat96_elven_leaf_rug",file:"elven_leaf_rug.png",name:"Elven Leaf Rug",category:"Rugs",footprint:"3x2",width:35,blocking:false,wall:false,rug:true,futurePet:false,halfW:0.14,halfH:0.055,src:ROOT+'furniture/flat96/'+"elven_leaf_rug.png"},
    {id:"flat96_nordic_knot_runner",file:"nordic_knot_runner.png",name:"Nordic Knot Runner",category:"Rugs",footprint:"3x2",width:35,blocking:false,wall:false,rug:true,futurePet:false,halfW:0.14,halfH:0.055,src:ROOT+'furniture/flat96/'+"nordic_knot_runner.png"},
    {id:"flat96_zafir_flatwoven_carpet",file:"zafir_flatwoven_carpet.png",name:"Zafir Flatwoven Carpet",category:"Rugs",footprint:"3x2",width:35,blocking:false,wall:false,rug:true,futurePet:false,halfW:0.14,halfH:0.055,src:ROOT+'furniture/flat96/'+"zafir_flatwoven_carpet.png"},
    {id:"flat96_aurelia_upholstered_bench",file:"aurelia_upholstered_bench.png",name:"Aurelia Upholstered Bench",category:"Seating",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"aurelia_upholstered_bench.png"},
    {id:"flat96_blackglass_iron_sofa",file:"blackglass_iron_sofa.png",name:"Blackglass Iron Sofa",category:"Seating",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"blackglass_iron_sofa.png"},
    {id:"flat96_cottage_moss_loveseat",file:"cottage_moss_loveseat.png",name:"Cottage Moss Loveseat",category:"Seating",footprint:"2x1",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"cottage_moss_loveseat.png"},
    {id:"flat96_elven_branchwork_chaise",file:"elven_branchwork_chaise.png",name:"Elven Branchwork Chaise",category:"Seating",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"elven_branchwork_chaise.png"},
    {id:"flat96_guildhall_timber_settle",file:"guildhall_timber_settle.png",name:"Guildhall Timber Settle",category:"Seating",footprint:"2x1",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"guildhall_timber_settle.png"},
    {id:"flat96_nordic_wingback_chair",file:"nordic_wingback_chair.png",name:"Nordic Wingback Chair",category:"Seating",footprint:"1x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.045,halfH:0.025,src:ROOT+'furniture/flat96/'+"nordic_wingback_chair.png"},
    {id:"flat96_zafir_floor_lounge",file:"zafir_floor_lounge.png",name:"Zafir Floor Lounge",category:"Seating",footprint:"2x1",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"zafir_floor_lounge.png"},
    {id:"flat96_arcane_potion_book_shelf",file:"arcane_potion_book_shelf.png",name:"Arcane Potion Book Shelf",category:"Storage",footprint:"2x1",width:18,blocking:true,wall:true,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"arcane_potion_book_shelf.png"},
    {id:"flat96_aurelia_display_cabinet",file:"aurelia_display_cabinet.png",name:"Aurelia Display Cabinet",category:"Storage",footprint:"2x1",width:17,blocking:true,wall:true,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"aurelia_display_cabinet.png"},
    {id:"flat96_blackglass_locker",file:"blackglass_locker.png",name:"Blackglass Locker",category:"Storage",footprint:"2x1",width:17,blocking:true,wall:true,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"blackglass_locker.png"},
    {id:"flat96_coastal_blue_sea_chest",file:"coastal_blue_sea_chest.png",name:"Coastal Blue Sea Chest",category:"Storage",footprint:"2x1",width:20,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"coastal_blue_sea_chest.png"},
    {id:"flat96_cottage_blanket_chest",file:"cottage_blanket_chest.png",name:"Cottage Blanket Chest",category:"Storage",footprint:"2x1",width:19,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"cottage_blanket_chest.png"},
    {id:"flat96_elven_open_bookcase",file:"elven_open_bookcase.png",name:"Elven Open Bookcase",category:"Storage",footprint:"2x1",width:19,blocking:true,wall:true,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"elven_open_bookcase.png"},
    {id:"flat96_nordic_timber_wardrobe",file:"nordic_timber_wardrobe.png",name:"Nordic Timber Wardrobe",category:"Storage",footprint:"2x1",width:18,blocking:true,wall:true,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"nordic_timber_wardrobe.png"},
    {id:"flat96_zafir_mosaic_cabinet",file:"zafir_mosaic_cabinet.png",name:"Zafir Mosaic Cabinet",category:"Storage",footprint:"2x1",width:17,blocking:true,wall:true,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"zafir_mosaic_cabinet.png"},
    {id:"flat96_arcane_scholar_desk",file:"arcane_scholar_desk.png",name:"Arcane Scholar Desk",category:"Tables & Desks",footprint:"2x1",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"arcane_scholar_desk.png"},
    {id:"flat96_aurelia_marble_console",file:"aurelia_marble_console.png",name:"Aurelia Marble Console",category:"Tables & Desks",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"aurelia_marble_console.png"},
    {id:"flat96_aurelia_sun_vanity",file:"aurelia_sun_vanity.png",name:"Aurelia Sun Vanity",category:"Tables & Desks",footprint:"2x1",width:20,blocking:true,wall:true,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"aurelia_sun_vanity.png"},
    {id:"flat96_blackglass_workshop_table",file:"blackglass_workshop_table.png",name:"Blackglass Workshop Table",category:"Tables & Desks",footprint:"2x1",width:25,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"blackglass_workshop_table.png"},
    {id:"flat96_coastal_round_game_table",file:"coastal_round_game_table.png",name:"Coastal Round Game Table",category:"Tables & Desks",footprint:"2x1",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"coastal_round_game_table.png"},
    {id:"flat96_cottage_trestle_table",file:"cottage_trestle_table.png",name:"Cottage Trestle Table",category:"Tables & Desks",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"cottage_trestle_table.png"},
    {id:"flat96_elven_writing_desk",file:"elven_writing_desk.png",name:"Elven Writing Desk",category:"Tables & Desks",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"elven_writing_desk.png"},
    {id:"flat96_nordic_slab_table",file:"nordic_slab_table.png",name:"Nordic Slab Table",category:"Tables & Desks",footprint:"2x1",width:24,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"nordic_slab_table.png"},
    {id:"flat96_zafir_low_tea_table",file:"zafir_low_tea_table.png",name:"Zafir Low Tea Table",category:"Tables & Desks",footprint:"2x1",width:21,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"zafir_low_tea_table.png"},
    {id:"flat96_activity_perch_tree",file:"activity_perch_tree.png",name:"Activity Perch Tree",category:"Training & Toys",footprint:"2x1",width:20,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"activity_perch_tree.png"},
    {id:"flat96_adjustable_jump_rail",file:"adjustable_jump_rail.png",name:"Adjustable Jump Rail",category:"Training & Toys",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"adjustable_jump_rail.png"},
    {id:"flat96_balance_beam",file:"balance_beam.png",name:"Balance Beam",category:"Training & Toys",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"balance_beam.png"},
    {id:"flat96_climbing_ramp",file:"climbing_ramp.png",name:"Climbing Ramp",category:"Training & Toys",footprint:"2x1",width:21,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"climbing_ramp.png"},
    {id:"flat96_rolling_ball_activity_track",file:"rolling_ball_activity_track.png",name:"Rolling Ball Activity Track",category:"Training & Toys",footprint:"2x1",width:23,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"rolling_ball_activity_track.png"},
    {id:"flat96_rope_tug_post",file:"rope_tug_post.png",name:"Rope Tug Post",category:"Training & Toys",footprint:"2x1",width:18,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"rope_tug_post.png"},
    {id:"flat96_training_hoop",file:"training_hoop.png",name:"Training Hoop",category:"Training & Toys",footprint:"2x1",width:15,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"training_hoop.png"},
    {id:"flat96_treat_puzzle_chest",file:"treat_puzzle_chest.png",name:"Treat Puzzle Chest",category:"Training & Toys",footprint:"2x1",width:22,blocking:true,wall:false,rug:false,futurePet:false,halfW:0.075,halfH:0.03,src:ROOT+'furniture/flat96/'+"treat_puzzle_chest.png"}
  ];
  const ITEMS=[...RAW_ITEMS.map(metaFor),...FLAT96_ITEMS];
  const ITEM_BY_ID=new Map(ITEMS.map(item=>[item.id,item]));
  const CATEGORIES=['All','Beds','Seating','Tables & Desks','Storage','Mirrors','Lighting','Kitchen','Bathing','Training & Toys','Health & Utility','Rugs','Decor','Pet Care'];
  const KEEPER_SHEETS=[
    {id:'covidpanda',label:'covidpanda'},
    {id:'emlux',label:'emlux'},
    {id:'kat',label:'kat'},
    {id:'proco',label:'Proco'},
    {id:'smokedrope1028',label:'SmokedRope1028'},
    {id:'catasthma',label:'CatAsthma'}
  ];
  const ACCOUNT_KEEPER_MAP={
    covidpanda:'covidpanda',
    emlux:'emlux',
    kat:'kat',
    proco:'proco',
    smokedrope1028:'smokedrope1028',
    catasthma:'catasthma'
  };
  function normaliseUsername(name){return String(name||'guest').trim().toLowerCase().replace(/[^a-z0-9]/g,'');}
  function usernameHash(name){const input=normaliseUsername(name);let h=2166136261>>>0;for(let i=0;i<input.length;i++){h^=input.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function keeperIdForUser(name){const key=normaliseUsername(name);return ACCOUNT_KEEPER_MAP[key]||KEEPER_SHEETS[usernameHash(key)%KEEPER_SHEETS.length].id;}
  function defaultPlayerForUser(name){return {x:.50,y:.83,dir:'down',sheetId:keeperIdForUser(name),pose:'idle'};}
  function keeperSheetById(id){return KEEPER_SHEETS.find(s=>s.id===id)||KEEPER_SHEETS.find(s=>s.id===keeperIdForUser(currentUsername()))||KEEPER_SHEETS[0];}
  function keeperFrameSrc(sheetId,row,col){return `${ROOT}keepers/${sheetId}/r${row}_c${col}.png?v=${VERSION}`;}
  function preloadKeeperFrames(sheetId){for(let row=0;row<5;row++)for(let col=0;col<4;col++){const img=new Image();img.src=keeperFrameSrc(sheetId,row,col);}}

  const AVATAR_ROOT=ROOT+'ui/account-avatars/';
  const AVATAR_FRAME_SRC=ROOT+'ui/avatar-window-frame.png';
  // Exact account/avatar mapping supplied for V33.23.
  const ACCOUNT_AVATAR_MAP={
    catasthma:{key:'character_01_male_brown_hoodie',label:'CatAsthma'},
    emlux:{key:'character_02_female_blonde_mauve',label:'Emlux'},
    kat:{key:'character_03_female_brunette_white',label:'Kat'},
    covidpanda:{key:'character_04_male_masked_white',label:'CovidPanda'},
    proco:{key:'character_05_female_red_warrior',label:'Proco'},
    smokedrope1028:{key:'character_06_female_hooded_assassin',label:'SmokedRope1028'}
  };
  const AVATAR_SEQUENCES={
    idle:[1,1,2,2,1,3,4,5,1,6,1,7,8,1],
    command:[1,2,1,6,1,7,1,2,5,8],
    speak:[1,2,3,4,5,1,2,6,1,7,8],
    pet:[1,2,5,1,6,1,5,8],
    sleep:[4,4,4,4,5,4,4,4],
    bedroom:[1,2,1,5,1,8]
  };
  const AVATAR_INTERVALS={idle:.16,command:.11,speak:.115,pet:.14,sleep:.44,bedroom:.155};
  const AVATAR_BADGES={idle:'',command:'COMMAND',speak:'TALKING',pet:'PETTING',sleep:'RESTING',bedroom:'RELAXING'};
  const avatarFrameSrc=(profileKey,frame)=>`${AVATAR_ROOT}${profileKey}/${profileKey}_frame_${String(frame).padStart(2,'0')}.png?v=${VERSION}`;
  function avatarProfileForUser(name){const keeper=keeperIdForUser(name);return ACCOUNT_AVATAR_MAP[keeper]||ACCOUNT_AVATAR_MAP[KEEPER_SHEETS[0].id];}
  function avatarElementVisible(el){
    if(!el||!el.isConnected)return false;
    // A child can have opacity:1 while its closed overlay is still invisible.
    for(let node=el;node;node=node.parentElement){
      if(node.hidden||node.getAttribute('aria-hidden')==='true')return false;
      const style=window.getComputedStyle(node);
      if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity||1)<.05)return false;
    }
    const rect=el.getBoundingClientRect();
    if(rect.width<50||rect.height<24)return false;
    if(rect.right<0||rect.bottom<0||rect.left>window.innerWidth||rect.top>window.innerHeight)return false;
    return true;
  }
  function avatarVisibleCommandAnchor(){
    // V34.46.4: CommandManager mounts this exact button on <body>. Generic
    // button scoring also matched ordinary dashboard controls in the lower
    // left, bringing the bedroom portrait back over the Repo Passport.
    const dragonbound=document.getElementById('dragonboundOverlay');
    if(!dragonbound?.classList.contains('is-open')||dragonbound.getAttribute('aria-hidden')==='true')return null;
    const home=dragonbound.querySelector('.dragonbound-home-scene.is-visible');
    if(!home||!avatarElementVisible(home))return null;
    const button=document.querySelector('button.dragonbound-command-button');
    return avatarElementVisible(button)?button:null;
  }
  function ensureAvatarHud(){
    if(avatarHud?.isConnected)return avatarHud;
    if(!avatarStyleEl){
      avatarStyleEl=document.createElement('style');
      avatarStyleEl.id='velmoraBedroomAvatarHudStyles';
      avatarStyleEl.textContent=`
      .velmora-account-avatar-hud{position:fixed;left:18px;bottom:96px;width:122px;height:122px;z-index:2147481600;pointer-events:none;opacity:1;transform:translate3d(0,0,0);transition:left .2s ease,top .2s ease,bottom .2s ease,opacity .18s ease,transform .18s ease;filter:drop-shadow(0 12px 22px rgba(0,0,0,.52));}
      .velmora-account-avatar-hud.is-hidden,.velmora-account-avatar-hud[hidden]{display:none!important;opacity:0;transform:translate3d(0,8px,0)}
      .velmora-account-avatar-shell{position:absolute;inset:0}
      .velmora-account-avatar-portrait-wrap{position:absolute;left:15px;top:14px;width:92px;height:92px;border-radius:50%;overflow:hidden;display:grid;place-items:center}
      .velmora-account-avatar-portrait-wrap::before{content:'';position:absolute;inset:7px;border-radius:50%;background:radial-gradient(circle at 50% 38%,rgba(86,132,138,.28),rgba(15,31,35,.08) 56%,rgba(4,8,10,0) 73%);box-shadow:inset 0 0 0 1px rgba(147,208,217,.12);}
      .velmora-account-avatar-portrait{position:relative;z-index:1;display:block;width:88px;height:88px;object-fit:contain;image-rendering:pixelated;transform-origin:50% 70%;}
      .velmora-account-avatar-frame{position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:auto;pointer-events:none}
      .velmora-account-avatar-badge{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);padding:5px 9px 4px;border-radius:999px;border:1px solid rgba(197,157,74,.68);background:linear-gradient(180deg,rgba(14,46,52,.94),rgba(5,20,24,.96));box-shadow:0 5px 16px rgba(0,0,0,.38);color:#e6d8a1;font:800 8px/1 'Trebuchet MS',Arial,sans-serif;letter-spacing:.9px;white-space:nowrap;opacity:0;transition:opacity .16s ease,transform .16s ease}
      .velmora-account-avatar-hud[data-mode='command'] .velmora-account-avatar-badge,.velmora-account-avatar-hud[data-mode='speak'] .velmora-account-avatar-badge,.velmora-account-avatar-hud[data-mode='pet'] .velmora-account-avatar-badge,.velmora-account-avatar-hud[data-mode='sleep'] .velmora-account-avatar-badge{opacity:1;transform:translateX(-50%) translateY(0)}
      .velmora-account-avatar-label{position:absolute;left:50%;top:100%;margin-top:4px;transform:translateX(-50%);padding:2px 6px;border-radius:8px;background:rgba(4,17,21,.86);border:1px solid rgba(86,138,149,.2);color:#95bfc4;font:700 8px/1.1 Arial,sans-serif;letter-spacing:.6px;opacity:.9;white-space:nowrap}
      .velmora-account-avatar-hud[data-mode='command']{filter:drop-shadow(0 14px 24px rgba(0,0,0,.58)) drop-shadow(0 0 12px rgba(86,177,238,.18));}
      .velmora-account-avatar-hud[data-mode='pet']{filter:drop-shadow(0 14px 24px rgba(0,0,0,.58)) drop-shadow(0 0 12px rgba(216,180,102,.16));}
      .velmora-account-avatar-hud[data-mode='speak']{filter:drop-shadow(0 14px 24px rgba(0,0,0,.58)) drop-shadow(0 0 12px rgba(108,210,197,.15));}
      .velmora-account-avatar-hud[data-mode='sleep']{filter:drop-shadow(0 12px 22px rgba(0,0,0,.45));opacity:.96}
      @media(max-width:760px){.velmora-account-avatar-hud{width:118px;height:118px;left:12px;bottom:84px}.velmora-account-avatar-portrait-wrap{left:14px;top:13px;width:88px;height:88px}.velmora-account-avatar-portrait{width:84px;height:84px}.velmora-account-avatar-badge{bottom:10px;font-size:7px;padding:4px 7px 3px}.velmora-account-avatar-label{display:none}}
      @media(prefers-reduced-motion:reduce){.velmora-account-avatar-hud{transition:none}.velmora-account-avatar-badge{transition:none}}`;
      document.head.appendChild(avatarStyleEl);
    }
    avatarHud=document.createElement('div');
    avatarHud.className='velmora-account-avatar-hud is-hidden';
    avatarHud.hidden=true;
    avatarHud.setAttribute('aria-hidden','true');
    avatarHud.dataset.mode='idle';
    avatarHud.innerHTML=`<div class="velmora-account-avatar-shell"><div class="velmora-account-avatar-portrait-wrap"><img class="velmora-account-avatar-portrait" alt="Account avatar portrait"></div><img class="velmora-account-avatar-frame" alt="" aria-hidden="true"><div class="velmora-account-avatar-badge"></div><div class="velmora-account-avatar-label"></div></div>`;
    document.body.appendChild(avatarHud);
    avatarPortraitEl=avatarHud.querySelector('.velmora-account-avatar-portrait');
    avatarFrameEl=avatarHud.querySelector('.velmora-account-avatar-frame');
    avatarBadgeEl=avatarHud.querySelector('.velmora-account-avatar-badge');
    avatarLabelEl=avatarHud.querySelector('.velmora-account-avatar-label');
    avatarFrameEl.src=`${AVATAR_FRAME_SRC}?v=${VERSION}`;
    updateAvatarProfile(true);
    updateAvatarAnchor();
    return avatarHud;
  }
  function updateAvatarProfile(force=false){
    if(!avatarHud)ensureAvatarHud();
    const user=currentUsername();
    if(user==='guest'){ if(avatarHud)avatarHud.classList.add('is-hidden'); return; }
    const profile=avatarProfileForUser(user);
    const key=profile?.key||ACCOUNT_AVATAR_MAP[KEEPER_SHEETS[0].id].key;
    if(force||avatarCurrentKey!==key){
      avatarCurrentKey=key;
      avatarFrameIndex=0;avatarFrameTimer=0;avatarCurrentSrc='';
      if(avatarLabelEl)avatarLabelEl.textContent=profile?.label||user;
      for(let i=1;i<=8;i++){const img=new Image();img.src=avatarFrameSrc(key,i);}
    }else if(avatarLabelEl){avatarLabelEl.textContent=profile?.label||user;}
    renderAvatarFrame(force);
  }
  function renderAvatarFrame(force=false){
    if(!avatarPortraitEl||!avatarCurrentKey)return;
    const mode=avatarMode();
    const seq=AVATAR_SEQUENCES[mode]||AVATAR_SEQUENCES.idle;
    const frame=seq[Math.max(0,Math.min(seq.length-1,avatarFrameIndex))]||1;
    const src=avatarFrameSrc(avatarCurrentKey,frame);
    if(force||avatarCurrentSrc!==src){avatarCurrentSrc=src;avatarPortraitEl.src=src;}
    if(avatarHud){avatarHud.dataset.mode=mode;}
    if(avatarBadgeEl)avatarBadgeEl.textContent=AVATAR_BADGES[mode]||'';
  }
  function updateAvatarAnchor(){
    if(!avatarHud)return;
    const launcher=avatarVisibleCommandAnchor();

    // Main Dragonbound menu / adoption / travel screens have no Commands launcher:
    // the avatar must not appear there. My Bedroom is allowed a quiet lower-left
    // fallback because command controls are intentionally hidden inside that scene.
    const shouldShow=currentUsername()!=='guest'&&(!!launcher||open);
    avatarHud.classList.toggle('is-hidden',!shouldShow);
    if(avatarHud.hidden===shouldShow)avatarHud.hidden=!shouldShow;
    const ariaHidden=String(!shouldShow);
    if(avatarHud.getAttribute('aria-hidden')!==ariaHidden)avatarHud.setAttribute('aria-hidden',ariaHidden);
    if(!shouldShow)return;

    if(launcher){
      const rect=launcher.getBoundingClientRect();
      const width=avatarHud.offsetWidth||122;
      const height=avatarHud.offsetHeight||122;
      const left=Math.max(10,Math.min(window.innerWidth-width-10,rect.left+(rect.width-width)/2));
      const top=Math.max(10,rect.top-height-22);
      avatarHud.style.left=`${Math.round(left)}px`;
      avatarHud.style.top=`${Math.round(top)}px`;
      avatarHud.style.bottom='auto';
      return;
    }

    // Bedroom-only fallback; never used on the Dragonbound title/menu screen.
    avatarHud.style.left=window.innerWidth<=760?'12px':'18px';
    avatarHud.style.top='auto';
    avatarHud.style.bottom=window.innerWidth<=760?'18px':'22px';
  }
  function setAvatarMood(mode,duration=1800){avatarPinnedMode=mode||'';avatarPinnedUntil=Date.now()+Math.max(0,duration||0);renderAvatarFrame();}
  function avatarMode(){
    if(open&&state.player?.pose==='sleep')return 'sleep';
    if(avatarPinnedMode&&Date.now()<avatarPinnedUntil)return avatarPinnedMode;
    if(petMenuOpen||petHovering)return 'pet';
    if(open)return 'bedroom';
    return 'idle';
  }
  function handleAvatarInteraction(target){
    const el=target?.closest?.('button,[role="button"],a,[data-bedroom-pet],.dragonbound-command-float,.dragonbound-command-menu,.dragonbound-command-live-hud');
    if(!el)return;
    const text=((el.getAttribute?.('aria-label')||'')+' '+(el.getAttribute?.('title')||'')+' '+(el.textContent||'')).toLowerCase();
    if(el===petEl||el.closest?.('[data-bedroom-pet-menu]')||text.includes(' pet')||text.includes('pet ')||text.includes('companion')){setAvatarMood('pet',2400);return;}
    if(text.includes('command')||text.includes('inventory')||text.includes('travel')||text.includes('build')||text.includes('dragonbound book')||text.includes('book')){setAvatarMood('command',2200);return;}
    if(text.includes('talk')||text.includes('speak')||text.includes('chat')||text.includes('continue')||text.includes('interact')||text.includes('bonnie')||text.includes('mira')||text.includes('adopt')){setAvatarMood('speak',2200);return;}
  }
  function tickAvatar(ts){
    if(!avatarHud?.isConnected){avatarRaf=0;return;}
    if(document.hidden){avatarLastTick=ts;avatarRaf=requestAnimationFrame(tickAvatar);return;}
    updateAvatarProfile();updateAvatarAnchor();
    const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mode=avatarMode();
    const seq=AVATAR_SEQUENCES[mode]||AVATAR_SEQUENCES.idle;
    const interval=AVATAR_INTERVALS[mode]||.16;
    if(reduce){avatarFrameIndex=0;renderAvatarFrame(true);avatarRaf=requestAnimationFrame(tickAvatar);return;}
    if(!avatarLastTick)avatarLastTick=ts;
    const dt=Math.min(.08,(ts-avatarLastTick)/1000); avatarLastTick=ts;
    avatarFrameTimer+=dt;
    if(avatarFrameTimer>=interval){avatarFrameTimer=0;avatarFrameIndex=(avatarFrameIndex+1)%seq.length;renderAvatarFrame();}
    else if(avatarHud.dataset.mode!==mode){renderAvatarFrame(true);}
    avatarRaf=requestAnimationFrame(tickAvatar);
  }
  function startAvatarLoop(){ensureAvatarHud();updateAvatarProfile(true);updateAvatarAnchor();if(!avatarRaf){avatarLastTick=0;avatarRaf=requestAnimationFrame(tickAvatar);}}

  function roomFloor(){return ROOM_FLOORS[state.roomId]||ROOM_FLOORS.nordic_timber;}
  function pointInPolygon(x,y,poly=roomFloor()){
    let inside=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const xi=poly[i][0], yi=poly[i][1], xj=poly[j][0], yj=poly[j][1];
      const intersect=((yi>y)!==(yj>y)) && x < (xj-xi)*(y-yi)/(yj-yi+1e-9)+xi;
      if(intersect)inside=!inside;
    }
    return inside;
  }
  function floorBoundsAtY(y,poly=roomFloor()){
    const xs=[];
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[j],b=poly[i];
      if((a[1]<=y&&b[1]>=y)||(b[1]<=y&&a[1]>=y)){
        if(Math.abs(b[1]-a[1])<1e-9){xs.push(a[0],b[0]);continue;}
        const t=(y-a[1])/(b[1]-a[1]);
        if(t>=0&&t<=1)xs.push(a[0]+(b[0]-a[0])*t);
      }
    }
    xs.sort((a,b)=>a-b);
    return xs.length>=2?[xs[0],xs[xs.length-1]]:[.12,.88];
  }
  function constrainPlacement(x,y,item,scale=1){
    if(!item)return {x:.5,y:.7,valid:false};
    const visualScale=clamp(scale||1,.5,1.85);
    // Wall-backed pieces sit against the rear wall, but can slide freely left/right.
    if(item.wall){
      const wallY=item.id==='lamp_01_hanging'?.49:.565;
      const margin=Math.max(.025,item.halfW*.64*visualScale);
      return {x:snap(clamp(x,.18+margin,.82-margin)),y:snap(wallY),valid:true};
    }
    // Furniture anchors by its bottom centre. Clamp that ground point into the room polygon
    // instead of rejecting slightly-off pointer positions; this makes placement feel fluid.
    let cy=clamp(y,.515,.925-Math.min(.035,item.halfH*.25*visualScale));
    const [left,right]=floorBoundsAtY(cy);
    const margin=Math.max(.012,item.halfW*.58*visualScale);
    let minX=left+margin,maxX=right-margin;
    if(minX>maxX){const mid=(left+right)/2;minX=mid;maxX=mid;}
    const cx=clamp(x,minX,maxX);
    return {x:snap(cx),y:snap(cy),valid:pointInPolygon(cx,cy)};
  }
  function floorValid(x,y,item,scale=1){return constrainPlacement(x,y,item,scale).valid;}
  // Bedroom decorating deliberately allows tasteful overlap (rug under bed, bedside touching bed,
  // plants tucked behind furniture, etc.). The room boundary—not collision boxes—is authoritative.
  function overlaps(){return false;}

  let state={roomId:'nordic_timber',placements:[],player:defaultPlayerForUser('guest'),version:1,updatedAt:null};
  let overlay=null, stage=null, roomImg=null, placementLayer=null, playerEl=null, petEl=null, interactionHintEl=null, shopPanel=null, roomPanel=null, petPanel=null, launcher=null, transitionVeil=null, doorAudio=null;
  let editMode=false, placingItemId='', selectedId='', drag=null, saveTimer=0, open=false, transitioning=false, loadedForUser='', shopCategory='All', shopQuery='', petCategory='Cats';
  let keys={up:false,down:false,left:false,right:false}, raf=0, lastTick=0, playerFrameTimer=0, playerFrame=0, interactionTargetId='', actionTimer=0, sleepingPlacementId='', activeInteractionPlacementId='';
  let petState={selectedId:'',nickname:'',x:.43,y:.84,dir:'right',mode:'idle',frame:0,frameTimer:0,targetX:null,targetY:null,targetPlacementId:'',plannedKind:'',mountedPlacementId:'',actionUntil:0,nextDecisionAt:0,lastPlacementId:'',lastSavedAt:0};
  let loadedPetForUser='', petSaveTimer=0;
  let petHoverEl=null, petMenuEl=null, petMenuTitleEl=null, petMenuCopyEl=null, petNameInputEl=null, petNameEditEl=null, petMenuOpen=false, petHovering=false, petMenuTimer=0;
  let avatarHud=null, avatarFrameEl=null, avatarPortraitEl=null, avatarBadgeEl=null, avatarLabelEl=null, avatarStyleEl=null;
  let avatarRaf=0, avatarLastTick=0, avatarFrameIndex=0, avatarFrameTimer=0, avatarPinnedMode='', avatarPinnedUntil=0, avatarCurrentKey='', avatarCurrentSrc='';

  function currentUsername(){try{return String(character?.username||character?.displayName||'guest').trim()||'guest'}catch(_){return 'guest'}}
  function storageKey(){return `velmoraBedroom:v1:${currentUsername().toLowerCase()}`}
  function petStorageKey(){return `velmoraBedroomPet:v1:${currentUsername().toLowerCase()}`}
  function cleanPetName(value){return String(value||'').replace(/\s+/g,' ').trim().slice(0,24);}
  function petDisplayName(def=PET_BY_ID.get(petState.selectedId),includeBreed=false){
    if(!def)return '';
    const nickname=cleanPetName(petState.nickname||'');
    return nickname?(includeBreed?`${nickname} · ${def.name}`:nickname):def.name;
  }
  function normalisePetState(raw){
    const selected=PET_BY_ID.has(String(raw?.selectedId||''))?String(raw.selectedId):'';
    return {selectedId:selected,nickname:cleanPetName(raw?.nickname||''),x:clamp(raw?.x??.43,.12,.88),y:clamp(raw?.y??.84,.54,.92),dir:raw?.dir==='left'?'left':'right',mode:'idle',frame:0,frameTimer:0,targetX:null,targetY:null,targetPlacementId:'',plannedKind:'',mountedPlacementId:'',actionUntil:0,nextDecisionAt:Date.now()+900+Math.random()*1300,lastPlacementId:String(raw?.lastPlacementId||''),lastSavedAt:Date.now()};
  }
  function loadPetState(){
    const user=currentUsername();if(loadedPetForUser===user)return;loadedPetForUser=user;
    try{petState=normalisePetState(JSON.parse(localStorage.getItem(petStorageKey())||'null'));}catch(_){petState=normalisePetState(null);}
  }
  function writePetLocal(){
    try{localStorage.setItem(petStorageKey(),JSON.stringify({selectedId:petState.selectedId,nickname:cleanPetName(petState.nickname||''),x:Number((petState.x||.43).toFixed(4)),y:Number((petState.y||.84).toFixed(4)),dir:petState.dir||'right',lastPlacementId:petState.lastPlacementId||'',updatedAt:new Date().toISOString()}));petState.lastSavedAt=Date.now();}catch(_){}
  }
  function queuePetSave(){clearTimeout(petSaveTimer);petSaveTimer=setTimeout(writePetLocal,350);}
  function petFrameSrc(petId,anim,col){return `${ROOT}pets/${petId}/${anim}-${Math.max(0,Math.min(3,col|0))}.png?v=${VERSION}`;}
  function preloadPetFrames(petId){if(!PET_BY_ID.has(petId))return;for(const anim of ['idle','walk','sleep'])for(let col=0;col<4;col++){const img=new Image();img.src=petFrameSrc(petId,anim,col);}}
  function petIsInteractable(){return !!PET_BY_ID.get(petState.selectedId)&&open&&!editMode&&!placingItemId&&!shopPanel?.classList.contains('is-visible')&&!roomPanel?.classList.contains('is-visible')&&!petPanel?.classList.contains('is-visible');}
  function positionPetUi(){
    if(!stage)return;
    const left=`${clamp(petState.x,.10,.90)*100}%`;
    const hoverY=clamp(petState.y-(petState.mountedPlacementId?.12:.09),.14,.88);
    const menuY=clamp(petState.y-(petState.mountedPlacementId?.135:.105),.16,.86);
    if(petHoverEl){petHoverEl.style.left=left;petHoverEl.style.top=`${hoverY*100}%`;}
    if(petMenuEl){petMenuEl.style.left=left;petMenuEl.style.top=`${menuY*100}%`;}
  }
  function updatePetHover(){
    if(!petHoverEl)return;
    const def=PET_BY_ID.get(petState.selectedId);
    if(!def||!petIsInteractable()||petMenuOpen||!petHovering){petHoverEl.hidden=true;return;}
    petHoverEl.hidden=false;petHoverEl.textContent=`${petDisplayName(def)} · click`;positionPetUi();
  }
  function clearPetMenuTimer(){clearTimeout(petMenuTimer);petMenuTimer=0;}
  function schedulePetMenuClose(ms=2200){clearPetMenuTimer();petMenuTimer=setTimeout(()=>closePetMenu(),ms);}
  function closePetMenu(){
    clearPetMenuTimer();petMenuOpen=false;
    if(petMenuEl){petMenuEl.hidden=true;petMenuEl.classList.remove('is-naming');petMenuEl.setAttribute('aria-hidden','true');}
    updatePetHover();
  }
  function openPetMenu(){
    const def=PET_BY_ID.get(petState.selectedId);if(!def||!petMenuEl)return;
    petMenuOpen=true;petHovering=true;
    if(!petState.mountedPlacementId&&petState.mode==='walk'){petState.mode='idle';petState.targetX=null;petState.targetY=null;petState.targetPlacementId='';}
    if(petMenuTitleEl)petMenuTitleEl.textContent=petDisplayName(def,true);
    if(petMenuCopyEl)petMenuCopyEl.textContent=def.type==='cat'?'Cat companion':'Dog companion';
    if(petNameInputEl)petNameInputEl.value=cleanPetName(petState.nickname||'');
    petMenuEl.classList.remove('is-naming');petMenuEl.hidden=false;petMenuEl.setAttribute('aria-hidden','false');positionPetUi();updatePetHover();schedulePetMenuClose();
  }
  function beginPetRename(){
    if(!petMenuOpen||!petMenuEl)return;clearPetMenuTimer();petMenuEl.classList.add('is-naming');
    if(petNameInputEl){petNameInputEl.value=cleanPetName(petState.nickname||'');setTimeout(()=>petNameInputEl.focus(),0);}
  }
  function onPetPointerEnter(){if(!petIsInteractable())return;petHovering=true;updatePetHover();}
  function onPetPointerLeave(event){if(petMenuOpen&&petMenuEl?.contains?.(event?.relatedTarget))return;petHovering=false;updatePetHover();}
  function onPetClick(event){if(!petIsInteractable())return;event.preventDefault();event.stopPropagation();petEl?.blur?.();if(petMenuOpen){closePetMenu();return;}openPetMenu();}
  function savePetName(){
    const def=PET_BY_ID.get(petState.selectedId);if(!def)return;
    const next=cleanPetName(petNameInputEl?.value||'');petState.nickname=next;queuePetSave();renderPets();renderPet();
    if(petMenuCopyEl)petMenuCopyEl.textContent=next?`${next} the ${def.name}.`:`Using the breed name ${def.name}.`;
    if(petMenuTitleEl)petMenuTitleEl.textContent=petDisplayName(def,true);
    if(petMenuEl)petMenuEl.classList.remove('is-naming');notify(next?`${next} is now your bedroom pet's name.`:`Pet name cleared.`);schedulePetMenuClose(1400);
  }
  function petActivePet(){
    const def=PET_BY_ID.get(petState.selectedId);if(!def)return;
    if(!petState.mountedPlacementId&&petState.mode==='walk'){petState.mode='idle';petState.targetX=null;petState.targetY=null;petState.targetPlacementId='';}
    petState.actionUntil=Date.now()+1200;petState.nextDecisionAt=Date.now()+1800+Math.random()*1200;petState.frame=0;petState.frameTimer=0;renderPet();
    const name=petDisplayName(def);const reaction=def.type==='cat'?`${name} leans into your hand with a soft purr.`:`${name} happily leans in for a fuss.`;
    if(petMenuCopyEl)petMenuCopyEl.textContent=reaction;notify(`You gently pet ${name}.`);schedulePetMenuClose(850);
  }
  function dbClient(){try{return db||null}catch(_){return null}}
  function roomById(id){return ROOMS.find(room=>room.id===id)||ROOMS[0]}
  function normalizeState(raw){
    const out={roomId:ROOM_IDS.has(raw?.roomId)?raw.roomId:'nordic_timber',placements:[],player:defaultPlayerForUser(currentUsername()),version:1,updatedAt:raw?.updatedAt||null};
    const placements=Array.isArray(raw?.placements)?raw.placements:[];
    for(const p of placements.slice(0,240)){
      const item=ITEM_BY_ID.get(String(p?.assetId||'')); if(!item)continue;
      out.placements.push({id:String(p?.id||uid()),assetId:item.id,x:snap(clamp(p?.x,.05,.95)),y:snap(clamp(p?.y,.45,.94)),flipped:!!p?.flipped,scale:clamp(p?.scale||1,.5,1.85)});
    }
    const rawPlayer=raw?.player||{};
    const fallback=defaultPlayerForUser(currentUsername());
    const mapped=keeperIdForUser(currentUsername());
    const chosen=ACCOUNT_KEEPER_MAP[normaliseUsername(currentUsername())]?mapped:(KEEPER_SHEETS.some(s=>s.id===rawPlayer.sheetId)?rawPlayer.sheetId:mapped);
    out.player={x:snap(clamp(rawPlayer.x??fallback.x,.12,.88)),y:snap(clamp(rawPlayer.y??fallback.y,.54,.93)),dir:['up','down','left','right'].includes(rawPlayer.dir)?rawPlayer.dir:fallback.dir,sheetId:chosen,pose:'idle'};
    return out;
  }
  function readLocal(){try{return normalizeState(JSON.parse(localStorage.getItem(storageKey())||'null'))}catch(_){return normalizeState(null)}}
  function writeLocal(){try{localStorage.setItem(storageKey(),JSON.stringify({...state,updatedAt:new Date().toISOString()}))}catch(_){}}
  async function loadState(){
    const user=currentUsername();
    if(loadedForUser===user)return;
    loadedForUser=user;
    state=readLocal();
    const client=dbClient();
    if(client&&user!=='guest'){
      try{
        const {data,error}=await client.rpc('get_my_bedroom');
        if(!error&&Array.isArray(data)&&data[0]){
          const row=data[0];
          const remote=normalizeState({roomId:row.room_id,placements:row.placements,updatedAt:row.updated_at});
          const localTime=Date.parse(state.updatedAt||0)||0, remoteTime=Date.parse(remote.updatedAt||0)||0;
          if(remoteTime>=localTime){remote.player=state.player||remote.player;state=remote;}
          else queueSave();
          writeLocal();
        }
      }catch(error){console.warn('Bedroom account load fell back to local save.',error)}
    }
  }
  function queueSave(){
    writeLocal();
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveState,500);
  }
  async function saveState(){
    writeLocal();
    const client=dbClient(); if(!client||currentUsername()==='guest')return;
    try{
      const payload=state.placements.map(p=>({id:p.id,assetId:p.assetId,x:Number(p.x.toFixed(3)),y:Number(p.y.toFixed(3)),flipped:!!p.flipped,scale:Number(p.scale.toFixed(2))}));
      const {error}=await client.rpc('save_my_bedroom',{p_room_id:state.roomId,p_placements:payload});
      if(error)throw error;
      state.updatedAt=new Date().toISOString();writeLocal();
      setSaveStatus('Saved to your account');
    }catch(error){console.warn('Bedroom server save failed; local copy kept.',error);setSaveStatus('Saved on this device');}
  }
  function setSaveStatus(text){
    const el=overlay?.querySelector('[data-bedroom-save]'); if(!el)return;
    el.textContent=text; clearTimeout(el._timer); el._timer=setTimeout(()=>{if(el.isConnected)el.textContent='Room changes save automatically';},2400);
  }

  function ensureLauncher(){
    const sidebar=document.querySelector('#dragonboundOverlay .dragonbound-home-sidebar');
    if(!sidebar)return false;
    let button=sidebar.querySelector('.velmora-bedroom-launcher');
    // V33.03 intentionally uses an image element instead of a <button>; older global button hover
    // rules could paint a brown rectangle behind the transparent artwork.
    if(button&&button.tagName!=='IMG'){button.remove();button=null;}
    if(!button){
      button=document.createElement('img');
      button.className='velmora-bedroom-launcher';button.src=`${ROOT}ui/my_bedroom_button.png?v=${VERSION}`;button.alt='My Bedroom';
      button.setAttribute('role','button');button.setAttribute('tabindex','0');button.setAttribute('aria-label','Open My Bedroom');button.draggable=false;
      sidebar.appendChild(button);
    }
    if(button.dataset.boundBedroom!=='1'){
      button.dataset.boundBedroom='1';
      button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();openBedroom();});
      button.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openBedroom();}});
    }
    launcher=button;return true;
  }

  function ensureTransitionVeil(){
    if(transitionVeil?.isConnected)return transitionVeil;
    transitionVeil=document.createElement('div');transitionVeil.className='velmora-bedroom-transition';transitionVeil.setAttribute('aria-hidden','true');document.body.appendChild(transitionVeil);return transitionVeil;
  }
  function playBedroomDoor(){
    try{
      if(!doorAudio){doorAudio=new Audio(`${DOOR_AUDIO}?v=${VERSION}`);doorAudio.preload='auto';}
      doorAudio.pause();doorAudio.currentTime=0;doorAudio.volume=.75;doorAudio.play()?.catch?.(()=>{});
    }catch(_){ }
  }


  function ensureOverlay(){
    if(overlay?.isConnected)return;
    const root=document.body;
    overlay=document.createElement('div');overlay.className='velmora-bedroom-overlay';overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML=`
      <div class="velmora-bedroom-backdrop" aria-hidden="true"></div>
      <section class="velmora-bedroom-app" role="dialog" aria-modal="true" aria-labelledby="velmoraBedroomTitle">
        <header class="velmora-bedroom-topbar">
          <div class="velmora-bedroom-brand"><small>MY BEDROOM</small><h2 id="velmoraBedroomTitle" data-bedroom-room-name-top>Nordic Timber</h2><span data-bedroom-owner>Your private space</span></div>
          <div class="velmora-bedroom-actions">
            <button type="button" class="velmora-bedroom-action" data-bedroom-rooms><span>▧</span><b>Change Room</b><small>4 free designs</small></button>
            <button type="button" class="velmora-bedroom-action velmora-bedroom-action--shop" data-bedroom-shop><span>✦</span><b>Furniture</b><small>Everything is free</small></button>
            <button type="button" class="velmora-bedroom-action velmora-bedroom-action--pets" data-bedroom-pets><span>✣</span><b>Pets</b><small>Choose one companion</small></button>
            <button type="button" class="velmora-bedroom-action velmora-bedroom-action--edit" data-bedroom-edit><span>◇</span><b>Edit Room</b><small>Drag to rearrange</small></button>
            <button type="button" class="velmora-bedroom-action velmora-bedroom-action--home" data-bedroom-home><span>⌂</span><b>Main House</b><small>Return home</small></button>
            <button type="button" class="velmora-bedroom-close" data-bedroom-close aria-label="Close bedroom and return home">×</button>
          </div>
        </header>
        <div class="velmora-bedroom-main">
          <div class="velmora-bedroom-stage-wrap">
            <div class="velmora-bedroom-stage" data-bedroom-stage>
              <img class="velmora-bedroom-room" data-bedroom-room alt="">
              <div class="velmora-bedroom-placements" data-bedroom-placements></div>
              <div class="velmora-bedroom-player" data-bedroom-player aria-hidden="true"><img alt=""></div>
              <div class="velmora-bedroom-pet" data-bedroom-pet hidden aria-hidden="true" role="button" aria-label="Bedroom pet"><img alt=""></div>
              <div class="velmora-bedroom-pet-hover" data-bedroom-pet-hover hidden></div>
              <div class="velmora-bedroom-pet-menu" data-bedroom-pet-menu hidden aria-hidden="true">
                <div class="velmora-bedroom-pet-menu-head"><strong data-bedroom-pet-menu-title>Bedroom Pet</strong><button type="button" data-bedroom-pet-menu-close aria-label="Close pet menu">×</button></div>
                <span data-bedroom-pet-menu-copy>Give them a fuss or rename them.</span>
                <div class="velmora-bedroom-pet-menu-actions"><button type="button" data-bedroom-pet-stroke>Pet</button><button type="button" data-bedroom-pet-rename>Name</button></div>
                <div class="velmora-bedroom-pet-name-edit" data-bedroom-pet-name-edit><input type="text" maxlength="24" data-bedroom-pet-name-input placeholder="Pet name"><button type="button" data-bedroom-pet-save-name>Save</button></div>
              </div>
              <div class="velmora-bedroom-interaction-hint" data-bedroom-interaction-hint hidden></div>
              <div class="velmora-bedroom-placement-ghost" data-bedroom-ghost hidden><img alt=""></div>
              <div class="velmora-bedroom-room-plaque"><small>YOUR ROOM</small><strong data-bedroom-room-name>Nordic Timber</strong><span data-bedroom-mode>Relaxed mode</span></div>
            </div>
          </div>
          <footer class="velmora-bedroom-footer">
            <div><b data-bedroom-footer-title>Your own little corner of Velmora.</b><span data-bedroom-footer-copy>Furniture here belongs to your character, not your Dragonbound dragon.</span></div>
            <span data-bedroom-save>Room changes save automatically</span>
          </footer>
        </div>
        <aside class="velmora-bedroom-drawer" data-bedroom-shop-panel aria-hidden="true">
          <header><div><small>BEDROOM FURNITURE</small><h3>Free Furniture Shop</h3><p>Take whatever suits your room. No Keeper Marks or GP required.</p></div><button type="button" data-bedroom-shop-close aria-label="Close furniture shop">×</button></header>
          <div class="velmora-bedroom-shop-controls"><label><span>⌕</span><input type="search" data-bedroom-search placeholder="Search bedroom furniture…"></label><nav data-bedroom-categories></nav></div>
          <div class="velmora-bedroom-shop-grid" data-bedroom-shop-grid></div>
          <footer><span>Pet nests, feeding and scratching pieces are live for your selected bedroom pet.</span><b>FREE</b></footer>
        </aside>
        <aside class="velmora-bedroom-drawer velmora-bedroom-room-drawer" data-bedroom-room-panel aria-hidden="true">
          <header><div><small>ROOM DESIGN</small><h3>Choose your bedroom</h3><p>All four room designs are free and can be changed whenever you like.</p></div><button type="button" data-bedroom-room-close aria-label="Close room designs">×</button></header>
          <div class="velmora-bedroom-room-grid" data-bedroom-room-grid></div>
        </aside>
        <aside class="velmora-bedroom-drawer velmora-bedroom-pet-drawer" data-bedroom-pet-panel aria-hidden="true">
          <header><div><small>BEDROOM PETS</small><h3>Choose a companion</h3><p>Pick one cat or dog to live in your room. Bedroom pets are flavour-only: no needs, stats or upkeep.</p></div><button type="button" data-bedroom-pet-close aria-label="Close pet selection">×</button></header>
          <div class="velmora-bedroom-pet-controls"><nav><button type="button" data-bedroom-pet-category="Cats" class="is-active">Cats</button><button type="button" data-bedroom-pet-category="Dogs">Dogs</button></nav><button type="button" class="velmora-bedroom-pet-remove" data-bedroom-pet-remove>Remove Pet</button></div>
          <div class="velmora-bedroom-pet-grid" data-bedroom-pet-grid></div>
          <footer><span data-bedroom-pet-status>No bedroom pet selected.</span><b>1 ACTIVE PET</b></footer>
        </aside>
        <div class="velmora-bedroom-editbar" data-bedroom-editbar aria-hidden="true">
          <div><small>EDIT ROOM</small><strong data-bedroom-edit-name>Select furniture to edit it</strong><span data-bedroom-edit-help>Drag to move · mouse wheel resizes · R flips · changes save automatically</span></div>
          <div class="velmora-bedroom-editbar-actions"><button type="button" data-bedroom-flip disabled>R · Flip</button><button type="button" data-bedroom-store disabled>Put Away</button><button type="button" data-bedroom-done>Done Editing</button></div>
        </div>
        <div class="velmora-bedroom-toast" data-bedroom-toast aria-live="polite"></div>
      </section>`;
    root.appendChild(overlay);
    stage=overlay.querySelector('[data-bedroom-stage]');roomImg=overlay.querySelector('[data-bedroom-room]');placementLayer=overlay.querySelector('[data-bedroom-placements]');playerEl=overlay.querySelector('[data-bedroom-player]');petEl=overlay.querySelector('[data-bedroom-pet]');petHoverEl=overlay.querySelector('[data-bedroom-pet-hover]');petMenuEl=overlay.querySelector('[data-bedroom-pet-menu]');petMenuTitleEl=overlay.querySelector('[data-bedroom-pet-menu-title]');petMenuCopyEl=overlay.querySelector('[data-bedroom-pet-menu-copy]');petNameInputEl=overlay.querySelector('[data-bedroom-pet-name-input]');petNameEditEl=overlay.querySelector('[data-bedroom-pet-name-edit]');interactionHintEl=overlay.querySelector('[data-bedroom-interaction-hint]');shopPanel=overlay.querySelector('[data-bedroom-shop-panel]');roomPanel=overlay.querySelector('[data-bedroom-room-panel]');petPanel=overlay.querySelector('[data-bedroom-pet-panel]');

    overlay.querySelector('[data-bedroom-close]').addEventListener('click',returnToMainHouse);
    overlay.querySelector('[data-bedroom-home]').addEventListener('click',returnToMainHouse);
    overlay.querySelector('.velmora-bedroom-backdrop').addEventListener('click',returnToMainHouse);
    overlay.querySelector('[data-bedroom-shop]').addEventListener('click',()=>toggleShop(true));
    overlay.querySelector('[data-bedroom-shop-close]').addEventListener('click',()=>toggleShop(false));
    overlay.querySelector('[data-bedroom-pets]').addEventListener('click',()=>togglePets(true));
    overlay.querySelector('[data-bedroom-pet-close]').addEventListener('click',()=>togglePets(false));
    overlay.querySelector('[data-bedroom-pet-remove]').addEventListener('click',removePet);
    overlay.querySelectorAll('[data-bedroom-pet-category]').forEach(btn=>btn.addEventListener('click',()=>{petCategory=btn.dataset.bedroomPetCategory||'Cats';renderPets();}));
    petEl.addEventListener('pointerenter',onPetPointerEnter);
    petEl.addEventListener('pointerleave',onPetPointerLeave);
    petEl.addEventListener('click',onPetClick);
    petEl.addEventListener('pointerdown',event=>event.stopPropagation());
    petMenuEl.addEventListener('pointerdown',event=>event.stopPropagation());
    petMenuEl.addEventListener('pointerleave',event=>{if(event.relatedTarget!==petEl){petHovering=false;updatePetHover();if(!petMenuEl.classList.contains('is-naming'))schedulePetMenuClose(450);}});
    overlay.querySelector('[data-bedroom-pet-stroke]').addEventListener('click',petActivePet);
    overlay.querySelector('[data-bedroom-pet-rename]').addEventListener('click',beginPetRename);
    overlay.querySelector('[data-bedroom-pet-menu-close]').addEventListener('click',closePetMenu);
    overlay.querySelector('[data-bedroom-pet-save-name]').addEventListener('click',savePetName);
    petNameInputEl.addEventListener('focus',clearPetMenuTimer);
    petNameInputEl.addEventListener('input',clearPetMenuTimer);
    petNameInputEl.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();savePetName();}else if(event.key==='Escape'){event.preventDefault();petMenuEl?.classList.remove('is-naming');schedulePetMenuClose();}});
    overlay.querySelector('[data-bedroom-rooms]').addEventListener('click',()=>toggleRooms(true));
    overlay.querySelector('[data-bedroom-room-close]').addEventListener('click',()=>toggleRooms(false));
    overlay.querySelector('[data-bedroom-edit]').addEventListener('click',()=>setEditMode(!editMode));
    overlay.querySelector('[data-bedroom-done]').addEventListener('click',()=>setEditMode(false));
    overlay.querySelector('[data-bedroom-flip]').addEventListener('click',flipSelected);
    overlay.querySelector('[data-bedroom-store]').addEventListener('click',storeSelected);
    overlay.querySelector('[data-bedroom-search]').addEventListener('input',event=>{shopQuery=String(event.target.value||'').trim().toLowerCase();renderShop();});
    stage.addEventListener('pointerdown',onStagePointerDown);
    stage.addEventListener('contextmenu',onStageContextMenu);
    stage.addEventListener('wheel',onStageWheel,{passive:false});
    window.addEventListener('pointermove',onWindowPointerMove,{passive:false});
    window.addEventListener('pointerup',onWindowPointerUp,{passive:false});
    window.addEventListener('pointercancel',onWindowPointerUp,{passive:false});
    window.addEventListener('keydown',onKeyDown);
    window.addEventListener('keyup',onKeyUp);
    renderCategories();renderRoomChoices();renderShop();renderPets();
  }

  async function openBedroom(){
    if(open||transitioning)return;
    transitioning=true;
    ensureTransitionVeil();playBedroomDoor();
    transitionVeil.classList.add('is-active');
    // Begin loading immediately while the black fade covers the scene change.
    const loading=(async()=>{ensureOverlay();await loadState();loadPetState();renderAll();})();
    await wait(360);await loading;
    open=true;
    startLoop();
    overlay.classList.add('is-visible');overlay.setAttribute('aria-hidden','false');document.body.classList.add('velmora-bedroom-open');
    const owner=currentUsername();overlay.querySelector('[data-bedroom-owner]').textContent=owner==='guest'?'Your private space':`${owner}'s private space`;
    preloadKeeperFrames(keeperIdForUser(owner));if(petState.selectedId)preloadPetFrames(petState.selectedId);
    document.querySelectorAll('.dragonbound-command-menu.is-visible,.dragonbound-command-overlay.is-visible').forEach(el=>el.classList.remove('is-visible'));
    await wait(110);
    transitionVeil.classList.remove('is-active');
    await wait(460);
    transitioning=false;
  }

  function closeBedroom(){
    if(!overlay)return;
    closePetMenu();petHovering=false;
    open=false;toggleShop(false);toggleRooms(false);togglePets(false);setEditMode(false);placingItemId='';drag=null;selectedId='';sleepingPlacementId='';activeInteractionPlacementId='';actionTimer=0;if(state.player)state.player.pose='idle';writePetLocal();
    overlay.classList.remove('is-visible');overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('velmora-bedroom-open');stopLoop();queueSave();
  }
  async function returnToMainHouse(){
    if(!open||transitioning)return;
    transitioning=true;
    ensureTransitionVeil();
    transitionVeil.classList.add('is-active');
    await wait(340);
    closeBedroom();
    await wait(90);
    transitionVeil.classList.remove('is-active');
    await wait(430);
    transitioning=false;
  }

  function toggleShop(show){if(!shopPanel)return;closePetMenu();if(show){toggleRooms(false);togglePets(false);shopPanel.classList.add('is-visible');shopPanel.setAttribute('aria-hidden','false');renderShop();}else{shopPanel.classList.remove('is-visible');shopPanel.setAttribute('aria-hidden','true');}}
  function toggleRooms(show){if(!roomPanel)return;closePetMenu();if(show){toggleShop(false);togglePets(false);roomPanel.classList.add('is-visible');roomPanel.setAttribute('aria-hidden','false');renderRoomChoices();}else{roomPanel.classList.remove('is-visible');roomPanel.setAttribute('aria-hidden','true');}}
  function togglePets(show){if(!petPanel)return;closePetMenu();if(show){toggleShop(false);toggleRooms(false);petPanel.classList.add('is-visible');petPanel.setAttribute('aria-hidden','false');renderPets();}else{petPanel.classList.remove('is-visible');petPanel.setAttribute('aria-hidden','true');}}

  function clampPlacementsToRoom(){
    let changed=false;
    for(const p of state.placements){
      const item=ITEM_BY_ID.get(p.assetId);if(!item)continue;
      const fixed=constrainPlacement(p.x,p.y,item,p.scale||1);
      if(Math.abs(fixed.x-p.x)>.0001||Math.abs(fixed.y-p.y)>.0001){p.x=fixed.x;p.y=fixed.y;changed=true;}
    }
    if(changed)queueSave();
  }
  function renderAll(){
    clampPlacementsToRoom();
    const room=roomById(state.roomId);roomImg.src=`${room.src}?v=${VERSION}`;roomImg.alt=`${room.name} bedroom`;overlay.querySelector('[data-bedroom-room-name]').textContent=room.name;const topName=overlay.querySelector('[data-bedroom-room-name-top]');if(topName)topName.textContent=room.name;renderPlacements();renderRoomChoices();renderEditState();renderPlayer();renderPet();
  }
  function renderPlacements(){
    if(!placementLayer)return;placementLayer.innerHTML='';
    const ordered=[...state.placements].sort((a,b)=>{
      const ia=ITEM_BY_ID.get(a.assetId),ib=ITEM_BY_ID.get(b.assetId);if(ia?.rug&&!ib?.rug)return -1;if(!ia?.rug&&ib?.rug)return 1;return a.y-b.y;
    });
    for(const p of ordered){
      const item=ITEM_BY_ID.get(p.assetId);if(!item)continue;
      // Use a neutral div instead of <button>. Site-wide button:hover rules were still
      // painting a brown rectangle behind transparent furniture in Edit Room.
      const furniture=document.createElement('div');furniture.className='velmora-bedroom-placement';furniture.dataset.placementId=p.id;furniture.style.left=`${p.x*100}%`;furniture.style.top=`${p.y*100}%`;furniture.style.zIndex=String(item.rug?20:100+Math.round(p.y*1000));furniture.style.setProperty('--item-width',`${item.width}%`);furniture.style.setProperty('--item-scale',String(p.scale||1));furniture.classList.toggle('is-flipped',!!p.flipped);furniture.classList.toggle('is-selected',editMode&&selectedId===p.id);furniture.setAttribute('role','button');furniture.setAttribute('aria-label',`${item.name}${editMode?' — drag to move':''}`);furniture.tabIndex=editMode?0:-1;
      furniture.innerHTML=`<img src="${item.src}?v=${VERSION}" alt="${esc(item.name)}"><span class="velmora-bedroom-placement-ring"></span>`;
      placementLayer.appendChild(furniture);
    }
  }
  function renderCategories(){
    const nav=overlay?.querySelector('[data-bedroom-categories]');if(!nav)return;
    nav.innerHTML=CATEGORIES.map(cat=>`<button type="button" data-bedroom-category="${esc(cat)}" class="${shopCategory===cat?'is-active':''}">${esc(cat)}</button>`).join('');
    nav.querySelectorAll('[data-bedroom-category]').forEach(btn=>btn.addEventListener('click',()=>{shopCategory=btn.dataset.bedroomCategory||'All';renderCategories();renderShop();}));
  }
  function renderShop(){
    const grid=overlay?.querySelector('[data-bedroom-shop-grid]');if(!grid)return;
    const filtered=ITEMS.filter(item=>(shopCategory==='All'||item.category===shopCategory)&&(!shopQuery||`${item.name} ${item.category}`.toLowerCase().includes(shopQuery)));
    grid.innerHTML=filtered.map(item=>`<article class="velmora-bedroom-shop-card ${item.futurePet?'is-future-pet':''}" data-bedroom-place="${esc(item.id)}" role="button" tabindex="0" aria-label="Place ${esc(item.name)}"><div class="velmora-bedroom-shop-image"><img src="${item.src}?v=${VERSION}" alt="${esc(item.name)}"></div><div class="velmora-bedroom-shop-card-copy"><small>${esc(item.category)}</small><strong>${esc(item.name)}</strong><span>${item.futurePet?'For your future bedroom cat/dog':'Character bedroom furnishing'}</span></div><div class="velmora-bedroom-shop-place"><b>Place in room</b><small>FREE</small></div></article>`).join('')||'<div class="velmora-bedroom-empty">No furniture matches that search.</div>';
    grid.querySelectorAll('[data-bedroom-place]').forEach(card=>{
      const place=()=>beginPlacement(card.dataset.bedroomPlace);
      card.addEventListener('click',place);
      card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();place();}});
    });
  }

  function renderPets(){
    if(!petPanel)return;
    petPanel.querySelectorAll('[data-bedroom-pet-category]').forEach(btn=>btn.classList.toggle('is-active',(btn.dataset.bedroomPetCategory||'Cats')===petCategory));
    const grid=petPanel.querySelector('[data-bedroom-pet-grid]');if(!grid)return;
    const type=petCategory==='Dogs'?'dog':'cat';
    grid.innerHTML=PET_BREEDS.filter(pet=>pet.type===type).map(pet=>`<article class="velmora-bedroom-pet-card ${petState.selectedId===pet.id?'is-active':''}" data-bedroom-pet-select="${esc(pet.id)}" role="button" tabindex="0" aria-label="Choose ${esc(pet.name)}"><div class="velmora-bedroom-pet-preview"><img src="${petFrameSrc(pet.id,'idle',0)}" alt="${esc(pet.name)}"></div><small>${pet.type==='cat'?'CAT':'DOG'}</small><strong>${esc(pet.name)}</strong><span>${petState.selectedId===pet.id?'Currently in your room':'Choose as bedroom pet'}</span></article>`).join('');
    grid.querySelectorAll('[data-bedroom-pet-select]').forEach(card=>{const choose=()=>selectPet(card.dataset.bedroomPetSelect);card.addEventListener('click',choose);card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose();}});});
    const selected=PET_BY_ID.get(petState.selectedId);const status=petPanel.querySelector('[data-bedroom-pet-status]');if(status)status.textContent=selected?`${petDisplayName(selected)} is your active bedroom pet.`:'No bedroom pet selected.';
    const remove=petPanel.querySelector('[data-bedroom-pet-remove]');if(remove)remove.disabled=!selected;
  }
  function resetPetRuntime(){
    const point=randomPetFloorPoint();petState.x=point.x;petState.y=point.y;petState.dir=Math.random()<.5?'left':'right';petState.mode='idle';petState.frame=0;petState.frameTimer=0;petState.targetX=null;petState.targetY=null;petState.targetPlacementId='';petState.plannedKind='';petState.mountedPlacementId='';petState.actionUntil=0;petState.nextDecisionAt=Date.now()+700+Math.random()*1200;
  }
  function selectPet(id){
    if(!PET_BY_ID.has(id))return;closePetMenu();petState.selectedId=id;petState.nickname='';resetPetRuntime();preloadPetFrames(id);queuePetSave();renderPet();renderPets();togglePets(false);notify(`${PET_BY_ID.get(id).name} is now wandering around your room.`);
  }
  function removePet(){
    closePetMenu();const old=PET_BY_ID.get(petState.selectedId);petState=normalisePetState(null);writePetLocal();renderPet();renderPets();if(old)notify(`${old.name} has been removed from the bedroom.`);
  }

  function renderRoomChoices(){
    const grid=overlay?.querySelector('[data-bedroom-room-grid]');if(!grid)return;
    grid.innerHTML=ROOMS.map(room=>`<button type="button" data-bedroom-room-id="${room.id}" class="velmora-bedroom-room-card ${state.roomId===room.id?'is-active':''}"><img src="${room.src}?v=${VERSION}" alt="${esc(room.name)}"><span><small>${state.roomId===room.id?'CURRENT ROOM':'FREE ROOM'}</small><strong>${esc(room.name)}</strong><em>${esc(room.copy)}</em></span></button>`).join('');
    grid.querySelectorAll('[data-bedroom-room-id]').forEach(btn=>btn.addEventListener('click',()=>selectRoom(btn.dataset.bedroomRoomId)));
  }
  function selectRoom(id){if(!ROOM_IDS.has(id))return;state.roomId=id;queueSave();renderAll();toggleRooms(false);notify(`${roomById(id).name} is now your bedroom.`);}

  function setEditMode(value){
    editMode=!!value;if(!editMode){drag=null;selectedId='';placingItemId='';hideGhost();}else{closePetMenu();petHovering=false;interactionTargetId='';if(state.player?.pose!=='idle'){state.player.pose='idle';sleepingPlacementId='';activeInteractionPlacementId='';actionTimer=0;}}
    overlay?.classList.toggle('is-editing',editMode);overlay?.querySelector('[data-bedroom-editbar]')?.setAttribute('aria-hidden',editMode?'false':'true');
    const btn=overlay?.querySelector('[data-bedroom-edit]');if(btn){btn.classList.toggle('is-active',editMode);btn.querySelector('b').textContent=editMode?'Editing Room':'Edit Room';btn.querySelector('small').textContent=editMode?'Click Done when finished':'Drag to rearrange';}
    renderPlacements();renderEditState();
  }
  function renderEditState(){
    const selected=state.placements.find(p=>p.id===selectedId);const item=selected&&ITEM_BY_ID.get(selected.assetId);
    const name=overlay?.querySelector('[data-bedroom-edit-name]');const flip=overlay?.querySelector('[data-bedroom-flip]');const store=overlay?.querySelector('[data-bedroom-store]');const mode=overlay?.querySelector('[data-bedroom-mode]');
    if(name)name.textContent=item?`${item.name} · ${Math.round((selected?.scale||1)*100)}%`:'Select furniture to edit it';if(flip)flip.disabled=!item;if(store)store.disabled=!item;if(mode)mode.textContent=placingItemId?'Placing new furniture':editMode?'Edit Room active':'Relaxed mode';
  }
  function beginPlacement(itemId){
    const item=ITEM_BY_ID.get(itemId);if(!item)return;placingItemId=item.id;selectedId='';setEditMode(true);toggleShop(false);showGhost(item,.50,item.wall?.565:.70,true,1,false);notify(`Move your pointer around the room and click to place ${item.name}.`);
  }
  function stagePoint(event){
    const r=stage.getBoundingClientRect();return {x:clamp((event.clientX-r.left)/r.width,0,1),y:clamp((event.clientY-r.top)/r.height,0,1)};
  }
  function placementValid(candidate,item,scale=1){return !!item&&floorValid(candidate.x,candidate.y,item,scale);
  }
  function showGhost(item,x,y,force=false,scaleOverride=1,flippedOverride=false){
    const ghost=overlay?.querySelector('[data-bedroom-ghost]');if(!ghost||!item)return;
    const visualScale=clamp(scaleOverride||1,.5,1.85);
    const p=constrainPlacement(x,y,item,visualScale),valid=p.valid;
    ghost.hidden=false;ghost.style.left=`${p.x*100}%`;ghost.style.top=`${p.y*100}%`;ghost.style.zIndex=String(item.rug?21:110+Math.round(p.y*1000));ghost.style.setProperty('--item-width',`${item.width}%`);ghost.style.setProperty('--item-scale',String(visualScale));ghost.classList.toggle('is-valid',valid);ghost.classList.toggle('is-invalid',!valid);ghost.dataset.valid=valid?'1':'0';ghost.dataset.x=String(p.x);ghost.dataset.y=String(p.y);ghost.dataset.scale=String(visualScale);const img=ghost.querySelector('img');const src=`${item.src}?v=${VERSION}`;if(img.getAttribute('src')!==src)img.src=src;img.alt=item.name;ghost.classList.toggle('is-flipped',!!flippedOverride);if(force)renderEditState();
  }
  function hideGhost(){const ghost=overlay?.querySelector('[data-bedroom-ghost]');if(ghost){ghost.hidden=true;ghost.classList.remove('is-valid','is-invalid','is-flipped');ghost.dataset.valid='0';}}

  function onStagePointerDown(event){
    if(petMenuOpen&&!event.target.closest?.('[data-bedroom-pet-menu]')&&!event.target.closest?.('[data-bedroom-pet]')){closePetMenu();petHovering=false;}
    if(!open||event.button!==0)return;
    const placementEl=event.target.closest?.('.velmora-bedroom-placement')||event.composedPath?.().find?.(node=>node?.classList?.contains?.('velmora-bedroom-placement'));
    if(placingItemId){event.preventDefault();const item=ITEM_BY_ID.get(placingItemId);const point=stagePoint(event);showGhost(item,point.x,point.y,false,1,false);commitGhostPlacement(item);return;}
    if(!editMode){
      if(!placementEl)return;
      const id=placementEl.dataset.placementId;const p=state.placements.find(x=>x.id===id);const item=p&&ITEM_BY_ID.get(p.assetId);if(!p||!item)return;
      if(item.category!=='Beds')return;
      event.preventDefault();event.stopPropagation();
      if(state.player?.pose==='sleep'&&sleepingPlacementId===p.id){
        state.player._actionToken='';state.player.pose='idle';sleepingPlacementId='';activeInteractionPlacementId='';actionTimer=0;
        const stand=safeStandPointForPlacement(p,item);state.player.x=stand.x;state.player.y=stand.y;state.player.dir=p.flipped?'right':'left';keys={up:false,down:false,left:false,right:false};playerFrame=0;playerFrameTimer=0;renderPlayer();notify('You get out of bed.');
        return;
      }
      const dx=Math.hypot((p.x-(state.player?.x??.5))*1.05,(p.y-(state.player?.y??.83))*1.45);
      if(dx>.15){notify('Move closer to the bed to get in.');return;}
      interactNearby();
      return;
    }
    if(placementEl){
      event.preventDefault();event.stopPropagation();const id=placementEl.dataset.placementId;const p=state.placements.find(x=>x.id===id);if(!p)return;selectedId=id;drag={placementId:id,startX:event.clientX,startY:event.clientY,originX:p.x,originY:p.y,flipped:!!p.flipped,scale:p.scale||1,moved:false,pointerId:event.pointerId};try{stage.setPointerCapture(event.pointerId)}catch(_){ }renderPlacements();renderEditState();return;
    }
    selectedId='';renderPlacements();renderEditState();
  }
  function onWindowPointerMove(event){
    if(!open)return;
    if(placingItemId){const item=ITEM_BY_ID.get(placingItemId);if(item){const point=stagePoint(event);showGhost(item,point.x,point.y,false,1,false);}return;}
    if(!drag)return;
    if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<5&&!drag.moved)return;
    drag.moved=true;event.preventDefault();const p=state.placements.find(x=>x.id===drag.placementId);const item=p&&ITEM_BY_ID.get(p.assetId);if(!p||!item)return;const point=stagePoint(event);showGhost(item,point.x,point.y,false,p.scale||1,p.flipped);
  }
  function onStageWheel(event){
    if(!open||!editMode||placingItemId)return;
    const hovered=event.target.closest?.('.velmora-bedroom-placement')||event.composedPath?.().find?.(node=>node?.classList?.contains?.('velmora-bedroom-placement'));
    if(hovered?.dataset?.placementId)selectedId=hovered.dataset.placementId;
    const p=state.placements.find(x=>x.id===selectedId);if(!p)return;
    const item=ITEM_BY_ID.get(p.assetId);if(!item)return;
    event.preventDefault();event.stopPropagation();
    const direction=event.deltaY<0?1:-1;
    const next=clamp(Math.round(((p.scale||1)+direction*.05)*20)/20,.5,1.85);
    if(Math.abs(next-(p.scale||1))<.001)return;
    p.scale=next;
    const fixed=constrainPlacement(p.x,p.y,item,p.scale);
    p.x=fixed.x;p.y=fixed.y;
    queueSave();renderPlacements();renderEditState();setSaveStatus(`Furniture resized · ${Math.round(p.scale*100)}%`);
  }

  function onWindowPointerUp(event){
    if(!drag)return;const p=state.placements.find(x=>x.id===drag.placementId);const item=p&&ITEM_BY_ID.get(p.assetId);const ghost=overlay?.querySelector('[data-bedroom-ghost]');
    if(drag.moved&&p&&item&&ghost?.dataset.valid==='1'){
      p.x=Number(ghost.dataset.x);p.y=Number(ghost.dataset.y);queueSave();setSaveStatus('Furniture moved');
    }
    drag=null;hideGhost();renderPlacements();renderEditState();try{stage.releasePointerCapture(event.pointerId)}catch(_){ }
  }
  function commitGhostPlacement(item){
    const ghost=overlay?.querySelector('[data-bedroom-ghost]');if(!ghost||ghost.dataset.valid!=='1'){notify('That spot is blocked. Try another part of the room.','warn');return false;}
    const p={id:uid(),assetId:item.id,x:Number(ghost.dataset.x),y:Number(ghost.dataset.y),flipped:false,scale:1};state.placements.push(p);placingItemId='';selectedId=p.id;hideGhost();queueSave();renderPlacements();renderEditState();notify(`${item.name} placed.`);return true;
  }
  function flipSelected(){const p=state.placements.find(x=>x.id===selectedId);if(!p)return;p.flipped=!p.flipped;queueSave();renderPlacements();renderEditState();setSaveStatus('Furniture flipped');}
  function storeSelected(){const idx=state.placements.findIndex(x=>x.id===selectedId);if(idx<0)return;const item=ITEM_BY_ID.get(state.placements[idx].assetId);state.placements.splice(idx,1);selectedId='';queueSave();renderPlacements();renderEditState();notify(`${item?.name||'Furniture'} returned to the free shop.`);}
  function onStageContextMenu(event){
    if(!open||!editMode)return;
    const placementEl=event.target.closest?.('.velmora-bedroom-placement')||event.composedPath?.().find?.(node=>node?.classList?.contains?.('velmora-bedroom-placement'));
    if(!placementEl)return;
    event.preventDefault();event.stopPropagation();
    selectedId=placementEl.dataset.placementId||'';
    renderPlacements();renderEditState();
    storeSelected();
  }
  function notify(message,tone=''){const el=overlay?.querySelector('[data-bedroom-toast]');if(!el)return;el.textContent=message;el.dataset.tone=tone;el.classList.add('is-visible');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('is-visible'),2600);}

  function onKeyDown(event){
    if(!open)return;const tag=document.activeElement?.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
    const key=String(event.key||'').toLowerCase();
    if(!editMode&&!placingItemId&&state.player?.pose==='sleep'&&sleepingPlacementId){
      if(key!=='shift'&&key!=='control'&&key!=='alt'&&key!=='meta'){
        const bed=state.placements.find(p=>p.id===sleepingPlacementId);
        const item=bed&&ITEM_BY_ID.get(bed.assetId);
        state.player._actionToken='';state.player.pose='idle';sleepingPlacementId='';activeInteractionPlacementId='';actionTimer=0;
        if(bed&&item){const stand=safeStandPointForPlacement(bed,item);state.player.x=stand.x;state.player.y=stand.y;state.player.dir=bed.flipped?'right':'left';}
        keys={up:false,down:false,left:false,right:false};playerFrame=0;playerFrameTimer=0;renderPlayer();
        notify('You get out of bed.');
        event.preventDefault();
        return;
      }
    }
    const canMove=!editMode&&!placingItemId&&state.player?.pose==='idle';
    if(key==='w'||key==='arrowup'){if(canMove)keys.up=true; if(!editMode)event.preventDefault();}
    if(key==='s'||key==='arrowdown'){if(canMove)keys.down=true; if(!editMode)event.preventDefault();}
    if(key==='a'||key==='arrowleft'){if(canMove)keys.left=true; if(!editMode)event.preventDefault();}
    if(key==='d'||key==='arrowright'){if(canMove)keys.right=true; if(!editMode)event.preventDefault();}
    if(!editMode&&(key==='e')){event.preventDefault();interactNearby();return;}
    if(editMode&&selectedId&&key==='r'){event.preventDefault();flipSelected();return;}
    if(event.key==='Escape'){
      if(placingItemId){placingItemId='';hideGhost();renderEditState();event.preventDefault();return;}
      if(shopPanel?.classList.contains('is-visible')){toggleShop(false);event.preventDefault();return;}
      if(roomPanel?.classList.contains('is-visible')){toggleRooms(false);event.preventDefault();return;}
      if(petMenuOpen){closePetMenu();event.preventDefault();return;}
      if(petPanel?.classList.contains('is-visible')){togglePets(false);event.preventDefault();return;}
      if(editMode){setEditMode(false);event.preventDefault();return;}
      returnToMainHouse();event.preventDefault();
    }
  }

  function onKeyUp(event){
    const key=String(event.key||'').toLowerCase();
    if(key==='w'||key==='arrowup')keys.up=false;
    if(key==='s'||key==='arrowdown')keys.down=false;
    if(key==='a'||key==='arrowleft')keys.left=false;
    if(key==='d'||key==='arrowright')keys.right=false;
    writeLocal();
  }

  function playerBlockedByFurniture(x,y,ignorePlacementId=''){
    // Furniture anchors use their bottom-centre floor point. The old movement code
    // only clipped to the room polygon, so the keeper could walk straight across beds,
    // tables, chests and other solid furniture. Use a floor-footprint collider that
    // extends mostly *behind* the anchor, matching the isometric artwork.
    const playerHalfW=.016, playerHalfH=.014;
    for(const p of state.placements){
      if(p.id===ignorePlacementId)continue;
      const item=ITEM_BY_ID.get(p.assetId);if(!item||!item.blocking||item.rug)continue;
      const scale=clamp(p.scale||1,.5,1.85);
      let halfW=Math.max(.025,item.halfW*.88*scale);
      let backDepth=.045*scale, frontDepth=.014*scale;
      if(item.footprint==='2x1'){backDepth=.060*scale;frontDepth=.017*scale;}
      else if(item.footprint==='2x2'){backDepth=.115*scale;frontDepth=.020*scale;halfW=Math.max(halfW,.072*scale);}
      else if(item.footprint==='3x2'){backDepth=.110*scale;frontDepth=.020*scale;}
      // Tall wall-backed furniture still has a real floor footprint; only non-blocking
      // wall art/lights are skipped by the blocking flag above.
      const minX=p.x-halfW-playerHalfW, maxX=p.x+halfW+playerHalfW;
      const minY=p.y-backDepth-playerHalfH, maxY=p.y+frontDepth+playerHalfH;
      if(x>minX&&x<maxX&&y>minY&&y<maxY)return true;
    }
    return false;
  }
  function constrainPlayer(x,y){
    // Keep movement continuous and inside the room polygon. Collision against solid
    // furniture is resolved by the movement step below so the keeper can slide along
    // edges instead of sticking on corners.
    let cy=clamp(Number(y)||.83,.525,.925);
    const [left,right]=floorBoundsAtY(cy);
    const margin=.012;
    const cx=clamp(Number(x)||.50,left+margin,right-margin);
    return {x:cx,y:cy};
  }
  function movePlayerWithCollision(player,targetX,targetY){
    const target=constrainPlayer(targetX,targetY);
    // Existing saves from before collision may load with the keeper already standing
    // inside a solid item. Let them walk out once; as soon as they leave the footprint,
    // normal collision becomes authoritative and they cannot walk back through it.
    if(playerBlockedByFurniture(player.x,player.y))return target;
    if(!playerBlockedByFurniture(target.x,target.y))return target;
    // Axis-separated fallback gives natural sliding around beds/tables rather than
    // cancelling the whole movement vector when one edge is touched.
    const slideX=constrainPlayer(target.x,player.y);
    if(!playerBlockedByFurniture(slideX.x,slideX.y))return slideX;
    const slideY=constrainPlayer(player.x,target.y);
    if(!playerBlockedByFurniture(slideY.x,slideY.y))return slideY;
    return {x:player.x,y:player.y};
  }
  function safeStandPointForPlacement(p,item){
    const scale=clamp(p?.scale||1,.5,1.85);
    const candidates=[
      {x:p.x,y:p.y+.070*scale},
      {x:p.x+(p.flipped?-.120:.120)*scale,y:p.y+.020*scale},
      {x:p.x+(p.flipped?.120:-.120)*scale,y:p.y+.020*scale},
      {x:p.x,y:p.y+.105*scale}
    ];
    for(const candidate of candidates){
      const pt=constrainPlayer(candidate.x,candidate.y);
      if(!playerBlockedByFurniture(pt.x,pt.y))return pt;
    }
    return constrainPlayer(p.x,p.y+.115*scale);
  }
  function nearestPlacement(){
    if(!state.placements.length)return null;
    const player=state.player||defaultPlayerForUser(currentUsername());
    let best=null, bestItem=null, bestDist=999;
    for(const p of state.placements){
      const item=ITEM_BY_ID.get(p.assetId);if(!item||item.category!=='Beds')continue;
      const d=Math.hypot((p.x-player.x)*1.05,(p.y-player.y)*1.45);
      if(d<bestDist){bestDist=d;best=p;bestItem=item;}
    }
    if(!best||bestDist>.12)return null;
    return {placement:best,item:bestItem,distance:bestDist};
  }
  function updateInteractionHint(){
    if(!interactionHintEl)return;
    if(editMode||placingItemId||state.player?.pose!=='idle'||actionTimer>Date.now()){interactionHintEl.hidden=true;interactionTargetId='';return;}
    const near=nearestPlacement();
    if(!near||!near.item){interactionHintEl.hidden=true;interactionTargetId='';return;}
    interactionTargetId=near.placement.id;
    interactionHintEl.hidden=false;
    const overnight=!!window.VelmoraDayCycle?.canSleepNow?.();
    interactionHintEl.textContent=state.player?.pose==='sleep'&&sleepingPlacementId===near.placement.id?`Click bed · Get out of ${near.item.name}`:(overnight?`E / Click · Sleep until morning`:`E / Click · Rest in ${near.item.name}`);
    interactionHintEl.style.left=`${near.placement.x*100}%`;
    interactionHintEl.style.top=`${(near.placement.y-0.12)*100}%`;
  }
  function startFurnitureAction(kind,p,item,duration=3200,message=''){
    if(!p||!item||!state.player)return;
    const token=`${kind}:${p.id}:${Date.now()}`;
    state.player.pose=kind;
    activeInteractionPlacementId=p.id;
    sleepingPlacementId='';
    actionTimer=Date.now()+duration;
    keys={up:false,down:false,left:false,right:false};
    playerFrame=0;playerFrameTimer=0;
    state.player._actionToken=token;
    if(interactionHintEl){interactionHintEl.hidden=true;interactionTargetId='';}
    renderPlayer();
    if(message)notify(message);
    setTimeout(()=>{
      if(!state.player||state.player._actionToken!==token)return;
      state.player._actionToken='';
      state.player.pose='idle';
      activeInteractionPlacementId='';
      actionTimer=0;
      const stand=safeStandPointForPlacement(p,item);
      state.player.x=stand.x;state.player.y=stand.y;state.player.dir=p.flipped?'right':'left';
      keys={up:false,down:false,left:false,right:false};
      playerFrame=0;playerFrameTimer=0;
      renderPlayer();
    },duration);
  }
  async function sleepOvernight(placement,item){
    if(transitioning)return;
    transitioning=true;
    const token=`sleep:${placement.id}:${Date.now()}`;
    sleepingPlacementId=placement.id;activeInteractionPlacementId='';
    state.player.pose='sleep';state.player._actionToken=token;actionTimer=0;
    keys={up:false,down:false,left:false,right:false};playerFrame=0;playerFrameTimer=0;
    if(interactionHintEl){interactionHintEl.hidden=true;interactionTargetId='';}
    renderPlayer();notify('You drift off to sleep...');
    await wait(760);
    ensureTransitionVeil();
    transitionVeil.classList.add('is-active');
    await wait(820);
    const info=await Promise.resolve(window.VelmoraDayCycle?.sleepToMorning?.()||{day:1,formatted:'7:00 AM'});
    const stand=safeStandPointForPlacement(placement,item);
    state.player._actionToken='';state.player.pose='idle';sleepingPlacementId='';activeInteractionPlacementId='';actionTimer=0;
    state.player.x=stand.x;state.player.y=stand.y;state.player.dir=placement.flipped?'right':'left';
    renderPlayer();queueSave();
    await wait(140);
    transitionVeil.classList.remove('is-active');
    await wait(430);
    notify(`A new morning begins — Day ${info.day||1} · ${info.formatted||'7:00 AM'}.`);
    transitioning=false;
  }

  function interactNearby(){
    if(editMode||placingItemId)return;
    const near=nearestPlacement();
    if(!near||!near.item){notify('Move closer to a bed to sleep.');return;}
    const item=near.item; const p=near.placement;
    if(item.category==='Beds'){
      if(window.VelmoraDayCycle?.canSleepNow?.()){sleepOvernight(p,item);return;}
      const token=`sleep:${p.id}:${Date.now()}`;
      sleepingPlacementId=p.id;activeInteractionPlacementId='';
      state.player.pose='sleep';state.player._actionToken=token;
      actionTimer=0;
      keys={up:false,down:false,left:false,right:false};playerFrame=0;playerFrameTimer=0;
      if(interactionHintEl){interactionHintEl.hidden=true;interactionTargetId='';}
      renderPlayer();notify('You settle into bed. Click the bed or press any key when you want to get up.');
      return;
    }
  }
  function playerCell(){
    const player=state.player||defaultPlayerForUser(currentUsername());
    if(player.pose==='sleep')return {row:4,col:0,flip:false};
    if(player.pose==='sit')return {row:0,col:0,flip:false};
    if(player.pose==='bathe'||player.pose==='wash'||player.pose==='use')return {row:1,col:playerFrame%4,flip:false};
    const moving = (keys.up||keys.down||keys.left||keys.right) && !editMode && !placingItemId;
    const dir = player.dir||'down';
    if(moving){
      if(dir==='down')return {row:1,col:playerFrame%4,flip:false};
      if(dir==='up')return {row:2,col:playerFrame%4,flip:false};
      if(dir==='left')return {row:3,col:playerFrame%4,flip:true};
      return {row:3,col:playerFrame%4,flip:false};
    }
    if(dir==='down')return {row:0,col:0,flip:false};
    if(dir==='left')return {row:0,col:3,flip:false};
    if(dir==='up')return {row:0,col:2,flip:false};
    return {row:0,col:1,flip:false};
  }
  function renderPlayer(){
    if(!playerEl)return;
    const player=state.player||defaultPlayerForUser(currentUsername());
    const sheet=keeperSheetById(player.sheetId);
    const cell=playerCell();
    const img=playerEl.querySelector('img');
    let renderX=player.x, renderY=player.y, sleepAngle=0, actionFlip=1, actionPlacement=null;
    if(player.pose==='sleep'&&sleepingPlacementId){
      const bed=state.placements.find(p=>p.id===sleepingPlacementId);
      if(bed){
        const scale=clamp(bed.scale||1,.5,1.85);
        // V33.19: nudge the sleeper slightly higher and flatten the angle a touch so
        // the head sits cleaner on the pillow without hanging down the front edge.
        renderX=clamp(bed.x+(bed.flipped?-0.013:0.018)*scale,.08,.92);
        renderY=clamp(bed.y-0.172*scale,.42,.90);
        sleepAngle=bed.flipped?322:38;
      }
    }else if(player.pose!=='idle'&&activeInteractionPlacementId){
      actionPlacement=state.placements.find(p=>p.id===activeInteractionPlacementId)||null;
      const item=actionPlacement&&ITEM_BY_ID.get(actionPlacement.assetId);
      if(actionPlacement&&item){
        const scale=clamp(actionPlacement.scale||1,.5,1.85), side=actionPlacement.flipped?-1:1;
        actionFlip=actionPlacement.flipped?-1:1;
        if(player.pose==='sit'){
          renderX=clamp(actionPlacement.x+side*.004*scale,.08,.92);
          renderY=clamp(actionPlacement.y-.050*scale,.45,.91);
        }else if(player.pose==='bathe'){
          renderX=clamp(actionPlacement.x+side*.006*scale,.08,.92);
          renderY=clamp(actionPlacement.y-.085*scale,.43,.90);
        }else if(player.pose==='wash'){
          renderX=clamp(actionPlacement.x-side*.018*scale,.08,.92);
          renderY=clamp(actionPlacement.y-.018*scale,.48,.91);
        }else{
          renderX=clamp(actionPlacement.x-side*(Math.max(.040,item.halfW*.52*scale)),.08,.92);
          renderY=clamp(actionPlacement.y+.010*scale,.50,.92);
        }
      }
    }
    if(sheet.id==='covidpanda'&&player.pose!=='sleep'){
      renderY=clamp(renderY+0.006,.08,.94);
    }
    playerEl.style.left=`${renderX*100}%`;
    playerEl.style.top=`${renderY*100}%`;
    playerEl.dataset.sheetId=sheet.id;
    // Keep the keeper above bedroom furniture. The previous y-only depth test let tall
    // furniture cover the character even when they were visibly standing in front.
    if(player.pose==='sleep'&&sleepingPlacementId){
      const sleepBed=state.placements.find(p=>p.id===sleepingPlacementId);
      playerEl.style.zIndex=String(sleepBed?110+Math.round(sleepBed.y*1000):8200);
    }else if(actionPlacement){
      playerEl.style.zIndex=String(115+Math.round(actionPlacement.y*1000));
    }else{
      playerEl.style.zIndex='8000';
    }
    playerEl.style.setProperty('--bedroom-sleep-angle',`${sleepAngle}deg`);
    playerEl.style.setProperty('--bedroom-action-flip',String(actionFlip));
    playerEl.classList.toggle('is-flipped',!!cell.flip&&player.pose==='idle');
    playerEl.classList.toggle('is-sleeping',player.pose==='sleep');
    playerEl.classList.toggle('is-sitting',player.pose==='sit');
    playerEl.classList.toggle('is-bathing',player.pose==='bathe');
    playerEl.classList.toggle('is-washing',player.pose==='wash');
    playerEl.classList.toggle('is-using',player.pose==='use');
    if(img){
      const src=keeperFrameSrc(sheet.id,cell.row,cell.col);
      if(img.getAttribute('src')!==src)img.src=src;
      img.alt='';
    }
  }
  function petInteractionKind(item){
    if(!item)return '';
    const name=item.name.toLowerCase();
    if(item.category==='Beds'||name.includes('pet nest'))return 'sleep';
    if(name.includes('scratching')||name.includes('perch')||name.includes('climbing ramp')||name.includes('activity perch'))return 'perch';
    if(item.category==='Tables & Desks'||name.includes('table')||name.includes('desk')||name.includes('vanity')||name.includes('trunk')||name.includes('bedside')||name.includes('counter')||name.includes('workbench'))return 'surface';
    if(item.category==='Seating'||name.includes('chair')||name.includes('stool')||name.includes('sofa')||name.includes('bench')||name.includes('chaise')||name.includes('lounge'))return 'seat';
    if(item.rug||item.category==='Rugs'||name.includes('rug')||name.includes('carpet')||name.includes('runner'))return 'rug';
    if(name.includes('feeding')||item.category==='Kitchen'||item.category==='Bathing')return 'sniff';
    if(item.category==='Storage'||item.category==='Mirrors'||item.category==='Decor'||item.category==='Health & Utility'||name.includes('bookshelf')||name.includes('planter'))return 'inspect';
    return '';
  }
  function petWalkable(x,y,ignorePlacementId=''){
    if(!pointInPolygon(x,y))return false;
    for(const p of state.placements){
      if(p.id===ignorePlacementId)continue;
      const item=ITEM_BY_ID.get(p.assetId);if(!item||item.wall||item.rug||!item.blocking)continue;
      const scale=clamp(p.scale||1,.5,1.85);
      const halfW=Math.max(.018,item.halfW*.62*scale),halfH=Math.max(.012,item.halfH*.70*scale);
      if(Math.abs(x-p.x)<halfW&&Math.abs(y-p.y)<halfH)return false;
    }
    return true;
  }
  function randomPetFloorPoint(){
    for(let i=0;i<28;i++){
      const y=.57+Math.random()*.33;const [left,right]=floorBoundsAtY(y);const x=left+.035+Math.random()*Math.max(.01,right-left-.07);
      if(petWalkable(x,y))return {x,y};
    }
    return {x:.43,y:.84};
  }
  function petMountFor(p,item,kind){
    const scale=clamp(p.scale||1,.5,1.85),side=p.flipped?-1:1;
    if(kind==='sleep')return {x:p.x+side*.012*scale,y:p.y-(item.name.toLowerCase().includes('nest')?.076:.113)*scale,anim:'sleep'};
    if(kind==='surface')return {x:p.x+side*.004*scale,y:p.y-.078*scale,anim:'idle'};
    if(kind==='seat'||kind==='perch')return {x:p.x+side*.002*scale,y:p.y-.058*scale,anim:'idle'};
    if(kind==='rug')return {x:p.x,y:p.y-.012,anim:Math.random()<.55?'sleep':'idle'};
    return {x:p.x+side*.035*scale,y:p.y+.006,anim:'idle'};
  }
  function petApproachFor(p,item){
    const scale=clamp(p.scale||1,.5,1.85),side=p.flipped?-1:1;
    const candidates=[{x:p.x-side*(item.halfW*.72*scale+.035),y:p.y+.018},{x:p.x+side*(item.halfW*.72*scale+.035),y:p.y+.018},{x:p.x,y:p.y+item.halfH*.75*scale+.03}];
    return candidates.find(pt=>petWalkable(pt.x,pt.y,p.id))||randomPetFloorPoint();
  }
  function choosePetAction(now=Date.now()){
    const interactions=state.placements.map(p=>({p,item:ITEM_BY_ID.get(p.assetId)})).map(entry=>({...entry,kind:petInteractionKind(entry.item)})).filter(entry=>entry.kind&&entry.p.id!==petState.lastPlacementId);
    const furnitureChance=interactions.length?.46:0;
    if(Math.random()<furnitureChance){
      const weighted=[];for(const entry of interactions){const copies=(entry.kind==='sleep'||entry.kind==='perch')?3:(entry.kind==='surface'||entry.kind==='seat'?2:1);for(let i=0;i<copies;i++)weighted.push(entry);}
      const choice=weighted[Math.floor(Math.random()*weighted.length)];const approach=petApproachFor(choice.p,choice.item);
      petState.targetX=approach.x;petState.targetY=approach.y;petState.targetPlacementId=choice.p.id;petState.plannedKind=choice.kind;petState.mode='walk';return;
    }
    if(Math.random()<.72){const point=randomPetFloorPoint();petState.targetX=point.x;petState.targetY=point.y;petState.targetPlacementId='';petState.plannedKind='';petState.mode='walk';return;}
    petState.mode='idle';petState.nextDecisionAt=now+1400+Math.random()*3400;
  }
  function mountPet(now=Date.now()){
    const p=state.placements.find(x=>x.id===petState.targetPlacementId),item=p&&ITEM_BY_ID.get(p.assetId);if(!p||!item){petState.targetPlacementId='';petState.mode='idle';petState.nextDecisionAt=now+800;return;}
    const kind=petState.plannedKind||petInteractionKind(item),mount=petMountFor(p,item,kind);
    petState.x=mount.x;petState.y=mount.y;petState.mode=mount.anim==='sleep'?'sleep':'mounted';petState.mountedPlacementId=p.id;petState.lastPlacementId=p.id;petState.actionUntil=now+(kind==='sleep'?6500+Math.random()*6500:3200+Math.random()*4700);petState.targetPlacementId='';petState.targetX=null;petState.targetY=null;petState.frame=0;petState.frameTimer=0;queuePetSave();
  }
  function renderPet(){
    if(!petEl)return;const def=PET_BY_ID.get(petState.selectedId);
    if(!def){petEl.hidden=true;petEl.setAttribute('aria-hidden','true');if(petHoverEl)petHoverEl.hidden=true;closePetMenu();return;}
    petEl.hidden=false;petEl.setAttribute('aria-hidden','false');petEl.style.left=`${petState.x*100}%`;petEl.style.top=`${petState.y*100}%`;petEl.style.width=`${def.width}%`;petEl.setAttribute('aria-label',`Bedroom pet ${petDisplayName(def,true)}`);
    const mounted=!!petState.mountedPlacementId;petEl.style.zIndex=String(mounted?4200:150+Math.round(petState.y*1000));
    const anim=petState.mode==='walk'?'walk':petState.mode==='sleep'?'sleep':'idle';const img=petEl.querySelector('img');const src=petFrameSrc(def.id,anim,petState.frame%4);if(img&&img.getAttribute('src')!==src)img.src=src;
    petEl.classList.toggle('is-flipped',petState.dir==='left');petEl.classList.toggle('is-mounted',mounted);petEl.classList.toggle('is-sleeping',anim==='sleep');positionPetUi();updatePetHover();
  }
  function tickPet(dt,now){
    const def=PET_BY_ID.get(petState.selectedId);if(!def){renderPet();return;}
    if(petMenuOpen){petState.frameTimer+=dt;const idleInterval=.52;if(petState.frameTimer>=idleInterval){petState.frame=(petState.frame+1)%4;petState.frameTimer=0;}renderPet();return;}
    if(editMode||placingItemId){if(petState.mountedPlacementId){const point=randomPetFloorPoint();petState.x=point.x;petState.y=point.y;petState.mountedPlacementId='';petState.mode='idle';petState.nextDecisionAt=now+1200;}renderPet();return;}
    if(petState.mountedPlacementId){
      const p=state.placements.find(x=>x.id===petState.mountedPlacementId),item=p&&ITEM_BY_ID.get(p.assetId);if(!p||!item){petState.mountedPlacementId='';petState.mode='idle';petState.nextDecisionAt=now+700;}
      else{const kind=petInteractionKind(item),mount=petMountFor(p,item,kind);petState.x=mount.x;petState.y=mount.y;if(p.flipped)petState.dir='left';else petState.dir='right';if(now>=petState.actionUntil){petState.mountedPlacementId='';petState.mode='idle';const point=petApproachFor(p,item);petState.x=point.x;petState.y=point.y;petState.nextDecisionAt=now+900+Math.random()*1700;queuePetSave();}}
    }
    if(petState.mode==='walk'&&Number.isFinite(petState.targetX)&&Number.isFinite(petState.targetY)){
      const dx=petState.targetX-petState.x,dy=petState.targetY-petState.y,dist=Math.hypot(dx,dy);
      if(Math.abs(dx)>.002)petState.dir=dx<0?'left':'right';
      if(dist<.009){if(petState.targetPlacementId)mountPet(now);else{petState.x=petState.targetX;petState.y=petState.targetY;petState.mode='idle';petState.targetX=null;petState.targetY=null;petState.nextDecisionAt=now+900+Math.random()*2600;queuePetSave();}}
      else{const step=Math.min(dist,def.speed*dt),nx=petState.x+(dx/dist)*step,ny=petState.y+(dy/dist)*step;if(petWalkable(nx,ny,petState.targetPlacementId)){petState.x=nx;petState.y=ny;}else{petState.mode='idle';petState.targetX=null;petState.targetY=null;petState.targetPlacementId='';petState.nextDecisionAt=now+500+Math.random()*900;}}
    }else if(!petState.mountedPlacementId&&petState.mode!=='sleep'&&now>=petState.nextDecisionAt){choosePetAction(now);}
    if(petState.mode==='sleep'&&!petState.mountedPlacementId&&now>=petState.actionUntil){petState.mode='idle';petState.nextDecisionAt=now+1000;}
    petState.frameTimer+=dt;const interval=petState.mode==='walk'?.14:petState.mode==='sleep'?.62:.48;if(petState.frameTimer>=interval){petState.frame=(petState.frame+1)%4;petState.frameTimer=0;}
    if(now-petState.lastSavedAt>10000)writePetLocal();renderPet();
  }

  function tick(ts){
    if(!open){raf=0;return;}
    if(!lastTick)lastTick=ts;
    const dt=Math.min(.05,(ts-lastTick)/1000); lastTick=ts;
    const player=state.player||defaultPlayerForUser(currentUsername());
    let dx=0,dy=0;
    if(!editMode&&!placingItemId&&player.pose==='idle'){
      if(keys.up)dy-=1; if(keys.down)dy+=1; if(keys.left)dx-=1; if(keys.right)dx+=1;
      const moving = dx||dy;
      if(moving){
        const len=Math.hypot(dx,dy)||1; dx/=len; dy/=len;
        if(Math.abs(dx)>Math.abs(dy))player.dir=dx<0?'left':'right'; else player.dir=dy<0?'up':'down';
        const speed=.22;
        const next=movePlayerWithCollision(player,player.x+dx*speed*dt,player.y+dy*speed*dt);
        player.x=next.x; player.y=next.y;
        playerFrameTimer += dt;
        if(playerFrameTimer>.12){playerFrame=(playerFrame+1)%4;playerFrameTimer=0;}
      }else{playerFrame=0; playerFrameTimer=0;}
    }else if(player.pose!=='idle'){
      if(player.pose==='sleep'){
        // V33.20: hold one consistent sleep frame because some later sleep cells
        // are slightly larger and cause visible popping while lying in bed.
        playerFrame=0; playerFrameTimer=0;
      }else{
        playerFrameTimer+=dt;
        const actionFrameDelay=player.pose==='sit'?.75:.22;
        if(playerFrameTimer>=actionFrameDelay){playerFrame=(playerFrame+1)%4;playerFrameTimer=0;}
      }
    }
    renderPlayer();tickPet(dt,Date.now()); updateInteractionHint();
    raf=requestAnimationFrame(tick);
  }
  function startLoop(){ if(!raf){ lastTick=0; raf=requestAnimationFrame(tick);} }
  function stopLoop(){ if(raf)cancelAnimationFrame(raf); raf=0; lastTick=0; keys={up:false,down:false,left:false,right:false}; interactionTargetId=''; petHovering=false; writePetLocal(); if(interactionHintEl)interactionHintEl.hidden=true; if(petHoverEl)petHoverEl.hidden=true; }

  // Attach when Dragonbound's dynamically-built home sidebar exists.
  const attach=()=>{ensureLauncher();ensureTransitionVeil();startAvatarLoop();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
  const observer=new MutationObserver(()=>{if(!launcher?.isConnected)ensureLauncher();if(!avatarHud?.isConnected)ensureAvatarHud();updateAvatarAnchor();});observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('dragonbound:home-ready',attach);
  window.addEventListener('resize',updateAvatarAnchor,{passive:true});
  window.addEventListener('scroll',updateAvatarAnchor,{passive:true});
  document.addEventListener('click',event=>{handleAvatarInteraction(event.target);setTimeout(updateAvatarAnchor,30);},true);
  document.addEventListener('keydown',event=>{
    const tag=document.activeElement?.tagName||'';
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
    if(open&&state.player?.pose==='sleep')return;
    const key=String(event.key||'').toLowerCase();
    if(['e',' ','enter'].includes(key))setAvatarMood('speak',1500);
    else if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)&&!open)setAvatarMood('idle',420);
  },true);

  window.VelmoraBedroom={open:openBedroom,close:returnToMainHouse,state:()=>JSON.parse(JSON.stringify(state)),petState:()=>JSON.parse(JSON.stringify(petState)),rooms:ROOMS.map(r=>({...r})),items:ITEMS.map(i=>({...i})),pets:PET_BREEDS.map(p=>({...p})),keepers:KEEPER_SHEETS.map(k=>({...k})),resetLocal:()=>{try{localStorage.removeItem(storageKey());localStorage.removeItem(petStorageKey())}catch(_){}},avatarMode:()=>avatarMode(),setAvatarMood:(mode,duration)=>setAvatarMood(mode,duration)};
})();
