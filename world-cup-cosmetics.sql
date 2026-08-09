-- Repo Sports World Cup cosmetics patch
-- Run once in Supabase SQL Editor after uploading the website patch.
-- Adds the 16 World Cup watchcard backdrops at 2,000 GP each and the
-- 16 World Cup supporter pet name tags at Gertrude's standard 50,000 GP price.
-- Existing cosmetics, ownership and equipped states are preserved.

begin;

-- PARTY PETE: watchcard background purchasing
drop function if exists public.buy_watchcard_background(text);
create function public.buy_watchcard_background(p_item text)
returns table(new_gp integer, bank_items jsonb, equipped_watchcard_background text)
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_gp integer;
  v_items jsonb;
  v_price integer;
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;

  if p_item not in (
    'watchcard_wc_belros', 'watchcard_wc_calvora', 'watchcard_wc_drazhen', 'watchcard_wc_elvane', 'watchcard_wc_iskandar', 'watchcard_wc_kordesh',
    'watchcard_wc_lumerre', 'watchcard_wc_marovar', 'watchcard_wc_nambara', 'watchcard_wc_norveth', 'watchcard_wc_qasmir', 'watchcard_wc_rovarn',
    'watchcard_wc_sorevia', 'watchcard_wc_talune', 'watchcard_wc_vardesh', 'watchcard_wc_zafran', 'watchcard_crystal_bloom', 'watchcard_molten_forge',
    'watchcard_moonlit_observatory', 'watchcard_swamp_witch', 'watchcard_coral_palace', 'watchcard_pharaoh_vault', 'watchcard_cats_cradle', 'watchcard_frostfang',
    'watchcard_moonspire', 'watchcard_lumbridge_cellar', 'watchcard_celestial_study', 'watchcard_fight_caves', 'watchcard_abyssal_lounge', 'watchcard_obsidian_forge',
    'watchcard_nordic_retreat', 'watchcard_coastal_docks', 'watchcard_varrock_bank', 'watchcard_rangers_lodge', 'watchcard_gods_home', 'watchcard_grand_exchange_floor',
    'watchcard_monochrome_manor', 'watchcard_pumpkinboard_cafe', 'watchcard_varrock_rooftops', 'watchcard_amethyst_cavern', 'watchcard_gielinor_express', 'watchcard_clockwork_cabin',
    'watchcard_rainy_city_loft', 'watchcard_oasis_courtyard', 'watchcard_arcane_archives', 'watchcard_moonlit_athenaeum', 'watchcard_littlefish_office', 'watchcard_hogsmeade_high_street',
    'watchcard_elderwood_hideaway', 'watchcard_dragonback_vista', 'watchcard_brickbuilt_kingdom'
  ) then
    raise exception 'Unknown watchcard background.';
  end if;

  v_price := case when p_item like 'watchcard_wc_%' then 2000 else 25000 end;

  select coalesce(c.gp,0),coalesce(c.bank_items,'{}'::jsonb)
    into v_gp,v_items
  from public.characters c
  where c.user_id=auth.uid()
  for update;

  if not found then raise exception 'Character not found.'; end if;

  if greatest(0,coalesce((v_items->>p_item)::integer,0))>0 then
    raise exception 'You already own this background.';
  end if;

  if v_gp<v_price then
    raise exception 'You need % GP to buy this background.',to_char(v_price,'FM999,999,999');
  end if;

  v_items:=jsonb_set(v_items,array[p_item],'1'::jsonb,true);

  update public.characters c
     set gp=v_gp-v_price,
         bank_items=v_items,
         equipped_watchcard_background=p_item
   where c.user_id=auth.uid();

  return query select v_gp-v_price,v_items,p_item;
end;
$$;

grant execute on function public.buy_watchcard_background(text) to authenticated;


-- PARTY PETE: equip / unequip any owned watchcard background.
drop function if exists public.set_watchcard_background(text);
create function public.set_watchcard_background(p_item text)
returns table(equipped_watchcard_background text)
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_items jsonb;
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;

  select coalesce(c.bank_items,'{}'::jsonb)
    into v_items
  from public.characters c
  where c.user_id=auth.uid()
  for update;

  if not found then raise exception 'Character not found.'; end if;

  if p_item is not null then
    if p_item !~ '^watchcard_[a-z0-9_]+$' then raise exception 'Invalid background.'; end if;
    if greatest(0,coalesce((v_items->>p_item)::integer,0))<1 then
      raise exception 'You do not own this background.';
    end if;
  end if;

  update public.characters c
     set equipped_watchcard_background=p_item
   where c.user_id=auth.uid();

  return query select p_item;
