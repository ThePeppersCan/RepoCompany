# Repo Company for Windows — preview 0.1.3

The launcher uses the actual Repo Company website, including its game cases and Account navigation. The website's Download button provides the Windows preview. Homepage game cases install or launch games; **Account → Library** manages installation, updates, repair and removal.

## Games and accounts

- **Morogue, Moratales and Velmora Manager** download separately from `https://repo-company-games.pages.dev`. Game payloads are not bundled into the launcher installer.
- All three support install, update, repair and uninstall. Release checks run on startup, refresh and every ten minutes. Available game updates apply while the game is closed.
- A verified Repo Company account and internet connection are required to play. Existing account, achievement and leaderboard services remain authoritative. Game windows bind to the account that opened them, with local storage separated by account.
- Signing in to Repo Company automatically connects the Moratales character names and appearances held in that browser/profile. Downloaded Moratales also syncs new characters and appearance changes while playing and before closing, ready for Morogue. **There is no separate linking page to visit.** Conflicting characters are preserved rather than silently replaced.
- **Moratales adventures stay local.** Appearance sync does not upload or migrate full adventure saves. Existing browser adventures remain in their original browser/profile; installed adventures remain in the launcher profile. The game's import/export backup controls remain available.
- **Manager careers use its existing account cloud-save service**, with local account-scoped storage and a save-before-close check. No second career database is created.
- **Quitting Morogue ends the current Mora Mode or Endless Night run.** Runs cannot be resumed. Completed online achievements and leaderboard results remain on the account.
- Dragonbound, Repo Diver, Goblin Bomb Party, Repo Rooftops, High Seas and Repo Sports remain web demos inside the launcher. They require no installation and retain their current content/prototype status.

Game updates and launcher updates are separate. The remote **game** release channel is configured for all three titles. **Launcher automatic updates remain disabled** in this unsigned preview; install newer Windows previews manually until signing and the launcher update feed are configured and tested.

Local assets and a dedicated Chromium window are implemented. Higher frame rates than the browser version have not been established by benchmarks.

## Develop and validate

Use current Node.js and Windows x64. From the website checkout:

```powershell
Set-Location desktop
npm ci
npm test
npm run test:desktop
node tests/moratales-desktop.cjs
node tests/manager-desktop.cjs
npm start
```

Integration tests use Playwright from the website's development dependencies and isolated profiles under `desktop/qa`. They run real game code/assets against in-memory account/API fixtures. Native flows for all three games passed without writing fabricated gameplay results to production. Morogue and Manager exercised actual library installation. Moratales verified every package hash and hardlinked the immutable assets into its test library to avoid another 1.38GB disk copy, then exercised character creation, gameplay, save/reopen, appearance sync and offline pause. Streaming installation, cancellation, corruption, repair and atomic rollback also have library tests. Fixture/profile switches are disabled in packaged applications.

These tests verify the integration contract. A real-account acceptance pass should still confirm newly earned achievements/results on the website and Manager career persistence against its production service.

## Prepare immutable game releases

Use reviewed, existing game builds. Do not rebuild an unrelated dirty game checkout as part of launcher packaging. Helpers default to a dry run and refuse to overwrite an existing release; use a fresh `--output` and version for new work. Initial preparation examples, from `desktop`:

```powershell
node tools/prepare-morogue.cjs --source C:\Users\Isaac\Documents\velmoragame\dist-web --version 0.1.0-preview.2 --write
node tools/prepare-moratales.cjs --source C:\Users\Isaac\Documents\velmoragame\dist-web --version 0.1.0-preview.1 --write
node tools/prepare-manager.cjs --source C:\Users\Isaac\Documents\GitHub\velmora-manager-web\dist --repo-source C:\Users\Isaac\Documents\Codex\2026-10-13\you\work\character-sync-release --version 0.1.0-preview.1 --write
node tools/prepare-moratales.cjs --verify releases/moratales
```

