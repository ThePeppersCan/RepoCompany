REPO COMPANY — V22.18.3 PASSPORT WEEKLY XP FIX

Cause of the inflated weekly XP:
- The Passport tracked weekly XP in browser localStorage by comparing total account XP snapshots.
- Temporary/partial character renders could lower the stored baseline and then count the same XP again when the full character state returned.
- passportTotalExp also includes the global Harmony counter, so it was not a safe per-user weekly source.

Fix:
- Weekly XP is now read from server-side daily_xp_totals for the signed-in user.
- Weekly reset is Europe/London Monday.
- Weekly TCG pack claim is server-authoritative and can only be claimed once per user/week.
- Claimed pack is added directly to bank_items.quidditch_tcg_pack.
- Old local weeklyXpState is discarded after the first successful server sync.
- Harmony lamp XP no longer double-writes daily_xp_totals.

CatAsthma verified live weekly XP at patch time: 61,451 XP (29,190 Monday + 32,261 Tuesday).

The included SQL migration has already been applied live.
