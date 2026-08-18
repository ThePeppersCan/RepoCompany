REPO SPORTS — V22.10.1 TCG CARD COUNT CACHE FIX

Fix:
- V22.10 script already contains 193 current TCG catalogue entries.
- index.html was still requesting script.js with the old V22.09 cache-buster.
- Browsers/CDN could therefore keep serving the older 167-card frontend catalogue.
- Updated the script/style cache keys to V22.10.1 so the new catalogue is forced to load.

Expected binder total after deployment: 193 current cards.
No additional Supabase migration is required for this hotfix.
