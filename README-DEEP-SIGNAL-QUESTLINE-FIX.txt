REPO COMPANY / REPO DIVER V18.1
DEEP SIGNAL QUESTLINE FIX — 2026-08-16

WHAT WAS BROKEN
The opening campaign mission, THE SIGNAL IN THE SHALLOWS, told the player to
"FIND THE BUOY", but V18.1 never authored or rendered a buoy world objective.
The Coral Lantern Wreck was the only visible mission target, so the quest could
look impossible or be approached out of narrative order.

WHAT IS FIXED
- A deterministic damaged signal buoy now spawns in every non-replay opening
  Deep Signal campaign run at a guaranteed, reachable position.
- The buoy has a cyan pulse, sonar rings, a clear DAMAGED SIGNAL BUOY label,
  and E / gamepad A interaction prompt.
- Story Assist draws guidance toward the buoy.
- Inspecting it authoritatively registers the wreck bearing and advances only
  checkpoint 1: FIND THE BUOY.
- The Coral Lantern Wreck cannot bypass the buoy while checkpoint 1 is pending.
- After the buoy is resolved, the existing wreck exploration carries the
  mission through its remaining ordered checkpoints.
- No campaign progress has been reset.

QUESTLINE AUDIT
- 25 / 25 Deep Signal missions present and uniquely identified.
- 23 / 23 location-based missions reference valid authored locations.
- Every mission's recommended specialist tools are valid.
- Every authored mission-room tool requirement is valid.
- Supabase campaign catalog contains all 25 missions and every location-based
  mission references an existing server-side location.
- Server checkpoints still enforce sequential progression.
- Special flows for SILENCE AT EREBOS, BELOW THE CHARTED DEPTHS and THE DEEP
  SIGNAL remain intact.

DEPLOYMENT
This ZIP is cumulative with the current V18.1 binder/homepage/World Cup files.
Replace/upload the included files as normal. The new Repo Diver file is:
  assets/repo-diver/game.js
The included index.html cache-busts that file so browsers load this fix.

NO SQL TO RUN.
