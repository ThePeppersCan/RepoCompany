LEVEL HUNTER — CANTO PLAINS MAJOR GAMEPLAY REDESIGN V3

Install:
1. Replace the site's current script.js with this script.js.
2. Keep all existing Level Hunter wildlife/food/forage/clue assets from the previous wildlife vertical-slice package.
3. Hard refresh (Ctrl+Shift+R).
4. No new SQL is required if the existing Level Hunter wildlife save table has already been created.

Main additions:
- First tutorial quest always has an accessible clover node while clover is required.
- Normal Canto expeditions reduced to 2–4 meaningful wildlife opportunities across the entire map.
- Normal forage reduced to 3–5 authored active nodes per expedition.
- No ordinary wildlife before the first Darwin wildlife tutorial is started/completed.
- Wildlife encounters use a focused premium in-world HUD and do not block normal movement.
- Encounter camera subtly tightens while keeping the world visible.
- Animals react to pressure, move away and visibly flee if crowded/chased.
- Food no longer completes encounters by itself; multiple meaningful decisions are required.
- Species are configured into different encounter archetypes (grazer, curious, burrow, tracked, bird, playful, wetland).
- Ctrl toggles crouch; crouching lowers speed/profile and reduces wildlife pressure.
- L holds Listen/Focus, temporarily lowering music and giving directional audio-style hints without detective vision.
- Proper authored fishing banks with cast, bobber, bite, hook and short tension/reel phase.
- Fishing can provide food/resources or reveal an aquatic wildlife encounter.
- Field Satchel redesigned as a premium item grid + selected-item field notes.
- Wildlife Journal redesigned as a book-like collection screen with species detail pages.
- Darwin gains contextual "Ask for a field tip" dialogue while following the player.
- Forage gathering has a short action commitment and lower yields.
- Developer F8 wildlife overlay remains available only in admin test mode.

Temporary art note:
The fishing rod/line/bobber are currently rendered as pixel-styled CSS placeholders because no dedicated player fishing sprite/rod animation has been supplied yet. The system is structured so a proper fishing sprite can replace this later without changing fishing logic.
