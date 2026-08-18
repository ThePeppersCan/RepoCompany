REPO SPORTS — V22.14.1 DUPLICATES HOTFIX

Fixes:
- Bulk Box card thumbnails reduced to compact storage size.
- Duplicate slab previews forced to compact fixed dimensions so binder-size slab CSS cannot leak into the drawer.
- World Cup 2026 cards can no longer be awarded twice because one was submitted to RCG.
- World Cup ownership checks now include: raw event card, active RCG order, uncracked slab, and cracked raw lineage.
- The old World Cup pack fallback that deliberately allowed duplicate pulls has been removed.
- RCG submission now blocks a second independent World Cup copy while still allowing legitimate re-grading of the same cracked lineage.

Important legacy data note:
- This patch prevents new WC duplicates but does not automatically delete pre-existing duplicate slabs.
- Existing impossible duplicates should be cleaned explicitly rather than silently deleting graded collection data.
