-- V34.06 — Learned Routines & Little Dragon Rituals
-- Also fixes furniture becoming stranded in a previous starter house when the keeper moves.

create table if not exists public.dragonbound_learned_routines (
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_key text not null,
  category text not null,
  trigger_type text not null,
  response_type text not null,
  target_placement_id uuid null,
  target_item_id text null,
  target_name text null,
  target_house_id text null,
  observations integer not null default 0 check (observations >= 0),
  successes integer not null default 0 check (successes >= 0),
  opportunity_weight numeric(10,2) not null default 0 check (opportunity_weight >= 0),
  success_weight numeric(10,2) not null default 0 check (success_weight >= 0),
  confidence numeric(6,4) not null default 0 check (confidence >= 0 and confidence <= 1),
  status text not null default 'forming' check (status in ('forming','recognized','established','dormant')),
  first_observed_at timestamptz not null default now(),
  last_observed_at timestamptz not null default now(),
  recognised_at timestamptz null,
  established_at timestamptz null,
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key (user_id, routine_key)
);

create index if not exists dragonbound_learned_routines_user_trigger_idx
  on public.dragonbound_learned_routines(user_id, trigger_type, status);
create index if not exists dragonbound_learned_routines_target_idx
  on public.dragonbound_learned_routines(user_id, target_placement_id)
  where target_placement_id is not null;

alter table public.dragonbound_learned_routines enable row level security;
drop policy if exists dragonbound_learned_routines_select_own on public.dragonbound_learned_routines;
create policy dragonbound_learned_routines_select_own
  on public.dragonbound_learned_routines
  for select to authenticated
  using (auth.uid() = user_id);

revoke all on public.dragonbound_learned_routines from anon;
revoke insert, update, delete on public.dragonbound_learned_routines from authenticated;
grant select on public.dragonbound_learned_routines to authenticated;

create or replace function public.dragonbound_get_learned_routines()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_uid uuid := auth.uid();
  v_rows jsonb;
begin
  if v_uid is null then
    raise exception 'You must be signed in to read Dragonbound routines.';
  end if;

  -- A placement-specific ritual becomes dormant if its physical target no longer exists.
  update public.dragonbound_learned_routines r
  set status = 'dormant', updated_at = now()
  where r.user_id = v_uid
    and r.target_placement_id is not null
    and r.status <> 'dormant'
    and not exists (
      select 1 from public.dragonbound_house_furniture f
      where f.user_id = v_uid and f.placement_id = r.target_placement_id
    );

  -- If the exact placement returns (for example after a temporary state repair), allow the
  -- routine to become visible again at the stage its evidence already supports.
  update public.dragonbound_learned_routines r
  set status = case
        when r.success_weight >= 7 and r.confidence >= .60 then 'established'
        when r.success_weight >= 4 and r.confidence >= .55 then 'recognized'
        else 'forming'
      end,
      updated_at = now()
  where r.user_id = v_uid
    and r.target_placement_id is not null
    and r.status = 'dormant'
    and exists (
      select 1 from public.dragonbound_house_furniture f
      where f.user_id = v_uid and f.placement_id = r.target_placement_id
    );

  select coalesce(jsonb_agg(jsonb_build_object(
    'key', r.routine_key,
    'category', r.category,
    'trigger', r.trigger_type,
    'response', r.response_type,
    'targetPlacementId', r.target_placement_id,
    'targetItemId', r.target_item_id,
    'targetName', r.target_name,
    'targetHouseId', r.target_house_id,
    'observations', r.observations,
    'successes', r.successes,
    'confidence', round(r.confidence::numeric, 3),
    'status', r.status,
    'firstObservedAt', r.first_observed_at,
    'lastObservedAt', r.last_observed_at,
    'recognisedAt', r.recognised_at,
    'establishedAt', r.established_at
  ) order by
    case r.status when 'established' then 0 when 'recognized' then 1 when 'forming' then 2 else 3 end,
    r.confidence desc,
    r.success_weight desc,
    r.last_observed_at desc), '[]'::jsonb)
  into v_rows
  from public.dragonbound_learned_routines r
  where r.user_id = v_uid;

  return jsonb_build_object('version', 1, 'routines', v_rows);
end;
$function$;

