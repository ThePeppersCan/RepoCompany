CANTO PLAINS PATHING FIX

Replace / merge:
1. script.js
2. assets/canto-plains-collision-mask.png

Changes:
- Rebuilt Canto Plains collision from the supplied red-line navigation reference.
- Removed the old inaccurate hand-authored route-segment restriction that made visible paths unwalkable.
- Water is now a hard collision area, including the central rivers and lower wetlands.
- Bridges remain the legal river crossing points because the collision mask follows the actual map artwork.
- Broad land pockets around the supplied route reference remain traversable, so exploration is much less restrictive.
- Hunter player sprite reduced from 56x66 to 48x57 for better world scale.
- Existing Canto Plains art, POIs, music, Elvane progression, Repo Sports, and other site systems are unchanged.

Hard refresh after replacing files: Ctrl + Shift + R.
