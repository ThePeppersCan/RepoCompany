REPO SPORTS V2 — TEST 50
FLAGS + LARGE READABLE RIGHT-SIDE STANDINGS

WHY THIS IS AN ADD-ON PATCH
This Test 50 package is designed to sit on top of your current Test 49 files.
It does not replace the match engine or shared-sync code.

WHAT IT ADDS

1. ALL 18 NEW CLUB FLAGS
The supplied flag ZIP has been mapped exactly:
- Hrafnvik
- Blackglass
- Saint Ciro
- Marenza
- Grand Khor
- Aurelia
- Drazh Hollow
- Rova End
- Zafir Row
- Talun Cross
- Ossa Mere
- Varka Fell
- Iskara
- Naskor
- Ashwick
- Skarholt
- Orsanne
- Cinderbank

Flags are shown throughout the V2 broadcast UI where club identity appears,
including:
- top score / team identity areas
- team sheets / lineup headings
- prediction choices
- match/presentation team headings where applicable
- V2 team-record rows where applicable
- right-side Repo Sports standings table

The supplied source flags were very large, so Test 50 includes transparent,
pixel-preserving web copies. This avoids adding ~35 MB of oversized flag data
to normal broadcast loads.

2. RIGHT-SIDE TABLE IS NOW MUCH BIGGER
The right standings panel now uses the large tall area beside the television.
It remains physically attached to the TV with only a 6px broadcast gap.

The table is widened to roughly 380–420px on normal desktop screens and grows
tall enough to make all 18 rows readable.

Columns remain:
# / Team / W / L / GF / GA / GD / WR

Each team row now also has its club flag.

3. DOES NOT TOUCH GAMEPLAY
No changes to:
- deterministic global sync
- match RNG
- 50/50 fairness
- match clock
- movement
- audio
- scoring
- leaderboard writes

INSTALL
1. Extract this whole ZIP into:
   C:\Users\Isaac\Desktop\web2\
2. Keep the assets folder structure.
3. Double-click APPLY-TEST50.bat once.
4. Press Ctrl + Shift + R in the browser.

The installer only adds one script tag to your CURRENT
repo-sports-quidditch-v2-test.html and creates a backup before changing it.
