PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS dashboard_players (
 username TEXT PRIMARY KEY COLLATE NOCASE,
 user_id TEXT UNIQUE,
 display_name TEXT NOT NULL,
 bio TEXT NOT NULL DEFAULT '',
 invisible INTEGER NOT NULL DEFAULT 0 CHECK(invisible IN (0,1)),
 last_seen INTEGER NOT NULL DEFAULT 0,
 current_game TEXT NOT NULL DEFAULT '',
 repo_score INTEGER NOT NULL DEFAULT 0 CHECK(repo_score>=0)
);
CREATE TABLE IF NOT EXISTS dashboard_friendships (
 player_a TEXT NOT NULL COLLATE NOCASE,
 player_b TEXT NOT NULL COLLATE NOCASE,
 requester TEXT NOT NULL COLLATE NOCASE,
 status TEXT NOT NULL CHECK(status IN ('pending','accepted')),
 created_at INTEGER NOT NULL,
 PRIMARY KEY(player_a,player_b),
 CHECK(player_a < player_b)
);
CREATE TABLE IF NOT EXISTS dashboard_blocks (
 blocker TEXT NOT NULL COLLATE NOCASE,
 blocked TEXT NOT NULL COLLATE NOCASE,
 PRIMARY KEY(blocker,blocked), CHECK(blocker!=blocked)
);
CREATE TABLE IF NOT EXISTS dashboard_rate_limits (
 player TEXT PRIMARY KEY,
 window_start INTEGER NOT NULL,
 count INTEGER NOT NULL
);
