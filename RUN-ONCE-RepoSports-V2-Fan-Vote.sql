-- REPO SPORTS V2 TEST 04 — shared fan vote
-- Stores one vote per authenticated user per V2 rotation.
-- This does NOT write any RepoSports leaderboard/career statistics.

create table if not exists public.repo_sports_v2_predictions (
  user_id uuid not null,
  match_key text not null,
  pick text not null check (pick in ('belros','zafran')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, match_key)
);

alter table public.repo_sports_v2_predictions enable row level security;

drop function if exists public.submit_repo_sports_v2_prediction(text,text);
create function public.submit_repo_sports_v2_prediction(p_match_key text,p_pick text)
returns table(home_votes bigint,away_votes bigint,total_votes bigint)
language plpgsql security definer set search_path=public
as $$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Sign in to vote'; end if;
  if coalesce(p_match_key,'') !~ '^v2-[A-Za-z0-9._:-]+$' then raise exception 'Invalid V2 match key'; end if;
  if p_pick not in ('belros','zafran') then raise exception 'Invalid prediction'; end if;

  insert into public.repo_sports_v2_predictions(user_id,match_key,pick)
  values(v_uid,p_match_key,p_pick)
  on conflict(user_id,match_key)
  do update set pick=excluded.pick,updated_at=now();

  return query
  select
    count(*) filter(where r.pick='belros')::bigint,
    count(*) filter(where r.pick='zafran')::bigint,
    count(*)::bigint
  from public.repo_sports_v2_predictions r
  where r.match_key=p_match_key;
end; $$;

drop function if exists public.get_repo_sports_v2_prediction_counts(text);
create function public.get_repo_sports_v2_prediction_counts(p_match_key text)
returns table(home_votes bigint,away_votes bigint,total_votes bigint)
language sql security definer set search_path=public
as $$
  select
    count(*) filter(where r.pick='belros')::bigint,
    count(*) filter(where r.pick='zafran')::bigint,
    count(*)::bigint
  from public.repo_sports_v2_predictions r
  where r.match_key=p_match_key;
$$;

revoke all on function public.submit_repo_sports_v2_prediction(text,text) from public;
revoke all on function public.get_repo_sports_v2_prediction_counts(text) from public;
grant execute on function public.submit_repo_sports_v2_prediction(text,text) to authenticated;
grant execute on function public.get_repo_sports_v2_prediction_counts(text) to authenticated;
notify pgrst,'reload schema';
