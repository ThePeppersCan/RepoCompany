REPARTY V23.4 — MINECART MAYHEM FLAGSHIP REBUILD (PART ONE)
============================================================

SCOPE
-----
This patch starts the second one-by-one premium Reparty rebuild.
Only Minecart Mayhem was redesigned. Goblin Bomb Party remains V23.3.
All other Reparty minigame function bodies are unchanged.
No Repo Sports, World Cup, TCG, Binder, RCG, Passport or Supabase files are included.

MINECART MAYHEM REBUILD
-----------------------
- Rebuilt from a basic three-lane dodger into a six-cart mine race.
- Spring/inertia rail switching with cart lean instead of lane snapping.
- Pattern-based hazards instead of isolated random objects.
- Hazards: rubble, low beams, broken rails/gaps and runaway carts.
- Resources: ore, gems and rare prism crystals.
- Three route identities at track splits:
    SERVICE LINE = safer / lower payout
    MAIN SHAFT   = balanced
    DEEP CUT     = faster / richer / harder
- Track split decision window is visibly timed and uses current rail choice.
- Jump and duck timing matter; correct hazard reads build Flow.
- PERFECT and NEAR MISS states build boost and score.
- Boost can be triggered once partially charged instead of requiring 100%.
- Boost increases speed/reward and can smash rubble/runaway carts, but does not make gaps or low beams free.
- Final cave-in set piece telegraphs two blocked rails and one safe rail.
- Final Descent raises speed during the closing seconds.
- Five rival carts are visible and produce an in-race 1/6–6/6 position indicator.
- Rivals are presentation/race-pressure only and never secretly alter player collisions/rewards.
- More detailed perspective rails, repeating braces/lanterns, speed streaks and route-specific lighting.
- Compact integrated race HUD for position, flow, score, route, speed and boost.
- No early local finish. Minecart uses the full authoritative Reparty round timer.

CONTROLS
--------
LEFT / RIGHT or A / D  Switch rails
SPACE / UP / W         Jump
DOWN / S               Duck
SHIFT                  Spend charged boost

QA
--
- node --check reparty-v1.js: PASS
- V23.3 → V23.4 function isolation audit:
  Minecart Mayhem: CHANGED
  Goblin Bomb Party + other 10 games: BYTE-FOR-BYTE UNCHANGED
- No finishGame() call inside Minecart Mayhem.
- Patch contains no Repo Sports / World Cup / database files.
- Browser live-render test was attempted, but the managed Chromium in this environment blocks both file:// and localhost pages by organisation policy. No claim of live browser QA is made for this pass.

INSTALL
-------
Apply directly over V23.3/current site.
No SQL migration.
