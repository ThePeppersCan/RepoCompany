-- V34.08 — Dragon Friendships, Rivalries & Playdates
create table if not exists public.dragonbound_social_relationships (
  user_low uuid not null references auth.users(id) on delete cascade,
  user_high uuid not null references auth.users(id) on delete cascade,
  familiarity integer not null default 0 check (familiarity between 0 and 100),
  friendship integer not null default 0 check (friendship between 0 and 100),
  rivalry integer not null default 0 check (rivalry between 0 and 100),
  nervousness integer not null default 0 check (nervousness between 0 and 100),
  trust integer not null default 0 check (trust between 0 and 100),
  meeting_count integer not null default 0 check (meeting_count >= 0),
  play_count integer not null default 0 check (play_count >= 0),
  shared_nap_count integer not null default 0 check (shared_nap_count >= 0),
  training_count integer not null default 0 check (training_count >= 0),
  chase_count integer not null default 0 check (chase_count >= 0),
  positive_interactions integer not null default 0 check (positive_interactions >= 0),
  rivalry_interactions integer not null default 0 check (rivalry_interactions >= 0),
  nervous_interactions integer not null default 0 check (nervous_interactions >= 0),
  favourite_shared_activity text,
  first_met_at timestamptz,
  last_met_at timestamptz,
  last_interaction_at timestamptz,
  last_interaction_type text,
  last_credit_at timestamptz,
  recent_history jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_low,user_high),
  check (user_low <> user_high)
);

create index if not exists dragonbound_social_relationships_low_idx on public.dragonbound_social_relationships(user_low);
create index if not exists dragonbound_social_relationships_high_idx on public.dragonbound_social_relationships(user_high);

alter table public.dragonbound_social_relationships enable row level security;
drop policy if exists dragonbound_social_relationships_read_own on public.dragonbound_social_relationships;
create policy dragonbound_social_relationships_read_own on public.dragonbound_social_relationships
for select to authenticated
using (auth.uid() = user_low or auth.uid() = user_high);

create table if not exists public.dragonbound_playdates (
  playdate_id uuid primary key default gen_random_uuid(),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  ended_at timestamptz,
  end_reason text,
  metadata jsonb not null default '{}'::jsonb,
  check (host_user_id <> guest_user_id)
);
create index if not exists dragonbound_playdates_host_active_idx on public.dragonbound_playdates(host_user_id,ended_at,expires_at);
create index if not exists dragonbound_playdates_guest_idx on public.dragonbound_playdates(guest_user_id,started_at desc);
alter table public.dragonbound_playdates enable row level security;
drop policy if exists dragonbound_playdates_read_participant on public.dragonbound_playdates;
create policy dragonbound_playdates_read_participant on public.dragonbound_playdates
for select to authenticated
using (auth.uid() = host_user_id or auth.uid() = guest_user_id);

create or replace function public.dragonbound_social_label(
  p_familiarity integer,
  p_friendship integer,
  p_rivalry integer,
  p_nervousness integer,
  p_meetings integer,
  p_play_count integer
) returns text
language sql immutable
set search_path = public
as $$
  select case
    when coalesce(p_nervousness,0) >= 58 and coalesce(p_friendship,0) < 34 then 'Nervous Around'
    when coalesce(p_rivalry,0) >= 68 and coalesce(p_friendship,0) >= 34 then 'Competitive Rival'
    when coalesce(p_rivalry,0) >= 58 then 'Rival'
    when coalesce(p_friendship,0) >= 88 and coalesce(p_meetings,0) >= 12 then 'Best Friend'
    when coalesce(p_friendship,0) >= 70 and coalesce(p_meetings,0) >= 8 then 'Close Friend'
    when coalesce(p_play_count,0) >= 6 and coalesce(p_friendship,0) >= 48 then 'Playmate'
    when coalesce(p_friendship,0) >= 42 and coalesce(p_meetings,0) >= 4 then 'Friend'
    when coalesce(p_familiarity,0) >= 18 or coalesce(p_meetings,0) >= 2 then 'Familiar'
    when coalesce(p_meetings,0) >= 1 then 'Curious About'
    else 'Stranger'
  end;
$$;
revoke all on function public.dragonbound_social_label(integer,integer,integer,integer,integer,integer) from public;

