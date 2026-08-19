REPARTY V23.2 — GOBLIN BOMB PARTY PART TWO / PRODUCTION PASS
19 August 2026

SCOPE
This patch is exclusively the second production pass for Reparty -> Goblin Bomb Party.
It builds on V23.1's mechanics and focuses on authored art, animation presentation, audio, arena depth, bomb readability and winner/explosion presentation.

WHAT CHANGED
- Authored Goblin Powderworks 960x540 pixel-art arena plate.
- Authored foreground rail/crowd depth layer.
- 8-frame bomb heat/fuse atlas.
- 8-frame explosion atlas.
- 8-state contestant fallback animation atlas (idle/run variants/hold/throw/dodge/stun/win).
- Existing Velmora character art is used at runtime for known contestants where available, with animation transforms/state language layered over it. Missing characters use the new fallback atlas.
- Character motion presentation now includes run bob, lean, squash, dash trail, throw/catch/pickup/stun/winner reactions, grounding shadows and clearer local-player/holder language.
- Bomb presentation now includes heat-stage art, fuse sparks/glow, flight trail, ground shadow, radial fuse indicator and critical-state warning.
- Explosion presentation now uses authored frames plus flash, camera impact, crowd reaction, smoke/debris and persistent scorch marks.
- Final Duel and winner presentation receive their own audio/visual intensity.
- Authored OGG sound pack: throw, catch, intercept, dash, bounce, pickup, fuse tick, steam, explosion, crowd gasp, crowd cheer, duel sting and winner sting.
- Three 12-second looping music layers: normal, danger and final duel, dynamically cross-faded from bomb danger/final state.
- Bomb Party instruction card now uses the Powderworks arena plate and keeps the existing long V23 instructions/countdown.
- All new Bomb Party audio respects an available site/master volume control when present.

MECHANICS
V23.1 gameplay stays intact: physical throws, loose bomb, interception, dodge, anti-return, bot state machine, arena modifiers, final duel and scoring are preserved. This is not another redesign of the rules.

ISOLATION
The other 11 Reparty game function bodies are byte-for-byte unchanged from V23.1.
Repo Sports, World Cup, TCG, Binder, RCG grading, Passport, Animal Centre and Supabase are not included or modified.
index.html changes only the two Reparty cache-buster strings.

INSTALL
Overlay this patch on top of V23.1/current site.
No SQL migration is required.
