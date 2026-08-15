REPO DIVER V17 — 1.0 RELEASE CANDIDATE 1
Date: 2026-08-15

DEPLOYMENT
1. Replace index.html with the packaged index.html.
2. Replace assets/repo-diver/ with the packaged assets/repo-diver/ folder.
3. Deploy normally.

BACKEND
No Supabase migration is required for V17 RC1. This pass deliberately leaves the existing V16 server-authoritative campaign, archaeology, ecology, Master Expedition, records and economy backend untouched.

IMPORTANT V17 CHANGES
- Tideboard relocated upward onto the harbour rail so it no longer covers the central NPC walking line.
- Central harbour NPC slots are also spaced away from the Tideboard footprint.
- Standard Gamepad API controller support added.
  Left stick: swim / menu navigation
  Right stick: aim
  RT/R2: harpoon
  LT/L2: reel
  RB/R1: boost
  LB/L1: sonar
  A/Cross: interact / confirm
  B/Circle: back
  Y/Triangle: research camera
  X/Square: research tag
  Start/Options: pause
- Controller/keyboard prompts swap automatically based on the last active input device.
- Spatial focus navigation added for controller menus; focused elements scroll into view.
- Controller sensitivity setting added.
- Reduced Motion setting added.
- Auto-pause on browser tab hide/window blur added and clears held inputs.
- Fullscreen control added through the browser Fullscreen API.
- ESC now backs out of harbour subpanels consistently.
- Friendlier player-facing network/database error messages added while retaining console diagnostics.
- V11/V16 pending-save recovery remains intact.
- Existing clean audio architecture retained; continuous white-noise loop remains unused.
- All five Repo Diver frontend assets cache-busted to repo-diver-v17-rc1-polish-20260815.
- Existing TCG Patch main script cache reference preserved.

TESTING
See V17_TEST_REPORT.txt.
172 PASS lines / 0 FAIL lines across regression, V17 RC assertions and syntax checks.

Browser note:
A local Chromium headless visual attempt was made, but the container Chromium/DBus runtime timed out and produced no trustworthy screenshot. This package is NOT being represented as having completed a real browser visual playthrough.