create or replace function public.dragonbound_get_social_relationships()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select coalesce(jsonb_agg(x.obj order by lower(x.other_name)), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'otherUserId', other_p.user_id,
      'username', other_p.username,
      'dragonName', other_p.dragon_name,
      'breedId', other_p.breed_id,
      'gender', other_p.gender,
      'houseId', other_p.starter_house_id,
      'relationshipType', public.dragonbound_social_label(r.familiarity,r.friendship,r.rivalry,r.nervousness,r.meeting_count,r.play_count),
      'familiarity', r.familiarity,
      'friendship', r.friendship,
      'rivalry', r.rivalry,
      'nervousness', r.nervousness,
      'trust', r.trust,
      'meetingCount', r.meeting_count,
      'playCount', r.play_count,
      'sharedNapCount', r.shared_nap_count,
      'trainingCount', r.training_count,
      'chaseCount', r.chase_count,
      'positiveInteractions', r.positive_interactions,
      'firstMetAt', r.first_met_at,
      'lastMetAt', r.last_met_at,
      'lastInteractionAt', r.last_interaction_at,
      'favouriteSharedActivity', r.favourite_shared_activity,
      'recentHistory', coalesce(r.recent_history,'[]'::jsonb)
    ) obj,
    other_p.username as other_name
    from public.dragonbound_social_relationships r
    join public.dragonbound_profiles other_p
      on other_p.user_id = case when r.user_low = v_uid then r.user_high else r.user_low end
    where (r.user_low = v_uid or r.user_high = v_uid)
      and other_p.dragon_hatched_at is not null
      and other_p.dragon_name is not null
  ) x;
  return v_result;
end;
$$;
revoke all on function public.dragonbound_get_social_relationships() from public;
grant execute on function public.dragonbound_get_social_relationships() to authenticated;

