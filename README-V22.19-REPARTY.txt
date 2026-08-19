V22.19 — REPARTY
================
Base: V22.18.3-PASSPORT-WEEKLY-XP-FIX

WHAT THIS PATCH CHANGES
- Replaces ONLY the homepage QUIDDITCH activity tile with REPARTY.
- Does not remove or alter the separate Repo Sports / World Cup systems.
- Adds a dedicated Reparty modal/game hub with 12 fast minigames.
- Every Reparty room has 6 contestants, with up to 4 real players and bots filling the rest.
- Humans can drop in between rounds; bots keep the room playable when nobody else is online.
- Rewards persistent GP plus existing Velmora skill XP. No separate Party Points currency.
- Standard prize pot is 25,000 GP split 30/22/17/13/10/8 by placement. Bots can take prize shares, limiting raw GP creation.
- Adds Firemaking, Herblore and Construction XP fields because those three Reparty reward skills did not previously have persistent character XP columns.
- Reparty XP is included in the existing daily/weekly XP tracking function.
- Includes AFK/participation checks and one-claim-per-account-per-round reward protection.
- Includes anti-repeat game selection and occasional Double Gold / Double XP / Jackpot / Mystery rounds.

INITIAL MINIGAMES
1. Goblin Bomb Party — Firemaking
2. Potion Panic — Herblore
3. Fishing Frenzy — Fishing
4. Chopping Frenzy — Woodcutting
5. Builder Blitz — Construction
6. Minecart Mayhem — Mining
7. Rooftop Rush — Agility
8. Chicken Chase — Farming
9. Treasure Tiles — Agility
10. Goblin Says — Magic
11. Gold Rush — Mining
12. Don't Wake The Troll — Slayer

FILES IN THIS PATCH
- index.html
- script.js
- reparty-v1.js
- reparty-v1.css
- supabase-v22.19-reparty.sql
- README-V22.19-REPARTY.txt

SUPABASE
The V22.19 Reparty database migration has ALREADY been applied to the connected live Velmora Supabase project.
The included SQL file is retained for audit/recovery/reference. Do not manually re-run it unless you intentionally need to recreate/repair the Reparty backend.

NOTES
- The Reparty backend is authoritative for room state, round timing, placements/reward claims and persistent rewards.
- Client minigames submit bounded score/participation values to the backend; this is an appropriate V1 architecture but is not a claim of cheat-proof competitive netcode.
- The implementation is intentionally isolated in reparty-v1.js/reparty-v1.css so additional minigames can be added later without bloating the main game script further.
