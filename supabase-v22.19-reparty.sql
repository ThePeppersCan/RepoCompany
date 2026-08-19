-- V22.19 REPARTY
-- Additive Reparty backend: 6 contestants, max 4 humans, authoritative rounds/rewards.

alter table public.characters
  add column if not exists firemaking_xp integer not null default 0,
  add column if not exists herblore_xp integer not null default 0,
  add column if not exists construction_xp integer not null default 0;

create table if not exists public.reparty_session (
  id smallint primary key default 1 check (id = 1),
  round_no bigint not null default 1,
  phase text not null default 'pregame' check (phase in ('pregame','live','results')),
  game_key text not null default 'goblin_bomb_party',
  skill_key text not null default 'firemaking',
  special text not null default 'standard' check (special in ('standard','double_gold','double_xp','jackpot','mystery')),
  prize_pot integer not null default 25000,
  phase_started_at timestamptz not null default now(),
  phase_ends_at timestamptz not null default (now() + interval '10 seconds'),
  recent_games text[] not null default array[]::text[],
  updated_at timestamptz not null default now()
);

insert into public.reparty_session(id) values (1) on conflict (id) do nothing;

create table if not exists public.reparty_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  active boolean not null default true
);

create table if not exists public.reparty_rounds (
  round_no bigint primary key,
  game_key text not null,
  skill_key text not null,
  special text not null,
  prize_pot integer not null,
  humans jsonb not null default '[]'::jsonb,
  bots jsonb not null default '[]'::jsonb,
  started_at timestamptz not null,
  live_ends_at timestamptz not null,
  results_ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reparty_scores (
  round_no bigint not null references public.reparty_rounds(round_no) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  score numeric(6,2) not null check (score >= 0 and score <= 100),
  participation numeric(5,3) not null check (participation >= 0 and participation <= 1),
  submitted_at timestamptz not null default now(),
  primary key(round_no,user_id)
);

create table if not exists public.reparty_rewards (
  round_no bigint not null references public.reparty_rounds(round_no) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  placement integer not null check (placement between 1 and 6),
  gp_awarded bigint not null default 0,
  xp_awarded integer not null default 0,
  skill_key text not null,
  claimed_at timestamptz not null default now(),
  primary key(round_no,user_id)
);

create index if not exists reparty_presence_active_idx on public.reparty_presence(active,last_seen desc,joined_at asc);
create index if not exists reparty_rewards_user_recent_idx on public.reparty_rewards(user_id,claimed_at desc);

alter table public.reparty_session enable row level security;
alter table public.reparty_presence enable row level security;
alter table public.reparty_rounds enable row level security;
alter table public.reparty_scores enable row level security;
alter table public.reparty_rewards enable row level security;

revoke all on public.reparty_session from anon, authenticated;
revoke all on public.reparty_presence from anon, authenticated;
revoke all on public.reparty_rounds from anon, authenticated;
revoke all on public.reparty_scores from anon, authenticated;
revoke all on public.reparty_rewards from anon, authenticated;

create schema if not exists reparty_private;
revoke all on schema reparty_private from public, anon, authenticated;

create or replace function reparty_private.game_skill(p_game text)
returns text language sql immutable set search_path = '' as $$
  select case p_game
    when 'goblin_bomb_party' then 'firemaking'
    when 'potion_panic' then 'herblore'
    when 'fishing_frenzy' then 'fishing'
    when 'chopping_frenzy' then 'woodcutting'
    when 'builder_blitz' then 'construction'
    when 'minecart_mayhem' then 'mining'
    when 'rooftop_rush' then 'agility'
    when 'chicken_chase' then 'farming'
    when 'treasure_tiles' then 'agility'
    when 'goblin_says' then 'magic'
    when 'gold_rush' then 'mining'
    when 'dont_wake_troll' then 'slayer'
    else 'agility' end
$$;

create or replace function reparty_private.skill_label(p_skill text)
returns text language sql immutable set search_path = '' as $$
  select initcap(replace(p_skill,'_',' '))
$$;

create or replace function reparty_private.bot_names(p_round bigint, p_humans integer)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  pool text[] := array['ROCKY','Soup','Barry','Gregg','Besquelcher','Pipsqueak','JUD','Jenny','Nimbler 2000','Dopey Dom','Mad Rager','Debbie'];
  need integer := greatest(0, 6 - least(4,greatest(0,p_humans)));
  start_at integer := mod(p_round::integer, array_length(pool,1));
  out jsonb := '[]'::jsonb;
  i integer;
begin
  for i in 0..need-1 loop
    out := out || to_jsonb(pool[1 + mod(start_at+i,array_length(pool,1))]);
  end loop;
  return out;
end $$;

create or replace function reparty_private.pick_game(p_recent text[])
returns text language plpgsql volatile set search_path = '' as $$
declare
  games text[] := array['goblin_bomb_party','potion_panic','fishing_frenzy','chopping_frenzy','builder_blitz','minecart_mayhem','rooftop_rush','chicken_chase','treasure_tiles','goblin_says','gold_rush','dont_wake_troll'];
  candidates text[];
begin
  select coalesce(array_agg(g), games) into candidates
  from unnest(games) g
  where not (g = any(coalesce(p_recent,array[]::text[])));
  return candidates[1 + floor(random()*array_length(candidates,1))::integer];
end $$;

create or replace function reparty_private.pick_special()
returns text language plpgsql volatile set search_path = '' as $$
declare r numeric := random();
begin
  if r < .86 then return 'standard';
  elsif r < .91 then return 'double_gold';
  elsif r < .96 then return 'double_xp';
  elsif r < .98 then return 'jackpot';
  else return 'mystery'; end if;
end $$;

create or replace function reparty_private.prize_for_special(p_special text)
returns integer language sql immutable set search_path = '' as $$
  select case p_special when 'double_gold' then 50000 when 'jackpot' then 42500 else 25000 end
$$;

create or replace function reparty_private.active_humans()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('user_id',q.user_id,'username',q.username,'slot',q.rn) order by q.rn),'[]'::jsonb)
  from (
    select p.user_id,p.username,row_number() over(order by p.joined_at asc,p.last_seen desc,p.user_id)::integer rn
    from public.reparty_presence p
    where p.active and p.last_seen >= now()-interval '45 seconds'
    order by p.joined_at asc,p.last_seen desc,p.user_id
    limit 4
  ) q
