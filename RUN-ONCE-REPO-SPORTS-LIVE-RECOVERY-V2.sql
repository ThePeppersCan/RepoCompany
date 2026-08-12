-- ============================================================
-- REPO SPORTS LIVE — RECOVERY V2
--
-- Run this entire script in Supabase SQL Editor.
--
-- Fixes:
-- 1) stuck full-time / match serial not advancing
-- 2) blank official player leaderboards
--
-- It is safe to run after the previous Live Launch / Legacy Isolation scripts.
-- No club/player totals are reset.
-- ============================================================


-- ------------------------------------------------------------
-- A. ENSURE LIVE TABLES EXIST
-- ------------------------------------------------------------

create table if not exists public.repo_sports_player_live_career (
  player_id text primary key,
  player_name text not null,
  owner_name text not null default '',
  matches bigint not null default 0 check (matches >= 0),
  wins bigint not null default 0 check (wins >= 0),
  losses bigint not null default 0 check (losses >= 0),
  goals bigint not null default 0 check (goals >= 0),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.repo_sports_team_standings (
  team_name text primary key,
  sort_order integer not null default 999,
  matches bigint not null default 0 check (matches >= 0),
  wins bigint not null default 0 check (wins >= 0),
  losses bigint not null default 0 check (losses >= 0),
  goals_for bigint not null default 0 check (goals_for >= 0),
  goals_against bigint not null default 0 check (goals_against >= 0),
  updated_at timestamptz not null default clock_timestamp()
);

create table if not exists public.repo_sports_recorded_matches (
  match_serial bigint primary key,
  home_team text not null,
  away_team text not null,
  home_goals integer not null default 0,
  away_goals integer not null default 0,
  winner_side text,
  result jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default clock_timestamp()
);

insert into public.repo_sports_team_standings(team_name,sort_order)
values
 ('Hrafnvik',1),('Blackglass',2),('Saint Ciro',3),('Marenza',4),
 ('Grand Khor',5),('Aurelia',6),('Drazh Hollow',7),('Rova End',8),
 ('Zafir Row',9),('Talun Cross',10),('Ossa Mere',11),('Varka Fell',12),
 ('Iskara',13),('Naskor',14),('Ashwick',15),('Skarholt',16),
 ('Orsanne',17),('Cinderbank',18)
on conflict(team_name) do update set sort_order=excluded.sort_order;


-- ------------------------------------------------------------
-- B. REPAIR OFFICIAL HISTORICAL SNAPSHOT IF IT IS EMPTY
-- ------------------------------------------------------------

create table if not exists public.repo_sports_official_career_base (
  identity_key text primary key,
  pet_id text not null default '',
  pet_name text not null,
  owner_name text not null default '',
  matches bigint not null default 0,
  wins bigint not null default 0,
  losses bigint not null default 0,
  goals bigint not null default 0,
  captured_at timestamptz not null default clock_timestamp()
);

create table if not exists public.repo_sports_official_snapshot_meta (
  id boolean primary key default true check(id=true),
  captured_at timestamptz not null default clock_timestamp()
);

do $$
declare
  v_payload jsonb := '{}'::jsonb;
  v_item jsonb;
  v_key text;
begin
  -- The previous isolation script could leave metadata behind even if no player
  -- rows were captured. If rows already exist, preserve that immutable snapshot.
  if exists(select 1 from public.repo_sports_official_career_base limit 1) then
    insert into public.repo_sports_official_snapshot_meta(id)
    values(true)
    on conflict(id) do nothing;
    return;
  end if;

  begin
    select to_jsonb(x)
      into v_payload
      from public.get_quidditch_career_leaderboards_v3() as x
     limit 1;
  exception
    when undefined_function then
      begin
        select to_jsonb(x)
          into v_payload
          from public.get_quidditch_career_leaderboards_v2() as x
         limit 1;
      exception when others then
        raise notice 'Could not read v2 historical Quidditch career RPC: %',sqlerrm;
      end;
    when others then
      raise notice 'Could not read v3 historical Quidditch career RPC: %',sqlerrm;
  end;

  v_payload := coalesce(v_payload,'{}'::jsonb);

  for v_item in
    select value
      from jsonb_array_elements(coalesce(v_payload->'goal_leaders','[]'::jsonb))
  loop
    v_key := lower(regexp_replace(
      coalesce(nullif(v_item->>'pet_id',''),nullif(v_item->>'pet_name',''),'unknown'),
      '[^a-zA-Z0-9]+','','g'
    ));

    if v_key <> 'unknown' then
      insert into public.repo_sports_official_career_base as base(
        identity_key,pet_id,pet_name,owner_name,matches,wins,losses,goals
      )
      values(
        v_key,
        coalesce(v_item->>'pet_id',''),
        coalesce(v_item->>'pet_name','Unknown'),
        coalesce(v_item->>'owner_name',''),
        greatest(0,coalesce((v_item->>'matches')::bigint,0)),
        greatest(0,coalesce((v_item->>'wins')::bigint,0)),
        greatest(0,coalesce((v_item->>'losses')::bigint,0)),
        greatest(0,coalesce((v_item->>'goals')::bigint,0))
      )
      on conflict(identity_key) do update
         set pet_id=case when excluded.pet_id<>'' then excluded.pet_id else base.pet_id end,
             pet_name=excluded.pet_name,
             owner_name=case when excluded.owner_name<>'' then excluded.owner_name else base.owner_name end,
             matches=greatest(base.matches,excluded.matches),
             wins=greatest(base.wins,excluded.wins),
             losses=greatest(base.losses,excluded.losses),
             goals=greatest(base.goals,excluded.goals);
    end if;
  end loop;

  for v_item in
    select value
      from jsonb_array_elements(coalesce(v_payload->'winrate_leaders','[]'::jsonb))
  loop
    v_key := lower(regexp_replace(
      coalesce(nullif(v_item->>'pet_id',''),nullif(v_item->>'pet_name',''),'unknown'),
      '[^a-zA-Z0-9]+','','g'
    ));

    if v_key <> 'unknown' then
      insert into public.repo_sports_official_career_base as base(
        identity_key,pet_id,pet_name,owner_name,matches,wins,losses,goals
      )
      values(
        v_key,
        coalesce(v_item->>'pet_id',''),
        coalesce(v_item->>'pet_name','Unknown'),
        coalesce(v_item->>'owner_name',''),
        greatest(0,coalesce((v_item->>'matches')::bigint,0)),
        greatest(0,coalesce((v_item->>'wins')::bigint,0)),
        greatest(0,coalesce((v_item->>'losses')::bigint,0)),
        greatest(0,coalesce((v_item->>'goals')::bigint,0))
      )
      on conflict(identity_key) do update
         set pet_id=case when excluded.pet_id<>'' then excluded.pet_id else base.pet_id end,
             pet_name=excluded.pet_name,
             owner_name=case when excluded.owner_name<>'' then excluded.owner_name else base.owner_name end,
             matches=greatest(base.matches,excluded.matches),
             wins=greatest(base.wins,excluded.wins),
             losses=greatest(base.losses,excluded.losses),
             goals=greatest(base.goals,excluded.goals);
    end if;
  end loop;

  if exists(select 1 from public.repo_sports_official_career_base limit 1) then
    insert into public.repo_sports_official_snapshot_meta(id)
    values(true)
    on conflict(id) do update set captured_at=excluded.captured_at;
  else
    raise notice 'Historical snapshot is still empty. Live player rows will still appear once matches complete.';
  end if;
end
$$;


-- ------------------------------------------------------------
-- C. OFFICIAL LEADERBOARD RPC
--    Frozen historical base + official live deltas only.
-- ------------------------------------------------------------

create or replace function public.get_repo_sports_official_leaderboards()
returns table(
  player_leaders jsonb,
  team_standings jsonb
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      b.identity_key,
      b.pet_id,
      b.pet_name,
      b.owner_name,
      b.matches,
      b.wins,
      b.losses,
      b.goals
    from public.repo_sports_official_career_base b
  ),
  live as (
    select
      lower(regexp_replace(p.player_id,'[^a-zA-Z0-9]+','','g')) as identity_key,
      p.player_id,
      p.player_name,
      p.owner_name,
      p.matches,
      p.wins,
      p.losses,
      p.goals
    from public.repo_sports_player_live_career p
  ),
  keys as (
    select identity_key from base
    union
    select identity_key from live
  ),
  combined_players as (
    select
      coalesce(nullif(l.player_id,''),nullif(b.pet_id,''),k.identity_key) as player_id,
      coalesce(nullif(l.player_name,''),nullif(b.pet_name,''),'Unknown') as player_name,
      coalesce(nullif(l.owner_name,''),nullif(b.owner_name,''),'') as owner_name,
      coalesce(b.matches,0)+coalesce(l.matches,0) as matches,
      coalesce(b.wins,0)+coalesce(l.wins,0) as wins,
      coalesce(b.losses,0)+coalesce(l.losses,0) as losses,
      coalesce(b.goals,0)+coalesce(l.goals,0) as goals
    from keys k
    left join base b on b.identity_key=k.identity_key
    left join live l on l.identity_key=k.identity_key
  )
  select
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'player_id',p.player_id,
          'pet_id',p.player_id,
          'player_name',p.player_name,
          'pet_name',p.player_name,
          'owner_name',p.owner_name,
          'matches',p.matches,
          'wins',p.wins,
          'losses',p.losses,
          'goals',p.goals,
          'win_rate',case when p.matches>0 then (p.wins::numeric/p.matches::numeric)*100 else 0 end
        )
        order by p.goals desc,p.wins desc,p.player_name
      )
      from combined_players p
    ),'[]'::jsonb),

    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'team_name',t.team_name,
          'sort_order',t.sort_order,
          'matches',t.matches,
          'wins',t.wins,
          'losses',t.losses,
          'goals_for',t.goals_for,
          'goals_against',t.goals_against,
          'goal_difference',t.goals_for-t.goals_against,
          'win_rate',case when t.matches>0 then (t.wins::numeric/t.matches::numeric)*100 else 0 end
        )
        order by
          t.wins desc,
          (t.goals_for-t.goals_against) desc,
          t.goals_for desc,
          t.losses asc,
          t.sort_order asc
      )
      from public.repo_sports_team_standings t
    ),'[]'::jsonb);
