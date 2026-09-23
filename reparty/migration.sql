-- Reparty v1: run once in the existing RepoCompany Supabase SQL editor.
-- Additive only. Existing accounts, characters, games and data are untouched.
begin;

create table if not exists public.reparty_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  avatar_id smallint not null default 0 check (avatar_id between 0 and 99)
);
create table if not exists public.reparty_rooms (
  id text primary key check (id ~ '^[a-f0-9]{12}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  playlists jsonb not null,
  playback jsonb not null default '{"video_id":null,"item_id":null,"playing":false,"position":0}',
  revision bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.reparty_members (
  room_id text not null references public.reparty_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  last_seen timestamptz not null default now(),
  primary key (room_id, user_id)
);
create table if not exists public.reparty_messages (
  id bigint generated always as identity primary key,
  room_id text not null references public.reparty_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_id smallint not null check (avatar_id between 0 and 99),
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists reparty_messages_room_time on public.reparty_messages(room_id, id desc);
create index if not exists reparty_messages_user_time on public.reparty_messages(user_id, created_at desc);
create index if not exists reparty_rooms_owner_time on public.reparty_rooms(owner_id, created_at);

alter table public.reparty_profiles enable row level security;
alter table public.reparty_rooms enable row level security;
alter table public.reparty_members enable row level security;
alter table public.reparty_messages enable row level security;

create or replace function public.reparty_is_member(p_room text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.reparty_members where room_id=p_room and user_id=auth.uid());
$$;
revoke all on function public.reparty_is_member(text) from public, anon;
grant execute on function public.reparty_is_member(text) to authenticated;

drop policy if exists reparty_room_read on public.reparty_rooms;
create policy reparty_room_read on public.reparty_rooms for select to authenticated using(public.reparty_is_member(id));
drop policy if exists reparty_member_read on public.reparty_members;
create policy reparty_member_read on public.reparty_members for select to authenticated using(public.reparty_is_member(room_id));
drop policy if exists reparty_message_read on public.reparty_messages;
create policy reparty_message_read on public.reparty_messages for select to authenticated using(public.reparty_is_member(room_id));
drop policy if exists reparty_profile_read on public.reparty_profiles;
create policy reparty_profile_read on public.reparty_profiles for select to authenticated using(user_id=auth.uid());

revoke all on public.reparty_rooms, public.reparty_members, public.reparty_messages, public.reparty_profiles from anon, authenticated;
grant select on public.reparty_rooms, public.reparty_members, public.reparty_messages, public.reparty_profiles to authenticated;

-- All writes go through this validated transaction, never arbitrary client updates.
create or replace function public.reparty_action(p_action text, p_room text default null, p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  u uuid := auth.uid();
  r public.reparty_rooms%rowtype;
  n text; code text; lists jsonb; entries jsonb; entry jsonb; pb jsonb;
  li integer; ei integer; ti integer; av integer; pos double precision;
  result jsonb; stamp timestamptz := clock_timestamp(); changed boolean := false;
begin
  if u is null then raise exception 'Please sign in with your RepoCompany account.'; end if;
  if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Invalid request.'; end if;
  -- Serialise each user's writes too, preventing chat/create rate-limit races across rooms.
  perform pg_advisory_xact_lock(hashtextextended(u::text, 721));
  select coalesce((select username from public.characters where user_id=u limit 1),nullif(raw_user_meta_data->>'username',''), 'Member') into n from auth.users where id=u;
  n := left(coalesce(n,'Member'),32);
  insert into public.reparty_profiles(user_id) values(u) on conflict do nothing;
  select avatar_id into av from public.reparty_profiles where user_id=u;

  if p_action='avatar' then
    av := (p_data->>'avatar_id')::integer;
    if av is null or av not between 0 and 99 then raise exception 'Choose one of the 100 avatars.'; end if;
    update public.reparty_profiles set avatar_id=av where user_id=u;
    return jsonb_build_object('avatar_id',av);
  elsif p_action='profile' then
    return jsonb_build_object('avatar_id',av,'display_name',n);
  elsif p_action='create' then
    if (select count(*) from public.reparty_rooms where owner_id=u and created_at>now()-interval '1 day')>=20 then
      raise exception 'You have made enough rooms today. Reuse an existing room.';
    end if;
    code := substr(replace(gen_random_uuid()::text,'-',''),1,12);
    insert into public.reparty_rooms(id,owner_id,name,playlists,playback)
    values(code,u,left(coalesce(nullif(trim(p_data->>'name'),''),'Forest room'),60),
      jsonb_build_array(jsonb_build_object('id',gen_random_uuid()::text,'name','Our playlist','items','[]'::jsonb)),
      jsonb_build_object('video_id',null,'item_id',null,'playing',false,'position',0,'updated_at',stamp));
    insert into public.reparty_members(room_id,user_id,display_name) values(code,u,n);
    return jsonb_build_object('id',code);
  end if;

  select * into r from public.reparty_rooms where id=p_room for update;
  if not found then raise exception 'Room not found. Check the room code.'; end if;
  if p_action='join' then
    insert into public.reparty_members(room_id,user_id,display_name,last_seen) values(p_room,u,n,stamp)
      on conflict(room_id,user_id) do update set display_name=excluded.display_name,last_seen=excluded.last_seen;
  elsif not public.reparty_is_member(p_room) then raise exception 'Join this room first.';
  end if;
  if p_action='leave' then
    update public.reparty_members set last_seen=stamp-interval '2 minutes' where room_id=p_room and user_id=u;
    return '{}'::jsonb;
  end if;
  update public.reparty_members set last_seen=stamp,display_name=n where room_id=p_room and user_id=u;
  lists := r.playlists; pb := r.playback;
  if p_action in ('join','snapshot') then null;
  elsif p_action='chat' then
    if char_length(trim(coalesce(p_data->>'body',''))) not between 1 and 1000 then raise exception 'Messages must be 1–1,000 characters.'; end if;
    if exists(select 1 from public.reparty_messages where user_id=u and created_at>stamp-interval '700 milliseconds') then raise exception 'Please wait a moment before sending another message.'; end if;
    insert into public.reparty_messages(room_id,user_id,display_name,avatar_id,body) values(p_room,u,n,av,trim(p_data->>'body'));
  elsif p_action='playlist_create' then
    if jsonb_array_length(lists)>=20 then raise exception 'This room has the maximum of 20 playlists.'; end if;
    if char_length(trim(coalesce(p_data->>'name',''))) not between 1 and 60 then raise exception 'Give the playlist a name (up to 60 characters).'; end if;
    lists := lists || jsonb_build_array(jsonb_build_object('id',gen_random_uuid()::text,'name',trim(p_data->>'name'),'items','[]'::jsonb));
    changed := true;
  elsif p_action in ('playlist_rename','playlist_delete','add','remove','move','play','next') then
    select ord::integer-1 into li from jsonb_array_elements(lists) with ordinality a(value,ord) where value->>'id'=p_data->>'playlist_id';
    if li is null then raise exception 'That playlist no longer exists.'; end if;
    entries := lists->li->'items';
    if p_action='playlist_rename' then
      if char_length(trim(coalesce(p_data->>'name',''))) not between 1 and 60 then raise exception 'Give the playlist a name (up to 60 characters).'; end if;
      lists := jsonb_set(lists,array[li::text,'name'],to_jsonb(trim(p_data->>'name')));
    elsif p_action='playlist_delete' then
      if jsonb_array_length(lists)<=1 then raise exception 'Keep at least one playlist.'; end if;
      if exists(select 1 from jsonb_array_elements(entries) a where a->>'id'=pb->>'item_id') then
        pb := jsonb_build_object('video_id',null,'item_id',null,'playing',false,'position',0,'updated_at',stamp);
      end if;
      lists := lists-li;
    elsif p_action='add' then
      if jsonb_array_length(entries)>=200 then raise exception 'This playlist already has 200 videos.'; end if;
      if coalesce(p_data->>'video_id','') !~ '^[a-zA-Z0-9_-]{11}$' then raise exception 'Use a valid YouTube video link.'; end if;
      entry := jsonb_build_object('id',gen_random_uuid()::text,'video_id',p_data->>'video_id','title',left(coalesce(nullif(trim(p_data->>'title'),''),'YouTube video'),160),'added_by',n);
      entries := entries || jsonb_build_array(entry);
      lists := jsonb_set(lists,array[li::text,'items'],entries);
    else
      select ord::integer-1,value into ei,entry from jsonb_array_elements(entries) with ordinality a(value,ord) where value->>'id'=p_data->>'item_id';
      if ei is null then raise exception 'That video is no longer in the playlist.'; end if;
      if p_action='remove' then
        entries := entries-ei;
        if entry->>'id'=pb->>'item_id' then pb := jsonb_build_object('video_id',null,'item_id',null,'playing',false,'position',0,'updated_at',stamp); end if;
        lists := jsonb_set(lists,array[li::text,'items'],entries);
      elsif p_action='move' then
        ti := ei + case when p_data->>'direction'='up' then -1 when p_data->>'direction'='down' then 1 else 0 end;
        if ti>=0 and ti<jsonb_array_length(entries) then
          entries := jsonb_set(jsonb_set(entries,array[ei::text],entries->ti),array[ti::text],entry);
          lists := jsonb_set(lists,array[li::text,'items'],entries);
        end if;
      else
        if p_action='next' then
          -- Every viewer may reach ENDED. Only the first matching revision advances.
          if coalesce((p_data->>'revision')::bigint,-1)<>r.revision or pb->>'item_id'<>entry->>'id' then return jsonb_build_object('stale',true); end if;
          entry := entries->(ei+1);
        end if;
        pb := jsonb_build_object('video_id',entry->>'video_id','item_id',entry->>'id','playing',entry is not null,'position',0,'updated_at',stamp);
      end if;
    end if;
    changed := true;
  elsif p_action='playback' then
    if pb->>'video_id' is null then raise exception 'Choose a video first.'; end if;
    if p_data->>'item_id' is distinct from pb->>'item_id' then return jsonb_build_object('stale',true); end if;
    pos := (p_data->>'position')::double precision;
    if pos is null or not(pos>=0 and pos<=86400) then raise exception 'Invalid playback position.'; end if;
    if jsonb_typeof(p_data->'playing') is distinct from 'boolean' then raise exception 'Invalid playback state.'; end if;
    pb := pb || jsonb_build_object('position',pos,'playing',(p_data->>'playing')::boolean,'updated_at',stamp);
    changed := true;
  else raise exception 'Unknown room action.';
  end if;
  if changed then
    update public.reparty_rooms set playlists=lists,playback=pb,revision=revision+1,updated_at=stamp where id=p_room returning * into r;
  end if;
  select jsonb_build_object(
    'room',to_jsonb(r),'server_time',clock_timestamp(),'avatar_id',av,
    'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',m.user_id,'name',m.display_name,'avatar_id',coalesce(p.avatar_id,0)) order by m.user_id)
      from public.reparty_members m left join public.reparty_profiles p on p.user_id=m.user_id where m.room_id=p_room and m.last_seen>stamp-interval '60 seconds'),'[]'::jsonb),
    'messages',coalesce((select jsonb_agg(to_jsonb(msg) order by msg.id) from (select * from public.reparty_messages where room_id=p_room order by id desc limit 100) msg),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.reparty_action(text,text,jsonb) from public, anon;
grant execute on function public.reparty_action(text,text,jsonb) to authenticated;

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='reparty_rooms') then
      alter publication supabase_realtime add table public.reparty_rooms;
    end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='reparty_messages') then
      alter publication supabase_realtime add table public.reparty_messages;
    end if;
  end if;
end $$;
commit;
