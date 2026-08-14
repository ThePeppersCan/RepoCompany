
create table if not exists public.repo_diver_biome_catalog(
 id text primary key,name text not null,unlock_day integer not null,max_depth integer not null,sort_order integer not null
);
create table if not exists public.repo_diver_catch_catalog(
 id text primary key,name text not null,biome text not null references public.repo_diver_biome_catalog(id),kind text not null check(kind in ('fish','treasure')),rarity text not null,base_xp integer not null default 0,value_gp integer not null default 0,weight_kg numeric not null default 1,sort_order integer not null
);
create table if not exists public.repo_diver_recipe_catalog(
 id text primary key,name text not null,fish_id text not null references public.repo_diver_catch_catalog(id),base_price integer not null,base_xp integer not null,unlock_day integer not null,sort_order integer not null
);
create table if not exists public.repo_diver_upgrade_catalog(
 upgrade_key text primary key,category text not null check(category in ('diving','restaurant')),display_name text not null,max_level integer not null,base_cost integer not null,cost_mult numeric not null
);

insert into public.repo_diver_biome_catalog(id,name,unlock_day,max_depth,sort_order) values
('karamja','Sunlit Karamja Shelf',1,85,1),
('fremennik','Frostwake Fjord',4,125,2),
('kelp','Emerald Kelp Forest',8,165,3),
('morytania','Morytania Gloomwater',12,215,4),
('coral','Prism Coral Gardens',16,250,5),
('shipgrave','Blackglass Wreck Graveyard',20,300,6),
('abyssal','Abyssal Scar',25,380,7),
('crystal','Crystal Trench',30,440,8),
('volcanic','Brimstone Vents',35,500,9),
('ruins','Sunken Velmoran Ruins',40,575,10)
on conflict(id) do update set name=excluded.name,unlock_day=excluded.unlock_day,max_depth=excluded.max_depth,sort_order=excluded.sort_order;

