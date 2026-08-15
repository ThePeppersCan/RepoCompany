
insert into public.repo_diver_recipe_catalog(id,name,fish_id,base_price,base_xp,unlock_day,sort_order) values
('sunscale_sardine_broth','Sunscale Sardine Coastal Broth','sunscale_sardine',10,12,1,30),
('karamjan_needlefish_ceviche','Karamjan Needlefish Citrus Ceviche','karamjan_needlefish',34,19,1,31),
('copper_snapper_crispy','Copper Snapper Crispy House Fry','copper_snapper',92,37,1,32),
('coconut_crab_platter','Coconut Crab Chef’s Sharing Platter','coconut_crab',232,84,1,33),
('frost_cod_broth','Frost Cod Coastal Broth','frost_cod',29,16,4,34),
('iceback_mackerel_ceviche','Iceback Mackerel Citrus Ceviche','iceback_mackerel',60,30,4,35),
('shieldscale_bream_crispy','Shieldscale Bream Crispy House Fry','shieldscale_bream',129,49,4,36),
('white_wolf_eel_platter','White Wolf Eel Chef’s Sharing Platter','white_wolf_eel',294,98,4,37),
('kelp_sprat_broth','Kelp Sprat Coastal Broth','kelp_sprat',48,26,8,38),
('emerald_wrasse_ceviche','Emerald Wrasse Citrus Ceviche','emerald_wrasse',86,42,8,39),
('green_moray_crispy','Green Moray Crispy House Fry','green_moray',165,62,8,40),
('moss_crab_platter','Moss Crab Chef’s Sharing Platter','moss_crab',357,113,8,41),
('bog_minnow_broth','Bog Minnow Coastal Broth','bog_minnow',68,34,12,42),
('moon_jelly_ceviche','Moon Jelly Citrus Ceviche','moon_jelly',112,53,12,43),
('gravefin_bream_crispy','Gravefin Bream Crispy House Fry','gravefin_bream',202,75,12,44),
('crypt_crab_platter','Crypt Crab Chef’s Sharing Platter','crypt_crab',419,127,12,45),
('prism_damsel_broth','Prism Damsel Coastal Broth','prism_damsel',87,44,16,46),
('opal_butterflyfish_ceviche','Opal Butterflyfish Citrus Ceviche','opal_butterflyfish',138,65,16,47),
('velvet_wrasse_crispy','Velvet Wrasse Crispy House Fry','velvet_wrasse',239,87,16,48),
('petal_ray_platter','Petal Ray Chef’s Sharing Platter','petal_ray',482,142,16,49),
('rustscale_sardine_broth','Rustscale Sardine Coastal Broth','rustscale_sardine',106,52,20,50),
('anchor_crab_ceviche','Anchor Crab Citrus Ceviche','anchor_crab',164,76,20,51),
('blackglass_eel_crispy','Blackglass Eel Crispy House Fry','blackglass_eel',276,100,20,52),
('captain_lobster_platter','Captain Lobster Chef’s Sharing Platter','captain_lobster',544,156,20,53),
('blind_lanternfish_broth','Blind Lanternfish Coastal Broth','blind_lanternfish',125,62,25,54),
('void_shrimp_ceviche','Void Shrimp Citrus Ceviche','void_shrimp',189,87,25,55),
('nightmare_squid_crispy','Nightmare Squid Crispy House Fry','nightmare_squid',312,112,25,56),
('starless_sturgeon_platter','Starless Sturgeon Chef’s Sharing Platter','starless_sturgeon',607,170,25,57),
('crystal_minnow_broth','Crystal Minnow Coastal Broth','crystal_minnow',145,70,30,58),
('quartz_trout_ceviche','Quartz Trout Citrus Ceviche','quartz_trout',215,99,30,59),
('prism_tuna_crispy','Prism Tuna Crispy House Fry','prism_tuna',349,125,30,60),
('mirror_shark_platter','Mirror Shark Chef’s Sharing Platter','mirror_shark',669,185,30,61),
('ash_sprat_broth','Ash Sprat Coastal Broth','ash_sprat',164,80,35,62),
('sulphur_snapper_ceviche','Sulphur Snapper Citrus Ceviche','sulphur_snapper',241,110,35,63),
('magma_grouper_crispy','Magma Grouper Crispy House Fry','magma_grouper',386,138,35,64),
('obsidian_ray_platter','Obsidian Ray Chef’s Sharing Platter','obsidian_ray',732,199,35,65),
('mosaic_minnow_broth','Mosaic Minnow Coastal Broth','mosaic_minnow',183,88,40,66),
('relic_crab_ceviche','Relic Crab Citrus Ceviche','relic_crab',267,122,40,67),
('oracle_koi_crispy','Oracle Koi Crispy House Fry','oracle_koi',423,150,40,68),
('royal_lobster_platter','Royal Lobster Chef’s Sharing Platter','royal_lobster',794,214,40,69)
on conflict(id) do update set
 name=excluded.name,fish_id=excluded.fish_id,base_price=excluded.base_price,base_xp=excluded.base_xp,unlock_day=excluded.unlock_day,sort_order=excluded.sort_order;