$$;

create or replace function reparty_private.advance_state()
returns void language plpgsql security definer set search_path = '' as $$
declare
  s public.reparty_session%rowtype;
  humans jsonb;
  bots jsonb;
  next_game text;
  next_special text;
  recent text[];
begin
  select * into s from public.reparty_session where id=1 for update;
  if not found then
    insert into public.reparty_session(id) values(1) returning * into s;
  end if;

  -- If the room has been untouched for a long time, restart cleanly rather than replaying stale phases.
  if now() > s.phase_ends_at + interval '5 minutes' then
    recent := (select coalesce(array_agg(x order by ord),'{}'::text[]) from unnest((array_prepend(s.game_key,s.recent_games))[1:5]) with ordinality t(x,ord));
    next_game := reparty_private.pick_game(recent);
    next_special := reparty_private.pick_special();
    update public.reparty_session set round_no=s.round_no+1,phase='pregame',game_key=next_game,skill_key=reparty_private.game_skill(next_game),special=next_special,prize_pot=reparty_private.prize_for_special(next_special),phase_started_at=now(),phase_ends_at=now()+interval '10 seconds',recent_games=recent,updated_at=now() where id=1;
    return;
  end if;

  if now() < s.phase_ends_at then return; end if;

  if s.phase='pregame' then
    humans := reparty_private.active_humans();
    bots := reparty_private.bot_names(s.round_no,jsonb_array_length(humans));
    insert into public.reparty_rounds(round_no,game_key,skill_key,special,prize_pot,humans,bots,started_at,live_ends_at,results_ends_at)
    values(s.round_no,s.game_key,s.skill_key,s.special,s.prize_pot,humans,bots,now(),now()+interval '38 seconds',now()+interval '48 seconds')
    on conflict(round_no) do update set humans=excluded.humans,bots=excluded.bots,started_at=excluded.started_at,live_ends_at=excluded.live_ends_at,results_ends_at=excluded.results_ends_at;
    update public.reparty_session set phase='live',phase_started_at=now(),phase_ends_at=now()+interval '38 seconds',updated_at=now() where id=1;
  elsif s.phase='live' then
    update public.reparty_session set phase='results',phase_started_at=now(),phase_ends_at=now()+interval '10 seconds',updated_at=now() where id=1;
  else
    recent := (select coalesce(array_agg(x order by ord),'{}'::text[]) from unnest((array_prepend(s.game_key,s.recent_games))[1:5]) with ordinality t(x,ord));
    next_game := reparty_private.pick_game(recent);
    next_special := reparty_private.pick_special();
    update public.reparty_session set round_no=s.round_no+1,phase='pregame',game_key=next_game,skill_key=reparty_private.game_skill(next_game),special=next_special,prize_pot=reparty_private.prize_for_special(next_special),phase_started_at=now(),phase_ends_at=now()+interval '10 seconds',recent_games=recent,updated_at=now() where id=1;
  end if;
