-- REPO SPORTS WORLD CUP 2026 — 8 PACK EVENT
-- 3 free packs once per authenticated account + max 5 qualifying full-fixture packs.
-- Run once in Supabase SQL Editor before deploying the matching script.js.

create extension if not exists pgcrypto;

create table if not exists public.repo_world_cup_event_2026 (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text,
  free_packs_claimed boolean not null default false,
  qualifying_fixtures text[] not null default '{}'::text[],
  cards text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repo_wc26_max_cards check (cardinality(cards) <= 8)
);

create table if not exists public.repo_world_cup_packs_2026 (
  pack_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('free','match')),
  fixture_id text,
  fixture_label text,
  team_a text,
  team_b text,
  stage text,
  fixture_started_at timestamptz,
  awarded_at timestamptz not null default now(),
  opened_at timestamptz,
  card_id text,
  constraint repo_wc26_match_has_fixture check (source <> 'match' or fixture_id is not null),
  constraint repo_wc26_opened_has_card check (opened_at is null or card_id is not null)
);
create index if not exists repo_wc26_packs_user_idx on public.repo_world_cup_packs_2026(user_id, awarded_at);
create unique index if not exists repo_wc26_one_match_pack_per_fixture
  on public.repo_world_cup_packs_2026(user_id, fixture_id)
  where source='match' and fixture_id is not null;

create table if not exists public.repo_world_cup_fixture_watch_2026 (
  user_id uuid not null references auth.users(id) on delete cascade,
  fixture_id text not null,
  fixture_label text,
  team_a text,
  team_b text,
  stage text,
  fixture_started_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  first_match_elapsed_seconds integer not null default 0,
  last_match_elapsed_seconds integer not null default 0,
  watched_seconds integer not null default 0,
  heartbeat_count integer not null default 0,
  completed boolean not null default false,
  rewarded boolean not null default false,
  rewarded_at timestamptz,
  primary key(user_id,fixture_id),
  constraint repo_wc26_watch_nonnegative check (watched_seconds >= 0 and heartbeat_count >= 0)
);

alter table public.repo_world_cup_event_2026 enable row level security;
alter table public.repo_world_cup_packs_2026 enable row level security;
alter table public.repo_world_cup_fixture_watch_2026 enable row level security;

-- No direct table policies are intentionally created. Authenticated clients use SECURITY DEFINER RPCs below.
revoke all on public.repo_world_cup_event_2026 from anon, authenticated;
revoke all on public.repo_world_cup_packs_2026 from anon, authenticated;
revoke all on public.repo_world_cup_fixture_watch_2026 from anon, authenticated;

create or replace function public.repo_wc26_ensure_event_row(p_username text default null)
returns void
language plpgsql
security definer
set search_path=public,auth
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  insert into public.repo_world_cup_event_2026(user_id,username)
  values(v_uid,nullif(trim(p_username),''))
  on conflict(user_id) do update set
    username=coalesce(nullif(trim(excluded.username),''),public.repo_world_cup_event_2026.username),
    updated_at=now();
end;
$$;

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
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.repo_wc26_ensure_event_row(p_username);
  return query
  select e.username,e.free_packs_claimed,
    count(*) filter(where p.source='free')::integer,
    count(*) filter(where p.source='match')::integer,
    count(p.pack_id)::integer,
    count(*) filter(where p.pack_id is not null and p.opened_at is null)::integer,
    count(*) filter(where p.opened_at is not null)::integer,
    coalesce(e.cards,'{}'::text[]),coalesce(e.qualifying_fixtures,'{}'::text[]),
    coalesce(jsonb_agg(jsonb_build_object(
      'pack_id',p.pack_id,'source',p.source,'fixture_id',p.fixture_id,'fixture_label',p.fixture_label,
      'team_a',p.team_a,'team_b',p.team_b,'stage',p.stage,'fixture_started_at',p.fixture_started_at,
      'awarded_at',p.awarded_at,'opened_at',p.opened_at,'card_id',p.card_id,
      'ordinal',(select count(*) from public.repo_world_cup_packs_2026 p2 where p2.user_id=v_uid and (p2.awarded_at<p.awarded_at or (p2.awarded_at=p.awarded_at and p2.pack_id::text<=p.pack_id::text)))
    ) order by p.awarded_at,p.pack_id) filter(where p.pack_id is not null),'[]'::jsonb)
  from public.repo_world_cup_event_2026 e
  left join public.repo_world_cup_packs_2026 p on p.user_id=e.user_id
  where e.user_id=v_uid
  group by e.user_id,e.username,e.free_packs_claimed,e.cards,e.qualifying_fixtures;
