REPO COMPANY V18.1 — CURRENT BINDER PATCH
=========================================

Included fix:
- Quidditch TCG Binder now uses 12 cards per page, so each open double-page spread shows 24 cards total.
- Existing drag/drop, hidden cards, favourites and public-binder snapshot behaviour are preserved.

Files changed:
- script.js

Important Repo Diver note:
- The camera error shown as "column reference \"research\" is ambiguous" is a backend/Supabase RPC problem, not something that can be fully repaired from these no-assets files alone.
- This no-assets package does NOT contain assets/repo-diver/game.js or the SQL function definition for repo_diver_record_photo, so the binder fix is included here, but the Repo Diver photo hotfix still needs either:
  1) the current Repo Diver asset JS files, or
  2) the live SQL/RPC function definition for repo_diver_record_photo.
