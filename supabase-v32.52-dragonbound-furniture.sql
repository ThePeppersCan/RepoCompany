-- V32.52 Dragonbound furniture shop, wallet, inventory and house placement system
create table if not exists public.dragonbound_furniture_catalog (
  item_id text primary key,
  name text not null,
  category text not null check (category in ('Living','Beds','Kitchen','Bath','Training','Toys','Care')),
  collection_name text not null,
  rarity text not null check (rarity in ('Common','Crafted','Rare','Epic')),
  price bigint not null default 0 check (price >= 0),
  sprite_path text not null,
  footprint_w smallint not null default 2 check (footprint_w between 1 and 8),
  footprint_h smallint not null default 1 check (footprint_h between 1 and 8),
  clearance text not null default 'Standard' check (clearance in ('Standard','Wide')),
  description text not null default '',
  tags text[] not null default '{}'::text[],
  sort_order integer not null default 0,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dragonbound_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  keeper_marks bigint not null default 0 check (keeper_marks >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.dragonbound_furniture_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null references public.dragonbound_furniture_catalog(item_id) on delete restrict,
  owned_quantity integer not null default 0 check (owned_quantity >= 0),
  available_quantity integer not null default 0 check (available_quantity >= 0 and available_quantity <= owned_quantity),
  acquired_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id,item_id)
);