end $$;

create or replace function reparty_private.result_rows(p_round bigint)
returns table(username text,user_id uuid,is_bot boolean,score numeric,participation numeric,placement integer)
language sql stable security definer set search_path = '' as $$
  with r as (
    select * from public.reparty_rounds where round_no=p_round
  ), human_slots as (
    select h->>'username' username,(h->>'user_id')::uuid user_id,false is_bot,
           coalesce(s.score,(35 + mod(abs(hashtext(p_round::text||':'||(h->>'username'))::bigint),5200)::numeric/100))::numeric score,
           coalesce(s.participation,0)::numeric participation,
           (s.user_id is null) takeover
    from r cross join lateral jsonb_array_elements(r.humans) h
    left join public.reparty_scores s on s.round_no=p_round and s.user_id=(h->>'user_id')::uuid
  ), bot_slots as (
    select b.value#>>'{}' username,null::uuid user_id,true is_bot,
           (35 + mod(abs(hashtext(p_round::text||':'||(b.value#>>'{}'))::bigint),5200)::numeric/100)::numeric score,
           1::numeric participation,false takeover
    from r cross join lateral jsonb_array_elements(r.bots) b
  ), all_rows as (
    select username,user_id,case when takeover then true else is_bot end is_bot,score,participation from human_slots
    union all select username,user_id,is_bot,score,participation from bot_slots
  )
  select a.username,a.user_id,a.is_bot,a.score,a.participation,
         row_number() over(order by a.score desc,a.username asc)::integer placement
  from all_rows a
  order by placement
$$;

create or replace function public.reparty_join()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); uname text; out jsonb;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select coalesce(nullif(trim(c.username),''),'Adventurer') into uname from public.characters c where c.user_id=uid;
  if uname is null then raise exception 'Character not found'; end if;
  insert into public.reparty_presence(user_id,username,joined_at,last_seen,active) values(uid,uname,now(),now(),true)
  on conflict(user_id) do update set username=excluded.username,last_seen=now(),active=true,joined_at=case when public.reparty_presence.active then public.reparty_presence.joined_at else now() end;
  perform reparty_private.advance_state();
  select public.reparty_get_state() into out;
  return out;
end $$;

create or replace function public.reparty_leave()
returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid();
begin
  if uid is null then return false; end if;
  update public.reparty_presence set active=false,last_seen=now() where user_id=uid;
  return true;
end $$;

create or replace function public.reparty_heartbeat()
returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid();
begin
  if uid is null then return false; end if;
  update public.reparty_presence set last_seen=now(),active=true where user_id=uid;
  perform reparty_private.advance_state();
  return found;
end $$;

create or replace function public.reparty_get_state()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); s public.reparty_session%rowtype; r public.reparty_rounds%rowtype; humans jsonb; bots jsonb; in_round boolean:=false; queued boolean:=false; active_count integer:=0; rolling jsonb;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  perform reparty_private.advance_state();
  select * into s from public.reparty_session where id=1;
  select count(*) into active_count from public.reparty_presence p where p.active and p.last_seen>=now()-interval '45 seconds';
  select * into r from public.reparty_rounds where round_no=s.round_no;
  if found and s.phase in ('live','results') then
    humans:=r.humans; bots:=r.bots;
  else
    humans:=reparty_private.active_humans(); bots:=reparty_private.bot_names(s.round_no,jsonb_array_length(humans));
  end if;
  select exists(select 1 from jsonb_array_elements(humans) h where (h->>'user_id')::uuid=uid) into in_round;
  queued := exists(select 1 from public.reparty_presence p where p.user_id=uid and p.active) and not in_round;
  select coalesce(jsonb_agg(jsonb_build_object('username',z.username,'points',z.points) order by z.points desc,z.username asc),'[]'::jsonb) into rolling
  from (
    select rr.username,sum(case rr.placement when 1 then 10 when 2 then 7 when 3 then 5 when 4 then 3 when 5 then 2 else 1 end)::integer points
    from (
      select x.*,row_number() over(partition by x.user_id order by x.claimed_at desc)::integer rn
      from public.reparty_rewards x
    ) rr where rr.rn<=10 group by rr.user_id,rr.username order by points desc,rr.username asc limit 10
  ) z;
  return jsonb_build_object('server_now',now(),'round_no',s.round_no,'phase',s.phase,'phase_started_at',s.phase_started_at,'phase_ends_at',s.phase_ends_at,'game_key',s.game_key,'skill_key',s.skill_key,'special',s.special,'prize_pot',s.prize_pot,'humans',humans,'bots',bots,'active_human_count',least(active_count,4),'queued',queued,'playing',(s.phase='live' and in_round),'played_round',in_round,'rolling',rolling);
end $$;

create or replace function public.reparty_submit_score(p_round_no bigint,p_score numeric,p_participation numeric)
returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); r public.reparty_rounds%rowtype; uname text;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into r from public.reparty_rounds where round_no=p_round_no;
  if not found then raise exception 'Round not found'; end if;
  if now() > r.live_ends_at + interval '3 seconds' then raise exception 'Round is closed'; end if;
  if not exists(select 1 from jsonb_array_elements(r.humans) h where (h->>'user_id')::uuid=uid) then raise exception 'Not an active contestant'; end if;
  select coalesce(nullif(trim(c.username),''),'Adventurer') into uname from public.characters c where c.user_id=uid;
  insert into public.reparty_scores(round_no,user_id,username,score,participation)
  values(p_round_no,uid,uname,least(100,greatest(0,coalesce(p_score,0))),least(1,greatest(0,coalesce(p_participation,0))))
  on conflict(round_no,user_id) do update set score=excluded.score,participation=greatest(public.reparty_scores.participation,excluded.participation),submitted_at=now();
  return true;
end $$;

create or replace function public.reparty_get_round_results(p_round_no bigint)
returns table(username text,is_bot boolean,score numeric,placement integer,gp_preview bigint)
language plpgsql security definer set search_path = '' as $$
declare pot integer;
begin
  perform reparty_private.advance_state();
  select prize_pot into pot from public.reparty_rounds where round_no=p_round_no;
  if pot is null then return; end if;
  return query
  select x.username,x.is_bot,x.score,x.placement,
    case when x.is_bot or x.participation<.12 then 0::bigint else round(pot*(case x.placement when 1 then .30 when 2 then .22 when 3 then .17 when 4 then .13 when 5 then .10 else .08 end))::bigint end
  from reparty_private.result_rows(p_round_no) x order by x.placement;
end $$;

create or replace function public.reparty_claim_reward(p_round_no bigint)
returns table(placement integer,gp_awarded bigint,xp_awarded integer,skill_key text,skill_label text,new_gp bigint,new_skill_xp integer)
language plpgsql security definer set search_path = '' as $$
declare uid uuid:=auth.uid(); r public.reparty_rounds%rowtype; res record; gp bigint:=0; xp integer:=0; mult numeric:=1; current_xp integer:=0; current_gp bigint:=0;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select * into r from public.reparty_rounds where round_no=p_round_no;
  if not found then raise exception 'Round not found'; end if;
  if now() < r.live_ends_at then raise exception 'Round still live'; end if;
  if exists(select 1 from public.reparty_rewards rw where rw.round_no=p_round_no and rw.user_id=uid) then
    select rw.placement,rw.gp_awarded,rw.xp_awarded,rw.skill_key into res from public.reparty_rewards rw where rw.round_no=p_round_no and rw.user_id=uid;
    execute format('select gp,%I from public.characters where user_id=$1',res.skill_key||'_xp') into current_gp,current_xp using uid;
    return query select res.placement,res.gp_awarded,res.xp_awarded,res.skill_key,reparty_private.skill_label(res.skill_key),current_gp,current_xp;
    return;
  end if;
  select * into res from reparty_private.result_rows(p_round_no) x where x.user_id=uid;
  if not found then raise exception 'You did not play this round'; end if;
  if res.participation >= .12 and exists(select 1 from public.reparty_scores s where s.round_no=p_round_no and s.user_id=uid) then
    gp:=round(r.prize_pot*(case res.placement when 1 then .30 when 2 then .22 when 3 then .17 when 4 then .13 when 5 then .10 else .08 end))::bigint;
    mult:=case res.placement when 1 then 1.00 when 2 then .85 when 3 then .72 when 4 then .60 when 5 then .50 else .42 end;
    xp:=round(3200*mult*(case when r.special='double_xp' then 2 else 1 end))::integer;
  end if;
  insert into public.reparty_rewards(round_no,user_id,username,placement,gp_awarded,xp_awarded,skill_key)
  values(p_round_no,uid,res.username,res.placement,gp,xp,r.skill_key);
  execute format('update public.characters set gp=coalesce(gp,0)+$1,%I=coalesce(%I,0)+$2 where user_id=$3 returning gp,%I',r.skill_key||'_xp',r.skill_key||'_xp',r.skill_key||'_xp') into current_gp,current_xp using gp,xp,uid;
  return query select res.placement,gp,xp,r.skill_key,reparty_private.skill_label(r.skill_key),current_gp,current_xp;
end $$;

-- Keep daily/weekly XP accounting correct for the three newly persistent skills.
create or replace function public.track_character_daily_xp()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare gained bigint := 0;
begin
  gained :=
      greatest(coalesce(new.woodcutting_xp,0)-coalesce(old.woodcutting_xp,0),0)
    + greatest(coalesce(new.mining_xp,0)-coalesce(old.mining_xp,0),0)
    + greatest(coalesce(new.fishing_xp,0)-coalesce(old.fishing_xp,0),0)
    + greatest(coalesce(new.agility_xp,0)-coalesce(old.agility_xp,0),0)
    + greatest(coalesce(new.slayer_xp,0)-coalesce(old.slayer_xp,0),0)
    + greatest(coalesce(new.attack_xp,0)-coalesce(old.attack_xp,0),0)
    + greatest(coalesce(new.strength_xp,0)-coalesce(old.strength_xp,0),0)
    + greatest(coalesce(new.defence_xp,0)-coalesce(old.defence_xp,0),0)
    + greatest(coalesce(new.ranged_xp,0)-coalesce(old.ranged_xp,0),0)
    + greatest(coalesce(new.magic_xp,0)-coalesce(old.magic_xp,0),0)
    + greatest(coalesce(new.sailing_xp,0)-coalesce(old.sailing_xp,0),0)
    + greatest(coalesce(new.runecrafting_xp,0)-coalesce(old.runecrafting_xp,0),0)
    + greatest(coalesce(new.cooking_xp,0)-coalesce(old.cooking_xp,0),0)
    + greatest(coalesce(new.farming_xp,0)-coalesce(old.farming_xp,0),0)
    + greatest(coalesce(new.firemaking_xp,0)-coalesce(old.firemaking_xp,0),0)
    + greatest(coalesce(new.herblore_xp,0)-coalesce(old.herblore_xp,0),0)
    + greatest(coalesce(new.construction_xp,0)-coalesce(old.construction_xp,0),0);
  if gained>0 then
    insert into public.daily_xp_totals(user_id,xp_date,xp_earned,updated_at)
    values(new.user_id,(timezone('Europe/London',now()))::date,gained,now())
    on conflict(user_id,xp_date) do update set xp_earned=public.daily_xp_totals.xp_earned+excluded.xp_earned,updated_at=now();
  end if;
  return new;
end;
$function$;

revoke execute on function public.reparty_join() from public,anon;
revoke execute on function public.reparty_leave() from public,anon;
revoke execute on function public.reparty_heartbeat() from public,anon;
revoke execute on function public.reparty_get_state() from public,anon;
revoke execute on function public.reparty_submit_score(bigint,numeric,numeric) from public,anon;
revoke execute on function public.reparty_get_round_results(bigint) from public,anon;
revoke execute on function public.reparty_claim_reward(bigint) from public,anon;
grant execute on function public.reparty_join() to authenticated;
grant execute on function public.reparty_leave() to authenticated;
grant execute on function public.reparty_heartbeat() to authenticated;
grant execute on function public.reparty_get_state() to authenticated;
grant execute on function public.reparty_submit_score(bigint,numeric,numeric) to authenticated;
grant execute on function public.reparty_get_round_results(bigint) to authenticated;
grant execute on function public.reparty_claim_reward(bigint) to authenticated;
