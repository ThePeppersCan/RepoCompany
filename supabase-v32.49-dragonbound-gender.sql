-- Dragonbound V32.49 — persistent random dragon genders.
-- This migration has already been applied to the live Supabase project.

alter table public.dragonbound_profiles
  add column if not exists gender text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'dragonbound_profiles_gender_check'
      and conrelid = 'public.dragonbound_profiles'::regclass
  ) then
    alter table public.dragonbound_profiles
      add constraint dragonbound_profiles_gender_check
      check (gender is null or gender in ('male','female'));
  end if;
end $$;

update public.dragonbound_profiles
set gender = 'male', updated_at = now()
where lower(username) = lower('CatAsthma')
  and lower(coalesce(dragon_name,'')) = lower('September');

update public.dragonbound_profiles
set gender = 'female', updated_at = now()
where lower(username) = lower('Emlux')
  and lower(coalesce(dragon_name,'')) = lower('Turi');

update public.dragonbound_profiles
set gender = 'male', updated_at = now()
where lower(username) = lower('CovidPanda')
  and lower(coalesce(dragon_name,'')) = lower('NighLight');

update public.dragonbound_profiles
set gender = case when random() < 0.5 then 'male' else 'female' end,
    updated_at = now()
where dragon_hatched_at is not null
  and gender is null;

create or replace function public.dragonbound_reveal_gender()
returns table(dragon_gender text, is_admin boolean)
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_locked_egg text;
  v_gender text;
  v_is_admin boolean := false;
begin
  if v_uid is null then
    raise exception 'You must be signed in to reveal a Dragonbound dragon gender.';
  end if;

  select c.username into v_username
  from public.characters c
  where c.user_id = v_uid
  limit 1;

  if coalesce(v_username,'') = '' then
    raise exception 'Dragonbound character profile not found.';
  end if;

  v_is_admin := lower(v_username) = 'admin';

  select p.locked_egg, p.gender
    into v_locked_egg, v_gender
  from public.dragonbound_profiles p
  where p.user_id = v_uid;

  if not v_is_admin and v_locked_egg is null then
    raise exception 'Adopt an egg before revealing a dragon gender.';
  end if;

  if v_is_admin or v_gender is null then
    v_gender := case when random() < 0.5 then 'male' else 'female' end;

    insert into public.dragonbound_profiles(user_id, username, gender, updated_at)
    values(v_uid, v_username, v_gender, now())
    on conflict (user_id) do update
      set username = excluded.username,
          gender = excluded.gender,
          updated_at = now();
  end if;

  return query select v_gender, v_is_admin;
end;
$function$;

grant execute on function public.dragonbound_reveal_gender() to authenticated;

create or replace function public.dragonbound_name_dragon(p_dragon_name text, p_breed_id text)
returns table(dragon_name text, breed_id text, hatched_at timestamp with time zone, is_admin boolean)
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_locked_egg text;
  v_expected_breed text;
  v_gender text;
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

  select p.locked_egg, p.gender into v_locked_egg, v_gender
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

  if v_gender is null then
    v_gender := case when random() < 0.5 then 'male' else 'female' end;
  end if;

  insert into public.dragonbound_profiles(user_id, username, dragon_name, breed_id, dragon_hatched_at, gender, updated_at)
  values(v_uid, v_username, v_name, p_breed_id, now(), v_gender, now())
  on conflict (user_id) do update
    set username = excluded.username,
        dragon_name = excluded.dragon_name,
        breed_id = excluded.breed_id,
        dragon_hatched_at = excluded.dragon_hatched_at,
        gender = excluded.gender,
        updated_at = now();

  return query
  select v_name, p.breed_id, p.dragon_hatched_at, v_is_admin
  from public.dragonbound_profiles p
  where p.user_id = v_uid;
end;
$function$;

-- If a normal account is manually reset and allowed a new egg later, make sure
-- the old dragon's gender cannot leak into the new hatch.
create or replace function public.dragonbound_claim_egg(p_egg_name text)
returns table(locked_egg text, is_admin boolean)
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_existing text;
  v_is_admin boolean := false;
  v_valid_eggs constant text[] := array[
    'Vardesh','Lumerre','Kordesh','Nambara','Norveth','Zafran','Elvane','Qasmir','Calvora','Rovarn','Talune','Drazhen','Belros','Marovar','Sorevia','Iskandar','Blackglass Coast','Skallheim','Hestholm Fjord','Nyrgate Aurora','Warmvein / Krellhaven','Aurelia','Orsanne','Saint Ciro','Marenza','Grand Khor','Rova End','Zafir Row','Ossa Mere','Ashwick / Cinderbank'
  ];
begin
  if v_uid is null then raise exception 'You must be signed in to adopt a Dragonbound egg.'; end if;
  if not (p_egg_name = any(v_valid_eggs)) then raise exception 'Unknown Dragonbound egg type.'; end if;

  select c.username into v_username
  from public.characters c
  where c.user_id = v_uid
  limit 1;

  if coalesce(v_username,'') = '' then raise exception 'Dragonbound character profile not found.'; end if;
  v_is_admin := lower(v_username) = 'admin';

  insert into public.dragonbound_profiles(user_id, username, updated_at)
  values(v_uid, v_username, now())
  on conflict (user_id) do update set username = excluded.username, updated_at = now();

  if v_is_admin then
    locked_egg := p_egg_name;
    is_admin := true;
    return next;
    return;
  end if;

  update public.dragonbound_profiles as dp
  set gender = case when dp.locked_egg is null then null else dp.gender end,
      locked_egg = coalesce(dp.locked_egg, p_egg_name),
      egg_claimed_at = coalesce(dp.egg_claimed_at, now()),
      updated_at = now()
  where dp.user_id = v_uid
  returning dp.locked_egg into v_existing;

  locked_egg := v_existing;
  is_admin := false;
  return next;
end;
$function$;
