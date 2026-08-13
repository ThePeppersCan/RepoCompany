-- REPO SPORTS WORLD CUP 2026 — LIMITED EVENT V1.9
-- TWO FREE PACKS + EIGHT MATCH PACKS + CLEAN WORLD CUP CARD RETEST RESET
--
-- IMPORTANT: This migration intentionally clears EVERY ACCOUNT'S current
-- World Cup Limited Event card discoveries and reopens their awarded event
-- packs so the special-card reveal flow can be tested again from zero.
--
-- It DOES preserve:
--   * World Cup fixture watch history
--   * which qualifying fixtures already earned a match pack
--   * World Cup Passport attendance / ticket stamps
--   * account identities
--
-- It DOES reset:
--   * event.cards (World Cup Limited Event discoveries)
--   * opened_at/card_id on World Cup event packs
--   * the previous free-pack claim state
--   * all prior free-pack rows, replacing the progression with exactly TWO
--     claimable free packs (Welcome Pack + World Cup Pack)
--
-- New 10-pack path:
--   1  Welcome Pack       FREE
--   2  World Cup Pack     FREE
--   3  Match Pack I       WATCH
--   4  Match Pack II      WATCH
--   5  Match Pack III     WATCH
--   6  Match Pack IV      WATCH
--   7  Match Pack V       WATCH
--   8  Match Pack VI      WATCH
--   9  Match Pack VII     WATCH
--   10 Final Pack         WATCH (Match Pack VIII)

begin;

alter table public.repo_world_cup_event_2026
  drop constraint if exists repo_wc26_max_cards;
alter table public.repo_world_cup_event_2026
  add constraint repo_wc26_max_cards check (cardinality(cards) <= 12);

alter table public.repo_world_cup_packs_2026
  add column if not exists event_slot smallint;
alter table public.repo_world_cup_packs_2026
  drop constraint if exists repo_wc26_event_slot_range;
alter table public.repo_world_cup_packs_2026
  add constraint repo_wc26_event_slot_range
  check (event_slot is null or event_slot between 1 and 10);

-- ---------------------------------------------------------------------------
-- INTENTIONAL GLOBAL RETEST RESET
-- ---------------------------------------------------------------------------

-- Remove all current World Cup Limited Event discoveries from the event state.
update public.repo_world_cup_event_2026
set cards='{}'::text[],
    free_packs_claimed=false,
    updated_at=now();

-- Reopen every event pack so no prior World Cup card remains attached to it.
update public.repo_world_cup_packs_2026
set opened_at=null,
    card_id=null;

-- Reset locker placement before applying the new 2-free / 8-watch path.
update public.repo_world_cup_packs_2026
set event_slot=null;

-- Previous free allocations are deliberately removed. Each account will claim
-- exactly two fresh free packs through claim_world_cup_free_packs().
delete from public.repo_world_cup_packs_2026
where source='free';

-- Preserve legitimate match-pack awards/watch history and remap the first eight
-- earned match packs into the new slots 3-10. Grandfathered extras remain in the
-- database without a locker slot rather than being destructively deleted.
with ranked_match as (
  select p.pack_id,
         row_number() over(
           partition by p.user_id
           order by p.awarded_at,p.pack_id
         ) as rn
  from public.repo_world_cup_packs_2026 p
  where p.source='match'
)
update public.repo_world_cup_packs_2026 p
set event_slot=(2+r.rn)::smallint
from ranked_match r
where p.pack_id=r.pack_id
  and r.rn<=8;

-- Rebuild the slot uniqueness index after the remap.
drop index if exists public.repo_wc26_one_event_slot_per_user;
create unique index repo_wc26_one_event_slot_per_user
  on public.repo_world_cup_packs_2026(user_id,event_slot)
  where event_slot is not null;

-- ---------------------------------------------------------------------------
-- STATE API — exactly 2 free / 8 match locker slots
-- ---------------------------------------------------------------------------
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
    count(*) filter(where p.source='free' and p.event_slot between 1 and 2)::integer,
    count(*) filter(where p.source='match' and p.event_slot between 3 and 10)::integer,
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

-- Exactly TWO complimentary packs, once per account after this reset.
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

  for v_slot in 1..2 loop
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

-- Eight watch rewards occupy slots 3-10. Slot 10 is the Final Pack.
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

  select count(*) filter(where p.source='match' and p.event_slot between 3 and 10),
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

  if v_match>=8 then
    return query select false,'eight_match_pack_limit_reached',10,v_match,v_total,v_unopened;
    return;
  end if;
  if v_total>=10 then
    return query select false,'ten_pack_event_limit_reached',10,v_match,v_total,v_unopened;
    return;
  end if;

  v_pack_number:=3+v_match;

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

  select count(*) filter(where p.source='match' and p.event_slot between 3 and 10),
         count(*) filter(where p.event_slot between 1 and 10),
         count(*) filter(where p.event_slot between 1 and 10 and p.opened_at is null)
    into v_match,v_total,v_unopened
  from public.repo_world_cup_packs_2026 p
  where p.user_id=v_uid;

  return query select true,'awarded',v_pack_number,v_match,v_total,v_unopened;