create table if not exists public.dragonbound_house_furniture (
  placement_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  house_id text not null,
  room_id text not null check (room_id in ('downstairs','upstairs')),
  item_id text not null references public.dragonbound_furniture_catalog(item_id) on delete restrict,
  x numeric(7,6) not null check (x >= 0 and x <= 1),
  y numeric(7,6) not null check (y >= 0 and y <= 1),
  rotation smallint not null default 0 check (rotation in (0,90,180,270)),
  direction text not null default 'right' check (direction in ('left','right')),
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dragonbound_house_furniture_user_house_idx on public.dragonbound_house_furniture(user_id,house_id);
create index if not exists dragonbound_house_furniture_item_idx on public.dragonbound_house_furniture(user_id,item_id);

alter table public.dragonbound_furniture_catalog enable row level security;
alter table public.dragonbound_wallets enable row level security;
alter table public.dragonbound_furniture_inventory enable row level security;
alter table public.dragonbound_house_furniture enable row level security;

drop policy if exists dragonbound_furniture_catalog_read on public.dragonbound_furniture_catalog;
create policy dragonbound_furniture_catalog_read on public.dragonbound_furniture_catalog for select to authenticated using (available);

drop policy if exists dragonbound_wallets_select_own on public.dragonbound_wallets;
create policy dragonbound_wallets_select_own on public.dragonbound_wallets for select to authenticated using (auth.uid()=user_id);

drop policy if exists dragonbound_furniture_inventory_select_own on public.dragonbound_furniture_inventory;
create policy dragonbound_furniture_inventory_select_own on public.dragonbound_furniture_inventory for select to authenticated using (auth.uid()=user_id);

drop policy if exists dragonbound_house_furniture_select_own on public.dragonbound_house_furniture;
create policy dragonbound_house_furniture_select_own on public.dragonbound_house_furniture for select to authenticated using (auth.uid()=user_id);

revoke insert,update,delete on public.dragonbound_furniture_catalog from anon,authenticated;
revoke insert,update,delete on public.dragonbound_wallets from anon,authenticated;
revoke insert,update,delete on public.dragonbound_furniture_inventory from anon,authenticated;
revoke insert,update,delete on public.dragonbound_house_furniture from anon,authenticated;

grant select on public.dragonbound_furniture_catalog to authenticated;
grant select on public.dragonbound_wallets to authenticated;
grant select on public.dragonbound_furniture_inventory to authenticated;
grant select on public.dragonbound_house_furniture to authenticated;

insert into public.dragonbound_furniture_catalog
(item_id,name,category,collection_name,rarity,price,sprite_path,footprint_w,footprint_h,clearance,description,tags,sort_order,available)
values
('cottage-0','Hearthstone Fireplace','Living','Cozy Cottage','Rare',180,'assets/dragonbound/furniture/cottage-00.png',2,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['inspectable','warm']::text[],0,true),
('cottage-1','Mosswood Rocking Chair','Living','Cozy Cottage','Common',215,'assets/dragonbound/furniture/cottage-01.png',2,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['comfortable','inspectable']::text[],1,true),
('cottage-2','Fernrest Sofa','Living','Cozy Cottage','Common',250,'assets/dragonbound/furniture/cottage-02.png',3,1,'Wide','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['comfortable','inspectable']::text[],2,true),
('cottage-3','Cottage Tea Table','Living','Cozy Cottage','Common',285,'assets/dragonbound/furniture/cottage-03.png',2,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['inspectable']::text[],3,true),
('cottage-4','Keeper’s Bookcase','Living','Cozy Cottage','Common',320,'assets/dragonbound/furniture/cottage-04.png',1,2,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['inspectable']::text[],4,true),
('cottage-5','Mossstitch Workbench','Living','Cozy Cottage','Crafted',355,'assets/dragonbound/furniture/cottage-05.png',2,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['comfortable','inspectable']::text[],5,true),
('cottage-6','Warden’s Coat Stand','Living','Cozy Cottage','Common',390,'assets/dragonbound/furniture/cottage-06.png',2,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['inspectable']::text[],6,true),
('cottage-7','Oldwood Longcase Clock','Living','Cozy Cottage','Common',425,'assets/dragonbound/furniture/cottage-07.png',1,2,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['inspectable']::text[],7,true),
('cottage-8','Scribe’s Writing Desk','Living','Cozy Cottage','Common',460,'assets/dragonbound/furniture/cottage-08.png',2,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['inspectable']::text[],8,true),
('cottage-9','Meadow Tea Trolley','Kitchen','Cozy Cottage','Common',495,'assets/dragonbound/furniture/cottage-09.png',2,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['food','inspectable']::text[],9,true),
('cottage-10','Traveller’s Storage Chest','Living','Cozy Cottage','Crafted',530,'assets/dragonbound/furniture/cottage-10.png',2,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['hideable','inspectable']::text[],10,true),
('cottage-11','Dragon Nesting Cushions','Beds','Cozy Cottage','Common',565,'assets/dragonbound/furniture/cottage-11.png',2,1,'Wide','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['comfortable','sleepable']::text[],11,true),
('cottage-12','Clay Wash Cabinet','Bath','Cozy Cottage','Common',600,'assets/dragonbound/furniture/cottage-12.png',2,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['hideable','inspectable','washable']::text[],12,true),
('cottage-13','Cottage Pantry','Kitchen','Cozy Cottage','Common',635,'assets/dragonbound/furniture/cottage-13.png',2,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['food','inspectable']::text[],13,true),
('cottage-14','Glowwick Floor Lamp','Living','Cozy Cottage','Common',670,'assets/dragonbound/furniture/cottage-14.png',2,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['inspectable','warm']::text[],14,true),
('cottage-15','Hallway Storage Bench','Living','Cozy Cottage','Crafted',705,'assets/dragonbound/furniture/cottage-15.png',3,1,'Standard','Warm starter-house craftsmanship in oak, moss green and aged brass.',ARRAY['comfortable','hideable','inspectable']::text[],15,true),
('bed-0','Emerald Canopy Bed','Beds','Royal Velmora','Epic',0,'assets/dragonbound/furniture/bed-00.png',4,2,'Wide','A grand draped bed sized for broad-winged companions.',ARRAY['comfortable','sleepable']::text[],16,true),
('bed-1','Marenza Captain’s Bed','Beds','Marenza Coast','Rare',315,'assets/dragonbound/furniture/bed-01.png',4,2,'Wide','Sea-blue timber and a sturdy captain’s frame.',ARRAY['comfortable','sleepable']::text[],17,true),
('bed-2','Guildmaster’s Rest','Beds','Guildhall','Rare',380,'assets/dragonbound/furniture/bed-02.png',4,2,'Wide','Reinforced oak, banners and deep red upholstery.',ARRAY['comfortable','sleepable']::text[],18,true),
('bed-3','Amethyst Dream Bed','Beds','Arcane Scholar','Epic',445,'assets/dragonbound/furniture/bed-03.png',4,2,'Wide','Crystal-lit rest with a calm arcane glow.',ARRAY['comfortable','sleepable']::text[],19,true),
('bed-4','Vardesh Fur Bed','Beds','Vardesh North','Crafted',510,'assets/dragonbound/furniture/bed-04.png',4,2,'Wide','Cold-climate timber layered with thick woven furs.',ARRAY['comfortable','sleepable']::text[],20,true),
('bed-5','Zafir Mosaic Canopy','Beds','Zafir','Epic',575,'assets/dragonbound/furniture/bed-05.png',4,2,'Wide','Turquoise mosaic panels and breathable desert linen.',ARRAY['comfortable','sleepable']::text[],21,true),
('bed-6','Autumn Storage Bed','Beds','Cozy Cottage','Crafted',640,'assets/dragonbound/furniture/bed-06.png',4,2,'Wide','Warm autumn quilting with useful built-in drawers.',ARRAY['comfortable','hideable','sleepable']::text[],22,true),
('bed-7','Blackglass Ember Bed','Beds','Blackglass','Epic',705,'assets/dragonbound/furniture/bed-07.png',4,2,'Wide','Heatproof ironwork and a banked ember glow.',ARRAY['comfortable','sleepable']::text[],23,true),
('kitchen-0','Azure Baker’s Range','Kitchen','Marenza Coast','Rare',340,'assets/dragonbound/furniture/kitchen-00.png',3,1,'Standard','A compact blue-tile oven for cottage kitchens.',ARRAY['food','inspectable']::text[],24,true),
('kitchen-1','Crimson Guild Range','Kitchen','Guildhall','Rare',405,'assets/dragonbound/furniture/kitchen-01.png',2,1,'Standard','A heavy guild range with hanging copper pans.',ARRAY['food','inspectable']::text[],25,true),
('kitchen-2','Cottage Butler Sink','Kitchen','Cozy Cottage','Common',470,'assets/dragonbound/furniture/kitchen-02.png',2,1,'Standard','Deep ceramic basin with dragon-safe rounded corners.',ARRAY['food','inspectable']::text[],26,true),
('kitchen-3','Arcane Preserves Bench','Kitchen','Arcane Scholar','Epic',535,'assets/dragonbound/furniture/kitchen-03.png',3,1,'Standard','Potion storage disguised as a practical pantry bench.',ARRAY['comfortable','food','inspectable']::text[],27,true),
('kitchen-4','Aurelia Prep Counter','Kitchen','Aurelia','Crafted',600,'assets/dragonbound/furniture/kitchen-04.png',2,1,'Standard','Bright prep counter for fruit, feed and daily meals.',ARRAY['food','inspectable']::text[],28,true),
('kitchen-5','Frostkeep Pantry','Kitchen','Vardesh North','Rare',665,'assets/dragonbound/furniture/kitchen-05.png',2,1,'Standard','Insulated pantry for chilled fish and medicines.',ARRAY['food','inspectable']::text[],29,true),
('kitchen-6','Zafir Spice Dresser','Kitchen','Zafir','Rare',730,'assets/dragonbound/furniture/kitchen-06.png',3,1,'Standard','Carved turquoise cabinet for spices and preserves.',ARRAY['food','inspectable']::text[],30,true),
('kitchen-7','Terracotta Bread Oven','Kitchen','Zafir','Crafted',795,'assets/dragonbound/furniture/kitchen-07.png',2,1,'Standard','Wood-fired oven with an accessible low hearth.',ARRAY['food','inspectable']::text[],31,true),
('bath-0','Meadow Washstand','Bath','Cozy Cottage','Common',0,'assets/dragonbound/furniture/bath-00.png',3,1,'Standard','A compact wash station for smaller starter rooms.',ARRAY['inspectable','washable']::text[],32,true),
('bath-1','Marenza Tile Bath','Bath','Marenza Coast','Rare',495,'assets/dragonbound/furniture/bath-01.png',2,1,'Standard','Salt-resistant blue tile and a deep bathing bowl.',ARRAY['inspectable','washable']::text[],33,true),
('bath-2','Vardesh Copper Tub','Bath','Vardesh North','Crafted',560,'assets/dragonbound/furniture/bath-02.png',2,1,'Standard','Hammered copper that holds warmth through winter.',ARRAY['inspectable','washable']::text[],34,true),
('bath-3','Rosewater Vanity','Bath','Royal Velmora','Rare',625,'assets/dragonbound/furniture/bath-03.png',3,1,'Standard','Polished grooming vanity with secure storage.',ARRAY['inspectable','washable']::text[],35,true),
('bath-4','Rainfall Wash Arch','Bath','Elven Verdant','Epic',690,'assets/dragonbound/furniture/bath-04.png',2,1,'Standard','Gentle overhead rinse with leaf-filtered water.',ARRAY['inspectable','washable']::text[],36,true),
('bath-5','Steamroom Bench','Bath','Vardesh North','Crafted',755,'assets/dragonbound/furniture/bath-05.png',2,1,'Standard','A sturdy bench for warming and towel-drying.',ARRAY['comfortable','inspectable','washable']::text[],37,true),
('bath-6','Wing-Dry Towel Rack','Bath','Cozy Cottage','Common',820,'assets/dragonbound/furniture/bath-06.png',3,1,'Standard','Wide rack positioned clear of tails and wings.',ARRAY['inspectable','washable']::text[],38,true),
('bath-7','Deep Dragon Wash Basin','Bath','Zafir','Rare',885,'assets/dragonbound/furniture/bath-07.png',2,1,'Standard','Low-sided basin for safe step-in washing.',ARRAY['inspectable','washable']::text[],39,true),
('training-0','Beginner Jump Rail','Training','Starter Training','Common',520,'assets/dragonbound/furniture/training-00.png',3,1,'Wide','Low breakaway rail for safe first jumps.',ARRAY['climbable','playable']::text[],40,true),
('training-1','Balance Beam','Training','Starter Training','Common',585,'assets/dragonbound/furniture/training-01.png',2,1,'Wide','Broad timber beam with a non-slip top.',ARRAY['climbable','playable']::text[],41,true),
('training-2','Target Bell Stand','Training','Guildhall','Crafted',650,'assets/dragonbound/furniture/training-02.png',2,1,'Wide','A clear bell target for focus exercises.',ARRAY['climbable','playable']::text[],42,true),
('training-3','Weave Pole Set','Training','Starter Training','Common',715,'assets/dragonbound/furniture/training-03.png',3,1,'Wide','Flexible weave poles on a stable floor strip.',ARRAY['climbable','playable']::text[],43,true),
('training-4','Wing Stretch Frame','Training','Care & Recovery','Rare',780,'assets/dragonbound/furniture/training-04.png',2,1,'Wide','Padded frame for guided shoulder and wing movement.',ARRAY['climbable','playable']::text[],44,true),
('training-5','Climbing Ramp','Training','Vardesh North','Crafted',845,'assets/dragonbound/furniture/training-05.png',2,1,'Wide','A grippy incline for claws of every size.',ARRAY['climbable','playable']::text[],45,true),
('training-6','Endurance Treadwheel','Training','Blackglass','Epic',910,'assets/dragonbound/furniture/training-06.png',3,1,'Wide','Controlled resistance training with safety stops.',ARRAY['climbable','playable']::text[],46,true),
('training-7','Guild Agility Course','Training','Guildhall','Rare',975,'assets/dragonbound/furniture/training-07.png',2,1,'Wide','A modular obstacle set for confident dragons.',ARRAY['climbable','playable']::text[],47,true),
('toy-0','Treat Puzzle Chest','Toys','Playful Nursery','Crafted',610,'assets/dragonbound/furniture/toy-00.png',3,1,'Standard','Sliding panels hide small treats without sharp edges.',ARRAY['hideable','inspectable','playable']::text[],48,true),
('toy-1','Rope Tug Post','Toys','Cozy Cottage','Common',0,'assets/dragonbound/furniture/toy-01.png',2,1,'Standard','A replaceable rope toy fixed to a weighted base.',ARRAY['inspectable','playable']::text[],49,true),
('toy-2','Rolling Feed Ball','Toys','Playful Nursery','Common',740,'assets/dragonbound/furniture/toy-02.png',2,1,'Standard','Dispenses feed as it rolls across the floor.',ARRAY['inspectable','playable']::text[],50,true),
('toy-3','Chime Mobile','Toys','Elven Verdant','Rare',805,'assets/dragonbound/furniture/toy-03.png',3,1,'Standard','Soft chimes reward gentle nose and paw touches.',ARRAY['inspectable','playable']::text[],51,true),
('toy-4','Scent Trail Board','Toys','Care & Recovery','Crafted',870,'assets/dragonbound/furniture/toy-04.png',2,1,'Standard','Reusable scent cups encourage calm exploration.',ARRAY['inspectable','playable']::text[],52,true),
('toy-5','Burrow Blanket','Toys','Cozy Cottage','Common',935,'assets/dragonbound/furniture/toy-05.png',2,1,'Standard','Layered blankets for digging, hiding and nesting.',ARRAY['inspectable','playable']::text[],53,true),
('toy-6','Treasure Sorter','Toys','Zafir','Rare',1000,'assets/dragonbound/furniture/toy-06.png',3,1,'Standard','Colour-and-shape puzzle with oversized pieces.',ARRAY['inspectable','playable']::text[],54,true),
('toy-7','Enrichment Activity Tree','Toys','Royal Velmora','Epic',1065,'assets/dragonbound/furniture/toy-07.png',2,1,'Standard','A premium multi-level play and puzzle station.',ARRAY['inspectable','playable']::text[],55,true),
('health-0','Padded Examination Table','Care','Starter Care','Common',700,'assets/dragonbound/furniture/health-00.png',3,1,'Standard','A stable padded surface with open access on both sides.',ARRAY['inspectable']::text[],56,true),
('health-1','Low Care Bench','Care','Starter Care','Common',765,'assets/dragonbound/furniture/health-01.png',2,1,'Standard','Low step-up care bench for young or recovering dragons.',ARRAY['comfortable','inspectable']::text[],57,true),
('health-2','Dragon Weighing Scale','Care','Starter Care','Crafted',830,'assets/dragonbound/furniture/health-02.png',2,1,'Standard','Wide platform with an easy-to-read brass dial.',ARRAY['inspectable']::text[],58,true),
('health-3','Balance Care Scale','Care','Starter Care','Rare',895,'assets/dragonbound/furniture/health-03.png',3,1,'Standard','Counterweight scale for precise health checks.',ARRAY['inspectable']::text[],59,true),
('health-4','Wall Medicine Cabinet','Care','Starter Care','Common',960,'assets/dragonbound/furniture/health-04.png',2,1,'Standard','Lockable shelves for tonics, wraps and salves.',ARRAY['hideable','inspectable']::text[],60,true),
('health-5','Tall Remedy Cabinet','Care','Care & Recovery','Crafted',1025,'assets/dragonbound/furniture/health-05.png',2,1,'Standard','Tall organised storage for a complete care room.',ARRAY['hideable','inspectable']::text[],61,true),
('health-6','Bandage Trolley','Care','Starter Care','Crafted',1090,'assets/dragonbound/furniture/health-06.png',3,1,'Standard','Mobile wraps and dressing station with locking wheels.',ARRAY['inspectable']::text[],62,true),
('health-7','Healer’s Supply Cart','Care','Care & Recovery','Rare',1155,'assets/dragonbound/furniture/health-07.png',2,1,'Standard','A larger supply cart for long recovery sessions.',ARRAY['inspectable']::text[],63,true)
on conflict (item_id) do update set
  name=excluded.name,
  category=excluded.category,
  collection_name=excluded.collection_name,
  rarity=excluded.rarity,
  price=excluded.price,
  sprite_path=excluded.sprite_path,
  footprint_w=excluded.footprint_w,
  footprint_h=excluded.footprint_h,
  clearance=excluded.clearance,
  description=excluded.description,
  tags=excluded.tags,
  sort_order=excluded.sort_order,
  available=excluded.available,
  updated_at=now();

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
      'x',f.x,'y',f.y,'rotation',f.rotation,'direction',f.direction
    ) order by f.placed_at) from public.dragonbound_house_furniture f where f.user_id=v_uid and f.house_id=p_house_id),'[]'::jsonb) end
  );
