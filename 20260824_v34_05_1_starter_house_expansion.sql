
-- V34.05.1 — Starter house expansion
create or replace function public.dragonbound_set_starter_house(p_house_id text)
returns text
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_allowed constant text[] := array[
    'vardesh-hestholm-fjord-starter',
    'lumerre-greenhollow-starter',
    'nambara-naskor-edge-starter',
    'norveth-varka-fell-starter',
    'elvane-canto-plains-starter',
    'sorevia-lakeside-starter',
    'iskandar-moonlit-starter',
    'drazhen-ashlands-starter',
    'rovarn-redstone-starter',
    'marovar-crescent-starter'
  ];
begin
  if v_uid is null then
    raise exception 'You must be signed in to choose a Dragonbound starter home.';
  end if;
  if not (p_house_id = any(v_allowed)) then
    raise exception 'Only starter homes can currently be selected.';
  end if;

  select c.username into v_username
  from public.characters c
  where c.user_id = v_uid
  limit 1;

  if coalesce(v_username,'') = '' then
    raise exception 'Dragonbound character profile not found.';
  end if;

  insert into public.dragonbound_profiles(user_id, username, starter_house_id, updated_at)
  values(v_uid, v_username, p_house_id, now())
  on conflict (user_id) do update
    set username = excluded.username,
        starter_house_id = excluded.starter_house_id,
        updated_at = now();

  return p_house_id;
end;
$function$;

revoke all on function public.dragonbound_set_starter_house(text) from public;
revoke all on function public.dragonbound_set_starter_house(text) from anon;
grant execute on function public.dragonbound_set_starter_house(text) to authenticated;
