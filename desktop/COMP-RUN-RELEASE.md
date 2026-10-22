# COMP-RUN 2.2.1 — release preparation

This change prepares COMP-RUN immediately above Demos in the homepage collection and adds its installable entry to the native launcher. The candidate launcher version is **0.1.33**. A review branch is not a production release.

## Preserved game

The candidate contains all **133** files from the published COMP-RUN 2.2.1 distribution, totalling **87,210,713 bytes**. Every file has passed a fresh live comparison against `https://comp-run.fluffy-star-4855.chatgpt.site/`. There are no game-file transforms, including text normalization. The native manifest's SHA-256 is `aa53264b71188090b79eb12f378a62ab754c68ec9797bc3b3409cef2f774b42d`.

The independent offline download is the existing archive, reconstructed from its three published parts without recompression. It is **42,413,437 bytes**, SHA-256 `063cc38f065866b01202c733906825e19979c34376ccab048381f5ceeaa0702f`.

The native package includes `downloads/` so the original Credits download remains available. Its largest individual file is 16,777,216 bytes. The original browser origin is retained for web play. Native local storage is scoped to the signed-in launcher account; existing browser saves are not imported. Completed records, ghosts, unlocks and settings persist locally, while unfinished runs are not resumable. No achievements or cloud-save support are invented.

The launcher injects its own storage, connection, exit and playtime adapters when serving the installed entry document. These files are outside the immutable game payload. Only the active, visible, signed-in COMP-RUN main frame may request mouse capture or fullscreen.

## Current gameplay captures

Fresh gameplay captures are a release requirement. The development browser used during preparation could not initialize WebGL, and older supplied captures do not establish the current appearance. The gallery displays an honest pending state until actual screenshots are present.

On Windows, use the repository's normal development dependencies and installed Edge or Chrome. The capture helper does not install browsers or edit the game:

```powershell
node tools/capture-comp-run-screenshots.cjs `
  --game-dir "C:\Release\COMP-RUN-2.2.1-Release\native\payload" `
  --browser msedge `
  --output "C:\Release\comp-run-captures-2.2.1"
```

Use `--browser chrome` for Chrome. The helper validates the exact 2.2.1 runtime fingerprint, uses the normal game menus, and captures the in-engine openings of The Last Playdate, The Small Hours and The Final Curtain. It writes all three untouched PNGs plus provenance only after successful rendering and checks. Inspect the results, then copy `playdate.png`, `small-hours.png` and `final-curtain.png` to `original-case-assets/comp-run/screenshots/`. Keep `screenshot-provenance.json` with release evidence.

Run the required gallery gate from the repository root:

```powershell
node tools/test-comp-run-integration.cjs --require-screenshots
```

Do not replace these images with generated art or old defect captures.

## Validate on Windows

Use a normal GPU-enabled Windows installation for the final acceptance pass. Verify installation from the staged feed, the original game startup, normal menu navigation, mouse-look, fullscreen, audio, an actual run, returning to the library, and reopening. Confirm that a completed record or changed setting persists for the same account and is isolated from another account. Check disconnect/reconnect, the Credits offline download, and the older launcher's explicit update message.

The native unit and source integration checks run independently of this acceptance pass. Passing those checks does not establish rendered gameplay or a successful installed Windows launch.

## Publish the game feed through its existing gate

Set the variables below to the reviewed local package directories, previous complete feed and fresh output directories. The COMP-RUN directory contains `manifest.json` and `payload/`. The other three game packages are the existing reviewed releases in the Windows release workspace.

```powershell
node "$repo\desktop\tools\publish-game-release.cjs" `
  --game "morogue=$moroguePackage" `
  --game "moratales=$moratalesPackage" `
  --game "manager=$managerPackage" `
  --game "comp-run=$compRunPackage" `
  --base "$previousFeed" `
  --output "$reviewFeed" `
  --audit-output "$reviewAudits"
```

This audits all four packages and prepares a new static feed. Existing manifests and every historical blob are preserved when migrating the three-game feed. The COMP-RUN-only successful audit does not substitute for this all-game gate.

For authorized publication, use the same immutable inputs, new output/audit directories, and add `--deploy`. Existing Cloudflare access is required. Then run `desktop/tools/verify-release-feed.cjs` against the staged feed. The configured COMP-RUN manifest is `https://repo-company-games.pages.dev/comp-run/manifest.json`.

## Website and launcher release

1. Finish and commit the real screenshots and Windows acceptance evidence. Review the complete repository change.
2. Publish and verify the four-game feed through the guarded workflow above.
3. Use the existing signed Windows launcher release workflow in `desktop/README.md`. Version 0.1.33 needs an unused update sequence verified at release time; do not reuse a published version or sequence.
4. Publish the reviewed website/source and signed launcher feed through the existing GitHub/Cloudflare workflow. Do not run a second competing website deployment.

The launcher release signing key remains protected by Windows DPAPI in the existing release owner's Windows profile. This preparation does not replace the pinned public key, export the private key, or bypass release verification. The signed update must be produced through that existing Windows setup.

The website remains compatible with older installed launchers: they show **Update launcher** for COMP-RUN until a client with its native catalogue entry is installed.
