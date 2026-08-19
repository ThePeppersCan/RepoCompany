V24.0 — VELMORA ADVENTURES / PHASE 1
======================================

Apply this small overlay over the current V23.7/current website root.

FILES IN THIS PATCH
- index.html                two new cache-busted Adventures asset references only
- adventures-v1.js         Velmora Adventures Phase 1 client/game UI
- adventures-v1.css        namespaced Adventures presentation + responsive layout
- velmora-adventures-phase1.sql  REFERENCE COPY ONLY — the live Supabase migration is already applied
- QA-V24.0-ADVENTURES.txt  verification notes

NO SQL NEEDS TO BE RUN.
Live Supabase migrations already applied:
- velmora_adventures_phase1_foundations
- velmora_adventures_phase1_icon_consistency

WHAT IS LIVE IN PHASE 1
- VELMORA ADVENTURES entry inside the existing QUESTS journal without replacing Cook's Assistant
- persistent one-save-per-account Adventure character
- 16 homelands, 18 backgrounds, 9 archetypes
- server-calculated balanced starting stats/equipment
- separate Adventure XP, Adventure level, HP and Velmoran Gold
- starter Elvane / Canto Plains vertical slice
- Canto Crossing, Willowmere, Canto Plains East Verge, Riverglass Ford, Animal Centre gate
- connected-location travel, world day/time advancement and weather
- persistent inventory, equipment, discoveries and professions
- server-side d20 checks and degrees of success
- daily server-owned starter job board with one-time rewards
- first authored main-story seed: The Little Things — A Very Ordinary Parcel
- grounded mystery outcome and persistent odd brass token
- quest journal, jobs, map, inventory and character panels
- typed free-action box with a safe Phase 1 intent interpreter
- AdventureNarrator abstraction/fallback; narrator output cannot directly mutate game state
- auto-save after meaningful actions plus server heartbeat/play-time tracking
- Adventures-only reset flow
- hidden CatAsthma Adventures debug panel
- responsive desktop/mobile layout

SERVER AUTHORITY
Reward values, quest completion, items, travel, checks, character creation and job completion are validated by SECURITY DEFINER RPCs. User-state Adventure tables are not directly writable by authenticated browser clients. Duplicate reward sources are protected by a unique server reward ledger.

IMPORTANT BALANCE DECISION
Phase 1 DOES NOT grant existing main-site skill XP yet. The schema can support cross-site XP later, but it is deliberately held back until Adventures completion-time/risk data can be balanced against the existing site economy. Phase 1 Adventure rewards currently affect only Adventure XP, Adventure Gold and Adventure profession XP.

NOT IMPLEMENTED YET (BY DESIGN)
This is not pretending later phases are complete. Full NPC schedules/memory gameplay, AI freeform action provider, procedural quest generation, wildlife/herbalism systems, combat, crime, crafting, community construction and world-scale travel are later phases. Foundation tables/abstractions exist where needed so those systems can be added without replacing Phase 1 saves.

UNRELATED SYSTEMS
No Repo Sports JS/CSS, World Cup, TCG, RCG, Animal Centre, Reparty game functions, existing quest RPCs or existing characters table schema were changed by this frontend patch. The database migration is additive and creates adventure_* objects only.
