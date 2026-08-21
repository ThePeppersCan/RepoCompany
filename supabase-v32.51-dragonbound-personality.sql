-- V32.51 Dragonbound: permanent individual personality + behaviour memory

alter table public.dragonbound_profiles
  add column if not exists personality jsonb,
  add column if not exists dragon_traits jsonb not null default '{"assigned":[],"discovered":[],"observations":{}}'::jsonb,
  add column if not exists dragon_preferences jsonb not null default '{}'::jsonb,
  add column if not exists dragon_memory jsonb not null default '{"recentActions":[],"activityCounts":{},"floorVisits":{},"sleepLocations":{},"observationCounters":{}}'::jsonb,
  add column if not exists personality_version integer not null default 1,
  add column if not exists personality_generated_at timestamptz;

create or replace function public.dragonbound_clamp_stat(p_value integer)
returns integer
language sql
immutable
as $$
  select greatest(0, least(100, coalesce(p_value, 50)));
$$;

create or replace function public.dragonbound_roll_stat()
returns integer
language plpgsql
volatile
as $$
declare
  r double precision := random();
begin
  -- Deliberately favour strong highs/lows so dragons do not all cluster near 50.
  if r < 0.30 then
    return floor(random() * 31)::integer;       -- 0..30
  elsif r < 0.60 then
    return 70 + floor(random() * 31)::integer;  -- 70..100
  else
    return 25 + floor(random() * 51)::integer;  -- 25..75
  end if;
end;
$$;

