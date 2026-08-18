-- Repo Company V22.17 — Foil & Fable / Fable Voucher Economy
-- Global five-card daily shop, one purchase per player per London day,
-- authoritative slab buyback values, transaction ledger and admin testing helpers.

alter table public.characters
  add column if not exists fable_vouchers bigint not null default 0;

create table if not exists public.repo_fable_rarity_config (
  rarity text primary key,
  display_name text not null,
  sell_base_value bigint not null check (sell_base_value >= 0),
  shop_price bigint not null check (shop_price > 0),
  shop_weight numeric(8,4) not null check (shop_weight >= 0),
  sort_order integer not null,
  shop_eligible boolean not null default true,
  constraint repo_fable_no_arbitrage_check check (shop_price > (sell_base_value * 5) / 2)
);

insert into public.repo_fable_rarity_config(rarity,display_name,sell_base_value,shop_price,shop_weight,sort_order,shop_eligible)
values
  ('standard','Standard',500,10000,35.0,1,true),
  ('full_art','Full Art',1000,20000,20.0,2,true),
  ('off_the_broom','Velmora: Off the Broom',1500,30000,13.0,3,true),
  ('patch','Patch',2000,45000,10.0,4,true),
  ('unfinished','RCG Unfinished',2750,60000,7.0,5,true),
  ('promo','PSYCOMPANY Promo',3500,80000,5.0,6,true),
  ('platinum','Platinum',5000,120000,4.0,7,true),
  ('rival','Rival',7500,170000,2.8,8,true),
  ('legendary','Gold Legendary',12500,250000,1.7,9,true),
  ('signature','Signature',20000,400000,0.8,10,true),
  ('millennium','Millennium',35000,650000,0.5,11,true),
  ('black_label','RCG Black Label',75000,1000000,0.2,12,true)
on conflict(rarity) do update set
  display_name=excluded.display_name,
  sell_base_value=excluded.sell_base_value,
  shop_price=excluded.shop_price,
  shop_weight=excluded.shop_weight,
  sort_order=excluded.sort_order,
  shop_eligible=excluded.shop_eligible;

create table if not exists public.repo_fable_daily_shop (
  shop_date date not null,
  slot smallint not null check (slot between 1 and 5),
  card_id text not null,
  rarity text not null references public.repo_fable_rarity_config(rarity) on update cascade,
  price bigint not null check (price > 0),
  sold_by_user_id uuid references auth.users(id) on delete set null,
  sold_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  primary key(shop_date,slot),
  unique(shop_date,card_id),
  constraint repo_fable_sale_pair_check check ((sold_at is null and sold_by_user_id is null) or (sold_at is not null and sold_by_user_id is not null))
);

create table if not exists public.repo_fable_daily_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_date date not null,
  slot smallint not null check (slot between 1 and 5),
  card_id text not null,
  rarity text not null,
  price bigint not null check (price > 0),
  purchased_at timestamptz not null default clock_timestamp(),
  unique(user_id,shop_date),
  unique(shop_date,slot)
);

create table if not exists public.repo_fable_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('SLAB_SALE','DAILY_CARD_PURCHASE','ADMIN_ADJUSTMENT')),
  amount bigint not null,
  balance_after bigint not null check (balance_after >= 0),
  card_id text,
  slab_id uuid,
  shop_date date,
  shop_slot smallint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists repo_fable_ledger_user_created_idx on public.repo_fable_ledger(user_id,created_at desc);
create index if not exists repo_fable_shop_date_sold_idx on public.repo_fable_daily_shop(shop_date,sold_at);

alter table public.repo_fable_rarity_config enable row level security;
alter table public.repo_fable_daily_shop enable row level security;
alter table public.repo_fable_daily_purchases enable row level security;
alter table public.repo_fable_ledger enable row level security;

revoke all on public.repo_fable_rarity_config from anon, authenticated;
revoke all on public.repo_fable_daily_shop from anon, authenticated;
revoke all on public.repo_fable_daily_purchases from anon, authenticated;
revoke all on public.repo_fable_ledger from anon, authenticated;

create or replace function public.repo_fable_london_date()
returns date
language sql
stable
as $function$
  select timezone('Europe/London', clock_timestamp())::date
$function$;