end;
$$;

create or replace function public.claim_world_cup_free_packs(p_username text default null)
returns table(
  username text,free_packs_claimed boolean,free_packs_awarded integer,match_packs_earned integer,
  total_packs_awarded integer,unopened_packs integer,opened_packs integer,cards text[],qualifying_fixtures text[],packs jsonb
)
language plpgsql
security definer
set search_path=public,auth
as $$
declare v_uid uuid := auth.uid(); v_claimed boolean; v_total integer; v_free integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.repo_wc26_ensure_event_row(p_username);
  select e.free_packs_claimed into v_claimed from public.repo_world_cup_event_2026 e where e.user_id=v_uid for update;
  select count(*),count(*) filter(where source='free') into v_total,v_free from public.repo_world_cup_packs_2026 where user_id=v_uid;
  if not v_claimed then
    if v_total+greatest(0,3-v_free)>8 then raise exception 'World Cup event pack maximum would be exceeded'; end if;
    for i in (v_free+1)..3 loop
      insert into public.repo_world_cup_packs_2026(user_id,source) values(v_uid,'free');
    end loop;
    update public.repo_world_cup_event_2026 set free_packs_claimed=true,updated_at=now() where user_id=v_uid;
  end if;
  return query select * from public.get_my_world_cup_pack_event_state(p_username);
end;
$$;

