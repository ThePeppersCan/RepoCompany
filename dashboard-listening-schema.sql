-- Current listening only: at most two small metadata rows per account.
-- Audio, image bytes, Spotify credentials and listening history are never stored here.
CREATE TABLE IF NOT EXISTS community_listening_preferences (
 user_id TEXT PRIMARY KEY,
 reparty INTEGER NOT NULL DEFAULT 0 CHECK(reparty IN(0,1)),
 spotify INTEGER NOT NULL DEFAULT 0 CHECK(spotify IN(0,1))
);
CREATE TABLE IF NOT EXISTS community_listening (
 user_id TEXT NOT NULL,
 source TEXT NOT NULL CHECK(source IN('reparty','spotify')),
 session_id TEXT NOT NULL,
 sequence INTEGER NOT NULL,
 track TEXT NOT NULL,
 sampled_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 PRIMARY KEY(user_id,source)
);
