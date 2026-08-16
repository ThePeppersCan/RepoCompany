Repo Company — V20.13 TRUE HARMONY + CASTLE ATMOSPHERE
=========================================================

Apply over V20.12.

Replace:
- /script.js
- /style.css
- /index.html

Changes:
1. Harmony bar
   - The old HTML/CSS progress meter is removed.
   - It is now an SVG bar whose fill rectangle width is set directly from the
     real within-level Harmony percentage.
   - Legacy CSS cannot stretch this SVG rectangle to 100%, which addresses the
     persistent full-bar issue.

2. Homepage logo
   - Lowered a tiny amount again so the stone plaque sits closer to the nav.

3. Background atmosphere
   - Four subtle animated flame glows aligned to the side braziers.
   - Small rising ember particles around each fire.
   - Slow, sparse wind/snow-like motes drifting across the castle backdrop.
   - Effects sit behind the actual interface and are intentionally restrained.
   - Respects prefers-reduced-motion.

No image generation and no new art assets are required.