create or replace function public.record_world_cup_fixture_watch_heartbeat(
  p_fixture_id text,
  p_fixture_label text default null,
  p_team_a text default null,
  p_team_b text default null,
  p_stage text default null,
  p_fixture_started_at timestamptz default null,
  p_match_elapsed_seconds integer default 0,
  p_phase text default ''
)
returns table(watched_seconds integer,heartbeat_count integer,first_match_elapsed_seconds integer,last_match_elapsed_seconds integer,rewarded boolean)
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid := auth.uid(); v_now timestamptz:=now(); v_previous timestamptz; v_add integer:=0; v_phase text:=lower(coalesce(p_phase,''));
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_fixture_id),'') is null then raise exception 'Fixture id required'; end if;
  perform public.repo_wc26_ensure_event_row(null);
  insert into public.repo_world_cup_fixture_watch_2026(
    user_id,fixture_id,fixture_label,team_a,team_b,stage,fixture_started_at,first_seen_at,last_seen_at,
    first_match_elapsed_seconds,last_match_elapsed_seconds,heartbeat_count
  ) values(
    v_uid,trim(p_fixture_id),p_fixture_label,p_team_a,p_team_b,p_stage,p_fixture_started_at,v_now,v_now,
    greatest(0,coalesce(p_match_elapsed_seconds,0)),greatest(0,coalesce(p_match_elapsed_seconds,0)),1
  ) on conflict(user_id,fixture_id) do nothing;

  select w.last_seen_at into v_previous from public.repo_world_cup_fixture_watch_2026 w where w.user_id=v_uid and w.fixture_id=trim(p_fixture_id) for update;
  if v_previous < v_now and v_phase in ('first','second','shootout') and v_now-v_previous <= interval '45 seconds' then
    v_add:=least(30,greatest(0,floor(extract(epoch from (v_now-v_previous)))::integer));
  end if;
  update public.repo_world_cup_fixture_watch_2026 w set
    fixture_label=coalesce(nullif(trim(p_fixture_label),''),w.fixture_label),
    team_a=coalesce(nullif(trim(p_team_a),''),w.team_a),team_b=coalesce(nullif(trim(p_team_b),''),w.team_b),
    stage=coalesce(nullif(trim(p_stage),''),w.stage),fixture_started_at=coalesce(p_fixture_started_at,w.fixture_started_at),
    last_seen_at=v_now,first_match_elapsed_seconds=least(w.first_match_elapsed_seconds,greatest(0,coalesce(p_match_elapsed_seconds,0))),
    last_match_elapsed_seconds=greatest(w.last_match_elapsed_seconds,greatest(0,coalesce(p_match_elapsed_seconds,0))),
    watched_seconds=w.watched_seconds+v_add,heartbeat_count=w.heartbeat_count+1
  where w.user_id=v_uid and w.fixture_id=trim(p_fixture_id);
  return query select w.watched_seconds,w.heartbeat_count,w.first_match_elapsed_seconds,w.last_match_elapsed_seconds,w.rewarded
    from public.repo_world_cup_fixture_watch_2026 w where w.user_id=v_uid and w.fixture_id=trim(p_fixture_id);
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
  v_uid uuid:=auth.uid(); v_watch public.repo_world_cup_fixture_watch_2026%rowtype;
  v_match integer; v_total integer; v_unopened integer; v_pack_number integer;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.repo_wc26_ensure_event_row(null);
  select * into v_watch from public.repo_world_cup_fixture_watch_2026 w where w.user_id=v_uid and w.fixture_id=trim(p_fixture_id) for update;
  if not found then return query select false,'no_watch_record',0,0,0,0;return; end if;
  update public.repo_world_cup_fixture_watch_2026 set completed=true,last_match_elapsed_seconds=greatest(last_match_elapsed_seconds,coalesce(p_match_elapsed_seconds,0)) where user_id=v_uid and fixture_id=trim(p_fixture_id);
  if v_watch.rewarded then
    select count(*) filter(where source='match'),count(*),count(*) filter(where opened_at is null) into v_match,v_total,v_unopened from public.repo_world_cup_packs_2026 where user_id=v_uid;
    return query select false,'already_rewarded',v_total,v_match,v_total,v_unopened;return;
  end if;
  if v_watch.first_match_elapsed_seconds>120 then return query select false,'joined_too_late',0,0,0,0;return; end if;
  if greatest(v_watch.last_match_elapsed_seconds,coalesce(p_match_elapsed_seconds,0))<1075 then return query select false,'match_not_finished',0,0,0,0;return; end if;
  if v_watch.watched_seconds<960 then return query select false,'insufficient_full_fixture_watch',0,0,0,0;return; end if;
  select count(*) filter(where source='match'),count(*) into v_match,v_total from public.repo_world_cup_packs_2026 where user_id=v_uid;
  if v_match>=5 then return query select false,'five_match_pack_limit_reached',v_total,v_match,v_total,(select count(*)::integer from public.repo_world_cup_packs_2026 where user_id=v_uid and opened_at is null);return; end if;
  if v_total>=8 then return query select false,'eight_pack_event_limit_reached',v_total,v_match,v_total,(select count(*)::integer from public.repo_world_cup_packs_2026 where user_id=v_uid and opened_at is null);return; end if;
  insert into public.repo_world_cup_packs_2026(user_id,source,fixture_id,fixture_label,team_a,team_b,stage,fixture_started_at)
  values(v_uid,'match',v_watch.fixture_id,v_watch.fixture_label,v_watch.team_a,v_watch.team_b,v_watch.stage,v_watch.fixture_started_at)
  on conflict do nothing;
  if not found then return query select false,'already_rewarded',v_total,v_match,v_total,(select count(*)::integer from public.repo_world_cup_packs_2026 where user_id=v_uid and opened_at is null);return; end if;
  update public.repo_world_cup_fixture_watch_2026 set rewarded=true,rewarded_at=now() where user_id=v_uid and fixture_id=trim(p_fixture_id);
  update public.repo_world_cup_event_2026 set qualifying_fixtures=array_append(qualifying_fixtures,v_watch.fixture_id),updated_at=now() where user_id=v_uid and not(v_watch.fixture_id=any(qualifying_fixtures));
  select count(*) filter(where source='match'),count(*),count(*) filter(where opened_at is null) into v_match,v_total,v_unopened from public.repo_world_cup_packs_2026 where user_id=v_uid;
  v_pack_number:=v_total;
  return query select true,'awarded',v_pack_number,v_match,v_total,v_unopened;
