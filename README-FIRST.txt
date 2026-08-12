REPOCOMPANY — MULTI-FIX 2026-08-12

Fixes in this build:
1. Repo Rooftops: final-height / validated-route pending-save bug.
2. Harmony: rapid clicks still queue instantly AND confirmed XP refreshes Daily + Global XP while clicking.
3. Goblin Party: anti-oscillation escape logic for goblins trapped in left/right pathfinding loops.
4. Repo Sports League Hub: menu music is primed on click and fades in roughly one second earlier.

INSTALL ORDER
1. In Supabase SQL Editor, run:
   RUN-ONCE-IN-SUPABASE-fix-rooftops-final-height-validation.sql
2. Copy/replace all files from this ZIP into your web root, preserving the assets folder structure.
3. Ctrl + Shift + R.

IMPORTANT FOR THE EXISTING 12,287m PENDING ROOFTOPS RUN
Do NOT clear browser site data/localStorage. The run is already stored locally. After the SQL + files are installed,
reload the site; the patched client retries any unconfirmed final rooftop records and then retries the idempotent reward claim.
It cannot duplicate-pay a run that was already claimed.


2026-08-12 — LEAGUE CLUB MAP UPDATE
- repo-sports-league-map.png replaced with NEWMAPPYCLUBBYWUBBY.png.
- Map wrapper aspect ratio updated to 1676:938 so hotspot alignment remains exact.
- All 18 club hotspots moved to the plaques shown on the new map.
- Saint Ciro hotspot added.
- Each hotspot still opens its matching collector-spread lore archive and keeps the existing hover/shine/press effects.
