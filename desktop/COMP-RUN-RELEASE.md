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
