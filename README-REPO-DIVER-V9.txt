REPO DIVER V9 — LIVING WORLD + VISUAL OVERHAUL
================================================

INSTALL
Replace these files at their existing RepoCompany paths:
- index.html
- assets/repo-diver/data.js
- assets/repo-diver/engine.js
- assets/repo-diver/game.js
- assets/repo-diver/repo-diver.css

The Repo Diver asset URLs in index.html are cache-busted to:
repo-diver-v9-living-world-visual-overhaul-20260815-0200

BACKEND
The required Supabase Phase 4 migrations have already been applied to the live RepoCompany project.
Do NOT run an additional migration from this ZIP.

PHASE 4 V9 CONTENT
- New illustrated/clickable Repo Diver harbour hub rather than the old dive-card-only home screen.
- 16 named recurring NPCs with roles, dialogue flavour and career relationships.
- 40 persistent server-backed career story chapters.
- Three rotating daily harbour contracts backed by server-side baselines and one-time claims.
- Persistent R.C. Tideline vessel with six upgrade categories.
- Daily weather state and day/night expedition selection.
- Weather/night state now reaches the underwater expedition engine.
- Vessel sonar can increase scouting contacts; crane progression can add salvage opportunities.
- Underwater C-key marine camera with server-validated photo records and research progress.
- 10 legendary hunt files, one for each biome, each structured as a six-stage hunt.
- 50 achievement definitions and research/career presentation.
- Existing 120 fish, 70 recipes, 10 biomes, diving, harpoon, cargo, Fish House and server-authoritative reward loop preserved.

VISUAL OVERHAUL
- Fish House game world widened substantially so the restaurant is the focus rather than side panels.
- Commercial-kitchen styling: refrigeration, prep bench, range/grill, shelves, pass, marine window and aquarium.
- Dining furniture and lighting materially upgraded from primitive circles/rectangles.
- Buttons and interaction surfaces redesigned away from generic website-button styling.
- Explicit CSS reset removes global RepoCompany button chrome/pseudo-elements from in-world diner characters.
- Customer and staff anatomy restyled so characters read as people rather than boxed UI elements.
- Harbour has layered sea/sky/pier scenery, weather treatment, buildings, vessel and visible NPC actors.

ECONOMY
The deliberate Repo Diver GP nerf remains in place. Phase 4 contracts primarily award modest skill XP and Fish House reputation rather than becoming a new GP printer.

TESTING
See V9_TEST_REPORT.txt.
The Node integration/regression suite exercises the real Repo Diver data/engine/game scripts through expedition creation, weather/night/boat state, camera research, cargo validation, harpoon state, surface, Fish House cooking, serving, customer leaving and completion payout.

Local Chromium visual navigation is blocked by the execution environment's local/file URL policy, so no browser screenshot claim is made in this package. The visual layer was verified statically for DOM/CSS structure and duplicate IDs, while gameplay logic was executed through the Node regression harness.
