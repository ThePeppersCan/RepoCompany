CREATE TABLE IF NOT EXISTS dashboard_avatars (
 username TEXT PRIMARY KEY COLLATE NOCASE,
 config TEXT NOT NULL CHECK(json_valid(config)),
 updated_at INTEGER NOT NULL,
 FOREIGN KEY(username) REFERENCES dashboard_players(username) ON DELETE CASCADE
);
