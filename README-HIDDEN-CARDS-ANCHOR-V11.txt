REPO COMPANY V18.1 — HIDDEN CARDS HOLDER ANCHOR V11
===================================================

Fix:
- The Hidden Cards holder is now anchored to the actual open-binder stage.
- It sits directly beside the binder's top-right edge with an 8–14px visual gap.
- Its top edge is aligned with the binder's top edge.
- The binder itself is never moved to make room.
- This replaces the previous fixed-position calculation that was affected by
  the transformed dialog and made the holder appear much farther away/down.

Install:
- Replace script.js with this one.
- Merge the included assets folder if your current build does not already have
  the V10 binder assets.
- No SQL changes are required.
