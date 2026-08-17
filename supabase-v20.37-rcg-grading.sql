-- Repo Company V20.37 — RCG Grading / permanent slab collection
create extension if not exists pg_cron;

create table if not exists public.repo_rcg_config (
  key text primary key,
  value_bigint bigint,
  value_text text,
  updated_at timestamptz not null default now()
);
insert into public.repo_rcg_config(key,value_bigint,value_text) values
  ('RCG_GRADING_FEE',10000,null),
  ('RCG_GRADING_SECONDS',300,null),
  ('RCG_MAX_ACTIVE_ORDERS',1,null)
on conflict(key) do nothing;

create table if not exists public.repo_rcg_protected_cards (
  card_id text primary key,
  reason text not null,
  created_at timestamptz not null default now()
);
insert into public.repo_rcg_protected_cards(card_id,reason) values
 ('ltd_week_one_anniversary','Limited one-time anniversary card'),
 ('wc2026_debbie_sorevia','World Cup 2026 event card'),
 ('wc2026_dopey_dom_drazhen','World Cup 2026 event card'),
 ('wc2026_jenny_sorevia','World Cup 2026 event card'),
 ('wc2026_jud_belros','World Cup 2026 event card'),
 ('wc2026_mad_rager_nambara','World Cup 2026 event card'),
 ('wc2026_nimbler_2000_belros','World Cup 2026 event card'),
 ('wc2026_pipsqueak_vardesh','World Cup 2026 event card'),
 ('wc2026_soup_talune','World Cup 2026 event card'),
 ('wc2026_besquelcher_iskandar','World Cup 2026 event card'),
 ('wc2026_rocky_norveth','World Cup 2026 event card')
on conflict(card_id) do update set reason=excluded.reason;

create sequence if not exists public.repo_rcg_cert_seq start 1;

create table if not exists public.repo_rcg_grading_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_id text not null,
  card_set text not null default 'Repo Company TCG',
  card_variant text not null default 'Standard',
  print_serial text,
  grading_fee bigint not null,
  submitted_at timestamptz not null default now(),
  ready_at timestamptz not null,
  status text not null default 'grading' check(status in ('grading','ready','revealed')),
  final_grade smallint check(final_grade in (8,9,10)),
  certification_number text unique,
  reveal_status boolean not null default false,
  completed_at timestamptz,
  admin_test_skip boolean not null default false,
  updated_at timestamptz not null default now()
);
create unique index if not exists repo_rcg_one_pending_copy_idx
  on public.repo_rcg_grading_orders(user_id,card_id) where status='grading';
create index if not exists repo_rcg_due_idx on public.repo_rcg_grading_orders(status,ready_at);
create index if not exists repo_rcg_user_orders_idx on public.repo_rcg_grading_orders(user_id,submitted_at desc);

create table if not exists public.repo_rcg_slabs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  grading_order_id uuid not null unique references public.repo_rcg_grading_orders(id) on delete restrict,
  card_id text not null,
  card_set text not null,
  card_variant text not null,
  print_serial text,
  grade smallint not null check(grade in (8,9,10)),
  certification_number text not null unique,
  is_favourite boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists repo_rcg_slabs_user_idx on public.repo_rcg_slabs(user_id,created_at desc);
create index if not exists repo_rcg_slabs_card_grade_idx on public.repo_rcg_slabs(user_id,card_id,grade);

