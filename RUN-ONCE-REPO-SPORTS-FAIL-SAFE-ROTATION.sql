-- ============================================================
-- REPO SPORTS LIVE — FAIL-SAFE ROTATION
--
-- Run this entire script in Supabase SQL Editor.
--
-- Fixes the remaining FULL TIME / FINALISING LIVE RESULT stall.
--
-- KEY CHANGE
-- A browser no longer needs to own the host lease to finish a match once the
-- authoritative shared elapsed clock is clearly beyond the minimum possible
-- live-match completion point.
--
-- This is specifically to prevent an old/stale tab that still owns the host
-- lease from trapping the entire Repo Sports channel on one finished serial.
--
-- Safety:
-- * current match_serial must still match
-- * normal active host may complete at any valid full-time report
-- * non-host fallback only opens once active_elapsed_ms >= 300000 ms
-- * repo_sports_recorded_matches PK prevents duplicate stat counting
-- * all stat writes are atomic inside a protected subtransaction
-- * even if a stat write ever fails, match_serial STILL advances
--   so leaderboard/database problems can never freeze live TV again
-- ============================================================

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

  v_host_ok boolean := false;
  v_failsafe_ok boolean := false;

  v_home text;
  v_away text;
  v_home_goals integer := 0;
  v_away_goals integer := 0;
  v_winner text;

  v_player jsonb;
  v_player_id text;
  v_player_name text;
  v_owner_name text;
  v_side text;
  v_goals integer;

  v_inserted bigint := null;
