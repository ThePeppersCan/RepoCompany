Repo Company V18.1 — V17.1 Binder Crash Hotfix
================================================

This rebuild starts from V16.6 TRUE SCROLL LOCK, not V17.0.

Why V17.0 crashed:
- V16.9 continuously re-parented the Hidden Cards / paintbrush into the binder stage.
- V17.0 continuously re-parented those same nodes into a new overlay.
- Their observers/timers fought each other indefinitely and could lock/crash the page.

V17.1:
- removes that entire observer/interval approach by rebuilding from V16.6.
- disables the three older competing position engines (V13, V14, V16.2).
- installs one simple side-control position owner.
- no MutationObserver.
- no permanent setInterval.
- no mousemove/pointermove/scroll/wheel positioning.
- keeps the lower approved Hidden Cards position.
- paintbrush remains hidden while binder is closed.
- preserves luxury menu + V16.6 scroll behaviour.
- preserves the Harmony Enter-key exploit patch.
- World Cup Passport first 8 tickets remain a backend Supabase fix.
