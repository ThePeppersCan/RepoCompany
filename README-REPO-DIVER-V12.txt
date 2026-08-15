REPO DIVER V12 — SHARED OCEAN / SOCIAL PRESTIGE
================================================

FRONTEND
- Replace index.html.
- Replace assets/repo-diver/ with the folder in this package.
- All five Repo Diver assets are cache-busted as:
  repo-diver-v12-shared-ocean-20260815-1236

BACKEND
- The V12 Supabase migrations have already been applied to production project hvdrwmjieguurxvrgzfu.
- DO NOT run REPO_DIVER_V12_SHARED_WORLD.sql against production.
- It is included only as an implementation/change record.

WHAT V12 ADDS
- The Shared Ocean asynchronous community layer. Normal expeditions remain single-player.
- A physical Tideboard in the harbour.
- Server-clock seasons and weekly community expeditions.
- Community targets scale to active Repo Diver participation.
- Weekly validated tournament board using persisted catches/runs/scores only.
- Verified species-weight records, global record holders and permanent record handovers.
- Repo Diver Hall of Fame.
- The Repo Tide harbour newspaper generated only from verified server data.
- Community totals: catches, archive coverage, Ancient hunts, depth, Golden specimens and Fish House guests.
- Public Repo Diver profiles with an explicit public/private switch.
- Public profiles expose game stats only; no emails/auth IDs/private account data.
- Verified Trophy Cabinet: choose a recent server-validated catch as your featured public catch.
- Preset-only Fish House Guestbook reactions; no unrestricted public text.
- Historical tournament archive generated from persisted validated results as weeks close.
- Future first verified species discoveries and first Ancient completions enter permanent Repo Diver Legacy history.
- Very occasional cosmetic Fish House visitor based on another recent RepoCompany diver; this never affects rewards.
- Four permanent Shared Ocean honours/achievements: Record Breaker, Harbour Champion, Pioneer and Legacy Diver.
- Significant Tideboard events: world records, rare variants, Ancient victories, perfect photos and named specimens.
- OLD IRONJAW launch named-specimen sighting in Blackwater Rift. While still at large it appears as a special global-sighting specimen in the expedition itself.
- Named specimens have an in-water ring/name treatment and archive once captured.
- Community services are optional and fail gracefully; diving/Fish House gameplay does not depend on them.
- Shared state is cached for 45 seconds rather than continuously polling Supabase.
- Social audio cues are short tonal hooks only. V10.1/V11's no-constant-white-noise approach is preserved.

SERVER AUTHORITY
- Shared tables cannot be directly SELECT/INSERT/UPDATE/DELETE'd by anon/authenticated roles.
- Public reads/writes go through SECURITY DEFINER RPCs that use auth.uid().
- Future completed runs now snapshot the sanitized catch list accepted by repo_diver_complete_day().
- repo_diver_publish_catches() publishes that server-accepted snapshot, rather than trusting a second arbitrary client catch payload.
- Catch weights remain clamped to the existing plausible species range.
- Tournament boards are derived from persisted validated sources. There is no "submit 999kg" tournament RPC.
- Endgame score duplicate protection remains in place.
- Social systems award no new GP or XP.

ECONOMY
The intentionally reduced Repo Diver economy is unchanged. Production verification during V12 still returned:
- Fjord Haddock dish: 68 GP base price
- Longship Lobster dish: 147 GP base price

SCOPE NOTE
This build implements the core Phase 7 asynchronous shared-world architecture. It deliberately does not add direct player-to-player fish trading, realtime multiplayer, or unrestricted public chat. Those would weaken the existing progression/economy and were explicitly excluded from the design.
