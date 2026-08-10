REPO SPORTS — INTERCEPTIONS SCOREBOARD HOTFIX

Issue found:
The broadcast client was already displaying an INTERCEPTS column, but the backend get_live_quidditch_state() RPC never returned an interceptions property for each pet. Missing values therefore rendered as 0.

Fix:
1. Run fix-quidditch-interceptions-scoreboard.sql once in Supabase SQL Editor.
2. No website files need replacing for this hotfix.
3. Refresh the site.

Result:
- Interceptions now populate during live matches and at full time.
- MVP calculations include interceptions.
- Existing goals, scoring, predictions, possession, Snitch and sudden-death behaviour are preserved.
