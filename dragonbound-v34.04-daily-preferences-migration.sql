-- V34.04 — Daily Preferences & Mini Pet Events
-- Temporary several-hour preference cycles. These are server-owned behaviour flavour only:
-- they never affect Dragon Racing speed/results, GP, XP, Keeper Marks or other rewards.

create table if not exists public.dragonbound_daily_preferences (
  preference_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot smallint not null check (slot between 1 and 2),
  preference_type text not null,
  target_placement_id uuid null references public.dragonbound_house_furniture(placement_id) on delete cascade,
  target_item_id text null,
  generated_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  unique(user_id, slot)
);

create index if not exists dragonbound_daily_preferences_user_expiry_idx
  on public.dragonbound_daily_preferences(user_id, expires_at);

alter table public.dragonbound_daily_preferences enable row level security;

drop policy if exists dragonbound_daily_preferences_select_own on public.dragonbound_daily_preferences;
create policy dragonbound_daily_preferences_select_own
  on public.dragonbound_daily_preferences
  for select
  to authenticated
  using (user_id = auth.uid());

grant select on public.dragonbound_daily_preferences to authenticated;
revoke insert, update, delete on public.dragonbound_daily_preferences from anon, authenticated;

create or replace function public.dragonbound_daily_preference_compatible(p_a text, p_b text)
returns boolean
language sql
immutable
as $function$
  select case
    when coalesce(p_a,'')='' or coalesce(p_b,'')='' then true
    when p_a=p_b then false
    when p_a in ('attention_day','shadowing','cuddle_day') and p_b in ('independent_streak','hideaway') then false
    when p_b in ('attention_day','shadowing','cuddle_day') and p_a in ('independent_streak','hideaway') then false
    when p_a in ('bath_lover','sand_bath_day') and p_b='avoiding_bath' then false
    when p_b in ('bath_lover','sand_bath_day') and p_a='avoiding_bath' then false
    when p_a in ('nap_day','comfort_seeker','favourite_corner') and p_b in ('explorer','training_kick','race_itch','focused_practice') then false
    when p_b in ('nap_day','comfort_seeker','favourite_corner') and p_a in ('explorer','training_kick','race_itch','focused_practice') then false
    when p_a in ('toy_obsession','object_fixation','new_furniture_interest','object_avoidance','favourite_corner')
      and p_b in ('toy_obsession','object_fixation','new_furniture_interest','object_avoidance','favourite_corner') then false
    else true
  end;
$function$;

revoke all on function public.dragonbound_daily_preference_compatible(text,text) from public;
revoke execute on function public.dragonbound_daily_preference_compatible(text,text) from anon, authenticated;

