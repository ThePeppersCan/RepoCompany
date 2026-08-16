REPO COMPANY V18.1 — CURRENT WORKING BINDER UPDATE
16 August 2026

BASELINE
This patch was made directly from the files supplied in folssd.zip.
It preserves the existing premium V3 binder rather than replacing it with an older/alternate binder.

CHANGES
- Keeps the current premium double-page binder, customisation, effects, favourite-card system, hidden-card drawer, card preview, drag/drop and public viewing.
- Changes each open spread to exactly 12 cards total:
  - 6 cards on the left page
  - 6 cards on the right page
  - combined 4 columns x 3 rows
- Binder pagination remains auto-expanding for the full current card catalogue.
- Existing saved card order is retained as a linear layout and reflows across the new 12-card spreads.
- Public binder snapshots now retain the authoritative owner name returned by Supabase and never fall back to the viewer's own local layout.
- Hidden cards remain hidden in public views while still staying owned by the binder owner.
- Existing public binder style and favourite-card systems are left intact.

INSTALL
Replace only:
- index.html
- script.js

No assets are included or required by this patch; keep your current assets folder exactly as-is.
No SQL is required for this frontend patch. The binder owner lookup backend fix is already live.
