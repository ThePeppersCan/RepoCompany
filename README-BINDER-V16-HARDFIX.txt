Repo Company V18.1 — Binder Polish V16 HARD FIX
================================================

This fix is deliberately loaded as an independent script AFTER the entire
existing site, so it does not rely on the older V13/V14/V15 binder wrappers.

Actually applied in this full web2 build:
- Binder Style is physically moved out of the bottom collection plaque.
- The supplied multicolour paintbrush PNG is the actual Binder Style button.
- Hidden Cards is re-parented to the stable binder stage (not the changing page).
- Hidden Cards top is aligned to the open binder top edge.
- Holder position is frozen across page flips; transform/transition/animation
  are disabled on the holder so it cannot shake/jump during a turn.
- Binder Style is positioned beneath the Hidden Cards holder.
- First-click magical brush burst + soft WebAudio click is included.
- Right-click hide and restore actions get fly-to/from-Holder animations while
  handing persistence back to the existing binder handlers.
- Main script cache key bumped, and V16 hardfix has its own cache-busted script.

Files added/changed:
- index.html (loads V16 at the very end, cache-busts main script)
- binder-polish-v16-hardfix.js (standalone live hardfix)
- assets/quidditch-tcg-binder/binder-style-icon-v16.png (exact supplied brush)
- compatibility brush aliases: binder-style-icon-v14.png / binder-style-icon.png
- binder holder/open spread/pocket overlay/shuffle assets included in package

Validation:
- node --check script.js
- node --check binder-polish-v16-hardfix.js
- ZIP integrity test
- supplied brush SHA-256 checked against packaged V16 brush asset
