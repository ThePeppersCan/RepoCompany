# Reparty

Forest pixel-art watch parties for existing RepoCompany accounts. The homepage Reparty TV button replaces the Velmora Crown launcher.

## Included

- Same Supabase project, account identities and browser session as RepoCompany when served on the same origin at `/reparty/`.
- Rooms joined through a room link or code; signed-in members can control playback.
- Synchronized YouTube play, pause, seek, next video, late joins and reconnect recovery. Audio volume is local to each viewer.
- Persistent collaborative playlists: create, rename, delete, add videos, remove and reorder. Up to 20 playlists per room, 1,000 videos per playlist.
- Shared play modes (v2): **Repeat** (on by default) starts the playlist again after the last video; **Shuffle** plays in a random order for everyone, each video once per cycle, without changing the saved playlist order. The older destructive shuffle action is kept server-side only for old clients.
- Playlist tools (v2): search/filter, **◎ Now playing** jump, **Play next** (queues a video straight after the current one, across playlists), **⤒ Move to top**, plus ↑/↓. Keyboard focus stays on the same button after each move.
- Unplayable videos (v2): when YouTube reports a video as private, removed or not embeddable (errors 2, 100, 101, 150), Reparty waits 2.5 s, marks it “Unavailable” and skips it for the whole room. Only the first viewer's skip counts (revision check). Marked videos are skipped automatically afterwards; playing one by hand clears the mark and tries again.
- Sync hardening (v2): YouTube's own controls and keyboard are off and a click shield covers the embed (click = play/pause for everyone, double-click = full screen), so nobody can wander into YouTube's “More videos”. If the embed ever loads a different video anyway, Reparty notices and reloads the room's video.
- Theatre mode (▭ button or T, desktop widths): the TV takes the full width and is sized so the whole set fits the window; new chat appears over the video with a chat box in the controls, and the playlist and chat panels sit side by side below. Remembered per browser.
- Keyboard shortcuts: K or Space play/pause, J/L ±10 s, N next, M mute, T theatre, F full screen, C chat, / search, ? help.
- Chat: on screens 1700 px and wider, playlist and chat sit side by side (no tabs). In full screen, new messages appear over the video and a small chat box sits in the controls.
- Dark mode: follows the device by default; the ☾/☀ button in the top bar switches and remembers the choice in this browser.
- Leaving: closing the tab sends a `leave` immediately, so people don't linger in the room list for a minute.
- The “Enable playback” prompt is now a large overlay on the TV when a browser blocks autoplay.
- Built-in “The Playlist of gods”: 560 entries copied from the user's W2G playlist on 23 September 2026. Use its button in the Playlist panel to add an independent editable copy to any room. Original order and duplicate videos are preserved. Repeated clicks select the existing copy. This is a snapshot, not automatic syncing with W2G.
- The playlist database upgrade (`playlist-upgrade.sql`) was applied and verified in Supabase. Fresh setups can use the full `migration.sql`. Tests cover exact entry order/titles, independent room copies, repeat imports, permissions and existing playback preservation. Browser verification showed all 560 rows and persistence after reload. Individual YouTube availability was not checked.
- Persistent room chat with the latest 100 messages shown, server-stamped identity, length limits and send throttling.
- 100 generated pixel-art avatars: animals, landscapes, plants, and fantasy/MMORPG. Avatar selection is saved per account, separately from the existing character.
- Responsive layout, keyboard controls, labelled forms, focusable dialogs and local autoplay recovery.

## Installation status

**v2: `v2-upgrade.sql` was applied to the live Supabase project on 23 September 2026** (migration `reparty_v2_play_modes`; the live function matched v1 exactly beforehand, and the existing room kept its playlists and playback). It adds a `settings` column to `reparty_rooms` (default `{"repeat":true,"shuffle":false}`) and replaces `reparty_action`. It is additive and rerunnable, and existing rooms, playlists and playback are kept. Don't rerun `playlist-upgrade.sql` or `shuffle-upgrade.sql` afterwards, because they would put back the older function. If the site is deployed before the SQL, it keeps working: the Repeat/Shuffle/Play next/Top controls stay hidden and unplayable videos fall back to a normal Next. `migration.sql` already includes v2 for fresh setups.


