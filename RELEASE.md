# Console dashboard release — 9 October 2026

Approved for the live site after local review. Existing RepoCompany authentication, username mapping, wallet and collection RPCs are unchanged. GP is displayed as Repoints at 1:1; there is no balance migration.

Account includes Inventory, the original TCG pack Shop, Friends and Binder. Binder opens the existing card and slab binders. Hunter, Jad and Tombs of Amascut are excluded from the demo library. Avatar creation and new game achievement awards remain future work.

Friends/profile data uses `repo-dashboard-production` on production and `repo-dashboard-staging` on previews. Only the additive dashboard tables are installed; the existing Supabase database is not migrated.

The approved Velmora Manager wordmark was cleaned with the built-in image editing tool. The resulting transparent asset is `original-case-assets/manager-logo-clean.png`, used across the dashboard, sleeve and disc. Its original character artwork is unchanged. Source and prompt are recorded in `LOGO-EDIT.md`.

## Verification

- Authentication project/key and username-to-email mapping match the original site's configuration exactly.
- Browser checks with mocked account data cover sign-in, wallet display, inventory, a single original-pack purchase, Friends requests/privacy, card/slab binders, five embedded demo launch menus and the mobile account view.
- Server tests cover authentication, friendship ownership, duplicate requests, acceptance, privacy, blocks, rate limiting and rejection of client-awarded score.
- No live purchases or friend requests are made during automated testing. Real existing accounts, purchases, complete game sessions and save/load still benefit from player acceptance testing.

## Hosting and rollback

Cloudflare Pages project: `repocompany`. Production branch: `main`. Build command: `npm run build`. Output: `dist`. The build detects `CF_PAGES_BRANCH=main` to enable indexing on production; previews remain noindex. Node is pinned to major version 24.

Previous production deployment: `89d5a023-3189-48cc-92ed-f6c7b7f73abd` at <https://89d5a023.repocompany.pages.dev>, Git commit `fbf061e52c7e005f1615014e9f6920c6e02a7064`. If a release problem is found, roll back to this deployment in Cloudflare Pages. Account balances and collections require no rollback because their storage was not replaced.

Build and deploy manually with `npm run deploy:production` or push the reviewed commit to `main` for the configured Pages build. Preview deployment remains `npm run deploy:staging`.

## Pack opening and collection return fix

Pack opening now runs directly inside Account using the existing `open_quidditch_tcg_pack` server transaction. The original pack and card artwork, rarity selection, duplicate handling, saved collection and existing server rewards are retained. Close and Escape return to Inventory; the reveal links to the existing Binder. No database migration or account reset is involved.

Binder and slab views keep their original implementation and saved layouts. Their close lifecycle hides the retired homepage immediately and returns to Account; Escape no longer reaches unrelated legacy game handlers.

`npm run test:packs` uses mocked account data to check close before/after opening, duplicate-click protection, duplicate copies, slab-to-card-binder navigation, Escape return, missing artwork, rejected requests, a committed pull with a lost response, and mobile layout. It consumes no real packs.

Rollback for this update: Git commit `e8e950f977c112d5058b64ea14cd47bc3f460344`, Pages deployment `25055ccd-f727-4854-9c58-96f72516c177` (the released console dashboard).
