CANTO PLAINS — STUCK SPAWN FIX

Replace:
- script.js
- assets/canto-plains-collision-mask.png

Fixes:
- Canto Plains now waits for the collision mask to fully load before movement starts.
- Spawn is validated and automatically snapped to the nearest legal walkable path tile if needed.
- Narrow legitimate paths are slightly more forgiving around the character's feet while water/off-path terrain remains blocked.
- Character size and slower walking speed from the previous patch are preserved.

Hard refresh afterwards: Ctrl + Shift + R.
