REPO DIVER V16 — LIVING POSTGAME, PERSONAL LEGACY & MASTER EXPEDITIONS
=====================================================================
Build: v16-living-postgame-20260815

DEPLOY
------
Replace:
  index.html
  assets/repo-diver/

The Supabase backend changes are ALREADY LIVE.
Do NOT run REPO_DIVER_V16_BACKEND_REFERENCE.sql. It is a deployment/change record only.

V16 CORE
--------
• Campaign-complete postgame harbour state with a physical Repo Diver Legacy Hall.
• Permanent Deep Signal expedition monument and career trophy display.
• Velmoran Ocean Atlas with category-by-category completion instead of a mystery percentage.
• Hidden career secrets stay displayed as ??? until discovered.
• 100% completion is server-validated and can unlock VELMORAN LEGEND, a legend suit, master hull, banner and +1,000 Renown.
• Diver Renown ranks: Veteran Diver → Master Diver → Abyss Diver → Oceanographer → Legendary Diver → Velmoran Master.
• Existing veteran progress is backfilled from trusted campaign, mastery, location, archaeology, Ancient, record and tournament data. Unknown historical dates are labelled Pre-Legacy instead of fabricated.

MASTER EXPEDITIONS
------------------
• 18 server-authored Master Expedition templates spanning the current ocean.
• Veteran / Master / Abyssal difficulty.
• Difficulty changes oxygen pressure, current force, visibility and predator danger — it does not inflate fish/boss HP.
• Daily Master Expedition and Weekly Grand Expedition are selected by server date/week.
• Daily + weekly validated scoreboards.
• Current-run site proof is required for authored-site objectives.
• Ancient objectives require the same run's validated Ancient result.
• Failed objectives award 0 Renown.
• Replays remain scoreable but cannot farm Renown:
    - free Master Ops: first clear per expedition + difficulty gives progression reward
    - daily: first successful daily progression claim per day
    - weekly: first successful weekly progression claim per week
• S-rank / Master career milestones count unique expedition+difficulty clears, not spammed repeats.

CREW & POSTGAME LIFE
--------------------
• 21 persistent crew epilogue operations: 3 each for Darro, Lyra, Orin, Quill, Cass, Sella and Mara.
• Epilogues use real existing career data: Master runs, depths, tags, ecology, photos, archaeology, locations, records, tournaments, customers, perfect dishes and recipes.
• Crew dialogue changes after The Deep Signal.
• Epilogue completions award Renown and selected cosmetic/display unlocks, never a new currency.
• R.C. Tideline veteran interior presentation now has five interactable compartments: Bridge, Sonar Station, Research Bench, Galley and Trophy Wall.
• Veteran vessel/suit/banner refits are cosmetic only.

LEGACY HALL / PROFILE
---------------------
• Campaign trophy plus automatic career trophy cases for Ancients, cartography, archaeology, mastery and records.
• Crew/Institute display rewards can physically populate the Legacy Hall.
• Personal Career Timeline records postgame milestones.
• Own Repo Diver profile shows Renown / Master career.
• Public Repo Diver profile can show campaign completion, Renown rank, Master Expedition totals, S ranks, tournament wins and record entries.
• Existing public-profile privacy setting remains authoritative.

MARINE INSTITUTE / FISH HOUSE
-----------------------------
• 5 long-form, multi-dive veteran research projects.
• Projects appear in both Legacy operations and the Marine Institute veteran wing.
• Fish House gains recurring postgame Legacy Service nights.
• High-rank postgame nights can book a Chef's Table / Velmoran tasting reservation.
• Legacy Service does not add a GP multiplier or new money-farming path.

AUDIO
-----
• Short Legacy/Renown cues only.
• The old continuous-noise helper is NOT invoked.
• No constant white-noise / hiss ambience was reintroduced.

BACKEND SECURITY / ECONOMY
--------------------------
Production verification on 2026-08-15:
• 18 Master Expedition definitions
• 5 long-form postgame projects
• 21 crew epilogue operations
• 6 new V16 persistent tables
• 10 V16 player-facing RPCs verified
• 0 direct anon/authenticated table grants on new V16 tables
• Master site checkpoint requires same-run location proof
• Master score/reward finalizer uses claimed run data
• Replay anti-farm active
• Failed Master objective gives zero progression reward
• Public profile veteran data respects existing privacy gate

Existing deliberately reduced Fish House economy is unchanged:
• Fjord Haddock Seared — 68 GP
• Longship Lobster Grill — 147 GP

REGRESSION
----------
V16 keeps:
• V15 The Deep Signal campaign
• V14 archaeology / 36 authored locations / 72 artifacts
• V13 Living Ocean ecology and tagging
• V12 Shared Ocean / Tideboard / records / tournaments
• TCG Patch main-script cache reference
• Ancient Hunts / The Descent / Fish House / save authority

See V16_TEST_REPORT.txt for the exact checks run.