insert into public.repo_diver_catch_catalog(id,name,biome,kind,rarity,base_xp,value_gp,weight_kg,sort_order) values
('sunscale_sardine','Sunscale Sardine','karamja','fish','common',10,18,0.35,1),
('palm_reef_shrimp','Palm Reef Shrimp','karamja','fish','common',15,32,0.77,2),
('karamjan_needlefish','Karamjan Needlefish','karamja','fish','uncommon',20,46,1.19,3),
('lagoon_trout','Lagoon Trout','karamja','fish','uncommon',25,60,1.61,4),
('painted_parrotfish','Painted Parrotfish','karamja','fish','rare',30,92,2.03,5),
('copper_snapper','Copper Snapper','karamja','fish','rare',35,110,2.45,6),
('bluefin_runner','Bluefin Runner','karamja','fish','rare',40,127,2.87,7),
('reef_puffer','Reef Puffer','karamja','fish','epic',65,197,3.29,8),
('coconut_crab','Coconut Crab','karamja','fish','epic',70,221,3.71,9),
('glass_goby','Glass Goby','karamja','fish','legendary',75,345,6.13,10),
('crown_angelfish','Crown Angelfish','karamja','fish','legendary',80,379,6.55,11),
('golden_sailfin','Golden Sailfin','karamja','fish','mythic',85,722,6.97,12),
('frost_cod','Frost Cod','fremennik','fish','common',22,53,0.53,13),
('rune_herring','Rune Herring','fremennik','fish','common',27,67,0.95,14),
('iceback_mackerel','Iceback Mackerel','fremennik','fish','uncommon',32,81,1.37,15),
('fjord_haddock','Fjord Haddock','fremennik','fish','uncommon',37,95,1.79,16),
('snowcap_salmon','Snowcap Salmon','fremennik','fish','rare',42,136,2.21,17),
('shieldscale_bream','Shieldscale Bream','fremennik','fish','rare',47,153,2.63,18),
('longship_lobster','Longship Lobster','fremennik','fish','rare',52,171,3.05,19),
('aurora_char','Aurora Char','fremennik','fish','epic',77,256,3.47,20),
('white_wolf_eel','White Wolf Eel','fremennik','fish','epic',82,280,3.89,21),
('glacier_skate','Glacier Skate','fremennik','fish','legendary',87,429,6.31,22),
('northwind_tuna','Northwind Tuna','fremennik','fish','legendary',92,463,6.73,23),
('jarl_swordfin','Jarl Swordfin','fremennik','fish','mythic',97,869,7.15,24),
('kelp_sprat','Kelp Sprat','kelp','fish','common',34,88,0.71,25),
('ribbon_pipefish','Ribbon Pipefish','kelp','fish','common',39,102,1.13,26),
('emerald_wrasse','Emerald Wrasse','kelp','fish','uncommon',44,116,1.55,27),
('forest_perch','Forest Perch','kelp','fish','uncommon',49,130,1.97,28),
('leafback_ray','Leafback Ray','kelp','fish','rare',54,180,2.39,29),
('green_moray','Green Moray','kelp','fish','rare',59,197,2.81,30),
('kelp_grouper','Kelp Grouper','kelp','fish','rare',64,215,3.23,31),
('lantern_seahorse','Lantern Seahorse','kelp','fish','epic',89,316,3.65,32),
('moss_crab','Moss Crab','kelp','fish','epic',94,340,4.07,33),
('hunting_barracuda','Hunting Barracuda','kelp','fish','legendary',99,513,6.49,34),
('stagfin_tuna','Stagfin Tuna','kelp','fish','legendary',104,547,6.91,35),
('oldgrowth_sturgeon','Oldgrowth Sturgeon','kelp','fish','mythic',109,1016,7.33,36),
('bog_minnow','Bog Minnow','morytania','fish','common',46,123,0.89,37),
('gloom_carp','Gloom Carp','morytania','fish','common',51,137,1.31,38),
('moon_jelly','Moon Jelly','morytania','fish','uncommon',56,151,1.73,39),
('swamp_gar','Swamp Gar','morytania','fish','uncommon',61,165,2.15,40),
('blood_eel','Blood Eel','morytania','fish','rare',66,223,2.57,41),
('gravefin_bream','Gravefin Bream','morytania','fish','rare',71,241,2.99,42),
('mist_pike','Mist Pike','morytania','fish','rare',76,258,3.41,43),
('vampyre_squid','Vampyre Squid','morytania','fish','epic',101,375,3.83,44),
('crypt_crab','Crypt Crab','morytania','fish','epic',106,399,4.25,45),
('spectral_koi','Spectral Koi','morytania','fish','legendary',111,597,6.67,46),
('ghost_shark','Ghost Shark','morytania','fish','legendary',116,631,7.09,47),
('soul_angler','Soul Angler','morytania','fish','mythic',121,1163,7.51,48),
('prism_damsel','Prism Damsel','coral','fish','common',58,158,1.07,49),
('rose_clownfish','Rose Clownfish','coral','fish','common',63,172,1.49,50),
('opal_butterflyfish','Opal Butterflyfish','coral','fish','uncommon',68,186,1.91,51),
('rainbow_chromis','Rainbow Chromis','coral','fish','uncommon',73,200,2.33,52),
('pearl_snapper','Pearl Snapper','coral','fish','rare',78,267,2.75,53),
('velvet_wrasse','Velvet Wrasse','coral','fish','rare',83,285,3.17,54),
('sunburst_tang','Sunburst Tang','coral','fish','rare',88,302,3.59,55),
('coral_lobster','Coral Lobster','coral','fish','epic',113,435,4.01,56),
('petal_ray','Petal Ray','coral','fish','epic',118,459,4.43,57),
('jewel_triggerfish','Jewel Triggerfish','coral','fish','legendary',123,681,6.85,58),
('crown_manta','Crown Manta','coral','fish','legendary',128,715,7.27,59),
('celestial_seahorse','Celestial Seahorse','coral','fish','mythic',133,1310,7.69,60),
('rustscale_sardine','Rustscale Sardine','shipgrave','fish','common',70,193,1.25,61),
('bilge_cod','Bilge Cod','shipgrave','fish','common',75,207,1.67,62),
('anchor_crab','Anchor Crab','shipgrave','fish','uncommon',80,221,2.09,63),
('wreck_grouper','Wreck Grouper','shipgrave','fish','uncommon',85,235,2.51,64),
('cannonball_puffer','Cannonball Puffer','shipgrave','fish','rare',90,311,2.93,65),
('blackglass_eel','Blackglass Eel','shipgrave','fish','rare',95,328,3.35,66),
('sailcloth_ray','Sailcloth Ray','shipgrave','fish','rare',100,346,3.77,67),
('drowned_tuna','Drowned Tuna','shipgrave','fish','epic',125,494,4.19,68),
('captain_lobster','Captain Lobster','shipgrave','fish','epic',130,518,4.61,69),
('ironjaw_barracuda','Ironjaw Barracuda','shipgrave','fish','legendary',135,765,7.03,70),
('mastbreaker_shark','Mastbreaker Shark','shipgrave','fish','legendary',140,799,7.45,71),
('admiral_swordfish','Admiral Swordfish','shipgrave','fish','mythic',145,1457,7.87,72),
('blind_lanternfish','Blind Lanternfish','abyssal','fish','common',82,228,1.43,73),
('abyssal_eel','Abyssal Eel','abyssal','fish','common',87,242,1.85,74),
('void_shrimp','Void Shrimp','abyssal','fish','uncommon',92,256,2.27,75),
('blackfin_fangtooth','Blackfin Fangtooth','abyssal','fish','uncommon',97,270,2.69,76),
('deep_hatchetfish','Deep Hatchetfish','abyssal','fish','rare',102,355,3.11,77),
('nightmare_squid','Nightmare Squid','abyssal','fish','rare',107,372,3.53,78),
('abyss_ray','Abyss Ray','abyssal','fish','rare',112,390,3.95,79),
('gravetide_shark','Gravetide Shark','abyssal','fish','epic',137,554,4.37,80),
('starless_sturgeon','Starless Sturgeon','abyssal','fish','epic',142,578,4.79,81),
('void_manta','Void Manta','abyssal','fish','legendary',147,849,7.21,82),
('leviathan_fry','Leviathan Fry','abyssal','fish','legendary',152,883,7.63,83),
('abyssal_emperor','Abyssal Emperor','abyssal','fish','mythic',157,1604,8.05,84),
('crystal_minnow','Crystal Minnow','crystal','fish','common',94,263,1.61,85),
('shardfin_tetra','Shardfin Tetra','crystal','fish','common',99,277,2.03,86),
('quartz_trout','Quartz Trout','crystal','fish','uncommon',104,291,2.45,87),
('amethyst_eel','Amethyst Eel','crystal','fish','uncommon',109,305,2.87,88),
('sapphire_crab','Sapphire Crab','crystal','fish','rare',114,398,3.29,89),
('prism_tuna','Prism Tuna','crystal','fish','rare',119,416,3.71,90),
('diamond_ray','Diamond Ray','crystal','fish','rare',124,433,4.13,91),
('crystal_lobster','Crystal Lobster','crystal','fish','epic',149,613,4.55,92),
('mirror_shark','Mirror Shark','crystal','fish','epic',154,637,4.97,93),
('runelight_manta','Runelight Manta','crystal','fish','legendary',159,933,7.39,94),
('ancient_manta','Ancient Manta','crystal','fish','legendary',164,967,7.81,95),
('cavern_crownfish','Cavern Crownfish','crystal','fish','mythic',169,1751,8.23,96),
('ash_sprat','Ash Sprat','volcanic','fish','common',106,298,1.79,97),
('ember_goby','Ember Goby','volcanic','fish','common',111,312,2.21,98),
('sulphur_snapper','Sulphur Snapper','volcanic','fish','uncommon',116,326,2.63,99),
('lava_eel','Lava Eel','volcanic','fish','uncommon',121,340,3.05,100),
('cinder_crab','Cinder Crab','volcanic','fish','rare',126,442,3.47,101),
('magma_grouper','Magma Grouper','volcanic','fish','rare',131,460,3.89,102),
('firefin_tuna','Firefin Tuna','volcanic','fish','rare',136,477,4.31,103),
('vent_lobster','Vent Lobster','volcanic','fish','epic',161,673,4.73,104),
('obsidian_ray','Obsidian Ray','volcanic','fish','epic',166,697,5.15,105),
('brimstone_shark','Brimstone Shark','volcanic','fish','legendary',171,1017,7.57,106),
('infernal_marlin','Infernal Marlin','volcanic','fish','legendary',176,1051,7.99,107),
('phoenix_manta','Phoenix Manta','volcanic','fish','mythic',181,1898,8.41,108),
('mosaic_minnow','Mosaic Minnow','ruins','fish','common',118,333,1.97,109),
('temple_bream','Temple Bream','ruins','fish','common',123,347,2.39,110),
('relic_crab','Relic Crab','ruins','fish','uncommon',128,361,2.81,111),
('scripture_eel','Scripture Eel','ruins','fish','uncommon',133,375,3.23,112),
('marble_grouper','Marble Grouper','ruins','fish','rare',138,486,3.65,113),
('oracle_koi','Oracle Koi','ruins','fish','rare',143,503,4.07,114),
('gilded_tuna','Gilded Tuna','ruins','fish','rare',148,521,4.49,115),
('sentinel_ray','Sentinel Ray','ruins','fish','epic',173,732,4.91,116),
('royal_lobster','Royal Lobster','ruins','fish','epic',178,756,5.33,117),
('forgotten_shark','Forgotten Shark','ruins','fish','legendary',183,1101,7.75,118),
('chronicle_manta','Chronicle Manta','ruins','fish','legendary',188,1135,8.17,119),
('velmoran_leviathan','Velmoran Leviathan','ruins','fish','mythic',193,2045,8.59,120),
('karamja_cache','Sealed Salvage Cache','karamja','treasure','rare',0,120,1.1,1000),
('karamja_relic','Recovered Coastal Relic','karamja','treasure','epic',0,215,1.6,1001),
('fremennik_cache','Sealed Salvage Cache','fremennik','treasure','rare',0,230,1.1,1010),
('fremennik_relic','Recovered Coastal Relic','fremennik','treasure','epic',0,325,1.6,1011),
('kelp_cache','Emerald Kelp Cache','kelp','treasure','rare',0,340,1.1,1020),
('kelp_relic','Emerald Kelp Relic','kelp','treasure','epic',0,435,1.6,1021),
('morytania_cache','Gloomwater Cache','morytania','treasure','rare',0,450,1.1,1030),
('morytania_relic','Gloomwater Relic','morytania','treasure','epic',0,545,1.6,1031),
('coral_cache','Prism Gardens Cache','coral','treasure','rare',0,560,1.1,1040),
('coral_relic','Prism Gardens Relic','coral','treasure','epic',0,655,1.6,1041),
('shipgrave_cache','Wreck Graveyard Cache','shipgrave','treasure','rare',0,670,1.1,1050),
('shipgrave_relic','Wreck Graveyard Relic','shipgrave','treasure','epic',0,765,1.6,1051),
('abyssal_cache','Abyssal Scar Cache','abyssal','treasure','rare',0,780,1.1,1060),
('abyssal_relic','Abyssal Scar Relic','abyssal','treasure','epic',0,875,1.6,1061),
('crystal_cache','Crystal Trench Cache','crystal','treasure','rare',0,890,1.1,1070),
('crystal_relic','Crystal Trench Relic','crystal','treasure','epic',0,985,1.6,1071),
('volcanic_cache','Brimstone Vents Cache','volcanic','treasure','rare',0,1000,1.1,1080),
('volcanic_relic','Brimstone Vents Relic','volcanic','treasure','epic',0,1095,1.6,1081),
('ruins_cache','Velmoran Ruins Cache','ruins','treasure','rare',0,1110,1.1,1090),
('ruins_relic','Velmoran Ruins Relic','ruins','treasure','epic',0,1205,1.6,1091)
on conflict(id) do update set name=excluded.name,biome=excluded.biome,kind=excluded.kind,rarity=excluded.rarity,base_xp=excluded.base_xp,value_gp=excluded.value_gp,weight_kg=excluded.weight_kg,sort_order=excluded.sort_order;

