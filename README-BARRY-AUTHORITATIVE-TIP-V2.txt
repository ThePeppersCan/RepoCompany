BARRY BRAMBLE TIPPING — AUTHORITATIVE V2 FIX

This is a backend + client repair, not another visual button reset.

WHY THE OLD FIX COULD STILL FAIL
The old Supabase tipping RPC was designed around the original 235-second wall-clock match id. The current Quidditch league now has an authoritative shared clock and can extend during sudden death / post-match. The browser could therefore display the real new match while the old tip RPC rejected it as stale/ended.

WHAT THIS PATCH CHANGES
- Removes the competing legacy Barry click handlers from script.js.
- Uses one Barry tipping controller only.
- Adds V2 Supabase RPCs that resolve the current match from quidditch_live_clock on the SERVER.
- The server no longer rejects a valid click because the browser supplied an old match-slot id.
- Still charges exactly 200 GP.
- Still only permits one tip per account per authoritative match.
- Resets automatically as soon as the shared match id changes.
- Preserves the historical community tip total where the old total RPC is available.
- Keeps Barry's Boater 250,000 GP community unlock.

INSTALL
1. Run fix-barry-bramble-authoritative-tipping.sql ONCE in Supabase SQL Editor.
2. Replace index.html and script.js from this patch.
3. Redeploy and hard refresh.

No other World Cup, TCG, binder, Meet the Teams or cosmetic systems are changed.
