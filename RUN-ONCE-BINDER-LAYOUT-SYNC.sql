
-- Repo Company / Quidditch TCG
-- Account-backed binder layout + Card Storage state.
-- Run once in Supabase SQL Editor.

create table if not exists public.quidditch_tcg_binder_layouts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  layout jsonb not null default '[]'::jsonb,
  storage jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists quidditch_tcg_binder_layouts_username_key
  on public.quidditch_tcg_binder_layouts ((lower(username)));

alter table public.quidditch_tcg_binder_layouts enable row level security;
revoke all on table public.quidditch_tcg_binder_layouts from anon, authenticated;

create or replace function public.set_my_quidditch_tcg_binder_layout(
  p_username text,
  p_layout jsonb,
  p_storage jsonb default '[]'::jsonb
)
returns table(username text, layout jsonb, storage jsonb, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_username text := left(trim(coalesce(p_username,'')),80);
  v_layout jsonb := case when jsonb_typeof(coalesce(p_layout,'[]'::jsonb))='array' then coalesce(p_layout,'[]'::jsonb) else '[]'::jsonb end;
  v_storage jsonb := case when jsonb_typeof(coalesce(p_storage,'[]'::jsonb))='array' then coalesce(p_storage,'[]'::jsonb) else '[]'::jsonb end;
begin
  if v_uid is null then raise exception 'Sign in required'; end if;
  if v_username = '' then raise exception 'Username required'; end if;
  if jsonb_array_length(v_layout) > 200 then raise exception 'Binder layout is too large'; end if;
  if jsonb_array_length(v_storage) > 200 then raise exception 'Binder storage is too large'; end if;

  insert into public.quidditch_tcg_binder_layouts(user_id,username,layout,storage,updated_at)
  values(v_uid,v_username,v_layout,v_storage,now())
  on conflict(user_id) do update set
    username=excluded.username,
    layout=excluded.layout,
    storage=excluded.storage,
    updated_at=now();

  return query
    select b.username,b.layout,b.storage,b.updated_at
    from public.quidditch_tcg_binder_layouts b
    where b.user_id=v_uid;
end;
$$;

create or replace function public.get_my_quidditch_tcg_binder_layout()
returns table(username text, layout jsonb, storage jsonb, updated_at timestamptz)
language sql
security definer
set search_path = public, auth
as $$
  select b.username,b.layout,b.storage,b.updated_at
  from public.quidditch_tcg_binder_layouts b
  where b.user_id=auth.uid()
  limit 1;
$$;

create or replace function public.get_public_quidditch_tcg_binder_layout(p_username text)
returns table(username text, layout jsonb, storage jsonb, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select b.username,b.layout,b.storage,b.updated_at
  from public.quidditch_tcg_binder_layouts b
  where lower(b.username)=lower(trim(coalesce(p_username,'')))
  order by b.updated_at desc
  limit 1;
$$;

grant execute on function public.set_my_quidditch_tcg_binder_layout(text,jsonb,jsonb) to authenticated;
grant execute on function public.get_my_quidditch_tcg_binder_layout() to authenticated;
grant execute on function public.get_public_quidditch_tcg_binder_layout(text) to anon, authenticated;