create or replace function public.dragonbound_get_relationship(p_other_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_low uuid; v_high uuid; r public.dragonbound_social_relationships%rowtype; other_p public.dragonbound_profiles%rowtype;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_other_user_id is null or p_other_user_id = v_uid then return null; end if;
  select * into other_p from public.dragonbound_profiles where user_id=p_other_user_id and dragon_hatched_at is not null and dragon_name is not null;
  if not found then raise exception 'That keeper does not have a hatched dragon.'; end if;
  if v_uid::text < p_other_user_id::text then v_low:=v_uid; v_high:=p_other_user_id; else v_low:=p_other_user_id; v_high:=v_uid; end if;
  select * into r from public.dragonbound_social_relationships where user_low=v_low and user_high=v_high;
  if not found then
    return jsonb_build_object('otherUserId',p_other_user_id,'username',other_p.username,'dragonName',other_p.dragon_name,'breedId',other_p.breed_id,'relationshipType','Stranger','meetingCount',0,'friendship',0,'rivalry',0,'nervousness',0,'trust',0,'recentHistory','[]'::jsonb);
  end if;
  return jsonb_build_object(
    'otherUserId',p_other_user_id,'username',other_p.username,'dragonName',other_p.dragon_name,'breedId',other_p.breed_id,'gender',other_p.gender,
    'relationshipType',public.dragonbound_social_label(r.familiarity,r.friendship,r.rivalry,r.nervousness,r.meeting_count,r.play_count),
    'familiarity',r.familiarity,'friendship',r.friendship,'rivalry',r.rivalry,'nervousness',r.nervousness,'trust',r.trust,'meetingCount',r.meeting_count,
    'playCount',r.play_count,'sharedNapCount',r.shared_nap_count,'trainingCount',r.training_count,'chaseCount',r.chase_count,
    'firstMetAt',r.first_met_at,'lastMetAt',r.last_met_at,'lastInteractionAt',r.last_interaction_at,'favouriteSharedActivity',r.favourite_shared_activity,'recentHistory',coalesce(r.recent_history,'[]'::jsonb)
  );
end;
$$;
revoke all on function public.dragonbound_get_relationship(uuid) from public;
grant execute on function public.dragonbound_get_relationship(uuid) to authenticated;

create or replace function public.dragonbound_record_social_interaction(p_other_user_id uuid, p_interaction_type text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid(); v_low uuid; v_high uuid; v_type text := lower(trim(coalesce(p_interaction_type,'')));
  r public.dragonbound_social_relationships%rowtype; v_now timestamptz := clock_timestamp(); v_credit boolean := true;
  v_friend integer:=0; v_rival integer:=0; v_nerv integer:=0; v_trust integer:=0; v_familiar integer:=0;
  v_play integer:=0; v_nap integer:=0; v_train integer:=0; v_chase integer:=0; v_positive integer:=0; v_rival_count integer:=0; v_nerv_count integer:=0;
  v_activity text := null; v_hist jsonb;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_other_user_id is null or p_other_user_id=v_uid then raise exception 'Invalid social partner.'; end if;
  if v_type not in ('meeting','greeting','play','chase','shared_nap','training','toy_share','copycat','window_watch','follow','show_off','rival_challenge','hide_seek','food_negotiation','calm_proximity','avoid','nervous_retreat') then raise exception 'Unsupported social interaction.'; end if;
  if not exists(select 1 from public.dragonbound_profiles where user_id=v_uid and dragon_hatched_at is not null) or not exists(select 1 from public.dragonbound_profiles where user_id=p_other_user_id and dragon_hatched_at is not null) then raise exception 'Both keepers need hatched dragons.'; end if;
  if v_uid::text < p_other_user_id::text then v_low:=v_uid;v_high:=p_other_user_id;else v_low:=p_other_user_id;v_high:=v_uid;end if;
  insert into public.dragonbound_social_relationships(user_low,user_high) values(v_low,v_high) on conflict do nothing;
  select * into r from public.dragonbound_social_relationships where user_low=v_low and user_high=v_high for update;
  if r.last_credit_at is not null and r.last_credit_at > v_now - interval '18 seconds' then v_credit:=false; end if;
  if r.last_interaction_type=v_type and r.last_interaction_at is not null and r.last_interaction_at > v_now - interval '75 seconds' then v_credit:=false; end if;
  if v_credit then
    v_familiar:=case when v_type='meeting' then 5 else 1 end;
    if v_type in ('greeting','play','chase','shared_nap','training','toy_share','copycat','window_watch','follow','hide_seek','food_negotiation','calm_proximity') then v_friend:=case when v_type in ('shared_nap','toy_share','calm_proximity') then 4 else 3 end; v_trust:=2; v_positive:=1; end if;
    if v_type in ('training','show_off','rival_challenge','chase') then v_rival:=case when v_type='rival_challenge' then 5 else 2 end; v_rival_count:=1; end if;
    if v_type in ('avoid','nervous_retreat') then v_nerv:=4; v_nerv_count:=1; end if;
    if v_type='play' or v_type='toy_share' or v_type='hide_seek' then v_play:=1; v_activity:='Playing'; end if;
    if v_type='shared_nap' then v_nap:=1; v_activity:='Resting together'; end if;
    if v_type='training' or v_type='show_off' or v_type='rival_challenge' then v_train:=1; v_activity:='Training'; end if;
    if v_type='chase' then v_chase:=1; v_activity:='Chasing'; end if;
    if v_type='window_watch' then v_activity:='Watching the world'; end if;
    if v_type='food_negotiation' then v_activity:='Food negotiations'; end if;
  end if;
  v_hist:=coalesce(r.recent_history,'[]'::jsonb) || jsonb_build_array(jsonb_build_object('type',v_type,'at',v_now));
  if jsonb_array_length(v_hist)>12 then v_hist:=jsonb_path_query_array(v_hist,'$[last - 11 to last]'); end if;
  update public.dragonbound_social_relationships
  set familiarity=least(100,familiarity+v_familiar), friendship=least(100,friendship+v_friend), rivalry=least(100,rivalry+v_rival), nervousness=least(100,greatest(0,nervousness+v_nerv-(case when v_friend>0 then 1 else 0 end))), trust=least(100,trust+v_trust),
      meeting_count=meeting_count + case when v_credit and v_type='meeting' and (last_met_at is null or last_met_at < v_now-interval '30 minutes') then 1 else 0 end,
      play_count=play_count+v_play, shared_nap_count=shared_nap_count+v_nap, training_count=training_count+v_train, chase_count=chase_count+v_chase,
      positive_interactions=positive_interactions+v_positive, rivalry_interactions=rivalry_interactions+v_rival_count, nervous_interactions=nervous_interactions+v_nerv_count,
      first_met_at=coalesce(first_met_at,case when v_type='meeting' then v_now else first_met_at end), last_met_at=case when v_type='meeting' then v_now else last_met_at end,
      last_interaction_at=v_now,last_interaction_type=v_type,last_credit_at=case when v_credit then v_now else last_credit_at end,
      favourite_shared_activity=coalesce(v_activity,favourite_shared_activity), recent_history=v_hist, updated_at=v_now
  where user_low=v_low and user_high=v_high;
  return public.dragonbound_get_relationship(p_other_user_id);
end;
$$;
revoke all on function public.dragonbound_record_social_interaction(uuid,text) from public;
grant execute on function public.dragonbound_record_social_interaction(uuid,text) to authenticated;

create or replace function public.dragonbound_start_playdate(p_other_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid:=auth.uid(); v_id uuid; v_expires timestamptz:=clock_timestamp()+interval '15 minutes'; v_rel jsonb;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_other_user_id is null or p_other_user_id=v_uid then raise exception 'Choose another keeper''s dragon.'; end if;
  if not exists(select 1 from public.dragonbound_profiles where user_id=v_uid and dragon_hatched_at is not null and starter_house_id is not null) then raise exception 'Your dragon needs a home before hosting a playdate.'; end if;
  if not exists(select 1 from public.dragonbound_profiles where user_id=p_other_user_id and dragon_hatched_at is not null) then raise exception 'That keeper does not have a hatched dragon.'; end if;
  update public.dragonbound_playdates set ended_at=clock_timestamp(),end_reason='replaced' where host_user_id=v_uid and ended_at is null and expires_at>clock_timestamp();
  insert into public.dragonbound_playdates(host_user_id,guest_user_id,expires_at) values(v_uid,p_other_user_id,v_expires) returning playdate_id into v_id;
  v_rel:=public.dragonbound_record_social_interaction(p_other_user_id,'meeting');
  return jsonb_build_object('playdateId',v_id,'hostUserId',v_uid,'guestUserId',p_other_user_id,'startedAt',clock_timestamp(),'expiresAt',v_expires,'relationship',v_rel);
end;
$$;
revoke all on function public.dragonbound_start_playdate(uuid) from public;
grant execute on function public.dragonbound_start_playdate(uuid) to authenticated;

create or replace function public.dragonbound_get_active_playdate()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_uid uuid:=auth.uid(); p public.dragonbound_playdates%rowtype; guest public.dragonbound_profiles%rowtype; rel jsonb;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  select * into p from public.dragonbound_playdates where host_user_id=v_uid and ended_at is null and expires_at>clock_timestamp() order by started_at desc limit 1;
  if not found then return null; end if;
  select * into guest from public.dragonbound_profiles where user_id=p.guest_user_id;
  rel:=public.dragonbound_get_relationship(p.guest_user_id);
  return jsonb_build_object('playdateId',p.playdate_id,'guestUserId',p.guest_user_id,'startedAt',p.started_at,'expiresAt',p.expires_at,'relationship',rel,'guest',jsonb_build_object('name',guest.dragon_name,'breedId',guest.breed_id,'gender',guest.gender,'personality',coalesce(guest.personality,'{}'::jsonb),'traits',coalesce(guest.dragon_traits,'{}'::jsonb),'preferences',coalesce(guest.dragon_preferences,'{}'::jsonb)));
end;
$$;
revoke all on function public.dragonbound_get_active_playdate() from public;
grant execute on function public.dragonbound_get_active_playdate() to authenticated;

create or replace function public.dragonbound_end_playdate(p_playdate_id uuid, p_reason text default 'ended')
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_uid uuid:=auth.uid(); v_count int;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  update public.dragonbound_playdates set ended_at=coalesce(ended_at,clock_timestamp()),end_reason=coalesce(nullif(trim(p_reason),''),'ended') where playdate_id=p_playdate_id and host_user_id=v_uid and ended_at is null;
  get diagnostics v_count=row_count;
  return v_count>0;
end;
$$;
revoke all on function public.dragonbound_end_playdate(uuid,text) from public;
grant execute on function public.dragonbound_end_playdate(uuid,text) to authenticated;

-- Supabase explicitly grants RPC execution to anon by default in this project; remove it for social writes/reads.
revoke execute on function public.dragonbound_get_social_relationships() from anon;
revoke execute on function public.dragonbound_get_relationship(uuid) from anon;
revoke execute on function public.dragonbound_record_social_interaction(uuid,text) from anon;
revoke execute on function public.dragonbound_start_playdate(uuid) from anon;
revoke execute on function public.dragonbound_get_active_playdate() from anon;
revoke execute on function public.dragonbound_end_playdate(uuid,text) from anon;
