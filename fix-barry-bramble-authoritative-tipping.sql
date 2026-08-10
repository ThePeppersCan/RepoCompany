-- Repo Sports / Barry Bramble — authoritative tipping V2
-- Run ONCE in Supabase SQL Editor, then refresh the website.
--
-- The old tipping RPC was tied to the legacy 235-second wall-clock slot. The
-- modern Quidditch broadcast uses public.quidditch_live_clock, which can extend
-- during sudden death and has its own post-match phase. V2 always resolves the
-- real current shared match on the server and therefore cannot reject a valid
-- tip merely because the old wall-clock slot has moved on.

create table if not exists public.quidditch_commentator_tips_v2 (
  match_id bigint not null,
  user_id uuid not null,
  amount integer not null default 200 check (amount > 0),
  tipped_at timestamptz not null default clock_timestamp(),
  primary key (match_id,user_id)
);

alter table public.quidditch_commentator_tips_v2 enable row level security;
revoke all on public.quidditch_commentator_tips_v2 from public;

create or replace function public.get_quidditch_commentator_total_tips_v2()
returns bigint
language plpgsql
security definer
set search_path=public
as $$
declare
  v_old bigint := 0;
  v_new bigint := 0;
begin
  -- Preserve the historical community total from the previous tipping system
  -- when that RPC still exists. Any failure there must not break V2.
  if to_regprocedure('public.get_quidditch_commentator_total_tips()') is not null then
    begin
      execute 'select coalesce(public.get_quidditch_commentator_total_tips(),0)::bigint' into v_old;
    exception when others then
      v_old := 0;
    end;
  end if;

  select coalesce(sum(t.amount),0)::bigint into v_new
  from public.quidditch_commentator_tips_v2 t;

  return greatest(0,coalesce(v_old,0)) + greatest(0,coalesce(v_new,0));
end $$;

create or replace function public.has_tipped_quidditch_commentator_v2(p_match_id bigint)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_current_match bigint;
  v_old boolean := false;
begin
  if v_uid is null then return false; end if;

  -- The UI can pass a stale id; status is always about the authoritative match.
  if to_regprocedure('public.advance_quidditch_live_clock()') is not null then
    perform public.advance_quidditch_live_clock();
  end if;
  select q.match_id into v_current_match
  from public.quidditch_live_clock q where q.clock_id=1;
  v_current_match := coalesce(v_current_match,p_match_id);
  if v_current_match is null then return false; end if;

  if exists(
    select 1 from public.quidditch_commentator_tips_v2 t
    where t.match_id=v_current_match and t.user_id=v_uid
  ) then return true; end if;

  -- Respect a tip already made through the legacy system for this same match.
  if to_regprocedure('public.has_tipped_quidditch_commentator(bigint)') is not null then
    begin
      execute 'select coalesce(public.has_tipped_quidditch_commentator($1),false)'
        into v_old using v_current_match;
    exception when others then
      v_old := false;
    end;
  end if;
  return coalesce(v_old,false);
end $$;

create or replace function public.tip_quidditch_commentator_v2(p_match_id bigint default null)
returns table(match_id bigint,remaining_gp bigint,lifetime_tip_gp bigint)
language plpgsql
security definer
set search_path=public
as $$
declare
  v_uid uuid := auth.uid();
  v_match bigint;
  v_gp bigint;
  v_total bigint;
  v_old_tipped boolean := false;
begin
  if v_uid is null then raise exception 'Sign in before tipping Barry Bramble'; end if;

  -- Advance + read the authoritative shared clock. p_match_id is deliberately
  -- only a client hint; it is NOT used to reject the user as stale.
  if to_regprocedure('public.advance_quidditch_live_clock()') is not null then
    perform public.advance_quidditch_live_clock();
  end if;
  select q.match_id into v_match
  from public.quidditch_live_clock q where q.clock_id=1;
  v_match := coalesce(v_match,p_match_id);
  if v_match is null then raise exception 'No current Quidditch match is available'; end if;

  perform pg_advisory_xact_lock(hashtext('barry-bramble-tip:'||v_uid::text||':'||v_match::text));

  -- Do not allow an extra charge if the same account already tipped this exact
  -- match through the previous RPC before this migration was installed.
  if to_regprocedure('public.has_tipped_quidditch_commentator(bigint)') is not null then
    begin
      execute 'select coalesce(public.has_tipped_quidditch_commentator($1),false)'
        into v_old_tipped using v_match;
    exception when others then
      v_old_tipped := false;
    end;
  end if;
  if v_old_tipped then raise exception 'You have already tipped Barry Bramble during this match'; end if;

  select coalesce(c.gp,0)::bigint into v_gp
  from public.characters c
  where c.user_id=v_uid
  for update;
  if not found then raise exception 'Character not found'; end if;
  if v_gp < 200 then raise exception 'You need 200 GP to tip Barry Bramble'; end if;

  insert into public.quidditch_commentator_tips_v2(match_id,user_id,amount,tipped_at)
  values(v_match,v_uid,200,clock_timestamp())
  on conflict(match_id,user_id) do nothing;
  if not found then raise exception 'You have already tipped Barry Bramble during this match'; end if;

  update public.characters c
  set gp=greatest(0,coalesce(c.gp,0)-200)
  where c.user_id=v_uid
  returning c.gp::bigint into v_gp;

  v_total := public.get_quidditch_commentator_total_tips_v2();

  -- Preserve the existing community reward promise: once the combined lifetime
  -- total reaches 250,000 GP, Barry's Boater is available to every account.
  if v_total >= 250000 then
    update public.characters c
    set bank_items=jsonb_set(
      coalesce(c.bank_items,'{}'::jsonb),
      '{barrys_boater}',
      to_jsonb(greatest(1,coalesce((coalesce(c.bank_items,'{}'::jsonb)->>'barrys_boater')::integer,0))),
      true
    );
  end if;

  return query select v_match,v_gp,v_total;
end $$;

grant execute on function public.get_quidditch_commentator_total_tips_v2() to anon,authenticated;
grant execute on function public.has_tipped_quidditch_commentator_v2(bigint) to authenticated;
grant execute on function public.tip_quidditch_commentator_v2(bigint) to authenticated;

notify pgrst,'reload schema';
