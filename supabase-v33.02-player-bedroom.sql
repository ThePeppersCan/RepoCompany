-- Velmora V33.02 — account-backed My Bedroom save data.
-- Human keeper bedroom only. No Dragonbound dragon state or currency is stored here.

create table if not exists public.player_bedrooms (
  user_id uuid primary key references auth.users(id) on delete cascade,
  room_id text not null default 'nordic_timber',
  placements jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint player_bedrooms_room_id_check check (room_id in ('nordic_timber','lakeside_stone','terracotta_artisan','midnight_dragon')),
  constraint player_bedrooms_placements_array_check check (jsonb_typeof(placements) = 'array')
);

alter table public.player_bedrooms enable row level security;
revoke all on table public.player_bedrooms from anon, authenticated;

create or replace function public.get_my_bedroom()
returns table(room_id text, placements jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  return query
  select
    coalesce(pb.room_id, 'nordic_timber'::text),
    coalesce(pb.placements, '[]'::jsonb),
    pb.updated_at
  from (select 1) seed
  left join public.player_bedrooms pb on pb.user_id = v_uid;
end;
$$;

create or replace function public.save_my_bedroom(p_room_id text, p_placements jsonb)
returns table(room_id text, placements jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_room text := lower(trim(coalesce(p_room_id,'')));
  v_placements jsonb := coalesce(p_placements, '[]'::jsonb);
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if v_room not in ('nordic_timber','lakeside_stone','terracotta_artisan','midnight_dragon') then
    raise exception 'Unknown bedroom design';
  end if;

  if jsonb_typeof(v_placements) <> 'array' then
    raise exception 'Bedroom placements must be a JSON array';
  end if;

  if jsonb_array_length(v_placements) > 120 then
    raise exception 'Too many bedroom placements';
  end if;

  insert into public.player_bedrooms(user_id, room_id, placements, updated_at)
  values(v_uid, v_room, v_placements, now())
  on conflict (user_id) do update
    set room_id = excluded.room_id,
        placements = excluded.placements,
        updated_at = excluded.updated_at;

  return query
  select pb.room_id, pb.placements, pb.updated_at
  from public.player_bedrooms pb
  where pb.user_id = v_uid;
end;
$$;

revoke all on function public.get_my_bedroom() from public, anon;
revoke all on function public.save_my_bedroom(text,jsonb) from public, anon;
grant execute on function public.get_my_bedroom() to authenticated;
grant execute on function public.save_my_bedroom(text,jsonb) to authenticated;
