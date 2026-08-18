-- Repo Company V22.14.1 — World Cup uniqueness + duplicate storage hotfix
-- Prevents WC2026 event cards from ever becoming legitimate duplicate physical copies.
-- A World Cup card counts as already owned while raw, grading, slabbed or cracked raw.

create or replace function public.open_world_cup_pack_2026(p_username text default null::text)
returns table(card_id text, pack_id uuid, source text, fixture_id text, fixture_label text, team_a text, team_b text, stage text, free_packs_claimed boolean, match_packs_earned integer, total_packs_awarded integer, unopened_packs integer, opened_packs integer, cards text[], packs jsonb)
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid:=auth.uid(); v_pack public.repo_world_cup_packs_2026%rowtype; v_cards text[]; v_card text; v_state record;
  v_pool constant text[]:=array[
    'wc2026_debbie_sorevia','wc2026_dopey_dom_drazhen','wc2026_jenny_sorevia','wc2026_jud_belros','wc2026_mad_rager_nambara',
    'wc2026_nimbler_2000_belros','wc2026_pipsqueak_vardesh','wc2026_soup_talune','wc2026_besquelcher_iskandar','wc2026_rocky_norveth'
  ];
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  perform public.repo_wc26_ensure_event_row(p_username);
  select * into v_pack from public.repo_world_cup_packs_2026 p where p.user_id=v_uid and p.opened_at is null order by p.awarded_at,p.pack_id limit 1 for update skip locked;
  if not found then raise exception 'No unopened World Cup packs'; end if;
  select coalesce(e.cards,'{}'::text[]) into v_cards from public.repo_world_cup_event_2026 e where e.user_id=v_uid for update;

  select pool_card.card_id into v_card
  from unnest(v_pool) as pool_card(card_id)
  where not(pool_card.card_id=any(coalesce(v_cards,'{}'::text[])))
    and not exists(select 1 from public.repo_rcg_grading_orders o where o.user_id=v_uid and o.card_id=pool_card.card_id and o.status in ('grading','ready'))
    and not exists(select 1 from public.repo_rcg_slabs s where s.user_id=v_uid and s.card_id=pool_card.card_id and coalesce(s.is_cracked,false)=false)
    and not exists(select 1 from public.repo_rcg_cracked_raw_cards r where r.user_id=v_uid and r.card_id=pool_card.card_id)
  order by random() limit 1;

  if v_card is null then raise exception 'All World Cup event cards already unlocked'; end if;
  update public.repo_world_cup_packs_2026 set opened_at=now(),card_id=v_card where pack_id=v_pack.pack_id;
  update public.repo_world_cup_event_2026 set cards=array_append(coalesce(cards,'{}'::text[]),v_card),updated_at=now() where user_id=v_uid;
  select * into v_state from public.get_my_world_cup_pack_event_state(p_username);
  return query select v_card,v_pack.pack_id,v_pack.source,v_pack.fixture_id,v_pack.fixture_label,v_pack.team_a,v_pack.team_b,v_pack.stage,
    v_state.free_packs_claimed,v_state.match_packs_earned,v_state.total_packs_awarded,v_state.unopened_packs,v_state.opened_packs,v_state.cards,v_state.packs;
end
$function$;

