CANTO PREMIUM V4 — IMPLEMENTATION NOTES

This is an additive pass on top of Major Gameplay Redesign V3.

Windmill quest persistent ID:
  darwin_windmill_visitor

Main authored quest beats:
  Investigate the Windmill
  Find where the animal is hiding
  Gain its trust

The save normalizer already preserves unknown quest/region/resident fields, so no schema migration is required.
If a browser/session is interrupted halfway through the bait/stillness sequence, the encounter safely resumes from the bait stage and ensures the player is not soft-locked without seed bait.

Windmill debug helper (admin only where repoIsSiteAdmin() is available):
  repoHunterWindmillDebug()

The lower and upper windmill PNGs are used directly as the canonical interior backgrounds. Their layout is not redesigned by code; collision and interaction points are authored around those images.
