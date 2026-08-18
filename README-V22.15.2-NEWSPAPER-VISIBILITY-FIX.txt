REPO COMPANY — V22.15.2 VELMORA CROWN NEWSPAPER VISIBILITY FIX

Fixes:
- The Velmora Crown newspaper teaser already existed beneath the World Cup button but was clipped by the V20 dashboard header's overflow:hidden rule.
- Allows overflow only through the dashboard header stack needed by the newspaper teaser.
- Explicitly keeps the teaser visible/clickable above the homepage scene.
- Keeps the existing full newspaper billboard viewer and 50% newspaper music behavior unchanged.
- Re-busts index script/style cache keys.

Deployment:
Overlay index.html and assets/velmora-crown onto the current V22.15.1 build.
No Supabase changes are required.
