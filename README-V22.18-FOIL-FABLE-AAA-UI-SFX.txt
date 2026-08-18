REPO COMPANY — V22.18 FOIL & FABLE AAA UI + SFX

Base: V22.17 Foil & Fable / Fable Vouchers

THIS UPDATE IS VISUAL / AUDIO ONLY
- Existing V22.17 Fable Voucher economy, global shop stock, slab selling rules and Supabase RPCs are unchanged.
- No new database migration is required for V22.18.
- The V22.17 SQL file is retained in the package for build history only; do not re-run it if V22.17 is already installed.

V22.18 UI OVERHAUL
- Removed the heavy cheap-brown / chunky-button presentation from Gregg's service hub.
- Rebuilt the hub around a premium obsidian / slate interface with restrained gold detailing.
- Cleaner spacing, typography, depth, hover states, borders and panel hierarchy.
- CRACKING SLABS / FABLE SHOP / SELL YOUR SLABS now read as three premium in-game service panels rather than web buttons.
- Reworked close/back/admin controls to match the new UI language.
- Responsive pass for smaller screens.

FABLE SHOP
- Rebuilt the five shared daily-card tiles with cleaner card presentation and much more breathing room.
- Premium rarity treatment without thick brown frames.
- Cleaner price, availability, sold-out and daily-limit states.
- Rebuilt shop status strip and confirmation window.
- High-rarity cards receive restrained premium edge/glow treatment rather than oversized borders.

SELL YOUR SLABS
- Rebuilt search/filter controls in the same premium UI language.
- Larger, cleaner slab rows/cards with clearer grade, rarity, certification and voucher offer hierarchy.
- Protected/non-sellable slabs remain visually distinct.
- Rebuilt permanent-sale confirmation window.

CRACKING SLABS
- Existing cracking mechanics are untouched.
- Added matching premium dark-panel styling to Gregg's cracking counter so it no longer clashes with the new hub/shop/sell screens.

FABLE VOUCHER ICON
- Uses the supplied red/cream pixel ticket artwork as the actual Fable Voucher icon.
- Replaces the old generated F-ticket symbol in balances, shop prices, sale offers and service artwork.
- Prepared transparent pixel-art asset:
  assets/foil-and-fable/fable-voucher-ticket.png

SOUND DESIGN
Added low-volume Foil & Fable-only UI sounds:
- menu-open.wav
- ui-hover.wav
- ui-click.wav
- item-select.wav
- confirm.wav
- purchase-success.wav
- sale-success.wav
- ui-error.wav

The sounds are intentionally short/subtle and only hook into Foil & Fable interactions. They do not replace the existing slab-crack workshop sound sequence.

INSTALL / MERGE
- Replace index.html and script.js with the V22.18 versions.
- Copy the included assets/foil-and-fable folder into the site's existing assets/foil-and-fable folder.
- Keep the rest of the site's existing assets in place.
