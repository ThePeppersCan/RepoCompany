REPO SPORTS QUIDDITCH V2 — ADMIN TEST 07

PREDICTION DESK
- Removed the unreliable centre-card-follow positioning.
- Prediction desk now uses a dedicated broadcast slot exactly 10px beneath the top scorebar.
- It no longer overlaps the scorebar.
- It no longer depends on the height/position of TEAM SHEETS / KEY PLAYERS / other centre cards.

FULL-TIME REPORT
- Still remains on screen for the complete 30 seconds.
- Panel now uses 94% of the broadcast width.
- Headline, score, match stats and player stats have all been materially enlarged.
- Match stat values are ~13px within the native broadcast canvas instead of tiny 4–5px values.
- Player names are ~10px.
- Individual metric labels are ~6px and values ~8px.
- Player metrics are now four columns rather than six ultra-narrow columns.
- All six players and all previously tracked match/player stats remain visible.
- Next match still begins its normal 30-second build-up after the 30-second report.

5-MINUTE ACTION BALANCE
- Same symmetric rules for both teams; match remains 50/50.
- Build-up and circulation are less pass-heavy.
- More drives during quiet/build-up phases.
- More shot intent in probing, counter and final-third phases.
- After 2+ consecutive passes in useful territory, pass weight progressively falls while drive/shot weight rises.
- After 5+ passes the anti-loop pressure becomes stronger.
- Successful passes and carries schedule the next decision sooner.
- Tackle attempt radius/probability increased slightly for more visible physical contests.
- Goal probability per ordinary shot receives only a small further bump:
  baseline 0.158 -> 0.165; maximum 0.435 -> 0.445.
- No target score, score scripting, favourite, rubber-banding or team-specific advantage.
- This permits naturally quiet games as well as occasional high-scoring games.

MUSIC 3
- Added the uploaded Storm of the Ancients track as a fourth background Quidditch track.
- Used by BOTH standard Repo Sports V2 and World Cup.
- Uses the exact same matchMusic mix volume as the other tracks.
- Random opening track now selects across all four tracks.
- Existing automatic track rotation includes Music 3.

FILES CHANGED
- index.html
- repo-sports-quidditch-v2-test.html
- repo-sports-quidditch-v2.js
- repo-sports-quidditch-v2.css
- world-cup-quidditch-v1.js

NEW ASSET
- assets/world-cup-game-v1/music-3.mp3

NO SQL UPDATE REQUIRED.
Existing prediction SQL remains unchanged.

INSTALL
Drag all ZIP contents into C:\Users\Isaac\Desktop\web2\ and overwrite.
Then Ctrl + Shift + R.
