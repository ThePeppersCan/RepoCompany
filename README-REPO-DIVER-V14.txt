REPO DIVER V14 — AUTHORED EXPEDITIONS & ARCHAEOLOGY
=====================================================

Frontend build: v14-authored-expeditions-20260815
Cache tag: repo-diver-v14-authored-expeditions-20260815-1623

WHAT CHANGED
- 36 persistent major underwater locations across all 18 dive regions.
- Four site families: wrecks, caves, ruins and research/industrial facilities.
- Physical site silhouettes in the open ocean with contextual E interaction.
- Distinct interior rendering, tighter indoor movement/camera and indoor wildlife.
- Five sequential chambers/stages per major site.
- Six specialist exploration tools; choose up to three before an expedition.
- Server-persistent site discovery, stage completion and first-discovery credit.
- 72 recoverable archaeology artifacts (two per site).
- Artifact identification at the Marine Institute; unidentified items do not reveal lore immediately.
- Archaeology ledger added to Research/Journal screens.
- Authored Expedition buttons let players deliberately return to known sites.
- Normal free-diving and E salvage remain available.
- Short location/mechanism/artifact audio cues, with no continuous white-noise bed.

SERVER
The V14 Supabase migration has ALREADY BEEN APPLIED to production.
Do not run REPO_DIVER_V14_EXPLORATION.sql unless deliberately rebuilding another database.

SERVER-AUTHORITATIVE SAFETY
- Authenticated user required.
- Discovery/advancement/recovery must reference the caller's active Repo Diver run.
- Location must belong to the active run biome.
- Site stages must advance sequentially.
- Artifact must belong to the site and its required chamber must already be reached.
- Artifact recovery is idempotent.
- First-discovery rows are written once.
- New V14 tables have no direct anon/authenticated table grants.
- Archaeology does not grant new GP/XP, preserving the existing economy.

DEPLOY
Replace index.html and assets/repo-diver/ with the files in this package.
The changed Repo Diver assets are cache-busted to V14.

TESTING
See V14_TEST_REPORT.txt. Node/engine/static integration tests were run. No browser automation is claimed.