create or replace function public.repo_fable_is_admin(p_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path to 'public','auth'
as $function$
  select exists(
    select 1 from public.characters c
    where c.user_id=p_uid and lower(btrim(c.username)) in ('admin','catasthma')
  )
$function$;

create or replace function public.repo_fable_ensure_shop(p_date date default null)
returns void
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_date date:=coalesce(p_date,public.repo_fable_london_date());
  v_slot integer;
  v_attempt integer;
  v_roll numeric;
  v_rarity text;
  v_price bigint;
  v_card text;
begin
  perform pg_advisory_xact_lock(hashtextextended('repo-fable-shop:'||v_date::text,0));

  for v_slot in 1..5 loop
    if exists(select 1 from public.repo_fable_daily_shop s where s.shop_date=v_date and s.slot=v_slot) then
      continue;
    end if;

    v_card:=null;
    for v_attempt in 1..100 loop
      v_roll:=random()*100.0;
      select weighted.rarity,weighted.shop_price
        into v_rarity,v_price
      from (
        select c.rarity,c.shop_price,
               sum(c.shop_weight) over(order by c.sort_order rows unbounded preceding) as upper_weight
        from public.repo_fable_rarity_config c
        where c.shop_eligible and c.shop_weight>0
      ) weighted
      where v_roll < weighted.upper_weight
      order by weighted.upper_weight
      limit 1;

      if v_rarity is null then
        raise exception 'Fable Shop rarity configuration is invalid.';
      end if;

      select p.card_id
        into v_card
      from public.repo_tcg_pack_cards p
      where p.rarity=v_rarity
        and p.card_id not like 'wc2026\_%' escape '\\'
        and p.card_id not like 'ltd\_%' escape '\\'
        and not exists(
          select 1 from public.repo_fable_daily_shop existing
          where existing.shop_date=v_date and existing.card_id=p.card_id
        )
      order by random()
      limit 1;

      exit when v_card is not null;
    end loop;

    if v_card is null then
      raise exception 'Could not generate Fable Shop slot %.',v_slot;
    end if;

    insert into public.repo_fable_daily_shop(shop_date,slot,card_id,rarity,price)
    values(v_date,v_slot,v_card,v_rarity,v_price)
    on conflict(shop_date,slot) do nothing;
  end loop;
end
$function$;

create or replace function public.repo_fable_get_state()
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_date date:=public.repo_fable_london_date();
  v_username text;
  v_balance bigint;
  v_purchase jsonb;
  v_shop jsonb;
  v_slabs jsonb;
  v_result jsonb;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  perform public.repo_fable_ensure_shop(v_date);

  select c.username,c.fable_vouchers into v_username,v_balance
  from public.characters c where c.user_id=v_uid;
  if v_username is null then raise exception 'Character not found'; end if;

  select to_jsonb(p) into v_purchase
  from (
    select d.shop_date,d.slot,d.card_id,d.rarity,d.price,d.purchased_at
    from public.repo_fable_daily_purchases d
    where d.user_id=v_uid and d.shop_date=v_date
    limit 1
  ) p;

  select coalesce(jsonb_agg(jsonb_build_object(
    'slot',s.slot,
    'card_id',s.card_id,
    'rarity',s.rarity,
    'price',s.price,
    'sold',(s.sold_at is not null),
    'sold_at',s.sold_at
  ) order by s.slot),'[]'::jsonb)
  into v_shop
  from public.repo_fable_daily_shop s
  where s.shop_date=v_date;

  select coalesce(jsonb_agg(jsonb_build_object(
    'slab_id',s.id,
    'card_id',s.card_id,
    'card_set',s.card_set,
    'card_variant',s.card_variant,
    'grade',s.grade,
    'certification_number',s.certification_number,
    'is_favourite',s.is_favourite,
    'created_at',s.created_at,
    'rarity',p.rarity,
    'rarity_name',cfg.display_name,
    'sellable',(cfg.rarity is not null),
    'sell_value',case s.grade when 8 then cfg.sell_base_value when 9 then (cfg.sell_base_value*3)/2 when 10 then (cfg.sell_base_value*5)/2 else null end,
    'sell_block_reason',case when cfg.rarity is null then 'EVENT / UNIQUE CARD — GREGG WILL NOT BUY THIS SLAB' else null end
  ) order by s.created_at desc),'[]'::jsonb)
  into v_slabs
  from public.repo_rcg_slabs s
  join public.repo_rcg_grading_orders o on o.id=s.grading_order_id
  left join public.repo_tcg_pack_cards p on p.card_id=s.card_id
  left join public.repo_fable_rarity_config cfg on cfg.rarity=p.rarity
  where s.user_id=v_uid and not s.is_cracked and o.reveal_status;

  v_result:=jsonb_build_object(
    'server_now',clock_timestamp(),
    'shop_date',v_date,
    'next_refresh_at',((v_date+1)::timestamp at time zone 'Europe/London'),
    'username',v_username,
    'fable_vouchers',coalesce(v_balance,0),
    'is_admin',public.repo_fable_is_admin(v_uid),
    'purchase_today',v_purchase,
    'purchase_used',(v_purchase is not null),
    'shop',v_shop,
    'slabs',v_slabs
  );
  return v_result;
end
$function$;

create or replace function public.repo_fable_buy_daily_card(p_slot integer)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_date date:=public.repo_fable_london_date();
  v_shop public.repo_fable_daily_shop%rowtype;
  v_balance bigint;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  if p_slot not between 1 and 5 then raise exception 'Invalid Fable Shop slot.'; end if;

  perform public.repo_fable_ensure_shop(v_date);
  perform pg_advisory_xact_lock(hashtextextended('repo-fable-user:'||v_uid::text||':'||v_date::text,0));

  if exists(select 1 from public.repo_fable_daily_purchases p where p.user_id=v_uid and p.shop_date=v_date) then
    raise exception 'You have already bought your one Fable Shop card today.';
  end if;

  select * into v_shop
  from public.repo_fable_daily_shop s
  where s.shop_date=v_date and s.slot=p_slot
  for update;

  if not found then raise exception 'That Fable Shop slot is unavailable.'; end if;
  if v_shop.sold_at is not null then raise exception 'SORRY — SOMEONE JUST BOUGHT THIS CARD.'; end if;

  if not exists(
    select 1 from public.repo_tcg_pack_cards p
    where p.card_id=v_shop.card_id and p.rarity=v_shop.rarity
      and p.card_id not like 'wc2026\_%' escape '\\'
      and p.card_id not like 'ltd\_%' escape '\\'
  ) then
    raise exception 'That card is not eligible for the Fable Shop.';
  end if;

  select c.fable_vouchers into v_balance
  from public.characters c where c.user_id=v_uid
  for update;
  if not found then raise exception 'Character not found'; end if;
  if coalesce(v_balance,0)<v_shop.price then
    raise exception 'You need % Fable Vouchers for this card.',v_shop.price;
  end if;

  update public.characters
     set fable_vouchers=fable_vouchers-v_shop.price
   where user_id=v_uid
  returning fable_vouchers into v_balance;

  insert into public.quidditch_tcg_collections(user_id,cards)
  values(v_uid,array[v_shop.card_id])
  on conflict(user_id) do update
    set cards=array_append(coalesce(public.quidditch_tcg_collections.cards,'{}'::text[]),v_shop.card_id),
        updated_at=clock_timestamp();

  update public.repo_fable_daily_shop
     set sold_by_user_id=v_uid,sold_at=clock_timestamp()
   where shop_date=v_date and slot=p_slot;

  insert into public.repo_fable_daily_purchases(user_id,shop_date,slot,card_id,rarity,price)
  values(v_uid,v_date,p_slot,v_shop.card_id,v_shop.rarity,v_shop.price);

  insert into public.repo_fable_ledger(user_id,transaction_type,amount,balance_after,card_id,shop_date,shop_slot,metadata)
  values(v_uid,'DAILY_CARD_PURCHASE',-v_shop.price,v_balance,v_shop.card_id,v_date,p_slot,
         jsonb_build_object('rarity',v_shop.rarity,'source','FABLE_SHOP'));

  return jsonb_build_object(
    'ok',true,'card_id',v_shop.card_id,'rarity',v_shop.rarity,'price',v_shop.price,
    'slot',p_slot,'shop_date',v_date,'new_balance',v_balance
  );
end
$function$;

create or replace function public.repo_fable_sell_slab(p_slab_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_slab public.repo_rcg_slabs%rowtype;
  v_rarity text;
  v_rarity_name text;
  v_base bigint;
  v_value bigint;
  v_balance bigint;
  v_layout jsonb;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;

  select s.* into v_slab
  from public.repo_rcg_slabs s
  join public.repo_rcg_grading_orders o on o.id=s.grading_order_id
  where s.id=p_slab_id and s.user_id=v_uid and not s.is_cracked and o.reveal_status
  for update of s;
  if not found then raise exception 'That slab is no longer available to sell.'; end if;

  select p.rarity,cfg.display_name,cfg.sell_base_value
    into v_rarity,v_rarity_name,v_base
  from public.repo_tcg_pack_cards p
  join public.repo_fable_rarity_config cfg on cfg.rarity=p.rarity
  where p.card_id=v_slab.card_id and cfg.shop_eligible
  limit 1;

  if v_rarity is null then
    raise exception 'Gregg will not buy event, World Cup or unique protected slabs.';
  end if;

  v_value:=case v_slab.grade
    when 8 then v_base
    when 9 then (v_base*3)/2
    when 10 then (v_base*5)/2
    else 0
  end;
  if v_value<=0 then raise exception 'That slab has no valid Fable Voucher value.'; end if;

  select c.fable_vouchers into v_balance
  from public.characters c where c.user_id=v_uid
  for update;
  if not found then raise exception 'Character not found'; end if;

  update public.characters
     set fable_vouchers=fable_vouchers+v_value
   where user_id=v_uid
  returning fable_vouchers into v_balance;

  select b.layout into v_layout
  from public.repo_rcg_slab_binder_layouts b
  where b.user_id=v_uid
  for update;

  if v_layout is not null and jsonb_typeof(v_layout)='array' then
    select coalesce(jsonb_agg(
      case when jsonb_typeof(e.value)='string' and (e.value#>>'{}')=v_slab.id::text then 'null'::jsonb else e.value end
      order by e.ord
    ),'[]'::jsonb)
    into v_layout
    from jsonb_array_elements(v_layout) with ordinality e(value,ord);

    update public.repo_rcg_slab_binder_layouts
       set layout=v_layout,updated_at=clock_timestamp()
     where user_id=v_uid;
  end if;

  insert into public.repo_fable_ledger(user_id,transaction_type,amount,balance_after,card_id,slab_id,metadata)
  values(v_uid,'SLAB_SALE',v_value,v_balance,v_slab.card_id,v_slab.id,
         jsonb_build_object(
           'rarity',v_rarity,'rarity_name',v_rarity_name,'grade',v_slab.grade,
           'certification_number',v_slab.certification_number,'card_set',v_slab.card_set
         ));

  delete from public.repo_rcg_slabs where id=v_slab.id;

  return jsonb_build_object(
    'ok',true,'slab_id',v_slab.id,'card_id',v_slab.card_id,'grade',v_slab.grade,
    'rarity',v_rarity,'rarity_name',v_rarity_name,'vouchers_received',v_value,'new_balance',v_balance
  );
end
$function$;

create or replace function public.repo_fable_admin_adjust(p_username text,p_amount bigint)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_admin uuid:=auth.uid();
  v_target uuid;
  v_old bigint;
  v_new bigint;
  v_effective bigint;
begin
  if v_admin is null or not public.repo_fable_is_admin(v_admin) then raise exception 'Admin access required'; end if;
  if coalesce(btrim(p_username),'')='' then raise exception 'Username required'; end if;
  if p_amount=0 then raise exception 'Adjustment cannot be zero'; end if;

  select c.user_id,c.fable_vouchers into v_target,v_old
  from public.characters c where lower(btrim(c.username))=lower(btrim(p_username))
  limit 1 for update;
  if v_target is null then raise exception 'Player not found'; end if;

  v_new:=greatest(0,coalesce(v_old,0)+p_amount);
  v_effective:=v_new-coalesce(v_old,0);
  update public.characters set fable_vouchers=v_new where user_id=v_target;

  insert into public.repo_fable_ledger(user_id,transaction_type,amount,balance_after,metadata)
  values(v_target,'ADMIN_ADJUSTMENT',v_effective,v_new,
         jsonb_build_object('requested_amount',p_amount,'adjusted_by',v_admin));

  return jsonb_build_object('ok',true,'username',p_username,'adjustment',v_effective,'new_balance',v_new);
end
$function$;

create or replace function public.repo_fable_admin_preview_shop()
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_admin uuid:=auth.uid();
  v_slot integer;
  v_attempt integer;
  v_roll numeric;
  v_rarity text;
  v_price bigint;
  v_card text;
  v_cards text[]:='{}'::text[];
  v_result jsonb:='[]'::jsonb;
begin
  if v_admin is null or not public.repo_fable_is_admin(v_admin) then raise exception 'Admin access required'; end if;
  for v_slot in 1..5 loop
    v_card:=null;
    for v_attempt in 1..100 loop
      v_roll:=random()*100.0;
      select weighted.rarity,weighted.shop_price into v_rarity,v_price
      from (
        select c.rarity,c.shop_price,
               sum(c.shop_weight) over(order by c.sort_order rows unbounded preceding) as upper_weight
        from public.repo_fable_rarity_config c where c.shop_eligible and c.shop_weight>0
      ) weighted
      where v_roll<weighted.upper_weight
      order by weighted.upper_weight limit 1;

      select p.card_id into v_card
      from public.repo_tcg_pack_cards p
      where p.rarity=v_rarity
        and not(p.card_id=any(v_cards))
        and p.card_id not like 'wc2026\_%' escape '\\'
        and p.card_id not like 'ltd\_%' escape '\\'
      order by random() limit 1;
      exit when v_card is not null;
    end loop;
    if v_card is null then raise exception 'Could not preview Fable Shop slot %.',v_slot; end if;
    v_cards:=array_append(v_cards,v_card);
    v_result:=v_result||jsonb_build_array(jsonb_build_object('slot',v_slot,'card_id',v_card,'rarity',v_rarity,'price',v_price));
  end loop;
  return v_result;
end
$function$;

create or replace function public.repo_fable_admin_regenerate_today(p_force boolean default false)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_admin uuid:=auth.uid();
  v_date date:=public.repo_fable_london_date();
  v_sold integer;
begin
  if v_admin is null or not public.repo_fable_is_admin(v_admin) then raise exception 'Admin access required'; end if;
  perform public.repo_fable_ensure_shop(v_date);
  select count(*)::int into v_sold from public.repo_fable_daily_shop where shop_date=v_date and sold_at is not null;
  if v_sold>0 and not p_force then
    raise exception 'Today already has purchases. Use the explicit forced reroll to regenerate UNSOLD slots only.';
  end if;

  if v_sold=0 then
    delete from public.repo_fable_daily_shop where shop_date=v_date;
  else
    delete from public.repo_fable_daily_shop where shop_date=v_date and sold_at is null;
  end if;
  perform public.repo_fable_ensure_shop(v_date);
  return public.repo_fable_get_state();
end
$function$;

create or replace function public.repo_fable_admin_history(p_username text default null,p_limit integer default 50)
returns jsonb
language plpgsql
security definer
set search_path to 'public','auth'
as $function$
declare
  v_admin uuid:=auth.uid();
  v_target uuid;
  v_limit integer:=greatest(1,least(coalesce(p_limit,50),200));
  v_result jsonb;
begin
  if v_admin is null or not public.repo_fable_is_admin(v_admin) then raise exception 'Admin access required'; end if;
  if nullif(btrim(coalesce(p_username,'')),'') is not null then
    select c.user_id into v_target from public.characters c where lower(btrim(c.username))=lower(btrim(p_username)) limit 1;
    if v_target is null then raise exception 'Player not found'; end if;
  end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_result
  from (
    select l.id,c.username,l.transaction_type,l.amount,l.balance_after,l.card_id,l.slab_id,l.shop_date,l.shop_slot,l.metadata,l.created_at
    from public.repo_fable_ledger l
    join public.characters c on c.user_id=l.user_id
    where v_target is null or l.user_id=v_target
    order by l.created_at desc
    limit v_limit
  ) x;
  return v_result;
end
$function$;

revoke all on function public.repo_fable_get_state() from public;
revoke all on function public.repo_fable_buy_daily_card(integer) from public;
revoke all on function public.repo_fable_sell_slab(uuid) from public;
revoke all on function public.repo_fable_admin_adjust(text,bigint) from public;
revoke all on function public.repo_fable_admin_preview_shop() from public;
revoke all on function public.repo_fable_admin_regenerate_today(boolean) from public;
revoke all on function public.repo_fable_admin_history(text,integer) from public;

grant execute on function public.repo_fable_get_state() to authenticated;
grant execute on function public.repo_fable_buy_daily_card(integer) to authenticated;
grant execute on function public.repo_fable_sell_slab(uuid) to authenticated;
grant execute on function public.repo_fable_admin_adjust(text,bigint) to authenticated;
grant execute on function public.repo_fable_admin_preview_shop() to authenticated;
grant execute on function public.repo_fable_admin_regenerate_today(boolean) to authenticated;
grant execute on function public.repo_fable_admin_history(text,integer) to authenticated;

-- Balance write guard: authenticated/anon clients cannot directly edit the currency.
create or replace function public.repo_fable_guard_balance_update()
returns trigger
language plpgsql
set search_path to 'public','auth'
as $function$
begin
  if current_user in ('anon','authenticated') and new.fable_vouchers is distinct from old.fable_vouchers then
    raise exception 'Fable Voucher balance is server-authoritative.';
  end if;
  return new;
end
$function$;

drop trigger if exists repo_fable_guard_balance_update on public.characters;
create trigger repo_fable_guard_balance_update
before update of fable_vouchers on public.characters
for each row execute function public.repo_fable_guard_balance_update();

revoke all on function public.repo_fable_london_date() from public;
revoke all on function public.repo_fable_is_admin(uuid) from public;
revoke all on function public.repo_fable_ensure_shop(date) from public;
