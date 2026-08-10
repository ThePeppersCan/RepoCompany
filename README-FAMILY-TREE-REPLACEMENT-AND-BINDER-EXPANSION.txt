REPO SPORTS WORLD CUP — FAMILY TREE + FULL ART BINDER EXPANSION PATCH

This patch does three things:
1) Replaces the Meet the Teams / Player Family Trees lore image with the new updated version.
2) Adds the supplied 9 new full-art cards into the Quidditch TCG binder catalog.
3) Expands the binder page count automatically based on total catalog size, so extra pages appear as more cards are added.

Files included:
- index.html
  Adds the Meet the Teams button under World Cup History (if not already present in your current base) and points it to the updated family tree image.
- script.js
  Registers the 9 new full-art cards and changes the binder to auto-expand beyond the previous 8 spreads.
- assets/repo-sports-world-cup-meet-teams-button.png
- assets/repo-sports-world-cup-family-trees.png
- assets/quidditch-tcg/cards/full-art/repo-sports-stars/*.png

New full-art cards added:
- Vardesh: Pipsqueak
- Norveth: ROCKY
- Talune: Soup
- Iskandar: Besquelcher
- Sorevia: Debbie
- Drazhen: Dopey Dom
- Belros: JUD
- Nambara: Mad Rager
- Belros: Nimbler 2000

How to apply:
1) Replace your current index.html with the patched one.
2) Replace your current script.js with the patched one.
3) Merge the included assets folder into your website assets folder.
4) Republish / redeploy the site.

Notes:
- The binder now calculates the spread count automatically from the live card catalog, with a minimum of 8 spreads preserved.
- If your current live site already has the Meet the Teams button, this patch safely updates the artwork path and keeps the same open-lore behaviour.
