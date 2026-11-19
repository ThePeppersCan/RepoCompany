-- Authenticated room members see progress only for people currently in their room.
-- One short-lived lease per account serializes credit across rooms, tabs and devices.
create table public.reparty_watch_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  watched_ms bigint not null default 0 check (watched_ms >= 0),
  viewer uuid,
  room_id text,
  item_id text,
  sample_no bigint not null default 0,
  sampled_at timestamptz
);
alter table public.reparty_watch_progress enable row level security;
revoke all on public.reparty_watch_progress from public, anon, authenticated;

create function public.reparty_watch_tick(p_room text, p_viewer uuid, p_item text,
  p_active boolean, p_elapsed_ms integer, p_sequence bigint)
returns table(member_id uuid, watched_ms bigint)
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  state public.reparty_watch_progress%rowtype;
  media jsonb;
  stamp timestamptz;
  elapsed bigint := 0;
  playing_same boolean;
  changed_at timestamptz;
begin
  if actor is null or p_viewer is null or p_sequence is null or p_sequence <= 0 or not exists (
    select 1 from public.reparty_members m where m.user_id = actor and m.room_id = p_room
      and m.last_seen > clock_timestamp() - interval '60 seconds'
  ) then raise exception 'Join the room first' using errcode = '42501'; end if;

  select r.playback into media from public.reparty_rooms r where r.id = p_room;
  -- Idle observers can read the roster. Only the active lease holder may close it.
  if p_active or exists (select 1 from public.reparty_watch_progress w
    where w.user_id = actor and w.viewer = p_viewer) then
    insert into public.reparty_watch_progress(user_id) values (actor) on conflict do nothing;
    select * into state from public.reparty_watch_progress w where w.user_id = actor for update;
    stamp := clock_timestamp();
    if not (state.viewer is not distinct from p_viewer and p_sequence <= state.sample_no)
      and (state.viewer is null or state.viewer = p_viewer or state.sampled_at < stamp - interval '40 seconds') then
      playing_same := coalesce(media->>'item_id' = p_item and media->>'playing' = 'true' and media->>'video_id' is not null,false);
      changed_at := coalesce((media->>'updated_at')::timestamptz,stamp);
      if state.viewer = p_viewer and state.room_id = p_room and state.item_id = p_item
        and state.sampled_at >= stamp - interval '40 seconds' then
        if playing_same then
          elapsed := floor(1000 * extract(epoch from stamp - greatest(state.sampled_at,changed_at)))::bigint;
        elsif not p_active then
          -- Settle the last measured portion through the server's pause/track-change timestamp.
          elapsed := floor(1000 * extract(epoch from least(stamp,changed_at) - state.sampled_at))::bigint;
        end if;
        elapsed := greatest(0,least(elapsed,coalesce(p_elapsed_ms,0),30000));
      end if;
      p_active := p_active and playing_same;
      update public.reparty_watch_progress w set watched_ms = w.watched_ms + elapsed,
        viewer = case when p_active then p_viewer end, room_id = case when p_active then p_room end,
        item_id = case when p_active then p_item end, sample_no = p_sequence, sampled_at = stamp where w.user_id = actor;
    end if;
  end if;
  return query select m.user_id, coalesce(w.watched_ms,0::bigint)
    from public.reparty_members m left join public.reparty_watch_progress w on w.user_id=m.user_id
    where m.room_id=p_room and m.last_seen > clock_timestamp() - interval '60 seconds';
end $$;
revoke all on function public.reparty_watch_tick(text,uuid,text,boolean,integer,bigint) from public, anon;
grant execute on function public.reparty_watch_tick(text,uuid,text,boolean,integer,bigint) to authenticated;