insert into public.repo_diver_recipe_catalog(id,name,fish_id,base_price,base_xp,unlock_day,sort_order) values
('lagoon_trout_seared','Lagoon Trout Citrus Sear','lagoon_trout',129,37,1,0),
('bluefin_runner_grill','Bluefin Runner Harbour Grill','bluefin_runner',330,74,1,1),
('crown_angelfish_trophy','Crown Angelfish Chef’s Trophy Plate','crown_angelfish',1155,176,1,2),
('fjord_haddock_seared','Fjord Haddock Citrus Sear','fjord_haddock',204,55,4,3),
('longship_lobster_grill','Longship Lobster Harbour Grill','longship_lobster',444,96,4,4),
('northwind_tuna_trophy','Northwind Tuna Chef’s Trophy Plate','northwind_tuna',1412,202,4,5),
('forest_perch_seared','Forest Perch Citrus Sear','forest_perch',279,73,8,6),
('kelp_grouper_grill','Kelp Grouper Harbour Grill','kelp_grouper',559,118,8,7),
('stagfin_tuna_trophy','Stagfin Tuna Chef’s Trophy Plate','stagfin_tuna',1668,228,8,8),
('swamp_gar_seared','Swamp Gar Citrus Sear','swamp_gar',354,91,12,9),
('mist_pike_grill','Mist Pike Harbour Grill','mist_pike',670,140,12,10),
('ghost_shark_trophy','Ghost Shark Chef’s Trophy Plate','ghost_shark',1924,255,12,11),
('rainbow_chromis_seared','Rainbow Chromis Citrus Sear','rainbow_chromis',430,109,16,12),
('sunburst_tang_grill','Sunburst Tang Harbour Grill','sunburst_tang',785,162,16,13),
('crown_manta_trophy','Crown Manta Chef’s Trophy Plate','crown_manta',2180,281,16,14),
('wreck_grouper_seared','Wreck Grouper Citrus Sear','wreck_grouper',505,127,20,15),
('sailcloth_ray_grill','Sailcloth Ray Harbour Grill','sailcloth_ray',899,185,20,16),
('mastbreaker_shark_trophy','Mastbreaker Shark Chef’s Trophy Plate','mastbreaker_shark',2436,308,20,17),
('blackfin_fangtooth_seared','Blackfin Fangtooth Citrus Sear','blackfin_fangtooth',580,145,25,18),
('abyss_ray_grill','Abyss Ray Harbour Grill','abyss_ray',1014,207,25,19),
('leviathan_fry_trophy','Leviathan Fry Chef’s Trophy Plate','leviathan_fry',2693,334,25,20),
('amethyst_eel_seared','Amethyst Eel Citrus Sear','amethyst_eel',655,163,30,21),
('diamond_ray_grill','Diamond Ray Harbour Grill','diamond_ray',1125,229,30,22),
('ancient_manta_trophy','Ancient Manta Chef’s Trophy Plate','ancient_manta',2949,360,30,23),
('lava_eel_seared','Lava Eel Citrus Sear','lava_eel',731,181,35,24),
('firefin_tuna_grill','Firefin Tuna Harbour Grill','firefin_tuna',1240,251,35,25),
('infernal_marlin_trophy','Infernal Marlin Chef’s Trophy Plate','infernal_marlin',3205,387,35,26),
('scripture_eel_seared','Scripture Eel Citrus Sear','scripture_eel',806,199,40,27),
('gilded_tuna_grill','Gilded Tuna Harbour Grill','gilded_tuna',1354,273,40,28),
('chronicle_manta_trophy','Chronicle Manta Chef’s Trophy Plate','chronicle_manta',3461,413,40,29)
on conflict(id) do update set name=excluded.name,fish_id=excluded.fish_id,base_price=excluded.base_price,base_xp=excluded.base_xp,unlock_day=excluded.unlock_day,sort_order=excluded.sort_order;

