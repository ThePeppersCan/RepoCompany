-- Velmora Adventures Phase 1
-- Persistent, server-authoritative RPG foundations. No existing tables are altered.

create extension if not exists pgcrypto;

create table if not exists public.adventure_locations (
  id text primary key,
  name text not null,
  country text not null,
  region text not null,
  kind text not null default 'location',
  description text not null,
  connections text[] not null default '{}'::text[],
  travel_minutes integer not null default 15 check (travel_minutes between 1 and 240),
  map_x integer not null default 50,
  map_y integer not null default 50,
  is_starter boolean not null default false,
  scene_key text not null default 'plains',
  created_at timestamptz not null default now()
);

insert into public.adventure_locations(id,name,country,region,kind,description,connections,travel_minutes,map_x,map_y,is_starter,scene_key)
values
 ('canto_crossing','Canto Crossing','Elvane','Canto Plains','town','A busy little crossroads town where green lanes, couriers and market carts converge. The notice board beside the old clock is rarely empty.',array['willowmere','canto_plains_verge','riverglass_ford','animal_centre_gate'],10,47,48,true,'canto_town'),
 ('willowmere','Willowmere','Elvane','Canto Plains','settlement','A low riverside settlement of whitewashed cottages, herb gardens and a mill wheel that complains in every weather.',array['canto_crossing','riverglass_ford'],16,67,41,true,'willowmere'),
 ('canto_plains_verge','Canto Plains — East Verge','Elvane','Canto Plains','wilderness','Open meadow and old boundary stones stretch toward a line of wind-bent trees. Tracks are easier to notice here than people.',array['canto_crossing','animal_centre_gate'],18,36,28,true,'plains'),
 ('riverglass_ford','Riverglass Ford','Elvane','Canto Plains','river','A shallow crossing where the Riverglass widens over pale stone. Reeds chatter at the banks and small boats wait above the bend.',array['canto_crossing','willowmere','animal_centre_gate'],20,73,60,true,'river'),
 ('animal_centre_gate','Velmora Animal Centre — Canto Gate','Elvane','Canto Plains','facility','The field gate leading to the Canto branch of the Animal Centre. Keeper notices, feed crates and muddy boot prints crowd the entrance.',array['canto_crossing','canto_plains_verge','riverglass_ford'],14,30,66,true,'animal_centre')
on conflict (id) do update set
  name=excluded.name,country=excluded.country,region=excluded.region,kind=excluded.kind,
  description=excluded.description,connections=excluded.connections,travel_minutes=excluded.travel_minutes,
  map_x=excluded.map_x,map_y=excluded.map_y,is_starter=excluded.is_starter,scene_key=excluded.scene_key;

create table if not exists public.adventure_item_catalog (
  item_key text primary key,
  name text not null,
  category text not null,
  description text not null,
  value bigint not null default 0,
  rarity text not null default 'common',
  icon text not null default '•',
  tags jsonb not null default '[]'::jsonb,
  check_bonuses jsonb not null default '{}'::jsonb
);

insert into public.adventure_item_catalog(item_key,name,category,description,value,rarity,icon,tags,check_bonuses)
values
 ('traveller_rations','Traveller Rations','Food','Two wrapped portions of bread, fruit and hard cheese for the road.',8,'common','R','["food","travel"]','{}'),
 ('canvas_satchel','Canvas Satchel','Tools','A weathered shoulder bag with more pockets than it first appears to have.',18,'common','S','["container"]','{}'),
 ('worn_compass','Worn Compass','Tools','A scratched brass compass that still points true often enough to trust.',25,'common','⌖','["exploration"]','{"survival":1}'),
 ('field_notebook','Field Notebook','Books','A compact notebook for sketches, names, clues and bad ideas worth revisiting.',14,'common','≡','["investigation"]','{"intelligence":1}'),
 ('herb_knife','Herb Knife','Tools','A short folding knife intended for clean plant cuttings.',22,'common','†','["herbalism"]','{"survival":1}'),
 ('river_hook','River Hook','Tools','A simple Canto hook and line kept wrapped around a small wooden spool.',16,'common','∿','["fishing"]','{}'),
 ('route_wallet','Courier Route Wallet','Tools','A waxed map wallet stamped with the courier lanes of central Elvane.',20,'common','◇','["courier"]','{"perception":1}'),
 ('merchant_ledger','Pocket Ledger','Books','A tiny account book with several suspiciously optimistic profit columns.',20,'common','▤','["mercantile"]','{"intelligence":1}'),
 ('animal_feed_pouch','Animal Feed Pouch','Tools','A cloth pouch containing neutral feed suitable for cautious first approaches.',18,'common','⌑','["animal"]','{"survival":1}'),
 ('hand_pick','Miner''s Hand Pick','Tools','A compact iron pick for samples, loose stone and very small arguments with geology.',24,'common','⚒','["mining","ruins"]','{"strength":1}'),
 ('sealed_parcel','Sealed Parcel','Quest Items','A small parcel bound in green cord. The sender has written ONLY TO WILLOWMERE across the seal.',0,'quest','▣','["quest"]','{}'),
 ('odd_brass_token','Odd Brass Token','Quest Items','A thin brass token stamped with a tiny three-pronged mark. It does not resemble ordinary Elvane coinage.',0,'uncommon','◈','["quest","mystery"]','{}')
on conflict (item_key) do update set name=excluded.name,category=excluded.category,description=excluded.description,value=excluded.value,rarity=excluded.rarity,icon=excluded.icon,tags=excluded.tags,check_bonuses=excluded.check_bonuses;

