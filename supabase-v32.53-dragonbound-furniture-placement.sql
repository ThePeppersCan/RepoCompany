-- V32.53 Dragonbound furniture placement overhaul
-- Adds persistent furniture resize and replaces image rotation with horizontal turning.

alter table public.dragonbound_house_furniture
  add column if not exists scale numeric(4,2) not null default 1.00;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname='dragonbound_house_furniture_scale_check'
  ) then
    alter table public.dragonbound_house_furniture
      add constraint dragonbound_house_furniture_scale_check check (scale between 0.55 and 1.60);
  end if;
end $$;

-- V32.52's 180-degree "rotate" visually turned sprites upside down.
-- Preserve the user's intention as a left/right turn and normalize the old rotation.
update public.dragonbound_house_furniture
set direction = case when rotation=180 then case when direction='left' then 'right' else 'left' end else direction end,
    rotation = 0,
    scale = coalesce(scale,1.00),
    updated_at = now()
where rotation <> 0 or scale is null;

create or replace function public.dragonbound_get_furniture_state(p_house_id text default null)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid:=auth.uid();
  v_username text;
  v_home text;
  v_admin boolean:=false;
  v_wallet bigint:=0;
begin
  if v_uid is null then raise exception 'You must be signed in to use Dragonbound Build.'; end if;
  select c.username into v_username from public.characters c where c.user_id=v_uid limit 1;
  if coalesce(v_username,'')='' then raise exception 'Dragonbound character profile not found.'; end if;
  v_admin:=lower(v_username)='admin';
  select p.starter_house_id into v_home from public.dragonbound_profiles p where p.user_id=v_uid;
  if p_house_id is not null and not v_admin and (v_home is null or p_house_id is distinct from v_home) then
    raise exception 'You can only build in your current Dragonbound home.';
  end if;
  insert into public.dragonbound_wallets(user_id,keeper_marks,updated_at) values(v_uid,0,now()) on conflict(user_id) do nothing;
  select w.keeper_marks into v_wallet from public.dragonbound_wallets w where w.user_id=v_uid;
  return jsonb_build_object(
    'currency','Keeper Marks',
    'balance',coalesce(v_wallet,0),
    'houseId',v_home,
    'catalog',coalesce((select jsonb_agg(jsonb_build_object(
      'itemId',c.item_id,'name',c.name,'category',c.category,'collection',c.collection_name,'rarity',c.rarity,
      'price',c.price,'sprite',c.sprite_path,'footprintW',c.footprint_w,'footprintH',c.footprint_h,
      'clearance',c.clearance,'description',c.description,'tags',to_jsonb(c.tags),'sortOrder',c.sort_order
    ) order by c.sort_order) from public.dragonbound_furniture_catalog c where c.available),'[]'::jsonb),
    'inventory',coalesce((select jsonb_agg(jsonb_build_object('itemId',i.item_id,'owned',i.owned_quantity,'available',i.available_quantity)) from public.dragonbound_furniture_inventory i where i.user_id=v_uid),'[]'::jsonb),
    'placements',case when p_house_id is null then '[]'::jsonb else coalesce((select jsonb_agg(jsonb_build_object(
      'placementId',f.placement_id,'itemId',f.item_id,'houseId',f.house_id,'roomId',f.room_id,
      'x',f.x,'y',f.y,'rotation',0,'direction',f.direction,'scale',f.scale
    ) order by f.placed_at) from public.dragonbound_house_furniture f where f.user_id=v_uid and f.house_id=p_house_id),'[]'::jsonb) end
  );
end;
$$;

