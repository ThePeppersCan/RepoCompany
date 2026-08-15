RepoSports World Cup — Live Quarter Final Draw
Baseline: Repo Diver V18.1 UI Polish Hotfix + Saturday schedule hotfix

FRONTEND
- Adds the LIVE QUARTER FINAL DRAW screen beneath the World Cup lore/map panel.
- Public unlock: Saturday 15 August 2026 at 11:15pm UK.
- Host start window opens: 11:30pm UK.
- The official draw DOES NOT auto-start at 11:30pm.
- CatAsthma must press START OFFICIAL DRAW to begin the synchronized live draw.
- Admin can prepare/select/lock the eight qualifiers, but cannot start the official broadcast.
- Before public unlock, CatAsthma / Admin Preview can enter the draw screen for setup/testing.
- USE RECORDED WINNERS reads the existing stored World Cup results and selects winners that have already qualified.
- RUN TEST DRAW performs a complete local rehearsal with the selected eight teams. Test draws are clearly labelled, can be repeated, and never write to Supabase or alter the official draw.
- Official draw order is randomised and sealed server-side when the qualifiers are locked.
- Pairings and stadiums remain hidden from viewers until CatAsthma actually starts the official draw.
- Every viewer synchronizes from the server-recorded actual start time, so a late viewer joins at the correct point in the sequence.
- The reveal sequence presents all four quarter-final pairings and four host stadiums, then the completed bracket.
- After completion, the button remains available as DRAW COMPLETE · VIEW BRACKET.

FLAG / LAYOUT FIXES
- Uses the supplied 16 transparent World Cup flag PNGs.
- Corrected QF flag paths to the supplied *-flag.png filenames.
- Compatibility aliases are included so older fixture/UI references using the previous filenames still load.
- Hardened header, host-control, draw-machine, reveal-card and bracket sizing so text/boxes no longer collide or overlay each other at normal desktop widths.
- Added responsive wrapping/scroll safety for narrower windows.

STADIUM DRAW POOL
- Skallheim Grand Ice
- Blackglass Crown Arena
- Hestholm Fjord Ground
- Yrsa Varn World Stadium
- Warmvein Arena
- Nyrgate Northern Lights Stadium
Four different host venues are drawn for the four quarter finals.

BACKEND
- The live Supabase update has already been applied.
- Table: repo_world_cup_qf_draw_2026
- RPC: get_repo_world_cup_qf_draw_2026()
- RPC: set_repo_world_cup_qf_draw_qualifiers_2026(text[])
- RPC: reset_repo_world_cup_qf_draw_2026()
- RPC: start_repo_world_cup_qf_draw_2026()
- Lock/reset remains server-authorised to CatAsthma and Admin before the draw starts.
- START OFFICIAL DRAW is server-authorised specifically to CatAsthma.
- The official row is still untouched/unstarted in this delivery.
- Existing first-round results are untouched.

DEPLOY
Replace index.html and deploy the included assets folder so the supplied World Cup flags are present at:
assets/world-cup-flags-transparent/

Keep/add the existing schedule image included in the package:
assets/repo-sports-world-cup-fixtures-20260815.png

DO NOT run SQL from this package; the backend is already live.

PROGRESSIVE BRACKET REVEAL FIX — 15 AUGUST 2026
- Fixed a test/live draw bug where revealing a stadium caused later quarter-final team slots to appear before those teams had actually been drawn.
- Team reveals and stadium reveals now use separate progression counters.
- QF3/QF4 remain blank until their own team draw moments.
- Applies to both local TEST DRAW and the official CatAsthma-started live draw.

AUDIO EXCLUSIVITY FIX
- While a Test Draw or the official live draw sequence is actively running, the normal World Cup menu background music is paused.
- The 50% quarter-final suspense track is therefore the only background music during the draw.
- Cancelling a test, closing the draw, or completing the final reveal restores the World Cup menu music from where it was paused, but only if it had been playing beforehand.
