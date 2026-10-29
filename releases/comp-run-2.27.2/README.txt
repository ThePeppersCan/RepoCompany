COMP-RUN 2.27.2: persistent parties

The site catalogue and native launcher manifest refer to exactly the same 487 content-addressed files. Simulation version remains 2.27.1 / protocol 3 because movement and server replay verification did not change. Only the five game files listed in release.json differ from 2.27.1. The source for those files is checked in here. Run materialize.mjs to reconstruct and verify the complete release from retained immutable blobs, then run the tests. No credentials are needed to materialize.

Changes
- Lobby connection stays open during races. Party identity, leadership and lobby are retained.
- Leader can restart the group or return everyone to the same lobby, then select another map.
- Joining / loading / ready states, live party roster, room-code sharing and invitations across the lobby.
- Brief connection losses reserve membership for 90 seconds, with automatic client reconnection.
- Distinct arrival positions and close-range peer visibility; fixed hand-link player-ID reference.
- Keeps the launcher catalogue identity and all launch/auth repairs from PR #28.

Validation
- Two-client join, boarding and results across all 20 maps.
- Same party through RE-PEAK, The Reverse and Comp Crossing, shared restarts, results, returns, pose exchange, denied nonleader actions, reconnect and leader transfer.
- Two actual browser game clients: visibly rendered runners, UI invite/accept, ready, race, restart, same-lobby return and automatic reconnect, without runtime errors. The test driver and QA identity are local-only fixtures.
- Existing party interface and multiplayer entry tests.
- No claim of full map playthroughs or eight-player load testing.

Run
node materialize.mjs
npm install
npx playwright install chromium
node tests/party-network.cjs
node tests/network.cjs
node tests/browser-party.cjs
node tests/party-interface.mjs
node tests/multiplayer-entry.mjs

Publishing
Retain all existing feed blobs and the three other games' manifests. Upload new archive blobs, deploy workers/races/wrangler.toml, upload the launcher feed, then deploy ../../workers/comp-run-gateway/wrangler.toml. Gateway routes and RACES binding must retain the launch repair. Never deploy the older root workers/comp-run-races configuration over the v2271 service. The old offline ZIP remains a separately versioned 2.27.1 download.
