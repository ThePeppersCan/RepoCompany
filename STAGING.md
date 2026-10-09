# Console dashboard staging

For the approved production rollout and rollback reference, see `RELEASE.md`.

This branch integrates the approved dashboard with the existing Repo Company account and collection services. It is a preview release. The live domain is not switched by the staging command.

## Services and data

- Supabase uses the existing project, public anonymous key and username-to-email convention. Existing credentials work; sessions are separate on each website origin, so sign in again on the staging URL.
- Existing `gp` balances are displayed as Repoints at **1:1**. No balances, cards, slabs, inventory items or old progression have been migrated or reset.
- Inventory reads the original bank, card collection and slab collection RPCs. The Shop sells only the original pack for **25,000 Repoints** through `buy_quidditch_tcg_pack`.
- Staging purchases use the **real wallet** and add a real pack. The purchase panel says this explicitly. Automated tests mock purchases and never spend a player's balance.
- Binder opens the existing two-binder shelf. Card pages, slab archive, grading and customization retain their existing implementation and server data. The old runtime loads only when a binder, pack or embedded game is opened.
- Friends uses a separate Cloudflare D1 database, `repo-dashboard-staging`, through authenticated `/api/dashboard/*` routes. Requests, acceptance, cancellation, removal, blocks, display names and privacy settings persist there. Presence expires after 90 seconds. Appear-offline hides presence and game activity.
- Friend identity is checked against Supabase on the server. Users cannot award themselves RepoScore through these routes. New RepoScore starts at zero; achievement definitions and awards remain a later task. Existing legacy achievement data is untouched.
- Main games and Dragonbound use their existing external URLs. Other included demos open their existing code in an isolated same-origin frame. Full cross-domain game presence and account SSO are not added by this release.
- Avatar creation and per-game achievement catalogs are intentionally deferred. The old OSRS games are absent from the new demo library.

## Run and deploy

Use Node 24 or later. Install with `npm ci`; the browser checks use the installed Microsoft Edge browser.

```
npm run dev
npm run test:social
npm run test:dashboard
npm run deploy:staging
```

The dashboard browser test expects the dev server at `http://127.0.0.1:8788`. Its auth, inventory, purchase and social calls are intercepted with fixtures. It loads the actual binder and demo code. Screenshots and results are written to the ignored `QA/dashboard-staging/` directory.

`npm run deploy:staging` builds `dist/` and deploys to the `codex/console-dashboard-staging` preview branch of the existing `repocompany` Pages project. It does not deploy the production branch. The Pages preview D1 binding is recorded in `wrangler.toml`. The additive social schema is in `dashboard-social-schema.sql` and has been applied to the staging database only.

The public dashboard configuration contains only the same anonymous Supabase credentials already shipped by the original site. No service-role key or Cloudflare token is included. The preview has noindex headers and robots rules; these do not make it private.

## Verification and release boundary

Automated checks cover sign-in, 1:1 balance display, owned inventory, one original pack product and purchase RPC, friend requests and privacy, both binders, all five embedded demo launch menus, and mobile account layout. Server checks cover identity validation, request ownership, duplicate requests, acceptance, blocks, presence privacy, rate limits and rejecting client score changes.

Hunter is excluded from the demo library at the owner’s request. Its original project files are preserved. The Sports entry opens the current league hub, including its existing live feed file despite that file’s historical `-test.html` name.

Before a live-domain cutover, test with existing player accounts on the staging URL: confirm real card/slab counts, pack opening, save/load in the main games, and requests between two consenting players. Real purchases and social messages are not made by the automated tests. Also review mobile game usability and slower-network loading; the original game assets remain large.

Production deployment was subsequently approved on 9 October 2026; see RELEASE.md for its configuration and rollback details. The live site's current Git branch and deployment remain the rollback baseline. No old account data needs restoring to back out this UI because it was never migrated.
