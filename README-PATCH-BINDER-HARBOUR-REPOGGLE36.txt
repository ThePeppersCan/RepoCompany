REPO COMPANY V18.1 — PATCH BINDER / HARBOUR / REPOGGLE 36 FIX
16 August 2026

FIXES
1. QUIDDITCH TCG PATCH CARDS
- Added all 17 Patch card IDs to the actual Binder V3 local catalogue.
- Binder V3 can now recognise owned Patch cards instead of filtering them out as unknown IDs.
- Auto-expanding spreads allocate the extra slots automatically.
- Added a PATCH filter to Hidden Cards storage.
- Patch cards retain their existing images and ownership. No collection reset or DB rewrite.

2. REPO DIVER — ZERO-FISH / ZERO-MENU RETURN
- If an expedition returns without a menu-grade fish, the Fish House button becomes:
  SAVE EXPEDITION & RETURN TO HARBOUR.
- The run now finalises with 0 customers / 0 dishes instead of trapping the player on the menu screen.
- Depth, salvage, campaign/endgame progress and eligible expedition rewards still save through the normal completion path.
- Normal Fish House service is unchanged when a valid menu is available.

3. REPOGGLE LEVEL 36 — ANCIENT DRAGON
- Rebuilt the board with exposed wing/body rails and two paired portal routes.
- Removed the rotating shield that could seal required pegs behind inaccessible geometry.
- Required targets are now 24 single-hit charged runes, with 8 separate armoured challenge pegs.
- Orbs increased from 8 to 10; score thresholds adjusted modestly for the rebuilt board.
- A shorter centre spinner keeps the level difficult without blocking required routes.

INSTALL
Replace the included files/folders over the current V18.1 gameplay-polish build.
No SQL is required for this update.
