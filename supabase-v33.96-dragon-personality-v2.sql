-- V33.96 Dragon Personalities 2.0
-- Adds 2-3 permanent, server-owned signature traits without replacing the
-- existing deeper personality/memory system.

create or replace function public.dragonbound_signature_traits_from_personality(
  p_personality jsonb,
  p_seed text
) returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  v_stats jsonb := coalesce(p_personality->'coreStats','{}'::jsonb);
  v_count integer := case when abs(hashtext(coalesce(p_seed,''))) % 3 = 0 then 3 else 2 end;
  v_result text[] := array[]::text[];
  r record;
  v_conflicts jsonb := jsonb_build_object(
    'Lazy',jsonb_build_array('Energetic'),
    'Energetic',jsonb_build_array('Lazy','Sleepy'),
    'Sleepy',jsonb_build_array('Energetic'),
    'Clingy',jsonb_build_array('Independent'),
    'Independent',jsonb_build_array('Clingy'),
    'Clean',jsonb_build_array('Messy'),
    'Messy',jsonb_build_array('Clean'),
    'Calm',jsonb_build_array('Easily Excited'),
    'Easily Excited',jsonb_build_array('Calm'),
    'Brave',jsonb_build_array('Shy'),
    'Shy',jsonb_build_array('Brave')
  );
  v_bad boolean;
begin
  for r in
    with s as (
      select * from (values
        ('Lazy',            72 - coalesce((v_stats->>'energy')::int,50) + coalesce((v_stats->>'sleepiness')::int,50)*0.45),
        ('Energetic',       coalesce((v_stats->>'energy')::int,50)*0.95 + coalesce((v_stats->>'playfulness')::int,50)*0.35),
        ('Curious',         coalesce((v_stats->>'curiosity')::int,50)*1.05 + coalesce((v_stats->>'intelligence')::int,50)*0.20),
        ('Mischievous',     coalesce((v_stats->>'mischief')::int,50)*1.15 + coalesce((v_stats->>'playfulness')::int,50)*0.20),
        ('Clingy',          coalesce((v_stats->>'affection')::int,50)*0.85 + coalesce((v_stats->>'sociability')::int,50)*0.40 - coalesce((v_stats->>'independence')::int,50)*0.35),
        ('Independent',     coalesce((v_stats->>'independence')::int,50)*1.05 + (100-coalesce((v_stats->>'sociability')::int,50))*0.20),
        ('Food Obsessed',   coalesce((v_stats->>'appetite')::int,50)*1.12 + coalesce((v_stats->>'mischief')::int,50)*0.12),
        ('Sleepy',          coalesce((v_stats->>'sleepiness')::int,50)*1.10 + (100-coalesce((v_stats->>'energy')::int,50))*0.25),
        ('Playful',         coalesce((v_stats->>'playfulness')::int,50)*1.08 + coalesce((v_stats->>'energy')::int,50)*0.18),
        ('Brave',           coalesce((v_stats->>'bravery')::int,50)*1.12 + coalesce((v_stats->>'curiosity')::int,50)*0.10),
        ('Shy',             (100-coalesce((v_stats->>'sociability')::int,50))*0.75 + (100-coalesce((v_stats->>'bravery')::int,50))*0.55),
        ('Competitive',     coalesce((v_stats->>'bravery')::int,50)*0.42 + coalesce((v_stats->>'energy')::int,50)*0.34 + coalesce((v_stats->>'playfulness')::int,50)*0.30),
        ('Stubborn',        coalesce((v_stats->>'stubbornness')::int,50)*1.10 + coalesce((v_stats->>'independence')::int,50)*0.16),
        ('Affectionate',    coalesce((v_stats->>'affection')::int,50)*1.05 + coalesce((v_stats->>'sociability')::int,50)*0.25),
        ('Clean',           48.0),
        ('Messy',           46.0 + coalesce((v_stats->>'mischief')::int,50)*0.10),
        ('Easily Excited',  coalesce((v_stats->>'energy')::int,50)*0.48 + coalesce((v_stats->>'playfulness')::int,50)*0.52),
        ('Calm',            (100-coalesce((v_stats->>'energy')::int,50))*0.45 + (100-coalesce((v_stats->>'mischief')::int,50))*0.36 + 22),
        ('Adventurous',     coalesce((v_stats->>'curiosity')::int,50)*0.52 + coalesce((v_stats->>'bravery')::int,50)*0.52)
      ) as x(name,base_score)
    ), ranked as (
      select name,
             base_score + ((abs(hashtext(coalesce(p_seed,'')||':'||name)) % 1801) / 100.0 - 9.0) as score
      from s
      order by score desc, name
    )
    select * from ranked
  loop
    exit when cardinality(v_result) >= v_count;
    v_bad := false;
    if cardinality(v_result) > 0 then
      select exists(
        select 1 from unnest(v_result) chosen
        where coalesce(v_conflicts->chosen,'[]'::jsonb) ? r.name
           or coalesce(v_conflicts->r.name,'[]'::jsonb) ? chosen
      ) into v_bad;
    end if;
    if not v_bad then v_result := array_append(v_result,r.name); end if;
  end loop;
  return to_jsonb(v_result);
