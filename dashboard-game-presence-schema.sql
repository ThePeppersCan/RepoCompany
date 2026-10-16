-- Presence is separate from earned play time: an open, paused game is still open.
CREATE TABLE IF NOT EXISTS dashboard_game_presence (
 username TEXT PRIMARY KEY COLLATE NOCASE,
 session_id TEXT NOT NULL,
 game TEXT NOT NULL,
 started_at INTEGER NOT NULL,
 last_seen INTEGER NOT NULL,
 running INTEGER NOT NULL DEFAULT 1 CHECK(running IN(0,1))
);
