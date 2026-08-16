REPO COMPANY V20.32 — Endless Horde immediate wave payout fix

Apply index.html, style.css and script.js over V20.31.
The Supabase SQL is included for history only; the live database migration has already been applied.

Fixes:
- Every completed Horde wave queues its own payout before the wave number increments.
- Removes the normal-play 60k/hour throttle that caused payouts to trail several waves behind.
- Keeps duplicate/sequential protection plus a high emergency 250k/hour anti-abuse ceiling.
- Network/RPC failures retry automatically even if no later wave is completed.
- HUD displays PAYING… only while a completed wave is genuinely pending.
