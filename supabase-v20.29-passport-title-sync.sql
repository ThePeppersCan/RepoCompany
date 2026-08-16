-- REPO COMPANY V20.29 — persistent public Repo Passport titles
-- Already applied to the live Supabase project by ChatGPT on 2026-08-16.

alter table public.characters add column if not exists passport_title text not null default 'The Adventurer';
-- Live migration also installs authenticated RPCs:
--   set_my_passport_title(text)
--   get_my_passport_title()
--   get_passport_titles(text[])
-- The full migration is recorded in Supabase as: persist_repo_passport_titles
