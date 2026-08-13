CANTO PLAINS MOVEMENT HARD FIX

Replace ONLY script.js.

Changes:
- Collision data is embedded directly in script.js, removing the external mask loading/race that could freeze movement.
- Same strict authored walkable network is retained.
- Movement uses small collision substeps for smoother narrow-path navigation.
- Hunter sprite is slightly smaller again.
- Camera is zoomed in slightly more.

No index.html changes. No SQL.
Hard refresh: Ctrl + Shift + R.
