-- Separate from presence: appearing offline does not make a profile private.
CREATE TABLE IF NOT EXISTS dashboard_profile_privacy (
 username TEXT PRIMARY KEY COLLATE NOCASE REFERENCES dashboard_players(username),
 private_profile INTEGER NOT NULL DEFAULT 0 CHECK(private_profile IN (0,1))
);
