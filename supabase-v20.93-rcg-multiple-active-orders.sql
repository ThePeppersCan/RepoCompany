-- Repo Company V20.93 — allow multiple simultaneous RCG grading orders.
-- Applied to the connected Supabase project on 2026-08-17.
update public.repo_rcg_config
set value_bigint = 50,
    updated_at = clock_timestamp()
where key = 'RCG_MAX_ACTIVE_ORDERS';