create or replace function public.dragonbound_record_routine_observations(p_events jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_uid uuid := auth.uid();
  v_event jsonb;
  v_trigger text;
  v_response text;
  v_category text;
  v_placement uuid;
  v_item text;
  v_name text;
  v_house text;
  v_weight numeric(10,2);
  v_key text;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'You must be signed in to save Dragonbound routines.';
  end if;
  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    raise exception 'Routine observations must be an array.';
  end if;
  v_count := jsonb_array_length(p_events);
  if v_count > 20 then raise exception 'Too many routine observations in one save.'; end if;
  if octet_length(p_events::text) > 18000 then raise exception 'Routine observation payload is too large.'; end if;

  for v_event in select value from jsonb_array_elements(p_events)
  loop
    v_trigger := lower(trim(coalesce(v_event->>'trigger','')));
    v_response := lower(trim(coalesce(v_event->>'response','')));
    if v_trigger = '' or v_response = '' then continue; end if;
    if v_trigger !~ '^[a-z0-9:_-]{1,48}$' or v_response !~ '^[a-z0-9:_-]{1,48}$' then continue; end if;

    v_category := case
      when v_trigger = 'wake' then 'wake'
      when v_trigger = 'bedtime' then 'bedtime'
      when v_trigger = 'eat' then 'after_eating'
      when v_trigger = 'bath' then 'after_bath'
      when v_trigger = 'play' then 'after_play'
      when v_trigger = 'training' then 'after_training'
      when v_trigger like 'keeper_%' then 'keeper'
      when v_trigger in ('race_win','race_loss') then 'race'
      when v_trigger = 'unsettled' then 'safe_place'
      when v_trigger like 'period:%' then 'time_of_day'
      when v_trigger like 'room:%' then 'room'
      else 'general'
    end;

    v_weight := case when coalesce((v_event->>'autonomous')::boolean, true) then 1.00 else 0.25 end;
    v_placement := null; v_item := null; v_name := null; v_house := null;
    begin v_placement := nullif(v_event->>'targetPlacementId','')::uuid; exception when others then v_placement := null; end;
    if v_placement is not null then
      select f.item_id, c.name, f.house_id
      into v_item, v_name, v_house
      from public.dragonbound_house_furniture f
      left join public.dragonbound_furniture_catalog c on c.item_id = f.item_id
      where f.user_id = v_uid and f.placement_id = v_placement
      limit 1;
      if v_item is null then v_placement := null; end if;
    end if;

    -- Every response to this trigger is an opportunity for all existing candidate rituals.
    update public.dragonbound_learned_routines r
    set observations = r.observations + 1,
        opportunity_weight = least(9999, r.opportunity_weight + v_weight),
        last_observed_at = now(),
        updated_at = now()
    where r.user_id = v_uid and r.trigger_type = v_trigger and r.status <> 'dormant';

    v_key := v_category || ':' || md5(v_trigger || '|' || v_response || '|' || coalesce(v_placement::text,''));

    insert into public.dragonbound_learned_routines(
      user_id,routine_key,category,trigger_type,response_type,target_placement_id,target_item_id,target_name,target_house_id,
      observations,successes,opportunity_weight,success_weight,confidence,status,first_observed_at,last_observed_at,updated_at
    ) values (
      v_uid,v_key,v_category,v_trigger,v_response,v_placement,v_item,left(v_name,90),v_house,
      1,1,v_weight,v_weight,1,'forming',now(),now(),now()
    )
    on conflict (user_id,routine_key) do update
      set successes = public.dragonbound_learned_routines.successes + 1,
          success_weight = least(9999, public.dragonbound_learned_routines.success_weight + v_weight),
          target_item_id = coalesce(excluded.target_item_id, public.dragonbound_learned_routines.target_item_id),
          target_name = coalesce(excluded.target_name, public.dragonbound_learned_routines.target_name),
          target_house_id = coalesce(excluded.target_house_id, public.dragonbound_learned_routines.target_house_id),
          last_observed_at = now(), updated_at = now();

    update public.dragonbound_learned_routines r
    set confidence = least(1, case when r.opportunity_weight <= 0 then 0 else r.success_weight / r.opportunity_weight end),
        status = case
          when r.status = 'dormant' then 'dormant'
          when r.status = 'established' and (case when r.opportunity_weight <= 0 then 0 else r.success_weight / r.opportunity_weight end) >= .34 then 'established'
          when r.success_weight >= 7 and (case when r.opportunity_weight <= 0 then 0 else r.success_weight / r.opportunity_weight end) >= .60 then 'established'
          when r.status in ('recognized','established') and (case when r.opportunity_weight <= 0 then 0 else r.success_weight / r.opportunity_weight end) >= .38 then 'recognized'
          when r.success_weight >= 4 and (case when r.opportunity_weight <= 0 then 0 else r.success_weight / r.opportunity_weight end) >= .55 then 'recognized'
          else 'forming'
        end,
        recognised_at = case
          when r.recognised_at is null and r.success_weight >= 4 and (case when r.opportunity_weight <= 0 then 0 else r.success_weight / r.opportunity_weight end) >= .55 then now()
          else r.recognised_at end,
        established_at = case
          when r.established_at is null and r.success_weight >= 7 and (case when r.opportunity_weight <= 0 then 0 else r.success_weight / r.opportunity_weight end) >= .60 then now()
          else r.established_at end,
        updated_at = now()
    where r.user_id = v_uid and r.trigger_type = v_trigger;
  end loop;

  -- Keep the table compact: throw away very old weak candidates and cap weak rows.
  delete from public.dragonbound_learned_routines r
  where r.user_id = v_uid and r.status = 'forming'
    and r.last_observed_at < now() - interval '45 days'
    and r.success_weight < 3;

  delete from public.dragonbound_learned_routines r
  where r.user_id = v_uid and r.status = 'forming'
    and r.routine_key in (
      select x.routine_key from public.dragonbound_learned_routines x
      where x.user_id = v_uid and x.status = 'forming'
      order by x.success_weight desc, x.last_observed_at desc
      offset 36
    );

  return public.dragonbound_get_learned_routines();
end;
$function$;

revoke all on function public.dragonbound_get_learned_routines() from public, anon;
revoke all on function public.dragonbound_record_routine_observations(jsonb) from public, anon;
grant execute on function public.dragonbound_get_learned_routines() to authenticated;
grant execute on function public.dragonbound_record_routine_observations(jsonb) to authenticated;

-- Moving house packs furniture from every other house back into Build Inventory. Different
-- floor plans make silently transplanting the old coordinates unsafe, so packing is explicit.
create or replace function public.dragonbound_set_starter_house(p_house_id text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_allowed constant text[] := array[
    'vardesh-hestholm-fjord-starter','lumerre-greenhollow-starter','nambara-naskor-edge-starter',
    'norveth-varka-fell-starter','elvane-canto-plains-starter','sorevia-lakeside-starter',
    'iskandar-moonlit-starter','drazhen-ashlands-starter','rovarn-redstone-starter','marovar-crescent-starter'
  ];
begin
  if v_uid is null then raise exception 'You must be signed in to choose a Dragonbound starter home.'; end if;
  if not (p_house_id = any(v_allowed)) then raise exception 'Only starter homes can currently be selected.'; end if;
  select c.username into v_username from public.characters c where c.user_id=v_uid limit 1;
  if coalesce(v_username,'')='' then raise exception 'Dragonbound character profile not found.'; end if;

  insert into public.dragonbound_furniture_inventory(user_id,item_id,owned_quantity,available_quantity,acquired_at,updated_at)
  select v_uid, f.item_id, count(*)::int, count(*)::int, now(), now()
  from public.dragonbound_house_furniture f
  where f.user_id=v_uid and f.house_id is distinct from p_house_id
  group by f.item_id
  on conflict (user_id,item_id) do update
    set owned_quantity = greatest(public.dragonbound_furniture_inventory.owned_quantity,
                                  public.dragonbound_furniture_inventory.available_quantity + excluded.available_quantity),
        available_quantity = least(
          greatest(public.dragonbound_furniture_inventory.owned_quantity,
                   public.dragonbound_furniture_inventory.available_quantity + excluded.available_quantity),
          public.dragonbound_furniture_inventory.available_quantity + excluded.available_quantity
        ),
        updated_at=now();

  delete from public.dragonbound_house_furniture f
  where f.user_id=v_uid and f.house_id is distinct from p_house_id;

  insert into public.dragonbound_profiles(user_id,username,starter_house_id,updated_at)
  values(v_uid,v_username,p_house_id,now())
  on conflict(user_id) do update set username=excluded.username,starter_house_id=excluded.starter_house_id,updated_at=now();
  return p_house_id;
end;
$function$;

-- One-time repair for furniture already stranded by earlier house swaps.
with packed as (
  select f.user_id, f.item_id, count(*)::int as qty
  from public.dragonbound_house_furniture f
  join public.dragonbound_profiles p on p.user_id=f.user_id
  where p.starter_house_id is not null and f.house_id is distinct from p.starter_house_id
  group by f.user_id,f.item_id
)
insert into public.dragonbound_furniture_inventory(user_id,item_id,owned_quantity,available_quantity,acquired_at,updated_at)
select user_id,item_id,qty,qty,now(),now() from packed
on conflict(user_id,item_id) do update
set owned_quantity=greatest(public.dragonbound_furniture_inventory.owned_quantity,
                            public.dragonbound_furniture_inventory.available_quantity+excluded.available_quantity),
    available_quantity=least(
      greatest(public.dragonbound_furniture_inventory.owned_quantity,
               public.dragonbound_furniture_inventory.available_quantity+excluded.available_quantity),
      public.dragonbound_furniture_inventory.available_quantity+excluded.available_quantity
    ),
    updated_at=now();

delete from public.dragonbound_house_furniture f
using public.dragonbound_profiles p
where p.user_id=f.user_id and p.starter_house_id is not null and f.house_id is distinct from p.starter_house_id;
