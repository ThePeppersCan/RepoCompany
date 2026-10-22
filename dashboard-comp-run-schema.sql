-- Additive, account-owned personal bests; existing seasons and scores survive.
CREATE TABLE IF NOT EXISTS comp_run_sessions (
 id TEXT PRIMARY KEY, username TEXT NOT NULL COLLATE NOCASE,
 course TEXT NOT NULL, mode TEXT NOT NULL CHECK(mode IN ('normal','nightmare')),
 season TEXT NOT NULL, version TEXT NOT NULL, started_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL, time_ms INTEGER, submitted_at INTEGER
);
CREATE INDEX IF NOT EXISTS comp_run_session_owner ON comp_run_sessions(username,expires_at);
CREATE TABLE IF NOT EXISTS comp_run_records (
 username TEXT NOT NULL COLLATE NOCASE, course TEXT NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('normal','nightmare')), season TEXT NOT NULL,
 time_ms INTEGER NOT NULL CHECK(time_ms>0), achieved_at INTEGER NOT NULL,
 run_id TEXT NOT NULL UNIQUE,
 PRIMARY KEY(username,course,mode,season)
);
CREATE INDEX IF NOT EXISTS comp_run_board ON comp_run_records(course,mode,season,time_ms,achieved_at,username);
CREATE TABLE IF NOT EXISTS comp_run_rate (
 username TEXT PRIMARY KEY COLLATE NOCASE, minute INTEGER NOT NULL,count INTEGER NOT NULL
);
