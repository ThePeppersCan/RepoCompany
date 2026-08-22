-- V32.78 read-only Dragonbound house visitor RPCs
create or replace function public.dragonbound_public_house_list()
returns table(keeper_id uuid, username text, house_id text, dragon_name text, breed_id text, gender text, dragon_hatched_at timestamptz, furniture_count bigint)
language sql security definer set search_path=public as $$
  select p.user_id,p.username,p.starter_house_id,p.dragon_name,p.breed_id,p.gender,p.dragon_hatched_at,count(f.placement_id)::bigint
  from public.dragonbound_profiles p
  left join public.dragonbound_house_furniture f on f.user_id=p.user_id and f.house_id=p.starter_house_id
  where auth.uid() is not null and p.user_id<>auth.uid() and p.starter_house_id is not null and p.dragon_name is not null and p.breed_id is not null
  group by p.user_id,p.username,p.starter_house_id,p.dragon_name,p.breed_id,p.gender,p.dragon_hatched_at
  order by lower(p.username),lower(p.dragon_name);
$$;
create or replace function public.dragonbound_public_house_preview(p_keeper_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb; begin if auth.uid() is null then raise exception 'Authentication required'; end if;
select jsonb_build_object('keeperId',p.user_id,'username',p.username,'houseId',p.starter_house_id,'dragon',jsonb_build_object('id','visitor-dragon-'||p.user_id::text,'name',p.dragon_name,'breedId',p.breed_id,'gender',p.gender,'hatchedAt',extract(epoch from p.dragon_hatched_at)*1000,'personality',coalesce(p.personality,'{}'::jsonb),'traits',coalesce(p.dragon_traits,'{}'::jsonb),'preferences',coalesce(p.dragon_preferences,'{}'::jsonb)),'placements',coalesce((select jsonb_agg(jsonb_build_object('placementId',f.placement_id,'itemId',f.item_id,'roomId',f.room_id,'x',f.x,'y',f.y,'rotation',f.rotation,'direction',f.direction,'scale',f.scale) order by f.placed_at,f.placement_id) from public.dragonbound_house_furniture f where f.user_id=p.user_id and f.house_id=p.starter_house_id),'[]'::jsonb)) into result from public.dragonbound_profiles p where p.user_id=p_keeper_id and p.starter_house_id is not null and p.dragon_name is not null and p.breed_id is not null limit 1; return result; end; $$;
revoke all on function public.dragonbound_public_house_list() from public;
revoke all on function public.dragonbound_public_house_preview(uuid) from public;
grant execute on function public.dragonbound_public_house_list() to authenticated;
grant execute on function public.dragonbound_public_house_preview(uuid) to authenticated;