create or replace function public.dragonbound_generate_personality(p_breed_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_breed text := lower(coalesce(p_breed_id,''));
  energy integer; curiosity integer; affection integer; independence integer;
  bravery integer; playfulness integer; mischief integer; stubbornness integer;
  sociability integer; appetite integer; sleepiness integer; intelligence integer;
  v_extremes integer := 0;
  v_tries integer := 0;
  v_candidates text[] := array[]::text[];
  v_quirks text[] := array[]::text[];
  v_count integer := 2 + floor(random()*3)::integer;
  v_archetype text := 'Curious Companion';
  v_preferred_floor text;
begin
  loop
    v_tries := v_tries + 1;
    energy := public.dragonbound_roll_stat();
    curiosity := public.dragonbound_roll_stat();
    affection := public.dragonbound_roll_stat();
    independence := public.dragonbound_roll_stat();
    bravery := public.dragonbound_roll_stat();
    playfulness := public.dragonbound_roll_stat();
    mischief := public.dragonbound_roll_stat();
    stubbornness := public.dragonbound_roll_stat();
    sociability := public.dragonbound_roll_stat();
    appetite := public.dragonbound_roll_stat();
    sleepiness := public.dragonbound_roll_stat();
    intelligence := public.dragonbound_roll_stat();

    -- Soft correlations. These make combinations believable without turning them into classes.
    sleepiness := public.dragonbound_clamp_stat(sleepiness + round((50-energy)*0.22)::integer);
    mischief := public.dragonbound_clamp_stat(mischief + round((curiosity-50)*0.12 + (playfulness-50)*0.12)::integer);
    affection := public.dragonbound_clamp_stat(affection + round((sociability-50)*0.08)::integer);
    independence := public.dragonbound_clamp_stat(independence - round((affection-50)*0.10)::integer);
    intelligence := public.dragonbound_clamp_stat(intelligence + round((curiosity-50)*0.06)::integer);

    -- Breed only nudges the individual personality. It never defines it.
    case
      when v_breed in ('vardesh','norveth','blackglass-coast','skallheim','hestholm-fjord','nyrgate-aurora') then
        bravery := public.dragonbound_clamp_stat(bravery+8); independence := public.dragonbound_clamp_stat(independence+5);
      when v_breed in ('lumerre','elvane','aurelia','orsanne','ossa-mere') then
        curiosity := public.dragonbound_clamp_stat(curiosity+7); affection := public.dragonbound_clamp_stat(affection+5);
      when v_breed in ('nambara','zafran','qasmir','zafir-row') then
        appetite := public.dragonbound_clamp_stat(appetite+7); sleepiness := public.dragonbound_clamp_stat(sleepiness+5); energy := public.dragonbound_clamp_stat(energy-4);
      when v_breed in ('kordesh','grand-khor','rovarn','rova-end') then
        energy := public.dragonbound_clamp_stat(energy+8); bravery := public.dragonbound_clamp_stat(bravery+5);
      when v_breed in ('drazhen','warmvein-krellhaven','iskandar') then
        playfulness := public.dragonbound_clamp_stat(playfulness+6); bravery := public.dragonbound_clamp_stat(bravery+5);
      when v_breed in ('marovar','belros','sorevia','ashwick-cinderbank') then
        sociability := public.dragonbound_clamp_stat(sociability+6); affection := public.dragonbound_clamp_stat(affection+4);
      when v_breed in ('calvora','saint-ciro','marenza','talune') then
        playfulness := public.dragonbound_clamp_stat(playfulness+5); curiosity := public.dragonbound_clamp_stat(curiosity+4);
      else null;
    end case;

    select count(*) into v_extremes
    from unnest(array[energy,curiosity,affection,independence,bravery,playfulness,mischief,stubbornness,sociability,appetite,sleepiness,intelligence]) s(v)
    where v <= 25 or v >= 75;

    exit when v_extremes >= 3 or v_tries >= 7;
  end loop;

  -- Trait candidate pool. Opposing traits use mutually-exclusive thresholds.
  if sleepiness >= 72 and energy <= 58 then v_candidates := array_append(v_candidates,'Professional Napper'); end if;
  if energy >= 78 and playfulness >= 68 then v_candidates := array_append(v_candidates,'Zoomies'); end if;
  if bravery <= 26 then v_candidates := array_append(v_candidates,'Coward'); end if;
  if bravery >= 78 then v_candidates := array_append(v_candidates,'Fearless'); end if;
  if mischief >= 74 and curiosity >= 62 then v_candidates := array_append(v_candidates,'Tiny Menace'); end if;
  if affection >= 78 and independence <= 42 then v_candidates := array_append(v_candidates,'Velcro Baby'); end if;
  if curiosity >= 76 then v_candidates := array_append(v_candidates,'Explorer'); end if;
  if independence >= 78 then v_candidates := array_append(v_candidates,'Independent Spirit'); end if;
  if sociability <= 28 then v_candidates := array_append(v_candidates,'Introvert'); end if;
  if sociability >= 76 then v_candidates := array_append(v_candidates,'Social Butterfly'); end if;
  if stubbornness >= 76 then v_candidates := array_append(v_candidates,'Creature of Habit'); end if;
  if bravery >= 70 and playfulness >= 64 and energy >= 60 then v_candidates := array_append(v_candidates,'Little Pilot'); end if;
  if bravery <= 34 and energy <= 52 then v_candidates := array_append(v_candidates,'Grounded'); end if;
  if appetite >= 78 then v_candidates := array_append(v_candidates,'Food Goblin'); end if;
  if intelligence >= 72 and curiosity >= 55 then v_candidates := array_append(v_candidates,'Watcher'); end if;
  if mischief <= 24 and affection >= 58 then v_candidates := array_append(v_candidates,'Gentle Soul'); end if;
  if energy <= 28 and sleepiness >= 62 then v_candidates := array_append(v_candidates,'Couch Potato'); end if;
  if curiosity >= 66 then v_candidates := array_append(v_candidates,'Furniture Inspector'); end if;
  if playfulness >= 75 then v_candidates := array_append(v_candidates,'Toy Obsessed'); end if;
  if stubbornness >= 68 then v_candidates := array_append(v_candidates,'Routine Lover'); end if;
  if energy >= 72 then v_candidates := array_append(v_candidates,'Restless'); end if;
  if affection >= 68 then v_candidates := array_append(v_candidates,'Attention Seeker'); end if;
  if sleepiness <= 25 and energy >= 62 then v_candidates := array_append(v_candidates,'Night Owl'); end if;

  -- Always ensure there are enough meaningful candidates.
  if array_length(v_candidates,1) is null or array_length(v_candidates,1) < 4 then
    v_candidates := v_candidates || array[
      case when curiosity >= 50 then 'Adventurous' else 'Watcher' end,
      case when independence >= 50 then 'Independent Spirit' else 'Attention Seeker' end,
      case when stubbornness >= 50 then 'Routine Lover' else 'Patient' end,
      case when playfulness >= 50 then 'Toy Obsessed' else 'Gentle Soul' end,
      case when energy >= 50 then 'Restless' else 'Deep Sleeper' end
    ];
  end if;

  select coalesce(array_agg(q), array[]::text[]) into v_quirks
  from (
    select q
    from (
      select distinct q
      from unnest(v_candidates) q
      where not (q='Grounded' and 'Little Pilot'=any(v_candidates))
    ) distinct_candidates
    order by random()
    limit v_count
  ) picked;

  if mischief >= 76 and curiosity >= 70 then v_archetype := 'Mischievous Explorer';
  elsif sleepiness >= 76 and affection >= 65 then v_archetype := 'Sleepy Sweetheart';
  elsif bravery >= 78 and energy >= 65 then v_archetype := 'Fearless Adventurer';
  elsif independence >= 76 and intelligence >= 60 then v_archetype := 'Independent Watcher';
  elsif affection >= 72 and mischief <= 35 then v_archetype := 'Gentle Homebody';
  elsif energy >= 82 and playfulness >= 76 then v_archetype := 'Chaotic Spark';
  elsif curiosity >= 72 and intelligence >= 68 then v_archetype := 'Curious Observer';
  end if;

  v_preferred_floor := case
    when 'Upstairs Dweller'=any(v_quirks) then 'upstairs'
    when 'Downstairs Dweller'=any(v_quirks) then 'downstairs'
    when random() < (0.42 + greatest(-0.14,least(0.14,(independence-50)/250.0))) then 'upstairs'
    else 'downstairs'
  end;

  return jsonb_build_object(
    'version',1,
    'coreStats',jsonb_build_object(
      'energy',energy,'curiosity',curiosity,'affection',affection,'independence',independence,
      'bravery',bravery,'playfulness',playfulness,'mischief',mischief,'stubbornness',stubbornness,
      'sociability',sociability,'appetite',appetite,'sleepiness',sleepiness,'intelligence',intelligence
    ),
    'quirks',to_jsonb(v_quirks),
    'archetype',v_archetype,
    'preferencesSeed',jsonb_build_object('preferredFloor',v_preferred_floor),
    'generatedAt',to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
end;
$$;

create or replace function public.dragonbound_ensure_personality(p_uid uuid, p_breed_id text, p_force boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_personality jsonb;
  v_quirks jsonb;
  v_floor text;
begin
  if p_uid is null or coalesce(p_breed_id,'')='' then return; end if;

  if not p_force and exists(
    select 1 from public.dragonbound_profiles
    where user_id=p_uid and personality is not null
  ) then return; end if;

  v_personality := public.dragonbound_generate_personality(p_breed_id);
  v_quirks := coalesce(v_personality->'quirks','[]'::jsonb);
  v_floor := coalesce(v_personality#>>'{preferencesSeed,preferredFloor}','downstairs');

  update public.dragonbound_profiles
  set personality=v_personality,
      dragon_traits=jsonb_build_object('assigned',v_quirks,'discovered','[]'::jsonb,'observations','{}'::jsonb),
      dragon_preferences=jsonb_build_object('preferredFloor',v_floor,'formed','{}'::jsonb),
      dragon_memory=jsonb_build_object(
        'recentActions','[]'::jsonb,
        'activityCounts',jsonb_build_object('idle',0,'look',0,'walk',0,'sit',0,'rest',0,'sleep',0,'stairs',0,'flight',0,'explore',0),
        'floorVisits',jsonb_build_object('downstairs',0,'upstairs',0),
        'sleepLocations','{}'::jsonb,
        'observationCounters',jsonb_build_object('stairsUsed',0,'flightsTaken',0,'sleepSessions',0,'sameSleepSpotVisits',0,'newLocationsVisited',0,'longIdleSessions',0,'zoomiesTriggered',0,'keeperSeekingEvents',0),
        'lastSavedAt',to_char(clock_timestamp() at time zone 'utc','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      ),
      personality_version=1,
      personality_generated_at=clock_timestamp(),
      updated_at=clock_timestamp()
  where user_id=p_uid;
end;
$$;

-- Keep the public hatch/name RPC signature stable for the existing frontend.
create or replace function public.dragonbound_name_dragon(p_dragon_name text, p_breed_id text)
returns table(dragon_name text, breed_id text, hatched_at timestamptz, is_admin boolean)
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_locked_egg text;
  v_expected_breed text;
  v_is_admin boolean := false;
  v_name text := btrim(coalesce(p_dragon_name,''));
begin
  if v_uid is null then raise exception 'You must be signed in to name a Dragonbound dragon.'; end if;
  if char_length(v_name) < 1 or char_length(v_name) > 24 then raise exception 'Dragon names must be between 1 and 24 characters.'; end if;

  select c.username into v_username from public.characters c where c.user_id=v_uid limit 1;
  if coalesce(v_username,'')='' then raise exception 'Dragonbound character profile not found.'; end if;
  v_is_admin := lower(v_username)='admin';

  select p.locked_egg into v_locked_egg from public.dragonbound_profiles p where p.user_id=v_uid;
  if not v_is_admin then
    if v_locked_egg is null then raise exception 'Adopt an egg before naming a dragon.'; end if;
    v_expected_breed := trim(both '-' from regexp_replace(lower(v_locked_egg),'[^a-z0-9]+','-','g'));
    if p_breed_id is distinct from v_expected_breed then raise exception 'That dragon does not match your locked Dragonbound egg.'; end if;
  end if;

  insert into public.dragonbound_profiles(user_id,username,dragon_name,breed_id,dragon_hatched_at,updated_at)
  values(v_uid,v_username,v_name,p_breed_id,now(),now())
  on conflict(user_id) do update
    set username=excluded.username,
        dragon_name=excluded.dragon_name,
        breed_id=excluded.breed_id,
        dragon_hatched_at=coalesce(public.dragonbound_profiles.dragon_hatched_at,excluded.dragon_hatched_at),
        updated_at=now();

  perform public.dragonbound_ensure_personality(v_uid,p_breed_id,v_is_admin);

  return query
  select v_name,p_breed_id,p.dragon_hatched_at,v_is_admin
  from public.dragonbound_profiles p where p.user_id=v_uid;
end;
$$;

create or replace function public.dragonbound_save_behaviour(
  p_memory jsonb default null,
  p_preferences jsonb default null,
  p_discovered_traits jsonb default null
)
returns table(dragon_memory jsonb, dragon_preferences jsonb, dragon_traits jsonb)
language plpgsql
security definer
set search_path to 'public','auth'
as $$
declare
  v_uid uuid := auth.uid();
  v_assigned jsonb;
  v_discovered jsonb := '[]'::jsonb;
begin
  if v_uid is null then raise exception 'You must be signed in to save Dragonbound behaviour.'; end if;
  if not exists(select 1 from public.dragonbound_profiles where user_id=v_uid and dragon_hatched_at is not null) then
    raise exception 'No hatched Dragonbound dragon was found.';
  end if;
  if p_memory is not null and octet_length(p_memory::text)>18000 then raise exception 'Dragon memory payload is too large.'; end if;
  if p_preferences is not null and octet_length(p_preferences::text)>8000 then raise exception 'Dragon preference payload is too large.'; end if;
  if p_discovered_traits is not null and jsonb_typeof(p_discovered_traits)<>'array' then raise exception 'Discovered traits must be an array.'; end if;

  select coalesce(dragon_traits->'assigned','[]'::jsonb) into v_assigned
  from public.dragonbound_profiles where user_id=v_uid;

  if p_discovered_traits is not null then
    select coalesce(jsonb_agg(v),'[]'::jsonb) into v_discovered
    from (
      select distinct to_jsonb(d.value) as v
      from jsonb_array_elements_text(p_discovered_traits) d(value)
      where v_assigned ? d.value
      limit 20
    ) s;
  else
    select coalesce(dragon_traits->'discovered','[]'::jsonb) into v_discovered
    from public.dragonbound_profiles where user_id=v_uid;
  end if;

  update public.dragonbound_profiles
  set dragon_memory=coalesce(p_memory,dragon_memory),
      dragon_preferences=coalesce(p_preferences,dragon_preferences),
      dragon_traits=jsonb_set(dragon_traits,'{discovered}',v_discovered,true),
      updated_at=clock_timestamp()
  where user_id=v_uid;

  return query
  select p.dragon_memory,p.dragon_preferences,p.dragon_traits
  from public.dragonbound_profiles p where p.user_id=v_uid;
end;
$$;

-- Existing hatched dragons receive a personality exactly once without changing identity data.
do $$
declare r record;
begin
  for r in
    select user_id,breed_id from public.dragonbound_profiles
    where dragon_hatched_at is not null and breed_id is not null and personality is null
  loop
    perform public.dragonbound_ensure_personality(r.user_id,r.breed_id,false);
  end loop;
end $$;

revoke all on function public.dragonbound_roll_stat() from public, anon, authenticated;
revoke all on function public.dragonbound_generate_personality(text) from public, anon, authenticated;
revoke all on function public.dragonbound_ensure_personality(uuid,text,boolean) from public, anon, authenticated;
revoke all on function public.dragonbound_clamp_stat(integer) from public, anon, authenticated;
revoke all on function public.dragonbound_save_behaviour(jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.dragonbound_save_behaviour(jsonb,jsonb,jsonb) to authenticated;
