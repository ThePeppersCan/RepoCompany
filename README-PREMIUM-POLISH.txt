LEVEL HUNTER — CANTO PLAINS PREMIUM GAMEPLAY POLISH PASS

Merge this package into the current site root.

This is built on the existing Canto Plains wildlife vertical slice and keeps the current
Canto map, player movement/collision, Darwin, Rupert, music, Repo Sports and persistence.

Implemented in this pass:
- Replaces the blocking/cheap encounter UI with a compact in-world contextual HUD.
- WASD remains active while the wildlife HUD and food selector are open.
- HUD auto-closes when the player physically moves away from the animal.
- Context-sensitive actions: Observe, Place Food, Offer Food, Bring to Centre, Leave.
- Wait button removed from normal flow; standing still now affects cautious wildlife naturally.
- Observe is state-limited: repeating it on the same behaviour gives no extra research/trust.
- Food has cooldown/state gates, preventing feed spam and brute-force interactions.
- Placed food now appears physically in the world; animals notice, approach, sniff and eat it.
- Simple animal states: Foraging, Alert, Cautious, Curious, Moving Away, Interested,
  Approaching, Investigating, Eating, Comfortable, Receptive.
- Player pressure causes skittish wildlife to move away/flee for understandable reasons.
- Wildlife density after tutorial is only 3–6 opportunities across the whole Canto map.
- Only about 1–3 are initially visible; other opportunities use real encounter clues.
- Before Darwin's first fieldwork starts: zero ordinary wildlife.
- During the first fieldwork: only the controlled tutorial hare is active.
- Tracks/clues belong to actual encounters and progress spatially toward the animal.
- Forage uses a random subset of hand-authored valid nodes per expedition.
- Forage candidates are validated for solidity/accessibility before activation.
- Wildlife uses hand-authored habitat anchors and avoids spawning near the expedition start.
- Compact horizontal quick-food selector uses the supplied food art and learned preferences only.
- Existing trust numbers remain internal; the player-facing HUD uses descriptive animal states.
- Wrong food teaches preferences without permanently damaging the encounter/account.
- Flee cooldowns are longer so failure cannot be instantly spam-retried.
- F8 developer ecology overlay is available only while site Admin Test Mode is enabled.
  It shows authored habitat anchors, active forage nodes, animal states and awareness radii.

No new species or regions were added.

SQL:
The existing RUN-ONCE-LEVEL-HUNTER-WILDLIFE.sql is unchanged. If you already ran it,
do not need to run it again.

Hard refresh after merging: Ctrl + Shift + R