end;
$$;

create or replace function public.open_world_cup_pack_2026(p_username text default null)
returns table(
  card_id text,pack_id uuid,source text,fixture_id text,fixture_label text,team_a text,team_b text,stage text,
  free_packs_claimed boolean,match_packs_earned integer,total_packs_awarded integer,unopened_packs integer,opened_packs integer,cards text[],packs jsonb
)
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid:=auth.uid(); v_pack public.repo_world_cup_packs_2026%rowtype; v_cards text[]; v_card text; v_state record;
  v_pool constant text[]:=array[
    'wc2026_debbie_sorevia','wc2026_dopey_dom_drazhen','wc2026_jenny_sorevia','wc2026_jud_belros','wc2026_mad_rager_nambara',
    'wc2026_nimbler_2000_belros','wc2026_pipsqueak_vardesh','wc2026_soup_talune','wc2026_besquelcher_iskandar','wc2026_rocky_norveth'
  ];
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.repo_wc26_ensure_event_row(p_username);
  select * into v_pack from public.repo_world_cup_packs_2026 p where p.user_id=v_uid and p.opened_at is null order by p.awarded_at,p.pack_id limit 1 for update skip locked;
  if not found then raise exception 'No unopened World Cup packs'; end if;
  select e.cards into v_cards from public.repo_world_cup_event_2026 e where e.user_id=v_uid for update;
  select candidate into v_card from unnest(v_pool) candidate where not(candidate=any(coalesce(v_cards,'{}'::text[]))) order by random() limit 1;
  if v_card is null then raise exception 'All World Cup event cards already unlocked'; end if;
  update public.repo_world_cup_packs_2026 set opened_at=now(),card_id=v_card where pack_id=v_pack.pack_id;
  update public.repo_world_cup_event_2026 set cards=array_append(cards,v_card),updated_at=now() where user_id=v_uid;
  select * into v_state from public.get_my_world_cup_pack_event_state(p_username);
  return query select v_card,v_pack.pack_id,v_pack.source,v_pack.fixture_id,v_pack.fixture_label,v_pack.team_a,v_pack.team_b,v_pack.stage,
    v_state.free_packs_claimed,v_state.match_packs_earned,v_state.total_packs_awarded,v_state.unopened_packs,v_state.opened_packs,v_state.cards,v_state.packs;
end;
$$;

create or replace function public.get_public_world_cup_cards_2026(p_username text)
returns table(username text,cards text[])
language sql
security definer
set search_path=public,auth
as $$
  select e.username,e.cards from public.repo_world_cup_event_2026 e
  where lower(e.username)=lower(trim(p_username))
  order by e.updated_at desc limit 1
$$;

revoke all on function public.repo_wc26_ensure_event_row(text) from public;
revoke all on function public.get_my_world_cup_pack_event_state(text) from public;
revoke all on function public.claim_world_cup_free_packs(text) from public;
revoke all on function public.record_world_cup_fixture_watch_heartbeat(text,text,text,text,text,timestamptz,integer,text) from public;
revoke all on function public.complete_world_cup_fixture_watch(text,integer) from public;
revoke all on function public.open_world_cup_pack_2026(text) from public;
revoke all on function public.get_public_world_cup_cards_2026(text) from public;

grant execute on function public.repo_wc26_ensure_event_row(text) to authenticated;
grant execute on function public.get_my_world_cup_pack_event_state(text) to authenticated;
grant execute on function public.claim_world_cup_free_packs(text) to authenticated;
grant execute on function public.record_world_cup_fixture_watch_heartbeat(text,text,text,text,text,timestamptz,integer,text) to authenticated;
grant execute on function public.complete_world_cup_fixture_watch(text,integer) to authenticated;
grant execute on function public.open_world_cup_pack_2026(text) to authenticated;
grant execute on function public.get_public_world_cup_cards_2026(text) to authenticated;
