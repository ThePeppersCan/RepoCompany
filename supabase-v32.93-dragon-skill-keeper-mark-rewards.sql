-- Dragonbound V32.93 — secure, one-time Keeper Mark skill milestone rewards.
-- Deployed live to project hvdrwmjieguurxvrgzfu on 2026-08-22.

create table if not exists public.dragonbound_skill_reward_baselines (
  user_id uuid not null,
  skill text not null,
  baseline_level numeric(6,3) not null default 0,
  created_at timestamptz not null default now(),
  registered_at timestamptz,
  primary key (user_id, skill),
  constraint dragonbound_skill_reward_baselines_skill_check check (skill in ('flying','agility','strength','fireControl','intelligence','confidence')),
  constraint dragonbound_skill_reward_baselines_level_check check (baseline_level >= 0 and baseline_level <= 100)
);

alter table public.dragonbound_skill_reward_baselines add column if not exists registered_at timestamptz;

create table if not exists public.dragonbound_skill_rewards (
  user_id uuid not null,
  skill text not null,
  milestone integer not null,
  keeper_marks integer not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, skill, milestone),
  constraint dragonbound_skill_rewards_skill_check check (skill in ('flying','agility','strength','fireControl','intelligence','confidence')),
  constraint dragonbound_skill_rewards_milestone_check check (milestone in (10,20,30,40,50,60,70,80,90,95,100)),
  constraint dragonbound_skill_rewards_marks_check check (keeper_marks > 0)
);

alter table public.dragonbound_skill_reward_baselines enable row level security;
alter table public.dragonbound_skill_rewards enable row level security;

-- Seed a server-side floor for pre-existing dragons. The client then registers its
-- newest local skill snapshot exactly once; the baseline can only move UP, never down.
insert into public.dragonbound_skill_reward_baselines(user_id, skill, baseline_level)
select p.user_id, s.skill,
       least(100::numeric, greatest(0::numeric,
         case
           when coalesce(p.dragon_memory->'skills'->s.skill->>'level','') ~ '^[0-9]+([.][0-9]+)?$'
             then (p.dragon_memory->'skills'->s.skill->>'level')::numeric
           else 0::numeric
         end
       ))
from public.dragonbound_profiles p
cross join (values ('flying'),('agility'),('strength'),('fireControl'),('intelligence'),('confidence')) s(skill)
where p.dragon_hatched_at is not null
on conflict (user_id, skill) do nothing;