create or replace function public.dragonbound_place_furniture_v2(
  p_item_id text,
  p_house_id text,
  p_room_id text,
  p_x numeric,
  p_y numeric,
  p_direction text default 'right',
  p_scale numeric default 1.00
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid:=auth.uid();
  v_username text;
  v_home text;
  v_admin boolean:=false;
  v_available integer;
  v_id uuid;
  v_scale numeric(4,2):=round(coalesce(p_scale,1.00),2);
begin
  if v_uid is null then raise exception 'You must be signed in to build.'; end if;
  if p_room_id not in ('downstairs','upstairs') then raise exception 'Invalid Dragonbound room.'; end if;
  if p_x<0 or p_x>1 or p_y<0 or p_y>1 then raise exception 'Invalid furniture position.'; end if;
  if p_direction not in ('left','right') then raise exception 'Invalid furniture direction.'; end if;
  if v_scale<0.55 or v_scale>1.60 then raise exception 'Invalid furniture size.'; end if;
  select c.username into v_username from public.characters c where c.user_id=v_uid limit 1;
  v_admin:=lower(coalesce(v_username,''))='admin';
  select p.starter_house_id into v_home from public.dragonbound_profiles p where p.user_id=v_uid;
  if not v_admin and (v_home is null or p_house_id is distinct from v_home) then raise exception 'You can only build in your current Dragonbound home.'; end if;
  perform 1 from public.dragonbound_furniture_catalog where item_id=p_item_id and available;
  if not found then raise exception 'Furniture item not found.'; end if;
  select available_quantity into v_available from public.dragonbound_furniture_inventory where user_id=v_uid and item_id=p_item_id for update;
  if coalesce(v_available,0)<1 then raise exception 'No available copy of that furniture item.'; end if;
  update public.dragonbound_furniture_inventory set available_quantity=available_quantity-1,updated_at=now() where user_id=v_uid and item_id=p_item_id;
  insert into public.dragonbound_house_furniture(user_id,house_id,room_id,item_id,x,y,rotation,direction,scale,placed_at,updated_at)
  values(v_uid,p_house_id,p_room_id,p_item_id,p_x,p_y,0,p_direction,v_scale,now(),now()) returning placement_id into v_id;
  return jsonb_build_object('placementId',v_id,'itemId',p_item_id,'houseId',p_house_id,'roomId',p_room_id,'x',p_x,'y',p_y,'rotation',0,'direction',p_direction,'scale',v_scale);
end;
$$;

create or replace function public.dragonbound_move_furniture_v2(
  p_placement_id uuid,
  p_room_id text,
  p_x numeric,
  p_y numeric,
  p_direction text default 'right',
  p_scale numeric default 1.00
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid:=auth.uid();
  v_row public.dragonbound_house_furniture%rowtype;
  v_scale numeric(4,2):=round(coalesce(p_scale,1.00),2);
begin
  if v_uid is null then raise exception 'You must be signed in to build.'; end if;
  if p_room_id not in ('downstairs','upstairs') or p_x<0 or p_x>1 or p_y<0 or p_y>1 then raise exception 'Invalid furniture placement.'; end if;
  if p_direction not in ('left','right') then raise exception 'Invalid furniture direction.'; end if;
  if v_scale<0.55 or v_scale>1.60 then raise exception 'Invalid furniture size.'; end if;
  select * into v_row from public.dragonbound_house_furniture where placement_id=p_placement_id and user_id=v_uid for update;
  if not found then raise exception 'Furniture placement not found.'; end if;
  update public.dragonbound_house_furniture
    set room_id=p_room_id,x=p_x,y=p_y,rotation=0,direction=p_direction,scale=v_scale,updated_at=now()
    where placement_id=p_placement_id and user_id=v_uid;
  return jsonb_build_object('placementId',p_placement_id,'itemId',v_row.item_id,'houseId',v_row.house_id,'roomId',p_room_id,'x',p_x,'y',p_y,'rotation',0,'direction',p_direction,'scale',v_scale);
end;
$$;

revoke execute on function public.dragonbound_place_furniture_v2(text,text,text,numeric,numeric,text,numeric) from public,anon;
revoke execute on function public.dragonbound_move_furniture_v2(uuid,text,numeric,numeric,text,numeric) from public,anon;
grant execute on function public.dragonbound_place_furniture_v2(text,text,text,numeric,numeric,text,numeric) to authenticated;
grant execute on function public.dragonbound_move_furniture_v2(uuid,text,numeric,numeric,text,numeric) to authenticated;
