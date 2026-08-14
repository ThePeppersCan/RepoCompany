-- Already applied to production Supabase by ChatGPT on 2026-08-14.
-- Included here for repository history only.
update public.repo_diver_recipe_catalog
set base_price = greatest(1, round(base_price / 3.0)::integer);

update public.repo_diver_catch_catalog
set value_gp = greatest(1, round(value_gp / 3.0)::integer)
where kind = 'treasure';
