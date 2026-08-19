V22.25 — REPO SPORTS RESTORE

PURPOSE
Restores the feature-complete Repo Sports club Quidditch engine/UI that was accidentally replaced by the smaller legacy branch in V22.20.1.

RESTORED
- Feature-complete repo-sports-quidditch-v2.js branch (advanced tactics/presentation/right-rail systems/live sync improvements).
- Matching 8.6 KB production test/iframe wrapper with balanced club scheduling and stable sync handling.
- Matching 166 KB Repo Sports CSS.

KEPT FROM THE LATER PARITY REQUEST
- Equal role finishing baseline.
- No attacker-only runner selection.
- No attacker goal-conversion bonus / defender penalty.
- Normal penalties distributed using seeded RNG instead of always selecting the attacker.
- Equal movement envelope for scoring access.

NOT TOUCHED
- Reparty files/mechanics.
- World Cup flag-card artwork fix from V22.24.
- TCG ownership/binders/slabs/grading.
- Supabase data/standings/career records.
- Other site systems.

INSTALL
Overlay these files onto the current site after V22.24.
No SQL migration is required.
