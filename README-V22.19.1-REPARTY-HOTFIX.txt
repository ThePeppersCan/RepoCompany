REPO COMPANY — V22.19.1 REPARTY HOTFIX
=======================================

Apply over V22.19.

FIXED
-----
1. Reparty now AUTO-JOINS when the homepage Reparty tile is opened.
   - If a round is already live, you are genuinely queued for the next round.
   - You no longer get trapped on a fake spectator/"joining next round" screen without ever joining.

2. Fixed the collapsed/blank centre stage.
   - The main site's broad header/main/footer CSS was leaking into the Reparty dialog.
   - Reparty now uses isolated layout containers, so the game stage takes the correct width.

3. Fixed inactive Reparty screens remaining visible.
   - Only the active Lobby / Selector / Game / Results screen is displayed.

4. Added a visible live queue countdown.
   - While waiting for the current round to end, the centre panel shows that you are QUEUED and how many seconds remain.

5. Reopening Reparty during the same round now correctly restores the current phase instead of getting stuck on the lobby.

6. Cache-busted reparty-v1.js and reparty-v1.css from index.html so browsers do not keep the broken V22.19 frontend.

BACKEND
-------
No new Supabase migration is required for this hotfix.
The V22.19 Reparty backend is already running and was confirmed to be advancing rounds normally.

FILES
-----
index.html
reparty-v1.js
reparty-v1.css
README-V22.19.1-REPARTY-HOTFIX.txt
