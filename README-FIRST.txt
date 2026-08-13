LEVEL HUNTER — ELVANE REGION MAP

Merge into the website root:
- index.html
- script.js
- assets/velmora-elvane-region-map.png
- assets/elvane-saltarello.mp3

Changes:
- Clicking Elvane on Explore Velmora opens the Elvane regional map.
- Canto Plains + Elvara are the starting unlocked section.
- Solmere Vineyards is locked until the starting section reaches 60% completion.
- Valeron Valley is locked until Solmere reaches 60% completion.
- Existing Hunter admin Unlock All Regions preview also unlocks all Elvane areas.
- Elvane map hotspots are completely invisible; only subtle glow/ripple feedback is used.
- Saltarello starts when Elvane opens at 30% volume and stops when leaving the Elvane map.
- Garden ambience resumes when returning to Explore Velmora.

Future Hunter activities can advance progression with:
window.repoSetHunterElvaneCompletion('east', 0.60)
window.repoSetHunterElvaneCompletion('solmere', 0.60)

No SQL required.
Hard refresh after install: Ctrl + Shift + R.
