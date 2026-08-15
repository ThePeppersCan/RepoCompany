REPO DIVER V15 — THE DEEP SIGNAL CAMPAIGN
Build: v15-the-deep-signal-20260815

DEPLOY
1. Replace index.html.
2. Replace assets/repo-diver/ with the folder in this package.
3. Do NOT run REPO_DIVER_V15_DEEP_SIGNAL.sql. The Supabase migration is already live; the SQL file is reference-only.

PHASE 10 HIGHLIGHTS
- 25-mission main campaign across five acts:
  I Something Below
  II The Lost Expedition
  III The Old World
  IV Beneath Midnight
  V The Deep Signal
- Campaign unlocks at Diver Day 12 without resetting existing saves.
- Server-persisted mission, act, checkpoint, evidence, grade and completion state.
- Campaign board at the harbour with mission briefing, Evidence Board, core crew and replay archive.
- 12 story evidence artifacts.
- Mission tool recommendations and automatic 3-tool specialist loadout on story launch.
- Existing V14 wreck/ruin/cave/facility locations are reused as authored story spaces.
- Station Erebos receives a seven-checkpoint campaign treatment plus observation-window setpiece.
- Below The Charted Depths (420m) and The Deep Signal (520m) use the existing Endless Blue backend biome as bespoke campaign expeditions; no fake 19th normal biome was added.
- Finale requires a sonar interaction at the source before the final client checkpoint.
- Large-scale deep structure / unknown creature presentation is non-harvest objective content, not another fish boss.
- Short contextual Tideline radio dialogue with no continuous radio static.
- Cass Rook appears as an in-world field rival on relevant story dives.
- Fish House can stage a one-time post-expedition Tideline crew table after a newly completed story mission.
- Existing crew NPCs react to active Deep Signal missions in harbour dialogue.
- Story Assist setting strengthens objective guidance only; permanent rewards are unchanged.
- Completed campaign unlocks the permanent Below The Charts title and Deep Signal trophy.
- Completed missions support Archive Replay without duplicate progression rewards.
- Campaign firsts are held in a separate server-backed legacy table.

SERVER AUTHORITY
New V15 campaign data is server-backed. Mission launch validates auth, current mission and biome. Campaign checkpoints are sequential. Site missions validate the player's real persistent V14 location progress. The two final depth missions are finalized only after the normal Repo Diver run has been claimed, and final server validation checks the run summary depth. Campaign reward paths are idempotent.

PRESERVED SYSTEMS
- V14: 36 authored locations and 72 archaeology artifacts.
- V13: Living Ocean ecology and research tagging.
- V12: Shared Ocean, records, tournaments and Tideboard.
- V11/V10.1: clean ambience / game-feel systems.
- Existing reduced Repo Diver economy.
- Main RepoCompany TCG Patch Card script reference.

AUDIO RULE
The campaign adds short radio, reveal, Deep Signal and completion cues. It does NOT invoke the continuous loopNoise helper. No continuous white-noise/radio-static bed has been reintroduced.

TESTING
See V15_TEST_REPORT.txt. Node/engine/static and live Supabase verification were run. A Chromium headless visual attempt timed out because the environment cannot establish its DBus/browser runtime, so this package does NOT claim a successful automated browser visual playthrough.
