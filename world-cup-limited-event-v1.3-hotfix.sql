-- REPO SPORTS WORLD CUP 2026 — LIMITED EVENT V1.3 HOTFIX
-- Fixes exact-slot pack opening: "column reference pack_id is ambiguous".
-- Safe to run over V1.2. Existing pack/card/watch progress is untouched.

create or replace function public.open_world_cup_pack_slot_2026(
  p_pack_id uuid,
  p_username text default null
)
returns table(
  card_id text,
  pack_id uuid,
  source text,
  fixture_id text,
  fixture_label text,
  team_a text,
  team_b text,
  stage text,
  free_packs_claimed boolean,
  match_packs_earned integer,
  total_packs_awarded integer,
  unopened_packs integer,
  opened_packs integer,
  cards text[],
  packs jsonb
)
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid := auth.uid();
  v_pack public.repo_world_cup_packs_2026%rowtype;
  v_cards text[];
  v_card text;
  v_state record;
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

  select e.cards
    into v_cards
  from public.repo_world_cup_event_2026 as e
  where e.user_id = v_uid
  for update;

  select candidate
    into v_card
  from unnest(v_pool) as candidate
  where not (candidate = any(coalesce(v_cards,'{}'::text[])))
  order by random()
  limit 1;

  if v_card is null then
    raise exception 'All World Cup event cards already unlocked';
  end if;

  update public.repo_world_cup_packs_2026 as p
  set opened_at = now(),
      card_id = v_card
  where p.pack_id = v_pack.pack_id
    and p.user_id = v_uid;

  update public.repo_world_cup_event_2026 as e
  set cards = array_append(coalesce(e.cards,'{}'::text[]),v_card),
      updated_at = now()
  where e.user_id = v_uid;

  select s.*
    into v_state
  from public.get_my_world_cup_pack_event_state(p_username) as s;

  return query
  select
    v_card,
    v_pack.pack_id,
    v_pack.source,
    v_pack.fixture_id,
    v_pack.fixture_label,
    v_pack.team_a,
    v_pack.team_b,
    v_pack.stage,
    v_state.free_packs_claimed,
    v_state.match_packs_earned,
    v_state.total_packs_awarded,
    v_state.unopened_packs,
    v_state.opened_packs,
    v_state.cards,
    v_state.packs;
end;
$$;

revoke all on function public.open_world_cup_pack_slot_2026(uuid,text) from public;
grant execute on function public.open_world_cup_pack_slot_2026(uuid,text) to authenticated;
