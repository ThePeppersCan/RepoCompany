LEVEL HUNTER · CANTO PREMIUM V4.2
WINDMILL VISIBILITY / FREEZE FIX

Root cause fixed:
The Windmill overlay existed and the game correctly switched into interior state, but its base CSS rule used an ID-scoped selector:
  #hunterMenuOverlay .hunter-windmill-overlay { display:none; opacity:0; }
while the active rule had lower CSS specificity:
  .hunter-windmill-overlay.is-active { display:block; opacity:1; }

The browser therefore kept the Windmill invisible. Canto movement had already been stopped and Darwin's interior dialogue could still appear above it, which looked exactly like the game had frozen outside.

V4.2 fixes this in three layers:
1. The active selector now has matching ID specificity.
2. Entry explicitly makes the overlay visible as a runtime fallback.
3. A final !important visibility guard protects against stale/older style rules.

INSTALL
1. Replace your existing script.js with this ZIP's script.js.
2. Keep/merge assets/level-hunter/ if not already installed.
3. Ctrl + Shift + R.

No SQL changes.
No index.html replacement.