end;
$$;

-- Exact-slot pack opening. The server persists the card before the cinematic
-- walkout begins. Current pull pool contains only the ten real installed cards;
-- the two future cards are intentionally not invented or made pullable yet.
create or replace function public.open_world_cup_pack_slot_2026(
  p_pack_id uuid,
  p_username text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid:=auth.uid();
  v_pack public.repo_world_cup_packs_2026%rowtype;
  v_cards text[];
  v_card text;
  v_is_duplicate boolean:=false;
  v_pool constant text[]:=array[
    'wc2026_debbie_sorevia',
    'wc2026_dopey_dom_drazhen',
    'wc2026_jenny_sorevia',
    'wc2026_jud_belros',
    'wc2026_mad_rager_nambara',
    'wc2026_nimbler_2000_belros',
    'wc2026_pipsqueak_vardesh',
    'wc2026_soup_talune',
    'wc2026_besquelcher_iskandar',
    'wc2026_rocky_norveth'
  ];
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_pack_id is null then raise exception 'World Cup pack slot is required'; end if;

  perform public.repo_wc26_ensure_event_row(p_username);

  select p.* into v_pack
  from public.repo_world_cup_packs_2026 as p
  where p.user_id=v_uid
    and p.pack_id=p_pack_id
    and p.event_slot between 1 and 10
  for update;

  if not found then raise exception 'World Cup pack not found for this account'; end if;
  if v_pack.opened_at is not null then raise exception 'This World Cup pack has already been opened'; end if;

  select coalesce(e.cards,'{}'::text[]) into v_cards
  from public.repo_world_cup_event_2026 as e
  where e.user_id=v_uid
  for update;

  -- Prefer an undiscovered card. If every currently installed card is already
  -- discovered, duplicates are allowed and still receive the complete walkout.
  select pool_card.card_id into v_card
  from unnest(v_pool) as pool_card(card_id)
  where not (pool_card.card_id=any(coalesce(v_cards,'{}'::text[])))
  order by random()
  limit 1;

  if v_card is null then
    select pool_card.card_id into v_card
    from unnest(v_pool) as pool_card(card_id)
    order by random()
    limit 1;
    v_is_duplicate:=true;
  end if;

  if v_card is null then raise exception 'No World Cup event cards are configured'; end if;
  if v_card=any(coalesce(v_cards,'{}'::text[])) then v_is_duplicate:=true; end if;

  update public.repo_world_cup_packs_2026 as p
  set opened_at=now(),card_id=v_card
  where p.user_id=v_uid and p.pack_id=p_pack_id and p.opened_at is null;

  if not found then raise exception 'This World Cup pack was already opened in another tab'; end if;

  -- A duplicate is tracked on the pack but must not increment the discovered set.
  if not v_is_duplicate then
    update public.repo_world_cup_event_2026 as e
    set cards=array_append(coalesce(e.cards,'{}'::text[]),v_card),updated_at=now()
    where e.user_id=v_uid;
  else
    update public.repo_world_cup_event_2026 as e
    set updated_at=now()
    where e.user_id=v_uid;
  end if;

  return jsonb_build_object(
    'card_id',v_card,
    'is_duplicate',v_is_duplicate,
    'event_pack_id',v_pack.pack_id,
    'source',v_pack.source,
    'fixture_id',v_pack.fixture_id,
    'fixture_label',v_pack.fixture_label,
    'team_a',v_pack.team_a,
    'team_b',v_pack.team_b,
    'stage',v_pack.stage,
    'event_slot',v_pack.event_slot
  );
end;
$$;

revoke all on function public.get_my_world_cup_pack_event_state(text) from public;
revoke all on function public.claim_world_cup_free_packs(text) from public;
revoke all on function public.complete_world_cup_fixture_watch(text,integer) from public;
revoke all on function public.open_world_cup_pack_slot_2026(uuid,text) from public;
grant execute on function public.get_my_world_cup_pack_event_state(text) to authenticated;
grant execute on function public.claim_world_cup_free_packs(text) to authenticated;
grant execute on function public.complete_world_cup_fixture_watch(text,integer) to authenticated;
grant execute on function public.open_world_cup_pack_slot_2026(uuid,text) to authenticated;

commit;
