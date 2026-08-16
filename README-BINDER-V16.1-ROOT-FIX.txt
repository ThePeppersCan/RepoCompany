Repo Company V18.1 — Binder V16.1 ROOT FIX
===========================================

This build starts from the user's clean web2.zip. The crashing V16 hardfix is NOT included.

Root cause found:
- V13 directly referenced ensureBinderCustomisationUi outside the IIFE where that function lives.
- That throws a ReferenceError when script.js loads.
- Execution stops before V14/V15, which is why the paintbrush, holder alignment, anti-shake and card animations never appeared.

Applied directly to script.js:
- V13 fatal reference is guarded, allowing V14/V15 to execute.
- V14 side controls use transform-aware bounding rectangles for exact holder/binder alignment.
- Hidden Cards hover/focus/active transforms are disabled so it cannot jump during page flips.
- V14 exposes a tiny API for the V15 first-click/stabiliser reliability pass.
- V15 now calls that API correctly for first-click paintbrush FX and 1.56s page-turn stabilisation.
- Exact uploaded paintbrush copied to both binder-style-icon.png and binder-style-icon-v14.png.
- Main script cache-busted in index.html.
- No continuous requestAnimationFrame hardfix and no whole-page MutationObserver were added.

Paintbrush SHA-256:
121d3279b11b6fdd071a0e775bd00782de647a5546cddc6f596ce519fded8afd
Bundled V14 icon SHA-256:
121d3279b11b6fdd071a0e775bd00782de647a5546cddc6f596ce519fded8afd
