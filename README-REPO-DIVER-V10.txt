REPO DIVER V10 — ENDGAME EXPEDITIONS + HIGH-LEVEL SOUND DESIGN
Build: v10-final-endgame-audio-20260815

INSTALL
1. Replace the root index.html with the included index.html.
2. Replace the files inside assets/repo-diver/ with the included files.
3. Push to the normal RepoCompany GitHub branch and allow Cloudflare to deploy.
4. Hard-refresh after the deployment is green.

IMPORTANT
- The Supabase V10 backend migrations have ALREADY been applied to project hvdrwmjieguurxvrgzfu.
- DO NOT run REPO_DIVER_V10_BACKEND_REFERENCE.sql. It is only a record of the server changes.
- The index.html in this package preserves the existing TCG Patch Cards cache reference:
  script.js?v=tcg-patch-cards-20260815-v1
- The deliberate Repo Diver GP nerf remains unchanged.

V10 CONTENT SUMMARY
- 18 total dive biomes (8 new advanced/endgame regions)
- 202 total fish/creatures
- 100 total recipes
- 10 Ancient boss-scale creatures
- Ancient rarity above Mythic
- Daily rare sighting panel
- Weekly ocean/seasonal condition rotation
- Ancient Hunt mode
- The Descent endless-depth mode
- Endgame expedition modifiers
- Precision / Heavy / Barbed harpoon loadouts
- Predator / luminous / balanced lure loadouts
- Rare specimen variants: albino, melanistic, luminous and golden
- Validated Deep Ops leaderboard
- Master Diver prestige
- Per-biome mastery
- 100-achievement client career set
- Repo Diver completion percentage
- Expedition salvage materials + server-authoritative crafting
- Five crafted endgame modules
- Equipment condition / durability HUD
- Multiple Ancient boss behaviour styles (charge, ambush, freeze, vent, seismic, rubble)
- Special-condition species tied to weather / time of day
- Rare unexplained deep-water contact events

HIGH-LEVEL SOUND DESIGN
V10 adds a new procedural WebAudio sound layer rather than requiring large external audio assets.
- Scene-aware harbour, restaurant and underwater ambience
- Biome-sensitive deep-water tonal beds
- Ice, abyss, volcanic, ruins and tropical texture layers
- Sonar sweeps
- Harpoon firing / impact
- Reel-line tension creaks
- Low-oxygen heartbeat
- Pressure / hull creaks
- Boss encounter stingers
- Adaptive danger bed during bosses, low oxygen and The Descent
- Descent-layer pressure stings
- Kitchen prep/cook/plating feedback
- Door/customer arrival cues
- VIP/critic cue
- Serve-quality feedback
- Walkout feedback
- Crafting sound
- Expedition clear / Ancient boss clear stings
- Sparse Fish House clatter and harbour wave/gull details
- Visible SOUND ON/OFF control + volume slider
- M remains the fast mute hotkey during gameplay

SERVER SAFETY
- Endgame score submission is one-time per run.
- Duplicate endgame submissions do not award prestige, mastery or materials twice.
- Ancient boss IDs are checked against the run biome.
- Variant logs validate fish IDs against the claimed run biome.
- Endgame crafting is server-side and checks material balances.
- Endgame score and leaderboard records are based on claimed Repo Diver runs.
