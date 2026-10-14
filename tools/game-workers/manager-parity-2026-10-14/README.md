# Manager published stylesheet correction

This is the exact, self-contained module set published to the existing
`repo-manager-achievements` Worker on 14 October 2026. It preserves the deployed
achievement wrapper and `GAME` service binding to `velmora-manager`. No route was
created or changed.

`modules/manager-player-background-data.mjs` contains the reviewed stylesheet,
including the existing artwork path `assets/ui-v2/main-menu-clean-v2.png`. The
wrapper applies it only to GET/HEAD requests for the Manager stylesheet, and only
when the upstream stylesheet still has the recorded original SHA-256. A newer
upstream stylesheet passes through unchanged. All other requests delegate to the
original Worker.

`provenance.json` records every module hash, the old and corrected stylesheet
hashes, the artwork hash, and the captured deployment/settings hashes.
`live-verification.json` records the live corrected hash and unchanged
representative game/integration endpoints. No authentication material is stored.

Future changes must capture the currently deployed Worker and preserve its
current modules and bindings. `tools/prepare-manager-parity-route.cjs` prepares a
fresh candidate and fails if the expected one-path correction no longer applies.
`tools/deploy-manager-parity-route.cjs --capture <fresh-capture> --candidate <reviewed-directory>` rechecks
the published stylesheet, deployed module set, settings, and deployment before
reporting readiness. It uploads only with the additional `--deploy` flag. The
reviewed candidate's metadata and module hashes must match its report. This
snapshot is an audit record, not a command to overwrite future Worker changes.
