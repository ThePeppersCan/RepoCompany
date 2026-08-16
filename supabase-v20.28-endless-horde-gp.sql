-- Repo Company V20.28 — Endless Horde wave GP economy
-- Applied to the live Supabase project on 2026-08-16.

create table if not exists public.endless_horde_reward_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  map_id text not null,
  weapon text not null,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_claim_at timestamptz,
  last_claimed_wave integer not null default 0,
  total_gp bigint not null default 0,
  ended_at timestamptz
);

create index if not exists endless_horde_reward_runs_user_active_idx
  on public.endless_horde_reward_runs(user_id, ended_at, started_at desc);

alter table public.endless_horde_reward_runs enable row level security;
revoke all on table public.endless_horde_reward_runs from anon, authenticated;

create or replace function public.start_endless_horde_reward_run(p_map_id text,p_weapon text)
returns table(run_id uuid, started_at timestamptz, current_gp bigint)
language plpgsql security definer set search_path=public,auth as $$
declare v_run_id uuid; v_started timestamptz; v_gp bigint;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_map_id not in ('zombie-varrock','zombie-falador','zombie-morytania') then raise exception 'Invalid Horde map'; end if;
  if p_weapon not in ('sword','dharok','greataxe','bow','blowpipe','staff','shadow') then raise exception 'Invalid weapon'; end if;
  if not exists(select 1 from public.characters where user_id=auth.uid()) then raise exception 'Character not found'; end if;
  update public.endless_horde_reward_runs set ended_at=coalesce(ended_at,now()),updated_at=now() where user_id=auth.uid() and ended_at is null;
  insert into public.endless_horde_reward_runs(user_id,map_id,weapon) values(auth.uid(),p_map_id,p_weapon)
    returning id,public.endless_horde_reward_runs.started_at into v_run_id,v_started;
  select gp into v_gp from public.characters where user_id=auth.uid();
  return query select v_run_id,v_started,coalesce(v_gp,0);
end;$$;

create or replace function public.claim_endless_horde_wave_reward(p_run_id uuid,p_wave integer)
returns table(awarded boolean,awarded_gp integer,base_gp integer,bonus_gp integer,total_run_gp bigint,new_gp bigint,claimed_wave integer,retry_after_seconds integer,reason text)
language plpgsql security definer set search_path=public,auth as $$
declare
  v_run public.endless_horde_reward_runs%rowtype; v_base integer; v_bonus integer; v_reward integer;
  v_elapsed numeric; v_budget bigint; v_required_elapsed numeric; v_retry integer:=0; v_new_gp bigint;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_wave<1 or p_wave>250 then raise exception 'Invalid wave'; end if;
  select * into v_run from public.endless_horde_reward_runs where id=p_run_id and user_id=auth.uid() for update;
  if not found then raise exception 'Horde reward run not found'; end if;
  if v_run.ended_at is not null then raise exception 'Horde reward run has ended'; end if;
  if now()-v_run.started_at>interval '2 hours 10 minutes' then
    update public.endless_horde_reward_runs set ended_at=now(),updated_at=now() where id=v_run.id;
    raise exception 'Horde reward run expired';
  end if;
  if p_wave<=v_run.last_claimed_wave then
    select gp into v_new_gp from public.characters where user_id=auth.uid();
    return query select false,0,0,0,v_run.total_gp,coalesce(v_new_gp,0),v_run.last_claimed_wave,0,'already_claimed'::text; return;
  end if;
  if p_wave<>v_run.last_claimed_wave+1 then
    select gp into v_new_gp from public.characters where user_id=auth.uid();
    return query select false,0,0,0,v_run.total_gp,coalesce(v_new_gp,0),v_run.last_claimed_wave,2,'claim_previous_wave_first'::text; return;
  end if;
  v_base:=case when p_wave<=5 then 300 when p_wave<=10 then 500 when p_wave<=15 then 750 when p_wave<=20 then 1000 else 1250 end;
  v_bonus:=case when p_wave%5=0 then 1500 else 0 end; v_reward:=v_base+v_bonus;
  v_elapsed:=greatest(0,extract(epoch from (now()-v_run.started_at)));
  v_budget:=1500+floor(v_elapsed*(60000.0/3600.0));
  if v_run.total_gp+v_reward>v_budget then
    v_required_elapsed:=greatest(0,((v_run.total_gp+v_reward-1500)*3600.0/60000.0));
    v_retry:=greatest(1,ceil(v_required_elapsed-v_elapsed)::integer);
    select gp into v_new_gp from public.characters where user_id=auth.uid();
    return query select false,0,v_base,v_bonus,v_run.total_gp,coalesce(v_new_gp,0),v_run.last_claimed_wave,v_retry,'rate_limited'::text; return;
  end if;
  if v_run.last_claim_at is not null and now()-v_run.last_claim_at<interval '6 seconds' then
    v_retry:=greatest(1,ceil(6-extract(epoch from (now()-v_run.last_claim_at)))::integer);
    select gp into v_new_gp from public.characters where user_id=auth.uid();
    return query select false,0,v_base,v_bonus,v_run.total_gp,coalesce(v_new_gp,0),v_run.last_claimed_wave,v_retry,'too_fast'::text; return;
  end if;
  update public.characters set gp=gp+v_reward where user_id=auth.uid() returning gp into v_new_gp;
  if not found then raise exception 'Character not found'; end if;
  update public.endless_horde_reward_runs set last_claimed_wave=p_wave,total_gp=total_gp+v_reward,last_claim_at=now(),updated_at=now()
    where id=v_run.id returning total_gp into v_run.total_gp;
  return query select true,v_reward,v_base,v_bonus,v_run.total_gp,v_new_gp,p_wave,0,'awarded'::text;
end;$$;

create or replace function public.end_endless_horde_reward_run(p_run_id uuid)
returns void language plpgsql security definer set search_path=public,auth as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  update public.endless_horde_reward_runs set ended_at=coalesce(ended_at,now()),updated_at=now() where id=p_run_id and user_id=auth.uid();
end;$$;

revoke all on function public.start_endless_horde_reward_run(text,text) from public,anon;
revoke all on function public.claim_endless_horde_wave_reward(uuid,integer) from public,anon;
revoke all on function public.end_endless_horde_reward_run(uuid) from public,anon;
grant execute on function public.start_endless_horde_reward_run(text,text) to authenticated;
grant execute on function public.claim_endless_horde_wave_reward(uuid,integer) to authenticated;
grant execute on function public.end_endless_horde_reward_run(uuid) to authenticated;
