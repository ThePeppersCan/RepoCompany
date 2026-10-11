# Gameplay achievements

The 300 approved definitions and their artwork remain in `assets/achievements/catalogue.json`. Each definition now has a bounded observation metric and threshold. Gameplay supplies observations; the account service chooses rewards, records the first server unlock date and awards RepoScore exactly once. Progress is monotonic and survives retries. Global percentages count signed-in players who have started that game since tracking began; no synthetic percentages are shown.

`game-achievements-client.js` runs on the three game origins. An account-origin iframe handles authentication without giving tokens to the game. Observations are saved locally per account and retried after connection failures. Switching accounts requires reopening the game. Practice and development/test runs are excluded. Existing save evidence is credited when first observed; this records today's unlock date, not an invented historic date. Challenges requiring action history begin when tracking is installed.

These browser games supply client observations. Authentication, reward amounts, dates and duplicate prevention are enforced by the service; the game simulation is not an anti-cheat server. Complex per-run/per-career history and distinct-object collections are saved by their adapters on the device. Account progress and earned achievements are stored centrally. Merging distinct collections played independently on multiple devices is not currently supported.

## Release without reverting games

The files under `game-integrations` are the exact published game sources captured on 11 October 2026, with narrow observation hooks. Do not replace them with an entire local development checkout. `tools/build-game-achievements.cjs` bundles the adapters and versions every replacement by its content hash. `tools/game-workers/integration.mjs` replaces only those named scripts, while retaining the original HTML, artwork, save storage, server routes and Durable Object implementation.

Release order:

1. Run `node tools/test-achievement-runtime.cjs`, `node tools/test-game-achievements.cjs`, `npm run test:achievements`, and `npm run build`.
2. Apply `dashboard-achievements-schema.sql` and then `dashboard-achievement-rules.sql` to the dashboard D1 database. Both are additive and repeatable. Never reset player balances or inventories.
3. Deploy the current website using `npm run deploy:production`. The existing deployment-base guard must pass.
4. Run `node tools/test-achievement-workers.cjs --work-dir <private captured-release directory>`.
5. Run `node tools/deploy-game-achievements.cjs --work-dir <private captured-release directory>` for a read-only comparison against the current published assets and Workers. Add `--deploy` only after that comparison and the website deploy succeed. The tool refuses to overwrite changed game sources, retains the existing asset manifests and bindings, and stores previous deployment IDs privately for rollback. Then use `tools/deploy-manager-achievement-route.cjs` with the same arguments. Manager's assets-only hosting retains its original routing mode with `keep_assets`, so its small routing Worker forwards to the original asset service and adds the HTML hooks. It never replaces the asset manifest. The route is `manager.repocompany.uk/*` and the Worker is `repo-manager-achievements`.
6. Check all three live entry pages, Account achievements, the account bridge and ordinary gameplay. Do not create fake production unlocks as a test.

The capture directory contains original source snapshots, Worker settings and previous deployment IDs; it is never published. The deployment tool uses the existing Wrangler login or `CLOUDFLARE_API_TOKEN` without printing credentials. Roll back a game Worker to the previous version listed in its private `*-pre-achievements-deployments.json` file if necessary; achievement data need not be rolled back.