end;
$$;

create or replace function public.dragonbound_purchase_furniture(p_item_id text)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid:=auth.uid();
  v_item public.dragonbound_furniture_catalog%rowtype;
  v_balance bigint;
  v_owned integer:=0;
  v_available integer:=0;
begin
  if v_uid is null then raise exception 'You must be signed in to shop.'; end if;
  select * into v_item from public.dragonbound_furniture_catalog where item_id=p_item_id and available for share;
  if not found then raise exception 'That furniture item is not available.'; end if;
  insert into public.dragonbound_wallets(user_id,keeper_marks,updated_at) values(v_uid,0,now()) on conflict(user_id) do nothing;
  select keeper_marks into v_balance from public.dragonbound_wallets where user_id=v_uid for update;
  select owned_quantity,available_quantity into v_owned,v_available from public.dragonbound_furniture_inventory where user_id=v_uid and item_id=p_item_id for update;
  v_owned:=coalesce(v_owned,0); v_available:=coalesce(v_available,0);
  if v_item.price=0 and v_owned>=1 then
    return jsonb_build_object('itemId',p_item_id,'owned',v_owned,'available',v_available,'balance',v_balance,'alreadyClaimed',true);
  end if;
  if v_balance < v_item.price then raise exception 'Not enough Keeper Marks.'; end if;
  if v_item.price>0 then
    update public.dragonbound_wallets set keeper_marks=keeper_marks-v_item.price,updated_at=now() where user_id=v_uid returning keeper_marks into v_balance;
  end if;
  insert into public.dragonbound_furniture_inventory(user_id,item_id,owned_quantity,available_quantity,acquired_at,updated_at)
  values(v_uid,p_item_id,1,1,now(),now())
  on conflict(user_id,item_id) do update set owned_quantity=public.dragonbound_furniture_inventory.owned_quantity+1,available_quantity=public.dragonbound_furniture_inventory.available_quantity+1,updated_at=now()
  returning owned_quantity,available_quantity into v_owned,v_available;
  return jsonb_build_object('itemId',p_item_id,'owned',v_owned,'available',v_available,'balance',v_balance,'alreadyClaimed',false);
