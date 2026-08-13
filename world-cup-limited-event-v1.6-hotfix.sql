-- REPO SPORTS WORLD CUP 2026 — LIMITED EVENT V1.6 HOTFIX
-- Fixes pack opening permanently by removing the PL/pgSQL output-column name
-- collision that caused: "column reference pack_id is ambiguous".
--
-- Safe over V1.5. Does NOT reset free packs, watched fixtures, opened cards,
-- unopened packs or event progress.

begin;

-- A TABLE return with an output column called pack_id can collide with table
-- columns named pack_id inside PL/pgSQL. Return one jsonb object instead, so
-- there is no implicit PL/pgSQL variable called pack_id at all.
drop function if exists public.open_world_cup_pack_slot_2026(uuid,text);

create function public.open_world_cup_pack_slot_2026(
  p_pack_id uuid,
  p_username text default null
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid := auth.uid();
  v_pack public.repo_world_cup_packs_2026%rowtype;
  v_cards text[] := '{}'::text[];
  v_card text;
  v_pool constant text[] := array[
    'wc2026_debbie_sorevia',
    'wc2026_dopey_dom_drazhen',
    'wc2026_jenny_sorevia',
    'wc2026_jud_belros',
    'wc2026_mad_rager_nambara',
    'wc2026_nimbler_2000_belros',
    'wc2026_pipsqueak_vardesh',
    'wc2026_soup_talune',
    'wc2026_besquelcher_iskandar',
    'wc2026_rocky_norveth'
  ];
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;
  if p_pack_id is null then
    raise exception 'World Cup pack slot is required';
  end if;

  perform public.repo_wc26_ensure_event_row(p_username);

  -- Lock this exact pack. Every column reference is table-qualified.
  select p.*
    into v_pack
  from public.repo_world_cup_packs_2026 as p
  where p.user_id = v_uid
    and p.pack_id = p_pack_id
  for update;

  if not found then
    raise exception 'World Cup pack not found for this account';
  end if;
  if v_pack.opened_at is not null then
    raise exception 'This World Cup pack has already been opened';
  end if;

  -- Lock the collection row so two tabs can never pull the same card at once.
  select coalesce(e.cards,'{}'::text[])
    into v_cards
  from public.repo_world_cup_event_2026 as e
  where e.user_id = v_uid
  for update;

  select pool_card.card_id
    into v_card
  from unnest(v_pool) as pool_card(card_id)
  where not (pool_card.card_id = any(coalesce(v_cards,'{}'::text[])))
  order by random()
  limit 1;

  if v_card is null then
    raise exception 'All currently available World Cup event cards are already unlocked';
  end if;

  update public.repo_world_cup_packs_2026 as p
  set opened_at = now(),
      card_id = v_card
  where p.user_id = v_uid
    and p.pack_id = p_pack_id
    and p.opened_at is null;

  if not found then
    raise exception 'This World Cup pack was already opened in another tab';
  end if;

  update public.repo_world_cup_event_2026 as e
  set cards = array_append(coalesce(e.cards,'{}'::text[]),v_card),
      updated_at = now()
  where e.user_id = v_uid;

  return jsonb_build_object(
    'card_id', v_card,
    'event_pack_id', v_pack.pack_id,
    'source', v_pack.source,
    'fixture_id', v_pack.fixture_id,
    'fixture_label', v_pack.fixture_label,
    'team_a', v_pack.team_a,
    'team_b', v_pack.team_b,
    'stage', v_pack.stage
  );
end;
$$;

revoke all on function public.open_world_cup_pack_slot_2026(uuid,text) from public;
grant execute on function public.open_world_cup_pack_slot_2026(uuid,text) to authenticated;

commit;
