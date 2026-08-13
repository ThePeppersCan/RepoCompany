-- REPO SPORTS WORLD CUP 2026 — LIMITED EVENT V1.5
-- 10 pack locker: 2 complimentary packs + 8 full-fixture match packs.
-- 12-card display capacity, while only the current 10 installed cards are in the pull pool.
-- Safe migration over V1.3/V1.4. Existing opened cards and watch history are preserved.

begin;

-- The collection UI is now 12-card ready. The two future card slots are visible but
-- are NOT added to the pack-opening pool until their actual assets/IDs are installed.
alter table public.repo_world_cup_event_2026
  drop constraint if exists repo_wc26_max_cards;
alter table public.repo_world_cup_event_2026
  add constraint repo_wc26_max_cards check (cardinality(cards) <= 12);

-- V1.4 briefly granted 3 free packs. Normalize accounts back to 2 where this can be
-- done without destroying an already-opened reward. Opened packs/cards are never deleted.
with ranked_free as (
  select
    p.pack_id,
    p.opened_at,
    row_number() over (
      partition by p.user_id
      order by (p.opened_at is not null) desc, p.awarded_at asc, p.pack_id asc
    ) as keep_rank
  from public.repo_world_cup_packs_2026 p
  where p.source='free'
), removable as (
  select pack_id
  from ranked_free
  where keep_rank > 2
    and opened_at is null
)
delete from public.repo_world_cup_packs_2026 p
using removable r
where p.pack_id=r.pack_id;

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
  v_uid uuid := auth.uid();
  v_total integer;
  v_free integer;
  v_missing integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.repo_wc26_ensure_event_row(p_username);

  -- Lock the account event row while the one-time welcome allocation is reconciled.
  perform 1 from public.repo_world_cup_event_2026 e where e.user_id=v_uid for update;

  select count(*),count(*) filter(where p.source='free')
    into v_total,v_free
  from public.repo_world_cup_packs_2026 p
  where p.user_id=v_uid;

  v_missing:=greatest(0,2-v_free);
  if v_total+v_missing>10 then
    raise exception 'World Cup event pack maximum would be exceeded';
  end if;

  if v_missing>0 then
    for i in 1..v_missing loop
      insert into public.repo_world_cup_packs_2026(user_id,source)
      values(v_uid,'free');
    end loop;
  end if;

  update public.repo_world_cup_event_2026
  set free_packs_claimed=true,updated_at=now()
  where user_id=v_uid;

  return query select * from public.get_my_world_cup_pack_event_state(p_username);
end;
$$;

create or replace function public.complete_world_cup_fixture_watch(
  p_fixture_id text,
  p_match_elapsed_seconds integer default 1080
)
returns table(awarded boolean,reason text,pack_number integer,match_packs_earned integer,total_packs_awarded integer,unopened_packs integer)
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

  if v_watch.rewarded then
    select count(*) filter(where p.source='match'),count(*),count(*) filter(where p.opened_at is null)
      into v_match,v_total,v_unopened
    from public.repo_world_cup_packs_2026 p
    where p.user_id=v_uid;
    return query select false,'already_rewarded',v_total,v_match,v_total,v_unopened;
    return;
  end if;

  if v_watch.first_match_elapsed_seconds>120 then
    return query select false,'joined_too_late',0,0,0,0;
    return;
  end if;
  if greatest(v_watch.last_match_elapsed_seconds,coalesce(p_match_elapsed_seconds,0))<1075 then
    return query select false,'match_not_finished',0,0,0,0;
    return;
  end if;
  if v_watch.watched_seconds<960 then
    return query select false,'insufficient_full_fixture_watch',0,0,0,0;
    return;
  end if;

  select count(*) filter(where p.source='match'),count(*)
    into v_match,v_total
  from public.repo_world_cup_packs_2026 p
  where p.user_id=v_uid;

  if v_match>=8 then
    return query select false,'eight_match_pack_limit_reached',v_total,v_match,v_total,
      (select count(*)::integer from public.repo_world_cup_packs_2026 p where p.user_id=v_uid and p.opened_at is null);
    return;
  end if;
  if v_total>=10 then
    return query select false,'ten_pack_event_limit_reached',v_total,v_match,v_total,
      (select count(*)::integer from public.repo_world_cup_packs_2026 p where p.user_id=v_uid and p.opened_at is null);
    return;
  end if;

  insert into public.repo_world_cup_packs_2026(user_id,source,fixture_id,fixture_label,team_a,team_b,stage,fixture_started_at)
  values(v_uid,'match',v_watch.fixture_id,v_watch.fixture_label,v_watch.team_a,v_watch.team_b,v_watch.stage,v_watch.fixture_started_at)
  on conflict do nothing;

  if not found then
    return query select false,'already_rewarded',v_total,v_match,v_total,
      (select count(*)::integer from public.repo_world_cup_packs_2026 p where p.user_id=v_uid and p.opened_at is null);
    return;
  end if;

  update public.repo_world_cup_fixture_watch_2026
  set rewarded=true,rewarded_at=now()
  where user_id=v_uid and fixture_id=trim(p_fixture_id);

  update public.repo_world_cup_event_2026
  set qualifying_fixtures=array_append(qualifying_fixtures,v_watch.fixture_id),updated_at=now()
  where user_id=v_uid and not(v_watch.fixture_id=any(qualifying_fixtures));

  select count(*) filter(where p.source='match'),count(*),count(*) filter(where p.opened_at is null)
    into v_match,v_total,v_unopened
  from public.repo_world_cup_packs_2026 p
  where p.user_id=v_uid;

  v_pack_number:=v_total;
  return query select true,'awarded',v_pack_number,v_match,v_total,v_unopened;
end;
$$;

revoke all on function public.claim_world_cup_free_packs(text) from public;
grant execute on function public.claim_world_cup_free_packs(text) to authenticated;
revoke all on function public.complete_world_cup_fixture_watch(text,integer) from public;
grant execute on function public.complete_world_cup_fixture_watch(text,integer) to authenticated;

commit;
