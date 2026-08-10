REPO COMPANY — Account Cosmetics + World Cup nametag cleanup

Upload/merge this patch into the website root.

Replace:
- index.html
- script.js

Merge/replace these assets:
- assets/nametags/world-cup-kordesh.png
- assets/nametags/world-cup-nambara.png
- assets/nametags/world-cup-zafran.png

Changes:
1. Kordesh, Nambara and Zafran World Cup nametags
   - Removed detached/corrupt transparent-side artwork that made the shop previews look broken.
   - Re-centred the intact plaque artwork without redrawing it.
   - Updated text-safe zones so pet names sit in the intended dark name area.
   - Added a cache version to these three art references so browsers do not keep the broken copies.
   - World Cup tags keep their proper proportions in both Quidditch and the roaming pet room.

2. Account Cosmetics
   - New ACCOUNT COSMETICS button directly beside LEADERBOARD under the professional Skill Tree.
   - Purchased Party Pete Watchcard backdrops no longer render as Bank items.
   - Existing purchases are not lost: the same persistent ownership data is used.
   - Account Cosmetics shows all owned Watchcard backdrops, the currently equipped backdrop, and EQUIP / UNEQUIP controls.
   - Party Pete purchases now say they were added to Account Cosmetics rather than the Bank.
   - Pet name tags/equipment remain in the separate PET COSMETICS screen.

No new Supabase SQL is required for this patch.
