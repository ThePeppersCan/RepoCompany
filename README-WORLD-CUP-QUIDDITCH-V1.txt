REPO SPORTS WORLD CUP — AUTOMATED QUIDDITCH BROADCAST V1
Belros vs Zafran prototype

Apply to the current website root:
- replace index.html
- add world-cup-quidditch-v1.css
- add world-cup-quidditch-v1.js
- merge assets/world-cup-game-v1/

No SQL is required.

HOW TO TEST
1. Sign in as CatAsthma.
2. Enable the existing Admin Test Mode.
3. Open Repo Sports World Cup and click TUNE IN! LIVE under the map.
4. Enter the waiting room. Other signed-in testers can join the same Realtime lobby.
5. CatAsthma clicks START WORLD CUP TEST.
6. The Belros vs Zafran broadcast opens for everyone who received the lobby start signal.
7. The game has a 45-second pre-match presentation, 9-minute first half, host-controlled half-time, and 9-minute second half.
8. CatAsthma also gets a TEST SPEED ×4 control for quicker QA. It broadcasts the speed change to connected match viewers.

FIRST TEST ROSTERS
Belros — JUD, Nimbler 2000, Bramble
Zafran — Zizi, Rafi, Saffi

Zafran sprite mapping from the supplied assets:
- traveller camel = Zizi
- white llama = Rafi
- golden llama = Saffi

V1 SYSTEMS INCLUDED
- Completely symmetric 50/50 underlying team balance.
- Real steering movement: acceleration, braking, recovery, support lanes, marking and directional banking.
- 3-hoop physical shot targeting with visual aim deviation.
- Goals, saves, misses, ring/post strikes and live rebounds.
- Passing lanes and true interception events.
- Fouls, referee movement/whistles, penalties and random VAR reviews.
- VAR can confirm/overturn goals or confirm/reject a penalty decision.
- Goal celebrations with team convergence, crowd swell and camera reaction.
- No Golden Snitch.
- Regulation draw -> penalty shootout.
- Dynamic camera lead, subtle zoom, impact shake and incident focus.
- Crown of Vardesh Glacier arena with foreground snow and a restrained pixel-TV bezel.
- Existing Barry Bramble commentator with event-responsive commentary animation.
- Large context commentary pool plus player-lore commentary for all six prototype players.
- Live team stats: shots, on target, shot accuracy, possession, passing, interceptions, rebounds, fouls, penalties and VAR.
- Existing RepoSports crowd/shot/rebound/interception/goal/whistle audio reused.
- CatAsthma-only half-time CONTINUE SECOND HALF authority.
- Realtime match channel for half-time continuation, test-speed sync and host close.

IMPORTANT
This is isolated from the normal RepoSports Quidditch mode. It does not replace or modify the existing normal match engine.