create or replace function public.repo_diver_save_restaurant_theme(p_theme text)
returns jsonb
language plpgsql security definer
set search_path='public','auth'
as $$
declare
 v_uid uuid:=auth.uid();
 v_theme text:=lower(trim(coalesce(p_theme,'')));
 v_rest jsonb;
begin
 if v_uid is null then raise exception 'You must be logged in'; end if;
 if v_theme not in ('harbour','navy','coral') then raise exception 'Invalid Fish House theme'; end if;
 insert into public.repo_diver_profiles(user_id) values(v_uid) on conflict(user_id) do nothing;
 update public.repo_diver_profiles
 set restaurant=jsonb_set(coalesce(restaurant,'{}'::jsonb),'{theme}',to_jsonb(v_theme),true),updated_at=now()
 where user_id=v_uid
 returning restaurant into v_rest;
 return v_rest;
end$$;

grant execute on function public.repo_diver_save_restaurant_theme(text) to authenticated;

create or replace function public.repo_diver_complete_day(p_run_id uuid,p_catches jsonb,p_dishes jsonb,p_max_depth integer,p_customers integer)
returns jsonb
language plpgsql security definer
set search_path='public','auth'
as $$
declare
 v_user uuid:=auth.uid();v_run public.repo_diver_runs%rowtype;v_profile public.repo_diver_profiles%rowtype;v_character public.characters%rowtype;
 v_item jsonb;v_cat public.repo_diver_catch_catalog%rowtype;v_recipe public.repo_diver_recipe_catalog%rowtype;v_id text;v_quality int;
 v_fx int:=0;v_cx int:=0;v_service_gross int:=0;v_gold int:=0;v_treasure_gp int:=0;v_staff_wages int:=0;
 v_count_fish int:=0;v_count_treasure int:=0;v_count_dish int:=0;v_perfect int:=0;v_legendary int:=0;
 v_fishmap jsonb:='{}'::jsonb;v_usedmap jsonb:='{}'::jsonb;v_journal jsonb;v_stats jsonb;v_unlocks jsonb;v_recipes jsonb;
 v_elapsed numeric;v_factor numeric;v_best_weight numeric;v_staff_level int:=1;v_rep_gain int:=0;v_rep_total int:=0;v_rank int:=1;v_rest jsonb;