The additive `migration.sql` has been applied to the existing RepoCompany Supabase project. Four new tables have row-level security; `reparty_rooms` and `reparty_messages` are enabled in `supabase_realtime`. Anonymous users cannot call the room RPC. Existing characters and game data are not modified.

Both `Documents/GitHub/RepoCompany` and `Desktop/web2` contain the new files. Each homepage was updated separately to preserve existing differences between those copies. Website files have not been pushed or published by this task.

Publish through the site's existing Cloudflare Pages workflow. Include `reparty/`, `assets/reparty/`, the changed root `index.html`, and `functions/api/reparty-video.js`. No new API key or build step is required. Serve under the same `repocompany.uk` origin to inherit its signed-in browser session. Opening an HTML file directly is not supported; use an HTTP server for local preview.

For another Supabase environment, update `config.js` and apply `migration.sql` in that environment. The SQL is rerunnable and contains only Reparty table, policy and function changes. Keep the existing project's username-to-email mapping for legacy accounts.

## Architecture and access

`reparty_action` validates all writes in a PostgreSQL transaction, locks room state, and derives the display name from the existing `characters` table. Members can read only rooms they have joined. Knowing a random 12-character room code allows another signed-in account to join; these rooms are intended as collaborative rooms, not owner-moderated private vaults. Membership persists for reopening rooms. Active presence expires after 60 seconds without a heartbeat.

Playback uses server time, a canonical playback timestamp, and bounded drift corrections. Playlist updates are atomic operations rather than whole-document client replacements. Revision checks prevent multiple viewers from advancing an ended video twice. Database events trigger refreshes; eight-second polling is the fallback and heartbeat. Media itself is served directly by YouTube, not relayed through Supabase.

`functions/api/reparty-video.js` calls YouTube oEmbed for video titles. It accepts only a validated video ID and cannot proxy arbitrary URLs. A direct oEmbed fallback lets static previews add links; unavailable titles fall back to the video ID. No search or YouTube playlist-import API is claimed.

## Validation

- Executed the complete SQL migration twice in isolated PostgreSQL (PGlite).
- Tested all 100 avatar IDs; URL validation; shared create/join, edits, reordering, playback, seek, next, chat and avatar updates; duplicate next protection; chat throttle; anonymous and non-member denial; direct-write denial.
- Live Supabase verification: four RLS-protected tables, two realtime tables, authenticated RPC access and anonymous RPC denial.
- Live transaction-only smoke test with existing account identities: create, join, shared playlist, play, seek, chat and avatar. All test data rolled back.
- Two browser viewers against the isolated SQL backend and a simulated YouTube adapter: shared play/pause/seek/next, chat displayed as literal text, selected avatar and room state after reload.
- Mobile layout at 390px: no horizontal page overflow; player retains YouTube's minimum 200px height. Desktop layout inspected.
- Real YouTube oEmbed endpoint returned the expected video title. The official iframe was created but did not finish loading in the in-app test browser; actual streaming remains to be checked in a normal browser. The multi-viewer browser checks above used a simulated video adapter, not actual streamed video. The app displays a timeout and allows retrying when a player cannot load.

YouTube can refuse videos that are private, unavailable, age restricted, or disallowed for embedding. Browser autoplay rules and per-viewer advertisements can temporarily affect synchronization. These are handled with a playback-enabling button, catch-up control and visible errors rather than bypassing YouTube restrictions.

### v2 validation

