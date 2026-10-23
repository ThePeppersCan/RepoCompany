# COMP-RUN 2.6.1 release

This is the final release of the Uncrowned rebuild and private races described below. A live two-browser check caught a start-time skew when scene construction took different lengths on each client. Capture the server clock offset before loading the world and drive the countdown from absolute server time. With an injected 1.3-second delay on one client, both clocks agree within 1 ms in the recorded run. Pausing, remote visibility, ready controls, results, rematch and host migration pass against the public service.

The Pages API middleware now forwards successful WebSocket upgrades with their sockets intact. Its normal security and CORS response headers remain covered by a regression test. The actual installed native game also joined the public room service and exchanged ready state with a second client.

The 2.6.1 immutable native package contains 202 files / 265,959,382 bytes. Its offline ZIP contains 193 files / 131,324,300 bytes, SHA-256 `f759a6eafb3a2afd27dd805186a3f76e9f1c8fe06db65dc7ace6c9d46dc24126`. Route geometry, rewards and seasons are unchanged from 2.6.0. Native publication must preserve the complete 2.6.0 feed and its prior games.

---

# COMP-RUN 2.6.0 release

Uncrowned now has thirteen individually authored encounter routes and architectural treatments. Bosses travel on supported galleries alongside the player, with distinct warned environmental attacks. Repeated transport sections have been replaced with shorter combinations through encounter-specific furniture and structures. Full furnished runs at the game's fixed 120 Hz physics step take approximately 10.5 minutes in both difficulties.

Private multiplayer rooms support two to eight runners, every map and either difficulty. Remote runners have no collision. A common countdown, ready controls, standings, results, host migration and rematches are provided by the dedicated `repocompany-comp-run-races` Durable Object service through the portal service binding. Menus cannot pause a live race. Account tokens remain outside room messages; PBs use the existing authenticated completion path. Records remain client-attested with session and gate validation, not server-simulated physics.

The rebuilt route uses season `uncrowned-2`. Earlier completion evidence remains available for earned rewards; other map seasons are unchanged. Version 2.6.0 is accepted by the portal record endpoint.

The immutable native package contains 202 files, 265,959,313 bytes. The offline ZIP contains 193 runtime files, 131,324,295 bytes, SHA-256 `783e99897078d8ba8efbc19709a317146c7acda4b3bf6568d68b530ec4a9152e`. All four supplied MP3s and the fifteen original boss recordings are retained. Launcher 0.1.35 supports this runtime without a new installer.

Validation: full furnished Normal and Nightmare runs at 120 Hz, all thirteen boss/arena render checks, room-service integration, two real browser clients, solo pause and eight escape endings, actual native Library.install and Electron startup/account/music/settings checks, offline archive assembly/hash/error tests, portal SQL record tests and production build. The optional 30 Hz physics bot fails an early Admiral takeoff; the shipped game uses fixed 120 Hz simulation even at lower rendering rates. CPU render submission timings are not a GPU frame-rate guarantee or a human difficulty measurement.

Publication receipts are recorded under `desktop/release-evidence/comp-run-2.6.0-*`. The scoped native publisher must preserve the complete 2.5.0 feed, its historical blobs and the other three current game manifests, and compare all 202 payload files with the published website before deployment.

---

# COMP-RUN 2.5.0 release

Uncrowned is the ninth course: thirteen Morogue boss encounters across fifteen sections, with enclosed themed arenas, moving furniture landings, swings, three marked ascent towers and three large charged rebounds. The four supplied songs join the original boss score. Six default runners have revised models and realistic names; stable character IDs preserve existing unlocks. Short skippable escape endings and subtle wall-run motion complete the update.

Last Bloom now allows players to land on the fixed exits while its gantry is still rotating. The physics resolver uses the actual world collision shapes and preserves carried momentum. Foliage is checked using its transformed geometry bounds against route visibility and movement volumes, clearing the obstructed late-course landing without adding rendering work.

## Packages and account integration

The immutable candidate contains 199 files (265,903,106 bytes). Its offline ZIP contains 190 exact runtime files and is 131,308,988 bytes; SHA-256 `a1c5e0122cb439cc6d470f0331f2d152782439f097eeb436236eddbafb5b65f1`. The fifteen inherited Morogue recordings use 128 kb/s constrained-VBR Opus; all four supplied MP3s remain byte-for-byte unchanged. All nineteen tracks were decoded and played in Edge. The downloader's bounded archive limit is now 256 MiB. Full assembly, part/archive hashes, cancellation, retry and malformed responses are tested against the actual shipped archive.

Production D1 contains 19 COMP-RUN achievements worth 775 points. The two additive Uncrowned awards cover Normal and Nightmare. Unlocking all runners still requires the original eight courses, so the new map does not alter an existing reward. There are eighteen map/difficulty boards. New Uncrowned records use `uncrowned-1` and all fifteen ordered gates; Last Bloom uses `bloom-4` after its collision change. Earlier completions still count toward unlocks. Records are client-attested with server validation, not server-simulated physics.

The existing launcher 0.1.35 supports this package. Account tokens remain outside the game. Browser and native saves are separate; native settings and progress remain isolated by account.

## Existing-download preservation

The complete base feed retains 14,919 historical content blobs and current manifests for Morogue 0.1.0-preview.7, Moratales 0.1.0-preview.2 and Manager 0.1.0-preview.3. The scoped `publish-comp-run-release.cjs` workflow compares every COMP-RUN payload file against fresh live browser bytes, hashes retained history, preserves the other manifests byte for byte and checks their live identity immediately before deployment. Older local feeds must not replace these versions.

## Verification and limits

- All six furnished Uncrowned runs finished at 30, 60 and 120 Hz, in both difficulties, with all fifteen gates and valid records. Times range from 714.533 to 719.833 seconds.
- All four furnished Last Bloom runs passed at 120 Hz, covering safe and fast branches in both difficulties. Forty-eight early-exit landings passed across frame rates and rotation phases; gap misses still fall.
- Both furnished Rupture runs and both final-environment Small Hours runs passed. The lighting audit confirms Small Hours course and collision data match the previous published source exactly.
- Eight escape scenes were checked in browser for visible action, pause, resume, skip and results. Music transition, boss-art provenance, runner, movement, checkpoint and foliage tests pass.
- 309 native unit tests, production portal build, achievement/runtime tests, real SQL record tests and 117 Wibsworth source pins pass.
- The installed Electron integration checks real WebGL startup, launcher music suspension, settings, pause, record requests, account switching and offline gating using isolated account services. No synthetic production records are submitted.

An older Rupture destruction-unit assertion also fails on the unchanged published 2.4.3 baseline; the complete furnished Rupture simulations pass. The most aggressive Small Hours test takeoff preset hits an existing support, while its final-environment verification passes. These are retained limitations rather than claims that every historical test is green. Automated traversal and rendering checks do not measure human-perceived difficulty, audible listening quality or guarantee a particular GPU frame rate.

Browser Site version 28 is published from source `00e22d119250a6d6a139319a8960687eefac5677`. The portal deployment is `55a995bb.repocompany.pages.dev`, with its 2.5.0 boards and nineteen awards verified at the custom domain. Release evidence records the source, native installation and full live parity. A prepared package alone does not establish publication; the browser Site, guarded native feed and portal must each report a successful deployment.
