REPARTY V23.7 — ROOFTOP RUSH FLAGSHIP REBUILD / PART 1

Apply over V23.6.
No SQL required.

Scope
-----
This patch changes ONLY Rooftop Rush plus the Reparty JS cache-buster in index.html.
Goblin Bomb Party, Minecart Mayhem and the other 9 Reparty minigames are unchanged.
No Repo Sports, World Cup, TCG, Binder, grading, Supabase or economy files are included.

Rooftop Rush rebuild
--------------------
- Authored obstacle patterns replace loose random spam.
- Cleaner read/react loop: jump, slide, pace/position and burst.
- Left/right now changes player pace/position with acceleration instead of teleport stepping.
- Coyote time + jump buffering for more forgiving platforming.
- Faster, responsive movement with momentum instead of floaty lane movement.
- Dedicated slide and short burst/dash action.
- Main Roof and optional Upper Skyline routes.
- Ramps can launch the player into a faster, riskier upper route with stronger scoring.
- Upper route has its own hazards/patterns and returns cleanly to the main roof.
- Gap/crumble failures use a fast ledge-save recovery instead of dead waiting.
- Flow system rewards clean obstacle reads, landings, near-misses and shortcuts.
- Perfect landings and clean sequences improve score/flow.
- Final 7 seconds trigger FINAL SPRINT with a stronger speed climax.
- Five rival silhouettes and live 1/6–6/6 position make it read like a race.
- Rival presentation is intentionally subdued so hazards remain readable.
- Cleaner HUD: Position, Score, Route, Flow and round progress.
- Context prompt shows only the next relevant action (JUMP/SLIDE).
- No Rooftop-specific early finish call; it runs against the Reparty round timer.

Files
-----
index.html
reparty-v1.js
README-V23.7-ROOFTOP.txt
QA-V23.7-ROOFTOP.txt
