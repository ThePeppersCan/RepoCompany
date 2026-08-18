REPO SPORTS — V22.10.2 BINDER CATALOG SYNC FIX

Actual bug found:
- The main TCG CARD_CATALOG contains 193 cards.
- A later V3 binder module had its own duplicated local catalogue with 114 entries.
- That local catalogue is what generated "x of 167 current cards collected".

Fix:
- Removed the stale duplicate binder catalogue.
- Binder now derives directly from window.__repoTcgCardCatalog, the same master catalogue used by packs/collection logic.
- Future cards added to the master catalogue automatically appear in the binder count.
- Added BLACK LABEL and OFF THE BROOM categories to Hidden Cards.
- New cache key forces the corrected script to load.

Expected current binder count: 193 cards.
No Supabase migration required.
