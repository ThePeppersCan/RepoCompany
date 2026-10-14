# Repo Company for Windows — preview 0.1.8

The launcher uses the actual Repo Company website, including its game cases and Account navigation. The website's Download button provides the Windows preview. Homepage game cases install or launch games; **Account → Library** manages installation, updates, repair and removal.

The native login screen keeps the collection hidden until the existing website session passes server verification. Remembered valid sessions open automatically; sign-out or connection loss returns to the gate. The original transparent logo assembles during launcher, sign-in and game startup. The minimal login form includes account creation, restrained ambient light and reduced-motion support. Credentials use the website's existing sign-in service and are never saved in native preferences or included in state snapshots. Native library/navigation actions also check the account; the visual gate is not the only protection.

## Games and accounts

- **Morogue, Moratales and Velmora Manager** download separately from `https://repo-company-games.pages.dev`. Game payloads are not bundled into the launcher installer.
- All three support install, update, repair and uninstall. **Automatic game updates are on by default.** While the launcher is open, release checks run on startup, manual refresh and every ten minutes. Closing a game triggers another check so an update skipped during play can apply immediately afterward. A running game's installed files are never replaced.
- A verified Repo Company account and internet connection are required to play. Existing account, achievement and leaderboard services remain authoritative. Game views bind to the account that opened them, with local storage separated by account.
- Signing in to Repo Company automatically connects the Moratales character names and appearances held in that browser/profile. Downloaded Moratales also syncs new characters and appearance changes while playing and before closing, ready for Morogue. **There is no separate linking page to visit.** Conflicting characters are preserved rather than silently replaced.
- **Moratales adventures stay local.** Appearance sync does not upload or migrate full adventure saves. Existing browser adventures remain in their original browser/profile; installed adventures remain in the launcher profile. The game's import/export backup controls remain available.
- **Manager careers use its existing account cloud-save service**, with local account-scoped storage and a save-before-close check. No second career database is created.
- **Quitting Morogue ends the current Mora Mode or Endless Night run.** Runs cannot be resumed. Completed online achievements and leaderboard results remain on the account.
- Dragonbound, Repo Diver, Goblin Bomb Party, Repo Rooftops, High Seas and Repo Sports remain web demos inside the launcher. They require no installation and retain their current content/prototype status.

Game updates and launcher updates are separate. The remote **game** release channel is configured for all three titles. Starting with **0.1.6**, launcher releases use a pinned Ed25519 signing key and immutable installer checksums. Earlier previews need one manual installation of 0.1.6 to acquire this updater. Later releases are downloaded automatically while the launcher is open and installed on a safe exit, with a restart control when available. An active game or installation is never interrupted to apply a launcher update. Windows may still display an unknown-publisher warning: authentication by the launcher's own release key is separate from a commercial Windows Authenticode certificate.

## Launcher settings and Discord

The existing website's **Account → Settings** page includes Windows launcher controls. Both settings are saved for this computer's Windows profile and persist through account changes and launcher restarts.

- **Automatically update installed games** starts enabled. Switch it off to choose when to update in Account → Library. Version checks and explicit Update/Repair actions remain available. A download already in progress finishes safely; subsequent automatic downloads stop until the setting is enabled again. Enabling it triggers a fresh check.
- **Show games on Discord** starts enabled. It uses the user-configured Discord application IDs for MoraTales, Morogue and Velmora Manager in `config.cjs`. With the Discord desktop app running and the player's Discord Activity Privacy settings permitting it, the launcher publishes the launched game's title and elapsed play time. Closing the game, a renderer crash or switching this setting off clears the launcher's activity. No Repo Company account details, tokens, saves, scores or leaderboard data are sent to Discord. This setting controls activity published by the launcher; Discord's own game detection remains governed by Discord's settings.

Local assets and isolated Chromium game views are implemented. Higher frame rates than the browser version have not been established by benchmarks.

