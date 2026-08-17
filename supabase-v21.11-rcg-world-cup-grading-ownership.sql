-- Repo Company V21.11
-- Fix RCG ownership validation for World Cup 2026 cards.
-- Applied to the connected Supabase project on 2026-08-17.
--
-- submit_rcg_grading now accepts a raw card when it exists in either:
--   public.quidditch_tcg_collections.cards
--   public.repo_world_cup_event_2026.cards
--
-- This matches the front-end collection loader, which already merges both sources.

create or replace function public.submit_rcg_grading(p_card_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  uid uuid:=auth.uid();
  c public.characters%rowtype;
  v_cards text[];
  v_card text:=btrim(coalesce(p_card_id,''));
  v_fee bigint:=public.repo_rcg_config_value('RCG_GRADING_FEE',10000);
  v_seconds bigint:=public.repo_rcg_config_value('RCG_GRADING_SECONDS',300);
  v_limit bigint:=public.repo_rcg_config_value('RCG_MAX_ACTIVE_ORDERS',1);
  v_order public.repo_rcg_grading_orders%rowtype;
  v_guaranteed boolean:=false;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if v_card='' then raise exception 'Choose a card to grade'; end if;

  v_guaranteed:=public.repo_rcg_is_guaranteed_ten_card(v_card);

  select * into c from public.characters where user_id=uid for update;
  if not found then raise exception 'Character not found'; end if;
  perform public.repo_rcg_finalize_due_for_user(uid);

  if (select count(*) from public.repo_rcg_grading_orders where user_id=uid and status='grading') >= v_limit then
    raise exception 'Your RCG grading slot is currently occupied.';
  end if;

  insert into public.quidditch_tcg_collections(user_id,cards)
  values(uid,'{}'::text[])
  on conflict(user_id) do nothing;

  select coalesce(cards,'{}'::text[])
    into v_cards
    from public.quidditch_tcg_collections
   where user_id=uid
   for update;

  if not (
    v_card=any(v_cards)
    or exists(
      select 1
      from public.repo_world_cup_event_2026 e
      where e.user_id=uid
        and v_card=any(coalesce(e.cards,'{}'::text[]))
    )
  ) then
    raise exception 'You do not currently own that raw card.';
  end if;

  if exists(select 1 from public.repo_rcg_grading_orders where user_id=uid and card_id=v_card and status='grading') then
    raise exception 'That physical card is already at RCG.';
  end if;
  if c.gp < v_fee then raise exception 'You need % GP for RCG grading.',v_fee; end if;

  update public.characters
     set gp=gp-v_fee
   where user_id=uid and gp>=v_fee
   returning * into c;
  if not found then raise exception 'Not enough GP'; end if;

  insert into public.repo_rcg_grading_orders(user_id,card_id,card_set,card_variant,grading_fee,submitted_at,ready_at,status)
  values(uid,v_card,public.repo_rcg_card_set(v_card),public.repo_rcg_card_variant(v_card),v_fee,clock_timestamp(),clock_timestamp()+make_interval(secs=>v_seconds::integer),'grading')
  returning * into v_order;

  return jsonb_build_object(
    'order_id',v_order.id,
    'card_id',v_order.card_id,
    'submitted_at',v_order.submitted_at,
    'ready_at',v_order.ready_at,
    'status',v_order.status,
    'grading_fee',v_fee,
    'new_gp',c.gp,
    'duration_seconds',v_seconds,
    'guaranteed_10',v_guaranteed,
    'odds',case when v_guaranteed
      then jsonb_build_object('8',0,'9',0,'10',100)
      else jsonb_build_object('8',65,'9',25,'10',10)
    end
  );
exception when unique_violation then
  raise exception 'That physical card is already at RCG.';
end
$function$;
