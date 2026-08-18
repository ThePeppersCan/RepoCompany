REPO COMPANY V22.09 — TCG KABOOM + VELMORA: OFF THE BROOM

Base: V22.08 Repo Sports Shootout Recovery

ADDED
- 10 KABOOM cards from the supplied first ZIP.
  Rarity: PLATINUM.
- 10 cards in the new set: Velmora: Off the Broom.
  Rarity key: OFF_THE_BROOM.
  Position: directly above Full Art and below Patch.
- Off the Broom pack reveal treatment and label.
- Both sets added to favourite-card/profile catalogue.
- RCG submission menu recognises Off the Broom as a non-standard tier.
- RCG hidden slab storage adds an OFF THE BROOM filter.
- RCG database set/variant labelling stores “Velmora: Off the Broom”.
- All 20 cards use the existing raw-copy -> RCG grading -> slab -> slab binder path.

NORMAL PACK ODDS AFTER V22.09
Millennium 2%
Signature 3%
Legendary 4%
Rival 7%
Platinum 8%
Patch 16%
Velmora: Off the Broom 18%
Full Art 22%
Standard 20%

DEPLOYMENT ORDER
1. Overlay/upload this build (script.js, index.html and the new assets).
2. Run supabase-v22.09-tcg-kaboom-off-the-broom.sql in Supabase.

The SQL is deliberately not run before the matching web assets are deployed, so a live pack cannot pull a card that the current live front end does not yet know how to render.
