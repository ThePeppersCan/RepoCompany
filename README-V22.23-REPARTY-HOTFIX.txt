REPARTY V22.23 — BUILDER BLITZ / FISHING / GAME REVEAL HOTFIX

Apply over V22.22.
No Supabase migration required.

Changes:
1. Builder Blitz rebuilt as a mouse-first 4x4 construction memory game.
   - 2.2 second blueprint study phase.
   - Five authored blueprint templates (with mirrored variants) instead of noisy random grids.
   - Clickable material palette: Erase / Stone / Wood / Glass.
   - Click or drag across cells to construct.
   - Large clickable SUBMIT BUILD button; Space/Enter still supported.
   - Live 3D-ish model preview, hover feedback, material texture cues, inspection feedback.
   - Multiple blueprints per round and perfect-build scoring.
   - Empty submissions are rejected.

2. Fishing Frenzy fish now spawn ONLY from the right edge and travel right-to-left.

3. Reparty selector no longer leaks the incoming game's skill before the game is announced.
   - Top skill display shows ??? while selector spins.
   - Selector XP field shows XP ??? while selector spins.
   - Game name / type / objective / skill reveal together when the selector locks in.

4. Game cleanup hardened.
   - Game FX layer is cleared between modes.
   - Animation loops are scope-bound so a stale prior-game RAF cannot keep running into the next minigame.

QA:
- JavaScript syntax: PASS (node --check).
- Browser QA: Chromium, 1440x960, zero runtime errors.
- Selector hidden state: top=???, selector=XP ???, name=??? — PASS.
- Selector reveal state: Construction / Construction / BUILDER BLITZ — PASS.
- Builder Blitz: preview -> material selection -> cell placement -> submit -> score update — PASS (test score 11).
- Fishing: visual QA confirmed first active fish enters from the right edge; source enforces x>w and dir=-1 — PASS.
