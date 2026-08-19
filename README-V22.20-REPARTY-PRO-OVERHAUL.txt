REPO COMPANY / VELMORA
V22.20 — REPARTY PROFESSIONAL MINIGAME OVERHAUL
19 August 2026

APPLY OVER: V22.19.1 Reparty Hotfix (or a build already containing V22.19 + V22.19.1)
DATABASE: No new Supabase migration required.

WHAT CHANGED
============
This is a full frontend rebuild of the Reparty game layer, not a cosmetic reskin.

CORE ENGINE
- Rebuilt game lifecycle with scoped timers, requestAnimationFrame cleanup and event cleanup.
- Stronger phase transitions: selector -> instructions -> countdown -> live game -> locked finish -> results -> reward.
- Prevents old minigame timers/input handlers bleeding into the next round.
- Keeps existing 6-contestant / max-4-human backend contract.
- Keeps real GP + existing skill XP rewards.
- Improved game selector, game-show presentation, HUD, status strips, score feedback and responsive layout.
- Fixed hidden queue status styling so JOINING NEXT ROUND does not display when queued=false.
- Better keyboard input capture during games.

12 MINIGAMES REBUILT
====================
1. Goblin Bomb Party
   Proper top-down six-player arena, moving AI opponents, bomb passing, fuse pressure and explosions.

2. Potion Panic
   Alchemy workbench scene, changing recipes, ingredient cards, correct-order input, errors, speed/accuracy scoring.

3. Fishing Frenzy
   Animated water/dock scene, jumping fish arcs, rare catches, junk, golden fish and combo scoring.

4. Chopping Frenzy
   Forest scene, readable tree states, ripe/rotten timing, hit feedback and combo scoring.

5. Builder Blitz
   Multi-material 4x4 blueprint memory challenge using stone/wood/glass/empty tiles, repeated builds and accuracy scoring.

6. Minecart Mayhem
   Perspective rail runner with lane switching, jumping, ore/gems, obstacles and hit feedback.

7. Rooftop Rush
   Side-scrolling skyline runner with parallax city, jumping, ducking, hazards, distance and streak scoring.

8. Chicken Chase
   Full top-down field, WASD movement, net swing, moving chickens, golden chickens and competing bots.

9. Treasure Tiles
   Floating survival board with warning/collapse states, moving contestants, bonus stars and survival scoring.

10. Goblin Says
    Animated host, real/fake commands, timed reactions, lives, streaks and reaction feedback.

11. Gold Rush
    Top-down cave with WASD movement, SPACE mining, carry-vs-bank decisions, ore nodes and roaming cave goblins.

12. Don't Wake the Troll
    Dedicated troll cave scene, timing-meter theft mechanic, escalating wake risk, bank/steal decisions and troll reactions.

FILES IN PATCH
==============
- index.html
- reparty-v1.js
- reparty-v1.css
- README-V22.20-REPARTY-PRO-OVERHAUL.txt
- REPARTY-QA-V22.20.txt

The reparty-v1 filenames are intentionally retained so this patch overwrites the existing Reparty frontend cleanly. index.html uses a new V22.20 cache-bust string.
