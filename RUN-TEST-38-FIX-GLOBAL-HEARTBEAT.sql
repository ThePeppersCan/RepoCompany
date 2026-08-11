-- REPO SPORTS V2 TEST 38 — FIX GLOBAL HEARTBEAT SQL
--
-- ROOT CAUSE OF THE STUCK -30:
-- The Test 36/37 PL/pgSQL function RETURNS a column named active_elapsed_ms.
-- Inside UPDATE statements the unqualified expression:
--
--   active_elapsed_ms = active_elapsed_ms + delta_ms
--
-- can collide with that PL/pgSQL output variable, causing the advance RPC to
-- error instead of advancing the shared clock.
--
-- This replaces the heartbeat + completion functions using explicit table
-- aliases everywhere a returned column name could be ambiguous.
--
-- SAFE TO RUN:
-- * Does NOT reset match_serial.
-- * Does NOT reset active_elapsed_ms.
-- * Does NOT alter scores/results.
-- * Existing Test 37 web files can remain installed.
--
-- After running this, leave RepoCompany open. The next heartbeat is within
-- ~5 seconds; the -30 countdown should then begin moving.

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

  select l.*
    into s
    from public.repo_sports_v2_live_state as l
   where l.id = 1
   for update;

  if not found then
    insert into public.repo_sports_v2_live_state(id)
    values(1)
    returning * into s;
  end if;

  stale :=
    s.host_viewer_key is null
    or s.host_seen_at is null
    or s.host_seen_at < n - interval '12 seconds';

  recent_other :=
    s.last_any_seen_at is not null
    and s.last_any_seen_at >= n - interval '7 seconds';

  if stale then
    -- A stale lease may mean the website had zero browsers open.
    -- Do NOT count offline time. Only preserve a short failover gap if another
    -- browser was recently proving that RepoCompany remained open.
    if recent_other and s.last_advanced_at is not null then
      delta_ms := greatest(
        0,
        least(
          16000,
          floor(extract(epoch from (n - s.last_advanced_at)) * 1000)::bigint
        )
      );
    end if;

    update public.repo_sports_v2_live_state as l
       set active_elapsed_ms = l.active_elapsed_ms + delta_ms,
           host_viewer_key = key,
           host_seen_at = n,
           last_advanced_at = n,
           last_any_seen_at = n,
           updated_at = n
     where l.id = 1
     returning l.* into s;

    mine := true;

  elsif s.host_viewer_key = key then
    mine := true;

    if s.last_advanced_at is not null
       and s.last_advanced_at >= n - interval '12 seconds' then
      delta_ms := greatest(
        0,
        least(
          6500,
          floor(extract(epoch from (n - s.last_advanced_at)) * 1000)::bigint
        )
      );
    end if;

    update public.repo_sports_v2_live_state as l
       set active_elapsed_ms = l.active_elapsed_ms + delta_ms,
           host_seen_at = n,
           last_advanced_at = n,
           last_any_seen_at = n,
           updated_at = n
     where l.id = 1
     returning l.* into s;

  else
    -- Non-host browsers still prove that somebody is on RepoCompany.
    update public.repo_sports_v2_live_state as l
       set last_any_seen_at = n,
           updated_at = n
     where l.id = 1
     returning l.* into s;
  end if;

  return query
  select
    s.match_serial,
    s.active_elapsed_ms,
    true,
    floor(extract(epoch from n) * 1000)::bigint,
    s.last_result,
    mine;
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

  select l.*
    into s
    from public.repo_sports_v2_live_state as l
   where l.id = 1
   for update;

  if not found then
    raise exception 'Repo Sports V2 live state is missing';
  end if;

  if s.host_viewer_key <> key
     or s.host_seen_at is null
     or s.host_seen_at < n - interval '12 seconds' then
    raise exception 'Repo Sports V2 rotation completion requires the active host lease';
  end if;

  -- Duplicate completion messages remain idempotent.
  if s.match_serial = p_match_serial then
    update public.repo_sports_v2_live_state as l
       set match_serial = l.match_serial + 1,
           active_elapsed_ms = 0,
           last_result = coalesce(p_result,'{}'::jsonb),
           host_seen_at = n,
           last_advanced_at = n,
           last_any_seen_at = n,
           updated_at = n
     where l.id = 1
     returning l.* into s;
  end if;

  return query
  select
    s.match_serial,
    s.active_elapsed_ms,
    true,
    floor(extract(epoch from n) * 1000)::bigint,
    s.last_result;
end;
$$;

grant execute on function public.advance_repo_sports_v2_background(text)
to anon, authenticated;

grant execute on function public.complete_repo_sports_v2_rotation(text,bigint,jsonb)
to anon, authenticated;


-- Diagnostic only: after running the script this displays the current singleton
-- live-state row. It does not change anything.
select
  l.match_serial,
  l.active_elapsed_ms,
  l.host_viewer_key,
  l.host_seen_at,
  l.last_advanced_at,
  l.last_any_seen_at,
  l.updated_at
from public.repo_sports_v2_live_state as l
where l.id = 1;