## One window and friends' messages

Games open inside the launcher, below its title bar. **Exit game** runs the game's existing save/exit checks and returns to the library. Morogue confirms ending the current run; it does not save a resumable run. **Messages** opens the company portal over the same game instance; **Back to game** restores it. The game remains running during messages and calls. Fullscreen, window resizing and crash recovery use the same launcher window.

The website and launcher share the friends-only messaging service. Only accepted friends can read or send messages to each other, and blocking/removing a friend revokes access and ends active calls. Messages have server-side ownership checks, retry identifiers, pagination and read receipts. The shell receives only unread counts and call state, never message content or call credentials.

Voice/video is disabled at the owner's request to avoid calling charges. `dashboard-config.json` explicitly sets `socialCallsEnabled: false`; configuring relay credentials alone cannot enable calling. The website hides call controls and keeps private messaging available without setup promises. No calling service has been activated.

Deploy `dashboard-messaging-schema.sql` to the dashboard D1 database before deploying the website's `/api/social/*` Functions. Apply it after the existing dashboard social schema; it is additive and repeatable. Dormant call code is tested with synthetic devices and local ICE candidates only. Do not enable the product flag, create a relay key or configure `SOCIAL_TURN_KEY_ID` / `SOCIAL_TURN_KEY_API_TOKEN` without a new owner request to enable calling and accept its costs. Server tokens must stay out of source control and client assets.

## Develop and validate

Use current Node.js and Windows x64. From the website checkout:

```powershell
Set-Location desktop
npm ci
npm test
npm run test:desktop
node tests/moratales-desktop.cjs
node tests/manager-desktop.cjs
node tests/settings-desktop.cjs
node tests/login-desktop.cjs
node tests/single-window-desktop.cjs
node tests/media-permissions-desktop.cjs
npm start
```

Integration tests use Playwright from the website's development dependencies and isolated profiles under `desktop/qa`. They run real game code/assets against in-memory account/API fixtures. Native flows for all three games passed without writing fabricated gameplay results to production. Morogue and Manager exercised actual library installation. Moratales verified every package hash and hardlinked the immutable assets into its test library to avoid another 1.38GB disk copy, then exercised character creation, gameplay, save/reopen, appearance sync and offline pause. Streaming installation, cancellation, corruption, repair and atomic rollback also have library tests. Fixture/profile switches are disabled in packaged applications.

These tests verify the integration contract. A real-account acceptance pass should still confirm newly earned achievements/results on the website and Manager career persistence against its production service.

The native Settings test uses the actual website anonymously and verifies that the new login gate rejects navigation and settings changes before and after restart. The native Login test uses isolated account fixtures to exercise invalid credentials, successful sign-in, reduced motion, remembered sessions, preference persistence, sign-out, offline locking and reconnect. Automatic-update tests cover opt-out, manual actions, active transfers, running-game deferral and immediate checks after closing. Discord protocol/lifecycle checks use fixture pipes, including reconnects, opt-out and clearing activity. The owner has confirmed real Discord profile activity for Morogue. Discord controls its separate game-detection panel. Hidden and fixture gameplay tests cannot publish activity to a real Discord client.

From the website root, `node tools/test-messaging-api.cjs`, `node tools/test-messaging-client.cjs` and `node tools/test-messaging-integration.cjs` test authorization/revocation, client races, two-account messaging and synthetic-device video. These use isolated account/database fixtures and never message production players.

## Prepare immutable game releases

The published web game is the content authority. A local checkout, build folder or version-looking URL query is not evidence that a package is current. Do not rebuild an unrelated dirty checkout. Preparation defaults to a dry run and refuses existing output; always choose an explicit game version and fresh output directory.

Morogue captures public GET bytes from its live page and the complete game integration subtree. The current game checkout and reviewed website checkout provide **filenames only**. The capture keeps published script order, localizes the integration scripts/assets, and re-fetches HTML and every executable/stylesheet to reject a mixed release. Native account/achievement and playtime services remain online. Per-file receipts record original URL/hash and bundled hash. From `desktop`, the reviewed preview.3 capture is reproducible with:

```powershell
$work = 'C:\Users\Isaac\Documents\Codex\2026-10-13\you\work'
node tools/prepare-morogue.cjs `
  --source C:\Users\Isaac\Documents\velmoragame `
  --repo-source "$work\character-sync-release" `
  --audit "$work\morogue-delivery-audit\report.json" `
  --version 0.1.0-preview.3 `
  --output releases/morogue-preview3 `
  --cache-blobs "$work\game-release-feed-v2\blobs" `
  --write
```

Use a new version/output for subsequent releases; the example must not overwrite the already prepared preview.3 package. `--audit` optionally pins a reviewed page/script capture; `--cache-blobs` hardlinks identical, verified content to save disk. Inventory-only unpublished files are reported; missing required resources fail preparation. Attribution metadata and dynamic filename suffixes are not treated as standalone runtime files.

Moratales and Manager preparation helpers produce **candidates**, which must pass the same live parity gate below. A local build may only supply a candidate when every delivered file is verified against the published game. Reviewed native account, save, pause and resource-path hooks are the only allowed differences; artwork, balance and game content have no exception. Moratales includes automatic character sync and guarded solo/co-op save hooks. No player saves or tokens belong in packages.

Keep source media and cached hardlinks unchanged throughout preparation and upload. Never replace an uploaded version's contents: publish a higher semantic version and advance its manifest. Current Morogue preview.3 is 536,312,897 bytes (about 536MB).

## Prepare and publish the game feed

Use `publish-game-release.cjs` as the required release workflow. It audits **all three** explicit package directories against fresh published responses, even when only one game changed. Every file's installed hash/size and original live URL/hash must pass, and each audit binds the exact manifest bytes. Previous reports and matching version labels cannot skip this check. A failed or incomplete audit stops before staging/publication.

The workflow creates a **new** static stage outside the website checkout, retaining all old blobs and unchanged manifests byte-for-byte. Replacements require a higher semantic version. Deduplicated `/blobs/<sha256>.bin` URLs avoid HTML redirects. Every file must fit the host's 25MiB limit and the stage must remain within its file budget. The reviewed packages for this release are Morogue `0.1.0-preview.3`, Moratales `0.1.0-preview.2` and Manager `0.1.0-preview.2`, at the paths below. Future candidates need new paths and versions.

```powershell
$repo = 'C:\Users\Isaac\Documents\GitHub\RepoCompany'
$work = 'C:\Users\Isaac\Documents\Codex\2026-10-13\you\work'
$staging = "$work\game-release-feed-next"
node "$repo\desktop\tools\publish-game-release.cjs" `
  --game "morogue=$repo\desktop\releases\morogue-preview3" `
  --game "moratales=$repo\desktop\releases\moratales-live" `
  --game "manager=$repo\desktop\releases\manager-live" `
  --base "$work\game-release-feed-v2" `
  --audit-output "$work\game-release-parity-next" `
  --output $staging `
  --deploy

node "$repo\desktop\tools\verify-release-feed.cjs" --expected-dir $staging --output "$repo\desktop\qa\live-release-feed.json"
```

Publishing requires existing Cloudflare access and explicit `--deploy`. Without that flag the workflow only audits/stages. It invokes the installed Wrangler from **STATIC STAGING**, never the RepoCompany working directory, so website Functions cannot enter the game feed. Keep audit reports outside the static stage. Do not use the low-level feed builder or direct Wrangler commands to bypass parity verification.

After deployment, `verify-release-feed.cjs` makes read-only HTTPS checks of all live manifests, entry documents, gameplay samples and largest binaries against reviewed staging. It validates size/hash, cache headers and range-request behavior. A host may return a complete file for a range request; the verifier checks the full fallback and records `supportsRanges: false`. Installation uses complete downloads, and the launcher's local protocol supplies media ranges afterward. Neither verification tool writes account/game results.

