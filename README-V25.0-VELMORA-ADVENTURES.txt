V25.0 — VELMORA ADVENTURES PHASE 3
Dynamic Narrative & Emergent Adventure Engine

Apply over V24.4/current.

Included frontend:
- index.html
- adventures-v3.css
- adventures-v3.js

Phase 3 adds:
- strict structured free-text intent interpretation with server validation
- 52 grounded world features across the 10 Canto locations
- contextual d20 checks, profession/situational modifiers and success-with-complication support
- wait/rest commands and world-time-aware NPC schedules
- free-text NPC questions, bounded NPC knowledge, approved rumours, structured player-to-NPC facts and memories
- item showing/giving with inventory validation and quest-item safety
- local reputation and temporary NPC mood presentation
- 10 small dynamic event templates with expiry and one-time server-owned rewards
- 10 approved procedural microquest templates with bounded reward bands
- separate investigation clues vs ordinary discoveries
- improved returning-player/session recap
- Adventure-only admin narrator/debug and event controls
- command history and rotating RPG command examples
- legacy Phase 1/2/2.3 interactions now refresh Phase 3 time/event/mood state after they advance world time

Authoritative changes stay server-owned. Narrator/provider output never selects RPC names, rewards, SQL or direct state mutation.
The deterministic interpreter works without any external AI provider. AdventureNarrator supports an optional provider later and safely falls back if unavailable; no API secret is exposed in the browser.

SQL status: migrations have already been applied to the live Velmora Supabase project. The SQL file is included only as documentation/recovery material.
