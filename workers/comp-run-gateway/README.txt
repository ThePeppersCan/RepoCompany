Repo Company launch gateway — production recovery, 29 October 2026

This directory preserves the live COMP-RUN 2.27.1 gateway and its exact
content-addressed asset catalogue. The portal itself remains on its existing
Pages deployment. The RACES binding points at the matching 2.27.1 service.

The installed launcher identifies COMP-RUN by its stable catalogue origin,
https://comp-run.fluffy-star-4855.chatgpt.site. Changing the game-scenes URL to
the portal path makes existing launcher versions fail to recognize the game.
Keep that catalogue identity; repo-web-game.js chooses the current browser
address, https://repocompany.uk/comp-run/, separately. Both launch paths then
load 2.27.1 and use the same versioned multiplayer service.

The gateway also applies the reviewed Morogue account bridge correction while
the portal Pages deployment catches up. Same-account INITIAL_SESSION,
SIGNED_IN and TOKEN_REFRESHED events no longer invalidate character reads.
Sign-out and identity changes still invalidate pending operations. The account
frame allows the portal as an ancestor for its nested browser game window.
Trusted message origins and the parent nonce remain unchanged.

Source validation (repository root, Node 24+):
  node --test workers/comp-run-gateway/launch.test.mjs
  node tools/test-character-account-bridge.cjs
  node --test desktop/tests/account.test.cjs desktop/tests/comp-run-launcher.test.cjs desktop/tests/library.test.cjs
  npx wrangler deploy --config workers/comp-run-gateway/wrangler.toml --dry-run

Deployment:
  npx wrangler deploy --config workers/comp-run-gateway/wrangler.toml --keep-vars

The configuration records only this worker's exact production routes. Other
workers, including the Manager worker, are not part of this deployment.
Do not deploy an older full portal build to remove these overlays. First carry
the corresponding root source fixes into the current portal release, validate
the launch paths, and then remove redundant transformations/routes together.

Verification performed against the live service:
  - Installed launcher 0.1.36: COMP-RUN Play button, 2.27.1 menu and account.
  - Live authenticated private lobby: welcome and player state received.
  - Signed-in web portal: current COMP-RUN 2.27.1 menu and account.
  - Morogue: repeated native starts and browser start reach the menu.
  - All four downloadable game feeds return valid current manifests.
  - Local current multiplayer worker: two clients, visibility/movement, invites,
    parties, ready state and synchronized race start across all 20 courses.
    The test waits for the configuration's newer state revision, avoiding the
    default-course false positive in the previous test harness.

These checks cover startup and networking, not complete gameplay runs. Live
testing used the existing signed-in account; the two-player test used isolated
local worker instances and did not fabricate production player identities.
