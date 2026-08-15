REPO COMPANY — QUIDDITCH TCG PATCH CARD BINDER FIX

Cause fixed:
- Supabase was correctly awarding Patch cards.
- The current frontend CARD_CATALOG had regressed and no longer contained the 17 Patch IDs.
- Binder normalisation only accepts IDs present in CARD_CATALOG, so awarded Patch cards were silently hidden.

This update:
- restores all 17 Patch cards to the normal binder catalogue;
- restores their correct artwork paths;
- makes Patch pack reveals say PATCH CARD UNLOCKED;
- allows Patch cards to be used by Favourite Card / Watch Party display;
- keeps the existing World Cup / Quarter Final Draw changes in index.html;
- cache-busts script.js so browsers do not keep the broken catalogue.

Deploy:
1. Replace index.html
2. Replace script.js
3. Add/replace assets/quidditch-tcg/cards/patch/

NO SQL TO RUN. The live Supabase pack function already includes the 17 Patch IDs and rarity tier.
