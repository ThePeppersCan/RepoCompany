-- V32.42 Dragonbound adoption hotfix
-- Fixes PL/pgSQL output-column ambiguity in dragonbound_claim_egg().
-- This migration has already been applied to the connected Supabase project.

create or replace function public.dragonbound_claim_egg(p_egg_name text)
returns table(locked_egg text, is_admin boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_existing text;
  v_is_admin boolean := false;
  v_valid_eggs constant text[] := array[
    'Vardesh','Lumerre','Kordesh','Nambara','Norveth','Zafran','Elvane','Qasmir','Calvora','Rovarn','Talune','Drazhen','Belros','Marovar','Sorevia','Iskandar','Blackglass Coast','Skallheim','Hestholm Fjord','Nyrgate Aurora','Warmvein / Krellhaven','Aurelia','Orsanne','Saint Ciro','Marenza','Grand Khor','Rova End','Zafir Row','Ossa Mere','Ashwick / Cinderbank'
  ];
begin
  if v_uid is null then
    raise exception 'You must be signed in to adopt a Dragonbound egg.';
  end if;

  if not (p_egg_name = any(v_valid_eggs)) then
    raise exception 'Unknown Dragonbound egg type.';
  end if;

  select c.username into v_username
  from public.characters c
  where c.user_id = v_uid
  limit 1;

  if coalesce(v_username,'') = '' then
    raise exception 'Dragonbound character profile not found.';
  end if;

  v_is_admin := lower(v_username) = 'admin';

  insert into public.dragonbound_profiles(user_id, username, updated_at)
  values(v_uid, v_username, now())
  on conflict (user_id) do update
    set username = excluded.username,
        updated_at = now();

  if v_is_admin then
    locked_egg := p_egg_name;
    is_admin := true;
    return next;
    return;
  end if;

  update public.dragonbound_profiles as dp
  set locked_egg = coalesce(dp.locked_egg, p_egg_name),
      egg_claimed_at = coalesce(dp.egg_claimed_at, now()),
      updated_at = now()
  where dp.user_id = v_uid
  returning dp.locked_egg into v_existing;

  locked_egg := v_existing;
  is_admin := false;
  return next;
end;
$$;

revoke all on function public.dragonbound_claim_egg(text) from public;
grant execute on function public.dragonbound_claim_egg(text) to authenticated;
