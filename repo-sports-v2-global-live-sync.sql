-- REPO SPORTS V2 — GLOBAL LIVE BROADCAST CLOCK / LEASE
-- Run once in Supabase SQL Editor before installing Test 36.
--
-- Behaviour:
-- * One open browser anywhere on RepoCompany acquires/renews a short host lease.
-- * Only that lease holder advances the shared active-viewer clock.
-- * If every browser leaves, heartbeats stop and active_elapsed_ms freezes.
-- * Returning hours later resumes the same match from the frozen point; offline
--   time is never added.
-- * The deterministic V2 client derives fixture + simulation from match_serial
--   and active_elapsed_ms, so all viewers join the same broadcast.

create table if not exists public.repo_sports_v2_live_state (
  id smallint primary key default 1 check (id = 1),
  match_serial bigint not null default 1 check (match_serial > 0),
  active_elapsed_ms bigint not null default 0 check (active_elapsed_ms >= 0),
  host_viewer_key text,
  host_seen_at timestamptz,
  last_advanced_at timestamptz,
  last_any_seen_at timestamptz,
  last_result jsonb,
  updated_at timestamptz not null default clock_timestamp()
);

insert into public.repo_sports_v2_live_state(id,match_serial,active_elapsed_ms)
values (1,1,0)
on conflict (id) do nothing;

alter table public.repo_sports_v2_live_state add column if not exists last_any_seen_at timestamptz;

alter table public.repo_sports_v2_live_state enable row level security;
revoke all on public.repo_sports_v2_live_state from anon, authenticated;

create or replace function public.get_repo_sports_v2_live_state()
returns table(
  match_serial bigint,
  active_elapsed_ms bigint,
  running boolean,
  server_now_ms bigint,
  last_result jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.repo_sports_v2_live_state%rowtype;
  n timestamptz := clock_timestamp();
  extra_ms bigint := 0;
begin
  select * into s from public.repo_sports_v2_live_state where id=1;
  if not found then
    insert into public.repo_sports_v2_live_state(id) values(1) returning * into s;
  end if;

  -- Extrapolate only while a host lease is genuinely fresh. This gives viewers
  -- a smooth shared clock between the five-second host heartbeats.
  if s.host_seen_at is not null and s.last_advanced_at is not null
     and s.host_seen_at >= n - interval '12 seconds'
     and s.last_advanced_at >= n - interval '12 seconds' then
    extra_ms := greatest(0, least(6500, floor(extract(epoch from (n-s.last_advanced_at))*1000)::bigint));
  end if;

  return query select s.match_serial,
    s.active_elapsed_ms + extra_ms,
    (s.host_seen_at is not null and s.host_seen_at >= n - interval '12 seconds'),
    floor(extract(epoch from n)*1000)::bigint,
    s.last_result;
end;
$$;

create or replace function public.advance_repo_sports_v2_background(p_viewer_key text)
returns table(
  match_serial bigint,
  active_elapsed_ms bigint,
  running boolean,
  server_now_ms bigint,
  last_result jsonb,
  is_host boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.repo_sports_v2_live_state%rowtype;
  n timestamptz := clock_timestamp();
  key text := left(coalesce(nullif(trim(p_viewer_key),''),'anonymous'),160);
  stale boolean;
  delta_ms bigint := 0;
  mine boolean := false;
  recent_other boolean := false;
begin
  perform pg_advisory_xact_lock(hashtext('repo_sports_v2_global_live')::bigint);
  select * into s from public.repo_sports_v2_live_state where id=1 for update;
  if not found then
    insert into public.repo_sports_v2_live_state(id) values(1) returning * into s;
  end if;

  stale := s.host_viewer_key is null or s.host_seen_at is null or s.host_seen_at < n - interval '12 seconds';
  recent_other := s.last_any_seen_at is not null and s.last_any_seen_at >= n - interval '7 seconds';

  if stale then
    -- A stale lease means there may have been zero browsers online. Deliberately
    -- DO NOT add n-last_advanced_at here: downtime must not run matches.
    -- If another browser was still heartbeating recently, this is a host
    -- failover rather than an empty-site gap. Preserve that active website time.
    if recent_other and s.last_advanced_at is not null then
      delta_ms := greatest(0, least(16000, floor(extract(epoch from (n-s.last_advanced_at))*1000)::bigint));
    end if;
    update public.repo_sports_v2_live_state
       set active_elapsed_ms=active_elapsed_ms+delta_ms,
           host_viewer_key=key, host_seen_at=n, last_advanced_at=n,last_any_seen_at=n, updated_at=n
     where id=1 returning * into s;
    mine := true;
  elsif s.host_viewer_key = key then
    mine := true;
    if s.last_advanced_at is not null and s.last_advanced_at >= n - interval '12 seconds' then
      delta_ms := greatest(0, least(6500, floor(extract(epoch from (n-s.last_advanced_at))*1000)::bigint));
    end if;
    update public.repo_sports_v2_live_state
       set active_elapsed_ms=active_elapsed_ms+delta_ms,
           host_seen_at=n,last_advanced_at=n,last_any_seen_at=n,updated_at=n
     where id=1 returning * into s;
  else
    -- Non-host browsers prove that the website still has somebody online. This
    -- lets a later lease takeover distinguish a real failover from zero viewers.
    update public.repo_sports_v2_live_state set last_any_seen_at=n,updated_at=n where id=1 returning * into s;
  end if;

  return query select s.match_serial,s.active_elapsed_ms,true,
    floor(extract(epoch from n)*1000)::bigint,s.last_result,mine;
end;
$$;

create or replace function public.complete_repo_sports_v2_rotation(
  p_viewer_key text,
  p_match_serial bigint,
  p_result jsonb default '{}'::jsonb
)
returns table(
  match_serial bigint,
  active_elapsed_ms bigint,
  running boolean,
  server_now_ms bigint,
  last_result jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.repo_sports_v2_live_state%rowtype;
  n timestamptz := clock_timestamp();
  key text := left(coalesce(nullif(trim(p_viewer_key),''),'anonymous'),160);
begin
  perform pg_advisory_xact_lock(hashtext('repo_sports_v2_global_live')::bigint);
  select * into s from public.repo_sports_v2_live_state where id=1 for update;
  if not found then raise exception 'Repo Sports V2 live state is missing'; end if;

  if s.host_viewer_key <> key or s.host_seen_at is null or s.host_seen_at < n - interval '12 seconds' then
    raise exception 'Repo Sports V2 rotation completion requires the active host lease';
  end if;

  -- Idempotent: duplicate completion messages from the same finished match do
  -- not skip an extra rotation.
  if s.match_serial = p_match_serial then
    update public.repo_sports_v2_live_state
       set match_serial=match_serial+1,active_elapsed_ms=0,last_result=coalesce(p_result,'{}'::jsonb),
           host_seen_at=n,last_advanced_at=n,last_any_seen_at=n,updated_at=n
     where id=1 returning * into s;
  end if;

  return query select s.match_serial,s.active_elapsed_ms,true,
    floor(extract(epoch from n)*1000)::bigint,s.last_result;
end;
$$;

grant execute on function public.get_repo_sports_v2_live_state() to anon, authenticated;
grant execute on function public.advance_repo_sports_v2_background(text) to anon, authenticated;
grant execute on function public.complete_repo_sports_v2_rotation(text,bigint,jsonb) to anon, authenticated;
