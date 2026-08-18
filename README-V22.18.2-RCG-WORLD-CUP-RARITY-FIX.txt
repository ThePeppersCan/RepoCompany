V22.18.2 — RCG WORLD CUP RARITY FIX

Cause:
The authoritative Supabase function repo_rcg_card_set() did not recognise wc2026_* IDs. They fell through to Standard, so submit_rcg_grading_v2 rejected them even though the frontend catalogue marked them Full Art / guaranteed RCG 10.

Fix:
- wc2026_* now resolves server-side as World Cup 2026.
- repo_rcg_card_variant follows the same classification.
- World Cup guaranteed-RCG-10 configuration is unchanged.
- World Cup uniqueness / physical-lineage protections are unchanged.
- RCG submission UI now explicitly labels wc2026_* cards WORLD CUP 2026.
- Auxiliary frontend rarity resolver now treats wc2026_* as non-standard/full-art class.

The SQL migration in this bundle was already applied live on 2026-08-18.