end;
$$;

grant execute on function public.set_watchcard_background(text) to authenticated;


-- PARTY PETE: current equipped background.
drop function if exists public.get_my_watchcard_background();
create function public.get_my_watchcard_background()
returns table(equipped_watchcard_background text)
language sql
security definer
set search_path=public,auth
as $$
  select c.equipped_watchcard_background
  from public.characters c
  where c.user_id=auth.uid();
$$;

grant execute on function public.get_my_watchcard_background() to authenticated;


-- GERTRUDE: preserve all existing tags and add the 16 World Cup supporter tags.
drop function if exists public.buy_gertrude_nametag(text);
create function public.buy_gertrude_nametag(p_item text)
returns table(new_gp integer, bank_items jsonb, purchased_item text)
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  v_gp integer;
  v_items jsonb;
  v_price integer;
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;

  if p_item not in (
    'nametag_hunter_jungle', 'nametag_ice_mountain', 'nametag_lava', 'nametag_metal_steel', 'nametag_moneybags', 'nametag_moonlight',
    'nametag_nether_portal', 'nametag_nuclear', 'nametag_ocean', 'nametag_angel_wings', 'nametag_army', 'nametag_autumn',
    'nametag_blue_crown', 'nametag_blue_crystal', 'nametag_cloud_sun', 'nametag_combat', 'nametag_desert', 'nametag_emerald',
    'nametag_gold_wings', 'nametag_cherrybloom_charm', 'nametag_black_flag_bounty', 'nametag_voidbound', 'nametag_shadowflame_torches', 'nametag_wyrmfire_royal',
    'nametag_varrock_banner', 'nametag_ancient_parchment', 'nametag_champions_decree', 'nametag_toxic_revenant', 'nametag_bloodhorn', 'nametag_sunset_grove',
    'nametag_venomcore', 'nametag_druids_embrace', 'nametag_tidecaller', 'nametag_lunar_sorcerer', 'nametag_frozen_clan_banner', 'nametag_dreamies',
    'nametag_gilded_scroll', 'nametag_iron_prospect', 'nametag_lilac_unicorn', 'nametag_verdant_grove', 'nametag_midnight_familiar', 'nametag_glacial_sigil',
    'nametag_crimson_decree', 'nametag_coastal_catch', 'nametag_imperial_onyx', 'nametag_runed_steel', 'nametag_prism_ward', 'nametag_nimbus_broom',
    'nametag_garden_window', 'nametag_bakery_window', 'nametag_tea_biscuits', 'nametag_worldcup_belros', 'nametag_worldcup_calvora', 'nametag_worldcup_drazhen',
    'nametag_worldcup_elvane', 'nametag_worldcup_iskandar', 'nametag_worldcup_kordesh', 'nametag_worldcup_lumerre', 'nametag_worldcup_marovar', 'nametag_worldcup_nambara',
    'nametag_worldcup_norveth', 'nametag_worldcup_qasmir', 'nametag_worldcup_rovarn', 'nametag_worldcup_sorevia', 'nametag_worldcup_talune', 'nametag_worldcup_vardesh',
    'nametag_worldcup_zafran'
  ) then
    raise exception 'Unknown name tag.';
  end if;

  v_price := case
    when p_item='nametag_dreamies' then 75000
    when p_item='nametag_wyrmfire_royal' then 65000
    else 50000
  end;

  select coalesce(c.gp,0),coalesce(c.bank_items,'{}'::jsonb)
    into v_gp,v_items
  from public.characters c
  where c.user_id=auth.uid()
  for update;

  if not found then raise exception 'Character not found.'; end if;

  if greatest(0,coalesce((v_items->>p_item)::integer,0))>0 then
    raise exception 'You already own this name tag.';
  end if;

  if v_gp<v_price then
    raise exception 'You need % GP to buy this name tag.',to_char(v_price,'FM999,999,999');
  end if;

  v_items:=jsonb_set(v_items,array[p_item],'1'::jsonb,true);

  update public.characters c
     set gp=v_gp-v_price,
         bank_items=v_items
   where c.user_id=auth.uid();

  return query select v_gp-v_price,v_items,p_item;
end;
$$;

grant execute on function public.buy_gertrude_nametag(text) to authenticated;

notify pgrst,'reload schema';
commit;
