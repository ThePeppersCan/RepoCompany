BARRY BRAMBLE TIP V3 — ISOLATED FIX

1. Run fix-barry-bramble-tipping-v3.sql ONCE in Supabase SQL Editor.
2. Replace index.html and script.js with the files in this patch.
3. Hard refresh / redeploy.

What changed:
- Barry no longer depends on the legacy 235-second tipping functions.
- Barry no longer depends on advance_quidditch_live_clock for accepting a tip.
- The exact match id already shown by the live Quidditch UI is the tip bucket.
- One tip per signed-in account per displayed match is enforced server-side.
- Cost remains exactly 200 GP.
- Native HTML disabled is no longer used on Barry's button, so match-state refreshes cannot swallow the click.
- Capture-phase handling prevents stale click listeners taking the action first.
- Existing community progress is snapshotted as the V3 baseline on first install.
- The script cache query is bumped so the new handler loads immediately.
