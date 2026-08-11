REPO SPORTS QUIDDITCH V2 — ADMIN TEST 05

FULL-TIME MATCH REPORT
- Full-time screen remains visible for the full 30 seconds.
- After 30 seconds the next match enters its normal 30-second build-up.
- Match comparison now includes:
  shots, on target, missed chances, shot accuracy, possession,
  passes, pass completion, tackles won, tackles attempted,
  interceptions, counterattacks, turnovers, rebounds, fouls,
  penalties and VAR reviews.
- Every one of the six players has an individual match card showing:
  goals, assists, shots, shots on target, missed chances,
  possession time + share of team possession, tackles won/attempted,
  tackle success, interceptions, passes completed/attempted,
  pass completion, saves, rebounds and fouls.
- Player of the Match summary now also shows tackle contribution.

PLAYER SIZES
- Soup: ~15% smaller -> scale 0.75
- Nimbler 2000: 15% smaller -> scale 0.68
- ROCKY: ~10% smaller -> scale 0.76
- Besquelcher: ~5% smaller -> scale 1.06
- Jenny: ~5% bigger -> scale 0.97
- Pipsqueak unchanged.

PREDICTION DESK
- Moved to the clean open space at the top of the broadcast.
- No longer touches/overlaps the main central presentation card.
- Reduced height, border weight and typography.
- Fan vote percentages/counts and personal selection remain.

SCORING
- Very small symmetric goal probability increase for the five-minute format.
- Normal non-penalty goal baseline moved from 0.145 to 0.158.
- Maximum moved from 0.42 to 0.435.
- Same formula/RNG applies to both teams.
- No favourites, no rubber-banding, no scripted goals.

STAT TRACKING
- Individual possession is now tracked from the actual Quaffle carrier.
- Physical tackle attempts and successful tackles are tracked separately.
- On-target and missed-chance counts use the final visible shot outcome.
- V2 still writes ZERO RepoSports leaderboard/career statistics.

FILES CHANGED
- index.html (cache bust only)
- repo-sports-quidditch-v2-test.html (cache bust only)
- repo-sports-quidditch-v2.js
- repo-sports-quidditch-v2.css

NO SQL UPDATE IS REQUIRED FOR TEST 05.
Keep the prediction SQL already installed from Test 04.

INSTALL
Drag these files into C:\Users\Isaac\Desktop\web2\ and overwrite.
Then Ctrl + Shift + R.
