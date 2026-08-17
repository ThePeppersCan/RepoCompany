-- V20.88 RCG guaranteed 10 registry.
-- This migration has already been applied to the connected Supabase project.
-- One-time/event raw cards remain gradeable, but finalize as RCG 10.

create table if not exists public.repo_rcg_guaranteed_ten_cards (
  card_id text primary key,
  reason text not null,
  created_at timestamptz not null default now()
);

insert into public.repo_rcg_guaranteed_ten_cards(card_id,reason) values
 ('ltd_week_one_anniversary','Limited one-time anniversary card'),
 ('wc2026_debbie_sorevia','World Cup 2026 one-time event card'),
 ('wc2026_dopey_dom_drazhen','World Cup 2026 one-time event card'),
 ('wc2026_jenny_sorevia','World Cup 2026 one-time event card'),
 ('wc2026_jud_belros','World Cup 2026 one-time event card'),
 ('wc2026_mad_rager_nambara','World Cup 2026 one-time event card'),
 ('wc2026_nimbler_2000_belros','World Cup 2026 one-time event card'),
 ('wc2026_pipsqueak_vardesh','World Cup 2026 one-time event card'),
 ('wc2026_soup_talune','World Cup 2026 one-time event card'),
 ('wc2026_besquelcher_iskandar','World Cup 2026 one-time event card'),
 ('wc2026_rocky_norveth','World Cup 2026 one-time event card')
on conflict(card_id) do update set reason=excluded.reason;
