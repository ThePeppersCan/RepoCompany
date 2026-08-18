REPO SPORTS — V22.16 QUIDDITCH BACKGROUND WATCH XP

- Active Repo Sports tab: 400 Agility XP/minute (unchanged).
- Repo Sports left open while another browser tab is selected: 200 Agility XP/minute.
- Closing Repo Sports stops watch XP.
- Uses a small Web Worker heartbeat so normal browser background timer throttling does not stop claims.
- Server stores the previous active/background state, so switching tabs cannot turn background seconds into full-rate seconds.
- Ten-second elapsed cap remains to prevent offline/sleep banking.
- Applies to current Repo Sports and Legacy Quidditch watch XP.

Files: index.html, script.js, supabase-v22.16-quidditch-background-watch-xp.sql