end;
$$;

create or replace function public.dragonbound_place_furniture(p_item_id text,p_house_id text,p_room_id text,p_x numeric,p_y numeric,p_rotation smallint default 0,p_direction text default 'right')
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
begin
  if v_uid is null then raise exception 'You must be signed in to build.'; end if;
  if p_room_id not in ('downstairs','upstairs') then raise exception 'Invalid Dragonbound room.'; end if;
  if p_x<0 or p_x>1 or p_y<0 or p_y>1 then raise exception 'Invalid furniture position.'; end if;
  if p_rotation not in (0,90,180,270) then raise exception 'Invalid furniture rotation.'; end if;
  if p_direction not in ('left','right') then raise exception 'Invalid furniture direction.'; end if;
  select c.username into v_username from public.characters c where c.user_id=v_uid limit 1;
  v_admin:=lower(coalesce(v_username,''))='admin';
  select p.starter_house_id into v_home from public.dragonbound_profiles p where p.user_id=v_uid;
  if not v_admin and (v_home is null or p_house_id is distinct from v_home) then raise exception 'You can only build in your current Dragonbound home.'; end if;
  perform 1 from public.dragonbound_furniture_catalog where item_id=p_item_id and available;
  if not found then raise exception 'Furniture item not found.'; end if;
  select available_quantity into v_available from public.dragonbound_furniture_inventory where user_id=v_uid and item_id=p_item_id for update;
  if coalesce(v_available,0)<1 then raise exception 'No available copy of that furniture item.'; end if;
  update public.dragonbound_furniture_inventory set available_quantity=available_quantity-1,updated_at=now() where user_id=v_uid and item_id=p_item_id;
  insert into public.dragonbound_house_furniture(user_id,house_id,room_id,item_id,x,y,rotation,direction,placed_at,updated_at)
  values(v_uid,p_house_id,p_room_id,p_item_id,p_x,p_y,p_rotation,p_direction,now(),now()) returning placement_id into v_id;
  return jsonb_build_object('placementId',v_id,'itemId',p_item_id,'houseId',p_house_id,'roomId',p_room_id,'x',p_x,'y',p_y,'rotation',p_rotation,'direction',p_direction);
