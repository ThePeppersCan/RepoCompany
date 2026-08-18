-- V22.15.1 — preserve physical TCG duplicate copies in the private collection RPC.
-- Applied live to Supabase on 2026-08-18.

create or replace function public.get_my_quidditch_tcg_collection()
returns table(username text, cards text[], card_count integer, total_cards integer)
language sql
security definer
set search_path to 'public'
as $function$
  with base as (
    select c.username::text as username, coalesce(q.cards,'{}'::text[]) as raw_cards, coalesce(e.cards,'{}'::text[]) as event_cards
    from public.characters c
    left join public.quidditch_tcg_collections q on q.user_id=c.user_id
    left join public.repo_world_cup_event_2026 e on e.user_id=c.user_id
    where c.user_id=auth.uid()
    limit 1
  ), merged as (
    select b.username,(b.raw_cards || coalesce(array(select ev from unnest(b.event_cards) ev where nullif(btrim(ev),'') is not null and not(ev=any(b.raw_cards))),'{}'::text[]))::text[] as cards
    from base b
  ), catalogue as (
    select p.card_id from public.repo_tcg_pack_cards p
    union select unnest(array['wc2026_debbie_sorevia','wc2026_dopey_dom_drazhen','wc2026_jenny_sorevia','wc2026_jud_belros','wc2026_mad_rager_nambara','wc2026_nimbler_2000_belros','wc2026_pipsqueak_vardesh','wc2026_soup_talune','wc2026_besquelcher_iskandar','wc2026_rocky_norveth','ltd_week_one_anniversary']::text[])
  )
  select m.username,m.cards,cardinality(array(select distinct x from unnest(m.cards) x where nullif(btrim(x),'') is not null))::integer,(select count(*)::integer from catalogue) from merged m
$function$;
