REPO SPORTS WORLD CUP — V38 MULTI-FIXTURE MATCH LOADER

This is the first full multi-fixture gameplay baseline.

NOW WIRED:
- Belros vs Zafran — Crown of Vardesh Glacier
- Iskandar vs Calvora — Hestholm Fjord Arena
- Sorevia vs Lumerre — Warmvein
- Talune vs Kordesh — Treedesh Forest
- Norveth vs Qasmir — Basalt Coast
- Nambara vs Elvane — Yrsa Varn
- Drazhen vs Rovarn — Hestholm Fjord Arena
- Vardesh vs Marovar — Crown of Vardesh Glacier

WHAT CHANGES PER FIXTURE:
- home team
- away team
- all 6 riding/standing player sprites
- flags
- arena background
- arena name in broadcast presentation
- hoop/shot coordinates
- match realtime channel
- scoreboard, lineups and full-time labels

ENGINE SAFETY:
- The existing home/away simulation slots are retained internally.
- Both sides use matching attacker/defender/support execution templates.
- Personality remains presentation-only.
- Existing 50/50 fairness, tackling, blocking, replays, celebrations,
  30-second pre-match anthem and broadcast systems remain in place.

ARENA GEOMETRY:
- Hoop coordinates are stored per fixture/arena.
- Crown uses the original working coordinates.
- The other supplied arenas have their own first-pass coordinates matched
  to the visible hoops in the artwork.
- These are deliberately easy to tune fixture-by-fixture during testing.

IMPORTANT:
This is the baseline pass before individual sizing/position tuning.
We should now test fixtures one at a time, starting with Iskandar vs Calvora.

INSTALL:
Drag the contents of this ZIP over:
C:\Users\Isaac\Desktop\web2\

Only new/modified files and required new team/arena assets are included.
Existing avatars, teaser posters, flags and unrelated assets are NOT duplicated.