create table if not exists public.adventure_quest_catalog (
  quest_key text primary key,
  title text not null,
  category text not null,
  difficulty text not null,
  description text not null,
  start_location_id text references public.adventure_locations(id),
  is_main_story boolean not null default false,
  repeatable boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.adventure_quest_catalog(quest_key,title,category,difficulty,description,start_location_id,is_main_story,repeatable)
values
 ('the_little_things_01','A Very Ordinary Parcel','MAIN STORY','EASY','A courier at Canto Crossing needs one sealed parcel taken to Willowmere. Nothing about that should be complicated.','canto_crossing',true,false)
on conflict (quest_key) do update set title=excluded.title,category=excluded.category,difficulty=excluded.difficulty,description=excluded.description,start_location_id=excluded.start_location_id,is_main_story=excluded.is_main_story,repeatable=excluded.repeatable;

create table if not exists public.adventure_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  homeland text not null,
  background text not null,
  archetype text not null,
  level integer not null default 1 check (level between 1 and 99),
  xp bigint not null default 0 check (xp >= 0),
  hp integer not null default 20,
  max_hp integer not null default 20,
  gold bigint not null default 100 check (gold >= 0),
  location_id text not null default 'canto_crossing' references public.adventure_locations(id),
  world_day integer not null default 1 check (world_day >= 1),
  world_minute integer not null default 480 check (world_minute between 0 and 1439),
  weather text not null default 'clear',
  play_seconds bigint not null default 0 check (play_seconds >= 0),
  current_main_quest text,
  last_summary text not null default 'Your adventure has only just begun.',
  last_activity_at timestamptz not null default now(),
  last_played_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.adventure_player_stats (
  character_id uuid primary key references public.adventure_characters(id) on delete cascade,
  strength integer not null default 2 check (strength between 0 and 20),
  agility integer not null default 2 check (agility between 0 and 20),
  endurance integer not null default 2 check (endurance between 0 and 20),
  perception integer not null default 2 check (perception between 0 and 20),
  intelligence integer not null default 2 check (intelligence between 0 and 20),
  charisma integer not null default 2 check (charisma between 0 and 20),
  survival integer not null default 2 check (survival between 0 and 20),
  arcana integer not null default 2 check (arcana between 0 and 20)
);

create table if not exists public.adventure_inventory (
  id bigserial primary key,
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  item_key text not null references public.adventure_item_catalog(item_key),
  quantity integer not null default 1 check (quantity > 0),
  durability integer,
  acquired_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique(character_id,item_key)
);

create table if not exists public.adventure_equipment (
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  slot text not null check (slot in ('weapon','off_hand','head','body','hands','feet','accessory','tool')),
  item_key text references public.adventure_item_catalog(item_key),
  equipped_at timestamptz not null default now(),
  primary key(character_id,slot)
);

create table if not exists public.adventure_professions (
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  profession_key text not null,
  xp bigint not null default 0 check (xp >= 0),
  level integer not null default 1 check (level between 1 and 99),
  primary key(character_id,profession_key)
);

create table if not exists public.adventure_quest_progress (
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  quest_key text not null references public.adventure_quest_catalog(quest_key),
  status text not null default 'available' check(status in ('available','active','completed','failed')),
  stage integer not null default 0,
  tracked boolean not null default false,
  progress jsonb not null default '{}'::jsonb,
  accepted_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(character_id,quest_key)
);

create table if not exists public.adventure_job_instances (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  board_date date not null,
  slot integer not null check (slot between 1 and 8),
  title text not null,
  description text not null,
  profession_key text not null,
  source_location_id text not null references public.adventure_locations(id),
  destination_location_id text not null references public.adventure_locations(id),
  difficulty text not null,
  reward_gold integer not null check (reward_gold between 0 and 100000),
  reward_adventure_xp integer not null check (reward_adventure_xp between 0 and 100000),
  reward_profession_xp integer not null check (reward_profession_xp between 0 and 100000),
  status text not null default 'available' check(status in ('available','active','completed','expired')),
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(character_id,board_date,slot)
);

create table if not exists public.adventure_discoveries (
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  discovery_type text not null,
  discovery_key text not null,
  name text not null,
  discovered_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  primary key(character_id,discovery_type,discovery_key)
);

create table if not exists public.adventure_world_state (
  character_id uuid primary key references public.adventure_characters(id) on delete cascade,
  flags jsonb not null default '{}'::jsonb,
  cooldowns jsonb not null default '{}'::jsonb,
  completed_events jsonb not null default '[]'::jsonb,
  generated_entities jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.adventure_action_history (
  id bigserial primary key,
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  action_type text not null,
  action_key text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.adventure_reward_ledger (
  id bigserial primary key,
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  source_type text not null,
  source_key text not null,
  adventure_xp integer not null default 0,
  gold integer not null default 0,
  profession_key text,
  profession_xp integer not null default 0,
  site_skill text,
  site_xp integer not null default 0,
  created_at timestamptz not null default now(),
  unique(character_id,source_type,source_key)
);

-- Foundations for later phases. These are intentionally lightweight in Phase 1.
create table if not exists public.adventure_npc_state (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  npc_key text not null,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(character_id,npc_key)
);
create table if not exists public.adventure_npc_memories (
  id bigserial primary key,
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  npc_key text not null,
  memory_key text not null,
  importance integer not null default 1 check(importance between 1 and 10),
  sentiment text not null default 'neutral',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(character_id,npc_key,memory_key)
);
create table if not exists public.adventure_relationships (
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  npc_key text not null,
  relationship integer not null default 0 check(relationship between -100 and 100),
  trust integer not null default 0 check(trust between -100 and 100),
  respect integer not null default 0 check(respect between -100 and 100),
  fear integer not null default 0 check(fear between -100 and 100),
  updated_at timestamptz not null default now(),
  primary key(character_id,npc_key)
);
create table if not exists public.adventure_world_events (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  event_key text not null,
  status text not null default 'scheduled',
  starts_world_day integer,
  ends_world_day integer,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.adventure_community_projects (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.adventure_characters(id) on delete cascade,
  project_key text not null,
  location_id text references public.adventure_locations(id),
  status text not null default 'available',
  progress jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  unique(character_id,project_key)
);

-- RLS: clients can read their own Adventure state. Writes are only through RPCs.
do $$
declare t text;
begin
  foreach t in array array[
    'adventure_characters','adventure_player_stats','adventure_inventory','adventure_equipment',
    'adventure_professions','adventure_quest_progress','adventure_job_instances','adventure_discoveries',
    'adventure_world_state','adventure_action_history','adventure_reward_ledger','adventure_npc_state',
    'adventure_npc_memories','adventure_relationships','adventure_world_events','adventure_community_projects'
  ] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

-- Catalogues are safe to read globally.
alter table public.adventure_locations enable row level security;
alter table public.adventure_item_catalog enable row level security;
alter table public.adventure_quest_catalog enable row level security;

drop policy if exists adventure_locations_read on public.adventure_locations;
create policy adventure_locations_read on public.adventure_locations for select using (true);
drop policy if exists adventure_items_read on public.adventure_item_catalog;
create policy adventure_items_read on public.adventure_item_catalog for select using (true);
drop policy if exists adventure_quests_read on public.adventure_quest_catalog;
create policy adventure_quests_read on public.adventure_quest_catalog for select using (true);

-- Own-row read policies.
drop policy if exists adventure_characters_read_own on public.adventure_characters;
create policy adventure_characters_read_own on public.adventure_characters for select using(user_id=auth.uid());

do $$
declare rec record;
begin
  for rec in
    select * from (values
      ('adventure_player_stats','character_id'),('adventure_inventory','character_id'),('adventure_equipment','character_id'),
      ('adventure_professions','character_id'),('adventure_quest_progress','character_id'),('adventure_job_instances','character_id'),
      ('adventure_discoveries','character_id'),('adventure_world_state','character_id'),('adventure_action_history','character_id'),
      ('adventure_reward_ledger','character_id'),('adventure_npc_state','character_id'),('adventure_npc_memories','character_id'),
      ('adventure_relationships','character_id'),('adventure_world_events','character_id'),('adventure_community_projects','character_id')
    ) as v(tbl,col)
  loop
    execute format('drop policy if exists %I on public.%I',rec.tbl||'_read_own',rec.tbl);
    execute format('create policy %I on public.%I for select using (exists(select 1 from public.adventure_characters ac where ac.id=%I and ac.user_id=auth.uid()))',rec.tbl||'_read_own',rec.tbl,rec.col);
  end loop;
end $$;

create or replace function public.adventure_xp_for_level(p_level integer)
returns bigint language plpgsql immutable as $$
declare pts numeric:=0; i integer;
begin
  if p_level<=1 then return 0; end if;
  for i in 1..least(p_level-1,98) loop
    pts:=pts+floor(i+300*power(2::numeric,i::numeric/7));
  end loop;
  return floor(pts/4)::bigint;
end $$;

create or replace function public.adventure_level_from_xp(p_xp bigint)
returns integer language plpgsql immutable as $$
declare l integer;
begin
  for l in 2..99 loop
    if greatest(0,coalesce(p_xp,0)) < public.adventure_xp_for_level(l) then return l-1; end if;
  end loop;
  return 99;
end $$;

create or replace function public.adventure_is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.characters c where c.user_id=auth.uid() and lower(c.username)='catasthma')
$$;

create or replace function public.adventure_touch_internal(p_character_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare c public.adventure_characters%rowtype; delta integer;
begin
  select * into c from public.adventure_characters where id=p_character_id for update;
  if c.id is null then return; end if;
  delta:=greatest(0,least(300,floor(extract(epoch from (now()-c.last_activity_at)))::integer));
  update public.adventure_characters set play_seconds=play_seconds+delta,last_activity_at=now(),last_played_at=now(),updated_at=now() where id=p_character_id;
end $$;

create or replace function public.adventure_weather_for(p_day integer,p_minute integer,p_user uuid)
returns text language plpgsql immutable as $$
declare bucket integer; seed integer;
begin
  bucket:=greatest(0,p_day)*4+floor(greatest(0,p_minute)/360.0)::integer;
  seed:=abs(hashtext(coalesce(p_user::text,'')||':'||bucket::text))%10;
  if seed<=4 then return 'clear'; elsif seed<=6 then return 'cloudy'; elsif seed<=8 then return 'rain'; else return 'mist'; end if;
end $$;

create or replace function public.adventure_add_inventory(p_character_id uuid,p_item_key text,p_quantity integer)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_quantity<=0 then return; end if;
  if not exists(select 1 from public.adventure_item_catalog where item_key=p_item_key) then raise exception 'Unknown item'; end if;
  insert into public.adventure_inventory(character_id,item_key,quantity)
  values(p_character_id,p_item_key,p_quantity)
  on conflict(character_id,item_key) do update set quantity=public.adventure_inventory.quantity+excluded.quantity;
end $$;

create or replace function public.adventure_remove_inventory(p_character_id uuid,p_item_key text,p_quantity integer)
returns void language plpgsql security definer set search_path=public as $$
declare q integer;
begin
  select quantity into q from public.adventure_inventory where character_id=p_character_id and item_key=p_item_key for update;
  if coalesce(q,0)<p_quantity then raise exception 'Required item is missing'; end if;
  if q=p_quantity then delete from public.adventure_inventory where character_id=p_character_id and item_key=p_item_key;
  else update public.adventure_inventory set quantity=quantity-p_quantity where character_id=p_character_id and item_key=p_item_key; end if;
end $$;

create or replace function public.adventure_grant_reward(
  p_character_id uuid,p_source_type text,p_source_key text,p_adventure_xp integer,p_gold integer,
  p_profession_key text default null,p_profession_xp integer default 0
)
returns boolean language plpgsql security definer set search_path=public as $$
declare inserted boolean:=false; newxp bigint;
begin
  if p_adventure_xp<0 or p_gold<0 or p_profession_xp<0 then raise exception 'Invalid reward'; end if;
  if p_adventure_xp>100000 or p_gold>100000 or p_profession_xp>100000 then raise exception 'Reward exceeds server limit'; end if;
  begin
    insert into public.adventure_reward_ledger(character_id,source_type,source_key,adventure_xp,gold,profession_key,profession_xp)
    values(p_character_id,p_source_type,p_source_key,p_adventure_xp,p_gold,p_profession_key,p_profession_xp);
    inserted:=true;
  exception when unique_violation then return false; end;
  update public.adventure_characters set xp=xp+p_adventure_xp,gold=gold+p_gold,updated_at=now() where id=p_character_id returning xp into newxp;
  update public.adventure_characters set level=public.adventure_level_from_xp(newxp) where id=p_character_id;
  if p_profession_key is not null and p_profession_xp>0 then
    insert into public.adventure_professions as ap(character_id,profession_key,xp,level)
    values(p_character_id,p_profession_key,p_profession_xp,public.adventure_level_from_xp(p_profession_xp))
    on conflict(character_id,profession_key) do update set xp=ap.xp+excluded.xp,
      level=public.adventure_level_from_xp(ap.xp+excluded.xp);
  end if;
  return inserted;
end $$;

create or replace function public.adventure_ensure_daily_jobs(p_character_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare d date:=current_date;
begin
  update public.adventure_job_instances set status='expired' where character_id=p_character_id and board_date<d and status in ('available','active');
  insert into public.adventure_job_instances(character_id,board_date,slot,title,description,profession_key,source_location_id,destination_location_id,difficulty,reward_gold,reward_adventure_xp,reward_profession_xp)
  values
   (p_character_id,d,1,'Willowmere Post Run','Carry the green courier wallet to Willowmere before the evening carts arrive.','courier','canto_crossing','willowmere','EASY',55,65,55),
   (p_character_id,d,2,'Riverglass Survey','Reach Riverglass Ford and record the condition of the crossing stones.','exploration','canto_crossing','riverglass_ford','EASY',65,75,65),
   (p_character_id,d,3,'Animal Centre Supplies','Take a small delivery manifest to the Animal Centre gate.','courier','canto_crossing','animal_centre_gate','STANDARD',75,85,70)
  on conflict(character_id,board_date,slot) do nothing;
end $$;

create or replace function public.adventure_get_state()
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); ac public.adventure_characters%rowtype; uname text; payload jsonb;
begin
  if uid is null then raise exception 'You must be logged in'; end if;
  select username into uname from public.characters where user_id=uid limit 1;
  select * into ac from public.adventure_characters where user_id=uid limit 1;
  if ac.id is null then
    return jsonb_build_object('exists',false,'account_username',coalesce(uname,''),'admin',public.adventure_is_admin());
  end if;
  perform public.adventure_touch_internal(ac.id);
  select * into ac from public.adventure_characters where id=ac.id;
  perform public.adventure_ensure_daily_jobs(ac.id);

  select jsonb_build_object(
    'exists',true,
    'account_username',coalesce(uname,''),
    'admin',public.adventure_is_admin(),
    'adventure',to_jsonb(ac),
    'stats',coalesce((select to_jsonb(s)-'character_id' from public.adventure_player_stats s where s.character_id=ac.id),'{}'::jsonb),
    'location',coalesce((select to_jsonb(l) from public.adventure_locations l where l.id=ac.location_id),'{}'::jsonb),
    'map_locations',coalesce((select jsonb_agg(jsonb_build_object(
      'id',l.id,'name',case when d.discovery_key is null then '???' else l.name end,'real_name',l.name,
      'country',l.country,'region',l.region,'kind',l.kind,'description',case when d.discovery_key is null then '' else l.description end,
      'map_x',l.map_x,'map_y',l.map_y,'discovered',(d.discovery_key is not null),'connected',(l.id=any(coalesce((select connections from public.adventure_locations where id=ac.location_id),'{}'::text[])))
    ) order by l.name) from public.adventure_locations l left join public.adventure_discoveries d on d.character_id=ac.id and d.discovery_type='location' and d.discovery_key=l.id),'[]'::jsonb),
    'inventory',coalesce((select jsonb_agg(jsonb_build_object('item_key',i.item_key,'quantity',i.quantity,'durability',i.durability,'metadata',i.metadata,'name',cat.name,'category',cat.category,'description',cat.description,'value',cat.value,'rarity',cat.rarity,'icon',cat.icon,'tags',cat.tags,'check_bonuses',cat.check_bonuses) order by cat.category,cat.name) from public.adventure_inventory i join public.adventure_item_catalog cat using(item_key) where i.character_id=ac.id),'[]'::jsonb),
    'equipment',coalesce((select jsonb_agg(to_jsonb(e) order by e.slot) from public.adventure_equipment e where e.character_id=ac.id),'[]'::jsonb),
    'professions',coalesce((select jsonb_agg(to_jsonb(p)-'character_id' order by p.profession_key) from public.adventure_professions p where p.character_id=ac.id),'[]'::jsonb),
    'quests',coalesce((select jsonb_agg(jsonb_build_object('quest_key',q.quest_key,'title',c.title,'category',c.category,'difficulty',c.difficulty,'description',c.description,'status',q.status,'stage',q.stage,'tracked',q.tracked,'progress',q.progress,'accepted_at',q.accepted_at,'completed_at',q.completed_at,'start_location_id',c.start_location_id,'is_main_story',c.is_main_story) order by c.is_main_story desc,c.title) from public.adventure_quest_progress q join public.adventure_quest_catalog c using(quest_key) where q.character_id=ac.id),'[]'::jsonb),
    'jobs',coalesce((select jsonb_agg(jsonb_build_object('id',j.id,'title',j.title,'description',j.description,'profession_key',j.profession_key,'source_location_id',j.source_location_id,'destination_location_id',j.destination_location_id,'destination_name',l.name,'difficulty',j.difficulty,'reward_gold',j.reward_gold,'reward_adventure_xp',j.reward_adventure_xp,'reward_profession_xp',j.reward_profession_xp,'status',j.status,'accepted_at',j.accepted_at,'completed_at',j.completed_at) order by j.slot) from public.adventure_job_instances j join public.adventure_locations l on l.id=j.destination_location_id where j.character_id=ac.id and j.board_date=current_date),'[]'::jsonb),
    'discoveries',coalesce((select jsonb_agg(to_jsonb(d)-'character_id' order by d.discovered_at desc) from public.adventure_discoveries d where d.character_id=ac.id),'[]'::jsonb),
    'recent_actions',coalesce((select jsonb_agg(x.obj order by x.id desc) from (select h.id,to_jsonb(h)-'character_id' as obj from public.adventure_action_history h where h.character_id=ac.id order by h.id desc limit 8) x),'[]'::jsonb)
  ) into payload;
  return payload;
end $$;

create or replace function public.adventure_create_character(p_name text,p_homeland text,p_background text,p_archetype text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); cid uuid; s jsonb; starter text; tool text; hstat text;
  homelands text[]:=array['Vardesh','Lumerre','Kordesh','Nambara','Norveth','Zafran','Elvane','Qasmir','Calvora','Rovarn','Talune','Drazhen','Belros','Marovar','Sorevia','Iskandar'];
  backgrounds text[]:=array['Apprentice Explorer','Animal Keeper','Travelling Merchant','Fisher','Cook','Hunter','Scholar','Courier','Street Rogue','Craftsman','Investigator','Ruin Hunter','Former Repo Sports Prospect','Farmhand','Sailor','Miner','Herbalist','Nobody Particularly Important'];
  archetypes text[]:=array['Warrior','Ranger','Rogue','Mage','Alchemist','Bard','Guardian','Beastkeeper','Investigator'];
begin
  if uid is null then raise exception 'You must be logged in'; end if;
  if exists(select 1 from public.adventure_characters where user_id=uid) then raise exception 'An Adventure already exists'; end if;
  p_name:=btrim(regexp_replace(coalesce(p_name,''),'\s+',' ','g'));
  if char_length(p_name)<2 or char_length(p_name)>24 or p_name !~ '^[A-Za-z0-9 ''-]+$' then raise exception 'Use a 2–24 character adventurer name'; end if;
  if not p_homeland=any(homelands) then raise exception 'Unknown homeland'; end if;
  if not p_background=any(backgrounds) then raise exception 'Unknown background'; end if;
  if not p_archetype=any(archetypes) then raise exception 'Unknown archetype'; end if;

  insert into public.adventure_characters(user_id,name,homeland,background,archetype,gold,location_id,last_summary)
  values(uid,p_name,p_homeland,p_background,p_archetype,100,'canto_crossing','You arrived in Canto Crossing with a small satchel, a little gold and no particular reason to hurry.') returning id into cid;

  s:=jsonb_build_object('strength',2,'agility',2,'endurance',2,'perception',2,'intelligence',2,'charisma',2,'survival',2,'arcana',2);
  -- Equal-value homeland flavour bonus: +1 to one stat.
  hstat:=case p_homeland when 'Vardesh' then 'endurance' when 'Lumerre' then 'charisma' when 'Kordesh' then 'strength' when 'Nambara' then 'survival' when 'Norveth' then 'perception' when 'Zafran' then 'intelligence' when 'Elvane' then 'survival' when 'Qasmir' then 'arcana' when 'Calvora' then 'agility' when 'Rovarn' then 'perception' when 'Talune' then 'charisma' when 'Drazhen' then 'endurance' when 'Belros' then 'strength' when 'Marovar' then 'intelligence' when 'Sorevia' then 'agility' else 'arcana' end;
  s:=jsonb_set(s,array[hstat],to_jsonb((s->>hstat)::integer+1),true);

  -- Background: two small +1 bonuses and one practical starter item.
  if p_background in ('Animal Keeper','Hunter','Farmhand','Herbalist') then s:=jsonb_set(s,'{survival}',to_jsonb((s->>'survival')::int+1)); end if;
  if p_background in ('Scholar','Investigator','Ruin Hunter') then s:=jsonb_set(s,'{intelligence}',to_jsonb((s->>'intelligence')::int+1)); end if;
  if p_background in ('Courier','Sailor','Former Repo Sports Prospect') then s:=jsonb_set(s,'{agility}',to_jsonb((s->>'agility')::int+1)); end if;
  if p_background in ('Street Rogue','Travelling Merchant','Cook') then s:=jsonb_set(s,'{charisma}',to_jsonb((s->>'charisma')::int+1)); end if;
  if p_background in ('Craftsman','Miner') then s:=jsonb_set(s,'{strength}',to_jsonb((s->>'strength')::int+1)); end if;
  if p_background in ('Apprentice Explorer','Nobody Particularly Important','Fisher') then s:=jsonb_set(s,'{perception}',to_jsonb((s->>'perception')::int+1)); end if;
  -- second point keeps every background equal value
  if p_background in ('Animal Keeper','Fisher','Hunter','Ruin Hunter','Sailor','Miner','Herbalist','Apprentice Explorer') then s:=jsonb_set(s,'{perception}',to_jsonb((s->>'perception')::int+1)); else s:=jsonb_set(s,'{endurance}',to_jsonb((s->>'endurance')::int+1)); end if;

  -- Archetype: +2 primary and +1 secondary, same total for all choices.
  if p_archetype='Warrior' then s:=jsonb_set(jsonb_set(s,'{strength}',to_jsonb((s->>'strength')::int+2)),'{endurance}',to_jsonb((s->>'endurance')::int+1));
  elsif p_archetype='Ranger' then s:=jsonb_set(jsonb_set(s,'{perception}',to_jsonb((s->>'perception')::int+2)),'{survival}',to_jsonb((s->>'survival')::int+1));
  elsif p_archetype='Rogue' then s:=jsonb_set(jsonb_set(s,'{agility}',to_jsonb((s->>'agility')::int+2)),'{perception}',to_jsonb((s->>'perception')::int+1));
  elsif p_archetype='Mage' then s:=jsonb_set(jsonb_set(s,'{arcana}',to_jsonb((s->>'arcana')::int+2)),'{intelligence}',to_jsonb((s->>'intelligence')::int+1));
  elsif p_archetype='Alchemist' then s:=jsonb_set(jsonb_set(s,'{intelligence}',to_jsonb((s->>'intelligence')::int+2)),'{survival}',to_jsonb((s->>'survival')::int+1));
  elsif p_archetype='Bard' then s:=jsonb_set(jsonb_set(s,'{charisma}',to_jsonb((s->>'charisma')::int+2)),'{agility}',to_jsonb((s->>'agility')::int+1));
  elsif p_archetype='Guardian' then s:=jsonb_set(jsonb_set(s,'{endurance}',to_jsonb((s->>'endurance')::int+2)),'{strength}',to_jsonb((s->>'strength')::int+1));
  elsif p_archetype='Beastkeeper' then s:=jsonb_set(jsonb_set(s,'{survival}',to_jsonb((s->>'survival')::int+2)),'{charisma}',to_jsonb((s->>'charisma')::int+1));
  else s:=jsonb_set(jsonb_set(s,'{perception}',to_jsonb((s->>'perception')::int+2)),'{intelligence}',to_jsonb((s->>'intelligence')::int+1)); end if;

  insert into public.adventure_player_stats(character_id,strength,agility,endurance,perception,intelligence,charisma,survival,arcana)
  values(cid,(s->>'strength')::int,(s->>'agility')::int,(s->>'endurance')::int,(s->>'perception')::int,(s->>'intelligence')::int,(s->>'charisma')::int,(s->>'survival')::int,(s->>'arcana')::int);
  update public.adventure_characters set max_hp=18+((s->>'endurance')::int*2),hp=18+((s->>'endurance')::int*2) where id=cid;

  perform public.adventure_add_inventory(cid,'traveller_rations',2);
  perform public.adventure_add_inventory(cid,'canvas_satchel',1);
  starter:=case p_background when 'Animal Keeper' then 'animal_feed_pouch' when 'Travelling Merchant' then 'merchant_ledger' when 'Fisher' then 'river_hook' when 'Scholar' then 'field_notebook' when 'Courier' then 'route_wallet' when 'Investigator' then 'field_notebook' when 'Ruin Hunter' then 'worn_compass' when 'Miner' then 'hand_pick' when 'Herbalist' then 'herb_knife' else 'worn_compass' end;
  perform public.adventure_add_inventory(cid,starter,1);
  tool:=starter;
  insert into public.adventure_equipment(character_id,slot,item_key) values(cid,'tool',tool) on conflict(character_id,slot) do update set item_key=excluded.item_key,equipped_at=now();

  insert into public.adventure_professions(character_id,profession_key) select cid,x from unnest(array['courier','herbalism','investigation','exploration','animal_handling','mercantile','survival','crafting']) x;
  insert into public.adventure_quest_progress(character_id,quest_key,status,stage) values(cid,'the_little_things_01','available',0);
  insert into public.adventure_world_state(character_id) values(cid);
  insert into public.adventure_discoveries(character_id,discovery_type,discovery_key,name) select cid,'location',l.id,l.name from public.adventure_locations l where l.is_starter;
  insert into public.adventure_action_history(character_id,action_type,action_key,details) values(cid,'character_created','begin',jsonb_build_object('homeland',p_homeland,'background',p_background,'archetype',p_archetype));
  perform public.adventure_ensure_daily_jobs(cid);
  return public.adventure_get_state();
end $$;

create or replace function public.adventure_travel(p_location_id text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); ac public.adventure_characters%rowtype; src public.adventure_locations%rowtype; dst public.adventure_locations%rowtype; mins integer; total integer; nd integer; nm integer;
begin
  if uid is null then raise exception 'You must be logged in'; end if;
  select * into ac from public.adventure_characters where user_id=uid for update;
  if ac.id is null then raise exception 'Create an Adventure first'; end if;
  if p_location_id=ac.location_id then return public.adventure_get_state(); end if;
  select * into src from public.adventure_locations where id=ac.location_id;
  select * into dst from public.adventure_locations where id=p_location_id;
  if dst.id is null then raise exception 'Unknown location'; end if;
  if not p_location_id=any(coalesce(src.connections,'{}'::text[])) then raise exception 'That location is not directly reachable from here'; end if;
  mins:=greatest(5,dst.travel_minutes);
  total:=ac.world_minute+mins; nd:=ac.world_day+floor(total/1440.0)::integer; nm:=total%1440;
  perform public.adventure_touch_internal(ac.id);
  update public.adventure_characters set location_id=dst.id,world_day=nd,world_minute=nm,weather=public.adventure_weather_for(nd,nm,uid),last_summary='You travelled from '||src.name||' to '||dst.name||'.',last_played_at=now(),updated_at=now() where id=ac.id;
  insert into public.adventure_discoveries(character_id,discovery_type,discovery_key,name) values(ac.id,'location',dst.id,dst.name) on conflict do nothing;
  insert into public.adventure_action_history(character_id,action_type,action_key,details) values(ac.id,'travel',dst.id,jsonb_build_object('from',src.id,'to',dst.id,'minutes',mins));
  return public.adventure_get_state();
end $$;

create or replace function public.adventure_roll_check(p_stat text,p_dc integer,p_context text default '')
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); ac public.adventure_characters%rowtype; st public.adventure_player_stats%rowtype; modifier integer; roll integer; total integer; degree text;
begin
  if uid is null then raise exception 'You must be logged in'; end if;
  if p_stat not in ('strength','agility','endurance','perception','intelligence','charisma','survival','arcana') then raise exception 'Unknown stat'; end if;
  if p_dc<5 or p_dc>30 then raise exception 'DC outside supported range'; end if;
  select * into ac from public.adventure_characters where user_id=uid;
  if ac.id is null then raise exception 'Create an Adventure first'; end if;
  select * into st from public.adventure_player_stats where character_id=ac.id;
  modifier:=case p_stat when 'strength' then st.strength when 'agility' then st.agility when 'endurance' then st.endurance when 'perception' then st.perception when 'intelligence' then st.intelligence when 'charisma' then st.charisma when 'survival' then st.survival else st.arcana end;
  roll:=floor(random()*20+1)::integer; total:=roll+modifier;
  if roll=20 or total>=p_dc+10 then degree:='critical_success'; elsif total>=p_dc then degree:='success'; elsif roll=1 or total<=p_dc-10 then degree:='critical_failure'; else degree:='failure'; end if;
  perform public.adventure_touch_internal(ac.id);
  insert into public.adventure_action_history(character_id,action_type,action_key,details) values(ac.id,'check',p_stat,jsonb_build_object('roll',roll,'modifier',modifier,'total',total,'dc',p_dc,'degree',degree,'context',left(coalesce(p_context,''),120)));
  return jsonb_build_object('stat',p_stat,'roll',roll,'modifier',modifier,'total',total,'dc',p_dc,'degree',degree);
end $$;

create or replace function public.adventure_accept_quest(p_quest_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); ac public.adventure_characters%rowtype; q public.adventure_quest_progress%rowtype; cat public.adventure_quest_catalog%rowtype;
begin
  if uid is null then raise exception 'You must be logged in'; end if;
  select * into ac from public.adventure_characters where user_id=uid for update;
  if ac.id is null then raise exception 'Create an Adventure first'; end if;
  select * into cat from public.adventure_quest_catalog where quest_key=p_quest_key;
  select * into q from public.adventure_quest_progress where character_id=ac.id and quest_key=p_quest_key for update;
  if cat.quest_key is null or q.quest_key is null then raise exception 'Unknown quest'; end if;
  if q.status='completed' and not cat.repeatable then raise exception 'Quest already completed'; end if;
  if ac.location_id<>cat.start_location_id then raise exception 'Travel to the quest start location first'; end if;
  if p_quest_key='the_little_things_01' then
    perform public.adventure_add_inventory(ac.id,'sealed_parcel',1);
    update public.adventure_quest_progress set status='active',stage=1,tracked=true,accepted_at=now(),updated_at=now(),progress=jsonb_build_object('objective','Deliver the sealed parcel to Willowmere.') where character_id=ac.id and quest_key=p_quest_key;
    update public.adventure_characters set current_main_quest=p_quest_key,last_summary='You accepted a very ordinary parcel delivery from the Canto Crossing notice board.',updated_at=now() where id=ac.id;
  else raise exception 'Quest is not available in this phase'; end if;
  insert into public.adventure_action_history(character_id,action_type,action_key) values(ac.id,'quest_accept',p_quest_key);
  return public.adventure_get_state();
end $$;

create or replace function public.adventure_quest_action(p_quest_key text,p_action text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); ac public.adventure_characters%rowtype; q public.adventure_quest_progress%rowtype; granted boolean;
begin
  if uid is null then raise exception 'You must be logged in'; end if;
  select * into ac from public.adventure_characters where user_id=uid for update;
  if ac.id is null then raise exception 'Create an Adventure first'; end if;
  select * into q from public.adventure_quest_progress where character_id=ac.id and quest_key=p_quest_key for update;
  if q.status<>'active' then raise exception 'Quest is not active'; end if;
  if p_quest_key='the_little_things_01' and p_action='deliver' then
    if q.stage<>1 then raise exception 'This objective is already resolved'; end if;
    if ac.location_id<>'willowmere' then raise exception 'The parcel belongs in Willowmere'; end if;
    perform public.adventure_remove_inventory(ac.id,'sealed_parcel',1);
    perform public.adventure_add_inventory(ac.id,'odd_brass_token',1);
    granted:=public.adventure_grant_reward(ac.id,'quest',p_quest_key,120,75,'courier',90);
    if not granted then raise exception 'Quest reward already claimed'; end if;
    update public.adventure_quest_progress set status='completed',stage=2,tracked=false,completed_at=now(),updated_at=now(),progress=jsonb_build_object('outcome','The recipient found an odd brass token under the parcel string and insisted it was not theirs.') where character_id=ac.id and quest_key=p_quest_key;
    update public.adventure_characters set current_main_quest=null,last_summary='The parcel reached Willowmere. Hidden under its cord was an unfamiliar brass token marked with three tiny prongs.',updated_at=now() where id=ac.id;
    insert into public.adventure_discoveries(character_id,discovery_type,discovery_key,name,metadata) values(ac.id,'secret','three_prong_token','Three-pronged brass token',jsonb_build_object('source',p_quest_key)) on conflict do nothing;
    insert into public.adventure_action_history(character_id,action_type,action_key,details) values(ac.id,'quest_complete',p_quest_key,jsonb_build_object('reward_xp',120,'reward_gold',75,'courier_xp',90));
  else raise exception 'That quest action is not valid'; end if;
  return public.adventure_get_state();
end $$;

create or replace function public.adventure_accept_job(p_job_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); ac public.adventure_characters%rowtype; j public.adventure_job_instances%rowtype;
begin
  if uid is null then raise exception 'You must be logged in'; end if;
  select * into ac from public.adventure_characters where user_id=uid for update;
  if ac.id is null then raise exception 'Create an Adventure first'; end if;
  perform public.adventure_ensure_daily_jobs(ac.id);
  select * into j from public.adventure_job_instances where id=p_job_id and character_id=ac.id for update;
  if j.id is null or j.board_date<>current_date then raise exception 'Job is no longer available'; end if;
  if j.status<>'available' then raise exception 'Job cannot be accepted'; end if;
  if ac.location_id<>j.source_location_id then raise exception 'You must be at the issuing job board'; end if;
  update public.adventure_job_instances set status='active',accepted_at=now() where id=j.id;
  update public.adventure_characters set last_summary='You accepted the contract: '||j.title||'.',updated_at=now() where id=ac.id;
  insert into public.adventure_action_history(character_id,action_type,action_key,details) values(ac.id,'job_accept',j.id::text,jsonb_build_object('title',j.title,'destination',j.destination_location_id));
  return public.adventure_get_state();
end $$;

create or replace function public.adventure_complete_job(p_job_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); ac public.adventure_characters%rowtype; j public.adventure_job_instances%rowtype; granted boolean;
begin
  if uid is null then raise exception 'You must be logged in'; end if;
  select * into ac from public.adventure_characters where user_id=uid for update;
  if ac.id is null then raise exception 'Create an Adventure first'; end if;
  select * into j from public.adventure_job_instances where id=p_job_id and character_id=ac.id for update;
  if j.id is null then raise exception 'Unknown job'; end if;
  if j.status<>'active' then raise exception 'Job is not active'; end if;
  if ac.location_id<>j.destination_location_id then raise exception 'You have not reached the contract destination'; end if;
  granted:=public.adventure_grant_reward(ac.id,'job',j.id::text,j.reward_adventure_xp,j.reward_gold,j.profession_key,j.reward_profession_xp);
  if not granted then raise exception 'Job reward already claimed'; end if;
  update public.adventure_job_instances set status='completed',completed_at=now() where id=j.id;
  update public.adventure_characters set last_summary='You completed '||j.title||' and were paid '||j.reward_gold||' gold.',updated_at=now() where id=ac.id;
  insert into public.adventure_action_history(character_id,action_type,action_key,details) values(ac.id,'job_complete',j.id::text,jsonb_build_object('title',j.title,'reward_gold',j.reward_gold,'reward_xp',j.reward_adventure_xp,'profession',j.profession_key,'profession_xp',j.reward_profession_xp));
  return public.adventure_get_state();
end $$;

create or replace function public.adventure_touch()
returns jsonb language plpgsql security definer set search_path=public as $$
declare ac public.adventure_characters%rowtype;
begin
  if auth.uid() is null then raise exception 'You must be logged in'; end if;
  select * into ac from public.adventure_characters where user_id=auth.uid();
  if ac.id is null then return public.adventure_get_state(); end if;
  perform public.adventure_touch_internal(ac.id);
  return public.adventure_get_state();
end $$;

create or replace function public.adventure_reset_character()
returns jsonb language plpgsql security definer set search_path=public as $$
declare ac public.adventure_characters%rowtype;
begin
  if auth.uid() is null then raise exception 'You must be logged in'; end if;
  select * into ac from public.adventure_characters where user_id=auth.uid() for update;
  if ac.id is not null then delete from public.adventure_characters where id=ac.id; end if;
  return jsonb_build_object('exists',false,'account_username',coalesce((select username from public.characters where user_id=auth.uid() limit 1),''),'admin',public.adventure_is_admin());
end $$;

create or replace function public.adventure_admin_patch_self(p_patch jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare ac public.adventure_characters%rowtype; loc text;
begin
  if not public.adventure_is_admin() then raise exception 'Admin only'; end if;
  select * into ac from public.adventure_characters where user_id=auth.uid() for update;
  if ac.id is null then raise exception 'Create an Adventure first'; end if;
  loc:=coalesce(nullif(p_patch->>'location_id',''),ac.location_id);
  if not exists(select 1 from public.adventure_locations where id=loc) then raise exception 'Unknown location'; end if;
  update public.adventure_characters set
    xp=case when p_patch ? 'xp' then greatest(0,least(13034431,(p_patch->>'xp')::bigint)) else xp end,
    gold=case when p_patch ? 'gold' then greatest(0,least(1000000000,(p_patch->>'gold')::bigint)) else gold end,
    location_id=loc,
    world_day=case when p_patch ? 'world_day' then greatest(1,least(9999,(p_patch->>'world_day')::int)) else world_day end,
    world_minute=case when p_patch ? 'world_minute' then greatest(0,least(1439,(p_patch->>'world_minute')::int)) else world_minute end,
    weather=case when p_patch ? 'weather' and p_patch->>'weather' in ('clear','cloudy','rain','mist','storm','snow','heat') then p_patch->>'weather' else weather end,
    updated_at=now() where id=ac.id;
  update public.adventure_characters set level=public.adventure_level_from_xp(xp) where id=ac.id;
  insert into public.adventure_action_history(character_id,action_type,action_key,details) values(ac.id,'admin_patch','self',p_patch);
  return public.adventure_get_state();
end $$;

-- Lock down direct writes. RPC execution is authenticated-only.
do $$
declare t text;
begin
  foreach t in array array[
    'adventure_characters','adventure_player_stats','adventure_inventory','adventure_equipment','adventure_professions',
    'adventure_quest_progress','adventure_job_instances','adventure_discoveries','adventure_world_state','adventure_action_history',
    'adventure_reward_ledger','adventure_npc_state','adventure_npc_memories','adventure_relationships','adventure_world_events','adventure_community_projects'
  ] loop
    execute format('revoke insert,update,delete on public.%I from anon,authenticated',t);
  end loop;
end $$;


revoke all on function public.adventure_touch_internal(uuid) from public;
revoke all on function public.adventure_add_inventory(uuid,text,integer) from public;
revoke all on function public.adventure_remove_inventory(uuid,text,integer) from public;
revoke all on function public.adventure_grant_reward(uuid,text,text,integer,integer,text,integer) from public;
revoke all on function public.adventure_ensure_daily_jobs(uuid) from public;

revoke all on function public.adventure_create_character(text,text,text,text) from public;
revoke all on function public.adventure_travel(text) from public;
revoke all on function public.adventure_roll_check(text,integer,text) from public;
revoke all on function public.adventure_accept_quest(text) from public;
revoke all on function public.adventure_quest_action(text,text) from public;
revoke all on function public.adventure_accept_job(uuid) from public;
revoke all on function public.adventure_complete_job(uuid) from public;
revoke all on function public.adventure_touch() from public;
revoke all on function public.adventure_reset_character() from public;
revoke all on function public.adventure_admin_patch_self(jsonb) from public;
revoke all on function public.adventure_get_state() from public;

grant execute on function public.adventure_create_character(text,text,text,text) to authenticated;
grant execute on function public.adventure_travel(text) to authenticated;
grant execute on function public.adventure_roll_check(text,integer,text) to authenticated;
grant execute on function public.adventure_accept_quest(text) to authenticated;
grant execute on function public.adventure_quest_action(text,text) to authenticated;
grant execute on function public.adventure_accept_job(uuid) to authenticated;
grant execute on function public.adventure_complete_job(uuid) to authenticated;
grant execute on function public.adventure_touch() to authenticated;
grant execute on function public.adventure_reset_character() to authenticated;
grant execute on function public.adventure_admin_patch_self(jsonb) to authenticated;
grant execute on function public.adventure_get_state() to authenticated;

grant select on public.adventure_locations,public.adventure_item_catalog,public.adventure_quest_catalog to anon,authenticated;
