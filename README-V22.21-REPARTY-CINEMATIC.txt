REPO COMPANY / VELMORA
V22.21 — REPARTY CINEMATIC GAMEPLAY OVERHAUL
19 August 2026

APPLY OVER
- V22.20 Reparty Professional Overhaul
- Compatible with V22.20.1 Repo Sports Player Parity Fix
- No new Supabase migration required.

PRIZE DISPLAY FIX
The top bar previously showed the entire round pot as simply "PRIZE", which made a Double Gold round look like a 10,000 GP personal payout.

It now explicitly shows:
STANDARD: ROUND POT 5,000 GP | 1ST 1,500 GP
DOUBLE GOLD: DOUBLE GOLD POT 10,000 GP | 1ST 3,000 GP

The 10,000 GP shown in the supplied screenshot was a Double Gold TOTAL POT, not 10,000 GP paid to one player.

CORE PRESENTATION OVERHAUL
- Live minigames expand to use nearly the full Reparty window.
- Side panels collapse during active gameplay.
- Six-player rival ribbon remains visible across the game feed.
- Per-game colour identities, game sigils and stronger instruction cards.
- Animated game-show lighting, marquee, vignette and cinematic overlays.
- New event callouts for streaks, crashes, perfect actions, golden catches, banking, knockouts and failures.
- Improved layered SFX sequences using the existing browser audio framework.
- Screen shake / impact feedback for meaningful failures and explosions.
- New podium results presentation while retaining the complete six-player results table.

MINIGAME VISUAL / FEEDBACK UPGRADES
1. GOBLIN BOMB PARTY
- Rebuilt arena presentation with oval game-show floor, crowd terraces, spotlights and centre crest.
- Better contestant sprites, survivor pressure, bomb feedback and knockout callouts.

2. POTION PANIC
- Stronger alchemy-room lighting, cauldron presentation and perfect/wrong ingredient feedback.
- Perfect Brew celebration callouts and improved scene depth.

3. FISHING FRENZY
- Full lake environment with sunset sky, mountains, pines, reeds, dock and layered water animation.
- Golden catches and high combos receive premium feedback.

4. CHOPPING FRENZY
- Layered forest with canopy depth, sun shafts, grass detail and ambient forest dressing.
- Better ripe/rotten readability and streak callouts.

5. BUILDER BLITZ
- Stronger construction-board presentation, depth, tile feedback and perfect-build celebration.

6. MINECART MAYHEM
- Rebuilt mine tunnel with cave ribs, stalactites, torch pools, speed dust and deeper rail perspective.
- Proper minecart/player graphic instead of the previous simple block.
- Gem, clean-streak and crash feedback.

7. ROOFTOP RUSH
- Multi-layer city skyline, moon, clouds, lit windows, chimneys and textured rooftop foreground.
- Flow streak and impact feedback.

8. CHICKEN CHASE
- Full farm environment with barn, hills, sun, hay, mud, flowers and stronger fencing.
- Golden chicken and catch-streak celebration feedback.

9. TREASURE TILES
- Floating sky arena with clouds, distant islands and deeper 3D tile thickness/shadows.
- Star and fall feedback.

10. GOBLIN SAYS
- Stronger stage lighting, host presentation, correct/wrong reaction feedback and streak callouts.

11. GOLD RUSH
- Layered cave environment with stalactites, torch lighting and stronger atmosphere.
- Banking and goblin-hit feedback.

12. DON'T WAKE THE TROLL
- Richer cave lighting, treasure glow and more dramatic bank/wake/perfect-steal feedback.

FILES
- index.html
- reparty-v1.js
- reparty-v1.css
- README-V22.21-REPARTY-CINEMATIC.txt
- REPARTY-QA-V22.21.txt

No database schema or economy changes are included in this patch.
