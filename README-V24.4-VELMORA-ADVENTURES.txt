V24.4 — VELMORA ADVENTURES PHASE 2.3 — CONTENT DENSITY

Apply over V24.3/current.

This patch adds the frontend for the live Phase 2.3 local-activity system.
The Supabase Phase 2.3 schema/content migrations are already live. Do not run SQL.

New gameplay:
- 41 server-owned local activities across the 10 current Canto Plains locations.
- 4 activities in every location, with Redbank Hollow containing 5.
- Each activity has an actual stat check, world-time cost and cooldown.
- First successful clear grants a modest one-time reward and permanently marks the activity mastered.
- Many activities create persistent field notes/lore/collectible discoveries.
- 8 new keepsake/document items can be earned from specific discoveries.
- Repeating a mastered activity is allowed after cooldown for flavour, but does not repeat the first-clear reward.
- Local activity mastery appears in the game side rail and Codex.

Frontend changes:
- Local Life horizontal activity rail integrated into each location.
- Activity result presentation with die roll, DC, degree of success and narrative outcome.
- First-clear reward presentation.
- Existing Phase 2.2 travel/dialogue/dice/game-feel systems preserved.

No Repo Sports, Reparty, TCG, RCG, World Cup or other site systems are included.
