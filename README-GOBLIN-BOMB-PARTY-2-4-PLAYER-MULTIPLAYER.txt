REPO COMPANY — GOBLIN BOMB PARTY 2–4 PLAYER MULTIPLAYER

WHAT THIS ADDS
- Existing solo Goblin Bomb Party remains unchanged.
- New ONLINE PARTY mode supports 2, 3 or 4 human players.
- The arena always contains 8 competitors:
  2 humans = 6 AI goblins
  3 humans = 5 AI goblins
  4 humans = 4 AI goblins
- Six-character room codes.
- Host / join lobby with four visible player slots.
- Ready-up flow before the host can start.
- Host controls the selected arena and difficulty.
- Each player uses their own saved Goblin Bomb Party character appearance.
- Host-authoritative simulation through the site's existing Supabase Realtime connection.
- Synchronized movement, bomb ownership/fuse, body passes, aimed throws, dashes, knockback, power-ups, hazards, eliminations, shrinking arena and final winner.
- Disconnecting players are safely eliminated rather than freezing the match.
- Online games cannot be paused or skipped early.
- Existing solo Slayer XP / GP rewards are untouched. Online party matches are currently casual (0 XP / 0 GP) so multiplayer cannot exploit the existing solo reward RPC.

FILES
- index.html
- assets/goblin-bomb-party/goblin-bomb-party.css
- assets/goblin-bomb-party/multiplayer.js

INSTALL
Merge this ZIP into the website root and replace index.html / the Goblin Bomb Party CSS when prompted.
No Supabase SQL is required because this uses the same Realtime broadcast/presence system already used by the website's other multiplayer modes.

CONTROLS
WASD / arrows — move
SPACE — dash
Left mouse — hold/release to throw the bomb
E — use power-up
Touch controls are also routed through multiplayer.

NOTES
The host runs the authoritative game simulation. Guests send only their inputs and receive compact state snapshots. This prevents four separate browsers from disagreeing about bomb ownership, fuse timing, eliminations or hazards.
