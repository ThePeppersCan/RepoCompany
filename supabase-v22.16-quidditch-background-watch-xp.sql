-- Repo Company V22.16 — Quidditch background watch XP
-- Active Repo Sports tab: 400 Agility XP/minute.
-- Repo Sports left open in a background tab: 200 Agility XP/minute.

alter table public.quidditch_watch_xp_400_state
  add column if not exists last_background boolean not null default false;

create or replace function public.claim_quidditch_watch_xp_v2(p_background boolean default false)
returns integer
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_now timestamptz:=clock_timestamp();
  v_last timestamptz;
  v_fraction numeric:=0;
  v_previous_background boolean:=false;
  v_elapsed numeric;
  v_rate numeric;
  v_total numeric;
  v_award integer;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;

  select s.last_claim_at,s.fractional_xp,coalesce(s.last_background,false)
    into v_last,v_fraction,v_previous_background
  from public.quidditch_watch_xp_400_state s
  where s.user_id=v_uid
  for update;

  if not found then
    insert into public.quidditch_watch_xp_400_state(user_id,last_claim_at,fractional_xp,last_background)
    values(v_uid,v_now,0,coalesce(p_background,false))
    on conflict(user_id) do update
      set last_claim_at=excluded.last_claim_at,
          last_background=excluded.last_background;
    return 0;
  end if;

  -- Still prevents sleeping/closed tabs from banking long offline periods.
  v_elapsed:=least(10.0,greatest(0.0,extract(epoch from (v_now-v_last))));
  -- Use the PREVIOUS visibility state for elapsed seconds, then switch mode.
  v_rate:=case when v_previous_background then 200.0 else 400.0 end;
  v_total:=coalesce(v_fraction,0)+(v_elapsed*(v_rate/60.0));
  v_award:=greatest(0,floor(v_total)::integer);

  update public.quidditch_watch_xp_400_state
     set last_claim_at=v_now,
         fractional_xp=v_total-v_award,
         last_background=coalesce(p_background,false)
   where user_id=v_uid;

  if v_award>0 then
    update public.characters
       set agility_xp=greatest(0,coalesce(agility_xp,0)+v_award)
     where user_id=v_uid;
  end if;

  return v_award;
end
$function$;

create or replace function public.claim_quidditch_watch_xp_400()
returns integer
language sql
security definer
set search_path to 'public','auth'
as $function$
  select public.claim_quidditch_watch_xp_v2(false)
$function$;

revoke all on function public.claim_quidditch_watch_xp_v2(boolean) from public;
grant execute on function public.claim_quidditch_watch_xp_v2(boolean) to authenticated;
revoke all on function public.claim_quidditch_watch_xp_400() from public;
grant execute on function public.claim_quidditch_watch_xp_400() to authenticated;
