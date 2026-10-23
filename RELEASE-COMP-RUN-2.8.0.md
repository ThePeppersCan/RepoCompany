# COMP-RUN 2.8.0

COMP-RUN now shares one connected account for activity, achievements and ranked runs, so launcher play appears in Recent activity with its existing bespoke art. The achievement detail view accepts COMP-RUN and opens all 19 awards.

Ghost settings offer World Record, Your PB and Off. Uploaded replays belong to accepted PBs; only the exact fastest record is played, with unavailable replays stated explicitly. The ghost is substantially fainter and fades near the runner.

Multiplayer offers One Life and Race. Race removes pursuit, restarts only a fallen runner at the beginning without resetting the shared clock, and keeps separate PBs/ghosts. Playground zipline approaches now auto-catch running or sliding players. The game also retains capture across its intro to avoid the extra starting pause screen.

Validation: real SQLite replay/activity tests, time/reward regressions, two-client room lifecycle and independent restart checks, 108 cable approach/landing simulations, full playground runs in both difficulties, nine-map pursuer visibility, browser menus and respawn with OS mouse capture disabled, and profile/achievement detail rendering.

Deployment: apply additive dashboard-comp-run-replays.sql and confirmed-start-only dashboard-comp-run-activity-repair.sql; deploy the race worker and portal; publish the matching game Site and preserved native game feed. Missed historical playtime is not estimated.
