-- V34.03 — Dragon Moods & Daily Stories
-- Server-owned, several-hour mood cycles. Personality/needs/recent life influence the
-- mood selection, but mood never alters race simulation, race XP, GP or Keeper Marks.

alter table public.dragonbound_profiles
  add column if not exists dragon_mood jsonb not null default '{}'::jsonb;

create or replace function public.dragonbound_ensure_mood(p_uid uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_profile public.dragonbound_profiles%rowtype;
  v_existing jsonb := '{}'::jsonb;
  v_existing_expiry timestamptz;
  v_traits text[] := '{}'::text[];
  v_name text := 'Your dragon';
  v_favourite text := '';
  v_last_moment text := '';
  v_last_race_position integer;
  v_last_race_at timestamptz;
  v_rest numeric := 0;
  v_hunger numeric := 0;
  v_fun numeric := 0;
  v_social numeric := 0;
  v_hygiene numeric := 0;
  v_bouncy numeric := 8;
  v_sleepy numeric := 8;
  v_cuddly numeric := 7;
  v_curious numeric := 8;
  v_grumpy numeric := 4;
  v_focused numeric := 7;
  v_hungry numeric := 5;
  v_playful numeric := 8;
  v_nervous numeric := 4;
  v_proud numeric := 5;
  v_relaxed numeric := 9;
  v_restless numeric := 7;
  v_total numeric;
  v_roll numeric;
  v_mood text;
  v_story text;
  v_reason text := 'personality';
  v_started timestamptz := clock_timestamp();
  v_expires timestamptz;
  v_result jsonb;
begin
  if p_uid is null then
    raise exception 'Dragonbound mood user is missing.';
  end if;

  select * into v_profile
  from public.dragonbound_profiles
  where user_id = p_uid
  for update;

  if not found or v_profile.dragon_hatched_at is null or coalesce(v_profile.dragon_name,'') = '' then
    return '{}'::jsonb;
  end if;

  v_existing := coalesce(v_profile.dragon_mood,'{}'::jsonb);
  begin
    v_existing_expiry := nullif(v_existing->>'expiresAt','')::timestamptz;
  exception when others then
    v_existing_expiry := null;
  end;

  if coalesce(v_existing->>'name','') <> '' and v_existing_expiry is not null and v_existing_expiry > clock_timestamp() then
    return v_existing;
  end if;

  v_name := coalesce(nullif(btrim(v_profile.dragon_name),''),'Your dragon');
  v_favourite := coalesce(v_profile.dragon_preferences#>>'{formed,favouriteFurniture,name}','');
  v_last_moment := coalesce(v_profile.dragon_memory#>>'{dailyLife,lastMeaningfulMoment,type}','');

  select coalesce(array_agg(distinct x.value),'{}'::text[])
  into v_traits
  from (
    select value from jsonb_array_elements_text(coalesce(v_profile.dragon_traits->'signature','[]'::jsonb))
    union all
    select value from jsonb_array_elements_text(coalesce(v_profile.dragon_traits->'assigned','[]'::jsonb))
  ) x;

  begin v_rest := coalesce(nullif(v_profile.dragon_memory#>>'{runtimeNeeds,rest}','')::numeric,0); exception when others then v_rest := 0; end;
  begin v_hunger := coalesce(nullif(v_profile.dragon_memory#>>'{runtimeNeeds,hunger}','')::numeric,0); exception when others then v_hunger := 0; end;
  begin v_fun := coalesce(nullif(v_profile.dragon_memory#>>'{runtimeNeeds,stimulation}','')::numeric,0); exception when others then v_fun := 0; end;
  begin v_social := coalesce(nullif(v_profile.dragon_memory#>>'{runtimeNeeds,social}','')::numeric,0); exception when others then v_social := 0; end;
  begin v_hygiene := coalesce(nullif(v_profile.dragon_memory#>>'{runtimeNeeds,hygiene}','')::numeric,0); exception when others then v_hygiene := 0; end;

  -- Permanent personality meaningfully tilts the dice, but never hard-locks a mood.
  if 'Energetic'=any(v_traits) then v_bouncy:=v_bouncy+18; v_restless:=v_restless+7; end if;
  if 'Easily Excited'=any(v_traits) then v_bouncy:=v_bouncy+14; v_playful:=v_playful+7; end if;
  if 'Lazy'=any(v_traits) then v_sleepy:=v_sleepy+12; v_relaxed:=v_relaxed+13; end if;
  if 'Sleepy'=any(v_traits) then v_sleepy:=v_sleepy+20; v_relaxed:=v_relaxed+7; end if;
  if 'Affectionate'=any(v_traits) or 'Clingy'=any(v_traits) then v_cuddly:=v_cuddly+21; end if;
  if 'Curious'=any(v_traits) then v_curious:=v_curious+20; end if;
  if 'Adventurous'=any(v_traits) or 'Brave'=any(v_traits) then v_curious:=v_curious+10; v_bouncy:=v_bouncy+4; end if;
  if 'Playful'=any(v_traits) then v_playful:=v_playful+20; v_bouncy:=v_bouncy+6; end if;
  if 'Competitive'=any(v_traits) then v_focused:=v_focused+20; v_proud:=v_proud+8; end if;
  if 'Food Obsessed'=any(v_traits) then v_hungry:=v_hungry+12; end if;
  if 'Shy'=any(v_traits) then v_nervous:=v_nervous+17; v_relaxed:=v_relaxed+5; end if;
  if 'Calm'=any(v_traits) then v_relaxed:=v_relaxed+21; v_restless:=greatest(1,v_restless-3); end if;
  if 'Stubborn'=any(v_traits) then v_grumpy:=v_grumpy+6; v_focused:=v_focused+3; end if;
  if 'Mischievous'=any(v_traits) then v_playful:=v_playful+8; v_restless:=v_restless+5; end if;

  -- Current care can nudge the next several-hour mood, but needs themselves remain
  -- authoritative and are still solved by the existing care/autonomy system.
  if v_rest >= 62 then v_sleepy:=v_sleepy+18; v_reason:='care'; end if;
  if v_hunger >= 62 then v_hungry:=v_hungry+18; v_reason:='care'; end if;
  if v_fun >= 62 then v_restless:=v_restless+12; v_playful:=v_playful+7; v_reason:='care'; end if;
  if v_social >= 68 then v_cuddly:=v_cuddly+11; v_reason:='care'; end if;
  if greatest(v_rest,v_hunger,v_fun,v_social,v_hygiene) <= 34 then v_relaxed:=v_relaxed+12; end if;

  -- Recent life moments influence the next mood without becoming deterministic.
  if v_last_moment in ('training-practice','flight-practice') then v_focused:=v_focused+10; v_proud:=v_proud+5; v_reason:='recent-life'; end if;
  if v_last_moment in ('toy-carry','ball-chase','zoomies','bath-fun') then v_playful:=v_playful+8; v_bouncy:=v_bouncy+5; v_reason:='recent-life'; end if;
  if v_last_moment in ('return-home','bond','keeper-pet') then v_cuddly:=v_cuddly+8; v_reason:='recent-life'; end if;
  if v_last_moment in ('quiet-hide','cosy-nap') then v_relaxed:=v_relaxed+8; v_sleepy:=v_sleepy+5; v_reason:='recent-life'; end if;

  select finish_position, claimed_at
  into v_last_race_position, v_last_race_at
  from public.dragonbound_race_sessions
  where user_id=p_uid and claimed_at is not null and claimed_at >= clock_timestamp()-interval '18 hours'
  order by claimed_at desc
  limit 1;

  if v_last_race_at is not null then
    if v_last_race_position=1 then
      v_proud:=v_proud+22; v_bouncy:=v_bouncy+5; v_reason:='race';
    elsif 'Competitive'=any(v_traits) then
      v_focused:=v_focused+18; v_grumpy:=v_grumpy+3; v_reason:='race';
    else
      v_focused:=v_focused+6; v_reason:='race';
    end if;
  end if;

  v_total:=v_bouncy+v_sleepy+v_cuddly+v_curious+v_grumpy+v_focused+v_hungry+v_playful+v_nervous+v_proud+v_relaxed+v_restless;
  v_roll:=random()*greatest(v_total,1);

  v_roll:=v_roll-v_bouncy;
  if v_roll<=0 then v_mood:='Bouncy';
  else
    v_roll:=v_roll-v_sleepy;
    if v_roll<=0 then v_mood:='Sleepy';
    else
      v_roll:=v_roll-v_cuddly;
      if v_roll<=0 then v_mood:='Cuddly';
      else
        v_roll:=v_roll-v_curious;
        if v_roll<=0 then v_mood:='Curious';
        else
          v_roll:=v_roll-v_grumpy;
          if v_roll<=0 then v_mood:='Grumpy';
          else
            v_roll:=v_roll-v_focused;
            if v_roll<=0 then v_mood:='Focused';
            else
              v_roll:=v_roll-v_hungry;
              if v_roll<=0 then v_mood:='Hungry';
              else
                v_roll:=v_roll-v_playful;
                if v_roll<=0 then v_mood:='Playful';
                else
                  v_roll:=v_roll-v_nervous;
                  if v_roll<=0 then v_mood:='Nervous';
                  else
                    v_roll:=v_roll-v_proud;
                    if v_roll<=0 then v_mood:='Proud';
                    else
                      v_roll:=v_roll-v_relaxed;
                      if v_roll<=0 then v_mood:='Relaxed'; else v_mood:='Restless'; end if;
                    end if;
                  end if;
                end if;
              end if;
            end if;
          end if;
        end if;
      end if;
    end if;
  end if;

  -- A mood lasts long enough to define a visit, but changes often enough that the same
  -- dragon can feel different later in the day.
  v_expires:=v_started + interval '4 hours' + random()*interval '2 hours';

  if v_last_race_at is not null and v_last_race_position=1 and v_mood='Proud' then
    v_story:=format('%s is still carrying themselves like that last race win happened five minutes ago.',v_name);
  elsif v_last_race_at is not null and v_mood='Focused' then
    v_story:=format('%s seems determined to put in a little more practice after the last race.',v_name);
  elsif v_favourite<>'' and v_mood in ('Sleepy','Relaxed','Cuddly') then
    v_story:=format('%s keeps drifting back toward %s today, as if the rest of the house can wait.',v_name,v_favourite);
  elsif v_favourite<>'' and v_mood='Playful' then
    v_story:=format('%s keeps circling back to %s whenever there is a spare moment.',v_name,v_favourite);
  else
    v_story:=case v_mood
      when 'Bouncy' then format('%s woke up with far too much energy and has been looking for an excuse to use it.',v_name)
      when 'Sleepy' then format('%s seems determined to turn every comfortable corner into a nap spot today.',v_name)
      when 'Cuddly' then format('%s has been unusually interested in keeping close to you today.',v_name)
      when 'Curious' then format('%s is treating the house like it contains at least three undiscovered mysteries.',v_name)
      when 'Grumpy' then format('%s is having one of those tiny-dragon days where everything deserves a suspicious look.',v_name)
      when 'Focused' then format('%s has quietly decided that today is for practice and very little else.',v_name)
      when 'Hungry' then format('%s keeps finding perfectly innocent reasons to wander past the feeding area.',v_name)
      when 'Playful' then format('%s appears convinced that almost every object in the house might secretly be a toy.',v_name)
      when 'Nervous' then format('%s is taking the day slowly and sticking closer to familiar corners.',v_name)
      when 'Proud' then format('%s seems especially pleased with themselves today, and is making very little effort to hide it.',v_name)
      when 'Relaxed' then format('%s has settled into a wonderfully unhurried little routine today.',v_name)
      else format('%s cannot quite decide where to be today, so apparently everywhere will do.',v_name)
    end;
  end if;

  v_result:=jsonb_build_object(
    'version',1,
    'name',v_mood,
    'story',v_story,
    'reason',v_reason,
    'startedAt',to_char(v_started at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'expiresAt',to_char(v_expires at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );

  update public.dragonbound_profiles
  set dragon_mood=v_result, updated_at=clock_timestamp()
  where user_id=p_uid;

  return v_result;
end;
$function$;

create or replace function public.dragonbound_get_current_mood()
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'You must be signed in to read Dragonbound mood.'; end if;
  return public.dragonbound_ensure_mood(v_uid);
end;
$function$;

revoke all on function public.dragonbound_ensure_mood(uuid) from public;
revoke execute on function public.dragonbound_ensure_mood(uuid) from anon, authenticated;
grant execute on function public.dragonbound_get_current_mood() to authenticated;

-- Existing hatched dragons get their first several-hour mood immediately. The internal
-- generator is server-only, so this backfill does not expose a reroll endpoint to players.
do $backfill$
declare r record;
begin
  for r in select user_id from public.dragonbound_profiles where dragon_hatched_at is not null and coalesce(dragon_name,'')<>'' loop
    perform public.dragonbound_ensure_mood(r.user_id);
  end loop;
end;
$backfill$;
