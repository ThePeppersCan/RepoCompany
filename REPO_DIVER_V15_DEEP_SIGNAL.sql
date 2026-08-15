-- REPO DIVER V15 / THE DEEP SIGNAL
-- REFERENCE ONLY. THIS MIGRATION HAS ALREADY BEEN APPLIED TO PRODUCTION SUPABASE.
-- DO NOT RUN THIS FILE DURING FRONTEND DEPLOYMENT.


-- Repo Diver V15 / Phase 10: The Deep Signal campaign
create table if not exists public.repo_diver_campaign_mission_catalog_2026(
 mission_id text primary key, act int not null, mission_order int not null unique, title text not null, subtitle text not null,
 biome text not null, location_id text, stage_count int not null default 5, mission_type text not null default 'site', min_depth int not null default 0,
 recommended_tools text[] not null default '{}'::text[], crew text[] not null default '{}'::text[], description text not null,
 reward_artifact text, briefing jsonb not null default '{}'::jsonb
);
create table if not exists public.repo_diver_campaign_story_artifacts_2026(
 artifact_id text primary key, mission_id text not null references public.repo_diver_campaign_mission_catalog_2026(mission_id) on delete cascade,
 name text not null, clue_text text not null
);
create table if not exists public.repo_diver_campaign_state_2026(
 user_id uuid primary key, current_mission text not null default 'signal_in_shallows', act int not null default 1, stage int not null default 0,
 active_run_id uuid, completed_missions text[] not null default '{}'::text[], story_artifacts text[] not null default '{}'::text[],
 mission_grades jsonb not null default '{}'::jsonb, flags jsonb not null default '{}'::jsonb,
 campaign_completed_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.repo_diver_campaign_checkpoints_2026(
 user_id uuid not null, mission_id text not null, run_id uuid not null, stage int not null, created_at timestamptz not null default now(),
 primary key(user_id,mission_id,run_id,stage)
);
create table if not exists public.repo_diver_campaign_firsts_2026(
 achievement text primary key, user_id uuid not null, username text not null, achieved_at timestamptz not null default now(), detail jsonb not null default '{}'::jsonb
);
alter table public.repo_diver_campaign_mission_catalog_2026 enable row level security;
alter table public.repo_diver_campaign_story_artifacts_2026 enable row level security;
alter table public.repo_diver_campaign_state_2026 enable row level security;
alter table public.repo_diver_campaign_checkpoints_2026 enable row level security;
alter table public.repo_diver_campaign_firsts_2026 enable row level security;
revoke all on public.repo_diver_campaign_mission_catalog_2026,public.repo_diver_campaign_story_artifacts_2026,public.repo_diver_campaign_state_2026,public.repo_diver_campaign_checkpoints_2026,public.repo_diver_campaign_firsts_2026 from anon,authenticated;

insert into public.repo_diver_campaign_mission_catalog_2026(mission_id,act,mission_order,title,subtitle,biome,location_id,stage_count,mission_type,min_depth,recommended_tools,crew,description,reward_artifact,briefing) values
('signal_in_shallows',1,1,'THE SIGNAL IN THE SHALLOWS','Something Below','karamja','coral_lantern_wreck',5,'site',0,ARRAY['scanner','cutter']::text[],ARRAY['darro','lyra']::text[],'A damaged buoy is repeating a pulse that should not exist this close to shore.',null,'{"objective": "A damaged buoy is repeating a pulse that should not exist this close to shore.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('buoy_in_grotto',1,2,'THE BUOY THAT CAME BACK','Something Below','karamja','sunscale_grotto',5,'site',0,ARRAY['dive_line','scanner']::text[],ARRAY['lyra','orin']::text[],'Lyra traces the pulse into a limestone cavity beneath the shelf.',null,'{"objective": "Lyra traces the pulse into a limestone cavity beneath the shelf.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('roots_remember',1,3,'ROOTS REMEMBER','Something Below','kelp','drowned_windmill',5,'site',0,ARRAY['archaeology','repair']::text[],ARRAY['ivar','lyra']::text[],'A matching symbol appears on drowned masonry tangled beneath the kelp.',null,'{"objective": "A matching symbol appears on drowned masonry tangled beneath the kelp.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('prism_frequency',1,4,'THE PRISM FREQUENCY','Something Below','coral','prism_archive',5,'site',0,ARRAY['archaeology','scanner']::text[],ARRAY['lyra','ivar']::text[],'Crystal records in the Prism Archive resonate with the same impossible frequency.','prism_frequency_plate','{"objective": "Crystal records in the Prism Archive resonate with the same impossible frequency.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('crown_echo',1,5,'ECHO IN THE CROWN','Something Below','shipgrave','crown_of_varn',5,'site',0,ARRAY['cutter','scanner','lift_bag']::text[],ARRAY['ren','cass']::text[],'The royal wreck carries a navigation disk marked with the same symbol.','varn_navigation_disk','{"objective": "The royal wreck carries a navigation disk marked with the same symbol.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('lost_manifest',2,6,'THE LOST MANIFEST','The Lost Expedition','shipgrave','broken_admiral',5,'site',0,ARRAY['cutter','repair','scanner']::text[],ARRAY['sella','cass']::text[],'A recent expedition used the Broken Admiral as its last logged waypoint.',null,'{"objective": "A recent expedition used the Broken Admiral as its last logged waypoint.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('relay_nine',2,7,'RELAY NINE','The Lost Expedition','abyssal','hadal_relay_nine',5,'site',0,ARRAY['repair','scanner','dive_line']::text[],ARRAY['orin','lyra']::text[],'The relay stopped transmitting after receiving a signal from below its own rated depth.',null,'{"objective": "The relay stopped transmitting after receiving a signal from below its own rated depth.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('scar_line',2,8,'THE CUT LINE','The Lost Expedition','abyssal','scar_mouth_caverns',5,'site',0,ARRAY['dive_line','cutter','scanner']::text[],ARRAY['darro','cass']::text[],'A severed guide line disappears into the Scar Mouth caverns.',null,'{"objective": "A severed guide line disappears into the Scar Mouth caverns.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('glass_witness',2,9,'THE GLASS WITNESS','The Lost Expedition','crystal','glass_observatory',5,'site',0,ARRAY['repair','scanner','archaeology']::text[],ARRAY['lyra','orin']::text[],'The Glass Observatory may still contain the expedition''s final sensor archive.','erebos_sensor_fragment','{"objective": "The Glass Observatory may still contain the expedition''s final sensor archive.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('lattice_rescue',2,10,'SIGNAL UNDER GLASS','The Lost Expedition','crystal','lattice_vault',5,'site',0,ARRAY['archaeology','scanner','lift_bag']::text[],ARRAY['darro','lyra']::text[],'A rescue beacon is trapped behind the Lattice Vault mechanism.',null,'{"objective": "A rescue beacon is trapped behind the Lattice Vault mechanism.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('choir_below',3,11,'THE CHOIR BELOW','The Old World','cathedral','choir_vault',5,'site',0,ARRAY['archaeology','repair','scanner']::text[],ARRAY['ivar','lyra']::text[],'The Choir Vault contains the oldest known representation of the repeating signal.','choir_tide_tablet','{"objective": "The Choir Vault contains the oldest known representation of the repeating signal.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('bell_beneath',3,12,'THE BELL BENEATH','The Old World','cathedral','bell_tower_crypt',5,'site',0,ARRAY['archaeology','dive_line','lift_bag']::text[],ARRAY['ivar','darro']::text[],'A crypt inscription describes a bell that was never meant to be rung.',null,'{"objective": "A crypt inscription describes a bell that was never meant to be rung.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('silence_at_erebos',3,13,'SILENCE AT EREBOS','The Old World','midnight','station_erebos',7,'erebos',0,ARRAY['repair','scanner','dive_line']::text[],ARRAY['lyra','orin','darro']::text[],'Station Erebos is dark, flooded and somehow still drawing power.','erebos_blackbox','{"objective": "Station Erebos is dark, flooded and somehow still drawing power.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('black_choir',3,14,'THE BLACK CHOIR','The Old World','midnight','black_choir_shaft',5,'site',0,ARRAY['dive_line','scanner','archaeology']::text[],ARRAY['ivar','cass']::text[],'Impossible sonar harmonics descend through a vertical shaft beyond Erebos.',null,'{"objective": "Impossible sonar harmonics descend through a vertical shaft beyond Erebos.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('palace_key',3,15,'THE PALACE KEY','The Old World','citadel','palace_of_tides',5,'site',0,ARRAY['archaeology','scanner','repair']::text[],ARRAY['ivar','lyra']::text[],'The Palace of Tides appears to contain a mechanism built to answer the signal.','palace_resonance_key','{"objective": "The Palace of Tides appears to contain a mechanism built to answer the signal.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('imperial_memory',4,16,'IMPERIAL MEMORY','Beneath Midnight','citadel','imperial_archive',5,'site',0,ARRAY['archaeology','scanner','lift_bag']::text[],ARRAY['ivar','sella']::text[],'The Imperial Archive records earlier expeditions below the charted sea.','imperial_depth_chart','{"objective": "The Imperial Archive records earlier expeditions below the charted sea.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('wayfarer_last',4,17,'THE WAYFARER''S LAST COURSE','Beneath Midnight','crossing','wayfarer_submersible',5,'site',0,ARRAY['cutter','repair','scanner']::text[],ARRAY['cass','orin']::text[],'The Wayfarer followed the same route decades ago and never returned to harbour.',null,'{"objective": "The Wayfarer followed the same route decades ago and never returned to harbour.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('icebound_transmission',4,18,'BENEATH THE ICEBOUND FLEET','Beneath Midnight','pale','icebound_fleet',5,'site',0,ARRAY['cutter','dive_line','scanner']::text[],ARRAY['darro','lyra']::text[],'A frozen receiver has preserved one final transmission from below the charts.',null,'{"objective": "A frozen receiver has preserved one final transmission from below the charts.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('cinder_answer',4,19,'CINDER ANSWER','Beneath Midnight','blackrift','cinder_station',5,'site',0,ARRAY['repair','scanner','cutter']::text[],ARRAY['orin','lyra']::text[],'Cinder Station recorded the signal changing immediately before the rift opened.','cinder_phase_core','{"objective": "Cinder Station recorded the signal changing immediately before the rift opened.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('forge_warning',4,20,'THE FORGE WARNING','Beneath Midnight','blackrift','forge_below',5,'site',0,ARRAY['archaeology','scanner','lift_bag']::text[],ARRAY['ivar','cass']::text[],'A pre-imperial warning identifies the signal as a boundary, not a beacon.','forge_warning_seal','{"objective": "A pre-imperial warning identifies the signal as a boundary, not a beacon.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('horizon_lock',5,21,'THE HORIZON LOCK','The Deep Signal','endless','horizon_array',5,'site',0,ARRAY['repair','scanner','archaeology']::text[],ARRAY['lyra','orin','sella']::text[],'The Horizon Array can triangulate the source if its drowned sensors are restored.',null,'{"objective": "The Horizon Array can triangulate the source if its drowned sensors are restored.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('drift_cathedral',5,22,'THE DRIFT CATHEDRAL','The Deep Signal','endless','drift_cathedral',5,'site',0,ARRAY['archaeology','dive_line','scanner']::text[],ARRAY['ivar','darro','cass']::text[],'A colossal drifting ruin marks the last known structure before the chart ends.','drift_cathedral_star_map','{"objective": "A colossal drifting ruin marks the last known structure before the chart ends.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('whiteglass_atlas',5,23,'THE WHITEGLASS ATLAS','The Deep Signal','pale','whiteglass_shrine',5,'site',0,ARRAY['archaeology','scanner','lift_bag']::text[],ARRAY['lyra','ivar']::text[],'The final map fragment is frozen beneath a shrine older than the Imperial Archive.','whiteglass_atlas','{"objective": "The final map fragment is frozen beneath a shrine older than the Imperial Archive.", "depth": null, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('below_charted_depths',5,24,'BELOW THE CHARTED DEPTHS','The Deep Signal','endless',null,4,'depth',420,ARRAY['dive_line','scanner','repair']::text[],ARRAY['darro','lyra','orin','cass']::text[],'The Tideline leaves mapped water. There is no known seafloor on the chart.',null,'{"objective": "The Tideline leaves mapped water. There is no known seafloor on the chart.", "depth": 420, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb),
('the_deep_signal',5,25,'THE DEEP SIGNAL','The Deep Signal','endless',null,6,'finale',520,ARRAY['scanner','repair','archaeology']::text[],ARRAY['darro','lyra','orin','cass','ivar']::text[],'Follow the source, understand what the old world tried to contain, and return alive.','signal_core_fragment','{"objective": "Follow the source, understand what the old world tried to contain, and return alive.", "depth": 520, "known_hazards": "Campaign conditions adapt to the destination.", "optional": "Recover artifacts, document wildlife and avoid emergency rescue."}'::jsonb)
on conflict(mission_id) do update set act=excluded.act,mission_order=excluded.mission_order,title=excluded.title,subtitle=excluded.subtitle,biome=excluded.biome,location_id=excluded.location_id,stage_count=excluded.stage_count,mission_type=excluded.mission_type,min_depth=excluded.min_depth,recommended_tools=excluded.recommended_tools,crew=excluded.crew,description=excluded.description,reward_artifact=excluded.reward_artifact,briefing=excluded.briefing;
insert into public.repo_diver_campaign_story_artifacts_2026(artifact_id,mission_id,name,clue_text) values
('prism_frequency_plate','prism_frequency','PRISM FREQUENCY PLATE','A crystal record whose etched bands match the modern sonar pulse.'),
('varn_navigation_disk','crown_echo','VARN NAVIGATION DISK','A royal navigation instrument with a route ending beyond mapped water.'),
('erebos_sensor_fragment','glass_witness','EREBOS SENSOR FRAGMENT','A hardened sensor wafer marked EREBOS / LOWER ARRAY.'),
('choir_tide_tablet','choir_below','CHOIR TIDE TABLET','A carved warning describing a song beneath the sea that is not meant for human ears.'),
('erebos_blackbox','silence_at_erebos','EREBOS BLACKBOX','The final intact station archive. Several minutes of the recording are missing.'),
('palace_resonance_key','palace_key','PALACE RESONANCE KEY','A bronze mechanism tuned to the same interval as the Deep Signal.'),
('imperial_depth_chart','imperial_memory','IMPERIAL DEPTH CHART','A chart that continues hundreds of metres beyond every modern survey.'),
('cinder_phase_core','cinder_answer','CINDER PHASE CORE','A thermal sensor core showing the signal change before the rift event.'),
('forge_warning_seal','forge_warning','FORGE WARNING SEAL','A pre-imperial seal translated as: THE BOUNDARY MUST REMAIN QUIET.'),
('drift_cathedral_star_map','drift_cathedral','DRIFT CATHEDRAL STAR MAP','A ceiling map whose points align only when treated as depths rather than stars.'),
('whiteglass_atlas','whiteglass_atlas','WHITEGLASS ATLAS','A frozen plate revealing a descending route beyond the Horizon Array.'),
('signal_core_fragment','the_deep_signal','SIGNAL CORE FRAGMENT','A harmless fragment recovered from the source. It still vibrates when no equipment is powered.')
on conflict(artifact_id) do update set mission_id=excluded.mission_id,name=excluded.name,clue_text=excluded.clue_text;

create or replace function public.repo_diver_get_campaign_state() returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare u uuid:=auth.uid(); s public.repo_diver_campaign_state_2026%rowtype; d int; missions jsonb; arts jsonb; firsts jsonb;
begin
 if u is null then raise exception 'You must be logged in'; end if;
 select day_number into d from public.repo_diver_profiles where user_id=u;
 if coalesce(d,1)>=12 then insert into public.repo_diver_campaign_state_2026(user_id) values(u) on conflict(user_id) do nothing; end if;
 select * into s from public.repo_diver_campaign_state_2026 where user_id=u;
 select coalesce(jsonb_agg(jsonb_build_object('id',m.mission_id,'act',m.act,'order',m.mission_order,'title',m.title,'subtitle',m.subtitle,'biome',m.biome,'location_id',m.location_id,'stage_count',m.stage_count,'type',m.mission_type,'min_depth',m.min_depth,'recommended_tools',m.recommended_tools,'crew',m.crew,'description',m.description,'reward_artifact',m.reward_artifact,'briefing',m.briefing,'status',case when s.user_id is null then 'locked' when m.mission_id=any(s.completed_missions) then 'complete' when m.mission_id=s.current_mission then 'active' else 'locked' end) order by m.mission_order),'[]'::jsonb) into missions from public.repo_diver_campaign_mission_catalog_2026 m;
 select coalesce(jsonb_agg(jsonb_build_object('artifact_id',a.artifact_id,'mission_id',a.mission_id,'name',a.name,'clue_text',a.clue_text,'recovered',s.user_id is not null and a.artifact_id=any(s.story_artifacts)) order by m.mission_order),'[]'::jsonb) into arts from public.repo_diver_campaign_story_artifacts_2026 a join public.repo_diver_campaign_mission_catalog_2026 m on m.mission_id=a.mission_id;
 select coalesce(jsonb_agg(jsonb_build_object('achievement',f.achievement,'username',f.username,'achieved_at',f.achieved_at,'detail',f.detail)),'[]'::jsonb) into firsts from public.repo_diver_campaign_firsts_2026 f;
 return jsonb_build_object('available',coalesce(d,1)>=12,'current_mission',s.current_mission,'act',coalesce(s.act,1),'stage',coalesce(s.stage,0),'active_run_id',s.active_run_id,'completed_missions',coalesce(s.completed_missions,'{}'::text[]),'story_artifacts',coalesce(s.story_artifacts,'{}'::text[]),'mission_grades',coalesce(s.mission_grades,'{}'::jsonb),'flags',coalesce(s.flags,'{}'::jsonb),'campaign_completed_at',s.campaign_completed_at,'missions',missions,'artifacts',arts,'firsts',firsts);
end $$;

create or replace function public.repo_diver_begin_campaign_mission(p_run_id uuid,p_mission_id text) returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare u uuid:=auth.uid(); r public.repo_diver_runs%rowtype; m public.repo_diver_campaign_mission_catalog_2026%rowtype; s public.repo_diver_campaign_state_2026%rowtype; d int; replay boolean:=false;
begin
 if u is null then raise exception 'You must be logged in';end if;
 select day_number into d from public.repo_diver_profiles where user_id=u;if coalesce(d,1)<12 then raise exception 'The Deep Signal campaign unlocks at Diver Day 12';end if;
 select * into r from public.repo_diver_runs where id=p_run_id and user_id=u and status='active' for update;if not found then raise exception 'Active expedition required';end if;
 select * into m from public.repo_diver_campaign_mission_catalog_2026 where mission_id=p_mission_id;if not found then raise exception 'Campaign mission not found';end if;if r.biome<>m.biome then raise exception 'This mission must launch in its assigned region';end if;
 insert into public.repo_diver_campaign_state_2026(user_id) values(u) on conflict(user_id) do nothing;select * into s from public.repo_diver_campaign_state_2026 where user_id=u for update;
 replay:=p_mission_id=any(s.completed_missions);
 if not replay and s.current_mission<>p_mission_id then raise exception 'That campaign mission is not active';end if;
 if not replay then update public.repo_diver_campaign_state_2026 set active_run_id=p_run_id,updated_at=now() where user_id=u returning * into s;end if;
 return jsonb_build_object('mission_id',m.mission_id,'stage',case when replay then 0 else s.stage end,'stage_count',m.stage_count,'replay',replay,'type',m.mission_type,'location_id',m.location_id,'title',m.title,'subtitle',m.subtitle,'crew',m.crew,'recommended_tools',m.recommended_tools);
end $$;

create or replace function public.repo_diver_campaign_checkpoint(p_run_id uuid,p_mission_id text,p_expected_stage int) returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare u uuid:=auth.uid(); r public.repo_diver_runs%rowtype; m public.repo_diver_campaign_mission_catalog_2026%rowtype; s public.repo_diver_campaign_state_2026%rowtype; lp public.repo_diver_location_progress_2026%rowtype; nextm public.repo_diver_campaign_mission_catalog_2026%rowtype; uname text; done boolean:=false; req int:=0; newarts text[];
begin
 if u is null then raise exception 'You must be logged in';end if;
 select * into r from public.repo_diver_runs where id=p_run_id and user_id=u and status='active' for update;if not found then raise exception 'Active campaign expedition required';end if;
 select * into m from public.repo_diver_campaign_mission_catalog_2026 where mission_id=p_mission_id;if not found then raise exception 'Campaign mission not found';end if;if r.biome<>m.biome then raise exception 'Campaign region mismatch';end if;
 select * into s from public.repo_diver_campaign_state_2026 where user_id=u for update;if not found then raise exception 'Campaign state not found';end if;if s.current_mission<>p_mission_id or s.active_run_id<>p_run_id then raise exception 'This run is not the active campaign expedition';end if;
 if p_expected_stage<=s.stage then return jsonb_build_object('stage',s.stage,'duplicate',true,'completed',false);end if;if p_expected_stage<>s.stage+1 or p_expected_stage>m.stage_count then raise exception 'Campaign checkpoints must be completed in order';end if;
 if m.location_id is not null then
   select * into lp from public.repo_diver_location_progress_2026 where user_id=u and location_id=m.location_id;
   if not found then raise exception 'Discover the mission location first';end if;
   if p_expected_stage=m.stage_count then if lp.completed_at is null then raise exception 'Complete the primary route before advancing the mission';end if;
   else req:=greatest(0,least(5,p_expected_stage-1));if lp.stage<req then raise exception 'The campaign objective has not been reached in this location';end if;end if;
 else
   if extract(epoch from(now()-r.started_at)) < p_expected_stage*8 then raise exception 'The expedition has not progressed far enough for this checkpoint';end if;
 end if;
 insert into public.repo_diver_campaign_checkpoints_2026(user_id,mission_id,run_id,stage) values(u,p_mission_id,p_run_id,p_expected_stage) on conflict do nothing;
 if m.mission_type in('depth','finale') then update public.repo_diver_campaign_state_2026 set stage=p_expected_stage,updated_at=now() where user_id=u;return jsonb_build_object('stage',p_expected_stage,'completed',false,'awaiting_surface',p_expected_stage=m.stage_count);end if;
 done:=p_expected_stage>=m.stage_count;
 if done then
   newarts:=s.story_artifacts;if m.reward_artifact is not null and not (m.reward_artifact=any(newarts)) then newarts:=array_append(newarts,m.reward_artifact);end if;
   select * into nextm from public.repo_diver_campaign_mission_catalog_2026 where mission_order=m.mission_order+1;
   update public.repo_diver_campaign_state_2026 set completed_missions=case when m.mission_id=any(completed_missions) then completed_missions else array_append(completed_missions,m.mission_id) end,story_artifacts=newarts,current_mission=coalesce(nextm.mission_id,m.mission_id),act=coalesce(nextm.act,m.act),stage=0,active_run_id=null,flags=flags||jsonb_build_object('last_completed',m.mission_id),updated_at=now() where user_id=u;
   if m.mission_id='silence_at_erebos' then select username into uname from public.characters where user_id=u limit 1;insert into public.repo_diver_campaign_firsts_2026(achievement,user_id,username,detail) values('erebos_archive',u,coalesce(uname,'Diver'),jsonb_build_object('mission',m.title)) on conflict(achievement) do nothing;end if;
 end if;
 return jsonb_build_object('stage',p_expected_stage,'completed',done,'next_mission',nextm.mission_id,'reward_artifact',case when done then m.reward_artifact else null end);
end $$;

create or replace function public.repo_diver_finalize_campaign_run(p_run_id uuid) returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare u uuid:=auth.uid(); r public.repo_diver_runs%rowtype; s public.repo_diver_campaign_state_2026%rowtype; m public.repo_diver_campaign_mission_catalog_2026%rowtype; nextm public.repo_diver_campaign_mission_catalog_2026%rowtype; depth int; grade text:='B'; uname text; newarts text[]; completed boolean:=false;
begin
 if u is null then raise exception 'You must be logged in';end if;select * into r from public.repo_diver_runs where id=p_run_id and user_id=u and status='claimed';if not found then raise exception 'Claimed expedition required';end if;
 select * into s from public.repo_diver_campaign_state_2026 where user_id=u for update;if not found or s.active_run_id<>p_run_id then return jsonb_build_object('saved',false,'reason','not_campaign_run');end if;
 select * into m from public.repo_diver_campaign_mission_catalog_2026 where mission_id=s.current_mission;if not found or m.mission_type not in('depth','finale') then return jsonb_build_object('saved',false,'reason','not_surface_mission');end if;
 if s.stage<m.stage_count then raise exception 'Complete all mission checkpoints before surfacing';end if;depth:=coalesce((r.summary->>'depth')::int,0);if depth<m.min_depth then raise exception 'Required mission depth was not reached';end if;
 grade:=case when depth>=m.min_depth+80 then 'S' when depth>=m.min_depth+30 then 'A' else 'B' end;
 newarts:=s.story_artifacts;if m.reward_artifact is not null and not (m.reward_artifact=any(newarts)) then newarts:=array_append(newarts,m.reward_artifact);end if;
 select * into nextm from public.repo_diver_campaign_mission_catalog_2026 where mission_order=m.mission_order+1;
 completed:=m.mission_type='finale';
 update public.repo_diver_campaign_state_2026 set completed_missions=case when m.mission_id=any(completed_missions) then completed_missions else array_append(completed_missions,m.mission_id) end,story_artifacts=newarts,mission_grades=jsonb_set(mission_grades,array[m.mission_id],to_jsonb(grade),true),current_mission=coalesce(nextm.mission_id,m.mission_id),act=coalesce(nextm.act,m.act),stage=0,active_run_id=null,campaign_completed_at=case when completed then coalesce(campaign_completed_at,now()) else campaign_completed_at end,flags=flags||jsonb_build_object('last_completed',m.mission_id,'postgame',completed),updated_at=now() where user_id=u;
 if completed then
   update public.repo_diver_career_2026 set titles=case when 'Below The Charts'=any(titles) then titles else array_append(titles,'Below The Charts') end,endgame=jsonb_set(coalesce(endgame,'{}'::jsonb),'{deep_signal_trophy}','true'::jsonb,true),updated_at=now() where user_id=u;
   select username into uname from public.characters where user_id=u limit 1;insert into public.repo_diver_campaign_firsts_2026(achievement,user_id,username,detail) values('campaign_complete',u,coalesce(uname,'Diver'),jsonb_build_object('mission',m.title,'grade',grade,'depth',depth)) on conflict(achievement) do nothing;
 end if;
 return jsonb_build_object('saved',true,'mission_id',m.mission_id,'completed',true,'campaign_complete',completed,'grade',grade,'next_mission',nextm.mission_id,'reward_artifact',m.reward_artifact,'title_unlocked',case when completed then 'Below The Charts' else null end);
end $$;

create or replace function public.repo_diver_get_campaign_legacy() returns jsonb language plpgsql security definer set search_path='public','auth' as $$
begin if auth.uid() is null then raise exception 'You must be logged in';end if;return coalesce((select jsonb_agg(jsonb_build_object('achievement',achievement,'username',username,'achieved_at',achieved_at,'detail',detail) order by achieved_at) from public.repo_diver_campaign_firsts_2026),'[]'::jsonb);end $$;

grant execute on function public.repo_diver_get_campaign_state() to authenticated;
grant execute on function public.repo_diver_begin_campaign_mission(uuid,text) to authenticated;
grant execute on function public.repo_diver_campaign_checkpoint(uuid,text,int) to authenticated;
grant execute on function public.repo_diver_finalize_campaign_run(uuid) to authenticated;
grant execute on function public.repo_diver_get_campaign_legacy() to authenticated;
