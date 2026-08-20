-- Velmora Dragonbound V32.41 — account-scoped one-and-done adoption
-- This schema/migration has already been applied to the live Velmora Supabase project.
-- Kept in the patch as backup/reference.

create table if not exists public.dragonbound_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  locked_egg text,
  egg_claimed_at timestamptz,
  dragon_name text,
  breed_id text,
  dragon_hatched_at timestamptz,
  starter_house_id text,
  updated_at timestamptz not null default now()
);

alter table public.dragonbound_profiles enable row level security;

-- Authenticated clients may only read their own Dragonbound profile directly.
drop policy if exists dragonbound_profiles_select_own on public.dragonbound_profiles;
create policy dragonbound_profiles_select_own
on public.dragonbound_profiles for select
to authenticated
using (auth.uid() = user_id);

-- All writes are deliberately performed via vetted SECURITY DEFINER RPCs below.
drop policy if exists dragonbound_profiles_insert_own on public.dragonbound_profiles;
drop policy if exists dragonbound_profiles_update_own on public.dragonbound_profiles;

revoke all privileges on table public.dragonbound_profiles from authenticated;
grant select on table public.dragonbound_profiles to authenticated;

-- First egg claim is atomic and permanent for normal accounts.
-- Username Admin is the explicit testing exception and may reroll indefinitely.
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
    'Vardesh','Lumerre','Kordesh','Nambara','Norveth','Zafran','Elvane','Qasmir',
    'Calvora','Rovarn','Talune','Drazhen','Belros','Marovar','Sorevia','Iskandar',
    'Blackglass Coast','Skallheim','Hestholm Fjord','Nyrgate Aurora',
    'Warmvein / Krellhaven','Aurelia','Orsanne','Saint Ciro','Marenza','Grand Khor',
    'Rova End','Zafir Row','Ossa Mere','Ashwick / Cinderbank'
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

  update public.dragonbound_profiles
  set locked_egg = coalesce(locked_egg, p_egg_name),
      egg_claimed_at = coalesce(egg_claimed_at, now()),
      updated_at = now()
  where user_id = v_uid
  returning dragonbound_profiles.locked_egg into v_existing;

  locked_egg := v_existing;
  is_admin := false;
  return next;
end;
$$;

-- Starter houses remain free and swappable at any time.
-- Non-starter houses are not accepted by this RPC.
create or replace function public.dragonbound_set_starter_house(p_house_id text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_allowed constant text[] := array[
    'vardesh-hestholm-fjord-starter',
    'lumerre-greenhollow-starter',
    'nambara-naskor-edge-starter',
    'norveth-varka-fell-starter',
    'elvane-canto-plains-starter'
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
$$;

-- Normal accounts may only hatch/name the breed matching their locked egg.
-- Admin remains unrestricted for testing.
create or replace function public.dragonbound_name_dragon(p_dragon_name text, p_breed_id text)
returns table(dragon_name text, breed_id text, hatched_at timestamptz, is_admin boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_locked_egg text;
  v_expected_breed text;
  v_is_admin boolean := false;
  v_name text := btrim(coalesce(p_dragon_name,''));
begin
  if v_uid is null then
    raise exception 'You must be signed in to name a Dragonbound dragon.';
  end if;

  if char_length(v_name) < 1 or char_length(v_name) > 24 then
    raise exception 'Dragon names must be between 1 and 24 characters.';
  end if;

  select c.username into v_username
  from public.characters c
  where c.user_id = v_uid
  limit 1;

  if coalesce(v_username,'') = '' then
    raise exception 'Dragonbound character profile not found.';
  end if;

  v_is_admin := lower(v_username) = 'admin';

  select p.locked_egg into v_locked_egg
  from public.dragonbound_profiles p
  where p.user_id = v_uid;

  if not v_is_admin then
    if v_locked_egg is null then
      raise exception 'Adopt an egg before naming a dragon.';
    end if;

    v_expected_breed := trim(both '-' from regexp_replace(lower(v_locked_egg), '[^a-z0-9]+', '-', 'g'));

    if p_breed_id is distinct from v_expected_breed then
      raise exception 'That dragon does not match your locked Dragonbound egg.';
    end if;
  end if;

  insert into public.dragonbound_profiles(user_id, username, dragon_name, breed_id, dragon_hatched_at, updated_at)
  values(v_uid, v_username, v_name, p_breed_id, now(), now())
  on conflict (user_id) do update
    set username = excluded.username,
        dragon_name = excluded.dragon_name,
        breed_id = excluded.breed_id,
        dragon_hatched_at = excluded.dragon_hatched_at,
        updated_at = now();

  return query
  select v_name, p_breed_id, p.dragon_hatched_at, v_is_admin
  from public.dragonbound_profiles p
  where p.user_id = v_uid;
end;
$$;

revoke all on function public.dragonbound_claim_egg(text) from public;
grant execute on function public.dragonbound_claim_egg(text) to authenticated;

revoke all on function public.dragonbound_set_starter_house(text) from public;
grant execute on function public.dragonbound_set_starter_house(text) to authenticated;

revoke all on function public.dragonbound_name_dragon(text,text) from public;
grant execute on function public.dragonbound_name_dragon(text,text) to authenticated;

-- V32.41 launch reset. This was already executed on the live database.
-- It intentionally preserves starter_house_id so players may retain/swap their free starter home.
update public.dragonbound_profiles
set locked_egg = null,
    egg_claimed_at = null,
    dragon_name = null,
    breed_id = null,
    dragon_hatched_at = null,
    updated_at = now();
