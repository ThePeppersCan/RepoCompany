-- ============================================================
-- REPO SPORTS — LIVE LEAGUE LAUNCH
-- Run ONCE in Supabase SQL Editor before publishing the live web files.
--
-- This does NOT reset the current shared live match.
-- It creates persistent launch-era player deltas + the new 18-club table.
-- The old Repo Sports career totals remain intact; the website adds these
-- launch-era player deltas onto those historical totals for display.
--
-- Match recording is server-side and idempotent:
-- only the active global host may finish the current match serial, and each
-- match_serial can be recorded only once.
-- ============================================================

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

alter table public.repo_sports_player_live_career enable row level security;
alter table public.repo_sports_team_standings enable row level security;
alter table public.repo_sports_recorded_matches enable row level security;

revoke all on public.repo_sports_player_live_career from anon, authenticated;
revoke all on public.repo_sports_team_standings from anon, authenticated;
revoke all on public.repo_sports_recorded_matches from anon, authenticated;


create or replace function public.get_repo_sports_live_leaderboards()
returns table(
  player_leaders jsonb,
  team_standings jsonb
)
language sql
security definer
set search_path = public
as $$
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
          'win_rate',case when p.matches > 0 then (p.wins::numeric / p.matches::numeric) * 100 else 0 end
        )
        order by p.goals desc,p.wins desc,p.player_name
      )
      from public.repo_sports_player_live_career p
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
          'win_rate',case when t.matches > 0 then (t.wins::numeric / t.matches::numeric) * 100 else 0 end
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
  v_inserted bigint;
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

  -- The current serial is the idempotency boundary. A duplicate completion
  -- after the serial has moved on cannot write any career/table stats.
  if s.match_serial = p_match_serial then

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

    insert into public.repo_sports_recorded_matches(
      match_serial,home_team,away_team,home_goals,away_goals,winner_side,result
    )
    values(
      p_match_serial,v_home,v_away,v_home_goals,v_away_goals,v_winner,coalesce(p_result,'{}'::jsonb)
    )
    on conflict(match_serial) do nothing
    returning match_serial into v_inserted;

    if v_inserted is not null then
      update public.repo_sports_team_standings t
         set matches=t.matches+1,
             wins=t.wins+case when v_winner='belros' then 1 else 0 end,
             losses=t.losses+case when v_winner='zafran' then 1 else 0 end,
             goals_for=t.goals_for+v_home_goals,
             goals_against=t.goals_against+v_away_goals,
             updated_at=n
       where t.team_name=v_home;

      update public.repo_sports_team_standings t
         set matches=t.matches+1,
             wins=t.wins+case when v_winner='zafran' then 1 else 0 end,
             losses=t.losses+case when v_winner='belros' then 1 else 0 end,
             goals_for=t.goals_for+v_away_goals,
             goals_against=t.goals_against+v_home_goals,
             updated_at=n
       where t.team_name=v_away;

      for v_player in
        select value from jsonb_array_elements(coalesce(p_result->'players','[]'::jsonb))
      loop
        v_player_id := lower(left(coalesce(nullif(trim(v_player->>'player_id'),''),'unknown'),80));
        v_player_name := left(coalesce(nullif(trim(v_player->>'player_name'),''),v_player_id),100);
        v_owner_name := left(coalesce(trim(v_player->>'owner_name'),''),100);
        v_side := lower(coalesce(v_player->>'side',''));
        v_goals := greatest(0,coalesce((v_player->>'goals')::integer,0));

        if v_player_id <> 'unknown' and v_side in ('belros','zafran') then
          insert into public.repo_sports_player_live_career(
            player_id,player_name,owner_name,matches,wins,losses,goals,updated_at
          )
          values(
            v_player_id,
            v_player_name,
            v_owner_name,
            1,
            case when v_winner=v_side then 1 else 0 end,
            case when v_winner is not null and v_winner<>v_side then 1 else 0 end,
            v_goals,
            n
          )
          on conflict(player_id) do update
             set player_name=excluded.player_name,
                 owner_name=case when excluded.owner_name<>'' then excluded.owner_name else public.repo_sports_player_live_career.owner_name end,
                 matches=public.repo_sports_player_live_career.matches+1,
                 wins=public.repo_sports_player_live_career.wins+excluded.wins,
                 losses=public.repo_sports_player_live_career.losses+excluded.losses,
                 goals=public.repo_sports_player_live_career.goals+excluded.goals,
                 updated_at=n;
        end if;
      end loop;
    end if;

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
  end if;

  return query
  select
    s.match_serial,
    s.active_elapsed_ms,
    true,
    floor(extract(epoch from n)*1000)::bigint,
    s.last_result;
end;
$$;

grant execute on function public.get_repo_sports_live_leaderboards() to anon, authenticated;
grant execute on function public.complete_repo_sports_v2_rotation(text,bigint,jsonb) to anon, authenticated;


-- Launch verification.
select *
from public.get_repo_sports_live_leaderboards();