create or replace function public.dragonbound_register_skill_reward_baseline(p_levels jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_skill text;
  v_client numeric;
  v_server numeric;
  v_memory jsonb;
begin
  if v_uid is null then raise exception 'You must be signed in to register Dragonbound skill rewards.'; end if;
  if p_levels is null or jsonb_typeof(p_levels) <> 'object' then raise exception 'Skill levels must be an object.'; end if;

  select dragon_memory into v_memory from public.dragonbound_profiles where user_id=v_uid and dragon_hatched_at is not null;
  if not found then raise exception 'No hatched Dragonbound dragon was found.'; end if;

  foreach v_skill in array array['flying','agility','strength','fireControl','intelligence','confidence'] loop
    v_client := 0;
    v_server := 0;
    if coalesce(p_levels->>v_skill,'') ~ '^[0-9]+([.][0-9]+)?$' then
      v_client := least(100::numeric,greatest(0::numeric,(p_levels->>v_skill)::numeric));
    end if;
    if coalesce(v_memory->'skills'->v_skill->>'level','') ~ '^[0-9]+([.][0-9]+)?$' then
      v_server := least(100::numeric,greatest(0::numeric,(v_memory->'skills'->v_skill->>'level')::numeric));
    end if;

    insert into public.dragonbound_skill_reward_baselines(user_id,skill,baseline_level,registered_at)
    values(v_uid,v_skill,greatest(v_client,v_server),now())
    on conflict(user_id,skill) do update
      set baseline_level=greatest(public.dragonbound_skill_reward_baselines.baseline_level,excluded.baseline_level),
          registered_at=coalesce(public.dragonbound_skill_reward_baselines.registered_at,now())
      where public.dragonbound_skill_reward_baselines.registered_at is null;
  end loop;

  return jsonb_build_object(
    'baselines',coalesce((select jsonb_object_agg(skill,baseline_level) from public.dragonbound_skill_reward_baselines where user_id=v_uid),'{}'::jsonb),
    'registered',coalesce((select jsonb_object_agg(skill,registered_at is not null) from public.dragonbound_skill_reward_baselines where user_id=v_uid),'{}'::jsonb)
  );
end;
$function$;

create or replace function public.dragonbound_get_skill_reward_state()
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_balance bigint := 0;
begin
  if v_uid is null then raise exception 'You must be signed in to view Dragonbound skill rewards.'; end if;
  insert into public.dragonbound_wallets(user_id,keeper_marks,updated_at) values(v_uid,0,now()) on conflict(user_id) do nothing;
  select keeper_marks into v_balance from public.dragonbound_wallets where user_id=v_uid;
  insert into public.dragonbound_skill_reward_baselines(user_id,skill,baseline_level)
  select v_uid,s.skill,0 from (values ('flying'),('agility'),('strength'),('fireControl'),('intelligence'),('confidence')) s(skill)
  on conflict(user_id,skill) do nothing;
  return jsonb_build_object(
    'balance',coalesce(v_balance,0),
    'baselines',coalesce((select jsonb_object_agg(skill,baseline_level) from public.dragonbound_skill_reward_baselines where user_id=v_uid),'{}'::jsonb),
    'registered',coalesce((select jsonb_object_agg(skill,registered_at is not null) from public.dragonbound_skill_reward_baselines where user_id=v_uid),'{}'::jsonb),
    'claimed',coalesce((select jsonb_agg(jsonb_build_object('skill',skill,'milestone',milestone,'marks',keeper_marks,'claimedAt',claimed_at) order by claimed_at) from public.dragonbound_skill_rewards where user_id=v_uid),'[]'::jsonb)
  );
end;
$function$;

create or replace function public.dragonbound_claim_skill_reward(p_skill text, p_milestone integer)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid := auth.uid();
  v_reward integer;
  v_level numeric := 0;
  v_baseline numeric := 0;
  v_registered timestamptz;
  v_balance bigint := 0;
  v_memory jsonb;
  v_inserted boolean := false;
  v_rows integer := 0;
begin
  if v_uid is null then raise exception 'You must be signed in to claim a Dragonbound skill reward.'; end if;
  if p_skill not in ('flying','agility','strength','fireControl','intelligence','confidence') then raise exception 'Unknown Dragonbound skill.'; end if;
  v_reward := case p_milestone when 10 then 5 when 20 then 7 when 30 then 10 when 40 then 12 when 50 then 15 when 60 then 18 when 70 then 22 when 80 then 28 when 90 then 40 when 95 then 50 when 100 then 75 else null end;
  if v_reward is null then raise exception 'That is not a valid skill reward milestone.'; end if;

  select dragon_memory into v_memory from public.dragonbound_profiles where user_id=v_uid and dragon_hatched_at is not null for update;
  if not found then raise exception 'No hatched Dragonbound dragon was found.'; end if;
  if coalesce(v_memory->'skills'->p_skill->>'level','') ~ '^[0-9]+([.][0-9]+)?$' then
    v_level := least(100::numeric,greatest(0::numeric,(v_memory->'skills'->p_skill->>'level')::numeric));
  end if;

  insert into public.dragonbound_skill_reward_baselines(user_id,skill,baseline_level) values(v_uid,p_skill,0) on conflict(user_id,skill) do nothing;
  select baseline_level,registered_at into v_baseline,v_registered from public.dragonbound_skill_reward_baselines where user_id=v_uid and skill=p_skill;
  if v_registered is null then raise exception 'Skill reward baseline must be registered first.'; end if;
  if p_milestone <= floor(v_baseline) then raise exception 'That milestone predates Dragonbound skill rewards.'; end if;
  if v_level < p_milestone then raise exception 'That skill has not reached this milestone yet.'; end if;

  insert into public.dragonbound_wallets(user_id,keeper_marks,updated_at) values(v_uid,0,now()) on conflict(user_id) do nothing;
  select keeper_marks into v_balance from public.dragonbound_wallets where user_id=v_uid for update;
  insert into public.dragonbound_skill_rewards(user_id,skill,milestone,keeper_marks,claimed_at)
  values(v_uid,p_skill,p_milestone,v_reward,now()) on conflict(user_id,skill,milestone) do nothing;
  get diagnostics v_rows = row_count;
  v_inserted := v_rows > 0;
  if v_inserted then
    update public.dragonbound_wallets set keeper_marks=keeper_marks+v_reward,updated_at=now() where user_id=v_uid returning keeper_marks into v_balance;
  end if;
  return jsonb_build_object('skill',p_skill,'milestone',p_milestone,'marks',case when v_inserted then v_reward else 0 end,'rewardValue',v_reward,'balance',coalesce(v_balance,0),'alreadyClaimed',not v_inserted,'level',v_level);
end;
$function$;

revoke all on table public.dragonbound_skill_reward_baselines from anon, authenticated;
revoke all on table public.dragonbound_skill_rewards from anon, authenticated;
revoke all on function public.dragonbound_register_skill_reward_baseline(jsonb) from public;
revoke all on function public.dragonbound_get_skill_reward_state() from public;
revoke all on function public.dragonbound_claim_skill_reward(text,integer) from public;
grant execute on function public.dragonbound_register_skill_reward_baseline(jsonb) to authenticated;
grant execute on function public.dragonbound_get_skill_reward_state() to authenticated;
grant execute on function public.dragonbound_claim_skill_reward(text,integer) to authenticated;