insert into public.repo_diver_upgrade_catalog(upgrade_key,category,display_name,max_level,base_cost,cost_mult) values
('tank','diving','Oxygen Tank',8,1800,1.52),
('cargo','diving','Cargo Harness',8,1600,1.5),
('harpoon','diving','Precision Harpoon',8,2200,1.55),
('suit','diving','Pressure Suit',7,2800,1.58),
('boost','diving','Jet Fins',8,1900,1.52),
('sonar','diving','Rare-Fish Sonar',6,3200,1.64),
('lamp','diving','Abyss Lamp',6,2500,1.58),
('fins','diving','Hydro Fins',7,2100,1.53),
('lure','diving','Bait Projector',6,3000,1.6),
('salvage','diving','Salvage Rig',6,3400,1.62),
('medkit','diving','Auto Med-Gel',5,3600,1.66),
('stabilizer','diving','Catch Stabilizer',6,3100,1.6),
('thermal','diving','Thermal Shielding',5,4200,1.67),
('pressure','diving','Deep Pressure Regulator',6,4500,1.68),
('kitchen','restaurant','Chef Line',8,2400,1.55),
('tables','restaurant','Dining Capacity',8,2600,1.56),
('fridge','restaurant','Cold Storage',6,2300,1.54),
('plating','restaurant','Plating Station',6,3000,1.6),
('service','restaurant','Service Training',6,3000,1.6),
('ambience','restaurant','Dining Ambience',6,3500,1.62),
('menu','restaurant','Menu Board',6,2800,1.58),
('staff','restaurant','Kitchen Crew',6,4200,1.66),
('reputation','restaurant','Critic Relations',6,4800,1.7),
('cellar','restaurant','Chef’s Pantry',6,3900,1.64)
on conflict(upgrade_key) do update set category=excluded.category,display_name=excluded.display_name,max_level=excluded.max_level,base_cost=excluded.base_cost,cost_mult=excluded.cost_mult;

