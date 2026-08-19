V22.24 — WORLD CUP FLAG CARD ASSET CORRECTION

Purpose
- Replaces ONLY the 16 standard Velmora World Cup flag full-art TCG card images with the supplied correctly named/associated images.
- Keeps all existing card IDs and country display names intact so ownership, binder placements, grading/slabs and saved collections continue to point at the same cards.
- Adds a cache-buster to these 16 image URLs and bumps script.js in index.html so browsers/CDN do not keep showing the old flag art.

Files changed
- index.html: script.js cache-buster only.
- script.js: cache-buster added to the 16 world-cup flag full-art image URLs in both card registries.
- assets/quidditch-tcg/cards/full-art/world-cup/*.png: all 16 replaced from the supplied world-cup.zip.

Important
- Repo Sports match engine / Repo Sports JS is NOT included or modified by this patch.
- World Cup Special Full Art cards are NOT modified.
- Source archive contained Marovarr.png; it is mapped to the existing canonical site card/path marovar.png so the card remains named Marovar in the website database/UI.
