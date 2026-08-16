Repo Company V18.1 — V19.5 DEFINITIVE HIDDEN CARDS / BRUSH FIX
================================================================

Built directly from the current script.js + index.html you uploaded.

Replace:
- /script.js
- /index.html

No style.css replacement is required.

Fix:
- Hidden Cards open state is now written at the authoritative drawer-state function.
- The entire Binder Style control is display:none while Hidden Cards is open.
- The rule deliberately outranks the older V18.5 !important rule that was forcing
  the paintbrush visible.
- Closing Hidden Cards restores the brush automatically.
- Drag-opening Hidden Cards is covered too.
