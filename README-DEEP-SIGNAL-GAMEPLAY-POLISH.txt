REPO COMPANY V18.1 — DEEP SIGNAL GAMEPLAY / REPOGGLE POLISH FIX
16 AUGUST 2026

Deploy this ZIP over the current V18.1 build. It is cumulative with the previous
Deep Signal quest-line, binder/homepage and World Cup / QF hotfixes included in
this update package.

FIXED LIVE BACKEND (ALREADY APPLIED — NO SQL TO RUN)
----------------------------------------------------
• Tideboard / Shared Ocean error fixed. The live community RPC was failing on a
  missing jsonb_object_length helper. The function is installed and verified.
• Repo Diver GP economy reduced by about 20% for future Fish House service and
  salvage/treasure earnings. Existing player GP was not altered.

REPO DIVER CLIENT FIXES
-----------------------
• Protected species now have a clear research workflow in MARINE INSTITUTE >
  RESEARCH:
    C = Research Camera (standard issue, no craft required)
    R = Research Dart Array (optional tagging gear, crafted directly in Research)
• Research Dart material costs and current material wallet are shown beside the
  craft button; the panel refreshes immediately after crafting.
• Sonar now marks rare/epic/legendary contacts directly in the water for ~3 sec
  with brackets + rarity/name labels, and the HUD explains Q / LB sonar use.
• Deep/descent missions now visibly travel downward: water darkens, surface rays
  disappear, particles/rock silhouettes rise past the diver, 100m depth gates
  pass the camera, and a live VISUAL DESCENT readout tracks progress.
• Deep Signal story objectives now get visible world beacons/guidance. The final
  Lyra signal-lock step explicitly points to the source and asks for a sonar ping.
• Lyra / crew radio dialogue remains on-screen long enough to read. Opening radio
  no longer fires underneath the mission title cinematic.
• After the first mission buoy, Lyra explicitly locks the Coral Lantern Wreck
  bearing and the STORY OBJECTIVE beacon guides the player to the wreck.
• Client Fish House prices/revenue now match the live 20% GP economy reduction.

REPOGGLE LEVEL 31 — SCALES OF LAW
----------------------------------
The old setup made all 22 required targets armoured two-hit targets, effectively
requiring 44 target hits with only 8 Rune Orbs. That was the source of the
impossible-feeling board.

Level 31 is now:
• 10 Rune Orbs
• 20 normal one-hit Charged targets
• 10 separate armoured blocker pegs
• 2 Power pegs / 3 Explosive pegs / same moving balance spinner
• star thresholds rebalanced to 132,000 / 215,000
• no longer built around Law Stasis specifically — every unlocked rune power has
  a viable route through the board.

VALIDATION
----------
• Repo Diver game.js passes node --check
• repoggle-levels.js passes node --check
• main script.js passes node --check
• Repoggle still contains all 50 levels
• Level 31 generated board: 20 Charged, 10 Armoured, 3 Explosive, 2 Power, 10 Orbs
• Repoggle safety validation passes
• index.html duplicate IDs: 0

IMPORTANT
---------
No SQL needs to be run for this update. The Tideboard fix and GP economy tuning
are already live in Supabase.
