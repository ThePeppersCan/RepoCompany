-- REPO SPORTS WORLD CUP 2026 — LIMITED EVENT V1.8
-- 10-pack event progression:
--   1 Welcome Pack (free)
--   2 World Cup Pack (free)
--   3 World Cup Pack (free)
--   4-9 Match Packs I-VI
--   10 Final Pack (Match Pack VII)
--
-- Safe over V1.7. Does not remove opened packs, cards, passport tickets,
-- watch history or legitimate match rewards. Existing event cards remain owned.

begin;

-- Give packs explicit, permanent locker positions so a later migration cannot
-- reshuffle a Welcome Pack or Match Pack merely because awarded_at changed.
alter table public.repo_world_cup_packs_2026
  add column if not exists event_slot smallint;

alter table public.repo_world_cup_packs_2026
  drop constraint if exists repo_wc26_event_slot_range;
alter table public.repo_world_cup_packs_2026
  add constraint repo_wc26_event_slot_range
  check (event_slot is null or event_slot between 1 and 10);

-- Backfill free packs first into slots 1-3, then match rewards into 4-10.
with ranked as (
  select p.pack_id,
         row_number() over(partition by p.user_id order by p.awarded_at,p.pack_id) as rn
  from public.repo_world_cup_packs_2026 p
  where p.source='free'
)
update public.repo_world_cup_packs_2026 p
set event_slot=r.rn::smallint
from ranked r
where p.pack_id=r.pack_id
  and r.rn<=3;

with ranked as (
  select p.pack_id,
         row_number() over(partition by p.user_id order by p.awarded_at,p.pack_id) as rn
  from public.repo_world_cup_packs_2026 p
  where p.source='match'
)
update public.repo_world_cup_packs_2026 p
set event_slot=(3+r.rn)::smallint
from ranked r
where p.pack_id=r.pack_id
  and r.rn<=7;

-- Do not destroy grandfathered rewards from earlier event versions. Any pack
-- beyond the new ten-position path remains stored in the DB but has no new
-- event_slot assigned and is therefore not used by the V1.8 locker UI.
create unique index if not exists repo_wc26_one_event_slot_per_user
  on public.repo_world_cup_packs_2026(user_id,event_slot)
  where event_slot is not null;

-- Existing accounts that already claimed the previous two-pack welcome are
-- upgraded to the new three-pack opening allocation when there is room.
do $$
declare r record; v_total integer; v_free integer; v_slot integer;
begin
  for r in
    select e.user_id
    from public.repo_world_cup_event_2026 e
    where e.free_packs_claimed=true
  loop
    select count(*),count(*) filter(where p.source='free')
      into v_total,v_free
    from public.repo_world_cup_packs_2026 p
    where p.user_id=r.user_id and (p.event_slot is not null or p.source='free');

    while v_free<3 and v_total<10 loop
      select s into v_slot
      from generate_series(1,3) s
      where not exists(
        select 1 from public.repo_world_cup_packs_2026 p
        where p.user_id=r.user_id and p.event_slot=s
      )
      order by s limit 1;
      exit when v_slot is null;
      insert into public.repo_world_cup_packs_2026(user_id,source,event_slot)
      values(r.user_id,'free',v_slot);
      v_free:=v_free+1;v_total:=v_total+1;
    end loop;
  end loop;
end $$;

-- Stable state API: ordinal now comes from event_slot rather than awarded_at.
create or replace function public.get_my_world_cup_pack_event_state(p_username text default null)
returns table(
  username text,
  free_packs_claimed boolean,
  free_packs_awarded integer,
  match_packs_earned integer,
  total_packs_awarded integer,
  unopened_packs integer,
  opened_packs integer,
  cards text[],
  qualifying_fixtures text[],
  packs jsonb
)
language plpgsql
security definer
set search_path=public,auth
as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.repo_wc26_ensure_event_row(p_username);
  return query
  select e.username,e.free_packs_claimed,
    count(*) filter(where p.source='free' and p.event_slot between 1 and 3)::integer,
    count(*) filter(where p.source='match' and p.event_slot between 4 and 10)::integer,
    count(p.pack_id) filter(where p.event_slot between 1 and 10)::integer,
    count(*) filter(where p.event_slot between 1 and 10 and p.opened_at is null)::integer,
    count(*) filter(where p.event_slot between 1 and 10 and p.opened_at is not null)::integer,
    coalesce(e.cards,'{}'::text[]),
    coalesce(e.qualifying_fixtures,'{}'::text[]),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'pack_id',p.pack_id,
          'source',p.source,
          'fixture_id',p.fixture_id,
          'fixture_label',p.fixture_label,
          'team_a',p.team_a,
          'team_b',p.team_b,
          'stage',p.stage,
          'fixture_started_at',p.fixture_started_at,
          'awarded_at',p.awarded_at,
          'opened_at',p.opened_at,
          'card_id',p.card_id,
          'ordinal',p.event_slot
        ) order by p.event_slot
      ) filter(where p.pack_id is not null and p.event_slot between 1 and 10),
      '[]'::jsonb
    )
  from public.repo_world_cup_event_2026 e
  left join public.repo_world_cup_packs_2026 p on p.user_id=e.user_id
  where e.user_id=v_uid
  group by e.user_id,e.username,e.free_packs_claimed,e.cards,e.qualifying_fixtures;
end;
$$;

