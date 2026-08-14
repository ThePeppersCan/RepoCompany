V50 WORKING BUILD + BARRY OPENING INTRO
=========================================
This package is the supplied known-good V50 build with only the opening-night Barry studio segment added before the existing Belros vs Zafran stadium teaser. No World Cup TV sizing, gameplay canvas geometry, scorebar sizing, stats sizing, gameplay systems, or existing stadium teaser presentation CSS has been changed.

Opening order for Belros vs Zafran:
Barry studio + supplied BARRY.mp3 -> existing stadium teaser MP4 -> existing V50 pre-match -> kickoff.

RepoSports World Cup V50 — Set-Piece Realism + Rare Player Scuffles

Changes in this build:
- Free kicks are now proper stoppages instead of instantly returning to normal play.
- Whistleworth stops play, the defending side retreats a believable distance, the fouled team takes roughly 2.5–3.3 seconds to set up, then either passes or (when genuinely close enough) can attempt a direct shot.
- One attacking teammate makes a forward/wide set-piece run while another offers a safer support option.
- Penalties now have a proper setup: the taker pauses for roughly 2.8–3.4 seconds, non-participants retreat behind the taker, the defending keeper holds the goal area and Whistleworth positions himself alongside the kick.
- The match clock freezes during foul/set-piece stoppages so the presentation time does not burn through the 18-minute match.
- Added a deliberately rare post-foul "tempers flare" sequence. The fouled player and tackler descend, switch to their standing sprites, exchange only a tiny shove, teammates come down to separate them, and Whistleworth steps between them before everyone remounts.
- The scuffle is uncommon (roughly a 4.5–7.5% chance after a foul, influenced slightly by aggression), so it should feel like an occasional broadcast incident rather than a repeated gimmick.
- After a scuffle, the correct original restart still happens: free kick, penalty or VAR review.
- The original foul location is preserved through the incident so a later free kick is not taken from wherever the players happened to finish the scuffle.
- Added World Cup broadcast camera framing and synced event presentation for the new set pieces/scuffle.
- Added FREE KICK and BRAWL buttons to the existing admin event test deck; the PENALTY test now runs the actual staged penalty sequence.
- Existing V49 lineup facing, Whistleworth naming, scorebar, full-circle flags and under-TV volume control are preserved.
- No Club Mode, SQL, Supabase, TCG, Level Hunter or authentication files are included or changed.

Validation:
- world-cup-quidditch-v1.js passes node --check.