Review package reports and dependency audits. Selected website integration files provide achievements/account bridges. Moratales includes the reviewed automatic character-sync files and strict, packaging-only hooks into its existing solo/co-op save paths. No player saves or account tokens are included.

Moratales staging copies code and hardlinks media. Source media must remain unchanged until upload completes. The feed builder checks every file's size and SHA-256 again. Never replace an uploaded version's contents: publish a new version and advance its manifest.

## Prepare and publish the game feed

The builder reads the reviewed canonical `desktop/releases/{morogue,moratales,manager}` packages. It creates a **new** static staging folder containing game manifests and deduplicated `/blobs/<sha256>.bin` files. These content-addressed URLs avoid Pages HTML redirects. Manifests retain original installation paths, sizes and hashes. Individual files must fit the host's 25MiB asset limit.

```powershell
$repo = 'C:\Users\Isaac\Documents\GitHub\RepoCompany'
$staging = 'C:\Users\Isaac\Documents\Codex\2026-10-13\you\work\game-release-feed-next'
node "$repo\desktop\tools\prepare-release-feed.cjs" $staging

# Deploy from STATIC STAGING, never the RepoCompany checkout.
# Website Functions in the checkout must not enter this static game feed.
Push-Location $staging
try {
  & "$repo\node_modules\.bin\wrangler.cmd" pages deploy . --project-name repo-company-games --branch main
} finally {
  Pop-Location
}

node "$repo\desktop\tools\verify-release-feed.cjs" --expected-dir $staging --output "$repo\desktop\qa\live-release-feed.json"
```

Publishing requires the existing Cloudflare project access. The verifier makes read-only HTTPS requests for all three manifests, their entry documents and a gameplay script, and each game's largest binary. It validates sizes/SHA-256, cache headers and byte-range delivery. It neither installs games nor writes to account/game services.

Future deployments must retain blobs referenced by still-published or supported manifests. Stable `/<game>/manifest.json` responses are not cached; blob responses are immutable. Keep staging/source hardlinks stable throughout deployment, then retain release metadata for reproducibility.

## Package the Windows launcher

```powershell
npm run package:directory
npm run package
```

Builds appear under `desktop/build`. The assisted per-user NSIS installer allows choosing its installation directory. Preview 0.1.3 is unsigned; remove `win.signExecutable: false` and configure signing before a signed public release.

Account/browser state, library metadata and installed games live under `%APPDATA%\Repo Company`. Game uninstall removes installed payloads while preserving account-scoped local saves/preferences and online records. Launcher uninstall retains application data too. Allow about 360MB for Morogue, 1.38GB for Moratales and 644MB for Manager, plus launcher/profile data and update space. Updates stage a complete new version before activation; old versions remain until game uninstall in this preview.

## Architecture and remaining release work

- `main.cjs` validates native commands, accounts and game lifetimes, and schedules release checks. `lib/account.cjs` verifies the existing website session; the Library UI receives no bearer token.
- `lib/library.cjs` and `manifest.cjs` enforce trusted HTTPS sources, checksums, bounded downloads, safe Windows paths, cancellation, repair and atomic activation. Failed updates preserve the previous active version.
- `lib/protocol.cjs` serves installed assets under each game's original HTTPS origin. Account bridges, multiplayer APIs/WebSockets and cloud-save services retain their original routes.
- `game/` provides account-scoped storage and online/save/pause adapters. Moratales waits for its local save before closing and bounds its final appearance sync. Its co-op host waits for the existing worker checkpoint to persist. Morogue never saves a resumable run.
- `renderer/` supplies the native title bar and connection fallback. `portal-preload.cjs` adds Library and install/play actions to the real website. Views are sandboxed without Node.js; commands validate sender, frame, origin and allowed IDs.
- `lib/updater.cjs` has fail-closed Windows signature verification, but its launcher update channel is disabled. Before enabling it, sign the installer, set the trusted publisher and HTTPS feed in `config.cjs`, ship matching `app-update.yml` metadata, and verify a signed upgrade from an earlier installed version. Keep signing credentials outside source control.
