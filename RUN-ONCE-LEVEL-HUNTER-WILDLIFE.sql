-- Level Hunter wildlife save state
-- Safe to run more than once. Does not alter existing Repo Sports / TCG tables.

create table if not exists public.level_hunter_wildlife_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.level_hunter_wildlife_saves enable row level security;

drop policy if exists "level hunter wildlife select own" on public.level_hunter_wildlife_saves;
create policy "level hunter wildlife select own"
on public.level_hunter_wildlife_saves
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "level hunter wildlife insert own" on public.level_hunter_wildlife_saves;
create policy "level hunter wildlife insert own"
on public.level_hunter_wildlife_saves
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "level hunter wildlife update own" on public.level_hunter_wildlife_saves;
create policy "level hunter wildlife update own"
on public.level_hunter_wildlife_saves
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update on public.level_hunter_wildlife_saves to authenticated;