begin
  perform pg_advisory_xact_lock(hashtext('repo_sports_v2_global_live')::bigint);

  select l.*
    into s
    from public.repo_sports_v2_live_state as l
   where l.id=1
   for update;

  if not found then
    raise exception 'Repo Sports live state is missing';
  end if;

  -- Somebody else already completed it. Return the new shared state.
  if s.match_serial <> p_match_serial then
    return query
    select
      s.match_serial,
      s.active_elapsed_ms,
      true,
      floor(extract(epoch from n)*1000)::bigint,
      s.last_result;
    return;
  end if;

  v_host_ok :=
    s.host_viewer_key = key
    and s.host_seen_at is not null
    and s.host_seen_at >= n - interval '12 seconds';

  -- Minimum engine duration is already ~330 seconds:
  -- 30s prematch + 270s regulation + 30s postmatch, before replays/goals/
  -- shootouts. 300s is therefore a conservative server-side "this cannot be
  -- an early match completion" threshold.
  v_failsafe_ok := coalesce(s.active_elapsed_ms,0) >= 300000;

  if not v_host_ok and not v_failsafe_ok then
    raise exception
      'Repo Sports completion waiting for host/failsafe window (elapsed=% ms)',
      coalesce(s.active_elapsed_ms,0);
  end if;

  select t.team_name
    into v_home
    from public.repo_sports_team_standings t
   where lower(t.team_name)=lower(coalesce(p_result->>'home_team',''))
   limit 1;

  select t.team_name
    into v_away
    from public.repo_sports_team_standings t
   where lower(t.team_name)=lower(coalesce(p_result->>'away_team',''))
   limit 1;

  v_home_goals := greatest(
    0,
    case
      when coalesce(p_result->'regulation'->>'belros','') ~ '^[0-9]+$'
        then (p_result->'regulation'->>'belros')::integer
      else 0
    end
  );

  v_away_goals := greatest(
    0,
    case
      when coalesce(p_result->'regulation'->>'zafran','') ~ '^[0-9]+$'
        then (p_result->'regulation'->>'zafran')::integer
      else 0
    end
  );

  v_winner := nullif(lower(coalesce(p_result->>'winner','')),'');

  -- ----------------------------------------------------------
  -- Protected stats transaction.
  --
  -- If ANY optional career/table write fails, PostgreSQL rolls back only
  -- this inner block. The shared live serial is still advanced below.
  -- ----------------------------------------------------------
  begin
    if v_home is null or v_away is null then
      raise exception 'Unknown Repo Sports club: % vs %',
        coalesce(p_result->>'home_team','?'),
        coalesce(p_result->>'away_team','?');
    end if;

    if v_winner not in ('belros','zafran') then
      raise exception 'Invalid winner side: %',coalesce(v_winner,'NULL');
    end if;

    insert into public.repo_sports_recorded_matches(
      match_serial,home_team,away_team,home_goals,away_goals,winner_side,result
    )
    values(
      p_match_serial,
      v_home,
      v_away,
      v_home_goals,
      v_away_goals,
      v_winner,
      coalesce(p_result,'{}'::jsonb)
    )
    on conflict on constraint repo_sports_recorded_matches_pkey do nothing
    returning repo_sports_recorded_matches.match_serial into v_inserted;

    if v_inserted is not null then
      update public.repo_sports_team_standings as t
         set matches=t.matches+1,
             wins=t.wins+case when v_winner='belros' then 1 else 0 end,
             losses=t.losses+case when v_winner='zafran' then 1 else 0 end,
             goals_for=t.goals_for+v_home_goals,
             goals_against=t.goals_against+v_away_goals,
             updated_at=n
       where t.team_name=v_home;

      update public.repo_sports_team_standings as t
         set matches=t.matches+1,
             wins=t.wins+case when v_winner='zafran' then 1 else 0 end,
             losses=t.losses+case when v_winner='belros' then 1 else 0 end,
             goals_for=t.goals_for+v_away_goals,
             goals_against=t.goals_against+v_home_goals,
             updated_at=n
       where t.team_name=v_away;

      for v_player in
        select value
          from jsonb_array_elements(coalesce(p_result->'players','[]'::jsonb))
      loop
        v_player_id := lower(left(coalesce(nullif(trim(v_player->>'player_id'),''),'unknown'),80));
        v_player_name := left(coalesce(nullif(trim(v_player->>'player_name'),''),v_player_id),100);
        v_owner_name := left(coalesce(trim(v_player->>'owner_name'),''),100);
        v_side := lower(coalesce(v_player->>'side',''));

        v_goals := greatest(
          0,
          case
            when coalesce(v_player->>'goals','') ~ '^[0-9]+$'
              then (v_player->>'goals')::integer
            else 0
          end
        );

        if v_player_id <> 'unknown' and v_side in ('belros','zafran') then
          insert into public.repo_sports_player_live_career as career(
            player_id,player_name,owner_name,matches,wins,losses,goals,updated_at
          )
          values(
            v_player_id,
            v_player_name,
            v_owner_name,
            1,
            case when v_winner=v_side then 1 else 0 end,
            case when v_winner<>v_side then 1 else 0 end,
            v_goals,
            n
          )
          on conflict(player_id) do update
             set player_name=excluded.player_name,
                 owner_name=case
                   when excluded.owner_name<>'' then excluded.owner_name
                   else career.owner_name
                 end,
                 matches=career.matches+1,
                 wins=career.wins+excluded.wins,
                 losses=career.losses+excluded.losses,
                 goals=career.goals+excluded.goals,
                 updated_at=n;
        end if;
      end loop;
    end if;

  exception when others then
    -- DO NOT allow optional stats persistence to freeze Repo Sports TV.
    raise warning
      'Repo Sports stats write failed for serial %, rotating anyway: %',
      p_match_serial,
      sqlerrm;
  end;

  -- ----------------------------------------------------------
  -- Live continuity is authoritative.
  -- This happens OUTSIDE the protected stats block.
  -- ----------------------------------------------------------
  update public.repo_sports_v2_live_state as l
     set match_serial=l.match_serial+1,
         active_elapsed_ms=0,
         last_result=coalesce(p_result,'{}'::jsonb),
         host_viewer_key=key,
         host_seen_at=n,
         last_advanced_at=n,
         last_any_seen_at=n,
         updated_at=n
   where l.id=1
   returning l.* into s;

  return query
  select
    s.match_serial,
    s.active_elapsed_ms,
    true,
    floor(extract(epoch from n)*1000)::bigint,
    s.last_result;
end;
$$;

grant execute on function public.complete_repo_sports_v2_rotation(text,bigint,jsonb)
to anon, authenticated;


-- ------------------------------------------------------------
-- DIAGNOSTIC
-- ------------------------------------------------------------
select
  l.match_serial,
  l.active_elapsed_ms,
  l.host_viewer_key,
  l.host_seen_at,
  l.last_advanced_at,
  l.last_result
from public.repo_sports_v2_live_state l
where l.id=1;
