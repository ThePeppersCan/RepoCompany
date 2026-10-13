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

## Inventory and native binders — 13 October 2026

Inventory has individual Hide controls, Hide all cards and Unhide all. This display preference is saved per account in this browser and does not change ownership, binder layouts, packs or balances. Hidden cards are not rendered or downloaded by Inventory.

TCG and slab binders open as Account sections at `#account/binder` and `#account/slabs`. They use the existing catalogue and Supabase services directly, without loading `legacy-runtime.html`. Both include spread navigation, search, rarity filtering, full-size inspection, Move/swap and drag controls, storage, individual restore and Restore all. Copies and separate slab certificates remain distinct. TCG continues to read/write the established browser layout/storage keys and publish the existing public snapshot. On a new browser only, it reads that snapshot as a fallback. Slabs retain the existing 270-pocket server layout. A failed save remains visible with an explicit retry; there are no automatic mutation retries.

The original grading, public collection and binder-style tools remain available through the clearly labelled Grading & binder styles link. Their code and saved style settings are unchanged; style customizations are not rendered by the new Account binder.

All six demo discs now open inside the dashboard. Repo Diver, Goblin Bomb Party, Repo Rooftops, High Seas and Repo Sports keep their original same-origin runtime and game assets. Dragonbound now uses its existing embedded account protocol on `dragonbound.repocompany.uk`, with exact origin/source/nonce checks, rather than navigating away. Its hosting, game code and save services remain unchanged.

Validation: `test:binders`, `test:packs` and `test:dashboard` pass with isolated account fixtures. These cover visibility persistence, layout retention, cross-page moves, distinct duplicate slabs, failed-save retry, unknown cards, mobile overflow, native pack-to-binder return, six game launch/return paths and absence of legacy requests from native binders. Browser checks make no real purchases, save changes or social requests. They check game menus and account handoff, not full game campaigns or live multiplayer.

For this dashboard-only release, build with `node tools/build-dashboard.cjs --production --preserve-game-integrations` to retain the exact existing generated game integration files. The ordinary build continues to regenerate them when game integration work is intended. Baseline commit: `e1827c3219c2870205951b892805afd6556a1ee9`.

### Shared demo loading correction

A delayed favourite-card request could make the retired passport panel repeatedly render through already-resolved promises, starving network completion and game startup. Its loader now waits for the favourite cache to be marked loaded; the existing completion event handles the final render. This changes only the shared account loading path, not game rules or saves. Demo launch tests delay favourite-card responses by 750 ms to cover this race. Legacy runtime scripts and styles now receive content versions during the build so the corrected loader is fetched consistently.

### Original standard-card binder correction

Nine original catalogue entries omit `rarity`, including Soup, Jud and Mad Rager. The native binder now normalizes these entries to `standard`, matching the original pack reveal, before building filters, captions or card details. This fixes the `replaceAll` opening error without changing card IDs, ownership or saved arrangements. Binder regression coverage now includes all nine original entries, their rarity filter and details, an original-card slab, and every catalogue entry across the binder spreads.

## Complete activity banner collection — 13 October 2026

Dragonbound, Repo Diver, Goblin Bomb Party, Repo Rooftops, High Seas and Repo Sports now have individual 3:1 activity banners alongside the existing three main-game banners. Shared profile artwork also supplies player profiles, Friends' current-game cards and their activity feed. Original game environments inform each composition, the Repo Sports logo is retained, and the other titles remain separate responsive text. Six 1200×400 WebP backgrounds total approximately 587 KB and load lazily. Prompts and source references are recorded in `account-assets/demo-activity-banner-prompts.md`.

Visual review covered all nine games, own and player profiles, Friends cards and activity, desktop and 390px mobile layouts. All banner images loaded, all nine games used custom banners, and no horizontal overflow or JavaScript errors were observed. Gameplay, achievements and account services are unchanged.
