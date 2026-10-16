-- Wibs activity is social information, never an achievement or reward source.
CREATE TABLE IF NOT EXISTS community_activity_preferences (
 user_id TEXT PRIMARY KEY,
 share_activity INTEGER NOT NULL DEFAULT 1 CHECK(share_activity IN(0,1)),
 external_enabled INTEGER NOT NULL DEFAULT 0 CHECK(external_enabled IN(0,1))
);
CREATE TABLE IF NOT EXISTS community_external_sessions (
 user_id TEXT PRIMARY KEY,
 session_id TEXT NOT NULL,
 game TEXT NOT NULL,
 title TEXT NOT NULL,
 started_at INTEGER NOT NULL,
 last_seen INTEGER NOT NULL,
 sequence INTEGER NOT NULL,
 running INTEGER NOT NULL CHECK(running IN(0,1))
);
CREATE TABLE IF NOT EXISTS community_external_activity (
 user_id TEXT NOT NULL,
 game TEXT NOT NULL,
 title TEXT NOT NULL,
 played_ms INTEGER NOT NULL DEFAULT 0 CHECK(played_ms>=0),
 last_played INTEGER NOT NULL,
 PRIMARY KEY(user_id,game)
);
CREATE INDEX IF NOT EXISTS community_external_recent ON community_external_activity(user_id,last_played DESC);
