REPO ROOFTOPS 2.0 — PROFESSIONAL GAMEPLAY / VARIETY PASS
10 August 2026

DROP-IN WEBSITE PATCH
Replace/merge these files into the website root:
- index.html
- repo-rooftops.js
- repo-rooftops.css

NO NEW SUPABASE SQL IS REQUIRED.
The existing secure Repo Rooftops GP/Agility XP/Mark of Grace/run-claim and Endless leaderboard save systems are preserved.

WHAT CHANGED

MOVEMENT / GAME FEEL
- Slightly tighter ground and air acceleration.
- Existing coyote time, jump buffering, variable jump height, wall movement and dash are preserved.
- New forgiving ledge-save mechanic for near-miss platform edges.
- New contextual vault obstacles that keep forward movement flowing.
- Landing squash and Perfect Landing pulse feedback.
- Camera now leads upward slightly according to vertical velocity instead of simply following the player.

FLOW SYSTEM
- The old Momentum presentation is now a proper FLOW system.
- Dedicated Flow bar and live score multiplier.
- Flow rises from fast rooftop clears, risk play, Flow tokens, vaults, ledge saves and Perfect Landings.
- Flow drains when the player stalls.
- Existing secure backend momentum field is still used for reward compatibility.

PERFECT LANDINGS
- Press Jump shortly before landing from a meaningful fall.
- A successful buffered landing awards Flow + score and chains PERFECT LANDING x2/x3/etc.
- Missing a proper landing breaks the chain.
- Sure Footing blessing widens the timing window.

MORE ROOFTOP SECTIONS
The procedural generator now mixes additional handcrafted-style chunks with the existing set:
- Chimney Run
- Market Awnings
- Crane Crossing
- Vault Alley
- Split Rooftops route choice
- Billboard Climb
Plus existing stairs, zigzags, moving roofs, crumble roofs, bounce sections, wall shafts, conveyors, ice, lasers, vents, risk balconies and recovery roofs.

ROUTE CHOICES
- Dedicated route prompts appear on special sections.
- Safe roofs remain reliable.
- Risk/shortcut routes use smaller or unstable platforms and reward Flow/score opportunities.
- Existing secure risk-GP handling is preserved.

ROOFTOP EVENTS
Longer runs can now trigger short gameplay modifiers:
- ROOFTOP RUSH — faster rising danger, boosted Flow/score gain.
- GUST FRONT — crosswinds affect airborne movement.
- PRECISION WINDOW — wider Perfect Landing timing.
- SKYLINE TOKEN TRAIL — temporary Flow-token route appears above.
Events are deliberately short and spaced apart so normal Rooftops gameplay remains readable.

RUN BLESSINGS
Every 250m now offers 3 randomly selected perks from a larger pool:
- Windstep
- Rooftop Aegis
- Longstride
- Featherstep
- Momentum
- Sure Footing
- Cat Grip
- Cat's Grace
- Treasure Cache
This lets different runs develop into movement, Flow, recovery or safety builds.

PB GHOST
- A faint local Personal Best ghost is recorded for Endless/Daily runs.
- The next run can race the previous path in real time.
- Stored locally in the browser and has no effect on secure rewards or leaderboards.

RESULTS / PRESENTATION
- Run summary now includes Best Flow, Perfect Landings, Best Perfect Chain, Vaults, Ledge Saves and Rooftop Events.
- New Flow HUD and event banner.
- Updated menu/how-to wording to explain the new systems.
- Mobile and reduced-motion rules included.

REGRESSION SAFETY
- Existing 1-in-50 server-backed Mark of Grace system is untouched.
- Existing GP and Agility XP claim RPC is untouched.
- Existing idempotent pending reward retry is untouched.
- Existing Endless leaderboard save reconciliation is untouched.
- No changes to Quidditch, World Cup, TCG, Goblin Bomb Party, Barry Bramble or other game systems.
