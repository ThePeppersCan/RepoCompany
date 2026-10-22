# COMP-RUN 2.4.2 release

Browser source a40f79072eec7c44eea745d6787e3bedc43dd1e2 is published at https://comp-run.fluffy-star-4855.chatgpt.site/. COMP-RUN includes the logo-led interface, corrected Fault opening, a continuous destructive penstock chase at twice its previous speed, a faster spillway encounter, and lighting/scenery upgrades to Rupture and Last Bloom. Rupture Normal and Nightmare complete in furnished 120 Hz verification at 392.142 and 391.042 seconds, with eight gates and no unsafe/blocked movement. The new leaderboard season is `rupture-3`; earlier completion evidence still unlocks runners.

## Packages and account integration

The immutable native candidate contains 149 files (93,569,647 bytes), including 145 runtime files (48,089,001 bytes) and the exact offline ZIP parts. Runtime fingerprint: `3294ade57b944c1cff842f6c509ab328db0169240453db08e2c5cbef7844c57f`. Distribution fingerprint: `2d824cf4c2acdf2bdbb3c74b3b396591b72cc176046236d55072c04271ebfb9c`. The offline ZIP is 45,479,914 bytes, SHA-256 `36dcfe31684ed0868d5e0b5cea3f03379fd4126f981f4d043420e2a5d86222b8`.

Production D1 has all three additive COMP-RUN tables and 17 achievements worth 700 points: each map in Normal and Nightmare plus unlocking all eight completion runners. Guest records stay local; account-owned completions can award achievements. New online personal bests require a server-issued session and valid ordered splits. These are client-attested records with server checks, not server-simulated physics.

The game uses portal-owned browser sign-in or bounded native account requests; account tokens stay outside the game. The native launcher release is 0.1.33 / sequence 33. Local settings, records and unlocks remain isolated by account; unfinished runs are not resumable and browser saves remain separate.

## Existing-download preservation

The old feed was recovered from checksum-verified local content and every available historical Pages deployment: 14,669 unique blobs and the exact current native manifests. Current versions are Morogue 0.1.0-preview.5, Moratales 0.1.0-preview.2 and Manager 0.1.0-preview.3. Earlier local packages must not replace those newer published versions.

`publish-comp-run-release.cjs` is the scoped COMP-RUN workflow. It checks the base manifests against the current native feed, audits every COMP-RUN file against fresh live web bytes, hashes all retained historical blobs during immutable staging, preserves the other three manifests byte for byte, and checks their live identity again immediately before deployment. It rejects stale bases, corrupt history, changed packages and failed parity. Audit evidence is stored outside the public feed. `publish-game-release.cjs` remains the workflow when intentionally releasing all four reviewed game packages.

## Verification

302 native unit tests pass, including stale-feed and concurrent-release rejection. Real SQL tests cover separate difficulties/seasons, PB replacement, ties, ownership and retry safety. Production build and 117 Wibsworth source pins pass. The gallery's three reviewed 1920x1080 images are actual opening scenes from the immutable 2.4.2 payload, with provenance retained under release-evidence.

The native integration script installs through Library.install and runs the real WebGL game, settings persistence, account switching, offline gating, pause and token-free record requests. Account/network services use isolated fixtures; no synthetic records are published. Browser checks cover 720p/narrow layouts, menus, Escape and keyboard focus. Automated checks do not verify audible output or substitute for a human playthrough.

Publish the website and signed launcher feed through the existing GitHub-main/Cloudflare route. The static game feed uses its separate guarded deployment. Keep exact deployment, native and parity receipts with the release evidence; a prepared package alone does not establish publication.
