-- REPO SPORTS V2 TEST 37 — GLOBAL CLOCK FUNCTION REFRESH
-- Safe after Test 36. This does NOT reset the current match, serial or elapsed time.

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

  if s.host_seen_at is not null and s.last_advanced_at is not null
     and s.host_seen_at >= n - interval '12 seconds'
     and s.last_advanced_at >= n - interval '12 seconds' then
    extra_ms := greatest(
      0,
      least(6500,floor(extract(epoch from (n-s.last_advanced_at))*1000)::bigint)
    );
  end if;

  return query select
    s.match_serial,
    s.active_elapsed_ms + extra_ms,
    (s.host_seen_at is not null and s.host_seen_at >= n - interval '12 seconds'),
    floor(extract(epoch from n)*1000)::bigint,
    s.last_result;
end;
$$;

grant execute on function public.get_repo_sports_v2_live_state() to anon, authenticated;

-- Only create the singleton if Test 36 was interrupted before creating it.
-- ON CONFLICT deliberately leaves an existing live match completely untouched.
insert into public.repo_sports_v2_live_state(id,match_serial,active_elapsed_ms)
values(1,1,0)
on conflict(id) do nothing;