- SQL (PGlite): fresh `migration.sql` run twice plus `v2-upgrade.sql` twice; upgrade from the live v1 schema with a room mid-playback. 16 checks: in-order next, stale-revision rejection, Repeat wrap and stop, single-video repeat, skip marking/auto-skip/manual retry, paused skip stays paused, all-unavailable stops without looping, move up/down/top edges, Play next (same and cross-playlist), Shuffle cycle coverage with unchanged order, Shuffle + Repeat off stops, settings validation, non-member and anonymous denial, 560-video Playlist of gods (shuffle next ≈ 5 ms in PGlite).
- Browser (Playwright, two to four real viewers against the PGlite backend with a simulated YouTube player): embed wandering onto another video is corrected, click shield and shortcuts control everyone, one shared skip on an unplayable video, Play next, Repeat on/off at the end, Shuffle keeps the order, Top/search/jump with 560 videos, split chat at 2560 px and tabs + unread badge at 1440 px, full-screen chat overlay, dark mode toggle/persistence/system default, 390 px phone with no sideways scroll, autoplay overlay, leave on tab close, and the old database without v2 SQL.
- Not checked: real YouTube streaming (youtube.com is blocked in the test environment). Because YouTube's own controls are hidden, its captions (CC) and quality menus are no longer reachable inside the player.

## Assets

The four avatar sheets each contain a 5 × 5 grid. `avatars.js` assigns stable IDs 0–99 in row-major order. CSS selects each cell without requiring 100 individual downloads. Original generated artwork and prompts are also supplied in this task's output folder. Artwork was produced with the built-in image-generation tool using the supplied Biscuit pixel-art reference.


## Game mode (25 September 2026)

The Game mode database update was applied through the existing Supabase project’s SQL Editor on 25 September 2026, after confirming the deployed room function matched v2. Publish the Reparty files through the existing Cloudflare Pages workflow. For fresh installations, apply `migration.sql` and then the Game mode migration. Do not rerun old upgrade files afterwards.

- Game mode sits beside the theme button and switches the shared room. Videos continue playing while cards are shown. The existing player and queue become a small bottom-right dock; Queue opens playlist controls and link entry, ⇄ moves it to the other corner, and Hide collapses it without stopping audio. A Player button restores it. Mute and volume are local; playback and queue edits remain shared. The same iframe remains mounted across mode changes. Returning restores the full watch layout and preserves playlists and chat.
- Black-and-gold game-night layout, circular existing Reparty avatars, responsive setup and prompt table.
- 389 cards imported from the user-supplied attachment without rewriting titles or card wording: Base 329, Occult 35, IRL 19, Digital 6. Seven untitled source entries use a display-only fallback. This records the input source, not an independent claim about authorship or licensing.
- Host selects 2–24 named players (including friends sharing one screen), packs, 1–10 rule turns and a 10/20/30/60-second timer. The interface offers 2/3/5/10 turns. A three-player prompt is excluded for a two-player roster.
- Server shuffles without repeating cards, resolves distinct named targets, rotates turns, stores the current round and uses revision checks against duplicate Next clicks. Room snapshots restore progress on reload/late join. The host can change if the previous host has been absent for 60 seconds.
- Timed cards have a shared server deadline. Turn-based effects expire automatically; Save card keeps an effect on the table until the host clears it. Draw a player gives the room one shared random name. Card history supports remembering earlier prompts.
- Social prompts, votes, physical challenges and special powers are adjudicated by the players. Save/clear controls track those powers; the app does not automatically execute every card instruction (for example, modifying a target, multiplying drinks, or external games). Digital cards may refer to a separate call’s chat, as Reparty chat is hidden in Game mode.

Validation: 21 PostgreSQL checks against PGlite, plus two-browser checks for shared cards, host-only controls, guest names, Next/Save, mode switching, reload persistence, queueing and playing videos during games, local mute, hiding without pausing, moving the dock, and 390px layout; no browser JavaScript errors. Browser verification uses the actual SQL with test accounts and a simulated account connector, not live production accounts. The SQL tests can be run with `node tests/game-mode.cjs` when `@electric-sql/pglite@0.5.8` is available.
