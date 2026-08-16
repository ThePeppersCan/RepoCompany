Repo Company V18.1 — V16.8 Binder Side Controls Anchor Fix
============================================================

Fixes:
- Binder Style paintbrush is hidden on the front/back cover.
- Paintbrush only appears after the binder is opened.
- Hidden Cards holder and paintbrush share one authoritative stage-relative position.
- Position is calculated from layout offsets, not hover-transformed rectangles.
- A MutationObserver prevents older binder patch listeners from moving either control.
- Mouse movement, hover and transition events no longer get to choose a new position.
- Resize and actual binder page changes are the only things allowed to recalculate the anchor.
- Includes the V16.7 HARMONIZE Enter-spam exploit fix.
