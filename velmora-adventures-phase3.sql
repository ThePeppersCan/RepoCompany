-- VELMORA ADVENTURES V25.0 / PHASE 3
-- Recovery/documentation SQL. Live migrations were already applied.


-- VELMORA ADVENTURES V25.0 / PHASE 3
-- Dynamic narrative + emergent adventure engine foundation.

create table if not exists public.adventure_feature_catalog (
  feature_key text primary key,
  location_id text not null references public.adventure_locations(id) on delete cascade,
  name text not null,
  aliases text[] not null default '{}',
  description text not null,
  feature_type text not null,
  interaction_tags text[] not null default '{}',
  default_stat text not null check (default_stat in ('strength','agility','endurance','perception','intelligence','charisma','survival','arcana')),
  dc_category text not null default 'standard' check (dc_category in ('trivial','easy','standard','hard','very_hard')),
  time_cost integer not null default 5 check (time_cost between 1 and 120),
  risk_level text not null default 'low' check (risk_level in ('none','low','medium','high')),
  persistent boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists adventure_feature_catalog_location_idx on public.adventure_feature_catalog(location_id);

create table if not exists public.adventure_rumour_catalog (
  rumour_key text primary key,
  origin_location_id text references public.adventure_locations(id) on delete set null,
  subject text not null,
  rumour_text text not null,
  truth_state text not null check (truth_state in ('true','false','partially_true','misunderstood')),
  importance integer not null default 3 check (importance between 1 and 10),
  expiry_days integer not null default 0 check (expiry_days between 0 and 365),
  known_by_npcs text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.adventure_event_catalog (
  event_key text primary key,
  title text not null,
  location_ids text[] not null,
  category text not null,
  description text not null,
  interaction_tags text[] not null default '{}',
  default_stat text not null check (default_stat in ('strength','agility','endurance','perception','intelligence','charisma','survival','arcana')),
  dc_category text not null default 'standard' check (dc_category in ('trivial','easy','standard','hard','very_hard')),
  duration_minutes integer not null default 240 check (duration_minutes between 30 and 1440),
  weight integer not null default 10 check (weight between 1 and 100),
  reward_adventure_xp integer not null default 0 check (reward_adventure_xp between 0 and 250),
  reward_gold integer not null default 0 check (reward_gold between 0 and 250),
  profession_key text,
  reward_profession_xp integer not null default 0 check (reward_profession_xp between 0 and 250),
  reputation_delta integer not null default 1 check (reputation_delta between -5 and 5),
  success_text text not null,
  failure_text text not null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.adventure_microquest_template_catalog (
  template_key text primary key,
  objective_type text not null check (objective_type in ('delivery','search','investigation','missing_item','wildlife','gathering','social_favour','escort','observation','local_problem')),
  name_pattern text not null,
  description_pattern text not null,
  default_stat text not null check (default_stat in ('strength','agility','endurance','perception','intelligence','charisma','survival','arcana')),
  dc_category text not null check (dc_category in ('trivial','easy','standard','hard','very_hard')),
  profession_key text,
  min_gold integer not null default 0 check (min_gold between 0 and 250),
  max_gold integer not null default 0 check (max_gold between 0 and 250),
  min_xp integer not null default 0 check (min_xp between 0 and 250),
  max_xp integer not null default 0 check (max_xp between 0 and 250),
  min_prof_xp integer not null default 0 check (min_prof_xp between 0 and 250),
  max_prof_xp integer not null default 0 check (max_prof_xp between 0 and 250),
  expiry_minutes integer not null default 1440 check (expiry_minutes between 120 and 4320),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.adventure_dynamic_quests (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  template_key text not null references public.adventure_microquest_template_catalog(template_key),
  giver_npc_key text,
  title text not null,
  description text not null,
  source_location_id text not null references public.adventure_locations(id),
  target_location_id text not null references public.adventure_locations(id),
  objective_type text not null,
  target_key text,
  status text not null default 'active' check (status in ('active','completed','expired','abandoned')),
  difficulty text not null,
  reward_gold integer not null default 0 check (reward_gold between 0 and 250),
  reward_adventure_xp integer not null default 0 check (reward_adventure_xp between 0 and 250),
  profession_key text,
  reward_profession_xp integer not null default 0 check (reward_profession_xp between 0 and 250),
  expires_stamp integer not null,
  progress jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists adventure_dynamic_quests_character_idx on public.adventure_dynamic_quests(character_id,status,created_at desc);

create table if not exists public.adventure_local_reputation (
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  location_id text not null references public.adventure_locations(id) on delete cascade,
  score integer not null default 0 check (score between -100 and 100),
  updated_at timestamptz not null default now(),
  primary key(character_id,location_id)
);

revoke all on public.adventure_feature_catalog from anon, authenticated;
revoke all on public.adventure_rumour_catalog from anon, authenticated;
revoke all on public.adventure_event_catalog from anon, authenticated;
revoke all on public.adventure_microquest_template_catalog from anon, authenticated;
revoke all on public.adventure_dynamic_quests from anon, authenticated;
revoke all on public.adventure_local_reputation from anon, authenticated;




-- Phase 3 tool item
insert into public.adventure_item_catalog(item_key,name,category,description,value,rarity,icon,tags,check_bonuses)
values('simple_rope','Simple Climbing Rope','Tools','A practical coil of rope. Not magical, which is exactly why it remains useful.',18,'common','⌁','["exploration","rope"]'::jsonb,'{"climb":2}'::jsonb)
on conflict(item_key) do update set name=excluded.name,category=excluded.category,description=excluded.description,value=excluded.value,rarity=excluded.rarity,icon=excluded.icon,tags=excluded.tags,check_bonuses=excluded.check_bonuses;


insert into public.adventure_feature_catalog(feature_key,location_id,name,aliases,description,feature_type,interaction_tags,default_stat,dc_category,time_cost,risk_level,metadata) values
('canto_old_clock','canto_crossing','Old Crossing Clock',array['old clock','clock tower','clock','crossing clock']::text[],'A brass-faced roadside clock older than several nearby buildings. Its service plate has been opened and closed hundreds of times.','landmark',array['inspect','listen','open','climb','investigate']::text[],'intelligence','easy',6,'low','{"success_text":"You follow the clockwork through its uneven tick and find scratches from at least three different repair hands. One mark is deliberately repeated rather than accidental.","clue_key":"clock_repair_marks","clue_name":"Repeated marks inside the Canto clock","clue_text":"The old clock carries a repeated repair mark made intentionally by more than one hand.","discovery_xp":18}'::jsonb),
('canto_notice_board','canto_crossing','Notice Board',array['notice board','job board','board']::text[],'Layers of contracts, lost-animal notes and curling public notices cover the timber board beside the clock.','notice',array['inspect','search','read','help']::text[],'perception','easy',4,'none','{}'::jsonb),
('canto_courier_office','canto_crossing','Courier Office',array['courier office','courier desk','parcel office']::text[],'A narrow green-trimmed office where route wallets, seals and complaints are sorted with equal seriousness.','building',array['inspect','ask','listen','help']::text[],'charisma','standard',8,'low','{}'::jsonb),
('canto_market_arcade','canto_crossing','Market Arcade',array['market','market stalls','arcade','stalls']::text[],'A roofed row of produce tables, odd tools and arguments about prices that probably began before breakfast.','market',array['inspect','ask','help','buy','sell']::text[],'charisma','easy',8,'none','{}'::jsonb),
('canto_stable_yard','canto_crossing','Stable Yard',array['stable','stable yard','horses','cart yard']::text[],'A cobbled yard with feed bins, tired draft animals and the sort of mud that survives every season.','yard',array['inspect','help','search','track']::text[],'survival','easy',8,'low','{}'::jsonb),
('canto_drainage_culvert','canto_crossing','Old Drainage Culvert',array['culvert','drain','drainage channel','old drain']::text[],'A low stone culvert disappearing beneath the western lane. Most people have learned not to think about it.','structure',array['inspect','listen','crawl','search']::text[],'perception','standard',9,'medium','{"success_text":"The culvert is ordinary until the final few stones, where older pale blocks sit beneath the modern lane at a different angle. The road was built over something already here.","clue_key":"canto_older_foundations","clue_name":"Older stone beneath Canto Crossing","clue_text":"Pale stonework below the western lane predates the current road layout.","discovery_xp":20}'::jsonb),
('willowmere_mill_roof','willowmere','Mill Roof',array['mill roof','roof','mill tiles','upstairs roof']::text[],'Dark tile slopes above the flour store. A loft shutter faces the river and one gutter bracket looks less trustworthy than the others.','roof',array['climb','inspect','hide','listen']::text[],'agility','standard',8,'medium','{"tool_tags":["rope"],"success_text":"You find a secure route onto the lower roof and a dry ledge beneath the loft shutter. From here the mill sounds different: the familiar wheel knock, then a second, duller answer from below."}'::jsonb),
('willowmere_waterwheel','willowmere','Mill Waterwheel',array['waterwheel','water wheel','mill wheel','wheel']::text[],'The broad wheel turns with an old complaint at every revolution, throwing cold droplets across the race wall.','machinery',array['inspect','listen','manipulate','help']::text[],'intelligence','standard',7,'medium','{}'::jsonb),
('willowmere_herb_garden','willowmere','Riverside Herb Garden',array['herb garden','garden','elsie garden','riverside garden']::text[],'Neat herb beds sit behind a low woven fence. Labels mark the useful plants; the unlabelled ones are probably more interesting.','garden',array['inspect','forage','help','smell']::text[],'survival','easy',8,'low','{}'::jsonb),
('willowmere_footbridge','willowmere','Willowmere Footbridge',array['bridge','footbridge','wooden bridge']::text[],'A narrow timber bridge crosses the mill race. One rail is new, the rest are polished by decades of hands.','bridge',array['inspect','listen','hide','search']::text[],'perception','easy',5,'low','{}'::jsonb),
('willowmere_old_drain','willowmere','Old Mill Drainage Channel',array['drainage channel','old drain','mill drain','race wall','old race wall']::text[],'A half-buried channel behind the mill where the current race meets masonry from an older layout.','structure',array['inspect','search','listen','pry','crawl']::text[],'perception','hard',12,'medium','{"success_text":"Behind nettles and damp stone you find the old channel continuing farther inland than the present mill needs. Its alignment points roughly toward the old watch road.","clue_key":"willowmere_old_channel_alignment","clue_name":"Willowmere drainage channel points inland","clue_text":"An obsolete mill channel continues toward the old watch road rather than the current riverworks.","discovery_xp":24}'::jsonb),
('willowmere_storage_shed','willowmere','Mill Storage Shed',array['storage shed','shed','mill shed']::text[],'A leaning shed with sacks, spare paddles, broken tools and a door that only closes when encouraged.','building',array['inspect','search','help','listen']::text[],'perception','standard',8,'low','{}'::jsonb),
('riverglass_stepping_stones','riverglass_ford','Ford Stones',array['stepping stones','ford stones','crossing stones','stones']::text[],'Pale stones form the shallowest line across the Riverglass. Their edges are smoothed by water and boots.','river_feature',array['inspect','cross','balance','search']::text[],'agility','easy',5,'low','{}'::jsonb),
('riverglass_reed_bank','riverglass_ford','Chattering Reed Bank',array['reeds','reed bank','river reeds']::text[],'Tall reeds knot together at the bend, hiding small tracks and anything patient enough to remain still.','habitat',array['inspect','hide','track','listen']::text[],'survival','standard',9,'low','{}'::jsonb),
('riverglass_ferry_post','riverglass_ford','Old Ferry Post',array['ferry post','mooring post','old post']::text[],'A scarred mooring post with layers of rope grooves and faded route marks.','landmark',array['inspect','use_item','tie','search']::text[],'intelligence','easy',5,'none','{}'::jsonb),
('riverglass_upstream_bend','riverglass_ford','Upstream Bend',array['upstream','river bend','upstream bend']::text[],'The river narrows upstream beneath willow shade, where surface ripples reveal more than the open ford does.','river_feature',array['inspect','search','fish','listen']::text[],'perception','standard',10,'low','{}'::jsonb),
('riverglass_pale_shingle','riverglass_ford','Pale Shingle Bank',array['shingle','pebbles','gravel bank','river stones']::text[],'A bright strip of river-worn stone. Most are ordinary; a few are strangely glass-clear.','shore',array['inspect','search','forage']::text[],'perception','easy',7,'none','{}'::jsonb),
('animal_feed_crates','animal_centre_gate','Feed Crates',array['feed crates','crates','animal feed']::text[],'Lidded feed crates are marked by species, dosage and several increasingly annoyed handwritten corrections.','supplies',array['inspect','help','use_item']::text[],'intelligence','easy',5,'none','{}'::jsonb),
('animal_keeper_notices','animal_centre_gate','Keeper Notices',array['keeper notices','notices','animal notices']::text[],'Weather-stained keeper notes record sightings, release advice and warnings against carrying frightened wildlife by hand.','notice',array['inspect','read','search']::text[],'perception','easy',5,'none','{}'::jsonb),
('animal_muddy_tracks','animal_centre_gate','Muddy Track Patch',array['muddy tracks','tracks','mud','footprints']::text[],'A churned patch by the gate contains boot marks, paw prints and at least one trail that slips under the pasture fence.','tracks',array['track','inspect','search']::text[],'survival','standard',10,'low','{}'::jsonb),
('animal_quarantine_shed','animal_centre_gate','Quarantine Shed',array['quarantine shed','shed','recovery shed']::text[],'A quiet whitewashed shed with screened windows and strict KEEP QUIET signs.','building',array['inspect','listen','help']::text[],'perception','standard',6,'low','{}'::jsonb),
('animal_pasture_fence','animal_centre_gate','Pasture Fence',array['pasture fence','fence','field fence']::text[],'A long low fence separates the centre from rough meadow. Several tufts of fur cling to the lower rail.','boundary',array['inspect','track','repair','help']::text[],'survival','easy',8,'low','{}'::jsonb),
('verge_boundary_stones','canto_plains_verge','Old Boundary Stones',array['boundary stones','old stones','markers','boundary markers']::text[],'Lichen-covered stones run across the meadow in a line that no longer matches any modern field edge.','landmark',array['inspect','search','compare','track']::text[],'intelligence','standard',9,'low','{"clue_key":"verge_boundary_mismatch","clue_name":"Old boundary line ignores modern fields","clue_text":"The East Verge boundary stones follow a route older than the current farms and roads.","discovery_xp":18}'::jsonb),
('verge_windmill','canto_plains_verge','Field Windmill',array['windmill','field mill','old windmill']::text[],'A small field windmill rattles above the grass, useful mostly for water pumping and making distant noise.','structure',array['inspect','climb','listen']::text[],'agility','standard',8,'medium','{}'::jsonb),
('verge_sheep_path','canto_plains_verge','Convincing Sheep Path',array['sheep path','animal path','little path']::text[],'A narrow trail through the grass. It looks purposeful until it reaches a patch of excellent clover.','trail',array['track','follow','inspect']::text[],'survival','easy',7,'none','{}'::jsonb),
('verge_old_milestone','canto_plains_verge','Half-Sunk Milestone',array['milestone','old milestone','road stone']::text[],'A squat marker almost swallowed by turf. The lettering names a road nobody uses now.','landmark',array['inspect','clean','search']::text[],'intelligence','standard',7,'low','{}'::jsonb),
('verge_tall_grass','canto_plains_verge','Tall Meadow Grass',array['tall grass','meadow grass','grass']::text[],'Waist-high grass ripples in the wind and briefly parts around anything moving through it.','habitat',array['hide','track','search','observe']::text[],'survival','easy',8,'low','{}'::jsonb),
('bellmead_archive_shelves','bellmead','Bellmead Archive Shelves',array['archive shelves','archive','records','shelves']::text[],'Narrow shelves hold survey books, orchard records and boundary disputes preserved with alarming thoroughness.','archive',array['inspect','search','read','compare']::text[],'intelligence','standard',12,'none','{}'::jsonb),
('bellmead_bell_house','bellmead','Old Bell-House',array['bell house','bell-house','old bell','village bell']::text[],'The village bell hangs in a squat timber frame older than the orchard wall around it.','landmark',array['inspect','listen','climb']::text[],'perception','standard',7,'medium','{}'::jsonb),
('bellmead_west_orchard','bellmead','West Orchard',array['orchard','west orchard','apple trees']::text[],'Rows of low fruit trees slope toward the western stones. Ladders lean wherever work stopped last.','orchard',array['help','inspect','search','climb']::text[],'endurance','easy',18,'low','{}'::jsonb),
('bellmead_bee_lane','bellmead','Bee Lane',array['bees','bee lane','hives','beehives']::text[],'A warm lane of painted hives humming behind a woven fence. Jori has marked the safe walking line with white stones.','habitat',array['inspect','help','listen']::text[],'survival','standard',8,'medium','{}'::jsonb),
('bellmead_old_boundary_map','bellmead','Pre-Road Boundary Map',array['boundary map','old map','survey map','pre-road map']::text[],'A framed copy of a very old survey hangs behind the archive desk. Its margins are full of compact survey shorthand.','document',array['inspect','read','compare','use_item']::text[],'intelligence','hard',12,'none','{"success_text":"Once you stop treating the margin marks as decoration, the three-pronged sign appears as a compact boundary notation beside two entries that predate the modern Canto road.","clue_key":"survey_three_prong_notation","clue_name":"Three-prong sign used in old surveys","clue_text":"Bellmead survey shorthand uses the three-pronged mark beside pre-road boundary references.","discovery_xp":28}'::jsonb),
('whisperbank_moss_bank','whisperbank_grove','Moss Bank',array['moss bank','mossy bank','moss']::text[],'A raised bank of deep moss where moisture survives even after several dry days.','habitat',array['inspect','forage','search']::text[],'survival','easy',7,'none','{}'::jsonb),
('whisperbank_hidden_spring','whisperbank_grove','Hidden Spring',array['spring','hidden spring','water source']::text[],'Cold water slips from beneath roots into a stone cup almost invisible under fern.','water_feature',array['inspect','drink','search','use_item']::text[],'survival','standard',8,'low','{}'::jsonb),
('whisperbank_marker','whisperbank_grove','Moss-Covered Survey Marker',array['survey marker','stone marker','marker','three cuts']::text[],'A narrow survey stone leans beneath ivy. Three shallow cuts mark one face beneath the moss.','landmark',array['inspect','clean','compare','use_item']::text[],'perception','hard',10,'low','{"success_text":"The moss comes away from three deliberate cuts. They match the shape used in old Canto rubbings, though this marker sits far from the present road.","clue_key":"whisperbank_three_cut_marker","clue_name":"Three-cut marker in Whisperbank","clue_text":"A hidden Whisperbank survey marker carries the same three-cut motif as older Canto records.","discovery_xp":24}'::jsonb),
('whisperbank_beetle_path','whisperbank_grove','Beetle Path',array['beetle path','little path','insect trail']::text[],'A line of disturbed leaf litter leads between rotting logs and a patch of pale fungus.','habitat',array['inspect','follow','observe']::text[],'perception','easy',6,'none','{}'::jsonb),
('whisperbank_fallen_ash','whisperbank_grove','Fallen Ash Tree',array['fallen tree','ash tree','fallen ash']::text[],'A storm-felled ash bridges the shallow bank. Its roots have lifted a layer of older stonework.','natural_structure',array['inspect','climb','search']::text[],'strength','standard',8,'low','{}'::jsonb),
('watch_notched_wall','old_canto_watch','Three-Notched Wall',array['notched wall','marked wall','three prongs','three notches','marked stone']::text[],'A pale wall survives waist-high. Three shallow notches repeat across several blocks with too much consistency to be mason damage.','ruin_feature',array['inspect','compare','use_item','knock','pry']::text[],'intelligence','hard',12,'medium','{"success_text":"Measured against the spacing on your other notes, the three cuts repeat at deliberate intervals. They mark sections of wall, not individual stones.","clue_key":"old_watch_notches_are_sections","clue_name":"Old Canto notches mark wall sections","clue_text":"The three-prong cuts at Old Canto Watch mark sections of the structure rather than individual stones.","discovery_xp":30}'::jsonb),
('watch_collapsed_chamber','old_canto_watch','Collapsed Chamber',array['collapsed chamber','chamber','rubble room','collapsed room']::text[],'A roofless side chamber is filled waist-high with broken pale blocks and windblown soil.','ruin_feature',array['search','move','climb','listen']::text[],'strength','hard',15,'medium','{}'::jsonb),
('watch_old_hearth','old_canto_watch','Old Hearth',array['hearth','old fireplace','fireplace']::text[],'A blackened hearth sits against an interior wall. Some soot is much newer than the masonry.','ruin_feature',array['inspect','search','smell']::text[],'perception','standard',8,'low','{"success_text":"Beneath old ash you find newer charcoal and a clean boot scrape. Somebody has sheltered here recently.","clue_key":"watch_recent_visitors","clue_name":"Recent visitors used the Old Canto hearth","clue_text":"Fresh charcoal and a boot scrape show that somebody has used the Old Canto Watch recently.","discovery_xp":22}'::jsonb),
('watch_tower_stairs','old_canto_watch','Broken Tower Stairs',array['tower stairs','stairs','broken steps','tower']::text[],'Only the lowest stair flight remains intact. Above it, the tower wall offers handholds with increasingly bad consequences.','ruin_feature',array['climb','inspect','listen']::text[],'agility','hard',10,'high','{"tool_tags":["rope"]}'::jsonb),
('watch_foundation_crack','old_canto_watch','Foundation Crack',array['foundation crack','sealed crack','crack','foundation']::text[],'A narrow vertical crack disappears beneath the ruined floor. Cold air moves through it even on still days.','ruin_feature',array['inspect','listen','pry','use_item']::text[],'perception','hard',10,'medium','{"success_text":"The draft is steady and carries dry dust rather than damp soil. The crack opens into a hollow space below the visible foundations.","clue_key":"watch_hollow_foundation","clue_name":"Hollow space beneath Old Canto Watch","clue_text":"A steady dry draft reveals a hollow space below the visible foundations of Old Canto Watch.","discovery_xp":26}'::jsonb),
('lake_reed_hide','lake_eira','Old Reed Hide',array['reed hide','bird hide','hide','reed shelter']::text[],'A low woven blind sits among the reeds, repaired often enough that nobody remembers who built it first.','shelter',array['hide','observe','listen']::text[],'perception','easy',8,'none','{}'::jsonb),
('lake_mirrored_shore','lake_eira','Mirror-Still Shore',array['shore','mirror water','mirrored shore','water']::text[],'A shallow bay where the water sometimes refuses to show the wind moving above it.','water_feature',array['inspect','throw','listen','observe']::text[],'perception','standard',9,'low','{"success_text":"Your disturbance spreads normally for several rings, then bends around one fixed point beneath the surface. Something solid sits below the silt."}'::jsonb),
('lake_old_jetty','lake_eira','Old Jetty',array['jetty','dock','old dock']::text[],'A short timber jetty creaks over reed-dark water. Two newer boards interrupt the otherwise silver-grey planks.','structure',array['inspect','fish','listen','search']::text[],'perception','easy',7,'low','{}'::jsonb),
('lake_north_bank','lake_eira','Northern Bank',array['north bank','northern bank','far bank']::text[],'A quieter stretch beyond the reed line where tracks hold longer in damp soil.','habitat',array['track','search','observe']::text[],'survival','standard',10,'low','{}'::jsonb),
('lake_submerged_marker','lake_eira','Submerged Stone Marker',array['submerged marker','underwater stone','stone in water','sunken marker']::text[],'A pale squared shape can sometimes be seen below the water when the light is right.','landmark',array['inspect','reach','use_item','search']::text[],'perception','hard',12,'medium','{"success_text":"The stone is worked rather than natural. One upper corner carries three worn grooves, almost erased by water.","clue_key":"lake_submerged_three_grooves","clue_name":"Three grooves on a submerged Lake Eira marker","clue_text":"A submerged worked stone at Lake Eira bears three weathered grooves similar to the old survey mark.","discovery_xp":26}'::jsonb),
('redbank_foxglove_bank','redbank_hollow','Foxglove Bank',array['foxglove','foxglove bank','flower bank']::text[],'Tall foxgloves crowd the red bank. Several stems have been bent aside recently without being cut.','habitat',array['inspect','track','forage']::text[],'survival','standard',8,'low','{}'::jsonb),
('redbank_old_firepit','redbank_hollow','Old Firepit',array['firepit','old fire','charcoal pit']::text[],'A shallow ring of stones sits beneath leaf litter. The charcoal has been disturbed more recently than the pit was built.','site',array['inspect','search','smell']::text[],'perception','standard',8,'low','{}'::jsonb),
('redbank_clay_tracks','redbank_hollow','Clay Track Patch',array['clay tracks','tracks','red mud','track patch']::text[],'Fine red clay preserves tracks beautifully until the next hard rain.','tracks',array['track','inspect','cast']::text[],'survival','standard',10,'low','{}'::jsonb),
('redbank_hollow_oak','redbank_hollow','Hollow Oak',array['hollow oak','oak tree','hollow tree']::text[],'An old oak opens at shoulder height into a dry cavity full of leaves, shells and things animals decided were worth keeping.','natural_structure',array['inspect','search','hide','climb']::text[],'perception','standard',8,'low','{}'::jsonb),
('redbank_animal_trail','redbank_hollow','Narrow Animal Trail',array['animal trail','trail','little track']::text[],'A discreet path slips through bramble toward the Animal Centre pasture fence.','trail',array['follow','track','hide']::text[],'survival','easy',9,'low','{}'::jsonb)
on conflict(feature_key) do update set location_id=excluded.location_id,name=excluded.name,aliases=excluded.aliases,description=excluded.description,feature_type=excluded.feature_type,interaction_tags=excluded.interaction_tags,default_stat=excluded.default_stat,dc_category=excluded.dc_category,time_cost=excluded.time_cost,risk_level=excluded.risk_level,metadata=excluded.metadata;

insert into public.adventure_rumour_catalog(rumour_key,origin_location_id,subject,rumour_text,truth_state,importance,expiry_days,known_by_npcs) values
('sealed_parcels','canto_crossing','strange parcel seals','Three parcels this week arrived with seals nobody at the courier office remembers using.','partially_true',6,0,array['nell_bristlebell','mina_vale']::text[]),
('watch_bootprints','canto_crossing','Old Canto Watch','Fresh boot marks have been seen near Old Canto Watch, although nobody admits making them.','true',7,0,array['sella_wren','pell_rook']::text[]),
('mill_answering','willowmere','Willowmere mill','After sunset the Willowmere mill sometimes sounds as if something beneath it knocks back.','partially_true',7,0,array['mara_venn','bram_hollow','lio_march']::text[]),
('mooncap_dry_stone','willowmere','mooncap','Mooncap has appeared beside stone that should be far too dry for it.','true',5,0,array['elsie_reed','yara_moss']::text[]),
('lake_mirror','riverglass_ford','Lake Eira','Lake Eira has been mirror-still on windy mornings.','true',5,0,array['nessa_ford','roan_silts']::text[]),
('ferrets_inland','animal_centre_gate','Reedtail ferrets','Reedtail ferrets are ranging farther inland than Keeper Darwin expects.','true',5,0,array['keeper_darwin','miri_holt']::text[]),
('missing_survey_page','bellmead','Bellmead archive','One old survey volume has a page missing so neatly that Orla insists it was removed on purpose.','true',8,0,array['orla_fen','jori_bell']::text[]),
('moved_ladder','bellmead','west orchard','Kester keeps finding the west-orchard ladder moved overnight. He blames children, bees, and then children again.','misunderstood',3,0,array['kester_loam','jori_bell']::text[]),
('whisperbank_marker','canto_plains_verge','Whisperbank marker','A survey marker near Whisperbank carries three cuts like the stones at Old Canto Watch.','true',7,0,array['pell_rook','sella_wren']::text[]),
('river_warm_morning','riverglass_ford','Riverglass','The Riverglass ran noticeably warm for one morning last week, then returned to normal before noon.','partially_true',4,3,array['nessa_ford','roan_silts']::text[]),
('quail_west_stones','bellmead','Ambercrest quail','Ambercrest quail have stopped nesting beside Bellmead’s west stones.','true',4,0,array['kester_loam','keeper_darwin']::text[]),
('watch_lanterns','old_canto_watch','lights at Old Canto Watch','Two travellers claim they saw lantern light at the old watch-house after midnight.','partially_true',6,2,array['mina_vale','sella_wren']::text[])
on conflict(rumour_key) do update set origin_location_id=excluded.origin_location_id,subject=excluded.subject,rumour_text=excluded.rumour_text,truth_state=excluded.truth_state,importance=excluded.importance,expiry_days=excluded.expiry_days,known_by_npcs=excluded.known_by_npcs;

insert into public.adventure_event_catalog(event_key,location_ids,category,title,description,interaction_tags,default_stat,dc_category,duration_minutes,weight,reward_adventure_xp,reward_gold,profession_key,reward_profession_xp,reputation_delta,success_text,failure_text) values
('merchant_cart_breakdown',array['canto_crossing','canto_plains_verge','bellmead']::text[],'Local Problem','Broken Merchant Cart','A merchant cart has lost a wheel pin and is blocking more road than seems physically possible.',array['help','repair','inspect']::text[],'strength','standard',240,12,45,18,'crafting',40,2,'You help brace the axle and get the cart moving before the road becomes a public meeting about axle design.','The cart refuses your first solution and remains stubbornly part of the road.'),
('storm_footbridge',array['willowmere','riverglass_ford']::text[],'Weather','Storm-Damaged Crossing','Recent weather has loosened boards and ropes at a small crossing.',array['help','repair','inspect']::text[],'intelligence','standard',300,8,55,12,'crafting',45,2,'You secure the worst of the damage and leave the crossing safer than you found it.','You identify the problem, but your first repair will not hold.'),
('missing_goat',array['redbank_hollow','animal_centre_gate','canto_plains_verge']::text[],'Wildlife','Missing Goat','A very ordinary goat has become a surprisingly distributed local problem.',array['track','search','help']::text[],'survival','standard',360,11,50,10,'animal_handling',45,2,'You find the goat exactly where a goat would consider reasonable and escort it back amid undeserved relief.','The trail doubles back through enough mud to make you question the goat’s commitment to linear travel.'),
('rare_wildlife_sighting',array['lake_eira','whisperbank_grove','redbank_hollow']::text[],'Wildlife','Rare Wildlife Sighting','Word has spread of an unusual animal lingering nearby.',array['observe','track','search']::text[],'perception','hard',240,7,60,0,'animal_handling',55,1,'You keep enough distance to make a proper observation and record the sighting cleanly.','You catch movement, but not enough detail for a reliable observation.'),
('travelling_scholar',array['bellmead','old_canto_watch','canto_crossing']::text[],'Visitor','Travelling Scholar','A travelling scholar has stopped nearby with too many papers and one very specific question.',array['talk','help','investigate']::text[],'intelligence','standard',300,6,55,15,'investigation',50,1,'You compare notes and help untangle the useful detail from the scholar’s magnificent pile of paper.','The conversation produces more references than answers for now.'),
('lost_courier_satchel',array['canto_crossing','canto_plains_verge','riverglass_ford']::text[],'Courier','Lost Courier Satchel','A courier has misplaced a route satchel somewhere between here and the last sensible place they remember having it.',array['search','track','help']::text[],'perception','standard',300,10,45,20,'courier',45,2,'You reconstruct the route and recover the satchel from an embarrassingly visible place.','You cover the obvious route but the satchel remains absent.'),
('orchard_festival',array['bellmead']::text[],'Festival','Bellmead Orchard Afternoon','Bellmead has decided that fruit, music and standing in lanes counts as a festival.',array['help','talk','observe']::text[],'charisma','easy',420,5,40,20,'mercantile',35,2,'You pitch in where needed and leave the orchard running noticeably more smoothly.','You help, though the festival remains determined to organise itself around you.'),
('watch_strange_lights',array['old_canto_watch','whisperbank_grove']::text[],'Mystery','Lights Near the Old Watch','A dim light has been reported around the old watch road after dark.',array['investigate','follow','observe']::text[],'perception','hard',240,5,65,0,'investigation',60,1,'You trace the light far enough to prove it has a mundane source — but also that someone has been using the old route recently.','The light disappears before you can establish where it came from.'),
('market_argument',array['canto_crossing']::text[],'Social','Market Argument','Two traders have reached the stage of a disagreement where several unrelated vegetables are now evidence.',array['persuade','help','listen']::text[],'charisma','standard',120,10,35,10,'mercantile',35,2,'You separate the actual problem from the theatrical vegetables and broker a workable compromise.','Nobody throws a turnip, which is progress, but the argument continues.'),
('unusual_river_object',array['riverglass_ford','lake_eira']::text[],'Discovery','Something in the Water','A pale object beneath the water has attracted the attention of anyone currently avoiding real work.',array['inspect','reach','investigate']::text[],'perception','standard',180,7,50,0,'exploration',45,1,'You recover enough detail to identify the object as worked stone rather than river debris.','The water and glare keep the object stubbornly ambiguous.')
on conflict(event_key) do update set location_ids=excluded.location_ids,category=excluded.category,title=excluded.title,description=excluded.description,interaction_tags=excluded.interaction_tags,default_stat=excluded.default_stat,dc_category=excluded.dc_category,duration_minutes=excluded.duration_minutes,weight=excluded.weight,reward_adventure_xp=excluded.reward_adventure_xp,reward_gold=excluded.reward_gold,profession_key=excluded.profession_key,reward_profession_xp=excluded.reward_profession_xp,reputation_delta=excluded.reputation_delta,success_text=excluded.success_text,failure_text=excluded.failure_text;

insert into public.adventure_microquest_template_catalog(template_key,objective_type,name_pattern,description_pattern,default_stat,dc_category,profession_key,min_gold,max_gold,min_xp,max_xp,min_prof_xp,max_prof_xp,expiry_minutes) values
('delivery','delivery','A Small Delivery to {target}','Carry a modest parcel or message from {source} to {target}.','agility','easy','courier',18,32,35,55,30,50,720),
('search','search','Find What Went Missing','Someone at {source} needs a careful search around {target}.','perception','standard','investigation',10,24,40,65,35,55,900),
('investigation','investigation','A Question at {target}','A local detail at {target} does not quite add up. Check it properly.','intelligence','standard','investigation',8,20,45,70,40,60,1080),
('missing_item','missing_item','The Misplaced Thing','A small but useful item has gone missing somewhere around {target}.','perception','standard','investigation',12,28,40,65,30,55,840),
('wildlife','wildlife','A Quiet Sighting','Record a reliable wildlife observation around {target}.','survival','standard','animal_handling',0,14,45,70,40,65,960),
('gathering','gathering','A Useful Specimen','Bring back a sensible local specimen from around {target}.','survival','easy','herbalism',8,20,35,60,35,60,900),
('social_favour','social_favour','A Favour Between Neighbours','Carry a request from {source} and help smooth something over at {target}.','charisma','standard','mercantile',15,30,35,60,30,50,720),
('escort','escort','Walk the Road to {target}','Someone would prefer company on the road from {source} to {target}.','endurance','standard','courier',18,35,45,70,35,55,720),
('observation','observation','Check the Situation at {target}','Go to {target}, observe carefully and return with something more useful than a guess.','perception','easy','exploration',8,18,35,55,35,55,720),
('local_problem','local_problem','A Small Local Problem','Something ordinary at {target} needs practical attention before it becomes everyone’s problem.','intelligence','standard','crafting',15,30,40,65,35,55,900)
on conflict(template_key) do update set objective_type=excluded.objective_type,name_pattern=excluded.name_pattern,description_pattern=excluded.description_pattern,default_stat=excluded.default_stat,dc_category=excluded.dc_category,profession_key=excluded.profession_key,min_gold=excluded.min_gold,max_gold=excluded.max_gold,min_xp=excluded.min_xp,max_xp=excluded.max_xp,min_prof_xp=excluded.min_prof_xp,max_prof_xp=excluded.max_prof_xp,expiry_minutes=excluded.expiry_minutes;


create or replace function public.adventure_phase3_dc(p_category text)
returns integer language sql immutable set search_path=public as $$
  select case lower(coalesce(p_category,'standard'))
    when 'trivial' then 7 when 'easy' then 9 when 'hard' then 15 when 'very_hard' then 18 else 12 end;
$$;

create or replace function public.adventure_phase3_reputation_label(p_score integer)
returns text language sql immutable set search_path=public as $$
  select case when coalesce(p_score,0)>=45 then 'Trusted'
              when coalesce(p_score,0)>=15 then 'Helpful'
              when coalesce(p_score,0)>=4 then 'Recognised'
              when coalesce(p_score,0)<=-25 then 'Troublemaker'
              when coalesce(p_score,0)<=-6 then 'Wary'
              else 'Unknown' end;
$$;

create or replace function public.adventure_phase3_prof_bonus(p_character_id uuid,p_profession text)
returns integer language plpgsql security definer set search_path=public as $$
declare lv integer:=1;
begin
  if p_profession is null or p_profession='' then return 0; end if;
  select level into lv from public.adventure_professions where character_id=p_character_id and profession_key=p_profession;
  return least(3,greatest(0,floor((coalesce(lv,1)-1)/10.0)::integer));
end $$;

create or replace function public.adventure_phase3_sync_events(p_character_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare a public.adventure_characters%rowtype; ws public.adventure_world_state%rowtype; stamp integer; next_stamp integer; e public.adventure_event_catalog%rowtype; active_count integer; location_ok boolean;
begin
  select * into a from public.adventure_characters where id=p_character_id for update;
  if a.id is null then return; end if;
  select * into ws from public.adventure_world_state where character_id=a.id for update;
  if ws.character_id is null then perform public.adventure_p2_ensure(a.id); select * into ws from public.adventure_world_state where character_id=a.id for update; end if;
  stamp:=a.world_day*1440+a.world_minute;

  update public.adventure_world_events
     set status='expired', data=jsonb_set(coalesce(data,'{}'::jsonb),'{expired_stamp}',to_jsonb(stamp),true)
   where character_id=a.id and status='active' and coalesce((data->>'end_stamp')::integer,stamp+1)<=stamp;

  update public.adventure_dynamic_quests set status='expired'
   where character_id=a.id and status='active' and expires_stamp<=stamp;

  select count(*) into active_count from public.adventure_world_events where character_id=a.id and status='active';
  next_stamp:=coalesce((ws.cooldowns->>'phase3:event_next')::integer,0);
  if next_stamp=0 then
    update public.adventure_world_state set cooldowns=jsonb_set(coalesce(cooldowns,'{}'::jsonb),'{phase3:event_next}',to_jsonb(stamp+90),true),updated_at=now() where character_id=a.id;
    return;
  end if;
  if active_count>0 or stamp<next_stamp then return; end if;

  update public.adventure_world_state set cooldowns=jsonb_set(coalesce(cooldowns,'{}'::jsonb),'{phase3:event_next}',to_jsonb(stamp+120+floor(random()*181)::integer),true),updated_at=now() where character_id=a.id;
  if random()>0.45 then return; end if;

  select * into e from public.adventure_event_catalog c where a.location_id=any(c.location_ids) order by random()*c.weight desc limit 1;
  if e.event_key is null then return; end if;
  insert into public.adventure_world_events(character_id,event_key,status,starts_world_day,ends_world_day,data)
  values(a.id,e.event_key,'active',a.world_day,a.world_day+1,
    jsonb_build_object('location_id',a.location_id,'start_stamp',stamp,'end_stamp',stamp+e.duration_minutes,'title',e.title,'description',e.description,'category',e.category));
end $$;

create or replace function public.adventure_phase3_get_state()
returns jsonb language plpgsql security definer set search_path=public as $$
declare a public.adventure_characters%rowtype; ws public.adventure_world_state%rowtype; stamp integer; admin boolean:=false;
begin
  if auth.uid() is null then raise exception 'You must be logged in'; end if;
  select * into a from public.adventure_characters where user_id=auth.uid() limit 1;
  if a.id is null then return '{}'::jsonb; end if;
  perform public.adventure_p2_ensure(a.id);
  perform public.adventure_phase3_sync_events(a.id);
  select * into a from public.adventure_characters where id=a.id;
  select * into ws from public.adventure_world_state where character_id=a.id;
  stamp:=a.world_day*1440+a.world_minute;
  admin:=public.adventure_is_admin();
  insert into public.adventure_local_reputation(character_id,location_id,score) values(a.id,a.location_id,0) on conflict do nothing;

  return jsonb_build_object(
    'features',coalesce((select jsonb_agg(jsonb_build_object(
      'feature_key',f.feature_key,'name',f.name,'aliases',f.aliases,'description',f.description,'feature_type',f.feature_type,
      'interaction_tags',f.interaction_tags,'default_stat',f.default_stat,'dc_category',f.dc_category,'time_cost',f.time_cost,'risk_level',f.risk_level
    ) order by f.name) from public.adventure_feature_catalog f where f.location_id=a.location_id),'[]'::jsonb),
    'clues',coalesce((select jsonb_agg(jsonb_build_object('clue_key',d.discovery_key,'name',d.name,'text',coalesce(d.metadata->>'text',d.metadata->>'clue_text',''),'metadata',d.metadata,'discovered_at',d.discovered_at) order by d.discovered_at desc) from public.adventure_discoveries d where d.character_id=a.id and d.discovery_type='clue'),'[]'::jsonb),
    'rumours',coalesce((select jsonb_agg(jsonb_build_object('rumour_key',r.rumour_key,'subject',r.subject,'text',coalesce(d.metadata->>'text',r.rumour_text),'origin_location_id',r.origin_location_id,'discovered_at',d.discovered_at) order by d.discovered_at desc) from public.adventure_discoveries d join public.adventure_rumour_catalog r on r.rumour_key=d.discovery_key where d.character_id=a.id and d.discovery_type='rumour'),'[]'::jsonb),
    'active_events',coalesce((select jsonb_agg(jsonb_build_object('id',we.id,'event_key',we.event_key,'title',ec.title,'description',ec.description,'category',ec.category,'interaction_tags',ec.interaction_tags,'default_stat',ec.default_stat,'dc_category',ec.dc_category,'minutes_left',greatest(0,(we.data->>'end_stamp')::integer-stamp)) order by we.created_at) from public.adventure_world_events we join public.adventure_event_catalog ec using(event_key) where we.character_id=a.id and we.status='active' and we.data->>'location_id'=a.location_id),'[]'::jsonb),
    'dynamic_quests',coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'title',q.title,'description',q.description,'template_key',q.template_key,'objective_type',q.objective_type,'status',q.status,'source_location_id',q.source_location_id,'target_location_id',q.target_location_id,'target_name',l.name,'difficulty',q.difficulty,'reward_gold',q.reward_gold,'reward_adventure_xp',q.reward_adventure_xp,'profession_key',q.profession_key,'reward_profession_xp',q.reward_profession_xp,'minutes_left',greatest(0,q.expires_stamp-stamp),'progress',q.progress) order by q.created_at desc) from public.adventure_dynamic_quests q join public.adventure_locations l on l.id=q.target_location_id where q.character_id=a.id and q.status in('active','completed') and (q.status='active' or q.completed_at>now()-interval '1 day')),'[]'::jsonb),
    'reputations',coalesce((select jsonb_agg(jsonb_build_object('location_id',r.location_id,'location_name',l.name,'score',r.score,'label',public.adventure_phase3_reputation_label(r.score)) order by abs(r.score) desc,l.name) from public.adventure_local_reputation r join public.adventure_locations l on l.id=r.location_id where r.character_id=a.id),'[]'::jsonb),
    'npc_moods',coalesce((select jsonb_agg(jsonb_build_object('npc_key',n.npc_key,'name',n.name,'mood',case when a.world_minute<420 or a.world_minute>1260 then 'tired' when a.weather in('storm','rain') then 'worried' when coalesce(rel.relationship,0)>=25 then 'cheerful' when mod(abs(hashtext(n.npc_key))+a.world_day,5)=0 then 'busy' when mod(abs(hashtext(n.npc_key))+a.world_day,5)=1 then 'curious' else 'calm' end)) from public.adventure_npc_catalog n left join public.adventure_relationships rel on rel.character_id=a.id and rel.npc_key=n.npc_key where public.adventure_p2_npc_location(n.npc_key,a.world_minute)=a.location_id),'[]'::jsonb),
    'recent_dynamic_actions',coalesce((select jsonb_agg(x.obj order by x.id desc) from (select h.id,to_jsonb(h)-'character_id' as obj from public.adventure_action_history h where h.character_id=a.id and h.action_type in('dynamic_action','dynamic_event','dynamic_quest') order by h.id desc limit 12) x),'[]'::jsonb),
    'session_recap',coalesce((select jsonb_agg(x.obj order by x.id desc) from (select h.id,jsonb_build_object('type',h.action_type,'key',h.action_key,'details',h.details,'created_at',h.created_at) as obj from public.adventure_action_history h where h.character_id=a.id order by h.id desc limit 6) x),'[]'::jsonb),
    'debug',case when admin then jsonb_build_object('world_flags',ws.flags,'world_cooldowns',ws.cooldowns,'active_event_count',(select count(*) from public.adventure_world_events where character_id=a.id and status='active'),'dynamic_quest_count',(select count(*) from public.adventure_dynamic_quests where character_id=a.id and status='active')) else null end
  );
end $$;

revoke all on function public.adventure_phase3_dc(text) from public,anon,authenticated;
revoke all on function public.adventure_phase3_reputation_label(integer) from public,anon,authenticated;
revoke all on function public.adventure_phase3_prof_bonus(uuid,text) from public,anon,authenticated;
revoke all on function public.adventure_phase3_sync_events(uuid) from public,anon,authenticated;
revoke all on function public.adventure_phase3_get_state() from public,anon;
grant execute on function public.adventure_phase3_get_state() to authenticated;




-- Final connected-location helper used by NPC following.
create or replace function public.adventure_phase3_follow_move_allowed(p_from text,p_to text)
returns boolean language sql stable security definer set search_path=public as $$
 select p_to=any(coalesce((select connections from public.adventure_locations where id=p_from),'{}'::text[]));
$$;
revoke all on function public.adventure_phase3_follow_move_allowed(text,text) from public,anon,authenticated;


create or replace function public.adventure_phase3_rep_delta(p_character_id uuid,p_location_id text,p_delta integer)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_delta=0 then return; end if;
  insert into public.adventure_local_reputation(character_id,location_id,score) values(p_character_id,p_location_id,greatest(-100,least(100,p_delta)))
  on conflict(character_id,location_id) do update set score=greatest(-100,least(100,public.adventure_local_reputation.score+excluded.score)),updated_at=now();
end $$;

create or replace function public.adventure_phase3_resolve_action(p_intent jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  uid uuid:=auth.uid(); a public.adventure_characters%rowtype; s public.adventure_player_stats%rowtype; ws public.adventure_world_state%rowtype;
  f public.adventure_feature_catalog%rowtype; n public.adventure_npc_catalog%rowtype; item public.adventure_item_catalog%rowtype;
  ec public.adventure_event_catalog%rowtype; we public.adventure_world_events%rowtype; rel public.adventure_relationships%rowtype; rum public.adventure_rumour_catalog%rowtype;
  action_type text:=lower(coalesce(p_intent->>'actionType','custom')); target_type text:=lower(coalesce(p_intent->>'targetType','environment')); target_key text:=left(coalesce(p_intent->>'targetKey',''),120);
  method text:=left(coalesce(p_intent->>'method',''),120); raw_text text:=left(coalesce(p_intent->>'rawText',''),300); item_key text:=left(coalesce(p_intent->>'itemKey',''),120); subject text:=left(coalesce(p_intent->>'subject',''),160); secondary_target text:=left(coalesce(p_intent->>'secondaryTarget',''),160);
  stat_key text:='perception'; profession text:=null; dc_cat text:='standard'; dc integer:=12; modifier integer:=0; prof_bonus integer:=0; circumstance integer:=0;
  roll integer:=null; total integer:=null; degree text:='automatic'; time_cost integer:=5; message text:=''; suggestions jsonb:='[]'::jsonb;
  needs_check boolean:=false; success boolean:=false; inserted_count integer:=0; clue_key text; clue_name text; clue_text text; clue_xp integer:=0;
  now_stamp integer; old_location text; new_npc_location text; special jsonb; mood text; rep_delta integer:=0;
begin
  if uid is null then raise exception 'You must be logged in'; end if;
  if action_type not in ('observe','talk','ask','tell','travel','investigate','manipulate','use_item','give_item','threaten','persuade','deceive','sneak','climb','wait','forage','track','help','steal','buy','sell','attack','flee','follow','rest','search','custom') then raise exception 'Unsupported action type'; end if;
  if target_type not in ('npc','feature','event','item','location','creature','environment','self') then raise exception 'Unsupported target type'; end if;

  select * into a from public.adventure_characters where user_id=uid for update;
  if a.id is null then raise exception 'Create an Adventure first'; end if;
  perform public.adventure_p2_ensure(a.id);
  select * into s from public.adventure_player_stats where character_id=a.id;
  select * into ws from public.adventure_world_state where character_id=a.id for update;
  old_location:=a.location_id; now_stamp:=a.world_day*1440+a.world_minute;

  -- Requests for impossible authoritative rewards are understood, then refused without state mutation.
  if raw_text ~* '(give|grant|set|add|spawn|make).{0,30}(gold|xp|level|legendary|rare potion|million|100000|99)' or raw_text ~* '(complete).{0,20}(every|all|main quest)' then
    message:='The world does not rearrange itself just because you phrase the request confidently.';
    insert into public.adventure_action_history(character_id,action_type,action_key,details) values(a.id,'dynamic_action','rejected_request',jsonb_build_object('intent',p_intent,'location',a.location_id,'rejected',true));
    return jsonb_build_object('base',public.adventure_get_state(),'phase2',public.adventure_phase2_get_state(),'phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),'resolution',jsonb_build_object('intent',p_intent,'message',message,'degree','rejected','suggested_actions',jsonb_build_array('Look around','Ask someone nearby','Check your journal')));
  end if;

  if item_key<>'' then
    if not exists(select 1 from public.adventure_inventory where character_id=a.id and adventure_inventory.item_key=item_key and quantity>0) then raise exception 'You do not have that item'; end if;
    select * into item from public.adventure_item_catalog where adventure_item_catalog.item_key=item_key;
  end if;

  if target_type='feature' then
    select * into f from public.adventure_feature_catalog where feature_key=target_key and location_id=a.location_id;
    if f.feature_key is null then raise exception 'That feature is not available here'; end if;
    stat_key:=f.default_stat; dc_cat:=f.dc_category; time_cost:=f.time_cost;
    if action_type='climb' then stat_key:='agility'; profession:='exploration'; needs_check:=true;
    elsif action_type in('observe','search','investigate') then stat_key:=case when f.feature_type in('archive','document','ruin_feature','machinery') then 'intelligence' else f.default_stat end; profession:=case when f.feature_type in('archive','document','ruin_feature','machinery') then 'investigation' else 'exploration' end; needs_check:=true;
    elsif action_type='track' then stat_key:='survival'; profession:='animal_handling'; needs_check:=true;
    elsif action_type='sneak' then stat_key:='agility'; profession:='exploration'; needs_check:=true;
    elsif action_type in('manipulate','help') then profession:='crafting'; needs_check:=true;
    elsif action_type='forage' then stat_key:='survival'; profession:='herbalism'; needs_check:=true;
    elsif action_type='steal' then stat_key:='agility'; profession:=null; dc_cat:='hard'; needs_check:=true;
    else needs_check:=action_type not in('talk','ask','tell','use_item','give_item'); end if;
    if item_key<>'' then
      if action_type='climb' and (item.tags ? 'exploration' or item.name ilike '%rope%') then circumstance:=circumstance+2; end if;
      if action_type in('observe','search','investigate') and item.tags ? 'investigation' then circumstance:=circumstance+1; end if;
      if action_type='track' and item.tags ? 'exploration' then circumstance:=circumstance+1; end if;
    end if;
    suggestions:=jsonb_build_array('Inspect '||f.name,'Try another approach','Leave it alone');
  elsif target_type='npc' then
    select * into n from public.adventure_npc_catalog where npc_key=target_key;
    if n.npc_key is null or public.adventure_p2_npc_location(n.npc_key,a.world_minute)<>a.location_id then raise exception 'That person is not here right now'; end if;
    select * into rel from public.adventure_relationships where character_id=a.id and npc_key=n.npc_key;
    mood:=case when a.world_minute<420 or a.world_minute>1260 then 'tired' when a.weather in('storm','rain') then 'worried' when coalesce(rel.relationship,0)>=25 then 'cheerful' else 'calm' end;
    stat_key:=case when action_type in('follow','sneak') then 'agility' when action_type='observe' then 'perception' else 'charisma' end;
    profession:=case when action_type='follow' then 'investigation' when action_type in('persuade','deceive') then 'mercantile' else null end;
    dc_cat:=case when action_type in('threaten','deceive') then 'hard' when action_type in('persuade','follow','sneak') then 'standard' else 'easy' end;
    time_cost:=case when action_type='follow' then 15 else 3 end;
    needs_check:=action_type in('persuade','deceive','threaten','follow','sneak','steal');
    if action_type in('persuade','deceive','threaten') then circumstance:=circumstance + case when coalesce(rel.trust,0)>=25 then 2 when coalesce(rel.relationship,0)<=-10 then -2 else 0 end; end if;
    suggestions:=jsonb_build_array('Ask about local rumours','Ask about work','Leave the conversation');
  elsif target_type='event' then
    select we0.* into we from public.adventure_world_events we0 where we0.character_id=a.id and we0.id::text=target_key and we0.status='active' and we0.data->>'location_id'=a.location_id for update;
    if we.id is null then raise exception 'That event is no longer active here'; end if;
    select * into ec from public.adventure_event_catalog where event_key=we.event_key;
    stat_key:=ec.default_stat; dc_cat:=ec.dc_category; profession:=ec.profession_key; time_cost:=12; needs_check:=true;
    suggestions:=jsonb_build_array('Help with '||ec.title,'Observe before acting','Leave it for now');
  elsif action_type='wait' then
    time_cost:=greatest(1,least(720,coalesce((p_intent->>'timeCostMinutes')::integer,30))); needs_check:=false;
  elsif action_type='rest' then
    time_cost:=greatest(30,least(720,coalesce((p_intent->>'timeCostMinutes')::integer,120))); needs_check:=false;
  elsif action_type='attack' then
    message:='You move as if to start a real fight, then stop short of a situation this Adventure can resolve cleanly. Threaten, shove past, flee or find another way instead.';
    insert into public.adventure_action_history(character_id,action_type,action_key,details) values(a.id,'dynamic_action','combat_boundary',jsonb_build_object('intent',p_intent,'location',a.location_id));
    return jsonb_build_object('base',public.adventure_get_state(),'phase2',public.adventure_phase2_get_state(),'phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),'resolution',jsonb_build_object('intent',p_intent,'message',message,'degree','blocked','suggested_actions',jsonb_build_array('Threaten them','Back away','Look for another route')));
  else
    stat_key:=case action_type when 'climb' then 'agility' when 'sneak' then 'agility' when 'track' then 'survival' when 'forage' then 'survival' when 'persuade' then 'charisma' when 'deceive' then 'charisma' when 'threaten' then 'charisma' when 'help' then 'intelligence' else 'perception' end;
    profession:=case when action_type in('investigate','search') then 'investigation' when action_type in('track','forage') then 'survival' when action_type in('climb','observe') then 'exploration' when action_type='help' then 'crafting' else null end;
    dc_cat:=case when action_type in('steal','threaten') then 'hard' else 'standard' end;
    time_cost:=case when action_type in('search','investigate','track','forage') then 10 else 5 end;
    needs_check:=action_type in('observe','investigate','manipulate','threaten','persuade','deceive','sneak','climb','forage','track','help','steal','follow','search');
    suggestions:=jsonb_build_array('Look around','Ask someone nearby','Check the map');
  end if;

  -- Main story phrase variants still enter the authored, server-gated quest node.
  if target_type='npc' and n.npc_key in('nell_bristlebell','orla_fen') and (lower(raw_text) like '%token%' or lower(raw_text) like '%three prong%' or lower(subject) like '%token%' or lower(subject) like '%prong%') then
    if exists(select 1 from public.adventure_inventory where character_id=a.id and item_key='odd_brass_token' and quantity>0) then
      special:=public.adventure_phase2_talk(n.npc_key,'token');
      insert into public.adventure_action_history(character_id,action_type,action_key,details) values(a.id,'dynamic_action',n.npc_key,jsonb_build_object('intent',p_intent,'special_story_gate','token'));
      return jsonb_build_object('base',special->'base','phase2',special->'phase2','phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),'resolution',jsonb_build_object('intent',p_intent,'message',special->>'dialogue','degree','automatic','npc',special->'npc','suggested_actions',jsonb_build_array('Ask another question','Check your journal','Leave')));
    end if;
  end if;

  -- Free-form questions respect NPC knowledge boundaries and reveal only approved rumours.
  if target_type='npc' and action_type in('talk','ask') then
    select * into rum from public.adventure_rumour_catalog r
      where n.npc_key=any(r.known_by_npcs)
        and (lower(raw_text) ~ '(rumou?r|heard|news|strange|odd)' or subject='' or lower(r.subject) like '%'||lower(subject)||'%' or lower(raw_text) like '%'||lower(r.subject)||'%')
      order by case when lower(raw_text) like '%'||lower(r.subject)||'%' then 0 else 1 end,r.importance desc,random() limit 1;
    if rum.rumour_key is not null and (lower(raw_text) ~ '(rumou?r|heard|news|strange|odd)' or lower(raw_text) like '%'||lower(rum.subject)||'%' or (subject<>'' and lower(rum.subject) like '%'||lower(subject)||'%')) then
      insert into public.adventure_discoveries(character_id,discovery_type,discovery_key,name,metadata)
      values(a.id,'rumour',rum.rumour_key,rum.subject,jsonb_build_object('text',rum.rumour_text,'source_npc',n.npc_key,'heard_world_day',a.world_day)) on conflict do nothing;
      message:=n.name||' lowers their voice slightly. “'||rum.rumour_text||'”';
    else
      message:=coalesce(n.topics->>case when lower(raw_text) like '%work%' then 'work' when lower(raw_text) like '%wild%' or lower(raw_text) like '%animal%' then 'wildlife' when lower(raw_text) like '%herb%' or lower(raw_text) like '%plant%' then 'herbs' when lower(raw_text) like '%mill%' then 'mill' when lower(raw_text) like '%record%' or lower(raw_text) like '%archive%' then 'records' else 'hello' end,n.topics->>'hello',n.name||' has nothing useful to add about that.');
    end if;
    perform public.adventure_p2_advance(a.id,time_cost);
    update public.adventure_characters set last_summary=left(message,500),updated_at=now() where id=a.id;
    insert into public.adventure_action_history(character_id,action_type,action_key,details) values(a.id,'dynamic_action',n.npc_key,jsonb_build_object('intent',p_intent,'location',old_location,'npc_mood',mood,'message',message));
    return jsonb_build_object('base',public.adventure_get_state(),'phase2',public.adventure_phase2_get_state(),'phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),'resolution',jsonb_build_object('intent',p_intent,'message',message,'degree','automatic','npc',jsonb_build_object('npc_key',n.npc_key,'name',n.name,'occupation',n.occupation,'mood',mood),'suggested_actions',suggestions));
  end if;

  -- Tell an NPC something only if the player actually knows the referenced clue/rumour/discovery.
  if target_type='npc' and action_type='tell' then
    if secondary_target<>'' and exists(select 1 from public.adventure_discoveries d where d.character_id=a.id and d.discovery_key=secondary_target) then
      insert into public.adventure_npc_memories(character_id,npc_key,memory_key,importance,sentiment,data)
      values(a.id,n.npc_key,'player_told_'||n.npc_key||'_'||left(regexp_replace(secondary_target,'[^a-zA-Z0-9_]+','','g'),48),5,'neutral',jsonb_build_object('discovery_key',secondary_target,'summary',raw_text)) on conflict(character_id,npc_key,memory_key) do nothing;
      update public.adventure_relationships set relationship=least(100,relationship+1),trust=least(100,trust+1),updated_at=now() where character_id=a.id and npc_key=n.npc_key;
      message:=n.name||' listens carefully and nods. You have given them something real to remember.';
    else
      message:=n.name||' listens, but you cannot ground that claim in anything you have actually learned yet.';
    end if;
    perform public.adventure_p2_advance(a.id,3);
    insert into public.adventure_action_history(character_id,action_type,action_key,details) values(a.id,'dynamic_action',n.npc_key,jsonb_build_object('intent',p_intent,'location',old_location,'message',message));
    return jsonb_build_object('base',public.adventure_get_state(),'phase2',public.adventure_phase2_get_state(),'phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),'resolution',jsonb_build_object('intent',p_intent,'message',message,'degree','automatic','suggested_actions',suggestions));
  end if;

  -- Showing / giving items is validated against real inventory and never consumes protected quest/doc/tool items.
  if target_type='npc' and action_type in('use_item','give_item') then
    if item_key='' then raise exception 'Choose an item you actually have'; end if;
    if action_type='give_item' and lower(item.category) in('food','ingredients') then
      perform public.adventure_remove_inventory(a.id,item_key,1);
      update public.adventure_relationships set relationship=least(100,relationship+1),updated_at=now() where character_id=a.id and npc_key=n.npc_key;
      message:=n.name||' accepts the '||item.name||'. It is a small gesture, but a real one.';
    else
      message:='You show '||n.name||' the '||item.name||'. They look it over without taking it from you.';
    end if;
    perform public.adventure_p2_advance(a.id,2);
    insert into public.adventure_npc_memories(character_id,npc_key,memory_key,importance,sentiment,data)
    values(a.id,n.npc_key,'saw_item_'||left(regexp_replace(item_key,'[^a-zA-Z0-9_]+','','g'),60),4,'neutral',jsonb_build_object('item_key',item_key,'action',action_type)) on conflict(character_id,npc_key,memory_key) do nothing;
    insert into public.adventure_action_history(character_id,action_type,action_key,details) values(a.id,'dynamic_action',n.npc_key,jsonb_build_object('intent',p_intent,'location',old_location,'item_key',item_key,'message',message));
    return jsonb_build_object('base',public.adventure_get_state(),'phase2',public.adventure_phase2_get_state(),'phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),'resolution',jsonb_build_object('intent',p_intent,'message',message,'degree','automatic','suggested_actions',suggestions));
  end if;

  if action_type='wait' then
    perform public.adventure_p2_advance(a.id,time_cost); perform public.adventure_phase3_sync_events(a.id);
    message:='You wait for '||time_cost||' minutes and let Canto carry on without needing you for a while.';
    update public.adventure_characters set last_summary=message where id=a.id;
    insert into public.adventure_action_history(character_id,action_type,action_key,details) values(a.id,'dynamic_action','wait',jsonb_build_object('intent',p_intent,'minutes',time_cost,'location',old_location));
    return jsonb_build_object('base',public.adventure_get_state(),'phase2',public.adventure_phase2_get_state(),'phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),'resolution',jsonb_build_object('intent',p_intent,'message',message,'degree','automatic','suggested_actions',jsonb_build_array('Look around now','Check who is nearby','Keep waiting')));
  elsif action_type='rest' then
    perform public.adventure_p2_advance(a.id,time_cost);
    update public.adventure_characters set hp=least(max_hp,hp+greatest(1,floor(time_cost/120.0)::integer)),last_summary='You rest long enough for the road to feel less immediate.' where id=a.id;
    perform public.adventure_phase3_sync_events(a.id);
    message:='You rest for '||time_cost||' minutes. The world moves on while you do.';
    insert into public.adventure_action_history(character_id,action_type,action_key,details) values(a.id,'dynamic_action','rest',jsonb_build_object('intent',p_intent,'minutes',time_cost,'location',old_location));
    return jsonb_build_object('base',public.adventure_get_state(),'phase2',public.adventure_phase2_get_state(),'phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),'resolution',jsonb_build_object('intent',p_intent,'message',message,'degree','automatic','suggested_actions',jsonb_build_array('Get moving','Check the time','Look around')));
  end if;

  dc:=public.adventure_phase3_dc(dc_cat);
  if action_type='climb' and a.weather in('rain','storm') then dc:=dc+2; end if;
  if action_type in('observe','search','investigate') and (a.world_minute<360 or a.world_minute>1140) then dc:=dc+2; end if;
  if action_type='sneak' and (a.world_minute<360 or a.world_minute>1140) then dc:=greatest(7,dc-1); end if;
  if target_type='feature' and f.risk_level='high' then dc:=dc+1; end if;

  if needs_check then
    modifier:=case stat_key when 'strength' then s.strength when 'agility' then s.agility when 'endurance' then s.endurance when 'perception' then s.perception when 'intelligence' then s.intelligence when 'charisma' then s.charisma when 'survival' then s.survival else s.arcana end;
    prof_bonus:=public.adventure_phase3_prof_bonus(a.id,profession);
    roll:=floor(random()*20+1)::integer; total:=roll+coalesce(modifier,0)+prof_bonus+circumstance;
    degree:=case when roll=20 or total>=dc+10 then 'critical_success' when total>=dc then 'success' when total=dc-1 and action_type in('climb','follow','help','investigate','search') then 'success_with_complication' when roll=1 or total<=dc-10 then 'critical_failure' else 'failure' end;
    success:=degree in('critical_success','success','success_with_complication');
  else success:=true; degree:='automatic'; end if;

  perform public.adventure_p2_advance(a.id,time_cost);

  if target_type='feature' then
    if success then
      message:=coalesce(f.metadata->>'success_text','You spend a little time with '||f.name||'. A useful detail separates itself from the background.');
      if degree='success_with_complication' then message:=message||' You manage it, but not quietly enough to feel completely comfortable about who may have noticed.'; end if;
      clue_key:=f.metadata->>'clue_key'; clue_name:=f.metadata->>'clue_name'; clue_text:=f.metadata->>'clue_text'; clue_xp:=greatest(0,least(35,coalesce((f.metadata->>'discovery_xp')::integer,0)));
      if clue_key is not null and clue_key<>'' then
        insert into public.adventure_discoveries(character_id,discovery_type,discovery_key,name,metadata)
        values(a.id,'clue',clue_key,coalesce(nullif(clue_name,''),f.name),jsonb_build_object('text',coalesce(clue_text,message),'feature_key',f.feature_key,'location_id',f.location_id)) on conflict do nothing;
        get diagnostics inserted_count = row_count;
        if inserted_count>0 and clue_xp>0 then perform public.adventure_grant_reward(a.id,'dynamic_discovery',clue_key,clue_xp,0,'investigation',greatest(10,clue_xp)); end if;
      end if;
      if action_type='help' then perform public.adventure_phase3_rep_delta(a.id,a.location_id,1); end if;
      if action_type='steal' then perform public.adventure_phase3_rep_delta(a.id,a.location_id,-2); end if;
    else
      message:=case when degree='critical_failure' then 'Your attempt at '||lower(f.name)||' goes badly enough to attract attention, but not badly enough to become a catastrophe.' else 'You try '||lower(action_type)||' around '||f.name||', but nothing useful resolves from the attempt.' end;
    end if;
  elsif target_type='event' then
    if success then
      message:=ec.success_text;
      update public.adventure_world_events set status='resolved',data=jsonb_set(coalesce(data,'{}'::jsonb),'{resolved_stamp}',to_jsonb((select world_day*1440+world_minute from public.adventure_characters where id=a.id)),true) where id=we.id;
      perform public.adventure_grant_reward(a.id,'dynamic_event',we.id::text,ec.reward_adventure_xp,ec.reward_gold,ec.profession_key,ec.reward_profession_xp);
      perform public.adventure_phase3_rep_delta(a.id,a.location_id,ec.reputation_delta);
    else message:=ec.failure_text; end if;
  elsif target_type='npc' then
    message:=case action_type
      when 'follow' then case when success then 'You keep '||n.name||' in sight without making a performance of it.' else n.name||' notices the attention and makes following them discreetly impossible.' end
      when 'persuade' then case when success then n.name||' gives your argument more weight than they expected to.' else n.name||' hears you out, but does not move from their position.' end
      when 'deceive' then case when success then n.name||' appears to accept the version you give them, at least for now.' else n.name||' looks at you for a long moment. The story has not landed.' end
      when 'threaten' then case when success then n.name||' takes the threat seriously. They will also remember it.' else n.name||' is unimpressed, and considerably less warm toward you.' end
      when 'sneak' then case when success then 'You stay out of '||n.name||'''s immediate attention.' else n.name||' catches you trying to avoid being noticed.' end
      else case when success then 'The interaction goes roughly the way you intended.' else 'The interaction does not quite land.' end end;
    if action_type='threaten' then
      update public.adventure_relationships set relationship=greatest(-100,relationship-4),trust=greatest(-100,trust-5),fear=least(100,fear+4),updated_at=now() where character_id=a.id and npc_key=n.npc_key;
      insert into public.adventure_npc_memories(character_id,npc_key,memory_key,importance,sentiment,data) values(a.id,n.npc_key,'player_threatened_'||n.npc_key,8,'negative',jsonb_build_object('summary',raw_text)) on conflict(character_id,npc_key,memory_key) do update set importance=greatest(adventure_npc_memories.importance,excluded.importance),data=excluded.data;
      perform public.adventure_phase3_rep_delta(a.id,a.location_id,-2);
    elsif action_type='deceive' and not success then
      update public.adventure_relationships set trust=greatest(-100,trust-2),updated_at=now() where character_id=a.id and npc_key=n.npc_key;
    elsif action_type='persuade' and success then update public.adventure_relationships set respect=least(100,respect+1),updated_at=now() where character_id=a.id and npc_key=n.npc_key; end if;

    if action_type='follow' and success then
      select public.adventure_p2_npc_location(n.npc_key,(select world_minute from public.adventure_characters where id=a.id)) into new_npc_location;
      if new_npc_location is not null and new_npc_location<>old_location and public.adventure_phase3_follow_move_allowed(old_location,new_npc_location) then
        update public.adventure_characters set location_id=new_npc_location,last_summary='You follow '||n.name||' to '||(select name from public.adventure_locations where id=new_npc_location)||'.' where id=a.id;
        insert into public.adventure_discoveries(character_id,discovery_type,discovery_key,name,metadata) select a.id,'location',l.id,l.name,jsonb_build_object('method','follow_npc','npc_key',n.npc_key) from public.adventure_locations l where l.id=new_npc_location on conflict do nothing;
        message:='You keep '||n.name||' in sight and follow them to '||(select name from public.adventure_locations where id=new_npc_location)||'.';
      end if;
    end if;
  else
    message:=case when success then
      case action_type when 'observe' then 'You slow down and look properly. A few ordinary details become useful once you stop rushing them.' when 'search' then 'You search with a clear idea of what would count as evidence. Nothing impossible appears, but the place becomes easier to read.' when 'investigate' then 'You compare what is here with what you already know and come away with a firmer impression.' when 'track' then 'You pick out a usable line of signs and follow it as far as the local ground allows.' when 'forage' then 'You find useful natural material, but nothing server-approved that becomes a new inventory item from this free action alone.' when 'help' then 'You make yourself useful for a while. It is ordinary work, which is often exactly what the place needed.' when 'flee' then 'You put distance between yourself and the problem before pride can object.' else 'You try it, and the world gives you a reasonable answer without inventing a reward to go with it.' end
      else case action_type when 'climb' then 'You cannot find a safe route up from here.' when 'sneak' then 'Your attempt at subtlety is rather more visible than intended.' when 'search' then 'You spend the time, but nothing useful separates itself from the background.' when 'track' then 'The signs break apart before they become a reliable trail.' else 'You try it, but the attempt does not produce a useful result.' end end;
  end if;

  update public.adventure_characters set last_summary=left(message,500),updated_at=now() where id=a.id;
  insert into public.adventure_action_history(character_id,action_type,action_key,details)
  values(a.id,case when target_type='event' then 'dynamic_event' else 'dynamic_action' end,coalesce(nullif(target_key,''),action_type),jsonb_build_object('intent',p_intent,'location',old_location,'stat',stat_key,'profession',profession,'roll',roll,'modifier',modifier,'profession_bonus',prof_bonus,'circumstance',circumstance,'total',total,'dc',dc,'degree',degree,'time_spent',time_cost,'message',message));
  perform public.adventure_phase3_sync_events(a.id);

  return jsonb_build_object('base',public.adventure_get_state(),'phase2',public.adventure_phase2_get_state(),'phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),
    'resolution',jsonb_build_object('intent',p_intent,'message',message,'stat',stat_key,'profession',profession,'roll',roll,'modifier',modifier,'profession_bonus',prof_bonus,'circumstance',circumstance,'total',total,'dc',dc,'degree',degree,'time_spent',time_cost,'suggested_actions',suggestions));
end $$;

revoke all on function public.adventure_phase3_rep_delta(uuid,text,integer) from public,anon,authenticated;
revoke all on function public.adventure_phase3_resolve_action(jsonb) from public,anon;
grant execute on function public.adventure_phase3_resolve_action(jsonb) to authenticated;


create or replace function public.adventure_phase3_generate_microquest(p_npc_key text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  a public.adventure_characters%rowtype; t public.adventure_microquest_template_catalog%rowtype; giver public.adventure_npc_catalog%rowtype; target public.adventure_locations%rowtype; feat public.adventure_feature_catalog%rowtype;
  stamp integer; active_count integer; title_text text; desc_text text; gold integer; xp integer; pxp integer; qid uuid; giver_key text:=nullif(btrim(coalesce(p_npc_key,'')),'');
begin
  if auth.uid() is null then raise exception 'You must be logged in'; end if;
  select * into a from public.adventure_characters where user_id=auth.uid() for update;
  if a.id is null then raise exception 'Create an Adventure first'; end if;
  perform public.adventure_p2_ensure(a.id); perform public.adventure_phase3_sync_events(a.id);
  stamp:=a.world_day*1440+a.world_minute;
  update public.adventure_dynamic_quests set status='expired' where character_id=a.id and status='active' and expires_stamp<=stamp;
  select count(*) into active_count from public.adventure_dynamic_quests where character_id=a.id and status='active';
  if active_count>=2 then raise exception 'Finish or abandon one of your small local jobs first'; end if;

  if giver_key is not null then
    select * into giver from public.adventure_npc_catalog where npc_key=giver_key;
    if giver.npc_key is null or public.adventure_p2_npc_location(giver.npc_key,a.world_minute)<>a.location_id then raise exception 'That person is not here right now'; end if;
  else
    select * into giver from public.adventure_npc_catalog n where public.adventure_p2_npc_location(n.npc_key,a.world_minute)=a.location_id order by n.importance desc,random() limit 1;
  end if;

  select l.* into target from public.adventure_locations l
   where l.id<>a.location_id and l.id=any(coalesce((select connections from public.adventure_locations where id=a.location_id),'{}'::text[]))
     and (exists(select 1 from public.adventure_discoveries d where d.character_id=a.id and d.discovery_type='location' and d.discovery_key=l.id)
          or l.id in('canto_crossing','willowmere','riverglass_ford','animal_centre_gate','canto_plains_verge'))
   order by random() limit 1;
  if target.id is null then select * into target from public.adventure_locations where id=a.location_id; end if;

  select * into t from public.adventure_microquest_template_catalog
   where not (objective_type='escort' and target.id=a.location_id)
   order by random() limit 1;
  if t.template_key is null then raise exception 'No local work templates are available'; end if;

  if t.objective_type in('search','investigation','observation','local_problem') then
    select * into feat from public.adventure_feature_catalog where location_id=target.id order by random() limit 1;
  end if;

  title_text:=replace(replace(t.name_pattern,'{source}',(select name from public.adventure_locations where id=a.location_id)),'{target}',target.name);
  desc_text:=replace(replace(t.description_pattern,'{source}',(select name from public.adventure_locations where id=a.location_id)),'{target}',target.name);
  if feat.feature_key is not null then desc_text:=desc_text||' Pay particular attention to '||feat.name||'.'; end if;
  if giver.npc_key is not null then desc_text:=giver.name||' asks a small favour. '||desc_text; end if;
  gold:=t.min_gold+floor(random()*(t.max_gold-t.min_gold+1))::integer;
  xp:=t.min_xp+floor(random()*(t.max_xp-t.min_xp+1))::integer;
  pxp:=t.min_prof_xp+floor(random()*(t.max_prof_xp-t.min_prof_xp+1))::integer;

  insert into public.adventure_dynamic_quests(character_id,template_key,giver_npc_key,title,description,source_location_id,target_location_id,objective_type,target_key,status,difficulty,reward_gold,reward_adventure_xp,profession_key,reward_profession_xp,expires_stamp,progress)
  values(a.id,t.template_key,giver.npc_key,title_text,desc_text,a.location_id,target.id,t.objective_type,feat.feature_key,'active',t.dc_category,gold,xp,t.profession_key,pxp,stamp+t.expiry_minutes,jsonb_build_object('objective','Travel to '||target.name||' and resolve the local task.','giver_name',giver.name,'target_feature',feat.name)) returning id into qid;
  perform public.adventure_p2_advance(a.id,2);
  update public.adventure_characters set last_summary=coalesce(giver.name,'Someone local')||' has given you a small piece of work: '||title_text||'.' where id=a.id;
  insert into public.adventure_action_history(character_id,action_type,action_key,details) values(a.id,'dynamic_quest',qid::text,jsonb_build_object('event','generated','template',t.template_key,'giver',giver.npc_key,'target_location',target.id));
  return jsonb_build_object('base',public.adventure_get_state(),'phase2',public.adventure_phase2_get_state(),'phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),'message',coalesce(giver.name,'Someone local')||' gives you a small job: '||title_text||'.','quest_id',qid);
end $$;

create or replace function public.adventure_phase3_microquest_action(p_quest_id uuid,p_action text default 'resolve')
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  a public.adventure_characters%rowtype; q public.adventure_dynamic_quests%rowtype; t public.adventure_microquest_template_catalog%rowtype; s public.adventure_player_stats%rowtype;
  stamp integer; roll integer; modifier integer; prof integer; total integer; dc integer; degree text; success boolean; message text; rewarded boolean:=false;
begin
  if auth.uid() is null then raise exception 'You must be logged in'; end if;
  select * into a from public.adventure_characters where user_id=auth.uid() for update;
  if a.id is null then raise exception 'Create an Adventure first'; end if;
  select * into q from public.adventure_dynamic_quests where id=p_quest_id and character_id=a.id for update;
  if q.id is null then raise exception 'Local quest not found'; end if;
  if lower(coalesce(p_action,'resolve'))='abandon' then
    if q.status<>'active' then raise exception 'That local quest is not active'; end if;
    update public.adventure_dynamic_quests set status='abandoned',progress=progress||jsonb_build_object('abandoned_at',now()) where id=q.id;
    insert into public.adventure_action_history(character_id,action_type,action_key,details) values(a.id,'dynamic_quest',q.id::text,jsonb_build_object('event','abandoned'));
    return jsonb_build_object('base',public.adventure_get_state(),'phase2',public.adventure_phase2_get_state(),'phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),'message','You let the small job go. Velmora survives the administrative shock.');
  end if;
  if q.status<>'active' then raise exception 'That local quest is no longer active'; end if;
  stamp:=a.world_day*1440+a.world_minute;
  if stamp>=q.expires_stamp then update public.adventure_dynamic_quests set status='expired' where id=q.id; raise exception 'That local opportunity has expired'; end if;
  if a.location_id<>q.target_location_id then raise exception 'You need to reach the target location first'; end if;
  select * into t from public.adventure_microquest_template_catalog where template_key=q.template_key;
  select * into s from public.adventure_player_stats where character_id=a.id;
  dc:=public.adventure_phase3_dc(t.dc_category);
  modifier:=case t.default_stat when 'strength' then s.strength when 'agility' then s.agility when 'endurance' then s.endurance when 'perception' then s.perception when 'intelligence' then s.intelligence when 'charisma' then s.charisma when 'survival' then s.survival else s.arcana end;
  prof:=public.adventure_phase3_prof_bonus(a.id,t.profession_key);
  roll:=floor(random()*20+1)::integer; total:=roll+modifier+prof;
  degree:=case when roll=20 or total>=dc+10 then 'critical_success' when total>=dc then 'success' when total=dc-1 then 'success_with_complication' when roll=1 or total<=dc-10 then 'critical_failure' else 'failure' end;
  success:=degree in('critical_success','success','success_with_complication');
  perform public.adventure_p2_advance(a.id,12);
  if success then
    update public.adventure_dynamic_quests set status='completed',completed_at=now(),progress=progress||jsonb_build_object('degree',degree,'roll',roll,'resolved_at_location',a.location_id) where id=q.id;
    rewarded:=public.adventure_grant_reward(a.id,'dynamic_quest',q.id::text,q.reward_adventure_xp,q.reward_gold,q.profession_key,q.reward_profession_xp);
    perform public.adventure_phase3_rep_delta(a.id,a.location_id,2);
    message:=case q.objective_type when 'delivery' then 'The delivery reaches the right hands with very little ceremony, which is usually the sign of good courier work.' when 'search' then 'You find enough to settle the small search properly.' when 'investigation' then 'The local question finally has a useful answer.' when 'wildlife' then 'You make the observation without turning it into a chase.' when 'gathering' then 'You return with exactly the sort of local specimen that was actually requested.' when 'social_favour' then 'The favour lands without becoming a second problem.' when 'escort' then 'The road is uneventful in the best possible way.' when 'observation' then 'You return with detail rather than a guess.' else 'The small local problem is handled before it grows ambitions.' end;
  else
    update public.adventure_dynamic_quests set progress=progress||jsonb_build_object('last_degree',degree,'last_roll',roll) where id=q.id;
    message:='You make a genuine attempt, but the little job is not settled yet. Another approach may work.';
  end if;
  update public.adventure_characters set last_summary=message where id=a.id;
  insert into public.adventure_action_history(character_id,action_type,action_key,details) values(a.id,'dynamic_quest',q.id::text,jsonb_build_object('event','resolve','roll',roll,'modifier',modifier,'profession_bonus',prof,'total',total,'dc',dc,'degree',degree,'rewarded',rewarded));
  return jsonb_build_object('base',public.adventure_get_state(),'phase2',public.adventure_phase2_get_state(),'phase23',public.adventure_phase23_get_state(),'phase3',public.adventure_phase3_get_state(),'resolution',jsonb_build_object('message',message,'roll',roll,'modifier',modifier,'profession_bonus',prof,'total',total,'dc',dc,'degree',degree,'rewarded',rewarded));
end $$;

create or replace function public.adventure_phase3_save_recap()
returns jsonb language plpgsql security definer set search_path=public as $$
declare a public.adventure_characters%rowtype; locname text; snippets text[]; recap text;
begin
  if auth.uid() is null then raise exception 'You must be logged in'; end if;
  select * into a from public.adventure_characters where user_id=auth.uid() for update;
  if a.id is null then raise exception 'Create an Adventure first'; end if;
  select name into locname from public.adventure_locations where id=a.location_id;
  select array_agg(s order by id desc) into snippets from (
    select h.id,case h.action_type
      when 'dynamic_action' then coalesce(h.details->>'message','Tried something in the world')
      when 'dynamic_event' then coalesce(h.details->>'message','Handled a local event')
      when 'dynamic_quest' then 'Worked on a small local job'
      when 'npc_talk' then 'Spoke with '||coalesce((select name from public.adventure_npc_catalog where npc_key=h.action_key),'someone local')
      when 'travel' then 'Travelled the Canto roads'
      when 'local_activity' then 'Spent time on local work'
      else initcap(replace(h.action_type,'_',' ')) end as s
    from public.adventure_action_history h where h.character_id=a.id order by h.id desc limit 5
  ) z;
  recap:='Day '||a.world_day||' · '||lpad((a.world_minute/60)::text,2,'0')||':'||lpad((a.world_minute%60)::text,2,'0')||' · '||coalesce(locname,a.location_id)||'.';
  if array_length(snippets,1)>0 then recap:=recap||' Recent: '||array_to_string(snippets,' • '); end if;
  update public.adventure_characters set last_summary=left(recap,500),last_played_at=now(),updated_at=now() where id=a.id;
  return jsonb_build_object('recap',recap,'base',public.adventure_get_state(),'phase3',public.adventure_phase3_get_state());
end $$;

create or replace function public.adventure_phase3_admin(p_action text,p_key text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare a public.adventure_characters%rowtype; ec public.adventure_event_catalog%rowtype; stamp integer;
begin
  if not public.adventure_is_admin() then raise exception 'Admin only'; end if;
  select * into a from public.adventure_characters where user_id=auth.uid() for update;
  if a.id is null then raise exception 'Create an Adventure first'; end if;
  stamp:=a.world_day*1440+a.world_minute;
  if lower(p_action)='spawn_event' then
    select * into ec from public.adventure_event_catalog where event_key=p_key;
    if ec.event_key is null then raise exception 'Unknown event'; end if;
    if not a.location_id=any(ec.location_ids) then raise exception 'That event template does not belong at this location'; end if;
    update public.adventure_world_events set status='expired' where character_id=a.id and status='active';
    insert into public.adventure_world_events(character_id,event_key,status,starts_world_day,ends_world_day,data) values(a.id,ec.event_key,'active',a.world_day,a.world_day+1,jsonb_build_object('location_id',a.location_id,'start_stamp',stamp,'end_stamp',stamp+ec.duration_minutes,'title',ec.title,'description',ec.description,'category',ec.category,'admin_spawned',true));
  elsif lower(p_action)='clear_events' then update public.adventure_world_events set status='expired' where character_id=a.id and status='active';
  elsif lower(p_action)='clear_event_cooldown' then update public.adventure_world_state set cooldowns=coalesce(cooldowns,'{}'::jsonb)-'phase3:event_next' where character_id=a.id;
  else raise exception 'Unknown Phase 3 admin action'; end if;
  return jsonb_build_object('phase3',public.adventure_phase3_get_state());
end $$;

revoke all on function public.adventure_phase3_generate_microquest(text) from public,anon;
revoke all on function public.adventure_phase3_microquest_action(uuid,text) from public,anon;
revoke all on function public.adventure_phase3_save_recap() from public,anon;
revoke all on function public.adventure_phase3_admin(text,text) from public,anon;
grant execute on function public.adventure_phase3_generate_microquest(text) to authenticated;
grant execute on function public.adventure_phase3_microquest_action(uuid,text) to authenticated;
grant execute on function public.adventure_phase3_save_recap() to authenticated;
grant execute on function public.adventure_phase3_admin(text,text) to authenticated;




-- Adventure admins: both production admin usernames are accepted by the Adventure-only debug layer.
create or replace function public.adventure_is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.characters c where c.user_id=auth.uid() and lower(c.username) in('catasthma','admin'));
$$;
