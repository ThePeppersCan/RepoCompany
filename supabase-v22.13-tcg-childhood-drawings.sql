-- Repo Company V22.13 — Childhood Drawings
-- Six new normal-pack cards at the existing Patch rarity.

insert into public.repo_tcg_pack_cards(card_id,rarity,duplicate_protected)
values
  ('childhood_drawing_besquelcher_patch','patch',false),
  ('childhood_drawing_debbie_patch','patch',false),
  ('childhood_drawing_nimbler_2000_patch','patch',false),
  ('childhood_drawing_pipsqueak_patch','patch',false),
  ('childhood_drawing_rocky_patch','patch',false),
  ('childhood_drawing_soup_patch','patch',false)
on conflict(card_id) do update set
  rarity=excluded.rarity,
  duplicate_protected=excluded.duplicate_protected;
