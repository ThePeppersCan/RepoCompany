# Reparty

Forest pixel-art watch parties for existing RepoCompany accounts. The homepage Reparty TV button replaces the Velmora Crown launcher.

## Included

- Same Supabase project, account identities and browser session as RepoCompany when served on the same origin at `/reparty/`.
- Rooms joined through a room link or code; signed-in members can control playback.
- Synchronized YouTube play, pause, seek, next video, late joins and reconnect recovery. Audio volume is local to each viewer.
- Persistent collaborative playlists: create, rename, delete, add videos, remove and reorder. Up to 20 playlists per room, 200 videos per playlist.
- Persistent room chat with the latest 100 messages shown, server-stamped identity, length limits and send throttling.
- 100 generated pixel-art avatars: animals, landscapes, plants, and fantasy/MMORPG. Avatar selection is saved per account, separately from the existing character.
- Responsive layout, keyboard controls, labelled forms, focusable dialogs and local autoplay recovery.

## Installation status

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

## Assets

The four avatar sheets each contain a 5 × 5 grid. `avatars.js` assigns stable IDs 0–99 in row-major order. CSS selects each cell without requiring 100 individual downloads. Original generated artwork and prompts are also supplied in this task's output folder. Artwork was produced with the built-in image-generation tool using the supplied Biscuit pixel-art reference.
