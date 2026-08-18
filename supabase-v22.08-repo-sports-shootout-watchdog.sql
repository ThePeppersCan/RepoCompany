-- V22.08 — Repo Sports live-rotation fail-safe
--
-- A normal rotation is roughly 5–6 minutes including the 30-second intro,
-- regulation, a possible shootout and the post-match panel. If an embedded
-- match engine fails before it posts its completion payload, this trigger
-- advances the shared serial after eight active minutes. The abandoned match
-- is deliberately not written to official standings because no trustworthy
-- final result reached the server.

create or replace function public.repo_sports_v2_live_timeout_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_elapsed_ms bigint := greatest(0, coalesce(new.active_elapsed_ms, 0));
begin
  if new.match_serial = old.match_serial
     and v_elapsed_ms >= 480000 then
    new.match_serial := old.match_serial + 1;
    new.active_elapsed_ms := 0;
    new.last_result := pg_catalog.jsonb_build_object(
      'watchdog', true,
      'reason', 'engine_completion_timeout',
      'abandoned_serial', old.match_serial,
      'elapsed_ms', v_elapsed_ms,
      'recovered_at', pg_catalog.clock_timestamp()
    );
    new.last_advanced_at := pg_catalog.clock_timestamp();
    new.updated_at := new.last_advanced_at;
  end if;

  return new;
end;
$function$;

drop trigger if exists repo_sports_v2_live_timeout_guard
on public.repo_sports_v2_live_state;

create trigger repo_sports_v2_live_timeout_guard
before update on public.repo_sports_v2_live_state
for each row
execute function public.repo_sports_v2_live_timeout_guard();

-- Recover an already-stalled production rotation immediately on deployment.
update public.repo_sports_v2_live_state
set updated_at = pg_catalog.clock_timestamp()
where id = 1
  and active_elapsed_ms >= 480000;

