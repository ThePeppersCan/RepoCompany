REPO SPORTS — PLAYER BIOGRAPHY RENDER FIX

Fixes the blank Biography panel on all 48 Meet the Teams player profiles.

The previous biography patch did not actually insert a biography container/data renderer into index.html. This patch adds:
- the biography overlay inside the supplied right-hand frame area
- all 48 biographies parsed from Velmora_Player_Biographies_2026.docx
- themed At a Glance cards
- Career / Transfers timeline
- every full narrative section from the archive
- internal scrolling for long biographies
- gold/blue styling matching the Repo Sports World Cup interface

Apply: replace index.html only.
No SQL required. No images/assets are changed.
