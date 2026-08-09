REPO SPORTS — WORLD CUP COSMETICS PATCH
========================================

WHAT THIS ADDS
- 16 World Cup watchcard backdrops in Party Pete's shop.
- Every World Cup backdrop costs exactly 2,000 GP.
- 16 matching World Cup supporter pet name tags in Gertrude's Pet Emporium.
- Team name tags use the existing permanent name-tag price of 50,000 GP.
- Team name tags can be bought, stored in the Bank, equipped/unequipped in Cosmetics,
  and are shown on pets during live Quidditch.
- The pet-name text has per-team safe-area positioning and responsive font sizing so
  names remain inside the open centre of each supplied tag instead of overlapping flags/decorations.
- The supplied 285x105 name-tag art keeps its original aspect ratio in-game.
- World Cup backdrop PNGs were converted to high-quality WebP only to reduce site weight;
  no layout or artwork was regenerated.

INSTALL
1. Drag the contents of this ZIP into the ROOT of the website and replace index.html/script.js.
2. Merge the included assets folders with the existing assets folders.
3. Run world-cup-cosmetics.sql ONCE in Supabase SQL Editor.

IMPORTANT
The SQL is required for real purchases. It updates the server-side allowed item lists and
makes only the new watchcard_wc_* backdrops cost 2,000 GP. Existing Party Pete backgrounds
stay 25,000 GP; existing special Gertrude prices are preserved (Dreamies 75K, Fyrmfire Royal 65K).

No Repo Combat, Quidditch Ground, Repoggle, World Cup lore, fixture, kit, or kit-music logic is changed.
