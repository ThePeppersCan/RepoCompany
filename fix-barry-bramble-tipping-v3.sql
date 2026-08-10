-- REPO SPORTS — BARRY BRAMBLE TIPPING V3
-- Run this entire file ONCE in Supabase SQL Editor, then hard-refresh the site.
--
-- V3 is deliberately independent from the old fixed 235-second match-slot
-- tipping functions and from the newer shared-clock tipping migration. The
-- browser supplies the exact match id that it is already displaying and this
-- function simply enforces: authenticated account + 200 GP + once per match.

create table if not exists public.quidditch_commentator_tips_v3 (
  match_id bigint not null,
  user_id uuid not null,
  amount integer not null default 200 check (amount > 0),
  tipped_at timestamptz not null default clock_timestamp(),
  primary key (match_id,user_id)
);

create table if not exists public.quidditch_commentator_tip_v3_meta (
  meta_id smallint primary key default 1 check (meta_id=1),
  baseline_gp bigint not null default 0,
  created_at timestamptz not null default clock_timestamp()
);

alter table public.quidditch_commentator_tips_v3 enable row level security;
alter table public.quidditch_commentator_tip_v3_meta enable row level security;
revoke all on public.quidditch_commentator_tips_v3 from public;
revoke all on public.quidditch_commentator_tip_v3_meta from public;

-- Snapshot the already-earned community progress once. This is only migration
-- bookkeeping; all future tips are counted in the V3 table itself.
do $$
declare
  v_baseline bigint := 0;
begin
  if not exists(select 1 from public.quidditch_commentator_tip_v3_meta where meta_id=1) then
    begin
      if to_regprocedure('public.get_quidditch_commentator_total_tips_v2()') is not null then
        execute 'select coalesce(public.get_quidditch_commentator_total_tips_v2(),0)::bigint' into v_baseline;
      elsif to_regprocedure('public.get_quidditch_commentator_total_tips()') is not null then
        execute 'select coalesce(public.get_quidditch_commentator_total_tips(),0)::bigint' into v_baseline;
      end if;
    exception when others then
      v_baseline := 0;
    end;
    insert into public.quidditch_commentator_tip_v3_meta(meta_id,baseline_gp)
    values(1,greatest(0,coalesce(v_baseline,0)))
    on conflict(meta_id) do nothing;
  end if;
end $$;

create or replace function public.get_quidditch_commentator_total_tips_v3()
returns bigint
language sql
security definer
set search_path=public
as $$
  select greatest(0,coalesce((select m.baseline_gp from public.quidditch_commentator_tip_v3_meta m where m.meta_id=1),0))
       + greatest(0,coalesce((select sum(t.amount)::bigint from public.quidditch_commentator_tips_v3 t),0));
$$;

create or replace function public.has_tipped_quidditch_commentator_v3(p_match_id bigint)
returns boolean
language sql
security definer
set search_path=public
as $$
  select auth.uid() is not null
     and p_match_id is not null
     and p_match_id > 0
     and exists(
       select 1
       from public.quidditch_commentator_tips_v3 t
       where t.match_id=p_match_id and t.user_id=auth.uid()
     );
$$;

drop function if exists public.tip_quidditch_commentator_v3(bigint);
create function public.tip_quidditch_commentator_v3(p_match_id bigint)
returns table(match_id bigint,remaining_gp bigint,lifetime_tip_gp bigint)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_gp bigint;
  v_total bigint;
begin
  if v_uid is null then raise exception 'Sign in before tipping Barry Bramble'; end if;
  if p_match_id is null or p_match_id<=0 then raise exception 'The current Quidditch match is not ready'; end if;

  perform pg_advisory_xact_lock(hashtext('barry-v3:'||v_uid::text||':'||p_match_id::text)::bigint);

  select coalesce(c.gp,0)::bigint
    into v_gp
    from public.characters c
   where c.user_id=v_uid
   for update;
  if not found then raise exception 'Character not found'; end if;

  if exists(
    select 1 from public.quidditch_commentator_tips_v3 t
    where t.match_id=p_match_id and t.user_id=v_uid
  ) then
    raise exception 'You have already tipped Barry Bramble during this match';
  end if;

  if v_gp<200 then raise exception 'You need 200 GP to tip Barry Bramble'; end if;

  insert into public.quidditch_commentator_tips_v3(match_id,user_id,amount,tipped_at)
  values(p_match_id,v_uid,200,clock_timestamp());

  update public.characters c
     set gp=greatest(0,coalesce(c.gp,0)-200)
   where c.user_id=v_uid
   returning c.gp::bigint into v_gp;

  v_total:=public.get_quidditch_commentator_total_tips_v3();

  -- The community cosmetic must never be allowed to make a valid tip fail.
  -- If a particular older database does not yet have the expected bank shape,
  -- the tip still succeeds and the reward can be granted by its normal system.
  if v_total>=250000 then
    begin
      update public.characters c
         set bank_items=jsonb_set(
           coalesce(c.bank_items,'{}'::jsonb),
           '{barrys_boater}',
           '1'::jsonb,
           true
         );
    exception when others then
      null;
    end;
  end if;

  return query select p_match_id,v_gp,v_total;
end $$;

grant execute on function public.get_quidditch_commentator_total_tips_v3() to anon,authenticated;
grant execute on function public.has_tipped_quidditch_commentator_v3(bigint) to authenticated;
grant execute on function public.tip_quidditch_commentator_v3(bigint) to authenticated;

notify pgrst,'reload schema';
