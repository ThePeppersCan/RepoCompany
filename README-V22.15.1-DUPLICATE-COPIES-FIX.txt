REPO SPORTS — V22.15.1 TCG DUPLICATE COPIES FIX

Root cause fixed:
- get_my_quidditch_tcg_collection() used SELECT DISTINCT, which destroyed physical duplicate counts before the frontend ever received them.
- The binder also republished the displayed collection through a unique-card normaliser, so Bulk Box could never see duplicates.
- RCG submission grouped fresh duplicate copies into one visual tile.

Changes:
- Private collection RPC now preserves repeated normal TCG card IDs.
- World Cup event cards are still merged once only.
- Public binders remain unique-card views.
- Bulk Box reads the authoritative physical-copy collection and shows spare copies.
- Binder itself still shows one visual slot per unique card.
- RCG grading now renders one selectable tile per physical fresh raw copy (COPY 1/2, COPY 2/2, etc.).
- Submitting one duplicate removes exactly one raw copy; remaining copies stay visible.
- Current Velmora Crown newspaper index/assets are retained.

The Supabase migration in this patch has already been applied live.
