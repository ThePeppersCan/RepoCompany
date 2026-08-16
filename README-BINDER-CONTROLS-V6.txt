REPO COMPANY V18.1 — BINDER CONTROL VISIBILITY + CENTRING V6
============================================================

Fixes this pass:
- Front cover is forced to the true centre of the viewport again.
- Binder Style / Customise Binder control is pinned inside the bottom of the viewport and cannot fall below the screen.
- Hidden Cards artwork is restored robustly even if the storage manager has cloned/replaced its button.
- Hidden Cards artwork is positioned from the binder's real on-screen bounds and stays immediately to its right without moving the binder.
- Open binder reserves enough vertical room for the Binder Style plaque.
- V5 invisible click-to-turn edges and cross-spread card dragging are preserved.

Install:
1. Replace script.js.
2. Merge assets/quidditch-tcg-binder/ into the existing site assets.
3. No SQL changes are required.
