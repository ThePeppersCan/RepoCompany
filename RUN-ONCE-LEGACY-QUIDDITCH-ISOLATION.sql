-- ============================================================
-- REPO SPORTS — LEGACY QUIDDITCH ISOLATION
--
-- Run ONCE after the Repo Sports Live Launch SQL.
--
-- PURPOSE
-- The old Legacy Quidditch engine is being restored as a shared flavour mode.
-- Its old backend may still maintain its historical internal state.
--
-- Official Repo Sports records must NEVER move because of Legacy.
--
-- This script captures the historical career leaderboard baseline ONCE and
-- makes the official live leaderboard read:
--
--   frozen historical snapshot + Repo Sports Live league deltas
--
-- After the snapshot is locked, later changes in the old legacy career DB are
-- ignored completely by the official Repo Sports mode.
-- ============================================================

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

alter table public.repo_sports_official_career_base enable row level security;
alter table public.repo_sports_official_snapshot_meta enable row level security;

revoke all on public.repo_sports_official_career_base from anon, authenticated;
revoke all on public.repo_sports_official_snapshot_meta from anon, authenticated;


do $$
declare
  v_payload jsonb;
  v_item jsonb;
  v_key text;
begin
  -- Once captured, NEVER refresh this snapshot from Legacy again.
  if exists(select 1 from public.repo_sports_official_snapshot_meta where id=true) then
    return;
  end if;

  begin
    execute 'select to_jsonb(x) from public.get_quidditch_career_leaderboards_v3() x limit 1'
      into v_payload;
  exception when undefined_function then
    execute 'select to_jsonb(x) from public.get_quidditch_career_leaderboards_v2() x limit 1'
      into v_payload;
  end;

  v_payload := coalesce(v_payload,'{}'::jsonb);

  for v_item in
    select value from jsonb_array_elements(coalesce(v_payload->'goal_leaders','[]'::jsonb))
  loop
    v_key := lower(regexp_replace(
      coalesce(nullif(v_item->>'pet_id',''),nullif(v_item->>'pet_name',''),'unknown'),
      '[^a-zA-Z0-9]+','','g'
    ));

    insert into public.repo_sports_official_career_base(
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
       set pet_id=case when excluded.pet_id<>'' then excluded.pet_id else public.repo_sports_official_career_base.pet_id end,
           pet_name=excluded.pet_name,
           owner_name=case when excluded.owner_name<>'' then excluded.owner_name else public.repo_sports_official_career_base.owner_name end,
           matches=greatest(public.repo_sports_official_career_base.matches,excluded.matches),
           wins=greatest(public.repo_sports_official_career_base.wins,excluded.wins),
           losses=greatest(public.repo_sports_official_career_base.losses,excluded.losses),
           goals=greatest(public.repo_sports_official_career_base.goals,excluded.goals);
  end loop;

  for v_item in
    select value from jsonb_array_elements(coalesce(v_payload->'winrate_leaders','[]'::jsonb))
  loop
    v_key := lower(regexp_replace(
      coalesce(nullif(v_item->>'pet_id',''),nullif(v_item->>'pet_name',''),'unknown'),
      '[^a-zA-Z0-9]+','','g'
    ));

    insert into public.repo_sports_official_career_base(
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
       set pet_id=case when excluded.pet_id<>'' then excluded.pet_id else public.repo_sports_official_career_base.pet_id end,
           pet_name=excluded.pet_name,
           owner_name=case when excluded.owner_name<>'' then excluded.owner_name else public.repo_sports_official_career_base.owner_name end,
           matches=greatest(public.repo_sports_official_career_base.matches,excluded.matches),
           wins=greatest(public.repo_sports_official_career_base.wins,excluded.wins),
           losses=greatest(public.repo_sports_official_career_base.losses,excluded.losses),
           goals=greatest(public.repo_sports_official_career_base.goals,excluded.goals);
  end loop;

  insert into public.repo_sports_official_snapshot_meta(id)
  values(true)
  on conflict(id) do nothing;
end
$$;


create or replace function public.get_repo_sports_official_leaderboards()
returns table(
  player_leaders jsonb,
  team_standings jsonb
)
language sql
security definer
set search_path = public
as $$
  with combined_players as (
    select
      coalesce(nullif(l.player_id,''),b.pet_id,b.identity_key) as player_id,
      coalesce(nullif(l.player_name,''),b.pet_name,'Unknown') as player_name,
      coalesce(nullif(l.owner_name,''),b.owner_name,'') as owner_name,
      coalesce(b.matches,0)+coalesce(l.matches,0) as matches,
      coalesce(b.wins,0)+coalesce(l.wins,0) as wins,
      coalesce(b.losses,0)+coalesce(l.losses,0) as losses,
      coalesce(b.goals,0)+coalesce(l.goals,0) as goals
    from public.repo_sports_official_career_base b
    full join public.repo_sports_player_live_career l
      on lower(regexp_replace(l.player_id,'[^a-zA-Z0-9]+','','g'))=b.identity_key
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


-- Verification: this is the ONLY leaderboard RPC the live website should use.
select * from public.get_repo_sports_official_leaderboards();