-- Three complimentary starting packs, exactly once per account. Re-running
-- this reconciles a partially migrated account instead of duplicating rewards.
create or replace function public.claim_world_cup_free_packs(p_username text default null)
returns table(
  username text,free_packs_claimed boolean,free_packs_awarded integer,match_packs_earned integer,
  total_packs_awarded integer,unopened_packs integer,opened_packs integer,cards text[],qualifying_fixtures text[],packs jsonb
)
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid:=auth.uid();
  v_total integer;
  v_slot integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.repo_wc26_ensure_event_row(p_username);
  perform 1 from public.repo_world_cup_event_2026 e where e.user_id=v_uid for update;

  select count(*) into v_total
  from public.repo_world_cup_packs_2026 p
  where p.user_id=v_uid and p.event_slot between 1 and 10;

  for v_slot in 1..3 loop
    if not exists(
      select 1 from public.repo_world_cup_packs_2026 p
      where p.user_id=v_uid and p.event_slot=v_slot
    ) then
      if v_total>=10 then exit; end if;
      insert into public.repo_world_cup_packs_2026(user_id,source,event_slot)
      values(v_uid,'free',v_slot);
      v_total:=v_total+1;
    end if;
  end loop;

  update public.repo_world_cup_event_2026
  set free_packs_claimed=true,updated_at=now()
  where user_id=v_uid;

  return query select * from public.get_my_world_cup_pack_event_state(p_username);
end;
$$;

-- Seven watch rewards now occupy slots 4-10. Slot 10 is the Final Pack.
create or replace function public.complete_world_cup_fixture_watch(
  p_fixture_id text,
  p_match_elapsed_seconds integer default 1080
)
returns table(
  awarded boolean,
  reason text,
  pack_number integer,
  match_packs_earned integer,
  total_packs_awarded integer,
  unopened_packs integer
)
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid:=auth.uid();
  v_watch public.repo_world_cup_fixture_watch_2026%rowtype;
  v_match integer;
  v_total integer;
  v_unopened integer;
  v_pack_number integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.repo_wc26_ensure_event_row(null);

  select * into v_watch
  from public.repo_world_cup_fixture_watch_2026 w
  where w.user_id=v_uid and w.fixture_id=trim(p_fixture_id)
  for update;

  if not found then
    return query select false,'no_watch_record',0,0,0,0;
    return;
  end if;

  update public.repo_world_cup_fixture_watch_2026
  set completed=true,
      last_match_elapsed_seconds=greatest(last_match_elapsed_seconds,coalesce(p_match_elapsed_seconds,0))
  where user_id=v_uid and fixture_id=trim(p_fixture_id);

  select count(*) filter(where p.source='match' and p.event_slot between 4 and 10),
         count(*) filter(where p.event_slot between 1 and 10),
         count(*) filter(where p.event_slot between 1 and 10 and p.opened_at is null)
    into v_match,v_total,v_unopened
  from public.repo_world_cup_packs_2026 p
  where p.user_id=v_uid;

  if v_watch.rewarded then
    return query select false,'already_rewarded',coalesce((
      select p.event_slot::integer from public.repo_world_cup_packs_2026 p
      where p.user_id=v_uid and p.fixture_id=v_watch.fixture_id and p.source='match' limit 1
    ),0),v_match,v_total,v_unopened;
    return;
  end if;

  if v_watch.first_match_elapsed_seconds>120 then
    return query select false,'joined_too_late',0,v_match,v_total,v_unopened;
    return;
  end if;
  if greatest(v_watch.last_match_elapsed_seconds,coalesce(p_match_elapsed_seconds,0))<1075 then
    return query select false,'match_not_finished',0,v_match,v_total,v_unopened;
    return;
  end if;
  if v_watch.watched_seconds<960 then
    return query select false,'insufficient_full_fixture_watch',0,v_match,v_total,v_unopened;
    return;
  end if;

  if v_match>=7 then
    return query select false,'seven_match_pack_limit_reached',10,v_match,v_total,v_unopened;
    return;
  end if;
  if v_total>=10 then
    return query select false,'ten_pack_event_limit_reached',10,v_match,v_total,v_unopened;
    return;
  end if;

  v_pack_number:=4+v_match;

  insert into public.repo_world_cup_packs_2026(
    user_id,source,fixture_id,fixture_label,team_a,team_b,stage,fixture_started_at,event_slot
  ) values(
    v_uid,'match',v_watch.fixture_id,v_watch.fixture_label,v_watch.team_a,v_watch.team_b,
    v_watch.stage,v_watch.fixture_started_at,v_pack_number
  )
  on conflict do nothing;

  if not found then
    return query select false,'already_rewarded',v_pack_number,v_match,v_total,v_unopened;
    return;
  end if;

  update public.repo_world_cup_fixture_watch_2026
  set rewarded=true,rewarded_at=now()
  where user_id=v_uid and fixture_id=trim(p_fixture_id);

  update public.repo_world_cup_event_2026
  set qualifying_fixtures=array_append(qualifying_fixtures,v_watch.fixture_id),updated_at=now()
  where user_id=v_uid and not(v_watch.fixture_id=any(qualifying_fixtures));

  select count(*) filter(where p.source='match' and p.event_slot between 4 and 10),
         count(*) filter(where p.event_slot between 1 and 10),
         count(*) filter(where p.event_slot between 1 and 10 and p.opened_at is null)
    into v_match,v_total,v_unopened
  from public.repo_world_cup_packs_2026 p
  where p.user_id=v_uid;

  return query select true,'awarded',v_pack_number,v_match,v_total,v_unopened;
end;
$$;

revoke all on function public.get_my_world_cup_pack_event_state(text) from public;
revoke all on function public.claim_world_cup_free_packs(text) from public;
revoke all on function public.complete_world_cup_fixture_watch(text,integer) from public;
grant execute on function public.get_my_world_cup_pack_event_state(text) to authenticated;
grant execute on function public.claim_world_cup_free_packs(text) to authenticated;
grant execute on function public.complete_world_cup_fixture_watch(text,integer) to authenticated;

commit;
