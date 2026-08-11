REPO SPORTS QUIDDITCH V2 — ADMIN TEST 06

PREDICTION DESK
- No longer uses a hard-coded screen percentage.
- It measures the currently visible central presentation card.
- It attaches itself exactly 8px beneath the presentation card.
- This prevents it covering the top scoreline or sitting on top of the central box.
- Works across arena intro, lineups, key players, prediction screen and kickoff countdown.

TEAM COLOURS
- Home scorebar team name + score: warm gold, matching home player name tags.
- Away scorebar team name + score: cyan-blue, matching away player name tags.
- Lineup subtext receives a softer matching tint.

REPO SPORTS V2 LAUNCH STING
- Clicking the CatAsthma-only REPO SPORTS V2 button first opens the supplied Repo Sports TV image.
- Full-screen TV ident is displayed before the test match feed.
- A bright diagonal shine sweeps specifically across the Repo Sports logo/screen area.
- Added a short custom broadcast power-on/chime sound.
- Match iframe loads behind the sting.
- Once both the minimum sting duration and the match page load are complete, the TV ident fades smoothly into the V2 feed.
- Closing the test mode cancels the sting cleanly.
- The normal RepoSports mode and World Cup launch are untouched.

FILES CHANGED
- index.html
- repo-sports-quidditch-v2-test.html
- repo-sports-quidditch-v2.js
- repo-sports-quidditch-v2.css

NEW ASSET
- assets/repo-sports-v2/repo-sports-v2-tv-sting.png

NO SQL UPDATE REQUIRED.
Existing Test 04 prediction SQL remains valid.

INSTALL
Drag all ZIP contents into C:\Users\Isaac\Desktop\web2\ and overwrite.
Then Ctrl + Shift + R.
