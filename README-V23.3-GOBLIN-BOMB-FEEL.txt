REPARTY V23.3 — GOBLIN BOMB PARTY PART THREE
FINAL GAME-FEEL / CONTROL / AI TUNING

APPLY OVER:
- V23.2 Goblin Bomb Party Production Pass / current site.

SCOPE:
- Goblin Bomb Party only.
- No Repo Sports, World Cup, TCG, Binder, RCG, Passport, Animal Centre, Supabase economy or other Reparty minigame logic changed.

PART THREE FOCUS:
- Faster, more responsive movement without slippery drift.
- Faster physical bomb throws with clearer arcs and stronger readability.
- Human throws no longer have an artificial hold delay beyond a tiny input safety gate.
- Stable bot hold decisions (V23.2 recalculated a random hold threshold every frame; V23.3 decides once per possession).
- Smarter incoming-bomb behaviour: intended bot receivers may dodge; non-target bots may intercept.
- Target selection now considers interception lanes, dash cooldown and crowding.
- Actual successful dodges score; merely pressing dash does not.
- Clutch catches / clutch dodges get dedicated feedback.
- First heat is clean (no modifier) so the game teaches itself before arena chaos is introduced.
- Initial bomb holder will not repeat on consecutive heats while 3+ players remain.
- Dynamic camera subtly tightens for loose-bomb scrambles, critical fuse pressure and Final Duel.
- Bomb sprite and fuse ring are larger and easier to track.
- Throw aim now shows an arc preview rather than only a flat line.
- Audio mix sidechains music around explosions / winner moments; danger ticks increase in urgency.
- Space throw ignores keyboard repeat to prevent accidental multi-input behaviour.

TUNING VALUES:
- Run acceleration: 1325
- Max run speed: 228
- Holder speed multiplier: 0.90
- Dash: 565 impulse / 0.17 sec / 1.66 sec cooldown
- Throw range: 92–302 px
- Throw flight: 0.18–0.47 sec, based on distance
- Normal anti-return: 2350 ms
- Final Duel anti-return: 680 ms
- Catch radius: 22 px + facing bonus
- Dash catch radius: 5 px

NO SQL REQUIRED.
