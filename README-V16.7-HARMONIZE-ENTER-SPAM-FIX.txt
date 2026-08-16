Repo Company V18.1 — V16.7 HARMONIZE Enter-Spam Fix
====================================================

URGENT exploit patch:
- Holding Enter while HARMONIZE is focused no longer repeatedly awards XP.
- Browser-generated keyboard click events are rejected.
- Enter/Space are handled explicitly and only the initial non-repeat keydown is accepted.
- Normal mouse clicks still work.
- A mouse click blurs HARMONIZE afterwards so Enter cannot latch onto the button.
- A short duplicate-activation guard prevents accidental double firing.
- Added type="button" to the HARMONIZE control.
- Cache-busted script.js in index.html.

This patch is based directly on V16.6 TRUE SCROLL LOCK.
