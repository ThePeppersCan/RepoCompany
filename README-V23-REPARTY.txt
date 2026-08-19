REPARTY V23.0 — PREMIUM FULL-ROUND REBUILD
============================================

BASE
----
Apply this patch over V22.25 (Repo Sports Restore/current site).
No Supabase migration is required.

IMPORTANT ISOLATION
-------------------
This patch changes ONLY Reparty and the two Reparty cache-buster references in index.html.
It does NOT contain or replace Repo Sports, World Cup, TCG, Binder, RCG grading, Passport, Animal Centre, or any Repo Sports JS/CSS/test files.

CORE TIMING FIX
---------------
- Minigames no longer call finishGame() from inside their gameplay functions.
- The Reparty round is submitted only when the server live timer expires / moves to results.
- Terminal states inside games now recover, reset, start a new heat, or give a comeback rather than leaving the player staring at a dead game.
- Production instruction presentation is ~6.5 seconds total: ~3.8 seconds to read objective/controls, then a clear 3-2-1-GO sequence.
- The final seconds gain a shared climax treatment instead of silently petering out.

GAMEPLAY REBUILDS
-----------------
Goblin Bomb Party: physical movement/throws, dodge, loose bomb, interceptions, moving blockers, boost pads, heat resets, 2.2s anti-return, smarter bot throw behaviour.
Potion Panic: recipe memory -> ingredient mix -> active heat control -> bottle timing; repeat recipes for the full round.
Fishing Frenzy: fish enter right-to-left only; cast, hook, hold/release line tension, snap/escape, rare/legendary fish and rival anglers.
Chopping Frenzy: softwood/oak/ancient/rotten trees, HP, timing sweet spots, perfect hits, falling trees and regrowth.
Builder Blitz: 5x5 authored structures using shaped pieces, rotation, snapping, removal/undo, structural integrity, inspection and repeat blueprints.
Minecart Mayhem: lane movement, jump/duck, boost meter, track splits, safe/balanced/danger routes, richer gems on dangerous paths and rising speed.
Rooftop Rush: lateral positioning, momentum/flow, jump/slide, gaps, obstacles, shortcut ramps and recoverable falls.
Chicken Chase: chickens flee/herd around contestants, normal/fast/heavy/golden/rooster types, mud/hay, dash and wind-up/active/recovery net timing.
Treasure Tiles: SAFE -> CRACK -> DANGER -> COLLAPSE states, special tiles, body bumps, board refresh, comeback lives and final-duel escalation.
Goblin Says: jump/crouch/left/right/spin/freeze, fake commands, misleading host gestures, shrinking reaction windows and audience comeback instead of early inactivity.
Gold Rush: cave routes, mining, carrying-weight slowdown, banking, breakable walls, goblins, cave-ins, Gold Fever seam and visible rivals.
Don't Wake the Troll: loot risk tiers, sneak vs loud running, breathing/stirring cues, freeze mechanic, retreat/bank and wake/chase recovery rather than ending early.

PRESENTATION
------------
- Extended cinematic rules screen with separate objective and controls panels.
- Shared game-feel systems: impact pause, camera punch, screen shake, callouts, score bursts, final-seconds treatment and game-specific start stings.
- All six contestants stay represented during play where the game supports physical rivals.
- Bot personality profiles affect decision style without granting hidden scoring bonuses.
- Existing balanced Reparty economy is unchanged.

FILES
-----
index.html
reparty-v1.js
reparty-v1.css
README-V23-REPARTY.txt
QA-V23-REPORT.txt
REPARTY-V23-12-GAME-QA.jpg