Future deployments must retain blobs referenced by still-published or supported manifests. Stable `/<game>/manifest.json` responses are not cached; blob responses are immutable. Keep staging/source hardlinks stable throughout deployment, then retain release metadata for reproducibility.

## Package the Windows launcher

```powershell
npm run package:directory
npm run package
```

Builds appear under `desktop/build`. The assisted per-user NSIS installer allows choosing its installation directory. The installer has no commercial Authenticode certificate. The authenticated automatic-update path uses the public release key embedded in `config.cjs`, checks the signed manifest, and hashes the exact downloaded installer before installation. `app-update.yml` must carry the exact `Repo Company Update Key` verification sentinel and `repo-company-launcher-updater` cache directory; the release verifier checks the metadata inside the actual installer.

Account/browser state, library metadata and installed games live under `%APPDATA%\Repo Company`. Game uninstall removes installed payloads while preserving account-scoped local saves/preferences and online records. Launcher uninstall retains application data too. Allow about 536MB for Morogue, 1.38GB for Moratales and 644MB for Manager, plus launcher/profile data and update space. Updates stage a complete new version before activation; old versions remain until game uninstall in this preview.

## Authenticate and publish launcher updates

Launcher installers are hosted in the existing public GitHub repository. The website serves the small static signed feed at `/releases/launcher/latest.json`, alongside immutable `VERSION.json` copies. This workflow does not create a subscription, provision a calling service, or rebuild/upload game packages. A developer still needs to release a reviewed new launcher version; players receive that published version automatically. An uncommitted local change is never a release.

The release private key is protected by Windows DPAPI for the current Windows user and stored outside every Git checkout at `%LOCALAPPDATA%\RepoCompanyReleaseSigning\launcher-update-v1.dpapi`. The directory grants access only to that user and SYSTEM. Key material travels only through process memory and anonymous pipes; no plaintext private key, token or secret belongs in source control, command-line arguments, build output, Pages or GitHub assets. A DPAPI file depends on the original Windows profile: copying it alone to another computer does not recover signing access. Preserve the original protected profile/key with the owner's secured backup process. Losing it requires a new trust bootstrap; do not silently replace the public key in a normal update.

**One-time setup only**, on the release owner's Windows profile:

```powershell
node desktop/tools/launcher-signing.cjs init-key --public-output C:\ReleaseEvidence\launcher-public.pem
```

This refuses to overwrite an existing private or public key file. After initialization, put only the public PEM in the reviewed launcher trust configuration and commit it before building. To recover the public PEM from an existing protected key, use `export-public --public-output NEW_PUBLIC_FILE` instead of generating another key. The installed updater pins the key ID `repo-launcher-2026-01`, public key, application/platform, exact repository URL and minimum sequence.

For a subsequent reviewed release, bump the launcher package/version lock to a higher three-part version, finish validation, commit the desktop source and publish that commit to the repository. From a clean website checkout with root and desktop dependencies installed, this command can build, verify, sign, publish and deploy a new launcher release:

```powershell
$releaseCommit = git rev-parse HEAD
node desktop/tools/publish-launcher-release.cjs `
  --commit $releaseCommit `
  --sequence 7 `
  --output C:\ReleaseEvidence\launcher-0.1.7 `
  --build --publish --deploy
```

Use the next unused sequence and a fresh evidence directory outside the repository. `--build` runs the locked dependency installation and desktop test suite, then creates only the Windows x64 NSIS installer; it does not build a ZIP or games. It requires a normal Node/npm installation. If building separately, omit `--build` and provide `--installer ABSOLUTE_EXE`. If archive-tool discovery is unavailable, provide `--seven-zip ABSOLUTE_7ZA_EXE`. Both paths still extract the actual installer and compare its packaged runtime and update trust metadata to the committed source. `--key-file` or `REPO_LAUNCHER_SIGNING_KEY` may select an existing protected `.dpapi` file outside Git; neither accepts plaintext keys.

