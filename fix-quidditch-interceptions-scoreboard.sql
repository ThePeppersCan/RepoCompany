-- REPO SPORTS QUIDDITCH — INTERCEPTIONS SCOREBOARD HOTFIX
-- Run this once in Supabase SQL Editor.
--
-- Root cause: the client full-time table already displays row.interceptions,
-- but get_live_quidditch_state() did not include an interceptions field in
-- match_stats/MVP JSON, so JavaScript correctly fell back to 0 every time.
--
-- This preserves the authoritative live match clock, scores, predictions,
-- Snitch result fields and sudden-death handoff. It only restores the missing
-- deterministic interception statistic and includes it in MVP weighting.

drop function if exists public.get_live_quidditch_state(text);
create function public.get_live_quidditch_state(p_viewer_key text)
returns table(
  match_id bigint,phase text,phase_seconds integer,match_started_at timestamptz,match_ends_at timestamptz,
  left_name text,right_name text,left_score integer,right_score integer,left_scorers jsonb,right_scorers jsonb,
  roster jsonb,viewer_count integer,viewer_names jsonb,my_prediction text,can_predict boolean,reward_paid integer,
  left_predictions integer,draw_predictions integer,right_predictions integer,total_predictions integer,
  match_stats jsonb,mvp jsonb,left_possession_pct integer,right_possession_pct integer,
  latest_goal_id bigint,latest_goal_side text,latest_goal_pet text,
  ended_by_snitch boolean,snitch_winner_side text,snitch_winner_pet text
)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_clock public.quidditch_live_clock%rowtype;
  v_match bigint;
  v_phase text;
  v_seconds integer;
  v_match_elapsed integer := 0;
  v_roster jsonb := '[]'::jsonb;
  v_viewer_names jsonb := '[]'::jsonb;
  v_left_score integer := 0;
  v_right_score integer := 0;
  v_left_scorers jsonb := '{}'::jsonb;
  v_right_scorers jsonb := '{}'::jsonb;
  v_prediction text;
  v_reward integer := 0;
  v_prev bigint;
  v_prev_pick text;
  v_prev_left integer := 0;
  v_prev_right integer := 0;
  v_prev_winner text;
  v_lp integer := 0;
  v_dp integer := 0;
  v_rp integer := 0;
  v_stats jsonb := '[]'::jsonb;
  v_mvp jsonb := '{}'::jsonb;
  v_left_pos integer := 50;
  v_right_pos integer := 50;
  v_latest_id bigint;
  v_latest_side text;
  v_latest_pet text;
  v_snitch public.quidditch_snitch_match_results%rowtype;