create or replace function public.dragonbound_ensure_daily_preferences(p_uid uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_profile public.dragonbound_profiles%rowtype;
  v_traits text[] := '{}'::text[];
  v_name text := 'Your dragon';
  v_mood text := '';
  v_last_moment text := '';
  v_last_race_position integer;
  v_last_race_at timestamptz;
  v_rest numeric := 0;
  v_hunger numeric := 0;
  v_fun numeric := 0;
  v_social numeric := 0;
  v_hygiene numeric := 0;
  v_cycle_roll numeric := random();
  v_count integer := 1;
  v_first text;
  v_second text;
  v_pref_type text;
  v_slot integer := 0;
  v_expiry timestamptz;
  v_label text;
  v_story text;
  v_target_placement uuid;
  v_target_item text;
  v_target_name text;
  v_result jsonb;
  v_active_count integer := 0;
  v_toy_target uuid;
  v_toy_item text;
  v_comfort_target uuid;
  v_comfort_item text;
  v_any_target uuid;
  v_any_item text;
  v_new_target uuid;
  v_new_item text;
  v_has_training boolean := false;
  v_has_window boolean := false;
  v_has_bath boolean := false;
  v_has_sand boolean := false;
  v_has_toy boolean := false;
  v_has_rest boolean := false;
  v_recent_play integer := 0;
  v_recent_train integer := 0;
  v_recent_rest integer := 0;

  v_w_nap numeric := 7;
  v_w_comfort numeric := 8;
  v_w_corner numeric := 3;
  v_w_toy numeric := 4;
  v_w_play numeric := 8;
  v_w_puzzle numeric := 5;
  v_w_train numeric := 7;
  v_w_race numeric := 4;
  v_w_focus numeric := 5;
  v_w_attention numeric := 6;
  v_w_shadow numeric := 4;
  v_w_independent numeric := 5;
  v_w_cuddle numeric := 5;
  v_w_snacky numeric := 6;
  v_w_treat numeric := 4;
  v_w_bath numeric := 5;
  v_w_sand numeric := 3;
  v_w_avoid_bath numeric := 2;
  v_w_explorer numeric := 7;
  v_w_window numeric := 5;
  v_w_inspector numeric := 6;
  v_w_hideaway numeric := 4;
  v_w_fixation numeric := 3;
  v_w_new numeric := 2;
  v_w_avoid_object numeric := 2;
begin
  if p_uid is null then raise exception 'Dragonbound preference user is missing.'; end if;

  select * into v_profile
  from public.dragonbound_profiles
  where user_id=p_uid
  for update;

  if not found or v_profile.dragon_hatched_at is null or coalesce(v_profile.dragon_name,'')='' then
    return jsonb_build_object('version',1,'preferences','[]'::jsonb,'nextChangeAt',null);
  end if;

  -- Expired rows are harmless and are cleaned lazily. Targeted rows disappear automatically
  -- through the placement FK if the furnishing is stored/removed.
  delete from public.dragonbound_daily_preferences
  where user_id=p_uid and expires_at<=clock_timestamp();

  select count(*) into v_active_count
  from public.dragonbound_daily_preferences
  where user_id=p_uid and expires_at>clock_timestamp();

  if v_active_count>0 then
    select jsonb_build_object(
      'version',1,
      'preferences',coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id',preference_id::text,
            'type',preference_type,
            'label',coalesce(metadata->>'label',''),
            'story',coalesce(metadata->>'story',''),
            'targetPlacementId',coalesce(target_placement_id::text,''),
            'targetItemId',coalesce(target_item_id,''),
            'targetName',coalesce(metadata->>'targetName',''),
            'generatedAt',to_char(generated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'expiresAt',to_char(expires_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          ) order by slot
        ) filter (where preference_type<>'quiet_day'),
        '[]'::jsonb
      ),
      'nextChangeAt',to_char(min(expires_at) at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ) into v_result
    from public.dragonbound_daily_preferences
    where user_id=p_uid and expires_at>clock_timestamp();
    return v_result;
  end if;

  v_name:=coalesce(nullif(btrim(v_profile.dragon_name),''),'Your dragon');
  v_mood:=coalesce(v_profile.dragon_mood->>'name','');
  v_last_moment:=coalesce(v_profile.dragon_memory#>>'{dailyLife,lastMeaningfulMoment,type}','');

  select coalesce(array_agg(distinct x.value),'{}'::text[])
  into v_traits
  from (
    select value from jsonb_array_elements_text(coalesce(v_profile.dragon_traits->'signature','[]'::jsonb))
    union all
    select value from jsonb_array_elements_text(coalesce(v_profile.dragon_traits->'assigned','[]'::jsonb))
  ) x;

  begin v_rest:=coalesce(nullif(v_profile.dragon_memory#>>'{runtimeNeeds,rest}','')::numeric,0); exception when others then v_rest:=0; end;
  begin v_hunger:=coalesce(nullif(v_profile.dragon_memory#>>'{runtimeNeeds,hunger}','')::numeric,0); exception when others then v_hunger:=0; end;
  begin v_fun:=coalesce(nullif(v_profile.dragon_memory#>>'{runtimeNeeds,stimulation}','')::numeric,0); exception when others then v_fun:=0; end;
  begin v_social:=coalesce(nullif(v_profile.dragon_memory#>>'{runtimeNeeds,social}','')::numeric,0); exception when others then v_social:=0; end;
  begin v_hygiene:=coalesce(nullif(v_profile.dragon_memory#>>'{runtimeNeeds,hygiene}','')::numeric,0); exception when others then v_hygiene:=0; end;

  select count(*) into v_recent_play from jsonb_array_elements_text(coalesce(v_profile.dragon_memory->'recentFurnitureKinds','[]'::jsonb)) q where q.value in ('play','puzzle','scratch','dig');
  select count(*) into v_recent_train from jsonb_array_elements_text(coalesce(v_profile.dragon_memory->'recentFurnitureKinds','[]'::jsonb)) q where q.value in ('exercise','climb','roar','fire');
  select count(*) into v_recent_rest from jsonb_array_elements_text(coalesce(v_profile.dragon_memory->'recentFurnitureKinds','[]'::jsonb)) q where q.value in ('sleep','rest','perch','warm','hide');

  select finish_position,claimed_at into v_last_race_position,v_last_race_at
  from public.dragonbound_race_sessions
  where user_id=p_uid and claimed_at is not null and claimed_at>=clock_timestamp()-interval '24 hours'
  order by claimed_at desc limit 1;

  select exists(select 1 from public.dragonbound_house_furniture where user_id=p_uid and item_id ~* '(train|agility|weight|exercise|climb|flight|roar|fire|strength|tread|hurdle|weave|balance)') into v_has_training;
  select exists(select 1 from public.dragonbound_house_furniture where user_id=p_uid and item_id ~* '(window|perch|lookout|watch)') into v_has_window;
  select exists(select 1 from public.dragonbound_house_furniture where user_id=p_uid and item_id ~* '(bath|wash|pool|groom|scrub)') into v_has_bath;
  select exists(select 1 from public.dragonbound_house_furniture where user_id=p_uid and item_id ~* '(sand.*bath|sand.*clean|cleaning.*sand)') into v_has_sand;
  select exists(select 1 from public.dragonbound_house_furniture where user_id=p_uid and item_id ~* '(toy|puzzle|ball|tug|chew|play|scratch|fossil|dig)') into v_has_toy;
  select exists(select 1 from public.dragonbound_house_furniture where user_id=p_uid and item_id ~* '(bed|nest|cushion|blanket|sofa|lounger|rest|warm|perch|hide)') into v_has_rest;

  -- Only furnishings the dragon has genuinely used can become a temporary obsession.
  select f.placement_id,f.item_id into v_toy_target,v_toy_item
  from public.dragonbound_house_furniture f
  where f.user_id=p_uid
    and coalesce(v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'lastKind','') in ('play','puzzle','scratch','dig')
    and coalesce((v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'count')::numeric,0)>=2
  order by coalesce((v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'preferenceScore')::numeric,0) desc,
           coalesce((v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'count')::numeric,0) desc,
           random()
  limit 1;

  select f.placement_id,f.item_id into v_comfort_target,v_comfort_item
  from public.dragonbound_house_furniture f
  where f.user_id=p_uid
    and coalesce(v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'lastKind','') in ('sleep','rest','perch','warm','hide')
    and coalesce((v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'count')::numeric,0)>=2
  order by coalesce((v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'preferenceScore')::numeric,0) desc,
           coalesce((v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'count')::numeric,0) desc,
           random()
  limit 1;

  select f.placement_id,f.item_id into v_any_target,v_any_item
  from public.dragonbound_house_furniture f
  where f.user_id=p_uid
    and coalesce(v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'lastKind','')<>''
    and coalesce((v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'count')::numeric,0)>=2
  order by coalesce((v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'preferenceScore')::numeric,0) desc,
           coalesce((v_profile.dragon_memory->'furnitureAffinity'->(f.placement_id::text)->>'count')::numeric,0) desc,
           random()
  limit 1;

  select f.placement_id,f.item_id into v_new_target,v_new_item
  from public.dragonbound_house_furniture f
  where f.user_id=p_uid
    and f.placed_at>=clock_timestamp()-interval '18 hours'
    and coalesce(v_profile.dragon_memory#>'{dailyLife,knownFurniture}'->(f.placement_id::text)->>'used','false')<>'true'
  order by f.placed_at desc,random()
  limit 1;

  -- Permanent nature changes the odds, never the allowed actions.
  if 'Lazy'=any(v_traits) then v_w_nap:=v_w_nap+18;v_w_comfort:=v_w_comfort+14;v_w_corner:=v_w_corner+8;v_w_explorer:=greatest(1,v_w_explorer-4);v_w_train:=greatest(1,v_w_train-4); end if;
  if 'Sleepy'=any(v_traits) then v_w_nap:=v_w_nap+20;v_w_comfort:=v_w_comfort+11;v_w_corner:=v_w_corner+5; end if;
  if 'Energetic'=any(v_traits) then v_w_train:=v_w_train+12;v_w_play:=v_w_play+10;v_w_explorer:=v_w_explorer+9;v_w_race:=v_w_race+7; end if;
  if 'Curious'=any(v_traits) then v_w_explorer:=v_w_explorer+14;v_w_inspector:=v_w_inspector+18;v_w_window:=v_w_window+8;v_w_puzzle:=v_w_puzzle+8;v_w_new:=v_w_new+10; end if;
  if 'Playful'=any(v_traits) or 'Toy Obsessed'=any(v_traits) then v_w_toy:=v_w_toy+18;v_w_play:=v_w_play+15;v_w_puzzle:=v_w_puzzle+7; end if;
  if 'Food Obsessed'=any(v_traits) or 'Greedy'=any(v_traits) then v_w_snacky:=v_w_snacky+18;v_w_treat:=v_w_treat+11; end if;
  if 'Affectionate'=any(v_traits) or 'Clingy'=any(v_traits) then v_w_attention:=v_w_attention+17;v_w_shadow:=v_w_shadow+10;v_w_cuddle:=v_w_cuddle+15; end if;
  if 'Independent'=any(v_traits) or 'Independent Friend'=any(v_traits) then v_w_independent:=v_w_independent+18;v_w_explorer:=v_w_explorer+7;v_w_hideaway:=v_w_hideaway+5; end if;
  if 'Shy'=any(v_traits) then v_w_hideaway:=v_w_hideaway+15;v_w_corner:=v_w_corner+8;v_w_window:=v_w_window+6;v_w_attention:=greatest(1,v_w_attention-3); end if;
  if 'Competitive'=any(v_traits) then v_w_train:=v_w_train+18;v_w_race:=v_w_race+18;v_w_focus:=v_w_focus+14; end if;
  if 'Clean'=any(v_traits) or 'Very Clean'=any(v_traits) then v_w_bath:=v_w_bath+16;v_w_sand:=v_w_sand+8; end if;
  if 'Messy'=any(v_traits) or 'Dirt Magnet'=any(v_traits) then v_w_bath:=greatest(1,v_w_bath-3);v_w_sand:=greatest(1,v_w_sand-2);v_w_avoid_bath:=v_w_avoid_bath+8; end if;
  if 'Adventurous'=any(v_traits) or 'Explorer'=any(v_traits) then v_w_explorer:=v_w_explorer+15;v_w_inspector:=v_w_inspector+7; end if;
  if 'Stubborn'=any(v_traits) then v_w_fixation:=v_w_fixation+10;v_w_avoid_object:=v_w_avoid_object+8; end if;
  if 'Calm'=any(v_traits) then v_w_window:=v_w_window+10;v_w_corner:=v_w_corner+7;v_w_comfort:=v_w_comfort+12; end if;

  -- Current several-hour mood is the strongest short-term nudge.
  if v_mood='Bouncy' then v_w_play:=v_w_play+13;v_w_explorer:=v_w_explorer+10;v_w_train:=v_w_train+9; end if;
  if v_mood='Sleepy' then v_w_nap:=v_w_nap+22;v_w_comfort:=v_w_comfort+14; end if;
  if v_mood='Cuddly' then v_w_attention:=v_w_attention+16;v_w_cuddle:=v_w_cuddle+18;v_w_shadow:=v_w_shadow+8; end if;
  if v_mood='Curious' then v_w_explorer:=v_w_explorer+17;v_w_inspector:=v_w_inspector+15;v_w_new:=v_w_new+8; end if;
  if v_mood='Grumpy' then v_w_independent:=v_w_independent+12;v_w_hideaway:=v_w_hideaway+10;v_w_avoid_object:=v_w_avoid_object+7; end if;
  if v_mood='Focused' then v_w_train:=v_w_train+16;v_w_puzzle:=v_w_puzzle+11;v_w_focus:=v_w_focus+17; end if;
  if v_mood='Hungry' then v_w_snacky:=v_w_snacky+20;v_w_treat:=v_w_treat+7; end if;
  if v_mood='Playful' then v_w_toy:=v_w_toy+17;v_w_play:=v_w_play+18;v_w_puzzle:=v_w_puzzle+7; end if;
  if v_mood='Nervous' then v_w_corner:=v_w_corner+11;v_w_hideaway:=v_w_hideaway+14;v_w_window:=v_w_window+7;v_w_new:=greatest(1,v_w_new-2); end if;
  if v_mood='Proud' then v_w_race:=v_w_race+13;v_w_train:=v_w_train+12;v_w_attention:=v_w_attention+6; end if;
  if v_mood='Relaxed' then v_w_comfort:=v_w_comfort+17;v_w_window:=v_w_window+10;v_w_corner:=v_w_corner+7; end if;
  if v_mood='Restless' then v_w_explorer:=v_w_explorer+17;v_w_play:=v_w_play+10;v_w_train:=v_w_train+9; end if;

  -- Needs only nudge preference generation; the live care system still owns urgency.
  if v_rest>=60 then v_w_nap:=v_w_nap+10;v_w_comfort:=v_w_comfort+5; end if;
  if v_hunger>=60 then v_w_snacky:=v_w_snacky+11;v_w_treat:=v_w_treat+4; end if;
  if v_fun>=60 then v_w_play:=v_w_play+8;v_w_explorer:=v_w_explorer+6; end if;
  if v_social>=65 then v_w_attention:=v_w_attention+7;v_w_cuddle:=v_w_cuddle+5; end if;
  if v_hygiene>=62 then v_w_bath:=v_w_bath+9;v_w_sand:=v_w_sand+5; end if;

  if v_recent_play>=3 then v_w_toy:=v_w_toy+9;v_w_play:=v_w_play+6; end if;
  if v_recent_train>=3 then v_w_train:=v_w_train+9;v_w_focus:=v_w_focus+5; end if;
  if v_recent_rest>=3 then v_w_comfort:=v_w_comfort+7;v_w_corner:=v_w_corner+5; end if;
  if v_last_moment in ('training-practice','flight-practice') then v_w_train:=v_w_train+8;v_w_focus:=v_w_focus+6; end if;
  if v_last_moment in ('keeper-pet','return-home','bond') then v_w_attention:=v_w_attention+7;v_w_cuddle:=v_w_cuddle+5; end if;

  if v_last_race_at is not null then
    if v_last_race_position=1 then v_w_race:=v_w_race+16;v_w_train:=v_w_train+7;
    elsif 'Competitive'=any(v_traits) then v_w_focus:=v_w_focus+14;v_w_train:=v_w_train+8;
    end if;
  end if;

  if not v_has_training then v_w_train:=greatest(1,v_w_train-6);v_w_race:=greatest(1,v_w_race-4);v_w_focus:=greatest(1,v_w_focus-4); end if;
  if not v_has_window then v_w_window:=greatest(1,v_w_window-4); end if;
  if not v_has_bath then v_w_bath:=1;v_w_avoid_bath:=1; end if;
  if not v_has_sand then v_w_sand:=0; end if;
  if not v_has_toy then v_w_toy:=0;v_w_puzzle:=greatest(1,v_w_puzzle-4); end if;
  if not v_has_rest then v_w_corner:=0;v_w_comfort:=greatest(1,v_w_comfort-4); end if;
  if v_toy_target is null then v_w_toy:=0; end if;
  if v_comfort_target is null then v_w_corner:=0; end if;
  if v_any_target is null then v_w_fixation:=0; end if;
  if v_new_target is null then v_w_new:=0; end if;
  if coalesce(v_new_target,v_any_target) is null then v_w_avoid_object:=0; end if;

  -- Preserve an occasional genuinely uneventful day without allowing refresh-spam rerolls.
  if v_cycle_roll<0.12 then
    insert into public.dragonbound_daily_preferences(user_id,slot,preference_type,generated_at,expires_at,metadata)
    values(p_uid,1,'quiet_day',clock_timestamp(),clock_timestamp()+interval '4 hours'+random()*interval '3 hours',jsonb_build_object('label','Nothing unusual today','story',format('%s seems content to simply be themselves for a while.',v_name)));
  else
    v_count:=case when v_cycle_roll>=0.80 then 2 else 1 end;

    with candidates(pref_type,weight) as (values
      ('nap_day',v_w_nap),('comfort_seeker',v_w_comfort),('favourite_corner',v_w_corner),('toy_obsession',v_w_toy),
      ('playful_day',v_w_play),('puzzle_mood',v_w_puzzle),('training_kick',v_w_train),('race_itch',v_w_race),
      ('focused_practice',v_w_focus),('attention_day',v_w_attention),('shadowing',v_w_shadow),('independent_streak',v_w_independent),
      ('cuddle_day',v_w_cuddle),('snacky',v_w_snacky),('treat_hopeful',v_w_treat),('bath_lover',v_w_bath),
      ('sand_bath_day',v_w_sand),('avoiding_bath',v_w_avoid_bath),('explorer',v_w_explorer),('window_watcher',v_w_window),
      ('furniture_inspector',v_w_inspector),('hideaway',v_w_hideaway),('object_fixation',v_w_fixation),('new_furniture_interest',v_w_new),
      ('object_avoidance',v_w_avoid_object)
    )
    select pref_type into v_first from candidates where weight>0 order by (-ln(greatest(random(),0.000000001))/weight) asc limit 1;

    if v_count=2 and v_first is not null then
      with candidates(pref_type,weight) as (values
        ('nap_day',v_w_nap),('comfort_seeker',v_w_comfort),('favourite_corner',v_w_corner),('toy_obsession',v_w_toy),
        ('playful_day',v_w_play),('puzzle_mood',v_w_puzzle),('training_kick',v_w_train),('race_itch',v_w_race),
        ('focused_practice',v_w_focus),('attention_day',v_w_attention),('shadowing',v_w_shadow),('independent_streak',v_w_independent),
        ('cuddle_day',v_w_cuddle),('snacky',v_w_snacky),('treat_hopeful',v_w_treat),('bath_lover',v_w_bath),
        ('sand_bath_day',v_w_sand),('avoiding_bath',v_w_avoid_bath),('explorer',v_w_explorer),('window_watcher',v_w_window),
        ('furniture_inspector',v_w_inspector),('hideaway',v_w_hideaway),('object_fixation',v_w_fixation),('new_furniture_interest',v_w_new),
        ('object_avoidance',v_w_avoid_object)
      )
      select pref_type into v_second
      from candidates
      where weight>0 and pref_type<>v_first and public.dragonbound_daily_preference_compatible(v_first,pref_type)
      order by (-ln(greatest(random(),0.000000001))/weight) asc limit 1;
    end if;

    foreach v_pref_type in array array[v_first,v_second] loop
      if coalesce(v_pref_type,'')='' then continue; end if;
      v_slot:=v_slot+1;
      v_target_placement:=null;v_target_item:=null;v_target_name:=null;

      if v_pref_type='toy_obsession' then v_target_placement:=v_toy_target;v_target_item:=v_toy_item;
      elsif v_pref_type='favourite_corner' then v_target_placement:=v_comfort_target;v_target_item:=v_comfort_item;
      elsif v_pref_type='object_fixation' then v_target_placement:=v_any_target;v_target_item:=v_any_item;
      elsif v_pref_type='new_furniture_interest' then v_target_placement:=v_new_target;v_target_item:=v_new_item;
      elsif v_pref_type='object_avoidance' then v_target_placement:=coalesce(v_new_target,v_any_target);v_target_item:=case when v_new_target is not null then v_new_item else v_any_item end;
      end if;

      if v_target_item is not null then
        v_target_name:=initcap(regexp_replace(regexp_replace(v_target_item,'^[a-z0-9]+-[0-9]+-','','i'),'[-_]+',' ','g'));
      end if;

      v_label:=case v_pref_type
        when 'nap_day' then 'Nap Day' when 'comfort_seeker' then 'Comfort Seeker' when 'favourite_corner' then 'Favourite Corner'
        when 'toy_obsession' then 'Toy Obsession' when 'playful_day' then 'Playful Day' when 'puzzle_mood' then 'Puzzle Mood'
        when 'training_kick' then 'Training Kick' when 'race_itch' then 'Race Itch' when 'focused_practice' then 'Focused Practice'
        when 'attention_day' then 'Attention Day' when 'shadowing' then 'Shadowing' when 'independent_streak' then 'Independent Streak'
        when 'cuddle_day' then 'Cuddle Day' when 'snacky' then 'Snacky' when 'treat_hopeful' then 'Treat Hopeful'
        when 'bath_lover' then 'Bath Lover' when 'sand_bath_day' then 'Sand Bath Day' when 'avoiding_bath' then 'Not Feeling the Bath'
        when 'explorer' then 'Explorer' when 'window_watcher' then 'Window Watcher' when 'furniture_inspector' then 'Furniture Inspector'
        when 'hideaway' then 'Hideaway Mood' when 'object_fixation' then 'Temporary Obsession' when 'new_furniture_interest' then 'Something New'
        when 'object_avoidance' then 'Keeping Away' else initcap(replace(v_pref_type,'_',' ')) end;

      v_story:=case v_pref_type
        when 'nap_day' then format('%s seems determined to turn today into one long series of very important naps.',v_name)
        when 'comfort_seeker' then format('%s keeps choosing the softest, cosiest options in the house today.',v_name)
        when 'favourite_corner' then format('%s keeps drifting back toward %s today, as if that spot has quietly won an argument.',v_name,coalesce(v_target_name,'the same cosy corner'))
        when 'toy_obsession' then format('%s has decided %s is apparently the most important object in Velmora today.',v_name,coalesce(v_target_name,'one particular toy'))
        when 'playful_day' then format('%s seems convinced today should contain considerably more play than usual.',v_name)
        when 'puzzle_mood' then format('%s is unusually interested in anything that requires a little figuring out.',v_name)
        when 'training_kick' then format('%s has been unusually serious about getting some training in today.',v_name)
        when 'race_itch' then format('%s keeps gravitating toward practice as though another race cannot arrive quickly enough.',v_name)
        when 'focused_practice' then format('%s seems determined to finish whatever bit of practice they start today.',v_name)
        when 'attention_day' then format('%s has been checking in with you far more than usual today.',v_name)
        when 'shadowing' then format('%s seems happiest keeping tabs on where you are today.',v_name)
        when 'independent_streak' then format('%s seems quite happy entertaining themselves and choosing their own route today.',v_name)
        when 'cuddle_day' then format('%s keeps favouring comfortable spots and familiar company today.',v_name)
        when 'snacky' then format('%s keeps finding perfectly innocent reasons to inspect the feeding situation.',v_name)
        when 'treat_hopeful' then format('%s appears to believe that checking on you often enough may eventually produce a treat.',v_name)
        when 'bath_lover' then format('%s has apparently rediscovered the joy of bath time today.',v_name)
        when 'sand_bath_day' then format('%s seems particularly enthusiastic about a good roll in the cleaning sand today.',v_name)
        when 'avoiding_bath' then format('%s is politely pretending the bathing furniture does not exist unless it becomes necessary.',v_name)
        when 'explorer' then format('%s seems convinced there must still be some part of the house they have not properly investigated.',v_name)
        when 'window_watcher' then format('%s keeps drifting back toward places where they can watch the world outside.',v_name)
        when 'furniture_inspector' then format('%s has appointed themselves chief inspector of household objects for the day.',v_name)
        when 'hideaway' then format('%s is favouring tucked-away, private little spaces today.',v_name)
        when 'object_fixation' then format('%s has developed a temporary fascination with %s and keeps finding reasons to return to it.',v_name,coalesce(v_target_name,'one particular furnishing'))
        when 'new_furniture_interest' then format('%s is still making up their mind about %s, which apparently requires several inspections.',v_name,coalesce(v_target_name,'the new furniture'))
        when 'object_avoidance' then format('%s is giving %s a little extra space today, though necessity can still change their mind.',v_name,coalesce(v_target_name,'one particular furnishing'))
        else format('%s seems to have a small change of routine today.',v_name)
      end;

      v_expiry:=case when v_pref_type in ('toy_obsession','object_fixation','new_furniture_interest','object_avoidance')
        then clock_timestamp()+interval '3 hours'+random()*interval '3 hours'
        else clock_timestamp()+interval '4 hours'+random()*interval '4 hours' end;

      insert into public.dragonbound_daily_preferences(user_id,slot,preference_type,target_placement_id,target_item_id,generated_at,expires_at,metadata)
      values(p_uid,v_slot,v_pref_type,v_target_placement,v_target_item,clock_timestamp(),v_expiry,
        jsonb_build_object('label',v_label,'story',v_story,'targetName',coalesce(v_target_name,''),'sourceMood',v_mood,'version',1));
    end loop;
  end if;

  select jsonb_build_object(
    'version',1,
    'preferences',coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id',preference_id::text,
          'type',preference_type,
          'label',coalesce(metadata->>'label',''),
          'story',coalesce(metadata->>'story',''),
          'targetPlacementId',coalesce(target_placement_id::text,''),
          'targetItemId',coalesce(target_item_id,''),
          'targetName',coalesce(metadata->>'targetName',''),
          'generatedAt',to_char(generated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'expiresAt',to_char(expires_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        ) order by slot
      ) filter (where preference_type<>'quiet_day'),
      '[]'::jsonb
    ),
    'nextChangeAt',to_char(min(expires_at) at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  ) into v_result
  from public.dragonbound_daily_preferences
  where user_id=p_uid and expires_at>clock_timestamp();

  return coalesce(v_result,jsonb_build_object('version',1,'preferences','[]'::jsonb,'nextChangeAt',null));
end;
$function$;

create or replace function public.dragonbound_get_daily_preferences()
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'You must be signed in to read Dragonbound preferences.'; end if;
  return public.dragonbound_ensure_daily_preferences(v_uid);
end;
$function$;

revoke all on function public.dragonbound_ensure_daily_preferences(uuid) from public;
revoke execute on function public.dragonbound_ensure_daily_preferences(uuid) from anon, authenticated;
grant execute on function public.dragonbound_get_daily_preferences() to authenticated;
revoke execute on function public.dragonbound_get_daily_preferences() from anon;

-- Seed current hatched dragons without hard-coding any user IDs.
do $backfill$
declare r record;
begin
  for r in select user_id from public.dragonbound_profiles where dragon_hatched_at is not null and coalesce(dragon_name,'')<>'' loop
    perform public.dragonbound_ensure_daily_preferences(r.user_id);
  end loop;
end;
$backfill$;
