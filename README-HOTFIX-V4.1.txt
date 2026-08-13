LEVEL HUNTER: VELMORA ANIMAL CENTRE — V4.1 WINDMILL ENTRY HOTFIX

Fixes the issue where the outdoor prompt could show:
  E · Enter Windmill
but pressing E was still consumed by an older Canto interaction handler.

Changes:
- Windmill entry now has a capture-phase keyboard bridge.
- The prompt and actual entry use the exact same availability condition.
- E or Enter now enters when the entry prompt is valid.
- The visible entry prompt is also clickable as a fallback.
- Added guarded error recovery so a failed interior open does not leave Canto frozen.

INSTALL
1. Replace your current script.js with this ZIP's script.js.
2. Keep/merge the existing assets folder from V4 (included again here for convenience).
3. Ctrl + Shift + R.

No index.html replacement.
No new SQL.
