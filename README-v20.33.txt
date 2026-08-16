REPO COMPANY V20.33 — TCG 167 CARD SYNC

Verified current unique cards: 167
- 156 obtainable from normal TCG packs
- 1 One Week Anniversary LTD card via its LTD pack
- 10 World Cup 2026 cards via World Cup event packs

Fixed:
- 9 Repo Sports Stars Full Art cards were present in CARD_CATALOG but missing from the server normal-pack pool. They are now obtainable.
- Secondary card lookup catalogue was stuck at 158 and now contains all 167.
- Public/my collection RPC totals now report 167 and merge World Cup cards into collection results.
- World Cup discovery capacity now follows the actually installed event card count instead of stale hard-coded 12.

The Supabase migration is already applied live.
