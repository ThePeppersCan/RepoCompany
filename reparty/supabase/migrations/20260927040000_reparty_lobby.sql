-- Public-to-signed-in room discovery. Old rooms leave the directory after seven
-- days of no use; their contents remain recoverable through their existing link.
begin;
create table if not exists reparty_private.room_activity (
 room_id text primary key references public.reparty_rooms(id) on delete cascade,
 last_used timestamptz not null
);
alter table reparty_private.room_activity enable row level security;
revoke all on reparty_private.room_activity from public,anon,authenticated;
insert into reparty_private.room_activity(room_id,last_used)
 select r.id,greatest(r.created_at,r.updated_at,coalesce(max(m.last_seen),r.created_at))
 from public.reparty_rooms r left join public.reparty_members m on m.room_id=r.id group by r.id
 on conflict(room_id) do nothing;

create or replace function reparty_private.touch_room_activity() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 -- Leaving backdates presence. It must never backdate the actual last use.
 if TG_OP='INSERT' or new.last_seen>old.last_seen then
  insert into reparty_private.room_activity values(new.room_id,new.last_seen)
   on conflict(room_id) do update set last_used=greatest(reparty_private.room_activity.last_used,excluded.last_used);
 end if;
 return new;
end; $$;
revoke all on function reparty_private.touch_room_activity() from public,anon,authenticated;
drop trigger if exists reparty_room_activity on public.reparty_members;
create trigger reparty_room_activity after insert or update of last_seen on public.reparty_members
 for each row execute function reparty_private.touch_room_activity();

create or replace function public.reparty_lobby_action(p_action text,p_room text default null,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); mode text; page integer; result jsonb; created jsonb;
begin
 if u is null then raise exception 'Please sign in with your RepoCompany account.'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'Invalid lobby request.'; end if;
 if p_action='create' then
  mode:=p_data->>'mode';
  if mode is null or mode not in ('video','game','soundtrack') then raise exception 'Choose a room type.'; end if;
  created:=public.reparty_action('create',null,jsonb_build_object('name',coalesce(nullif(trim(p_data->>'name'),''),case when mode='video' then 'The forest lounge' else 'Game night' end)));
  if mode='game' then perform public.reparty_game_action('enter',created->>'id','{"revision":0}'::jsonb);
  elsif mode='soundtrack' then perform public.reparty_soundtrack_action('enter',created->>'id','{}'::jsonb);
  end if;
  return created;
 elsif p_action<>'list' then raise exception 'Unknown lobby action.'; end if;
 mode:=coalesce(p_data->>'mode','video');page:=coalesce((p_data->>'offset')::integer,0);
 if mode not in ('video','game') or page<0 or page>100000 then raise exception 'Invalid room list.'; end if;
 select coalesce(jsonb_agg(to_jsonb(item)),'[]'::jsonb) into result from (
  select r.id,r.name,a.last_used,
   case r.settings->'game'->>'mode' when 'game' then 'game' when 'soundtrack' then 'soundtrack' else 'video' end as mode,
   (select count(*) from public.reparty_members m where m.room_id=r.id and m.last_seen>clock_timestamp()-interval '60 seconds') as people
  from public.reparty_rooms r join reparty_private.room_activity a on a.room_id=r.id
  where a.last_used>clock_timestamp()-interval '7 days'
   and (case when r.settings->'game'->>'mode' in ('game','soundtrack') then 'game' else 'video' end)=mode
  order by a.last_used desc,r.id limit 51 offset page
 ) item;
 return jsonb_build_object('rooms',case when jsonb_array_length(result)>50 then result-50 else result end,
  'has_more',jsonb_array_length(result)>50,'server_time',clock_timestamp());
end; $$;
revoke all on function public.reparty_lobby_action(text,text,jsonb) from public,anon;
grant execute on function public.reparty_lobby_action(text,text,jsonb) to authenticated;
commit;
