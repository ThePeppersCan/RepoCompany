-- ============================================================
-- REPO SPORTS LIVE — FINAL-WHISTLE ROTATION FIX
--
-- Run this ONCE in Supabase SQL Editor.
--
-- ROOT CAUSE
-- The launch version of complete_repo_sports_v2_rotation() used
-- schema-qualified target-table references inside ON CONFLICT DO UPDATE.
-- On PostgreSQL/Supabase that can fail at the final player-career upsert.
--
-- Because the whole RPC is one transaction, that failure also rolls back:
--   * team standings update
--   * player career update
--   * match_serial increment
--
-- The live clock then keeps moving beyond full time while the shared match
-- serial never advances, causing repeated reconstructed end screens / black
-- frames on the client.
--
-- This replacement uses an explicit target alias `career`, so the upsert is
-- valid and the current match can rotate normally.
--
-- SAFE:
-- * does not reset current match serial
-- * does not reset active elapsed time
-- * does not reset any player or club records
-- * repo_sports_recorded_matches still prevents duplicate counting
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

  if s.host_viewer_key <> key
     or s.host_seen_at is null
     or s.host_seen_at < n - interval '12 seconds' then
    raise exception 'Repo Sports rotation completion requires the active host lease';
  end if;

  -- If another accepted completion has already advanced the current serial,
  -- this is an idempotent duplicate. Return current state without counting.
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

  select t.team_name into v_home
    from public.repo_sports_team_standings t
   where lower(t.team_name)=lower(coalesce(p_result->>'home_team',''))
   limit 1;

  select t.team_name into v_away
    from public.repo_sports_team_standings t
   where lower(t.team_name)=lower(coalesce(p_result->>'away_team',''))
   limit 1;

  if v_home is null or v_away is null then
    raise exception 'Unknown Repo Sports club in completed match: % vs %',
      coalesce(p_result->>'home_team','?'),
      coalesce(p_result->>'away_team','?');
  end if;

  v_home_goals := greatest(0,coalesce((p_result->'regulation'->>'belros')::integer,0));
  v_away_goals := greatest(0,coalesce((p_result->'regulation'->>'zafran')::integer,0));
  v_winner := nullif(p_result->>'winner','');

  if v_winner not in ('belros','zafran') then
    raise exception 'Completed Repo Sports match has invalid winner side: %',coalesce(v_winner,'NULL');
  end if;

  insert into public.repo_sports_recorded_matches(
    match_serial,home_team,away_team,home_goals,away_goals,winner_side,result
  )
  values(
    p_match_serial,v_home,v_away,v_home_goals,v_away_goals,v_winner,coalesce(p_result,'{}'::jsonb)
  )
  on conflict(match_serial) do nothing
  returning match_serial into v_inserted;

  -- Only the first successful completion for this serial writes stats.
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
      v_goals := greatest(0,coalesce((v_player->>'goals')::integer,0));

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

  -- Even if the result row was already recorded, this currently-authoritative
  -- serial still needs to advance exactly once.
  update public.repo_sports_v2_live_state as l
     set match_serial=l.match_serial+1,
         active_elapsed_ms=0,
         last_result=coalesce(p_result,'{}'::jsonb),
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


-- Diagnostic: current live serial/state after installing the fixed function.
select
  l.match_serial,
  l.active_elapsed_ms,
  l.host_viewer_key,
  l.host_seen_at,
  l.last_advanced_at,
  l.last_result
from public.repo_sports_v2_live_state l
where l.id=1;
