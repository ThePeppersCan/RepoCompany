REPARTY V23.5 — MINECART MAYHEM PRODUCTION PASS (PART 2)

Apply over V23.4 / current Reparty build.

Scope
-----
This patch changes ONLY Minecart Mayhem production presentation plus the Reparty JS cache key.
Goblin Bomb Party and the other ten Reparty minigame functions are unchanged from V23.4.
No Repo Sports, World Cup, TCG, Binder, grading, Supabase or economy files are included.

What Part 2 adds
----------------
- Dedicated 1280×720 pixel-art deep-mine backdrop.
- Foreground tunnel framing and boost/final-descent speed overlay.
- Six-state player/rival cart + rider atlas (neutral/lean/jump/duck/boost).
- Eight-state hazard/collectible atlas (ore, gem, prism crystal, rubble, low beam, broken rail, runaway cart, switch sign).
- Dedicated route split signage for Service Line / Main Shaft / Deep Cut.
- Dynamic route lighting and route-specific audio mix.
- Dedicated SFX: lane switch, jump, duck, ore, gem, crystal, crash, boost, branch, cave-in, near miss, final descent and rolling wheels.
- Three looping music layers: normal shaft, Deep Cut and Final Descent. They crossfade instead of restarting.
- Music ducks around boost/crash/cave-in moments so important SFX remain readable.
- Production assets are loaded with procedural rendering retained as a safe fallback if an image is unavailable.
- All Minecart audio is stopped/cleaned when the game ends.

No SQL required.