-- Preserve every existing profile while adding defaults for the expanded systems.
update public.repo_diver_profiles set
 equipment=equipment || jsonb_build_object('sonar',coalesce((equipment->>'sonar')::int,1),'lamp',coalesce((equipment->>'lamp')::int,1),'fins',coalesce((equipment->>'fins')::int,1),'lure',coalesce((equipment->>'lure')::int,1),'salvage',coalesce((equipment->>'salvage')::int,1),'medkit',coalesce((equipment->>'medkit')::int,1),'stabilizer',coalesce((equipment->>'stabilizer')::int,1),'thermal',coalesce((equipment->>'thermal')::int,1),'pressure',coalesce((equipment->>'pressure')::int,1)),
 restaurant=restaurant || jsonb_build_object('fridge',coalesce((restaurant->>'fridge')::int,1),'plating',coalesce((restaurant->>'plating')::int,1),'service',coalesce((restaurant->>'service')::int,1),'ambience',coalesce((restaurant->>'ambience')::int,1),'menu',coalesce((restaurant->>'menu')::int,1),'staff',coalesce((restaurant->>'staff')::int,1),'reputation',coalesce((restaurant->>'reputation')::int,1),'cellar',coalesce((restaurant->>'cellar')::int,1)),
 stats=stats || jsonb_build_object('treasures_found',coalesce((stats->>'treasures_found')::int,0),'best_service_rating',coalesce((stats->>'best_service_rating')::numeric,0),'days_completed',greatest(0,day_number-1));

