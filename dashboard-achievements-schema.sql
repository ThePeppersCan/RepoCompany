-- Additive achievement ledger. Existing balances, saves and inventories are untouched.
CREATE TABLE IF NOT EXISTS dashboard_achievement_players (
 username TEXT NOT NULL COLLATE NOCASE,
 game TEXT NOT NULL,
 started_at INTEGER NOT NULL,
 PRIMARY KEY(username,game)
);
CREATE TABLE IF NOT EXISTS dashboard_achievement_sessions (
 id TEXT PRIMARY KEY,
 username TEXT NOT NULL COLLATE NOCASE,
 game TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS dashboard_achievement_session_owner ON dashboard_achievement_sessions(username,game);
CREATE TABLE IF NOT EXISTS dashboard_achievement_rules (
 id TEXT PRIMARY KEY,
 game TEXT NOT NULL,
 metric TEXT NOT NULL,
 target INTEGER NOT NULL CHECK(target>0),
 score INTEGER NOT NULL CHECK(score>0)
);
CREATE TABLE IF NOT EXISTS dashboard_achievement_progress (
 username TEXT NOT NULL COLLATE NOCASE,
 achievement_id TEXT NOT NULL REFERENCES dashboard_achievement_rules(id),
 value INTEGER NOT NULL DEFAULT 0 CHECK(value>=0),
 updated_at INTEGER NOT NULL,
 PRIMARY KEY(username,achievement_id)
);
CREATE TABLE IF NOT EXISTS dashboard_achievement_unlocks (
 username TEXT NOT NULL COLLATE NOCASE,
 achievement_id TEXT NOT NULL REFERENCES dashboard_achievement_rules(id),
 score INTEGER NOT NULL CHECK(score>0),
 unlocked_at INTEGER NOT NULL,
 PRIMARY KEY(username,achievement_id)
);
CREATE INDEX IF NOT EXISTS dashboard_achievement_unlock_count ON dashboard_achievement_unlocks(achievement_id);
CREATE TABLE IF NOT EXISTS dashboard_achievement_rate (
 username TEXT PRIMARY KEY COLLATE NOCASE,
 minute INTEGER NOT NULL,
 count INTEGER NOT NULL
);
-- The unique ledger key makes retried/concurrent unlocks award exactly once.
CREATE TRIGGER IF NOT EXISTS dashboard_achievement_award
AFTER INSERT ON dashboard_achievement_unlocks
BEGIN
 UPDATE dashboard_players SET repo_score=repo_score+NEW.score WHERE username=NEW.username;
END;
