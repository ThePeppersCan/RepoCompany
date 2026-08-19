V22.20.1 — REPO SPORTS PLAYER GOAL PARITY FIX

Apply over V22.20.

Changes:
- fixes player-level scoring imbalance while preserving team 50/50 fairness
- removes fixed ATTACKER scoring advantages
- all 3 player roles now have equal finishing conversion
- advanced runner assignment is equal/seeded rather than attacker-weighted
- normal penalties are shared equally instead of always taken by the attacker
- movement access relevant to scoring is normalized across roles
- passing/defending role differences remain
- index + Repo Sports test page cache-busted so browsers load the fix immediately

No Supabase migration is required.
No historical leaderboard totals are modified by this patch.
