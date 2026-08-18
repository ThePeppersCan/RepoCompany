REPO COMPANY — V22.18.1 FOIL & FABLE LOAD HOTFIX

Base: V22.18 Foil & Fable AAA UI + SFX

Fix:
- Removes a self-triggering MutationObserver loop introduced in V22.18.
- The old observer rewrote Gregg's button innerHTML on every childList mutation; that rewrite created another childList mutation and could lock the homepage in an endless DOM loop.
- Gregg/voucher polish now runs idempotently and only reacts when relevant Foil & Fable UI nodes are inserted.
- Keeps the V22.18 visual redesign, supplied Fable Voucher ticket icon and all UI SFX.
- No Supabase/schema changes.

Deploy this over V22.18 and hard refresh.