create or replace function public.open_world_cup_pack_slot_2026(p_pack_id uuid,p_username text default null::text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_pack public.repo_world_cup_packs_2026%rowtype;
  v_cards text[];
  v_card text;
  v_pool constant text[]:=array[
    'wc2026_debbie_sorevia','wc2026_dopey_dom_drazhen','wc2026_jenny_sorevia','wc2026_jud_belros','wc2026_mad_rager_nambara',
    'wc2026_nimbler_2000_belros','wc2026_pipsqueak_vardesh','wc2026_soup_talune','wc2026_besquelcher_iskandar','wc2026_rocky_norveth'
  ];
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_pack_id is null then raise exception 'World Cup pack slot is required'; end if;
  perform public.repo_wc26_ensure_event_row(p_username);
  select p.* into v_pack from public.repo_world_cup_packs_2026 p
  where p.user_id=v_uid and p.pack_id=p_pack_id and p.event_slot between 1 and 10 for update;
  if not found then raise exception 'World Cup pack not found for this account'; end if;
  if v_pack.opened_at is not null then raise exception 'This World Cup pack has already been opened'; end if;
  select coalesce(e.cards,'{}'::text[]) into v_cards from public.repo_world_cup_event_2026 e where e.user_id=v_uid for update;

  select pool_card.card_id into v_card
  from unnest(v_pool) as pool_card(card_id)
  where not(pool_card.card_id=any(coalesce(v_cards,'{}'::text[])))
    and not exists(select 1 from public.repo_rcg_grading_orders o where o.user_id=v_uid and o.card_id=pool_card.card_id and o.status in ('grading','ready'))
    and not exists(select 1 from public.repo_rcg_slabs s where s.user_id=v_uid and s.card_id=pool_card.card_id and coalesce(s.is_cracked,false)=false)
    and not exists(select 1 from public.repo_rcg_cracked_raw_cards r where r.user_id=v_uid and r.card_id=pool_card.card_id)
  order by random() limit 1;

  if v_card is null then raise exception 'All World Cup event cards already unlocked'; end if;
  update public.repo_world_cup_packs_2026 p set opened_at=now(),card_id=v_card
  where p.user_id=v_uid and p.pack_id=p_pack_id and p.opened_at is null;
  if not found then raise exception 'This World Cup pack was already opened in another tab'; end if;
  update public.repo_world_cup_event_2026 e set cards=array_append(coalesce(e.cards,'{}'::text[]),v_card),updated_at=now() where e.user_id=v_uid;
  return jsonb_build_object('card_id',v_card,'is_duplicate',false,'event_pack_id',v_pack.pack_id,'source',v_pack.source,'fixture_id',v_pack.fixture_id,'fixture_label',v_pack.fixture_label,'team_a',v_pack.team_a,'team_b',v_pack.team_b,'stage',v_pack.stage,'event_slot',v_pack.event_slot);
end
$function$;

create or replace function public.submit_rcg_grading_v2(p_card_id text,p_raw_instance_id uuid default null::uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  uid uuid:=auth.uid(); c public.characters%rowtype; v_cards text[]; v_card text:=btrim(coalesce(p_card_id,''));
  v_fee bigint:=public.repo_rcg_config_value('RCG_GRADING_FEE',10000); v_seconds bigint:=public.repo_rcg_config_value('RCG_GRADING_SECONDS',300); v_limit bigint:=public.repo_rcg_config_value('RCG_MAX_ACTIVE_ORDERS',50);
  v_order public.repo_rcg_grading_orders%rowtype; v_guaranteed boolean:=false; v_raw public.repo_rcg_cracked_raw_cards%rowtype;
  v_lineage uuid:=gen_random_uuid(); v_cracks smallint:=0; v_normal_count integer:=0; v_cracked_count integer:=0; v_event_cards text[]; v_used_event boolean:=false;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if v_card='' then raise exception 'Choose a card to grade'; end if;
  if public.repo_rcg_card_set(v_card)='Standard' then raise exception 'Standard cards cannot be submitted to RCG grading.'; end if;
  v_guaranteed:=public.repo_rcg_is_guaranteed_ten_card(v_card);
  select * into c from public.characters where user_id=uid for update; if not found then raise exception 'Character not found'; end if;
  perform public.repo_rcg_finalize_due_for_user(uid);
  if (select count(*) from public.repo_rcg_grading_orders where user_id=uid and status='grading')>=v_limit then raise exception 'Your RCG grading desk is currently full.'; end if;

  -- World Cup cards are one physical collectible per account. Re-grading the
  -- same cracked lineage is allowed, but a second independent copy is not.
  if v_card like 'wc2026_%' then
    if exists(select 1 from public.repo_rcg_grading_orders o where o.user_id=uid and o.card_id=v_card and o.status in ('grading','ready')) then
      raise exception 'World Cup cards are unique; this card is already at RCG.';
    end if;
    if exists(select 1 from public.repo_rcg_slabs s where s.user_id=uid and s.card_id=v_card and coalesce(s.is_cracked,false)=false) then
      raise exception 'World Cup cards are unique; you already own this graded card.';
    end if;
    if p_raw_instance_id is null and exists(select 1 from public.repo_rcg_cracked_raw_cards r where r.user_id=uid and r.card_id=v_card) then
      raise exception 'World Cup cards are unique; a cracked copy of this card already exists.';
    end if;
    if p_raw_instance_id is not null and exists(select 1 from public.repo_rcg_cracked_raw_cards r where r.user_id=uid and r.card_id=v_card and r.id<>p_raw_instance_id) then
      raise exception 'World Cup cards are unique; another physical copy already exists.';
    end if;
  end if;

  insert into public.quidditch_tcg_collections(user_id,cards) values(uid,'{}'::text[]) on conflict(user_id) do nothing;
  select coalesce(cards,'{}'::text[]) into v_cards from public.quidditch_tcg_collections where user_id=uid for update;
  select count(*) into v_normal_count from unnest(v_cards) x where x=v_card;
  select count(*) into v_cracked_count from public.repo_rcg_cracked_raw_cards where user_id=uid and card_id=v_card;

  if p_raw_instance_id is not null then
    select * into v_raw from public.repo_rcg_cracked_raw_cards where id=p_raw_instance_id and user_id=uid and card_id=v_card for update;
    if not found then raise exception 'That cracked raw card is no longer available.'; end if;
    v_lineage:=v_raw.lineage_id; v_cracks:=v_raw.crack_count;
    if v_normal_count<1 then raise exception 'That cracked raw card is missing from your collection.'; end if;
    delete from public.repo_rcg_cracked_raw_cards where id=v_raw.id;
    v_cards:=public.repo_array_remove_one(v_cards,v_card);
    update public.quidditch_tcg_collections set cards=v_cards,updated_at=clock_timestamp() where user_id=uid;
  elsif v_normal_count>v_cracked_count then
    v_cards:=public.repo_array_remove_one(v_cards,v_card);
    update public.quidditch_tcg_collections set cards=v_cards,updated_at=clock_timestamp() where user_id=uid;
  elsif v_cracked_count>0 then
    select * into v_raw from public.repo_rcg_cracked_raw_cards where user_id=uid and card_id=v_card order by created_at limit 1 for update;
    v_lineage:=v_raw.lineage_id; v_cracks:=v_raw.crack_count;
    delete from public.repo_rcg_cracked_raw_cards where id=v_raw.id;
    v_cards:=public.repo_array_remove_one(v_cards,v_card);
    update public.quidditch_tcg_collections set cards=v_cards,updated_at=clock_timestamp() where user_id=uid;
  else
    select coalesce(cards,'{}'::text[]) into v_event_cards from public.repo_world_cup_event_2026 where user_id=uid for update;
    if v_card=any(coalesce(v_event_cards,'{}'::text[])) then
      update public.repo_world_cup_event_2026 set cards=public.repo_array_remove_one(coalesce(cards,'{}'::text[]),v_card),updated_at=clock_timestamp() where user_id=uid;
      v_used_event:=true;
    else raise exception 'You do not currently own that raw card.'; end if;
  end if;

  if c.gp<v_fee then raise exception 'You need % GP for RCG grading.',v_fee; end if;
  update public.characters set gp=gp-v_fee where user_id=uid and gp>=v_fee returning * into c;
  if not found then raise exception 'Not enough GP'; end if;

  insert into public.repo_rcg_grading_orders(user_id,card_id,card_set,card_variant,grading_fee,submitted_at,ready_at,status,lineage_id,crack_count,crack_locked)
  values(uid,v_card,public.repo_rcg_card_set(v_card),public.repo_rcg_card_variant(v_card),v_fee,clock_timestamp(),clock_timestamp()+make_interval(secs=>v_seconds::integer),'grading',v_lineage,v_cracks,(v_cracks>=3)) returning * into v_order;

  return jsonb_build_object('order_id',v_order.id,'card_id',v_order.card_id,'submitted_at',v_order.submitted_at,'ready_at',v_order.ready_at,'status',v_order.status,'grading_fee',v_fee,'new_gp',c.gp,'duration_seconds',v_seconds,'guaranteed_10',v_guaranteed,'crack_count',v_cracks,'crack_locked',(v_cracks>=3),'used_world_cup_copy',v_used_event,'odds',case when v_guaranteed then jsonb_build_object('8',0,'9',0,'10',100) else jsonb_build_object('8',65,'9',25,'10',10) end);
end
$function$;