create or replace function public.repo_diver_get_profile()
returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare u uuid:=auth.uid();p public.repo_diver_profiles%rowtype;v_unlocks jsonb;v_recipes jsonb;
begin
 if u is null then raise exception 'You must be logged in';end if;
 insert into public.repo_diver_profiles(user_id) values(u) on conflict(user_id) do nothing;
 select * into p from public.repo_diver_profiles where user_id=u;
 select coalesce(jsonb_agg(b.id order by b.sort_order),'[]'::jsonb) into v_unlocks from public.repo_diver_biome_catalog b where b.unlock_day<=p.day_number;
 select coalesce(jsonb_agg(r.id order by r.sort_order),'[]'::jsonb) into v_recipes from public.repo_diver_recipe_catalog r where r.unlock_day<=p.day_number;
 update public.repo_diver_profiles set unlocked_biomes=v_unlocks,recipes=v_recipes where user_id=u;
 return jsonb_build_object('day_number',p.day_number,'level',least(40,p.day_number),'unlocked_biomes',v_unlocks,'equipment',p.equipment,'restaurant',p.restaurant,'fish_journal',p.fish_journal,'recipes',v_recipes,'stats',p.stats,'achievements',p.achievements);
end$$;

create or replace function public.repo_diver_start_day(p_biome text)
returns table(run_id uuid,server_started_at timestamptz) language plpgsql security definer set search_path='public','auth' as $$
declare u uuid:=auth.uid();p public.repo_diver_profiles%rowtype;b public.repo_diver_biome_catalog%rowtype;rid uuid:=gen_random_uuid();
begin
 if u is null then raise exception 'You must be logged in';end if;
 insert into public.repo_diver_profiles(user_id) values(u) on conflict(user_id) do nothing;
 select * into p from public.repo_diver_profiles where user_id=u;
 select * into b from public.repo_diver_biome_catalog where id=p_biome;
 if not found then raise exception 'Invalid biome';end if;
 if p.day_number<b.unlock_day then raise exception 'Biome is locked';end if;
 update public.repo_diver_runs set status='abandoned',completed_at=now() where user_id=u and status='active';
 insert into public.repo_diver_runs(id,user_id,biome) values(rid,u,p_biome);
 return query select rid,now();
end$$;

create or replace function public.repo_diver_buy_upgrade(p_upgrade text)
returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare u uuid:=auth.uid();p public.repo_diver_profiles%rowtype;c public.characters%rowtype;cat public.repo_diver_upgrade_catalog%rowtype;lv int;cost bigint;eq jsonb;rest jsonb;
begin
 if u is null then raise exception 'You must be logged in';end if;
 select * into cat from public.repo_diver_upgrade_catalog where upgrade_key=p_upgrade;
 if not found then raise exception 'Invalid upgrade';end if;
 insert into public.repo_diver_profiles(user_id) values(u) on conflict(user_id) do nothing;
 select * into p from public.repo_diver_profiles where user_id=u for update;
 select * into c from public.characters where user_id=u for update;
 if not found then raise exception 'Character not found';end if;
 if cat.category='restaurant' then lv:=coalesce((p.restaurant->>p_upgrade)::int,1); else lv:=coalesce((p.equipment->>p_upgrade)::int,1); end if;
 if lv>=cat.max_level then raise exception 'Upgrade already maxed';end if;
 cost:=round(cat.base_cost*power(cat.cost_mult,lv-1));
 if c.gp<cost then raise exception 'Not enough GP';end if;
 update public.characters set gp=gp-cost where user_id=u;
 if cat.category='restaurant' then
   rest:=jsonb_set(p.restaurant,array[p_upgrade],to_jsonb(lv+1),true);
   update public.repo_diver_profiles set restaurant=rest,updated_at=now() where user_id=u;
   return jsonb_build_object('equipment',p.equipment,'restaurant',rest,'gp',c.gp-cost,'cost',cost);
 else
   eq:=jsonb_set(p.equipment,array[p_upgrade],to_jsonb(lv+1),true);
   update public.repo_diver_profiles set equipment=eq,updated_at=now() where user_id=u;
   return jsonb_build_object('equipment',eq,'restaurant',p.restaurant,'gp',c.gp-cost,'cost',cost);
 end if;
