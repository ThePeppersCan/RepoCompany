REPO SPORTS WORLD CUP — ADMIN LIVE TEST WAITING ROOM

What this patch adds
- TUNE IN! LIVE button directly beneath the World Cup map.
- Button is visible only to CatAsthma while ADMIN TEST MODE is enabled.
- Clicking it opens the supplied World Cup Waiting Room artwork.
- Players Waiting uses Supabase Realtime Presence.
- Working real-time lobby chat under the Players Waiting area.
- CatAsthma is always the only host and only account that can press START WORLD CUP TEST.
- Belros vs Zafran fixture artwork is fitted inside the Upcoming Fixtures gold frame.
- BACK artwork is clickable and returns to the World Cup hub.
- Host START sends a realtime start signal to everybody in the lobby and dispatches the browser event repo-world-cup-live-start.
- A future gameplay module can attach window.RepoSportsWorldCupGameplay.open(...) and will be called automatically when CatAsthma starts.

No Supabase SQL is required. This uses the same Supabase Realtime channel/presence system already used elsewhere on the site.

Install
- Replace index.html
- Merge assets/ into the website assets folder
