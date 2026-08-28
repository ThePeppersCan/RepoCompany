-- Dragonbound V34.23 — allow multiple Career Mode saves per account.
-- Applied to the live Supabase project on 2026-08-27.
-- Included here for source control / environment parity.

drop index if exists public.dragonbound_career_saves_one_per_user_idx;
