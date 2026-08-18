-- Repo Company V22.18.3 — Server-authoritative weekly Passport XP

create table if not exists public.repo_passport_weekly_rewards (
  user_id uuid not null,
  week_start date not null,
  reward_item text not null default 'quidditch_tcg_pack',
  claimed_at timestamptz not null default clock_timestamp(),
  primary key (user_id, week_start)
);

alter table public.repo_passport_weekly_rewards enable row level security;

create or replace function public.repo_passport_get_weekly_progress()
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_week_start date:=date_trunc('week',(timezone('Europe/London',clock_timestamp()))::timestamp)::date;
  v_xp bigint:=0; v_claimed boolean:=false; v_pack_count integer:=0;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  select coalesce(sum(d.xp_earned),0)::bigint into v_xp
  from public.daily_xp_totals d
  where d.user_id=v_uid and d.xp_date>=v_week_start and d.xp_date<v_week_start+7;
  select exists(select 1 from public.repo_passport_weekly_rewards r where r.user_id=v_uid and r.week_start=v_week_start) into v_claimed;
  select coalesce((c.bank_items->>'quidditch_tcg_pack')::integer,0) into v_pack_count from public.characters c where c.user_id=v_uid;
  return jsonb_build_object('week_start',v_week_start,'weekly_xp',v_xp,'target_xp',1000000,'reward_claimed',v_claimed,'quidditch_tcg_pack_count',coalesce(v_pack_count,0),'server_now',clock_timestamp(),'next_reset_at',((v_week_start+7)::timestamp at time zone 'Europe/London'));
end
$function$;

create or replace function public.repo_passport_claim_weekly_pack()
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_week_start date:=date_trunc('week',(timezone('Europe/London',clock_timestamp()))::timestamp)::date;
  v_xp bigint:=0; v_new_count integer:=0;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  perform pg_advisory_xact_lock(hashtextextended('repo-passport-weekly:'||v_uid::text||':'||v_week_start::text,0));
  if exists(select 1 from public.repo_passport_weekly_rewards r where r.user_id=v_uid and r.week_start=v_week_start) then raise exception 'Weekly passport reward already claimed.'; end if;
  select coalesce(sum(d.xp_earned),0)::bigint into v_xp from public.daily_xp_totals d where d.user_id=v_uid and d.xp_date>=v_week_start and d.xp_date<v_week_start+7;
  if v_xp<1000000 then raise exception 'You need % more weekly XP.',1000000-v_xp; end if;
  insert into public.repo_passport_weekly_rewards(user_id,week_start) values(v_uid,v_week_start);
  update public.characters c set bank_items=jsonb_set(coalesce(c.bank_items,'{}'::jsonb),'{quidditch_tcg_pack}',to_jsonb(coalesce((c.bank_items->>'quidditch_tcg_pack')::integer,0)+1),true) where c.user_id=v_uid returning coalesce((bank_items->>'quidditch_tcg_pack')::integer,0) into v_new_count;
  if not found then raise exception 'Character not found'; end if;
  return jsonb_build_object('ok',true,'week_start',v_week_start,'weekly_xp',v_xp,'reward_claimed',true,'quidditch_tcg_pack_count',v_new_count);
end
$function$;

revoke all on function public.repo_passport_get_weekly_progress() from public;
revoke all on function public.repo_passport_claim_weekly_pack() from public;
grant execute on function public.repo_passport_get_weekly_progress() to authenticated;
grant execute on function public.repo_passport_claim_weekly_pack() to authenticated;

-- Harmony lamps already update characters.*_xp, which is tracked by track_character_daily_xp().
-- Do not also manually insert into daily_xp_totals or weekly XP is double-counted.
create or replace function public.use_harmony_lamp(p_lamp text, p_skill text)
returns table(xp_awarded integer, new_skill_xp integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_xp int; v_qty int; v_new int;
begin
  if auth.uid() is null then raise exception 'You must be logged in'; end if;
  v_xp:=case p_lamp when 'harmony_lamp_30k' then 30000 when 'harmony_lamp_50k' then 50000 when 'harmony_lamp_75k' then 75000 when 'harmony_lamp_100k' then 100000 else 0 end;
  if v_xp=0 then raise exception 'Unknown Harmony lamp'; end if;
  if p_skill not in ('agility','slayer','attack','strength','defence','magic','ranged','sailing','runecrafting','cooking','mining','woodcutting','fishing','farming') then raise exception 'Choose a valid skill'; end if;
  select coalesce((bank_items->>p_lamp)::int,0) into v_qty from public.characters where user_id=auth.uid() for update;
  if coalesce(v_qty,0)<1 then raise exception 'That lamp is no longer in your Bank'; end if;
  execute format('update public.characters set %I=coalesce(%I,0)+$1, bank_items=jsonb_set(coalesce(bank_items,''{}''::jsonb),$2,to_jsonb($3),true) where user_id=$4 returning %I',p_skill||'_xp',p_skill||'_xp',p_skill||'_xp') into v_new using v_xp,array[p_lamp],v_qty-1,auth.uid();
  return query select v_xp,v_new;
end
$function$;
