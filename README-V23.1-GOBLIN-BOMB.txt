REPARTY V23.1 — GOBLIN BOMB PARTY FLAGSHIP REBUILD
19 August 2026

PURPOSE
-------
This patch upgrades ONE Reparty minigame only: Goblin Bomb Party.
It is intentionally isolated from Repo Sports, World Cup, TCG, Binder, RCG grading,
Passport, Animal Centre, Supabase economy and the other 11 Reparty minigames.

INSTALL
-------
Apply over the current V23.0 / V22.25-based site.
No SQL or Supabase migration is required.

FILES CHANGED
-------------
- reparty-v1.js
  * Rebuilt Goblin Bomb Party gameplay/AI/physics/presentation.
  * Bomb-only instruction demo + extra 0.5s read time.
  * Updated Bomb Party objective/control copy.
  * Other 11 game function bodies remain byte-identical to V23.0.
- reparty-v1.css
  * Appends Bomb Party-only instruction/presentation CSS.
  * The original V23.0 CSS remains an exact prefix.
- index.html
  * ONLY the two Reparty JS/CSS cache-buster strings changed.

NO REPO SPORTS FILES ARE INCLUDED.
NO WORLD CUP FILES ARE INCLUDED.
NO SCRIPT.JS / STYLE.CSS ARE INCLUDED.

CORE BOMB PARTY REBUILD
-----------------------
- Six-player physical arena with acceleration/deceleration and light body collisions.
- Mouse aiming, physical bomb flight, deterministic catch/miss/intercept behaviour.
- Loose bombs bounce/roll and must actually be collected.
- Shift dodge with recovery/cooldown and reduced catch collision during dodge frames.
- 2.35s anti-return protection in normal heats; shortened sensible protection in final duel.
- Bot state machine: seek space, avoid holder, chase loose bomb, intercept, hold/reposition,
  select target, panic throw and recover behaviour.
- Personality affects style rather than hidden raw power.
- Controlled heat/fuse pacing to occupy the live server round instead of ending early.
- Arena modifiers: powder crate, speed pad, steam vent, bounce panel.
- Persistent scorch marks, layered Powderworks arena, spectators after elimination,
  final-duel presentation and winner celebration.
- Layered Bomb Party SFX, danger fuse feedback, impact pause and camera reactions.
- Score rewards participation: throws/catches/dodges/intercepts/forced explosions/survival.

IMPORTANT
---------
This build does not add bespoke externally-produced character animation sheets or a new
recorded music track. It improves the mechanics, physics, AI, canvas presentation and SFX
using the existing Reparty/site asset language. Those art/audio assets would be a separate
production pass rather than pretending procedural effects are equivalent to authored assets.

See QA-V23.1-GOBLIN-BOMB.txt for test results.
