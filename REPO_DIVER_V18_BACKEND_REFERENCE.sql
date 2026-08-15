-- REPO DIVER V18 — GOLD MASTER BACKEND SECURITY REFERENCE
-- ALREADY APPLIED LIVE TO SUPABASE PROJECT hvdrwmjieguurxvrgzfu.
-- DO NOT RUN THIS FILE FOR DEPLOYMENT.

-- Gold Master security hardening: core catalog data is readable by the app
-- through its existing access paths, but anon/authenticated clients must not
-- be able to directly mutate biome, catch, recipe, or upgrade definitions.
revoke insert, update, delete on table public.repo_diver_biome_catalog from anon, authenticated;
revoke insert, update, delete on table public.repo_diver_catch_catalog from anon, authenticated;
revoke insert, update, delete on table public.repo_diver_recipe_catalog from anon, authenticated;
revoke insert, update, delete on table public.repo_diver_upgrade_catalog from anon, authenticated;