end;
$$;

create or replace function public.dragonbound_move_furniture(p_placement_id uuid,p_room_id text,p_x numeric,p_y numeric,p_rotation smallint default 0,p_direction text default 'right')
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid:=auth.uid();
  v_row public.dragonbound_house_furniture%rowtype;
begin
  if v_uid is null then raise exception 'You must be signed in to build.'; end if;
  if p_room_id not in ('downstairs','upstairs') or p_x<0 or p_x>1 or p_y<0 or p_y>1 or p_rotation not in (0,90,180,270) or p_direction not in ('left','right') then raise exception 'Invalid furniture placement.'; end if;
  select * into v_row from public.dragonbound_house_furniture where placement_id=p_placement_id and user_id=v_uid for update;
  if not found then raise exception 'Furniture placement not found.'; end if;
  update public.dragonbound_house_furniture set room_id=p_room_id,x=p_x,y=p_y,rotation=p_rotation,direction=p_direction,updated_at=now() where placement_id=p_placement_id and user_id=v_uid;
  return jsonb_build_object('placementId',p_placement_id,'itemId',v_row.item_id,'houseId',v_row.house_id,'roomId',p_room_id,'x',p_x,'y',p_y,'rotation',p_rotation,'direction',p_direction);
end;
$$;

create or replace function public.dragonbound_store_furniture(p_placement_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_uid uuid:=auth.uid();
  v_row public.dragonbound_house_furniture%rowtype;
  v_available integer;
begin
  if v_uid is null then raise exception 'You must be signed in to build.'; end if;
  delete from public.dragonbound_house_furniture where placement_id=p_placement_id and user_id=v_uid returning * into v_row;
  if not found then raise exception 'Furniture placement not found.'; end if;
  update public.dragonbound_furniture_inventory set available_quantity=least(owned_quantity,available_quantity+1),updated_at=now() where user_id=v_uid and item_id=v_row.item_id returning available_quantity into v_available;
  return jsonb_build_object('placementId',p_placement_id,'itemId',v_row.item_id,'available',v_available);
end;
$$;

revoke execute on function public.dragonbound_get_furniture_state(text) from public,anon;
revoke execute on function public.dragonbound_purchase_furniture(text) from public,anon;
revoke execute on function public.dragonbound_place_furniture(text,text,text,numeric,numeric,smallint,text) from public,anon;
revoke execute on function public.dragonbound_move_furniture(uuid,text,numeric,numeric,smallint,text) from public,anon;
revoke execute on function public.dragonbound_store_furniture(uuid) from public,anon;
grant execute on function public.dragonbound_get_furniture_state(text) to authenticated;
grant execute on function public.dragonbound_purchase_furniture(text) to authenticated;
grant execute on function public.dragonbound_place_furniture(text,text,text,numeric,numeric,smallint,text) to authenticated;
grant execute on function public.dragonbound_move_furniture(uuid,text,numeric,numeric,smallint,text) to authenticated;
grant execute on function public.dragonbound_store_furniture(uuid) to authenticated;
