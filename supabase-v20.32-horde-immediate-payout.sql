-- REPO COMPANY V20.32 — Endless Horde immediate per-wave payouts
-- Applied to live Supabase on 2026-08-16. Included for source history.

create or replace function public.claim_endless_horde_wave_reward(p_run_id uuid, p_wave integer)
returns table(
  awarded boolean, awarded_gp integer, base_gp integer, bonus_gp integer,
  total_run_gp bigint, new_gp bigint, claimed_wave integer,
  retry_after_seconds integer, reason text
)
language plpgsql security definer set search_path to 'public','auth'
as $function$
declare
  v_run public.endless_horde_reward_runs%rowtype;
  v_base integer; v_bonus integer; v_reward integer;
  v_elapsed numeric; v_budget bigint; v_required_elapsed numeric;
  v_retry integer := 0; v_new_gp bigint;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_wave < 1 or p_wave > 250 then raise exception 'Invalid wave'; end if;

  select * into v_run from public.endless_horde_reward_runs
   where id=p_run_id and user_id=auth.uid() for update;
  if not found then raise exception 'Horde reward run not found'; end if;
  if v_run.ended_at is not null then raise exception 'Horde reward run has ended'; end if;

  if now()-v_run.started_at > interval '2 hours 10 minutes' then
    update public.endless_horde_reward_runs set ended_at=now(),updated_at=now() where id=v_run.id;
    raise exception 'Horde reward run expired';
  end if;

  if p_wave <= v_run.last_claimed_wave then
    select gp into v_new_gp from public.characters where user_id=auth.uid();
    return query select false,0,0,0,v_run.total_gp,coalesce(v_new_gp,0),v_run.last_claimed_wave,0,'already_claimed'::text; return;
  end if;
  if p_wave <> v_run.last_claimed_wave+1 then
    select gp into v_new_gp from public.characters where user_id=auth.uid();
    return query select false,0,0,0,v_run.total_gp,coalesce(v_new_gp,0),v_run.last_claimed_wave,1,'claim_previous_wave_first'::text; return;
  end if;

  v_base := case when p_wave<=5 then 300 when p_wave<=10 then 500 when p_wave<=15 then 750 when p_wave<=20 then 1000 else 1250 end;
  v_bonus := case when p_wave%5=0 then 1500 else 0 end;
  v_reward := v_base+v_bonus;
  v_elapsed := greatest(0,extract(epoch from(now()-v_run.started_at)));

  -- Emergency-only ceiling: far above intended ~50k/hour normal play.
  v_budget := 7500 + floor(v_elapsed*(250000.0/3600.0));
  if v_run.total_gp+v_reward > v_budget then
    v_required_elapsed := greatest(0,((v_run.total_gp+v_reward-7500)*3600.0/250000.0));
    v_retry := greatest(1,ceil(v_required_elapsed-v_elapsed)::integer);
    select gp into v_new_gp from public.characters where user_id=auth.uid();
    return query select false,0,v_base,v_bonus,v_run.total_gp,coalesce(v_new_gp,0),v_run.last_claimed_wave,v_retry,'emergency_rate_limit'::text; return;
  end if;

  if v_run.last_claim_at is not null and now()-v_run.last_claim_at < interval '1 second' then
    select gp into v_new_gp from public.characters where user_id=auth.uid();
    return query select false,0,v_base,v_bonus,v_run.total_gp,coalesce(v_new_gp,0),v_run.last_claimed_wave,1,'too_fast'::text; return;
  end if;

  update public.characters set gp=gp+v_reward where user_id=auth.uid() returning gp into v_new_gp;
  if not found then raise exception 'Character not found'; end if;
  update public.endless_horde_reward_runs
     set last_claimed_wave=p_wave,total_gp=total_gp+v_reward,last_claim_at=now(),updated_at=now()
   where id=v_run.id returning total_gp into v_run.total_gp;
  return query select true,v_reward,v_base,v_bonus,v_run.total_gp,v_new_gp,p_wave,0,'awarded'::text;
end;
$function$;

revoke all on function public.claim_endless_horde_wave_reward(uuid,integer) from public, anon;
grant execute on function public.claim_endless_horde_wave_reward(uuid,integer) to authenticated, service_role;
