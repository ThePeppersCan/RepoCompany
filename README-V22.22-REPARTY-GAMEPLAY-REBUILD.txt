REPO COMPANY / VELMORA
V22.22 — REPARTY GAMEPLAY REBUILD
19 August 2026

APPLY OVER
- V22.21 Reparty Cinematic Overhaul / current V22.20.1+ site
- No Supabase schema or economy change required.

WHY THIS PATCH EXISTS
The previous Reparty pass had stronger presentation, but several modes still behaved like browser prototypes. This patch rebuilds the actual gameplay layer. The focus is decisions, movement, timing, risk and mastery rather than adding more panels or cosmetic effects.

GOBLIN BOMB PARTY — MAJOR REBUILD
- Recipient cannot immediately throw/pass the bomb back to the player who just gave it to them.
- Explicit 1.9 second anti-return protection on the previous passer.
- AI also avoids selecting the previous passer while that protection is active.
- Bomb transfers now travel through the arena instead of teleporting between holders.
- CLICK near a rival throws the bomb toward them.
- SPACE is a directional dash, giving the holder an escape / bump play.
- Contact passes still work, but respect the same anti-return protection.
- AI carries the bomb briefly, approaches a valid target and deliberately rotates possession instead of ping-ponging it back.
- Knockouts, survivor pressure, dash bumps and bomb flight are all animated.

POTION PANIC
- Two-stage game now: memorise/mix the recipe, then perform a distillation timing finish.
- Ingredient accuracy and final heat timing both affect score.
- Gold heat band narrows as recipes progress.
- Proper clean-brew / unstable-brew outcomes instead of only clicking ingredients.

FISHING FRENZY
- No longer a pure click-the-fish game.
- Aim and cast at moving fish, then actively reel hooked fish with SPACE.
- Reel tension can snap the line if spammed.
- Rare and golden fish require more control and pay more score.
- Progress, tension, line rendering, splashes and catch feedback added.

CHOPPING FRENZY
- Trees now grow through immature / ripe / rotten states.
- Ripe trees need multiple axe hits rather than disappearing on one click.
- Swing timing meter rewards perfect centre-band hits.
- Perfect hits deal extra damage.
- Trees physically fall and regrow.
- Rotten/early swings damage the streak.

BUILDER BLITZ
- Replaced the old DOM tile-cycling feel with an in-world canvas construction puzzle.
- Memorise a 5x4 blueprint, select materials with 0/1/2/3 and paint the plan directly.
- SPACE submits the structure.
- Live pseudo-3D model updates as pieces are placed.
- Accuracy remains more important than brute click speed.

MINECART MAYHEM
- Obstacles now require different responses: rocks/gaps = jump, beams = duck.
- Added boost meter and SHIFT boost.
- Ore / gems charge boost.
- Clean obstacle clears build a flow streak.
- Boost changes actual speed and risk rather than being a visual effect.

ROOFTOP RUSH
- Added true rooftop gaps, vents, crates, clotheslines and coins.
- Jump and slide have different uses.
- Falling into a gap causes a recovery/penalty rather than behaving like another crate collision.
- Flow streak and distance progression remain persistent through the round.

CHICKEN CHASE
- Chickens now flee dynamically from the player instead of wandering independently.
- Golden chickens are faster and harder to net.
- Added mud zones that slow movement.
- Added SHIFT dash with cooldown.
- Net is a directional cone rather than a generic proximity hit.
- Rival AI visibly competes for the same flock.

TREASURE TILES
- Expanded board to 8x5.
- All six contestants are represented in the actual arena.
- Warning tiles collapse in waves.
- SPACE gives a directional extra-tile dash.
- Two-life system keeps the player involved while still making falls matter.
- Rival crowding/shoves can change positioning.
- Star pickups add a reason to take risks instead of camping.

GOBLIN SAYS
- Expanded command set.
- Fake commands now include extra stage feints designed to distract visually.
- Correctly ignoring a fake command is explicitly rewarded.
- Faster escalation and clearer fail reasons.

GOLD RUSH
- Added rich ore veins with different values.
- Carrying more ore slows movement, making greed a real risk.
- Goblins pressure the player and can knock loose unbanked ore.
- Added telegraphed cave-ins; standing in a warning zone causes a hit and lost carry.
- Banking remains the only way to make carried score safe.

DON'T WAKE THE TROLL
- Rebuilt from a simple stop-the-needle web meter into a canvas stealth game.
- Hold SPACE to physically sneak toward the treasure.
- Troll breathing creates quiet and dangerous movement windows.
- Moving during an alert window raises the wake meter quickly.
- Reaching the pile steals treasure but raises future risk.
- B starts an actual retreat back to the safe entrance and banks only when the player reaches safety.
- Waking the troll loses all unbanked loot.

PRESENTATION
- Per-game scene colour/lighting retained from V22.21.
- Additional game-specific HUD states, warning rings, lines, movement animation and impact feedback.
- Gameplay remains full-window with the six-contestant ribbon visible.

FILES
- index.html
- reparty-v1.js
- reparty-v1.css
- README-V22.22-REPARTY-GAMEPLAY-REBUILD.txt
- REPARTY-QA-V22.22.txt