end$$;

create or replace function public.repo_diver_complete_day(p_run_id uuid,p_catches jsonb,p_dishes jsonb,p_max_depth integer,p_customers integer)
returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare
 v_user uuid:=auth.uid();v_run public.repo_diver_runs%rowtype;v_profile public.repo_diver_profiles%rowtype;v_character public.characters%rowtype;
 v_item jsonb;v_cat public.repo_diver_catch_catalog%rowtype;v_recipe public.repo_diver_recipe_catalog%rowtype;v_id text;v_quality int;v_fx int:=0;v_cx int:=0;v_gold int:=0;v_treasure_gp int:=0;v_count_fish int:=0;v_count_treasure int:=0;v_count_dish int:=0;v_perfect int:=0;v_fishmap jsonb:='{}'::jsonb;v_usedmap jsonb:='{}'::jsonb;v_journal jsonb;v_stats jsonb;v_unlocks jsonb;v_recipes jsonb;v_elapsed numeric;v_factor numeric;
begin
 if v_user is null then raise exception 'You must be logged in';end if;
 if p_customers is null or p_customers<0 or p_customers>80 then raise exception 'Invalid customer count';end if;
 select * into v_run from public.repo_diver_runs where id=p_run_id and user_id=v_user for update;
 if not found then raise exception 'Run not found';end if;
 if v_run.status='claimed' then select * into v_character from public.characters where user_id=v_user;return jsonb_build_object('duplicate',true,'fishing_xp_awarded',v_run.fishing_xp,'cooking_xp_awarded',v_run.cooking_xp,'gp_awarded',v_run.gp,'fishing_xp',v_character.fishing_xp,'cooking_xp',v_character.cooking_xp,'gp',v_character.gp);end if;
 if v_run.status<>'active' then raise exception 'Run is not active';end if;
 v_elapsed:=extract(epoch from(now()-v_run.started_at));if v_elapsed<8 or v_elapsed>5400 then raise exception 'Invalid run duration';end if;
 if jsonb_typeof(coalesce(p_catches,'[]'::jsonb))<>'array' or jsonb_typeof(coalesce(p_dishes,'[]'::jsonb))<>'array' then raise exception 'Invalid results';end if;
 for v_item in select value from jsonb_array_elements(coalesce(p_catches,'[]'::jsonb)) limit 90 loop
   v_id:=v_item->>'id';v_quality:=least(4,greatest(1,coalesce((v_item->>'q')::int,1)));
   select * into v_cat from public.repo_diver_catch_catalog where id=v_id and biome=v_run.biome;
   if not found then continue;end if;
   if v_cat.kind='fish' then
     v_fx:=v_fx+round(v_cat.base_xp*(1+(v_quality-1)*.16));v_count_fish:=v_count_fish+1;
     v_fishmap:=jsonb_set(v_fishmap,array[v_id],to_jsonb(coalesce((v_fishmap->>v_id)::int,0)+1),true);
   else
     v_count_treasure:=v_count_treasure+1;v_treasure_gp:=v_treasure_gp+round(v_cat.value_gp*(1+(v_quality-1)*.20));
   end if;
 end loop;
 if v_count_fish+v_count_treasure>greatest(8,floor(v_elapsed/1.1)::int) then raise exception 'Catch rate validation failed';end if;
 for v_item in select value from jsonb_array_elements(coalesce(p_dishes,'[]'::jsonb)) limit greatest(0,least(45,p_customers)) loop
   v_id:=v_item->>'id';v_quality:=least(4,greatest(1,coalesce((v_item->>'quality')::int,1)));
   select * into v_recipe from public.repo_diver_recipe_catalog where id=v_id and unlock_day<=greatest(1,(select day_number from public.repo_diver_profiles where user_id=v_user));
   if not found then continue;end if;
   if coalesce((v_fishmap->>v_recipe.fish_id)::int,0)<=coalesce((v_usedmap->>v_recipe.fish_id)::int,0) then continue;end if;
   v_usedmap:=jsonb_set(v_usedmap,array[v_recipe.fish_id],to_jsonb(coalesce((v_usedmap->>v_recipe.fish_id)::int,0)+1),true);
   v_factor:=case v_quality when 4 then 1.30 when 3 then 1.12 when 2 then .92 else .72 end;
   v_cx:=v_cx+round(v_recipe.base_xp*v_factor);v_gold:=v_gold+round(v_recipe.base_price*v_factor);v_count_dish:=v_count_dish+1;if v_quality=4 then v_perfect:=v_perfect+1;end if;
 end loop;
 v_fx:=least(v_fx,6500);v_cx:=least(v_cx,5200);v_gold:=least(v_gold,15000);v_treasure_gp:=least(v_treasure_gp,5500);v_gold:=v_gold+v_treasure_gp;
 select * into v_character from public.characters where user_id=v_user for update;if not found then raise exception 'Character not found';end if;
 insert into public.repo_diver_profiles(user_id) values(v_user) on conflict(user_id) do nothing;select * into v_profile from public.repo_diver_profiles where user_id=v_user for update;
 v_journal:=v_profile.fish_journal;
 for v_id,v_quality in select key,(value #>> '{}')::int from jsonb_each(v_fishmap) loop
   v_journal:=jsonb_set(v_journal,array[v_id],jsonb_build_object('count',coalesce((v_journal->v_id->>'count')::int,0)+v_quality,'best_q',greatest(coalesce((v_journal->v_id->>'best_q')::int,0),coalesce((select max((x->>'q')::int) from jsonb_array_elements(p_catches) x where x->>'id'=v_id),1))),true);
 end loop;
 v_stats:=v_profile.stats||jsonb_build_object('deepest',greatest(coalesce((v_profile.stats->>'deepest')::numeric,0),greatest(0,p_max_depth)),'total_fish',coalesce((v_profile.stats->>'total_fish')::int,0)+v_count_fish,'total_revenue',coalesce((v_profile.stats->>'total_revenue')::bigint,0)+v_gold,'perfect_dishes',coalesce((v_profile.stats->>'perfect_dishes')::int,0)+v_perfect,'treasures_found',coalesce((v_profile.stats->>'treasures_found')::int,0)+v_count_treasure,'days_completed',v_profile.day_number);
 update public.characters set fishing_xp=fishing_xp+v_fx,cooking_xp=cooking_xp+v_cx,gp=gp+v_gold where user_id=v_user returning * into v_character;
 select coalesce(jsonb_agg(id order by sort_order),'[]'::jsonb) into v_unlocks from public.repo_diver_biome_catalog where unlock_day<=v_profile.day_number+1;
 select coalesce(jsonb_agg(id order by sort_order),'[]'::jsonb) into v_recipes from public.repo_diver_recipe_catalog where unlock_day<=v_profile.day_number+1;
 update public.repo_diver_profiles set day_number=day_number+1,fish_journal=v_journal,stats=v_stats,unlocked_biomes=v_unlocks,recipes=v_recipes,restaurant=jsonb_set(restaurant,'{rank}',to_jsonb(least(10,1+floor((v_profile.day_number+1)/4)::int)),true),updated_at=now() where user_id=v_user;
 update public.repo_diver_runs set status='claimed',completed_at=now(),fishing_xp=v_fx,cooking_xp=v_cx,gp=v_gold,summary=jsonb_build_object('fish',v_count_fish,'treasures',v_count_treasure,'dishes',v_count_dish,'depth',p_max_depth,'customers',p_customers) where id=p_run_id and user_id=v_user;
 return jsonb_build_object('fishing_xp_awarded',v_fx,'cooking_xp_awarded',v_cx,'gp_awarded',v_gold,'treasure_gp',v_treasure_gp,'fishing_xp',v_character.fishing_xp,'cooking_xp',v_character.cooking_xp,'gp',v_character.gp,'next_level',least(40,v_profile.day_number+1),'new_biomes',v_unlocks,'new_recipes',v_recipes);
end$$;

grant execute on function public.repo_diver_get_profile() to authenticated;
grant execute on function public.repo_diver_start_day(text) to authenticated;
grant execute on function public.repo_diver_buy_upgrade(text) to authenticated;
grant execute on function public.repo_diver_complete_day(uuid,jsonb,jsonb,integer,integer) to authenticated;