begin
  v_clock := public.advance_quidditch_live_clock();
  v_match := v_clock.match_id;
  v_phase := v_clock.phase;
  v_seconds := greatest(0,ceil(extract(epoch from(v_clock.phase_ends_at-v_now)))::integer);
  v_prev := v_match-1;
  v_match_elapsed := case when v_phase='lineup' then 0
                          when v_phase='live' then greatest(0,least(180,floor(extract(epoch from(v_now-v_clock.phase_started_at)))::integer))
                          else 180 end;

  insert into public.quidditch_viewers(viewer_key,user_id,last_seen)
  values(left(coalesce(nullif(trim(p_viewer_key),''),gen_random_uuid()::text),120),auth.uid(),v_now)
  on conflict(viewer_key) do update set user_id=excluded.user_id,last_seen=excluded.last_seen;
  delete from public.quidditch_viewers qv where qv.last_seen<v_now-interval '35 seconds';
  delete from public.quidditch_goals g where g.match_id<v_match-20;

  if auth.uid() is not null then
    select qp.picked_side into v_prev_pick
    from public.quidditch_predictions qp
    where qp.match_id=v_prev and qp.user_id=auth.uid() and qp.paid=false;
    if v_prev_pick is not null then
      select count(*) filter(where g.side='left')::integer,
             count(*) filter(where g.side='right')::integer
        into v_prev_left,v_prev_right
      from public.quidditch_goals g where g.match_id=v_prev;
      select r.winner_side into v_prev_winner
      from public.quidditch_snitch_match_results r where r.match_id=v_prev;
      if v_prev_winner is null then
        v_prev_winner := case when v_prev_left>v_prev_right then 'left'
                              when v_prev_right>v_prev_left then 'right' else 'draw' end;
      end if;
      if v_prev_pick=v_prev_winner then
        update public.characters c set gp=coalesce(c.gp,0)+1000 where c.user_id=auth.uid();
        v_reward:=1000;
      end if;
      update public.quidditch_predictions qp set paid=true
      where qp.match_id=v_prev and qp.user_id=auth.uid();
    end if;
  end if;

  with ranked as(
    select c.username,c.username owner_username,c.active_pet,
      coalesce(nullif(c.pet_names->>c.active_pet,''),c.active_pet) pet_name,
      c.equipped_pet_cosmetic,
      row_number() over(order by md5(v_match::text||':'||c.username)) rn
    from public.characters c
    where c.active_pet is not null and c.active_pet like 'pet_%'
    limit 30
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'username',username,'owner_username',owner_username,'active_pet',active_pet,'pet_id',active_pet,
    'pet_name',pet_name,'equipped_pet_cosmetic',equipped_pet_cosmetic,
    'side',case when rn%2=1 then 'left' else 'right' end,
    'slot',ceil(rn/2.0)::integer
  ) order by rn),'[]'::jsonb)
  into v_roster from ranked;

  with grouped as(
    select g.side,g.pet_name,count(*)::integer goals
    from public.quidditch_goals g where g.match_id=v_match
    group by g.side,g.pet_name
  )
  select count(*) filter(where g.side='left')::integer,
         count(*) filter(where g.side='right')::integer,
         coalesce((select jsonb_object_agg(x.pet_name,x.goals) from grouped x where x.side='left'),'{}'::jsonb),
         coalesce((select jsonb_object_agg(x.pet_name,x.goals) from grouped x where x.side='right'),'{}'::jsonb)
  into v_left_score,v_right_score,v_left_scorers,v_right_scorers
  from public.quidditch_goals g where g.match_id=v_match;

  select g.id,g.side,g.pet_name into v_latest_id,v_latest_side,v_latest_pet
  from public.quidditch_goals g where g.match_id=v_match
  order by g.id desc limit 1;

  select count(*) filter(where qp.picked_side='left')::integer,
         count(*) filter(where qp.picked_side='draw')::integer,
         count(*) filter(where qp.picked_side='right')::integer
  into v_lp,v_dp,v_rp
  from public.quidditch_predictions qp where qp.match_id=v_match;

  select coalesce(jsonb_agg(c.username order by qv.last_seen desc),'[]'::jsonb)
  into v_viewer_names
  from public.quidditch_viewers qv
  join public.characters c on c.user_id=qv.user_id
  where qv.last_seen>=v_now-interval '20 seconds';

  v_left_pos:=greatest(42,least(58,50+(v_left_score-v_right_score)*2+(abs(hashtext(v_match::text||':pos'))%5)-2));
  v_right_pos:=100-v_left_pos;

  with players as(
    select x->>'pet_name' pet_name,x->>'side' side,x->>'username' username
    from jsonb_array_elements(v_roster) x
  ),base as(
    select p.*,
      coalesce(case when p.side='left' then (v_left_scorers->>p.pet_name)::integer else (v_right_scorers->>p.pet_name)::integer end,0) goals,
      greatest(coalesce(case when p.side='left' then (v_left_scorers->>p.pet_name)::integer else (v_right_scorers->>p.pet_name)::integer end,0),
        floor((1+abs(hashtext(v_match::text||':shots:'||p.username))%6)*greatest(.15,v_match_elapsed/180.0))::integer) shots,
      floor((abs(hashtext(v_match::text||':rebounds:'||p.username))%5)*greatest(.15,v_match_elapsed/180.0))::integer rebounds,
      floor((abs(hashtext(v_match::text||':interceptions:'||p.username))%3)*greatest(.15,v_match_elapsed/180.0))::integer interceptions,
      20+abs(hashtext(v_match::text||':weight:'||p.username))%81 weight
    from players p
  ),weighted as(
    select b.*,sum(weight) over(partition by side) team_weight from base b
  ),calculated as(
    select *,case when side='left' then round(v_left_pos*weight/greatest(1,team_weight))::integer
                  else round(v_right_pos*weight/greatest(1,team_weight))::integer end possession_pct
    from weighted
  ),scored as(
    select *,goals*14+shots*3+rebounds*2+interceptions*4+possession_pct*.35 mvp_score from calculated
  )
  select coalesce(jsonb_agg(jsonb_build_object('pet_name',pet_name,'side',side,'goals',goals,'shots',shots,'rebounds',rebounds,'interceptions',interceptions,'possession_pct',possession_pct) order by side,pet_name),'[]'::jsonb),
    coalesce((select jsonb_build_object('pet_name',s.pet_name,'side',s.side,
      'team_name',case when s.side='left' then public.quidditch_team_name(v_match,0) else public.quidditch_team_name(v_match,1) end,
      'goals',s.goals,'shots',s.shots,'rebounds',s.rebounds,'interceptions',s.interceptions,'possession_pct',s.possession_pct)
      from scored s order by s.mvp_score desc,s.pet_name limit 1),'{}'::jsonb)
  into v_stats,v_mvp from scored;

  if auth.uid() is not null then
    select qp.picked_side into v_prediction
    from public.quidditch_predictions qp
    where qp.match_id=v_match and qp.user_id=auth.uid();
  end if;

  select r.* into v_snitch
  from public.quidditch_snitch_match_results r where r.match_id=v_match;

  return query select
    v_match,v_phase,v_seconds,
    case when v_phase='lineup' then v_clock.phase_ends_at else v_clock.phase_started_at end,
    v_clock.phase_ends_at,
    public.quidditch_team_name(v_match,0),public.quidditch_team_name(v_match,1),
    coalesce(v_left_score,0),coalesce(v_right_score,0),v_left_scorers,v_right_scorers,v_roster,
    (select count(*)::integer from public.quidditch_viewers qv where qv.last_seen>=v_now-interval '20 seconds'),
    v_viewer_names,v_prediction,(v_phase='lineup' and auth.uid() is not null and v_prediction is null),v_reward,
    v_lp,v_dp,v_rp,v_lp+v_dp+v_rp,v_stats,v_mvp,v_left_pos,v_right_pos,
    v_latest_id,v_latest_side,v_latest_pet,
    (v_snitch.match_id is not null),v_snitch.winner_side,v_snitch.winner_pet;
end $$;

grant execute on function public.get_live_quidditch_state(text) to anon,authenticated;
notify pgrst,'reload schema';
