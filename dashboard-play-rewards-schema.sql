-- Spendable play rewards are separate from visible activity and RepoScore.
CREATE TABLE IF NOT EXISTS dashboard_reward_config (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
INSERT OR IGNORE INTO dashboard_reward_config VALUES ('started_at',CAST(strftime('%s','now') AS INTEGER)*1000);
CREATE TABLE IF NOT EXISTS dashboard_reward_sessions (
 username TEXT PRIMARY KEY COLLATE NOCASE, session_id TEXT NOT NULL, game TEXT NOT NULL,
 last_tick INTEGER NOT NULL, sequence INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS dashboard_reward_days (
 user_id TEXT NOT NULL, day INTEGER NOT NULL, active_ms INTEGER NOT NULL DEFAULT 0 CHECK(active_ms BETWEEN 0 AND 21600000),
 PRIMARY KEY(user_id,day)
);
CREATE TABLE IF NOT EXISTS dashboard_reward_completions (
 receipt TEXT PRIMARY KEY, user_id TEXT NOT NULL, day INTEGER NOT NULL, game TEXT NOT NULL,
 run_id TEXT NOT NULL, points INTEGER NOT NULL CHECK(points BETWEEN 0 AND 450), created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS dashboard_reward_completion_user ON dashboard_reward_completions(user_id,day);
