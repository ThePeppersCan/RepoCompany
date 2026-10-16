-- Retire games without deleting rooms, playlists, messages or private historical data.
begin;
revoke execute on function public.reparty_game_action(text,text,jsonb) from public,anon,authenticated;
revoke execute on function public.reparty_soundtrack_action(text,text,jsonb) from public,anon,authenticated;
update public.reparty_rooms set settings=settings-'game'-'soundtrack',revision=revision+1
 where settings ? 'game' or settings ? 'soundtrack';
create or replace function public.reparty_lobby_action(p_action text,p_room text default null,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); page integer; result jsonb;
begin
 if u is null then raise exception 'Please sign in with your RepoCompany account.'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'Invalid lobby request.'; end if;
 if coalesce(p_data->>'mode','video')<>'video' then raise exception 'Reparty is for watching and listening together.'; end if;
 if p_action='create' then
  return public.reparty_action('create',null,jsonb_build_object('name',coalesce(nullif(trim(p_data->>'name'),''),'The forest lounge')));
 elsif p_action<>'list' then raise exception 'Unknown lobby action.'; end if;
 page:=coalesce((p_data->>'offset')::integer,0);
 if page<0 or page>100000 then raise exception 'Invalid room list.'; end if;
 select coalesce(jsonb_agg(to_jsonb(item)),'[]'::jsonb) into result from (
  select r.id,r.name,a.last_used,'video'::text as mode,
   (select count(*) from public.reparty_members m where m.room_id=r.id and m.last_seen>clock_timestamp()-interval '60 seconds') as people
  from public.reparty_rooms r join reparty_private.room_activity a on a.room_id=r.id
  where a.last_used>clock_timestamp()-interval '7 days'
  order by a.last_used desc,r.id limit 51 offset page
 ) item;
 return jsonb_build_object('rooms',case when jsonb_array_length(result)>50 then result-50 else result end,
  'has_more',jsonb_array_length(result)>50,'server_time',clock_timestamp());
end; $$;
revoke all on function public.reparty_lobby_action(text,text,jsonb) from public,anon;
grant execute on function public.reparty_lobby_action(text,text,jsonb) to authenticated;
commit;
