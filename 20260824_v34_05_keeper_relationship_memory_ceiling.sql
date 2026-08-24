create or replace function public.dragonbound_save_behaviour(
  p_memory jsonb default null::jsonb,
  p_preferences jsonb default null::jsonb,
  p_discovered_traits jsonb default null::jsonb
)
returns table(dragon_memory jsonb, dragon_preferences jsonb, dragon_traits jsonb)
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_assigned jsonb;
  v_discovered jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'You must be signed in to save Dragonbound behaviour.';
  end if;

  if not exists (
    select 1
    from public.dragonbound_profiles dp
    where dp.user_id = v_uid
      and dp.dragon_hatched_at is not null
  ) then
    raise exception 'No hatched Dragonbound dragon was found.';
  end if;

  -- V34.05: keeper relationship history stays in the existing bounded
  -- dragon_memory snapshot. Existing profiles are already close to the old
  -- 18 KB ceiling, so expand only that safety guard rather than adding a
  -- duplicate relationship field/stat.
  if p_memory is not null and octet_length(p_memory::text) > 65536 then
    raise exception 'Dragon memory payload is too large.';
  end if;

  if p_preferences is not null and octet_length(p_preferences::text) > 8000 then
    raise exception 'Dragon preference payload is too large.';
  end if;

  if p_discovered_traits is not null and jsonb_typeof(p_discovered_traits) <> 'array' then
    raise exception 'Discovered traits must be an array.';
  end if;

  select coalesce(dp.dragon_traits->'assigned', '[]'::jsonb)
    into v_assigned
  from public.dragonbound_profiles dp
  where dp.user_id = v_uid;

  if p_discovered_traits is not null then
    select coalesce(jsonb_agg(s.v), '[]'::jsonb)
      into v_discovered
    from (
      select distinct to_jsonb(d.value) as v
      from jsonb_array_elements_text(p_discovered_traits) d(value)
      where v_assigned ? d.value
      limit 20
    ) s;
  else
    select coalesce(dp.dragon_traits->'discovered', '[]'::jsonb)
      into v_discovered
    from public.dragonbound_profiles dp
    where dp.user_id = v_uid;
  end if;

  update public.dragonbound_profiles dp
  set dragon_memory = coalesce(p_memory, dp.dragon_memory),
      dragon_preferences = coalesce(p_preferences, dp.dragon_preferences),
      dragon_traits = jsonb_set(dp.dragon_traits, '{discovered}', v_discovered, true),
      updated_at = clock_timestamp()
  where dp.user_id = v_uid;

  return query
  select dp.dragon_memory, dp.dragon_preferences, dp.dragon_traits
  from public.dragonbound_profiles dp
  where dp.user_id = v_uid;
end;
$function$;
