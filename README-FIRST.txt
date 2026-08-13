REPO SPORTS LEAGUE HUB + LEVEL HUNTER INTEGRATED FIX

This fixes the regression where the Repo Sports button skipped the League Hub and opened the live game directly.

Replace / merge:
- index.html
- script.js
- assets/velmora-animal-centre-menu.png
- assets/velmora-animal-centre-explore-map.png
- assets/velmora-elvane-region-map.png
- assets/hunter-menu-garden-ambience.mp3
- assets/elvane-saltarello.mp3

Expected Repo Sports flow after this patch:
REPO SPORTS button -> League Hub menu -> WATCH LIVE -> live Club Mode broadcast.

Level Hunter work preserved:
- Animal Centre menu
- invisible image hotspots
- ambience + click effects
- Explore Velmora map
- Elvane-only default unlock
- Elvane regional progression map
- Canto Plains / Elvara initial unlock
- Solmere then Valeron progression
- Saltarello audio in Elvane
- admin unlock-all toggle

No SQL required.
Hard refresh after replacing files: Ctrl + Shift + R.