create table if not exists public.repo_rcg_slab_binder_layouts (
  user_id uuid primary key,
  username text not null,
  layout jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.repo_rcg_config enable row level security;
alter table public.repo_rcg_protected_cards enable row level security;
alter table public.repo_rcg_grading_orders enable row level security;
alter table public.repo_rcg_slabs enable row level security;
alter table public.repo_rcg_slab_binder_layouts enable row level security;
revoke all on public.repo_rcg_config, public.repo_rcg_protected_cards, public.repo_rcg_grading_orders, public.repo_rcg_slabs, public.repo_rcg_slab_binder_layouts from anon, authenticated;
revoke all on sequence public.repo_rcg_cert_seq from anon, authenticated;

create or replace function public.repo_rcg_config_value(p_key text, p_default bigint)
returns bigint language sql stable security definer set search_path='public' as $$
  select coalesce((select value_bigint from public.repo_rcg_config where key=p_key),p_default)
$$;
revoke all on function public.repo_rcg_config_value(text,bigint) from public, anon, authenticated;

create or replace function public.repo_rcg_card_set(p_card_id text)
returns text language sql immutable as $$
 select case
   when p_card_id like '%_patch' then 'Patch'
   when p_card_id like '%_signature' then 'Signature'
   when p_card_id like '%_millennium' then 'Millennium'
   when p_card_id like '%_rival' then 'Rival'
   when p_card_id like '%_platinum' then 'Platinum'
   when p_card_id like '%legendary%' then 'Legendary Full Art'
   when p_card_id like '%full_art%' then 'Full Art'
   else 'Standard'
 end
$$;

create or replace function public.repo_rcg_card_variant(p_card_id text)
returns text language sql immutable as $$ select public.repo_rcg_card_set(p_card_id) $$;

create or replace function public.repo_rcg_roll_grade()
returns smallint language plpgsql volatile security definer set search_path='public' as $$
declare r double precision:=random();
begin
  if r < 0.65 then return 8; elsif r < 0.90 then return 9; else return 10; end if;
end $$;
revoke all on function public.repo_rcg_roll_grade() from public, anon, authenticated;

create or replace function public.repo_rcg_finalize_order_internal(p_order_id uuid, p_admin_skip boolean default false)
returns void language plpgsql security definer set search_path='public','auth' as $$
declare
  o public.repo_rcg_grading_orders%rowtype;
  v_grade smallint;
  v_cert text;
  v_seq bigint;
begin
  select * into o from public.repo_rcg_grading_orders where id=p_order_id for update;
  if not found then return; end if;
  if o.status <> 'grading' then return; end if;
  if not p_admin_skip and clock_timestamp() < o.ready_at then return; end if;

  -- The grade and certificate are created exactly once while the order row is locked.
  v_grade:=coalesce(o.final_grade,public.repo_rcg_roll_grade());
  if o.certification_number is null then
    v_seq:=nextval('public.repo_rcg_cert_seq');
    v_cert:='RCG-'||to_char(clock_timestamp(),'YYYY')||'-'||lpad(v_seq::text,6,'0');
  else v_cert:=o.certification_number; end if;

  insert into public.repo_rcg_slabs(user_id,grading_order_id,card_id,card_set,card_variant,print_serial,grade,certification_number,created_at)
  values(o.user_id,o.id,o.card_id,o.card_set,o.card_variant,o.print_serial,v_grade,v_cert,clock_timestamp())
  on conflict(grading_order_id) do nothing;

  -- Grading permanently converts the physical raw copy into a slab. This is the
  -- moment normal-pack eligibility opens again for repeatable cards.
  update public.quidditch_tcg_collections q
     set cards=array_remove(coalesce(q.cards,'{}'::text[]),o.card_id),updated_at=clock_timestamp()
   where q.user_id=o.user_id;

  update public.repo_rcg_grading_orders
     set final_grade=v_grade,certification_number=v_cert,status='ready',completed_at=coalesce(completed_at,clock_timestamp()),
         admin_test_skip=(admin_test_skip or p_admin_skip),updated_at=clock_timestamp()
   where id=o.id;
end $$;
revoke all on function public.repo_rcg_finalize_order_internal(uuid,boolean) from public,anon,authenticated;

create or replace function public.repo_rcg_finalize_due_orders()
returns integer language plpgsql security definer set search_path='public' as $$
declare r record; n integer:=0;
begin
  for r in select id from public.repo_rcg_grading_orders where status='grading' and ready_at<=clock_timestamp() order by ready_at limit 200
  loop
    perform public.repo_rcg_finalize_order_internal(r.id,false); n:=n+1;
  end loop;
  return n;
end $$;
revoke all on function public.repo_rcg_finalize_due_orders() from public,anon,authenticated;

create or replace function public.repo_rcg_finalize_due_for_user(p_uid uuid)
returns void language plpgsql security definer set search_path='public' as $$
declare r record;
begin
  for r in select id from public.repo_rcg_grading_orders where user_id=p_uid and status='grading' and ready_at<=clock_timestamp()
  loop perform public.repo_rcg_finalize_order_internal(r.id,false); end loop;
end $$;
revoke all on function public.repo_rcg_finalize_due_for_user(uuid) from public,anon,authenticated;

create or replace function public.submit_rcg_grading(p_card_id text)
returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare
  uid uuid:=auth.uid(); c public.characters%rowtype; v_cards text[]; v_card text:=btrim(coalesce(p_card_id,''));
  v_fee bigint:=public.repo_rcg_config_value('RCG_GRADING_FEE',10000);
  v_seconds bigint:=public.repo_rcg_config_value('RCG_GRADING_SECONDS',300);
  v_limit bigint:=public.repo_rcg_config_value('RCG_MAX_ACTIVE_ORDERS',1);
  v_order public.repo_rcg_grading_orders%rowtype;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if v_card='' then raise exception 'Choose a card to grade'; end if;
  if exists(select 1 from public.repo_rcg_protected_cards where card_id=v_card) then
    raise exception 'This limited/event card is protected from grading in the current RCG ruleset.';
  end if;

  select * into c from public.characters where user_id=uid for update;
  if not found then raise exception 'Character not found'; end if;
  perform public.repo_rcg_finalize_due_for_user(uid);

  if (select count(*) from public.repo_rcg_grading_orders where user_id=uid and status='grading') >= v_limit then
    raise exception 'Your RCG grading slot is currently occupied.';
  end if;

  insert into public.quidditch_tcg_collections(user_id,cards) values(uid,'{}'::text[]) on conflict(user_id) do nothing;
  select coalesce(cards,'{}'::text[]) into v_cards from public.quidditch_tcg_collections where user_id=uid for update;
  if not (v_card=any(v_cards)) then raise exception 'You do not currently own that raw card.'; end if;
  if exists(select 1 from public.repo_rcg_grading_orders where user_id=uid and card_id=v_card and status='grading') then
    raise exception 'That physical card is already at RCG.';
  end if;
  if c.gp < v_fee then raise exception 'You need % GP for RCG grading.',v_fee; end if;

  update public.characters set gp=gp-v_fee where user_id=uid and gp>=v_fee returning * into c;
  if not found then raise exception 'Not enough GP'; end if;

  insert into public.repo_rcg_grading_orders(user_id,card_id,card_set,card_variant,grading_fee,submitted_at,ready_at,status)
  values(uid,v_card,public.repo_rcg_card_set(v_card),public.repo_rcg_card_variant(v_card),v_fee,clock_timestamp(),clock_timestamp()+make_interval(secs=>v_seconds::integer),'grading')
  returning * into v_order;

  return jsonb_build_object('order_id',v_order.id,'card_id',v_order.card_id,'submitted_at',v_order.submitted_at,'ready_at',v_order.ready_at,
    'status',v_order.status,'grading_fee',v_fee,'new_gp',c.gp,'duration_seconds',v_seconds,'odds',jsonb_build_object('8',65,'9',25,'10',10));
exception when unique_violation then
  raise exception 'That physical card is already at RCG.';
end $$;

create or replace function public.get_my_rcg_state()
returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare uid uuid:=auth.uid(); v_username text; v_result jsonb; v_fee bigint; v_seconds bigint; v_limit bigint;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  perform public.repo_rcg_finalize_due_for_user(uid);
  select username into v_username from public.characters where user_id=uid;
  if v_username is null then raise exception 'Character not found'; end if;
  v_fee:=public.repo_rcg_config_value('RCG_GRADING_FEE',10000);
  v_seconds:=public.repo_rcg_config_value('RCG_GRADING_SECONDS',300);
  v_limit:=public.repo_rcg_config_value('RCG_MAX_ACTIVE_ORDERS',1);
  select jsonb_build_object(
    'server_now',clock_timestamp(),'username',v_username,
    'config',jsonb_build_object('fee',v_fee,'duration_seconds',v_seconds,'max_active_orders',v_limit,'odds',jsonb_build_object('8',65,'9',25,'10',10)),
    'protected_cards',(select coalesce(jsonb_agg(card_id),'[]'::jsonb) from public.repo_rcg_protected_cards),
    'active_orders',(select coalesce(jsonb_agg(jsonb_build_object('order_id',o.id,'card_id',o.card_id,'card_set',o.card_set,'card_variant',o.card_variant,'submitted_at',o.submitted_at,'ready_at',o.ready_at,'status',o.status,'grading_fee',o.grading_fee,'admin_test_skip',o.admin_test_skip) order by o.submitted_at),'[]'::jsonb) from public.repo_rcg_grading_orders o where o.user_id=uid and o.status='grading'),
    'returns',(select coalesce(jsonb_agg(jsonb_build_object('order_id',o.id,'card_id',o.card_id,'card_set',o.card_set,'card_variant',o.card_variant,'completed_at',o.completed_at,'status',o.status) order by o.completed_at),'[]'::jsonb) from public.repo_rcg_grading_orders o where o.user_id=uid and o.status='ready' and not o.reveal_status),
    'slabs',(select coalesce(jsonb_agg(jsonb_build_object('slab_id',s.id,'order_id',s.grading_order_id,'card_id',s.card_id,'card_set',s.card_set,'card_variant',s.card_variant,'print_serial',s.print_serial,'grade',s.grade,'certification_number',s.certification_number,'is_favourite',s.is_favourite,'created_at',s.created_at) order by s.created_at),'[]'::jsonb) from public.repo_rcg_slabs s join public.repo_rcg_grading_orders o on o.id=s.grading_order_id where s.user_id=uid and o.reveal_status),
    'layout',coalesce((select layout from public.repo_rcg_slab_binder_layouts where user_id=uid),'[]'::jsonb)
  ) into v_result;
  return v_result;
end $$;

create or replace function public.reveal_rcg_return(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare uid uuid:=auth.uid(); o public.repo_rcg_grading_orders%rowtype; s public.repo_rcg_slabs%rowtype; v_count bigint;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  perform public.repo_rcg_finalize_due_for_user(uid);
  select * into o from public.repo_rcg_grading_orders where id=p_order_id and user_id=uid for update;
  if not found then raise exception 'RCG return not found'; end if;
  if o.status='grading' then raise exception 'This grading order is not ready yet'; end if;
  update public.repo_rcg_grading_orders set reveal_status=true,status='revealed',updated_at=clock_timestamp() where id=o.id;
  select * into s from public.repo_rcg_slabs where grading_order_id=o.id;
  if not found then raise exception 'RCG slab record is missing'; end if;
  select count(*) into v_count from public.repo_rcg_slabs where user_id=uid and card_id=s.card_id and grade=s.grade;
  return jsonb_build_object('slab_id',s.id,'order_id',s.grading_order_id,'card_id',s.card_id,'card_set',s.card_set,'card_variant',s.card_variant,
    'print_serial',s.print_serial,'grade',s.grade,'certification_number',s.certification_number,'created_at',s.created_at,'exact_card_grade_count',v_count);
end $$;

create or replace function public.admin_complete_rcg_grading(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare uid uuid:=auth.uid(); uname text; o public.repo_rcg_grading_orders%rowtype;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select lower(btrim(username)) into uname from public.characters where user_id=uid;
  if uname is distinct from 'admin' then raise exception 'Admin test access denied'; end if;
  select * into o from public.repo_rcg_grading_orders where id=p_order_id and user_id=uid for update;
  if not found then raise exception 'RCG grading order not found'; end if;
  if o.status='grading' then perform public.repo_rcg_finalize_order_internal(o.id,true); end if;
  return jsonb_build_object('order_id',o.id,'completed',true);
end $$;

create or replace function public.set_my_rcg_slab_binder_layout(p_layout jsonb)
returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare uid uuid:=auth.uid(); uname text; v jsonb:=coalesce(p_layout,'[]'::jsonb); e jsonb; sid uuid; seen uuid[]:='{}'::uuid[];
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if jsonb_typeof(v)<>'array' then raise exception 'Slab binder layout must be an array'; end if;
  if jsonb_array_length(v)>1200 then raise exception 'Slab binder layout is too large'; end if;
  for e in select value from jsonb_array_elements(v) loop
    if jsonb_typeof(e)='null' then continue; end if;
    if jsonb_typeof(e)<>'string' then raise exception 'Slab slots contain slab IDs or null'; end if;
    begin sid:=trim(both '"' from e::text)::uuid; exception when others then raise exception 'Invalid slab ID in layout'; end;
    if not exists(select 1 from public.repo_rcg_slabs s join public.repo_rcg_grading_orders o on o.id=s.grading_order_id where s.id=sid and s.user_id=uid and o.reveal_status) then raise exception 'Layout contains a slab you do not own'; end if;
    if sid=any(seen) then raise exception 'A slab cannot occupy multiple slots'; end if; seen:=array_append(seen,sid);
  end loop;
  select username into uname from public.characters where user_id=uid;
  insert into public.repo_rcg_slab_binder_layouts(user_id,username,layout,updated_at) values(uid,uname,v,clock_timestamp())
  on conflict(user_id) do update set username=excluded.username,layout=excluded.layout,updated_at=clock_timestamp();
  return v;
end $$;

create or replace function public.set_my_rcg_favourite_slab(p_slab_id uuid)
returns jsonb language plpgsql security definer set search_path='public','auth' as $$
declare uid uuid:=auth.uid(); current_fav uuid; make_fav boolean;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  if not exists(select 1 from public.repo_rcg_slabs where id=p_slab_id and user_id=uid) then raise exception 'Slab not found'; end if;
  select id into current_fav from public.repo_rcg_slabs where user_id=uid and is_favourite limit 1;
  make_fav:=current_fav is distinct from p_slab_id;
  update public.repo_rcg_slabs set is_favourite=false where user_id=uid and is_favourite;
  if make_fav then update public.repo_rcg_slabs set is_favourite=true where id=p_slab_id and user_id=uid; end if;
  return jsonb_build_object('favourite_slab_id',case when make_fav then p_slab_id else null end);
end $$;

create or replace function public.get_public_rcg_collection(p_username text)
returns jsonb language plpgsql stable security definer set search_path='public','auth' as $$
declare uid uuid:=auth.uid(); target_uid uuid; uname text; v jsonb;
begin
  if uid is null then raise exception 'Sign in required'; end if;
  select user_id,username into target_uid,uname from public.characters where lower(username)=lower(btrim(p_username)) limit 1;
  if target_uid is null then raise exception 'Player not found'; end if;
  if lower(uname)='admin' and target_uid<>uid then raise exception 'This graded collection is private'; end if;
  select jsonb_build_object('username',uname,'server_now',clock_timestamp(),
    'slabs',(select coalesce(jsonb_agg(jsonb_build_object('slab_id',s.id,'card_id',s.card_id,'card_set',s.card_set,'card_variant',s.card_variant,'print_serial',s.print_serial,'grade',s.grade,'certification_number',s.certification_number,'is_favourite',s.is_favourite,'created_at',s.created_at) order by s.created_at),'[]'::jsonb) from public.repo_rcg_slabs s join public.repo_rcg_grading_orders o on o.id=s.grading_order_id where s.user_id=target_uid and o.reveal_status),
    'layout',coalesce((select layout from public.repo_rcg_slab_binder_layouts where user_id=target_uid),'[]'::jsonb)
  ) into v;
  return v;
end $$;

-- Authenticated RPC surface only. Internal helpers/tables remain inaccessible.
revoke all on function public.submit_rcg_grading(text), public.get_my_rcg_state(), public.reveal_rcg_return(uuid), public.admin_complete_rcg_grading(uuid), public.set_my_rcg_slab_binder_layout(jsonb), public.set_my_rcg_favourite_slab(uuid), public.get_public_rcg_collection(text) from public,anon;
grant execute on function public.submit_rcg_grading(text), public.get_my_rcg_state(), public.reveal_rcg_return(uuid), public.admin_complete_rcg_grading(uuid), public.set_my_rcg_slab_binder_layout(jsonb), public.set_my_rcg_favourite_slab(uuid), public.get_public_rcg_collection(text) to authenticated;

-- Finalise due orders even when nobody has the website open. pg_cron 1.6 supports
-- second-based intervals; one-second server sweep keeps offline finalisation aligned tightly to the exact ready_at timestamp.
do $$ declare jid bigint; begin
  for jid in select jobid from cron.job where jobname='repo-rcg-finalize-due' loop perform cron.unschedule(jid); end loop;
end $$;
select cron.schedule('repo-rcg-finalize-due','1 second','select public.repo_rcg_finalize_due_orders();');


-- V20.37 public pending-card sync: public raw binders also show an empty slot while a physical card is at RCG.
create or replace function public.get_public_rcg_collection(p_username text) returns jsonb language plpgsql stable security definer set search_path='public','auth' as $$
declare uid uuid:=auth.uid();target_uid uuid;uname text;v jsonb;
begin
 if uid is null then raise exception 'Sign in required';end if;
 select user_id,username into target_uid,uname from public.characters where lower(username)=lower(btrim(p_username)) limit 1;
 if target_uid is null then raise exception 'Player not found';end if;
 if lower(uname)='admin' and target_uid<>uid then raise exception 'This graded collection is private';end if;
 select jsonb_build_object('username',uname,'server_now',clock_timestamp(),'pending_cards',(select coalesce(jsonb_agg(o.card_id),'[]'::jsonb) from public.repo_rcg_grading_orders o where o.user_id=target_uid and o.status='grading'),'slabs',(select coalesce(jsonb_agg(jsonb_build_object('slab_id',s.id,'card_id',s.card_id,'card_set',s.card_set,'card_variant',s.card_variant,'print_serial',s.print_serial,'grade',s.grade,'certification_number',s.certification_number,'is_favourite',s.is_favourite,'created_at',s.created_at) order by s.created_at),'[]'::jsonb) from public.repo_rcg_slabs s join public.repo_rcg_grading_orders o on o.id=s.grading_order_id where s.user_id=target_uid and o.reveal_status),'layout',coalesce((select layout from public.repo_rcg_slab_binder_layouts where user_id=target_uid),'[]'::jsonb)) into v;return v;
end $$;
revoke all on function public.get_public_rcg_collection(text) from public,anon;grant execute on function public.get_public_rcg_collection(text) to authenticated;
