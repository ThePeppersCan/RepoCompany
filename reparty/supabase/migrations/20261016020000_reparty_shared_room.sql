-- One configured room for normal entry; other rooms remain available by choice.
begin;
create table if not exists reparty_private.site_room (
 singleton boolean primary key default true check (singleton),
 room_id text not null references public.reparty_rooms(id)
);
alter table reparty_private.site_room enable row level security;
revoke all on reparty_private.site_room from public,anon,authenticated;
-- Keep the site's existing active room, playlists and conversation intact.
insert into reparty_private.site_room(singleton,room_id)
 select true,id from public.reparty_rooms where id='e1b25c77e39e'
 on conflict(singleton) do nothing;
create or replace function public.reparty_lobby_action(p_action text,p_room text default null,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); page integer; result jsonb; shared text;
begin
 if u is null then raise exception 'Please sign in with your RepoCompany account.'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'Invalid lobby request.'; end if;
 if coalesce(p_data->>'mode','video')<>'video' then raise exception 'Reparty is for watching and listening together.'; end if;
 select room_id into shared from reparty_private.site_room where singleton;
 if p_action='default' then
  if shared is null then raise exception 'The shared room is not configured yet. Choose a room from Rooms.'; end if;
  return jsonb_build_object('id',shared);
 elsif p_action='create' then
  return public.reparty_action('create',null,jsonb_build_object('name',coalesce(nullif(trim(p_data->>'name'),''),'New room')));
 elsif p_action<>'list' then raise exception 'Unknown lobby action.'; end if;
 page:=coalesce((p_data->>'offset')::integer,0);
 if page<0 or page>100000 then raise exception 'Invalid room list.'; end if;
 select coalesce(jsonb_agg(to_jsonb(item)),'[]'::jsonb) into result from (
  select r.id,r.name,a.last_used,'video'::text as mode,(r.id=shared) as is_default,
   (select count(*) from public.reparty_members m where m.room_id=r.id and m.last_seen>clock_timestamp()-interval '60 seconds') as people
  from public.reparty_rooms r left join reparty_private.room_activity a on a.room_id=r.id
  where r.id=shared or a.last_used>clock_timestamp()-interval '7 days'
  order by (r.id=shared) desc nulls last,a.last_used desc nulls last,r.id limit 51 offset page
 ) item;
 return jsonb_build_object('rooms',case when jsonb_array_length(result)>50 then result-50 else result end,
  'has_more',jsonb_array_length(result)>50,'server_time',clock_timestamp());
end; $$;
revoke all on function public.reparty_lobby_action(text,text,jsonb) from public,anon;
grant execute on function public.reparty_lobby_action(text,text,jsonb) to authenticated;
commit;
