REPO COMPANY V18.1 — DEEP SIGNAL SITE PROGRESSION FIX

Fixes the site-campaign checkpoint bug that could leave The Signal in the Shallows stuck on MAP THE WRECK even after Coral Lantern Wreck showed STAGE 5 / 5 and SITE EXPLORATION COMPLETE.

LIVE BACKEND FIX
- repo_diver_campaign_checkpoint now persists intermediate site-mission campaign stages, not just depth/finale stages and final completion.
- Existing stuck site-campaign progress was reconciled from saved archaeology/location progress.
- Stale active campaign pointers to already-claimed runs were cleared safely.

CLIENT SAFETY FIX
- Interacting inside an already-completed campaign site now reconciles campaign checkpoints instead of only saying SITE EXPLORATION COMPLETE.
- Returning through the site entrance also performs a final campaign reconciliation before exiting.
- The first Deep Signal mission now produces a clear mission-complete banner/radio line once the completed wreck has been reconciled.

No SQL needs to be run manually.
