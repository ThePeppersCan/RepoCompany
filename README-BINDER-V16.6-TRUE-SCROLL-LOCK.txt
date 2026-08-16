Repo Company V18.1 — Binder V16.6 True Scroll Lock
===================================================

Built from V16.4, NOT V16.5.

Fix:
- removes the V16.5 fixed-position strategy entirely
- locks document/modal scrolling while the binder is open
- keeps Hidden Cards + paintbrush absolutely anchored to the binder stage
- Customise Binder menu retains its own independent internal scrollbar
- blocks scroll chaining at menu top/bottom

This addresses the movement caused by the transformed dialog + fixed-position
containing-block behaviour in Chromium.
