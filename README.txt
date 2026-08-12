BINDER LAYOUT SYNC — FIXED SQL MIGRATION

1. Run RUN-ONCE-BINDER-LAYOUT-SYNC-FIXED.sql in Supabase SQL Editor.
2. Replace script.js in the website root.
3. Ctrl + Shift + R.

This version safely drops/recreates only the RPC functions if an older return type exists. It does NOT delete binder layout rows.