$$;

grant execute on function public.get_repo_sports_official_leaderboards()
to anon, authenticated;


-- ------------------------------------------------------------
-- D. FINAL-WHISTLE COMPLETION
-- ------------------------------------------------------------

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
  v_winner := nullif(lower(p_result->>'winner'),'');

  if v_winner not in ('belros','zafran') then
    raise exception 'Completed Repo Sports match has invalid winner side: %',coalesce(v_winner,'NULL');
  end if;

  -- IMPORTANT: target the PK constraint by NAME. Do not use
  -- ON CONFLICT(match_serial), because match_serial is also a RETURNS TABLE
  -- output variable in this PL/pgSQL function.
  insert into public.repo_sports_recorded_matches(
    match_serial,home_team,away_team,home_goals,away_goals,winner_side,result
  )
  values(
    p_match_serial,v_home,v_away,v_home_goals,v_away_goals,v_winner,coalesce(p_result,'{}'::jsonb)
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
               owner_name=case when excluded.owner_name<>'' then excluded.owner_name else career.owner_name end,
               matches=career.matches+1,
               wins=career.wins+excluded.wins,
               losses=career.losses+excluded.losses,
               goals=career.goals+excluded.goals,
               updated_at=n;
      end if;
    end loop;
  end if;

  -- The current authoritative serial advances even if its result row had
  -- already been inserted by an earlier partially-completed deployment.
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


-- ------------------------------------------------------------
-- E. DIAGNOSTICS
-- ------------------------------------------------------------

select
  'official_player_snapshot_rows' as diagnostic,
  count(*)::text as value
from public.repo_sports_official_career_base

union all

select
  'live_player_rows',
  count(*)::text
from public.repo_sports_player_live_career

union all

select
  'recorded_matches',
  count(*)::text
from public.repo_sports_recorded_matches

union all

select
  'current_live_serial',
  coalesce(max(l.match_serial),0)::text
from public.repo_sports_v2_live_state l;

select * from public.get_repo_sports_official_leaderboards();
