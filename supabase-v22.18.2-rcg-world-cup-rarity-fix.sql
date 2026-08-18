-- V22.18.2 — RCG World Cup rarity classification fix
-- Already applied to the live Supabase project on 2026-08-18.

create or replace function public.repo_rcg_card_set(p_card_id text)
returns text
language sql
immutable
as $function$
  select case
    when p_card_id like 'wc2026_%' then 'World Cup 2026'
    when p_card_id like '%_black_label' then 'RCG Black Label'
    when p_card_id like 'unfinished_%' then 'RCG Unfinished'
    when p_card_id like 'psycompany_promo_%' then 'PSYCOMPANY Promos'
    when p_card_id like 'off_the_broom_%' then 'Velmora: Off the Broom'
    when p_card_id like '%_patch' then 'Patch'
    when p_card_id like '%_signature' then 'Signature'
    when p_card_id like '%_millennium' then 'Millennium'
    when p_card_id like '%_rival' then 'Rival'
    when p_card_id like '%_platinum' then 'Platinum'
    when p_card_id like '%legendary%' then 'Legendary Full Art'
    when p_card_id like '%full_art%' then 'Full Art'
    when p_card_id like 'ltd_%' then 'Limited'
    else 'Standard'
  end
$function$;

create or replace function public.repo_rcg_card_variant(p_card_id text)
returns text
language sql
immutable
as $function$
  select public.repo_rcg_card_set(p_card_id)
$function$;
