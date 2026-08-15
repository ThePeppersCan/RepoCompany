V18.1 UI POLISH HOTFIX
- NPC dialogue close button no longer overlaps names.
- Tideboard re-anchored into the harbour scene.
- Brown / bronze low-premium UI accents replaced with cooler premium teal panel controls on expedition and subpanel surfaces.

REPO DIVER V18 — 1.0 GOLD MASTER CANDIDATE
Build date: 2026-08-15

DEPLOYMENT
1. Replace the site's index.html with this package's index.html.
2. Replace assets/repo-diver/ with the folder in this package.
3. Deploy normally.

BACKEND STATUS
A production Supabase security migration has ALREADY BEEN APPLIED.
DO NOT RUN the included SQL during deployment.
The SQL file is reference-only.

GOLD MASTER CHANGES
- Permanent Tideboard/NPC collision prevention: the Tideboard is rail-mounted higher, uses short brackets, and harbour NPC placement is checked against real blocker rectangles after render and resize.
- Legacy Hall is moved away from the Tideboard and receives a more architectural exterior treatment.
- Marine Institute exterior receives a final architectural polish pass.
- Controller input-mode hysteresis prevents small stick drift from constantly changing button prompts.
- Controller A can perform the active Fish House cook-timing action.
- Keyboard/controller focus is trapped inside Repo Diver while open, with child-panel focus return.
- Fish Journal gains fast search and biome/rarity/discovered filters.
- Repo Diver-only fatal error recovery surface can return to Harbour or reload without replacing unrelated RepoCompany errors.
- Developer ecology overlay is gated behind an explicit dev flag.
- Dead continuous-noise helper code was removed from audio.js; no constant white-noise/hiss loop is active.
- Core Repo Diver catalog tables are no longer directly writable by anon/authenticated roles.

CACHE BUSTING
Changed in V18:
- repo-diver.css?v=repo-diver-v18-gold-master-20260815
- audio.js?v=repo-diver-v18-gold-master-20260815
- game.js?v=repo-diver-v18-gold-master-20260815

Unchanged from V17 and intentionally not re-busted:
- data.js?v=repo-diver-v17-rc1-polish-20260815
- engine.js?v=repo-diver-v17-rc1-polish-20260815

The normal site TCG Patch reference remains preserved:
script.js?v=tcg-patch-cards-20260815-v1

TESTING
See V18_TEST_REPORT.txt for exact checks.
Node/engine/static regression tests passed.
A Chromium visual run was attempted, but the container Chromium/DBus runtime timed out before producing a trustworthy screenshot; this package is NOT being described as browser-automation tested.