Omitting `--publish` performs local verification/signing only and writes the manifest plus verification report. Publishing requires existing GitHub access via `GH_TOKEN` or the Windows Git credential helper. The tool verifies the source commit/tag, creates or reuses a **draft** release, uploads immutable installer/manifest assets, verifies their hashes (downloading them fully if GitHub has no digest), publishes the release, and checks that the installer is publicly available. Only then does it promote the website's signed `latest.json`. It does not overwrite a published version or commit/push unrelated files.

`--deploy` additionally requires `--publish`, Git push access and a verified deployment base. It rejects unrelated uncommitted source and staged QA files, builds the website while preserving reviewed game integrations, commits only the two promoted feed files, and pushes once to main. The existing Cloudflare GitHub integration deploys that commit. The tool observes the live feed for up to fifteen minutes without launching another deployment. Do not manually deploy beside the GitHub build: an older queued build could otherwise roll back the feed. Publish the reviewed source commit to a release branch before running this command; the feed commit then reaches main in the same push. Static manifests bypass Functions; the latest feed is `no-store`, and versioned manifests have immutable cache headers.

If publication is interrupted, retry with a fresh output directory and **the exact manifest already staged**:

```powershell
node desktop/tools/publish-launcher-release.cjs `
  --installer C:\ReviewedBuild\Repo-Company-0.1.7-Windows-x64.exe `
  --commit $releaseCommit --sequence 7 `
  --manifest C:\ReleaseEvidence\launcher-0.1.7\launcher-update.json `
  --output C:\ReleaseEvidence\launcher-0.1.7-retry `
  --publish --deploy
```

The retry verifies the original signature, source, version, sequence and installer bytes; it never signs different metadata for an existing release. A completed promotion is idempotent. If those reviewed bytes changed, publish a higher version instead. Manifests expire after 365 days by default (maximum 366); publish a new version/sequence before expiry even if a long-maintained launcher needs only a maintenance release. A stale, malformed, replayed or invalidly signed feed cannot authorize installation.

## Architecture and remaining release work

- `main.cjs` validates native commands, accounts and game lifetimes, and schedules release checks. `lib/account.cjs` verifies the existing website session; the Library UI receives no bearer token.
- `lib/preferences.cjs` stores only the device's launcher booleans in an atomically replaced `preferences.json`. `lib/discord-presence.cjs` uses Discord's local Windows IPC with the three configured application IDs, bounded reconnects and no user-token authentication.
- `lib/library.cjs` and `manifest.cjs` enforce trusted HTTPS sources, checksums, bounded downloads, safe Windows paths, cancellation, repair and atomic activation. Failed updates preserve the previous active version.
- `lib/protocol.cjs` serves installed assets under each game's original HTTPS origin. Account bridges, multiplayer APIs/WebSockets and cloud-save services retain their original routes.
- `game/` provides account-scoped storage and online/save/pause adapters. Moratales waits for its local save before closing and bounds its final appearance sync. Its co-op host waits for the existing worker checkpoint to persist. Morogue never saves a resumable run.
- `renderer/` supplies the native title bar and connection fallback. `portal-preload.cjs` adds Library and install/play actions to the real website. Views are sandboxed without Node.js; commands validate sender, frame, origin and allowed IDs.
- `lib/update-manifest.cjs` verifies the pinned Ed25519 signature, strict metadata, immutable URL and installer hash. `lib/updater.cjs` supplies only verified release metadata to the updater, retains replay protection, and revalidates the downloaded installer before applying it. The native shell checks for updates without disrupting active games. `tools/publish-launcher-release.cjs` is the matching reviewed release workflow; protected signing credentials never enter an installer or website bundle.
