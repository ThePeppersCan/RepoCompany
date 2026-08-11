REPO SPORTS QUIDDITCH V2 — ADMIN TEST 01
==========================================

PURPOSE
This is a completely separate test version of STANDARD Repo Sports Quidditch.
It does NOT replace the existing live Repo Sports mode yet.

ACCESS
- A new "REPO SPORTS V2" ADMIN TEST button appears directly beside the normal
  Repo Sports button.
- It is visible only to username: CatAsthma.
- Existing REPO SPORTS button remains unchanged.
- Existing World Cup mode remains unchanged.

GAME ENGINE
- Forked from the current Repo Sports World Cup V38.12 gameplay engine.
- Continuous positional flying.
- Physical tackles/interceptions.
- Shot / block / save positioning.
- Quaffle hand attachment.
- Goal celebrations and replays.
- Referee / foul / penalty / VAR systems.
- Broadcast camera and match-flow director.
- Same symmetric 50/50 fairness rules; no team favourites or scripted winner.

STANDARD REPO SPORTS FORMAT
- Exactly 3 minutes of regulation gameplay.
- At 3:00 the match ends even if scores are level, matching standard Repo Sports.
- Draws are supported.
- No World Cup-style penalty shootout at the end of a normal rotation match.
- After the full-time presentation the next teams/arena rotate automatically.
- Admin "NEXT TEST MATCH" button skips directly to the next test rotation.
- No half-time.
- No World Cup tournament/fixture presentation.

LEADERBOARD SAFETY — IMPORTANT
- LEADERBOARD / DATABASE WRITES ARE DISABLED.
- The V2 engine contains zero .rpc() or .from() database calls.
- Test games do NOT add wins, losses/draws, goals, appearances, watchtime,
  player statistics or leaderboard records.
- Existing Repo Sports leaderboard data is untouched.
- Leaderboard writing will only be connected after explicit approval.

INITIAL TEST PLAYER POOL
- BESQUELCHER — attacker
- JENNY — defender
- NIMBLER 2000 — support
- PIPSQUEAK — attacker
- ROCKY — defender
- SOUP — support

The six characters rotate between balanced 3v3 combinations. Every side
receives one attacker, one defender and one support role.

SPRITE PREPARATION
- The supplied checkerboard backgrounds were baked into the source pixels.
- V2 copies were cleaned to real transparent PNGs.
- Source facing was normalised for the V2 renderer.
- Original uploaded source files were not modified.

12 TEST ARENAS
01 Sunspire Amphitheatre
02 Ironroot Forge Bowl
03 Canopy Thunderbowl
04 Emberkeep Coliseum
05 Mirage Crown Stadium
06 Moonbloom Glade
07 Observatory Arena
08 Coralcrest Harbour Arena
09 Skyhold Aerodrome
10 Lotuswater Pavilion
11 Gloam Carnival Ground
12 Thornvault Stadium

All 12 currently use one shared first-pass hoop/floor coordinate profile.
Test each arena and send screenshots; we can then tune hoop positions, ground
anchors, player scale and camera framing per arena.

FILES IN THIS PATCH
- index.html
- repo-sports-quidditch-v2-test.html
- repo-sports-quidditch-v2.js
- repo-sports-quidditch-v2.css
- assets/repo-sports-v2/players/ (12 cleaned sprites)
- assets/repo-sports-v2/arenas/ (12 arenas)
- this README

UNCHANGED
- script.js
- existing Repo Sports engine
- World Cup engine
- Goblin Bomb Party files
- binder files
- unrelated site assets

INSTALL
Drag the contents of this ZIP into:
C:\Users\Isaac\Desktop\web2\

Overwrite index.html when prompted.
Then press Ctrl + Shift + R.

VALIDATION
- repo-sports-quidditch-v2.js syntax: PASS
- 12 arena PNGs present
- 12 player PNGs present
- zero database/leaderboard write calls in V2 engine
- existing live Repo Sports button preserved
- World Cup V38.12 reference preserved
- Goblin Bomb V38.17 multiplayer reference preserved
- 3-minute match duration verified
- automatic rotation reset verified