end;
$$;

create or replace function public.dragonbound_ensure_personality_v2(
  p_uid uuid,
  p_force boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_profile public.dragonbound_profiles%rowtype;
  v_signature jsonb;
  v_seed text;
begin
  if p_uid is null then return '[]'::jsonb; end if;
  select * into v_profile from public.dragonbound_profiles where user_id=p_uid for update;
  if not found or v_profile.dragon_hatched_at is null or coalesce(v_profile.breed_id,'')='' then return '[]'::jsonb; end if;

  v_signature := coalesce(v_profile.dragon_traits->'signature','[]'::jsonb);
  if not p_force and jsonb_typeof(v_signature)='array' and jsonb_array_length(v_signature) between 2 and 3 then
    return v_signature;
  end if;

  if v_profile.personality is null then
    perform public.dragonbound_ensure_personality(p_uid,v_profile.breed_id,false);
    select * into v_profile from public.dragonbound_profiles where user_id=p_uid for update;
  end if;

  v_seed := p_uid::text||':'||coalesce(v_profile.breed_id,'')||':'||coalesce(v_profile.dragon_name,'')||':'||coalesce(v_profile.personality_generated_at::text,'');
  v_signature := public.dragonbound_signature_traits_from_personality(v_profile.personality,v_seed);

  update public.dragonbound_profiles
     set dragon_traits = jsonb_set(
           jsonb_set(coalesce(dragon_traits,'{}'::jsonb),'{signature}',v_signature,true),
           '{signatureVersion}','2'::jsonb,true
         ),
         personality = jsonb_set(coalesce(personality,'{}'::jsonb),'{signatureTraits}',v_signature,true),
         personality_version = greatest(coalesce(personality_version,1),2),
         updated_at = clock_timestamp()
   where user_id=p_uid;
  return v_signature;
end;
$$;

create or replace function public.dragonbound_ensure_my_personality_v2()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;
  return public.dragonbound_ensure_personality_v2(auth.uid(),false);
end;
$$;

-- Preserve the current hatch/name contract and add signature traits immediately.
create or replace function public.dragonbound_name_dragon(p_dragon_name text, p_breed_id text)
returns table(dragon_name text, breed_id text, hatched_at timestamptz, is_admin boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
declare v_uid uuid := auth.uid(); v_username text; v_locked_egg text; v_expected_breed text; v_is_admin boolean := false; v_name text := btrim(coalesce(p_dragon_name,''));
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
  on conflict(user_id) do update set username=excluded.username,dragon_name=excluded.dragon_name,breed_id=excluded.breed_id,dragon_hatched_at=coalesce(public.dragonbound_profiles.dragon_hatched_at,excluded.dragon_hatched_at),updated_at=now();
  perform public.dragonbound_ensure_personality(v_uid,p_breed_id,v_is_admin);
  perform public.dragonbound_ensure_personality_v2(v_uid,false);
  return query select v_name,p_breed_id,p.dragon_hatched_at,v_is_admin from public.dragonbound_profiles p where p.user_id=v_uid;
end;
$$;

-- Safe one-time migration for existing hatched dragons. Existing valid signatures never reroll.
do $$
declare r record;
begin
  for r in select user_id from public.dragonbound_profiles where dragon_hatched_at is not null loop
    perform public.dragonbound_ensure_personality_v2(r.user_id,false);
  end loop;
end $$;

revoke all on function public.dragonbound_ensure_personality_v2(uuid,boolean) from public;
revoke all on function public.dragonbound_signature_traits_from_personality(jsonb,text) from public;
grant execute on function public.dragonbound_ensure_my_personality_v2() to authenticated;
