-- REPO SPORTS WORLD CUP 2026 — OFFICIAL KNOCKOUT RESULTS
-- Run once in Supabase SQL Editor.
-- Public/read-only results; only the CatAsthma authenticated account may record/replace a result.

create table if not exists public.repo_world_cup_results_2026 (
  fixture_id text primary key,
  home_team text not null,
  away_team text not null,
  winner_team text not null,
  loser_team text not null,
  winner_side text not null check (winner_side in ('home','away')),
  score_home integer not null default 0 check (score_home >= 0),
  score_away integer not null default 0 check (score_away >= 0),
  shootout_home integer,
  shootout_away integer,
  from_shootout boolean not null default false,
  completed_at timestamptz not null default now(),
  recorded_by uuid,
  recorded_username text not null default 'CatAsthma'
);

alter table public.repo_world_cup_results_2026 enable row level security;
revoke all on public.repo_world_cup_results_2026 from anon, authenticated;

create or replace function public.get_repo_world_cup_results_2026()
returns table(
  fixture_id text,
  home_team text,
  away_team text,
  winner_team text,
  loser_team text,
  winner_side text,
  score_home integer,
  score_away integer,
  shootout_home integer,
  shootout_away integer,
  from_shootout boolean,
  completed_at_ms bigint
)
language sql
security definer
set search_path=public
stable
as $$
  select r.fixture_id,r.home_team,r.away_team,r.winner_team,r.loser_team,r.winner_side,
         r.score_home,r.score_away,r.shootout_home,r.shootout_away,r.from_shootout,
         (extract(epoch from r.completed_at)*1000)::bigint
  from public.repo_world_cup_results_2026 r
  order by r.completed_at,r.fixture_id;
$$;

create or replace function public.record_repo_world_cup_result_2026(
  p_fixture_id text,
  p_home_team text,
  p_away_team text,
  p_winner_team text,
  p_loser_team text,
  p_winner_side text,
  p_score_home integer,
  p_score_away integer,
  p_shootout_home integer default null,
  p_shootout_away integer default null,
  p_from_shootout boolean default false
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_username text := lower(coalesce(auth.jwt()->'user_metadata'->>'username',''));
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if v_username <> 'catasthma' then raise exception 'Only CatAsthma can record an official World Cup result'; end if;
  if nullif(trim(p_fixture_id),'') is null then raise exception 'Fixture id required'; end if;
  if lower(coalesce(p_winner_side,'')) not in ('home','away') then raise exception 'winner_side must be home or away'; end if;
  if lower(trim(p_winner_team)) = lower(trim(p_loser_team)) then raise exception 'Winner and loser cannot be the same team'; end if;

  insert into public.repo_world_cup_results_2026(
    fixture_id,home_team,away_team,winner_team,loser_team,winner_side,
    score_home,score_away,shootout_home,shootout_away,from_shootout,
    completed_at,recorded_by,recorded_username
  ) values(
    trim(p_fixture_id),trim(p_home_team),trim(p_away_team),trim(p_winner_team),trim(p_loser_team),lower(p_winner_side),
    greatest(0,coalesce(p_score_home,0)),greatest(0,coalesce(p_score_away,0)),p_shootout_home,p_shootout_away,coalesce(p_from_shootout,false),
    now(),v_uid,'CatAsthma'
  )
  on conflict(fixture_id) do update set
    home_team=excluded.home_team,away_team=excluded.away_team,winner_team=excluded.winner_team,loser_team=excluded.loser_team,
    winner_side=excluded.winner_side,score_home=excluded.score_home,score_away=excluded.score_away,
    shootout_home=excluded.shootout_home,shootout_away=excluded.shootout_away,from_shootout=excluded.from_shootout,
    completed_at=now(),recorded_by=v_uid,recorded_username='CatAsthma';
  return true;
end;
$$;

revoke all on function public.get_repo_world_cup_results_2026() from public;
revoke all on function public.record_repo_world_cup_result_2026(text,text,text,text,text,text,integer,integer,integer,integer,boolean) from public;
grant execute on function public.get_repo_world_cup_results_2026() to anon, authenticated;
grant execute on function public.record_repo_world_cup_result_2026(text,text,text,text,text,text,integer,integer,integer,integer,boolean) to authenticated;