begin
 if v_user is null then raise exception 'You must be logged in';end if;
 if p_customers is null or p_customers<0 or p_customers>80 then raise exception 'Invalid customer count';end if;
 select * into v_run from public.repo_diver_runs where id=p_run_id and user_id=v_user for update;
 if not found then raise exception 'Run not found';end if;
 if v_run.status='claimed' then
   select * into v_character from public.characters where user_id=v_user;
   return jsonb_build_object('duplicate',true,'fishing_xp_awarded',v_run.fishing_xp,'cooking_xp_awarded',v_run.cooking_xp,'gp_awarded',v_run.gp,'fishing_xp',v_character.fishing_xp,'cooking_xp',v_character.cooking_xp,'gp',v_character.gp);
 end if;
 if v_run.status<>'active' then raise exception 'Run is not active';end if;
 v_elapsed:=extract(epoch from(now()-v_run.started_at));
 if v_elapsed<8 or v_elapsed>5400 then raise exception 'Invalid run duration';end if;
 if jsonb_typeof(coalesce(p_catches,'[]'::jsonb))<>'array' or jsonb_typeof(coalesce(p_dishes,'[]'::jsonb))<>'array' then raise exception 'Invalid results';end if;

 insert into public.repo_diver_profiles(user_id) values(v_user) on conflict(user_id) do nothing;
 select * into v_profile from public.repo_diver_profiles where user_id=v_user for update;

 for v_item in select value from jsonb_array_elements(coalesce(p_catches,'[]'::jsonb)) limit 90 loop
   v_id:=v_item->>'id';v_quality:=least(4,greatest(1,coalesce((v_item->>'q')::int,1)));
   select * into v_cat from public.repo_diver_catch_catalog where id=v_id and biome=v_run.biome;
   if not found then continue;end if;
   if v_cat.kind='fish' then
     v_fx:=v_fx+round(v_cat.base_xp*(1+(v_quality-1)*.16));v_count_fish:=v_count_fish+1;
     if v_cat.rarity='mythic' then v_legendary:=v_legendary+1;end if;
     v_fishmap:=jsonb_set(v_fishmap,array[v_id],to_jsonb(coalesce((v_fishmap->>v_id)::int,0)+1),true);
   else
     v_count_treasure:=v_count_treasure+1;v_treasure_gp:=v_treasure_gp+round(v_cat.value_gp*(1+(v_quality-1)*.20));
   end if;
 end loop;
 if v_count_fish+v_count_treasure>greatest(8,floor(v_elapsed/1.1)::int) then raise exception 'Catch rate validation failed';end if;

 for v_item in select value from jsonb_array_elements(coalesce(p_dishes,'[]'::jsonb)) limit greatest(0,least(45,p_customers)) loop
   v_id:=v_item->>'id';v_quality:=least(4,greatest(1,coalesce((v_item->>'quality')::int,1)));
   select * into v_recipe from public.repo_diver_recipe_catalog where id=v_id and unlock_day<=greatest(1,v_profile.day_number);
   if not found then continue;end if;
   if coalesce((v_fishmap->>v_recipe.fish_id)::int,0)<=coalesce((v_usedmap->>v_recipe.fish_id)::int,0) then continue;end if;
   v_usedmap:=jsonb_set(v_usedmap,array[v_recipe.fish_id],to_jsonb(coalesce((v_usedmap->>v_recipe.fish_id)::int,0)+1),true);
   v_factor:=case v_quality when 4 then 1.30 when 3 then 1.12 when 2 then .92 else .72 end;
   v_cx:=v_cx+round(v_recipe.base_xp*v_factor);
   v_service_gross:=v_service_gross+round(v_recipe.base_price*v_factor);
   v_count_dish:=v_count_dish+1;
   if v_quality=4 then v_perfect:=v_perfect+1;end if;
 end loop;

 v_fx:=least(v_fx,6500);v_cx:=least(v_cx,5200);v_service_gross:=least(v_service_gross,15000);v_treasure_gp:=least(v_treasure_gp,5500);
 v_staff_level:=greatest(1,coalesce((v_profile.restaurant->>'staff')::int,1));
 v_staff_wages:=case when v_staff_level>=6 then 94 when v_staff_level=5 then 70 when v_staff_level=4 then 56 when v_staff_level=3 then 40 when v_staff_level=2 then 22 else 0 end;
 v_staff_wages:=least(v_service_gross,v_staff_wages);
 v_gold:=greatest(0,v_service_gross-v_staff_wages)+v_treasure_gp;

 v_journal:=v_profile.fish_journal;
 for v_id,v_quality in select key,(value #>> '{}')::int from jsonb_each(v_fishmap) loop
   select * into v_cat from public.repo_diver_catch_catalog where id=v_id;
   select max(least(v_cat.weight_kg*1.70,greatest(v_cat.weight_kg*0.50,case when (x->>'w') ~ '^[0-9]+([.][0-9]+)?$' then (x->>'w')::numeric else v_cat.weight_kg end)))
     into v_best_weight from jsonb_array_elements(p_catches) x where x->>'id'=v_id;
   v_journal:=jsonb_set(v_journal,array[v_id],jsonb_build_object(
      'count',coalesce((v_journal->v_id->>'count')::int,0)+v_quality,
      'best_q',greatest(coalesce((v_journal->v_id->>'best_q')::int,0),coalesce((select max((x->>'q')::int) from jsonb_array_elements(p_catches) x where x->>'id'=v_id),1)),
      'best_weight',greatest(coalesce((v_journal->v_id->>'best_weight')::numeric,0),coalesce(v_best_weight,v_cat.weight_kg))
   ),true);
 end loop;

 v_rep_gain:=greatest(0,v_count_dish+(v_perfect*2)+(v_legendary*2));
 v_rep_total:=greatest(0,coalesce((v_profile.restaurant->>'reputation_points')::int,0)+v_rep_gain);
 v_rank:=greatest(
   coalesce((v_profile.restaurant->>'rank')::int,1),
   least(10,1+floor((v_profile.day_number+1)/4.0)::int),
   least(10,1+floor(v_rep_total/90.0)::int)
 );
 v_rest:=coalesce(v_profile.restaurant,'{}'::jsonb)
   || jsonb_build_object('rank',v_rank,'reputation_points',v_rep_total,'last_staff_wages',v_staff_wages,'last_service_gross',v_service_gross);

 v_stats:=v_profile.stats||jsonb_build_object(
   'deepest',greatest(coalesce((v_profile.stats->>'deepest')::numeric,0),greatest(0,p_max_depth)),
   'total_fish',coalesce((v_profile.stats->>'total_fish')::int,0)+v_count_fish,
   'total_revenue',coalesce((v_profile.stats->>'total_revenue')::bigint,0)+v_gold,
   'perfect_dishes',coalesce((v_profile.stats->>'perfect_dishes')::int,0)+v_perfect,
   'total_customers',coalesce((v_profile.stats->>'total_customers')::int,0)+v_count_dish,
   'restaurant_reputation',v_rep_total,
   'treasures_found',coalesce((v_profile.stats->>'treasures_found')::int,0)+v_count_treasure,
   'legendary_catches',coalesce((v_profile.stats->>'legendary_catches')::int,0)+v_legendary,
   'days_completed',v_profile.day_number
 );

 select * into v_character from public.characters where user_id=v_user for update;
 if not found then raise exception 'Character not found';end if;
 update public.characters set fishing_xp=fishing_xp+v_fx,cooking_xp=cooking_xp+v_cx,gp=gp+v_gold where user_id=v_user returning * into v_character;
 select coalesce(jsonb_agg(id order by sort_order),'[]'::jsonb) into v_unlocks from public.repo_diver_biome_catalog where unlock_day<=v_profile.day_number+1;
 select coalesce(jsonb_agg(id order by sort_order),'[]'::jsonb) into v_recipes from public.repo_diver_recipe_catalog where unlock_day<=v_profile.day_number+1;
 update public.repo_diver_profiles set day_number=day_number+1,fish_journal=v_journal,stats=v_stats,unlocked_biomes=v_unlocks,recipes=v_recipes,restaurant=v_rest,updated_at=now() where user_id=v_user;
 update public.repo_diver_runs set status='claimed',completed_at=now(),fishing_xp=v_fx,cooking_xp=v_cx,gp=v_gold,
   summary=jsonb_build_object('fish',v_count_fish,'treasures',v_count_treasure,'legendary',v_legendary,'dishes',v_count_dish,'depth',p_max_depth,'customers',p_customers,'service_gross_gp',v_service_gross,'staff_wages',v_staff_wages,'reputation_gained',v_rep_gain)
 where id=p_run_id and user_id=v_user;

 return jsonb_build_object(
   'fishing_xp_awarded',v_fx,'cooking_xp_awarded',v_cx,'gp_awarded',v_gold,
   'service_gross_gp',v_service_gross,'staff_wages',v_staff_wages,'net_service_gp',greatest(0,v_service_gross-v_staff_wages),
   'treasure_gp',v_treasure_gp,'reputation_gained',v_rep_gain,'reputation_total',v_rep_total,'restaurant_rank',v_rank,
   'fishing_xp',v_character.fishing_xp,'cooking_xp',v_character.cooking_xp,'gp',v_character.gp,
   'next_level',least(40,v_profile.day_number+1),'new_biomes',v_unlocks,'new_recipes',v_recipes
 );
end$$;

grant execute on function public.repo_diver_complete_day(uuid,jsonb,jsonb,integer,integer) to authenticated;
