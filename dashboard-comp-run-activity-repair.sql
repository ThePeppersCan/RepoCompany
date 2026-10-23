-- Restore confirmed starts only. Do not invent duration for missed heartbeats.
INSERT INTO dashboard_game_activity(username,game,played_ms,last_played)
SELECT username,'comp-run',0,MAX(started_at) FROM comp_run_sessions WHERE started_at>0 GROUP BY username
ON CONFLICT(username,game) DO UPDATE SET last_played=MAX(dashboard_game_activity.last_played,excluded.last_played);
