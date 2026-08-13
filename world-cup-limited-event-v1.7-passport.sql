-- REPO SPORTS WORLD CUP 2026 — LIMITED EVENT V1.7
-- Safe migration over V1.6.
-- 1) Keeps the exact-pack opening ambiguity fix.
-- 2) Adds the World Cup Passport attendance/ticket system.
-- 3) Does NOT reset packs, cards, fixture rewards, or previous event progress.

begin;

-- ---------------------------------------------------------------------------
-- Exact World Cup pack opening (retain the V1.6 JSONB-return fix)
-- ---------------------------------------------------------------------------
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
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_pack_id is null then raise exception 'World Cup pack slot is required'; end if;

  perform public.repo_wc26_ensure_event_row(p_username);

  select p.* into v_pack
  from public.repo_world_cup_packs_2026 as p
  where p.user_id=v_uid and p.pack_id=p_pack_id
  for update;

  if not found then raise exception 'World Cup pack not found for this account'; end if;
  if v_pack.opened_at is not null then raise exception 'This World Cup pack has already been opened'; end if;

  select coalesce(e.cards,'{}'::text[]) into v_cards
  from public.repo_world_cup_event_2026 as e
  where e.user_id=v_uid
  for update;

  select pool_card.card_id into v_card
  from unnest(v_pool) as pool_card(card_id)
  where not (pool_card.card_id=any(coalesce(v_cards,'{}'::text[])))
  order by random()
  limit 1;

  if v_card is null then raise exception 'All currently available World Cup event cards are already unlocked'; end if;

  update public.repo_world_cup_packs_2026 as p
  set opened_at=now(), card_id=v_card
  where p.user_id=v_uid and p.pack_id=p_pack_id and p.opened_at is null;

  if not found then raise exception 'This World Cup pack was already opened in another tab'; end if;

  update public.repo_world_cup_event_2026 as e
  set cards=array_append(coalesce(e.cards,'{}'::text[]),v_card), updated_at=now()
  where e.user_id=v_uid;

  return jsonb_build_object(
    'card_id',v_card,
    'event_pack_id',v_pack.pack_id,
    'source',v_pack.source,
    'fixture_id',v_pack.fixture_id,
    'fixture_label',v_pack.fixture_label,
    'team_a',v_pack.team_a,
    'team_b',v_pack.team_b,
    'stage',v_pack.stage
  );
end;
$$;

revoke all on function public.open_world_cup_pack_slot_2026(uuid,text) from public;
grant execute on function public.open_world_cup_pack_slot_2026(uuid,text) to authenticated;

-- ---------------------------------------------------------------------------
-- World Cup Passport — 10 minute live attendance unlocks its Round-of-16 ticket
-- ---------------------------------------------------------------------------
create table if not exists public.repo_world_cup_passport_2026 (
  user_id uuid not null references auth.users(id) on delete cascade,
  ticket_key text not null,
  fixture_id text,
  fixture_label text,
  team_a text,
  team_b text,
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  last_heartbeat_at timestamptz,
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id,ticket_key)
);

alter table public.repo_world_cup_passport_2026 enable row level security;
drop policy if exists repo_wc_passport_read_own on public.repo_world_cup_passport_2026;
create policy repo_wc_passport_read_own
on public.repo_world_cup_passport_2026
for select
to authenticated
using (auth.uid()=user_id);

grant select on public.repo_world_cup_passport_2026 to authenticated;

create or replace function public.get_my_world_cup_passport_2026()
returns jsonb
language sql
stable
security definer
set search_path=public,auth
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'ticket_key',p.ticket_key,
        'fixture_id',p.fixture_id,
        'fixture_label',p.fixture_label,
        'team_a',p.team_a,
        'team_b',p.team_b,
        'watched_seconds',p.watched_seconds,
        'unlocked_at',p.unlocked_at
      ) order by p.created_at,p.ticket_key
    ),
    '[]'::jsonb
  )
  from public.repo_world_cup_passport_2026 as p
  where p.user_id=auth.uid();
$$;

revoke all on function public.get_my_world_cup_passport_2026() from public;
grant execute on function public.get_my_world_cup_passport_2026() to authenticated;

create or replace function public.record_world_cup_passport_attendance_2026(
  p_ticket_key text,
  p_fixture_id text default '',
  p_fixture_label text default '',
  p_team_a text default '',
  p_team_b text default '',
  p_phase text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_row public.repo_world_cup_passport_2026%rowtype;
  v_delta integer := 0;
  v_seconds integer := 0;
  v_just_unlocked boolean := false;
  v_allowed constant text[] := array[
    'belros-zafran',
    'iskandar-calvora',
    'sorevia-lumerre',
    'talune-kordesh',
    'norveth-qasmir',
    'nambara-elvane',
    'drazhen-rovarn',
    'vardesh-marovar'
  ];
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_ticket_key is null or not (p_ticket_key=any(v_allowed)) then
    raise exception 'Unknown World Cup passport ticket';
  end if;

  select p.* into v_row
  from public.repo_world_cup_passport_2026 as p
  where p.user_id=v_uid and p.ticket_key=p_ticket_key
  for update;

  if not found then
    insert into public.repo_world_cup_passport_2026(
      user_id,ticket_key,fixture_id,fixture_label,team_a,team_b,
      watched_seconds,last_heartbeat_at,created_at,updated_at
    ) values (
      v_uid,p_ticket_key,nullif(p_fixture_id,''),nullif(p_fixture_label,''),
      nullif(p_team_a,''),nullif(p_team_b,''),0,v_now,v_now,v_now
    )
    returning * into v_row;
  else
    -- Count actual connected time between live heartbeats, but never credit a
    -- long disconnect/closed tab. Multiple tabs cannot accelerate this because
    -- each heartbeat advances the same locked last_heartbeat_at timestamp.
    if v_row.last_heartbeat_at is not null then
      v_delta := floor(extract(epoch from (v_now-v_row.last_heartbeat_at)))::integer;
      if v_delta < 0 or v_delta > 30 then v_delta := 0; end if;
    end if;

    -- Heartbeats are only sent by the live broadcast during active match phases.
    if lower(coalesce(p_phase,'')) not in ('first','second','shootout','fulltime') then
      v_delta := 0;
    end if;

    v_seconds := least(600,coalesce(v_row.watched_seconds,0)+greatest(0,v_delta));
    v_just_unlocked := v_row.unlocked_at is null and v_seconds >= 600;

    update public.repo_world_cup_passport_2026 as p
    set fixture_id=coalesce(nullif(p_fixture_id,''),p.fixture_id),
        fixture_label=coalesce(nullif(p_fixture_label,''),p.fixture_label),
        team_a=coalesce(nullif(p_team_a,''),p.team_a),
        team_b=coalesce(nullif(p_team_b,''),p.team_b),
        watched_seconds=v_seconds,
        last_heartbeat_at=v_now,
        unlocked_at=case when v_seconds>=600 then coalesce(p.unlocked_at,v_now) else p.unlocked_at end,
        updated_at=v_now
    where p.user_id=v_uid and p.ticket_key=p_ticket_key
    returning * into v_row;
  end if;

  return jsonb_build_object(
    'ticket_key',v_row.ticket_key,
    'watched_seconds',v_row.watched_seconds,
    'unlocked_at',v_row.unlocked_at,
    'just_unlocked',v_just_unlocked
  );
end;
$$;

revoke all on function public.record_world_cup_passport_attendance_2026(text,text,text,text,text,text) from public;
grant execute on function public.record_world_cup_passport_attendance_2026(text,text,text,text,text,text) to authenticated;

commit;
