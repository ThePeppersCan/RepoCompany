REPO COMPANY — V22.15.3
VELMORA CROWN NEWSPAPER — TOP-LEFT WORLD CUP MENU POSITION FIX

Fix:
- The newspaper was incorrectly nested under the header Repo Sports World Cup tab.
- It now mounts directly under the floating WORLD CUP MENU button in the top-left scene (#repoWorldCupBarryNotice).
- Position follows the actual World Cup Menu button size/location on resize.
- The header Repo Sports button no longer controls the newspaper position.
- Existing newspaper billboard viewer and 50% music behaviour are unchanged.
- Billboard viewer z-index was raised so the floating World Cup button cannot sit above it.

No Supabase migration required.
