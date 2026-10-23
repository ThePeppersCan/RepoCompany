-- A single replay per player's current PB, isolated by route and race rules.
-- Upload capabilities are returned only through the authenticated finish API.
CREATE TABLE IF NOT EXISTS comp_run_replays (
 username TEXT NOT NULL COLLATE NOCASE, course TEXT NOT NULL, mode TEXT NOT NULL,
 season TEXT NOT NULL, run_id TEXT NOT NULL UNIQUE, upload_token TEXT NOT NULL,
 frames TEXT, created_at INTEGER NOT NULL,
 PRIMARY KEY(username,course,mode,season)
);
