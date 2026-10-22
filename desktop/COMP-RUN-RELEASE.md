# COMP-RUN 2.4.1 — release evidence and remaining gates

The browser game is published at https://comp-run.fluffy-star-4855.chatgpt.site/. Source commit: `2fc6dc2d333d7cfb902d0ea1202c7bac6c0117ff`. The candidate Repo Company launcher remains **0.1.33**; preparation is not a signed launcher release.

## Game and interface

Rupture has varied jumps and ramps, a moving and correctly grounded monster opening, articulated armour and limbs, cable and tunnel encounters, three leaps, and an evacuation platform struck by the actual pincer. Full furnished simulations completed Normal and Nightmare with every required gate and traversal interaction and no unsafe landings, stalls or premature capture. Current Rupture records use a new season so old shorter-route times cannot rank against this route.

The existing COMP-RUN logo now anchors the main menu, course selection, settings, loadouts, pause, help, results, HUD, leaderboards and account connection. The layout uses restrained charcoal, white and red, compact controls and optional help/credits. Browser checks cover 720p, narrow screens, all eight map selections, pause/pointer capture, keyboard focus and nested Escape behaviour.

## Immutable package

The final `native-verified` candidate contains **148 files / 93,555,888 bytes**, including the independent offline download. Runtime: **144 files / 48,078,902 bytes**.

| Evidence | SHA-256 |
| --- | --- |
| Runtime fingerprint | `ed796fd0502ca0cce099983d65dc4318a12216baf3060fe83193ee3962641d0c` |
| Complete distribution fingerprint | `034344d87da88d5048a787330aa3b593960a03611268a366f1ea0a18d6bce1b0` |
| Offline ZIP, 45,476,254 bytes in three parts | `fd470d9ff2c5fa0ea7109c946c86f3a125d509012c51a3e76072f72e3f9f64fd` |

The launcher injects storage, connection, account, exit and playtime adapters outside the immutable payload. Local settings, ghosts, unlocks and records are isolated by launcher account. Unfinished runs are not resumable; browser saves are separate. This is not a general cloud-save feature.

Fresh live asset parity passed **148/148 files** with no differences or errors. Requests identify themselves as AJAX so Cloudflare returns the asset without per-navigation detection markup; no response bytes are stripped or normalized. This follows the documented [JavaScript Detections behaviour](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/javascript-detections/). The audit records that request header and hashes every returned byte.

## Achievements and online records

There are **17 achievements / 700 points**: each of eight maps in Normal and Nightmare, plus unlocking all eight runners. Account-owned completion evidence is retained separately from guest records. Existing account-owned native completion records can award achievements; old PBs are not silently uploaded into new rankings.

The main-menu leaderboard supports every map and difficulty, pagination, equal-time ties, local PB display, empty/error states and current route seasons. The API validates account ownership, a server-issued run session, elapsed time and complete ordered checkpoint splits, then keeps the fastest accepted time. Results remain client-attested; this is not server-side physics verification or a claim of cheat-proof competition.

Browser sign-in runs in the Repo Company origin. Native ranked/achievement requests use bounded main-process capabilities; the game never receives an account bearer token. Identity changes during requests are rejected.

Staging D1 has the additive achievement tables, three COMP-RUN tables and all 17 rules. Production migrations and website deployment remain pending. Apply `dashboard-comp-run-schema.sql` and the COMP-RUN-only rules from `dashboard-achievement-rules.sql` before enabling the production API. Existing achievement data and score ledgers must remain intact.

## Verified captures and installed-game checks

The gallery contains three actual 1920×1080 captures from this exact runtime: The Last Playdate, The Small Hours and The Final Curtain. They were taken through normal game menus in installed Edge with hardware WebGL and visually reviewed. Capture provenance is retained under `desktop/release-evidence/`, outside the public website. These are in-engine opening scenes, not completed runs or generated artwork.

The real Electron integration test installs all manifest files through `Library.install`, renders WebGL, checks opening skip and gameplay pause, routes a ranked request through the main process, reopens with persisted settings, reconnects after a simulated disconnect and verifies another account receives separate default settings. Account services are isolated fixtures. This does not claim a production-account Windows playtest, audible audio inspection or a signed-installer acceptance pass.

Relevant checks:

```powershell
node tools/test-comp-run-integration.cjs --require-screenshots
node tools/test-comp-run-records.cjs
node tools/test-achievements.cjs
node tools/test-achievement-runtime.cjs
node tools/test-game-achievements.cjs
node tools/build-dashboard.cjs --production
node --test desktop/tests/comp-run-account.test.cjs desktop/tests/comp-run-launcher.test.cjs
```

`desktop/tests/comp-run-desktop.cjs` takes the immutable candidate directory and installed Electron executable as its two arguments. Run it with Playwright available on `NODE_PATH`.

The full native unit suite passes **297/297 tests**. Catalogue, real-SQL achievement/record checks, gallery integration and the normal production website build also pass. These checks do not replace the remaining real-account and signed-installer acceptance checks below.

## Remaining publication gates

The old complete feed at `C:\Users\Isaac\Documents\Codex\2026-10-13\you\work\game-release-feed-v2` is absent from this PC. Its replacement location is needed to preserve all historical blobs and existing downloads. Do not deploy a reconstructed partial feed.

Once that directory is located, use the existing guarded four-game workflow with the reviewed immutable Morogue, Moratales, Manager and COMP-RUN packages:

```powershell
node desktop/tools/publish-game-release.cjs `
  --game "morogue=$moroguePackage" --game "moratales=$moratalesPackage" `
  --game "manager=$managerPackage" --game "comp-run=$compRunPackage" `
  --base "$previousCompleteFeed" --output "$newFeed" --audit-output "$newAudits"
```

All four must pass fresh live parity; then publish using the same guarded tool with fresh output directories and `--deploy`, and verify the resulting feed. Complete the Windows acceptance pass for fullscreen, audible audio, a real signed-in run, Credits download and returning/reopening.

Use the existing signed launcher workflow in `desktop/README.md` with an unused release version/sequence. The Windows DPAPI-protected release key and pinned public key are unchanged. Publish the reviewed website/source and signed launcher feed through the existing GitHub/Cloudflare workflow, without a competing website deployment. Older clients retain the explicit **Update launcher** gate for COMP-RUN.
