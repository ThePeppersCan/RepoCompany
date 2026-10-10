# Account profile and avatar release

Approved for production on 10 October 2026. Production's additive play-time and avatar tables have been applied. Existing login, wallets, cards and slabs use the unchanged services. The Morogue domain and secure account bridge from production commit `4c4c56f` are preserved.

The approved avatar creator uses the dashboard theme, colour presets and custom colours. It supports all approved face/hair options, both body fits, and T-shirt, polo, shirt, hoodie and jacket with an independent clothing colour. Avatars save to the signed-in account and appear on Profile and Friends. Old avatar records default to the original jacket. Portrait assets live in `account-assets/avatar-v2`; clothing is drawn by the shared portrait renderer.

Account keeps the homepage logo position and atmosphere, with Profile, Friends, Inventory, Achievements, Shop, Settings and Binder in its header. Recent activity shows the latest three played games, recorded hours and future achievement states. Initials stand in for avatars. Both the logo and the visible Back to collection button return to the homepage, including from an account opened over a game case or Demos.

The three bespoke activity banners live in `account-assets/*-activity-banner-v1.png`. Their original logos are unchanged separate overlays. Prompts and source art references: `account-assets/activity-banner-prompts.md`.

## Play time

Games remain on their separate pages, as requested. Their small shared script connects to a RepoCompany-origin iframe, which uses the existing sign-in without handing account tokens to the game. Parent origin, source window and game ID are validated. Visible-page pulses renew a 20-second lease; hiding or losing the game pauses recording. The server uses its own clock and session sequence, discards gaps over 45 seconds, and allows only one active session per account. No historical hours are invented, and no RepoScore or Repoints rewards are granted.

Local integration script tags were added to these existing files only:

- `C:/Users/Isaac/Documents/velmoragame/preview.html` — Moratales
- `C:/Users/Isaac/Documents/velmoragame/interface/vampire-survivor/index.html` — Morogue
- `C:/Users/Isaac/Documents/GitHub/velmora-manager-web/dist/index.html` — deployed Manager source
- `C:/Users/Isaac/Documents/GitHub/velmora-football/index.html` — Manager development source
- `C:/Users/Isaac/Documents/GitHub/dragonbound-web/dist/index.html` — Dragonbound

`tools/install-game-playtime.cjs` is the idempotent local installer. Only one external script tag was inserted in each HTML file; existing contents and game save code are preserved. No other game repository was built, committed, pushed or deployed. Moratales already has extensive unrelated local changes: do not publish that entire working tree as part of this update without review. Package the tracking-only addition against the intended release instead.

## Release order

1. Apply the additive `dashboard-playtime-schema.sql` and `dashboard-avatar-schema.sql` to the target D1 database before deploying this API. Local and production D1 now have the tables. Remote staging has not been migrated by this update.
2. Publish the RepoCompany bundle and verify signed-in account and tracking routes. The bridge, client, art and profile files are included by the existing build script.
3. Publish only the intended script-tag integrations on the separate game sites. Until that release, those live games cannot report time. Dashboard demos use the shared tracking core directly.
4. Check a real signed-in session on each origin, hidden-tab pause, return to the homepage and refreshed recent activity. Account state, inventory, Repoints, pack opening and binders retain their existing services.

## Validation

Passed locally: `npm run build`, `test:profile`, `test:game-playtime`, `test:playtime`, `test:social`, `test:packs`, and `git diff --check`.

Browser tests cover desktop/mobile profile layout, matching logo placement, complete banner loads, homepage navigation from all four collection scenes, separate-origin session reuse, unauthorized origins, visible/hidden game transitions and keeping credentials out of parent messages. Account/pack tests use mocks, not live purchases or player inventory. The profile screenshots in `QA/dashboard-staging` use the QAPlayer fixture and sample activity, friends and RepoScore.
