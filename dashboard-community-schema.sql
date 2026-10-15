-- Additive: private conversations and the voice allowance remain intact.
CREATE TABLE IF NOT EXISTS community_roles (
 user_id TEXT PRIMARY KEY, role TEXT NOT NULL CHECK(role='Developer'), granted_by TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS community_settings (
 id INTEGER PRIMARY KEY CHECK(id=1), title TEXT NOT NULL DEFAULT 'RE-COMP',
 banner_data TEXT, banner_type TEXT, banner_version TEXT,
 banner_height INTEGER NOT NULL DEFAULT 220, banner_zoom INTEGER NOT NULL DEFAULT 100,
 banner_x INTEGER NOT NULL DEFAULT 50, banner_y INTEGER NOT NULL DEFAULT 50
);
INSERT OR IGNORE INTO community_settings(id) VALUES(1);
CREATE TABLE IF NOT EXISTS community_channels (
 id TEXT PRIMARY KEY, name TEXT NOT NULL COLLATE NOCASE UNIQUE, description TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO community_channels(id,name,description,created_at) VALUES('general','general','A place for everyone in Repo Company.',0);
CREATE TABLE IF NOT EXISTS community_members (user_id TEXT PRIMARY KEY, joined_at INTEGER NOT NULL, last_seen INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS community_messages (
 id INTEGER PRIMARY KEY AUTOINCREMENT, channel_id TEXT NOT NULL REFERENCES community_channels(id),
 sender_id TEXT NOT NULL, sender_name TEXT NOT NULL, client_id TEXT NOT NULL, text TEXT NOT NULL,
 created_at INTEGER NOT NULL, UNIQUE(sender_id,client_id)
);
CREATE INDEX IF NOT EXISTS community_messages_channel ON community_messages(channel_id,id);
CREATE TABLE IF NOT EXISTS community_reactions (
 message_id INTEGER NOT NULL REFERENCES community_messages(id) ON DELETE CASCADE,
 user_id TEXT NOT NULL, emoji TEXT NOT NULL, PRIMARY KEY(message_id,user_id)
);
CREATE TABLE IF NOT EXISTS community_profiles (
 user_id TEXT PRIMARY KEY, banner_data TEXT, banner_type TEXT, banner_version TEXT,
 banner_height INTEGER NOT NULL DEFAULT 180, banner_zoom INTEGER NOT NULL DEFAULT 100,
 banner_x INTEGER NOT NULL DEFAULT 50, banner_y INTEGER NOT NULL DEFAULT 50
);
