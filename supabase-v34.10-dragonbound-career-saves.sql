-- Dragonbound Career Mode: account-owned, cross-device career saves.
-- Applied to the live Velmora Supabase project for V34.10.

create table if not exists public.dragonbound_career_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_username text not null default '',
  save_name text not null,
  team_id text not null,
  sponsor text not null,
  racer text not null,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_played_at timestamptz not null default now(),
  constraint dragonbound_career_saves_team_id_length check (char_length(team_id) between 2 and 40),
  constraint dragonbound_career_saves_name_length check (char_length(save_name) between 2 and 80)
);

create index if not exists dragonbound_career_saves_owner_updated_idx
  on public.dragonbound_career_saves (user_id, updated_at desc);

alter table public.dragonbound_career_saves enable row level security;

revoke all on public.dragonbound_career_saves from authenticated;
grant select, insert, update, delete on public.dragonbound_career_saves to authenticated;
revoke all on public.dragonbound_career_saves from anon;

drop policy if exists "Career saves are readable by their owner" on public.dragonbound_career_saves;
create policy "Career saves are readable by their owner"
  on public.dragonbound_career_saves
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Career saves are creatable by their owner" on public.dragonbound_career_saves;
create policy "Career saves are creatable by their owner"
  on public.dragonbound_career_saves
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Career saves are updateable by their owner" on public.dragonbound_career_saves;
create policy "Career saves are updateable by their owner"
  on public.dragonbound_career_saves
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Career saves are deletable by their owner" on public.dragonbound_career_saves;
create policy "Career saves are deletable by their owner"
  on public.dragonbound_career_saves
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
