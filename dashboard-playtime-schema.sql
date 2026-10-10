-- Additive account activity storage. Does not modify wallets, cards or game saves.
CREATE TABLE IF NOT EXISTS dashboard_game_activity (
 username TEXT NOT NULL COLLATE NOCASE,
 game TEXT NOT NULL,
 played_ms INTEGER NOT NULL DEFAULT 0 CHECK(played_ms>=0),
 last_played INTEGER NOT NULL,
 PRIMARY KEY(username,game)
);
CREATE TABLE IF NOT EXISTS dashboard_play_sessions (
 username TEXT PRIMARY KEY COLLATE NOCASE,
 session_id TEXT NOT NULL,
 game TEXT NOT NULL,
 last_tick INTEGER NOT NULL,
 sequence INTEGER NOT NULL DEFAULT 0,
 active INTEGER NOT NULL DEFAULT 0 CHECK(active IN(0,1))
);
